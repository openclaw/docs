---
read_when:
    - Anda mengalami masalah konektivitas/autentikasi dan menginginkan perbaikan terpandu
    - Anda telah memperbaruinya dan ingin melakukan pemeriksaan kewajaran
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: Dokter
x-i18n:
    generated_at: "2026-07-19T05:01:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2b0aa9b51d7bccd4357d3ec747be514a0245b44a90e6e6c7ea789ab68420465
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Pemeriksaan kesehatan dan perbaikan cepat untuk gateway, saluran, plugin, keterampilan, perutean model, status lokal, dan migrasi konfigurasi. Gunakan setiap kali sesuatu tidak berfungsi sebagaimana mestinya dan Anda ingin satu perintah menjelaskan masalahnya.

Saat status Gateway melaporkan pemilik SecretRef yang terdegradasi, doctor menampilkan peringatan **Degradasi runtime rahasia** dengan setiap pemilik yang dingin atau kedaluwarsa, jalur konfigurasi yang terdampak, alasan yang disamarkan, dan perintah coba lagi `openclaw secrets reload`.

Saat peristiwa masuk saluran dimasukkan ke dead-letter, doctor menyebutkan setiap akun saluran yang terdampak dan mengarahkan ke [`openclaw channels dead-letters list`](/id/cli/channels#inbound-dead-letters) untuk pemeriksaan dan pemulihan.

Terkait:

- Pemecahan masalah: [Pemecahan masalah](/id/gateway/troubleshooting)
- Audit keamanan: [Keamanan](/id/gateway/security)

## Postur

Doctor memiliki lima postur:

| Postur                    | Perintah                                  | Perilaku                                                                                     |
| ------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| Inspeksi                  | `openclaw doctor`                        | Pemeriksaan berorientasi manusia dan prompt terpandu.                                        |
| Perbaikan                 | `openclaw doctor --fix`                        | Menerapkan perbaikan yang didukung, menggunakan prompt kecuali perbaikan noninteraktif aman. |
| Lint                      | `openclaw doctor --lint`                        | Temuan terstruktur hanya-baca untuk CI, pemeriksaan awal, dan gerbang review.                 |
| Pemeliharaan SQLite bersama | `openclaw doctor --state-sqlite compact`                      | Secara eksplisit membuat checkpoint, memadatkan, dan memverifikasi DB status bersama kanonis. |
| Migrasi SQLite sesi       | `openclaw doctor --session-sqlite <mode>`                        | Memeriksa, mengimpor, memvalidasi, memadatkan, memulihkan, atau merestorasi status sesi.      |

Utamakan `--lint` saat otomatisasi memerlukan hasil yang stabil. Utamakan `--fix` saat operator manusia ingin doctor mengedit konfigurasi atau status.

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

`channels capabilities` melaporkan izin efektif bot untuk target saluran tertentu. `channels status --probe` mengaudit semua saluran yang dikonfigurasi dan target bergabung otomatis suara.

## Opsi

| Opsi                            | Efek                                                                                                                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`              | Menonaktifkan saran memori/pencarian ruang kerja.                                                                                                                                                |
| `--yes`              | Menerima nilai default tanpa prompt.                                                                                                                                                             |
| `--repair` / `--fix` | Menerapkan perbaikan nonlayanan yang direkomendasikan tanpa prompt (`--fix` adalah alias). Instalasi/penulisan ulang layanan Gateway tetap memerlukan konfirmasi interaktif atau perintah `gateway` eksplisit. |
| `--force`              | Menerapkan perbaikan agresif, termasuk menimpa konfigurasi layanan khusus.                                                                                                                       |
| `--non-interactive`              | Menjalankan tanpa prompt; hanya migrasi aman dan perbaikan nonlayanan.                                                                                                                           |
| `--generate-gateway-token`              | Menghasilkan dan mengonfigurasi token gateway.                                                                                                                                                   |
| `--allow-exec`              | Mengizinkan doctor mengeksekusi SecretRef `exec` yang dikonfigurasi saat memverifikasi rahasia.                                                                                       |
| `--deep`              | Memindai layanan sistem untuk instalasi gateway tambahan; melaporkan serah terima mulai ulang supervisor Gateway terbaru.                                                                         |
| `--lint`              | Menjalankan pemeriksaan kesehatan yang dimodernisasi dalam mode hanya-baca dan menghasilkan temuan diagnostik.                                                                                   |
| `--post-upgrade`              | Menjalankan probe kompatibilitas plugin pascapeningkatan; temuan dikirim ke stdout; kode keluar 1 jika terdapat temuan tingkat kesalahan.                                                        |
| `--state-sqlite <mode>`              | Menjalankan pemeliharaan SQLite status bersama secara eksplisit. Satu-satunya mode adalah `compact`.                                                                                    |
| `--session-sqlite <mode>`              | Menjalankan mode migrasi SQLite sesi yang ditargetkan: `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover`, atau `restore`. |
| `--session-sqlite-store <path>`              | Dengan `--session-sqlite`: memilih satu jalur penyimpanan `sessions.json` lama.                                                                                                               |
| `--session-sqlite-agent <id>`              | Dengan `--session-sqlite`: memilih satu agen yang dikonfigurasi.                                                                                                                                |
| `--session-sqlite-all-agents`              | Dengan `--session-sqlite`: memilih penyimpanan agen yang dikonfigurasi dan ditemukan.                                                                                                            |
| `--github-issue`              | Dengan `--session-sqlite recover`: menyiapkan laporan isu openclaw/openclaw yang telah disanitasi; doctor membuatnya dengan `gh` setelah `--yes` atau konfirmasi interaktif.       |
| `--json`              | Dengan `--lint`: temuan JSON. Dengan `--post-upgrade`: `{ probesRun, findings }`. Dengan `--state-sqlite` atau `--session-sqlite`: laporan pemeliharaan sebagai JSON.                      |
| `--severity-min <level>`              | Dengan `--lint`: menghapus temuan di bawah `info`, `warning`, atau `error`.                                                                            |
| `--all`              | Dengan `--lint`: menjalankan semua pemeriksaan terdaftar, termasuk pemeriksaan opsional yang dikecualikan dari kumpulan default.                                                       |
| `--skip <id>`              | Dengan `--lint`: melewati satu ID pemeriksaan. Dapat diulangi.                                                                                                                         |
| `--only <id>`              | Dengan `--lint`: hanya menjalankan ID pemeriksaan yang diberikan. Dapat diulangi.                                                                                                      |

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
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode belum ditetapkan; gateway tidak akan dapat dimulai.
    perbaikan: Jalankan `openclaw configure` dan tetapkan mode Gateway (local/remote), atau `openclaw config set gateway.mode local`.
```

Output JSON adalah antarmuka untuk skrip:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode belum ditetapkan; gateway tidak akan dapat dimulai.",
      "path": "gateway.mode",
      "fixHint": "Jalankan `openclaw configure` dan tetapkan mode Gateway (local/remote), atau `openclaw config set gateway.mode local`."
    }
  ]
}
```

Kode keluar:

| Kode | Arti                                                                    |
| ---- | ----------------------------------------------------------------------- |
| `0` | Tidak ada temuan pada atau di atas ambang tingkat keparahan yang dipilih. |
| `1` | Setidaknya satu temuan memenuhi ambang yang dipilih.                    |
| `2` | Kegagalan perintah/runtime sebelum temuan lint dapat dihasilkan.        |

`--severity-min` mengontrol temuan yang ditampilkan sekaligus ambang keluar: `openclaw doctor --lint --severity-min error` dapat tidak menampilkan apa pun dan keluar dengan `0` meskipun terdapat temuan `info`/`warning` dengan tingkat keparahan lebih rendah.

`--all` mengontrol pemeriksaan yang dipilih sebelum pemfilteran tingkat keparahan. Proses lint default mengecualikan pemeriksaan yang mendalam, historis, atau lebih mungkin mengungkap residu lama yang dapat diperbaiki; gunakan `--all` untuk inventaris lengkap. `--only <id>` adalah pemilih paling presisi dan dapat menjalankan pemeriksaan terdaftar apa pun berdasarkan ID.

`core/doctor/local-audio-acceleration` melaporkan perintah STT lokal yang dipilih secara otomatis, bukti backend mampu/diminta/diamati secara terpisah, dan urutan fallback tanpa memuat model ucapan. Ini menghasilkan temuan informasional, jadi sertakan `--severity-min info` untuk menampilkannya.

## Pemeriksaan kesehatan terstruktur

Pemeriksaan doctor modern menggunakan kontrak terpisah yang ringkas:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` mendukung `doctor --lint`. `repair()` bersifat opsional dan hanya berjalan di bawah `doctor --fix` / `doctor --repair`. Pemeriksaan yang belum dimigrasikan ke bentuk ini masih menggunakan alur kontribusi doctor lama.

Konteks perbaikan dapat membawa permintaan `dryRun`/`diff`; hasil perbaikan dapat mengembalikan `diffs` terstruktur (pengeditan konfigurasi/berkas) dan `effects` (efek samping layanan, proses, paket, status, atau lainnya), sehingga pemeriksaan yang dikonversi dapat berkembang menuju `doctor --fix --dry-run` tanpa memindahkan perencanaan mutasi ke `detect()`.

`repair()` melaporkan `status: "repaired" | "skipped" | "failed"` (status yang dihilangkan berarti `repaired`). Ketika perbaikan mengembalikan `skipped` atau `failed`, doctor melaporkan alasannya dan melewati validasi untuk pemeriksaan tersebut. Setelah perbaikan berhasil, doctor menjalankan kembali `detect()` yang dicakup ke temuan yang diperbaiki; jika temuan masih ada, doctor melaporkan peringatan perbaikan alih-alih menganggap perubahan telah selesai.

Temuan mencakup:

| Bidang            | Tujuan                                                         |
| ----------------- | -------------------------------------------------------------- |
| `checkId`         | ID stabil untuk filter skip/only dan daftar izin CI.           |
| `severity`        | `info`, `warning`, atau `error`.                         |
| `message`         | Pernyataan masalah yang dapat dibaca manusia.                   |
| `path`            | Konfigurasi, berkas, atau jalur logis jika tersedia.            |
| `line` / `column` | Lokasi sumber jika tersedia.                                   |
| `ocPath`          | Alamat `oc://` yang tepat ketika pemeriksaan dapat menunjuk ke salah satunya. |
| `fixHint`         | Tindakan operator yang disarankan atau ringkasan perbaikan.     |

Pemeriksaan doctor inti yang dimodernisasi tetap terkait dengan kontribusi doctor terurut yang memiliki perilaku `doctor` / `doctor --fix` untuk manusia. Registri kesehatan terstruktur bersama merupakan titik ekstensi: pemeriksaan bawaan dan berbasis Plugin berjalan setelah pemeriksaan doctor inti setelah paket pemiliknya mendaftarkannya dalam jalur perintah aktif. `openclaw/plugin-sdk/health` menyediakan kontrak yang sama bagi pembuat Plugin.

## Pemilihan pemeriksaan

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` dan `--skip` menerima ID pemeriksaan lengkap dan dapat diulang. Jika ID `--only` tidak terdaftar, tidak ada pemeriksaan yang berjalan untuk ID tersebut; gunakan `checksRun`/`checksSkipped` dalam keluaran untuk mengonfirmasi bahwa gerbang terfokus memilih pemeriksaan yang Anda harapkan.

## Mode pascapeningkatan

`openclaw doctor --post-upgrade` menjalankan pemeriksaan kompatibilitas Plugin untuk dirangkai setelah build atau peningkatan. Temuan dikirim ke stdout; kode keluar adalah 1 jika ada temuan yang memiliki `level: "error"`. Tambahkan `--json` untuk pembungkus yang dapat dibaca mesin (`{ probesRun, findings }`), yang sesuai untuk CI, skill komunitas `fork-upgrade`, dan alat smoke pascapeningkatan lainnya. Jika indeks Plugin yang terpasang hilang atau rusak, mode JSON tetap menghasilkan pembungkus dengan temuan kesalahan `plugin.index_unavailable`.

Startup image kontainer merupakan pengecualian dari alur biasa "jalankan doctor setelah
memperbarui". Ketika `openclaw gateway run` dimulai pada versi OpenClaw baru, proses tersebut
menjalankan perbaikan status dan Plugin yang aman sebelum melaporkan bahwa sistem siap. Jika perbaikan tidak dapat
diselesaikan dengan aman, startup keluar dan meminta Anda menjalankan image yang sama sekali dengan
`openclaw doctor --fix` terhadap status/konfigurasi terpasang yang sama sebelum memulai ulang
kontainer secara normal.

## Migrasi status lama

`openclaw doctor --fix` adalah satu-satunya pemilik migrasi persisten dari berkas ke SQLite. Proses ini memvalidasi dan mengklaim setiap sumber yang dikenali, menulis dan memverifikasi baris kanonis, mencatat tanda terima migrasi, lalu menghapus sumber yang dihentikan. Kode runtime tidak melakukan impor lambat atau pembacaan fallback.

Ini mencakup berkas OAuth MCP yang dihentikan di bawah `<state-dir>/mcp-oauth/*.json`. Hentikan Gateway sebelum perbaikan. Doctor mengimpor kredensial yang valid ke `<state-dir>/state/openclaw.sqlite`, mempertahankan sesi SQLite kanonis yang sudah ada ketika kedua penyimpanan tersedia, menghapus nilai OAuth persisten `state` yang usang, dan menggunakan tanda terimanya untuk mencegah berkas kedaluwarsa yang dibuat ulang menghidupkan kembali kredensial yang telah dikeluarkan. Berkas pendamping `.lock` yang dihentikan akan gagal secara tertutup: jika Doctor melaporkan pemilik kedaluwarsa, pastikan tidak ada proses OpenClaw lama yang berjalan, hapus berkas pendamping tersebut, lalu jalankan ulang Doctor.

## Compaction SQLite status bersama

Lihat [Skema basis data](/id/reference/database-schemas) untuk pembuatan versi skema, pemeriksaan integritas, dan pemulihan downgrade.

`openclaw doctor --state-sqlite compact` adalah pemeliharaan luring eksplisit untuk
basis data status bersama kanonis di
`<state-dir>/state/openclaw.sqlite`. Perintah ini tidak menerima jalur basis data
arbitrer, tidak pernah dipanggil oleh operasi Gateway normal, dan bukan bagian dari
`openclaw doctor --fix`. Perintah memperoleh kunci kepemilikan status yang sama seperti
startup Gateway dan menahannya selama validasi, checkpoint, `VACUUM`, dan
pemeriksaan integritas akhir. Perintah menolak berjalan saat Gateway atau perintah
pemeliharaan SQLite lain memiliki kunci tersebut. Kunci status tetap aktif ketika
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

1. Memerlukan berkas reguler pada jalur status bersama kanonis. Basis data yang
   hilang dilaporkan sebagai `skipped` dan keluar dengan sukses.
2. Memvalidasi versi skema yang didukung saat ini dan
   `schema_meta.role = "global"` sebelum membuat checkpoint atau mengubah berkas.
3. Memerlukan `wal_checkpoint(TRUNCATE)` yang tidak sibuk. Hentikan proses OpenClaw
   yang masih tersisa dan coba lagi jika checkpoint sibuk.
4. Mengatur `auto_vacuum` menjadi `INCREMENTAL`, menjalankan `VACUUM` penuh, dan membuat checkpoint
   lagi.
5. Menjalankan `quick_check`, `integrity_check`, dan `foreign_key_check`, lalu
   menerapkan kembali izin khusus pemilik pada basis data dan berkas pendamping SQLite.

Keluaran JSON melaporkan ukuran basis data dan WAL, halaman freelist, ukuran halaman, dan
nilai `auto_vacuum` sebelum dan sesudah Compaction, beserta byte yang diperoleh kembali serta
hasil `quick_check` dan `integrity_check`. `foreign_key_check` diberlakukan
secara fail-closed dan tidak memiliki bidang keberhasilan terpisah. SQLite melaporkan `auto_vacuum` sebagai
`0` untuk tidak ada, `1` untuk penuh, dan `2` untuk inkremental.

Compaction gagal tanpa mutasi ketika skema sudah lama, lebih baru daripada
build OpenClaw yang berjalan, atau merupakan milik basis data agen. Jalankan
`openclaw doctor --fix` terlebih dahulu untuk skema status bersama yang lebih lama. Pulihkan
cadangan yang kompatibel atau tingkatkan OpenClaw untuk skema yang lebih baru.

## Migrasi SQLite sesi

OpenClaw mengimpor baris sesi lama dan riwayat transkrip ke basis data SQLite
setiap agen secara otomatis selama startup Gateway dan selama
`openclaw doctor --fix`. `openclaw doctor --session-sqlite <mode>` adalah
alat inspeksi dan validasi yang ditargetkan untuk migrasi tersebut. Baris sesi
runtime saat ini berada di
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Berkas
`sessions.json` lama merupakan sumber migrasi. Berkas JSONL transkrip aktif
diimpor dan diarsipkan keluar dari direktori sesi aktif setelah
impor berhasil; berkas JSONL tingkat arsip tetap menjadi artefak dukungan, bukan
fallback runtime.

Mode:

| Mode       | Perilaku                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | Membaca jumlah data lama dan SQLite, beserta berkas JSONL yang tidak direferensikan, tanpa mengimpor.                      |
| `dry-run`  | Mengurai entri lama dan berkas JSONL transkrip, menghitung baris yang dapat diimpor, dan melaporkan masalah tanpa menulis baris SQLite. |
| `import`   | Mengimpor entri lama dan peristiwa transkrip ke SQLite untuk target yang dipilih.                                          |
| `validate` | Membandingkan sumber lama yang dipilih dengan baris SQLite dan jumlah peristiwa transkrip.                                 |
| `compact`  | Membuat checkpoint dan melakukan VACUUM pada basis data SQLite agen yang dipilih untuk memperoleh kembali halaman kosong setelah penghapusan besar atau pembersihan arsip. |
| `recover`  | Memulihkan proses migrasi gagal terbaru, memvalidasi targetnya, dan menyiapkan laporan isu GitHub yang telah disanitasi.   |
| `restore`  | Memulihkan artefak transkrip yang diarsipkan dari manifes migrasi yang tercatat tanpa menghapus data SQLite.               |

Pemilih:

- Default: penyimpanan agen default yang dikonfigurasi, ketika berkas penyimpanan lama tersebut ada.
- `--session-sqlite-agent <id>`: satu agen yang dikonfigurasi.
- `--session-sqlite-all-agents`: penyimpanan agen yang dikonfigurasi beserta penyimpanan agen yang ditemukan.
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
riwayat penting. `validate` keluar dengan nilai bukan nol ketika entri lama yang dipilih
tidak ada di SQLite, ID sesi berbeda, atau jumlah peristiwa transkrip berbeda.
Saat menggunakan `--session-sqlite-store <path>`, periksa bahwa laporan memuat
jumlah target yang diharapkan; jalur penyimpanan eksplisit yang tidak ada tidak memilih target apa pun.

Penghapusan SQLite terlebih dahulu memperoleh kembali halaman di dalam basis data; penghapusan tersebut tidak selalu
langsung memperkecil berkas basis data. Setelah menghapus atau mengarsipkan transkrip berukuran besar,
jalankan `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`
untuk membuat checkpoint berkas WAL, menjalankan `VACUUM`, dan melaporkan ukuran basis data serta WAL
sebelum/sesudah. Compaction memerlukan berkas reguler dengan skema agen saat ini,
metadata pemilik permanen milik agen yang dipilih, dan tidak ada handle terbuka dalam proses
doctor. Mode destruktif `import`, `compact`, `recover`, dan `restore`
menahan kunci kepemilikan status yang sama seperti startup Gateway selama seluruh operasinya;
`inspect`, `dry-run`, dan `validate` tetap hanya-baca dan tidak mengambilnya. Hentikan
Gateway terlebih dahulu. Mode destruktif gagal alih-alih berpacu dengan penulisan langsung atau
berpacu dengan perintah pemeliharaan lain. Target `--session-sqlite-store`
yang destruktif harus berada di dalam direktori status aktif; atur `OPENCLAW_STATE_DIR` ke
direktori status pemilik penyimpanan sebelum memelihara instalasi lain.
Target yang telah memiliki hard link ditolak karena jalur lain dapat berbagi
inode basis data yang sama di luar direktori status terkunci. Pemeriksaan kepemilikan
yang sama mencakup berkas pendamping WAL SQLite, memori bersama, dan jurnal rollback.

Setiap impor menulis manifes di bawah
`~/.openclaw/session-sqlite-migration-runs/` sebelum memindahkan artefak transkrip
ke arsip. Jika startup melaporkan migrasi SQLite sesi yang gagal setelah
artefak dipindahkan, jalankan pemulihan:

```bash
openclaw doctor --session-sqlite recover --github-issue
```

Pemulihan memilih manifes migrasi gagal terbaru, hanya memulihkan artefak yang
diarsipkan oleh manifes tersebut, memvalidasi target yang terpengaruh, memperbarui
laporan `.failure.md` dan `.failure.json` yang telah disanitasi, serta menyiapkan isi
isu GitHub yang tidak menyertakan isi transkrip, lingkungan mentah, rahasia, dan
konfigurasi tanpa batas. Jika tidak ada manifes migrasi gagal tetapi basis data
SQLite agen yang dipilih rusak, bukan merupakan basis data, atau memiliki sidecar
jurnal tanpa basis data utama, pemulihan menyalin seluruh kumpulan berkas ke
direktori pemeriksaan sementara. SQLite dapat melakukan rollback jurnal aktif yang
valid dalam salinan sekali pakai tersebut sebelum `quick_check`,
`integrity_check`, dan `foreign_key_check` dijalankan, sementara berkas forensik
asli tetap tidak tersentuh. Pemeriksaan integritas yang gagal atau sidecar yatim
mempertahankan berkas DB, WAL, SHM, dan jurnal rollback dengan mengganti nama
seluruh kumpulan yang ditemukan menggunakan satu akhiran `.corrupt-<timestamp>`.
Kegagalan penggantian nama yang tertangkap mengembalikan berkas yang sudah
dipindahkan sebelum melaporkan kegagalan, sehingga kumpulan berkas yang dapat
dipulihkan tidak terpisah secara diam-diam. Hentikan Gateway sebelum pemulihan;
menyalin atau mengganti nama kumpulan berkas SQLite yang sedang aktif berubah
tidak aman dan berperilaku berbeda di berbagai sistem operasi. Dengan
`--github-issue --yes`, doctor menggunakan GitHub CLI untuk membuat isu di
`openclaw/openclaw`; tanpa konfirmasi, doctor menulis laporan dukungan lokal dan
mencetak URL isu yang telah diisi sebelumnya.

`restore` tetap menjadi operasi pembatalan tingkat rendah. Operasi ini
menggunakan catatan `sourcePath -> archivePath` manifes, memindahkan kembali artefak yang
diarsipkan hanya ketika jalur asli tidak ada, melaporkan konflik ketika kedua
jalur ada, dan membiarkan basis data SQLite tetap di tempatnya.

### Menurunkan Versi Setelah Migrasi SQLite Sesi

Sebelum menjalankan OpenClaw versi lama yang berbasis berkas, pulihkan artefak
transkrip lama yang diarsipkan:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Versi lama membaca entri `sessions.json` dan jalur `sessionFile` yang tercatat
dalam entri tersebut. Setelah migrasi SQLite, impor yang berhasil memindahkan
transkrip JSONL aktif ke `session-sqlite-import-archive/`, sehingga runtime lama tidak dapat
melihat riwayat tersebut sampai pemulihan memindahkan kembali artefak yang
tercatat dalam manifes ke jalur aslinya.

Pemulihan tidak menghapus data SQLite. Sesi yang dibuat setelah peralihan ke
SQLite hanya ada di SQLite dan tidak akan muncul di runtime lama. Jika kemudian
melakukan peningkatan versi lagi, jalankan urutan validasi migrasi normal di atas
agar OpenClaw dapat membandingkan artefak lama yang dipulihkan dengan baris SQLite
sebelum mengimpor.

## Catatan

- Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), pemeriksaan doctor hanya-baca tetap berfungsi, tetapi `doctor --fix`, `doctor --repair`, `doctor --yes`, dan `doctor --generate-gateway-token` dinonaktifkan karena `openclaw.json` tidak dapat diubah. Sebagai gantinya, edit sumber Nix untuk instalasi ini; untuk nix-openclaw, gunakan [Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen.
- Prompt interaktif (perbaikan keychain/OAuth, dan sebagainya) hanya dijalankan ketika stdin adalah TTY dan `--non-interactive` **tidak** ditetapkan. Proses tanpa antarmuka (cron, Telegram, tanpa terminal) melewati prompt.
- Proses `doctor` noninteraktif melewati pemuatan awal plugin agar pemeriksaan kesehatan tanpa antarmuka tetap cepat. Sesi interaktif tetap memuat permukaan plugin yang diperlukan oleh alur kesehatan/perbaikan lama.
- `--lint` lebih ketat daripada `--non-interactive`: selalu hanya-baca, tidak pernah menampilkan prompt, dan tidak pernah menerapkan migrasi aman. Gunakan `doctor --fix` atau `doctor --repair` jika Anda ingin doctor melakukan perubahan.
- Secara default, doctor tidak mengeksekusi SecretRef `exec` saat memeriksa rahasia. Gunakan `--allow-exec` (dengan atau tanpa `--lint`) hanya jika Anda memang ingin doctor menjalankan resolver rahasia yang dikonfigurasi tersebut.
- Setiap penulisan konfigurasi (termasuk perbaikan `--fix`) merotasi cadangan ke `~/.openclaw/openclaw.json.bak` (dengan rangkaian bernomor `.bak.1`..`.bak.4`). `--fix` juga menghapus kunci konfigurasi tidak dikenal yang dilaporkan oleh validasi skema dan mencantumkan setiap penghapusan; tindakan ini dilewati saat pembaruan sedang berlangsung agar status peningkatan yang baru ditulis sebagian tidak dihapus sebelum migrasinya selesai.
- Jika `openclaw.json` tidak dapat diurai dan tidak ada konfigurasi terakhir yang diketahui baik yang dapat dipulihkan, `doctor --fix` mempertahankan versi asli sebagai `openclaw.json.clobbered.<timestamp>`, membiarkan berkas saat ini tidak berubah, dan keluar dengan kesalahan alih-alih menulis pengganti parsial.
- Tetapkan `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor lain mengelola siklus hidup Gateway. Doctor tetap melaporkan kesehatan Gateway/layanan dan menerapkan perbaikan nonlayanan, tetapi melewati pemasangan/mulai/mulai ulang/bootstrap layanan serta pembersihan layanan lama.
- Doctor melaporkan batas heap yang diterapkan pada Gateway terkelola dan derivasi adaptif yang digunakan untuk batas memori host atau kontainer saat ini. Gunakan `openclaw gateway status` untuk laporan yang sama di luar proses perbaikan.
- Di Linux, doctor mengabaikan unit systemd tambahan mirip gateway yang tidak aktif dan tidak menulis ulang metadata perintah/titik masuk untuk layanan gateway systemd yang sedang berjalan selama perbaikan. Hentikan layanan terlebih dahulu, atau gunakan `openclaw gateway install --force` untuk mengganti peluncur aktif.
- `doctor --fix --non-interactive` melaporkan definisi layanan gateway yang hilang atau usang, tetapi tidak memasang atau menulis ulang definisi tersebut di luar mode perbaikan pembaruan. Jalankan `openclaw gateway install` untuk layanan yang hilang, atau `openclaw gateway install --force` untuk mengganti peluncur.
- Pemeriksaan integritas status mendeteksi berkas transkrip yatim di direktori sesi. Pengarsipan berkas tersebut sebagai `.deleted.<timestamp>` memerlukan konfirmasi interaktif; `--fix`, `--yes`, dan proses tanpa antarmuka membiarkannya tetap di tempat.
- Doctor memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk mencari bentuk tugas cron lama dan menulis ulang bentuk tersebut sebelum mengimpor baris kanonis ke SQLite.
- Doctor melaporkan tugas cron dengan penggantian `payload.model` eksplisit, termasuk jumlah namespace penyedia dan ketidakcocokan dengan `agents.defaults.model`, sehingga tugas terjadwal yang tidak mewarisi model default dapat terlihat selama penyelidikan autentikasi atau penagihan.
- Doctor melaporkan tugas cron yang masih ditandai sedang berjalan (`state.runningAtMs`), yang dapat menyebabkan `openclaw cron list` menampilkannya sebagai `running`. Pemeriksaan ini hanya-baca: jika tidak ada Gateway yang sedang mengeksekusi tugas bertanda tersebut, layanan cron akan mencatat proses yang terinterupsi dan menghapus penanda saat layanan berikutnya dimulai.
- Di Linux, doctor memperingatkan ketika crontab pengguna masih menjalankan `~/.openclaw/bin/ensure-whatsapp.sh` lama yang tidak lagi dipelihara, yang dapat salah melaporkan `Gateway inactive` ketika cron tidak memiliki lingkungan bus pengguna systemd.
- Ketika WhatsApp diaktifkan, doctor memeriksa loop peristiwa Gateway yang mengalami penurunan kinerja dengan klien `openclaw-tui` lokal yang masih berjalan. `doctor --fix` hanya menghentikan klien TUI lokal yang telah diverifikasi agar balasan WhatsApp tidak mengantre di belakang loop penyegaran TUI yang usang.
- Ketika variabel lingkungan proksi HTTP(S) tersedia tetapi `tools.web.fetch.useTrustedEnvProxy` dinonaktifkan, doctor menjelaskan bahwa `web_fetch` masih menggunakan perutean langsung, menjalankan pemeriksaan singkat konektivitas TLS langsung, dan menyebutkan pilihan ikut serta yang eksplisit. Doctor tidak pernah mengaktifkan kepercayaan proksi secara otomatis.
- Doctor menulis ulang referensi model `codex/*` dan `openai-codex/*` lama menjadi referensi `openai/*` kanonis pada model utama, fallback, daftar model yang diizinkan, model pembuatan gambar/video, penggantian heartbeat/subagen/compaction, hook, penggantian model kanal, payload cron, serta pin rute sesi/transkrip usang. `--fix` juga menggabungkan konfigurasi `models.providers.codex` dan `models.providers.openai-codex` lama jika aman, memigrasikan profil autentikasi `openai-codex:*` lama dan entri `auth.order.openai-codex` ke `openai:*`, memindahkan intensi Codex ke entri `agentRuntime.id: "codex"` yang tercakup pada penyedia/model, menghapus pin runtime seluruh agen/sesi yang usang, dan mempertahankan referensi agen OpenAI yang telah diperbaiki pada perutean autentikasi Codex alih-alih autentikasi kunci API OpenAI langsung.
- Doctor melaporkan daftar `auth.order.<provider>` yang tidak kosong jika semua profil yang dirujuk sudah tidak ada sementara kredensial tersimpan yang kompatibel tersedia. `doctor --fix` hanya menghapus penggantian usang tersebut, sehingga memulihkan pemilihan kredensial otomatis per agen; urutan kosong eksplisit, daftar yang sebagian masih aktif, dan urutan tanpa kredensial tersimpan yang kompatibel tetap tidak berubah. Jika penyimpanan autentikasi SQLite aktif tidak dapat dibaca atau rusak, doctor menjelaskan alasan perbaikan ini dilewati. Mulai ulang Gateway yang sedang berjalan sebelum memeriksa kembali status autentikasi jika mode pemuatan ulang konfigurasinya tidak menerapkan penulisan secara otomatis.
- Doctor membersihkan status staging dependensi plugin lama dari versi OpenClaw terdahulu dan menautkan ulang paket `openclaw` host untuk plugin npm terkelola yang mendeklarasikannya sebagai dependensi peer. Doctor juga memperbaiki plugin yang dapat diunduh tetapi hilang dan dirujuk oleh konfigurasi (`plugins.entries`, kanal yang dikonfigurasi, pengaturan penyedia/pencarian yang dikonfigurasi, runtime agen yang dikonfigurasi). Selama pembaruan paket, doctor melewati perbaikan plugin oleh pengelola paket hingga pertukaran paket selesai; jalankan kembali `openclaw doctor --fix` sesudahnya jika plugin yang dikonfigurasi masih perlu dipulihkan. Jika pengunduhan gagal, doctor melaporkan kesalahan pemasangan dan mempertahankan entri plugin yang dikonfigurasi untuk upaya perbaikan berikutnya.
- Doctor memperbaiki konfigurasi plugin usang dengan menghapus id plugin yang hilang dari `plugins.allow`/`plugins.deny`/`plugins.entries`, beserta konfigurasi kanal tanpa rujukan yang cocok, target heartbeat, dan penggantian model kanal, ketika penemuan plugin berfungsi dengan baik.
- Doctor mengarantina konfigurasi plugin yang tidak valid dengan menonaktifkan entri `plugins.entries.<id>` yang terdampak dan menghapus payload `config` yang tidak valid. Saat dimulai, Gateway sudah melewati hanya plugin bermasalah tersebut sehingga plugin dan kanal lainnya tetap berjalan.
- Doctor menghapus `plugins.entries.codex.config.codexDynamicToolsProfile` yang telah dihentikan; server aplikasi Codex selalu mempertahankan alat ruang kerja bawaan Codex sebagai alat native.
- Doctor secara otomatis memigrasikan konfigurasi Talk datar lama (`talk.voiceId`, `talk.modelId`, dan lainnya) ke `talk.provider` + `talk.providers.<provider>`. Proses `doctor --fix` berulang tidak lagi melaporkan/menerapkan normalisasi Talk ketika satu-satunya perbedaan adalah urutan kunci objek.
- Doctor menyertakan pemeriksaan kesiapan pencarian memori dan dapat merekomendasikan `openclaw configure --section model` ketika kredensial embedding tidak tersedia.
- Doctor memperingatkan ketika tidak ada pemilik perintah yang dikonfigurasi. Pemilik perintah adalah akun operator manusia yang diizinkan menjalankan perintah khusus pemilik dan menyetujui tindakan berbahaya. Pemasangan DM hanya memungkinkan seseorang berbicara dengan bot; jika Anda menyetujui pengirim sebelum bootstrap pemilik pertama tersedia, tetapkan `commands.ownerAllowFrom` secara eksplisit.
- Doctor melaporkan catatan informasi ketika agen mode Codex dikonfigurasi dan aset CLI Codex pribadi tersedia di direktori utama Codex milik operator. Peluncuran server aplikasi Codex lokal menggunakan direktori utama terisolasi per agen; pasang plugin Codex terlebih dahulu jika diperlukan, lalu gunakan `openclaw migrate plan codex` untuk menginventarisasi aset yang harus dipromosikan secara sengaja.
- Doctor memperingatkan ketika skill yang diizinkan untuk agen default tidak tersedia di lingkungan runtime saat ini (bin, variabel lingkungan, konfigurasi, atau persyaratan OS tidak tersedia). `doctor --fix` dapat menonaktifkan skill yang tidak tersedia tersebut dengan `skills.entries.<skill>.enabled=false`; sebagai gantinya, pasang/konfigurasikan persyaratan yang belum tersedia jika Anda ingin mempertahankan skill tetap aktif.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, doctor melaporkan peringatan berindikasi kuat beserta remediasi (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika berkas registri sandbox lama atau direktori shard tersedia (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/`, atau `~/.openclaw/sandbox/browsers/`), doctor melaporkannya; `--fix` memigrasikan entri valid ke SQLite dan mengarantina berkas lama yang tidak valid.
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola oleh SecretRef dan tidak tersedia di jalur perintah saat ini, doctor melaporkan peringatan hanya-baca dan tidak menulis kredensial fallback dalam teks biasa. Untuk SecretRef berbasis exec, doctor melewati eksekusi kecuali `--allow-exec` tersedia.
- Jika pemeriksaan SecretRef kanal gagal dalam jalur perbaikan, doctor melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Setelah migrasi direktori status, doctor memperingatkan ketika akun Telegram atau Discord default yang diaktifkan bergantung pada fallback lingkungan dan `TELEGRAM_BOT_TOKEN` atau `DISCORD_BOT_TOKEN` tidak tersedia bagi proses doctor.
- Resolusi otomatis nama pengguna `allowFrom` Telegram (`doctor --fix`) memerlukan token Telegram yang dapat di-resolve pada jalur perintah saat ini. Jika pemeriksaan token tidak tersedia, doctor melaporkan peringatan dan melewati resolusi otomatis untuk proses tersebut.

## macOS: penggantian env `launchctl`

Jika sebelumnya Anda menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai tersebut menggantikan berkas konfigurasi Anda dan dapat menyebabkan kesalahan "unauthorized" yang terus berulang.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor Gateway](/id/gateway/doctor)
