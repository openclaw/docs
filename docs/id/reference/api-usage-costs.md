---
read_when:
    - Anda ingin memahami fitur mana yang mungkin memanggil API berbayar
    - Anda perlu mengaudit kunci, biaya, dan visibilitas penggunaan
    - Anda sedang menjelaskan pelaporan biaya /status atau /usage
summary: Audit apa saja yang dapat menimbulkan biaya, kunci mana yang digunakan, dan cara melihat penggunaan
title: Penggunaan dan biaya API
x-i18n:
    generated_at: "2026-05-06T09:26:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8e6f9f8248ddb4241d00191aa231f1d72a2128a7995b4ed0ec0e18a7ed6dd69
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Dokumen ini mencantumkan **fitur yang dapat menggunakan kunci API** dan tempat biayanya muncul. Dokumen ini berfokus pada
fitur OpenClaw yang dapat menghasilkan penggunaan penyedia atau panggilan API berbayar.

## Tempat biaya muncul (chat + CLI)

**Snapshot biaya per sesi**

- `/status` menampilkan model sesi saat ini, penggunaan konteks, dan token respons terakhir.
- Jika model menggunakan **auth kunci API**, `/status` juga menampilkan **perkiraan biaya** untuk balasan terakhir.
- Jika metadata sesi langsung terbatas, `/status` dapat memulihkan penghitung token/cache
  dan label model runtime aktif dari entri penggunaan transkrip terbaru.
  Nilai langsung nonnol yang sudah ada tetap diprioritaskan, dan total transkrip
  sebesar prompt dapat menang ketika total tersimpan hilang atau lebih kecil.

**Footer biaya per pesan**

- `/usage full` menambahkan footer penggunaan ke setiap balasan, termasuk **perkiraan biaya** (hanya kunci API).
- `/usage tokens` hanya menampilkan token; alur OAuth/token bergaya langganan dan CLI menyembunyikan biaya dolar.
- Catatan Gemini CLI: ketika CLI mengembalikan output JSON, OpenClaw membaca penggunaan dari
  `stats`, menormalisasi `stats.cached` menjadi `cacheRead`, dan menurunkan token input
  dari `stats.input_tokens - stats.cached` bila diperlukan.

Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw
diizinkan lagi, sehingga OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai
disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
Anthropic masih tidak mengekspos perkiraan dolar per pesan yang dapat ditampilkan OpenClaw
di `/usage full`.

**Jendela penggunaan CLI (kuota penyedia)**

- `openclaw status --usage` dan `openclaw channels list` menampilkan **jendela penggunaan** penyedia
  (snapshot kuota, bukan biaya per pesan).
- Output manusia dinormalisasi menjadi `X% left` di semua penyedia.
- Penyedia jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, dan z.ai.
- Catatan MiniMax: kolom mentah `usage_percent` / `usagePercent` berarti kuota tersisa,
  sehingga OpenClaw membalikkannya sebelum ditampilkan. Kolom berbasis hitungan tetap menang
  ketika ada. Jika penyedia mengembalikan `model_remains`, OpenClaw memprioritaskan entri
  model chat, menurunkan label jendela dari timestamp bila diperlukan, dan
  menyertakan nama model dalam label paket.
- Auth penggunaan untuk jendela kuota tersebut berasal dari hook khusus penyedia ketika
  tersedia; jika tidak, OpenClaw fallback ke kredensial OAuth/kunci API yang cocok
  dari profil auth, env, atau config.

Lihat [Penggunaan token & biaya](/id/reference/token-use) untuk detail dan contoh.

## Cara kunci ditemukan

OpenClaw dapat mengambil kredensial dari:

- **Profil auth** (per agen, disimpan di `auth-profiles.json`).
- **Variabel lingkungan** (mis. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) yang dapat mengekspor kunci ke env proses skill.

## Fitur yang dapat menggunakan kunci

### 1) Respons model inti (chat + alat)

Setiap balasan atau panggilan alat menggunakan **penyedia model saat ini** (OpenAI, Anthropic, dll.). Ini adalah
sumber utama penggunaan dan biaya.

Ini juga mencakup penyedia hosted bergaya langganan yang tetap menagih di luar
UI lokal OpenClaw, seperti **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, dan
jalur login Claude OpenClaw milik Anthropic dengan **Extra Usage** diaktifkan.

Lihat [Model](/id/providers/models) untuk config harga dan [Penggunaan token & biaya](/id/reference/token-use) untuk tampilan.

### 2) Pemahaman media (audio/gambar/video)

Media masuk dapat diringkas/ditranskripsi sebelum balasan dijalankan. Ini menggunakan API model/penyedia.

- Audio: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Gambar: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Lihat [Pemahaman media](/id/nodes/media-understanding).

### 3) Pembuatan gambar dan video

Kapabilitas pembuatan bersama juga dapat menggunakan kunci penyedia:

- Pembuatan gambar: OpenAI / Google / DeepInfra / fal / MiniMax
- Pembuatan video: DeepInfra / Qwen

Pembuatan gambar dapat menyimpulkan default penyedia berbasis auth ketika
`agents.defaults.imageGenerationModel` belum disetel. Pembuatan video saat ini
memerlukan `agents.defaults.videoGenerationModel` eksplisit seperti
`qwen/wan2.6-t2v`.

Lihat [Pembuatan gambar](/id/tools/image-generation), [Qwen Cloud](/id/providers/qwen),
dan [Model](/id/concepts/models).

### 4) Embedding memori + pencarian semantik

Pencarian memori semantik menggunakan **API embedding** ketika dikonfigurasi untuk penyedia remote:

- `memorySearch.provider = "openai"` → embedding OpenAI
- `memorySearch.provider = "gemini"` → embedding Gemini
- `memorySearch.provider = "voyage"` → embedding Voyage
- `memorySearch.provider = "mistral"` → embedding Mistral
- `memorySearch.provider = "deepinfra"` → embedding DeepInfra
- `memorySearch.provider = "lmstudio"` → embedding LM Studio (lokal/self-hosted)
- `memorySearch.provider = "ollama"` → embedding Ollama (lokal/self-hosted; biasanya tanpa penagihan API hosted)
- Fallback opsional ke penyedia remote jika embedding lokal gagal

Anda dapat menjaganya tetap lokal dengan `memorySearch.provider = "local"` (tanpa penggunaan API).

Lihat [Memori](/id/concepts/memory).

### 5) Alat pencarian web

`web_search` dapat menimbulkan biaya penggunaan tergantung penyedia Anda:

- **Brave Search API**: `BRAVE_API_KEY` atau `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` atau `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` atau `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` atau `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, atau `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, atau `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: tanpa kunci untuk host Ollama lokal yang dapat dijangkau dan sudah login; pencarian langsung `https://ollama.com` menggunakan `OLLAMA_API_KEY`, dan host yang dilindungi auth dapat menggunakan ulang auth bearer penyedia Ollama normal
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, atau `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` atau `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback tanpa kunci (tanpa penagihan API, tetapi tidak resmi dan berbasis HTML)
- **SearXNG**: `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl` (tanpa kunci/self-hosted; tanpa penagihan API hosted)

Jalur penyedia lama `tools.web.search.*` masih dimuat melalui shim kompatibilitas sementara, tetapi tidak lagi menjadi permukaan config yang direkomendasikan.

**Kredit gratis Brave Search:** Setiap paket Brave menyertakan kredit gratis
\$5/bulan yang diperbarui. Paket Search berbiaya \$5 per 1.000 permintaan, sehingga kredit tersebut mencakup
1.000 permintaan/bulan tanpa biaya. Tetapkan batas penggunaan Anda di dashboard Brave
untuk menghindari biaya tak terduga.

Lihat [Alat web](/id/tools/web).

### 5) Alat fetch web (Firecrawl)

`web_fetch` dapat memanggil **Firecrawl** ketika ada kunci API:

- `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webFetch.apiKey`

Jika Firecrawl tidak dikonfigurasi, alat fallback ke fetch langsung ditambah Plugin `web-readability` bawaan (tanpa API berbayar). Nonaktifkan `plugins.entries.web-readability.enabled` untuk melewati ekstraksi Readability lokal.

Lihat [Alat web](/id/tools/web).

### 6) Snapshot penggunaan penyedia (status/kesehatan)

Beberapa perintah status memanggil **endpoint penggunaan penyedia** untuk menampilkan jendela kuota atau kesehatan auth.
Ini biasanya panggilan bervolume rendah tetapi tetap mengenai API penyedia:

- `openclaw status --usage`
- `openclaw models status --json`

Lihat [CLI model](/id/cli/models).

### 7) Perangkuman pelindung Compaction

Pelindung Compaction dapat meringkas riwayat sesi menggunakan **model saat ini**, yang
memanggil API penyedia ketika berjalan.

Lihat [Manajemen sesi + compaction](/id/reference/session-management-compaction).

### 8) Pemindaian / probe model

`openclaw models scan` dapat mem-probe model OpenRouter dan menggunakan `OPENROUTER_API_KEY` ketika
probe diaktifkan.

Lihat [CLI model](/id/cli/models).

### 9) Talk (ucapan)

Mode Talk dapat memanggil **ElevenLabs** ketika dikonfigurasi:

- `ELEVENLABS_API_KEY` atau `talk.providers.elevenlabs.apiKey`

Lihat [Mode Talk](/id/nodes/talk).

### 10) Skills (API pihak ketiga)

Skills dapat menyimpan `apiKey` di `skills.entries.<name>.apiKey`. Jika sebuah skill menggunakan kunci tersebut untuk API
eksternal, hal itu dapat menimbulkan biaya sesuai penyedia skill.

Lihat [Skills](/id/tools/skills).

## Terkait

- [Penggunaan token dan biaya](/id/reference/token-use)
- [Prompt caching](/id/reference/prompt-caching)
- [Pelacakan penggunaan](/id/concepts/usage-tracking)
