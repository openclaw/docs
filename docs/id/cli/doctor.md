---
read_when:
    - Anda mengalami masalah konektivitas/autentikasi dan menginginkan perbaikan terpandu
    - Anda telah memperbarui dan ingin pemeriksaan kewajaran
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: Dokter
x-i18n:
    generated_at: "2026-05-06T09:04:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20eff2f94b41315dbe1d393ebbbf6dce352a7f9e589db3b8fb51f423dd6fed28
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Pemeriksaan kesehatan + perbaikan cepat untuk Gateway dan kanal.

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

- `--no-workspace-suggestions`: nonaktifkan saran memori/pencarian ruang kerja
- `--yes`: terima default tanpa meminta konfirmasi
- `--repair`: terapkan perbaikan non-layanan yang direkomendasikan tanpa meminta konfirmasi; pemasangan dan penulisan ulang layanan Gateway tetap memerlukan konfirmasi interaktif atau perintah Gateway eksplisit
- `--fix`: alias untuk `--repair`
- `--force`: terapkan perbaikan agresif, termasuk menimpa konfigurasi layanan khusus bila diperlukan
- `--non-interactive`: jalankan tanpa prompt; hanya migrasi aman dan perbaikan non-layanan
- `--generate-gateway-token`: buat dan konfigurasikan token Gateway
- `--deep`: pindai layanan sistem untuk pemasangan Gateway tambahan dan laporkan serah-terima mulai ulang supervisor Gateway terbaru

Catatan:

- Prompt interaktif (seperti perbaikan keychain/OAuth) hanya berjalan ketika stdin adalah TTY dan `--non-interactive` **tidak** diatur. Eksekusi headless (cron, Telegram, tanpa terminal) akan melewati prompt.
- Performa: eksekusi `doctor` non-interaktif melewati pemuatan Plugin secara eager agar pemeriksaan kesehatan headless tetap cepat. Sesi interaktif tetap memuat Plugin sepenuhnya ketika suatu pemeriksaan membutuhkan kontribusinya.
- `--fix` (alias untuk `--repair`) menulis cadangan ke `~/.openclaw/openclaw.json.bak` dan membuang kunci konfigurasi yang tidak dikenal, dengan mencantumkan setiap penghapusan.
- `doctor --fix --non-interactive` melaporkan definisi layanan Gateway yang hilang atau usang, tetapi tidak memasang atau menulis ulang definisi tersebut di luar mode perbaikan pembaruan. Jalankan `openclaw gateway install` untuk layanan yang hilang, atau `openclaw gateway install --force` ketika Anda sengaja ingin mengganti peluncur.
- Pemeriksaan integritas status kini mendeteksi berkas transkrip yatim di direktori sesi. Mengarsipkannya sebagai `.deleted.<timestamp>` memerlukan konfirmasi interaktif; `--fix`, `--yes`, dan eksekusi headless membiarkannya tetap di tempat.
- Doctor juga memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk bentuk tugas cron legacy dan dapat menulis ulangnya di tempat sebelum scheduler harus menormalisasikannya otomatis saat runtime.
- Di Linux, Doctor memperingatkan ketika crontab pengguna masih menjalankan `~/.openclaw/bin/ensure-whatsapp.sh` legacy; skrip itu tidak lagi dipelihara dan dapat mencatat gangguan Gateway WhatsApp palsu ketika cron tidak memiliki lingkungan user-bus systemd.
- Ketika WhatsApp diaktifkan, Doctor memeriksa loop peristiwa Gateway yang terdegradasi dengan klien `openclaw-tui` lokal yang masih berjalan. `doctor --fix` hanya menghentikan klien TUI lokal yang terverifikasi agar balasan WhatsApp tidak mengantre di belakang loop penyegaran TUI yang basi.
- Doctor menulis ulang referensi model `openai-codex/*` legacy menjadi referensi `openai/*` kanonis di seluruh model utama, fallback, override heartbeat/subagen/compaction, hook, override model kanal, dan pin rute sesi yang basi. `--fix` memilih `agentRuntime.id: "codex"` hanya ketika Plugin Codex terpasang, diaktifkan, menyumbangkan harness `codex`, dan memiliki OAuth yang dapat digunakan; jika tidak, ia memilih `agentRuntime.id: "pi"` agar rute tetap berada pada runner OpenClaw default.
- Doctor membersihkan status staging dependensi Plugin legacy yang dibuat oleh versi OpenClaw lama. Ia juga memperbaiki Plugin unduhan yang hilang yang dirujuk oleh konfigurasi, seperti `plugins.entries`, kanal yang dikonfigurasi, pengaturan penyedia/pencarian yang dikonfigurasi, atau runtime agen yang dikonfigurasi. Selama pembaruan paket, Doctor melewati perbaikan Plugin pengelola paket sampai pertukaran paket selesai; jalankan ulang `openclaw doctor --fix` setelahnya jika Plugin yang dikonfigurasi masih perlu dipulihkan. Jika unduhan gagal, Doctor melaporkan kesalahan pemasangan dan mempertahankan entri Plugin yang dikonfigurasi untuk percobaan perbaikan berikutnya.
- Doctor memperbaiki konfigurasi Plugin yang basi dengan menghapus id Plugin yang hilang dari `plugins.allow`/`plugins.entries`, beserta konfigurasi kanal yang menggantung, target Heartbeat, dan override model kanal yang cocok ketika penemuan Plugin sehat.
- Doctor mengarantina konfigurasi Plugin yang tidak valid dengan menonaktifkan entri `plugins.entries.<id>` yang terdampak dan menghapus payload `config` yang tidak valid. Startup Gateway sudah hanya melewati Plugin buruk tersebut agar Plugin dan kanal lain tetap dapat berjalan.
- Atur `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor lain memiliki siklus hidup Gateway. Doctor tetap melaporkan kesehatan Gateway/layanan dan menerapkan perbaikan non-layanan, tetapi melewati pemasangan/mulai/mulai ulang/bootstrap layanan dan pembersihan layanan legacy.
- Di Linux, Doctor mengabaikan unit systemd mirip Gateway tambahan yang tidak aktif dan tidak menulis ulang metadata perintah/entrypoint untuk layanan Gateway systemd yang sedang berjalan selama perbaikan. Hentikan layanan terlebih dahulu atau gunakan `openclaw gateway install --force` ketika Anda sengaja ingin mengganti peluncur aktif.
- Doctor memigrasikan otomatis konfigurasi Talk datar legacy (`talk.voiceId`, `talk.modelId`, dan sejenisnya) ke `talk.provider` + `talk.providers.<provider>`.
- Eksekusi `doctor --fix` berulang tidak lagi melaporkan/menerapkan normalisasi Talk ketika satu-satunya perbedaan adalah urutan kunci objek.
- Doctor menyertakan pemeriksaan kesiapan pencarian memori dan dapat merekomendasikan `openclaw configure --section model` ketika kredensial embedding hilang.
- Doctor memperingatkan ketika tidak ada pemilik perintah yang dikonfigurasi. Pemilik perintah adalah akun operator manusia yang diizinkan menjalankan perintah khusus pemilik dan menyetujui tindakan berbahaya. Pairing DM hanya mengizinkan seseorang berbicara dengan bot; jika Anda menyetujui pengirim sebelum bootstrap pemilik pertama tersedia, atur `commands.ownerAllowFrom` secara eksplisit.
- Doctor memperingatkan ketika agen mode Codex dikonfigurasi dan aset CLI Codex pribadi ada di home Codex operator. Peluncuran app-server Codex lokal menggunakan home terisolasi per agen, jadi gunakan `openclaw migrate codex --dry-run` untuk menginventarisasi aset yang sebaiknya dipromosikan secara sengaja.
- Doctor memperingatkan ketika Skills yang diizinkan untuk agen default tidak tersedia di lingkungan runtime saat ini karena bin, variabel env, konfigurasi, atau persyaratan OS hilang. `doctor --fix` dapat menonaktifkan skill yang tidak tersedia tersebut dengan `skills.entries.<skill>.enabled=false`; pasang/konfigurasikan persyaratan yang hilang sebagai gantinya ketika Anda ingin mempertahankan skill tetap aktif.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, Doctor melaporkan peringatan bernilai tinggi dengan remediasi (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika berkas registry sandbox legacy (`~/.openclaw/sandbox/containers.json` atau `~/.openclaw/sandbox/browsers.json`) ada, Doctor melaporkannya; `openclaw doctor --fix` memigrasikan entri valid ke direktori registry terserpih dan mengarantina berkas legacy yang tidak valid.
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola SecretRef dan tidak tersedia di jalur perintah saat ini, Doctor melaporkan peringatan baca-saja dan tidak menulis kredensial fallback plaintext.
- Jika inspeksi SecretRef kanal gagal di jalur perbaikan, Doctor melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Setelah migrasi direktori status, Doctor memperingatkan ketika akun Telegram atau Discord default yang diaktifkan bergantung pada fallback env dan `TELEGRAM_BOT_TOKEN` atau `DISCORD_BOT_TOKEN` tidak tersedia untuk proses Doctor.
- Resolusi otomatis nama pengguna `allowFrom` Telegram (`doctor --fix`) memerlukan token Telegram yang dapat diresolusi di jalur perintah saat ini. Jika inspeksi token tidak tersedia, Doctor melaporkan peringatan dan melewati resolusi otomatis untuk lintasan tersebut.

## macOS: override env `launchctl`

Jika sebelumnya Anda menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai tersebut menimpa berkas konfigurasi Anda dan dapat menyebabkan kesalahan “tidak terotorisasi” yang persisten.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor Gateway](/id/gateway/doctor)
