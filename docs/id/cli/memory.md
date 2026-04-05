---
read_when:
    - Anda ingin mengindeks atau menelusuri memori semantik
    - Anda sedang men-debug ketersediaan memori atau pengindeksan
    - Anda ingin mempromosikan memori jangka pendek yang dipanggil kembali ke `MEMORY.md`
summary: Referensi CLI untuk `openclaw memory` (status/index/search/promote)
title: memory
x-i18n:
    generated_at: "2026-04-05T13:49:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: a89e3a819737bb63521128ae63d9e25b5cd9db35c3ea4606d087a8ad48b41eab
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Kelola pengindeksan dan penelusuran memori semantik.
Disediakan oleh plugin memori aktif (default: `memory-core`; setel `plugins.slots.memory = "none"` untuk menonaktifkan).

Terkait:

- Konsep Memory: [Memory](/concepts/memory)
- Plugins: [Plugins](/tools/plugin)

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
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Opsi

`memory status` dan `memory index`:

- `--agent <id>`: cakup ke satu agen. Tanpanya, perintah ini berjalan untuk setiap agen yang dikonfigurasi; jika tidak ada daftar agen yang dikonfigurasi, perintah ini kembali ke agen default.
- `--verbose`: keluarkan log terperinci selama probe dan pengindeksan.

`memory status`:

- `--deep`: periksa ketersediaan vector + embedding.
- `--index`: jalankan pengindeksan ulang jika penyimpanan kotor (mengimplikasikan `--deep`).
- `--fix`: perbaiki kunci recall yang usang dan normalkan metadata promosi.
- `--json`: cetak output JSON.

`memory index`:

- `--force`: paksa pengindeksan ulang penuh.

`memory search`:

- Input kueri: berikan `[query]` posisional atau `--query <text>`.
- Jika keduanya diberikan, `--query` akan digunakan.
- Jika tidak satu pun diberikan, perintah keluar dengan error.
- `--agent <id>`: cakup ke satu agen (default: agen default).
- `--max-results <n>`: batasi jumlah hasil yang dikembalikan.
- `--min-score <n>`: saring kecocokan dengan skor rendah.
- `--json`: cetak hasil JSON.

`memory promote`:

Pratinjau dan terapkan promosi memori jangka pendek.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- tulis promosi ke `MEMORY.md` (default: pratinjau saja).
- `--limit <n>` -- batasi jumlah kandidat yang ditampilkan.
- `--include-promoted` -- sertakan entri yang sudah dipromosikan pada siklus sebelumnya.

Opsi lengkap:

- Memberi peringkat kandidat jangka pendek dari `memory/YYYY-MM-DD.md` menggunakan sinyal recall berbobot (`frequency`, `relevance`, `query diversity`, `recency`).
- Menggunakan peristiwa recall yang ditangkap saat `memory_search` mengembalikan hit memori harian.
- Mode auto-dreaming opsional: saat `plugins.entries.memory-core.config.dreaming.mode` adalah `core`, `deep`, atau `rem`, `memory-core` mengelola otomatis sebuah cron job yang memicu promosi di latar belakang (tidak perlu `openclaw cron add` manual).
- `--agent <id>`: cakup ke satu agen (default: agen default).
- `--limit <n>`: jumlah maksimum kandidat yang dikembalikan/diterapkan.
- `--min-score <n>`: skor promosi berbobot minimum.
- `--min-recall-count <n>`: jumlah recall minimum yang diperlukan untuk kandidat.
- `--min-unique-queries <n>`: jumlah kueri berbeda minimum yang diperlukan untuk kandidat.
- `--apply`: tambahkan kandidat yang dipilih ke `MEMORY.md` dan tandai sebagai sudah dipromosikan.
- `--include-promoted`: sertakan kandidat yang sudah dipromosikan dalam output.
- `--json`: cetak output JSON.

## Dreaming (eksperimental)

Dreaming adalah proses refleksi semalam untuk memory. Disebut "dreaming" karena sistem meninjau kembali apa yang dipanggil kembali sepanjang hari dan memutuskan apa yang layak disimpan untuk jangka panjang.

- Ini bersifat opt-in dan dinonaktifkan secara default.
- Aktifkan dengan `plugins.entries.memory-core.config.dreaming.mode`.
- Anda dapat mengganti mode dari chat dengan `/dreaming off|core|rem|deep`. Jalankan `/dreaming` (atau `/dreaming options`) untuk melihat fungsi masing-masing mode.
- Saat diaktifkan, `memory-core` secara otomatis membuat dan memelihara cron job terkelola.
- Setel `dreaming.limit` ke `0` jika Anda ingin dreaming diaktifkan tetapi promosi otomatis secara efektif dijeda.
- Pemeringkatan menggunakan sinyal berbobot: frekuensi recall, relevansi pengambilan, keragaman kueri, dan recency temporal (recall terbaru meluruh seiring waktu).
- Promosi ke `MEMORY.md` hanya terjadi saat ambang kualitas terpenuhi, sehingga memori jangka panjang tetap bernilai tinggi alih-alih mengumpulkan detail sekali pakai.

Preset mode default:

- `core`: setiap hari pada `0 3 * * *`, `minScore=0.75`, `minRecallCount=3`, `minUniqueQueries=2`
- `deep`: setiap 12 jam (`0 */12 * * *`), `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`
- `rem`: setiap 6 jam (`0 */6 * * *`), `minScore=0.85`, `minRecallCount=4`, `minUniqueQueries=3`

Contoh:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "mode": "core"
          }
        }
      }
    }
  }
}
```

Catatan:

- `memory index --verbose` mencetak detail per fase (provider, model, sumber, aktivitas batch).
- `memory status` menyertakan jalur tambahan apa pun yang dikonfigurasi melalui `memorySearch.extraPaths`.
- Jika field kunci API jarak jauh memory yang aktif secara efektif dikonfigurasi sebagai SecretRef, perintah akan menyelesaikan nilai tersebut dari snapshot gateway aktif. Jika gateway tidak tersedia, perintah gagal dengan cepat.
- Catatan ketidaksesuaian versi gateway: jalur perintah ini memerlukan gateway yang mendukung `secrets.resolve`; gateway yang lebih lama mengembalikan error unknown-method.
- Cadence dreaming secara default mengikuti jadwal preset tiap mode. Ganti cadence dengan `plugins.entries.memory-core.config.dreaming.frequency` sebagai ekspresi cron (misalnya `0 3 * * *`) dan sesuaikan lebih lanjut dengan `timezone`, `limit`, `minScore`, `minRecallCount`, dan `minUniqueQueries`.
