---
read_when:
    - Anda ingin promosi memori berjalan secara otomatis
    - Anda ingin memahami fungsi setiap fase dreaming
    - Anda ingin menyetel konsolidasi tanpa mencemari MEMORY.md
sidebarTitle: Dreaming
summary: Konsolidasi memori latar belakang dengan fase ringan, dalam, dan REM serta sebuah Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-07-16T17:59:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 501ab42cfdfa0216c308896aa8c1719b06b49d64a62afdb004e097102a376eac
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming adalah sistem konsolidasi memori latar belakang di `memory-core`. Sistem ini memindahkan sinyal jangka pendek yang kuat ke memori tahan lama sekaligus menjaga prosesnya tetap dapat dijelaskan dan ditinjau.

<Note>
Dreaming bersifat **opsional** dan dinonaktifkan secara default.
</Note>

## Yang ditulis oleh Dreaming

- **Status mesin** di `memory/.dreams/` (penyimpanan pemanggilan kembali, sinyal fase, titik pemeriksaan penyerapan, kunci).
- **Keluaran yang dapat dibaca manusia** di `DREAMS.md` (atau `dreams.md` yang sudah ada) dan file laporan fase opsional di bawah `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promosi jangka panjang tetap hanya menulis ke `MEMORY.md`.

## Model fase

Dreaming menjalankan tiga fase kooperatif per penyapuan, secara berurutan: ringan -> REM -> mendalam. Ini adalah fase implementasi internal, bukan mode terpisah yang dikonfigurasi pengguna.

| Fase     | Tujuan                                           | Penulisan tahan lama |
| -------- | ------------------------------------------------ | -------------------- |
| Ringan   | Mengurutkan dan menyiapkan materi jangka pendek terbaru | Tidak           |
| REM      | Merefleksikan tema dan gagasan yang berulang     | Tidak                |
| Mendalam | Menilai dan mempromosikan kandidat tahan lama    | Ya (`MEMORY.md`) |

<AccordionGroup>
  <Accordion title="Fase ringan">
    - Membaca status pemanggilan kembali jangka pendek terbaru, file memori harian, dan transkrip sesi yang telah disunting jika tersedia.
    - Menghapus duplikasi sinyal dan menyiapkan baris kandidat.
    - Menulis blok `## Light Sleep` terkelola jika penyimpanan mencakup keluaran sebaris.
    - Mencatat sinyal penguatan untuk pemeringkatan mendalam berikutnya.
    - Tidak pernah menulis ke `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase REM">
    - Menyusun ringkasan tema dan refleksi dari jejak jangka pendek terbaru.
    - Menulis blok `## REM Sleep` terkelola jika penyimpanan mencakup keluaran sebaris.
    - Mencatat sinyal penguatan REM yang digunakan oleh pemeringkatan mendalam.
    - Tidak pernah menulis ke `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase mendalam">
    - Memeringkat kandidat dengan penilaian berbobot dan gerbang ambang batas (`minScore`, `minRecallCount`, `minUniqueQueries` semuanya harus lolos).
    - Memuat ulang cuplikan dari file harian aktif sebelum menulis, sehingga cuplikan usang/dihapus akan dilewati.
    - Menambahkan entri yang dipromosikan ke `MEMORY.md`.
    - Menulis ringkasan `## Deep Sleep` ke dalam `DREAMS.md` dan, secara opsional, `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
</AccordionGroup>

## Penyerapan transkrip sesi

Dreaming dapat menyerap transkrip sesi yang telah disunting ke dalam korpus Dreaming. Jika tersedia, transkrip memasok data ke fase ringan bersama sinyal memori harian dan jejak pemanggilan kembali. Konten pribadi dan sensitif disunting sebelum diserap.

## Buku Harian Mimpi

Dreaming menyimpan **Buku Harian Mimpi** naratif di `DREAMS.md`. Setelah setiap fase memiliki cukup materi, `memory-core` menjalankan giliran subagen latar belakang dengan upaya terbaik dan menambahkan entri harian singkat, menggunakan model runtime default kecuali `dreaming.model` dikonfigurasi. Jika model yang dikonfigurasi tidak tersedia, proses buku harian mencoba kembali satu kali dengan model default sesi; kegagalan kepercayaan atau daftar izin tidak dicoba kembali dan tetap terlihat dalam log, alih-alih beralih secara diam-diam ke entri buku harian generik.

<Note>
Buku harian ditujukan untuk dibaca manusia di UI Mimpi, bukan sebagai sumber promosi. Artefak buku harian/laporan dikecualikan dari promosi jangka pendek; hanya cuplikan memori yang memiliki landasan yang memenuhi syarat untuk dipromosikan ke `MEMORY.md`.
</Note>

Tersedia juga jalur pengisian ulang historis berlandasan untuk pekerjaan peninjauan dan pemulihan:

<AccordionGroup>
  <Accordion title="Perintah pengisian ulang">
    - `memory rem-harness --path ... --grounded` menampilkan pratinjau keluaran buku harian berlandasan dari catatan historis `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` menulis entri buku harian berlandasan yang dapat dibatalkan ke dalam `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` menyiapkan kandidat tahan lama berlandasan ke penyimpanan bukti jangka pendek yang sama dengan yang digunakan fase mendalam normal.
    - `memory rem-backfill --rollback` dan `--rollback-short-term` menghapus artefak pengisian ulang yang telah disiapkan tersebut tanpa menyentuh entri buku harian biasa atau pemanggilan kembali jangka pendek aktif.

  </Accordion>
</AccordionGroup>

UI Kontrol menyediakan alur pengisian ulang/pengaturan ulang buku harian yang sama pada tab Memori agen (halaman Agen), sehingga Anda dapat memeriksa hasil dalam adegan mimpi sebelum memutuskan apakah kandidat berlandasan layak dipromosikan. Jalur Adegan berlandasan yang terpisah menunjukkan entri jangka pendek yang disiapkan dari pemutaran ulang historis, item yang dipromosikan dengan landasan sebagai faktor utama, dan memungkinkan Anda menghapus hanya entri berlandasan yang telah disiapkan tanpa menyentuh status jangka pendek aktif.

## Sinyal pemeringkatan mendalam

Pemeringkatan mendalam menggunakan enam sinyal dasar berbobot ditambah penguatan fase:

| Sinyal               | Bobot | Deskripsi                                               |
| -------------------- | ----- | ------------------------------------------------------- |
| Relevansi            | 0.30  | Rata-rata kualitas pengambilan untuk entri              |
| Frekuensi            | 0.24  | Jumlah sinyal jangka pendek yang dikumpulkan entri      |
| Keragaman kueri      | 0.15  | Konteks kueri/hari berbeda yang memunculkannya          |
| Kebaruan             | 0.15  | Skor kesegaran yang berkurang seiring waktu             |
| Konsolidasi          | 0.10  | Kekuatan pengulangan selama beberapa hari               |
| Kekayaan konseptual  | 0.06  | Kepadatan tag konsep dari cuplikan/jalur                |

Kemunculan pada fase ringan dan REM menambahkan peningkatan kecil yang berkurang seiring waktu dari `memory/.dreams/phase-signals.json`.

Hasil uji bayangan dapat diterapkan di atas skor dasar sebagai sinyal peninjauan sebelum penulisan tahan lama apa pun: uji yang membantu memberi kandidat peningkatan kecil dan terbatas, uji netral membuatnya tetap ditangguhkan, dan uji yang merugikan menandainya sebagai ditolak untuk proses penilaian tersebut. Sinyal ini hanya untuk laporan - sinyal dapat mengubah urutan kandidat atau metadata peninjauan, tetapi tidak pernah menulis ke `MEMORY.md` atau mempromosikan kandidat dengan sendirinya.

### Cakupan laporan uji bayangan QA

Lab QA mencakup skenario khusus laporan untuk mengeksplorasi bagaimana uji bayangan Dreaming mendatang dapat meninjau memori kandidat sebelum promosi: agen membandingkan jawaban dasar dengan jawaban yang dapat menggunakan memori kandidat, lalu menulis laporan lokal yang berisi putusan, alasan, dan penanda risiko. Cakupan ini dibatasi untuk QA - cakupan ini memverifikasi bahwa artefak laporan tetap terpisah dari `MEMORY.md` dan bahwa agen tidak pernah mengklaim kandidat telah dipromosikan. Cakupan ini tidak menambahkan perilaku uji bayangan produksi atau mengubah mesin promosi fase mendalam.

Pelaksana uji bayangan `memory-core` mempertahankan kontrak khusus laporan yang sama untuk jalur kode yang memerlukan artefak stabil. Pelaksana ini menerima kandidat, prompt uji, hasil dasar, hasil kandidat, putusan, alasan, penanda risiko, dan referensi bukti, lalu menulis laporan dengan `promotion action: report-only`. Putusan membantu dipetakan ke rekomendasi `promote`, putusan netral dipetakan ke `defer`, dan putusan merugikan dipetakan ke `reject` - tidak satu pun menulis ke `MEMORY.md` atau menerapkan promosi fase mendalam.

## Penjadwalan

Jika diaktifkan, `memory-core` mengelola secara otomatis satu tugas Cron untuk penyapuan Dreaming penuh, dengan duplikasi dihapus di seluruh ruang kerja runtime utama dan ruang kerja agen yang dikonfigurasi, sehingga penyebaran ruang kerja subagen tidak mengecualikan `DREAMS.md` dan status memori milik agen utama.

| Pengaturan             | Default       |
| ---------------------- | ------------- |
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
  <Tab title="Jadwal penyapuan khusus">
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

## Perintah garis miring

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` dan `/dreaming off` memerlukan status pemilik bagi pemanggil saluran atau `operator.admin` bagi klien Gateway. `/dreaming status` dan `/dreaming help` bersifat hanya baca.

## Alur kerja CLI

<Tabs>
  <Tab title="Pratinjau / penerapan promosi">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` manual menggunakan ambang batas fase mendalam secara default, kecuali ditimpa dengan flag CLI.

  </Tab>
  <Tab title="Jelaskan promosi">
    Jelaskan mengapa kandidat tertentu akan atau tidak akan dipromosikan:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Pratinjau harness REM">
    Pratinjau refleksi REM, kebenaran kandidat, dan keluaran promosi mendalam tanpa menulis apa pun:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Default utama

Semua pengaturan berada di bawah `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Aktifkan atau nonaktifkan penyapuan Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Jadwal Cron untuk penyapuan Dreaming penuh.
</ParamField>
<ParamField path="model" type="string">
  Penimpaan model subagen Buku Harian Mimpi opsional. Gunakan nilai `provider/model` kanonis jika juga menetapkan daftar izin `allowedModels` subagen.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Perkiraan jumlah token maksimum yang dipertahankan dari setiap cuplikan pemanggilan kembali jangka pendek yang dipromosikan ke `MEMORY.md`. Asal-usul pemeringkatan tetap terlihat.
</ParamField>

<Warning>
`dreaming.model` memerlukan `plugins.entries.memory-core.subagent.allowModelOverride: true`. Untuk membatasinya, tetapkan juga `plugins.entries.memory-core.subagent.allowedModels`. Percobaan ulang otomatis hanya mencakup kesalahan model tidak tersedia; kegagalan kepercayaan atau daftar izin tetap terlihat dalam log, alih-alih beralih secara diam-diam.
</Warning>

<Note>
Sebagian besar kebijakan fase, ambang batas, dan perilaku penyimpanan merupakan detail implementasi internal. Lihat [referensi konfigurasi Memori](/id/reference/memory-config#dreaming) untuk daftar kunci lengkap.
</Note>

## UI Mimpi

Jika diaktifkan, tab **Mimpi** Gateway menampilkan:

- status aktif Dreaming saat ini
- status tingkat fase dan keberadaan penyapuan terkelola
- jumlah jangka pendek, berlandasan, sinyal, dan yang dipromosikan hari ini
- waktu proses terjadwal berikutnya
- jalur Adegan berlandasan yang terpisah untuk entri pemutaran ulang historis yang telah disiapkan
- pembaca Buku Harian Mimpi yang dapat diperluas dan didukung oleh `doctor.memory.dreamDiary`

## Terkait

- [Memori](/id/concepts/memory)
- [CLI Memori](/id/cli/memory)
- [Referensi konfigurasi Memori](/id/reference/memory-config)
- [Pencarian memori](/id/concepts/memory-search)
