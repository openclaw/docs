---
read_when:
    - Anda mengalami masalah konektivitas/autentikasi dan menginginkan perbaikan terpandu
    - Anda telah memperbarui dan ingin pemeriksaan kewajaran
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: Dokter
x-i18n:
    generated_at: "2026-05-02T20:41:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: c64cefee8f36b38657b72912271e3734411870376d2bd5a374d23a77a080035d
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
- `--yes`: terima nilai default tanpa meminta konfirmasi
- `--repair`: terapkan perbaikan non-layanan yang direkomendasikan tanpa meminta konfirmasi; instalasi dan penulisan ulang layanan Gateway tetap memerlukan konfirmasi interaktif atau perintah Gateway eksplisit
- `--fix`: alias untuk `--repair`
- `--force`: terapkan perbaikan agresif, termasuk menimpa konfigurasi layanan kustom saat diperlukan
- `--non-interactive`: jalankan tanpa prompt; hanya migrasi aman dan perbaikan non-layanan
- `--generate-gateway-token`: buat dan konfigurasi token Gateway
- `--deep`: pindai layanan sistem untuk instalasi Gateway tambahan

Catatan:

- Prompt interaktif (seperti perbaikan keychain/OAuth) hanya berjalan saat stdin adalah TTY dan `--non-interactive` **tidak** diatur. Eksekusi tanpa antarmuka (cron, Telegram, tanpa terminal) akan melewati prompt.
- Performa: eksekusi `doctor` non-interaktif melewati pemuatan Plugin secara eager agar pemeriksaan kesehatan tanpa antarmuka tetap cepat. Sesi interaktif tetap memuat Plugin sepenuhnya saat pemeriksaan membutuhkan kontribusinya.
- `--fix` (alias untuk `--repair`) menulis cadangan ke `~/.openclaw/openclaw.json.bak` dan menghapus kunci konfigurasi yang tidak dikenal, dengan mencantumkan setiap penghapusan.
- `doctor --fix --non-interactive` melaporkan definisi layanan Gateway yang hilang atau kedaluwarsa tetapi tidak memasang atau menulis ulang definisi tersebut di luar mode perbaikan pembaruan. Jalankan `openclaw gateway install` untuk layanan yang hilang, atau `openclaw gateway install --force` saat Anda memang ingin mengganti peluncur.
- Pemeriksaan integritas state kini mendeteksi file transkrip yatim di direktori sesi. Mengarsipkannya sebagai `.deleted.<timestamp>` memerlukan konfirmasi interaktif; `--fix`, `--yes`, dan eksekusi tanpa antarmuka membiarkannya tetap di tempat.
- Doctor juga memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk bentuk pekerjaan cron lama dan dapat menulis ulang di tempat sebelum penjadwal harus menormalisasikannya otomatis saat runtime.
- Di Linux, doctor memperingatkan saat crontab pengguna masih menjalankan `~/.openclaw/bin/ensure-whatsapp.sh` lama; skrip itu tidak lagi dipelihara dan dapat mencatat gangguan Gateway WhatsApp palsu saat cron tidak memiliki lingkungan bus pengguna systemd.
- Doctor membersihkan state staging dependensi Plugin lama yang dibuat oleh versi OpenClaw lebih lama. Doctor juga memperbaiki Plugin unduhan terkonfigurasi yang hilang saat registry dapat menyelesaikannya, dan pass doctor 2026.5.2 secara otomatis memasang Plugin unduhan yang sudah digunakan konfigurasi lama sebelum menandai konfigurasi tersentuh untuk rilis tersebut.
- Doctor memperbaiki konfigurasi Plugin basi dengan menghapus id Plugin yang hilang dari `plugins.allow`/`plugins.entries`, beserta konfigurasi kanal yang menggantung, target Heartbeat, dan override model kanal yang sesuai saat penemuan Plugin sehat.
- Doctor mengarantina konfigurasi Plugin yang tidak valid dengan menonaktifkan entri `plugins.entries.<id>` yang terdampak dan menghapus payload `config` yang tidak valid. Startup Gateway sudah melewati hanya Plugin bermasalah tersebut agar Plugin dan kanal lain tetap dapat berjalan.
- Atur `OPENCLAW_SERVICE_REPAIR_POLICY=external` saat supervisor lain memiliki siklus hidup Gateway. Doctor tetap melaporkan kesehatan Gateway/layanan dan menerapkan perbaikan non-layanan, tetapi melewati pemasangan/mulai/mulai ulang/bootstrap layanan serta pembersihan layanan lama.
- Di Linux, doctor mengabaikan unit systemd tambahan mirip Gateway yang tidak aktif dan tidak menulis ulang metadata perintah/entrypoint untuk layanan Gateway systemd yang sedang berjalan selama perbaikan. Hentikan layanan terlebih dahulu atau gunakan `openclaw gateway install --force` saat Anda memang ingin mengganti peluncur aktif.
- Doctor otomatis memigrasikan konfigurasi Talk datar lama (`talk.voiceId`, `talk.modelId`, dan sejenisnya) ke `talk.provider` + `talk.providers.<provider>`.
- Eksekusi ulang `doctor --fix` tidak lagi melaporkan/menerapkan normalisasi Talk saat satu-satunya perbedaan adalah urutan kunci objek.
- Doctor menyertakan pemeriksaan kesiapan pencarian memori dan dapat merekomendasikan `openclaw configure --section model` saat kredensial embedding hilang.
- Doctor memperingatkan saat tidak ada pemilik perintah yang dikonfigurasi. Pemilik perintah adalah akun operator manusia yang diizinkan menjalankan perintah khusus pemilik dan menyetujui tindakan berbahaya. Pairing DM hanya memungkinkan seseorang berbicara dengan bot; jika Anda menyetujui pengirim sebelum bootstrap pemilik pertama ada, atur `commands.ownerAllowFrom` secara eksplisit.
- Doctor memperingatkan saat agen mode Codex dikonfigurasi dan aset CLI Codex pribadi ada di home Codex operator. Peluncuran app-server Codex lokal menggunakan home terisolasi per agen, jadi gunakan `openclaw migrate codex --dry-run` untuk menginventarisasi aset yang seharusnya dipromosikan secara sengaja.
- Doctor memperingatkan saat Skills yang diizinkan untuk agen default tidak tersedia di lingkungan runtime saat ini karena bin, variabel env, konfigurasi, atau persyaratan OS hilang. `doctor --fix` dapat menonaktifkan skills yang tidak tersedia tersebut dengan `skills.entries.<skill>.enabled=false`; pasang/konfigurasi persyaratan yang hilang sebagai gantinya saat Anda ingin skill tetap aktif.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, doctor melaporkan peringatan bernilai tinggi dengan remediasi (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola SecretRef dan tidak tersedia di jalur perintah saat ini, doctor melaporkan peringatan baca-saja dan tidak menulis kredensial fallback plaintext.
- Jika inspeksi SecretRef kanal gagal di jalur perbaikan, doctor melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Setelah migrasi direktori state, doctor memperingatkan saat akun Telegram atau Discord default yang diaktifkan bergantung pada fallback env dan `TELEGRAM_BOT_TOKEN` atau `DISCORD_BOT_TOKEN` tidak tersedia untuk proses doctor.
- Resolusi otomatis username `allowFrom` Telegram (`doctor --fix`) memerlukan token Telegram yang dapat diselesaikan di jalur perintah saat ini. Jika inspeksi token tidak tersedia, doctor melaporkan peringatan dan melewati resolusi otomatis untuk pass tersebut.

## macOS: override env `launchctl`

Jika sebelumnya Anda menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai tersebut menimpa file konfigurasi Anda dan dapat menyebabkan error “tidak diotorisasi” yang persisten.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor Gateway](/id/gateway/doctor)
