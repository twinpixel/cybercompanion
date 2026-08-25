-- CyberCompanion — programmi del Net.
-- Applica con:  npm run db:migrate  (remoto)  /  npm run db:migrate:local

-- Un programma scritto o comprato. Come per le schede e gli scontri, il corpo
-- vive in `spec` come JSON: funzioni, optional e variabili cambiano forma
-- assieme al regolamento, e si leggono sempre tutti insieme. Le colonne
-- estratte servono alla lista e ai filtri.
CREATE TABLE IF NOT EXISTS programs (
  id           TEXT    PRIMARY KEY,
  name         TEXT    NOT NULL,
  classe       TEXT    NOT NULL DEFAULT '',
  forza        INTEGER NOT NULL DEFAULT 0,
  difficolta   INTEGER NOT NULL DEFAULT 0,
  um           INTEGER NOT NULL DEFAULT 0,
  costo        INTEGER NOT NULL DEFAULT 0,
  -- id della scheda del netrunner a cui appartiene, se e' di qualcuno.
  character_id TEXT,
  spec         TEXT    NOT NULL,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_programs_updated_at ON programs (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_programs_character  ON programs (character_id);
