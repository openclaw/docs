---
read_when:
    - Menjalankan pemeriksaan keandalan agen pribadi lokal
    - Memperluas katalog skenario QA berbasis repositori
    - Memverifikasi pengingat, balasan, memori, penyuntingan informasi sensitif, tindak lanjut alat yang aman, status tugas, diagnostik yang aman dibagikan, klaim penyelesaian berbasis bukti, dan pemulihan kegagalan
summary: Skenario qa-channel lokal untuk pemeriksaan alur kerja asisten pribadi yang menjaga privasi.
title: Paket tolok ukur agen pribadi
x-i18n:
    generated_at: "2026-07-12T14:06:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Personal Agent Benchmark Pack adalah paket skenario QA kecil berbasis repositori untuk
alur kerja asisten pribadi lokal. Paket ini bukan tolok ukur model generik dan
tidak memerlukan runner baru: paket ini menggunakan kembali tumpukan QA privat ([ikhtisar QA](/id/concepts/qa-e2e-automation)),
[kanal QA](/id/channels/qa-channel) sintetis, dan katalog YAML
`qa/scenarios` yang sudah ada.

## Skenario

Sepuluh skenario, yang didefinisikan dalam `qa/scenarios/personal/*.yaml`:

| Id skenario                                | Pemeriksaan                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | Pengingat pribadi palsu melalui pengiriman cron lokal                                               |
| `personal-channel-thread-reply`            | Perutean DM palsu dan balasan utas melalui `qa-channel`                                             |
| `personal-memory-preference-recall`        | Pengingatan kembali preferensi palsu dari berkas memori ruang kerja QA sementara                    |
| `personal-redaction-no-secret-leak`        | Pemeriksaan agar rahasia palsu tidak dikembalikan                                                    |
| `personal-tool-safety-followthrough`       | Tindak lanjut alat berbasis pembacaan yang aman setelah percakapan singkat bergaya persetujuan      |
| `personal-approval-denial-stop`            | Perilaku berhenti saat persetujuan ditolak untuk permintaan pembacaan lokal yang sensitif           |
| `personal-task-followthrough-status`       | Pelaporan status tugas berbasis bukti yang memisahkan status tertunda, terblokir, dan selesai        |
| `personal-share-safe-diagnostics-artifact` | Artefak diagnostik yang aman dibagikan, mempertahankan status berguna tanpa menyertakan konten pribadi mentah |
| `personal-no-fake-progress`                | Klaim penyelesaian berbasis bukti yang menghindari progres palsu sebelum tersedia bukti lokal        |
| `personal-failure-recovery`                | Pemulihan kegagalan yang melaporkan status parsial dan menjaga batas percobaan ulang tetap jelas     |

Metadata paket yang dapat dibaca mesin (daftar id, judul, deskripsi) berada di
`extensions/qa-lab/src/scenario-packs.ts` sebagai `QA_PERSONAL_AGENT_SCENARIO_IDS`.
Jalankan paket dengan `--pack personal-agent`:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` bersifat aditif dengan flag `--scenario` yang diulang. Skenario eksplisit dijalankan
terlebih dahulu, lalu skenario paket dijalankan sesuai urutan `QA_PERSONAL_AGENT_SCENARIO_IDS`
dengan duplikat dihapus.

Paket ini menargetkan `qa-channel` dengan `mock-openai` atau jalur penyedia QA lokal
lainnya. Jangan arahkan paket ini ke layanan obrolan langsung atau akun pribadi nyata.

## Model Privasi

Skenario hanya menggunakan pengguna palsu, preferensi palsu, rahasia palsu, dan
ruang kerja Gateway QA sementara yang dibuat oleh suite. Skenario tidak boleh membaca atau
menulis memori pengguna OpenClaw nyata, sesi, kredensial, agen peluncuran, konfigurasi
global, atau status Gateway langsung.

Artefak tetap berada di direktori artefak suite QA yang sudah ada dan diperlakukan
seperti keluaran pengujian. Pemeriksaan penyuntingan menggunakan penanda palsu agar kegagalan aman untuk
diperiksa dan dilaporkan dalam isu.

## Memperluas paket

Tambahkan kasus `.yaml` baru di bawah `qa/scenarios/personal/`, lalu tambahkan id skenario
ke `QA_PERSONAL_AGENT_SCENARIO_IDS`. Jaga agar setiap kasus tetap kecil, lokal, deterministik
dalam `mock-openai`, dan berfokus pada satu perilaku asisten pribadi.

Kandidat tindak lanjut yang baik: pemeriksaan ekspor lintasan yang disunting, pemeriksaan
alur kerja Plugin khusus lokal.

Hindari menambahkan runner, Plugin, dependensi, transportasi langsung, atau penilai model
baru hingga katalog skenario memiliki cukup kasus stabil untuk membenarkan permukaan tersebut.
