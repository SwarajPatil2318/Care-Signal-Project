from typing import List, Tuple, Dict
import math

class Forecaster:
    def __init__(self, alpha: float = 0.5, beta: float = 0.3, phi: float = 0.9):
        """
        Holt's Linear Exponential Smoothing with Damped Trend.
        alpha: Level smoothing factor (0 < alpha < 1)
        beta: Trend smoothing factor (0 < beta < 1)
        phi: Damping factor (0 < phi < 1) - Reduces trend over time to prevent overshooting
        """
        self.alpha = alpha
        self.beta = beta
        self.phi = phi
        self.level = 0.0
        self.trend = 0.0
        self.last_value = 0.0
        self.resid_std = 0.0 # Standard deviation of residuals
        self.history = []

    def fit(self, data: List[int]):
        """
        Fits the model to the provided historical data.
        data: List of integers (daily counts), ordered from oldest to newest.
        """
        if not data:
            return

        self.history = data
        n = len(data)
        
        # Initialization
        if n == 1:
            self.level = float(data[0])
            self.trend = 0.0
            self.last_value = data[0]
            return

        # Simple initialization for level and trend
        # Level = 2nd value, Trend = 2nd - 1st
        self.level = float(data[1])
        self.trend = float(data[1] - data[0])
        
        # Iterative update & Residual Calculation
        residuals = []
        
        for i in range(2, n):
            value = float(data[i])
            last_level = self.level
            last_trend = self.trend

            # Calculate one-step-ahead forecast for residual
            pred = last_level + (self.phi * last_trend)
            residuals.append(value - pred)

            # Update Level
            self.level = (self.alpha * value) + ((1 - self.alpha) * (last_level + (self.phi * last_trend)))
            
            # Update Trend
            self.trend = (self.beta * (self.level - last_level)) + ((1 - self.beta) * self.phi * last_trend)
            
        self.last_value = data[-1]
        
        # Calculate Standard Deviation of Residuals for CI
        if len(residuals) > 1:
            mean_res = sum(residuals) / len(residuals)
            variance = sum((x - mean_res) ** 2 for x in residuals) / (len(residuals) - 1)
            self.resid_std = math.sqrt(variance)
        else:
            # Fallback if not enough data
            self.resid_std = self.level * 0.1 # 10% heuristic

    def predict(self, days: int = 7) -> List[Dict[str, float]]:
        """
        Predicts future values for 'days' steps.
        Returns: List of dicts { 'day': offset, 'value': predicted_count, 'confidence_range': (low, high) }
        """
        predictions = []
        
        if not self.history:
            return []

        for h in range(1, days + 1):
            # Forecast Formula with Damping: Level + Sum(phi^i * Trend)
            # Simplified for h-step ahead: Level + Trend * Sum(phi^i)
            # Damping attenuation: trend contribution decays
            
            damping_factor = sum([self.phi**i for i in range(1, h+1)])
            forecast_val = self.level + (self.trend * damping_factor)
            forecast_val = max(0.0, forecast_val) # Clamp to 0
            
            # Confidence Interval: 1.96 * resid_std * sqrt(h)
            # We assume error grows with square root of time
            margin = 1.96 * self.resid_std * math.sqrt(h)
            
            low = max(0.0, forecast_val - margin)
            high = forecast_val + margin
            
            predictions.append({
                "day": h,
                "value": round(forecast_val, 1),
                "lower_bound": round(low, 1),
                "upper_bound": round(high, 1)
            })
            
        return predictions

def assess_risk(forecast: float, baseline: float, spatial_risk_level: str = "Low") -> str:
    """
    Returns Risk Level based on forecast vs baseline AND spatial context.
    Final Risk = Max(Temporal Risk, Spatial Risk)
    """
    temporal_risk = "Low"
    
    if baseline == 0:
        if forecast > 5: temporal_risk = "High"
        elif forecast > 0: temporal_risk = "Medium"
    else:
        ratio = forecast / baseline
        if ratio > 2.0 or (forecast - baseline > 20):
            temporal_risk = "High"
        elif ratio > 1.3:
            temporal_risk = "Medium"
            
    # Combine Risks
    risk_map = {"Low": 1, "Medium": 2, "High": 3}
    
    t_score = risk_map.get(temporal_risk, 1)
    s_score = risk_map.get(spatial_risk_level, 1)
    
    final_score = max(t_score, s_score)
    
    if final_score == 3: return "High"
    if final_score == 2: return "Medium"
    return "Low"

def explain_trend(trend: float, level: float) -> str:
    """
    Generates a natural language explanation of the trend.
    """
    if level == 0: return "No sufficient data"
    
    # Calculate percentage change per day relative to current level
    pct_change = (trend / level) * 100
    
    explanation = "Stable"
    if pct_change > 10:
        explanation = "Rapidly Increasing (Surge)"
    elif pct_change > 2:
        explanation = "Increasing"
    elif pct_change < -10:
        explanation = "Rapidly Decreasing"
    elif pct_change < -2:
        explanation = "Decreasing"
        
    return f"{explanation} ({pct_change:.1f}% daily trend)"

def generate_operational_guidance(forecast_val: float, risk_level: str, trend_desc: str) -> List[str]:
    """
    Generates operational capacity planning advice based on forecast.
    Strictly non-clinical (Actionable heuristics).
    """
    actions = []
    
    # 1. Capacity / Load Actions
    if risk_level == "High":
        actions.append("⚠️ Activate Surge Capacity Protocol (Overflow Ward preparation)")
        actions.append("Ensure 7-day buffer stock of essential supplies (IV fluids, ORS)")
        actions.append("Review staff roster for potential double shifts")
    elif risk_level == "Medium":
        actions.append("Verify stock levels at PHCs")
        actions.append("Alert community health workers for increased surveillance")
    else:
        actions.append("Maintain routine monitoring")

    # 2. Trend Specific Actions
    if "Rapidly Increasing" in trend_desc:
        actions.append("URGENT: Deploy mobile medical unit to hotspot")
    elif "Increasing" in trend_desc:
        actions.append("Increase reporting frequency to daily")
        
    return actions

def calculate_intensity(forecast_val: float, historical_max: float) -> float:
    """
    Calculates a normalized intensity score (0.0 - 1.0) for map visualization.
    Logic: forecasted_value / (historical_max * 1.5)
    Accoubts for potential new peaks.
    """
    if historical_max == 0:
        return 1.0 if forecast_val > 0 else 0.0
        
    # normalization factor 1.5x of max to allow for "severe" reading before capping
    denom = historical_max * 1.5
    intensity = forecast_val / denom
    
    return float(min(1.0, max(0.0, intensity)))
