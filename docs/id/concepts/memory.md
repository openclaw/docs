---
read_when:
    - Anda ingin memahami cara kerja memory
    - Anda ingin mengetahui file memory apa yang harus ditulis
summary: Bagaimana OpenClaw mengingat sesuatu di berbagai sesi
title: Ikhtisar Memory
x-i18n:
    generated_at: "2026-04-24T09:04:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 761eac6d5c125ae5734dbd654032884846706e50eb8ef7942cdb51b74a1e73d4
    source_path: concepts/memory.md
    workflow: 15
---

OpenClaw mengingat sesuatu dengan menulis **file Markdown biasa** di
workspace agen Anda. Model hanya "mengingat" apa yang disimpan ke disk -- tidak ada
status tersembunyi.

## Cara kerjanya

Agen Anda memiliki tiga file terkait memori:

- **`MEMORY.md`** -- memori jangka panjang. Fakta, preferensi, dan
  keputusan yang tahan lama. Dimuat pada awal setiap sesi DM.
- **`memory/YYYY-MM-DD.md`** -- catatan harian. Konteks berjalan dan observasi.
  Catatan hari ini dan kemarin dimuat secara otomatis.
- **`DREAMS.md`** (opsional) -- Dream Diary dan ringkasan sapuan Dreaming
  untuk tinjauan manusia, termasuk entri backfill historis yang terlandaskan.

File-file ini berada di workspace agen (default `~/.openclaw/workspace`).

<Tip>
Jika Anda ingin agen mengingat sesuatu, cukup minta saja: "Ingat bahwa saya
lebih suka TypeScript." Agen akan menuliskannya ke file yang sesuai.
</Tip>

## Tool memori

Agen memiliki dua tool untuk bekerja dengan memori:

- **`memory_search`** -- menemukan catatan yang relevan menggunakan pencarian semantik, bahkan ketika
  susunan katanya berbeda dari aslinya.
- **`memory_get`** -- membaca file memori tertentu atau rentang baris.

Kedua tool disediakan oleh plugin memori aktif (default: `memory-core`).

## Plugin pendamping Memory Wiki

Jika Anda ingin memori yang tahan lama berperilaku lebih seperti basis pengetahuan yang dipelihara daripada
sekadar catatan mentah, gunakan plugin bawaan `memory-wiki`.

`memory-wiki` mengompilasi pengetahuan tahan lama ke dalam wiki vault dengan:

- struktur halaman deterministik
- klaim dan bukti terstruktur
- pelacakan kontradiksi dan kesegaran
- dashboard yang dihasilkan
- digest terkompilasi untuk konsumen agen/runtime
- tool native wiki seperti `wiki_search`, `wiki_get`, `wiki_apply`, dan `wiki_lint`

Plugin ini tidak menggantikan plugin memori aktif. Plugin memori aktif tetap
memiliki recall, promotion, dan Dreaming. `memory-wiki` menambahkan lapisan
pengetahuan kaya provenance di sampingnya.

Lihat [Memory Wiki](/id/plugins/memory-wiki).

## Pencarian memori

Saat provider embedding dikonfigurasi, `memory_search` menggunakan **pencarian
hibrida** -- menggabungkan kemiripan vektor (makna semantik) dengan pencocokan kata kunci
(istilah persis seperti ID dan simbol kode). Ini langsung berfungsi begitu Anda memiliki
API key untuk provider yang didukung mana pun.

<Info>
OpenClaw mendeteksi otomatis provider embedding Anda dari API key yang tersedia. Jika Anda
memiliki key OpenAI, Gemini, Voyage, atau Mistral yang dikonfigurasi, pencarian memori
diaktifkan secara otomatis.
</Info>

Untuk detail tentang cara kerja pencarian, opsi penyetelan, dan penyiapan provider, lihat
[Pencarian Memori](/id/concepts/memory-search).

## Backend memori

<CardGroup cols={3}>
<Card title="Bawaan (default)" icon="database" href="/id/concepts/memory-builtin">
Berbasis SQLite. Langsung berfungsi dengan pencarian kata kunci, kemiripan vektor, dan
pencarian hibrida. Tanpa dependensi tambahan.
</Card>
<Card title="QMD" icon="search" href="/id/concepts/memory-qmd">
Sidecar local-first dengan reranking, ekspansi query, dan kemampuan untuk mengindeks
direktori di luar workspace.
</Card>
<Card title="Honcho" icon="brain" href="/id/concepts/memory-honcho">
Memori lintas sesi native AI dengan pemodelan pengguna, pencarian semantik, dan
kesadaran multi-agen. Instalasi plugin.
</Card>
</CardGroup>

## Lapisan wiki pengetahuan

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/id/plugins/memory-wiki">
Mengompilasi memori tahan lama ke dalam wiki vault kaya provenance dengan klaim,
dashboard, mode bridge, dan alur kerja yang ramah Obsidian.
</Card>
</CardGroup>

## Memory flush otomatis

Sebelum [Compaction](/id/concepts/compaction) merangkum percakapan Anda, OpenClaw
menjalankan giliran senyap yang mengingatkan agen untuk menyimpan konteks penting ke file
memori. Ini aktif secara default -- Anda tidak perlu mengonfigurasi apa pun.

<Tip>
Memory flush mencegah hilangnya konteks selama Compaction. Jika agen Anda memiliki
fakta penting dalam percakapan yang belum ditulis ke file, fakta tersebut
akan disimpan secara otomatis sebelum peringkasan terjadi.
</Tip>

## Dreaming

Dreaming adalah proses konsolidasi latar belakang opsional untuk memori. Dreaming mengumpulkan
sinyal jangka pendek, memberi skor pada kandidat, dan hanya mempromosikan item yang memenuhi syarat ke
memori jangka panjang (`MEMORY.md`).

Dreaming dirancang untuk menjaga sinyal memori jangka panjang tetap tinggi:

- **Opt-in**: nonaktif secara default.
- **Terjadwal**: saat diaktifkan, `memory-core` mengelola otomatis satu tugas Cron berulang
  untuk sapuan Dreaming penuh.
- **Bertreshold**: promotion harus melewati gerbang skor, frekuensi recall, dan
  keragaman query.
- **Dapat ditinjau**: ringkasan fase dan entri diary ditulis ke `DREAMS.md`
  untuk tinjauan manusia.

Untuk perilaku fase, sinyal penilaian, dan detail Dream Diary, lihat
[Dreaming](/id/concepts/dreaming).

## Backfill terlandaskan dan promosi langsung

Sistem Dreaming sekarang memiliki dua jalur peninjauan yang terkait erat:

- **Dreaming langsung** bekerja dari penyimpanan Dreaming jangka pendek di bawah
  `memory/.dreams/` dan itulah yang digunakan fase mendalam normal saat memutuskan apa
  yang dapat lulus ke `MEMORY.md`.
- **Backfill terlandaskan** membaca catatan historis `memory/YYYY-MM-DD.md` sebagai
  file harian mandiri dan menulis output tinjauan terstruktur ke `DREAMS.md`.

Backfill terlandaskan berguna saat Anda ingin memutar ulang catatan lama dan memeriksa apa
yang menurut sistem bersifat tahan lama tanpa mengedit `MEMORY.md` secara manual.

Saat Anda menggunakan:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

kandidat tahan lama yang terlandaskan tidak dipromosikan secara langsung. Kandidat itu dipentaskan ke
penyimpanan Dreaming jangka pendek yang sama yang sudah digunakan fase mendalam normal. Itu berarti:

- `DREAMS.md` tetap menjadi surface tinjauan manusia.
- penyimpanan jangka pendek tetap menjadi surface pemeringkatan yang menghadap mesin.
- `MEMORY.md` tetap hanya ditulis oleh promosi mendalam.

Jika Anda memutuskan replay tersebut tidak berguna, Anda dapat menghapus artefak yang dipentaskan
tanpa menyentuh entri diary biasa atau status recall normal:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Periksa status indeks dan provider
openclaw memory search "query"  # Cari dari command line
openclaw memory index --force   # Bangun ulang indeks
```

## Bacaan lanjutan

- [Builtin Memory Engine](/id/concepts/memory-builtin) -- backend SQLite default
- [QMD Memory Engine](/id/concepts/memory-qmd) -- sidecar local-first tingkat lanjut
- [Honcho Memory](/id/concepts/memory-honcho) -- memori lintas sesi native AI
- [Memory Wiki](/id/plugins/memory-wiki) -- vault pengetahuan terkompilasi dan tool native wiki
- [Memory Search](/id/concepts/memory-search) -- pipeline pencarian, provider, dan
  penyetelan
- [Dreaming](/id/concepts/dreaming) -- promotion latar belakang
  dari recall jangka pendek ke memori jangka panjang
- [Referensi konfigurasi memori](/id/reference/memory-config) -- semua opsi konfigurasi
- [Compaction](/id/concepts/compaction) -- bagaimana Compaction berinteraksi dengan memori

## Terkait

- [Active Memory](/id/concepts/active-memory)
- [Pencarian Memori](/id/concepts/memory-search)
- [Builtin memory engine](/id/concepts/memory-builtin)
- [Honcho memory](/id/concepts/memory-honcho)
