---
read_when:
    - Anda mengalami masalah konektivitas/autentikasi dan menginginkan perbaikan terpandu
    - Anda baru melakukan pembaruan dan menginginkan pemeriksaan kewarasan
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: doctor
x-i18n:
    generated_at: "2026-04-05T13:45:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: d257a9e2797b4b0b50c1020165c8a1cd6a2342381bf9c351645ca37494c881e1
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Pemeriksaan kesehatan + perbaikan cepat untuk gateway dan channel.

Terkait:

- Pemecahan masalah: [Troubleshooting](/gateway/troubleshooting)
- Audit keamanan: [Security](/gateway/security)

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
- `--generate-gateway-token`: hasilkan dan konfigurasikan token gateway
- `--deep`: pindai layanan sistem untuk instalasi gateway tambahan

Catatan:

- Prompt interaktif (seperti perbaikan keychain/OAuth) hanya berjalan saat stdin adalah TTY dan `--non-interactive` **tidak** disetel. Eksekusi headless (cron, Telegram, tanpa terminal) akan melewati prompt.
- `--fix` (alias untuk `--repair`) menulis cadangan ke `~/.openclaw/openclaw.json.bak` dan menghapus kunci konfigurasi yang tidak dikenal, sambil mencantumkan setiap penghapusan.
- Pemeriksaan integritas status kini mendeteksi file transkrip yatim di direktori sesi dan dapat mengarsipkannya sebagai `.deleted.<timestamp>` untuk merebut kembali ruang dengan aman.
- Doctor juga memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk bentuk cron job lama dan dapat menulis ulangnya di tempat sebelum scheduler harus menormalkannya otomatis saat runtime.
- Doctor memigrasikan konfigurasi Talk datar lama (`talk.voiceId`, `talk.modelId`, dan sejenisnya) secara otomatis ke `talk.provider` + `talk.providers.<provider>`.
- Eksekusi berulang `doctor --fix` tidak lagi melaporkan/menerapkan normalisasi Talk saat satu-satunya perbedaan hanyalah urutan kunci objek.
- Doctor menyertakan pemeriksaan kesiapan memory-search dan dapat merekomendasikan `openclaw configure --section model` saat kredensial embedding tidak ada.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, doctor melaporkan peringatan bernilai sinyal tinggi dengan remediasi (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola SecretRef dan tidak tersedia dalam jalur perintah saat ini, doctor melaporkan peringatan read-only dan tidak menulis kredensial fallback plaintext.
- Jika inspeksi SecretRef channel gagal dalam jalur perbaikan, doctor tetap melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Resolusi otomatis username `allowFrom` Telegram (`doctor --fix`) memerlukan token Telegram yang dapat di-resolve dalam jalur perintah saat ini. Jika inspeksi token tidak tersedia, doctor melaporkan peringatan dan melewati resolusi otomatis untuk eksekusi tersebut.

## macOS: override env `launchctl`

Jika Anda sebelumnya menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai tersebut akan menimpa file konfigurasi Anda dan dapat menyebabkan kesalahan “unauthorized” yang persisten.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
