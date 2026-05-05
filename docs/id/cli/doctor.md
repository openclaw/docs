---
read_when:
    - Anda mengalami masalah konektivitas/autentikasi dan menginginkan perbaikan terpandu
    - Anda telah memperbarui dan ingin pemeriksaan kewajaran
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: Dokter
x-i18n:
    generated_at: "2026-05-05T01:44:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 079d7674ae2a259a0430e30e7577ac532135ad5461c57c4b3a6514a007bc9ea5
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Pemeriksaan kesehatan + perbaikan cepat untuk Gateway dan saluran.

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

- Prompt interaktif (seperti perbaikan keychain/OAuth) hanya berjalan saat stdin adalah TTY dan `--non-interactive` **tidak** disetel. Proses tanpa antarmuka (cron, Telegram, tanpa terminal) akan melewati prompt.
- Performa: proses `doctor` non-interaktif melewati pemuatan Plugin secara eager agar pemeriksaan kesehatan tanpa antarmuka tetap cepat. Sesi interaktif tetap memuat Plugin sepenuhnya saat suatu pemeriksaan membutuhkan kontribusinya.
- `--fix` (alias untuk `--repair`) menulis cadangan ke `~/.openclaw/openclaw.json.bak` dan membuang kunci konfigurasi yang tidak dikenal, dengan mencantumkan setiap penghapusan.
- `doctor --fix --non-interactive` melaporkan definisi layanan Gateway yang hilang atau kedaluwarsa tetapi tidak memasang atau menulis ulang definisi tersebut di luar mode perbaikan pembaruan. Jalankan `openclaw gateway install` untuk layanan yang hilang, atau `openclaw gateway install --force` saat Anda memang ingin mengganti launcher.
- Pemeriksaan integritas state sekarang mendeteksi file transkrip yatim piatu di direktori sesi. Mengarsipkannya sebagai `.deleted.<timestamp>` memerlukan konfirmasi interaktif; `--fix`, `--yes`, dan proses tanpa antarmuka membiarkannya tetap ada.
- Doctor juga memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk bentuk job Cron lama dan dapat menulis ulang di tempat sebelum scheduler harus menormalisasinya otomatis saat runtime.
- Di Linux, doctor memperingatkan saat crontab pengguna masih menjalankan `~/.openclaw/bin/ensure-whatsapp.sh` lama; skrip itu tidak lagi dipelihara dan dapat mencatat gangguan Gateway WhatsApp palsu saat cron tidak memiliki lingkungan systemd user-bus.
- Doctor membersihkan state staging dependensi Plugin lama yang dibuat oleh versi OpenClaw yang lebih lama. Doctor juga memperbaiki Plugin unduhan yang hilang dan direferensikan oleh konfigurasi, seperti `plugins.entries`, saluran terkonfigurasi, pengaturan provider/pencarian terkonfigurasi, atau runtime agen terkonfigurasi. Selama pembaruan paket, doctor melewati perbaikan Plugin package-manager sampai penukaran paket selesai; jalankan ulang `openclaw doctor --fix` setelahnya jika Plugin terkonfigurasi masih perlu dipulihkan. Jika unduhan gagal, doctor melaporkan kesalahan pemasangan dan mempertahankan entri Plugin terkonfigurasi untuk percobaan perbaikan berikutnya.
- Doctor memperbaiki konfigurasi Plugin kedaluwarsa dengan menghapus id Plugin yang hilang dari `plugins.allow`/`plugins.entries`, serta konfigurasi saluran menggantung yang cocok, target Heartbeat, dan override model saluran saat penemuan Plugin sehat.
- Doctor mengarantina konfigurasi Plugin yang tidak valid dengan menonaktifkan entri `plugins.entries.<id>` yang terdampak dan menghapus payload `config` yang tidak valid. Startup Gateway sudah melewati hanya Plugin bermasalah itu sehingga Plugin dan saluran lain dapat tetap berjalan.
- Setel `OPENCLAW_SERVICE_REPAIR_POLICY=external` saat supervisor lain memiliki siklus hidup Gateway. Doctor tetap melaporkan kesehatan Gateway/layanan dan menerapkan perbaikan non-layanan, tetapi melewati pemasangan/mulai/mulai ulang/bootstrap layanan dan pembersihan layanan lama.
- Di Linux, doctor mengabaikan unit systemd tambahan mirip Gateway yang tidak aktif dan tidak menulis ulang metadata perintah/entrypoint untuk layanan Gateway systemd yang sedang berjalan selama perbaikan. Hentikan layanan terlebih dahulu atau gunakan `openclaw gateway install --force` saat Anda memang ingin mengganti launcher aktif.
- Doctor memigrasikan otomatis konfigurasi Talk datar lama (`talk.voiceId`, `talk.modelId`, dan lainnya) ke `talk.provider` + `talk.providers.<provider>`.
- Proses `doctor --fix` berulang tidak lagi melaporkan/menerapkan normalisasi Talk saat satu-satunya perbedaan adalah urutan kunci objek.
- Doctor menyertakan pemeriksaan kesiapan pencarian memori dan dapat merekomendasikan `openclaw configure --section model` saat kredensial embedding hilang.
- Doctor memperingatkan saat tidak ada pemilik perintah yang dikonfigurasi. Pemilik perintah adalah akun operator manusia yang diizinkan menjalankan perintah khusus pemilik dan menyetujui tindakan berbahaya. Pairing DM hanya memungkinkan seseorang berbicara dengan bot; jika Anda menyetujui pengirim sebelum bootstrap pemilik pertama ada, setel `commands.ownerAllowFrom` secara eksplisit.
- Doctor memperingatkan saat agen mode Codex dikonfigurasi dan aset Codex CLI pribadi ada di home Codex milik operator. Peluncuran app-server Codex lokal menggunakan home per agen yang terisolasi, jadi gunakan `openclaw migrate codex --dry-run` untuk menginventarisasi aset yang harus dipromosikan secara sengaja.
- Doctor memperingatkan saat skills yang diizinkan untuk agen default tidak tersedia di lingkungan runtime saat ini karena bin, variabel env, konfigurasi, atau persyaratan OS hilang. `doctor --fix` dapat menonaktifkan skills yang tidak tersedia tersebut dengan `skills.entries.<skill>.enabled=false`; pasang/konfigurasikan persyaratan yang hilang sebagai gantinya saat Anda ingin skill tetap aktif.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, doctor melaporkan peringatan bersinyal tinggi dengan remediasi (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika file registri sandbox lama (`~/.openclaw/sandbox/containers.json` atau `~/.openclaw/sandbox/browsers.json`) ada, doctor melaporkannya; `openclaw doctor --fix` memigrasikan entri valid ke direktori registri tersharding dan mengarantina file lama yang tidak valid.
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola SecretRef dan tidak tersedia di jalur perintah saat ini, doctor melaporkan peringatan baca-saja dan tidak menulis kredensial fallback plaintext.
- Jika inspeksi SecretRef saluran gagal di jalur perbaikan, doctor melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Setelah migrasi direktori state, doctor memperingatkan saat akun default Telegram atau Discord yang diaktifkan bergantung pada fallback env dan `TELEGRAM_BOT_TOKEN` atau `DISCORD_BOT_TOKEN` tidak tersedia bagi proses doctor.
- Resolusi otomatis username `allowFrom` Telegram (`doctor --fix`) memerlukan token Telegram yang dapat di-resolve di jalur perintah saat ini. Jika inspeksi token tidak tersedia, doctor melaporkan peringatan dan melewati resolusi otomatis untuk proses tersebut.

## macOS: override env `launchctl`

Jika sebelumnya Anda menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai tersebut menimpa file konfigurasi Anda dan dapat menyebabkan kesalahan “tidak terotorisasi” yang persisten.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor Gateway](/id/gateway/doctor)
