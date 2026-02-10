import models, database, signal_engine
from datetime import date, timedelta
import random

db = database.SessionLocal()

try:
    print("--- Multi-Disease Test ---")
    
    # 1. Setup Dates
    today = date.today()
    spike_date = today - timedelta(days=1)
    
    # 2. Add Baseline Data for "Diarrhea" (if not enough)
    # The seed script added some, but let's ensure we have distinct data to trigger "Discovery"
    h1 = db.query(models.Hospital).first()
    
    # 3. Insert specific Spike for Diarrhea
    print(f"Injecting Diarrhea spike for {spike_date}...")
    v_spike = models.VisitEvent(
        date=spike_date, 
        hospital_id=h1.id, 
        syndrome="Diarrhea", 
        count=40, # High number to trigger surge
        age_group="5-15"
    )
    db.add(v_spike)
    db.commit()
    
    # 4. Trigger Detection
    print("Running Signal Engine...")
    signal_engine.detect_signals_for_hospital(db, h1, spike_date)
    
    # 5. Verify
    signals = db.query(models.Signal).filter(models.Signal.date == spike_date).all()
    print(f"Signals Found: {len(signals)}")
    for s in signals:
        print(f" >> [{s.severity}] {s.signal_type}: {s.syndrome} (Val: {s.value}, Base: {s.baseline})")

    # Check if Diarrhea is there
    diarrhea_signal = next((s for s in signals if s.syndrome == "Diarrhea"), None)
    if diarrhea_signal:
        print("SUCCESS: Diarrhea signal detected dynamically!")
    else:
        print("FAILURE: Diarrhea signal NOT detected.")

except Exception as e:
    print("Error:", e)
    import traceback
    traceback.print_exc()
finally:
    db.close()
