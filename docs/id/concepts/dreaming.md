---
read_when:
    - Anda ingin promosi memori berjalan secara otomatis
    - Anda ingin memahami apa yang dilakukan setiap fase Dreaming
    - Anda ingin menyesuaikan konsolidasi tanpa mengotori MEMORY.md
sidebarTitle: Dreaming
summary: Konsolidasi memori di latar belakang dengan fase ringan, dalam, dan REM serta Buku Harian Mimpi
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T09:18:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23057bfeaaac1cc6b2bf2ee78928c8fdd820c817e461cc0b77f7c1e40ac14c22
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming adalah sistem konsolidasi memori latar belakang di `memory-core`. Sistem ini membantu OpenClaw memindahkan sinyal jangka pendek yang kuat ke memori tahan lama sambil menjaga prosesnya tetap dapat dijelaskan dan ditinjau.

<Note>
Dreaming bersifat **opt-in** dan dinonaktifkan secara default.
</Note>

## Yang ditulis Dreaming

Dreaming menyimpan dua jenis output:

- **Status mesin** di `memory/.dreams/` (penyimpanan recall, sinyal fase, checkpoint ingestion, lock).
- **Output yang dapat dibaca manusia** di `DREAMS.md` (atau `dreams.md` yang sudah ada) dan file laporan fase opsional di bawah `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promosi jangka panjang tetap hanya menulis ke `MEMORY.md`.

## Model fase

Dreaming menggunakan tiga fase kooperatif:

| Fase  | Tujuan                                          | Penulisan tahan lama |
| ----- | ----------------------------------------------- | -------------------- |
| Ringan | Mengurutkan dan menyiapkan materi jangka pendek terbaru | Tidak                |
| Dalam | Menilai dan mempromosikan kandidat tahan lama   | Ya (`MEMORY.md`)     |
| REM   | Merefleksikan tema dan ide yang berulang        | Tidak                |

Fase-fase ini adalah detail implementasi internal, bukan "mode" terpisah yang dikonfigurasi pengguna.

<AccordionGroup>
  <Accordion title="Light phase">
    Fase ringan mengingest sinyal memori harian terbaru dan jejak recall, melakukan deduplikasi, lalu menyiapkan baris kandidat.

    - Membaca dari status recall jangka pendek, file memori harian terbaru, dan transkrip sesi yang telah disunting jika tersedia.
    - Menulis blok `## Light Sleep` yang dikelola saat penyimpanan menyertakan output inline.
    - Mencatat sinyal penguatan untuk pemeringkatan dalam berikutnya.
    - Tidak pernah menulis ke `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep phase">
    Fase dalam memutuskan apa yang menjadi memori jangka panjang.

    - Memeringkat kandidat menggunakan penilaian berbobot dan gerbang ambang batas.
    - Mengharuskan `minScore`, `minRecallCount`, dan `minUniqueQueries` lulus.
    - Menghidrasi ulang cuplikan dari file harian live sebelum menulis, sehingga cuplikan usang/terhapus dilewati.
    - Menambahkan entri yang dipromosikan ke `MEMORY.md`.
    - Menulis ringkasan `## Deep Sleep` ke `DREAMS.md` dan secara opsional menulis `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM phase">
    Fase REM mengekstrak pola dan sinyal reflektif.

    - Membuat ringkasan tema dan refleksi dari jejak jangka pendek terbaru.
    - Menulis blok `## REM Sleep` yang dikelola saat penyimpanan menyertakan output inline.
    - Mencatat sinyal penguatan REM yang digunakan oleh pemeringkatan dalam.
    - Tidak pernah menulis ke `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestion transkrip sesi

Dreaming dapat mengingest transkrip sesi yang telah disunting ke dalam korpus Dreaming. Saat transkrip tersedia, transkrip dimasukkan ke fase ringan bersama sinyal memori harian dan jejak recall. Konten pribadi dan sensitif disunting sebelum ingestion.

## Dream Diary

Dreaming juga menyimpan **Dream Diary** naratif di `DREAMS.md`. Setelah setiap fase memiliki materi yang cukup, `memory-core` menjalankan giliran subagent latar belakang best-effort dan menambahkan entri diary pendek. Ini menggunakan model runtime default kecuali `dreaming.model` dikonfigurasi. Jika model yang dikonfigurasi tidak tersedia, Dream Diary mencoba sekali lagi dengan model default sesi.

<Note>
Diary ini ditujukan untuk dibaca manusia di UI Dreams, bukan sebagai sumber promosi. Artefak diary/laporan yang dihasilkan Dreaming dikecualikan dari promosi jangka pendek. Hanya cuplikan memori yang grounded yang memenuhi syarat untuk dipromosikan ke `MEMORY.md`.
</Note>

Ada juga jalur backfill historis grounded untuk pekerjaan peninjauan dan pemulihan:

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` mempratinjau output diary grounded dari catatan historis `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` menulis entri diary grounded yang dapat dibalik ke `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` menyiapkan kandidat tahan lama grounded ke penyimpanan bukti jangka pendek yang sama yang sudah digunakan fase dalam normal.
    - `memory rem-backfill --rollback` dan `--rollback-short-term` menghapus artefak backfill yang sudah disiapkan tersebut tanpa menyentuh entri diary biasa atau recall jangka pendek live.

  </Accordion>
</AccordionGroup>

Control UI mengekspos alur backfill/reset diary yang sama sehingga Anda dapat memeriksa hasil di scene Dreams sebelum memutuskan apakah kandidat grounded layak dipromosikan. Scene juga menampilkan jalur grounded terpisah sehingga Anda dapat melihat entri jangka pendek yang disiapkan dari replay historis, item yang dipromosikan dengan arahan grounded, dan hanya menghapus entri yang disiapkan khusus grounded tanpa menyentuh status jangka pendek live biasa.

## Sinyal pemeringkatan dalam

Pemeringkatan dalam menggunakan enam sinyal dasar berbobot ditambah penguatan fase:

| Sinyal              | Bobot | Deskripsi                                         |
| ------------------- | ----- | ------------------------------------------------- |
| Frekuensi           | 0.24  | Berapa banyak sinyal jangka pendek yang dikumpulkan entri |
| Relevansi           | 0.30  | Kualitas retrieval rata-rata untuk entri          |
| Keragaman kueri     | 0.15  | Konteks kueri/hari berbeda yang memunculkannya    |
| Keterkinian         | 0.15  | Skor kesegaran dengan peluruhan waktu             |
| Konsolidasi         | 0.10  | Kekuatan kemunculan ulang lintas hari             |
| Kekayaan konseptual | 0.06  | Kepadatan tag konsep dari cuplikan/path           |

Hit fase ringan dan REM menambahkan boost kecil dengan peluruhan keterkinian dari `memory/.dreams/phase-signals.json`.

## Penjadwalan

Saat diaktifkan, `memory-core` mengelola otomatis satu tugas cron untuk sweep Dreaming penuh. Setiap sweep menjalankan fase secara berurutan: ringan → REM → dalam.

Sweep mencakup workspace runtime utama dan semua workspace agen yang dikonfigurasi, dengan deduplikasi berdasarkan path, sehingga fan-out workspace subagent tidak mengecualikan `DREAMS.md` dan status memori agen utama.

Perilaku cadence default:

| Pengaturan           | Default       |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | model default |

## Mulai cepat

<Tabs>
  <Tab title="Enable dreaming">
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
  <Tab title="Custom sweep cadence">
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

## Workflow CLI

<Tabs>
  <Tab title="Promotion preview / apply">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` manual menggunakan ambang batas fase dalam secara default kecuali ditimpa dengan flag CLI.

  </Tab>
  <Tab title="Explain promotion">
    Jelaskan mengapa kandidat tertentu akan atau tidak akan dipromosikan:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    Pratinjau refleksi REM, kebenaran kandidat, dan output promosi dalam tanpa menulis apa pun:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Default utama

Semua pengaturan berada di bawah `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Aktifkan atau nonaktifkan sweep Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadence Cron untuk sweep Dreaming penuh.
</ParamField>
<ParamField path="model" type="string">
  Override model subagent Dream Diary opsional. Gunakan nilai `provider/model` kanonis saat juga menetapkan allowlist `allowedModels` subagent.
</ParamField>

<Warning>
`dreaming.model` memerlukan `plugins.entries.memory-core.subagent.allowModelOverride: true`. Untuk membatasinya, tetapkan juga `plugins.entries.memory-core.subagent.allowedModels`. Kegagalan kepercayaan atau allowlist tetap terlihat alih-alih fallback secara diam-diam; percobaan ulang hanya mencakup error model-tidak-tersedia.
</Warning>

<Note>
Kebijakan fase, ambang batas, dan perilaku penyimpanan adalah detail implementasi internal (bukan konfigurasi yang ditampilkan kepada pengguna). Lihat [Referensi konfigurasi memori](/id/reference/memory-config#dreaming) untuk daftar key lengkap.
</Note>

## UI Dreams

Saat diaktifkan, tab **Dreams** Gateway menampilkan:

- status aktif Dreaming saat ini
- status tingkat fase dan keberadaan sweep yang dikelola
- jumlah jangka pendek, grounded, sinyal, dan dipromosikan-hari-ini
- waktu run terjadwal berikutnya
- jalur Scene grounded terpisah untuk entri replay historis yang disiapkan
- pembaca Dream Diary yang dapat diperluas dan didukung oleh `doctor.memory.dreamDiary`

## Terkait

- [Memori](/id/concepts/memory)
- [CLI Memori](/id/cli/memory)
- [Referensi konfigurasi memori](/id/reference/memory-config)
- [Pencarian memori](/id/concepts/memory-search)
