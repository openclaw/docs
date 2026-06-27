---
read_when:
    - Anda ingin memahami backend memori bawaan
    - Anda ingin mengonfigurasi penyedia embedding atau pencarian hibrida
summary: Backend memori default berbasis SQLite dengan pencarian kata kunci, vektor, dan hybrid
title: Mesin memori bawaan
x-i18n:
    generated_at: "2026-06-27T17:24:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a867bd295778f81109b258a63a35a1683d652d4564e44335053af4d86f90584e
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Mesin bawaan adalah backend memori default. Mesin ini menyimpan indeks memori Anda di
database SQLite per agen dan tidak memerlukan dependensi tambahan untuk memulai.

## Yang disediakan

- **Pencarian kata kunci** melalui pengindeksan teks lengkap FTS5 (penskoran BM25).
- **Pencarian vektor** melalui embedding dari penyedia mana pun yang didukung.
- **Pencarian hibrida** yang menggabungkan keduanya untuk hasil terbaik.
- **Dukungan CJK** melalui tokenisasi trigram untuk bahasa Mandarin, Jepang, dan Korea.
- **Akselerasi sqlite-vec** untuk kueri vektor di dalam database (opsional).

## Memulai

Secara default, mesin bawaan menggunakan embedding OpenAI. Jika Anda sudah
mengonfigurasi `OPENAI_API_KEY` atau `models.providers.openai.apiKey`, pencarian
vektor berfungsi tanpa konfigurasi memori tambahan.

Untuk menetapkan penyedia secara eksplisit:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

Tanpa penyedia embedding, hanya pencarian kata kunci yang tersedia.

Untuk memaksa embedding GGUF lokal, instal plugin penyedia llama.cpp resmi,
lalu arahkan `local.modelPath` ke file GGUF:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## Penyedia embedding yang didukung

| Penyedia          | ID                  | Catatan                             |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | Menggunakan rantai kredensial AWS   |
| DeepInfra         | `deepinfra`         | Default: `BAAI/bge-m3`              |
| Gemini            | `gemini`            | Mendukung multimodal (gambar + audio) |
| GitHub Copilot    | `github-copilot`    | Menggunakan langganan Copilot       |
| Lokal             | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | Lokal/dihosting sendiri             |
| OpenAI            | `openai`            | Default: `text-embedding-3-small`   |
| Kompatibel OpenAI | `openai-compatible` | Endpoint generik `/v1/embeddings`   |
| Voyage            | `voyage`            |                                     |

Tetapkan `memorySearch.provider` untuk beralih dari OpenAI.

## Cara kerja pengindeksan

OpenClaw mengindeks `MEMORY.md` dan `memory/*.md` menjadi potongan (~400 token dengan
tumpang tindih 80 token) dan menyimpannya di database SQLite per agen.

- **Lokasi indeks:** database agen pemilik di
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Pemeliharaan penyimpanan:** sidecar WAL SQLite dibatasi dengan checkpoint berkala dan
  saat penonaktifan.
- **Pemantauan file:** perubahan pada file memori memicu pengindeksan ulang yang di-debounce (1,5 dtk).
- **Pengindeksan ulang otomatis:** saat penyedia embedding, model, atau konfigurasi pemotongan
  berubah, seluruh indeks dibangun ulang secara otomatis.
- **Pengindeksan ulang sesuai permintaan:** `openclaw memory index --force`

<Info>
Anda juga dapat mengindeks file Markdown di luar workspace dengan
`memorySearch.extraPaths`. Lihat
[referensi konfigurasi](/id/reference/memory-config#additional-memory-paths).
</Info>

## Kapan digunakan

Mesin bawaan adalah pilihan yang tepat untuk sebagian besar pengguna:

- Berfungsi langsung tanpa dependensi tambahan.
- Menangani pencarian kata kunci dan vektor dengan baik.
- Mendukung semua penyedia embedding.
- Pencarian hibrida menggabungkan yang terbaik dari kedua pendekatan pengambilan.

Pertimbangkan untuk beralih ke [QMD](/id/concepts/memory-qmd) jika Anda memerlukan reranking, perluasan kueri,
atau ingin mengindeks direktori di luar workspace.

Pertimbangkan [Honcho](/id/concepts/memory-honcho) jika Anda menginginkan memori lintas sesi dengan
pemodelan pengguna otomatis.

## Pemecahan masalah

**Pencarian memori dinonaktifkan?** Periksa `openclaw memory status`. Jika tidak ada penyedia yang
terdeteksi, tetapkan satu secara eksplisit atau tambahkan kunci API.

**Penyedia lokal tidak terdeteksi?** Pastikan path lokal ada dan jalankan:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Baik perintah CLI mandiri maupun Gateway menggunakan id penyedia `local` yang sama.
Tetapkan `memorySearch.provider: "local"` saat Anda menginginkan embedding lokal.

**Hasil usang?** Jalankan `openclaw memory index --force` untuk membangun ulang. Pemantau
mungkin melewatkan perubahan dalam kasus edge yang jarang terjadi.

**sqlite-vec tidak dimuat?** OpenClaw secara otomatis fallback ke kemiripan kosinus dalam proses.
`openclaw memory status --deep` melaporkan penyimpanan vektor lokal
secara terpisah dari penyedia embedding, jadi `Vector store: unavailable` menunjuk
ke pemuatan sqlite-vec, sedangkan `Embeddings: unavailable` menunjuk ke kesiapan penyedia/autentikasi
atau model. Periksa log untuk galat pemuatan spesifik.

## Konfigurasi

Untuk penyiapan penyedia embedding, penyetelan pencarian hibrida (bobot, MMR, peluruhan temporal),
pengindeksan batch, memori multimodal, sqlite-vec, path tambahan, dan semua
kenop konfigurasi lainnya, lihat
[referensi konfigurasi Memori](/id/reference/memory-config).

## Terkait

- [Ikhtisar memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Active Memory](/id/concepts/active-memory)
