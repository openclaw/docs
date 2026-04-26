---
read_when:
    - Anda ingin promosi memori berjalan secara otomatis
    - Anda ingin memahami apa yang dilakukan setiap fase Dreaming
    - Anda ingin menyetel konsolidasi tanpa mencemari `MEMORY.md`
sidebarTitle: Dreaming
summary: Konsolidasi memori latar belakang dengan fase ringan, dalam, dan REM serta Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-26T11:26:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: cba9593c5f697d49dbb20a3c908bf43ad37989f8cb029443b44523f2acab0e1d
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming adalah sistem konsolidasi memori latar belakang di `memory-core`. Sistem ini membantu OpenClaw memindahkan sinyal jangka pendek yang kuat ke memori yang tahan lama sambil menjaga proses tetap dapat dijelaskan dan ditinjau.

<Note>
Dreaming bersifat **opsional** dan dinonaktifkan secara default.
</Note>

## Apa yang ditulis oleh Dreaming

Dreaming menyimpan dua jenis output:

- **State mesin** di `memory/.dreams/` (recall store, sinyal fase, checkpoint ingestion, lock).
- **Output yang dapat dibaca manusia** di `DREAMS.md` (atau `dreams.md` yang sudah ada) dan file laporan fase opsional di bawah `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promosi jangka panjang tetap hanya menulis ke `MEMORY.md`.

## Model fase

Dreaming menggunakan tiga fase kooperatif:

| Fase | Tujuan                                    | Penulisan tahan lama |
| ----- | ----------------------------------------- | -------------------- |
| Light | Mengurutkan dan menyiapkan materi jangka pendek terbaru | Tidak                |
| Deep  | Menilai dan mempromosikan kandidat tahan lama | Ya (`MEMORY.md`)     |
| REM   | Merefleksikan tema dan ide yang berulang  | Tidak                |

Fase-fase ini adalah detail implementasi internal, bukan "mode" terpisah yang dikonfigurasi pengguna.

<AccordionGroup>
  <Accordion title="Fase Light">
    Fase Light mengingest sinyal memori harian terbaru dan jejak recall, menghapus duplikasi, dan menyiapkan baris kandidat.

    - Membaca dari state recall jangka pendek, file memori harian terbaru, dan transkrip sesi yang telah disunting bila tersedia.
    - Menulis blok `## Light Sleep` terkelola saat penyimpanan menyertakan output inline.
    - Mencatat sinyal reinforcement untuk peringkat deep berikutnya.
    - Tidak pernah menulis ke `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase Deep">
    Fase Deep menentukan apa yang menjadi memori jangka panjang.

    - Memeringkat kandidat menggunakan penilaian berbobot dan ambang batas.
    - Mengharuskan `minScore`, `minRecallCount`, dan `minUniqueQueries` lolos.
    - Menghidrasi ulang snippet dari file harian live sebelum menulis, sehingga snippet basi/terhapus dilewati.
    - Menambahkan entri yang dipromosikan ke `MEMORY.md`.
    - Menulis ringkasan `## Deep Sleep` ke `DREAMS.md` dan secara opsional menulis `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Fase REM">
    Fase REM mengekstrak pola dan sinyal reflektif.

    - Membangun ringkasan tema dan refleksi dari jejak jangka pendek terbaru.
    - Menulis blok `## REM Sleep` terkelola saat penyimpanan menyertakan output inline.
    - Mencatat sinyal reinforcement REM yang digunakan oleh peringkat deep.
    - Tidak pernah menulis ke `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestion transkrip sesi

Dreaming dapat mengingest transkrip sesi yang telah disunting ke dalam korpus dreaming. Saat transkrip tersedia, transkrip tersebut dimasukkan ke fase light bersama sinyal memori harian dan jejak recall. Konten pribadi dan sensitif disunting sebelum ingestion.

## Dream Diary

Dreaming juga menyimpan **Dream Diary** naratif di `DREAMS.md`. Setelah setiap fase memiliki cukup materi, `memory-core` menjalankan giliran subagen latar belakang best-effort (menggunakan model runtime default) dan menambahkan entri diary singkat.

<Note>
Diary ini untuk dibaca manusia di UI Dreams, bukan sumber promosi. Artefak diary/laporan yang dihasilkan Dreaming dikecualikan dari promosi jangka pendek. Hanya snippet memori yang berlandaskan data yang memenuhi syarat untuk dipromosikan ke `MEMORY.md`.
</Note>

Ada juga jalur backfill historis yang berlandaskan data untuk pekerjaan peninjauan dan pemulihan:

<AccordionGroup>
  <Accordion title="Perintah backfill">
    - `memory rem-harness --path ... --grounded` menampilkan pratinjau output diary berlandaskan data dari catatan historis `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` menulis entri diary berlandaskan data yang dapat dibalik ke `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` menyiapkan kandidat tahan lama yang berlandaskan data ke evidence store jangka pendek yang sama yang sudah digunakan oleh fase deep normal.
    - `memory rem-backfill --rollback` dan `--rollback-short-term` menghapus artefak backfill yang disiapkan tersebut tanpa menyentuh entri diary biasa atau recall jangka pendek live.
  </Accordion>
</AccordionGroup>

UI Control mengekspos alur backfill/reset diary yang sama sehingga Anda dapat memeriksa hasil di scene Dreams sebelum memutuskan apakah kandidat berlandaskan data tersebut layak dipromosikan. Scene juga menampilkan jalur berlandaskan data yang terpisah sehingga Anda dapat melihat entri jangka pendek yang disiapkan yang berasal dari replay historis, item yang dipromosikan yang dipimpin oleh data berlandaskan, dan menghapus hanya entri yang disiapkan khusus berlandaskan data tanpa menyentuh state jangka pendek live biasa.

## Sinyal peringkat deep

Peringkat deep menggunakan enam sinyal dasar berbobot ditambah reinforcement fase:

| Sinyal              | Bobot | Deskripsi                                        |
| ------------------- | ----- | ------------------------------------------------ |
| Frekuensi           | 0.24  | Berapa banyak sinyal jangka pendek yang dikumpulkan entri |
| Relevansi           | 0.30  | Kualitas retrieval rata-rata untuk entri         |
| Keragaman kueri     | 0.15  | Konteks kueri/hari berbeda yang memunculkannya   |
| Kebaruan            | 0.15  | Skor kesegaran dengan peluruhan waktu            |
| Konsolidasi         | 0.10  | Kekuatan kemunculan berulang lintas hari         |
| Kekayaan konseptual | 0.06  | Kepadatan tag konsep dari snippet/path           |

Hit fase Light dan REM menambahkan peningkatan kecil dengan peluruhan kebaruan dari `memory/.dreams/phase-signals.json`.

## Penjadwalan

Saat diaktifkan, `memory-core` mengelola otomatis satu pekerjaan Cron untuk satu sweep dreaming penuh. Setiap sweep menjalankan fase secara berurutan: light → REM → deep.

Perilaku cadence default:

| Pengaturan           | Default     |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Mulai cepat

<Tabs>
  <Tab title="Aktifkan dreaming">
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
  </Tab>
  <Tab title="Cadence sweep kustom">
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
  </Tab>
</Tabs>

## Perintah slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Alur kerja CLI

<Tabs>
  <Tab title="Pratinjau / terapkan promosi">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` manual menggunakan ambang fase deep secara default kecuali dioverride dengan flag CLI.

  </Tab>
  <Tab title="Jelaskan promosi">
    Jelaskan mengapa kandidat tertentu akan atau tidak akan dipromosikan:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Pratinjau harness REM">
    Tampilkan pratinjau refleksi REM, kandidat kebenaran, dan output promosi deep tanpa menulis apa pun:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Default utama

Semua pengaturan berada di bawah `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Aktifkan atau nonaktifkan sweep dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadence Cron untuk sweep dreaming penuh.
</ParamField>

<Note>
Kebijakan fase, ambang batas, dan perilaku penyimpanan adalah detail implementasi internal (bukan config yang ditujukan untuk pengguna). Lihat [Memory configuration reference](/id/reference/memory-config#dreaming) untuk daftar kunci lengkap.
</Note>

## UI Dreams

Saat diaktifkan, tab **Dreams** Gateway menampilkan:

- state dreaming aktif saat ini
- status tingkat fase dan keberadaan sweep terkelola
- jumlah jangka pendek, berlandaskan data, sinyal, dan yang dipromosikan hari ini
- waktu eksekusi terjadwal berikutnya
- jalur Scene berlandaskan data yang terpisah untuk entri replay historis yang disiapkan
- pembaca Dream Diary yang dapat diperluas didukung oleh `doctor.memory.dreamDiary`

## Terkait

- [Memory](/id/concepts/memory)
- [Memory CLI](/id/cli/memory)
- [Memory configuration reference](/id/reference/memory-config)
- [Memory search](/id/concepts/memory-search)
