---
read_when:
    - Memindahkan data runtime OpenClaw, cache, transkrip, status tugas, atau file sementara ke SQLite
    - Merancang migrasi doctor dari file JSON atau JSONL lama
    - Mengubah perilaku pencadangan, pemulihan, VFS, atau penyimpanan worker
    - Menghapus kunci sesi, pemangkasan, pemotongan, atau jalur kompatibilitas JSON
summary: Rencana migrasi untuk menjadikan SQLite sebagai lapisan state dan cache tahan lama utama sambil tetap mempertahankan konfigurasi berbasis file
title: Refaktor status yang mengutamakan basis data
x-i18n:
    generated_at: "2026-06-27T18:08:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54995a9f43f740e7cc3ac3e0a4b69d73ddba6b2c30731193ab7ce3aa1dfc9d94
    source_path: refactor/database-first.md
    workflow: 16
---

# Refaktor State Database-First

## Keputusan

Gunakan tata letak SQLite dua tingkat:

- Database global: `~/.openclaw/state/openclaw.sqlite`
- Database agen: satu database SQLite per agen untuk workspace milik agen,
  transkrip, VFS, artefak, dan state runtime per agen yang besar
- Konfigurasi tetap berbasis file: `openclaw.json` tetap berada di luar
  database. Profil autentikasi runtime berpindah ke SQLite; file kredensial
  penyedia eksternal atau CLI tetap dikelola pemilik di luar database OpenClaw.

Database global adalah database control-plane. Database ini memiliki penemuan
agen, state Gateway bersama, pemasangan, state perangkat/node, ledger tugas dan
alur, state Plugin, state runtime penjadwal, metadata cadangan, dan state
migrasi.

Database agen adalah database data-plane. Database ini memiliki metadata sesi
agen, stream peristiwa transkrip, workspace VFS atau namespace scratch, artefak
alat, artefak run, dan data cache lokal agen yang dapat dicari/diindeks.

Ini memberikan satu tampilan global yang tahan lama tanpa memaksa workspace
agen yang besar, transkrip, dan data scratch biner masuk ke jalur tulis Gateway
bersama.

## Kontrak Keras

Migrasi ini memiliki satu bentuk runtime kanonis:

- Baris sesi hanya menyimpan metadata sesi. Baris tersebut tidak boleh menyimpan
  `transcriptLocator`, path file transkrip, path JSONL saudara, path lock,
  metadata pruning, atau pointer kompatibilitas era file.
- Identitas transkrip selalu berupa identitas SQLite: `{agentId, sessionId}` plus
  metadata topik opsional saat protokol membutuhkannya.
- `sqlite-transcript://...` bukan identitas runtime atau protokol. Kode baru
  tidak boleh menurunkan, menyimpan, meneruskan, mengurai, atau memigrasikan
  locator transkrip. Runtime dan pengujian sebaiknya tidak memuat pseudo-locator
  sama sekali; dokumen boleh menyebut string tersebut hanya untuk melarangnya.
- `sessions.json`, JSONL transkrip, `.jsonl.lock`, pruning, truncation, dan
  logika path sesi lama hanya menjadi bagian dari jalur migrasi/impor doctor.
- Alias konfigurasi sesi lama hanya menjadi bagian dari migrasi doctor. Runtime
  tidak menafsirkan `session.idleMinutes`, `session.resetByType.dm`, atau alias
  sesi utama lintas agen `agent:main:*` untuk agen lain yang dikonfigurasi.
- Identitas routing sesi adalah state relasional bertipe. Jalur runtime panas
  dan UI sebaiknya membaca `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations`, dan
  `session_conversations`; jalur tersebut tidak boleh mengurai `session_key` atau
  menambang `session_entries.entry_json` untuk identitas penyedia kecuali sebagai
  bayangan kompatibilitas sementara saat call site lama sedang dihapus.
- Penanda pesan langsung tingkat channel seperti `dm` versus `direct` adalah
  kosakata routing, bukan locator transkrip atau handle kompatibilitas file-store.
- Konfigurasi handler hook lama hanya menjadi bagian dari permukaan
  peringatan/migrasi doctor. Runtime tidak boleh memuat
  `hooks.internal.handlers`; hook hanya berjalan melalui direktori hook yang
  ditemukan dan metadata `HOOK.md`.
- Startup runtime, jalur balasan panas, Compaction, reset, pemulihan,
  diagnostik, TTS, hook memori, subagen, routing perintah Plugin, batas
  protokol, dan hook harus meneruskan `{agentId, sessionId}` melalui runtime.
- Pengujian sebaiknya men-seed dan menegaskan baris transkrip SQLite melalui
  `{agentId, sessionId}`. Pengujian yang hanya membuktikan penerusan path JSONL,
  pelestarian locator yang dipasok pemanggil, atau kompatibilitas file transkrip
  harus dihapus kecuali mencakup impor doctor, materialisasi dukungan/debug
  non-sesi, atau bentuk protokol.
- `runEmbeddedPiAgent(...)`, run worker yang disiapkan, dan attempt embedded
  bagian dalam tidak boleh menerima locator transkrip. Semuanya membuka manajer
  transkrip SQLite berdasarkan `{agentId, sessionId}` dan meneruskan manajer itu
  ke sesi agen kompatibel PI yang diinternalisasi, sehingga pemanggil usang tidak
  dapat membuat runner menulis transkrip JSON/JSONL.
- Diagnostik runner harus menyimpan record jejak runtime/cache/payload di
  SQLite. Diagnostik runtime tidak boleh mengekspos knob override file JSONL
  atau helper ekspor JSONL transkrip generik; ekspor yang terlihat pengguna dapat
  mematerialisasikan artefak eksplisit dari baris database tanpa memasukkan nama
  file kembali ke runtime.
- Logging stream mentah menggunakan `OPENCLAW_RAW_STREAM=1` plus baris
  diagnostik SQLite. Kontrak file logger pi-mono lama `PI_RAW_STREAM`,
  `PI_RAW_STREAM_PATH`, dan `raw-openai-completions.jsonl` bukan bagian dari
  runtime atau pengujian OpenClaw.
- Pengindeksan memori QMD tidak boleh mengekspor transkrip SQLite ke file
  markdown. QMD hanya mengindeks file memori yang dikonfigurasi; pencarian
  transkrip sesi tetap berbasis SQLite.
- Subpath SDK QMD hanya untuk QMD bagi kode baru. Helper pengindeksan transkrip
  sesi SQLite berada di `memory-core-host-engine-session-transcripts`; ekspor
  ulang QMD apa pun hanya untuk kompatibilitas dan tidak boleh digunakan oleh
  kode runtime.
- Indeks memori bawaan berada di database agen pemiliknya. Konfigurasi runtime
  dan kontrak runtime yang di-resolve tidak boleh mengekspos
  `memorySearch.store.path`; doctor menghapus key konfigurasi lama itu dan kode
  saat ini meneruskan `databasePath` agen secara internal.

Pekerjaan implementasi sebaiknya terus menghapus kode sampai pernyataan ini
benar tanpa pengecualian di luar batas doctor/impor/ekspor/debug.

## State tujuan dan progres

### Tujuan keras

- Satu database SQLite global memiliki state control-plane:
  `state/openclaw.sqlite`.
- Satu database SQLite per agen memiliki state data-plane:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Konfigurasi tetap berbasis file. `openclaw.json` bukan bagian dari refaktor
  database ini.
- File lama hanya menjadi input migrasi doctor.
- Runtime tidak pernah menulis atau membaca sesi atau JSONL transkrip sebagai
  state aktif.

### State tujuan

- `not-started`: kode runtime era file masih menulis state aktif.
- `migrating`: kode doctor/impor dapat memindahkan data file ke SQLite.
- `dual-read`: bridge sementara membaca SQLite dan file lama sekaligus. State
  ini dilarang untuk refaktor ini kecuali didokumentasikan secara eksplisit
  sebagai khusus doctor.
- `sqlite-runtime`: runtime hanya membaca dan menulis SQLite.
- `clean`: API runtime lama dan pengujian dihapus, dan guard mencegah regresi.
- `done`: dokumen, pengujian, cadangan, migrasi doctor, dan pemeriksaan changed
  membuktikan state bersih.

### State saat ini

- Sesi: `clean` untuk runtime. Baris sesi berada di database per agen, API
  runtime menggunakan `{agentId, sessionId}` atau `{agentId, sessionKey}`, dan
  `sessions.json` adalah input lama khusus doctor.
- Transkrip: `clean` untuk runtime. Peristiwa transkrip, identitas, snapshot,
  dan peristiwa runtime trajectory berada di database per agen. Runtime tidak
  lagi menerima locator transkrip atau path transkrip JSONL.
- Runner embedded PI: `clean`. Run embedded PI, worker yang disiapkan,
  Compaction, dan loop retry menggunakan scope sesi SQLite dan menolak handle
  transkrip usang.
- Cron: `clean` untuk runtime. Runtime menggunakan `cron_jobs` dan
  `cron_run_logs`; pengujian runtime menggunakan penamaan `storeKey` SQLite, dan
  path Cron era file tetap hanya ada dalam pengujian migrasi lama doctor.
- Registry tugas: `clean`. Baris runtime tugas dan Task Flow berada di
  `state/openclaw.sqlite`; importer SQLite sidecar yang belum pernah dikirim
  dihapus.
- State Plugin: `clean`. Baris state/blob Plugin berada di database global
  bersama; helper SQLite sidecar plugin-state lama dijaga agar tidak digunakan.
- Memori: `sqlite-runtime` untuk memori bawaan dan pengindeksan transkrip sesi.
  Tabel indeks memori berada di database per agen, state memori Plugin
  menggunakan baris plugin-state bersama, dan file memori lama adalah input
  migrasi doctor atau konten workspace pengguna.
- Cadangan: `sqlite-runtime`. Tahap cadangan memadatkan snapshot SQLite,
  menghilangkan sidecar WAL/SHM live, memverifikasi integritas SQLite, dan
  merekam run cadangan di database global.
- Migrasi doctor: `migrating`, secara sengaja. Doctor mengimpor JSON lama,
  JSONL, dan store sidecar yang sudah pensiun ke SQLite, merekam run/sumber
  migrasi, dan menghapus sumber yang berhasil.
- Skrip E2E: `clean` untuk cakupan runtime. Seeding Docker MCP menulis baris
  SQLite. Skrip Docker runtime-context membuat JSONL lama hanya di dalam seed
  migrasi doctor dan menamai path indeks sesi lama secara eksplisit.

### Pekerjaan tersisa

- [x] Ganti nama variabel store pengujian runtime Cron dari `storePath` kecuali
      variabel tersebut adalah input lama doctor.
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
- [x] Jadikan seed JSONL lama Docker runtime-context jelas khusus doctor.
      File: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Bukti: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` hanya menampilkan
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Jaga tipe hasil generasi Kysely tetap selaras setelah perubahan skema apa pun.
      File: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Bukti: tidak ada perubahan skema dalam pass ini; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Jalankan ulang pengujian terfokus untuk store, perintah, dan skrip yang disentuh.
      Bukti: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Sebelum menyatakan `done`, jalankan gate changed atau bukti luas jarak jauh.
      Bukti: `pnpm check:changed --timed -- <changed extension paths>` lulus pada
      run Hetzner Crabbox `run_3f1cabf6b25c` setelah setup sementara Node 24/pnpm dan
      routing path eksplisit untuk workspace tersinkron tanpa `.git`.

### Jangan regresi

- Tidak ada locator transkrip.
- Tidak ada file sesi aktif.
- Tidak ada fixture pengujian JSONL palsu kecuali pengujian migrasi lama doctor.
- Tidak ada akses SQLite mentah saat Kysely diharapkan.
- Tidak ada migrasi DB lama baru. Tata letak ini belum dikirim; pertahankan
  versi skema di `1` kecuali ada alasan kuat.

## Asumsi Pembacaan Kode

Tidak ada keputusan produk lanjutan yang memblokir rencana ini. Implementasi
sebaiknya dilanjutkan dengan asumsi berikut:

- Gunakan `node:sqlite` secara langsung dan wajibkan runtime Node 22+ untuk jalur
  penyimpanan ini.
- Pertahankan tepat satu berkas konfigurasi normal. Jangan pindahkan konfigurasi, manifest
  plugin, atau workspace Git ke SQLite dalam refactor ini.
- Berkas kompatibilitas runtime tidak diperlukan. Berkas JSON dan JSONL lama hanya menjadi
  input migrasi. Sidecar SQLite lokal-branch tidak pernah dirilis dan
  dihapus alih-alih diimpor.
- `openclaw doctor --fix` memiliki langkah migrasi berkas lama ke database.
  Startup runtime dan `openclaw migrate` tidak boleh membawa jalur upgrade database
  OpenClaw lama.
- Kompatibilitas kredensial mengikuti aturan yang sama: kredensial runtime berada di
  SQLite. Berkas `auth-profiles.json` lama, `auth.json` per-agent, dan
  `credentials/oauth.json` bersama adalah input migrasi doctor, lalu dihapus
  setelah impor.
- State katalog model yang dihasilkan didukung database. Kode runtime tidak boleh menulis
  `agents/<agentId>/agent/models.json`; berkas `models.json` yang ada adalah input doctor
  lama dan dihapus setelah diimpor ke `agent_model_catalogs`.
- Runtime tidak boleh memigrasikan, menormalkan, atau menjembatani locator transkrip. Identitas
  transkrip aktif adalah `{agentId, sessionId}` di SQLite. Jalur berkas hanya
  menjadi input doctor lama, dan `sqlite-transcript://...` harus hilang dari
  permukaan runtime, protokol, hook, dan plugin alih-alih diperlakukan sebagai
  handle batas.
- Pembacaan transkrip SQLite runtime tidak menjalankan migrasi bentuk entri JSONL lama atau
  menulis ulang seluruh transkrip untuk kompatibilitas. Normalisasi entri lama tetap berada di
  utilitas doctor/impor eksplisit. Doctor menormalkan berkas transkrip JSONL lama
  sebelum menyisipkan baris SQLite; baris runtime saat ini sudah
  ditulis dalam skema transkrip saat ini. Ekspor trajectory/sesi
  membaca baris tersebut apa adanya dan tidak boleh melakukan migrasi lama saat ekspor.
- Helper parse/migrasi transkrip JSONL lama hanya untuk doctor. Kode format
  transkrip runtime hanya membangun konteks transkrip SQLite saat ini; doctor
  memiliki upgrade entri JSONL lama sebelum menyisipkan baris.
- Helper streaming transkrip JSONL lama yang dimiliki runtime telah dihapus. Kode impor
  doctor memiliki pembacaan berkas lama secara eksplisit; riwayat sesi runtime membaca
  baris SQLite.
- Binding app-server Codex menggunakan `sessionId` OpenClaw sebagai kunci
  kanonis di namespace state plugin Codex. `sessionKey` adalah metadata untuk
  routing/tampilan dan tidak boleh menggantikan id sesi durable atau membangkitkan kembali
  identitas berkas transkrip.
- Engine konteks menerima kontrak runtime saat ini secara langsung. Registry
  tidak boleh membungkus engine dengan shim retry yang menghapus `sessionKey`,
  `transcriptScope`, atau `prompt`; engine yang tidak dapat menerima params
  database-first saat ini harus gagal secara lantang alih-alih dijembatani.
- Output backup harus tetap berupa satu berkas arsip. Isi database harus masuk
  ke arsip tersebut sebagai snapshot SQLite ringkas, bukan sidecar WAL live mentah.
- Pencarian transkrip berguna tetapi tidak wajib untuk cut database-first pertama.
  Rancang skema agar FTS dapat ditambahkan nanti.
- Eksekusi worker harus tetap eksperimental di balik pengaturan sementara batas
  database dimatangkan.

## Temuan Pembacaan Kode

Branch saat ini sudah melewati tahap proof-of-concept. Database bersama
sudah ada, `node:sqlite` Node sudah dihubungkan melalui helper runtime kecil, dan
store sebelumnya kini menulis ke `state/openclaw.sqlite` atau database
`openclaw-agent.sqlite` pemiliknya.

Pekerjaan yang tersisa bukan memilih SQLite; melainkan menjaga batas baru tetap bersih
dan menghapus antarmuka berbentuk kompatibilitas yang masih tampak seperti dunia
berkas lama:

- `storePath` sesi bukan lagi identitas runtime, bentuk fixture test, atau
  field payload status. Test runtime dan bridge tidak lagi memuat nama kontrak
  `storePath`; kode doctor/migrasi memiliki kosakata lama tersebut.
- Penulisan sesi tidak lagi melewati antrean `store-writer.ts` in-process lama.
  Penulisan patch SQLite menggunakan deteksi konflik dan retry terbatas sebagai gantinya.
- Penemuan jalur lama masih memiliki penggunaan migrasi yang valid, tetapi kode runtime harus
  berhenti memperlakukan `sessions.json` dan berkas JSONL transkrip sebagai kemungkinan target
  tulis.
- Tabel milik agent berada di database SQLite per-agent. DB global menyimpan
  baris registry/control-plane; identitas transkrip adalah `{agentId, sessionId}` di
  baris transkrip per-agent. Kode runtime tidak boleh menyimpan jalur berkas transkrip
  atau memigrasikan locator transkrip.
- Doctor sudah mengimpor beberapa berkas lama. Pembersihannya adalah menjadikannya
  satu implementasi migrasi eksplisit yang dipanggil doctor, dengan laporan migrasi
  durable.

Tidak ada pertanyaan produk tambahan yang memblokir implementasi.

## Bentuk Kode Saat Ini

Branch ini sudah memiliki basis SQLite bersama yang nyata:

- Batas minimum runtime sekarang adalah Node 22+: `package.json`, penjaga runtime CLI,
  default penginstal, pencari runtime macOS, CI, dan dokumen instalasi publik semuanya
  selaras. Lane kompatibilitas Node 22 lama dihapus.
- `src/state/openclaw-state-db.ts` membuka `openclaw.sqlite`, mengatur WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON`, dan menerapkan
  modul skema yang dihasilkan dari
  `src/state/openclaw-state-schema.sql`.
- Tipe tabel Kysely dan modul skema runtime dihasilkan dari basis data SQLite
  sekali pakai yang dibuat dari file `.sql` yang dikomit; kode runtime tidak lagi
  menyimpan string skema salin-tempel untuk basis data global, per-agen, atau
  penangkapan proxy.
- Penyimpanan runtime menurunkan tipe baris terpilih dan tersisip dari antarmuka
  Kysely `DB` yang dihasilkan tersebut, alih-alih membayangi bentuk baris SQLite
  secara manual. SQL mentah tetap dibatasi untuk penerapan skema, pragma, dan DDL
  khusus migrasi.
- Skema SQLite disederhanakan menjadi `user_version = 1` karena tata letak basis data
  ini belum pernah dirilis. Pembuka runtime hanya membuat skema saat ini;
  impor file-ke-basis-data tetap berada di kode doctor, dan helper peningkatan
  basis data lokal cabang telah dihapus.
- Kepemilikan relasional ditegakkan di tempat batas kepemilikannya kanonis:
  baris migrasi sumber berkaskade dari `migration_runs`, status pengiriman tugas
  berkaskade dari `task_runs`, dan baris identitas transkrip berkaskade dari
  peristiwa transkrip.
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
- State arbitrer milik plugin tidak mendapatkan tabel bertipe milik host. Plugin
  terpasang menggunakan `plugin_state_entries` untuk payload JSON berversi dan
  `plugin_blob_entries` untuk byte, dengan kepemilikan namespace/key, pembersihan TTL,
  pencadangan, dan catatan migrasi plugin. State orkestrasi plugin milik host masih
  dapat memiliki tabel bertipe ketika host memiliki kontrak kueri, seperti
  `plugin_binding_approvals`.
- Migrasi plugin adalah migrasi data atas namespace milik plugin, bukan migrasi skema
  host. Sebuah plugin dapat memigrasikan entri state/blob berversi miliknya sendiri
  melalui penyedia migrasi, dan host mencatat status sumber/run di ledger migrasi
  normal. Instalasi plugin baru tidak memerlukan perubahan
  `openclaw-state-schema.sql` kecuali host sendiri mengambil kepemilikan atas
  kontrak lintas-plugin baru.
- `src/state/openclaw-agent-db.ts` membuka
  `agents/<agentId>/agent/openclaw-agent.sqlite`, mendaftarkan basis data di DB
  global, dan memiliki tabel sesi, transkrip, VFS, artefak, cache, dan indeks memori
  lokal agen. Penemuan runtime bersama sekarang membaca registry `agent_databases`
  bertipe yang dihasilkan, alih-alih mengimplementasikan ulang kueri itu di setiap
  lokasi pemanggilan.
- Basis data global dan per-agen mencatat baris `schema_meta` dengan peran basis data,
  versi skema, timestamp, dan id agen untuk basis data agen. Tata letaknya masih
  tetap pada `user_version = 1` karena skema SQLite ini belum dirilis.
- Identitas sesi per-agen sekarang memiliki tabel root kanonis `sessions` yang dikunci
  oleh `session_id`, dengan `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, timestamp, field tampilan, metadata model,
  id harness, dan tautan parent/spawn sebagai kolom yang dapat dikuery. `session_routes`
  adalah indeks rute aktif unik dari `session_key` ke `session_id` saat ini, sehingga
  kunci rute dapat berpindah ke sesi durable baru tanpa membuat pembacaan panas memilih
  di antara baris `sessions.session_key` duplikat. Payload berbentuk kompatibilitas
  lama `session_entries.entry_json` menggantung pada root durable `session_id` melalui
  foreign key; itu bukan lagi satu-satunya representasi level skema dari sebuah sesi.
- Identitas percakapan eksternal per-agen juga relasional:
  `conversations` menyimpan identitas provider/account/conversation yang dinormalisasi,
  dan `session_conversations` menautkan satu sesi OpenClaw ke satu atau lebih
  percakapan eksternal. Ini mencakup sesi DM shared-main saat beberapa peer dapat
  sengaja dipetakan ke satu sesi tanpa berbohong di `session_key`. SQLite juga
  menegakkan keunikan untuk identitas penyedia alami sehingga tuple
  channel/account/kind/peer/thread yang sama tidak dapat bercabang ke id percakapan
  berbeda. Peer langsung shared-main ditautkan dengan peran `participant`, sehingga
  satu sesi OpenClaw dapat merepresentasikan beberapa peer DM eksternal tanpa
  menurunkan peer lama menjadi baris terkait yang samar. `sessions.primary_conversation_id`
  masih menunjuk ke target pengiriman bertipe saat ini. Kolom routing/status tertutup
  ditegakkan dengan constraint `CHECK` SQLite, bukan hanya mengandalkan union TypeScript.
  Proyeksi entri sesi runtime menghapus bayangan routing kompatibilitas dari
  `session_entries.entry_json` sebelum menerapkan kolom sesi/percakapan bertipe,
  sehingga payload JSON basi tidak dapat membangkitkan kembali target pengiriman.
  Routing pengumuman subagen juga memerlukan konteks pengiriman SQLite bertipe;
  ia tidak lagi fallback ke field rute kompatibilitas `SessionEntry`.
  Pewarisan pengiriman eksplisit Gateway `chat.send` membaca konteks pengiriman
  SQLite bertipe alih-alih field kompatibilitas `origin`/`last*`.
  `tools.effective` juga menurunkan konteks provider/account/thread dari baris
  pengiriman/routing SQLite bertipe, bukan bayangan entri sesi `last*` yang basi.
  Konteks prompt peristiwa sistem membangun ulang field channel/to/account/thread
  dari field pengiriman bertipe, bukan dari bayangan `origin`.
  Helper bersama `deliveryContextFromSession` dan pemeta sesi-ke-percakapan sekarang
  mengabaikan `SessionEntry.origin` sepenuhnya; hanya field pengiriman bertipe dan
  baris percakapan relasional yang dapat membuat identitas rute panas.
  Normalisasi entri sesi runtime menghapus `origin` sebelum mempertahankan atau
  memproyeksikan `entry_json`, dan penulisan metadata masuk menulis field channel/chat
  bertipe plus baris percakapan relasional, alih-alih membuat bayangan origin baru.
- Peristiwa transkrip, snapshot transkrip, dan peristiwa runtime trajectory sekarang
  mereferensikan root `sessions` per-agen kanonis dan berkaskade saat sesi dihapus.
  Baris identitas/idempotensi transkrip tetap berkaskade dari baris peristiwa
  transkrip yang tepat.
- Indeks memory-core sekarang menggunakan tabel basis data agen eksplisit
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks`, dan
  `memory_embedding_cache`, dengan `memory_index_state` melacak perubahan revisi.
  Indeks samping FTS/vector opsional dinamai `memory_index_chunks_fts` dan
  `memory_index_chunks_vec`, bukan tabel generik `meta`, `files`, `chunks`,
  `chunks_fts`, atau `chunks_vec`. Nama kanonis mempertahankan bentuk baris
  path/source saat ini dan kompatibilitas embedding terserialisasi. Tabel-tabel ini
  adalah cache turunan/pencarian, bukan penyimpanan transkrip kanonis; tabel ini dapat
  dihapus dan dibangun ulang dari file workspace memori dan sumber yang dikonfigurasi.
  Membuka indeks memori nama-generik yang sudah dirilis memigrasikan metadata, sumber,
  chunk, dan cache embedding-nya ke tabel kanonis; tabel FTS/vector turunan dibangun
  ulang dengan nama kanonisnya.
- State pemulihan run subagen sekarang berada di baris `subagent_runs` bersama bertipe
  dengan kunci sesi child, requester, dan controller yang diindeks. File lama
  `subagents/runs.json` hanya menjadi input migrasi doctor.
- Binding percakapan saat ini sekarang berada di baris
  `current_conversation_bindings` bersama bertipe yang dikunci oleh id percakapan
  ternormalisasi, dengan kolom target agen/sesi, jenis percakapan, status, kedaluwarsa,
  dan metadata yang disimpan sebagai kolom relasional, bukan record binding buram
  yang diduplikasi. Kunci binding durable menyertakan jenis percakapan ternormalisasi
  sehingga referensi direct/group/channel tidak dapat bertabrakan, dan SQLite menolak
  nilai jenis/status binding yang tidak valid. File lama
  `bindings/current-conversations.json` hanya menjadi input migrasi doctor.
- Pemulihan antrean pengiriman sekarang melapisi kolom antrean bertipe untuk channel,
  target, account, sesi, retry, error, platform-send, dan state pemulihan ke JSON
  replay. `entry_json` menyimpan payload replay, hook, dan payload pemformatan, tetapi
  kolom bertipe bersifat otoritatif untuk routing/state antrean panas.
- Pointer pemulihan sesi terakhir TUI sekarang berada di baris bersama bertipe
  `tui_last_sessions` yang dikunci oleh hash cakupan koneksi/sesi TUI.
  File JSON TUI lama hanya menjadi input migrasi doctor.
- Preferensi TTS default sekarang berada di baris SQLite state plugin bersama yang
  dikunci di bawah plugin `speech-core`. File lama `settings/tts.json` hanya menjadi
  input migrasi doctor; runtime tidak lagi membaca atau menulis file JSON preferensi
  TTS, dan resolver path legacy berada di modul migrasi doctor.
- Metadata target secret sekarang berbicara tentang store, bukan berpura-pura setiap
  target kredensial adalah file config. `openclaw.json` tetap menjadi store config;
  target auth-profile menggunakan baris SQLite bertipe `auth_profile_stores` dengan
  kredensial berbentuk penyedia yang disimpan sebagai payload JSON.
- Audit secret tidak lagi memindai file `auth.json` per-agen yang sudah dihentikan.
  Doctor memiliki peringatan, impor, dan penghapusan file legacy tersebut.
- Helper path profil auth legacy sekarang berada di kode legacy doctor. Helper path
  profil auth inti mengekspos identitas auth-store SQLite dan lokasi tampilan, bukan
  path runtime `auth-profiles.json` atau `auth-state.json`.
- Modul runtime pemulihan run subagen dan cache kapabilitas model OpenRouter sekarang
  memisahkan reader/writer snapshot SQLite dari helper impor JSON legacy khusus doctor.
  Kapabilitas OpenRouter menggunakan baris generik bertipe `model_capability_cache`
  di bawah `provider_id = "openrouter"`, bukan satu blob cache buram atau tabel host
  khusus penyedia. `taskName` run subagen disimpan di kolom bertipe
  `subagent_runs.task_name`; salinan `payload_json` adalah data replay/debug, bukan
  sumber untuk field tampilan panas atau lookup.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` mengimplementasikan VFS SQLite
  di atas tabel basis data agen `vfs_entries`. Pembacaan direktori, ekspor rekursif,
  penghapusan, dan penggantian nama menggunakan rentang prefiks `(namespace, path)`
  yang diindeks, alih-alih memindai seluruh namespace atau mengandalkan pencocokan
  path `LIKE`.
- `src/agents/runtime-worker.entry.ts` membuat penyimpanan VFS SQLite, artefak tool,
  artefak run, dan cache bercakupan per-run untuk worker.
- Marker penyelesaian bootstrap workspace sekarang berada di baris bersama bertipe
  `workspace_setup_state` yang dikunci oleh path workspace yang di-resolve, bukan
  `.openclaw/workspace-state.json`; runtime tidak lagi membaca atau menulis ulang
  marker workspace legacy, dan API helper tidak lagi mengoper path palsu
  `.openclaw/setup-state` hanya untuk menurunkan identitas penyimpanan.
- Persetujuan exec sekarang berada di baris singleton SQLite bersama bertipe
  `exec_approvals_config`. Doctor mengimpor legacy `~/.openclaw/exec-approvals.json`;
  penulisan runtime tidak lagi membuat, menulis ulang, atau melaporkan file itu sebagai
  lokasi store aktifnya. Pendamping macOS membaca dan menulis baris tabel
  `state/openclaw.sqlite` yang sama; ia hanya menyimpan socket prompt Unix di disk
  karena itu adalah IPC, bukan state runtime durable.
- Modul runtime identitas perangkat, auth perangkat, dan bootstrap sekarang memisahkan
  reader/writer snapshot SQLite dari helper impor JSON legacy khusus doctor. Identitas
  perangkat menggunakan baris bertipe `device_identities` dan token auth perangkat
  menggunakan baris bertipe `device_auth_tokens`. Penulisan auth perangkat
  merekonsiliasi baris berdasarkan perangkat/peran alih-alih memotong tabel token,
  dan runtime tidak lagi merutekan pembaruan satu token melalui adapter whole-store
  lama. Legacy
  Payload JSON versi-1 hanya ada sebagai bentuk impor/ekspor doctor.
- Cache pertukaran token GitHub Copilot menggunakan tabel status Plugin SQLite bersama
  di bawah `github-copilot/token-cache/default`. Ini adalah status cache milik penyedia,
  sehingga sengaja tidak menambahkan tabel skema host.
- Compaction GitHub Copilot tidak lagi menulis file pendamping ruang kerja
  `openclaw-compaction-*.json`. Harness memanggil RPC Compaction riwayat SDK untuk
  sesi SDK yang dilacak, dan OpenClaw menyimpan status sesi/transkrip tahan lama di
  SQLite alih-alih file penanda kompatibilitas.
- Runtime Swift bersama (`OpenClawKit`) menggunakan baris
  `state/openclaw.sqlite` yang sama untuk identitas perangkat dan autentikasi perangkat. Helper aplikasi macOS
  mengimpor helper SQLite bersama alih-alih memiliki jalur JSON atau
  SQLite kedua. Sisa `identity/device.json` legacy memblokir pembuatan identitas
  hingga doctor mengimpornya ke SQLite, sesuai dengan gate startup TypeScript dan Android.
- Identitas perangkat Android menggunakan material kunci yang kompatibel dengan TypeScript yang sama
  yang disimpan dalam baris bertipe `state/openclaw.sqlite#table/device_identities`. Ia tidak pernah
  membaca atau menulis `openclaw/identity/device.json`; file legacy yang tersisa memblokir
  startup hingga doctor mengimpornya ke SQLite.
- Token autentikasi perangkat cache Android juga menggunakan baris bertipe
  `state/openclaw.sqlite#table/device_auth_tokens` dan berbagi semantik token
  versi-1 yang sama seperti TypeScript dan Swift. Runtime tidak lagi membaca kunci kompatibilitas `SecurePrefs`
  `gateway.deviceToken*`; kunci tersebut hanya milik logika migrasi/doctor.
- Riwayat paket terbaru notifikasi Android menggunakan baris bertipe
  `android_notification_recent_packages`. Runtime tidak lagi memigrasikan atau
  membaca kunci CSV SharedPreferences lama.
- Pembuatan identitas perangkat gagal tertutup saat `identity/device.json` legacy
  ada, saat baris identitas SQLite tidak valid, atau saat penyimpanan identitas
  SQLite tidak dapat dibuka. Doctor mengimpor dan menghapus file itu terlebih dahulu, sehingga startup
  runtime tidak dapat diam-diam merotasi identitas pairing sebelum migrasi.
- Pemilihan identitas perangkat adalah kunci baris SQLite, bukan penunjuk lokasi file JSON. Pengujian
  dan helper Gateway meneruskan kunci identitas eksplisit; hanya migrasi doctor dan
  gate startup gagal-tertutup yang mengetahui nama file `identity/device.json` yang sudah dihentikan.
- Kompatibilitas reset sesi sekarang berada dalam migrasi konfigurasi doctor:
  `session.idleMinutes` dipindahkan ke `session.reset.idleMinutes`,
  `session.resetByType.dm` dipindahkan ke `session.resetByType.direct`, dan
  kebijakan reset runtime hanya membaca kunci reset kanonis.
- Kompatibilitas konfigurasi legacy sekarang berada di bawah `src/commands/doctor/`. Validasi
  `readConfigFileSnapshot()` normal tidak mengimpor detektor legacy doctor
  atau memberi anotasi masalah legacy; `runDoctorConfigPreflight()` menambahkan masalah tersebut untuk
  perbaikan/pelaporan doctor. Alur konfigurasi doctor mengimpor
  `src/commands/doctor/legacy-config.ts`, dan perbaikan id profil OAuth lama berada
  di bawah
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Perintah non-doctor tidak menjalankan otomatis perbaikan konfigurasi legacy. Misalnya,
  `openclaw update --channel` sekarang gagal pada konfigurasi legacy yang tidak valid dan meminta
  pengguna menjalankan doctor, alih-alih diam-diam mengimpor kode migrasi doctor.
- Web push, APNs, Voice Wake, pemeriksaan pembaruan, dan kesehatan konfigurasi sekarang menggunakan tabel SQLite bersama bertipe
  untuk langganan, kunci VAPID, pendaftaran Node, baris pemicu,
  baris perutean, status notifikasi pembaruan, dan entri kesehatan konfigurasi alih-alih
  blob JSON buram utuh. Penulisan snapshot web push dan APNs sekarang merekonsiliasi
  langganan/pendaftaran berdasarkan kunci utama alih-alih mengosongkan tabelnya;
  kesehatan konfigurasi melakukan hal yang sama berdasarkan jalur konfigurasi.
  Modul runtime mereka menjaga pembaca/penulis snapshot SQLite terpisah dari
  helper impor JSON legacy khusus doctor.
- Konfigurasi host Node sekarang menggunakan baris singleton bertipe dalam database SQLite bersama;
  doctor mengimpor file `node.json` lama sebelum penggunaan runtime normal.
- Pairing perangkat/node, pairing channel, allowlist channel, dan status bootstrap
  sekarang menggunakan baris SQLite bertipe alih-alih blob JSON buram utuh. Persetujuan binding Plugin
  dan status tugas Cron mengikuti pemisahan yang sama: modul runtime mengekspos
  operasi berbasis SQLite dan helper snapshot netral, dan penulisan snapshot pairing/bootstrap
  plus persetujuan binding Plugin merekonsiliasi baris berdasarkan kunci utama
  alih-alih memotong tabel, sementara doctor mengimpor/menghapus file JSON lama melalui
  modul `src/commands/doctor/legacy/*`.
- Rekaman Plugin terpasang sekarang berada di indeks Plugin terpasang SQLite.
  Baca/tulis konfigurasi runtime tidak lagi memigrasikan atau mempertahankan data konfigurasi tertulis
  `plugins.installs` lama; doctor mengimpor bentuk konfigurasi legacy tersebut
  ke SQLite sebelum penggunaan runtime normal.
- Snapshot pemulihan kredensial QQBot sekarang berada di status Plugin SQLite di bawah
  `qqbot/credential-backups`. Runtime tidak lagi menulis
  `qqbot/data/credential-backup*.json`; doctor mengimpor dan menghapus file
  cadangan legacy tersebut bersama input status QQBot lainnya.
- Perencanaan reload Gateway membandingkan snapshot indeks Plugin terpasang SQLite di bawah
  namespace diff internal `installedPluginIndex.installRecords.*`. Keputusan
  reload runtime tidak lagi membungkus baris tersebut dalam objek konfigurasi `plugins.installs`
  palsu.
- Peningkatan kredensial akun bernama Matrix tidak lagi terjadi selama pembacaan
  runtime. Doctor memiliki penggantian nama `credentials/matrix/credentials.json`
  tingkat atas lama saat satu akun/default Matrix dapat diselesaikan.
- Modul runtime pairing inti dan Cron tidak lagi mengekspor pembuat jalur JSON legacy.
  Modul legacy milik doctor membangun jalur sumber `pending.json`, `paired.json`,
  `bootstrap.json`, dan `cron/jobs.json` hanya untuk pengujian impor dan
  migrasi. Normalisasi bentuk tugas Cron legacy dan impor log run Cron
  berada di bawah `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` mengimpor file status JSON legacy,
  termasuk konfigurasi host Node, ke SQLite dari doctor. Importer file legacy baru
  tetap berada di bawah `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` mengimpor `sessions.json` legacy dan
  transkrip `*.jsonl` langsung ke SQLite serta menghapus sumber yang berhasil. Ia
  tidak lagi men-stage transkrip legacy root melalui
  `agents/<agentId>/sessions/*.jsonl` atau membuat target JSONL kanonis sebelum
  impor.
- Pemeriksaan doctor integritas status tidak lagi memindai direktori sesi legacy atau
  menawarkan penghapusan JSONL yatim. File transkrip legacy hanya merupakan input migrasi,
  dan langkah migrasi memiliki impor plus penghapusan sumber.
- Impor registri sandbox legacy berada di bawah
  `src/commands/doctor/legacy/sandbox-registry.ts`; pembacaan dan penulisan registri sandbox aktif
  tetap hanya SQLite.
- Perbaikan kesehatan/impor transkrip sesi legacy berada di bawah
  `src/commands/doctor/legacy/session-transcript-health.ts`; modul perintah runtime
  tidak lagi membawa parsing transkrip JSONL atau kode perbaikan branch aktif.

Sorotan konsolidasi/penghapusan yang selesai:

- State Plugin kini menggunakan database bersama `state/openclaw.sqlite`. Importir
  sidecar lama `plugin-state/state.sqlite` yang lokal-branch dihapus karena
  tata letak SQLite itu tidak pernah dikirim. Helper probe/test melaporkan
  `databasePath` bersama, bukan mengekspos path SQLite khusus plugin-state.
- Tabel runtime Task dan Task Flow kini berada di database bersama
  `state/openclaw.sqlite`, bukan `tasks/runs.sqlite` dan
  `tasks/flows/registry.sqlite`; importir sidecar lama dihapus karena alasan
  tata letak yang sama, yaitu belum pernah dikirim.
- `src/config/sessions/store.ts` tidak lagi membutuhkan `storePath` untuk
  metadata inbound, pembaruan rute, atau pembacaan updated-at. Persistensi
  perintah, pembersihan sesi CLI, kedalaman subagent, override auth, dan
  identitas sesi transkrip menggunakan API baris agent/session. Penulisan
  diterapkan sebagai patch baris SQLite dengan retry konflik optimistis.
- Resolusi target sesi kini mengekspos target database per-agent, bukan path
  `sessions.json` legacy. Gateway bersama, metadata ACP, perbaikan rute doctor,
  dan `openclaw sessions` menghitung `agent_databases` plus agent yang
  dikonfigurasi.
- Routing sesi Gateway kini menggunakan `resolveGatewaySessionDatabaseTarget`;
  target yang dikembalikan membawa `databasePath` dan kunci baris SQLite
  kandidat, bukan path file session-store legacy.
- Tipe runtime sesi channel kini mengekspos `{agentId, sessionKey}` untuk
  pembacaan updated-at, metadata inbound, dan pembaruan last-route. Tipe
  kompatibilitas lama `saveSessionStore(storePath, store)` sudah tidak ada.
- Runtime Plugin, extension API, dan permukaan barrel `config/sessions` kini
  mengarahkan kode plugin ke helper baris sesi berbasis SQLite. Ekspor
  kompatibilitas pustaka root (`loadSessionStore`, `saveSessionStore`,
  `resolveStorePath`) tetap ada sebagai shim deprecated untuk konsumen yang
  sudah ada. Helper lama `resolveLegacySessionStorePath` sudah tidak ada;
  konstruksi path `sessions.json` legacy kini lokal untuk migrasi dan fixture
  test.
- `src/config/sessions/session-entries.sqlite.ts` kini menyimpan entri sesi
  kanonis di database per-agent dan memiliki dukungan patch baca/upsert/delete
  tingkat baris. Upsert/patch/delete runtime tidak lagi memindai varian huruf
  atau memangkas kunci alias legacy; doctor memiliki kanonisisasi. Helper impor
  JSON mandiri sudah tidak ada, dan migrasi menggabungkan upsert baris yang lebih
  baru alih-alih mengganti seluruh tabel sesi. Helper baca/list/load publik
  memproyeksikan metadata sesi panas dari baris `sessions` dan `conversations`
  bertipe; `entry_json` adalah bayangan kompatibilitas/debug dan dapat stale atau
  tidak valid tanpa kehilangan identitas sesi bertipe atau konteks pengiriman.
- `src/config/sessions/delivery-info.ts` kini menyelesaikan konteks pengiriman
  dari baris per-agent bertipe `sessions` + `conversations` +
  `session_conversations`. Ia tidak lagi merekonstruksi identitas pengiriman
  runtime dari `session_entries.entry_json`; baris conversation bertipe yang
  hilang adalah masalah migrasi/perbaikan doctor, bukan fallback runtime.
- Keputusan reset stored-session kini memprioritaskan metadata bertipe
  `sessions.session_scope`, `sessions.chat_type`, dan `sessions.channel`.
  Parsing `sessionKey` tetap hanya untuk suffix thread/topic eksplisit pada
  target perintah; klasifikasi reset grup vs langsung tidak lagi berasal dari
  bentuk kunci.
- Klasifikasi tampilan list/status sesi kini menggunakan metadata chat bertipe
  dan jenis sesi Gateway. Ia tidak lagi memperlakukan substring `:group:` atau
  `:channel:` di dalam `session_key` sebagai kebenaran grup/langsung yang tahan
  lama.
- Pemilihan kebijakan silent-reply kini hanya menggunakan tipe conversation
  eksplisit atau metadata surface. Ia tidak lagi menebak kebijakan langsung/grup
  dari substring `session_key`.
- Resolusi model tampilan sesi kini menerima id agent dari target database sesi
  SQLite, bukan memisahkannya dari `session_key`.
- Hidrasi target announce agent-ke-agent kini hanya menggunakan `deliveryContext`
  `sessions.list` bertipe. Ia tidak lagi memulihkan routing channel/account/thread
  dari `origin` legacy, field `last*` yang dicerminkan, atau bentuk `session_key`.
- Penolakan target thread `sessions_send` kini membaca metadata routing SQLite
  bertipe. Ia tidak lagi menolak atau menerima target dengan mem-parsing suffix
  thread dari kunci target.
- Validasi kebijakan tool berlingkup grup kini membaca routing conversation
  SQLite bertipe untuk sesi saat ini atau sesi yang di-spawn. Ia tidak lagi
  mempercayai identitas grup/channel dengan mendekode `sessionKey`; id grup yang
  disediakan caller dibuang ketika tidak ada baris sesi bertipe yang menjaminnya.
- Pencocokan override model channel kini menggunakan metadata conversation grup
  dan parent eksplisit. Ia tidak lagi mendekode id conversation parent dari
  `parentSessionKey`.
- Pewarisan override model tersimpan kini membutuhkan kunci sesi parent eksplisit
  dari konteks sesi bertipe. Ia tidak lagi menurunkan override parent dari suffix
  `:thread:` atau `:topic:` di `sessionKey`.
- Wrapper thread-info sesi lama dan parser thread loaded-plugin sudah tidak ada;
  tidak ada kode runtime yang mengimpor `config/sessions/thread-info`.
- Helper conversation channel tidak lagi mengekspos bridge parsing
  full-session-key. Core masih menormalkan id conversation mentah milik provider
  melalui `resolveSessionConversation(...)`, tetapi tidak merekonstruksi fakta
  rute dari `sessionKey`.
- Pengiriman completion, kebijakan pengiriman, dan pemeliharaan task tidak lagi
  menurunkan tipe chat dari bentuk `session_key`. Parser kunci chat-type lama
  telah dihapus; jalur-jalur ini membutuhkan metadata sesi bertipe, konteks
  pengiriman bertipe, atau kosakata target pengiriman eksplisit.
- List/status sesi, diagnostik, binding akun approval, filtering Heartbeat TUI,
  dan ringkasan penggunaan tidak lagi menambang `SessionEntry.origin` untuk
  routing provider/account/thread/display. Satu-satunya pembacaan runtime
  `origin` yang tersisa adalah konsep non-sesi atau objek pengiriman giliran
  saat ini.
- Lookup conversation native approval-request kini membaca baris routing sesi
  per-agent bertipe. Ia tidak lagi mem-parsing identitas conversation
  channel/grup/thread dari `sessionKey`; metadata bertipe yang hilang adalah
  masalah migrasi/perbaikan.
- Payload event session changed/chat/session Gateway tidak lagi menggemakan
  `SessionEntry.origin` atau bayangan rute `last*`; klien menerima `channel`,
  `chatType`, dan `deliveryContext` bertipe.
- Resolusi pengiriman Heartbeat kini dapat menerima `deliveryContext` SQLite
  bertipe secara langsung, dan runtime heartbeat meneruskan baris pengiriman sesi
  per-agent, bukan bergantung pada bayangan kompatibilitas `session_entries`
  untuk routing saat ini.
- Resolusi target pengiriman isolated-agent Cron juga menghidrasi rute saat ini
  dari baris pengiriman sesi per-agent bertipe sebelum fallback ke payload entri
  kompatibilitas.
- Resolusi origin announce subagent kini meneruskan konteks pengiriman sesi
  requester bertipe melalui `loadRequesterSessionEntry` dan memprioritaskan baris
  itu dibanding bayangan kompatibilitas `last*`/`deliveryContext`.
- Pembaruan metadata sesi inbound kini digabungkan terhadap baris pengiriman
  per-agent bertipe terlebih dahulu; field pengiriman `SessionEntry` lama hanya
  fallback ketika tidak ada baris conversation bertipe.
- Ekstraksi pengiriman restart/update kini membiarkan `threadId` pengiriman
  SQLite bertipe menang atas fragmen topic/thread yang di-parse dari
  `sessionKey`; parsing hanya fallback untuk kunci berbentuk thread legacy.
- Id channel konteks hook agent kini memprioritaskan identitas conversation SQLite
  bertipe, lalu metadata pesan eksplisit. Ia tidak lagi mem-parsing fragmen
  provider/grup/channel dari `sessionKey`.
- Pewarisan rute eksternal `chat.send` Gateway kini membaca metadata routing
  sesi SQLite bertipe, bukan menyimpulkan cakupan channel/langsung/grup dari
  bagian `sessionKey`. Sesi berlingkup channel hanya mewarisi ketika channel
  sesi bertipe dan tipe chat cocok dengan konteks pengiriman tersimpan; sesi
  shared-main mempertahankan aturan CLI/no-client-metadata yang lebih ketat.
- Wake restart-sentinel dan routing continuation kini membaca baris
  pengiriman/routing SQLite bertipe sebelum mengantrekan wake Heartbeat atau
  continuation agent-turn yang dirutekan. Ia tidak lagi merekonstruksi konteks
  pengiriman dari bayangan JSON session-entry.
- Resolusi konteks `tools.effective` Gateway kini membaca baris
  pengiriman/routing SQLite bertipe untuk input provider, akun, target, thread,
  dan reply-mode. Ia tidak lagi memulihkan field routing panas tersebut dari
  bayangan origin `session_entries.entry_json` yang stale.
- Routing konsultasi suara realtime kini menyelesaikan pengiriman parent/call
  dari baris sesi SQLite per-agent bertipe. Ia tidak lagi fallback ke bayangan
  kompatibilitas `SessionEntry.deliveryContext` saat memilih rute pesan agent
  tertanam.
- Relay Heartbeat spawn ACP dan routing parent-stream kini membaca pengiriman
  parent dari baris sesi SQLite bertipe. Keduanya tidak lagi merekonstruksi
  konteks pengiriman parent dari bayangan session-entry kompatibilitas.
- Pelestarian rute pengiriman sesi kini mengikuti metadata chat bertipe dan kolom
  pengiriman yang dipersistenkan. Ia tidak lagi mengekstrak hint channel, marker
  direct/main, atau bentuk thread dari `sessionKey`; rute webchat internal hanya
  mewarisi target eksternal ketika SQLite sudah memiliki identitas pengiriman
  bertipe/terpersistenkan untuk sesi tersebut.
- Ekstraksi pengiriman sesi generik kini hanya membaca baris pengiriman sesi
  SQLite bertipe yang tepat. Ia tidak lagi mem-parsing suffix thread/topic atau
  fallback dari kunci berbentuk thread ke kunci sesi dasar.
- Dispatch balasan, pemulihan restart sentinel, dan routing konsultasi suara
  realtime kini menggunakan baris sesi/conversation SQLite bertipe yang tepat
  untuk routing thread. Keduanya tidak lagi memulihkan id thread atau konteks
  pengiriman sesi dasar dengan mem-parsing kunci sesi berbentuk thread.
- Pembatasan riwayat PI tertanam kini menggunakan proyeksi routing sesi SQLite
  bertipe (`sessions` + `conversations` utama) untuk provider, tipe chat, dan
  identitas peer. Ia tidak lagi mem-parsing bentuk provider, DM, grup, atau
  thread dari `sessionKey`.
- Inferensi pengiriman tool Cron kini hanya menggunakan pengiriman eksplisit atau
  konteks pengiriman bertipe saat ini. Ia tidak lagi mendekode target channel,
  peer, akun, atau thread dari `agentSessionKey`.
- Baris sesi runtime tidak lagi membawa alias rute lama `lastProvider`. Helper
  dan test menggunakan field bertipe `lastChannel` dan `deliveryContext`; migrasi
  doctor adalah satu-satunya tempat yang seharusnya menerjemahkan alias rute lama
  atau bayangan `origin` yang dipersistenkan.
- Event transkrip, baris VFS, dan baris artefak tool kini menulis ke database
  per-agent. Tabel mapping file transkrip global yang belum pernah dikirim sudah
  tidak ada; doctor mencatat path sumber legacy dalam baris migrasi yang tahan
  lama sebagai gantinya.
- Lookup transkrip runtime tidak lagi memindai offset byte JSONL atau mem-probe
  file transkrip legacy. Jalur chat/media/history Gateway membaca baris transkrip
  dari SQLite; JSONL sesi kini hanya input doctor legacy, bukan state runtime atau
  format ekspor.
- Relasi parent dan branch transkrip menggunakan metadata terstruktur
  `parentTranscriptScope: {agentId, sessionId}` di header transkrip SQLite, bukan
  string locator mirip path `agent-db:...transcript_events...`.
- Kontrak manajer transkrip tidak lagi mengekspos konstruktor implisit yang
  dipersistenkan `create(cwd)` atau `continueRecent(cwd)`. Manajer transkrip
  terpersistenkan dibuka dengan cakupan eksplisit `{agentId, sessionId}`; hanya
  manajer in-memory yang tetap bebas cakupan untuk test dan transformasi
  transkrip murni.
- API store transkrip runtime menyelesaikan cakupan SQLite, bukan path filesystem.
  Helper lama `resolve...ForPath` dan opsi tulis `transcriptPath` yang tidak
  digunakan sudah hilang dari caller runtime.
- Resolusi sesi runtime kini menggunakan `{agentId, sessionId}` dan tidak boleh
  menurunkan string `sqlite-transcript://<agent>/<session>` untuk batas eksternal.
  Path JSONL absolut legacy hanya input migrasi doctor.
- Record direct-bridge relay hook native kini berada di baris bersama bertipe
  `native_hook_relay_bridges` yang dikunci oleh id relay. Runtime tidak lagi
  menulis registry JSON `/tmp` atau record generik opaque untuk record bridge
  berumur pendek tersebut.
- `runEmbeddedPiAgent(...)` tidak lagi memiliki parameter transcript-locator.
  Deskriptor worker yang disiapkan juga menghilangkan lokator transkrip. Status
  sesi runtime dan run tindak lanjut yang diantrekan membawa `{agentId, sessionId}` alih-alih
  handle transkrip turunan.
- Compaction tertanam sekarang mengambil cakupan SQLite dari `agentId` dan `sessionId`.
  Hook Compaction, panggilan context-engine, delegasi CLI, dan balasan protokol
  tidak boleh menerima handle turunan `sqlite-transcript://...`. Kode ekspor/debug
  dapat mewujudkan artefak pengguna eksplisit dari baris, tetapi tidak menyediakan
  jalur ekspor JSONL sesi generik atau mengumpankan nama file kembali ke identitas
  runtime.
- `/export-session` membaca baris transkrip dari SQLite dan hanya menulis tampilan
  HTML mandiri yang diminta. Penampil tertanam tidak lagi merekonstruksi atau
  mengunduh JSONL sesi dari baris tersebut.
- Delegasi context-engine tidak lagi mengurai lokator transkrip untuk memulihkan
  identitas agen. Konteks runtime yang disiapkan membawa `agentId` yang telah
  diresolusikan ke adapter Compaction bawaan.
- Penulisan ulang transkrip dan pemotongan hasil alat langsung sekarang membaca dan menyimpan
  status transkrip berdasarkan `{agentId, sessionId}` dan tidak menurunkan lokator
  sementara untuk payload peristiwa pembaruan transkrip.
- Permukaan helper status transkrip tidak lagi memiliki varian berbasis lokator
  `readTranscriptState`, `replaceTranscriptStateEvents`, atau
  `persistTranscriptStateMutation`. Pemanggil runtime harus menggunakan API
  `{agentId, sessionId}`. Impor Doctor membaca file lama berdasarkan jalur file eksplisit
  dan menulis baris SQLite; ia tidak memigrasikan string lokator.
- Kontrak pengelola sesi runtime tidak lagi mengekspos `open(locator)`,
  `forkFrom(locator)`, atau `setTranscriptLocator(...)`. Pengelola sesi persisten
  hanya membuka berdasarkan `{agentId, sessionId}`; helper daftar/fork berada pada
  API sesi dan checkpoint berorientasi baris, bukan pada fasad pengelola transkrip.
- API pembaca transkrip Gateway mengutamakan cakupan. API tersebut menerima
  `{agentId, sessionId}` dan tidak menerima lokator transkrip posisional yang
  dapat secara tidak sengaja menjadi identitas runtime. Penguraian lokator transkrip
  aktif telah dihapus; jalur sumber lama hanya dibaca oleh kode impor Doctor.
- Peristiwa pembaruan transkrip juga mengutamakan cakupan. `emitSessionTranscriptUpdate`
  tidak lagi menerima string lokator polos, dan listener merutekan berdasarkan
  `{agentId, sessionId}` tanpa mengurai handle.
- Siaran pesan sesi Gateway meresolusikan kunci sesi dari cakupan agen/sesi,
  bukan dari lokator transkrip. Resolver/cache kunci sesi dari lokator transkrip
  lama telah dihapus.
- Filter SSE riwayat sesi Gateway memfilter pembaruan langsung berdasarkan cakupan agen/sesi. Ia tidak
  lagi mengkanoniskan kandidat lokator transkrip, realpath, atau identitas transkrip
  berbentuk file untuk memutuskan apakah stream harus menerima pembaruan.
- Hook siklus hidup sesi tidak lagi menurunkan atau mengekspos lokator transkrip pada
  `session_end`. Konsumen hook mendapatkan `sessionId`, `sessionKey`, id sesi berikutnya,
  dan konteks agen; file transkrip bukan bagian dari kontrak siklus hidup.
- Hook reset juga tidak lagi menurunkan atau mengekspos lokator transkrip. Payload
  `before_reset` membawa pesan SQLite yang dipulihkan plus alasan reset,
  sedangkan identitas sesi tetap berada di konteks hook.
- Reset harness agen tidak lagi menerima lokator transkrip. Pengiriman reset
  dicakup oleh `sessionId`/`sessionKey` plus alasan.
- Tipe sesi ekstensi agen tidak lagi mengekspos `transcriptLocator`; ekstensi
  harus menggunakan konteks sesi dan API runtime alih-alih mengambil identitas
  transkrip berbentuk file.
- Hook Compaction Plugin tidak lagi mengekspos lokator transkrip. Konteks hook
  sudah membawa identitas sesi, dan pembacaan transkrip harus melalui API SQLite
  sadar cakupan, bukan handle berbentuk file.
- Hook `before_agent_finalize` tidak lagi mengekspos `transcriptPath`, termasuk
  payload relay hook native. Hook finalisasi hanya menggunakan konteks sesi.
- Respons reset Gateway tidak lagi menyintesis lokator transkrip pada entri yang
  dikembalikan. Reset membuat baris transkrip SQLite, mengembalikan entri sesi
  bersih, dan menyerahkan akses transkrip ke pembaca sadar cakupan.
- Hasil run dan Compaction tertanam tidak lagi memunculkan lokator transkrip untuk
  akuntansi sesi. Compaction otomatis hanya memperbarui `sessionId` aktif,
  penghitung Compaction, dan metadata token.
- Hasil percobaan tertanam tidak lagi mengembalikan `transcriptLocatorUsed`, dan
  hasil context-engine `compact()` tidak lagi mengembalikan lokator transkrip.
  Loop coba ulang runtime hanya menerima `sessionId` penerus.
- Hasil penambahan transkrip delivery-mirror tidak lagi mengembalikan lokator
  transkrip. Pemanggil mendapatkan `messageId` yang ditambahkan; sinyal pembaruan
  transkrip menggunakan cakupan SQLite.
- Helper fork sesi induk hanya mengembalikan `sessionId` hasil fork. Persiapan
  subagen meneruskan cakupan agen/sesi anak ke engine.
- Parameter runner CLI dan penanaman ulang riwayat tidak lagi menerima lokator transkrip.
  Pembacaan riwayat CLI meresolusikan cakupan transkrip SQLite dari `{agentId,
sessionId}` dan konteks kunci sesi.
- Fixture pengujian CLI dan embedded-runner sekarang menanam dan membaca baris transkrip SQLite
  berdasarkan id sesi alih-alih berpura-pura bahwa sesi aktif adalah file `*.jsonl` atau
  meneruskan string `sqlite-transcript://...` melalui parameter runtime.
- Peristiwa guard hasil alat sesi dipancarkan dari cakupan sesi yang diketahui meskipun
  pengelola dalam memori tidak memiliki lokator turunan. Pengujiannya tidak lagi memalsukan
  file transkrip aktif `/tmp/*.jsonl`.
- Helper BTW dan checkpoint Compaction sekarang membaca dan membuat fork baris transkrip berdasarkan
  cakupan SQLite. Metadata checkpoint sekarang hanya menyimpan id sesi dan id leaf/entry;
  lokator turunan tidak lagi ditulis ke payload checkpoint.
- Pencarian kunci transkrip Gateway menggunakan cakupan transkrip SQLite pada batas
  protokol dan tidak lagi melakukan realpath atau stat pada nama file transkrip.
- Rotasi transkrip Compaction otomatis menulis baris transkrip penerus
  langsung melalui penyimpanan transkrip SQLite. Baris sesi hanya menyimpan
  identitas sesi penerus, bukan jalur JSONL tahan lama atau lokator persisten.
- Compaction context-engine tertanam menggunakan helper rotasi transkrip bernama SQLite.
  Pengujian rotasi tidak lagi membuat jalur penerus JSONL atau memodelkan sesi aktif
  sebagai file.
- Retensi gambar keluar terkelola mengunci cache pesan transkripnya dari
  statistik transkrip SQLite alih-alih panggilan stat filesystem.
- Kunci sesi runtime dan lane Doctor `.jsonl.lock` lama mandiri
  telah dihapus.
- Barrel runtime Microsoft Teams dan SDK Plugin publik tidak lagi mengekspor ulang
  helper kunci file lama; jalur status Plugin tahan lama didukung oleh SQLite.
- Pemangkasan umur/jumlah sesi dan pembersihan sesi eksplisit telah dihapus.
  Doctor memiliki impor lama; sesi usang di-reset atau dihapus secara eksplisit.
- Pemeriksaan integritas Doctor tidak lagi menghitung file JSONL lama sebagai transkrip
  aktif yang valid untuk baris sesi SQLite. Kesehatan transkrip aktif hanya SQLite;
  file JSONL lama dilaporkan sebagai input migrasi/pembersihan orphan.
- Doctor tidak lagi memperlakukan `agents/<agent>/sessions/` sebagai status runtime
  wajib. Ia hanya memindai direktori tersebut ketika sudah ada, sebagai input impor lama
  atau pembersihan orphan.
- Gateway `sessions.resolve`, jalur patch/reset/compact sesi, pembuatan subagen,
  abort cepat, metadata ACP, sesi terisolasi Heartbeat, dan patching TUI tidak lagi
  memigrasikan atau memangkas kunci sesi lama sebagai efek samping dari pekerjaan
  runtime normal.
- Resolusi sesi perintah CLI sekarang mengembalikan `agentId` pemilik alih-alih
  `storePath`, dan tidak lagi menyalin baris sesi utama lama selama resolusi normal
  `--to` atau `--session-id`. Kanonisasi baris utama lama hanya milik Doctor.
- Resolusi kedalaman subagen runtime tidak lagi membaca `sessions.json` atau penyimpanan
  sesi JSON5. Ia membaca `session_entries` SQLite berdasarkan id agen, dan metadata
  kedalaman/sesi lama hanya dapat masuk melalui jalur impor Doctor.
- Override sesi profil auth dipersistensikan melalui upsert baris langsung
  `{agentId, sessionKey}` alih-alih memuat secara malas runtime penyimpanan sesi berbentuk file.
- Gating verbose balasan otomatis dan helper pembaruan sesi sekarang membaca/upsert baris
  sesi SQLite berdasarkan identitas sesi dan tidak lagi memerlukan jalur penyimpanan lama
  sebelum menyentuh status baris yang dipersistensikan.
- Helper metadata sesi command-run sekarang menggunakan nama dan jalur modul berorientasi entri;
  permukaan helper perintah `session-store` lama telah dihapus.
- Penanaman header bootstrap dan pengerasan batas Compaction manual sekarang memutasi
  baris transkrip SQLite secara langsung. Pemanggil runtime meneruskan identitas sesi,
  bukan jalur `.jsonl` yang dapat ditulis.
- Replay rotasi sesi senyap menyalin giliran pengguna/asisten terbaru berdasarkan
  `{agentId, sessionId}` dari baris transkrip SQLite. Ia tidak lagi menerima
  lokator transkrip sumber atau target.
- Baris sesi runtime baru tidak lagi menyimpan lokator transkrip. Pemanggil menggunakan
  `{agentId, sessionId}` secara langsung; perintah ekspor/debug dapat memilih nama file
  output saat mewujudkan baris.
- Memulai sesi transkrip persisten baru sekarang selalu membuka baris SQLite berdasarkan
  cakupan. Pengelola sesi tidak lagi menggunakan ulang jalur atau lokator transkrip
  era file sebelumnya sebagai identitas untuk sesi baru.
- Sesi transkrip persisten menggunakan API eksplisit
  `openTranscriptSessionManagerForSession({agentId, sessionId})`. Fasad statis lama
  `SessionManager.create/openForSession/list/forkFromSession` telah dihapus agar pengujian
  dan kode runtime tidak dapat secara tidak sengaja membuat ulang penemuan sesi era file.
- Runtime Plugin tidak lagi mengekspos `api.runtime.agent.session.resolveTranscriptLocatorPath`;
  kode Plugin menggunakan helper baris SQLite dan nilai cakupan.
- Permukaan SDK publik `session-store-runtime` sekarang hanya mengekspor helper baris sesi
  dan baris transkrip. Helper skema/jalur/transaksi SQLite terfokus
  berada di `sqlite-runtime`; helper open/close/reset mentah tetap lokal saja untuk
  pengujian pihak pertama.
- Pengklasifikasi nama file trajectory/checkpoint `.jsonl` lama sekarang berada di modul
  file sesi lama Doctor. Validasi sesi core tidak lagi mengimpor helper artefak file
  untuk memutuskan id sesi SQLite normal.
- Run subagen pemblokiran Active-memory menggunakan baris transkrip SQLite alih-alih
  membuat file `session.jsonl` sementara atau persisten di bawah status Plugin. Opsi
  `transcriptDir` lama dihapus.
- Pembuatan slug sekali pakai dan run perencana Crestodian menggunakan baris transkrip SQLite
  alih-alih membuat file `session.jsonl` sementara.
- Run helper `llm-task` dan ekstraksi komitmen tersembunyi juga menggunakan baris transkrip SQLite,
  sehingga sesi helper khusus model ini tidak lagi membuat file transkrip JSON/JSONL sementara.
- `TranscriptSessionManager` sekarang hanya cakupan transkrip SQLite yang telah dibuka.
  Kode runtime membukanya dengan `openTranscriptSessionManagerForSession({agentId,
sessionId})`; alur create, branch, continue, list, dan fork berada di helper baris SQLite
  pemiliknya, bukan fasad pengelola statis.
  Kode Doctor/import/debug menangani file sumber lama eksplisit di luar pengelola sesi
  runtime.
- Metode fasad usang `SessionManager.newSession()` dan
  `SessionManager.createBranchedSession()` telah dihapus. Sesi baru dan turunan transkrip
  dibuat oleh workflow SQLite pemiliknya alih-alih memutasi pengelola yang sudah terbuka
  menjadi sesi persisten yang berbeda.
- Keputusan fork transkrip induk dan pembuatan fork tidak lagi menerima
  `storePath` atau `sessionsDir`; keduanya menggunakan cakupan transkrip SQLite
  `{agentId, sessionId}` alih-alih metadata jalur filesystem yang dipertahankan.
- Memory-host tidak lagi mengekspor helper klasifikasi transkrip direktori sesi no-op;
  pemfilteran transkrip sekarang diturunkan dari metadata baris SQLite selama konstruksi entri.
- Pengujian ekspor sesi Memory-host dan QMD menggunakan cakupan transkrip SQLite. Jalur lama
  `agents/<agentId>/sessions/*.jsonl` tetap tercakup hanya ketika pengujian
  secara sengaja membuktikan kompatibilitas Doctor/impor/ekspor.
- Inspeksi sesi mentah QA-lab sekarang menggunakan `sessions.list` melalui Gateway
  alih-alih membaca `agents/qa/sessions/sessions.json`; umpan balik MSteams
  ditambahkan langsung ke transkrip SQLite tanpa membuat jalur JSONL fiktif.
- Giliran kanal masuk bersama sekarang membawa `{agentId, sessionKey}` alih-alih
  `storePath` lama. Jalur perekaman LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch, dan QQBot sekarang membaca metadata updated-at dan mencatat
  baris sesi masuk melalui identitas SQLite.
- Persistensi lokator transkrip dihapus dari baris sesi aktif.
  `resolveSessionTranscriptTarget` mengembalikan `agentId`, `sessionId`, dan metadata
  topik opsional; doctor adalah satu-satunya kode yang mengimpor nama file transkrip lama.
- Header transkrip waktu jalan dimulai pada versi SQLite `1`. Peningkatan bentuk
  JSONL V1/V2/V3 lama hanya ada dalam impor doctor dan menormalkan header yang
  diimpor ke versi transkrip SQLite saat ini sebelum baris disimpan.
- Guard database-first sekarang melarang `SessionManager.listAll` dan
  `SessionManager.forkFromSession`; daftar sesi dan alur kerja fork/pulihkan
  harus tetap berada pada API SQLite berbasis baris/bercakupan.
- Guard juga melarang nama pembantu parsing JSONL transkrip lama/perbaikan cabang aktif
  di luar kode doctor/impor, sehingga waktu jalan tidak dapat menumbuhkan jalur migrasi
  transkrip lama kedua.
- Eksekusi PI tertanam menolak handle transkrip masuk. Eksekusi tersebut menggunakan identitas
  SQLite `{agentId, sessionId}` sebelum peluncuran worker dan sekali lagi sebelum
  percobaan menyentuh status transkrip. Input `/tmp/*.jsonl` yang usang tidak dapat memilih
  target tulis waktu jalan.
- Catatan cache trace, payload Anthropic, raw stream, dan lini masa diagnostik
  sekarang ditulis ke baris SQLite `diagnostic_events` bertipe. Bundel stabilitas Gateway
  sekarang ditulis ke baris SQLite `diagnostic_stability_bundles` bertipe. Jalur override
  JSONL lama `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE`, dan
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` dihapus, dan penangkapan stabilitas normal
  tidak lagi menulis file `logs/stability/*.json`.
- Persistensi Cron sekarang merekonsiliasi baris SQLite `cron_jobs` alih-alih
  menghapus/menyisipkan ulang seluruh tabel job pada setiap penyimpanan. Penulisan balik target
  Plugin memperbarui baris cron yang cocok secara langsung dan mempertahankan status cron waktu jalan
  dalam transaksi database status yang sama.
- Pemanggil waktu jalan Cron sekarang menggunakan kunci penyimpanan cron SQLite yang stabil. Jalur
  `cron.store` lama hanya menjadi input impor doctor; jalur penulisan balik production Gateway,
  pemeliharaan tugas, status, run-log, dan target Telegram menggunakan
  `resolveCronStoreKey` dan tidak lagi menormalkan jalur kunci. Status Cron sekarang
  melaporkan `storeKey` alih-alih bidang `storePath` lama yang berbentuk file.
- Pemuatan waktu jalan dan penjadwalan Cron tidak lagi menormalkan bentuk job tersimpan lama
  seperti `jobId`, `schedule.cron`, `atMs` numerik, boolean string, atau
  `sessionTarget` yang hilang. Impor lama doctor memiliki perbaikan tersebut sebelum baris
  disisipkan ke SQLite.
- Spawn ACP tidak lagi menyelesaikan atau mempertahankan jalur file JSONL transkrip. Penyiapan spawn
  dan thread-bind mempertahankan baris sesi SQLite secara langsung dan menyimpan id sesi sebagai
  identitas transkrip yang dipertahankan.
- API metadata sesi ACP sekarang membaca/mendaftar/upsert baris SQLite berdasarkan `agentId` dan
  tidak lagi mengekspos `storePath` sebagai bagian dari kontrak entri sesi ACP.
- Akuntansi penggunaan sesi dan agregasi penggunaan Gateway sekarang menyelesaikan transkrip
  hanya berdasarkan `{agentId, sessionId}`. Cache biaya/penggunaan dan ringkasan sesi yang ditemukan
  tidak lagi menyintesis atau mengembalikan string lokator transkrip.
- Penambahan chat Gateway, persistensi abort-partial, `/sessions.send`, dan
  penulisan transkrip media webchat ditambahkan langsung melalui cakupan transkrip SQLite.
  Pembantu injeksi transkrip Gateway tidak lagi menerima parameter
  `transcriptLocator`.
- Penemuan transkrip SQLite sekarang hanya mencantumkan cakupan dan statistik transkrip:
  `{agentId, sessionId, updatedAt, eventCount}`. Pembantu kompatibilitas mati
  `listSqliteSessionTranscriptLocators` dan bidang `locator` per baris telah hilang.
- Waktu jalan perbaikan transkrip sekarang hanya mengekspos
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. Pembantu perbaikan lama
  berbasis lokator dihapus; kode doctor/debug membaca jalur file sumber eksplisit dan
  tidak pernah memigrasikan string lokator.
- Waktu jalan ledger replay ACP sekarang menyimpan baris replay per sesi di database
  status SQLite bersama alih-alih `acp/event-ledger.json`; doctor mengimpor dan
  menghapus file lama.
- Pembantu pembaca transkrip Gateway sekarang berada di
  `src/gateway/session-transcript-readers.ts` alih-alih nama modul lama
  `session-utils.fs`. Pemeriksaan riwayat retry fallback dinamai berdasarkan
  konten transkrip SQLite alih-alih permukaan pembantu file lama.
- Pembantu injected-chat dan Compaction Gateway sekarang meneruskan cakupan transkrip SQLite
  melalui API pembantu internal alih-alih menamai nilai sebagai jalur transkrip atau
  file sumber.
- Deteksi kelanjutan bootstrap sekarang memeriksa baris transkrip SQLite melalui
  `hasCompletedBootstrapTranscriptTurn`; deteksi ini tidak lagi mengekspos nama pembantu
  berbentuk file.
- Pengujian embedded-runner sekarang menggunakan identitas transkrip SQLite, dan membuka
  manajer transkrip baru selalu memerlukan `sessionId` eksplisit.
- Pembantu pengindeksan memori sekarang menggunakan terminologi transkrip SQLite dari awal hingga akhir:
  host mengekspor `listSessionTranscriptScopesForAgent` dan
  `sessionTranscriptKeyForScope`, antrean sinkronisasi tertarget `sessionTranscripts`,
  hasil pencarian sesi publik mengekspos jalur buram `transcript:<agent>:<session>`,
  dan kunci sumber DB internal adalah `session:<session>` di bawah
  `source_kind='sessions'` alih-alih jalur file palsu.
- Pembantu persistent-dedupe SDK Plugin generik tidak lagi mengekspos opsi berbentuk file.
  Pemanggil menyediakan kunci cakupan SQLite dan baris dedupe tahan lama berada di
  status Plugin bersama.
- Token SSO Microsoft Teams dipindahkan dari file JSON terkunci ke status Plugin
  SQLite. Doctor mengimpor `msteams-sso-tokens.json`, membangun ulang kunci token SSO
  kanonis dari payload, dan menghapus file sumber. Token OAuth terdelegasi tetap
  pada batas file kredensial privat yang sudah ada.
- Status cache sinkronisasi Matrix dipindahkan dari `bot-storage.json` ke status Plugin
  SQLite. Doctor mengimpor payload sinkronisasi lama mentah atau terbungkus dan menghapus
  file sumber. Klien Matrix aktif dan QA Matrix meneruskan direktori root penyimpanan sinkronisasi
  SQLite, bukan jalur palsu `sync-store.json` atau `bot-storage.json`.
- Status migrasi crypto lama Matrix dipindahkan dari
  `legacy-crypto-migration.json` ke status Plugin SQLite. Doctor mengimpor
  file status lama; snapshot IndexedDB Matrix SDK dipindahkan dari
  `crypto-idb-snapshot.json` ke blob Plugin SQLite. Kunci pemulihan dan
  kredensial Matrix adalah baris status Plugin SQLite; file JSON lamanya hanya
  menjadi input migrasi doctor.
- Log aktivitas Memory Wiki sekarang menggunakan status Plugin SQLite alih-alih
  `.openclaw-wiki/log.jsonl`. Penyedia migrasi Memory Wiki mengimpor log JSONL lama;
  markdown wiki dan konten vault pengguna tetap berbasis file sebagai
  konten ruang kerja.
- Memory Wiki tidak lagi membuat `.openclaw-wiki/state.json` atau direktori
  `.openclaw-wiki/locks` yang tidak digunakan. Penyedia migrasi menghapus file metadata
  Plugin pensiun tersebut jika vault lama masih memilikinya.
- Entri audit Crestodian sekarang menggunakan status Plugin SQLite inti alih-alih
  `audit/crestodian.jsonl`. Doctor mengimpor log audit JSONL lama dan
  menghapusnya setelah impor berhasil.
- Entri audit tulis/amati config sekarang menggunakan status Plugin SQLite inti
  alih-alih `logs/config-audit.jsonl`. Doctor mengimpor log audit JSONL lama dan
  menghapusnya setelah impor berhasil.
- Pendamping macOS tidak lagi menulis sidecar lokal aplikasi `logs/config-audit.jsonl` atau
  `logs/config-health.json` saat mengedit `openclaw.json`. File config
  tetap berbasis file, snapshot pemulihan tetap berada di sebelah file config,
  dan status audit/kesehatan config yang tahan lama menjadi milik penyimpanan SQLite Gateway.
- Persetujuan tertunda rescue Crestodian sekarang menggunakan status Plugin SQLite inti
  alih-alih `crestodian/rescue-pending/*.json`. Doctor mengimpor file persetujuan tertunda
  lama dan menghapusnya setelah impor berhasil.
- Status arm sementara Phone Control sekarang menggunakan status Plugin SQLite alih-alih
  `plugins/phone-control/armed.json`. Doctor mengimpor file status arm lama ke
  namespace `phone-control/arm-state` dan menghapus file tersebut.
- Doctor tidak lagi memperbaiki transkrip JSONL di tempat atau membuat file JSONL
  cadangan. Doctor mengimpor cabang aktif ke SQLite dan menghapus sumber lama.
- Pencarian transkrip hook session-memory menggunakan pembacaan SQLite khusus cakupan
  `{agentId, sessionId}`. Pembantunya tidak lagi menerima atau menurunkan lokator transkrip,
  pembacaan file lama, atau opsi penulisan ulang file.
- Binding percakapan server aplikasi Codex sekarang mengunci status Plugin SQLite berdasarkan
  kunci sesi OpenClaw atau cakupan eksplisit `{agentId, sessionId}`. Binding tersebut tidak boleh
  mempertahankan binding fallback jalur transkrip.
- Pembacaan mirrored-history server aplikasi Codex menggunakan cakupan transkrip SQLite saja;
  pembacaan tersebut tidak boleh memulihkan identitas dari jalur file transkrip.
- Jalur reset pengurutan peran dan Compaction tidak lagi menghapus tautan file transkrip
  lama; reset hanya merotasi baris sesi SQLite dan identitas transkrip.
- Respons reset dan checkpoint Gateway mengembalikan baris sesi bersih plus id sesi.
  Respons tersebut tidak lagi menyintesis lokator transkrip SQLite untuk klien.
- Dreaming memory-core tidak lagi memangkas baris sesi dengan memeriksa file JSONL yang hilang.
  Pembersihan subagent berjalan melalui API waktu jalan sesi alih-alih
  pemeriksaan keberadaan sistem file. Pengujian ingest transkripnya menyemai baris SQLite
  secara langsung alih-alih membuat fixture `agents/<id>/sessions` atau placeholder lokator.
- Pengindeksan transkrip memori dapat mengekspos `transcript:<agentId>:<sessionId>` sebagai
  jalur hasil pencarian virtual untuk pembantu kutipan/baca. Sumber indeks tahan lama bersifat
  relasional (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), sehingga nilai tersebut bukan lokator transkrip waktu jalan,
  bukan jalur sistem file, dan tidak boleh pernah diteruskan kembali ke API waktu jalan sesi.
- Status memori doctor Gateway membaca short-term recall dan jumlah phase-signal
  dari baris status Plugin SQLite alih-alih `memory/.dreams/*.json`; output CLI dan
  doctor sekarang memberi label penyimpanan tersebut sebagai penyimpanan SQLite, bukan jalur.
- Waktu jalan memory-core, status CLI, metode doctor Gateway, dan facade SDK Plugin
  tidak lagi mengaudit atau mengarsipkan file `.dreams/session-corpus` lama.
  File tersebut hanya menjadi input migrasi; doctor mengimpornya ke SQLite dan
  menghapus sumber setelah verifikasi. Baris bukti ingest sesi aktif
  sekarang menggunakan jalur SQLite virtual `memory/session-ingestion/<day>.txt`; waktu jalan
  tidak pernah menulis atau menurunkan status dari `.dreams/session-corpus`.
- Artefak publik memory-core mengekspos peristiwa host SQLite sebagai artefak JSON virtual
  `memory/events/memory-host-events.json`; artefak tersebut tidak lagi menggunakan ulang
  jalur sumber lama `.dreams/events.jsonl`.
- Registry kontainer/browser sandbox sekarang menggunakan tabel SQLite bersama
  `sandbox_registry_entries` dengan kolom sesi, image, timestamp,
  backend/config, dan port browser bertipe. Doctor mengimpor file registry JSON monolitik dan
  tersharding lama serta menghapus sumber yang berhasil. Pembacaan waktu jalan menggunakan
  kolom baris bertipe sebagai sumber kebenaran; `entry_json` hanya salinan replay/debug.
- Commitments sekarang menggunakan tabel bersama `commitments` bertipe alih-alih blob JSON
  seluruh penyimpanan. Penyimpanan snapshot melakukan upsert berdasarkan id commitment dan hanya
  menghapus baris yang hilang alih-alih mengosongkan dan menyisipkan ulang tabel. Waktu jalan memuat
  commitments dari kolom cakupan, jendela pengiriman, status, percobaan, dan teks
  bertipe; `record_json` hanya salinan replay/debug. Doctor mengimpor
  `commitments.json` lama dan menghapusnya setelah impor berhasil.
- Definisi job Cron, status jadwal, dan riwayat run tidak lagi memiliki penulis atau pembaca
  JSON waktu jalan. Waktu jalan menggunakan baris `cron_jobs` dengan jadwal bertipe,
  payload, pengiriman, failure-alert, session, status, dan kolom runtime-state plus metadata
  `cron_run_logs` bertipe untuk status, ringkasan diagnostik, status/error pengiriman,
  session/run, model, dan total token. `job_json` hanya salinan replay/debug; `state_json` menyimpan diagnostik runtime bersarang yang belum memiliki bidang kueri cepat, sementara runtime
  menghidrasi ulang bidang state cepat dari kolom bertipe. Doctor mengimpor
  file `jobs.json`, `jobs-state.json`, dan `runs/*.jsonl` legacy lalu menghapus
  sumber yang diimpor. Writeback target Plugin memperbarui baris `cron_jobs`
  yang cocok alih-alih memuat dan mengganti seluruh penyimpanan cron.
- Startup Gateway mengabaikan penanda `notify: true` legacy dalam proyeksi
  runtime. Doctor menerjemahkannya menjadi pengiriman SQLite eksplisit ketika
  `cron.webhook` valid, menghapus penanda inert ketika tidak disetel, dan mempertahankannya
  dengan peringatan ketika webhook yang dikonfigurasi tidak valid.
- Antrean pengiriman outbound dan session sekarang menyimpan status antrean, jenis entri,
  kunci session, channel, target, id akun, jumlah percobaan ulang, upaya/error terakhir,
  state pemulihan, dan penanda platform-send sebagai kolom bertipe dalam tabel bersama
  `delivery_queue_entries`. Pemulihan runtime membaca bidang cepat tersebut dari
  kolom bertipe, dan mutasi percobaan ulang/pemulihan memperbarui kolom tersebut secara langsung
  tanpa menulis ulang JSON replay. Payload JSON lengkap tetap hanya sebagai
  blob replay/debug untuk isi pesan dan data replay dingin lainnya.
- Catatan gambar keluar terkelola sekarang menggunakan baris bersama bertipe
  `managed_outgoing_image_records` dengan byte media tetap disimpan di
  `media_blobs`. Catatan JSON tetap hanya sebagai salinan replay/debug.
- Preferensi pemilih model Discord, hash command-deploy, dan binding thread
  sekarang menggunakan state Plugin SQLite bersama. Rencana impor JSON legacy mereka berada di
  permukaan migrasi setup/doctor Plugin Discord, bukan di kode migrasi inti.
- Detektor impor legacy Plugin menggunakan modul bernama doctor seperti
  `doctor-legacy-state.ts` atau `doctor-state-imports.ts`; modul runtime channel normal
  tidak boleh mengimpor detektor JSON legacy.
- Kursor catchup BlueBubbles dan penanda dedupe inbound sekarang menggunakan state Plugin SQLite
  bersama. Rencana impor JSON legacy mereka berada di permukaan migrasi setup/doctor Plugin
  BlueBubbles, bukan di kode migrasi inti.
- Offset pembaruan Telegram, baris cache stiker, baris cache pesan terkirim,
  baris cache nama topik, dan binding thread sekarang menggunakan state Plugin SQLite
  bersama. Rencana impor JSON legacy mereka berada di permukaan migrasi
  setup/doctor Plugin Telegram, bukan di kode migrasi inti.
- Kursor catchup iMessage, pemetaan short-id balasan, dan baris dedupe sent-echo
  sekarang menggunakan state Plugin SQLite bersama. File lama `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl`, dan `imessage/sent-echoes.jsonl` hanya menjadi
  input doctor.
- Baris dedupe pesan Feishu sekarang menggunakan state Plugin SQLite bersama alih-alih
  file `feishu/dedup/*.json`. Rencana impor JSON legacy-nya berada di permukaan migrasi
  setup/doctor Plugin Feishu, bukan di kode migrasi inti.
- Percakapan, polling, buffer unggahan tertunda, dan pembelajaran feedback
  Microsoft Teams sekarang menggunakan tabel state/blob Plugin SQLite bersama. Jalur unggahan tertunda
  menggunakan `plugin_blob_entries` sehingga buffer media disimpan sebagai BLOB SQLite
  alih-alih JSON base64. Nama helper runtime sekarang menggunakan penamaan SQLite/state
  bukan penamaan penyimpanan file `*-fs`, dan shim `storePath` lama telah hilang
  dari penyimpanan ini. Rencana impor JSON legacy-nya berada di permukaan migrasi
  setup/doctor Plugin Microsoft Teams.
- Media outbound yang di-host Zalo sekarang menggunakan `plugin_blob_entries` SQLite bersama
  alih-alih sidecar sementara JSON/bin `openclaw-zalo-outbound-media`.
- HTML dan metadata penampil diff sekarang menggunakan `plugin_blob_entries` SQLite bersama
  alih-alih file sementara `meta.json`/`viewer.html`. Output PNG/PDF yang dirender tetap
  menjadi materialisasi sementara karena pengiriman channel masih membutuhkan path file.
- Dokumen terkelola Canvas sekarang menggunakan `plugin_blob_entries` SQLite bersama alih-alih
  direktori default `state/canvas/documents`. Host Canvas menyajikan blob tersebut secara langsung;
  file lokal dibuat hanya untuk konten operator `host.root` eksplisit atau materialisasi sementara
  ketika pembaca media hilir membutuhkan path.
- Keputusan audit File Transfer sekarang menggunakan `plugin_state_entries` SQLite bersama
  alih-alih log runtime tak terbatas `audit/file-transfer.jsonl`. Doctor
  mengimpor file audit JSONL legacy ke state Plugin dan menghapus sumber
  setelah impor bersih.
- Lease proses ACPX dan identitas instance gateway sekarang menggunakan state Plugin SQLite bersama.
  Doctor mengimpor file legacy `gateway-instance-id` ke state Plugin
  dan menghapus sumber.
- Skrip wrapper yang dihasilkan ACPX dan home Codex terisolasi adalah materialisasi sementara
  di bawah root sementara OpenClaw, bukan state OpenClaw tahan lama. Catatan runtime ACPX
  yang tahan lama adalah baris lease SQLite dan gateway-instance; permukaan konfigurasi ACPX
  `stateDir` lama dihapus karena tidak ada state runtime yang ditulis di sana lagi.
- Lampiran media Gateway sekarang menggunakan tabel SQLite bersama `media_blobs` sebagai
  penyimpanan byte kanonis. Path lokal yang dikembalikan ke permukaan kompatibilitas channel dan sandbox
  adalah materialisasi sementara dari baris database, bukan penyimpanan media tahan lama.
  Allowlist media runtime tidak lagi menyertakan root legacy
  `$OPENCLAW_STATE_DIR/media` atau `media` direktori konfigurasi; direktori tersebut hanya
  menjadi sumber impor doctor.
- Completion shell tidak lagi menulis file cache `$OPENCLAW_STATE_DIR/completions/*`.
  Jalur smoke install, doctor, update, dan release menggunakan output completion
  yang dihasilkan atau sourcing profil alih-alih file cache completion tahan lama.
- Staging unggahan skill Gateway sekarang menggunakan baris `skill_uploads` bersama. Metadata
  unggahan, kunci idempotensi, dan byte arsip berada di SQLite; installer
  hanya menerima path arsip termaterialisasi sementara selama install sedang
  berjalan.
- Lampiran inline subagent tidak lagi dimaterialisasikan di bawah
  `.openclaw/attachments/*` workspace. Jalur spawn menyiapkan entri seed VFS SQLite,
  run inline menanam entri tersebut ke namespace scratch runtime per-agent,
  dan tool berbasis disk melapisi scratch SQLite tersebut untuk path lampiran. Kolom registri attachment-dir
  subagent-run lama dan hook cleanup telah hilang.
- Hidrasi gambar CLI tidak lagi mempertahankan file cache stabil `openclaw-cli-images`.
  Backend CLI eksternal masih menerima path file, tetapi path tersebut adalah materialisasi sementara
  per-run dengan cleanup.
- Diagnostik cache-trace, diagnostik payload Anthropic, diagnostik stream model mentah,
  event timeline diagnostik, dan bundel stabilitas Gateway sekarang
  menulis baris SQLite alih-alih file `logs/*.jsonl` atau
  `logs/stability/*.json`.
  Flag dan env var override path runtime telah dihapus; perintah export/debug
  dapat mematerialisasikan file secara eksplisit dari baris database.
- Companion macOS tidak lagi memiliki writer `diagnostics.jsonl` bergulir. Log aplikasi
  masuk ke unified logging, dan diagnostik Gateway tahan lama tetap berbasis SQLite.
- Daftar catatan port-guardian macOS sekarang menggunakan baris bersama bertipe SQLite
  `macos_port_guardian_records` alih-alih file JSON Application Support
  atau blob singleton buram.
- Lock singleton Gateway sekarang menggunakan baris bersama bertipe SQLite `state_leases` di bawah
  scope `gateway_locks` alih-alih file lock temp-dir. Dokumen troubleshooting Fly dan OAuth
  sekarang menunjuk ke lease SQLite/lock refresh auth alih-alih cleanup file-lock usang.
- State sentinel restart Gateway sekarang menggunakan baris bersama bertipe SQLite
  `gateway_restart_sentinel` alih-alih `restart-sentinel.json`; runtime
  membaca jenis sentinel, status, routing, pesan, kelanjutan, dan stats dari
  kolom bertipe. `payload_json` hanya salinan replay/debug. Kode runtime menghapus
  baris SQLite secara langsung dan tidak lagi membawa plumbing cleanup file.
- Intent restart Gateway dan state handoff supervisor sekarang menggunakan baris bersama bertipe
  SQLite `gateway_restart_intent` dan `gateway_restart_handoff` alih-alih
  sidecar `gateway-restart-intent.json` dan
  `gateway-supervisor-restart-handoff.json`.
- Koordinasi singleton Gateway sekarang menggunakan baris bertipe `state_leases` di bawah
  `gateway_locks` alih-alih menulis file `gateway.<hash>.lock`. Baris lease
  memiliki pemilik lock, kedaluwarsa, Heartbeat, dan payload debug; SQLite memiliki
  batas acquire/release atomik. Opsi direktori file-lock yang dipensiunkan telah
  hilang; test menggunakan identitas baris SQLite secara langsung.
- Helper laporan penggunaan cron lama yang tidak direferensikan yang memindai file `cron/runs/*.jsonl`
  telah dihapus. Laporan riwayat run Cron harus membaca baris SQLite bertipe
  `cron_run_logs`.
- Pemulihan restart main-session sekarang menemukan kandidat agent melalui
  registri SQLite `agent_databases` alih-alih memindai direktori `agents/*/sessions`.
- Pemulihan korupsi session Gemini sekarang hanya menghapus baris session SQLite;
  tidak lagi membutuhkan gate `storePath` legacy atau mencoba menghapus tautan path
  JSONL transkrip turunan.
- Penanganan override path sekarang memperlakukan nilai environment literal `undefined`/`null`
  sebagai tidak disetel, mencegah database repo-root `undefined/state/*.sqlite`
  yang tidak disengaja selama test atau handoff shell.
- Fingerprint kesehatan config sekarang menggunakan baris bersama bertipe SQLite `config_health_entries`
  alih-alih `logs/config-health.json`, sehingga file config normal menjadi
  satu-satunya dokumen konfigurasi non-kredensial. Companion macOS hanya menyimpan
  state kesehatan process-local dan tidak membuat ulang sidecar JSON lama.
- Runtime profil auth tidak lagi mengimpor atau menulis file JSON kredensial. Penyimpanan
  kredensial kanonis adalah SQLite; `auth-profiles.json`, `auth.json` per-agent,
  dan `credentials/oauth.json` bersama adalah input migrasi doctor
  yang dihapus setelah impor.
- Test save/state profil auth sekarang menegaskan tabel auth SQLite bertipe secara langsung
  dan hanya menggunakan nama file auth-profile legacy untuk input migrasi doctor.
- `openclaw secrets apply` hanya membersihkan file config, file env, dan penyimpanan
  profil auth SQLite. Ia tidak lagi membawa logika kompatibilitas yang mengedit
  `auth.json` per-agent yang dipensiunkan; doctor memiliki tanggung jawab mengimpor dan menghapus file tersebut.
- Rencana migrasi secret Hermes dan apply mengimpor profil API-key langsung
  ke penyimpanan profil auth SQLite. Ia tidak lagi menulis atau memverifikasi
  `auth-profiles.json` sebagai target perantara.
- Dokumen auth yang dihadapi pengguna sekarang menjelaskan
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` alih-alih
  meminta pengguna memeriksa atau menyalin `auth-profiles.json`; nama JSON OAuth/auth legacy
  tetap didokumentasikan hanya sebagai input impor doctor.
- Helper path state inti tidak lagi mengekspos file `credentials/oauth.json`
  yang dipensiunkan. Nama file legacy bersifat lokal untuk jalur impor auth doctor.
- Dokumen install, security, onboarding, model-auth, dan SecretRef sekarang menjelaskan
  baris profil auth SQLite dan backup/migrasi whole-state alih-alih
  file JSON auth-profile per-agent.
- Discovery model PI sekarang meneruskan kredensial kanonis ke penyimpanan auth
  `pi-coding-agent` dalam memori. Ia tidak lagi membuat, membersihkan, atau menulis
  `auth.json` per-agent selama discovery.
- Pengaturan trigger Voice Wake dan routing sekarang menggunakan tabel bersama bertipe SQLite
  alih-alih `settings/voicewake.json`, `settings/voicewake-routing.json`, atau
  baris generik buram; doctor mengimpor file JSON legacy dan menghapusnya setelah
  migrasi berhasil.
- State update-check sekarang menggunakan baris bersama bertipe `update_check_state` alih-alih
  `update-check.json` atau blob generik buram; doctor mengimpor
  file JSON legacy dan menghapusnya setelah migrasi berhasil.
- State kesehatan config sekarang menggunakan baris bersama bertipe `config_health_entries` alih-alih
  `logs/config-health.json` atau blob generik buram; doctor
  mengimpor file JSON legacy dan menghapusnya setelah migrasi berhasil.
- Persetujuan binding percakapan Plugin sekarang menggunakan baris bertipe
  `plugin_binding_approvals` alih-alih state SQLite bersama buram atau
  `plugin-binding-approvals.json`; file lama adalah input migrasi doctor.
- Binding percakapan-saat-ini generik sekarang menyimpan baris bertipe
  `current_conversation_bindings`, bukan menulis ulang
  `bindings/current-conversations.json`; doctor mengimpor file JSON lama dan
  menghapusnya setelah migrasi berhasil.
- Ledger sinkronisasi sumber-terimpor Memory Wiki sekarang menyimpan satu baris
  status Plugin SQLite per kunci vault/sumber, bukan menulis ulang
  `.openclaw-wiki/source-sync.json`; penyedia migrasi mengimpor dan menghapus
  ledger JSON lama.
- Catatan import-run Memory Wiki ChatGPT sekarang menyimpan satu baris status
  Plugin SQLite per vault/id run, bukan menulis
  `.openclaw-wiki/import-runs/*.json`. Snapshot rollback tetap menjadi file
  vault eksplisit sampai pengarsipan snapshot import-run dipindahkan ke
  penyimpanan blob.
- Digest terkompilasi Memory Wiki sekarang menyimpan baris blob Plugin SQLite,
  bukan menulis `.openclaw-wiki/cache/agent-digest.json` dan
  `.openclaw-wiki/cache/claims.jsonl`. Penyedia migrasi mengimpor file cache lama
  dan menghapus direktori cache saat direktori itu menjadi kosong.
- Pelacakan pemasangan skill ClawHub sekarang menyimpan satu baris status Plugin
  SQLite per workspace/skill, bukan menulis atau membaca sidecar
  `.clawhub/lock.json` dan `.clawhub/origin.json` saat runtime. Kode runtime
  menggunakan objek status pemasangan-terlacak, bukan abstraksi lockfile/origin
  berbentuk file. Doctor mengimpor sidecar lama dari workspace agen yang
  dikonfigurasi dan menghapusnya setelah impor bersih.
- Indeks Plugin terpasang sekarang membaca dan menulis baris singleton SQLite
  bersama bertipe `installed_plugin_index`, bukan `plugins/installs.json`; file
  JSON lama hanya menjadi input migrasi doctor dan dihapus setelah impor.
- Helper path lama `plugins/installs.json` sekarang berada dalam kode legacy
  doctor. Modul indeks-Plugin runtime hanya mengekspos opsi persistensi
  berbasis SQLite, bukan path file JSON.
- Sentinel restart Gateway, maksud restart, dan status handoff supervisor
  sekarang menggunakan baris SQLite bersama bertipe (`gateway_restart_sentinel`,
  `gateway_restart_intent`, dan `gateway_restart_handoff`), bukan blob buram
  generik. Kode restart runtime tidak memiliki kontrak sentinel/intent/handoff
  berbentuk file.
- Cache sinkronisasi Matrix, metadata penyimpanan, binding thread, penanda
  dedupe inbound, status cooldown verifikasi startup, snapshot crypto IndexedDB
  SDK, kredensial, dan kunci pemulihan sekarang menggunakan tabel status/blob
  Plugin SQLite bersama. Struct path runtime tidak lagi mengekspos path metadata
  `storage-meta.json`; nama file itu hanya input migrasi lama. Rencana impor JSON
  lama mereka berada di permukaan setup/migrasi doctor Plugin Matrix.
- Startup Matrix tidak lagi memindai, melaporkan, atau menyelesaikan status file
  Matrix lama. Deteksi file Matrix, pembuatan snapshot crypto lama, status
  migrasi pemulihan room-key, impor, dan penghapusan sumber semuanya dimiliki
  doctor.
- Barrel migrasi runtime Matrix dihapus. Helper deteksi dan mutasi status/crypto
  lama diimpor langsung oleh doctor Matrix, bukan menjadi bagian dari permukaan
  API runtime.
- Penanda penggunaan ulang snapshot migrasi Matrix sekarang berada di status
  Plugin SQLite, bukan `matrix/migration-snapshot.json`; doctor tetap dapat
  menggunakan ulang arsip pra-migrasi terverifikasi yang sama tanpa menulis file
  status sidecar.
- Cursor bus Nostr dan status publikasi profil sekarang menggunakan status
  Plugin SQLite bersama. Rencana impor JSON lama mereka berada di permukaan
  setup/migrasi doctor Plugin Nostr.
- Toggle sesi Active Memory sekarang menggunakan status Plugin SQLite bersama,
  bukan `session-toggles.json`; mengaktifkan kembali memory menghapus baris,
  bukan menulis ulang objek JSON.
- Proposal Skill Workshop dan penghitung ulasan sekarang menggunakan status
  Plugin SQLite bersama, bukan store `skill-workshop/<workspace>.json` per
  workspace. Setiap proposal adalah baris terpisah di bawah
  `skill-workshop/proposals`, dan penghitung ulasan adalah baris terpisah di
  bawah `skill-workshop/reviews`.
- Run subagent peninjau Skill Workshop sekarang menggunakan resolver transkrip
  sesi runtime, bukan membuat path sesi sidecar
  `skill-workshop/<sessionId>.json`.
- Lease proses ACPX sekarang menggunakan status Plugin SQLite bersama di bawah
  `acpx/process-leases`, bukan registry seluruh-file `process-leases.json`.
  Setiap lease disimpan sebagai baris tersendiri, mempertahankan pembersihan
  proses usang saat startup tanpa path penulisan ulang JSON runtime.
- Skrip wrapper ACPX dan home Codex terisolasi dibuat di root temp OpenClaw.
  Keduanya dibuat ulang sesuai kebutuhan dan bukan input backup atau migrasi.
- Persistensi registry run subagent menggunakan baris bersama bertipe
  `subagent_runs`. Path lama `subagents/runs.json` sekarang hanya input migrasi
  doctor, dan nama helper runtime tidak lagi menggambarkan layer status sebagai
  berbasis disk. Tes runtime tidak lagi membuat fixture `runs.json` yang tidak
  valid atau kosong untuk membuktikan perilaku registry; tes melakukan seed/baca
  baris SQLite secara langsung.
- Backup men-stage direktori status sebelum pengarsipan, menyalin file
  non-database, mengambil snapshot database `*.sqlite` dengan `VACUUM INTO`,
  menghilangkan sidecar WAL/SHM live, mencatat metadata snapshot dalam manifes
  arsip, dan mencatat run backup yang selesai di SQLite bersama manifes arsip.
  `openclaw backup create` memvalidasi arsip tertulis secara default;
  `--no-verify` adalah jalur cepat eksplisit.
- `openclaw backup restore` memvalidasi arsip sebelum ekstraksi, menggunakan
  ulang manifes ternormalisasi milik verifier, dan memulihkan aset manifes
  terverifikasi ke path sumber yang tercatat. Perintah ini memerlukan `--yes`
  untuk penulisan dan mendukung `--dry-run` untuk rencana pemulihan.
- Filter path volatil backup lama dihapus. Backup tidak lagi membutuhkan daftar
  lewati live-tar untuk file JSON/JSONL sesi atau Cron lama karena snapshot
  SQLite di-stage sebelum pembuatan arsip.
- Persiapan workspace setup biasa dan onboarding tidak lagi membuat direktori
  `agents/<agentId>/sessions/`. Keduanya hanya membuat config/workspace; baris
  sesi SQLite dan baris transkrip dibuat sesuai permintaan dalam database
  per-agen.
- Perbaikan izin keamanan sekarang menargetkan database SQLite global dan
  per-agen plus sidecar WAL/SHM, bukan file `sessions.json` dan transkrip JSONL.
- Nama runtime registry sandbox sekarang menggambarkan jenis registry SQLite
  secara langsung, bukan membawa terminologi registry JSON lama melalui store
  aktif.
- `openclaw reset --scope config+creds+sessions` menghapus database
  `openclaw-agent.sqlite` per-agen plus sidecar WAL/SHM, bukan hanya direktori
  `sessions/` lama.
- Helper sesi agregat Gateway sekarang menggunakan nama berorientasi entri:
  `loadCombinedSessionEntriesForGateway` mengembalikan `{ databasePath, entries }`.
  Penamaan combined-store lama telah dihapus dari pemanggil runtime.
- Seeding channel Docker MCP sekarang menulis baris sesi utama dan peristiwa
  transkrip ke database SQLite per-agen, bukan membuat `sessions.json` dan
  transkrip JSONL.
- Hook session-memory bawaan sekarang me-resolve konteks sesi sebelumnya dari
  SQLite berdasarkan `{agentId, sessionId}`. Hook ini tidak lagi memindai,
  menyimpan, atau mensintesis path transkrip atau direktori `workspace/sessions`.
- Hook command-logger bawaan sekarang menulis baris audit perintah ke tabel
  SQLite bersama `command_log_entries`, bukan menambahkan ke `logs/commands.log`.
- Allowlist pairing channel sekarang hanya mengekspos helper baca/tulis berbasis
  SQLite saat runtime dan dalam SDK Plugin. Resolver path `*-allowFrom.json` dan
  pembaca file lama hanya berada di bawah kode impor legacy doctor.
- `migration_runs` mencatat eksekusi migrasi status lama beserta status,
  timestamp, dan laporan JSON.
- `migration_sources` mencatat setiap sumber file lama yang diimpor beserta hash,
  ukuran, jumlah record, tabel target, id run, status, dan status penghapusan
  sumber.
- `backup_runs` mencatat path arsip backup, status, dan manifes JSON.
- Skema global tidak mempertahankan tabel registry `agents` yang tidak digunakan.
  Discovery database agen adalah registry kanonis `agent_databases` sampai
  runtime memiliki pemilik record agen yang nyata.
- Config katalog model yang dihasilkan disimpan dalam baris SQLite global
  bertipe `agent_model_catalogs` yang dikunci berdasarkan direktori agen.
  Pemanggil runtime menggunakan `ensureOpenClawModelCatalog`; tidak ada API
  kompatibilitas `models.json` dalam kode runtime. Implementasi menulis SQLite
  dan registry PI tertanam dihidrasi dari payload tersimpan itu tanpa membuat
  file `models.json`.
- Ekspor markdown transkrip sesi QMD dan config `memory.qmd.sessions` dihapus.
  Tidak ada koleksi transkrip QMD, tidak ada path runtime `qmd/sessions*`, dan
  tidak ada bridge memori sesi berbasis file.
- Runtime memory-core mengimpor helper pengindeksan transkrip SQLite dari
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, bukan
  subpath SDK QMD. Subpath QMD mempertahankan re-export kompatibilitas hanya
  untuk pemanggil eksternal sampai pembersihan besar SDK dapat menghapusnya.
- `index.sqlite` milik QMD sendiri sekarang adalah materialisasi runtime temp
  yang didukung oleh tabel SQLite utama `plugin_blob_entries`. Runtime tidak
  lagi membuat sidecar tahan lama `~/.openclaw/agents/<agentId>/qmd`.
- Plugin opsional `memory-lancedb` tidak lagi membuat
  `~/.openclaw/memory/lancedb` sebagai store terkelola OpenClaw implisit. Itu
  adalah backend LanceDB eksternal dan tetap dinonaktifkan sampai operator
  mengonfigurasi `dbPath` eksplisit.
- `check:database-first-legacy-stores` menggagalkan sumber runtime baru yang
  memasangkan nama store lama dengan API filesystem bergaya tulis. Pemeriksaan
  ini juga menggagalkan sumber runtime yang memperkenalkan kembali penanda
  bridge transkrip yang sudah dipensiunkan, yaitu `transcriptLocator` atau
  `sqlite-transcript://...`. Kode migrasi, doctor, impor, dan ekspor non-sesi
  eksplisit tetap diizinkan. Nama kontrak lama yang lebih luas seperti
  `sessionFile`, `storePath`, dan facade era-file `SessionManager` lama masih
  memiliki pemilik saat ini dan membutuhkan pekerjaan guard migrasi terpisah
  sebelum dapat menjadi pemeriksaan preflight wajib. Guard sekarang juga
  mencakup store runtime `cache/*.json`, sidecar generik `thread-bindings.json`,
  JSON status/run-log Cron, JSON kesehatan config, sidecar restart dan lock,
  pengaturan Voice Wake, persetujuan binding Plugin, JSON indeks Plugin
  terpasang, JSONL audit File Transfer, log aktivitas Memory Wiki, log teks
  `command-logger` bawaan lama, dan knob diagnostik JSONL raw-stream pi-mono.
  Guard ini juga melarang nama modul legacy doctor tingkat-root lama agar kode
  kompatibilitas tetap berada di bawah `src/commands/doctor/`. Handler debug
  Android juga menggunakan output logcat/in-memory, bukan men-stage file cache
  `camera_debug.log` atau `debug_logs.txt`.

## Bentuk Skema Target

Jaga agar skema tetap eksplisit. State runtime milik host menggunakan tabel bertipe. State buram
milik Plugin menggunakan `plugin_state_entries` / `plugin_blob_entries`; tidak ada
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

Database agent:

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

Nilai besar harus menggunakan kolom `blob`, bukan enkode string JSON. Pertahankan
`value_json` untuk data terstruktur kecil yang harus tetap dapat diperiksa dengan alat
SQLite biasa.

`agent_databases` adalah registri kanonis untuk cabang ini. Jangan tambahkan
tabel `agents` sampai ada pemilik catatan agent yang nyata; konfigurasi agent tetap berada di
`openclaw.json`.

## Bentuk Migrasi Doctor

Doctor harus memanggil satu langkah migrasi eksplisit yang dapat dilaporkan dan aman untuk
dijalankan ulang:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` memanggil implementasi migrasi state setelah
preflight konfigurasi biasa dan membuat cadangan terverifikasi sebelum impor. Startup runtime
dan `openclaw migrate` tidak boleh mengimpor file state OpenClaw lama.

Properti migrasi:

- Satu lintasan migrasi menemukan semua sumber file lama dan menghasilkan rencana
  sebelum mengubah apa pun.
- Doctor membuat arsip cadangan pra-migrasi terverifikasi sebelum mengimpor
  file lama.
- Impor bersifat idempoten dan dikunci berdasarkan path sumber, mtime, ukuran, hash, dan tabel
  target.
- File sumber yang berhasil dihapus atau diarsipkan setelah database target
  commit.
- Impor yang gagal membiarkan sumber tidak tersentuh dan mencatat peringatan di
  `migration_runs`.
- Kode runtime hanya membaca SQLite setelah migrasi tersedia.
- Tidak diperlukan jalur downgrade/ekspor-ke-file-runtime.

## Inventaris Migrasi

Pindahkan ini ke database global:

- Penulisan runtime registri tugas kini menggunakan basis data bersama; pengimpor sidecar
  `tasks/runs.sqlite` yang belum dirilis dihapus. Penyimpanan snapshot melakukan upsert berdasarkan id tugas
  dan hanya menghapus baris tugas/pengiriman yang hilang.
- Penulisan runtime Task Flow kini menggunakan basis data bersama; pengimpor sidecar
  `tasks/flows/registry.sqlite` yang belum dirilis dihapus. Penyimpanan snapshot
  melakukan upsert berdasarkan id flow dan hanya menghapus baris flow yang hilang.
- Penulisan runtime status Plugin kini menggunakan basis data bersama; pengimpor sidecar
  `plugin-state/state.sqlite` yang belum dirilis dihapus.
- Pencarian memori bawaan tidak lagi default ke `memory/<agentId>.sqlite`; tabel
  indeksnya berada di basis data agen pemilik, dan opt-in sidecar eksplisit
  `memorySearch.store.path` telah dipensiunkan ke migrasi konfigurasi doctor.
- Pengindeksan ulang memori bawaan hanya mereset tabel milik memori di basis data agen.
  Itu tidak boleh mengganti seluruh berkas SQLite, karena basis data yang sama memiliki
  sesi, transkrip, baris VFS, artefak, dan cache runtime.
- Registri sandbox container/browser dari JSON monolitik dan tersharding. Penulisan
  runtime kini menggunakan basis data bersama; impor JSON lama tetap ada.
- Definisi pekerjaan Cron, status jadwal, dan riwayat run kini menggunakan SQLite bersama;
  doctor mengimpor/menghapus berkas lama `jobs.json`, `jobs-state.json`, dan
  `cron/runs/*.jsonl`
- Identitas/autentikasi perangkat, push, pemeriksaan pembaruan, komitmen, cache model
  OpenRouter, indeks Plugin terpasang, dan binding app-server
- Record pairing dan bootstrap perangkat/node kini menggunakan tabel SQLite bertipe
- Pelanggan notifikasi device-pair dan penanda permintaan terkirim kini menggunakan
  tabel plugin-state SQLite bersama, bukan `device-pair-notify.json`.
- Record panggilan voice-call kini menggunakan tabel plugin-state SQLite bersama di bawah
  namespace `voice-call` / `calls`, bukan `calls.jsonl`; CLI Plugin
  men-tail dan merangkum riwayat panggilan berbasis SQLite.
- Sesi Gateway QQBot, record known-user, dan cache kutipan ref-index kini menggunakan
  status Plugin SQLite di bawah namespace `qqbot` (`sessions`, `known-users`,
  `ref-index`), bukan `session-*.json`, `known-users.json`, dan
  `ref-index.jsonl`; migrasi doctor/setup QQBot mengimpor dan menghapus berkas lama.
- Preferensi model-picker Discord, hash command-deploy, dan binding thread
  kini menggunakan status Plugin SQLite di bawah namespace `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  bukan `model-picker-preferences.json`, `command-deploy-cache.json`, dan
  `thread-bindings.json`; migrasi doctor/setup Discord mengimpor dan
  menghapus berkas lama.
- Cursor catchup BlueBubbles dan penanda dedupe inbound kini menggunakan status Plugin SQLite
  di bawah namespace `bluebubbles` (`catchup-cursors`, `inbound-dedupe`)
  bukan `bluebubbles/catchup/*.json` dan
  `bluebubbles/inbound-dedupe/*.json`; migrasi doctor/setup BlueBubbles
  mengimpor dan menghapus berkas lama.
- Offset pembaruan Telegram, entri cache stiker, entri cache pesan rantai balasan,
  entri cache pesan terkirim, entri cache nama topik, dan binding thread
  kini menggunakan status Plugin SQLite di bawah namespace `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) bukan `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json`, dan
  `thread-bindings-*.json`; migrasi doctor/setup Telegram mengimpor dan
  menghapus berkas lama.
- Cursor catchup iMessage, pemetaan short-id balasan, dan baris dedupe sent-echo
  kini menggunakan status Plugin SQLite di bawah namespace `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) bukan `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl`, dan `imessage/sent-echoes.jsonl`; migrasi doctor/setup iMessage
  mengimpor dan menghapus berkas lama.
- Percakapan, polling, token SSO, dan pembelajaran feedback Microsoft Teams kini
  menggunakan namespace status Plugin SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) bukan `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json`, dan `*.learnings.json`; migrasi
  doctor/setup Microsoft Teams mengimpor dan mengarsipkan berkas lama.
  Unggahan tertunda adalah cache SQLite berumur pendek dan berkas cache JSON lama
  tidak dimigrasikan.
- Cache sinkronisasi Matrix, metadata penyimpanan, binding thread, penanda dedupe inbound,
  status cooldown verifikasi startup, kredensial, kunci pemulihan, dan snapshot kripto
  IndexedDB SDK kini menggunakan namespace status/blob Plugin SQLite di bawah
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  bukan `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json`, dan `crypto-idb-snapshot.json`; migrasi doctor/setup Matrix
  mengimpor dan menghapus berkas lama tersebut dari root penyimpanan Matrix
  berscope akun.
- Cursor bus Nostr dan status publikasi profil kini menggunakan status Plugin SQLite di bawah
  namespace `nostr` (`bus-state`, `profile-state`) bukan
  `bus-state-*.json` dan `profile-state-*.json`; migrasi doctor/setup Nostr
  mengimpor dan menghapus berkas lama.
- Toggle sesi Active Memory kini menggunakan status Plugin SQLite di bawah
  `active-memory/session-toggles`, bukan `session-toggles.json`.
- Antrean proposal Skill Workshop dan penghitung ulasan kini menggunakan status Plugin SQLite
  di bawah `skill-workshop/proposals` dan `skill-workshop/reviews`, bukan
  berkas `skill-workshop/<workspace>.json` per-workspace.
- Antrean pengiriman outbound dan pengiriman sesi kini berbagi tabel SQLite global
  `delivery_queue_entries` di bawah nama antrean terpisah
  (`outbound-delivery`, `session-delivery`) bukan berkas durable
  `delivery-queue/*.json`, `delivery-queue/failed/*.json`, dan
  `session-delivery-queue/*.json`. Langkah legacy-state doctor mengimpor
  baris tertunda dan gagal, menghapus penanda terkirim usang, dan menghapus berkas
  JSON lama setelah impor. Field routing panas dan retry adalah kolom bertipe; payload
  JSON dipertahankan hanya untuk replay/debug.
- Lease proses ACPX kini menggunakan status Plugin SQLite di bawah `acpx/process-leases`
  bukan `process-leases.json`.
- Metadata run backup dan migrasi

Pindahkan ini ke basis data agen:

- Root sesi agen dan payload session-entry berbentuk kompatibilitas. Selesai untuk
  penulisan runtime: metadata sesi panas dapat di-query di `sessions`, sedangkan payload lengkap
  `SessionEntry` berbentuk lama tetap berada di `session_entries`.
- Event transkrip agen. Selesai untuk penulisan runtime.
- Checkpoint Compaction dan snapshot transkrip. Selesai untuk penulisan runtime:
  salinan transkrip checkpoint adalah baris transkrip SQLite dan metadata checkpoint
  dicatat di `transcript_snapshots`. Helper checkpoint Gateway
  kini menamai nilai ini sebagai snapshot transkrip, bukan berkas sumber.
- Namespace scratch/workspace VFS agen. Selesai untuk penulisan VFS runtime.
- Payload lampiran subagen. Selesai untuk penulisan runtime: payload adalah entri seed VFS
  SQLite dan tidak pernah menjadi berkas workspace durable.
- Artefak tool. Selesai untuk penulisan runtime.
- Artefak run. Selesai untuk penulisan runtime worker melalui tabel per-agen
  `run_artifacts`.
- Cache runtime lokal agen. Selesai untuk penulisan cache berscope runtime worker melalui
  tabel per-agen `cache_entries`. Cache model seluruh Gateway tetap berada di basis data
  global kecuali cache tersebut menjadi spesifik agen.
- Log stream induk ACP. Selesai untuk penulisan runtime.
- Sesi ledger replay ACP. Selesai untuk penulisan runtime melalui
  `acp_replay_sessions` dan `acp_replay_events`; `acp/event-ledger.json` lama
  tetap hanya sebagai input doctor.
- Metadata sesi ACP. Selesai untuk penulisan runtime melalui `acp_sessions`; blok
  `entry.acp` lama di `sessions.json` hanya menjadi input migrasi doctor.
- Sidecar trajectory ketika bukan berkas ekspor eksplisit. Selesai untuk penulisan
  runtime: capture trajectory menulis baris `trajectory_runtime_events`
  basis data agen dan mencerminkan artefak berscope run ke SQLite. Sidecar lama hanya
  menjadi input impor doctor; ekspor dapat membuat output support-bundle JSONL baru
  tetapi tidak membaca atau memigrasikan sidecar trajectory/transkrip lama saat runtime.
  Capture trajectory runtime mengekspos scope SQLite; helper path JSONL
  diisolasi untuk dukungan ekspor/debug dan tidak diekspor ulang dari modul runtime.
  Metadata trajectory embedded-runner mencatat identitas `{agentId, sessionId, sessionKey}`
  alih-alih mempertahankan locator transkrip.

Pertahankan ini berbasis berkas untuk saat ini:

- `openclaw.json`
- berkas kredensial provider atau CLI
- manifes Plugin/paket
- workspace pengguna dan repositori Git ketika mode disk dipilih
- log yang dimaksudkan untuk di-tail operator, kecuali permukaan log tertentu dipindahkan

## Rencana Migrasi

### Fase 0: Bekukan Batas

Buat batas durable-state eksplisit sebelum memindahkan lebih banyak baris:

- Tambahkan tabel `migration_runs` ke basis data global.
  Selesai untuk laporan eksekusi migrasi legacy-state.
- Tambahkan satu layanan migrasi status milik doctor untuk impor file-to-database.
  Selesai: `openclaw doctor --fix` menggunakan implementasi migrasi legacy-state.
- Jadikan `plan` read-only dan jadikan `apply` membuat backup, mengimpor, memverifikasi, lalu
  menghapus atau mengarantina berkas lama.
  Selesai: doctor membuat backup pra-migrasi yang terverifikasi, meneruskan path backup
  ke `migration_runs`, dan menggunakan ulang jalur importer/removal.
- Tambahkan larangan statis agar kode runtime baru tidak dapat menulis berkas status lama sementara
  kode migrasi dan pengujian masih dapat men-seed/membacanya.
  Selesai untuk store lama yang saat ini telah dimigrasikan; guard juga memindai
  pengujian bertingkat untuk kontrak locator transkrip runtime yang dilarang.

### Fase 1: Selesaikan Control Plane Global

Pertahankan status koordinasi bersama di `state/openclaw.sqlite`:

- Agen dan registri basis data agen
- Ledger tugas dan Task Flow
- Status Plugin
- Registri sandbox container/browser
- Riwayat run Cron/scheduler
- Pairing, perangkat, push, update-check, TUI, cache OpenRouter/model, dan status runtime
  kecil lain yang berscope Gateway
- Metadata backup dan migrasi
- Byte lampiran media Gateway. Selesai untuk penulisan runtime; path berkas langsung
  adalah materialisasi sementara untuk kompatibilitas dengan pengirim channel dan staging
  sandbox. Allowlist runtime menerima path materialisasi SQLite, bukan root media
  status/konfigurasi lama. Doctor mengimpor berkas media lama ke
  `media_blobs` dan menghapus berkas sumber setelah penulisan baris berhasil.
- Sesi, event, dan blob payload capture proxy debug. Selesai: capture berada
  di DB status bersama dan dibuka melalui bootstrap DB status bersama, skema,
  WAL, dan pengaturan busy-timeout. Byte payload dikompresi gzip di
  `capture_blobs.data`; tidak ada override DB sidecar runtime proxy debug,
  direktori blob, atau target schema/codegen yang dihasilkan khusus proxy-capture.
  Migrasi doctor/startup mengimpor baris `debug-proxy/capture.sqlite` yang sudah dirilis
  dan blob payload yang dirujuk, termasuk override environment DB/blob lama yang aktif,
  lalu mengarsipkan sumber tersebut sambil membiarkan sertifikat CA tetap utuh.

Fase ini juga menghapus pembuka sidecar duplikat, helper izin, setup WAL,
pruning filesystem, dan penulis kompatibilitas dari subsistem tersebut.

### Fase 2: Perkenalkan Basis Data Per-Agen

Buat satu basis data per agen dan daftarkan dari DB global:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

Baris global `agent_databases` menyimpan path, versi skema, timestamp last-seen,
dan metadata ukuran/integritas dasar. Kode runtime meminta DB agen dari registri
alih-alih menurunkan path berkas secara langsung.

DB agen memiliki:

- `sessions` sebagai root sesi kanonis, dengan `session_entries` sebagai tabel payload
  berbentuk kompatibilitas yang melekat pada root tersebut, dan
  `session_routes` sebagai lookup `session_key` aktif yang unik
- `conversations` dan `session_conversations` sebagai identitas routing penyedia
  yang dinormalisasi dan melekat pada sesi
- `transcript_events`
- snapshot transkrip dan checkpoint Compaction. Selesai untuk penulisan runtime.
- `vfs_entries`
- `tool_artifacts` dan artefak run
- baris runtime/cache lokal agen. Selesai untuk cache berscope worker.
- event stream induk ACP
- event runtime trajektori saat bukan artefak ekspor eksplisit

### Fase 3: Ganti API Penyimpanan Sesi

Selesai untuk runtime. Permukaan penyimpanan sesi berbentuk file bukan kontrak
runtime aktif:

- Runtime tidak lagi memanggil `loadSessionStore(storePath)` atau memperlakukan
  `storePath` sebagai identitas sesi.
- Operasi baris runtime adalah `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry`, dan `listSessionEntries`.
- Helper penulisan ulang seluruh penyimpanan, penulis file, pengujian antrean,
  pemangkasan alias, dan parameter penghapusan kunci legacy hilang dari runtime.
- Ekspor kompatibilitas paket-root yang usang masih mengadaptasi path kanonis
  `sessions.json` ke API baris SQLite.
- Parsing `sessions.json` hanya tersisa di kode migrasi/impor doctor dan
  pengujian doctor.
- Fallback siklus hidup runtime membaca header transkrip SQLite, bukan baris
  pertama JSONL.

Terus hapus apa pun yang memperkenalkan kembali parameter file-lock,
kosakata pemangkasan/pemotongan-sebagai-pemeliharaan-file, identitas path
penyimpanan, atau pengujian yang satu-satunya asersinya adalah persistensi JSON.

### Fase 4: Pindahkan Transkrip, Stream ACP, Trajektori, Dan VFS

Jadikan setiap stream data agen native database:

- Penulisan append transkrip berjalan melalui satu transaksi SQLite yang
  memastikan header sesi, memeriksa idempotensi pesan, memilih tail induk,
  menyisipkan ke `transcript_events`, dan mencatat metadata identitas yang dapat
  dikueri di `transcript_event_identities`. Selesai untuk append pesan
  transkrip langsung dan append `TranscriptSessionManager` persisten normal;
  operasi branch eksplisit mempertahankan pilihan induk eksplisitnya dan tetap
  menulis baris SQLite tanpa menurunkan locator file apa pun.
- Log stream induk ACP menjadi baris, bukan file `.acp-stream.jsonl`. Selesai.
- Setup spawn ACP tidak lagi menyimpan path JSONL transkrip. Selesai.
- Capture trajektori runtime menulis baris/artefak event secara langsung.
  Perintah dukungan/ekspor eksplisit masih dapat menghasilkan artefak JSONL
  support-bundle sebagai format ekspor, tetapi ekspor sesi tidak membuat ulang
  JSONL sesi. Selesai.
- Workspace disk tetap berada di disk saat dikonfigurasi sebagai mode disk.
- Scratch VFS dan mode workspace khusus VFS eksperimental menggunakan DB agen.

Migrasi mengimpor file JSONL lama satu kali, mencatat jumlah/hash di
`migration_runs`, dan menghapus file yang diimpor setelah pemeriksaan integritas.

### Fase 5: Backup, Restore, Vacuum, Dan Verifikasi

Backup tetap berupa satu file arsip:

- Checkpoint setiap database global dan agen.
- Snapshot setiap DB dengan semantik backup SQLite atau `VACUUM INTO`.
- Arsipkan snapshot DB ringkas, config, kredensial eksternal, dan ekspor
  workspace yang diminta.
- Hilangkan file live mentah `*.sqlite-wal` dan `*.sqlite-shm`.
- Verifikasi dengan membuka setiap snapshot DB dan menjalankan
  `PRAGMA integrity_check`.
  `openclaw backup create` melakukan verifikasi arsip ini secara default;
  `--no-verify` hanya melewati pass arsip pasca-penulisan, bukan pemeriksaan
  integritas pembuatan snapshot.
- Restore menyalin snapshot kembali ke path targetnya. Branch ini mereset tata
  letak SQLite yang belum dikirim ke `user_version = 1`; perubahan skema yang
  dikirim di masa depan dapat menambahkan migrasi eksplisit saat diperlukan.

### Fase 6: Runtime Worker

Pertahankan mode worker tetap eksperimental saat pemisahan database mendarat:

- Worker menerima id agen, id run, mode filesystem, dan identitas registri DB.
- Setiap worker membuka koneksi SQLite sendiri.
- Induk tetap memegang otoritas pengiriman channel, persetujuan, config, dan
  pembatalan.
- Mulai dengan satu worker per run aktif; tambahkan pooling hanya setelah
  siklus hidup dan kepemilikan koneksi DB stabil.

### Fase 7: Hapus Dunia Lama

Selesai untuk manajemen sesi runtime. Dunia lama hanya diizinkan sebagai input
doctor eksplisit atau output dukungan/ekspor:

- Tidak ada penulisan runtime `sessions.json`, JSONL transkrip, JSON registri
  sandbox, SQLite sidecar tugas, atau SQLite sidecar plugin-state.
- Tidak ada pemangkasan file JSON/sesi, pemotongan transkrip file, lock file
  sesi, atau pengujian sesi berbentuk lock.
- Tidak ada ekspor kompatibilitas runtime yang tujuannya menjaga file sesi lama
  tetap mutakhir.
- Ekspor dukungan eksplisit tetap menjadi format arsip/materialisasi yang
  diminta pengguna dan tidak boleh memasukkan kembali nama file ke identitas
  runtime.

## Backup Dan Restore

Backup sebaiknya berupa satu file arsip, tetapi capture database harus
native SQLite:

1. Hentikan aktivitas tulis jangka panjang atau masuki barrier backup singkat.
2. Untuk setiap database global dan agen, jalankan checkpoint.
3. Snapshot setiap database menggunakan semantik backup SQLite atau
   `VACUUM INTO` ke direktori backup sementara.
4. Arsipkan snapshot database yang dipadatkan, file config, direktori
   kredensial, workspace terpilih, dan manifest.
5. Verifikasi arsip dengan membuka setiap snapshot SQLite yang disertakan dan
   menjalankan `PRAGMA integrity_check`.
   `openclaw backup create` melakukan ini secara default; `--no-verify` hanya
   untuk sengaja melewati pass arsip pasca-penulisan.

Jangan mengandalkan salinan live mentah `*.sqlite`, `*.sqlite-wal`, dan
`*.sqlite-shm` sebagai format backup utama. Manifest arsip harus mencatat peran
database, id agen, versi skema, path sumber, path snapshot, ukuran byte, dan
status integritas.

Restore harus membangun ulang file database global dan database agen dari
snapshot arsip. Karena tata letak SQLite belum dikirim, refactor ini hanya
mempertahankan skema versi-1 ditambah impor file-ke-database doctor. Perintah
restore memvalidasi arsip terlebih dahulu, lalu mengganti setiap aset manifest
dari payload hasil ekstraksi yang terverifikasi.

## Rencana Refactor Runtime

1. Tambahkan API registri database.
   - Resolve path DB global dan DB per agen.
   - Pertahankan skema yang belum dikirim pada `user_version = 1`; jangan
     tambahkan kode runner migrasi skema sampai skema yang dikirim
     membutuhkannya.
   - Tambahkan helper close/checkpoint/integrity yang digunakan oleh pengujian,
     backup, dan doctor.

2. Ciutkan penyimpanan SQLite sidecar.
   - Pindahkan tabel state Plugin ke database global. Selesai untuk penulisan
     runtime; importer sidecar legacy yang belum dikirim dihapus.
   - Pindahkan tabel registri tugas ke database global. Selesai untuk penulisan
     runtime; importer sidecar legacy yang belum dikirim dihapus.
   - Pindahkan tabel Task Flow ke database global. Selesai untuk penulisan
     runtime; importer sidecar legacy yang belum dikirim dihapus.
   - Pindahkan tabel memory-search bawaan ke setiap database agen. Selesai;
     `memorySearch.store.path` kustom eksplisit sekarang dihapus oleh migrasi
     config doctor.
     Reindex penuh berjalan di tempat hanya terhadap tabel memori; path swap
     seluruh file lama dan helper swap indeks sidecar dihapus.
   - Hapus pembuka database duplikat, setup WAL, helper izin, dan path close
     dari subsistem tersebut.

3. Pindahkan tabel milik agen ke database per agen.
   - Buat DB agen sesuai permintaan melalui registri database global. Selesai.
   - Pindahkan entri sesi runtime, event transkrip, baris VFS, dan artefak tool
     ke DB agen. Selesai.
   - Jangan migrasikan entri sesi shared-DB lokal branch, event transkrip, baris
     VFS, atau artefak tool; tata letak itu tidak pernah dikirim. Pertahankan
     hanya impor file-ke-database legacy di doctor.

4. Ganti API penyimpanan sesi.
   - Hapus `storePath` sebagai identitas runtime. Selesai untuk runtime dan
     dijaga oleh `check:database-first-legacy-stores`: metadata sesi, pembaruan
     route, persistensi perintah, pembersihan sesi CLI, preview reasoning
     Feishu, persistensi transcript-state, kedalaman subagen, override sesi
     profil auth, logika parent-fork, dan inspeksi QA-lab sekarang me-resolve
     database dari kunci agen/sesi kanonis.
     Respons daftar sesi Gateway/TUI/UI/macOS sekarang mengekspos `databasePath`
     alih-alih `path` legacy; permukaan debug macOS menampilkan database per
     agen sebagai state read-only alih-alih menulis config `session.store`.
     `/status`, ekspor trajektori yang digerakkan chat, dan proxy dependensi CLI
     tidak lagi meneruskan path penyimpanan legacy; fallback penggunaan
     transkrip membaca SQLite berdasarkan identitas agen/sesi. Pengujian runtime
     dan bridge tidak lagi mengekspos `storePath`; input doctor/migrasi memiliki
     nama field legacy tersebut.
     Loading sesi gabungan Gateway tidak lagi memiliki branch runtime khusus
     untuk nilai `session.store` non-templated; ia mengagregasi baris SQLite per
     agen.
     Lane doctor session-lock legacy dan helper pembersihan `.jsonl.lock`-nya
     telah dihapus; SQLite sekarang menjadi batas konkurensi sesi.
     Call site runtime panas menggunakan nama helper berorientasi baris seperti
     `resolveSessionRowEntry`; alias kompatibilitas lama
     `resolveSessionStoreEntry` telah dihapus dari ekspor runtime dan SDK
     Plugin.

- Gunakan operasi baris `{ agentId, sessionKey }`.
  Selesai: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry`, dan `listSessionEntries` adalah API SQLite-first yang
  tidak memerlukan path penyimpanan sesi. Ringkasan status, status agen lokal,
  health, dan perintah listing `openclaw sessions` sekarang membaca baris per
  agen secara langsung dan menampilkan path database SQLite per agen alih-alih
  path `sessions.json`.
- Ganti delete/insert seluruh penyimpanan dengan `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries`, dan kueri pembersihan SQL.
  Selesai untuk runtime: path panas sekarang menggunakan API baris dan patch
  baris yang diulang saat konflik; helper impor/ganti seluruh penyimpanan yang
  tersisa dibatasi ke kode impor migrasi dan pengujian backend SQLite.
  - Hapus `store-writer.ts` dan pengujian antrean penulis. Selesai.
  - Hapus pemangkasan kunci legacy runtime dan parameter penghapusan alias dari
    upsert/patch baris sesi. Selesai.

5. Hapus perilaku registri JSON runtime.
   - Jadikan pembacaan dan penulisan registri sandbox hanya SQLite. Selesai.
   - Impor JSON monolitik dan sharded hanya dari langkah migrasi. Selesai.
   - Hapus lock registri sharded dan penulisan JSON. Selesai.

- Pertahankan satu tabel registri bertipe alih-alih menyimpan baris registri
  sebagai JSON buram generik jika bentuknya tetap berupa state operasional
  hot-path. Selesai.

6. Hapus mutasi sesi berbentuk file-lock.
   - Selesai untuk pembuatan lock runtime dan API lock runtime.
   - Lane pembersihan doctor `.jsonl.lock` legacy mandiri dihapus.
   - `session.writeLock` adalah config legacy yang dimigrasikan doctor, bukan
     setelan runtime bertipe.
   - Integritas state tidak lagi memiliki path pemangkasan file transkrip yatim
     terpisah; migrasi doctor mengimpor/menghapus sumber JSONL legacy di satu
     tempat.
   - Koordinasi singleton Gateway menggunakan baris SQLite `state_leases`
     bertipe di bawah `gateway_locks` dan tidak lagi mengekspos seam direktori
     file-lock.
   - Persistensi dedupe SDK Plugin generik tidak lagi menggunakan file lock
     atau file JSON; ia menulis baris plugin-state SQLite bersama. Selesai.
   - Koordinasi embed QMD menggunakan lease state SQLite alih-alih
     `qmd/embed.lock`. Selesai.

7. Jadikan worker sadar database.
   - Worker membuka koneksi SQLite sendiri.
   - Induk memiliki pengiriman, callback channel, dan config.
   - Worker menerima id agen, id run, mode filesystem, dan identitas registri
     DB, bukan handle live.
   - `vfs-only` tetap eksperimental dan menggunakan database agen sebagai root
     penyimpanannya.
   - Pertahankan satu worker per run aktif terlebih dahulu. Pooling dapat
     menunggu sampai masa pakai koneksi DB dan perilaku pembatalan menjadi
     membosankan.

8. Integrasi cadangan.
   - Ajarkan cadangan untuk mengambil snapshot basis data global dan agen melalui cadangan SQLite atau
     `VACUUM INTO`. Selesai untuk file `*.sqlite` yang ditemukan di bawah aset status.
   - Tambahkan verifikasi cadangan untuk integritas SQLite dan versi skema. Selesai untuk
     pembuatan cadangan dan pemeriksaan integritas verifikasi arsip default.
   - Catat metadata proses cadangan di SQLite. Selesai melalui tabel bersama `backup_runs`
     dengan jalur arsip, status, dan JSON manifes.
   - Tambahkan pemulihan dari snapshot arsip terverifikasi. Selesai: `openclaw backup
restore` memvalidasi sebelum ekstraksi, menggunakan manifes ternormalisasi milik pemverifikasi,
     mendukung `--dry-run`, dan memerlukan `--yes` sebelum mengganti
     jalur sumber yang tercatat.
   - Sertakan ekspor VFS/workspace hanya saat diminta; jangan ekspor internal sesi
     sebagai JSON atau JSONL.

9. Hapus pengujian dan kode usang. Selesai untuk permukaan sesi runtime yang diketahui.

- Hapus pengujian yang menegaskan pembuatan runtime atas file `sessions.json` atau transkrip
  JSONL. Selesai untuk penyimpanan sesi inti, chat, peristiwa transkrip gateway,
  pratinjau, siklus hidup, pembaruan session-entry perintah, reset/trace auto-reply, dan
  fixture dreaming memory-core, perutean target persetujuan, perbaikan transkrip sesi,
  perbaikan izin keamanan, ekspor trajectory, dan ekspor sesi.
  Pengujian transkrip active-memory kini menegaskan cakupan SQLite dan tidak ada pembuatan file JSONL
  sementara atau persisten.
  Regresi pemangkasan transkrip heartbeat lama dihapus karena
  runtime tidak lagi memotong transkrip JSONL.
  Pengujian alat daftar sesi agen tidak lagi memodelkan jalur `sessions.json` lama
  sebagai bentuk respons Gateway; pengujian app/UI/macOS menggunakan `databasePath`.
  Pengujian penggunaan transkrip `/status` kini menanam baris transkrip SQLite secara langsung
  alih-alih menulis file JSONL.
  Pengujian siklus hidup sesi Gateway kini menggunakan helper penanaman transkrip SQLite
  secara langsung; bentuk fixture file sesi satu baris lama hilang dari cakupan reset
  dan hapus.
  `sessions.delete` tidak lagi mengembalikan field era file `archived: []`; penghapusan
  hanya melaporkan hasil mutasi baris. Opsi `deleteTranscript` lama
  juga hilang: menghapus sesi menghapus root `sessions` kanonis dan membiarkan
  SQLite melakukan cascade pada baris transkrip, snapshot, dan trajectory milik sesi, sehingga tidak ada
  pemanggil yang dapat meninggalkan transkrip yatim atau melupakan cabang pembersihan.
  Pengujian penangkapan trajectory context-engine kini membaca baris `trajectory_runtime_events`
  dari basis data agen terisolasi alih-alih membaca
  `session.trajectory.jsonl`.
  Skrip seed channel Docker MCP kini menanam baris SQLite secara langsung. Penulisan langsung
  `sessions.json` dibatasi hanya untuk fixture doctor.
  Tool Search Gateway E2E membaca bukti tool-call dari baris transkrip SQLite
  alih-alih memindai file `agents/<agentId>/sessions/*.jsonl`.
  Peristiwa host memory-core dan baris scratch session-corpus kini berada di plugin-state SQLite
  bersama; `events.jsonl` dan `session-corpus/*.txt` hanya menjadi input migrasi doctor
  legacy. Baris aktif menggunakan jalur virtual `memory/session-ingestion/`,
  bukan `.dreams/session-corpus`. Modul perbaikan dreaming memory-core lama
  dan pengujian CLI/Gateway-nya dihapus karena runtime tidak lagi
  memiliki perbaikan arsip file untuk korpus tersebut. Pengujian bridge/public-artifact memory-core
  tidak lagi memunculkan `.dreams/events.jsonl`; pengujian tersebut
  menggunakan nama artefak JSON virtual berbasis SQLite.
  Dokumentasi pengujian SDK/Codex publik kini menyebut status sesi SQLite alih-alih file sesi,
  dan contoh channel-turn tidak lagi mengekspos argumen `storePath`.
  Status sinkronisasi Matrix kini menggunakan penyimpanan plugin-state SQLite secara langsung. Kontrak
  client/runtime aktif meneruskan root penyimpanan akun, bukan jalur `bot-storage.json`,
  dan doctor mengimpor `bot-storage.json` legacy ke SQLite sebelum menghapus
  sumbernya. Skenario restart/destruktif QA Matrix kini memutasi baris sinkronisasi SQLite
  secara langsung alih-alih membuat atau menghapus file `bot-storage.json` palsu, dan
  substrat E2EE meneruskan root sync-store alih-alih jalur
  `sync-store.json` palsu.
  Pemilihan storage-root Matrix tidak lagi menilai root berdasarkan file JSON sync/thread legacy;
  pemilihan tersebut menggunakan metadata root yang tahan lama plus status kripto nyata.
  Suite pengujian backend sesi SQLite runtime tidak lagi membuat
  `sessions.json`; fixture sumber legacy kini berada dalam pengujian doctor
  yang mengimpornya.
  Pengujian sesi Gateway tidak lagi mengekspos helper `createSessionStoreDir` atau
  penyiapan jalur temp session-store yang tidak terpakai; direktori fixture eksplisit, dan penyiapan
  baris langsung menggunakan penamaan session-row SQLite.
  Cakupan parser session-store JSON5 khusus doctor dipindahkan dari pengujian infra dan
  ke pengujian migrasi doctor, sehingga suite pengujian runtime tidak lagi memiliki parsing
  file sesi legacy.
  Pengujian runtime SSO/pending-upload Microsoft Teams tidak lagi membawa fixture sidecar
  JSON atau parser; parsing token SSO legacy hanya berada di modul migrasi
  Plugin. Pengujian Telegram tidak lagi menanam jalur store `/tmp/*.json` palsu;
  pengujian tersebut mereset cache pesan berbasis SQLite secara langsung. Helper test-state
  OpenClaw generik tidak lagi mengekspos penulis `auth-profiles.json`
  legacy; pengujian migrasi auth doctor memiliki fixture tersebut secara lokal.
  Pengujian runtime untuk penunjuk sesi terakhir TUI, persetujuan exec, toggle active-memory,
  verifikasi dedupe/startup Matrix, sinkronisasi sumber Memory Wiki,
  binding percakapan saat ini, auth onboarding, dan impor rahasia Hermes tidak
  lagi membuat file sidecar lama atau menegaskan nama file lama tidak ada. Pengujian tersebut
  membuktikan perilaku melalui baris SQLite dan API penyimpanan publik; pengujian doctor/migrasi
  adalah satu-satunya tempat nama file sumber legacy berada.
  Pengujian runtime untuk pemasangan device/node, channel allowFrom, intent restart,
  handoff restart, entri antrean pengiriman sesi, kesehatan config, cache iMessage,
  cron job, header transkrip PI, registri subagent, dan lampiran gambar terkelola
  juga tidak lagi membuat file JSON/JSONL yang sudah dihentikan hanya untuk membuktikan
  file tersebut diabaikan atau tidak ada.
  Pemulihan overflow PI tidak lagi memiliki fallback penulisan ulang/pemotongan
  SessionManager: pemotongan tool-result dan penulisan ulang transkrip context-engine memutasi
  baris transkrip SQLite, lalu menyegarkan status prompt aktif dari basis data.
  Penambahan pesan SessionManager persisten didelegasikan ke helper penambahan transkrip
  SQLite atomik untuk pemilihan induk dan idempotensi. Penambahan entri metadata/kustom
  normal juga memilih induk saat ini di dalam SQLite, sehingga
  instance manager usang tidak membangkitkan kembali race parent-chain pra-SQLite.
  Pembersihan tail PI sintetis untuk precheck mid-turn dan `sessions_yield` kini
  memangkas status transkrip SQLite secara langsung; bridge penghapusan tail SessionManager lama
  dan pengujiannya dihapus.
  Penangkapan checkpoint Compaction juga mengambil snapshot hanya dari SQLite; pemanggil tidak
  lagi meneruskan SessionManager hidup sebagai sumber transkrip alternatif.
- Pertahankan pengujian yang menanam file legacy hanya untuk migrasi.
- Bukti file JSON telah diganti dengan bukti baris SQL untuk permukaan runtime
  aktif.

- Tambahkan larangan statis untuk penulisan runtime ke jalur JSON sesi/cache legacy.
  Selesai untuk guard repo.

10. Buat laporan migrasi dapat diaudit.
    - Catat proses migrasi di SQLite dengan timestamp mulai/selesai, jalur sumber,
      hash sumber, hitungan, peringatan, dan jalur cadangan.
      Selesai: eksekusi migrasi status legacy kini mempertahankan laporan `migration_runs`
      dengan inventaris jalur/tabel sumber, SHA-256 file sumber, ukuran,
      jumlah record, peringatan, dan jalur cadangan.
      Selesai: eksekusi migrasi status legacy juga mempertahankan baris `migration_sources`
      untuk audit tingkat sumber dan keputusan skip/backfill di masa depan.
    - Buat apply idempoten. Menjalankan ulang setelah impor parsial harus
      melewati sumber yang sudah diimpor atau menggabungkan berdasarkan kunci stabil.
      Selesai: indeks sesi, transkrip, antrean pengiriman, status Plugin, ledger tugas,
      dan baris SQLite global milik agen diimpor melalui kunci stabil atau
      semantik upsert/replace, sehingga rerun bergabung tanpa menggandakan baris
      yang tahan lama.
    - Impor yang gagal harus mempertahankan file sumber asli di tempatnya.
      Selesai: impor transkrip yang gagal kini meninggalkan sumber JSONL asli di
      jalur terdeteksinya, dan `migration_sources` mencatat sumber sebagai
      `warning` dengan `removed_source=0` untuk proses doctor berikutnya.

## Aturan Performa

- Satu koneksi per thread/proses tidak masalah; jangan berbagi handle antar
  worker.
- Gunakan WAL, `foreign_keys=ON`, busy timeout 30 detik, dan transaksi tulis
  `BEGIN IMMEDIATE` yang singkat.
- Pertahankan helper transaksi tulis tetap sinkron kecuali/sampai API transaksi asinkron
  menambahkan semantik mutex/backpressure eksplisit.
- Pertahankan penulisan pengiriman induk kecil dan transaksional.
- Hindari penulisan ulang seluruh store; gunakan upsert/delete tingkat baris.
- Tambahkan indeks untuk jalur list-by-agent, list-by-session, updated-at, run id, dan
  kedaluwarsa sebelum memindahkan kode panas.
- Simpan artefak besar, media, dan vektor sebagai BLOB atau baris BLOB terpotong, bukan
  base64 atau JSON array numerik.
- Pertahankan entri plugin-state buram tetap kecil dan tercakup.
- Tambahkan pembersihan SQL untuk TTL/kedaluwarsa alih-alih pemangkasan filesystem.
  Selesai untuk store runtime milik basis data: media, status Plugin, blob Plugin,
  dedupe persisten, dan cache agen semuanya kedaluwarsa melalui baris SQLite. Pembersihan
  filesystem yang tersisa dibatasi pada materialisasi sementara atau perintah
  penghapusan eksplisit.

## Larangan Statis

Tambahkan pemeriksaan repo yang menggagalkan penulisan runtime baru ke jalur status legacy:

- `sessions.json`
- `*.trajectory.jsonl` kecuali keluaran support-bundle yang dimaterialisasi
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- berkas cache runtime `cache/*.json`
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
- inti memori `.dreams/events.jsonl`
- inti memori `.dreams/session-corpus/`
- inti memori `.dreams/daily-ingestion.json`
- inti memori `.dreams/session-ingestion.json`
- inti memori `.dreams/short-term-recall.json`
- inti memori `.dreams/phase-signals.json`
- inti memori `.dreams/short-term-promotion.lock`
- Lokakarya Skill `skill-workshop/<workspace>.json`
- Lokakarya Skill `skill-workshop/skill-workshop-review-*.json`
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
- berkas JSON pecahan registri sandbox
- berkas JSON bridge `/tmp` relai hook native
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
- Wiki Memori `.openclaw-wiki/log.jsonl`
- Wiki Memori `.openclaw-wiki/state.json`
- Wiki Memori `.openclaw-wiki/locks/`
- Wiki Memori `.openclaw-wiki/source-sync.json`
- Wiki Memori `.openclaw-wiki/import-runs/*.json`
- Wiki Memori `.openclaw-wiki/cache/agent-digest.json`
- Wiki Memori `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- dekorasi profil browser `.openclaw-profile-decorated`
- pembuka sesi berbasis berkas `SessionManager.open(...)`
- facade daftar transkrip `SessionManager.listAll(...)` dan `TranscriptSessionManager.listAll(...)`
- facade fork transkrip `SessionManager.forkFromSession(...)` dan
  `TranscriptSessionManager.forkFromSession(...)`
- facade penggantian sesi mutable `SessionManager.newSession(...)` dan `TranscriptSessionManager.newSession(...)`
- facade sesi cabang `SessionManager.createBranchedSession(...)` dan
  `TranscriptSessionManager.createBranchedSession(...)`

Larangan harus mengizinkan pengujian membuat fixture lama dan mengizinkan kode migrasi
membaca/mengimpor/menghapus sumber berkas lama. Sidecar SQLite yang belum dirilis tetap dilarang
dan tidak mendapatkan kelonggaran impor doctor.

## Kriteria Selesai

- Penulisan data runtime dan cache masuk ke database SQLite global atau agen.
- Runtime tidak lagi menulis indeks sesi, JSONL transkrip, JSON registri sandbox,
  SQLite sidecar tugas, atau SQLite sidecar plugin-state. Pengimpor SQLite sidecar tugas
  dan plugin-state yang belum dirilis dihapus.
- Impor berkas lama hanya melalui doctor.
- Backup menghasilkan satu arsip dengan snapshot SQLite ringkas dan bukti integritas.
- Worker agen dapat berjalan dengan disk, scratch VFS, atau penyimpanan eksperimental
  khusus VFS.
- Berkas konfigurasi dan kredensial eksplisit tetap menjadi satu-satunya berkas kontrol
  non-database persisten yang diharapkan.
- Pemeriksaan repo mencegah diperkenalkannya kembali penyimpanan berkas runtime lama.
