---
read_when:
    - Anda ingin memahami fitur mana yang mungkin memanggil API berbayar
    - Anda perlu mengaudit kunci, biaya, dan visibilitas penggunaan
    - Anda menjelaskan pelaporan biaya /status atau /usage
summary: Audit apa saja yang dapat mengeluarkan biaya, kunci mana yang digunakan, dan cara melihat penggunaan
title: Penggunaan dan biaya API
x-i18n:
    generated_at: "2026-06-27T18:09:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Dokumen ini mencantumkan **fitur yang dapat memanggil kunci API** dan tempat biayanya muncul. Fokusnya adalah fitur OpenClaw yang dapat menghasilkan penggunaan penyedia atau panggilan API berbayar.

## Tempat biaya muncul (chat + CLI)

**Snapshot biaya per sesi**

- `/status` menampilkan model sesi saat ini, penggunaan konteks, dan token respons terakhir.
- Jika OpenClaw memiliki metadata penggunaan dan harga lokal untuk model aktif,
  `/status` juga menampilkan **estimasi biaya** untuk balasan terakhir. Ini dapat mencakup
  penyedia non-kunci-API yang diberi harga secara eksplisit seperti model Bedrock `aws-sdk`.
- Jika metadata sesi langsung minim, `/status` dapat memulihkan penghitung token/cache
  dan label model runtime aktif dari entri penggunaan transkrip terbaru. Nilai live bukan nol yang sudah ada tetap diprioritaskan, dan total transkrip seukuran prompt dapat menang ketika total tersimpan tidak ada atau lebih kecil.

**Footer biaya per pesan**

- `/usage full` menambahkan footer penggunaan ke setiap balasan, termasuk **estimasi biaya**
  ketika harga lokal dikonfigurasi untuk model aktif dan metadata penggunaan tersedia.
- `/usage tokens` hanya menampilkan token; alur OAuth/token dan CLI bergaya langganan
  tetap hanya menampilkan token kecuali runtime tersebut menyediakan metadata penggunaan yang kompatibel
  dan harga lokal eksplisit dikonfigurasi.
- Catatan Gemini CLI: output default `stream-json` dan override JSON lama
  sama-sama membaca penggunaan dari `stats`, menormalisasi `stats.cached` menjadi `cacheRead`, dan
  menurunkan token input dari `stats.input_tokens - stats.cached` saat diperlukan.

Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw
diizinkan lagi, jadi OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai
disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
Anthropic masih tidak mengekspos estimasi dolar per pesan yang dapat ditampilkan OpenClaw
di `/usage full`.

**Jendela penggunaan CLI (kuota penyedia)**

- `openclaw status --usage` dan `openclaw channels list` menampilkan **jendela penggunaan** penyedia
  (snapshot kuota, bukan biaya per pesan).
- Output manusia dinormalisasi menjadi `X% tersisa` di semua penyedia.
- Penyedia jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, dan z.ai.
- Catatan MiniMax: field mentah `usage_percent` / `usagePercent` berarti kuota yang tersisa,
  jadi OpenClaw membalikkannya sebelum ditampilkan. Field berbasis jumlah tetap menang
  ketika ada. Jika penyedia mengembalikan `model_remains`, OpenClaw memprioritaskan
  entri model chat, menurunkan label jendela dari timestamp saat diperlukan, dan
  menyertakan nama model dalam label paket.
- Auth penggunaan untuk jendela kuota tersebut berasal dari hook khusus penyedia saat
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

## Fitur yang dapat memakai kunci

### 1) Respons model inti (chat + tools)

Setiap balasan atau panggilan tool menggunakan **penyedia model saat ini** (OpenAI, Anthropic, dll). Ini adalah
sumber utama penggunaan dan biaya.

Ini juga mencakup penyedia hosted bergaya langganan yang tetap menagih di luar
UI lokal OpenClaw, seperti **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, dan
jalur login Claude OpenClaw milik Anthropic dengan **Penggunaan Ekstra** diaktifkan.

Lihat [Model](/id/providers/models) untuk config harga dan [Penggunaan token & biaya](/id/reference/token-use) untuk tampilan.

### 2) Pemahaman media (audio/gambar/video)

Media masuk dapat diringkas/ditranskripsi sebelum balasan berjalan. Ini menggunakan API model/penyedia.

- Audio: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Gambar: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Lihat [Pemahaman media](/id/nodes/media-understanding).

### 3) Pembuatan gambar dan video

Kapabilitas pembuatan bersama juga dapat memakai kunci penyedia:

- Pembuatan gambar: OpenAI / Google / DeepInfra / fal / MiniMax
- Pembuatan video: DeepInfra / Qwen

Pembuatan gambar dapat menyimpulkan default penyedia berbasis auth ketika
`agents.defaults.imageGenerationModel` tidak disetel. Pembuatan video saat ini
memerlukan `agents.defaults.videoGenerationModel` eksplisit seperti
`qwen/wan2.6-t2v`.

Lihat [Pembuatan gambar](/id/tools/image-generation), [Qwen Cloud](/id/providers/qwen),
dan [Model](/id/concepts/models).

### 4) Embedding memori + pencarian semantik

Pencarian memori semantik menggunakan **API embedding** ketika dikonfigurasi untuk penyedia jarak jauh:

- `memorySearch.provider = "openai"` → embedding OpenAI
- `memorySearch.provider = "gemini"` → embedding Gemini
- `memorySearch.provider = "voyage"` → embedding Voyage
- `memorySearch.provider = "mistral"` → embedding Mistral
- `memorySearch.provider = "deepinfra"` → embedding DeepInfra
- `memorySearch.provider = "lmstudio"` → embedding LM Studio (lokal/self-hosted)
- `memorySearch.provider = "ollama"` → embedding Ollama (lokal/self-hosted; biasanya tanpa penagihan API hosted)
- Fallback opsional ke penyedia jarak jauh jika embedding lokal gagal

Anda dapat menjaganya tetap lokal dengan `memorySearch.provider = "local"` (tanpa penggunaan API).

Lihat [Memori](/id/concepts/memory).

### 5) Tool pencarian web

`web_search` dapat menimbulkan biaya penggunaan tergantung penyedia Anda:

- **Brave Search API**: `BRAVE_API_KEY` atau `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` atau `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` atau `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: profil OAuth xAI, `XAI_API_KEY`, atau `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, atau `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, atau `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: tanpa kunci untuk host Ollama lokal yang masuk dan dapat dijangkau; pencarian langsung `https://ollama.com` menggunakan `OLLAMA_API_KEY`, dan host yang dilindungi auth dapat menggunakan ulang auth bearer penyedia Ollama normal
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, atau `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` atau `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: penyedia tanpa kunci saat dipilih secara eksplisit (tanpa penagihan API, tetapi tidak resmi dan berbasis HTML)
- **SearXNG**: `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl` (tanpa kunci/self-hosted; tanpa penagihan API hosted)

Path penyedia lama `tools.web.search.*` masih dimuat melalui shim kompatibilitas sementara, tetapi tidak lagi menjadi permukaan config yang direkomendasikan.

**Kredit gratis Brave Search:** Setiap paket Brave mencakup kredit gratis yang diperbarui sebesar \$5/bulan. Paket Search berharga \$5 per 1.000 permintaan, jadi kredit tersebut mencakup 1.000 permintaan/bulan tanpa biaya. Setel batas penggunaan Anda di dasbor Brave untuk menghindari biaya tak terduga.

Lihat [Tool web](/id/tools/web).

### 5) Tool fetch web (Firecrawl)

`web_fetch` dapat memanggil **Firecrawl** dengan akses awal tanpa kunci. Tambahkan kunci API
untuk batas yang lebih tinggi:

- `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webFetch.apiKey`

Jika Firecrawl tidak dikonfigurasi, tool fallback ke fetch langsung plus plugin `web-readability` bawaan (tanpa API berbayar). Nonaktifkan `plugins.entries.web-readability.enabled` untuk melewati ekstraksi Readability lokal.

Lihat [Tool web](/id/tools/web).

### 6) Snapshot penggunaan penyedia (status/kesehatan)

Beberapa perintah status memanggil **endpoint penggunaan penyedia** untuk menampilkan jendela kuota atau kesehatan auth.
Ini biasanya panggilan volume rendah tetapi tetap mengenai API penyedia:

- `openclaw status --usage`
- `openclaw models status --json`

Lihat [CLI Model](/id/cli/models).

### 7) Ringkasan safeguard Compaction

Safeguard Compaction dapat meringkas riwayat sesi menggunakan **model saat ini**, yang
memanggil API penyedia saat berjalan.

Lihat [Manajemen sesi + Compaction](/id/reference/session-management-compaction).

### 8) Pemindaian / probe model

`openclaw models scan` dapat melakukan probe model OpenRouter dan menggunakan `OPENROUTER_API_KEY` ketika
probe diaktifkan.

Lihat [CLI Model](/id/cli/models).

### 9) Talk (ucapan)

Mode Talk dapat memanggil **ElevenLabs** ketika dikonfigurasi:

- `ELEVENLABS_API_KEY` atau `talk.providers.elevenlabs.apiKey`

Lihat [Mode Talk](/id/nodes/talk).

### 10) Skills (API pihak ketiga)

Skills dapat menyimpan `apiKey` di `skills.entries.<name>.apiKey`. Jika skill menggunakan kunci tersebut untuk API eksternal,
itu dapat menimbulkan biaya sesuai penyedia skill.

Lihat [Skills](/id/tools/skills).

## Terkait

- [Penggunaan token dan biaya](/id/reference/token-use)
- [Caching prompt](/id/reference/prompt-caching)
- [Pelacakan penggunaan](/id/concepts/usage-tracking)
