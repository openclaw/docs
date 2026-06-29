---
read_when:
    - Anda ingin memahami cara kerja memory_search
    - Anda ingin memilih penyedia embedding
    - Anda ingin menyesuaikan kualitas pencarian
summary: Bagaimana pencarian memori menemukan catatan yang relevan menggunakan embedding dan pengambilan hibrida
title: Pencarian memori
x-i18n:
    generated_at: "2026-06-28T22:33:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32ffb9d996851566eb92b7812c5425f545ecbb5387a0a445686df35a6c8ae143
    source_path: concepts/memory-search.md
    workflow: 16
---

`memory_search` menemukan catatan relevan dari file memori Anda, bahkan ketika
susunan katanya berbeda dari teks asli. Ini bekerja dengan mengindeks memori ke
dalam potongan-potongan kecil dan mencarinya menggunakan embedding, kata kunci,
atau keduanya.

## Mulai cepat

Pencarian memori menggunakan embedding OpenAI secara default. Untuk menggunakan
backend embedding lain, tetapkan penyedia secara eksplisit:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai", // or "gemini", "local", "ollama", "openai-compatible", etc.
      },
    },
  },
}
```

Untuk penyiapan multi-endpoint dengan penyedia khusus memori, `provider` juga
dapat berupa entri `models.providers.<id>` kustom, seperti `ollama-5080`, ketika
penyedia tersebut menetapkan `api: "ollama"` atau pemilik adaptor embedding
memori lainnya.

Untuk embedding lokal tanpa kunci API, instal
`@openclaw/llama-cpp-provider` dan tetapkan `provider: "local"`. Checkout sumber
mungkin masih memerlukan persetujuan build native: `pnpm approve-builds` lalu
`pnpm rebuild node-llama-cpp`.

Beberapa endpoint embedding yang kompatibel dengan OpenAI memerlukan label
asimetris seperti `input_type: "query"` untuk pencarian dan
`input_type: "document"` atau `"passage"` untuk potongan yang diindeks.
Konfigurasikan itu dengan `memorySearch.queryInputType` dan
`memorySearch.documentInputType`; lihat [referensi konfigurasi Memori](/id/reference/memory-config#provider-specific-config).

## Penyedia yang didukung

| Penyedia          | ID                  | Perlu kunci API | Catatan                         |
| ----------------- | ------------------- | --------------- | ------------------------------- |
| Bedrock           | `bedrock`           | Tidak           | Menggunakan rantai kredensial AWS |
| DeepInfra         | `deepinfra`         | Ya              | Default: `BAAI/bge-m3`          |
| Gemini            | `gemini`            | Ya              | Mendukung pengindeksan gambar/audio |
| GitHub Copilot    | `github-copilot`    | Tidak           | Menggunakan langganan Copilot   |
| Lokal             | `local`             | Tidak           | Model GGUF, unduhan ~0,6 GB     |
| Mistral           | `mistral`           | Ya              |                                 |
| Ollama            | `ollama`            | Tidak           | Lokal/dihosting sendiri         |
| OpenAI            | `openai`            | Ya              | Default                         |
| Kompatibel OpenAI | `openai-compatible` | Biasanya        | `/v1/embeddings` generik        |
| Voyage            | `voyage`            | Ya              |                                 |

## Cara kerja pencarian

OpenClaw menjalankan dua jalur pengambilan secara paralel dan menggabungkan hasilnya:

```mermaid
flowchart LR
    Q["Query"] --> E["Embedding"]
    Q --> T["Tokenize"]
    E --> VS["Vector Search"]
    T --> BM["BM25 Search"]
    VS --> M["Weighted Merge"]
    BM --> M
    M --> R["Top Results"]
```

- **Pencarian vektor** menemukan catatan dengan makna serupa ("gateway host"
  cocok dengan "mesin yang menjalankan OpenClaw").
- **Pencarian kata kunci BM25** menemukan kecocokan persis (ID, string error,
  kunci config).

Jika hanya satu jalur tersedia, jalur lain berjalan sendiri. Mode khusus FTS saja
(`provider: "none"`) dan pemilihan penyedia otomatis/default tetap dapat
menggunakan peringkat leksikal ketika embedding tidak tersedia.

Penyedia embedding non-lokal eksplisit berbeda. Jika Anda menetapkan
`memorySearch.provider` ke penyedia konkret yang didukung jarak jauh dan
penyedia tersebut tidak tersedia saat runtime, `memory_search` melaporkan memori
sebagai tidak tersedia alih-alih diam-diam menggunakan hasil FTS saja. Ini
membuat penyedia semantik terkonfigurasi yang rusak tetap terlihat. Tetapkan
`provider: "none"` untuk recall FTS saja yang disengaja, atau perbaiki
konfigurasi penyedia/auth untuk memulihkan peringkat semantik.

## Meningkatkan kualitas pencarian

Dua fitur opsional membantu saat Anda memiliki riwayat catatan yang besar:

### Peluruhan temporal

Catatan lama secara bertahap kehilangan bobot peringkat sehingga informasi
terbaru muncul lebih dulu. Dengan waktu paruh default 30 hari, catatan dari
bulan lalu mendapat skor 50% dari bobot aslinya. File evergreen seperti
`MEMORY.md` tidak pernah mengalami peluruhan.

<Tip>
Aktifkan peluruhan temporal jika agen Anda memiliki catatan harian selama
berbulan-bulan dan informasi usang terus mengungguli konteks terbaru.
</Tip>

### MMR (keragaman)

Mengurangi hasil yang redundan. Jika lima catatan semuanya menyebut config
router yang sama, MMR memastikan hasil teratas mencakup topik yang berbeda
alih-alih berulang.

<Tip>
Aktifkan MMR jika `memory_search` terus mengembalikan cuplikan yang hampir
duplikat dari catatan harian yang berbeda.
</Tip>

### Aktifkan keduanya

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            mmr: { enabled: true },
            temporalDecay: { enabled: true },
          },
        },
      },
    },
  },
}
```

## Memori multimodal

Dengan Gemini Embedding 2, Anda dapat mengindeks file gambar dan audio bersama
Markdown. Kueri pencarian tetap berupa teks, tetapi cocok dengan konten visual
dan audio. Lihat [referensi konfigurasi Memori](/id/reference/memory-config) untuk
penyiapan.

## Pencarian memori sesi

Anda dapat secara opsional mengindeks transkrip sesi sehingga `memory_search`
dapat mengingat percakapan sebelumnya. Ini bersifat opt-in melalui
`memorySearch.experimental.sessionMemory` dan `sources: ["sessions"]`; daftar
sumber default hanya memori. Flag eksperimental mengaktifkan pengindeksan
transkrip sesi, sementara `sources` mengontrol apakah potongan sesi dicari.

Hit sesi mematuhi `tools.sessions.visibility`: pengaturan default `tree` hanya
mengekspos sesi saat ini dan sesi yang dibuat olehnya. Untuk mengingat sesi
tidak terkait dari agen yang sama yang dikirim melalui Gateway dari sesi DM
terpisah, perluas visibilitas secara sengaja ke `agent`.

Saat menggunakan QMD, tetapkan juga `memory.qmd.sessions.enabled: true` agar
transkrip diekspor ke koleksi QMD. Lihat
[referensi konfigurasi](/id/reference/memory-config) untuk detail.

## Pemecahan masalah

**Tidak ada hasil?** Jalankan `openclaw memory status` untuk memeriksa indeks.
Jika kosong, jalankan `openclaw memory index --force`.

**Hanya kecocokan kata kunci?** Penyedia embedding Anda mungkin belum
dikonfigurasi. Periksa `openclaw memory status --deep`.

**Embedding lokal timeout?** `ollama`, `lmstudio`, dan `local` menggunakan
timeout batch inline yang lebih panjang secara default. Jika host memang lambat,
tetapkan `agents.defaults.memorySearch.sync.embeddingBatchTimeoutSeconds` dan
jalankan ulang `openclaw memory index --force`.

**Teks CJK tidak ditemukan?** Bangun ulang indeks FTS dengan
`openclaw memory index --force`.

## Bacaan lanjutan

- [Active Memory](/id/concepts/active-memory) -- memori sub-agen untuk sesi chat interaktif
- [Memori](/id/concepts/memory) -- tata letak file, backend, alat
- [Referensi konfigurasi Memori](/id/reference/memory-config) -- semua kenop config

## Terkait

- [Ikhtisar memori](/id/concepts/memory)
- [Active Memory](/id/concepts/active-memory)
- [Mesin memori bawaan](/id/concepts/memory-builtin)
