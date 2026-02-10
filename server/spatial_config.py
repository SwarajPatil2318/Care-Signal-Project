# Hardcoded Adjacency Graph for MVP
# In production, this would be in the database (Table: ZoneAdjacency)

# Key: Zone ID, Value: List of Adjacent Zone IDs
ZONE_ADJACENCY = {
    1: [2],       # Zone 1 is next to Zone 2
    2: [1, 3],    # Zone 2 is between 1 and 3
    3: [2]        # Zone 3 is next to Zone 2
}

def get_neighbors(zone_id: int):
    return ZONE_ADJACENCY.get(zone_id, [])
