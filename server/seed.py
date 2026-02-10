import models, database
from datetime import date, timedelta
import random

db = database.SessionLocal()

def seed():
    # 1. Clear Data (Optional, be careful in prod)
    # db.query(models.VisitEvent).delete()
    # db.query(models.Signal).delete()
    # db.query(models.Hospital).delete()
    # db.query(models.Zone).delete()
    # db.commit()

    print("Seeding Zones...")
    z1 = models.Zone(name="North Ward")
    z2 = models.Zone(name="South Ward")
    db.add_all([z1, z2])
    db.commit()

    print("Seeding Hospitals...")
    h1 = models.Hospital(name="District Hospital A", type="Hospital", zone_id=z1.id)
    h2 = models.Hospital(name="Community Health Center B", type="CHC", zone_id=z1.id)
    h3 = models.Hospital(name="Primary Health Center C", type="PHC", zone_id=z2.id)
    h4 = models.Hospital(name="Private Clinic D", type="Clinic", zone_id=z2.id)
    db.add_all([h1, h2, h3, h4])
    db.commit()
    
    # Refresh to get IDs
    db.refresh(h1)

    print("Seeding Historical Data (Baseline)...")
    # Generate 14 days of baseline data (low numbers)
    today = date.today()
    syndromes = ["Fever", "Respiratory Issue", "Diarrhea"]
    
    for i in range(14, 0, -1):
        d = today - timedelta(days=i)
        for h in [h1, h2, h3, h4]:
            for s in syndromes:
                # Random count 0-5
                count = random.randint(0, 5)
                v = models.VisitEvent(
                    date=d,
                    hospital_id=h.id,
                    syndrome=s,
                    count=count,
                    age_group="16-50"
                )
                db.add(v)
    db.commit()
    
    print("Seeding Spike Day (Yesterday)...")
    # Spike in North Ward (h1, h2) for Fever
    spike_date = today - timedelta(days=1)
    
    v_spike1 = models.VisitEvent(date=spike_date, hospital_id=h1.id, syndrome="Fever", count=25, age_group="16-50")
    v_spike2 = models.VisitEvent(date=spike_date, hospital_id=h2.id, syndrome="Fever", count=15, age_group="16-50")
    
    db.add_all([v_spike1, v_spike2])
    db.commit()

    print("Database Seeded Successfully!")
    print(f"Hospital IDs: {h1.name}={h1.id}, {h2.name}={h2.id}")

if __name__ == "__main__":
    try:
        seed()
    except Exception as e:
        print("Seeding failed or already exists:", e)
        db.rollback()
    finally:
        db.close()
