from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta, datetime
from typing import List, Tuple
import models

# Params
BASELINE_DAYS = 14
MIN_BASELINE = 10

# Default Thresholds (Ratio relative to baseline)
DEFAULT_THRESHOLD = 1.5
CRITICAL_THRESHOLD_FACTOR = 2.0

# Disease-Specific Sensitivity (Lower = More Sensitive)
SYNDROME_THRESHOLDS = {
    "Fever": 1.5,
    "Diarrhea": 1.5,
    "Cholera": 1.0, # Zero tolerance / very sensitive
    "Respiratory Issue": 1.5,
    "Rash": 1.2
}

def get_threshold(syndrome: str) -> float:
    return SYNDROME_THRESHOLDS.get(syndrome, DEFAULT_THRESHOLD)

def detect_signals_for_hospital(db: Session, hospital: models.Hospital, target_date: date):
    """
    Orchestrator for signal detection.
    Checks for:
    1. Disease Surges (Per Syndrome)
    2. OPD Load Surges (Total Visits)
    """
    zone_id = hospital.zone_id
    if not zone_id: return

    valid_syndromes = []
    
    # Dynamic Discovery: Look for syndromes reported TODAY in this zone
    # This ensures new diseases appear automatically without code changes
    reported_syndromes = db.query(models.VisitEvent.syndrome)\
        .join(models.Hospital)\
        .filter(models.Hospital.zone_id == zone_id)\
        .filter(models.VisitEvent.date == target_date)\
        .distinct().all()
        
    # Flatten list [('Fever',), ('Diarrhea',)] -> ['Fever', 'Diarrhea']
    for r in reported_syndromes:
        if r.syndrome:
             check_disease_surge(db, zone_id, target_date, r.syndrome)

    # 2. Check OPD Load (Aggregate of all syndromes)
    check_opd_load(db, zone_id, target_date)

def check_disease_surge(db: Session, zone_id: int, target_date: date, syndrome: str):
    """
    Detects if a specific disease is spiking in values.
    """
    # Get Today's Count
    current_val = get_zone_aggregate(db, zone_id, target_date, syndrome)
    
    # Get Baseline (Rolling Average)
    baseline = calculate_baseline(db, zone_id, target_date, syndrome)
    
    # Threshold Logic
    effective_baseline = max(baseline, MIN_BASELINE)
    
    threshold = get_threshold(syndrome)
    is_spike = current_val > (effective_baseline * threshold)
    
    if is_spike:
        severity, confidence = evaluate_metrics(current_val, effective_baseline, threshold)
        explanation = f"{syndrome} cases ({current_val}) are {int((current_val/effective_baseline)*100)}% of 14-day baseline ({int(baseline)})."
        
        save_signal(db, zone_id, target_date, syndrome, current_val, int(baseline), 
                   "Disease Surge", severity, confidence, explanation)

def check_opd_load(db: Session, zone_id: int, target_date: date):
    """
    Detects if total facility visits are abnormally high.
    """
    current_val = get_zone_aggregate(db, zone_id, target_date, syndrome=None) # None = All
    baseline = calculate_baseline(db, zone_id, target_date, syndrome=None)
    
    effective_baseline = max(baseline, MIN_BASELINE * 2) # Higher threshold for total load
    
    # For total load, we use standard threshold
    is_spike = current_val > (effective_baseline * DEFAULT_THRESHOLD)
    
    if is_spike:
        severity, confidence = evaluate_metrics(current_val, effective_baseline, DEFAULT_THRESHOLD)
        explanation = f"Total OPD load ({current_val}) surged above baseline ({int(baseline)})."
        
        save_signal(db, zone_id, target_date, "ALL", current_val, int(baseline), 
                   "OPD Load Increase", severity, confidence, explanation)


# --- Helpers ---

def get_zone_aggregate(db: Session, zone_id: int, target_date: date, syndrome: str = None) -> int:
    query = db.query(func.sum(models.VisitEvent.count))\
            .join(models.Hospital)\
            .filter(models.Hospital.zone_id == zone_id)\
            .filter(models.VisitEvent.date == target_date)
            
    if syndrome:
        query = query.filter(models.VisitEvent.syndrome == syndrome)
        
    return query.scalar() or 0

def calculate_baseline(db: Session, zone_id: int, target_date: date, syndrome: str = None) -> float:
    start_date = target_date - timedelta(days=BASELINE_DAYS)
    
    query = db.query(func.sum(models.VisitEvent.count))\
            .join(models.Hospital)\
            .filter(models.Hospital.zone_id == zone_id)\
            .filter(models.VisitEvent.date >= start_date)\
            .filter(models.VisitEvent.date < target_date)
            
    if syndrome:
        query = query.filter(models.VisitEvent.syndrome == syndrome)
        
    total = query.scalar() or 0
    return total / float(BASELINE_DAYS)

def evaluate_metrics(current: int, baseline: float, threshold: float = 1.5) -> Tuple[str, str]:
    # Severity
    ratio = current / baseline
    
    # Severity relative to expectation
    if ratio > (threshold * 2): # e.g. 3x baseline vs 1.5x threshold
        severity = "High"
    elif ratio > threshold:
        severity = "Medium"
    else:
        severity = "Low"
        
    # Confidence (Based on Volume)
    # If we are flagging a spike from 2 to 4, that's low confidence.
    # If 200 to 400, high confidence.
    if baseline > 50:
        confidence = "High"
    elif baseline > 20:
        confidence = "Medium"
    else:
        confidence = "Low"
        
    return severity, confidence

def save_signal(db: Session, zone_id: int, date: date, syndrome: str, value: int, baseline: int, 
               s_type: str, severity: str, confidence: str, explanation: str):
    
    # Check if exists
    signal = db.query(models.Signal)\
            .filter(models.Signal.zone_id == zone_id)\
            .filter(models.Signal.date == date)\
            .filter(models.Signal.syndrome == syndrome)\
            .filter(models.Signal.signal_type == s_type)\
            .first()

    if signal:
        signal.value = value
        signal.is_spike = True
        signal.baseline = baseline
        signal.signal_type = s_type
        signal.severity = severity
        signal.confidence = confidence
        signal.explanation = explanation
        
        # Only re-open if the data has CHANGED.
        if signal.value != value and signal.status == "Resolved":
            signal.status = "Pending"
    else:
        # Calculate Accountability
        assigned_to, sla_hours = get_assignment_rules(severity)
        sla_deadline = datetime.now() + timedelta(hours=sla_hours)

        signal = models.Signal(
            date=date,
            zone_id=zone_id,
            syndrome=syndrome,
            is_spike=True,
            value=value,
            baseline=baseline,
            signal_type=s_type,
            severity=severity,
            confidence=confidence,
            explanation=explanation,
            status="Pending",
            assigned_to=assigned_to,
            sla_deadline=sla_deadline
        )
        db.add(signal)
    
    db.commit()

def get_assignment_rules(severity: str) -> Tuple[str, int]:
    """Returns (Role, SLA_Hours)"""
    if severity == "High":
        return "District Health Officer", 24
    elif severity == "Medium":
        return "Medical Officer", 48
    else:
        return "Surveillance Nurse", 72
