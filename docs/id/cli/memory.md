---
read_when:
    - Anda ingin mengindeks atau mencari memori semantik
    - Anda sedang men-debug ketersediaan memori atau pengindeksan
    - Anda ingin mempromosikan memori jangka pendek yang dipanggil kembali ke `MEMORY.md`
summary: Referensi CLI untuk `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Memori
x-i18n:
    generated_at: "2026-06-27T17:19:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 553c69ccc92d398e765a33bfadb8cc9a0bf9e0f86b319fb4fcff05464ebebe7c
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Kelola pengindeksan dan pencarian memori semantik.
Disediakan oleh Plugin bawaan `memory-core`. Perintah ini tersedia saat
`plugins.slots.memory` memilih `memory-core` (default); Plugin memori lain
mengekspos namespace CLI mereka sendiri.

Terkait:

- Konsep memori: [Memori](/id/concepts/memory)
- Wiki memori: [Wiki Memori](/id/plugins/memory-wiki)
- CLI wiki: [wiki](/id/cli/wiki)
- Plugin: [Plugin](/id/tools/plugin)

## Contoh

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Opsi

`memory status` dan `memory index`:

- `--agent <id>`: batasi cakupan ke satu agen. Tanpanya, perintah ini berjalan untuk setiap agen yang dikonfigurasi; jika tidak ada daftar agen yang dikonfigurasi, perintah akan kembali ke agen default.
- `--verbose`: keluarkan log terperinci selama pemeriksaan dan pengindeksan.

`memory status`:

- `--deep`: periksa kesiapan penyimpanan vektor lokal, kesiapan penyedia embedding, dan kesiapan pencarian vektor semantik. `memory status` biasa tetap cepat dan tidak menjalankan embedding langsung atau pekerjaan penemuan penyedia; status penyimpanan vektor atau vektor semantik yang tidak diketahui berarti status tersebut tidak diperiksa dalam perintah itu. `searchMode: "search"` leksikal QMD melewati pemeriksaan vektor semantik dan pemeliharaan embedding bahkan dengan `--deep`.
- `--index`: jalankan pengindeksan ulang jika penyimpanan kotor (mengimplikasikan `--deep`).
- `--fix`: perbaiki kunci recall yang usang dan normalkan metadata promosi.
- `--json`: cetak keluaran JSON.

Jika `memory status` menampilkan `Dreaming status: blocked`, Cron dreaming terkelola diaktifkan tetapi Heartbeat yang menggerakkannya tidak berjalan untuk agen default. Lihat [Dreaming tidak pernah berjalan](/id/concepts/dreaming#dreaming-never-runs-status-shows-blocked) untuk dua penyebab umum.

`memory index`:

- `--force`: paksa pengindeksan ulang penuh.

`memory search`:

- Input kueri: berikan `[query]` posisional atau `--query <text>`.
- Jika keduanya diberikan, `--query` menang.
- Jika tidak ada yang diberikan, perintah keluar dengan kesalahan.
- `--agent <id>`: batasi cakupan ke satu agen (default: agen default).
- `--max-results <n>`: batasi jumlah hasil yang dikembalikan.
- `--min-score <n>`: saring kecocokan dengan skor rendah.
- `--json`: cetak hasil JSON.

`memory promote`:

Pratinjau dan terapkan promosi memori jangka pendek.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- tulis promosi ke `MEMORY.md` (default: hanya pratinjau).
- `--limit <n>` -- batasi jumlah kandidat yang ditampilkan.
- `--include-promoted` -- sertakan entri yang sudah dipromosikan dalam siklus sebelumnya.

Opsi lengkap:

- Mengurutkan kandidat jangka pendek dari `memory/YYYY-MM-DD.md` menggunakan sinyal promosi berbobot (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Menggunakan sinyal jangka pendek dari recall memori dan lintasan ingesti harian, ditambah sinyal penguatan fase ringan/REM.
- Saat dreaming diaktifkan, `memory-core` mengelola otomatis satu tugas Cron yang menjalankan sapuan penuh (`light -> REM -> deep`) di latar belakang (tidak perlu `openclaw cron add` manual).
- `--agent <id>`: batasi cakupan ke satu agen (default: agen default).
- `--limit <n>`: kandidat maksimum untuk dikembalikan/diterapkan.
- `--min-score <n>`: skor promosi berbobot minimum.
- `--min-recall-count <n>`: jumlah recall minimum yang diperlukan untuk kandidat.
- `--min-unique-queries <n>`: jumlah kueri unik minimum yang diperlukan untuk kandidat.
- `--apply`: tambahkan kandidat terpilih ke `MEMORY.md` dan tandai sebagai dipromosikan.
- `--include-promoted`: sertakan kandidat yang sudah dipromosikan dalam keluaran.
- `--json`: cetak keluaran JSON.

`memory promote-explain`:

Jelaskan kandidat promosi tertentu dan rincian skornya.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: kunci kandidat, fragmen path, atau fragmen cuplikan yang akan dicari.
- `--agent <id>`: batasi cakupan ke satu agen (default: agen default).
- `--include-promoted`: sertakan kandidat yang sudah dipromosikan.
- `--json`: cetak keluaran JSON.

`memory rem-harness`:

Pratinjau refleksi REM, kebenaran kandidat, dan keluaran promosi mendalam tanpa menulis apa pun.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: batasi cakupan ke satu agen (default: agen default).
- `--include-promoted`: sertakan kandidat mendalam yang sudah dipromosikan.
- `--json`: cetak keluaran JSON.

## Dreaming

Dreaming adalah sistem konsolidasi memori latar belakang dengan tiga
fase kooperatif: **light** (mengurutkan/menyiapkan materi jangka pendek), **deep** (mempromosikan
fakta tahan lama ke `MEMORY.md`), dan **REM** (merefleksikan dan memunculkan tema).

- Aktifkan dengan `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Alihkan dari chat dengan `/dreaming on|off` (atau periksa dengan `/dreaming status`).
- Dreaming berjalan pada satu jadwal sapuan terkelola (`dreaming.frequency`) dan mengeksekusi fase secara berurutan: light, REM, deep.
- Hanya fase deep yang menulis memori tahan lama ke `MEMORY.md`.
- Keluaran fase yang dapat dibaca manusia dan entri buku harian ditulis ke `DREAMS.md` (atau `dreams.md` yang sudah ada), dengan laporan opsional per fase di `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Pemeringkatan menggunakan sinyal berbobot: frekuensi recall, relevansi pengambilan, keragaman kueri, kebaruan temporal, konsolidasi lintas hari, dan kekayaan konsep turunan.
- Promosi membaca ulang catatan harian langsung sebelum menulis ke `MEMORY.md`, sehingga cuplikan jangka pendek yang diedit atau dihapus tidak dipromosikan dari snapshot penyimpanan recall yang usang.
- Jalankan terjadwal dan manual `memory promote` berbagi default fase deep yang sama kecuali Anda memberikan penggantian ambang batas CLI.
- Jalankan otomatis menyebar ke seluruh ruang kerja memori yang dikonfigurasi.

Penjadwalan default:

- **Irama sapuan**: `dreaming.frequency = 0 3 * * *`
- **Ambang batas deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

Contoh:

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

Catatan:

- `memory index --verbose` mencetak detail per fase (penyedia, model, sumber, aktivitas batch).
- `memory status` menyertakan path tambahan apa pun yang dikonfigurasi melalui `memorySearch.extraPaths`.
- Jika field kunci API jarak jauh Active Memory yang efektif aktif dikonfigurasi sebagai SecretRefs, perintah menyelesaikan nilai tersebut dari snapshot Gateway aktif. Jika Gateway tidak tersedia, perintah gagal cepat.
- Catatan skew versi Gateway: path perintah ini memerlukan Gateway yang mendukung `secrets.resolve`; Gateway lama mengembalikan kesalahan metode tidak dikenal.
- Sesuaikan irama sapuan terjadwal dengan `dreaming.frequency`. Kebijakan promosi deep selain itu bersifat internal kecuali `dreaming.phases.deep.maxPromotedSnippetTokens`, yang membatasi panjang cuplikan yang dipromosikan sambil menjaga provenance tetap terlihat. Gunakan flag CLI pada `memory promote` saat Anda membutuhkan penggantian ambang batas manual satu kali.
- `memory rem-harness --path <file-or-dir> --grounded` mempratinjau `What Happened`, `Reflections`, dan `Possible Lasting Updates` yang grounded dari catatan harian historis tanpa menulis apa pun.
- `memory rem-backfill --path <file-or-dir>` menulis entri buku harian grounded yang dapat dibalik ke `DREAMS.md` untuk tinjauan UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` juga mengisi kandidat tahan lama grounded ke penyimpanan promosi jangka pendek langsung sehingga fase deep normal dapat memeringkatnya.
- `memory rem-backfill --rollback` menghapus entri buku harian grounded yang sebelumnya ditulis, dan `memory rem-backfill --rollback-short-term` menghapus kandidat jangka pendek grounded yang sebelumnya disiapkan.
- Lihat [Dreaming](/id/concepts/dreaming) untuk deskripsi fase lengkap dan referensi konfigurasi.

## Terkait

- [Referensi CLI](/id/cli)
- [Ikhtisar memori](/id/concepts/memory)
