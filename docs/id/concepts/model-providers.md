---
read_when:
    - Anda memerlukan referensi penyiapan model per penyedia
    - Anda menginginkan contoh konfigurasi atau perintah onboarding CLI untuk penyedia model
summary: Gambaran umum penyedia model dengan contoh konfigurasi + alur CLI
title: Penyedia Model
x-i18n:
    generated_at: "2026-04-05T13:53:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d8f56a2a5319de03f7b86e7b19b9a89e7023f757930b5b5949568f680352a3a
    source_path: concepts/model-providers.md
    workflow: 15
---

# Penyedia model

Halaman ini membahas **penyedia LLM/model** (bukan channel chat seperti WhatsApp/Telegram).
Untuk aturan pemilihan model, lihat [/concepts/models](/concepts/models).

## Aturan cepat

- Referensi model menggunakan `provider/model` (contoh: `opencode/claude-opus-4-6`).
- Jika Anda menetapkan `agents.defaults.models`, itu menjadi allowlist.
- Helper CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Aturan runtime fallback, probe cooldown, dan persistensi session-override
  didokumentasikan di [/concepts/model-failover](/concepts/model-failover).
- `models.providers.*.models[].contextWindow` adalah metadata model native;
  `models.providers.*.models[].contextTokens` adalah batas runtime efektif.
- Plugin penyedia dapat menyuntikkan katalog model melalui `registerProvider({ catalog })`;
  OpenClaw menggabungkan output tersebut ke dalam `models.providers` sebelum menulis
  `models.json`.
- Manifest penyedia dapat mendeklarasikan `providerAuthEnvVars` sehingga probe
  auth berbasis env generik tidak perlu memuat runtime plugin. Peta env-var inti yang tersisa
  sekarang hanya untuk penyedia non-plugin/core dan beberapa kasus prioritas generik
  seperti onboarding Anthropic yang mengutamakan API key.
- Plugin penyedia juga dapat memiliki perilaku runtime penyedia melalui
  `normalizeModelId`, `normalizeTransport`, `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`,
  `normalizeResolvedModel`, `contributeResolvedModelCompat`,
  `capabilities`, `normalizeToolSchemas`,
  `inspectToolSchemas`, `resolveReasoningOutputMode`,
  `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`,
  `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`,
  `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`,
  `matchesContextOverflowError`, `classifyFailoverReason`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, dan
  `onModelSelected`.
- Catatan: runtime `capabilities` penyedia adalah metadata runner bersama (keluarga
  penyedia, keanehan transkrip/tooling, petunjuk transport/cache). Ini tidak sama
  dengan [model capability publik](/plugins/architecture#public-capability-model)
  yang menjelaskan apa yang didaftarkan plugin (inferensi teks, speech, dll.).

## Perilaku penyedia yang dimiliki plugin

Plugin penyedia kini dapat memiliki sebagian besar logika spesifik penyedia sementara OpenClaw
mempertahankan loop inferensi generik.

Pemisahan tipikal:

- `auth[].run` / `auth[].runNonInteractive`: penyedia memiliki alur onboarding/login
  untuk `openclaw onboard`, `openclaw models auth`, dan penyiapan headless
- `wizard.setup` / `wizard.modelPicker`: penyedia memiliki label pilihan auth,
  alias lama, petunjuk allowlist onboarding, dan entri penyiapan di picker onboarding/model
- `catalog`: penyedia muncul di `models.providers`
- `normalizeModelId`: penyedia menormalkan ID model lama/preview sebelum
  lookup atau kanonisasi
- `normalizeTransport`: penyedia menormalkan `api` / `baseUrl` keluarga transport
  sebelum perakitan model generik; OpenClaw memeriksa penyedia yang cocok terlebih dahulu,
  lalu plugin penyedia lain yang mampu menjalankan hook sampai salah satunya benar-benar mengubah
  transport
- `normalizeConfig`: penyedia menormalkan konfigurasi `models.providers.<id>` sebelum
  runtime menggunakannya; OpenClaw memeriksa penyedia yang cocok terlebih dahulu, lalu plugin
  penyedia lain yang mampu menjalankan hook sampai salah satunya benar-benar mengubah konfigurasi. Jika tidak ada
  hook penyedia yang menulis ulang konfigurasi, helper keluarga Google bawaan tetap
  menormalkan entri penyedia Google yang didukung.
- `applyNativeStreamingUsageCompat`: penyedia menerapkan penulisan ulang kompatibilitas penggunaan streaming native berbasis endpoint untuk penyedia konfigurasi
- `resolveConfigApiKey`: penyedia me-resolve auth penanda env untuk penyedia konfigurasi
  tanpa memaksa pemuatan auth runtime penuh. `amazon-bedrock` juga memiliki
  resolver penanda env AWS bawaan di sini, meskipun auth runtime Bedrock menggunakan
  rantai default AWS SDK.
- `resolveSyntheticAuth`: penyedia dapat mengekspos ketersediaan auth lokal/self-hosted atau
  auth berbasis konfigurasi lainnya tanpa menyimpan secret plaintext
- `shouldDeferSyntheticProfileAuth`: penyedia dapat menandai placeholder profil sintetik yang disimpan
  sebagai prioritas lebih rendah daripada auth berbasis env/konfigurasi
- `resolveDynamicModel`: penyedia menerima ID model yang belum ada di katalog statis
  lokal
- `prepareDynamicModel`: penyedia memerlukan penyegaran metadata sebelum mencoba lagi
  resolusi dinamis
- `normalizeResolvedModel`: penyedia memerlukan penulisan ulang transport atau base URL
- `contributeResolvedModelCompat`: penyedia menyumbangkan flag kompatibilitas untuk
  model vendor miliknya bahkan saat model tersebut datang melalui transport kompatibel lain
- `capabilities`: penyedia menerbitkan keanehan transkrip/tooling/keluarga penyedia
- `normalizeToolSchemas`: penyedia membersihkan skema tool sebelum runner
  tertanam melihatnya
- `inspectToolSchemas`: penyedia menampilkan peringatan skema spesifik transport
  setelah normalisasi
- `resolveReasoningOutputMode`: penyedia memilih kontrak output reasoning native vs tagged
- `prepareExtraParams`: penyedia menetapkan default atau menormalkan parameter permintaan per model
- `createStreamFn`: penyedia menggantikan jalur stream normal dengan transport
  kustom sepenuhnya
- `wrapStreamFn`: penyedia menerapkan wrapper kompatibilitas header/body/model permintaan
- `resolveTransportTurnState`: penyedia menyediakan header atau metadata transport native
  per giliran
- `resolveWebSocketSessionPolicy`: penyedia menyediakan header sesi WebSocket native
  atau kebijakan cooldown sesi
- `createEmbeddingProvider`: penyedia memiliki perilaku embedding memori ketika
  itu lebih tepat berada di plugin penyedia daripada switchboard embedding inti
- `formatApiKey`: penyedia memformat profil auth yang disimpan ke string
  `apiKey` runtime yang diharapkan transport
- `refreshOAuth`: penyedia memiliki refresh OAuth ketika refresher bersama `pi-ai`
  tidak memadai
- `buildAuthDoctorHint`: penyedia menambahkan panduan perbaikan saat refresh OAuth
  gagal
- `matchesContextOverflowError`: penyedia mengenali error overflow context-window
  spesifik penyedia yang terlewat oleh heuristik generik
- `classifyFailoverReason`: penyedia memetakan error mentah transport/API spesifik penyedia
  ke alasan failover seperti rate limit atau overload
- `isCacheTtlEligible`: penyedia menentukan ID model upstream mana yang mendukung TTL prompt-cache
- `buildMissingAuthMessage`: penyedia mengganti error auth-store generik
  dengan petunjuk pemulihan spesifik penyedia
- `suppressBuiltInModel`: penyedia menyembunyikan baris upstream yang usang dan dapat mengembalikan
  error milik vendor untuk kegagalan resolusi langsung
- `augmentModelCatalog`: penyedia menambahkan baris katalog sintetik/final setelah
  discovery dan penggabungan konfigurasi
- `isBinaryThinking`: penyedia memiliki UX thinking biner nyala/mati
- `supportsXHighThinking`: penyedia mengikutsertakan model terpilih ke `xhigh`
- `resolveDefaultThinkingLevel`: penyedia memiliki kebijakan default `/think` untuk
  keluarga model
- `applyConfigDefaults`: penyedia menerapkan default global spesifik penyedia
  selama materialisasi konfigurasi berdasarkan mode auth, env, atau keluarga model
- `isModernModelRef`: penyedia memiliki pencocokan model pilihan live/smoke
- `prepareRuntimeAuth`: penyedia mengubah kredensial yang dikonfigurasi menjadi token runtime
  berumur pendek
- `resolveUsageAuth`: penyedia me-resolve kredensial usage/kuota untuk `/usage`
  dan permukaan status/pelaporan terkait
- `fetchUsageSnapshot`: penyedia memiliki pengambilan/parsing endpoint usage sementara
  inti tetap memiliki shell ringkasan dan pemformatannya
- `onModelSelected`: penyedia menjalankan efek samping pascapemilihan seperti
  telemetri atau pembukuan sesi milik penyedia

Contoh bawaan saat ini:

- `anthropic`: fallback forward-compat Claude 4.6, petunjuk perbaikan auth, pengambilan
  endpoint usage, metadata cache-TTL/keluarga penyedia, dan default konfigurasi global
  yang sadar auth
- `amazon-bedrock`: pencocokan context-overflow yang dimiliki penyedia dan klasifikasi
  alasan failover untuk error throttle/not-ready spesifik Bedrock, plus keluarga replay
  bersama `anthropic-by-model` untuk guard kebijakan replay khusus Claude pada trafik Anthropic
- `anthropic-vertex`: guard kebijakan replay khusus Claude pada trafik pesan Anthropic
- `openrouter`: ID model pass-through, wrapper permintaan, petunjuk capability
  penyedia, sanitasi thought-signature Gemini pada trafik proxy Gemini, injeksi
  reasoning proxy melalui keluarga stream `openrouter-thinking`, penerusan metadata
  routing, dan kebijakan cache-TTL
- `github-copilot`: onboarding/login perangkat, fallback model forward-compat,
  petunjuk transkrip Claude-thinking, pertukaran token runtime, dan pengambilan endpoint usage
- `openai`: fallback forward-compat GPT-5.4, normalisasi transport OpenAI langsung,
  petunjuk missing-auth yang sadar Codex, supresi Spark, baris katalog
  OpenAI/Codex sintetik, kebijakan thinking/live-model, normalisasi alias token usage
  (`input` / `output` dan keluarga `prompt` / `completion`), keluarga stream bersama
  `openai-responses-defaults` untuk wrapper OpenAI/Codex native, dan metadata
  keluarga penyedia
- `google` dan `google-gemini-cli`: fallback forward-compat Gemini 3.1,
  validasi replay Gemini native, sanitasi replay bootstrap, mode output reasoning
  bertag, dan pencocokan model modern; Gemini CLI OAuth juga memiliki pemformatan
  token profil auth, parsing token usage, dan pengambilan endpoint kuota
  untuk permukaan usage
- `moonshot`: transport bersama, normalisasi payload thinking milik plugin
- `kilocode`: transport bersama, header permintaan milik plugin, normalisasi payload
  reasoning, sanitasi thought-signature proxy-Gemini, dan kebijakan cache-TTL
- `zai`: fallback forward-compat GLM-5, default `tool_stream`, kebijakan cache-TTL,
  kebijakan thinking biner/live-model, dan auth usage + pengambilan kuota;
  ID `glm-5*` yang tidak dikenal disintesis dari template bawaan `glm-4.7`
- `xai`: normalisasi transport Responses native, penulisan ulang alias `/fast` untuk
  varian cepat Grok, default `tool_stream`, dan pembersihan skema tool /
  payload reasoning spesifik xAI
- `mistral`: metadata capability milik plugin
- `opencode` dan `opencode-go`: metadata capability milik plugin plus
  sanitasi thought-signature proxy-Gemini
- `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi`,
  `nvidia`, `qianfan`, `stepfun`, `synthetic`, `together`, `venice`,
  `vercel-ai-gateway`, dan `volcengine`: hanya katalog milik plugin
- `qwen`: katalog teks milik plugin plus registrasi penyedia
  media-understanding dan video-generation bersama untuk permukaan multimodalnya;
  pembuatan video Qwen menggunakan endpoint video Standard DashScope dengan model Wan
  bawaan seperti `wan2.6-t2v` dan `wan2.7-r2v`
- `minimax`: katalog milik plugin, pemilihan kebijakan replay Anthropic/OpenAI hibrida,
  dan logika auth/snapshot usage
- `xiaomi`: katalog milik plugin plus logika auth/snapshot usage

Plugin `openai` bawaan kini memiliki kedua ID penyedia: `openai` dan
`openai-codex`.

Itu mencakup penyedia yang masih sesuai dengan transport normal OpenClaw. Penyedia
yang memerlukan eksekutor permintaan kustom sepenuhnya adalah permukaan ekstensi
terpisah yang lebih mendalam.

## Rotasi API key

- Mendukung rotasi penyedia generik untuk penyedia terpilih.
- Konfigurasikan beberapa key melalui:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (satu override live, prioritas tertinggi)
  - `<PROVIDER>_API_KEYS` (daftar dipisahkan koma atau titik koma)
  - `<PROVIDER>_API_KEY` (key utama)
  - `<PROVIDER>_API_KEY_*` (daftar bernomor, misalnya `<PROVIDER>_API_KEY_1`)
- Untuk penyedia Google, `GOOGLE_API_KEY` juga disertakan sebagai fallback.
- Urutan pemilihan key mempertahankan prioritas dan menghapus duplikasi nilai.
- Permintaan dicoba ulang dengan key berikutnya hanya pada respons rate-limit (misalnya
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded`, atau pesan batas penggunaan berkala).
- Kegagalan non-rate-limit langsung gagal; tidak ada rotasi key yang dicoba.
- Ketika semua key kandidat gagal, error terakhir dikembalikan dari percobaan terakhir.

## Penyedia bawaan (katalog pi-ai)

OpenClaw dikirim dengan katalog pi‑ai. Penyedia ini **tidak**
memerlukan konfigurasi `models.providers`; cukup tetapkan auth + pilih model.

### OpenAI

- Penyedia: `openai`
- Auth: `OPENAI_API_KEY`
- Rotasi opsional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, ditambah `OPENCLAW_LIVE_OPENAI_KEY` (satu override)
- Contoh model: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Transport default adalah `auto` (WebSocket lebih dulu, fallback SSE)
- Ganti per model melalui `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, atau `"auto"`)
- Warm-up WebSocket OpenAI Responses default-nya aktif melalui `params.openaiWsWarmup` (`true`/`false`)
- Pemrosesan prioritas OpenAI dapat diaktifkan melalui `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` dan `params.fastMode` memetakan permintaan Responses `openai/*` langsung ke `service_tier=priority` pada `api.openai.com`
- Gunakan `params.serviceTier` saat Anda menginginkan tier eksplisit alih-alih toggle `/fast` bersama
- Header atribusi OpenClaw tersembunyi (`originator`, `version`,
  `User-Agent`) hanya berlaku pada trafik OpenAI native ke `api.openai.com`, bukan
  proxy generik yang kompatibel dengan OpenAI
- Rute OpenAI native juga mempertahankan Responses `store`, petunjuk prompt-cache, dan
  pembentukan payload kompatibilitas reasoning OpenAI; rute proxy tidak
- `openai/gpt-5.3-codex-spark` sengaja disembunyikan di OpenClaw karena API OpenAI live menolaknya; Spark diperlakukan sebagai khusus Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Penyedia: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotasi opsional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, ditambah `OPENCLAW_LIVE_ANTHROPIC_KEY` (satu override)
- Contoh model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey` atau `openclaw onboard --auth-choice anthropic-cli`
- Permintaan Anthropic publik langsung mendukung toggle `/fast` bersama dan `params.fastMode`, termasuk trafik yang diautentikasi dengan API key dan OAuth yang dikirim ke `api.anthropic.com`; OpenClaw memetakannya ke Anthropic `service_tier` (`auto` vs `standard_only`)
- Catatan penagihan: dokumentasi publik Claude Code Anthropic masih memasukkan penggunaan terminal Claude Code langsung dalam batas paket Claude. Secara terpisah, Anthropic memberi tahu pengguna OpenClaw pada **4 April 2026 pukul 12:00 PM PT / 8:00 PM BST** bahwa jalur login Claude **OpenClaw** dihitung sebagai penggunaan harness pihak ketiga dan memerlukan **Extra Usage** yang ditagih terpisah dari langganan.
- Setup-token Anthropic tersedia lagi sebagai jalur OpenClaw lama/manual. Gunakan dengan ekspektasi bahwa Anthropic memberi tahu pengguna OpenClaw bahwa jalur ini memerlukan **Extra Usage**.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Penyedia: `openai-codex`
- Auth: OAuth (ChatGPT)
- Contoh model: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` atau `openclaw models auth login --provider openai-codex`
- Transport default adalah `auto` (WebSocket lebih dulu, fallback SSE)
- Ganti per model melalui `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, atau `"auto"`)
- `params.serviceTier` juga diteruskan pada permintaan Responses Codex native (`chatgpt.com/backend-api`)
- Header atribusi OpenClaw tersembunyi (`originator`, `version`,
  `User-Agent`) hanya dilampirkan pada trafik Codex native ke
  `chatgpt.com/backend-api`, bukan proxy generik yang kompatibel dengan OpenAI
- Berbagi toggle `/fast` dan konfigurasi `params.fastMode` yang sama seperti `openai/*` langsung; OpenClaw memetakannya ke `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` tetap tersedia ketika katalog OAuth Codex mengeksposnya; bergantung pada entitlement
- `openai-codex/gpt-5.4` mempertahankan native `contextWindow = 1050000` dan runtime default `contextTokens = 272000`; ganti batas runtime dengan `models.providers.openai-codex.models[].contextTokens`
- Catatan kebijakan: OAuth OpenAI Codex didukung secara eksplisit untuk tool/alur kerja eksternal seperti OpenClaw.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### Opsi hosted gaya langganan lainnya

- [Qwen Cloud](/providers/qwen): permukaan penyedia Qwen Cloud plus pemetaan endpoint Alibaba DashScope dan Coding Plan
- [MiniMax](/providers/minimax): akses OAuth atau API key MiniMax Coding Plan
- [GLM Models](/providers/glm): endpoint Z.AI Coding Plan atau API umum

### OpenCode

- Auth: `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`)
- Penyedia runtime Zen: `opencode`
- Penyedia runtime Go: `opencode-go`
- Contoh model: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` atau `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- Penyedia: `google`
- Auth: `GEMINI_API_KEY`
- Rotasi opsional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY`, dan `OPENCLAW_LIVE_GEMINI_KEY` (satu override)
- Contoh model: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilitas: konfigurasi OpenClaw lama yang menggunakan `google/gemini-3.1-flash-preview` dinormalkan menjadi `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Proses Gemini langsung juga menerima `agents.defaults.models["google/<model>"].params.cachedContent`
  (atau `cached_content` lama) untuk meneruskan handle
  `cachedContents/...` native penyedia; cache hit Gemini muncul sebagai OpenClaw `cacheRead`

### Google Vertex dan Gemini CLI

- Penyedia: `google-vertex`, `google-gemini-cli`
- Auth: Vertex menggunakan gcloud ADC; Gemini CLI menggunakan alur OAuth-nya
- Perhatian: OAuth Gemini CLI di OpenClaw adalah integrasi tidak resmi. Beberapa pengguna telah melaporkan pembatasan akun Google setelah menggunakan klien pihak ketiga. Tinjau ketentuan Google dan gunakan akun nonkritis jika Anda memilih untuk melanjutkan.
- OAuth Gemini CLI dikirim sebagai bagian dari plugin `google` bawaan.
  - Instal Gemini CLI terlebih dahulu:
    - `brew install gemini-cli`
    - atau `npm install -g @google/gemini-cli`
  - Aktifkan: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Model default: `google-gemini-cli/gemini-3.1-pro-preview`
  - Catatan: Anda **tidak** menempelkan client id atau secret ke `openclaw.json`. Alur login CLI menyimpan
    token dalam profil auth pada host gateway.
  - Jika permintaan gagal setelah login, tetapkan `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` pada host gateway.
  - Balasan JSON Gemini CLI di-parse dari `response`; usage menggunakan fallback
    `stats`, dengan `stats.cached` dinormalkan menjadi OpenClaw `cacheRead`.

### Z.AI (GLM)

- Penyedia: `zai`
- Auth: `ZAI_API_KEY`
- Contoh model: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` dan `z-ai/*` dinormalkan menjadi `zai/*`
  - `zai-api-key` mendeteksi otomatis endpoint Z.AI yang cocok; `zai-coding-global`, `zai-coding-cn`, `zai-global`, dan `zai-cn` memaksa permukaan tertentu

### Vercel AI Gateway

- Penyedia: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Contoh model: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Penyedia: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Contoh model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Katalog fallback statis dikirim dengan `kilocode/kilo/auto`; discovery live
  `https://api.kilo.ai/api/gateway/models` dapat memperluas katalog runtime
  lebih lanjut.
- Rute upstream persis di balik `kilocode/kilo/auto` dimiliki oleh Kilo Gateway,
  bukan di-hardcode di OpenClaw.

Lihat [/providers/kilocode](/providers/kilocode) untuk detail penyiapan.

### Plugin penyedia bawaan lainnya

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Contoh model: `openrouter/auto`
- OpenClaw menerapkan header atribusi app terdokumentasi OpenRouter hanya ketika
  permintaan benar-benar menargetkan `openrouter.ai`
- Penanda `cache_control` Anthropic khusus OpenRouter juga dibatasi ke
  rute OpenRouter yang terverifikasi, bukan URL proxy sewenang-wenang
- OpenRouter tetap berada pada jalur gaya proxy yang kompatibel dengan OpenAI, sehingga
  pembentukan permintaan yang hanya native untuk OpenAI (`serviceTier`, Responses `store`,
  petunjuk prompt-cache, payload kompatibilitas reasoning OpenAI) tidak diteruskan
- Referensi OpenRouter berbasis Gemini hanya mempertahankan sanitasi thought-signature proxy-Gemini;
  validasi replay Gemini native dan penulisan ulang bootstrap tetap nonaktif
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Contoh model: `kilocode/kilo/auto`
- Referensi Kilo berbasis Gemini mempertahankan jalur sanitasi thought-signature
  proxy-Gemini yang sama; `kilocode/kilo/auto` dan petunjuk proxy-reasoning-unsupported lainnya
  melewati injeksi reasoning proxy
- MiniMax: `minimax` (API key) dan `minimax-portal` (OAuth)
- Auth: `MINIMAX_API_KEY` untuk `minimax`; `MINIMAX_OAUTH_TOKEN` atau `MINIMAX_API_KEY` untuk `minimax-portal`
- Contoh model: `minimax/MiniMax-M2.7` atau `minimax-portal/MiniMax-M2.7`
- Penyiapan onboarding/API key MiniMax menulis definisi model M2.7 eksplisit dengan
  `input: ["text", "image"]`; katalog penyedia bawaan mempertahankan referensi chat
  hanya teks sampai konfigurasi penyedia itu dimaterialisasi
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Contoh model: `moonshot/kimi-k2.5`
- Kimi Coding: `kimi` (`KIMI_API_KEY` atau `KIMICODE_API_KEY`)
- Contoh model: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- Contoh model: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY`, atau `DASHSCOPE_API_KEY`)
- Contoh model: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- Contoh model: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- Contoh model: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- Contoh model: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- Contoh model: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` atau `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- Contoh model: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- Contoh model: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - Permintaan xAI bawaan native menggunakan jalur xAI Responses
  - `/fast` atau `params.fastMode: true` menulis ulang `grok-3`, `grok-3-mini`,
    `grok-4`, dan `grok-4-0709` ke varian `*-fast`
  - `tool_stream` default-nya aktif; tetapkan
    `agents.defaults.models["xai/<model>"].params.tool_stream` ke `false` untuk
    menonaktifkannya
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Contoh model: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Model GLM pada Cerebras menggunakan ID `zai-glm-4.7` dan `zai-glm-4.6`.
  - Base URL yang kompatibel dengan OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Contoh model Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Lihat [Hugging Face (Inference)](/providers/huggingface).

## Penyedia melalui `models.providers` (kustom/base URL)

Gunakan `models.providers` (atau `models.json`) untuk menambahkan **penyedia**
kustom atau proxy yang kompatibel dengan OpenAI/Anthropic.

Banyak plugin penyedia bawaan di bawah ini sudah menerbitkan katalog default.
Gunakan entri `models.providers.<id>` eksplisit hanya ketika Anda ingin mengganti
base URL, header, atau daftar model default.

### Moonshot AI (Kimi)

Moonshot dikirim sebagai plugin penyedia bawaan. Gunakan penyedia bawaan secara
default, dan tambahkan entri `models.providers.moonshot` eksplisit hanya ketika Anda
perlu mengganti base URL atau metadata model:

- Penyedia: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Contoh model: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` atau `openclaw onboard --auth-choice moonshot-api-key-cn`

ID model Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
      },
    },
  },
}
```

### Kimi Coding

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

`kimi/k2p5` lama tetap diterima sebagai ID model kompatibilitas.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) menyediakan akses ke Doubao dan model lain di China.

- Penyedia: `volcengine` (coding: `volcengine-plan`)
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

Onboarding default-nya menggunakan permukaan coding, tetapi katalog umum `volcengine/*`
didaftarkan pada saat yang sama.

Dalam picker model onboarding/configure, pilihan auth Volcengine mengutamakan kedua
baris `volcengine/*` dan `volcengine-plan/*`. Jika model-model itu belum dimuat,
OpenClaw menggunakan fallback ke katalog tanpa filter alih-alih menampilkan picker
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

Onboarding default-nya menggunakan permukaan coding, tetapi katalog umum `byteplus/*`
didaftarkan pada saat yang sama.

Dalam picker model onboarding/configure, pilihan auth BytePlus mengutamakan kedua
baris `byteplus/*` dan `byteplus-plan/*`. Jika model-model itu belum dimuat,
OpenClaw menggunakan fallback ke katalog tanpa filter alih-alih menampilkan picker
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

Synthetic menyediakan model yang kompatibel dengan Anthropic di balik penyedia `synthetic`:

- Penyedia: `synthetic`
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

- OAuth MiniMax (Global): `--auth-choice minimax-global-oauth`
- OAuth MiniMax (CN): `--auth-choice minimax-cn-oauth`
- API key MiniMax (Global): `--auth-choice minimax-global-api`
- API key MiniMax (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` untuk `minimax`; `MINIMAX_OAUTH_TOKEN` atau
  `MINIMAX_API_KEY` untuk `minimax-portal`

Lihat [/providers/minimax](/providers/minimax) untuk detail penyiapan, opsi model, dan potongan konfigurasi.

Pada jalur streaming MiniMax yang kompatibel dengan Anthropic, OpenClaw menonaktifkan thinking
secara default kecuali Anda menetapkannya secara eksplisit, dan `/fast on` menulis ulang
`MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.

Pemisahan capability milik plugin:

- Default teks/chat tetap pada `minimax/MiniMax-M2.7`
- Pembuatan gambar adalah `minimax/image-01` atau `minimax-portal/image-01`
- Pemahaman gambar adalah `MiniMax-VL-01` milik plugin pada kedua jalur auth MiniMax
- Pencarian web tetap pada ID penyedia `minimax`

### Ollama

Ollama dikirim sebagai plugin penyedia bawaan dan menggunakan API native Ollama:

- Penyedia: `ollama`
- Auth: Tidak diperlukan (server lokal)
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

Ollama dideteksi secara lokal di `http://127.0.0.1:11434` saat Anda melakukan opt-in dengan
`OLLAMA_API_KEY`, dan plugin penyedia bawaan menambahkan Ollama langsung ke
`openclaw onboard` dan picker model. Lihat [/providers/ollama](/providers/ollama)
untuk onboarding, mode cloud/lokal, dan konfigurasi kustom.

### vLLM

vLLM dikirim sebagai plugin penyedia bawaan untuk server yang kompatibel dengan OpenAI
lokal/self-hosted:

- Penyedia: `vllm`
- Auth: Opsional (tergantung server Anda)
- Base URL default: `http://127.0.0.1:8000/v1`

Untuk melakukan opt-in ke auto-discovery secara lokal (nilai apa pun berfungsi jika server Anda tidak menegakkan auth):

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

Lihat [/providers/vllm](/providers/vllm) untuk detailnya.

### SGLang

SGLang dikirim sebagai plugin penyedia bawaan untuk server self-hosted cepat
yang kompatibel dengan OpenAI:

- Penyedia: `sglang`
- Auth: Opsional (tergantung server Anda)
- Base URL default: `http://127.0.0.1:30000/v1`

Untuk melakukan opt-in ke auto-discovery secara lokal (nilai apa pun berfungsi jika server Anda tidak
menegakkan auth):

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

Lihat [/providers/sglang](/providers/sglang) untuk detailnya.

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
        apiKey: "LMSTUDIO_KEY",
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

- Untuk penyedia kustom, `reasoning`, `input`, `cost`, `contextWindow`, dan `maxTokens` bersifat opsional.
  Jika dihilangkan, OpenClaw menggunakan default:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Direkomendasikan: tetapkan nilai eksplisit yang sesuai dengan batas proxy/model Anda.
- Untuk `api: "openai-completions"` pada endpoint non-native (setiap `baseUrl` tidak kosong yang host-nya bukan `api.openai.com`), OpenClaw memaksa `compat.supportsDeveloperRole: false` untuk menghindari error 400 dari penyedia untuk role `developer` yang tidak didukung.
- Rute gaya proxy yang kompatibel dengan OpenAI juga melewati pembentukan permintaan
  yang hanya native untuk OpenAI: tidak ada `service_tier`, tidak ada Responses `store`, tidak ada petunjuk prompt-cache, tidak ada
  pembentukan payload kompatibilitas reasoning OpenAI, dan tidak ada header atribusi OpenClaw tersembunyi.
- Jika `baseUrl` kosong/dihilangkan, OpenClaw mempertahankan perilaku OpenAI default (yang me-resolve ke `api.openai.com`).
- Demi keamanan, `compat.supportsDeveloperRole: true` eksplisit tetap diganti pada endpoint `openai-completions` non-native.

## Contoh CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Lihat juga: [/gateway/configuration](/gateway/configuration) untuk contoh konfigurasi lengkap.

## Terkait

- [Models](/concepts/models) — konfigurasi model dan alias
- [Model Failover](/concepts/model-failover) — rantai fallback dan perilaku retry
- [Configuration Reference](/gateway/configuration-reference#agent-defaults) — kunci konfigurasi model
- [Providers](/providers) — panduan penyiapan per penyedia
