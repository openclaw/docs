---
read_when:
    - Anda sedang membangun Plugin provider model baru
    - Anda ingin menambahkan proxy yang kompatibel dengan OpenAI atau LLM kustom ke OpenClaw
    - Anda perlu memahami auth provider, katalog, dan hook runtime
sidebarTitle: Provider plugins
summary: Panduan langkah demi langkah untuk membangun Plugin provider model untuk OpenClaw
title: Membangun Plugin provider
x-i18n:
    generated_at: "2026-04-26T11:35:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 987ff69584a3e076189770c253ce48191103b5224e12216fd3d2fc03608ca240
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Panduan ini memandu Anda membangun Plugin provider yang menambahkan provider model
(LLM) ke OpenClaw. Pada akhirnya Anda akan memiliki provider dengan katalog model,
autentikasi API key, dan resolusi model dinamis.

<Info>
  Jika Anda belum pernah membangun Plugin OpenClaw sebelumnya, baca
  [Memulai](/id/plugins/building-plugins) terlebih dahulu untuk struktur package
  dasar dan penyiapan manifest.
</Info>

<Tip>
  Plugin provider menambahkan model ke loop inferensi normal OpenClaw. Jika model
  harus berjalan melalui daemon agent bawaan yang memiliki thread, Compaction, atau event tool,
  pasangkan provider dengan [agent harness](/id/plugins/sdk-agent-harness)
  alih-alih menaruh detail protokol daemon di core.
</Tip>

## Panduan langkah

<Steps>
  <Step title="Package dan manifest">
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
      "description": "Provider model Acme AI",
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
          "choiceLabel": "API key Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "API key Acme AI"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Manifest mendeklarasikan `providerAuthEnvVars` agar OpenClaw dapat mendeteksi
    kredensial tanpa memuat runtime Plugin Anda. Tambahkan `providerAuthAliases`
    ketika varian provider sebaiknya menggunakan ulang auth dari id provider lain. `modelSupport`
    bersifat opsional dan memungkinkan OpenClaw memuat otomatis Plugin provider Anda dari shorthand
    model id seperti `acme-large` sebelum hook runtime ada. Jika Anda memublikasikan
    provider di ClawHub, field `openclaw.compat` dan `openclaw.build` itu
    wajib ada di `package.json`.

  </Step>

  <Step title="Daftarkan provider">
    Provider minimal memerlukan `id`, `label`, `auth`, dan `catalog`:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Provider model Acme AI",
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
              label: "API key Acme AI",
              hint: "API key dari dashboard Acme AI Anda",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Masukkan API key Acme AI Anda",
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
      },
    });
    ```

    Itu adalah provider yang berfungsi. Pengguna sekarang dapat
    `openclaw onboard --acme-ai-api-key <key>` dan memilih
    `acme-ai/acme-large` sebagai model mereka.

    Jika provider upstream menggunakan control token yang berbeda dari OpenClaw, tambahkan
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

    `input` menulis ulang prompt sistem akhir dan konten pesan teks sebelum
    transport. `output` menulis ulang delta teks assistant dan teks akhir sebelum
    OpenClaw mem-parse marker kontrol miliknya sendiri atau pengiriman saluran.

    Untuk provider bawaan yang hanya mendaftarkan satu provider teks dengan API-key
    auth plus satu runtime berbasis katalog, pilih helper yang lebih sempit
    `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Provider model Acme AI",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "API key Acme AI",
            hint: "API key dari dashboard Acme AI Anda",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Masukkan API key Acme AI Anda",
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

    `buildProvider` adalah jalur katalog live yang digunakan saat OpenClaw dapat me-resolve auth provider nyata.
    Fungsi ini dapat melakukan penemuan khusus provider. Gunakan
    `buildStaticProvider` hanya untuk baris offline yang aman ditampilkan sebelum auth
    dikonfigurasi; fungsi ini tidak boleh memerlukan kredensial atau membuat permintaan jaringan.
    Tampilan `models list --all` OpenClaw saat ini mengeksekusi katalog statis
    hanya untuk Plugin provider bawaan, dengan config kosong, env kosong, dan tanpa
    path agent/workspace.

    Jika alur auth Anda juga perlu menambal `models.providers.*`, alias, dan
    model default agent selama onboarding, gunakan helper preset dari
    `openclaw/plugin-sdk/provider-onboard`. Helper yang paling sempit adalah
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, dan
    `createModelCatalogPresetAppliers(...)`.

    Saat endpoint bawaan provider mendukung blok penggunaan streaming pada
    transport `openai-completions` normal, pilih helper katalog bersama di
    `openclaw/plugin-sdk/provider-catalog-shared` alih-alih meng-hardcode
    pemeriksaan provider-id. `supportsNativeStreamingUsageCompat(...)` dan
    `applyProviderNativeStreamingUsageCompat(...)` mendeteksi dukungan dari peta kapabilitas endpoint,
    sehingga endpoint gaya Moonshot/DashScope bawaan tetap dapat opt-in meskipun Plugin menggunakan provider id kustom.

  </Step>

  <Step title="Tambahkan resolusi model dinamis">
    Jika provider Anda menerima model ID arbitrer (seperti proxy atau router),
    tambahkan `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog dari atas

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

    Jika resolusi memerlukan panggilan jaringan, gunakan `prepareDynamicModel` untuk
    warm-up async — `resolveDynamicModel` berjalan lagi setelahnya selesai.

  </Step>

  <Step title="Tambahkan hook runtime (sesuai kebutuhan)">
    Sebagian besar provider hanya memerlukan `catalog` + `resolveDynamicModel`. Tambahkan hook
    secara bertahap sesuai kebutuhan provider Anda.

    Builder helper bersama sekarang mencakup keluarga replay/tool-compat yang paling umum,
    sehingga Plugin biasanya tidak perlu menghubungkan setiap hook satu per satu secara manual:

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

    | Family | Apa yang dihubungkan | Contoh bawaan |
    | --- | --- | --- |
    | `openai-compatible` | Kebijakan replay gaya OpenAI bersama untuk transport yang kompatibel dengan OpenAI, termasuk sanitasi tool-call-id, perbaikan urutan assistant-first, dan validasi giliran Gemini generik ketika transport membutuhkannya | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Kebijakan replay sadar Claude yang dipilih berdasarkan `modelId`, sehingga transport pesan Anthropic hanya mendapatkan pembersihan thinking-block khusus Claude ketika model yang di-resolve benar-benar merupakan id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Kebijakan replay Gemini bawaan plus sanitasi replay bootstrap dan mode output reasoning bertag | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanitasi thought-signature Gemini untuk model Gemini yang berjalan melalui transport proxy yang kompatibel dengan OpenAI; tidak mengaktifkan validasi replay Gemini bawaan atau penulisan ulang bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Kebijakan hibrida untuk provider yang mencampur surface model pesan Anthropic dan OpenAI-compatible dalam satu Plugin; pembuangan thinking-block khusus Claude opsional tetap terbatas pada sisi Anthropic | `minimax` |

    Keluarga stream yang tersedia saat ini:

    | Family | Apa yang dihubungkan | Contoh bawaan |
    | --- | --- | --- |
    | `google-thinking` | Normalisasi payload thinking Gemini pada jalur stream bersama | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper reasoning Kilo pada jalur stream proxy bersama, dengan `kilo/auto` dan id reasoning proxy yang tidak didukung melewati thinking yang disuntikkan | `kilocode` |
    | `moonshot-thinking` | Pemetaan payload native-thinking biner Moonshot dari config + level `/think` | `moonshot` |
    | `minimax-fast-mode` | Penulisan ulang model mode cepat MiniMax pada jalur stream bersama | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrapper Responses OpenAI/Codex bawaan bersama: header attribution, `/fast`/`serviceTier`, verbosity teks, pencarian web Codex bawaan, pembentukan payload kompatibilitas reasoning, dan manajemen konteks Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper reasoning OpenRouter untuk rute proxy, dengan skip model yang tidak didukung/`auto` ditangani secara terpusat | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` aktif-secara-default untuk provider seperti Z.AI yang menginginkan streaming tool kecuali dinonaktifkan secara eksplisit | `zai` |

    <Accordion title="Seam SDK yang menggerakkan family builder">
      Setiap family builder tersusun dari helper publik tingkat lebih rendah yang diekspor dari package yang sama, yang dapat Anda gunakan saat provider perlu keluar dari pola umum:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, dan builder replay mentah (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Juga mengekspor helper replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) dan helper endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, plus wrapper OpenAI/Codex bersama (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper DeepSeek V4 OpenAI-compatible (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), dan wrapper proxy/provider bersama (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, helper skema Gemini yang mendasari (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`), dan helper kompatibilitas xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Plugin xAI bawaan menggunakan `normalizeResolvedModel` + `contributeResolvedModelCompat` bersama ini agar aturan xAI tetap dimiliki oleh provider.

      Beberapa helper stream sengaja tetap lokal pada provider. `@openclaw/anthropic-provider` menyimpan `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, dan builder wrapper Anthropic tingkat lebih rendah pada seam publik `api.ts` / `contract-api.ts` miliknya sendiri karena helper tersebut mengenkode penanganan beta OAuth Claude dan gating `context1m`. Plugin xAI juga menyimpan pembentukan Responses xAI bawaan di `wrapStreamFn` miliknya sendiri (`/fast` alias, default `tool_stream`, cleanup strict-tool yang tidak didukung, penghapusan payload reasoning khusus xAI).

      Pola package-root yang sama juga mendasari `@openclaw/openai-provider` (builder provider, helper default-model, builder provider realtime) dan `@openclaw/openrouter-provider` (builder provider plus helper onboarding/config).
    </Accordion>

    <Tabs>
      <Tab title="Pertukaran token">
        Untuk provider yang memerlukan pertukaran token sebelum setiap panggilan inferensi:

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
        Untuk provider yang memerlukan header request kustom atau modifikasi body:

        ```typescript
        // wrapStreamFn mengembalikan StreamFn yang diturunkan dari ctx.streamFn
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
      <Tab title="Identitas transport bawaan">
        Untuk provider yang memerlukan header atau metadata request/sesi bawaan pada
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
        Untuk provider yang mengekspos data penggunaan/penagihan:

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

    <Accordion title="Semua hook provider yang tersedia">
      OpenClaw memanggil hook dalam urutan ini. Sebagian besar provider hanya menggunakan 2-3:

      | # | Hook | Kapan digunakan |
      | --- | --- | --- |
      | 1 | `catalog` | Katalog model atau default `baseUrl` |
      | 2 | `applyConfigDefaults` | Default global milik provider selama materialisasi config |
      | 3 | `normalizeModelId` | Pembersihan alias model-id lawas/pratinjau sebelum lookup |
      | 4 | `normalizeTransport` | Pembersihan `api` / `baseUrl` keluarga provider sebelum perakitan model generik |
      | 5 | `normalizeConfig` | Menormalisasi config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Penulisan ulang kompatibilitas streaming-usage bawaan untuk provider config |
      | 7 | `resolveConfigApiKey` | Resolusi auth env-marker milik provider |
      | 8 | `resolveSyntheticAuth` | Auth sintetis lokal/self-hosted atau berbasis config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Menurunkan placeholder profil tersimpan sintetis di bawah auth env/config |
      | 10 | `resolveDynamicModel` | Menerima model ID upstream arbitrer |
      | 11 | `prepareDynamicModel` | Pengambilan metadata async sebelum resolve |
      | 12 | `normalizeResolvedModel` | Penulisan ulang transport sebelum runner |
      | 13 | `contributeResolvedModelCompat` | Flag kompatibilitas untuk model vendor di balik transport kompatibel lain |
      | 14 | `capabilities` | Kumpulan kapabilitas statis lawas; hanya untuk kompatibilitas |
      | 15 | `normalizeToolSchemas` | Pembersihan skema tool milik provider sebelum pendaftaran |
      | 16 | `inspectToolSchemas` | Diagnostik skema tool milik provider |
      | 17 | `resolveReasoningOutputMode` | Kontrak output reasoning bertag vs bawaan |
      | 18 | `prepareExtraParams` | Parameter request default |
      | 19 | `createStreamFn` | Transport StreamFn kustom sepenuhnya |
      | 20 | `wrapStreamFn` | Wrapper header/body kustom pada jalur stream normal |
      | 21 | `resolveTransportTurnState` | Header/metadata per-giliran bawaan |
      | 22 | `resolveWebSocketSessionPolicy` | Header sesi WS bawaan/cool-down |
      | 23 | `formatApiKey` | Bentuk token runtime kustom |
      | 24 | `refreshOAuth` | Refresh OAuth kustom |
      | 25 | `buildAuthDoctorHint` | Panduan perbaikan auth |
      | 26 | `matchesContextOverflowError` | Deteksi overflow milik provider |
      | 27 | `classifyFailoverReason` | Klasifikasi rate-limit/overload milik provider |
      | 28 | `isCacheTtlEligible` | Gating TTL cache prompt |
      | 29 | `buildMissingAuthMessage` | Petunjuk auth hilang kustom |
      | 30 | `suppressBuiltInModel` | Sembunyikan baris upstream yang basi |
      | 31 | `augmentModelCatalog` | Baris kompatibilitas-maju sintetis |
      | 32 | `resolveThinkingProfile` | Set opsi `/think` khusus model |
      | 33 | `isBinaryThinking` | Kompatibilitas thinking biner aktif/nonaktif |
      | 34 | `supportsXHighThinking` | Kompatibilitas dukungan reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Kompatibilitas kebijakan default `/think` |
      | 36 | `isModernModelRef` | Pencocokan model live/smoke |
      | 37 | `prepareRuntimeAuth` | Pertukaran token sebelum inferensi |
      | 38 | `resolveUsageAuth` | Parsing kredensial penggunaan kustom |
      | 39 | `fetchUsageSnapshot` | Endpoint penggunaan kustom |
      | 40 | `createEmbeddingProvider` | Adapter embedding milik provider untuk memori/pencarian |
      | 41 | `buildReplayPolicy` | Kebijakan replay/Compaction transkrip kustom |
      | 42 | `sanitizeReplayHistory` | Penulisan ulang replay khusus provider setelah pembersihan generik |
      | 43 | `validateReplayTurns` | Validasi replay-turn strict sebelum embedded runner |
      | 44 | `onModelSelected` | Callback pasca-pemilihan (misalnya telemetry) |

      Catatan fallback runtime:

      - `normalizeConfig` memeriksa provider yang cocok terlebih dahulu, lalu Plugin provider lain yang mampu-hook sampai salah satunya benar-benar mengubah config. Jika tidak ada hook provider yang menulis ulang entri config keluarga Google yang didukung, normalizer config Google bawaan tetap diterapkan.
      - `resolveConfigApiKey` menggunakan hook provider saat diekspos. Jalur `amazon-bedrock` bawaan juga memiliki resolver env-marker AWS bawaan di sini, meskipun auth runtime Bedrock sendiri tetap menggunakan rantai default AWS SDK.
      - `resolveSystemPromptContribution` memungkinkan provider menyuntikkan panduan prompt sistem yang sadar cache untuk keluarga model. Pilih ini daripada `before_prompt_build` ketika perilaku tersebut milik satu keluarga provider/model dan harus mempertahankan pemisahan cache stabil/dinamis.

      Untuk deskripsi terperinci dan contoh dunia nyata, lihat [Internal: Hook Runtime Provider](/id/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Tambahkan kapabilitas ekstra (opsional)">
    Plugin provider dapat mendaftarkan speech, transkripsi realtime, voice realtime, pemahaman media, pembuatan gambar, pembuatan video, web fetch,
    dan web search di samping inferensi teks. OpenClaw mengklasifikasikan ini sebagai Plugin **hybrid-capability** — pola yang direkomendasikan untuk Plugin perusahaan
    (satu Plugin per vendor). Lihat
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

        Gunakan `assertOkOrThrowProviderError(...)` untuk kegagalan HTTP provider agar
        Plugin berbagi pembacaan body error yang dibatasi, parsing error JSON, dan
        sufiks request-id.
      </Tab>
      <Tab title="Transkripsi realtime">
        Pilih `createRealtimeTranscriptionWebSocketSession(...)` — helper bersama ini
        menangani penangkapan proxy, backoff reconnect, flushing saat close, handshake siap, antrean audio, dan diagnostik event close. Plugin Anda
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

        Provider batch STT yang melakukan POST audio multipart sebaiknya menggunakan
        `buildAudioTranscriptionFormData(...)` dari
        `openclaw/plugin-sdk/provider-http`. Helper ini menormalisasi
        nama file unggahan, termasuk unggahan AAC yang memerlukan nama file bergaya M4A untuk
        API transkripsi yang kompatibel.
      </Tab>
      <Tab title="Voice realtime">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```
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
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` tidak cukup
        untuk mengiklankan dukungan mode transformasi atau mode yang dinonaktifkan dengan bersih.
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
      <Tab title="Web fetch dan search">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Fetch halaman melalui backend rendering Acme.",
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
            description: "Fetch halaman melalui Acme Fetch.",
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
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Ekspor objek config provider Anda dari index.ts atau file khusus
    import { acmeProvider } from "./provider.js";

    describe("provider acme-ai", () => {
      it("me-resolve model dinamis", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("mengembalikan katalog saat key tersedia", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("mengembalikan katalog null saat tidak ada key", async () => {
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

Plugin provider dipublikasikan dengan cara yang sama seperti Plugin kode eksternal lainnya:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Jangan gunakan alias publish lama yang hanya untuk Skill di sini; package Plugin harus menggunakan
`clawhub package publish`.

## Struktur file

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadata openclaw.providers
├── openclaw.plugin.json      # Manifest dengan metadata auth provider
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Pengujian
    └── usage.ts              # Endpoint penggunaan (opsional)
```

## Referensi urutan katalog

`catalog.order` mengontrol kapan katalog Anda digabungkan relatif terhadap
provider bawaan:

| Order     | Kapan         | Kasus penggunaan                                |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Pass pertama  | Provider API-key biasa                          |
| `profile` | Setelah simple | Provider yang di-gate pada profil auth         |
| `paired`  | Setelah profile | Menyintesis beberapa entri terkait            |
| `late`    | Pass terakhir | Menimpa provider yang ada (menang saat bentrok) |

## Langkah selanjutnya

- [Plugin Saluran](/id/plugins/sdk-channel-plugins) — jika Plugin Anda juga menyediakan saluran
- [SDK Runtime](/id/plugins/sdk-runtime) — helper `api.runtime` (TTS, search, subagent)
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [Internal Plugin](/id/plugins/architecture-internals#provider-runtime-hooks) — detail hook dan contoh bawaan

## Terkait

- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun Plugin](/id/plugins/building-plugins)
- [Membangun Plugin saluran](/id/plugins/sdk-channel-plugins)
