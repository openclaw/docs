---
read_when:
    - Memindahkan data runtime, cache, transkrip, status tugas, atau file sementara OpenClaw ke SQLite
    - Merancang migrasi doctor dari file JSON atau JSONL
    - Mengubah perilaku pencadangan, pemulihan, VFS, atau penyimpanan worker
    - Menghapus kunci sesi, pemangkasan, pemotongan, atau jalur kompatibilitas JSON
summary: Rencana migrasi untuk menjadikan SQLite sebagai lapisan state tahan lama dan cache utama sambil tetap mempertahankan konfigurasi berbasis file
title: Refaktor status berbasis database
x-i18n:
    generated_at: "2026-07-01T20:37:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 566e6aacfaa6aff0db2d1d143ef313d0ce97b82428152bc8940856e317a149ff
    source_path: refactor/database-first.md
    workflow: 16
---

# Refaktor Status yang Mendahulukan Database

## Keputusan

Gunakan tata letak SQLite dua tingkat:

- Database global: `~/.openclaw/state/openclaw.sqlite`
- Database agen: satu database SQLite per agen untuk ruang kerja milik agen,
  transkrip, VFS, artefak, dan status runtime per agen yang besar
- Konfigurasi tetap berbasis file: `openclaw.json` tetap berada di luar
  database. Profil autentikasi runtime berpindah ke SQLite; file kredensial
  penyedia eksternal atau CLI tetap dikelola pemilik di luar database OpenClaw.

Database global adalah database bidang kontrol. Database ini memiliki penemuan agen,
status Gateway bersama, pairing, status perangkat/node, buku besar tugas dan alur, status plugin,
status runtime penjadwal, metadata cadangan, dan status migrasi.

Database agen adalah database bidang data. Database ini memiliki metadata sesi agen,
aliran peristiwa transkrip, ruang kerja VFS atau namespace scratch, artefak alat,
artefak run, dan data cache lokal agen yang dapat dicari/diindeks.

Ini memberikan satu tampilan global yang tahan lama tanpa memaksa ruang kerja agen yang besar,
transkrip, dan data scratch biner masuk ke jalur tulis Gateway bersama.

## Kontrak Keras

Migrasi ini memiliki satu bentuk runtime kanonis:

- Baris sesi hanya mempertahankan metadata sesi. Baris tersebut tidak boleh mempertahankan
  `transcriptLocator`, path file transkrip, path JSONL sibling, path lock,
  metadata pruning, atau pointer kompatibilitas era file.
- Identitas transkrip selalu merupakan identitas SQLite: `{agentId, sessionId}` ditambah
  metadata topik opsional jika protokol membutuhkannya.
- `sqlite-transcript://...` bukan identitas runtime atau protokol. Kode baru tidak boleh
  menurunkan, mempertahankan, meneruskan, mengurai, atau memigrasikan locator transkrip. Runtime dan
  pengujian tidak boleh berisi pseudo-locator sama sekali; docs boleh menyebut string tersebut
  hanya untuk melarangnya.
- `sessions.json` legacy, JSONL transkrip, `.jsonl.lock`, pruning, truncation,
  dan logika path sesi lama hanya menjadi milik jalur migrasi/impor doctor.
- Alias konfigurasi sesi legacy hanya menjadi milik migrasi doctor. Runtime tidak
  menafsirkan `session.idleMinutes`, `session.resetByType.dm`, atau
  alias sesi utama lintas agen `agent:main:*` untuk agen terkonfigurasi lain.
- Identitas routing sesi adalah status relasional bertipe. Jalur runtime hot dan UI
  harus membaca `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations`, dan
  `session_conversations`; mereka tidak boleh mengurai `session_key` atau menambang
  `session_entries.entry_json` untuk identitas penyedia kecuali sebagai bayangan kompatibilitas
  saat call site lama sedang dihapus.
- Marker pesan langsung tingkat channel seperti `dm` versus `direct` adalah kosakata routing,
  bukan locator transkrip atau handle kompatibilitas file-store.
- Konfigurasi handler hook legacy hanya menjadi milik permukaan peringatan/migrasi doctor.
  Runtime tidak boleh memuat `hooks.internal.handlers`; hook berjalan hanya melalui direktori
  hook yang ditemukan dan metadata `HOOK.md`.
- Startup runtime, jalur balasan hot, Compaction, reset, pemulihan, diagnostik,
  TTS, hook memori, subagen, routing perintah plugin, batas protokol, dan
  hook harus meneruskan `{agentId, sessionId}` melalui runtime.
- Pengujian harus menanam dan mengasersi baris transkrip SQLite melalui
  `{agentId, sessionId}`. Pengujian yang hanya membuktikan penerusan path JSONL,
  pelestarian locator yang disediakan pemanggil, atau kompatibilitas file transkrip harus
  dihapus kecuali mencakup impor doctor, materialisasi dukungan/debug non-sesi,
  atau bentuk protokol.
- `runEmbeddedPiAgent(...)`, run worker yang disiapkan, dan upaya embedded bagian dalam
  tidak boleh menerima locator transkrip. Semuanya membuka pengelola transkrip SQLite
  berdasarkan `{agentId, sessionId}` dan meneruskan pengelola itu ke sesi agen internal
  yang kompatibel dengan PI, sehingga pemanggil usang tidak dapat membuat runner menulis
  transkrip JSON/JSONL.
- Diagnostik runner harus menyimpan rekaman trace runtime/cache/payload di SQLite.
  Diagnostik runtime tidak boleh mengekspos knob override file JSONL atau helper ekspor
  JSONL transkrip generik; ekspor yang terlihat pengguna dapat mematerialisasikan artefak eksplisit
  dari baris database tanpa memasukkan nama file kembali ke runtime.
- Logging stream mentah menggunakan `OPENCLAW_RAW_STREAM=1` ditambah baris diagnostik SQLite.
  Kontrak logger file pi-mono lama `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH`, dan
  `raw-openai-completions.jsonl` bukan bagian dari runtime atau pengujian OpenClaw.
- Pengindeksan memori QMD tidak boleh mengekspor transkrip SQLite ke file markdown.
  QMD hanya mengindeks file memori yang dikonfigurasi; pencarian transkrip sesi tetap
  berbasis SQLite.
- Subpath SDK QMD hanya untuk QMD bagi kode baru. Helper pengindeksan transkrip sesi SQLite
  berada di `memory-core-host-engine-session-transcripts`; re-export QMD apa pun
  hanya kompatibilitas dan tidak boleh digunakan oleh kode runtime.
- Indeks memori bawaan berada di database agen pemilik. Konfigurasi runtime dan
  kontrak runtime yang di-resolve tidak boleh mengekspos `memorySearch.store.path`; doctor
  menghapus kunci konfigurasi legacy tersebut dan kode saat ini meneruskan
  `databasePath` agen secara internal.

Pekerjaan implementasi harus terus menghapus kode hingga pernyataan ini benar
tanpa pengecualian di luar batas doctor/impor/ekspor/debug.

## Status tujuan dan progres

### Tujuan keras

- Satu database SQLite global memiliki status bidang kontrol:
  `state/openclaw.sqlite`.
- Satu database SQLite per agen memiliki status bidang data:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Konfigurasi tetap berbasis file. `openclaw.json` bukan bagian dari
  refaktor database ini.
- File legacy hanya menjadi input migrasi doctor.
- Runtime tidak pernah menulis atau membaca JSONL sesi atau transkrip sebagai status aktif.

### Status tujuan

- `not-started`: kode runtime era file masih menulis status aktif.
- `migrating`: kode doctor/impor dapat memindahkan data file ke SQLite.
- `dual-read`: bridge sementara membaca SQLite dan file legacy. Status ini
  dilarang untuk refaktor ini kecuali didokumentasikan secara eksplisit sebagai
  hanya untuk doctor.
- `sqlite-runtime`: runtime hanya membaca dan menulis SQLite.
- `clean`: API dan pengujian runtime legacy dihapus, dan guard mencegah
  regresi.
- `done`: docs, pengujian, cadangan, migrasi doctor, dan pemeriksaan perubahan membuktikan
  status bersih.

### Status saat ini

- Sesi: `clean` untuk runtime. Baris sesi berada di database per agen,
  API runtime menggunakan `{agentId, sessionId}` atau `{agentId, sessionKey}`, dan
  `sessions.json` adalah input legacy khusus doctor.
- Transkrip: `clean` untuk runtime. Peristiwa, identitas, snapshot transkrip,
  dan peristiwa runtime trajectory berada di database per agen. Runtime tidak
  lagi menerima locator transkrip atau path transkrip JSONL.
- Runner embedded PI: `clean`. Run PI embedded, worker yang disiapkan, Compaction,
  dan loop retry menggunakan scope sesi SQLite dan menolak handle transkrip usang.
- Cron: `clean` untuk runtime. Runtime menggunakan `cron_jobs` dan `cron_run_logs`;
  pengujian runtime menggunakan penamaan `storeKey` SQLite, dan path cron era file tetap berada
  hanya dalam pengujian migrasi legacy doctor.
- Registry tugas: `clean`. Baris runtime tugas dan TaskFlow berada di
  `state/openclaw.sqlite`; importer SQLite sidecar yang belum dirilis dihapus.
- Status plugin: `clean`. Baris status/blob plugin berada di database global bersama;
  helper SQLite sidecar status plugin lama dijaga agar tidak digunakan.
- Memori: `sqlite-runtime` untuk memori bawaan dan pengindeksan transkrip sesi.
  Tabel indeks memori berada di database per agen, status memori plugin menggunakan
  baris status plugin bersama, dan file memori legacy adalah input migrasi doctor
  atau konten ruang kerja pengguna.
- Cadangan: `sqlite-runtime`. Tahap cadangan memadatkan snapshot SQLite, menghilangkan sidecar
  WAL/SHM live, memverifikasi integritas SQLite, dan mencatat run cadangan di
  database global.
- Migrasi doctor: `migrating`, secara sengaja. Doctor mengimpor JSON,
  JSONL, dan store sidecar pensiun legacy ke SQLite, mencatat run/sumber migrasi,
  dan menghapus sumber yang berhasil.
- Skrip E2E: `clean` untuk cakupan runtime. Seeding Docker MCP menulis baris SQLite.
  Skrip Docker runtime-context membuat JSONL legacy hanya di dalam seed migrasi doctor
  dan menamai path indeks sesi legacy secara eksplisit.

### Pekerjaan tersisa

- [x] Ganti nama variabel store pengujian runtime cron dari `storePath` kecuali
      variabel tersebut adalah input legacy doctor.
      File: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Bukti: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Hapus atau ganti nama mock pengujian ekspor era file yang usang.
      File: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Bukti: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Buat seed JSONL legacy Docker runtime-context jelas hanya untuk doctor.
      File: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Bukti: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` hanya menampilkan
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Jaga tipe yang dihasilkan Kysely tetap selaras setelah perubahan skema apa pun.
      File: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Bukti: tidak ada perubahan skema pada pass ini; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Jalankan ulang pengujian terfokus untuk store, perintah, dan skrip yang disentuh.
      Bukti: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Sebelum menyatakan `done`, jalankan gate perubahan atau pembuktian luas remote.
      Bukti: `pnpm check:changed --timed -- <changed extension paths>` lulus pada
      run Hetzner Crabbox `run_3f1cabf6b25c` setelah penyiapan Node 24/pnpm sementara dan
      routing path eksplisit untuk ruang kerja tersinkron tanpa `.git`.

### Jangan regresi

- Tidak ada locator transkrip.
- Tidak ada file sesi aktif.
- Tidak ada fixture pengujian JSONL palsu kecuali pengujian migrasi legacy doctor.
- Tidak ada akses SQLite mentah jika Kysely diharapkan.
- Tidak ada migrasi DB legacy baru. Tata letak ini belum dirilis; pertahankan versi skema
  di `1` kecuali ada alasan kuat.

## Asumsi Pembacaan Kode

Tidak ada keputusan produk lanjutan yang memblokir rencana ini. Implementasi harus
berlanjut dengan asumsi berikut:

- Gunakan `node:sqlite` secara langsung dan wajibkan runtime Node 22+ untuk jalur
  penyimpanan ini.
- Pertahankan tepat satu file konfigurasi normal. Jangan pindahkan konfigurasi, manifes plugin,
  atau workspace Git ke SQLite dalam refaktor ini.
- File kompatibilitas runtime tidak diperlukan. File JSON dan JSONL lama hanya
  menjadi input migrasi. Sidecar SQLite lokal-branch tidak pernah dirilis dan
  dihapus alih-alih diimpor.
- `openclaw doctor --fix` memiliki langkah migrasi file lama ke database.
  Startup runtime dan `openclaw migrate` tidak boleh membawa jalur upgrade database
  OpenClaw lama.
- Kompatibilitas kredensial mengikuti aturan yang sama: kredensial runtime berada di
  SQLite. File `auth-profiles.json` lama, `auth.json` per-agent, dan file bersama
  `credentials/oauth.json` adalah input migrasi doctor, lalu dihapus
  setelah impor.
- Status katalog model yang dihasilkan didukung oleh database. Kode runtime tidak boleh menulis
  `agents/<agentId>/agent/models.json`; file `models.json` yang ada adalah input
  doctor lama dan dihapus setelah diimpor ke `agent_model_catalogs`.
- Runtime tidak boleh memigrasikan, menormalkan, atau menjembatani locator transkrip. Identitas
  transkrip aktif adalah `{agentId, sessionId}` di SQLite. Jalur file hanya
  input doctor lama, dan `sqlite-transcript://...` harus hilang dari
  permukaan runtime, protokol, hook, dan plugin alih-alih diperlakukan sebagai
  handle batas.
- Pembacaan transkrip SQLite runtime tidak menjalankan migrasi bentuk entri JSONL lama atau
  menulis ulang seluruh transkrip demi kompatibilitas. Normalisasi entri lama tetap berada di
  utilitas doctor/impor eksplisit. Doctor menormalkan file transkrip JSONL lama
  sebelum menyisipkan baris SQLite; baris runtime saat ini
  sudah ditulis dalam skema transkrip saat ini. Ekspor trajectory/sesi
  membaca baris tersebut apa adanya dan tidak boleh melakukan migrasi lama saat ekspor.
- Helper parse/migrasi transkrip JSONL lama hanya untuk doctor. Kode format
  transkrip runtime hanya membangun konteks transkrip SQLite saat ini; doctor
  memiliki upgrade entri JSONL lama sebelum menyisipkan baris.
- Helper streaming transkrip JSONL lama yang dimiliki runtime telah dihapus. Kode impor
  doctor memiliki pembacaan file lama yang eksplisit; riwayat sesi runtime membaca
  baris SQLite.
- Binding app-server Codex menggunakan `sessionId` OpenClaw sebagai kunci kanonis
  di namespace plugin-state Codex. `sessionKey` adalah metadata untuk
  routing/tampilan dan tidak boleh menggantikan id sesi tahan lama atau menghidupkan kembali
  identitas file transkrip.
- Mesin konteks menerima kontrak runtime saat ini secara langsung. Registry
  tidak boleh membungkus mesin dengan shim percobaan ulang yang menghapus `sessionKey`,
  `transcriptScope`, atau `prompt`; mesin yang tidak dapat menerima parameter
  database-first saat ini harus gagal secara jelas alih-alih dijembatani.
- Output cadangan harus tetap berupa satu file arsip. Isi database harus masuk
  ke arsip itu sebagai snapshot SQLite yang ringkas, bukan sidecar WAL live mentah.
- Pencarian transkrip berguna tetapi tidak wajib untuk potongan database-first
  pertama. Rancang skema agar FTS dapat ditambahkan nanti.
- Eksekusi worker harus tetap eksperimental di balik pengaturan sementara batas
  database menjadi stabil.

## Temuan Pembacaan Kode

Branch saat ini sudah melewati tahap proof-of-concept. Database bersama
sudah ada, Node `node:sqlite` tersambung melalui helper runtime kecil, dan
store sebelumnya kini menulis ke `state/openclaw.sqlite` atau database
`openclaw-agent.sqlite` pemiliknya.

Pekerjaan yang tersisa bukan memilih SQLite; melainkan menjaga batas baru tetap bersih
dan menghapus antarmuka berbentuk kompatibilitas apa pun yang masih tampak seperti dunia
file lama:

- `storePath` sesi bukan lagi identitas runtime, bentuk fixture pengujian, atau
  field payload status. Pengujian runtime dan bridge tidak lagi berisi
  nama kontrak `storePath`; kode doctor/migrasi memiliki kosakata lama itu.
- Penulisan sesi tidak lagi melewati antrean `store-writer.ts` lama dalam proses.
  Penulisan patch SQLite menggunakan deteksi konflik dan percobaan ulang terbatas sebagai gantinya.
- Penemuan jalur lama masih memiliki kegunaan migrasi yang valid, tetapi kode runtime harus
  berhenti memperlakukan file `sessions.json` dan JSONL transkrip sebagai kemungkinan target tulis.
- Tabel milik agent berada di database SQLite per-agent. DB global menyimpan
  baris registry/control-plane; identitas transkrip adalah `{agentId, sessionId}` di
  baris transkrip per-agent. Kode runtime tidak boleh menyimpan jalur file transkrip
  atau memigrasikan locator transkrip.
- Doctor sudah mengimpor beberapa file lama. Pembersihannya adalah menjadikannya
  satu implementasi migrasi eksplisit yang dipanggil doctor, dengan laporan migrasi
  yang tahan lama.

Tidak ada pertanyaan produk tambahan yang memblokir implementasi.

## Bentuk Kode Saat Ini

Branch ini sudah memiliki dasar SQLite bersama yang nyata:

- Batas minimum runtime kini Node 22+: `package.json`, pengaman runtime CLI,
  default installer, pencari runtime macOS, CI, dan dokumentasi instalasi publik
  semuanya selaras. Jalur kompatibilitas Node 22 lama dihapus.
- `src/state/openclaw-state-db.ts` membuka `openclaw.sqlite`, mengatur WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON`, dan menerapkan
  modul skema yang dihasilkan dari
  `src/state/openclaw-state-schema.sql`.
- Tipe tabel Kysely dan modul skema runtime dihasilkan dari database SQLite
  sekali pakai yang dibuat dari file `.sql` yang dikomit; kode runtime tidak
  lagi menyimpan string skema hasil salin-tempel untuk database global,
  per-agent, atau penangkap proxy.
- Store runtime menurunkan tipe baris yang dipilih dan disisipkan dari
  antarmuka Kysely `DB` yang dihasilkan tersebut, alih-alih membayangi bentuk
  baris SQLite secara manual. Raw SQL tetap dibatasi untuk penerapan skema,
  pragma, dan DDL khusus migrasi.
- Skema SQLite diringkas menjadi `user_version = 1` karena tata letak database
  ini belum pernah dirilis. Pembuka runtime hanya membuat skema saat ini;
  impor file-ke-database tetap berada di kode doctor, dan helper peningkatan
  database lokal-branch telah dihapus.
- Kepemilikan relasional ditegakkan di tempat batas kepemilikan bersifat
  kanonis: baris migrasi sumber cascade dari `migration_runs`, status
  pengiriman tugas cascade dari `task_runs`, dan baris identitas transkrip
  cascade dari peristiwa transkrip.
- Tabel bersama saat ini mencakup `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_run_logs`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs`, dan `backup_runs`.
- State arbitrer milik plugin tidak mendapatkan tabel bertipe milik host.
  Plugin yang terinstal menggunakan `plugin_state_entries` untuk payload JSON
  berversi dan `plugin_blob_entries` untuk byte, dengan kepemilikan
  namespace/key, pembersihan TTL, backup, dan catatan migrasi plugin. State
  orkestrasi plugin milik host tetap dapat memiliki tabel bertipe ketika host
  memiliki kontrak kueri, seperti `plugin_binding_approvals`.
- Migrasi plugin adalah migrasi data atas namespace milik plugin, bukan migrasi
  skema host. Sebuah plugin dapat memigrasikan entri state/blob berversi
  miliknya sendiri melalui penyedia migrasi, dan host mencatat status
  source/run di ledger migrasi normal. Instalasi plugin baru tidak memerlukan
  perubahan `openclaw-state-schema.sql` kecuali host sendiri mengambil
  kepemilikan atas kontrak lintas-plugin baru.
- `src/state/openclaw-agent-db.ts` membuka
  `agents/<agentId>/agent/openclaw-agent.sqlite`, mendaftarkan database di DB
  global, dan memiliki tabel sesi lokal-agent, transkrip, VFS, artefak, cache,
  dan indeks memori. Penemuan runtime bersama kini membaca registry
  `agent_databases` yang bertipe hasil-generate, alih-alih mengimplementasikan
  ulang kueri tersebut di setiap call site.
- Database global dan per-agent mencatat baris `schema_meta` dengan peran
  database, versi skema, timestamp, dan id agent untuk database agent. Tata
  letaknya tetap berada pada `user_version = 1` karena skema SQLite ini belum
  pernah dirilis.
- Identitas sesi per-agent kini memiliki tabel root kanonis `sessions` yang
  dikunci oleh `session_id`, dengan `session_key`, `session_scope`,
  `account_id`, `primary_conversation_id`, timestamp, field tampilan, metadata
  model, id harness, serta tautan parent/spawn sebagai kolom yang dapat
  dikueri. `session_routes` adalah indeks rute aktif unik dari `session_key`
  ke `session_id` saat ini, sehingga key rute dapat berpindah ke sesi durable
  baru tanpa membuat pembacaan panas harus memilih di antara baris
  `sessions.session_key` duplikat. Payload berbentuk kompatibilitas lama
  `session_entries.entry_json` menggantung dari root `session_id` durable
  melalui foreign key; itu bukan lagi satu-satunya representasi sesi pada
  tingkat skema.
- Identitas percakapan eksternal per-agent juga relasional:
  `conversations` menyimpan identitas provider/account/conversation yang
  dinormalisasi, dan `session_conversations` menautkan satu sesi OpenClaw ke
  satu atau lebih percakapan eksternal. Ini mencakup sesi DM shared-main ketika
  beberapa peer dapat secara sengaja dipetakan ke satu sesi tanpa berbohong di
  `session_key`. SQLite juga menegakkan keunikan untuk identitas provider
  alami sehingga tuple channel/account/kind/peer/thread yang sama tidak dapat
  bercabang ke beberapa id percakapan. Peer langsung shared-main ditautkan
  dengan peran `participant`, sehingga satu sesi OpenClaw dapat mewakili
  beberapa peer DM eksternal tanpa menurunkan peer lama menjadi baris terkait
  yang samar. `sessions.primary_conversation_id` tetap menunjuk ke target
  pengiriman bertipe saat ini. Kolom routing/status tertutup ditegakkan dengan
  constraint SQLite `CHECK`, bukan hanya mengandalkan union TypeScript.
  Proyeksi sesi runtime menghapus bayangan routing kompatibilitas dari
  `session_entries.entry_json` sebelum menerapkan kolom sesi/percakapan bertipe,
  sehingga payload JSON usang tidak dapat membangkitkan kembali target
  pengiriman.
  Routing pengumuman subagent juga mewajibkan konteks pengiriman SQLite
  bertipe; ia tidak lagi fallback ke field rute kompatibilitas `SessionEntry`.
  Pewarisan pengiriman eksplisit Gateway `chat.send` membaca konteks pengiriman
  SQLite bertipe, bukan field kompatibilitas `origin`/`last*`.
  `tools.effective` juga menurunkan konteks provider/account/thread dari baris
  pengiriman/routing SQLite bertipe, bukan bayangan entry sesi `last*` yang
  usang.
  Konteks prompt peristiwa sistem membangun ulang field channel/to/account/thread
  dari field pengiriman bertipe, bukan bayangan `origin`.
  Helper bersama `deliveryContextFromSession` dan pemeta sesi-ke-percakapan kini
  sepenuhnya mengabaikan `SessionEntry.origin`; hanya field pengiriman bertipe
  dan baris percakapan relasional yang dapat membuat identitas rute panas.
  Normalisasi entry sesi runtime menghapus `origin` sebelum mempertahankan atau
  memproyeksikan `entry_json`, dan penulisan metadata masuk menulis field
  channel/chat bertipe beserta baris percakapan relasional, alih-alih membuat
  bayangan origin baru.
- Peristiwa transkrip, snapshot transkrip, dan peristiwa runtime trajectory kini
  mereferensikan root `sessions` per-agent kanonis dan cascade saat sesi
  dihapus. Baris identitas/idempotensi transkrip tetap cascade dari baris
  peristiwa transkrip yang tepat.
- Indeks memory-core kini menggunakan tabel database-agent eksplisit
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks`, dan
  `memory_embedding_cache`, dengan `memory_index_state` melacak perubahan
  revisi. Indeks samping FTS/vector opsional dinamai `memory_index_chunks_fts`
  dan `memory_index_chunks_vec`, bukan tabel generik `meta`, `files`, `chunks`,
  `chunks_fts`, atau `chunks_vec`. Nama kanonis mempertahankan bentuk baris
  path/source saat ini dan kompatibilitas embedding terserialisasi. Tabel ini
  adalah cache turunan/pencarian, bukan penyimpanan transkrip kanonis; tabel
  dapat dihapus dan dibangun ulang dari file workspace memori dan sumber yang
  dikonfigurasi. Membuka indeks memori bernama generik yang sudah dirilis akan
  memigrasikan metadata, sumber, chunk, dan cache embedding ke tabel kanonis;
  tabel FTS/vector turunan dibangun ulang dengan nama kanonisnya.
- State pemulihan run subagent kini berada di baris bersama bertipe
  `subagent_runs` dengan key sesi child, requester, dan controller yang
  terindeks. File lama `subagents/runs.json` hanya menjadi input migrasi doctor.
- Binding percakapan saat ini kini berada di baris bersama bertipe
  `current_conversation_bindings` yang dikunci oleh id percakapan
  ternormalisasi, dengan kolom target agent/session, jenis percakapan, status,
  kedaluwarsa, dan metadata disimpan sebagai kolom relasional, bukan catatan
  binding opaque yang diduplikasi. Key binding durable mencakup jenis percakapan
  ternormalisasi sehingga ref direct/group/channel tidak dapat bertabrakan, dan
  SQLite menolak nilai kind/status binding yang tidak valid. File lama
  `bindings/current-conversations.json` hanya menjadi input migrasi doctor.
- Pemulihan antrean pengiriman kini melapisi kolom antrean bertipe untuk
  channel, target, account, session, retry, error, platform-send, dan state
  pemulihan di atas replay JSON. `entry_json` mempertahankan payload replay,
  hook, dan payload pemformatan, tetapi kolom bertipe bersifat otoritatif untuk
  routing/state antrean panas.
- Pointer pemulihan sesi terakhir TUI kini berada di baris bersama bertipe
  `tui_last_sessions` yang dikunci oleh cakupan koneksi/sesi TUI yang di-hash.
  File JSON TUI lama hanya menjadi input migrasi doctor.
- Preferensi TTS default kini berada di baris SQLite plugin-state bersama yang
  dikunci di bawah plugin `speech-core`. File lama `settings/tts.json` hanya
  menjadi input migrasi doctor; runtime tidak lagi membaca atau menulis file
  JSON preferensi TTS, dan resolver path legacy berada di modul migrasi doctor.
- Metadata target secret kini berbicara tentang store, bukan berpura-pura bahwa
  setiap target kredensial adalah file konfigurasi. `openclaw.json` tetap
  menjadi store konfigurasi; target profil-auth menggunakan baris SQLite
  bertipe `auth_profile_stores` dengan kredensial berbentuk provider yang
  disimpan sebagai payload JSON.
- Audit secret tidak lagi memindai file `auth.json` per-agent yang sudah
  dipensiunkan. Doctor memiliki tanggung jawab untuk memperingatkan,
  mengimpor, dan menghapus file legacy tersebut.
- Helper path profil auth legacy kini berada di kode legacy doctor. Helper path
  profil auth core mengekspos identitas auth-store SQLite dan lokasi tampilan,
  bukan path runtime `auth-profiles.json` atau `auth-state.json`.
- Modul runtime pemulihan run subagent dan cache kapabilitas model OpenRouter
  kini memisahkan pembaca/penulis snapshot SQLite dari helper impor JSON legacy
  khusus doctor. Kapabilitas OpenRouter menggunakan baris generik bertipe
  `model_capability_cache` di bawah `provider_id = "openrouter"`, bukan satu
  blob cache opaque atau tabel host khusus provider. `taskName` run subagent
  disimpan di kolom bertipe `subagent_runs.task_name`; salinan `payload_json`
  adalah data replay/debug, bukan sumber untuk field tampilan atau lookup panas.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` mengimplementasikan VFS
  SQLite di atas tabel database agent `vfs_entries`. Pembacaan direktori,
  ekspor rekursif, penghapusan, dan penggantian nama menggunakan rentang prefix
  `(namespace, path)` yang terindeks, alih-alih memindai seluruh namespace atau
  mengandalkan pencocokan path `LIKE`.
- `src/agents/runtime-worker.entry.ts` membuat VFS SQLite per-run, artefak tool,
  artefak run, dan store cache tercakup untuk worker.
- Marker penyelesaian bootstrap workspace kini berada di baris bersama bertipe
  `workspace_setup_state` yang dikunci oleh path workspace yang di-resolve,
  bukan `.openclaw/workspace-state.json`; runtime tidak lagi membaca atau
  menulis ulang marker workspace legacy, dan API helper tidak lagi mengedarkan
  path palsu `.openclaw/setup-state` hanya untuk menurunkan identitas
  penyimpanan.
- Persetujuan exec kini berada di baris singleton SQLite bersama bertipe
  `exec_approvals_config`. Doctor mengimpor legacy
  `~/.openclaw/exec-approvals.json`; penulisan runtime tidak lagi membuat,
  menulis ulang, atau melaporkan file tersebut sebagai lokasi store aktifnya.
  Pendamping macOS membaca dan menulis baris tabel `state/openclaw.sqlite` yang
  sama; ia hanya mempertahankan socket prompt Unix di disk karena itu adalah
  IPC, bukan state runtime durable.
- Modul runtime identitas perangkat, auth perangkat, dan bootstrap kini
  memisahkan pembaca/penulis snapshot SQLite dari helper impor JSON legacy
  khusus doctor. Identitas perangkat menggunakan baris bertipe
  `device_identities` dan token auth perangkat menggunakan baris bertipe
  `device_auth_tokens`. Penulisan auth perangkat merekonsiliasi baris
  berdasarkan device/role alih-alih memotong tabel token, dan runtime tidak lagi
  merutekan pembaruan token tunggal melalui adapter whole-store lama. Legacy
  payload JSON versi-1 hanya ada sebagai bentuk impor/ekspor doctor.
- Cache pertukaran token GitHub Copilot menggunakan tabel plugin-state SQLite bersama
  di bawah `github-copilot/token-cache/default`. Ini adalah keadaan cache milik provider,
  sehingga secara sengaja tidak menambahkan tabel skema host.
- Compaction GitHub Copilot tidak lagi menulis sidecar ruang kerja `openclaw-compaction-*.json`.
  Harness memanggil RPC compaction riwayat SDK untuk sesi SDK yang dilacak,
  dan OpenClaw menyimpan keadaan sesi/transkrip tahan lama di SQLite, bukan file penanda kompatibilitas.

Sorotan konsolidasi/penghapusan yang telah selesai:

- Status Plugin kini menggunakan database bersama `state/openclaw.sqlite`. Pengimpor
  sidecar lama `plugin-state/state.sqlite` yang lokal cabang dihapus karena
  tata letak SQLite itu tidak pernah dirilis. Helper probe/test melaporkan
  `databasePath` bersama alih-alih mengekspos jalur SQLite khusus status-plugin.
- Tabel runtime Tugas dan Alur Tugas kini berada di database bersama
  `state/openclaw.sqlite`, bukan di `tasks/runs.sqlite` dan
  `tasks/flows/registry.sqlite`; pengimpor sidecar lama dihapus karena alasan
  tata letak yang sama-sama belum pernah dirilis.
- `src/config/sessions/store.ts` tidak lagi membutuhkan `storePath` untuk
  metadata masuk, pembaruan rute, atau pembacaan waktu diperbarui. Persistensi
  perintah, pembersihan sesi CLI, kedalaman subagen, override autentikasi, dan
  identitas sesi transkrip menggunakan API baris agen/sesi. Penulisan diterapkan
  sebagai patch baris SQLite dengan percobaan ulang konflik optimistis.
- Resolusi target sesi kini mengekspos target database per agen, bukan jalur
  `sessions.json` lama. Gateway bersama, metadata ACP, perbaikan rute doctor, dan
  `openclaw sessions` menghitung `agent_databases` plus agen yang dikonfigurasi.
- Perutean sesi Gateway kini menggunakan `resolveGatewaySessionDatabaseTarget`;
  target yang dikembalikan membawa `databasePath` dan kandidat kunci baris
  SQLite, bukan jalur file penyimpanan sesi lama.
- Tipe runtime sesi kanal kini mengekspos `{agentId, sessionKey}` untuk
  pembacaan waktu diperbarui, metadata masuk, dan pembaruan rute terakhir. Tipe
  kompatibilitas lama `saveSessionStore(storePath, store)` sudah hilang.
- Runtime Plugin, API ekstensi, dan permukaan barrel `config/sessions` kini
  mengarahkan kode Plugin ke helper baris sesi berbasis SQLite. Ekspor
  kompatibilitas pustaka root (`loadSessionStore`, `saveSessionStore`,
  `resolveStorePath`) tetap ada sebagai shim yang sudah usang untuk konsumen
  yang ada. Helper lama `resolveLegacySessionStorePath` sudah hilang; konstruksi
  jalur `sessions.json` lama kini lokal untuk migrasi dan fixture test.
- `src/config/sessions/session-entries.sqlite.ts` kini menyimpan entri sesi
  kanonis di database per agen dan memiliki dukungan patch baca/upsert/hapus
  tingkat baris. Upsert/patch/hapus runtime tidak lagi memindai varian huruf
  besar-kecil atau memangkas kunci alias lama; doctor memiliki tanggung jawab
  kanonisasi. Helper impor JSON mandiri sudah hilang, dan migrasi menggabungkan
  upsert baris yang lebih baru alih-alih mengganti seluruh tabel sesi. Helper
  baca/daftar/muat publik memproyeksikan metadata sesi panas dari baris
  `sessions` dan `conversations` bertipe; `entry_json` adalah bayangan
  kompatibilitas/debug dan dapat usang atau tidak valid tanpa kehilangan
  identitas sesi bertipe atau konteks pengiriman.
- `src/config/sessions/delivery-info.ts` kini menyelesaikan konteks pengiriman
  dari baris per agen bertipe `sessions` + `conversations` +
  `session_conversations`. Ia tidak lagi merekonstruksi identitas pengiriman
  runtime dari `session_entries.entry_json`; baris percakapan bertipe yang hilang
  adalah masalah migrasi/perbaikan doctor, bukan fallback runtime.
- Keputusan reset sesi tersimpan kini mengutamakan metadata bertipe
  `sessions.session_scope`, `sessions.chat_type`, dan `sessions.channel`.
  Penguraian `sessionKey` hanya tetap ada untuk sufiks thread/topik eksplisit
  pada target perintah; klasifikasi reset grup vs langsung tidak lagi berasal
  dari bentuk kunci.
- Klasifikasi tampilan daftar/status sesi kini menggunakan metadata chat bertipe
  dan jenis sesi Gateway. Ia tidak lagi memperlakukan substring `:group:` atau
  `:channel:` di dalam `session_key` sebagai kebenaran tahan lama untuk
  grup/langsung.
- Pemilihan kebijakan balasan senyap kini hanya menggunakan tipe percakapan
  eksplisit atau metadata permukaan. Ia tidak lagi menebak kebijakan langsung/grup
  dari substring `session_key`.
- Resolusi model tampilan sesi kini menerima id agen dari target database sesi
  SQLite alih-alih memisahkannya dari `session_key`.
- Hidrasi target pengumuman agen-ke-agen kini hanya menggunakan
  `deliveryContext` bertipe dari `sessions.list`. Ia tidak lagi memulihkan
  perutean kanal/akun/thread dari `origin` lama, field `last*` yang dicerminkan,
  atau bentuk `session_key`.
- Penolakan target thread `sessions_send` kini membaca metadata perutean SQLite
  bertipe. Ia tidak lagi menolak atau menerima target dengan mengurai sufiks
  thread dari kunci target.
- Validasi kebijakan alat bercakupan grup kini membaca perutean percakapan
  SQLite bertipe untuk sesi saat ini atau sesi yang diluncurkan. Ia tidak lagi
  mempercayai identitas grup/kanal dengan mendekode `sessionKey`; id grup yang
  disediakan pemanggil dibuang ketika tidak ada baris sesi bertipe yang
  menjaminnya.
- Pencocokan override model kanal kini menggunakan metadata grup dan percakapan
  induk eksplisit. Ia tidak lagi mendekode id percakapan induk dari
  `parentSessionKey`.
- Pewarisan override model tersimpan kini membutuhkan kunci sesi induk eksplisit
  dari konteks sesi bertipe. Ia tidak lagi menurunkan override induk dari sufiks
  `:thread:` atau `:topic:` di `sessionKey`.
- Wrapper info thread sesi lama dan parser thread Plugin yang dimuat sudah
  hilang; tidak ada kode runtime yang mengimpor `config/sessions/thread-info`.
- Helper percakapan kanal tidak lagi mengekspos bridge penguraian kunci sesi
  penuh. Core masih menormalkan id percakapan mentah milik penyedia melalui
  `resolveSessionConversation(...)`, tetapi tidak merekonstruksi fakta rute dari
  `sessionKey`.
- Pengiriman penyelesaian, kebijakan kirim, dan pemeliharaan tugas tidak lagi
  menurunkan tipe chat dari bentuk `session_key`. Parser kunci tipe chat lama
  telah dihapus; jalur ini membutuhkan metadata sesi bertipe, konteks pengiriman
  bertipe, atau kosakata target pengiriman eksplisit.
- Daftar/status sesi, diagnostik, pengikatan akun persetujuan, pemfilteran
  Heartbeat TUI, dan ringkasan penggunaan tidak lagi menambang
  `SessionEntry.origin` untuk perutean penyedia/akun/thread/tampilan. Pembacaan
  `origin` runtime yang tersisa hanya konsep non-sesi atau objek pengiriman
  giliran saat ini.
- Pencarian percakapan native untuk permintaan persetujuan kini membaca baris
  perutean sesi per agen bertipe. Ia tidak lagi mengurai identitas percakapan
  kanal/grup/thread dari `sessionKey`; metadata bertipe yang hilang adalah
  masalah migrasi/perbaikan.
- Payload peristiwa sesi berubah/chat/sesi Gateway tidak lagi menggemakan
  `SessionEntry.origin` atau bayangan rute `last*`; klien menerima `channel`,
  `chatType`, dan `deliveryContext` bertipe.
- Resolusi pengiriman Heartbeat kini dapat menerima `deliveryContext` SQLite
  bertipe secara langsung, dan runtime heartbeat meneruskan baris pengiriman
  sesi per agen alih-alih bergantung pada bayangan kompatibilitas
  `session_entries` untuk perutean saat ini.
- Resolusi target pengiriman agen terisolasi Cron juga menghidrasi rute saat ini
  dari baris pengiriman sesi per agen bertipe sebelum fallback ke payload entri
  kompatibilitas.
- Resolusi asal pengumuman subagen kini meneruskan konteks pengiriman sesi
  peminta bertipe melalui `loadRequesterSessionEntry` dan mengutamakan baris itu
  dibanding bayangan kompatibilitas `last*`/`deliveryContext`.
- Pembaruan metadata sesi masuk kini digabungkan terlebih dahulu terhadap baris
  pengiriman per agen bertipe; field pengiriman `SessionEntry` lama hanya menjadi
  fallback ketika tidak ada baris percakapan bertipe.
- Ekstraksi pengiriman restart/update kini membiarkan `threadId` pengiriman
  SQLite bertipe mengalahkan fragmen topik/thread yang diurai dari `sessionKey`;
  penguraian hanya menjadi fallback untuk kunci lama berbentuk thread.
- Id kanal konteks agen hook kini mengutamakan identitas percakapan SQLite
  bertipe, lalu metadata pesan eksplisit. Mereka tidak lagi mengurai fragmen
  penyedia/grup/kanal dari `sessionKey`.
- Pewarisan rute eksternal `chat.send` Gateway kini membaca metadata perutean
  sesi SQLite bertipe alih-alih menyimpulkan cakupan kanal/langsung/grup dari
  potongan `sessionKey`. Sesi bercakupan kanal hanya mewarisi ketika kanal sesi
  bertipe dan tipe chat cocok dengan konteks pengiriman tersimpan; sesi utama
  bersama mempertahankan aturan CLI/tanpa-metadata-klien yang lebih ketat.
- Wake sentinel restart dan perutean kelanjutan kini membaca baris
  pengiriman/perutean SQLite bertipe sebelum mengantrekan wake Heartbeat atau
  kelanjutan giliran agen yang dirutekan. Ia tidak lagi merekonstruksi konteks
  pengiriman dari bayangan JSON entri sesi.
- Resolusi konteks `tools.effective` Gateway kini membaca baris
  pengiriman/perutean SQLite bertipe untuk input penyedia, akun, target, thread,
  dan mode balasan. Ia tidak lagi memulihkan field perutean panas tersebut dari
  bayangan asal `session_entries.entry_json` yang usang.
- Perutean konsultasi suara realtime kini menyelesaikan pengiriman induk/panggilan
  dari baris sesi SQLite per agen bertipe. Ia tidak lagi fallback ke bayangan
  kompatibilitas `SessionEntry.deliveryContext` saat memilih rute pesan agen
  tertanam.
- Relay Heartbeat spawn ACP dan perutean stream induk kini membaca pengiriman
  induk dari baris sesi SQLite bertipe. Mereka tidak lagi merekonstruksi konteks
  pengiriman induk dari bayangan entri sesi kompatibilitas.
- Preservasi rute pengiriman sesi kini mengikuti metadata chat bertipe dan kolom
  pengiriman yang dipersistenkan. Ia tidak lagi mengekstrak petunjuk kanal,
  penanda langsung/utama, atau bentuk thread dari `sessionKey`; rute webchat
  internal hanya mewarisi target eksternal ketika SQLite sudah memiliki identitas
  pengiriman bertipe/terpersisten untuk sesi tersebut.
- Ekstraksi pengiriman sesi generik kini hanya membaca baris pengiriman sesi
  SQLite bertipe yang tepat. Ia tidak lagi mengurai sufiks thread/topik atau
  fallback dari kunci berbentuk thread ke kunci sesi dasar.
- Dispatch balasan, pemulihan sentinel restart, dan perutean konsultasi suara
  realtime kini menggunakan baris sesi/percakapan SQLite bertipe yang tepat untuk
  perutean thread. Mereka tidak lagi memulihkan id thread atau konteks pengiriman
  sesi dasar dengan mengurai kunci sesi berbentuk thread.
- Pembatasan riwayat PI tertanam kini menggunakan proyeksi perutean sesi SQLite
  bertipe (`sessions` + `conversations` primer) untuk penyedia, tipe chat, dan
  identitas peer. Ia tidak lagi mengurai bentuk penyedia, DM, grup, atau thread
  dari `sessionKey`.
- Inferensi pengiriman alat Cron kini hanya menggunakan pengiriman eksplisit atau
  konteks pengiriman bertipe saat ini. Ia tidak lagi mendekode target kanal,
  peer, akun, atau thread dari `agentSessionKey`.
- Baris sesi runtime tidak lagi membawa alias rute lama `lastProvider`. Helper
  dan test menggunakan field `lastChannel` dan `deliveryContext` bertipe; migrasi
  doctor adalah satu-satunya tempat yang seharusnya menerjemahkan alias rute lama
  atau bayangan `origin` yang dipersistenkan.
- Peristiwa transkrip, baris VFS, dan baris artefak alat kini ditulis ke database
  per agen. Tabel pemetaan file transkrip global yang belum pernah dirilis sudah
  hilang; doctor mencatat jalur sumber lama dalam baris migrasi tahan lama sebagai
  gantinya.
- Pencarian transkrip runtime tidak lagi memindai offset byte JSONL atau
  memeriksa file transkrip lama. Jalur chat/media/riwayat Gateway membaca baris
  transkrip dari SQLite; JSONL sesi kini hanya input doctor lama, bukan status
  runtime atau format ekspor.
- Relasi induk dan cabang transkrip menggunakan metadata terstruktur
  `parentTranscriptScope: {agentId, sessionId}` di header transkrip SQLite, bukan
  string pelacak mirip jalur `agent-db:...transcript_events...`.
- Kontrak manajer transkrip tidak lagi mengekspos konstruktor tersimpan implisit
  `create(cwd)` atau `continueRecent(cwd)`. Manajer transkrip tersimpan dibuka
  dengan cakupan eksplisit `{agentId, sessionId}`; hanya manajer dalam memori
  yang tetap bebas cakupan untuk test dan transformasi transkrip murni.
- API penyimpanan transkrip runtime menyelesaikan cakupan SQLite, bukan jalur
  filesystem. Helper lama `resolve...ForPath` dan opsi tulis `transcriptPath`
  yang tidak digunakan sudah hilang dari pemanggil runtime.
- Resolusi sesi runtime kini menggunakan `{agentId, sessionId}` dan tidak boleh
  menurunkan string `sqlite-transcript://<agent>/<session>` untuk batas eksternal.
  Jalur JSONL absolut lama hanya input migrasi doctor.
- Catatan bridge langsung relay hook native kini berada di baris bersama bertipe
  `native_hook_relay_bridges` yang dikunci oleh id relay. Runtime tidak lagi
  menulis registry JSON `/tmp` atau catatan generik buram untuk catatan bridge
  berumur pendek tersebut.
- `runEmbeddedPiAgent(...)` tidak lagi memiliki parameter pelacak transkrip.
  Deskriptor worker yang disiapkan juga menghilangkan lokator transkrip. Status sesi runtime
  dan run tindak lanjut yang diantrekan membawa `{agentId, sessionId}` alih-alih
  handle transkrip turunan.
- Compaction tertanam sekarang mengambil cakupan SQLite dari `agentId` dan `sessionId`.
  Hook Compaction, panggilan context-engine, delegasi CLI, dan balasan protokol
  tidak boleh menerima handle `sqlite-transcript://...` turunan. Kode
  ekspor/debug dapat mematerialkan artefak pengguna eksplisit dari baris, tetapi tidak menyediakan
  jalur ekspor JSONL sesi generik atau mengumpankan nama file kembali ke identitas
  runtime.
- `/export-session` membaca baris transkrip dari SQLite dan hanya menulis tampilan
  HTML mandiri yang diminta. Viewer tertanam tidak lagi merekonstruksi atau
  mengunduh JSONL sesi dari baris tersebut.
- Delegasi context-engine tidak lagi mengurai lokator transkrip untuk memulihkan
  identitas agen. Konteks runtime yang disiapkan membawa `agentId` yang telah
  di-resolve ke adapter Compaction bawaan.
- Penulisan ulang transkrip dan pemotongan hasil tool langsung sekarang membaca dan
  mempertahankan status transkrip berdasarkan `{agentId, sessionId}` dan tidak menurunkan
  lokator sementara untuk payload peristiwa pembaruan transkrip.
- Permukaan helper status transkrip tidak lagi memiliki varian berbasis lokator
  `readTranscriptState`, `replaceTranscriptStateEvents`, atau
  `persistTranscriptStateMutation`. Pemanggil runtime harus menggunakan API
  `{agentId, sessionId}`. Impor Doctor membaca file warisan melalui jalur file
  eksplisit dan menulis baris SQLite; ia tidak memigrasikan string lokator.
- Kontrak session-manager runtime tidak lagi mengekspos `open(locator)`,
  `forkFrom(locator)`, atau `setTranscriptLocator(...)`. Manajer sesi persisten
  hanya dibuka berdasarkan `{agentId, sessionId}`; helper list/fork berada pada
  API sesi dan checkpoint berorientasi baris, bukan pada fasad manajer transkrip.
- API pembaca transkrip Gateway mengutamakan cakupan. API tersebut menerima
  `{agentId, sessionId}` dan tidak menerima lokator transkrip posisional yang
  dapat tidak sengaja menjadi identitas runtime. Penguraian lokator transkrip aktif
  telah dihapus; jalur sumber warisan hanya dibaca oleh kode impor Doctor.
- Peristiwa pembaruan transkrip juga mengutamakan cakupan. `emitSessionTranscriptUpdate`
  tidak lagi menerima string lokator polos, dan listener merutekan berdasarkan
  `{agentId, sessionId}` tanpa mengurai handle.
- Broadcast session-message Gateway me-resolve kunci sesi dari cakupan agen/sesi,
  bukan dari lokator transkrip. Resolver/cache kunci transcript-locator-to-session
  lama telah dihapus.
- Filter SSE session-history Gateway memfilter pembaruan langsung berdasarkan cakupan
  agen/sesi. Ia tidak lagi mengkanonikalisasi kandidat lokator transkrip, realpath,
  atau identitas transkrip berbentuk file untuk memutuskan apakah sebuah stream harus
  menerima pembaruan.
- Hook siklus hidup sesi tidak lagi menurunkan atau mengekspos lokator transkrip pada
  `session_end`. Konsumen hook mendapatkan `sessionId`, `sessionKey`, id sesi berikutnya,
  dan konteks agen; file transkrip bukan bagian dari kontrak siklus hidup.
- Hook reset juga tidak lagi menurunkan atau mengekspos lokator transkrip. Payload
  `before_reset` membawa pesan SQLite yang dipulihkan beserta alasan reset, sementara
  identitas sesi tetap berada dalam konteks hook.
- Reset harness agen tidak lagi menerima lokator transkrip. Dispatch reset dicakup
  oleh `sessionId`/`sessionKey` beserta alasan.
- Tipe sesi ekstensi agen tidak lagi mengekspos `transcriptLocator`; ekstensi sebaiknya
  menggunakan konteks sesi dan API runtime, bukan meraih identitas transkrip berbentuk file.
- Hook Compaction Plugin tidak lagi mengekspos lokator transkrip. Konteks hook sudah
  membawa identitas sesi, dan pembacaan transkrip harus melalui API sadar-cakupan SQLite
  alih-alih handle berbentuk file.
- Hook `before_agent_finalize` tidak lagi mengekspos `transcriptPath`, termasuk payload
  relay hook native. Hook finalisasi hanya menggunakan konteks sesi.
- Respons reset Gateway tidak lagi menyintesis lokator transkrip pada entri yang
  dikembalikan. Reset membuat baris transkrip SQLite, mengembalikan entri sesi bersih,
  dan menyerahkan akses transkrip kepada pembaca sadar-cakupan.
- Hasil run tertanam dan Compaction tidak lagi menampilkan lokator transkrip untuk
  akuntansi sesi. Compaction otomatis hanya memperbarui `sessionId` aktif, penghitung
  Compaction, dan metadata token.
- Hasil percobaan tertanam tidak lagi mengembalikan `transcriptLocatorUsed`, dan hasil
  `compact()` context-engine tidak lagi mengembalikan lokator transkrip. Loop retry
  runtime hanya menerima `sessionId` penerus.
- Hasil append transkrip delivery-mirror tidak lagi mengembalikan lokator transkrip.
  Pemanggil mendapatkan `messageId` yang ditambahkan; sinyal pembaruan transkrip
  menggunakan cakupan SQLite.
- Helper fork sesi induk hanya mengembalikan `sessionId` hasil fork. Persiapan subagen
  meneruskan cakupan agen/sesi anak ke engine.
- Parameter runner CLI dan reseeding riwayat tidak lagi menerima lokator transkrip.
  Pembacaan riwayat CLI me-resolve cakupan transkrip SQLite dari `{agentId,
sessionId}` dan konteks kunci sesi.
- Fixture pengujian CLI dan embedded-runner sekarang men-seed dan membaca baris
  transkrip SQLite berdasarkan id sesi alih-alih berpura-pura sesi aktif adalah
  file `*.jsonl` atau meneruskan string `sqlite-transcript://...` melalui parameter runtime.
- Peristiwa guard hasil tool sesi dipancarkan dari cakupan sesi yang diketahui bahkan
  ketika manajer dalam memori tidak memiliki lokator turunan. Pengujiannya tidak lagi
  memalsukan file transkrip aktif `/tmp/*.jsonl`.
- Helper BTW dan compaction-checkpoint sekarang membaca dan melakukan fork baris transkrip
  berdasarkan cakupan SQLite. Metadata checkpoint sekarang hanya menyimpan id sesi dan
  id leaf/entry; lokator turunan tidak lagi ditulis ke payload checkpoint.
- Lookup transcript-key Gateway menggunakan cakupan transkrip SQLite pada batas protokol
  dan tidak lagi melakukan realpath atau stat pada nama file transkrip.
- Rotasi transkrip Compaction otomatis menulis baris transkrip penerus langsung melalui
  penyimpanan transkrip SQLite. Baris sesi hanya menyimpan identitas sesi penerus,
  bukan jalur JSONL tahan lama atau lokator yang dipersistenkan.
- Compaction context-engine tertanam menggunakan helper rotasi transkrip bernama SQLite.
  Pengujian rotasi tidak lagi membuat jalur penerus JSONL atau memodelkan sesi aktif
  sebagai file.
- Retensi gambar keluar terkelola mengunci cache transcript-message dari statistik
  transkrip SQLite alih-alih panggilan stat filesystem.
- Lock sesi runtime dan lane Doctor `.jsonl.lock` warisan mandiri
  telah dihapus.
- Barrel runtime Microsoft Teams dan SDK Plugin publik tidak lagi mengekspor ulang
  helper file-lock lama; jalur status Plugin tahan lama didukung SQLite.
- Pemangkasan umur/jumlah sesi dan pembersihan sesi eksplisit telah dihapus.
  Doctor memiliki impor warisan; sesi usang di-reset atau dihapus secara eksplisit.
- Pemeriksaan integritas Doctor tidak lagi menghitung file JSONL warisan sebagai
  transkrip aktif yang valid untuk baris sesi SQLite. Kesehatan transkrip aktif
  hanya SQLite; file JSONL warisan dilaporkan sebagai input migrasi/pembersihan yatim.
- Doctor tidak lagi memperlakukan `agents/<agent>/sessions/` sebagai status runtime
  yang wajib. Ia hanya memindai direktori tersebut ketika sudah ada, sebagai input
  impor warisan atau pembersihan yatim.
- `sessions.resolve` Gateway, jalur patch/reset/compact sesi, spawning subagen,
  abort cepat, metadata ACP, sesi terisolasi Heartbeat, dan patching TUI tidak lagi
  memigrasikan atau memangkas kunci sesi warisan sebagai efek samping pekerjaan runtime
  normal.
- Resolusi sesi perintah CLI sekarang mengembalikan `agentId` pemilik alih-alih
  `storePath`, dan tidak lagi menyalin baris main-session warisan selama resolusi
  `--to` atau `--session-id` normal. Kanonikalisasi main-row warisan hanya milik Doctor.
- Resolusi kedalaman subagen runtime tidak lagi membaca `sessions.json` atau penyimpanan
  sesi JSON5. Ia membaca `session_entries` SQLite berdasarkan id agen, dan metadata
  kedalaman/sesi warisan hanya dapat masuk melalui jalur impor Doctor.
- Override sesi profil auth dipersistenkan melalui upsert baris langsung
  `{agentId, sessionKey}` alih-alih lazy-loading runtime penyimpanan sesi berbentuk file.
- Gating verbose auto-reply dan helper pembaruan sesi sekarang membaca/upsert baris
  sesi SQLite berdasarkan identitas sesi dan tidak lagi memerlukan jalur penyimpanan
  warisan sebelum menyentuh status baris yang dipersistenkan.
- Helper metadata sesi command-run sekarang menggunakan nama dan jalur modul berorientasi
  entri; permukaan helper perintah `session-store` lama telah dihapus.
- Seeding header bootstrap dan pengerasan batas Compaction manual sekarang memutasi
  baris transkrip SQLite secara langsung. Pemanggil runtime meneruskan identitas sesi,
  bukan jalur `.jsonl` yang dapat ditulis.
- Replay rotasi sesi senyap menyalin giliran pengguna/asisten terbaru berdasarkan
  `{agentId, sessionId}` dari baris transkrip SQLite. Ia tidak lagi menerima lokator
  transkrip sumber atau target.
- Baris sesi runtime baru tidak lagi menyimpan lokator transkrip. Pemanggil menggunakan
  `{agentId, sessionId}` secara langsung; perintah ekspor/debug dapat memilih nama file
  output ketika mematerialkan baris.
- Memulai sesi transkrip persisten baru sekarang selalu membuka baris SQLite berdasarkan
  cakupan. Manajer sesi tidak lagi menggunakan ulang jalur atau lokator transkrip era file
  sebelumnya sebagai identitas untuk sesi baru.
- Sesi transkrip persisten menggunakan API eksplisit
  `openTranscriptSessionManagerForSession({agentId, sessionId})`. Fasad statis lama
  `SessionManager.create/openForSession/list/forkFromSession` telah dihapus agar pengujian
  dan kode runtime tidak dapat tidak sengaja membuat ulang penemuan sesi era file.
- Runtime Plugin tidak lagi mengekspos `api.runtime.agent.session.resolveTranscriptLocatorPath`;
  kode Plugin menggunakan helper baris SQLite dan nilai cakupan.
- Permukaan SDK publik `session-store-runtime` sekarang hanya mengekspor helper baris sesi
  dan baris transkrip. Helper skema/jalur/transaksi SQLite yang terfokus berada di
  `sqlite-runtime`; helper open/close/reset mentah tetap hanya lokal untuk pengujian
  first-party.
- Pengklasifikasi nama file trajectory/checkpoint `.jsonl` warisan sekarang berada di
  modul file sesi warisan Doctor. Validasi sesi inti tidak lagi mengimpor helper artefak
  file untuk memutuskan id sesi SQLite normal.
- Run subagen pemblokiran active-memory menggunakan baris transkrip SQLite alih-alih
  membuat file `session.jsonl` sementara atau persisten di bawah status Plugin. Opsi
  `transcriptDir` lama dihapus.
- Pembuatan slug sekali pakai dan run planner Crestodian menggunakan baris transkrip
  SQLite alih-alih membuat file `session.jsonl` sementara.
- Run helper `llm-task` dan ekstraksi komitmen tersembunyi juga menggunakan baris transkrip
  SQLite, sehingga sesi helper khusus model ini tidak lagi membuat file transkrip JSON/JSONL
  sementara.
- `TranscriptSessionManager` sekarang hanya merupakan cakupan transkrip SQLite yang dibuka.
  Kode runtime membukanya dengan `openTranscriptSessionManagerForSession({agentId,
sessionId})`; alur create, branch, continue, list, dan fork berada dalam helper baris
  SQLite pemiliknya, bukan fasad manajer statis.
  Kode Doctor/impor/debug menangani file sumber warisan eksplisit di luar manajer sesi
  runtime.
- Metode fasad usang `SessionManager.newSession()` dan
  `SessionManager.createBranchedSession()` telah dihapus. Sesi baru dan turunan transkrip
  dibuat oleh workflow SQLite pemiliknya alih-alih memutasi manajer yang sudah dibuka
  menjadi sesi persisten yang berbeda.
- Keputusan fork transkrip induk dan pembuatan fork tidak lagi menerima
  `storePath` atau `sessionsDir`; keduanya menggunakan cakupan transkrip SQLite
  `{agentId, sessionId}` alih-alih metadata jalur filesystem yang dipertahankan.
- Memory-host tidak lagi mengekspor helper klasifikasi transkrip direktori sesi no-op;
  pemfilteran transkrip sekarang diturunkan dari metadata baris SQLite selama konstruksi entri.
- Pengujian ekspor sesi Memory-host dan QMD menggunakan cakupan transkrip SQLite. Jalur lama
  `agents/<agentId>/sessions/*.jsonl` tetap tercakup hanya ketika pengujian sengaja
  membuktikan kompatibilitas Doctor/impor/ekspor.
- Inspeksi sesi mentah QA-lab sekarang menggunakan `sessions.list` melalui Gateway
  alih-alih membaca `agents/qa/sessions/sessions.json`; umpan balik MSteams
  menambahkan langsung ke transkrip SQLite tanpa membuat jalur JSONL buatan.
- Giliran channel masuk bersama kini membawa `{agentId, sessionKey}` alih-alih
  `storePath` lama. Jalur perekaman LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch, dan QQBot kini membaca metadata updated-at dan merekam baris sesi
  masuk melalui identitas SQLite.
- Persistensi pencari transkrip dihapus dari baris sesi aktif.
  `resolveSessionTranscriptTarget` mengembalikan `agentId`, `sessionId`, dan metadata
  topik opsional; doctor adalah satu-satunya kode yang mengimpor nama file transkrip
  lama.
- Header transkrip runtime dimulai pada versi SQLite `1`. Peningkatan bentuk JSONL
  V1/V2/V3 lama hanya ada di impor doctor dan menormalkan header yang diimpor ke
  versi transkrip SQLite saat ini sebelum baris disimpan.
- Guard database-first kini melarang `SessionManager.listAll` dan
  `SessionManager.forkFromSession`; alur kerja daftar sesi dan fork/restore
  harus tetap berada pada API SQLite berbasis baris/lingkup.
- Guard tersebut juga melarang nama helper parse JSONL transkrip lama/perbaikan
  cabang aktif di luar kode doctor/impor, sehingga runtime tidak dapat menumbuhkan
  jalur migrasi transkrip lama kedua.
- Proses PI tertanam menolak handle transkrip masuk. Proses tersebut menggunakan
  identitas SQLite `{agentId, sessionId}` sebelum peluncuran worker dan sekali lagi
  sebelum percobaan menyentuh status transkrip. Input `/tmp/*.jsonl` usang tidak
  dapat memilih target tulis runtime.
- Rekaman jejak cache, payload Anthropic, stream mentah, dan lini masa diagnostik
  kini ditulis ke baris SQLite `diagnostic_events` bertipe. Bundel stabilitas Gateway
  kini ditulis ke baris SQLite `diagnostic_stability_bundles` bertipe. Jalur override
  JSONL lama `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE`, dan
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` dihapus, dan penangkapan stabilitas normal
  tidak lagi menulis file `logs/stability/*.json`.
- Persistensi Cron kini merekonsiliasi baris SQLite `cron_jobs` alih-alih
  menghapus/menyisipkan ulang seluruh tabel job pada setiap penyimpanan. Writeback
  target Plugin memperbarui baris cron yang cocok secara langsung dan menjaga status
  cron runtime dalam transaksi database status yang sama.
- Pemanggil runtime Cron kini menggunakan kunci store cron SQLite yang stabil. Jalur
  `cron.store` lama hanya menjadi input impor doctor; jalur production gateway,
  pemeliharaan task, status, run-log, dan writeback target Telegram menggunakan
  `resolveCronStoreKey` dan tidak lagi menormalkan kunci sebagai jalur. Status Cron
  kini melaporkan `storeKey` alih-alih field `storePath` lama yang berbentuk file.
- Pemuatan dan penjadwalan runtime Cron tidak lagi menormalkan bentuk job tersimpan
  lama seperti `jobId`, `schedule.cron`, `atMs` numerik, boolean string, atau
  `sessionTarget` yang hilang. Impor lama doctor memiliki perbaikan tersebut sebelum
  baris disisipkan ke SQLite.
- Spawn ACP tidak lagi me-resolve atau mempertahankan jalur file JSONL transkrip.
  Penyiapan spawn dan thread-bind mempertahankan baris sesi SQLite secara langsung
  dan menjaga id sesi sebagai identitas transkrip yang dipertahankan.
- API metadata sesi ACP kini membaca/mendaftar/upsert baris SQLite berdasarkan
  `agentId` dan tidak lagi mengekspos `storePath` sebagai bagian dari kontrak entri
  sesi ACP.
- Akuntansi penggunaan sesi dan agregasi penggunaan gateway kini me-resolve transkrip
  hanya berdasarkan `{agentId, sessionId}`. Cache biaya/penggunaan dan ringkasan sesi
  yang ditemukan tidak lagi menyintesis atau mengembalikan string pencari transkrip.
- Penambahan chat Gateway, persistensi abort-partial, `/sessions.send`, dan penulisan
  transkrip media webchat menambahkan langsung melalui lingkup transkrip SQLite.
  Helper injeksi transkrip gateway tidak lagi menerima parameter
  `transcriptLocator`.
- Penemuan transkrip SQLite kini hanya mencantumkan lingkup dan statistik transkrip:
  `{agentId, sessionId, updatedAt, eventCount}`. Helper kompatibilitas mati
  `listSqliteSessionTranscriptLocators` dan field `locator` per baris telah hilang.
- Runtime perbaikan transkrip kini hanya mengekspos
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. Helper perbaikan lama
  berbasis locator dihapus; kode doctor/debug membaca jalur file sumber eksplisit dan
  tidak pernah memigrasikan string locator.
- Runtime ledger replay ACP kini menyimpan baris replay per sesi di database status
  SQLite bersama alih-alih `acp/event-ledger.json`; doctor mengimpor dan menghapus
  file lama.
- Helper pembaca transkrip Gateway kini berada di
  `src/gateway/session-transcript-readers.ts` alih-alih nama modul lama
  `session-utils.fs`. Pemeriksaan riwayat percobaan ulang fallback dinamai untuk
  konten transkrip SQLite alih-alih permukaan helper file lama.
- Helper injected-chat dan compaction Gateway kini meneruskan lingkup transkrip SQLite
  melalui API helper internal alih-alih menamai nilai sebagai jalur transkrip atau
  file sumber.
- Deteksi kelanjutan bootstrap kini memeriksa baris transkrip SQLite melalui
  `hasCompletedBootstrapTranscriptTurn`; deteksi ini tidak lagi mengekspos nama
  helper berbentuk file.
- Test embedded-runner kini menggunakan identitas transkrip SQLite, dan membuka
  manajer transkrip baru selalu memerlukan `sessionId` eksplisit.
- Helper pengindeksan memori kini menggunakan terminologi transkrip SQLite dari awal
  hingga akhir: host mengekspor `listSessionTranscriptScopesForAgent` dan
  `sessionTranscriptKeyForScope`, antrean sinkronisasi bertarget `sessionTranscripts`,
  hasil pencarian sesi publik mengekspos jalur buram `transcript:<agent>:<session>`,
  dan kunci sumber DB internal adalah `session:<session>` di bawah
  `source_kind='sessions'` alih-alih jalur file palsu.
- Helper dedupe persisten SDK Plugin generik tidak lagi mengekspos opsi berbentuk
  file. Pemanggil menyediakan kunci lingkup SQLite dan baris dedupe tahan lama berada
  di status plugin bersama.
- Token SSO Microsoft Teams dipindahkan dari file JSON terkunci ke status Plugin
  SQLite. Doctor mengimpor `msteams-sso-tokens.json`, membangun ulang kunci token SSO
  kanonis dari payload, dan menghapus file sumber. Token OAuth terdelegasi tetap pada
  batas file kredensial privat yang sudah ada.
- Status cache sinkronisasi Matrix dipindahkan dari `bot-storage.json` ke status
  Plugin SQLite. Doctor mengimpor payload sinkronisasi lama yang mentah atau
  terbungkus dan menghapus file sumber. Klien Matrix aktif dan QA Matrix meneruskan
  direktori root sync-store SQLite, bukan jalur `sync-store.json` atau
  `bot-storage.json` palsu.
- Status migrasi kripto lama Matrix dipindahkan dari
  `legacy-crypto-migration.json` ke status Plugin SQLite. Doctor mengimpor file
  status lama; snapshot IndexedDB Matrix SDK dipindahkan dari
  `crypto-idb-snapshot.json` ke blob Plugin SQLite. Kunci pemulihan dan kredensial
  Matrix adalah baris status Plugin SQLite; file JSON lamanya hanya menjadi input
  migrasi doctor.
- Log aktivitas Memory Wiki kini menggunakan status Plugin SQLite alih-alih
  `.openclaw-wiki/log.jsonl`. Penyedia migrasi Memory Wiki mengimpor log JSONL lama;
  markdown wiki dan konten vault pengguna tetap berbasis file sebagai konten workspace.
- Memory Wiki tidak lagi membuat `.openclaw-wiki/state.json` atau direktori
  `.openclaw-wiki/locks` yang tidak digunakan. Penyedia migrasi menghapus file
  metadata plugin yang dihentikan tersebut jika vault lama masih memilikinya.
- Entri audit Crestodian kini menggunakan status Plugin SQLite inti alih-alih
  `audit/crestodian.jsonl`. Doctor mengimpor log audit JSONL lama dan menghapusnya
  setelah impor berhasil.
- Entri audit tulis/amati config kini menggunakan status Plugin SQLite inti alih-alih
  `logs/config-audit.jsonl`. Doctor mengimpor log audit JSONL lama dan menghapusnya
  setelah impor berhasil.
- Pendamping macOS tidak lagi menulis sidecar lokal aplikasi
  `logs/config-audit.jsonl` atau `logs/config-health.json` saat mengedit
  `openclaw.json`. File config tetap berbasis file, snapshot pemulihan tetap berada
  di sebelah file config, dan status audit/kesehatan config tahan lama menjadi milik
  store SQLite Gateway.
- Persetujuan tertunda rescue Crestodian kini menggunakan status Plugin SQLite inti
  alih-alih `crestodian/rescue-pending/*.json`. Doctor mengimpor file persetujuan
  tertunda lama dan menghapusnya setelah impor berhasil.
- Status arm sementara Phone Control kini menggunakan status Plugin SQLite alih-alih
  `plugins/phone-control/armed.json`. Doctor mengimpor file status arm lama ke
  namespace `phone-control/arm-state` dan menghapus file tersebut.
- Doctor tidak lagi memperbaiki transkrip JSONL di tempat atau membuat file JSONL
  cadangan. Doctor mengimpor cabang aktif ke SQLite dan menghapus sumber lama.
- Lookup transkrip hook session-memory menggunakan pembacaan SQLite hanya dengan
  lingkup `{agentId, sessionId}`. Helper-nya tidak lagi menerima atau menurunkan
  locator transkrip, pembacaan file lama, atau opsi penulisan ulang file.
- Binding percakapan app-server Codex kini memberi kunci status Plugin SQLite
  berdasarkan kunci sesi OpenClaw atau lingkup eksplisit `{agentId, sessionId}`.
  Binding tersebut tidak boleh mempertahankan binding fallback jalur transkrip.
- Pembacaan mirrored-history app-server Codex menggunakan lingkup transkrip SQLite
  saja; pembacaan tersebut tidak boleh memulihkan identitas dari jalur file transkrip.
- Jalur role-ordering dan reset compaction tidak lagi menghapus tautan file transkrip
  lama; reset hanya merotasi baris sesi SQLite dan identitas transkrip.
- Respons reset dan checkpoint Gateway mengembalikan baris sesi bersih plus id sesi.
  Respons tersebut tidak lagi menyintesis locator transkrip SQLite untuk klien.
- Dreaming memory-core tidak lagi memangkas baris sesi dengan memeriksa file JSONL
  yang hilang. Pembersihan subagent berjalan melalui API runtime sesi alih-alih
  pemeriksaan keberadaan filesystem. Test ingestion transkripnya menyemai baris
  SQLite secara langsung alih-alih membuat fixture `agents/<id>/sessions` atau
  placeholder locator.
- Pengindeksan transkrip memori dapat mengekspos `transcript:<agentId>:<sessionId>`
  sebagai jalur hasil pencarian virtual untuk helper sitasi/baca. Sumber indeks
  tahan lama bersifat relasional (`source_kind='sessions'`,
  `source_key='session:<sessionId>'`, `session_id=<sessionId>`), sehingga nilai ini
  bukan locator transkrip runtime, bukan jalur filesystem, dan tidak boleh pernah
  diteruskan kembali ke API runtime sesi.
- Status memori doctor Gateway membaca jumlah recall jangka pendek dan phase-signal
  dari baris status Plugin SQLite alih-alih `memory/.dreams/*.json`; output CLI dan
  doctor kini melabeli penyimpanan tersebut sebagai store SQLite, bukan jalur.
- Runtime memory-core, status CLI, metode doctor Gateway, dan facade SDK Plugin tidak
  lagi mengaudit atau mengarsipkan file lama `.dreams/session-corpus`. File tersebut
  hanya menjadi input migrasi; doctor mengimpornya ke SQLite dan menghapus sumber
  setelah verifikasi. Baris bukti session-ingestion aktif kini menggunakan jalur
  SQLite virtual `memory/session-ingestion/<day>.txt`; runtime tidak pernah menulis
  atau menurunkan status dari `.dreams/session-corpus`.
- Artefak publik memory-core mengekspos event host SQLite sebagai artefak JSON virtual
  `memory/events/memory-host-events.json`; artefak tersebut tidak lagi menggunakan
  ulang jalur sumber lama `.dreams/events.jsonl`.
- Registry container/browser sandbox kini menggunakan tabel SQLite bersama
  `sandbox_registry_entries` dengan kolom sesi, image, timestamp, backend/config,
  dan port browser bertipe. Doctor mengimpor file registry JSON lama monolitik dan
  tersharding serta menghapus sumber yang berhasil. Pembacaan runtime menggunakan
  kolom baris bertipe sebagai sumber kebenaran; `entry_json` hanya salinan
  replay/debug.
- Commitments kini menggunakan tabel bersama `commitments` bertipe alih-alih blob JSON
  seluruh store. Penyimpanan snapshot melakukan upsert berdasarkan id commitment dan
  hanya menghapus baris yang hilang alih-alih mengosongkan dan menyisipkan ulang
  tabel. Runtime memuat commitments dari kolom lingkup, delivery-window, status,
  attempt, dan teks bertipe; `record_json` hanya salinan replay/debug. Doctor
  mengimpor `commitments.json` lama dan menghapusnya setelah impor berhasil.
- Definisi job Cron, status jadwal, dan riwayat run tidak lagi memiliki penulis atau
  pembaca JSON runtime. Runtime menggunakan baris `cron_jobs` dengan jadwal bertipe,
  kolom payload, delivery, failure-alert, session, status, dan runtime-state plus metadata
  `cron_run_logs` bertipe untuk status, ringkasan diagnostik, status/error pengiriman,
  session/run, model, dan total token. `job_json` hanya salinan replay/debug; `state_json` menyimpan diagnostik
  runtime bersarang yang belum memiliki bidang kueri panas, sementara runtime
  merehidrasi bidang state panas dari kolom bertipe. Doctor mengimpor
  file `jobs.json`, `jobs-state.json`, dan `runs/*.jsonl` lama lalu menghapus
  sumber yang sudah diimpor. Writeback target Plugin memperbarui baris `cron_jobs`
  yang cocok, bukan memuat dan mengganti seluruh penyimpanan cron.
- Startup Gateway mengabaikan penanda `notify: true` lama dalam proyeksi
  runtime. Doctor menerjemahkannya menjadi pengiriman SQLite eksplisit saat
  `cron.webhook` valid, menghapus penanda inert saat tidak disetel, dan mempertahankannya
  dengan peringatan saat webhook yang dikonfigurasi tidak valid.
- Antrean pengiriman keluar dan session kini menyimpan status antrean, jenis entri,
  kunci session, channel, target, id akun, jumlah percobaan ulang, percobaan/error terakhir,
  state pemulihan, dan penanda pengiriman platform sebagai kolom bertipe dalam tabel bersama
  `delivery_queue_entries`. Pemulihan runtime membaca bidang panas tersebut dari
  kolom bertipe, dan mutasi retry/pemulihan memperbarui kolom tersebut secara langsung
  tanpa menulis ulang JSON replay. Payload JSON lengkap tetap hanya sebagai blob
  replay/debug untuk isi pesan dan data replay dingin lainnya.
- Record gambar keluar terkelola kini menggunakan baris bersama bertipe
  `managed_outgoing_image_records` dengan byte media tetap disimpan dalam
  `media_blobs`. Record JSON tetap hanya sebagai salinan replay/debug.
- Preferensi pemilih model Discord, hash deploy perintah, dan binding thread
  kini menggunakan state Plugin SQLite bersama. Rencana impor JSON lama mereka berada di permukaan
  migrasi setup/doctor Plugin Discord, bukan di kode migrasi core.
- Detektor impor lama Plugin menggunakan modul bernama doctor seperti
  `doctor-legacy-state.ts` atau `doctor-state-imports.ts`; modul runtime channel
  normal tidak boleh mengimpor detektor JSON lama.
- Kursor catchup BlueBubbles dan penanda dedupe inbound kini menggunakan state Plugin SQLite
  bersama. Rencana impor JSON lama mereka berada di permukaan
  migrasi setup/doctor Plugin BlueBubbles, bukan di kode migrasi core.
- Offset pembaruan Telegram, baris cache sticker, baris cache pesan terkirim,
  baris cache nama topik, dan binding thread kini menggunakan state Plugin SQLite
  bersama. Rencana impor JSON lama mereka berada di permukaan migrasi
  setup/doctor Plugin Telegram, bukan di kode migrasi core.
- Kursor catchup iMessage, pemetaan short-id balasan, dan baris dedupe sent-echo
  kini menggunakan state Plugin SQLite bersama. File lama `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl`, dan `imessage/sent-echoes.jsonl` hanya menjadi
  input doctor.
- Baris dedupe pesan Feishu kini menggunakan state Plugin SQLite bersama, bukan
  file `feishu/dedup/*.json`. Rencana impor JSON lamanya berada di permukaan
  migrasi setup/doctor Plugin Feishu, bukan di kode migrasi core.
- Percakapan Microsoft Teams, polling, buffer upload tertunda, dan pembelajaran
  feedback kini menggunakan tabel state/blob Plugin SQLite bersama. Jalur upload tertunda
  menggunakan `plugin_blob_entries` sehingga buffer media disimpan sebagai SQLite BLOB
  bukan JSON base64. Nama helper runtime kini menggunakan penamaan SQLite/state
  alih-alih penamaan penyimpanan-file `*-fs`, dan shim `storePath` lama hilang
  dari penyimpanan ini. Rencana impor JSON lamanya berada di permukaan migrasi
  setup/doctor Plugin Microsoft Teams.
- Media outbound yang di-host Zalo kini menggunakan SQLite bersama `plugin_blob_entries`
  bukan sidecar sementara JSON/bin `openclaw-zalo-outbound-media`.
- HTML dan metadata penampil diff kini menggunakan SQLite bersama `plugin_blob_entries`
  bukan file sementara `meta.json`/`viewer.html`. Output PNG/PDF yang dirender tetap
  menjadi materialisasi sementara karena pengiriman channel masih membutuhkan path file.
- Dokumen terkelola Canvas kini menggunakan SQLite bersama `plugin_blob_entries` alih-alih
  direktori default `state/canvas/documents`. Host Canvas menyajikan blob tersebut
  secara langsung; file lokal hanya dibuat untuk konten operator `host.root` eksplisit
  atau materialisasi sementara saat pembaca media downstream membutuhkan path.
- Keputusan audit File Transfer kini menggunakan SQLite bersama `plugin_state_entries`
  bukan log runtime `audit/file-transfer.jsonl` yang tak berbatas. Doctor
  mengimpor file audit JSONL lama ke state Plugin dan menghapus sumbernya
  setelah impor bersih.
- Lease proses ACPX dan identitas instance gateway kini menggunakan state Plugin SQLite bersama.
  Doctor mengimpor file lama `gateway-instance-id` ke state Plugin
  dan menghapus sumbernya.
- Skrip wrapper yang dihasilkan ACPX dan home Codex terisolasi adalah materialisasi
  sementara di bawah root sementara OpenClaw, bukan state OpenClaw yang tahan lama. Record
  runtime ACPX yang tahan lama adalah lease SQLite dan baris gateway-instance;
  permukaan config `stateDir` ACPX lama dihapus karena tidak ada state runtime
  yang ditulis di sana lagi.
- Lampiran media Gateway kini menggunakan tabel SQLite bersama `media_blobs` sebagai
  penyimpanan byte kanonis. Path lokal yang dikembalikan ke permukaan kompatibilitas
  channel dan sandbox adalah materialisasi sementara dari baris database, bukan
  penyimpanan media yang tahan lama. Allowlist media runtime tidak lagi menyertakan root lama
  `$OPENCLAW_STATE_DIR/media` atau root `media` direktori config; direktori tersebut hanya
  sumber impor doctor.
- Completion shell tidak lagi menulis file cache `$OPENCLAW_STATE_DIR/completions/*`.
  Jalur smoke install, doctor, update, dan release menggunakan output completion
  yang dihasilkan atau sourcing profil, bukan file cache completion tahan lama.
- Staging upload Skills Gateway kini menggunakan baris bersama `skill_uploads`. Metadata
  upload, kunci idempotensi, dan byte arsip berada di SQLite; installer
  hanya menerima path arsip termaterialisasi sementara saat install
  berjalan.
- Lampiran inline subagent tidak lagi dimaterialisasi di bawah workspace
  `.openclaw/attachments/*`. Jalur spawn menyiapkan entri seed SQLite VFS,
  run inline men-seed entri tersebut ke namespace scratch runtime per-agent,
  dan tool berbasis disk melapisi scratch SQLite itu untuk path lampiran. Kolom registry
  attachment-dir subagent-run lama dan hook cleanup sudah hilang.
- Hidrasi gambar CLI tidak lagi mempertahankan file cache stabil `openclaw-cli-images`.
  Backend CLI eksternal tetap menerima path file, tetapi path tersebut adalah
  materialisasi sementara per-run dengan cleanup.
- Diagnostik cache-trace, diagnostik payload Anthropic, diagnostik stream model mentah,
  event timeline diagnostik, dan bundle stabilitas Gateway kini
  menulis baris SQLite, bukan file `logs/*.jsonl` atau
  `logs/stability/*.json`.
  Flag override path runtime dan env var telah dihapus; perintah export/debug
  dapat mematerialisasi file secara eksplisit dari baris database.
- Companion macOS tidak lagi memiliki writer `diagnostics.jsonl` bergulir. Log aplikasi
  masuk ke unified logging, dan diagnostik Gateway yang tahan lama tetap didukung SQLite.
- Daftar record port-guardian macOS kini menggunakan baris SQLite bersama bertipe
  `macos_port_guardian_records`, bukan file JSON Application Support
  atau blob singleton buram.
- Lock singleton Gateway kini menggunakan baris SQLite bersama bertipe `state_leases` di bawah
  cakupan `gateway_locks`, bukan file lock temp-dir. Dokumen troubleshooting Fly dan OAuth
  kini menunjuk ke lock lease/auth refresh SQLite, bukan cleanup file-lock usang.
- State sentinel restart Gateway kini menggunakan baris SQLite bersama bertipe
  `gateway_restart_sentinel`, bukan `restart-sentinel.json`; runtime
  membaca jenis sentinel, status, routing, pesan, continuation, dan stats dari
  kolom bertipe. `payload_json` hanya salinan replay/debug. Kode runtime menghapus
  baris SQLite secara langsung dan tidak lagi membawa plumbing cleanup file.
- Intent restart Gateway dan state handoff supervisor kini menggunakan baris SQLite bersama
  bertipe `gateway_restart_intent` dan `gateway_restart_handoff`, bukan sidecar
  `gateway-restart-intent.json` dan
  `gateway-supervisor-restart-handoff.json`.
- Koordinasi singleton Gateway kini menggunakan baris `state_leases` bertipe di bawah
  `gateway_locks`, bukan menulis file `gateway.<hash>.lock`. Baris lease
  memiliki pemilik lock, kedaluwarsa, heartbeat, dan payload debug; SQLite memiliki
  batas acquire/release atomik. Opsi direktori file-lock yang dipensiunkan
  sudah hilang; test menggunakan identitas baris SQLite secara langsung.
- Helper laporan penggunaan cron lama yang tidak direferensikan dan memindai file `cron/runs/*.jsonl`
  telah dihapus. Laporan riwayat run cron harus membaca baris SQLite bertipe
  `cron_run_logs`.
- Pemulihan restart main-session kini menemukan kandidat agent melalui registry SQLite
  `agent_databases`, bukan memindai direktori `agents/*/sessions`.
- Pemulihan korupsi session Gemini kini hanya menghapus baris session SQLite;
  tidak lagi membutuhkan gate `storePath` lama atau mencoba unlink path
  JSONL transcript turunan.
- Penanganan override path kini memperlakukan nilai environment literal `undefined`/`null`
  sebagai tidak disetel, mencegah database `undefined/state/*.sqlite`
  di root repo secara tidak sengaja selama test atau handoff shell.
- Fingerprint kesehatan config kini menggunakan baris SQLite bersama bertipe `config_health_entries`
  bukan `logs/config-health.json`, sehingga file config normal tetap menjadi
  satu-satunya dokumen konfigurasi non-kredensial. Companion macOS hanya mempertahankan
  state kesehatan process-local dan tidak membuat ulang sidecar JSON lama.
- Runtime profil auth tidak lagi mengimpor atau menulis file JSON kredensial. Penyimpanan
  kredensial kanonis adalah SQLite; `auth-profiles.json`, `auth.json` per-agent,
  dan `credentials/oauth.json` bersama adalah input migrasi doctor
  yang dihapus setelah impor.
- Test save/state profil auth kini menegaskan tabel auth SQLite bertipe secara langsung
  dan hanya menggunakan nama file auth-profile lama untuk input migrasi doctor.
- `openclaw secrets apply` hanya membersihkan file config, file env, dan penyimpanan
  auth-profile SQLite. Perintah ini tidak lagi membawa logika kompatibilitas yang mengedit
  `auth.json` per-agent yang sudah dipensiunkan; doctor memiliki impor dan penghapusan file tersebut.
- Rencana dan penerapan migrasi secret Hermes mengimpor profil API-key secara langsung
  ke penyimpanan auth-profile SQLite. Ini tidak lagi menulis atau memverifikasi
  `auth-profiles.json` sebagai target perantara.
- Dokumen auth yang menghadap pengguna kini menjelaskan
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` alih-alih
  menyuruh pengguna memeriksa atau menyalin `auth-profiles.json`; nama JSON OAuth/auth lama
  tetap didokumentasikan hanya sebagai input impor doctor.
- Helper path state core tidak lagi mengekspos file `credentials/oauth.json`
  yang dipensiunkan. Nama file lama bersifat lokal untuk jalur impor auth doctor.
- Dokumen install, security, onboarding, model-auth, dan SecretRef kini menjelaskan
  baris auth-profile SQLite serta backup/migrasi seluruh state, bukan
  file JSON auth-profile per-agent.
- Discovery model PI kini meneruskan kredensial kanonis ke storage auth
  `pi-coding-agent` dalam memori. Ini tidak lagi membuat, membersihkan, atau menulis
  `auth.json` per-agent selama discovery.
- Pengaturan trigger dan routing Voice Wake kini menggunakan tabel SQLite bersama bertipe
  bukan `settings/voicewake.json`, `settings/voicewake-routing.json`, atau
  baris generik buram; doctor mengimpor file JSON lama dan menghapusnya setelah
  migrasi berhasil.
- State update-check kini menggunakan baris bersama bertipe `update_check_state`, bukan
  `update-check.json` atau blob generik buram; doctor mengimpor
  file JSON lama dan menghapusnya setelah migrasi berhasil.
- State kesehatan config kini menggunakan baris bersama bertipe `config_health_entries`
  bukan `logs/config-health.json` atau blob generik buram; doctor
  mengimpor file JSON lama dan menghapusnya setelah migrasi berhasil.
- Persetujuan binding percakapan Plugin kini menggunakan baris bertipe
  `plugin_binding_approvals`, bukan state SQLite bersama yang buram atau
  `plugin-binding-approvals.json`; file lama tersebut adalah input migrasi doctor.
- Binding percakapan-saat-ini generik sekarang menyimpan baris bertipe
  `current_conversation_bindings` alih-alih menulis ulang
  `bindings/current-conversations.json`; doctor mengimpor file JSON lama dan
  menghapusnya setelah migrasi berhasil.
- Ledger sinkronisasi sumber impor Memory Wiki sekarang menyimpan satu baris
  state Plugin SQLite per kunci vault/sumber alih-alih menulis ulang
  `.openclaw-wiki/source-sync.json`; penyedia migrasi mengimpor dan menghapus
  ledger JSON lama.
- Catatan import-run ChatGPT Memory Wiki sekarang menyimpan satu baris
  state Plugin SQLite per vault/id run alih-alih menulis
  `.openclaw-wiki/import-runs/*.json`. Snapshot rollback tetap berupa file vault
  eksplisit sampai arsip snapshot import-run dipindahkan ke penyimpanan blob.
- Digest terkompilasi Memory Wiki sekarang menyimpan baris blob Plugin SQLite
  alih-alih menulis `.openclaw-wiki/cache/agent-digest.json` dan
  `.openclaw-wiki/cache/claims.jsonl`. Penyedia migrasi mengimpor file cache
  lama dan menghapus direktori cache saat direktori tersebut menjadi kosong.
- Pelacakan instalasi skill ClawHub sekarang menyimpan satu baris state Plugin
  SQLite per workspace/skill alih-alih menulis atau membaca sidecar
  `.clawhub/lock.json` dan `.clawhub/origin.json` saat runtime. Kode runtime
  menggunakan objek state instalasi-terlacak, bukan abstraksi lockfile/origin
  berbentuk file. Doctor mengimpor sidecar lama dari workspace agen yang
  dikonfigurasi dan menghapusnya setelah impor bersih.
- Indeks Plugin terinstal sekarang membaca dan menulis baris singleton
  `installed_plugin_index` SQLite bersama bertipe alih-alih
  `plugins/installs.json`; file JSON lama hanya menjadi input migrasi doctor
  dan dihapus setelah impor.
- Helper path `plugins/installs.json` lama sekarang berada di kode lama doctor.
  Modul plugin-index runtime hanya mengekspos opsi persistensi berbasis SQLite,
  bukan path file JSON.
- Sentinel restart Gateway, intent restart, dan state handoff supervisor sekarang
  menggunakan baris SQLite bersama bertipe (`gateway_restart_sentinel`,
  `gateway_restart_intent`, dan `gateway_restart_handoff`) alih-alih blob opak
  generik. Kode restart runtime tidak memiliki kontrak sentinel/intent/handoff
  berbentuk file.
- Cache sinkronisasi Matrix, metadata penyimpanan, binding thread, marker dedupe
  inbound, state cooldown verifikasi startup, snapshot crypto SDK IndexedDB,
  kredensial, dan kunci pemulihan sekarang menggunakan tabel state/blob Plugin
  SQLite bersama. Struct path runtime tidak lagi mengekspos path metadata
  `storage-meta.json`; nama file itu hanya menjadi input migrasi lama. Rencana
  impor JSON lama mereka berada di permukaan migrasi setup/doctor Plugin Matrix.
- Startup Matrix tidak lagi memindai, melaporkan, atau menyelesaikan state file
  Matrix lama. Deteksi file Matrix, pembuatan snapshot crypto lama, state
  migrasi pemulihan room-key, impor, dan penghapusan sumber semuanya dimiliki
  doctor.
- Barrel migrasi runtime Matrix telah dihapus. Helper deteksi dan mutasi
  state/crypto lama diimpor langsung oleh doctor Matrix, bukan menjadi bagian
  dari permukaan API runtime.
- Marker penggunaan ulang snapshot migrasi Matrix sekarang berada di state
  Plugin SQLite alih-alih `matrix/migration-snapshot.json`; doctor tetap dapat
  menggunakan ulang arsip pra-migrasi terverifikasi yang sama tanpa menulis file
  state sidecar.
- Cursor bus Nostr dan state publikasi profil sekarang menggunakan state Plugin
  SQLite bersama. Rencana impor JSON lama mereka berada di permukaan migrasi
  setup/doctor Plugin Nostr.
- Toggle sesi Active Memory sekarang menggunakan state Plugin SQLite bersama
  alih-alih `session-toggles.json`; mengaktifkan kembali memori menghapus baris
  tersebut alih-alih menulis ulang objek JSON.
- Proposal Skill Workshop dan penghitung review sekarang menggunakan state
  Plugin SQLite bersama alih-alih store `skill-workshop/<workspace>.json` per
  workspace. Setiap proposal adalah baris terpisah di bawah
  `skill-workshop/proposals`, dan penghitung review adalah baris terpisah di
  bawah `skill-workshop/reviews`.
- Run subagent peninjau Skill Workshop sekarang menggunakan resolver transkrip
  sesi runtime alih-alih membuat path sesi sidecar
  `skill-workshop/<sessionId>.json`.
- Lease proses ACPX sekarang menggunakan state Plugin SQLite bersama di bawah
  `acpx/process-leases` alih-alih registry seluruh-file
  `process-leases.json`. Setiap lease disimpan sebagai barisnya sendiri, menjaga
  pembersihan proses kedaluwarsa saat startup tanpa path penulisan ulang JSON
  runtime.
- Skrip wrapper ACPX dan home Codex terisolasi dibuat di root temp OpenClaw.
  Keduanya dibuat ulang sesuai kebutuhan dan bukan input backup atau migrasi.
- Persistensi registry run subagent menggunakan baris bersama bertipe
  `subagent_runs`. Path `subagents/runs.json` lama sekarang hanya menjadi input
  migrasi doctor, dan nama helper runtime tidak lagi menggambarkan lapisan state
  sebagai berbasis disk. Test runtime tidak lagi membuat fixture `runs.json`
  yang tidak valid atau kosong untuk membuktikan perilaku registry; test
  langsung melakukan seed/membaca baris SQLite.
- Backup men-stage direktori state sebelum pengarsipan, menyalin file
  non-database, membuat snapshot database `*.sqlite` dengan `VACUUM INTO`,
  menghilangkan sidecar WAL/SHM live, mencatat metadata snapshot dalam manifes
  arsip, dan mencatat run backup selesai di SQLite bersama manifes arsip.
  `openclaw backup create` memvalidasi arsip yang ditulis secara default;
  `--no-verify` adalah jalur cepat eksplisit.
- `openclaw backup restore` memvalidasi arsip sebelum ekstraksi, menggunakan
  ulang manifes ternormalisasi dari verifier, dan memulihkan aset manifes
  terverifikasi ke path sumber yang tercatat. Perintah ini membutuhkan `--yes`
  untuk penulisan dan mendukung `--dry-run` untuk rencana restore.
- Filter path volatil backup lama dihapus. Backup tidak lagi membutuhkan daftar
  skip live-tar untuk file JSON/JSONL sesi atau cron lama karena snapshot SQLite
  di-stage sebelum pembuatan arsip.
- Persiapan workspace setup biasa dan onboarding tidak lagi membuat direktori
  `agents/<agentId>/sessions/`. Keduanya hanya membuat config/workspace; baris
  sesi SQLite dan baris transkrip dibuat sesuai kebutuhan di database per-agen.
- Perbaikan izin keamanan sekarang menargetkan database SQLite global dan
  per-agen plus sidecar WAL/SHM, bukan file `sessions.json` dan transkrip JSONL.
- Nama runtime registry sandbox sekarang menggambarkan jenis registry SQLite
  secara langsung alih-alih membawa terminologi registry JSON lama melalui store
  aktif.
- `openclaw reset --scope config+creds+sessions` menghapus database
  `openclaw-agent.sqlite` per-agen plus sidecar WAL/SHM, bukan hanya direktori
  `sessions/` lama.
- Helper sesi agregat Gateway sekarang menggunakan nama berorientasi entri:
  `loadCombinedSessionEntriesForGateway` mengembalikan `{ databasePath, entries }`.
  Penamaan combined-store lama telah dihapus dari pemanggil runtime.
- Seeding channel Docker MCP sekarang menulis baris sesi utama dan event
  transkrip ke database SQLite per-agen alih-alih membuat `sessions.json` dan
  transkrip JSONL.
- Hook session-memory bawaan sekarang menyelesaikan konteks sesi sebelumnya dari
  SQLite berdasarkan `{agentId, sessionId}`. Hook ini tidak lagi memindai,
  menyimpan, atau mensintesis path transkrip atau direktori `workspace/sessions`.
- Hook command-logger bawaan sekarang menulis baris audit perintah ke tabel
  SQLite bersama `command_log_entries` alih-alih menambahkan ke
  `logs/commands.log`.
- Allowlist pairing channel sekarang hanya mengekspos helper baca/tulis berbasis
  SQLite saat runtime dan di SDK Plugin. Resolver path `*-allowFrom.json` lama
  dan pembaca file hanya berada di bawah kode impor lama doctor.
- `migration_runs` mencatat eksekusi migrasi state lama beserta status,
  timestamp, dan laporan JSON.
- `migration_sources` mencatat setiap sumber file lama yang diimpor beserta
  hash, ukuran, jumlah catatan, tabel target, id run, status, dan state
  penghapusan sumber.
- `backup_runs` mencatat path arsip backup, status, dan manifes JSON.
- Skema global tidak menyimpan tabel registry `agents` yang tidak digunakan.
  Penemuan database agen adalah registry kanonis `agent_databases` sampai
  runtime memiliki pemilik catatan agen nyata.
- Config katalog model yang dihasilkan disimpan dalam baris
  `agent_model_catalogs` SQLite global bertipe yang dikunci berdasarkan
  direktori agen. Pemanggil runtime menggunakan `ensureOpenClawModelCatalog`;
  tidak ada API kompatibilitas `models.json` dalam kode runtime. Implementasi
  menulis SQLite dan registry PI tertanam dihidrasi dari payload tersimpan itu
  tanpa membuat file `models.json`.
- Ekspor markdown transkrip sesi QMD dan config `memory.qmd.sessions` telah
  dihapus. Tidak ada koleksi transkrip QMD, tidak ada path runtime
  `qmd/sessions*`, dan tidak ada bridge memori sesi berbasis file.
- Runtime memory-core mengimpor helper pengindeksan transkrip SQLite dari
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, bukan
  subpath SDK QMD. Subpath QMD mempertahankan re-ekspor kompatibilitas hanya
  untuk pemanggil eksternal sampai pembersihan SDK mayor dapat menghapusnya.
- `index.sqlite` milik QMD sekarang menjadi materialisasi runtime temp yang
  didukung oleh tabel SQLite utama `plugin_blob_entries`. Runtime tidak lagi
  membuat sidecar tahan lama `~/.openclaw/agents/<agentId>/qmd`.
- Plugin opsional `memory-lancedb` tidak lagi membuat
  `~/.openclaw/memory/lancedb` sebagai store terkelola OpenClaw implisit. Ini
  adalah backend LanceDB eksternal dan tetap dinonaktifkan sampai operator
  mengonfigurasi `dbPath` eksplisit.
- `check:database-first-legacy-stores` menggagalkan sumber runtime baru yang
  memasangkan nama store lama dengan API filesystem bergaya tulis. Check ini
  juga menggagalkan sumber runtime yang memperkenalkan kembali marker bridge
  transkrip yang telah dipensiunkan, `transcriptLocator` atau
  `sqlite-transcript://...`. Kode migrasi, doctor, impor, dan ekspor non-sesi
  eksplisit tetap diizinkan. Nama kontrak lama yang lebih luas seperti
  `sessionFile`, `storePath`, dan facade era-file `SessionManager` lama masih
  memiliki pemilik saat ini dan membutuhkan pekerjaan guard migrasi terpisah
  sebelum dapat menjadi check preflight wajib. Guard ini sekarang juga mencakup
  store runtime `cache/*.json`, sidecar `thread-bindings.json` generik, JSON
  state/run-log cron, JSON kesehatan config, sidecar restart dan lock, pengaturan
  Voice Wake, persetujuan binding Plugin, JSON indeks Plugin terinstal, JSONL
  audit File Transfer, log aktivitas Memory Wiki, log teks `command-logger`
  bawaan lama, dan knob diagnostik JSONL raw-stream pi-mono. Guard ini juga
  melarang nama modul lama doctor tingkat-root lama agar kode kompatibilitas
  tetap berada di bawah `src/commands/doctor/`. Handler debug Android juga
  menggunakan logcat/output dalam memori alih-alih men-stage file cache
  `camera_debug.log` atau `debug_logs.txt`.

## Bentuk Skema Target

Jaga skema tetap eksplisit. State runtime milik host menggunakan tabel bertipe. State
opak milik Plugin menggunakan `plugin_state_entries` / `plugin_blob_entries`; tidak ada
tabel `kv` host generik.

Database global:

```text
state_leases(scope, lease_key, owner, expires_at, heartbeat_at, payload_json, created_at, updated_at)
exec_approvals_config(config_key, raw_json, socket_path, has_socket_token, default_security, default_ask, default_ask_fallback, auto_allow_skills, agent_count, allowlist_count, updated_at_ms)
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
agent_databases(agent_id, path, schema_version, last_seen_at, size_bytes)
task_runs(...)
task_delivery_state(...)
flow_runs(...)
subagent_runs(run_id, child_session_key, requester_session_key, controller_session_key, created_at, ended_at, cleanup_handled, payload_json)
current_conversation_bindings(binding_key, binding_id, target_agent_id, target_session_id, target_session_key, channel, account_id, conversation_kind, parent_conversation_id, conversation_id, target_kind, status, bound_at, expires_at, metadata_json, updated_at)
plugin_binding_approvals(plugin_root, channel, account_id, plugin_id, plugin_name, approved_at)
tui_last_sessions(scope_key, session_key, updated_at)
plugin_state_entries(plugin_id, namespace, entry_key, value_json, created_at, expires_at)
plugin_blob_entries(plugin_id, namespace, entry_key, metadata_json, blob, created_at, expires_at)
media_blobs(subdir, id, content_type, size_bytes, blob, created_at, updated_at)
skill_uploads(upload_id, kind, slug, force, size_bytes, sha256, actual_sha256, received_bytes, archive_blob, created_at, expires_at, committed, committed_at, idempotency_key_hash)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, topic, environment, distribution, token_debug_suffix, updated_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_run_logs(store_key, job_id, seq, ts, status, error, summary, diagnostics_summary, delivery_status, delivery_error, delivered, session_id, session_key, run_id, run_at_ms, duration_ms, next_run_at_ms, model, provider, total_tokens, entry_json, created_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

Database agen:

```text
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
sessions(session_id, session_key, session_scope, created_at, updated_at, started_at, ended_at, status, chat_type, channel, account_id, primary_conversation_id, model_provider, model, agent_harness_id, parent_session_key, spawned_by, display_name)
conversations(conversation_id, channel, account_id, kind, peer_id, parent_conversation_id, thread_id, native_channel_id, native_direct_user_id, label, metadata_json, created_at, updated_at)
session_conversations(session_id, conversation_id, role, first_seen_at, last_seen_at)
session_routes(session_key, session_id, updated_at)
session_entries(session_id, session_key, entry_json, updated_at)
transcript_events(session_id, seq, event_json, created_at)
transcript_event_identities(session_id, event_id, seq, event_type, has_parent, parent_id, message_idempotency_key, created_at)
transcript_snapshots(session_id, snapshot_id, reason, event_count, created_at, metadata_json)
vfs_entries(namespace, path, kind, content_blob, metadata_json, updated_at)
tool_artifacts(run_id, artifact_id, kind, metadata_json, blob, created_at)
run_artifacts(run_id, path, kind, metadata_json, blob, created_at)
trajectory_runtime_events(session_id, run_id, seq, event_json, created_at)
memory_index_meta(key, value)
memory_index_sources(path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

Pencarian di masa mendatang dapat menambahkan tabel FTS tanpa mengubah tabel peristiwa kanonis:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Nilai besar sebaiknya menggunakan kolom `blob`, bukan encoding string JSON. Pertahankan
`value_json` untuk data terstruktur kecil yang harus tetap dapat diperiksa dengan tooling
SQLite biasa.

`agent_databases` adalah registry kanonis untuk branch ini. Jangan tambahkan tabel
`agents` sampai ada pemilik catatan agen yang nyata; konfigurasi agen tetap berada di
`openclaw.json`.

## Bentuk Migrasi Doctor

Doctor harus memanggil satu langkah migrasi eksplisit yang dapat dilaporkan dan aman
untuk dijalankan ulang:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` memanggil implementasi migrasi state setelah
preflight konfigurasi biasa dan membuat backup terverifikasi sebelum impor. Startup runtime
dan `openclaw migrate` tidak boleh mengimpor file state OpenClaw lama.

Properti migrasi:

- Satu pass migrasi menemukan semua sumber file lama dan menghasilkan rencana
  sebelum memutasi apa pun.
- Doctor membuat arsip backup pra-migrasi yang terverifikasi sebelum mengimpor
  file lama.
- Impor bersifat idempoten dan dikunci berdasarkan path sumber, mtime, ukuran, hash, dan tabel target.
- File sumber yang berhasil dihapus atau diarsipkan setelah database target
  melakukan commit.
- Impor yang gagal membiarkan sumber tetap tidak berubah dan mencatat peringatan di
  `migration_runs`.
- Kode runtime hanya membaca SQLite setelah migrasi tersedia.
- Tidak diperlukan jalur downgrade/ekspor-ke-file-runtime.

## Inventaris Migrasi

Pindahkan ini ke database global:

- Penulisan runtime registri tugas sekarang menggunakan basis data bersama; pengimpor sidecar
  `tasks/runs.sqlite` yang belum dirilis dihapus. Penyimpanan snapshot melakukan upsert berdasarkan id tugas
  dan hanya menghapus baris tugas/pengiriman yang hilang.
- Penulisan runtime Task Flow sekarang menggunakan basis data bersama; pengimpor sidecar
  `tasks/flows/registry.sqlite` yang belum dirilis dihapus. Penyimpanan snapshot
  melakukan upsert berdasarkan id flow dan hanya menghapus baris flow yang hilang.
- Penulisan runtime status Plugin sekarang menggunakan basis data bersama; pengimpor sidecar
  `plugin-state/state.sqlite` yang belum dirilis dihapus.
- Pencarian memori bawaan tidak lagi default ke `memory/<agentId>.sqlite`; tabel
  indeksnya berada di basis data agen pemilik, dan opt-in sidecar eksplisit
  `memorySearch.store.path` telah dipensiunkan ke migrasi konfigurasi doctor.
- Pengindeksan ulang memori bawaan hanya mereset tabel milik memori di basis data agen.
  Ini tidak boleh mengganti seluruh berkas SQLite, karena basis data yang sama memiliki
  sesi, transkrip, baris VFS, artefak, dan cache runtime.
- Registri kontainer/browser sandbox dari JSON monolitik dan ter-shard. Penulisan runtime
  sekarang menggunakan basis data bersama; impor JSON legacy tetap ada.
- Definisi tugas Cron, status jadwal, dan riwayat eksekusi sekarang menggunakan SQLite bersama;
  doctor mengimpor/menghapus berkas legacy `jobs.json`, `jobs-state.json`, dan
  `cron/runs/*.jsonl`
- Identitas/autentikasi perangkat, push, pemeriksaan pembaruan, komitmen, cache model OpenRouter,
  indeks Plugin terpasang, dan binding app-server
- Catatan pairing dan bootstrap perangkat/node sekarang menggunakan tabel SQLite bertipe
- Pelanggan notifikasi device-pair dan penanda permintaan terkirim sekarang menggunakan tabel
  plugin-state SQLite bersama, bukan `device-pair-notify.json`.
- Catatan panggilan voice-call sekarang menggunakan tabel plugin-state SQLite bersama di bawah namespace
  `voice-call` / `calls`, bukan `calls.jsonl`; CLI Plugin
  melakukan tail dan meringkas riwayat panggilan yang didukung SQLite.
- Sesi gateway QQBot, catatan known-user, dan cache kutipan ref-index sekarang menggunakan
  status Plugin SQLite di bawah namespace `qqbot` (`gateway-sessions`,
  `known-users`, `ref-index`), bukan `session-*.json`, `known-users.json`,
  dan `ref-index.jsonl`. Berkas legacy tersebut adalah cache dan tidak dimigrasikan.
- Preferensi pemilih model Discord, hash command-deploy, dan binding thread
  sekarang menggunakan status Plugin SQLite di bawah namespace `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  bukan `model-picker-preferences.json`, `command-deploy-cache.json`, dan
  `thread-bindings.json`; migrasi doctor/setup Discord mengimpor dan
  menghapus berkas legacy.
- Kursor catchup BlueBubbles dan penanda dedupe masuk sekarang menggunakan status Plugin SQLite
  di bawah namespace `bluebubbles` (`catchup-cursors`, `inbound-dedupe`)
  bukan `bluebubbles/catchup/*.json` dan
  `bluebubbles/inbound-dedupe/*.json`; migrasi doctor/setup BlueBubbles
  mengimpor dan menghapus berkas legacy.
- Offset pembaruan Telegram, entri cache stiker, entri cache pesan reply-chain,
  entri cache pesan terkirim, entri cache nama topik, dan binding thread
  sekarang menggunakan status Plugin SQLite di bawah namespace `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) bukan `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json`, dan
  `thread-bindings-*.json`; migrasi doctor/setup Telegram mengimpor dan
  menghapus berkas legacy.
- Kursor catchup iMessage, pemetaan short-id balasan, dan baris dedupe sent-echo
  sekarang menggunakan status Plugin SQLite di bawah namespace `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) bukan `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl`, dan `imessage/sent-echoes.jsonl`; migrasi doctor/setup iMessage
  mengimpor dan menghapus berkas legacy.
- Percakapan Microsoft Teams, polling, token SSO, dan pembelajaran umpan balik sekarang
  menggunakan namespace status Plugin SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) bukan `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json`, dan `*.learnings.json`; migrasi
  doctor/setup Microsoft Teams mengimpor dan mengarsipkan berkas legacy.
  Unggahan tertunda adalah cache SQLite berumur pendek dan berkas cache JSON lama
  tidak dimigrasikan.
- Cache sinkronisasi Matrix, metadata penyimpanan, binding thread, penanda dedupe masuk,
  status cooldown verifikasi startup, kredensial, kunci pemulihan, dan snapshot kripto IndexedDB SDK
  sekarang menggunakan namespace status/blob Plugin SQLite di bawah
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  bukan `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json`, dan `crypto-idb-snapshot.json`; migrasi doctor/setup Matrix
  mengimpor dan menghapus berkas legacy tersebut dari root penyimpanan Matrix yang tercakup akun.
- Kursor bus Nostr dan status publikasi profil sekarang menggunakan status Plugin SQLite di bawah
  namespace `nostr` (`bus-state`, `profile-state`) bukan
  `bus-state-*.json` dan `profile-state-*.json`; migrasi doctor/setup Nostr
  mengimpor dan menghapus berkas legacy.
- Toggle sesi Active Memory sekarang menggunakan status Plugin SQLite di bawah
  `active-memory/session-toggles`, bukan `session-toggles.json`.
- Antrean proposal Skill Workshop dan penghitung ulasan sekarang menggunakan status Plugin SQLite
  di bawah `skill-workshop/proposals` dan `skill-workshop/reviews`, bukan
  berkas per-workspace `skill-workshop/<workspace>.json`.
- Antrean pengiriman outbound dan pengiriman sesi sekarang berbagi tabel SQLite global
  `delivery_queue_entries` di bawah nama antrean terpisah
  (`outbound-delivery`, `session-delivery`) bukan berkas tahan lama
  `delivery-queue/*.json`, `delivery-queue/failed/*.json`, dan
  `session-delivery-queue/*.json`. Langkah legacy-state doctor mengimpor
  baris tertunda dan gagal, menghapus penanda terkirim yang usang, dan menghapus berkas
  JSON lama setelah impor. Field routing panas dan retry adalah kolom bertipe; payload
  JSON hanya dipertahankan untuk replay/debug.
- Lease proses ACPX sekarang menggunakan status Plugin SQLite di bawah `acpx/process-leases`
  bukan `process-leases.json`.
- Metadata eksekusi backup dan migrasi

Pindahkan ini ke basis data agen:

- Root sesi agen dan payload session-entry berbentuk kompatibilitas. Selesai untuk
  penulisan runtime: metadata sesi panas dapat di-query di `sessions`, sementara payload lengkap
  `SessionEntry` berbentuk legacy tetap berada di `session_entries`.
- Event transkrip agen. Selesai untuk penulisan runtime.
- Checkpoint Compaction dan snapshot transkrip. Selesai untuk penulisan runtime:
  salinan transkrip checkpoint adalah baris transkrip SQLite dan metadata checkpoint
  dicatat di `transcript_snapshots`. Helper checkpoint Gateway
  sekarang menamai nilai ini sebagai snapshot transkrip, bukan berkas sumber.
- Namespace scratch/workspace VFS agen. Selesai untuk penulisan VFS runtime.
- Payload lampiran subagen. Selesai untuk penulisan runtime: semuanya adalah entri seed VFS
  SQLite dan tidak pernah menjadi berkas workspace tahan lama.
- Artefak tool. Selesai untuk penulisan runtime.
- Artefak run. Selesai untuk penulisan runtime worker melalui tabel per-agen
  `run_artifacts`.
- Cache runtime lokal agen. Selesai untuk penulisan cache tercakup runtime worker melalui
  tabel per-agen `cache_entries`. Cache model selebar Gateway tetap berada di basis data
  global kecuali menjadi spesifik agen.
- Log stream induk ACP. Selesai untuk penulisan runtime.
- Sesi ledger replay ACP. Selesai untuk penulisan runtime melalui
  `acp_replay_sessions` dan `acp_replay_events`; legacy `acp/event-ledger.json`
  hanya tetap sebagai input doctor.
- Metadata sesi ACP. Selesai untuk penulisan runtime melalui `acp_sessions`; blok legacy
  `entry.acp` di `sessions.json` hanya menjadi input migrasi doctor.
- Sidecar trajectory ketika bukan berkas ekspor eksplisit. Selesai untuk penulisan runtime:
  capture trajectory menulis baris `trajectory_runtime_events` basis data agen
  dan mencerminkan artefak tercakup run ke SQLite. Sidecar legacy hanya menjadi
  input impor doctor; ekspor dapat mewujudkan output support-bundle JSONL baru
  tetapi tidak membaca atau memigrasikan sidecar trajectory/transkrip lama saat runtime.
  Capture trajectory runtime mengekspos cakupan SQLite; helper jalur JSONL
  diisolasi untuk dukungan ekspor/debug dan tidak diekspor ulang dari modul runtime.
  Metadata trajectory embedded-runner mencatat identitas `{agentId, sessionId, sessionKey}`
  alih-alih mempertahankan locator transkrip.

Pertahankan ini berbasis berkas untuk saat ini:

- `openclaw.json`
- berkas kredensial provider atau CLI
- manifes plugin/package
- workspace pengguna dan repositori Git ketika mode disk dipilih
- log yang dimaksudkan untuk tail operator, kecuali permukaan log tertentu dipindahkan

## Rencana Migrasi

### Fase 0: Bekukan Batas

Jadikan batas status tahan lama eksplisit sebelum memindahkan lebih banyak baris:

- Tambahkan tabel `migration_runs` ke basis data global.
  Selesai untuk laporan eksekusi migrasi legacy-state.
- Tambahkan satu layanan migrasi status milik doctor untuk impor file-ke-basis data.
  Selesai: `openclaw doctor --fix` menggunakan implementasi migrasi legacy-state.
- Jadikan `plan` hanya-baca dan jadikan `apply` membuat backup, mengimpor, memverifikasi, lalu
  menghapus atau mengarantina berkas lama.
  Selesai: doctor membuat backup pra-migrasi yang terverifikasi, meneruskan jalur backup
  ke `migration_runs`, dan menggunakan ulang jalur pengimporan/penghapusan.
- Tambahkan larangan statis agar kode runtime baru tidak dapat menulis berkas status legacy sementara
  kode migrasi dan pengujian tetap dapat menanam/membaca berkas tersebut.
  Selesai untuk penyimpanan legacy yang saat ini dimigrasikan; guard juga memindai pengujian
  bersarang untuk kontrak locator transkrip runtime terlarang.

### Fase 1: Selesaikan Control Plane Global

Pertahankan status koordinasi bersama di `state/openclaw.sqlite`:

- Agen dan registri basis data agen
- Ledger tugas dan Task Flow
- Status Plugin
- Registri kontainer/browser sandbox
- Riwayat eksekusi Cron/scheduler
- Pairing, perangkat, push, pemeriksaan pembaruan, TUI, cache OpenRouter/model, dan status runtime kecil
  tercakup gateway lainnya
- Metadata backup dan migrasi
- Byte lampiran media Gateway. Selesai untuk penulisan runtime; jalur berkas langsung
  adalah materialisasi temp untuk kompatibilitas dengan pengirim channel dan staging sandbox.
  Allowlist runtime menerima jalur materialisasi SQLite, bukan root media status/konfigurasi legacy.
  Doctor mengimpor berkas media legacy ke `media_blobs` dan menghapus berkas sumber setelah
  penulisan baris berhasil.
- Sesi capture debug proxy, event, dan blob payload. Selesai: capture berada
  di DB status bersama dan dibuka melalui bootstrap, skema, WAL, dan pengaturan
  busy-timeout DB status bersama. Byte payload dikompresi gzip di
  `capture_blobs.data`; tidak ada override DB sidecar runtime debug proxy,
  direktori blob, atau target skema/codegen yang hanya untuk proxy-capture.
  Migrasi doctor/startup mengimpor baris `debug-proxy/capture.sqlite` yang telah dirilis
  dan blob payload yang dirujuk, termasuk override environment DB/blob legacy aktif,
  lalu mengarsipkan sumber tersebut sambil membiarkan sertifikat CA tetap utuh.

Fase ini juga menghapus pembuka sidecar duplikat, helper izin, setup WAL,
pemangkasan filesystem, dan penulis kompatibilitas dari subsistem tersebut.

### Fase 2: Perkenalkan Basis Data Per-Agen

Buat satu basis data per agen dan daftarkan dari DB global:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

Baris `agent_databases` global menyimpan jalur, versi skema, timestamp last-seen,
dan metadata ukuran/integritas dasar. Kode runtime meminta DB agen ke registri,
bukan menurunkan jalur berkas secara langsung.

DB agen memiliki:

- `sessions` sebagai root sesi kanonis, dengan `session_entries` sebagai tabel payload
  berbentuk kompatibilitas yang terpasang ke root tersebut, dan
  `session_routes` sebagai pencarian `session_key` aktif yang unik
- `conversations` dan `session_conversations` sebagai identitas perutean provider
  ternormalisasi yang terpasang ke sesi
- `transcript_events`
- snapshot transkrip dan checkpoint Compaction. Selesai untuk penulisan runtime.
- `vfs_entries`
- `tool_artifacts` dan artefak run
- baris runtime/cache lokal agen. Selesai untuk cache berskop worker.
- event stream induk ACP
- event runtime trajectory ketika bukan artefak ekspor eksplisit

### Fase 3: Ganti API Penyimpanan Sesi

Selesai untuk runtime. Permukaan penyimpanan sesi berbentuk file bukan kontrak
runtime aktif:

- Runtime tidak lagi memanggil `loadSessionStore(storePath)` atau memperlakukan `storePath` sebagai
  identitas sesi.
- Operasi baris runtime adalah `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry`, dan `listSessionEntries`.
- Helper penulisan ulang seluruh penyimpanan, penulis file, pengujian antrean, pemangkasan alias, dan
  parameter penghapusan kunci legacy sudah hilang dari runtime.
- Ekspor kompatibilitas paket root yang deprecated masih mengadaptasi path
  `sessions.json` kanonis ke API baris SQLite.
- Parsing `sessions.json` hanya tersisa di kode migrasi/impor doctor dan
  pengujian doctor.
- Bacaan fallback siklus hidup runtime membaca header transkrip SQLite, bukan baris pertama
  JSONL.

Terus hapus apa pun yang memperkenalkan ulang parameter file-lock,
kosakata pruning/truncation-as-file-maintenance, identitas store-path, atau pengujian
yang satu-satunya asersinya adalah persistensi JSON.

### Fase 4: Pindahkan Transkrip, Stream ACP, Trajectory, Dan VFS

Jadikan setiap stream data agen native database:

- Penulisan append transkrip melewati satu transaksi SQLite yang memastikan
  header sesi, memeriksa idempotensi pesan, memilih tail induk, menyisipkan
  ke `transcript_events`, dan mencatat metadata identitas yang dapat di-query di
  `transcript_event_identities`. Selesai untuk append pesan transkrip langsung dan
  append `TranscriptSessionManager` yang dipersist secara normal; operasi branch
  eksplisit mempertahankan pilihan induk eksplisitnya dan tetap menulis baris SQLite
  tanpa menurunkan locator file apa pun.
- Log stream induk ACP menjadi baris, bukan file `.acp-stream.jsonl`. Selesai.
- Penyiapan spawn ACP tidak lagi mempersist path JSONL transkrip. Selesai.
- Capture trajectory runtime menulis baris/artefak event secara langsung. Perintah
  dukungan/ekspor eksplisit masih dapat menghasilkan artefak JSONL support-bundle sebagai
  format ekspor, tetapi ekspor sesi tidak membuat ulang JSONL sesi. Selesai.
- Workspace disk tetap berada di disk ketika dikonfigurasi sebagai mode disk.
- Scratch VFS dan mode workspace eksperimental khusus VFS menggunakan DB agen.

Migrasi mengimpor file JSONL lama satu kali, mencatat jumlah/hash di
`migration_runs`, dan menghapus file yang diimpor setelah pemeriksaan integritas.

### Fase 5: Backup, Restore, Vacuum, Dan Verify

Backup tetap berupa satu file arsip:

- Checkpoint setiap database global dan agen.
- Snapshot setiap DB dengan semantik backup SQLite atau `VACUUM INTO`.
- Arsipkan snapshot DB ringkas, config, kredensial eksternal, dan ekspor
  workspace yang diminta.
- Hilangkan file live mentah `*.sqlite-wal` dan `*.sqlite-shm`.
- Verifikasi dengan membuka setiap snapshot DB dan menjalankan `PRAGMA integrity_check`.
  `openclaw backup create` melakukan verifikasi arsip ini secara default;
  `--no-verify` hanya melewati pass arsip pascapenulisan, bukan pemeriksaan integritas
  pembuatan snapshot.
- Restore menyalin snapshot kembali ke path targetnya. Branch ini mereset
  tata letak SQLite yang belum dirilis ke `user_version = 1`; perubahan skema
  yang dirilis di masa depan dapat menambahkan migrasi eksplisit saat dibutuhkan.

### Fase 6: Runtime Worker

Pertahankan mode worker sebagai eksperimental saat pemisahan database mendarat:

- Worker menerima id agen, id run, mode filesystem, dan identitas registry DB.
- Setiap worker membuka koneksi SQLite-nya sendiri.
- Induk mempertahankan otoritas pengiriman channel, approval, config, dan pembatalan.
- Mulai dengan satu worker per run aktif; tambahkan pooling hanya setelah kepemilikan
  siklus hidup dan koneksi DB stabil.

### Fase 7: Hapus Dunia Lama

Selesai untuk manajemen sesi runtime. Dunia lama hanya diizinkan sebagai input
doctor eksplisit atau output dukungan/ekspor:

- Tidak ada penulisan runtime `sessions.json`, JSONL transkrip, JSON registry sandbox, SQLite
  sidecar tugas, atau SQLite sidecar status Plugin.
- Tidak ada pruning file JSON/sesi, truncation transkrip file, lock file sesi,
  atau pengujian sesi berbentuk lock.
- Tidak ada ekspor kompatibilitas runtime yang tujuannya menjaga file sesi lama
  tetap mutakhir.
- Ekspor dukungan eksplisit tetap menjadi format arsip/materialisasi
  yang diminta pengguna dan tidak boleh memasukkan nama file kembali ke identitas runtime.

## Backup Dan Restore

Backup sebaiknya berupa satu file arsip, tetapi capture database harus
native SQLite:

1. Hentikan aktivitas tulis yang berjalan lama atau masuk ke barrier backup singkat.
2. Untuk setiap database global dan agen, jalankan checkpoint.
3. Snapshot setiap database menggunakan semantik backup SQLite atau `VACUUM INTO` ke
   direktori backup sementara.
4. Arsipkan snapshot database yang dipadatkan, file config, direktori kredensial,
   workspace terpilih, dan manifest.
5. Verifikasi arsip dengan membuka setiap snapshot SQLite yang disertakan dan menjalankan
   `PRAGMA integrity_check`.
   `openclaw backup create` melakukan ini secara default; `--no-verify` hanya untuk
   melewati pass arsip pascapenulisan secara sengaja.

Jangan mengandalkan salinan live mentah `*.sqlite`, `*.sqlite-wal`, dan `*.sqlite-shm` sebagai
format backup utama. Manifest arsip harus mencatat peran database,
id agen, versi skema, path sumber, path snapshot, ukuran byte, dan status
integritas.

Restore harus membangun ulang database global dan file database agen dari
snapshot arsip. Karena tata letak SQLite belum dirilis, refactor ini
hanya mempertahankan skema versi-1 ditambah impor file-ke-database oleh doctor. Perintah restore
memvalidasi arsip terlebih dahulu, lalu mengganti setiap aset manifest dari payload
terekstrak yang telah diverifikasi.

## Rencana Refactor Runtime

1. Tambahkan API registry database.
   - Resolve path DB global dan DB per agen.
   - Pertahankan skema yang belum dirilis pada `user_version = 1`; jangan tambahkan kode runner
     migrasi skema sampai ada skema yang dirilis membutuhkannya.
   - Tambahkan helper close/checkpoint/integrity yang digunakan oleh pengujian, backup, dan doctor.

2. Gabungkan penyimpanan SQLite sidecar.
   - Pindahkan tabel status Plugin ke database global. Selesai untuk penulisan runtime;
     importer sidecar legacy yang belum dirilis dihapus.
   - Pindahkan tabel registry tugas ke database global. Selesai untuk penulisan runtime;
     importer sidecar legacy yang belum dirilis dihapus.
   - Pindahkan tabel Task Flow ke database global. Selesai untuk penulisan runtime;
     importer sidecar legacy yang belum dirilis dihapus.
   - Pindahkan tabel pencarian memori bawaan ke setiap database agen. Selesai; `memorySearch.store.path`
     kustom eksplisit sekarang dihapus oleh migrasi config doctor.
     Reindex penuh berjalan in place hanya terhadap tabel memori; path swap seluruh-file lama
     dan helper swap indeks sidecar dihapus.
   - Hapus opener database duplikat, penyiapan WAL, helper izin, dan
     path close dari subsistem tersebut.

3. Pindahkan tabel milik agen ke database per agen.
   - Buat DB agen sesuai kebutuhan melalui registry database global. Selesai.
   - Pindahkan entri sesi runtime, event transkrip, baris VFS, dan artefak tool
     ke DB agen. Selesai.
   - Jangan migrasikan entri sesi shared-DB lokal branch, event transkrip,
     baris VFS, atau artefak tool; tata letak itu tidak pernah dirilis. Pertahankan hanya
     impor file-ke-database legacy di doctor.

4. Ganti API penyimpanan sesi.
   - Hapus `storePath` sebagai identitas runtime. Selesai untuk runtime dan dijaga
     oleh `check:database-first-legacy-stores`: metadata sesi, pembaruan route,
     persistensi perintah, pembersihan sesi CLI, pratinjau reasoning Feishu,
     persistensi status transkrip, kedalaman subagen, override sesi profil auth,
     logika parent-fork, dan inspeksi QA-lab sekarang resolve
     database dari kunci agen/sesi kanonis.
     Respons daftar sesi Gateway/TUI/UI/macOS sekarang mengekspos `databasePath`
     alih-alih `path` legacy; permukaan debug macOS menampilkan database per agen
     sebagai status read-only alih-alih menulis config `session.store`.
     `/status`, ekspor trajectory berbasis chat, dan proxy dependensi CLI tidak
     lagi meneruskan path penyimpanan legacy; fallback penggunaan transkrip membaca
     SQLite berdasarkan identitas agen/sesi. Pengujian runtime dan bridge tidak lagi mengekspos
     `storePath`; input doctor/migrasi memiliki nama field legacy tersebut.
     Pemuatan sesi gabungan Gateway tidak lagi memiliki branch runtime khusus untuk
     nilai `session.store` non-templated; ia mengagregasi baris SQLite per agen.
     Lane doctor session-lock legacy dan helper pembersihan `.jsonl.lock`-nya
     dihapus; SQLite sekarang menjadi batas konkurensi sesi.
     Call site runtime panas menggunakan nama helper berorientasi baris seperti
     `resolveSessionRowEntry`; alias kompatibilitas lama `resolveSessionStoreEntry`
     telah dihapus dari ekspor runtime dan SDK Plugin.

- Gunakan operasi baris `{ agentId, sessionKey }`.
  Selesai: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry`, dan `listSessionEntries` adalah API SQLite-first yang
  tidak memerlukan path penyimpanan sesi. Ringkasan status, status agen lokal, health,
  dan perintah daftar `openclaw sessions` sekarang membaca baris per agen secara langsung
  dan menampilkan path database SQLite per agen alih-alih path `sessions.json`.
- Ganti delete/insert seluruh penyimpanan dengan `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries`, dan query pembersihan SQL.
  Selesai untuk runtime: path panas sekarang menggunakan API baris dan patch baris dengan retry konflik;
  helper impor/ganti seluruh penyimpanan yang tersisa dibatasi untuk kode impor migrasi
  dan pengujian backend SQLite.
  - Hapus `store-writer.ts` dan pengujian writer-queue. Selesai.
  - Hapus pruning kunci legacy runtime dan parameter alias-delete dari upsert/patch
    baris sesi. Selesai.

5. Hapus perilaku registry JSON runtime.
   - Jadikan baca dan tulis registry sandbox hanya SQLite. Selesai.
   - Impor JSON monolitik dan sharded hanya dari langkah migrasi. Selesai.
   - Hapus lock registry sharded dan penulisan JSON. Selesai.

- Pertahankan satu tabel registry bertipe alih-alih menyimpan baris registry sebagai JSON
  buram generik jika bentuknya tetap menjadi status operasional path panas. Selesai.

6. Hapus mutasi sesi berbentuk file-lock.
   - Selesai untuk pembuatan lock runtime dan API lock runtime.
   - Lane pembersihan doctor `.jsonl.lock` legacy mandiri dihapus.
   - `session.writeLock` adalah config legacy yang dimigrasikan doctor, bukan pengaturan runtime
     bertipe.
   - Integritas status tidak lagi memiliki path pruning file transkrip yatim tersendiri;
     migrasi doctor mengimpor/menghapus sumber JSONL legacy di satu tempat.
   - Koordinasi singleton Gateway menggunakan baris SQLite `state_leases` bertipe di bawah
     `gateway_locks` dan tidak lagi mengekspos seam direktori file-lock.
   - Persistensi dedupe SDK Plugin generik tidak lagi menggunakan file lock atau file JSON;
     ia menulis baris status Plugin SQLite bersama. Selesai.
   - Koordinasi embed QMD menggunakan lease status SQLite alih-alih
     `qmd/embed.lock`. Selesai.

7. Jadikan worker sadar database.
   - Worker membuka koneksi SQLite-nya sendiri.
   - Induk memiliki delivery, callback channel, dan config.
   - Worker menerima id agen, id run, mode filesystem, dan identitas registry DB,
     bukan handle live.
   - `vfs-only` tetap eksperimental dan menggunakan database agen sebagai root penyimpanannya.
   - Pertahankan satu worker per run aktif terlebih dahulu. Pooling dapat menunggu sampai masa hidup
     koneksi DB dan perilaku pembatalan menjadi stabil.

8. Integrasi pencadangan.
   - Ajarkan pencadangan untuk mengambil snapshot database global dan agen melalui SQLite backup atau
     `VACUUM INTO`. Selesai untuk file `*.sqlite` yang ditemukan di bawah aset state.
   - Tambahkan verifikasi pencadangan untuk integritas SQLite dan versi skema. Selesai untuk
     pembuatan pencadangan dan pemeriksaan integritas verifikasi arsip default.
   - Catat metadata proses pencadangan di SQLite. Selesai melalui tabel bersama `backup_runs`
     dengan jalur arsip, status, dan JSON manifes.
   - Tambahkan pemulihan dari snapshot arsip terverifikasi. Selesai: `openclaw backup
restore` memvalidasi sebelum ekstraksi, menggunakan manifes ternormalisasi
     dari verifier, mendukung `--dry-run`, dan mewajibkan `--yes` sebelum mengganti
     jalur sumber yang tercatat.
   - Sertakan ekspor VFS/workspace hanya saat diminta; jangan ekspor internal sesi
     sebagai JSON atau JSONL.

9. Hapus pengujian dan kode usang. Selesai untuk permukaan sesi runtime yang diketahui.

- Hapus pengujian yang menegaskan pembuatan runtime untuk file `sessions.json` atau transkrip
  JSONL. Selesai untuk penyimpanan sesi core, chat, event transkrip Gateway,
  pratinjau, siklus hidup, pembaruan session-entry perintah, reset/trace balasan otomatis, dan
  fixture dreaming memory-core, routing target persetujuan, perbaikan transkrip sesi,
  perbaikan izin keamanan, ekspor trajektori, dan ekspor sesi.
  Pengujian transkrip Active Memory sekarang menegaskan cakupan SQLite dan tidak ada pembuatan file JSONL
  sementara maupun persisten.
  Regresi lama pemangkasan transkrip Heartbeat dihapus karena
  runtime tidak lagi memotong transkrip JSONL.
  Pengujian alat daftar sesi agen tidak lagi memodelkan jalur lama `sessions.json`
  sebagai bentuk respons gateway; pengujian app/UI/macOS menggunakan `databasePath`.
  Pengujian penggunaan transkrip `/status` sekarang menyemai baris transkrip SQLite secara langsung
  alih-alih menulis file JSONL.
  Pengujian siklus hidup sesi Gateway sekarang menggunakan helper penyemaian transkrip SQLite
  secara langsung; bentuk fixture file sesi satu baris lama telah hilang dari cakupan reset
  dan delete.
  `sessions.delete` tidak lagi mengembalikan field era-file `archived: []`; penghapusan
  hanya melaporkan hasil mutasi baris. Opsi lama `deleteTranscript` juga
  hilang: menghapus sesi menghapus root kanonis `sessions` dan membiarkan
  SQLite melakukan cascade pada baris transkrip, snapshot, dan trajektori milik sesi, sehingga tidak ada
  pemanggil yang dapat meninggalkan transkrip yatim atau lupa cabang pembersihan.
  Pengujian penangkapan trajektori context-engine sekarang membaca baris `trajectory_runtime_events`
  dari database agen terisolasi alih-alih membaca
  `session.trajectory.jsonl`.
  Skrip seed channel Docker MCP sekarang menyemai baris SQLite secara langsung. Penulisan langsung
  `sessions.json` dibatasi untuk fixture doctor.
  Tool Search Gateway E2E membaca bukti panggilan alat dari baris transkrip SQLite
  alih-alih memindai file `agents/<agentId>/sessions/*.jsonl`.
  Event host memory-core dan baris scratch session-corpus sekarang berada di plugin-state
  SQLite bersama; `events.jsonl` dan `session-corpus/*.txt` hanya input migrasi doctor
  lama. Baris aktif menggunakan jalur virtual `memory/session-ingestion/`,
  bukan `.dreams/session-corpus`. Modul perbaikan dreaming memory-core lama
  dan pengujian CLI/Gateway-nya dihapus karena runtime tidak lagi
  memiliki perbaikan arsip file untuk korpus itu. Pengujian bridge/public-artifact
  memory-core tidak lagi menampilkan `.dreams/events.jsonl`; pengujian tersebut
  menggunakan nama artefak JSON virtual berbasis SQLite.
  Dokumentasi pengujian SDK/Codex publik sekarang menyebut state sesi SQLite, bukan file sesi,
  dan contoh channel-turn tidak lagi mengekspos argumen `storePath`.
  State sinkronisasi Matrix sekarang menggunakan penyimpanan plugin-state SQLite secara langsung. Kontrak
  klien/runtime aktif meneruskan root penyimpanan akun, bukan jalur `bot-storage.json`,
  dan doctor mengimpor `bot-storage.json` lama ke SQLite sebelum menghapus
  sumbernya. Skenario restart/destruktif QA Matrix sekarang memutasi baris sinkronisasi SQLite
  secara langsung alih-alih membuat atau menghapus file `bot-storage.json` palsu, dan
  substrat E2EE meneruskan root sync-store alih-alih jalur
  `sync-store.json` palsu.
  Pemilihan storage-root Matrix tidak lagi memberi skor root berdasarkan file JSON sinkronisasi/thread lama;
  pemilihan menggunakan metadata root tahan lama plus state kripto nyata.
  Suite pengujian backend sesi SQLite runtime tidak lagi membuat
  `sessions.json`; fixture sumber lama sekarang berada di pengujian doctor
  yang mengimpornya.
  Pengujian sesi Gateway tidak lagi mengekspos helper `createSessionStoreDir` atau
  setup jalur session-store sementara yang tidak digunakan; direktori fixture eksplisit, dan setup
  baris langsung menggunakan penamaan session-row SQLite.
  Cakupan parser session-store JSON5 khusus doctor dipindahkan keluar dari pengujian infra dan
  ke pengujian migrasi doctor, sehingga suite pengujian runtime tidak lagi memiliki parsing
  file sesi lama.
  Pengujian runtime SSO/pending-upload Microsoft Teams tidak lagi membawa fixture atau parser
  sidecar JSON; parsing token SSO lama hanya berada di modul migrasi
  Plugin. Pengujian Telegram tidak lagi menyemai jalur store `/tmp/*.json` palsu;
  pengujian tersebut mereset cache pesan berbasis SQLite secara langsung. Helper test-state
  OpenClaw generik tidak lagi mengekspos writer `auth-profiles.json` lama;
  pengujian migrasi auth doctor memiliki fixture itu secara lokal.
  Pengujian runtime untuk pointer sesi terakhir TUI, persetujuan exec, toggle Active Memory,
  dedupe/verifikasi startup Matrix, sinkronisasi sumber Memory Wiki,
  binding percakapan saat ini, auth onboarding, dan impor secret Hermes tidak
  lagi membuat file sidecar lama atau menegaskan nama file lama tidak ada. Pengujian tersebut
  membuktikan perilaku melalui baris SQLite dan API store publik; pengujian doctor/migrasi
  adalah satu-satunya tempat nama file sumber lama berada.
  Pengujian runtime untuk pairing perangkat/node, channel allowFrom, intent restart,
  handoff restart, entri antrean pengiriman sesi, kesehatan config, cache iMessage,
  Cron jobs, header transkrip PI, registri subagen, dan lampiran gambar terkelola
  juga tidak lagi membuat file JSON/JSONL yang sudah dipensiunkan hanya untuk membuktikan
  file tersebut diabaikan atau tidak ada.
  Pemulihan overflow PI tidak lagi memiliki fallback penulisan ulang/pemotongan
  SessionManager: pemotongan tool-result dan penulisan ulang transkrip context-engine memutasi
  baris transkrip SQLite, lalu menyegarkan state prompt aktif dari database.
  Append pesan SessionManager persisten mendelegasikan ke helper append transkrip SQLite
  atomik untuk pemilihan induk dan idempotensi. Append entri metadata/custom
  normal juga memilih induk saat ini di dalam SQLite, sehingga
  instance manager basi tidak membangkitkan kembali race parent-chain pra-SQLite.
  Pembersihan tail PI sintetis untuk precheck mid-turn dan `sessions_yield` sekarang
  memangkas state transkrip SQLite secara langsung; bridge penghapusan tail SessionManager lama
  dan pengujiannya dihapus.
  Penangkapan checkpoint Compaction juga mengambil snapshot hanya dari SQLite; pemanggil tidak
  lagi meneruskan SessionManager live sebagai sumber transkrip alternatif.
- Pertahankan pengujian yang menyemai file lama hanya untuk migrasi.
- Bukti file JSON telah diganti dengan bukti baris SQL untuk permukaan runtime
  aktif.

- Tambahkan larangan statis untuk penulisan runtime ke jalur JSON sesi/cache lama.
  Selesai untuk guard repo.

10. Jadikan laporan migrasi dapat diaudit.
    - Catat proses migrasi di SQLite dengan timestamp mulai/selesai, jalur sumber,
      hash sumber, jumlah, peringatan, dan jalur pencadangan.
      Selesai: eksekusi migrasi legacy-state sekarang menyimpan laporan `migration_runs`
      dengan inventaris jalur/tabel sumber, SHA-256 file sumber, ukuran,
      jumlah record, peringatan, dan jalur pencadangan.
      Selesai: eksekusi migrasi legacy-state juga menyimpan baris `migration_sources`
      untuk audit tingkat sumber serta keputusan skip/backfill di masa depan.
    - Jadikan apply idempoten. Menjalankan ulang setelah impor parsial harus
      melewati sumber yang sudah diimpor atau menggabungkan berdasarkan kunci stabil.
      Selesai: indeks sesi, transkrip, antrean pengiriman, state Plugin, ledger tugas,
      dan baris SQLite global milik agen diimpor melalui kunci stabil atau
      semantik upsert/replace, sehingga rerun menggabungkan tanpa menduplikasi baris
      tahan lama.
    - Impor gagal harus mempertahankan file sumber asli di tempatnya.
      Selesai: impor transkrip yang gagal sekarang meninggalkan sumber JSONL asli di
      jalur terdeteksinya, dan `migration_sources` mencatat sumber sebagai
      `warning` dengan `removed_source=0` untuk proses doctor berikutnya.

## Aturan Performa

- Satu koneksi per thread/proses sudah memadai; jangan berbagi handle antar
  worker.
- Gunakan WAL, `foreign_keys=ON`, busy timeout 30 detik, dan transaksi tulis `BEGIN IMMEDIATE`
  singkat.
- Pertahankan helper transaksi tulis tetap sinkron kecuali/sampai API transaksi async
  menambahkan semantik mutex/backpressure eksplisit.
- Pertahankan penulisan pengiriman induk kecil dan transaksional.
- Hindari penulisan ulang seluruh store; gunakan upsert/delete tingkat baris.
- Tambahkan indeks untuk jalur list-by-agent, list-by-session, updated-at, run id, dan
  expiration sebelum memindahkan kode panas.
- Simpan artefak besar, media, dan vektor sebagai BLOB atau baris BLOB terpecah, bukan
  JSON base64 atau array numerik.
- Pertahankan entri plugin-state buram tetap kecil dan tercakup.
- Tambahkan pembersihan SQL untuk TTL/expiration alih-alih pemangkasan filesystem.
  Selesai untuk store runtime milik database: media, state Plugin, blob Plugin,
  dedupe persisten, dan cache agen semuanya kedaluwarsa melalui baris SQLite. Pembersihan
  filesystem yang tersisa dibatasi pada materialisasi sementara atau perintah penghapusan
  eksplisit.

## Larangan Statis

Tambahkan pemeriksaan repo yang menggagalkan penulisan runtime baru ke jalur state lama:

- `sessions.json`
- `*.trajectory.jsonl` kecuali keluaran support-bundle yang dimaterialisasi
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- File cache runtime `cache/*.json`
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- Matrix `credentials*.json` dan `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json`
- `devices/paired.json`
- `devices/bootstrap.json`
- `nodes/pending.json`
- `nodes/paired.json`
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- Memory-core `.dreams/events.jsonl`
- Memory-core `.dreams/session-corpus/`
- Memory-core `.dreams/daily-ingestion.json`
- Memory-core `.dreams/session-ingestion.json`
- Memory-core `.dreams/short-term-recall.json`
- Memory-core `.dreams/phase-signals.json`
- Memory-core `.dreams/short-term-promotion.lock`
- Skill Workshop `skill-workshop/<workspace>.json`
- Skill Workshop `skill-workshop/skill-workshop-review-*.json`
- Nostr `bus-state-*.json`
- Nostr `profile-state-*.json`
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- QQBot `session-*.json`
- BlueBubbles `bluebubbles/catchup/*.json`
- BlueBubbles `bluebubbles/inbound-dedupe/*.json`
- Telegram `update-offset-*.json`
- Telegram `sticker-cache.json`
- Telegram `*.telegram-messages.json`
- Telegram `*.telegram-sent-messages.json`
- Telegram `*.telegram-topic-names.json`
- Telegram `thread-bindings-*.json`
- iMessage `catchup/*.json`
- iMessage `reply-cache.jsonl`
- iMessage `sent-echoes.jsonl`
- Microsoft Teams `msteams-conversations.json`
- Microsoft Teams `msteams-polls.json`
- Microsoft Teams `msteams-sso-tokens.json`
- Microsoft Teams `*.learnings.json`
- Matrix `bot-storage.json`
- Matrix `sync-store.json`
- Matrix `thread-bindings.json`
- Matrix `inbound-dedupe.json`
- Matrix `startup-verification.json`
- Matrix `storage-meta.json`
- Matrix `crypto-idb-snapshot.json`
- Discord `model-picker-preferences.json`
- Discord `command-deploy-cache.json`
- file JSON shard registri sandbox
- file JSON bridge `/tmp` relai hook native
- `plugin-state/state.sqlite`
- sidecar runtime ad-hoc `openclaw-state.sqlite`
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock`
- `commands.log`
- `config-health.json`
- `port-guard.json`
- `settings/voicewake.json`
- `settings/voicewake-routing.json`
- `plugin-binding-approvals.json`
- `plugins/installs.json`
- `audit/file-transfer.jsonl`
- `audit/crestodian.jsonl`
- `crestodian/rescue-pending/*.json`
- `plugins/phone-control/armed.json`
- Memory Wiki `.openclaw-wiki/log.jsonl`
- Memory Wiki `.openclaw-wiki/state.json`
- Memory Wiki `.openclaw-wiki/locks/`
- Memory Wiki `.openclaw-wiki/source-sync.json`
- Memory Wiki `.openclaw-wiki/import-runs/*.json`
- Memory Wiki `.openclaw-wiki/cache/agent-digest.json`
- Memory Wiki `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- Dekorasi profil browser `.openclaw-profile-decorated`
- Pembuka sesi berbasis file `SessionManager.open(...)`
- Fasad pencantuman transkrip `SessionManager.listAll(...)` dan `TranscriptSessionManager.listAll(...)`
- Fasad fork transkrip `SessionManager.forkFromSession(...)` dan
  `TranscriptSessionManager.forkFromSession(...)`
- Fasad pengganti sesi dapat diubah `SessionManager.newSession(...)` dan `TranscriptSessionManager.newSession(...)`
- Fasad sesi cabang `SessionManager.createBranchedSession(...)` dan
  `TranscriptSessionManager.createBranchedSession(...)`

Larangan tersebut harus mengizinkan pengujian membuat fixture lama dan mengizinkan kode migrasi
membaca/mengimpor/menghapus sumber file lama. Sidecar SQLite yang belum dirilis tetap dilarang
dan tidak mendapatkan izin impor doctor.

## Kriteria Selesai

- Penulisan data runtime dan cache masuk ke database SQLite global atau agent.
- Runtime tidak lagi menulis indeks sesi, JSONL transkrip, JSON registri sandbox, SQLite sidecar tugas, atau SQLite sidecar plugin-state. Pengimpor SQLite sidecar tugas dan plugin-state yang belum dirilis dihapus.
- Impor file lama hanya melalui doctor.
- Pencadangan menghasilkan satu arsip dengan snapshot SQLite ringkas dan bukti integritas.
- Worker agent dapat berjalan dengan penyimpanan disk, scratch VFS, atau VFS-only eksperimental.
- File konfigurasi dan kredensial eksplisit tetap menjadi satu-satunya file kontrol persisten non-database yang diharapkan.
- Pemeriksaan repo mencegah penyimpanan file runtime lama diperkenalkan kembali.
