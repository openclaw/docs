---
read_when:
    - Anda mengalami masalah konektivitas/autentikasi dan menginginkan perbaikan terpandu
    - Anda baru melakukan pembaruan dan ingin pemeriksaan kewarasan
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: Doctor
x-i18n:
    generated_at: "2026-04-24T09:01:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ea3f4992effe3d417f20427b3bdb9e47712816106b03bc27a415571cf88a7c
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Pemeriksaan kesehatan + perbaikan cepat untuk Gateway dan channel.

Terkait:

- Pemecahan masalah: [Troubleshooting](/id/gateway/troubleshooting)
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
- `--repair`: terapkan perbaikan yang direkomendasikan tanpa prompt
- `--fix`: alias untuk `--repair`
- `--force`: terapkan perbaikan agresif, termasuk menimpa konfigurasi layanan kustom bila diperlukan
- `--non-interactive`: jalankan tanpa prompt; hanya migrasi aman
- `--generate-gateway-token`: buat dan konfigurasikan token Gateway
- `--deep`: pindai layanan sistem untuk instalasi Gateway tambahan

Catatan:

- Prompt interaktif (seperti perbaikan keychain/OAuth) hanya berjalan saat stdin adalah TTY dan `--non-interactive` **tidak** disetel. Eksekusi headless (Cron, Telegram, tanpa terminal) akan melewati prompt.
- Performa: eksekusi `doctor` non-interaktif melewati pemuatan Plugin eager agar pemeriksaan kesehatan headless tetap cepat. Sesi interaktif tetap memuat Plugin sepenuhnya saat sebuah pemeriksaan memerlukan kontribusinya.
- `--fix` (alias untuk `--repair`) menulis cadangan ke `~/.openclaw/openclaw.json.bak` dan membuang kunci konfigurasi yang tidak dikenal, sambil mencantumkan setiap penghapusan.
- Pemeriksaan integritas status kini mendeteksi file transkrip yatim di direktori sesi dan dapat mengarsipkannya sebagai `.deleted.<timestamp>` untuk merebut kembali ruang dengan aman.
- Doctor juga memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk bentuk Cron job lama dan dapat menulis ulangnya di tempat sebelum scheduler perlu melakukan normalisasi otomatis saat runtime.
- Doctor memperbaiki dependensi runtime Plugin bawaan yang hilang tanpa memerlukan akses tulis ke paket OpenClaw yang terinstal. Untuk instalasi npm milik root atau unit systemd yang dikeraskan, setel `OPENCLAW_PLUGIN_STAGE_DIR` ke direktori yang dapat ditulisi seperti `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor otomatis memigrasikan konfigurasi Talk datar lama (`talk.voiceId`, `talk.modelId`, dan sejenisnya) ke `talk.provider` + `talk.providers.<provider>`.
- Eksekusi berulang `doctor --fix` tidak lagi melaporkan/menerapkan normalisasi Talk ketika satu-satunya perbedaan hanyalah urutan kunci objek.
- Doctor menyertakan pemeriksaan kesiapan memory-search dan dapat merekomendasikan `openclaw configure --section model` saat kredensial embedding tidak ada.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, doctor melaporkan peringatan bersinyal tinggi dengan remediasi (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola SecretRef dan tidak tersedia dalam jalur perintah saat ini, doctor melaporkan peringatan read-only dan tidak menulis kredensial fallback plaintext.
- Jika inspeksi SecretRef channel gagal dalam jalur perbaikan, doctor tetap melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Auto-resolution username `allowFrom` Telegram (`doctor --fix`) memerlukan token Telegram yang dapat di-resolve dalam jalur perintah saat ini. Jika inspeksi token tidak tersedia, doctor melaporkan peringatan dan melewati auto-resolution untuk eksekusi tersebut.

## macOS: override env `launchctl`

Jika sebelumnya Anda menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai tersebut menimpa file konfigurasi Anda dan dapat menyebabkan error “unauthorized” yang persisten.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Terkait

- [Referensi CLI](/id/cli)
- [Gateway doctor](/id/gateway/doctor)
