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
    generated_at: "2026-07-12T14:47:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` menelusuri web menggunakan penyedia yang Anda konfigurasi dan mengembalikan
hasil yang dinormalisasi, yang di-cache berdasarkan kueri selama 15 menit (dapat dikonfigurasi). OpenClaw
juga menyertakan `x_search` untuk postingan X (sebelumnya Twitter) dan `web_fetch` untuk
pengambilan URL ringan. `web_fetch` selalu berjalan secara lokal; `web_search` dirutekan
melalui xAI Responses ketika Grok menjadi penyedia, dan `x_search` selalu menggunakan
xAI Responses.

<Info>
  `web_search` adalah alat HTTP ringan, bukan otomatisasi peramban. Untuk situs
  yang sangat bergantung pada JS atau memerlukan proses masuk, gunakan [Peramban Web](/id/tools/browser). Untuk
  mengambil URL tertentu, gunakan [Pengambilan Web](/id/tools/web-fetch).
</Info>

## Mulai cepat

<Steps>
  <Step title="Pilih penyedia">
    Pilih penyedia dan selesaikan semua penyiapan yang diperlukan. Beberapa penyedia
    tidak memerlukan kunci, sementara yang lain memerlukan kunci API. Lihat halaman penyedia di bawah untuk
    detailnya.
  </Step>
  <Step title="Konfigurasikan">
    ```bash
    openclaw configure --section web
    ```
    Perintah ini menyimpan penyedia dan kredensial yang diperlukan. Untuk penyedia
    berbasis API, Anda juga dapat menetapkan variabel lingkungan penyedia (misalnya
    `BRAVE_API_KEY`) dan melewati langkah ini.
  </Step>
  <Step title="Gunakan">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Untuk postingan X:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Memilih penyedia

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/id/tools/brave-search">
    Hasil terstruktur dengan cuplikan. Mendukung mode `llm-context` serta filter negara/bahasa. Tersedia tingkat gratis.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/id/plugins/codex-harness">
    Jawaban tersintesis AI yang didasarkan pada sumber melalui akun server aplikasi Codex Anda.
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
    Jawaban tersintesis AI dengan sitasi melalui pendasaran Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/id/tools/grok-search">
    Jawaban tersintesis AI dengan sitasi melalui pendasaran web xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/id/tools/kimi-search">
    Jawaban tersintesis AI dengan sitasi melalui pencarian web Moonshot; fallback obrolan tanpa pendasaran akan gagal secara eksplisit.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/id/tools/minimax-search">
    Hasil terstruktur melalui API pencarian MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/id/tools/ollama-search">
    Pencarian melalui host Ollama lokal yang sudah masuk atau API Ollama yang dihosting.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/id/tools/parallel-search">
    API Parallel Search berbayar (`PARALLEL_API_KEY`); batas laju lebih tinggi dan penyetelan objektif.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/id/tools/parallel-search">
    Tanpa kunci dan harus diaktifkan secara eksplisit. Search MCP gratis dari Parallel, dengan kutipan padat yang dioptimalkan untuk LLM dan tanpa kunci API.
  </Card>
  <Card title="Perplexity" icon="search" href="/id/tools/perplexity-search">
    Hasil terstruktur dengan kontrol ekstraksi konten dan pemfilteran domain.
  </Card>
  <Card title="SearXNG" icon="server" href="/id/tools/searxng-search">
    Meta-pencarian yang dihosting sendiri. Tidak memerlukan kunci API. Mengagregasi Google, Bing, DuckDuckGo, dan lainnya.
  </Card>
  <Card title="Tavily" icon="globe" href="/id/tools/tavily">
    Hasil terstruktur dengan kedalaman pencarian, pemfilteran topik, dan `tavily_extract` untuk ekstraksi URL.
  </Card>
</CardGroup>

### Perbandingan penyedia

| Penyedia                                         | Gaya hasil                                                   | Filter                                          | Kunci API                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/id/tools/brave-search)                     | Cuplikan terstruktur                                            | Negara, bahasa, waktu, mode `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/id/plugins/codex-harness)    | Tersintesis AI + URL sumber                                   | Domain, ukuran konteks, lokasi pengguna             | Tidak ada; menggunakan proses masuk Codex/OpenAI                                                         |
| [DuckDuckGo](/id/tools/duckduckgo-search)           | Cuplikan terstruktur                                            | --                                               | Tidak ada (tanpa kunci)                                                                         |
| [Exa](/id/tools/exa-search)                         | Terstruktur + diekstrak                                         | Mode neural/kata kunci, tanggal, ekstraksi konten    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/id/tools/firecrawl)                    | Cuplikan terstruktur                                            | Melalui alat `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/id/tools/gemini-search)                   | Tersintesis AI + sitasi                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/id/tools/grok-search)                       | Tersintesis AI + sitasi                                     | --                                               | OAuth xAI, `XAI_API_KEY`, atau `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/id/tools/kimi-search)                       | Tersintesis AI + sitasi; gagal pada fallback obrolan tanpa pendasaran | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/id/tools/minimax-search)          | Cuplikan terstruktur                                            | Wilayah (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/id/tools/ollama-search)        | Cuplikan terstruktur                                            | --                                               | Tidak ada untuk host lokal yang sudah masuk; `OLLAMA_API_KEY` untuk pencarian langsung `https://ollama.com` |
| [Parallel](/id/tools/parallel-search)               | Kutipan padat yang diperingkat untuk konteks LLM                          | --                                               | `PARALLEL_API_KEY` (berbayar)                                                               |
| [Parallel Search (Free)](/id/tools/parallel-search) | Kutipan padat yang diperingkat untuk konteks LLM                          | --                                               | Tidak ada (Search MCP gratis)                                                                  |
| [Perplexity](/id/tools/perplexity-search)           | Cuplikan terstruktur                                            | Negara, bahasa, waktu, domain, batas konten | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/id/tools/searxng-search)                 | Cuplikan terstruktur                                            | Kategori, bahasa                             | Tidak ada (dihosting sendiri)                                                                      |
| [Tavily](/id/tools/tavily)                          | Cuplikan terstruktur                                            | Melalui alat `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## Deteksi otomatis

Daftar penyedia dalam dokumentasi dan alur penyiapan diurutkan secara alfabetis. Deteksi otomatis menggunakan
urutan prioritas tetap yang terpisah dan hanya memilih penyedia yang memerlukan
kredensial (`requiresCredential !== false`) ketika menemukan kredensial yang telah dikonfigurasi. Jika
`provider` tidak ditetapkan, OpenClaw memeriksa penyedia dalam urutan berikut dan menggunakan
penyedia pertama yang siap:

Penyedia berbasis API terlebih dahulu:

1. **Brave** -- `BRAVE_API_KEY` atau `plugins.entries.brave.config.webSearch.apiKey` (urutan 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` atau `plugins.entries.minimax.config.webSearch.apiKey` (urutan 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY`, atau `models.providers.google.apiKey` (urutan 20)
4. **Grok** -- OAuth xAI, `XAI_API_KEY`, atau `plugins.entries.xai.config.webSearch.apiKey` (urutan 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` atau `plugins.entries.moonshot.config.webSearch.apiKey` (urutan 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` atau `plugins.entries.perplexity.config.webSearch.apiKey` (urutan 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webSearch.apiKey` (urutan 60)
8. **Exa** -- `EXA_API_KEY` atau `plugins.entries.exa.config.webSearch.apiKey`; `plugins.entries.exa.config.webSearch.baseUrl` opsional menggantikan endpoint Exa (urutan 65)
9. **Tavily** -- `TAVILY_API_KEY` atau `plugins.entries.tavily.config.webSearch.apiKey` (urutan 70)
10. **Parallel** -- API Parallel Search berbayar melalui `PARALLEL_API_KEY` atau `plugins.entries.parallel.config.webSearch.apiKey`; `plugins.entries.parallel.config.webSearch.baseUrl` opsional menggantikan endpoint (urutan 75)

Setelah itu, penyedia endpoint yang dikonfigurasi:

11. **SearXNG** -- `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl` (urutan 200)

Penyedia tanpa kunci seperti **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search**, dan **Codex Hosted Search** tidak pernah dipilih oleh deteksi otomatis,
meskipun memiliki nilai urutan internal. Penyedia tersebut hanya digunakan ketika Anda
memilihnya secara eksplisit dengan `tools.web.search.provider` atau melalui
`openclaw configure --section web`. OpenClaw tidak mengirim kueri
`web_search` terkelola ke penyedia tanpa kunci hanya karena tidak ada penyedia
berbasis API yang dikonfigurasi.

Model OpenAI Responses merupakan pengecualian: selama `tools.web.search.provider`
belum ditetapkan, model tersebut menggunakan pencarian web bawaan OpenAI alih-alih penyedia
terkelola di atas (lihat di bawah). Tetapkan `tools.web.search.provider` ke
`parallel-free` (atau penyedia lain) untuk merutekannya melalui jalur terkelola
sebagai gantinya.

<Note>
  Semua bidang kunci penyedia mendukung objek SecretRef. SecretRef dengan cakupan Plugin
  di bawah `plugins.entries.<plugin>.config.webSearch.apiKey` diuraikan untuk
  penyedia pencarian web berbasis API yang terpasang, termasuk Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity, dan Tavily,
  baik ketika penyedia dipilih secara eksplisit melalui `tools.web.search.provider` maupun
  dipilih melalui deteksi otomatis. Dalam mode deteksi otomatis, OpenClaw hanya menguraikan
  kunci penyedia yang dipilih -- SecretRef yang tidak dipilih tetap tidak aktif, sehingga Anda dapat
  menyimpan beberapa penyedia yang telah dikonfigurasi tanpa menanggung biaya penguraian untuk
  penyedia yang tidak Anda gunakan.
</Note>

## Pencarian web bawaan OpenAI

Model OpenAI Responses langsung (`api: "openai-responses"`, penyedia `openai`,
tanpa URL dasar atau dengan URL dasar API OpenAI resmi) secara otomatis menggunakan
alat `web_search` yang dihosting OpenAI ketika pencarian web OpenClaw diaktifkan dan
tidak ada penyedia terkelola yang ditetapkan. Ini adalah perilaku milik penyedia
dalam plugin OpenAI bawaan dan tidak berlaku untuk URL dasar proksi yang kompatibel
dengan OpenAI atau rute Azure. Atur `tools.web.search.provider` ke penyedia lain
seperti `brave` agar tetap menggunakan alat `web_search` terkelola untuk model
OpenAI, atau atur `tools.web.search.enabled: false` untuk menonaktifkan pencarian
terkelola dan pencarian asli OpenAI.

## Pencarian web asli Codex

Runtime app-server Codex secara otomatis menggunakan alat `web_search` yang
dihosting Codex ketika pencarian web diaktifkan dan tidak ada penyedia terkelola
yang dipilih. Pencarian terhosting asli dan alat dinamis `web_search` terkelola
OpenClaw saling eksklusif, sehingga pencarian terkelola tidak dapat melewati
pembatasan domain asli. OpenClaw menggunakan alat terkelola ketika pencarian
terhosting tidak tersedia, dinonaktifkan secara eksplisit, atau digantikan oleh
penyedia terkelola yang dipilih. OpenClaw mempertahankan ekstensi mandiri
`web.run` milik Codex dalam keadaan nonaktif (`features.standalone_web_search: false`)
karena lalu lintas app-server produksi menolak namespace `web` yang ditentukan
pengguna.

- Konfigurasikan pencarian asli di bawah `tools.web.search.openaiCodex`
- Atur `tools.web.search.provider: "codex"` untuk menyediakan Codex Hosted Search
  sebagai penyedia `web_search` terkelola bagi model induk apa pun. Setiap panggilan
  menjalankan giliran app-server Codex sementara yang dibatasi dan gagal jika Codex
  tidak menghasilkan item `webSearch` terhosting.
- `mode: "cached"` adalah preferensi default, tetapi Codex mengubahnya menjadi akses
  eksternal langsung untuk giliran app-server tanpa pembatasan; atur `"live"` untuk
  meminta akses langsung secara eksplisit
- Atur `tools.web.search.provider` ke penyedia terkelola seperti `brave` untuk
  menggunakan `web_search` terkelola OpenClaw
- Atur `tools.web.search.openaiCodex.enabled: false` untuk tidak menggunakan
  pencarian yang dihosting Codex; penyedia terkelola lainnya tetap tersedia
- Membatasi permukaan alat asli Codex juga mempertahankan ketersediaan
  `web_search` terkelola
- Ketika `allowedDomains` diatur, fallback terkelola otomatis akan gagal secara
  tertutup jika pencarian terhosting tidak tersedia agar daftar izin asli tidak
  dapat dilewati
- Proses hanya-LLM dengan alat yang dinonaktifkan akan menonaktifkan pencarian asli
  maupun terkelola
- `tools.web.search.enabled: false` menonaktifkan pencarian terkelola maupun asli

Perubahan kebijakan pencarian Codex efektif yang persisten memulai utas terikat
baru agar utas app-server yang sudah dimuat tidak terus mempertahankan akses
pencarian terhosting yang kedaluwarsa. Pembatasan sementara per giliran menggunakan
utas terbatas sementara dan mempertahankan pengikatan yang ada untuk dilanjutkan
nanti.

Lalu lintas OpenAI ChatGPT Responses langsung juga dapat menggunakan alat
`web_search` yang dihosting OpenAI. Jalur terpisah tersebut tetap bersifat opsional
melalui `tools.web.search.openaiCodex.enabled: true` dan hanya berlaku untuk model
`openai/*` yang memenuhi syarat serta menggunakan
`api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Opsional: gunakan Codex Hosted Search juga dari model induk non-Codex.
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

Untuk runtime dan penyedia yang tidak mendukung pencarian asli Codex, Codex dapat
menggunakan fallback `web_search` terkelola melalui namespace alat dinamis OpenClaw.
Gunakan penyedia terkelola eksplisit ketika Anda memerlukan kontrol jaringan khusus
penyedia milik OpenClaw sebagai pengganti pencarian yang dihosting Codex.

Memilih `provider: "codex"` mengaktifkan plugin `codex` bawaan dan menggunakan
pembatasan `tools.web.search.openaiCodex` yang sama seperti ditampilkan di atas.
Autentikasikan app-server Codex terlebih dahulu dengan
`openclaw models auth login --provider openai`. Agen induk dapat menggunakan model
atau runtime apa pun; hanya pekerja pencarian terbatas yang berjalan melalui Codex.

## Keamanan jaringan

Panggilan penyedia `web_search` HTTP terkelola menggunakan jalur pengambilan
terlindungi OpenClaw, yang dibatasi ke nama host milik penyedia saat ini. Khusus
untuk nama host tersebut, OpenClaw mengizinkan jawaban DNS IP palsu dari Surge,
Clash, dan sing-box dalam `198.18.0.0/15` dan `fc00::/7`. Tujuan privat, loopback,
link-local, dan metadata lainnya tetap diblokir. Codex Hosted Search merupakan
pengecualian: pekerja terbatasnya mendelegasikan akses jaringan kepada alat
`web_search` yang dihosting app-server Codex.

Izin otomatis ini tidak berlaku untuk URL `web_fetch` sembarang. Untuk `web_fetch`,
aktifkan `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` dan
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` secara eksplisit hanya
ketika proksi tepercaya Anda memiliki rentang sintetis tersebut.

## Konfigurasi

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // atau hilangkan untuk deteksi otomatis
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Konfigurasi khusus penyedia (kunci API, URL dasar, mode) berada di bawah
`plugins.entries.<plugin>.config.webSearch.*`. Gemini juga dapat menggunakan
kembali `models.providers.google.apiKey` dan `models.providers.google.baseUrl`
sebagai fallback berprioritas lebih rendah setelah konfigurasi pencarian web
khususnya dan `GEMINI_API_KEY`. Lihat halaman penyedia untuk contoh.
Grok juga dapat menggunakan kembali profil autentikasi OAuth xAI dari
`openclaw models auth login --provider xai --method oauth`; konfigurasi kunci API
tetap menjadi fallback.

`tools.web.search.provider` divalidasi terhadap ID penyedia pencarian web yang
dideklarasikan oleh manifes plugin bawaan dan terinstal. Kesalahan ketik seperti
`"brvae"` menggagalkan validasi konfigurasi alih-alih diam-diam beralih ke deteksi
otomatis. Jika penyedia yang dikonfigurasi hanya memiliki bukti plugin kedaluwarsa,
seperti blok `plugins.entries.<plugin>` yang tersisa setelah menghapus instalasi
plugin pihak ketiga, OpenClaw menjaga proses mulai tetap tangguh dan melaporkan
peringatan agar Anda dapat menginstal ulang plugin atau menjalankan
`openclaw doctor --fix` untuk membersihkan konfigurasi kedaluwarsa.

Pemilihan penyedia fallback `web_fetch` dilakukan secara terpisah:

- pilih dengan `tools.web.fetch.provider`
- atau hilangkan bidang tersebut dan biarkan OpenClaw mendeteksi otomatis penyedia
  web-fetch siap pakai pertama dari kredensial yang dikonfigurasi
- `web_fetch` tanpa sandbox dapat menggunakan penyedia plugin terinstal yang
  mendeklarasikan `contracts.webFetchProviders`; pengambilan dengan sandbox
  mengizinkan penyedia bawaan dan instalasi plugin resmi yang terverifikasi, tetapi
  mengecualikan plugin eksternal pihak ketiga
- plugin resmi Firecrawl adalah satu-satunya kontributor
  `webFetchProviders` bawaan saat ini, yang dikonfigurasi di bawah
  `plugins.entries.firecrawl.config.webFetch.*`

Ketika Anda memilih **Kimi** selama `openclaw onboard` atau
`openclaw configure --section web`, OpenClaw juga dapat meminta:

- wilayah API Moonshot (`https://api.moonshot.ai/v1` atau `https://api.moonshot.cn/v1`)
- model pencarian web Kimi default (defaultnya `kimi-k2.6`)

Untuk `x_search`, konfigurasikan `plugins.entries.xai.config.xSearch.*`. Fitur ini
menggunakan profil autentikasi xAI yang sama dengan obrolan, atau kredensial
`XAI_API_KEY` / pencarian web plugin yang digunakan oleh pencarian web Grok.
Konfigurasi lama `tools.web.x_search.*` dimigrasikan secara otomatis oleh
`openclaw doctor --fix`.
Ketika Anda memilih Grok selama `openclaw onboard` atau
`openclaw configure --section web`, OpenClaw juga menawarkan penyiapan opsional
`x_search` dengan kredensial yang sama tepat setelah penyiapan Grok selesai. Ini
merupakan langkah lanjutan terpisah di dalam jalur Grok, bukan pilihan penyedia
pencarian web tingkat atas yang terpisah. Jika Anda memilih penyedia lain, OpenClaw
tidak menampilkan prompt `x_search`.

### Menyimpan kunci API

<Tabs>
  <Tab title="Berkas konfigurasi">
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
    Atur variabel lingkungan penyedia dalam lingkungan proses Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Untuk instalasi Gateway, letakkan di `~/.openclaw/.env`.
    Lihat [Variabel lingkungan](/id/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parameter alat

| Parameter             | Deskripsi                                                          |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | Kueri pencarian (wajib)                                            |
| `count`               | Jumlah hasil yang dikembalikan (1-10, default: 5)                  |
| `country`             | Kode negara ISO 2 huruf (misalnya "US", "DE")                      |
| `language`            | Kode bahasa ISO 639-1 (misalnya "en", "de")                        |
| `search_lang`         | Kode bahasa pencarian (khusus Brave)                               |
| `freshness`           | Filter waktu: `day`, `week`, `month`, atau `year`                  |
| `date_after`          | Hasil setelah tanggal ini (YYYY-MM-DD)                             |
| `date_before`         | Hasil sebelum tanggal ini (YYYY-MM-DD)                             |
| `ui_lang`             | Kode bahasa UI (khusus Brave)                                      |
| `domain_filter`       | Larik daftar izin/daftar blokir domain (khusus Perplexity)         |
| `max_tokens`          | Total anggaran token konten, khusus API Perplexity Search asli     |
| `max_tokens_per_page` | Batas token ekstraksi per halaman, khusus API Perplexity Search asli |

<Warning>
  Tidak semua parameter berfungsi dengan semua penyedia. Mode `llm-context` Brave
  menolak `ui_lang`; `date_before` juga memerlukan `date_after` karena rentang
  kesegaran khusus Brave memerlukan tanggal mulai dan berakhir.
  Gemini, Grok, dan Kimi mengembalikan satu jawaban hasil sintesis dengan sitasi.
  Ketiganya menerima `count` untuk kompatibilitas alat bersama, tetapi parameter
  tersebut tidak mengubah bentuk jawaban berbasis sumber. Gemini memperlakukan
  kesegaran `day` sebagai petunjuk kebaruan; nilai kesegaran yang lebih luas dan
  tanggal eksplisit menetapkan rentang waktu pelandasan Google Search.
  Perplexity berperilaku sama ketika Anda menggunakan jalur kompatibilitas
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` atau `OPENROUTER_API_KEY`); jalur tersebut juga menghapus dukungan
  `max_tokens` dan `max_tokens_per_page`.
  SearXNG hanya menerima `http://` untuk host jaringan privat tepercaya atau
  loopback; endpoint SearXNG publik harus menggunakan `https://`.
  Firecrawl dan Tavily hanya mendukung `query` dan `count` melalui `web_search`
  -- gunakan alat khusus masing-masing untuk opsi lanjutan.
</Warning>

## x_search

`x_search` mengueri postingan X (sebelumnya Twitter) menggunakan xAI dan
mengembalikan jawaban hasil sintesis AI dengan sitasi. Fitur ini menerima kueri
bahasa alami dan filter terstruktur opsional. OpenClaw membangun alat `x_search`
bawaan xAI untuk setiap permintaan alih-alih membiarkannya terdaftar secara
permanen, sehingga alat tersebut hanya aktif pada giliran yang benar-benar
memanggilnya.

<Warning>
  `x_search` berjalan di server xAI. xAI mengenakan biaya $5 per 1.000 panggilan
  alat, ditambah token masukan dan keluaran model.
</Warning>

<Note>
  Dokumentasi xAI menyatakan bahwa `x_search` mendukung pencarian kata kunci,
  pencarian semantik, pencarian pengguna, dan pengambilan utas. Untuk statistik
  keterlibatan per postingan seperti posting ulang, balasan, markah, atau tayangan,
  utamakan pencarian tertarget untuk URL postingan atau ID status yang tepat.
  Pencarian kata kunci luas mungkin menemukan postingan yang tepat, tetapi
  mengembalikan metadata per postingan yang kurang lengkap. Pola yang baik adalah:
  temukan postingan terlebih dahulu, lalu jalankan kueri `x_search` kedua yang
  berfokus pada postingan tersebut.
</Note>

### Konfigurasi x_search

Dengan `enabled` dihilangkan, `x_search` hanya diekspos ketika penyedia model aktif adalah `xai` dan kredensial xAI berhasil ditemukan. Untuk model aktif dengan penyedia non-xAI yang diketahui, atur `plugins.entries.xai.config.xSearch.enabled` ke `true` untuk memilih ikut serta dalam penggunaan lintas penyedia. Jika penyedia model aktif tidak ada atau tidak berhasil ditentukan, alat tersebut tetap disembunyikan. Atur `enabled` ke `false` untuk menonaktifkannya bagi setiap penyedia. Kredensial xAI selalu diperlukan.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // diperlukan untuk penyedia model non-xAI yang diketahui
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // opsional, menggantikan webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // opsional jika profil autentikasi xAI atau XAI_API_KEY telah ditetapkan
            baseUrl: "https://api.x.ai/v1", // URL dasar Responses xAI bersama yang opsional
          },
        },
      },
    },
  },
}
```

`x_search` mengirim permintaan POST ke `<baseUrl>/responses` ketika
`plugins.entries.xai.config.xSearch.baseUrl` ditetapkan. Jika bidang tersebut dihilangkan,
nilai akan menggunakan `plugins.entries.xai.config.webSearch.baseUrl`, lalu
`tools.web.search.grok.baseUrl` lama, dan terakhir endpoint xAI publik
(`https://api.x.ai/v1`).

### Parameter x_search

| Parameter                    | Deskripsi                                                       |
| ---------------------------- | --------------------------------------------------------------- |
| `query`                      | Kueri pencarian (wajib)                                         |
| `allowed_x_handles`          | Batasi hasil hingga maksimal 20 nama pengguna X                  |
| `excluded_x_handles`         | Kecualikan maksimal 20 nama pengguna X                           |
| `from_date`                  | Hanya sertakan kiriman pada atau setelah tanggal ini (YYYY-MM-DD) |
| `to_date`                    | Hanya sertakan kiriman pada atau sebelum tanggal ini (YYYY-MM-DD) |
| `enable_image_understanding` | Izinkan xAI memeriksa gambar yang dilampirkan pada kiriman yang cocok |
| `enable_video_understanding` | Izinkan xAI memeriksa video yang dilampirkan pada kiriman yang cocok |

`allowed_x_handles` dan `excluded_x_handles` tidak dapat digunakan bersamaan.

### Contoh x_search

```javascript
await x_search({
  query: "resep makan malam",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Statistik per kiriman: gunakan URL status atau ID status yang tepat jika memungkinkan
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Contoh

```javascript
// Pencarian dasar
await web_search({ query: "SDK plugin OpenClaw" });

// Pencarian khusus bahasa Jerman
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Hasil terbaru (sepekan terakhir)
await web_search({ query: "perkembangan AI", freshness: "week" });

// Rentang tanggal
await web_search({
  query: "penelitian iklim",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Pemfilteran domain (khusus Perplexity)
await web_search({
  query: "ulasan produk",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Profil alat

Jika Anda menggunakan profil alat atau daftar izin, tambahkan `web_search`, `x_search`, atau `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // atau: allow: ["group:web"]  (mencakup web_search, x_search, dan web_fetch)
  },
}
```

## Terkait

- [Pengambilan Web](/id/tools/web-fetch) -- mengambil URL dan mengekstrak konten yang mudah dibaca
- [Peramban Web](/id/tools/browser) -- otomatisasi peramban lengkap untuk situs yang banyak menggunakan JS
- [Pencarian Grok](/id/tools/grok-search) -- Grok sebagai penyedia `web_search`
- [Pencarian Web Ollama](/id/tools/ollama-search) -- pencarian web tanpa kunci melalui host Ollama Anda
