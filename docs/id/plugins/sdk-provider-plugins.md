---
read_when:
    - Anda sedang membangun Plugin penyedia model baru
    - Anda ingin menambahkan proksi yang kompatibel dengan OpenAI atau LLM kustom ke OpenClaw
    - Anda perlu memahami autentikasi penyedia, katalog, dan kait waktu eksekusi
sidebarTitle: Provider plugins
summary: Panduan langkah demi langkah untuk membangun Plugin penyedia model untuk OpenClaw
title: Membangun Plugin penyedia
x-i18n:
    generated_at: "2026-05-01T09:27:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f9d721673bdfef0b9c1979b4b8b4c86f19d114374d6b941facb928c3574cd1b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Panduan ini menjelaskan langkah-langkah membangun plugin penyedia yang menambahkan penyedia model
(LLM) ke OpenClaw. Pada akhirnya, Anda akan memiliki penyedia dengan katalog model,
autentikasi kunci API, dan resolusi model dinamis.

<Info>
  Jika Anda belum pernah membuat plugin OpenClaw sebelumnya, baca
  [Memulai](/id/plugins/building-plugins) terlebih dahulu untuk struktur paket dasar
  dan penyiapan manifes.
</Info>

<Tip>
  Plugin penyedia menambahkan model ke loop inferensi normal OpenClaw. Jika model
  harus berjalan melalui daemon agen native yang memiliki thread, compaction, atau event
  tool, pasangkan penyedia dengan [harness agen](/id/plugins/sdk-agent-harness)
  alih-alih menaruh detail protokol daemon di core.
</Tip>

## Panduan langkah demi langkah

<Steps>
  <Step title="Paket dan manifes">
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
          "choiceLabel": "Kunci API Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Kunci API Acme AI"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Manifes mendeklarasikan `providerAuthEnvVars` sehingga OpenClaw dapat mendeteksi
    kredensial tanpa memuat runtime plugin Anda. Tambahkan `providerAuthAliases`
    ketika varian penyedia harus menggunakan ulang autentikasi dari id penyedia lain. `modelSupport`
    bersifat opsional dan memungkinkan OpenClaw memuat otomatis plugin penyedia Anda dari
    id model singkat seperti `acme-large` sebelum hook runtime tersedia. Jika Anda memublikasikan
    penyedia di ClawHub, kolom `openclaw.compat` dan `openclaw.build` tersebut
    wajib ada di `package.json`.

  </Step>

  <Step title="Daftarkan penyedia">
    Penyedia minimal memerlukan `id`, `label`, `auth`, dan `catalog`:

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
              label: "Kunci API Acme AI",
              hint: "Kunci API dari dasbor Acme AI Anda",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Masukkan kunci API Acme AI Anda",
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

    Itu adalah penyedia yang berfungsi. Pengguna kini dapat menjalankan
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
    OpenClaw mengurai penanda kontrolnya sendiri atau pengiriman channel.

    Untuk penyedia bawaan yang hanya mendaftarkan satu penyedia teks dengan autentikasi
    kunci API plus satu runtime berbasis katalog, gunakan helper yang lebih sempit
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
            label: "Kunci API Acme AI",
            hint: "Kunci API dari dasbor Acme AI Anda",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Masukkan kunci API Acme AI Anda",
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
    autentikasi penyedia nyata. Ini dapat melakukan discovery khusus penyedia. Gunakan
    `buildStaticProvider` hanya untuk baris offline yang aman ditampilkan sebelum autentikasi
    dikonfigurasi; ini tidak boleh memerlukan kredensial atau membuat permintaan jaringan.
    Tampilan `models list --all` OpenClaw saat ini mengeksekusi katalog statis
    hanya untuk plugin penyedia bawaan, dengan config kosong, env kosong, dan tanpa
    jalur agen/workspace.

    Jika alur autentikasi Anda juga perlu menambal `models.providers.*`, alias, dan
    model default agen selama onboarding, gunakan helper preset dari
    `openclaw/plugin-sdk/provider-onboard`. Helper paling sempit adalah
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, dan
    `createModelCatalogPresetAppliers(...)`.

    Ketika endpoint native penyedia mendukung blok penggunaan streaming pada
    transport normal `openai-completions`, gunakan helper katalog bersama di
    `openclaw/plugin-sdk/provider-catalog-shared` alih-alih meng-hardcode
    pemeriksaan id penyedia. `supportsNativeStreamingUsageCompat(...)` dan
    `applyProviderNativeStreamingUsageCompat(...)` mendeteksi dukungan dari
    peta kapabilitas endpoint, sehingga endpoint native bergaya Moonshot/DashScope tetap
    ikut serta bahkan ketika plugin menggunakan id penyedia kustom.

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
    async — `resolveDynamicModel` berjalan lagi setelah selesai.

  </Step>

  <Step title="Tambahkan hook runtime (sesuai kebutuhan)">
    Sebagian besar penyedia hanya memerlukan `catalog` + `resolveDynamicModel`. Tambahkan hook
    secara bertahap sesuai kebutuhan penyedia Anda.

    Builder helper bersama kini mencakup keluarga replay/tool-compat yang paling umum,
    sehingga plugin biasanya tidak perlu merangkai setiap hook satu per satu secara manual:

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
    | `openai-compatible` | Kebijakan replay bersama bergaya OpenAI untuk transport yang kompatibel dengan OpenAI, termasuk sanitasi tool-call-id, perbaikan urutan assistant-first, dan validasi turn Gemini generik ketika transport memerlukannya | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Kebijakan replay sadar Claude yang dipilih oleh `modelId`, sehingga transport pesan Anthropic hanya mendapat pembersihan blok thinking khusus Claude ketika model yang diselesaikan benar-benar id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Kebijakan replay Gemini native plus sanitasi replay bootstrap dan mode output reasoning bertag | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanitasi thought-signature Gemini untuk model Gemini yang berjalan melalui transport proxy yang kompatibel dengan OpenAI; tidak mengaktifkan validasi replay Gemini native atau penulisan ulang bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Kebijakan hibrida untuk penyedia yang mencampur surface model pesan Anthropic dan kompatibel OpenAI dalam satu plugin; penghapusan blok thinking khusus Claude opsional tetap terbatas pada sisi Anthropic | `minimax` |

    Keluarga stream yang tersedia saat ini:

    | Keluarga | Apa yang dirangkai | Contoh bawaan |
    | --- | --- | --- |
    | `google-thinking` | Normalisasi payload thinking Gemini pada jalur stream bersama | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper reasoning Kilo pada jalur stream proxy bersama, dengan `kilo/auto` dan id reasoning proxy yang tidak didukung melewati thinking yang diinjeksi | `kilocode` |
    | `moonshot-thinking` | Pemetaan payload native-thinking biner Moonshot dari konfigurasi + level `/think` | `moonshot` |
    | `minimax-fast-mode` | Penulisan ulang model mode cepat MiniMax pada jalur stream bersama | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrapper Responses OpenAI/Codex native bersama: header atribusi, `/fast`/`serviceTier`, verbositas teks, pencarian web native Codex, pembentukan payload kompatibilitas reasoning, dan manajemen konteks Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper reasoning OpenRouter untuk rute proxy, dengan pelewatan model yang tidak didukung/`auto` ditangani secara terpusat | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` aktif secara default untuk provider seperti Z.AI yang menginginkan streaming tool kecuali dinonaktifkan secara eksplisit | `zai` |

    <Accordion title="Seam SDK yang mendukung builder keluarga">
      Setiap builder keluarga disusun dari helper publik tingkat lebih rendah yang diekspor dari paket yang sama, yang dapat Anda gunakan ketika provider perlu keluar dari pola umum:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, dan builder replay mentah (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Juga mengekspor helper replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) dan helper endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, ditambah wrapper OpenAI/Codex bersama (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper DeepSeek V4 yang kompatibel dengan OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), pembersihan prefill thinking Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), dan wrapper proxy/provider bersama (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, helper skema Gemini yang mendasari (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`), dan helper kompatibilitas xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Plugin xAI bawaan menggunakan `normalizeResolvedModel` + `contributeResolvedModelCompat` dengan ini untuk menjaga aturan xAI tetap dimiliki oleh provider.

      Beberapa helper stream sengaja tetap lokal provider. `@openclaw/anthropic-provider` menyimpan `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, dan builder wrapper Anthropic tingkat lebih rendah di seam publik `api.ts` / `contract-api.ts` miliknya sendiri karena semuanya mengodekan penanganan beta OAuth Claude dan gating `context1m`. Plugin xAI juga menyimpan pembentukan Responses xAI native dalam `wrapStreamFn` miliknya sendiri (alias `/fast`, `tool_stream` default, pembersihan strict-tool yang tidak didukung, penghapusan payload reasoning khusus xAI).

      Pola root paket yang sama juga mendukung `@openclaw/openai-provider` (builder provider, helper model default, builder provider realtime) dan `@openclaw/openrouter-provider` (builder provider ditambah helper onboarding/konfigurasi).
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
        Untuk provider yang memerlukan header permintaan kustom atau modifikasi body:

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
        Untuk provider yang memerlukan header permintaan/sesi native atau metadata pada
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
      Field provider khusus kompatibilitas yang tidak lagi dipanggil OpenClaw, seperti
      `ProviderPlugin.capabilities` dan `suppressBuiltInModel`, tidak dicantumkan
      di sini.

      | # | Hook | Kapan digunakan |
      | --- | --- | --- |
      | 1 | `catalog` | Katalog model atau default URL dasar |
      | 2 | `applyConfigDefaults` | Default global milik provider selama materialisasi konfigurasi |
      | 3 | `normalizeModelId` | Pembersihan alias id model legacy/preview sebelum lookup |
      | 4 | `normalizeTransport` | Pembersihan `api` / `baseUrl` keluarga provider sebelum perakitan model generik |
      | 5 | `normalizeConfig` | Menormalisasi konfigurasi `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Penulisan ulang kompatibilitas penggunaan streaming native untuk provider konfigurasi |
      | 7 | `resolveConfigApiKey` | Resolusi auth penanda env milik provider |
      | 8 | `resolveSyntheticAuth` | Auth sintetis lokal/self-hosted atau berbasis konfigurasi |
      | 9 | `shouldDeferSyntheticProfileAuth` | Menurunkan placeholder profil tersimpan sintetis di belakang auth env/konfigurasi |
      | 10 | `resolveDynamicModel` | Menerima ID model upstream arbitrer |
      | 11 | `prepareDynamicModel` | Pengambilan metadata async sebelum resolusi |
      | 12 | `normalizeResolvedModel` | Penulisan ulang transport sebelum runner |
      | 13 | `contributeResolvedModelCompat` | Flag kompatibilitas untuk model vendor di balik transport kompatibel lain |
      | 14 | `normalizeToolSchemas` | Pembersihan skema tool milik provider sebelum registrasi |
      | 15 | `inspectToolSchemas` | Diagnostik skema tool milik provider |
      | 16 | `resolveReasoningOutputMode` | Kontrak output reasoning bertag vs native |
      | 17 | `prepareExtraParams` | Parameter permintaan default |
      | 18 | `createStreamFn` | Transport StreamFn sepenuhnya kustom |
      | 19 | `wrapStreamFn` | Wrapper header/body kustom pada jalur stream normal |
      | 20 | `resolveTransportTurnState` | Header/metadata native per turn |
      | 21 | `resolveWebSocketSessionPolicy` | Header/cool-down sesi WS native |
      | 22 | `formatApiKey` | Bentuk token runtime kustom |
      | 23 | `refreshOAuth` | Refresh OAuth kustom |
      | 24 | `buildAuthDoctorHint` | Panduan perbaikan auth |
      | 25 | `matchesContextOverflowError` | Deteksi overflow milik provider |
      | 26 | `classifyFailoverReason` | Klasifikasi rate-limit/overload milik provider |
      | 27 | `isCacheTtlEligible` | Gating TTL cache prompt |
      | 28 | `buildMissingAuthMessage` | Petunjuk auth yang hilang secara kustom |
      | 29 | `augmentModelCatalog` | Baris forward-compat sintetis |
      | 30 | `resolveThinkingProfile` | Kumpulan opsi `/think` khusus model |
      | 31 | `isBinaryThinking` | Kompatibilitas thinking biner aktif/nonaktif |
      | 32 | `supportsXHighThinking` | Kompatibilitas dukungan reasoning `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Kompatibilitas kebijakan `/think` default |
      | 34 | `isModernModelRef` | Pencocokan model live/smoke |
      | 35 | `prepareRuntimeAuth` | Pertukaran token sebelum inferensi |
      | 36 | `resolveUsageAuth` | Parsing kredensial penggunaan kustom |
      | 37 | `fetchUsageSnapshot` | Endpoint penggunaan kustom |
      | 38 | `createEmbeddingProvider` | Adapter embedding milik provider untuk memori/pencarian |
      | 39 | `buildReplayPolicy` | Kebijakan replay/Compaction transkrip kustom |
      | 40 | `sanitizeReplayHistory` | Penulisan ulang replay khusus provider setelah pembersihan generik |
      | 41 | `validateReplayTurns` | Validasi replay-turn ketat sebelum runner tertanam |
      | 42 | `onModelSelected` | Callback pasca-pemilihan (mis. telemetri) |

      Catatan fallback runtime:

      - `normalizeConfig` memeriksa provider yang cocok terlebih dahulu, lalu Plugin provider lain yang mampu hook hingga salah satunya benar-benar mengubah konfigurasi. Jika tidak ada hook provider yang menulis ulang entri konfigurasi keluarga Google yang didukung, normalizer konfigurasi Google bawaan tetap diterapkan.
      - `resolveConfigApiKey` menggunakan hook provider saat diekspos. Jalur `amazon-bedrock` bawaan juga memiliki resolver penanda env AWS bawaan di sini, meskipun auth runtime Bedrock sendiri tetap menggunakan rantai default AWS SDK.
      - `resolveSystemPromptContribution` memungkinkan provider menginjeksi panduan prompt sistem yang sadar cache untuk sebuah keluarga model. Lebih pilih ini daripada `before_prompt_build` ketika perilaku tersebut milik satu provider/keluarga model dan harus mempertahankan pemisahan cache stabil/dinamis.

      Untuk deskripsi detail dan contoh dunia nyata, lihat [Internal: Hook Runtime Provider](/id/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Tambahkan kapabilitas ekstra (opsional)">
    Plugin provider dapat mendaftarkan speech, transkripsi realtime, suara realtime,
    pemahaman media, pembuatan gambar, pembuatan video, pengambilan web,
    dan pencarian web bersama inferensi teks. OpenClaw mengklasifikasikan ini sebagai
    Plugin **hybrid-capability** — pola yang direkomendasikan untuk Plugin perusahaan
    (satu Plugin per vendor). Lihat
    [Internal: Kepemilikan Kapabilitas](/id/plugins/architecture#capability-ownership-model).

    Daftarkan setiap kapabilitas di dalam `register(api)` bersama panggilan
    `api.registerProvider(...)` Anda yang sudah ada. Pilih hanya tab yang Anda butuhkan:

    <Tabs>
      <Tab title="Ucapan (TTS)">
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
        plugin berbagi pembacaan isi kesalahan yang dibatasi, penguraian kesalahan JSON, dan
        sufiks ID permintaan.
      </Tab>
      <Tab title="Transkripsi waktu nyata">
        Utamakan `createRealtimeTranscriptionWebSocketSession(...)` — pembantu bersama
        menangani penangkapan proksi, backoff koneksi ulang, flushing saat penutupan, handshake
        kesiapan, antrean audio, dan diagnostik peristiwa penutupan. Plugin Anda
        hanya memetakan peristiwa upstream.

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

        Penyedia STT batch yang melakukan POST audio multipart sebaiknya menggunakan
        `buildAudioTranscriptionFormData(...)` dari
        `openclaw/plugin-sdk/provider-http`. Pembantu ini menormalkan nama file unggahan,
        termasuk unggahan AAC yang memerlukan nama file bergaya M4A untuk
        API transkripsi yang kompatibel.
      </Tab>
      <Tab title="Suara waktu nyata">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
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

        Implementasikan `handleBargeIn` ketika sebuah transport dapat mendeteksi bahwa manusia sedang
        menginterupsi pemutaran asisten dan penyedia mendukung pemotongan atau
        penghapusan respons audio aktif.
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
        Kemampuan video menggunakan bentuk yang **sadar mode**: `generate`,
        `imageToVideo`, dan `videoToVideo`. Field agregat datar seperti
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` tidak
        cukup untuk mengiklankan dukungan mode transformasi atau mode yang dinonaktifkan secara rapi.
        Pembuatan musik mengikuti pola yang sama dengan blok `generate` /
        `edit` eksplisit.

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

  <Step title="Pengujian">
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

`catalog.order` mengontrol kapan katalog Anda digabungkan relatif terhadap penyedia
bawaan:

| Urutan    | Kapan         | Kasus penggunaan                               |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Pass pertama  | Penyedia kunci API biasa                       |
| `profile` | Setelah simple  | Penyedia yang dibatasi pada profil auth      |
| `paired`  | Setelah profile | Menyintesis beberapa entri terkait           |
| `late`    | Pass terakhir | Menimpa penyedia yang ada (menang saat bentrok) |

## Langkah berikutnya

- [Plugin Channel](/id/plugins/sdk-channel-plugins) — jika plugin Anda juga menyediakan channel
- [Runtime SDK](/id/plugins/sdk-runtime) — pembantu `api.runtime` (TTS, pencarian, subagen)
- [Ringkasan SDK](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [Internal Plugin](/id/plugins/architecture-internals#provider-runtime-hooks) — detail hook dan contoh bawaan

## Terkait

- [Penyiapan Plugin SDK](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)
- [Membangun plugin channel](/id/plugins/sdk-channel-plugins)
