---
read_when:
    - Anda ingin memahami fitur mana yang mungkin memanggil API berbayar
    - Anda perlu mengaudit key, biaya, dan visibilitas penggunaan
    - Anda sedang menjelaskan pelaporan biaya /status atau /usage
summary: Audit apa yang dapat menghabiskan uang, key mana yang digunakan, dan bagaimana melihat penggunaan
title: Penggunaan API dan biaya
x-i18n:
    generated_at: "2026-04-24T09:26:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: d44b34a782a4090a074c49b91df3fa9733f13f16b3d39258b6cf57cf24043f43
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Penggunaan API & biaya

Dokumen ini mencantumkan **fitur yang dapat memanggil API key** dan di mana biayanya muncul. Dokumen ini berfokus pada
fitur OpenClaw yang dapat menghasilkan penggunaan provider atau panggilan API berbayar.

## Tempat biaya muncul (chat + CLI)

**Snapshot biaya per sesi**

- `/status` menampilkan model sesi saat ini, penggunaan konteks, dan token respons terakhir.
- Jika model menggunakan **auth API key**, `/status` juga menampilkan **perkiraan biaya** untuk balasan terakhir.
- Jika metadata sesi live minim, `/status` dapat memulihkan penghitung
  token/cache dan label model runtime aktif dari entri penggunaan transkrip terbaru. Nilai live nonzero yang sudah ada tetap diprioritaskan, dan total transkrip berukuran prompt dapat menang ketika total tersimpan hilang atau lebih kecil.

**Footer biaya per pesan**

- `/usage full` menambahkan footer penggunaan ke setiap balasan, termasuk **perkiraan biaya** (khusus API key).
- `/usage tokens` hanya menampilkan token; alur subscription-style OAuth/token dan CLI menyembunyikan biaya dolar.
- Catatan Gemini CLI: ketika CLI mengembalikan output JSON, OpenClaw membaca penggunaan dari
  `stats`, menormalisasi `stats.cached` menjadi `cacheRead`, dan menurunkan token input
  dari `stats.input_tokens - stats.cached` bila diperlukan.

Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI gaya OpenClaw
diizinkan lagi, sehingga OpenClaw memperlakukan penggunaan ulang Claude CLI dan `claude -p` sebagai
disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
Anthropic tetap tidak mengekspos perkiraan dolar per pesan yang dapat ditampilkan OpenClaw
di `/usage full`.

**Jendela penggunaan CLI (kuota provider)**

- `openclaw status --usage` dan `openclaw channels list` menampilkan **jendela penggunaan**
  provider (snapshot kuota, bukan biaya per pesan).
- Output manusia dinormalisasi menjadi `X% left` di seluruh provider.
- Provider jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, dan z.ai.
- Catatan MiniMax: field mentah `usage_percent` / `usagePercent` berarti kuota
  yang tersisa, jadi OpenClaw membaliknya sebelum ditampilkan. Field berbasis hitungan tetap menang
  bila ada. Jika provider mengembalikan `model_remains`, OpenClaw memprioritaskan entri model chat, menurunkan label jendela dari timestamp bila perlu, dan menyertakan nama model dalam label paket.
- Auth penggunaan untuk jendela kuota tersebut berasal dari hook khusus provider ketika
  tersedia; jika tidak, OpenClaw fallback ke kredensial OAuth/API key yang cocok
  dari profil auth, env, atau konfigurasi.

Lihat [Penggunaan token & biaya](/id/reference/token-use) untuk detail dan contoh.

## Cara key ditemukan

OpenClaw dapat mengambil kredensial dari:

- **Profil auth** (per agen, disimpan di `auth-profiles.json`).
- **Environment variable** (misalnya `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) yang dapat mengekspor key ke env proses skill.

## Fitur yang dapat menghabiskan key

### 1) Respons model inti (chat + alat)

Setiap balasan atau pemanggilan alat menggunakan **provider model saat ini** (OpenAI, Anthropic, dll). Ini adalah
sumber utama penggunaan dan biaya.

Ini juga mencakup provider hosted bergaya subscription yang tetap menagih di luar
UI lokal OpenClaw, seperti **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, dan
jalur login Claude OpenClaw milik Anthropic dengan **Extra Usage** diaktifkan.

Lihat [Models](/id/providers/models) untuk konfigurasi harga dan [Penggunaan token & biaya](/id/reference/token-use) untuk tampilan.

### 2) Pemahaman media (audio/gambar/video)

Media masuk dapat dirangkum/ditranskripsi sebelum balasan dijalankan. Ini menggunakan API model/provider.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Gambar: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Lihat [Pemahaman media](/id/nodes/media-understanding).

### 3) Pembuatan gambar dan video

Kapabilitas generation bersama juga dapat menghabiskan key provider:

- Pembuatan gambar: OpenAI / Google / fal / MiniMax
- Pembuatan video: Qwen

Pembuatan gambar dapat menyimpulkan default provider yang didukung auth ketika
`agents.defaults.imageGenerationModel` tidak diatur. Pembuatan video saat ini
memerlukan `agents.defaults.videoGenerationModel` eksplisit seperti
`qwen/wan2.6-t2v`.

Lihat [Image generation](/id/tools/image-generation), [Qwen Cloud](/id/providers/qwen),
dan [Models](/id/concepts/models).

### 4) Embedding memori + pencarian semantik

Pencarian memori semantik menggunakan **API embedding** ketika dikonfigurasi untuk provider jarak jauh:

- `memorySearch.provider = "openai"` → embedding OpenAI
- `memorySearch.provider = "gemini"` → embedding Gemini
- `memorySearch.provider = "voyage"` → embedding Voyage
- `memorySearch.provider = "mistral"` → embedding Mistral
- `memorySearch.provider = "lmstudio"` → embedding LM Studio (lokal/self-hosted)
- `memorySearch.provider = "ollama"` → embedding Ollama (lokal/self-hosted; biasanya tanpa penagihan API hosted)
- Fallback opsional ke provider jarak jauh jika embedding lokal gagal

Anda dapat menjaganya tetap lokal dengan `memorySearch.provider = "local"` (tanpa penggunaan API).

Lihat [Memori](/id/concepts/memory).

### 5) Alat web search

`web_search` dapat menimbulkan biaya penggunaan tergantung provider Anda:

- **Brave Search API**: `BRAVE_API_KEY` atau `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` atau `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` atau `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` atau `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, atau `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, atau `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: bebas key secara default, tetapi memerlukan host Ollama yang dapat dijangkau plus `ollama signin`; juga dapat menggunakan kembali auth bearer provider Ollama normal ketika host memerlukannya
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, atau `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` atau `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback bebas key (tanpa tagihan API, tetapi tidak resmi dan berbasis HTML)
- **SearXNG**: `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl` (bebas key/self-hosted; tanpa tagihan API hosted)

Jalur provider `tools.web.search.*` lama masih dimuat melalui shim kompatibilitas sementara, tetapi bukan lagi permukaan konfigurasi yang direkomendasikan.

**Kredit gratis Brave Search:** Setiap paket Brave menyertakan kredit gratis \$5/bulan
yang diperbarui. Paket Search berharga \$5 per 1.000 permintaan, jadi kredit itu menutupi
1.000 permintaan/bulan tanpa biaya. Atur batas penggunaan Anda di dashboard Brave
untuk menghindari biaya tak terduga.

Lihat [Alat web](/id/tools/web).

### 5) Alat web fetch (Firecrawl)

`web_fetch` dapat memanggil **Firecrawl** ketika API key tersedia:

- `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webFetch.apiKey`

Jika Firecrawl tidak dikonfigurasi, alat akan fallback ke direct fetch + readability (tanpa API berbayar).

Lihat [Alat web](/id/tools/web).

### 6) Snapshot penggunaan provider (status/health)

Beberapa perintah status memanggil **endpoint penggunaan provider** untuk menampilkan jendela kuota atau kesehatan auth.
Biasanya ini adalah panggilan ber-volume rendah tetapi tetap mengenai API provider:

- `openclaw status --usage`
- `openclaw models status --json`

Lihat [CLI Models](/id/cli/models).

### 7) Ringkasan safeguard Compaction

Safeguard Compaction dapat merangkum riwayat sesi menggunakan **model saat ini**, yang
memanggil API provider ketika berjalan.

Lihat [Manajemen sesi + Compaction](/id/reference/session-management-compaction).

### 8) Pemindaian / probe model

`openclaw models scan` dapat mem-probe model OpenRouter dan menggunakan `OPENROUTER_API_KEY` ketika
probing diaktifkan.

Lihat [CLI Models](/id/cli/models).

### 9) Talk (speech)

Mode talk dapat memanggil **ElevenLabs** ketika dikonfigurasi:

- `ELEVENLABS_API_KEY` atau `talk.providers.elevenlabs.apiKey`

Lihat [Talk mode](/id/nodes/talk).

### 10) Skills (API pihak ketiga)

Skills dapat menyimpan `apiKey` di `skills.entries.<name>.apiKey`. Jika sebuah skill menggunakan key tersebut untuk API eksternal,
skill itu dapat menimbulkan biaya sesuai provider skill tersebut.

Lihat [Skills](/id/tools/skills).

## Terkait

- [Penggunaan token dan biaya](/id/reference/token-use)
- [Prompt caching](/id/reference/prompt-caching)
- [Pelacakan penggunaan](/id/concepts/usage-tracking)
