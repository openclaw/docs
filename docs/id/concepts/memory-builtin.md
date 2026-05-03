---
read_when:
    - Anda ingin memahami backend memori bawaan
    - Anda ingin mengonfigurasi penyedia embedding atau pencarian hibrida
summary: Backend memori bawaan berbasis SQLite dengan pencarian kata kunci, vektor, dan hibrida
title: Mesin memori bawaan
x-i18n:
    generated_at: "2026-05-03T21:29:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72f5d1fee02bff0962bd012575b62846c1f11c030fd1174fdb2af1e81909f52a
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Mesin bawaan adalah backend memori default. Mesin ini menyimpan indeks memori Anda dalam
basis data SQLite per agen dan tidak memerlukan dependensi tambahan untuk mulai digunakan.

## Yang disediakan

- **Pencarian kata kunci** melalui pengindeksan teks lengkap FTS5 (skor BM25).
- **Pencarian vektor** melalui embedding dari penyedia mana pun yang didukung.
- **Pencarian hibrida** yang menggabungkan keduanya untuk hasil terbaik.
- **Dukungan CJK** melalui tokenisasi trigram untuk bahasa Tionghoa, Jepang, dan Korea.
- **Akselerasi sqlite-vec** untuk kueri vektor dalam basis data (opsional).

## Memulai

Jika Anda memiliki kunci API untuk OpenAI, Gemini, Voyage, Mistral, atau DeepInfra, mesin
bawaan akan mendeteksinya secara otomatis dan mengaktifkan pencarian vektor. Tidak perlu konfigurasi.

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

Untuk memaksa penyedia embedding lokal bawaan, instal paket runtime opsional
`node-llama-cpp` di samping OpenClaw, lalu arahkan `local.modelPath`
ke file GGUF:

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

| Penyedia  | ID          | Terdeteksi otomatis | Catatan                            |
| --------- | ----------- | ------------------- | ---------------------------------- |
| OpenAI    | `openai`    | Ya                  | Bawaan: `text-embedding-3-small`   |
| Gemini    | `gemini`    | Ya                  | Mendukung multimodal (gambar + audio) |
| Voyage    | `voyage`    | Ya                  |                                    |
| Mistral   | `mistral`   | Ya                  |                                    |
| DeepInfra | `deepinfra` | Ya                  | Bawaan: `BAAI/bge-m3`              |
| Ollama    | `ollama`    | Tidak               | Lokal, tetapkan secara eksplisit   |
| Lokal     | `local`     | Ya (pertama)        | Runtime `node-llama-cpp` opsional  |

Deteksi otomatis memilih penyedia pertama yang kunci API-nya dapat di-resolve, dalam
urutan yang ditampilkan. Tetapkan `memorySearch.provider` untuk menimpa.

## Cara kerja pengindeksan

OpenClaw mengindeks `MEMORY.md` dan `memory/*.md` menjadi potongan (~400 token dengan
overlap 80 token) dan menyimpannya dalam basis data SQLite per agen.

- **Lokasi indeks:** `~/.openclaw/memory/<agentId>.sqlite`
- **Pemeliharaan penyimpanan:** Sidecar WAL SQLite dibatasi dengan checkpoint berkala dan
  saat shutdown.
- **Pemantauan file:** perubahan pada file memori memicu pengindeksan ulang dengan debounce (1,5 dtk).
- **Pengindeksan ulang otomatis:** saat penyedia embedding, model, atau konfigurasi pemotongan
  berubah, seluruh indeks akan dibangun ulang secara otomatis.
- **Pengindeksan ulang sesuai permintaan:** `openclaw memory index --force`

<Info>
Anda juga dapat mengindeks file Markdown di luar workspace dengan
`memorySearch.extraPaths`. Lihat
[referensi konfigurasi](/id/reference/memory-config#additional-memory-paths).
</Info>

## Kapan digunakan

Mesin bawaan adalah pilihan yang tepat bagi sebagian besar pengguna:

- Berfungsi langsung tanpa dependensi tambahan.
- Menangani pencarian kata kunci dan vektor dengan baik.
- Mendukung semua penyedia embedding.
- Pencarian hibrida menggabungkan yang terbaik dari kedua pendekatan retrieval.

Pertimbangkan beralih ke [QMD](/id/concepts/memory-qmd) jika Anda memerlukan reranking, ekspansi kueri,
atau ingin mengindeks direktori di luar workspace.

Pertimbangkan [Honcho](/id/concepts/memory-honcho) jika Anda menginginkan memori lintas sesi dengan
pemodelan pengguna otomatis.

## Pemecahan masalah

**Pencarian memori dinonaktifkan?** Periksa `openclaw memory status`. Jika tidak ada penyedia yang
terdeteksi, tetapkan salah satu secara eksplisit atau tambahkan kunci API.

**Penyedia lokal tidak terdeteksi?** Pastikan path lokal ada dan jalankan:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Baik perintah CLI mandiri maupun Gateway menggunakan id penyedia `local` yang sama.
Jika penyedia ditetapkan ke `auto`, embedding lokal hanya dipertimbangkan terlebih dahulu
ketika `memorySearch.local.modelPath` menunjuk ke file lokal yang ada.

**Hasil kedaluwarsa?** Jalankan `openclaw memory index --force` untuk membangun ulang. Watcher
mungkin melewatkan perubahan dalam kasus tepi yang jarang terjadi.

**sqlite-vec tidak dimuat?** OpenClaw otomatis fallback ke kemiripan kosinus dalam proses.
`openclaw memory status --deep` melaporkan penyimpanan vektor lokal
terpisah dari penyedia embedding, sehingga `Vector store: unavailable` mengarah
ke pemuatan sqlite-vec sementara `Embeddings: unavailable` mengarah ke kesiapan penyedia/auth
atau model. Periksa log untuk kesalahan pemuatan spesifik.

## Konfigurasi

Untuk penyiapan penyedia embedding, penyetelan pencarian hibrida (bobot, MMR, peluruhan temporal),
pengindeksan batch, memori multimodal, sqlite-vec, path tambahan, dan semua
kenop konfigurasi lainnya, lihat
[referensi konfigurasi Memori](/id/reference/memory-config).

## Terkait

- [Ikhtisar memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Active Memory](/id/concepts/active-memory)
