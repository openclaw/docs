---
read_when:
    - Anda ingin mengaktifkan atau mengonfigurasi `web_search`
    - Anda ingin mengaktifkan atau mengonfigurasi `x_search`
    - Anda perlu memilih provider pencarian
    - Anda ingin memahami auto-detection dan fallback provider
sidebarTitle: Web Search
summary: web_search, x_search, dan web_fetch -- cari di web, cari postingan X, atau ambil konten halaman
title: Pencarian Web
x-i18n:
    generated_at: "2026-04-05T14:10:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8b9a5d641dcdcbe7c099c8862898f12646f43151b6c4152d69c26af9b17e0fa
    source_path: tools/web.md
    workflow: 15
---

# Pencarian Web

Tool `web_search` mencari di web menggunakan provider yang Anda konfigurasi dan
mengembalikan hasil. Hasil di-cache berdasarkan kueri selama 15 menit (dapat dikonfigurasi).

OpenClaw juga menyertakan `x_search` untuk postingan X (sebelumnya Twitter) dan
`web_fetch` untuk pengambilan URL ringan. Pada fase ini, `web_fetch` tetap
lokal sementara `web_search` dan `x_search` dapat menggunakan xAI Responses di balik layar.

<Info>
  `web_search` adalah tool HTTP ringan, bukan otomatisasi browser. Untuk
  situs yang banyak menggunakan JS atau login, gunakan [Browser Web](/tools/browser). Untuk
  mengambil URL tertentu, gunakan [Web Fetch](/tools/web-fetch).
</Info>

## Mulai cepat

<Steps>
  <Step title="Pilih provider">
    Pilih provider dan selesaikan penyiapan yang diperlukan. Beberapa provider
    tidak memerlukan key, sementara yang lain menggunakan API key. Lihat halaman provider di bawah untuk
    detailnya.
  </Step>
  <Step title="Konfigurasi">
    ```bash
    openclaw configure --section web
    ```
    Ini menyimpan provider dan kredensial yang diperlukan. Anda juga dapat menyetel env
    var (misalnya `BRAVE_API_KEY`) dan melewati langkah ini untuk provider
    berbasis API.
  </Step>
  <Step title="Gunakan">
    Agen kini dapat memanggil `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Untuk postingan X, gunakan:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Memilih provider

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/tools/brave-search">
    Hasil terstruktur dengan cuplikan. Mendukung mode `llm-context`, filter negara/bahasa. Tersedia tier gratis.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/tools/duckduckgo-search">
    Fallback tanpa key. Tidak perlu API key. Integrasi tidak resmi berbasis HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/tools/exa-search">
    Pencarian neural + kata kunci dengan ekstraksi konten (highlight, teks, ringkasan).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/tools/firecrawl">
    Hasil terstruktur. Paling cocok dipasangkan dengan `firecrawl_search` dan `firecrawl_scrape` untuk ekstraksi mendalam.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/tools/gemini-search">
    Jawaban yang disintesis AI dengan sitasi melalui grounding Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/tools/grok-search">
    Jawaban yang disintesis AI dengan sitasi melalui web grounding xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/tools/kimi-search">
    Jawaban yang disintesis AI dengan sitasi melalui pencarian web Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/tools/minimax-search">
    Hasil terstruktur melalui API pencarian MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/tools/ollama-search">
    Pencarian tanpa key melalui host Ollama yang Anda konfigurasi. Memerlukan `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/tools/perplexity-search">
    Hasil terstruktur dengan kontrol ekstraksi konten dan pemfilteran domain.
  </Card>
  <Card title="SearXNG" icon="server" href="/tools/searxng-search">
    Meta-search yang di-host sendiri. Tidak perlu API key. Mengagregasikan Google, Bing, DuckDuckGo, dan lainnya.
  </Card>
  <Card title="Tavily" icon="globe" href="/tools/tavily">
    Hasil terstruktur dengan kedalaman pencarian, pemfilteran topik, dan `tavily_extract` untuk ekstraksi URL.
  </Card>
</CardGroup>

### Perbandingan provider

| Provider                                  | Gaya hasil                 | Filter                                           | API key                                                                          |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/tools/brave-search)              | Cuplikan terstruktur       | Negara, bahasa, waktu, mode `llm-context`        | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/tools/duckduckgo-search)    | Cuplikan terstruktur       | --                                               | Tidak ada (tanpa key)                                                            |
| [Exa](/tools/exa-search)                  | Terstruktur + diekstrak    | Mode neural/kata kunci, tanggal, ekstraksi konten | `EXA_API_KEY`                                                                   |
| [Firecrawl](/tools/firecrawl)             | Cuplikan terstruktur       | Melalui tool `firecrawl_search`                  | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/tools/gemini-search)            | Sintesis AI + sitasi       | --                                               | `GEMINI_API_KEY`                                                                 |
| [Grok](/tools/grok-search)                | Sintesis AI + sitasi       | --                                               | `XAI_API_KEY`                                                                    |
| [Kimi](/tools/kimi-search)                | Sintesis AI + sitasi       | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/tools/minimax-search)   | Cuplikan terstruktur       | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/tools/ollama-search) | Cuplikan terstruktur       | --                                               | Tidak ada secara default; `ollama signin` diperlukan, dapat memakai ulang bearer auth provider Ollama |
| [Perplexity](/tools/perplexity-search)    | Cuplikan terstruktur       | Negara, bahasa, waktu, domain, batas konten      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/tools/searxng-search)          | Cuplikan terstruktur       | Kategori, bahasa                                 | Tidak ada (self-hosted)                                                          |
| [Tavily](/tools/tavily)                   | Cuplikan terstruktur       | Melalui tool `tavily_search`                     | `TAVILY_API_KEY`                                                                 |

## Auto-detection

## Pencarian web Codex native

Model yang mendukung Codex secara opsional dapat menggunakan tool `web_search` Responses native milik provider alih-alih fungsi `web_search` terkelola milik OpenClaw.

- Konfigurasikan di bawah `tools.web.search.openaiCodex`
- Ini hanya aktif untuk model yang mendukung Codex (`openai-codex/*` atau provider yang menggunakan `api: "openai-codex-responses"`)
- `web_search` terkelola tetap berlaku untuk model non-Codex
- `mode: "cached"` adalah pengaturan default dan yang direkomendasikan
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

Jika pencarian Codex native diaktifkan tetapi model saat ini tidak mendukung Codex, OpenClaw tetap mempertahankan perilaku `web_search` terkelola normal.

## Menyiapkan pencarian web

Daftar provider di dokumen dan alur penyiapan diurutkan secara alfabetis. Auto-detection mempertahankan
urutan prioritas terpisah.

Jika tidak ada `provider` yang disetel, OpenClaw memeriksa provider dalam urutan ini dan menggunakan
yang pertama yang siap:

Provider berbasis API terlebih dahulu:

1. **Brave** -- `BRAVE_API_KEY` atau `plugins.entries.brave.config.webSearch.apiKey` (urutan 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` atau `plugins.entries.minimax.config.webSearch.apiKey` (urutan 15)
3. **Gemini** -- `GEMINI_API_KEY` atau `plugins.entries.google.config.webSearch.apiKey` (urutan 20)
4. **Grok** -- `XAI_API_KEY` atau `plugins.entries.xai.config.webSearch.apiKey` (urutan 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` atau `plugins.entries.moonshot.config.webSearch.apiKey` (urutan 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` atau `plugins.entries.perplexity.config.webSearch.apiKey` (urutan 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webSearch.apiKey` (urutan 60)
8. **Exa** -- `EXA_API_KEY` atau `plugins.entries.exa.config.webSearch.apiKey` (urutan 65)
9. **Tavily** -- `TAVILY_API_KEY` atau `plugins.entries.tavily.config.webSearch.apiKey` (urutan 70)

Fallback tanpa key setelah itu:

10. **DuckDuckGo** -- fallback HTML tanpa key tanpa akun atau API key (urutan 100)
11. **Ollama Web Search** -- fallback tanpa key melalui host Ollama yang Anda konfigurasi; mengharuskan Ollama dapat dijangkau dan sudah login dengan `ollama signin` serta dapat memakai ulang bearer auth provider Ollama jika host memerlukannya (urutan 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl` (urutan 200)

Jika tidak ada provider yang terdeteksi, sistem akan fallback ke Brave (Anda akan mendapatkan error key hilang
yang meminta Anda untuk mengonfigurasinya).

<Note>
  Semua field key provider mendukung objek SecretRef. Dalam mode auto-detect,
  OpenClaw hanya me-resolve key provider yang dipilih -- SecretRef yang tidak dipilih
  tetap tidak aktif.
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

Konfigurasi khusus provider (API key, base URL, mode) berada di bawah
`plugins.entries.<plugin>.config.webSearch.*`. Lihat halaman provider untuk
contohnya.

Pemilihan provider fallback `web_fetch` terpisah:

- pilih dengan `tools.web.fetch.provider`
- atau hilangkan field tersebut dan biarkan OpenClaw melakukan auto-detect provider web-fetch pertama
  yang siap dari kredensial yang tersedia
- saat ini provider web-fetch bawaan adalah Firecrawl, dikonfigurasi di bawah
  `plugins.entries.firecrawl.config.webFetch.*`

Saat Anda memilih **Kimi** selama `openclaw onboard` atau
`openclaw configure --section web`, OpenClaw juga dapat menanyakan:

- region API Moonshot (`https://api.moonshot.ai/v1` atau `https://api.moonshot.cn/v1`)
- model web-search Kimi default (default ke `kimi-k2.5`)

Untuk `x_search`, konfigurasikan `plugins.entries.xai.config.xSearch.*`. Tool ini menggunakan
fallback `XAI_API_KEY` yang sama seperti pencarian web Grok.
Konfigurasi lama `tools.web.x_search.*` dimigrasikan otomatis oleh `openclaw doctor --fix`.
Saat Anda memilih Grok selama `openclaw onboard` atau `openclaw configure --section web`,
OpenClaw juga dapat menawarkan penyiapan `x_search` opsional dengan key yang sama.
Ini adalah langkah lanjutan terpisah di dalam jalur Grok, bukan pilihan provider
web-search tingkat atas yang terpisah. Jika Anda memilih provider lain, OpenClaw tidak
menampilkan prompt `x_search`.

### Menyimpan API key

<Tabs>
  <Tab title="File konfigurasi">
    Jalankan `openclaw configure --section web` atau setel key secara langsung:

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
  <Tab title="Environment variable">
    Setel env var provider di environment proses Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.
    Lihat [Env vars](/id/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parameter tool

| Parameter             | Deskripsi                                                  |
| --------------------- | ---------------------------------------------------------- |
| `query`               | Kueri pencarian (wajib)                                    |
| `count`               | Hasil yang dikembalikan (1-10, default: 5)                 |
| `country`             | Kode negara ISO 2 huruf (mis. "US", "DE")                  |
| `language`            | Kode bahasa ISO 639-1 (mis. "en", "de")                    |
| `search_lang`         | Kode bahasa pencarian (khusus Brave)                       |
| `freshness`           | Filter waktu: `day`, `week`, `month`, atau `year`          |
| `date_after`          | Hasil setelah tanggal ini (YYYY-MM-DD)                     |
| `date_before`         | Hasil sebelum tanggal ini (YYYY-MM-DD)                     |
| `ui_lang`             | Kode bahasa UI (khusus Brave)                              |
| `domain_filter`       | Array allowlist/denylist domain (khusus Perplexity)        |
| `max_tokens`          | Anggaran total konten, default 25000 (khusus Perplexity)   |
| `max_tokens_per_page` | Batas token per halaman, default 2048 (khusus Perplexity)  |

<Warning>
  Tidak semua parameter berfungsi dengan semua provider. Mode `llm-context` Brave
  menolak `ui_lang`, `freshness`, `date_after`, dan `date_before`.
  Gemini, Grok, dan Kimi mengembalikan satu jawaban tersintesis dengan sitasi. Mereka
  menerima `count` untuk kompatibilitas tool bersama, tetapi itu tidak mengubah
  bentuk jawaban yang di-grounding.
  Perplexity berperilaku sama ketika Anda menggunakan jalur kompatibilitas Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` atau `OPENROUTER_API_KEY`).
  SearXNG menerima `http://` hanya untuk host private-network atau loopback yang tepercaya;
  endpoint SearXNG publik harus menggunakan `https://`.
  Firecrawl dan Tavily hanya mendukung `query` dan `count` melalui `web_search`
  -- gunakan tool khusus mereka untuk opsi lanjutan.
</Warning>

## x_search

`x_search` mengkueri postingan X (sebelumnya Twitter) menggunakan xAI dan mengembalikan
jawaban yang disintesis AI dengan sitasi. Tool ini menerima kueri bahasa alami dan
filter terstruktur opsional. OpenClaw hanya mengaktifkan tool `x_search` xAI bawaan
pada permintaan yang melayani panggilan tool ini.

<Note>
  xAI mendokumentasikan `x_search` sebagai mendukung pencarian kata kunci, pencarian semantik, pencarian pengguna,
  dan pengambilan thread. Untuk statistik per postingan seperti repost,
  balasan, bookmark, atau view, lebih baik gunakan pencarian terarah untuk URL postingan yang tepat
  atau status ID. Pencarian kata kunci yang luas mungkin menemukan postingan yang benar tetapi mengembalikan
  metadata per postingan yang kurang lengkap. Pola yang baik adalah: cari postingannya terlebih dahulu, lalu
  jalankan kueri `x_search` kedua yang difokuskan pada postingan tepat tersebut.
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

| Parameter                    | Deskripsi                                              |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Kueri pencarian (wajib)                                |
| `allowed_x_handles`          | Batasi hasil ke handle X tertentu                      |
| `excluded_x_handles`         | Kecualikan handle X tertentu                           |
| `from_date`                  | Hanya sertakan postingan pada atau setelah tanggal ini (YYYY-MM-DD) |
| `to_date`                    | Hanya sertakan postingan pada atau sebelum tanggal ini (YYYY-MM-DD) |
| `enable_image_understanding` | Biarkan xAI memeriksa gambar yang dilampirkan pada postingan yang cocok |
| `enable_video_understanding` | Biarkan xAI memeriksa video yang dilampirkan pada postingan yang cocok |

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

## Profil tool

Jika Anda menggunakan profil tool atau allowlist, tambahkan `web_search`, `x_search`, atau `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Terkait

- [Web Fetch](/tools/web-fetch) -- ambil URL dan ekstrak konten yang mudah dibaca
- [Browser Web](/tools/browser) -- otomatisasi browser penuh untuk situs yang banyak menggunakan JS
- [Grok Search](/tools/grok-search) -- Grok sebagai provider `web_search`
- [Ollama Web Search](/tools/ollama-search) -- pencarian web tanpa key melalui host Ollama Anda
