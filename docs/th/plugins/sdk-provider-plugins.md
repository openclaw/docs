---
read_when:
    - คุณกำลังสร้าง Plugin ผู้ให้บริการโมเดลใหม่
    - คุณต้องการเพิ่มพร็อกซีที่เข้ากันได้กับ OpenAI หรือ LLM แบบกำหนดเองลงใน OpenClaw
    - คุณต้องเข้าใจการยืนยันตัวตนของผู้ให้บริการ แคตตาล็อก และฮุกขณะรันไทม์
sidebarTitle: Provider plugins
summary: คู่มือแบบทีละขั้นตอนสำหรับการสร้าง Plugin ผู้ให้บริการโมเดลสำหรับ OpenClaw
title: การสร้าง Plugin ผู้ให้บริการ
x-i18n:
    generated_at: "2026-04-30T10:08:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1404594fe1d1e11a612f903512c1002c8f3a804dee53d4204457b534eae93381
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

คู่มือนี้อธิบายขั้นตอนการสร้าง Plugin ผู้ให้บริการที่เพิ่มผู้ให้บริการโมเดล
(LLM) ให้กับ OpenClaw เมื่อจบแล้ว คุณจะมีผู้ให้บริการที่มีแค็ตตาล็อกโมเดล
การยืนยันตัวตนด้วยคีย์ API และการแก้ข้อมูลโมเดลแบบไดนามิก

<Info>
  หากคุณยังไม่เคยสร้าง Plugin ของ OpenClaw มาก่อน ให้อ่าน
  [เริ่มต้นใช้งาน](/th/plugins/building-plugins) ก่อนเพื่อทำความเข้าใจโครงสร้างแพ็กเกจ
  พื้นฐานและการตั้งค่า manifest
</Info>

<Tip>
  Plugin ผู้ให้บริการจะเพิ่มโมเดลเข้าไปในลูป inference ปกติของ OpenClaw หากโมเดล
  ต้องทำงานผ่านเดมอน agent แบบ native ที่เป็นเจ้าของเธรด, Compaction หรืออีเวนต์เครื่องมือ
  ให้จับคู่ผู้ให้บริการกับ [agent harness](/th/plugins/sdk-agent-harness)
  แทนการใส่รายละเอียดโปรโตคอลของเดมอนไว้ใน core
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
    ข้อมูลรับรองได้โดยไม่ต้องโหลดรันไทม์ของ Plugin ของคุณ เพิ่ม `providerAuthAliases`
    เมื่อ variant ของผู้ให้บริการควรใช้การยืนยันตัวตนของ id ผู้ให้บริการอีกรายซ้ำ `modelSupport`
    เป็นตัวเลือกเสริม และช่วยให้ OpenClaw โหลด Plugin ผู้ให้บริการของคุณอัตโนมัติจาก
    id โมเดลแบบย่อ เช่น `acme-large` ก่อนที่จะมี hook ระดับรันไทม์ หากคุณเผยแพร่
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

    หากผู้ให้บริการต้นทางใช้โทเคนควบคุมต่างจาก OpenClaw ให้เพิ่ม
    การแปลงข้อความสองทิศทางขนาดเล็ก แทนการแทนที่เส้นทางสตรีม:

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

    `input` เขียน prompt ระบบสุดท้ายและเนื้อหาข้อความใหม่ก่อนการส่งผ่าน
    `output` เขียนเดลตาข้อความของ assistant และข้อความสุดท้ายใหม่ก่อนที่
    OpenClaw จะวิเคราะห์ marker ควบคุมของตัวเองหรือส่งต่อไปยังช่องทาง

    สำหรับผู้ให้บริการที่ bundled ซึ่งลงทะเบียนผู้ให้บริการข้อความเพียงหนึ่งรายพร้อมการยืนยันตัวตน
    ด้วยคีย์ API และมีรันไทม์ที่อิงแค็ตตาล็อกเพียงหนึ่งรายการ ให้ใช้ helper ที่แคบกว่า
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

    `buildProvider` คือเส้นทางแค็ตตาล็อกแบบ live ที่ใช้เมื่อ OpenClaw แก้ข้อมูล
    การยืนยันตัวตนจริงของผู้ให้บริการได้ และอาจทำ discovery เฉพาะผู้ให้บริการ
    ใช้ `buildStaticProvider` เฉพาะสำหรับแถวแบบออฟไลน์ที่ปลอดภัยต่อการแสดงก่อนตั้งค่า
    การยืนยันตัวตนเท่านั้น โดยต้องไม่ต้องใช้ข้อมูลรับรองหรือส่งคำขอเครือข่าย
    การแสดงผล `models list --all` ของ OpenClaw ในปัจจุบันจะเรียกใช้แค็ตตาล็อกแบบ static
    เฉพาะสำหรับ Plugin ผู้ให้บริการแบบ bundled โดยใช้ config ว่าง env ว่าง และไม่มี
    path ของ agent/workspace

    หาก flow การยืนยันตัวตนของคุณต้อง patch `models.providers.*`, alias และ
    โมเดลเริ่มต้นของ agent ระหว่าง onboarding ด้วย ให้ใช้ preset helper จาก
    `openclaw/plugin-sdk/provider-onboard` helper ที่แคบที่สุดคือ
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` และ
    `createModelCatalogPresetAppliers(...)`

    เมื่อ endpoint แบบ native ของผู้ให้บริการรองรับบล็อก usage แบบ streamed บน
    การส่งผ่าน `openai-completions` ปกติ ให้ใช้ helper แค็ตตาล็อกที่ใช้ร่วมกันใน
    `openclaw/plugin-sdk/provider-catalog-shared` แทนการ hardcode
    การตรวจสอบ id ผู้ให้บริการ `supportsNativeStreamingUsageCompat(...)` และ
    `applyProviderNativeStreamingUsageCompat(...)` จะตรวจพบการรองรับจาก
    capability map ของ endpoint ดังนั้น endpoint แบบ native สไตล์ Moonshot/DashScope
    จึงยัง opt in ได้แม้ Plugin จะใช้ id ผู้ให้บริการแบบกำหนดเอง

  </Step>

  <Step title="เพิ่มการแก้ข้อมูลโมเดลแบบไดนามิก">
    หากผู้ให้บริการของคุณรับ ID โมเดลใดก็ได้ (เช่น proxy หรือ router)
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

    หากการแก้ข้อมูลต้องใช้คำขอเครือข่าย ให้ใช้ `prepareDynamicModel` สำหรับการ warm-up
    แบบ async — `resolveDynamicModel` จะรันอีกครั้งหลังจากทำงานเสร็จ

  </Step>

  <Step title="เพิ่ม hook ระดับรันไทม์ (ตามจำเป็น)">
    ผู้ให้บริการส่วนใหญ่ต้องใช้เพียง `catalog` + `resolveDynamicModel` เพิ่ม hook
    แบบค่อยเป็นค่อยไปตามที่ผู้ให้บริการของคุณต้องการ

    helper builder ที่ใช้ร่วมกันตอนนี้ครอบคลุมกลุ่ม replay/tool-compat ที่พบบ่อยที่สุดแล้ว
    ดังนั้นโดยปกติ Plugin จึงไม่จำเป็นต้องต่อ hook แต่ละตัวเองทีละตัว:

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

    กลุ่ม replay ที่มีอยู่ในวันนี้:

    | กลุ่ม | สิ่งที่ต่อเข้ามา | ตัวอย่างที่ bundled |
    | --- | --- | --- |
    | `openai-compatible` | นโยบาย replay สไตล์ OpenAI ที่ใช้ร่วมกันสำหรับการส่งผ่านที่เข้ากันได้กับ OpenAI รวมถึงการทำความสะอาด tool-call-id การแก้ลำดับ assistant-first และการตรวจสอบ Gemini-turn ทั่วไปในกรณีที่การส่งผ่านต้องใช้ | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | นโยบาย replay ที่รับรู้ Claude ซึ่งเลือกตาม `modelId` เพื่อให้การส่งผ่านแบบ Anthropic-message ได้รับการ cleanup thinking-block เฉพาะ Claude เฉพาะเมื่อโมเดลที่แก้ข้อมูลแล้วเป็น id ของ Claude จริงๆ | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | นโยบาย replay แบบ native ของ Gemini พร้อมการทำความสะอาด bootstrap replay และโหมด reasoning-output แบบ tagged | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | การทำความสะอาด thought-signature ของ Gemini สำหรับโมเดล Gemini ที่ทำงานผ่านการส่งผ่าน proxy ที่เข้ากันได้กับ OpenAI; ไม่เปิดใช้การตรวจสอบ replay แบบ native ของ Gemini หรือการเขียน bootstrap ใหม่ | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | นโยบายแบบ hybrid สำหรับผู้ให้บริการที่ผสมพื้นผิวโมเดลแบบ Anthropic-message และแบบเข้ากันได้กับ OpenAI ไว้ใน Plugin เดียว; การตัด thinking-block เฉพาะ Claude แบบตัวเลือกเสริมจะยังจำกัดขอบเขตไว้ที่ฝั่ง Anthropic | `minimax` |

    กลุ่มสตรีมที่มีอยู่ในวันนี้:

    | ตระกูล | สิ่งที่เชื่อมต่อเข้ามา | ตัวอย่างที่บันเดิลมา |
    | --- | --- | --- |
    | `google-thinking` | การทำให้เพย์โหลดการคิดของ Gemini เป็นมาตรฐานบนเส้นทางสตรีมที่ใช้ร่วมกัน | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | ตัวห่อหุ้มการให้เหตุผลของ Kilo บนเส้นทางสตรีมพร็อกซีที่ใช้ร่วมกัน โดยมี `kilo/auto` และรหัสการให้เหตุผลของพร็อกซีที่ไม่รองรับข้ามการแทรกการคิด | `kilocode` |
    | `moonshot-thinking` | การแมปเพย์โหลดการคิดแบบไบนารีดั้งเดิมของ Moonshot จากคอนฟิก + ระดับ `/think` | `moonshot` |
    | `minimax-fast-mode` | การเขียนโมเดลโหมดเร็วของ MiniMax ใหม่บนเส้นทางสตรีมที่ใช้ร่วมกัน | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | ตัวห่อหุ้ม Responses ของ OpenAI/Codex แบบดั้งเดิมที่ใช้ร่วมกัน: เฮดเดอร์แสดงที่มา, `/fast`/`serviceTier`, ความละเอียดของข้อความ, การค้นหาเว็บดั้งเดิมของ Codex, การจัดรูปเพย์โหลดให้เข้ากับการให้เหตุผล และการจัดการบริบทของ Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | ตัวห่อหุ้มการให้เหตุผลของ OpenRouter สำหรับเส้นทางพร็อกซี โดยจัดการการข้ามสำหรับโมเดลที่ไม่รองรับ/`auto` ไว้ที่ส่วนกลาง | `openrouter` |
    | `tool-stream-default-on` | ตัวห่อหุ้ม `tool_stream` ที่เปิดโดยค่าเริ่มต้นสำหรับผู้ให้บริการอย่าง Z.AI ที่ต้องการสตรีมเครื่องมือ เว้นแต่จะปิดใช้งานอย่างชัดเจน | `zai` |

    <Accordion title="จุดเชื่อม SDK ที่ขับเคลื่อนตัวสร้างตระกูล">
      ตัวสร้างแต่ละตระกูลประกอบจากตัวช่วยสาธารณะระดับล่างที่ส่งออกจากแพ็กเกจเดียวกัน ซึ่งคุณสามารถใช้ได้เมื่อผู้ให้บริการต้องออกจากรูปแบบทั่วไป:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` และตัวสร้างรีเพลย์ดิบ (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`) นอกจากนี้ยังส่งออกตัวช่วยรีเพลย์ของ Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) และตัวช่วยเอนด์พอยต์/โมเดล (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`)
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` รวมถึงตัวห่อหุ้ม OpenAI/Codex ที่ใช้ร่วมกัน (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), ตัวห่อหุ้มที่เข้ากันได้กับ OpenAI ของ DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), การล้างพรีฟิลการคิดของ Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) และตัวห่อหุ้มพร็อกซี/ผู้ให้บริการที่ใช้ร่วมกัน (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`)
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, ตัวช่วยสคีมาของ Gemini ที่อยู่เบื้องหลัง (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) และตัวช่วยความเข้ากันได้ของ xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`) Plugin xAI ที่บันเดิลมาใช้ `normalizeResolvedModel` + `contributeResolvedModelCompat` กับตัวช่วยเหล่านี้เพื่อให้กฎของ xAI เป็นของผู้ให้บริการเอง

      ตัวช่วยสตรีมบางตัวยังคงอยู่ในผู้ให้บริการโดยตั้งใจ `@openclaw/anthropic-provider` เก็บ `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` และตัวสร้างตัวห่อหุ้ม Anthropic ระดับล่างไว้ในจุดเชื่อมสาธารณะ `api.ts` / `contract-api.ts` ของตัวเอง เพราะสิ่งเหล่านี้เข้ารหัสการจัดการเบต้า Claude OAuth และการกั้น `context1m` Plugin xAI ก็เช่นกัน โดยเก็บการจัดรูป Responses ดั้งเดิมของ xAI ไว้ใน `wrapStreamFn` ของตัวเอง (นามแฝง `/fast`, ค่าเริ่มต้น `tool_stream`, การล้างเครื่องมือแบบเข้มงวดที่ไม่รองรับ, การลบเพย์โหลดการให้เหตุผลเฉพาะ xAI)

      รูปแบบรูทแพ็กเกจเดียวกันยังรองรับ `@openclaw/openai-provider` (ตัวสร้างผู้ให้บริการ, ตัวช่วยโมเดลค่าเริ่มต้น, ตัวสร้างผู้ให้บริการแบบเรียลไทม์) และ `@openclaw/openrouter-provider` (ตัวสร้างผู้ให้บริการพร้อมตัวช่วยการเริ่มต้นใช้งาน/คอนฟิก)
    </Accordion>

    <Tabs>
      <Tab title="การแลกเปลี่ยนโทเค็น">
        สำหรับผู้ให้บริการที่ต้องแลกเปลี่ยนโทเค็นก่อนการเรียกอนุมานแต่ละครั้ง:

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
        สำหรับผู้ให้บริการที่ต้องใช้เฮดเดอร์คำขอแบบกำหนดเองหรือการแก้ไขเนื้อหาคำขอ:

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
      <Tab title="อัตลักษณ์การขนส่งดั้งเดิม">
        สำหรับผู้ให้บริการที่ต้องใช้เฮดเดอร์คำขอ/เซสชันดั้งเดิมหรือเมทาดาทาบน
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

    <Accordion title="ฮุกผู้ให้บริการทั้งหมดที่มี">
      OpenClaw เรียกฮุกตามลำดับนี้ ผู้ให้บริการส่วนใหญ่ใช้เพียง 2-3 รายการ:
      ฟิลด์ผู้ให้บริการเพื่อความเข้ากันได้เท่านั้นที่ OpenClaw ไม่เรียกใช้อีกแล้ว เช่น
      `ProviderPlugin.capabilities` และ `suppressBuiltInModel` จะไม่แสดงอยู่
      ที่นี่

      | # | ฮุก | ควรใช้เมื่อใด |
      | --- | --- | --- |
      | 1 | `catalog` | แคตตาล็อกโมเดลหรือค่าเริ่มต้น URL ฐาน |
      | 2 | `applyConfigDefaults` | ค่าเริ่มต้นส่วนกลางที่ผู้ให้บริการเป็นเจ้าของระหว่างการทำให้คอนฟิกเป็นรูปธรรม |
      | 3 | `normalizeModelId` | การล้างนามแฝงรหัสโมเดลแบบเดิม/พรีวิวก่อนการค้นหา |
      | 4 | `normalizeTransport` | การล้าง `api` / `baseUrl` ของตระกูลผู้ให้บริการก่อนประกอบโมเดลทั่วไป |
      | 5 | `normalizeConfig` | ทำคอนฟิก `models.providers.<id>` ให้เป็นมาตรฐาน |
      | 6 | `applyNativeStreamingUsageCompat` | การเขียนความเข้ากันได้ของการใช้งานสตรีมดั้งเดิมใหม่สำหรับผู้ให้บริการคอนฟิก |
      | 7 | `resolveConfigApiKey` | การแก้ไขการยืนยันตัวตนด้วยมาร์กเกอร์ env ที่ผู้ให้บริการเป็นเจ้าของ |
      | 8 | `resolveSyntheticAuth` | การยืนยันตัวตนสังเคราะห์แบบ local/self-hosted หรือมีคอนฟิกหนุนหลัง |
      | 9 | `shouldDeferSyntheticProfileAuth` | ลดลำดับตัวแทนโปรไฟล์ที่เก็บไว้แบบสังเคราะห์ไว้หลังการยืนยันตัวตนผ่าน env/config |
      | 10 | `resolveDynamicModel` | ยอมรับรหัสโมเดลอัปสตรีมตามอำเภอใจ |
      | 11 | `prepareDynamicModel` | ดึงเมทาดาทาแบบอะซิงก์ก่อนแก้ไข |
      | 12 | `normalizeResolvedModel` | เขียนการขนส่งใหม่ก่อนรันเนอร์ |
      | 13 | `contributeResolvedModelCompat` | แฟล็กความเข้ากันได้สำหรับโมเดลผู้ขายที่อยู่หลังการขนส่งที่เข้ากันได้อีกรูปแบบหนึ่ง |
      | 14 | `normalizeToolSchemas` | การล้างสคีมาเครื่องมือที่ผู้ให้บริการเป็นเจ้าของก่อนลงทะเบียน |
      | 15 | `inspectToolSchemas` | การวินิจฉัยสคีมาเครื่องมือที่ผู้ให้บริการเป็นเจ้าของ |
      | 16 | `resolveReasoningOutputMode` | สัญญาเอาต์พุตการให้เหตุผลแบบติดแท็กเทียบกับแบบดั้งเดิม |
      | 17 | `prepareExtraParams` | พารามิเตอร์คำขอค่าเริ่มต้น |
      | 18 | `createStreamFn` | การขนส่ง StreamFn แบบกำหนดเองทั้งหมด |
      | 19 | `wrapStreamFn` | ตัวห่อหุ้มเฮดเดอร์/เนื้อหาแบบกำหนดเองบนเส้นทางสตรีมปกติ |
      | 20 | `resolveTransportTurnState` | เฮดเดอร์/เมทาดาทาดั้งเดิมรายเทิร์น |
      | 21 | `resolveWebSocketSessionPolicy` | เฮดเดอร์เซสชัน WS ดั้งเดิม/ช่วงพักลดระดับ |
      | 22 | `formatApiKey` | รูปทรงโทเค็นรันไทม์แบบกำหนดเอง |
      | 23 | `refreshOAuth` | การรีเฟรช OAuth แบบกำหนดเอง |
      | 24 | `buildAuthDoctorHint` | คำแนะนำการซ่อมแซมการยืนยันตัวตน |
      | 25 | `matchesContextOverflowError` | การตรวจจับบริบทล้นที่ผู้ให้บริการเป็นเจ้าของ |
      | 26 | `classifyFailoverReason` | การจัดประเภท rate-limit/โอเวอร์โหลดที่ผู้ให้บริการเป็นเจ้าของ |
      | 27 | `isCacheTtlEligible` | การกั้น TTL ของแคชพรอมป์ |
      | 28 | `buildMissingAuthMessage` | คำแนะนำการยืนยันตัวตนที่ขาดหายแบบกำหนดเอง |
      | 29 | `augmentModelCatalog` | แถวความเข้ากันได้ล่วงหน้าแบบสังเคราะห์ |
      | 30 | `resolveThinkingProfile` | ชุดตัวเลือก `/think` เฉพาะโมเดล |
      | 31 | `isBinaryThinking` | ความเข้ากันได้ของการเปิด/ปิดการคิดแบบไบนารี |
      | 32 | `supportsXHighThinking` | ความเข้ากันได้ของการรองรับการให้เหตุผล `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | ความเข้ากันได้ของนโยบาย `/think` ค่าเริ่มต้น |
      | 34 | `isModernModelRef` | การจับคู่โมเดลแบบสด/สโมก |
      | 35 | `prepareRuntimeAuth` | การแลกเปลี่ยนโทเค็นก่อนการอนุมาน |
      | 36 | `resolveUsageAuth` | การแยกวิเคราะห์ข้อมูลประจำตัวการใช้งานแบบกำหนดเอง |
      | 37 | `fetchUsageSnapshot` | เอนด์พอยต์การใช้งานแบบกำหนดเอง |
      | 38 | `createEmbeddingProvider` | อะแดปเตอร์ embedding ที่ผู้ให้บริการเป็นเจ้าของสำหรับหน่วยความจำ/การค้นหา |
      | 39 | `buildReplayPolicy` | นโยบายรีเพลย์/Compaction ของทรานสคริปต์แบบกำหนดเอง |
      | 40 | `sanitizeReplayHistory` | การเขียนรีเพลย์ใหม่เฉพาะผู้ให้บริการหลังการล้างทั่วไป |
      | 41 | `validateReplayTurns` | การตรวจสอบเทิร์นรีเพลย์แบบเข้มงวดก่อนรันเนอร์แบบฝัง |
      | 42 | `onModelSelected` | คอลแบ็กหลังการเลือก (เช่น เทเลเมทรี) |

      หมายเหตุเกี่ยวกับการสำรองรันไทม์:

      - `normalizeConfig` ตรวจสอบผู้ให้บริการที่ตรงกันก่อน จากนั้นจึงตรวจสอบ Plugin ผู้ให้บริการอื่นที่รองรับฮุกได้จนกว่าจะมีรายการหนึ่งเปลี่ยนคอนฟิกจริง หากไม่มีฮุกผู้ให้บริการใดเขียนรายการคอนฟิกตระกูล Google ที่รองรับใหม่ ตัวทำมาตรฐานคอนฟิก Google ที่บันเดิลมาก็ยังทำงานอยู่
      - `resolveConfigApiKey` ใช้ฮุกผู้ให้บริการเมื่อมีการเปิดเผย เส้นทาง `amazon-bedrock` ที่บันเดิลมายังมีตัวแก้ไขมาร์กเกอร์ env ของ AWS ในตัวที่นี่ด้วย แม้ว่าการยืนยันตัวตนรันไทม์ของ Bedrock เองยังใช้เชนค่าเริ่มต้นของ AWS SDK ก็ตาม
      - `resolveSystemPromptContribution` ให้ผู้ให้บริการแทรกคำแนะนำพรอมป์ระบบที่คำนึงถึงแคชสำหรับตระกูลโมเดลได้ ควรใช้สิ่งนี้แทน `before_prompt_build` เมื่อพฤติกรรมเป็นของผู้ให้บริการ/ตระกูลโมเดลหนึ่ง และควรรักษาการแยกแคชแบบเสถียร/ไดนามิกไว้

      สำหรับคำอธิบายโดยละเอียดและตัวอย่างจริง โปรดดู [ภายใน: ฮุกรันไทม์ของผู้ให้บริการ](/th/plugins/architecture-internals#provider-runtime-hooks)
    </Accordion>

  </Step>

  <Step title="เพิ่มความสามารถเพิ่มเติม (ไม่บังคับ)">
    Plugin ผู้ให้บริการสามารถลงทะเบียนเสียงพูด, การถอดเสียงแบบเรียลไทม์, เสียง
    แบบเรียลไทม์, การทำความเข้าใจสื่อ, การสร้างภาพ, การสร้างวิดีโอ, การดึงข้อมูลเว็บ,
    และการค้นหาเว็บควบคู่ไปกับการอนุมานข้อความ OpenClaw จัดประเภทสิ่งนี้เป็น
    Plugin แบบ **hybrid-capability** ซึ่งเป็นรูปแบบที่แนะนำสำหรับ Plugin ของบริษัท
    (หนึ่ง Plugin ต่อผู้ขาย) ดู
    [ภายใน: ความเป็นเจ้าของความสามารถ](/th/plugins/architecture#capability-ownership-model)

    ลงทะเบียนแต่ละความสามารถภายใน `register(api)` ควบคู่ไปกับการเรียก
    `api.registerProvider(...)` ที่มีอยู่ เลือกเฉพาะแท็บที่คุณต้องใช้:

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

        ใช้ `assertOkOrThrowProviderError(...)` สำหรับความล้มเหลว HTTP ของผู้ให้บริการ เพื่อให้
        plugins ใช้การอ่านเนื้อหา error-body แบบจำกัด, การแยกวิเคราะห์ข้อผิดพลาด JSON และ
        ส่วนต่อท้าย request-id ร่วมกัน
      </Tab>
      <Tab title="การถอดเสียงแบบเรียลไทม์">
        แนะนำให้ใช้ `createRealtimeTranscriptionWebSocketSession(...)` — ตัวช่วยที่ใช้ร่วมกัน
        จะจัดการการจับพร็อกซี, backoff สำหรับการเชื่อมต่อใหม่, การ flush เมื่่อปิด, การ handshake ความพร้อม,
        การเข้าคิวเสียง และการวินิจฉัยเหตุการณ์ปิด Plugin ของคุณ
        เพียงแมปเหตุการณ์จาก upstream เท่านั้น

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

        ผู้ให้บริการ STT แบบแบตช์ที่ POST เสียง multipart ควรใช้
        `buildAudioTranscriptionFormData(...)` จาก
        `openclaw/plugin-sdk/provider-http` ตัวช่วยนี้ทำให้ชื่อไฟล์อัปโหลดเป็นรูปแบบมาตรฐาน
        รวมถึงการอัปโหลด AAC ที่ต้องใช้ชื่อไฟล์แบบ M4A เพื่อให้เข้ากันได้กับ
        API การถอดเสียง
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
        ความสามารถด้านวิดีโอใช้โครงสร้างที่ **รับรู้โหมด**: `generate`,
        `imageToVideo` และ `videoToVideo` ฟิลด์รวมแบบแบน เช่น
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` ไม่
        เพียงพอสำหรับประกาศการรองรับโหมดแปลง หรือโหมดที่ปิดใช้งานไว้อย่างชัดเจน
        การสร้างเพลงใช้รูปแบบเดียวกันโดยมีบล็อก `generate` /
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

Provider plugins เผยแพร่ในลักษณะเดียวกับ plugin โค้ดภายนอกอื่นๆ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

อย่าใช้นามแฝงการเผยแพร่แบบเดิมที่ใช้เฉพาะ skill ที่นี่ แพ็กเกจ plugin ควรใช้
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

## ข้อมูลอ้างอิงลำดับแค็ตตาล็อก

`catalog.order` ควบคุมว่าแค็ตตาล็อกของคุณจะถูกรวมเมื่อใดเมื่อเทียบกับ
ผู้ให้บริการในตัว:

| ลำดับ     | เมื่อใด          | กรณีใช้งาน                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | รอบแรก    | ผู้ให้บริการ API-key แบบตรงไปตรงมา                         |
| `profile` | หลัง simple  | ผู้ให้บริการที่ถูกจำกัดด้วยโปรไฟล์ auth                |
| `paired`  | หลัง profile | สังเคราะห์รายการที่เกี่ยวข้องหลายรายการ             |
| `late`    | รอบสุดท้าย     | แทนที่ผู้ให้บริการที่มีอยู่ (ชนะเมื่อชนกัน) |

## ขั้นตอนถัดไป

- [Channel Plugins](/th/plugins/sdk-channel-plugins) — หาก Plugin ของคุณยังให้บริการช่องทางด้วย
- [SDK Runtime](/th/plugins/sdk-runtime) — ตัวช่วย `api.runtime` (TTS, การค้นหา, subagent)
- [ภาพรวม SDK](/th/plugins/sdk-overview) — ข้อมูลอ้างอิงการนำเข้า subpath แบบเต็ม
- [รายละเอียดภายใน Plugin](/th/plugins/architecture-internals#provider-runtime-hooks) — รายละเอียด hook และตัวอย่างที่ bundled มา

## ที่เกี่ยวข้อง

- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง plugins](/th/plugins/building-plugins)
- [การสร้าง channel plugins](/th/plugins/sdk-channel-plugins)
