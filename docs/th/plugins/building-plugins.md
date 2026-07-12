---
doc-schema-version: 1
read_when:
    - คุณต้องการสร้าง Plugin ใหม่สำหรับ OpenClaw
    - คุณต้องการคู่มือเริ่มต้นฉบับย่อสำหรับการพัฒนา Plugin
    - คุณกำลังเลือกระหว่างเอกสารเกี่ยวกับช่องทาง ผู้ให้บริการ แบ็กเอนด์ CLI เครื่องมือ หรือฮุก
sidebarTitle: Getting Started
summary: สร้าง Plugin OpenClaw แรกของคุณได้ในไม่กี่นาที
title: การสร้าง Plugin
x-i18n:
    generated_at: "2026-07-12T16:22:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin ช่วยขยายความสามารถของ OpenClaw โดยไม่ต้องเปลี่ยนแปลงแกนหลัก Plugin สามารถเพิ่มช่องทางการรับส่งข้อความ ผู้ให้บริการโมเดล แบ็กเอนด์ CLI ภายในเครื่อง เครื่องมือเอเจนต์ ฮุก ผู้ให้บริการสื่อ หรือความสามารถอื่นที่ Plugin เป็นเจ้าของได้

คุณไม่จำเป็นต้องเพิ่ม Plugin ภายนอกลงในที่เก็บ OpenClaw ให้เผยแพร่แพ็กเกจไปยัง [ClawHub](/clawhub) แล้วผู้ใช้ติดตั้งด้วย:

```bash
openclaw plugins install clawhub:<package-name>
```

ในช่วงเปลี่ยนผ่านการเปิดตัว ข้อกำหนดแพ็กเกจแบบไม่มีคำนำหน้ายังคงติดตั้งจาก npm ใช้คำนำหน้า `clawhub:` เมื่อต้องการให้ ClawHub เป็นผู้แก้ไขตำแหน่งแพ็กเกจ

## ข้อกำหนด

- Node 22.19+, Node 23.11+ หรือ Node 24+ และ `npm` หรือ `pnpm`
- โมดูล TypeScript ESM
- สำหรับการพัฒนา Plugin แบบรวมอยู่ในที่เก็บ ให้โคลนที่เก็บและเรียกใช้ `pnpm install`
  การพัฒนา Plugin จากซอร์สเช็กเอาต์รองรับเฉพาะ pnpm เนื่องจาก OpenClaw ค้นพบ
  Plugin ที่รวมมาให้จากแพ็กเกจเวิร์กสเปซ `extensions/*`

## เลือกรูปแบบ Plugin

<CardGroup cols={2}>
  <Card title="Plugin ช่องทาง" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    เชื่อมต่อ OpenClaw กับแพลตฟอร์มรับส่งข้อความ
  </Card>
  <Card title="Plugin ผู้ให้บริการ" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    เพิ่มผู้ให้บริการโมเดล สื่อ การค้นหา การดึงข้อมูล เสียงพูด หรือการทำงานแบบเรียลไทม์
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
รูปแบบ Plugin ที่สั้นที่สุดซึ่งใช้งานได้จริง และครอบคลุมแพ็กเกจ แมนิเฟสต์ จุดเริ่มต้น และ
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

    Plugin ภายนอกที่เผยแพร่แล้วควรกำหนดให้จุดเริ่มต้นรันไทม์ชี้ไปยังไฟล์ JavaScript
    ที่สร้างแล้ว ดูสัญญาของจุดเริ่มต้นฉบับเต็มได้ที่ [จุดเริ่มต้น SDK](/th/plugins/sdk-entrypoints)

    Plugin ทุกตัวต้องมีแมนิเฟสต์ แม้จะไม่มีการกำหนดค่าก็ตาม เครื่องมือรันไทม์ต้อง
    ปรากฏใน `contracts.tools` เพื่อให้ OpenClaw ค้นพบความเป็นเจ้าของได้โดยไม่ต้อง
    โหลดรันไทม์ของ Plugin ทุกตัวล่วงหน้าโดยไม่จำเป็น กำหนด `activation.onStartup`
    อย่างตั้งใจ ตัวอย่างนี้โหลดเมื่อ Gateway เริ่มทำงาน

    พื้นผิว Plugin ที่โฮสต์เชื่อถือก็ถูกควบคุมด้วยแมนิเฟสต์เช่นกัน และ Plugin ที่ติดตั้งแล้ว
    ต้องประกาศอย่างชัดเจน: `api.registerAgentToolResultMiddleware(...)`
    ต้องระบุรันไทม์เป้าหมายแต่ละรายการใน `contracts.agentToolResultMiddleware`
    และ `api.registerTrustedToolPolicy(...)` ต้องระบุรหัสนโยบายแต่ละรายการใน
    `contracts.trustedToolPolicies` การประกาศเหล่านี้ช่วยให้การตรวจสอบขณะติดตั้ง
    และการลงทะเบียนขณะรันไทม์สอดคล้องกัน

    สำหรับฟิลด์แมนิเฟสต์ทุกฟิลด์ โปรดดู [แมนิเฟสต์ Plugin](/th/plugins/manifest)

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

    หาก Plugin ลงทะเบียนคำสั่ง CLI ให้เรียกใช้คำสั่งนั้นด้วยและยืนยันผลลัพธ์
    เช่น `openclaw demo-plugin ping`

    สำหรับ Plugin ที่รวมมาให้ในที่เก็บนี้ OpenClaw จะค้นพบแพ็กเกจ Plugin
    จากซอร์สเช็กเอาต์ในเวิร์กสเปซ `extensions/*` เรียกใช้การทดสอบแบบเจาะจงที่ใกล้เคียงที่สุด:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="ทดสอบการติดตั้งแพ็กเกจ">
    ก่อนเผยแพร่ Plugin ที่พร้อมเป็นแพ็กเกจ ให้ทดสอบด้วยรูปแบบการติดตั้งเดียวกับที่ผู้ใช้
    จะได้รับ ขั้นแรกให้เพิ่มขั้นตอนการสร้าง กำหนดให้จุดเริ่มต้นรันไทม์ เช่น
    `openclaw.extensions` ชี้ไปยัง JavaScript ที่สร้างแล้ว เช่น `./dist/index.js` และ
    ตรวจสอบให้แน่ใจว่า `npm pack` รวมผลลัพธ์ `dist/` นั้นไว้ด้วย จุดเริ่มต้นที่เป็นซอร์ส
    TypeScript ใช้สำหรับซอร์สเช็กเอาต์และเส้นทางการพัฒนาภายในเครื่องเท่านั้น

    จากนั้นแพ็ก Plugin และติดตั้งไฟล์ tarball ด้วย `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` ใช้โปรเจกต์ npm ต่อ Plugin ที่ OpenClaw จัดการ จึงตรวจพบ
    ข้อผิดพลาดของการพึ่งพารันไทม์ที่การทดสอบจากซอร์สเช็กเอาต์อาจซ่อนไว้ได้ วิธีนี้พิสูจน์
    รูปแบบของแพ็กเกจและการพึ่งพา ไม่ใช่สถานะความน่าเชื่อถืออย่างเป็นทางการที่เชื่อมโยงกับแค็ตตาล็อก
    การนำเข้าขณะรันไทม์ต้องอยู่ใน `dependencies` หรือ `optionalDependencies`;
    การพึ่งพาที่อยู่เฉพาะใน `devDependencies` จะไม่ถูกติดตั้งในโปรเจกต์รันไทม์
    ที่มีการจัดการ

    อย่าใช้การติดตั้งจากไฟล์บีบอัดหรือพาธโดยตรงเป็นหลักฐานขั้นสุดท้ายสำหรับพฤติกรรม
    Plugin ที่เป็นทางการหรือมีสิทธิ์พิเศษ ซอร์สดิบมีประโยชน์สำหรับการแก้จุดบกพร่องภายในเครื่อง
    แต่ไม่ได้พิสูจน์เส้นทางการพึ่งพาแบบเดียวกับการติดตั้งจาก npm หรือ ClawHub หาก
    Plugin ของคุณอาศัยสถานะ Plugin ทางการที่เชื่อถือได้ ให้เพิ่มหลักฐานชุดที่สอง
    ผ่านการติดตั้งทางการที่มีแค็ตตาล็อกรองรับ หรือผ่านเส้นทางแพ็กเกจที่เผยแพร่แล้วซึ่ง
    บันทึกความน่าเชื่อถืออย่างเป็นทางการ ดูรายละเอียดรูทการติดตั้งและความเป็นเจ้าของ
    การพึ่งพาได้ที่ [การแก้ไขการพึ่งพาของ Plugin](/th/plugins/dependency-resolution)

  </Step>

  <Step title="เผยแพร่">
    ตรวจสอบแพ็กเกจก่อนเผยแพร่:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    ตัวอย่างโค้ดแพ็กเกจ ClawHub ฉบับมาตรฐานอยู่ใน `docs/snippets/plugin-publish/`

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

เครื่องมืออาจเป็นแบบจำเป็นหรือแบบเลือกใช้ เครื่องมือที่จำเป็นจะพร้อมใช้งานเสมอเมื่อ
เปิดใช้งาน Plugin ส่วนเครื่องมือแบบเลือกใช้ต้องให้ผู้ใช้ยินยอมอย่างชัดเจนก่อนที่ OpenClaw
จะโหลดรันไทม์ของ Plugin เจ้าของเครื่องมือ

แฟกทอรีเครื่องมือจะได้รับบริบทรันไทม์ที่เชื่อถือได้ รวมถึง `deliveryContext`,
`nativeChannelId` สำหรับการสนทนาบนแพลตฟอร์มที่ใช้งานอยู่เมื่อมีข้อมูล และ
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

เครื่องมือทุกตัวที่ลงทะเบียนด้วย `api.registerTool(...)` ต้องได้รับการประกาศใน
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

ผู้ใช้ยินยอมใช้งานผ่าน `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

เครื่องมือแบบเลือกใช้ควบคุมว่าจะเปิดเผยเครื่องมือให้โมเดลเห็นหรือไม่ ใช้
[คำขอสิทธิ์ของ Plugin](/th/plugins/plugin-permission-requests) เมื่อเครื่องมือ
หรือฮุกควรขอการอนุมัติหลังจากโมเดลเลือกแล้วและก่อนดำเนินการ

ใช้เครื่องมือแบบเลือกใช้สำหรับผลข้างเคียง ไบนารีที่ไม่คุ้นเคย หรือความสามารถที่
ไม่ควรถูกเปิดเผยโดยค่าเริ่มต้น ชื่อเครื่องมือต้องไม่ขัดแย้งกับชื่อเครื่องมือแกนหลัก
รายการที่ขัดแย้งจะถูกข้ามและรายงานในการวินิจฉัย Plugin การลงทะเบียนที่ผิดรูปแบบ
จะถูกข้ามและรายงานในลักษณะเดียวกัน ได้แก่ ไม่มี `name` ที่ไม่เป็นค่าว่าง,
`execute` ไม่ใช่ฟังก์ชัน หรือคำอธิบายเครื่องมือไม่มีออบเจ็กต์ `parameters`

แฟกทอรีเครื่องมือจะได้รับออบเจ็กต์บริบทที่รันไทม์จัดหาให้ ใช้ `ctx.activeModel`
เมื่อเครื่องมือต้องบันทึก แสดง หรือปรับให้เข้ากับโมเดลที่ใช้งานอยู่สำหรับเทิร์นปัจจุบัน
โดยอาจมี `provider`, `modelId` และ `modelRef` ให้ถือว่านี่เป็นข้อมูลเมตารันไทม์
เพื่อให้ข้อมูล ไม่ใช่ขอบเขตความปลอดภัยสำหรับป้องกันผู้ควบคุมภายในเครื่อง โค้ด Plugin
ที่ติดตั้งแล้ว หรือรันไทม์ OpenClaw ที่ถูกแก้ไข เครื่องมือภายในเครื่องที่มีความละเอียดอ่อน
ยังคงควรกำหนดให้ Plugin หรือผู้ควบคุมยินยอมอย่างชัดเจน และปฏิเสธการทำงานโดยค่าเริ่มต้น
เมื่อข้อมูลเมตาของโมเดลที่ใช้งานอยู่หายไปหรือไม่เหมาะสม

แมนิเฟสต์ประกาศความเป็นเจ้าของและการค้นพบ ส่วนการเรียกใช้งานยังคงเรียก
การติดตั้งใช้งานเครื่องมือที่ลงทะเบียนจริง รักษา `toolMetadata.<tool>.optional: true`
ให้สอดคล้องกับ `api.registerTool(..., { optional: true })` เพื่อให้ OpenClaw
ไม่ต้องโหลดรันไทม์ของ Plugin นั้นจนกว่าเครื่องมือจะถูกเพิ่มในรายการอนุญาตอย่างชัดเจน

## รูปแบบการนำเข้า

นำเข้าจากพาธย่อย SDK ที่เจาะจง:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

อย่านำเข้าจากบาร์เรลรูทที่เลิกใช้แล้ว:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

ภายในแพ็กเกจ Plugin ของคุณ ให้ใช้ไฟล์บาร์เรลภายในเครื่อง เช่น `api.ts` และ
`runtime-api.ts` สำหรับการนำเข้าภายใน อย่านำเข้า Plugin ของคุณเองผ่านพาธ SDK
ตัวช่วยเฉพาะผู้ให้บริการควรอยู่ในแพ็กเกจผู้ให้บริการ เว้นแต่รอยต่อดังกล่าวจะเป็นแบบทั่วไปจริง ๆ

เมธอด RPC แบบกำหนดเองของ Gateway เป็นจุดเริ่มต้นขั้นสูง ให้ใช้คำนำหน้า
เฉพาะ Plugin เนมสเปซผู้ดูแลระบบแกนหลัก เช่น `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` และ `update.*` ยังคงเป็น
เนมสเปซสงวนและแก้ไขเป็น `operator.admin` บริดจ์
`openclaw/plugin-sdk/gateway-method-runtime` สงวนไว้สำหรับเส้นทาง HTTP ของ Plugin
ที่ประกาศ `contracts.gatewayMethodDispatch: ["authenticated-request"]`

ดูแผนผังการนำเข้าฉบับเต็มได้ที่ [ภาพรวม SDK ของ Plugin](/th/plugins/sdk-overview)

## รายการตรวจสอบก่อนส่ง

<Check>**package.json** มีข้อมูลเมตา `openclaw` ที่ถูกต้อง</Check>
<Check>มีแมนิเฟสต์ **openclaw.plugin.json** และถูกต้อง</Check>
<Check>จุดเริ่มต้นใช้ `defineChannelPluginEntry` หรือ `definePluginEntry`</Check>
<Check>การนำเข้าทั้งหมดใช้พาธ `plugin-sdk/<subpath>` ที่เจาะจง</Check>
<Check>การนำเข้าภายในใช้โมดูลภายในเครื่อง ไม่ใช่การนำเข้าตัวเองผ่าน SDK</Check>
<Check>การทดสอบผ่าน (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ผ่าน (สำหรับ Plugin ในที่เก็บ)</Check>

## ทดสอบกับรุ่นเบต้า

1. ติดตามรุ่นเผยแพร่ของ [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`) แท็กเบต้ามีลักษณะเช่น `v2026.3.N-beta.1` นอกจากนี้ คุณยังสามารถติดตาม [@openclaw](https://x.com/openclaw) บน X เพื่อรับประกาศรุ่นเผยแพร่ได้
2. ทดสอบ Plugin ของคุณกับแท็กเบต้าทันทีที่ปรากฏ โดยปกติช่วงเวลาก่อนออกรุ่นเสถียรมีเพียงไม่กี่ชั่วโมง
3. หลังจากทดสอบแล้ว ให้โพสต์ในเธรดของ Plugin ของคุณในช่อง Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)) โดยระบุ `all good` หรือรายละเอียดสิ่งที่ขัดข้อง หากยังไม่มีเธรด ให้สร้างขึ้นมา
4. หากมีสิ่งใดขัดข้อง ให้เปิดหรืออัปเดตปัญหาที่มีชื่อว่า `Beta blocker: <plugin-name> - <summary>` และติดป้ายกำกับ `beta-blocker` จากนั้นลิงก์ปัญหานั้นในเธรดของคุณ
5. เปิด PR ไปยัง `main` โดยใช้ชื่อ `fix(<plugin-id>): beta blocker - <summary>` และลิงก์ปัญหาไว้ทั้งใน PR และเธรด Discord ของคุณ ผู้ร่วมพัฒนาไม่สามารถติดป้ายกำกับ PR ได้ ดังนั้นชื่อจึงเป็นสัญญาณฝั่ง PR สำหรับผู้ดูแลและระบบอัตโนมัติ ปัญหาที่ขัดขวางการเผยแพร่และมี PR จะได้รับการผสาน ส่วนปัญหาที่ไม่มี PR อาจถูกปล่อยไปพร้อมรุ่นเผยแพร่อยู่ดี
6. การไม่มีการตอบกลับหมายความว่าทุกอย่างผ่าน หากพลาดช่วงเวลานี้ โดยทั่วไปการแก้ไขของคุณจะรวมอยู่ในรอบถัดไป

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
  <Card title="ไฟล์กำกับ Plugin" icon="file-json" href="/th/plugins/manifest">
    เอกสารอ้างอิงสคีมาไฟล์กำกับฉบับเต็ม
  </Card>
</CardGroup>

## เนื้อหาที่เกี่ยวข้อง

- [ฮุกของ Plugin](/th/plugins/hooks)
- [สถาปัตยกรรม Plugin](/th/plugins/architecture)
