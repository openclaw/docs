---
read_when:
    - Anda mengalami masalah konektivitas/autentikasi dan menginginkan panduan perbaikan
    - Anda telah memperbaruinya dan ingin melakukan pemeriksaan kewajaran
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: Dokter
x-i18n:
    generated_at: "2026-07-16T17:53:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 322af63f52a3d864e46da332353ca921a4462e13fa849986d936524759f80ccc
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Pemeriksaan kesehatan dan perbaikan cepat untuk Gateway, saluran, plugin, Skills, perutean model, status lokal, dan migrasi konfigurasi. Gunakan kapan pun sesuatu tidak berfungsi seperti yang diharapkan dan Anda ingin satu perintah menjelaskan masalahnya.

Terkait:

- Pemecahan masalah: [Pemecahan masalah](/id/gateway/troubleshooting)
- Audit keamanan: [Keamanan](/id/gateway/security)

## Postur

Doctor memiliki lima postur:

| Postur                    | Perintah                                  | Perilaku                                                                                      |
| ------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| Inspeksi                  | `openclaw doctor`                        | Pemeriksaan yang berorientasi pada manusia dan prompt terpandu.                               |
| Perbaikan                 | `openclaw doctor --fix`                        | Menerapkan perbaikan yang didukung, menggunakan prompt kecuali perbaikan noninteraktif aman. |
| Lint                      | `openclaw doctor --lint`                        | Temuan terstruktur hanya-baca untuk CI, pemeriksaan awal, dan gerbang peninjauan.             |
| Pemeliharaan SQLite bersama | `openclaw doctor --state-sqlite compact`                      | Secara eksplisit membuat checkpoint, memadatkan, dan memverifikasi DB status bersama kanonis. |
| Migrasi SQLite sesi       | `openclaw doctor --session-sqlite <mode>`                        | Memeriksa, mengimpor, memvalidasi, memadatkan, memulihkan, atau merestorasi status sesi.      |

Utamakan `--lint` ketika otomatisasi memerlukan hasil yang stabil. Utamakan `--fix` ketika operator manusia ingin doctor mengedit konfigurasi atau status.

## Contoh

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
openclaw doctor --state-sqlite compact
openclaw doctor --state-sqlite compact --json
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-agent main --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Untuk izin khusus saluran, gunakan probe saluran sebagai pengganti `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` melaporkan izin efektif bot untuk target saluran tertentu. `channels status --probe` mengaudit semua saluran yang dikonfigurasi dan target bergabung otomatis ke suara.

## Opsi

| Opsi                            | Efek                                                                                                                                                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`              | Menonaktifkan saran memori/pencarian ruang kerja.                                                                                                                                                         |
| `--yes`              | Menerima nilai default tanpa prompt.                                                                                                                                                                      |
| `--repair` / `--fix` | Menerapkan perbaikan nonlayanan yang direkomendasikan tanpa prompt (`--fix` adalah alias). Instalasi/penulisan ulang layanan Gateway tetap memerlukan konfirmasi interaktif atau perintah `gateway` eksplisit. |
| `--force`              | Menerapkan perbaikan agresif, termasuk menimpa konfigurasi layanan khusus.                                                                                                                                |
| `--non-interactive`              | Berjalan tanpa prompt; hanya migrasi aman dan perbaikan nonlayanan.                                                                                                                                       |
| `--generate-gateway-token`              | Menghasilkan dan mengonfigurasi token Gateway.                                                                                                                                                            |
| `--allow-exec`              | Mengizinkan doctor mengeksekusi SecretRef `exec` yang dikonfigurasi saat memverifikasi rahasia.                                                                                               |
| `--deep`              | Memindai layanan sistem untuk instalasi Gateway tambahan; melaporkan serah terima mulai ulang supervisor Gateway terbaru.                                                                                  |
| `--lint`              | Menjalankan pemeriksaan kesehatan yang dimodernisasi dalam mode hanya-baca dan menghasilkan temuan diagnostik.                                                                                            |
| `--post-upgrade`              | Menjalankan probe kompatibilitas plugin pascapeningkatan; temuan dikirim ke stdout; kode keluar 1 jika terdapat temuan tingkat kesalahan.                                                                 |
| `--state-sqlite <mode>`              | Menjalankan pemeliharaan SQLite status bersama secara eksplisit. Satu-satunya mode adalah `compact`.                                                                                             |
| `--session-sqlite <mode>`              | Menjalankan mode migrasi SQLite sesi yang ditargetkan: `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover`, atau `restore`. |
| `--session-sqlite-store <path>`              | Dengan `--session-sqlite`: memilih satu jalur penyimpanan `sessions.json` lama.                                                                                                                        |
| `--session-sqlite-agent <id>`              | Dengan `--session-sqlite`: memilih satu agen yang dikonfigurasi.                                                                                                                                         |
| `--session-sqlite-all-agents`              | Dengan `--session-sqlite`: memilih penyimpanan agen yang dikonfigurasi dan ditemukan.                                                                                                                     |
| `--github-issue`              | Dengan `--session-sqlite recover`: menyiapkan laporan masalah openclaw/openclaw yang disanitasi; doctor membuatnya dengan `gh` setelah `--yes` atau konfirmasi interaktif.                 |
| `--json`              | Dengan `--lint`: temuan JSON. Dengan `--post-upgrade`: `{ probesRun, findings }`. Dengan `--state-sqlite` atau `--session-sqlite`: laporan pemeliharaan sebagai JSON.                              |
| `--severity-min <level>`              | Dengan `--lint`: menghapus temuan di bawah `info`, `warning`, atau `error`.                                                                                     |
| `--all`              | Dengan `--lint`: menjalankan semua pemeriksaan terdaftar, termasuk pemeriksaan opsional yang dikecualikan dari set default.                                                                     |
| `--skip <id>`              | Dengan `--lint`: melewati ID pemeriksaan. Dapat diulang.                                                                                                                                        |
| `--only <id>`              | Dengan `--lint`: hanya menjalankan ID pemeriksaan yang diberikan. Dapat diulang.                                                                                                                |

`--severity-min`, `--all`, `--only`, dan `--skip` hanya diterima bersama dengan `--lint`; `--json` diterima dengan `--lint`, `--post-upgrade`, `--state-sqlite`, dan `--session-sqlite`.

## Mode lint

`openclaw doctor --lint` bersifat hanya-baca: tanpa prompt, tanpa perbaikan, tanpa penulisan ulang konfigurasi/status.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

Output untuk manusia bersifat ringkas:

```text
doctor --lint: menjalankan 6 pemeriksaan, 1 temuan
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode belum ditetapkan; Gateway tidak akan dapat dimulai.
    perbaikan: Jalankan `openclaw configure` dan tetapkan mode Gateway (lokal/jarak jauh), atau `openclaw config set gateway.mode local`.
```

Output JSON merupakan antarmuka skrip:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode belum ditetapkan; Gateway tidak akan dapat dimulai.",
      "path": "gateway.mode",
      "fixHint": "Jalankan `openclaw configure` dan tetapkan mode Gateway (lokal/jarak jauh), atau `openclaw config set gateway.mode local`."
    }
  ]
}
```

Kode keluar:

| Kode | Arti                                                                    |
| ---- | ----------------------------------------------------------------------- |
| `0`  | Tidak ada temuan pada atau di atas ambang tingkat keparahan yang dipilih. |
| `1`  | Setidaknya satu temuan memenuhi ambang yang dipilih.                     |
| `2`  | Kegagalan perintah/runtime sebelum temuan lint dapat dihasilkan.         |

`--severity-min` mengontrol temuan yang dicetak sekaligus ambang keluar: `openclaw doctor --lint --severity-min error` dapat tidak mencetak apa pun dan keluar dengan `0` meskipun terdapat temuan `info`/`warning` dengan tingkat keparahan lebih rendah.

`--all` mengontrol pemeriksaan yang dipilih sebelum pemfilteran tingkat keparahan. Proses lint default mengecualikan pemeriksaan yang mendalam, historis, atau lebih mungkin menemukan residu lama yang dapat diperbaiki; gunakan `--all` untuk inventaris lengkap. `--only <id>` adalah pemilih paling presisi dan dapat menjalankan pemeriksaan terdaftar apa pun berdasarkan ID.

`core/doctor/local-audio-acceleration` melaporkan perintah STT lokal yang dipilih secara otomatis, bukti backend yang mampu/diminta/diamati secara terpisah, dan urutan fallback tanpa memuat model ucapan. Ini menghasilkan temuan informasional, jadi sertakan `--severity-min info` untuk menampilkannya.

## Pemeriksaan kesehatan terstruktur

Pemeriksaan doctor modern menggunakan kontrak terbagi yang sederhana:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` mendukung `doctor --lint`. `repair()` bersifat opsional dan hanya berjalan dalam `doctor --fix` / `doctor --repair`. Pemeriksaan yang belum dimigrasikan ke bentuk ini masih menggunakan alur kontribusi doctor lama.

Konteks perbaikan dapat membawa permintaan `dryRun`/`diff`; hasil perbaikan dapat mengembalikan `diffs` terstruktur (pengeditan konfigurasi/file) dan `effects` (layanan, proses, paket, status, atau efek samping lainnya), sehingga pemeriksaan yang dikonversi dapat berkembang menuju `doctor --fix --dry-run` tanpa memindahkan perencanaan mutasi ke `detect()`.

`repair()` melaporkan `status: "repaired" | "skipped" | "failed"` (status yang tidak dicantumkan berarti `repaired`). Saat perbaikan mengembalikan `skipped` atau `failed`, doctor melaporkan alasannya dan melewati validasi untuk pemeriksaan tersebut. Setelah perbaikan berhasil, doctor menjalankan ulang `detect()` dengan cakupan temuan yang diperbaiki; jika temuan masih ada, doctor melaporkan peringatan perbaikan alih-alih menganggap perubahan telah selesai.

Temuan mencakup:

| Bidang            | Tujuan                                                        |
| ----------------- | ------------------------------------------------------------- |
| `checkId`         | ID stabil untuk filter lewati/hanya dan daftar izin CI.       |
| `severity`        | `info`, `warning`, atau `error`.                         |
| `message`         | Pernyataan masalah yang dapat dibaca manusia.                  |
| `path`            | Konfigurasi, file, atau jalur logis jika tersedia.             |
| `line` / `column` | Lokasi sumber jika tersedia.                                  |
| `ocPath`          | Alamat `oc://` yang tepat saat pemeriksaan dapat menunjuk ke salah satunya. |
| `fixHint`         | Tindakan operator yang disarankan atau ringkasan perbaikan.    |

Pemeriksaan doctor inti yang dimodernisasi tetap terhubung dengan kontribusi doctor berurutan yang memiliki perilaku manusiawi `doctor` / `doctor --fix` terkait. Registri kesehatan terstruktur bersama merupakan titik ekstensi: pemeriksaan bawaan dan yang didukung Plugin berjalan setelah pemeriksaan doctor inti setelah paket pemiliknya mendaftarkannya dalam jalur perintah aktif. `openclaw/plugin-sdk/health` menyediakan kontrak yang sama bagi pembuat Plugin.

## Pemilihan pemeriksaan

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` dan `--skip` menerima ID pemeriksaan lengkap dan dapat diulang. Jika ID `--only` tidak terdaftar, tidak ada pemeriksaan yang berjalan untuk ID tersebut; gunakan `checksRun`/`checksSkipped` dalam keluaran untuk memastikan bahwa gerbang terfokus memilih pemeriksaan yang Anda harapkan.

## Mode pascapeningkatan

`openclaw doctor --post-upgrade` menjalankan pemeriksaan kompatibilitas Plugin untuk dirangkai setelah pembangunan atau peningkatan. Temuan dikirim ke stdout; kode keluar adalah 1 jika ada temuan yang memiliki `level: "error"`. Tambahkan `--json` untuk selubung yang dapat dibaca mesin (`{ probesRun, findings }`), yang sesuai untuk CI, skill komunitas `fork-upgrade`, dan alat uji cepat pascapeningkatan lainnya. Jika indeks Plugin yang terpasang hilang atau rusak, mode JSON tetap mengeluarkan selubung dengan temuan kesalahan `plugin.index_unavailable`.

Startup citra kontainer merupakan pengecualian dari alur biasa "jalankan doctor setelah
memperbarui". Saat `openclaw gateway run` dimulai pada versi OpenClaw baru, proses tersebut
menjalankan perbaikan status dan Plugin yang aman sebelum melaporkan siap. Jika perbaikan tidak dapat
diselesaikan dengan aman, startup akan keluar dan meminta Anda menjalankan citra yang sama sekali dengan
`openclaw doctor --fix` terhadap status/konfigurasi terpasang yang sama sebelum memulai ulang
kontainer secara normal.

## Compaction SQLite status bersama

`openclaw doctor --state-sqlite compact` adalah pemeliharaan luring eksplisit untuk
basis data status bersama kanonis di
`<state-dir>/state/openclaw.sqlite`. Perintah ini tidak menerima jalur basis data
sembarang, tidak pernah dipanggil oleh operasi Gateway normal, dan bukan bagian dari
`openclaw doctor --fix`. Perintah memperoleh kunci kepemilikan status yang sama dengan
startup Gateway dan menahannya selama validasi, checkpoint, `VACUUM`, serta
pemeriksaan integritas akhir. Perintah menolak berjalan saat Gateway atau perintah
pemeliharaan SQLite lain memiliki kunci tersebut. Kunci status tetap aktif saat
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` melewati singleton Gateway per konfigurasi, sehingga
shell operator tidak perlu mewarisi lingkungan layanan Gateway agar
pemeliharaan dapat mendeteksinya.

Hentikan Gateway dan buat cadangan terverifikasi terlebih dahulu:

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

Perintah tersebut:

1. Memerlukan file reguler pada jalur status bersama kanonis. Basis data yang
   hilang dilaporkan sebagai `skipped` dan keluar dengan sukses.
2. Memvalidasi versi skema yang saat ini didukung dan
   `schema_meta.role = "global"` sebelum melakukan checkpoint atau mengubah file.
3. Memerlukan `wal_checkpoint(TRUNCATE)` yang tidak sibuk. Hentikan semua proses OpenClaw
   yang tersisa dan coba lagi jika checkpoint sibuk.
4. Mengatur `auto_vacuum` menjadi `INCREMENTAL`, menjalankan `VACUUM` penuh, lalu melakukan checkpoint
   lagi.
5. Menjalankan `quick_check`, `integrity_check`, dan `foreign_key_check`, lalu
   menerapkan kembali izin khusus pemilik ke basis data dan file sidecar SQLite.

Keluaran JSON melaporkan ukuran basis data dan WAL, halaman freelist, ukuran halaman, serta
nilai `auto_vacuum` sebelum dan sesudah Compaction, ditambah byte yang diperoleh kembali serta
hasil `quick_check` dan `integrity_check`. `foreign_key_check` diberlakukan
dengan gagal-tertutup dan tidak memiliki bidang keberhasilan terpisah. SQLite melaporkan `auto_vacuum` sebagai
`0` untuk tidak ada, `1` untuk penuh, dan `2` untuk inkremental.

Compaction gagal tanpa mutasi saat skema sudah lama, lebih baru daripada
build OpenClaw yang sedang berjalan, atau dimiliki basis data agen. Jalankan
`openclaw doctor --fix` terlebih dahulu untuk skema status bersama yang lebih lama. Pulihkan
cadangan yang kompatibel atau tingkatkan OpenClaw untuk skema yang lebih baru.

## Migrasi SQLite sesi

OpenClaw mengimpor baris sesi lama dan riwayat transkrip ke basis data SQLite
setiap agen secara otomatis selama startup Gateway dan selama
`openclaw doctor --fix`. `openclaw doctor --session-sqlite <mode>` adalah
alat inspeksi dan validasi yang ditargetkan untuk migrasi tersebut. Baris sesi
runtime saat ini berada di
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. File
`sessions.json` lama adalah sumber migrasi. File JSONL transkrip aktif
diimpor dan diarsipkan keluar dari direktori sesi aktif setelah
impor berhasil; file JSONL tingkat arsip tetap menjadi artefak dukungan, bukan
fallback runtime.

Mode:

| Mode       | Perilaku                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | Membaca jumlah data lama dan SQLite, serta file JSONL yang tidak dirujuk, tanpa mengimpor.                                      |
| `dry-run`  | Mengurai entri lama dan file JSONL transkrip, menghitung baris yang dapat diimpor, dan melaporkan masalah tanpa menulis baris SQLite. |
| `import`   | Mengimpor entri lama dan peristiwa transkrip ke SQLite untuk target yang dipilih.                                               |
| `validate` | Membandingkan sumber lama yang dipilih dengan baris SQLite dan jumlah peristiwa transkrip.                                      |
| `compact`  | Melakukan checkpoint dan VACUUM pada basis data SQLite agen yang dipilih untuk memperoleh kembali halaman bebas setelah penghapusan besar atau pembersihan arsip. |
| `recover`  | Memulihkan proses migrasi gagal terbaru, memvalidasi targetnya, dan menyiapkan laporan isu GitHub yang disanitasi.               |
| `restore`  | Memulihkan artefak transkrip yang diarsipkan dari manifes migrasi yang tercatat tanpa menghapus data SQLite.                     |

Pemilih:

- Default: penyimpanan agen default yang dikonfigurasi, jika file penyimpanan lama tersebut ada.
- `--session-sqlite-agent <id>`: satu agen yang dikonfigurasi.
- `--session-sqlite-all-agents`: penyimpanan agen yang dikonfigurasi ditambah penyimpanan agen yang ditemukan.
- `--session-sqlite-store <path>`: satu jalur `sessions.json` lama yang eksplisit.

Urutan inspeksi manual:

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

Cadangkan direktori status OpenClaw sebelum menjalankan `import` pada instalasi dengan
riwayat penting. `validate` keluar dengan nilai bukan nol saat entri lama yang dipilih
hilang dari SQLite, ID sesi berbeda, atau jumlah peristiwa transkrip berbeda.
Saat menggunakan `--session-sqlite-store <path>`, pastikan laporan memuat
jumlah target yang diharapkan; jalur penyimpanan eksplisit yang tidak ada tidak memilih target apa pun.

Penghapusan SQLite memperoleh kembali halaman di dalam basis data terlebih dahulu; tindakan tersebut tidak selalu
langsung mengecilkan file basis data. Setelah menghapus atau mengarsipkan
transkrip besar, jalankan `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`
untuk melakukan checkpoint pada file WAL, menjalankan `VACUUM`, serta melaporkan ukuran basis data dan WAL
sebelum/sesudah. Compaction memerlukan file reguler dengan skema agen saat ini,
metadata pemilik tahan lama milik agen yang dipilih, dan tidak ada handle terbuka dalam proses
doctor. Mode destruktif `import`, `compact`, `recover`, dan `restore`
menahan kunci kepemilikan status yang sama dengan startup Gateway selama seluruh operasinya;
`inspect`, `dry-run`, dan `validate` tetap hanya-baca dan tidak mengambilnya. Hentikan
Gateway terlebih dahulu. Mode destruktif gagal alih-alih berpacu dengan penulisan langsung atau
berpacu dengan perintah pemeliharaan lain. Target `--session-sqlite-store`
yang destruktif harus berada di dalam direktori status aktif; atur `OPENCLAW_STATE_DIR` ke
direktori status pemilik penyimpanan sebelum memelihara instalasi lain.
Target hard-link yang ada ditolak karena jalur lain dapat berbagi inode
basis data yang sama di luar direktori status yang terkunci. Pemeriksaan kepemilikan
yang sama mencakup sidecar WAL SQLite, memori bersama, dan jurnal rollback.

Setiap impor menulis manifes di bawah
`~/.openclaw/session-sqlite-migration-runs/` sebelum memindahkan artefak transkrip
ke dalam arsip. Jika startup melaporkan migrasi SQLite sesi yang gagal setelah
artefak dipindahkan, jalankan pemulihan:

```bash
openclaw doctor --session-sqlite recover --github-issue
```

Pemulihan memilih manifes migrasi gagal terbaru, hanya memulihkan
artefak arsip milik manifes, memvalidasi target yang terdampak, menyegarkan
laporan `.failure.md` dan `.failure.json` yang disanitasi, serta menyiapkan isi isu GitHub
yang menghindari isi transkrip, lingkungan mentah, rahasia, dan
konfigurasi tanpa batas. Saat tidak ada manifes migrasi gagal tetapi basis data SQLite
agen yang dipilih rusak, bukan basis data, atau memiliki sidecar jurnal tanpa basis data
utama, pemulihan menyalin seluruh kumpulan file ke direktori inspeksi
sementara. SQLite dapat melakukan rollback pada jurnal aktif yang valid dalam salinan sekali pakai tersebut
sebelum `quick_check`, `integrity_check`, dan `foreign_key_check` berjalan, sementara
file forensik asli tetap tidak tersentuh. Pemeriksaan integritas yang gagal atau
sidecar yatim mempertahankan file DB, WAL, SHM, dan jurnal rollback dengan mengganti nama
seluruh kumpulan yang ditemukan menggunakan satu sufiks `.corrupt-<timestamp>`. Kegagalan penggantian nama
yang tertangkap mengembalikan file yang sudah dipindahkan sebelum melaporkan kegagalan, sehingga
kumpulan file yang dapat dipulihkan tidak terpecah secara diam-diam. Hentikan Gateway sebelum pemulihan;
menyalin atau mengganti nama kumpulan file SQLite yang sedang berubah secara aktif tidak aman dan berperilaku
berbeda di berbagai sistem operasi. Dengan `--github-issue --yes`, doctor menggunakan
GitHub CLI untuk membuat isu di `openclaw/openclaw`; tanpa konfirmasi,
doctor menulis laporan dukungan lokal dan mencetak URL isu yang telah diisi sebelumnya.

`restore` tetap menjadi operasi pembatalan tingkat rendah. Operasi ini menggunakan catatan
`sourcePath -> archivePath` manifes, memindahkan kembali artefak yang diarsipkan hanya saat
jalur asli tidak ada, melaporkan konflik saat kedua jalur ada, dan membiarkan
basis data SQLite tetap di tempatnya.

### Menurunkan Versi Setelah Migrasi SQLite Sesi

Sebelum memulai versi OpenClaw lama yang didukung file, pulihkan
artefak transkrip lama yang diarsipkan:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Versi lama membaca entri `sessions.json` dan jalur `sessionFile` yang dicatat
dalam entri tersebut. Setelah migrasi SQLite, impor yang berhasil memindahkan transkrip JSONL
aktif ke `session-sqlite-import-archive/`, sehingga runtime lama tidak dapat
melihat riwayat tersebut hingga pemulihan memindahkan artefak yang tercatat dalam manifes itu kembali ke
jalur asalnya.

Pemulihan tidak menghapus data SQLite. Sesi yang dibuat setelah peralihan ke SQLite
hanya ada di SQLite dan tidak akan muncul pada runtime lama. Jika kemudian Anda
memutakhirkan lagi, jalankan urutan validasi migrasi normal di atas agar OpenClaw dapat
membandingkan artefak lama yang dipulihkan dengan baris SQLite sebelum mengimpor.

## Catatan

- Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), pemeriksaan doctor hanya-baca tetap berfungsi, tetapi `doctor --fix`, `doctor --repair`, `doctor --yes`, dan `doctor --generate-gateway-token` dinonaktifkan karena `openclaw.json` tidak dapat diubah. Sebagai gantinya, edit sumber Nix untuk instalasi ini; untuk nix-openclaw, gunakan [Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen.
- Prompt interaktif (perbaikan keychain/OAuth, dan sebagainya) hanya dijalankan ketika stdin adalah TTY dan `--non-interactive` **tidak** ditetapkan. Proses tanpa antarmuka (cron, Telegram, tanpa terminal) melewati prompt.
- Proses `doctor` noninteraktif melewati pemuatan awal plugin agar pemeriksaan kesehatan tanpa antarmuka tetap cepat. Sesi interaktif tetap memuat permukaan plugin yang diperlukan oleh alur kesehatan/perbaikan lama.
- `--lint` lebih ketat daripada `--non-interactive`: selalu hanya-baca, tidak pernah menampilkan prompt, dan tidak pernah menerapkan migrasi aman. Gunakan `doctor --fix` atau `doctor --repair` jika Anda ingin doctor melakukan perubahan.
- Secara default, Doctor tidak mengeksekusi SecretRef `exec` saat memeriksa rahasia. Gunakan `--allow-exec` (dengan atau tanpa `--lint`) hanya jika Anda memang ingin doctor menjalankan resolver rahasia yang dikonfigurasi tersebut.
- Setiap penulisan konfigurasi (termasuk perbaikan `--fix`) merotasi cadangan ke `~/.openclaw/openclaw.json.bak` (dengan rangkaian bernomor `.bak.1`..`.bak.4`). `--fix` juga menghapus kunci konfigurasi tidak dikenal yang dilaporkan oleh validasi skema dan mencantumkan setiap penghapusan; tindakan ini dilewati saat pembaruan berlangsung agar status pemutakhiran yang baru ditulis sebagian tidak dihapus sebelum migrasinya selesai.
- Tetapkan `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor lain mengelola siklus hidup gateway. Doctor tetap melaporkan kesehatan gateway/layanan dan menerapkan perbaikan nonlayanan, tetapi melewati instalasi/mulai/mulai ulang/bootstrap layanan serta pembersihan layanan lama.
- Di Linux, doctor mengabaikan unit systemd tambahan mirip gateway yang tidak aktif dan tidak menulis ulang metadata perintah/titik masuk untuk layanan gateway systemd yang sedang berjalan selama perbaikan. Hentikan layanan terlebih dahulu, atau gunakan `openclaw gateway install --force` untuk mengganti peluncur aktif.
- `doctor --fix --non-interactive` melaporkan definisi layanan gateway yang hilang atau usang, tetapi tidak menginstal atau menulis ulangnya di luar mode perbaikan pembaruan. Jalankan `openclaw gateway install` untuk layanan yang hilang, atau `openclaw gateway install --force` untuk mengganti peluncur.
- Pemeriksaan integritas status mendeteksi berkas transkrip yatim di direktori sesi. Pengarsipannya sebagai `.deleted.<timestamp>` memerlukan konfirmasi interaktif; `--fix`, `--yes`, dan proses tanpa antarmuka membiarkannya tetap di tempat.
- Doctor memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk mencari bentuk tugas cron lama dan menulis ulang tugas tersebut sebelum mengimpor baris kanonis ke SQLite.
- Doctor melaporkan tugas cron dengan penggantian eksplisit `payload.model`, termasuk jumlah namespace penyedia dan ketidakcocokan terhadap `agents.defaults.model`, sehingga tugas terjadwal yang tidak mewarisi model default terlihat selama investigasi autentikasi atau penagihan.
- Doctor melaporkan tugas cron yang masih ditandai sedang berjalan (`state.runningAtMs`), yang dapat membuat `openclaw cron list` menampilkannya sebagai `running`. Pemeriksaan ini hanya-baca: jika saat ini tidak ada Gateway yang mengeksekusi tugas bertanda tersebut, layanan cron pada saat dimulai berikutnya akan mencatat proses yang terinterupsi dan menghapus penandanya.
- Di Linux, doctor memperingatkan ketika crontab pengguna masih menjalankan `~/.openclaw/bin/ensure-whatsapp.sh` lama yang tidak lagi dipelihara, yang dapat salah melaporkan `Gateway inactive` ketika cron tidak memiliki lingkungan bus pengguna systemd.
- Ketika WhatsApp diaktifkan, doctor memeriksa loop peristiwa Gateway yang mengalami degradasi dengan klien lokal `openclaw-tui` yang masih berjalan. `doctor --fix` hanya menghentikan klien TUI lokal yang telah diverifikasi agar balasan WhatsApp tidak mengantre di belakang loop penyegaran TUI yang usang.
- Doctor menulis ulang referensi model lama `codex/*` dan `openai-codex/*` menjadi referensi kanonis `openai/*` di seluruh model utama, fallback, daftar model yang diizinkan, model pembuatan gambar/video, penggantian heartbeat/subagen/compaction, hook, penggantian model saluran, payload cron, serta pin rute sesi/transkrip yang usang. `--fix` juga menggabungkan konfigurasi lama `models.providers.codex` dan `models.providers.openai-codex` jika aman, memigrasikan profil autentikasi lama `openai-codex:*` dan entri `auth.order.openai-codex` ke `openai:*`, memindahkan maksud Codex ke entri `agentRuntime.id: "codex"` yang cakupannya berdasarkan penyedia/model, menghapus pin runtime seluruh agen/sesi yang usang, dan mempertahankan referensi agen OpenAI yang diperbaiki pada perutean autentikasi Codex alih-alih autentikasi kunci API OpenAI langsung.
- Doctor melaporkan daftar `auth.order.<provider>` yang tidak kosong ketika semua profil yang dirujuk sudah tidak ada sementara kredensial tersimpan yang kompatibel tersedia. `doctor --fix` hanya menghapus penggantian usang tersebut, sehingga memulihkan pemilihan kredensial otomatis per agen; urutan kosong eksplisit, daftar yang sebagian masih aktif, dan urutan tanpa kredensial tersimpan yang kompatibel tetap tidak berubah. Jika penyimpanan autentikasi SQLite aktif tidak dapat dibaca atau rusak, doctor menjelaskan alasan perbaikan ini dilewati. Mulai ulang Gateway yang sedang berjalan sebelum memeriksa kembali status autentikasi jika mode pemuatan ulang konfigurasinya tidak menerapkan penulisan secara otomatis.
- Doctor membersihkan status penahapan dependensi plugin lama dari versi OpenClaw terdahulu dan menautkan ulang paket host `openclaw` untuk plugin npm terkelola yang mendeklarasikannya sebagai dependensi peer. Doctor juga memperbaiki plugin unduhan yang hilang dan dirujuk oleh konfigurasi (`plugins.entries`, saluran yang dikonfigurasi, pengaturan penyedia/pencarian yang dikonfigurasi, runtime agen yang dikonfigurasi). Selama pembaruan paket, doctor melewati perbaikan plugin pengelola paket hingga pertukaran paket selesai; jalankan kembali `openclaw doctor --fix` sesudahnya jika plugin yang dikonfigurasi masih perlu dipulihkan. Jika pengunduhan gagal, doctor melaporkan galat instalasi dan mempertahankan entri plugin yang dikonfigurasi untuk upaya perbaikan berikutnya.
- Doctor memperbaiki konfigurasi plugin usang dengan menghapus id plugin yang hilang dari `plugins.allow`/`plugins.deny`/`plugins.entries`, beserta konfigurasi saluran menggantung yang sesuai, target heartbeat, dan penggantian model saluran, ketika penemuan plugin dalam kondisi sehat.
- Doctor mengarantina konfigurasi plugin yang tidak valid dengan menonaktifkan entri `plugins.entries.<id>` yang terdampak dan menghapus payload `config` yang tidak valid. Saat dimulai, Gateway sudah melewati hanya plugin bermasalah tersebut sehingga plugin dan saluran lain tetap berjalan.
- Doctor menghapus `plugins.entries.codex.config.codexDynamicToolsProfile` yang telah dihentikan; app-server Codex selalu mempertahankan alat ruang kerja asli Codex sebagai alat asli.
- Doctor secara otomatis memigrasikan konfigurasi Talk datar lama (`talk.voiceId`, `talk.modelId`, dan lainnya) ke `talk.provider` + `talk.providers.<provider>`. Proses `doctor --fix` berikutnya tidak lagi melaporkan/menerapkan normalisasi Talk ketika satu-satunya perbedaan adalah urutan kunci objek.
- Doctor menyertakan pemeriksaan kesiapan pencarian memori dan dapat merekomendasikan `openclaw configure --section model` ketika kredensial embedding tidak ada.
- Doctor memperingatkan ketika tidak ada pemilik perintah yang dikonfigurasi. Pemilik perintah adalah akun operator manusia yang diizinkan menjalankan perintah khusus pemilik dan menyetujui tindakan berbahaya. Pemasangan DM hanya mengizinkan seseorang berbicara dengan bot; jika Anda menyetujui pengirim sebelum bootstrap pemilik pertama tersedia, tetapkan `commands.ownerAllowFrom` secara eksplisit.
- Doctor melaporkan catatan informasi ketika agen mode Codex dikonfigurasi dan aset CLI Codex pribadi tersedia di direktori utama Codex milik operator. Peluncuran app-server Codex lokal menggunakan direktori utama terisolasi per agen; instal plugin Codex terlebih dahulu jika diperlukan, lalu gunakan `openclaw migrate plan codex` untuk menginventarisasi aset yang akan dipromosikan secara sengaja.
- Doctor memperingatkan ketika skill yang diizinkan untuk agen default tidak tersedia di lingkungan runtime saat ini (biner, variabel lingkungan, konfigurasi, atau persyaratan OS tidak ada). `doctor --fix` dapat menonaktifkan skill yang tidak tersedia tersebut dengan `skills.entries.<skill>.enabled=false`; sebagai gantinya, instal/konfigurasikan persyaratan yang hilang jika Anda ingin mempertahankan skill tetap aktif.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, doctor melaporkan peringatan bersinyal tinggi beserta remediasi (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika berkas registri sandbox lama atau direktori shard tersedia (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/`, atau `~/.openclaw/sandbox/browsers/`), doctor melaporkannya; `--fix` memigrasikan entri valid ke SQLite dan mengarantina berkas lama yang tidak valid.
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola oleh SecretRef dan tidak tersedia pada jalur perintah saat ini, doctor melaporkan peringatan hanya-baca dan tidak menulis kredensial fallback teks biasa. Untuk SecretRef berbasis eksekusi, doctor melewati eksekusi kecuali `--allow-exec` tersedia.
- Jika pemeriksaan SecretRef saluran gagal dalam jalur perbaikan, doctor melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Setelah migrasi direktori status, doctor memperingatkan ketika akun default Telegram atau Discord yang diaktifkan bergantung pada fallback lingkungan dan `TELEGRAM_BOT_TOKEN` atau `DISCORD_BOT_TOKEN` tidak tersedia bagi proses doctor.
- Resolusi otomatis nama pengguna `allowFrom` Telegram (`doctor --fix`) memerlukan token Telegram yang dapat di-resolve pada jalur perintah saat ini. Jika pemeriksaan token tidak tersedia, doctor melaporkan peringatan dan melewati resolusi otomatis untuk proses tersebut.

## macOS: penggantian env `launchctl`

Jika sebelumnya Anda menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai tersebut menggantikan berkas konfigurasi Anda dan dapat menyebabkan galat "tidak diotorisasi" yang terus berulang.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor Gateway](/id/gateway/doctor)
