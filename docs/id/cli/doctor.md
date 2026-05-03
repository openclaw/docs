---
read_when:
    - Anda mengalami masalah konektivitas/autentikasi dan menginginkan perbaikan terpandu
    - Anda telah memperbarui dan ingin melakukan pemeriksaan kewajaran
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: Dokter
x-i18n:
    generated_at: "2026-05-03T21:28:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4baab5b0cd4d046d12ae5bd14ccf05224115856d45e630a57e77a2be15e5db0
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Pemeriksaan kesehatan + perbaikan cepat untuk Gateway dan kanal.

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

- `--no-workspace-suggestions`: menonaktifkan saran memori/pencarian workspace
- `--yes`: menerima default tanpa prompt
- `--repair`: menerapkan perbaikan non-layanan yang direkomendasikan tanpa prompt; instalasi dan penulisan ulang layanan Gateway tetap memerlukan konfirmasi interaktif atau perintah Gateway eksplisit
- `--fix`: alias untuk `--repair`
- `--force`: menerapkan perbaikan agresif, termasuk menimpa konfigurasi layanan kustom bila diperlukan
- `--non-interactive`: berjalan tanpa prompt; hanya migrasi aman dan perbaikan non-layanan
- `--generate-gateway-token`: membuat dan mengonfigurasi token Gateway
- `--deep`: memindai layanan sistem untuk instalasi Gateway tambahan

Catatan:

- Prompt interaktif (seperti perbaikan keychain/OAuth) hanya berjalan ketika stdin adalah TTY dan `--non-interactive` **tidak** diatur. Proses tanpa head (cron, Telegram, tanpa terminal) akan melewati prompt.
- Performa: proses `doctor` non-interaktif melewati pemuatan plugin secara eager agar pemeriksaan kesehatan tanpa head tetap cepat. Sesi interaktif tetap memuat plugin sepenuhnya ketika sebuah pemeriksaan memerlukan kontribusinya.
- `--fix` (alias untuk `--repair`) menulis cadangan ke `~/.openclaw/openclaw.json.bak` dan menghapus kunci konfigurasi yang tidak dikenal, dengan mencantumkan setiap penghapusan.
- `doctor --fix --non-interactive` melaporkan definisi layanan Gateway yang hilang atau usang, tetapi tidak menginstal atau menulis ulang di luar mode perbaikan pembaruan. Jalankan `openclaw gateway install` untuk layanan yang hilang, atau `openclaw gateway install --force` ketika Anda memang ingin mengganti launcher.
- Pemeriksaan integritas state kini mendeteksi berkas transkrip yatim di direktori sesi. Mengarsipkannya sebagai `.deleted.<timestamp>` memerlukan konfirmasi interaktif; `--fix`, `--yes`, dan proses tanpa head membiarkannya tetap di tempat.
- Doctor juga memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk bentuk job cron legacy dan dapat menulis ulang di tempat sebelum scheduler harus melakukan normalisasi otomatis saat runtime.
- Di Linux, doctor memperingatkan ketika crontab pengguna masih menjalankan legacy `~/.openclaw/bin/ensure-whatsapp.sh`; skrip itu tidak lagi dipelihara dan dapat mencatat outage Gateway WhatsApp palsu ketika cron tidak memiliki lingkungan user-bus systemd.
- Doctor membersihkan state staging dependensi plugin legacy yang dibuat oleh versi OpenClaw lama. Doctor juga memperbaiki plugin unduhan yang dikonfigurasi tetapi hilang ketika registry dapat me-resolve-nya, dan pass doctor 2026.5.2 secara otomatis menginstal plugin unduhan yang sudah digunakan konfigurasi lama sebelum menandai konfigurasi tersentuh untuk rilis tersebut.
- Doctor memperbaiki konfigurasi plugin usang dengan menghapus id plugin yang hilang dari `plugins.allow`/`plugins.entries`, beserta konfigurasi kanal yang menggantung, target Heartbeat, dan override model kanal yang cocok ketika penemuan plugin sehat.
- Doctor mengarantina konfigurasi plugin tidak valid dengan menonaktifkan entri `plugins.entries.<id>` yang terpengaruh dan menghapus payload `config`-nya yang tidak valid. Startup Gateway sudah hanya melewati plugin bermasalah tersebut agar plugin dan kanal lain dapat terus berjalan.
- Atur `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor lain memiliki lifecycle Gateway. Doctor tetap melaporkan kesehatan Gateway/layanan dan menerapkan perbaikan non-layanan, tetapi melewati instalasi/start/restart/bootstrap layanan dan pembersihan layanan legacy.
- Di Linux, doctor mengabaikan unit systemd tambahan mirip Gateway yang tidak aktif dan tidak menulis ulang metadata perintah/entrypoint untuk layanan Gateway systemd yang sedang berjalan saat perbaikan. Hentikan layanan terlebih dahulu atau gunakan `openclaw gateway install --force` ketika Anda memang ingin mengganti launcher aktif.
- Doctor otomatis memigrasikan konfigurasi Talk datar legacy (`talk.voiceId`, `talk.modelId`, dan sejenisnya) ke `talk.provider` + `talk.providers.<provider>`.
- Proses `doctor --fix` berulang tidak lagi melaporkan/menerapkan normalisasi Talk ketika satu-satunya perbedaan adalah urutan kunci objek.
- Doctor menyertakan pemeriksaan kesiapan pencarian memori dan dapat merekomendasikan `openclaw configure --section model` ketika kredensial embedding hilang.
- Doctor memperingatkan ketika tidak ada pemilik perintah yang dikonfigurasi. Pemilik perintah adalah akun operator manusia yang diizinkan menjalankan perintah khusus pemilik dan menyetujui tindakan berbahaya. Pairing DM hanya mengizinkan seseorang berbicara dengan bot; jika Anda menyetujui pengirim sebelum bootstrap pemilik pertama tersedia, atur `commands.ownerAllowFrom` secara eksplisit.
- Doctor memperingatkan ketika agen mode Codex dikonfigurasi dan aset CLI Codex pribadi ada di home Codex operator. Peluncuran app-server Codex lokal menggunakan home per-agen yang terisolasi, jadi gunakan `openclaw migrate codex --dry-run` untuk menginventarisasi aset yang harus dipromosikan secara sengaja.
- Doctor memperingatkan ketika Skills yang diizinkan untuk agen default tidak tersedia di lingkungan runtime saat ini karena bin, env var, konfigurasi, atau persyaratan OS hilang. `doctor --fix` dapat menonaktifkan skill yang tidak tersedia tersebut dengan `skills.entries.<skill>.enabled=false`; instal/konfigurasikan persyaratan yang hilang sebagai gantinya ketika Anda ingin skill tetap aktif.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, doctor melaporkan peringatan bernilai tinggi dengan remediasi (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika berkas registry sandbox legacy (`~/.openclaw/sandbox/containers.json` atau `~/.openclaw/sandbox/browsers.json`) ada, doctor melaporkannya; `openclaw doctor --fix` memigrasikan entri valid ke direktori registry tersharding dan mengarantina berkas legacy yang tidak valid.
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola SecretRef dan tidak tersedia di path perintah saat ini, doctor melaporkan peringatan baca-saja dan tidak menulis kredensial fallback plaintext.
- Jika inspeksi SecretRef kanal gagal di path perbaikan, doctor melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Setelah migrasi direktori state, doctor memperingatkan ketika akun Telegram atau Discord default yang aktif bergantung pada fallback env dan `TELEGRAM_BOT_TOKEN` atau `DISCORD_BOT_TOKEN` tidak tersedia untuk proses doctor.
- Auto-resolusi username `allowFrom` Telegram (`doctor --fix`) memerlukan token Telegram yang dapat di-resolve di path perintah saat ini. Jika inspeksi token tidak tersedia, doctor melaporkan peringatan dan melewati auto-resolusi untuk pass tersebut.

## macOS: override env `launchctl`

Jika sebelumnya Anda menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai itu menimpa berkas konfigurasi Anda dan dapat menyebabkan galat “tidak terotorisasi” yang persisten.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Terkait

- [Referensi CLI](/id/cli)
- [Gateway doctor](/id/gateway/doctor)
