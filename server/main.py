from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, timedelta

import models, schemas, database

# Create tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="CareSignal API", description="District-level healthcare early warning system")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "CareSignal Backend Operational v2"}

import signal_engine

# --- Ingestion ---

@app.get("/zones", response_model=List[schemas.Zone])
def get_zones(db: Session = Depends(get_db)):
    """Get all zones."""
    return db.query(models.Zone).all()

@app.post("/ingest/batch", status_code=status.HTTP_201_CREATED)
def ingest_batch_visits(batch: schemas.BatchVisitCreate, db: Session = Depends(get_db)):
    """Accepts a batch of offline visits from a hospital."""
    
    hospital = db.query(models.Hospital).filter(models.Hospital.id == batch.hospital_id).first()
    if not hospital:
        # Auto-create for MVP demo if not exists? No, better to error or seed.
        # Let's error to be strict like a real system
        raise HTTPException(status_code=404, detail="Hospital ID not found")
    
    created_count = 0
    for v in batch.visits:
        db_visit = models.VisitEvent(
            date=v.date,
            syndrome=v.syndrome,
            count=v.count,
            age_group=v.age_group,
            hospital_id=batch.hospital_id
        )
        db.add(db_visit)
        created_count += 1
    
    db.commit()
    
    # Trigger Signal Detection (Sync for MVP, Async in Prod)
    signal_engine.detect_signals_for_hospital(db, hospital, batch.visits[0].date if batch.visits else date.today())
    
    return {"status": "success", "inserted": created_count}

# --- Dashboard & Actions ---

@app.get("/signals", response_model=List[schemas.Signal])
def get_signals(spike_only: bool = False, db: Session = Depends(get_db)):
    """Get all signals, optionally filtered by 'is_spike'."""
    q = db.query(models.Signal)
    if spike_only:
        q = q.filter(models.Signal.is_spike == True)
    return q.order_by(models.Signal.date.desc()).all()

@app.post("/signals/{signal_id}/action", response_model=schemas.Action)
def log_action(signal_id: int, action: schemas.ActionCreate, db: Session = Depends(get_db)):
    """DHO logs an action on a signal."""
    db_signal = db.query(models.Signal).filter(models.Signal.id == signal_id).first()
    if not db_signal:
        raise HTTPException(status_code=404, detail="Signal not found")
        
    db_action = models.Action(
        signal_id=signal_id,
        status=action.status,
        notes=action.notes
    )
    db.add(db_action)
    
    # UPDATE SIGNAL STATUS
    db_signal.status = action.status
    
    db.commit()
    db.refresh(db_action)
    return db_action

@app.get("/signals/{signal_id}/history")
def get_signal_history(signal_id: int, days: int = 14, db: Session = Depends(get_db)):
    """Fetch 14-day aggregate history for the syndrome/zone associated with this signal."""
    signal = db.query(models.Signal).filter(models.Signal.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
        
    start_date = signal.date - timedelta(days=days)
    end_date = signal.date
    
    # Query daily aggregates for this zone + syndrome
    history = []
    
    # We want to fill missing dates with 0, so we iterate
    current = start_date
    while current <= end_date:
        count = db.query(func.sum(models.VisitEvent.count))\
            .join(models.Hospital)\
            .filter(models.Hospital.zone_id == signal.zone_id)\
            .filter(models.VisitEvent.date == current)
            
        if signal.syndrome != "ALL":
             count = count.filter(models.VisitEvent.syndrome == signal.syndrome)
             
        val = count.scalar() or 0
        history.append({"date": current, "count": val})
        current += timedelta(days=1)
        
    return history

@app.get("/signals/{signal_id}/breakdown")
def get_signal_breakdown(signal_id: int, db: Session = Depends(get_db)):
    """
    Returns the contributing factors (Hospitals) for a signal.
    """
    signal = db.query(models.Signal).filter(models.Signal.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")

    # contributing hospitals
    # For this zone, date, syndrome, get counts per hospital
    q = db.query(models.Hospital.name, func.sum(models.VisitEvent.count))\
        .join(models.VisitEvent)\
        .filter(models.VisitEvent.date == signal.date)\
        .filter(models.Hospital.zone_id == signal.zone_id)\
        .group_by(models.Hospital.name)
        
    if signal.syndrome != "ALL":
        q = q.filter(models.VisitEvent.syndrome == signal.syndrome)
        
    results = q.all() # [(HospA, 20), (HospB, 5)]
    
    # Format nicely
    breakdown = [{"hospital": r[0], "count": r[1]} for r in results]
    # Sort by count desc
    breakdown.sort(key=lambda x: x['count'], reverse=True)
    
    return {
        "breakdown": breakdown,
        "summary": _generate_plain_language_summary(signal, breakdown)
    }

def _generate_plain_language_summary(signal, breakdown):
    hosp_name = breakdown[0]['hospital'] if breakdown else "Unknown"
    hosp_count = breakdown[0]['count'] if breakdown else 0
    percent_contribution = int((hosp_count / signal.value) * 100) if signal.value > 0 else 0
    
    txt = f"The system detected a {signal.value} case surge in {signal.syndrome}. "
    txt += f"This is primarily driven by {hosp_name}, which reported {hosp_count} cases ({percent_contribution}% of total). "
    
    if signal.baseline < 1:
        txt += "This is highly unusual as we rarely see cases in this zone."
    else:
        multiplier = int(signal.value / signal.baseline) if signal.baseline > 0 else 0
        txt += f"This represents a {multiplier}x increase over the 14-day average."
        
    return txt

# --- Legacy Helper for Frontend (Redirect to Batch or support legacy) ---
# To keep frontend working without rewrite, let's shim the old endpoint
@app.post("/facilities/{facility_id}/report")
def legacy_report(facility_id: int, report: schemas.VisitEventCreate, db: Session = Depends(get_db)):
    """Shim for the frontend implementation we just built."""
    # Convert single report to batch
    batch = schemas.BatchVisitCreate(
        hospital_id=facility_id,
        visits=[report]
    )
    return ingest_batch_visits(batch, db)

# --- Forecasting ---
import forecasting

@app.get("/analysis/summary")
def get_analysis_summary(db: Session = Depends(get_db)):
    """
    Returns disease-specific predictive insights.
    """
    zones = db.query(models.Zone).all()
    today = date.today()
    start_date = today - timedelta(days=30)
    
    # 1. Fetch all recent data with Zone info
    # Tuple: (VisitEvent, zone_id)
    results = db.query(models.VisitEvent, models.Hospital.zone_id)\
                .join(models.Hospital)\
                .filter(models.VisitEvent.date >= start_date)\
                .all()
    
    # Organize by Zone -> Disease -> List of (date, count)
    data_map = {} # { zone_id: { disease: { date: count } } }
    
    for e, z_id in results:
        if z_id not in data_map: data_map[z_id] = {}
        if e.syndrome not in data_map[z_id]: data_map[z_id][e.syndrome] = {}
        
        # Accumulate counts
        data_map[z_id][e.syndrome][e.date] = data_map[z_id][e.syndrome].get(e.date, 0) + e.count

    high_risk_diseases = {} # { "Cholera": 5, "Dengue": 2 }
    high_risk_zone_ids = set()
    trends = []
    
    # 2. Analyze
    for z in zones:
        z_data = data_map.get(z.id, {})
        
        for disease, dates_map in z_data.items():
            # Convert to list sorted by date
            sorted_dates = sorted(dates_map.items())
            counts = [val for _, val in sorted_dates]
            
            # Need at least a few points
            if len(counts) < 3:
                continue
                
            # Forecast
            f = forecasting.Forecaster()
            f.fit(counts)
            preds = f.predict(days=7)
            
            # Avg Future vs Avg History
            avg_pred = sum([p['value'] for p in preds]) / len(preds)
            avg_hist = sum(counts) / len(counts) if counts else 1
            
            trends.append(forecasting.explain_trend(f.trend, f.level))
            
            # Risk Threshold
            if avg_pred > avg_hist * 1.5 and avg_pred > 5: # Lowered threshold for demo sensitivity
                high_risk_diseases[disease] = high_risk_diseases.get(disease, 0) + 1
                high_risk_zone_ids.add(z.id)
            
    # Determine Dominant Trend
    from collections import Counter
    trend_counts = Counter(trends)
    dominant_trend = trend_counts.most_common(1)[0][0] if trends else "Stable"
    
    return {
        "high_risk_diseases": high_risk_diseases,
        "total_high_risk_zones": len(high_risk_zone_ids),
        "dominant_trend": "Increasing" if "Increasing" in dominant_trend else "Stable",
        "detailed_trend": dominant_trend,
        "reliability_score": "High" if len(zones) > 0 else "Low"
    }
@app.get("/zones/{zone_id}/forecast", response_model=List[schemas.DiseaseForecast])
def get_zone_forecast(zone_id: int, days: int = 7, syndrome: str = None, db: Session = Depends(get_db)):
    """
    Get 7-day forecast for a zone.
    Returns a list of forecasts, one per active disease (or specific disease if requested).
    """
    today = date.today()
    start_date = today - timedelta(days=30)
    
    # 1. Determine Syndromes to Forecast
    target_syndromes = []
    if syndrome and syndrome != "ALL":
        target_syndromes = [syndrome]
    else:
        # Fetch distinct syndromes active in the last 30 days in this zone
        results = db.query(models.VisitEvent.syndrome).distinct()\
            .join(models.Hospital)\
            .filter(models.Hospital.zone_id == zone_id)\
            .filter(models.VisitEvent.date >= start_date)\
            .all()
        target_syndromes = [r[0] for r in results]

    # If no data found, return empty
    if not target_syndromes:
        return []

    forecasts_list = []
    
    import spatial_config
    neighbors = spatial_config.get_neighbors(zone_id)

    for s_name in target_syndromes:
        # 2. Fetch History per Syndrome
        query = db.query(models.VisitEvent.date, func.sum(models.VisitEvent.count))\
                .join(models.Hospital)\
                .filter(models.Hospital.zone_id == zone_id)\
                .filter(models.VisitEvent.date >= start_date)\
                .filter(models.VisitEvent.syndrome == s_name)
                
        results = query.group_by(models.VisitEvent.date).order_by(models.VisitEvent.date).all()
        data_map = {r[0]: r[1] for r in results}
        
        history_values = []
        history_points = []
        
        current = start_date
        max_hist_val = 0
        
        while current <= today:
            val = data_map.get(current, 0)
            history_values.append(val)
            if val > max_hist_val: max_hist_val = val
            
            history_points.append(schemas.ForecastPoint(
                date=current, value=float(val), lower_bound=float(val), upper_bound=float(val)
            ))
            current += timedelta(days=1)
            
        # 3. Run Forecast
        f = forecasting.Forecaster()
        f.fit(history_values)
        raw_preds = f.predict(days=days)
        
        forecast_points = []
        avg_predicted = 0
        if raw_preds:
            for p in raw_preds:
                p_date = today + timedelta(days=p['day'])
                forecast_points.append(schemas.ForecastPoint(
                    date=p_date,
                    value=p['value'],
                    lower_bound=p['lower_bound'],
                    upper_bound=p['upper_bound']
                ))
            avg_predicted = sum([p['value'] for p in raw_preds]) / len(raw_preds)

        # 4. Assess Spatial Risk (Per Disease)
        spatial_risk_level = "Low"
        spatial_reason = None
        
        if neighbors:
            cutoff = today - timedelta(days=3)
            # Check neighbors for THIS syndrome
            neighbor_signals = db.query(models.Signal)\
                .filter(models.Signal.zone_id.in_(neighbors))\
                .filter(models.Signal.date >= cutoff)\
                .filter(models.Signal.syndrome == s_name)\
                .all()
                
            for s in neighbor_signals:
                if s.severity == "High":
                    spatial_risk_level = "High"
                    spatial_reason = f"High severity {s_name} surge in neighboring Zone {s.zone_id}"
                    break
                elif s.severity == "Medium" and spatial_risk_level == "Low":
                    spatial_risk_level = "Medium"
                    spatial_reason = f"{s_name} surge in neighboring Zone {s.zone_id}"

        # 5. Final Metrics
        baseline = sum(history_values[-14:]) / 14 if len(history_values) >= 14 else 0
        risk_level = forecasting.assess_risk(avg_predicted, baseline, spatial_risk_level)
        intensity = forecasting.calculate_intensity(raw_preds[0]['value'] if raw_preds else 0, max_hist_val)
        
        trend_desc = forecasting.explain_trend(f.trend, f.level)
        guidance = forecasting.generate_operational_guidance(
            raw_preds[0]['value'] if raw_preds else 0, 
            risk_level, 
            trend_desc
        )

        forecasts_list.append(schemas.DiseaseForecast(
            disease=s_name,
            risk_level=risk_level,
            risk_reason=spatial_reason if spatial_reason else f"Based on {s_name} trends",
            intensity=intensity,
            trend=trend_desc.split(' (')[0], # Just the short text
            history=history_points,
            forecast=forecast_points,
            guidance=guidance
        ))
        
    return forecasts_list
