---
read_when:
    - Anda mengalami masalah konektivitas/autentikasi dan menginginkan perbaikan terpandu
    - Anda telah memperbarui dan ingin pemeriksaan kewajaran
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: Dokter
x-i18n:
    generated_at: "2026-05-07T13:14:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7683a974eb9406e5ca071612c96c7db05247a69e253ef4293c57e7707aa5fd4
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Pemeriksaan kesehatan + perbaikan cepat untuk Gateway dan channel.

Terkait:

- Pemecahan masalah: [Pemecahan Masalah](/id/gateway/troubleshooting)
- Audit keamanan: [Keamanan](/id/gateway/security)

## Contoh

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

Untuk izin khusus channel, gunakan probe channel alih-alih `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Probe kapabilitas Discord bertarget melaporkan izin channel efektif milik bot; probe status mengaudit channel Discord yang dikonfigurasi dan target bergabung otomatis ke suara.

## Opsi

- `--no-workspace-suggestions`: nonaktifkan saran memori/pencarian workspace
- `--yes`: terima default tanpa prompt
- `--repair`: terapkan perbaikan non-layanan yang direkomendasikan tanpa prompt; instalasi dan penulisan ulang layanan Gateway masih memerlukan konfirmasi interaktif atau perintah Gateway eksplisit
- `--fix`: alias untuk `--repair`
- `--force`: terapkan perbaikan agresif, termasuk menimpa konfigurasi layanan khusus bila diperlukan
- `--non-interactive`: jalankan tanpa prompt; hanya migrasi aman dan perbaikan non-layanan
- `--generate-gateway-token`: buat dan konfigurasikan token Gateway
- `--deep`: pindai layanan sistem untuk instalasi Gateway tambahan dan laporkan handoff restart supervisor Gateway terbaru

Catatan:

- Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), pemeriksaan doctor yang hanya baca tetap berfungsi, tetapi `doctor --fix`, `doctor --repair`, `doctor --yes`, dan `doctor --generate-gateway-token` dinonaktifkan karena `openclaw.json` tidak dapat diubah. Edit sumber Nix untuk instalasi ini sebagai gantinya; untuk nix-openclaw, gunakan [Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen.
- Prompt interaktif (seperti perbaikan keychain/OAuth) hanya berjalan saat stdin adalah TTY dan `--non-interactive` **tidak** disetel. Eksekusi headless (cron, Telegram, tanpa terminal) akan melewati prompt.
- Performa: eksekusi `doctor` non-interaktif melewati pemuatan plugin awal agar pemeriksaan kesehatan headless tetap cepat. Sesi interaktif tetap memuat plugin sepenuhnya ketika pemeriksaan memerlukan kontribusinya.
- `--fix` (alias untuk `--repair`) menulis cadangan ke `~/.openclaw/openclaw.json.bak` dan menghapus kunci konfigurasi yang tidak dikenal, dengan mencantumkan setiap penghapusan.
- `doctor --fix --non-interactive` melaporkan definisi layanan Gateway yang hilang atau usang tetapi tidak menginstal atau menulis ulang di luar mode perbaikan pembaruan. Jalankan `openclaw gateway install` untuk layanan yang hilang, atau `openclaw gateway install --force` ketika Anda sengaja ingin mengganti launcher.
- Pemeriksaan integritas state kini mendeteksi file transkrip yatim di direktori sesi. Mengarsipkannya sebagai `.deleted.<timestamp>` memerlukan konfirmasi interaktif; `--fix`, `--yes`, dan eksekusi headless membiarkannya tetap di tempat.
- Doctor juga memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk bentuk job cron lama dan dapat menulis ulang di tempat sebelum scheduler harus melakukan normalisasi otomatis saat runtime.
- Di Linux, doctor memperingatkan ketika crontab pengguna masih menjalankan `~/.openclaw/bin/ensure-whatsapp.sh` lama; skrip tersebut tidak lagi dipelihara dan dapat mencatat gangguan Gateway WhatsApp palsu ketika cron tidak memiliki environment user-bus systemd.
- Ketika WhatsApp diaktifkan, doctor memeriksa event loop Gateway yang terdegradasi dengan klien `openclaw-tui` lokal yang masih berjalan. `doctor --fix` hanya menghentikan klien TUI lokal yang terverifikasi agar balasan WhatsApp tidak mengantre di belakang loop penyegaran TUI yang usang.
- Doctor menulis ulang ref model `openai-codex/*` lama menjadi ref `openai/*` kanonis di seluruh model utama, fallback, override heartbeat/subagen/compaction, hook, override model channel, dan pin rute sesi usang. `--fix` memilih `agentRuntime.id: "codex"` hanya ketika plugin Codex terinstal, aktif, mengontribusikan harness `codex`, dan memiliki OAuth yang dapat digunakan; jika tidak, memilih `agentRuntime.id: "pi"` agar rute tetap menggunakan runner OpenClaw default.
- Doctor membersihkan state staging dependensi plugin lama yang dibuat oleh versi OpenClaw lebih lama. Ini juga memperbaiki plugin unduhan yang hilang yang dirujuk oleh konfigurasi, seperti `plugins.entries`, channel yang dikonfigurasi, pengaturan provider/pencarian yang dikonfigurasi, atau runtime agen yang dikonfigurasi. Selama pembaruan paket, doctor melewati perbaikan plugin package-manager hingga penggantian paket selesai; jalankan ulang `openclaw doctor --fix` setelahnya jika plugin yang dikonfigurasi masih memerlukan pemulihan. Jika unduhan gagal, doctor melaporkan error instalasi dan mempertahankan entri plugin yang dikonfigurasi untuk percobaan perbaikan berikutnya.
- Doctor memperbaiki konfigurasi plugin usang dengan menghapus id plugin yang hilang dari `plugins.allow`/`plugins.entries`, plus konfigurasi channel menggantung yang cocok, target Heartbeat, dan override model channel ketika penemuan plugin sehat.
- Doctor mengarantina konfigurasi plugin tidak valid dengan menonaktifkan entri `plugins.entries.<id>` yang terdampak dan menghapus payload `config` yang tidak valid. Startup Gateway sudah hanya melewati plugin buruk tersebut sehingga plugin dan channel lain dapat tetap berjalan.
- Setel `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor lain memiliki lifecycle Gateway. Doctor tetap melaporkan kesehatan Gateway/layanan dan menerapkan perbaikan non-layanan, tetapi melewati instalasi/start/restart/bootstrap layanan dan pembersihan layanan lama.
- Di Linux, doctor mengabaikan unit systemd tambahan mirip Gateway yang tidak aktif dan tidak menulis ulang metadata command/entrypoint untuk layanan Gateway systemd yang sedang berjalan selama perbaikan. Hentikan layanan terlebih dahulu atau gunakan `openclaw gateway install --force` ketika Anda sengaja ingin mengganti launcher aktif.
- Doctor memigrasikan otomatis konfigurasi Talk datar lama (`talk.voiceId`, `talk.modelId`, dan sejenisnya) menjadi `talk.provider` + `talk.providers.<provider>`.
- Eksekusi berulang `doctor --fix` tidak lagi melaporkan/menerapkan normalisasi Talk ketika satu-satunya perbedaan adalah urutan kunci objek.
- Doctor menyertakan pemeriksaan kesiapan pencarian memori dan dapat merekomendasikan `openclaw configure --section model` ketika kredensial embedding hilang.
- Doctor memperingatkan ketika tidak ada pemilik command yang dikonfigurasi. Pemilik command adalah akun operator manusia yang diizinkan menjalankan command khusus pemilik dan menyetujui tindakan berbahaya. Pairing DM hanya memungkinkan seseorang berbicara dengan bot; jika Anda menyetujui pengirim sebelum bootstrap pemilik pertama ada, setel `commands.ownerAllowFrom` secara eksplisit.
- Doctor memperingatkan ketika agen mode Codex dikonfigurasi dan aset CLI Codex pribadi ada di home Codex operator. Peluncuran app-server Codex lokal menggunakan home terisolasi per agen, jadi gunakan `openclaw migrate codex --dry-run` untuk menginventarisasi aset yang sebaiknya dipromosikan secara sengaja.
- Doctor memperingatkan ketika Skills yang diizinkan untuk agen default tidak tersedia di environment runtime saat ini karena persyaratan bin, env vars, konfigurasi, atau OS hilang. `doctor --fix` dapat menonaktifkan skills yang tidak tersedia tersebut dengan `skills.entries.<skill>.enabled=false`; instal/konfigurasikan persyaratan yang hilang sebagai gantinya ketika Anda ingin menjaga skill tetap aktif.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, doctor melaporkan peringatan bersinyal tinggi dengan remediasi (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika file registry sandbox lama (`~/.openclaw/sandbox/containers.json` atau `~/.openclaw/sandbox/browsers.json`) ada, doctor melaporkannya; `openclaw doctor --fix` memigrasikan entri valid ke direktori registry tersharding dan mengarantina file lama yang tidak valid.
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola SecretRef dan tidak tersedia di path command saat ini, doctor melaporkan peringatan hanya baca dan tidak menulis kredensial fallback plaintext.
- Jika inspeksi SecretRef channel gagal di path perbaikan, doctor melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Setelah migrasi direktori state, doctor memperingatkan ketika akun Telegram atau Discord default yang aktif bergantung pada fallback env dan `TELEGRAM_BOT_TOKEN` atau `DISCORD_BOT_TOKEN` tidak tersedia untuk proses doctor.
- Resolusi otomatis username `allowFrom` Telegram (`doctor --fix`) memerlukan token Telegram yang dapat di-resolve di path command saat ini. Jika inspeksi token tidak tersedia, doctor melaporkan peringatan dan melewati resolusi otomatis untuk pass tersebut.

## macOS: override env `launchctl`

Jika sebelumnya Anda menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai itu menimpa file konfigurasi Anda dan dapat menyebabkan error "unauthorized" yang persisten.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor Gateway](/id/gateway/doctor)
