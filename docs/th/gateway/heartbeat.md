---
read_when:
    - การปรับจังหวะของ Heartbeat หรือการส่งข้อความ
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานตามกำหนดเวลา
sidebarTitle: Heartbeat
summary: ข้อความการโพล Heartbeat และกฎการแจ้งเตือน
title: Heartbeat
x-i18n:
    generated_at: "2026-05-10T19:38:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c4a4076ff4c7a88b47a9bb4daff56b3075173e79409a991ac564ad6ab305a9d
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat เทียบกับ Cron?** ดูคำแนะนำว่าควรใช้แต่ละอย่างเมื่อใดได้ที่ [ระบบอัตโนมัติและงาน](/th/automation)
</Note>

Heartbeat เรียกใช้ **รอบการทำงานของเอเจนต์เป็นระยะ** ในเซสชันหลัก เพื่อให้โมเดลแจ้งสิ่งที่ต้องให้ความสนใจได้โดยไม่ส่งข้อความรบกวนคุณถี่เกินไป

Heartbeat คือรอบการทำงานตามกำหนดเวลาในเซสชันหลัก โดย **ไม่** สร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks) ระเบียนงานมีไว้สำหรับงานที่แยกออกไปทำต่างหาก (การรัน ACP, subagent, งาน Cron แบบแยกบริบท)

การแก้ไขปัญหา: [งานตามกำหนดเวลา](/th/automation/cron-jobs#troubleshooting)

## เริ่มต้นอย่างรวดเร็ว (ผู้เริ่มต้น)

<Steps>
  <Step title="เลือกความถี่">
    เปิด Heartbeat ไว้ (ค่าเริ่มต้นคือ `30m` หรือ `1h` สำหรับการยืนยันตัวตน Anthropic แบบ OAuth/token รวมถึงการใช้ Claude CLI ซ้ำ) หรือกำหนดความถี่ของคุณเอง
  </Step>
  <Step title="เพิ่ม HEARTBEAT.md (ไม่บังคับ)">
    สร้างรายการตรวจสอบ `HEARTBEAT.md` ขนาดเล็ก หรือบล็อก `tasks:` ในพื้นที่ทำงานของเอเจนต์
  </Step>
  <Step title="ตัดสินใจว่าข้อความ Heartbeat ควรส่งไปที่ใด">
    `target: "none"` คือค่าเริ่มต้น; ตั้งค่า `target: "last"` เพื่อส่งต่อไปยังผู้ติดต่อรายล่าสุด
  </Step>
  <Step title="การปรับแต่งเพิ่มเติม">
    - เปิดใช้การส่ง reasoning ของ Heartbeat เพื่อความโปร่งใส
    - ใช้บริบท bootstrap แบบเบา หากการรัน Heartbeat ต้องการเพียง `HEARTBEAT.md`
    - เปิดใช้เซสชันแบบแยก เพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมดในทุก Heartbeat
    - จำกัด Heartbeat ให้อยู่ในช่วงเวลาที่ใช้งาน (เวลาท้องถิ่น)

  </Step>
</Steps>

ตัวอย่างการตั้งค่า:

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

- ช่วงเวลา: `30m` (หรือ `1h` เมื่อโหมดการยืนยันตัวตนที่ตรวจพบคือ Anthropic OAuth/token รวมถึงการใช้ Claude CLI ซ้ำ) ตั้งค่า `agents.defaults.heartbeat.every` หรือ `agents.list[].heartbeat.every` รายเอเจนต์; ใช้ `0m` เพื่อปิดใช้งาน
- เนื้อหา prompt (กำหนดค่าได้ผ่าน `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- prompt ของ Heartbeat จะถูกส่ง **ตามตัวอักษร** เป็นข้อความผู้ใช้ system prompt จะมีส่วน "Heartbeat" เฉพาะเมื่อเปิดใช้ Heartbeat สำหรับเอเจนต์เริ่มต้น และการรันจะถูกทำเครื่องหมายไว้ภายใน
- เมื่อปิดใช้ Heartbeat ด้วย `0m` การรันปกติจะไม่รวม `HEARTBEAT.md` ในบริบท bootstrap ด้วย เพื่อไม่ให้โมเดลเห็นคำสั่งที่ใช้เฉพาะกับ Heartbeat
- ชั่วโมงที่ใช้งาน (`heartbeat.activeHours`) จะถูกตรวจสอบตามเขตเวลาที่กำหนดค่าไว้นอกช่วงเวลาดังกล่าว Heartbeat จะถูกข้ามจนกว่าจะถึง tick ถัดไปภายในช่วงเวลา
- Heartbeat จะเลื่อนออกไปโดยอัตโนมัติเมื่อมีงาน Cron กำลังทำงานหรือรอคิว ตั้งค่า `heartbeat.skipWhenBusy: true` เพื่อเลื่อนออกไปเมื่อมี lane ที่ยุ่งเพิ่มเติม (งาน subagent หรือคำสั่งซ้อน) ด้วย; สิ่งนี้มีประโยชน์สำหรับ Ollama ในเครื่องและโฮสต์ runtime เดี่ยวอื่นๆ ที่มีข้อจำกัด

## prompt ของ Heartbeat ใช้ทำอะไร

prompt เริ่มต้นตั้งใจให้มีขอบเขตกว้าง:

- **งานเบื้องหลัง**: "Consider outstanding tasks" ช่วยกระตุ้นให้เอเจนต์ตรวจสอบงานติดตามผล (กล่องขาเข้า ปฏิทิน เตือนความจำ งานที่รอคิว) และแจ้งสิ่งเร่งด่วน
- **การเช็กอินกับมนุษย์**: "Checkup sometimes on your human during day time" ช่วยกระตุ้นให้ส่งข้อความเบาๆ เป็นครั้งคราว เช่น "มีอะไรให้ช่วยไหม?" แต่หลีกเลี่ยงสแปมตอนกลางคืนโดยใช้เขตเวลาท้องถิ่นที่คุณกำหนดค่าไว้ (ดู [เขตเวลา](/th/concepts/timezone))

Heartbeat สามารถตอบสนองต่องาน [งานเบื้องหลัง](/th/automation/tasks) ที่เสร็จแล้วได้ แต่การรัน Heartbeat เองจะไม่สร้างระเบียนงาน

หากคุณต้องการให้ Heartbeat ทำบางอย่างที่เฉพาะเจาะจงมาก (เช่น "ตรวจสอบสถิติ Gmail PubSub" หรือ "ตรวจสอบสุขภาพ Gateway") ให้ตั้งค่า `agents.defaults.heartbeat.prompt` (หรือ `agents.list[].heartbeat.prompt`) เป็นเนื้อหาที่กำหนดเอง (ส่งตามตัวอักษร)

## สัญญาการตอบกลับ

- หากไม่มีสิ่งใดต้องให้ความสนใจ ให้ตอบด้วย **`HEARTBEAT_OK`**
- การรัน Heartbeat ที่ใช้เครื่องมือได้อาจเรียก `heartbeat_respond` พร้อม `notify: false` เพื่อไม่ให้มีการอัปเดตที่มองเห็นได้ หรือ `notify: true` พร้อม `notificationText` สำหรับการแจ้งเตือน เมื่อมีอยู่ การตอบกลับแบบมีโครงสร้างจากเครื่องมือจะมีลำดับความสำคัญเหนือข้อความ fallback
- ระหว่างการรัน Heartbeat, OpenClaw จะถือว่า `HEARTBEAT_OK` เป็น ack เมื่อปรากฏที่ **ต้นหรือท้าย** ของคำตอบ token นี้จะถูกตัดออก และคำตอบจะถูกทิ้งหากเนื้อหาที่เหลือมีขนาด **≤ `ackMaxChars`** (ค่าเริ่มต้น: 300)
- หาก `HEARTBEAT_OK` ปรากฏอยู่ **ตรงกลาง** ของคำตอบ จะไม่ถูกปฏิบัติเป็นพิเศษ
- สำหรับการแจ้งเตือน **อย่า** ใส่ `HEARTBEAT_OK`; ให้ส่งคืนเฉพาะข้อความแจ้งเตือนเท่านั้น

นอกเหนือจาก Heartbeat หากมี `HEARTBEAT_OK` ที่หลงมาที่ต้น/ท้ายของข้อความ ระบบจะตัดออกและบันทึกล็อก; ข้อความที่มีเพียง `HEARTBEAT_OK` จะถูกทิ้ง

## การตั้งค่า

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

- `agents.defaults.heartbeat` ตั้งค่าพฤติกรรม Heartbeat ทั่วโลก
- `agents.list[].heartbeat` จะผสานทับด้านบน; หากเอเจนต์ใดมีบล็อก `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะรัน Heartbeat
- `channels.defaults.heartbeat` ตั้งค่าค่าเริ่มต้นด้านการมองเห็นสำหรับทุกช่องทาง
- `channels.<channel>.heartbeat` แทนที่ค่าเริ่มต้นของช่องทาง
- `channels.<channel>.accounts.<id>.heartbeat` (ช่องทางแบบหลายบัญชี) แทนที่การตั้งค่ารายช่องทาง

### Heartbeat รายเอเจนต์

หากรายการ `agents.list[]` ใดมีบล็อก `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะรัน Heartbeat บล็อกรายเอเจนต์จะผสานทับ `agents.defaults.heartbeat` (ดังนั้นคุณสามารถตั้งค่าค่าเริ่มต้นที่ใช้ร่วมกันครั้งเดียว แล้วแทนที่รายเอเจนต์ได้)

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

### ตัวอย่างชั่วโมงที่ใช้งาน

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

นอกช่วงเวลานี้ (ก่อน 9 โมงเช้าหรือหลัง 4 ทุ่มตามเวลาตะวันออก) Heartbeat จะถูกข้าม tick ถัดไปที่อยู่ภายในช่วงเวลาจะทำงานตามปกติ

### การตั้งค่า 24/7

หากคุณต้องการให้ Heartbeat ทำงานตลอดทั้งวัน ให้ใช้รูปแบบใดรูปแบบหนึ่งต่อไปนี้:

- ไม่ต้องใส่ `activeHours` เลย (ไม่มีข้อจำกัดด้านช่วงเวลา; นี่คือพฤติกรรมเริ่มต้น)
- ตั้งค่าช่วงเต็มวัน: `activeHours: { start: "00:00", end: "24:00" }`

<Warning>
อย่าตั้งเวลา `start` และ `end` เป็นเวลาเดียวกัน (เช่น `08:00` ถึง `08:00`) กรณีนี้จะถือว่าเป็นช่วงเวลาที่มีความกว้างเป็นศูนย์ ดังนั้น Heartbeat จะถูกข้ามเสมอ
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

### หมายเหตุของฟิลด์

<ParamField path="every" type="string">
  ช่วงเวลาของ Heartbeat (สตริงระยะเวลา; หน่วยเริ่มต้น = นาที)
</ParamField>
<ParamField path="model" type="string">
  การแทนที่โมเดลเพิ่มเติมสำหรับการรัน Heartbeat (`provider/model`)
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  เมื่อเปิดใช้ จะส่งข้อความ `Reasoning:` แยกต่างหากด้วยเมื่อมีให้ใช้งาน (รูปแบบเดียวกับ `/reasoning on`)
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  เมื่อเป็น true การรัน Heartbeat จะใช้บริบท bootstrap แบบเบา และเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของพื้นที่ทำงาน
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  เมื่อเป็น true แต่ละ Heartbeat จะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า ใช้รูปแบบการแยกเดียวกับ Cron `sessionTarget: "isolated"` ลดค่าใช้จ่าย token ต่อ Heartbeat ได้อย่างมาก ใช้ร่วมกับ `lightContext: true` เพื่อประหยัดสูงสุด การกำหนดเส้นทางการส่งยังคงใช้บริบทเซสชันหลัก
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปเมื่อมี lane ที่ยุ่งเพิ่มเติม: งาน subagent หรือคำสั่งซ้อน lane ของ Cron จะเลื่อน Heartbeat เสมอ แม้ไม่มี flag นี้ ดังนั้นโฮสต์โมเดลในเครื่องจะไม่รัน prompt ของ Cron และ Heartbeat พร้อมกัน
</ParamField>
<ParamField path="session" type="string">
  คีย์เซสชันเพิ่มเติมสำหรับการรัน Heartbeat

- `main` (ค่าเริ่มต้น): เซสชันหลักของเอเจนต์
- คีย์เซสชันแบบระบุชัดเจน (คัดลอกจาก `openclaw sessions --json` หรือ [sessions CLI](/th/cli/sessions))
- รูปแบบคีย์เซสชัน: ดู [เซสชัน](/th/concepts/session) และ [กลุ่ม](/th/channels/groups)

</ParamField>
<ParamField path="target" type="string">
- `last`: ส่งไปยังช่องทางภายนอกที่ใช้ล่าสุด
- ช่องทางแบบระบุชัดเจน: ช่องทางหรือ id ของ Plugin ที่กำหนดค่าไว้ใดก็ได้ เช่น `discord`, `matrix`, `telegram`, หรือ `whatsapp`
- `none` (ค่าเริ่มต้น): รัน Heartbeat แต่ **ไม่ส่ง** ออกไปภายนอก

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  ควบคุมพฤติกรรมการส่งแบบ direct/DM `allow`: อนุญาตการส่ง Heartbeat แบบ direct/DM `block`: ระงับการส่งแบบ direct/DM (`reason=dm-blocked`)

</ParamField>
<ParamField path="to" type="string">
  การแทนที่ผู้รับเพิ่มเติม (id เฉพาะช่องทาง เช่น E.164 สำหรับ WhatsApp หรือ id แชต Telegram) สำหรับหัวข้อ/เธรดของ Telegram ให้ใช้ `<chatId>:topic:<messageThreadId>`

</ParamField>
<ParamField path="accountId" type="string">
  id บัญชีเพิ่มเติมสำหรับช่องทางแบบหลายบัญชี เมื่อ `target: "last"` id บัญชีจะใช้กับช่องทางล่าสุดที่ resolve ได้ หากช่องทางนั้นรองรับบัญชี มิฉะนั้นจะถูกละเว้น หาก id บัญชีไม่ตรงกับบัญชีที่กำหนดค่าไว้สำหรับช่องทางที่ resolve ได้ การส่งจะถูกข้าม

</ParamField>
<ParamField path="prompt" type="string">
  แทนที่เนื้อหา prompt เริ่มต้น (ไม่ผสาน)

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  จำนวนอักขระสูงสุดที่อนุญาตหลัง `HEARTBEAT_OK` ก่อนส่งมอบ

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  เมื่อเป็น true จะระงับเพย์โหลดคำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน heartbeat

</ParamField>
<ParamField path="activeHours" type="object">
  จำกัดการรัน heartbeat ให้อยู่ในกรอบเวลา ออบเจ็กต์ที่มี `start` (HH:MM, รวมเวลานี้; ใช้ `00:00` สำหรับต้นวัน), `end` (HH:MM ไม่รวมเวลานี้; อนุญาต `24:00` สำหรับสิ้นวัน) และ `timezone` ที่เป็นค่าไม่บังคับ

- ละไว้หรือ `"user"`: ใช้ `agents.defaults.userTimezone` ของคุณหากตั้งค่าไว้ มิฉะนั้นจะย้อนกลับไปใช้เขตเวลาของระบบโฮสต์
- `"local"`: ใช้เขตเวลาของระบบโฮสต์เสมอ
- ตัวระบุ IANA ใดๆ (เช่น `America/New_York`): ใช้โดยตรง; หากไม่ถูกต้อง จะย้อนกลับไปใช้พฤติกรรม `"user"` ข้างต้น
- `start` และ `end` ต้องไม่เท่ากันสำหรับหน้าต่างที่ใช้งานอยู่; ค่าที่เท่ากันจะถือว่าเป็นความกว้างศูนย์ (อยู่นอกหน้าต่างเสมอ)
- นอกหน้าต่างที่ใช้งานอยู่ heartbeats จะถูกข้ามจนกว่าจะถึง tick ถัดไปภายในหน้าต่าง

</ParamField>

## พฤติกรรมการส่งมอบ

<AccordionGroup>
  <Accordion title="การกำหนดเส้นทางเซสชันและเป้าหมาย">
    - โดยค่าเริ่มต้น Heartbeats จะรันในเซสชันหลักของเอเจนต์ (`agent:<id>:<mainKey>`) หรือ `global` เมื่อ `session.scope = "global"` ตั้งค่า `session` เพื่อแทนที่เป็นเซสชันช่องทางเฉพาะ (Discord/WhatsApp/ฯลฯ)
    - `session` มีผลเฉพาะกับบริบทการรันเท่านั้น; การส่งมอบควบคุมด้วย `target` และ `to`
    - หากต้องการส่งมอบไปยังช่องทาง/ผู้รับเฉพาะ ให้ตั้งค่า `target` + `to` เมื่อใช้ `target: "last"` การส่งมอบจะใช้ช่องทางภายนอกล่าสุดสำหรับเซสชันนั้น
    - การส่งมอบ Heartbeat อนุญาตเป้าหมายโดยตรง/DM ตามค่าเริ่มต้น ตั้งค่า `directPolicy: "block"` เพื่อระงับการส่งไปยังเป้าหมายโดยตรง ในขณะที่ยังคงรันรอบ heartbeat
    - หากคิวหลัก, เลนเซสชันเป้าหมาย, เลน cron หรืองาน cron ที่กำลังใช้งานอยู่ไม่ว่าง heartbeat จะถูกข้ามและลองใหม่ภายหลัง
    - หาก `skipWhenBusy: true` เลน subagent และเลนซ้อนจะเลื่อนการรัน heartbeat ออกไปด้วย
    - หาก `target` แปลงผลแล้วไม่มีปลายทางภายนอก การรันยังคงเกิดขึ้นแต่จะไม่ส่งข้อความขาออก

  </Accordion>
  <Accordion title="พฤติกรรมการมองเห็นและการข้าม">
    - หาก `showOk`, `showAlerts` และ `useIndicator` ถูกปิดใช้งานทั้งหมด การรันจะถูกข้ามตั้งแต่ต้นเป็น `reason=alerts-disabled`
    - หากปิดใช้งานเฉพาะการส่งมอบการแจ้งเตือน OpenClaw ยังสามารถรัน heartbeat, อัปเดตเวลาประทับของงานที่ครบกำหนด, คืนค่าเวลาประทับสถานะว่างของเซสชัน และระงับเพย์โหลดการแจ้งเตือนขาออกได้
    - หากเป้าหมาย heartbeat ที่แปลงผลแล้วรองรับการพิมพ์ OpenClaw จะแสดงสถานะกำลังพิมพ์ขณะที่การรัน heartbeat ทำงานอยู่ โดยใช้เป้าหมายเดียวกับที่ heartbeat จะส่งเอาต์พุตแชทไปให้ และจะถูกปิดใช้งานด้วย `typingMode: "never"`

  </Accordion>
  <Accordion title="วงจรชีวิตเซสชันและการตรวจสอบย้อนหลัง">
    - การตอบกลับที่เป็น heartbeat เท่านั้นจะ **ไม่** ทำให้เซสชันคงอยู่ต่อ เมทาดาทา heartbeat อาจอัปเดตแถวเซสชัน แต่การหมดอายุจากสถานะว่างใช้ `lastInteractionAt` จากข้อความผู้ใช้/ช่องทางจริงล่าสุด และการหมดอายุรายวันใช้ `sessionStartedAt`
    - ประวัติ Control UI และ WebChat จะซ่อนพรอมต์ heartbeat และการรับทราบแบบ OK เท่านั้น transcript ของเซสชันพื้นฐานยังคงมีรอบเหล่านั้นได้สำหรับการตรวจสอบย้อนหลัง/การเล่นซ้ำ
    - [งานเบื้องหลัง](/th/automation/tasks) ที่แยกออกมาสามารถเข้าคิวเหตุการณ์ระบบและปลุก heartbeat เมื่อเซสชันหลักควรรับรู้บางอย่างอย่างรวดเร็ว การปลุกนั้นไม่ได้ทำให้การรัน heartbeat กลายเป็นงานเบื้องหลัง

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

### แต่ละแฟล็กทำอะไร

- `showOk`: ส่งการรับทราบ `HEARTBEAT_OK` เมื่อโมเดลส่งคืนการตอบกลับแบบ OK เท่านั้น
- `showAlerts`: ส่งเนื้อหาการแจ้งเตือนเมื่อโมเดลส่งคืนการตอบกลับที่ไม่ใช่ OK
- `useIndicator`: ส่งเหตุการณ์ indicator สำหรับพื้นผิวสถานะของ UI

หากทั้ง **สามรายการ** เป็น false OpenClaw จะข้ามการรัน heartbeat ทั้งหมด (ไม่มีการเรียกโมเดล)

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

| เป้าหมาย                                     | การกำหนดค่า                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| พฤติกรรมเริ่มต้น (OK เงียบ, เปิดการแจ้งเตือน) | _(ไม่ต้องมีการกำหนดค่า)_                                                                     |
| เงียบทั้งหมด (ไม่มีข้อความ ไม่มี indicator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| เฉพาะ indicator (ไม่มีข้อความ)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK ในช่องทางเดียวเท่านั้น                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (ไม่บังคับ)

หากมีไฟล์ `HEARTBEAT.md` อยู่ใน workspace พรอมต์เริ่มต้นจะบอกให้เอเจนต์อ่านไฟล์นั้น ให้คิดว่าไฟล์นี้เป็น "เช็กลิสต์ heartbeat" ของคุณ: เล็ก เสถียร และปลอดภัยสำหรับใส่ทุก 30 นาที

ในการรันปกติ `HEARTBEAT.md` จะถูกแทรกเฉพาะเมื่อเปิดใช้คำแนะนำ heartbeat สำหรับเอเจนต์เริ่มต้นเท่านั้น การปิด cadence ของ heartbeat ด้วย `0m` หรือการตั้งค่า `includeSystemPromptSection: false` จะละเว้นไฟล์นี้จากบริบท bootstrap ปกติ

หากมี `HEARTBEAT.md` อยู่แต่โดยพฤตินัยว่างเปล่า (มีเฉพาะบรรทัดว่างและหัวข้อ markdown เช่น `# Heading`) OpenClaw จะข้ามการรัน heartbeat เพื่อประหยัดการเรียก API การข้ามนั้นจะถูกรายงานเป็น `reason=empty-heartbeat-file` หากไฟล์หายไป heartbeat ยังคงรันและโมเดลจะตัดสินใจว่าต้องทำอะไร

ให้ไฟล์เล็กมาก (เช็กลิสต์หรือคำเตือนสั้นๆ) เพื่อหลีกเลี่ยงพรอมต์ที่บวมเกินไป

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
    - OpenClaw จะแยกวิเคราะห์บล็อก `tasks:` และตรวจสอบแต่ละงานเทียบกับ `interval` ของงานนั้นเอง
    - เฉพาะงานที่ **ครบกำหนด** เท่านั้นที่จะถูกรวมในพรอมต์ heartbeat สำหรับ tick นั้น
    - หากไม่มีงานครบกำหนด heartbeat จะถูกข้ามทั้งหมด (`reason=no-tasks-due`) เพื่อหลีกเลี่ยงการเรียกโมเดลโดยเปล่าประโยชน์
    - เนื้อหาที่ไม่ใช่งานใน `HEARTBEAT.md` จะถูกรักษาไว้และต่อท้ายเป็นบริบทเพิ่มเติมหลังรายการงานที่ครบกำหนด
    - เวลาประทับการรันล่าสุดของงานจะถูกเก็บไว้ในสถานะเซสชัน (`heartbeatTaskState`) ดังนั้นช่วงเวลาจึงอยู่รอดหลังการรีสตาร์ทปกติ
    - เวลาประทับของงานจะถูกเลื่อนไปข้างหน้าหลังจากการรัน heartbeat เส้นทางตอบกลับปกติเสร็จสมบูรณ์เท่านั้น การรัน `empty-heartbeat-file` / `no-tasks-due` ที่ถูกข้ามจะไม่ทำเครื่องหมายว่างานเสร็จสมบูรณ์

  </Accordion>
</AccordionGroup>

โหมดงานมีประโยชน์เมื่อคุณต้องการให้ไฟล์ heartbeat ไฟล์เดียวเก็บการตรวจสอบตามรอบหลายรายการโดยไม่ต้องจ่ายค่าใช้จ่ายสำหรับทั้งหมดในทุก tick

### เอเจนต์สามารถอัปเดต HEARTBEAT.md ได้ไหม

ได้ — หากคุณขอให้ทำ

`HEARTBEAT.md` เป็นเพียงไฟล์ปกติใน workspace ของเอเจนต์ ดังนั้นคุณสามารถบอกเอเจนต์ (ในแชทปกติ) ได้ประมาณว่า:

- "อัปเดต `HEARTBEAT.md` เพื่อเพิ่มการตรวจสอบปฏิทินรายวัน"
- "เขียน `HEARTBEAT.md` ใหม่ให้สั้นลงและเน้นการติดตามผลในกล่องขาเข้า"

หากคุณต้องการให้เกิดขึ้นเชิงรุก คุณยังสามารถใส่บรรทัดที่ชัดเจนในพรอมต์ heartbeat ของคุณ เช่น: "หากเช็กลิสต์ล้าสมัย ให้อัปเดต HEARTBEAT.md ด้วยรายการที่ดีกว่า"

<Warning>
อย่าใส่ความลับ (คีย์ API, หมายเลขโทรศัพท์, โทเค็นส่วนตัว) ลงใน `HEARTBEAT.md` — ไฟล์นี้จะกลายเป็นส่วนหนึ่งของบริบทพรอมต์
</Warning>

## การปลุกด้วยตนเอง (ตามต้องการ)

คุณสามารถเข้าคิวเหตุการณ์ระบบและเรียก heartbeat ทันทีได้ด้วย:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

หากเอเจนต์หลายตัวกำหนดค่า `heartbeat` ไว้ การปลุกด้วยตนเองจะรัน heartbeat ของเอเจนต์แต่ละตัวเหล่านั้นทันที

ใช้ `--mode next-heartbeat` เพื่อรอ tick ที่กำหนดเวลาไว้ถัดไป

## การส่งมอบ reasoning (ไม่บังคับ)

ตามค่าเริ่มต้น heartbeats จะส่งมอบเฉพาะเพย์โหลด "คำตอบ" สุดท้ายเท่านั้น

หากคุณต้องการความโปร่งใส ให้เปิดใช้:

- `agents.defaults.heartbeat.includeReasoning: true`

เมื่อเปิดใช้งาน heartbeats จะส่งมอบข้อความแยกต่างหากที่ขึ้นต้นด้วย `Reasoning:` ด้วย (รูปแบบเดียวกับ `/reasoning on`) สิ่งนี้มีประโยชน์เมื่อเอเจนต์จัดการหลายเซสชัน/codexes และคุณต้องการเห็นว่าทำไมเอเจนต์จึงตัดสินใจ ping คุณ — แต่ก็อาจรั่วไหลรายละเอียดภายในมากกว่าที่คุณต้องการได้เช่นกัน แนะนำให้ปิดไว้ในแชทกลุ่ม

## การตระหนักถึงต้นทุน

Heartbeats รันรอบเอเจนต์เต็มรูปแบบ ช่วงเวลาที่สั้นลงใช้โทเค็นมากขึ้น เพื่อลดต้นทุน:

- ใช้ `isolatedSession: true` เพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมด (~100K โทเค็นลดเหลือ ~2-5K ต่อการรัน)
- ใช้ `lightContext: true` เพื่อจำกัดไฟล์ bootstrap ให้เหลือเพียง `HEARTBEAT.md`
- ตั้งค่า `model` ที่ถูกกว่า (เช่น `ollama/llama3.2:1b`)
- ทำให้ `HEARTBEAT.md` มีขนาดเล็ก
- ใช้ `target: "none"` หากคุณต้องการเพียงอัปเดตสถานะภายใน

## บริบทล้นหลัง heartbeat

หาก heartbeat ก่อนหน้านี้ปล่อยให้เซสชันที่มีอยู่ใช้โมเดล local ขนาดเล็กกว่า เช่น โมเดล Ollama ที่มีหน้าต่าง 32k และรอบเซสชันหลักถัดไปรายงานว่าบริบทล้น ให้รีเซ็ตโมเดล runtime ของเซสชันกลับไปเป็นโมเดลหลักที่กำหนดค่าไว้ ข้อความรีเซ็ตของ OpenClaw จะระบุเรื่องนี้เมื่อโมเดล runtime ล่าสุดตรงกับ `heartbeat.model` ที่กำหนดค่าไว้

Heartbeats ปัจจุบันจะคงโมเดล runtime ที่มีอยู่ของเซสชันร่วมไว้หลังจากการรันเสร็จสมบูรณ์ คุณยังสามารถใช้ `isolatedSession: true` เพื่อรัน heartbeats ในเซสชันใหม่ ผสานกับ `lightContext: true` เพื่อให้พรอมต์เล็กที่สุด หรือเลือกโมเดล heartbeat ที่มีหน้าต่างบริบทใหญ่พอสำหรับเซสชันร่วม

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติและงาน](/th/automation) — กลไกระบบอัตโนมัติทั้งหมดโดยสรุป
- [งานเบื้องหลัง](/th/automation/tasks) — วิธีติดตามงานที่แยกออกมา
- [เขตเวลา](/th/concepts/timezone) — เขตเวลามีผลต่อการกำหนดเวลา heartbeat อย่างไร
- [การแก้ไขปัญหา](/th/automation/cron-jobs#troubleshooting) — การดีบักปัญหาระบบอัตโนมัติ
