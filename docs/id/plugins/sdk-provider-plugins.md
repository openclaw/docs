---
read_when:
    - Anda sedang membangun Plugin penyedia model baru
    - Anda ingin menambahkan proxy yang kompatibel dengan OpenAI atau LLM kustom ke OpenClaw
    - Anda perlu memahami autentikasi penyedia, katalog, dan hook runtime
sidebarTitle: Provider plugins
summary: Panduan langkah demi langkah untuk membangun Plugin penyedia model untuk OpenClaw
title: Membangun Plugin penyedia
x-i18n:
    generated_at: "2026-05-10T19:47:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1992653c8c6b079bbb6ea2b4f4b02dbd6a5a8aef286172af8048a7d9a98a8a4
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Panduan ini menjelaskan cara membangun Plugin penyedia yang menambahkan penyedia model
(LLM) ke OpenClaw. Pada akhirnya, Anda akan memiliki penyedia dengan katalog model,
autentikasi kunci API, dan resolusi model dinamis.

<Info>
  Jika Anda belum pernah membangun Plugin OpenClaw sebelumnya, baca
  [Memulai](/id/plugins/building-plugins) terlebih dahulu untuk struktur paket dasar
  dan penyiapan manifes.
</Info>

<Tip>
  Plugin penyedia menambahkan model ke loop inferensi normal OpenClaw. Jika model
  harus berjalan melalui daemon agen native yang memiliki thread, compaction, atau event
  alat, pasangkan penyedia dengan [harness agen](/id/plugins/sdk-agent-harness)
  alih-alih menaruh detail protokol daemon di core.
</Tip>

## Panduan Langkah demi Langkah

<Steps>
  <Step title="Paket dan manifes">
    ### Langkah 1: Paket dan manifes

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Acme AI model provider",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Manifes mendeklarasikan `providerAuthEnvVars` agar OpenClaw dapat mendeteksi
    kredensial tanpa memuat runtime Plugin Anda. Tambahkan `providerAuthAliases`
    ketika varian penyedia harus menggunakan ulang autentikasi dari id penyedia lain. `modelSupport`
    bersifat opsional dan memungkinkan OpenClaw memuat otomatis Plugin penyedia Anda dari
    id model singkat seperti `acme-large` sebelum hook runtime tersedia. Jika Anda menerbitkan
    penyedia di ClawHub, field `openclaw.compat` dan `openclaw.build` tersebut
    wajib ada di `package.json`.

  </Step>

  <Step title="Daftarkan penyedia">
    Penyedia teks minimal memerlukan `id`, `label`, `auth`, dan `catalog`.
    `catalog` adalah hook runtime/konfigurasi yang dimiliki penyedia; ia dapat memanggil API
    vendor live dan mengembalikan entri `models.providers`.

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });

        api.registerModelCatalogProvider({
          provider: "acme-ai",
          kinds: ["text"],
          liveCatalog: async (ctx) => {
            const apiKey = ctx.resolveProviderApiKey("acme-ai").apiKey;
            if (!apiKey) return null;
            return [
              {
                kind: "text",
                provider: "acme-ai",
                model: "acme-large",
                label: "Acme Large",
                source: "live",
              },
            ];
          },
        });
      },
    });
    ```

    `registerModelCatalogProvider` adalah surface katalog control-plane yang lebih baru
    untuk UI daftar/bantuan/pemilih. Gunakan ini untuk baris teks, pembuatan gambar,
    pembuatan video, dan pembuatan musik. Pertahankan panggilan endpoint vendor dan
    pemetaan respons di dalam Plugin; OpenClaw memiliki bentuk baris bersama, label
    sumber, dan rendering bantuan.

    Ini sudah menjadi penyedia yang berfungsi. Pengguna sekarang dapat menjalankan
    `openclaw onboard --acme-ai-api-key <key>` dan memilih
    `acme-ai/acme-large` sebagai model mereka.

    Jika penyedia upstream menggunakan token kontrol yang berbeda dari OpenClaw, tambahkan
    transformasi teks dua arah kecil alih-alih mengganti jalur stream:

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    `input` menulis ulang prompt sistem final dan konten pesan teks sebelum
    transport. `output` menulis ulang delta teks asisten dan teks final sebelum
    OpenClaw mem-parse marker kontrolnya sendiri atau pengiriman channel.

    Untuk penyedia bawaan yang hanya mendaftarkan satu penyedia teks dengan autentikasi
    kunci API plus satu runtime berbasis katalog, utamakan helper yang lebih sempit
    `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` adalah jalur katalog live yang digunakan ketika OpenClaw dapat menyelesaikan
    autentikasi penyedia nyata. Ia dapat melakukan discovery khusus penyedia. Gunakan
    `buildStaticProvider` hanya untuk baris offline yang aman ditampilkan sebelum autentikasi
    dikonfigurasi; ia tidak boleh memerlukan kredensial atau membuat permintaan jaringan.
    Tampilan `models list --all` OpenClaw saat ini mengeksekusi katalog statis
    hanya untuk Plugin penyedia bawaan, dengan konfigurasi kosong, env kosong, dan tanpa
    path agen/workspace.

    Jika alur autentikasi Anda juga perlu menambal `models.providers.*`, alias, dan
    model default agen selama onboarding, gunakan helper preset dari
    `openclaw/plugin-sdk/provider-onboard`. Helper yang paling sempit adalah
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, dan
    `createModelCatalogPresetAppliers(...)`.

    Ketika endpoint native penyedia mendukung blok penggunaan streamed pada
    transport `openai-completions` normal, utamakan helper katalog bersama di
    `openclaw/plugin-sdk/provider-catalog-shared` alih-alih melakukan hardcode
    pemeriksaan id penyedia. `supportsNativeStreamingUsageCompat(...)` dan
    `applyProviderNativeStreamingUsageCompat(...)` mendeteksi dukungan dari
    peta kapabilitas endpoint, sehingga endpoint native bergaya Moonshot/DashScope tetap
    ikut serta bahkan ketika Plugin menggunakan id penyedia kustom.

  </Step>

  <Step title="Tambahkan resolusi model dinamis">
    Jika penyedia Anda menerima ID model arbitrer (seperti proxy atau router),
    tambahkan `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog from above

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    Jika resolusi memerlukan panggilan jaringan, gunakan `prepareDynamicModel` untuk warm-up
    asinkron - `resolveDynamicModel` berjalan lagi setelah selesai.

  </Step>

  <Step title="Tambahkan hook runtime (sesuai kebutuhan)">
    Sebagian besar penyedia hanya memerlukan `catalog` + `resolveDynamicModel`. Tambahkan hook
    secara bertahap sesuai kebutuhan penyedia Anda.

    Builder helper bersama kini mencakup keluarga replay/tool-compat yang paling umum,
    sehingga Plugin biasanya tidak perlu merangkai setiap hook satu per satu secara manual:

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    Keluarga replay yang tersedia saat ini:

    | Keluarga | Yang dihubungkan | Contoh bawaan |
    | --- | --- | --- |
    | `openai-compatible` | Kebijakan pemutaran ulang bergaya OpenAI bersama untuk transport yang kompatibel dengan OpenAI, termasuk sanitasi id panggilan alat, perbaikan pengurutan yang dimulai asisten, dan validasi giliran Gemini generik saat transport membutuhkannya | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Kebijakan pemutaran ulang yang sadar Claude yang dipilih oleh `modelId`, sehingga transport pesan Anthropic hanya mendapat pembersihan blok pemikiran khusus Claude saat model yang diselesaikan benar-benar merupakan id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Kebijakan pemutaran ulang Gemini native ditambah sanitasi pemutaran ulang bootstrap dan mode keluaran penalaran bertag | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanitasi tanda tangan pemikiran Gemini untuk model Gemini yang berjalan melalui transport proksi yang kompatibel dengan OpenAI; tidak mengaktifkan validasi pemutaran ulang Gemini native atau penulisan ulang bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Kebijakan hibrida untuk penyedia yang mencampur permukaan model pesan Anthropic dan yang kompatibel dengan OpenAI dalam satu plugin; penghapusan blok pemikiran khusus Claude opsional tetap dibatasi pada sisi Anthropic | `minimax` |

    Keluarga aliran yang tersedia saat ini:

    | Keluarga | Yang dihubungkan | Contoh bawaan |
    | --- | --- | --- |
    | `google-thinking` | Normalisasi payload pemikiran Gemini pada jalur aliran bersama | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Pembungkus penalaran Kilo pada jalur aliran proksi bersama, dengan `kilo/auto` dan id penalaran proksi yang tidak didukung melewati pemikiran yang disisipkan | `kilocode` |
    | `moonshot-thinking` | Pemetaan payload pemikiran native biner Moonshot dari konfigurasi + level `/think` | `moonshot` |
    | `minimax-fast-mode` | Penulisan ulang model mode cepat MiniMax pada jalur aliran bersama | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Pembungkus OpenAI/Codex Responses native bersama: header atribusi, `/fast`/`serviceTier`, verbositas teks, pencarian web Codex native, pembentukan payload kompatibilitas penalaran, dan manajemen konteks Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Pembungkus penalaran OpenRouter untuk rute proksi, dengan pelewatan model yang tidak didukung/`auto` ditangani secara terpusat | `openrouter` |
    | `tool-stream-default-on` | Pembungkus `tool_stream` aktif secara default untuk penyedia seperti Z.AI yang menginginkan streaming alat kecuali dinonaktifkan secara eksplisit | `zai` |

    <Accordion title="Seam SDK yang mendukung pembangun keluarga">
      Setiap pembangun keluarga disusun dari helper publik tingkat lebih rendah yang diekspor dari paket yang sama, yang dapat Anda gunakan saat penyedia perlu keluar dari pola umum:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, dan pembangun pemutaran ulang mentah (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Juga mengekspor helper pemutaran ulang Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) dan helper endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, ditambah pembungkus OpenAI/Codex bersama (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), pembungkus kompatibel OpenAI DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), pembersihan praisi pemikiran Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), dan pembungkus proksi/penyedia bersama (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, dan helper skema Gemini yang mendasarinya (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`).

      Beberapa helper aliran sengaja tetap lokal penyedia. `@openclaw/anthropic-provider` mempertahankan `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, dan pembangun pembungkus Anthropic tingkat lebih rendah dalam seam publik `api.ts` / `contract-api.ts` miliknya sendiri karena semuanya mengodekan penanganan beta OAuth Claude dan gating `context1m`. Plugin xAI juga mempertahankan pembentukan xAI Responses native dalam `wrapStreamFn` miliknya sendiri (alias `/fast`, `tool_stream` default, pembersihan strict-tool yang tidak didukung, penghapusan payload penalaran khusus xAI).

      Pola root paket yang sama juga mendukung `@openclaw/openai-provider` (pembangun penyedia, helper model default, pembangun penyedia realtime) dan `@openclaw/openrouter-provider` (pembangun penyedia ditambah helper onboarding/konfigurasi).
    </Accordion>

    <Tabs>
      <Tab title="Pertukaran token">
        Untuk penyedia yang memerlukan pertukaran token sebelum setiap panggilan inferensi:

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="Header khusus">
        Untuk penyedia yang memerlukan header permintaan khusus atau modifikasi isi:

        ```typescript
        // wrapStreamFn returns a StreamFn derived from ctx.streamFn
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="Identitas transport native">
        Untuk penyedia yang memerlukan header atau metadata permintaan/sesi native pada
        transport HTTP atau WebSocket generik:

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="Penggunaan dan penagihan">
        Untuk penyedia yang mengekspos data penggunaan/penagihan:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```
      </Tab>
    </Tabs>

    <Accordion title="Semua hook penyedia yang tersedia">
      OpenClaw memanggil hook dalam urutan ini. Sebagian besar penyedia hanya menggunakan 2-3:
      Field penyedia khusus kompatibilitas yang tidak lagi dipanggil OpenClaw, seperti
      `ProviderPlugin.capabilities` dan `suppressBuiltInModel`, tidak dicantumkan
      di sini.

      | # | Hook | Kapan digunakan |
      | --- | --- | --- |
      | 1 | `catalog` | Katalog model atau default URL dasar |
      | 2 | `applyConfigDefaults` | Default global milik penyedia selama materialisasi konfigurasi |
      | 3 | `normalizeModelId` | Pembersihan alias id model legacy/pratinjau sebelum pencarian |
      | 4 | `normalizeTransport` | Pembersihan `api` / `baseUrl` keluarga penyedia sebelum perakitan model generik |
      | 5 | `normalizeConfig` | Menormalkan konfigurasi `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Penulisan ulang kompatibilitas penggunaan streaming native untuk penyedia konfigurasi |
      | 7 | `resolveConfigApiKey` | Resolusi autentikasi penanda env milik penyedia |
      | 8 | `resolveSyntheticAuth` | Autentikasi sintetis lokal/self-hosted atau berbasis konfigurasi |
      | 9 | `shouldDeferSyntheticProfileAuth` | Menurunkan placeholder profil tersimpan sintetis di belakang autentikasi env/konfigurasi |
      | 10 | `resolveDynamicModel` | Menerima ID model upstream arbitrer |
      | 11 | `prepareDynamicModel` | Pengambilan metadata asinkron sebelum menyelesaikan |
      | 12 | `normalizeResolvedModel` | Penulisan ulang transport sebelum runner |
      | 13 | `contributeResolvedModelCompat` | Flag kompatibilitas untuk model vendor di balik transport kompatibel lain |
      | 14 | `normalizeToolSchemas` | Pembersihan skema alat milik penyedia sebelum pendaftaran |
      | 15 | `inspectToolSchemas` | Diagnostik skema alat milik penyedia |
      | 16 | `resolveReasoningOutputMode` | Kontrak keluaran penalaran bertag vs native |
      | 17 | `prepareExtraParams` | Parameter permintaan default |
      | 18 | `createStreamFn` | Transport StreamFn kustom sepenuhnya |
      | 19 | `wrapStreamFn` | Pembungkus header/isi khusus pada jalur aliran normal |
      | 20 | `resolveTransportTurnState` | Header/metadata native per giliran |
      | 21 | `resolveWebSocketSessionPolicy` | Header/cool-down sesi WS native |
      | 22 | `formatApiKey` | Bentuk token runtime khusus |
      | 23 | `refreshOAuth` | Refresh OAuth khusus |
      | 24 | `buildAuthDoctorHint` | Panduan perbaikan autentikasi |
      | 25 | `matchesContextOverflowError` | Deteksi overflow milik penyedia |
      | 26 | `classifyFailoverReason` | Klasifikasi batas laju/kelebihan beban milik penyedia |
      | 27 | `isCacheTtlEligible` | Gating TTL cache prompt |
      | 28 | `buildMissingAuthMessage` | Petunjuk autentikasi hilang khusus |
      | 29 | `augmentModelCatalog` | Baris forward-compat sintetis |
      | 30 | `resolveThinkingProfile` | Set opsi `/think` khusus model |
      | 31 | `isBinaryThinking` | Kompatibilitas pemikiran biner aktif/nonaktif |
      | 32 | `supportsXHighThinking` | Kompatibilitas dukungan penalaran `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Kompatibilitas kebijakan `/think` default |
      | 34 | `isModernModelRef` | Pencocokan model live/smoke |
      | 35 | `prepareRuntimeAuth` | Pertukaran token sebelum inferensi |
      | 36 | `resolveUsageAuth` | Penguraian kredensial penggunaan khusus |
      | 37 | `fetchUsageSnapshot` | Endpoint penggunaan khusus |
      | 38 | `createEmbeddingProvider` | Adapter embedding milik penyedia untuk memori/pencarian |
      | 39 | `buildReplayPolicy` | Kebijakan pemutaran ulang/Compaction transkrip khusus |
      | 40 | `sanitizeReplayHistory` | Penulisan ulang pemutaran ulang khusus penyedia setelah pembersihan generik |
      | 41 | `validateReplayTurns` | Validasi giliran pemutaran ulang ketat sebelum runner tertanam |
      | 42 | `onModelSelected` | Callback pasca-pemilihan (mis. telemetri) |

      Catatan fallback runtime:

      - `normalizeConfig` memeriksa penyedia yang cocok terlebih dahulu, lalu plugin penyedia lain yang mendukung hook sampai ada yang benar-benar mengubah konfigurasi. Jika tidak ada hook penyedia yang menulis ulang entri konfigurasi keluarga Google yang didukung, normalizer konfigurasi Google bawaan tetap diterapkan.
      - `resolveConfigApiKey` menggunakan hook penyedia saat diekspos. Jalur `amazon-bedrock` bawaan juga memiliki resolver penanda env AWS bawaan di sini, meskipun autentikasi runtime Bedrock sendiri tetap menggunakan rantai default AWS SDK.
      - `resolveSystemPromptContribution` memungkinkan penyedia menyisipkan panduan prompt sistem yang sadar cache untuk keluarga model. Pilih ini daripada `before_prompt_build` saat perilaku menjadi milik satu keluarga penyedia/model dan harus mempertahankan pemisahan cache stabil/dinamis.

      Untuk deskripsi terperinci dan contoh dunia nyata, lihat [Internal: Hook Runtime Penyedia](/id/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Tambahkan kapabilitas ekstra (opsional)">
    ### Langkah 5: Tambahkan kapabilitas ekstra

    Plugin penyedia dapat mendaftarkan speech, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar, pembuatan video, web fetch,
    dan pencarian web bersama inferensi teks. OpenClaw mengklasifikasikan ini sebagai
    plugin **hybrid-capability** - pola yang direkomendasikan untuk plugin perusahaan
    (satu plugin per vendor). Lihat
    [Internal: Kepemilikan Kapabilitas](/id/plugins/architecture#capability-ownership-model).

    Daftarkan setiap kapabilitas di dalam `register(api)` bersama panggilan
    `api.registerProvider(...)` yang sudah ada. Pilih hanya tab yang Anda perlukan:

    <Tabs>
      <Tab title="Speech (TTS)">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => {
            const { response, release } = await postJsonRequest({
              url: "https://api.example.com/v1/speech",
              headers: new Headers({ "Content-Type": "application/json" }),
              body: { text: req.text },
              timeoutMs: req.timeoutMs,
              fetchFn: fetch,
              auditContext: "acme speech",
            });
            try {
              await assertOkOrThrowProviderError(response, "Acme Speech API error");
              return {
                audioBuffer: Buffer.from(await response.arrayBuffer()),
                outputFormat: "mp3",
                fileExtension: ".mp3",
                voiceCompatible: false,
              };
            } finally {
              await release();
            }
          },
        });
        ```

        Gunakan `assertOkOrThrowProviderError(...)` untuk kegagalan HTTP penyedia agar
        plugin berbagi pembacaan isi galat yang dibatasi, parsing galat JSON, dan
        sufiks ID permintaan.
      </Tab>
      <Tab title="Transkripsi realtime">
        Utamakan `createRealtimeTranscriptionWebSocketSession(...)` - helper bersama
        menangani capture proxy, backoff koneksi ulang, flushing saat close, handshake
        ready, antrean audio, dan diagnostik event close. Plugin Anda
        hanya memetakan event upstream.

        ```typescript
        api.registerRealtimeTranscriptionProvider({
          id: "acme-ai",
          label: "Acme Realtime Transcription",
          isConfigured: () => true,
          createSession: (req) => {
            const apiKey = String(req.providerConfig.apiKey ?? "");
            return createRealtimeTranscriptionWebSocketSession({
              providerId: "acme-ai",
              callbacks: req,
              url: "wss://api.example.com/v1/realtime-transcription",
              headers: { Authorization: `Bearer ${apiKey}` },
              onMessage: (event, transport) => {
                if (event.type === "session.created") {
                  transport.sendJson({ type: "session.update" });
                  transport.markReady();
                  return;
                }
                if (event.type === "transcript.final") {
                  req.onTranscript?.(event.text);
                }
              },
              sendAudio: (audio, transport) => {
                transport.sendJson({
                  type: "audio.append",
                  audio: audio.toString("base64"),
                });
              },
              onClose: (transport) => {
                transport.sendJson({ type: "audio.end" });
              },
            });
          },
        });
        ```

        Penyedia STT batch yang mengirim audio multipart melalui POST harus menggunakan
        `buildAudioTranscriptionFormData(...)` dari
        `openclaw/plugin-sdk/provider-http`. Helper ini menormalkan nama file unggahan,
        termasuk unggahan AAC yang memerlukan nama file bergaya M4A untuk
        API transkripsi yang kompatibel.
      </Tab>
      <Tab title="Suara realtime">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          capabilities: {
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            supportsBargeIn: true,
            supportsToolCalls: true,
          },
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Set this only if the provider accepts multiple tool responses for
            // one call, for example an immediate "working" response followed by
            // the final result.
            supportsToolResultContinuation: false,
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            handleBargeIn: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```

        Deklarasikan `capabilities` agar `talk.catalog` dapat mengekspos mode,
        transport, format audio, dan flag fitur yang valid ke klien Talk browser
        dan native. Implementasikan `handleBargeIn` ketika transport dapat mendeteksi bahwa
        manusia sedang menyela pemutaran asisten dan penyedia mendukung
        pemotongan atau pembersihan respons audio yang aktif.
      </Tab>
      <Tab title="Pemahaman media">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Pembuatan gambar dan video">
        Kapabilitas video menggunakan bentuk **mode-aware**: `generate`,
        `imageToVideo`, dan `videoToVideo`. Field agregat datar seperti
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` tidak
        cukup untuk mengiklankan dukungan mode transformasi atau mode yang dinonaktifkan dengan bersih.
        Pembuatan musik mengikuti pola yang sama dengan blok `generate` /
        `edit` yang eksplisit.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: {
              enabled: true,
              maxVideos: 1,
              maxInputImages: 1,
              maxInputImagesByModel: { "acme/reference-to-video": 9 },
              maxDurationSeconds: 5,
            },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Web fetch dan pencarian">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Fetch pages through Acme's rendering backend.",
          envVars: ["ACME_FETCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/fetch",
          credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
          getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
          setCredentialValue: (fetchConfigTarget, value) => {
            const acme = (fetchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Fetch a page through Acme Fetch.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Acme Search",
          search: async (req) => ({ content: [] }),
        });
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="Uji">
    ### Langkah 6: Uji

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Export your provider config object from index.ts or a dedicated file
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## Publikasikan ke ClawHub

Plugin penyedia dipublikasikan dengan cara yang sama seperti plugin kode eksternal lainnya:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Jangan gunakan alias publikasi lama yang hanya untuk skill di sini; paket plugin harus menggunakan
`clawhub package publish`.

## Struktur file

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Referensi urutan katalog

`catalog.order` mengontrol kapan katalog Anda digabungkan relatif terhadap penyedia bawaan:

| Urutan    | Kapan         | Kasus penggunaan                              |
| --------- | ------------- | --------------------------------------------- |
| `simple`  | Pass pertama  | Penyedia API key biasa                        |
| `profile` | Setelah simple | Penyedia yang dibatasi profil auth            |
| `paired`  | Setelah profile | Mensintesis beberapa entri terkait            |
| `late`    | Pass terakhir | Menimpa penyedia yang ada (menang saat konflik) |

## Langkah berikutnya

- [Plugin Channel](/id/plugins/sdk-channel-plugins) - jika plugin Anda juga menyediakan channel
- [Runtime SDK](/id/plugins/sdk-runtime) - helper `api.runtime` (TTS, pencarian, subagent)
- [Ikhtisar SDK](/id/plugins/sdk-overview) - referensi impor subpath lengkap
- [Internal Plugin](/id/plugins/architecture-internals#provider-runtime-hooks) - detail hook dan contoh bawaan

## Terkait

- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)
- [Membangun plugin channel](/id/plugins/sdk-channel-plugins)
