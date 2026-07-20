---
read_when:
    - Memindahkan data runtime, cache, transkrip, status tugas, atau file sementara OpenClaw ke SQLite
    - Merancang migrasi doctor dari file JSON atau JSONL lama
    - Mengubah perilaku pencadangan, pemulihan, VFS, atau penyimpanan worker
    - Menghapus kunci sesi, pemangkasan, pemotongan, atau jalur kompatibilitas JSON
summary: Rencana migrasi untuk menjadikan SQLite sebagai lapisan utama bagi status persisten dan cache, sekaligus mempertahankan konfigurasi berbasis berkas
title: Refaktor status yang mengutamakan basis data
x-i18n:
    generated_at: "2026-07-20T03:54:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e4ce692df8bfd031429b466166ce05d70ad0514a6628d9b3a69bf694c18a5914
    source_path: refactor/database-first.md
    workflow: 16
---

# Refaktor Status yang Mengutamakan Database

## Keputusan

Gunakan tata letak SQLite dua tingkat:

- Database global: `~/.openclaw/state/openclaw.sqlite`
- Database agen: satu database SQLite per agen untuk ruang kerja milik agen,
  transkrip, VFS, artefak, dan status runtime per agen berukuran besar
- Konfigurasi tetap didukung oleh file: `openclaw.json` tetap berada di luar
  database. Profil autentikasi runtime dipindahkan ke SQLite; file kredensial
  penyedia eksternal atau CLI tetap dikelola oleh pemilik di luar database OpenClaw.

Database global adalah database bidang kontrol. Database ini memiliki penemuan agen,
status Gateway bersama, pemasangan, status perangkat/Node, buku besar tugas dan alur,
status Plugin, status runtime penjadwal, metadata cadangan, dan status migrasi.

Database agen adalah database bidang data. Database ini memiliki metadata sesi agen,
aliran peristiwa transkrip, ruang kerja VFS atau namespace sementara, artefak alat,
artefak proses, serta data cache lokal agen yang dapat dicari/diindeks.

Ini memberikan satu tampilan global yang tahan lama tanpa memaksakan ruang kerja agen
berukuran besar, transkrip, dan data sementara biner ke jalur penulisan Gateway bersama.

## Kontrak Ketat

Migrasi ini memiliki satu bentuk runtime kanonis:

- Baris sesi hanya menyimpan metadata sesi. Baris tersebut tidak boleh menyimpan
  `transcriptLocator`, jalur file transkrip, jalur JSONL saudara, jalur penguncian,
  metadata pemangkasan, atau penunjuk kompatibilitas era file.
- Identitas transkrip selalu merupakan identitas SQLite: `{agentId, sessionId}` ditambah
  metadata topik opsional jika protokol membutuhkannya.
- `sqlite-transcript://...` bukan identitas runtime atau protokol. Kode baru tidak boleh
  memperoleh, menyimpan, meneruskan, mengurai, atau memigrasikan pencari lokasi transkrip.
  Runtime dan pengujian sama sekali tidak boleh memuat pencari lokasi semu; dokumentasi
  hanya boleh menyebutkan string tersebut untuk melarangnya.
- `sessions.json` lama, JSONL transkrip, `.jsonl.lock`, pemangkasan, pemotongan,
  dan logika jalur sesi lama hanya termasuk dalam jalur migrasi/impor doctor.
- Alias konfigurasi sesi lama hanya termasuk dalam migrasi doctor. Runtime tidak
  menafsirkan `session.idleMinutes`, `session.resetByType.dm`, atau
  alias sesi utama `agent:main:*` lintas agen untuk agen terkonfigurasi lainnya.
- Identitas perutean sesi adalah status relasional bertipe. Jalur runtime aktif dan UI
  harus membaca `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations`, dan
  `session_conversations`; jalur tersebut tidak boleh mengurai `session_key` atau menggali
  `session_entries.entry_json` untuk identitas penyedia, kecuali sebagai bayangan
  kompatibilitas selama situs panggilan lama sedang dihapus.
- Penanda pesan langsung tingkat kanal seperti `dm` dibandingkan dengan `direct` merupakan
  kosakata perutean, bukan pencari lokasi transkrip atau handel kompatibilitas penyimpanan file.
- Konfigurasi penangan hook lama hanya termasuk dalam permukaan peringatan/migrasi doctor.
  Runtime tidak boleh memuat `hooks.internal.handlers`; hook hanya dijalankan melalui
  direktori hook yang ditemukan dan metadata `HOOK.md`.
- Startup runtime, jalur balasan aktif, Compaction, pengaturan ulang, pemulihan,
  diagnostik, TTS, hook memori, subagen, perutean perintah Plugin, batas protokol,
  dan hook harus meneruskan `{agentId, sessionId}` melalui runtime.
- Pengujian harus menyemai dan memeriksa baris transkrip SQLite melalui
  `{agentId, sessionId}`. Pengujian yang hanya membuktikan penerusan jalur JSONL,
  preservasi pencari lokasi yang diberikan pemanggil, atau kompatibilitas file transkrip
  harus dihapus kecuali mencakup impor doctor, materialisasi materi dukungan/debug
  non-sesi, atau bentuk protokol.
- `runEmbeddedPiAgent(...)`, proses pekerja yang disiapkan, dan upaya tertanam
  bagian dalam tidak boleh menerima pencari lokasi transkrip. Semua itu membuka pengelola
  transkrip SQLite berdasarkan `{agentId, sessionId}` dan meneruskan pengelola tersebut ke sesi
  agen kompatibel PI yang diinternalisasi, sehingga pemanggil usang tidak dapat membuat
  runner menulis transkrip JSON/JSONL.
- Diagnostik runner harus menyimpan catatan pelacakan runtime/cache/payload di SQLite.
  Diagnostik runtime tidak boleh mengekspos kenop penggantian file JSONL atau pembantu
  ekspor JSONL transkrip generik; ekspor yang ditampilkan kepada pengguna dapat
  mematerialisasi artefak eksplisit dari baris database tanpa memasukkan kembali
  nama file ke runtime.
- Pencatatan aliran mentah menggunakan `OPENCLAW_RAW_STREAM=1` ditambah baris diagnostik SQLite.
  Kontrak pencatat file pi-mono lama `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH`, dan
  `raw-openai-completions.jsonl` bukan bagian dari runtime atau pengujian OpenClaw.
- Pengindeksan memori QMD tidak boleh mengekspor transkrip SQLite ke file markdown.
  QMD hanya mengindeks file memori yang dikonfigurasi; pencarian transkrip sesi tetap
  didukung SQLite.
- Subjalur SDK QMD hanya untuk QMD dalam kode baru. Pembantu pengindeksan transkrip
  sesi SQLite berada di `memory-core-host-engine-session-transcripts`; setiap ekspor ulang QMD
  hanya untuk kompatibilitas dan tidak boleh digunakan oleh kode runtime.
- Indeks memori bawaan berada dalam database agen pemiliknya. Konfigurasi runtime dan
  kontrak runtime yang diselesaikan tidak boleh mengekspos `memorySearch.store.path`; doctor
  menghapus kunci konfigurasi lama tersebut dan kode saat ini meneruskan
  `databasePath` agen secara internal.

Pekerjaan implementasi harus terus menghapus kode hingga pernyataan-pernyataan ini benar
tanpa pengecualian di luar batas doctor/impor/ekspor/debug.

## Status sasaran dan kemajuan

### Sasaran ketat

- Satu database SQLite global memiliki status bidang kontrol:
  `state/openclaw.sqlite`.
- Satu database SQLite per agen memiliki status bidang data:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Konfigurasi tetap didukung oleh file. `openclaw.json` bukan bagian dari refaktor
  database ini.
- File lama hanya merupakan masukan migrasi doctor.
- Runtime tidak pernah menulis atau membaca JSONL sesi atau transkrip sebagai status aktif.

### Status sasaran

- `not-started`: kode runtime era file masih menulis status aktif.
- `migrating`: kode doctor/impor dapat memindahkan data file ke SQLite.
- `dual-read`: jembatan sementara membaca SQLite dan file lama. Status ini
  dilarang untuk refaktor ini kecuali secara eksplisit didokumentasikan sebagai
  khusus doctor.
- `sqlite-runtime`: runtime hanya membaca dan menulis SQLite.
- `clean`: API dan pengujian runtime lama dihapus, dan pelindung mencegah
  regresi.
- `done`: dokumentasi, pengujian, pencadangan, migrasi doctor, dan pemeriksaan
  perubahan membuktikan status bersih.

### Status saat ini

- Sesi: `clean` untuk runtime. Baris sesi berada dalam database per agen,
  API runtime menggunakan `{agentId, sessionId}` atau `{agentId, sessionKey}`, dan
  `sessions.json` adalah masukan lama khusus doctor.
- Transkrip: `clean` untuk runtime. Peristiwa transkrip, identitas, snapshot,
  dan peristiwa runtime lintasan berada dalam database per agen. Runtime tidak lagi
  menerima pencari lokasi transkrip atau jalur transkrip JSONL.
- Runner tertanam PI: `clean`. Proses PI tertanam, pekerja yang disiapkan, Compaction,
  dan perulangan percobaan ulang menggunakan cakupan sesi SQLite dan menolak handel transkrip usang.
- Cron: `clean` untuk runtime. Runtime menggunakan `cron_jobs` dan `task_runs` milik Cron;
  pengujian runtime menggunakan penamaan `storeKey` SQLite, dan jalur Cron era file tetap
  hanya berada dalam pengujian migrasi lama doctor.
- Registri tugas: `clean`. Baris runtime tugas dan TaskFlow berada dalam
  `state/openclaw.sqlite`; pengimpor SQLite sidecar yang belum dirilis telah dihapus.
- Status Plugin: `clean`. Baris status/blob Plugin berada dalam database global
  bersama; pembantu SQLite sidecar status Plugin lama dilindungi agar tidak digunakan.
- Memori: `sqlite-runtime` untuk memori bawaan dan pengindeksan transkrip sesi.
  Tabel indeks memori berada dalam database per agen, status memori Plugin menggunakan
  baris status Plugin bersama, dan file memori lama merupakan masukan migrasi doctor
  atau konten ruang kerja pengguna.
- Cadangan: `sqlite-runtime`. Pencadangan menyiapkan snapshot SQLite yang dipadatkan, menghilangkan
  sidecar WAL/SHM aktif, memverifikasi integritas SQLite, dan mencatat proses pencadangan
  dalam database global.
- Penyiapan ruang kerja: `sqlite-runtime`. Penyelesaian penyiapan, pengesahan ruang kerja,
  dan hash bootstrap yang dihasilkan berada dalam tabel SQLite bersama yang bertipe. Runtime
  tidak membaca atau menulis JSON ruang kerja yang telah dihentikan dan sidecar `.attested`;
  Doctor memiliki impor tervalidasi dan penghapusannya yang terverifikasi.
- Migrasi doctor: `migrating`, secara sengaja. Doctor mengimpor penyimpanan JSON,
  JSONL, dan sidecar yang telah dihentikan ke SQLite, mencatat proses/sumber migrasi,
  dan menghapus sumber yang berhasil.
- Persetujuan eksekusi: `file-runtime`. TypeScript dan macOS masih membaca dan menulis
  `exec-approvals.json` milik direktori status aktif; skema
  `exec_approvals_config` yang dicadangkan belum memiliki pemilik runtime. Peralihan mendatang harus
  menambahkan impor doctor dengan status yang sama dan memindahkan kedua runtime bersamaan.
- Skrip E2E: `clean` untuk cakupan runtime. Penyemaian MCP Docker menulis baris SQLite.
  Skrip Docker konteks runtime membuat JSONL lama hanya di dalam benih migrasi doctor
  dan menamai jalur indeks sesi lama secara eksplisit.

### Pekerjaan tersisa

- [x] Ganti nama variabel penyimpanan pengujian runtime Cron agar tidak lagi menggunakan `storePath`, kecuali
      variabel tersebut merupakan masukan lama doctor.
      File: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Bukti: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Hapus atau ganti nama tiruan pengujian ekspor era file yang usang.
      File: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Bukti: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Pastikan benih JSONL lama konteks runtime Docker jelas hanya untuk doctor.
      File: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Bukti: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` hanya menampilkan
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Jaga agar tipe yang dihasilkan Kysely tetap selaras setelah perubahan skema apa pun.
      File: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Bukti: tidak ada perubahan skema dalam tahap ini; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Jalankan ulang pengujian terfokus untuk penyimpanan, perintah, dan skrip yang disentuh.
      Bukti: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-session.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Sebelum mendeklarasikan `done`, jalankan gerbang perubahan atau pembuktian luas jarak jauh.
      Bukti: `pnpm check:changed --timed -- <changed extension paths>` berhasil pada
      proses Hetzner Crabbox `run_3f1cabf6b25c` setelah penyiapan sementara Node 24/pnpm dan
      perutean jalur eksplisit untuk ruang kerja tersinkronisasi tanpa `.git`.

### Jangan menyebabkan regresi

- Tidak ada pencari lokasi transkrip.
- Tidak ada file sesi aktif.
- Tidak ada fixture pengujian JSONL palsu kecuali pengujian migrasi lama doctor.
- Tidak ada akses SQLite mentah saat Kysely diharapkan.
- Tidak ada migrasi DB era file baru. Skema global tetap pada versi `1`.
  Skema versi per agen `1` yang dirilis memiliki satu migrasi runtime terbatas ke
  versi `2` untuk identitas sumber memori yang stabil.

## Asumsi Pembacaan Kode

Tidak ada keputusan produk tindak lanjut yang menghambat rencana ini. Implementasi harus
dilanjutkan dengan asumsi berikut:

- Gunakan `node:sqlite` secara langsung dan wajibkan runtime Node yang aman terhadap reset WAL
  (22.22.3+, 24.15+, atau 25.9+) untuk jalur penyimpanan ini.
- Pertahankan tepat satu file konfigurasi normal. Jangan pindahkan konfigurasi, manifes
  plugin, atau ruang kerja Git ke SQLite dalam refaktor ini.
- File kompatibilitas runtime tidak diperlukan. File JSON dan JSONL lama hanya
  merupakan masukan migrasi. Sidecar SQLite lokal cabang tidak pernah dirilis dan
  dihapus alih-alih diimpor.
- `openclaw doctor --fix` memiliki migrasi file lama ke basis data. Proses mulai
  runtime hanya memiliki peningkatan terbatas antarversi skema SQLite yang telah dirilis;
  proses tersebut tidak boleh mengimpor status dari era file.
- Kompatibilitas kredensial mengikuti aturan yang sama: kredensial runtime berada di
  SQLite. File `auth-profiles.json` lama, `auth.json` per agen, dan
  `credentials/oauth.json` bersama merupakan masukan migrasi doctor, lalu dihapus
  setelah diimpor.
- Status katalog model yang dihasilkan didukung oleh basis data. Kode runtime tidak boleh menulis
  `agents/<agentId>/agent/models.json`; file `models.json` yang ada merupakan masukan
  doctor lama dan dihapus setelah diimpor ke `agent_model_catalogs`.
- Runtime tidak boleh memigrasikan, menormalisasi, atau menjembatani pencari transkrip. Identitas
  transkrip aktif adalah `{agentId, sessionId}` di SQLite. Jalur file hanya
  merupakan masukan doctor lama, dan `sqlite-transcript://...` harus dihilangkan dari
  permukaan runtime, protokol, hook, dan plugin, bukan diperlakukan sebagai
  pegangan batas.
- Pembacaan transkrip SQLite saat runtime tidak menjalankan migrasi bentuk entri JSONL lama atau
  menulis ulang seluruh transkrip demi kompatibilitas. Normalisasi entri lama tetap berada di
  utilitas doctor/impor yang eksplisit. Doctor menormalisasi file transkrip JSONL
  lama sebelum menyisipkan baris SQLite; baris runtime saat ini
  sudah ditulis dalam skema transkrip saat ini. Ekspor lintasan/sesi
  membaca baris tersebut apa adanya dan tidak boleh melakukan migrasi lama pada waktu ekspor.
- Pembantu penguraian/migrasi JSONL transkrip lama hanya untuk doctor. Kode format
  transkrip runtime hanya membangun konteks transkrip SQLite saat ini; doctor
  memiliki peningkatan entri JSONL lama sebelum menyisipkan baris.
- Pembantu streaming transkrip JSONL lama yang dimiliki runtime telah dihapus. Kode
  impor doctor memiliki pembacaan file lama yang eksplisit; riwayat sesi runtime membaca
  baris SQLite.
- Binding app-server Codex menggunakan `sessionId` OpenClaw sebagai kunci
  kanonis dalam namespace status plugin Codex. `sessionKey` adalah metadata untuk
  perutean/tampilan dan tidak boleh menggantikan ID sesi persisten atau menghidupkan kembali
  identitas file transkrip.
- Mesin konteks menerima kontrak runtime saat ini secara langsung. Registri
  tidak boleh membungkus mesin dengan shim percobaan ulang yang menghapus `sessionKey`,
  `transcriptScope`, atau `prompt`; mesin yang tidak dapat menerima parameter
  database-first saat ini harus gagal secara jelas alih-alih dijembatani.
- Keluaran cadangan harus tetap berupa satu file arsip. Isi basis data harus masuk
  ke arsip tersebut sebagai snapshot SQLite yang ringkas, bukan sidecar WAL aktif mentah.
- Pencarian transkrip berguna, tetapi tidak diwajibkan untuk tahap database-first
  pertama. Rancang skema agar FTS dapat ditambahkan nanti.
- Eksekusi worker harus tetap eksperimental di balik pengaturan selama batas basis data
  dimatangkan.

## Temuan Pembacaan Kode

Cabang saat ini sudah melewati tahap pembuktian konsep. Basis data bersama
sudah tersedia, `node:sqlite` Node telah dihubungkan melalui pembantu runtime kecil, dan
penyimpanan sebelumnya kini menulis ke `state/openclaw.sqlite` atau basis data
`openclaw-agent.sqlite` pemiliknya.

Pekerjaan yang tersisa bukan memilih SQLite, melainkan menjaga kebersihan batas baru
dan menghapus antarmuka berbentuk kompatibilitas yang masih menyerupai dunia
file lama:

- `storePath` sesi tidak lagi menjadi identitas runtime, bentuk fixture pengujian, atau
  bidang payload status. Pengujian runtime dan jembatan tidak lagi memuat
  nama kontrak `storePath`; kode doctor/migrasi memiliki kosakata lama tersebut.
- Penulisan sesi tidak lagi melewati antrean `store-writer.ts` dalam proses
  yang lama. Penulisan patch SQLite melakukan persiapan di luar transaksi, lalu menggunakan
  transaksi validasi/penerapan sinkron singkat dengan deteksi konflik eksplisit.
- Penemuan jalur lama masih memiliki kegunaan migrasi yang valid, tetapi kode runtime harus
  berhenti memperlakukan `sessions.json` dan file JSONL transkrip sebagai kemungkinan target
  penulisan.
- Tabel milik agen berada dalam basis data SQLite per agen. DB global menyimpan
  baris registri/control-plane; identitas transkrip adalah `{agentId, sessionId}` dalam
  baris transkrip per agen. Kode runtime tidak boleh menyimpan jalur file transkrip
  atau memigrasikan pencari transkrip.
- Doctor sudah mengimpor beberapa file lama. Pembersihannya adalah menjadikannya
  satu implementasi migrasi eksplisit yang dipanggil doctor, dengan laporan migrasi
  persisten.

Tidak ada pertanyaan produk tambahan yang menghambat implementasi.

## Bentuk Kode Saat Ini

Cabang tersebut sudah memiliki basis SQLite bersama yang nyata:

- Versi minimum runtime kini memerlukan build Node yang aman terhadap reset WAL: 22.22.3+,
  24.15+, atau 25.9+. `package.json`, penjaga runtime CLI, nilai default penginstal,
  pencari lokasi runtime macOS, CI, dan dokumentasi instalasi publik semuanya selaras.
- `src/state/openclaw-state-db.ts` membuka `openclaw.sqlite`, menetapkan WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON`, dan menerapkan
  modul skema yang dihasilkan dan diturunkan dari
  `src/state/openclaw-state-schema.sql`.
- Tipe tabel Kysely dan modul skema runtime dihasilkan dari basis data
  SQLite sekali pakai yang dibuat dari file `.sql` yang telah di-commit; kode runtime tidak
  lagi menyimpan string skema hasil salin-tempel untuk basis data global, per agen, atau
  penangkapan proksi.
- Penyimpanan runtime menurunkan tipe baris yang dipilih dan disisipkan dari
  antarmuka Kysely `DB` yang dihasilkan tersebut, alih-alih menduplikasi bentuk baris SQLite secara manual. SQL mentah
  tetap dibatasi pada penerapan skema, pragma, dan DDL khusus migrasi.
- Skema SQLite global tetap pada `user_version = 1`. Skema per agen
  berada pada versi `2`; pembukanya secara atomik memigrasikan kunci sumber memori
  versi `1` yang telah dirilis menjadi identitas bilangan bulat yang stabil. Impor dari file ke basis data
  tetap berada dalam kode doctor.
- Kepemilikan relasional diterapkan saat batas kepemilikan bersifat kanonis:
  baris migrasi sumber dihapus secara kaskade dari `migration_runs`, status pengiriman tugas
  dihapus secara kaskade dari `task_runs`, dan baris identitas transkrip dihapus secara kaskade dari
  peristiwa transkrip.
- Tabel bersama saat ini mencakup `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `workspace_path_aliases`, `workspace_attestations`,
  `workspace_generated_bootstrap_hashes`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs`, dan `backup_runs`.
- Status arbitrer milik plugin tidak mendapatkan tabel bertipe milik host. Plugin yang
  terinstal menggunakan `plugin_state_entries` untuk muatan JSON berversi dan
  `plugin_blob_entries` untuk bita, dengan kepemilikan namespace/kunci, pembersihan TTL,
  pencadangan, dan catatan migrasi plugin. Status orkestrasi plugin milik host masih
  dapat memiliki tabel bertipe ketika host memiliki kontrak kueri, seperti
  `plugin_binding_approvals`.
- Migrasi plugin adalah migrasi data pada namespace milik plugin, bukan migrasi
  skema host. Plugin dapat memigrasikan entri status/blob berversi miliknya sendiri
  melalui penyedia migrasi, dan host mencatat status sumber/proses dalam
  buku besar migrasi normal. Instalasi plugin baru tidak memerlukan perubahan
  `openclaw-state-schema.sql`, kecuali host itu sendiri mengambil alih kepemilikan
  kontrak lintas-plugin baru.
- `src/state/openclaw-agent-db.ts` membuka
  `agents/<agentId>/agent/openclaw-agent.sqlite`, mendaftarkan basis data dalam
  DB global, dan memiliki tabel sesi lokal agen, transkrip, VFS, artefak, cache,
  dan indeks memori. Penemuan runtime bersama kini membaca registri
  `agent_databases` bertipe hasil pembuatan, alih-alih mengimplementasikan ulang kueri tersebut di setiap
  lokasi pemanggilan.
- Basis data global dan per agen mencatat baris `schema_meta` dengan peran basis data,
  versi skema, stempel waktu, dan id agen untuk basis data agen. DB global
  tetap pada `user_version = 1`; DB per agen menggunakan versi `2` setelah migrasi
  terbatas identitas sumber memori.
- Identitas sesi per agen kini memiliki tabel akar kanonis `sessions` dengan kunci
  `session_id`, serta `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, stempel waktu, kolom tampilan, metadata model,
  id harness, dan tautan induk/spawn sebagai kolom yang dapat dikueri. `session_routes`
  adalah indeks rute aktif unik dari `session_key` ke
  `session_id` saat ini, sehingga kunci rute dapat berpindah ke sesi tahan lama yang baru tanpa
  membuat pembacaan cepat harus memilih di antara baris `sessions.session_key` duplikat. Muatan lama
  berbentuk kompatibilitas `session_entries.entry_json` bergantung pada
  akar tahan lama `session_id` melalui kunci asing; muatan tersebut bukan lagi satu-satunya
  representasi sesi pada tingkat skema.
- Identitas percakapan eksternal per agen juga bersifat relasional:
  `conversations` menyimpan identitas penyedia/akun/percakapan yang dinormalisasi, dan
  `session_conversations` menautkan satu sesi OpenClaw ke satu atau beberapa
  percakapan eksternal. Ini mencakup sesi DM utama bersama, tempat beberapa rekan dapat
  secara sengaja dipetakan ke satu sesi tanpa memberikan data palsu dalam `session_key`. SQLite juga
  menerapkan keunikan untuk identitas alami penyedia agar tuple
  kanal/akun/jenis/rekan/utas yang sama tidak dapat bercabang ke beberapa id percakapan.
  Rekan langsung utama bersama ditautkan dengan peran `participant`, sehingga satu
  sesi OpenClaw dapat mewakili beberapa rekan DM eksternal tanpa menurunkan
  rekan lama menjadi baris terkait yang samar. `sessions.primary_conversation_id` tetap
  menunjuk ke target pengiriman bertipe saat ini. Kolom perutean/status tertutup
  diterapkan dengan batasan `CHECK` SQLite, alih-alih hanya mengandalkan
  union TypeScript.
  Proyeksi sesi runtime menghapus bayangan perutean kompatibilitas dari
  `session_entries.entry_json` sebelum menerapkan kolom sesi/percakapan
  bertipe, sehingga muatan JSON usang tidak dapat menghidupkan kembali target pengiriman.
  Perutean pengumuman subagen juga memerlukan konteks pengiriman SQLite bertipe;
  perutean tersebut tidak lagi kembali menggunakan kolom rute kompatibilitas `SessionEntry`.
  Pewarisan pengiriman eksplisit `chat.send` Gateway membaca konteks pengiriman SQLite
  bertipe, alih-alih kolom kompatibilitas `origin`/`last*`.
  `tools.effective` juga menurunkan konteks penyedia/akun/utas dari baris
  pengiriman/perutean SQLite bertipe, bukan bayangan entri sesi `last*` yang usang.
  Konteks prompt peristiwa sistem membangun ulang kolom kanal/tujuan/akun/utas dari
  kolom pengiriman bertipe, alih-alih bayangan `origin`.
  Pembantu bersama `deliveryContextFromSession` dan pemeta sesi-ke-percakapan
  kini sepenuhnya mengabaikan `SessionEntry.origin`; hanya kolom pengiriman bertipe
  dan baris percakapan relasional yang dapat membuat identitas rute cepat.
  Normalisasi entri sesi runtime menghapus `origin` sebelum menyimpan atau
  memproyeksikan `entry_json`, dan penulisan metadata masuk menulis kolom kanal/obrolan
  bertipe serta baris percakapan relasional, alih-alih membuat bayangan asal
  baru.
- Peristiwa transkrip, snapshot transkrip, dan peristiwa runtime trajektori kini
  merujuk akar per agen kanonis `sessions` dan dihapus secara kaskade saat sesi
  dihapus. Baris identitas/idempotensi transkrip tetap dihapus secara kaskade dari
  baris peristiwa transkrip yang tepat.
- Indeks memory-core kini menggunakan tabel basis data agen eksplisit
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks`, dan
  `memory_embedding_cache`, dengan `memory_index_state` yang melacak perubahan revisi.
  Indeks samping FTS/vektor opsional diberi nama `memory_index_chunks_fts` dan
  `memory_index_chunks_vec`, alih-alih tabel generik `meta`, `files`, `chunks`,
  `chunks_fts`, atau `chunks_vec`. Nama kanonis mempertahankan bentuk baris
  jalur/sumber saat ini dan kompatibilitas embedding berseri. Tabel ini
  adalah cache turunan/pencarian, bukan penyimpanan transkrip kanonis; tabel tersebut dapat
  dihapus dan dibangun ulang dari file ruang kerja memori dan sumber yang dikonfigurasi.
  Membuka indeks memori bernama generik yang telah dirilis akan memigrasikan metadata, sumber,
  potongan, dan cache embedding-nya ke tabel kanonis; tabel FTS/vektor
  turunan dibangun ulang dengan nama kanonisnya.
- Status pemulihan proses subagen kini berada dalam baris bersama bertipe `subagent_runs`
  dengan kunci sesi turunan, peminta, dan pengendali yang diindeks. File
  `subagents/runs.json` lama hanya menjadi masukan pembersihan Doctor. Entri prosesnya merupakan
  status pemulihan sementara, sehingga Doctor mencatat tanda terima penghentian dan
  membuang file tersebut tanpa mengimpornya. Karena sebuah file tidak dapat membuktikan apakah
  entrinya masih aktif atau usang setelah baris SQLite dipangkas, operator
  harus membiarkan proses aktif era file selesai sebelum meningkatkan versi melewati batas ini.
- Pengikatan percakapan saat ini kini berada dalam baris bersama bertipe
  `current_conversation_bindings` dengan kunci id percakapan yang dinormalisasi, serta
  kolom agen/sesi target, jenis percakapan, status, kedaluwarsa, dan metadata
  yang disimpan sebagai kolom relasional, alih-alih catatan pengikatan buram yang diduplikasi.
  Kunci pengikatan tahan lama menyertakan jenis percakapan yang dinormalisasi agar
  referensi langsung/grup/kanal tidak bertabrakan, dan SQLite menolak nilai jenis/status
  pengikatan yang tidak valid. File lama
  `bindings/current-conversations.json` hanya menjadi masukan migrasi doctor.
- Pemulihan antrean pengiriman kini menindihkan kolom antrean bertipe untuk kanal, target,
  akun, sesi, percobaan ulang, kesalahan, pengiriman platform, dan status pemulihan pada
  JSON pemutaran ulang. `entry_json` mempertahankan muatan pemutaran ulang, hook, dan muatan
  pemformatan, tetapi kolom bertipe menjadi sumber otoritatif untuk perutean/status antrean cepat.
- Penunjuk pemulihan sesi terakhir TUI kini berada dalam baris bersama bertipe
  `tui_last_sessions` dengan kunci cakupan koneksi/sesi TUI yang di-hash.
  Runtime hanya membaca dan menulis SQLite, melakukan upsert pada setiap cakupan secara atomik, dan
  mengecualikan sesi heartbeat. `openclaw doctor --fix` memvalidasi secara ketat
  file JSON TUI lama, mempertahankan baris SQLite yang lebih baru, memverifikasi hasil kanonis,
  dan menghapus file lama yang tidak berubah, alih-alih meninggalkan arsip.
- Hash penerapan perintah Discord kini berada dalam penyimpanan SQLite status plugin
  bersama. Runtime hanya membaca dan menulis kunci persis yang tercakup pada aplikasi. Doctor
  menghapus file lama `discord/command-deploy-cache.json` yang dapat dibangun ulang
  tanpa mengimpornya, sehingga proses mulai berikutnya menjalankan satu rekonsiliasi kanonis.
- Preferensi TTS default kini berada dalam baris SQLite status plugin bersama dengan kunci di bawah
  plugin `speech-core`. File lama `settings/tts.json` hanya menjadi masukan migrasi
  doctor; runtime tidak lagi membaca atau menulis file JSON preferensi TTS, dan
  resolver jalur lama berada dalam modul migrasi doctor.
- Metadata target rahasia kini merujuk pada penyimpanan, alih-alih berpura-pura bahwa setiap
  target kredensial adalah file konfigurasi. `openclaw.json` tetap menjadi penyimpanan konfigurasi;
  target profil autentikasi menggunakan baris SQLite bertipe `auth_profile_stores` dengan
  kredensial berbentuk penyedia yang disimpan sebagai muatan JSON.
- Audit rahasia tidak lagi memindai file per agen `auth.json` yang telah dihentikan. Doctor bertanggung jawab
  memperingatkan tentang, mengimpor, dan menghapus file lama tersebut.
- Pembantu jalur profil autentikasi lama kini berada dalam kode lama doctor. Pembantu jalur
  profil autentikasi inti mengekspos identitas penyimpanan autentikasi SQLite dan lokasi tampilan,
  bukan jalur runtime `auth-profiles.json` atau `auth-state.json`.
- Modul runtime pemulihan proses subagen dan cache kapabilitas model OpenRouter
  kini memisahkan pembaca/penulis snapshot SQLite dari pembantu impor JSON lama
  khusus doctor. Kapabilitas OpenRouter menggunakan baris generik bertipe
  `model_capability_cache` di bawah `provider_id = "openrouter"`, alih-alih
  satu blob cache buram atau tabel host khusus penyedia. `taskName` proses subagen
  disimpan dalam kolom bertipe `subagent_runs.task_name`; salinan
  `payload_json` merupakan data pemutaran ulang/debug, bukan sumber untuk kolom tampilan atau
  pencarian cepat.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` mengimplementasikan VFS SQLite
  di atas tabel basis data agen `vfs_entries`. Pembacaan direktori, ekspor rekursif,
  penghapusan, dan penggantian nama menggunakan rentang prefiks `(namespace, path)` yang diindeks,
  alih-alih memindai seluruh namespace atau mengandalkan pencocokan jalur `LIKE`.
- `src/agents/runtime-worker.entry.ts` membuat VFS SQLite per proses, artefak alat,
  artefak proses, dan penyimpanan cache terbatas untuk worker.
- Penyelesaian bootstrap ruang kerja, kebaruan atestasi, dan hash bootstrap
  yang dihasilkan kini berada dalam baris bersama bertipe `workspace_setup_state`,
  `workspace_path_aliases`, `workspace_attestations`, dan
  `workspace_generated_bootstrap_hashes` yang dikunci berdasarkan identitas ruang kerja
  kanonis. Alias leksikal dan jalur nyata yang dipersistenkan menjaga perlindungan
  ruang kerja yang telah hilang tetap stabil setelah symlink yang dikonfigurasi menghilang;
  alias yang diarahkan ulang akan gagal secara tertutup. Runtime tidak lagi membaca atau menulis
  `openclaw-workspace-state.json`, `.openclaw/workspace-state.json`, `workspace-attestations/*.attested`
  direktori status, atau sidecar `<workspace>.attested` yang bersebelahan.
  `openclaw doctor --fix` memvalidasi dan mengklaim sumber lama,
  mengimpornya ke SQLite beserta tanda terima migrasi, memverifikasi baris
  kanonis, dan baru kemudian menghapus file yang diklaim.
- Skema bersama mencadangkan baris singleton `exec_approvals_config`, tetapi
  peralihan runtime masih tertunda. TypeScript dan aplikasi pendamping macOS masih menggunakan
  file JSON dengan cakupan status dan harus berpindah ke SQLite secara bersamaan.
- Identitas perangkat TypeScript kini menggunakan baris bertipe `device_identities`,
  dengan impor JSON lama khusus doctor tetap berada di luar pemilik runtime. Autentikasi perangkat
  masih didukung file sambil menunggu migrasi skema dan lintas-runtime yang terkoordinasi;
  `device_auth_tokens` tetap dicadangkan untuk tindak lanjut tersebut.
- Cache pertukaran token GitHub Copilot menggunakan tabel status Plugin SQLite bersama
  di bawah `github-copilot/token-cache/default`. Ini adalah status cache milik penyedia,
  sehingga sengaja tidak menambahkan tabel skema host.
- Compaction GitHub Copilot tidak lagi menulis sidecar ruang kerja
  `openclaw-compaction-*.json`. Harness memanggil RPC Compaction riwayat SDK untuk
  sesi SDK yang dilacak, dan OpenClaw menyimpan status sesi/transkrip yang tahan lama di
  SQLite, bukan dalam file penanda kompatibilitas.
- Runtime Swift bersama (`OpenClawKit`) menggunakan bentuk
  `state/openclaw.sqlite#table/device_identities` dan kunci baris yang sama untuk identitas
  perangkat. File lama kontainer Apple diimpor oleh pemilik migrasi Swift
  karena Doctor TypeScript tidak dapat mengakses kontainer tersebut. Autentikasi
  perangkat Swift tetap didukung file untuk tindak lanjut autentikasi terkoordinasi.
- Identitas perangkat Android dan autentikasi perangkat yang di-cache tetap menjadi penyimpanan lokal aplikasi. Keduanya
  memerlukan migrasi terpisah milik Android; klaim SQLite host tidak
  menjelaskan perilaku Android saat ini.
- Riwayat paket terbaru notifikasi Android menggunakan baris bertipe
  `android_notification_recent_packages`. Runtime tidak lagi memigrasikan atau
  membaca kunci CSV SharedPreferences lama.
- Pembuatan identitas perangkat gagal secara tertutup ketika `identity/device.json`
  lama ada, ketika baris identitas SQLite tidak valid, atau ketika penyimpanan identitas
  SQLite tidak dapat dibuka. Doctor terlebih dahulu mengimpor dan menghapus file tersebut, sehingga
  startup runtime tidak dapat secara diam-diam merotasi identitas pemasangan sebelum migrasi.
- Pemilihan identitas perangkat adalah kunci baris SQLite, bukan pencari lokasi file JSON. Pengujian
  dan pembantu Gateway meneruskan kunci identitas eksplisit; hanya migrasi doctor dan
  gerbang startup yang gagal secara tertutup yang mengetahui nama file `identity/device.json` yang telah dihentikan.
- Kompatibilitas pengaturan ulang sesi kini berada dalam migrasi konfigurasi doctor:
  `session.idleMinutes` dipindahkan ke `session.reset.idleMinutes`,
  `session.resetByType.dm` dipindahkan ke `session.resetByType.direct`, dan kebijakan
  pengaturan ulang runtime hanya membaca kunci pengaturan ulang kanonis.
- Kompatibilitas konfigurasi lama kini berada di bawah `src/commands/doctor/`. Validasi
  `readConfigFileSnapshot()` normal tidak mengimpor pendeteksi warisan doctor
  atau menganotasi masalah warisan; `runDoctorConfigPreflight()` menambahkan masalah tersebut untuk
  perbaikan/pelaporan doctor. Alur konfigurasi doctor mengimpor
  `src/commands/doctor/legacy-config.ts`, dan perbaikan ID profil OAuth lama berada
  di bawah
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Perintah selain doctor tidak menjalankan perbaikan konfigurasi lama secara otomatis. Misalnya,
  `openclaw update --channel` kini gagal pada konfigurasi lama yang tidak valid dan meminta
  pengguna menjalankan doctor, alih-alih mengimpor kode migrasi doctor secara diam-diam.
- Web push, APNs, Voice Wake, pemeriksaan pembaruan, dan kesehatan konfigurasi kini menggunakan tabel SQLite bersama bertipe
  untuk langganan, kunci VAPID, pendaftaran Node, baris pemicu,
  baris perutean, status notifikasi pembaruan, dan entri kesehatan konfigurasi, bukan
  blob JSON buram utuh. Penulisan Web Push dan APNs melakukan upsert hanya pada baris
  kunci utama yang terpengaruh; kesehatan konfigurasi direkonsiliasi berdasarkan jalur konfigurasi. Modul runtime
  keduanya tetap terpisah dari pembantu impor JSON lama khusus Doctor.
- Runtime APNs hanya membaca dan menulis `apns_registrations`. 
  `openclaw doctor --fix` eksplisit secara ketat mengimpor
  `push/apns-registrations.json` yang telah dihentikan, mempertahankan baris kanonis yang ada, memverifikasi
  transaksi, mencatat tanda terima, dan menghapus JSON yang memuat rahasia.
  Percobaan ulang yang didukung tanda terima hanya melakukan pembersihan, sementara
  `apns_registration_tombstones` mencakup pembatalan sebelum perbaikan pertama, sehingga
  izin relai atau token perangkat yang kedaluwarsa tidak dapat hidup kembali.
- Konfigurasi host Node kini menggunakan baris singleton bertipe dalam basis data SQLite bersama.
  Runtime gagal secara tertutup selama file `node.json` lama atau klaim yang terinterupsi
  masih ada; `openclaw doctor --fix` eksplisit secara ketat mengimpor dan menghapusnya
  sebelum penggunaan runtime normal.
- Pemasangan perangkat/Node, pemasangan kanal, daftar izin kanal, dan status bootstrap
  kini menggunakan baris SQLite bertipe, bukan blob JSON buram utuh. Persetujuan pengikatan
  Plugin dan status tugas Cron mengikuti pemisahan yang sama: modul runtime mengekspos
  operasi yang didukung SQLite dan pembantu snapshot netral, sementara penulisan snapshot
  pemasangan/bootstrap serta persetujuan pengikatan Plugin merekonsiliasi baris berdasarkan kunci utama,
  bukan mengosongkan tabel, sedangkan doctor mengimpor/menghapus file JSON lama melalui
  modul `src/commands/doctor/legacy/*`.
- Catatan Plugin yang terinstal kini berada dalam indeks Plugin terinstal SQLite.
  Pembacaan/penulisan konfigurasi runtime tidak lagi memigrasikan atau mempertahankan data
  konfigurasi buatan `plugins.installs` lama; doctor mengimpor bentuk konfigurasi lama tersebut
  ke SQLite sebelum penggunaan runtime normal.
- Snapshot pemulihan kredensial QQBot kini berada dalam status Plugin SQLite di bawah
  `qqbot/credential-backups`. Runtime tidak lagi menulis
  `qqbot/data/credential-backup*.json`; kontrak doctor QQBot mengimpor dan
  mengarsipkan file cadangan lama tersebut dari direktori status aktif.
- Perencanaan pemuatan ulang Gateway membandingkan snapshot indeks Plugin terinstal SQLite di bawah
  namespace perbedaan internal `installedPluginIndex.installRecords.*`. Keputusan
  pemuatan ulang runtime tidak lagi membungkus baris tersebut dalam objek konfigurasi
  `plugins.installs` palsu.
- Kredensial akun Matrix kini berada dalam status Plugin SQLite. Runtime hanya membaca
  penyimpanan kanonis tersebut; Doctor mengimpor, memverifikasi, dan mengarsipkan file
  `credentials/matrix/credentials*.json` yang telah dihentikan ketika akunnya dapat ditentukan.
- Modul runtime pemasangan inti dan Cron tidak lagi menggunakan pembuat jalur JSON lama.
  Pembantu SDK jalur pemasangan yang tidak digunakan lagi tetap menjadi kompatibilitas khusus migrasi;
  migrasi status doctor memiliki pembacaan dan impor filenya. Modul lama milik Doctor
  menyusun jalur sumber `pending.json`, `paired.json`, `bootstrap.json`, dan
  `cron/jobs.json` hanya untuk pengujian impor dan migrasi. Normalisasi bentuk tugas
  Cron lama dan impor riwayat JSONL berada di bawah
  `src/commands/doctor/cron/`; finalisasi riwayat SQLite lama berjalan saat
  basis data status dibuka.
- `src/commands/doctor/legacy/runtime-state.ts` mengimpor file status JSON lama,
  termasuk konfigurasi host Node, ke SQLite dari doctor. Pengimpor file lama baru
  tetap berada di bawah `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` mengimpor transkrip `sessions.json` dan
  `*.jsonl` lama secara langsung ke SQLite dan menghapus sumber yang berhasil diimpor. Ini
  tidak lagi menyiapkan transkrip lama tingkat akar melalui
  `agents/<agentId>/sessions/*.jsonl` atau membuat target JSONL kanonis sebelum
  impor.
- Pemeriksaan doctor untuk integritas status tidak lagi memindai direktori sesi lama atau
  menawarkan penghapusan JSONL yatim. File transkrip lama hanya menjadi masukan migrasi,
  dan langkah migrasi memiliki proses impor beserta penghapusan sumber.
- Impor registri sandbox lama berada di bawah
  `src/commands/doctor/legacy/sandbox-registry.ts`; pembacaan dan penulisan registri sandbox
  aktif tetap hanya menggunakan SQLite.
- Perbaikan kesehatan/impor transkrip sesi lama berada di bawah
  `src/commands/doctor/legacy/session-transcript-health.ts`; modul perintah runtime
  tidak lagi memuat penguraian transkrip JSONL atau kode perbaikan cabang aktif.

Sorotan konsolidasi/penghapusan yang telah diselesaikan:

- Status Plugin kini menggunakan basis data bersama `state/openclaw.sqlite`. Pengimpor sidecar `plugin-state/state.sqlite` lokal-cabang yang lama telah dihapus karena
  tata letak SQLite tersebut tidak pernah dirilis. Pembantu probe/pengujian melaporkan
  `databasePath` bersama alih-alih mengekspos jalur SQLite khusus status Plugin.
- Tabel runtime tugas dan Task Flow kini berada dalam basis data bersama
  `state/openclaw.sqlite`, bukan dalam `tasks/runs.sqlite` dan
  `tasks/flows/registry.sqlite`; pengimpor sidecar lama dihapus karena alasan
  tata letak yang belum dirilis yang sama.
- `src/config/sessions/store.ts` tidak lagi memerlukan `storePath` untuk metadata
  masuk, pembaruan rute, atau pembacaan waktu pembaruan. Persistensi perintah, pembersihan sesi CLI,
  kedalaman subagen, penggantian autentikasi, dan identitas sesi transkrip
  menggunakan API baris agen/sesi. Penulisan diterapkan sebagai tambalan baris SQLite
  dengan percobaan ulang saat terjadi konflik optimistis.
- Resolusi target sesi kini mengekspos target basis data per agen, bukan jalur lama
  `sessions.json`. Gateway bersama, metadata ACP, perbaikan rute oleh doctor, dan
  `openclaw sessions` menginventarisasi `agent_databases` beserta agen yang dikonfigurasi.
- Perutean sesi Gateway kini menggunakan `resolveGatewaySessionDatabaseTarget`; target
  yang dikembalikan membawa `databasePath` dan kandidat kunci baris SQLite,
  bukan jalur berkas penyimpanan sesi lama.
- Tipe runtime sesi saluran kini mengekspos `{agentId, sessionKey}` untuk
  pembacaan waktu pembaruan, metadata masuk, dan pembaruan rute terakhir. Tipe kompatibilitas
  `saveSessionStore(storePath, store)` yang lama telah dihapus.
- Permukaan sesi runtime Plugin, API ekstensi, dan SDK Plugin kini mengekspos
  pembantu baris sesi berbasis SQLite, bukan pembantu kompatibilitas
  seluruh penyimpanan/berkas sesi aktif. Ekspor kompatibilitas pustaka akar tetap tersedia
  hanya di luar SDK Plugin bagi pemanggil internal lama dan migrasi. Pembantu lama
  `resolveLegacySessionStorePath` telah dihapus; konstruksi jalur lama `sessions.json`
  kini hanya berada dalam migrasi dan fixture pengujian.
- `src/config/sessions/session-entries.sqlite.ts` kini menyimpan entri sesi kanonis
  dalam basis data per agen dan mendukung tambalan baca/upsert/hapus pada tingkat baris.
  Upsert/tambal/hapus saat runtime tidak lagi memindai variasi huruf besar-kecil atau
  memangkas kunci alias lama; doctor menangani kanonisasi. Pembantu impor JSON
  mandiri telah dihapus, dan migrasi menggabungkan baris yang lebih baru melalui upsert,
  bukan mengganti seluruh tabel sesi. Pembantu baca/daftar/muat publik
  memproyeksikan metadata sesi aktif dari baris `sessions` dan `conversations`
  bertipe; `entry_json` adalah bayangan kompatibilitas/debug dan dapat usang atau tidak valid
  tanpa menghilangkan identitas sesi bertipe atau konteks pengiriman.
- `src/config/sessions/delivery-info.ts` kini menyelesaikan konteks pengiriman dari
  baris per agen bertipe `sessions` + `conversations` + `session_conversations`.
  Ini tidak lagi merekonstruksi identitas pengiriman runtime dari
  `session_entries.entry_json`; baris percakapan bertipe yang tidak ada merupakan masalah
  migrasi/perbaikan doctor, bukan fallback runtime.
- Keputusan pengaturan ulang sesi tersimpan kini mengutamakan metadata bertipe `sessions.session_scope`,
  `sessions.chat_type`, dan `sessions.channel`. Penguraian `sessionKey`
  hanya dipertahankan untuk sufiks utas/topik eksplisit pada target perintah; klasifikasi
  pengaturan ulang grup versus langsung tidak lagi berasal dari bentuk kunci.
- Klasifikasi tampilan daftar/status sesi kini menggunakan metadata percakapan bertipe dan
  jenis sesi Gateway. Ini tidak lagi menganggap substring `:group:` atau `:channel:`
  di dalam `session_key` sebagai sumber kebenaran permanen untuk grup/langsung.
- Pemilihan kebijakan balasan senyap kini hanya menggunakan tipe percakapan eksplisit atau metadata
  permukaan. Ini tidak lagi menebak kebijakan langsung/grup dari
  substring `session_key`.
- Resolusi model tampilan sesi kini menerima id agen dari target basis data sesi
  SQLite, bukan memisahkannya dari `session_key`.
- Hidrasi target pengumuman antardua agen kini hanya menggunakan `sessions.list`
  `deliveryContext` bertipe. Ini tidak lagi memulihkan perutean saluran/akun/utas
  dari `origin` lama, bidang `last*` yang dicerminkan, atau bentuk `session_key`.
- Penolakan target utas `sessions_send` kini membaca metadata perutean SQLite
  bertipe. Ini tidak lagi menolak atau menerima target dengan mengurai sufiks utas
  dari kunci target.
- Validasi kebijakan alat bercakupan grup kini membaca perutean percakapan SQLite
  bertipe untuk sesi saat ini atau sesi yang dibuat. Ini tidak lagi memercayai identitas grup/saluran
  dengan mendekode `sessionKey`; id grup yang diberikan pemanggil dihapus ketika
  tidak ada baris sesi bertipe yang menjaminnya.
- Pencocokan penggantian model saluran kini menggunakan metadata percakapan grup dan induk
  yang eksplisit. Ini tidak lagi mendekode id percakapan induk dari
  `parentSessionKey`.
- Pewarisan penggantian model tersimpan kini memerlukan kunci sesi induk eksplisit
  dari konteks sesi bertipe. Ini tidak lagi memperoleh penggantian induk dari
  sufiks `:thread:` atau `:topic:` dalam `sessionKey`.
- Pembungkus info utas sesi lama dan pengurai utas Plugin yang dimuat telah dihapus;
  tidak ada kode runtime yang mengimpor `config/sessions/thread-info`.
- Pembantu percakapan saluran tidak lagi mengekspos jembatan penguraian
  kunci sesi lengkap. Inti masih menormalkan id percakapan mentah milik penyedia melalui
  `resolveSessionConversation(...)`, tetapi tidak merekonstruksi fakta rute
  dari `sessionKey`.
- Pengiriman penyelesaian, kebijakan pengiriman, dan pemeliharaan tugas tidak lagi memperoleh tipe
  percakapan dari bentuk `session_key`. Pengurai kunci tipe percakapan lama telah dihapus;
  jalur-jalur ini memerlukan metadata sesi bertipe, konteks pengiriman bertipe, atau
  kosakata target pengiriman eksplisit.
- Daftar/status sesi, diagnostik, pengikatan akun persetujuan, pemfilteran Heartbeat
  TUI, dan ringkasan penggunaan tidak lagi menggali `SessionEntry.origin` untuk
  perutean penyedia/akun/utas/tampilan. Satu-satunya pembacaan `origin`
  runtime yang tersisa adalah konsep non-sesi atau objek pengiriman giliran saat ini.
- Pencarian percakapan native untuk permintaan persetujuan kini membaca baris perutean sesi
  per agen bertipe. Ini tidak lagi mengurai identitas percakapan saluran/grup/utas
  dari `sessionKey`; metadata bertipe yang tidak ada merupakan masalah migrasi/perbaikan.
- Payload peristiwa perubahan sesi/percakapan/sesi Gateway tidak lagi menggemakan
  bayangan rute `SessionEntry.origin` atau `last*`; klien menerima
  `channel`, `chatType`, dan `deliveryContext` bertipe.
- Resolusi pengiriman Heartbeat kini dapat menerima `deliveryContext`
  SQLite bertipe secara langsung, dan runtime Heartbeat meneruskan baris pengiriman sesi
  per agen alih-alih bergantung pada bayangan kompatibilitas `session_entries`
  untuk perutean saat ini.
- Resolusi target pengiriman agen terisolasi Cron juga menghidrasi rute saat ini
  dari baris pengiriman sesi per agen bertipe sebelum melakukan fallback ke
  payload entri kompatibilitas.
- Resolusi asal pengumuman subagen kini meneruskan konteks pengiriman sesi peminta
  bertipe melalui `loadRequesterSessionEntry` dan mengutamakan baris tersebut dibandingkan
  bayangan kompatibilitas `last*`/`deliveryContext`.
- Pembaruan metadata sesi masuk kini terlebih dahulu menggabungkan dengan baris pengiriman
  per agen bertipe; bidang pengiriman `SessionEntry` lama hanya menjadi fallback
  ketika tidak ada baris percakapan bertipe.
- Ekstraksi pengiriman mulai ulang/pembaruan kini mengutamakan `threadId`
  pengiriman SQLite bertipe dibandingkan fragmen topik/utas yang diurai dari `sessionKey`; penguraian
  hanya menjadi fallback untuk kunci lama berbentuk utas.
- Id saluran konteks agen hook kini mengutamakan identitas percakapan SQLite bertipe,
  kemudian metadata pesan eksplisit. Ini tidak lagi mengurai fragmen penyedia/grup/saluran
  dari `sessionKey`.
- Pewarisan rute eksternal `chat.send` Gateway kini membaca metadata perutean sesi SQLite
  bertipe, bukan menyimpulkan cakupan saluran/langsung/grup dari
  bagian `sessionKey`. Sesi bercakupan saluran hanya mewarisi ketika saluran sesi
  dan tipe percakapan bertipe cocok dengan konteks pengiriman tersimpan; sesi utama-bersama
  mempertahankan aturan CLI/tanpa-metadata-klien yang lebih ketat.
- Pengaktifan sentinel mulai ulang dan perutean kelanjutan kini membaca baris
  pengiriman/perutean SQLite bertipe sebelum memasukkan pengaktifan Heartbeat atau kelanjutan
  giliran agen yang dirutekan ke antrean. Ini tidak lagi merekonstruksi konteks pengiriman dari
  bayangan JSON entri sesi.
- Resolusi konteks `tools.effective` Gateway kini membaca baris
  pengiriman/perutean SQLite bertipe untuk input penyedia, akun, target, utas, dan mode balasan.
  Ini tidak lagi memulihkan bidang perutean aktif tersebut dari bayangan asal
  `session_entries.entry_json` yang usang.
- Perutean konsultasi suara waktu nyata kini menyelesaikan pengiriman induk/panggilan dari baris
  sesi SQLite per agen bertipe. Ini tidak lagi melakukan fallback ke bayangan kompatibilitas
  `SessionEntry.deliveryContext` saat memilih rute pesan agen
  tertanam.
- Relai Heartbeat pembuatan ACP dan perutean aliran induk kini membaca pengiriman induk
  dari baris sesi SQLite bertipe. Keduanya tidak lagi merekonstruksi konteks pengiriman induk
  dari bayangan entri sesi kompatibilitas.
- Pemeliharaan rute pengiriman sesi kini mengikuti metadata percakapan bertipe dan
  kolom pengiriman yang dipersistenkan. Ini tidak lagi mengekstrak petunjuk saluran, penanda
  langsung/utama, atau bentuk utas dari `sessionKey`; rute webchat internal hanya
  mewarisi target eksternal ketika SQLite sudah memiliki identitas pengiriman
  bertipe/tersimpan untuk sesi tersebut.
- Ekstraksi pengiriman sesi generik kini hanya membaca baris pengiriman sesi SQLite
  bertipe yang sama persis. Ini tidak lagi mengurai sufiks utas/topik atau melakukan fallback
  dari kunci berbentuk utas ke kunci sesi dasar.
- Pengiriman balasan, pemulihan sentinel mulai ulang, dan perutean konsultasi suara waktu nyata
  kini menggunakan baris sesi/percakapan SQLite bertipe yang sama persis untuk perutean utas.
  Ini tidak lagi memulihkan id utas atau konteks pengiriman sesi dasar dengan mengurai
  kunci sesi berbentuk utas.
- Pembatasan riwayat PI tertanam kini menggunakan proyeksi perutean sesi SQLite
  bertipe (`sessions` + `conversations` utama) untuk penyedia, tipe percakapan,
  dan identitas rekan. Ini tidak lagi mengurai bentuk penyedia, DM, grup, atau utas
  dari `sessionKey`.
- Inferensi pengiriman alat Cron kini hanya menggunakan pengiriman eksplisit atau konteks pengiriman
  bertipe saat ini. Ini tidak lagi mendekode target saluran, rekan, akun, atau utas
  dari `agentSessionKey`.
- Baris sesi runtime tidak lagi membawa alias rute `lastProvider` lama.
  Pembantu dan pengujian menggunakan bidang `lastChannel` dan `deliveryContext` bertipe;
  migrasi doctor adalah satu-satunya tempat yang boleh menerjemahkan alias rute lama
  atau bayangan `origin` yang dipersistenkan.
- Peristiwa transkrip, baris VFS, dan baris artefak alat kini ditulis ke basis data
  per agen. Tabel pemetaan berkas transkrip global yang belum dirilis telah dihapus; doctor
  mencatat jalur sumber lama dalam baris migrasi permanen sebagai gantinya.
- Pencarian transkrip runtime tidak lagi memindai offset byte JSONL atau memeriksa berkas
  transkrip lama. Jalur percakapan/media/riwayat Gateway membaca baris transkrip dari
  SQLite; JSONL sesi kini hanya menjadi input doctor lama, bukan status runtime
  atau format ekspor.
- Hubungan induk dan cabang transkrip menggunakan metadata
  `parentTranscriptScope: {agentId, sessionId}` terstruktur dalam header transkrip SQLite,
  bukan string pencari `agent-db:...transcript_events...` yang menyerupai jalur.
- Kontrak pengelola transkrip tidak lagi mengekspos konstruktor
  `create(cwd)` atau `continueRecent(cwd)` tersimpan implisit. Pengelola transkrip
  tersimpan dibuka dengan cakupan `{agentId, sessionId}` eksplisit; hanya
  pengelola dalam memori tetap tanpa cakupan untuk pengujian dan transformasi transkrip murni.
- API penyimpanan transkrip runtime menyelesaikan cakupan SQLite, bukan jalur sistem berkas. Helper `resolve...ForPath` lama dan opsi penulisan `transcriptPath` yang tidak digunakan telah dihapus dari pemanggil runtime.
- Resolusi sesi runtime kini menggunakan `{agentId, sessionId}` dan tidak boleh menurunkan string `sqlite-transcript://<agent>/<session>` untuk batas eksternal.
  Jalur JSONL absolut lama hanya menjadi input migrasi doctor.
- Rekaman jembatan langsung relai hook native kini berada dalam baris bersama `native_hook_relay_bridges` bertipe yang dikunci berdasarkan id relai. Runtime tidak lagi menulis registri JSON `/tmp` atau rekaman generik opak untuk rekaman jembatan berumur pendek tersebut.
- `runEmbeddedPiAgent(...)` tidak lagi memiliki parameter pencari lokasi transkrip.
  Deskriptor worker yang telah disiapkan juga tidak menyertakan pencari lokasi transkrip. Status sesi runtime dan proses tindak lanjut yang diantrekan membawa `{agentId, sessionId}`, bukan handle transkrip turunan.
- Compaction tertanam kini mengambil cakupan SQLite dari `agentId` dan `sessionId`.
  Hook Compaction, panggilan mesin konteks, delegasi CLI, dan balasan protokol tidak boleh menerima handle `sqlite-transcript://...` turunan. Kode ekspor/debug dapat mewujudkan artefak pengguna eksplisit dari baris, tetapi tidak menyediakan jalur ekspor JSONL sesi generik atau memasukkan kembali nama berkas ke dalam identitas runtime.
- `/export-session` membaca baris transkrip dari SQLite dan hanya menulis tampilan HTML mandiri yang diminta. Penampil tertanam tidak lagi merekonstruksi atau mengunduh JSONL sesi dari baris tersebut.
- Delegasi mesin konteks tidak lagi mengurai pencari lokasi transkrip untuk memulihkan identitas agen. Konteks runtime yang disiapkan membawa `agentId` yang telah diselesaikan ke adaptor Compaction bawaan.
- Penulisan ulang transkrip dan pemotongan hasil alat secara langsung kini membaca dan mempertahankan status transkrip berdasarkan `{agentId, sessionId}` serta tidak menurunkan pencari lokasi sementara untuk payload peristiwa pembaruan transkrip.
- Permukaan helper status transkrip tidak lagi memiliki varian berbasis pencari lokasi `readTranscriptState`, `replaceTranscriptStateEvents`, atau `persistTranscriptStateMutation`. Pemanggil runtime harus menggunakan API `{agentId, sessionId}`. Impor doctor membaca berkas lama berdasarkan jalur berkas eksplisit dan menulis baris SQLite; impor tersebut tidak memigrasikan string pencari lokasi.
- Kontrak pengelola sesi runtime tidak lagi mengekspos `open(locator)`, `forkFrom(locator)`, atau `setTranscriptLocator(...)`. Pengelola sesi persisten hanya membuka berdasarkan `{agentId, sessionId}`; helper daftar/fork berada pada API sesi dan checkpoint berorientasi baris, bukan pada fasad pengelola transkrip.
- API pembaca transkrip Gateway mengutamakan cakupan. API tersebut menerima `{agentId, sessionId}` dan tidak menerima pencari lokasi transkrip posisional yang dapat secara tidak sengaja menjadi identitas runtime. Penguraian pencari lokasi transkrip aktif telah dihapus; jalur sumber lama hanya dibaca oleh kode impor doctor.
- Peristiwa pembaruan transkrip juga mengutamakan cakupan. `emitSessionTranscriptUpdate` tidak lagi menerima string pencari lokasi polos, dan listener merutekan berdasarkan `{agentId, sessionId}` tanpa mengurai handle.
- Siaran pesan sesi Gateway menyelesaikan kunci sesi dari cakupan agen/sesi, bukan dari pencari lokasi transkrip. Penyelesai/cache lama dari pencari lokasi transkrip ke kunci sesi telah dihapus.
- SSE riwayat sesi Gateway memfilter pembaruan langsung berdasarkan cakupan agen/sesi. SSE tersebut tidak lagi mengkanonisasi kandidat pencari lokasi transkrip, realpath, atau identitas transkrip berbentuk berkas untuk menentukan apakah suatu aliran harus menerima pembaruan.
- Hook siklus hidup sesi tidak lagi menurunkan atau mengekspos pencari lokasi transkrip pada `session_end`. Konsumen hook mendapatkan `sessionId`, `sessionKey`, id sesi berikutnya, dan konteks agen; berkas transkrip bukan bagian dari kontrak siklus hidup.
- Hook reset juga tidak lagi menurunkan atau mengekspos pencari lokasi transkrip. Payload `before_reset` membawa pesan SQLite yang dipulihkan beserta alasan reset, sementara identitas sesi tetap berada dalam konteks hook.
- Reset harness agen tidak lagi menerima pencari lokasi transkrip. Pengiriman reset dicakup oleh `sessionId`/`sessionKey` beserta alasan.
- Tipe sesi ekstensi agen tidak lagi mengekspos `transcriptLocator`; ekstensi harus menggunakan konteks sesi dan API runtime, bukan menjangkau identitas transkrip berbentuk berkas.
- Hook Compaction Plugin tidak lagi mengekspos pencari lokasi transkrip. Konteks hook telah membawa identitas sesi, dan pembacaan transkrip harus melalui API sadar cakupan SQLite, bukan handle berbentuk berkas.
- Hook `before_agent_finalize` tidak lagi mengekspos `transcriptPath`, termasuk payload relai hook native. Hook finalisasi hanya menggunakan konteks sesi.
- Respons reset Gateway tidak lagi menyintesis pencari lokasi transkrip pada entri yang dikembalikan. Reset membuat baris transkrip SQLite, mengembalikan entri sesi yang bersih, dan menyerahkan akses transkrip kepada pembaca sadar cakupan.
- Hasil proses tertanam dan Compaction tidak lagi menampilkan pencari lokasi transkrip untuk penghitungan sesi. Compaction otomatis hanya memperbarui `sessionId` aktif, penghitung Compaction, dan metadata token.
- Hasil percobaan tertanam tidak lagi mengembalikan `transcriptLocatorUsed`, dan hasil `compact()` mesin konteks tidak lagi mengembalikan pencari lokasi transkrip. Perulangan percobaan ulang runtime hanya menerima penerus `sessionId`.
- Hasil penambahan transkrip cermin pengiriman tidak lagi mengembalikan pencari lokasi transkrip. Pemanggil mendapatkan `messageId` yang ditambahkan; sinyal pembaruan transkrip menggunakan cakupan SQLite.
- Helper fork sesi induk hanya mengembalikan `sessionId` yang di-fork. Persiapan subagen meneruskan cakupan agen/sesi anak ke mesin.
- Parameter runner CLI dan pengisian ulang riwayat tidak lagi menerima pencari lokasi transkrip. Pembacaan riwayat CLI menyelesaikan cakupan transkrip SQLite dari `{agentId,
sessionId}` dan konteks kunci sesi.
- Fixture pengujian CLI dan runner tertanam kini mengisi awal dan membaca baris transkrip SQLite berdasarkan id sesi, bukan berpura-pura bahwa sesi aktif adalah berkas `*.jsonl` atau meneruskan string `sqlite-transcript://...` melalui parameter runtime.
- Peristiwa penjaga hasil alat sesi dipancarkan dari cakupan sesi yang diketahui meskipun pengelola dalam memori tidak memiliki pencari lokasi turunan. Pengujiannya tidak lagi memalsukan berkas transkrip `/tmp/*.jsonl` aktif.
- Helper BTW dan checkpoint Compaction kini membaca dan melakukan fork baris transkrip berdasarkan cakupan SQLite. Metadata checkpoint kini hanya menyimpan id sesi serta id daun/entri; pencari lokasi turunan tidak lagi ditulis ke dalam payload checkpoint.
- Pencarian kunci transkrip Gateway menggunakan cakupan transkrip SQLite pada batas protokol dan tidak lagi menjalankan realpath atau stat pada nama berkas transkrip.
- Rotasi transkrip Compaction otomatis menulis baris transkrip penerus secara langsung melalui penyimpanan transkrip SQLite. Baris sesi hanya menyimpan identitas sesi penerus, bukan jalur JSONL persisten atau pencari lokasi yang dipertahankan.
- Compaction mesin konteks tertanam menggunakan helper rotasi transkrip bernama SQLite. Pengujian rotasi tidak lagi membuat jalur penerus JSONL atau memodelkan sesi aktif sebagai berkas.
- Retensi gambar keluar terkelola mengunci cache pesan transkripnya berdasarkan statistik transkrip SQLite, bukan panggilan stat sistem berkas.
- Kunci sesi runtime dan jalur doctor `.jsonl.lock` lama yang mandiri telah dihapus.
- Barrel runtime Microsoft Teams dan SDK Plugin publik tidak lagi mengekspor ulang helper penguncian berkas lama; jalur status Plugin persisten didukung SQLite.
- Pemangkasan sesi berdasarkan usia/jumlah dan pembersihan sesi eksplisit telah dihapus. Doctor memiliki impor lama; sesi kedaluwarsa direset atau dihapus secara eksplisit.
- Pemeriksaan integritas doctor tidak lagi menghitung berkas JSONL lama sebagai transkrip aktif yang valid untuk baris sesi SQLite. Kesehatan transkrip aktif hanya berbasis SQLite; berkas JSONL lama dilaporkan sebagai input migrasi/pembersihan yatim.
- Doctor tidak lagi memperlakukan `agents/<agent>/sessions/` sebagai status runtime yang diwajibkan. Doctor hanya memindai direktori tersebut jika sudah ada, sebagai input impor lama atau pembersihan yatim.
- `sessions.resolve` Gateway, jalur patch/reset/compact sesi, pembuatan subagen, pembatalan cepat, metadata ACP, sesi yang diisolasi Heartbeat, dan patching TUI tidak lagi memigrasikan atau memangkas kunci sesi lama sebagai efek samping pekerjaan runtime normal.
- Resolusi sesi perintah CLI kini mengembalikan `agentId` pemilik, bukan `storePath`, dan tidak lagi menyalin baris sesi utama lama selama resolusi normal `--to` atau `--session-id`. Kanonisasi baris utama lama hanya menjadi tanggung jawab doctor.
- Resolusi kedalaman subagen runtime tidak lagi membaca `sessions.json` atau penyimpanan sesi JSON5. Resolusi tersebut membaca `session_entries` SQLite berdasarkan id agen, dan metadata kedalaman/sesi lama hanya dapat masuk melalui jalur impor doctor.
- Override sesi profil autentikasi dipertahankan melalui upsert baris `{agentId, sessionKey}` langsung, bukan dengan memuat secara malas runtime penyimpanan sesi berbentuk berkas.
- Pembatasan verbose balasan otomatis dan helper pembaruan sesi kini membaca/melakukan upsert baris sesi SQLite berdasarkan identitas sesi dan tidak lagi memerlukan jalur penyimpanan lama sebelum menyentuh status baris persisten.
- Helper metadata sesi proses perintah kini menggunakan nama dan jalur modul berorientasi entri; permukaan helper perintah `session-store` lama telah dihapus.
- Pengisian awal header bootstrap dan penguatan batas Compaction manual kini memutasi baris transkrip SQLite secara langsung. Pemanggil runtime meneruskan identitas sesi, bukan jalur `.jsonl` yang dapat ditulis.
- Pemutaran ulang rotasi sesi senyap menyalin giliran pengguna/asisten terbaru berdasarkan `{agentId, sessionId}` dari baris transkrip SQLite. Proses tersebut tidak lagi menerima pencari lokasi transkrip sumber atau target.
- Baris sesi runtime baru tidak lagi menyimpan pencari lokasi transkrip. Pemanggil menggunakan `{agentId, sessionId}` secara langsung; perintah ekspor/debug dapat memilih nama berkas keluaran saat mewujudkan baris.
- Memulai sesi transkrip persisten baru kini selalu membuka baris SQLite berdasarkan cakupan. Pengelola sesi tidak lagi menggunakan kembali jalur atau pencari lokasi transkrip era berkas sebelumnya sebagai identitas sesi baru.
- Sesi transkrip persisten menggunakan API `openTranscriptSessionManagerForSession({agentId, sessionId})` eksplisit. Fasad statis `SessionManager.create/openForSession/list/forkFromSession` lama telah dihapus agar pengujian dan kode runtime tidak dapat secara tidak sengaja membuat ulang penemuan sesi era berkas.
- Runtime Plugin tidak lagi mengekspos `api.runtime.agent.session.resolveTranscriptLocatorPath`; kode Plugin menggunakan helper baris SQLite dan nilai cakupan.
- Permukaan SDK `session-store-runtime` publik kini hanya mengekspor helper baris sesi dan baris transkrip. Helper skema/jalur/transaksi SQLite yang terfokus berada di `sqlite-runtime`; helper mentah buka/tutup/reset tetap hanya lokal untuk pengujian pihak pertama.
- Pengklasifikasi nama berkas trajectory/checkpoint `.jsonl` lama kini berada dalam modul berkas sesi lama doctor. Validasi sesi inti tidak lagi mengimpor helper artefak berkas untuk menentukan id sesi SQLite normal.
- Proses subagen pemblokiran Active Memory menggunakan baris transkrip SQLite, bukan membuat berkas `session.jsonl` sementara atau persisten di bawah status Plugin. Opsi `transcriptDir` lama telah dihapus.
- Pembuatan slug sekali pakai dan proses perencana agen sistem menggunakan baris transkrip SQLite, bukan membuat berkas `session.jsonl` sementara.
- `llm-task` helper berjalan dan ekstraksi komitmen tersembunyi juga menggunakan baris transkrip
  SQLite, sehingga sesi helper khusus model ini tidak lagi membuat
  file transkrip JSON/JSONL sementara.
- `TranscriptSessionManager` kini hanya merupakan cakupan transkrip SQLite yang telah dibuka.
  Kode runtime membukanya dengan `openTranscriptSessionManagerForSession({agentId,
sessionId})`; alur pembuatan, pencabangan, pelanjutan, pencantuman, dan fork berada di
  helper baris SQLite pemiliknya, bukan di fasad pengelola statis.
  Kode doctor/impor/debug menangani file sumber lama secara eksplisit di luar
  pengelola sesi runtime.
- Metode fasad `SessionManager.newSession()` dan
  `SessionManager.createBranchedSession()` yang usang telah dihapus. Sesi
  baru dan turunan transkrip dibuat oleh alur kerja SQLite pemiliknya,
  bukan dengan mengubah pengelola yang sudah terbuka menjadi sesi tersimpan
  yang berbeda.
- Keputusan fork transkrip induk dan pembuatan fork tidak lagi menerima
  `storePath` atau `sessionsDir`; keduanya menggunakan cakupan transkrip
  SQLite `{agentId, sessionId}`, bukan metadata jalur sistem berkas yang dipertahankan.
- Memory-host tidak lagi mengekspor helper klasifikasi transkrip
  direktori sesi yang tidak melakukan apa pun; pemfilteran transkrip kini berasal dari metadata baris SQLite
  selama pembuatan entri.
- Pengujian ekspor sesi Memory-host dan QMD menggunakan cakupan transkrip SQLite. Jalur lama
  `agents/<agentId>/sessions/*.jsonl` tetap dicakup hanya jika pengujian
  sengaja membuktikan kompatibilitas doctor/impor/ekspor.
- Inspeksi sesi mentah QA-lab kini menggunakan `sessions.list` melalui gateway,
  bukan membaca `agents/qa/sessions/sessions.json`; umpan balik MSteams
  ditambahkan langsung ke transkrip SQLite tanpa membuat jalur JSONL semu.
- Giliran kanal masuk bersama kini membawa `{agentId, sessionKey}`, bukan
  `storePath` lama. Jalur perekaman LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch, dan QQBot kini membaca metadata waktu pembaruan dan merekam
  baris sesi masuk melalui identitas SQLite.
- Persistensi pencari lokasi transkrip dihapus dari baris sesi aktif.
  `resolveSessionTranscriptTarget` mengembalikan `agentId`, `sessionId`, dan metadata
  topik opsional; doctor adalah satu-satunya kode yang mengimpor nama file transkrip lama.
- Header transkrip runtime dimulai pada versi SQLite `1`. Peningkatan bentuk JSONL V1/V2/V3
  lama hanya berada dalam impor doctor dan menormalisasi header yang diimpor ke
  versi transkrip SQLite saat ini sebelum baris disimpan.
- Pengaman yang mengutamakan basis data kini melarang `SessionManager.listAll` dan
  `SessionManager.forkFromSession`; alur kerja pencantuman sesi dan fork/pemulihan
  harus tetap menggunakan API SQLite berbasis baris/cakupan.
- Pengaman tersebut juga melarang nama helper lama untuk penguraian JSONL transkrip/perbaikan cabang aktif
  di luar kode doctor/impor, sehingga runtime tidak dapat mengembangkan jalur migrasi transkrip lama
  kedua.
- Proses PI tertanam menolak handle transkrip yang masuk. Proses tersebut menggunakan identitas
  SQLite `{agentId, sessionId}` sebelum peluncuran worker dan sekali lagi sebelum
  percobaan menyentuh status transkrip. Masukan `/tmp/*.jsonl` yang usang tidak dapat memilih
  target penulisan runtime.
- Catatan pelacakan cache, payload Anthropic, stream mentah, dan lini waktu diagnostik
  kini ditulis ke baris SQLite `diagnostic_events` bertipe. Bundel stabilitas Gateway
  kini ditulis ke baris SQLite `diagnostic_stability_bundles` bertipe. Jalur penggantian JSONL lama
  `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE`, dan
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` telah dihapus, dan
  pengambilan stabilitas normal tidak lagi menulis file `logs/stability/*.json`.
- Persistensi Cron kini merekonsiliasi baris SQLite `cron_jobs`, bukan
  menghapus/menyisipkan ulang seluruh tabel pekerjaan pada setiap penyimpanan. Penulisan balik target
  Plugin memperbarui baris cron yang cocok secara langsung dan mempertahankan status cron runtime dalam
  transaksi basis data status yang sama.
- Pemanggil runtime Cron kini menggunakan kunci penyimpanan cron SQLite yang stabil. Jalur lama
  `cron.store` hanya menjadi masukan impor doctor; jalur gateway produksi, pemeliharaan tugas,
  status, riwayat proses, dan penulisan balik target Telegram menggunakan
  `resolveCronStoreKey` dan tidak lagi menormalisasi kunci berdasarkan jalur. Status Cron kini
  melaporkan `storeKey`, bukan bidang lama berbentuk file `storePath`.
- Pemuatan dan penjadwalan runtime Cron tidak lagi menormalisasi bentuk pekerjaan tersimpan
  lama seperti `jobId`, `schedule.cron`, `atMs` numerik, boolean string, atau
  `sessionTarget` yang tidak ada. Impor lama doctor menangani perbaikan tersebut sebelum baris
  dimasukkan ke SQLite.
- Spawn ACP tidak lagi menyelesaikan atau menyimpan jalur file JSONL transkrip. Penyiapan
  spawn dan pengikatan utas menyimpan baris sesi SQLite secara langsung dan mempertahankan
  id sesi sebagai identitas transkrip.
- API metadata sesi ACP kini membaca/mencantumkan/melakukan upsert baris SQLite berdasarkan `agentId` dan
  tidak lagi mengekspos `storePath` sebagai bagian dari kontrak entri sesi ACP.
- Penghitungan penggunaan sesi dan agregasi penggunaan gateway kini menyelesaikan transkrip
  hanya berdasarkan `{agentId, sessionId}`. Cache biaya/penggunaan dan ringkasan sesi
  yang ditemukan tidak lagi menyintesis atau mengembalikan string pencari lokasi transkrip.
- Penambahan chat Gateway, persistensi bagian parsial saat pembatalan, `/sessions.send`, dan
  penulisan transkrip media webchat ditambahkan langsung melalui cakupan transkrip SQLite.
  Helper injeksi transkrip gateway tidak lagi menerima parameter
  `transcriptLocator`.
- Penemuan transkrip SQLite kini hanya mencantumkan cakupan dan statistik transkrip:
  `{agentId, sessionId, updatedAt, eventCount}`. Helper kompatibilitas
  `listSqliteSessionTranscriptLocators` yang tidak digunakan dan bidang per baris
  `locator` telah dihapus.
- Runtime perbaikan transkrip kini hanya mengekspos
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. Helper perbaikan lama
  berbasis pencari lokasi telah dihapus; kode doctor/debug membaca jalur file sumber secara eksplisit
  dan tidak pernah memigrasikan string pencari lokasi.
- Runtime buku besar pemutaran ulang ACP kini menyimpan baris pemutaran ulang per sesi di basis data
  status SQLite bersama, bukan di `acp/event-ledger.json`; doctor mengimpor dan
  menghapus file lama tersebut.
- Helper pembaca transkrip Gateway kini berada di
  `src/gateway/session-transcript-readers.ts`, bukan di nama modul lama
  `session-utils.fs`. Pemeriksaan riwayat percobaan ulang cadangan dinamai berdasarkan
  konten transkrip SQLite, bukan permukaan helper file lama.
- Helper chat yang diinjeksi dan Compaction Gateway kini meneruskan cakupan transkrip SQLite
  melalui API helper internal, bukan menamai nilai sebagai jalur transkrip atau
  file sumber.
- Deteksi kelanjutan bootstrap kini memeriksa baris transkrip SQLite melalui
  `hasCompletedBootstrapTranscriptTurn`; deteksi tersebut tidak lagi mengekspos nama helper
  berbentuk file.
- Pengujian runner tertanam kini menggunakan identitas transkrip SQLite, dan membuka pengelola
  transkrip baru selalu memerlukan `sessionId` eksplisit.
- Helper pengindeksan memori kini menggunakan terminologi transkrip SQLite secara menyeluruh:
  host mengekspor `listSessionTranscriptScopesForAgent` dan
  `sessionTranscriptKeyForScope`, sinkronisasi tertarget mengantrekan `sessionTranscripts`,
  hasil pencarian sesi publik mengekspos jalur buram `transcript:<agent>:<session>`,
  dan kunci sumber DB internal adalah `session:<session>` di bawah
  `source_kind='sessions'`, bukan jalur file semu.
- Helper deduplikasi persisten SDK Plugin generik tidak lagi mengekspos opsi
  berbentuk file. Pemanggil menyediakan kunci cakupan SQLite dan baris deduplikasi tahan lama berada dalam
  status Plugin bersama.
- Token SSO Microsoft Teams dipindahkan dari file JSON terkunci ke status Plugin SQLite.
  Doctor mengimpor `msteams-sso-tokens.json`, membangun ulang kunci token SSO kanonis
  dari payload, dan menghapus file sumber. Token OAuth yang didelegasikan tetap
  berada pada batas file kredensial privat yang sudah ada.
- Status cache sinkronisasi Matrix dipindahkan dari `bot-storage.json` ke status Plugin
  SQLite. Doctor mengimpor payload sinkronisasi mentah atau terbungkus yang lama dan menghapus
  file sumber. Klien adaptor Matrix aktif dan QA Lab Matrix meneruskan direktori akar penyimpanan sinkronisasi
  SQLite, bukan jalur `sync-store.json` atau `bot-storage.json` semu.
- Status migrasi kriptografi lama Matrix dipindahkan dari
  `legacy-crypto-migration.json` ke status Plugin SQLite. Doctor mengimpor
  file status lama; snapshot IndexedDB Matrix SDK dipindahkan dari
  `crypto-idb-snapshot.json` ke blob Plugin SQLite. Kunci pemulihan dan
  kredensial Matrix merupakan baris status Plugin SQLite; file JSON lamanya hanya menjadi
  masukan migrasi doctor.
- Log aktivitas Memory Wiki kini menggunakan status Plugin SQLite, bukan
  `.openclaw-wiki/log.jsonl`. Penyedia migrasi Memory Wiki mengimpor log
  JSONL lama; markdown wiki dan konten vault pengguna tetap berbasis file sebagai
  konten ruang kerja.
- Memory Wiki tidak lagi membuat `.openclaw-wiki/state.json` atau direktori
  `.openclaw-wiki/locks` yang tidak digunakan. Penyedia migrasi menghapus file metadata
  Plugin yang telah dihentikan tersebut jika vault lama masih memilikinya.
- Entri audit system-agent kini menggunakan status Plugin SQLite inti, bukan
  `audit/crestodian.jsonl`. Doctor mengimpor log audit JSONL lama dan
  menghapusnya setelah impor berhasil.
- Entri audit penulisan/pengamatan konfigurasi kini menggunakan status Plugin SQLite inti,
  bukan `logs/config-audit.jsonl`. Doctor mengimpor log audit JSONL lama dan
  menghapusnya setelah impor berhasil.
- Pendamping macOS tidak lagi menulis sidecar lokal aplikasi `logs/config-audit.jsonl` atau
  `logs/config-health.json` saat mengedit `openclaw.json`. File konfigurasi
  tetap berbasis file, snapshot pemulihan tetap berada di sebelah file konfigurasi,
  dan status audit/kesehatan konfigurasi tahan lama berada dalam penyimpanan SQLite Gateway.
- Persetujuan tertunda penyelamatan system-agent kini menggunakan status Plugin SQLite inti,
  bukan `crestodian/rescue-pending/*.json` atau `openclaw/rescue-pending/*.json`.
  Kapabilitas keamanan berumur pendek ini tidak pernah diimpor; doctor membuang
  kedua direktori yang telah dihentikan agar peningkatan tidak dapat mengaktifkan kembali penulisan yang usang.
- Status pengaktifan sementara Phone Control kini menggunakan status Plugin SQLite, bukan
  `plugins/phone-control/armed.json`. Doctor mengimpor file status aktif lama
  ke namespace `phone-control/arm-state` dan menghapus file tersebut.
- Doctor tidak lagi memperbaiki transkrip JSONL di tempat atau membuat file JSONL
  cadangan. Doctor mengimpor cabang aktif ke SQLite dan menghapus sumber lama.
- Pencarian transkrip hook memori sesi menggunakan pembacaan SQLite khusus cakupan
  `{agentId, sessionId}`. Helper-nya tidak lagi menerima atau menurunkan pencari lokasi transkrip,
  pembacaan file lama, atau opsi penulisan ulang file.
- Pengikatan percakapan app-server Codex kini mengunci status Plugin SQLite berdasarkan
  kunci sesi OpenClaw atau cakupan `{agentId, sessionId}` eksplisit. Pengikatan tersebut tidak boleh
  mempertahankan pengikatan cadangan berbasis jalur transkrip.
- Pembacaan riwayat tercermin app-server Codex hanya menggunakan cakupan transkrip SQLite;
  pembacaan tersebut tidak boleh memulihkan identitas dari jalur file transkrip.
- Jalur pengurutan peran dan reset Compaction tidak lagi menghapus tautan file transkrip
  lama; reset hanya merotasi baris sesi dan identitas transkrip SQLite.
- Respons reset dan titik pemeriksaan Gateway mengembalikan baris sesi bersih beserta id
  sesi. Respons tersebut tidak lagi menyintesis pencari lokasi transkrip SQLite untuk klien.
- Dreaming memory-core tidak lagi memangkas baris sesi dengan memeriksa file
  JSONL yang hilang. Pembersihan subagen dilakukan melalui API runtime sesi, bukan
  pemeriksaan keberadaan sistem berkas. Pengujian penyerapan transkripnya menyemai baris SQLite
  secara langsung, bukan membuat fixture `agents/<id>/sessions` atau placeholder
  pencari lokasi.
- Pengindeksan transkrip memori dapat mengekspos `transcript:<agentId>:<sessionId>` sebagai
  jalur virtual hasil pencarian untuk helper kutipan/pembacaan. Sumber indeks tahan lama bersifat
  relasional (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), sehingga nilainya bukan pelacak transkrip runtime,
  bukan path sistem berkas, dan tidak boleh diteruskan kembali ke API runtime sesi.
- Status memori Gateway doctor membaca jumlah pemanggilan kembali jangka pendek dan sinyal fase
  dari baris status plugin SQLite, bukan dari `memory/.dreams/*.json`; keluaran CLI dan
  doctor kini melabeli penyimpanan tersebut sebagai penyimpanan SQLite, bukan path.
- Runtime memory-core, status CLI, metode Gateway doctor, dan fasad SDK plugin
  tidak lagi mengaudit atau mengarsipkan berkas `.dreams/session-corpus` lama.
  Berkas tersebut hanya menjadi masukan migrasi; doctor mengimpornya ke SQLite dan
  menghapus sumber setelah verifikasi. Baris bukti penyerapan sesi aktif
  kini menggunakan path SQLite virtual `memory/session-ingestion/<day>.txt`; runtime
  tidak pernah menulis atau memperoleh status dari `.dreams/session-corpus`.
- Artefak publik memory-core mengekspos peristiwa host SQLite sebagai artefak JSON
  virtual `memory/events/memory-host-events.json`; artefak tersebut tidak lagi menggunakan kembali
  path sumber lama `.dreams/events.jsonl`.
- Registri kontainer/browser sandbox kini menggunakan tabel SQLite bersama
  `sandbox_registry_entries` dengan kolom sesi, image, stempel waktu,
  backend/config, dan port browser bertipe. Doctor mengimpor berkas registri JSON monolitik dan
  terpecah lama serta menghapus sumber yang berhasil diimpor. Pembacaan runtime menggunakan
  kolom baris bertipe sebagai sumber kebenaran; `entry_json` hanya salinan
  pemutaran ulang/debug.
- Komitmen kini menggunakan tabel bersama bertipe `commitments`, bukan
  blob JSON untuk seluruh penyimpanan. Runtime menggunakan kueri cakupan, jendela pengiriman, batas
  bergulir, status, dan percobaan yang terindeks beserta transaksi SQLite sinkron;
  `record_json` hanya salinan pemutaran ulang/debug. Perbaikan doctor eksplisit memvalidasi
  `commitments.json` lama secara lengkap, mempertahankan baris SQLite yang lebih baru, memverifikasi
  hasilnya, dan baru kemudian menghapus sumber yang tidak berubah. Runtime tidak pernah membaca atau
  menulis berkas yang telah dihentikan penggunaannya.
- Langganan Web Push dan identitas VAPID yang dihasilkan kini menggunakan baris bersama bertipe
  `web_push_subscriptions` dan `web_push_vapid_keys`. Pendaftaran runtime,
  pembersihan kedaluwarsa, dan pembuatan kunci saat penggunaan pertama memakai transaksi SQLite
  tingkat baris. Perbaikan Doctor eksplisit memvalidasi kedua penyimpanan JSON yang telah dihentikan penggunaannya,
  mengklaimnya sebelum penulisan SQLite, mengimpornya secara atomik, menolak
  identitas VAPID yang berkonflik, memverifikasi hasilnya, dan baru kemudian menghapus
  klaim tersebut. Doctor menahan kunci pemeliharaan direktori status selama
  proses impor lengkap agar Gateway lama tidak dapat membuat ulang berkas yang telah dihentikan penggunaannya. Pendaftaran,
  pengiriman, penghapusan, dan resolusi kunci ditutup saat gagal hingga Doctor menyelesaikan
  sumber lama yang tertunda atau klaim yang terinterupsi.
- Definisi tugas Cron, status jadwal, dan riwayat eksekusi tidak lagi memiliki penulis
  atau pembaca JSON runtime. Runtime menggunakan baris `cron_jobs` dengan kolom jadwal,
  payload, pengiriman, peringatan kegagalan, sesi, status, dan status runtime bertipe beserta
  detail `task_runs` milik Cron untuk diagnostik, pengiriman, sesi/eksekusi, model,
  dan total token. `job_json` hanya salinan pemutaran ulang/debug; `state_json` menyimpan
  diagnostik runtime bertingkat yang belum memiliki bidang kueri cepat, sementara runtime
  merehidrasi bidang status cepat dari kolom bertipe. Doctor mengimpor
  berkas lama `jobs.json`, `jobs-state.json`, dan `runs/*.jsonl` serta menghapus
  sumber yang diimpor. Penulisan balik target plugin memperbarui baris `cron_jobs`
  yang cocok, bukan memuat dan mengganti seluruh penyimpanan Cron.
- Saat dimulai, Gateway mengabaikan penanda lama `notify: true` dalam proyeksi
  runtime. Doctor membaca `cron.webhook` mentah yang telah dihentikan penggunaannya hanya saat menerjemahkan
  penanda tersebut menjadi pengiriman SQLite eksplisit, lalu menghapus kunci config.
- Antrean pengiriman keluar dan sesi kini menyimpan status antrean, jenis entri,
  kunci sesi, channel, target, id akun, jumlah percobaan ulang, percobaan/kesalahan terakhir,
  status pemulihan, dan penanda pengiriman platform sebagai kolom bertipe dalam tabel bersama
  `delivery_queue_entries`. Pemulihan runtime membaca bidang cepat tersebut dari
  kolom bertipe, dan mutasi percobaan ulang/pemulihan memperbarui kolom tersebut secara langsung
  tanpa menulis ulang JSON pemutaran ulang. Payload JSON lengkap hanya dipertahankan sebagai
  blob pemutaran ulang/debug untuk isi pesan dan data pemutaran ulang dingin lainnya.
- Catatan gambar keluar terkelola kini menggunakan baris bersama bertipe
  `managed_outgoing_image_records`. Runtime hanya membaca kolom bertipe;
  kolom JSON adalah salinan pemutaran ulang/debug. Byte gambar asli tetap menjadi
  artefak lampiran bernama dalam direktori media terkelola.
- Preferensi pemilih model Discord, hash penerapan perintah, dan pengikatan utas
  kini menggunakan status plugin SQLite bersama. Rencana impor JSON lama berada di
  permukaan migrasi penyiapan/doctor plugin Discord, bukan dalam kode migrasi inti.
- Pendeteksi impor lama plugin menggunakan modul bernama doctor seperti
  `doctor-legacy-state.ts` atau `doctor-state-imports.ts`; modul runtime channel normal
  tidak boleh mengimpor pendeteksi JSON lama.
- Kursor penyusulan BlueBubbles dan penanda deduplikasi masuk kini menggunakan status plugin
  SQLite bersama. Rencana impor JSON lama berada di permukaan migrasi
  penyiapan/doctor plugin BlueBubbles, bukan dalam kode migrasi inti.
- Offset pembaruan Telegram, baris cache stiker, baris cache pesan terkirim,
  baris cache nama topik, dan pengikatan utas kini menggunakan status plugin SQLite
  bersama. Rencana impor JSON lama berada di permukaan migrasi
  penyiapan/doctor plugin Telegram, bukan dalam kode migrasi inti.
- Kursor penyusulan iMessage, pemetaan id pendek balasan, dan baris deduplikasi gema terkirim
  kini menggunakan status plugin SQLite bersama. Berkas lama `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl`, dan `imessage/sent-echoes.jsonl`
  hanya menjadi masukan doctor.
- Baris deduplikasi pesan Feishu kini menggunakan deduplikasi yang dapat diklaim milik inti
  (namespace `feishu.dedup.*` dalam status plugin SQLite bersama), bukan
  berkas `feishu/dedup/*.json` atau penyimpanan `dedup.*` buatan sendiri yang telah dihentikan penggunaannya, tanpa
  impor lama karena cache perlindungan pemutaran ulang dibangun kembali setelah peningkatan.
- Percakapan, polling, buffer unggahan tertunda, dan pembelajaran umpan balik
  Microsoft Teams kini menggunakan tabel status/blob plugin SQLite bersama. Path unggahan tertunda
  menggunakan `plugin_blob_entries` agar buffer media disimpan sebagai BLOB SQLite,
  bukan JSON base64. Nama helper runtime kini menggunakan penamaan SQLite/status,
  bukan penamaan penyimpanan berkas `*-fs`, dan shim lama `storePath` telah dihapus
  dari penyimpanan tersebut. Rencana impor JSON lamanya berada di permukaan migrasi
  penyiapan/doctor plugin Microsoft Teams.
- Media keluar yang dihosting Zalo kini menggunakan `plugin_blob_entries` SQLite bersama,
  bukan sidecar sementara JSON/bin `openclaw-zalo-outbound-media`.
- HTML dan metadata penampil diff kini menggunakan `plugin_blob_entries` SQLite bersama,
  bukan berkas sementara `meta.json`/`viewer.html`. HTML penampil disimpan sebagai
  blob gzip dan hanya hash token URL yang dipertahankan. Keluaran PNG/PDF yang dirender
  tetap menjadi materialisasi sementara karena pengiriman channel masih memerlukan path berkas;
  metadata kedaluwarsanya dimiliki SQLite tanpa sidecar JSON.
- Dokumen terkelola Canvas kini menggunakan `plugin_blob_entries` SQLite bersama,
  bukan direktori default `state/canvas/documents`. Host Canvas menyajikan blob tersebut
  secara langsung; berkas lokal hanya dibuat untuk konten operator `host.root`
  eksplisit atau materialisasi sementara ketika pembaca media hilir
  memerlukan path.
- Keputusan audit File Transfer kini menggunakan `plugin_state_entries` SQLite bersama,
  bukan log runtime `audit/file-transfer.jsonl` yang tidak dibatasi. Doctor
  mengimpor berkas audit JSONL lama ke status plugin dan menghapus sumber
  setelah impor yang bersih.
- Lease proses ACPX dan identitas instans Gateway kini menggunakan status plugin SQLite
  bersama. Doctor mengimpor berkas lama `gateway-instance-id` ke status plugin
  dan menghapus sumbernya.
- Skrip wrapper yang dihasilkan ACPX dan home Codex yang terisolasi merupakan
  materialisasi sementara di bawah root sementara OpenClaw, bukan status OpenClaw yang tahan lama. Catatan
  runtime ACPX yang tahan lama adalah baris lease SQLite dan instans Gateway;
  permukaan config ACPX lama `stateDir` dihapus karena tidak ada lagi status runtime yang
  ditulis di sana.
- Lampiran media Gateway kini menggunakan tabel SQLite bersama `media_blobs` sebagai
  penyimpanan byte kanonis. Path lokal yang dikembalikan ke permukaan kompatibilitas
  channel dan sandbox adalah materialisasi sementara dari baris basis data, bukan
  penyimpanan media yang tahan lama. Daftar izin media runtime tidak lagi menyertakan root lama
  `$OPENCLAW_STATE_DIR/media` atau `media` direktori config; direktori tersebut
  hanya menjadi sumber impor doctor.
- Pelengkapan shell tidak lagi menulis berkas cache
  `$OPENCLAW_STATE_DIR/completions/*`. Path smoke instalasi, doctor, pembaruan, dan rilis menggunakan
  keluaran pelengkapan yang dihasilkan atau pemuatan dari profil, bukan berkas cache
  pelengkapan yang tahan lama.
- Staging unggahan Skills Gateway kini menggunakan baris bersama `skill_uploads` dan
  `skill_upload_chunks`. Setiap potongan tetap transaksional secara individual selama
  pengunggahan, lalu commit merakit satu BLOB arsip terverifikasi dan menghapus baris
  potongan. Penginstal hanya menerima path arsip yang dimaterialisasi sementara ketika
  instalasi sedang berjalan. Doctor membuang pohon staging sistem berkas satu jam
  yang telah dihentikan penggunaannya, bukan mengimpor unggahan sementara.
- Lampiran inline subagen tidak lagi dimaterialisasi di bawah
  `.openclaw/attachments/*` ruang kerja. Path spawn menyiapkan entri seed VFS SQLite,
  eksekusi inline menanamkan entri tersebut ke namespace scratch runtime per agen,
  dan alat berbasis disk melapisi scratch SQLite tersebut untuk path lampiran. Kolom
  registri direktori lampiran eksekusi subagen lama dan hook pembersihannya telah dihapus.
- Hidrasi gambar CLI tidak lagi mempertahankan berkas cache
  `openclaw-cli-images` yang stabil. Backend CLI eksternal masih menerima path berkas, tetapi path tersebut
  merupakan materialisasi sementara per eksekusi dengan pembersihan.
- Diagnostik jejak cache, diagnostik payload Anthropic, diagnostik stream model
  mentah, peristiwa linimasa diagnostik, dan bundel stabilitas Gateway kini
  menulis baris SQLite, bukan berkas `logs/*.jsonl` atau
  `logs/stability/*.json`.
  Flag dan variabel lingkungan penggantian path runtime telah dihapus; perintah
  ekspor/debug dapat mematerialisasi berkas secara eksplisit dari baris basis data.
- Pendamping macOS tidak lagi memiliki penulis `diagnostics.jsonl` bergulir. Log aplikasi
  masuk ke pencatatan terpadu, dan diagnostik Gateway yang tahan lama tetap didukung SQLite.
- Daftar catatan penjaga port macOS kini menggunakan baris SQLite bersama bertipe
  `macos_port_guardian_records`, bukan berkas JSON Application Support
  atau blob singleton buram. Semua profil aplikasi macOS menggunakan basis data native global-host
  yang sama karena semuanya mengoordinasikan port lokal mesin. Setiap operasi buku besar
  diblokir selama salinan aplikasi lama yang menulis JSON sedang berjalan. Migrasi bergabung dengan
  protokol kunci berkas stabil milik buku besar lama hanya untuk mengambil snapshot dan kemudian
  memvalidasi ulang sumber. Migrasi menyelesaikan setiap baris lama dari fakta perintah langsung dan
  awal proses tanpa menahan kunci tersebut, lalu membaca ulang baris SQLite otoritatif, menerapkan
  rencana, memverifikasi setiap tanda terima, dan menghapus sumber. Percobaan ulang penghapusan merencanakan ulang
  baris yang hilang agar tanda terima usang yang telah dihentikan penggunaannya tidak dapat muncul kembali. Kunci tetap
  berumur pendek agar tidak menelantarkan penulis lama setelah SSH melakukan spawn. Peralihan ini
  sengaja bersifat satu arah: runtime kondisi stabil tidak pernah membaca, memproyeksikan, atau menulis JSON,
  dan rollback ke build khusus JSON tidak mempertahankan tanda terima SQLite yang lebih baru.
- Kunci singleton Gateway kini menggunakan baris SQLite bersama bertipe `state_leases` di bawah
  cakupan `gateway_locks`, bukan berkas kunci direktori sementara. Dokumentasi
  pemecahan masalah Fly dan OAuth kini mengarah ke kunci lease/penyegaran auth SQLite,
  bukan pembersihan kunci berkas yang usang.
- Status sentinel mulai ulang Gateway kini menggunakan baris SQLite bersama bertipe
  `gateway_restart_sentinel`, bukan `restart-sentinel.json`; runtime
  membaca jenis, status, perutean, pesan, kelanjutan, dan statistik sentinel dari
  kolom bertipe. Kolom tersebut bersifat otoritatif; `payload_json` hanyalah
  bayangan untuk pemutaran ulang/debug. Jalur baca, tulis, dan hapus runtime hanya menggunakan SQLite.
  Satu modul migrasi status terbatas berjalan selama startup dan Doctor untuk mengimpor
  sentinel pascapembaruan lama yang telah divalidasi sebelum pemulihan mulai ulang normal, memverifikasi
  baris bertipe, dan menghapus file sumber. Tidak ada modul runtime kondisi stabil yang
  membaca, menulis, atau membersihkan file lama tersebut.
- Status maksud mulai ulang Gateway dan serah terima supervisor kini menggunakan baris SQLite
  bersama bertipe `gateway_restart_intent` dan `gateway_restart_handoff`, bukan
  sidecar `gateway-restart-intent.json` dan
  `gateway-supervisor-restart-handoff.json`.
- Koordinasi singleton Gateway kini menggunakan baris bertipe `state_leases` di bawah
  `gateway_locks`, bukan menulis file `gateway.<hash>.lock`. Baris sewa
  menyimpan pemilik kunci, kedaluwarsa, heartbeat, dan payload debug; SQLite menangani
  batas perolehan/pelepasan atomik. Opsi direktori kunci file yang telah dihentikan
  dihapus; pengujian menggunakan identitas baris SQLite secara langsung.
- Pembantu laporan penggunaan Cron lama yang tidak dirujuk dan memindai file
  `cron/runs/*.jsonl` telah dihapus. Laporan riwayat eksekusi Cron membaca baris `task_runs`
  milik Cron.
- Pemulihan mulai ulang sesi utama kini menemukan agen kandidat melalui
  registri SQLite `agent_databases`, bukan memindai direktori
  `agents/*/sessions`.
- Pemulihan kerusakan sesi Gemini kini hanya menghapus baris sesi SQLite;
  tidak lagi memerlukan gerbang lama `storePath` atau mencoba menghapus tautan jalur
  JSONL transkrip turunan.
- Penanganan penggantian jalur kini memperlakukan nilai lingkungan literal
  `undefined`/`null` sebagai tidak disetel, sehingga mencegah database
  `undefined/state/*.sqlite` yang tidak disengaja di root repo selama pengujian atau serah terima shell.
- Sidik jari kesehatan konfigurasi kini menggunakan baris SQLite bersama bertipe
  `config_health_entries`, bukan `logs/config-health.json`, sehingga file konfigurasi normal tetap menjadi
  satu-satunya dokumen konfigurasi non-kredensial. Pendamping macOS hanya menyimpan
  status kesehatan lokal proses dan tidak membuat ulang sidecar JSON lama.
- Runtime profil autentikasi tidak lagi mengimpor atau menulis file JSON kredensial.
  Penyimpanan kredensial kanonis adalah SQLite; `auth-profiles.json`,
  `auth.json` per agen, dan `credentials/oauth.json` bersama merupakan input migrasi Doctor
  yang dihapus setelah diimpor.
- Pengujian penyimpanan/status profil autentikasi kini memeriksa tabel autentikasi SQLite bertipe secara langsung
  dan hanya menggunakan nama file profil autentikasi lama sebagai input migrasi Doctor.
- `openclaw secrets apply` hanya membersihkan file konfigurasi, file env, dan penyimpanan
  profil autentikasi SQLite. Komponen tersebut tidak lagi memuat logika kompatibilitas yang menyunting
  `auth.json` per agen yang telah dihentikan; Doctor bertanggung jawab mengimpor dan menghapus file tersebut.
- Rencana migrasi rahasia Hermes mengimpor dan menerapkan profil kunci API secara langsung
  ke penyimpanan profil autentikasi SQLite. Rencana tersebut tidak lagi menulis atau memverifikasi
  `auth-profiles.json` sebagai target perantara.
- Dokumentasi autentikasi yang ditujukan kepada pengguna kini menjelaskan
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>`, bukan
  meminta pengguna memeriksa atau menyalin `auth-profiles.json`; nama JSON OAuth/autentikasi
  lama tetap didokumentasikan hanya sebagai input impor Doctor.
- Sesi OAuth MCP kini menggunakan baris `mcp_oauth_stores` berversi dalam
  `state/openclaw.sqlite` bersama. Objek token, pendaftaran klien, dan penemuan
  milik SDK tetap berupa satu payload JSON tervalidasi agar kolom ekstensi dependensi
  tetap bertahan, sedangkan setiap proses baca/ubah/tulis dikomit dalam satu transaksi Kysely
  singkat. Satu sewa SQLite bersama menserialisasi penyegaran, login, dan logout;
  transport MCP tersemat tidak lagi mengizinkan SDK MCP melakukan penyegaran di luar
  sewa tersebut. Doctor secara eksklusif mengimpor dan menghapus penyimpanan
  `mcp-oauth/*.json` yang telah dihentikan beserta tanda terima sumber, dan runtime tidak memiliki fallback file.
- Pembantu jalur status inti tidak lagi mengekspos file
  `credentials/oauth.json` yang telah dihentikan. Nama file lama hanya tersedia secara lokal pada jalur impor autentikasi Doctor.
- Dokumentasi instalasi, keamanan, onboarding, autentikasi model, dan SecretRef kini menjelaskan
  baris profil autentikasi SQLite serta pencadangan/migrasi seluruh status, bukan
  file JSON profil autentikasi per agen.
- Penemuan model PI kini meneruskan kredensial kanonis ke penyimpanan autentikasi
  `pi-coding-agent` dalam memori. Proses tersebut tidak lagi membuat, membersihkan, atau menulis
  `auth.json` per agen selama penemuan.
- Pengaturan pemicu dan perutean Voice Wake kini menggunakan tabel SQLite bersama bertipe,
  bukan `settings/voicewake.json`, `settings/voicewake-routing.json`, atau
  baris generik buram; Doctor mengimpor file JSON lama dan menghapusnya setelah
  migrasi berhasil.
- Status pemeriksaan pembaruan kini menggunakan baris bersama bertipe `update_check_state`,
  bukan `update-check.json` atau blob generik buram; Doctor mengimpor
  file JSON lama dan menghapusnya setelah migrasi berhasil.
- Status kesehatan konfigurasi kini menggunakan baris bersama bertipe `config_health_entries`,
  bukan `logs/config-health.json` atau blob generik buram; Doctor
  mengimpor file JSON lama dan menghapusnya setelah migrasi berhasil.
- Persetujuan pengikatan percakapan Plugin kini menggunakan baris bertipe
  `plugin_binding_approvals`, bukan status SQLite bersama yang buram atau
  `plugin-binding-approvals.json`; file lama tersebut merupakan input migrasi Doctor.
- Pengikatan percakapan aktif generik kini menyimpan baris bertipe
  `current_conversation_bindings`, bukan menulis ulang
  `bindings/current-conversations.json`; Doctor mengimpor file JSON lama dan
  menghapusnya setelah migrasi berhasil.
- Buku besar sinkronisasi sumber impor Memory Wiki kini menyimpan satu baris status Plugin SQLite
  per kunci vault/sumber, bukan menulis ulang `.openclaw-wiki/source-sync.json`;
  penyedia migrasi mengimpor dan menghapus buku besar JSON lama.
- Catatan eksekusi impor ChatGPT Memory Wiki kini menyimpan satu baris status Plugin SQLite
  per ID vault/eksekusi, bukan menulis `.openclaw-wiki/import-runs/*.json`.
  Snapshot rollback tetap berupa file vault eksplisit hingga pengarsipan snapshot
  eksekusi impor dipindahkan ke penyimpanan blob.
- Digest terkompilasi Memory Wiki kini menyimpan baris blob Plugin SQLite terkompresi,
  bukan menulis `.openclaw-wiki/cache/agent-digest.json` dan
  `.openclaw-wiki/cache/claims.jsonl`. Cache dapat dibangun ulang, sehingga Doctor
  menghapus file cache lama tanpa mengimpornya.
- Pelacakan instalasi skill ClawHub kini menyimpan satu baris status Plugin SQLite per
  ruang kerja/skill, bukan menulis atau membaca sidecar `.clawhub/lock.json` dan
  `.clawhub/origin.json` saat runtime. Kode runtime menggunakan objek status instalasi terlacak,
  bukan abstraksi lockfile/asalan berbentuk file. Doctor
  mengimpor sidecar lama dari ruang kerja agen yang dikonfigurasi dan menghapusnya
  setelah impor yang bersih.
- Indeks Plugin terinstal kini membaca dan menulis baris singleton SQLite bersama bertipe
  `installed_plugin_index`, bukan `plugins/installs.json`; file JSON
  lama hanya menjadi input migrasi Doctor dan dihapus setelah impor.
- Pembantu jalur `plugins/installs.json` lama kini berada dalam kode lama Doctor.
  Modul indeks Plugin runtime hanya mengekspos opsi persistensi yang didukung SQLite,
  bukan jalur file JSON.
- Status sentinel mulai ulang Gateway, maksud mulai ulang, dan serah terima supervisor kini menggunakan
  baris SQLite bersama bertipe (`gateway_restart_sentinel`,
  `gateway_restart_intent`, dan `gateway_restart_handoff`), bukan blob generik
  buram. Kode mulai ulang runtime tidak memiliki kontrak sentinel/maksud/serah terima
  berbentuk file.
- Cache sinkronisasi, metadata penyimpanan, pengikatan utas, penanda deduplikasi masuk,
  status cooldown verifikasi startup, snapshot kripto IndexedDB SDK,
  kredensial, dan kunci pemulihan Matrix kini menggunakan tabel status/blob Plugin SQLite
  bersama. Struct jalur runtime tidak lagi mengekspos jalur metadata
  `storage-meta.json`; nama file tersebut hanya merupakan input migrasi lama. Rencana impor JSON lama
  tersedia dalam permukaan migrasi penyiapan/Doctor Plugin Matrix. Penanda
  deduplikasi masuk menggunakan deduplikasi yang dapat diklaim milik inti (namespace
  `matrix.inbound-dedupe.*` dalam DB status bersama); migrasi status Doctor Matrix mengimpor
  baris `inbound-dedupe` per root yang telah dihentikan dan `inbound-dedupe.json` satu kali,
  lalu runtime hanya membaca penyimpanan deduplikasi yang dapat diklaim.
- Startup Matrix tidak lagi memindai, melaporkan, atau menyelesaikan status file Matrix lama.
  Deteksi file Matrix, pembuatan snapshot kripto lama, status migrasi pemulihan
  kunci ruang, impor, dan penghapusan sumber seluruhnya dimiliki Doctor.
- Barrel migrasi runtime Matrix telah dihapus. Pembantu deteksi dan mutasi
  status/kripto lama diimpor langsung oleh Doctor Matrix, bukan menjadi
  bagian dari permukaan API runtime.
- Penanda penggunaan kembali snapshot migrasi Matrix kini berada dalam status Plugin SQLite,
  bukan `matrix/migration-snapshot.json`; Doctor tetap dapat menggunakan kembali
  arsip pramigrasi tervalidasi yang sama tanpa menulis file status sidecar.
- Kursor bus dan status publikasi profil Nostr kini menggunakan status Plugin SQLite
  bersama. Rencana impor JSON lamanya berada dalam permukaan migrasi penyiapan/Doctor
  Plugin Nostr.
- Toggle sesi Active Memory kini menggunakan status Plugin SQLite bersama, bukan
  `session-toggles.json`; mengaktifkan kembali memori akan menghapus baris tersebut,
  bukan menulis ulang objek JSON.
- Proposal dan penghitung review Skill Workshop kini menggunakan status Plugin SQLite
  bersama, bukan penyimpanan `skill-workshop/<workspace>.json` per ruang kerja. Setiap
  proposal merupakan baris terpisah di bawah `skill-workshop/proposals`, dan penghitung
  review merupakan baris terpisah di bawah `skill-workshop/reviews`.
- Eksekusi subagen reviewer Skill Workshop kini menggunakan resolver transkrip sesi runtime,
  bukan membuat jalur sesi sidecar `skill-workshop/<sessionId>.json`.
- Sewa proses ACPX kini menggunakan status Plugin SQLite bersama di bawah
  `acpx/process-leases`, bukan registri seluruh file `process-leases.json`.
  Setiap sewa disimpan sebagai baris tersendiri, mempertahankan pembersihan proses usang saat startup
  tanpa jalur penulisan ulang JSON runtime.
- Skrip pembungkus ACPX dan home Codex terisolasi dibuat di
  root sementara OpenClaw. Keduanya dibuat ulang sesuai kebutuhan dan bukan input
  pencadangan atau migrasi.
- Persistensi registri eksekusi subagen menggunakan baris bersama bertipe `subagent_runs`.
  Jalur lama `subagents/runs.json` kini hanya menjadi input pembersihan Doctor. Doctor
  mengklaimnya di bawah kunci pemeliharaan status, mencatat keputusan pembuangan dalam
  SQLite, dan menghapusnya tanpa mengimpor status eksekusi sementara. Tidak ada pembaca,
  penulis, cache, atau fallback JSON runtime yang tersisa; pemulihan lintas versi atas
  eksekusi dalam proses yang hanya tersimpan dalam file sengaja tidak didukung pada batas penghentian ini.
  Pengujian runtime tidak lagi membuat fixture `runs.json` yang tidak valid atau kosong untuk membuktikan
  perilaku registri; pengujian langsung mengisi/membaca baris SQLite.
- Pencadangan menyiapkan direktori status sebelum pengarsipan, menyalin file non-database,
  membuat snapshot database dengan `VACUUM INTO`, mengecualikan sidecar WAL/SHM aktif, mencatat
  metadata snapshot dalam manifes arsip, dan mencatat
  eksekusi pencadangan yang selesai dalam SQLite bersama manifes arsip. `openclaw backup
create`
  memvalidasi arsip yang ditulis secara default; `--no-verify` adalah jalur cepat
  eksplisit.
- `openclaw backup restore` memvalidasi arsip sebelum ekstraksi, menggunakan kembali
  manifes ternormalisasi milik pemverifikasi, dan memulihkan aset manifes tervalidasi ke
  jalur sumber yang tercatat. Operasi tulis memerlukan `--yes` dan mendukung
  `--dry-run` untuk rencana pemulihan.
- Filter jalur volatil pencadangan lama telah dihapus. Pencadangan tidak lagi memerlukan
  daftar pengecualian tar aktif untuk file JSON/JSONL sesi atau Cron lama karena snapshot SQLite
  disiapkan sebelum pembuatan arsip.
- Penyiapan biasa dan persiapan ruang kerja orientasi tidak lagi membuat
  direktori `agents/<agentId>/sessions/`. Keduanya hanya membuat konfigurasi/ruang kerja;
  baris sesi SQLite dan baris transkrip dibuat sesuai kebutuhan dalam
  basis data per agen.
- Perbaikan izin keamanan kini menargetkan basis data SQLite global dan per agen
  beserta sidecar WAL/SHM, bukan file `sessions.json` dan transkrip
  JSONL.
- Nama runtime registri sandbox kini mendeskripsikan jenis registri SQLite secara langsung,
  alih-alih membawa terminologi registri JSON lama ke dalam penyimpanan aktif.
- `openclaw reset --scope config+creds+sessions` menghapus basis data
  `openclaw-agent.sqlite` per agen beserta sidecar WAL/SHM, bukan hanya direktori
  `sessions/` lama.
- Pembantu sesi agregat Gateway kini menggunakan nama yang berorientasi pada entri:
  `loadCombinedSessionEntriesForGateway` mengembalikan `{ databasePath, entries }`.
  Penamaan penyimpanan gabungan lama telah dihapus dari pemanggil runtime.
- Penyemaian kanal MCP Docker kini menulis baris sesi utama dan peristiwa transkrip
  ke dalam basis data SQLite per agen, alih-alih membuat
  `sessions.json` dan transkrip JSONL.
- Hook session-memory bawaan kini mengambil konteks sesi sebelumnya dari
  SQLite berdasarkan `{agentId, sessionId}`. Hook ini tidak lagi memindai, menyimpan, atau menyintesis
  jalur transkrip maupun direktori `workspace/sessions`.
- Hook command-logger bawaan kini menulis baris audit perintah ke tabel
  `command_log_entries` SQLite bersama, alih-alih menambahkan ke
  `logs/commands.log`.
- Daftar izin pemasangan kanal kini hanya mengekspos pembantu baca/tulis berbasis SQLite saat
  runtime. Pemecah jalur SDK plugin yang sudah tidak digunakan tetap tersedia demi kompatibilitas
  migrasi; pembaca file hanya berada dalam kode migrasi status doctor.
- `migration_runs` mencatat eksekusi migrasi status lama beserta status,
  stempel waktu, dan laporan JSON.
- `migration_sources` mencatat setiap sumber file lama yang diimpor beserta hash, ukuran,
  jumlah rekaman, tabel target, id proses, status, dan status penghapusan sumber.
- `backup_runs` mencatat jalur arsip cadangan, status, dan manifes JSON.
- Skema global tidak menyimpan tabel registri `agents` yang tidak digunakan. Penemuan
  basis data agen merupakan registri `agent_databases` kanonis hingga runtime
  memiliki pemilik rekaman agen yang nyata.
- Konfigurasi katalog model yang dihasilkan disimpan dalam baris SQLite global bertipe
  `agent_model_catalogs` yang dikunci berdasarkan direktori agen. Pemanggil runtime menggunakan
  `ensureOpenClawModelCatalog`; tidak ada API kompatibilitas `models.json` dalam
  kode runtime. Implementasi menulis ke SQLite dan registri PI tertanam
  dihidrasi dari muatan tersimpan tersebut tanpa membuat file `models.json`.
- Ekspor opsional `memory.qmd.sessions` membaca baris transkrip kanonis dari
  basis data per agen dan mewujudkan Markdown yang telah disanitasi di bawah beranda QMD
  sebagai artefak masukan QMD eksplisit. Oleh karena itu, koleksi sesi QMD dan pemetaan
  identitas artefak tetap menjadi bagian dari jembatan alat eksternal yang dikonfigurasi;
  keduanya bukan penyimpanan transkrip kanonis kedua.
- `index.sqlite` milik QMD sendiri, konfigurasi koleksi YAML, dan unduhan model tetap menjadi
  artefak alat eksternal di bawah `~/.openclaw/agents/<agentId>/qmd`; artefak tersebut tidak
  dicerminkan ke dalam `plugin_blob_entries`. Koordinasi QMD milik OpenClaw
  mengutamakan basis data: `state_leases` bersama menserialkan penyematan secara global dan
  `state_leases` per agen menserialkan penulis koleksi/pembaruan/penyematan. Runtime tidak membuat
  sidecar kunci QMD.
- Plugin opsional `memory-lancedb` tidak lagi membuat
  `~/.openclaw/memory/lancedb` sebagai penyimpanan implisit yang dikelola OpenClaw. Plugin ini merupakan
  backend LanceDB eksternal dan tetap dinonaktifkan hingga operator mengonfigurasi
  `dbPath` secara eksplisit.
- `check:database-first-legacy-stores` menggagalkan sumber runtime baru yang memasangkan
  nama penyimpanan lama dengan API sistem file bergaya tulis. Pemeriksaan ini juga menggagalkan sumber
  runtime yang memperkenalkan kembali penanda jembatan transkrip yang telah dihentikan,
  `transcriptLocator` atau `sqlite-transcript://...`. Kode migrasi, doctor, impor,
  dan ekspor eksplisit non-sesi tetap diizinkan. Nama kontrak lama yang lebih luas,
  seperti `sessionFile`, `storePath`, serta facade era file `SessionManager` lama,
  masih memiliki pemilik saat ini dan memerlukan pekerjaan pengaman migrasi terpisah
  sebelum dapat dijadikan pemeriksaan prapenerbangan wajib. Pengaman tersebut kini juga mencakup
  penyimpanan `cache/*.json` runtime, sidecar
  `thread-bindings.json` generik, JSON status/log proses cron, JSON kesehatan konfigurasi,
  sidecar mulai ulang dan kunci, pengaturan Voice Wake, persetujuan pengikatan plugin,
  JSON indeks plugin terpasang, JSONL audit File Transfer, log aktivitas Memory Wiki,
  log teks `command-logger` bawaan lama, serta kenop diagnostik JSONL aliran mentah pi-mono.
  Pengaman ini juga melarang nama modul lama doctor tingkat akar agar kode
  kompatibilitas tetap berada di bawah `src/commands/doctor/`. Penangan debug Android
  juga menggunakan keluaran logcat/dalam memori, alih-alih menampung file cache `camera_debug.log`
  atau `debug_logs.txt`.

## Bentuk Skema Target

Pertahankan skema tetap eksplisit. Status runtime milik host menggunakan tabel bertipe. Status buram milik Plugin menggunakan `plugin_state_entries` / `plugin_blob_entries`; tidak ada tabel `kv` host generik.

Basis data global:

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
skill_upload_chunks(upload_id, byte_offset, size_bytes, chunk_blob)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, relay_origin, topic, environment, distribution, token_debug_suffix, updated_at_ms)
apns_registration_tombstones(node_id, deleted_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, gateway_context_path, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
workspace_path_aliases(alias_key, alias_path, workspace_key, workspace_path, updated_at_ms)
workspace_attestations(workspace_key, attested_at_ms, updated_at_ms)
workspace_generated_bootstrap_hashes(workspace_key, filename, sha256)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, agent_id, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json, cleanup_pending)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

Basis data agen:

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
memory_index_sources(id, path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

`memory_index_sources.id` adalah kunci utama bilangan bulat yang stabil; `(path, source)` tetap unik.

Pencarian di masa mendatang dapat menambahkan tabel FTS tanpa mengubah tabel peristiwa kanonis:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Nilai besar harus menggunakan kolom `blob`, bukan pengodean string JSON. Pertahankan
`value_json` untuk data terstruktur kecil yang harus tetap dapat diperiksa dengan alat
SQLite biasa.

`agent_databases` adalah registri kanonis untuk cabang ini. Jangan tambahkan tabel
`agents` sampai ada pemilik rekaman agen yang nyata; konfigurasi agen tetap berada di
`openclaw.json`.

## Bentuk Migrasi Doctor

Doctor harus memanggil satu langkah migrasi eksplisit yang dapat dilaporkan dan aman untuk
dijalankan ulang:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` memanggil implementasi migrasi status setelah
pemeriksaan awal konfigurasi biasa dan membuat cadangan terverifikasi sebelum impor. Proses awal
runtime dan `openclaw migrate` tidak boleh mengimpor berkas status OpenClaw lama.

Properti migrasi:

- Satu proses migrasi menemukan semua sumber berkas lama dan menghasilkan rencana
  sebelum mengubah apa pun.
- Doctor membuat arsip cadangan pra-migrasi yang terverifikasi sebelum mengimpor
  berkas lama.
- Impor bersifat idempoten dan dikunci berdasarkan jalur sumber, mtime, ukuran, hash, serta tabel
  target.
- Berkas sumber yang berhasil diproses dihapus atau diarsipkan setelah basis data target
  melakukan commit.
- Impor yang gagal membiarkan sumber tetap tidak berubah dan mencatat peringatan di
  `migration_runs`.
- Kode runtime hanya membaca SQLite setelah migrasi tersedia.
- Tidak diperlukan jalur penurunan versi/ekspor-ke-berkas-runtime.

## Inventaris Migrasi

Pindahkan item berikut ke basis data global:

- Penulisan runtime registri tugas kini menggunakan basis data bersama; pengimpor sidecar
  `tasks/runs.sqlite` yang belum dirilis telah dihapus. Penyimpanan snapshot melakukan upsert berdasarkan
  id tugas dan hanya menghapus baris tugas/pengiriman yang tidak ada.
- Penulisan runtime Task Flow kini menggunakan basis data bersama; pengimpor sidecar
  `tasks/flows/registry.sqlite` yang belum dirilis telah dihapus. Penyimpanan snapshot
  melakukan upsert berdasarkan id alur dan hanya menghapus baris alur yang tidak ada.
- Penulisan runtime status Plugin kini menggunakan basis data bersama; pengimpor sidecar
  `plugin-state/state.sqlite` yang belum dirilis telah dihapus.
- Pencarian memori bawaan tidak lagi menetapkan `memory/<agentId>.sqlite` sebagai default; tabel
  indeksnya berada dalam basis data agen pemilik, dan keikutsertaan eksplisit untuk sidecar
  `memorySearch.store.path` telah dihentikan dan dialihkan ke migrasi konfigurasi doctor.
- Pengindeksan ulang memori bawaan hanya mereset tabel milik memori dalam basis data agen.
  Proses ini tidak boleh mengganti seluruh berkas SQLite karena basis data yang sama memiliki
  sesi, transkrip, baris VFS, artefak, dan cache runtime.
- Registri kontainer/browser sandbox dari JSON monolitik dan tersharding. Penulisan
  runtime kini menggunakan basis data bersama; impor JSON lama tetap tersedia.
- Definisi tugas Cron, status jadwal, dan riwayat eksekusi kini menggunakan SQLite bersama;
  doctor mengimpor/menghapus berkas `jobs.json`, `jobs-state.json`, dan
  `cron/runs/*.jsonl`
- Identitas/autentikasi perangkat, push, pemeriksaan pembaruan, komitmen, cache model
  OpenRouter, indeks plugin terinstal, dan pengikatan server aplikasi
- Catatan pemasangan perangkat/node dan bootstrap kini menggunakan tabel SQLite bertipe
- Pelanggan notifikasi pemasangan perangkat dan penanda permintaan yang telah dikirim kini menggunakan
  tabel status plugin SQLite bersama, bukan `device-pair-notify.json`.
- Catatan panggilan suara kini menggunakan tabel status plugin SQLite bersama dalam namespace
  `voice-call` / `calls`, bukan `calls.jsonl`; CLI plugin
  mengikuti dan merangkum riwayat panggilan yang didukung SQLite.
- Sesi gateway QQBot, catatan pengguna yang dikenal, dan cache kutipan indeks referensi kini menggunakan
  status plugin SQLite dalam namespace `qqbot` (`gateway-sessions`,
  `known-users`, `ref-index`), bukan `session-*.json`, `known-users.json`,
  dan `ref-index.jsonl`. Berkas lama tersebut merupakan cache dan tidak dimigrasikan.
- Preferensi pemilih model Discord, hash penerapan perintah, dan pengikatan utas
  kini menggunakan status plugin SQLite dalam namespace `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`),
  bukan `model-picker-preferences.json`, `command-deploy-cache.json`, dan
  `thread-bindings.json`; migrasi doctor/penyiapan Discord mengimpor dan
  menghapus berkas lama.
- Kursor penyelarasan BlueBubbles dan penanda deduplikasi masuk kini menggunakan status plugin
  SQLite dalam namespace `bluebubbles` (`catchup-cursors`, `inbound-dedupe`),
  bukan `bluebubbles/catchup/*.json` dan
  `bluebubbles/inbound-dedupe/*.json`; migrasi doctor/penyiapan BlueBubbles
  mengimpor dan menghapus berkas lama.
- Offset pembaruan Telegram, entri cache stiker, entri cache pesan rantai
  balasan, entri cache pesan terkirim, entri cache nama topik, dan pengikatan utas
  kini menggunakan status plugin SQLite dalam namespace `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`), bukan `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json`, dan
  `thread-bindings-*.json`; migrasi doctor/penyiapan Telegram mengimpor dan
  menghapus berkas lama.
- Kursor penyelarasan iMessage, pemetaan id pendek balasan, dan baris deduplikasi gema terkirim
  kini menggunakan status plugin SQLite dalam namespace `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`), bukan `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl`, dan `imessage/sent-echoes.jsonl`; migrasi
  doctor/penyiapan iMessage mengimpor dan menghapus berkas lama.
- Percakapan, polling, token SSO, dan pembelajaran umpan balik Microsoft Teams kini
  menggunakan namespace status plugin SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`), bukan `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json`, dan `*.learnings.json`; migrasi
  doctor/penyiapan Microsoft Teams mengimpor dan mengarsipkan berkas lama.
  Unggahan tertunda merupakan cache SQLite berumur pendek dan berkas cache JSON lama
  tidak dimigrasikan.
- Cache sinkronisasi Matrix, metadata penyimpanan, pengikatan utas, penanda deduplikasi masuk,
  status waktu tunggu verifikasi awal, kredensial, kunci pemulihan, dan snapshot kripto
  IndexedDB SDK kini menggunakan namespace blob/status plugin SQLite dalam
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`,
  `matrix.inbound-dedupe.*` melalui deduplikasi inti yang dapat diklaim,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`),
  bukan `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json`, dan `crypto-idb-snapshot.json`; migrasi doctor/penyiapan Matrix
  mengimpor dan menghapus berkas lama tersebut (serta baris SQLite `inbound-dedupe`
  per-root yang telah dihentikan) dari root penyimpanan Matrix berskala akun.
- Kursor bus Nostr dan status penerbitan profil kini menggunakan status plugin SQLite dalam
  namespace `nostr` (`bus-state`, `profile-state`), bukan
  `bus-state-*.json` dan `profile-state-*.json`; migrasi doctor/penyiapan
  Nostr mengimpor dan menghapus berkas lama.
- Pengalih sesi Active Memory kini menggunakan status plugin SQLite dalam
  `active-memory/session-toggles`, bukan `session-toggles.json`.
- Antrean proposal dan penghitung review Skill Workshop kini menggunakan status plugin SQLite
  dalam `skill-workshop/proposals` dan `skill-workshop/reviews`, bukan
  berkas `skill-workshop/<workspace>.json` per ruang kerja.
- Antrean pengiriman keluar dan pengiriman sesi kini berbagi tabel SQLite global
  `delivery_queue_entries` dengan nama antrean terpisah
  (`outbound-delivery`, `session-delivery`), bukan berkas persisten
  `delivery-queue/*.json`, `delivery-queue/failed/*.json`, dan
  `session-delivery-queue/*.json`. Langkah status lama doctor mengimpor
  baris tertunda dan gagal, menghapus penanda terkirim yang kedaluwarsa, serta menghapus berkas
  JSON lama setelah impor. Bidang perutean langsung dan percobaan ulang merupakan kolom bertipe;
  payload JSON dipertahankan hanya untuk pemutaran ulang/debug.
- Sewa proses ACPX kini menggunakan status plugin SQLite dalam `acpx/process-leases`,
  bukan `process-leases.json`.
- Metadata eksekusi pencadangan dan migrasi

Pindahkan ini ke basis data agen:

- Root sesi agen dan payload entri sesi berbentuk kompatibilitas. Selesai untuk
  penulisan runtime: metadata sesi aktif dapat dikueri di `sessions`, sedangkan
  payload lengkap `SessionEntry` berbentuk lama tetap berada di `session_entries`.
- Peristiwa transkrip agen. Selesai untuk penulisan runtime.
- Checkpoint Compaction dan snapshot transkrip. Selesai untuk penulisan runtime:
  salinan transkrip checkpoint merupakan baris transkrip SQLite dan metadata checkpoint
  dicatat dalam `transcript_snapshots`. Pembantu checkpoint Gateway
  kini menamai nilai-nilai ini sebagai snapshot transkrip, bukan berkas sumber.
- Namespace sementara/ruang kerja VFS agen. Selesai untuk penulisan VFS runtime.
- Payload lampiran subagen. Selesai untuk penulisan runtime: payload tersebut merupakan entri seed
  VFS SQLite dan tidak pernah menjadi berkas ruang kerja persisten.
- Artefak alat. Selesai untuk penulisan runtime.
- Artefak eksekusi. Selesai untuk penulisan runtime pekerja melalui tabel per agen
  `run_artifacts`.
- Cache runtime lokal agen. Selesai untuk penulisan cache berskala runtime pekerja melalui
  tabel per agen `cache_entries`. Cache model berskala Gateway tetap berada dalam
  basis data global kecuali cache tersebut menjadi khusus agen.
- Log aliran induk ACP. Selesai untuk penulisan runtime.
- Sesi ledger pemutaran ulang ACP. Selesai untuk penulisan runtime melalui
  `acp_replay_sessions` dan `acp_replay_events`; `acp/event-ledger.json` lama
  hanya dipertahankan sebagai input doctor.
- Metadata sesi ACP. Selesai untuk penulisan runtime melalui `acp_sessions`; blok lama
  `entry.acp` dalam `sessions.json` hanya merupakan input migrasi doctor.
- Sidecar trajektori ketika bukan berkas ekspor eksplisit. Selesai untuk penulisan
  runtime: pengambilan trajektori menulis baris `trajectory_runtime_events`
  basis data agen dan mencerminkan artefak berskala eksekusi ke SQLite. Sidecar lama hanya merupakan
  input impor doctor; ekspor dapat menghasilkan keluaran bundel dukungan JSONL baru,
  tetapi tidak membaca atau memigrasikan sidecar trajektori/transkrip lama saat runtime.
  Pengambilan trajektori runtime mengekspos cakupan SQLite; pembantu jalur JSONL
  diisolasi untuk dukungan ekspor/debug dan tidak diekspor ulang dari modul runtime.
  Metadata trajektori runner tertanam mencatat identitas `{agentId, sessionId, sessionKey}`,
  bukan mempertahankan pencari lokasi transkrip.

Pertahankan yang berikut dengan dukungan berkas untuk saat ini:

- `openclaw.json`
- berkas kredensial penyedia atau CLI
- manifes plugin/paket
- ruang kerja pengguna dan repositori Git ketika mode disk dipilih
- log yang ditujukan untuk dipantau operator, kecuali permukaan log tertentu dipindahkan

## Rencana Migrasi

### Fase 0: Bekukan Batas

Tegaskan batas status persisten sebelum memindahkan lebih banyak baris:

- Tambahkan tabel `migration_runs` ke basis data global.
  Selesai untuk laporan eksekusi migrasi status lama.
- Tambahkan satu layanan migrasi status milik doctor untuk impor berkas-ke-basis-data.
  Selesai: `openclaw doctor --fix` menggunakan implementasi migrasi status lama.
- Jadikan `plan` hanya-baca dan buat `apply` membuat cadangan, mengimpor, memverifikasi, lalu
  menghapus atau mengarantina berkas lama.
  Selesai: doctor membuat cadangan pra-migrasi yang telah diverifikasi, meneruskan jalur cadangan
  ke `migration_runs`, dan menggunakan kembali jalur pengimpor/penghapusan.
- Tambahkan larangan statis agar kode runtime baru tidak dapat menulis berkas status lama, sementara
  kode migrasi dan pengujian tetap dapat melakukan seed/membacanya.
  Selesai untuk penyimpanan lama yang saat ini telah dimigrasikan; penjaga juga memindai
  pengujian bertingkat untuk mencari kontrak pencari lokasi transkrip runtime yang dilarang.

### Fase 1: Selesaikan Bidang Kontrol Global

Pertahankan status koordinasi bersama dalam `state/openclaw.sqlite`:

- Agen dan registri basis data agen
- Ledger tugas dan Task Flow
- Status Plugin
- Registri kontainer/browser sandbox
- Riwayat eksekusi Cron/penjadwal
- Pemasangan, perangkat, push, pemeriksaan pembaruan, TUI, cache OpenRouter/model, dan status
  runtime kecil berskala gateway lainnya
- Metadata pencadangan dan migrasi
- Byte lampiran media Gateway. Selesai untuk penulisan runtime; jalur berkas langsung
  merupakan materialisasi sementara untuk kompatibilitas dengan pengirim saluran dan staging
  sandbox. Daftar izin runtime menerima jalur materialisasi SQLite, bukan root media
  status/konfigurasi lama. Doctor mengimpor berkas media lama ke
  `media_blobs` dan menghapus berkas sumber setelah penulisan baris berhasil.
- Sesi pengambilan proxy debug, peristiwa, dan blob payload. Selesai: pengambilan berada
  dalam DB status bersama dan dibuka melalui bootstrap, skema, WAL, serta pengaturan
  batas waktu sibuk DB status bersama. Byte payload dikompresi dengan gzip dalam
  `capture_blobs.data`; tidak ada penggantian DB sidecar runtime proxy debug,
  direktori blob, atau target skema/codegen yang dihasilkan khusus pengambilan proxy.
  Migrasi doctor/awal mengimpor baris `debug-proxy/capture.sqlite` yang telah dirilis
  dan blob payload yang dirujuk, termasuk penggantian lingkungan DB/blob lama yang aktif,
  lalu mengarsipkan sumber tersebut tanpa mengubah sertifikat CA.

Fase ini juga menghapus pembuka sidecar duplikat, pembantu izin, penyiapan
WAL, pemangkasan sistem berkas, dan penulis kompatibilitas dari subsistem tersebut.

### Fase 2: Memperkenalkan Basis Data Per Agen

Buat satu basis data per agen dan daftarkan dari DB global:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

Baris `agent_databases` global menyimpan jalur, versi skema, stempel waktu
terakhir terlihat, serta metadata dasar ukuran/integritas. Kode runtime meminta DB
agen dari registri alih-alih menurunkan jalur berkas secara langsung.

DB agen memiliki:

- `sessions` sebagai akar sesi kanonis, dengan `session_entries` sebagai
  tabel payload berbentuk kompatibilitas yang terhubung ke akar tersebut, dan
  `session_routes` sebagai pencarian `session_key` aktif yang unik
- `conversations` dan `session_conversations` sebagai identitas perutean
  penyedia ternormalisasi yang terhubung ke sesi
- `transcript_events`
- snapshot transkrip dan titik pemeriksaan Compaction. Selesai untuk penulisan runtime.
- `vfs_entries`
- `tool_artifacts` dan artefak eksekusi
- baris runtime/cache lokal agen. Selesai untuk cache dengan cakupan worker.
- peristiwa aliran induk ACP
- peristiwa runtime lintasan ketika bukan artefak ekspor eksplisit

### Fase 3: Mengganti API Penyimpanan Sesi

Selesai untuk runtime. Permukaan penyimpanan sesi berbentuk berkas bukan kontrak
runtime aktif:

- Runtime tidak lagi memanggil `loadSessionStore(storePath)` atau memperlakukan `storePath` sebagai
  identitas sesi.
- Operasi baris runtime adalah `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry`, dan `listSessionEntries`.
- Pembantu penulisan ulang seluruh penyimpanan, penulis berkas, pengujian antrean, pemangkasan alias, dan
  parameter penghapusan kunci lama telah dihapus dari runtime.
- Ekspor kompatibilitas paket akar yang tidak digunakan lagi masih mengadaptasi jalur
  `sessions.json` kanonis ke API baris SQLite.
- Penguraian `sessions.json` hanya tetap ada dalam kode migrasi/impor doctor dan
  pengujian doctor.
- Pembacaan fallback siklus hidup runtime membaca header transkrip SQLite, bukan baris pertama
  JSONL.

Terus hapus apa pun yang memperkenalkan kembali parameter penguncian berkas,
kosakata pemangkasan/pemotongan sebagai pemeliharaan berkas, identitas jalur penyimpanan, atau pengujian
yang satu-satunya asersinya adalah persistensi JSON.

### Fase 4: Memindahkan Transkrip, Aliran ACP, Lintasan, dan VFS

Jadikan setiap aliran data agen bersifat native basis data:

- Penulisan penambahan transkrip melalui satu transaksi SQLite yang memastikan
  header sesi, memeriksa idempotensi pesan, memilih ujung induk, menyisipkan
  ke `transcript_events`, dan mencatat metadata identitas yang dapat dikueri dalam
  `transcript_event_identities`. Selesai untuk penambahan pesan transkrip langsung dan
  penambahan `TranscriptSessionManager` tersimpan normal; operasi cabang eksplisit
  mempertahankan pilihan induk eksplisitnya dan tetap menulis baris SQLite
  tanpa menurunkan pencari berkas apa pun.
- Log aliran induk ACP menjadi baris, bukan berkas `.acp-stream.jsonl`. Selesai.
- Penyiapan spawn ACP tidak lagi menyimpan jalur JSONL transkrip. Selesai.
- Pengambilan lintasan runtime menulis baris peristiwa/artefak secara langsung. Perintah
  dukungan/ekspor eksplisit masih dapat menghasilkan artefak JSONL bundel dukungan sebagai
  format ekspor, tetapi ekspor sesi tidak membuat ulang JSONL sesi. Selesai.
- Ruang kerja disk tetap berada di disk ketika dikonfigurasi sebagai mode disk.
- Ruang sementara VFS dan mode ruang kerja eksperimental khusus VFS menggunakan DB agen.

Migrasi mengimpor berkas JSONL lama satu kali, mencatat jumlah/hash dalam
`migration_runs`, dan menghapus berkas yang diimpor setelah pemeriksaan integritas.

### Fase 5: Pencadangan, Pemulihan, Vacuum, dan Verifikasi

Cadangan tetap berupa satu berkas arsip:

- Buat titik pemeriksaan untuk setiap basis data global dan agen.
- Buat snapshot setiap DB dengan semantik pencadangan SQLite atau `VACUUM INTO`.
- Arsipkan snapshot DB ringkas, konfigurasi, kredensial eksternal, dan ekspor
  ruang kerja yang diminta.
- Hilangkan berkas live mentah `*.sqlite-wal` dan `*.sqlite-shm`.
- Verifikasi dengan membuka setiap snapshot DB dan menjalankan `PRAGMA integrity_check`.
  `openclaw backup create` melakukan verifikasi arsip ini secara default;
  `--no-verify` hanya melewati tahap arsip pascapenulisan, bukan pemeriksaan
  integritas pembuatan snapshot.
- Pemulihan menyalin kembali snapshot ke jalur targetnya. DB global yang dipulihkan menggunakan
  versi `1`; DB per agen yang dipulihkan menggunakan versi `2`, dengan snapshot versi `1`
  ditingkatkan secara atomik saat dibuka.

### Fase 6: Runtime Worker

Pertahankan mode worker sebagai eksperimental selama pemisahan basis data diterapkan:

- Worker menerima ID agen, ID eksekusi, mode sistem berkas, dan identitas registri DB.
- Setiap worker membuka koneksi SQLite-nya sendiri.
- Induk mempertahankan otoritas pengiriman saluran, persetujuan, konfigurasi, dan pembatalan.
- Mulai dengan satu worker per eksekusi aktif; tambahkan pengumpulan hanya setelah siklus hidup dan
  kepemilikan koneksi DB stabil.

### Fase 7: Menghapus Dunia Lama

Selesai untuk pengelolaan sesi runtime. Dunia lama hanya diizinkan sebagai masukan
doctor eksplisit atau keluaran dukungan/ekspor:

- Tidak ada penulisan runtime `sessions.json`, JSONL transkrip, JSON registri sandbox, SQLite
  sidecar tugas, atau SQLite sidecar status Plugin.
- Tidak ada pemangkasan berkas JSON/sesi, pemotongan transkrip berkas, penguncian berkas sesi,
  atau pengujian sesi berbentuk penguncian.
- Tidak ada ekspor kompatibilitas runtime yang bertujuan menjaga berkas sesi lama
  tetap mutakhir.
- Ekspor dukungan eksplisit tetap merupakan format arsip/materialisasi yang diminta pengguna
  dan tidak boleh memasukkan kembali nama berkas ke identitas runtime.

## Pencadangan dan Pemulihan

Cadangan seharusnya berupa satu berkas arsip, tetapi pengambilan basis data seharusnya
bersifat native SQLite:

1. Hentikan aktivitas penulisan jangka panjang atau masuki penghalang pencadangan singkat.
2. Untuk setiap basis data global dan agen, jalankan titik pemeriksaan.
3. Buat snapshot basis data dengan `VACUUM INTO` ke direktori pencadangan sementara.
   Skema Plugin yang memerlukan kapabilitas SQLite yang ditentukan pemilik gagal secara tertutup
   hingga pemilik menyediakan kontrak snapshot yang aman.
4. Arsipkan snapshot basis data, berkas konfigurasi, direktori kredensial, ruang kerja
   yang dipilih, dan manifes.
5. Verifikasi bentuk berkas setiap snapshot SQLite, lalu buka basis data OpenClaw
   kanonis dan jalankan `PRAGMA integrity_check` beserta validasi peran. Skema
   Plugin khusus tetap buram kecuali pemiliknya menyediakan pemverifikasi.
   `openclaw backup create` melakukan ini secara default; `--no-verify` hanya untuk
   melewati tahap arsip pascapenulisan secara sengaja.

Jangan mengandalkan salinan live mentah `*.sqlite`, `*.sqlite-wal`, dan `*.sqlite-shm` sebagai
format pencadangan utama. Manifes arsip harus mencatat peran basis data,
ID agen, versi skema, jalur sumber, jalur snapshot, ukuran byte, dan status
integritas.

Pemulihan harus membangun ulang berkas basis data global dan basis data agen dari
snapshot arsip. Skema global tetap pada versi `1`; snapshot per agen versi `1`
menerima peningkatan runtime terbatas ke versi `2`. Doctor tetap menjadi
satu-satunya pemilik impor berkas ke basis data. Perintah pemulihan memvalidasi
arsip terlebih dahulu, lalu mengganti setiap aset manifes dari payload terekstrak
yang telah diverifikasi.

## Rencana Refaktor Runtime

1. Tambahkan API registri basis data.
   - Selesaikan jalur DB global dan DB per agen.
   - Pertahankan skema global pada `user_version = 1`. DB per agen menggunakan versi `2`
     dengan satu migrasi atomik dari bentuk sumber memori versi `1` yang telah dirilis.
   - Tambahkan pembantu penutupan/titik pemeriksaan/integritas yang digunakan oleh pengujian, pencadangan, dan doctor.

2. Satukan penyimpanan SQLite sidecar.
   - Pindahkan tabel status Plugin ke basis data global. Selesai untuk penulisan
     runtime; pengimpor sidecar lama yang belum dirilis telah dihapus.
   - Pindahkan tabel registri tugas ke basis data global. Selesai untuk penulisan
     runtime; pengimpor sidecar lama yang belum dirilis telah dihapus.
   - Pindahkan tabel Task Flow ke basis data global. Selesai untuk penulisan runtime;
     pengimpor sidecar lama yang belum dirilis telah dihapus.
   - Pindahkan tabel pencarian memori bawaan ke setiap basis data agen. Selesai; `memorySearch.store.path`
     kustom eksplisit kini dihapus oleh migrasi konfigurasi doctor.
     Pengindeksan ulang penuh berjalan di tempat hanya terhadap tabel memori; jalur pertukaran
     seluruh berkas lama dan pembantu pertukaran indeks sidecar telah dihapus.
   - Hapus pembuka basis data duplikat, penyiapan WAL, pembantu izin, dan
     jalur penutupan dari subsistem tersebut.

3. Pindahkan tabel milik agen ke basis data per agen.
   - Buat DB agen sesuai permintaan melalui registri basis data global. Selesai.
   - Pindahkan entri sesi runtime, peristiwa transkrip, baris VFS, dan artefak
     alat ke DB agen. Selesai.
   - Jangan migrasikan entri sesi DB bersama lokal cabang, peristiwa transkrip,
     baris VFS, atau artefak alat; tata letak tersebut tidak pernah dirilis. Pertahankan hanya
     impor berkas ke basis data lama dalam doctor.

4. Ganti API penyimpanan sesi.
   - Hapus `storePath` sebagai identitas runtime. Selesai untuk runtime dan dijaga
     oleh `check:database-first-legacy-stores`: metadata sesi, pembaruan rute,
     persistensi perintah, pembersihan sesi CLI, pratinjau penalaran Feishu,
     persistensi status transkrip, kedalaman subagen, penggantian profil autentikasi
     sesi, logika fork induk, dan inspeksi QA-lab kini menyelesaikan
     basis data dari kunci agen/sesi kanonis.
     Respons daftar sesi Gateway/TUI/UI/macOS kini mengekspos `databasePath`
     alih-alih `path` lama; permukaan debug macOS menampilkan basis data per agen
     sebagai status hanya-baca alih-alih menulis konfigurasi `session.store`.
     `/status`, ekspor lintasan berbasis obrolan, dan proksi dependensi CLI tidak
     lagi meneruskan jalur penyimpanan lama; fallback penggunaan transkrip membaca
     SQLite berdasarkan identitas agen/sesi. Pengujian runtime dan bridge tidak lagi mengekspos
     `storePath`; masukan doctor/migrasi memiliki nama bidang lama tersebut.
     Pemuatan sesi gabungan Gateway tidak lagi memiliki cabang runtime khusus untuk
     nilai `session.store` tanpa templat; pemuatan tersebut mengagregasi baris SQLite per agen.
     Jalur doctor penguncian sesi lama dan pembantu pembersihan `.jsonl.lock`-nya
     telah dihapus; SQLite kini menjadi batas konkurensi sesi.
     Situs pemanggilan runtime aktif menggunakan nama pembantu berorientasi baris seperti
     `resolveSessionRowEntry`; alias kompatibilitas lama `resolveSessionStoreEntry`
     telah dihapus dari ekspor runtime dan SDK Plugin.

- Gunakan operasi baris `{ agentId, sessionKey }`.
  Selesai: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry`, dan `listSessionEntries` adalah API yang mengutamakan SQLite dan
  tidak memerlukan jalur penyimpanan sesi. Ringkasan status, status agen lokal, kesehatan,
  dan perintah daftar `openclaw sessions` kini membaca baris per agen secara langsung
  dan menampilkan jalur basis data SQLite per agen alih-alih jalur `sessions.json`.
- Ganti penghapusan/penyisipan seluruh penyimpanan dengan `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries`, dan kueri pembersihan SQL.
  Selesai untuk runtime: jalur aktif kini menggunakan API baris dan patch baris dengan percobaan ulang konflik;
  pembantu impor/penggantian seluruh penyimpanan yang tersisa dibatasi pada kode impor
  migrasi dan pengujian backend SQLite.
  - Hapus `store-writer.ts` dan pengujian antrean penulis. Selesai.
  - Hapus pemangkasan kunci lama runtime dan parameter penghapusan alias dari upsert/patch
    baris sesi. Selesai.

5. Hapus perilaku registri JSON runtime.
   - Jadikan pembacaan dan penulisan registri sandbox hanya menggunakan SQLite. Selesai.
   - Impor JSON monolitik dan tersharding hanya dari langkah migrasi. Selesai.
   - Hapus kunci registri tersharding dan penulisan JSON. Selesai.

- Pertahankan satu tabel registri bertipe alih-alih menyimpan baris registri sebagai JSON
  buram generik jika bentuknya tetap merupakan status operasional jalur panas. Selesai.

6. Hapus mutasi sesi yang berbentuk penguncian berkas.
   - Selesai untuk pembuatan kunci runtime dan API kunci runtime.
   - Jalur pembersihan doctor lama mandiri `.jsonl.lock` telah dihapus.
   - Integritas status tidak lagi memiliki jalur terpisah untuk memangkas berkas
     transkrip yatim; migrasi doctor mengimpor/menghapus sumber JSONL lama di satu tempat.
   - Koordinasi singleton Gateway menggunakan baris SQLite bertipe `state_leases` di bawah
     `gateway_locks` dan tidak lagi mengekspos celah direktori penguncian berkas.
   - Persistensi deduplikasi SDK plugin generik tidak lagi menggunakan kunci berkas atau berkas
     JSON; persistensi tersebut menulis baris status plugin SQLite bersama. Selesai.
   - Koordinasi QMD menggunakan lease SQLite bersama untuk penyematan dan lease SQLite
     per agen untuk setiap penulis koleksi/pembaruan/penyematan. Runtime tidak lagi
     membuat `qmd/embed.lock.lock` atau `agents/<agentId>/qmd-write.lock.lock`;
     Doctor hanya menghapus sidecar lama yang dipastikan sudah usang. Selesai.

7. Jadikan worker sadar basis data.
   - Worker membuka koneksi SQLite mereka sendiri.
   - Induk memiliki pengiriman, callback kanal, dan konfigurasi.
   - Worker menerima id agen, id proses, mode sistem berkas, dan identitas registri
     DB, bukan handle aktif.
   - `vfs-only` tetap eksperimental dan menggunakan basis data agen sebagai akar
     penyimpanannya.
   - Pertahankan satu worker per proses aktif terlebih dahulu. Pooling dapat menunggu hingga masa pakai
     koneksi DB dan perilaku pembatalan menjadi stabil.

8. Integrasi pencadangan.
   - Ajarkan pencadangan untuk membuat snapshot basis data global, agen, dan plugin dengan
     `VACUUM INTO`. Selesai untuk berkas `*.sqlite` yang ditemukan di bawah aset status;
     skema plugin yang memerlukan kapabilitas pemilik yang tidak tersedia akan gagal secara tertutup.
   - Tambahkan verifikasi pencadangan untuk integritas SQLite kanonis dan identitas skema,
     serta validasi bentuk berkas generik untuk snapshot plugin khusus. Selesai untuk
     pembuatan cadangan dan verifikasi arsip default.
   - Catat metadata proses pencadangan di SQLite. Selesai melalui tabel bersama `backup_runs`
     dengan jalur arsip, status, dan JSON manifes.
   - Tambahkan pemulihan dari snapshot arsip terverifikasi. Selesai: `openclaw backup
restore` memvalidasi sebelum ekstraksi, menggunakan manifes
     ternormalisasi dari pemverifikasi, mendukung `--dry-run`, dan mewajibkan `--yes` sebelum mengganti
     jalur sumber yang tercatat.
   - Sertakan ekspor VFS/ruang kerja hanya jika diminta; jangan mengekspor internal
     sesi sebagai JSON atau JSONL.

9. Hapus pengujian dan kode usang. Selesai untuk permukaan sesi runtime yang diketahui.

- Hapus pengujian yang menegaskan pembuatan `sessions.json` atau berkas JSONL
  transkrip oleh runtime. Selesai untuk penyimpanan sesi inti, obrolan, peristiwa transkrip Gateway,
  pratinjau, siklus hidup, pembaruan entri sesi perintah, reset/jejak balasan otomatis, dan
  fixture Dreaming memory-core, perutean target persetujuan, perbaikan transkrip
  sesi, perbaikan izin keamanan, ekspor lintasan, dan ekspor sesi.
  Pengujian transkrip Active Memory kini menegaskan cakupan SQLite dan tidak adanya pembuatan
  berkas JSONL sementara maupun persisten.
  Regresi pemangkasan transkrip Heartbeat lama dihapus karena
  runtime tidak lagi memangkas transkrip JSONL.
  Pengujian alat daftar sesi agen tidak lagi memodelkan jalur lama `sessions.json`
  sebagai bentuk respons Gateway; pengujian aplikasi/UI/macOS menggunakan `databasePath`.
  Pengujian penggunaan transkrip `/status` kini mengisi baris transkrip SQLite secara langsung
  alih-alih menulis berkas JSONL.
  Pengujian siklus hidup sesi Gateway kini menggunakan helper pengisian transkrip SQLite
  secara langsung; bentuk fixture berkas sesi satu baris lama telah dihapus dari cakupan
  reset dan penghapusan.
  `sessions.delete` tidak lagi mengembalikan kolom era berkas `archived: []`; penghapusan
  hanya melaporkan hasil mutasi baris. Opsi lama `deleteTranscript` juga
  telah dihapus: menghapus sesi akan menghapus akar kanonis `sessions` dan memungkinkan
  SQLite menghapus secara berantai baris transkrip, snapshot, dan lintasan milik sesi, sehingga tidak ada
  pemanggil yang dapat meninggalkan transkrip yatim atau melupakan cabang pembersihan.
  Pengujian pengambilan lintasan mesin konteks kini membaca baris `trajectory_runtime_events`
  dari basis data agen yang terisolasi alih-alih membaca
  `session.trajectory.jsonl`.
  Skrip pengisian kanal MCP Docker kini mengisi baris SQLite secara langsung. Penulisan langsung
  `sessions.json` dibatasi pada fixture doctor.
  E2E Gateway Pencarian Alat membaca bukti pemanggilan alat dari baris transkrip SQLite
  alih-alih memindai berkas `agents/<agentId>/sessions/*.jsonl`.
  Peristiwa host memory-core dan baris sementara korpus sesi kini berada di
  status plugin SQLite bersama; `events.jsonl` dan `session-corpus/*.txt` hanyalah input migrasi
  doctor lama. Baris aktif menggunakan jalur virtual `memory/session-ingestion/`,
  bukan `.dreams/session-corpus`. Modul perbaikan Dreaming memory-core lama
  beserta pengujian CLI/Gateway-nya dihapus karena runtime tidak lagi
  memiliki perbaikan arsip berkas untuk korpus tersebut. Pengujian artefak
  jembatan/publik memory-core tidak lagi menampilkan `.dreams/events.jsonl`; pengujian tersebut
  menggunakan nama artefak JSON virtual yang didukung SQLite.
  Dokumentasi pengujian SDK/Codex publik kini menyebut status sesi SQLite alih-alih berkas
  sesi, dan contoh giliran kanal tidak lagi mengekspos argumen `storePath`.
  Status sinkronisasi Matrix kini menggunakan penyimpanan status plugin SQLite secara langsung. Kontrak
  klien/runtime aktif meneruskan akar penyimpanan akun, bukan jalur `bot-storage.json`,
  dan doctor mengimpor `bot-storage.json` lama ke SQLite sebelum menghapus
  sumbernya. Skenario restart/destruktif Matrix di QA Lab kini memutasi baris sinkronisasi SQLite
  secara langsung alih-alih membuat atau menghapus berkas `bot-storage.json` palsu, dan
  substrat E2EE meneruskan akar penyimpanan sinkronisasi alih-alih jalur
  `sync-store.json` palsu.
  Pemilihan akar penyimpanan Matrix tidak lagi memberi skor pada akar berdasarkan berkas JSON
  sinkronisasi/utas lama; pemilihan tersebut menggunakan metadata akar persisten serta status kriptografi nyata.
  Suite pengujian backend sesi SQLite runtime tidak lagi membuat
  `sessions.json`; fixture sumber lama kini berada dalam pengujian doctor
  yang mengimpornya.
  Pengujian sesi Gateway tidak lagi mengekspos helper `createSessionStoreDir` atau
  penyiapan jalur penyimpanan sesi sementara yang tidak digunakan; direktori fixture bersifat eksplisit, dan penyiapan
  baris langsung menggunakan penamaan baris sesi SQLite.
  Cakupan parser penyimpanan sesi JSON5 khusus doctor dipindahkan dari pengujian infrastruktur
  ke pengujian migrasi doctor, sehingga suite pengujian runtime tidak lagi memiliki
  penguraian berkas sesi lama.
  Pengujian runtime SSO/unggahan tertunda Microsoft Teams tidak lagi membawa fixture
  atau parser sidecar JSON; penguraian token SSO lama hanya berada dalam modul
  migrasi plugin. Pengujian Telegram tidak lagi mengisi jalur penyimpanan `/tmp/*.json`
  palsu; pengujian tersebut mereset cache pesan yang didukung SQLite secara langsung. Helper
  status pengujian OpenClaw generik tidak lagi mengekspos penulis lama `auth-profiles.json`;
  pengujian migrasi autentikasi doctor memiliki fixture tersebut secara lokal.
  Pengujian runtime untuk penunjuk sesi terakhir TUI, persetujuan eksekusi, pengalih Active Memory,
  verifikasi deduplikasi/startup Matrix, sinkronisasi sumber Memory Wiki,
  pengikatan percakapan saat ini, autentikasi onboarding, dan impor rahasia Hermes tidak
  lagi membuat berkas sidecar lama atau menegaskan bahwa nama berkas lama tidak ada. Pengujian tersebut
  membuktikan perilaku melalui baris SQLite dan API penyimpanan publik; pengujian doctor/migrasi
  adalah satu-satunya tempat nama berkas sumber lama semestinya berada.
  Pengujian runtime untuk pemasangan perangkat/Node, allowFrom kanal, intensi restart,
  serah-terima restart, entri antrean pengiriman sesi, kesehatan konfigurasi, cache iMessage,
  tugas Cron, header transkrip PI, registri subagen, dan lampiran gambar terkelola
  juga tidak lagi membuat berkas JSON/JSONL yang telah dihentikan hanya untuk membuktikan
  bahwa berkas tersebut diabaikan atau tidak ada.
  Pemulihan luapan PI tidak lagi memiliki fallback penulisan ulang/pemangkasan SessionManager:
  pemangkasan hasil alat dan penulisan ulang transkrip mesin konteks memutasi
  baris transkrip SQLite, lalu menyegarkan status prompt aktif dari basis data.
  Penambahan pesan SessionManager persisten mendelegasikan ke helper penambahan transkrip
  SQLite atomik untuk pemilihan induk dan idempotensi. Penambahan entri
  metadata/kustom normal juga memilih induk saat ini di dalam SQLite, sehingga
  instans pengelola yang usang tidak menghidupkan kembali kondisi balapan rantai induk pra-SQLite.
  Pembersihan ekor PI sintetis untuk pemeriksaan awal di tengah giliran dan `sessions_yield` kini
  memangkas status transkrip SQLite secara langsung; jembatan penghapusan ekor SessionManager
  lama beserta pengujiannya telah dihapus.
  Pengambilan checkpoint Compaction juga hanya membuat snapshot dari SQLite; pemanggil tidak
  lagi meneruskan SessionManager aktif sebagai sumber transkrip alternatif.
- Pertahankan pengujian yang mengisi berkas lama hanya untuk migrasi.
- Bukti berkas JSON telah diganti dengan bukti baris SQL untuk permukaan runtime
  aktif.

- Tambahkan larangan statis untuk penulisan runtime ke jalur JSON sesi/cache lama.
  Selesai untuk penjaga repositori.

10. Jadikan laporan migrasi dapat diaudit.
    - Catat proses migrasi di SQLite dengan stempel waktu mulai/selesai, jalur
      sumber, hash sumber, jumlah, peringatan, dan jalur cadangan.
      Selesai: eksekusi migrasi status lama kini mempersistenkan laporan `migration_runs`
      dengan inventaris jalur/tabel sumber, SHA-256 berkas sumber, ukuran,
      jumlah catatan, peringatan, dan jalur cadangan.
      Selesai: eksekusi migrasi status lama juga mempersistenkan baris `migration_sources`
      untuk audit tingkat sumber dan keputusan lewati/pengisian balik mendatang.
    - Jadikan penerapan idempoten. Menjalankan ulang setelah impor parsial harus
      melewati sumber yang sudah diimpor atau menggabungkannya berdasarkan kunci stabil.
      Selesai: indeks sesi, transkrip, antrean pengiriman, status plugin, buku besar
      tugas, dan baris SQLite global milik agen diimpor melalui kunci stabil atau
      semantik upsert/ganti, sehingga pengulangan proses menggabungkan tanpa menduplikasi
      baris persisten.
    - Impor yang gagal harus mempertahankan berkas sumber asli.
      Selesai: impor transkrip yang gagal kini membiarkan sumber JSONL asli tetap berada di
      jalur yang terdeteksi, dan `migration_sources` mencatat sumber sebagai
      `warning` dengan `removed_source=0` untuk proses doctor berikutnya.

## Aturan Performa

- Satu koneksi per thread/proses tidak masalah; jangan berbagi handle antar-
  worker.
- Gunakan WAL, `foreign_keys=ON`, batas waktu sibuk 5 detik, dan transaksi penulisan
  `BEGIN IMMEDIATE` yang singkat. Jangan menambahkan percobaan ulang kunci sinkron di atas
  satu kali tunggu sibuk SQLite.
- Pertahankan helper transaksi penulisan tetap sinkron kecuali/hingga API transaksi asinkron
  menambahkan semantik mutex/backpressure yang eksplisit.
- Pertahankan penulisan pengiriman induk tetap kecil dan transaksional.
- Hindari penulisan ulang seluruh penyimpanan; gunakan upsert/hapus tingkat baris.
- Tambahkan indeks untuk daftar berdasarkan agen, daftar berdasarkan sesi, waktu pembaruan, id proses, dan
  jalur kedaluwarsa sebelum memindahkan kode jalur panas.
- Simpan artefak besar, media, dan vektor sebagai BLOB atau baris BLOB terpotong, bukan
  JSON base64 atau larik numerik.
- Pertahankan entri status plugin buram tetap kecil dan tercakup.
- Tambahkan pembersihan SQL untuk TTL/kedaluwarsa alih-alih pemangkasan sistem berkas.
  Selesai untuk penyimpanan runtime milik basis data: media, status plugin, blob plugin,
  deduplikasi persisten, dan cache agen semuanya kedaluwarsa melalui baris SQLite. Pembersihan
  sistem berkas yang tersisa dibatasi pada materialisasi sementara atau perintah
  penghapusan eksplisit.

## Larangan Statis

Tambahkan pemeriksaan repositori yang menggagalkan penulisan runtime baru ke jalur status lama:

- `sessions.json`
- `*.trajectory.jsonl` kecuali keluaran bundel dukungan yang telah diwujudkan
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- `cache/*.json` file cache runtime
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `openclaw-workspace-state.json`
- `workspace-state.json`
- `workspace-attestations/*.attested`
- saudara `<workspace>.attested`
- Matrix `credentials*.json` dan `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json` / `devices/paired.json` / `devices/bootstrap.json`
  (dipensiunkan pada 2026.7: penyimpanan runtime adalah `device_pairing_*` /
  `device_bootstrap_tokens` dalam basis data status bersama; rekaman yang dipasangkan diimpor saat
  Gateway dimulai, baris tertunda/bootstrap sementara dihapus)
- `nodes/pending.json` / `nodes/paired.json` (dipensiunkan pada 2026.7: digabungkan ke dalam rekaman perangkat yang dipasangkan saat Gateway dimulai)
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json` (dipensiunkan; hanya diimpor oleh Doctor ke `web_push_subscriptions`)
- `push/vapid-keys.json` (dipensiunkan; hanya diimpor oleh Doctor ke `web_push_vapid_keys`)
- `push/apns-registrations.json` (dipensiunkan; hanya diimpor oleh Doctor ke `apns_registrations`)
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
- file JSON shard registri sandbox
- `plugin-state/state.sqlite`
- sidecar runtime `openclaw-state.sqlite` ad hoc
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock.lock`
- `agents/<agentId>/qmd-write.lock.lock`
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
- `openclaw/rescue-pending/*.json`
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
- Dekorasi profil peramban `.openclaw-profile-decorated`
- `SessionManager.open(...)` pembuka sesi berbasis file
- `SessionManager.listAll(...)` dan `TranscriptSessionManager.listAll(...)`
  fasad daftar transkrip
- `SessionManager.forkFromSession(...)` dan
  `TranscriptSessionManager.forkFromSession(...)` fasad percabangan transkrip
- `SessionManager.newSession(...)` dan `TranscriptSessionManager.newSession(...)`
  fasad penggantian sesi yang dapat diubah
- `SessionManager.createBranchedSession(...)` dan
  `TranscriptSessionManager.createBranchedSession(...)` fasad sesi cabang

Larangan tersebut harus mengizinkan pengujian membuat fixture lama dan mengizinkan kode migrasi
membaca/mengimpor/menghapus sumber file lama. Sidecar SQLite yang belum dirilis tetap dilarang
dan tidak mendapatkan izin impor oleh Doctor.

## Kriteria Selesai

- Penulisan data runtime dan cache diarahkan ke basis data SQLite global atau agen.
- Runtime tidak lagi menulis indeks sesi, JSONL transkrip, JSON registri sandbox,
  SQLite sidecar tugas, atau SQLite sidecar status Plugin. Pengimpor SQLite sidecar tugas
  dan status Plugin yang belum dirilis dihapus.
- Impor file lama hanya dilakukan oleh Doctor.
- Pencadangan menghasilkan satu arsip berisi snapshot SQLite ringkas dan bukti integritas.
- Worker agen dapat berjalan dengan penyimpanan disk, scratch VFS, atau penyimpanan
  eksperimental yang hanya menggunakan VFS.
- Konfigurasi dan file kredensial eksplisit tetap menjadi satu-satunya file kontrol
  persisten nonbasis data yang diharapkan.
- Pemeriksaan repositori mencegah diperkenalkannya kembali penyimpanan file runtime lama.
