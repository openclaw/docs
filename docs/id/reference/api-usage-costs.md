---
read_when:
    - Anda ingin memahami fitur mana yang mungkin memanggil API berbayar
    - Anda perlu mengaudit kunci, biaya, dan visibilitas penggunaan
    - Anda sedang menjelaskan pelaporan biaya /status atau /usage
summary: Audit apa saja yang dapat menghabiskan biaya, kunci mana yang digunakan, dan cara melihat penggunaan
title: Penggunaan dan Biaya API
x-i18n:
    generated_at: "2026-04-05T14:05:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71789950fe54dcdcd3e34c8ad6e3143f749cdfff5bbc2f14be4b85aaa467b14c
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Penggunaan & biaya API

Dokumen ini mencantumkan **fitur yang dapat memanggil API key** dan tempat biaya tersebut muncul. Dokumen ini berfokus pada
fitur OpenClaw yang dapat menghasilkan penggunaan penyedia atau panggilan API berbayar.

## Tempat biaya muncul (chat + CLI)

**Ringkasan biaya per sesi**

- `/status` menampilkan model sesi saat ini, penggunaan konteks, dan token respons terakhir.
- Jika model menggunakan **autentikasi API-key**, `/status` juga menampilkan **perkiraan biaya** untuk balasan terakhir.
- Jika metadata sesi langsung minim, `/status` dapat memulihkan penghitung
  token/cache dan label model runtime aktif dari entri penggunaan transkrip
  terbaru. Nilai langsung nonzero yang sudah ada tetap diprioritaskan, dan total
  transkrip berukuran prompt dapat menang ketika total tersimpan tidak ada atau lebih kecil.

**Footer biaya per pesan**

- `/usage full` menambahkan footer penggunaan ke setiap balasan, termasuk **perkiraan biaya** (khusus API-key).
- `/usage tokens` hanya menampilkan token; alur OAuth/token bergaya langganan dan CLI menyembunyikan biaya dalam dolar.
- Catatan Gemini CLI: saat CLI mengembalikan output JSON, OpenClaw membaca penggunaan dari
  `stats`, menormalkan `stats.cached` menjadi `cacheRead`, dan menurunkan token input
  dari `stats.input_tokens - stats.cached` bila diperlukan.

Catatan Anthropic: dokumentasi publik Claude Code Anthropic masih mencakup penggunaan
Claude Code terminal langsung dalam batas paket Claude. Secara terpisah, Anthropic memberi tahu pengguna OpenClaw bahwa mulai **4 April 2026 pukul 12:00 PM PT / 8:00 PM BST**, jalur login Claude OpenClaw dianggap sebagai penggunaan harness pihak ketiga dan
memerlukan **Extra Usage** yang ditagihkan terpisah dari langganan. Anthropic
tidak menampilkan estimasi dolar per pesan yang dapat ditampilkan OpenClaw di
`/usage full`.

**Jendela penggunaan CLI (kuota penyedia)**

- `openclaw status --usage` dan `openclaw channels list` menampilkan **jendela penggunaan**
  penyedia (ringkasan kuota, bukan biaya per pesan).
- Output yang dapat dibaca manusia dinormalisasi menjadi `X% left` di seluruh penyedia.
- Penyedia jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, dan z.ai.
- Catatan MiniMax: field mentah `usage_percent` / `usagePercent` berarti kuota
  yang tersisa, sehingga OpenClaw membalikkannya sebelum ditampilkan. Field berbasis jumlah tetap diprioritaskan
  bila ada. Jika penyedia mengembalikan `model_remains`, OpenClaw memprioritaskan
  entri model chat, menurunkan label jendela dari stempel waktu bila diperlukan, dan
  menyertakan nama model dalam label paket.
- Auth penggunaan untuk jendela kuota tersebut berasal dari hook khusus penyedia jika
  tersedia; jika tidak, OpenClaw kembali mencocokkan kredensial OAuth/API-key
  dari profil auth, env, atau config.

Lihat [Penggunaan token & biaya](/reference/token-use) untuk detail dan contoh.

## Cara kunci ditemukan

OpenClaw dapat mengambil kredensial dari:

- **Profil auth** (per agent, disimpan di `auth-profiles.json`).
- **Environment variable** (misalnya `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) yang dapat mengekspor kunci ke env proses skill.

## Fitur yang dapat menghabiskan kunci

### 1) Respons model inti (chat + tools)

Setiap balasan atau panggilan tool menggunakan **penyedia model saat ini** (OpenAI, Anthropic, dll). Ini adalah
sumber utama penggunaan dan biaya.

Ini juga mencakup penyedia host bergaya langganan yang tetap menagih di luar
UI lokal OpenClaw, seperti **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, dan
jalur login Claude OpenClaw Anthropic dengan **Extra Usage** diaktifkan.

Lihat [Model](/id/providers/models) untuk config harga dan [Penggunaan token & biaya](/reference/token-use) untuk tampilan.

### 2) Pemahaman media (audio/gambar/video)

Media masuk dapat diringkas/ditranskripsikan sebelum balasan dijalankan. Ini menggunakan API model/penyedia.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Gambar: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Lihat [Pemahaman media](/id/nodes/media-understanding).

### 3) Pembuatan gambar dan video

Kemampuan pembuatan bersama juga dapat menghabiskan kunci penyedia:

- Pembuatan gambar: OpenAI / Google / fal / MiniMax
- Pembuatan video: Qwen

Pembuatan gambar dapat menyimpulkan default penyedia yang didukung auth saat
`agents.defaults.imageGenerationModel` tidak diatur. Pembuatan video saat ini
memerlukan `agents.defaults.videoGenerationModel` eksplisit seperti
`qwen/wan2.6-t2v`.

Lihat [Pembuatan gambar](/tools/image-generation), [Qwen Cloud](/id/providers/qwen),
dan [Model](/id/concepts/models).

### 4) Embedding memori + pencarian semantik

Pencarian memori semantik menggunakan **API embedding** saat dikonfigurasi untuk penyedia jarak jauh:

- `memorySearch.provider = "openai"` → embedding OpenAI
- `memorySearch.provider = "gemini"` → embedding Gemini
- `memorySearch.provider = "voyage"` → embedding Voyage
- `memorySearch.provider = "mistral"` → embedding Mistral
- `memorySearch.provider = "ollama"` → embedding Ollama (lokal/self-hosted; biasanya tidak ada tagihan API host)
- Fallback opsional ke penyedia jarak jauh jika embedding lokal gagal

Anda dapat tetap lokal dengan `memorySearch.provider = "local"` (tanpa penggunaan API).

Lihat [Memori](/id/concepts/memory).

### 5) Tool pencarian web

`web_search` dapat menimbulkan biaya penggunaan tergantung pada penyedia Anda:

- **Brave Search API**: `BRAVE_API_KEY` atau `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` atau `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` atau `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` atau `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, atau `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, atau `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: tanpa kunci secara default, tetapi memerlukan host Ollama yang dapat dijangkau plus `ollama signin`; juga dapat menggunakan kembali auth bearer penyedia Ollama normal saat host mengharuskannya
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, atau `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` atau `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback tanpa kunci (tanpa tagihan API, tetapi tidak resmi dan berbasis HTML)
- **SearXNG**: `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl` (tanpa kunci/self-hosted; tanpa tagihan API host)

Path penyedia lama `tools.web.search.*` masih dimuat melalui shim kompatibilitas sementara, tetapi tidak lagi menjadi surface config yang direkomendasikan.

**Kredit gratis Brave Search:** Setiap paket Brave mencakup kredit gratis yang diperbarui sebesar \$5/bulan. Paket Search berbiaya \$5 per 1.000 permintaan, jadi kredit tersebut mencakup
1.000 permintaan/bulan tanpa biaya. Atur batas penggunaan Anda di dashboard Brave
untuk menghindari biaya tak terduga.

Lihat [Tool web](/tools/web).

### 5) Tool pengambilan web (Firecrawl)

`web_fetch` dapat memanggil **Firecrawl** saat API key tersedia:

- `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webFetch.apiKey`

Jika Firecrawl tidak dikonfigurasi, tool akan fallback ke pengambilan langsung + readability (tanpa API berbayar).

Lihat [Tool web](/tools/web).

### 6) Ringkasan penggunaan penyedia (status/kesehatan)

Beberapa perintah status memanggil **endpoint penggunaan penyedia** untuk menampilkan jendela kuota atau kesehatan auth.
Biasanya ini adalah panggilan volume rendah tetapi tetap mengakses API penyedia:

- `openclaw status --usage`
- `openclaw models status --json`

Lihat [Models CLI](/cli/models).

### 7) Ringkasan safeguard compaction

Safeguard compaction dapat merangkum riwayat sesi menggunakan **model saat ini**, yang
memanggil API penyedia saat dijalankan.

Lihat [Manajemen sesi + compaction](/reference/session-management-compaction).

### 8) Pemindaian / probe model

`openclaw models scan` dapat mem-probe model OpenRouter dan menggunakan `OPENROUTER_API_KEY` saat
probe diaktifkan.

Lihat [Models CLI](/cli/models).

### 9) Talk (ucapan)

Mode Talk dapat memanggil **ElevenLabs** saat dikonfigurasi:

- `ELEVENLABS_API_KEY` atau `talk.providers.elevenlabs.apiKey`

Lihat [Mode Talk](/id/nodes/talk).

### 10) Skills (API pihak ketiga)

Skills dapat menyimpan `apiKey` di `skills.entries.<name>.apiKey`. Jika sebuah skill menggunakan kunci tersebut untuk
API eksternal, hal itu dapat menimbulkan biaya sesuai dengan penyedia skill tersebut.

Lihat [Skills](/tools/skills).
