---
read_when:
    - Anda memerlukan referensi penyiapan model per penyedia
    - Anda menginginkan contoh konfigurasi atau perintah onboarding CLI untuk penyedia model
summary: Ikhtisar penyedia model dengan contoh konfigurasi + alur CLI
title: Penyedia model
x-i18n:
    generated_at: "2026-04-24T15:22:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79258cb26fae7926c65b6fe0db938c7b5736a540b33bc24c1fad5ad706ac8204
    source_path: concepts/model-providers.md
    workflow: 15
---

Halaman ini membahas **penyedia LLM/model** (bukan channel chat seperti WhatsApp/Telegram).
Untuk aturan pemilihan model, lihat [/concepts/models](/id/concepts/models).

## Aturan cepat

- Referensi model menggunakan `provider/model` (contoh: `opencode/claude-opus-4-6`).
- `agents.defaults.models` berfungsi sebagai allowlist saat disetel.
- Pembantu CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` adalah metadata model native; `contextTokens` adalah batas runtime efektif.
- Aturan fallback, probe cooldown, dan persistensi override sesi: [Model failover](/id/concepts/model-failover).
- Rute keluarga OpenAI bersifat spesifik-prefiks: `openai/<model>` menggunakan penyedia kunci API OpenAI langsung di PI, `openai-codex/<model>` menggunakan OAuth Codex di PI, dan `openai/<model>` plus `agents.defaults.embeddedHarness.runtime: "codex"` menggunakan harness app-server Codex native. Lihat [OpenAI](/id/providers/openai) dan [Codex harness](/id/plugins/codex-harness).
- Auto-enable Plugin mengikuti batas yang sama: `openai-codex/<model>` milik Plugin OpenAI, sedangkan Plugin Codex diaktifkan oleh `embeddedHarness.runtime: "codex"` atau referensi lama `codex/<model>`.
- GPT-5.5 saat ini tersedia melalui rute subscription/OAuth:
  `openai-codex/gpt-5.5` di PI atau `openai/gpt-5.5` dengan harness app-server
  Codex. Rute kunci API langsung untuk `openai/gpt-5.5` didukung setelah
  OpenAI mengaktifkan GPT-5.5 di API publik; sampai saat itu gunakan model yang
  diaktifkan API seperti `openai/gpt-5.4` untuk penyiapan `OPENAI_API_KEY`.

## Perilaku penyedia yang dimiliki Plugin

Sebagian besar logika khusus penyedia berada di Plugin penyedia (`registerProvider(...)`) sementara OpenClaw mempertahankan loop inferensi generik. Plugin menangani onboarding, katalog model, pemetaan env var autentikasi, normalisasi transport/konfigurasi, pembersihan skema tool, klasifikasi failover, refresh OAuth, pelaporan penggunaan, profil thinking/reasoning, dan lainnya.

Daftar lengkap hook SDK penyedia dan contoh Plugin bawaan ada di [Provider plugins](/id/plugins/sdk-provider-plugins). Penyedia yang memerlukan eksekutor permintaan kustom sepenuhnya adalah permukaan ekstensi terpisah yang lebih dalam.

<Note>
Runtime `capabilities` penyedia adalah metadata runner bersama (keluarga penyedia, kekhasan transkrip/tooling, petunjuk transport/cache). Ini tidak sama dengan [public capability model](/id/plugins/architecture#public-capability-model), yang menjelaskan apa yang didaftarkan Plugin (inferensi teks, suara, dan sebagainya).
</Note>

## Rotasi kunci API

- Mendukung rotasi penyedia generik untuk penyedia tertentu.
- Konfigurasikan beberapa kunci melalui:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override live tunggal, prioritas tertinggi)
  - `<PROVIDER>_API_KEYS` (daftar dipisahkan koma atau titik koma)
  - `<PROVIDER>_API_KEY` (kunci utama)
  - `<PROVIDER>_API_KEY_*` (daftar bernomor, mis. `<PROVIDER>_API_KEY_1`)
- Untuk penyedia Google, `GOOGLE_API_KEY` juga disertakan sebagai fallback.
- Urutan pemilihan kunci mempertahankan prioritas dan menghapus duplikasi nilai.
- Permintaan dicoba ulang dengan kunci berikutnya hanya pada respons rate limit (misalnya
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded`, atau pesan batas penggunaan berkala).
- Kegagalan non-rate-limit langsung gagal; tidak ada rotasi kunci yang dicoba.
- Saat semua kunci kandidat gagal, error akhir dikembalikan dari percobaan terakhir.

## Penyedia bawaan (katalog pi-ai)

OpenClaw disertai dengan katalog pi‑ai. Penyedia ini **tidak**
memerlukan konfigurasi `models.providers`; cukup setel autentikasi + pilih model.

### OpenAI

- Penyedia: `openai`
- Autentikasi: `OPENAI_API_KEY`
- Rotasi opsional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, ditambah `OPENCLAW_LIVE_OPENAI_KEY` (override tunggal)
- Contoh model: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- Dukungan API langsung GPT-5.5 sudah siap untuk masa depan di sini setelah OpenAI mengekspos GPT-5.5 di API
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Transport default adalah `auto` (WebSocket terlebih dahulu, fallback SSE)
- Override per model melalui `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, atau `"auto"`)
- Warm-up WebSocket OpenAI Responses default-nya aktif melalui `params.openaiWsWarmup` (`true`/`false`)
- Pemrosesan prioritas OpenAI dapat diaktifkan melalui `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` dan `params.fastMode` memetakan permintaan Responses `openai/*` langsung ke `service_tier=priority` di `api.openai.com`
- Gunakan `params.serviceTier` saat Anda menginginkan tier eksplisit alih-alih toggle `/fast` bersama
- Header atribusi OpenClaw tersembunyi (`originator`, `version`,
  `User-Agent`) hanya diterapkan pada trafik OpenAI native ke `api.openai.com`, bukan
  proxy kompatibel OpenAI generik
- Rute OpenAI native juga mempertahankan `store` Responses, petunjuk prompt-cache, dan
  pembentukan payload kompatibilitas reasoning OpenAI; rute proxy tidak
- `openai/gpt-5.3-codex-spark` sengaja disembunyikan di OpenClaw karena permintaan API OpenAI live menolaknya dan katalog Codex saat ini tidak mengeksposnya

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Penyedia: `anthropic`
- Autentikasi: `ANTHROPIC_API_KEY`
- Rotasi opsional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, ditambah `OPENCLAW_LIVE_ANTHROPIC_KEY` (override tunggal)
- Contoh model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Permintaan Anthropic publik langsung mendukung toggle `/fast` bersama dan `params.fastMode`, termasuk trafik terautentikasi kunci API dan OAuth yang dikirim ke `api.anthropic.com`; OpenClaw memetakannya ke `service_tier` Anthropic (`auto` vs `standard_only`)
- Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI gaya OpenClaw kembali diizinkan, jadi OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai hal yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
- Token penyiapan Anthropic tetap tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` bila tersedia.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Penyedia: `openai-codex`
- Autentikasi: OAuth (ChatGPT)
- Referensi model PI: `openai-codex/gpt-5.5`
- Referensi harness app-server Codex native: `openai/gpt-5.5` dengan `agents.defaults.embeddedHarness.runtime: "codex"`
- Referensi model lama: `codex/gpt-*`
- Batas Plugin: `openai-codex/*` memuat Plugin OpenAI; Plugin app-server Codex native dipilih hanya oleh runtime harness Codex atau referensi
  `codex/*` lama.
- CLI: `openclaw onboard --auth-choice openai-codex` atau `openclaw models auth login --provider openai-codex`
- Transport default adalah `auto` (WebSocket terlebih dahulu, fallback SSE)
- Override per model PI melalui `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, atau `"auto"`)
- `params.serviceTier` juga diteruskan pada permintaan Responses Codex native (`chatgpt.com/backend-api`)
- Header atribusi OpenClaw tersembunyi (`originator`, `version`,
  `User-Agent`) hanya dilampirkan pada trafik Codex native ke
  `chatgpt.com/backend-api`, bukan proxy kompatibel OpenAI generik
- Berbagi toggle `/fast` dan konfigurasi `params.fastMode` yang sama seperti `openai/*` langsung; OpenClaw memetakannya ke `service_tier=priority`
- `openai-codex/gpt-5.5` mempertahankan `contextWindow = 1000000` native dan runtime default `contextTokens = 272000`; override batas runtime dengan `models.providers.openai-codex.models[].contextTokens`
- Catatan kebijakan: OpenAI Codex OAuth secara eksplisit didukung untuk tool/alur kerja eksternal seperti OpenClaw.
- Akses GPT-5.5 saat ini menggunakan rute OAuth/subscription ini sampai OpenAI mengaktifkan GPT-5.5 di API publik.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Opsi host bergaya subscription lainnya

- [Qwen Cloud](/id/providers/qwen): permukaan penyedia Qwen Cloud plus pemetaan endpoint Alibaba DashScope dan Coding Plan
- [MiniMax](/id/providers/minimax): akses OAuth atau kunci API MiniMax Coding Plan
- [GLM Models](/id/providers/glm): endpoint Z.AI Coding Plan atau API umum

### OpenCode

- Autentikasi: `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`)
- Penyedia runtime Zen: `opencode`
- Penyedia runtime Go: `opencode-go`
- Contoh model: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` atau `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (kunci API)

- Penyedia: `google`
- Autentikasi: `GEMINI_API_KEY`
- Rotasi opsional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY`, dan `OPENCLAW_LIVE_GEMINI_KEY` (override tunggal)
- Contoh model: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilitas: konfigurasi OpenClaw lama yang menggunakan `google/gemini-3.1-flash-preview` dinormalisasi menjadi `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Eksekusi Gemini langsung juga menerima `agents.defaults.models["google/<model>"].params.cachedContent`
  (atau `cached_content` lama) untuk meneruskan handle
  `cachedContents/...` native penyedia; cache hit Gemini muncul sebagai `cacheRead` OpenClaw

### Google Vertex dan Gemini CLI

- Penyedia: `google-vertex`, `google-gemini-cli`
- Autentikasi: Vertex menggunakan gcloud ADC; Gemini CLI menggunakan alur OAuth-nya
- Peringatan: OAuth Gemini CLI di OpenClaw adalah integrasi tidak resmi. Beberapa pengguna melaporkan pembatasan akun Google setelah menggunakan klien pihak ketiga. Tinjau ketentuan Google dan gunakan akun nonkritis jika Anda memilih untuk melanjutkan.
- OAuth Gemini CLI dikirim sebagai bagian dari Plugin `google` bawaan.
  - Instal Gemini CLI terlebih dahulu:
    - `brew install gemini-cli`
    - atau `npm install -g @google/gemini-cli`
  - Aktifkan: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Model default: `google-gemini-cli/gemini-3-flash-preview`
  - Catatan: Anda **tidak** menempelkan client id atau secret ke `openclaw.json`. Alur login CLI menyimpan
    token dalam profil auth di host gateway.
  - Jika permintaan gagal setelah login, setel `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` di host gateway.
  - Balasan JSON Gemini CLI diparse dari `response`; penggunaan fallback ke
    `stats`, dengan `stats.cached` dinormalisasi menjadi `cacheRead` OpenClaw.

### Z.AI (GLM)

- Penyedia: `zai`
- Autentikasi: `ZAI_API_KEY`
- Contoh model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` dan `z-ai/*` dinormalisasi menjadi `zai/*`
  - `zai-api-key` mendeteksi otomatis endpoint Z.AI yang cocok; `zai-coding-global`, `zai-coding-cn`, `zai-global`, dan `zai-cn` memaksa permukaan tertentu

### Vercel AI Gateway

- Penyedia: `vercel-ai-gateway`
- Autentikasi: `AI_GATEWAY_API_KEY`
- Contoh model: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Penyedia: `kilocode`
- Autentikasi: `KILOCODE_API_KEY`
- Contoh model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL dasar: `https://api.kilo.ai/api/gateway/`
- Katalog fallback statis menyertakan `kilocode/kilo/auto`; penemuan live
  `https://api.kilo.ai/api/gateway/models` dapat memperluas katalog runtime
  lebih lanjut.
- Routing upstream yang tepat di balik `kilocode/kilo/auto` dimiliki oleh Kilo Gateway,
  bukan di-hardcode di OpenClaw.

Lihat [/providers/kilocode](/id/providers/kilocode) untuk detail penyiapan.

### Plugin penyedia bawaan lainnya

| Penyedia                | Id                               | Env autentikasi                                              | Contoh model                                    |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                    |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` atau `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` atau `KIMICODE_API_KEY`                       | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                          |

Hal penting yang perlu diketahui:

- **OpenRouter** menerapkan header atribusi app dan penanda Anthropic `cache_control` hanya pada rute `openrouter.ai` yang terverifikasi. Sebagai jalur proxy bergaya kompatibel OpenAI, ia melewati pembentukan khusus OpenAI native (`serviceTier`, Responses `store`, petunjuk prompt-cache, kompatibilitas reasoning OpenAI). Referensi berbasis Gemini tetap menggunakan sanitasi thought-signature proxy-Gemini saja.
- **Kilo Gateway** referensi berbasis Gemini mengikuti jalur sanitasi proxy-Gemini yang sama; `kilocode/kilo/auto` dan referensi lain yang tidak mendukung proxy-reasoning melewati injeksi proxy reasoning.
- **MiniMax** onboarding kunci API menulis definisi model M2.7 eksplisit dengan `input: ["text", "image"]`; katalog bawaan mempertahankan referensi chat sebagai text-only sampai konfigurasi itu dimaterialisasi.
- **xAI** menggunakan jalur xAI Responses. `/fast` atau `params.fastMode: true` menulis ulang `grok-3`, `grok-3-mini`, `grok-4`, dan `grok-4-0709` ke varian `*-fast` masing-masing. `tool_stream` aktif secara default; nonaktifkan melalui `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** model GLM menggunakan `zai-glm-4.7` / `zai-glm-4.6`; URL dasar kompatibel OpenAI adalah `https://api.cerebras.ai/v1`.

## Penyedia melalui `models.providers` (kustom/URL dasar)

Gunakan `models.providers` (atau `models.json`) untuk menambahkan penyedia
**kustom** atau proxy yang kompatibel dengan OpenAI/Anthropic.

Banyak Plugin penyedia bawaan di bawah ini sudah menerbitkan katalog default.
Gunakan entri `models.providers.<id>` eksplisit hanya saat Anda ingin mengganti
URL dasar default, header, atau daftar model.

### Moonshot AI (Kimi)

Moonshot dikirim sebagai Plugin penyedia bawaan. Gunakan penyedia bawaan secara
default, dan tambahkan entri `models.providers.moonshot` eksplisit hanya saat Anda
perlu mengganti URL dasar atau metadata model:

- Penyedia: `moonshot`
- Autentikasi: `MOONSHOT_API_KEY`
- Contoh model: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` atau `openclaw onboard --auth-choice moonshot-api-key-cn`

Id model Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding menggunakan endpoint kompatibel Anthropic milik Moonshot AI:

- Penyedia: `kimi`
- Autentikasi: `KIMI_API_KEY`
- Contoh model: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

`kimi/k2p5` lama tetap diterima sebagai id model kompatibilitas.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) menyediakan akses ke Doubao dan model lain di China.

- Penyedia: `volcengine` (coding: `volcengine-plan`)
- Autentikasi: `VOLCANO_ENGINE_API_KEY`
- Contoh model: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Onboarding secara default menggunakan permukaan coding, tetapi katalog umum `volcengine/*`
didaftarkan pada saat yang sama.

Dalam picker model onboarding/configure, pilihan autentikasi Volcengine memprioritaskan kedua
baris `volcengine/*` dan `volcengine-plan/*`. Jika model tersebut belum dimuat,
OpenClaw fallback ke katalog tanpa filter alih-alih menampilkan picker
bercakupan penyedia yang kosong.

Model yang tersedia:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Model coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (Internasional)

BytePlus ARK menyediakan akses ke model yang sama seperti Volcano Engine untuk pengguna internasional.

- Penyedia: `byteplus` (coding: `byteplus-plan`)
- Autentikasi: `BYTEPLUS_API_KEY`
- Contoh model: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Onboarding secara default menggunakan permukaan coding, tetapi katalog umum `byteplus/*`
didaftarkan pada saat yang sama.

Dalam picker model onboarding/configure, pilihan autentikasi BytePlus memprioritaskan kedua
baris `byteplus/*` dan `byteplus-plan/*`. Jika model tersebut belum dimuat,
OpenClaw fallback ke katalog tanpa filter alih-alih menampilkan picker
bercakupan penyedia yang kosong.

Model yang tersedia:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Model coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic menyediakan model kompatibel Anthropic di balik penyedia `synthetic`:

- Penyedia: `synthetic`
- Autentikasi: `SYNTHETIC_API_KEY`
- Contoh model: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax dikonfigurasi melalui `models.providers` karena menggunakan endpoint kustom:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Kunci API MiniMax (Global): `--auth-choice minimax-global-api`
- Kunci API MiniMax (CN): `--auth-choice minimax-cn-api`
- Autentikasi: `MINIMAX_API_KEY` untuk `minimax`; `MINIMAX_OAUTH_TOKEN` atau
  `MINIMAX_API_KEY` untuk `minimax-portal`

Lihat [/providers/minimax](/id/providers/minimax) untuk detail penyiapan, opsi model, dan cuplikan konfigurasi.

Pada jalur streaming kompatibel Anthropic milik MiniMax, OpenClaw menonaktifkan thinking secara
default kecuali Anda menyetelnya secara eksplisit, dan `/fast on` menulis ulang
`MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.

Pemisahan capability yang dimiliki Plugin:

- Default teks/chat tetap di `minimax/MiniMax-M2.7`
- Pembuatan gambar adalah `minimax/image-01` atau `minimax-portal/image-01`
- Pemahaman gambar adalah `MiniMax-VL-01` milik Plugin pada kedua jalur autentikasi MiniMax
- Pencarian web tetap pada id penyedia `minimax`

### LM Studio

LM Studio dikirim sebagai Plugin penyedia bawaan yang menggunakan API native:

- Penyedia: `lmstudio`
- Autentikasi: `LM_API_TOKEN`
- URL dasar inferensi default: `http://localhost:1234/v1`

Lalu setel model (ganti dengan salah satu id yang dikembalikan oleh `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw menggunakan `/api/v1/models` dan `/api/v1/models/load` native LM Studio
untuk discovery + auto-load, dengan `/v1/chat/completions` untuk inferensi secara default.
Lihat [/providers/lmstudio](/id/providers/lmstudio) untuk penyiapan dan pemecahan masalah.

### Ollama

Ollama dikirim sebagai Plugin penyedia bawaan dan menggunakan API native Ollama:

- Penyedia: `ollama`
- Autentikasi: Tidak diperlukan (server lokal)
- Contoh model: `ollama/llama3.3`
- Instalasi: [https://ollama.com/download](https://ollama.com/download)

```bash
# Instal Ollama, lalu tarik model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama dideteksi secara lokal di `http://127.0.0.1:11434` saat Anda melakukan opt-in dengan
`OLLAMA_API_KEY`, dan Plugin penyedia bawaan menambahkan Ollama langsung ke
`openclaw onboard` dan picker model. Lihat [/providers/ollama](/id/providers/ollama)
untuk onboarding, mode cloud/lokal, dan konfigurasi kustom.

### vLLM

vLLM dikirim sebagai Plugin penyedia bawaan untuk server
kompatibel OpenAI lokal/self-hosted:

- Penyedia: `vllm`
- Autentikasi: Opsional (tergantung server Anda)
- URL dasar default: `http://127.0.0.1:8000/v1`

Untuk melakukan opt-in ke auto-discovery secara lokal (nilai apa pun berfungsi jika server Anda tidak menerapkan autentikasi):

```bash
export VLLM_API_KEY="vllm-local"
```

Lalu setel model (ganti dengan salah satu id yang dikembalikan oleh `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Lihat [/providers/vllm](/id/providers/vllm) untuk detail.

### SGLang

SGLang dikirim sebagai Plugin penyedia bawaan untuk server
kompatibel OpenAI self-hosted yang cepat:

- Penyedia: `sglang`
- Autentikasi: Opsional (tergantung server Anda)
- URL dasar default: `http://127.0.0.1:30000/v1`

Untuk melakukan opt-in ke auto-discovery secara lokal (nilai apa pun berfungsi jika server Anda tidak
menerapkan autentikasi):

```bash
export SGLANG_API_KEY="sglang-local"
```

Lalu setel model (ganti dengan salah satu id yang dikembalikan oleh `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Lihat [/providers/sglang](/id/providers/sglang) untuk detail.

### Proxy lokal (LM Studio, vLLM, LiteLLM, dll.)

Contoh (kompatibel OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Lokal" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Model Lokal",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Catatan:

- Untuk penyedia kustom, `reasoning`, `input`, `cost`, `contextWindow`, dan `maxTokens` bersifat opsional.
  Jika dihilangkan, OpenClaw default ke:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Disarankan: setel nilai eksplisit yang sesuai dengan batas proxy/model Anda.
- Untuk `api: "openai-completions"` pada endpoint non-native (setiap `baseUrl` tidak kosong yang host-nya bukan `api.openai.com`), OpenClaw memaksa `compat.supportsDeveloperRole: false` untuk menghindari error 400 penyedia untuk role `developer` yang tidak didukung.
- Rute kompatibel OpenAI bergaya proxy juga melewati pembentukan permintaan khusus OpenAI native:
  tanpa `service_tier`, tanpa Responses `store`, tanpa petunjuk prompt-cache, tanpa
  pembentukan payload kompatibilitas reasoning OpenAI, dan tanpa header atribusi
  OpenClaw tersembunyi.
- Jika `baseUrl` kosong/tidak diisi, OpenClaw mempertahankan perilaku OpenAI default (yang di-resolve ke `api.openai.com`).
- Demi keamanan, `compat.supportsDeveloperRole: true` yang eksplisit tetap dioverride pada endpoint `openai-completions` non-native.

## Contoh CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Lihat juga: [/gateway/configuration](/id/gateway/configuration) untuk contoh konfigurasi lengkap.

## Terkait

- [Models](/id/concepts/models) — konfigurasi model dan alias
- [Model Failover](/id/concepts/model-failover) — rantai fallback dan perilaku retry
- [Configuration Reference](/id/gateway/config-agents#agent-defaults) — kunci konfigurasi model
- [Providers](/id/providers) — panduan penyiapan per penyedia
