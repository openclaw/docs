---
read_when:
    - Anda memerlukan referensi penyiapan model per penyedia
    - Anda menginginkan contoh konfigurasi atau perintah penyiapan awal CLI untuk penyedia model
sidebarTitle: Model providers
summary: Gambaran umum penyedia model dengan konfigurasi contoh + alur CLI
title: Penyedia model
x-i18n:
    generated_at: "2026-05-02T09:18:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02494bfb71c0e0449eacd9ec028316e7a1479e51c6591aea5885baf3941272d5
    source_path: concepts/model-providers.md
    workflow: 16
---

Referensi untuk **penyedia LLM/model** (bukan saluran chat seperti WhatsApp/Telegram). Untuk aturan pemilihan model, lihat [Model](/id/concepts/models).

## Aturan cepat

<AccordionGroup>
  <Accordion title="Referensi model dan pembantu CLI">
    - Referensi model menggunakan `provider/model` (contoh: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` bertindak sebagai daftar izin ketika disetel.
    - Pembantu CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` menyetel default tingkat penyedia; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` menimpanya per model.
    - Aturan fallback, probe cooldown, dan persistensi penimpaan sesi: [Failover model](/id/concepts/model-failover).

  </Accordion>
  <Accordion title="Menambahkan auth penyedia tidak mengubah model utama Anda">
    `openclaw configure` mempertahankan `agents.defaults.model.primary` yang sudah ada ketika Anda menambahkan atau mengautentikasi ulang penyedia. Plugin penyedia mungkin tetap mengembalikan model default yang direkomendasikan dalam patch konfigurasi auth mereka, tetapi configure memperlakukannya sebagai "buat model ini tersedia" ketika model utama sudah ada, bukan "ganti model utama saat ini."

    Untuk sengaja mengganti model default, gunakan `openclaw models set <provider/model>` atau `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Pemisahan penyedia/runtime OpenAI">
    Rute keluarga OpenAI bersifat spesifik prefiks:

    - `openai/<model>` plus `agents.defaults.agentRuntime.id: "codex"` menggunakan harness app-server Codex native. Ini adalah setup langganan ChatGPT/Codex yang umum.
    - `openai-codex/<model>` menggunakan Codex OAuth di PI.
    - `openai/<model>` tanpa penimpaan runtime Codex menggunakan penyedia kunci API OpenAI langsung di PI.

    Lihat [OpenAI](/id/providers/openai) dan [Harness Codex](/id/plugins/codex-harness). Jika pemisahan penyedia/runtime membingungkan, baca [Runtime agen](/id/concepts/agent-runtimes) terlebih dahulu.

    Pengaktifan otomatis Plugin mengikuti batas yang sama: `openai-codex/<model>` milik Plugin OpenAI, sedangkan Plugin Codex diaktifkan oleh `agentRuntime.id: "codex"` atau referensi lama `codex/<model>`.

    GPT-5.5 tersedia melalui harness app-server Codex native ketika `agentRuntime.id: "codex"` disetel, melalui `openai-codex/gpt-5.5` di PI untuk Codex OAuth, dan melalui `openai/gpt-5.5` di PI untuk traffic kunci API langsung ketika akun Anda mengeksposnya.

  </Accordion>
  <Accordion title="Runtime CLI">
    Runtime CLI menggunakan pemisahan yang sama: pilih referensi model kanonis seperti `anthropic/claude-*`, `google/gemini-*`, atau `openai/gpt-*`, lalu setel `agents.defaults.agentRuntime.id` ke `claude-cli`, `google-gemini-cli`, atau `codex-cli` ketika Anda menginginkan backend CLI lokal.

    Referensi lama `claude-cli/*`, `google-gemini-cli/*`, dan `codex-cli/*` dimigrasikan kembali ke referensi penyedia kanonis dengan runtime dicatat secara terpisah.

  </Accordion>
</AccordionGroup>

## Perilaku penyedia milik Plugin

Sebagian besar logika spesifik penyedia berada di Plugin penyedia (`registerProvider(...)`) sementara OpenClaw mempertahankan loop inferensi generik. Plugin memiliki onboarding, katalog model, pemetaan env-var auth, normalisasi transport/konfigurasi, pembersihan skema alat, klasifikasi failover, refresh OAuth, pelaporan penggunaan, profil thinking/reasoning, dan lainnya.

Daftar lengkap hook provider-SDK dan contoh Plugin bawaan ada di [Plugin penyedia](/id/plugins/sdk-provider-plugins). Penyedia yang memerlukan eksekutor permintaan yang sepenuhnya kustom adalah permukaan ekstensi yang terpisah dan lebih dalam.

<Note>
Perilaku runner milik penyedia berada pada hook penyedia eksplisit seperti kebijakan replay, normalisasi skema alat, pembungkus stream, dan pembantu transport/permintaan. Tas statis lama `ProviderPlugin.capabilities` hanya untuk kompatibilitas dan tidak lagi dibaca oleh logika runner bersama.
</Note>

## Rotasi kunci API

<AccordionGroup>
  <Accordion title="Sumber dan prioritas kunci">
    Konfigurasikan beberapa kunci melalui:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (penimpaan live tunggal, prioritas tertinggi)
    - `<PROVIDER>_API_KEYS` (daftar dipisahkan koma atau titik koma)
    - `<PROVIDER>_API_KEY` (kunci utama)
    - `<PROVIDER>_API_KEY_*` (daftar bernomor, mis. `<PROVIDER>_API_KEY_1`)

    Untuk penyedia Google, `GOOGLE_API_KEY` juga disertakan sebagai fallback. Urutan pemilihan kunci mempertahankan prioritas dan menghapus duplikasi nilai.

  </Accordion>
  <Accordion title="Kapan rotasi dimulai">
    - Permintaan dicoba ulang dengan kunci berikutnya hanya pada respons batas laju (misalnya `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, atau pesan batas penggunaan berkala).
    - Kegagalan yang bukan batas laju langsung gagal; tidak ada rotasi kunci yang dicoba.
    - Ketika semua kunci kandidat gagal, error akhir dikembalikan dari percobaan terakhir.

  </Accordion>
</AccordionGroup>

## Penyedia bawaan (katalog pi-ai)

OpenClaw dikirimkan dengan katalog pi‑ai. Penyedia ini **tidak** memerlukan konfigurasi `models.providers`; cukup setel auth + pilih model.

### OpenAI

- Penyedia: `openai`
- Auth: `OPENAI_API_KEY`
- Rotasi opsional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (penimpaan tunggal)
- Contoh model: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifikasi ketersediaan akun/model dengan `openclaw models list --provider openai` jika instalasi tertentu atau kunci API berperilaku berbeda.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Transport default adalah `auto` (WebSocket terlebih dahulu, fallback SSE)
- Timpa per model melalui `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, atau `"auto"`)
- Pemanasan WebSocket OpenAI Responses default aktif melalui `params.openaiWsWarmup` (`true`/`false`)
- Pemrosesan prioritas OpenAI dapat diaktifkan melalui `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` dan `params.fastMode` memetakan permintaan Responses `openai/*` langsung ke `service_tier=priority` pada `api.openai.com`
- Gunakan `params.serviceTier` ketika Anda menginginkan tingkat eksplisit alih-alih toggle bersama `/fast`
- Header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`) hanya berlaku pada traffic OpenAI native ke `api.openai.com`, bukan proxy generik yang kompatibel dengan OpenAI
- Rute OpenAI native juga mempertahankan Responses `store`, petunjuk prompt-cache, dan pembentukan payload kompatibilitas reasoning OpenAI; rute proxy tidak
- `openai/gpt-5.3-codex-spark` sengaja ditekan di OpenClaw karena permintaan API OpenAI live menolaknya dan katalog Codex saat ini tidak mengeksposnya

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Penyedia: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotasi opsional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (penimpaan tunggal)
- Contoh model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Permintaan Anthropic publik langsung mendukung toggle bersama `/fast` dan `params.fastMode`, termasuk traffic kunci API dan terautentikasi OAuth yang dikirim ke `api.anthropic.com`; OpenClaw memetakannya ke `service_tier` Anthropic (`auto` vs `standard_only`)
- Konfigurasi Claude CLI yang disarankan mempertahankan referensi model tetap kanonis dan memilih backend CLI
  secara terpisah: `anthropic/claude-opus-4-7` dengan
  `agents.defaults.agentRuntime.id: "claude-cli"`. Referensi lama
  `claude-cli/claude-opus-4-7` tetap berfungsi untuk kompatibilitas.

<Note>
Staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan lagi, sehingga OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru. Setup-token Anthropic tetap tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw kini lebih memilih penggunaan ulang Claude CLI dan `claude -p` ketika tersedia.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Penyedia: `openai-codex`
- Auth: OAuth (ChatGPT)
- Referensi model PI: `openai-codex/gpt-5.5`
- Referensi harness app-server Codex native: `openai/gpt-5.5` dengan `agents.defaults.agentRuntime.id: "codex"`
- Dokumentasi harness app-server Codex native: [Harness Codex](/id/plugins/codex-harness)
- Referensi model lama: `codex/gpt-*`
- Batas Plugin: `openai-codex/*` memuat Plugin OpenAI; Plugin app-server Codex native dipilih hanya oleh runtime harness Codex atau referensi lama `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` atau `openclaw models auth login --provider openai-codex`
- Transport default adalah `auto` (WebSocket terlebih dahulu, fallback SSE)
- Timpa per model PI melalui `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, atau `"auto"`)
- `params.serviceTier` juga diteruskan pada permintaan Codex Responses native (`chatgpt.com/backend-api`)
- Header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`) hanya dilampirkan pada traffic Codex native ke `chatgpt.com/backend-api`, bukan proxy generik yang kompatibel dengan OpenAI
- Berbagi toggle `/fast` dan konfigurasi `params.fastMode` yang sama seperti `openai/*` langsung; OpenClaw memetakannya ke `service_tier=priority`
- `openai-codex/gpt-5.5` menggunakan `contextWindow = 400000` native katalog Codex dan runtime default `contextTokens = 272000`; timpa batas runtime dengan `models.providers.openai-codex.models[].contextTokens`
- Catatan kebijakan: OpenAI Codex OAuth secara eksplisit didukung untuk alat/alur kerja eksternal seperti OpenClaw.
- Untuk rute langganan umum plus runtime Codex native, masuk dengan auth `openai-codex` tetapi konfigurasikan `openai/gpt-5.5` plus `agents.defaults.agentRuntime.id: "codex"`.
- Gunakan `openai-codex/gpt-5.5` hanya ketika Anda menginginkan rute OAuth/langganan Codex melalui PI; gunakan `openai/gpt-5.5` tanpa penimpaan runtime Codex ketika setup kunci API dan katalog lokal Anda mengekspos rute API publik.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      agentRuntime: { id: "codex", fallback: "none" },
    },
  },
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

### Opsi hosted bergaya langganan lainnya

<CardGroup cols={3}>
  <Card title="Model GLM" href="/id/providers/glm">
    Z.AI Coding Plan atau endpoint API umum.
  </Card>
  <Card title="MiniMax" href="/id/providers/minimax">
    OAuth MiniMax Coding Plan atau akses kunci API.
  </Card>
  <Card title="Qwen Cloud" href="/id/providers/qwen">
    Permukaan penyedia Qwen Cloud plus pemetaan endpoint Alibaba DashScope dan Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Auth: `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`)
- Penyedia runtime Zen: `opencode`
- Penyedia runtime Go: `opencode-go`
- Contoh model: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` atau `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (kunci API)

- Penyedia: `google`
- Autentikasi: `GEMINI_API_KEY`
- Rotasi opsional: fallback `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY`, dan `OPENCLAW_LIVE_GEMINI_KEY` (penggantian tunggal)
- Model contoh: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilitas: konfigurasi OpenClaw lama yang menggunakan `google/gemini-3.1-flash-preview` dinormalisasi menjadi `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` diterima dan dinormalisasi menjadi id Gemini API live Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` menggunakan thinking dinamis Google. Gemini 3/3.1 menghilangkan `thinkingLevel` tetap; Gemini 2.5 mengirim `thinkingBudget: -1`.
- Eksekusi Gemini langsung juga menerima `agents.defaults.models["google/<model>"].params.cachedContent` (atau `cached_content` lama) untuk meneruskan handle `cachedContents/...` asli penyedia; hit cache Gemini muncul sebagai `cacheRead` OpenClaw

### Google Vertex dan Gemini CLI

- Penyedia: `google-vertex`, `google-gemini-cli`
- Autentikasi: Vertex menggunakan ADC gcloud; Gemini CLI menggunakan alur OAuth-nya

<Warning>
OAuth Gemini CLI di OpenClaw adalah integrasi tidak resmi. Beberapa pengguna melaporkan pembatasan akun Google setelah menggunakan klien pihak ketiga. Tinjau ketentuan Google dan gunakan akun yang tidak kritis jika Anda memilih untuk melanjutkan.
</Warning>

OAuth Gemini CLI dikirim sebagai bagian dari Plugin `google` bawaan.

<Steps>
  <Step title="Instal Gemini CLI">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Aktifkan Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Masuk">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Model default: `google-gemini-cli/gemini-3-flash-preview`. Anda **tidak** menempelkan id klien atau secret ke `openclaw.json`. Alur masuk CLI menyimpan token dalam profil autentikasi di host Gateway.

  </Step>
  <Step title="Tetapkan proyek (jika diperlukan)">
    Jika permintaan gagal setelah masuk, tetapkan `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` pada host Gateway.
  </Step>
</Steps>

Balasan JSON Gemini CLI diurai dari `response`; penggunaan fallback ke `stats`, dengan `stats.cached` dinormalisasi menjadi `cacheRead` OpenClaw.

### Z.AI (GLM)

- Penyedia: `zai`
- Autentikasi: `ZAI_API_KEY`
- Model contoh: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` dan `z-ai/*` dinormalisasi menjadi `zai/*`
  - `zai-api-key` mendeteksi otomatis endpoint Z.AI yang cocok; `zai-coding-global`, `zai-coding-cn`, `zai-global`, dan `zai-cn` memaksa permukaan tertentu

### Vercel AI Gateway

- Penyedia: `vercel-ai-gateway`
- Autentikasi: `AI_GATEWAY_API_KEY`
- Model contoh: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Penyedia: `kilocode`
- Autentikasi: `KILOCODE_API_KEY`
- Model contoh: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL dasar: `https://api.kilo.ai/api/gateway/`
- Katalog fallback statis mengirim `kilocode/kilo/auto`; penemuan live `https://api.kilo.ai/api/gateway/models` dapat memperluas katalog runtime lebih lanjut.
- Routing upstream persis di balik `kilocode/kilo/auto` dimiliki oleh Kilo Gateway, bukan di-hard-code di OpenClaw.

Lihat [/providers/kilocode](/id/providers/kilocode) untuk detail penyiapan.

### Plugin penyedia bawaan lainnya

| Penyedia                | Id                               | Env autentikasi                                             | Model contoh                                  |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` atau `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` atau `KIMICODE_API_KEY`                       | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### Keunikan yang perlu diketahui

<AccordionGroup>
  <Accordion title="OpenRouter">
    Menerapkan header atribusi aplikasi dan penanda `cache_control` Anthropic hanya pada rute `openrouter.ai` yang terverifikasi. Referensi DeepSeek, Moonshot, dan ZAI memenuhi syarat cache-TTL untuk caching prompt yang dikelola OpenRouter, tetapi tidak menerima penanda cache Anthropic. Sebagai jalur bergaya proxy yang kompatibel dengan OpenAI, jalur ini melewati pembentukan khusus OpenAI native (`serviceTier`, Responses `store`, petunjuk prompt-cache, kompatibilitas reasoning OpenAI). Referensi berbasis Gemini hanya mempertahankan sanitasi thought-signature proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Referensi berbasis Gemini mengikuti jalur sanitasi proxy-Gemini yang sama; `kilocode/kilo/auto` dan referensi lain yang tidak mendukung proxy-reasoning melewati injeksi reasoning proxy.
  </Accordion>
  <Accordion title="MiniMax">
    Onboarding kunci API menulis definisi model chat M2.7 khusus teks secara eksplisit; pemahaman gambar tetap berada pada penyedia media `MiniMax-VL-01` yang dimiliki Plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    ID model menggunakan namespace `nvidia/<vendor>/<model>` (misalnya `nvidia/nvidia/nemotron-...` bersama `nvidia/moonshotai/kimi-k2.5`); pemilih mempertahankan komposisi literal `<provider>/<model-id>` sementara kunci kanonis yang dikirim ke API tetap berawalan tunggal.
  </Accordion>
  <Accordion title="xAI">
    Menggunakan jalur xAI Responses. `grok-4.3` adalah model chat default yang dibundel. `/fast` atau `params.fastMode: true` menulis ulang `grok-3`, `grok-3-mini`, `grok-4`, dan `grok-4-0709` ke varian `*-fast` masing-masing. `tool_stream` aktif secara default; nonaktifkan melalui `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Dikirim sebagai Plugin penyedia `cerebras` yang dibundel. GLM menggunakan `zai-glm-4.7`; URL dasar yang kompatibel dengan OpenAI adalah `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Penyedia melalui `models.providers` (URL kustom/dasar)

Gunakan `models.providers` (atau `models.json`) untuk menambahkan penyedia **kustom** atau proxy yang kompatibel dengan OpenAI/Anthropic.

Banyak Plugin penyedia bawaan di bawah ini sudah menerbitkan katalog default. Gunakan entri `models.providers.<id>` eksplisit hanya saat Anda ingin menimpa URL dasar, header, atau daftar model default.

Pemeriksaan kapabilitas model Gateway juga membaca metadata `models.providers.<id>.models[]` eksplisit. Jika model kustom atau proxy menerima gambar, tetapkan `input: ["text", "image"]` pada model tersebut agar jalur lampiran WebChat dan asal node meneruskan gambar sebagai input model native, bukan sebagai referensi media khusus teks.

### Moonshot AI (Kimi)

Moonshot dikirim sebagai Plugin penyedia bawaan. Gunakan penyedia bawaan secara default, dan tambahkan entri `models.providers.moonshot` eksplisit hanya saat Anda perlu menimpa URL dasar atau metadata model:

- Penyedia: `moonshot`
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

### Kimi coding

Kimi Coding menggunakan endpoint Moonshot AI yang kompatibel dengan Anthropic:

- Penyedia: `kimi`
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

Onboarding secara default menggunakan permukaan coding, tetapi katalog umum `volcengine/*` didaftarkan pada saat yang sama.

Di pemilih model onboarding/konfigurasi, pilihan autentikasi Volcengine memprioritaskan baris `volcengine/*` dan `volcengine-plan/*`. Jika model-model tersebut belum dimuat, OpenClaw kembali ke katalog tanpa filter alih-alih menampilkan pemilih dengan cakupan penyedia yang kosong.

<Tabs>
  <Tab title="Model standar">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Model coding (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

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

Onboarding secara default menggunakan permukaan coding, tetapi katalog umum `byteplus/*` didaftarkan pada saat yang sama.

Di pemilih model onboarding/konfigurasi, pilihan autentikasi BytePlus memprioritaskan baris `byteplus/*` dan `byteplus-plan/*`. Jika model-model tersebut belum dimuat, OpenClaw kembali ke katalog tanpa filter alih-alih menampilkan pemilih dengan cakupan penyedia yang kosong.

<Tabs>
  <Tab title="Model standar">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Model coding (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic menyediakan model yang kompatibel dengan Anthropic di balik penyedia `synthetic`:

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

MiniMax dikonfigurasi melalui `models.providers` karena menggunakan endpoint khusus:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Kunci API MiniMax (Global): `--auth-choice minimax-global-api`
- Kunci API MiniMax (CN): `--auth-choice minimax-cn-api`
- Autentikasi: `MINIMAX_API_KEY` untuk `minimax`; `MINIMAX_OAUTH_TOKEN` atau `MINIMAX_API_KEY` untuk `minimax-portal`

Lihat [/providers/minimax](/id/providers/minimax) untuk detail penyiapan, opsi model, dan potongan konfigurasi.

<Note>
Pada jalur streaming MiniMax yang kompatibel dengan Anthropic, OpenClaw menonaktifkan thinking secara default kecuali Anda menetapkannya secara eksplisit, dan `/fast on` menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
</Note>

Pemisahan kapabilitas milik Plugin:

- Default teks/chat tetap di `minimax/MiniMax-M2.7`
- Pembuatan gambar adalah `minimax/image-01` atau `minimax-portal/image-01`
- Pemahaman gambar adalah `MiniMax-VL-01` milik Plugin pada kedua jalur autentikasi MiniMax
- Pencarian web tetap pada id penyedia `minimax`

### LM Studio

LM Studio disertakan sebagai Plugin penyedia bawaan yang menggunakan API native:

- Penyedia: `lmstudio`
- Autentikasi: `LM_API_TOKEN`
- URL dasar inferensi default: `http://localhost:1234/v1`

Lalu tetapkan model (ganti dengan salah satu ID yang dikembalikan oleh `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw menggunakan `/api/v1/models` dan `/api/v1/models/load` native milik LM Studio untuk discovery + auto-load, dengan `/v1/chat/completions` untuk inferensi secara default. Jika Anda ingin pemuatan JIT, TTL, dan auto-evict LM Studio mengelola siklus hidup model, tetapkan `models.providers.lmstudio.params.preload: false`. Lihat [/providers/lmstudio](/id/providers/lmstudio) untuk penyiapan dan pemecahan masalah.

### Ollama

Ollama disertakan sebagai Plugin penyedia bawaan dan menggunakan API native Ollama:

- Penyedia: `ollama`
- Autentikasi: Tidak diperlukan (server lokal)
- Contoh model: `ollama/llama3.3`
- Instalasi: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama dideteksi secara lokal di `http://127.0.0.1:11434` saat Anda ikut serta dengan `OLLAMA_API_KEY`, dan Plugin penyedia bawaan menambahkan Ollama langsung ke `openclaw onboard` dan pemilih model. Lihat [/providers/ollama](/id/providers/ollama) untuk onboarding, mode cloud/lokal, dan konfigurasi khusus.

### vLLM

vLLM disertakan sebagai Plugin penyedia bawaan untuk server lokal/self-hosted yang kompatibel dengan OpenAI:

- Penyedia: `vllm`
- Autentikasi: Opsional (bergantung pada server Anda)
- URL dasar default: `http://127.0.0.1:8000/v1`

Untuk ikut serta dalam auto-discovery secara lokal (nilai apa pun berfungsi jika server Anda tidak menerapkan autentikasi):

```bash
export VLLM_API_KEY="vllm-local"
```

Lalu tetapkan model (ganti dengan salah satu ID yang dikembalikan oleh `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Lihat [/providers/vllm](/id/providers/vllm) untuk detail.

### SGLang

SGLang disertakan sebagai Plugin penyedia bawaan untuk server self-hosted cepat yang kompatibel dengan OpenAI:

- Penyedia: `sglang`
- Autentikasi: Opsional (bergantung pada server Anda)
- URL dasar default: `http://127.0.0.1:30000/v1`

Untuk ikut serta dalam auto-discovery secara lokal (nilai apa pun berfungsi jika server Anda tidak menerapkan autentikasi):

```bash
export SGLANG_API_KEY="sglang-local"
```

Lalu tetapkan model (ganti dengan salah satu ID yang dikembalikan oleh `/v1/models`):

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
        timeoutSeconds: 300,
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

<AccordionGroup>
  <Accordion title="Bidang opsional default">
    Untuk penyedia khusus, `reasoning`, `input`, `cost`, `contextWindow`, dan `maxTokens` bersifat opsional. Jika dihilangkan, OpenClaw menggunakan default:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Direkomendasikan: tetapkan nilai eksplisit yang cocok dengan batas proxy/model Anda.

  </Accordion>
  <Accordion title="Aturan pembentukan rute proxy">
    - Untuk `api: "openai-completions"` pada endpoint non-native (`baseUrl` tidak kosong apa pun yang host-nya bukan `api.openai.com`), OpenClaw memaksa `compat.supportsDeveloperRole: false` untuk menghindari galat 400 penyedia bagi role `developer` yang tidak didukung.
    - Rute bergaya proxy yang kompatibel dengan OpenAI juga melewati pembentukan permintaan khusus OpenAI native: tanpa `service_tier`, tanpa Responses `store`, tanpa Completions `store`, tanpa petunjuk prompt-cache, tanpa pembentukan payload kompatibilitas reasoning OpenAI, dan tanpa header atribusi OpenClaw tersembunyi.
    - Untuk proxy Completions yang kompatibel dengan OpenAI yang memerlukan bidang spesifik vendor, tetapkan `agents.defaults.models["provider/model"].params.extra_body` (atau `extraBody`) untuk menggabungkan JSON tambahan ke isi permintaan keluar.
    - Untuk kontrol chat-template vLLM, tetapkan `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Plugin vLLM bawaan secara otomatis mengirim `enable_thinking: false` dan `force_nonempty_content: true` untuk `vllm/nemotron-3-*` saat level thinking sesi nonaktif.
    - Untuk model lokal lambat atau host LAN/tailnet jarak jauh, tetapkan `models.providers.<id>.timeoutSeconds`. Ini memperpanjang penanganan permintaan HTTP model penyedia, termasuk koneksi, header, streaming body, dan abort guarded-fetch total, tanpa meningkatkan timeout runtime agen secara keseluruhan.
    - Jika `baseUrl` kosong/dihilangkan, OpenClaw mempertahankan perilaku default OpenAI (yang diselesaikan ke `api.openai.com`).
    - Demi keamanan, `compat.supportsDeveloperRole: true` eksplisit tetap ditimpa pada endpoint `openai-completions` non-native.
    - Untuk `api: "anthropic-messages"` pada endpoint non-langsung (penyedia apa pun selain `anthropic` kanonis, atau `models.providers.anthropic.baseUrl` khusus yang host-nya bukan endpoint publik `api.anthropic.com`), OpenClaw menekan header beta Anthropic implisit seperti `claude-code-20250219`, `interleaved-thinking-2025-05-14`, dan penanda OAuth, sehingga proxy khusus yang kompatibel dengan Anthropic tidak menolak flag beta yang tidak didukung. Tetapkan `models.providers.<id>.headers["anthropic-beta"]` secara eksplisit jika proxy Anda memerlukan fitur beta tertentu.

  </Accordion>
</AccordionGroup>

## Contoh CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Lihat juga: [Konfigurasi](/id/gateway/configuration) untuk contoh konfigurasi lengkap.

## Terkait

- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults) — kunci konfigurasi model
- [Failover model](/id/concepts/model-failover) — rantai fallback dan perilaku percobaan ulang
- [Model](/id/concepts/models) — konfigurasi dan alias model
- [Penyedia](/id/providers) — panduan penyiapan per penyedia
