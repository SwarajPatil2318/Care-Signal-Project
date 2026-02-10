from main import app, get_db
from fastapi.testclient import TestClient
from database import SessionLocal

client = TestClient(app)

def test_disease_forecast():
    # Fetch all zones to find a valid ID
    response = client.get("/zones")
    if response.status_code != 200:
        print("Failed to fetch zones")
        return
        
    zones = response.json()
    if not zones:
        print("No zones to test")
        return
        
    zone_id = zones[0]['id']
    print(f"Testing Zone {zone_id}...")
    
    # Call forecast endpoint
    res = client.get(f"/zones/{zone_id}/forecast")
    
    if res.status_code != 200:
        print(f"Error: {res.status_code} {res.text}")
        return
        
    forecasts = res.json()
    print(f"Received {len(forecasts)} forecasts.")
    
    for f in forecasts:
        print(f"--- Disease: {f['disease']} ---")
        print(f"  Risk: {f['risk_level']}")
        print(f"  Intensity: {f['intensity']}")
        print(f"  Trend: {f['trend']}")
        print(f"  History Points: {len(f['history'])}")
        print(f"  Forecast Points: {len(f['forecast'])}")

if __name__ == "__main__":
    test_disease_forecast()
