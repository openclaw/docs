---
read_when:
    - Anda mengalami masalah konektivitas/autentikasi dan menginginkan perbaikan terpandu
    - Anda telah memperbarui dan ingin pemeriksaan cepat
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: Diagnostik
x-i18n:
    generated_at: "2026-05-06T17:53:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: eed73ecbec848ae3071448f2444735e2564680fee94cf1e22a73d1e7beaede80
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Pemeriksaan kesehatan + perbaikan cepat untuk Gateway dan saluran.

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
- `--deep`: pindai layanan sistem untuk pemasangan Gateway tambahan dan laporkan handoff restart supervisor Gateway terbaru

Catatan:

- Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), pemeriksaan doctor baca-saja tetap berfungsi, tetapi `doctor --fix`, `doctor --repair`, `doctor --yes`, dan `doctor --generate-gateway-token` dinonaktifkan karena `openclaw.json` tidak dapat diubah. Edit sumber Nix untuk pemasangan ini sebagai gantinya; untuk nix-openclaw, gunakan [Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen.
- Prompt interaktif (seperti perbaikan keychain/OAuth) hanya berjalan ketika stdin adalah TTY dan `--non-interactive` **tidak** disetel. Eksekusi tanpa kepala (cron, Telegram, tanpa terminal) akan melewati prompt.
- Performa: eksekusi `doctor` non-interaktif melewati pemuatan Plugin secara eager agar pemeriksaan kesehatan tanpa kepala tetap cepat. Sesi interaktif tetap memuat Plugin sepenuhnya ketika suatu pemeriksaan memerlukan kontribusinya.
- `--fix` (alias untuk `--repair`) menulis cadangan ke `~/.openclaw/openclaw.json.bak` dan menghapus kunci konfigurasi yang tidak dikenal, dengan mencantumkan setiap penghapusan.
- `doctor --fix --non-interactive` melaporkan definisi layanan Gateway yang hilang atau kedaluwarsa tetapi tidak memasang atau menulis ulang definisi tersebut di luar mode perbaikan pembaruan. Jalankan `openclaw gateway install` untuk layanan yang hilang, atau `openclaw gateway install --force` ketika Anda memang ingin mengganti launcher.
- Pemeriksaan integritas status kini mendeteksi file transkrip yatim di direktori sesi. Mengarsipkannya sebagai `.deleted.<timestamp>` memerlukan konfirmasi interaktif; `--fix`, `--yes`, dan eksekusi tanpa kepala membiarkannya tetap di tempat.
- Doctor juga memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk bentuk job cron lama dan dapat menulis ulang di tempat sebelum scheduler harus menormalkannya otomatis saat runtime.
- Di Linux, doctor memperingatkan ketika crontab pengguna masih menjalankan `~/.openclaw/bin/ensure-whatsapp.sh` lama; skrip itu tidak lagi dipelihara dan dapat mencatat pemadaman Gateway WhatsApp palsu ketika cron tidak memiliki lingkungan user-bus systemd.
- Ketika WhatsApp diaktifkan, doctor memeriksa event loop Gateway yang terdegradasi dengan klien `openclaw-tui` lokal yang masih berjalan. `doctor --fix` hanya menghentikan klien TUI lokal yang terverifikasi agar balasan WhatsApp tidak mengantre di belakang loop refresh TUI yang kedaluwarsa.
- Doctor menulis ulang referensi model lama `openai-codex/*` menjadi referensi kanonis `openai/*` di seluruh model utama, fallback, penggantian heartbeat/subagen/compaction, hook, penggantian model saluran, dan pin rute sesi kedaluwarsa. `--fix` memilih `agentRuntime.id: "codex"` hanya ketika Plugin Codex terpasang, aktif, menyumbangkan harness `codex`, dan memiliki OAuth yang dapat digunakan; jika tidak, opsi ini memilih `agentRuntime.id: "pi"` agar rute tetap pada runner default OpenClaw.
- Doctor membersihkan status staging dependensi Plugin lama yang dibuat oleh versi OpenClaw yang lebih lama. Doctor juga memperbaiki Plugin yang dapat diunduh tetapi hilang dan dirujuk oleh konfigurasi, seperti `plugins.entries`, saluran yang dikonfigurasi, pengaturan provider/pencarian yang dikonfigurasi, atau runtime agen yang dikonfigurasi. Selama pembaruan paket, doctor melewati perbaikan Plugin package-manager sampai penggantian paket selesai; jalankan ulang `openclaw doctor --fix` setelahnya jika Plugin yang dikonfigurasi masih memerlukan pemulihan. Jika unduhan gagal, doctor melaporkan kesalahan pemasangan dan mempertahankan entri Plugin yang dikonfigurasi untuk percobaan perbaikan berikutnya.
- Doctor memperbaiki konfigurasi Plugin kedaluwarsa dengan menghapus id Plugin yang hilang dari `plugins.allow`/`plugins.entries`, ditambah konfigurasi saluran yang menggantung, target heartbeat, dan penggantian model saluran yang cocok ketika penemuan Plugin sehat.
- Doctor mengarantina konfigurasi Plugin yang tidak valid dengan menonaktifkan entri `plugins.entries.<id>` yang terdampak dan menghapus payload `config` yang tidak valid. Startup Gateway sudah melewati hanya Plugin bermasalah tersebut sehingga Plugin dan saluran lain dapat tetap berjalan.
- Setel `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor lain memiliki siklus hidup Gateway. Doctor tetap melaporkan kesehatan Gateway/layanan dan menerapkan perbaikan non-layanan, tetapi melewati pemasangan/mulai/restart/bootstrap layanan dan pembersihan layanan lama.
- Di Linux, doctor mengabaikan unit systemd tambahan mirip Gateway yang tidak aktif dan tidak menulis ulang metadata perintah/entrypoint untuk layanan Gateway systemd yang sedang berjalan selama perbaikan. Hentikan layanan terlebih dahulu atau gunakan `openclaw gateway install --force` ketika Anda memang ingin mengganti launcher aktif.
- Doctor otomatis memigrasikan konfigurasi Talk datar lama (`talk.voiceId`, `talk.modelId`, dan teman-temannya) ke `talk.provider` + `talk.providers.<provider>`.
- Eksekusi berulang `doctor --fix` tidak lagi melaporkan/menerapkan normalisasi Talk ketika satu-satunya perbedaan adalah urutan kunci objek.
- Doctor menyertakan pemeriksaan kesiapan pencarian memori dan dapat merekomendasikan `openclaw configure --section model` ketika kredensial embedding hilang.
- Doctor memperingatkan ketika tidak ada pemilik perintah yang dikonfigurasi. Pemilik perintah adalah akun operator manusia yang diizinkan menjalankan perintah khusus pemilik dan menyetujui tindakan berbahaya. Pemasangan DM hanya memungkinkan seseorang berbicara dengan bot; jika Anda menyetujui pengirim sebelum bootstrap pemilik pertama ada, setel `commands.ownerAllowFrom` secara eksplisit.
- Doctor memperingatkan ketika agen mode Codex dikonfigurasi dan aset CLI Codex pribadi ada di home Codex operator. Peluncuran app-server Codex lokal menggunakan home per agen yang terisolasi, jadi gunakan `openclaw migrate codex --dry-run` untuk menginventarisasi aset yang sebaiknya dipromosikan secara sengaja.
- Doctor memperingatkan ketika skills yang diizinkan untuk agen default tidak tersedia di lingkungan runtime saat ini karena bin, env var, konfigurasi, atau persyaratan OS hilang. `doctor --fix` dapat menonaktifkan skills yang tidak tersedia tersebut dengan `skills.entries.<skill>.enabled=false`; pasang/konfigurasikan persyaratan yang hilang sebagai gantinya ketika Anda ingin menjaga skill tetap aktif.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, doctor melaporkan peringatan bernilai tinggi dengan remediasi (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika file registry sandbox lama (`~/.openclaw/sandbox/containers.json` atau `~/.openclaw/sandbox/browsers.json`) ada, doctor melaporkannya; `openclaw doctor --fix` memigrasikan entri valid ke direktori registry ber-shard dan mengarantina file lama yang tidak valid.
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola SecretRef dan tidak tersedia di jalur perintah saat ini, doctor melaporkan peringatan baca-saja dan tidak menulis kredensial fallback plaintext.
- Jika inspeksi SecretRef saluran gagal di jalur perbaikan, doctor melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Setelah migrasi direktori status, doctor memperingatkan ketika akun Telegram atau Discord default yang aktif bergantung pada fallback env dan `TELEGRAM_BOT_TOKEN` atau `DISCORD_BOT_TOKEN` tidak tersedia untuk proses doctor.
- Resolusi otomatis username `allowFrom` Telegram (`doctor --fix`) memerlukan token Telegram yang dapat diresolusikan di jalur perintah saat ini. Jika inspeksi token tidak tersedia, doctor melaporkan peringatan dan melewati resolusi otomatis untuk lintasan tersebut.

## macOS: override env `launchctl`

Jika sebelumnya Anda menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai tersebut menimpa file konfigurasi Anda dan dapat menyebabkan kesalahan "unauthorized" yang persisten.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor Gateway](/id/gateway/doctor)
