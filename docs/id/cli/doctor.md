---
read_when:
    - Anda mengalami masalah konektivitas/autentikasi dan menginginkan perbaikan terpandu
    - Anda telah memperbarui dan menginginkan pemeriksaan kewajaran
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:25:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e2c21765f8c287c8d2aa066004ac516566c76a455337c377cf282551619e92a
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Pemeriksaan kesehatan + perbaikan cepat untuk gateway dan channel.

Terkait:

- Pemecahan masalah: [Troubleshooting](/id/gateway/troubleshooting)
- Audit keamanan: [Security](/id/gateway/security)

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

- Prompt interaktif (seperti perbaikan keychain/OAuth) hanya berjalan saat stdin adalah TTY dan `--non-interactive` **tidak** diatur. Proses headless (Cron, Telegram, tanpa terminal) akan melewati prompt.
- Performa: proses `doctor` non-interaktif melewati pemuatan Plugin eager agar pemeriksaan kesehatan headless tetap cepat. Sesi interaktif tetap memuat Plugin sepenuhnya saat suatu pemeriksaan memerlukan kontribusinya.
- `--fix` (alias untuk `--repair`) menulis cadangan ke `~/.openclaw/openclaw.json.bak` dan menghapus kunci konfigurasi yang tidak dikenal, sambil mencantumkan setiap penghapusan.
- Pemeriksaan integritas status kini mendeteksi file transkrip yatim di direktori sesi dan dapat mengarsipkannya sebagai `.deleted.<timestamp>` untuk merebut kembali ruang dengan aman.
- Doctor juga memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk bentuk job Cron lama dan dapat menulis ulang secara langsung sebelum scheduler harus menormalisasinya secara otomatis saat runtime.
- Doctor memperbaiki dependensi runtime Plugin bawaan yang hilang tanpa menulis ke instalasi global terpaket. Untuk instalasi npm milik root atau unit systemd yang dikeraskan, atur `OPENCLAW_PLUGIN_STAGE_DIR` ke direktori yang dapat ditulisi seperti `/var/lib/openclaw/plugin-runtime-deps`.
- Atur `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor lain memiliki siklus hidup gateway. Doctor tetap melaporkan kesehatan gateway/layanan dan menerapkan perbaikan non-layanan, tetapi melewati instalasi/mulai ulang/bootstrap layanan dan pembersihan layanan lama.
- Doctor otomatis memigrasikan konfigurasi Talk datar lama (`talk.voiceId`, `talk.modelId`, dan semacamnya) ke `talk.provider` + `talk.providers.<provider>`.
- Proses `doctor --fix` berulang tidak lagi melaporkan/menerapkan normalisasi Talk ketika satu-satunya perbedaan hanyalah urutan kunci objek.
- Doctor menyertakan pemeriksaan kesiapan pencarian memori dan dapat merekomendasikan `openclaw configure --section model` ketika kredensial embedding tidak ada.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, doctor melaporkan peringatan dengan sinyal tinggi beserta perbaikannya (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola SecretRef dan tidak tersedia pada jalur perintah saat ini, doctor melaporkan peringatan hanya-baca dan tidak menulis kredensial fallback plaintext.
- Jika inspeksi SecretRef channel gagal dalam jalur perbaikan, doctor melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Resolusi otomatis username Telegram `allowFrom` (`doctor --fix`) memerlukan token Telegram yang dapat di-resolve pada jalur perintah saat ini. Jika inspeksi token tidak tersedia, doctor melaporkan peringatan dan melewati resolusi otomatis untuk proses tersebut.

## macOS: override env `launchctl`

Jika Anda sebelumnya menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai itu menimpa file konfigurasi Anda dan dapat menyebabkan error “unauthorized” yang menetap.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Terkait

- [Referensi CLI](/id/cli)
- [Gateway doctor](/id/gateway/doctor)
