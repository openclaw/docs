---
read_when:
    - Anda ingin promosi memori berjalan secara otomatis
    - Anda ingin memahami fungsi setiap fase dreaming
    - Anda ingin menyetel konsolidasi tanpa mencemari MEMORY.md
summary: Konsolidasi memori latar belakang dengan fase light, deep, dan REM serta Dream Diary
title: Dreaming (eksperimental)
x-i18n:
    generated_at: "2026-04-06T09:13:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36c4b1e70801d662090dc8ce20608c2f141c23cd7ce53c54e3dcf332c801fd4e
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming (eksperimental)

Dreaming adalah sistem konsolidasi memori latar belakang di `memory-core`.
Sistem ini membantu OpenClaw memindahkan sinyal jangka pendek yang kuat ke memori yang tahan lama sambil
menjaga prosesnya tetap dapat dijelaskan dan ditinjau.

Dreaming bersifat **opsional** dan dinonaktifkan secara default.

## Apa yang ditulis dreaming

Dreaming menyimpan dua jenis output:

- **Status mesin** di `memory/.dreams/` (penyimpanan recall, sinyal fase, checkpoint ingestion, lock).
- **Output yang dapat dibaca manusia** di `DREAMS.md` (atau `dreams.md` yang sudah ada) dan file laporan fase opsional di bawah `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promosi jangka panjang tetap hanya menulis ke `MEMORY.md`.

## Model fase

Dreaming menggunakan tiga fase kooperatif:

| Fase | Tujuan                                    | Penulisan permanen |
| ----- | ----------------------------------------- | ------------------ |
| Light | Mengurutkan dan menyiapkan materi jangka pendek terbaru | Tidak              |
| Deep  | Menilai dan mempromosikan kandidat yang tahan lama      | Ya (`MEMORY.md`)   |
| REM   | Merefleksikan tema dan gagasan yang berulang            | Tidak              |

Fase-fase ini adalah detail implementasi internal, bukan "mode" terpisah
yang dikonfigurasi pengguna.

### Fase light

Fase light mengingest sinyal memori harian terbaru dan jejak recall, menghapus duplikasi,
dan menyiapkan baris kandidat.

- Membaca dari status recall jangka pendek dan file memori harian terbaru.
- Menulis blok `## Light Sleep` yang dikelola saat penyimpanan menyertakan output inline.
- Mencatat sinyal reinforcement untuk pemeringkatan deep berikutnya.
- Tidak pernah menulis ke `MEMORY.md`.

### Fase deep

Fase deep menentukan apa yang menjadi memori jangka panjang.

- Memberi peringkat kandidat menggunakan penilaian berbobot dan ambang batas.
- Mengharuskan `minScore`, `minRecallCount`, dan `minUniqueQueries` terpenuhi.
- Merehidrasi potongan dari file harian aktif sebelum menulis, sehingga potongan yang usang/dihapus dilewati.
- Menambahkan entri yang dipromosikan ke `MEMORY.md`.
- Menulis ringkasan `## Deep Sleep` ke `DREAMS.md` dan secara opsional menulis `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

Fase REM mengekstrak pola dan sinyal reflektif.

- Membangun ringkasan tema dan refleksi dari jejak jangka pendek terbaru.
- Menulis blok `## REM Sleep` yang dikelola saat penyimpanan menyertakan output inline.
- Mencatat sinyal reinforcement REM yang digunakan oleh pemeringkatan deep.
- Tidak pernah menulis ke `MEMORY.md`.

## Dream Diary

Dreaming juga menyimpan **Dream Diary** naratif di `DREAMS.md`.
Setelah setiap fase memiliki materi yang cukup, `memory-core` menjalankan giliran subagen latar belakang dengan upaya terbaik
(menggunakan model runtime default) dan menambahkan entri diary singkat.

Diary ini untuk dibaca manusia di UI Dreams, bukan sumber promosi.

## Sinyal pemeringkatan deep

Pemeringkatan deep menggunakan enam sinyal dasar berbobot ditambah reinforcement fase:

| Sinyal              | Bobot | Deskripsi                                         |
| ------------------- | ------ | ------------------------------------------------- |
| Frekuensi           | 0.24   | Berapa banyak sinyal jangka pendek yang dikumpulkan entri |
| Relevansi           | 0.30   | Kualitas pengambilan rata-rata untuk entri        |
| Keragaman kueri     | 0.15   | Konteks kueri/hari berbeda yang memunculkannya    |
| Kebaruan            | 0.15   | Skor kesegaran dengan peluruhan waktu             |
| Konsolidasi         | 0.10   | Kekuatan kemunculan berulang lintas hari          |
| Kekayaan konseptual | 0.06   | Kepadatan tag konsep dari potongan/path           |

Hit fase light dan REM menambahkan peningkatan kecil dengan peluruhan kebaruan dari
`memory/.dreams/phase-signals.json`.

## Penjadwalan

Saat diaktifkan, `memory-core` mengelola secara otomatis satu pekerjaan cron untuk satu sapuan dreaming
penuh. Setiap sapuan menjalankan fase secara berurutan: light -> REM -> deep.

Perilaku kadens default:

| Pengaturan          | Default     |
| ------------------- | ----------- |
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

Aktifkan dreaming dengan kadens sapuan kustom:

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

## Perintah slash

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

`memory promote` manual menggunakan ambang batas fase deep secara default kecuali ditimpa
dengan flag CLI.

Jelaskan mengapa kandidat tertentu akan atau tidak akan dipromosikan:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Pratinjau refleksi REM, kebenaran kandidat, dan output promosi deep tanpa
menulis apa pun:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Default utama

Semua pengaturan berada di bawah `plugins.entries.memory-core.config.dreaming`.

| Kunci       | Default     |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

Kebijakan fase, ambang batas, dan perilaku penyimpanan adalah detail implementasi
internal (bukan konfigurasi yang ditujukan untuk pengguna).

Lihat [Referensi konfigurasi Memory](/id/reference/memory-config#dreaming-experimental)
untuk daftar kunci lengkap.

## UI Dreams

Saat diaktifkan, tab **Dreams** di Gateway menampilkan:

- status aktif dreaming saat ini
- status tingkat fase dan keberadaan sapuan terkelola
- jumlah jangka pendek, jangka panjang, dan yang dipromosikan hari ini
- waktu jalan terjadwal berikutnya
- pembaca Dream Diary yang dapat diperluas yang didukung oleh `doctor.memory.dreamDiary`

## Terkait

- [Memory](/id/concepts/memory)
- [Memory Search](/id/concepts/memory-search)
- [CLI memory](/cli/memory)
- [Referensi konfigurasi Memory](/id/reference/memory-config)
