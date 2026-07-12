---
read_when:
    - Anda ingin memahami backend memori default
    - Anda ingin mengonfigurasi penyedia embedding atau pencarian hibrida
summary: Backend memori bawaan berbasis SQLite dengan pencarian kata kunci, vektor, dan hibrida
title: Mesin memori bawaan
x-i18n:
    generated_at: "2026-07-12T14:08:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Mesin bawaan adalah backend memori default. Mesin ini menyimpan indeks memori Anda
dalam basis data SQLite per agen dan tidak memerlukan dependensi tambahan untuk
memulai.

## Fitur yang disediakan

- **Pencarian kata kunci** melalui pengindeksan teks lengkap FTS5 (penilaian BM25).
- **Pencarian vektor** melalui embedding dari penyedia mana pun yang didukung.
- **Pencarian hibrida** yang menggabungkan keduanya untuk hasil terbaik.
- **Dukungan CJK** melalui tokenisasi trigram untuk bahasa Tionghoa, Jepang, dan Korea.
- **Akselerasi sqlite-vec** untuk kueri vektor dalam basis data (opsional).

## Memulai

Secara default, mesin bawaan menggunakan embedding OpenAI. Jika `OPENAI_API_KEY` atau
`models.providers.openai.apiKey` sudah dikonfigurasi, pencarian vektor berfungsi
tanpa konfigurasi memori tambahan.

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

Untuk memaksakan penggunaan embedding GGUF lokal, instal Plugin penyedia llama.cpp
resmi, lalu arahkan `local.modelPath` ke berkas GGUF:

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

| Penyedia          | ID                  | Catatan                                  |
| ----------------- | ------------------- | ---------------------------------------- |
| Bedrock           | `bedrock`           | Menggunakan rantai kredensial AWS        |
| DeepInfra         | `deepinfra`         | Default: `BAAI/bge-m3`                   |
| Gemini            | `gemini`            | Mendukung multimodal (gambar + audio)     |
| GitHub Copilot    | `github-copilot`    | Menggunakan langganan Copilot Anda        |
| LM Studio         | `lmstudio`          | Lokal/dihosting sendiri                   |
| Lokal             | `local`             | `@openclaw/llama-cpp-provider`            |
| Mistral           | `mistral`           |                                          |
| Ollama            | `ollama`            | Lokal/dihosting sendiri                   |
| OpenAI            | `openai`            | Default: `text-embedding-3-small`         |
| Kompatibel OpenAI | `openai-compatible` | Endpoint `/v1/embeddings` generik         |
| Voyage            | `voyage`            |                                          |

Atur `memorySearch.provider` untuk beralih dari OpenAI.

## Cara kerja pengindeksan

OpenClaw mengindeks `MEMORY.md` dan `memory/*.md` menjadi potongan-potongan (secara
default 400 token dengan tumpang tindih 80 token) dan menyimpannya dalam basis data
SQLite per agen.

- **Lokasi indeks:** basis data agen pemilik di
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Pemeliharaan penyimpanan:** berkas pendamping WAL SQLite dibatasi dengan checkpoint
  berkala dan saat penghentian.
- **Pemantauan berkas:** perubahan pada berkas memori memicu pengindeksan ulang dengan
  penundaan debounce (default 1,5 detik).
- **Pengindeksan ulang otomatis:** indeks dibuat ulang secara otomatis ketika penyedia
  embedding, model, konfigurasi pemotongan, sumber yang dikonfigurasi, atau cakupan berubah.
- **Pengindeksan ulang sesuai permintaan:** `openclaw memory index --force`

<Info>
Anda juga dapat mengindeks berkas Markdown di luar ruang kerja dengan
`memorySearch.extraPaths`. Lihat
[referensi konfigurasi](/id/reference/memory-config#additional-memory-paths).
</Info>

## Kapan digunakan

Mesin bawaan adalah pilihan yang tepat bagi sebagian besar pengguna:

- Langsung berfungsi tanpa dependensi tambahan.
- Menangani pencarian kata kunci dan vektor dengan baik.
- Mendukung semua penyedia embedding.
- Pencarian hibrida menggabungkan keunggulan kedua pendekatan pengambilan.

Pertimbangkan untuk beralih ke [QMD](/id/concepts/memory-qmd) jika Anda memerlukan
pemeringkatan ulang, perluasan kueri, atau ingin mengindeks direktori di luar ruang kerja.

Pertimbangkan [Honcho](/id/concepts/memory-honcho) jika Anda menginginkan memori lintas sesi
dengan pemodelan pengguna otomatis.

## Pemecahan masalah

**Pencarian memori dinonaktifkan?** Periksa `openclaw memory status`. Jika tidak ada
penyedia yang terdeteksi, tetapkan penyedia secara eksplisit atau tambahkan kunci API.

**Penyedia lokal tidak terdeteksi?** Pastikan jalur lokal tersedia dan jalankan:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Baik perintah CLI mandiri maupun Gateway menggunakan ID penyedia `local` yang sama.
Atur `memorySearch.provider: "local"` saat Anda ingin menggunakan embedding lokal.

**Hasil usang?** Jalankan `openclaw memory index --force` untuk membuat ulang indeks.
Pemantau mungkin melewatkan perubahan dalam kasus langka tertentu.

**sqlite-vec tidak dimuat?** OpenClaw secara otomatis beralih ke kemiripan kosinus
dalam proses. `openclaw memory status --deep` melaporkan penyimpanan vektor lokal
secara terpisah dari penyedia embedding, sehingga `Vector store:
unavailable` menunjukkan masalah pemuatan sqlite-vec, sedangkan `Embeddings: unavailable`
menunjukkan masalah kesiapan penyedia/autentikasi atau model. Periksa log untuk melihat
kesalahan pemuatan spesifik.

## Konfigurasi

Untuk penyiapan penyedia embedding, penyetelan pencarian hibrida (bobot, MMR, peluruhan
temporal), pengindeksan batch, memori multimodal, sqlite-vec, jalur tambahan, dan semua
opsi konfigurasi lainnya, lihat
[Referensi konfigurasi memori](/id/reference/memory-config).

## Terkait

- [Ikhtisar memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Active Memory](/id/concepts/active-memory)
