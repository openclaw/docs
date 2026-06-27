---
read_when:
    - Anda ingin promosi memori berjalan secara otomatis
    - Anda ingin memahami apa yang dilakukan setiap fase Dreaming
    - Anda ingin menyesuaikan konsolidasi tanpa mencemari MEMORY.md
sidebarTitle: Dreaming
summary: Konsolidasi memori latar belakang dengan fase ringan, mendalam, dan REM serta Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-06-27T17:23:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 257e8095114e05f18e0ba7a6870765a6b88c80e1eedaccfa891faa231f68f01b
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming adalah sistem konsolidasi memori latar belakang di `memory-core`. Sistem ini membantu OpenClaw memindahkan sinyal jangka pendek yang kuat ke memori tahan lama sambil menjaga proses tetap dapat dijelaskan dan ditinjau.

<Note>
Dreaming bersifat **opt-in** dan dinonaktifkan secara default.
</Note>

## Yang ditulis Dreaming

Dreaming menyimpan dua jenis keluaran:

- **Status mesin** di `memory/.dreams/` (penyimpanan recall, sinyal fase, checkpoint ingestion, lock).
- **Keluaran yang dapat dibaca manusia** di `DREAMS.md` (atau `dreams.md` yang sudah ada) dan file laporan fase opsional di bawah `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promosi jangka panjang tetap hanya menulis ke `MEMORY.md`.

## Model fase

Dreaming menggunakan tiga fase kooperatif:

| Fase  | Tujuan                                      | Penulisan tahan lama |
| ----- | ------------------------------------------- | -------------------- |
| Light | Mengurutkan dan menyiapkan materi jangka pendek terbaru | Tidak                |
| Deep  | Menilai dan mempromosikan kandidat tahan lama | Ya (`MEMORY.md`)     |
| REM   | Merefleksikan tema dan ide berulang          | Tidak                |

Fase-fase ini adalah detail implementasi internal, bukan "mode" terpisah yang dikonfigurasi pengguna.

<AccordionGroup>
  <Accordion title="Fase Light">
    Fase Light meng-ingest sinyal memori harian terbaru dan jejak recall, menghapus duplikatnya, lalu menyiapkan baris kandidat.

    - Membaca dari status recall jangka pendek, file memori harian terbaru, dan transkrip sesi yang telah direduksi jika tersedia.
    - Menulis blok `## Light Sleep` terkelola saat penyimpanan menyertakan keluaran inline.
    - Merekam sinyal penguatan untuk pemeringkatan Deep berikutnya.
    - Tidak pernah menulis ke `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase Deep">
    Fase Deep memutuskan apa yang menjadi memori jangka panjang.

    - Memeringkat kandidat menggunakan penilaian berbobot dan gerbang ambang.
    - Mengharuskan `minScore`, `minRecallCount`, dan `minUniqueQueries` lolos.
    - Merehidrasi cuplikan dari file harian live sebelum menulis, sehingga cuplikan basi/terhapus dilewati.
    - Menambahkan entri yang dipromosikan ke `MEMORY.md`.
    - Menulis ringkasan `## Deep Sleep` ke `DREAMS.md` dan secara opsional menulis `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Fase REM">
    Fase REM mengekstrak pola dan sinyal reflektif.

    - Membuat ringkasan tema dan refleksi dari jejak jangka pendek terbaru.
    - Menulis blok `## REM Sleep` terkelola saat penyimpanan menyertakan keluaran inline.
    - Merekam sinyal penguatan REM yang digunakan oleh pemeringkatan Deep.
    - Tidak pernah menulis ke `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestion transkrip sesi

Dreaming dapat meng-ingest transkrip sesi yang telah direduksi ke dalam korpus Dreaming. Saat transkrip tersedia, transkrip dimasukkan ke fase Light bersama sinyal memori harian dan jejak recall. Konten pribadi dan sensitif direduksi sebelum ingestion.

## Dream Diary

Dreaming juga menyimpan **Dream Diary** naratif di `DREAMS.md`. Setelah setiap fase memiliki materi yang cukup, `memory-core` menjalankan turn subagent latar belakang best-effort dan menambahkan entri diary singkat. Ini menggunakan model runtime default kecuali `dreaming.model` dikonfigurasi. Jika model yang dikonfigurasi tidak tersedia, Dream Diary mencoba ulang sekali dengan model default sesi.

<Note>
Diary ini ditujukan untuk dibaca manusia di UI Dreams, bukan sumber promosi. Artefak diary/laporan yang dihasilkan Dreaming dikecualikan dari promosi jangka pendek. Hanya cuplikan memori yang grounded yang memenuhi syarat untuk dipromosikan ke `MEMORY.md`.
</Note>

Ada juga jalur backfill historis grounded untuk pekerjaan peninjauan dan pemulihan:

<AccordionGroup>
  <Accordion title="Perintah backfill">
    - `memory rem-harness --path ... --grounded` mempratinjau keluaran diary grounded dari catatan historis `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` menulis entri diary grounded yang dapat dibalik ke `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` menyiapkan kandidat tahan lama grounded ke penyimpanan bukti jangka pendek yang sama dengan yang sudah digunakan fase Deep normal.
    - `memory rem-backfill --rollback` dan `--rollback-short-term` menghapus artefak backfill yang disiapkan tersebut tanpa menyentuh entri diary biasa atau recall jangka pendek live.

  </Accordion>
</AccordionGroup>

Control UI mengekspos alur backfill/reset diary yang sama sehingga Anda dapat memeriksa hasil di scene Dreams sebelum memutuskan apakah kandidat grounded layak dipromosikan. Scene juga menampilkan jalur grounded terpisah sehingga Anda dapat melihat entri jangka pendek yang disiapkan mana yang berasal dari replay historis, item yang dipromosikan mana yang dipimpin oleh grounded, dan hanya membersihkan entri yang disiapkan khusus grounded tanpa menyentuh status jangka pendek live biasa.

## Sinyal pemeringkatan Deep

Pemeringkatan Deep menggunakan enam sinyal dasar berbobot ditambah penguatan fase:

| Sinyal              | Bobot | Deskripsi                                         |
| ------------------- | ----- | ------------------------------------------------- |
| Frekuensi           | 0.24  | Berapa banyak sinyal jangka pendek yang dikumpulkan entri |
| Relevansi           | 0.30  | Kualitas pengambilan rata-rata untuk entri        |
| Keragaman kueri     | 0.15  | Konteks kueri/hari berbeda yang memunculkannya    |
| Kebaruan            | 0.15  | Skor kesegaran dengan peluruhan waktu             |
| Konsolidasi         | 0.10  | Kekuatan kemunculan ulang lintas hari             |
| Kekayaan konseptual | 0.06  | Kepadatan tag konsep dari cuplikan/path           |

Hit fase Light dan REM menambahkan boost kecil yang meluruh berdasarkan kebaruan dari `memory/.dreams/phase-signals.json`.

Hasil shadow trial dapat dilapiskan di atas skor dasar tersebut sebagai sinyal tinjauan sebelum penulisan tahan lama apa pun. Trial yang membantu memberi kandidat boost kecil yang dibatasi, trial netral membuatnya tetap ditunda, dan trial berbahaya menandainya sebagai ditolak untuk pass penilaian tersebut. Sinyal ini tetap hanya laporan: sinyal ini dapat mengubah urutan kandidat atau metadata tinjauan, tetapi tidak menulis ke `MEMORY.md` atau mempromosikan kandidat dengan sendirinya.

## Cakupan laporan shadow trial QA

QA Lab menyertakan skenario hanya laporan untuk mengeksplorasi bagaimana shadow trial Dreaming masa depan dapat meninjau kandidat memori sebelum promosi. Skenario meminta agent membandingkan jawaban baseline dengan jawaban yang dapat menggunakan kandidat memori, lalu menulis laporan lokal dengan verdict, alasan, dan flag risiko.

Cakupan ini sengaja dibatasi untuk QA. Ini memverifikasi bahwa artefak laporan tetap terpisah dari `MEMORY.md` dan agent tidak mengklaim kandidat telah dipromosikan. Ini tidak menambahkan perilaku shadow trial produksi atau mengubah mesin promosi fase Deep.

Runner shadow trial `memory-core` mempertahankan kontrak hanya laporan yang sama untuk path kode yang membutuhkan artefak stabil. Runner menerima kandidat, prompt trial, hasil baseline, hasil kandidat, verdict, alasan, flag risiko, dan referensi bukti, lalu menulis laporan dengan `promotion action: report-only`. Verdict yang membantu dipetakan ke rekomendasi `promote`, verdict netral dipetakan ke `defer`, dan verdict berbahaya dipetakan ke `reject`; tidak satu pun rekomendasi tersebut menulis ke `MEMORY.md` atau menerapkan promosi fase Deep.

## Penjadwalan

Saat diaktifkan, `memory-core` mengelola otomatis satu job Cron untuk sweep Dreaming penuh. Setiap sweep menjalankan fase secara berurutan: Light → REM → Deep.

Sweep mencakup workspace runtime utama dan workspace agent apa pun yang dikonfigurasi, dengan deduplikasi berdasarkan path, sehingga fan-out workspace subagent tidak mengecualikan `DREAMS.md` dan status memori agent utama.

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
  <Tab title="Pratinjau / terapkan promosi">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` manual menggunakan ambang fase Deep secara default kecuali ditimpa dengan flag CLI.

  </Tab>
  <Tab title="Jelaskan promosi">
    Jelaskan mengapa kandidat tertentu akan atau tidak akan dipromosikan:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Pratinjau harness REM">
    Pratinjau refleksi REM, kebenaran kandidat, dan keluaran promosi Deep tanpa menulis apa pun:

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
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Jumlah token estimasi maksimum yang disimpan dari setiap cuplikan recall jangka pendek yang dipromosikan ke `MEMORY.md`. Provenance pemeringkatan tetap terlihat.
</ParamField>

<Warning>
`dreaming.model` memerlukan `plugins.entries.memory-core.subagent.allowModelOverride: true`. Untuk membatasinya, tetapkan juga `plugins.entries.memory-core.subagent.allowedModels`. Kegagalan trust atau allowlist tetap terlihat alih-alih fallback secara diam-diam; percobaan ulang hanya mencakup error model tidak tersedia.
</Warning>

<Note>
Sebagian besar kebijakan fase, ambang, dan perilaku penyimpanan adalah detail implementasi internal. Lihat [Referensi konfigurasi memori](/id/reference/memory-config#dreaming) untuk daftar kunci lengkap.
</Note>

## UI Dreams

Saat diaktifkan, tab **Dreams** Gateway menampilkan:

- status Dreaming yang aktif saat ini
- status tingkat fase dan keberadaan sweep terkelola
- jumlah jangka pendek, grounded, sinyal, dan dipromosikan hari ini
- waktu run terjadwal berikutnya
- jalur Scene grounded terpisah untuk entri replay historis yang disiapkan
- pembaca Dream Diary yang dapat diperluas, didukung oleh `doctor.memory.dreamDiary`

## Dreaming tidak pernah berjalan: status menampilkan diblokir

Jika `openclaw memory status` melaporkan `Dreaming status: blocked`, cron terkelola ada tetapi Heartbeat agent default tidak berjalan. Periksa bahwa Heartbeat diaktifkan untuk agent default dan targetnya bukan `none`, lalu jalankan `openclaw memory status --deep` lagi setelah interval Heartbeat berikutnya.

## Terkait

- [Memori](/id/concepts/memory)
- [CLI Memori](/id/cli/memory)
- [Referensi konfigurasi memori](/id/reference/memory-config)
- [Pencarian memori](/id/concepts/memory-search)
