---
read_when:
    - Anda memerlukan referensi penyiapan model per penyedia
    - Anda menginginkan contoh konfigurasi atau perintah onboarding CLI untuk penyedia model
sidebarTitle: Model providers
summary: Ikhtisar penyedia model dengan contoh konfigurasi + alur CLI
title: Penyedia model
x-i18n:
    generated_at: "2026-07-04T04:06:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410c92229de01cbb2be185e6cd1e2a07e554c7c5aacb356f4a9ffd1bce268de2
    source_path: concepts/model-providers.md
    workflow: 16
---

Referensi untuk **penyedia LLM/model** (bukan kanal chat seperti WhatsApp/Telegram). Untuk aturan pemilihan model, lihat [Model](/id/concepts/models).

## Aturan cepat

<AccordionGroup>
  <Accordion title="Referensi model dan pembantu CLI">
    - Referensi model menggunakan `provider/model` (contoh: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` bertindak sebagai daftar izin ketika diatur.
    - Pembantu CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` mengatur default tingkat penyedia; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` menimpanya per model.
    - Aturan fallback, probe cooldown, dan persistensi override sesi: [Failover model](/id/concepts/model-failover).

  </Accordion>
  <Accordion title="Menambahkan auth penyedia tidak mengubah model utama Anda">
    `openclaw configure` mempertahankan `agents.defaults.model.primary` yang sudah ada saat Anda menambahkan atau mengautentikasi ulang penyedia. `openclaw models auth login` melakukan hal yang sama kecuali Anda meneruskan `--set-default`. Plugin penyedia masih dapat mengembalikan model default yang direkomendasikan dalam patch konfigurasi auth mereka, tetapi OpenClaw memperlakukannya sebagai "jadikan model ini tersedia" ketika model utama sudah ada, bukan "ganti model utama saat ini."

    Untuk sengaja mengganti model default, gunakan `openclaw models set <provider/model>` atau `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Pemisahan penyedia/runtime OpenAI">
    Rute keluarga OpenAI bersifat spesifik prefiks:

    - `openai/<model>` menggunakan harness app-server Codex native untuk giliran agen secara default. Ini adalah setup langganan ChatGPT/Codex yang biasa.
    - referensi model Codex legacy adalah konfigurasi legacy yang ditulis ulang oleh doctor menjadi `openai/<model>`.
    - `openai/<model>` plus provider/model `agentRuntime.id: "openclaw"` menggunakan runtime bawaan OpenClaw untuk rute kunci API eksplisit atau kompatibilitas.

    Lihat [OpenAI](/id/providers/openai) dan [Harness Codex](/id/plugins/codex-harness). Jika pemisahan penyedia/runtime membingungkan, baca [Runtime agen](/id/concepts/agent-runtimes) terlebih dahulu.

    Auto-enable Plugin mengikuti batas yang sama: referensi agen `openai/*` mengaktifkan Plugin Codex untuk rute default, dan provider/model eksplisit `agentRuntime.id: "codex"` atau referensi legacy `codex/<model>` juga memerlukannya.

    GPT-5.5 tersedia melalui harness app-server Codex native secara default pada `openai/gpt-5.5`, dan melalui runtime OpenClaw ketika kebijakan runtime provider/model secara eksplisit memilih `openclaw`.

  </Accordion>
  <Accordion title="Runtime CLI">
    Runtime CLI menggunakan pemisahan yang sama: pilih referensi model kanonis seperti `anthropic/claude-*` atau `google/gemini-*`, lalu atur kebijakan runtime provider/model ke `claude-cli` atau `google-gemini-cli` ketika Anda menginginkan backend CLI lokal.

    Referensi legacy `claude-cli/*` dan `google-gemini-cli/*` bermigrasi kembali ke referensi penyedia kanonis dengan runtime dicatat secara terpisah. Referensi legacy `codex-cli/*` bermigrasi ke `openai/*` dan menggunakan rute app-server Codex; OpenClaw tidak lagi mempertahankan backend CLI Codex yang dibundel.

  </Accordion>
</AccordionGroup>

## Perilaku penyedia milik Plugin

Sebagian besar logika khusus penyedia berada dalam Plugin penyedia (`registerProvider(...)`) sementara OpenClaw mempertahankan loop inferensi generik. Plugin memiliki onboarding, katalog model, pemetaan env-var auth, normalisasi transport/konfigurasi, pembersihan skema alat, klasifikasi failover, refresh OAuth, pelaporan penggunaan, profil berpikir/penalaran, dan banyak lagi.

Daftar lengkap hook SDK penyedia dan contoh Plugin yang dibundel ada di [Plugin penyedia](/id/plugins/sdk-provider-plugins). Penyedia yang membutuhkan eksekutor permintaan yang benar-benar kustom adalah permukaan ekstensi yang terpisah dan lebih dalam.

<Note>
Perilaku runner milik penyedia berada pada hook penyedia eksplisit seperti kebijakan replay, normalisasi skema alat, pembungkusan stream, dan pembantu transport/permintaan. Kantong statis legacy `ProviderPlugin.capabilities` hanya untuk kompatibilitas dan tidak lagi dibaca oleh logika runner bersama.
</Note>

## Rotasi kunci API

<AccordionGroup>
  <Accordion title="Sumber kunci dan prioritas">
    Konfigurasikan beberapa kunci melalui:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override live tunggal, prioritas tertinggi)
    - `<PROVIDER>_API_KEYS` (daftar dipisahkan koma atau titik koma)
    - `<PROVIDER>_API_KEY` (kunci utama)
    - `<PROVIDER>_API_KEY_*` (daftar bernomor, mis. `<PROVIDER>_API_KEY_1`)

    Untuk penyedia Google, `GOOGLE_API_KEY` juga disertakan sebagai fallback. Urutan pemilihan kunci mempertahankan prioritas dan mendeduplikasi nilai.

  </Accordion>
  <Accordion title="Kapan rotasi aktif">
    - Permintaan dicoba ulang dengan kunci berikutnya hanya pada respons batas laju (misalnya `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, atau pesan batas penggunaan berkala).
    - Kegagalan yang bukan batas laju langsung gagal; tidak ada rotasi kunci yang dicoba.
    - Ketika semua kunci kandidat gagal, error akhir dikembalikan dari percobaan terakhir.

  </Accordion>
</AccordionGroup>

## Plugin penyedia resmi

Plugin penyedia resmi menerbitkan baris katalog model mereka sendiri. Penyedia ini **tidak** memerlukan entri model `models.providers`; aktifkan Plugin penyedia, atur auth, dan pilih model. Gunakan `models.providers` hanya untuk penyedia kustom eksplisit atau pengaturan permintaan sempit seperti timeout.

### OpenAI

- Penyedia: `openai`
- Auth: `OPENAI_API_KEY`
- Rotasi opsional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (override tunggal)
- Contoh model: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifikasi ketersediaan akun/model dengan `openclaw models list --provider openai` jika instalasi atau kunci API tertentu berperilaku berbeda.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Transport default adalah `auto`; OpenClaw meneruskan pilihan transport ke runtime model bersama.
- Override per model melalui `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, atau `"auto"`)
- Pemrosesan prioritas OpenAI dapat diaktifkan melalui `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` dan `params.fastMode` memetakan permintaan Responses `openai/*` langsung ke `service_tier=priority` pada `api.openai.com`
- Gunakan `params.serviceTier` ketika Anda menginginkan tingkat eksplisit alih-alih toggle `/fast` bersama
- Header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`) hanya berlaku pada traffic OpenAI native ke `api.openai.com`, bukan proxy generik yang kompatibel dengan OpenAI
- Rute OpenAI native juga mempertahankan `store` Responses, petunjuk prompt-cache, dan pembentukan payload kompatibilitas penalaran OpenAI; rute proxy tidak
- `openai/gpt-5.3-codex-spark` tersedia melalui auth langganan OAuth ChatGPT/Codex ketika akun yang Anda gunakan mengeksposnya; OpenClaw masih menekan rute kunci API OpenAI langsung dan kunci API Azure untuk model ini karena transport tersebut menolaknya

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Penyedia: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotasi opsional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (override tunggal)
- Contoh model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Permintaan Anthropic publik langsung mendukung toggle `/fast` bersama dan `params.fastMode`, termasuk traffic kunci API dan yang diautentikasi OAuth yang dikirim ke `api.anthropic.com`; OpenClaw memetakannya ke `service_tier` Anthropic (`auto` vs `standard_only`)
- Konfigurasi Claude CLI pilihan mempertahankan referensi model kanonis dan memilih backend CLI
  secara terpisah: `anthropic/claude-opus-4-8` dengan
  `agentRuntime.id: "claude-cli"` bercakupan model. Referensi legacy
  `claude-cli/claude-opus-4-7` tetap berfungsi untuk kompatibilitas.

<Note>
Staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan lagi, sehingga OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru. Setup-token Anthropic tetap tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw kini lebih memilih penggunaan ulang Claude CLI dan `claude -p` ketika tersedia.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth OpenAI ChatGPT/Codex

- Penyedia: `openai`
- Auth: OAuth (ChatGPT)
- Referensi model OpenAI Codex legacy: `openai/gpt-5.5`
- Referensi harness app-server Codex native: `openai/gpt-5.5`
- Dokumen harness app-server Codex native: [Harness Codex](/id/plugins/codex-harness)
- Referensi model legacy: `codex/gpt-*`
- Batas Plugin: `openai/*` memuat Plugin OpenAI; Plugin app-server Codex native dipilih oleh runtime harness Codex.
- CLI: `openclaw onboard --auth-choice openai` atau `openclaw models auth login --provider openai`
- Transport default adalah `auto` (WebSocket terlebih dahulu, fallback SSE)
- Override per model OpenAI Codex melalui `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, atau `"auto"`)
- `params.serviceTier` juga diteruskan pada permintaan Responses Codex native (`chatgpt.com/backend-api`)
- Header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`) hanya dilampirkan pada traffic Codex native ke `chatgpt.com/backend-api`, bukan proxy generik yang kompatibel dengan OpenAI
- Berbagi toggle `/fast` dan konfigurasi `params.fastMode` yang sama seperti `openai/*` langsung; OpenClaw memetakannya ke `service_tier=priority`
- `openai/gpt-5.5` menggunakan `contextWindow = 400000` native katalog Codex dan runtime default `contextTokens = 272000`; override batas runtime dengan `models.providers.openai.models[].contextTokens`
- Catatan kebijakan: OAuth OpenAI Codex didukung secara eksplisit untuk alat/workflow eksternal seperti OpenClaw.
- Untuk rute umum langganan plus runtime Codex native, masuk dengan auth `openai` dan konfigurasikan `openai/gpt-5.5`; giliran agen OpenAI memilih Codex secara default.
- Gunakan provider/model `agentRuntime.id: "openclaw"` hanya ketika Anda menginginkan rute bawaan OpenClaw; jika tidak, pertahankan `openai/gpt-5.5` pada harness Codex default.
- referensi GPT Codex legacy adalah status legacy, bukan rute penyedia live. Gunakan `openai/gpt-5.5` pada runtime Codex native untuk konfigurasi agen baru, dan jalankan `openclaw doctor --fix` untuk memigrasikan referensi model Codex legacy lama ke referensi kanonis `openai/*`.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Opsi hosted bergaya langganan lainnya

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/id/providers/zai">
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
- Rotasi opsional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY`, dan `OPENCLAW_LIVE_GEMINI_KEY` (override tunggal)
- Contoh model: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilitas: konfigurasi OpenClaw lama yang menggunakan `google/gemini-3.1-flash-preview` dinormalisasi menjadi `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` diterima dan dinormalisasi menjadi id Gemini API live milik Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` menggunakan dynamic thinking Google. Gemini 3/3.1 menghilangkan `thinkingLevel` tetap; Gemini 2.5 mengirim `thinkingBudget: -1`.
- Jalankan Gemini langsung juga menerima `agents.defaults.models["google/<model>"].params.cachedContent` (atau `cached_content` lama) untuk meneruskan handle native penyedia `cachedContents/...`; hit cache Gemini muncul sebagai `cacheRead` OpenClaw

### Google Vertex dan Gemini CLI

- Penyedia: `google-vertex`, `google-gemini-cli`
- Autentikasi: Vertex menggunakan gcloud ADC; Gemini CLI menggunakan alur OAuth-nya

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
  <Step title="Aktifkan plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Masuk">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Model default: `google-gemini-cli/gemini-3-flash-preview`. Anda **tidak** menempelkan id atau rahasia klien ke dalam `openclaw.json`. Alur login CLI menyimpan token dalam profil autentikasi di host gateway.

  </Step>
  <Step title="Tetapkan proyek (jika diperlukan)">
    Jika permintaan gagal setelah login, tetapkan `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` pada host gateway.
  </Step>
</Steps>

Gemini CLI menggunakan `stream-json` secara default. OpenClaw membaca pesan stream asisten
dan menormalkan `stats.cached` menjadi `cacheRead`; override lama
`--output-format json` tetap membaca teks balasan dari `response`.

### Z.AI (GLM)

- Penyedia: `zai`
- Autentikasi: `ZAI_API_KEY`
- Contoh model: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Ref model menggunakan ID penyedia `zai/*` kanonis.
  - `zai-api-key` mendeteksi otomatis endpoint Z.AI yang cocok; `zai-coding-global`, `zai-coding-cn`, `zai-global`, dan `zai-cn` memaksa permukaan tertentu

### Vercel AI Gateway

- Penyedia: `vercel-ai-gateway`
- Autentikasi: `AI_GATEWAY_API_KEY`
- Contoh model: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Plugin penyedia bawaan lainnya

| Penyedia                                | Id                               | Env autentikasi                                      | Contoh model                                               |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` atau `HF_TOKEN`              | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/id/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OAuth OpenRouter atau `OPENROUTER_API_KEY`           | `openrouter/auto`                                          |
| [Qwen OAuth](/id/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | OAuth SuperGrok/X Premium atau `XAI_API_KEY`         | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Keunikan yang perlu diketahui

<AccordionGroup>
  <Accordion title="OpenRouter">
    Menerapkan header atribusi aplikasinya dan penanda `cache_control` Anthropic hanya pada rute `openrouter.ai` yang terverifikasi. Ref DeepSeek, Moonshot, dan ZAI memenuhi syarat cache-TTL untuk caching prompt yang dikelola OpenRouter tetapi tidak menerima penanda cache Anthropic. Sebagai jalur kompatibel OpenAI bergaya proxy, jalur ini melewati pembentukan khusus native-OpenAI saja (`serviceTier`, Responses `store`, petunjuk prompt-cache, kompatibilitas reasoning OpenAI). Ref yang didukung Gemini hanya mempertahankan sanitasi thought-signature proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Ref yang didukung Gemini mengikuti jalur sanitasi proxy-Gemini yang sama; `kilocode/kilo/auto` dan ref lain yang tidak mendukung reasoning proxy melewati injeksi reasoning proxy.
  </Accordion>
  <Accordion title="MiniMax">
    Onboarding kunci API menulis definisi model chat M3 dan M2.7 eksplisit; pemahaman gambar tetap berada pada penyedia media `MiniMax-VL-01` milik plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    Id model menggunakan namespace `nvidia/<vendor>/<model>` (misalnya `nvidia/nvidia/nemotron-...` bersama `nvidia/moonshotai/kimi-k2.5`); pemilih mempertahankan komposisi literal `<provider>/<model-id>` sementara kunci kanonis yang dikirim ke API tetap berawalan tunggal.
  </Accordion>
  <Accordion title="xAI">
    Menggunakan jalur Responses xAI. Jalur yang direkomendasikan adalah OAuth SuperGrok/X Premium; kunci API tetap berfungsi melalui `XAI_API_KEY` atau konfigurasi plugin, dan `web_search` Grok menggunakan kembali profil autentikasi yang sama sebelum fallback kunci API. `grok-4.3` adalah model chat default bawaan, dan `grok-build-0.1` dapat dipilih untuk pekerjaan yang berfokus pada build/coding. `/fast` atau `params.fastMode: true` menulis ulang `grok-3`, `grok-3-mini`, `grok-4`, dan `grok-4-0709` menjadi varian `*-fast` mereka. `tool_stream` default aktif; nonaktifkan melalui `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Penyedia melalui `models.providers` (URL kustom/dasar)

Gunakan `models.providers` (atau `models.json`) untuk menambahkan penyedia **kustom** atau proxy yang kompatibel dengan OpenAI/Anthropic.

Banyak Plugin penyedia bawaan di bawah ini sudah menerbitkan katalog default. Gunakan entri `models.providers.<id>` eksplisit hanya saat Anda ingin menimpa URL dasar, header, atau daftar model default.

Pemeriksaan kapabilitas model Gateway juga membaca metadata `models.providers.<id>.models[]` eksplisit. Jika model kustom atau proksi menerima gambar, tetapkan `input: ["text", "image"]` pada model tersebut agar jalur lampiran WebChat dan asal node meneruskan gambar sebagai input model native, bukan sebagai referensi media teks-saja.

`agents.defaults.models["provider/model"]` hanya mengontrol visibilitas model, alias, dan metadata per model untuk agen. Itu tidak mendaftarkan model runtime baru dengan sendirinya. Untuk model penyedia kustom, tambahkan juga `models.providers.<provider>.models[]` dengan setidaknya `id` yang cocok.

### Moonshot AI (Kimi)

Instal `@openclaw/moonshot-provider` sebelum onboarding. Tambahkan entri `models.providers.moonshot` eksplisit hanya saat Anda perlu menimpa URL dasar atau metadata model:

- Penyedia: `moonshot`
- Autentikasi: `MOONSHOT_API_KEY`
- Contoh model: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` atau `openclaw onboard --auth-choice moonshot-api-key-cn`

ID model Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
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

### Pengodean Kimi

Kimi Coding menggunakan endpoint Moonshot AI yang kompatibel dengan Anthropic:

- Penyedia: `kimi`
- Autentikasi: `KIMI_API_KEY`
- Contoh model: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

`kimi/kimi-code` dan `kimi/k2p5` lama tetap diterima sebagai ID model kompatibilitas dan dinormalisasi ke ID model API stabil Kimi.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) menyediakan akses ke Doubao dan model lain di Tiongkok.

- Penyedia: `volcengine` (pengodean: `volcengine-plan`)
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

Onboarding secara default menggunakan permukaan pengodean, tetapi katalog umum `volcengine/*` didaftarkan pada saat yang sama.

Di pemilih model onboarding/konfigurasi, pilihan autentikasi Volcengine memprioritaskan baris `volcengine/*` dan `volcengine-plan/*`. Jika model-model tersebut belum dimuat, OpenClaw beralih ke katalog tanpa filter alih-alih menampilkan pemilih kosong yang dibatasi penyedia.

<Tabs>
  <Tab title="Model standar">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Model pengodean (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (Internasional)

BytePlus ARK menyediakan akses ke model yang sama seperti Volcano Engine untuk pengguna internasional.

- Penyedia: `byteplus` (pengodean: `byteplus-plan`)
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

Onboarding secara default menggunakan permukaan pengodean, tetapi katalog umum `byteplus/*` didaftarkan pada saat yang sama.

Di pemilih model onboarding/konfigurasi, pilihan autentikasi BytePlus memprioritaskan baris `byteplus/*` dan `byteplus-plan/*`. Jika model-model tersebut belum dimuat, OpenClaw beralih ke katalog tanpa filter alih-alih menampilkan pemilih kosong yang dibatasi penyedia.

<Tabs>
  <Tab title="Model standar">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Model pengodean (byteplus-plan)">
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

MiniMax dikonfigurasi melalui `models.providers` karena menggunakan endpoint kustom:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Kunci API MiniMax (Global): `--auth-choice minimax-global-api`
- Kunci API MiniMax (CN): `--auth-choice minimax-cn-api`
- Autentikasi: `MINIMAX_API_KEY` untuk `minimax`; `MINIMAX_OAUTH_TOKEN` atau `MINIMAX_API_KEY` untuk `minimax-portal`

Lihat [/providers/minimax](/id/providers/minimax) untuk detail penyiapan, opsi model, dan cuplikan konfigurasi.

<Note>
Pada jalur streaming MiniMax yang kompatibel dengan Anthropic, OpenClaw menonaktifkan thinking secara default untuk keluarga M2.x kecuali Anda mengaturnya secara eksplisit; MiniMax-M3 (dan M3.x) tetap berada pada jalur thinking yang dihilangkan/adaptif milik penyedia secara default. `/fast on` menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
</Note>

Pembagian kapabilitas milik Plugin:

- Default teks/chat tetap menggunakan `minimax/MiniMax-M3`
- Pembuatan gambar adalah `minimax/image-01` atau `minimax-portal/image-01`
- Pemahaman gambar adalah `MiniMax-VL-01` milik Plugin pada kedua jalur autentikasi MiniMax
- Pencarian web tetap menggunakan id penyedia `minimax`

### LM Studio

LM Studio dikirim sebagai Plugin penyedia bawaan yang menggunakan API native:

- Penyedia: `lmstudio`
- Autentikasi: `LM_API_TOKEN`
- URL dasar inferensi default: `http://localhost:1234/v1`

Lalu atur model (ganti dengan salah satu ID yang dikembalikan oleh `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw menggunakan `/api/v1/models` dan `/api/v1/models/load` native milik LM Studio untuk penemuan + pemuatan otomatis, dengan `/v1/chat/completions` untuk inferensi secara default. Jika Anda ingin pemuatan JIT, TTL, dan pengeluaran otomatis LM Studio mengelola siklus hidup model, atur `models.providers.lmstudio.params.preload: false`. Lihat [/providers/lmstudio](/id/providers/lmstudio) untuk penyiapan dan pemecahan masalah.

### Ollama

Ollama dikirim sebagai Plugin penyedia bawaan dan menggunakan API native Ollama:

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

Ollama dideteksi secara lokal di `http://127.0.0.1:11434` saat Anda ikut serta dengan `OLLAMA_API_KEY`, dan Plugin penyedia bawaan menambahkan Ollama langsung ke `openclaw onboard` dan pemilih model. Lihat [/providers/ollama](/id/providers/ollama) untuk onboarding, mode cloud/lokal, dan konfigurasi kustom.

### vLLM

vLLM dikirim sebagai Plugin penyedia bawaan untuk server lokal/hosting sendiri yang kompatibel dengan OpenAI:

- Penyedia: `vllm`
- Autentikasi: Opsional (bergantung pada server Anda)
- URL dasar default: `http://127.0.0.1:8000/v1`

Untuk ikut serta dalam penemuan otomatis secara lokal (nilai apa pun berfungsi jika server Anda tidak memberlakukan autentikasi):

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

SGLang dikirim sebagai Plugin penyedia bawaan untuk server hosting sendiri yang cepat dan kompatibel dengan OpenAI:

- Penyedia: `sglang`
- Autentikasi: Opsional (bergantung pada server Anda)
- URL dasar default: `http://127.0.0.1:30000/v1`

Untuk ikut serta dalam penemuan otomatis secara lokal (nilai apa pun berfungsi jika server Anda tidak memberlakukan autentikasi):

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

### Proksi lokal (LM Studio, vLLM, LiteLLM, dll.)

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
  <Accordion title="Kolom opsional default">
    Untuk penyedia kustom, `reasoning`, `input`, `cost`, `contextWindow`, dan `maxTokens` bersifat opsional. Jika dihilangkan, OpenClaw secara default menggunakan:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Disarankan: atur nilai eksplisit yang sesuai dengan batas proksi/model Anda.

  </Accordion>
  <Accordion title="Aturan pembentukan rute proksi">
    - Untuk `api: "openai-completions"` pada endpoint non-native (`baseUrl` tidak kosong apa pun yang host-nya bukan `api.openai.com`), OpenClaw memaksa `compat.supportsDeveloperRole: false` untuk menghindari error 400 penyedia untuk peran `developer` yang tidak didukung.
    - Rute bergaya proksi yang kompatibel dengan OpenAI juga melewati pembentukan permintaan khusus OpenAI native: tanpa `service_tier`, tanpa Responses `store`, tanpa Completions `store`, tanpa petunjuk prompt-cache, tanpa pembentukan payload compat-reasoning OpenAI, dan tanpa header atribusi OpenClaw tersembunyi.
    - Untuk proksi Completions yang kompatibel dengan OpenAI yang memerlukan kolom khusus vendor, atur `agents.defaults.models["provider/model"].params.extra_body` (atau `extraBody`) untuk menggabungkan JSON tambahan ke dalam body permintaan keluar.
    - Untuk kontrol chat-template vLLM, atur `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Plugin vLLM bawaan secara otomatis mengirim `enable_thinking: false` dan `force_nonempty_content: true` untuk `vllm/nemotron-3-*` saat level thinking sesi nonaktif.
    - Untuk model lokal yang lambat atau host LAN/tailnet jarak jauh, atur `models.providers.<id>.timeoutSeconds`. Ini memperpanjang penanganan permintaan HTTP model penyedia, termasuk connect, header, streaming body, dan total abort guarded-fetch, tanpa meningkatkan timeout runtime agen secara keseluruhan. Jika `agents.defaults.timeoutSeconds` atau timeout khusus run lebih rendah, naikkan batas tersebut juga; timeout penyedia tidak dapat memperpanjang keseluruhan run.
    - Panggilan HTTP penyedia model mengizinkan jawaban DNS fake-IP Surge, Clash, dan sing-box di `198.18.0.0/15` dan `fc00::/7` hanya untuk hostname `baseUrl` penyedia yang dikonfigurasi. Endpoint penyedia kustom/lokal juga memercayai origin `scheme://host:port` yang dikonfigurasi persis tersebut untuk permintaan model yang dijaga, termasuk host loopback, LAN, dan tailnet. Ini bukan opsi konfigurasi baru; `baseUrl` yang Anda konfigurasi memperluas kebijakan permintaan hanya untuk origin tersebut. Izin hostname fake-IP dan kepercayaan origin persis adalah mekanisme independen. Destinasi privat, loopback, link-local, metadata lain, dan port berbeda tetap memerlukan opt-in eksplisit `models.providers.<id>.request.allowPrivateNetwork: true`. Atur `models.providers.<id>.request.allowPrivateNetwork: false` untuk keluar dari kepercayaan origin persis.
    - Jika `baseUrl` kosong/dihilangkan, OpenClaw mempertahankan perilaku default OpenAI (yang di-resolve ke `api.openai.com`).
    - Demi keamanan, `compat.supportsDeveloperRole: true` eksplisit tetap ditimpa pada endpoint `openai-completions` non-native.
    - Untuk `api: "anthropic-messages"` pada endpoint non-langsung (penyedia apa pun selain `anthropic` kanonis, atau `models.providers.anthropic.baseUrl` kustom yang host-nya bukan endpoint publik `api.anthropic.com`), OpenClaw menekan header beta Anthropic implisit seperti `claude-code-20250219`, `interleaved-thinking-2025-05-14`, dan penanda OAuth, sehingga proksi kustom yang kompatibel dengan Anthropic tidak menolak flag beta yang tidak didukung. Atur `models.providers.<id>.headers["anthropic-beta"]` secara eksplisit jika proksi Anda memerlukan fitur beta tertentu.

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

- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults) - kunci konfigurasi model
- [Failover model](/id/concepts/model-failover) - rantai fallback dan perilaku percobaan ulang
- [Model](/id/concepts/models) - konfigurasi model dan alias
- [Penyedia](/id/providers) - panduan penyiapan per penyedia
