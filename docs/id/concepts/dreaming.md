---
read_when:
    - Anda ingin promosi memori berjalan secara otomatis
    - Anda ingin memahami apa yang dilakukan setiap fase Dreaming
    - Anda ingin menyetel konsolidasi tanpa mencemari `MEMORY.md`
summary: Konsolidasi memori latar belakang dengan fase ringan, dalam, dan REM serta Buku Harian Mimpi
title: Dreaming
x-i18n:
    generated_at: "2026-04-24T09:04:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c0f6ff18ac78980be07452859ec79e9a5b2ebb513c69e38eb09eff66291395
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming adalah sistem konsolidasi memori latar belakang di `memory-core`.
Sistem ini membantu OpenClaw memindahkan sinyal jangka pendek yang kuat ke memori tahan lama sambil
menjaga proses tetap dapat dijelaskan dan ditinjau.

Dreaming bersifat **opt-in** dan dinonaktifkan secara default.

## Apa yang ditulis oleh Dreaming

Dreaming menyimpan dua jenis output:

- **State mesin** di `memory/.dreams/` (recall store, sinyal fase, checkpoint ingestion, lock).
- **Output yang dapat dibaca manusia** di `DREAMS.md` (atau `dreams.md` yang sudah ada) dan file laporan fase opsional di bawah `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promosi jangka panjang tetap hanya menulis ke `MEMORY.md`.

## Model fase

Dreaming menggunakan tiga fase kooperatif:

| Phase | Purpose                                   | Durable write     |
| ----- | ----------------------------------------- | ----------------- |
| Light | Urutkan dan tahap materi jangka pendek terbaru | Tidak             |
| Deep  | Beri skor dan promosikan kandidat tahan lama   | Ya (`MEMORY.md`)  |
| REM   | Refleksikan tema dan ide yang berulang         | Tidak             |

Fase-fase ini adalah detail implementasi internal, bukan "mode"
terpisah yang dikonfigurasi pengguna.

### Fase Light

Fase Light melakukan ingestion sinyal memori harian terbaru dan jejak recall, menghapus duplikasi,
dan menahapkan baris kandidat.

- Membaca dari state recall jangka pendek, file memori harian terbaru, dan transkrip sesi yang sudah disunting bila tersedia.
- Menulis blok `## Light Sleep` terkelola saat penyimpanan menyertakan output inline.
- Mencatat sinyal penguatan untuk peringkat deep nanti.
- Tidak pernah menulis ke `MEMORY.md`.

### Fase Deep

Fase Deep memutuskan apa yang menjadi memori jangka panjang.

- Merangking kandidat menggunakan skoring berbobot dan gerbang ambang.
- Mengharuskan `minScore`, `minRecallCount`, dan `minUniqueQueries` lolos.
- Merehidrasi snippet dari file harian live sebelum menulis, sehingga snippet yang usang/dihapus dilewati.
- Menambahkan entri yang dipromosikan ke `MEMORY.md`.
- Menulis ringkasan `## Deep Sleep` ke `DREAMS.md` dan secara opsional menulis `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

Fase REM mengekstrak pola dan sinyal reflektif.

- Membangun ringkasan tema dan refleksi dari jejak jangka pendek terbaru.
- Menulis blok `## REM Sleep` terkelola saat penyimpanan menyertakan output inline.
- Mencatat sinyal penguatan REM yang digunakan oleh peringkat deep.
- Tidak pernah menulis ke `MEMORY.md`.

## Ingestion transkrip sesi

Dreaming dapat melakukan ingestion transkrip sesi yang sudah disunting ke korpus dreaming. Saat
transkrip tersedia, transkrip tersebut dimasukkan ke fase light bersama
sinyal memori harian dan jejak recall. Konten pribadi dan sensitif disunting
sebelum ingestion.

## Buku Harian Mimpi

Dreaming juga menyimpan **Buku Harian Mimpi** naratif di `DREAMS.md`.
Setelah setiap fase memiliki cukup materi, `memory-core` menjalankan giliran subagen
latar belakang best-effort (menggunakan model runtime default) dan menambahkan entri harian singkat.

Buku harian ini untuk dibaca manusia di UI Dreams, bukan sumber promosi.
Artefak buku harian/laporan yang dihasilkan Dreaming dikecualikan dari
promosi jangka pendek. Hanya snippet memori yang ter-grounded yang memenuhi syarat untuk dipromosikan ke
`MEMORY.md`.

Ada juga jalur backfill historis yang ter-grounded untuk pekerjaan peninjauan dan pemulihan:

- `memory rem-harness --path ... --grounded` mempratinjau output buku harian ter-grounded dari catatan historis `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` menulis entri buku harian ter-grounded yang dapat dibalik ke `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` menahapkan kandidat tahan lama yang ter-grounded ke evidence store jangka pendek yang sama yang sudah digunakan fase deep normal.
- `memory rem-backfill --rollback` dan `--rollback-short-term` menghapus artefak backfill yang ditahapkan tersebut tanpa menyentuh entri buku harian biasa atau recall jangka pendek live.

UI Control mengekspos alur backfill/reset buku harian yang sama sehingga Anda dapat memeriksa
hasil di scene Dreams sebelum memutuskan apakah kandidat yang ter-grounded tersebut
layak dipromosikan. Scene juga menampilkan jalur grounded yang berbeda sehingga Anda dapat melihat
entri jangka pendek yang ditahapkan berasal dari replay historis, item yang dipromosikan dipimpin oleh grounded, dan menghapus hanya entri staged khusus grounded tanpa
menyentuh state jangka pendek live biasa.

## Sinyal peringkat deep

Peringkat deep menggunakan enam sinyal dasar berbobot ditambah penguatan fase:

| Signal              | Weight | Description                                       |
| ------------------- | ------ | ------------------------------------------------- |
| Frequency           | 0.24   | Berapa banyak sinyal jangka pendek yang dikumpulkan entri |
| Relevance           | 0.30   | Kualitas retrieval rata-rata untuk entri          |
| Query diversity     | 0.15   | Konteks kueri/hari berbeda yang memunculkannya    |
| Recency             | 0.15   | Skor kesegaran yang meluruh seiring waktu         |
| Consolidation       | 0.10   | Kekuatan kemunculan ulang lintas hari             |
| Conceptual richness | 0.06   | Kepadatan tag konsep dari snippet/path            |

Hit fase Light dan REM menambahkan dorongan kecil yang meluruh berdasarkan recency dari
`memory/.dreams/phase-signals.json`.

## Penjadwalan

Saat diaktifkan, `memory-core` mengelola otomatis satu job Cron untuk satu sweep dreaming
penuh. Setiap sweep menjalankan fase secara berurutan: light -> REM -> deep.

Perilaku cadence default:

| Setting              | Default     |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Mulai cepat

Aktifkan dreaming:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Aktifkan dreaming dengan cadence sweep kustom:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Slash command

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Alur kerja CLI

Gunakan promosi CLI untuk pratinjau atau penerapan manual:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

`memory promote` manual menggunakan ambang fase deep secara default kecuali dioverride
dengan flag CLI.

Jelaskan mengapa kandidat tertentu akan atau tidak akan dipromosikan:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Pratinjau refleksi REM, candidate truth, dan output promosi deep tanpa
menulis apa pun:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Default utama

Semua pengaturan berada di bawah `plugins.entries.memory-core.config.dreaming`.

| Key         | Default     |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

Kebijakan fase, ambang, dan perilaku penyimpanan adalah detail implementasi
internal (bukan config yang dihadapkan ke pengguna).

Lihat [Memory configuration reference](/id/reference/memory-config#dreaming)
untuk daftar kunci lengkap.

## UI Dreams

Saat diaktifkan, tab **Dreams** di Gateway menampilkan:

- state aktif dreaming saat ini
- status tingkat fase dan keberadaan managed-sweep
- jumlah jangka pendek, grounded, sinyal, dan yang dipromosikan hari ini
- waktu run terjadwal berikutnya
- jalur Scene grounded yang berbeda untuk entri replay historis yang ditahapkan
- pembaca Buku Harian Mimpi yang dapat diperluas dan didukung oleh `doctor.memory.dreamDiary`

## Terkait

- [Memory](/id/concepts/memory)
- [Memory Search](/id/concepts/memory-search)
- [memory CLI](/id/cli/memory)
- [Memory configuration reference](/id/reference/memory-config)
