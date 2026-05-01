---
read_when:
    - คุณกำลังสร้าง Plugin ผู้ให้บริการโมเดลตัวใหม่
    - คุณต้องการเพิ่มพร็อกซีที่เข้ากันได้กับ OpenAI หรือโมเดลภาษาขนาดใหญ่แบบกำหนดเองลงใน OpenClaw
    - คุณต้องเข้าใจการยืนยันตัวตนของผู้ให้บริการ แค็ตตาล็อก และฮุกขณะรันไทม์
sidebarTitle: Provider plugins
summary: คู่มือแบบทีละขั้นตอนในการสร้าง Plugin ผู้ให้บริการโมเดลสำหรับ OpenClaw
title: การสร้าง Plugin ผู้ให้บริการ
x-i18n:
    generated_at: "2026-05-01T10:20:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f9d721673bdfef0b9c1979b4b8b4c86f19d114374d6b941facb928c3574cd1b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

คู่มือนี้จะแนะนำขั้นตอนการสร้าง Plugin ผู้ให้บริการที่เพิ่มผู้ให้บริการโมเดล
(LLM) ให้กับ OpenClaw เมื่อจบแล้ว คุณจะมีผู้ให้บริการพร้อมแค็ตตาล็อกโมเดล,
การยืนยันตัวตนด้วยคีย์ API, และการแก้ไขโมเดลแบบไดนามิก

<Info>
  หากคุณยังไม่เคยสร้าง Plugin ของ OpenClaw มาก่อน ให้อ่าน
  [เริ่มต้นใช้งาน](/th/plugins/building-plugins) ก่อน เพื่อดูโครงสร้างแพ็กเกจ
  และการตั้งค่า manifest พื้นฐาน
</Info>

<Tip>
  Plugin ผู้ให้บริการจะเพิ่มโมเดลเข้าไปในลูปอนุมานปกติของ OpenClaw หากโมเดล
  ต้องทำงานผ่านดีมอนเอเจนต์แบบเนทีฟที่เป็นเจ้าของเธรด, Compaction, หรือเหตุการณ์เครื่องมือ
  ให้จับคู่ผู้ให้บริการกับ [ชุดควบคุมเอเจนต์](/th/plugins/sdk-agent-harness)
  แทนการใส่รายละเอียดโปรโตคอลของดีมอนใน core
</Tip>

## คำแนะนำทีละขั้นตอน

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
    ข้อมูลประจำตัวได้โดยไม่ต้องโหลดรันไทม์ของ Plugin คุณ เพิ่ม `providerAuthAliases`
    เมื่อรูปแบบย่อยของผู้ให้บริการควรใช้การยืนยันตัวตนของรหัสผู้ให้บริการอื่นร่วมกัน `modelSupport`
    เป็นตัวเลือกเสริมและช่วยให้ OpenClaw โหลด Plugin ผู้ให้บริการของคุณอัตโนมัติจากรหัสโมเดลแบบย่อ
    เช่น `acme-large` ก่อนที่จะมีฮุกรันไทม์ หากคุณเผยแพร่ผู้ให้บริการบน ClawHub
    ฟิลด์ `openclaw.compat` และ `openclaw.build` เหล่านั้น
    จำเป็นต้องมีใน `package.json`

  </Step>

  <Step title="ลงทะเบียนผู้ให้บริการ">
    ผู้ให้บริการขั้นต่ำต้องมี `id`, `label`, `auth`, และ `catalog`:

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

    นั่นคือผู้ให้บริการที่ใช้งานได้แล้ว ผู้ใช้สามารถ
    `openclaw onboard --acme-ai-api-key <key>` และเลือก
    `acme-ai/acme-large` เป็นโมเดลของตนได้แล้ว

    หากผู้ให้บริการต้นทางใช้โทเค็นควบคุมที่ต่างจาก OpenClaw ให้เพิ่ม
    การแปลงข้อความแบบสองทิศทางขนาดเล็กแทนการแทนที่เส้นทางสตรีม:

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

    `input` เขียนพรอมป์ระบบสุดท้ายและเนื้อหาข้อความใหม่ก่อน
    การขนส่ง `output` เขียนเดลตาข้อความของผู้ช่วยและข้อความสุดท้ายใหม่ก่อนที่
    OpenClaw จะแยกวิเคราะห์เครื่องหมายควบคุมของตัวเองหรือการส่งมอบช่องทาง

    สำหรับผู้ให้บริการที่บันเดิลมาซึ่งลงทะเบียนผู้ให้บริการข้อความเพียงหนึ่งรายพร้อมการยืนยันตัวตนด้วยคีย์ API
    และรันไทม์เดียวที่อิงแค็ตตาล็อก ให้เลือกใช้ตัวช่วยที่แคบกว่า
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

    `buildProvider` คือเส้นทางแค็ตตาล็อกแบบสดที่ใช้เมื่อ OpenClaw สามารถแก้ไขการยืนยันตัวตนจริง
    ของผู้ให้บริการได้ อาจทำการค้นพบเฉพาะผู้ให้บริการ ใช้
    `buildStaticProvider` เฉพาะสำหรับแถวออฟไลน์ที่ปลอดภัยต่อการแสดงก่อนตั้งค่าการยืนยันตัวตน
    เท่านั้น ต้องไม่ต้องใช้ข้อมูลประจำตัวหรือส่งคำขอเครือข่าย
    การแสดงผล `models list --all` ของ OpenClaw ในปัจจุบันจะรันแค็ตตาล็อกแบบสแตติก
    เฉพาะสำหรับ Plugin ผู้ให้บริการที่บันเดิลมา โดยใช้ config ว่าง, env ว่าง, และไม่มี
    พาธเอเจนต์/เวิร์กสเปซ

    หากโฟลว์การยืนยันตัวตนของคุณยังต้องแพตช์ `models.providers.*`, alias, และ
    โมเดลเริ่มต้นของเอเจนต์ระหว่างการ onboarding ให้ใช้ตัวช่วย preset จาก
    `openclaw/plugin-sdk/provider-onboard` ตัวช่วยที่แคบที่สุดคือ
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, และ
    `createModelCatalogPresetAppliers(...)`

    เมื่อเอนด์พอยต์เนทีฟของผู้ให้บริการรองรับบล็อกการใช้งานแบบสตรีมบน
    การขนส่ง `openai-completions` ปกติ ให้เลือกใช้ตัวช่วยแค็ตตาล็อกที่ใช้ร่วมกันใน
    `openclaw/plugin-sdk/provider-catalog-shared` แทนการฮาร์ดโค้ด
    การตรวจสอบรหัสผู้ให้บริการ `supportsNativeStreamingUsageCompat(...)` และ
    `applyProviderNativeStreamingUsageCompat(...)` ตรวจจับการรองรับจาก
    แผนที่ความสามารถของเอนด์พอยต์ ดังนั้นเอนด์พอยต์แบบเนทีฟสไตล์ Moonshot/DashScope
    จึงยังเลือกใช้ได้แม้ Plugin จะใช้รหัสผู้ให้บริการแบบกำหนดเอง

  </Step>

  <Step title="เพิ่มการแก้ไขโมเดลแบบไดนามิก">
    หากผู้ให้บริการของคุณยอมรับรหัสโมเดลใดก็ได้ (เช่น proxy หรือ router)
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

    หากการแก้ไขต้องใช้การเรียกเครือข่าย ให้ใช้ `prepareDynamicModel` สำหรับการวอร์มอัปแบบ async
    — `resolveDynamicModel` จะทำงานอีกครั้งหลังจากเสร็จสิ้น

  </Step>

  <Step title="เพิ่มฮุกรันไทม์ (ตามจำเป็น)">
    ผู้ให้บริการส่วนใหญ่ต้องใช้เพียง `catalog` + `resolveDynamicModel` เพิ่มฮุก
    ทีละส่วนตามที่ผู้ให้บริการของคุณต้องการ

    ตอนนี้ตัวสร้างตัวช่วยที่ใช้ร่วมกันครอบคลุมกลุ่ม replay/tool-compat ที่พบบ่อยที่สุด
    แล้ว ดังนั้นโดยปกติ Plugin จึงไม่จำเป็นต้องเชื่อมฮุกแต่ละตัวด้วยมือทีละตัว:

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

    กลุ่ม replay ที่มีให้ใช้ในปัจจุบัน:

    | กลุ่ม | สิ่งที่เชื่อมให้ | ตัวอย่างที่บันเดิลมา |
    | --- | --- | --- |
    | `openai-compatible` | นโยบาย replay แบบ OpenAI-style ที่ใช้ร่วมกันสำหรับการขนส่งที่เข้ากันได้กับ OpenAI รวมถึงการทำความสะอาด tool-call-id, การแก้ลำดับ assistant-first, และการตรวจสอบ Gemini-turn ทั่วไปเมื่อการขนส่งต้องใช้ | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | นโยบาย replay ที่รู้จัก Claude ซึ่งเลือกตาม `modelId` เพื่อให้การขนส่งข้อความแบบ Anthropic ได้รับการล้าง thinking-block เฉพาะ Claude เมื่อโมเดลที่แก้ไขได้เป็นรหัส Claude จริงเท่านั้น | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | นโยบาย replay แบบ Gemini เนทีฟ พร้อมการทำความสะอาด bootstrap replay และโหมด reasoning-output ที่ติดแท็ก | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | การทำความสะอาด thought-signature ของ Gemini สำหรับโมเดล Gemini ที่รันผ่านการขนส่ง proxy ที่เข้ากันได้กับ OpenAI; ไม่เปิดใช้การตรวจสอบ replay แบบ Gemini เนทีฟหรือการเขียน bootstrap ใหม่ | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | นโยบายไฮบริดสำหรับผู้ให้บริการที่ผสมพื้นผิวโมเดลแบบข้อความ Anthropic และแบบเข้ากันได้กับ OpenAI ใน Plugin เดียว; การดรอป thinking-block เฉพาะ Claude ซึ่งเป็นตัวเลือกเสริมจะยังจำกัดอยู่ที่ฝั่ง Anthropic | `minimax` |

    กลุ่มสตรีมที่มีให้ใช้ในปัจจุบัน:

    | ตระกูล | สิ่งที่เชื่อมต่อให้ | ตัวอย่างที่บันเดิลมา |
    | --- | --- | --- |
    | `google-thinking` | การปรับมาตรฐานเพย์โหลดการคิดของ Gemini บนเส้นทางสตรีมที่ใช้ร่วมกัน | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | wrapper เหตุผลของ Kilo บนเส้นทางสตรีมพร็อกซีที่ใช้ร่วมกัน โดยข้ามการฉีดการคิดสำหรับ `kilo/auto` และรหัสเหตุผลของพร็อกซีที่ไม่รองรับ | `kilocode` |
    | `moonshot-thinking` | การแมปเพย์โหลด native-thinking แบบไบนารีของ Moonshot จากการตั้งค่า + ระดับ `/think` | `moonshot` |
    | `minimax-fast-mode` | การเขียนโมเดล MiniMax fast-mode ใหม่บนเส้นทางสตรีมที่ใช้ร่วมกัน | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | wrapper OpenAI/Codex Responses แบบเนทีฟที่ใช้ร่วมกัน: เฮดเดอร์การระบุแหล่งที่มา, `/fast`/`serviceTier`, ความละเอียดของข้อความ, การค้นหาเว็บเนทีฟของ Codex, การจัดรูปเพย์โหลด reasoning-compat และการจัดการบริบทของ Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | wrapper เหตุผลของ OpenRouter สำหรับเส้นทางพร็อกซี โดยจัดการการข้ามสำหรับโมเดลที่ไม่รองรับ/`auto` จากส่วนกลาง | `openrouter` |
    | `tool-stream-default-on` | wrapper `tool_stream` แบบเปิดเป็นค่าเริ่มต้นสำหรับผู้ให้บริการอย่าง Z.AI ที่ต้องการสตรีมเครื่องมือ เว้นแต่จะปิดใช้งานอย่างชัดเจน | `zai` |

    <Accordion title="seam ของ SDK ที่ขับเคลื่อนตัวสร้างตระกูล">
      ตัวสร้างแต่ละตระกูลประกอบจากตัวช่วยสาธารณะระดับล่างที่ export จากแพ็กเกจเดียวกัน ซึ่งคุณสามารถใช้ได้เมื่อผู้ให้บริการจำเป็นต้องออกนอกแพตเทิร์นทั่วไป:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` และตัวสร้าง replay ดิบ (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`) นอกจากนี้ยัง export ตัวช่วย replay ของ Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) และตัวช่วย endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`)
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` รวมถึง wrapper OpenAI/Codex ที่ใช้ร่วมกัน (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper ที่เข้ากันได้กับ OpenAI ของ DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), การล้าง prefill การคิดของ Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) และ wrapper พร็อกซี/ผู้ให้บริการที่ใช้ร่วมกัน (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`)
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, ตัวช่วย schema ของ Gemini ที่อยู่เบื้องหลัง (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) และตัวช่วย compat ของ xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`) Plugin xAI ที่บันเดิลมาใช้ `normalizeResolvedModel` + `contributeResolvedModelCompat` ร่วมกับสิ่งเหล่านี้เพื่อให้กฎ xAI อยู่ภายใต้ผู้ให้บริการ

      ตัวช่วยสตรีมบางตัวยังคงอยู่เฉพาะผู้ให้บริการโดยตั้งใจ `@openclaw/anthropic-provider` เก็บ `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` และตัวสร้าง wrapper ของ Anthropic ระดับล่างไว้ใน seam สาธารณะ `api.ts` / `contract-api.ts` ของตัวเอง เพราะสิ่งเหล่านี้เข้ารหัสการจัดการ Claude OAuth beta และการ gating ของ `context1m` Plugin xAI ก็เก็บการจัดรูป Responses เนทีฟของ xAI ไว้ใน `wrapStreamFn` ของตัวเองเช่นกัน (alias ของ `/fast`, ค่าเริ่มต้น `tool_stream`, การล้าง strict-tool ที่ไม่รองรับ, การลบเพย์โหลดเหตุผลเฉพาะ xAI)

      แพตเทิร์น package-root เดียวกันยังรองรับ `@openclaw/openai-provider` (ตัวสร้างผู้ให้บริการ, ตัวช่วย default-model, ตัวสร้างผู้ให้บริการ realtime) และ `@openclaw/openrouter-provider` (ตัวสร้างผู้ให้บริการพร้อมตัวช่วย onboarding/config)
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
      <Tab title="เฮดเดอร์กำหนดเอง">
        สำหรับผู้ให้บริการที่ต้องใช้เฮดเดอร์คำขอกำหนดเองหรือการแก้ไข body:

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
      <Tab title="อัตลักษณ์การขนส่งเนทีฟ">
        สำหรับผู้ให้บริการที่ต้องใช้เฮดเดอร์คำขอ/เซสชันเนทีฟหรือเมตาดาต้าบน
        การขนส่ง HTTP หรือ WebSocket ทั่วไป:

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

    <Accordion title="hook ผู้ให้บริการทั้งหมดที่มี">
      OpenClaw เรียก hook ตามลำดับนี้ ผู้ให้บริการส่วนใหญ่ใช้เพียง 2-3 รายการ:
      ฟิลด์ผู้ให้บริการที่มีไว้เพื่อความเข้ากันได้เท่านั้นซึ่ง OpenClaw ไม่เรียกใช้อีกต่อไป เช่น
      `ProviderPlugin.capabilities` และ `suppressBuiltInModel` จะไม่แสดง
      ไว้ที่นี่

      | # | Hook | ควรใช้เมื่อใด |
      | --- | --- | --- |
      | 1 | `catalog` | แคตตาล็อกโมเดลหรือค่าเริ่มต้นของ base URL |
      | 2 | `applyConfigDefaults` | ค่าเริ่มต้นส่วนกลางที่ผู้ให้บริการเป็นเจ้าของระหว่างการ materialize การตั้งค่า |
      | 3 | `normalizeModelId` | การล้าง alias ของ legacy/preview model-id ก่อน lookup |
      | 4 | `normalizeTransport` | การล้าง `api` / `baseUrl` ของตระกูลผู้ให้บริการก่อนประกอบโมเดลทั่วไป |
      | 5 | `normalizeConfig` | ปรับมาตรฐาน config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | การเขียน compat ของ native streaming-usage ใหม่สำหรับผู้ให้บริการจาก config |
      | 7 | `resolveConfigApiKey` | การแก้ค่า auth แบบ env-marker ที่ผู้ให้บริการเป็นเจ้าของ |
      | 8 | `resolveSyntheticAuth` | auth สังเคราะห์แบบ local/self-hosted หรืออิง config |
      | 9 | `shouldDeferSyntheticProfileAuth` | ลดลำดับ placeholder โปรไฟล์ที่จัดเก็บแบบสังเคราะห์ไว้หลัง auth จาก env/config |
      | 10 | `resolveDynamicModel` | ยอมรับ ID โมเดล upstream ใดก็ได้ |
      | 11 | `prepareDynamicModel` | ดึงเมตาดาต้าแบบ async ก่อน resolve |
      | 12 | `normalizeResolvedModel` | การเขียน transport ใหม่ก่อน runner |
      | 13 | `contributeResolvedModelCompat` | แฟล็ก compat สำหรับโมเดลผู้ขายที่อยู่หลัง transport ที่เข้ากันได้อื่น |
      | 14 | `normalizeToolSchemas` | การล้าง tool-schema ที่ผู้ให้บริการเป็นเจ้าของก่อน registration |
      | 15 | `inspectToolSchemas` | การวินิจฉัย tool-schema ที่ผู้ให้บริการเป็นเจ้าของ |
      | 16 | `resolveReasoningOutputMode` | สัญญา reasoning-output แบบ tagged เทียบกับแบบเนทีฟ |
      | 17 | `prepareExtraParams` | พารามิเตอร์คำขอค่าเริ่มต้น |
      | 18 | `createStreamFn` | transport StreamFn แบบกำหนดเองทั้งหมด |
      | 19 | `wrapStreamFn` | wrapper เฮดเดอร์/body กำหนดเองบนเส้นทางสตรีมปกติ |
      | 20 | `resolveTransportTurnState` | เฮดเดอร์/เมตาดาต้าเนทีฟต่อ turn |
      | 21 | `resolveWebSocketSessionPolicy` | เฮดเดอร์/คูลดาวน์เซสชัน WS เนทีฟ |
      | 22 | `formatApiKey` | รูปแบบโทเค็น runtime กำหนดเอง |
      | 23 | `refreshOAuth` | การ refresh OAuth กำหนดเอง |
      | 24 | `buildAuthDoctorHint` | คำแนะนำการซ่อมแซม auth |
      | 25 | `matchesContextOverflowError` | การตรวจจับ overflow ที่ผู้ให้บริการเป็นเจ้าของ |
      | 26 | `classifyFailoverReason` | การจัดประเภท rate-limit/overload ที่ผู้ให้บริการเป็นเจ้าของ |
      | 27 | `isCacheTtlEligible` | การ gating TTL ของ prompt cache |
      | 28 | `buildMissingAuthMessage` | hint missing-auth กำหนดเอง |
      | 29 | `augmentModelCatalog` | แถว forward-compat สังเคราะห์ |
      | 30 | `resolveThinkingProfile` | ชุดตัวเลือก `/think` เฉพาะโมเดล |
      | 31 | `isBinaryThinking` | ความเข้ากันได้ของการคิดแบบไบนารีเปิด/ปิด |
      | 32 | `supportsXHighThinking` | ความเข้ากันได้กับการรองรับเหตุผล `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | ความเข้ากันได้ของนโยบาย `/think` ค่าเริ่มต้น |
      | 34 | `isModernModelRef` | การจับคู่โมเดล live/smoke |
      | 35 | `prepareRuntimeAuth` | การแลกเปลี่ยนโทเค็นก่อน inference |
      | 36 | `resolveUsageAuth` | การแยก credential การใช้งานกำหนดเอง |
      | 37 | `fetchUsageSnapshot` | endpoint การใช้งานกำหนดเอง |
      | 38 | `createEmbeddingProvider` | adapter embedding ที่ผู้ให้บริการเป็นเจ้าของสำหรับ memory/search |
      | 39 | `buildReplayPolicy` | นโยบาย replay/Compaction ของ transcript กำหนดเอง |
      | 40 | `sanitizeReplayHistory` | การเขียน replay ใหม่เฉพาะผู้ให้บริการหลังการล้างทั่วไป |
      | 41 | `validateReplayTurns` | การตรวจสอบ replay-turn แบบเข้มงวดก่อน runner แบบฝัง |
      | 42 | `onModelSelected` | callback หลังการเลือก (เช่น telemetry) |

      หมายเหตุ fallback ของ runtime:

      - `normalizeConfig` ตรวจสอบผู้ให้บริการที่ตรงกันก่อน จากนั้นตรวจสอบ Plugin ผู้ให้บริการอื่นที่มี hook จนกว่าจะมีรายการหนึ่งเปลี่ยน config จริง หากไม่มี hook ผู้ให้บริการใดเขียนรายการ config ตระกูล Google ที่รองรับใหม่ ตัวปรับมาตรฐาน config ของ Google ที่บันเดิลมาก็ยังทำงาน
      - `resolveConfigApiKey` ใช้ hook ของผู้ให้บริการเมื่อมีให้ใช้ เส้นทาง `amazon-bedrock` ที่บันเดิลมายังมี resolver env-marker ของ AWS ในตัวที่นี่ด้วย แม้ว่า auth runtime ของ Bedrock เองยังคงใช้เชนค่าเริ่มต้นของ AWS SDK
      - `resolveSystemPromptContribution` ให้ผู้ให้บริการฉีดคำแนะนำ system-prompt ที่รับรู้ cache สำหรับตระกูลโมเดลได้ ควรใช้สิ่งนี้แทน `before_prompt_build` เมื่อพฤติกรรมเป็นของผู้ให้บริการ/ตระกูลโมเดลเดียว และควรรักษาการแยก cache แบบ stable/dynamic

      สำหรับคำอธิบายละเอียดและตัวอย่างจากการใช้งานจริง โปรดดู [ภายใน: Hook Runtime ของผู้ให้บริการ](/th/plugins/architecture-internals#provider-runtime-hooks)
    </Accordion>

  </Step>

  <Step title="เพิ่มความสามารถเพิ่มเติม (ไม่บังคับ)">
    Plugin ผู้ให้บริการสามารถลงทะเบียน speech, realtime transcription, realtime
    voice, media understanding, image generation, video generation, web fetch,
    และ web search ควบคู่กับ text inference ได้ OpenClaw จัดประเภทสิ่งนี้เป็น
    Plugin แบบ **hybrid-capability** ซึ่งเป็นแพตเทิร์นที่แนะนำสำหรับ Plugin ของบริษัท
    (หนึ่ง Plugin ต่อผู้ขาย) ดู
    [ภายใน: ความเป็นเจ้าของความสามารถ](/th/plugins/architecture#capability-ownership-model)

    ลงทะเบียนแต่ละความสามารถภายใน `register(api)` ควบคู่กับการเรียก
    `api.registerProvider(...)` ที่มีอยู่ เลือกเฉพาะแท็บที่คุณต้องการ:

    <Tabs>
      <Tab title="คำพูด (TTS)">
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

        ใช้ `assertOkOrThrowProviderError(...)` สำหรับความล้มเหลวของ HTTP ของผู้ให้บริการ เพื่อให้
        Plugin ใช้การอ่านเนื้อหาข้อผิดพลาดแบบจำกัด การแยกวิเคราะห์ข้อผิดพลาด JSON และ
        ส่วนต่อท้าย request-id ร่วมกันได้
      </Tab>
      <Tab title="การถอดเสียงแบบเรียลไทม์">
        ควรใช้ `createRealtimeTranscriptionWebSocketSession(...)` — ตัวช่วยที่ใช้ร่วมกัน
        จัดการการจับพร็อกซี การหน่วงเวลาก่อนเชื่อมต่อใหม่ การล้างข้อมูลเมื่อปิด แฮนด์เชกความพร้อม
        การจัดคิวเสียง และการวินิจฉัยเหตุการณ์ปิด Plugin ของคุณ
        เพียงแมปเหตุการณ์จากต้นทางเท่านั้น

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
        `openclaw/plugin-sdk/provider-http` ตัวช่วยนี้ทำให้ชื่อไฟล์อัปโหลดเป็นรูปแบบมาตรฐาน
        รวมถึงการอัปโหลด AAC ที่ต้องใช้ชื่อไฟล์สไตล์ M4A สำหรับ
        API ถอดเสียงที่เข้ากันได้
      </Tab>
      <Tab title="เสียงแบบเรียลไทม์">
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

        ใช้งาน `handleBargeIn` เมื่อทรานสปอร์ตสามารถตรวจจับได้ว่ามนุษย์กำลัง
        ขัดจังหวะการเล่นเสียงของผู้ช่วย และผู้ให้บริการรองรับการตัดทอนหรือ
        ล้างการตอบกลับเสียงที่กำลังใช้งานอยู่
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
      <Tab title="การสร้างรูปภาพและวิดีโอ">
        ความสามารถวิดีโอใช้รูปแบบที่ **รับรู้โหมด** ได้แก่ `generate`,
        `imageToVideo` และ `videoToVideo` ฟิลด์รวมแบบแบน เช่น
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` นั้น
        ไม่เพียงพอสำหรับประกาศการรองรับโหมดแปลงหรือโหมดที่ปิดใช้งานอย่างชัดเจน
        การสร้างเพลงใช้รูปแบบเดียวกัน โดยมีบล็อก `generate` /
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
      <Tab title="การดึงข้อมูลเว็บและการค้นหา">
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

Plugin ผู้ให้บริการเผยแพร่ด้วยวิธีเดียวกับ Plugin โค้ดภายนอกอื่นๆ:

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

## อ้างอิงลำดับแคตตาล็อก

`catalog.order` ควบคุมเวลาที่แคตตาล็อกของคุณผสานเมื่อเทียบกับ
ผู้ให้บริการในตัว:

| ลำดับ     | เมื่อใด          | กรณีใช้งาน                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | รอบแรก    | ผู้ให้บริการที่ใช้ API-key ธรรมดา                         |
| `profile` | หลัง simple  | ผู้ให้บริการที่ถูกจำกัดด้วยโปรไฟล์การยืนยันตัวตน                |
| `paired`  | หลัง profile | สังเคราะห์รายการที่เกี่ยวข้องหลายรายการ             |
| `late`    | รอบสุดท้าย     | แทนที่ผู้ให้บริการที่มีอยู่ (ชนะเมื่อชนกัน) |

## ขั้นตอนถัดไป

- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) — หาก Plugin ของคุณมีช่องทางด้วย
- [SDK Runtime](/th/plugins/sdk-runtime) — ตัวช่วย `api.runtime` (TTS, การค้นหา, subagent)
- [ภาพรวม SDK](/th/plugins/sdk-overview) — อ้างอิงการนำเข้า subpath แบบเต็ม
- [ภายในของ Plugin](/th/plugins/architecture-internals#provider-runtime-hooks) — รายละเอียด hook และตัวอย่างที่มาพร้อมชุด

## ที่เกี่ยวข้อง

- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [การสร้าง Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
