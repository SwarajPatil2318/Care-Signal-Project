import models, database, signal_engine
from datetime import date, timedelta

db = database.SessionLocal()

try:
    print("--- New Disease ('Neurological') Test ---")
    
    today = date.today()
    spike_date = today - timedelta(days=1)
    
    h1 = db.query(models.Hospital).first()
    
    # Inject a syndrome that might not have a specific threshold config
    # To prove the "Default" logic works
    syndrome_name = "Neurological" 
    
    print(f"Injecting {syndrome_name} spike for {spike_date}...")
    
    # 1. Add some baseline (to ensure it's not ignored as 0/0)
    # Actually, if baseline is 0, effective baseline is MIN_BASELINE (10).
    # So we need > 15 cases (1.5x) to trigger.
    
    v_spike = models.VisitEvent(
        date=spike_date, 
        hospital_id=h1.id, 
        syndrome=syndrome_name, 
        count=25, # 25 > 15 (1.5 * 10), should trigger
        age_group="60+"
    )
    db.add(v_spike)
    db.commit()
    
    # 2. Trigger Detection
    print("Running Signal Engine...")
    signal_engine.detect_signals_for_hospital(db, h1, spike_date)
    
    # 3. Check for the signal
    signals = db.query(models.Signal).filter(models.Signal.date == spike_date).filter(models.Signal.syndrome == syndrome_name).all()
    
    if len(signals) > 0:
        s = signals[0]
        print(f"SUCCESS: Detected '{s.syndrome}'!")
        print(f" - Value: {s.value}")
        print(f" - Baseline: {s.baseline}")
        print(f" - Severity: {s.severity}")
    else:
        print(f"FAILURE: '{syndrome_name}' was NOT detected.")
        print("Debug Info:")
        # Check if query found it
        ev = db.query(models.VisitEvent).filter(models.VisitEvent.syndrome == syndrome_name).all()
        print(f" - Visit Events in DB: {len(ev)}")

except Exception as e:
    print("Error:", e)
    import traceback
    traceback.print_exc()
finally:
    db.close()
