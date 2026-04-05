---
read_when:
    - Anda ingin pencarian web berbasis Tavily
    - Anda memerlukan API key Tavily
    - Anda ingin Tavily sebagai provider `web_search`
    - Anda ingin ekstraksi konten dari URL
summary: Tool pencarian dan ekstraksi Tavily
title: Tavily
x-i18n:
    generated_at: "2026-04-05T14:09:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: db530cc101dc930611e4ca54e3d5972140f116bfe168adc939dc5752322d205e
    source_path: tools/tavily.md
    workflow: 15
---

# Tavily

OpenClaw dapat menggunakan **Tavily** dengan dua cara:

- sebagai provider `web_search`
- sebagai tool plugin eksplisit: `tavily_search` dan `tavily_extract`

Tavily adalah API pencarian yang dirancang untuk aplikasi AI, mengembalikan hasil terstruktur
yang dioptimalkan untuk konsumsi LLM. Tavily mendukung kedalaman pencarian yang dapat dikonfigurasi, pemfilteran topik,
filter domain, ringkasan jawaban yang dihasilkan AI, dan ekstraksi konten
dari URL (termasuk halaman yang dirender dengan JavaScript).

## Dapatkan API key

1. Buat akun Tavily di [tavily.com](https://tavily.com/).
2. Buat API key di dashboard.
3. Simpan di konfigurasi atau setel `TAVILY_API_KEY` di environment gateway.

## Konfigurasikan pencarian Tavily

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
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

- Memilih Tavily saat onboarding atau `openclaw configure --section web` akan mengaktifkan
  plugin Tavily bawaan secara otomatis.
- Simpan konfigurasi Tavily di bawah `plugins.entries.tavily.config.webSearch.*`.
- `web_search` dengan Tavily mendukung `query` dan `count` (hingga 20 hasil).
- Untuk kontrol khusus Tavily seperti `search_depth`, `topic`, `include_answer`,
  atau filter domain, gunakan `tavily_search`.

## Tool plugin Tavily

### `tavily_search`

Gunakan ini saat Anda menginginkan kontrol pencarian khusus Tavily alih-alih
`web_search` generik.

| Parameter         | Deskripsi                                                           |
| ----------------- | ------------------------------------------------------------------- |
| `query`           | String kueri pencarian (usahakan di bawah 400 karakter)             |
| `search_depth`    | `basic` (default, seimbang) atau `advanced` (relevansi tertinggi, lebih lambat) |
| `topic`           | `general` (default), `news` (pembaruan real-time), atau `finance`   |
| `max_results`     | Jumlah hasil, 1-20 (default: 5)                                     |
| `include_answer`  | Sertakan ringkasan jawaban yang dihasilkan AI (default: false)      |
| `time_range`      | Filter berdasarkan kebaruan: `day`, `week`, `month`, atau `year`    |
| `include_domains` | Array domain untuk membatasi hasil                                  |
| `exclude_domains` | Array domain untuk dikecualikan dari hasil                          |

**Kedalaman pencarian:**

| Depth      | Kecepatan | Relevansi | Paling cocok untuk                   |
| ---------- | --------- | --------- | ------------------------------------ |
| `basic`    | Lebih cepat | Tinggi  | Kueri tujuan umum (default)          |
| `advanced` | Lebih lambat | Tertinggi | Presisi, fakta spesifik, riset     |

### `tavily_extract`

Gunakan ini untuk mengekstrak konten bersih dari satu atau beberapa URL. Menangani
halaman yang dirender dengan JavaScript dan mendukung chunking yang berfokus pada kueri untuk
ekstraksi yang ditargetkan.

| Parameter           | Deskripsi                                                  |
| ------------------- | ---------------------------------------------------------- |
| `urls`              | Array URL untuk diekstrak (1-20 per permintaan)            |
| `query`             | Urutkan ulang chunk hasil ekstraksi berdasarkan relevansi ke kueri ini |
| `extract_depth`     | `basic` (default, cepat) atau `advanced` (untuk halaman yang banyak JS) |
| `chunks_per_source` | Chunk per URL, 1-5 (memerlukan `query`)                    |
| `include_images`    | Sertakan URL gambar dalam hasil (default: false)           |

**Kedalaman ekstraksi:**

| Depth      | Kapan digunakan                            |
| ---------- | ------------------------------------------ |
| `basic`    | Halaman sederhana - coba ini terlebih dahulu |
| `advanced` | SPA yang dirender JS, konten dinamis, tabel |

Tips:

- Maksimal 20 URL per permintaan. Bagi daftar yang lebih besar menjadi beberapa panggilan.
- Gunakan `query` + `chunks_per_source` untuk hanya mendapatkan konten yang relevan alih-alih seluruh halaman.
- Coba `basic` terlebih dahulu; fallback ke `advanced` jika konten hilang atau tidak lengkap.

## Memilih tool yang tepat

| Kebutuhan                            | Tool             |
| ------------------------------------ | ---------------- |
| Pencarian web cepat, tanpa opsi khusus | `web_search`   |
| Pencarian dengan depth, topic, jawaban AI | `tavily_search` |
| Ekstraksi konten dari URL tertentu   | `tavily_extract` |

## Terkait

- [Ikhtisar Web Search](/tools/web) -- semua provider dan auto-detection
- [Firecrawl](/tools/firecrawl) -- pencarian + scraping dengan ekstraksi konten
- [Exa Search](/tools/exa-search) -- pencarian neural dengan ekstraksi konten
