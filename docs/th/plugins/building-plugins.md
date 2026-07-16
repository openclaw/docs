---
doc-schema-version: 1
read_when:
    - คุณต้องการสร้าง Plugin ใหม่สำหรับ OpenClaw
    - คุณต้องการคู่มือเริ่มต้นฉบับย่อสำหรับการพัฒนา Plugin
    - คุณกำลังเลือกระหว่างเอกสารเกี่ยวกับช่องทาง ผู้ให้บริการ แบ็กเอนด์ CLI เครื่องมือ หรือฮุก
sidebarTitle: Getting Started
summary: สร้าง Plugin แรกของ OpenClaw ได้ภายในไม่กี่นาที
title: การสร้าง Plugin
x-i18n:
    generated_at: "2026-07-16T19:25:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d64d455c260f4aa85affc6160233a91c45237f17a6a87cb35e2c2a77f2e3cc1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin ช่วยขยายความสามารถของ OpenClaw โดยไม่ต้องแก้ไขส่วนแกนหลัก Plugin สามารถเพิ่มช่องทางการส่งข้อความ ผู้ให้บริการโมเดล แบ็กเอนด์ CLI ภายในเครื่อง เครื่องมือเอเจนต์ ฮุก ผู้ให้บริการสื่อ หรือความสามารถอื่นที่ Plugin เป็นเจ้าของ

ไม่จำเป็นต้องเพิ่ม Plugin ภายนอกลงในรีโพซิทอรี OpenClaw ให้เผยแพร่แพ็กเกจไปยัง [ClawHub](/clawhub) แล้วผู้ใช้ติดตั้งด้วย:

```bash
openclaw plugins install clawhub:<package-name>
```

ในช่วงเปลี่ยนผ่านของการเปิดตัว ข้อกำหนดแพ็กเกจแบบไม่มีคำนำหน้ายังคงติดตั้งจาก npm ใช้คำนำหน้า `clawhub:` เมื่อต้องการให้ ClawHub ดำเนินการแก้ไขตำแหน่งแพ็กเกจ

## ข้อกำหนด

- Node 22.22.3+, Node 24.15+ หรือ Node 25.9+ และ `npm` หรือ `pnpm`
- โมดูล TypeScript ESM
- สำหรับงานพัฒนา Plugin แบบบันเดิลภายในรีโพซิทอรี ให้โคลนรีโพซิทอรีแล้วเรียกใช้ `pnpm install`
  การพัฒนา Plugin จากซอร์สเช็กเอาต์รองรับเฉพาะ pnpm เนื่องจาก OpenClaw ค้นพบ
  Plugin แบบบันเดิลจากแพ็กเกจเวิร์กสเปซ `extensions/*`

## เลือกรูปแบบ Plugin

<CardGroup cols={2}>
  <Card title="Plugin ช่องทาง" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    เชื่อมต่อ OpenClaw กับแพลตฟอร์มรับส่งข้อความ
  </Card>
  <Card title="Plugin ผู้ให้บริการ" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    เพิ่มผู้ให้บริการโมเดล สื่อ การค้นหา การดึงข้อมูล เสียงพูด หรือการทำงานแบบเรียลไทม์
  </Card>
  <Card title="Plugin แบ็กเอนด์ CLI" icon="terminal" href="/th/plugins/cli-backend-plugins">
    เรียกใช้ AI CLI ภายในเครื่องผ่านกลไกสำรองโมเดลของ OpenClaw
  </Card>
  <Card title="Plugin เครื่องมือ" icon="wrench" href="/th/plugins/tool-plugins">
    ลงทะเบียนเครื่องมือเอเจนต์
  </Card>
</CardGroup>

## เริ่มต้นอย่างรวดเร็ว

สร้าง Plugin เครื่องมือขั้นต่ำโดยลงทะเบียนเครื่องมือเอเจนต์ที่จำเป็นหนึ่งรายการ นี่คือ
รูปแบบ Plugin ที่สั้นที่สุดแต่ใช้งานได้จริง และครอบคลุมแพ็กเกจ แมนิเฟสต์ จุดเข้าใช้งาน และ
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
  "description": "เพิ่มเครื่องมือแบบกำหนดเองให้ OpenClaw",
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

    Plugin ภายนอกที่เผยแพร่แล้วควรกำหนดให้รายการรันไทม์ชี้ไปยังไฟล์ JavaScript
    ที่สร้างเสร็จแล้ว ดูสัญญาจุดเข้าใช้งานฉบับเต็มได้ที่ [จุดเข้าใช้งาน SDK](/th/plugins/sdk-entrypoints)

    Plugin ทุกตัวต้องมีแมนิเฟสต์ แม้ไม่มีการกำหนดค่าก็ตาม เครื่องมือรันไทม์ต้อง
    ปรากฏใน `contracts.tools` เพื่อให้ OpenClaw ค้นพบความเป็นเจ้าของได้โดยไม่ต้อง
    โหลดรันไทม์ของ Plugin ทุกตัวล่วงหน้า กำหนด `activation.onStartup`
    อย่างตั้งใจ ตัวอย่างนี้จะโหลดเมื่อ Gateway เริ่มทำงาน

    พื้นผิว Plugin ที่โฮสต์ไว้วางใจก็ถูกควบคุมด้วยแมนิเฟสต์เช่นกัน และ Plugin
    ที่ติดตั้งต้องประกาศอย่างชัดเจน: `api.registerAgentToolResultMiddleware(...)`
    ต้องระบุรันไทม์เป้าหมายแต่ละรายการใน `contracts.agentToolResultMiddleware`
    และ `api.registerTrustedToolPolicy(...)` ต้องระบุรหัสนโยบายแต่ละรายการใน
    `contracts.trustedToolPolicies` การประกาศเหล่านี้ช่วยให้การตรวจสอบขณะติดตั้ง
    สอดคล้องกับการลงทะเบียนขณะรันไทม์

    สำหรับฟิลด์ทั้งหมดในแมนิเฟสต์ โปรดดู [แมนิเฟสต์ Plugin](/th/plugins/manifest)

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
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
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

    สำหรับ Plugin แบบบันเดิลในรีโพซิทอรีนี้ OpenClaw จะค้นพบแพ็กเกจ Plugin
    จากซอร์สเช็กเอาต์ในเวิร์กสเปซ `extensions/*` ให้เรียกใช้การทดสอบแบบเจาะจงที่ใกล้เคียงที่สุด:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="ทดสอบการติดตั้งแพ็กเกจ">
    ก่อนเผยแพร่ Plugin ที่พร้อมเป็นแพ็กเกจ ให้ทดสอบด้วยรูปแบบการติดตั้งเดียวกับที่ผู้ใช้
    จะได้รับ ขั้นแรกให้เพิ่มขั้นตอนบิลด์ กำหนดให้รายการรันไทม์ เช่น
    `openclaw.extensions` ชี้ไปยัง JavaScript ที่สร้างแล้ว เช่น `./dist/index.js` และตรวจสอบว่า
    `npm pack` รวมเอาต์พุต `dist/` นั้น รายการซอร์ส TypeScript
    มีไว้สำหรับซอร์สเช็กเอาต์และเส้นทางการพัฒนาภายในเครื่องเท่านั้น

    จากนั้นแพ็ก Plugin และติดตั้งทาร์บอลด้วย `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` ใช้โปรเจกต์ npm ต่อ Plugin ที่ OpenClaw จัดการ จึงตรวจพบ
    ข้อผิดพลาดด้านการขึ้นต่อกันของรันไทม์ที่การทดสอบซอร์สเช็กเอาต์อาจซ่อนไว้ วิธีนี้พิสูจน์
    รูปแบบแพ็กเกจและการขึ้นต่อกัน ไม่ใช่สถานะความไว้วางใจอย่างเป็นทางการที่เชื่อมโยงกับแค็ตตาล็อก
    การนำเข้าขณะรันไทม์ต้องอยู่ใน `dependencies` หรือ `optionalDependencies`;
    การขึ้นต่อกันที่อยู่เฉพาะใน `devDependencies` จะไม่ถูกติดตั้งให้กับ
    โปรเจกต์รันไทม์ที่จัดการไว้

    อย่าใช้การติดตั้งจากไฟล์เก็บถาวรหรือพาธโดยตรงเป็นหลักฐานขั้นสุดท้ายสำหรับพฤติกรรม
    ของ Plugin อย่างเป็นทางการหรือที่มีสิทธิ์พิเศษ ซอร์สดิบมีประโยชน์สำหรับการดีบักภายในเครื่อง แต่
    ไม่ได้พิสูจน์เส้นทางการขึ้นต่อกันแบบเดียวกับการติดตั้งจาก npm หรือ ClawHub หาก
    Plugin อาศัยสถานะ Plugin ทางการที่เชื่อถือได้ ให้เพิ่มหลักฐานชุดที่สอง
    ผ่านการติดตั้งอย่างเป็นทางการที่มีแค็ตตาล็อกรองรับ หรือเส้นทางแพ็กเกจที่เผยแพร่แล้วซึ่ง
    บันทึกสถานะความไว้วางใจอย่างเป็นทางการ ดูรายละเอียดความเป็นเจ้าของรูทการติดตั้งและ
    การขึ้นต่อกันที่ [การแก้ไขการขึ้นต่อกันของ Plugin](/th/plugins/dependency-resolution)

  </Step>

  <Step title="เผยแพร่">
    ตรวจสอบความถูกต้องของแพ็กเกจก่อนเผยแพร่:

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
เปิดใช้งาน Plugin ส่วนเครื่องมือที่ไม่บังคับต้องให้ผู้ใช้เลือกเข้าร่วมอย่างชัดเจนก่อนที่ OpenClaw
จะโหลดรันไทม์ของ Plugin เจ้าของ

แฟกทอรีเครื่องมือจะได้รับบริบทรันไทม์ที่เชื่อถือได้ รวมถึง `deliveryContext`,
`nativeChannelId` สำหรับบทสนทนาบนแพลตฟอร์มที่ใช้งานอยู่เมื่อมี และ
`requesterSenderId`

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

เครื่องมือทุกตัวที่ลงทะเบียนด้วย `api.registerTool(...)` ต้องประกาศใน
แมนิเฟสต์ของ Plugin ด้วย:

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
  tools: { allow: ["workflow_tool"] }, // หรือ ["my-plugin"] สำหรับเครื่องมือทั้งหมดจาก Plugin เดียว
}
```

เครื่องมือที่ไม่บังคับควบคุมว่าเครื่องมือจะถูกเปิดเผยต่อโมเดลหรือไม่ ใช้
[คำขอสิทธิ์ของ Plugin](/th/plugins/plugin-permission-requests) เมื่อเครื่องมือ
หรือฮุกควรขอการอนุมัติหลังจากโมเดลเลือกแล้วและก่อนดำเนินการ

ใช้เครื่องมือที่ไม่บังคับสำหรับผลข้างเคียง ไบนารีที่ไม่ทั่วไป หรือความสามารถที่
ไม่ควรถูกเปิดเผยโดยค่าเริ่มต้น ชื่อเครื่องมือต้องไม่ขัดแย้งกับชื่อเครื่องมือแกนหลัก
รายการที่ขัดแย้งจะถูกข้ามและรายงานในการวินิจฉัย Plugin การลงทะเบียนที่มีรูปแบบ
ไม่ถูกต้องจะถูกข้ามและรายงานในลักษณะเดียวกัน ได้แก่ ไม่มี `name`
ที่ไม่ว่างเปล่า, `execute` ที่ไม่ใช่ฟังก์ชัน หรือตัวอธิบายเครื่องมือที่ไม่มีออบเจ็กต์ `parameters`

แฟกทอรีเครื่องมือจะได้รับออบเจ็กต์บริบทที่รันไทม์จัดหาให้ ใช้ `ctx.activeModel`
เมื่อเครื่องมือต้องบันทึก แสดงผล หรือปรับตามโมเดลที่ใช้งานอยู่สำหรับเทิร์นปัจจุบัน
โดยอาจมี `provider`, `modelId` และ `modelRef` ให้ถือว่าเป็น
ข้อมูลเมตารันไทม์เพื่อให้ข้อมูล ไม่ใช่ขอบเขตความปลอดภัยสำหรับป้องกันโอเปอเรเตอร์
ภายในเครื่อง โค้ด Plugin ที่ติดตั้ง หรือรันไทม์ OpenClaw ที่ถูกดัดแปลง เครื่องมือ
ภายในเครื่องที่ละเอียดอ่อนยังคงต้องกำหนดให้ Plugin หรือโอเปอเรเตอร์เลือกเข้าร่วมอย่างชัดเจน และ
ปฏิเสธการทำงานโดยค่าเริ่มต้นเมื่อข้อมูลเมตาของโมเดลที่ใช้งานอยู่หายไปหรือไม่เหมาะสม

แมนิเฟสต์ประกาศความเป็นเจ้าของและการค้นพบ ส่วนการดำเนินการยังคงเรียกใช้อิมพลีเมนเทชัน
เครื่องมือสดที่ลงทะเบียนไว้ รักษา `toolMetadata.<tool>.optional: true`
ให้สอดคล้องกับ `api.registerTool(..., { optional: true })` เพื่อให้ OpenClaw หลีกเลี่ยง
การโหลดรันไทม์ของ Plugin นั้นจนกว่าเครื่องมือจะถูกเพิ่มลงในรายการอนุญาตอย่างชัดเจน

## แนวทางการนำเข้า

นำเข้าจากพาธย่อย SDK ที่เจาะจง:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

อย่านำเข้าจากบาร์เรลรูทที่เลิกใช้แล้ว:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

ภายในแพ็กเกจ Plugin ให้ใช้ไฟล์บาร์เรลภายในเครื่อง เช่น `api.ts` และ
`runtime-api.ts` สำหรับการนำเข้าภายใน อย่านำเข้า Plugin ของตนเองผ่าน
พาธ SDK ตัวช่วยเฉพาะผู้ให้บริการควรอยู่ในแพ็กเกจผู้ให้บริการ เว้นแต่
รอยต่อดังกล่าวจะเป็นแบบทั่วไปอย่างแท้จริง

เมธอด Gateway RPC แบบกำหนดเองเป็นจุดเข้าใช้งานขั้นสูง ให้ใช้คำนำหน้า
เฉพาะ Plugin เนมสเปซผู้ดูแลระบบแกนหลัก เช่น `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` และ `update.*` ยังคงสงวนไว้
และแก้ไขเป็น `operator.admin` บริดจ์
`openclaw/plugin-sdk/gateway-method-runtime` สงวนไว้สำหรับเส้นทาง HTTP ของ Plugin
ที่ประกาศ `contracts.gatewayMethodDispatch: ["authenticated-request"]`

สำหรับแผนผังการนำเข้าฉบับเต็ม โปรดดู [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## รายการตรวจสอบก่อนส่ง

<Check>**package.json** มีข้อมูลเมตา `openclaw` ที่ถูกต้อง</Check>
<Check>มีแมนิเฟสต์ **openclaw.plugin.json** และถูกต้อง</Check>
<Check>จุดเข้าใช้งานใช้ `defineChannelPluginEntry` หรือ `definePluginEntry`</Check>
<Check>การนำเข้าทั้งหมดใช้พาธ `plugin-sdk/<subpath>` ที่เจาะจง</Check>
<Check>การนำเข้าภายในใช้โมดูลภายในเครื่อง ไม่ใช่การนำเข้าตัวเองผ่าน SDK</Check>
<Check>การทดสอบผ่าน (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ผ่าน (Plugin ภายในรีโพซิทอรี)</Check>

## ทดสอบกับรุ่นเบตา

1. ติดตามรีลีสของ [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`) แท็กเบต้ามีรูปแบบเช่น `v2026.3.N-beta.1` นอกจากนี้ยังติดตาม [@openclaw](https://x.com/openclaw) บน X เพื่อรับประกาศรีลีสได้อีกด้วย
2. ทดสอบ Plugin ของคุณกับแท็กเบต้าทันทีที่ปรากฏ โดยทั่วไปช่วงเวลาก่อนออกเวอร์ชันเสถียรมีเพียงไม่กี่ชั่วโมง
3. หลังจากทดสอบแล้ว ให้โพสต์ในเธรดของ Plugin คุณในช่อง Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)) โดยระบุ `all good` หรือสิ่งที่ใช้งานไม่ได้ หากยังไม่มีเธรด ให้สร้างขึ้นมา
4. หากมีสิ่งใดใช้งานไม่ได้ ให้เปิดหรืออัปเดต issue ชื่อ `Beta blocker: <plugin-name> - <summary>` และติดป้ายกำกับ `beta-blocker` จากนั้นลิงก์ issue ไว้ในเธรดของคุณ
5. เปิด PR ไปยัง `main` โดยตั้งชื่อว่า `fix(<plugin-id>): beta blocker - <summary>` และลิงก์ issue ไว้ทั้งใน PR และเธรด Discord ของคุณ ผู้ร่วมพัฒนาไม่สามารถติดป้ายกำกับ PR ได้ ดังนั้นชื่อจึงเป็นสัญญาณฝั่ง PR สำหรับผู้ดูแลและระบบอัตโนมัติ ปัญหาที่ขัดขวางการรีลีสและมี PR จะได้รับการผสาน ส่วนปัญหาที่ไม่มี PR อาจถูกปล่อยไปพร้อมกับรีลีสอยู่ดี
6. การไม่มีเสียงตอบกลับหมายความว่าทุกอย่างผ่าน การพลาดช่วงเวลานี้มักหมายความว่าการแก้ไขของคุณจะรวมอยู่ในรอบถัดไป

## ขั้นตอนถัดไป

<CardGroup cols={2}>
  <Card title="Plugin ช่องทาง" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    สร้าง Plugin ช่องทางรับส่งข้อความ
  </Card>
  <Card title="Plugin ผู้ให้บริการ" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    สร้าง Plugin ผู้ให้บริการโมเดล
  </Card>
  <Card title="Plugin แบ็กเอนด์ CLI" icon="terminal" href="/th/plugins/cli-backend-plugins">
    ลงทะเบียนแบ็กเอนด์ CLI สำหรับ AI ภายในเครื่อง
  </Card>
  <Card title="ภาพรวม SDK" icon="book-open" href="/th/plugins/sdk-overview">
    เอกสารอ้างอิงแผนผังการนำเข้าและ API การลงทะเบียน
  </Card>
  <Card title="ตัวช่วยรันไทม์" icon="settings" href="/th/plugins/sdk-runtime">
    TTS การค้นหา และเอเจนต์ย่อยผ่าน api.runtime
  </Card>
  <Card title="การทดสอบ" icon="test-tubes" href="/th/plugins/sdk-testing">
    ยูทิลิตีและรูปแบบสำหรับการทดสอบ
  </Card>
  <Card title="ไฟล์ Manifest ของ Plugin" icon="file-json" href="/th/plugins/manifest">
    เอกสารอ้างอิงสคีมา Manifest ฉบับสมบูรณ์
  </Card>
</CardGroup>

## ที่เกี่ยวข้อง

- [ฮุกของ Plugin](/th/plugins/hooks)
- [สถาปัตยกรรม Plugin](/th/plugins/architecture)
