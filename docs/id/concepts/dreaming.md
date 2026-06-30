---
read_when:
    - Anda ingin promosi memori berjalan secara otomatis
    - Anda ingin memahami apa yang dilakukan setiap fase dreaming
    - Anda ingin menyesuaikan konsolidasi tanpa mengotori MEMORY.md
sidebarTitle: Dreaming
summary: Konsolidasi memori latar belakang dengan fase ringan, mendalam, dan REM plus Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-06-30T14:27:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b636df63cdc5b60758f9600af695b3b6453122a03b0cc6fdc69d3c9259d1e61
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming adalah sistem konsolidasi memori latar belakang di `memory-core`. Sistem ini membantu OpenClaw memindahkan sinyal jangka pendek yang kuat ke memori tahan lama sambil menjaga prosesnya tetap dapat dijelaskan dan ditinjau.

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

| Fase  | Tujuan                                      | Penulisan tahan lama |
| ----- | ------------------------------------------- | -------------------- |
| Light | Menyortir dan menyiapkan materi jangka pendek terbaru | Tidak                |
| Deep  | Menilai dan mempromosikan kandidat tahan lama | Ya (`MEMORY.md`)     |
| REM   | Merefleksikan tema dan ide berulang         | Tidak                |

Fase-fase ini adalah detail implementasi internal, bukan "mode" terpisah yang dikonfigurasi pengguna.

<AccordionGroup>
  <Accordion title="Fase Light">
    Fase Light mengingest sinyal memori harian terbaru dan jejak recall, menghapus duplikatnya, dan menyiapkan baris kandidat.

    - Membaca dari status recall jangka pendek, file memori harian terbaru, dan transkrip sesi yang telah disunting jika tersedia.
    - Menulis blok `## Light Sleep` terkelola saat penyimpanan menyertakan keluaran inline.
    - Mencatat sinyal penguatan untuk pemeringkatan Deep berikutnya.
    - Tidak pernah menulis ke `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase Deep">
    Fase Deep memutuskan apa yang menjadi memori jangka panjang.

    - Memeringkat kandidat menggunakan penilaian berbobot dan gerbang ambang batas.
    - Mengharuskan `minScore`, `minRecallCount`, dan `minUniqueQueries` lolos.
    - Merehidrasi cuplikan dari file harian live sebelum menulis, sehingga cuplikan basi/terhapus dilewati.
    - Menambahkan entri yang dipromosikan ke `MEMORY.md`.
    - Menulis ringkasan `## Deep Sleep` ke `DREAMS.md` dan secara opsional menulis `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Fase REM">
    Fase REM mengekstrak pola dan sinyal reflektif.

    - Membuat ringkasan tema dan refleksi dari jejak jangka pendek terbaru.
    - Menulis blok `## REM Sleep` terkelola saat penyimpanan menyertakan keluaran inline.
    - Mencatat sinyal penguatan REM yang digunakan oleh pemeringkatan Deep.
    - Tidak pernah menulis ke `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingest transkrip sesi

Dreaming dapat mengingest transkrip sesi yang telah disunting ke korpus Dreaming. Saat transkrip tersedia, transkrip dimasukkan ke fase Light bersama sinyal memori harian dan jejak recall. Konten pribadi dan sensitif disunting sebelum ingest.

## Buku Harian Mimpi

Dreaming juga menyimpan **Buku Harian Mimpi** naratif di `DREAMS.md`. Setelah setiap fase memiliki materi yang cukup, `memory-core` menjalankan giliran subagen latar belakang best-effort dan menambahkan entri buku harian singkat. Ini menggunakan model runtime default kecuali `dreaming.model` dikonfigurasi. Jika model yang dikonfigurasi tidak tersedia, Buku Harian Mimpi mencoba sekali lagi dengan model default sesi.

<Note>
Buku harian ini untuk dibaca manusia di UI Dreams, bukan sumber promosi. Artefak buku harian/laporan yang dihasilkan Dreaming dikecualikan dari promosi jangka pendek. Hanya cuplikan memori berdasar bukti yang memenuhi syarat untuk dipromosikan ke `MEMORY.md`.
</Note>

Ada juga jalur backfill historis berdasar bukti untuk pekerjaan peninjauan dan pemulihan:

<AccordionGroup>
  <Accordion title="Perintah backfill">
    - `memory rem-harness --path ... --grounded` mempratinjau keluaran buku harian berdasar bukti dari catatan historis `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` menulis entri buku harian berdasar bukti yang dapat dibalik ke `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` menyiapkan kandidat tahan lama berdasar bukti ke penyimpanan bukti jangka pendek yang sama yang sudah digunakan fase Deep normal.
    - `memory rem-backfill --rollback` dan `--rollback-short-term` menghapus artefak backfill yang disiapkan tersebut tanpa menyentuh entri buku harian biasa atau recall jangka pendek live.

  </Accordion>
</AccordionGroup>

Control UI mengekspos alur backfill/reset buku harian yang sama sehingga Anda dapat memeriksa hasil di scene Dreams sebelum memutuskan apakah kandidat berdasar bukti layak dipromosikan. Scene juga menampilkan jalur berdasar bukti yang berbeda sehingga Anda dapat melihat entri jangka pendek yang disiapkan mana yang berasal dari pemutaran ulang historis, item yang dipromosikan mana yang dipimpin oleh bukti, dan hanya menghapus entri yang disiapkan khusus berdasar bukti tanpa menyentuh status jangka pendek live biasa.

## Sinyal pemeringkatan Deep

Pemeringkatan Deep menggunakan enam sinyal dasar berbobot ditambah penguatan fase:

| Sinyal              | Bobot | Deskripsi                                         |
| ------------------- | ----- | ------------------------------------------------- |
| Frekuensi           | 0.24  | Berapa banyak sinyal jangka pendek yang dikumpulkan entri |
| Relevansi           | 0.30  | Kualitas pengambilan rata-rata untuk entri        |
| Keragaman kueri     | 0.15  | Konteks kueri/hari berbeda yang memunculkannya    |
| Kebaruan            | 0.15  | Skor kesegaran yang meluruh seiring waktu         |
| Konsolidasi         | 0.10  | Kekuatan kemunculan ulang lintas hari             |
| Kekayaan konseptual | 0.06  | Kepadatan tag konsep dari cuplikan/path           |

Hit fase Light dan REM menambahkan sedikit boost yang meluruh menurut kebaruan dari `memory/.dreams/phase-signals.json`.

Hasil shadow trial dapat dilapiskan di atas skor dasar tersebut sebagai sinyal
peninjauan sebelum penulisan tahan lama apa pun. Trial yang membantu memberi
kandidat boost kecil yang dibatasi, trial netral membuatnya tetap ditunda, dan
trial berbahaya menandainya sebagai ditolak untuk pass penilaian tersebut.
Sinyal ini masih hanya-laporan: sinyal ini dapat mengubah urutan kandidat atau
metadata peninjauan, tetapi tidak menulis ke `MEMORY.md` atau mempromosikan
kandidat dengan sendirinya.

## Cakupan laporan shadow trial QA

QA Lab menyertakan skenario hanya-laporan untuk mengeksplorasi bagaimana shadow
trial Dreaming di masa depan dapat meninjau memori kandidat sebelum promosi.
Skenario meminta agen membandingkan jawaban dasar dengan jawaban yang dapat
menggunakan memori kandidat, lalu menulis laporan lokal dengan verdict, alasan,
dan flag risiko.

Cakupan ini sengaja dibatasi untuk QA. Ini memverifikasi bahwa artefak laporan
tetap terpisah dari `MEMORY.md` dan bahwa agen tidak mengklaim kandidat telah
dipromosikan. Ini tidak menambahkan perilaku shadow trial produksi atau mengubah
mesin promosi fase Deep.

Runner shadow trial `memory-core` mempertahankan kontrak hanya-laporan yang sama
untuk jalur kode yang membutuhkan artefak stabil. Runner ini menerima kandidat,
prompt trial, hasil dasar, hasil kandidat, verdict, alasan, flag risiko, dan
referensi bukti, lalu menulis laporan dengan `promotion action: report-only`.
Verdict yang membantu dipetakan ke rekomendasi `promote`, verdict netral
dipetakan ke `defer`, dan verdict berbahaya dipetakan ke `reject`; tidak satu
pun dari rekomendasi tersebut menulis ke `MEMORY.md` atau menerapkan promosi
fase Deep.

## Penjadwalan

Saat diaktifkan, `memory-core` mengelola otomatis satu tugas cron untuk sweep Dreaming penuh. Setiap sweep menjalankan fase secara berurutan: Light → REM → Deep.

Sweep menyertakan workspace runtime utama dan workspace agen apa pun yang dikonfigurasi, dengan deduplikasi berdasarkan path, sehingga fan-out workspace subagen tidak mengecualikan `DREAMS.md` dan status memori agen utama.

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

`/dreaming on` dan `/dreaming off` mengubah konfigurasi seluruh Gateway.
Pemanggil channel harus menjadi owner, dan klien Gateway harus memiliki
`operator.admin`. `/dreaming status` dan `/dreaming help` tetap hanya-baca.

## Alur kerja CLI

<Tabs>
  <Tab title="Pratinjau promosi / terapkan">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` manual menggunakan ambang batas fase Deep secara default kecuali ditimpa dengan flag CLI.

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
  Override model subagen Buku Harian Mimpi opsional. Gunakan nilai `provider/model` kanonis saat juga menetapkan allowlist subagen `allowedModels`.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Jumlah token estimasi maksimum yang dipertahankan dari setiap cuplikan recall jangka pendek yang dipromosikan ke `MEMORY.md`. Provenans pemeringkatan tetap terlihat.
</ParamField>

<Warning>
`dreaming.model` memerlukan `plugins.entries.memory-core.subagent.allowModelOverride: true`. Untuk membatasinya, tetapkan juga `plugins.entries.memory-core.subagent.allowedModels`. Kegagalan trust atau allowlist tetap terlihat, bukan fallback diam-diam; percobaan ulang hanya mencakup error model-tidak-tersedia.
</Warning>

<Note>
Sebagian besar kebijakan fase, ambang batas, dan perilaku penyimpanan adalah detail implementasi internal. Lihat [Referensi konfigurasi memori](/id/reference/memory-config#dreaming) untuk daftar key lengkap.
</Note>

## UI Dreams

Saat diaktifkan, tab Gateway **Dreams** menampilkan:

- status Dreaming aktif saat ini
- status tingkat fase dan keberadaan sweep terkelola
- jumlah jangka pendek, berdasar bukti, sinyal, dan dipromosikan-hari-ini
- waktu jalan terjadwal berikutnya
- jalur Scene berdasar bukti yang berbeda untuk entri pemutaran ulang historis yang disiapkan
- pembaca Buku Harian Mimpi yang dapat diperluas, didukung oleh `doctor.memory.dreamDiary`

## Dreaming tidak pernah berjalan: status menampilkan diblokir

Jika `openclaw memory status` melaporkan `Dreaming status: blocked`, cron terkelola ada tetapi heartbeat agen default tidak berjalan. Periksa bahwa heartbeat diaktifkan untuk agen default dan targetnya bukan `none`, lalu jalankan `openclaw memory status --deep` lagi setelah interval heartbeat berikutnya.

## Terkait

- [Memori](/id/concepts/memory)
- [CLI Memori](/id/cli/memory)
- [Referensi konfigurasi memori](/id/reference/memory-config)
- [Pencarian memori](/id/concepts/memory-search)
