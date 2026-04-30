---
read_when:
    - Anda ingin memahami backend memori bawaan
    - Anda ingin mengonfigurasi penyedia penyematan atau pencarian hibrida
summary: Backend memori berbasis SQLite bawaan dengan pencarian kata kunci, vektor, dan hibrida
title: Mesin memori bawaan
x-i18n:
    generated_at: "2026-04-30T09:43:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: aa1597a9a49a6f1124cedf49f6f5a4c336f76dd5998ced246affb9c2e8171f05
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Mesin bawaan adalah backend memori default. Mesin ini menyimpan indeks memori Anda dalam
basis data SQLite per agen dan tidak memerlukan dependensi tambahan untuk memulai.

## Yang disediakan

- **Pencarian kata kunci** melalui pengindeksan teks penuh FTS5 (skor BM25).
- **Pencarian vektor** melalui embedding dari penyedia mana pun yang didukung.
- **Pencarian hybrid** yang menggabungkan keduanya untuk hasil terbaik.
- **Dukungan CJK** melalui tokenisasi trigram untuk bahasa Mandarin, Jepang, dan Korea.
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

| Penyedia  | ID          | Terdeteksi otomatis | Catatan                              |
| --------- | ----------- | ------------------- | ------------------------------------ |
| OpenAI    | `openai`    | Ya                  | Bawaan: `text-embedding-3-small`     |
| Gemini    | `gemini`    | Ya                  | Mendukung multimodal (gambar + audio) |
| Voyage    | `voyage`    | Ya                  |                                      |
| Mistral   | `mistral`   | Ya                  |                                      |
| DeepInfra | `deepinfra` | Ya                  | Bawaan: `BAAI/bge-m3`                |
| Ollama    | `ollama`    | Tidak               | Lokal, tetapkan secara eksplisit     |
| Lokal     | `local`     | Ya (pertama)        | Runtime `node-llama-cpp` opsional    |

Deteksi otomatis memilih penyedia pertama yang kunci API-nya dapat diselesaikan, dalam
urutan yang ditampilkan. Tetapkan `memorySearch.provider` untuk menimpa.

## Cara kerja pengindeksan

OpenClaw mengindeks `MEMORY.md` dan `memory/*.md` menjadi potongan (~400 token dengan
tumpang tindih 80 token) dan menyimpannya dalam basis data SQLite per agen.

- **Lokasi indeks:** `~/.openclaw/memory/<agentId>.sqlite`
- **Pemeliharaan penyimpanan:** sidecar WAL SQLite dibatasi dengan checkpoint berkala dan
  saat shutdown.
- **Pemantauan file:** perubahan pada file memori memicu pengindeksan ulang dengan debounce (1,5 dtk).
- **Pengindeksan ulang otomatis:** ketika penyedia embedding, model, atau konfigurasi pemotongan
  berubah, seluruh indeks dibangun ulang secara otomatis.
- **Pengindeksan ulang sesuai permintaan:** `openclaw memory index --force`

<Info>
Anda juga dapat mengindeks file Markdown di luar workspace dengan
`memorySearch.extraPaths`. Lihat
[referensi konfigurasi](/id/reference/memory-config#additional-memory-paths).
</Info>

## Kapan digunakan

Mesin bawaan adalah pilihan yang tepat bagi sebagian besar pengguna:

- Langsung berfungsi tanpa dependensi tambahan.
- Menangani pencarian kata kunci dan vektor dengan baik.
- Mendukung semua penyedia embedding.
- Pencarian hybrid menggabungkan yang terbaik dari kedua pendekatan retrieval.

Pertimbangkan beralih ke [QMD](/id/concepts/memory-qmd) jika Anda memerlukan reranking, perluasan
kueri, atau ingin mengindeks direktori di luar workspace.

Pertimbangkan [Honcho](/id/concepts/memory-honcho) jika Anda menginginkan memori lintas sesi dengan
pemodelan pengguna otomatis.

## Pemecahan masalah

**Pencarian memori dinonaktifkan?** Periksa `openclaw memory status`. Jika tidak ada penyedia yang
terdeteksi, tetapkan satu secara eksplisit atau tambahkan kunci API.

**Penyedia lokal tidak terdeteksi?** Pastikan jalur lokal ada dan jalankan:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Baik perintah CLI mandiri maupun Gateway menggunakan id penyedia `local` yang sama.
Jika penyedia ditetapkan ke `auto`, embedding lokal hanya dipertimbangkan pertama
ketika `memorySearch.local.modelPath` mengarah ke file lokal yang ada.

**Hasil usang?** Jalankan `openclaw memory index --force` untuk membangun ulang. Pemantau
dapat melewatkan perubahan dalam kasus tepi yang jarang terjadi.

**sqlite-vec tidak dimuat?** OpenClaw otomatis kembali ke cosine similarity dalam proses.
Periksa log untuk galat pemuatan yang spesifik.

## Konfigurasi

Untuk penyiapan penyedia embedding, penyesuaian pencarian hybrid (bobot, MMR, peluruhan
temporal), pengindeksan batch, memori multimodal, sqlite-vec, jalur tambahan, dan semua
kenop konfigurasi lainnya, lihat
[referensi konfigurasi Memori](/id/reference/memory-config).

## Terkait

- [Ikhtisar memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Active Memory](/id/concepts/active-memory)
