---
read_when:
    - Anda mengalami masalah konektivitas/autentikasi dan menginginkan perbaikan terpandu
    - Anda telah memperbarui dan ingin pemeriksaan kewajaran
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: Diagnostik
x-i18n:
    generated_at: "2026-05-04T02:22:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd7fb09d373c313e4be45ad9e3b19ceb187a5787ef3e70fcd2b1f1f01b50c905
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Pemeriksaan kesehatan + perbaikan cepat untuk Gateway dan channel.

Terkait:

- Pemecahan masalah: [Pemecahan masalah](/id/gateway/troubleshooting)
- Audit keamanan: [Keamanan](/id/gateway/security)

## Contoh

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Opsi

- `--no-workspace-suggestions`: nonaktifkan saran memori/pencarian workspace
- `--yes`: terima nilai default tanpa prompt
- `--repair`: terapkan perbaikan non-layanan yang direkomendasikan tanpa prompt; pemasangan dan penulisan ulang layanan Gateway tetap memerlukan konfirmasi interaktif atau perintah Gateway eksplisit
- `--fix`: alias untuk `--repair`
- `--force`: terapkan perbaikan agresif, termasuk menimpa konfigurasi layanan kustom jika diperlukan
- `--non-interactive`: jalankan tanpa prompt; hanya migrasi aman dan perbaikan non-layanan
- `--generate-gateway-token`: buat dan konfigurasikan token Gateway
- `--deep`: pindai layanan sistem untuk pemasangan Gateway tambahan

Catatan:

- Prompt interaktif (seperti perbaikan keychain/OAuth) hanya berjalan ketika stdin adalah TTY dan `--non-interactive` **tidak** disetel. Eksekusi headless (cron, Telegram, tanpa terminal) akan melewati prompt.
- Performa: eksekusi `doctor` non-interaktif melewati pemuatan Plugin secara eager agar pemeriksaan kesehatan headless tetap cepat. Sesi interaktif tetap memuat Plugin sepenuhnya ketika pemeriksaan membutuhkan kontribusinya.
- `--fix` (alias untuk `--repair`) menulis cadangan ke `~/.openclaw/openclaw.json.bak` dan menghapus kunci konfigurasi yang tidak dikenal, dengan mencantumkan setiap penghapusan.
- `doctor --fix --non-interactive` melaporkan definisi layanan Gateway yang hilang atau usang tetapi tidak memasang atau menulis ulang definisi tersebut di luar mode perbaikan pembaruan. Jalankan `openclaw gateway install` untuk layanan yang hilang, atau `openclaw gateway install --force` ketika Anda memang ingin mengganti launcher.
- Pemeriksaan integritas status kini mendeteksi file transkrip yatim di direktori sesi. Mengarsipkannya sebagai `.deleted.<timestamp>` memerlukan konfirmasi interaktif; `--fix`, `--yes`, dan eksekusi headless membiarkannya tetap di tempat.
- Doctor juga memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk bentuk job cron lama dan dapat menulis ulang secara langsung sebelum scheduler harus melakukan normalisasi otomatis saat runtime.
- Di Linux, doctor memperingatkan ketika crontab pengguna masih menjalankan `~/.openclaw/bin/ensure-whatsapp.sh` lama; skrip tersebut tidak lagi dipelihara dan dapat mencatat gangguan Gateway WhatsApp palsu ketika cron tidak memiliki lingkungan user-bus systemd.
- Doctor membersihkan status staging dependensi Plugin lama yang dibuat oleh versi OpenClaw yang lebih lama. Doctor juga memperbaiki Plugin unduhan terkonfigurasi yang hilang ketika registry dapat menyelesaikannya, dan proses doctor 2026.5.2 secara otomatis memasang Plugin unduhan yang sudah digunakan konfigurasi lama sebelum menandai konfigurasi tersentuh untuk rilis tersebut. Jika unduhan gagal, doctor melaporkan error pemasangan dan mempertahankan entri Plugin terkonfigurasi untuk upaya perbaikan berikutnya.
- Doctor memperbaiki konfigurasi Plugin usang dengan menghapus id Plugin yang hilang dari `plugins.allow`/`plugins.entries`, serta konfigurasi channel yang menggantung, target Heartbeat, dan override model channel yang cocok ketika penemuan Plugin sehat.
- Doctor mengarantina konfigurasi Plugin yang tidak valid dengan menonaktifkan entri `plugins.entries.<id>` yang terdampak dan menghapus payload `config` yang tidak valid. Startup Gateway sudah melewati hanya Plugin bermasalah tersebut sehingga Plugin dan channel lain dapat tetap berjalan.
- Setel `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor lain memiliki siklus hidup Gateway. Doctor tetap melaporkan kesehatan Gateway/layanan dan menerapkan perbaikan non-layanan, tetapi melewati pemasangan/start/restart/bootstrap layanan dan pembersihan layanan lama.
- Di Linux, doctor mengabaikan unit systemd tambahan mirip Gateway yang tidak aktif dan tidak menulis ulang metadata command/entrypoint untuk layanan Gateway systemd yang sedang berjalan selama perbaikan. Hentikan layanan terlebih dahulu atau gunakan `openclaw gateway install --force` ketika Anda memang ingin mengganti launcher aktif.
- Doctor melakukan migrasi otomatis konfigurasi Talk datar lama (`talk.voiceId`, `talk.modelId`, dan sejenisnya) ke `talk.provider` + `talk.providers.<provider>`.
- Eksekusi `doctor --fix` berulang tidak lagi melaporkan/menerapkan normalisasi Talk ketika satu-satunya perbedaan adalah urutan kunci objek.
- Doctor menyertakan pemeriksaan kesiapan pencarian memori dan dapat merekomendasikan `openclaw configure --section model` ketika kredensial embedding hilang.
- Doctor memperingatkan ketika tidak ada pemilik command yang dikonfigurasi. Pemilik command adalah akun operator manusia yang diizinkan menjalankan command khusus pemilik dan menyetujui tindakan berbahaya. Pairing DM hanya memungkinkan seseorang berbicara dengan bot; jika Anda menyetujui pengirim sebelum bootstrap pemilik pertama ada, setel `commands.ownerAllowFrom` secara eksplisit.
- Doctor memperingatkan ketika agen mode Codex dikonfigurasi dan aset CLI Codex pribadi ada di home Codex operator. Peluncuran server aplikasi Codex lokal menggunakan home per-agen yang terisolasi, jadi gunakan `openclaw migrate codex --dry-run` untuk menginventarisasi aset yang harus dipromosikan secara sengaja.
- Doctor memperingatkan ketika Skills yang diizinkan untuk agen default tidak tersedia di lingkungan runtime saat ini karena bin, env vars, konfigurasi, atau persyaratan OS hilang. `doctor --fix` dapat menonaktifkan Skills yang tidak tersedia tersebut dengan `skills.entries.<skill>.enabled=false`; pasang/konfigurasikan persyaratan yang hilang sebagai gantinya ketika Anda ingin mempertahankan skill tetap aktif.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, doctor melaporkan peringatan bernilai tinggi dengan remediasi (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika file registry sandbox lama (`~/.openclaw/sandbox/containers.json` atau `~/.openclaw/sandbox/browsers.json`) ada, doctor melaporkannya; `openclaw doctor --fix` memigrasikan entri valid ke direktori registry bershard dan mengarantina file lama yang tidak valid.
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola SecretRef dan tidak tersedia di jalur command saat ini, doctor melaporkan peringatan hanya-baca dan tidak menulis kredensial fallback plaintext.
- Jika inspeksi SecretRef channel gagal di jalur perbaikan, doctor melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Setelah migrasi direktori status, doctor memperingatkan ketika akun Telegram atau Discord default yang diaktifkan bergantung pada fallback env dan `TELEGRAM_BOT_TOKEN` atau `DISCORD_BOT_TOKEN` tidak tersedia untuk proses doctor.
- Resolusi otomatis username `allowFrom` Telegram (`doctor --fix`) memerlukan token Telegram yang dapat di-resolve di jalur command saat ini. Jika inspeksi token tidak tersedia, doctor melaporkan peringatan dan melewati resolusi otomatis untuk proses tersebut.

## macOS: override env `launchctl`

Jika sebelumnya Anda menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai tersebut menimpa file konfigurasi Anda dan dapat menyebabkan error “tidak terotorisasi” yang persisten.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Terkait

- [Referensi CLI](/id/cli)
- [Gateway doctor](/id/gateway/doctor)
