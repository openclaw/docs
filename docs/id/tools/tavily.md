---
read_when:
    - Anda menginginkan web search yang didukung Tavily
    - Anda memerlukan API key Tavily
    - Anda menginginkan Tavily sebagai provider `web_search`
    - Anda menginginkan ekstraksi konten dari URL
summary: Tool pencarian dan ekstraksi Tavily
title: Tavily
x-i18n:
    generated_at: "2026-04-24T09:33:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9af858cd8507e3ebe6614f0695f568ce589798c816c8475685526422a048ef1a
    source_path: tools/tavily.md
    workflow: 15
---

OpenClaw dapat menggunakan **Tavily** dengan dua cara:

- sebagai provider `web_search`
- sebagai tool Plugin eksplisit: `tavily_search` dan `tavily_extract`

Tavily adalah API pencarian yang dirancang untuk aplikasi AI, mengembalikan hasil terstruktur
yang dioptimalkan untuk konsumsi LLM. Tavily mendukung kedalaman pencarian yang dapat dikonfigurasi, penyaringan topik,
filter domain, ringkasan jawaban yang dihasilkan AI, dan ekstraksi konten
dari URL (termasuk halaman yang dirender JavaScript).

## Dapatkan API key

1. Buat akun Tavily di [tavily.com](https://tavily.com/).
2. Hasilkan API key di dasbor.
3. Simpan di konfigurasi atau setel `TAVILY_API_KEY` di lingkungan Gateway.

## Konfigurasikan pencarian Tavily

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // opsional jika TAVILY_API_KEY disetel
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

Catatan:

- Memilih Tavily di onboarding atau `openclaw configure --section web` akan mengaktifkan
  Plugin bundled Tavily secara otomatis.
- Simpan konfigurasi Tavily di bawah `plugins.entries.tavily.config.webSearch.*`.
- `web_search` dengan Tavily mendukung `query` dan `count` (hingga 20 hasil).
- Untuk kontrol khusus Tavily seperti `search_depth`, `topic`, `include_answer`,
  atau filter domain, gunakan `tavily_search`.

## Tool Plugin Tavily

### `tavily_search`

Gunakan ini saat Anda menginginkan kontrol pencarian khusus Tavily alih-alih
`web_search` generik.

| Parameter         | Deskripsi                                                            |
| ----------------- | -------------------------------------------------------------------- |
| `query`           | String kueri pencarian (usahakan di bawah 400 karakter)              |
| `search_depth`    | `basic` (default, seimbang) atau `advanced` (relevansi tertinggi, lebih lambat) |
| `topic`           | `general` (default), `news` (pembaruan real-time), atau `finance`    |
| `max_results`     | Jumlah hasil, 1-20 (default: 5)                                      |
| `include_answer`  | Sertakan ringkasan jawaban yang dihasilkan AI (default: false)       |
| `time_range`      | Filter berdasarkan recency: `day`, `week`, `month`, atau `year`      |
| `include_domains` | Array domain untuk membatasi hasil ke domain tersebut                |
| `exclude_domains` | Array domain untuk dikecualikan dari hasil                           |

**Kedalaman pencarian:**

| Depth      | Speed    | Relevance | Terbaik untuk                           |
| ---------- | -------- | --------- | --------------------------------------- |
| `basic`    | Lebih cepat | Tinggi  | Kueri tujuan umum (default)             |
| `advanced` | Lebih lambat | Tertinggi | Presisi, fakta spesifik, riset       |

### `tavily_extract`

Gunakan ini untuk mengekstrak konten bersih dari satu atau lebih URL. Tool ini menangani
halaman yang dirender JavaScript dan mendukung pemotongan berbasis kueri untuk ekstraksi
yang ditargetkan.

| Parameter           | Deskripsi                                                   |
| ------------------- | ----------------------------------------------------------- |
| `urls`              | Array URL untuk diekstrak (1-20 per permintaan)             |
| `query`             | Ubah urutan chunk yang diekstrak berdasarkan relevansi terhadap kueri ini |
| `extract_depth`     | `basic` (default, cepat) atau `advanced` (untuk halaman yang berat JavaScript) |
| `chunks_per_source` | Jumlah chunk per URL, 1-5 (memerlukan `query`)              |
| `include_images`    | Sertakan URL gambar dalam hasil (default: false)            |

**Kedalaman ekstraksi:**

| Depth      | Kapan digunakan                              |
| ---------- | -------------------------------------------- |
| `basic`    | Halaman sederhana - coba ini terlebih dahulu |
| `advanced` | SPA yang dirender JavaScript, konten dinamis, tabel |

Tip:

- Maksimal 20 URL per permintaan. Batch daftar yang lebih besar ke beberapa panggilan.
- Gunakan `query` + `chunks_per_source` untuk mendapatkan hanya konten yang relevan alih-alih halaman penuh.
- Coba `basic` terlebih dahulu; kembali ke `advanced` jika konten hilang atau tidak lengkap.

## Memilih tool yang tepat

| Kebutuhan                             | Tool             |
| ------------------------------------- | ---------------- |
| Pencarian web cepat, tanpa opsi khusus | `web_search`    |
| Pencarian dengan depth, topic, jawaban AI | `tavily_search` |
| Ekstrak konten dari URL tertentu      | `tavily_extract` |

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua provider dan deteksi otomatis
- [Firecrawl](/id/tools/firecrawl) -- pencarian + scraping dengan ekstraksi konten
- [Exa Search](/id/tools/exa-search) -- pencarian neural dengan ekstraksi konten
