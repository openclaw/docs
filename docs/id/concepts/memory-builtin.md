---
read_when:
    - Anda ingin memahami backend memori default
    - Anda ingin mengonfigurasi provider embedding atau pencarian hibrida
summary: Backend memori berbasis SQLite default dengan pencarian keyword, vektor, dan hibrida
title: Mesin memori bawaan
x-i18n:
    generated_at: "2026-04-24T09:04:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82c1f4dc37b4fc6c075a7fcd2ec78bfcbfbebbcba7e48d366a1da3afcaff508
    source_path: concepts/memory-builtin.md
    workflow: 15
---

Mesin bawaan adalah backend memori default. Mesin ini menyimpan indeks memori Anda dalam
database SQLite per agen dan tidak memerlukan dependensi tambahan untuk mulai digunakan.

## Apa yang disediakannya

- **Pencarian keyword** melalui pengindeksan full-text FTS5 (skor BM25).
- **Pencarian vektor** melalui embedding dari provider yang didukung.
- **Pencarian hibrida** yang menggabungkan keduanya untuk hasil terbaik.
- **Dukungan CJK** melalui tokenisasi trigram untuk bahasa Tionghoa, Jepang, dan Korea.
- **Akselerasi sqlite-vec** untuk kueri vektor dalam database (opsional).

## Mulai menggunakan

Jika Anda memiliki API key untuk OpenAI, Gemini, Voyage, atau Mistral, mesin bawaan
akan mendeteksinya secara otomatis dan mengaktifkan pencarian vektor. Tidak perlu konfigurasi.

Untuk menetapkan provider secara eksplisit:

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

Tanpa provider embedding, hanya pencarian keyword yang tersedia.

Untuk memaksa provider embedding lokal bawaan, arahkan `local.modelPath` ke
file GGUF:

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

## Provider embedding yang didukung

| Provider | ID        | Terdeteksi otomatis | Catatan                            |
| -------- | --------- | ------------------- | ---------------------------------- |
| OpenAI   | `openai`  | Ya                  | Default: `text-embedding-3-small`  |
| Gemini   | `gemini`  | Ya                  | Mendukung multimodal (gambar + audio) |
| Voyage   | `voyage`  | Ya                  |                                    |
| Mistral  | `mistral` | Ya                  |                                    |
| Ollama   | `ollama`  | Tidak               | Lokal, setel secara eksplisit      |
| Local    | `local`   | Ya (pertama)        | Model GGUF, unduhan ~0.6 GB        |

Deteksi otomatis memilih provider pertama yang API key-nya dapat diselesaikan, dalam
urutan yang ditampilkan. Setel `memorySearch.provider` untuk menimpanya.

## Cara kerja pengindeksan

OpenClaw mengindeks `MEMORY.md` dan `memory/*.md` menjadi potongan (~400 token dengan
overlap 80 token) dan menyimpannya dalam database SQLite per agen.

- **Lokasi indeks:** `~/.openclaw/memory/<agentId>.sqlite`
- **Pemantauan file:** perubahan pada file memori memicu pengindeksan ulang dengan debounce (1,5 dtk).
- **Pengindeksan ulang otomatis:** ketika provider embedding, model, atau konfigurasi chunking
  berubah, seluruh indeks dibangun ulang secara otomatis.
- **Pengindeksan ulang sesuai permintaan:** `openclaw memory index --force`

<Info>
Anda juga dapat mengindeks file Markdown di luar workspace dengan
`memorySearch.extraPaths`. Lihat
[referensi konfigurasi](/id/reference/memory-config#additional-memory-paths).
</Info>

## Kapan digunakan

Mesin bawaan adalah pilihan yang tepat untuk sebagian besar pengguna:

- Bekerja langsung tanpa dependensi tambahan.
- Menangani pencarian keyword dan vektor dengan baik.
- Mendukung semua provider embedding.
- Pencarian hibrida menggabungkan kelebihan kedua pendekatan retrieval.

Pertimbangkan beralih ke [QMD](/id/concepts/memory-qmd) jika Anda memerlukan reranking, query
expansion, atau ingin mengindeks direktori di luar workspace.

Pertimbangkan [Honcho](/id/concepts/memory-honcho) jika Anda menginginkan memori lintas sesi dengan
pemodelan pengguna otomatis.

## Pemecahan masalah

**Pencarian memori dinonaktifkan?** Periksa `openclaw memory status`. Jika tidak ada provider yang
terdeteksi, setel satu secara eksplisit atau tambahkan API key.

**Provider lokal tidak terdeteksi?** Pastikan path lokal ada dan jalankan:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Baik perintah CLI mandiri maupun Gateway menggunakan id provider `local` yang sama.
Jika provider disetel ke `auto`, embedding lokal dipertimbangkan terlebih dahulu hanya
ketika `memorySearch.local.modelPath` menunjuk ke file lokal yang ada.

**Hasil usang?** Jalankan `openclaw memory index --force` untuk membangun ulang. Watcher
dapat melewatkan perubahan dalam kasus tepi yang jarang terjadi.

**sqlite-vec tidak dimuat?** OpenClaw secara otomatis fallback ke cosine similarity
dalam proses. Periksa log untuk error pemuatan spesifiknya.

## Konfigurasi

Untuk penyiapan provider embedding, penyesuaian pencarian hibrida (bobot, MMR, temporal
decay), pengindeksan batch, memori multimodal, sqlite-vec, extra path, dan semua
knob konfigurasi lainnya, lihat
[referensi konfigurasi Memory](/id/reference/memory-config).

## Terkait

- [Ikhtisar memory](/id/concepts/memory)
- [Pencarian memory](/id/concepts/memory-search)
- [Active Memory](/id/concepts/active-memory)
