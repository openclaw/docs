---
read_when:
    - คุณกำลังสร้าง Plugin ผู้ให้บริการโมเดลใหม่ម្រាប់ OpenClaw
    - คุณต้องการเพิ่มพร็อกซีที่เข้ากันได้กับ OpenAI หรือ LLM แบบกำหนดเองเข้าใน OpenClaw
    - คุณต้องการเข้าใจ auth ของ provider, แค็ตตาล็อก และ runtime hooks
sidebarTitle: Provider plugins
summary: คู่มือทีละขั้นตอนสำหรับการสร้าง Plugin ผู้ให้บริการโมเดลสำหรับ OpenClaw
title: การสร้าง provider plugins
x-i18n:
    generated_at: "2026-04-25T13:55:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddfe0e61aa08dda3134728e364fbbf077fe0edfb16e31fc102adc9585bc8c1ac
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

คู่มือนี้จะพาคุณสร้าง provider plugin ที่เพิ่ม model provider
(LLM) ให้กับ OpenClaw เมื่อจบแล้วคุณจะมี provider ที่มี model catalog,
auth แบบ API key และการ resolve โมเดลแบบ dynamic

<Info>
  หากคุณยังไม่เคยสร้าง Plugin ของ OpenClaw มาก่อน โปรดอ่าน
  [Getting Started](/th/plugins/building-plugins) ก่อน สำหรับโครงสร้างแพ็กเกจพื้นฐาน
  และการตั้งค่า manifest
</Info>

<Tip>
  provider plugins จะเพิ่มโมเดลเข้าไปใน inference loop ปกติของ OpenClaw หากโมเดล
  จำเป็นต้องรันผ่าน native agent daemon ที่เป็นเจ้าของ threads, Compaction หรือ tool
  events ให้จับคู่ provider กับ [agent harness](/th/plugins/sdk-agent-harness)
  แทนการนำรายละเอียดของโปรโตคอล daemon ไปไว้ใน core
</Tip>

## ขั้นตอนแบบละเอียด

<Steps>
  <Step title="แพ็กเกจและ manifest">
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

    manifest ประกาศ `providerAuthEnvVars` เพื่อให้ OpenClaw ตรวจพบ
    ข้อมูลรับรองได้โดยไม่ต้องโหลด runtime ของ Plugin ของคุณ ให้เพิ่ม `providerAuthAliases`
    เมื่อ variant ของ provider ควรใช้ auth ของ provider id อื่นซ้ำ `modelSupport`
    เป็นตัวเลือกและช่วยให้ OpenClaw auto-load provider plugin ของคุณจาก shorthand
    model ids เช่น `acme-large` ก่อนที่จะมี runtime hooks หากคุณเผยแพร่
    provider บน ClawHub ฟิลด์ `openclaw.compat` และ `openclaw.build`
    เหล่านั้นจำเป็นใน `package.json`

  </Step>

  <Step title="ลงทะเบียน provider">
    provider ขั้นต่ำต้องมี `id`, `label`, `auth` และ `catalog`:

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
      },
    });
    ```

    นี่คือ provider ที่ใช้งานได้แล้ว ตอนนี้ผู้ใช้สามารถ
    `openclaw onboard --acme-ai-api-key <key>` และเลือก
    `acme-ai/acme-large` เป็นโมเดลได้

    หาก upstream provider ใช้ control tokens ที่ต่างจาก OpenClaw ให้เพิ่ม
    text transform แบบสองทิศทางขนาดเล็ก แทนการแทนที่ stream path:

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

    `input` จะเขียนทับ system prompt สุดท้ายและเนื้อหาข้อความแบบข้อความก่อน
    transport ส่วน `output` จะเขียนทับ assistant text deltas และข้อความสุดท้ายก่อน
    ที่ OpenClaw จะ parse control markers ของตัวเองหรือส่งต่อไปยังช่องทาง

    สำหรับ provider ที่มาพร้อมระบบซึ่งลงทะเบียน text provider เพียงตัวเดียวพร้อม API-key
    auth บวกกับ runtime เดียวที่อิงจาก catalog ให้เลือกใช้ helper ที่แคบกว่า
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

    `buildProvider` คือเส้นทาง catalog แบบ live ที่ใช้เมื่อ OpenClaw สามารถ resolve
    provider auth จริงได้ มันอาจทำ discovery แบบเฉพาะผู้ให้บริการได้
    ใช้ `buildStaticProvider` เฉพาะกับรายการออฟไลน์ที่ปลอดภัยให้แสดงก่อนที่จะตั้งค่า auth
    โดยมันต้องไม่ต้องใช้ข้อมูลรับรองหรือทำคำขอเครือข่าย
    ตอนนี้การแสดงผล `models list --all` ของ OpenClaw จะรัน static catalogs
    เฉพาะสำหรับ provider plugins ที่มาพร้อมระบบ โดยใช้ config ว่าง env ว่าง และไม่มี
    พาธ agent/workspace

    หาก flow ของ auth ของคุณต้องแพตช์ `models.providers.*`, aliases และ
    default model ของ agent ระหว่าง onboarding ด้วย ให้ใช้ preset helpers จาก
    `openclaw/plugin-sdk/provider-onboard` helper ที่แคบที่สุดคือ
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` และ
    `createModelCatalogPresetAppliers(...)`

    เมื่อปลายทางเนทีฟของ provider รองรับ streamed usage blocks บน
    transport `openai-completions` ปกติ ให้เลือกใช้ shared catalog helpers ใน
    `openclaw/plugin-sdk/provider-catalog-shared` แทนการ hardcode การตรวจสอบ provider-id
    `supportsNativeStreamingUsageCompat(...)` และ
    `applyProviderNativeStreamingUsageCompat(...)` จะตรวจจับการรองรับจากแผนที่ความสามารถของปลายทาง
    ดังนั้นปลายทางเนทีฟแบบ Moonshot/DashScope ยังคงเลือกใช้ได้ แม้ Plugin
    จะใช้ custom provider id

  </Step>

  <Step title="เพิ่มการ resolve โมเดลแบบ dynamic">
    หาก provider ของคุณยอมรับ model IDs แบบ arbitrary (เช่น proxy หรือ router)
    ให้เพิ่ม `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog จากด้านบน

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

    หากการ resolve ต้องใช้การเรียกเครือข่าย ให้ใช้ `prepareDynamicModel` สำหรับการ
    warm-up แบบ async — `resolveDynamicModel` จะทำงานอีกครั้งหลังมันเสร็จ

  </Step>

  <Step title="เพิ่ม runtime hooks (ตามความจำเป็น)">
    provider ส่วนใหญ่ต้องการเพียง `catalog` + `resolveDynamicModel` เพิ่ม hooks
    แบบค่อยเป็นค่อยไปตามที่ provider ของคุณต้องใช้

    ตอนนี้ shared helper builders ครอบคลุมตระกูล replay/tool-compat ที่พบบ่อยที่สุดแล้ว
    ดังนั้น Plugin โดยทั่วไปจึงไม่จำเป็นต้องต่อแต่ละ hook เองทีละตัว:

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

    ตระกูล replay ที่มีให้ใช้ในปัจจุบัน:

    | ตระกูล | สิ่งที่มันเชื่อมเข้ามา | ตัวอย่างที่มาพร้อมระบบ |
    | --- | --- | --- |
    | `openai-compatible` | นโยบาย replay แบบ OpenAI ที่ใช้ร่วมกันสำหรับ transport ที่เข้ากันได้กับ OpenAI รวมถึงการทำให้ tool-call-id สะอาด การแก้ลำดับ assistant-first และการตรวจสอบ Gemini-turn แบบทั่วไปเมื่อ transport ต้องใช้ | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | นโยบาย replay ที่รับรู้ Claude โดยเลือกจาก `modelId` ดังนั้น transport แบบข้อความ Anthropic จะได้รับการล้าง thinking-block แบบเฉพาะ Claude เฉพาะเมื่อโมเดลที่ resolve แล้วเป็น Claude จริง | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | นโยบาย replay ของ Gemini แบบเนทีฟ พร้อม bootstrap replay sanitation และโหมด reasoning-output แบบมีแท็ก | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | การทำ thought-signature sanitation สำหรับโมเดล Gemini ที่รันผ่าน transport proxy ที่เข้ากันได้กับ OpenAI; ไม่ได้เปิดใช้การตรวจสอบ native Gemini replay หรือการเขียนทับ bootstrap แบบเนทีฟ | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | นโยบายแบบไฮบริดสำหรับ provider ที่ผสมพื้นผิวโมเดลแบบข้อความ Anthropic และแบบที่เข้ากันได้กับ OpenAI ไว้ใน Plugin เดียว; การทิ้ง thinking-block แบบเฉพาะ Claude ที่เป็นทางเลือกยังคงจำกัดอยู่ฝั่ง Anthropic | `minimax` |

    ตระกูล stream ที่มีให้ใช้ในปัจจุบัน:

    | ตระกูล | สิ่งที่มันเชื่อมเข้ามา | ตัวอย่างที่มาพร้อมระบบ |
    | --- | --- | --- |
    | `google-thinking` | การ normalize payload สำหรับ Gemini thinking บน shared stream path | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Kilo reasoning wrapper บน shared proxy stream path โดย `kilo/auto` และ reasoning ids ของ proxy ที่ไม่รองรับจะข้าม thinking ที่ถูก inject | `kilocode` |
    | `moonshot-thinking` | การแมป payload แบบ native-thinking ไบนารีของ Moonshot จาก config + ระดับ `/think` | `moonshot` |
    | `minimax-fast-mode` | การเขียนทับโมเดล fast-mode ของ MiniMax บน shared stream path | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | wrapper ของ native OpenAI/Codex Responses ที่ใช้ร่วมกัน: attribution headers, `/fast`/`serviceTier`, text verbosity, native Codex web search, reasoning-compat payload shaping และการจัดการ context ของ Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | OpenRouter reasoning wrapper สำหรับเส้นทาง proxy โดยจัดการการข้ามแบบ unsupported-model/`auto` ไว้ส่วนกลาง | `openrouter` |
    | `tool-stream-default-on` | wrapper `tool_stream` แบบเปิดตามค่าเริ่มต้นสำหรับ provider อย่าง Z.AI ที่ต้องการ tool streaming เว้นแต่จะปิดอย่างชัดเจน | `zai` |

    <Accordion title="seam ของ SDK ที่ขับเคลื่อน family builders">
      family builder แต่ละตัวประกอบมาจาก helper ระดับล่างที่เป็น public ซึ่ง export จากแพ็กเกจเดียวกัน และคุณสามารถเรียกใช้โดยตรงได้เมื่อ provider ต้องออกนอกแพตเทิร์นทั่วไป:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` และ raw replay builders (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`) ยัง export helper ของ Gemini replay (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) และ helper สำหรับ endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`)
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` รวมถึง shared OpenAI/Codex wrappers (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) และ shared proxy/provider wrappers (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`)
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, helper ระดับล่างสำหรับ schema ของ Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) และ helper ด้าน compat ของ xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`) Plugin xAI ที่มาพร้อมระบบใช้ `normalizeResolvedModel` + `contributeResolvedModelCompat` ร่วมกับสิ่งเหล่านี้ เพื่อให้กฎของ xAI ยังคงเป็นของ provider

      helper สำหรับ stream บางตัวตั้งใจเก็บไว้เฉพาะ provider `@openclaw/anthropic-provider` คง `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` และ lower-level Anthropic wrapper builders ไว้ใน public seam ของ `api.ts` / `contract-api.ts` ของตัวเอง เพราะมันเข้ารหัสการจัดการ Claude OAuth beta และ gating ของ `context1m` เช่นเดียวกัน Plugin xAI ก็เก็บ native xAI Responses shaping ไว้ใน `wrapStreamFn` ของตัวเอง (`/fast` aliases, `tool_stream` ค่าเริ่มต้น, unsupported strict-tool cleanup, การลบ reasoning-payload ที่เฉพาะกับ xAI)

      แพตเทิร์น package-root แบบเดียวกันนี้ยังเป็นพื้นฐานของ `@openclaw/openai-provider` (provider builders, helper ของ default-model, realtime provider builders) และ `@openclaw/openrouter-provider` (provider builder พร้อม onboarding/config helpers)
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        สำหรับ provider ที่ต้องทำ token exchange ก่อนการเรียก inference แต่ละครั้ง:

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
      <Tab title="Custom headers">
        สำหรับ provider ที่ต้องใช้ custom request headers หรือการแก้ไข body:

        ```typescript
        // wrapStreamFn จะคืนค่า StreamFn ที่ได้มาจาก ctx.streamFn
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
      <Tab title="Native transport identity">
        สำหรับ provider ที่ต้องใช้ native request/session headers หรือ metadata บน
        generic HTTP หรือ WebSocket transports:

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
        สำหรับ provider ที่เปิดเผยข้อมูลการใช้งาน/การคิดค่าบริการ:

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

    <Accordion title="provider hooks ทั้งหมดที่มีให้ใช้">
      OpenClaw จะเรียก hooks ตามลำดับนี้ โดย provider ส่วนใหญ่ใช้เพียง 2-3 ตัว:

      | # | Hook | ใช้เมื่อใด |
      | --- | --- | --- |
      | 1 | `catalog` | model catalog หรือค่าเริ่มต้นของ base URL |
      | 2 | `applyConfigDefaults` | ค่าเริ่มต้นแบบ global ที่เป็นของ provider ระหว่างการสร้าง config ให้เป็นรูปธรรม |
      | 3 | `normalizeModelId` | ล้าง alias ของ model-id แบบ legacy/preview ก่อน lookup |
      | 4 | `normalizeTransport` | ล้าง `api` / `baseUrl` ของตระกูล provider ก่อนประกอบ generic model |
      | 5 | `normalizeConfig` | normalize config ของ `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | การเขียนทับ compat ของ native streaming-usage สำหรับ config providers |
      | 7 | `resolveConfigApiKey` | การ resolve auth จาก env-marker ที่เป็นของ provider |
      | 8 | `resolveSyntheticAuth` | auth สังเคราะห์แบบ local/self-hosted หรือแบบอิง config |
      | 9 | `shouldDeferSyntheticProfileAuth` | ลดลำดับ placeholder ของ stored-profile แบบสังเคราะห์ให้อยู่หลัง auth จาก env/config |
      | 10 | `resolveDynamicModel` | ยอมรับ upstream model IDs แบบ arbitrary |
      | 11 | `prepareDynamicModel` | ดึง metadata แบบ async ก่อน resolve |
      | 12 | `normalizeResolvedModel` | การเขียนทับ transport ก่อนถึง runner |
      | 13 | `contributeResolvedModelCompat` | ธง compat สำหรับ vendor models ที่อยู่หลัง compatible transport อื่น |
      | 14 | `capabilities` | ถุงความสามารถแบบ static รุ่นเก่า; มีไว้เพื่อความเข้ากันได้เท่านั้น |
      | 15 | `normalizeToolSchemas` | การล้าง tool-schema ที่เป็นของ provider ก่อนลงทะเบียน |
      | 16 | `inspectToolSchemas` | การวินิจฉัย tool-schema ที่เป็นของ provider |
      | 17 | `resolveReasoningOutputMode` | สัญญาของ reasoning-output แบบ tagged เทียบกับแบบ native |
      | 18 | `prepareExtraParams` | พารามิเตอร์คำขอเริ่มต้น |
      | 19 | `createStreamFn` | transport แบบ StreamFn ที่กำหนดเองทั้งหมด |
      | 20 | `wrapStreamFn` | wrapper ของ custom headers/body บน stream path ปกติ |
      | 21 | `resolveTransportTurnState` | headers/metadata ต่อเทิร์นแบบเนทีฟ |
      | 22 | `resolveWebSocketSessionPolicy` | headers/cool-down ของ native WS session |
      | 23 | `formatApiKey` | รูปแบบโทเค็น runtime แบบกำหนดเอง |
      | 24 | `refreshOAuth` | การรีเฟรช OAuth แบบกำหนดเอง |
      | 25 | `buildAuthDoctorHint` | คำแนะนำการซ่อม auth |
      | 26 | `matchesContextOverflowError` | การตรวจจับ overflow ที่เป็นของ provider |
      | 27 | `classifyFailoverReason` | การจัดประเภท rate-limit/overload ที่เป็นของ provider |
      | 28 | `isCacheTtlEligible` | gating ของ TTL สำหรับ prompt cache |
      | 29 | `buildMissingAuthMessage` | คำใบ้ missing-auth แบบกำหนดเอง |
      | 30 | `suppressBuiltInModel` | ซ่อนรายการ upstream ที่ล้าสมัย |
      | 31 | `augmentModelCatalog` | รายการสังเคราะห์เพื่อ forward-compat |
      | 32 | `resolveThinkingProfile` | ชุดตัวเลือก `/think` แบบเฉพาะโมเดล |
      | 33 | `isBinaryThinking` | compat ของการคิดแบบ binary เปิด/ปิด |
      | 34 | `supportsXHighThinking` | compat ของการรองรับ reasoning แบบ `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | compat ของนโยบาย `/think` เริ่มต้น |
      | 36 | `isModernModelRef` | การจับคู่โมเดลสำหรับ live/smoke |
      | 37 | `prepareRuntimeAuth` | token exchange ก่อน inference |
      | 38 | `resolveUsageAuth` | การ parse ข้อมูลรับรอง usage แบบกำหนดเอง |
      | 39 | `fetchUsageSnapshot` | ปลายทาง usage แบบกำหนดเอง |
      | 40 | `createEmbeddingProvider` | embedding adapter ที่เป็นของ provider สำหรับ memory/search |
      | 41 | `buildReplayPolicy` | นโยบาย replay/Compaction ของ transcript แบบกำหนดเอง |
      | 42 | `sanitizeReplayHistory` | การเขียนทับ replay แบบเฉพาะ provider หลังการล้างแบบ generic |
      | 43 | `validateReplayTurns` | การตรวจสอบ replay-turn แบบเข้มงวดก่อน embedded runner |
      | 44 | `onModelSelected` | callback หลังการเลือกโมเดล (เช่น telemetry) |

      หมายเหตุเรื่อง fallback ของ runtime:

      - `normalizeConfig` จะตรวจสอบ provider ที่ตรงกันก่อน จากนั้นจึงตรวจสอบ provider plugins อื่นที่รองรับ hook จนกว่าจะมีตัวหนึ่งเปลี่ยน config จริง หากไม่มี provider hook ใดเขียนทับรายการ config ของตระกูล Google ที่รองรับ ตัว normalizer ของ config Google ที่มาพร้อมระบบก็ยังคงถูกใช้
      - `resolveConfigApiKey` ใช้ provider hook เมื่อมีการเปิดเผยไว้ เส้นทาง `amazon-bedrock` ที่มาพร้อมระบบยังมี AWS env-marker resolver แบบในตัวที่นี่ด้วย แม้ว่า runtime auth ของ Bedrock เองยังคงใช้ AWS SDK default chain
      - `resolveSystemPromptContribution` ให้ provider inject คำแนะนำ system-prompt ที่รับรู้แคชสำหรับตระกูลโมเดล ให้ใช้มันแทน `before_prompt_build` เมื่อพฤติกรรมนั้นเป็นของ provider/ตระกูลโมเดลเดียว และควรคงการแยกแคชแบบ stable/dynamic ไว้

      สำหรับคำอธิบายแบบละเอียดและตัวอย่างการใช้งานจริง ดู [Internals: Provider Runtime Hooks](/th/plugins/architecture-internals#provider-runtime-hooks)
    </Accordion>

  </Step>

  <Step title="เพิ่มความสามารถเพิ่มเติม (ไม่บังคับ)">
    provider plugin สามารถลงทะเบียน speech, realtime transcription, realtime
    voice, media understanding, image generation, video generation, web fetch
    และ web search ควบคู่ไปกับ text inference ได้ OpenClaw จัดประเภทสิ่งนี้เป็น
    Plugin แบบ **hybrid-capability** — เป็นแพตเทิร์นที่แนะนำสำหรับ company plugins
    (หนึ่ง Plugin ต่อหนึ่ง vendor) ดู
    [Internals: Capability Ownership](/th/plugins/architecture#capability-ownership-model)

    ลงทะเบียนแต่ละ capability ภายใน `register(api)` ควบคู่ไปกับ
    `api.registerProvider(...)` ที่มีอยู่แล้วของคุณ เลือกเฉพาะแท็บที่คุณต้องการ:

    <Tabs>
      <Tab title="การสังเคราะห์เสียงพูด (TTS)">
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

        ใช้ `assertOkOrThrowProviderError(...)` สำหรับความล้มเหลวของ HTTP จาก provider เพื่อให้
        Plugin ใช้การอ่านเนื้อหาข้อผิดพลาดแบบจำกัดขนาดร่วมกัน การแยกวิเคราะห์ข้อผิดพลาด JSON และ
        ส่วนต่อท้าย request-id ร่วมกัน
      </Tab>
      <Tab title="การถอดเสียงแบบเรียลไทม์">
        ควรใช้ `createRealtimeTranscriptionWebSocketSession(...)` — ตัวช่วยที่ใช้ร่วมกันนี้
        จัดการการจับ proxy, reconnect backoff, close flushing, ready
        handshakes, การจัดคิวเสียง และการวินิจฉัยเหตุการณ์ปิดการเชื่อมต่อให้แล้ว
        Plugin ของคุณมีหน้าที่เพียงแมปเหตุการณ์จาก upstream เท่านั้น

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

        ผู้ให้บริการ STT แบบแบตช์ที่ POST เสียงแบบ multipart ควรใช้
        `buildAudioTranscriptionFormData(...)` จาก
        `openclaw/plugin-sdk/provider-http` ตัวช่วยนี้จะปรับมาตรฐาน
        ชื่อไฟล์อัปโหลด รวมถึงการอัปโหลด AAC ที่ต้องใช้ชื่อไฟล์สไตล์ M4A เพื่อให้เข้ากันได้กับ
        API ถอดเสียงที่รองรับ
      </Tab>
      <Tab title="เสียงแบบเรียลไทม์">
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
      <Tab title="การทำความเข้าใจสื่อ">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="การสร้างภาพและวิดีโอ">
        ความสามารถด้านวิดีโอใช้โครงสร้างแบบ **รับรู้ตามโหมด**: `generate`,
        `imageToVideo` และ `videoToVideo` ฟิลด์รวมแบบแบนอย่าง
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` เพียงอย่างเดียว
        ไม่เพียงพอสำหรับการประกาศการรองรับโหมดแปลง หรือโหมดที่ถูกปิดใช้งานได้อย่างชัดเจน
        การสร้างเพลงใช้รูปแบบเดียวกัน โดยมีบล็อก `generate` /
        `edit` ที่ระบุชัดเจน

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
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Web fetch และการค้นหา">
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

  <Step title="ทดสอบ">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // ส่งออกออบเจ็กต์การกำหนดค่า provider ของคุณจาก index.ts หรือไฟล์เฉพาะ
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

## เผยแพร่ไปยัง ClawHub

Plugin ของ provider เผยแพร่ด้วยวิธีเดียวกับ Plugin โค้ดภายนอกอื่น ๆ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

อย่าใช้ alias การเผยแพร่แบบเดิมที่รองรับเฉพาะ Skills ที่นี่; แพ็กเกจ Plugin ควรใช้
`clawhub package publish`

## โครงสร้างไฟล์

```
<bundled-plugin-root>/acme-ai/
├── package.json              # ข้อมูลเมตา openclaw.providers
├── openclaw.plugin.json      # Manifest พร้อมข้อมูลเมตาการยืนยันตัวตนของ provider
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # การทดสอบ
    └── usage.ts              # เอนด์พอยต์การใช้งาน (ไม่บังคับ)
```

## ข้อมูลอ้างอิงลำดับ Catalog

`catalog.order` ควบคุมว่า catalog ของคุณจะถูกรวมเมื่อใดเมื่อเทียบกับ
provider ที่มีมาในตัว:

| ลำดับ     | เมื่อใด        | กรณีใช้งาน                                      |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | รอบแรก        | provider แบบ API key ธรรมดา                    |
| `profile` | หลัง simple   | provider ที่ขึ้นกับ auth profile                |
| `paired`  | หลัง profile  | สังเคราะห์หลายรายการที่เกี่ยวข้องกัน           |
| `late`    | ลำดับสุดท้าย  | แทนที่ provider ที่มีอยู่แล้ว (ชนะเมื่อชนกัน) |

## ขั้นตอนถัดไป

- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) — หาก Plugin ของคุณมีช่องทางด้วย
- [SDK Runtime](/th/plugins/sdk-runtime) — ตัวช่วย `api.runtime` (TTS, search, subagent)
- [ภาพรวม SDK](/th/plugins/sdk-overview) — ข้อมูลอ้างอิง import subpath ฉบับเต็ม
- [รายละเอียดภายในของ Plugin](/th/plugins/architecture-internals#provider-runtime-hooks) — รายละเอียด hook และตัวอย่างที่มีมาในตัว

## ที่เกี่ยวข้อง

- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [การสร้าง Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
