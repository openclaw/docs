---
read_when:
    - คุณกำลังสร้าง Plugin ผู้ให้บริการโมเดลใหม่
    - คุณต้องการเพิ่มพร็อกซีที่เข้ากันได้กับ OpenAI หรือ LLM แบบกำหนดเองลงใน OpenClaw
    - คุณต้องเข้าใจการตรวจสอบสิทธิ์ของผู้ให้บริการ แคตตาล็อก และฮุกของรันไทม์
sidebarTitle: Provider plugins
summary: คู่มือทีละขั้นตอนสำหรับการสร้าง Plugin ผู้ให้บริการโมเดลสำหรับ OpenClaw
title: การสร้าง Plugin ผู้ให้บริการ
x-i18n:
    generated_at: "2026-06-27T18:07:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

คู่มือนี้จะพาคุณสร้าง Plugin ผู้ให้บริการที่เพิ่มผู้ให้บริการโมเดล
(LLM) ให้กับ OpenClaw เมื่อทำเสร็จ คุณจะมีผู้ให้บริการพร้อมแค็ตตาล็อกโมเดล
การยืนยันตัวตนด้วยคีย์ API และการแก้ไขโมเดลแบบไดนามิก

<Info>
  หากคุณยังไม่เคยสร้าง Plugin ของ OpenClaw มาก่อน ให้อ่าน
  [เริ่มต้นใช้งาน](/th/plugins/building-plugins) ก่อนสำหรับโครงสร้างแพ็กเกจ
  พื้นฐานและการตั้งค่าแมนิเฟสต์
</Info>

<Tip>
  Plugin ผู้ให้บริการจะเพิ่มโมเดลเข้าไปในลูปอนุมานปกติของ OpenClaw หากโมเดล
  ต้องรันผ่านดีมอนเอเจนต์แบบเนทีฟที่เป็นเจ้าของเธรด, Compaction หรือเหตุการณ์เครื่องมือ
  ให้จับคู่ผู้ให้บริการกับ [agent harness](/th/plugins/sdk-agent-harness)
  แทนการใส่รายละเอียดโปรโตคอลของดีมอนไว้ในแกนหลัก
</Tip>

## คำแนะนำแบบทีละขั้น

<Steps>
  <Step title="Package and manifest">
    ### ขั้นตอนที่ 1: แพ็กเกจและแมนิเฟสต์

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

    แมนิเฟสต์ประกาศ `setup.providers[].envVars` เพื่อให้ OpenClaw ตรวจพบ
    ข้อมูลประจำตัวได้โดยไม่ต้องโหลดรันไทม์ Plugin ของคุณ เพิ่ม `providerAuthAliases`
    เมื่อรูปแบบย่อยของผู้ให้บริการควรใช้การยืนยันตัวตนของรหัสผู้ให้บริการอื่นซ้ำ `modelSupport`
    เป็นตัวเลือกเสริมและช่วยให้ OpenClaw โหลด Plugin ผู้ให้บริการของคุณโดยอัตโนมัติจากรหัสโมเดล
    แบบย่อ เช่น `acme-large` ก่อนที่ฮุกของรันไทม์จะมีอยู่ หากคุณเผยแพร่
    ผู้ให้บริการบน ClawHub ฟิลด์ `openclaw.compat` และ `openclaw.build` เหล่านั้น
    จำเป็นต้องมีใน `package.json`

  </Step>

  <Step title="Register the provider">
    ผู้ให้บริการข้อความขั้นต่ำต้องมี `id`, `label`, `auth` และ `catalog`
    `catalog` คือฮุกของรันไทม์/การกำหนดค่าที่ผู้ให้บริการเป็นเจ้าของ ซึ่งสามารถเรียก API ของผู้ขาย
    แบบสดและส่งคืนรายการ `models.providers`

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

    `registerModelCatalogProvider` คือพื้นผิวแค็ตตาล็อกของ control-plane ที่ใหม่กว่า
    สำหรับ UI รายการ/วิธีใช้/ตัวเลือก ใช้สำหรับแถวข้อความ, การสร้างรูปภาพ,
    การสร้างวิดีโอ และการสร้างเพลง เก็บการเรียกเอนด์พอยต์ของผู้ขายและ
    การแมปการตอบกลับไว้ใน Plugin; OpenClaw เป็นเจ้าของรูปทรงแถวร่วม ป้ายกำกับ
    แหล่งที่มา และการเรนเดอร์วิธีใช้

    นี่คือผู้ให้บริการที่ใช้งานได้แล้ว ตอนนี้ผู้ใช้สามารถ
    `openclaw onboard --acme-ai-api-key <key>` และเลือก
    `acme-ai/acme-large` เป็นโมเดลของตนได้

    ### การค้นหาโมเดลแบบสด

    หากผู้ให้บริการของคุณเปิดเผย API ลักษณะ `/models` ให้เก็บเอนด์พอยต์เฉพาะของผู้ให้บริการ
    และการฉายแถวไว้ใน Plugin ของคุณ และใช้
    `openclaw/plugin-sdk/provider-catalog-live-runtime` สำหรับวงจรชีวิตการดึงข้อมูล
    ร่วม ตัวช่วยนี้ให้การดึงข้อมูล HTTP แบบมีการป้องกัน, ส่วนหัวยืนยันตัวตนของผู้ให้บริการ,
    ข้อผิดพลาด HTTP แบบมีโครงสร้าง, การแคช TTL และพฤติกรรม fallback แบบสแตติกโดยไม่ต้อง
    ใส่นโยบายผู้ให้บริการไว้ในแกนหลักของ OpenClaw

    ใช้ `buildLiveModelProviderConfig` เมื่อ API แบบสดบอกคุณเพียงว่า
    แถวแค็ตตาล็อกสแตติกที่ผู้ให้บริการเป็นเจ้าของรายการใดพร้อมใช้งานอยู่ในขณะนี้:

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

    ใช้ `getCachedLiveProviderModelRows` เมื่อ API ของผู้ให้บริการส่งคืน
    เมทาดาทาที่สมบูรณ์กว่า และ Plugin ต้องฉายแถวเป็นนิยามโมเดลของ OpenClaw
    ด้วยตนเอง:

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

    `run` ควรยังคงถูกกั้นด้วยการยืนยันตัวตนและส่งคืน `null` เมื่อไม่มีข้อมูลประจำตัวที่ใช้งานได้
    ให้พร้อมใช้งาน เก็บ `staticRun` แบบออฟไลน์หรือ fallback แบบสแตติกไว้ เพื่อให้การตั้งค่า เอกสาร
    การทดสอบ และพื้นผิวตัวเลือกไม่ต้องพึ่งพาการเข้าถึงเครือข่ายแบบสด ใช้ TTL
    ที่เหมาะสมกับความสดใหม่ของรายการโมเดล หลีกเลี่ยงการสำรวจระบบไฟล์ขณะรับคำขอ
    และส่ง `readRows` / `readModelId` เฉพาะเมื่อการตอบกลับจากต้นทาง
    ไม่ใช่รูปทรงที่เข้ากันได้กับ OpenAI แบบ `{ data: [{ id, object }] }`

    หากผู้ให้บริการต้นทางใช้โทเค็นควบคุมที่ต่างจาก OpenClaw ให้เพิ่มการแปลงข้อความ
    แบบสองทิศทางขนาดเล็กแทนการแทนที่เส้นทางสตรีม:

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

    `input` เขียนพรอมป์ระบบสุดท้ายและเนื้อหาข้อความใหม่ก่อนการขนส่ง
    `output` เขียนเดลตาข้อความของผู้ช่วยและข้อความสุดท้ายใหม่ก่อนที่
    OpenClaw จะแยกวิเคราะห์มาร์กเกอร์ควบคุมของตนเองหรือส่งผ่านช่องทาง

    สำหรับผู้ให้บริการที่บันเดิลมาด้วยซึ่งลงทะเบียนผู้ให้บริการข้อความเพียงหนึ่งรายพร้อมการยืนยันตัวตนด้วยคีย์ API
    และรันไทม์เดียวที่รองรับด้วยแค็ตตาล็อก ให้เลือกใช้ตัวช่วยที่แคบกว่า
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

    `buildProvider` คือเส้นทางแค็ตตาล็อกสดที่ใช้เมื่อ OpenClaw แก้ไขค่า auth
    ของ provider จริงได้ เส้นทางนี้อาจทำการค้นหาเฉพาะ provider ใช้
    `buildStaticProvider` เฉพาะสำหรับแถวออฟไลน์ที่ปลอดภัยต่อการแสดงก่อนกำหนดค่า auth
    แล้วเท่านั้น โดยต้องไม่ต้องใช้ข้อมูลประจำตัวหรือส่งคำขอเครือข่าย
    การแสดงผล `models list --all` ของ OpenClaw ในปัจจุบันเรียกใช้แค็ตตาล็อกแบบคงที่
    เฉพาะสำหรับ Plugin ของ provider ที่บันเดิลมาเท่านั้น พร้อม config ว่าง env ว่าง และไม่มี
    พาธ agent/workspace

    หากโฟลว์ auth ของคุณต้องแพตช์ `models.providers.*`, aliases และ
    โมเดลเริ่มต้นของ agent ระหว่าง onboarding ด้วย ให้ใช้ตัวช่วยพรีเซ็ตจาก
    `openclaw/plugin-sdk/provider-onboard` ตัวช่วยที่แคบที่สุดคือ
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` และ
    `createModelCatalogPresetAppliers(...)`

    เมื่อ endpoint ดั้งเดิมของ provider รองรับบล็อกการใช้งานแบบสตรีมบน
    transport `openai-completions` ปกติ ให้เลือกใช้ตัวช่วยแค็ตตาล็อกร่วมใน
    `openclaw/plugin-sdk/provider-catalog-shared` แทนการฮาร์ดโค้ด
    การตรวจสอบ provider-id `supportsNativeStreamingUsageCompat(...)` และ
    `applyProviderNativeStreamingUsageCompat(...)` ตรวจจับการรองรับจาก
    แผนที่ความสามารถของ endpoint ดังนั้น endpoint สไตล์ Moonshot/DashScope แบบดั้งเดิมยังคง
    opt in ได้แม้ Plugin จะใช้ provider id แบบกำหนดเองอยู่ก็ตาม

    ตัวอย่างการค้นหาสดด้านบนครอบคลุม API ของ provider สไตล์ `/models` ให้เก็บ
    การค้นหานั้นไว้ใน `catalog.run` โดยมี usable auth เป็นเงื่อนไข และให้
    `staticRun` ไม่มีการใช้เครือข่ายสำหรับการสร้างแค็ตตาล็อกออฟไลน์

  </Step>

  <Step title="เพิ่มการแก้ไขโมเดลแบบไดนามิก">
    หาก provider ของคุณรับ ID โมเดลใดก็ได้ เช่น proxy หรือ router
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

    หากการแก้ไขต้องใช้การเรียกเครือข่าย ให้ใช้ `prepareDynamicModel` สำหรับการ
    วอร์มอัปแบบ async - `resolveDynamicModel` จะรันอีกครั้งหลังจากทำเสร็จ

  </Step>

  <Step title="เพิ่ม runtime hooks (ตามต้องการ)">
    provider ส่วนใหญ่ต้องการเพียง `catalog` + `resolveDynamicModel` เพิ่ม hooks
    ทีละส่วนตามที่ provider ของคุณต้องการ

    ตัวสร้างตัวช่วยร่วมตอนนี้ครอบคลุมตระกูล replay/tool-compat ที่พบบ่อยที่สุดแล้ว
    ดังนั้นโดยทั่วไป Plugin จึงไม่จำเป็นต้องต่อ hook แต่ละตัวด้วยมือทีละตัว:

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

    ตระกูล replay ที่มีอยู่ในวันนี้:

    | ตระกูล | สิ่งที่ต่อให้ | ตัวอย่างที่บันเดิลมา |
    | --- | --- | --- |
    | `openai-compatible` | นโยบาย replay ร่วมสไตล์ OpenAI สำหรับ transport ที่เข้ากันได้กับ OpenAI รวมถึงการทำความสะอาด tool-call-id การแก้ไขลำดับ assistant-first และการตรวจสอบ Gemini-turn ทั่วไปเมื่อ transport ต้องการ | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | นโยบาย replay ที่รู้จัก Claude ซึ่งเลือกตาม `modelId` เพื่อให้ transport แบบ Anthropic-message ได้รับการล้าง thinking-block เฉพาะ Claude เฉพาะเมื่อโมเดลที่แก้ไขได้เป็น id ของ Claude จริงเท่านั้น | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | นโยบาย replay ดั้งเดิมของ Gemini พร้อมการทำความสะอาด bootstrap replay ตระกูลร่วมคง Gemini CLI แบบเอาต์พุตข้อความไว้บน reasoning แบบติดแท็ก ส่วน provider `google` โดยตรง override `resolveReasoningOutputMode` เป็น `native` เพราะ thinking ของ Gemini API มาเป็น native thought parts | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | การทำความสะอาด thought-signature ของ Gemini สำหรับโมเดล Gemini ที่รันผ่าน proxy transport ที่เข้ากันได้กับ OpenAI; ไม่เปิดใช้การตรวจสอบ replay แบบดั้งเดิมของ Gemini หรือการเขียน bootstrap ใหม่ | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | นโยบายไฮบริดสำหรับ provider ที่ผสมพื้นผิวโมเดลแบบ Anthropic-message และแบบเข้ากันได้กับ OpenAI ไว้ใน Plugin เดียว; การทิ้ง thinking-block เฉพาะ Claude ที่เป็นตัวเลือกจะยังจำกัดขอบเขตไว้ที่ฝั่ง Anthropic | `minimax` |

    ตระกูล stream ที่มีอยู่ในวันนี้:

    | ตระกูล | สิ่งที่ต่อให้ | ตัวอย่างที่บันเดิลมา |
    | --- | --- | --- |
    | `google-thinking` | การทำให้ payload thinking ของ Gemini เป็นมาตรฐานบนเส้นทาง stream ร่วม | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | wrapper reasoning ของ Kilo บนเส้นทาง proxy stream ร่วม โดย `kilo/auto` และ id reasoning ของ proxy ที่ไม่รองรับจะข้าม thinking ที่ฉีดเข้าไป | `kilocode` |
    | `moonshot-thinking` | การแมป payload native-thinking แบบไบนารีของ Moonshot จาก config + ระดับ `/think` | `moonshot` |
    | `minimax-fast-mode` | การเขียนโมเดล MiniMax fast-mode ใหม่บนเส้นทาง stream ร่วม | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | wrapper Responses ดั้งเดิมร่วมของ OpenAI/Codex: header การระบุแหล่งที่มา, `/fast`/`serviceTier`, ความละเอียดของข้อความ, การค้นหาเว็บดั้งเดิมของ Codex, การจัดรูป payload สำหรับ reasoning-compat และการจัดการ context ของ Responses | `openai` |
    | `openrouter-thinking` | wrapper reasoning ของ OpenRouter สำหรับเส้นทาง proxy โดยจัดการการข้าม unsupported-model/`auto` จากส่วนกลาง | `openrouter` |
    | `tool-stream-default-on` | wrapper `tool_stream` ที่เปิดเป็นค่าเริ่มต้นสำหรับ provider อย่าง Z.AI ที่ต้องการ tool streaming เว้นแต่จะถูกปิดอย่างชัดเจน | `zai` |

    <Accordion title="SDK seams ที่ขับเคลื่อนตัวสร้างตระกูล">
      ตัวสร้างแต่ละตระกูลประกอบจากตัวช่วยสาธารณะระดับล่างที่ export จากแพ็กเกจเดียวกัน ซึ่งคุณสามารถหยิบใช้เมื่อ provider ต้องออกนอกแพตเทิร์นทั่วไป:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` และตัวสร้าง replay ดิบ (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`) ยัง export ตัวช่วย replay ของ Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) และตัวช่วย endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`)
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` พร้อม wrapper OpenAI/Codex ร่วม (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper DeepSeek V4 ที่เข้ากันได้กับ OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), การล้าง thinking prefill ของ Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), compat สำหรับ tool-call แบบข้อความล้วน (`createPlainTextToolCallCompatWrapper`) และ wrapper proxy/provider ร่วม (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`)
      - `openclaw/plugin-sdk/provider-stream-shared` - wrapper payload และ event น้ำหนักเบาสำหรับเส้นทาง provider ที่ร้อน รวมถึง `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` และ `setQwenChatTemplateThinking(...)`
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` และตัวช่วย schema ของ provider ที่อยู่ข้างใต้

      สำหรับ provider ตระกูล Gemini ให้จัดโหมดเอาต์พุต reasoning ให้ตรงกับ
      transport provider ของ Google Gemini API โดยตรงควรใช้เอาต์พุต reasoning แบบ `native`
      เพื่อให้ OpenClaw ใช้ native thought parts ได้โดยไม่ต้องเพิ่ม
      คำสั่ง prompt `<think>` / `<final>` แบ็กเอนด์สไตล์ Gemini CLI ที่เป็นข้อความเท่านั้น
      ซึ่งแยกวิเคราะห์การตอบกลับ JSON/ข้อความสุดท้าย สามารถคงสัญญาแบบติดแท็กของ
      `google-gemini` ร่วมไว้ได้

      ตัวช่วย stream บางตัวยังคงเป็นของ provider-local โดยตั้งใจ `@openclaw/anthropic-provider` เก็บ `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` และตัวสร้าง wrapper Anthropic ระดับล่างไว้ใน seam สาธารณะ `api.ts` / `contract-api.ts` ของตัวเอง เพราะสิ่งเหล่านี้เข้ารหัสการจัดการ beta ของ Claude OAuth และการกำหนดเงื่อนไข `context1m` Plugin xAI ก็เช่นกัน โดยเก็บการจัดรูป Responses ดั้งเดิมของ xAI ไว้ใน `wrapStreamFn` ของตัวเอง (alias `/fast`, ค่าเริ่มต้น `tool_stream`, การล้าง strict-tool ที่ไม่รองรับ, การลบ reasoning-payload เฉพาะ xAI)

      แพตเทิร์น package-root เดียวกันยังรองรับ `@openclaw/openai-provider` (ตัวสร้าง provider, ตัวช่วยโมเดลเริ่มต้น, ตัวสร้าง provider แบบเรียลไทม์) และ `@openclaw/openrouter-provider` (ตัวสร้าง provider พร้อมตัวช่วย onboarding/config)
    </Accordion>

    <Tabs>
      <Tab title="การแลกเปลี่ยนโทเค็น">
        สำหรับ provider ที่ต้องการแลกเปลี่ยนโทเค็นก่อนการเรียก inference แต่ละครั้ง:

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
      <Tab title="Header แบบกำหนดเอง">
        สำหรับ provider ที่ต้องการ header คำขอแบบกำหนดเองหรือการแก้ไข body:

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
      <Tab title="ตัวตน transport ดั้งเดิม">
        สำหรับ provider ที่ต้องการ header หรือ metadata ของคำขอ/session แบบดั้งเดิมบน
        transport HTTP หรือ WebSocket ทั่วไป:

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

        `resolveUsageAuth` มีผลลัพธ์สามแบบ ส่งคืน `{ token, accountId? }`
        เมื่อผู้ให้บริการมีข้อมูลรับรองสำหรับการใช้งาน/การเรียกเก็บเงิน ส่งคืน
        `{ handled: true }` เฉพาะเมื่อผู้ให้บริการจัดการ auth สำหรับการใช้งานแล้วอย่างแน่ชัด
        แต่ไม่มีโทเค็นการใช้งานที่ใช้ได้ และ OpenClaw ต้องข้าม fallback แบบทั่วไป
        สำหรับ API key/OAuth ส่งคืน `null` หรือ `undefined` เมื่อผู้ให้บริการไม่ได้
        จัดการคำขอ และ OpenClaw ควรดำเนินการต่อด้วย fallback แบบทั่วไป
      </Tab>
    </Tabs>

    <Accordion title="Hook ของผู้ให้บริการทั้งหมดที่มีให้ใช้">
      OpenClaw เรียก Hook ตามลำดับนี้ ผู้ให้บริการส่วนใหญ่ใช้เพียง 2-3 รายการ:
      ฟิลด์ของผู้ให้บริการที่มีไว้เพื่อความเข้ากันได้เท่านั้นซึ่ง OpenClaw ไม่เรียกใช้อีกแล้ว เช่น
      `ProviderPlugin.capabilities` และ `suppressBuiltInModel` จะไม่แสดงไว้
      ที่นี่

      | # | Hook | ควรใช้เมื่อใด |
      | --- | --- | --- |
      | 1 | `catalog` | แค็ตตาล็อกโมเดลหรือค่าเริ่มต้นของ URL ฐาน |
      | 2 | `applyConfigDefaults` | ค่าเริ่มต้นแบบ global ที่ผู้ให้บริการเป็นเจ้าของระหว่างการทำให้ config เป็นรูปธรรม |
      | 3 | `normalizeModelId` | ล้าง alias ของ model-id แบบ legacy/preview ก่อน lookup |
      | 4 | `normalizeTransport` | ล้าง `api` / `baseUrl` ของตระกูลผู้ให้บริการก่อนประกอบโมเดลแบบทั่วไป |
      | 5 | `normalizeConfig` | Normalize config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | เขียน compat ของการใช้งานสตรีมมิงแบบเนทีฟใหม่สำหรับผู้ให้บริการใน config |
      | 7 | `resolveConfigApiKey` | แก้ auth จาก env-marker ที่ผู้ให้บริการเป็นเจ้าของ |
      | 8 | `resolveSyntheticAuth` | auth สังเคราะห์แบบ local/self-hosted หรืออิง config |
      | 9 | `shouldDeferSyntheticProfileAuth` | ลดลำดับ placeholder ของโปรไฟล์ที่จัดเก็บแบบสังเคราะห์ให้อยู่หลัง auth จาก env/config |
      | 10 | `resolveDynamicModel` | ยอมรับ ID โมเดล upstream แบบกำหนดเอง |
      | 11 | `prepareDynamicModel` | ดึง metadata แบบ async ก่อน resolve |
      | 12 | `normalizeResolvedModel` | เขียน transport ใหม่ก่อน runner |
      | 13 | `normalizeToolSchemas` | ล้าง tool-schema ที่ผู้ให้บริการเป็นเจ้าของก่อนลงทะเบียน |
      | 14 | `inspectToolSchemas` | การวินิจฉัย tool-schema ที่ผู้ให้บริการเป็นเจ้าของ |
      | 15 | `resolveReasoningOutputMode` | สัญญา reasoning-output แบบ tagged เทียบกับแบบเนทีฟ |
      | 16 | `prepareExtraParams` | พารามิเตอร์คำขอเริ่มต้น |
      | 17 | `createStreamFn` | transport StreamFn แบบกำหนดเองทั้งหมด |
      | 19 | `wrapStreamFn` | wrapper ของ headers/body แบบกำหนดเองบนเส้นทางสตรีมปกติ |
      | 20 | `resolveTransportTurnState` | headers/metadata แบบเนทีฟต่อ turn |
      | 21 | `resolveWebSocketSessionPolicy` | headers/cool-down ของเซสชัน WS แบบเนทีฟ |
      | 22 | `formatApiKey` | รูปแบบโทเค็น runtime แบบกำหนดเอง |
      | 23 | `refreshOAuth` | รีเฟรช OAuth แบบกำหนดเอง |
      | 24 | `buildAuthDoctorHint` | คำแนะนำการซ่อมแซม auth |
      | 25 | `matchesContextOverflowError` | การตรวจจับ overflow ที่ผู้ให้บริการเป็นเจ้าของ |
      | 26 | `classifyFailoverReason` | การจัดประเภท rate-limit/overload ที่ผู้ให้บริการเป็นเจ้าของ |
      | 27 | `isCacheTtlEligible` | การกั้น TTL ของ prompt cache |
      | 28 | `buildMissingAuthMessage` | hint เมื่อ auth หายไปแบบกำหนดเอง |
      | 29 | `augmentModelCatalog` | แถวสังเคราะห์สำหรับ forward-compat |
      | 30 | `resolveThinkingProfile` | ชุดตัวเลือก `/think` เฉพาะโมเดล |
      | 31 | `isBinaryThinking` | ความเข้ากันได้ของการคิดแบบ binary เปิด/ปิด |
      | 32 | `supportsXHighThinking` | ความเข้ากันได้ของการรองรับ reasoning `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | ความเข้ากันได้ของนโยบาย `/think` เริ่มต้น |
      | 34 | `isModernModelRef` | การจับคู่โมเดล live/smoke |
      | 35 | `prepareRuntimeAuth` | แลกเปลี่ยนโทเค็นก่อน inference |
      | 36 | `resolveUsageAuth` | การแยกวิเคราะห์ข้อมูลรับรองการใช้งานแบบกำหนดเอง |
      | 37 | `fetchUsageSnapshot` | endpoint การใช้งานแบบกำหนดเอง |
      | 38 | `createEmbeddingProvider` | adapter embedding ที่ผู้ให้บริการเป็นเจ้าของสำหรับ memory/search |
      | 39 | `buildReplayPolicy` | นโยบาย replay/Compaction ของ transcript แบบกำหนดเอง |
      | 40 | `sanitizeReplayHistory` | การเขียน replay เฉพาะผู้ให้บริการใหม่หลังการล้างแบบทั่วไป |
      | 41 | `validateReplayTurns` | การตรวจสอบ replay-turn แบบเข้มงวดก่อน runner แบบฝัง |
      | 42 | `onModelSelected` | callback หลังการเลือก เช่น telemetry |

      หมายเหตุ fallback ของ runtime:

      - `normalizeConfig` ตรวจสอบผู้ให้บริการที่ตรงกันก่อน จากนั้นจึงตรวจสอบ Plugin ผู้ให้บริการอื่นที่รองรับ Hook ได้จนกว่าจะมีรายการหนึ่งเปลี่ยน config จริง หากไม่มี Hook ของผู้ให้บริการใดเขียนรายการ config ตระกูล Google ที่รองรับใหม่ ตัว normalizer ของ config Google ที่ bundled มายังคงมีผล
      - `resolveConfigApiKey` ใช้ Hook ของผู้ให้บริการเมื่อเปิดเผยไว้ Amazon Bedrock เก็บการ resolve env-marker ของ AWS ไว้ใน Plugin ผู้ให้บริการของตนเอง ส่วน auth ของ runtime เองยังคงใช้ chain เริ่มต้นของ AWS SDK เมื่อกำหนดค่าด้วย `auth: "aws-sdk"`
      - `resolveThinkingProfile(ctx)` ได้รับ `provider`, `modelId` ที่เลือก, hint แค็ตตาล็อก `reasoning` ที่ merge แล้วแบบเลือกได้ และข้อเท็จจริง `compat` ของโมเดลที่ merge แล้วแบบเลือกได้ ใช้ `compat` เพื่อเลือก UI/profile การคิดของผู้ให้บริการเท่านั้น
      - `resolveSystemPromptContribution` ให้ผู้ให้บริการฉีดคำแนะนำ system-prompt ที่รับรู้ cache สำหรับตระกูลโมเดลได้ ควรใช้สิ่งนี้แทน `before_prompt_build` เมื่อพฤติกรรมเป็นของผู้ให้บริการ/ตระกูลโมเดลเดียว และควรรักษาการแยก cache แบบเสถียร/ไดนามิกไว้

      สำหรับคำอธิบายโดยละเอียดและตัวอย่างจากการใช้งานจริง โปรดดู [ภายใน: Hook ของ Runtime ผู้ให้บริการ](/th/plugins/architecture-internals#provider-runtime-hooks)
    </Accordion>

  </Step>

  <Step title="เพิ่มความสามารถเพิ่มเติม (ไม่บังคับ)">
    ### ขั้นตอนที่ 5: เพิ่มความสามารถเพิ่มเติม

    Plugin ผู้ให้บริการสามารถลงทะเบียน embeddings, speech, การถอดเสียงแบบ realtime,
    เสียงแบบ realtime, ความเข้าใจสื่อ, การสร้างภาพ, การสร้างวิดีโอ,
    web fetch และ web search ควบคู่กับ text inference ได้ OpenClaw จัดประเภทสิ่งนี้เป็น
    Plugin แบบ **ความสามารถไฮบริด** ซึ่งเป็นรูปแบบที่แนะนำสำหรับ Plugin ของบริษัท
    (หนึ่ง Plugin ต่อ vendor) ดู
    [ภายใน: ความเป็นเจ้าของความสามารถ](/th/plugins/architecture#capability-ownership-model)

    ลงทะเบียนแต่ละความสามารถภายใน `register(api)` ควบคู่กับการเรียก
    `api.registerProvider(...)` ที่มีอยู่ เลือกเฉพาะแท็บที่คุณต้องการ:

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

        ใช้ `assertOkOrThrowProviderError(...)` สำหรับความล้มเหลว HTTP ของผู้ให้บริการ เพื่อให้
        Plugin ใช้การอ่าน error-body แบบจำกัด, การแยกวิเคราะห์ข้อผิดพลาด JSON และ
        suffix ของ request-id ร่วมกัน
      </Tab>
      <Tab title="การถอดเสียงแบบ realtime">
        ควรใช้ `createRealtimeTranscriptionWebSocketSession(...)` โดย helper ที่ใช้ร่วมกันนี้
        จัดการการจับ proxy, backoff การเชื่อมต่อใหม่, การ flush ตอนปิด, handshake ความพร้อม,
        การเข้าคิวเสียง และการวินิจฉัย close-event ให้แล้ว Plugin ของคุณ
        เพียง map event จาก upstream เท่านั้น

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

        ผู้ให้บริการ STT แบบ batch ที่ POST เสียง multipart ควรใช้
        `buildAudioTranscriptionFormData(...)` จาก
        `openclaw/plugin-sdk/provider-http` helper นี้ normalize
        ชื่อไฟล์อัปโหลด รวมถึงการอัปโหลด AAC ที่ต้องใช้ชื่อไฟล์แบบ M4A สำหรับ
        API ถอดเสียงที่เข้ากันได้
      </Tab>
      <Tab title="เสียงแบบ realtime">
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

        ประกาศ `capabilities` เพื่อให้ `talk.catalog` แสดงโหมด,
        ทรานสปอร์ต, รูปแบบเสียง และแฟล็กฟีเจอร์ที่ใช้ได้แก่ไคลเอนต์ Talk
        บนเบราว์เซอร์และแบบเนทีฟ ใช้ `handleBargeIn` เมื่อทรานสปอร์ตสามารถตรวจพบว่า
        มนุษย์กำลังขัดจังหวะการเล่นเสียงของผู้ช่วย และผู้ให้บริการรองรับ
        การตัดทอนหรือล้างการตอบกลับเสียงที่กำลังใช้งานอยู่
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

        ผู้ให้บริการสื่อแบบโลคัลหรือโฮสต์เองที่ตั้งใจไม่ต้องใช้
        ข้อมูลรับรองสามารถเปิดเผย `resolveAuth` และส่งคืน `kind: "none"` ได้
        OpenClaw ยังคงเกตการยืนยันตัวตนปกติไว้สำหรับผู้ให้บริการที่ไม่ได้
        เลือกใช้อย่างชัดเจน ผู้ให้บริการที่มีอยู่สามารถอ่าน `req.apiKey` ต่อไปได้;
        ผู้ให้บริการใหม่ควรใช้ `req.auth` เป็นหลัก

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

        ประกาศรหัสเดียวกันใน `contracts.embeddingProviders` นี่คือ
        สัญญา embedding ทั่วไปสำหรับการสร้างเวกเตอร์ที่นำกลับมาใช้ซ้ำได้ รวมถึง
        การค้นหาหน่วยความจำ `registerMemoryEmbeddingProvider(...)` เป็นความเข้ากันได้
        ที่เลิกใช้แล้วสำหรับอะแดปเตอร์เฉพาะหน่วยความจำที่มีอยู่
      </Tab>
      <Tab title="Image and video generation">
        ความสามารถวิดีโอใช้รูปแบบที่**รับรู้โหมด**: `generate`,
        `imageToVideo` และ `videoToVideo` ฟิลด์รวมแบบแบนอย่าง
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` ไม่
        เพียงพอสำหรับประกาศการรองรับโหมดแปลงหรือโหมดที่ปิดใช้อย่างชัดเจน
        การสร้างเพลงใช้รูปแบบเดียวกันโดยมีบล็อก `generate` /
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

Plugin ผู้ให้บริการเผยแพร่ด้วยวิธีเดียวกับ Plugin โค้ดภายนอกอื่น ๆ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

อย่าใช้นามแฝงการเผยแพร่แบบเดิมที่ใช้สำหรับสกิลเท่านั้นที่นี่; แพ็กเกจ Plugin ควรใช้
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

`catalog.order` ควบคุมว่าแค็ตตาล็อกของคุณจะถูกรวมเมื่อใดเมื่อเทียบกับ
ผู้ให้บริการในตัว:

| ลำดับ     | เมื่อใด          | กรณีใช้งาน                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | รอบแรก    | ผู้ให้บริการที่ใช้คีย์ API ทั่วไป                         |
| `profile` | หลังจาก simple  | ผู้ให้บริการที่ถูกเกตด้วยโปรไฟล์การยืนยันตัวตน                |
| `paired`  | หลังจาก profile | สังเคราะห์รายการที่เกี่ยวข้องกันหลายรายการ             |
| `late`    | รอบสุดท้าย     | เขียนทับผู้ให้บริการที่มีอยู่ (ชนะเมื่อชนกัน) |

## ขั้นตอนถัดไป

- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) - หาก Plugin ของคุณมีช่องทางด้วย
- [รันไทม์ SDK](/th/plugins/sdk-runtime) - ตัวช่วย `api.runtime` (TTS, การค้นหา, subagent)
- [ภาพรวม SDK](/th/plugins/sdk-overview) - อ้างอิงการนำเข้า subpath ฉบับเต็ม
- [ภายในของ Plugin](/th/plugins/architecture-internals#provider-runtime-hooks) - รายละเอียด hook และตัวอย่างที่บันเดิลมา

## ที่เกี่ยวข้อง

- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [การสร้าง Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
