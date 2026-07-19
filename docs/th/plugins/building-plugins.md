---
doc-schema-version: 1
read_when:
    - คุณต้องการสร้าง Plugin ใหม่สำหรับ OpenClaw
    - คุณต้องการคู่มือเริ่มต้นใช้งานฉบับย่อสำหรับการพัฒนา Plugin
    - คุณกำลังเลือกระหว่างเอกสารเกี่ยวกับช่องทาง ผู้ให้บริการ แบ็กเอนด์ CLI เครื่องมือ หรือฮุก
sidebarTitle: Getting Started
summary: สร้าง Plugin OpenClaw แรกของคุณได้ภายในไม่กี่นาที
title: การสร้าง Plugin
x-i18n:
    generated_at: "2026-07-19T07:18:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 673fb33c2b3f33344a8fdde15c3813b953aa32872ba7175229d35c6c353099a2
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins ขยายความสามารถของ OpenClaw ได้โดยไม่ต้องเปลี่ยนแปลงแกนหลัก Plugin สามารถเพิ่มช่องทาง
รับส่งข้อความ ผู้ให้บริการโมเดล แบ็กเอนด์ CLI ภายในเครื่อง เครื่องมือเอเจนต์ hook ผู้ให้บริการสื่อ
หรือความสามารถอื่นที่ Plugin เป็นเจ้าของ

ไม่จำเป็นต้องเพิ่ม Plugin ภายนอกลงในรีโพซิทอรี OpenClaw ให้เผยแพร่
แพ็กเกจไปยัง [ClawHub](/th/clawhub) แล้วผู้ใช้ติดตั้งด้วย:

```bash
openclaw plugins install clawhub:<package-name>
```

ข้อกำหนดแพ็กเกจแบบเปล่ายังคงติดตั้งจาก npm ในระหว่างช่วงเปลี่ยนผ่านการเปิดตัว ใช้คำนำหน้า
`clawhub:` เมื่อต้องการให้แก้ไขตำแหน่งผ่าน ClawHub

## ข้อกำหนด

- Node 22.22.3+, Node 24.15+ หรือ Node 25.9+ และ `npm` หรือ `pnpm`
- โมดูล TypeScript ESM
- สำหรับงาน Plugin แบบรวมอยู่ในรีโพซิทอรี ให้โคลนรีโพซิทอรีและเรียกใช้ `pnpm install`
  การพัฒนา Plugin จากซอร์สที่ checkout รองรับเฉพาะ pnpm เนื่องจาก OpenClaw ค้นหา
  Plugins ที่รวมมาให้จากแพ็กเกจ workspace `extensions/*`

## เลือกรูปแบบ Plugin

<CardGroup cols={2}>
  <Card title="Plugin ช่องทาง" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    เชื่อมต่อ OpenClaw กับแพลตฟอร์มรับส่งข้อความ
  </Card>
  <Card title="Plugin ผู้ให้บริการ" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    เพิ่มผู้ให้บริการโมเดล สื่อ การค้นหา การดึงข้อมูล เสียงพูด หรือแบบเรียลไทม์
  </Card>
  <Card title="Plugin แบ็กเอนด์ CLI" icon="terminal" href="/th/plugins/cli-backend-plugins">
    เรียกใช้ CLI สำหรับ AI ภายในเครื่องผ่านกลไกสำรองโมเดลของ OpenClaw
  </Card>
  <Card title="Plugin เครื่องมือ" icon="wrench" href="/th/plugins/tool-plugins">
    ลงทะเบียนเครื่องมือเอเจนต์
  </Card>
</CardGroup>

## เริ่มต้นอย่างรวดเร็ว

สร้าง Plugin เครื่องมือขั้นต่ำด้วยการลงทะเบียนเครื่องมือเอเจนต์ที่จำเป็นหนึ่งรายการ นี่คือ
รูปแบบ Plugin ที่สั้นที่สุดแต่ใช้งานได้จริง และครอบคลุมแพ็กเกจ manifest จุดเข้าใช้งาน และ
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

    Plugins ภายนอกที่เผยแพร่แล้วควรกำหนดให้จุดเข้าใช้งานของรันไทม์ชี้ไปยังไฟล์ JavaScript
    ที่สร้างแล้ว ดูสัญญาจุดเข้าใช้งานฉบับเต็มที่ [จุดเข้าใช้งาน SDK](/th/plugins/sdk-entrypoints)

    Plugin ทุกตัวต้องมี manifest แม้ไม่มีการกำหนดค่า เครื่องมือรันไทม์ต้อง
    ปรากฏใน `contracts.tools` เพื่อให้ OpenClaw ค้นพบความเป็นเจ้าของได้โดยไม่ต้อง
    โหลดรันไทม์ของ Plugin ทุกตัวล่วงหน้า กำหนด `activation.onStartup`
    อย่างตั้งใจ ตัวอย่างนี้โหลดเมื่อ Gateway เริ่มทำงาน

    พื้นผิว Plugin ที่โฮสต์เชื่อถือก็ถูกควบคุมด้วย manifest เช่นกัน และ Plugins
    ที่ติดตั้งแล้วต้องประกาศอย่างชัดเจน: `api.registerAgentToolResultMiddleware(...)`
    ต้องมีรันไทม์เป้าหมายแต่ละรายการอยู่ใน `contracts.agentToolResultMiddleware`
    และ `api.registerTrustedToolPolicy(...)` ต้องมีรหัสนโยบายแต่ละรายการอยู่ใน
    `contracts.trustedToolPolicies` การประกาศเหล่านี้ทำให้การตรวจสอบขณะติดตั้ง
    สอดคล้องกับการลงทะเบียนขณะรันไทม์

    ดูข้อมูลทุกฟิลด์ของ manifest ได้ที่ [manifest ของ Plugin](/th/plugins/manifest)

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

    ใช้ `definePluginEntry` สำหรับ Plugins ที่ไม่ใช่ช่องทาง ส่วน Plugins ช่องทางให้ใช้
    `defineChannelPluginEntry` จาก `openclaw/plugin-sdk/core` แทน

  </Step>

  <Step title="ทดสอบรันไทม์">
    สำหรับ Plugin ที่ติดตั้งแล้วหรือ Plugin ภายนอก ให้ตรวจสอบรันไทม์ที่โหลด:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    หาก Plugin ลงทะเบียนคำสั่ง CLI ให้เรียกใช้คำสั่งนั้นด้วยและยืนยัน
    เอาต์พุต เช่น `openclaw demo-plugin ping`

    สำหรับ Plugin ที่รวมอยู่ในรีโพซิทอรีนี้ OpenClaw จะค้นหาแพ็กเกจ Plugin
    จากซอร์สที่ checkout ใน workspace `extensions/*` ให้เรียกใช้การทดสอบเฉพาะจุด
    ที่ใกล้เคียงที่สุด:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="ทดสอบการติดตั้งแพ็กเกจ">
    ก่อนเผยแพร่ Plugin ที่พร้อมเป็นแพ็กเกจ ให้ทดสอบด้วยรูปแบบการติดตั้งเดียวกับที่ผู้ใช้
    จะได้รับ ขั้นแรกให้เพิ่มขั้นตอนการสร้าง กำหนดให้จุดเข้าใช้งานรันไทม์ เช่น
    `openclaw.extensions` ชี้ไปยัง JavaScript ที่สร้างแล้ว เช่น `./dist/index.js` และตรวจสอบว่า
    `npm pack` รวมเอาต์พุต `dist/` นั้น จุดเข้าใช้งานซอร์ส TypeScript
    มีไว้เฉพาะสำหรับซอร์สที่ checkout และเส้นทางการพัฒนาภายในเครื่อง

    จากนั้นแพ็ก Plugin และติดตั้ง tarball ด้วย `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` ใช้โปรเจกต์ npm ต่อ Plugin ที่ OpenClaw จัดการ จึงตรวจพบ
    ข้อผิดพลาดของ dependency ขณะรันไทม์ที่การทดสอบจากซอร์สที่ checkout อาจซ่อนไว้ได้ วิธีนี้พิสูจน์
    รูปแบบแพ็กเกจและ dependency ไม่ใช่ความเชื่อถืออย่างเป็นทางการที่เชื่อมโยงกับแค็ตตาล็อก
    การนำเข้าขณะรันไทม์ต้องอยู่ใน `dependencies` หรือ `optionalDependencies`;
    dependencies ที่มีเฉพาะใน `devDependencies` จะไม่ถูกติดตั้งให้กับ
    โปรเจกต์รันไทม์ที่ได้รับการจัดการ

    อย่าใช้การติดตั้งจากไฟล์เก็บถาวรหรือพาธโดยตรงเป็นหลักฐานสุดท้ายสำหรับพฤติกรรม
    ของ Plugin อย่างเป็นทางการหรือที่มีสิทธิ์พิเศษ ซอร์สดิบมีประโยชน์สำหรับการดีบักภายในเครื่อง แต่
    ไม่ได้พิสูจน์เส้นทาง dependency เดียวกับการติดตั้งผ่าน npm หรือ ClawHub หาก
    Plugin ของคุณอาศัยสถานะ Plugin อย่างเป็นทางการที่เชื่อถือได้ ให้เพิ่มการพิสูจน์ครั้งที่สอง
    ผ่านการติดตั้งอย่างเป็นทางการที่มีแค็ตตาล็อกรองรับ หรือเส้นทางแพ็กเกจที่เผยแพร่แล้วซึ่ง
    บันทึกความเชื่อถืออย่างเป็นทางการ ดูรายละเอียดรากการติดตั้งและความเป็นเจ้าของ
    dependency ที่
    [การแก้ไข dependency ของ Plugin](/th/plugins/dependency-resolution)

  </Step>

  <Step title="เผยแพร่">
    ตรวจสอบแพ็กเกจก่อนเผยแพร่:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    ตัวอย่างแพ็กเกจ ClawHub มาตรฐานอยู่ใน `docs/snippets/plugin-publish/`

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
จะโหลดรันไทม์ของ Plugin ที่เป็นเจ้าของ

แฟกทอรีเครื่องมือจะได้รับบริบทรันไทม์ที่เชื่อถือได้ รวมถึง `deliveryContext`,
`nativeChannelId` สำหรับการสนทนาบนแพลตฟอร์มที่กำลังใช้งานเมื่อมีข้อมูล และ
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
[โหมดโค้ด](/tools/code-mode) และ [การค้นหาเครื่องมือ](/th/tools/tool-search) การเรียกใช้แค็ตตาล็อก
จะปฏิเสธสคีมาที่ไม่ถูกต้องก่อนดำเนินการ และตรวจสอบค่าขั้นสุดท้ายหลังจาก
hook ของเครื่องมือ ไม่ต้องระบุฟิลด์นี้สำหรับเครื่องมือที่ไม่มีผลลัพธ์ JSON ที่เสถียร ดู
สัญญาฉบับเต็มที่ [Plugins เครื่องมือ](/th/plugins/tool-plugins#output-contracts)

เครื่องมือทุกตัวที่ลงทะเบียนด้วย `api.registerTool(...)` ต้องประกาศไว้ใน
manifest ของ Plugin ด้วย:

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

เครื่องมือที่ไม่บังคับควบคุมว่าเครื่องมือจะถูกเปิดเผยต่อโมเดลหรือไม่ ใช้
[คำขอสิทธิ์ของ Plugin](/th/plugins/plugin-permission-requests) เมื่อเครื่องมือ
หรือ hook ควรขออนุมัติหลังจากโมเดลเลือกแล้วและก่อนที่
การดำเนินการจะเริ่มขึ้น

ใช้เครื่องมือที่ไม่บังคับสำหรับผลข้างเคียง ไบนารีที่ไม่ปกติ หรือความสามารถที่
ไม่ควรเปิดเผยโดยค่าเริ่มต้น ชื่อเครื่องมือต้องไม่ขัดแย้งกับชื่อเครื่องมือหลัก
รายการที่ขัดแย้งจะถูกข้ามและรายงานในการวินิจฉัย Plugin การลงทะเบียนที่มีรูปแบบ
ไม่ถูกต้องจะถูกข้ามและรายงานในลักษณะเดียวกัน ได้แก่ `name` ที่ไม่มีหรือว่างเปล่า,
`execute` ที่ไม่ใช่ฟังก์ชัน หรือคำอธิบายเครื่องมือที่ไม่มีออบเจ็กต์ `parameters`

แฟกทอรีเครื่องมือจะได้รับออบเจ็กต์บริบทที่รันไทม์จัดให้ ใช้ `ctx.activeModel`
เมื่อเครื่องมือต้องบันทึก แสดง หรือปรับให้เข้ากับโมเดลที่กำลังใช้งานในรอบ
ปัจจุบัน โดยอาจมี `provider`, `modelId` และ `modelRef` ให้ถือว่าสิ่งนี้เป็น
ข้อมูลเมตารันไทม์เชิงข้อมูล ไม่ใช่ขอบเขตความปลอดภัยที่ป้องกันผู้ควบคุม
ภายในเครื่อง โค้ด Plugin ที่ติดตั้งแล้ว หรือรันไทม์ OpenClaw ที่ถูกดัดแปลง เครื่องมือ
ภายในเครื่องที่ละเอียดอ่อนยังควรกำหนดให้มีการเลือกเข้าร่วมจาก Plugin หรือผู้ควบคุมอย่างชัดเจน และ
ปฏิเสธการทำงานโดยค่าเริ่มต้นเมื่อข้อมูลเมตาของโมเดลที่กำลังใช้งานหายไปหรือไม่เหมาะสม

manifest ประกาศความเป็นเจ้าของและการค้นพบ ส่วนการดำเนินการยังคงเรียกใช้
การติดตั้งเครื่องมือจริงที่ลงทะเบียนไว้ ให้ `toolMetadata.<tool>.optional: true`
สอดคล้องกับ `api.registerTool(..., { optional: true })` เพื่อให้ OpenClaw หลีกเลี่ยง
การโหลดรันไทม์ของ Plugin นั้นจนกว่าเครื่องมือจะถูกเพิ่มในรายการอนุญาตอย่างชัดเจน

## รูปแบบการนำเข้า

นำเข้าจากพาธย่อย SDK ที่เจาะจง:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

อย่านำเข้าจาก root barrel ที่เลิกใช้แล้ว:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

ภายในแพ็กเกจ Plugin ให้ใช้ไฟล์ barrel ภายในเครื่อง เช่น `api.ts` และ
`runtime-api.ts` สำหรับการนำเข้าภายใน อย่านำเข้า Plugin ของตนเองผ่าน
พาธ SDK ตัวช่วยเฉพาะผู้ให้บริการควรอยู่ในแพ็กเกจของผู้ให้บริการ เว้นแต่
จุดเชื่อมต่อนั้นจะเป็นแบบทั่วไปอย่างแท้จริง

เมธอด RPC ของ Gateway แบบกำหนดเองเป็นจุดเข้าใช้งานขั้นสูง ให้ใช้
คำนำหน้าเฉพาะ Plugin ส่วน namespace ผู้ดูแลระบบหลัก เช่น `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` และ `update.*` ยังคงสงวนไว้
และแก้ไขเป็น `operator.admin` บริดจ์
`openclaw/plugin-sdk/gateway-method-runtime` สงวนไว้สำหรับเส้นทาง HTTP ของ Plugin
ที่ประกาศ `contracts.gatewayMethodDispatch: ["authenticated-request"]`

ดูแผนผังการนำเข้าฉบับเต็มที่ [ภาพรวม SDK ของ Plugin](/th/plugins/sdk-overview)

## รายการตรวจสอบก่อนส่ง

<Check>**package.json** มีข้อมูลเมตา `openclaw` ที่ถูกต้อง</Check>
<Check>มีไฟล์ manifest **openclaw.plugin.json** และไฟล์ถูกต้อง</Check>
<Check>จุดเริ่มต้นใช้ `defineChannelPluginEntry` หรือ `definePluginEntry`</Check>
<Check>การนำเข้าทั้งหมดใช้พาธ `plugin-sdk/<subpath>` ที่เจาะจง</Check>
<Check>การนำเข้าภายในใช้โมดูลภายในเครื่อง ไม่ใช่การนำเข้า SDK ของตนเอง</Check>
<Check>การทดสอบผ่าน (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ผ่าน (Plugin ภายในรีโพซิทอรี)</Check>

## ทดสอบกับรุ่นเบตา

1. ติดตามรุ่นเผยแพร่ของ [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`) แท็กเบตามีรูปแบบเช่น `v2026.3.N-beta.1` นอกจากนี้ยังติดตาม [@openclaw](https://x.com/openclaw) บน X เพื่อรับประกาศรุ่นเผยแพร่ได้
2. ทดสอบ Plugin กับแท็กเบตาทันทีที่แท็กปรากฏ โดยทั่วไปช่วงเวลาก่อนออกรุ่นเสถียรมีเพียงไม่กี่ชั่วโมง
3. หลังทดสอบแล้ว ให้โพสต์ในเธรดของ Plugin ในช่อง Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)) โดยระบุ `all good` หรือสิ่งที่ขัดข้อง หากยังไม่มีเธรด ให้สร้างเธรดใหม่
4. หากมีสิ่งใดขัดข้อง ให้เปิดหรืออัปเดต issue ชื่อ `Beta blocker: <plugin-name> - <summary>` และใช้ป้ายกำกับ `beta-blocker` จากนั้นลิงก์ issue ไว้ในเธรด
5. เปิด PR ไปยัง `main` โดยตั้งชื่อว่า `fix(<plugin-id>): beta blocker - <summary>` และลิงก์ issue ทั้งใน PR และเธรด Discord ผู้มีส่วนร่วมไม่สามารถติดป้ายกำกับ PR ได้ ดังนั้นชื่อจึงเป็นสัญญาณฝั่ง PR สำหรับผู้ดูแลและระบบอัตโนมัติ ตัวขัดขวางที่มี PR จะได้รับการผสาน ส่วนตัวขัดขวางที่ไม่มี PR อาจยังถูกเผยแพร่ออกไป
6. การไม่มีการตอบกลับหมายความว่าทุกอย่างผ่าน หากพลาดช่วงเวลานี้ โดยทั่วไปการแก้ไขจะรวมอยู่ในรอบถัดไป

## ขั้นตอนถัดไป

<CardGroup cols={2}>
  <Card title="Plugin ช่องทาง" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    สร้าง Plugin ช่องทางการรับส่งข้อความ
  </Card>
  <Card title="Plugin ผู้ให้บริการ" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    สร้าง Plugin ผู้ให้บริการโมเดล
  </Card>
  <Card title="Plugin แบ็กเอนด์ CLI" icon="terminal" href="/th/plugins/cli-backend-plugins">
    ลงทะเบียนแบ็กเอนด์ CLI ของ AI ภายในเครื่อง
  </Card>
  <Card title="ภาพรวม SDK" icon="book-open" href="/th/plugins/sdk-overview">
    เอกสารอ้างอิงผังการนำเข้าและ API การลงทะเบียน
  </Card>
  <Card title="ตัวช่วยรันไทม์" icon="settings" href="/th/plugins/sdk-runtime">
    TTS การค้นหา และเอเจนต์ย่อยผ่าน api.runtime
  </Card>
  <Card title="การทดสอบ" icon="test-tubes" href="/th/plugins/sdk-testing">
    ยูทิลิตีและรูปแบบการทดสอบ
  </Card>
  <Card title="Manifest ของ Plugin" icon="file-json" href="/th/plugins/manifest">
    เอกสารอ้างอิงสคีมา manifest ฉบับเต็ม
  </Card>
</CardGroup>

## เนื้อหาที่เกี่ยวข้อง

- [ฮุกของ Plugin](/th/plugins/hooks)
- [สถาปัตยกรรม Plugin](/th/plugins/architecture)
