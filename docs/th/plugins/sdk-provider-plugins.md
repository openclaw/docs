---
read_when:
    - คุณกำลังสร้าง Plugin ผู้ให้บริการโมเดลใหม่
    - คุณต้องการเพิ่มพร็อกซีที่เข้ากันได้กับ OpenAI หรือ LLM แบบกำหนดเองให้กับ OpenClaw
    - คุณจำเป็นต้องเข้าใจการยืนยันตัวตนของผู้ให้บริการ แค็ตตาล็อก และฮุกของรันไทม์
sidebarTitle: Provider plugins
summary: คู่มือแบบทีละขั้นตอนสำหรับการสร้าง Plugin ผู้ให้บริการโมเดลสำหรับ OpenClaw
title: การสร้าง Plugin ผู้ให้บริการ
x-i18n:
    generated_at: "2026-05-10T19:51:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1992653c8c6b079bbb6ea2b4f4b02dbd6a5a8aef286172af8048a7d9a98a8a4
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

คู่มือนี้อธิบายการสร้าง Plugin ผู้ให้บริการที่เพิ่มผู้ให้บริการโมเดล
(LLM) ให้กับ OpenClaw เมื่อทำเสร็จ คุณจะมีผู้ให้บริการพร้อมแค็ตตาล็อกโมเดล,
การยืนยันตัวตนด้วย API key, และการระบุโมเดลแบบไดนามิก

<Info>
  หากคุณยังไม่เคยสร้าง Plugin ของ OpenClaw มาก่อน ให้อ่าน
  [เริ่มต้นใช้งาน](/th/plugins/building-plugins) ก่อนสำหรับโครงสร้างแพ็กเกจพื้นฐาน
  และการตั้งค่า manifest
</Info>

<Tip>
  Plugin ผู้ให้บริการจะเพิ่มโมเดลเข้าไปในลูปอนุมานปกติของ OpenClaw หากโมเดล
  ต้องทำงานผ่าน daemon ของเอเจนต์แบบ native ที่เป็นเจ้าของเธรด, compaction, หรือเหตุการณ์เครื่องมือ
  ให้จับคู่ผู้ให้บริการกับ [agent harness](/th/plugins/sdk-agent-harness)
  แทนการใส่รายละเอียดโปรโตคอล daemon ไว้ใน core
</Tip>

## บทแนะนำ

<Steps>
  <Step title="Package and manifest">
    ### ขั้นตอนที่ 1: แพ็กเกจและ manifest

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
    ข้อมูลรับรองได้โดยไม่ต้องโหลด runtime ของ Plugin ของคุณ เพิ่ม `providerAuthAliases`
    เมื่อ variant ของผู้ให้บริการควรใช้ auth ของ id ผู้ให้บริการอื่นซ้ำ `modelSupport`
    เป็นตัวเลือกเสริมและช่วยให้ OpenClaw โหลด Plugin ผู้ให้บริการของคุณโดยอัตโนมัติจาก
    id โมเดลแบบย่อ เช่น `acme-large` ก่อนที่ runtime hooks จะมีอยู่ หากคุณเผยแพร่
    ผู้ให้บริการบน ClawHub ฟิลด์ `openclaw.compat` และ `openclaw.build` เหล่านั้น
    จำเป็นต้องมีใน `package.json`

  </Step>

  <Step title="Register the provider">
    ผู้ให้บริการข้อความขั้นต่ำต้องมี `id`, `label`, `auth`, และ `catalog`
    `catalog` คือ hook runtime/config ที่ผู้ให้บริการเป็นเจ้าของ; สามารถเรียก API
    ของผู้ขายแบบ live และส่งคืนรายการ `models.providers`

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

    `registerModelCatalogProvider` คือ surface แค็ตตาล็อก control-plane รุ่นใหม่กว่า
    สำหรับ UI รายการ/วิธีใช้/ตัวเลือก ใช้สำหรับแถว text, image-generation,
    video-generation, และ music-generation เก็บการเรียก endpoint ของผู้ขายและ
    การแมป response ไว้ใน Plugin; OpenClaw เป็นเจ้าของรูปทรงแถวที่ใช้ร่วมกัน, ป้ายกำกับ
    source, และการแสดงผลวิธีใช้

    นี่คือผู้ให้บริการที่ใช้งานได้แล้ว ตอนนี้ผู้ใช้สามารถ
    `openclaw onboard --acme-ai-api-key <key>` และเลือก
    `acme-ai/acme-large` เป็นโมเดลของตนได้

    หากผู้ให้บริการ upstream ใช้โทเคนควบคุมแตกต่างจาก OpenClaw ให้เพิ่ม
    การแปลงข้อความแบบสองทิศทางขนาดเล็กแทนการเปลี่ยน stream path:

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

    `input` เขียน prompt ระบบสุดท้ายและเนื้อหาข้อความใหม่ก่อน
    การส่งผ่าน transport `output` เขียนเดลตาข้อความของ assistant และข้อความสุดท้ายใหม่ก่อนที่
    OpenClaw จะแยกวิเคราะห์ control markers ของตัวเองหรือส่งต่อผ่านช่องทาง

    สำหรับผู้ให้บริการที่รวมมาพร้อมระบบซึ่งลงทะเบียนผู้ให้บริการข้อความเพียงรายเดียวพร้อม auth แบบ API-key
    และ runtime เดียวที่ backed ด้วยแค็ตตาล็อก ให้ใช้ helper ที่แคบกว่า
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

    `buildProvider` คือ path แค็ตตาล็อกแบบ live ที่ใช้เมื่อ OpenClaw สามารถระบุ auth
    ของผู้ให้บริการจริงได้ อาจทำ discovery เฉพาะผู้ให้บริการ ใช้
    `buildStaticProvider` เฉพาะสำหรับแถวออฟไลน์ที่ปลอดภัยต่อการแสดงก่อนตั้งค่า auth
    เท่านั้น; ต้องไม่ต้องใช้ข้อมูลรับรองหรือส่งคำขอเครือข่าย
    การแสดงผล `models list --all` ของ OpenClaw ปัจจุบันรันแค็ตตาล็อกแบบ static
    เฉพาะสำหรับ Plugin ผู้ให้บริการที่รวมมาพร้อมระบบ โดยใช้ config ว่าง, env ว่าง, และไม่มี
    path ของ agent/workspace

    หาก flow auth ของคุณยังต้อง patch `models.providers.*`, aliases, และ
    โมเดลเริ่มต้นของเอเจนต์ระหว่าง onboarding ให้ใช้ preset helpers จาก
    `openclaw/plugin-sdk/provider-onboard` helper ที่แคบที่สุดคือ
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, และ
    `createModelCatalogPresetAppliers(...)`

    เมื่อ endpoint แบบ native ของผู้ให้บริการรองรับบล็อก usage แบบ streamed บน
    transport `openai-completions` ปกติ ให้ใช้ helper แค็ตตาล็อกที่ใช้ร่วมกันใน
    `openclaw/plugin-sdk/provider-catalog-shared` แทนการ hardcode
    การตรวจสอบ provider-id `supportsNativeStreamingUsageCompat(...)` และ
    `applyProviderNativeStreamingUsageCompat(...)` ตรวจพบการรองรับจาก
    endpoint capability map ดังนั้น endpoint native แบบ Moonshot/DashScope-style ยัง
    opt in ได้แม้เมื่อ Plugin ใช้ id ผู้ให้บริการแบบกำหนดเอง

  </Step>

  <Step title="Add dynamic model resolution">
    หากผู้ให้บริการของคุณยอมรับ ID โมเดลใดก็ได้ (เช่น proxy หรือ router)
    ให้เพิ่ม `resolveDynamicModel`:

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

    หากการระบุจำเป็นต้องเรียกเครือข่าย ให้ใช้ `prepareDynamicModel` สำหรับ warm-up
    แบบ async - `resolveDynamicModel` จะรันอีกครั้งหลังจากทำเสร็จ

  </Step>

  <Step title="Add runtime hooks (as needed)">
    ผู้ให้บริการส่วนใหญ่ต้องการเพียง `catalog` + `resolveDynamicModel` เพิ่ม hooks
    ทีละส่วนตามที่ผู้ให้บริการของคุณต้องใช้

    ตอนนี้ shared helper builders ครอบคลุมกลุ่ม replay/tool-compat ที่พบบ่อยที่สุดแล้ว
    ดังนั้น Plugin โดยทั่วไปจึงไม่จำเป็นต้องต่อ hook แต่ละตัวด้วยตัวเองทีละตัว:

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

    กลุ่ม replay ที่มีในวันนี้:

    | ตระกูล | สิ่งที่เชื่อมต่อเข้ามา | ตัวอย่างที่รวมมาให้ |
    | --- | --- | --- |
    | `openai-compatible` | นโยบาย replay แบบ OpenAI ที่ใช้ร่วมกันสำหรับทรานสปอร์ตที่เข้ากันได้กับ OpenAI รวมถึงการทำความสะอาด tool-call-id การแก้ลำดับ assistant-first และการตรวจสอบ Gemini-turn ทั่วไปเมื่อทรานสปอร์ตต้องใช้ | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | นโยบาย replay ที่รับรู้ Claude ซึ่งเลือกโดย `modelId` เพื่อให้ทรานสปอร์ตข้อความ Anthropic ได้รับการล้าง thinking-block เฉพาะ Claude เฉพาะเมื่อโมเดลที่ resolve แล้วเป็น Claude id จริง ๆ | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | นโยบาย replay ของ Gemini แบบเนทีฟ พร้อมการทำความสะอาด bootstrap replay และโหมดเอาต์พุตเหตุผลแบบติดแท็ก | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | การทำความสะอาด thought-signature ของ Gemini สำหรับโมเดล Gemini ที่ทำงานผ่านทรานสปอร์ตพร็อกซีที่เข้ากันได้กับ OpenAI; ไม่เปิดใช้การตรวจสอบ replay ของ Gemini แบบเนทีฟหรือการเขียน bootstrap ใหม่ | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | นโยบายไฮบริดสำหรับผู้ให้บริการที่ผสมพื้นผิวโมเดลแบบข้อความ Anthropic และแบบเข้ากันได้กับ OpenAI ในปลั๊กอินเดียว; การทิ้ง thinking-block เฉพาะ Claude ที่เป็นตัวเลือกจะยังจำกัดอยู่ฝั่ง Anthropic | `minimax` |

    ตระกูลสตรีมที่มีอยู่วันนี้:

    | ตระกูล | สิ่งที่เชื่อมต่อเข้ามา | ตัวอย่างที่รวมมาให้ |
    | --- | --- | --- |
    | `google-thinking` | การ normalize เพย์โหลด thinking ของ Gemini บนเส้นทางสตรีมที่ใช้ร่วมกัน | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | ตัวครอบ reasoning ของ Kilo บนเส้นทางสตรีมพร็อกซีที่ใช้ร่วมกัน โดย `kilo/auto` และ reasoning ids ของพร็อกซีที่ไม่รองรับจะข้าม thinking ที่ฉีดเข้าไป | `kilocode` |
    | `moonshot-thinking` | การแมปเพย์โหลด native-thinking แบบไบนารีของ Moonshot จาก config + ระดับ `/think` | `moonshot` |
    | `minimax-fast-mode` | การเขียนโมเดล fast-mode ของ MiniMax ใหม่บนเส้นทางสตรีมที่ใช้ร่วมกัน | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | ตัวครอบ OpenAI/Codex Responses แบบเนทีฟที่ใช้ร่วมกัน: ส่วนหัว attribution, `/fast`/`serviceTier`, ความละเอียดของข้อความ, การค้นหาเว็บ Codex แบบเนทีฟ, การจัดรูปเพย์โหลด reasoning-compat และการจัดการบริบท Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | ตัวครอบ reasoning ของ OpenRouter สำหรับเส้นทางพร็อกซี โดยจัดการการข้าม unsupported-model/`auto` ไว้ที่ส่วนกลาง | `openrouter` |
    | `tool-stream-default-on` | ตัวครอบ `tool_stream` ที่เปิดเป็นค่าเริ่มต้นสำหรับผู้ให้บริการอย่าง Z.AI ที่ต้องการสตรีมเครื่องมือเว้นแต่จะปิดใช้อย่างชัดเจน | `zai` |

    <Accordion title="SDK seams ที่ขับเคลื่อน family builders">
      family builder แต่ละตัวประกอบจาก public helpers ระดับล่างที่ส่งออกจากแพ็กเกจเดียวกัน ซึ่งคุณสามารถหยิบใช้ได้เมื่อผู้ให้บริการจำเป็นต้องออกนอกแพตเทิร์นทั่วไป:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` และ raw replay builders (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`) นอกจากนี้ยังส่งออก Gemini replay helpers (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) และ endpoint/model helpers (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`)
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` รวมถึงตัวครอบ OpenAI/Codex ที่ใช้ร่วมกัน (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), ตัวครอบ DeepSeek V4 ที่เข้ากันได้กับ OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), การล้าง thinking prefill ของ Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) และตัวครอบ proxy/provider ที่ใช้ร่วมกัน (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`)
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")` และ Gemini schema helpers พื้นฐาน (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`)

      stream helpers บางตัวตั้งใจให้อยู่เฉพาะผู้ให้บริการ `@openclaw/anthropic-provider` เก็บ `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` และ Anthropic wrapper builders ระดับล่างไว้ใน public seam `api.ts` / `contract-api.ts` ของตัวเอง เพราะสิ่งเหล่านี้เข้ารหัสการจัดการ Claude OAuth beta และการ gating `context1m` ส่วนปลั๊กอิน xAI ก็เก็บการจัดรูป xAI Responses แบบเนทีฟไว้ใน `wrapStreamFn` ของตัวเองเช่นกัน (aliases ของ `/fast`, ค่าเริ่มต้น `tool_stream`, การล้าง strict-tool ที่ไม่รองรับ, การลบเพย์โหลด reasoning เฉพาะ xAI)

      แพตเทิร์น package-root เดียวกันยังรองรับ `@openclaw/openai-provider` (provider builders, default-model helpers, realtime provider builders) และ `@openclaw/openrouter-provider` (provider builder รวมถึง onboarding/config helpers)
    </Accordion>

    <Tabs>
      <Tab title="การแลกเปลี่ยนโทเค็น">
        สำหรับผู้ให้บริการที่ต้องแลกเปลี่ยนโทเค็นก่อนการเรียก inference แต่ละครั้ง:

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
      <Tab title="ส่วนหัวแบบกำหนดเอง">
        สำหรับผู้ให้บริการที่ต้องใช้ส่วนหัวคำขอแบบกำหนดเองหรือการปรับแก้ body:

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
      <Tab title="ตัวตนของทรานสปอร์ตแบบเนทีฟ">
        สำหรับผู้ให้บริการที่ต้องใช้ส่วนหัวคำขอ/เซสชันแบบเนทีฟหรือเมทาดาทาบน
        ทรานสปอร์ต HTTP หรือ WebSocket ทั่วไป:

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
      <Tab title="การใช้งานและการเรียกเก็บเงิน">
        สำหรับผู้ให้บริการที่เปิดเผยข้อมูลการใช้งาน/การเรียกเก็บเงิน:

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
      OpenClaw เรียก hooks ตามลำดับนี้ ผู้ให้บริการส่วนใหญ่ใช้เพียง 2-3 รายการ:
      ฟิลด์ผู้ให้บริการที่มีไว้เพื่อความเข้ากันได้เท่านั้นและ OpenClaw ไม่เรียกใช้อีกแล้ว เช่น
      `ProviderPlugin.capabilities` และ `suppressBuiltInModel` จะไม่ถูกแสดง
      ที่นี่

      | # | Hook | ควรใช้เมื่อใด |
      | --- | --- | --- |
      | 1 | `catalog` | แค็ตตาล็อกโมเดลหรือค่าเริ่มต้นของ URL ฐาน |
      | 2 | `applyConfigDefaults` | ค่าเริ่มต้นส่วนกลางที่ผู้ให้บริการเป็นเจ้าของระหว่างการ materialize config |
      | 3 | `normalizeModelId` | การล้าง alias ของ legacy/preview model-id ก่อน lookup |
      | 4 | `normalizeTransport` | การล้าง `api` / `baseUrl` ของ provider-family ก่อนการประกอบโมเดลทั่วไป |
      | 5 | `normalizeConfig` | Normalize config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | การเขียน compat ของ native streaming-usage ใหม่สำหรับผู้ให้บริการ config |
      | 7 | `resolveConfigApiKey` | การ resolve auth env-marker ที่ผู้ให้บริการเป็นเจ้าของ |
      | 8 | `resolveSyntheticAuth` | auth สังเคราะห์แบบ local/self-hosted หรือที่มี config รองรับ |
      | 9 | `shouldDeferSyntheticProfileAuth` | ลดลำดับ placeholders ของ stored-profile สังเคราะห์ไว้หลัง auth env/config |
      | 10 | `resolveDynamicModel` | ยอมรับ upstream model IDs ตามอำเภอใจ |
      | 11 | `prepareDynamicModel` | ดึงเมทาดาทาแบบ async ก่อนการ resolve |
      | 12 | `normalizeResolvedModel` | เขียนทรานสปอร์ตใหม่ก่อน runner |
      | 13 | `contributeResolvedModelCompat` | ธง compat สำหรับโมเดลผู้ขายที่อยู่หลังทรานสปอร์ต compatible อื่น |
      | 14 | `normalizeToolSchemas` | การล้าง tool-schema ที่ผู้ให้บริการเป็นเจ้าของก่อนลงทะเบียน |
      | 15 | `inspectToolSchemas` | การวินิจฉัย tool-schema ที่ผู้ให้บริการเป็นเจ้าของ |
      | 16 | `resolveReasoningOutputMode` | สัญญา reasoning-output แบบ tagged เทียบกับ native |
      | 17 | `prepareExtraParams` | พารามิเตอร์คำขอเริ่มต้น |
      | 18 | `createStreamFn` | ทรานสปอร์ต StreamFn แบบกำหนดเองทั้งหมด |
      | 19 | `wrapStreamFn` | ตัวครอบส่วนหัว/body แบบกำหนดเองบนเส้นทางสตรีมปกติ |
      | 20 | `resolveTransportTurnState` | ส่วนหัว/เมทาดาทาเนทีฟราย turn |
      | 21 | `resolveWebSocketSessionPolicy` | ส่วนหัวเซสชัน WS/คูลดาวน์แบบเนทีฟ |
      | 22 | `formatApiKey` | รูปทรงโทเค็น runtime แบบกำหนดเอง |
      | 23 | `refreshOAuth` | การ refresh OAuth แบบกำหนดเอง |
      | 24 | `buildAuthDoctorHint` | คำแนะนำการซ่อมแซม auth |
      | 25 | `matchesContextOverflowError` | การตรวจจับ overflow ที่ผู้ให้บริการเป็นเจ้าของ |
      | 26 | `classifyFailoverReason` | การจัดประเภท rate-limit/overload ที่ผู้ให้บริการเป็นเจ้าของ |
      | 27 | `isCacheTtlEligible` | การ gating TTL ของ prompt cache |
      | 28 | `buildMissingAuthMessage` | คำใบ้ missing-auth แบบกำหนดเอง |
      | 29 | `augmentModelCatalog` | แถว forward-compat สังเคราะห์ |
      | 30 | `resolveThinkingProfile` | ชุดตัวเลือก `/think` เฉพาะโมเดล |
      | 31 | `isBinaryThinking` | ความเข้ากันได้ของการเปิด/ปิด thinking แบบไบนารี |
      | 32 | `supportsXHighThinking` | ความเข้ากันได้ของการรองรับ reasoning `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | ความเข้ากันได้ของนโยบาย `/think` เริ่มต้น |
      | 34 | `isModernModelRef` | การจับคู่โมเดล live/smoke |
      | 35 | `prepareRuntimeAuth` | การแลกเปลี่ยนโทเค็นก่อน inference |
      | 36 | `resolveUsageAuth` | การแยกวิเคราะห์ credential การใช้งานแบบกำหนดเอง |
      | 37 | `fetchUsageSnapshot` | endpoint การใช้งานแบบกำหนดเอง |
      | 38 | `createEmbeddingProvider` | embedding adapter ที่ผู้ให้บริการเป็นเจ้าของสำหรับ memory/search |
      | 39 | `buildReplayPolicy` | นโยบาย transcript replay/compaction แบบกำหนดเอง |
      | 40 | `sanitizeReplayHistory` | การเขียน replay ใหม่เฉพาะผู้ให้บริการหลังการล้างทั่วไป |
      | 41 | `validateReplayTurns` | การตรวจสอบ replay-turn แบบเข้มงวดก่อน embedded runner |
      | 42 | `onModelSelected` | callback หลังการเลือก (เช่น telemetry) |

      หมายเหตุ runtime fallback:

      - `normalizeConfig` ตรวจสอบผู้ให้บริการที่ตรงกันก่อน จากนั้นจึงตรวจสอบปลั๊กอินผู้ให้บริการอื่นที่รองรับ hook จนกว่าจะมีตัวใดตัวหนึ่งเปลี่ยน config จริง หากไม่มี hook ผู้ให้บริการใดเขียนรายการ config ตระกูล Google ที่รองรับใหม่ ตัว normalize config ของ Google ที่รวมมากับระบบจะยังถูกใช้
      - `resolveConfigApiKey` ใช้ hook ของผู้ให้บริการเมื่อมีให้ใช้งาน เส้นทาง `amazon-bedrock` ที่รวมมาให้ยังมี AWS env-marker resolver ในตัวที่นี่ด้วย แม้ว่า auth ของ Bedrock runtime เองจะยังใช้ AWS SDK default chain
      - `resolveSystemPromptContribution` ให้ผู้ให้บริการฉีดคำแนะนำ system-prompt ที่รับรู้แคชสำหรับตระกูลโมเดลได้ ควรใช้แทน `before_prompt_build` เมื่อพฤติกรรมเป็นของผู้ให้บริการ/ตระกูลโมเดลเดียวและควรรักษาการแยกแคช stable/dynamic

      สำหรับคำอธิบายโดยละเอียดและตัวอย่างจากการใช้งานจริง โปรดดู [ภายใน: Provider Runtime Hooks](/th/plugins/architecture-internals#provider-runtime-hooks)
    </Accordion>

  </Step>

  <Step title="เพิ่มความสามารถเพิ่มเติม (ไม่บังคับ)">
    ### ขั้นตอนที่ 5: เพิ่มความสามารถเพิ่มเติม

    Plugin ผู้ให้บริการสามารถลงทะเบียน speech, realtime transcription, realtime
    voice, media understanding, image generation, video generation, web fetch,
    และ web search ควบคู่กับ text inference ได้ OpenClaw จัดประเภทสิ่งนี้เป็น
    Plugin แบบ **hybrid-capability** ซึ่งเป็นรูปแบบที่แนะนำสำหรับ Plugin ของบริษัท
    (หนึ่ง Plugin ต่อหนึ่งผู้ขาย) ดู
    [Internals: Capability Ownership](/th/plugins/architecture#capability-ownership-model)

    ลงทะเบียนแต่ละ capability ภายใน `register(api)` ควบคู่กับการเรียก
    `api.registerProvider(...)` ที่มีอยู่ เลือกเฉพาะแท็บที่ต้องการ:

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

        ใช้ `assertOkOrThrowProviderError(...)` สำหรับความล้มเหลว HTTP ของผู้ให้บริการ
        เพื่อให้ Plugin ใช้การอ่านเนื้อหาข้อผิดพลาดแบบจำกัด, การแยกวิเคราะห์ข้อผิดพลาด JSON,
        และส่วนต่อท้าย request-id ร่วมกัน
      </Tab>
      <Tab title="Realtime transcription">
        แนะนำให้ใช้ `createRealtimeTranscriptionWebSocketSession(...)` ซึ่งเป็นตัวช่วยร่วม
        ที่จัดการการบันทึก proxy, reconnect backoff, การ flush ตอนปิด, ready
        handshakes, การจัดคิวเสียง, และการวินิจฉัย close-event ให้ Plugin ของคุณ
        เพียงแค่แมปเหตุการณ์จากต้นทาง

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

        ผู้ให้บริการ STT แบบ batch ที่ POST เสียงแบบ multipart ควรใช้
        `buildAudioTranscriptionFormData(...)` จาก
        `openclaw/plugin-sdk/provider-http` ตัวช่วยนี้ปรับชื่อไฟล์อัปโหลดให้เป็นมาตรฐาน
        รวมถึงการอัปโหลด AAC ที่ต้องใช้ชื่อไฟล์สไตล์ M4A เพื่อให้เข้ากันได้กับ
        transcription API
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

        ประกาศ `capabilities` เพื่อให้ `talk.catalog` เปิดเผยโหมด,
        transports, รูปแบบเสียง, และ feature flags ที่ถูกต้องให้กับไคลเอนต์ Talk
        บนเบราว์เซอร์และแบบ native ใช้งาน `handleBargeIn` เมื่อ transport ตรวจจับได้ว่า
        มนุษย์กำลังขัดจังหวะการเล่นเสียงของผู้ช่วย และผู้ให้บริการรองรับการตัดทอนหรือ
        ล้างการตอบกลับเสียงที่กำลังทำงานอยู่
      </Tab>
      <Tab title="Media understanding">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Image and video generation">
        capability วิดีโอใช้รูปแบบที่ **รับรู้โหมด** ได้แก่ `generate`,
        `imageToVideo`, และ `videoToVideo` ฟิลด์รวมแบบแบน เช่น
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` ไม่เพียงพอ
        สำหรับประกาศการรองรับโหมด transform หรือโหมดที่ปิดใช้งานไว้อย่างชัดเจน
        การสร้างเพลงใช้รูปแบบเดียวกันด้วยบล็อก `generate` /
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
      <Tab title="Web fetch and search">
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

  <Step title="Test">
    ### ขั้นตอนที่ 6: ทดสอบ

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

## เผยแพร่ไปยัง ClawHub

Plugin ผู้ให้บริการเผยแพร่ในแบบเดียวกับ Plugin โค้ดภายนอกอื่นๆ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

อย่าใช้นามแฝงการเผยแพร่แบบเดิมที่ใช้เฉพาะ skill ที่นี่ แพ็กเกจ Plugin ควรใช้
`clawhub package publish`

## โครงสร้างไฟล์

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## อ้างอิงลำดับแค็ตตาล็อก

`catalog.order` ควบคุมว่าแค็ตตาล็อกของคุณจะผสานเมื่อใดเมื่อเทียบกับ
ผู้ให้บริการในตัว:

| ลำดับ     | เมื่อใด          | กรณีใช้งาน                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | รอบแรก    | ผู้ให้บริการ API-key แบบตรงไปตรงมา                         |
| `profile` | หลัง simple  | ผู้ให้บริการที่ถูกควบคุมด้วย auth profiles                |
| `paired`  | หลัง profile | สังเคราะห์รายการที่เกี่ยวข้องกันหลายรายการ             |
| `late`    | รอบสุดท้าย     | แทนที่ผู้ให้บริการที่มีอยู่ (ชนะเมื่อเกิดการชนกัน) |

## ขั้นตอนถัดไป

- [Channel Plugins](/th/plugins/sdk-channel-plugins) - หาก Plugin ของคุณให้ channel ด้วย
- [SDK Runtime](/th/plugins/sdk-runtime) - ตัวช่วย `api.runtime` (TTS, search, subagent)
- [SDK Overview](/th/plugins/sdk-overview) - อ้างอิง subpath import แบบครบถ้วน
- [Plugin Internals](/th/plugins/architecture-internals#provider-runtime-hooks) - รายละเอียด hook และตัวอย่างที่ bundled มา

## ที่เกี่ยวข้อง

- [Plugin SDK setup](/th/plugins/sdk-setup)
- [Building plugins](/th/plugins/building-plugins)
- [Building channel plugins](/th/plugins/sdk-channel-plugins)
