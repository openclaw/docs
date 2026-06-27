---
read_when:
    - Anda ingin mengaktifkan atau mengonfigurasi web_search
    - Anda ingin mengaktifkan atau mengonfigurasi x_search
    - Anda perlu memilih penyedia pencarian
    - Anda ingin memahami deteksi otomatis dan pemilihan penyedia
sidebarTitle: Web Search
summary: web_search, x_search, dan web_fetch -- mencari di web, mencari postingan X, atau mengambil konten halaman
title: Pencarian web
x-i18n:
    generated_at: "2026-06-27T18:23:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

Alat `web_search` mencari di web menggunakan penyedia yang Anda konfigurasi dan
mengembalikan hasil. Hasil di-cache berdasarkan kueri selama 15 menit (dapat dikonfigurasi).

OpenClaw juga menyertakan `x_search` untuk postingan X (sebelumnya Twitter) dan
`web_fetch` untuk pengambilan URL ringan. Pada fase ini, `web_fetch` tetap
lokal sementara `web_search` dan `x_search` dapat menggunakan xAI Responses di balik layar.

<Info>
  `web_search` adalah alat HTTP ringan, bukan automasi browser. Untuk
  situs yang berat JS atau login, gunakan [Browser Web](/id/tools/browser). Untuk
  mengambil URL tertentu, gunakan [Web Fetch](/id/tools/web-fetch).
</Info>

## Mulai cepat

<Steps>
  <Step title="Choose a provider">
    Pilih penyedia dan selesaikan penyiapan yang diperlukan. Beberapa penyedia
    tanpa kunci, sementara yang lain menggunakan kunci API. Lihat halaman penyedia di bawah untuk
    detail.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    Ini menyimpan penyedia dan kredensial apa pun yang diperlukan. Anda juga dapat menetapkan variabel env
    (misalnya `BRAVE_API_KEY`) dan melewati langkah ini untuk penyedia
    berbasis API.
  </Step>
  <Step title="Use it">
    Agen sekarang dapat memanggil `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Untuk postingan X, gunakan:

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
  <Card title="Codex Hosted Search" icon="search" href="/id/plugins/codex-harness">
    Jawaban berlandaskan yang disintesis AI melalui akun server aplikasi Codex Anda.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/id/tools/duckduckgo-search">
    Penyedia tanpa kunci. Tidak memerlukan kunci API. Integrasi tidak resmi berbasis HTML.
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
    Jawaban yang disintesis AI dengan sitasi melalui pencarian web Moonshot; fallback chat tanpa grounding gagal secara eksplisit.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/id/tools/minimax-search">
    Hasil terstruktur melalui API pencarian MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/id/tools/ollama-search">
    Pencarian melalui host Ollama lokal yang sudah masuk atau API Ollama ter-hosting.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/id/tools/parallel-search">
    API Parallel Search berbayar (`PARALLEL_API_KEY`); batas laju lebih tinggi dan penyesuaian objektif.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/id/tools/parallel-search">
    Ikut serta tanpa kunci. Search MCP gratis dari Parallel, dengan kutipan padat yang dioptimalkan untuk LLM dan tanpa kunci API.
  </Card>
  <Card title="Perplexity" icon="search" href="/id/tools/perplexity-search">
    Hasil terstruktur dengan kontrol ekstraksi konten dan pemfilteran domain.
  </Card>
  <Card title="SearXNG" icon="server" href="/id/tools/searxng-search">
    Meta-pencarian yang di-host sendiri. Tidak memerlukan kunci API. Menggabungkan Google, Bing, DuckDuckGo, dan lainnya.
  </Card>
  <Card title="Tavily" icon="globe" href="/id/tools/tavily">
    Hasil terstruktur dengan kedalaman pencarian, pemfilteran topik, dan `tavily_extract` untuk ekstraksi URL.
  </Card>
</CardGroup>

### Perbandingan penyedia

| Penyedia                                         | Gaya hasil                                                     | Filter                                           | Kunci API                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/id/tools/brave-search)                     | Cuplikan terstruktur                                           | Negara, bahasa, waktu, mode `llm-context`        | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/id/plugins/codex-harness)    | Disintesis AI + URL sumber                                     | Domain, ukuran konteks, lokasi pengguna          | Tidak ada; menggunakan masuk Codex/OpenAI                                               |
| [DuckDuckGo](/id/tools/duckduckgo-search)           | Cuplikan terstruktur                                           | --                                               | Tidak ada (tanpa kunci)                                                                 |
| [Exa](/id/tools/exa-search)                         | Terstruktur + diekstrak                                        | Mode neural/kata kunci, tanggal, ekstraksi konten | `EXA_API_KEY`                                                                           |
| [Firecrawl](/id/tools/firecrawl)                    | Cuplikan terstruktur                                           | Melalui alat `firecrawl_search`                  | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/id/tools/gemini-search)                   | Disintesis AI + sitasi                                         | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/id/tools/grok-search)                       | Disintesis AI + sitasi                                         | --                                               | OAuth xAI, `XAI_API_KEY`, atau `plugins.entries.xai.config.webSearch.apiKey`            |
| [Kimi](/id/tools/kimi-search)                       | Disintesis AI + sitasi; gagal pada fallback chat tanpa grounding | --                                             | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/id/tools/minimax-search)          | Cuplikan terstruktur                                           | Wilayah (`global` / `cn`)                        | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/id/tools/ollama-search)        | Cuplikan terstruktur                                           | --                                               | Tidak ada untuk host lokal yang sudah masuk; `OLLAMA_API_KEY` untuk pencarian langsung `https://ollama.com` |
| [Parallel](/id/tools/parallel-search)               | Kutipan padat yang diperingkat untuk konteks LLM               | --                                               | `PARALLEL_API_KEY` (berbayar)                                                           |
| [Parallel Search (Free)](/id/tools/parallel-search) | Kutipan padat yang diperingkat untuk konteks LLM               | --                                               | Tidak ada (Search MCP gratis)                                                           |
| [Perplexity](/id/tools/perplexity-search)           | Cuplikan terstruktur                                           | Negara, bahasa, waktu, domain, batas konten      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/id/tools/searxng-search)                 | Cuplikan terstruktur                                           | Kategori, bahasa                                 | Tidak ada (di-host sendiri)                                                             |
| [Tavily](/id/tools/tavily)                          | Cuplikan terstruktur                                           | Melalui alat `tavily_search`                     | `TAVILY_API_KEY`                                                                        |

## Deteksi otomatis

## Pencarian web OpenAI native

Model OpenAI Responses langsung menggunakan alat `web_search` ter-hosting OpenAI secara otomatis ketika pencarian web OpenClaw diaktifkan dan tidak ada penyedia terkelola yang dipatok. Ini adalah perilaku milik penyedia di Plugin OpenAI bawaan dan hanya berlaku untuk lalu lintas API OpenAI native, bukan URL dasar proksi yang kompatibel dengan OpenAI atau rute Azure. Tetapkan `tools.web.search.provider` ke penyedia lain seperti `brave` untuk mempertahankan alat `web_search` terkelola bagi model OpenAI, atau tetapkan `tools.web.search.enabled: false` untuk menonaktifkan pencarian terkelola dan pencarian OpenAI native.

## Pencarian web Codex native

Runtime server aplikasi Codex menggunakan alat `web_search` ter-hosting Codex secara otomatis
ketika pencarian web diaktifkan dan tidak ada penyedia terkelola yang dipilih. Pencarian
ter-hosting native dan alat dinamis `web_search` terkelola OpenClaw saling eksklusif,
sehingga pencarian terkelola tidak dapat melewati pembatasan domain native. OpenClaw menggunakan
alat terkelola ketika pencarian ter-hosting tidak tersedia, dinonaktifkan secara eksplisit, atau
diganti oleh penyedia terkelola yang dipilih. OpenClaw menjaga ekstensi mandiri
`web.run` Codex tetap dinonaktifkan karena lalu lintas server aplikasi produksi menolak namespace
`web` yang ditentukan pengguna.

- Konfigurasikan pencarian native di bawah `tools.web.search.openaiCodex`
- Tetapkan `tools.web.search.provider: "codex"` untuk menyediakan Codex Hosted Search sebagai
  penyedia `web_search` terkelola untuk model induk apa pun. Setiap panggilan menjalankan
  giliran server aplikasi Codex efemeral yang dibatasi dan gagal jika Codex tidak memancarkan item
  `webSearch` ter-hosting.
- `mode: "cached"` adalah preferensi default, tetapi Codex menyelesaikannya menjadi akses
  eksternal langsung untuk giliran server aplikasi tanpa pembatasan; tetapkan `"live"` untuk meminta
  akses langsung secara eksplisit
- Tetapkan `tools.web.search.provider` ke penyedia terkelola seperti `brave` untuk menggunakan
  `web_search` terkelola OpenClaw sebagai gantinya
- Tetapkan `tools.web.search.openaiCodex.enabled: false` untuk tidak menggunakan pencarian
  ter-hosting Codex; penyedia terkelola lain tetap tersedia
- Membatasi permukaan alat native Codex juga menjaga `web_search` terkelola tetap
  tersedia
- Ketika `allowedDomains` ditetapkan, fallback terkelola otomatis gagal tertutup jika
  pencarian ter-hosting tidak tersedia sehingga daftar izin native tidak dapat dilewati
- Jalankan khusus LLM dengan alat dinonaktifkan menonaktifkan pencarian native dan terkelola
- `tools.web.search.enabled: false` menonaktifkan pencarian terkelola dan native

Perubahan kebijakan pencarian Codex efektif persisten memulai thread terikat baru sehingga
thread server aplikasi yang sudah dimuat tidak dapat mempertahankan akses pencarian ter-hosting yang kedaluwarsa.
Pembatasan sementara per giliran menggunakan thread terbatas sementara dan mempertahankan
binding yang ada untuk dilanjutkan nanti.

Lalu lintas OpenAI ChatGPT Responses langsung juga dapat menggunakan alat
`web_search` ter-hosting OpenAI. Jalur terpisah itu tetap bersifat ikut serta melalui
`tools.web.search.openaiCodex.enabled: true` dan hanya berlaku untuk model
`openai/*` yang memenuhi syarat menggunakan `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: use Codex Hosted Search from non-Codex parent models too.
        provider: "codex",
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

Untuk runtime dan penyedia yang tidak mendukung pencarian Codex native, Codex dapat
menggunakan fallback `web_search` terkelola melalui namespace alat dinamis OpenClaw.
Gunakan penyedia terkelola eksplisit ketika Anda memerlukan kontrol jaringan spesifik penyedia
OpenClaw, bukan pencarian ter-hosting Codex.

Memilih `provider: "codex"` mengaktifkan plugin `codex` bawaan dan menggunakan
pembatasan `tools.web.search.openaiCodex` yang sama seperti ditampilkan di atas. Autentikasi
app-server Codex terlebih dahulu dengan `openclaw models auth login --provider openai`.
Agen induk dapat menggunakan model atau runtime apa pun; hanya pekerja pencarian terbatas
yang berjalan melalui Codex.

## Keamanan jaringan

Panggilan penyedia HTTP `web_search` terkelola menggunakan jalur fetch terlindungi OpenClaw. Untuk
host API penyedia tepercaya, OpenClaw mengizinkan jawaban DNS fake-IP dari Surge,
Clash, dan sing-box dalam `198.18.0.0/15` dan `fc00::/7` hanya untuk nama host
penyedia tersebut. Tujuan privat, loopback, link-local, dan metadata lainnya
tetap diblokir. Codex Hosted Search adalah pengecualiannya: pekerja terbatasnya
mendelegasikan akses jaringan ke alat `web_search` hosted milik app-server Codex.

Izin otomatis ini tidak berlaku untuk URL `web_fetch` arbitrer. Untuk
`web_fetch`, aktifkan `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` dan
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` secara eksplisit hanya ketika
proxy tepercaya Anda memiliki rentang sintetis tersebut.

## Menyiapkan pencarian web

Daftar penyedia dalam dokumentasi dan alur penyiapan disusun secara alfabetis. Deteksi otomatis mempertahankan
urutan prioritas terpisah.

Jika tidak ada `provider` yang ditetapkan, OpenClaw memeriksa penyedia dalam urutan ini dan menggunakan
penyedia pertama yang siap:

Penyedia berbasis API terlebih dahulu:

1. **Brave** -- `BRAVE_API_KEY` atau `plugins.entries.brave.config.webSearch.apiKey` (urutan 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` atau `plugins.entries.minimax.config.webSearch.apiKey` (urutan 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY`, atau `models.providers.google.apiKey` (urutan 20)
4. **Grok** -- xAI OAuth, `XAI_API_KEY`, atau `plugins.entries.xai.config.webSearch.apiKey` (urutan 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` atau `plugins.entries.moonshot.config.webSearch.apiKey` (urutan 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` atau `plugins.entries.perplexity.config.webSearch.apiKey` (urutan 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webSearch.apiKey` (urutan 60)
8. **Exa** -- `EXA_API_KEY` atau `plugins.entries.exa.config.webSearch.apiKey`; opsional `plugins.entries.exa.config.webSearch.baseUrl` mengganti endpoint Exa (urutan 65)
9. **Tavily** -- `TAVILY_API_KEY` atau `plugins.entries.tavily.config.webSearch.apiKey` (urutan 70)
10. **Parallel** -- API Parallel Search berbayar melalui `PARALLEL_API_KEY` atau `plugins.entries.parallel.config.webSearch.apiKey`; opsional `plugins.entries.parallel.config.webSearch.baseUrl` mengganti endpoint (urutan 75)

Penyedia endpoint terkonfigurasi setelah itu:

11. **SearXNG** -- `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl` (urutan 200)

Penyedia tanpa kunci seperti **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search**, dan **Codex Hosted Search** hanya tersedia ketika Anda
memilihnya secara eksplisit dengan `tools.web.search.provider` atau melalui
`openclaw configure --section web`. OpenClaw tidak mengirim kueri
`web_search` terkelola ke penyedia tanpa kunci hanya karena tidak ada penyedia berbasis API
yang dikonfigurasi.

Model OpenAI Responses adalah pengecualian: saat `tools.web.search.provider` belum
ditetapkan, model tersebut menggunakan pencarian web native OpenAI alih-alih penyedia terkelola
di atas. Tetapkan `tools.web.search.provider` ke `parallel-free` (atau penyedia lain)
untuk merutekannya melalui jalur terkelola.

<Note>
  Semua kolom kunci penyedia mendukung objek SecretRef. SecretRef berskup plugin
  di bawah `plugins.entries.<plugin>.config.webSearch.apiKey` diselesaikan untuk
  penyedia pencarian web berbasis API yang terpasang, termasuk Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity, dan Tavily,
  baik penyedia dipilih secara eksplisit melalui `tools.web.search.provider` maupun
  dipilih melalui deteksi otomatis. Dalam mode deteksi otomatis, OpenClaw hanya menyelesaikan
  kunci penyedia yang dipilih -- SecretRef yang tidak dipilih tetap tidak aktif, sehingga Anda dapat
  mempertahankan beberapa penyedia yang dikonfigurasi tanpa membayar biaya resolusi untuk
  penyedia yang tidak Anda gunakan.
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
`plugins.entries.<plugin>.config.webSearch.*`. Gemini juga dapat menggunakan kembali
`models.providers.google.apiKey` dan `models.providers.google.baseUrl` sebagai fallback
berprioritas lebih rendah setelah konfigurasi pencarian web khususnya dan `GEMINI_API_KEY`. Lihat
halaman penyedia untuk contoh.
Grok juga dapat menggunakan kembali profil autentikasi OAuth xAI dari `openclaw models auth login
--provider xai --method oauth`; konfigurasi kunci API tetap menjadi fallback.

`tools.web.search.provider` divalidasi terhadap id penyedia pencarian web
yang dideklarasikan oleh manifes plugin bawaan dan terpasang. Salah ketik seperti `"brvae"`
membuat validasi konfigurasi gagal alih-alih diam-diam kembali ke deteksi otomatis. Jika
penyedia terkonfigurasi hanya memiliki bukti plugin usang, seperti blok
`plugins.entries.<plugin>` yang tersisa setelah menghapus pemasangan plugin pihak ketiga,
OpenClaw menjaga startup tetap tangguh dan melaporkan peringatan agar Anda dapat memasang ulang
plugin atau menjalankan `openclaw doctor --fix` untuk membersihkan konfigurasi usang.

Pemilihan penyedia fallback `web_fetch` terpisah:

- pilih dengan `tools.web.fetch.provider`
- atau hilangkan kolom itu dan biarkan OpenClaw mendeteksi otomatis penyedia web-fetch pertama
  yang siap dari kredensial terkonfigurasi
- `web_fetch` non-sandbox dapat menggunakan penyedia plugin terpasang yang mendeklarasikan
  `contracts.webFetchProviders`; fetch bersandbox mengizinkan penyedia bawaan dan
  pemasangan plugin resmi terverifikasi, tetapi mengecualikan plugin eksternal pihak ketiga
- plugin Firecrawl resmi menyediakan fallback web-fetch, dikonfigurasi di bawah
  `plugins.entries.firecrawl.config.webFetch.*`

Ketika Anda memilih **Kimi** selama `openclaw onboard` atau
`openclaw configure --section web`, OpenClaw juga dapat meminta:

- wilayah API Moonshot (`https://api.moonshot.ai/v1` atau `https://api.moonshot.cn/v1`)
- model pencarian web Kimi default (default ke `kimi-k2.6`)

Untuk `x_search`, konfigurasikan `plugins.entries.xai.config.xSearch.*`. Ini menggunakan
profil autentikasi xAI yang sama seperti chat, atau kredensial `XAI_API_KEY` / pencarian web plugin
yang digunakan oleh pencarian web Grok.
Konfigurasi lama `tools.web.x_search.*` dimigrasikan otomatis oleh `openclaw doctor --fix`.
Ketika Anda memilih Grok selama `openclaw onboard` atau `openclaw configure --section web`,
OpenClaw juga dapat menawarkan penyiapan `x_search` opsional dengan kredensial yang sama.
Ini adalah langkah lanjutan terpisah di dalam jalur Grok, bukan pilihan penyedia pencarian web
tingkat atas yang terpisah. Jika Anda memilih penyedia lain, OpenClaw tidak
menampilkan prompt `x_search`.

### Menyimpan kunci API

<Tabs>
  <Tab title="File konfigurasi">
    Jalankan `openclaw configure --section web` atau tetapkan kunci secara langsung:

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
    Tetapkan env var penyedia di lingkungan proses Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.
    Lihat [Env vars](/id/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parameter alat

| Parameter             | Deskripsi                                             |
| --------------------- | ----------------------------------------------------- |
| `query`               | Kueri pencarian (wajib)                               |
| `count`               | Hasil yang dikembalikan (1-10, default: 5)            |
| `country`             | Kode negara ISO 2 huruf (mis. "US", "DE")            |
| `language`            | Kode bahasa ISO 639-1 (mis. "en", "de")              |
| `search_lang`         | Kode bahasa pencarian (Brave saja)                    |
| `freshness`           | Filter waktu: `day`, `week`, `month`, atau `year`     |
| `date_after`          | Hasil setelah tanggal ini (YYYY-MM-DD)                |
| `date_before`         | Hasil sebelum tanggal ini (YYYY-MM-DD)                |
| `ui_lang`             | Kode bahasa UI (Brave saja)                           |
| `domain_filter`       | Array allowlist/denylist domain (Perplexity saja)     |
| `max_tokens`          | Anggaran total konten, default 25000 (Perplexity saja) |
| `max_tokens_per_page` | Batas token per halaman, default 2048 (Perplexity saja) |

<Warning>
  Tidak semua parameter berfungsi dengan semua penyedia. Mode Brave `llm-context`
  menolak `ui_lang`; `date_before` juga memerlukan `date_after` karena rentang
  freshness kustom Brave memerlukan tanggal mulai dan akhir.
  Gemini, Grok, dan Kimi mengembalikan satu jawaban tersintesis dengan sitasi. Mereka
  menerima `count` untuk kompatibilitas alat bersama, tetapi itu tidak mengubah bentuk
  jawaban yang grounded. Gemini memperlakukan freshness `day` sebagai petunjuk keterbaruan; nilai
  freshness yang lebih luas dan tanggal eksplisit menetapkan rentang waktu grounding Google Search.
  Perplexity berperilaku sama ketika Anda menggunakan jalur kompatibilitas Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` atau `OPENROUTER_API_KEY`).
  SearXNG menerima `http://` hanya untuk host jaringan privat atau loopback tepercaya;
  endpoint SearXNG publik harus menggunakan `https://`.
  Firecrawl dan Tavily hanya mendukung `query` dan `count` melalui `web_search`
  -- gunakan alat khusus mereka untuk opsi lanjutan.
</Warning>

## x_search

Kueri `x_search` mencari posting X (sebelumnya Twitter) menggunakan xAI dan mengembalikan
jawaban tersintesis AI dengan sitasi. Ini menerima kueri bahasa alami dan
filter terstruktur opsional. OpenClaw hanya mengaktifkan alat `x_search` xAI bawaan
pada permintaan yang melayani panggilan alat ini.

<Note>
  xAI mendokumentasikan `x_search` sebagai pendukung pencarian kata kunci, pencarian semantik, pencarian pengguna,
  dan pengambilan thread. Untuk statistik engagement per posting seperti repost,
  balasan, bookmark, atau penayangan, sebaiknya gunakan lookup tertarget untuk URL posting
  atau ID status persis. Pencarian kata kunci luas mungkin menemukan posting yang tepat tetapi mengembalikan metadata
  per posting yang kurang lengkap. Pola yang baik adalah: temukan posting terlebih dahulu, lalu
  jalankan kueri `x_search` kedua yang difokuskan pada posting persis tersebut.
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
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` mem-posting ke `<baseUrl>/responses` ketika
`plugins.entries.xai.config.xSearch.baseUrl` ditetapkan. Jika kolom itu dihilangkan,
ia fallback ke `plugins.entries.xai.config.webSearch.baseUrl`, lalu
`tools.web.search.grok.baseUrl` lama, dan akhirnya endpoint xAI publik.

### Parameter x_search

| Parameter                    | Deskripsi                                                      |
| ---------------------------- | -------------------------------------------------------------- |
| `query`                      | Kueri pencarian (wajib)                                        |
| `allowed_x_handles`          | Batasi hasil ke handle X tertentu                              |
| `excluded_x_handles`         | Kecualikan handle X tertentu                                   |
| `from_date`                  | Hanya sertakan postingan pada atau setelah tanggal ini (YYYY-MM-DD)  |
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

Jika Anda menggunakan profil alat atau daftar izin, tambahkan `web_search`, `x_search`, atau `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Terkait

- [Pengambilan Web](/id/tools/web-fetch) -- ambil URL dan ekstrak konten yang dapat dibaca
- [Peramban Web](/id/tools/browser) -- otomasi peramban penuh untuk situs yang banyak menggunakan JS
- [Pencarian Grok](/id/tools/grok-search) -- Grok sebagai penyedia `web_search`
- [Pencarian Web Ollama](/id/tools/ollama-search) -- pencarian web tanpa kunci melalui host Ollama Anda
