import requests
import json

try:
    print("Fetching zones...")
    zones = requests.get("http://localhost:8000/zones").json()
    print(f"Found {len(zones)} zones.")

    if zones:
        zid = zones[0]['id']
        print(f"Fetching forecast for zone {zid}...")
        forecast = requests.get(f"http://localhost:8000/zones/{zid}/forecast?days=7").json()
        
        print(f"Forecast for zone {zid}:")
        print(json.dumps(forecast, indent=2))
        
        # Check specific diseases
        diseases = set(f['disease'] for f in forecast)
        print(f"Available diseases: {diseases}")
        
    else:
        print("No zones found.")

except Exception as e:
    print(f"Error: {e}")
