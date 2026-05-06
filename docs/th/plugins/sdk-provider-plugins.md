---
read_when:
    - คุณกำลังสร้าง Plugin ผู้ให้บริการโมเดลใหม่
    - คุณต้องการเพิ่มพร็อกซีที่เข้ากันได้กับ OpenAI หรือโมเดลภาษาขนาดใหญ่แบบกำหนดเองลงใน OpenClaw
    - คุณจำเป็นต้องเข้าใจการยืนยันตัวตนของผู้ให้บริการ แค็ตตาล็อก และฮุคของรันไทม์
sidebarTitle: Provider plugins
summary: คู่มือแบบทีละขั้นตอนสำหรับการสร้าง Plugin ผู้ให้บริการโมเดลสำหรับ OpenClaw
title: การสร้าง Plugin ของผู้ให้บริการ
x-i18n:
    generated_at: "2026-05-06T09:25:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f62f4b4df055412288b9d56f0344c76b9adfc3a04f3916eba37c04d22a3d808
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

คู่มือนี้จะแนะนำการสร้าง Plugin ผู้ให้บริการที่เพิ่มผู้ให้บริการโมเดล
(LLM) ให้กับ OpenClaw เมื่อจบแล้ว คุณจะมีผู้ให้บริการพร้อมแค็ตตาล็อกโมเดล,
การยืนยันตัวตนด้วยคีย์ API และการระบุโมเดลแบบไดนามิก

<Info>
  หากคุณยังไม่เคยสร้าง Plugin ของ OpenClaw มาก่อน ให้อ่าน
  [เริ่มต้นใช้งาน](/th/plugins/building-plugins) ก่อนเพื่อดูโครงสร้างแพ็กเกจ
  และการตั้งค่า manifest พื้นฐาน
</Info>

<Tip>
  Plugin ผู้ให้บริการจะเพิ่มโมเดลเข้าไปในลูปอนุมานปกติของ OpenClaw หากโมเดล
  ต้องทำงานผ่านเดมอนเอเจนต์แบบเนทีฟที่เป็นเจ้าของเธรด, Compaction หรือเหตุการณ์เครื่องมือ
  ให้จับคู่ผู้ให้บริการกับ [agent harness](/th/plugins/sdk-agent-harness)
  แทนการใส่รายละเอียดโปรโตคอลของเดมอนไว้ในแกนหลัก
</Tip>

## แนวทางปฏิบัติ

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
    ข้อมูลรับรองได้โดยไม่ต้องโหลดรันไทม์ของ Plugin ของคุณ เพิ่ม `providerAuthAliases`
    เมื่อรูปแบบย่อยของผู้ให้บริการควรใช้การยืนยันตัวตนของ id ผู้ให้บริการอื่นร่วมกัน `modelSupport`
    เป็นตัวเลือกเสริมและช่วยให้ OpenClaw โหลด Plugin ผู้ให้บริการของคุณอัตโนมัติจาก
    id โมเดลแบบย่อ เช่น `acme-large` ก่อนที่ runtime hooks จะมีอยู่ หากคุณเผยแพร่
    ผู้ให้บริการบน ClawHub ฟิลด์ `openclaw.compat` และ `openclaw.build` เหล่านั้น
    จำเป็นต้องมีใน `package.json`

  </Step>

  <Step title="Register the provider">
    ผู้ให้บริการแบบขั้นต่ำต้องมี `id`, `label`, `auth` และ `catalog`:

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

    นี่คือผู้ให้บริการที่ใช้งานได้แล้ว ผู้ใช้สามารถ
    `openclaw onboard --acme-ai-api-key <key>` และเลือก
    `acme-ai/acme-large` เป็นโมเดลของตนได้

    หากผู้ให้บริการต้นทางใช้โทเค็นควบคุมที่ต่างจาก OpenClaw ให้เพิ่ม
    การแปลงข้อความสองทิศทางขนาดเล็กแทนการแทนที่เส้นทางสตรีม:

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

    `input` จะเขียนพรอมป์ระบบสุดท้ายและเนื้อหาข้อความใหม่ก่อน
    การส่งต่อ `output` จะเขียนเดลตาข้อความของผู้ช่วยและข้อความสุดท้ายใหม่ก่อนที่
    OpenClaw จะวิเคราะห์เครื่องหมายควบคุมของตนเองหรือส่งมอบผ่านช่องทาง

    สำหรับผู้ให้บริการที่บันเดิลมาซึ่งลงทะเบียนผู้ให้บริการข้อความเพียงหนึ่งรายด้วย
    การยืนยันตัวตนด้วยคีย์ API พร้อมรันไทม์เดียวที่อ้างอิงแค็ตตาล็อก ให้ใช้ตัวช่วยที่แคบกว่า
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

    `buildProvider` คือเส้นทางแค็ตตาล็อกสดที่ใช้เมื่อ OpenClaw สามารถระบุ
    การยืนยันตัวตนของผู้ให้บริการจริงได้ โดยอาจทำการค้นหาเฉพาะผู้ให้บริการได้ ใช้
    `buildStaticProvider` เฉพาะสำหรับแถวออฟไลน์ที่ปลอดภัยพอจะแสดงก่อนกำหนดค่าการยืนยันตัวตน
    เท่านั้น โดยต้องไม่ต้องใช้ข้อมูลรับรองหรือส่งคำขอเครือข่าย
    การแสดงผล `models list --all` ของ OpenClaw ในปัจจุบันจะเรียกใช้แค็ตตาล็อกแบบสแตติก
    เฉพาะสำหรับ Plugin ผู้ให้บริการที่บันเดิลมาเท่านั้น โดยใช้ config ว่าง, env ว่าง และไม่มี
    พาธของเอเจนต์/เวิร์กสเปซ

    หากโฟลว์การยืนยันตัวตนของคุณยังต้องแพตช์ `models.providers.*`, aliases และ
    โมเดลเริ่มต้นของเอเจนต์ระหว่างการ onboarding ให้ใช้ตัวช่วย preset จาก
    `openclaw/plugin-sdk/provider-onboard` ตัวช่วยที่แคบที่สุดคือ
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` และ
    `createModelCatalogPresetAppliers(...)`

    เมื่อเอนด์พอยต์เนทีฟของผู้ให้บริการรองรับบล็อก usage แบบสตรีมบน
    transport ปกติ `openai-completions` ให้ใช้ตัวช่วยแค็ตตาล็อกร่วมใน
    `openclaw/plugin-sdk/provider-catalog-shared` แทนการ hardcode
    การตรวจสอบ id ผู้ให้บริการ `supportsNativeStreamingUsageCompat(...)` และ
    `applyProviderNativeStreamingUsageCompat(...)` จะตรวจจับการรองรับจาก
    แผนที่ความสามารถของเอนด์พอยต์ ดังนั้นเอนด์พอยต์เนทีฟแบบ Moonshot/DashScope
    ยังคง opt in ได้แม้ Plugin จะใช้ id ผู้ให้บริการแบบกำหนดเอง

  </Step>

  <Step title="Add dynamic model resolution">
    หากผู้ให้บริการของคุณยอมรับ ID โมเดลใดก็ได้ (เช่น พร็อกซีหรือเราเตอร์)
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

    หากการระบุต้องใช้การเรียกเครือข่าย ให้ใช้ `prepareDynamicModel` สำหรับ
    การเตรียมพร้อมแบบ async - `resolveDynamicModel` จะรันอีกครั้งหลังจากเสร็จสิ้น

  </Step>

  <Step title="Add runtime hooks (as needed)">
    ผู้ให้บริการส่วนใหญ่ต้องการเพียง `catalog` + `resolveDynamicModel` เพิ่ม hooks
    แบบค่อยเป็นค่อยไปตามที่ผู้ให้บริการของคุณต้องการ

    ตัวสร้างตัวช่วยร่วมตอนนี้ครอบคลุมตระกูล replay/tool-compat ที่พบบ่อยที่สุดแล้ว
    ดังนั้นโดยทั่วไป Plugin จึงไม่จำเป็นต้องเชื่อมต่อ hook แต่ละตัวเองทีละตัว:

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

    ตระกูล replay ที่พร้อมใช้ในปัจจุบัน:

    | ตระกูล | สิ่งที่เชื่อมต่อให้ | ตัวอย่างที่บันเดิลมา |
    | --- | --- | --- |
    | `openai-compatible` | นโยบาย replay แบบ OpenAI-style ร่วมสำหรับ transport ที่เข้ากันได้กับ OpenAI รวมถึงการทำความสะอาด tool-call-id, การแก้ไขลำดับ assistant-first และการตรวจสอบ Gemini-turn ทั่วไปเมื่อ transport ต้องใช้ | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | นโยบาย replay ที่รู้จัก Claude ซึ่งเลือกตาม `modelId` เพื่อให้ transport แบบ Anthropic-message ได้รับการล้าง thinking-block เฉพาะ Claude ต่อเมื่อโมเดลที่ระบุได้เป็น id ของ Claude จริงเท่านั้น | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | นโยบาย replay แบบเนทีฟของ Gemini พร้อมการทำความสะอาด bootstrap replay และโหมด tagged reasoning-output | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | การทำความสะอาด thought-signature ของ Gemini สำหรับโมเดล Gemini ที่ทำงานผ่าน transport พร็อกซีที่เข้ากันได้กับ OpenAI; ไม่เปิดใช้การตรวจสอบ replay แบบเนทีฟของ Gemini หรือการเขียน bootstrap ใหม่ | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | นโยบายไฮบริดสำหรับผู้ให้บริการที่ผสมพื้นผิวโมเดลแบบ Anthropic-message และแบบเข้ากันได้กับ OpenAI ใน Plugin เดียว; การทิ้ง thinking-block เฉพาะ Claude ที่เป็นตัวเลือกเสริมจะยังจำกัดอยู่ฝั่ง Anthropic | `minimax` |

    ตระกูลสตรีมที่พร้อมใช้งานในปัจจุบัน:

    | ตระกูล | สิ่งที่เชื่อมต่อเข้ามา | ตัวอย่างที่ bundled |
    | --- | --- | --- |
    | `google-thinking` | การทำให้ payload การคิดของ Gemini เป็นมาตรฐานบนพาธสตรีมที่ใช้ร่วมกัน | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | wrapper การให้เหตุผลของ Kilo บนพาธสตรีมพร็อกซีที่ใช้ร่วมกัน โดย `kilo/auto` และ id การให้เหตุผลพร็อกซีที่ไม่รองรับจะข้ามการฉีด thinking | `kilocode` |
    | `moonshot-thinking` | การแมป payload native-thinking แบบไบนารีของ Moonshot จาก config + ระดับ `/think` | `moonshot` |
    | `minimax-fast-mode` | การเขียนโมเดล fast-mode ของ MiniMax ใหม่บนพาธสตรีมที่ใช้ร่วมกัน | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | wrapper native OpenAI/Codex Responses ที่ใช้ร่วมกัน: เฮดเดอร์ attribution, `/fast`/`serviceTier`, ความละเอียดของข้อความ, การค้นเว็บแบบ native ของ Codex, การจัดรูป payload ให้เข้ากันได้กับ reasoning และการจัดการบริบท Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | wrapper การให้เหตุผลของ OpenRouter สำหรับเส้นทางพร็อกซี โดยจัดการการข้ามโมเดลที่ไม่รองรับ/`auto` ไว้ที่ศูนย์กลาง | `openrouter` |
    | `tool-stream-default-on` | wrapper `tool_stream` ที่เปิดเป็นค่าเริ่มต้นสำหรับผู้ให้บริการอย่าง Z.AI ที่ต้องการ tool streaming เว้นแต่จะปิดไว้อย่างชัดเจน | `zai` |

    <Accordion title="SDK seams powering the family builders">
      ตัวสร้างแต่ละตระกูลประกอบขึ้นจาก helper สาธารณะระดับต่ำกว่าที่ export จาก package เดียวกัน ซึ่งคุณสามารถหยิบใช้ได้เมื่อผู้ให้บริการจำเป็นต้องออกนอกแพตเทิร์นทั่วไป:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` และตัวสร้าง replay ดิบ (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`) นอกจากนี้ยัง export helper replay ของ Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) และ helper สำหรับ endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`)
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` รวมถึง wrapper OpenAI/Codex ที่ใช้ร่วมกัน (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper ที่เข้ากันได้กับ OpenAI ของ DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), การล้าง thinking prefill ของ Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) และ wrapper พร็อกซี/ผู้ให้บริการที่ใช้ร่วมกัน (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`)
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, helper schema ของ Gemini พื้นฐาน (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) และ helper ความเข้ากันได้ของ xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`) Plugin xAI ที่ bundled ใช้ `normalizeResolvedModel` + `contributeResolvedModelCompat` ร่วมกับสิ่งเหล่านี้เพื่อให้กฎของ xAI อยู่ในการดูแลของผู้ให้บริการ

      helper สตรีมบางตัวตั้งใจให้อยู่เฉพาะในผู้ให้บริการ `@openclaw/anthropic-provider` เก็บ `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` และตัวสร้าง wrapper Anthropic ระดับต่ำกว่าไว้ใน seam สาธารณะ `api.ts` / `contract-api.ts` ของตัวเอง เพราะสิ่งเหล่านี้เข้ารหัสการจัดการ Claude OAuth beta และการกั้น `context1m` Plugin xAI ก็เก็บการจัดรูป native xAI Responses ไว้ใน `wrapStreamFn` ของตัวเองเช่นกัน (alias `/fast`, ค่าเริ่มต้น `tool_stream`, การล้าง strict-tool ที่ไม่รองรับ, การลบ reasoning-payload เฉพาะ xAI)

      แพตเทิร์น package-root เดียวกันยังรองรับ `@openclaw/openai-provider` (ตัวสร้างผู้ให้บริการ, helper โมเดลเริ่มต้น, ตัวสร้างผู้ให้บริการ realtime) และ `@openclaw/openrouter-provider` (ตัวสร้างผู้ให้บริการพร้อม helper onboarding/config)
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        สำหรับผู้ให้บริการที่ต้องแลกโทเคนก่อนการเรียก inference แต่ละครั้ง:

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
        สำหรับผู้ให้บริการที่ต้องการเฮดเดอร์คำขอแบบกำหนดเองหรือการปรับแก้ body:

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
      <Tab title="Native transport identity">
        สำหรับผู้ให้บริการที่ต้องใช้เฮดเดอร์หรือ metadata ของคำขอ/session แบบ native บน
        HTTP หรือ WebSocket transport ทั่วไป:

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
        สำหรับผู้ให้บริการที่เปิดเผยข้อมูล usage/billing:

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

    <Accordion title="All available provider hooks">
      OpenClaw เรียก hook ตามลำดับนี้ ผู้ให้บริการส่วนใหญ่ใช้เพียง 2-3 รายการ:
      ฟิลด์ผู้ให้บริการที่มีไว้เพื่อความเข้ากันได้เท่านั้นและ OpenClaw ไม่เรียกใช้อีกแล้ว เช่น
      `ProviderPlugin.capabilities` และ `suppressBuiltInModel` จะไม่ถูกแสดง
      ที่นี่

      | # | Hook | ควรใช้เมื่อใด |
      | --- | --- | --- |
      | 1 | `catalog` | แค็ตตาล็อกโมเดลหรือค่าเริ่มต้นของ base URL |
      | 2 | `applyConfigDefaults` | ค่าเริ่มต้น global ที่ผู้ให้บริการเป็นเจ้าของระหว่างการ materialize config |
      | 3 | `normalizeModelId` | การล้าง alias ของ legacy/preview model-id ก่อน lookup |
      | 4 | `normalizeTransport` | การล้าง `api` / `baseUrl` ของตระกูลผู้ให้บริการก่อนการประกอบโมเดลทั่วไป |
      | 5 | `normalizeConfig` | ทำให้ config `models.providers.<id>` เป็นมาตรฐาน |
      | 6 | `applyNativeStreamingUsageCompat` | การเขียน compat ของ native streaming-usage ใหม่สำหรับผู้ให้บริการ config |
      | 7 | `resolveConfigApiKey` | การแก้ค่า auth ของ env-marker ที่ผู้ให้บริการเป็นเจ้าของ |
      | 8 | `resolveSyntheticAuth` | auth สังเคราะห์แบบ local/self-hosted หรือที่อิง config |
      | 9 | `shouldDeferSyntheticProfileAuth` | ลดลำดับ placeholder ของ stored-profile สังเคราะห์ไว้หลัง auth จาก env/config |
      | 10 | `resolveDynamicModel` | ยอมรับ ID โมเดล upstream ใดก็ได้ |
      | 11 | `prepareDynamicModel` | ดึง metadata แบบ async ก่อน resolve |
      | 12 | `normalizeResolvedModel` | การเขียน transport ใหม่ก่อน runner |
      | 13 | `contributeResolvedModelCompat` | flag compat สำหรับโมเดล vendor ที่อยู่หลัง transport ที่เข้ากันได้อีกตัวหนึ่ง |
      | 14 | `normalizeToolSchemas` | การล้าง tool-schema ที่ผู้ให้บริการเป็นเจ้าของก่อนลงทะเบียน |
      | 15 | `inspectToolSchemas` | diagnostics ของ tool-schema ที่ผู้ให้บริการเป็นเจ้าของ |
      | 16 | `resolveReasoningOutputMode` | contract ของ reasoning-output แบบ tagged เทียบกับ native |
      | 17 | `prepareExtraParams` | พารามิเตอร์คำขอเริ่มต้น |
      | 18 | `createStreamFn` | transport StreamFn แบบกำหนดเองเต็มรูปแบบ |
      | 19 | `wrapStreamFn` | wrapper เฮดเดอร์/body แบบกำหนดเองบนพาธสตรีมปกติ |
      | 20 | `resolveTransportTurnState` | เฮดเดอร์/metadata แบบ native ต่อ turn |
      | 21 | `resolveWebSocketSessionPolicy` | เฮดเดอร์ session WS แบบ native/ช่วง cool-down |
      | 22 | `formatApiKey` | รูปทรงโทเคน runtime แบบกำหนดเอง |
      | 23 | `refreshOAuth` | การ refresh OAuth แบบกำหนดเอง |
      | 24 | `buildAuthDoctorHint` | คำแนะนำการซ่อมแซม auth |
      | 25 | `matchesContextOverflowError` | การตรวจจับ overflow ที่ผู้ให้บริการเป็นเจ้าของ |
      | 26 | `classifyFailoverReason` | การจัดประเภท rate-limit/overload ที่ผู้ให้บริการเป็นเจ้าของ |
      | 27 | `isCacheTtlEligible` | การกั้น TTL ของ prompt cache |
      | 28 | `buildMissingAuthMessage` | hint missing-auth แบบกำหนดเอง |
      | 29 | `augmentModelCatalog` | แถว forward-compat สังเคราะห์ |
      | 30 | `resolveThinkingProfile` | ชุดตัวเลือก `/think` เฉพาะโมเดล |
      | 31 | `isBinaryThinking` | ความเข้ากันได้ของ binary thinking เปิด/ปิด |
      | 32 | `supportsXHighThinking` | ความเข้ากันได้ของการรองรับ reasoning `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | ความเข้ากันได้ของนโยบาย `/think` เริ่มต้น |
      | 34 | `isModernModelRef` | การจับคู่โมเดล live/smoke |
      | 35 | `prepareRuntimeAuth` | การแลกโทเคนก่อน inference |
      | 36 | `resolveUsageAuth` | การ parse credential ของ usage แบบกำหนดเอง |
      | 37 | `fetchUsageSnapshot` | endpoint usage แบบกำหนดเอง |
      | 38 | `createEmbeddingProvider` | adapter embedding ที่ผู้ให้บริการเป็นเจ้าของสำหรับ memory/search |
      | 39 | `buildReplayPolicy` | นโยบาย transcript replay/Compaction แบบกำหนดเอง |
      | 40 | `sanitizeReplayHistory` | การเขียน replay เฉพาะผู้ให้บริการใหม่หลังจากการล้างทั่วไป |
      | 41 | `validateReplayTurns` | การตรวจสอบ replay-turn แบบเข้มงวดก่อน runner แบบ embedded |
      | 42 | `onModelSelected` | callback หลังการเลือก (เช่น telemetry) |

      หมายเหตุ fallback ของ runtime:

      - `normalizeConfig` ตรวจสอบผู้ให้บริการที่ตรงกันก่อน จากนั้นจึงตรวจสอบ Plugin ผู้ให้บริการอื่นที่รองรับ hook จนกว่าจะมีตัวใดเปลี่ยน config จริง หากไม่มี hook ผู้ให้บริการใดเขียน entry config ตระกูล Google ที่รองรับใหม่ ตัวทำให้ config ของ Google ที่ bundled จะยังถูกใช้
      - `resolveConfigApiKey` ใช้ hook ของผู้ให้บริการเมื่อเปิดเผยไว้ พาธ `amazon-bedrock` ที่ bundled ยังมีตัว resolve env-marker ของ AWS ในตัวที่นี่ด้วย แม้ว่า auth runtime ของ Bedrock เองยังใช้ AWS SDK default chain อยู่
      - `resolveSystemPromptContribution` ให้ผู้ให้บริการฉีดคำแนะนำ system-prompt ที่รับรู้ cache สำหรับตระกูลโมเดลได้ ให้ใช้สิ่งนี้แทน `before_prompt_build` เมื่อพฤติกรรมเป็นของผู้ให้บริการ/ตระกูลโมเดลหนึ่งราย และควรรักษาการแยก cache แบบ stable/dynamic

      สำหรับคำอธิบายละเอียดและตัวอย่างจากการใช้งานจริง โปรดดู [Internals: Provider Runtime Hooks](/th/plugins/architecture-internals#provider-runtime-hooks)
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    ### ขั้นตอนที่ 5: เพิ่มความสามารถพิเศษ

    Plugin ผู้ให้บริการสามารถลงทะเบียน speech, realtime transcription, realtime
    voice, media understanding, image generation, video generation, web fetch
    และ web search ควบคู่ไปกับ text inference ได้ OpenClaw จัดประเภทสิ่งนี้เป็น
    Plugin แบบ **hybrid-capability** - ซึ่งเป็นแพตเทิร์นที่แนะนำสำหรับ Plugin ของบริษัท
    (หนึ่ง Plugin ต่อ vendor) ดู
    [Internals: Capability Ownership](/th/plugins/architecture#capability-ownership-model)

    ลงทะเบียนแต่ละความสามารถภายใน `register(api)` ควบคู่กับการเรียก
    `api.registerProvider(...)` ที่มีอยู่ของคุณ เลือกเฉพาะแท็บที่คุณต้องการ:

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

        ใช้ `assertOkOrThrowProviderError(...)` สำหรับความล้มเหลว HTTP ของผู้ให้บริการ เพื่อให้
        Plugin ใช้การอ่านเนื้อหาข้อผิดพลาดแบบจำกัดขนาด การแยกวิเคราะห์ข้อผิดพลาด JSON และ
        ส่วนต่อท้าย request-id ร่วมกัน
      </Tab>
      <Tab title="Realtime transcription">
        ควรใช้ `createRealtimeTranscriptionWebSocketSession(...)` - ตัวช่วยที่ใช้ร่วมกัน
        จัดการการจับพร็อกซี การหน่วงเวลาก่อนเชื่อมต่อใหม่ การล้างข้อมูลตอนปิด การจับมือเมื่อพร้อม
        การจัดคิวเสียง และการวินิจฉัยเหตุการณ์ปิด Plugin ของคุณ
        เพียงแค่แมปเหตุการณ์จาก upstream เท่านั้น

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
        `openclaw/plugin-sdk/provider-http` ตัวช่วยจะปรับชื่อไฟล์อัปโหลดให้เป็นมาตรฐาน
        รวมถึงการอัปโหลด AAC ที่ต้องใช้ชื่อไฟล์สไตล์ M4A สำหรับ
        API ถอดเสียงที่เข้ากันได้
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

        ประกาศ `capabilities` เพื่อให้ `talk.catalog` เปิดเผยโหมดที่ถูกต้อง
        ทรานสปอร์ต รูปแบบเสียง และแฟล็กฟีเจอร์ให้กับไคลเอนต์ Talk บนเบราว์เซอร์และเนทีฟ
        ใช้งาน `handleBargeIn` เมื่อทรานสปอร์ตสามารถตรวจจับได้ว่า
        มนุษย์กำลังขัดจังหวะการเล่นเสียงของผู้ช่วย และผู้ให้บริการรองรับ
        การตัดทอนหรือล้างการตอบกลับเสียงที่ใช้งานอยู่
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
        ความสามารถด้านวิดีโอใช้รูปแบบที่ **รับรู้โหมด** ได้แก่ `generate`,
        `imageToVideo` และ `videoToVideo` ฟิลด์รวมแบบแบน เช่น
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` ไม่
        เพียงพอสำหรับประกาศการรองรับโหมดแปลงหรือโหมดที่ปิดใช้งานได้อย่างชัดเจน
        การสร้างเพลงใช้รูปแบบเดียวกัน โดยมีบล็อก `generate` /
        `edit` ที่ชัดเจน

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

Provider Plugin เผยแพร่ด้วยวิธีเดียวกับ Plugin โค้ดภายนอกอื่น ๆ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

อย่าใช้นามแฝงการเผยแพร่แบบเดิมที่มีไว้สำหรับ skill เท่านั้นในที่นี้ แพ็กเกจ Plugin ควรใช้
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

`catalog.order` ควบคุมว่าแค็ตตาล็อกของคุณจะผสานเมื่อใดเมื่อเทียบกับ
ผู้ให้บริการในตัว:

| ลำดับ     | เมื่อใด          | กรณีใช้งาน                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | รอบแรก    | ผู้ให้บริการที่ใช้ API key ธรรมดา                         |
| `profile` | หลัง simple  | ผู้ให้บริการที่ถูกควบคุมด้วยโปรไฟล์การยืนยันตัวตน                |
| `paired`  | หลัง profile | สังเคราะห์รายการที่เกี่ยวข้องกันหลายรายการ             |
| `late`    | รอบสุดท้าย     | แทนที่ผู้ให้บริการที่มีอยู่ (ชนะเมื่อชนกัน) |

## ขั้นตอนถัดไป

- [Channel Plugins](/th/plugins/sdk-channel-plugins) - หาก Plugin ของคุณมีช่องทางด้วย
- [SDK Runtime](/th/plugins/sdk-runtime) - ตัวช่วย `api.runtime` (TTS, การค้นหา, subagent)
- [ภาพรวม SDK](/th/plugins/sdk-overview) - ข้อมูลอ้างอิงการนำเข้า subpath ทั้งหมด
- [ข้อมูลภายในของ Plugin](/th/plugins/architecture-internals#provider-runtime-hooks) - รายละเอียด hook และตัวอย่างที่บันเดิลไว้

## ที่เกี่ยวข้อง

- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [การสร้าง channel Plugin](/th/plugins/sdk-channel-plugins)
