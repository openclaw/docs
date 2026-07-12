---
read_when:
    - Anda ingin melakukan pencarian web tanpa kunci API
    - Anda ingin Search API berbayar dari Parallel
    - Anda menginginkan kutipan padat yang diperingkatkan untuk efisiensi konteks LLM
summary: Pencarian Paralel -- Kutipan padat yang dioptimalkan untuk LLM dari sumber web
title: Pencarian paralel
x-i18n:
    generated_at: "2026-07-12T14:47:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

Plugin Parallel menyediakan dua penyedia `web_search` [Parallel](https://parallel.ai/), yang keduanya mengembalikan kutipan berperingkat dan dioptimalkan untuk LLM dari indeks web yang dibangun untuk agen AI:

| Penyedia                  | id              | Autentikasi                                                                                  |
| ------------------------- | --------------- | -------------------------------------------------------------------------------------------- |
| Pencarian Parallel (Gratis) | `parallel-free` | Tidak ada -- [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) gratis dari Parallel |
| Pencarian Parallel        | `parallel`      | `PARALLEL_API_KEY` -- API Pencarian berbayar, batas laju lebih tinggi dan penyesuaian objektif |

Atur `tools.web.search.provider` ke `parallel-free` atau `parallel` untuk memilih salah satunya secara eksplisit; keduanya tidak dideteksi secara otomatis.

<Note>
  Model OpenAI Responses langsung (`api: "openai-responses"`, penyedia
  `openai`, URL dasar API resmi) secara otomatis menggunakan pencarian web
  native yang dihosting OpenAI ketika `tools.web.search.provider` tidak diatur,
  kosong, `"auto"`, atau `"openai"` -- sehingga secara default melewati
  Parallel. Atur `tools.web.search.provider` ke `parallel-free` atau `parallel`
  agar permintaan diarahkan melalui Parallel. Lihat
  [ikhtisar Pencarian Web](/id/tools/web).
</Note>

## Instal Plugin

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## Kunci API (penyedia berbayar)

`parallel-free` tidak memerlukan kunci, tetapi tetap harus dipilih secara eksplisit.
Penyedia `parallel` berbayar memerlukan kunci API:

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
            apiKey: "par-...", // opsional jika PARALLEL_API_KEY telah diatur
            baseUrl: "https://api.parallel.ai", // opsional; OpenClaw menambahkan /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // "parallel-free" untuk Search MCP gratis, atau "parallel" untuk
        // penyedia berbayar berbasis API yang ditampilkan di sini.
        provider: "parallel",
      },
    },
  },
}
```

**Alternatif lingkungan:** atur `PARALLEL_API_KEY` di lingkungan Gateway. Untuk instalasi Gateway, letakkan di `~/.openclaw/.env`.

## Penggantian URL dasar

Hanya berlaku untuk penyedia `parallel` berbayar; `parallel-free` selalu menggunakan
`https://search.parallel.ai/mcp` dan mengabaikan pengaturan ini.

Atur `plugins.entries.parallel.config.webSearch.baseUrl` untuk mengarahkan permintaan berbayar melalui proksi yang kompatibel atau titik akhir alternatif (misalnya, Cloudflare AI Gateway). OpenClaw menormalkan host tanpa skema dengan menambahkan `https://` di awal dan menambahkan `/v1/search` kecuali jalurnya sudah berakhir demikian. Titik akhir yang dihasilkan menjadi bagian dari kunci tembolok pencarian, sehingga hasil dari titik akhir yang berbeda tidak pernah dibagikan.

## Parameter alat

Kedua penyedia mengekspos bentuk pencarian native Parallel agar model mengisi tujuan dalam bahasa alami beserta beberapa kueri kata kunci singkat -- pasangan yang [direkomendasikan](https://docs.parallel.ai/search/best-practices) Parallel untuk hasil terbaik.

<ParamField path="objective" type="string" required>
Deskripsi dalam bahasa alami mengenai pertanyaan atau tujuan yang mendasarinya (maks. 5000 karakter). Harus dapat dipahami secara mandiri.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Kueri pencarian kata kunci yang ringkas, masing-masing 3-6 kata (1-5 entri, maks. 200 karakter per entri). Berikan 2-3 kueri yang beragam untuk hasil terbaik.
</ParamField>

<ParamField path="count" type="number">
Jumlah hasil yang dikembalikan (1-40).
</ParamField>

<ParamField path="session_id" type="string">
ID sesi Parallel opsional dari `sessionId` hasil sebelumnya. Teruskan pada pencarian lanjutan dalam tugas yang sama agar Parallel mengelompokkan panggilan terkait dan meningkatkan hasil berikutnya. Maks. 1000 karakter pada `parallel`; Search MCP gratis `parallel-free` membatasinya hingga 100. ID yang melampaui batas akan dibuang (berbayar) atau dibuatkan yang baru (gratis).
</ParamField>

<ParamField path="client_model" type="string">
Pengidentifikasi opsional untuk model yang melakukan panggilan (misalnya `claude-opus-4-7`, `gpt-5.6-sol`), maks. 100 karakter. Memungkinkan Parallel menyesuaikan pengaturan default dengan kemampuan model Anda. Teruskan slug model aktif yang persis; jangan memendekkannya menjadi alias keluarga.
</ParamField>

## Catatan

- Parallel memberi peringkat dan memampatkan hasil untuk kegunaan penalaran LLM, bukan untuk klik-tayang manusia; hasilnya berupa kutipan padat per hasil, bukan konten halaman penuh.
- Kutipan hasil dikembalikan sebagai larik `excerpts` dan juga digabungkan ke dalam `description` untuk kompatibilitas dengan kontrak `web_search` generik.
- Kedua penyedia mengembalikan `session_id`; OpenClaw menampilkannya sebagai `sessionId` dalam muatan alat agar pemanggil dapat mengelompokkan pencarian lanjutan. ID sesi yang dihasilkan Parallel (yang tidak diberikan oleh pemanggil) dikecualikan dari entri tembolok, karena tugas yang tidak terkait dengan kueri identik tidak boleh mewarisinya.
- `searchId`, `warnings`, dan `usage` dari Parallel diteruskan jika tersedia.
- OpenClaw selalu meneruskan jumlah hasil yang telah ditentukan ke Parallel sebagai `advanced_settings.max_results` (`parallel`) atau menerapkan `count` di sisi klien setelah respons berukuran tetap dari Parallel (`parallel-free`). Argumen `count` dari pemanggil diprioritaskan, lalu `tools.web.search.maxResults`, atau jika keduanya tidak ada, nilai default `web_search` generik OpenClaw (5) -- nilai default API Parallel sendiri adalah 10.
- Hasil disimpan dalam tembolok selama 15 menit secara default (`cacheTtlMinutes`).
- `parallel-free` membuat `session_id` baru untuk setiap panggilan melalui jabat tangan MCP ketika pemanggil tidak memberikannya; dalam kasus tersebut, `parallel` membiarkannya tidak diatur.

## Terkait

- [Ikhtisar Pencarian Web](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Pencarian Exa](/id/tools/exa-search) -- pencarian neural dengan ekstraksi konten
- [Pencarian Perplexity](/id/tools/perplexity-search) -- hasil terstruktur dengan pemfilteran domain
