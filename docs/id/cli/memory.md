---
read_when:
    - Anda ingin mengindeks atau mencari memori semantik
    - Anda sedang men-debug ketersediaan memori atau pengindeksan
    - Anda ingin mempromosikan memori jangka pendek yang diingat kembali menjadi `MEMORY.md`
summary: Referensi CLI untuk `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Memori
x-i18n:
    generated_at: "2026-06-30T14:25:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74b85d7299cc12e6133a10678f7c8fe17ee704e029993aebea417727ba94e629
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Kelola pengindeksan dan pencarian memori semantik.
Disediakan oleh Plugin bawaan `memory-core`. Perintah tersedia ketika
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

- `--agent <id>`: batasi cakupan ke satu agen. Tanpanya, perintah ini berjalan untuk setiap agen yang dikonfigurasi; jika tidak ada daftar agen yang dikonfigurasi, perintah beralih ke agen default.
- `--verbose`: keluarkan log mendetail selama probe dan pengindeksan.

`memory status`:

- `--deep`: probe kesiapan vector-store lokal, kesiapan penyedia embedding, dan kesiapan pencarian vektor semantik. `memory status` biasa tetap cepat dan tidak menjalankan embedding live atau pekerjaan penemuan penyedia; status vector-store atau vektor semantik yang tidak diketahui berarti status itu tidak diprobe dalam perintah tersebut. Leksikal QMD `searchMode: "search"` melewati probe vektor semantik dan pemeliharaan embedding bahkan dengan `--deep`.
- `--index`: jalankan pengindeksan ulang jika store kotor (menyiratkan `--deep`).
- `--fix`: perbaiki kunci recall yang usang dan normalkan metadata promosi.
- `--json`: cetak keluaran JSON.

Jika `memory status` menampilkan `Dreaming status: blocked`, Cron Dreaming terkelola diaktifkan tetapi Heartbeat yang menggerakkannya tidak berjalan untuk agen default. Lihat [Dreaming tidak pernah berjalan](/id/concepts/dreaming#dreaming-never-runs-status-shows-blocked) untuk dua penyebab umum.

`memory index`:

- `--force`: paksa pengindeksan ulang penuh.

`memory search`:

- Input kueri: berikan salah satu dari `[query]` posisional atau `--query <text>`.
- Jika keduanya diberikan, `--query` menang.
- Jika tidak ada yang diberikan, perintah keluar dengan error.
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

- Memeringkat kandidat jangka pendek dari `memory/YYYY-MM-DD.md` menggunakan sinyal promosi berbobot (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Menggunakan sinyal jangka pendek dari recall memori dan pass ingest harian, ditambah sinyal penguatan fase ringan/REM.
- Ketika Dreaming diaktifkan, `memory-core` mengelola otomatis satu pekerjaan Cron yang menjalankan sweep penuh (`light -> REM -> deep`) di latar belakang (tidak perlu `openclaw cron add` manual).
- `--agent <id>`: batasi cakupan ke satu agen (default: agen default).
- `--limit <n>`: kandidat maksimum untuk dikembalikan/diterapkan.
- `--min-score <n>`: skor promosi berbobot minimum.
- `--min-recall-count <n>`: jumlah recall minimum yang diperlukan untuk kandidat.
- `--min-unique-queries <n>`: jumlah kueri berbeda minimum yang diperlukan untuk kandidat.
- `--apply`: tambahkan kandidat terpilih ke `MEMORY.md` dan tandai sebagai dipromosikan.
- `--include-promoted`: sertakan kandidat yang sudah dipromosikan dalam keluaran.
- `--json`: cetak keluaran JSON.

`memory promote-explain`:

Jelaskan kandidat promosi tertentu dan rincian skornya.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: kunci kandidat, fragmen path, atau fragmen cuplikan untuk dicari.
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
fase kooperatif: **light** (menyortir/menyiapkan materi jangka pendek), **deep** (mempromosikan
fakta tahan lama ke `MEMORY.md`), dan **REM** (merefleksikan dan memunculkan tema).

- Aktifkan dengan `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Alihkan dari chat dengan `/dreaming on|off` (atau periksa dengan `/dreaming status`).
  Pemanggil channel harus merupakan owner untuk mengubah pengaturan; klien Gateway memerlukan
  `operator.admin`. Status baca-saja dan bantuan tetap tersedia bagi
  pengirim perintah yang berwenang.
- Dreaming berjalan pada satu jadwal sweep terkelola (`dreaming.frequency`) dan mengeksekusi fase secara berurutan: light, REM, deep.
- Hanya fase deep yang menulis memori tahan lama ke `MEMORY.md`.
- Keluaran fase yang dapat dibaca manusia dan entri diary ditulis ke `DREAMS.md` (atau `dreams.md` yang sudah ada), dengan laporan per fase opsional di `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Pemeringkatan menggunakan sinyal berbobot: frekuensi recall, relevansi retrieval, keragaman kueri, kebaruan temporal, konsolidasi lintas hari, dan kekayaan konsep turunan.
- Promosi membaca ulang catatan harian live sebelum menulis ke `MEMORY.md`, sehingga cuplikan jangka pendek yang diedit atau dihapus tidak dipromosikan dari snapshot recall-store yang usang.
- Proses terjadwal dan manual `memory promote` berbagi default fase deep yang sama kecuali Anda memberikan override ambang CLI.
- Proses otomatis menyebar ke seluruh workspace memori yang dikonfigurasi.

Penjadwalan default:

- **Irama sweep**: `dreaming.frequency = 0 3 * * *`
- **Ambang deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

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
- Jika field kunci API jarak jauh Active Memory yang efektif dikonfigurasi sebagai SecretRefs, perintah menyelesaikan nilai tersebut dari snapshot Gateway aktif. Jika Gateway tidak tersedia, perintah gagal cepat.
- Catatan skew versi Gateway: jalur perintah ini memerlukan Gateway yang mendukung `secrets.resolve`; Gateway lama mengembalikan error unknown-method.
- Sesuaikan irama sweep terjadwal dengan `dreaming.frequency`. Kebijakan promosi deep selain itu bersifat internal kecuali `dreaming.phases.deep.maxPromotedSnippetTokens`, yang membatasi panjang cuplikan yang dipromosikan sambil tetap membuat provenance terlihat. Gunakan flag CLI pada `memory promote` saat Anda memerlukan override ambang manual sekali pakai.
- `memory rem-harness --path <file-or-dir> --grounded` mempratinjau `What Happened`, `Reflections`, dan `Possible Lasting Updates` yang grounded dari catatan harian historis tanpa menulis apa pun.
- `memory rem-backfill --path <file-or-dir>` menulis entri diary grounded yang dapat dibalik ke `DREAMS.md` untuk peninjauan UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` juga menyemai kandidat tahan lama yang grounded ke store promosi jangka pendek live agar fase deep normal dapat memeringkatnya.
- `memory rem-backfill --rollback` menghapus entri diary grounded yang sebelumnya ditulis, dan `memory rem-backfill --rollback-short-term` menghapus kandidat jangka pendek grounded yang sebelumnya disiapkan.
- Lihat [Dreaming](/id/concepts/dreaming) untuk deskripsi fase lengkap dan referensi konfigurasi.

## Terkait

- [Referensi CLI](/id/cli)
- [Ikhtisar memori](/id/concepts/memory)
