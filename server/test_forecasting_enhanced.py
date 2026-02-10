from forecasting import Forecaster, explain_trend

def test_enhanced_forecasting():
    print("--- Testing Enhanced Forecasting (Damping & CI) ---")
    
    # 1. Linear Growth Scenario
    # Data: 10, 12, 14, 16, 18, 20 (Trend = +2)
    # With Damping (phi=0.9), it should predict slightly less than 22, 24...
    data = [10, 12, 14, 16, 18, 20]
    
    f = Forecaster(alpha=0.8, beta=0.5, phi=0.8) # Aggressive damping for test visibility
    f.fit(data)
    preds = f.predict(days=3)
    
    print(f"Final Level: {f.level:.2f}, Trend: {f.trend:.2f}")
    print(f"Resid Std: {f.resid_std:.2f}")
    
    for p in preds:
        print(f"Day +{p['day']}: {p['value']} (CI: {p['lower_bound']} - {p['upper_bound']})")
        
    # Check Damping: Day 1 increase vs Day 2 increase
    # Day 1 val ~ 20 + 2*0.8 = 21.6
    # Day 2 val ~ 20 + 2*(0.8 + 0.64) ...
    # Standard linear would be 22, 24, 26. Damped should be lower.
    
    if preds[0]['value'] < 22.1 and preds[2]['value'] < 26.0:
        print("SUCCESS: Forecast is damped (not purely linear).")
    else:
        print("FAILURE: Forecast looks linear or growing too fast.")

    # 2. Check Explainability
    expl = explain_trend(f.trend, f.level)
    print(f"\nExplanation: {expl}")
    if "Increasing" in expl or "Stable" in expl:
        print("SUCCESS: Explanation generation works.")
    else:
        print("FAILURE: Explanation logic failed.")

    # 3. Check Confidence Intervals (Should widen over time)
    width_d1 = preds[0]['upper_bound'] - preds[0]['lower_bound']
    width_d3 = preds[2]['upper_bound'] - preds[2]['lower_bound']
    
    if width_d3 > width_d1:
        print(f"SUCCESS: CI widens over time ({width_d1:.1f} -> {width_d3:.1f}).")
    else:
        print("FAILURE: CI does not reflect increasing uncertainty.")

if __name__ == "__main__":
    test_enhanced_forecasting()
