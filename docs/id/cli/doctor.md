---
read_when:
    - Anda mengalami masalah konektivitas/autentikasi dan menginginkan perbaikan terpandu
    - Anda melakukan pembaruan dan ingin pemeriksaan kewajaran
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: Diagnostik
x-i18n:
    generated_at: "2026-05-11T20:25:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f2dd99f339e4fcdeeae840b75098f3c251b3aa133b7ea11b040b3c7f32c200
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

Untuk izin khusus saluran, gunakan probe saluran, bukan `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Probe kapabilitas Discord yang ditargetkan melaporkan izin saluran efektif milik bot; probe status mengaudit saluran Discord yang dikonfigurasi dan target auto-join suara.

## Opsi

- `--no-workspace-suggestions`: nonaktifkan saran memori/pencarian ruang kerja
- `--yes`: terima default tanpa meminta konfirmasi
- `--repair`: terapkan perbaikan non-layanan yang direkomendasikan tanpa meminta konfirmasi; pemasangan dan penulisan ulang layanan Gateway tetap memerlukan konfirmasi interaktif atau perintah Gateway eksplisit
- `--fix`: alias untuk `--repair`
- `--force`: terapkan perbaikan agresif, termasuk menimpa konfigurasi layanan khusus bila diperlukan
- `--non-interactive`: jalankan tanpa prompt; hanya migrasi aman dan perbaikan non-layanan
- `--generate-gateway-token`: hasilkan dan konfigurasikan token Gateway
- `--deep`: pindai layanan sistem untuk pemasangan Gateway tambahan dan laporkan handoff restart supervisor Gateway terbaru

Catatan:

- Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), pemeriksaan doctor hanya-baca tetap berfungsi, tetapi `doctor --fix`, `doctor --repair`, `doctor --yes`, dan `doctor --generate-gateway-token` dinonaktifkan karena `openclaw.json` tidak dapat diubah. Edit sumber Nix untuk pemasangan ini sebagai gantinya; untuk nix-openclaw, gunakan [Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen.
- Prompt interaktif (seperti perbaikan keychain/OAuth) hanya berjalan saat stdin adalah TTY dan `--non-interactive` **tidak** disetel. Eksekusi headless (cron, Telegram, tanpa terminal) akan melewati prompt.
- Performa: eksekusi `doctor` non-interaktif melewati pemuatan plugin secara eager agar pemeriksaan kesehatan headless tetap cepat. Sesi interaktif tetap memuat plugin sepenuhnya saat pemeriksaan membutuhkan kontribusinya.
- `--fix` (alias untuk `--repair`) menulis cadangan ke `~/.openclaw/openclaw.json.bak` dan menghapus kunci konfigurasi yang tidak dikenal, dengan mencantumkan setiap penghapusan.
- `doctor --fix --non-interactive` melaporkan definisi layanan Gateway yang hilang atau usang, tetapi tidak memasang atau menulis ulang definisi tersebut di luar mode perbaikan pembaruan. Jalankan `openclaw gateway install` untuk layanan yang hilang, atau `openclaw gateway install --force` saat Anda memang ingin mengganti launcher.
- Pemeriksaan integritas status kini mendeteksi file transkrip yatim di direktori sesi. Mengarsipkannya sebagai `.deleted.<timestamp>` memerlukan konfirmasi interaktif; `--fix`, `--yes`, dan eksekusi headless membiarkannya tetap di tempat.
- Doctor juga memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk bentuk job cron lama dan dapat menulis ulang di tempat sebelum scheduler harus menormalisasinya otomatis saat runtime.
- Di Linux, doctor memperingatkan saat crontab pengguna masih menjalankan `~/.openclaw/bin/ensure-whatsapp.sh` lama; skrip itu tidak lagi dipelihara dan dapat mencatat outage Gateway WhatsApp palsu saat cron tidak memiliki lingkungan systemd user-bus.
- Saat WhatsApp diaktifkan, doctor memeriksa event loop Gateway yang terdegradasi dengan klien `openclaw-tui` lokal yang masih berjalan. `doctor --fix` hanya menghentikan klien TUI lokal yang terverifikasi agar balasan WhatsApp tidak mengantre di belakang loop refresh TUI yang usang.
- Doctor menulis ulang ref model `openai-codex/*` lama menjadi ref `openai/*` kanonis di seluruh model utama, fallback, override heartbeat/subagen/compaction, hook, override model saluran, dan pin rute sesi yang usang. `--fix` memindahkan niat Codex ke entri `agentRuntime.id: "codex"` yang memiliki cakupan provider/model, mempertahankan pin profil auth sesi seperti `openai-codex:...`, menghapus pin runtime seluruh agen/sesi yang usang, dan menjaga ref agen OpenAI yang diperbaiki tetap pada routing auth Codex, bukan auth kunci API OpenAI langsung.
- Doctor membersihkan status staging dependensi plugin lama yang dibuat oleh versi OpenClaw lebih lama. Ia juga memperbaiki Plugin yang dapat diunduh yang hilang dan dirujuk oleh konfigurasi, seperti `plugins.entries`, saluran yang dikonfigurasi, pengaturan provider/pencarian yang dikonfigurasi, atau runtime agen yang dikonfigurasi. Selama pembaruan paket, doctor melewati perbaikan Plugin manajer paket sampai pertukaran paket selesai; jalankan ulang `openclaw doctor --fix` setelahnya jika Plugin yang dikonfigurasi masih perlu dipulihkan. Jika pengunduhan gagal, doctor melaporkan kesalahan pemasangan dan mempertahankan entri Plugin yang dikonfigurasi untuk percobaan perbaikan berikutnya.
- Doctor memperbaiki konfigurasi Plugin usang dengan menghapus id Plugin yang hilang dari `plugins.allow`/`plugins.deny`/`plugins.entries`, ditambah konfigurasi saluran menggantung, target Heartbeat, dan override model saluran yang cocok saat penemuan Plugin sehat.
- Doctor mengarantina konfigurasi Plugin yang tidak valid dengan menonaktifkan entri `plugins.entries.<id>` yang terdampak dan menghapus payload `config` yang tidak valid. Startup Gateway sudah hanya melewati Plugin bermasalah tersebut agar Plugin dan saluran lain tetap dapat berjalan.
- Setel `OPENCLAW_SERVICE_REPAIR_POLICY=external` saat supervisor lain memiliki siklus hidup Gateway. Doctor tetap melaporkan kesehatan Gateway/layanan dan menerapkan perbaikan non-layanan, tetapi melewati pemasangan/start/restart/bootstrap layanan dan pembersihan layanan lama.
- Di Linux, doctor mengabaikan unit systemd mirip Gateway tambahan yang tidak aktif dan tidak menulis ulang metadata command/entrypoint untuk layanan Gateway systemd yang sedang berjalan selama perbaikan. Hentikan layanan terlebih dahulu atau gunakan `openclaw gateway install --force` saat Anda memang ingin mengganti launcher aktif.
- Doctor otomatis memigrasikan konfigurasi Talk flat lama (`talk.voiceId`, `talk.modelId`, dan sejenisnya) ke `talk.provider` + `talk.providers.<provider>`.
- Eksekusi `doctor --fix` berulang tidak lagi melaporkan/menerapkan normalisasi Talk saat satu-satunya perbedaan adalah urutan kunci objek.
- Doctor menyertakan pemeriksaan kesiapan pencarian memori dan dapat merekomendasikan `openclaw configure --section model` saat kredensial embedding hilang.
- Doctor memperingatkan saat tidak ada pemilik perintah yang dikonfigurasi. Pemilik perintah adalah akun operator manusia yang diizinkan menjalankan perintah khusus pemilik dan menyetujui tindakan berbahaya. Pairing DM hanya mengizinkan seseorang berbicara dengan bot; jika Anda menyetujui pengirim sebelum bootstrap pemilik pertama ada, setel `commands.ownerAllowFrom` secara eksplisit.
- Doctor memperingatkan saat agen mode Codex dikonfigurasi dan aset CLI Codex pribadi ada di home Codex milik operator. Peluncuran app-server Codex lokal menggunakan home per agen yang terisolasi, jadi gunakan `openclaw migrate codex --dry-run` untuk menginventarisasi aset yang seharusnya dipromosikan secara sengaja.
- Doctor menghapus `plugins.entries.codex.config.codexDynamicToolsProfile` yang sudah dipensiunkan; app-server Codex selalu menjaga alat workspace native Codex tetap native.
- Doctor memperingatkan saat Skills yang diizinkan untuk agen default tidak tersedia di lingkungan runtime saat ini karena bin, env var, konfigurasi, atau persyaratan OS hilang. `doctor --fix` dapat menonaktifkan Skills yang tidak tersedia tersebut dengan `skills.entries.<skill>.enabled=false`; pasang/konfigurasikan persyaratan yang hilang sebagai gantinya saat Anda ingin mempertahankan skill tetap aktif.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, doctor melaporkan peringatan bernilai sinyal tinggi dengan remediasi (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika file registri sandbox lama (`~/.openclaw/sandbox/containers.json` atau `~/.openclaw/sandbox/browsers.json`) ada, doctor melaporkannya; `openclaw doctor --fix` memigrasikan entri valid ke direktori registri ber-shard dan mengarantina file lama yang tidak valid.
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola SecretRef dan tidak tersedia di jalur perintah saat ini, doctor melaporkan peringatan hanya-baca dan tidak menulis kredensial fallback plaintext.
- Jika inspeksi SecretRef saluran gagal di jalur perbaikan, doctor melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Setelah migrasi direktori status, doctor memperingatkan saat akun Telegram atau Discord default yang diaktifkan bergantung pada fallback env dan `TELEGRAM_BOT_TOKEN` atau `DISCORD_BOT_TOKEN` tidak tersedia bagi proses doctor.
- Resolusi otomatis username `allowFrom` Telegram (`doctor --fix`) memerlukan token Telegram yang dapat di-resolve di jalur perintah saat ini. Jika inspeksi token tidak tersedia, doctor melaporkan peringatan dan melewati resolusi otomatis untuk lintasan tersebut.

## macOS: override env `launchctl`

Jika sebelumnya Anda menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai tersebut mengesampingkan file konfigurasi Anda dan dapat menyebabkan kesalahan "unauthorized" yang persisten.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Terkait

- [Referensi CLI](/id/cli)
- [Gateway doctor](/id/gateway/doctor)
