---
read_when:
    - Anda mengalami masalah konektivitas/autentikasi dan menginginkan perbaikan terpandu
    - Anda telah memperbarui dan ingin pemeriksaan kewajaran
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: Dokter
x-i18n:
    generated_at: "2026-06-27T17:18:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Pemeriksaan kesehatan + perbaikan cepat untuk Gateway dan channel.

Terkait:

- Pemecahan masalah: [Pemecahan masalah](/id/gateway/troubleshooting)
- Audit keamanan: [Keamanan](/id/gateway/security)

## Mengapa Menggunakannya

`openclaw doctor` adalah permukaan kesehatan OpenClaw. Gunakan saat Gateway,
channel, plugin, Skills, perutean model, state lokal, atau migrasi konfigurasi
tidak berperilaku seperti yang diharapkan dan Anda menginginkan satu perintah
yang dapat menjelaskan apa yang salah.

Doctor memiliki tiga postur:

| Postur | Perintah                 | Perilaku                                                                        |
| ------ | ------------------------ | ------------------------------------------------------------------------------- |
| Inspeksi | `openclaw doctor`        | Pemeriksaan berorientasi manusia dan prompt terpandu.                           |
| Perbaikan | `openclaw doctor --fix`  | Menerapkan perbaikan yang didukung, menggunakan prompt kecuali perbaikan non-interaktif aman. |
| Lint   | `openclaw doctor --lint` | Temuan terstruktur baca-saja untuk CI, preflight, dan gerbang review.            |

Pilih `--lint` saat otomatisasi memerlukan hasil yang stabil. Pilih `--fix` saat
operator manusia secara sengaja ingin doctor mengedit konfigurasi atau state.

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
```

Untuk izin khusus channel, gunakan probe channel alih-alih `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Probe kapabilitas Discord yang ditargetkan melaporkan izin channel efektif milik bot; probe status mengaudit channel Discord yang dikonfigurasi dan target auto-join suara.

## Opsi

- `--no-workspace-suggestions`: menonaktifkan saran memori/pencarian workspace
- `--yes`: menerima default tanpa prompt
- `--repair`: menerapkan perbaikan non-layanan yang direkomendasikan tanpa prompt; instalasi dan penulisan ulang layanan Gateway tetap memerlukan konfirmasi interaktif atau perintah Gateway eksplisit
- `--fix`: alias untuk `--repair`
- `--force`: menerapkan perbaikan agresif, termasuk menimpa konfigurasi layanan kustom saat diperlukan
- `--non-interactive`: berjalan tanpa prompt; hanya migrasi aman dan perbaikan non-layanan
- `--generate-gateway-token`: menghasilkan dan mengonfigurasi token Gateway
- `--allow-exec`: mengizinkan doctor mengeksekusi exec SecretRefs yang dikonfigurasi saat memverifikasi secret
- `--deep`: memindai layanan sistem untuk instalasi Gateway tambahan dan melaporkan handoff restart supervisor Gateway terbaru
- `--lint`: menjalankan pemeriksaan kesehatan yang dimodernisasi dalam mode baca-saja dan menghasilkan temuan diagnostik
- `--post-upgrade`: menjalankan probe kompatibilitas plugin pasca-upgrade; menghasilkan temuan ke stdout; keluar dengan kode 1 jika ada temuan tingkat error
- `--json`: dengan `--lint`, menghasilkan temuan JSON alih-alih output manusia; dengan `--post-upgrade`, menghasilkan envelope JSON yang dapat dibaca mesin (`{ probesRun, findings }`)
- `--severity-min <level>`: dengan `--lint`, menghapus temuan di bawah `info`, `warning`, atau `error`
- `--all`: dengan `--lint`, menjalankan semua pemeriksaan terdaftar, termasuk pemeriksaan opt-in yang dikecualikan dari set otomatisasi default
- `--skip <id>`: dengan `--lint`, melewati id pemeriksaan; ulangi untuk melewati lebih dari satu
- `--only <id>`: dengan `--lint`, hanya menjalankan satu id pemeriksaan; ulangi untuk menjalankan set kecil yang dipilih

## Mode lint

`openclaw doctor --lint` adalah postur otomatisasi baca-saja untuk pemeriksaan doctor.
Ini menggunakan jalur pemeriksaan kesehatan terstruktur, tidak memunculkan prompt, dan tidak memperbaiki
atau menulis ulang konfigurasi/state. Gunakan dalam CI, skrip preflight, dan alur kerja review
saat Anda menginginkan temuan yang dapat dibaca mesin alih-alih prompt perbaikan terpandu.
Opsi output lint seperti `--json`, `--severity-min`, `--all`, `--only`, dan `--skip`
hanya diterima dengan `--lint`.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Output manusia ringkas:

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

Output JSON adalah permukaan scripting untuk lint run:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

Perilaku keluar:

- `0`: tidak ada temuan pada atau di atas ambang tingkat keparahan yang dipilih
- `1`: setidaknya satu temuan memenuhi ambang yang dipilih
- `2`: kegagalan perintah/runtime sebelum temuan lint dapat dihasilkan

`--severity-min` mengontrol temuan yang terlihat dan ambang keluar. Misalnya,
`openclaw doctor --lint --severity-min error` dapat mencetak tanpa temuan dan
keluar `0` meskipun ada temuan `info` atau `warning` dengan tingkat keparahan lebih rendah.

`--all` mengontrol pemeriksaan mana yang dipilih sebelum pemfilteran tingkat keparahan. Lint run
default adalah gerbang otomatisasi stabil dan mengecualikan pemeriksaan yang
secara sengaja bersifat opt-in karena pemeriksaan tersebut mendalam, historis, atau lebih mungkin
memunculkan residu legacy yang dapat diperbaiki. Gunakan `--all` saat Anda menginginkan inventaris lint
lengkap tanpa mencantumkan setiap id pemeriksaan. `--only <id>` tetap menjadi pemilih paling presisi
dan dapat menjalankan pemeriksaan terdaftar apa pun berdasarkan id.

## Pemeriksaan Kesehatan Terstruktur

Pemeriksaan doctor modern menggunakan kontrak terstruktur kecil:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` menggerakkan `doctor --lint`. `repair()` bersifat opsional dan hanya dipertimbangkan
oleh `doctor --fix` / `doctor --repair`. Pemeriksaan yang belum bermigrasi ke
bentuk ini terus menggunakan alur kontribusi doctor legacy.

Pemisahan ini disengaja: `detect()` memiliki diagnosis, sedangkan `repair()` memiliki
pelaporan apa yang diubah atau akan diubah. Konteks perbaikan dapat membawa permintaan
`dryRun`/`diff`, dan hasil perbaikan dapat mengembalikan `diffs` terstruktur untuk
edit konfigurasi/file plus `effects` untuk layanan, proses, paket, state, atau efek samping
lainnya. Ini memungkinkan pemeriksaan yang sudah dikonversi berkembang menuju `doctor --fix --dry-run`
dan pelaporan diff tanpa memindahkan perencanaan mutasi ke `detect()`.

`repair()` melaporkan apakah ia mencoba perbaikan yang diminta dengan `status:
"repaired" | "skipped" | "failed"`. Status yang dihilangkan berarti `repaired`, jadi pemeriksaan
perbaikan sederhana hanya perlu mengembalikan perubahan. Saat perbaikan mengembalikan `skipped` atau
`failed`, doctor melaporkan alasannya dan tidak menjalankan validasi untuk pemeriksaan tersebut.

Setelah perbaikan terstruktur berhasil, doctor menjalankan ulang `detect()` dengan
temuan yang diperbaiki sebagai scope. Pemeriksaan dapat menggunakan temuan, path, atau nilai `ocPath`
yang dipilih untuk validasi terfokus. Jika temuan masih ada, doctor melaporkan
peringatan perbaikan alih-alih memperlakukan perubahan sebagai selesai secara diam-diam.

Sebuah temuan mencakup:

| Bidang            | Tujuan                                                  |
| ----------------- | ------------------------------------------------------- |
| `checkId`         | Id stabil untuk filter skip/only dan allowlist CI.      |
| `severity`        | `info`, `warning`, atau `error`.                        |
| `message`         | Pernyataan masalah yang dapat dibaca manusia.           |
| `path`            | Konfigurasi, file, atau path logis saat tersedia.       |
| `line` / `column` | Lokasi sumber saat tersedia.                            |
| `ocPath`          | Alamat `oc://` presisi saat pemeriksaan dapat menunjuk ke salah satunya. |
| `fixHint`         | Tindakan operator yang disarankan atau ringkasan perbaikan. |

Pemeriksaan doctor inti yang dimodernisasi tetap melekat pada kontribusi doctor berurutan
yang memiliki perilaku manusia `doctor` / `doctor --fix` miliknya. Registry kesehatan terstruktur
bersama adalah titik ekstensi: pemeriksaan bundled dan berbasis plugin berjalan
setelah pemeriksaan doctor inti setelah paket pemiliknya mendaftarkannya di jalur
perintah aktif. Subpath `openclaw/plugin-sdk/health` mengekspos kontrak yang sama
untuk konsumen ekstensi tersebut.

## Pemilihan Pemeriksaan

Gunakan `--only` dan `--skip` saat alur kerja menginginkan gerbang yang terfokus:

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` dan `--skip` menerima id pemeriksaan lengkap dan dapat diulang. Jika sebuah id `--only`
tidak terdaftar, tidak ada pemeriksaan yang berjalan untuk id tersebut; gunakan bidang `checksRun`
dan `checksSkipped` milik perintah untuk memverifikasi bahwa gerbang terfokus memilih pemeriksaan yang
Anda harapkan.

## Mode pasca-upgrade

`openclaw doctor --post-upgrade` menjalankan probe kompatibilitas plugin yang dimaksudkan untuk
dirangkai setelah build atau upgrade. Temuan dihasilkan ke stdout; perintah
keluar dengan kode 1 jika ada temuan yang memiliki `level: "error"`. Tambahkan `--json` untuk menerima
envelope yang dapat dibaca mesin (`{ probesRun, findings }`) yang cocok untuk CI, Skills
komunitas `fork-upgrade`, dan tooling smoke pasca-upgrade lainnya. Jika indeks plugin
terpasang hilang atau rusak, mode JSON tetap menghasilkan envelope tersebut
dengan temuan error `plugin.index_unavailable`.

Catatan:

- Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), pemeriksaan doctor read-only tetap berfungsi, tetapi `doctor --fix`, `doctor --repair`, `doctor --yes`, dan `doctor --generate-gateway-token` dinonaktifkan karena `openclaw.json` tidak dapat diubah. Edit sumber Nix untuk instalasi ini sebagai gantinya; untuk nix-openclaw, gunakan [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen.
- Prompt interaktif (seperti perbaikan keychain/OAuth) hanya berjalan ketika stdin adalah TTY dan `--non-interactive` **tidak** disetel. Eksekusi tanpa kepala (cron, Telegram, tanpa terminal) akan melewati prompt.
- Performa: eksekusi `doctor` noninteraktif melewati pemuatan plugin secara eager agar pemeriksaan kesehatan tanpa kepala tetap cepat. Sesi doctor interaktif tetap memuat permukaan plugin yang diperlukan oleh alur kesehatan dan perbaikan lama.
- `--lint` lebih ketat daripada `--non-interactive`: selalu read-only, tidak pernah memunculkan prompt, dan tidak pernah menerapkan migrasi aman. Jalankan `doctor --fix` atau `doctor --repair` ketika Anda ingin doctor membuat perubahan.
- Secara default, doctor tidak mengeksekusi SecretRefs `exec` saat memeriksa rahasia. Gunakan `openclaw doctor --allow-exec` atau `openclaw doctor --lint --allow-exec` hanya ketika Anda memang ingin doctor menjalankan resolver rahasia yang dikonfigurasi tersebut.
- `--fix` (alias untuk `--repair`) menulis cadangan ke `~/.openclaw/openclaw.json.bak` dan membuang kunci konfigurasi yang tidak dikenal, dengan mencantumkan setiap penghapusan.
- Pemeriksaan kesehatan yang dimodernisasi dapat mengekspos jalur `repair()` untuk `doctor --fix`; pemeriksaan yang tidak mengeksposnya tetap melalui alur perbaikan doctor yang ada.
- `doctor --fix --non-interactive` melaporkan definisi layanan Gateway yang hilang atau usang, tetapi tidak memasang atau menulis ulang definisi tersebut di luar mode perbaikan pembaruan. Jalankan `openclaw gateway install` untuk layanan yang hilang, atau `openclaw gateway install --force` ketika Anda memang ingin mengganti launcher.
- Pemeriksaan integritas state kini mendeteksi file transkrip yatim di direktori sesi. Mengarsipkannya sebagai `.deleted.<timestamp>` memerlukan konfirmasi interaktif; `--fix`, `--yes`, dan eksekusi tanpa kepala membiarkannya tetap di tempat.
- Doctor juga memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk bentuk job cron lama dan menulis ulangnya sebelum mengimpor baris kanonis ke SQLite.
- Doctor melaporkan job cron dengan override `payload.model` eksplisit, termasuk hitungan namespace provider dan ketidakcocokan terhadap `agents.defaults.model`, sehingga job terjadwal yang tidak mewarisi model default terlihat saat investigasi autentikasi atau penagihan.
- Di Linux, doctor memperingatkan ketika crontab pengguna masih menjalankan `~/.openclaw/bin/ensure-whatsapp.sh` lama; skrip itu tidak lagi dipelihara dan dapat mencatat outage Gateway WhatsApp palsu ketika cron tidak memiliki lingkungan user-bus systemd.
- Ketika WhatsApp diaktifkan, doctor memeriksa loop peristiwa Gateway yang terdegradasi dengan klien `openclaw-tui` lokal yang masih berjalan. `doctor --fix` hanya menghentikan klien TUI lokal yang terverifikasi sehingga balasan WhatsApp tidak mengantre di belakang loop refresh TUI yang usang.
- Doctor menulis ulang ref model `openai-codex/*` lama menjadi ref `openai/*` kanonis di seluruh model utama, fallback, model pembuatan gambar/video, override heartbeat/subagen/compaction, hook, override model channel, dan pin rute sesi usang. `--fix` juga memigrasikan profil auth `openai-codex:*` lama dan entri `auth.order.openai-codex` ke `openai:*`, memindahkan intent Codex ke entri `agentRuntime.id: "codex"` yang dicakup provider/model, menghapus pin runtime seluruh agen/sesi yang usang, dan mempertahankan ref agen OpenAI yang diperbaiki pada routing auth Codex alih-alih auth kunci API OpenAI langsung.
- Doctor membersihkan state staging dependensi plugin lama yang dibuat oleh versi OpenClaw lama dan menautkan ulang paket host `openclaw` untuk plugin npm terkelola yang mendeklarasikannya sebagai peer dependency. Doctor juga memperbaiki plugin unduhan yang hilang yang dirujuk oleh konfigurasi, seperti `plugins.entries`, channel yang dikonfigurasi, pengaturan provider/search yang dikonfigurasi, atau runtime agen yang dikonfigurasi. Selama pembaruan paket, doctor melewati perbaikan plugin package-manager hingga penggantian paket selesai; jalankan ulang `openclaw doctor --fix` setelahnya jika plugin yang dikonfigurasi masih perlu dipulihkan. Jika unduhan gagal, doctor melaporkan galat instalasi dan mempertahankan entri plugin yang dikonfigurasi untuk percobaan perbaikan berikutnya.
- Doctor memperbaiki konfigurasi plugin usang dengan menghapus id plugin yang hilang dari `plugins.allow`/`plugins.deny`/`plugins.entries`, plus konfigurasi channel menggantung yang cocok, target heartbeat, dan override model channel ketika discovery plugin sehat.
- Doctor mengarantina konfigurasi plugin tidak valid dengan menonaktifkan entri `plugins.entries.<id>` yang terdampak dan menghapus payload `config` yang tidak valid. Startup Gateway sudah hanya melewati plugin bermasalah tersebut sehingga plugin dan channel lain dapat tetap berjalan.
- Setel `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor lain memiliki lifecycle gateway. Doctor tetap melaporkan kesehatan gateway/layanan dan menerapkan perbaikan non-layanan, tetapi melewati pemasangan/mulai/mulai ulang/bootstrap layanan dan pembersihan layanan lama.
- Di Linux, doctor mengabaikan unit systemd ekstra mirip gateway yang tidak aktif dan tidak menulis ulang metadata perintah/entrypoint untuk layanan gateway systemd yang sedang berjalan selama perbaikan. Hentikan layanan terlebih dahulu atau gunakan `openclaw gateway install --force` ketika Anda memang ingin mengganti launcher aktif.
- Doctor memigrasikan otomatis konfigurasi Talk datar lama (`talk.voiceId`, `talk.modelId`, dan sejenisnya) menjadi `talk.provider` + `talk.providers.<provider>`.
- Eksekusi `doctor --fix` berulang tidak lagi melaporkan/menerapkan normalisasi Talk ketika satu-satunya perbedaan adalah urutan kunci objek.
- Doctor menyertakan pemeriksaan kesiapan pencarian memori dan dapat merekomendasikan `openclaw configure --section model` ketika kredensial embedding hilang.
- Doctor memperingatkan ketika tidak ada pemilik perintah yang dikonfigurasi. Pemilik perintah adalah akun operator manusia yang diizinkan menjalankan perintah khusus pemilik dan menyetujui tindakan berbahaya. Pemasangan DM hanya mengizinkan seseorang berbicara dengan bot; jika Anda menyetujui pengirim sebelum bootstrap pemilik pertama ada, setel `commands.ownerAllowFrom` secara eksplisit.
- Doctor melaporkan catatan info ketika agen mode Codex dikonfigurasi dan aset CLI Codex pribadi ada di home Codex operator. Peluncuran app-server Codex lokal menggunakan home per agen yang terisolasi, jadi pasang plugin Codex terlebih dahulu jika diperlukan, lalu gunakan `openclaw migrate plan codex` untuk menginventarisasi aset yang harus dipromosikan secara sengaja.
- Doctor menghapus `plugins.entries.codex.config.codexDynamicToolsProfile` yang sudah dipensiunkan; app-server Codex selalu mempertahankan tool workspace native Codex tetap native.
- Doctor memperingatkan ketika Skills yang diizinkan untuk agen default tidak tersedia di lingkungan runtime saat ini karena bin, env var, konfigurasi, atau persyaratan OS hilang. `doctor --fix` dapat menonaktifkan Skills yang tidak tersedia tersebut dengan `skills.entries.<skill>.enabled=false`; pasang/konfigurasikan persyaratan yang hilang sebagai gantinya ketika Anda ingin mempertahankan skill tetap aktif.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, doctor melaporkan peringatan bersinyal tinggi dengan remediasi (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika file registry sandbox lama atau direktori shard ada (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/`, atau `~/.openclaw/sandbox/browsers/`), doctor melaporkannya; `openclaw doctor --fix` memigrasikan entri valid ke SQLite dan mengarantina file lama yang tidak valid.
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola SecretRef dan tidak tersedia di jalur perintah saat ini, doctor melaporkan peringatan read-only dan tidak menulis kredensial fallback plaintext. Untuk SecretRefs berbasis exec, doctor melewati eksekusi kecuali `--allow-exec` ada.
- Jika inspeksi SecretRef channel gagal di jalur perbaikan, doctor melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Setelah migrasi direktori state, doctor memperingatkan ketika akun default Telegram atau Discord yang diaktifkan bergantung pada fallback env dan `TELEGRAM_BOT_TOKEN` atau `DISCORD_BOT_TOKEN` tidak tersedia untuk proses doctor.
- Resolusi otomatis username `allowFrom` Telegram (`doctor --fix`) memerlukan token Telegram yang dapat di-resolve di jalur perintah saat ini. Jika inspeksi token tidak tersedia, doctor melaporkan peringatan dan melewati resolusi otomatis untuk lintasan tersebut.

## macOS: override env `launchctl`

Jika sebelumnya Anda menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai tersebut menimpa file konfigurasi Anda dan dapat menyebabkan galat "unauthorized" yang persisten.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Terkait

- [Referensi CLI](/id/cli)
- [Gateway doctor](/id/gateway/doctor)
