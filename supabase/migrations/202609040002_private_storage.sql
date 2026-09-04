begin;

insert into storage.buckets(id, name, public, file_size_limit) values
  ('working-files', 'working-files', false, 262144000),
  ('previews', 'previews', false, 262144000),
  ('permission-documents', 'permission-documents', false, 262144000),
  ('imports', 'imports', false, 262144000),
  ('support-attachments', 'support-attachments', false, 262144000),
  ('exports', 'exports', false, 262144000)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

-- Szándékosan nincs klienspolicy: az I2 fájlmetaadat- és karanténfolyamáig
-- minden közvetlen objektumművelet alapértelmezetten tiltott.

commit;
