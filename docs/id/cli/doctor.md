---
read_when:
    - Anda mengalami masalah konektivitas/autentikasi dan menginginkan perbaikan terpandu
    - Anda telah memperbarui dan ingin pemeriksaan kewajaran
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: Dokter
x-i18n:
    generated_at: "2026-05-05T08:25:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6101008d1cb7e08f9902a8a29785710f325966524b003b87b5c628fe906ab78
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
- `--force`: terapkan perbaikan agresif, termasuk menimpa konfigurasi layanan khusus jika diperlukan
- `--non-interactive`: jalankan tanpa prompt; hanya migrasi aman dan perbaikan non-layanan
- `--generate-gateway-token`: buat dan konfigurasi token Gateway
- `--deep`: pindai layanan sistem untuk pemasangan Gateway tambahan dan laporkan handoff restart supervisor Gateway terbaru

Catatan:

- Prompt interaktif (seperti perbaikan keychain/OAuth) hanya berjalan ketika stdin adalah TTY dan `--non-interactive` **tidak** disetel. Eksekusi headless (cron, Telegram, tanpa terminal) akan melewati prompt.
- Performa: eksekusi `doctor` non-interaktif melewati pemuatan plugin secara eager agar pemeriksaan kesehatan headless tetap cepat. Sesi interaktif tetap memuat plugin sepenuhnya ketika sebuah pemeriksaan membutuhkan kontribusinya.
- `--fix` (alias untuk `--repair`) menulis cadangan ke `~/.openclaw/openclaw.json.bak` dan menghapus kunci konfigurasi yang tidak dikenal, dengan mencantumkan setiap penghapusan.
- `doctor --fix --non-interactive` melaporkan definisi layanan Gateway yang hilang atau usang, tetapi tidak memasang atau menulis ulang definisi tersebut di luar mode perbaikan pembaruan. Jalankan `openclaw gateway install` untuk layanan yang hilang, atau `openclaw gateway install --force` ketika Anda memang ingin mengganti launcher.
- Pemeriksaan integritas status kini mendeteksi file transkrip yatim di direktori sesi. Mengarsipkannya sebagai `.deleted.<timestamp>` memerlukan konfirmasi interaktif; `--fix`, `--yes`, dan eksekusi headless membiarkannya tetap di tempat.
- Doctor juga memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk bentuk tugas Cron lama dan dapat menulis ulang di tempat sebelum scheduler harus melakukan normalisasi otomatis saat runtime.
- Di Linux, doctor memperingatkan ketika crontab pengguna masih menjalankan `~/.openclaw/bin/ensure-whatsapp.sh` lama; skrip tersebut tidak lagi dipelihara dan dapat mencatat gangguan Gateway WhatsApp palsu ketika Cron tidak memiliki lingkungan systemd user-bus.
- Ketika WhatsApp diaktifkan, doctor memeriksa loop peristiwa Gateway yang terdegradasi dengan klien `openclaw-tui` lokal yang masih berjalan. `doctor --fix` hanya menghentikan klien TUI lokal yang terverifikasi agar balasan WhatsApp tidak mengantre di belakang loop refresh TUI yang usang.
- Doctor membersihkan status staging dependensi plugin lama yang dibuat oleh versi OpenClaw yang lebih lama. Doctor juga memperbaiki plugin unduhan yang hilang yang dirujuk oleh konfigurasi, seperti `plugins.entries`, channel yang dikonfigurasi, pengaturan provider/pencarian yang dikonfigurasi, atau runtime agent yang dikonfigurasi. Selama pembaruan paket, doctor melewati perbaikan plugin package-manager hingga penggantian paket selesai; jalankan ulang `openclaw doctor --fix` setelahnya jika plugin yang dikonfigurasi masih membutuhkan pemulihan. Jika unduhan gagal, doctor melaporkan galat pemasangan dan mempertahankan entri plugin yang dikonfigurasi untuk upaya perbaikan berikutnya.
- Doctor memperbaiki konfigurasi plugin usang dengan menghapus id plugin yang hilang dari `plugins.allow`/`plugins.entries`, plus konfigurasi channel menggantung yang cocok, target Heartbeat, dan override model channel ketika penemuan plugin sehat.
- Doctor mengarantina konfigurasi plugin yang tidak valid dengan menonaktifkan entri `plugins.entries.<id>` yang terdampak dan menghapus payload `config` yang tidak valid. Startup Gateway memang sudah melewati hanya plugin bermasalah tersebut sehingga plugin dan channel lain dapat terus berjalan.
- Setel `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor lain memiliki siklus hidup Gateway. Doctor tetap melaporkan kesehatan Gateway/layanan dan menerapkan perbaikan non-layanan, tetapi melewati pemasangan/start/restart/bootstrap layanan dan pembersihan layanan lama.
- Di Linux, doctor mengabaikan unit systemd tambahan mirip Gateway yang tidak aktif dan tidak menulis ulang metadata perintah/entrypoint untuk layanan Gateway systemd yang sedang berjalan selama perbaikan. Hentikan layanan terlebih dahulu atau gunakan `openclaw gateway install --force` ketika Anda memang ingin mengganti launcher aktif.
- Doctor memigrasikan otomatis konfigurasi Talk datar lama (`talk.voiceId`, `talk.modelId`, dan sejenisnya) ke `talk.provider` + `talk.providers.<provider>`.
- Eksekusi `doctor --fix` berulang tidak lagi melaporkan/menerapkan normalisasi Talk ketika satu-satunya perbedaan adalah urutan kunci objek.
- Doctor menyertakan pemeriksaan kesiapan pencarian memori dan dapat merekomendasikan `openclaw configure --section model` ketika kredensial embedding hilang.
- Doctor memperingatkan ketika tidak ada pemilik perintah yang dikonfigurasi. Pemilik perintah adalah akun operator manusia yang diizinkan menjalankan perintah khusus pemilik dan menyetujui tindakan berbahaya. Pairing DM hanya memungkinkan seseorang berbicara dengan bot; jika Anda menyetujui pengirim sebelum bootstrap pemilik pertama ada, setel `commands.ownerAllowFrom` secara eksplisit.
- Doctor memperingatkan ketika agent mode Codex dikonfigurasi dan aset Codex CLI pribadi ada di home Codex operator. Peluncuran app-server Codex lokal menggunakan home terisolasi per agent, jadi gunakan `openclaw migrate codex --dry-run` untuk menginventarisasi aset yang harus dipromosikan secara sengaja.
- Doctor memperingatkan ketika Skills yang diizinkan untuk agent default tidak tersedia di lingkungan runtime saat ini karena bin, env vars, konfigurasi, atau persyaratan OS hilang. `doctor --fix` dapat menonaktifkan skill yang tidak tersedia tersebut dengan `skills.entries.<skill>.enabled=false`; pasang/konfigurasi persyaratan yang hilang sebagai gantinya ketika Anda ingin mempertahankan skill tetap aktif.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, doctor melaporkan peringatan bernilai tinggi dengan remediasi (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika file registry sandbox lama (`~/.openclaw/sandbox/containers.json` atau `~/.openclaw/sandbox/browsers.json`) ada, doctor melaporkannya; `openclaw doctor --fix` memigrasikan entri valid ke direktori registry sharded dan mengarantina file lama yang tidak valid.
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola SecretRef dan tidak tersedia di jalur perintah saat ini, doctor melaporkan peringatan baca-saja dan tidak menulis kredensial fallback plaintext.
- Jika inspeksi SecretRef channel gagal di jalur perbaikan, doctor melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Setelah migrasi direktori status, doctor memperingatkan ketika akun Telegram atau Discord default yang diaktifkan bergantung pada fallback env dan `TELEGRAM_BOT_TOKEN` atau `DISCORD_BOT_TOKEN` tidak tersedia untuk proses doctor.
- Resolusi otomatis username `allowFrom` Telegram (`doctor --fix`) memerlukan token Telegram yang dapat di-resolve di jalur perintah saat ini. Jika inspeksi token tidak tersedia, doctor melaporkan peringatan dan melewati resolusi otomatis untuk pass tersebut.

## macOS: override env `launchctl`

Jika sebelumnya Anda menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai tersebut menimpa file konfigurasi Anda dan dapat menyebabkan galat “unauthorized” yang persisten.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Terkait

- [Referensi CLI](/id/cli)
- [Gateway doctor](/id/gateway/doctor)
