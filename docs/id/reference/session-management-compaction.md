---
read_when:
    - Anda perlu men-debug ID sesi, peristiwa transkrip, atau bidang baris sesi
    - Anda sedang mengubah perilaku Compaction otomatis atau menambahkan penataan "pra-Compaction"
    - Anda ingin menerapkan pengosongan memori atau giliran sistem senyap
summary: 'Pembahasan mendalam: penyimpanan sesi + transkrip, siklus hidup, dan internal (auto)compaction'
title: Pembahasan mendalam tentang pengelolaan sesi
x-i18n:
    generated_at: "2026-07-20T03:56:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ce3f4d5bc40f454f98950ec88230ad5caadb224e25c779f26a7b87f3349de47b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Satu **proses Gateway** memiliki status sesi secara menyeluruh. UI (aplikasi macOS, UI Kontrol web, TUI) meminta daftar sesi dan jumlah token dari Gateway. Dalam mode jarak jauh, berkas sesi berada di host jarak jauh, sehingga memeriksa berkas di Mac lokal Anda tidak akan mencerminkan apa yang digunakan Gateway.

Baca dokumentasi ikhtisar terlebih dahulu: [Pengelolaan sesi](/id/concepts/session), [Compaction](/id/concepts/compaction), [Ikhtisar memori](/id/concepts/memory), [Pencarian memori](/id/concepts/memory-search), [Pemangkasan sesi](/id/concepts/session-pruning), [Kebersihan transkrip](/id/reference/transcript-hygiene), referensi konfigurasi lengkap di [Konfigurasi agen](/id/gateway/config-agents).

## Dua lapisan persistensi

1. **Baris sesi (SQLite per agen)** - peta kunci/nilai `sessionKey -> SessionEntry`. Status runtime yang dapat diubah dan dimiliki oleh Gateway. Melacak metadata: id sesi saat ini, aktivitas terakhir, sakelar, penghitung token.
2. **Peristiwa transkrip (SQLite per agen)** - hanya dapat ditambahkan, terstruktur sebagai pohon (entri memiliki `id` + `parentId`). Menyimpan percakapan, pemanggilan alat, dan ringkasan Compaction; menyusun ulang konteks model untuk giliran mendatang. Titik pemeriksaan Compaction merupakan metadata pada transkrip penerus yang telah dipadatkan - Compaction baru tidak menulis salinan `.checkpoint.*.jsonl` kedua.

Instalasi lama mungkin masih memiliki berkas `sessions.json` di bawah direktori
agen `sessions/`. Perlakukan berkas tersebut sebagai masukan migrasi baris
sesi lama atau target pemeliharaan luring yang eksplisit. Saat Gateway dimulai,
`openclaw doctor --fix` mengimpor baris lama yang aktif dan riwayat transkrip ke dalam
penyimpanan SQLite per agen secara otomatis. Jalankan `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents`, lalu
ikuti [urutan migrasi Doctor](/id/cli/doctor#session-sqlite-migration), saat Anda
memerlukan bukti pemeriksaan atau validasi yang eksplisit. Jika migrasi gagal
setelah artefak transkrip lama diarsipkan, gunakan mode pemulihan Doctor dari
urutan tersebut. Pemulihan menggunakan manifes migrasi, hanya memulihkan artefak
dukungan arsip yang terdampak, menyiapkan laporan masalah GitHub yang telah
disanitasi jika diminta, dan tidak membuat runtime aktif kembali membaca berkas
JSONL.

Pembaca riwayat Gateway menghindari pemuatan seluruh transkrip kecuali permukaan tersebut memerlukan akses historis arbitrer. Riwayat halaman pertama, riwayat obrolan tersemat, pemulihan setelah mulai ulang, serta pemeriksaan token/penggunaan menggunakan pembacaan bagian akhir yang dibatasi dari SQLite. Pemindaian transkrip penuh dilakukan melalui indeks transkrip asinkron dan digunakan bersama oleh pembaca yang berjalan bersamaan.

## Lokasi pada disk

Per agen, pada host Gateway (diuraikan melalui `src/config/sessions.ts`):

- Penyimpanan baris sesi runtime: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Baris transkrip runtime: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Artefak transkrip lama/arsip: `~/.openclaw/agents/<agentId>/sessions/`
- Masukan migrasi baris lama: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Pemeliharaan penyimpanan dan kontrol disk

`session.maintenance` mengontrol pemeliharaan otomatis untuk baris sesi SQLite, baris transkrip SQLite, artefak arsip, dan sidecar lintasan:

| Kunci                   | Bawaan                | Catatan                                                                                             |
| ----------------------- | --------------------- | --------------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | atau `"warn"` (hanya laporan, tanpa mutasi)                                                          |
| `pruneAfter`            | `"30d"`               | batas usia entri kedaluwarsa                                                                       |
| `maxEntries`            | `500`                 | batas jumlah entri sesi                                                                            |
| `resetArchiveRetention` | pertahankan (tanpa batas usia) | batas usia untuk arsip transkrip `*.reset.*`/`*.deleted.*`; durasi mengaktifkan penghapusan |
| `maxDiskBytes`          | `10gb`                | anggaran disk sesi per agen; `false` menonaktifkannya                                               |
| `highWaterBytes`        | 80% dari `maxDiskBytes` | target setelah pembersihan anggaran disk                                                          |

Pengaturan ulang memajukan pemetaan `sessionKey -> sessionId` aktif, tetapi mempertahankan baris sesi, transkrip, lintasan, dan pencarian SQLite sebelumnya. Riwayat tersebut tetap dapat dicari dengan kunci sesi yang sama; daftar entri dan sesi biasa hanya menampilkan pemetaan aktif yang baru. Riwayat pengaturan ulang yang dipertahankan dibatasi oleh anggaran disk, bukan oleh `resetArchiveRetention`, yang hanya membatasi usia artefak arsip. Penghapusan eksplisit berbeda: tindakan ini menulis dan memverifikasi arsip transkrip terkompresi (`*.jsonl.deleted.<timestamp>.zst` jika zstd tersedia) sebelum menghapus baris sesi yang dihapus.

Penerapan `maxDiskBytes` menggunakan byte fisik: berkas utama SQLite per agen, berkas `-wal` miliknya, dan berkas yang dihitung dalam direktori sesi agen. Penerapan ini tidak pernah memperkirakan ukuran JSON baris atau mengurangi ukuran logis baris dari total tersebut.

Sesi pemeriksaan eksekusi model Gateway (kunci yang cocok dengan `agent:*:explicit:model-run-<uuid>`) memiliki retensi tetap `24h` yang terpisah. Pemangkasan ini dipicu oleh tekanan: hanya dijalankan saat tekanan pemeliharaan/batas entri sesi tercapai, dan hanya sebelum langkah pembersihan/batas entri kedaluwarsa global. Sesi eksplisit lainnya tidak menggunakan retensi ini.

Saat penggunaan fisik gabungan melampaui `maxDiskBytes`, `mode: "enforce"` terlebih dahulu memperoleh kembali ruang basis data yang dapat diberi titik pemeriksaan, lalu menghapus arsip pengaturan ulang/penghapusan tertua yang dipertahankan. Jika penggunaan masih di atas `highWaterBytes`, proses tersebut menelusuri sesi SQLite historis berdasarkan `sessions.updated_at`, dimulai dari yang tertua. Historis berarti id sesi tidak dirujuk oleh entri sesi aktif, target rute, atau eksekusi yang diterima/sedang berlangsung. Untuk setiap korban, pembersihan menulis, menjalankan fsync, dan membaca kembali arsip terkompresi sebelum transaksi tulis menghapus baris sesi beserta proyeksi transkrip, lintasan, aktif, indeks, dan FTS-nya. Ini mencakup sesi yang berisi peristiwa lintasan tetapi tidak memiliki peristiwa transkrip. Pembersihan memeriksa ulang referensi rute, entri, dan penerimaan pada saat penghapusan, mengukur kembali penggunaan fisik setelah setiap arsip atau sesi korban, dan berhenti pada `highWaterBytes`.

Penulisan yang dikomit dan penghapusan terlebih dahulu masuk ke WAL. Pembersihan membuat titik pemeriksaan agar WAL dapat segera menyusut, lalu menggunakan vakum inkremental untuk mengembalikan halaman akhir kosong yang memenuhi syarat dari berkas utama; halaman yang belum dapat diperoleh kembali tetap berada dalam berkas utama dan karenanya tetap dihitung pada pengukuran fisik berikutnya. `mode: "warn"` melaporkan kelebihan fisik saat ini tanpa membuat titik pemeriksaan, menulis arsip, atau menghapus baris.

Jalankan pemeliharaan sesuai permintaan:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

Pemeliharaan mempertahankan penunjuk percakapan eksternal yang persisten seperti sesi grup dan sesi obrolan dengan cakupan utas, tetapi entri runtime sintetis (cron, hook, heartbeat, ACP, subagen) tetap dapat dihapus setelah melampaui batas usia, jumlah, atau anggaran disk yang dikonfigurasi. Eksekusi cron terisolasi menggunakan kontrol `cron.sessionRetention` terpisah, yang tidak bergantung pada retensi pemeriksaan eksekusi model.

Penulisan Gateway normal mengalir melalui pengakses sesi, yang menserialkan mutasi SQLite per agen melalui jalur penulis runtime. Kode runtime sebaiknya menggunakan pembantu pengakses di `src/config/sessions/session-accessor.ts`; pembantu `sessions.json` lama merupakan alat migrasi dan pemeliharaan luring. Saat Gateway dapat dijangkau, `openclaw sessions cleanup` dan `openclaw agents delete` yang bukan dry-run mendelegasikan mutasi penyimpanan ke Gateway agar pembersihan bergabung dengan antrean penulis yang sama; `--store <path>` adalah jalur perbaikan luring eksplisit untuk penyimpanan lama yang dipilih dan selalu tetap lokal (demikian juga `--dry-run`). Pembersihan `maxEntries` dilakukan secara bertahap untuk penyimpanan berukuran produksi, sehingga penyimpanan mungkin secara singkat melampaui batas yang dikonfigurasi sebelum pembersihan batas tinggi berikutnya menulis ulang dan menurunkannya. Pembacaan tidak pernah memangkas atau membatasi entri saat Gateway dimulai - hanya penulisan atau `openclaw sessions cleanup --enforce` yang melakukannya, dan yang terakhir juga segera menerapkan batas serta memangkas artefak transkrip, titik pemeriksaan, dan lintasan lama yang tidak dirujuk meskipun tidak ada anggaran disk yang dikonfigurasi.

OpenClaw tidak lagi membuat cadangan rotasi `sessions.json.bak.*` otomatis selama penulisan Gateway. Skema saat ini menolak kunci `session.maintenance.rotateBytes` lama, dan `openclaw doctor --fix` menghapusnya dari konfigurasi lama.

Mutasi transkrip menggunakan antrean penulisan sesi untuk target transkrip SQLite:

Kunci penulisan sesi menggunakan bawaan produksi tetap. Variabel lingkungan
`OPENCLAW_SESSION_WRITE_LOCK_*` terkait tetap tersedia untuk diagnostik tingkat proses dan
penimpaan darurat.

### Menurunkan Versi Setelah Peralihan SQLite

Pulihkan artefak transkrip lama yang diarsipkan sebelum menjalankan versi
OpenClaw lama yang didukung berkas:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Migrasi mempertahankan berkas `sessions.json` lama untuk dukungan dan
pengembalian versi, tetapi berkas JSONL transkrip aktif yang diimpor ke SQLite
diganti namanya menjadi `session-sqlite-import-archive/`. Runtime lama yang didukung berkas
mengikuti jalur `sessionFile` di `sessions.json`, sehingga artefak tersebut harus
dipulihkan sebelum dimulai. Pemulihan menggunakan manifes migrasi, hanya
memindahkan artefak arsip yang tercatat dan jalur aslinya tidak ada, serta
mempertahankan basis data SQLite untuk pemulihan ke versi yang lebih baru.

Sesi yang dibuat setelah peralihan SQLite hanya tersedia di SQLite dan tidak
akan muncul pada runtime lama yang didukung berkas. Jika Anda meningkatkan versi
kembali setelah menurunkannya, jalankan lagi urutan pemeriksaan dan validasi
Doctor agar OpenClaw dapat memverifikasi artefak lama yang dipulihkan sebelum
mengimpornya.

## Sesi Cron dan log eksekusi

Eksekusi Cron terisolasi membuat entri sesi/transkripnya sendiri dengan retensi khusus:

- `cron.sessionRetention` (bawaan `"24h"`) memangkas sesi eksekusi cron terisolasi yang lama dari penyimpanan; `false` menonaktifkannya.
- Riwayat eksekusi mempertahankan 2000 baris terminal terbaru per tugas cron. Baris yang hilang tetap memiliki jendela pembersihan 24 jam.

Saat cron memaksa pembuatan sesi eksekusi terisolasi baru, cron menyanitasi entri sesi `cron:<jobId>` sebelumnya sebelum menulis baris baru: cron membawa preferensi aman (pengaturan pemikiran/cepat/verbose/penalaran, label, nama tampilan) serta penimpaan model/autentikasi yang dipilih pengguna secara eksplisit, tetapi menghapus konteks percakapan sekitar (perutean saluran/grup, kebijakan pengiriman/antrean, elevasi, asal, pengikatan runtime ACP) agar eksekusi terisolasi baru tidak dapat mewarisi otoritas pengiriman atau runtime usang dari eksekusi lama.

## Kunci sesi (`sessionKey`)

Sebuah `sessionKey` mengidentifikasi wadah percakapan tempat Anda berada (perutean + isolasi). Aturan kanonis: [/concepts/session](/id/concepts/session).

| Pola                              | Contoh                                                      |
| --------------------------------- | ----------------------------------------------------------- |
| Obrolan utama/langsung (per agen) | `agent:<agentId>:<mainKey>` (bawaan `main`)                |
| Grup                              | `agent:<agentId>:<channel>:group:<id>`                      |
| Ruang/saluran (Discord/Slack)     | `agent:<agentId>:<channel>:channel:<id>` atau `...:room:<id>` |
| Cron                              | `cron:<job.id>`                                             |
| Webhook                           | `hook:<uuid>` (kecuali ditimpa)                           |

## Id sesi (`sessionId`)

Setiap `sessionKey` menunjuk ke `sessionId` saat ini (identitas transkrip SQLite yang melanjutkan percakapan). Logika keputusan berada di `initSessionState()` dalam `src/auto-reply/reply/session.ts`.

- **Reset** (`/new`, `/reset`) membuat `sessionId` baru untuk `sessionKey` tersebut.
- **Tanpa reset otomatis** adalah pengaturan default. `sessionId` saat ini berlanjut sementara Compaction menjaga konteks model aktif tetap terbatas.
- **Reset harian** (`session.reset.mode: "daily"`) membuat `sessionId` baru pada pesan berikutnya setelah batas jam lokal yang dikonfigurasi (`session.reset.atHour`, default `4`).
- **Kedaluwarsa saat menganggur** (`session.reset.mode: "idle"` dengan `session.reset.idleMinutes`, atau `session.idleMinutes` lama) membuat `sessionId` baru ketika pesan tiba setelah jendela waktu menganggur. Jika harian dan menganggur sama-sama dikonfigurasi, yang kedaluwarsa lebih dahulu akan berlaku.
- **Melanjutkan saat Control UI tersambung kembali** mempertahankan sesi yang sedang terlihat untuk satu pengiriman setelah tersambung kembali ketika Gateway menerima `sessionId` yang cocok dari klien UI operator. Ini adalah sinyal sekali pakai; pengiriman kedaluwarsa biasa tetap membuat `sessionId` baru.
- **Peristiwa sistem** (Heartbeat, pengaktifan Cron, notifikasi exec, pencatatan internal Gateway) dapat mengubah baris sesi tetapi tidak pernah memperpanjang kesegaran reset harian/menganggur. Pergantian reset membuang notifikasi peristiwa sistem dalam antrean untuk sesi sebelumnya sebelum prompt baru dibuat.
- **Kebijakan fork induk** menggunakan cabang aktif OpenClaw saat membuat fork utas atau subagen. Jika cabang tersebut terlalu besar (melampaui batas internal tetap, saat ini 100K token), OpenClaw memulai anak dengan konteks terisolasi alih-alih gagal atau mewarisi riwayat yang tidak dapat digunakan. Penentuan ukuran dilakukan secara otomatis dan tidak dapat dikonfigurasi; konfigurasi `session.parentForkMaxTokens` lama dihapus oleh `openclaw doctor --fix`.
- **Fork operator**: `sessions.create { parentSessionKey, fork: true }` membuat sesi baru dengan transkrip yang bercabang dari keadaan induk saat ini (mekanisme fork yang sama seperti pembuatan subagen, termasuk batas ukuran di atas). Fork ditolak selama induk memiliki proses aktif, mewarisi pilihan model induk kecuali model diteruskan secara eksplisit, dan menandai anak sebagai `forkedFromParent` dengan penghitung token baru.

## Skema penyimpanan sesi

Penyimpanan runtime menyimpan nilai `SessionEntry` dalam SQLite per agen. Jenis nilainya adalah `SessionEntry` dalam `src/config/sessions.ts`. Bidang utama (tidak lengkap):

- `sessionId`: id transkrip saat ini yang digunakan untuk mengalamatkan baris transkrip SQLite
- `sessionStartedAt`: stempel waktu mulai untuk `sessionId` saat ini; kesegaran reset harian menggunakan nilai ini. Baris lama dapat memperolehnya dari header sesi JSONL.
- `lastInteractionAt`: stempel waktu interaksi nyata terakhir pengguna/saluran; kesegaran reset saat menganggur menggunakan nilai ini agar peristiwa Heartbeat, Cron, dan exec tidak mempertahankan sesi tetap aktif. Baris lama tanpa bidang ini kembali menggunakan waktu mulai sesi yang dipulihkan.
- `updatedAt`: stempel waktu perubahan terakhir pada baris penyimpanan, digunakan untuk pencantuman/pemangkasan/pencatatan internal—bukan sumber otoritatif kesegaran harian/menganggur.
- `archivedAt`: stempel waktu arsip opsional. Sesi yang diarsipkan tetap berada dalam penyimpanan dengan transkrip utuh dan dikecualikan dari daftar aktif normal.
- `pinnedAt`: stempel waktu sematan opsional. Sesi aktif yang disematkan diurutkan sebelum sesi yang tidak disematkan; mengarsipkan sesi akan menghapus sematannya.
- Interoperabilitas utas Codex: kedua bidang mengikuti bentuk pengelolaan utas Codex—boolean `archived`/`pinned` pada jalur komunikasi selalu diturunkan dari stempel waktu dan diberi stempel di sisi server, sesuai dengan semantik `threads.archived_at` Codex dan serialisasi camelCase. Stempel waktu OpenClaw menggunakan milidetik epoch, sedangkan Codex menggunakan detik epoch, sehingga penghubung melakukan konversi pada batas Plugin `codex`. Codex belum memiliki API sematan (`thread/archive`/`thread/unarchive` saja); status sematan tetap berada di sisi OpenClaw hingga API tersebut tersedia, dan pada saat itu bentuk yang cocok memungkinkan sesi terikat melakukan pulang-pergi status sematan secara mekanis.
- Supervisi Codex hanya mencantumkan utas native yang tidak diarsipkan. Utas dengan aktivitas tidak diketahui `idle` atau `notLoaded` yang bersifat lokal pada Gateway hanya dapat diarsipkan melalui `thread/archive` native setelah operator secara eksplisit mengonfirmasi bahwa tidak ada proses Codex lain yang memilikinya; Plugin terlebih dahulu melakukan pembacaan status lokal proses yang baru, lalu utas menghilang dari katalog. Pembacaan tersebut tidak dapat membuktikan bahwa proses App Server lain tidak sedang menggunakan utas. OpenClaw menolak mengarsipkan baris aktif dan baris galat, dan pengarsipan node berpasangan tidak tersedia hingga penghubung node dapat memiliki seluruh siklus hidup utas streaming. Membatalkan pengarsipan dalam klien Codex native membuat utas tersebut memenuhi syarat untuk muncul kembali.
- `lastReadAt` / `markedUnreadAt`: stempel waktu status baca yang diberi stempel di sisi server oleh `sessions.patch { unread }`—`unread: false` mencatat pembacaan (menetapkan `lastReadAt`, menghapus `markedUnreadAt`); `unread: true` menandai sesi belum dibaca hingga pembacaan berikutnya. Baris sesi mengekspos boolean turunan `unread`: ditandai belum dibaca secara eksplisit, atau dibaca sebelum aktivitas terbaru. Sesi yang tidak pernah ditandai telah dibaca tetap `unread: false`, sehingga instalasi yang sudah ada tidak menyala setelah peningkatan.
- `lastActivityAt`: stempel waktu proses agen terakhir yang selesai dan dianggap sebagai aktivitas yang layak ditandai belum dibaca (proses pengguna, saluran, dan Cron). Giliran Heartbeat dan peristiwa internal, serta patch metadata, tidak memperbaruinya; `updatedAt` bukan sinyal aktivitas.
- `sessionFile`: penanda lama yang dipertahankan untuk kompatibilitas migrasi/arsip; runtime aktif menggunakan identitas SQLite
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: metadata pelabelan grup/saluran
- Sakelar: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (penggantian per sesi)
- Pemilihan model: `providerOverride`, `modelOverride`, `authProfileOverride`
- Penghitung token (upaya terbaik/bergantung pada penyedia): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: berapa kali Compaction otomatis selesai untuk kunci sesi ini
- `memoryFlushAt` / `memoryFlushCompactionCount`: stempel waktu dan jumlah Compaction dari pengosongan memori pra-Compaction terakhir

Gateway adalah sumber otoritatif: Gateway dapat menulis ulang atau merehidrasi entri saat sesi
berjalan. Untuk instalasi lama berbasis berkas, lakukan migrasi dengan
`openclaw doctor --session-sqlite import --session-sqlite-all-agents`, alih-alih
mengedit `sessions.json` dan mengharapkan runtime terus membaca berkas tersebut.

## Struktur peristiwa transkrip

Transkrip dikelola oleh pengakses sesi OpenClaw dan diekspos ke kode runtime melalui pembantu berbasis identitas. Aliran peristiwa hanya dapat ditambahkan:

- Entri pertama: header sesi—`type: "session"`, `id`, `cwd`, `timestamp`, `parentSession` opsional.
- Kemudian: entri dengan `id` + `parentId` (struktur pohon).

Jenis entri penting:

- `message`: pesan pengguna/asisten/toolResult
- `custom_message`: pesan yang disuntikkan ekstensi dan _memasuki_ konteks model (dirender dalam TUI ketika `display: true`, disembunyikan sepenuhnya ketika `display: false`)
- `custom`: status ekstensi yang _tidak memasuki_ konteks model (untuk mempertahankan status ekstensi di seluruh pemuatan ulang)
- `compaction`: ringkasan Compaction yang dipertahankan dengan `firstKeptEntryId` dan `tokensBefore`
- `branch_summary`: ringkasan yang dipertahankan saat menavigasi cabang pohon

OpenClaw sengaja tidak "memperbaiki" transkrip; Gateway menggunakan `SessionManager` untuk membaca/menulisnya.

## Jendela konteks dibandingkan token yang dilacak

Dua konsep berbeda:

1. **Jendela konteks model**: batas keras per model (token yang terlihat oleh model). Berasal dari katalog model dan dapat diganti melalui konfigurasi.
2. **Penghitung penyimpanan sesi**: statistik berjalan yang ditulis ke dalam baris sesi (digunakan untuk `/status` dan dasbor). `contextTokens` adalah nilai estimasi/pelaporan runtime—jangan menganggapnya sebagai jaminan mutlak.

Selengkapnya tentang batas: [/reference/token-use](/id/reference/token-use).

## Compaction: pengertiannya

Compaction meringkas percakapan lama menjadi entri `compaction` yang dipertahankan dalam transkrip dan menjaga pesan terbaru tetap utuh. Setelah Compaction, giliran berikutnya melihat ringkasan Compaction beserta pesan setelah `firstKeptEntryId`. Compaction bersifat **persisten**, tidak seperti pemangkasan sesi—lihat [/concepts/session-pruning](/id/concepts/session-pruning).

Compaction OpenClaw tertanam secara default mewarisi tingkat pemikiran sesi. Tetapkan `agents.defaults.compaction.thinkingLevel` untuk menggunakan tingkat terpisah bagi panggilan ringkasan; runtime membatasinya sesuai setiap model Compaction konkret atau model cadangan. Compaction app-server Codex native mengelola permintaan pemadatannya sendiri dan tidak dapat menerima penggantian tingkat pemikiran per Compaction, sehingga OpenClaw memberikan peringatan dan menyerahkan pengaturan tersebut kepada Codex.

Penyuntikan ulang bagian AGENTS.md setelah Compaction bersifat opsional melalui `agents.defaults.compaction.postCompactionSections`; ketika tidak ditetapkan atau `[]`, OpenClaw tidak menambahkan kutipan AGENTS.md di atas ringkasan Compaction.

### Batas potongan dan pemasangan alat

Saat membagi transkrip panjang menjadi potongan Compaction, OpenClaw menjaga panggilan alat asisten tetap berpasangan dengan entri `toolResult` yang cocok:

- Jika pembagian proporsi token jatuh di antara panggilan alat dan hasilnya, OpenClaw menggeser batas ke pesan panggilan alat asisten alih-alih memisahkan pasangan tersebut.
- Jika blok hasil alat di bagian akhir akan membuat potongan melampaui target, OpenClaw mempertahankan blok alat yang tertunda tersebut dan menjaga bagian akhir yang belum diringkas tetap utuh.
- Blok panggilan alat yang dibatalkan/galat tidak mempertahankan pembagian tertunda tetap terbuka.

## Kapan Compaction otomatis terjadi

Dua pemicu dalam agen OpenClaw tertanam:

1. **Pemulihan luapan**: model mengembalikan galat luapan konteks (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded`, dan varian berbentuk penyedia lainnya)—lakukan Compaction, lalu coba lagi. Ketika penyedia melaporkan jumlah token yang dicoba, OpenClaw meneruskan jumlah yang diamati tersebut ke Compaction pemulihan luapan; jika penyedia mengonfirmasi luapan tetapi tidak mengekspos jumlah yang dapat diurai, OpenClaw meneruskan jumlah sintetis yang sedikit melampaui anggaran ke mesin Compaction dan diagnostik. Jika pemulihan luapan masih gagal, OpenClaw menampilkan panduan eksplisit dan mempertahankan pemetaan sesi saat ini alih-alih secara diam-diam beralih ke id sesi baru—coba lagi pesan tersebut, jalankan `/compact`, atau jalankan `/new`.
2. **Pemeliharaan ambang batas**: setelah giliran berhasil, ketika konteks saat ini melampaui jendela model dikurangi ruang cadangan bawaan OpenClaw untuk prompt dan keluaran model berikutnya.

Dua pengaman tambahan berjalan di luar kedua pemicu ini:

- **Compaction lokal prajalankan**: atur `agents.defaults.compaction.maxActiveTranscriptBytes` (byte atau string seperti `"20mb"`) untuk memicu Compaction lokal sebelum membuka proses berikutnya setelah transkrip aktif mencapai ukuran tersebut. Ini adalah pengaman ukuran untuk biaya pembukaan ulang lokal, bukan pengarsipan mentah—Compaction semantik normal tetap berjalan, dan memerlukan `truncateAfterCompaction` agar ringkasan hasil Compaction menjadi transkrip penerus baru.
- **Prapemeriksaan di tengah giliran**: atur `agents.defaults.compaction.midTurnPrecheck.enabled: true` (default `false`) untuk menambahkan pengaman perulangan alat. Setelah hasil alat ditambahkan dan sebelum pemanggilan model berikutnya, OpenClaw memperkirakan tekanan prompt menggunakan logika anggaran prajalankan yang sama dengan yang digunakan pada awal giliran. Jika konteks tidak lagi muat, pengaman tidak menjalankan Compaction secara langsung—pengaman memunculkan sinyal prapemeriksaan tengah giliran yang terstruktur, menghentikan pengiriman prompt saat ini, dan membiarkan perulangan proses luar menggunakan jalur pemulihan yang ada (memangkas hasil alat yang terlalu besar jika itu sudah cukup, atau memicu mode Compaction yang dikonfigurasi lalu mencoba kembali). Berfungsi dengan mode Compaction `default` maupun `safeguard`, termasuk Compaction pengaman yang didukung penyedia. Independen dari `maxActiveTranscriptBytes`: pengaman ukuran byte berjalan sebelum giliran dibuka, sedangkan prapemeriksaan tengah giliran berjalan kemudian, setelah hasil alat baru ditambahkan.

## Pengaturan Compaction

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw menerapkan cadangan bawaan untuk proses tertanam dan membatasinya berdasarkan jendela konteks model aktif agar tidak menghabiskan seluruh anggaran prompt. Hal ini mencegah model lokal berkonteks kecil memasuki Compaction sejak token pertama, sekaligus menyisakan ruang yang cukup untuk pemeliharaan multi-giliran seperti pembuangan memori.

`/compact` manual mematuhi `agents.defaults.compaction.keepRecentTokens` yang ditentukan secara eksplisit dan mempertahankan titik potong ekor terbaru milik runtime. Tanpa anggaran penyimpanan eksplisit, Compaction manual menjadi titik pemeriksaan penuh dan konteks yang dibangun ulang dimulai dari ringkasan baru.

Saat `truncateAfterCompaction` diaktifkan, OpenClaw merotasi transkrip aktif ke penerus hasil Compaction setelah Compaction. Tindakan titik pemeriksaan cabang/pemulihan menggunakan penerus hasil Compaction tersebut; file titik pemeriksaan lama sebelum Compaction tetap dapat dibaca selama masih dirujuk.

## Penyedia Compaction yang dapat dipasang

Plugin mendaftarkan penyedia Compaction melalui `registerCompactionProvider()` pada API Plugin. Saat `agents.defaults.compaction.provider` diatur ke id penyedia yang terdaftar, ekstensi pengaman mendelegasikan peringkasan kepada penyedia tersebut, bukan ke pipeline `summarizeInStages` bawaan.

- `provider`: id Plugin penyedia Compaction yang terdaftar. Biarkan tidak diatur untuk peringkasan LLM default. Mengatur `provider` akan memaksa `mode: "safeguard"`.
- Penyedia menerima instruksi Compaction dan kebijakan pemeliharaan pengenal yang sama seperti jalur bawaan, dan pengaman tetap mempertahankan konteks akhiran giliran terbaru serta giliran terpisah setelah keluaran penyedia.
- Peringkasan pengaman bawaan menyuling ulang ringkasan sebelumnya bersama pesan baru, alih-alih mempertahankan seluruh ringkasan sebelumnya kata demi kata.
- Mode pengaman mengaktifkan audit kualitas ringkasan secara default; atur `qualityGuard.enabled: false` untuk melewati perilaku mencoba kembali saat keluaran tidak valid.
- Jika penyedia gagal atau mengembalikan hasil kosong, OpenClaw secara otomatis beralih ke peringkasan LLM bawaan. Sinyal pembatalan/batas waktu yang dipicu secara eksplisit oleh pemanggil akan dilemparkan kembali, bukan ditelan, sehingga pembatalan selalu dipatuhi.

Sumber: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Permukaan yang terlihat oleh pengguna

- `/status` dalam sesi obrolan apa pun
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Log Gateway (`pnpm gateway:watch` atau `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Mode verbose: `🧹 Auto-compaction complete` ditambah jumlah Compaction

## Pemeliharaan senyap (`NO_REPLY`)

OpenClaw mendukung giliran "senyap" untuk tugas latar belakang ketika pengguna tidak boleh melihat keluaran perantara.

- Asisten memulai keluarannya dengan token senyap persis `NO_REPLY` / `no_reply` yang berarti "jangan kirim balasan kepada pengguna." OpenClaw menghapus/menyembunyikannya pada lapisan pengiriman.
- Penyembunyian token senyap persis tidak membedakan huruf besar-kecil: `NO_REPLY` dan `no_reply` sama-sama berlaku ketika seluruh muatan hanya berisi token senyap.
- Mulai `2026.1.10`, OpenClaw juga menyembunyikan streaming draf/indikator pengetikan ketika potongan parsial diawali dengan `NO_REPLY`, sehingga operasi senyap tidak membocorkan keluaran parsial di tengah giliran.
- Ini hanya untuk giliran latar belakang/tanpa pengiriman yang sebenarnya—bukan jalan pintas untuk permintaan pengguna biasa yang dapat ditindaklanjuti.

## Pembuangan memori sebelum Compaction

Sebelum Compaction otomatis terjadi, OpenClaw dapat menjalankan giliran agentik senyap yang menulis status persisten ke disk (misalnya `memory/YYYY-MM-DD.md` di ruang kerja agen) agar Compaction tidak dapat menghapus konteks penting. OpenClaw memantau penggunaan konteks sesi, dan setelah melewati ambang lunak di bawah ambang Compaction, OpenClaw mengirim arahan senyap "tulis memori sekarang" menggunakan token senyap persis `NO_REPLY` / `no_reply` agar pengguna tidak melihat apa pun.

Konfigurasi (`agents.defaults.compaction.memoryFlush`), referensi lengkap di [/gateway/config-agents](/id/gateway/config-agents#agentsdefaultscompaction):

| Kunci                       | Default          | Catatan                                                                                                                                |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | tidak diatur     | penggantian penyedia/model yang persis hanya untuk giliran pembuangan, misalnya `ollama/qwen3:8b`                                     |
| `softThresholdTokens`       | `4000`           | jarak di bawah ambang Compaction yang memicu pembuangan                                                                                 |
| `forceFlushTranscriptBytes` | tidak diatur (dinonaktifkan) | paksa pembuangan setelah file transkrip mencapai ukuran byte ini (atau string seperti `"2mb"`), meskipun penghitung token sudah kedaluwarsa; `0` menonaktifkan |
| `prompt`                    | bawaan           | pesan pengguna untuk giliran pembuangan                                                                                                |
| `systemPrompt`              | bawaan           | prompt sistem tambahan yang disisipkan untuk giliran pembuangan                                                                        |

Catatan:

- Prompt/prompt sistem default menyertakan petunjuk `NO_REPLY` untuk menyembunyikan pengiriman.
- Saat `model` diatur, giliran pembuangan menggunakan model tersebut tanpa mewarisi rantai fallback sesi aktif, sehingga pemeliharaan khusus lokal tidak secara diam-diam beralih ke model percakapan berbayar ketika gagal.
- Pembuangan berjalan satu kali per siklus Compaction (dilacak dalam baris sesi).
- Pembuangan hanya berjalan untuk sesi OpenClaw tertanam; backend CLI dan giliran Heartbeat melewatinya.
- Pembuangan dilewati saat ruang kerja sesi bersifat hanya-baca (`workspaceAccess: "ro"` atau `"none"`).
- Lihat [Memori](/id/concepts/memory) untuk tata letak file ruang kerja dan pola penulisan.

OpenClaw menyediakan hook `session_before_compact` dalam API ekstensi, tetapi logika pembuangan di atas berada di sisi Gateway (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), bukan pada hook tersebut.

## Daftar periksa pemecahan masalah

- **Kunci sesi salah?** Mulailah dari [/concepts/session](/id/concepts/session) dan konfirmasikan `sessionKey` di `/status`.
- **Penyimpanan dan transkrip tidak cocok?** Konfirmasikan host Gateway dan jalur penyimpanan dari `openclaw status`.
- **Compaction terus-menerus?** Periksa jendela konteks model (terlalu kecil memaksa Compaction yang sering) dan pembengkakan hasil alat (sesuaikan pemangkasan sesi).
- **Setiap prompt tampaknya melampaui batas pada model lokal kecil?** Konfirmasikan bahwa penyedia melaporkan jendela konteks model yang benar. OpenClaw hanya dapat membatasi cadangan efektif jika jendela tersebut diketahui.
- **Giliran senyap bocor?** Konfirmasikan bahwa balasan diawali dengan token senyap persis `NO_REPLY` (tidak membedakan huruf besar-kecil) dan Anda menggunakan build yang menyertakan perbaikan penyembunyian streaming (`2026.1.10`+).

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Mesin konteks](/id/concepts/context-engine)
- [Referensi konfigurasi agen](/id/gateway/config-agents)
