from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

# --- Visit Event ---
class VisitEventBase(BaseModel):
    date: date
    syndrome: str
    count: int
    age_group: str
    # hospital_id implicit in route or payload

class VisitEventCreate(VisitEventBase):
    pass

class VisitEvent(VisitEventBase):
    id: int
    hospital_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Batched Ingestion ---
class BatchVisitCreate(BaseModel):
    hospital_id: int # If authenticating via token, this wouldn't be here, but for MVP it's easier
    visits: List[VisitEventCreate]

# --- Entities ---
class ZoneBase(BaseModel):
    name: str

class Zone(ZoneBase):
    id: int
    class Config:
        from_attributes = True

class HospitalBase(BaseModel):
    name: str
    type: str
    zone_id: int

class Hospital(HospitalBase):
    id: int
    class Config:
        from_attributes = True

# --- Signals & Actions ---
class ActionBase(BaseModel):
    status: str
    notes: Optional[str] = None

class ActionCreate(ActionBase):
    pass

class Action(ActionBase):
    id: int
    signal_id: int
    updated_at: datetime
    class Config:
        from_attributes = True

class SignalBase(BaseModel):
    date: date
    syndrome: str
    is_spike: bool
    value: int
    baseline: int
    signal_type: Optional[str] = None
    severity: Optional[str] = None
    confidence: Optional[str] = None
    explanation: Optional[str] = None
    status: Optional[str] = "Pending"
    assigned_to: Optional[str] = None
    sla_deadline: Optional[datetime] = None

class Signal(SignalBase):
    id: int
    zone_id: int
    zone: Optional[Zone] = None
    actions: List[Action] = []
    class Config:
        from_attributes = True

# --- Forecasting ---
class ForecastPoint(BaseModel):
    date: date
    value: float
    lower_bound: float
    upper_bound: float

class DiseaseForecast(BaseModel):
    disease: str
    risk_level: str
    risk_reason: str
    intensity: float # 0.0 to 1.0
    trend: str
    history: List[ForecastPoint]
    forecast: List[ForecastPoint]
    guidance: List[str]
