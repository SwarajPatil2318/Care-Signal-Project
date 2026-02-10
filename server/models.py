from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, Boolean, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Zone(Base):
    __tablename__ = "zones"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # e.g., "North Ward"
    
    hospitals = relationship("Hospital", back_populates="zone")
    signals = relationship("Signal", back_populates="zone")
    responsibilities = relationship("Responsibility", back_populates="zone")

class Hospital(Base):
    __tablename__ = "hospitals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"))
    type = Column(String) # "District Hospital", "PHC"

    zone = relationship("Zone", back_populates="hospitals")
    visits = relationship("VisitEvent", back_populates="hospital")

class VisitEvent(Base):
    __tablename__ = "visit_events"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    syndrome = Column(String, index=True) # "Fever"
    count = Column(Integer)
    age_group = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hospital = relationship("Hospital", back_populates="visits")

class Signal(Base):
    __tablename__ = "signals"
    __table_args__ = (
        UniqueConstraint('zone_id', 'signal_type', 'syndrome', 'date', name='uq_signal_zone_type_syndrome_date'),
    )
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"))
    syndrome = Column(String) # Can be "ALL" for OPD Load
    
    # Analysis Data
    is_spike = Column(Boolean, default=False)
    value = Column(Integer) # The aggregated count
    baseline = Column(Integer) # The calculated moving average
    
    # Metadata for Interpretablity
    signal_type = Column(String) # "Disease Surge", "OPD Load Increase"
    severity = Column(String) # "Low", "Medium", "High"
    confidence = Column(String) # "Low", "Medium", "High"
    explanation = Column(Text) # "Fever count 50 > 2x baseline (20)"
    
    # Accountability Data
    status = Column(String, default="Pending") # "Pending", "Ack", "Resolved"
    assigned_to = Column(String) # "DHO", "MO", "Epidemiologist"
    sla_deadline = Column(DateTime)
    
    zone = relationship("Zone", back_populates="signals")
    actions = relationship("Action", back_populates="signal")

class Action(Base):
    __tablename__ = "actions"
    id = Column(Integer, primary_key=True, index=True)
    signal_id = Column(Integer, ForeignKey("signals.id"))
    status = Column(String) # "Pending", "Investigating", "Resolved"
    notes = Column(Text)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    signal = relationship("Signal", back_populates="actions")

class Responsibility(Base):
    __tablename__ = "responsibilities"
    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"))
    role = Column(String) # "DHO", "MO"
    name = Column(String) # "Dr. Sharma"
    contact = Column(String) 

    zone = relationship("Zone", back_populates="responsibilities")
