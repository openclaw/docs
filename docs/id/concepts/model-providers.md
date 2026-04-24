---
read_when:
    - Anda memerlukan referensi penyiapan model per provider
    - Anda menginginkan contoh konfigurasi atau perintah onboarding CLI untuk provider model
summary: Ikhtisar provider model dengan contoh konfigurasi + alur CLI
title: Provider model
x-i18n:
    generated_at: "2026-04-24T09:04:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac9bf48897446576d8bc339b340295691741a589863bb57b379c17a5519bffd7
    source_path: concepts/model-providers.md
    workflow: 15
---

Halaman ini membahas **provider LLM/model** (bukan kanal chat seperti WhatsApp/Telegram).
Untuk aturan pemilihan model, lihat [/concepts/models](/id/concepts/models).

## Aturan cepat

- Referensi model menggunakan `provider/model` (contoh: `opencode/claude-opus-4-6`).
- `agents.defaults.models` bertindak sebagai allowlist jika diatur.
- Pembantu CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` adalah metadata model native; `contextTokens` adalah batas runtime efektif.
- Aturan fallback, probe cooldown, dan persistensi override sesi: [Failover model](/id/concepts/model-failover).
- Rute keluarga OpenAI bersifat spesifik prefix: `openai/<model>` menggunakan provider API key OpenAI langsung di Pi, `openai-codex/<model>` menggunakan OAuth Codex di Pi, dan `openai/<model>` plus `agents.defaults.embeddedHarness.runtime: "codex"` menggunakan harness app-server Codex native. Lihat [OpenAI](/id/providers/openai)
  dan [Codex harness](/id/plugins/codex-harness).
- Plugin auto-enable mengikuti batas yang sama: `openai-codex/<model>` milik
  Plugin OpenAI, sedangkan Plugin Codex diaktifkan oleh
  `embeddedHarness.runtime: "codex"` atau referensi legacy `codex/<model>`.
- GPT-5.5 saat ini tersedia melalui rute subscription/OAuth:
  `openai-codex/gpt-5.5` di Pi atau `openai/gpt-5.5` dengan harness app-server
  Codex. Rute API key langsung untuk `openai/gpt-5.5` didukung setelah
  OpenAI mengaktifkan GPT-5.5 pada API publik; sampai saat itu gunakan model yang
  diaktifkan API seperti `openai/gpt-5.4` untuk penyiapan `OPENAI_API_KEY`.

## Perilaku provider yang dimiliki Plugin

Sebagian besar logika khusus provider berada di Plugin provider (`registerProvider(...)`) sementara OpenClaw mempertahankan loop inferensi generik. Plugin memiliki onboarding, katalog model, pemetaan env-var auth, normalisasi transport/konfigurasi, pembersihan skema alat, klasifikasi failover, refresh OAuth, pelaporan penggunaan, profil thinking/reasoning, dan lainnya.

Daftar lengkap hook provider-SDK dan contoh Plugin bawaan ada di [Plugin provider](/id/plugins/sdk-provider-plugins). Provider yang memerlukan executor permintaan kustom sepenuhnya adalah permukaan ekstensi terpisah yang lebih dalam.

<Note>
`capabilities` runtime provider adalah metadata runner bersama (keluarga provider, kekhasan transkrip/tooling, petunjuk transport/cache). Ini tidak sama dengan [model kapabilitas publik](/id/plugins/architecture#public-capability-model), yang menjelaskan apa yang didaftarkan Plugin (inferensi teks, speech, dll.).
</Note>

## Rotasi API key

- Mendukung rotasi provider generik untuk provider tertentu.
- Konfigurasikan beberapa key melalui:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (satu override live, prioritas tertinggi)
  - `<PROVIDER>_API_KEYS` (daftar dipisahkan koma atau titik koma)
  - `<PROVIDER>_API_KEY` (key utama)
  - `<PROVIDER>_API_KEY_*` (daftar bernomor, misalnya `<PROVIDER>_API_KEY_1`)
- Untuk provider Google, `GOOGLE_API_KEY` juga disertakan sebagai fallback.
- Urutan pemilihan key mempertahankan prioritas dan menghapus duplikasi nilai.
- Permintaan diulang dengan key berikutnya hanya pada respons rate-limit (misalnya `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded`, atau pesan batas penggunaan berkala).
- Kegagalan non-rate-limit langsung gagal; rotasi key tidak dicoba.
- Saat semua kandidat key gagal, error final dikembalikan dari percobaan terakhir.

## Provider bawaan (katalog pi-ai)

OpenClaw dikirim dengan katalog pi‑ai. Provider ini tidak memerlukan
konfigurasi `models.providers`; cukup atur auth + pilih model.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Rotasi opsional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, ditambah `OPENCLAW_LIVE_OPENAI_KEY` (satu override)
- Contoh model: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- Dukungan API langsung GPT-5.5 sudah siap di sini setelah OpenAI mengekspos GPT-5.5 pada API
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Transport default adalah `auto` (WebSocket lebih dulu, fallback SSE)
- Override per model melalui `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, atau `"auto"`)
- Warm-up WebSocket OpenAI Responses default-nya aktif melalui `params.openaiWsWarmup` (`true`/`false`)
- Priority processing OpenAI dapat diaktifkan melalui `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` dan `params.fastMode` memetakan permintaan `openai/*` Responses langsung ke `service_tier=priority` pada `api.openai.com`
- Gunakan `params.serviceTier` saat Anda menginginkan tier eksplisit alih-alih toggle `/fast` bersama
- Header atribusi OpenClaw tersembunyi (`originator`, `version`,
  `User-Agent`) hanya berlaku pada trafik OpenAI native ke `api.openai.com`, bukan
  proxy generik yang kompatibel dengan OpenAI
- Rute OpenAI native juga mempertahankan `store` Responses, petunjuk prompt-cache, dan
  pembentukan payload reasoning-compat OpenAI; rute proxy tidak
- `openai/gpt-5.3-codex-spark` sengaja disembunyikan di OpenClaw karena permintaan API OpenAI langsung menolaknya dan katalog Codex saat ini tidak mengeksposnya

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotasi opsional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, ditambah `OPENCLAW_LIVE_ANTHROPIC_KEY` (satu override)
- Contoh model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Permintaan Anthropic publik langsung mendukung toggle `/fast` bersama dan `params.fastMode`, termasuk trafik yang diautentikasi API key dan OAuth yang dikirim ke `api.anthropic.com`; OpenClaw memetakannya ke Anthropic `service_tier` (`auto` vs `standard_only`)
- Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI gaya OpenClaw diizinkan lagi, sehingga OpenClaw memperlakukan penggunaan ulang Claude CLI dan `claude -p` sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
- Setup-token Anthropic tetap tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` jika tersedia.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- Referensi model Pi: `openai-codex/gpt-5.5`
- Referensi harness app-server Codex native: `openai/gpt-5.5` dengan `agents.defaults.embeddedHarness.runtime: "codex"`
- Referensi model legacy: `codex/gpt-*`
- Batas Plugin: `openai-codex/*` memuat Plugin OpenAI; Plugin app-server
  Codex native hanya dipilih oleh runtime Codex harness atau referensi
  legacy `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` atau `openclaw models auth login --provider openai-codex`
- Transport default adalah `auto` (WebSocket lebih dulu, fallback SSE)
- Override per model Pi melalui `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, atau `"auto"`)
- `params.serviceTier` juga diteruskan pada permintaan Responses Codex native (`chatgpt.com/backend-api`)
- Header atribusi OpenClaw tersembunyi (`originator`, `version`,
  `User-Agent`) hanya dilampirkan pada trafik Codex native ke
  `chatgpt.com/backend-api`, bukan proxy generik yang kompatibel dengan OpenAI
- Berbagi toggle `/fast` dan konfigurasi `params.fastMode` yang sama seperti `openai/*` langsung; OpenClaw memetakannya ke `service_tier=priority`
- `openai-codex/gpt-5.5` mempertahankan `contextWindow = 1000000` native dan runtime default `contextTokens = 272000`; override batas runtime dengan `models.providers.openai-codex.models[].contextTokens`
- Catatan kebijakan: OpenAI Codex OAuth secara eksplisit didukung untuk alat/alur kerja eksternal seperti OpenClaw.
- Akses GPT-5.5 saat ini menggunakan rute OAuth/subscription ini sampai OpenAI mengaktifkan GPT-5.5 pada API publik.

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

### Opsi hosted bergaya subscription lainnya

- [Qwen Cloud](/id/providers/qwen): permukaan provider Qwen Cloud plus Alibaba DashScope dan pemetaan endpoint Coding Plan
- [MiniMax](/id/providers/minimax): akses OAuth atau API key MiniMax Coding Plan
- [GLM Models](/id/providers/glm): endpoint Z.AI Coding Plan atau API umum

### OpenCode

- Auth: `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`)
- Provider runtime Zen: `opencode`
- Provider runtime Go: `opencode-go`
- Contoh model: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` atau `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- Rotasi opsional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY`, dan `OPENCLAW_LIVE_GEMINI_KEY` (satu override)
- Contoh model: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilitas: konfigurasi OpenClaw legacy yang menggunakan `google/gemini-3.1-flash-preview` dinormalisasi menjadi `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Eksekusi Gemini langsung juga menerima `agents.defaults.models["google/<model>"].params.cachedContent`
  (atau legacy `cached_content`) untuk meneruskan handle native provider
  `cachedContents/...`; cache hit Gemini muncul sebagai OpenClaw `cacheRead`

### Google Vertex dan Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex menggunakan gcloud ADC; Gemini CLI menggunakan alur OAuth-nya
- Perhatian: OAuth Gemini CLI di OpenClaw adalah integrasi tidak resmi. Beberapa pengguna melaporkan pembatasan akun Google setelah menggunakan klien pihak ketiga. Tinjau ketentuan Google dan gunakan akun non-kritis jika Anda memilih untuk melanjutkan.
- OAuth Gemini CLI dikirim sebagai bagian dari Plugin `google` bawaan.
  - Instal Gemini CLI terlebih dahulu:
    - `brew install gemini-cli`
    - atau `npm install -g @google/gemini-cli`
  - Aktifkan: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Model default: `google-gemini-cli/gemini-3-flash-preview`
  - Catatan: Anda **tidak** menempelkan client id atau secret ke `openclaw.json`. Alur login CLI menyimpan
    token di profil auth pada host gateway.
  - Jika permintaan gagal setelah login, atur `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` pada host gateway.
  - Balasan JSON Gemini CLI di-parse dari `response`; penggunaan fallback ke
    `stats`, dengan `stats.cached` dinormalisasi menjadi OpenClaw `cacheRead`.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Contoh model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` dan `z-ai/*` dinormalisasi menjadi `zai/*`
  - `zai-api-key` mendeteksi otomatis endpoint Z.AI yang cocok; `zai-coding-global`, `zai-coding-cn`, `zai-global`, dan `zai-cn` memaksa permukaan tertentu

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Contoh model: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Contoh model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Katalog fallback statis dikirim dengan `kilocode/kilo/auto`; discovery langsung
  `https://api.kilo.ai/api/gateway/models` dapat memperluas katalog runtime
  lebih lanjut.
- Perutean upstream pasti di balik `kilocode/kilo/auto` dimiliki oleh Kilo Gateway,
  bukan di-hard-code di OpenClaw.

Lihat [/providers/kilocode](/id/providers/kilocode) untuk detail penyiapan.

### Plugin provider bawaan lainnya

| Provider                | Id                               | Env auth                                                     | Contoh model                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                         |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                              |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                              |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                              |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` atau `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1`          |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                           |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` atau `KIMICODE_API_KEY`                       | `kimi/kimi-code`                               |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                         |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                 |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                           |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                              |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                        |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                            |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                       |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                              |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`  |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`              |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                   |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                         |

Hal-hal khusus yang perlu diketahui:

- **OpenRouter** menerapkan header atribusi aplikasinya dan penanda Anthropic `cache_control` hanya pada rute `openrouter.ai` yang terverifikasi. Sebagai jalur bergaya proxy yang kompatibel dengan OpenAI, OpenRouter melewati pembentukan khusus OpenAI native (`serviceTier`, Responses `store`, petunjuk prompt-cache, OpenAI reasoning-compat). Referensi berbasis Gemini tetap mempertahankan sanitasi thought-signature proxy-Gemini saja.
- **Kilo Gateway** referensi berbasis Gemini mengikuti jalur sanitasi proxy-Gemini yang sama; `kilocode/kilo/auto` dan referensi lain yang tidak mendukung proxy-reasoning melewati injeksi reasoning proxy.
- **MiniMax** onboarding API key menulis definisi model M2.7 eksplisit dengan `input: ["text", "image"]`; katalog bawaan mempertahankan referensi chat hanya-teks sampai konfigurasi itu dimaterialisasi.
- **xAI** menggunakan jalur xAI Responses. `/fast` atau `params.fastMode: true` menulis ulang `grok-3`, `grok-3-mini`, `grok-4`, dan `grok-4-0709` ke varian `*-fast` mereka. `tool_stream` aktif secara default; nonaktifkan melalui `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** model GLM menggunakan `zai-glm-4.7` / `zai-glm-4.6`; base URL yang kompatibel dengan OpenAI adalah `https://api.cerebras.ai/v1`.

## Provider melalui `models.providers` (kustom/base URL)

Gunakan `models.providers` (atau `models.json`) untuk menambahkan provider
**kustom** atau proxy yang kompatibel dengan OpenAI/Anthropic.

Banyak Plugin provider bawaan di bawah ini sudah memublikasikan katalog default.
Gunakan entri `models.providers.<id>` eksplisit hanya saat Anda ingin mengganti
default base URL, header, atau daftar model.

### Moonshot AI (Kimi)

Moonshot dikirim sebagai Plugin provider bawaan. Gunakan provider bawaan secara
default, dan tambahkan entri `models.providers.moonshot` eksplisit hanya ketika Anda
perlu mengganti base URL atau metadata model:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Contoh model: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` atau `openclaw onboard --auth-choice moonshot-api-key-cn`

ID model Kimi K2:

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

Kimi Coding menggunakan endpoint Moonshot AI yang kompatibel dengan Anthropic:

- Provider: `kimi`
- Auth: `KIMI_API_KEY`
- Contoh model: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

`kimi/k2p5` legacy tetap diterima sebagai id model kompatibilitas.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) menyediakan akses ke Doubao dan model lain di Tiongkok.

- Provider: `volcengine` (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- Contoh model: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Onboarding default ke permukaan coding, tetapi katalog umum `volcengine/*`
juga didaftarkan pada saat yang sama.

Dalam pemilih model onboarding/configure, pilihan auth Volcengine memprioritaskan kedua
baris `volcengine/*` dan `volcengine-plan/*`. Jika model-model tersebut belum dimuat,
OpenClaw fallback ke katalog tanpa filter alih-alih menampilkan pemilih
bercakupan provider yang kosong.

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

- Provider: `byteplus` (coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- Contoh model: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Onboarding default ke permukaan coding, tetapi katalog umum `byteplus/*`
juga didaftarkan pada saat yang sama.

Dalam pemilih model onboarding/configure, pilihan auth BytePlus memprioritaskan kedua
baris `byteplus/*` dan `byteplus-plan/*`. Jika model-model tersebut belum dimuat,
OpenClaw fallback ke katalog tanpa filter alih-alih menampilkan pemilih
bercakupan provider yang kosong.

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

Synthetic menyediakan model yang kompatibel dengan Anthropic di balik provider `synthetic`:

- Provider: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
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
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` untuk `minimax`; `MINIMAX_OAUTH_TOKEN` atau
  `MINIMAX_API_KEY` untuk `minimax-portal`

Lihat [/providers/minimax](/id/providers/minimax) untuk detail penyiapan, opsi model, dan cuplikan konfigurasi.

Pada jalur streaming yang kompatibel dengan Anthropic milik MiniMax, OpenClaw menonaktifkan thinking secara
default kecuali Anda mengaturnya secara eksplisit, dan `/fast on` menulis ulang
`MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.

Pemisahan kapabilitas milik Plugin:

- Default teks/chat tetap pada `minimax/MiniMax-M2.7`
- Pembuatan gambar adalah `minimax/image-01` atau `minimax-portal/image-01`
- Pemahaman gambar adalah `MiniMax-VL-01` milik Plugin pada kedua jalur auth MiniMax
- Pencarian web tetap pada id provider `minimax`

### LM Studio

LM Studio dikirim sebagai Plugin provider bawaan yang menggunakan API native:

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- Default base URL inferensi: `http://localhost:1234/v1`

Lalu atur model (ganti dengan salah satu ID yang dikembalikan oleh `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw menggunakan `/api/v1/models` dan `/api/v1/models/load` native milik LM Studio
untuk discovery + auto-load, dengan `/v1/chat/completions` untuk inferensi secara default.
Lihat [/providers/lmstudio](/id/providers/lmstudio) untuk penyiapan dan pemecahan masalah.

### Ollama

Ollama dikirim sebagai Plugin provider bawaan dan menggunakan API native Ollama:

- Provider: `ollama`
- Auth: Tidak diperlukan (server lokal)
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

Ollama dideteksi secara lokal di `http://127.0.0.1:11434` saat Anda memilih ikut dengan
`OLLAMA_API_KEY`, dan Plugin provider bawaan menambahkan Ollama langsung ke
`openclaw onboard` dan pemilih model. Lihat [/providers/ollama](/id/providers/ollama)
untuk onboarding, mode cloud/lokal, dan konfigurasi kustom.

### vLLM

vLLM dikirim sebagai Plugin provider bawaan untuk server lokal/self-hosted yang
kompatibel dengan OpenAI:

- Provider: `vllm`
- Auth: Opsional (tergantung server Anda)
- Default base URL: `http://127.0.0.1:8000/v1`

Untuk ikut serta dalam auto-discovery secara lokal (nilai apa pun berfungsi jika server Anda tidak menegakkan auth):

```bash
export VLLM_API_KEY="vllm-local"
```

Lalu atur model (ganti dengan salah satu ID yang dikembalikan oleh `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Lihat [/providers/vllm](/id/providers/vllm) untuk detail.

### SGLang

SGLang dikirim sebagai Plugin provider bawaan untuk server self-hosted cepat
yang kompatibel dengan OpenAI:

- Provider: `sglang`
- Auth: Opsional (tergantung server Anda)
- Default base URL: `http://127.0.0.1:30000/v1`

Untuk ikut serta dalam auto-discovery secara lokal (nilai apa pun berfungsi jika server Anda tidak
menegakkan auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

Lalu atur model (ganti dengan salah satu ID yang dikembalikan oleh `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Lihat [/providers/sglang](/id/providers/sglang) untuk detail.

### Proxy lokal (LM Studio, vLLM, LiteLLM, dll.)

Contoh (kompatibel dengan OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
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
            name: "Local Model",
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

- Untuk provider kustom, `reasoning`, `input`, `cost`, `contextWindow`, dan `maxTokens` bersifat opsional.
  Jika dihilangkan, OpenClaw default ke:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Disarankan: atur nilai eksplisit yang sesuai dengan batas proxy/model Anda.
- Untuk `api: "openai-completions"` pada endpoint non-native (setiap `baseUrl` yang tidak kosong yang host-nya bukan `api.openai.com`), OpenClaw memaksa `compat.supportsDeveloperRole: false` untuk menghindari error provider 400 untuk role `developer` yang tidak didukung.
- Rute kompatibel OpenAI bergaya proxy juga melewati pembentukan permintaan khusus OpenAI native:
  tidak ada `service_tier`, tidak ada Responses `store`, tidak ada petunjuk prompt-cache, tidak ada
  pembentukan payload reasoning-compat OpenAI, dan tidak ada header atribusi OpenClaw tersembunyi.
- Jika `baseUrl` kosong/dihilangkan, OpenClaw mempertahankan perilaku OpenAI default (yang diselesaikan ke `api.openai.com`).
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
- [Referensi Konfigurasi](/id/gateway/config-agents#agent-defaults) — kunci konfigurasi model
- [Providers](/id/providers) — panduan penyiapan per provider
