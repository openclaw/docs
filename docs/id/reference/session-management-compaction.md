---
read_when:
    - Anda perlu men-debug ID sesi, peristiwa transkrip, atau bidang baris sesi
    - Anda mengubah perilaku Compaction otomatis atau menambahkan pemeliharaan "pra-Compaction"
    - Anda ingin menerapkan pengosongan memori atau giliran sistem senyap
summary: 'Pembahasan mendalam: penyimpanan sesi + transkrip, siklus hidup, dan internal (auto)compaction'
title: Pembahasan mendalam tentang manajemen sesi
x-i18n:
    generated_at: "2026-07-16T18:39:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7551a94a4e2dc8be8b69503795309d0200cc3b5d7231b54083dbcaade697b06c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Satu **proses Gateway** memiliki status sesi secara menyeluruh dari awal hingga akhir. Antarmuka pengguna (aplikasi macOS, Control UI web, TUI) meminta daftar sesi dan jumlah token dari Gateway. Dalam mode jarak jauh, file sesi berada di host jarak jauh, sehingga pemeriksaan file di Mac lokal Anda tidak akan mencerminkan apa yang digunakan Gateway.

Baca dokumentasi ikhtisar terlebih dahulu: [Pengelolaan sesi](/id/concepts/session), [Compaction](/id/concepts/compaction), [Ikhtisar memori](/id/concepts/memory), [Pencarian memori](/id/concepts/memory-search), [Pemangkasan sesi](/id/concepts/session-pruning), [Kebersihan transkrip](/id/reference/transcript-hygiene), referensi konfigurasi lengkap di [Konfigurasi agen](/id/gateway/config-agents).

## Dua lapisan persistensi

1. **Baris sesi (SQLite per agen)** - peta kunci/nilai `sessionKey -> SessionEntry`. Status runtime yang dapat diubah dan dimiliki oleh Gateway. Melacak metadata: id sesi saat ini, aktivitas terakhir, pengalih, penghitung token.
2. **Peristiwa transkrip (SQLite per agen)** - hanya dapat ditambahkan, terstruktur sebagai pohon (entri memiliki `id` + `parentId`). Menyimpan percakapan, panggilan alat, dan ringkasan Compaction; membangun ulang konteks model untuk giliran mendatang. Titik pemeriksaan Compaction adalah metadata pada transkrip penerus yang telah dipadatkan - Compaction baru tidak menulis salinan `.checkpoint.*.jsonl` kedua.

Instalasi lama mungkin masih memiliki file `sessions.json` di bawah direktori `sessions/`
agen. Perlakukan file tersebut sebagai masukan migrasi baris sesi lama atau target
pemeliharaan luring eksplisit. Saat dimulai, Gateway dan `openclaw doctor --fix` mengimpor
baris lama yang aktif dan riwayat transkrip ke penyimpanan SQLite per agen
secara otomatis. Jalankan `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents`, lalu ikuti [urutan migrasi
Doctor](/id/cli/doctor#session-sqlite-migration), saat Anda memerlukan bukti
inspeksi atau validasi eksplisit. Jika migrasi gagal setelah artefak transkrip
lama diarsipkan, gunakan mode pemulihan Doctor dari urutan tersebut.
Pemulihan menggunakan manifes migrasi, hanya memulihkan artefak dukungan arsip
yang terdampak, menyiapkan laporan masalah GitHub yang telah disanitasi jika diminta, dan tidak
membuat runtime aktif membaca kembali file JSONL.

Pembaca riwayat Gateway menghindari pemuatan seluruh transkrip ke memori kecuali permukaan memerlukan akses historis arbitrer. Riwayat halaman pertama, riwayat obrolan tersemat, pemulihan setelah dimulai ulang, serta pemeriksaan token/penggunaan menggunakan pembacaan bagian akhir yang dibatasi dari SQLite. Pemindaian transkrip lengkap dilakukan melalui indeks transkrip asinkron dan digunakan bersama oleh pembaca serentak.

## Lokasi di disk

Per agen, pada host Gateway (ditentukan melalui `src/config/sessions.ts`):

- Penyimpanan baris sesi runtime: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Baris transkrip runtime: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Artefak transkrip lama/arsip: `~/.openclaw/agents/<agentId>/sessions/`
- Masukan migrasi baris lama: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Pemeliharaan penyimpanan dan kontrol disk

`session.maintenance` mengontrol pemeliharaan otomatis untuk baris sesi SQLite, baris transkrip SQLite, artefak arsip, dan file pendamping trajektori:

| Kunci                   | Bawaan                | Catatan                                                                                     |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | atau `"warn"` (hanya laporan, tanpa mutasi)                                                 |
| `pruneAfter`            | `"30d"`               | batas usia entri kedaluwarsa                                                                |
| `maxEntries`            | `500`                 | batas jumlah entri sesi                                                                     |
| `resetArchiveRetention` | pertahankan (tanpa batas usia) | batas usia untuk arsip transkrip `*.reset.*`/`*.deleted.*`; durasi mengaktifkan penghapusan |
| `maxDiskBytes`          | `2gb`                 | anggaran disk sesi per agen; `false` menonaktifkan                                         |
| `highWaterBytes`        | 80% dari `maxDiskBytes` | target setelah pembersihan anggaran                                                         |

Transkrip yang diarsipkan dipertahankan secara bawaan dan dikompresi dengan zstd (`*.jsonl.<reason>.<timestamp>.zst`) jika runtime mendukungnya, sehingga menghapus atau mengatur ulang sesi tidak pernah membuang riwayat percakapan secara diam-diam. Anggaran disk mengeluarkan arsip terlama terlebih dahulu sebelum menyentuh sesi aktif.

Penerapan SQLite aktif untuk `maxDiskBytes` mengukur byte JSON baris sesi ditambah JSON peristiwa transkrip per sesi; penerapan pemeliharaan luring lama mengukur file dalam direktori sesi yang dipilih.

Sesi pemeriksaan eksekusi model Gateway (kunci yang cocok dengan `agent:*:explicit:model-run-<uuid>`) mendapatkan retensi tetap `24h` yang terpisah. Pemangkasan ini dipicu oleh tekanan: hanya berjalan saat tekanan pemeliharaan/batas entri sesi tercapai, dan hanya sebelum langkah pembersihan/batas entri kedaluwarsa global. Sesi eksplisit lainnya tidak menggunakan retensi ini.

Urutan penerapan untuk pembersihan anggaran disk (`mode: "enforce"`):

1. Hapus terlebih dahulu artefak transkrip arsip terlama, artefak lama yatim, atau artefak trajektori yatim.
2. Jika masih di atas target, keluarkan entri sesi terlama beserta baris transkrip atau artefak trajektorinya.
3. Ulangi hingga penggunaan berada pada atau di bawah `highWaterBytes`.

`mode: "warn"` melaporkan potensi pengeluaran tanpa memutasi penyimpanan atau file.

Jalankan pemeliharaan sesuai kebutuhan:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

Pemeliharaan mempertahankan penunjuk percakapan eksternal yang tahan lama, seperti sesi grup dan sesi obrolan dengan cakupan utas, tetapi entri runtime sintetis (cron, hook, Heartbeat, ACP, subagen) tetap dapat dihapus setelah melampaui usia, jumlah, atau anggaran disk yang dikonfigurasi. Eksekusi cron terisolasi menggunakan kontrol `cron.sessionRetention` terpisah, yang tidak bergantung pada retensi pemeriksaan eksekusi model.

Penulisan normal Gateway mengalir melalui pengakses sesi, yang menserialkan mutasi SQLite per agen melalui jalur penulis runtime. Kode runtime sebaiknya menggunakan pembantu pengakses di `src/config/sessions/session-accessor.ts`; pembantu `sessions.json` lama adalah alat migrasi dan pemeliharaan luring. Saat Gateway dapat dijangkau, `openclaw sessions cleanup` dan `openclaw agents delete` yang bukan uji coba mendelegasikan mutasi penyimpanan ke Gateway agar pembersihan bergabung dengan antrean penulis yang sama; `--store <path>` adalah jalur perbaikan luring eksplisit untuk penyimpanan lama yang dipilih dan selalu tetap lokal (demikian pula `--dry-run`). Pembersihan `maxEntries` dilakukan secara bertahap untuk penyimpanan berukuran produksi, sehingga penyimpanan dapat melampaui batas yang dikonfigurasi untuk sementara sebelum pembersihan batas atas berikutnya menulis ulang ukurannya hingga turun. Pembacaan tidak pernah memangkas atau membatasi entri selama Gateway dimulai - hanya penulisan atau `openclaw sessions cleanup --enforce` yang melakukannya, dan yang terakhir juga segera menerapkan batas serta memangkas artefak transkrip, titik pemeriksaan, dan trajektori lama yang tidak direferensikan meskipun tidak ada anggaran disk yang dikonfigurasi.

OpenClaw tidak lagi membuat cadangan rotasi `sessions.json.bak.*` otomatis selama penulisan Gateway. Skema saat ini menolak kunci lama `session.maintenance.rotateBytes`, dan `openclaw doctor --fix` menghapusnya dari konfigurasi lama.

Mutasi transkrip menggunakan antrean penulisan sesi untuk target transkrip SQLite:

| Pengaturan                           | Bawaan    | Penggantian env                                  |
| ------------------------------------ | --------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` adalah durasi tunggu kunci sebelum galat sesi sibuk ditampilkan dan proses menyerah; naikkan hanya ketika persiapan, pembersihan, Compaction, atau pekerjaan pencerminan transkrip yang sah bersaing lebih lama pada mesin lambat. `staleMs` menentukan kapan kunci yang ada dapat direbut kembali karena dianggap kedaluwarsa. `maxHoldMs` adalah ambang pelepasan pengawas dalam proses.

### Menurunkan Versi Setelah Peralihan SQLite

Pulihkan artefak transkrip lama yang diarsipkan sebelum menjalankan versi OpenClaw
lama yang berbasis file:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Migrasi membiarkan file `sessions.json` lama tetap tersedia untuk dukungan dan
pengembalian versi, tetapi file JSONL transkrip aktif yang diimpor ke SQLite
diganti namanya menjadi `session-sqlite-import-archive/`. Runtime lama berbasis file mengikuti
jalur `sessionFile` di `sessions.json`, sehingga artefak tersebut harus dipulihkan
sebelum dimulai. Pemulihan menggunakan manifes migrasi, hanya memindahkan artefak
arsip tercatat yang jalur aslinya tidak ada, dan membiarkan basis data SQLite
tetap tersedia untuk pemulihan ke depan.

Sesi yang dibuat setelah peralihan SQLite hanya tersedia di SQLite dan tidak akan tampak bagi
runtime lama berbasis file. Jika Anda meningkatkan versi kembali setelah menurunkannya, jalankan lagi
urutan inspeksi dan validasi Doctor agar OpenClaw dapat memverifikasi artefak lama
yang dipulihkan sebelum mengimpor.

## Sesi cron dan log eksekusi

Eksekusi cron terisolasi membuat entri sesi/transkripnya sendiri dengan retensi khusus:

- `cron.sessionRetention` (bawaan `"24h"`) memangkas sesi eksekusi cron terisolasi lama dari penyimpanan; `false` menonaktifkan.
- Riwayat eksekusi mempertahankan 2000 baris terminal terbaru per pekerjaan cron. Baris yang hilang tetap memiliki jendela pembersihan 24 jam.

Saat cron memaksa pembuatan sesi eksekusi terisolasi baru, cron menyanitasi entri sesi `cron:<jobId>` sebelumnya sebelum menulis baris baru: cron membawa preferensi yang aman (pengaturan pemikiran/cepat/verbositas/penalaran, label, nama tampilan) serta penggantian model/autentikasi yang dipilih pengguna secara eksplisit, tetapi membuang konteks percakapan ambien (perutean saluran/grup, kebijakan pengiriman/antrean, elevasi, asal, pengikatan runtime ACP) agar eksekusi terisolasi baru tidak mewarisi otoritas pengiriman atau runtime kedaluwarsa dari eksekusi lama.

## Kunci sesi (`sessionKey`)

Sebuah `sessionKey` mengidentifikasi wadah percakapan yang Anda tempati (perutean + isolasi). Aturan kanonis: [/concepts/session](/id/concepts/session).

| Pola                         | Contoh                                                      |
| ---------------------------- | ----------------------------------------------------------- |
| Obrolan utama/langsung (per agen) | `agent:<agentId>:<mainKey>` (bawaan `main`)                |
| Grup                         | `agent:<agentId>:<channel>:group:<id>`                      |
| Ruang/saluran (Discord/Slack) | `agent:<agentId>:<channel>:channel:<id>` atau `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>` (kecuali diganti)                           |

## Id sesi (`sessionId`)

Setiap `sessionKey` menunjuk ke `sessionId` saat ini (identitas transkrip SQLite yang melanjutkan percakapan). Logika keputusan berada di `initSessionState()` dalam `src/auto-reply/reply/session.ts`.

- **Reset** (`/new`, `/reset`) membuat `sessionId` baru untuk `sessionKey` tersebut.
- **Reset harian** (default pukul 4:00 AM waktu lokal pada host Gateway) membuat `sessionId` baru pada pesan berikutnya setelah batas reset.
- **Kedaluwarsa karena tidak aktif** (`session.reset.idleMinutes`, atau `session.idleMinutes` lama) membuat `sessionId` baru ketika pesan tiba setelah periode tidak aktif. Jika reset harian dan kedaluwarsa karena tidak aktif dikonfigurasi sekaligus, yang lebih dahulu kedaluwarsa akan berlaku.
- **Melanjutkan kembali setelah Control UI tersambung ulang** mempertahankan sesi yang saat ini terlihat untuk satu pengiriman setelah tersambung ulang ketika Gateway menerima `sessionId` yang cocok dari klien UI operator. Ini adalah sinyal sekali pakai; pengiriman basi biasa tetap membuat `sessionId` baru.
- **Peristiwa sistem** (Heartbeat, pemicuan Cron, notifikasi exec, pencatatan administratif Gateway) dapat mengubah baris sesi, tetapi tidak pernah memperpanjang kesegaran reset harian/tidak aktif. Pergantian akibat reset membuang notifikasi peristiwa sistem yang mengantre untuk sesi sebelumnya sebelum prompt baru dibuat.
- **Kebijakan fork induk** menggunakan cabang aktif OpenClaw saat membuat fork utas atau subagen. Jika cabang tersebut terlalu besar (melebihi batas internal tetap, saat ini 100K token), OpenClaw memulai anak dengan konteks terisolasi alih-alih gagal atau mewarisi riwayat yang tidak dapat digunakan. Penentuan ukuran berlangsung otomatis dan tidak dapat dikonfigurasi; konfigurasi lama `session.parentForkMaxTokens` dihapus oleh `openclaw doctor --fix`.
- **Fork operator**: `sessions.create { parentSessionKey, fork: true }` membuat sesi baru yang transkripnya bercabang dari status terkini induk (mekanisme fork yang sama dengan pembuatan subagen, termasuk batas ukuran di atas). Fork ditolak saat induk memiliki proses aktif, mewarisi pilihan model induk kecuali pilihan lain diberikan secara eksplisit, dan menandai anak sebagai `forkedFromParent` dengan penghitung token baru.

## Skema penyimpanan sesi

Penyimpanan runtime menyimpan nilai `SessionEntry` dalam SQLite per agen. Tipe nilainya adalah `SessionEntry` dalam `src/config/sessions.ts`. Bidang utama (tidak lengkap):

- `sessionId`: id transkrip saat ini yang digunakan untuk mengalamatkan baris transkrip SQLite
- `sessionStartedAt`: stempel waktu mulai untuk `sessionId` saat ini; kesegaran reset harian menggunakan nilai ini. Baris lama dapat menurunkannya dari header sesi JSONL.
- `lastInteractionAt`: stempel waktu interaksi nyata terakhir dari pengguna/channel; kesegaran reset karena tidak aktif menggunakan nilai ini agar peristiwa Heartbeat, Cron, dan exec tidak mempertahankan sesi tetap aktif. Baris lama tanpa bidang ini menggunakan waktu mulai sesi yang dipulihkan sebagai fallback.
- `updatedAt`: stempel waktu perubahan terakhir pada baris penyimpanan, digunakan untuk pencantuman/pemangkasan/pencatatan administratif—bukan otoritas kesegaran harian/tidak aktif.
- `archivedAt`: stempel waktu pengarsipan opsional. Sesi yang diarsipkan tetap berada dalam penyimpanan dengan transkripnya utuh dan dikecualikan dari daftar aktif normal.
- `pinnedAt`: stempel waktu penyematan opsional. Sesi aktif yang disematkan diurutkan sebelum sesi yang tidak disematkan; pengarsipan sesi menghapus sematannya.
- Interoperabilitas utas Codex: kedua bidang mengikuti bentuk pengelolaan utas Codex—boolean `archived`/`pinned` pada jalur komunikasi selalu diturunkan dari stempel waktu dan ditetapkan di sisi server, sesuai dengan semantik `threads.archived_at` Codex dan serialisasi camelCase. Stempel waktu OpenClaw menggunakan milidetik epoch, sedangkan Codex menggunakan detik epoch, sehingga bridge melakukan konversi pada batas Plugin `codex`. Codex belum memiliki API penyematan (hanya `thread/archive`/`thread/unarchive`); status penyematan tetap berada di sisi OpenClaw hingga API tersebut tersedia, lalu bentuk yang cocok memungkinkan sesi terikat melakukan perjalanan pulang-pergi status penyematan secara mekanis.
- Supervisi Codex hanya mencantumkan utas native yang tidak diarsipkan. Utas lokal Gateway `idle` atau `notLoaded` yang aktivitasnya tidak diketahui hanya dapat diarsipkan melalui `thread/archive` native setelah operator secara eksplisit mengonfirmasi bahwa tidak ada proses Codex lain yang memilikinya; Plugin terlebih dahulu melakukan pembacaan status lokal proses terbaru, kemudian utas menghilang dari katalog. Pembacaan tersebut tidak dapat membuktikan bahwa proses App Server lain tidak sedang menggunakan utas tersebut. OpenClaw menolak mengarsipkan baris aktif dan galat, dan pengarsipan node berpasangan tidak tersedia hingga bridge node dapat memiliki seluruh siklus hidup utas streaming. Membatalkan pengarsipan dalam klien Codex native membuat utas memenuhi syarat untuk muncul kembali.
- `lastReadAt` / `markedUnreadAt`: stempel waktu status baca yang ditetapkan di sisi server oleh `sessions.patch { unread }`—`unread: false` mencatat pembacaan (menetapkan `lastReadAt`, menghapus `markedUnreadAt`); `unread: true` menandai sesi belum dibaca hingga pembacaan berikutnya. Baris sesi mengekspos boolean turunan `unread`: ditandai belum dibaca secara eksplisit, atau dibaca sebelum aktivitas terbaru. Sesi yang belum pernah ditandai telah dibaca tetap `unread: false`, sehingga instalasi yang sudah ada tidak menyala setelah peningkatan versi.
- `lastActivityAt`: stempel waktu proses agen terakhir yang selesai dan dianggap sebagai aktivitas yang layak ditandai belum dibaca (proses pengguna, channel, dan Cron). Giliran Heartbeat dan peristiwa internal, serta patch metadata, tidak memperbaruinya; `updatedAt` bukan sinyal aktivitas.
- `sessionFile`: penanda lama yang dipertahankan untuk kompatibilitas migrasi/arsip; runtime aktif menggunakan identitas SQLite
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: metadata pelabelan grup/channel
- Sakelar: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (penggantian per sesi)
- Pemilihan model: `providerOverride`, `modelOverride`, `authProfileOverride`
- Penghitung token (upaya terbaik/bergantung pada penyedia): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: jumlah penyelesaian Compaction otomatis untuk kunci sesi ini
- `memoryFlushAt` / `memoryFlushCompactionCount`: stempel waktu dan jumlah Compaction dari pembuangan memori pra-Compaction terakhir

Gateway adalah otoritas: Gateway dapat menulis ulang atau merehidrasi entri saat sesi
berjalan. Untuk instalasi lama yang didukung berkas, lakukan migrasi dengan
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` alih-alih
mengedit `sessions.json` dan mengharapkan runtime terus membaca berkas tersebut.

## Struktur peristiwa transkrip

Transkrip dikelola oleh pengakses sesi OpenClaw dan diekspos ke kode runtime melalui pembantu berbasis identitas. Aliran peristiwa hanya dapat ditambahkan:

- Entri pertama: header sesi—`type: "session"`, `id`, `cwd`, `timestamp`, `parentSession` opsional.
- Kemudian: entri dengan `id` + `parentId` (struktur pohon).

Jenis entri penting:

- `message`: pesan pengguna/asisten/toolResult
- `custom_message`: pesan yang diinjeksi ekstensi dan _memang_ masuk ke konteks model (dirender dalam TUI saat `display: true`, disembunyikan sepenuhnya saat `display: false`)
- `custom`: status ekstensi yang _tidak_ masuk ke konteks model (untuk mempertahankan status ekstensi setelah pemuatan ulang)
- `compaction`: ringkasan Compaction yang dipertahankan dengan `firstKeptEntryId` dan `tokensBefore`
- `branch_summary`: ringkasan yang dipertahankan saat menavigasi cabang pohon

OpenClaw sengaja tidak "memperbaiki" transkrip; Gateway menggunakan `SessionManager` untuk membaca/menulisnya.

## Jendela konteks vs token terlacak

Dua konsep yang berbeda:

1. **Jendela konteks model**: batas maksimum tetap per model (token yang terlihat oleh model). Berasal dari katalog model dan dapat diganti melalui konfigurasi.
2. **Penghitung penyimpanan sesi**: statistik bergulir yang ditulis ke baris sesi (digunakan untuk `/status` dan dasbor). `contextTokens` adalah nilai estimasi/pelaporan runtime—jangan menganggapnya sebagai jaminan ketat.

Selengkapnya tentang batas: [/reference/token-use](/id/reference/token-use).

## Compaction: pengertiannya

Compaction merangkum percakapan lama menjadi entri `compaction` yang dipertahankan dalam transkrip dan menjaga pesan terbaru tetap utuh. Setelah Compaction, giliran berikutnya melihat ringkasan Compaction ditambah pesan setelah `firstKeptEntryId`. Compaction bersifat **persisten**, tidak seperti pemangkasan sesi—lihat [/concepts/session-pruning](/id/concepts/session-pruning).

Injeksi ulang bagian AGENTS.md setelah Compaction bersifat opsional melalui `agents.defaults.compaction.postCompactionSections`; ketika tidak ditetapkan atau bernilai `[]`, OpenClaw tidak menambahkan kutipan AGENTS.md di atas ringkasan Compaction.

### Batas potongan dan pemasangan alat

Saat membagi transkrip panjang menjadi potongan Compaction, OpenClaw menjaga panggilan alat asisten tetap berpasangan dengan entri `toolResult` yang sesuai:

- Jika pembagian porsi token akan berada di antara panggilan alat dan hasilnya, OpenClaw menggeser batas ke pesan panggilan alat asisten alih-alih memisahkan pasangan tersebut.
- Jika blok hasil alat di bagian akhir seharusnya membuat potongan melampaui target, OpenClaw mempertahankan blok alat yang tertunda tersebut dan menjaga bagian akhir yang belum dirangkum tetap utuh.
- Blok panggilan alat yang dibatalkan/galat tidak mempertahankan pembagian tertunda tetap terbuka.

## Waktu Compaction otomatis terjadi

Dua pemicu dalam agen OpenClaw tertanam:

1. **Pemulihan luapan**: model mengembalikan galat luapan konteks (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded`, dan varian berbentuk penyedia lainnya)—lakukan Compaction, lalu coba lagi. Ketika penyedia melaporkan jumlah token yang dicoba, OpenClaw meneruskan jumlah yang diamati tersebut ke Compaction pemulihan luapan; jika penyedia mengonfirmasi luapan tetapi tidak mengekspos jumlah yang dapat diurai, OpenClaw meneruskan jumlah sintetis yang sedikit melebihi anggaran ke mesin Compaction dan diagnostik. Jika pemulihan luapan tetap gagal, OpenClaw menampilkan panduan eksplisit dan mempertahankan pemetaan sesi saat ini alih-alih diam-diam beralih ke id sesi baru—coba lagi pesannya, jalankan `/compact`, atau jalankan `/new`.
2. **Pemeliharaan ambang batas**: setelah giliran berhasil, ketika `contextTokens > contextWindow - reserveTokens`, dengan `contextWindow` sebagai jendela konteks model dan `reserveTokens` sebagai ruang cadangan untuk prompt ditambah keluaran model berikutnya.

Dua pengaman tambahan berjalan di luar kedua pemicu ini:

- **Compaction lokal prapemeriksaan**: tetapkan `agents.defaults.compaction.maxActiveTranscriptBytes` (byte atau string seperti `"20mb"`) untuk memicu Compaction lokal sebelum membuka proses berikutnya setelah transkrip aktif mencapai ukuran tersebut. Ini adalah pengaman ukuran untuk biaya pembukaan ulang lokal, bukan pengarsipan mentah—Compaction semantik normal tetap berjalan, dan memerlukan `truncateAfterCompaction` agar ringkasan hasil Compaction menjadi transkrip penerus baru.
- **Prapemeriksaan di tengah giliran**: tetapkan `agents.defaults.compaction.midTurnPrecheck.enabled: true` (default `false`) untuk menambahkan pengaman perulangan alat. Setelah hasil alat ditambahkan dan sebelum panggilan model berikutnya, OpenClaw memperkirakan tekanan prompt menggunakan logika anggaran prapemeriksaan yang sama dengan yang digunakan pada awal giliran. Jika konteks tidak lagi mencukupi, pengaman tidak melakukan Compaction secara inline—pengaman memunculkan sinyal prapemeriksaan tengah giliran yang terstruktur, menghentikan pengiriman prompt saat ini, dan membiarkan perulangan proses luar menggunakan jalur pemulihan yang ada (memotong hasil alat yang terlalu besar jika itu mencukupi, atau memicu mode Compaction yang dikonfigurasi dan mencoba lagi). Berfungsi dengan mode Compaction `default` maupun `safeguard`, termasuk Compaction pengaman yang didukung penyedia. Tidak bergantung pada `maxActiveTranscriptBytes`: pengaman ukuran byte berjalan sebelum giliran dibuka, sedangkan prapemeriksaan tengah giliran berjalan kemudian, setelah hasil alat baru ditambahkan.

## Pengaturan Compaction

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        reserveTokens: 16384,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw juga memberlakukan batas bawah keamanan untuk eksekusi tertanam: jika `compaction.reserveTokens` berada di bawah `reserveTokensFloor` (nilai default `20000`), OpenClaw menaikkannya. Atur `agents.defaults.compaction.reserveTokensFloor: 0` untuk menonaktifkan batas bawah tersebut. Jika jendela konteks model aktif diketahui, batas bawah dan cadangan efektif akhir sama-sama dibatasi agar cadangan tidak menghabiskan seluruh anggaran prompt. Hal ini mencegah model berkonteks kecil (misalnya model lokal dengan 16K token) memasuki Compaction sejak token pertama; tanpa jendela konteks yang diketahui, anggaran cadangan yang dikonfigurasi dan yang sedang berlaku tetap tidak dibatasi. Alasan adanya batas bawah: menyediakan ruang yang cukup untuk "pemeliharaan" multi-giliran (seperti pengosongan memori di bawah) sebelum Compaction tidak dapat dihindari. Implementasi: `applyAgentCompactionSettingsFromConfig()` di `src/agents/agent-settings.ts`, dipanggil dari jalur penyiapan giliran runner tertanam dan Compaction.

`/compact` manual menghormati `agents.defaults.compaction.keepRecentTokens` yang ditentukan secara eksplisit dan mempertahankan titik pemotongan ekor terbaru milik runtime. Tanpa anggaran penyimpanan eksplisit, Compaction manual menjadi titik pemeriksaan tegas dan konteks yang dibangun ulang dimulai dari ringkasan baru.

Jika `truncateAfterCompaction` diaktifkan, OpenClaw merotasi transkrip aktif ke penerus yang telah dipadatkan setelah Compaction. Tindakan titik pemeriksaan percabangan/pemulihan menggunakan penerus yang telah dipadatkan tersebut; berkas titik pemeriksaan lama sebelum Compaction tetap dapat dibaca selama masih dirujuk.

## Penyedia Compaction yang dapat dipasang

Plugin mendaftarkan penyedia Compaction melalui `registerCompactionProvider()` pada API Plugin. Jika `agents.defaults.compaction.provider` diatur ke id penyedia yang terdaftar, ekstensi pengaman mendelegasikan peringkasan kepada penyedia tersebut, bukan kepada pipeline `summarizeInStages` bawaan.

- `provider`: id Plugin penyedia Compaction yang terdaftar. Biarkan tidak diatur untuk peringkasan LLM default. Mengatur `provider` akan memaksa `mode: "safeguard"`.
- Penyedia menerima instruksi Compaction dan kebijakan pelestarian pengenal yang sama dengan jalur bawaan, dan pengaman tetap mempertahankan konteks akhiran giliran terbaru serta giliran terbagi setelah keluaran penyedia.
- Peringkasan pengaman bawaan menyaring ulang ringkasan sebelumnya bersama pesan baru, alih-alih mempertahankan seluruh ringkasan sebelumnya secara verbatim.
- Mode pengaman mengaktifkan audit kualitas ringkasan secara default; atur `qualityGuard.enabled: false` untuk melewati perilaku percobaan ulang saat keluaran tidak valid.
- Jika penyedia gagal atau mengembalikan hasil kosong, OpenClaw secara otomatis kembali menggunakan peringkasan LLM bawaan. Sinyal pembatalan/batas waktu yang dipicu secara eksplisit oleh pemanggil dilemparkan kembali, bukan ditelan, sehingga pembatalan selalu dipatuhi.

Sumber: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Permukaan yang terlihat oleh pengguna

- `/status` dalam sesi obrolan apa pun
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Log Gateway (`pnpm gateway:watch` atau `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Mode verbose: `🧹 Auto-compaction complete` ditambah jumlah Compaction

## Pemeliharaan senyap (`NO_REPLY`)

OpenClaw mendukung giliran "senyap" untuk tugas latar belakang ketika pengguna tidak boleh melihat keluaran perantara.

- Asisten memulai keluarannya dengan token senyap persis `NO_REPLY` / `no_reply` yang berarti "jangan kirimkan balasan kepada pengguna." OpenClaw menghapus/menyembunyikannya pada lapisan pengiriman.
- Penyembunyian token senyap persis tidak peka huruf besar-kecil: `NO_REPLY` dan `no_reply` sama-sama dihitung jika seluruh muatan hanya berisi token senyap.
- Sejak `2026.1.10`, OpenClaw juga menyembunyikan streaming draf/indikator mengetik jika potongan parsial diawali dengan `NO_REPLY`, sehingga operasi senyap tidak membocorkan keluaran parsial di tengah giliran.
- Ini hanya untuk giliran latar belakang/tanpa pengiriman yang sebenarnya—bukan jalan pintas untuk permintaan pengguna biasa yang dapat ditindaklanjuti.

## Pengosongan memori sebelum Compaction

Sebelum Compaction otomatis terjadi, OpenClaw dapat menjalankan giliran agentik senyap yang menulis status persisten ke disk (misalnya `memory/YYYY-MM-DD.md` di ruang kerja agen) agar Compaction tidak dapat menghapus konteks penting. OpenClaw memantau penggunaan konteks sesi, dan setelah melewati ambang lunak di bawah ambang Compaction, OpenClaw mengirimkan arahan senyap "tulis memori sekarang" menggunakan token senyap persis `NO_REPLY` / `no_reply` sehingga pengguna tidak melihat apa pun.

Konfigurasi (`agents.defaults.compaction.memoryFlush`), referensi lengkap di [/gateway/config-agents](/id/gateway/config-agents#agentsdefaultscompaction):

| Kunci                         | Default          | Catatan                                                                                                                                  |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | tidak diatur            | penggantian penyedia/model yang persis hanya untuk giliran pengosongan, misalnya `ollama/qwen3:8b`                                                   |
| `softThresholdTokens`       | `4000`           | selisih di bawah ambang Compaction yang memicu pengosongan                                                                               |
| `forceFlushTranscriptBytes` | tidak diatur (dinonaktifkan) | paksa pengosongan setelah berkas transkrip mencapai ukuran byte ini (atau string seperti `"2mb"`), meskipun penghitung token sudah usang; `0` menonaktifkannya |
| `prompt`                    | bawaan         | pesan pengguna untuk giliran pengosongan                                                                                                        |
| `systemPrompt`              | bawaan         | prompt sistem tambahan yang disisipkan untuk giliran pengosongan                                                                                        |

Catatan:

- Prompt/prompt sistem default menyertakan petunjuk `NO_REPLY` untuk menyembunyikan pengiriman.
- Jika `model` diatur, giliran pengosongan menggunakan model tersebut tanpa mewarisi rantai fallback sesi aktif, sehingga pemeliharaan khusus lokal tidak secara diam-diam beralih ke model percakapan berbayar jika terjadi kegagalan.
- Pengosongan berjalan satu kali per siklus Compaction (dilacak pada baris sesi).
- Pengosongan hanya berjalan untuk sesi OpenClaw tertanam; backend CLI dan giliran Heartbeat melewatinya.
- Pengosongan dilewati jika ruang kerja sesi bersifat hanya-baca (`workspaceAccess: "ro"` atau `"none"`).
- Lihat [Memori](/id/concepts/memory) untuk tata letak berkas ruang kerja dan pola penulisan.

OpenClaw mengekspos hook `session_before_compact` dalam API ekstensi, tetapi logika pengosongan di atas berada di sisi Gateway (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), bukan pada hook tersebut.

## Daftar periksa pemecahan masalah

- **Kunci sesi salah?** Mulailah dengan [/concepts/session](/id/concepts/session) dan konfirmasikan `sessionKey` dalam `/status`.
- **Ketidakcocokan penyimpanan dan transkrip?** Konfirmasikan host Gateway dan jalur penyimpanan dari `openclaw status`.
- **Compaction terus-menerus?** Periksa jendela konteks model (terlalu kecil memaksa Compaction yang sering), `reserveTokens` (terlalu tinggi untuk jendela model menyebabkan Compaction lebih awal), dan pembengkakan hasil alat (sesuaikan pemangkasan sesi).
- **Setiap prompt tampaknya melampaui batas pada model lokal kecil?** Pastikan penyedia melaporkan jendela konteks model yang benar. OpenClaw hanya dapat membatasi cadangan efektif jika jendela tersebut diketahui.
- **Giliran senyap bocor?** Pastikan balasan diawali dengan token senyap persis `NO_REPLY` (tidak peka huruf besar-kecil) dan Anda menggunakan build yang menyertakan perbaikan penyembunyian streaming (`2026.1.10`+).

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Mesin konteks](/id/concepts/context-engine)
- [Referensi konfigurasi agen](/id/gateway/config-agents)
