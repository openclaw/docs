---
read_when:
    - Anda ingin mengindeks atau mencari memori semantik
    - Anda sedang men-debug ketersediaan atau pengindeksan memori
    - Anda ingin mempromosikan memori jangka pendek yang dipanggil kembali ke `MEMORY.md`
summary: Referensi CLI untuk `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Memori
x-i18n:
    generated_at: "2026-04-24T09:01:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bcb1af05ecddceef7cd1d3244c8f0e4fc740d6d41fc5e9daa37177d1bfe3674
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Kelola pengindeksan dan pencarian memori semantik.
Disediakan oleh Plugin memori aktif (default: `memory-core`; setel `plugins.slots.memory = "none"` untuk menonaktifkan).

Terkait:

- Konsep memori: [Memory](/id/concepts/memory)
- Wiki memori: [Memory Wiki](/id/plugins/memory-wiki)
- CLI wiki: [wiki](/id/cli/wiki)
- Plugins: [Plugins](/id/tools/plugin)

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

- `--agent <id>`: cakup ke satu agen. Tanpanya, perintah ini berjalan untuk setiap agen yang dikonfigurasi; jika tidak ada daftar agen yang dikonfigurasi, perintah akan kembali ke agen default.
- `--verbose`: keluarkan log terperinci selama probe dan pengindeksan.

`memory status`:

- `--deep`: probe ketersediaan vektor + embedding.
- `--index`: jalankan pengindeksan ulang jika store kotor (mengimplikasikan `--deep`).
- `--fix`: perbaiki recall lock yang basi dan normalkan metadata promosi.
- `--json`: cetak output JSON.

Jika `memory status` menampilkan `Dreaming status: blocked`, Cron Dreaming terkelola diaktifkan tetapi Heartbeat yang menggerakkannya tidak berjalan untuk agen default. Lihat [Dreaming never runs](/id/concepts/dreaming#dreaming-never-runs-status-shows-blocked) untuk dua penyebab umum.

`memory index`:

- `--force`: paksa pengindeksan ulang penuh.

`memory search`:

- Input kueri: berikan `[query]` posisi atau `--query <text>`.
- Jika keduanya diberikan, `--query` yang diprioritaskan.
- Jika tidak ada yang diberikan, perintah keluar dengan error.
- `--agent <id>`: cakup ke satu agen (default: agen default).
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
- `--include-promoted` -- sertakan entri yang sudah dipromosikan pada siklus sebelumnya.

Opsi lengkap:

- Memberi peringkat kandidat jangka pendek dari `memory/YYYY-MM-DD.md` menggunakan sinyal promosi berbobot (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Menggunakan sinyal jangka pendek dari recall memori dan proses ingest harian, ditambah sinyal penguatan fase light/REM.
- Saat Dreaming diaktifkan, `memory-core` otomatis mengelola satu Cron job yang menjalankan sapuan penuh (`light -> REM -> deep`) di latar belakang (tidak perlu `openclaw cron add` manual).
- `--agent <id>`: cakup ke satu agen (default: agen default).
- `--limit <n>`: jumlah maksimum kandidat yang akan dikembalikan/diterapkan.
- `--min-score <n>`: skor promosi berbobot minimum.
- `--min-recall-count <n>`: jumlah recall minimum yang diperlukan untuk kandidat.
- `--min-unique-queries <n>`: jumlah kueri berbeda minimum yang diperlukan untuk kandidat.
- `--apply`: tambahkan kandidat terpilih ke `MEMORY.md` dan tandai sebagai sudah dipromosikan.
- `--include-promoted`: sertakan kandidat yang sudah dipromosikan dalam output.
- `--json`: cetak output JSON.

`memory promote-explain`:

Jelaskan kandidat promosi tertentu dan rincian skornya.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: kunci kandidat, fragmen path, atau fragmen cuplikan untuk dicari.
- `--agent <id>`: cakup ke satu agen (default: agen default).
- `--include-promoted`: sertakan kandidat yang sudah dipromosikan.
- `--json`: cetak output JSON.

`memory rem-harness`:

Pratinjau refleksi REM, kandidat truth, dan output promosi deep tanpa menulis apa pun.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: cakup ke satu agen (default: agen default).
- `--include-promoted`: sertakan kandidat deep yang sudah dipromosikan.
- `--json`: cetak output JSON.

## Dreaming

Dreaming adalah sistem konsolidasi memori latar belakang dengan tiga fase
kooperatif: **light** (mengurutkan/menahapkan materi jangka pendek), **deep** (mempromosikan
fakta tahan lama ke `MEMORY.md`), dan **REM** (merefleksikan dan menampilkan tema).

- Aktifkan dengan `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Ubah dari obrolan dengan `/dreaming on|off` (atau periksa dengan `/dreaming status`).
- Dreaming berjalan pada satu jadwal sapuan terkelola (`dreaming.frequency`) dan mengeksekusi fase secara berurutan: light, REM, deep.
- Hanya fase deep yang menulis memori tahan lama ke `MEMORY.md`.
- Output fase yang dapat dibaca manusia dan entri diari ditulis ke `DREAMS.md` (atau `dreams.md` yang sudah ada), dengan laporan opsional per fase di `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Pemeringkatan menggunakan sinyal berbobot: frekuensi recall, relevansi pengambilan, keragaman kueri, recency temporal, konsolidasi lintas hari, dan kekayaan konseptual turunan.
- Promosi membaca ulang catatan harian live sebelum menulis ke `MEMORY.md`, sehingga cuplikan jangka pendek yang diedit atau dihapus tidak dipromosikan dari snapshot recall-store yang basi.
- Eksekusi `memory promote` terjadwal dan manual berbagi default fase deep yang sama kecuali Anda memberikan override ambang CLI.
- Eksekusi otomatis menyebar ke seluruh workspace memori yang dikonfigurasi.

Penjadwalan default:

- **Kadens sapuan**: `dreaming.frequency = 0 3 * * *`
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

- `memory index --verbose` mencetak detail per fase (provider, model, sumber, aktivitas batch).
- `memory status` mencakup path tambahan apa pun yang dikonfigurasi melalui `memorySearch.extraPaths`.
- Jika field API key remote memori aktif yang efektif dikonfigurasi sebagai SecretRef, perintah akan me-resolve nilai tersebut dari snapshot Gateway aktif. Jika Gateway tidak tersedia, perintah gagal cepat.
- Catatan skew versi Gateway: jalur perintah ini memerlukan Gateway yang mendukung `secrets.resolve`; Gateway lama mengembalikan error unknown-method.
- Atur kadens sapuan terjadwal dengan `dreaming.frequency`. Kebijakan promosi deep selain itu bersifat internal; gunakan flag CLI pada `memory promote` saat Anda memerlukan override manual sekali pakai.
- `memory rem-harness --path <file-or-dir> --grounded` mempratinjau `What Happened`, `Reflections`, dan `Possible Lasting Updates` yang ter-grounded dari catatan harian historis tanpa menulis apa pun.
- `memory rem-backfill --path <file-or-dir>` menulis entri diari grounded yang dapat dibalik ke `DREAMS.md` untuk tinjauan UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` juga menanam kandidat tahan lama grounded ke store promosi jangka pendek live agar fase deep normal dapat memberi peringkat pada kandidat tersebut.
- `memory rem-backfill --rollback` menghapus entri diari grounded yang sebelumnya ditulis, dan `memory rem-backfill --rollback-short-term` menghapus kandidat jangka pendek grounded yang sebelumnya ditahapkan.
- Lihat [Dreaming](/id/concepts/dreaming) untuk deskripsi fase lengkap dan referensi konfigurasi.

## Terkait

- [Referensi CLI](/id/cli)
- [Ikhtisar Memory](/id/concepts/memory)
