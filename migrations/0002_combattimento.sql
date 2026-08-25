-- CyberCompanion — scontri e avversari riutilizzabili.
-- Applica con:  npm run db:migrate  (remoto)  /  npm run db:migrate:local

-- Uno scontro in corso o concluso. Come per le schede, il corpo vive in `stato`
-- come JSON: combattenti, ordine di iniziativa, ferite e diario cambiano forma
-- troppo spesso perche' valga la pena normalizzarli, e sono sempre letti insieme.
-- Le colonne estratte servono solo alla lista.
CREATE TABLE IF NOT EXISTS encounters (
  id          TEXT    PRIMARY KEY,
  name        TEXT    NOT NULL,
  round       INTEGER NOT NULL DEFAULT 0,
  closed      INTEGER NOT NULL DEFAULT 0,
  stato       TEXT    NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_encounters_updated_at
  ON encounters (updated_at DESC);

-- Avversari salvati come modello, per non riscrivere la stessa guardia Arasaka
-- a ogni sessione. Non hanno una scheda: bastano le poche voci che il
-- combattimento usa davvero (RIF, COS, FRE, TEC, abilita', armi, VP armatura).
CREATE TABLE IF NOT EXISTS npc_templates (
  id          TEXT    PRIMARY KEY,
  name        TEXT    NOT NULL,
  categoria   TEXT    NOT NULL DEFAULT '',
  dati        TEXT    NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_npc_templates_name
  ON npc_templates (name);
