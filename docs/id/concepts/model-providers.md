---
read_when:
    - Anda memerlukan referensi penyiapan model untuk setiap penyedia
    - Anda menginginkan contoh konfigurasi atau perintah orientasi CLI untuk penyedia model
sidebarTitle: Model providers
summary: Ikhtisar penyedia model dengan contoh konfigurasi + alur CLI
title: Penyedia model
x-i18n:
    generated_at: "2026-07-19T04:52:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4c0240811ced123bb58c862b08bb91110d211bc74074f7a48acb5bb87295838d
    source_path: concepts/model-providers.md
    workflow: 16
---

Referensi untuk **penyedia LLM/model** (bukan kanal obrolan seperti WhatsApp/Telegram). Untuk aturan pemilihan model, lihat [Model](/id/concepts/models).

## Aturan ringkas

<AccordionGroup>
  <Accordion title="Referensi model dan pembantu CLI">
    - Referensi model menggunakan `provider/model` (contoh: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` menyimpan alias dan pengaturan per model; `agents.defaults.modelPolicy.allow` adalah daftar izin penggantian eksplisit opsional.
    - Pembantu CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` menetapkan nilai default tingkat penyedia; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` menggantikannya per model.
    - Aturan fallback, probe masa jeda, dan persistensi penggantian sesi: [Failover model](/id/concepts/model-failover).

  </Accordion>
  <Accordion title="Menambahkan autentikasi penyedia tidak mengubah model utama Anda">
    `openclaw configure` mempertahankan `agents.defaults.model.primary` yang sudah ada saat Anda menambahkan atau mengautentikasi ulang penyedia. `openclaw models auth login` melakukan hal yang sama kecuali Anda meneruskan `--set-default`. Plugin penyedia masih dapat mengembalikan model default yang direkomendasikan dalam patch konfigurasi autentikasinya, tetapi OpenClaw memperlakukannya sebagai "sediakan model ini" ketika model utama sudah ada, bukan "ganti model utama saat ini."

    Untuk sengaja mengganti model default, gunakan `openclaw models set <provider/model>` atau `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Pemisahan penyedia/runtime OpenAI">
    Referensi model OpenAI dan runtime agen terpisah:

    - `openai/<model>` memilih penyedia dan model OpenAI kanonis. Prefiks saja tidak pernah memilih Codex.
    - Saat kebijakan runtime penyedia/model tidak ditetapkan atau bernilai `auto`, OpenAI dapat memilih Codex secara implisit hanya untuk rute HTTPS resmi Platform Responses atau ChatGPT Responses yang tepat tanpa penggantian permintaan yang ditentukan.
    - Adaptor Completions yang ditentukan, endpoint khusus, dan rute dengan perilaku permintaan yang ditentukan tetap menggunakan OpenClaw. Endpoint HTTP teks biasa resmi ditolak.
    - Referensi model Codex lama adalah konfigurasi lama yang ditulis ulang oleh doctor menjadi `openai/<model>`.
    - `agentRuntime.id: "openclaw"` penyedia/model secara eksplisit mempertahankan rute yang sebenarnya memenuhi syarat agar tetap menggunakan OpenClaw. `agentRuntime.id: "codex"` mewajibkan Codex dan gagal secara tertutup ketika rute efektif tidak kompatibel dengan Codex.

    Lihat [Runtime agen implisit OpenAI](/id/providers/openai#implicit-agent-runtime) dan [Harness Codex](/id/plugins/codex-harness). Jika pemisahan penyedia/runtime membingungkan, baca [Runtime agen](/id/concepts/agent-runtimes) terlebih dahulu.

    Pengaktifan otomatis Plugin mengikuti batas yang sama: rute efektif yang secara implisit kompatibel dengan Codex dapat mengaktifkan Plugin Codex, sedangkan `agentRuntime.id: "codex"` penyedia/model eksplisit atau referensi `codex/<model>` lama mewajibkannya. Prefiks `openai/*` saja tidak mewajibkannya.

    Penyiapan OpenAI baru menggunakan referensi GPT-5.6 khusus rute: penyiapan kunci API memilih
    `openai/gpt-5.6` (ID API langsung tanpa tambahan ditetapkan ke Sol), sedangkan
    OAuth ChatGPT/Codex memilih `openai/gpt-5.6-sol` secara tepat untuk katalog asli Codex.
    Model utama eksplisit yang sudah ada, termasuk `openai/gpt-5.5`, dipertahankan
    ketika autentikasi OpenAI ditambahkan atau diperbarui. GPT-5.5 tetap tersedia
    melalui kedua runtime sebagai pilihan pemulihan eksplisit untuk akun tanpa
    akses GPT-5.6.

  </Accordion>
  <Accordion title="Runtime CLI">
    Runtime CLI menggunakan pemisahan yang sama: pilih referensi model kanonis seperti `anthropic/claude-*` atau `google/gemini-*`, lalu tetapkan kebijakan runtime penyedia/model ke `claude-cli` atau `google-gemini-cli` saat Anda menginginkan backend CLI lokal.

    Referensi `claude-cli/*` dan `google-gemini-cli/*` lama dimigrasikan kembali ke referensi penyedia kanonis dengan runtime dicatat secara terpisah. Referensi `codex-cli/*` lama dimigrasikan ke `openai/*` dan menggunakan rute server aplikasi Codex; OpenClaw tidak lagi menyertakan backend CLI Codex bawaan.

  </Accordion>
</AccordionGroup>

## Mengonfigurasi penyedia di UI Kontrol

Buka **Settings → Model Providers** di UI Kontrol untuk menambahkan, mengganti, atau menghapus kunci API penyedia yang disimpan di `models.providers.<id>.apiKey`. Halaman tersebut menunjukkan apakah setiap kunci API berasal dari konfigurasi OpenClaw atau variabel lingkungan tanpa menampilkan kredensialnya. Kunci yang disediakan lingkungan tetap dikelola oleh lingkungan proses Gateway.

Gunakan **Test connection** untuk menjalankan probe penyedia langsung dan melihat latensi atau kesalahan autentikasi, batas laju, penagihan, batas waktu, atau respons yang telah dikategorikan. Probe membuat permintaan nyata kepada penyedia dan dapat menggunakan sejumlah kecil token. Profil OAuth dan token juga dapat dikeluarkan melalui kartu penyedia.

Kartu **Default models** mengelola model utama, fallback berurutan, dan model utilitas dari katalog model yang dikonfigurasi. Pilih model, lalu simpan semuanya bersama-sama ke pengaturan `agents.defaults.model` dan `agents.defaults.utilityModel` yang sudah ada. Untuk model utilitas, **Automatic** membiarkan pengaturan tidak ditetapkan dan **Disabled** menyimpan string kosong untuk menonaktifkan perutean utilitas.

## Perilaku penyedia milik Plugin

Sebagian besar logika khusus penyedia berada di Plugin penyedia (`registerProvider(...)`), sementara OpenClaw mempertahankan loop inferensi generik. Plugin menangani orientasi awal, katalog model, pemetaan variabel lingkungan autentikasi, normalisasi transportasi/konfigurasi, pembersihan skema alat, klasifikasi failover, penyegaran OAuth, pelaporan penggunaan, profil pemikiran/penalaran, dan lainnya.

Daftar lengkap hook SDK penyedia dan contoh Plugin bawaan tersedia di [Plugin penyedia](/id/plugins/sdk-provider-plugins). Penyedia yang memerlukan eksekutor permintaan yang sepenuhnya khusus merupakan permukaan ekstensi terpisah yang lebih mendalam.

<Note>
Perilaku runner milik penyedia berada pada hook penyedia eksplisit seperti kebijakan pemutaran ulang, normalisasi skema alat, pembungkusan stream, dan pembantu transportasi/permintaan. Kumpulan statis `ProviderPlugin.capabilities` lama hanya untuk kompatibilitas dan tidak lagi dibaca oleh logika runner bersama.
</Note>

## Rotasi kunci API

<AccordionGroup>
  <Accordion title="Sumber dan prioritas kunci">
    Konfigurasikan beberapa kunci melalui:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (satu penggantian langsung, prioritas tertinggi)
    - `<PROVIDER>_API_KEYS` (daftar yang dipisahkan koma atau titik koma)
    - `<PROVIDER>_API_KEY` (kunci utama)
    - `<PROVIDER>_API_KEY_*` (daftar bernomor, misalnya `<PROVIDER>_API_KEY_1`)

    Untuk penyedia Google, `GOOGLE_API_KEY` juga disertakan sebagai fallback. Urutan pemilihan kunci mempertahankan prioritas dan menghapus nilai duplikat.

  </Accordion>
  <Accordion title="Kapan rotasi dimulai">
    - Permintaan dicoba ulang dengan kunci berikutnya hanya pada respons batas laju (misalnya `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, atau pesan batas penggunaan berkala).
    - Kegagalan yang bukan akibat batas laju langsung mengalami kegagalan; rotasi kunci tidak dicoba.
    - Ketika semua kunci kandidat gagal, kesalahan akhir dari percobaan terakhir dikembalikan.

  </Accordion>
</AccordionGroup>

## Plugin penyedia resmi

Plugin penyedia resmi menerbitkan baris katalog modelnya sendiri. Penyedia ini **tidak** memerlukan entri model `models.providers`; aktifkan Plugin penyedia, tetapkan autentikasi, dan pilih model. Gunakan `models.providers` hanya untuk penyedia khusus eksplisit atau pengaturan permintaan terbatas seperti batas waktu.

### OpenAI

- Penyedia: `openai`
- Autentikasi: `OPENAI_API_KEY`
- Rotasi opsional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, ditambah `OPENCLAW_LIVE_OPENAI_KEY` (satu penggantian)
- Default penyiapan baru: `openai/gpt-5.6`; pada API langsung, ID tanpa tambahan ditetapkan ke Sol.
- Contoh model: `openai/gpt-5.6`, `openai/gpt-5.6-terra`, `openai/gpt-5.6-luna`, `openai/gpt-5.5`
- Verifikasi ketersediaan akun/model dengan `openclaw models list --provider openai` jika instalasi atau kunci API tertentu berperilaku berbeda.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Transportasi default adalah `auto`; OpenClaw meneruskan pilihan transportasi ke runtime model bersama.
- Ganti per model melalui `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, atau `"auto"`)
- Pemrosesan prioritas OpenAI dapat diaktifkan melalui `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` dan `params.fastMode` memetakan permintaan Responses `openai/*` langsung ke `service_tier=priority` pada `api.openai.com`
- Gunakan `params.serviceTier` saat Anda menginginkan tingkat eksplisit alih-alih pengalih bersama `/fast`
- Header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`) hanya berlaku pada lalu lintas asli OpenAI ke `api.openai.com`, bukan proksi generik yang kompatibel dengan OpenAI
- Rute asli OpenAI juga mempertahankan `store` Responses, petunjuk cache prompt, dan pembentukan payload kompatibilitas penalaran OpenAI; rute proksi tidak
- `openai/gpt-5.3-codex-spark` hanya tersedia melalui OAuth ChatGPT/Codex; rute kunci API OpenAI langsung dan kunci API Azure menolaknya

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
}
```

Jika organisasi API tidak menyediakan GPT-5.6, tetapkan
`openai/gpt-5.5` secara eksplisit. Orientasi awal dan autentikasi ulang normal mempertahankan
model utama eksplisit yang sudah ada; `models auth login --set-default` dan
`models set` adalah jalur penggantian yang disengaja.

### Anthropic

- Penyedia: `anthropic`
- Autentikasi: `ANTHROPIC_API_KEY`
- Rotasi opsional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, ditambah `OPENCLAW_LIVE_ANTHROPIC_KEY` (satu penggantian)
- Contoh model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Permintaan publik langsung Anthropic mendukung pengalih bersama `/fast` dan `params.fastMode`, termasuk lalu lintas yang diautentikasi dengan kunci API dan OAuth yang dikirim ke `api.anthropic.com`; OpenClaw memetakannya ke `service_tier` Anthropic (`auto` dibandingkan dengan `standard_only`)
- Konfigurasi Claude CLI yang diutamakan menjaga referensi model tetap kanonis dan memilih
  backend CLI secara terpisah: `anthropic/claude-opus-4-8` dengan
  `agentRuntime.id: "claude-cli"` bercakupan model. Referensi
  `claude-cli/claude-opus-4-7` lama masih berfungsi untuk kompatibilitas.

<Note>
Penggunaan ulang Claude CLI (`claude -p`) adalah jalur integrasi OpenClaw yang disetujui. Autentikasi token penyiapan Anthropic tetap didukung, tetapi OpenClaw mengutamakan penggunaan ulang Claude CLI jika tersedia.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth OpenAI ChatGPT/Codex

- Penyedia: `openai`
- Autentikasi: OAuth (ChatGPT)
- Referensi harness app-server Codex native baru: `openai/gpt-5.6-sol`
- Dokumentasi harness app-server Codex native: [Harness Codex](/id/plugins/codex-harness)
- Referensi model lama: `codex/gpt-*`, `openai-codex/gpt-*`
- Batas Plugin: `openai/*` memuat Plugin OpenAI; kebijakan runtime eksplisit atau rute efektif milik penyedia menentukan apakah Plugin app-server Codex native dipilih.
- CLI: `openclaw onboard --auth-choice openai` atau `openclaw models auth login --provider openai`
- Transport ChatGPT Responses tertanam OpenClaw secara default menggunakan `auto` (WebSocket terlebih dahulu, SSE sebagai fallback).
- `agents.defaults.models["openai/<model>"].params.transport`, `params.serviceTier`, dan `params.fastMode` adalah pengaturan permintaan tertanam yang ditentukan. Pengaturan tersebut mempertahankan pemilihan runtime implisit pada OpenClaw; Codex native memiliki transport app-server dan tingkat layanannya sendiri.
- Header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`) hanya disertakan pada lalu lintas Codex native ke `chatgpt.com/backend-api`, bukan pada proksi generik yang kompatibel dengan OpenAI
- Toggle `/fast` bersama tetap tersedia sebagai kontrol runtime; toggle ini berbeda dari parameter model yang ditentukan.
- Katalog Codex native dapat menampilkan referensi persis `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra`, dan `openai/gpt-5.6-luna` sesuai dengan akses akun. Katalog tersebut tidak menerapkan alias polos `gpt-5.6` milik API langsung pada sisi klien.
- `openai/gpt-5.5` menggunakan `contextWindow = 400000` native dari katalog Codex dan runtime default `contextTokens = 272000`; ganti batas runtime dengan `models.providers.openai.models[].contextTokens`
- Masuk dengan autentikasi `openai` dan gunakan `openai/gpt-5.6-sol` untuk penyiapan baru yang didukung langganan. Pilih `openai/gpt-5.5` secara eksplisit jika ruang kerja Codex tersebut tidak menyediakan GPT-5.6.
- Gunakan penyedia/model `agentRuntime.id: "openclaw"` untuk mempertahankan rute yang sebenarnya memenuhi syarat pada runtime bawaan. Jika runtime tidak ditetapkan atau menggunakan `auto`, hanya rute HTTPS Responses/ChatGPT resmi yang persis dan tanpa penggantian permintaan yang ditentukan yang dapat memilih Codex secara implisit.
- Referensi GPT Codex lama adalah status lama, bukan rute penyedia aktif. Gunakan referensi kanonis `openai/*` untuk konfigurasi agen baru, dan jalankan `openclaw doctor --fix` untuk memigrasikan referensi `codex/*` dan `openai-codex/*` sekaligus mempertahankan semantik Codex native-nya dengan `agentRuntime.id: "codex"` yang tercakup pada model. Pilihan kanonis eksplisit `openai/gpt-5.5` yang sudah ada tidak ditingkatkan.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
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

### Opsi terhost lain bergaya langganan

<CardGroup cols={3}>
  <Card title="MiniMax" href="/id/providers/minimax">
    Akses OAuth MiniMax Coding Plan atau kunci API.
  </Card>
  <Card title="Qwen Cloud" href="/id/providers/qwen">
    Permukaan penyedia Qwen Cloud beserta pemetaan titik akhir Alibaba DashScope dan Coding Plan.
  </Card>
  <Card title="Z.AI (GLM)" href="/id/providers/zai">
    Coding Plan Z.AI atau titik akhir API umum.
  </Card>
</CardGroup>

### OpenCode

- Autentikasi: `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`)
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
- Rotasi opsional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY`, dan `OPENCLAW_LIVE_GEMINI_KEY` (penggantian tunggal)
- Contoh model: `google/gemini-3.1-pro-preview`, `google/gemini-3.5-flash`
- Kompatibilitas: konfigurasi OpenClaw lama yang menggunakan `google/gemini-3.1-flash-preview` dinormalisasi menjadi `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` diterima dan dinormalisasi menjadi ID API Gemini aktif milik Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Pemikiran: `/think adaptive` menggunakan pemikiran dinamis Google. Gemini 3/3.1 tidak menyertakan `thinkingLevel` tetap; Gemini 2.5 mengirim `thinkingBudget: -1`.
- Proses Gemini langsung juga menerima `agents.defaults.models["google/<model>"].params.cachedContent` (atau `cached_content` lama) untuk meneruskan handle `cachedContents/...` native penyedia; cache hit Gemini ditampilkan sebagai `cacheRead` OpenClaw

### Google Vertex dan Gemini CLI

- Penyedia: `google-vertex`, `google-gemini-cli`
- Autentikasi: Vertex menggunakan gcloud ADC; Gemini CLI menggunakan alur OAuth-nya

<Warning>
OAuth Gemini CLI di OpenClaw merupakan integrasi tidak resmi. Sejumlah pengguna melaporkan pembatasan akun Google setelah menggunakan klien pihak ketiga. Tinjau ketentuan Google dan gunakan akun nonkritis jika Anda memilih untuk melanjutkan.
</Warning>

OAuth Gemini CLI disertakan sebagai bagian dari Plugin `google` yang dibundel.

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

    Model default: `google-gemini-cli/gemini-3-flash-preview`. Anda **tidak** menempelkan ID klien atau rahasia ke dalam `openclaw.json`. Alur masuk CLI menyimpan token dalam profil autentikasi pada host Gateway.

  </Step>
  <Step title="Tetapkan proyek (jika diperlukan)">
    Jika permintaan gagal setelah masuk, tetapkan `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` pada host Gateway.
  </Step>
</Steps>

Gemini CLI menggunakan `stream-json` secara default. OpenClaw membaca pesan
stream asisten dan menormalisasi `stats.cached` menjadi `cacheRead`; penggantian
`--output-format json` lama tetap membaca teks balasan dari `response`.

### Z.AI (GLM)

- Penyedia: `zai`
- Autentikasi: `ZAI_API_KEY`
- Contoh model: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Referensi model menggunakan ID penyedia kanonis `zai/*`.
  - `zai-api-key` mendeteksi otomatis titik akhir Z.AI yang sesuai; `zai-coding-global`, `zai-coding-cn`, `zai-global`, dan `zai-cn` memaksakan permukaan tertentu

### Vercel AI Gateway

- Penyedia: `vercel-ai-gateway`
- Autentikasi: `AI_GATEWAY_API_KEY`
- Contoh model: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Plugin penyedia lain yang dibundel

| Penyedia                               | ID                               | Env autentikasi                                       | Contoh model                                           |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| Arcee                                   | `arcee`                          | `ARCEEAI_API_KEY` atau `OPENROUTER_API_KEY`            | `arcee/trinity-large-thinking`                         |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                        |
| Cerebras                                | `cerebras`                       | `CEREBRAS_API_KEY`                                   | `cerebras/zai-glm-4.7`                                 |
| Chutes                                  | `chutes`                         | `CHUTES_API_KEY` atau `CHUTES_OAUTH_TOKEN`             | `chutes/zai-org/GLM-5-TEE`                             |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`               |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-plus-05-2026`                        |
| DeepInfra                               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                  | `deepinfra/deepseek-ai/DeepSeek-V4-Flash`              |
| DeepSeek                                | `deepseek`                       | `DEEPSEEK_API_KEY`                                   | `deepseek/deepseek-v4-flash`                           |
| Featherless AI                          | `featherless`                    | `FEATHERLESS_API_KEY`                                | `featherless/Qwen/Qwen3-32B`                           |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                      |
| GMI Cloud                               | `gmi`                            | `GMI_API_KEY`                                        | `gmi/google/gemini-3.1-flash-lite`                     |
| Groq                                    | `groq`                           | `GROQ_API_KEY`                                       | `groq/llama-3.3-70b-versatile`                         |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` atau `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                  |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                   |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                         |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                   |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`             |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                     |
| [Ollama Cloud](/id/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                               |
| OpenRouter                              | `openrouter`                     | OAuth OpenRouter atau `OPENROUTER_API_KEY`             | `openrouter/auto`                                      |
| Qianfan                                 | `qianfan`                        | `QIANFAN_API_KEY`                                    | `qianfan/deepseek-v3.2`                                |
| Tencent TokenHub                        | `tencent-tokenhub`               | `TOKENHUB_API_KEY`                                   | `tencent-tokenhub/hy3-preview`                         |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`     |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                      |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`          |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                      |
| xAI                                     | `xai`                            | OAuth SuperGrok/X Premium atau `XAI_API_KEY`           | `xai/grok-4.3`                                         |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2.5` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Keunikan yang perlu diketahui

<AccordionGroup>
  <Accordion title="OpenRouter">
    Menerapkan header atribusi aplikasinya dan penanda Anthropic `cache_control` hanya pada rute `openrouter.ai` yang terverifikasi. Referensi DeepSeek, Moonshot, dan ZAI memenuhi syarat TTL cache untuk caching prompt yang dikelola OpenRouter, tetapi tidak menerima penanda cache Anthropic. Sebagai jalur kompatibel OpenAI bergaya proksi, jalur ini melewati pembentukan khusus OpenAI native (`serviceTier`, Responses `store`, petunjuk cache prompt, kompatibilitas penalaran OpenAI). Referensi berbasis Gemini hanya mempertahankan sanitasi tanda tangan pemikiran proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Referensi berbasis Gemini mengikuti jalur sanitasi proxy-Gemini yang sama; `kilocode/kilo-auto/balanced` dan referensi lain yang tidak mendukung penalaran proksi melewati injeksi penalaran proksi.
  </Accordion>
  <Accordion title="MiniMax">
    Orientasi kunci API menulis definisi model percakapan M3 dan M2.7 secara eksplisit; pemahaman gambar tetap menggunakan penyedia media `MiniMax-VL-01` milik plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    ID model menggunakan namespace `nvidia/<vendor>/<model>` (misalnya `nvidia/nvidia/nemotron-...`); pemilih mempertahankan komposisi literal `<provider>/<model-id>`, sedangkan kunci kanonis yang dikirim ke API tetap memiliki satu prefiks.
  </Accordion>
  <Accordion title="xAI">
    Menggunakan jalur Responses xAI. Jalur yang direkomendasikan adalah OAuth SuperGrok/X Premium; kunci API tetap berfungsi melalui `XAI_API_KEY` atau konfigurasi plugin, dan Grok `web_search` menggunakan kembali profil autentikasi yang sama sebelum beralih ke kunci API sebagai fallback. Grok 4.5 dapat dipilih untuk percakapan, pemrograman, dan pekerjaan agentik jika tersedia; `grok-4.3` tetap menjadi default bawaan yang aman secara regional. Konfigurasi `/fast` dan `params.fastMode: true` yang lebih lama tetap diselesaikan melalui pengalihan kompatibilitas Grok 4.3 milik xAI, tetapi konfigurasi baru harus langsung memilih model saat ini. `tool_stream` aktif secara default; nonaktifkan melalui `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Penyedia melalui `models.providers` (URL kustom/dasar)

Gunakan `models.providers` (atau `models.json`) untuk menambahkan penyedia **kustom** atau proksi yang kompatibel dengan OpenAI/Anthropic.

Banyak plugin penyedia bawaan di bawah ini sudah menerbitkan katalog default. Gunakan entri `models.providers.<id>` eksplisit hanya jika Anda ingin mengganti URL dasar, header, atau daftar model default.

Pemeriksaan kemampuan model Gateway juga membaca metadata `models.providers.<id>.models[]` eksplisit. Jika model kustom atau proksi menerima gambar, tetapkan `input: ["text", "image"]` pada model tersebut agar jalur lampiran yang berasal dari WebChat dan node meneruskan gambar sebagai input model native, bukan sebagai referensi media khusus teks.

`agents.defaults.models["provider/model"]` mengontrol alias dan metadata per model untuk agen. Ini tidak membatasi penggantian maupun mendaftarkan model runtime baru dengan sendirinya. Untuk model penyedia kustom, tambahkan juga `models.providers.<provider>.models[]` dengan setidaknya `id` yang cocok; gunakan `agents.defaults.modelPolicy.allow` secara terpisah jika Anda ingin membatasi penggantian.

### Moonshot AI (Kimi)

Instal `@openclaw/moonshot-provider` sebelum orientasi. Tambahkan entri `models.providers.moonshot` eksplisit hanya jika Anda perlu mengganti URL dasar atau metadata model:

- Penyedia: `moonshot`
- Autentikasi: `MOONSHOT_API_KEY`
- Contoh model: `moonshot/kimi-k3`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` atau `openclaw onboard --auth-choice moonshot-api-key-cn`

ID model Kimi:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k3`
- `moonshot/kimi-k2.7-code`
- `moonshot/kimi-k2.7-code-highspeed`
- `moonshot/kimi-k2.5`

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

Lihat [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot) untuk panduan penyiapan lengkap.

### Kimi Coding

Kimi Coding menggunakan endpoint kompatibel Anthropic milik Moonshot AI:

- Penyedia: `kimi`
- Autentikasi: `KIMI_API_KEY`
- Kimi K3: `kimi/k3` (256K) atau `kimi/k3[1m]` (paket 1M)
- Kimi Code: `kimi/kimi-for-coding`
- Kimi Code HighSpeed: `kimi/kimi-for-coding-highspeed`

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

Volcano Engine (火山引擎) menyediakan akses ke Doubao dan model lainnya di Tiongkok.

- Penyedia: `volcengine` (pemrograman: `volcengine-plan`)
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

Orientasi secara default menggunakan permukaan pemrograman, tetapi katalog umum `volcengine/*` didaftarkan pada saat yang sama.

Dalam pemilih model orientasi/konfigurasi, pilihan autentikasi Volcengine mengutamakan baris `volcengine/*` dan `volcengine-plan/*`. Jika model tersebut belum dimuat, OpenClaw beralih ke katalog tanpa filter sebagai fallback alih-alih menampilkan pemilih dengan cakupan penyedia yang kosong.

<Tabs>
  <Tab title="Model standar">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2)

  </Tab>
  <Tab title="Model pemrograman (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`

  </Tab>
</Tabs>

### BytePlus (Internasional)

BytePlus ARK menyediakan akses ke model yang sama dengan Volcano Engine untuk pengguna internasional.

- Penyedia: `byteplus` (pemrograman: `byteplus-plan`)
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

Dalam pemilih model onboarding/konfigurasi, pilihan autentikasi BytePlus memprioritaskan baris `byteplus/*` dan `byteplus-plan/*`. Jika model tersebut belum dimuat, OpenClaw kembali ke katalog tanpa filter alih-alih menampilkan pemilih dengan cakupan penyedia yang kosong.

<Tabs>
  <Tab title="Model standar">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Model pengodean (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic menyediakan model yang kompatibel dengan Anthropic melalui penyedia `synthetic`:

- Penyedia: `synthetic`
- Autentikasi: `SYNTHETIC_API_KEY`
- Contoh model: `synthetic/hf:MiniMaxAI/MiniMax-M3`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M3", name: "MiniMax M3" }],
      },
    },
  },
}
```

### MiniMax

MiniMax dikonfigurasi melalui `models.providers` karena menggunakan endpoint khusus:

- OAuth MiniMax (Global): `--auth-choice minimax-global-oauth`
- OAuth MiniMax (Tiongkok): `--auth-choice minimax-cn-oauth`
- Kunci API MiniMax (Global): `--auth-choice minimax-global-api`
- Kunci API MiniMax (Tiongkok): `--auth-choice minimax-cn-api`
- Autentikasi: `MINIMAX_API_KEY` untuk `minimax`; `MINIMAX_OAUTH_TOKEN` atau `MINIMAX_API_KEY` untuk `minimax-portal`

Lihat [/providers/minimax](/id/providers/minimax) untuk detail penyiapan, opsi model, dan cuplikan konfigurasi.

<Note>
Pada jalur streaming MiniMax yang kompatibel dengan Anthropic, OpenClaw menonaktifkan penalaran secara default untuk keluarga M2.x kecuali Anda menetapkannya secara eksplisit; MiniMax-M3 (dan M3.x) secara default tetap menggunakan jalur penalaran adaptif/tidak disertakan milik penyedia. `/fast on` menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
</Note>

Pembagian kemampuan milik Plugin:

- Default teks/percakapan tetap menggunakan `minimax/MiniMax-M3`
- Pembuatan gambar menggunakan `minimax/image-01` atau `minimax-portal/image-01`
- Pemahaman gambar menggunakan `MiniMax-VL-01` milik Plugin pada kedua jalur autentikasi MiniMax
- Pencarian web tetap menggunakan ID penyedia `minimax`

### LM Studio

LM Studio disertakan sebagai Plugin penyedia bawaan yang menggunakan API native:

- Penyedia: `lmstudio`
- Autentikasi: `LM_API_TOKEN`
- URL dasar inferensi default: `http://localhost:1234/v1`

Kemudian tetapkan model (ganti dengan salah satu ID yang dikembalikan oleh `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw menggunakan `/api/v1/models` dan `/api/v1/models/load` native milik LM Studio untuk penemuan + pemuatan otomatis, dengan `/v1/chat/completions` untuk inferensi secara default. Jika Anda ingin pemuatan JIT, TTL, dan pengeluaran otomatis LM Studio mengelola siklus hidup model, tetapkan `models.providers.lmstudio.params.preload: false`. Lihat [/providers/lmstudio](/id/providers/lmstudio) untuk penyiapan dan pemecahan masalah.

### Ollama

Ollama disertakan sebagai Plugin penyedia bawaan dan menggunakan API native Ollama:

- Penyedia: `ollama`
- Autentikasi: Tidak diperlukan (server lokal)
- Contoh model: `ollama/llama3.3`
- Instalasi: [https://ollama.com/download](https://ollama.com/download)

```bash
# Instal Ollama, lalu tarik sebuah model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama dideteksi secara lokal di `http://127.0.0.1:11434` saat Anda ikut serta dengan `OLLAMA_API_KEY`, dan Plugin penyedia bawaan menambahkan Ollama langsung ke `openclaw onboard` serta pemilih model. Lihat [/providers/ollama](/id/providers/ollama) untuk onboarding, mode cloud/lokal, dan konfigurasi khusus.

### vLLM

vLLM disertakan sebagai Plugin penyedia bawaan untuk server lokal/dihosting sendiri yang kompatibel dengan OpenAI:

- Penyedia: `vllm`
- Autentikasi: Opsional (bergantung pada server Anda)
- URL dasar default: `http://127.0.0.1:8000/v1`

Untuk ikut serta dalam penemuan otomatis secara lokal (nilai apa pun dapat digunakan jika server Anda tidak mewajibkan autentikasi):

```bash
export VLLM_API_KEY="vllm-local"
```

Kemudian tetapkan model (ganti dengan salah satu ID yang dikembalikan oleh `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Lihat [/providers/vllm](/id/providers/vllm) untuk detail.

### SGLang

SGLang disertakan sebagai Plugin penyedia bawaan untuk server cepat yang dihosting sendiri dan kompatibel dengan OpenAI:

- Penyedia: `sglang`
- Autentikasi: Opsional (bergantung pada server Anda)
- URL dasar default: `http://127.0.0.1:30000/v1`

Untuk ikut serta dalam penemuan otomatis secara lokal (nilai apa pun dapat digunakan jika server Anda tidak mewajibkan autentikasi):

```bash
export SGLANG_API_KEY="sglang-local"
```

Kemudian tetapkan model (ganti dengan salah satu ID yang dikembalikan oleh `/v1/models`):

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
    Untuk penyedia khusus, `reasoning`, `input`, `cost`, `contextWindow`, dan `maxTokens` bersifat opsional. Jika tidak disertakan, OpenClaw menggunakan default:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Disarankan: tetapkan nilai eksplisit yang sesuai dengan batas proksi/model Anda.

  </Accordion>
  <Accordion title="Aturan pembentukan rute proksi">
    - Untuk `api: "openai-completions"` pada endpoint non-native (setiap `baseUrl` tidak kosong yang host-nya bukan `api.openai.com`), OpenClaw memaksa `compat.supportsDeveloperRole: false` untuk menghindari galat 400 dari penyedia akibat peran `developer` yang tidak didukung.
    - Rute bergaya proksi yang kompatibel dengan OpenAI juga melewati pembentukan permintaan khusus OpenAI native: tanpa `service_tier`, tanpa `store` Responses, tanpa `store` Completions, tanpa petunjuk cache prompt, tanpa pembentukan payload kompatibilitas penalaran OpenAI, dan tanpa header atribusi OpenClaw tersembunyi.
    - Untuk proksi Completions yang kompatibel dengan OpenAI dan memerlukan kolom khusus vendor, tetapkan `agents.defaults.models["provider/model"].params.extra_body` (atau `extraBody`) untuk menggabungkan JSON tambahan ke dalam isi permintaan keluar.
    - Untuk kontrol templat percakapan vLLM, tetapkan `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Plugin vLLM bawaan secara otomatis mengirim `enable_thinking: false` dan `force_nonempty_content: true` untuk `vllm/nemotron-3-*` saat tingkat penalaran sesi dinonaktifkan.
    - Untuk model lokal yang lambat atau host LAN/tailnet jarak jauh, tetapkan `models.providers.<id>.timeoutSeconds`. Ini memperpanjang penanganan permintaan HTTP model penyedia, termasuk koneksi, header, streaming isi, dan pembatalan guarded-fetch total, tanpa meningkatkan batas waktu seluruh runtime agen. Jika `agents.defaults.timeoutSeconds` atau batas waktu khusus proses lebih rendah, naikkan batas tersebut juga; batas waktu penyedia tidak dapat memperpanjang keseluruhan proses.
    - Panggilan HTTP penyedia model mengizinkan jawaban DNS IP palsu dari Surge, Clash, dan sing-box dalam `198.18.0.0/15` dan `fc00::/7` hanya untuk nama host `baseUrl` penyedia yang dikonfigurasi. Endpoint penyedia khusus/lokal juga memercayai origin `scheme://host:port` yang dikonfigurasi secara tepat tersebut untuk permintaan model yang dilindungi, termasuk host loopback, LAN, dan tailnet. Ini bukan opsi konfigurasi baru; `baseUrl` yang Anda konfigurasikan memperluas kebijakan permintaan hanya untuk origin tersebut. Izin nama host IP palsu dan kepercayaan origin yang tepat merupakan mekanisme independen. Tujuan privat, loopback, link-local, metadata lainnya, dan port yang berbeda tetap memerlukan keikutsertaan `models.providers.<id>.request.allowPrivateNetwork: true` secara eksplisit. Tetapkan `models.providers.<id>.request.allowPrivateNetwork: false` untuk tidak menggunakan kepercayaan origin yang tepat.
    - Jika `baseUrl` kosong/tidak disertakan, OpenClaw mempertahankan perilaku default OpenAI (yang menghasilkan `api.openai.com`).
    - Demi keamanan, `compat.supportsDeveloperRole: true` yang ditetapkan secara eksplisit tetap ditimpa pada endpoint `openai-completions` non-native.
    - Untuk `api: "anthropic-messages"` pada endpoint tidak langsung (penyedia apa pun selain `anthropic` kanonis, atau `models.providers.anthropic.baseUrl` khusus yang host-nya bukan endpoint `api.anthropic.com` publik), OpenClaw meniadakan header beta Anthropic implisit seperti `claude-code-20250219`, `interleaved-thinking-2025-05-14`, dan penanda OAuth, sehingga proksi khusus yang kompatibel dengan Anthropic tidak menolak flag beta yang tidak didukung. Tetapkan `models.providers.<id>.headers["anthropic-beta"]` secara eksplisit jika proksi Anda memerlukan fitur beta tertentu.

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
- [Model](/id/concepts/models) - konfigurasi dan alias model
- [Penyedia](/id/providers) - panduan penyiapan per penyedia
