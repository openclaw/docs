---
read_when:
    - Anda ingin mengaktifkan atau mengonfigurasi web_search
    - Anda ingin mengaktifkan atau mengonfigurasi x_search
    - Anda perlu memilih penyedia pencarian
    - Anda ingin memahami deteksi otomatis dan fallback penyedia
sidebarTitle: Web Search
summary: web_search, x_search, dan web_fetch -- cari di web, cari postingan X, atau ambil konten halaman
title: Pencarian web
x-i18n:
    generated_at: "2026-04-30T10:18:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9f8233a33f0729c6413eda59c4ebc3338a1e398e8280eb12650197225ef8981e
    source_path: tools/web.md
    workflow: 16
---

Alat `web_search` menelusuri web menggunakan penyedia yang Anda konfigurasi dan
mengembalikan hasil. Hasil di-cache berdasarkan kueri selama 15 menit (dapat dikonfigurasi).

OpenClaw juga menyertakan `x_search` untuk posting X (sebelumnya Twitter) dan
`web_fetch` untuk pengambilan URL ringan. Pada fase ini, `web_fetch` tetap
lokal sementara `web_search` dan `x_search` dapat menggunakan xAI Responses di balik layar.

<Info>
  `web_search` adalah alat HTTP ringan, bukan otomatisasi browser. Untuk situs
  yang berat JS atau login, gunakan [Browser Web](/id/tools/browser). Untuk
  mengambil URL tertentu, gunakan [Web Fetch](/id/tools/web-fetch).
</Info>

## Mulai cepat

<Steps>
  <Step title="Choose a provider">
    Pilih penyedia dan selesaikan penyiapan yang diperlukan. Beberapa penyedia
    bebas kunci, sementara yang lain menggunakan kunci API. Lihat halaman penyedia di bawah untuk
    detail.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    Ini menyimpan penyedia dan kredensial apa pun yang diperlukan. Anda juga dapat menetapkan env
    var (misalnya `BRAVE_API_KEY`) dan melewati langkah ini untuk penyedia
    berbasis API.
  </Step>
  <Step title="Use it">
    Agen kini dapat memanggil `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Untuk posting X, gunakan:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Memilih penyedia

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/id/tools/brave-search">
    Hasil terstruktur dengan cuplikan. Mendukung mode `llm-context`, filter negara/bahasa. Tingkat gratis tersedia.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/id/tools/duckduckgo-search">
    Fallback bebas kunci. Tidak perlu kunci API. Integrasi tidak resmi berbasis HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/id/tools/exa-search">
    Pencarian neural + kata kunci dengan ekstraksi konten (sorotan, teks, ringkasan).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/id/tools/firecrawl">
    Hasil terstruktur. Paling baik dipasangkan dengan `firecrawl_search` dan `firecrawl_scrape` untuk ekstraksi mendalam.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/id/tools/gemini-search">
    Jawaban yang disintesis AI dengan sitasi melalui grounding Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/id/tools/grok-search">
    Jawaban yang disintesis AI dengan sitasi melalui grounding web xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/id/tools/kimi-search">
    Jawaban yang disintesis AI dengan sitasi melalui pencarian web Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/id/tools/minimax-search">
    Hasil terstruktur melalui API pencarian MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/id/tools/ollama-search">
    Cari melalui host Ollama lokal yang sudah masuk atau API Ollama yang di-host.
  </Card>
  <Card title="Perplexity" icon="search" href="/id/tools/perplexity-search">
    Hasil terstruktur dengan kontrol ekstraksi konten dan pemfilteran domain.
  </Card>
  <Card title="SearXNG" icon="server" href="/id/tools/searxng-search">
    Meta-search yang di-host sendiri. Tidak perlu kunci API. Mengagregasi Google, Bing, DuckDuckGo, dan lainnya.
  </Card>
  <Card title="Tavily" icon="globe" href="/id/tools/tavily">
    Hasil terstruktur dengan kedalaman pencarian, pemfilteran topik, dan `tavily_extract` untuk ekstraksi URL.
  </Card>
</CardGroup>

### Perbandingan penyedia

| Penyedia                                  | Gaya hasil                 | Filter                                           | Kunci API                                                                               |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/id/tools/brave-search)              | Cuplikan terstruktur       | Negara, bahasa, waktu, mode `llm-context`        | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/id/tools/duckduckgo-search)    | Cuplikan terstruktur       | --                                               | Tidak ada (bebas kunci)                                                                 |
| [Exa](/id/tools/exa-search)                  | Terstruktur + diekstrak    | Mode neural/kata kunci, tanggal, ekstraksi konten | `EXA_API_KEY`                                                                           |
| [Firecrawl](/id/tools/firecrawl)             | Cuplikan terstruktur       | Melalui alat `firecrawl_search`                  | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/id/tools/gemini-search)            | Disintesis AI + sitasi     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/id/tools/grok-search)                | Disintesis AI + sitasi     | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/id/tools/kimi-search)                | Disintesis AI + sitasi     | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/id/tools/minimax-search)   | Cuplikan terstruktur       | Wilayah (`global` / `cn`)                        | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                      |
| [Ollama Web Search](/id/tools/ollama-search) | Cuplikan terstruktur       | --                                               | Tidak ada untuk host lokal yang sudah masuk; `OLLAMA_API_KEY` untuk pencarian langsung `https://ollama.com` |
| [Perplexity](/id/tools/perplexity-search)    | Cuplikan terstruktur       | Negara, bahasa, waktu, domain, batas konten      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/id/tools/searxng-search)          | Cuplikan terstruktur       | Kategori, bahasa                                 | Tidak ada (di-host sendiri)                                                             |
| [Tavily](/id/tools/tavily)                   | Cuplikan terstruktur       | Melalui alat `tavily_search`                     | `TAVILY_API_KEY`                                                                        |

## Deteksi otomatis

## Pencarian web OpenAI native

Model OpenAI Responses langsung menggunakan alat `web_search` yang di-host OpenAI secara otomatis ketika pencarian web OpenClaw diaktifkan dan tidak ada penyedia terkelola yang dipatok. Ini adalah perilaku milik penyedia di Plugin OpenAI bundel dan hanya berlaku untuk lalu lintas API OpenAI native, bukan URL dasar proksi yang kompatibel dengan OpenAI atau rute Azure. Tetapkan `tools.web.search.provider` ke penyedia lain seperti `brave` untuk mempertahankan alat `web_search` terkelola bagi model OpenAI, atau tetapkan `tools.web.search.enabled: false` untuk menonaktifkan pencarian terkelola dan pencarian OpenAI native.

## Pencarian web Codex native

Model berkemampuan Codex secara opsional dapat menggunakan alat `web_search` Responses native penyedia sebagai pengganti fungsi `web_search` terkelola OpenClaw.

- Konfigurasikan di bawah `tools.web.search.openaiCodex`
- Ini hanya aktif untuk model berkemampuan Codex (`openai-codex/*` atau penyedia yang menggunakan `api: "openai-codex-responses"`)
- `web_search` terkelola tetap berlaku untuk model non-Codex
- `mode: "cached"` adalah pengaturan default dan direkomendasikan
- `tools.web.search.enabled: false` menonaktifkan pencarian terkelola dan native

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

Jika pencarian Codex native diaktifkan tetapi model saat ini tidak berkemampuan Codex, OpenClaw mempertahankan perilaku `web_search` terkelola normal.

## Menyiapkan pencarian web

Daftar penyedia di dokumentasi dan alur penyiapan bersifat alfabetis. Deteksi otomatis mempertahankan
urutan prioritas yang terpisah.

Jika tidak ada `provider` yang ditetapkan, OpenClaw memeriksa penyedia dalam urutan ini dan menggunakan
yang pertama siap:

Penyedia berbasis API terlebih dahulu:

1. **Brave** -- `BRAVE_API_KEY` atau `plugins.entries.brave.config.webSearch.apiKey` (urutan 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` atau `plugins.entries.minimax.config.webSearch.apiKey` (urutan 15)
3. **Gemini** -- `GEMINI_API_KEY` atau `plugins.entries.google.config.webSearch.apiKey` (urutan 20)
4. **Grok** -- `XAI_API_KEY` atau `plugins.entries.xai.config.webSearch.apiKey` (urutan 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` atau `plugins.entries.moonshot.config.webSearch.apiKey` (urutan 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` atau `plugins.entries.perplexity.config.webSearch.apiKey` (urutan 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webSearch.apiKey` (urutan 60)
8. **Exa** -- `EXA_API_KEY` atau `plugins.entries.exa.config.webSearch.apiKey` (urutan 65)
9. **Tavily** -- `TAVILY_API_KEY` atau `plugins.entries.tavily.config.webSearch.apiKey` (urutan 70)

Fallback bebas kunci setelah itu:

10. **DuckDuckGo** -- fallback HTML bebas kunci tanpa akun atau kunci API (urutan 100)
11. **Ollama Web Search** -- fallback bebas kunci melalui host Ollama lokal yang Anda konfigurasi ketika dapat dijangkau dan sudah masuk dengan `ollama signin`; dapat menggunakan ulang autentikasi bearer penyedia Ollama saat host membutuhkannya, dan dapat memanggil pencarian langsung `https://ollama.com` saat dikonfigurasi dengan `OLLAMA_API_KEY` (urutan 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl` (urutan 200)

Jika tidak ada penyedia yang terdeteksi, sistem akan fallback ke Brave (Anda akan mendapatkan galat kunci hilang
yang meminta Anda mengonfigurasi salah satunya).

<Note>
  Semua kolom kunci penyedia mendukung objek SecretRef. SecretRef dalam cakupan Plugin
  di bawah `plugins.entries.<plugin>.config.webSearch.apiKey` diselesaikan untuk
  penyedia pencarian web berbasis API bundel, termasuk Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity, dan Tavily,
  baik penyedia dipilih secara eksplisit melalui `tools.web.search.provider` maupun
  dipilih melalui deteksi otomatis. Dalam mode deteksi otomatis, OpenClaw hanya menyelesaikan
  kunci penyedia yang dipilih -- SecretRef yang tidak dipilih tetap tidak aktif, sehingga Anda dapat
  menyimpan beberapa penyedia yang dikonfigurasi tanpa membayar biaya resolusi untuk
  yang tidak Anda gunakan.
</Note>

## Konfigurasi

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Konfigurasi khusus penyedia (kunci API, URL dasar, mode) berada di bawah
`plugins.entries.<plugin>.config.webSearch.*`. Lihat halaman penyedia untuk
contoh.

Pemilihan penyedia fallback `web_fetch` terpisah:

- pilih dengan `tools.web.fetch.provider`
- atau hilangkan kolom itu dan biarkan OpenClaw mendeteksi otomatis penyedia web-fetch siap pertama
  dari kredensial yang tersedia
- saat ini penyedia web-fetch bundel adalah Firecrawl, dikonfigurasi di bawah
  `plugins.entries.firecrawl.config.webFetch.*`

Ketika Anda memilih **Kimi** selama `openclaw onboard` atau
`openclaw configure --section web`, OpenClaw juga dapat meminta:

- wilayah API Moonshot (`https://api.moonshot.ai/v1` atau `https://api.moonshot.cn/v1`)
- model pencarian web Kimi default (default ke `kimi-k2.6`)

Untuk `x_search`, konfigurasikan `plugins.entries.xai.config.xSearch.*`. Ini menggunakan fallback `XAI_API_KEY` yang sama seperti pencarian web Grok.
Konfigurasi lama `tools.web.x_search.*` dimigrasikan otomatis oleh `openclaw doctor --fix`.
Saat Anda memilih Grok selama `openclaw onboard` atau `openclaw configure --section web`, OpenClaw juga dapat menawarkan penyiapan `x_search` opsional dengan kunci yang sama.
Ini adalah langkah lanjutan terpisah di dalam jalur Grok, bukan pilihan penyedia pencarian web tingkat atas yang terpisah. Jika Anda memilih penyedia lain, OpenClaw tidak menampilkan prompt `x_search`.

### Menyimpan kunci API

<Tabs>
  <Tab title="File konfigurasi">
    Jalankan `openclaw configure --section web` atau atur kunci secara langsung:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Variabel lingkungan">
    Atur variabel lingkungan penyedia di lingkungan proses Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.
    Lihat [Variabel lingkungan](/id/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parameter alat

| Parameter             | Deskripsi                                             |
| --------------------- | ----------------------------------------------------- |
| `query`               | Kueri pencarian (wajib)                               |
| `count`               | Hasil yang dikembalikan (1-10, default: 5)            |
| `country`             | Kode negara ISO 2 huruf (mis. "US", "DE")             |
| `language`            | Kode bahasa ISO 639-1 (mis. "en", "de")               |
| `search_lang`         | Kode bahasa pencarian (hanya Brave)                   |
| `freshness`           | Filter waktu: `day`, `week`, `month`, atau `year`     |
| `date_after`          | Hasil setelah tanggal ini (YYYY-MM-DD)                |
| `date_before`         | Hasil sebelum tanggal ini (YYYY-MM-DD)                |
| `ui_lang`             | Kode bahasa UI (hanya Brave)                          |
| `domain_filter`       | Array allowlist/denylist domain (hanya Perplexity)    |
| `max_tokens`          | Anggaran total konten, default 25000 (hanya Perplexity) |
| `max_tokens_per_page` | Batas token per halaman, default 2048 (hanya Perplexity) |

<Warning>
  Tidak semua parameter berfungsi dengan semua penyedia. Mode Brave `llm-context`
  menolak `ui_lang`, `freshness`, `date_after`, dan `date_before`.
  Gemini, Grok, dan Kimi mengembalikan satu jawaban tersintesis dengan sitasi. Mereka
  menerima `count` untuk kompatibilitas alat bersama, tetapi itu tidak mengubah
  bentuk jawaban yang berbasis sumber.
  Perplexity berperilaku sama saat Anda menggunakan jalur kompatibilitas
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` atau `OPENROUTER_API_KEY`).
  SearXNG menerima `http://` hanya untuk host jaringan pribadi tepercaya atau local loopback;
  endpoint SearXNG publik harus menggunakan `https://`.
  Firecrawl dan Tavily hanya mendukung `query` dan `count` melalui `web_search`
  -- gunakan alat khusus mereka untuk opsi lanjutan.
</Warning>

## x_search

`x_search` mengueri postingan X (sebelumnya Twitter) menggunakan xAI dan mengembalikan
jawaban tersintesis AI dengan sitasi. Ini menerima kueri bahasa alami dan
filter terstruktur opsional. OpenClaw hanya mengaktifkan alat bawaan xAI `x_search`
pada permintaan yang melayani panggilan alat ini.

<Note>
  xAI mendokumentasikan `x_search` sebagai pendukung pencarian kata kunci, pencarian semantik, pencarian pengguna,
  dan pengambilan utas. Untuk statistik engagement per postingan seperti repost,
  balasan, bookmark, atau tampilan, sebaiknya gunakan pencarian tertarget untuk URL postingan
  atau ID status yang tepat. Pencarian kata kunci yang luas dapat menemukan postingan yang tepat tetapi mengembalikan
  metadata per postingan yang kurang lengkap. Pola yang baik adalah: temukan postingan terlebih dahulu, lalu
  jalankan kueri `x_search` kedua yang berfokus pada postingan tepat tersebut.
</Note>

### Konfigurasi x_search

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
}
```

### Parameter x_search

| Parameter                    | Deskripsi                                                |
| ---------------------------- | -------------------------------------------------------- |
| `query`                      | Kueri pencarian (wajib)                                  |
| `allowed_x_handles`          | Batasi hasil ke handle X tertentu                        |
| `excluded_x_handles`         | Kecualikan handle X tertentu                             |
| `from_date`                  | Hanya sertakan postingan pada atau setelah tanggal ini (YYYY-MM-DD) |
| `to_date`                    | Hanya sertakan postingan pada atau sebelum tanggal ini (YYYY-MM-DD) |
| `enable_image_understanding` | Izinkan xAI memeriksa gambar yang dilampirkan ke postingan yang cocok |
| `enable_video_understanding` | Izinkan xAI memeriksa video yang dilampirkan ke postingan yang cocok |

### Contoh x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Contoh

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Profil alat

Jika Anda menggunakan profil alat atau allowlist, tambahkan `web_search`, `x_search`, atau `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Terkait

- [Web Fetch](/id/tools/web-fetch) -- mengambil URL dan mengekstrak konten yang dapat dibaca
- [Web Browser](/id/tools/browser) -- otomatisasi browser penuh untuk situs yang berat JS
- [Grok Search](/id/tools/grok-search) -- Grok sebagai penyedia `web_search`
- [Ollama Web Search](/id/tools/ollama-search) -- pencarian web tanpa kunci melalui host Ollama Anda
