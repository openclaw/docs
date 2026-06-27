---
read_when:
    - Anda sedang membangun plugin penyedia model baru
    - Anda ingin menambahkan proksi yang kompatibel dengan OpenAI atau LLM kustom ke OpenClaw
    - Anda perlu memahami autentikasi penyedia, katalog, dan hook runtime
sidebarTitle: Provider plugins
summary: Panduan langkah demi langkah untuk membangun Plugin penyedia model untuk OpenClaw
title: Membangun plugin penyedia
x-i18n:
    generated_at: "2026-06-27T17:58:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Panduan ini menjelaskan cara membangun Plugin penyedia yang menambahkan penyedia model
(LLM) ke OpenClaw. Pada akhirnya Anda akan memiliki penyedia dengan katalog model,
autentikasi kunci API, dan resolusi model dinamis.

<Info>
  Jika Anda belum pernah membangun Plugin OpenClaw sebelumnya, baca
  [Memulai](/id/plugins/building-plugins) terlebih dahulu untuk struktur paket
  dasar dan penyiapan manifes.
</Info>

<Tip>
  Plugin penyedia menambahkan model ke loop inferensi normal OpenClaw. Jika model
  harus berjalan melalui daemon agen native yang memiliki thread, compaction, atau event
  alat, pasangkan penyedia dengan [harness agen](/id/plugins/sdk-agent-harness)
  alih-alih menaruh detail protokol daemon di core.
</Tip>

## Panduan langkah demi langkah

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
      "setup": {
        "providers": [
          {
            "id": "acme-ai",
            "envVars": ["ACME_AI_API_KEY"]
          }
        ]
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

    Manifes mendeklarasikan `setup.providers[].envVars` agar OpenClaw dapat mendeteksi
    kredensial tanpa memuat runtime Plugin Anda. Tambahkan `providerAuthAliases`
    saat varian penyedia harus menggunakan ulang autentikasi milik id penyedia lain. `modelSupport`
    bersifat opsional dan memungkinkan OpenClaw memuat otomatis Plugin penyedia Anda dari
    id model singkat seperti `acme-large` sebelum hook runtime tersedia. Jika Anda menerbitkan
    penyedia di ClawHub, kolom `openclaw.compat` dan `openclaw.build` tersebut
    wajib ada di `package.json`.

  </Step>

  <Step title="Daftarkan penyedia">
    Penyedia teks minimal memerlukan `id`, `label`, `auth`, dan `catalog`.
    `catalog` adalah hook runtime/konfigurasi milik penyedia; hook ini dapat memanggil
    API vendor live dan mengembalikan entri `models.providers`.

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

    `registerModelCatalogProvider` adalah permukaan katalog control-plane yang lebih baru
    untuk UI daftar/bantuan/pemilih. Gunakan ini untuk baris teks, pembuatan gambar,
    pembuatan video, dan pembuatan musik. Simpan panggilan endpoint vendor dan
    pemetaan respons di Plugin; OpenClaw memiliki bentuk baris bersama, label
    sumber, dan rendering bantuan.

    Itu adalah penyedia yang berfungsi. Pengguna sekarang dapat menjalankan
    `openclaw onboard --acme-ai-api-key <key>` dan memilih
    `acme-ai/acme-large` sebagai model mereka.

    ### Penemuan model live

    Jika penyedia Anda mengekspos API bergaya `/models`, simpan endpoint khusus
    penyedia dan proyeksi baris di Plugin Anda dan gunakan
    `openclaw/plugin-sdk/provider-catalog-live-runtime` untuk siklus hidup fetch
    bersama. Helper ini memberi Anda fetch HTTP yang dijaga, header autentikasi penyedia,
    error HTTP terstruktur, caching TTL, dan perilaku fallback statis tanpa
    menaruh kebijakan penyedia di core OpenClaw.

    Gunakan `buildLiveModelProviderConfig` saat API live hanya memberi tahu Anda baris
    katalog statis milik penyedia mana yang saat ini tersedia:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      buildLiveModelProviderConfig,
      type LiveModelCatalogFetchGuard,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    const STATIC_MODELS = [
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
    ] as const;

    async function buildAcmeLiveProvider(params: {
      apiKey: string;
      discoveryApiKey?: string;
      fetchGuard?: LiveModelCatalogFetchGuard;
    }) {
      return await buildLiveModelProviderConfig({
        providerId: "acme-ai",
        endpoint: "https://api.acme-ai.com/v1/models",
        providerConfig: {
          baseUrl: "https://api.acme-ai.com/v1",
          api: "openai-completions",
        },
        models: STATIC_MODELS,
        apiKey: params.apiKey,
        discoveryApiKey: params.discoveryApiKey,
        fetchGuard: params.fetchGuard,
        ttlMs: 60_000,
        auditContext: "acme-ai-model-discovery",
      });
    }

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          catalog: {
            order: "simple",
            run: async (ctx) => {
              const auth = ctx.resolveProviderAuth("acme-ai");
              const apiKey =
                auth.apiKey ?? ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: await buildAcmeLiveProvider({
                  apiKey,
                  discoveryApiKey: auth.discoveryApiKey,
                }),
              };
            },
          },
          staticCatalog: {
            order: "simple",
            run: async () => ({
              provider: {
                baseUrl: "https://api.acme-ai.com/v1",
                api: "openai-completions",
                models: [...STATIC_MODELS],
              },
            }),
          },
        });
      },
    });
    ```

    Gunakan `getCachedLiveProviderModelRows` saat API penyedia mengembalikan metadata
    yang lebih kaya dan Plugin perlu memproyeksikan baris ke definisi model
    OpenClaw sendiri:

    ```typescript index.ts
    import {
      getCachedLiveProviderModelRows,
      LiveModelCatalogHttpError,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    async function discoverAcmeModels(apiKey: string) {
      try {
        const rows = await getCachedLiveProviderModelRows({
          providerId: "acme-ai",
          endpoint: "https://api.acme-ai.com/v1/models",
          apiKey,
          ttlMs: 60_000,
          auditContext: "acme-ai-model-discovery",
        });
        return rows
          .map((row) => projectAcmeModel(row))
          .filter((model) => model !== null);
      } catch (error) {
        if (error instanceof LiveModelCatalogHttpError) {
          return STATIC_MODELS;
        }
        throw error;
      }
    }
    ```

    `run` harus tetap dijaga oleh autentikasi dan mengembalikan `null` saat tidak ada
    kredensial yang dapat digunakan. Pertahankan `staticRun` offline atau fallback statis agar penyiapan, docs,
    tests, dan permukaan pemilih tidak bergantung pada akses jaringan live. Gunakan TTL
    yang sesuai untuk kesegaran daftar model, hindari polling filesystem pada waktu request,
    dan teruskan `readRows` / `readModelId` khusus penyedia hanya saat
    respons upstream bukan bentuk `{ data: [{ id, object }] }` yang kompatibel dengan OpenAI.

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
    OpenClaw mengurai penanda kontrolnya sendiri atau pengiriman channel.

    Untuk penyedia bundled yang hanya mendaftarkan satu penyedia teks dengan autentikasi
    kunci API ditambah satu runtime berbasis katalog, lebih pilih helper yang lebih sempit
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

    `buildProvider` adalah jalur katalog langsung yang digunakan saat OpenClaw dapat menyelesaikan auth
    penyedia yang nyata. Jalur ini dapat melakukan penemuan khusus penyedia. Gunakan
    `buildStaticProvider` hanya untuk baris offline yang aman ditampilkan sebelum auth
    dikonfigurasi; jalur ini tidak boleh memerlukan kredensial atau membuat permintaan jaringan.
    Tampilan `models list --all` OpenClaw saat ini menjalankan katalog statis
    hanya untuk Plugin penyedia bawaan, dengan config kosong, env kosong, dan tanpa
    jalur agen/workspace.

    Jika alur auth Anda juga perlu menambal `models.providers.*`, alias, dan
    model default agen selama onboarding, gunakan helper preset dari
    `openclaw/plugin-sdk/provider-onboard`. Helper tersempit adalah
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, dan
    `createModelCatalogPresetAppliers(...)`.

    Saat endpoint native penyedia mendukung blok penggunaan streaming pada
    transport `openai-completions` normal, lebih pilih helper katalog bersama di
    `openclaw/plugin-sdk/provider-catalog-shared` daripada melakukan hardcode
    pemeriksaan provider-id. `supportsNativeStreamingUsageCompat(...)` dan
    `applyProviderNativeStreamingUsageCompat(...)` mendeteksi dukungan dari
    peta kapabilitas endpoint, sehingga endpoint native bergaya Moonshot/DashScope tetap
    ikut serta bahkan saat sebuah Plugin menggunakan id penyedia kustom.

    Contoh penemuan langsung di atas mencakup API penyedia bergaya `/models`. Simpan
    penemuan tersebut di dalam `catalog.run`, dibatasi pada auth yang dapat digunakan, dan jaga
    `staticRun` bebas jaringan untuk pembuatan katalog offline.

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
    async - `resolveDynamicModel` berjalan lagi setelah selesai.

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

    | Keluarga | Yang dirangkai | Contoh bawaan |
    | --- | --- | --- |
    | `openai-compatible` | Kebijakan replay bergaya OpenAI bersama untuk transport kompatibel OpenAI, termasuk sanitasi tool-call-id, perbaikan urutan assistant-first, dan validasi turn Gemini generik saat transport membutuhkannya | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Kebijakan replay sadar-Claude yang dipilih oleh `modelId`, sehingga transport pesan Anthropic hanya mendapatkan pembersihan blok thinking khusus Claude saat model yang terselesaikan benar-benar merupakan id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Kebijakan replay native Gemini plus sanitasi replay bootstrap. Keluarga bersama mempertahankan Gemini CLI keluaran teks pada reasoning bertag; penyedia `google` langsung menimpa `resolveReasoningOutputMode` menjadi `native` karena thinking Gemini API hadir sebagai bagian thought native. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanitasi thought-signature Gemini untuk model Gemini yang berjalan melalui transport proxy kompatibel OpenAI; tidak mengaktifkan validasi replay native Gemini atau penulisan ulang bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Kebijakan hibrida untuk penyedia yang mencampur permukaan model pesan Anthropic dan kompatibel OpenAI dalam satu Plugin; penghapusan blok thinking khusus Claude opsional tetap dibatasi pada sisi Anthropic | `minimax` |

    Keluarga stream yang tersedia saat ini:

    | Keluarga | Yang dirangkai | Contoh bawaan |
    | --- | --- | --- |
    | `google-thinking` | Normalisasi payload thinking Gemini pada jalur stream bersama | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper reasoning Kilo pada jalur stream proxy bersama, dengan `kilo/auto` dan id reasoning proxy yang tidak didukung melewati thinking yang diinjeksi | `kilocode` |
    | `moonshot-thinking` | Pemetaan payload native-thinking biner Moonshot dari config + level `/think` | `moonshot` |
    | `minimax-fast-mode` | Penulisan ulang model mode cepat MiniMax pada jalur stream bersama | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrapper Responses native OpenAI/Codex bersama: header atribusi, `/fast`/`serviceTier`, verbositas teks, pencarian web native Codex, pembentukan payload kompatibilitas reasoning, dan manajemen konteks Responses | `openai` |
    | `openrouter-thinking` | Wrapper reasoning OpenRouter untuk rute proxy, dengan lompatan unsupported-model/`auto` ditangani secara terpusat | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` aktif secara default untuk penyedia seperti Z.AI yang menginginkan streaming tool kecuali dinonaktifkan secara eksplisit | `zai` |

    <Accordion title="Seam SDK yang mendukung builder keluarga">
      Setiap builder keluarga disusun dari helper publik tingkat lebih rendah yang diekspor dari paket yang sama, yang dapat Anda gunakan saat penyedia perlu keluar dari pola umum:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, dan builder replay mentah (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Juga mengekspor helper replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) dan helper endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, plus wrapper OpenAI/Codex bersama (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper kompatibel OpenAI DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), pembersihan prefill thinking Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), kompatibilitas tool-call teks polos (`createPlainTextToolCallCompatWrapper`), dan wrapper proxy/penyedia bersama (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - wrapper payload dan event ringan untuk jalur penyedia panas, termasuk `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)`, dan `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`, dan helper skema penyedia yang mendasarinya.

      Untuk penyedia keluarga Gemini, jaga mode keluaran reasoning tetap selaras dengan
      transport. Penyedia Google Gemini API langsung sebaiknya menggunakan keluaran reasoning
      `native` sehingga OpenClaw mengonsumsi bagian thought native tanpa menambahkan
      direktif prompt `<think>` / `<final>`. Backend bergaya Gemini CLI khusus teks
      yang mengurai respons akhir JSON/teks dapat mempertahankan kontrak bertag
      `google-gemini` bersama.

      Beberapa helper stream tetap bersifat lokal penyedia dengan sengaja. `@openclaw/anthropic-provider` mempertahankan `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, dan builder wrapper Anthropic tingkat lebih rendah di seam publik `api.ts` / `contract-api.ts` miliknya sendiri karena helper tersebut mengodekan penanganan beta Claude OAuth dan pembatasan `context1m`. Plugin xAI juga mempertahankan pembentukan Responses native xAI di `wrapStreamFn` miliknya sendiri (alias `/fast`, default `tool_stream`, pembersihan strict-tool yang tidak didukung, penghapusan payload reasoning khusus xAI).

      Pola package-root yang sama juga mendukung `@openclaw/openai-provider` (builder penyedia, helper model default, builder penyedia realtime) dan `@openclaw/openrouter-provider` (builder penyedia plus helper onboarding/config).
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
      <Tab title="Header kustom">
        Untuk penyedia yang memerlukan header permintaan kustom atau modifikasi body:

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
      <Tab title="Usage and billing">
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

        `resolveUsageAuth` memiliki tiga hasil. Kembalikan `{ token, accountId? }`
        ketika penyedia memiliki kredensial penggunaan/penagihan. Kembalikan
        `{ handled: true }` hanya ketika penyedia sudah secara definitif menangani auth
        penggunaan tetapi tidak memiliki token penggunaan yang dapat dipakai, dan OpenClaw harus melewati fallback
        kunci API/OAuth generik. Kembalikan `null` atau `undefined` ketika penyedia
        tidak menangani permintaan dan OpenClaw harus melanjutkan dengan fallback generik.
      </Tab>
    </Tabs>

    <Accordion title="All available provider hooks">
      OpenClaw memanggil hook dalam urutan ini. Sebagian besar penyedia hanya menggunakan 2-3:
      Field penyedia khusus kompatibilitas yang tidak lagi dipanggil OpenClaw, seperti
      `ProviderPlugin.capabilities` dan `suppressBuiltInModel`, tidak dicantumkan
      di sini.

      | # | Hook | Kapan digunakan |
      | --- | --- | --- |
      | 1 | `catalog` | Katalog model atau default URL dasar |
      | 2 | `applyConfigDefaults` | Default global milik penyedia selama materialisasi konfigurasi |
      | 3 | `normalizeModelId` | Pembersihan alias ID model lama/pratinjau sebelum pencarian |
      | 4 | `normalizeTransport` | Pembersihan `api` / `baseUrl` keluarga penyedia sebelum perakitan model generik |
      | 5 | `normalizeConfig` | Menormalisasi konfigurasi `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Penulisan ulang kompat streaming-usage native untuk penyedia konfigurasi |
      | 7 | `resolveConfigApiKey` | Resolusi auth penanda env milik penyedia |
      | 8 | `resolveSyntheticAuth` | Auth sintetis lokal/self-hosted atau berbasis konfigurasi |
      | 9 | `shouldDeferSyntheticProfileAuth` | Menurunkan placeholder profil tersimpan sintetis di belakang auth env/konfigurasi |
      | 10 | `resolveDynamicModel` | Menerima ID model upstream arbitrer |
      | 11 | `prepareDynamicModel` | Pengambilan metadata asinkron sebelum resolusi |
      | 12 | `normalizeResolvedModel` | Penulisan ulang transport sebelum runner |
      | 13 | `normalizeToolSchemas` | Pembersihan skema alat milik penyedia sebelum registrasi |
      | 14 | `inspectToolSchemas` | Diagnostik skema alat milik penyedia |
      | 15 | `resolveReasoningOutputMode` | Kontrak keluaran reasoning bertag vs native |
      | 16 | `prepareExtraParams` | Parameter permintaan default |
      | 17 | `createStreamFn` | Transport StreamFn kustom penuh |
      | 19 | `wrapStreamFn` | Pembungkus header/body kustom pada jalur stream normal |
      | 20 | `resolveTransportTurnState` | Header/metadata native per giliran |
      | 21 | `resolveWebSocketSessionPolicy` | Header/masa jeda sesi WS native |
      | 22 | `formatApiKey` | Bentuk token runtime kustom |
      | 23 | `refreshOAuth` | Refresh OAuth kustom |
      | 24 | `buildAuthDoctorHint` | Panduan perbaikan auth |
      | 25 | `matchesContextOverflowError` | Deteksi overflow milik penyedia |
      | 26 | `classifyFailoverReason` | Klasifikasi rate-limit/overload milik penyedia |
      | 27 | `isCacheTtlEligible` | Pembatasan TTL cache prompt |
      | 28 | `buildMissingAuthMessage` | Petunjuk auth hilang kustom |
      | 29 | `augmentModelCatalog` | Baris forward-compat sintetis |
      | 30 | `resolveThinkingProfile` | Set opsi `/think` spesifik model |
      | 31 | `isBinaryThinking` | Kompatibilitas thinking biner aktif/nonaktif |
      | 32 | `supportsXHighThinking` | Kompatibilitas dukungan reasoning `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Kompatibilitas kebijakan `/think` default |
      | 34 | `isModernModelRef` | Pencocokan model live/smoke |
      | 35 | `prepareRuntimeAuth` | Pertukaran token sebelum inferensi |
      | 36 | `resolveUsageAuth` | Parsing kredensial penggunaan kustom |
      | 37 | `fetchUsageSnapshot` | Endpoint penggunaan kustom |
      | 38 | `createEmbeddingProvider` | Adapter embedding milik penyedia untuk memori/pencarian |
      | 39 | `buildReplayPolicy` | Kebijakan pemutaran ulang/Compaction transkrip kustom |
      | 40 | `sanitizeReplayHistory` | Penulisan ulang pemutaran ulang spesifik penyedia setelah pembersihan generik |
      | 41 | `validateReplayTurns` | Validasi giliran pemutaran ulang ketat sebelum runner tertanam |
      | 42 | `onModelSelected` | Callback pasca-pemilihan (mis. telemetri) |

      Catatan fallback runtime:

      - `normalizeConfig` memeriksa penyedia yang cocok terlebih dahulu, lalu Plugin penyedia lain yang mendukung hook hingga salah satunya benar-benar mengubah konfigurasi. Jika tidak ada hook penyedia yang menulis ulang entri konfigurasi keluarga Google yang didukung, normalizer konfigurasi Google bawaan tetap diterapkan.
      - `resolveConfigApiKey` menggunakan hook penyedia saat diekspos. Amazon Bedrock mempertahankan resolusi penanda env AWS di Plugin penyedianya; auth runtime itu sendiri tetap menggunakan rantai default AWS SDK saat dikonfigurasi dengan `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` menerima `provider`, `modelId`, petunjuk katalog `reasoning` gabungan opsional, dan fakta `compat` model gabungan opsional yang dipilih. Gunakan `compat` hanya untuk memilih UI/profil thinking milik penyedia.
      - `resolveSystemPromptContribution` memungkinkan penyedia menyuntikkan panduan prompt sistem yang sadar cache untuk keluarga model. Lebih pilih ini daripada `before_prompt_build` ketika perilaku tersebut milik satu penyedia/keluarga model dan harus mempertahankan pemisahan cache stabil/dinamis.

      Untuk deskripsi terperinci dan contoh dunia nyata, lihat [Internal: Hook Runtime Penyedia](/id/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    ### Langkah 5: Tambahkan kapabilitas ekstra

    Plugin penyedia dapat mendaftarkan embedding, speech, transkripsi realtime,
    suara realtime, pemahaman media, pembuatan gambar, pembuatan video,
    web fetch, dan web search bersama inferensi teks. OpenClaw mengklasifikasikan ini sebagai
    Plugin **hybrid-capability** - pola yang direkomendasikan untuk Plugin perusahaan
    (satu Plugin per vendor). Lihat
    [Internal: Kepemilikan Kapabilitas](/id/plugins/architecture#capability-ownership-model).

    Daftarkan setiap kapabilitas di dalam `register(api)` bersama panggilan
    `api.registerProvider(...)` yang sudah ada. Pilih hanya tab yang Anda butuhkan:

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
          defaultTimeoutMs: 120_000,
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
        Plugin berbagi pembacaan body error yang dibatasi, parsing error JSON, dan
        sufiks ID permintaan.
      </Tab>
      <Tab title="Realtime transcription">
        Lebih pilih `createRealtimeTranscriptionWebSocketSession(...)` - helper bersama
        menangani penangkapan proxy, backoff koneksi ulang, flushing saat tutup, handshake
        siap, antrean audio, dan diagnostik event penutupan. Plugin Anda
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

        Penyedia STT batch yang melakukan POST audio multipart harus menggunakan
        `buildAudioTranscriptionFormData(...)` dari
        `openclaw/plugin-sdk/provider-http`. Helper ini menormalisasi nama file unggahan,
        termasuk unggahan AAC yang membutuhkan nama file bergaya M4A untuk
        API transkripsi yang kompatibel.
      </Tab>
      <Tab title="Realtime voice">
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
        dan native. Implementasikan `handleBargeIn` ketika suatu transport dapat mendeteksi bahwa
        manusia sedang menginterupsi pemutaran asisten dan penyedia mendukung
        pemotongan atau penghapusan respons audio aktif.
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

        Penyedia media lokal atau self-hosted yang secara sengaja tidak memerlukan
        kredensial dapat mengekspos `resolveAuth` dan mengembalikan `kind: "none"`.
        OpenClaw tetap mempertahankan gate auth normal untuk penyedia yang tidak
        secara eksplisit memilih ikut serta. Penyedia yang sudah ada dapat tetap membaca `req.apiKey`;
        penyedia baru sebaiknya menggunakan `req.auth`.

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "local-audio plugin no-auth",
          }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Embeddings">
        ```typescript
        api.registerEmbeddingProvider({
          id: "acme-ai",
          defaultModel: "acme-embed",
          transport: "remote",
          authProviderId: "acme-ai",
          create: async ({ model }) => ({
            provider: {
              id: "acme-ai",
              model,
              dimensions: 1536,
              embed: async (input) => {
                const text = typeof input === "string" ? input : input.text;
                return fetchAcmeEmbedding(text);
              },
              embedBatch: async (inputs) =>
                Promise.all(
                  inputs.map((input) =>
                    fetchAcmeEmbedding(typeof input === "string" ? input : input.text),
                  ),
                ),
            },
          }),
        });
        ```

        Deklarasikan id yang sama di `contracts.embeddingProviders`. Ini adalah
        kontrak embedding umum untuk pembuatan vektor yang dapat digunakan ulang, termasuk
        pencarian memori. `registerMemoryEmbeddingProvider(...)` adalah kompatibilitas
        yang sudah tidak disarankan untuk adapter khusus memori yang sudah ada.
      </Tab>
      <Tab title="Pembuatan gambar dan video">
        Kapabilitas video menggunakan bentuk yang **sadar mode**: `generate`,
        `imageToVideo`, dan `videoToVideo`. Field agregat datar seperti
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` tidak
        cukup untuk mengiklankan dukungan mode transformasi atau mode yang dinonaktifkan dengan jelas.
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
          defaultTimeoutMs: 600_000,
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
      <Tab title="Pengambilan dan pencarian web">
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

Plugin penyedia dipublikasikan dengan cara yang sama seperti Plugin kode eksternal lainnya:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Jangan gunakan alias publikasi lama khusus skill di sini; paket Plugin harus menggunakan
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

`catalog.order` mengontrol kapan katalog Anda digabungkan relatif terhadap
penyedia bawaan:

| Urutan    | Kapan         | Kasus penggunaan                               |
| --------- | ------------- | --------------------------------------------- |
| `simple`  | Pass pertama  | Penyedia API-key sederhana                    |
| `profile` | Setelah simple | Penyedia yang digate pada profil auth         |
| `paired`  | Setelah profile | Mensintesis beberapa entri terkait           |
| `late`    | Pass terakhir | Menimpa penyedia yang sudah ada (menang saat collision) |

## Langkah berikutnya

- [Plugin Channel](/id/plugins/sdk-channel-plugins) - jika Plugin Anda juga menyediakan channel
- [Runtime SDK](/id/plugins/sdk-runtime) - helper `api.runtime` (TTS, pencarian, subagent)
- [Ikhtisar SDK](/id/plugins/sdk-overview) - referensi impor subpath lengkap
- [Internal Plugin](/id/plugins/architecture-internals#provider-runtime-hooks) - detail hook dan contoh bundled

## Terkait

- [Penyiapan Plugin SDK](/id/plugins/sdk-setup)
- [Membangun Plugin](/id/plugins/building-plugins)
- [Membangun Plugin channel](/id/plugins/sdk-channel-plugins)
