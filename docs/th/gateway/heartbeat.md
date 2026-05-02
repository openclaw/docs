---
read_when:
    - การปรับความถี่ของ Heartbeat หรือการส่งข้อความ
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานตามกำหนดเวลา
sidebarTitle: Heartbeat
summary: ข้อความการโพล Heartbeat และกฎการแจ้งเตือน
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T10:16:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8198c74e2712c7ed9d34c41bad7c4e9be62043e8755cb4c9a60649222e04e37
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat เทียบกับ Cron?** ดูคำแนะนำว่าควรใช้แต่ละแบบเมื่อใดได้ที่ [ระบบอัตโนมัติและงาน](/th/automation)
</Note>

Heartbeat เรียกใช้ **รอบการทำงานของเอเจนต์แบบเป็นระยะ** ในเซสชันหลัก เพื่อให้โมเดลสามารถแจ้งสิ่งที่ต้องให้ความสนใจโดยไม่ส่งข้อความรบกวนคุณมากเกินไป

Heartbeat เป็นรอบการทำงานในเซสชันหลักตามกำหนดเวลา — ไม่ได้สร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks) ระเบียนงานมีไว้สำหรับงานที่แยกออกไปทำต่างหาก (การรัน ACP, เอเจนต์ย่อย, งาน Cron แบบแยกโดดเดี่ยว)

การแก้ปัญหา: [งานตามกำหนดเวลา](/th/automation/cron-jobs#troubleshooting)

## เริ่มต้นอย่างรวดเร็ว (ผู้เริ่มต้น)

<Steps>
  <Step title="เลือกความถี่">
    เปิดใช้ Heartbeat ไว้ (ค่าเริ่มต้นคือ `30m` หรือ `1h` สำหรับการยืนยันตัวตน Anthropic OAuth/token รวมถึงการใช้ Claude CLI ซ้ำ) หรือตั้งความถี่ของคุณเอง
  </Step>
  <Step title="เพิ่ม HEARTBEAT.md (ไม่บังคับ)">
    สร้างเช็กลิสต์ `HEARTBEAT.md` ขนาดเล็กหรือบล็อก `tasks:` ในเวิร์กสเปซของเอเจนต์
  </Step>
  <Step title="ตัดสินใจว่าข้อความ Heartbeat ควรส่งไปที่ใด">
    `target: "none"` เป็นค่าเริ่มต้น; ตั้งค่า `target: "last"` เพื่อส่งไปยังผู้ติดต่อล่าสุด
  </Step>
  <Step title="การปรับแต่งเพิ่มเติม">
    - เปิดใช้การส่งเหตุผลของ Heartbeat เพื่อความโปร่งใส
    - ใช้บริบทเริ่มต้นแบบเบา หากการรัน Heartbeat ต้องการเพียง `HEARTBEAT.md`
    - เปิดใช้เซสชันแบบแยกโดดเดี่ยวเพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมดในแต่ละ Heartbeat
    - จำกัด Heartbeat ให้อยู่ในช่วงเวลาที่ใช้งาน (เวลาท้องถิ่น)

  </Step>
</Steps>

ตัวอย่างคอนฟิก:

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

- ช่วงเวลา: `30m` (หรือ `1h` เมื่อโหมดการยืนยันตัวตนที่ตรวจพบคือ Anthropic OAuth/token auth รวมถึงการใช้ Claude CLI ซ้ำ) ตั้งค่า `agents.defaults.heartbeat.every` หรือ `agents.list[].heartbeat.every` รายเอเจนต์; ใช้ `0m` เพื่อปิดใช้งาน
- เนื้อหาพรอมต์ (กำหนดค่าได้ผ่าน `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- พรอมต์ Heartbeat จะถูกส่ง **ตามตัวอักษร** เป็นข้อความของผู้ใช้ พรอมต์ระบบจะมีส่วน "Heartbeat" เฉพาะเมื่อเปิดใช้ Heartbeat สำหรับเอเจนต์เริ่มต้น และการรันถูกทำเครื่องหมายไว้ภายใน
- เมื่อปิดใช้ Heartbeat ด้วย `0m` การรันปกติจะละเว้น `HEARTBEAT.md` จากบริบทเริ่มต้นด้วย เพื่อให้โมเดลไม่เห็นคำสั่งที่มีไว้เฉพาะ Heartbeat
- ช่วงเวลาที่ใช้งาน (`heartbeat.activeHours`) จะถูกตรวจในเขตเวลาที่กำหนดค่าไว้ นอกช่วงเวลานั้น Heartbeat จะถูกข้ามจนถึงรอบถัดไปที่อยู่ภายในช่วงเวลา
- Heartbeat จะเลื่อนออกไปโดยอัตโนมัติขณะที่งาน Cron กำลังทำงานหรืออยู่ในคิว ตั้งค่า `heartbeat.skipWhenBusy: true` เพื่อเลื่อนออกไปเมื่อเลนที่ยุ่งเพิ่มเติม (งานเอเจนต์ย่อยหรืองานคำสั่งที่ซ้อนกัน) ยุ่งอยู่ด้วย; สิ่งนี้มีประโยชน์สำหรับ Ollama ในเครื่องและโฮสต์รันไทม์เดี่ยวอื่น ๆ ที่มีข้อจำกัด

## พรอมต์ Heartbeat มีไว้เพื่ออะไร

พรอมต์เริ่มต้นถูกตั้งใจให้ครอบคลุมกว้าง:

- **งานเบื้องหลัง**: "Consider outstanding tasks" กระตุ้นให้เอเจนต์ตรวจทานงานที่ต้องติดตาม (กล่องขาเข้า, ปฏิทิน, ตัวเตือน, งานที่อยู่ในคิว) และแจ้งสิ่งที่เร่งด่วน
- **การเช็กอินกับมนุษย์**: "Checkup sometimes on your human during day time" กระตุ้นให้ส่งข้อความเบา ๆ เป็นครั้งคราวว่า "มีอะไรที่คุณต้องการไหม?" แต่หลีกเลี่ยงการรบกวนเวลากลางคืนโดยใช้เขตเวลาท้องถิ่นที่คุณกำหนดค่าไว้ (ดู [เขตเวลา](/th/concepts/timezone))

Heartbeat สามารถตอบสนองต่องาน [เบื้องหลัง](/th/automation/tasks) ที่เสร็จแล้วได้ แต่การรัน Heartbeat เองจะไม่สร้างระเบียนงาน

หากคุณต้องการให้ Heartbeat ทำบางอย่างที่เฉพาะเจาะจงมาก (เช่น "ตรวจสถิติ Gmail PubSub" หรือ "ตรวจสอบสถานะ Gateway") ให้ตั้งค่า `agents.defaults.heartbeat.prompt` (หรือ `agents.list[].heartbeat.prompt`) เป็นเนื้อหาแบบกำหนดเอง (ส่งตามตัวอักษร)

## สัญญาการตอบกลับ

- หากไม่มีสิ่งใดต้องให้ความสนใจ ให้ตอบด้วย **`HEARTBEAT_OK`**
- การรัน Heartbeat ที่ใช้เครื่องมือได้อาจเรียก `heartbeat_respond` พร้อม `notify: false` เพื่อไม่ให้มีการอัปเดตที่มองเห็นได้ หรือ `notify: true` พร้อม `notificationText` สำหรับการแจ้งเตือน เมื่อมีอยู่ การตอบกลับเครื่องมือแบบมีโครงสร้างจะมีลำดับความสำคัญเหนือกว่าข้อความสำรอง
- ระหว่างการรัน Heartbeat, OpenClaw จะถือว่า `HEARTBEAT_OK` เป็นการรับทราบเมื่อปรากฏที่ **จุดเริ่มต้นหรือจุดสิ้นสุด** ของคำตอบ โทเค็นจะถูกตัดออก และคำตอบจะถูกทิ้งหากเนื้อหาที่เหลือมีความยาว **≤ `ackMaxChars`** (ค่าเริ่มต้น: 300)
- หาก `HEARTBEAT_OK` ปรากฏอยู่ **ตรงกลาง** ของคำตอบ จะไม่ถูกปฏิบัติเป็นพิเศษ
- สำหรับการแจ้งเตือน **อย่า** ใส่ `HEARTBEAT_OK`; ให้ส่งกลับเฉพาะข้อความแจ้งเตือนเท่านั้น

นอกเหนือจาก Heartbeat, `HEARTBEAT_OK` ที่หลุดมาที่จุดเริ่มต้น/จุดสิ้นสุดของข้อความจะถูกตัดออกและบันทึกไว้; ข้อความที่มีเพียง `HEARTBEAT_OK` จะถูกทิ้ง

## คอนฟิก

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
- `agents.list[].heartbeat` รวมทับด้านบน; หากเอเจนต์ใดมีบล็อก `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะรัน Heartbeat
- `channels.defaults.heartbeat` ตั้งค่าเริ่มต้นด้านการมองเห็นสำหรับทุกช่องทาง
- `channels.<channel>.heartbeat` แทนที่ค่าเริ่มต้นของช่องทาง
- `channels.<channel>.accounts.<id>.heartbeat` (ช่องทางหลายบัญชี) แทนที่การตั้งค่ารายช่องทาง

### Heartbeat รายเอเจนต์

หากรายการ `agents.list[]` ใดมีบล็อก `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะรัน Heartbeat บล็อกรายเอเจนต์จะรวมทับบน `agents.defaults.heartbeat` (ดังนั้นคุณสามารถตั้งค่าเริ่มต้นที่ใช้ร่วมกันครั้งเดียว แล้วแทนที่เป็นรายเอเจนต์ได้)

ตัวอย่าง: เอเจนต์สองตัว มีเพียงเอเจนต์ตัวที่สองที่รัน Heartbeat

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

### ตัวอย่างช่วงเวลาที่ใช้งาน

จำกัด Heartbeat ให้อยู่ในเวลาทำการในเขตเวลาที่ระบุ:

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

นอกช่วงเวลานี้ (ก่อน 9 น. หรือหลัง 22 น. ตามเวลาตะวันออก) Heartbeat จะถูกข้าม รอบถัดไปที่กำหนดไว้ภายในช่วงเวลาจะทำงานตามปกติ

### การตั้งค่า 24/7

หากคุณต้องการให้ Heartbeat ทำงานตลอดวัน ให้ใช้รูปแบบใดรูปแบบหนึ่งต่อไปนี้:

- ละเว้น `activeHours` ทั้งหมด (ไม่มีข้อจำกัดหน้าต่างเวลา; นี่คือพฤติกรรมเริ่มต้น)
- ตั้งค่าหน้าต่างเต็มวัน: `activeHours: { start: "00:00", end: "24:00" }`

<Warning>
อย่าตั้งเวลา `start` และ `end` เป็นเวลาเดียวกัน (เช่น `08:00` ถึง `08:00`) ระบบจะถือว่าเป็นหน้าต่างความกว้างศูนย์ ดังนั้น Heartbeat จะถูกข้ามเสมอ
</Warning>

### ตัวอย่างหลายบัญชี

ใช้ `accountId` เพื่อกำหนดเป้าหมายบัญชีเฉพาะในช่องทางหลายบัญชี เช่น Telegram:

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
  การแทนที่โมเดลแบบไม่บังคับสำหรับการรัน Heartbeat (`provider/model`)
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  เมื่อเปิดใช้ ให้ส่งข้อความ `Reasoning:` ที่แยกต่างหากด้วยเมื่อมีอยู่ (รูปแบบเดียวกับ `/reasoning on`)
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  เมื่อเป็น true การรัน Heartbeat จะใช้บริบทเริ่มต้นแบบเบา และเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์เริ่มต้นของเวิร์กสเปซ
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  เมื่อเป็น true Heartbeat แต่ละครั้งจะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า ใช้รูปแบบการแยกโดดเดี่ยวเดียวกับ Cron `sessionTarget: "isolated"` ลดต้นทุนโทเค็นต่อ Heartbeat ได้อย่างมาก ใช้ร่วมกับ `lightContext: true` เพื่อประหยัดสูงสุด การกำหนดเส้นทางการส่งยังคงใช้บริบทเซสชันหลัก
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปเมื่อเลนที่ยุ่งเพิ่มเติมกำลังทำงาน: งานเอเจนต์ย่อยหรืองานคำสั่งที่ซ้อนกัน เลน Cron จะเลื่อน Heartbeat ออกไปเสมอ แม้ไม่มีแฟล็กนี้ เพื่อให้โฮสต์โมเดลในเครื่องไม่รันพรอมต์ Cron และ Heartbeat พร้อมกัน
</ParamField>
<ParamField path="session" type="string">
  คีย์เซสชันแบบไม่บังคับสำหรับการรัน Heartbeat

- `main` (ค่าเริ่มต้น): เซสชันหลักของเอเจนต์
- คีย์เซสชันที่ระบุชัดเจน (คัดลอกจาก `openclaw sessions --json` หรือ [CLI เซสชัน](/th/cli/sessions))
- รูปแบบคีย์เซสชัน: ดู [เซสชัน](/th/concepts/session) และ [กลุ่ม](/th/channels/groups)

</ParamField>
<ParamField path="target" type="string">
- `last`: ส่งไปยังช่องทางภายนอกที่ใช้ล่าสุด
- ช่องทางที่ระบุชัดเจน: ช่องทางหรือ Plugin id ใด ๆ ที่กำหนดค่าไว้ เช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`
- `none` (ค่าเริ่มต้น): รัน Heartbeat แต่ **ไม่ส่ง** ออกภายนอก

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  ควบคุมพฤติกรรมการส่งแบบ direct/DM `allow`: อนุญาตให้ส่ง Heartbeat แบบ direct/DM `block`: ระงับการส่งแบบ direct/DM (`reason=dm-blocked`)

</ParamField>
<ParamField path="to" type="string">
  การแทนที่ผู้รับแบบไม่บังคับ (id เฉพาะช่องทาง เช่น E.164 สำหรับ WhatsApp หรือ id แชต Telegram) สำหรับหัวข้อ/เธรด Telegram ให้ใช้ `<chatId>:topic:<messageThreadId>`

</ParamField>
<ParamField path="accountId" type="string">
  id บัญชีแบบไม่บังคับสำหรับช่องทางหลายบัญชี เมื่อ `target: "last"` ถูกตั้งค่า id บัญชีจะใช้กับช่องทางล่าสุดที่แก้ไขได้ หากช่องทางนั้นรองรับบัญชี; ไม่เช่นนั้นจะถูกละเว้น หาก id บัญชีไม่ตรงกับบัญชีที่กำหนดค่าไว้สำหรับช่องทางที่แก้ไขได้ การส่งจะถูกข้าม

</ParamField>
<ParamField path="prompt" type="string">
  แทนที่เนื้อหาพรอมต์เริ่มต้น (ไม่ได้รวมเข้าด้วยกัน)

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  จำนวนอักขระสูงสุดที่อนุญาตหลัง `HEARTBEAT_OK` ก่อนการนำส่ง

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  เมื่อเป็น true จะระงับเพย์โหลดคำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat

</ParamField>
<ParamField path="activeHours" type="object">
  จำกัดการรัน Heartbeat ให้อยู่ในช่วงเวลา ออบเจ็กต์ที่มี `start` (HH:MM, รวมเวลานี้; ใช้ `00:00` สำหรับเวลาเริ่มต้นของวัน), `end` (HH:MM ไม่รวมเวลานี้; อนุญาต `24:00` สำหรับเวลาสิ้นสุดของวัน), และ `timezone` แบบไม่บังคับ

- ละไว้หรือ `"user"`: ใช้ `agents.defaults.userTimezone` ของคุณหากตั้งค่าไว้ มิฉะนั้นจะย้อนกลับไปใช้เขตเวลาของระบบโฮสต์
- `"local"`: ใช้เขตเวลาของระบบโฮสต์เสมอ
- ตัวระบุ IANA ใดก็ได้ (เช่น `America/New_York`): ใช้โดยตรง; หากไม่ถูกต้อง จะย้อนกลับไปใช้พฤติกรรม `"user"` ข้างต้น
- `start` และ `end` ต้องไม่เท่ากันสำหรับหน้าต่างเวลาที่ทำงานอยู่; ค่าที่เท่ากันจะถือว่าเป็นความกว้างศูนย์ (อยู่นอกหน้าต่างเสมอ)
- นอกหน้าต่างเวลาที่ทำงานอยู่ Heartbeat จะถูกข้ามจนกว่าจะถึง tick ถัดไปภายในหน้าต่าง

</ParamField>

## พฤติกรรมการนำส่ง

<AccordionGroup>
  <Accordion title="การกำหนดเส้นทางเซสชันและเป้าหมาย">
    - โดยค่าเริ่มต้น Heartbeat จะรันในเซสชันหลักของเอเจนต์ (`agent:<id>:<mainKey>`) หรือ `global` เมื่อ `session.scope = "global"` ตั้งค่า `session` เพื่อแทนที่เป็นเซสชันช่องทางเฉพาะ (Discord/WhatsApp/อื่นๆ)
    - `session` มีผลเฉพาะกับบริบทการรันเท่านั้น; การนำส่งถูกควบคุมโดย `target` และ `to`
    - หากต้องการนำส่งไปยังช่องทาง/ผู้รับเฉพาะ ให้ตั้งค่า `target` + `to` เมื่อใช้ `target: "last"` การนำส่งจะใช้ช่องทางภายนอกล่าสุดสำหรับเซสชันนั้น
    - การนำส่ง Heartbeat อนุญาตเป้าหมายแบบตรง/DM โดยค่าเริ่มต้น ตั้งค่า `directPolicy: "block"` เพื่อระงับการส่งไปยังเป้าหมายแบบตรง แต่ยังคงรันเทิร์น Heartbeat อยู่
    - หากคิวหลัก, lane ของเซสชันเป้าหมาย, lane ของ cron, หรืองาน cron ที่ทำงานอยู่ไม่ว่าง Heartbeat จะถูกข้ามและลองใหม่ภายหลัง
    - หาก `skipWhenBusy: true` subagent และ lane ที่ซ้อนกันจะเลื่อนการรัน Heartbeat ออกไปด้วย
    - หาก `target` แก้เป็นปลายทางภายนอกไม่ได้ การรันยังคงเกิดขึ้นแต่จะไม่มีการส่งข้อความออกไป

  </Accordion>
  <Accordion title="พฤติกรรมการมองเห็นและการข้าม">
    - หาก `showOk`, `showAlerts`, และ `useIndicator` ถูกปิดใช้งานทั้งหมด การรันจะถูกข้ามตั้งแต่ต้นเป็น `reason=alerts-disabled`
    - หากปิดใช้งานเฉพาะการนำส่งการแจ้งเตือน OpenClaw ยังสามารถรัน Heartbeat, อัปเดต timestamp ของงานที่ถึงกำหนด, คืนค่า timestamp ว่างของเซสชัน, และระงับเพย์โหลดการแจ้งเตือนขาออกได้
    - หากเป้าหมาย Heartbeat ที่แก้ได้รองรับการแสดงว่ากำลังพิมพ์ OpenClaw จะแสดงว่ากำลังพิมพ์ขณะที่การรัน Heartbeat ทำงานอยู่ ซึ่งใช้เป้าหมายเดียวกับที่ Heartbeat จะส่งเอาต์พุตแชตไปให้ และถูกปิดใช้งานด้วย `typingMode: "never"`

  </Accordion>
  <Accordion title="วงจรชีวิตเซสชันและการตรวจสอบ">
    - การตอบกลับที่เป็น Heartbeat เท่านั้นจะ **ไม่** ทำให้เซสชันยังมีชีวิตอยู่ต่อไป เมตาดาต้า Heartbeat อาจอัปเดตแถวเซสชัน แต่การหมดอายุจากการว่างจะใช้ `lastInteractionAt` จากข้อความผู้ใช้/ช่องทางจริงล่าสุด และการหมดอายุรายวันจะใช้ `sessionStartedAt`
    - ประวัติ Control UI และ WebChat จะซ่อนพรอมป์ Heartbeat และการยืนยันที่เป็น OK เท่านั้น ทรานสคริปต์เซสชันพื้นฐานยังคงมีเทิร์นเหล่านั้นเพื่อการตรวจสอบ/เล่นซ้ำได้
    - [งานเบื้องหลัง](/th/automation/tasks) ที่แยกออกมาสามารถเข้าคิวอีเวนต์ระบบและปลุก Heartbeat เมื่อเซสชันหลักควรรับรู้บางอย่างอย่างรวดเร็ว การปลุกนั้นไม่ได้ทำให้การรัน Heartbeat กลายเป็นงานเบื้องหลัง

  </Accordion>
</AccordionGroup>

## การควบคุมการมองเห็น

โดยค่าเริ่มต้น การยืนยัน `HEARTBEAT_OK` จะถูกระงับไว้ ขณะที่เนื้อหาการแจ้งเตือนจะถูกนำส่ง คุณสามารถปรับค่านี้ต่อช่องทางหรือต่อบัญชีได้:

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

### แต่ละแฟล็กทำอะไร

- `showOk`: ส่งการยืนยัน `HEARTBEAT_OK` เมื่อโมเดลส่งคืนการตอบกลับที่เป็น OK เท่านั้น
- `showAlerts`: ส่งเนื้อหาการแจ้งเตือนเมื่อโมเดลส่งคืนการตอบกลับที่ไม่ใช่ OK
- `useIndicator`: ปล่อยอีเวนต์ตัวบ่งชี้สำหรับพื้นผิวสถานะ UI

หากทั้ง **สามรายการ** เป็น false OpenClaw จะข้ามการรัน Heartbeat ทั้งหมด (ไม่มีการเรียกโมเดล)

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

| เป้าหมาย                                     | การกำหนดค่า                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| พฤติกรรมเริ่มต้น (OK เงียบ, เปิดการแจ้งเตือน) | _(ไม่ต้องกำหนดค่า)_                                                                     |
| เงียบทั้งหมด (ไม่มีข้อความ ไม่มีตัวบ่งชี้) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| เฉพาะตัวบ่งชี้ (ไม่มีข้อความ)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK ในช่องทางเดียวเท่านั้น                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (ไม่บังคับ)

หากมีไฟล์ `HEARTBEAT.md` อยู่ใน workspace พรอมป์เริ่มต้นจะบอกให้เอเจนต์อ่านไฟล์นั้น ให้คิดว่าไฟล์นี้เป็น “เช็กลิสต์ Heartbeat” ของคุณ: เล็ก เสถียร และปลอดภัยที่จะรวมทุก 30 นาที

ในการรันปกติ `HEARTBEAT.md` จะถูกแทรกเฉพาะเมื่อเปิดใช้งานคำแนะนำ Heartbeat สำหรับเอเจนต์เริ่มต้น การปิด cadence ของ Heartbeat ด้วย `0m` หรือตั้งค่า `includeSystemPromptSection: false` จะละเว้นไฟล์นี้จากบริบท bootstrap ปกติ

หาก `HEARTBEAT.md` มีอยู่แต่โดยผลลัพธ์แล้วว่างเปล่า (มีเพียงบรรทัดว่างและหัวข้อ markdown เช่น `# Heading`) OpenClaw จะข้ามการรัน Heartbeat เพื่อประหยัดการเรียก API การข้ามนั้นจะถูกรายงานเป็น `reason=empty-heartbeat-file` หากไฟล์หายไป Heartbeat จะยังคงรันและโมเดลจะตัดสินใจว่าจะทำอะไร

ทำให้เล็กมาก (เช็กลิสต์สั้นๆ หรือการเตือนความจำ) เพื่อหลีกเลี่ยงพรอมป์ที่บวมเกินไป

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
    - OpenClaw จะแยกวิเคราะห์บล็อก `tasks:` และตรวจสอบแต่ละงานเทียบกับ `interval` ของงานนั้นเอง
    - เฉพาะงานที่ **ถึงกำหนด** เท่านั้นที่จะถูกรวมไว้ในพรอมป์ Heartbeat สำหรับ tick นั้น
    - หากไม่มีงานที่ถึงกำหนด Heartbeat จะถูกข้ามทั้งหมด (`reason=no-tasks-due`) เพื่อหลีกเลี่ยงการเรียกโมเดลโดยเปล่าประโยชน์
    - เนื้อหาที่ไม่ใช่งานใน `HEARTBEAT.md` จะถูกเก็บไว้และต่อท้ายเป็นบริบทเพิ่มเติมหลังรายการงานที่ถึงกำหนด
    - timestamp การรันล่าสุดของงานจะถูกเก็บไว้ในสถานะเซสชัน (`heartbeatTaskState`) ดังนั้นช่วงเวลาจึงคงอยู่ได้หลังการรีสตาร์ตปกติ
    - timestamp ของงานจะถูกเลื่อนไปข้างหน้าเฉพาะหลังจากการรัน Heartbeat ทำเส้นทางการตอบกลับปกติของมันเสร็จสิ้น การรันที่ถูกข้ามแบบ `empty-heartbeat-file` / `no-tasks-due` จะไม่ทำเครื่องหมายว่างานเสร็จแล้ว

  </Accordion>
</AccordionGroup>

โหมดงานมีประโยชน์เมื่อคุณต้องการให้ไฟล์ Heartbeat ไฟล์เดียวเก็บการตรวจสอบเป็นระยะหลายรายการโดยไม่ต้องจ่ายค่าใช้จ่ายสำหรับทั้งหมดทุก tick

### เอเจนต์สามารถอัปเดต HEARTBEAT.md ได้ไหม?

ได้ — ถ้าคุณขอให้ทำ

`HEARTBEAT.md` เป็นเพียงไฟล์ปกติใน workspace ของเอเจนต์ ดังนั้นคุณสามารถบอกเอเจนต์ (ในแชตปกติ) ได้ เช่น:

- "Update `HEARTBEAT.md` to add a daily calendar check."
- "Rewrite `HEARTBEAT.md` so it's shorter and focused on inbox follow-ups."

หากคุณต้องการให้สิ่งนี้เกิดขึ้นเชิงรุก คุณยังสามารถใส่บรรทัดที่ชัดเจนในพรอมป์ Heartbeat ของคุณ เช่น: "If the checklist becomes stale, update HEARTBEAT.md with a better one."

<Warning>
อย่าใส่ความลับ (คีย์ API, หมายเลขโทรศัพท์, โทเค็นส่วนตัว) ลงใน `HEARTBEAT.md` — ไฟล์นี้จะกลายเป็นส่วนหนึ่งของบริบทพรอมป์
</Warning>

## การปลุกด้วยตนเอง (ตามต้องการ)

คุณสามารถเข้าคิวอีเวนต์ระบบและทริกเกอร์ Heartbeat ทันทีได้ด้วย:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

หากมีเอเจนต์หลายตัวที่กำหนดค่า `heartbeat` ไว้ การปลุกด้วยตนเองจะรัน Heartbeat ของเอเจนต์แต่ละตัวเหล่านั้นทันที

ใช้ `--mode next-heartbeat` เพื่อรอ tick ที่กำหนดไว้ถัดไป

## การนำส่งเหตุผล (ไม่บังคับ)

โดยค่าเริ่มต้น Heartbeat จะนำส่งเฉพาะเพย์โหลด “คำตอบ” สุดท้ายเท่านั้น

หากคุณต้องการความโปร่งใส ให้เปิดใช้งาน:

- `agents.defaults.heartbeat.includeReasoning: true`

เมื่อเปิดใช้งาน Heartbeat จะนำส่งข้อความแยกต่างหากที่ขึ้นต้นด้วย `Reasoning:` ด้วย (รูปแบบเดียวกับ `/reasoning on`) สิ่งนี้มีประโยชน์เมื่อเอเจนต์กำลังจัดการหลายเซสชัน/โค้ดเบส และคุณต้องการเห็นว่าทำไมมันจึงตัดสินใจ ping คุณ — แต่ก็อาจรั่วไหลรายละเอียดภายในมากกว่าที่คุณต้องการได้เช่นกัน แนะนำให้ปิดไว้ในแชตกลุ่ม

## การคำนึงถึงค่าใช้จ่าย

Heartbeat รันเทิร์นเอเจนต์เต็มรูปแบบ ช่วงเวลาที่สั้นกว่าจะใช้โทเคนมากกว่า เพื่อลดค่าใช้จ่าย:

- ใช้ `isolatedSession: true` เพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมด (จาก ~100K โทเคนลงเหลือ ~2-5K ต่อการรัน)
- ใช้ `lightContext: true` เพื่อจำกัดไฟล์ bootstrap ให้เหลือเพียง `HEARTBEAT.md`
- ตั้งค่า `model` ที่ถูกกว่า (เช่น `ollama/llama3.2:1b`)
- ทำให้ `HEARTBEAT.md` มีขนาดเล็ก
- ใช้ `target: "none"` หากคุณต้องการเพียงการอัปเดตสถานะภายใน

## บริบทล้นหลัง Heartbeat

หาก Heartbeat ใช้โมเดลโลคัลที่เล็กกว่า เช่น โมเดล Ollama ที่มีหน้าต่าง 32k และเทิร์นเซสชันหลักถัดไปรายงานว่าบริบทล้น ให้ตรวจสอบว่า Heartbeat ก่อนหน้าทิ้งเซสชันไว้บนโมเดล Heartbeat หรือไม่ ข้อความรีเซ็ตของ OpenClaw จะเรียกประเด็นนี้ออกมาเมื่อโมเดลรันไทม์ล่าสุดตรงกับ `heartbeat.model` ที่กำหนดค่าไว้

ใช้ `isolatedSession: true` เพื่อรัน Heartbeat ในเซสชันใหม่ รวมกับ `lightContext: true` เพื่อให้พรอมป์เล็กที่สุด หรือเลือกโมเดล Heartbeat ที่มีหน้าต่างบริบทใหญ่พอสำหรับเซสชันที่ใช้ร่วมกัน

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติและงาน](/th/automation) — กลไกอัตโนมัติทั้งหมดโดยสรุป
- [งานเบื้องหลัง](/th/automation/tasks) — วิธีติดตามงานที่แยกออกมา
- [เขตเวลา](/th/concepts/timezone) — เขตเวลามีผลต่อการกำหนดเวลา Heartbeat อย่างไร
- [การแก้ไขปัญหา](/th/automation/cron-jobs#troubleshooting) — การดีบักปัญหาระบบอัตโนมัติ
