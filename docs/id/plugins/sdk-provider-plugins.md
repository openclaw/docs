---
read_when:
    - Anda sedang membuat plugin penyedia model baru
    - Anda ingin menambahkan proksi yang kompatibel dengan OpenAI atau LLM kustom ke OpenClaw
    - Anda perlu memahami autentikasi penyedia, katalog, dan hook runtime
sidebarTitle: Provider plugins
summary: Panduan langkah demi langkah untuk membuat plugin penyedia model bagi OpenClaw
title: Membangun plugin penyedia
x-i18n:
    generated_at: "2026-07-19T05:13:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f68a8581872f89ae8ac3b8660ee71ef9cfab7a5670b1dc68f64027601425a3dc
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Bangun Plugin penyedia untuk menambahkan penyedia model (LLM) ke OpenClaw: katalog
model, autentikasi kunci API, dan resolusi model dinamis.

<Info>
  Baru mengenal Plugin OpenClaw? Baca [Memulai](/id/plugins/building-plugins)
  terlebih dahulu untuk mengetahui struktur paket dan penyiapan manifes.
</Info>

<Tip>
  Plugin penyedia menambahkan model ke loop inferensi normal OpenClaw. Jika
  model harus dijalankan melalui daemon agen native yang mengelola thread, Compaction,
  atau peristiwa alat, pasangkan penyedia dengan [harness
  agen](/id/plugins/sdk-agent-harness), alih-alih menempatkan detail protokol daemon
  di inti.
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
      "description": "Penyedia model Acme AI",
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

    `setup.providers[].envVars` memungkinkan OpenClaw mendeteksi kredensial tanpa
    memuat runtime Plugin Anda. Tambahkan `providerAuthAliases` ketika suatu varian penyedia
    harus menggunakan kembali autentikasi milik id penyedia lain. `modelSupport` bersifat
    opsional dan memungkinkan OpenClaw memuat otomatis Plugin penyedia Anda dari id
    model singkat seperti `acme-large` sebelum hook runtime tersedia. `openclaw.compat`
    dan `openclaw.build` dalam `package.json` diperlukan untuk penerbitan
    ClawHub (`openclaw.compat.pluginApi` dan `openclaw.build.openclawVersion`
    adalah dua bidang yang diwajibkan; `minGatewayVersion` menggunakan
    `openclaw.install.minHostVersion` sebagai fallback jika dihilangkan).

  </Step>

  <Step title="Daftarkan penyedia">
    Penyedia teks minimal memerlukan `id`, `label`, `auth`, dan `catalog`.
    `catalog` adalah hook runtime/konfigurasi milik penyedia; hook ini dapat memanggil
    API vendor langsung dan mengembalikan entri `models.providers`.

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Penyedia model Acme AI",
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

    `registerModelCatalogProvider` adalah permukaan katalog bidang kontrol yang lebih baru
    untuk UI daftar/bantuan/pemilih, yang mencakup baris `text`, `voice`, `image_generation`,
    `video_generation`, dan `music_generation`. Pertahankan pemanggilan endpoint vendor
    dan pemetaan respons di dalam Plugin; OpenClaw mengelola bentuk baris bersama,
    label sumber, dan perenderan bantuan.

    Ini merupakan penyedia yang berfungsi. Pengguna kini dapat menjalankan
    `openclaw onboard --acme-ai-api-key <key>` dan memilih
    `acme-ai/acme-large` sebagai model mereka.

    ### Penemuan model langsung

    Jika penyedia Anda menyediakan API bergaya `/models`, pertahankan endpoint
    khusus penyedia dan proyeksi baris di dalam Plugin Anda, lalu gunakan
    `openclaw/plugin-sdk/provider-catalog-live-runtime` untuk siklus proses pengambilan
    bersama. Pembantu ini menyediakan pengambilan HTTP terlindungi, header autentikasi penyedia,
    kesalahan HTTP terstruktur, caching TTL, dan perilaku fallback statis tanpa
    menempatkan kebijakan penyedia di inti OpenClaw.

    Gunakan `buildLiveModelProviderConfig` ketika API langsung hanya memberi tahu
    baris katalog statis milik penyedia mana yang saat ini tersedia:

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

    Gunakan `getCachedLiveProviderModelRows` ketika API penyedia mengembalikan metadata
    yang lebih kaya dan Plugin perlu memproyeksikan sendiri baris menjadi definisi
    model OpenClaw:

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

    `run` harus tetap dibatasi autentikasi dan mengembalikan `null` ketika tidak ada kredensial yang dapat
    digunakan. Pertahankan `staticRun` luring atau fallback statis agar penyiapan, dokumentasi,
    pengujian, dan permukaan pemilih tidak bergantung pada akses jaringan langsung. Gunakan TTL
    yang sesuai untuk kesegaran daftar model, hindari polling sistem berkas pada waktu permintaan,
    dan teruskan `readRows` / `readModelId` khusus penyedia hanya ketika
    respons hulu bukan bentuk `{ data: [{ id, object }] }`
    yang kompatibel dengan OpenAI.

    Jika penyedia hulu menggunakan token kontrol yang berbeda dari OpenClaw, tambahkan
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
    transportasi. `output` menulis ulang delta teks asisten dan teks akhir sebelum
    OpenClaw mengurai penanda kontrolnya sendiri atau mengirimkannya ke kanal.

    Untuk penyedia bawaan yang hanya mendaftarkan satu penyedia teks dengan autentikasi
    kunci API beserta satu runtime berbasis katalog, utamakan pembantu
    `defineSingleProviderPluginEntry(...)` yang cakupannya lebih sempit:

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

    `buildProvider` adalah jalur katalog langsung yang digunakan ketika OpenClaw dapat menemukan
    autentikasi penyedia yang sebenarnya. Jalur ini dapat melakukan penemuan khusus penyedia. Gunakan
    `buildStaticProvider` hanya untuk baris luring yang aman ditampilkan sebelum autentikasi
    dikonfigurasi; jalur ini tidak boleh memerlukan kredensial atau membuat permintaan jaringan.
    Tampilan `models list --all` OpenClaw saat ini menjalankan katalog statis
    hanya untuk plugin penyedia bawaan, dengan konfigurasi kosong, lingkungan kosong, dan tanpa
    jalur agen/ruang kerja.

    Jika alur autentikasi Anda juga perlu menambal `models.providers.*`, alias, dan
    model default agen selama orientasi awal, gunakan pembantu preset dari
    `openclaw/plugin-sdk/provider-onboard`. Pembantu dengan cakupan tersempit adalah
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, dan
    `createModelCatalogPresetAppliers(...)`.

    Ketika titik akhir native penyedia mendukung blok penggunaan yang dialirkan pada
    transportasi `openai-completions` normal, utamakan pembantu katalog bersama di
    `openclaw/plugin-sdk/provider-catalog-shared` daripada melakukan hardcode
    pemeriksaan id penyedia. `supportsNativeStreamingUsageCompat(...)` dan
    `applyProviderNativeStreamingUsageCompat(...)` mendeteksi dukungan dari
    peta kemampuan titik akhir, sehingga titik akhir native bergaya Moonshot/DashScope tetap
    ikut serta bahkan ketika sebuah plugin menggunakan id penyedia khusus.

    Contoh penemuan langsung di atas mencakup API penyedia bergaya `/models`. Pertahankan
    penemuan tersebut di dalam `catalog.run`, dengan gerbang autentikasi yang dapat digunakan, dan jaga agar
    `staticRun` bebas jaringan untuk pembuatan katalog luring.

  </Step>

  <Step title="Tambahkan resolusi model dinamis">
    Jika penyedia Anda menerima ID model arbitrer (seperti proksi atau router),
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

    Jika resolusi memerlukan panggilan jaringan, gunakan `prepareDynamicModel` untuk pemanasan
    asinkron - `resolveDynamicModel` dijalankan kembali setelah proses tersebut selesai.

  </Step>

  <Step title="Tambahkan hook runtime (sesuai kebutuhan)">
    Sebagian besar penyedia hanya memerlukan `catalog` + `resolveDynamicModel`. Tambahkan hook
    secara bertahap sesuai kebutuhan penyedia Anda.

    Pembuat pembantu bersama kini mencakup keluarga kompatibilitas pemutaran ulang/alat
    yang paling umum, sehingga plugin biasanya tidak perlu merangkai setiap hook satu per satu secara manual:

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

    Keluarga pemutaran ulang yang tersedia saat ini:

    | Keluarga | Yang dirangkai | Contoh bawaan |
    | --- | --- | --- |
    | `openai-compatible` | Kebijakan pemutaran ulang bersama bergaya OpenAI untuk transportasi yang kompatibel dengan OpenAI, termasuk sanitasi id panggilan alat, perbaikan pengurutan asisten-dahulu, dan validasi giliran Gemini generik ketika diperlukan oleh transportasi | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Kebijakan pemutaran ulang sadar-Claude yang dipilih oleh `modelId`, sehingga transportasi pesan Anthropic hanya memperoleh pembersihan blok pemikiran khusus Claude ketika model yang ditemukan benar-benar merupakan id Claude | `amazon-bedrock` |
    | `native-anthropic-by-model` | Kebijakan Claude-berdasarkan-model yang sama seperti `anthropic-by-model`, ditambah sanitasi id panggilan alat dan preservasi id penggunaan alat native Anthropic untuk transportasi yang harus mempertahankan id native vendor | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Kebijakan pemutaran ulang native Gemini beserta sanitasi pemutaran ulang bootstrap. Keluarga bersama mempertahankan Gemini CLI dengan keluaran teks pada penalaran bertanda; penyedia langsung `google` mengganti `resolveReasoningOutputMode` menjadi `native` karena pemikiran Gemini API tiba sebagai bagian pemikiran native. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanitasi tanda tangan pemikiran Gemini untuk model Gemini yang berjalan melalui transportasi proksi yang kompatibel dengan OpenAI; tidak mengaktifkan validasi pemutaran ulang native Gemini atau penulisan ulang bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Kebijakan hibrida untuk penyedia yang mencampurkan permukaan model pesan Anthropic dan yang kompatibel dengan OpenAI dalam satu plugin; penghapusan blok pemikiran khusus Claude yang opsional tetap dibatasi pada sisi Anthropic | `minimax` |

    Keluarga aliran yang tersedia saat ini:

    | Keluarga | Yang dirangkai | Contoh bawaan |
    | --- | --- | --- |
    | `google-thinking` | Normalisasi payload pemikiran Gemini pada jalur aliran bersama | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Pembungkus penalaran Kilo pada jalur aliran proksi bersama, dengan `kilo-auto/balanced` dan id penalaran proksi yang tidak didukung melewati pemikiran yang disuntikkan | `kilocode` |
    | `moonshot-thinking` | Pemetaan payload pemikiran native biner Moonshot dari konfigurasi + tingkat `/think` | `moonshot` |
    | `minimax-fast-mode` | Penulisan ulang model mode cepat MiniMax pada jalur aliran bersama | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Pembungkus Responses OpenAI/Codex native bersama: header atribusi, `/fast`/`serviceTier`, tingkat verbositas teks, pencarian web Codex native, pembentukan payload kompatibilitas penalaran, dan pengelolaan konteks Responses | `openai` |
    | `openrouter-thinking` | Pembungkus penalaran OpenRouter untuk rute proksi, dengan pelewatan model-tidak-didukung/`auto` ditangani secara terpusat | `openrouter` |
    | `tool-stream-default-on` | Pembungkus `tool_stream` yang aktif secara default untuk penyedia seperti Z.AI yang menginginkan pengaliran alat kecuali dinonaktifkan secara eksplisit | `zai` |

    <Accordion title="Seam SDK yang mendukung pembuat keluarga">
      Setiap pembuat keluarga disusun dari pembantu publik tingkat rendah yang diekspor dari paket yang sama, yang dapat Anda gunakan ketika penyedia perlu menyimpang dari pola umum:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, dan pembuat pemutaran ulang mentah (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Juga mengekspor pembantu pemutaran ulang Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) serta pembantu titik akhir/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, ditambah pembungkus OpenAI/Codex bersama (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), pembungkus DeepSeek V4 yang kompatibel dengan OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), pembersihan prefill pemikiran Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), kompatibilitas panggilan alat teks biasa (`createPlainTextToolCallCompatWrapper`), serta pembungkus proksi/penyedia bersama (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - pembungkus payload dan peristiwa ringan untuk jalur penyedia panas, termasuk `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)`, dan `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`, dan pembantu skema penyedia yang mendasarinya.

      Untuk penyedia keluarga Gemini, pertahankan keselarasan mode keluaran penalaran dengan
      transportasi. Penyedia Google Gemini API langsung harus menggunakan keluaran penalaran `native`
      agar OpenClaw menggunakan bagian pemikiran native tanpa menambahkan
      direktif prompt `<think>` / `<final>`. Backend bergaya Gemini CLI khusus teks
      yang mengurai respons JSON/teks akhir dapat mempertahankan kontrak bertanda
      `google-gemini` bersama.

      Beberapa pembantu aliran sengaja tetap bersifat lokal bagi penyedia. `@openclaw/anthropic-provider` mempertahankan `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, dan pembuat pembungkus Anthropic tingkat rendah dalam seam publik `api.ts` / `contract-api.ts` miliknya karena semuanya mengodekan penanganan beta OAuth Claude dan pemberian gerbang `context1m`. Plugin xAI juga mempertahankan pembentukan Responses xAI native dalam `wrapStreamFn` miliknya sendiri (alias `/fast`, `tool_stream` default, pembersihan alat ketat yang tidak didukung, penghapusan payload penalaran khusus xAI).

      Pola akar paket yang sama juga mendukung `@openclaw/openai-provider` (pembuat penyedia, pembantu model default, pembuat penyedia waktu nyata) dan `@openclaw/openrouter-provider` (pembuat penyedia beserta pembantu orientasi awal/konfigurasi).
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
      <Tab title="Identitas transportasi native">
        Untuk penyedia yang memerlukan header atau metadata permintaan/sesi native pada
        transportasi HTTP atau WebSocket generik:

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

        `resolveUsageAuth` memiliki tiga kemungkinan hasil. Kembalikan
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` ketika
        penyedia memiliki kredensial penggunaan/penagihan (bidang opsional membawa
        metadata paket nonrahasia dari profil yang telah diresolusi ke
        `fetchUsageSnapshot`). Kembalikan
        `{ handled: true }` hanya ketika penyedia telah menangani autentikasi penggunaan
        secara definitif tetapi tidak memiliki token penggunaan yang dapat digunakan, dan OpenClaw harus melewati
        fallback kunci API/OAuth generik. Kembalikan `null` atau `undefined` ketika penyedia
        tidak menangani permintaan dan OpenClaw harus melanjutkan dengan fallback generik.

        Deklarasikan ID penyedia dalam `contracts.usageProviders`. Ketika kontrak manifes
        tersebut dan **kedua** hook tersedia, OpenClaw secara otomatis menyertakan
        penyedia dalam pengumpulan penggunaan tanpa memuat plugin penyedia lain
        yang tidak terkait. Pembaruan daftar yang diizinkan pada inti tidak diperlukan.
        `fetchUsageSnapshot` mengembalikan bentuk bersama yang netral terhadap penyedia:

        - `plan`: label langganan atau kunci yang dilaporkan penyedia
        - `windows`: jendela kuota yang dapat diatur ulang sebagai persentase penggunaan
        - `billing`: entri `balance`, `spend`, atau `budget` bertipe; `unit` dapat berupa
          mata uang ISO atau unit penyedia seperti `credits`
        - `summary`: konteks ringkas khusus penyedia yang tidak sesuai dengan
          bidang terstruktur tersebut

        Pertahankan semantik mata uang secara tepat. Kredit penyedia bukan USD kecuali
        kontrak upstream menyatakannya demikian. Plugin yang hanya mengimplementasikan
        `fetchUsageSnapshot` tetap tersedia untuk pemanggil eksplisit/sintetis tetapi
        tidak ditemukan secara otomatis karena OpenClaw tidak dapat meresolusi kredensial penggunaannya.
      </Tab>
    </Tabs>

    <Accordion title="Hook penyedia umum">
      OpenClaw memanggil hook kira-kira dalam urutan ini untuk plugin model/penyedia.
      Sebagian besar penyedia hanya menggunakan 2-3. Ini bukan kontrak `ProviderPlugin`
      lengkap - lihat [Internal: Hook Runtime
      Penyedia](/id/plugins/architecture-internals#provider-runtime-hooks) untuk
      daftar hook lengkap yang akurat saat ini dan catatan fallback.
      Bidang penyedia khusus kompatibilitas yang tidak lagi dipanggil OpenClaw, seperti
      `ProviderPlugin.capabilities` dan `suppressBuiltInModel`, tidak dicantumkan
      di sini.

      | Hook | Kapan digunakan |
      | --- | --- |
      | `catalog` | Katalog model atau default URL dasar |
      | `applyConfigDefaults` | Default global milik penyedia selama materialisasi konfigurasi |
      | `normalizeModelId` | Pembersihan alias ID model lama/pratinjau sebelum pencarian |
      | `normalizeTransport` | Pembersihan `api` / `baseUrl` keluarga penyedia sebelum perakitan model generik |
      | `normalizeConfig` | Normalisasi konfigurasi `models.providers.<id>` |
      | `applyNativeStreamingUsageCompat` | Penulisan ulang kompatibilitas penggunaan streaming native untuk penyedia konfigurasi |
      | `resolveConfigApiKey` | Resolusi autentikasi penanda lingkungan milik penyedia |
      | `resolveSyntheticAuth` | Autentikasi sintetis lokal/dihosting sendiri atau berbasis konfigurasi |
      | `resolveExternalAuthProfiles` | Melapisi profil autentikasi eksternal milik penyedia untuk kredensial yang dikelola CLI/aplikasi |
      | `shouldDeferSyntheticProfileAuth` | Menurunkan placeholder profil tersimpan sintetis di belakang autentikasi lingkungan/konfigurasi |
      | `resolveDynamicModel` | Menerima ID model upstream arbitrer |
      | `prepareDynamicModel` | Pengambilan metadata asinkron sebelum resolusi |
      | `normalizeResolvedModel` | Penulisan ulang transportasi sebelum runner |
      | `normalizeToolSchemas` | Pembersihan skema alat milik penyedia sebelum pendaftaran |
      | `inspectToolSchemas` | Diagnostik skema alat milik penyedia |
      | `resolveReasoningOutputMode` | Kontrak keluaran penalaran bertag versus native |
      | `prepareExtraParams` | Parameter permintaan default |
      | `createStreamFn` | Transportasi StreamFn kustom sepenuhnya |
      | `wrapStreamFn` | Pembungkus header/body kustom pada jalur stream normal |
      | `resolveTransportTurnState` | Header/metadata native per giliran |
      | `resolveWebSocketSessionPolicy` | Header sesi WS native/masa jeda |
      | `formatApiKey` | Bentuk token runtime kustom |
      | `refreshOAuth` | Penyegaran OAuth kustom |
      | `buildAuthDoctorHint` | Panduan perbaikan autentikasi |
      | `matchesContextOverflowError` | Deteksi luapan milik penyedia |
      | `classifyFailoverReason` | Klasifikasi batas laju/kelebihan beban milik penyedia |
      | `isCacheTtlEligible` | Pembatasan TTL cache prompt |
      | `buildMissingAuthMessage` | Petunjuk autentikasi yang hilang secara kustom |
      | `augmentModelCatalog` | Baris kompatibilitas ke depan sintetis (tidak digunakan lagi - utamakan `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | Kumpulan opsi `/think` khusus model |
      | `isBinaryThinking` | Kompatibilitas pemikiran biner aktif/nonaktif (tidak digunakan lagi - utamakan `resolveThinkingProfile`) |
      | `supportsXHighThinking` | Kompatibilitas dukungan penalaran `xhigh` (tidak digunakan lagi - utamakan `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | Kompatibilitas kebijakan `/think` default (tidak digunakan lagi - utamakan `resolveThinkingProfile`) |
      | `isModernModelRef` | Pencocokan model langsung/smoke |
      | `prepareRuntimeAuth` | Pertukaran token sebelum inferensi |
      | `resolveUsageAuth` | Penguraian kredensial penggunaan kustom |
      | `fetchUsageSnapshot` | Endpoint penggunaan kustom |
      | `createEmbeddingProvider` | Adaptor embedding milik penyedia untuk memori/pencarian |
      | `buildReplayPolicy` | Kebijakan pemutaran ulang transkrip/Compaction kustom |
      | `sanitizeReplayHistory` | Penulisan ulang pemutaran ulang khusus penyedia setelah pembersihan generik |
      | `validateReplayTurns` | Validasi giliran pemutaran ulang yang ketat sebelum runner tertanam |
      | `onModelSelected` | Callback pascapemilihan (misalnya telemetri) |

      Catatan fallback runtime:

      - `normalizeConfig` meresolusi satu plugin pemilik per ID penyedia (penyedia bawaan terlebih dahulu, lalu plugin runtime yang cocok) dan hanya memanggil hook tersebut - tidak ada pemindaian terhadap penyedia lain. Hook `normalizeConfig` milik Google sendiri yang menormalisasi entri konfigurasi `google` / `google-vertex` / `google-antigravity`; ini bukan fallback inti yang terpisah.
      - `resolveConfigApiKey` menggunakan hook penyedia ketika diekspos. Amazon Bedrock mempertahankan resolusi penanda lingkungan AWS dalam plugin penyedianya; autentikasi runtime itu sendiri tetap menggunakan rantai default AWS SDK ketika dikonfigurasi dengan `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` menerima `provider` yang dipilih, `modelId`, petunjuk katalog `reasoning` gabungan opsional, dan fakta model `compat` gabungan opsional. Gunakan `compat` hanya untuk memilih UI/profil pemikiran penyedia.
      - `resolveSystemPromptContribution` memungkinkan penyedia menyuntikkan panduan prompt sistem yang sadar cache untuk sebuah keluarga model. Utamakan ini daripada hook `before_prompt_build` lama di seluruh plugin ketika perilaku tersebut hanya dimiliki satu keluarga penyedia/model dan harus mempertahankan pemisahan cache stabil/dinamis.

    </Accordion>

  </Step>

  <Step title="Tambahkan kemampuan tambahan (opsional)">
    ### Langkah 5: Tambahkan kemampuan tambahan

    Plugin penyedia dapat mendaftarkan embedding, ucapan, transkripsi realtime,
    suara realtime, pemahaman media, pembuatan gambar, pembuatan video,
    pengambilan web, dan pencarian web bersama inferensi teks. OpenClaw mengklasifikasikannya sebagai
    plugin **kemampuan-hibrida** - pola yang direkomendasikan untuk plugin perusahaan
    (satu plugin per vendor). Lihat
    [Internal: Kepemilikan Kemampuan](/id/plugins/architecture#capability-ownership-model).

    Daftarkan setiap kemampuan di dalam `register(api)` bersama pemanggilan
    `api.registerProvider(...)` yang sudah ada. Pilih hanya tab yang diperlukan:

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
        plugin berbagi pembacaan body kesalahan yang dibatasi, penguraian kesalahan JSON, dan
        sufiks ID permintaan.
      </Tab>
      <Tab title="Transkripsi realtime">
        Utamakan `createRealtimeTranscriptionWebSocketSession(...)` - helper bersama
        menangani perekaman proksi, backoff penyambungan ulang, pengosongan saat penutupan, handshake
        kesiapan, pengantrean audio, dan diagnostik peristiwa penutupan. Plugin Anda
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
        `openclaw/plugin-sdk/provider-http`. Helper tersebut menormalkan nama file
        unggahan, termasuk unggahan AAC yang memerlukan nama file bergaya M4A untuk
        API transkripsi yang kompatibel.
      </Tab>
      <Tab title="Suara waktu nyata">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Suara Waktu Nyata Acme",
          capabilities: {
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            supportsBargeIn: true,
            handlesInputAudioBargeIn: true,
            supportsToolCalls: true,
          },
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Tetapkan ini hanya jika penyedia menerima beberapa respons alat untuk
            // satu panggilan, misalnya respons "sedang bekerja" langsung yang diikuti
            // hasil akhir.
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
        transport, format audio, dan tanda fitur yang valid kepada klien Talk
        browser dan native. Implementasikan `handleBargeIn` ketika suatu transport dapat mendeteksi bahwa
        manusia sedang menyela pemutaran asisten dan penyedia mendukung
        pemotongan atau penghapusan respons audio aktif.
        `submitToolResult` dapat mengembalikan `void` untuk pengiriman sinkron, atau
        `Promise<void>` untuk batas penyelesaian asinkron yang dapat diekspos oleh bridge
        penyedia. Sesi relay Gateway menunggu promise tersebut sebelum
        mengonfirmasi hasil akhir atau menghapus run yang ditautkan; tolak promise tersebut ketika
        pengiriman gagal.
        Tetapkan `supportsToolResultSuppression: false` ketika penyedia tidak dapat
        mematuhi `options.suppressResponse`. OpenClaw kemudian menghindari supresi untuk
        hasil konsultasi paksa internal dan pembatalan, serta menolak permintaan langsung
        untuk hasil yang disupresi alih-alih memulai respons secara diam-diam.
        Konsumen `createRealtimeVoiceBridgeSession` juga dapat mengembalikan
        promise dari `onToolCall`; throw sinkron dan penolakan diteruskan
        ke callback `onError` milik sesi.
        Tetapkan `handlesInputAudioBargeIn` hanya ketika VAD penyedia mengonfirmasi
        interupsi dengan memanggil `onClearAudio("barge-in")`. Penyedia yang tidak menyertakan
        tanda tersebut menggunakan deteksi fallback audio masukan lokal OpenClaw.
      </Tab>
      <Tab title="Pemahaman media">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "Foto tentang..." }),
          transcribeAudio: async (req) => ({ text: "Transkrip..." }),
        });
        ```

        Penyedia media lokal atau yang dihosting sendiri yang secara sengaja tidak memerlukan
        kredensial dapat mengekspos `resolveAuth` dan mengembalikan `kind: "none"`.
        OpenClaw tetap mempertahankan gerbang autentikasi normal untuk penyedia yang tidak
        secara eksplisit memilih ikut serta. Penyedia yang sudah ada dapat tetap membaca `req.apiKey`;
        penyedia baru sebaiknya memilih `req.auth`.

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "plugin local-audio tanpa autentikasi",
          }),
          transcribeAudio: async (req) => ({ text: "Transkrip..." }),
        });
        ```
      </Tab>
      <Tab title="Embedding">
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
        kontrak embedding umum untuk pembuatan vektor yang dapat digunakan kembali, termasuk
        pencarian memori. `registerMemoryEmbeddingProvider(...)` adalah kompatibilitas
        yang tidak digunakan lagi untuk adaptor khusus memori yang sudah ada.
      </Tab>
      <Tab title="Pembuatan gambar dan video">
        Kemampuan gambar dan video menggunakan struktur **sadar-mode**. Penyedia
        gambar mendeklarasikan blok kemampuan `generate` dan `edit` yang wajib;
        penyedia video mendeklarasikan `generate`, `imageToVideo`, dan
        `videoToVideo`. Bidang agregat datar seperti `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` tidak cukup untuk mengiklankan
        dukungan mode transformasi atau mode yang dinonaktifkan dengan jelas. Pembuatan musik
        mengikuti pola `generate` / `edit` yang sama.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Gambar Acme",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Video Acme",
          defaultTimeoutMs: 600_000,
          models: ["acme-video", "acme-image-video"],
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
          catalogByModel: {
            "acme-image-video": {
              modes: ["imageToVideo"],
              capabilities: {
                imageToVideo: {
                  enabled: true,
                  maxVideos: 1,
                  maxInputImages: 1,
                  resolutions: ["480P", "720P", "1080P"],
                  supportsResolution: true,
                },
                videoToVideo: { enabled: false },
              },
            },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```

        `capabilities` wajib ada pada kedua jenis penyedia; `edit` dan blok
        transformasi video (`imageToVideo`, `videoToVideo`) selalu memerlukan
        tanda `enabled` yang eksplisit.

        Gunakan `catalogByModel` ketika mode statis atau kemampuan model yang tercantum
        berbeda dari nilai default penyedia. Metadata ini menjaga
        `video_generate action=list` dan katalog model tetap akurat tanpa
        memanggil kode penyedia. Pencarian dan penegakan kemampuan pada waktu permintaan
        tetap berada di `resolveModelCapabilities` dan `generateVideo`; gunakan kembali
        konstanta kemampuan yang sama untuk kedua jalur jika memungkinkan.
      </Tab>
      <Tab title="Pengambilan dan pencarian web">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Pengambilan Acme",
          hint: "Ambil halaman melalui backend rendering Acme.",
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
            description: "Ambil halaman melalui Pengambilan Acme.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Pencarian Acme",
          hint: "Cari di web melalui backend pencarian Acme.",
          envVars: ["ACME_SEARCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/search",
          credentialPath: "plugins.entries.acme.config.webSearch.apiKey",
          getCredentialValue: (searchConfig) => searchConfig?.acme?.apiKey,
          setCredentialValue: (searchConfigTarget, value) => {
            const acme = (searchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Cari di web melalui Pencarian Acme.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        Kedua jenis penyedia menggunakan struktur pengkabelan kredensial yang sama:
        `hint`, `envVars`, `placeholder`, `signupUrl`, `credentialPath`,
        `getCredentialValue`, `setCredentialValue`, dan `createTool` semuanya
        wajib.
      </Tab>
    </Tabs>

  </Step>

  <Step title="Uji">
    ### Langkah 6: Uji

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Ekspor objek konfigurasi penyedia Anda dari index.ts atau file khusus
    import { acmeProvider } from "./provider.js";

    describe("penyedia acme-ai", () => {
      it("menyelesaikan model dinamis", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("mengembalikan katalog ketika kunci tersedia", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("mengembalikan katalog null ketika tidak ada kunci", async () => {
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

`clawhub skill publish <path>` adalah perintah lain untuk memublikasikan folder skill,
bukan paket Plugin - jangan gunakan perintah tersebut di sini.

## Struktur file

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadata openclaw.providers
├── openclaw.plugin.json      # Manifes dengan metadata autentikasi penyedia
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Pengujian
    └── usage.ts              # Endpoint penggunaan (opsional)
```

## Referensi urutan katalog

`catalog.order` mengontrol kapan katalog Anda digabungkan relatif terhadap penyedia
bawaan:

| Urutan     | Kapan          | Kasus penggunaan                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Tahap pertama    | Penyedia kunci API biasa                         |
| `profile` | Setelah yang sederhana  | Penyedia yang dibatasi oleh profil autentikasi                |
| `paired`  | Setelah profil | Menyintesis beberapa entri terkait             |
| `late`    | Tahap terakhir     | Menimpa penyedia yang ada (menang jika terjadi benturan) |

## Langkah berikutnya

- [Plugin Saluran](/id/plugins/sdk-channel-plugins) - jika plugin Anda juga menyediakan saluran
- [Runtime SDK](/id/plugins/sdk-runtime) - pembantu `api.runtime` (TTS, pencarian, subagen)
- [Ikhtisar SDK](/id/plugins/sdk-overview) - referensi lengkap impor subjalur
- [Internal Plugin](/id/plugins/architecture-internals#provider-runtime-hooks) - detail hook dan contoh bawaan

## Terkait

- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)
- [Membangun plugin saluran](/id/plugins/sdk-channel-plugins)
