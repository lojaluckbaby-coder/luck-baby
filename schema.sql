CREATE TABLE IF NOT EXISTS store (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT OR IGNORE INTO store (id, data, updated_at)
VALUES (1, '{"products":[],"banners":[],"brands":[],"categories":[],"promo":{},"settings":{},"shipping":{}}', datetime('now'));
