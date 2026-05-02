---
read_when:
    - การปรับจังหวะ Heartbeat หรือการส่งข้อความ
    - การเลือกใช้ Heartbeat หรือ Cron สำหรับงานตามกำหนดเวลา
sidebarTitle: Heartbeat
summary: ข้อความการโพลของ Heartbeat และกฎการแจ้งเตือน
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T20:44:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20ce96feb2512312ec8dc5ef3b6722ed552f0a03c55b80a9c3f5b42594ab0d36
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat เทียบกับ Cron?** ดูคำแนะนำว่าเมื่อใดควรใช้แต่ละแบบได้ที่ [ระบบอัตโนมัติและงาน](/th/automation)
</Note>

Heartbeat เรียกใช้ **รอบการทำงานของเอเจนต์เป็นระยะ** ในเซสชันหลัก เพื่อให้โมเดลสามารถแจ้งสิ่งที่ต้องการความสนใจได้โดยไม่ส่งข้อความรบกวนคุณมากเกินไป

Heartbeat เป็นรอบการทำงานตามกำหนดเวลาในเซสชันหลัก — ไม่ได้สร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks) ระเบียนงานมีไว้สำหรับงานที่แยกออกไปทำต่างหาก (การรัน ACP, เอเจนต์ย่อย, งาน Cron แบบแยกโดดเดี่ยว)

การแก้ไขปัญหา: [งานตามกำหนดเวลา](/th/automation/cron-jobs#troubleshooting)

## เริ่มต้นอย่างรวดเร็ว (ผู้เริ่มต้น)

<Steps>
  <Step title="เลือกจังหวะเวลา">
    เปิดใช้ heartbeats ไว้ต่อไป (ค่าเริ่มต้นคือ `30m` หรือ `1h` สำหรับการยืนยันตัวตนด้วย Anthropic OAuth/token รวมถึงการใช้ Claude CLI ซ้ำ) หรือตั้งจังหวะเวลาของคุณเอง
  </Step>
  <Step title="เพิ่ม HEARTBEAT.md (ไม่บังคับ)">
    สร้างเช็กลิสต์ `HEARTBEAT.md` ขนาดเล็ก หรือบล็อก `tasks:` ในพื้นที่ทำงานของเอเจนต์
  </Step>
  <Step title="ตัดสินใจว่าข้อความ heartbeat ควรส่งไปที่ใด">
    `target: "none"` เป็นค่าเริ่มต้น; ตั้งค่า `target: "last"` เพื่อส่งไปยังผู้ติดต่อล่าสุด
  </Step>
  <Step title="การปรับแต่งเพิ่มเติม">
    - เปิดใช้การส่งเหตุผลของ heartbeat เพื่อความโปร่งใส
    - ใช้บริบท bootstrap แบบเบา หากการรัน heartbeat ต้องใช้เพียง `HEARTBEAT.md`
    - เปิดใช้เซสชันแบบแยกโดดเดี่ยวเพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมดในแต่ละ heartbeat
    - จำกัด heartbeats ให้อยู่ในช่วงเวลาที่ใช้งาน (เวลาท้องถิ่น)

  </Step>
</Steps>

ตัวอย่าง config:

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

- ช่วงเวลา: `30m` (หรือ `1h` เมื่อโหมดการยืนยันตัวตนที่ตรวจพบคือ Anthropic OAuth/token auth รวมถึงการใช้ Claude CLI ซ้ำ) ตั้งค่า `agents.defaults.heartbeat.every` หรือ `agents.list[].heartbeat.every` รายเอเจนต์; ใช้ `0m` เพื่อปิดใช้
- เนื้อหา prompt (กำหนดค่าได้ผ่าน `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- prompt ของ heartbeat จะถูกส่ง **ตามตัวอักษร** เป็นข้อความจากผู้ใช้ system prompt จะมีส่วน "Heartbeat" เฉพาะเมื่อเปิดใช้ heartbeats สำหรับเอเจนต์เริ่มต้น และการรันนั้นถูกทำเครื่องหมายไว้ภายใน
- เมื่อปิดใช้ heartbeats ด้วย `0m` การรันปกติจะละเว้น `HEARTBEAT.md` จากบริบท bootstrap ด้วย เพื่อไม่ให้โมเดลเห็นคำสั่งเฉพาะ heartbeat
- ชั่วโมงที่ใช้งาน (`heartbeat.activeHours`) จะตรวจสอบในเขตเวลาที่กำหนดค่าไว้อยู่ นอกช่วงเวลานั้น heartbeats จะถูกข้ามจนกว่าจะถึง tick ถัดไปที่อยู่ภายในช่วงเวลา
- Heartbeats จะเลื่อนออกไปโดยอัตโนมัติขณะมีงาน Cron กำลังทำงานหรืออยู่ในคิว ตั้งค่า `heartbeat.skipWhenBusy: true` เพื่อเลื่อนในเลนที่ยุ่งเพิ่มเติม (งานของเอเจนต์ย่อยหรืองานคำสั่งซ้อน) ด้วย; สิ่งนี้มีประโยชน์สำหรับ Ollama ภายในเครื่องและโฮสต์ single-runtime อื่นที่มีข้อจำกัด

## prompt ของ heartbeat มีไว้เพื่ออะไร

prompt เริ่มต้นตั้งใจให้ครอบคลุมกว้าง:

- **งานเบื้องหลัง**: "Consider outstanding tasks" กระตุ้นให้เอเจนต์ทบทวนรายการที่ต้องติดตาม (กล่องจดหมาย ปฏิทิน การเตือน งานที่อยู่ในคิว) และแจ้งสิ่งที่เร่งด่วน
- **การเช็กอินกับมนุษย์**: "Checkup sometimes on your human during day time" กระตุ้นให้ส่งข้อความสั้นๆ เป็นครั้งคราวว่า "มีอะไรที่ต้องการไหม?" แต่หลีกเลี่ยงการรบกวนตอนกลางคืนโดยใช้เขตเวลาท้องถิ่นที่คุณกำหนดค่าไว้ (ดู [เขตเวลา](/th/concepts/timezone))

Heartbeat สามารถตอบสนองต่องาน [เบื้องหลัง](/th/automation/tasks) ที่เสร็จแล้วได้ แต่การรัน heartbeat เองจะไม่สร้างระเบียนงาน

หากคุณต้องการให้ heartbeat ทำสิ่งที่เฉพาะเจาะจงมาก (เช่น "check Gmail PubSub stats" หรือ "verify gateway health") ให้ตั้งค่า `agents.defaults.heartbeat.prompt` (หรือ `agents.list[].heartbeat.prompt`) เป็นเนื้อหาแบบกำหนดเอง (ส่งตามตัวอักษร)

## สัญญาการตอบกลับ

- หากไม่มีสิ่งใดต้องการความสนใจ ให้ตอบด้วย **`HEARTBEAT_OK`**
- การรัน heartbeat ที่ใช้เครื่องมือได้อาจเรียก `heartbeat_respond` พร้อม `notify: false` เพื่อไม่ให้มีการอัปเดตที่มองเห็นได้ หรือ `notify: true` พร้อม `notificationText` สำหรับการแจ้งเตือน เมื่อมีอยู่ การตอบกลับจากเครื่องมือแบบมีโครงสร้างจะมีลำดับความสำคัญเหนือ fallback แบบข้อความ
- ระหว่างการรัน heartbeat, OpenClaw จะถือว่า `HEARTBEAT_OK` เป็น ack เมื่อปรากฏที่ **ตอนต้นหรือตอนท้าย** ของคำตอบ token จะถูกตัดออก และคำตอบจะถูกทิ้งหากเนื้อหาที่เหลือมีความยาว **≤ `ackMaxChars`** (ค่าเริ่มต้น: 300)
- หาก `HEARTBEAT_OK` ปรากฏอยู่ **กลาง** คำตอบ จะไม่ถูกปฏิบัติเป็นพิเศษ
- สำหรับการแจ้งเตือน **อย่า** ใส่ `HEARTBEAT_OK`; ส่งคืนเฉพาะข้อความแจ้งเตือนเท่านั้น

นอกเหนือจาก heartbeats, `HEARTBEAT_OK` ที่หลงมาที่ตอนต้น/ท้ายของข้อความจะถูกตัดออกและบันทึกไว้; ข้อความที่มีเพียง `HEARTBEAT_OK` จะถูกทิ้ง

## Config

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

- `agents.defaults.heartbeat` ตั้งค่าพฤติกรรม heartbeat ทั่วโลก
- `agents.list[].heartbeat` ผสานทับด้านบน; หากเอเจนต์ใดมีบล็อก `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะรัน heartbeats
- `channels.defaults.heartbeat` ตั้งค่าค่าเริ่มต้นด้านการมองเห็นสำหรับทุกช่องทาง
- `channels.<channel>.heartbeat` แทนที่ค่าเริ่มต้นของช่องทาง
- `channels.<channel>.accounts.<id>.heartbeat` (ช่องทางหลายบัญชี) แทนที่การตั้งค่ารายช่องทาง

### Heartbeats รายเอเจนต์

หากรายการ `agents.list[]` ใดมีบล็อก `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะรัน heartbeats บล็อกรายเอเจนต์จะผสานทับบน `agents.defaults.heartbeat` (ดังนั้นคุณจึงตั้งค่าเริ่มต้นร่วมกันครั้งเดียว แล้วแทนที่เป็นรายเอเจนต์ได้)

ตัวอย่าง: เอเจนต์สองตัว โดยมีเพียงเอเจนต์ตัวที่สองที่รัน heartbeats

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

### ตัวอย่างชั่วโมงที่ใช้งาน

จำกัด heartbeats ไว้ที่เวลาทำการในเขตเวลาที่กำหนด:

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

นอกช่วงเวลานี้ (ก่อน 9 โมงเช้าหรือหลัง 4 ทุ่มตามเวลาฝั่งตะวันออก) heartbeats จะถูกข้าม tick ตามกำหนดการถัดไปที่อยู่ภายในช่วงเวลาจะทำงานตามปกติ

### การตั้งค่า 24/7

หากคุณต้องการให้ heartbeats ทำงานตลอดทั้งวัน ให้ใช้หนึ่งในรูปแบบเหล่านี้:

- ละเว้น `activeHours` ทั้งหมด (ไม่มีข้อจำกัดด้านช่วงเวลา; นี่คือพฤติกรรมเริ่มต้น)
- ตั้งค่าช่วงเต็มวัน: `activeHours: { start: "00:00", end: "24:00" }`

<Warning>
อย่าตั้งเวลา `start` และ `end` เป็นเวลาเดียวกัน (เช่น `08:00` ถึง `08:00`) เพราะจะถือว่าเป็นช่วงเวลาที่มีความกว้างเป็นศูนย์ ดังนั้น heartbeats จะถูกข้ามเสมอ
</Warning>

### ตัวอย่างหลายบัญชี

ใช้ `accountId` เพื่อกำหนดเป้าหมายบัญชีเฉพาะบนช่องทางหลายบัญชี เช่น Telegram:

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
  ช่วงเวลาของ Heartbeat (สตริงระยะเวลา; หน่วยเริ่มต้น = นาที)
</ParamField>
<ParamField path="model" type="string">
  การแทนที่โมเดลเพิ่มเติมสำหรับการรัน heartbeat (`provider/model`)
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  เมื่อเปิดใช้ จะส่งข้อความ `Reasoning:` แยกต่างหากเมื่อมีให้ใช้งานด้วย (รูปแบบเดียวกับ `/reasoning on`)
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  เมื่อเป็น true การรัน heartbeat จะใช้บริบท bootstrap แบบเบา และเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของพื้นที่ทำงาน
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  เมื่อเป็น true แต่ละ heartbeat จะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า ใช้รูปแบบการแยกโดดเดี่ยวเดียวกับ Cron `sessionTarget: "isolated"` ลดต้นทุน token ต่อ heartbeat ลงอย่างมาก รวมกับ `lightContext: true` เพื่อประหยัดสูงสุด การกำหนดเส้นทางการส่งยังคงใช้บริบทเซสชันหลัก
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  เมื่อเป็น true การรัน heartbeat จะเลื่อนออกไปในเลนที่ยุ่งเพิ่มเติม: งานของเอเจนต์ย่อยหรืองานคำสั่งซ้อน เลน Cron จะเลื่อน heartbeats เสมอแม้ไม่มี flag นี้ เพื่อให้โฮสต์โมเดลภายในเครื่องไม่รัน prompt ของ Cron และ heartbeat พร้อมกัน
</ParamField>
<ParamField path="session" type="string">
  คีย์เซสชันเพิ่มเติมสำหรับการรัน heartbeat

- `main` (ค่าเริ่มต้น): เซสชันหลักของเอเจนต์
- คีย์เซสชันแบบชัดเจน (คัดลอกจาก `openclaw sessions --json` หรือ [sessions CLI](/th/cli/sessions))
- รูปแบบคีย์เซสชัน: ดู [เซสชัน](/th/concepts/session) และ [กลุ่ม](/th/channels/groups)

</ParamField>
<ParamField path="target" type="string">
- `last`: ส่งไปยังช่องทางภายนอกที่ใช้ล่าสุด
- ช่องทางแบบชัดเจน: ช่องทางหรือ Plugin id ใดๆ ที่กำหนดค่าไว้ เช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`
- `none` (ค่าเริ่มต้น): รัน heartbeat แต่ **ไม่ส่ง** ออกไปภายนอก

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  ควบคุมพฤติกรรมการส่งแบบ direct/DM `allow`: อนุญาตการส่ง heartbeat แบบ direct/DM `block`: ระงับการส่งแบบ direct/DM (`reason=dm-blocked`)

</ParamField>
<ParamField path="to" type="string">
  การแทนที่ผู้รับเพิ่มเติม (id เฉพาะช่องทาง เช่น E.164 สำหรับ WhatsApp หรือ Telegram chat id) สำหรับ topic/thread ของ Telegram ให้ใช้ `<chatId>:topic:<messageThreadId>`

</ParamField>
<ParamField path="accountId" type="string">
  id บัญชีเพิ่มเติมสำหรับช่องทางหลายบัญชี เมื่อ `target: "last"` id บัญชีจะใช้กับช่องทางล่าสุดที่ resolve ได้ หากช่องทางนั้นรองรับบัญชี มิฉะนั้นจะถูกละเว้น หาก id บัญชีไม่ตรงกับบัญชีที่กำหนดค่าไว้สำหรับช่องทางที่ resolve ได้ การส่งจะถูกข้าม

</ParamField>
<ParamField path="prompt" type="string">
  แทนที่เนื้อหา prompt เริ่มต้น (ไม่ผสาน)

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  จำนวนอักขระสูงสุดที่อนุญาตหลัง `HEARTBEAT_OK` ก่อนส่งมอบ

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  เมื่อเป็น true จะระงับเพย์โหลดคำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat

</ParamField>
<ParamField path="activeHours" type="object">
  จำกัดการรัน Heartbeat ให้อยู่ในช่วงเวลา ออบเจ็กต์ที่มี `start` (HH:MM, รวมเวลานี้; ใช้ `00:00` สำหรับต้นวัน), `end` (HH:MM ไม่รวมเวลานี้; อนุญาต `24:00` สำหรับสิ้นวัน), และ `timezone` แบบไม่บังคับ

- ละไว้หรือ `"user"`: ใช้ `agents.defaults.userTimezone` ของคุณหากตั้งไว้ มิฉะนั้นจะถอยกลับไปใช้เขตเวลาของระบบโฮสต์
- `"local"`: ใช้เขตเวลาของระบบโฮสต์เสมอ
- ตัวระบุ IANA ใดก็ได้ (เช่น `America/New_York`): ใช้โดยตรง หากไม่ถูกต้อง จะถอยกลับไปใช้พฤติกรรม `"user"` ด้านบน
- `start` และ `end` ต้องไม่เท่ากันสำหรับหน้าต่างเวลาที่ใช้งาน ค่าเท่ากันจะถือว่าเป็นความกว้างศูนย์ (อยู่นอกหน้าต่างเสมอ)
- นอกหน้าต่างเวลาที่ใช้งาน Heartbeat จะถูกข้ามจนกว่าจะถึง tick ถัดไปที่อยู่ในหน้าต่าง

</ParamField>

## พฤติกรรมการส่งมอบ

<AccordionGroup>
  <Accordion title="การกำหนดเส้นทางเซสชันและเป้าหมาย">
    - Heartbeat จะรันในเซสชันหลักของ agent โดยค่าเริ่มต้น (`agent:<id>:<mainKey>`) หรือ `global` เมื่อ `session.scope = "global"` ตั้งค่า `session` เพื่อแทนที่เป็นเซสชันช่องทางเฉพาะ (Discord/WhatsApp/ฯลฯ)
    - `session` มีผลเฉพาะบริบทการรันเท่านั้น การส่งมอบถูกควบคุมโดย `target` และ `to`
    - หากต้องการส่งมอบไปยังช่องทาง/ผู้รับเฉพาะ ให้ตั้งค่า `target` + `to` เมื่อใช้ `target: "last"` การส่งมอบจะใช้ช่องทางภายนอกล่าสุดสำหรับเซสชันนั้น
    - การส่งมอบ Heartbeat อนุญาตเป้าหมาย direct/DM โดยค่าเริ่มต้น ตั้งค่า `directPolicy: "block"` เพื่อระงับการส่งไปยังเป้าหมาย direct ขณะที่ยังคงรันรอบ Heartbeat
    - หากคิวหลัก, lane ของเซสชันเป้าหมาย, lane ของ Cron, หรืองาน Cron ที่ใช้งานอยู่ไม่ว่าง Heartbeat จะถูกข้ามและลองใหม่ภายหลัง
    - หาก `skipWhenBusy: true` lane ของ subagent และ lane ที่ซ้อนกันจะเลื่อนการรัน Heartbeat ออกไปด้วย
    - หาก `target` resolve แล้วไม่มีปลายทางภายนอก การรันยังเกิดขึ้นแต่จะไม่ส่งข้อความออก

  </Accordion>
  <Accordion title="การมองเห็นและพฤติกรรมการข้าม">
    - หาก `showOk`, `showAlerts`, และ `useIndicator` ถูกปิดทั้งหมด การรันจะถูกข้ามตั้งแต่ต้นเป็น `reason=alerts-disabled`
    - หากปิดเฉพาะการส่งมอบการแจ้งเตือน OpenClaw ยังสามารถรัน Heartbeat, อัปเดต timestamp ของงานที่ครบกำหนด, กู้คืน timestamp ว่างของเซสชัน, และระงับเพย์โหลดการแจ้งเตือนขาออกได้
    - หากเป้าหมาย Heartbeat ที่ resolve แล้วรองรับการแสดงว่ากำลังพิมพ์ OpenClaw จะแสดงสถานะกำลังพิมพ์ขณะที่การรัน Heartbeat ทำงานอยู่ ซึ่งใช้เป้าหมายเดียวกับที่ Heartbeat จะส่งเอาต์พุตแชตไป และจะถูกปิดด้วย `typingMode: "never"`

  </Accordion>
  <Accordion title="วงจรชีวิตเซสชันและการตรวจสอบย้อนหลัง">
    - การตอบกลับที่เป็น Heartbeat-only จะ **ไม่** ทำให้เซสชันยังคงอยู่ เมตาดาต้า Heartbeat อาจอัปเดตแถวของเซสชัน แต่การหมดอายุเมื่อว่างใช้ `lastInteractionAt` จากข้อความผู้ใช้/ช่องทางจริงล่าสุด และการหมดอายุรายวันใช้ `sessionStartedAt`
    - ประวัติ Control UI และ WebChat ซ่อน prompt ของ Heartbeat และการรับทราบแบบ OK-only transcript ของเซสชันเบื้องหลังยังสามารถมีรอบเหล่านั้นเพื่อการตรวจสอบย้อนหลัง/เล่นซ้ำได้
    - [งานเบื้องหลัง](/th/automation/tasks) ที่แยกออกสามารถจัดคิว system event และปลุก Heartbeat เมื่อเซสชันหลักควรสังเกตเห็นบางอย่างอย่างรวดเร็ว การปลุกนั้นไม่ได้ทำให้การรัน Heartbeat กลายเป็นงานเบื้องหลัง

  </Accordion>
</AccordionGroup>

## การควบคุมการมองเห็น

โดยค่าเริ่มต้น การรับทราบ `HEARTBEAT_OK` จะถูกระงับในขณะที่เนื้อหาการแจ้งเตือนถูกส่งมอบ คุณสามารถปรับสิ่งนี้ต่อช่องทางหรือต่อบัญชีได้:

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

- `showOk`: ส่งการรับทราบ `HEARTBEAT_OK` เมื่อโมเดลส่งกลับคำตอบแบบ OK-only
- `showAlerts`: ส่งเนื้อหาการแจ้งเตือนเมื่อโมเดลส่งกลับคำตอบที่ไม่ใช่ OK
- `useIndicator`: ส่ง indicator event สำหรับพื้นผิวสถานะ UI

หากทั้ง **สามรายการ** เป็น false ทั้งหมด OpenClaw จะข้ามการรัน Heartbeat ทั้งหมด (ไม่มีการเรียกโมเดล)

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

### รูปแบบทั่วไป

| เป้าหมาย                                 | Config                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| พฤติกรรมเริ่มต้น (OK เงียบ, เปิดการแจ้งเตือน) | _(ไม่ต้องมี config)_                                                                     |
| เงียบทั้งหมด (ไม่มีข้อความ, ไม่มี indicator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| เฉพาะ indicator (ไม่มีข้อความ)           | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK ในช่องทางเดียวเท่านั้น                | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (ไม่บังคับ)

หากมีไฟล์ `HEARTBEAT.md` อยู่ใน workspace prompt เริ่มต้นจะบอกให้ agent อ่านไฟล์นั้น ให้คิดว่ามันเป็น "เช็กลิสต์ Heartbeat" ของคุณ: เล็ก เสถียร และปลอดภัยที่จะรวมทุก 30 นาที

ในการรันปกติ `HEARTBEAT.md` จะถูกฉีดเข้าไปก็ต่อเมื่อเปิดใช้งานคำแนะนำ Heartbeat สำหรับ agent เริ่มต้น การปิด cadence ของ Heartbeat ด้วย `0m` หรือการตั้งค่า `includeSystemPromptSection: false` จะละเว้นไฟล์นี้จากบริบท bootstrap ปกติ

หาก `HEARTBEAT.md` มีอยู่แต่แทบว่างเปล่า (มีเฉพาะบรรทัดว่างและหัวข้อ markdown เช่น `# Heading`) OpenClaw จะข้ามการรัน Heartbeat เพื่อประหยัดการเรียก API การข้ามนั้นถูกรายงานเป็น `reason=empty-heartbeat-file` หากไม่มีไฟล์นี้ Heartbeat ยังคงรันและโมเดลจะตัดสินใจว่าจะทำอะไร

ทำให้ไฟล์เล็กมาก (เช็กลิสต์สั้น ๆ หรือการเตือนความจำ) เพื่อหลีกเลี่ยง prompt ที่บวม

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
  <Accordion title="พฤติกรรม">
    - OpenClaw parse บล็อก `tasks:` และตรวจสอบแต่ละงานเทียบกับ `interval` ของงานนั้นเอง
    - เฉพาะงานที่ **ครบกำหนด** เท่านั้นที่จะถูกรวมใน prompt ของ Heartbeat สำหรับ tick นั้น
    - หากไม่มีงานที่ครบกำหนด Heartbeat จะถูกข้ามทั้งหมด (`reason=no-tasks-due`) เพื่อหลีกเลี่ยงการเรียกโมเดลโดยเปล่าประโยชน์
    - เนื้อหาที่ไม่ใช่งานใน `HEARTBEAT.md` จะถูกเก็บไว้และต่อท้ายเป็นบริบทเพิ่มเติมหลังรายการงานที่ครบกำหนด
    - timestamp การรันล่าสุดของงานจะถูกเก็บไว้ในสถานะเซสชัน (`heartbeatTaskState`) ดังนั้นช่วงเวลาจะคงอยู่หลังการ restart ปกติ
    - timestamp ของงานจะถูกเลื่อนไปข้างหน้าเฉพาะหลังจากการรัน Heartbeat เส้นทางการตอบกลับปกติเสร็จสมบูรณ์เท่านั้น การรันที่ถูกข้ามแบบ `empty-heartbeat-file` / `no-tasks-due` จะไม่ทำเครื่องหมายงานว่าเสร็จสมบูรณ์

  </Accordion>
</AccordionGroup>

โหมดงานมีประโยชน์เมื่อคุณต้องการให้ไฟล์ Heartbeat ไฟล์เดียวเก็บการตรวจสอบเป็นระยะหลายรายการโดยไม่ต้องจ่ายต้นทุนสำหรับทั้งหมดในทุก tick

### agent สามารถอัปเดต HEARTBEAT.md ได้ไหม

ได้ หากคุณขอให้ทำ

`HEARTBEAT.md` เป็นเพียงไฟล์ปกติใน workspace ของ agent ดังนั้นคุณสามารถบอก agent (ในแชตปกติ) ประมาณว่า:

- "อัปเดต `HEARTBEAT.md` เพื่อเพิ่มการตรวจสอบปฏิทินรายวัน"
- "เขียน `HEARTBEAT.md` ใหม่ให้สั้นลงและเน้นการติดตาม inbox"

หากคุณต้องการให้สิ่งนี้เกิดขึ้นเชิงรุก คุณยังสามารถใส่บรรทัดที่ชัดเจนใน prompt Heartbeat ของคุณ เช่น: "หากเช็กลิสต์ล้าสมัย ให้อัปเดต HEARTBEAT.md ด้วยรายการที่ดีกว่า"

<Warning>
อย่าใส่ secrets (API keys, phone numbers, private tokens) ลงใน `HEARTBEAT.md` เพราะไฟล์นี้จะกลายเป็นส่วนหนึ่งของบริบท prompt
</Warning>

## การปลุกด้วยตนเอง (ตามต้องการ)

คุณสามารถจัดคิว system event และเรียก Heartbeat ทันทีด้วย:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

หากมี agent หลายตัวที่กำหนดค่า `heartbeat` ไว้ การปลุกด้วยตนเองจะรัน Heartbeat ของ agent เหล่านั้นแต่ละตัวทันที

ใช้ `--mode next-heartbeat` เพื่อรอ tick ที่กำหนดเวลาไว้ถัดไป

## การส่งมอบ Reasoning (ไม่บังคับ)

โดยค่าเริ่มต้น Heartbeat จะส่งมอบเฉพาะเพย์โหลด "คำตอบ" สุดท้าย

หากคุณต้องการความโปร่งใส ให้เปิดใช้งาน:

- `agents.defaults.heartbeat.includeReasoning: true`

เมื่อเปิดใช้งาน Heartbeat จะส่งมอบข้อความแยกอีกข้อความที่นำหน้าด้วย `Reasoning:` (รูปแบบเดียวกับ `/reasoning on`) สิ่งนี้มีประโยชน์เมื่อ agent จัดการหลายเซสชัน/codex และคุณต้องการเห็นว่าทำไมมันจึงตัดสินใจ ping คุณ แต่อาจรั่วรายละเอียดภายในมากกว่าที่คุณต้องการได้เช่นกัน ควรปิดไว้ในแชตกลุ่ม

## การตระหนักเรื่องต้นทุน

Heartbeat รันเป็นรอบ agent เต็มรูปแบบ ช่วงเวลาที่สั้นลงใช้ token มากขึ้น เพื่อลดต้นทุน:

- ใช้ `isolatedSession: true` เพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมด (จาก ~100K token เหลือ ~2-5K ต่อการรัน)
- ใช้ `lightContext: true` เพื่อจำกัดไฟล์ bootstrap ให้เหลือแค่ `HEARTBEAT.md`
- ตั้งค่า `model` ที่ถูกกว่า (เช่น `ollama/llama3.2:1b`)
- ทำให้ `HEARTBEAT.md` เล็ก
- ใช้ `target: "none"` หากคุณต้องการเฉพาะการอัปเดตสถานะภายใน

## บริบทล้นหลัง Heartbeat

หากก่อนหน้านี้ Heartbeat ทำให้เซสชันที่มีอยู่ค้างอยู่บนโมเดล local ที่เล็กกว่า เช่น โมเดล Ollama ที่มีหน้าต่าง 32k และรอบถัดไปของเซสชันหลักรายงานว่าบริบทล้น ให้ reset โมเดล runtime ของเซสชันกลับไปเป็นโมเดลหลักที่กำหนดค่าไว้ ข้อความ reset ของ OpenClaw จะระบุเรื่องนี้เมื่อโมเดล runtime ล่าสุดตรงกับ `heartbeat.model` ที่กำหนดค่าไว้

Heartbeat ปัจจุบันจะรักษาโมเดล runtime ที่มีอยู่ของเซสชันร่วมหลังจากการรันเสร็จสมบูรณ์ คุณยังคงใช้ `isolatedSession: true` เพื่อรัน Heartbeat ในเซสชันใหม่ รวมกับ `lightContext: true` เพื่อให้ prompt เล็กที่สุด หรือเลือกโมเดล Heartbeat ที่มีหน้าต่างบริบทใหญ่พอสำหรับเซสชันร่วมได้

## ที่เกี่ยวข้อง

- [Automation และ Tasks](/th/automation) — กลไก automation ทั้งหมดโดยสรุป
- [งานเบื้องหลัง](/th/automation/tasks) — วิธีติดตามงานที่แยกออก
- [เขตเวลา](/th/concepts/timezone) — เขตเวลามีผลต่อการกำหนดเวลา Heartbeat อย่างไร
- [การแก้ปัญหา](/th/automation/cron-jobs#troubleshooting) — การดีบักปัญหา automation
