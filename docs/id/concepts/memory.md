---
read_when:
    - Anda ingin memahami cara kerja memori
    - Anda ingin mengetahui file memori apa yang harus ditulis
summary: Cara OpenClaw mengingat sesuatu di berbagai sesi
title: Ikhtisar Memori
x-i18n:
    generated_at: "2026-04-05T13:51:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89fbd20cf2bcdf461a9e311ee0ff43b5f69d9953519656eecd419b4a419256f8
    source_path: concepts/memory.md
    workflow: 15
---

# Ikhtisar Memori

OpenClaw mengingat sesuatu dengan menulis **file Markdown biasa** di ruang kerja
agen Anda. Model hanya "mengingat" apa yang disimpan ke disk -- tidak ada
status tersembunyi.

## Cara kerjanya

Agen Anda memiliki dua tempat untuk menyimpan memori:

- **`MEMORY.md`** -- memori jangka panjang. Fakta, preferensi, dan
  keputusan yang tahan lama. Dimuat pada awal setiap sesi DM.
- **`memory/YYYY-MM-DD.md`** -- catatan harian. Konteks dan observasi yang berjalan.
  Catatan hari ini dan kemarin dimuat secara otomatis.

File-file ini berada di ruang kerja agen (default `~/.openclaw/workspace`).

<Tip>
Jika Anda ingin agen Anda mengingat sesuatu, cukup minta: "Ingat bahwa saya
lebih suka TypeScript." Agen akan menuliskannya ke file yang sesuai.
</Tip>

## Alat memori

Agen memiliki dua alat untuk bekerja dengan memori:

- **`memory_search`** -- menemukan catatan yang relevan menggunakan pencarian semantik, bahkan saat
  susunan katanya berbeda dari aslinya.
- **`memory_get`** -- membaca file memori tertentu atau rentang baris.

Kedua alat ini disediakan oleh plugin memori yang aktif (default: `memory-core`).

## Pencarian memori

Saat provider embedding dikonfigurasi, `memory_search` menggunakan **pencarian
hibrida** -- menggabungkan kemiripan vektor (makna semantik) dengan pencocokan kata kunci
(istilah persis seperti ID dan simbol kode). Ini langsung berfungsi setelah Anda memiliki
API key untuk provider yang didukung.

<Info>
OpenClaw mendeteksi otomatis provider embedding Anda dari API key yang tersedia. Jika Anda
telah mengonfigurasi key OpenAI, Gemini, Voyage, atau Mistral, pencarian memori
diaktifkan secara otomatis.
</Info>

Untuk detail tentang cara kerja pencarian, opsi penyetelan, dan penyiapan provider, lihat
[Pencarian Memori](/concepts/memory-search).

## Backend memori

<CardGroup cols={3}>
<Card title="Bawaan (default)" icon="database" href="/concepts/memory-builtin">
Berbasis SQLite. Berfungsi langsung dengan pencarian kata kunci, kemiripan vektor, dan
pencarian hibrida. Tidak perlu dependensi tambahan.
</Card>
<Card title="QMD" icon="search" href="/concepts/memory-qmd">
Sidecar local-first dengan reranking, perluasan kueri, dan kemampuan untuk mengindeks
direktori di luar ruang kerja.
</Card>
<Card title="Honcho" icon="brain" href="/concepts/memory-honcho">
Memori lintas sesi yang native-AI dengan pemodelan pengguna, pencarian semantik, dan
kesadaran multi-agen. Instal plugin.
</Card>
</CardGroup>

## Flush memori otomatis

Sebelum [kompaksi](/concepts/compaction) merangkum percakapan Anda, OpenClaw
menjalankan giliran senyap yang mengingatkan agen untuk menyimpan konteks penting ke file
memori. Ini aktif secara default -- Anda tidak perlu mengonfigurasi apa pun.

<Tip>
Flush memori mencegah hilangnya konteks selama kompaksi. Jika agen Anda memiliki
fakta penting di dalam percakapan yang belum ditulis ke file, fakta tersebut
akan disimpan secara otomatis sebelum peringkasan terjadi.
</Tip>

## Dreaming (eksperimental)

Dreaming adalah proses konsolidasi latar belakang opsional untuk memori. Fitur ini meninjau kembali
recall jangka pendek dari file harian (`memory/YYYY-MM-DD.md`), memberi skor, dan
mempromosikan hanya item yang memenuhi syarat ke memori jangka panjang (`MEMORY.md`).

Fitur ini dirancang untuk menjaga memori jangka panjang tetap bernilai tinggi:

- **Opt-in**: dinonaktifkan secara default.
- **Terjadwal**: saat diaktifkan, `memory-core` mengelola tugas berulang
  secara otomatis.
- **Berbasis ambang**: promosi harus lolos gerbang skor, frekuensi recall, dan
  keberagaman kueri.

Untuk perilaku mode (`off`, `core`, `rem`, `deep`), sinyal penskoran, dan
opsi penyetelan, lihat [Dreaming (eksperimental)](/concepts/memory-dreaming).

## CLI

```bash
openclaw memory status          # Periksa status indeks dan provider
openclaw memory search "query"  # Cari dari baris perintah
openclaw memory index --force   # Bangun ulang indeks
```

## Bacaan lanjutan

- [Builtin Memory Engine](/concepts/memory-builtin) -- backend SQLite default
- [QMD Memory Engine](/concepts/memory-qmd) -- sidecar local-first tingkat lanjut
- [Honcho Memory](/concepts/memory-honcho) -- memori lintas sesi yang native-AI
- [Pencarian Memori](/concepts/memory-search) -- pipeline pencarian, provider, dan
  penyetelan
- [Dreaming (eksperimental)](/concepts/memory-dreaming) -- promosi latar belakang
  dari recall jangka pendek ke memori jangka panjang
- [Referensi konfigurasi memori](/reference/memory-config) -- semua opsi konfigurasi
- [Kompaksi](/concepts/compaction) -- bagaimana kompaksi berinteraksi dengan memori
