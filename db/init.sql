CREATE TABLE IF NOT EXISTS decks (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cards (
  id          SERIAL PRIMARY KEY,
  deck_id     INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  word        VARCHAR(200) NOT NULL,
  translation VARCHAR(300) NOT NULL,
  part_of_speech VARCHAR(30) DEFAULT '',
  example     TEXT DEFAULT '',
  known       BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cards_deck ON cards(deck_id);

INSERT INTO decks (name, description) VALUES
  ('Everyday English', 'Common words used in daily life'),
  ('OS Vocabulary', 'Operating system terms');

INSERT INTO cards (deck_id, word, translation, part_of_speech, example) VALUES
  (1, 'abundant', 'อุดมสมบูรณ์, มากมาย', 'adjective', 'The region has abundant natural resources.'),
  (1, 'brave', 'กล้าหาญ', 'adjective', 'She was brave enough to speak up.'),
  (1, 'curious', 'อยากรู้อยากเห็น', 'adjective', 'Cats are curious animals.'),
  (1, 'delight', 'ความยินดี, ทำให้ปลื้ม', 'noun', 'To our delight, the sun came out.'),
  (1, 'eager', 'กระตือรือร้น', 'adjective', 'He is eager to learn.'),
  (2, 'process', 'โปรเซส, กระบวนการ', 'noun', 'Each container runs as an isolated process.'),
  (2, 'kernel', 'เคอร์เนล, แกนกลางของระบบปฏิบัติการ', 'noun', 'Containers share the host kernel.'),
  (2, 'namespace', 'เนมสเปซ (การแยกทรัพยากร)', 'noun', 'Linux namespaces isolate PIDs and networks.'),
  (2, 'volume', 'วอลุ่ม, พื้นที่เก็บข้อมูลถาวร', 'noun', 'The database stores data in a volume.');
