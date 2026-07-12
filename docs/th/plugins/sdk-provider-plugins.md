---
read_when:
    - คุณกำลังสร้าง Plugin ผู้ให้บริการโมเดลใหม่
    - คุณต้องการเพิ่มพร็อกซีที่เข้ากันได้กับ OpenAI หรือ LLM แบบกำหนดเองลงใน OpenClaw
    - คุณจำเป็นต้องเข้าใจการยืนยันตัวตนของผู้ให้บริการ แค็ตตาล็อก และฮุกขณะรันไทม์
sidebarTitle: Provider plugins
summary: คู่มือทีละขั้นตอนสำหรับการสร้าง Plugin ผู้ให้บริการโมเดลสำหรับ OpenClaw
title: การสร้าง Plugin สำหรับผู้ให้บริการ
x-i18n:
    generated_at: "2026-07-12T16:33:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

สร้าง Plugin ผู้ให้บริการเพื่อเพิ่มผู้ให้บริการโมเดล (LLM) ให้กับ OpenClaw ซึ่งประกอบด้วยแค็ตตาล็อกโมเดล การยืนยันตัวตนด้วยคีย์ API และการแก้ไขโมเดลแบบไดนามิก

<Info>
  หากเพิ่งเริ่มใช้ Plugin ของ OpenClaw โปรดอ่าน [เริ่มต้นใช้งาน](/th/plugins/building-plugins)
  ก่อน เพื่อทำความเข้าใจโครงสร้างแพ็กเกจและการตั้งค่าไฟล์ manifest
</Info>

<Tip>
  Plugin ผู้ให้บริการจะเพิ่มโมเดลเข้าสู่วงจรการอนุมานปกติของ OpenClaw หากโมเดล
  ต้องทำงานผ่านดีมอนเอเจนต์แบบเนทีฟที่จัดการเธรด Compaction
  หรือเหตุการณ์ของเครื่องมือ ให้ใช้ผู้ให้บริการร่วมกับ [ชุดควบคุม
  เอเจนต์](/th/plugins/sdk-agent-harness) แทนการใส่รายละเอียดโปรโตคอลของดีมอนไว้ในแกนหลัก
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

    `setup.providers[].envVars` ช่วยให้ OpenClaw ตรวจพบข้อมูลประจำตัวได้โดยไม่ต้อง
    โหลดรันไทม์ของ Plugin เพิ่ม `providerAuthAliases` เมื่อตัวแปรย่อยของผู้ให้บริการ
    ควรใช้การยืนยันตัวตนของรหัสผู้ให้บริการอื่นซ้ำ `modelSupport` เป็นตัวเลือก
    และช่วยให้ OpenClaw โหลด Plugin ผู้ให้บริการของคุณโดยอัตโนมัติจากรหัสโมเดลแบบย่อ
    เช่น `acme-large` ก่อนที่จะมีฮุกของรันไทม์ ต้องมี `openclaw.compat`
    และ `openclaw.build` ใน `package.json` เพื่อเผยแพร่บน ClawHub
    (`openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`
    เป็นสองฟิลด์ที่จำเป็น ส่วน `minGatewayVersion` จะใช้
    `openclaw.install.minHostVersion` เป็นค่าทดแทนเมื่อไม่ได้ระบุ)

  </Step>

  <Step title="ลงทะเบียนผู้ให้บริการ">
    ผู้ให้บริการข้อความแบบพื้นฐานต้องมี `id`, `label`, `auth` และ `catalog`
    `catalog` คือฮุกของรันไทม์/การกำหนดค่าที่ผู้ให้บริการเป็นเจ้าของ โดยสามารถเรียก API
    ของผู้จำหน่ายแบบสดและส่งคืนรายการ `models.providers`

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

    `registerModelCatalogProvider` คือพื้นผิวแค็ตตาล็อกของระนาบควบคุมรุ่นใหม่กว่า
    สำหรับ UI รายการ/วิธีใช้/ตัวเลือก ซึ่งครอบคลุมแถว `text`, `voice`, `image_generation`,
    `video_generation` และ `music_generation` เก็บการเรียกปลายทางของผู้จำหน่าย
    และการแมปการตอบกลับไว้ใน Plugin ส่วน OpenClaw จะจัดการรูปร่างแถวที่ใช้ร่วมกัน
    ป้ายกำกับแหล่งที่มา และการแสดงผลวิธีใช้

    เพียงเท่านี้ก็ได้ผู้ให้บริการที่ใช้งานได้แล้ว ขณะนี้ผู้ใช้สามารถเรียกใช้
    `openclaw onboard --acme-ai-api-key <key>` และเลือก
    `acme-ai/acme-large` เป็นโมเดลของตนได้

    ### การค้นหาโมเดลแบบสด

    หากผู้ให้บริการของคุณเปิดเผย API รูปแบบ `/models` ให้เก็บปลายทางเฉพาะผู้ให้บริการ
    และการฉายแถวไว้ใน Plugin ของคุณ และใช้
    `openclaw/plugin-sdk/provider-catalog-live-runtime` สำหรับวงจรการดึงข้อมูลที่ใช้ร่วมกัน
    ตัวช่วยนี้มอบการดึงข้อมูลผ่าน HTTP ที่มีการป้องกัน เฮดเดอร์ยืนยันตัวตนของผู้ให้บริการ
    ข้อผิดพลาด HTTP แบบมีโครงสร้าง การแคชแบบ TTL และพฤติกรรมการใช้ข้อมูลคงที่เป็นค่าทดแทน
    โดยไม่ต้องใส่นโยบายของผู้ให้บริการไว้ในแกนหลักของ OpenClaw

    ใช้ `buildLiveModelProviderConfig` เมื่อ API แบบสดแจ้งเพียงว่า
    แถวใดในแค็ตตาล็อกคงที่ที่ผู้ให้บริการเป็นเจ้าของพร้อมใช้งานอยู่ในขณะนี้:

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

    ใช้ `getCachedLiveProviderModelRows` เมื่อ API ของผู้ให้บริการส่งคืนเมตาดาต้า
    ที่สมบูรณ์กว่า และ Plugin จำเป็นต้องฉายแถวเป็นข้อกำหนดโมเดลของ OpenClaw
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

    `run` ควรทำงานเฉพาะเมื่อผ่านการยืนยันตัวตน และส่งคืน `null` เมื่อไม่มีข้อมูลประจำตัว
    ที่ใช้งานได้ ให้คง `staticRun` แบบออฟไลน์หรือข้อมูลคงที่เป็นค่าทดแทนไว้ เพื่อให้การตั้งค่า เอกสาร
    การทดสอบ และพื้นผิวตัวเลือกไม่ต้องพึ่งพาการเข้าถึงเครือข่ายแบบสด ใช้ TTL
    ที่เหมาะสมกับความสดใหม่ของรายการโมเดล หลีกเลี่ยงการสำรวจระบบไฟล์ ณ เวลาที่มีคำขอ
    และส่ง `readRows` / `readModelId` ที่เฉพาะเจาะจงกับผู้ให้บริการเฉพาะเมื่อ
    การตอบกลับจากต้นทางไม่ได้อยู่ในรูปแบบ `{ data: [{ id, object }] }`
    ที่เข้ากันได้กับ OpenAI

    หากผู้ให้บริการต้นทางใช้โทเค็นควบคุมที่ต่างจาก OpenClaw ให้เพิ่มการแปลงข้อความ
    แบบสองทิศทางขนาดเล็ก แทนการแทนที่เส้นทางสตรีม:

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

    `input` จะเขียนพรอมต์ระบบขั้นสุดท้ายและเนื้อหาข้อความใหม่ก่อนการส่งผ่าน
    `output` จะเขียนเดลตาข้อความของผู้ช่วยและข้อความขั้นสุดท้ายใหม่ ก่อนที่
    OpenClaw จะแยกวิเคราะห์เครื่องหมายควบคุมของตนเองหรือส่งมอบผ่านช่องทาง

    สำหรับผู้ให้บริการที่รวมมากับระบบ ซึ่งลงทะเบียนผู้ให้บริการข้อความเพียงรายเดียว
    พร้อมการยืนยันตัวตนด้วยคีย์ API และรันไทม์ที่ใช้แค็ตตาล็อกเพียงรายการเดียว
    ให้เลือกใช้ตัวช่วย `defineSingleProviderPluginEntry(...)` ที่มีขอบเขตแคบกว่า:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "ผู้ให้บริการโมเดล Acme AI",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "คีย์ API ของ Acme AI",
            hint: "คีย์ API จากแดชบอร์ด Acme AI ของคุณ",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "ป้อนคีย์ API ของ Acme AI",
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

    `buildProvider` คือเส้นทางแค็ตตาล็อกแบบสดที่ใช้เมื่อ OpenClaw สามารถระบุข้อมูล
    การยืนยันตัวตนจริงของผู้ให้บริการได้ เส้นทางนี้อาจดำเนินการค้นหาเฉพาะสำหรับผู้ให้บริการ ใช้
    `buildStaticProvider` เฉพาะสำหรับรายการออฟไลน์ที่แสดงได้อย่างปลอดภัยก่อนกำหนดค่า
    การยืนยันตัวตนเท่านั้น โดยต้องไม่ต้องใช้ข้อมูลประจำตัวหรือส่งคำขอผ่านเครือข่าย
    ปัจจุบันการแสดงผล `models list --all` ของ OpenClaw เรียกใช้แค็ตตาล็อกแบบคงที่
    เฉพาะสำหรับ Plugin ผู้ให้บริการที่รวมมาให้ โดยใช้การกำหนดค่าว่าง ตัวแปรสภาพแวดล้อมว่าง และไม่มี
    พาธของเอเจนต์/พื้นที่ทำงาน

    หากโฟลว์การยืนยันตัวตนของคุณต้องแก้ไข `models.providers.*`, นามแฝง และ
    โมเดลเริ่มต้นของเอเจนต์ระหว่างการเริ่มต้นใช้งานด้วย ให้ใช้ตัวช่วยค่าที่ตั้งไว้ล่วงหน้าจาก
    `openclaw/plugin-sdk/provider-onboard` ตัวช่วยที่มีขอบเขตแคบที่สุดคือ
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` และ
    `createModelCatalogPresetAppliers(...)`

    เมื่อเอนด์พอยต์เนทีฟของผู้ให้บริการรองรับบล็อกการใช้งานแบบสตรีมบน
    ทรานสปอร์ต `openai-completions` ปกติ ให้เลือกใช้ตัวช่วยแค็ตตาล็อกร่วมใน
    `openclaw/plugin-sdk/provider-catalog-shared` แทนการฮาร์ดโค้ด
    การตรวจสอบรหัสผู้ให้บริการ `supportsNativeStreamingUsageCompat(...)` และ
    `applyProviderNativeStreamingUsageCompat(...)` จะตรวจหาการรองรับจาก
    แผนผังความสามารถของเอนด์พอยต์ ดังนั้นเอนด์พอยต์เนทีฟแบบ Moonshot/DashScope จึงยัง
    เลือกเข้าร่วมได้ แม้ Plugin จะใช้รหัสผู้ให้บริการแบบกำหนดเอง

    ตัวอย่างการค้นหาแบบสดข้างต้นครอบคลุม API ของผู้ให้บริการในรูปแบบ `/models` ให้เก็บ
    การค้นหานั้นไว้ภายใน `catalog.run` โดยจำกัดให้ทำงานเฉพาะเมื่อมีข้อมูลการยืนยันตัวตนที่ใช้ได้ และทำให้
    `staticRun` ไม่ใช้เครือข่ายสำหรับการสร้างแค็ตตาล็อกออฟไลน์

  </Step>

  <Step title="เพิ่มการระบุโมเดลแบบไดนามิก">
    หากผู้ให้บริการของคุณยอมรับรหัสโมเดลใดก็ได้ (เช่น พร็อกซีหรือเราเตอร์)
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

    หากการระบุต้องเรียกใช้เครือข่าย ให้ใช้ `prepareDynamicModel` สำหรับ
    การเตรียมพร้อมแบบอะซิงโครนัส โดย `resolveDynamicModel` จะทำงานอีกครั้งหลังจากเสร็จสิ้น

  </Step>

  <Step title="เพิ่มฮุกขณะรันไทม์ (ตามความจำเป็น)">
    ผู้ให้บริการส่วนใหญ่ต้องการเพียง `catalog` + `resolveDynamicModel` ให้เพิ่มฮุก
    ทีละส่วนตามที่ผู้ให้บริการของคุณต้องการ

    ขณะนี้ตัวสร้างตัวช่วยร่วมครอบคลุมกลุ่มความเข้ากันได้ของการเล่นซ้ำ/เครื่องมือ
    ที่พบบ่อยที่สุดแล้ว ดังนั้นโดยปกติ Plugin ไม่จำเป็นต้องเชื่อมต่อฮุกแต่ละตัวด้วยตนเองทีละตัว:

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

    กลุ่มการเล่นซ้ำที่ใช้ได้ในปัจจุบัน:

    | กลุ่ม | สิ่งที่เชื่อมต่อให้ | ตัวอย่างที่รวมมาให้ |
    | --- | --- | --- |
    | `openai-compatible` | นโยบายการเล่นซ้ำร่วมในรูปแบบ OpenAI สำหรับทรานสปอร์ตที่เข้ากันได้กับ OpenAI รวมถึงการปรับรหัสการเรียกเครื่องมือให้ถูกต้อง การแก้ไขลำดับให้ผู้ช่วยมาก่อน และการตรวจสอบเทิร์น Gemini ทั่วไปในกรณีที่ทรานสปอร์ตต้องใช้ | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | นโยบายการเล่นซ้ำที่รับรู้ Claude ซึ่งเลือกตาม `modelId` เพื่อให้ทรานสปอร์ตข้อความ Anthropic ได้รับการล้างบล็อกการคิดเฉพาะของ Claude ก็ต่อเมื่อโมเดลที่ระบุได้เป็นรหัส Claude จริงเท่านั้น | `amazon-bedrock` |
    | `native-anthropic-by-model` | นโยบาย Claude ตามโมเดลแบบเดียวกับ `anthropic-by-model` พร้อมการปรับรหัสการเรียกเครื่องมือให้ถูกต้องและการคงรหัสการใช้เครื่องมือเนทีฟของ Anthropic สำหรับทรานสปอร์ตที่ต้องเก็บรหัสเนทีฟของผู้จำหน่ายไว้ | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | นโยบายการเล่นซ้ำเนทีฟของ Gemini พร้อมการปรับการเล่นซ้ำช่วงเริ่มต้นให้ถูกต้อง กลุ่มร่วมจะคง Gemini CLI ที่ส่งออกเป็นข้อความไว้ในการให้เหตุผลแบบมีแท็ก ส่วนผู้ให้บริการ `google` โดยตรงจะแทนที่ `resolveReasoningOutputMode` เป็น `native` เนื่องจากการคิดของ Gemini API มาถึงในรูปส่วนความคิดเนทีฟ | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | การปรับลายเซ็นความคิดของ Gemini ให้ถูกต้องสำหรับโมเดล Gemini ที่ทำงานผ่านทรานสปอร์ตพร็อกซีซึ่งเข้ากันได้กับ OpenAI โดยจะไม่เปิดใช้การตรวจสอบการเล่นซ้ำเนทีฟของ Gemini หรือการเขียนช่วงเริ่มต้นใหม่ | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | นโยบายแบบไฮบริดสำหรับผู้ให้บริการที่รวมพื้นผิวโมเดลข้อความ Anthropic และโมเดลที่เข้ากันได้กับ OpenAI ไว้ใน Plugin เดียว โดยการตัดบล็อกการคิดเฉพาะ Claude ซึ่งเป็นทางเลือกจะยังจำกัดอยู่เฉพาะฝั่ง Anthropic | `minimax` |

    กลุ่มสตรีมที่ใช้ได้ในปัจจุบัน:

    | กลุ่ม | สิ่งที่เชื่อมต่อให้ | ตัวอย่างที่รวมมาให้ |
    | --- | --- | --- |
    | `google-thinking` | การปรับเพย์โหลดการคิดของ Gemini ให้เป็นมาตรฐานบนเส้นทางสตรีมร่วม | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | ตัวห่อการให้เหตุผลของ Kilo บนเส้นทางสตรีมพร็อกซีร่วม โดย `kilo/auto` และรหัสการให้เหตุผลของพร็อกซีที่ไม่รองรับจะข้ามการแทรกการคิด | `kilocode` |
    | `moonshot-thinking` | การแมปเพย์โหลดการคิดเนทีฟแบบไบนารีของ Moonshot จากการกำหนดค่า + ระดับ `/think` | `moonshot` |
    | `minimax-fast-mode` | การเขียนโมเดลโหมดเร็วของ MiniMax ใหม่บนเส้นทางสตรีมร่วม | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | ตัวห่อ Responses เนทีฟร่วมของ OpenAI/Codex ได้แก่ ส่วนหัวการระบุแหล่งที่มา, `/fast`/`serviceTier`, ระดับรายละเอียดข้อความ, การค้นหาเว็บเนทีฟของ Codex, การปรับรูปแบบเพย์โหลดให้เข้ากันได้กับการให้เหตุผล และการจัดการบริบทของ Responses | `openai` |
    | `openrouter-thinking` | ตัวห่อการให้เหตุผลของ OpenRouter สำหรับเส้นทางพร็อกซี โดยจัดการการข้ามโมเดลที่ไม่รองรับ/`auto` จากส่วนกลาง | `openrouter` |
    | `tool-stream-default-on` | ตัวห่อ `tool_stream` ที่เปิดเป็นค่าเริ่มต้นสำหรับผู้ให้บริการอย่าง Z.AI ซึ่งต้องการสตรีมเครื่องมือ เว้นแต่จะปิดไว้อย่างชัดเจน | `zai` |

    <Accordion title="รอยต่อ SDK ที่ขับเคลื่อนตัวสร้างกลุ่ม">
      ตัวสร้างแต่ละกลุ่มประกอบขึ้นจากตัวช่วยสาธารณะระดับล่างที่ส่งออกจากแพ็กเกจเดียวกัน ซึ่งคุณสามารถเลือกใช้ได้เมื่อผู้ให้บริการต้องออกนอกแบบแผนทั่วไป:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` และตัวสร้างการเล่นซ้ำโดยตรง (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`) นอกจากนี้ยังส่งออกตัวช่วยการเล่นซ้ำของ Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) และตัวช่วยเอนด์พอยต์/โมเดล (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`)
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` รวมถึงตัวห่อร่วมของ OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), ตัวห่อ DeepSeek V4 ที่เข้ากันได้กับ OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), การล้างข้อมูลเติมล่วงหน้าสำหรับการคิดของ Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), ความเข้ากันได้ของการเรียกเครื่องมือด้วยข้อความธรรมดา (`createPlainTextToolCallCompatWrapper`) และตัวห่อพร็อกซี/ผู้ให้บริการร่วม (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`)
      - `openclaw/plugin-sdk/provider-stream-shared` - ตัวห่อเพย์โหลดและเหตุการณ์น้ำหนักเบาสำหรับเส้นทางผู้ให้บริการที่ใช้งานบ่อย รวมถึง `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` และ `setQwenChatTemplateThinking(...)`
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` และตัวช่วยสคีมาผู้ให้บริการพื้นฐาน

      สำหรับผู้ให้บริการในกลุ่ม Gemini ให้ทำให้โหมดผลลัพธ์การให้เหตุผลสอดคล้องกับ
      ทรานสปอร์ต ผู้ให้บริการ Google Gemini API โดยตรงควรใช้ผลลัพธ์การให้เหตุผลแบบ `native`
      เพื่อให้ OpenClaw ใช้ส่วนความคิดเนทีฟโดยไม่เพิ่มคำสั่งพรอมต์
      `<think>` / `<final>` ส่วนแบ็กเอนด์ในรูปแบบ Gemini CLI ที่รองรับเฉพาะข้อความ
      และแยกวิเคราะห์การตอบกลับ JSON/ข้อความสุดท้าย สามารถใช้สัญญาแบบมีแท็ก
      `google-gemini` ร่วมต่อไปได้

      ตัวช่วยสตรีมบางรายการตั้งใจให้คงอยู่เฉพาะในผู้ให้บริการ `@openclaw/anthropic-provider` เก็บ `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` และตัวสร้างตัวห่อ Anthropic ระดับล่างไว้ในรอยต่อสาธารณะ `api.ts` / `contract-api.ts` ของตนเอง เนื่องจากรายการเหล่านี้เข้ารหัสการจัดการ OAuth เบต้าของ Claude และการจำกัด `context1m` ในทำนองเดียวกัน Plugin xAI จะเก็บการปรับรูปแบบ Responses เนทีฟของ xAI ไว้ใน `wrapStreamFn` ของตนเอง (`/fast` aliases, ค่าเริ่มต้น `tool_stream`, การล้างเครื่องมือแบบเข้มงวดที่ไม่รองรับ, การนำเพย์โหลดการให้เหตุผลเฉพาะของ xAI ออก)

      รูปแบบรูทแพ็กเกจเดียวกันยังรองรับ `@openclaw/openai-provider` (ตัวสร้างผู้ให้บริการ ตัวช่วยโมเดลเริ่มต้น ตัวสร้างผู้ให้บริการแบบเรียลไทม์) และ `@openclaw/openrouter-provider` (ตัวสร้างผู้ให้บริการพร้อมตัวช่วยการเริ่มต้นใช้งาน/การกำหนดค่า)
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
      <Tab title="ส่วนหัวแบบกำหนดเอง">
        สำหรับผู้ให้บริการที่ต้องใช้ส่วนหัวคำขอแบบกำหนดเองหรือแก้ไขเนื้อหาคำขอ:

        ```typescript
        // wrapStreamFn ส่งคืน StreamFn ที่สร้างจาก ctx.streamFn
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
      <Tab title="อัตลักษณ์ทรานสปอร์ตเนทีฟ">
        สำหรับผู้ให้บริการที่ต้องใช้ส่วนหัวหรือข้อมูลเมตาของคำขอ/เซสชันแบบเนทีฟบน
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

        `resolveUsageAuth` มีผลลัพธ์ที่เป็นไปได้สามแบบ ให้คืนค่า
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` เมื่อ
        ผู้ให้บริการมีข้อมูลประจำตัวสำหรับการใช้งาน/การเรียกเก็บเงิน (ฟิลด์ที่ไม่บังคับจะส่งต่อ
        เมตาดาต้าแผนที่ไม่เป็นความลับจากโปรไฟล์ที่แก้ไขแล้วไปยัง
        `fetchUsageSnapshot`) ให้คืนค่า
        `{ handled: true }` เฉพาะเมื่อผู้ให้บริการจัดการการยืนยันตัวตนสำหรับการใช้งาน
        อย่างเด็ดขาดแล้ว แต่ไม่มีโทเค็นการใช้งานที่ใช้ได้ และ OpenClaw ต้องข้ามการใช้
        API key/OAuth สำรองแบบทั่วไป ให้คืนค่า `null` หรือ `undefined` เมื่อผู้ให้บริการ
        ไม่ได้จัดการคำขอ และ OpenClaw ควรดำเนินการใช้กลไกสำรองแบบทั่วไปต่อไป

        ประกาศรหัสผู้ให้บริการใน `contracts.usageProviders` เมื่อสัญญาในไฟล์กำกับ
        ดังกล่าวและฮุก **ทั้งสองรายการ** มีอยู่ OpenClaw จะรวม
        ผู้ให้บริการไว้ในการรวบรวมข้อมูลการใช้งานโดยอัตโนมัติ โดยไม่โหลด Plugin
        ของผู้ให้บริการอื่นที่ไม่เกี่ยวข้อง ไม่จำเป็นต้องอัปเดตรายการอนุญาตของแกนหลัก
        `fetchUsageSnapshot` คืนค่าในรูปแบบที่ใช้ร่วมกันและไม่ผูกกับผู้ให้บริการ:

        - `plan`: การสมัครสมาชิกหรือป้ายกำกับคีย์ที่ผู้ให้บริการรายงาน
        - `windows`: ช่วงโควตาที่รีเซ็ตได้ในรูปเปอร์เซ็นต์ที่ใช้ไป
        - `billing`: รายการ `balance`, `spend` หรือ `budget` ที่ระบุชนิดแล้ว โดย `unit` อาจเป็น
          สกุลเงินตามมาตรฐาน ISO หรือหน่วยของผู้ให้บริการ เช่น `credits`
        - `summary`: บริบทเฉพาะของผู้ให้บริการแบบกระชับที่ไม่เหมาะกับ
          ฟิลด์แบบมีโครงสร้างเหล่านั้น

        รักษาความหมายของสกุลเงินให้ถูกต้องแม่นยำ เครดิตของผู้ให้บริการไม่ใช่ USD เว้นแต่
        สัญญาต้นทางจะระบุไว้เช่นนั้น Plugin ที่ติดตั้งใช้งานเฉพาะ
        `fetchUsageSnapshot` ยังคงพร้อมใช้งานสำหรับตัวเรียกแบบชัดแจ้ง/สังเคราะห์ แต่
        จะไม่ถูกค้นพบโดยอัตโนมัติ เนื่องจาก OpenClaw ไม่สามารถแก้ไขข้อมูลประจำตัวสำหรับการใช้งานของ Plugin นั้นได้
      </Tab>
    </Tabs>

    <Accordion title="ฮุกทั่วไปของผู้ให้บริการ">
      OpenClaw เรียกฮุกตามลำดับโดยประมาณดังนี้สำหรับ Plugin ของโมเดล/ผู้ให้บริการ
      ผู้ให้บริการส่วนใหญ่ใช้เพียง 2-3 รายการ นี่ไม่ใช่สัญญา `ProviderPlugin`
      ทั้งหมด โปรดดู [ส่วนภายใน: ฮุกรันไทม์ของผู้ให้บริการ
      ](/th/plugins/architecture-internals#provider-runtime-hooks) สำหรับ
      รายการฮุกที่ครบถ้วนและถูกต้องในปัจจุบัน รวมถึงหมายเหตุเกี่ยวกับกลไกสำรอง
      ฟิลด์ของผู้ให้บริการที่มีไว้เพื่อความเข้ากันได้เท่านั้นและ OpenClaw ไม่เรียกใช้อีกต่อไป เช่น
      `ProviderPlugin.capabilities` และ `suppressBuiltInModel` จะไม่แสดงไว้
      ที่นี่

      | ฮุก | ควรใช้เมื่อใด |
      | --- | --- |
      | `catalog` | แค็ตตาล็อกโมเดลหรือค่าเริ่มต้นของ URL ฐาน |
      | `applyConfigDefaults` | ค่าเริ่มต้นส่วนกลางที่ผู้ให้บริการเป็นเจ้าของระหว่างการสร้างการกำหนดค่า |
      | `normalizeModelId` | ล้างนามแฝงรหัสโมเดลแบบเก่า/ตัวอย่างก่อนค้นหา |
      | `normalizeTransport` | ล้าง `api` / `baseUrl` ของตระกูลผู้ให้บริการก่อนประกอบโมเดลทั่วไป |
      | `normalizeConfig` | ปรับการกำหนดค่า `models.providers.<id>` ให้เป็นมาตรฐาน |
      | `applyNativeStreamingUsageCompat` | เขียนการกำหนดค่าใหม่เพื่อรองรับความเข้ากันได้ของการใช้งานแบบสตรีมมิงเนทีฟ |
      | `resolveConfigApiKey` | แก้ไขการยืนยันตัวตนด้วยตัวทำเครื่องหมายตัวแปรสภาพแวดล้อมที่ผู้ให้บริการเป็นเจ้าของ |
      | `resolveSyntheticAuth` | การยืนยันตัวตนสังเคราะห์สำหรับระบบภายใน/โฮสต์เองหรือที่มีการกำหนดค่าเป็นแหล่งข้อมูล |
      | `resolveExternalAuthProfiles` | ซ้อนทับโปรไฟล์การยืนยันตัวตนภายนอกที่ผู้ให้บริการเป็นเจ้าของสำหรับข้อมูลประจำตัวที่จัดการโดย CLI/แอป |
      | `shouldDeferSyntheticProfileAuth` | ลดลำดับความสำคัญของตัวยึดตำแหน่งโปรไฟล์สังเคราะห์ที่จัดเก็บไว้ให้อยู่หลังการยืนยันตัวตนจากสภาพแวดล้อม/การกำหนดค่า |
      | `resolveDynamicModel` | ยอมรับรหัสโมเดลต้นทางใดก็ได้ |
      | `prepareDynamicModel` | ดึงเมตาดาต้าแบบอะซิงโครนัสก่อนแก้ไข |
      | `normalizeResolvedModel` | เขียนการขนส่งใหม่ก่อนส่งให้ตัวรัน |
      | `normalizeToolSchemas` | ล้างสคีมาเครื่องมือที่ผู้ให้บริการเป็นเจ้าของก่อนลงทะเบียน |
      | `inspectToolSchemas` | วินิจฉัยสคีมาเครื่องมือที่ผู้ให้บริการเป็นเจ้าของ |
      | `resolveReasoningOutputMode` | สัญญาเอาต์พุตการใช้เหตุผลแบบติดแท็กเทียบกับแบบเนทีฟ |
      | `prepareExtraParams` | พารามิเตอร์คำขอเริ่มต้น |
      | `createStreamFn` | การขนส่ง StreamFn แบบกำหนดเองทั้งหมด |
      | `wrapStreamFn` | ตัวห่อส่วนหัว/เนื้อหาแบบกำหนดเองบนเส้นทางสตรีมปกติ |
      | `resolveTransportTurnState` | ส่วนหัว/เมตาดาต้าเนทีฟต่อรอบ |
      | `resolveWebSocketSessionPolicy` | ส่วนหัว/ช่วงพักของเซสชัน WS แบบเนทีฟ |
      | `formatApiKey` | รูปแบบโทเค็นรันไทม์แบบกำหนดเอง |
      | `refreshOAuth` | การรีเฟรช OAuth แบบกำหนดเอง |
      | `buildAuthDoctorHint` | คำแนะนำในการซ่อมแซมการยืนยันตัวตน |
      | `matchesContextOverflowError` | การตรวจจับบริบทล้นที่ผู้ให้บริการเป็นเจ้าของ |
      | `classifyFailoverReason` | การจำแนกการจำกัดอัตรา/ภาระเกินที่ผู้ให้บริการเป็นเจ้าของ |
      | `isCacheTtlEligible` | การควบคุม TTL ของแคชพรอมป์ |
      | `buildMissingAuthMessage` | คำแนะนำแบบกำหนดเองเมื่อขาดการยืนยันตัวตน |
      | `augmentModelCatalog` | แถวสังเคราะห์เพื่อความเข้ากันได้ในอนาคต (เลิกใช้แล้ว โปรดใช้ `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | ชุดตัวเลือก `/think` เฉพาะโมเดล |
      | `isBinaryThinking` | ความเข้ากันได้ของการเปิด/ปิดการคิดแบบไบนารี (เลิกใช้แล้ว โปรดใช้ `resolveThinkingProfile`) |
      | `supportsXHighThinking` | ความเข้ากันได้กับการรองรับการใช้เหตุผลระดับ `xhigh` (เลิกใช้แล้ว โปรดใช้ `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | ความเข้ากันได้กับนโยบาย `/think` เริ่มต้น (เลิกใช้แล้ว โปรดใช้ `resolveThinkingProfile`) |
      | `isModernModelRef` | การจับคู่โมเดลสำหรับการทดสอบจริง/การทดสอบเบื้องต้น |
      | `prepareRuntimeAuth` | การแลกเปลี่ยนโทเค็นก่อนอนุมาน |
      | `resolveUsageAuth` | การแยกวิเคราะห์ข้อมูลประจำตัวสำหรับการใช้งานแบบกำหนดเอง |
      | `fetchUsageSnapshot` | ปลายทางการใช้งานแบบกำหนดเอง |
      | `createEmbeddingProvider` | อะแดปเตอร์การฝังข้อมูลที่ผู้ให้บริการเป็นเจ้าของสำหรับหน่วยความจำ/การค้นหา |
      | `buildReplayPolicy` | นโยบายการเล่นซ้ำทรานสคริปต์/Compaction แบบกำหนดเอง |
      | `sanitizeReplayHistory` | การเขียนประวัติการเล่นซ้ำใหม่เฉพาะผู้ให้บริการหลังการล้างทั่วไป |
      | `validateReplayTurns` | การตรวจสอบรอบการเล่นซ้ำอย่างเข้มงวดก่อนตัวรันแบบฝัง |
      | `onModelSelected` | คอลแบ็กหลังเลือก (เช่น การวัดและส่งข้อมูลทางไกล) |

      หมายเหตุเกี่ยวกับกลไกสำรองของรันไทม์:

      - `normalizeConfig` แก้ไข Plugin เจ้าของหนึ่งรายการต่อรหัสผู้ให้บริการ (ผู้ให้บริการที่มาพร้อมระบบก่อน จากนั้นจึงเป็น Plugin รันไทม์ที่ตรงกัน) และเรียกเฉพาะฮุกนั้น โดยไม่มีการสแกนผู้ให้บริการรายอื่น ฮุก `normalizeConfig` ของ Google เองเป็นตัวปรับรายการกำหนดค่า `google` / `google-vertex` / `google-antigravity` ให้เป็นมาตรฐาน ไม่ใช่กลไกสำรองแยกต่างหากของแกนหลัก
      - `resolveConfigApiKey` ใช้ฮุกของผู้ให้บริการเมื่อมีการเปิดเผย Amazon Bedrock เก็บการแก้ไขตัวทำเครื่องหมายตัวแปรสภาพแวดล้อม AWS ไว้ใน Plugin ของผู้ให้บริการ ส่วนการยืนยันตัวตนของรันไทม์ยังคงใช้สายโซ่เริ่มต้นของ AWS SDK เมื่อกำหนดค่าด้วย `auth: "aws-sdk"`
      - `resolveThinkingProfile(ctx)` รับ `provider`, `modelId` ที่เลือก คำแนะนำแค็ตตาล็อก `reasoning` ที่ผสานแล้วซึ่งเป็นตัวเลือก และข้อเท็จจริง `compat` ของโมเดลที่ผสานแล้วซึ่งเป็นตัวเลือก ใช้ `compat` เพื่อเลือก UI/โปรไฟล์การคิดของผู้ให้บริการเท่านั้น
      - `resolveSystemPromptContribution` ช่วยให้ผู้ให้บริการแทรกคำแนะนำพรอมป์ระบบที่รับรู้แคชสำหรับตระกูลโมเดลได้ ควรใช้แทนฮุก `before_prompt_build` แบบเก่าที่ใช้กับทั้ง Plugin เมื่อพฤติกรรมนั้นเป็นของผู้ให้บริการ/ตระกูลโมเดลหนึ่งราย และควรรักษาการแบ่งแคชแบบคงที่/ไดนามิกไว้

    </Accordion>

  </Step>

  <Step title="เพิ่มความสามารถเสริม (ไม่บังคับ)">
    ### ขั้นตอนที่ 5: เพิ่มความสามารถเสริม

    Plugin ของผู้ให้บริการสามารถลงทะเบียนการฝังข้อมูล เสียงพูด การถอดเสียงแบบเรียลไทม์
    เสียงแบบเรียลไทม์ การทำความเข้าใจสื่อ การสร้างภาพ การสร้างวิดีโอ
    การดึงข้อมูลจากเว็บ และการค้นหาเว็บควบคู่กับการอนุมานข้อความ OpenClaw จัดประเภทนี้เป็น
    Plugin แบบ **ความสามารถผสม** ซึ่งเป็นรูปแบบที่แนะนำสำหรับ Plugin ของบริษัท
    (หนึ่ง Plugin ต่อผู้จำหน่าย) โปรดดู
    [ส่วนภายใน: ความเป็นเจ้าของความสามารถ](/th/plugins/architecture#capability-ownership-model)

    ลงทะเบียนแต่ละความสามารถภายใน `register(api)` ควบคู่กับการเรียก
    `api.registerProvider(...)` ที่มีอยู่ เลือกเฉพาะแท็บที่คุณต้องการ:

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
        ส่วนต่อท้ายรหัสคำขอร่วมกัน
      </Tab>
      <Tab title="การถอดเสียงแบบเรียลไทม์">
        ควรใช้ `createRealtimeTranscriptionWebSocketSession(...)` โดยตัวช่วยที่ใช้ร่วมกัน
        จะจัดการการบันทึกพร็อกซี การหน่วงเวลาลองเชื่อมต่อใหม่ การระบายข้อมูลเมื่อปิด การจับมือ
        เพื่อระบุความพร้อม การจัดคิวเสียง และการวินิจฉัยเหตุการณ์ปิด Plugin ของคุณ
        มีหน้าที่เพียงแมปเหตุการณ์ต้นทาง

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
        `openclaw/plugin-sdk/provider-http` ตัวช่วยนี้ปรับชื่อไฟล์ที่อัปโหลดให้เป็นมาตรฐาน
        รวมถึงไฟล์ AAC ที่ต้องใช้ชื่อไฟล์ในรูปแบบ M4A เพื่อให้ทำงานร่วมกับ
        API การถอดเสียงที่รองรับ
      </Tab>
      <Tab title="เสียงแบบเรียลไทม์">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
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
            // ตั้งค่านี้เฉพาะเมื่อผู้ให้บริการยอมรับผลตอบกลับจากเครื่องมือหลายรายการสำหรับ
            // การเรียกหนึ่งครั้ง เช่น ผลตอบกลับ "กำลังดำเนินการ" ทันที แล้วตามด้วย
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

        ประกาศ `capabilities` เพื่อให้ `talk.catalog` เปิดเผยโหมด
        การขนส่ง รูปแบบเสียง และแฟล็กคุณลักษณะที่ใช้ได้แก่ไคลเอนต์ Talk
        บนเบราว์เซอร์และแบบเนทีฟ ใช้งาน `handleBargeIn` เมื่อการขนส่งตรวจพบได้ว่า
        มนุษย์กำลังขัดจังหวะการเล่นเสียงของผู้ช่วย และผู้ให้บริการรองรับ
        การตัดทอนหรือล้างผลตอบกลับเสียงที่กำลังใช้งานอยู่
        `submitToolResult` อาจคืนค่า `void` สำหรับการส่งแบบซิงโครนัส หรือ
        `Promise<void>` สำหรับขอบเขตการเสร็จสิ้นแบบอะซิงโครนัสที่บริดจ์ของผู้ให้บริการ
        สามารถเปิดเผยได้ เซสชันรีเลย์ของ Gateway จะรอพรอมิสนี้ก่อน
        ยืนยันผลลัพธ์สุดท้ายหรือล้างการทำงานที่เชื่อมโยงไว้ และให้ปฏิเสธพรอมิสเมื่อ
        การส่งล้มเหลว
        ตั้งค่า `supportsToolResultSuppression: false` เมื่อผู้ให้บริการไม่สามารถ
        ปฏิบัติตาม `options.suppressResponse` จากนั้น OpenClaw จะหลีกเลี่ยงการระงับ
        สำหรับผลลัพธ์การบังคับให้ปรึกษาและการยกเลิกภายใน และปฏิเสธคำขอผลลัพธ์
        แบบระงับโดยตรงแทนที่จะเริ่มผลตอบกลับโดยไม่มีการแจ้ง
        ผู้ใช้ `createRealtimeVoiceBridgeSession` สามารถคืนพรอมิสจาก
        `onToolCall` ได้เช่นกัน การโยนข้อผิดพลาดแบบซิงโครนัสและการปฏิเสธพรอมิสจะถูกส่งต่อ
        ไปยังคอลแบ็ก `onError` ของเซสชัน
        ตั้งค่า `handlesInputAudioBargeIn` เฉพาะเมื่อ VAD ของผู้ให้บริการยืนยัน
        การขัดจังหวะด้วยการเรียก `onClearAudio("barge-in")` ผู้ให้บริการที่ไม่ระบุ
        แฟล็กนี้จะใช้การตรวจจับสำรองจากเสียงขาเข้าภายในเครื่องของ OpenClaw
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

        ผู้ให้บริการสื่อภายในเครื่องหรือที่โฮสต์เองซึ่งตั้งใจไม่กำหนดให้ใช้
        ข้อมูลประจำตัว สามารถเปิดเผย `resolveAuth` และคืนค่า `kind: "none"`
        OpenClaw ยังคงใช้ด่านตรวจสอบสิทธิ์ตามปกติสำหรับผู้ให้บริการที่ไม่ได้
        เลือกใช้โดยชัดแจ้ง ผู้ให้บริการที่มีอยู่สามารถอ่าน `req.apiKey` ต่อไปได้
        ส่วนผู้ให้บริการใหม่ควรเลือกใช้ `req.auth`

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
      <Tab title="เวกเตอร์ฝัง">
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
        สัญญาเวกเตอร์ฝังทั่วไปสำหรับการสร้างเวกเตอร์ที่นำกลับมาใช้ใหม่ได้ รวมถึง
        การค้นหาหน่วยความจำ `registerMemoryEmbeddingProvider(...)` เป็น
        ความเข้ากันได้ที่เลิกแนะนำให้ใช้แล้วสำหรับอะแดปเตอร์เฉพาะหน่วยความจำที่มีอยู่
      </Tab>
      <Tab title="การสร้างภาพและวิดีโอ">
        ความสามารถด้านภาพและวิดีโอใช้โครงสร้างที่ **รับรู้โหมด** ผู้ให้บริการ
        ภาพประกาศบล็อกความสามารถ `generate` และ `edit` ที่จำเป็น
        ส่วนผู้ให้บริการวิดีโอประกาศ `generate`, `imageToVideo` และ
        `videoToVideo` ฟิลด์รวมแบบแบน เช่น `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` ไม่เพียงพอสำหรับการประกาศ
        การรองรับโหมดการแปลงหรือโหมดที่ปิดใช้งานอย่างชัดเจน การสร้างเพลง
        ใช้รูปแบบ `generate` / `edit` เดียวกัน

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
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
        แฟล็ก `enabled` ที่ระบุชัดเจนเสมอ

        ใช้ `catalogByModel` เมื่อโหมดหรือความสามารถแบบคงที่ของโมเดลที่ระบุ
        แตกต่างจากค่าเริ่มต้นของผู้ให้บริการ เมทาดาทานี้ช่วยให้
        `video_generate action=list` และแค็ตตาล็อกโมเดลมีความถูกต้องโดยไม่ต้อง
        เรียกใช้โค้ดของผู้ให้บริการ การค้นหาและบังคับใช้ความสามารถ ณ เวลาที่รับคำขอ
        ยังคงเป็นหน้าที่ของ `resolveModelCapabilities` และ `generateVideo` และควรใช้
        ค่าคงที่ของความสามารถเดียวกันซ้ำสำหรับทั้งสองเส้นทางเมื่อทำได้
      </Tab>
      <Tab title="การดึงข้อมูลและค้นหาเว็บ">
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
          hint: "Search the web through Acme's search backend.",
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
            description: "Search the web through Acme Search.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        ผู้ให้บริการทั้งสองประเภทใช้โครงสร้างการเชื่อมต่อข้อมูลประจำตัวแบบเดียวกัน:
        `hint`, `envVars`, `placeholder`, `signupUrl`, `credentialPath`,
        `getCredentialValue`, `setCredentialValue` และ `createTool`
        ล้วนจำเป็นทั้งหมด
      </Tab>
    </Tabs>

  </Step>

  <Step title="ทดสอบ">
    ### ขั้นตอนที่ 6: ทดสอบ

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // ส่งออกออบเจ็กต์การกำหนดค่าผู้ให้บริการจาก index.ts หรือไฟล์เฉพาะ
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

`clawhub skill publish <path>` เป็นคำสั่งอีกคำสั่งหนึ่งสำหรับเผยแพร่โฟลเดอร์ Skills
ไม่ใช่แพ็กเกจ Plugin ดังนั้นอย่าใช้คำสั่งนี้ที่นี่

## โครงสร้างไฟล์

```
<bundled-plugin-root>/acme-ai/
├── package.json              # เมทาดาทา openclaw.providers
├── openclaw.plugin.json      # แมนิเฟสต์พร้อมเมทาดาทาการตรวจสอบสิทธิ์ของผู้ให้บริการ
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # การทดสอบ
    └── usage.ts              # ปลายทางการใช้งาน (ไม่บังคับ)
```

## ข้อมูลอ้างอิงลำดับแค็ตตาล็อก

`catalog.order` ควบคุมจังหวะที่แค็ตตาล็อกของคุณจะผสานเมื่อเทียบกับผู้ให้บริการ
ในตัว:

| ลำดับ    | เมื่อใด          | กรณีการใช้งาน                                             |
| --------- | --------------- | ---------------------------------------------------------- |
| `simple`  | รอบแรก          | ผู้ให้บริการที่ใช้คีย์ API แบบทั่วไป                       |
| `profile` | หลัง simple     | ผู้ให้บริการที่จำกัดการเข้าถึงตามโปรไฟล์การยืนยันตัวตน    |
| `paired`  | หลัง profile    | สร้างรายการที่เกี่ยวข้องกันหลายรายการ                     |
| `late`    | รอบสุดท้าย      | แทนที่ผู้ให้บริการที่มีอยู่ (ชนะเมื่อเกิดการชนกัน)         |

## ขั้นตอนถัดไป

- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) - หาก Plugin ของคุณมีช่องทางด้วย
- [รันไทม์ SDK](/th/plugins/sdk-runtime) - ตัวช่วย `api.runtime` (TTS, การค้นหา, เอเจนต์ย่อย)
- [ภาพรวม SDK](/th/plugins/sdk-overview) - ข้อมูลอ้างอิงฉบับเต็มสำหรับการนำเข้าจากพาธย่อย
- [ส่วนภายในของ Plugin](/th/plugins/architecture-internals#provider-runtime-hooks) - รายละเอียดฮุกและตัวอย่างที่รวมมาให้

## เนื้อหาที่เกี่ยวข้อง

- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [การสร้าง Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
