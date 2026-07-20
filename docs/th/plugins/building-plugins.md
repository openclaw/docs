---
doc-schema-version: 1
read_when:
    - คุณต้องการสร้าง Plugin ใหม่สำหรับ OpenClaw
    - คุณต้องการคู่มือเริ่มต้นอย่างรวดเร็วสำหรับการพัฒนา Plugin
    - คุณกำลังเลือกระหว่างเอกสารเกี่ยวกับช่องทาง ผู้ให้บริการ แบ็กเอนด์ CLI เครื่องมือ หรือฮุก
sidebarTitle: Getting Started
summary: สร้าง Plugin แรกสำหรับ OpenClaw ของคุณได้ภายในไม่กี่นาที
title: การสร้าง Plugin
x-i18n:
    generated_at: "2026-07-20T06:03:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b2dbf37b2b1c62dd0079ad1db5f8a09b1572b5a6fcc61ae798a7f053dcc1aff1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin ช่วยขยายความสามารถของ OpenClaw โดยไม่ต้องเปลี่ยนแปลงแกนหลัก Plugin สามารถเพิ่มช่องทาง
การรับส่งข้อความ ผู้ให้บริการโมเดล แบ็กเอนด์ CLI ภายในเครื่อง เครื่องมือเอเจนต์ ฮุก ผู้ให้บริการสื่อ
หรือความสามารถอื่นที่ Plugin เป็นเจ้าของ

คุณไม่จำเป็นต้องเพิ่ม Plugin ภายนอกลงในที่เก็บ OpenClaw ให้เผยแพร่
แพ็กเกจไปยัง [ClawHub](/th/clawhub) แล้วผู้ใช้ติดตั้งด้วย:

```bash
openclaw plugins install clawhub:<package-name>
```

ข้อกำหนดแพ็กเกจแบบไม่มีคำนำหน้ายังคงติดตั้งจาก npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัว ใช้คำนำหน้า
`clawhub:` เมื่อต้องการให้แก้ไขแพ็กเกจผ่าน ClawHub

## ข้อกำหนด

- Node 22.22.3+, Node 24.15+ หรือ Node 25.9+ และ `npm` หรือ `pnpm`
- โมดูล TypeScript ESM
- สำหรับงาน Plugin แบบรวมมากับที่เก็บ ให้โคลนที่เก็บและเรียกใช้ `pnpm install`
  การพัฒนา Plugin จากซอร์สที่เช็กเอาต์รองรับเฉพาะ pnpm เนื่องจาก OpenClaw ค้นพบ
  Plugin แบบรวมมาจากแพ็กเกจเวิร์กสเปซ `extensions/*`

## เลือกรูปแบบ Plugin

<CardGroup cols={2}>
  <Card title="Plugin ช่องทาง" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    เชื่อมต่อ OpenClaw กับแพลตฟอร์มรับส่งข้อความ
  </Card>
  <Card title="Plugin ผู้ให้บริการ" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    เพิ่มผู้ให้บริการโมเดล สื่อ การค้นหา การดึงข้อมูล เสียงพูด หรือแบบเรียลไทม์
  </Card>
  <Card title="Plugin แบ็กเอนด์ CLI" icon="terminal" href="/th/plugins/cli-backend-plugins">
    เรียกใช้ CLI AI ภายในเครื่องผ่านกลไกสำรองโมเดลของ OpenClaw
  </Card>
  <Card title="Plugin เครื่องมือ" icon="wrench" href="/th/plugins/tool-plugins">
    ลงทะเบียนเครื่องมือเอเจนต์
  </Card>
</CardGroup>

## เริ่มต้นอย่างรวดเร็ว

สร้าง Plugin เครื่องมือขั้นต่ำโดยลงทะเบียนเครื่องมือเอเจนต์ที่จำเป็นหนึ่งรายการ นี่คือ
รูปแบบ Plugin ที่สั้นที่สุดซึ่งใช้งานได้จริง และครอบคลุมแพ็กเกจ ไฟล์กำกับ จุดเข้าใช้งาน และ
การพิสูจน์ภายในเครื่อง

<Steps>
  <Step title="สร้างข้อมูลเมตาของแพ็กเกจ">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
  "openclaw": {
    "extensions": ["./index.ts"],
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
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds a custom tool to OpenClaw",
  "contracts": {
    "tools": ["my_tool"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

    </CodeGroup>

    Plugin ภายนอกที่เผยแพร่ควรระบุจุดเข้ารันไทม์ไปยังไฟล์ JavaScript
    ที่บิลด์แล้ว โปรดดูสัญญาจุดเข้าใช้งานฉบับเต็มที่ [จุดเข้าใช้งาน SDK](/th/plugins/sdk-entrypoints)

    Plugin ทุกตัวต้องมีไฟล์กำกับ แม้ไม่มีการกำหนดค่าก็ตาม เครื่องมือรันไทม์ต้อง
    ปรากฏใน `contracts.tools` เพื่อให้ OpenClaw ค้นพบผู้เป็นเจ้าของได้โดยไม่ต้อง
    โหลดรันไทม์ของ Plugin ทุกตัวล่วงหน้า กำหนด `activation.onStartup`
    อย่างตั้งใจ ตัวอย่างนี้จะโหลดเมื่อ Gateway เริ่มทำงาน

    พื้นผิว Plugin ที่โฮสต์ไว้วางใจก็ถูกควบคุมด้วยไฟล์กำกับเช่นกัน และ Plugin
    ที่ติดตั้งต้องประกาศอย่างชัดเจน: `api.registerAgentToolResultMiddleware(...)`
    ต้องมีรันไทม์เป้าหมายแต่ละรายการอยู่ใน `contracts.agentToolResultMiddleware`
    และ `api.registerTrustedToolPolicy(...)` ต้องมีรหัสนโยบายแต่ละรายการอยู่ใน
    `contracts.trustedToolPolicies` การประกาศเหล่านี้ทำให้การตรวจสอบขณะติดตั้ง
    และการลงทะเบียนรันไทม์สอดคล้องกัน

    ดูข้อมูลทุกฟิลด์ของไฟล์กำกับได้ที่ [ไฟล์กำกับ Plugin](/th/plugins/manifest)

  </Step>

  <Step title="ลงทะเบียนเครื่องมือ">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          outputSchema: Type.Object(
            { input: Type.String() },
            { additionalProperties: false },
          ),
          async execute(_id, params) {
            const details = { input: params.input };
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
              details,
            };
          },
        });
      },
    });
    ```

    ใช้ `definePluginEntry` สำหรับ Plugin ที่ไม่ใช่ช่องทาง ส่วน Plugin ช่องทางให้ใช้
    `defineChannelPluginEntry` จาก `openclaw/plugin-sdk/core` แทน

  </Step>

  <Step title="ทดสอบรันไทม์">
    สำหรับ Plugin ที่ติดตั้งแล้วหรือ Plugin ภายนอก ให้ตรวจสอบรันไทม์ที่โหลด:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    หาก Plugin ลงทะเบียนคำสั่ง CLI ให้เรียกใช้คำสั่งนั้นด้วยและยืนยัน
    เอาต์พุต เช่น `openclaw demo-plugin ping`

    สำหรับ Plugin แบบรวมในที่เก็บนี้ OpenClaw จะค้นพบแพ็กเกจ Plugin
    จากซอร์สที่เช็กเอาต์ในเวิร์กสเปซ `extensions/*` ให้เรียกใช้การทดสอบแบบเจาะจงที่ใกล้เคียงที่สุด:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="ทดสอบการติดตั้งแพ็กเกจ">
    ก่อนเผยแพร่ Plugin ที่พร้อมจัดเป็นแพ็กเกจ ให้ทดสอบด้วยรูปแบบการติดตั้งเดียวกับที่ผู้ใช้
    จะได้รับ ขั้นแรกให้เพิ่มขั้นตอนการบิลด์ ระบุจุดเข้ารันไทม์ เช่น
    `openclaw.extensions` ไปยัง JavaScript ที่บิลด์แล้ว เช่น `./dist/index.js` และตรวจสอบว่า
    `npm pack` รวมเอาต์พุต `dist/` นั้นไว้ จุดเข้าซอร์ส TypeScript ใช้ได้
    เฉพาะกับซอร์สที่เช็กเอาต์และเส้นทางการพัฒนาภายในเครื่องเท่านั้น

    จากนั้นแพ็ก Plugin และติดตั้ง tarball ด้วย `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` ใช้โปรเจกต์ npm ต่อ Plugin ที่ OpenClaw จัดการ จึงตรวจพบ
    ข้อผิดพลาดของการพึ่งพารันไทม์ที่การทดสอบจากซอร์สที่เช็กเอาต์อาจซ่อนไว้ วิธีนี้พิสูจน์
    รูปแบบแพ็กเกจและการพึ่งพา ไม่ใช่สถานะความไว้วางใจอย่างเป็นทางการที่เชื่อมโยงกับแค็ตตาล็อก
    การนำเข้ารันไทม์ต้องอยู่ใน `dependencies` หรือ `optionalDependencies`;
    การพึ่งพาที่เหลืออยู่เฉพาะใน `devDependencies` จะไม่ถูกติดตั้งสำหรับ
    โปรเจกต์รันไทม์ที่มีการจัดการ

    อย่าใช้การติดตั้งจากไฟล์เก็บถาวรหรือเส้นทางโดยตรงเป็นหลักฐานขั้นสุดท้ายสำหรับพฤติกรรม
    ของ Plugin อย่างเป็นทางการหรือที่มีสิทธิ์พิเศษ ซอร์สดิบมีประโยชน์สำหรับการดีบักภายในเครื่อง แต่
    ไม่ได้พิสูจน์เส้นทางการพึ่งพาแบบเดียวกับการติดตั้งผ่าน npm หรือ ClawHub หาก
    Plugin ของคุณอาศัยสถานะ Plugin อย่างเป็นทางการที่เชื่อถือได้ ให้เพิ่มหลักฐานชุดที่สอง
    ผ่านการติดตั้งอย่างเป็นทางการที่รองรับโดยแค็ตตาล็อก หรือเส้นทางแพ็กเกจที่เผยแพร่แล้วซึ่ง
    บันทึกความไว้วางใจอย่างเป็นทางการ โปรดดูรายละเอียดเกี่ยวกับ
    รากการติดตั้งและการเป็นเจ้าของการพึ่งพาที่
    [การแก้ไขการพึ่งพาของ Plugin](/th/plugins/dependency-resolution)

  </Step>

  <Step title="เผยแพร่">
    ตรวจสอบแพ็กเกจก่อนเผยแพร่:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    ข้อมูลโค้ดแพ็กเกจ ClawHub ที่เป็นมาตรฐานอยู่ใน `docs/snippets/plugin-publish/`

  </Step>

  <Step title="ติดตั้ง">
    ติดตั้งแพ็กเกจที่เผยแพร่แล้วผ่าน ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## การลงทะเบียนเครื่องมือ

เครื่องมืออาจเป็นแบบจำเป็นหรือไม่บังคับ เครื่องมือที่จำเป็นจะพร้อมใช้งานเสมอเมื่อ
เปิดใช้ Plugin ส่วนเครื่องมือที่ไม่บังคับต้องให้ผู้ใช้เลือกเข้าร่วมอย่างชัดเจนก่อนที่ OpenClaw
จะโหลดรันไทม์ของ Plugin เจ้าของเครื่องมือ

แฟกทอรีเครื่องมือจะได้รับบริบทรันไทม์ที่เชื่อถือได้ ซึ่งรวมถึง `deliveryContext`,
`nativeChannelId` สำหรับการสนทนาบนแพลตฟอร์มที่ใช้งานอยู่เมื่อมีให้ใช้งาน และ
`requesterSenderId`

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      outputSchema: Type.Object(
        { pipeline: Type.String() },
        { additionalProperties: false },
      ),
      async execute(_id, params) {
        return {
          content: [{ type: "text", text: params.pipeline }],
          details: { pipeline: params.pipeline },
        };
      },
    },
    { optional: true },
  );
}
```

`outputSchema` เป็นตัวเลือก โดยอธิบายค่า `details` ที่มีโครงสร้างซึ่งใช้โดย
[โหมดโค้ด](/th/tools/code-mode) และ [การค้นหาเครื่องมือ](/th/tools/tool-search) การเรียกใช้แค็ตตาล็อก
จะปฏิเสธสคีมาที่ไม่ถูกต้องก่อนดำเนินการ และตรวจสอบค่าขั้นสุดท้ายหลังจาก
ฮุกเครื่องมือ ให้ละเว้นสำหรับเครื่องมือที่ไม่มีผลลัพธ์ JSON ที่เสถียร โปรดดู
สัญญาฉบับเต็มที่ [Plugin เครื่องมือ](/th/plugins/tool-plugins#output-contracts)

เครื่องมือทุกตัวที่ลงทะเบียนด้วย `api.registerTool(...)` ต้องประกาศไว้ใน
ไฟล์กำกับ Plugin ด้วย:

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

ผู้ใช้เลือกเข้าร่วมด้วย `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

เครื่องมือที่ไม่บังคับควบคุมว่าจะเปิดเผยเครื่องมือให้โมเดลเห็นหรือไม่ ใช้
[คำขอสิทธิ์ของ Plugin](/th/plugins/plugin-permission-requests) เมื่อเครื่องมือ
หรือฮุกควรขออนุมัติหลังจากโมเดลเลือกแล้วและก่อนดำเนินการ

ใช้เครื่องมือที่ไม่บังคับสำหรับผลข้างเคียง ไบนารีที่ไม่ทั่วไป หรือความสามารถที่
ไม่ควรถูกเปิดเผยโดยค่าเริ่มต้น ชื่อเครื่องมือต้องไม่ขัดแย้งกับชื่อเครื่องมือแกนหลัก
รายการที่ขัดแย้งจะถูกข้ามและรายงานในการวินิจฉัย Plugin การลงทะเบียนที่มีรูปแบบ
ไม่ถูกต้องจะถูกข้ามและรายงานในลักษณะเดียวกัน ได้แก่ ไม่มี `name` ที่ไม่ว่าง
`execute` ที่ไม่ใช่ฟังก์ชัน หรือคำอธิบายเครื่องมือที่ไม่มีอ็อบเจกต์ `parameters`

แฟกทอรีเครื่องมือจะได้รับอ็อบเจกต์บริบทที่รันไทม์จัดหาให้ ใช้ `ctx.activeModel`
เมื่อเครื่องมือต้องบันทึก แสดง หรือปรับให้เข้ากับโมเดลที่ใช้งานอยู่สำหรับรอบปัจจุบัน
โดยอาจรวม `provider`, `modelId` และ `modelRef` ให้ถือว่าสิ่งนี้เป็น
ข้อมูลเมตารันไทม์เพื่อให้ข้อมูล ไม่ใช่ขอบเขตความปลอดภัยเพื่อป้องกันผู้ควบคุมภายในเครื่อง
โค้ด Plugin ที่ติดตั้ง หรือรันไทม์ OpenClaw ที่ถูกแก้ไข เครื่องมือภายในเครื่องที่ละเอียดอ่อน
ยังคงควรกำหนดให้ Plugin หรือผู้ควบคุมเลือกเข้าร่วมอย่างชัดเจน และ
ปฏิเสธการทำงานโดยค่าเริ่มต้นเมื่อข้อมูลเมตาของโมเดลที่ใช้งานอยู่หายไปหรือไม่เหมาะสม

ไฟล์กำกับประกาศความเป็นเจ้าของและการค้นพบ ส่วนการดำเนินการยังคงเรียกใช้
การติดตั้งเครื่องมือที่ลงทะเบียนจริง รักษา `toolMetadata.<tool>.optional: true`
ให้สอดคล้องกับ `api.registerTool(..., { optional: true })` เพื่อให้ OpenClaw หลีกเลี่ยง
การโหลดรันไทม์ของ Plugin นั้นจนกว่าเครื่องมือจะได้รับอนุญาตอย่างชัดเจน

## รูปแบบการนำเข้า

นำเข้าจากเส้นทางย่อย SDK ที่เฉพาะเจาะจง:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

ภายในแพ็กเกจ Plugin ของคุณ ให้ใช้ไฟล์บาร์เรลภายในเครื่อง เช่น `api.ts` และ
`runtime-api.ts` สำหรับการนำเข้าภายใน อย่านำเข้า Plugin ของตนเองผ่าน
เส้นทาง SDK ตัวช่วยเฉพาะผู้ให้บริการควรอยู่ในแพ็กเกจผู้ให้บริการ เว้นแต่
รอยต่อดังกล่าวจะเป็นแบบทั่วไปอย่างแท้จริง

เมธอด RPC ของ Gateway แบบกำหนดเองเป็นจุดเข้าใช้งานขั้นสูง ให้ใช้คำนำหน้า
เฉพาะ Plugin กับเมธอดเหล่านี้ เนมสเปซผู้ดูแลแกนหลัก เช่น `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` และ `update.*` ยังคงสงวนไว้
และจะแก้ไขเป็น `operator.admin` บริดจ์
`openclaw/plugin-sdk/gateway-method-runtime` สงวนไว้สำหรับเส้นทาง HTTP ของ Plugin
ที่ประกาศ `contracts.gatewayMethodDispatch: ["authenticated-request"]`

ดูแผนผังการนำเข้าฉบับเต็มได้ที่ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## รายการตรวจสอบก่อนส่ง

<Check>**package.json** มีข้อมูลเมตา `openclaw` ที่ถูกต้อง</Check>
<Check>มีไฟล์กำกับ **openclaw.plugin.json** และถูกต้อง</Check>
<Check>จุดเข้าใช้งานใช้ `defineChannelPluginEntry` หรือ `definePluginEntry`</Check>
<Check>การนำเข้าทั้งหมดใช้เส้นทาง `plugin-sdk/<subpath>` ที่เฉพาะเจาะจง</Check>
<Check>การนำเข้าภายในใช้โมดูลภายในเครื่อง ไม่ใช่การนำเข้าตนเองผ่าน SDK</Check>
<Check>การทดสอบผ่าน (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ผ่าน (Plugin ภายในที่เก็บ)</Check>

## ทดสอบกับรุ่นเบต้า

1. ติดตามรีลีสของ [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`) แท็กเบต้ามีลักษณะเช่น `v2026.3.N-beta.1` นอกจากนี้ยังติดตาม [@openclaw](https://x.com/openclaw) บน X เพื่อรับประกาศรีลีสได้อีกด้วย
2. ทดสอบ Plugin ของคุณกับแท็กเบต้าทันทีที่ปรากฏ โดยปกติช่วงเวลาก่อนรีลีสเสถียรจะมีเพียงไม่กี่ชั่วโมง
3. หลังจากทดสอบแล้ว ให้โพสต์ในเธรดของ Plugin ของคุณในช่อง Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)) พร้อมระบุ `all good` หรือสิ่งที่ขัดข้อง หากยังไม่มีเธรด ให้สร้างเธรดใหม่
4. หากมีสิ่งใดขัดข้อง ให้เปิดหรืออัปเดต issue ที่มีชื่อว่า `Beta blocker: <plugin-name> - <summary>` และใช้ป้ายกำกับ `beta-blocker` ลิงก์ issue ไว้ในเธรดของคุณ
5. เปิด PR ไปยัง `main` โดยใช้ชื่อ `fix(<plugin-id>): beta blocker - <summary>` และลิงก์ issue ไว้ทั้งใน PR และเธรด Discord ของคุณ ผู้มีส่วนร่วมไม่สามารถติดป้ายกำกับ PR ได้ ดังนั้นชื่อจึงเป็นสัญญาณฝั่ง PR สำหรับผู้ดูแลและระบบอัตโนมัติ ตัวขัดขวางที่มี PR จะได้รับการผสาน ส่วนตัวขัดขวางที่ไม่มี PR อาจยังถูกนำไปรวมในรีลีส
6. การไม่มีความเคลื่อนไหวหมายความว่าทุกอย่างผ่าน หากพลาดช่วงเวลานี้ โดยปกติการแก้ไขของคุณจะถูกรวมในรอบถัดไป

## ขั้นตอนถัดไป

<CardGroup cols={2}>
  <Card title="Plugin ช่องทาง" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    สร้าง Plugin ช่องทางการรับส่งข้อความ
  </Card>
  <Card title="Plugin ผู้ให้บริการ" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    สร้าง Plugin ผู้ให้บริการโมเดล
  </Card>
  <Card title="Plugin แบ็กเอนด์ CLI" icon="terminal" href="/th/plugins/cli-backend-plugins">
    ลงทะเบียนแบ็กเอนด์ CLI สำหรับ AI ภายในเครื่อง
  </Card>
  <Card title="ภาพรวม SDK" icon="book-open" href="/th/plugins/sdk-overview">
    ข้อมูลอ้างอิงแผนผังการนำเข้าและ API การลงทะเบียน
  </Card>
  <Card title="ตัวช่วยรันไทม์" icon="settings" href="/th/plugins/sdk-runtime">
    TTS การค้นหา และเอเจนต์ย่อยผ่าน api.runtime
  </Card>
  <Card title="การทดสอบ" icon="test-tubes" href="/th/plugins/sdk-testing">
    ยูทิลิตีและรูปแบบการทดสอบ
  </Card>
  <Card title="ไฟล์ Manifest ของ Plugin" icon="file-json" href="/th/plugins/manifest">
    ข้อมูลอ้างอิงสคีมา Manifest ฉบับเต็ม
  </Card>
</CardGroup>

## ที่เกี่ยวข้อง

- [ฮุกของ Plugin](/th/plugins/hooks)
- [สถาปัตยกรรม Plugin](/th/plugins/architecture)
