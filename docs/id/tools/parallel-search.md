---
read_when:
    - Anda ingin melakukan pencarian web tanpa kunci API
    - Anda menginginkan Search API berbayar Parallel
    - Anda menginginkan kutipan padat yang diperingkat untuk efisiensi konteks LLM
summary: Pencarian Paralel -- cuplikan padat dari sumber web yang dioptimalkan untuk LLM
title: Pencarian paralel
x-i18n:
    generated_at: "2026-06-27T18:20:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef64c2c125d2885385308dd8a57421b696fa1a9a5455b8c3b83854016f6514cb
    source_path: tools/parallel-search.md
    workflow: 16
---

Plugin Parallel menyediakan dua penyedia `web_search` [Parallel](https://parallel.ai/):

- **Parallel Search (Free)** (`parallel-free`) -- [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) gratis dari Parallel. Tidak memerlukan
  akun atau kunci API. Pilih secara eksplisit saat Anda menginginkan jalur pencarian
  tanpa kunci yang dihosting Parallel.
- **Parallel Search** (`parallel`) -- Search API berbayar dari Parallel. Memerlukan
  `PARALLEL_API_KEY` dan menawarkan batas laju yang lebih tinggi serta penyetelan objektif.

Keduanya mengembalikan cuplikan berperingkat yang dioptimalkan untuk LLM dari indeks web yang dibuat untuk agen AI.
Atur `tools.web.search.provider` ke `parallel-free` atau `parallel` untuk memilih salah satunya
secara eksplisit.

<Note>
  Model OpenAI Responses menggunakan pencarian web native OpenAI saat
  `tools.web.search.provider` tidak diatur, sehingga model tersebut melewati penyedia Parallel.
  Atur `tools.web.search.provider` ke `parallel-free` atau `parallel` untuk merutekannya
  melalui Parallel.
</Note>

## Instal Plugin

Instal Plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## Kunci API (penyedia berbayar)

`parallel-free` tidak memerlukan kunci API, tetapi tetap harus dipilih sebagai
penyedia terkelola. Penyedia `parallel` berbayar memerlukan kunci API:

<Steps>
  <Step title="Buat akun">
    Daftar di [platform.parallel.ai](https://platform.parallel.ai) dan
    buat kunci API dari dasbor Anda.
  </Step>
  <Step title="Simpan kunci">
    Atur `PARALLEL_API_KEY` di lingkungan Gateway, atau konfigurasikan melalui:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Konfigurasi

```json5
{
  plugins: {
    entries: {
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // optional if PARALLEL_API_KEY is set
            baseUrl: "https://api.parallel.ai", // optional; OpenClaw appends /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // Use "parallel-free" for the free Search MCP, or "parallel" for
        // the paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**Alternatif lingkungan:** atur `PARALLEL_API_KEY` di lingkungan Gateway.
Untuk instalasi gateway, masukkan ke `~/.openclaw/.env`.

## Penggantian URL dasar

Penggantian URL dasar hanya berlaku untuk penyedia `parallel` berbayar. Penyedia gratis
`parallel-free` selalu menggunakan `https://search.parallel.ai/mcp`.

Atur `plugins.entries.parallel.config.webSearch.baseUrl` saat permintaan Parallel
harus melalui proxy yang kompatibel atau endpoint Parallel alternatif (misalnya,
Cloudflare AI Gateway). OpenClaw menormalkan host polos dengan
menambahkan awalan `https://` dan menambahkan `/v1/search` kecuali path sudah berakhir
di sana. Endpoint yang diselesaikan disertakan dalam kunci cache pencarian, sehingga hasil
dari endpoint Parallel yang berbeda tidak dibagikan.

## Parameter alat

OpenClaw mengekspos bentuk pencarian native Parallel sehingga model dapat mengisi baik
tujuan bahasa alami maupun beberapa kueri kata kunci pendek — pasangan yang
[direkomendasikan](https://docs.parallel.ai/search/best-practices) Parallel untuk
hasil terbaik.

<ParamField path="objective" type="string" required>
Deskripsi bahasa alami tentang pertanyaan atau tujuan yang mendasari (maks 5000
karakter). Harus mandiri.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Kueri pencarian kata kunci yang ringkas, masing-masing 3-6 kata (1-5 entri, maks 200 karakter
masing-masing). Berikan 2-3 kueri yang beragam untuk hasil terbaik.
</ParamField>

<ParamField path="count" type="number">
Hasil yang akan dikembalikan (1-40).
</ParamField>

<ParamField path="session_id" type="string">
ID sesi Parallel opsional (maks 1000 karakter pada `parallel`; Search MCP gratis
`parallel-free` membatasinya pada 100). Teruskan `sessionId` dari hasil Parallel sebelumnya
pada pencarian lanjutan yang merupakan bagian dari tugas yang sama agar Parallel
dapat mengelompokkan panggilan terkait dan meningkatkan hasil berikutnya. ID yang melewati batas
dihapus dan yang baru dibuat.
</ParamField>

<ParamField path="client_model" type="string">
Pengidentifikasi opsional untuk model yang melakukan panggilan (mis. `claude-opus-4-7`,
`gpt-5.5`). Memungkinkan Parallel menyesuaikan pengaturan default untuk
kemampuan model Anda. Teruskan slug model aktif yang persis; jangan mempersingkatnya menjadi alias
keluarga.
</ParamField>

## Catatan

- Parallel memberi peringkat dan mengompresi hasil berdasarkan utilitas penalaran LLM, bukan
  click-through manusia; harapkan cuplikan padat di setiap hasil, bukan
  konten halaman penuh
- Cuplikan hasil dikembalikan sebagai array `excerpts` dan juga digabungkan ke dalam
  bidang `description` untuk kompatibilitas dengan kontrak `web_search`
  generik
- Parallel mengembalikan `session_id` pada setiap respons; OpenClaw mengeksposnya sebagai
  `sessionId` dalam payload alat agar pemanggil dapat mengelompokkan pencarian lanjutan
- `searchId`, `warnings`, dan `usage` dari Parallel diteruskan saat
  ada
- OpenClaw selalu meneruskan jumlah hasil yang diselesaikan ke Parallel sebagai
  `advanced_settings.max_results`. Arg `count` pemanggil menang, lalu pengaturan
  tingkat atas `tools.web.search.maxResults`, jika tidak default
  `web_search` generik OpenClaw (5). Ini menjaga volume hasil tetap konsisten
  saat beralih antarpenyedia; Parallel sendiri default ke 10
- Hasil di-cache selama 15 menit secara default (dapat dikonfigurasi melalui
  `cacheTtlMinutes`)
- Penyedia gratis `parallel-free` menerima parameter yang sama. Penyedia ini menerapkan
  `count` di sisi klien dan menghasilkan `session_id` per panggilan saat tidak
  disediakan.

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Pencarian Exa](/id/tools/exa-search) -- pencarian neural dengan ekstraksi konten
- [Perplexity Search](/id/tools/perplexity-search) -- hasil terstruktur dengan pemfilteran domain
