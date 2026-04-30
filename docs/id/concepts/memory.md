---
read_when:
    - Anda ingin memahami cara kerja memori
    - Anda ingin mengetahui file memori apa yang harus ditulis
summary: Cara OpenClaw mengingat berbagai hal lintas sesi
title: Ikhtisar memori
x-i18n:
    generated_at: "2026-04-30T09:43:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecf6cf2c95ce3ee78d62923e795f16957088f0eb6620ed50647cff05b99bd572
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw mengingat berbagai hal dengan menulis **file Markdown biasa** di workspace
agent Anda. Model hanya "mengingat" apa yang disimpan ke disk — tidak ada
state tersembunyi.

## Cara kerjanya

Agent Anda memiliki tiga file terkait memori:

- **`MEMORY.md`** — memori jangka panjang. Fakta, preferensi, dan keputusan
  yang tahan lama. Dimuat pada awal setiap sesi DM.
- **`memory/YYYY-MM-DD.md`** — catatan harian. Konteks dan observasi yang
  sedang berjalan. Catatan hari ini dan kemarin dimuat otomatis.
- **`DREAMS.md`** (opsional) — Dream Diary dan ringkasan sweep dreaming
  untuk tinjauan manusia, termasuk entri backfill historis yang berbasis bukti.

File-file ini berada di workspace agent (default `~/.openclaw/workspace`).

<Tip>
Jika Anda ingin agent mengingat sesuatu, cukup minta: "Ingat bahwa saya
lebih suka TypeScript." Agent akan menuliskannya ke file yang sesuai.
</Tip>

## Komitmen yang diinferensikan

Sebagian tindak lanjut di masa depan bukan fakta yang tahan lama. Jika Anda menyebut wawancara
besok, memori yang berguna mungkin berupa "tanyakan kabar setelah wawancara," bukan "simpan
ini selamanya di `MEMORY.md`."

[Commitments](/id/concepts/commitments) adalah memori tindak lanjut opt-in dan berumur pendek
untuk kasus tersebut. OpenClaw menginferensikannya dalam pass latar belakang tersembunyi,
mencakupnya ke agent dan channel yang sama, dan mengirim check-in yang jatuh tempo melalui Heartbeat.
Pengingat eksplisit tetap menggunakan [tugas terjadwal](/id/automation/cron-jobs).

## Tool memori

Agent memiliki dua tool untuk bekerja dengan memori:

- **`memory_search`** — menemukan catatan relevan menggunakan pencarian semantik, bahkan saat
  susunan katanya berbeda dari aslinya.
- **`memory_get`** — membaca file memori tertentu atau rentang baris.

Kedua tool disediakan oleh Plugin Active Memory (default: `memory-core`).

## Plugin pendamping Memory Wiki

Jika Anda ingin memori tahan lama berperilaku lebih seperti basis pengetahuan yang dipelihara daripada
sekadar catatan mentah, gunakan Plugin bawaan `memory-wiki`.

`memory-wiki` mengompilasi pengetahuan tahan lama ke dalam vault wiki dengan:

- struktur halaman deterministik
- klaim dan bukti terstruktur
- pelacakan kontradiksi dan kebaruan
- dasbor yang dihasilkan
- digest terkompilasi untuk konsumen agent/runtime
- tool native wiki seperti `wiki_search`, `wiki_get`, `wiki_apply`, dan `wiki_lint`

Ini tidak menggantikan Plugin Active Memory. Plugin Active Memory tetap
memiliki recall, promosi, dan dreaming. `memory-wiki` menambahkan lapisan
pengetahuan kaya provenance di sampingnya.

Lihat [Memory Wiki](/id/plugins/memory-wiki).

## Pencarian memori

Saat penyedia embedding dikonfigurasi, `memory_search` menggunakan **pencarian
hybrid** — menggabungkan kemiripan vektor (makna semantik) dengan pencocokan kata kunci
(istilah persis seperti ID dan simbol kode). Ini berfungsi langsung setelah Anda memiliki
kunci API untuk penyedia mana pun yang didukung.

<Info>
OpenClaw mendeteksi otomatis penyedia embedding Anda dari kunci API yang tersedia. Jika Anda
memiliki kunci OpenAI, Gemini, Voyage, atau Mistral yang dikonfigurasi, pencarian memori
diaktifkan otomatis.
</Info>

Untuk detail tentang cara kerja pencarian, opsi tuning, dan penyiapan penyedia, lihat
[Memory Search](/id/concepts/memory-search).

## Backend memori

<CardGroup cols={3}>
<Card title="Bawaan (default)" icon="database" href="/id/concepts/memory-builtin">
Berbasis SQLite. Berfungsi langsung dengan pencarian kata kunci, kemiripan vektor, dan
pencarian hybrid. Tidak ada dependensi tambahan.
</Card>
<Card title="QMD" icon="search" href="/id/concepts/memory-qmd">
Sidecar local-first dengan reranking, ekspansi kueri, dan kemampuan mengindeks
direktori di luar workspace.
</Card>
<Card title="Honcho" icon="brain" href="/id/concepts/memory-honcho">
Memori lintas sesi native AI dengan pemodelan pengguna, pencarian semantik, dan
kesadaran multi-agent. Instalasi Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/id/plugins/memory-lancedb">
Memori bawaan berbasis LanceDB dengan embedding yang kompatibel dengan OpenAI, auto-recall,
auto-capture, dan dukungan embedding Ollama lokal.
</Card>
</CardGroup>

## Lapisan wiki pengetahuan

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/id/plugins/memory-wiki">
Mengompilasi memori tahan lama ke dalam vault wiki kaya provenance dengan klaim,
dasbor, mode bridge, dan workflow yang ramah Obsidian.
</Card>
</CardGroup>

## Flush memori otomatis

Sebelum [Compaction](/id/concepts/compaction) meringkas percakapan Anda, OpenClaw
menjalankan turn senyap yang mengingatkan agent untuk menyimpan konteks penting ke file
memori. Ini aktif secara default — Anda tidak perlu mengonfigurasi apa pun.

Agar turn housekeeping tersebut tetap berjalan pada model lokal, tetapkan override model
flush memori yang persis:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

Override hanya berlaku untuk turn flush memori dan tidak mewarisi rantai fallback
sesi aktif.

<Tip>
Flush memori mencegah kehilangan konteks selama Compaction. Jika agent Anda memiliki
fakta penting dalam percakapan yang belum ditulis ke file, fakta tersebut
akan disimpan otomatis sebelum ringkasan terjadi.
</Tip>

## Dreaming

Dreaming adalah pass konsolidasi latar belakang opsional untuk memori. Ini mengumpulkan
sinyal jangka pendek, memberi skor kandidat, dan hanya mempromosikan item yang memenuhi syarat ke
memori jangka panjang (`MEMORY.md`).

Ini dirancang untuk menjaga memori jangka panjang tetap bernilai tinggi:

- **Opt-in**: dinonaktifkan secara default.
- **Terjadwal**: saat diaktifkan, `memory-core` otomatis mengelola satu pekerjaan Cron berulang
  untuk sweep dreaming penuh.
- **Berambang**: promosi harus melewati gerbang skor, frekuensi recall, dan
  keragaman kueri.
- **Dapat ditinjau**: ringkasan fase dan entri diary ditulis ke `DREAMS.md`
  untuk tinjauan manusia.

Untuk perilaku fase, sinyal scoring, dan detail Dream Diary, lihat
[Dreaming](/id/concepts/dreaming).

## Backfill berbasis bukti dan promosi live

Sistem dreaming sekarang memiliki dua jalur tinjauan yang terkait erat:

- **Live dreaming** bekerja dari penyimpanan dreaming jangka pendek di bawah
  `memory/.dreams/` dan inilah yang digunakan fase deep normal saat memutuskan apa
  yang dapat lulus ke `MEMORY.md`.
- **Backfill berbasis bukti** membaca catatan historis `memory/YYYY-MM-DD.md` sebagai
  file hari mandiri dan menulis output tinjauan terstruktur ke `DREAMS.md`.

Backfill berbasis bukti berguna saat Anda ingin memutar ulang catatan lama dan memeriksa apa
yang dianggap sistem sebagai tahan lama tanpa mengedit `MEMORY.md` secara manual.

Saat Anda menggunakan:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

kandidat tahan lama berbasis bukti tidak dipromosikan langsung. Kandidat tersebut distage ke
penyimpanan dreaming jangka pendek yang sama dengan yang sudah digunakan fase deep normal. Artinya:

- `DREAMS.md` tetap menjadi permukaan tinjauan manusia.
- penyimpanan jangka pendek tetap menjadi permukaan ranking yang dihadapi mesin.
- `MEMORY.md` masih hanya ditulis oleh promosi deep.

Jika Anda memutuskan bahwa replay tersebut tidak berguna, Anda dapat menghapus artefak yang distage
tanpa menyentuh entri diary biasa atau state recall normal:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## Bacaan lanjutan

- [Mesin memori bawaan](/id/concepts/memory-builtin): backend SQLite default.
- [Mesin memori QMD](/id/concepts/memory-qmd): sidecar local-first lanjutan.
- [Memori Honcho](/id/concepts/memory-honcho): memori lintas sesi native AI.
- [Memory LanceDB](/id/plugins/memory-lancedb): Plugin berbasis LanceDB dengan embedding yang kompatibel dengan OpenAI.
- [Memory Wiki](/id/plugins/memory-wiki): vault pengetahuan terkompilasi dan tool native wiki.
- [Pencarian memori](/id/concepts/memory-search): pipeline pencarian, penyedia, dan tuning.
- [Dreaming](/id/concepts/dreaming): promosi latar belakang dari recall jangka pendek ke memori jangka panjang.
- [Referensi konfigurasi memori](/id/reference/memory-config): semua knob konfigurasi.
- [Compaction](/id/concepts/compaction): cara Compaction berinteraksi dengan memori.

## Terkait

- [Active Memory](/id/concepts/active-memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Mesin memori bawaan](/id/concepts/memory-builtin)
- [Memori Honcho](/id/concepts/memory-honcho)
- [Memory LanceDB](/id/plugins/memory-lancedb)
- [Commitments](/id/concepts/commitments)
