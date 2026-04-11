---
read_when:
    - Anda memerlukan referensi penyiapan model per penyedia
    - Anda menginginkan contoh konfigurasi atau perintah onboarding CLI untuk penyedia model
summary: Ikhtisar penyedia model dengan contoh konfigurasi + alur CLI
title: Penyedia Model
x-i18n:
    generated_at: "2026-04-11T02:44:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 910ea7895e74c03910757d9d3e02825754b779b204eca7275b28422647ed0151
    source_path: concepts/model-providers.md
    workflow: 15
---

# Penyedia model

Halaman ini membahas **penyedia LLM/model** (bukan channel chat seperti WhatsApp/Telegram).
Untuk aturan pemilihan model, lihat [/concepts/models](/id/concepts/models).

## Aturan cepat

- Referensi model menggunakan `provider/model` (contoh: `opencode/claude-opus-4-6`).
- Jika Anda menetapkan `agents.defaults.models`, itu akan menjadi allowlist.
- Helper CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Aturan runtime fallback, probe cooldown, dan persistensi override sesi
  didokumentasikan di [/concepts/model-failover](/id/concepts/model-failover).
- `models.providers.*.models[].contextWindow` adalah metadata model native;
  `models.providers.*.models[].contextTokens` adalah batas runtime efektif.
- Plugin provider dapat menyuntikkan katalog model melalui `registerProvider({ catalog })`;
  OpenClaw menggabungkan output tersebut ke dalam `models.providers` sebelum menulis
  `models.json`.
- Manifes provider dapat mendeklarasikan `providerAuthEnvVars` dan
  `providerAuthAliases` sehingga probe autentikasi berbasis env generik dan varian provider
  tidak perlu memuat runtime plugin. Peta env-var inti yang tersisa sekarang
  hanya untuk provider inti/non-plugin dan beberapa kasus prioritas generik
  seperti onboarding Anthropic yang mengutamakan API key.
- Plugin provider juga dapat memiliki perilaku runtime provider melalui
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
- Catatan: `capabilities` runtime provider adalah metadata runner bersama (keluarga provider,
  keunikan transkrip/tooling, petunjuk transport/cache). Ini bukan hal yang
  sama dengan [model capability publik](/id/plugins/architecture#public-capability-model)
  yang menjelaskan apa yang didaftarkan oleh sebuah plugin (inferensi teks, ucapan, dll.).
- Provider `codex` bawaan dipasangkan dengan harness agen Codex bawaan.
  Gunakan `codex/gpt-*` saat Anda menginginkan login milik Codex, penemuan model,
  resume thread native, dan eksekusi app-server. Referensi `openai/gpt-*` biasa tetap
  menggunakan provider OpenAI dan transport provider OpenClaw normal.
  Deployment khusus Codex dapat menonaktifkan fallback PI otomatis dengan
  `agents.defaults.embeddedHarness.fallback: "none"`; lihat
  [Codex Harness](/id/plugins/codex-harness).

## Perilaku provider yang dimiliki plugin

Plugin provider kini dapat memiliki sebagian besar logika khusus provider sementara OpenClaw tetap menangani
loop inferensi generik.

Pembagian umumnya:

- `auth[].run` / `auth[].runNonInteractive`: provider memiliki alur onboarding/login
  untuk `openclaw onboard`, `openclaw models auth`, dan setup headless
- `wizard.setup` / `wizard.modelPicker`: provider memiliki label pilihan autentikasi,
  alias lama, petunjuk allowlist onboarding, dan entri setup di pemilih onboarding/model
- `catalog`: provider muncul di `models.providers`
- `normalizeModelId`: provider menormalkan id model legacy/pratinjau sebelum
  lookup atau kanonikalisasi
- `normalizeTransport`: provider menormalkan keluarga transport `api` / `baseUrl`
  sebelum perakitan model generik; OpenClaw memeriksa provider yang cocok terlebih dahulu,
  lalu plugin provider lain yang mendukung hook sampai salah satunya benar-benar mengubah
  transport
- `normalizeConfig`: provider menormalkan konfigurasi `models.providers.<id>` sebelum
  runtime menggunakannya; OpenClaw memeriksa provider yang cocok terlebih dahulu, lalu plugin provider
  lain yang mendukung hook sampai salah satunya benar-benar mengubah konfigurasi. Jika tidak ada
  hook provider yang menulis ulang konfigurasi, helper keluarga Google bawaan tetap
  menormalkan entri provider Google yang didukung.
- `applyNativeStreamingUsageCompat`: provider menerapkan penulisan ulang kompatibilitas penggunaan streaming native berbasis endpoint untuk provider konfigurasi
- `resolveConfigApiKey`: provider menyelesaikan autentikasi penanda env untuk provider konfigurasi
  tanpa memaksa pemuatan autentikasi runtime penuh. `amazon-bedrock` juga memiliki
  resolver penanda env AWS bawaan di sini, meskipun autentikasi runtime Bedrock menggunakan
  rantai default AWS SDK.
- `resolveSyntheticAuth`: provider dapat mengekspos ketersediaan autentikasi lokal/self-hosted atau autentikasi berbasis konfigurasi lainnya
  tanpa menyimpan secret plaintext
- `shouldDeferSyntheticProfileAuth`: provider dapat menandai placeholder profil sintetis yang disimpan
  sebagai prioritas lebih rendah daripada autentikasi berbasis env/konfigurasi
- `resolveDynamicModel`: provider menerima id model yang belum ada di katalog statis lokal
- `prepareDynamicModel`: provider memerlukan penyegaran metadata sebelum mencoba kembali
  resolusi model dinamis
- `normalizeResolvedModel`: provider memerlukan penulisan ulang transport atau base URL
- `contributeResolvedModelCompat`: provider menyumbangkan flag kompatibilitas untuk
  model vendor miliknya bahkan ketika model tersebut datang melalui transport kompatibel lain
- `capabilities`: provider memublikasikan keunikan transkrip/tooling/keluarga provider
- `normalizeToolSchemas`: provider membersihkan skema tool sebelum runner tersemat
  melihatnya
- `inspectToolSchemas`: provider menampilkan peringatan skema khusus transport
  setelah normalisasi
- `resolveReasoningOutputMode`: provider memilih kontrak output reasoning
  native vs bertag
- `prepareExtraParams`: provider menetapkan default atau menormalkan parameter permintaan per model
- `createStreamFn`: provider menggantikan jalur stream normal dengan transport
  kustom sepenuhnya
- `wrapStreamFn`: provider menerapkan wrapper kompatibilitas header/body/model permintaan
- `resolveTransportTurnState`: provider menyediakan header transport native per giliran
  atau metadata
- `resolveWebSocketSessionPolicy`: provider menyediakan header sesi WebSocket native
  atau kebijakan cooldown sesi
- `createEmbeddingProvider`: provider memiliki perilaku embedding memori saat hal itu
  berada bersama plugin provider, bukan switchboard embedding inti
- `formatApiKey`: provider memformat profil autentikasi yang disimpan ke dalam string
  `apiKey` runtime yang diharapkan oleh transport
- `refreshOAuth`: provider memiliki penyegaran OAuth saat refresher bersama `pi-ai`
  tidak memadai
- `buildAuthDoctorHint`: provider menambahkan panduan perbaikan saat penyegaran OAuth
  gagal
- `matchesContextOverflowError`: provider mengenali error overflow context-window
  khusus provider yang akan terlewat oleh heuristik generik
- `classifyFailoverReason`: provider memetakan error transport/API mentah khusus provider
  ke alasan failover seperti rate limit atau overload
- `isCacheTtlEligible`: provider menentukan id model upstream mana yang mendukung TTL prompt-cache
- `buildMissingAuthMessage`: provider menggantikan error penyimpanan autentikasi generik
  dengan petunjuk pemulihan khusus provider
- `suppressBuiltInModel`: provider menyembunyikan baris upstream yang usang dan dapat mengembalikan
  error milik vendor untuk kegagalan resolusi langsung
- `augmentModelCatalog`: provider menambahkan baris katalog sintetis/akhir setelah
  discovery dan penggabungan konfigurasi
- `isBinaryThinking`: provider memiliki UX thinking biner hidup/mati
- `supportsXHighThinking`: provider mengikutsertakan model tertentu ke `xhigh`
- `resolveDefaultThinkingLevel`: provider memiliki kebijakan default `/think` untuk
  sebuah keluarga model
- `applyConfigDefaults`: provider menerapkan default global khusus provider
  selama materialisasi konfigurasi berdasarkan mode autentikasi, env, atau keluarga model
- `isModernModelRef`: provider memiliki pencocokan model pilihan live/smoke
- `prepareRuntimeAuth`: provider mengubah kredensial yang dikonfigurasi menjadi token runtime
  jangka pendek
- `resolveUsageAuth`: provider menyelesaikan kredensial penggunaan/kuota untuk `/usage`
  dan permukaan status/pelaporan terkait
- `fetchUsageSnapshot`: provider memiliki pengambilan/penguraian endpoint penggunaan sementara
  inti tetap memiliki shell ringkasan dan pemformatan
- `onModelSelected`: provider menjalankan efek samping setelah pemilihan model seperti
  telemetri atau pencatatan sesi milik provider

Contoh bawaan saat ini:

- `anthropic`: fallback forward-compat Claude 4.6, petunjuk perbaikan autentikasi, pengambilan endpoint penggunaan,
  metadata cache-TTL/keluarga provider, dan default konfigurasi global
  yang sadar autentikasi
- `amazon-bedrock`: pencocokan context-overflow dan klasifikasi alasan
  failover yang dimiliki provider untuk error throttle/belum-siap khusus Bedrock, ditambah
  keluarga replay bersama `anthropic-by-model` untuk guard kebijakan replay khusus Claude
  pada traffic Anthropic
- `anthropic-vertex`: guard kebijakan replay khusus Claude pada
  traffic pesan Anthropic
- `openrouter`: id model pass-through, wrapper permintaan, petunjuk capability provider,
  sanitasi thought-signature Gemini pada traffic proxy Gemini, injeksi
  reasoning proxy melalui keluarga stream `openrouter-thinking`, penerusan metadata
  routing, dan kebijakan cache-TTL
- `github-copilot`: onboarding/login perangkat, fallback model forward-compat,
  petunjuk transkrip Claude-thinking, pertukaran token runtime, dan pengambilan endpoint penggunaan
- `openai`: fallback forward-compat GPT-5.4, normalisasi transport OpenAI langsung,
  petunjuk autentikasi-hilang yang sadar Codex, suppression Spark, baris katalog
  sintetis OpenAI/Codex, kebijakan thinking/live-model, normalisasi alias token penggunaan
  (`input` / `output` dan keluarga `prompt` / `completion`), keluarga stream bersama
  `openai-responses-defaults` untuk wrapper OpenAI/Codex native, metadata keluarga provider,
  pendaftaran provider pembuatan gambar bawaan
  untuk `gpt-image-1`, dan pendaftaran provider pembuatan video bawaan
  untuk `sora-2`
- `google` dan `google-gemini-cli`: fallback forward-compat Gemini 3.1,
  validasi replay Gemini native, sanitasi replay bootstrap, mode output
  reasoning bertag, pencocokan model modern, pendaftaran provider pembuatan gambar bawaan
  untuk model Gemini image-preview, dan pendaftaran provider
  pembuatan video bawaan untuk model Veo; OAuth Gemini CLI juga
  memiliki pemformatan token profil autentikasi, parsing token penggunaan, dan pengambilan endpoint kuota
  untuk permukaan penggunaan
- `moonshot`: transport bersama, normalisasi payload thinking yang dimiliki plugin
- `kilocode`: transport bersama, header permintaan yang dimiliki plugin, normalisasi payload reasoning,
  sanitasi thought-signature proxy-Gemini, dan kebijakan cache-TTL
- `zai`: fallback forward-compat GLM-5, default `tool_stream`, kebijakan cache-TTL,
  kebijakan binary-thinking/live-model, dan autentikasi penggunaan + pengambilan kuota;
  id `glm-5*` yang tidak dikenal disintesis dari templat `glm-4.7` bawaan
- `xai`: normalisasi transport Responses native, penulisan ulang alias `/fast` untuk
  varian cepat Grok, default `tool_stream`, pembersihan skema-tool /
  payload reasoning khusus xAI, dan pendaftaran provider pembuatan video bawaan
  untuk `grok-imagine-video`
- `mistral`: metadata capability yang dimiliki plugin
- `opencode` dan `opencode-go`: metadata capability yang dimiliki plugin ditambah
  sanitasi thought-signature proxy-Gemini
- `alibaba`: katalog pembuatan video yang dimiliki plugin untuk referensi model Wan langsung
  seperti `alibaba/wan2.6-t2v`
- `byteplus`: katalog yang dimiliki plugin ditambah pendaftaran provider pembuatan video bawaan
  untuk model text-to-video/image-to-video Seedance
- `fal`: pendaftaran provider pembuatan video bawaan untuk model pihak ketiga yang dihosting,
  pendaftaran provider pembuatan gambar untuk model gambar FLUX, ditambah pendaftaran provider
  pembuatan video bawaan untuk model video pihak ketiga yang dihosting
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway`, dan `volcengine`:
  hanya katalog yang dimiliki plugin
- `qwen`: katalog yang dimiliki plugin untuk model teks ditambah pendaftaran provider
  media-understanding dan pembuatan video bersama untuk permukaan multimodalnya;
  pembuatan video Qwen menggunakan endpoint video DashScope Standar dengan
  model Wan bawaan seperti `wan2.6-t2v` dan `wan2.7-r2v`
- `runway`: pendaftaran provider pembuatan video yang dimiliki plugin untuk model native
  berbasis tugas Runway seperti `gen4.5`
- `minimax`: katalog yang dimiliki plugin, pendaftaran provider pembuatan video bawaan
  untuk model video Hailuo, pendaftaran provider pembuatan gambar bawaan
  untuk `image-01`, pemilihan kebijakan replay Anthropic/OpenAI hibrida,
  dan logika autentikasi/snapshot penggunaan
- `together`: katalog yang dimiliki plugin ditambah pendaftaran provider pembuatan video bawaan
  untuk model video Wan
- `xiaomi`: katalog yang dimiliki plugin ditambah logika autentikasi/snapshot penggunaan

Plugin `openai` bawaan sekarang memiliki kedua id provider: `openai` dan
`openai-codex`.

Itu mencakup provider yang masih sesuai dengan transport normal OpenClaw. Provider
yang membutuhkan eksekutor permintaan kustom sepenuhnya adalah permukaan ekstensi
yang terpisah dan lebih dalam.

## Rotasi API key

- Mendukung rotasi provider generik untuk provider tertentu.
- Konfigurasikan beberapa key melalui:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override live tunggal, prioritas tertinggi)
  - `<PROVIDER>_API_KEYS` (daftar dipisahkan koma atau titik koma)
  - `<PROVIDER>_API_KEY` (key utama)
  - `<PROVIDER>_API_KEY_*` (daftar bernomor, misalnya `<PROVIDER>_API_KEY_1`)
- Untuk provider Google, `GOOGLE_API_KEY` juga disertakan sebagai fallback.
- Urutan pemilihan key mempertahankan prioritas dan menghapus duplikasi nilai.
- Permintaan dicoba ulang dengan key berikutnya hanya pada respons rate-limit (misalnya
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded`, atau pesan batas penggunaan berkala).
- Kegagalan non-rate-limit langsung gagal; tidak ada rotasi key yang dicoba.
- Ketika semua key kandidat gagal, error akhir dikembalikan dari percobaan terakhir.

## Provider bawaan (katalog pi-ai)

OpenClaw dilengkapi dengan katalog pi‑ai. Provider ini tidak memerlukan
konfigurasi `models.providers`; cukup tetapkan autentikasi + pilih model.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Rotasi opsional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, ditambah `OPENCLAW_LIVE_OPENAI_KEY` (override tunggal)
- Contoh model: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Transport default adalah `auto` (WebSocket terlebih dahulu, fallback SSE)
- Override per model melalui `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, atau `"auto"`)
- Warm-up WebSocket OpenAI Responses defaultnya aktif melalui `params.openaiWsWarmup` (`true`/`false`)
- Pemrosesan prioritas OpenAI dapat diaktifkan melalui `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` dan `params.fastMode` memetakan permintaan Responses `openai/*` langsung ke `service_tier=priority` di `api.openai.com`
- Gunakan `params.serviceTier` saat Anda menginginkan tier eksplisit, bukan toggle `/fast` bersama
- Header atribusi OpenClaw tersembunyi (`originator`, `version`,
  `User-Agent`) hanya berlaku pada traffic OpenAI native ke `api.openai.com`, bukan
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

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotasi opsional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, ditambah `OPENCLAW_LIVE_ANTHROPIC_KEY` (override tunggal)
- Contoh model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Permintaan Anthropic publik langsung juga mendukung toggle `/fast` bersama dan `params.fastMode`, termasuk traffic yang diautentikasi dengan API key dan OAuth yang dikirim ke `api.anthropic.com`; OpenClaw memetakannya ke Anthropic `service_tier` (`auto` vs `standard_only`)
- Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI gaya OpenClaw diizinkan lagi, jadi OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai hal yang diizinkan untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
- Setup-token Anthropic tetap tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` jika tersedia.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- Contoh model: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` atau `openclaw models auth login --provider openai-codex`
- Transport default adalah `auto` (WebSocket terlebih dahulu, fallback SSE)
- Override per model melalui `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, atau `"auto"`)
- `params.serviceTier` juga diteruskan pada permintaan Codex Responses native (`chatgpt.com/backend-api`)
- Header atribusi OpenClaw tersembunyi (`originator`, `version`,
  `User-Agent`) hanya dilampirkan pada traffic Codex native ke
  `chatgpt.com/backend-api`, bukan proxy generik yang kompatibel dengan OpenAI
- Berbagi toggle `/fast` dan konfigurasi `params.fastMode` yang sama seperti `openai/*` langsung; OpenClaw memetakannya ke `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` tetap tersedia ketika katalog OAuth Codex mengeksposnya; bergantung pada entitlement
- `openai-codex/gpt-5.4` mempertahankan `contextWindow = 1050000` native dan `contextTokens = 272000` runtime default; override batas runtime dengan `models.providers.openai-codex.models[].contextTokens`
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

### Opsi host bergaya langganan lainnya

- [Qwen Cloud](/id/providers/qwen): permukaan provider Qwen Cloud ditambah pemetaan endpoint Alibaba DashScope dan Coding Plan
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
- Rotasi opsional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY`, dan `OPENCLAW_LIVE_GEMINI_KEY` (override tunggal)
- Contoh model: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilitas: konfigurasi OpenClaw lama yang menggunakan `google/gemini-3.1-flash-preview` dinormalkan menjadi `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Eksekusi Gemini langsung juga menerima `agents.defaults.models["google/<model>"].params.cachedContent`
  (atau `cached_content` lama) untuk meneruskan handle
  `cachedContents/...` native milik provider; cache hit Gemini muncul sebagai OpenClaw `cacheRead`

### Google Vertex dan Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex menggunakan gcloud ADC; Gemini CLI menggunakan alur OAuth-nya
- Perhatian: OAuth Gemini CLI di OpenClaw adalah integrasi tidak resmi. Beberapa pengguna melaporkan pembatasan akun Google setelah menggunakan klien pihak ketiga. Tinjau ketentuan Google dan gunakan akun yang tidak kritis jika Anda memilih untuk melanjutkan.
- OAuth Gemini CLI dikirim sebagai bagian dari plugin `google` bawaan.
  - Instal Gemini CLI terlebih dahulu:
    - `brew install gemini-cli`
    - atau `npm install -g @google/gemini-cli`
  - Aktifkan: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Model default: `google-gemini-cli/gemini-3-flash-preview`
  - Catatan: Anda **tidak** menempelkan client id atau secret ke `openclaw.json`. Alur login CLI menyimpan
    token dalam profil autentikasi di host gateway.
  - Jika permintaan gagal setelah login, setel `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` di host gateway.
  - Balasan JSON Gemini CLI diurai dari `response`; penggunaan fallback ke
    `stats`, dengan `stats.cached` dinormalkan menjadi OpenClaw `cacheRead`.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Contoh model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` dan `z-ai/*` dinormalkan menjadi `zai/*`
  - `zai-api-key` mendeteksi otomatis endpoint Z.AI yang cocok; `zai-coding-global`, `zai-coding-cn`, `zai-global`, dan `zai-cn` memaksa permukaan tertentu

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Contoh model: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Contoh model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Katalog fallback statis menyertakan `kilocode/kilo/auto`; discovery live
  `https://api.kilo.ai/api/gateway/models` dapat memperluas katalog runtime
  lebih lanjut.
- Rute upstream yang tepat di balik `kilocode/kilo/auto` dimiliki oleh Kilo Gateway,
  bukan di-hardcode di OpenClaw.

Lihat [/providers/kilocode](/id/providers/kilocode) untuk detail penyiapan.

### Plugin provider bawaan lainnya

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Contoh model: `openrouter/auto`
- OpenClaw menerapkan header atribusi aplikasi terdokumentasi milik OpenRouter hanya ketika
  permintaan benar-benar menargetkan `openrouter.ai`
- Penanda `cache_control` Anthropic khusus OpenRouter juga dibatasi ke
  rute OpenRouter yang terverifikasi, bukan URL proxy sembarang
- OpenRouter tetap berada di jalur gaya proxy yang kompatibel dengan OpenAI, sehingga
  pembentukan permintaan khusus OpenAI native (`serviceTier`, Responses `store`,
  petunjuk prompt-cache, payload kompatibilitas reasoning OpenAI) tidak diteruskan
- Referensi OpenRouter berbasis Gemini hanya mempertahankan sanitasi thought-signature proxy-Gemini;
  validasi replay Gemini native dan penulisan ulang bootstrap tetap nonaktif
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Contoh model: `kilocode/kilo/auto`
- Referensi Kilo berbasis Gemini mempertahankan jalur sanitasi thought-signature
  proxy-Gemini yang sama; `kilocode/kilo/auto` dan petunjuk proxy-reasoning-tidak-didukung lainnya
  melewati injeksi reasoning proxy
- MiniMax: `minimax` (API key) dan `minimax-portal` (OAuth)
- Auth: `MINIMAX_API_KEY` untuk `minimax`; `MINIMAX_OAUTH_TOKEN` atau `MINIMAX_API_KEY` untuk `minimax-portal`
- Contoh model: `minimax/MiniMax-M2.7` atau `minimax-portal/MiniMax-M2.7`
- Penyiapan onboarding/API key MiniMax menulis definisi model M2.7 eksplisit dengan
  `input: ["text", "image"]`; katalog provider bawaan menjaga referensi chat
  tetap hanya teks sampai konfigurasi provider tersebut dimaterialisasi
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
    `grok-4`, dan `grok-4-0709` ke varian `*-fast` mereka
  - `tool_stream` defaultnya aktif; setel
    `agents.defaults.models["xai/<model>"].params.tool_stream` ke `false` untuk
    menonaktifkannya
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Contoh model: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Model GLM di Cerebras menggunakan id `zai-glm-4.7` dan `zai-glm-4.6`.
  - Base URL yang kompatibel dengan OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Contoh model Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Lihat [Hugging Face (Inference)](/id/providers/huggingface).

## Provider melalui `models.providers` (kustom/base URL)

Gunakan `models.providers` (atau `models.json`) untuk menambahkan provider **kustom** atau
proxy yang kompatibel dengan OpenAI/Anthropic.

Banyak plugin provider bawaan di bawah ini sudah memublikasikan katalog default.
Gunakan entri `models.providers.<id>` eksplisit hanya ketika Anda ingin menimpa
base URL, header, atau daftar model default.

### Moonshot AI (Kimi)

Moonshot dikirim sebagai plugin provider bawaan. Gunakan provider bawaan secara default,
dan tambahkan entri `models.providers.moonshot` eksplisit hanya ketika Anda
perlu menimpa base URL atau metadata model:

- Provider: `moonshot`
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

`kimi/k2p5` lama tetap diterima sebagai id model kompatibilitas.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) menyediakan akses ke Doubao dan model lain di China.

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

Di pemilih model onboarding/konfigurasi, pilihan autentikasi Volcengine lebih mengutamakan baris
`volcengine/*` dan `volcengine-plan/*`. Jika model tersebut belum dimuat,
OpenClaw fallback ke katalog yang tidak difilter alih-alih menampilkan pemilih
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

Di pemilih model onboarding/konfigurasi, pilihan autentikasi BytePlus lebih mengutamakan baris
`byteplus/*` dan `byteplus-plan/*`. Jika model tersebut belum dimuat,
OpenClaw fallback ke katalog yang tidak difilter alih-alih menampilkan pemilih
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

- OAuth MiniMax (Global): `--auth-choice minimax-global-oauth`
- OAuth MiniMax (CN): `--auth-choice minimax-cn-oauth`
- API key MiniMax (Global): `--auth-choice minimax-global-api`
- API key MiniMax (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` untuk `minimax`; `MINIMAX_OAUTH_TOKEN` atau
  `MINIMAX_API_KEY` untuk `minimax-portal`

Lihat [/providers/minimax](/id/providers/minimax) untuk detail penyiapan, opsi model, dan cuplikan konfigurasi.

Pada jalur streaming MiniMax yang kompatibel dengan Anthropic, OpenClaw menonaktifkan thinking secara default
kecuali Anda secara eksplisit mengaturnya, dan `/fast on` menulis ulang
`MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.

Pembagian capability yang dimiliki plugin:

- Default teks/chat tetap pada `minimax/MiniMax-M2.7`
- Pembuatan gambar adalah `minimax/image-01` atau `minimax-portal/image-01`
- Pemahaman gambar adalah `MiniMax-VL-01` milik plugin pada kedua jalur autentikasi MiniMax
- Pencarian web tetap pada id provider `minimax`

### Ollama

Ollama dikirim sebagai plugin provider bawaan dan menggunakan API native Ollama:

- Provider: `ollama`
- Auth: Tidak diperlukan (server lokal)
- Contoh model: `ollama/llama3.3`
- Instalasi: [https://ollama.com/download](https://ollama.com/download)

```bash
# Instal Ollama, lalu pull sebuah model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama dideteksi secara lokal di `http://127.0.0.1:11434` saat Anda memilih ikut serta dengan
`OLLAMA_API_KEY`, dan plugin provider bawaan menambahkan Ollama langsung ke
`openclaw onboard` dan pemilih model. Lihat [/providers/ollama](/id/providers/ollama)
untuk onboarding, mode cloud/lokal, dan konfigurasi kustom.

### vLLM

vLLM dikirim sebagai plugin provider bawaan untuk server
yang kompatibel dengan OpenAI lokal/self-hosted:

- Provider: `vllm`
- Auth: Opsional (bergantung pada server Anda)
- Base URL default: `http://127.0.0.1:8000/v1`

Untuk ikut serta dalam auto-discovery secara lokal (nilai apa pun berfungsi jika server Anda tidak mewajibkan auth):

```bash
export VLLM_API_KEY="vllm-local"
```

Lalu setel sebuah model (ganti dengan salah satu ID yang dikembalikan oleh `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Lihat [/providers/vllm](/id/providers/vllm) untuk detail.

### SGLang

SGLang dikirim sebagai plugin provider bawaan untuk server
yang kompatibel dengan OpenAI self-hosted berkecepatan tinggi:

- Provider: `sglang`
- Auth: Opsional (bergantung pada server Anda)
- Base URL default: `http://127.0.0.1:30000/v1`

Untuk ikut serta dalam auto-discovery secara lokal (nilai apa pun berfungsi jika server Anda tidak
mewajibkan auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

Lalu setel sebuah model (ganti dengan salah satu ID yang dikembalikan oleh `/v1/models`):

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
      models: { "lmstudio/my-local-model": { alias: "Lokal" } },
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

- Untuk provider kustom, `reasoning`, `input`, `cost`, `contextWindow`, dan `maxTokens` bersifat opsional.
  Jika dihilangkan, OpenClaw default ke:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Disarankan: tetapkan nilai eksplisit yang sesuai dengan batas proxy/model Anda.
- Untuk `api: "openai-completions"` pada endpoint non-native (setiap `baseUrl` tidak kosong yang host-nya bukan `api.openai.com`), OpenClaw memaksa `compat.supportsDeveloperRole: false` untuk menghindari error provider 400 untuk peran `developer` yang tidak didukung.
- Rute gaya proxy yang kompatibel dengan OpenAI juga melewati pembentukan permintaan khusus OpenAI native:
  tidak ada `service_tier`, tidak ada Responses `store`, tidak ada petunjuk prompt-cache, tidak ada
  pembentukan payload kompatibilitas reasoning OpenAI, dan tidak ada header atribusi OpenClaw
  tersembunyi.
- Jika `baseUrl` kosong/tidak diisi, OpenClaw mempertahankan perilaku OpenAI default (yang meresolusikan ke `api.openai.com`).
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
- [Model Failover](/id/concepts/model-failover) — rantai fallback dan perilaku percobaan ulang
- [Configuration Reference](/id/gateway/configuration-reference#agent-defaults) — key konfigurasi model
- [Providers](/id/providers) — panduan penyiapan per provider
