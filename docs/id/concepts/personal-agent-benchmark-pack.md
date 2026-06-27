---
read_when:
    - Menjalankan pemeriksaan keandalan agen pribadi lokal
    - Memperluas katalog skenario QA berbasis repo
    - Memverifikasi pengingat, balasan, memori, redaksi, tindak lanjut alat yang aman, status tugas, diagnostik yang aman dibagikan, klaim penyelesaian yang didukung bukti, dan pemulihan kegagalan
summary: Skenario qa-channel lokal untuk pemeriksaan alur kerja asisten pribadi yang menjaga privasi.
title: Paket benchmark agen pribadi
x-i18n:
    generated_at: "2026-06-27T17:25:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5a6b653abbba0718a6287d4e471435f15ef5823aa62abd238a14d955fdc1e5a
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Paket Tolok Ukur Agen Pribadi adalah paket skenario QA kecil yang didukung repo untuk
alur kerja asisten pribadi lokal. Ini bukan tolok ukur model generik dan
tidak memerlukan runner baru. Paket ini menggunakan kembali stack QA privat yang dijelaskan dalam
[ikhtisar QA](/id/concepts/qa-e2e-automation), [saluran QA](/id/channels/qa-channel)
sintetis, dan katalog YAML `qa/scenarios` yang sudah ada.

Paket pertama sengaja dibuat sempit:

- pengingat pribadi palsu melalui pengiriman cron lokal
- perutean DM dan balasan thread palsu melalui `qa-channel`
- pemanggilan kembali preferensi palsu dari file memori workspace QA sementara
- pemeriksaan no-echo rahasia palsu
- tindak lanjut alat yang aman dan didukung pembacaan setelah giliran singkat bergaya persetujuan
- perilaku berhenti saat penolakan persetujuan untuk permintaan baca lokal yang sensitif
- pelaporan status tugas berbasis bukti yang menjaga pending, diblokir, dan selesai tetap terpisah
- artefak diagnostik yang aman dibagikan, yang mempertahankan status berguna sambil menghilangkan konten pribadi mentah
- klaim penyelesaian berbasis bukti yang menghindari progres palsu sebelum ada bukti lokal
- pemulihan kegagalan yang melaporkan status parsial dan menjaga batas percobaan ulang tetap jelas

## Skenario

Metadata paket yang dapat dibaca mesin berada di
`extensions/qa-lab/src/scenario-packs.ts`. Jalankan paket dengan
`--pack personal-agent`:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` bersifat aditif dengan flag `--scenario` yang diulang. Skenario eksplisit dijalankan
terlebih dahulu, lalu skenario paket dijalankan dalam urutan `QA_PERSONAL_AGENT_SCENARIO_IDS` dengan
duplikat dihapus.

Paket ini dirancang untuk `qa-channel` dengan `mock-openai` atau jalur penyedia QA lokal lainnya.
Paket ini tidak boleh diarahkan ke layanan chat live atau akun pribadi sungguhan.

## Model Privasi

Skenario hanya menggunakan pengguna palsu, preferensi palsu, rahasia palsu, dan
workspace Gateway QA sementara yang dibuat oleh suite. Skenario tidak boleh membaca atau menulis
memori pengguna OpenClaw nyata, sesi, kredensial, launch agent, konfigurasi global,
atau status Gateway live.

Artefak tetap berada di bawah direktori artefak suite QA yang sudah ada dan harus
diperlakukan seperti keluaran pengujian. Pemeriksaan redaksi menggunakan penanda palsu sehingga kegagalan aman
untuk diperiksa dan dicatat dalam issue.

## Memperluas Paket

Tambahkan kasus `.yaml` baru di bawah `qa/scenarios/personal/`, lalu tambahkan id skenario
ke `QA_PERSONAL_AGENT_SCENARIO_IDS`. Jaga setiap kasus tetap kecil, lokal, deterministik
di `mock-openai`, dan berfokus pada satu perilaku asisten pribadi.

Kandidat tindak lanjut yang baik:

- pemeriksaan ekspor trajektori yang direda ksi
- pemeriksaan alur kerja Plugin khusus lokal

Hindari menambahkan runner, Plugin, dependensi, transport live, atau penilai model baru
sampai katalog skenario memiliki cukup kasus stabil untuk membenarkan permukaan tersebut.
