---
read_when:
    - Anda ingin mengindeks atau mencari memori semantik
    - Anda sedang men-debug ketersediaan atau pengindeksan memori
    - Anda ingin memindahkan memori jangka pendek yang diingat ke `MEMORY.md`
summary: Referensi CLI untuk `openclaw memory` (status/index/search/promote/promote-explain/rem-harness/rem-backfill)
title: Memori
x-i18n:
    generated_at: "2026-07-12T14:05:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Kelola pengindeksan, pencarian, dan promosi memori semantik ke dalam `MEMORY.md`.
Disediakan oleh plugin bawaan `memory-core`, tersedia ketika
`plugins.slots.memory` memilih `memory-core` (default). Plugin memori lain
menyediakan namespace CLI mereka sendiri.

Terkait: konsep [Memori](/id/concepts/memory), [Dreaming](/id/concepts/dreaming),
[Referensi konfigurasi memori](/id/reference/memory-config), [Wiki Memori](/id/plugins/memory-wiki),
[wiki](/id/cli/wiki), [Plugin](/id/tools/plugin).

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

Tanpa `--agent`, dijalankan untuk setiap agen dalam `agents.list`; jika daftar agen
tidak dikonfigurasi, kembali menggunakan agen default.

| Flag        | Efek                                                                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | Periksa kesiapan penyimpanan vektor, penyedia embedding, dan pencarian semantik (mengakibatkan panggilan tambahan ke penyedia). `memory status` biasa tetap cepat dan melewati pemeriksaan ini; status vektor/semantik yang tidak diketahui berarti tidak diperiksa. `searchMode: "search"` leksikal QMD selalu melewati pemeriksaan vektor semantik, bahkan dengan `--deep`. |
| `--index`   | Indeks ulang jika penyimpanan kotor. Mengimplikasikan `--deep`.                                                                                                                                                                                                                                                          |
| `--fix`     | Perbaiki kunci pemanggilan kembali yang kedaluwarsa dan normalkan metadata promosi.                                                                                                                                                                                                                                               |
| `--json`    | Cetak JSON.                                                                                                                                                                                                                                                                                               |
| `--verbose` | Tampilkan log terperinci untuk setiap fase.                                                                                                                                                                                                                                                                             |

Jika baris `Dreaming` tetap `off` meskipun `dreaming.enabled: true`, atau
penyisiran terjadwal tampaknya tidak pernah berjalan, Cron dreaming terkelola bergantung pada
Heartbeat agen default yang aktif untuk memicu rekonsiliasi. Lihat
[Dreaming](/id/concepts/dreaming) untuk detail penjadwalan.

Status juga mencantumkan jalur pencarian tambahan dari `agents.defaults.memorySearch.extraPaths`.

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

Cakupan per agen sama seperti `status`. `--force` menjalankan pengindeksan ulang penuh, bukan
inkremental. `--verbose` mencetak detail penyedia, model, sumber, dan
jalur tambahan per agen sebelum menampilkan kemajuan pengindeksan.

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- Kueri: `[query]` posisional atau `--query <text>`. Jika keduanya ditetapkan, `--query`
  diutamakan. Jika tidak ada yang ditetapkan, perintah menghasilkan galat.
- `--agent <id>`: default-nya adalah agen default (bukan daftar agen lengkap).
- `--max-results <n>`: batasi jumlah hasil (bilangan bulat positif).
- `--min-score <n>`: saring kecocokan dengan skor di bawah nilai ini.

## `memory promote`

Beri peringkat kandidat jangka pendek dari `memory/YYYY-MM-DD.md` dan secara opsional tambahkan
entri teratas ke `MEMORY.md`.

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| Flag                       | Default      | Efek                                                            |
| -------------------------- | ------------ | ----------------------------------------------------------------- |
| `--limit <n>`              |              | Jumlah maksimum kandidat yang dikembalikan/diterapkan.                                   |
| `--min-score <n>`          | `0.75`       | Skor promosi berbobot minimum.                                 |
| `--min-recall-count <n>`   | `3`          | Jumlah pemanggilan kembali minimum yang diperlukan.                                    |
| `--min-unique-queries <n>` | `2`          | Jumlah minimum kueri berbeda yang diperlukan.                            |
| `--apply`                  | hanya pratinjau | Tambahkan kandidat terpilih ke `MEMORY.md` dan tandai sebagai telah dipromosikan. |
| `--include-promoted`       |              | Sertakan kandidat yang telah dipromosikan dalam siklus sebelumnya.           |
| `--json`                   |              | Cetak JSON.                                                       |

Default CLI ini berbeda dari ambang fase mendalam pada penyisiran dreaming terjadwal
(lihat [Dreaming](#dreaming) di bawah); berikan flag secara eksplisit agar sesuai dengan
perilaku penyisiran untuk sekali jalan secara manual.

Sinyal pemeringkatan: frekuensi pemanggilan kembali, relevansi pengambilan, keragaman kueri,
keterkinian temporal, konsolidasi lintas hari, dan kekayaan konsep turunan, yang diambil
dari pemanggilan kembali memori dan proses penyerapan harian, ditambah penguatan ringan
fase ringan/REM untuk kunjungan ulang dreaming yang berulang. Sebelum menulis, promosi
membaca ulang catatan harian aktif, sehingga pengeditan atau penghapusan cuplikan jangka pendek
sejak pemeringkatan tetap dihormati, alih-alih mempromosikan dari snapshot yang kedaluwarsa.

## `memory promote-explain`

Jelaskan rincian skor satu kandidat promosi.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` mencocokkan kunci kandidat (persis atau substring), jalur, atau teks
cuplikan.

## `memory rem-harness`

Pratinjau refleksi REM, kandidat kebenaran, dan keluaran promosi fase mendalam
tanpa menulis apa pun.

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`: inisialisasi harness dari berkas harian historis
  `YYYY-MM-DD.md`, bukan dari ruang kerja aktif.
- `--grounded`: tampilkan juga pratinjau `Apa yang Terjadi` / `Refleksi` /
  `Kemungkinan Pembaruan Permanen` yang didasarkan pada catatan historis.

## `memory rem-backfill`

Tulis ringkasan REM historis yang didasarkan pada bukti ke dalam `DREAMS.md` untuk ditinjau di UI.
Dapat dibatalkan.

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`: wajib kecuali `--rollback`/`--rollback-short-term`
  ditetapkan. Berkas memori harian historis atau direktori sumber pengisian ulang.
- `--stage-short-term`: inisialisasi juga kandidat permanen berbasis bukti ke dalam
  penyimpanan promosi jangka pendek aktif agar fase mendalam normal dapat memeringkatnya.
- `--rollback`: hapus entri buku harian berbasis bukti yang sebelumnya ditulis dari
  `DREAMS.md`.
- `--rollback-short-term`: hapus kandidat jangka pendek berbasis bukti yang sebelumnya
  disiapkan.

## Dreaming

Dreaming adalah sistem konsolidasi memori latar belakang dengan tiga fase yang bekerja sama,
dijalankan secara berurutan dalam satu jadwal: **ringan** (mengurutkan/menyiapkan materi
jangka pendek), **REM** (merefleksikan dan memunculkan tema), **mendalam** (mempromosikan fakta
permanen ke `MEMORY.md`). Hanya fase mendalam yang menulis ke `MEMORY.md`.

- Aktifkan dengan `plugins.entries.memory-core.config.dreaming.enabled: true`
  (default `false`); `memory-core` mengelola otomatis tugas Cron penyisiran, tanpa perlu
  menjalankan `openclaw cron add` secara manual.
- Aktifkan atau nonaktifkan dari obrolan dengan `/dreaming on|off`; periksa dengan `/dreaming status`
  (atau `/dreaming`/`/dreaming help`). `on`/`off` memerlukan status pemilik kanal
  atau `operator.admin` Gateway; `status` dan bantuan tetap tersedia bagi siapa pun yang
  dapat menjalankan perintah tersebut.
- Keluaran fase yang mudah dibaca manusia disimpan ke `DREAMS.md` (atau `dreams.md` yang sudah ada).
  Secara default (`dreaming.storage.mode: "separate"`), setiap fase juga menulis
  laporan mandiri ke `memory/dreaming/<phase>/YYYY-MM-DD.md`; tetapkan `mode:
"inline"` untuk menggabungkan laporan ke dalam berkas memori harian, atau `"both"`
  untuk keduanya.
- Proses terjadwal dan `memory promote` manual menggunakan sinyal pemeringkatan
  fase mendalam yang sama; hanya ambang default yang berbeda (lihat tabel di atas dan
  default terjadwal di bawah).
- Proses terjadwal tersebar ke ruang kerja memori setiap agen yang dikonfigurasi.

Default terjadwal (`plugins.entries.memory-core.config.dreaming`):

| Kunci                                  | Default     |
| -------------------------------------- | ----------- |
| `frequency`                            | `0 3 * * *` |
| `phases.deep.minScore`                 | `0.8`       |
| `phases.deep.minRecallCount`           | `3`         |
| `phases.deep.minUniqueQueries`         | `3`         |
| `phases.deep.recencyHalfLifeDays`      | `14`        |
| `phases.deep.maxAgeDays`               | `30`        |
| `phases.deep.maxPromotedSnippetTokens` | `160`       |

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

Daftar kunci lengkap dan detail fase: [Dreaming](/id/concepts/dreaming),
[Referensi konfigurasi memori](/id/reference/memory-config#dreaming).

## Dependensi Gateway SecretRef

Jika bidang kunci API jarak jauh memori aktif dikonfigurasi sebagai SecretRef, perintah `memory`
menguraikannya dari snapshot Gateway aktif; jika Gateway tidak tersedia,
perintah langsung gagal. Ini memerlukan Gateway yang mendukung metode
`secrets.resolve`; Gateway lama mengembalikan galat metode tidak dikenal.

## Terkait

- [Referensi CLI](/id/cli)
- [Ikhtisar memori](/id/concepts/memory)
