CREATE TABLE IF NOT EXISTS parcels (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  chunks INTEGER NOT NULL,
  size_bytes INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS parcel_chunks (
  parcel_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (parcel_id, chunk_index),
  FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_parcel_chunks_parcel_id ON parcel_chunks(parcel_id);
