import models, database, signal_engine
from datetime import date

db = database.SessionLocal()

try:
    print("Getting hospital...")
    hospital = db.query(models.Hospital).first()
    if not hospital:
        print("No hospital found, creating one.")
        z = models.Zone(name="DebugZone")
        db.add(z)
        db.commit()
        hospital = models.Hospital(name="DebugHosp", zone_id=z.id)
        db.add(hospital)
        db.commit()
    
    print(f"Hospital ID: {hospital.id}, Zone ID: {hospital.zone_id}")
    
    target_date = date(2023, 11, 1)
    print(f"Running detection for {target_date}...")
    
    signal_engine.detect_signals_for_hospital(db, hospital, target_date)
    print("Success! Checking assignments...")
    
    signals = db.query(models.Signal).all()
    for s in signals:
        print(f"Signal ID: {s.id}, Type: {s.signal_type}, Assignee: {s.assigned_to}, SLA: {s.sla_deadline}")

except Exception as e:
    print("FAILED with error:")
    import traceback
    traceback.print_exc()
finally:
    db.close()
