---
read_when:
    - Anda ingin memahami backend memori default
    - Anda ingin mengonfigurasi penyedia embedding atau pencarian hibrida
summary: Backend memori berbasis SQLite default dengan pencarian kata kunci, vektor, dan hibrida
title: Mesin Memori Bawaan
x-i18n:
    generated_at: "2026-04-05T13:51:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 181c40a43332315bf915ff6f395d9d5fd766c889e1a8d1aa525f9ba0198d3367
    source_path: concepts/memory-builtin.md
    workflow: 15
---

# Mesin Memori Bawaan

Mesin bawaan adalah backend memori default. Mesin ini menyimpan indeks memori Anda di
database SQLite per agen dan tidak memerlukan dependensi tambahan untuk memulai.

## Yang disediakan

- **Pencarian kata kunci** melalui pengindeksan full-text FTS5 (skor BM25).
- **Pencarian vektor** melalui embedding dari penyedia yang didukung.
- **Pencarian hibrida** yang menggabungkan keduanya untuk hasil terbaik.
- **Dukungan CJK** melalui tokenisasi trigram untuk bahasa Mandarin, Jepang, dan Korea.
- **Akselerasi sqlite-vec** untuk kueri vektor di dalam database (opsional).

## Memulai

Jika Anda memiliki API key untuk OpenAI, Gemini, Voyage, atau Mistral, mesin bawaan
akan mendeteksinya secara otomatis dan mengaktifkan pencarian vektor. Tidak perlu konfigurasi.

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

## Penyedia embedding yang didukung

| Penyedia | ID        | Terdeteksi otomatis | Catatan                            |
| -------- | --------- | ------------------- | ---------------------------------- |
| OpenAI   | `openai`  | Ya                  | Default: `text-embedding-3-small`  |
| Gemini   | `gemini`  | Ya                  | Mendukung multimodal (gambar + audio) |
| Voyage   | `voyage`  | Ya                  |                                    |
| Mistral  | `mistral` | Ya                  |                                    |
| Ollama   | `ollama`  | Tidak               | Lokal, tetapkan secara eksplisit   |
| Local    | `local`   | Ya (pertama)        | Model GGUF, unduhan ~0,6 GB        |

Deteksi otomatis memilih penyedia pertama yang API key-nya dapat di-resolve, dalam
urutan yang ditampilkan. Tetapkan `memorySearch.provider` untuk menggantinya.

## Cara kerja pengindeksan

OpenClaw mengindeks `MEMORY.md` dan `memory/*.md` menjadi potongan (~400 token dengan
tumpang tindih 80 token) dan menyimpannya di database SQLite per agen.

- **Lokasi indeks:** `~/.openclaw/memory/<agentId>.sqlite`
- **Pemantauan file:** perubahan pada file memori memicu pengindeksan ulang dengan debounce (1,5 dtk).
- **Pengindeksan ulang otomatis:** saat penyedia embedding, model, atau konfigurasi chunking
  berubah, seluruh indeks dibangun ulang secara otomatis.
- **Indeks ulang sesuai permintaan:** `openclaw memory index --force`

<Info>
Anda juga dapat mengindeks file Markdown di luar workspace dengan
`memorySearch.extraPaths`. Lihat
[referensi konfigurasi](/reference/memory-config#additional-memory-paths).
</Info>

## Kapan digunakan

Mesin bawaan adalah pilihan yang tepat bagi sebagian besar pengguna:

- Berfungsi langsung tanpa dependensi tambahan.
- Menangani pencarian kata kunci dan vektor dengan baik.
- Mendukung semua penyedia embedding.
- Pencarian hibrida menggabungkan keunggulan dari kedua pendekatan retrieval.

Pertimbangkan untuk beralih ke [QMD](/concepts/memory-qmd) jika Anda memerlukan reranking, query
expansion, atau ingin mengindeks direktori di luar workspace.

Pertimbangkan [Honcho](/concepts/memory-honcho) jika Anda menginginkan memori lintas sesi dengan
pemodelan pengguna otomatis.

## Pemecahan masalah

**Pencarian memori dinonaktifkan?** Periksa `openclaw memory status`. Jika tidak ada penyedia yang
terdeteksi, tetapkan satu secara eksplisit atau tambahkan API key.

**Hasil usang?** Jalankan `openclaw memory index --force` untuk membangun ulang. Watcher
dapat melewatkan perubahan dalam kasus edge yang jarang terjadi.

**sqlite-vec tidak dimuat?** OpenClaw otomatis beralih ke cosine similarity dalam proses.
Periksa log untuk error pemuatan spesifiknya.

## Konfigurasi

Untuk penyiapan penyedia embedding, penyetelan pencarian hibrida (bobot, MMR, temporal
decay), pengindeksan batch, memori multimodal, sqlite-vec, extra paths, dan semua
opsi konfigurasi lainnya, lihat
[referensi konfigurasi Memori](/reference/memory-config).
