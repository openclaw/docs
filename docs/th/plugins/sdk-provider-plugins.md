---
read_when:
    - คุณกำลังสร้าง Plugin ผู้ให้บริการโมเดลใหม่
    - คุณต้องการเพิ่มพร็อกซีที่เข้ากันได้กับ OpenAI หรือ LLM แบบกำหนดเองลงใน OpenClaw
    - คุณจำเป็นต้องทำความเข้าใจการยืนยันตัวตนของผู้ให้บริการ แค็ตตาล็อก และฮุกขณะรันไทม์
sidebarTitle: Provider plugins
summary: คู่มือทีละขั้นตอนสำหรับการสร้าง Plugin ผู้ให้บริการโมเดลสำหรับ OpenClaw
title: การสร้าง Plugin ผู้ให้บริการ
x-i18n:
    generated_at: "2026-07-19T07:27:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f68a8581872f89ae8ac3b8660ee71ef9cfab7a5670b1dc68f64027601425a3dc
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

สร้าง Plugin ผู้ให้บริการเพื่อเพิ่มผู้ให้บริการโมเดล (LLM) ให้กับ OpenClaw: แค็ตตาล็อกโมเดล การยืนยันตัวตนด้วยคีย์ API และการแก้ไขโมเดลแบบไดนามิก

<Info>
  หากเพิ่งเริ่มใช้ Plugin ของ OpenClaw โปรดอ่าน [การเริ่มต้นใช้งาน](/th/plugins/building-plugins)
  ก่อน เพื่อทำความเข้าใจโครงสร้างแพ็กเกจและการตั้งค่าไฟล์ manifest
</Info>

<Tip>
  Plugin ผู้ให้บริการจะเพิ่มโมเดลเข้าสู่วงรอบการอนุมานปกติของ OpenClaw หาก
  โมเดลต้องทำงานผ่านดีมอนเอเจนต์แบบเนทีฟที่เป็นเจ้าของเธรด Compaction
  หรือเหตุการณ์ของเครื่องมือ ให้จับคู่ผู้ให้บริการกับ [ชุดควบคุม
  เอเจนต์](/th/plugins/sdk-agent-harness) แทนการใส่รายละเอียดโปรโตคอลของดีมอน
  ไว้ในแกนหลัก
</Tip>

## ขั้นตอนโดยละเอียด

<Steps>
  <Step title="แพ็กเกจและไฟล์ manifest">
    ### ขั้นตอนที่ 1: แพ็กเกจและไฟล์ manifest

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
      "description": "ผู้ให้บริการโมเดล Acme AI",
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
          "choiceLabel": "คีย์ API ของ Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "คีย์ API ของ Acme AI"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    `setup.providers[].envVars` ช่วยให้ OpenClaw ตรวจพบข้อมูลประจำตัวโดยไม่ต้อง
    โหลดรันไทม์ของ Plugin เพิ่ม `providerAuthAliases` เมื่อตัวแปรรูปแบบหนึ่งของผู้ให้บริการ
    ควรใช้การยืนยันตัวตนของรหัสผู้ให้บริการอื่นร่วมกัน `modelSupport` เป็น
    ตัวเลือกเสริมและช่วยให้ OpenClaw โหลด Plugin ผู้ให้บริการของคุณโดยอัตโนมัติจาก
    รหัสโมเดลแบบย่อ เช่น `acme-large` ก่อนที่จะมีฮุกรันไทม์ `openclaw.compat`
    และ `openclaw.build` ใน `package.json` จำเป็นสำหรับการเผยแพร่บน ClawHub
    (`openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`
    เป็นสองฟิลด์ที่จำเป็น ส่วน `minGatewayVersion` จะใช้
    `openclaw.install.minHostVersion` แทนเมื่อละไว้)

  </Step>

  <Step title="ลงทะเบียนผู้ให้บริการ">
    ผู้ให้บริการข้อความขั้นต่ำต้องมี `id`, `label`, `auth` และ `catalog`
    `catalog` คือฮุกรันไทม์/การกำหนดค่าที่ผู้ให้บริการเป็นเจ้าของ โดยสามารถเรียกใช้
    API ของผู้จำหน่ายแบบสดและส่งคืนรายการ `models.providers`

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

    `registerModelCatalogProvider` คือพื้นผิวแค็ตตาล็อกของระนาบควบคุมรุ่นใหม่
    สำหรับ UI รายการ/วิธีใช้/ตัวเลือก ซึ่งครอบคลุมแถว `text`, `voice`, `image_generation`,
    `video_generation` และ `music_generation` ให้เก็บการเรียกปลายทางของผู้จำหน่าย
    และการแมปการตอบกลับไว้ใน Plugin โดย OpenClaw เป็นเจ้าของรูปร่างแถวที่ใช้ร่วมกัน
    ป้ายกำกับแหล่งที่มา และการแสดงผลวิธีใช้

    เพียงเท่านี้ก็ได้ผู้ให้บริการที่ใช้งานได้แล้ว ขณะนี้ผู้ใช้สามารถเรียกใช้
    `openclaw onboard --acme-ai-api-key <key>` และเลือก
    `acme-ai/acme-large` เป็นโมเดลของตนได้

    ### การค้นหาโมเดลแบบสด

    หากผู้ให้บริการของคุณมี API รูปแบบ `/models` ให้เก็บปลายทางเฉพาะของผู้ให้บริการ
    และการฉายแถวไว้ใน Plugin ของคุณ และใช้
    `openclaw/plugin-sdk/provider-catalog-live-runtime` สำหรับวงจรการดึงข้อมูล
    ที่ใช้ร่วมกัน ตัวช่วยนี้มีการดึงข้อมูล HTTP ที่มีการป้องกัน เฮดเดอร์การยืนยันตัวตนของผู้ให้บริการ
    ข้อผิดพลาด HTTP แบบมีโครงสร้าง การแคช TTL และพฤติกรรมการใช้ค่าคงที่สำรอง โดยไม่ต้อง
    ใส่นโยบายของผู้ให้บริการไว้ในแกนหลักของ OpenClaw

    ใช้ `buildLiveModelProviderConfig` เมื่อ API แบบสดแจ้งเพียงว่า
    แถวใดในแค็ตตาล็อกแบบคงที่ที่ผู้ให้บริการเป็นเจ้าของพร้อมใช้งานอยู่ในขณะนี้:

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
    เมทาดาทาที่มีรายละเอียดมากกว่า และ Plugin จำเป็นต้องฉายแถวเป็นคำจำกัดความ
    โมเดลของ OpenClaw ด้วยตนเอง:

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

    `run` ควรถูกจำกัดด้วยการยืนยันตัวตนและส่งคืน `null` เมื่อไม่มีข้อมูลประจำตัว
    ที่ใช้งานได้ ให้มี `staticRun` แบบออฟไลน์หรือค่าคงที่สำรอง เพื่อให้การตั้งค่า เอกสาร
    การทดสอบ และพื้นผิวตัวเลือกไม่ขึ้นอยู่กับการเข้าถึงเครือข่ายแบบสด ใช้ TTL
    ที่เหมาะสมกับความสดใหม่ของรายการโมเดล หลีกเลี่ยงการสำรวจระบบไฟล์ในเวลาที่มีคำขอ
    และส่ง `readRows` / `readModelId` เฉพาะผู้ให้บริการก็ต่อเมื่อ
    การตอบกลับจากต้นทางไม่ได้อยู่ในรูปแบบ `{ data: [{ id, object }] }`
    ที่เข้ากันได้กับ OpenAI

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

    `input` จะเขียนพรอมต์ระบบขั้นสุดท้ายและเนื้อหาข้อความใหม่ก่อน
    การส่งผ่าน ส่วน `output` จะเขียนเดลตาข้อความของผู้ช่วยและข้อความขั้นสุดท้ายใหม่ก่อน
    ที่ OpenClaw จะแยกวิเคราะห์เครื่องหมายควบคุมของตนเองหรือส่งมอบผ่านช่องทาง

    สำหรับผู้ให้บริการที่รวมมากับระบบซึ่งลงทะเบียนผู้ให้บริการข้อความเพียงรายเดียวด้วยการยืนยันตัวตน
    ผ่านคีย์ API พร้อมรันไทม์ที่อิงแค็ตตาล็อกเพียงรายการเดียว ให้เลือกใช้ตัวช่วย
    `defineSingleProviderPluginEntry(...)` ที่มีขอบเขตแคบกว่า:

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

    `buildProvider` คือเส้นทางแค็ตตาล็อกแบบสดที่ใช้เมื่อ OpenClaw สามารถตรวจหา
    การยืนยันตัวตนจริงของผู้ให้บริการได้ โดยอาจดำเนินการค้นหาเฉพาะของผู้ให้บริการ ใช้
    `buildStaticProvider` เฉพาะกับรายการแบบออฟไลน์ที่แสดงได้อย่างปลอดภัยก่อนกำหนดค่า
    การยืนยันตัวตนเท่านั้น โดยต้องไม่ต้องใช้ข้อมูลประจำตัวหรือส่งคำขอผ่านเครือข่าย
    ปัจจุบันการแสดงผล `models list --all` ของ OpenClaw จะเรียกใช้แค็ตตาล็อกแบบคงที่
    เฉพาะสำหรับ Plugin ผู้ให้บริการที่รวมมาให้ โดยใช้การกำหนดค่าว่าง สภาพแวดล้อมว่าง
    และไม่มีเส้นทางของเอเจนต์/เวิร์กสเปซ

    หากขั้นตอนการยืนยันตัวตนต้องแก้ไข `models.providers.*`, นามแฝง และ
    โมเดลเริ่มต้นของเอเจนต์ระหว่างการเริ่มต้นใช้งานด้วย ให้ใช้ตัวช่วยพรีเซ็ตจาก
    `openclaw/plugin-sdk/provider-onboard` ตัวช่วยที่มีขอบเขตแคบที่สุด ได้แก่
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` และ
    `createModelCatalogPresetAppliers(...)`

    เมื่อเอนด์พอยต์เนทีฟของผู้ให้บริการรองรับบล็อกข้อมูลการใช้งานแบบสตรีมบน
    การส่งผ่าน `openai-completions` ตามปกติ ให้เลือกใช้ตัวช่วยแค็ตตาล็อกร่วมใน
    `openclaw/plugin-sdk/provider-catalog-shared` แทนการฮาร์ดโค้ด
    การตรวจสอบรหัสผู้ให้บริการ `supportsNativeStreamingUsageCompat(...)` และ
    `applyProviderNativeStreamingUsageCompat(...)` จะตรวจหาการรองรับจาก
    แผนผังความสามารถของเอนด์พอยต์ ดังนั้นเอนด์พอยต์เนทีฟแบบ Moonshot/DashScope
    จึงยังเลือกเข้าร่วมได้แม้ Plugin จะใช้รหัสผู้ให้บริการแบบกำหนดเอง

    ตัวอย่างการค้นหาแบบสดข้างต้นครอบคลุม API ผู้ให้บริการแบบ `/models` ให้เก็บ
    การค้นหานั้นไว้ภายใน `catalog.run` โดยกำหนดให้ทำงานเมื่อมีการยืนยันตัวตนที่ใช้ได้
    และให้ `staticRun` ไม่ใช้เครือข่ายสำหรับการสร้างแค็ตตาล็อกแบบออฟไลน์

  </Step>

  <Step title="เพิ่มการแก้ไขโมเดลแบบไดนามิก">
    หากผู้ให้บริการยอมรับรหัสโมเดลใดก็ได้ (เช่น พร็อกซีหรือเราเตอร์)
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

    หากการแก้ไขต้องส่งคำขอผ่านเครือข่าย ให้ใช้ `prepareDynamicModel` สำหรับการอุ่นเครื่อง
    แบบอะซิงโครนัส โดย `resolveDynamicModel` จะทำงานอีกครั้งหลังจากเสร็จสิ้น

  </Step>

  <Step title="เพิ่มฮุกสำหรับรันไทม์ (ตามความจำเป็น)">
    ผู้ให้บริการส่วนใหญ่ต้องใช้เพียง `catalog` + `resolveDynamicModel` ให้เพิ่มฮุก
    ทีละส่วนตามที่ผู้ให้บริการต้องการ

    ขณะนี้ตัวสร้างตัวช่วยร่วมครอบคลุมกลุ่มความเข้ากันได้ของการเล่นซ้ำ/เครื่องมือที่พบบ่อยที่สุด
    ดังนั้นโดยปกติ Plugin จึงไม่จำเป็นต้องเชื่อมต่อฮุกแต่ละรายการด้วยตนเองทีละรายการ:

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

    กลุ่มการเล่นซ้ำที่พร้อมใช้งานในปัจจุบัน:

    | กลุ่ม | สิ่งที่เชื่อมต่อให้ | ตัวอย่างที่รวมมาให้ |
    | --- | --- | --- |
    | `openai-compatible` | นโยบายการเล่นซ้ำแบบ OpenAI ร่วมสำหรับการส่งผ่านที่เข้ากันได้กับ OpenAI ซึ่งรวมถึงการปรับรหัสการเรียกเครื่องมือให้ปลอดภัย การแก้ไขลำดับให้ผู้ช่วยอยู่ก่อน และการตรวจสอบเทิร์น Gemini ทั่วไปในกรณีที่การส่งผ่านต้องใช้ | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | นโยบายการเล่นซ้ำที่รับรู้ Claude ซึ่งเลือกโดย `modelId` เพื่อให้การส่งผ่านข้อความ Anthropic ได้รับการล้างบล็อกการคิดเฉพาะของ Claude ก็ต่อเมื่อโมเดลที่แก้ไขแล้วเป็นรหัส Claude จริงเท่านั้น | `amazon-bedrock` |
    | `native-anthropic-by-model` | นโยบาย Claude ตามโมเดลแบบเดียวกับ `anthropic-by-model` พร้อมการปรับรหัสการเรียกเครื่องมือให้ปลอดภัยและการรักษารหัสการใช้เครื่องมือแบบเนทีฟของ Anthropic สำหรับการส่งผ่านที่ต้องเก็บรหัสเนทีฟของผู้จำหน่ายไว้ | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | นโยบายการเล่นซ้ำ Gemini แบบเนทีฟพร้อมการปรับการเล่นซ้ำเริ่มต้นให้ปลอดภัย กลุ่มร่วมจะคง Gemini CLI ที่ส่งออกเป็นข้อความไว้ในโหมดการให้เหตุผลแบบมีแท็ก ส่วนผู้ให้บริการ `google` โดยตรงจะแทนที่ `resolveReasoningOutputMode` เป็น `native` เนื่องจากการคิดของ Gemini API มาถึงในรูปส่วนความคิดแบบเนทีฟ | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | การปรับลายเซ็นความคิดของ Gemini ให้ปลอดภัยสำหรับโมเดล Gemini ที่ทำงานผ่านการส่งผ่านพร็อกซีที่เข้ากันได้กับ OpenAI โดยไม่เปิดใช้การตรวจสอบการเล่นซ้ำ Gemini แบบเนทีฟหรือการเขียนการเริ่มต้นใหม่ | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | นโยบายแบบผสมสำหรับผู้ให้บริการที่รวมพื้นผิวโมเดลข้อความ Anthropic และโมเดลที่เข้ากันได้กับ OpenAI ไว้ใน Plugin เดียว โดยการตัดบล็อกการคิดเฉพาะ Claude ซึ่งเป็นตัวเลือกจะยังจำกัดอยู่เฉพาะฝั่ง Anthropic | `minimax` |

    กลุ่มสตรีมที่พร้อมใช้งานในปัจจุบัน:

    | กลุ่ม | สิ่งที่เชื่อมต่อให้ | ตัวอย่างที่รวมมาให้ |
    | --- | --- | --- |
    | `google-thinking` | การปรับเพย์โหลดการคิดของ Gemini ให้เป็นรูปแบบมาตรฐานบนเส้นทางสตรีมร่วม | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | ตัวครอบการให้เหตุผล Kilo บนเส้นทางสตรีมพร็อกซีร่วม โดย `kilo-auto/balanced` และรหัสการให้เหตุผลของพร็อกซีที่ไม่รองรับจะข้ามการแทรกการคิด | `kilocode` |
    | `moonshot-thinking` | การแมปเพย์โหลดการคิดแบบเนทีฟชนิดไบนารีของ Moonshot จากการกำหนดค่า + ระดับ `/think` | `moonshot` |
    | `minimax-fast-mode` | การเขียนโมเดลโหมดเร็วของ MiniMax ใหม่บนเส้นทางสตรีมร่วม | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | ตัวครอบ Responses แบบเนทีฟของ OpenAI/Codex ที่ใช้ร่วมกัน: ส่วนหัวการระบุแหล่งที่มา, `/fast`/`serviceTier`, ระดับรายละเอียดข้อความ, การค้นหาเว็บแบบเนทีฟของ Codex, การปรับรูปแบบเพย์โหลดให้เข้ากันได้กับการให้เหตุผล และการจัดการบริบทของ Responses | `openai` |
    | `openrouter-thinking` | ตัวครอบการให้เหตุผล OpenRouter สำหรับเส้นทางพร็อกซี โดยจัดการการข้ามสำหรับโมเดลที่ไม่รองรับ/`auto` จากส่วนกลาง | `openrouter` |
    | `tool-stream-default-on` | ตัวครอบ `tool_stream` ที่เปิดใช้โดยค่าเริ่มต้นสำหรับผู้ให้บริการอย่าง Z.AI ซึ่งต้องการสตรีมเครื่องมือ เว้นแต่จะปิดใช้อย่างชัดเจน | `zai` |

    <Accordion title="รอยต่อ SDK ที่ขับเคลื่อนตัวสร้างกลุ่ม">
      ตัวสร้างแต่ละกลุ่มประกอบขึ้นจากตัวช่วยสาธารณะระดับล่างที่ส่งออกจากแพ็กเกจเดียวกัน ซึ่งสามารถเลือกใช้ได้เมื่อผู้ให้บริการต้องออกนอกเหนือรูปแบบทั่วไป:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` และตัวสร้างการเล่นซ้ำโดยตรง (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`) นอกจากนี้ยังส่งออกตัวช่วยการเล่นซ้ำ Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) และตัวช่วยเอนด์พอยต์/โมเดล (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`)
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` พร้อมตัวครอบ OpenAI/Codex ร่วม (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), ตัวครอบ DeepSeek V4 ที่เข้ากันได้กับ OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), การล้างข้อมูลการเติมการคิดล่วงหน้าของ Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), ความเข้ากันได้ของการเรียกเครื่องมือด้วยข้อความธรรมดา (`createPlainTextToolCallCompatWrapper`) และตัวครอบพร็อกซี/ผู้ให้บริการร่วม (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`)
      - `openclaw/plugin-sdk/provider-stream-shared` - ตัวครอบเพย์โหลดและเหตุการณ์แบบน้ำหนักเบาสำหรับเส้นทางผู้ให้บริการที่ใช้งานบ่อย ซึ่งรวมถึง `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` และ `setQwenChatTemplateThinking(...)`
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` และตัวช่วยสคีมาผู้ให้บริการระดับพื้นฐาน

      สำหรับผู้ให้บริการในกลุ่ม Gemini ให้ปรับโหมดผลลัพธ์การให้เหตุผลให้สอดคล้องกับ
      การส่งผ่าน ผู้ให้บริการ Google Gemini API โดยตรงควรใช้ผลลัพธ์การให้เหตุผล
      `native` เพื่อให้ OpenClaw ใช้ส่วนความคิดแบบเนทีฟโดยไม่เพิ่ม
      คำสั่งพรอมต์ `<think>` / `<final>` ส่วนแบ็กเอนด์แบบ
      Gemini CLI ที่ใช้ข้อความเท่านั้นและแยกวิเคราะห์การตอบกลับ JSON/ข้อความสุดท้าย
      สามารถใช้สัญญาแบบมีแท็ก `google-gemini` ร่วมต่อไปได้

      ตัวช่วยสตรีมบางรายการตั้งใจให้คงอยู่ภายในผู้ให้บริการ `@openclaw/anthropic-provider` เก็บ `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` และตัวสร้างตัวครอบ Anthropic ระดับล่างไว้ในรอยต่อสาธารณะ `api.ts` / `contract-api.ts` ของตนเอง เนื่องจากสิ่งเหล่านี้เข้ารหัสการจัดการ Claude OAuth รุ่นเบตาและการควบคุมด้วย `context1m` ในทำนองเดียวกัน Plugin xAI จะเก็บการปรับรูปแบบ Responses แบบเนทีฟของ xAI ไว้ใน `wrapStreamFn` ของตนเอง (นามแฝง `/fast`, ค่าเริ่มต้น `tool_stream`, การล้างเครื่องมือแบบเข้มงวดที่ไม่รองรับ และการนำเพย์โหลดการให้เหตุผลเฉพาะ xAI ออก)

      รูปแบบรากแพ็กเกจเดียวกันยังรองรับ `@openclaw/openai-provider` (ตัวสร้างผู้ให้บริการ ตัวช่วยโมเดลเริ่มต้น ตัวสร้างผู้ให้บริการแบบเรียลไทม์) และ `@openclaw/openrouter-provider` (ตัวสร้างผู้ให้บริการพร้อมตัวช่วยการเริ่มต้นใช้งาน/การกำหนดค่า)
    </Accordion>

    <Tabs>
      <Tab title="การแลกเปลี่ยนโทเค็น">
        สำหรับผู้ให้บริการที่ต้องแลกเปลี่ยนโทเค็นก่อนเรียกการอนุมานแต่ละครั้ง:

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
        สำหรับผู้ให้บริการที่ต้องใช้ส่วนหัวคำขอแบบกำหนดเองหรือแก้ไขเนื้อหาคำขอ:

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
      <Tab title="ข้อมูลประจำตัวของการส่งผ่านแบบเนทีฟ">
        สำหรับผู้ให้บริการที่ต้องใช้ส่วนหัวหรือเมตาดาตาของคำขอ/เซสชันแบบเนทีฟบน
        การส่งผ่าน HTTP หรือ WebSocket ทั่วไป:

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

        `resolveUsageAuth` มีผลลัพธ์สามแบบ ให้ส่งคืน
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` เมื่อ
        ผู้ให้บริการมีข้อมูลประจำตัวสำหรับการใช้งาน/การเรียกเก็บเงิน (ฟิลด์ที่ไม่บังคับใช้ส่งต่อ
        เมทาดาทาของแพ็กเกจที่ไม่เป็นความลับจากโปรไฟล์ที่แก้ไขแล้วไปยัง
        `fetchUsageSnapshot`) ให้ส่งคืน
        `{ handled: true }` เฉพาะเมื่อผู้ให้บริการจัดการการตรวจสอบสิทธิ์สำหรับการใช้งานแล้วอย่างแน่ชัด
        แต่ไม่มีโทเค็นการใช้งานที่ใช้ได้ และ OpenClaw ต้องข้ามการย้อนกลับไปใช้
        คีย์ API/OAuth แบบทั่วไป ให้ส่งคืน `null` หรือ `undefined` เมื่อผู้ให้บริการ
        ไม่ได้จัดการคำขอ และ OpenClaw ควรดำเนินการย้อนกลับแบบทั่วไปต่อ

        ประกาศ ID ผู้ให้บริการใน `contracts.usageProviders` เมื่อมีทั้งสัญญา
        ของแมนิเฟสต์ดังกล่าวและฮุก **ทั้งสองรายการ** OpenClaw จะรวม
        ผู้ให้บริการไว้ในการรวบรวมข้อมูลการใช้งานโดยอัตโนมัติ โดยไม่โหลด Plugin
        ของผู้ให้บริการที่ไม่เกี่ยวข้อง ไม่จำเป็นต้องอัปเดตรายการอนุญาตของคอร์
        `fetchUsageSnapshot` ส่งคืนโครงสร้างที่ใช้ร่วมกันและไม่ขึ้นกับผู้ให้บริการดังนี้:

        - `plan`: ป้ายกำกับการสมัครสมาชิกหรือคีย์ที่ผู้ให้บริการรายงาน
        - `windows`: ช่วงโควตาที่รีเซ็ตได้ในรูปเปอร์เซ็นต์ที่ใช้ไป
        - `billing`: รายการ `balance`, `spend` หรือ `budget` ที่มีชนิดกำกับ; `unit` อาจเป็น
          สกุลเงิน ISO หรือหน่วยของผู้ให้บริการ เช่น `credits`
        - `summary`: บริบทเฉพาะของผู้ให้บริการแบบกระชับที่ไม่เหมาะกับ
          ฟิลด์แบบมีโครงสร้างเหล่านั้น

        รักษาความหมายของสกุลเงินให้ถูกต้องแม่นยำ เครดิตของผู้ให้บริการไม่ใช่ USD เว้นแต่
        สัญญาต้นทางจะระบุไว้เช่นนั้น Plugin ที่ใช้งานเพียง
        `fetchUsageSnapshot` ยังคงพร้อมใช้งานสำหรับผู้เรียกแบบระบุชัด/สังเคราะห์ แต่
        จะไม่ถูกค้นพบโดยอัตโนมัติ เนื่องจาก OpenClaw ไม่สามารถแก้ไขข้อมูลประจำตัวสำหรับการใช้งานของ Plugin นั้นได้
      </Tab>
    </Tabs>

    <Accordion title="ฮุกทั่วไปของผู้ให้บริการ">
      OpenClaw เรียกฮุกสำหรับ Plugin โมเดล/ผู้ให้บริการตามลำดับโดยประมาณดังนี้
      ผู้ให้บริการส่วนใหญ่ใช้เพียง 2-3 รายการ นี่ไม่ใช่สัญญา `ProviderPlugin`
      ฉบับเต็ม โปรดดู [ส่วนภายใน: ฮุกรันไทม์ของ
      ผู้ให้บริการ](/th/plugins/architecture-internals#provider-runtime-hooks) สำหรับ
      รายการฮุกฉบับสมบูรณ์ที่ถูกต้องในปัจจุบันและหมายเหตุเกี่ยวกับการย้อนกลับ
      ฟิลด์ผู้ให้บริการที่มีไว้เพื่อความเข้ากันได้เท่านั้นและ OpenClaw ไม่เรียกใช้อีกต่อไป เช่น
      `ProviderPlugin.capabilities` และ `suppressBuiltInModel` จะไม่แสดงไว้
      ที่นี่

      | ฮุก | ควรใช้เมื่อใด |
      | --- | --- |
      | `catalog` | แค็ตตาล็อกโมเดลหรือค่าเริ่มต้นของ URL ฐาน |
      | `applyConfigDefaults` | ค่าเริ่มต้นส่วนกลางที่ผู้ให้บริการเป็นเจ้าของระหว่างการสร้างคอนฟิก |
      | `normalizeModelId` | ล้างนามแฝง ID โมเดลแบบเก่า/พรีวิวก่อนค้นหา |
      | `normalizeTransport` | ล้าง `api` / `baseUrl` ของตระกูลผู้ให้บริการก่อนประกอบโมเดลแบบทั่วไป |
      | `normalizeConfig` | ปรับคอนฟิก `models.providers.<id>` ให้เป็นมาตรฐาน |
      | `applyNativeStreamingUsageCompat` | เขียนใหม่เพื่อความเข้ากันได้ของการใช้งานแบบสตรีมเนทีฟสำหรับผู้ให้บริการจากคอนฟิก |
      | `resolveConfigApiKey` | แก้ไขการตรวจสอบสิทธิ์ด้วยมาร์กเกอร์สภาพแวดล้อมที่ผู้ให้บริการเป็นเจ้าของ |
      | `resolveSyntheticAuth` | การตรวจสอบสิทธิ์สังเคราะห์แบบโลคัล/โฮสต์เองหรืออิงคอนฟิก |
      | `resolveExternalAuthProfiles` | ซ้อนทับโปรไฟล์การตรวจสอบสิทธิ์ภายนอกที่ผู้ให้บริการเป็นเจ้าของสำหรับข้อมูลประจำตัวที่จัดการโดย CLI/แอป |
      | `shouldDeferSyntheticProfileAuth` | ลดลำดับความสำคัญของตัวยึดตำแหน่งโปรไฟล์สังเคราะห์ที่จัดเก็บไว้ให้อยู่หลังการตรวจสอบสิทธิ์จากสภาพแวดล้อม/คอนฟิก |
      | `resolveDynamicModel` | ยอมรับ ID โมเดลต้นทางแบบกำหนดเอง |
      | `prepareDynamicModel` | ดึงเมทาดาทาแบบอะซิงโครนัสก่อนแก้ไข |
      | `normalizeResolvedModel` | เขียนการขนส่งใหม่ก่อนถึงตัวรัน |
      | `normalizeToolSchemas` | ล้างสคีมาเครื่องมือที่ผู้ให้บริการเป็นเจ้าของก่อนลงทะเบียน |
      | `inspectToolSchemas` | การวินิจฉัยสคีมาเครื่องมือที่ผู้ให้บริการเป็นเจ้าของ |
      | `resolveReasoningOutputMode` | สัญญาเอาต์พุตการให้เหตุผลแบบติดแท็กเทียบกับแบบเนทีฟ |
      | `prepareExtraParams` | พารามิเตอร์คำขอเริ่มต้น |
      | `createStreamFn` | การขนส่ง StreamFn แบบกำหนดเองทั้งหมด |
      | `wrapStreamFn` | ตัวห่อหุ้มส่วนหัว/เนื้อหาแบบกำหนดเองบนเส้นทางสตรีมปกติ |
      | `resolveTransportTurnState` | ส่วนหัว/เมทาดาทาเนทีฟต่อรอบ |
      | `resolveWebSocketSessionPolicy` | ส่วนหัว/ช่วงพักของเซสชัน WS เนทีฟ |
      | `formatApiKey` | รูปแบบโทเค็นรันไทม์แบบกำหนดเอง |
      | `refreshOAuth` | การรีเฟรช OAuth แบบกำหนดเอง |
      | `buildAuthDoctorHint` | คำแนะนำการซ่อมแซมการตรวจสอบสิทธิ์ |
      | `matchesContextOverflowError` | การตรวจจับข้อมูลล้นที่ผู้ให้บริการเป็นเจ้าของ |
      | `classifyFailoverReason` | การจำแนกการจำกัดอัตรา/ภาระเกินที่ผู้ให้บริการเป็นเจ้าของ |
      | `isCacheTtlEligible` | การควบคุม TTL ของแคชพรอมต์ |
      | `buildMissingAuthMessage` | คำแนะนำเมื่อไม่มีการตรวจสอบสิทธิ์แบบกำหนดเอง |
      | `augmentModelCatalog` | แถวสังเคราะห์สำหรับความเข้ากันได้ในอนาคต (เลิกใช้แล้ว - แนะนำ `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | ชุดตัวเลือก `/think` เฉพาะโมเดล |
      | `isBinaryThinking` | ความเข้ากันได้ของการเปิด/ปิดการคิดแบบไบนารี (เลิกใช้แล้ว - แนะนำ `resolveThinkingProfile`) |
      | `supportsXHighThinking` | ความเข้ากันได้ของการรองรับการให้เหตุผล `xhigh` (เลิกใช้แล้ว - แนะนำ `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | ความเข้ากันได้ของนโยบายเริ่มต้น `/think` (เลิกใช้แล้ว - แนะนำ `resolveThinkingProfile`) |
      | `isModernModelRef` | การจับคู่โมเดลแบบไลฟ์/สโมก |
      | `prepareRuntimeAuth` | การแลกเปลี่ยนโทเค็นก่อนการอนุมาน |
      | `resolveUsageAuth` | การแยกวิเคราะห์ข้อมูลประจำตัวสำหรับการใช้งานแบบกำหนดเอง |
      | `fetchUsageSnapshot` | ปลายทางการใช้งานแบบกำหนดเอง |
      | `createEmbeddingProvider` | อะแดปเตอร์การฝังที่ผู้ให้บริการเป็นเจ้าของสำหรับหน่วยความจำ/การค้นหา |
      | `buildReplayPolicy` | นโยบายการเล่นทรานสคริปต์ซ้ำ/Compaction แบบกำหนดเอง |
      | `sanitizeReplayHistory` | การเขียนการเล่นซ้ำเฉพาะผู้ให้บริการใหม่หลังการล้างแบบทั่วไป |
      | `validateReplayTurns` | การตรวจสอบรอบการเล่นซ้ำอย่างเข้มงวดก่อนถึงตัวรันแบบฝังตัว |
      | `onModelSelected` | คอลแบ็กหลังการเลือก (เช่น เทเลเมทรี) |

      หมายเหตุเกี่ยวกับการย้อนกลับของรันไทม์:

      - `normalizeConfig` แก้ไข Plugin เจ้าของหนึ่งรายการต่อ ID ผู้ให้บริการ (ผู้ให้บริการแบบบันเดิลก่อน จากนั้นจึงเป็น Plugin รันไทม์ที่ตรงกัน) และเรียกเฉพาะฮุกนั้น โดยไม่มีการสแกนข้ามผู้ให้บริการรายอื่น ฮุก `normalizeConfig` ของ Google เองเป็นตัวปรับรายการคอนฟิก `google` / `google-vertex` / `google-antigravity` ให้เป็นมาตรฐาน ไม่ใช่การย้อนกลับของคอร์ที่แยกต่างหาก
      - `resolveConfigApiKey` ใช้ฮุกของผู้ให้บริการเมื่อมีการเปิดเผย Amazon Bedrock เก็บการแก้ไขมาร์กเกอร์สภาพแวดล้อม AWS ไว้ใน Plugin ของผู้ให้บริการ ส่วนการตรวจสอบสิทธิ์ของรันไทม์ยังคงใช้เชนเริ่มต้นของ AWS SDK เมื่อกำหนดค่าด้วย `auth: "aws-sdk"`
      - `resolveThinkingProfile(ctx)` รับ `provider`, `modelId` ที่เลือกไว้ คำแนะนำแค็ตตาล็อก `reasoning` ที่ผสานแล้วซึ่งไม่บังคับ และข้อเท็จจริงโมเดล `compat` ที่ผสานแล้วซึ่งไม่บังคับ ใช้ `compat` เพื่อเลือก UI/โปรไฟล์การคิดของผู้ให้บริการเท่านั้น
      - `resolveSystemPromptContribution` ช่วยให้ผู้ให้บริการแทรกคำแนะนำพรอมต์ระบบที่รับรู้แคชสำหรับตระกูลโมเดล ควรใช้แทนฮุก `before_prompt_build` แบบเก่าที่ใช้ทั่วทั้ง Plugin เมื่อพฤติกรรมเป็นของผู้ให้บริการ/ตระกูลโมเดลหนึ่งและควรรักษาการแยกแคชแบบคงที่/ไดนามิก

    </Accordion>

  </Step>

  <Step title="เพิ่มความสามารถพิเศษ (ไม่บังคับ)">
    ### ขั้นตอนที่ 5: เพิ่มความสามารถพิเศษ

    Plugin ของผู้ให้บริการสามารถลงทะเบียนการฝัง เสียงพูด การถอดเสียงแบบเรียลไทม์
    เสียงแบบเรียลไทม์ การทำความเข้าใจสื่อ การสร้างภาพ การสร้างวิดีโอ
    การดึงข้อมูลเว็บ และการค้นหาเว็บควบคู่กับการอนุมานข้อความ OpenClaw จำแนกสิ่งนี้เป็น
    Plugin แบบ **ความสามารถไฮบริด** ซึ่งเป็นรูปแบบที่แนะนำสำหรับ Plugin ของบริษัท
    (หนึ่ง Plugin ต่อผู้จำหน่าย) ดู
    [ส่วนภายใน: ความเป็นเจ้าของความสามารถ](/th/plugins/architecture#capability-ownership-model)

    ลงทะเบียนแต่ละความสามารถภายใน `register(api)` ควบคู่กับการเรียก
    `api.registerProvider(...)` ที่มีอยู่ เลือกเฉพาะแท็บที่ต้องการ:

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
        Plugin ใช้การอ่านเนื้อหาข้อผิดพลาดแบบจำกัดขนาด การแยกวิเคราะห์ข้อผิดพลาด JSON และ
        ส่วนต่อท้าย ID คำขอร่วมกัน
      </Tab>
      <Tab title="การถอดเสียงแบบเรียลไทม์">
        แนะนำให้ใช้ `createRealtimeTranscriptionWebSocketSession(...)` โดยตัวช่วยที่ใช้ร่วมกัน
        จะจัดการการบันทึกพร็อกซี การหน่วงเวลาก่อนเชื่อมต่อใหม่ การฟลัชเมื่อปิด แฮนด์เชก
        ความพร้อม การจัดคิวเสียง และการวินิจฉัยเหตุการณ์ปิด Plugin
        เพียงแมปเหตุการณ์ต้นทางเท่านั้น

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
        รวมถึงการอัปโหลด AAC ที่ต้องใช้ชื่อไฟล์รูปแบบ M4A สำหรับ
        API การถอดเสียงที่เข้ากันได้
      </Tab>
      <Tab title="เสียงแบบเรียลไทม์">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "เสียงเรียลไทม์ของ Acme",
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
            // กำหนดค่านี้เฉพาะเมื่อผู้ให้บริการยอมรับการตอบกลับของเครื่องมือหลายรายการสำหรับ
            // การเรียกหนึ่งครั้ง เช่น การตอบกลับ "กำลังดำเนินการ" ทันที แล้วตามด้วย
            // ผลลัพธ์สุดท้าย
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

        ประกาศ `capabilities` เพื่อให้ `talk.catalog` แสดงโหมด
        การรับส่ง รูปแบบเสียง และแฟล็กฟีเจอร์ที่ถูกต้องแก่ไคลเอนต์ Talk
        บนเบราว์เซอร์และแบบเนทีฟได้ ใช้ `handleBargeIn` เมื่อการรับส่งสามารถตรวจพบว่า
        มนุษย์กำลังขัดจังหวะการเล่นเสียงของผู้ช่วย และผู้ให้บริการรองรับ
        การตัดทอนหรือล้างการตอบกลับเสียงที่ใช้งานอยู่
        `submitToolResult` อาจคืนค่า `void` สำหรับการส่งแบบซิงโครนัส หรือ
        `Promise<void>` สำหรับขอบเขตการเสร็จสิ้นแบบอะซิงโครนัสที่บริดจ์ของผู้ให้บริการ
        สามารถเปิดเผยได้ เซสชันรีเลย์ของ Gateway จะรอ promise ดังกล่าวก่อน
        ยืนยันผลลัพธ์สุดท้ายหรือล้างการรันที่เชื่อมโยง และให้ปฏิเสธ promise เมื่อ
        การส่งล้มเหลว
        กำหนด `supportsToolResultSuppression: false` เมื่อผู้ให้บริการไม่สามารถ
        รองรับ `options.suppressResponse` ได้ จากนั้น OpenClaw จะหลีกเลี่ยงการระงับสำหรับ
        ผลลัพธ์การบังคับปรึกษาและการยกเลิกภายใน และปฏิเสธคำขอผลลัพธ์
        ที่ระงับโดยตรงแทนการเริ่มการตอบกลับโดยไม่แจ้ง
        ผู้ใช้ `createRealtimeVoiceBridgeSession` อาจคืนค่า
        promise จาก `onToolCall` ได้เช่นกัน การ throw แบบซิงโครนัสและการปฏิเสธจะถูกส่ง
        ไปยัง callback `onError` ของเซสชัน
        กำหนด `handlesInputAudioBargeIn` เฉพาะเมื่อ VAD ของผู้ให้บริการยืนยัน
        การขัดจังหวะด้วยการเรียก `onClearAudio("barge-in")` ผู้ให้บริการที่ไม่ระบุ
        แฟล็กนี้จะใช้การตรวจจับสำรองจากเสียงอินพุตภายในของ OpenClaw
      </Tab>
      <Tab title="การทำความเข้าใจสื่อ">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "รูปภาพของ..." }),
          transcribeAudio: async (req) => ({ text: "ข้อความถอดเสียง..." }),
        });
        ```

        ผู้ให้บริการสื่อแบบภายในหรือโฮสต์ด้วยตนเองที่ตั้งใจไม่กำหนดให้ใช้
        ข้อมูลประจำตัว สามารถเปิดเผย `resolveAuth` และคืนค่า `kind: "none"` ได้
        OpenClaw ยังคงใช้ด่านการตรวจสอบสิทธิ์ตามปกติสำหรับผู้ให้บริการที่ไม่ได้
        เลือกใช้โดยชัดแจ้ง ผู้ให้บริการเดิมยังคงอ่าน `req.apiKey` ได้
        ส่วนผู้ให้บริการใหม่ควรเลือกใช้ `req.auth`

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "Plugin local-audio แบบไม่ใช้การตรวจสอบสิทธิ์",
          }),
          transcribeAudio: async (req) => ({ text: "ข้อความถอดเสียง..." }),
        });
        ```
      </Tab>
      <Tab title="การฝังเวกเตอร์">
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

        ประกาศ id เดียวกันใน `contracts.embeddingProviders` นี่คือ
        สัญญาการฝังเวกเตอร์ทั่วไปสำหรับการสร้างเวกเตอร์ที่นำกลับมาใช้ซ้ำได้ รวมถึง
        การค้นหาหน่วยความจำ `registerMemoryEmbeddingProvider(...)` เป็นความเข้ากันได้
        ที่เลิกใช้งานแล้วสำหรับอะแดปเตอร์เฉพาะหน่วยความจำที่มีอยู่
      </Tab>
      <Tab title="การสร้างรูปภาพและวิดีโอ">
        ความสามารถด้านรูปภาพและวิดีโอใช้โครงสร้างที่ **รับรู้โหมด** ผู้ให้บริการ
        รูปภาพประกาศบล็อกความสามารถ `generate` และ `edit` ที่จำเป็น
        ส่วนผู้ให้บริการวิดีโอประกาศ `generate`, `imageToVideo` และ
        `videoToVideo` ฟิลด์รวมแบบแบน เช่น `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` ไม่เพียงพอสำหรับการประกาศ
        การรองรับโหมดแปลงหรือโหมดที่ปิดใช้งานอย่างชัดเจน การสร้างเพลง
        ใช้รูปแบบ `generate` / `edit` เดียวกัน

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "รูปภาพ Acme",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "วิดีโอ Acme",
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

        ผู้ให้บริการทั้งสองประเภทต้องมี `capabilities` ส่วน `edit` และ
        บล็อกการแปลงวิดีโอ (`imageToVideo`, `videoToVideo`) ต้องมี
        แฟล็ก `enabled` ที่ระบุอย่างชัดแจ้งเสมอ

        ใช้ `catalogByModel` เมื่อโหมดหรือความสามารถแบบคงที่ของโมเดลที่ระบุ
        แตกต่างจากค่าเริ่มต้นของผู้ให้บริการ เมทาดาทานี้ช่วยให้
        `video_generate action=list` และแค็ตตาล็อกโมเดลถูกต้องโดยไม่ต้อง
        เรียกโค้ดของผู้ให้บริการ การค้นหาและบังคับใช้ความสามารถ ณ เวลาส่งคำขอ
        ยังคงอยู่ใน `resolveModelCapabilities` และ `generateVideo` และหากเป็นไปได้
        ให้ใช้ค่าคงที่ของความสามารถเดียวกันซ้ำสำหรับทั้งสองเส้นทาง
      </Tab>
      <Tab title="การดึงข้อมูลและค้นหาเว็บ">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "การดึงข้อมูลของ Acme",
          hint: "ดึงหน้าเว็บผ่านแบ็กเอนด์การเรนเดอร์ของ Acme",
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
            description: "ดึงหน้าเว็บผ่านการดึงข้อมูลของ Acme",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "การค้นหาของ Acme",
          hint: "ค้นหาเว็บผ่านแบ็กเอนด์การค้นหาของ Acme",
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
            description: "ค้นหาเว็บผ่านการค้นหาของ Acme",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        ผู้ให้บริการทั้งสองประเภทใช้โครงสร้างการเชื่อมโยงข้อมูลประจำตัวเดียวกัน:
        `hint`, `envVars`, `placeholder`, `signupUrl`, `credentialPath`,
        `getCredentialValue`, `setCredentialValue` และ `createTool`
        ล้วนจำเป็น
      </Tab>
    </Tabs>

  </Step>

  <Step title="ทดสอบ">
    ### ขั้นตอนที่ 6: ทดสอบ

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // ส่งออกออบเจ็กต์การกำหนดค่าผู้ให้บริการจาก index.ts หรือไฟล์เฉพาะ
    import { acmeProvider } from "./provider.js";

    describe("ผู้ให้บริการ acme-ai", () => {
      it("แก้ไขโมเดลแบบไดนามิก", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("คืนค่าแค็ตตาล็อกเมื่อมีคีย์", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("คืนค่าแค็ตตาล็อกเป็น null เมื่อไม่มีคีย์", async () => {
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

`clawhub skill publish <path>` เป็นคำสั่งอีกคำสั่งหนึ่งสำหรับเผยแพร่โฟลเดอร์ Skills
ไม่ใช่แพ็กเกจ Plugin โปรดอย่าใช้ที่นี่

## โครงสร้างไฟล์

```
<bundled-plugin-root>/acme-ai/
├── package.json              # เมทาดาทา openclaw.providers
├── openclaw.plugin.json      # ไฟล์กำกับพร้อมเมทาดาทาการตรวจสอบสิทธิ์ของผู้ให้บริการ
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # การทดสอบ
    └── usage.ts              # ปลายทางการใช้งาน (ไม่บังคับ)
```

## ข้อมูลอ้างอิงลำดับแค็ตตาล็อก

`catalog.order` ควบคุมเวลาที่แค็ตตาล็อกของคุณจะผสานโดยสัมพันธ์กับผู้ให้บริการ
ในตัว:

| ลำดับ     | เมื่อใด          | กรณีใช้งาน                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | รอบแรก    | ผู้ให้บริการที่ใช้ API key แบบทั่วไป                         |
| `profile` | หลังจากแบบง่าย  | ผู้ให้บริการที่จำกัดการเข้าถึงด้วยโปรไฟล์การยืนยันตัวตน                |
| `paired`  | หลังจากโปรไฟล์ | สังเคราะห์รายการที่เกี่ยวข้องหลายรายการ             |
| `late`    | รอบสุดท้าย     | เขียนทับผู้ให้บริการที่มีอยู่ (ชนะเมื่อเกิดการชนกัน) |

## ขั้นตอนถัดไป

- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) - หาก Plugin ของคุณมีช่องทางด้วย
- [รันไทม์ SDK](/th/plugins/sdk-runtime) - ตัวช่วย `api.runtime` (TTS, การค้นหา, เอเจนต์ย่อย)
- [ภาพรวม SDK](/th/plugins/sdk-overview) - ข้อมูลอ้างอิงการนำเข้าพาธย่อยทั้งหมด
- [ส่วนภายในของ Plugin](/th/plugins/architecture-internals#provider-runtime-hooks) - รายละเอียดฮุกและตัวอย่างที่รวมมาให้

## ที่เกี่ยวข้อง

- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [การสร้าง Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
