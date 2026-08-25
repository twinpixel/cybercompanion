-- CyberCompanion — schema iniziale.
-- Applica con:  npm run db:migrate        (remoto)
--               npm run db:migrate:local  (locale, per `npm run cf:dev`)

-- Una riga per scheda personaggio. Il corpo della scheda vive in `data` come
-- JSON: il regolamento ha decine di campi ripetuti (skill, cyberware, armi) e
-- normalizzarli in tabelle separate non porta nulla su poche decine di record.
-- Le colonne estratte (name, handle, role) servono solo alla lista, che cosi'
-- non deve deserializzare l'intero blob.
CREATE TABLE IF NOT EXISTS characters (
  id          TEXT    PRIMARY KEY,
  name        TEXT    NOT NULL,
  handle      TEXT    NOT NULL DEFAULT '',
  role        TEXT    NOT NULL DEFAULT '',
  data        TEXT    NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- La lista personaggi e' ordinata per ultima modifica.
CREATE INDEX IF NOT EXISTS idx_characters_updated_at
  ON characters (updated_at DESC);
