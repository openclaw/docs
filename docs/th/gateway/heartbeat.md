---
read_when:
    - การปรับจังหวะของ Heartbeat หรือการส่งข้อความ
    - การเลือกระหว่าง Heartbeat กับ Cron สำหรับงานที่กำหนดเวลาไว้
sidebarTitle: Heartbeat
summary: ข้อความการตรวจสอบ Heartbeat เป็นระยะและกฎการแจ้งเตือน
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T23:30:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 247a0fe25ef6e47ec447e6c911ac66af4ab669e15dba886c967250b56e9f1a9c
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat เทียบกับ cron?** ดู [Automation](/th/automation) เพื่อดูคำแนะนำว่าควรใช้แต่ละอย่างเมื่อใด
</Note>

Heartbeat เรียกใช้ **รอบการทำงานของเอเจนต์เป็นระยะ** ในเซสชันหลัก เพื่อให้โมเดลสามารถแจ้งสิ่งที่ต้องให้ความสนใจได้โดยไม่ส่งข้อความรบกวนคุณมากเกินไป

Heartbeat คือรอบการทำงานตามกำหนดเวลาในเซสชันหลัก — มัน **ไม่** สร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks) ระเบียนงานมีไว้สำหรับงานที่แยกออกไป (การรัน ACP, เอเจนต์ย่อย, งาน cron แบบแยกโดดเดี่ยว)

การแก้ไขปัญหา: [งานตามกำหนดเวลา](/th/automation/cron-jobs#troubleshooting)

## เริ่มต้นอย่างรวดเร็ว (ผู้เริ่มต้น)

<Steps>
  <Step title="เลือกความถี่">
    เปิดใช้ Heartbeat ไว้ (ค่าเริ่มต้นคือ `30m` หรือ `1h` สำหรับการยืนยันตัวตนด้วย Anthropic OAuth/token รวมถึงการใช้ Claude CLI ซ้ำ) หรือกำหนดความถี่ของคุณเอง
  </Step>
  <Step title="เพิ่ม HEARTBEAT.md (ไม่บังคับ)">
    สร้างเช็กลิสต์ `HEARTBEAT.md` ขนาดเล็ก หรือบล็อก `tasks:` ในพื้นที่ทำงานของเอเจนต์
  </Step>
  <Step title="ตัดสินใจว่าข้อความ Heartbeat ควรส่งไปที่ใด">
    `target: "none"` คือค่าเริ่มต้น; ตั้งค่า `target: "last"` เพื่อส่งต่อไปยังผู้ติดต่อล่าสุด
  </Step>
  <Step title="การปรับแต่งเพิ่มเติม">
    - เปิดใช้การส่ง reasoning ของ Heartbeat เพื่อความโปร่งใส
    - ใช้บริบทเริ่มต้นแบบเบา หากการรัน Heartbeat ต้องการแค่ `HEARTBEAT.md`
    - เปิดใช้เซสชันแบบแยกโดดเดี่ยวเพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมดในแต่ละ Heartbeat
    - จำกัด Heartbeat ให้อยู่ในช่วงเวลาที่ใช้งานอยู่ (เวลาท้องถิ่น)

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
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## ค่าเริ่มต้น

- ช่วงเวลา: `30m` (หรือ `1h` เมื่อโหมดการยืนยันตัวตนที่ตรวจพบคือ Anthropic OAuth/token รวมถึงการใช้ Claude CLI ซ้ำ) ตั้งค่า `agents.defaults.heartbeat.every` หรือ `agents.list[].heartbeat.every`; ใช้ `0m` เพื่อปิดใช้งาน
- เนื้อหาพรอมป์ (กำหนดค่าได้ผ่าน `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- พรอมป์ Heartbeat จะถูกส่ง **ตรงตามตัวอักษร** เป็นข้อความของผู้ใช้ พรอมป์ระบบจะมีส่วน "Heartbeat" เฉพาะเมื่อเปิดใช้ Heartbeat สำหรับเอเจนต์เริ่มต้น และการรันถูกทำเครื่องหมายไว้ภายใน
- เมื่อปิดใช้ Heartbeat ด้วย `0m` การรันปกติจะไม่รวม `HEARTBEAT.md` จากบริบทเริ่มต้นด้วย เพื่อไม่ให้โมเดลเห็นคำสั่งที่มีไว้สำหรับ Heartbeat เท่านั้น
- ชั่วโมงที่ใช้งานอยู่ (`heartbeat.activeHours`) จะถูกตรวจสอบตามเขตเวลาที่กำหนดค่าไว้อยู่ นอกช่วงเวลาดังกล่าว Heartbeat จะถูกข้ามจนกว่าจะถึง tick ถัดไปภายในช่วงเวลา
- Heartbeat จะเลื่อนออกโดยอัตโนมัติระหว่างที่งาน cron กำลังทำงานหรืออยู่ในคิว ตั้งค่า `heartbeat.skipWhenBusy: true` เพื่อเลื่อนเอเจนต์ด้วยเมื่อเอเจนต์นั้นมีเอเจนต์ย่อยที่ผูกกับคีย์เซสชันของตนเองหรือเลนคำสั่งซ้อนที่กำลังยุ่งอยู่; เอเจนต์พี่น้องจะไม่หยุดชั่วคราวอีกต่อไปเพียงเพราะเอเจนต์อื่นมีงานเอเจนต์ย่อยที่กำลังดำเนินอยู่

## พรอมป์ Heartbeat มีไว้เพื่ออะไร

พรอมป์เริ่มต้นถูกตั้งใจให้ครอบคลุมกว้าง:

- **งานเบื้องหลัง**: "พิจารณางานที่ยังค้างอยู่" กระตุ้นให้เอเจนต์ตรวจสอบรายการติดตามผล (กล่องข้อความ ปฏิทิน ตัวเตือน งานที่อยู่ในคิว) และแจ้งสิ่งที่เร่งด่วน
- **การเช็กอินกับมนุษย์**: "เช็กกับมนุษย์ของคุณเป็นครั้งคราวในช่วงกลางวัน" กระตุ้นข้อความเบา ๆ เป็นครั้งคราวว่า "มีอะไรที่คุณต้องการไหม?" แต่หลีกเลี่ยงสแปมในเวลากลางคืนโดยใช้เขตเวลาท้องถิ่นที่คุณกำหนดค่าไว้ (ดู [เขตเวลา](/th/concepts/timezone))

Heartbeat สามารถตอบสนองต่องาน [งานเบื้องหลัง](/th/automation/tasks) ที่เสร็จสมบูรณ์ได้ แต่การรัน Heartbeat เองจะไม่สร้างระเบียนงาน

หากคุณต้องการให้ Heartbeat ทำบางอย่างที่เฉพาะเจาะจงมาก (เช่น "ตรวจสอบสถิติ Gmail PubSub" หรือ "ตรวจสอบสุขภาพของ gateway") ให้ตั้งค่า `agents.defaults.heartbeat.prompt` (หรือ `agents.list[].heartbeat.prompt`) เป็นเนื้อหาที่กำหนดเอง (ส่งตรงตามตัวอักษร)

## สัญญาการตอบกลับ

- หากไม่มีสิ่งใดต้องให้ความสนใจ ให้ตอบด้วย **`HEARTBEAT_OK`**
- การรัน Heartbeat ที่ใช้เครื่องมือได้อาจเรียก `heartbeat_respond` พร้อม `notify: false` เพื่อไม่ให้มีการอัปเดตที่มองเห็นได้ หรือ `notify: true` พร้อม `notificationText` สำหรับการแจ้งเตือน เมื่อมีอยู่ การตอบกลับแบบมีโครงสร้างจากเครื่องมือจะมีความสำคัญเหนือ fallback แบบข้อความ
- ระหว่างการรัน Heartbeat, OpenClaw จะถือว่า `HEARTBEAT_OK` เป็น ack เมื่อปรากฏที่ **จุดเริ่มต้นหรือจุดสิ้นสุด** ของคำตอบ โทเค็นจะถูกตัดออก และคำตอบจะถูกทิ้งหากเนื้อหาที่เหลือมีความยาว **≤ `ackMaxChars`** (ค่าเริ่มต้น: 300)
- หาก `HEARTBEAT_OK` ปรากฏอยู่ **ตรงกลาง** ของคำตอบ จะไม่ถูกปฏิบัติเป็นกรณีพิเศษ
- สำหรับการแจ้งเตือน **อย่า** ใส่ `HEARTBEAT_OK`; ส่งคืนเฉพาะข้อความแจ้งเตือนเท่านั้น

นอกเหนือจาก Heartbeat, `HEARTBEAT_OK` ที่หลุดมาอยู่ต้น/ท้ายข้อความจะถูกตัดออกและบันทึกไว้; ข้อความที่มีเพียง `HEARTBEAT_OK` จะถูกทิ้ง

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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
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

- `agents.defaults.heartbeat` ตั้งค่าพฤติกรรม Heartbeat ส่วนกลาง
- `agents.list[].heartbeat` จะรวมทับเพิ่มเติม หากเอเจนต์ใดมีบล็อก `heartbeat` **เฉพาะเอเจนต์เหล่านั้นเท่านั้น** ที่จะเรียกใช้ Heartbeat
- `channels.defaults.heartbeat` ตั้งค่าเริ่มต้นด้านการมองเห็นสำหรับทุกช่องทาง
- `channels.<channel>.heartbeat` แทนที่ค่าเริ่มต้นของช่องทาง
- `channels.<channel>.accounts.<id>.heartbeat` (ช่องทางแบบหลายบัญชี) แทนที่การตั้งค่าต่อช่องทาง

### Heartbeat ต่อเอเจนต์

หากรายการ `agents.list[]` ใดมีบล็อก `heartbeat` **เฉพาะเอเจนต์เหล่านั้นเท่านั้น** ที่จะเรียกใช้ Heartbeat บล็อกต่อเอเจนต์จะรวมทับเพิ่มเติมจาก `agents.defaults.heartbeat` (ดังนั้นคุณจึงตั้งค่าเริ่มต้นที่ใช้ร่วมกันครั้งเดียว แล้วแทนที่เป็นรายเอเจนต์ได้)

ตัวอย่าง: เอเจนต์สองตัว มีเพียงเอเจนต์ตัวที่สองเท่านั้นที่เรียกใช้ Heartbeat

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

จำกัด Heartbeat ให้อยู่ในช่วงเวลาทำการในเขตเวลาที่ระบุ:

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

นอกช่วงเวลานี้ (ก่อน 9 โมงเช้าหรือหลัง 4 ทุ่มตามเวลาตะวันออก) Heartbeat จะถูกข้าม รอบการทำงานที่กำหนดไว้ถัดไปภายในช่วงเวลานี้จะทำงานตามปกติ

### การตั้งค่าแบบ 24/7

หากคุณต้องการให้ Heartbeat ทำงานทั้งวัน ให้ใช้รูปแบบใดรูปแบบหนึ่งต่อไปนี้:

- ละ `activeHours` ทั้งหมด (ไม่มีข้อจำกัดช่วงเวลา; นี่คือพฤติกรรมเริ่มต้น)
- ตั้งค่าหน้าต่างเต็มวัน: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
อย่าตั้งเวลา `start` และ `end` ให้เหมือนกัน (เช่น `08:00` ถึง `08:00`) ระบบจะถือว่าเป็นหน้าต่างความกว้างศูนย์ ดังนั้น Heartbeat จะถูกข้ามเสมอ
</Warning>

### ตัวอย่างหลายบัญชี

ใช้ `accountId` เพื่อกำหนดเป้าหมายบัญชีเฉพาะในช่องทางแบบหลายบัญชี เช่น Telegram:

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

### หมายเหตุภาคสนาม

<ParamField path="every" type="string">
  ช่วงเวลา Heartbeat (สตริงระยะเวลา; หน่วยเริ่มต้น = นาที)
</ParamField>
<ParamField path="model" type="string">
  การแทนที่โมเดลแบบไม่บังคับสำหรับการรัน Heartbeat (`provider/model`)
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  เมื่อเปิดใช้งาน ให้ส่งข้อความ `Reasoning:` แยกต่างหากด้วยเมื่อมีให้ใช้งาน (รูปแบบเดียวกับ `/reasoning on`)
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  เมื่อเป็น true การรัน Heartbeat จะใช้บริบทบูตสแตรปแบบเบา และเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์บูตสแตรปของเวิร์กสเปซ
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  เมื่อเป็น true Heartbeat แต่ละครั้งจะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า ใช้รูปแบบการแยกเดียวกับ Cron `sessionTarget: "isolated"` ลดต้นทุนโทเคนต่อ Heartbeat ได้อย่างมาก ใช้ร่วมกับ `lightContext: true` เพื่อประหยัดสูงสุด การกำหนดเส้นทางการส่งมอบยังคงใช้บริบทของเซสชันหลัก
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปบนเลนที่ยุ่งเพิ่มเติมของเอเจนต์นั้น ได้แก่ subagent ของตัวเองที่ผูกกับคีย์เซสชัน หรืองานคำสั่งแบบซ้อน เลน Cron จะเลื่อน Heartbeat เสมอ แม้ไม่มีแฟล็กนี้ เพื่อให้โฮสต์โมเดลภายในเครื่องไม่รันพรอมป์ Cron และ Heartbeat พร้อมกัน
</ParamField>
<ParamField path="session" type="string">
  คีย์เซสชันแบบไม่บังคับสำหรับการรัน Heartbeat

- `main` (ค่าเริ่มต้น): เซสชันหลักของเอเจนต์
- คีย์เซสชันที่ระบุอย่างชัดเจน (คัดลอกจาก `openclaw sessions --json` หรือ [sessions CLI](/th/cli/sessions))
- รูปแบบคีย์เซสชัน: ดู [Sessions](/th/concepts/session) และ [Groups](/th/channels/groups)

</ParamField>
<ParamField path="target" type="string">
- `last`: ส่งไปยังช่องทางภายนอกที่ใช้ล่าสุด
- ช่องทางที่ระบุอย่างชัดเจน: ช่องทางหรือ id ของ Plugin ที่กำหนดค่าไว้ เช่น `discord`, `matrix`, `telegram`, หรือ `whatsapp`
- `none` (ค่าเริ่มต้น): รัน Heartbeat แต่**ไม่ส่ง**ออกไปภายนอก

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  ควบคุมพฤติกรรมการส่งแบบโดยตรง/DM `allow`: อนุญาตการส่ง Heartbeat แบบโดยตรง/DM `block`: ระงับการส่งแบบโดยตรง/DM (`reason=dm-blocked`)

</ParamField>
<ParamField path="to" type="string">
  ระบุผู้รับทับค่าเดิมได้ตามต้องการ (รหัสเฉพาะช่องทาง เช่น E.164 สำหรับ WhatsApp หรือรหัสแชท Telegram) สำหรับหัวข้อ/เธรดของ Telegram ให้ใช้ `<chatId>:topic:<messageThreadId>`

</ParamField>
<ParamField path="accountId" type="string">
  รหัสบัญชีที่ไม่บังคับสำหรับช่องทางหลายบัญชี เมื่อ `target: "last"` รหัสบัญชีจะใช้กับช่องทางล่าสุดที่แก้ไขได้แล้ว หากช่องทางนั้นรองรับบัญชี มิฉะนั้นจะถูกละเว้น หากรหัสบัญชีไม่ตรงกับบัญชีที่กำหนดค่าไว้สำหรับช่องทางที่แก้ไขได้แล้ว จะข้ามการส่ง

</ParamField>
<ParamField path="prompt" type="string">
  แทนที่เนื้อหาพรอมต์เริ่มต้น (ไม่รวมเข้าด้วยกัน)

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  จำนวนอักขระสูงสุดที่อนุญาตหลัง `HEARTBEAT_OK` ก่อนส่งมอบ

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  เมื่อเป็น true จะระงับเพย์โหลดคำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน heartbeat

</ParamField>
<ParamField path="activeHours" type="object">
  จำกัดการรัน heartbeat ให้อยู่ภายในกรอบเวลา ออบเจ็กต์ที่มี `start` (HH:MM, รวมเวลานี้; ใช้ `00:00` สำหรับต้นวัน), `end` (HH:MM ไม่รวมเวลานี้; อนุญาต `24:00` สำหรับท้ายวัน), และ `timezone` ที่เป็นตัวเลือก

- ละไว้หรือ `"user"`: ใช้ `agents.defaults.userTimezone` ของคุณหากตั้งค่าไว้ มิฉะนั้นจะถอยกลับไปใช้เขตเวลาของระบบโฮสต์
- `"local"`: ใช้เขตเวลาของระบบโฮสต์เสมอ
- ตัวระบุ IANA ใดก็ได้ (เช่น `America/New_York`): ใช้โดยตรง; หากไม่ถูกต้อง จะถอยกลับไปใช้พฤติกรรม `"user"` ข้างต้น
- `start` และ `end` ต้องไม่เท่ากันสำหรับหน้าต่างที่ใช้งานอยู่; ค่าที่เท่ากันจะถือว่าเป็นความกว้างศูนย์ (อยู่นอกหน้าต่างเสมอ)
- นอกหน้าต่างที่ใช้งานอยู่ heartbeat จะถูกข้ามจนถึง tick ถัดไปที่อยู่ภายในหน้าต่าง

</ParamField>

## พฤติกรรมการส่งมอบ

<AccordionGroup>
  <Accordion title="การกำหนดเส้นทางเซสชันและเป้าหมาย">
    - โดยค่าเริ่มต้น heartbeat จะรันในเซสชันหลักของเอเจนต์ (`agent:<id>:<mainKey>`) หรือ `global` เมื่อ `session.scope = "global"` ตั้งค่า `session` เพื่อแทนที่เป็นเซสชันช่องทางเฉพาะ (Discord/WhatsApp/อื่น ๆ)
    - `session` มีผลเฉพาะบริบทการรันเท่านั้น; การส่งมอบถูกควบคุมโดย `target` และ `to`
    - หากต้องการส่งมอบไปยังช่องทาง/ผู้รับเฉพาะ ให้ตั้งค่า `target` + `to` เมื่อใช้ `target: "last"` การส่งมอบจะใช้ช่องทางภายนอกล่าสุดของเซสชันนั้น
    - การส่งมอบ heartbeat อนุญาตเป้าหมายแบบส่งตรง/DM ตามค่าเริ่มต้น ตั้งค่า `directPolicy: "block"` เพื่อระงับการส่งไปยังเป้าหมายแบบส่งตรง โดยยังคงรันรอบ heartbeat อยู่
    - หากคิวหลัก, เลนเซสชันเป้าหมาย, เลน cron หรือ cron job ที่ใช้งานอยู่กำลังยุ่ง heartbeat จะถูกข้ามและลองใหม่ภายหลัง
    - หาก `skipWhenBusy: true` เซสชัน keyed ตาม session ของเอเจนต์นี้และเลนซ้อนกันจะเลื่อนการรัน heartbeat ด้วย เลนที่ยุ่งของเอเจนต์อื่นจะไม่เลื่อนเอเจนต์นี้
    - หาก `target` resolve แล้วไม่มีปลายทางภายนอก การรันยังคงเกิดขึ้นแต่ไม่มีการส่งข้อความขาออก

  </Accordion>
  <Accordion title="การมองเห็นและพฤติกรรมการข้าม">
    - หาก `showOk`, `showAlerts`, และ `useIndicator` ถูกปิดใช้งานทั้งหมด การรันจะถูกข้ามตั้งแต่ต้นเป็น `reason=alerts-disabled`
    - หากปิดใช้งานเฉพาะการส่งมอบการแจ้งเตือน OpenClaw ยังสามารถรัน heartbeat, อัปเดต timestamp ของงานที่ครบกำหนด, คืนค่า timestamp ว่างของเซสชัน และระงับเพย์โหลดการแจ้งเตือนออกภายนอกได้
    - หากเป้าหมาย heartbeat ที่ resolve แล้วรองรับสถานะกำลังพิมพ์ OpenClaw จะแสดงสถานะกำลังพิมพ์ขณะที่การรัน heartbeat ทำงานอยู่ ซึ่งใช้เป้าหมายเดียวกับที่ heartbeat จะส่งเอาต์พุตแชทไปหา และจะถูกปิดใช้งานด้วย `typingMode: "never"`

  </Accordion>
  <Accordion title="วงจรชีวิตเซสชันและการตรวจสอบ">
    - การตอบกลับเฉพาะ heartbeat **ไม่** ทำให้เซสชันยังคงอยู่ เมตาดาต้า heartbeat อาจอัปเดตแถวเซสชัน แต่การหมดอายุเมื่อว่างจะใช้ `lastInteractionAt` จากข้อความผู้ใช้/ช่องทางจริงล่าสุด และการหมดอายุรายวันจะใช้ `sessionStartedAt`
    - ประวัติ Control UI และ WebChat ซ่อนพรอมต์ heartbeat และการตอบรับที่เป็น OK เท่านั้น transcript เซสชันพื้นฐานยังสามารถมีรอบเหล่านั้นเพื่อการตรวจสอบ/เล่นซ้ำได้
    - [งานเบื้องหลัง](/th/automation/tasks) แบบแยกออกสามารถ enqueue เหตุการณ์ระบบและปลุก heartbeat เมื่อเซสชันหลักควรรับรู้บางอย่างอย่างรวดเร็ว การปลุกนั้นไม่ได้ทำให้การรัน heartbeat กลายเป็นงานเบื้องหลัง

  </Accordion>
</AccordionGroup>

## การควบคุมการมองเห็น

โดยค่าเริ่มต้น การตอบรับ `HEARTBEAT_OK` จะถูกระงับขณะที่เนื้อหาการแจ้งเตือนถูกส่งมอบ คุณสามารถปรับค่านี้ต่อช่องทางหรือต่อบัญชีได้:

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

- `showOk`: ส่งการตอบรับ `HEARTBEAT_OK` เมื่อโมเดลส่งคืนการตอบกลับที่เป็น OK เท่านั้น
- `showAlerts`: ส่งเนื้อหาการแจ้งเตือนเมื่อโมเดลส่งคืนการตอบกลับที่ไม่ใช่ OK
- `useIndicator`: emit เหตุการณ์ indicator สำหรับพื้นผิวสถานะ UI

หากทั้ง **สามอย่าง** เป็น false OpenClaw จะข้ามการรัน heartbeat ทั้งหมด (ไม่มีการเรียกโมเดล)

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

| เป้าหมาย                                     | Config                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| พฤติกรรมเริ่มต้น (OK แบบเงียบ, เปิดการแจ้งเตือน) | _(ไม่จำเป็นต้องมี config)_                                                                     |
| เงียบทั้งหมด (ไม่มีข้อความ, ไม่มี indicator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| เฉพาะ indicator (ไม่มีข้อความ)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK เฉพาะในช่องทางเดียว                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (ไม่บังคับ)

หากมีไฟล์ `HEARTBEAT.md` อยู่ใน workspace พรอมต์เริ่มต้นจะบอกให้เอเจนต์อ่านไฟล์นั้น ให้คิดว่าไฟล์นี้เป็น "เช็กลิสต์ heartbeat" ของคุณ: เล็ก เสถียร และปลอดภัยที่จะรวมทุก 30 นาที

ในการรันปกติ `HEARTBEAT.md` จะถูก inject เฉพาะเมื่อเปิดใช้งานคำแนะนำ heartbeat สำหรับเอเจนต์เริ่มต้นเท่านั้น การปิดใช้งานจังหวะ heartbeat ด้วย `0m` หรือการตั้งค่า `includeSystemPromptSection: false` จะละไว้จากบริบท bootstrap ปกติ

หาก `HEARTBEAT.md` มีอยู่แต่แทบจะว่างเปล่า (มีเฉพาะบรรทัดว่างและหัวข้อ markdown เช่น `# Heading`) OpenClaw จะข้ามการรัน heartbeat เพื่อประหยัดการเรียก API การข้ามนั้นจะถูกรายงานเป็น `reason=empty-heartbeat-file` หากไฟล์หายไป heartbeat ยังคงรัน และโมเดลจะตัดสินใจว่าจะทำอะไร

ทำให้เล็กมาก (เช็กลิสต์สั้น ๆ หรือการเตือนความจำ) เพื่อหลีกเลี่ยงพรอมต์บวม

ตัวอย่าง `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### บล็อก `tasks:`

`HEARTBEAT.md` ยังรองรับบล็อก `tasks:` แบบมีโครงสร้างขนาดเล็กสำหรับการตรวจสอบตามช่วงเวลาภายใน heartbeat เอง

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
    - OpenClaw parse บล็อก `tasks:` และตรวจสอบแต่ละงานกับ `interval` ของตัวเอง
    - เฉพาะงานที่ **ครบกำหนด** เท่านั้นที่จะรวมอยู่ในพรอมต์ heartbeat สำหรับ tick นั้น
    - หากไม่มีงานที่ครบกำหนด heartbeat จะถูกข้ามทั้งหมด (`reason=no-tasks-due`) เพื่อหลีกเลี่ยงการเรียกโมเดลที่สูญเปล่า
    - เนื้อหาที่ไม่ใช่งานใน `HEARTBEAT.md` จะถูกเก็บไว้และผนวกเป็นบริบทเพิ่มเติมหลังรายการงานที่ครบกำหนด
    - timestamp การรันล่าสุดของงานจะถูกเก็บในสถานะเซสชัน (`heartbeatTaskState`) ดังนั้นช่วงเวลาจะยังคงอยู่หลังการรีสตาร์ทตามปกติ
    - timestamp ของงานจะถูกเลื่อนไปข้างหน้าเฉพาะหลังจากการรัน heartbeat เสร็จสิ้นเส้นทางการตอบกลับปกติเท่านั้น การรันที่ถูกข้ามแบบ `empty-heartbeat-file` / `no-tasks-due` จะไม่ทำเครื่องหมายว่างานเสร็จสมบูรณ์

  </Accordion>
</AccordionGroup>

โหมดงานมีประโยชน์เมื่อคุณต้องการให้ไฟล์ heartbeat เดียวเก็บการตรวจสอบเป็นระยะหลายรายการ โดยไม่ต้องจ่ายสำหรับทั้งหมดในทุก tick

### เอเจนต์สามารถอัปเดต HEARTBEAT.md ได้ไหม?

ได้ — หากคุณขอให้ทำ

`HEARTBEAT.md` เป็นเพียงไฟล์ปกติใน workspace ของเอเจนต์ ดังนั้นคุณสามารถบอกเอเจนต์ (ในแชทปกติ) ได้ เช่น:

- "Update `HEARTBEAT.md` to add a daily calendar check."
- "Rewrite `HEARTBEAT.md` so it's shorter and focused on inbox follow-ups."

หากคุณต้องการให้สิ่งนี้เกิดขึ้นเชิงรุก คุณสามารถใส่บรรทัดที่ชัดเจนในพรอมต์ heartbeat ของคุณได้ด้วย เช่น: "If the checklist becomes stale, update HEARTBEAT.md with a better one."

<Warning>
อย่าใส่ความลับ (API keys, หมายเลขโทรศัพท์, token ส่วนตัว) ลงใน `HEARTBEAT.md` — ไฟล์นี้จะกลายเป็นส่วนหนึ่งของบริบทพรอมต์
</Warning>

## การปลุกด้วยตนเอง (ตามต้องการ)

คุณสามารถ enqueue เหตุการณ์ระบบและทริกเกอร์ heartbeat ทันทีด้วย:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

หากมีเอเจนต์หลายตัวที่กำหนดค่า `heartbeat` ไว้ การปลุกด้วยตนเองจะรัน heartbeat ของเอเจนต์เหล่านั้นแต่ละตัวทันที

ใช้ `--mode next-heartbeat` เพื่อรอ tick ที่กำหนดเวลาไว้ถัดไป

## การส่งมอบ reasoning (ไม่บังคับ)

โดยค่าเริ่มต้น heartbeat จะส่งมอบเฉพาะเพย์โหลด "คำตอบ" สุดท้ายเท่านั้น

หากคุณต้องการความโปร่งใส ให้เปิดใช้งาน:

- `agents.defaults.heartbeat.includeReasoning: true`

เมื่อเปิดใช้งาน heartbeat จะส่งมอบข้อความแยกต่างหากที่ขึ้นต้นด้วย `Reasoning:` ด้วย (รูปแบบเดียวกับ `/reasoning on`) สิ่งนี้มีประโยชน์เมื่อเอเจนต์จัดการหลายเซสชัน/codexes และคุณต้องการเห็นว่าทำไมเอเจนต์จึงตัดสินใจ ping คุณ — แต่อาจรั่วไหลรายละเอียดภายในมากกว่าที่คุณต้องการได้เช่นกัน แนะนำให้ปิดไว้ในแชทกลุ่ม

## การตระหนักถึงต้นทุน

heartbeat รันรอบเอเจนต์เต็มรูปแบบ ช่วงเวลาที่สั้นลงใช้ token มากขึ้น เพื่อลดต้นทุน:

- ใช้ `isolatedSession: true` เพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมด (~100K token ลดลงเหลือ ~2-5K ต่อการรัน)
- ใช้ `lightContext: true` เพื่อจำกัดไฟล์ bootstrap ให้เหลือเพียง `HEARTBEAT.md`
- ตั้งค่า `model` ที่ถูกกว่า (เช่น `ollama/llama3.2:1b`)
- ทำให้ `HEARTBEAT.md` เล็ก
- ใช้ `target: "none"` หากคุณต้องการเฉพาะการอัปเดตสถานะภายใน

## บริบทล้นหลัง heartbeat

หาก heartbeat ก่อนหน้านี้ทิ้งเซสชันเดิมไว้บนโมเดล local ที่เล็กกว่า เช่น โมเดล Ollama ที่มีหน้าต่าง 32k และรอบเซสชันหลักถัดไปรายงานว่าบริบทล้น ให้รีเซ็ตโมเดล runtime ของเซสชันกลับไปเป็นโมเดลหลักที่กำหนดค่าไว้ ข้อความรีเซ็ตของ OpenClaw จะระบุเรื่องนี้เมื่อโมเดล runtime ล่าสุดตรงกับ `heartbeat.model` ที่กำหนดค่าไว้

heartbeat ปัจจุบันจะรักษาโมเดล runtime เดิมของเซสชันที่แชร์ไว้หลังจากการรันเสร็จสมบูรณ์ คุณยังสามารถใช้ `isolatedSession: true` เพื่อรัน heartbeat ในเซสชันใหม่ รวมกับ `lightContext: true` เพื่อให้พรอมต์เล็กที่สุด หรือเลือกโมเดล heartbeat ที่มีหน้าต่างบริบทใหญ่พอสำหรับเซสชันที่แชร์

## ที่เกี่ยวข้อง

- [Automation](/th/automation) — กลไก Automation ทั้งหมดในภาพรวม
- [งานเบื้องหลัง](/th/automation/tasks) — วิธีติดตามงานที่แยกออก
- [เขตเวลา](/th/concepts/timezone) — วิธีที่เขตเวลามีผลต่อการกำหนดเวลา heartbeat
- [การแก้ไขปัญหา](/th/automation/cron-jobs#troubleshooting) — การดีบักปัญหา Automation
