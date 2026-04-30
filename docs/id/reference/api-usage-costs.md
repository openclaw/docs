---
read_when:
    - Anda ingin memahami fitur mana yang mungkin memanggil API berbayar
    - Anda perlu mengaudit kunci, biaya, dan visibilitas penggunaan
    - Anda sedang menjelaskan pelaporan biaya /status atau /usage
summary: Audit apa saja yang dapat mengeluarkan biaya, kunci mana yang digunakan, dan cara melihat penggunaan
title: Penggunaan dan biaya API
x-i18n:
    generated_at: "2026-04-30T10:10:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5638007a77a93701ce4ed9139a6c4377c951e2d69941423c3e1b19b5bd52d5d5
    source_path: reference/api-usage-costs.md
    workflow: 16
---

# Penggunaan API & biaya

Dokumen ini mencantumkan **fitur yang dapat memanggil kunci API** dan tempat biaya tersebut muncul. Fokusnya adalah pada fitur OpenClaw yang dapat menghasilkan penggunaan penyedia atau panggilan API berbayar.

## Tempat biaya muncul (obrolan + CLI)

**Cuplikan biaya per sesi**

- `/status` menampilkan model sesi saat ini, penggunaan konteks, dan token respons terakhir.
- Jika model menggunakan **autentikasi kunci API**, `/status` juga menampilkan **estimasi biaya** untuk balasan terakhir.
- Jika metadata sesi langsung minim, `/status` dapat memulihkan penghitung token/cache
  dan label model runtime aktif dari entri penggunaan transkrip terbaru. Nilai langsung
  bukan nol yang sudah ada tetap diprioritaskan, dan total transkrip sebesar prompt
  dapat menang ketika total tersimpan tidak ada atau lebih kecil.

**Footer biaya per pesan**

- `/usage full` menambahkan footer penggunaan ke setiap balasan, termasuk **estimasi biaya** (khusus kunci API).
- `/usage tokens` hanya menampilkan token; alur OAuth/token bergaya langganan dan CLI menyembunyikan biaya dalam dolar.
- Catatan Gemini CLI: ketika CLI mengembalikan keluaran JSON, OpenClaw membaca penggunaan dari
  `stats`, menormalkan `stats.cached` menjadi `cacheRead`, dan menurunkan token input
  dari `stats.input_tokens - stats.cached` bila diperlukan.

Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw
diizinkan kembali, sehingga OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p`
sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
Anthropic tetap tidak mengekspos estimasi dolar per pesan yang dapat ditampilkan OpenClaw
di `/usage full`.

**Jendela penggunaan CLI (kuota penyedia)**

- `openclaw status --usage` dan `openclaw channels list` menampilkan **jendela penggunaan** penyedia
  (cuplikan kuota, bukan biaya per pesan).
- Keluaran manusia dinormalkan menjadi `X% tersisa` di seluruh penyedia.
- Penyedia jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, dan z.ai.
- Catatan MiniMax: bidang mentah `usage_percent` / `usagePercent` berarti kuota tersisa,
  sehingga OpenClaw membaliknya sebelum ditampilkan. Bidang berbasis jumlah tetap menang
  jika tersedia. Jika penyedia mengembalikan `model_remains`, OpenClaw memprioritaskan
  entri model obrolan, menurunkan label jendela dari stempel waktu bila diperlukan, dan
  menyertakan nama model dalam label paket.
- Autentikasi penggunaan untuk jendela kuota tersebut berasal dari hook khusus penyedia bila
  tersedia; jika tidak, OpenClaw kembali ke pencocokan kredensial OAuth/kunci API
  dari profil autentikasi, env, atau konfigurasi.

Lihat [Penggunaan token & biaya](/id/reference/token-use) untuk detail dan contoh.

## Cara kunci ditemukan

OpenClaw dapat mengambil kredensial dari:

- **Profil autentikasi** (per agen, disimpan di `auth-profiles.json`).
- **Variabel lingkungan** (mis. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Konfigurasi** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) yang dapat mengekspor kunci ke env proses skill.

## Fitur yang dapat memakai kunci berbayar

### 1) Respons model inti (obrolan + alat)

Setiap balasan atau panggilan alat menggunakan **penyedia model saat ini** (OpenAI, Anthropic, dll.). Ini adalah
sumber utama penggunaan dan biaya.

Ini juga mencakup penyedia ter-host bergaya langganan yang tetap menagih di luar
UI lokal OpenClaw, seperti **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, dan
jalur login Claude OpenClaw milik Anthropic dengan **Extra Usage** diaktifkan.

Lihat [Model](/id/providers/models) untuk konfigurasi harga dan [Penggunaan token & biaya](/id/reference/token-use) untuk tampilan.

### 2) Pemahaman media (audio/gambar/video)

Media masuk dapat diringkas/ditranskripsi sebelum balasan berjalan. Ini menggunakan API model/penyedia.

- Audio: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Gambar: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Lihat [Pemahaman media](/id/nodes/media-understanding).

### 3) Pembuatan gambar dan video

Kapabilitas pembuatan bersama juga dapat memakai kunci penyedia berbayar:

- Pembuatan gambar: OpenAI / Google / DeepInfra / fal / MiniMax
- Pembuatan video: DeepInfra / Qwen

Pembuatan gambar dapat menyimpulkan default penyedia berbasis autentikasi ketika
`agents.defaults.imageGenerationModel` belum disetel. Pembuatan video saat ini
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
- `memorySearch.provider = "ollama"` → embedding Ollama (lokal/self-hosted; biasanya tanpa penagihan API ter-host)
- Fallback opsional ke penyedia jarak jauh jika embedding lokal gagal

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
- **Ollama Web Search**: tanpa kunci untuk host Ollama lokal yang dapat dijangkau dan sudah masuk; pencarian langsung `https://ollama.com` menggunakan `OLLAMA_API_KEY`, dan host yang dilindungi autentikasi dapat menggunakan ulang autentikasi bearer penyedia Ollama normal
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, atau `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` atau `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback tanpa kunci (tanpa penagihan API, tetapi tidak resmi dan berbasis HTML)
- **SearXNG**: `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl` (tanpa kunci/self-hosted; tanpa penagihan API ter-host)

Jalur penyedia lama `tools.web.search.*` masih dimuat melalui shim kompatibilitas sementara, tetapi tidak lagi menjadi permukaan konfigurasi yang direkomendasikan.

**Kredit gratis Brave Search:** Setiap paket Brave menyertakan kredit gratis
\$5/bulan yang diperbarui. Paket Search berbiaya \$5 per 1.000 permintaan, sehingga kredit tersebut mencakup
1.000 permintaan/bulan tanpa biaya. Setel batas penggunaan Anda di dasbor Brave
untuk menghindari biaya tak terduga.

Lihat [Alat web](/id/tools/web).

### 5) Alat pengambilan web (Firecrawl)

`web_fetch` dapat memanggil **Firecrawl** ketika kunci API tersedia:

- `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webFetch.apiKey`

Jika Firecrawl tidak dikonfigurasi, alat kembali ke pengambilan langsung ditambah Plugin `web-readability` bawaan (tanpa API berbayar). Nonaktifkan `plugins.entries.web-readability.enabled` untuk melewati ekstraksi Readability lokal.

Lihat [Alat web](/id/tools/web).

### 6) Cuplikan penggunaan penyedia (status/kesehatan)

Beberapa perintah status memanggil **endpoint penggunaan penyedia** untuk menampilkan jendela kuota atau kesehatan autentikasi.
Panggilan ini biasanya bervolume rendah tetapi tetap mengenai API penyedia:

- `openclaw status --usage`
- `openclaw models status --json`

Lihat [CLI Model](/id/cli/models).

### 7) Ringkasan pengaman Compaction

Pengaman Compaction dapat meringkas riwayat sesi menggunakan **model saat ini**, yang
memanggil API penyedia saat berjalan.

Lihat [Manajemen sesi + Compaction](/id/reference/session-management-compaction).

### 8) Pemindaian / probe model

`openclaw models scan` dapat mem-probe model OpenRouter dan menggunakan `OPENROUTER_API_KEY` ketika
probe diaktifkan.

Lihat [CLI Model](/id/cli/models).

### 9) Talk (ucapan)

Mode Talk dapat memanggil **ElevenLabs** ketika dikonfigurasi:

- `ELEVENLABS_API_KEY` atau `talk.providers.elevenlabs.apiKey`

Lihat [Mode Talk](/id/nodes/talk).

### 10) Skills (API pihak ketiga)

Skills dapat menyimpan `apiKey` di `skills.entries.<name>.apiKey`. Jika sebuah skill menggunakan kunci tersebut untuk API eksternal,
biaya dapat timbul sesuai penyedia skill tersebut.

Lihat [Skills](/id/tools/skills).

## Terkait

- [Penggunaan token dan biaya](/id/reference/token-use)
- [Caching prompt](/id/reference/prompt-caching)
- [Pelacakan penggunaan](/id/concepts/usage-tracking)
