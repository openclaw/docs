---
read_when:
    - คุณกำลังสร้าง Plugin ผู้ให้บริการโมเดลใหม่
    - คุณต้องการเพิ่มพร็อกซีที่เข้ากันได้กับ OpenAI หรือ LLM แบบกำหนดเองให้กับ OpenClaw
    - คุณต้องเข้าใจการยืนยันตัวตนของผู้ให้บริการ แค็ตตาล็อก และฮุกขณะรันไทม์
sidebarTitle: Provider plugins
summary: คู่มือทีละขั้นตอนสำหรับการสร้าง Plugin ผู้ให้บริการโมเดลสำหรับ OpenClaw
title: การสร้าง Plugin ผู้ให้บริการ
x-i18n:
    generated_at: "2026-04-26T11:37:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 987ff69584a3e076189770c253ce48191103b5224e12216fd3d2fc03608ca240
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

คู่มือนี้จะพาคุณสร้าง Plugin ผู้ให้บริการที่เพิ่มผู้ให้บริการโมเดล
(LLM) ให้กับ OpenClaw เมื่อจบแล้วคุณจะมีผู้ให้บริการที่มีแค็ตตาล็อกโมเดล
การยืนยันตัวตนด้วย API key และการแยกความละเอียดโมเดลแบบไดนามิก

<Info>
  หากคุณยังไม่เคยสร้าง Plugin ของ OpenClaw มาก่อน ให้ไปอ่าน
  [เริ่มต้นใช้งาน](/th/plugins/building-plugins) ก่อน เพื่อดูโครงสร้างแพ็กเกจ
  พื้นฐานและการตั้งค่า manifest
</Info>

<Tip>
  Plugin ผู้ให้บริการจะเพิ่มโมเดลเข้าไปในลูปการอนุมานปกติของ OpenClaw หากโมเดล
  จำเป็นต้องรันผ่าน native agent daemon ที่ดูแล threads, Compaction หรือ
  เหตุการณ์ของเครื่องมือ ให้จับคู่ผู้ให้บริการกับ [agent harness](/th/plugins/sdk-agent-harness)
  แทนการใส่รายละเอียด protocol ของ daemon ไว้ใน core
</Tip>

## คำแนะนำแบบทีละขั้นตอน

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

    manifest จะประกาศ `providerAuthEnvVars` เพื่อให้ OpenClaw ตรวจพบ
    ข้อมูลรับรองได้โดยไม่ต้องโหลดรันไทม์ของ Plugin ของคุณ เพิ่ม `providerAuthAliases`
    เมื่อรูปแบบหนึ่งของผู้ให้บริการควรใช้การยืนยันตัวตนร่วมกับ provider id ของอีกตัวหนึ่ง `modelSupport`
    เป็นตัวเลือกเสริม และช่วยให้ OpenClaw โหลด Plugin ผู้ให้บริการของคุณโดยอัตโนมัติจาก
    model id แบบย่อ เช่น `acme-large` ก่อนที่จะมีฮุกขณะรันไทม์ หากคุณเผยแพร่
    ผู้ให้บริการบน ClawHub ฟิลด์ `openclaw.compat` และ `openclaw.build` เหล่านั้น
    จำเป็นต้องมีใน `package.json`

  </Step>

  <Step title="ลงทะเบียนผู้ให้บริการ">
    ผู้ให้บริการขั้นต่ำต้องมี `id`, `label`, `auth` และ `catalog`:

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

    นี่คือผู้ให้บริการที่ใช้งานได้แล้ว ตอนนี้ผู้ใช้สามารถ
    `openclaw onboard --acme-ai-api-key <key>` และเลือก
    `acme-ai/acme-large` เป็นโมเดลของตนได้

    หากผู้ให้บริการต้นทางใช้ control token ที่แตกต่างจาก OpenClaw ให้เพิ่ม
    text transform แบบสองทิศทางขนาดเล็กแทนการแทนที่เส้นทางสตรีม:

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

    `input` จะเขียนใหม่ให้กับ system prompt สุดท้ายและเนื้อหาข้อความแบบข้อความก่อน
    ส่งผ่าน transport ส่วน `output` จะเขียนใหม่ให้กับ text delta ของผู้ช่วยและข้อความสุดท้ายก่อนที่
    OpenClaw จะพาร์ส control marker ของตัวเองหรือการส่งผ่านช่องทาง

    สำหรับผู้ให้บริการแบบ bundled ที่ลงทะเบียนเฉพาะผู้ให้บริการข้อความเพียงตัวเดียวพร้อมการยืนยันตัวตน
    ด้วย API key และรันไทม์เดียวที่อิงกับแค็ตตาล็อก ให้ใช้ตัวช่วยที่เฉพาะเจาะจงกว่า
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

    `buildProvider` คือเส้นทางแค็ตตาล็อกแบบสดที่ใช้เมื่อ OpenClaw สามารถแยก
    provider auth จริงได้ เส้นทางนี้อาจทำ discovery ที่เฉพาะกับผู้ให้บริการได้ ใช้
    `buildStaticProvider` เฉพาะสำหรับแถวแบบออฟไลน์ที่ปลอดภัยต่อการแสดงผลก่อนตั้งค่า auth
    เท่านั้น โดยต้องไม่ต้องใช้ข้อมูลรับรองหรือส่งคำขอเครือข่ายใด ๆ
    การแสดงผล `models list --all` ของ OpenClaw ในปัจจุบันจะเรียกใช้ static catalogs
    เฉพาะสำหรับ Plugin ผู้ให้บริการแบบ bundled โดยใช้ config ว่าง env ว่าง และไม่มี
    เส้นทาง agent/workspace

    หาก flow การยืนยันตัวตนของคุณจำเป็นต้องแก้ไข `models.providers.*`, aliases และ
    โมเดลเริ่มต้นของ agent ระหว่าง onboarding ด้วย ให้ใช้ preset helpers จาก
    `openclaw/plugin-sdk/provider-onboard` ตัวช่วยที่เฉพาะที่สุดคือ
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` และ
    `createModelCatalogPresetAppliers(...)`

    เมื่อ endpoint แบบเนทีฟของผู้ให้บริการรองรับบล็อกการใช้งานแบบสตรีมบน
    transport `openai-completions` ปกติ ให้เลือกใช้ตัวช่วยแค็ตตาล็อกร่วมจาก
    `openclaw/plugin-sdk/provider-catalog-shared` แทนการฮาร์ดโค้ดการตรวจสอบ
    provider id `supportsNativeStreamingUsageCompat(...)` และ
    `applyProviderNativeStreamingUsageCompat(...)` จะตรวจพบการรองรับจาก
    แผนที่ความสามารถของ endpoint ดังนั้น endpoint แบบเนทีฟสไตล์ Moonshot/DashScope จึงยังสามารถ
    opt in ได้ แม้ว่า Plugin จะใช้ provider id แบบกำหนดเอง

  </Step>

  <Step title="เพิ่มการแยกความละเอียดโมเดลแบบไดนามิก">
    หากผู้ให้บริการของคุณรับ model ID แบบกำหนดเองใด ๆ ก็ได้ (เช่น พร็อกซีหรือเราเตอร์)
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

    หากการแยกความละเอียดต้องใช้การเรียกเครือข่าย ให้ใช้ `prepareDynamicModel` สำหรับ
    การวอร์มอัปแบบ async — `resolveDynamicModel` จะถูกรันอีกครั้งหลังจากเสร็จสิ้น

  </Step>

  <Step title="เพิ่มฮุกขณะรันไทม์ (ตามความจำเป็น)">
    ผู้ให้บริการส่วนใหญ่ต้องใช้เพียง `catalog` + `resolveDynamicModel` เพิ่มฮุก
    แบบค่อยเป็นค่อยไปตามที่ผู้ให้บริการของคุณต้องการ

    ตอนนี้ตัวสร้างตัวช่วยแบบใช้ร่วมกันครอบคลุมตระกูล replay/tool-compat ที่พบบ่อยที่สุดแล้ว
    ดังนั้นโดยทั่วไป Plugin จึงไม่จำเป็นต้องต่อฮุกแต่ละตัวด้วยตัวเองทีละตัว:

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

    ตระกูล replay ที่มีให้ใช้งานในปัจจุบัน:

    | ตระกูล | สิ่งที่ระบบจะต่อให้ | ตัวอย่างแบบ bundled |
    | --- | --- | --- |
    | `openai-compatible` | นโยบาย replay แบบ OpenAI ที่ใช้ร่วมกันสำหรับ transport ที่เข้ากันได้กับ OpenAI รวมถึงการปรับความสะอาดของ tool-call-id การแก้ลำดับ assistant-first และการตรวจสอบ Gemini turn แบบทั่วไปเมื่อ transport ต้องใช้ | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | นโยบาย replay ที่รับรู้ Claude โดยเลือกตาม `modelId` ดังนั้น transport แบบข้อความของ Anthropic จะได้รับการล้าง thinking block ที่เฉพาะกับ Claude ก็ต่อเมื่อโมเดลที่แยกความละเอียดแล้วเป็น Claude id จริงเท่านั้น | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | นโยบาย replay แบบเนทีฟของ Gemini พร้อมการปรับความสะอาด bootstrap replay และโหมด reasoning-output แบบติดแท็ก | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | การปรับความสะอาดของ Gemini thought-signature สำหรับโมเดล Gemini ที่รันผ่าน transport พร็อกซีแบบเข้ากันได้กับ OpenAI; ไม่เปิดใช้การตรวจสอบ replay แบบเนทีฟของ Gemini หรือการเขียน bootstrap ใหม่ | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | นโยบายแบบไฮบริดสำหรับผู้ให้บริการที่ผสมทั้งพื้นผิวโมเดลแบบข้อความของ Anthropic และแบบเข้ากันได้กับ OpenAI ไว้ใน Plugin เดียว; การทิ้ง thinking block แบบ Claude-only ที่เป็นตัวเลือกยังคงจำกัดอยู่ฝั่ง Anthropic เท่านั้น | `minimax` |

    ตระกูล stream ที่มีให้ใช้งานในปัจจุบัน:

    | ตระกูล | สิ่งที่ระบบจะต่อให้ | ตัวอย่างแบบ bundled |
    | --- | --- | --- |
    | `google-thinking` | การปรับข้อมูล payload ของ Gemini thinking ให้เป็นมาตรฐานบนเส้นทางสตรีมที่ใช้ร่วมกัน | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | ตัวครอบ reasoning ของ Kilo บนเส้นทางสตรีมพร็อกซีที่ใช้ร่วมกัน โดย `kilo/auto` และ reasoning id ของพร็อกซีที่ไม่รองรับจะข้าม thinking ที่ฉีดเข้าไป | `kilocode` |
    | `moonshot-thinking` | การแมป payload native-thinking แบบไบนารีของ Moonshot จาก config + ระดับ `/think` | `moonshot` |
    | `minimax-fast-mode` | การเขียนโมเดลของ MiniMax fast-mode ใหม่บนเส้นทางสตรีมที่ใช้ร่วมกัน | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | ตัวครอบ Responses แบบเนทีฟของ OpenAI/Codex ที่ใช้ร่วมกัน: attribution headers, `/fast`/`serviceTier`, text verbosity, native Codex web search, การจัดรูป payload สำหรับความเข้ากันได้ของ reasoning และการจัดการบริบทของ Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | ตัวครอบ reasoning ของ OpenRouter สำหรับเส้นทางพร็อกซี โดยจัดการการข้าม unsupported-model/`auto` จากส่วนกลาง | `openrouter` |
    | `tool-stream-default-on` | ตัวครอบ `tool_stream` ที่เปิดใช้เป็นค่าเริ่มต้นสำหรับผู้ให้บริการอย่าง Z.AI ที่ต้องการสตรีมเครื่องมือ เว้นแต่จะปิดไว้โดยชัดเจน | `zai` |

    <Accordion title="SDK seams ที่ขับเคลื่อนตัวสร้าง family">
      ตัวสร้าง family แต่ละตัวประกอบขึ้นจากตัวช่วยสาธารณะระดับล่างที่ export จากแพ็กเกจเดียวกัน ซึ่งคุณสามารถใช้ได้เมื่อผู้ให้บริการต้องออกนอกแพตเทิร์นทั่วไป:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` และตัวสร้าง replay แบบดิบ (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`) นอกจากนี้ยัง export ตัวช่วย replay ของ Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) และตัวช่วย endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`)
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` รวมถึงตัวครอบ OpenAI/Codex ที่ใช้ร่วมกัน (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), ตัวครอบ DeepSeek V4 แบบเข้ากันได้กับ OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`) และตัวครอบพร็อกซี/ผู้ให้บริการที่ใช้ร่วมกัน (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`)
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, ตัวช่วย schema ของ Gemini ที่อยู่ด้านล่าง (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) และตัวช่วยด้านความเข้ากันได้ของ xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`) Plugin xAI แบบ bundled ใช้ `normalizeResolvedModel` + `contributeResolvedModelCompat` ร่วมกับสิ่งเหล่านี้เพื่อให้กฎของ xAI ยังคงเป็นความรับผิดชอบของผู้ให้บริการ

      ตัวช่วยสตรีมบางตัวตั้งใจให้คงอยู่เฉพาะในผู้ให้บริการ `@openclaw/anthropic-provider` เก็บ `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` และตัวสร้างตัวครอบ Anthropic ระดับล่างไว้ใน seam สาธารณะ `api.ts` / `contract-api.ts` ของตัวเอง เพราะสิ่งเหล่านี้เข้ารหัสการจัดการ Claude OAuth beta และการกำกับ `context1m` เอาไว้ Plugin xAI ก็เช่นกัน โดยเก็บการจัดรูป Responses แบบเนทีฟของ xAI ไว้ใน `wrapStreamFn` ของตัวเอง (`/fast` aliases, ค่าเริ่มต้น `tool_stream`, การล้าง strict-tool ที่ไม่รองรับ, การลบ reasoning-payload ที่เฉพาะกับ xAI)

      แพตเทิร์น package-root เดียวกันนี้ยังรองรับ `@openclaw/openai-provider` (ตัวสร้างผู้ให้บริการ ตัวช่วยโมเดลเริ่มต้น ตัวสร้างผู้ให้บริการแบบ realtime) และ `@openclaw/openrouter-provider` (ตัวสร้างผู้ให้บริการ พร้อมตัวช่วย onboarding/config)
    </Accordion>

    <Tabs>
      <Tab title="การแลกเปลี่ยนโทเค็น">
        สำหรับผู้ให้บริการที่ต้องมีการแลกเปลี่ยนโทเค็นก่อนการเรียก inference แต่ละครั้ง:

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
      <Tab title="เฮดเดอร์แบบกำหนดเอง">
        สำหรับผู้ให้บริการที่ต้องการเฮดเดอร์คำขอแบบกำหนดเองหรือการแก้ไข body:

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
      <Tab title="ข้อมูลระบุตัวตนของ native transport">
        สำหรับผู้ให้บริการที่ต้องใช้เฮดเดอร์หรือ metadata ของคำขอ/เซสชันแบบเนทีฟบน
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

    <Accordion title="ฮุกของผู้ให้บริการทั้งหมดที่มีให้ใช้">
      OpenClaw จะเรียกฮุกตามลำดับนี้ ผู้ให้บริการส่วนใหญ่ใช้เพียง 2-3 ตัว:

      | # | Hook | ใช้เมื่อใด |
      | --- | --- | --- |
      | 1 | `catalog` | แค็ตตาล็อกโมเดลหรือค่าเริ่มต้นของ base URL |
      | 2 | `applyConfigDefaults` | ค่าเริ่มต้นส่วนกลางที่ผู้ให้บริการเป็นเจ้าของระหว่างการ materialize config |
      | 3 | `normalizeModelId` | การล้าง alias ของ model-id แบบ legacy/preview ก่อน lookup |
      | 4 | `normalizeTransport` | การล้าง `api` / `baseUrl` ของตระกูลผู้ให้บริการก่อนประกอบโมเดลแบบทั่วไป |
      | 5 | `normalizeConfig` | ปรับ `models.providers.<id>` config ให้เป็นมาตรฐาน |
      | 6 | `applyNativeStreamingUsageCompat` | การเขียน compat ของ native streaming-usage ใหม่สำหรับ config providers |
      | 7 | `resolveConfigApiKey` | การแยก auth ของ env-marker ที่ผู้ให้บริการเป็นเจ้าของ |
      | 8 | `resolveSyntheticAuth` | synthetic auth แบบ local/self-hosted หรือที่อิงจาก config |
      | 9 | `shouldDeferSyntheticProfileAuth` | ลดลำดับ placeholder ของ stored-profile แบบ synthetic ให้อยู่หลัง env/config auth |
      | 10 | `resolveDynamicModel` | ยอมรับ model ID ต้นทางแบบกำหนดเองใด ๆ |
      | 11 | `prepareDynamicModel` | ดึง metadata แบบ async ก่อนการแยกความละเอียด |
      | 12 | `normalizeResolvedModel` | เขียน transport ใหม่ก่อนถึง runner |
      | 13 | `contributeResolvedModelCompat` | แฟล็กความเข้ากันได้สำหรับ vendor models ที่อยู่หลัง transport แบบเข้ากันได้ตัวอื่น |
      | 14 | `capabilities` | ถุงความสามารถแบบคงที่เดิม; เพื่อความเข้ากันได้เท่านั้น |
      | 15 | `normalizeToolSchemas` | การล้าง tool-schema ก่อนการลงทะเบียนที่ผู้ให้บริการเป็นเจ้าของ |
      | 16 | `inspectToolSchemas` | การวินิจฉัย tool-schema ที่ผู้ให้บริการเป็นเจ้าของ |
      | 17 | `resolveReasoningOutputMode` | ข้อตกลง reasoning-output แบบ tagged เทียบกับ native |
      | 18 | `prepareExtraParams` | request params ค่าเริ่มต้น |
      | 19 | `createStreamFn` | StreamFn transport แบบกำหนดเองทั้งหมด |
      | 20 | `wrapStreamFn` | ตัวครอบ headers/body แบบกำหนดเองบนเส้นทางสตรีมปกติ |
      | 21 | `resolveTransportTurnState` | headers/metadata ต่อ turn แบบเนทีฟ |
      | 22 | `resolveWebSocketSessionPolicy` | headers/cool-down ของเซสชัน WS แบบเนทีฟ |
      | 23 | `formatApiKey` | รูปแบบโทเค็นขณะรันไทม์แบบกำหนดเอง |
      | 24 | `refreshOAuth` | การรีเฟรช OAuth แบบกำหนดเอง |
      | 25 | `buildAuthDoctorHint` | คำแนะนำการซ่อมแซม auth |
      | 26 | `matchesContextOverflowError` | การตรวจจับ overflow ที่ผู้ให้บริการเป็นเจ้าของ |
      | 27 | `classifyFailoverReason` | การจัดประเภท rate-limit/overload ที่ผู้ให้บริการเป็นเจ้าของ |
      | 28 | `isCacheTtlEligible` | การกำกับ TTL ของ prompt cache |
      | 29 | `buildMissingAuthMessage` | คำแนะนำเมื่อไม่มี auth แบบกำหนดเอง |
      | 30 | `suppressBuiltInModel` | ซ่อนแถวต้นทางที่ล้าสมัย |
      | 31 | `augmentModelCatalog` | แถวสังเคราะห์สำหรับความเข้ากันได้ล่วงหน้า |
      | 32 | `resolveThinkingProfile` | ชุดตัวเลือก `/think` ที่เฉพาะกับโมเดล |
      | 33 | `isBinaryThinking` | ความเข้ากันได้ของการเปิด/ปิด binary thinking |
      | 34 | `supportsXHighThinking` | ความเข้ากันได้ของการรองรับ reasoning แบบ `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | ความเข้ากันได้ของนโยบาย `/think` เริ่มต้น |
      | 36 | `isModernModelRef` | การจับคู่โมเดลแบบ live/smoke |
      | 37 | `prepareRuntimeAuth` | การแลกเปลี่ยนโทเค็นก่อน inference |
      | 38 | `resolveUsageAuth` | การพาร์สข้อมูลรับรองการใช้งานแบบกำหนดเอง |
      | 39 | `fetchUsageSnapshot` | endpoint การใช้งานแบบกำหนดเอง |
      | 40 | `createEmbeddingProvider` | อะแดปเตอร์ embedding ที่ผู้ให้บริการเป็นเจ้าของสำหรับ memory/search |
      | 41 | `buildReplayPolicy` | นโยบาย replay/Compaction ของทรานสคริปต์แบบกำหนดเอง |
      | 42 | `sanitizeReplayHistory` | การเขียน replay ใหม่ที่เฉพาะกับผู้ให้บริการหลังการล้างทั่วไป |
      | 43 | `validateReplayTurns` | การตรวจสอบ replay-turn อย่างเข้มงวดก่อน embedded runner |
      | 44 | `onModelSelected` | callback หลังการเลือกโมเดล (เช่น telemetry) |

      หมายเหตุเกี่ยวกับ fallback ขณะรันไทม์:

      - `normalizeConfig` จะตรวจสอบผู้ให้บริการที่ตรงกันก่อน จากนั้นจึงตรวจ Plugin ผู้ให้บริการอื่นที่รองรับ hook ไปเรื่อย ๆ จนกว่าจะมีตัวหนึ่งเปลี่ยน config จริง ๆ หากไม่มี hook ของผู้ให้บริการตัวใดเขียนรายการ config ที่รองรับตระกูล Google ใหม่ ตัว normalizer config ของ Google แบบ bundled ก็ยังคงถูกใช้
      - `resolveConfigApiKey` จะใช้ hook ของผู้ให้บริการเมื่อมีการเปิดเผยไว้ เส้นทาง `amazon-bedrock` แบบ bundled ก็มีตัวแยก AWS env-marker ในตัวอยู่ที่นี่เช่นกัน แม้ว่า runtime auth ของ Bedrock เองจะยังใช้ AWS SDK default chain อยู่
      - `resolveSystemPromptContribution` อนุญาตให้ผู้ให้บริการฉีดคำแนะนำ system-prompt ที่รับรู้ cache สำหรับตระกูลโมเดลได้ ให้ใช้แทน `before_prompt_build` เมื่อพฤติกรรมดังกล่าวเป็นของผู้ให้บริการ/ตระกูลโมเดลเดียว และควรรักษาการแยก cache แบบคงที่/ไดนามิกให้คงอยู่

      สำหรับคำอธิบายโดยละเอียดและตัวอย่างจากการใช้งานจริง โปรดดู [ภายในระบบ: Provider Runtime Hooks](/th/plugins/architecture-internals#provider-runtime-hooks)
    </Accordion>

  </Step>

  <Step title="เพิ่มความสามารถเพิ่มเติม (ไม่บังคับ)">
    Plugin ผู้ให้บริการสามารถลงทะเบียนความสามารถด้านเสียง การถอดเสียงแบบ realtime
    เสียงแบบ realtime การเข้าใจสื่อ การสร้างภาพ การสร้างวิดีโอ การดึงข้อมูลเว็บ
    และการค้นหาเว็บควบคู่ไปกับ text inference ได้ OpenClaw จัดประเภทสิ่งนี้เป็น
    Plugin แบบ **hybrid-capability** — ซึ่งเป็นรูปแบบที่แนะนำสำหรับ company plugins
    (หนึ่ง Plugin ต่อหนึ่งผู้ขาย) โปรดดู
    [ภายในระบบ: ความเป็นเจ้าของของความสามารถ](/th/plugins/architecture#capability-ownership-model)

    ลงทะเบียนแต่ละความสามารถภายใน `register(api)` ควบคู่ไปกับการเรียก
    `api.registerProvider(...)` ที่มีอยู่ของคุณ เลือกเฉพาะแท็บที่คุณต้องการ:

    <Tabs>
      <Tab title="เสียงพูด (TTS)">
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

        ใช้ `assertOkOrThrowProviderError(...)` สำหรับความล้มเหลว HTTP ของผู้ให้บริการ เพื่อให้
        Plugin ใช้การอ่าน error-body แบบจำกัดขนาด การพาร์ส JSON error และ
        request-id suffixes ร่วมกัน
      </Tab>
      <Tab title="การถอดเสียงแบบ realtime">
        ควรใช้ `createRealtimeTranscriptionWebSocketSession(...)` — ตัวช่วยที่ใช้ร่วมกัน
        จะจัดการการดักจับพร็อกซี การถอยกลับเมื่อเชื่อมต่อใหม่ การ flush ตอนปิด การ handshake พร้อมใช้งาน
        การเข้าคิวเสียง และการวินิจฉัย close-event ให้ โดย Plugin ของคุณเพียงแมปเหตุการณ์ต้นทางเท่านั้น

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
        `openclaw/plugin-sdk/provider-http` ตัวช่วยนี้จะปรับชื่อไฟล์อัปโหลดให้เป็นมาตรฐาน
        รวมถึงการอัปโหลด AAC ที่ต้องใช้ชื่อไฟล์สไตล์ M4A เพื่อให้เข้ากันได้กับ
        transcription APIs
      </Tab>
      <Tab title="เสียงแบบ realtime">
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
      <Tab title="การเข้าใจสื่อ">
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
        ความสามารถด้านวิดีโอใช้รูปแบบที่ **รับรู้โหมด**: `generate`,
        `imageToVideo` และ `videoToVideo` ฟิลด์รวมแบบแบนอย่าง
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` เพียงอย่างเดียว
        ไม่เพียงพอที่จะประกาศการรองรับ transform-mode หรือโหมดที่ปิดใช้งานได้อย่างชัดเจน
        การสร้างเพลงก็ใช้รูปแบบเดียวกันนี้ โดยมีบล็อก `generate` /
        `edit` อย่างชัดเจน

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
      <Tab title="การดึงและค้นหาเว็บ">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "ดึงหน้าเว็บผ่าน backend การเรนเดอร์ของ Acme",
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
            description: "ดึงหน้าเว็บผ่าน Acme Fetch",
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

Plugin ผู้ให้บริการเผยแพร่แบบเดียวกับ code plugin ภายนอกอื่น ๆ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

อย่าใช้ alias สำหรับการเผยแพร่แบบเดิมที่มีไว้เฉพาะ Skills ในที่นี้; แพ็กเกจ Plugin ควรใช้
`clawhub package publish`

## โครงสร้างไฟล์

```
<bundled-plugin-root>/acme-ai/
├── package.json              # ข้อมูลเมตา openclaw.providers
├── openclaw.plugin.json      # Manifest พร้อมข้อมูลเมตา provider auth
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # การทดสอบ
    └── usage.ts              # endpoint การใช้งาน (ไม่บังคับ)
```

## อ้างอิงลำดับของแค็ตตาล็อก

`catalog.order` ควบคุมว่าแค็ตตาล็อกของคุณจะถูกรวมเมื่อใดเมื่อเทียบกับ
ผู้ให้บริการในตัว:

| ลำดับ | เมื่อใด | กรณีใช้งาน |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | รอบแรก    | ผู้ให้บริการ API key แบบธรรมดา                         |
| `profile` | หลัง simple  | ผู้ให้บริการที่ถูกกำกับด้วยโปรไฟล์ auth                |
| `paired`  | หลัง profile | สร้างหลายรายการที่เกี่ยวข้องกันแบบสังเคราะห์             |
| `late`    | รอบสุดท้าย     | เขียนทับผู้ให้บริการที่มีอยู่ (ชนะเมื่อชนกัน) |

## ขั้นตอนถัดไป

- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) — หาก Plugin ของคุณมีช่องทางด้วย
- [SDK Runtime](/th/plugins/sdk-runtime) — ตัวช่วย `api.runtime` (TTS, search, subagent)
- [ภาพรวม SDK](/th/plugins/sdk-overview) — เอกสารอ้างอิงการนำเข้า subpath แบบเต็ม
- [ภายในของ Plugin](/th/plugins/architecture-internals#provider-runtime-hooks) — รายละเอียดของ hook และตัวอย่างแบบ bundled

## ที่เกี่ยวข้อง

- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [การสร้าง Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
