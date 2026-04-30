---
read_when:
    - Anda ingin promosi memori berjalan secara otomatis
    - Anda ingin memahami apa yang dilakukan setiap fase Dreaming
    - Anda ingin menyesuaikan konsolidasi tanpa mengotori MEMORY.md
sidebarTitle: Dreaming
summary: Konsolidasi memori latar belakang dengan fase ringan, mendalam, dan REM serta Buku Harian Mimpi
title: Dreaming
x-i18n:
    generated_at: "2026-04-30T09:43:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85c323c073fc786069835aad25ee68781af49bb031e63b9601674461f385cc2a
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming adalah sistem konsolidasi memori latar belakang di `memory-core`. Sistem ini membantu OpenClaw memindahkan sinyal jangka pendek yang kuat ke memori yang tahan lama sambil menjaga prosesnya tetap dapat dijelaskan dan ditinjau.

<Note>
Dreaming bersifat **opt-in** dan dinonaktifkan secara default.
</Note>

## Apa yang ditulis Dreaming

Dreaming menyimpan dua jenis keluaran:

- **Status mesin** di `memory/.dreams/` (penyimpanan recall, sinyal fase, checkpoint ingest, lock).
- **Keluaran yang dapat dibaca manusia** di `DREAMS.md` (atau `dreams.md` yang sudah ada) dan file laporan fase opsional di bawah `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promosi jangka panjang tetap hanya menulis ke `MEMORY.md`.

## Model fase

Dreaming menggunakan tiga fase kooperatif:

| Fase | Tujuan                                    | Penulisan tahan lama |
| ---- | ----------------------------------------- | -------------------- |
| Light | Menyortir dan menyiapkan materi jangka pendek terbaru | Tidak                |
| Deep  | Menilai dan mempromosikan kandidat tahan lama | Ya (`MEMORY.md`)     |
| REM   | Merefleksikan tema dan gagasan berulang   | Tidak                |

Fase-fase ini adalah detail implementasi internal, bukan "mode" terpisah yang dikonfigurasi pengguna.

<AccordionGroup>
  <Accordion title="Fase Light">
    Fase Light mengingest sinyal memori harian terbaru dan jejak recall, melakukan deduplikasi, lalu menyiapkan baris kandidat.

    - Membaca dari status recall jangka pendek, file memori harian terbaru, dan transkrip sesi yang telah disunting jika tersedia.
    - Menulis blok `## Light Sleep` terkelola ketika penyimpanan menyertakan keluaran inline.
    - Mencatat sinyal penguatan untuk pemeringkatan deep berikutnya.
    - Tidak pernah menulis ke `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase Deep">
    Fase Deep memutuskan apa yang menjadi memori jangka panjang.

    - Memeringkat kandidat menggunakan penilaian berbobot dan gerbang ambang.
    - Mengharuskan `minScore`, `minRecallCount`, dan `minUniqueQueries` lolos.
    - Merehidrasi cuplikan dari file harian live sebelum menulis, sehingga cuplikan usang/terhapus dilewati.
    - Menambahkan entri yang dipromosikan ke `MEMORY.md`.
    - Menulis ringkasan `## Deep Sleep` ke `DREAMS.md` dan secara opsional menulis `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Fase REM">
    Fase REM mengekstrak pola dan sinyal reflektif.

    - Membuat ringkasan tema dan refleksi dari jejak jangka pendek terbaru.
    - Menulis blok `## REM Sleep` terkelola ketika penyimpanan menyertakan keluaran inline.
    - Mencatat sinyal penguatan REM yang digunakan oleh pemeringkatan deep.
    - Tidak pernah menulis ke `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingest transkrip sesi

Dreaming dapat mengingest transkrip sesi yang telah disunting ke dalam korpus Dreaming. Ketika transkrip tersedia, transkrip tersebut dimasukkan ke fase Light bersama sinyal memori harian dan jejak recall. Konten pribadi dan sensitif disunting sebelum ingest.

## Diari Mimpi

Dreaming juga menyimpan **Diari Mimpi** naratif di `DREAMS.md`. Setelah setiap fase memiliki cukup materi, `memory-core` menjalankan giliran subagent latar belakang best-effort dan menambahkan entri diari singkat. Ini menggunakan model runtime default kecuali `dreaming.model` dikonfigurasi. Jika model yang dikonfigurasi tidak tersedia, Diari Mimpi mencoba ulang sekali dengan model default sesi.

<Note>
Diari ini ditujukan untuk dibaca manusia di UI Mimpi, bukan sebagai sumber promosi. Artefak diari/laporan yang dihasilkan Dreaming dikecualikan dari promosi jangka pendek. Hanya cuplikan memori yang berlandaskan bukti yang memenuhi syarat untuk dipromosikan ke `MEMORY.md`.
</Note>

Ada juga jalur backfill historis yang berlandaskan bukti untuk pekerjaan peninjauan dan pemulihan:

<AccordionGroup>
  <Accordion title="Perintah backfill">
    - `memory rem-harness --path ... --grounded` mempratinjau keluaran diari berbasis bukti dari catatan historis `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` menulis entri diari berbasis bukti yang dapat dibalik ke `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` menyiapkan kandidat tahan lama berbasis bukti ke penyimpanan bukti jangka pendek yang sama yang sudah digunakan fase deep normal.
    - `memory rem-backfill --rollback` dan `--rollback-short-term` menghapus artefak backfill yang disiapkan tersebut tanpa menyentuh entri diari biasa atau recall jangka pendek live.

  </Accordion>
</AccordionGroup>

UI Kontrol mengekspos alur backfill/reset diari yang sama sehingga Anda dapat memeriksa hasil di scene Mimpi sebelum memutuskan apakah kandidat berbasis bukti layak dipromosikan. Scene juga menampilkan jalur berbasis bukti yang berbeda sehingga Anda dapat melihat entri jangka pendek yang disiapkan mana yang berasal dari replay historis, item yang dipromosikan mana yang dipimpin oleh bukti, dan hanya menghapus entri yang disiapkan khusus berbasis bukti tanpa menyentuh status jangka pendek live biasa.

## Sinyal pemeringkatan deep

Pemeringkatan deep menggunakan enam sinyal dasar berbobot plus penguatan fase:

| Sinyal              | Bobot | Deskripsi                                        |
| ------------------- | ----- | ------------------------------------------------ |
| Frekuensi           | 0.24  | Berapa banyak sinyal jangka pendek yang dikumpulkan entri |
| Relevansi           | 0.30  | Kualitas retrieval rata-rata untuk entri         |
| Keragaman kueri     | 0.15  | Konteks kueri/hari berbeda yang memunculkannya   |
| Keterkinian         | 0.15  | Skor kesegaran dengan peluruhan waktu            |
| Konsolidasi         | 0.10  | Kekuatan kemunculan berulang multi-hari          |
| Kekayaan konseptual | 0.06  | Kepadatan tag konsep dari cuplikan/path          |

Hit fase Light dan REM menambahkan boost kecil dengan peluruhan keterkinian dari `memory/.dreams/phase-signals.json`.

## Penjadwalan

Saat diaktifkan, `memory-core` mengelola otomatis satu job cron untuk sweep Dreaming penuh. Setiap sweep menjalankan fase secara berurutan: Light → REM → deep.

Perilaku cadence default:

| Pengaturan           | Default       |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | model default |

## Mulai cepat

<Tabs>
  <Tab title="Aktifkan Dreaming">
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
  <Tab title="Pratinjau promosi / terapkan">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` manual menggunakan ambang fase deep secara default kecuali ditimpa dengan flag CLI.

  </Tab>
  <Tab title="Jelaskan promosi">
    Jelaskan mengapa kandidat tertentu akan atau tidak akan dipromosikan:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Pratinjau harness REM">
    Pratinjau refleksi REM, kebenaran kandidat, dan keluaran promosi deep tanpa menulis apa pun:

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
  Override model subagent Diari Mimpi opsional. Gunakan nilai `provider/model` kanonis saat juga menetapkan allowlist `allowedModels` subagent.
</ParamField>

<Warning>
`dreaming.model` memerlukan `plugins.entries.memory-core.subagent.allowModelOverride: true`. Untuk membatasinya, tetapkan juga `plugins.entries.memory-core.subagent.allowedModels`. Kegagalan trust atau allowlist tetap terlihat alih-alih fallback secara diam-diam; percobaan ulang hanya mencakup error model tidak tersedia.
</Warning>

<Note>
Kebijakan fase, ambang, dan perilaku penyimpanan adalah detail implementasi internal (bukan konfigurasi yang menghadap pengguna). Lihat [Referensi konfigurasi memori](/id/reference/memory-config#dreaming) untuk daftar key lengkap.
</Note>

## UI Mimpi

Saat diaktifkan, tab **Dreams** Gateway menampilkan:

- status Dreaming aktif saat ini
- status level fase dan keberadaan sweep terkelola
- jumlah jangka pendek, berbasis bukti, sinyal, dan yang dipromosikan hari ini
- waktu run terjadwal berikutnya
- jalur Scene berbasis bukti yang berbeda untuk entri replay historis yang disiapkan
- pembaca Diari Mimpi yang dapat diperluas dan didukung oleh `doctor.memory.dreamDiary`

## Terkait

- [Memori](/id/concepts/memory)
- [CLI Memori](/id/cli/memory)
- [Referensi konfigurasi memori](/id/reference/memory-config)
- [Pencarian memori](/id/concepts/memory-search)
