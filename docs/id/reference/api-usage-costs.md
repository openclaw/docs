---
read_when:
    - Anda ingin memahami fitur mana yang mungkin memanggil API berbayar
    - Anda perlu mengaudit kunci, biaya, dan visibilitas penggunaan
    - Anda sedang menjelaskan pelaporan biaya `/status` atau `/usage`
summary: Audit hal-hal yang dapat menimbulkan biaya, kunci yang digunakan, dan cara melihat penggunaan
title: Penggunaan dan biaya API
x-i18n:
    generated_at: "2026-07-12T14:38:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Peta fitur OpenClaw yang dapat memanggil API penyedia berbayar, lokasi setiap fitur membaca kredensialnya, dan tempat biaya yang dihasilkan ditampilkan.

## Tempat biaya ditampilkan

**`/status`** (ringkasan per sesi)

- Menampilkan model sesi saat ini, penggunaan konteks, dan token respons terakhir.
- Menambahkan **perkiraan biaya** untuk balasan terakhir ketika OpenClaw memiliki metadata penggunaan dan harga lokal untuk model aktif, termasuk penyedia tanpa kunci API yang diberi harga secara eksplisit seperti model Bedrock `aws-sdk`.
- Jika ringkasan sesi langsung tidak lengkap, `/status` memulihkan penghitung token/cache dan label model aktif dari entri penggunaan transkrip terbaru. Nilai langsung bukan nol yang sudah ada lebih diutamakan daripada data transkrip; total transkrip sebesar ukuran prompt tetap dapat diutamakan ketika total tersimpan tidak ada atau lebih kecil.

**`/usage`** (catatan kaki per pesan)

- `/usage full` menambahkan catatan kaki penggunaan ke setiap balasan, termasuk **perkiraan biaya** ketika harga lokal dikonfigurasi dan metadata penggunaan tersedia.
- `/usage tokens` hanya menampilkan token. Runtime OAuth/token bergaya langganan dan CLI hanya menampilkan token, kecuali menyediakan metadata penggunaan yang kompatibel beserta harga lokal eksplisit.
- `/usage cost` mencetak ringkasan biaya lokal; `/usage off` menonaktifkan catatan kaki.
- Catatan Gemini CLI: keluaran `stream-json` dan `json` lama sama-sama membawa penggunaan di bawah `stats`. OpenClaw menormalisasi `stats.cached` menjadi `cacheRead` dan memperoleh token masukan dari `stats.input_tokens - stats.cached` bila diperlukan.

**Antarmuka Kontrol → Penggunaan** (analisis lintas sesi)

- Menampilkan total token dan perkiraan biaya yang diperoleh dari transkrip untuk rentang tanggal yang dipilih, dengan perincian berdasarkan penyedia, model, agen, saluran, dan jenis token.
- Membandingkan jendela kalender yang lebih singkat dan berakhir pada tanggal akhir rentang terpilih. Tanggal yang tidak ada dihitung sebagai hari kalender dengan penggunaan nol; tanggal tersebut tidak dilewati untuk membuat jendela yang lebih padat.
- Memberi label langsung pada skala grafik harian. Lencana `√` berarti kompresi akar kuadrat menjaga agar hari dengan penggunaan rendah tetap terlihat.
- Total ini menjelaskan riwayat sesi lokal yang tersedia, bukan faktur penyedia atau buku besar tagihan seumur hidup. Antarmuka memperingatkan ketika harga tidak tersedia untuk beberapa entri.

**Jendela penggunaan CLI** (kuota penyedia, bukan biaya per pesan)

- `openclaw status --usage` dan `openclaw channels list` menampilkan **jendela penggunaan** penyedia sebagai `X% left`.
- Penyedia jendela penggunaan saat ini: Anthropic, ClawRouter, DeepSeek, GitHub Copilot, Gemini CLI, MiniMax, OpenAI (mencakup autentikasi OAuth/token ChatGPT/Codex), Xiaomi, dan z.ai. Lihat [CLI Model](/id/cli/models) dan [CLI Saluran](/id/cli/channels) untuk daftar lengkap penyedia/flag.
- Kolom mentah `usage_percent` / `usagePercent` milik MiniMax melaporkan kuota yang tersisa, sehingga OpenClaw membalikkannya; kolom berbasis hitungan lebih diutamakan jika tersedia. Jika respons menyertakan array `model_remains`, OpenClaw memilih entri model percakapan, memperoleh label jendela dari stempel waktu bila diperlukan, dan menyertakan nama model dalam label paket.
- Autentikasi penggunaan berasal dari hook khusus penyedia jika tersedia; jika tidak, OpenClaw kembali mencocokkan kredensial OAuth/kunci API dari profil autentikasi, lingkungan, atau konfigurasi.

Lihat [Penggunaan token dan biaya](/id/reference/token-use) untuk contoh terperinci.

<Note>
Anthropic telah mengonfirmasi bahwa penggunaan kembali Claude CLI (termasuk `claude -p`) merupakan pola integrasi yang diizinkan, kecuali Anthropic menerbitkan kebijakan baru. Anthropic tidak menyediakan perkiraan biaya per pesan dalam dolar, sehingga `/usage full` tidak dapat menampilkan biaya penggunaan Claude CLI.
</Note>

## Cara kunci ditemukan

- **Profil autentikasi**: per agen, disimpan dalam `auth-profiles.json`.
- **Variabel lingkungan**: misalnya `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`.
- **Konfigurasi**: `models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `agents.defaults.memorySearch.*`, `talk.providers.*.apiKey`.
- **Skills**: `skills.entries.<name>.apiKey`, yang dapat mengekspor kunci ke lingkungan proses skill.

## Fitur yang dapat menggunakan kunci berbayar

### Respons model inti (percakapan + alat)

Setiap balasan atau pemanggilan alat berjalan pada penyedia model saat ini. Ini merupakan sumber utama penggunaan dan biaya, termasuk paket terkelola bergaya langganan yang ditagihkan di luar antarmuka lokal OpenClaw: OpenAI Codex, Alibaba Cloud Model Studio Coding Plan, MiniMax Coding Plan, Z.AI/GLM Coding Plan, dan jalur masuk Claude milik Anthropic dengan Extra Usage diaktifkan.

Lihat [Model](/id/providers/models) untuk konfigurasi harga dan [Penggunaan token dan biaya](/id/reference/token-use) untuk tampilan.

### Pemahaman media (audio/gambar/video)

Media masuk dapat diringkas atau ditranskripsikan melalui API penyedia sebelum alur balasan berjalan. Dukungan penyedia didaftarkan per plugin dan berubah saat plugin ditambahkan; lihat [Pemahaman media](/id/nodes/media-understanding) untuk daftar dan konfigurasi saat ini.

### Pembuatan gambar dan video

`image_generate` dan `video_generate` dirutekan ke penyedia terkonfigurasi mana pun yang tersedia. Pembuatan gambar dapat menyimpulkan penyedia bawaan berbasis autentikasi ketika `agents.defaults.imageGenerationModel` tidak ditetapkan; pembuatan video memerlukan `agents.defaults.videoGenerationModel` yang ditetapkan secara eksplisit (misalnya `qwen/wan2.6-t2v`).

Lihat [Pembuatan gambar](/id/tools/image-generation) dan [Pembuatan video](/id/tools/video-generation) untuk daftar penyedia saat ini.

### Embedding memori dan pencarian semantik

Pencarian memori semantik menggunakan API embedding ketika `agents.defaults.memorySearch.provider` menyebutkan adaptor jarak jauh (misalnya `openai`, `gemini`, `voyage`, `mistral`, `deepinfra`, `github-copilot`, `amazon-bedrock`). `memorySearch.provider = "lmstudio"` atau `"ollama"` berjalan melalui server lokal/yang dihosting sendiri dan biasanya tidak memiliki tagihan layanan terkelola. `memorySearch.provider = "local"` menjaga semuanya tetap di perangkat tanpa penggunaan API. Penyedia `memorySearch.fallback` opsional dapat menangani kegagalan embedding lokal.

Lihat [Memori](/id/concepts/memory).

### Alat pencarian web

`web_search` dapat menimbulkan biaya penggunaan, tergantung pada penyedia yang dipilih. Setiap penyedia membaca kuncinya terlebih dahulu dari variabel lingkungan, lalu dari `plugins.entries.<id>.config.webSearch.apiKey`:

| Penyedia               | Variabel lingkungan                                                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                        |
| DuckDuckGo             | tanpa kunci; tidak resmi, berbasis HTML, tanpa tagihan                                                                                                                  |
| Exa                    | `EXA_API_KEY`                                                                                                                                                          |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                    |
| Gemini (Google Search) | `GEMINI_API_KEY`                                                                                                                                                       |
| Grok (xAI)             | profil OAuth xAI atau `XAI_API_KEY`                                                                                                                                    |
| Kimi (Moonshot)        | `KIMI_API_KEY` atau `MOONSHOT_API_KEY`                                                                                                                                 |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`, atau `MINIMAX_API_KEY`                                                                       |
| Ollama Web Search      | tanpa kunci untuk host lokal yang dapat dijangkau dan telah masuk; pencarian langsung melalui `https://ollama.com` menggunakan `OLLAMA_API_KEY`; host yang dilindungi autentikasi menggunakan kembali autentikasi bearer penyedia Ollama biasa |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                     |
| Perplexity Search API  | `PERPLEXITY_API_KEY` atau `OPENROUTER_API_KEY`                                                                                                                         |
| SearXNG                | `SEARXNG_BASE_URL`; tanpa kunci/dihosting sendiri, tanpa tagihan layanan terkelola                                                                                       |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                       |

Jalur konfigurasi lama `tools.web.search.*` masih dimuat melalui shim kompatibilitas, tetapi tidak lagi menjadi permukaan yang direkomendasikan.

**Kredit gratis Brave Search**: setiap paket mencakup kredit gratis yang diperbarui sebesar $5/bulan. Paket Search berbiaya $5 per 1.000 permintaan, sehingga kredit tersebut mencakup 1.000 permintaan/bulan tanpa biaya. Tetapkan batas penggunaan di dasbor Brave untuk menghindari biaya tak terduga.

Lihat [Alat web](/id/tools/web).

### Alat pengambilan web (Firecrawl)

`web_fetch` dapat memanggil Firecrawl dengan akses awal tanpa kunci; tambahkan `FIRECRAWL_API_KEY` (atau `plugins.entries.firecrawl.config.webFetch.apiKey`) untuk batas yang lebih tinggi. Jika Firecrawl tidak dikonfigurasi, alat akan kembali ke pengambilan langsung beserta plugin `web-readability` bawaan (tanpa API berbayar). Nonaktifkan `plugins.entries.web-readability.enabled` untuk melewati ekstraksi Readability lokal.

Lihat [Alat web](/id/tools/web).

### Ringkasan penggunaan penyedia (status/kesehatan)

`openclaw status --usage` dan `openclaw models status --json` memanggil titik akhir penggunaan penyedia untuk menampilkan jendela kuota atau kesehatan autentikasi. Volume panggilan rendah, tetapi tetap mengakses API penyedia.

Lihat [CLI Model](/id/cli/models).

### Peringkasan pengaman Compaction

Pengaman Compaction dapat meringkas riwayat sesi menggunakan model saat ini, yang memanggil API penyedia ketika dijalankan.

Lihat [Pengelolaan sesi dan Compaction](/id/reference/session-management-compaction).

### Pemindaian / pemeriksaan model

`openclaw models scan` dapat memeriksa model OpenRouter dan menggunakan `OPENROUTER_API_KEY` ketika pemeriksaan diaktifkan.

Lihat [CLI Model](/id/cli/models).

### Percakapan (ucapan)

Mode percakapan dapat memanggil ElevenLabs ketika dikonfigurasi: `ELEVENLABS_API_KEY` atau `talk.providers.elevenlabs.apiKey`.

Lihat [Mode percakapan](/id/nodes/talk).

### Skills (API pihak ketiga)

Skills dapat menyimpan `apiKey` dalam `skills.entries.<name>.apiKey`. Jika sebuah skill menggunakan kunci tersebut untuk mengakses API eksternal, biayanya mengikuti penyedia skill tersebut.

Lihat [Skills](/id/tools/skills).

## Terkait

- [Penggunaan token dan biaya](/id/reference/token-use)
- [Penyimpanan cache prompt](/id/reference/prompt-caching)
- [Pelacakan penggunaan](/id/concepts/usage-tracking)
