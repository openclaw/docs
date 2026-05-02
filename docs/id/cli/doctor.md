---
read_when:
    - Anda mengalami masalah konektivitas/autentikasi dan menginginkan perbaikan terpandu
    - Anda telah memperbarui dan ingin pemeriksaan kewajaran
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: Diagnostik
x-i18n:
    generated_at: "2026-05-02T09:15:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: e861fa105737088eafa55815faa1a37ccd61e154e8dbe811cf4b988bc1c571e5
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

## Opsi

- `--no-workspace-suggestions`: nonaktifkan saran memori/pencarian workspace
- `--yes`: terima default tanpa prompt
- `--repair`: terapkan perbaikan non-layanan yang direkomendasikan tanpa prompt; pemasangan dan penulisan ulang layanan Gateway tetap memerlukan konfirmasi interaktif atau perintah Gateway eksplisit
- `--fix`: alias untuk `--repair`
- `--force`: terapkan perbaikan agresif, termasuk menimpa konfigurasi layanan kustom bila diperlukan
- `--non-interactive`: jalankan tanpa prompt; hanya migrasi aman dan perbaikan non-layanan
- `--generate-gateway-token`: buat dan konfigurasikan token Gateway
- `--deep`: pindai layanan sistem untuk pemasangan Gateway tambahan

Catatan:

- Prompt interaktif (seperti perbaikan keychain/OAuth) hanya berjalan ketika stdin adalah TTY dan `--non-interactive` **tidak** disetel. Eksekusi headless (cron, Telegram, tanpa terminal) akan melewati prompt.
- Performa: eksekusi `doctor` non-interaktif melewati pemuatan plugin awal agar pemeriksaan kesehatan headless tetap cepat. Sesi interaktif tetap memuat plugin sepenuhnya ketika suatu pemeriksaan membutuhkan kontribusinya.
- `--fix` (alias untuk `--repair`) menulis cadangan ke `~/.openclaw/openclaw.json.bak` dan menghapus kunci konfigurasi yang tidak dikenal, dengan mencantumkan setiap penghapusan.
- `doctor --fix --non-interactive` melaporkan definisi layanan Gateway yang hilang atau usang, tetapi tidak memasang atau menulis ulang definisi tersebut di luar mode perbaikan pembaruan. Jalankan `openclaw gateway install` untuk layanan yang hilang, atau `openclaw gateway install --force` ketika Anda memang ingin mengganti launcher.
- Pemeriksaan integritas state kini mendeteksi file transkrip yatim di direktori sesi. Mengarsipkannya sebagai `.deleted.<timestamp>` memerlukan konfirmasi interaktif; `--fix`, `--yes`, dan eksekusi headless membiarkannya tetap di tempat.
- Doctor juga memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk bentuk job cron lama dan dapat menulis ulangnya di tempat sebelum scheduler harus menormalisasinya otomatis saat runtime.
- Di Linux, doctor memperingatkan ketika crontab pengguna masih menjalankan `~/.openclaw/bin/ensure-whatsapp.sh` lama; skrip tersebut tidak lagi dipelihara dan dapat mencatat gangguan Gateway WhatsApp palsu ketika cron tidak memiliki lingkungan systemd user-bus.
- Doctor membersihkan state staging dependensi plugin lama yang dibuat oleh versi OpenClaw yang lebih lama. Doctor juga memperbaiki plugin unduhan terkonfigurasi yang hilang ketika registry dapat meresolvinya.
- Doctor memperbaiki konfigurasi plugin usang dengan menghapus id plugin yang hilang dari `plugins.allow`/`plugins.entries`, ditambah konfigurasi channel menggantung yang cocok, target heartbeat, dan override model channel ketika penemuan plugin sehat.
- Doctor mengarantina konfigurasi plugin tidak valid dengan menonaktifkan entri `plugins.entries.<id>` yang terdampak dan menghapus payload `config` yang tidak valid. Startup Gateway sudah hanya melewati plugin buruk tersebut sehingga plugin dan channel lain dapat tetap berjalan.
- Setel `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor lain memiliki lifecycle Gateway. Doctor tetap melaporkan kesehatan Gateway/layanan dan menerapkan perbaikan non-layanan, tetapi melewati pemasangan/start/restart/bootstrap layanan serta pembersihan layanan lama.
- Di Linux, doctor mengabaikan unit systemd tambahan mirip Gateway yang tidak aktif dan tidak menulis ulang metadata perintah/entrypoint untuk layanan Gateway systemd yang sedang berjalan selama perbaikan. Hentikan layanan terlebih dahulu atau gunakan `openclaw gateway install --force` ketika Anda memang ingin mengganti launcher aktif.
- Doctor memigrasikan otomatis konfigurasi Talk flat lama (`talk.voiceId`, `talk.modelId`, dan sejenisnya) ke `talk.provider` + `talk.providers.<provider>`.
- Eksekusi `doctor --fix` berulang tidak lagi melaporkan/menerapkan normalisasi Talk ketika satu-satunya perbedaan adalah urutan kunci objek.
- Doctor menyertakan pemeriksaan kesiapan pencarian memori dan dapat merekomendasikan `openclaw configure --section model` ketika kredensial embedding hilang.
- Doctor memperingatkan ketika tidak ada pemilik perintah yang dikonfigurasi. Pemilik perintah adalah akun operator manusia yang diizinkan menjalankan perintah khusus pemilik dan menyetujui tindakan berbahaya. Pairing DM hanya memungkinkan seseorang berbicara dengan bot; jika Anda menyetujui pengirim sebelum bootstrap pemilik pertama ada, setel `commands.ownerAllowFrom` secara eksplisit.
- Doctor memperingatkan ketika agen mode Codex dikonfigurasi dan aset CLI Codex pribadi ada di home Codex milik operator. Peluncuran app-server Codex lokal menggunakan home per agen yang terisolasi, jadi gunakan `openclaw migrate codex --dry-run` untuk menginventarisasi aset yang sebaiknya dipromosikan secara sengaja.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, doctor melaporkan peringatan sinyal tinggi dengan remediasi (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola SecretRef dan tidak tersedia di path perintah saat ini, doctor melaporkan peringatan hanya-baca dan tidak menulis kredensial fallback teks polos.
- Jika inspeksi SecretRef channel gagal di path perbaikan, doctor melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Setelah migrasi direktori state, doctor memperingatkan ketika akun Telegram atau Discord default yang diaktifkan bergantung pada fallback env dan `TELEGRAM_BOT_TOKEN` atau `DISCORD_BOT_TOKEN` tidak tersedia bagi proses doctor.
- Resolusi otomatis username `allowFrom` Telegram (`doctor --fix`) memerlukan token Telegram yang dapat diresolve di path perintah saat ini. Jika inspeksi token tidak tersedia, doctor melaporkan peringatan dan melewati resolusi otomatis untuk pass tersebut.

## macOS: override env `launchctl`

Jika sebelumnya Anda menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai tersebut mengesampingkan file konfigurasi Anda dan dapat menyebabkan error “unauthorized” yang persisten.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Terkait

- [Referensi CLI](/id/cli)
- [Gateway doctor](/id/gateway/doctor)
