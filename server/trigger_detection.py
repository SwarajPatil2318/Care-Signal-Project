import models, database, signal_engine
from datetime import date, timedelta

db = database.SessionLocal()

try:
    print("Connecting to DB...")
    # Get the hospital ID 1 (District Hospital A)
    hospital = db.query(models.Hospital).filter(models.Hospital.id == 1).first()
    if not hospital:
        print("Hospital ID 1 not found. Did you run seed.py?")
        exit(1)
        
    # The seed script creates a spike for YESTERDAY
    today = date.today()
    target_date = today - timedelta(days=1)
    
    print(f"Triggering Detection for Date: {target_date}")
    
    signal_engine.detect_signals_for_hospital(db, hospital, target_date)
    
    # Verify results
    count = db.query(models.Signal).count()
    print(f"Success! Total Signals in DB now: {count}")
    
    signals = db.query(models.Signal).all()
    for s in signals:
        print(f" - Signal: {s.signal_type} ({s.syndrome}) | Severity: {s.severity}")

except Exception as e:
    print("Error:", e)
    import traceback
    traceback.print_exc()
finally:
    db.close()
