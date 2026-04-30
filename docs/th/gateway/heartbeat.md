---
read_when:
    - การปรับความถี่ของ Heartbeat หรือการส่งข้อความ
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานตามกำหนดเวลา
sidebarTitle: Heartbeat
summary: ข้อความการตรวจสอบ Heartbeat เป็นระยะและกฎการแจ้งเตือน
title: Heartbeat
x-i18n:
    generated_at: "2026-04-30T09:53:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bafae7cafb9163015a112c074d36ab070c71d1d7ba1c7c0834e6720521f4275
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat เทียบกับ Cron?** ดูคำแนะนำว่าควรใช้แต่ละอย่างเมื่อใดได้ที่ [ระบบอัตโนมัติและงาน](/th/automation)
</Note>

Heartbeat เรียกใช้ **รอบการทำงานของเอเจนต์แบบเป็นระยะ** ในเซสชันหลัก เพื่อให้โมเดลแจ้งสิ่งที่ต้องให้ความสนใจได้โดยไม่ส่งข้อความรบกวนคุณมากเกินไป

Heartbeat คือรอบการทำงานในเซสชันหลักตามกำหนดเวลา โดย **ไม่** สร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks) ระเบียนงานมีไว้สำหรับงานที่แยกออกไป (การรัน ACP, subagents, งาน Cron แบบแยกโดดเดี่ยว)

การแก้ไขปัญหา: [งานตามกำหนดเวลา](/th/automation/cron-jobs#troubleshooting)

## เริ่มต้นอย่างรวดเร็ว (ผู้เริ่มต้น)

<Steps>
  <Step title="เลือกความถี่">
    เปิดใช้ Heartbeat ไว้ (ค่าเริ่มต้นคือ `30m` หรือ `1h` สำหรับการยืนยันตัวตนด้วย Anthropic OAuth/token รวมถึงการใช้ Claude CLI ซ้ำ) หรือตั้งความถี่ของคุณเอง
  </Step>
  <Step title="เพิ่ม HEARTBEAT.md (ไม่บังคับ)">
    สร้างเช็กลิสต์ `HEARTBEAT.md` ขนาดเล็ก หรือบล็อก `tasks:` ในพื้นที่ทำงานของเอเจนต์
  </Step>
  <Step title="กำหนดว่าข้อความ Heartbeat ควรส่งไปที่ใด">
    `target: "none"` คือค่าเริ่มต้น; ตั้งค่า `target: "last"` เพื่อกำหนดเส้นทางไปยังผู้ติดต่อล่าสุด
  </Step>
  <Step title="การปรับแต่งเพิ่มเติม">
    - เปิดใช้การส่งเหตุผลของ Heartbeat เพื่อความโปร่งใส
    - ใช้บริบทบูตสแตรปแบบเบา หากการรัน Heartbeat ต้องการเพียง `HEARTBEAT.md`
    - เปิดใช้เซสชันแบบแยกโดดเดี่ยวเพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมดในแต่ละ Heartbeat
    - จำกัด Heartbeat ให้ทำงานเฉพาะช่วงเวลาที่ใช้งานอยู่ (เวลาท้องถิ่น)

  </Step>
</Steps>

ตัวอย่างการกำหนดค่า:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## ค่าเริ่มต้น

- ช่วงเวลา: `30m` (หรือ `1h` เมื่อโหมดการยืนยันตัวตนที่ตรวจพบคือ Anthropic OAuth/token รวมถึงการใช้ Claude CLI ซ้ำ) ตั้งค่า `agents.defaults.heartbeat.every` หรือ `agents.list[].heartbeat.every` รายเอเจนต์; ใช้ `0m` เพื่อปิดใช้
- เนื้อหาพรอมป์ (กำหนดค่าได้ผ่าน `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- พรอมป์ Heartbeat จะถูกส่ง **ตามตัวอักษร** เป็นข้อความของผู้ใช้ พรอมป์ระบบจะมีส่วน "Heartbeat" เฉพาะเมื่อเปิดใช้ Heartbeat สำหรับเอเจนต์เริ่มต้น และการรันนั้นถูกทำเครื่องหมายไว้ภายใน
- เมื่อปิดใช้ Heartbeat ด้วย `0m` การรันปกติจะละเว้น `HEARTBEAT.md` จากบริบทบูตสแตรปด้วย เพื่อไม่ให้โมเดลเห็นคำสั่งที่ใช้เฉพาะกับ Heartbeat
- ชั่วโมงที่ใช้งานอยู่ (`heartbeat.activeHours`) จะถูกตรวจสอบตามเขตเวลาที่กำหนดค่าไว้ นอกช่วงเวลาดังกล่าว Heartbeat จะถูกข้ามจนถึง tick ถัดไปที่อยู่ภายในช่วงเวลา
- Heartbeat จะเลื่อนออกไปโดยอัตโนมัติขณะที่งาน Cron กำลังทำงานหรืออยู่ในคิว ตั้งค่า `heartbeat.skipWhenBusy: true` เพื่อเลื่อนออกไปเมื่อ lane อื่นยุ่งเพิ่มเติมด้วย (งาน subagent หรืองานคำสั่งซ้อนกัน); สิ่งนี้มีประโยชน์สำหรับ Ollama ในเครื่องและโฮสต์ single-runtime อื่นที่มีทรัพยากรจำกัด

## พรอมป์ Heartbeat มีไว้เพื่ออะไร

พรอมป์เริ่มต้นตั้งใจให้ครอบคลุมกว้าง:

- **งานเบื้องหลัง**: "Consider outstanding tasks" กระตุ้นให้เอเจนต์ตรวจสอบสิ่งที่ต้องติดตาม (กล่องขาเข้า, ปฏิทิน, ตัวเตือน, งานที่อยู่ในคิว) และแจ้งสิ่งที่เร่งด่วน
- **การทักทายมนุษย์**: "Checkup sometimes on your human during day time" กระตุ้นให้ส่งข้อความเบา ๆ เป็นครั้งคราว เช่น "มีอะไรที่คุณต้องการไหม?" แต่หลีกเลี่ยงการรบกวนช่วงกลางคืนโดยใช้เขตเวลาท้องถิ่นที่คุณกำหนดค่าไว้ (ดู [เขตเวลา](/th/concepts/timezone))

Heartbeat สามารถตอบสนองต่องาน [เบื้องหลัง](/th/automation/tasks) ที่เสร็จแล้วได้ แต่การรัน Heartbeat เองจะไม่สร้างระเบียนงาน

หากคุณต้องการให้ Heartbeat ทำสิ่งที่เจาะจงมาก (เช่น "check Gmail PubSub stats" หรือ "verify gateway health") ให้ตั้งค่า `agents.defaults.heartbeat.prompt` (หรือ `agents.list[].heartbeat.prompt`) เป็นเนื้อหาแบบกำหนดเอง (ส่งตามตัวอักษร)

## สัญญาของการตอบกลับ

- หากไม่มีสิ่งใดต้องให้ความสนใจ ให้ตอบด้วย **`HEARTBEAT_OK`**
- ระหว่างการรัน Heartbeat, OpenClaw จะถือว่า `HEARTBEAT_OK` เป็น ack เมื่อปรากฏที่ **จุดเริ่มต้นหรือจุดสิ้นสุด** ของการตอบกลับ token จะถูกตัดออก และการตอบกลับจะถูกทิ้งหากเนื้อหาที่เหลือมีความยาว **≤ `ackMaxChars`** (ค่าเริ่มต้น: 300)
- หาก `HEARTBEAT_OK` ปรากฏใน **ตอนกลาง** ของการตอบกลับ จะไม่ถูกปฏิบัติเป็นพิเศษ
- สำหรับการแจ้งเตือน **ห้าม** ใส่ `HEARTBEAT_OK`; ให้ส่งกลับเฉพาะข้อความแจ้งเตือน

นอก Heartbeat, `HEARTBEAT_OK` ที่หลุดมาอยู่ต้น/ท้ายข้อความจะถูกตัดออกและบันทึก log; ข้อความที่มีเพียง `HEARTBEAT_OK` จะถูกทิ้ง

## การกำหนดค่า

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### ขอบเขตและลำดับความสำคัญ

- `agents.defaults.heartbeat` ตั้งค่าพฤติกรรม Heartbeat ทั่วโลก
- `agents.list[].heartbeat` ผสานทับด้านบน; หากเอเจนต์ใดมีบล็อก `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะรัน Heartbeat
- `channels.defaults.heartbeat` ตั้งค่าเริ่มต้นด้านการมองเห็นสำหรับทุกช่อง
- `channels.<channel>.heartbeat` แทนที่ค่าเริ่มต้นของช่อง
- `channels.<channel>.accounts.<id>.heartbeat` (ช่องแบบหลายบัญชี) แทนที่การตั้งค่ารายช่อง

### Heartbeat รายเอเจนต์

หากรายการ `agents.list[]` ใดมีบล็อก `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะรัน Heartbeat บล็อกรายเอเจนต์จะผสานทับ `agents.defaults.heartbeat` (ดังนั้นคุณจึงตั้งค่าเริ่มต้นร่วมกันครั้งเดียว แล้วแทนที่ต่อเอเจนต์ได้)

ตัวอย่าง: เอเจนต์สองตัว โดยมีเพียงเอเจนต์ตัวที่สองที่รัน Heartbeat

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### ตัวอย่างชั่วโมงที่ใช้งานอยู่

จำกัด Heartbeat ให้อยู่ในเวลาทำการของเขตเวลาที่ระบุ:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

นอกช่วงเวลานี้ (ก่อน 9 โมงเช้าหรือหลัง 4 ทุ่มตามเวลาฝั่งตะวันออก) Heartbeat จะถูกข้าม tick ตามกำหนดการถัดไปที่อยู่ภายในช่วงเวลาจะทำงานตามปกติ

### การตั้งค่าแบบ 24/7

หากคุณต้องการให้ Heartbeat ทำงานทั้งวัน ให้ใช้รูปแบบใดรูปแบบหนึ่งต่อไปนี้:

- ละเว้น `activeHours` ทั้งหมด (ไม่มีข้อจำกัดช่วงเวลา; นี่คือพฤติกรรมเริ่มต้น)
- ตั้งค่าช่วงเวลาทั้งวัน: `activeHours: { start: "00:00", end: "24:00" }`

<Warning>
อย่าตั้งเวลา `start` และ `end` เป็นเวลาเดียวกัน (เช่น `08:00` ถึง `08:00`) ระบบจะถือว่าเป็นช่วงเวลาที่มีความกว้างเป็นศูนย์ ดังนั้น Heartbeat จะถูกข้ามเสมอ
</Warning>

### ตัวอย่างหลายบัญชี

ใช้ `accountId` เพื่อกำหนดเป้าหมายบัญชีเฉพาะบนช่องแบบหลายบัญชี เช่น Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### หมายเหตุของฟิลด์

<ParamField path="every" type="string">
  ช่วงเวลา Heartbeat (สตริงระยะเวลา; หน่วยเริ่มต้น = นาที)
</ParamField>
<ParamField path="model" type="string">
  การแทนที่โมเดลที่ไม่บังคับสำหรับการรัน Heartbeat (`provider/model`)
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  เมื่อเปิดใช้ จะส่งข้อความ `Reasoning:` แยกต่างหากด้วยเมื่อมี (รูปแบบเดียวกับ `/reasoning on`)
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  เมื่อเป็น true การรัน Heartbeat จะใช้บริบทบูตสแตรปแบบเบา และเก็บไว้เฉพาะ `HEARTBEAT.md` จากไฟล์บูตสแตรปของพื้นที่ทำงาน
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  เมื่อเป็น true แต่ละ Heartbeat จะทำงานในเซสชันใหม่ที่ไม่มีประวัติการสนทนาก่อนหน้า ใช้รูปแบบการแยกโดดเดี่ยวเดียวกับ Cron `sessionTarget: "isolated"` ลดต้นทุน token ต่อ Heartbeat ลงอย่างมาก ใช้ร่วมกับ `lightContext: true` เพื่อประหยัดสูงสุด การกำหนดเส้นทางการส่งยังคงใช้บริบทเซสชันหลัก
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปเมื่อ lane อื่นยุ่งเพิ่มเติม: งาน subagent หรืองานคำสั่งซ้อนกัน lane ของ Cron จะเลื่อน Heartbeat เสมอ แม้ไม่มี flag นี้ เพื่อให้โฮสต์โมเดลในเครื่องไม่รันพรอมป์ Cron และ Heartbeat พร้อมกัน
</ParamField>
<ParamField path="session" type="string">
  คีย์เซสชันที่ไม่บังคับสำหรับการรัน Heartbeat

- `main` (ค่าเริ่มต้น): เซสชันหลักของเอเจนต์
- คีย์เซสชันที่ระบุชัดเจน (คัดลอกจาก `openclaw sessions --json` หรือ [CLI เซสชัน](/th/cli/sessions))
- รูปแบบคีย์เซสชัน: ดู [เซสชัน](/th/concepts/session) และ [กลุ่ม](/th/channels/groups)

</ParamField>
<ParamField path="target" type="string">
- `last`: ส่งไปยังช่องภายนอกที่ใช้ล่าสุด
- ช่องที่ระบุชัดเจน: ช่องหรือ Plugin id ใด ๆ ที่กำหนดค่าไว้ เช่น `discord`, `matrix`, `telegram`, หรือ `whatsapp`
- `none` (ค่าเริ่มต้น): รัน Heartbeat แต่ **ไม่ส่ง** ออกภายนอก

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  ควบคุมพฤติกรรมการส่งแบบ direct/DM `allow`: อนุญาตการส่ง Heartbeat แบบ direct/DM `block`: ระงับการส่ง direct/DM (`reason=dm-blocked`)

</ParamField>
<ParamField path="to" type="string">
  การแทนที่ผู้รับที่ไม่บังคับ (id เฉพาะช่อง เช่น E.164 สำหรับ WhatsApp หรือ Telegram chat id) สำหรับ topic/thread ของ Telegram ให้ใช้ `<chatId>:topic:<messageThreadId>`

</ParamField>
<ParamField path="accountId" type="string">
  account id ที่ไม่บังคับสำหรับช่องแบบหลายบัญชี เมื่อ `target: "last"` account id จะถูกใช้กับช่องล่าสุดที่ resolve ได้หากช่องนั้นรองรับบัญชี มิฉะนั้นจะถูกละเว้น หาก account id ไม่ตรงกับบัญชีที่กำหนดค่าไว้สำหรับช่องที่ resolve ได้ การส่งจะถูกข้าม

</ParamField>
<ParamField path="prompt" type="string">
  แทนที่เนื้อหาพรอมป์เริ่มต้น (ไม่ผสาน)

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  จำนวนอักขระสูงสุดที่อนุญาตหลัง `HEARTBEAT_OK` ก่อนการส่ง

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  เมื่อเป็น true จะระงับเพย์โหลดคำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat

</ParamField>
<ParamField path="activeHours" type="object">
  จำกัดการรัน Heartbeat ให้อยู่ในช่วงเวลา Object ที่มี `start` (HH:MM, รวมเวลานี้; ใช้ `00:00` สำหรับจุดเริ่มต้นของวัน), `end` (HH:MM ไม่รวมเวลานี้; อนุญาต `24:00` สำหรับจุดสิ้นสุดของวัน), และ `timezone` ที่ไม่บังคับ

- ละไว้หรือ `"user"`: ใช้ `agents.defaults.userTimezone` ของคุณหากตั้งไว้ มิฉะนั้นจะ fallback ไปใช้เขตเวลาของระบบโฮสต์
- `"local"`: ใช้เขตเวลาของระบบโฮสต์เสมอ
- ตัวระบุ IANA ใดๆ (เช่น `America/New_York`): ใช้โดยตรง; หากไม่ถูกต้อง จะ fallback ไปใช้พฤติกรรม `"user"` ข้างต้น
- `start` และ `end` ต้องไม่เท่ากันสำหรับหน้าต่างเวลาที่ใช้งานอยู่; ค่าที่เท่ากันจะถือว่าเป็นความกว้างศูนย์ (อยู่นอกหน้าต่างเสมอ)
- นอกหน้าต่างเวลาที่ใช้งาน Heartbeat จะถูกข้ามจนกว่าจะถึง tick ถัดไปภายในหน้าต่าง

</ParamField>

## พฤติกรรมการส่งมอบ

<AccordionGroup>
  <Accordion title="Session and target routing">
    - Heartbeat จะรันในเซสชันหลักของ agent ตามค่าเริ่มต้น (`agent:<id>:<mainKey>`) หรือ `global` เมื่อ `session.scope = "global"` ตั้งค่า `session` เพื่อแทนที่เป็นเซสชันของช่องทางเฉพาะ (Discord/WhatsApp/ฯลฯ)
    - `session` มีผลเฉพาะกับบริบทการรัน; การส่งมอบถูกควบคุมโดย `target` และ `to`
    - หากต้องการส่งมอบไปยังช่องทาง/ผู้รับเฉพาะ ให้ตั้งค่า `target` + `to` เมื่อใช้ `target: "last"` การส่งมอบจะใช้ช่องทางภายนอกล่าสุดสำหรับเซสชันนั้น
    - การส่งมอบ Heartbeat อนุญาตเป้าหมายแบบ direct/DM ตามค่าเริ่มต้น ตั้งค่า `directPolicy: "block"` เพื่อระงับการส่งไปยังเป้าหมาย direct แต่ยังคงรันรอบ Heartbeat
    - หากคิวหลัก, lane ของเซสชันเป้าหมาย, lane ของ cron หรือ cron job ที่กำลังทำงานอยู่ไม่ว่าง Heartbeat จะถูกข้ามและลองใหม่ภายหลัง
    - หาก `skipWhenBusy: true` subagent และ lane ซ้อนกันจะเลื่อนการรัน Heartbeat ออกไปด้วย
    - หาก `target` resolve แล้วไม่มีปลายทางภายนอก การรันยังคงเกิดขึ้นแต่จะไม่มีการส่งข้อความออก

  </Accordion>
  <Accordion title="Visibility and skip behavior">
    - หาก `showOk`, `showAlerts`, และ `useIndicator` ถูกปิดทั้งหมด การรันจะถูกข้ามตั้งแต่ต้นด้วย `reason=alerts-disabled`
    - หากปิดเฉพาะการส่งมอบการแจ้งเตือน OpenClaw ยังคงรัน Heartbeat, อัปเดต timestamp ของงานที่ถึงกำหนด, กู้คืน timestamp ว่างของเซสชัน และระงับเพย์โหลดการแจ้งเตือนภายนอกได้
    - หากเป้าหมาย Heartbeat ที่ resolve แล้วรองรับสถานะกำลังพิมพ์ OpenClaw จะแสดงสถานะกำลังพิมพ์ขณะการรัน Heartbeat ทำงานอยู่ สิ่งนี้ใช้เป้าหมายเดียวกับที่ Heartbeat จะส่งเอาต์พุตแชตไปให้ และถูกปิดใช้งานด้วย `typingMode: "never"`

  </Accordion>
  <Accordion title="Session lifecycle and audit">
    - การตอบกลับที่มีเฉพาะ Heartbeat **ไม่**ทำให้เซสชันยังคงอยู่ต่อ metadata ของ Heartbeat อาจอัปเดตแถวเซสชัน แต่การหมดอายุเพราะว่างจะใช้ `lastInteractionAt` จากข้อความผู้ใช้/ช่องทางจริงล่าสุด และการหมดอายุรายวันจะใช้ `sessionStartedAt`
    - ประวัติใน Control UI และ WebChat จะซ่อน prompt ของ Heartbeat และการรับทราบแบบ OK-only transcript ของเซสชันเบื้องหลังยังคงมีรอบเหล่านั้นได้สำหรับ audit/replay
    - [background tasks](/th/automation/tasks) ที่แยกออกมาสามารถ enqueue system event และปลุก Heartbeat เมื่อเซสชันหลักควรรับรู้บางอย่างอย่างรวดเร็ว การปลุกนั้นไม่ได้ทำให้การรัน Heartbeat กลายเป็น background task

  </Accordion>
</AccordionGroup>

## การควบคุมการมองเห็น

ตามค่าเริ่มต้น การรับทราบ `HEARTBEAT_OK` จะถูกระงับขณะที่เนื้อหาการแจ้งเตือนถูกส่งมอบ คุณสามารถปรับค่านี้ต่อช่องทางหรือต่อบัญชีได้:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

ลำดับความสำคัญ: ต่อบัญชี → ต่อช่องทาง → ค่าเริ่มต้นของช่องทาง → ค่าเริ่มต้นในตัว

### แต่ละ flag ทำอะไร

- `showOk`: ส่งการรับทราบ `HEARTBEAT_OK` เมื่อ model ส่งคืนการตอบกลับแบบ OK-only
- `showAlerts`: ส่งเนื้อหาการแจ้งเตือนเมื่อ model ส่งคืนการตอบกลับที่ไม่ใช่ OK
- `useIndicator`: emit event ตัวบ่งชี้สำหรับพื้นผิวสถานะ UI

หากทั้ง **สามรายการ** เป็น false ทั้งหมด OpenClaw จะข้ามการรัน Heartbeat ทั้งหมด (ไม่มีการเรียก model)

### ตัวอย่างต่อช่องทางเทียบกับต่อบัญชี

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### รูปแบบที่พบบ่อย

| เป้าหมาย                                      | Config                                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| พฤติกรรมเริ่มต้น (OK แบบเงียบ, เปิดการแจ้งเตือน) | _(ไม่ต้องมี config)_                                                                     |
| เงียบทั้งหมด (ไม่มีข้อความ, ไม่มีตัวบ่งชี้)       | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| เฉพาะตัวบ่งชี้ (ไม่มีข้อความ)                    | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK ในช่องทางเดียวเท่านั้น                       | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (ไม่บังคับ)

หากมีไฟล์ `HEARTBEAT.md` อยู่ใน workspace prompt เริ่มต้นจะบอกให้ agent อ่านไฟล์นั้น คิดว่าเป็น "รายการตรวจสอบ Heartbeat" ของคุณ: เล็ก คงที่ และปลอดภัยที่จะรวมทุก 30 นาที

ในการรันปกติ `HEARTBEAT.md` จะถูก inject เฉพาะเมื่อเปิดใช้คำแนะนำ Heartbeat สำหรับ agent เริ่มต้น การปิด cadence ของ Heartbeat ด้วย `0m` หรือการตั้งค่า `includeSystemPromptSection: false` จะละเว้นไฟล์นี้จากบริบท bootstrap ปกติ

หาก `HEARTBEAT.md` มีอยู่แต่แทบว่างเปล่า (มีเพียงบรรทัดว่างและหัวข้อ markdown เช่น `# Heading`) OpenClaw จะข้ามการรัน Heartbeat เพื่อประหยัดการเรียก API การข้ามนั้นจะถูกรายงานเป็น `reason=empty-heartbeat-file` หากไฟล์หายไป Heartbeat ยังรันอยู่และ model จะตัดสินใจว่าจะทำอะไร

ทำให้เล็กมาก (รายการตรวจสอบหรือคำเตือนสั้นๆ) เพื่อหลีกเลี่ยง prompt ที่บวมเกินไป

ตัวอย่าง `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### บล็อก `tasks:`

`HEARTBEAT.md` ยังรองรับบล็อก `tasks:` แบบมีโครงสร้างขนาดเล็กสำหรับการตรวจสอบตามช่วงเวลาภายใน Heartbeat เอง

ตัวอย่าง:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Behavior">
    - OpenClaw parse บล็อก `tasks:` และตรวจสอบแต่ละงานเทียบกับ `interval` ของงานนั้นเอง
    - เฉพาะงานที่ **ถึงกำหนด** เท่านั้นที่จะถูกรวมใน prompt ของ Heartbeat สำหรับ tick นั้น
    - หากไม่มีงานที่ถึงกำหนด Heartbeat จะถูกข้ามทั้งหมด (`reason=no-tasks-due`) เพื่อหลีกเลี่ยงการเรียก model โดยเปล่าประโยชน์
    - เนื้อหาที่ไม่ใช่งานใน `HEARTBEAT.md` จะถูกเก็บไว้และผนวกเป็นบริบทเพิ่มเติมหลังรายการงานที่ถึงกำหนด
    - timestamp การรันล่าสุดของงานจะถูกจัดเก็บในสถานะเซสชัน (`heartbeatTaskState`) ดังนั้นช่วงเวลาจะยังคงอยู่หลังการรีสตาร์ตปกติ
    - timestamp ของงานจะถูกเลื่อนต่อเมื่อการรัน Heartbeat ทำเส้นทางการตอบกลับปกติเสร็จสิ้นแล้วเท่านั้น การรันที่ถูกข้าม `empty-heartbeat-file` / `no-tasks-due` จะไม่ทำเครื่องหมายว่างานเสร็จสมบูรณ์

  </Accordion>
</AccordionGroup>

โหมดงานมีประโยชน์เมื่อคุณต้องการให้ไฟล์ Heartbeat ไฟล์เดียวเก็บการตรวจสอบเป็นระยะหลายรายการโดยไม่ต้องจ่ายต้นทุนสำหรับทั้งหมดในทุก tick

### agent สามารถอัปเดต HEARTBEAT.md ได้ไหม?

ได้ — หากคุณขอให้ทำ

`HEARTBEAT.md` เป็นเพียงไฟล์ปกติใน workspace ของ agent ดังนั้นคุณสามารถบอก agent (ในแชตปกติ) ได้ เช่น:

- "อัปเดต `HEARTBEAT.md` เพื่อเพิ่มการตรวจสอบปฏิทินรายวัน"
- "เขียน `HEARTBEAT.md` ใหม่ให้สั้นลงและเน้นการติดตามผลในกล่องจดหมาย"

หากคุณต้องการให้สิ่งนี้เกิดขึ้นเชิงรุก คุณยังสามารถใส่บรรทัดที่ชัดเจนใน prompt Heartbeat ของคุณ เช่น: "หากรายการตรวจสอบเริ่มล้าสมัย ให้อัปเดต HEARTBEAT.md ด้วยรายการที่ดีกว่า"

<Warning>
อย่าใส่ secret (API key, หมายเลขโทรศัพท์, token ส่วนตัว) ลงใน `HEARTBEAT.md` — ไฟล์นี้จะกลายเป็นส่วนหนึ่งของบริบท prompt
</Warning>

## การปลุกด้วยตนเอง (ตามต้องการ)

คุณสามารถ enqueue system event และ trigger Heartbeat ทันทีด้วย:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

หากมี agent หลายตัวที่กำหนดค่า `heartbeat` ไว้ การปลุกด้วยตนเองจะรัน Heartbeat ของ agent แต่ละตัวเหล่านั้นทันที

ใช้ `--mode next-heartbeat` เพื่อรอ tick ที่กำหนดเวลาไว้ถัดไป

## การส่งมอบ reasoning (ไม่บังคับ)

ตามค่าเริ่มต้น Heartbeat จะส่งมอบเฉพาะเพย์โหลด "answer" สุดท้าย

หากคุณต้องการความโปร่งใส ให้เปิดใช้:

- `agents.defaults.heartbeat.includeReasoning: true`

เมื่อเปิดใช้ Heartbeat จะส่งมอบข้อความแยกอีกข้อความที่ขึ้นต้นด้วย `Reasoning:` ด้วย (รูปแบบเดียวกับ `/reasoning on`) สิ่งนี้อาจมีประโยชน์เมื่อ agent กำลังจัดการหลายเซสชัน/codex และคุณต้องการดูว่าเหตุใดจึงตัดสินใจ ping คุณ — แต่อาจรั่วไหลรายละเอียดภายในมากกว่าที่คุณต้องการได้เช่นกัน แนะนำให้ปิดไว้ในแชตกลุ่ม

## การตระหนักถึงต้นทุน

Heartbeat รันเป็นรอบ agent เต็มรูปแบบ ช่วงเวลาที่สั้นลงใช้ token มากขึ้น เพื่อลดต้นทุน:

- ใช้ `isolatedSession: true` เพื่อหลีกเลี่ยงการส่งประวัติการสนทนาเต็มรูปแบบ (~100K token ลดลงเหลือ ~2-5K ต่อการรัน)
- ใช้ `lightContext: true` เพื่อจำกัดไฟล์ bootstrap ให้เหลือแค่ `HEARTBEAT.md`
- ตั้งค่า `model` ที่ถูกกว่า (เช่น `ollama/llama3.2:1b`)
- ทำให้ `HEARTBEAT.md` เล็ก
- ใช้ `target: "none"` หากคุณต้องการเฉพาะการอัปเดตสถานะภายใน

## บริบทล้นหลัง Heartbeat

หาก Heartbeat ใช้ model local ที่เล็กกว่า เช่น model Ollama ที่มีหน้าต่าง 32k และรอบเซสชันหลักถัดไปรายงานว่าบริบทล้น ให้ตรวจสอบว่า Heartbeat ก่อนหน้าทิ้งเซสชันไว้บน model Heartbeat หรือไม่ ข้อความ reset ของ OpenClaw จะระบุเรื่องนี้เมื่อ model runtime ล่าสุดตรงกับ `heartbeat.model` ที่กำหนดค่าไว้

ใช้ `isolatedSession: true` เพื่อรัน Heartbeat ในเซสชันใหม่ รวมกับ `lightContext: true` เพื่อให้ prompt เล็กที่สุด หรือเลือก model Heartbeat ที่มีหน้าต่างบริบทใหญ่พอสำหรับเซสชันที่ใช้ร่วมกัน

## ที่เกี่ยวข้อง

- [Automation & Tasks](/th/automation) — กลไก automation ทั้งหมดโดยสรุป
- [Background Tasks](/th/automation/tasks) — วิธีติดตามงานที่แยกออกมา
- [Timezone](/th/concepts/timezone) — วิธีที่ timezone ส่งผลต่อการกำหนดเวลา Heartbeat
- [Troubleshooting](/th/automation/cron-jobs#troubleshooting) — การ debug ปัญหา automation
