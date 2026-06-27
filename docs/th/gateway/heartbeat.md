---
read_when:
    - การปรับจังหวะ Heartbeat หรือข้อความ
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานตามกำหนดเวลา
sidebarTitle: Heartbeat
summary: ข้อความการโพล Heartbeat และกฎการแจ้งเตือน
title: Heartbeat
x-i18n:
    generated_at: "2026-06-27T17:34:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 415c8f8f18143320a015e44237471b09b8fc091975f78dd9de025310df39645b
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat กับ Cron?** ดูคำแนะนำใน [Automation](/th/automation) ว่าควรใช้แต่ละอย่างเมื่อใด
</Note>

Heartbeat จะเรียกใช้ **รอบการทำงานของเอเจนต์เป็นระยะ** ในเซสชันหลัก เพื่อให้โมเดลแจ้งสิ่งที่ต้องให้ความสนใจได้โดยไม่รบกวนคุณด้วยข้อความถี่เกินไป

Heartbeat เป็นรอบการทำงานในเซสชันหลักตามกำหนดเวลา — ไม่ได้สร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks) ระเบียนงานมีไว้สำหรับงานที่แยกออกมา (การรัน ACP, ซับเอเจนต์, งาน Cron ที่แยกโดดเดี่ยว)

การแก้ไขปัญหา: [งานตามกำหนดเวลา](/th/automation/cron-jobs#troubleshooting)

## เริ่มต้นอย่างรวดเร็ว (ผู้เริ่มต้น)

<Steps>
  <Step title="เลือกความถี่">
    เปิดใช้ Heartbeat ไว้ (ค่าเริ่มต้นคือ `30m` หรือ `1h` สำหรับการยืนยันตัวตน Anthropic แบบ OAuth/โทเค็น รวมถึงการใช้ Claude CLI ซ้ำ) หรือตั้งความถี่ของคุณเอง
  </Step>
  <Step title="เพิ่ม HEARTBEAT.md (ไม่บังคับ)">
    สร้างเช็กลิสต์ `HEARTBEAT.md` ขนาดเล็กหรือบล็อก `tasks:` ในพื้นที่ทำงานของเอเจนต์
  </Step>
  <Step title="ตัดสินใจว่าข้อความ Heartbeat ควรส่งไปที่ใด">
    `target: "none"` เป็นค่าเริ่มต้น; ตั้ง `target: "last"` เพื่อส่งไปยังผู้ติดต่อล่าสุด
  </Step>
  <Step title="การปรับแต่งเพิ่มเติม">
    - เปิดใช้การส่ง reasoning ของ Heartbeat เพื่อความโปร่งใส
    - ใช้บริบท bootstrap แบบเบา หากการรัน Heartbeat ต้องใช้แค่ `HEARTBEAT.md`
    - เปิดใช้เซสชันแยกเพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมดในแต่ละ Heartbeat
    - จำกัด Heartbeat ให้อยู่ในช่วงเวลาทำงาน (เวลาท้องถิ่น)

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
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## ค่าเริ่มต้น

- ช่วงเวลา: `30m` (หรือ `1h` เมื่อโหมดการยืนยันตัวตนที่ตรวจพบคือ Anthropic OAuth/โทเค็น รวมถึงการใช้ Claude CLI ซ้ำ) ตั้ง `agents.defaults.heartbeat.every` หรือ `agents.list[].heartbeat.every` รายเอเจนต์; ใช้ `0m` เพื่อปิดใช้งาน
- เนื้อหา prompt (กำหนดค่าได้ผ่าน `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Timeout: รอบการทำงาน Heartbeat ที่ไม่ได้ตั้งค่าไว้จะใช้ `agents.defaults.timeoutSeconds` เมื่อมีการตั้งค่าไว้ มิฉะนั้นจะใช้ความถี่ Heartbeat โดยจำกัดสูงสุดที่ 600 วินาที ตั้ง `agents.defaults.heartbeat.timeoutSeconds` หรือ `agents.list[].heartbeat.timeoutSeconds` รายเอเจนต์สำหรับงาน Heartbeat ที่ใช้เวลานานขึ้น
- prompt ของ Heartbeat จะถูกส่ง **ตามตัวอักษร** เป็นข้อความของผู้ใช้ system prompt จะมีส่วน "Heartbeat" เฉพาะเมื่อเปิดใช้ Heartbeat สำหรับเอเจนต์เริ่มต้น และการรันถูกตั้งค่าสถานะภายใน
- เมื่อปิดใช้ Heartbeat ด้วย `0m` การรันปกติจะละเว้น `HEARTBEAT.md` จากบริบท bootstrap ด้วย เพื่อให้โมเดลไม่เห็นคำสั่งที่มีไว้เฉพาะ Heartbeat
- ช่วงเวลาทำงาน (`heartbeat.activeHours`) จะตรวจสอบตาม timezone ที่กำหนดค่าไว้ นอกช่วงเวลาดังกล่าว Heartbeat จะถูกข้ามจนกว่าจะถึง tick ถัดไปภายในช่วงเวลา
- Heartbeat จะเลื่อนโดยอัตโนมัติเมื่อมีงาน Cron ทำงานอยู่หรืออยู่ในคิว ตั้ง `heartbeat.skipWhenBusy: true` เพื่อเลื่อนเอเจนต์เมื่อซับเอเจนต์หรือเลนคำสั่งซ้อนของเอเจนต์นั้นเองที่ผูกกับคีย์เซสชันกำลังยุ่งอยู่ด้วย; เอเจนต์พี่น้องจะไม่หยุดพักเพียงเพราะเอเจนต์อื่นมีงานซับเอเจนต์กำลังดำเนินอยู่

## prompt ของ Heartbeat มีไว้เพื่ออะไร

prompt เริ่มต้นตั้งใจให้กว้าง:

- **งานเบื้องหลัง**: "Consider outstanding tasks" กระตุ้นให้เอเจนต์ตรวจสอบงานติดตามผล (กล่องขาเข้า, ปฏิทิน, การเตือน, งานที่อยู่ในคิว) และแจ้งสิ่งเร่งด่วน
- **การเช็กอินกับมนุษย์**: "Checkup sometimes on your human during day time" กระตุ้นให้ส่งข้อความเบา ๆ เป็นครั้งคราวว่า "มีอะไรที่คุณต้องการไหม?" แต่หลีกเลี่ยงสแปมตอนกลางคืนโดยใช้ timezone ท้องถิ่นที่คุณกำหนดค่าไว้ (ดู [Timezone](/th/concepts/timezone))

Heartbeat สามารถตอบสนองต่องาน [เบื้องหลัง](/th/automation/tasks) ที่เสร็จสิ้นแล้วได้ แต่การรัน Heartbeat เองจะไม่สร้างระเบียนงาน

หากคุณต้องการให้ Heartbeat ทำบางอย่างที่เฉพาะเจาะจงมาก (เช่น "ตรวจสอบสถิติ Gmail PubSub" หรือ "ตรวจสอบสถานะ Gateway") ให้ตั้ง `agents.defaults.heartbeat.prompt` (หรือ `agents.list[].heartbeat.prompt`) เป็นเนื้อหาแบบกำหนดเอง (ส่งตามตัวอักษร)

## สัญญาการตอบกลับ

- หากไม่มีสิ่งใดต้องให้ความสนใจ ให้ตอบด้วย **`HEARTBEAT_OK`**
- การรัน Heartbeat ที่ใช้เครื่องมือได้อาจเรียก `heartbeat_respond` พร้อม `notify: false` เพื่อไม่มีอัปเดตที่มองเห็นได้ หรือ `notify: true` พร้อม `notificationText` สำหรับการแจ้งเตือน เมื่อมีอยู่ การตอบกลับจากเครื่องมือแบบมีโครงสร้างจะมีลำดับความสำคัญเหนือ fallback แบบข้อความ
- ระหว่างการรัน Heartbeat, OpenClaw จะถือว่า `HEARTBEAT_OK` เป็น ack เมื่อปรากฏที่ **จุดเริ่มต้นหรือท้ายสุด** ของการตอบกลับ โทเค็นจะถูกตัดออกและการตอบกลับจะถูกทิ้งหากเนื้อหาที่เหลือมีขนาด **≤ `ackMaxChars`** (ค่าเริ่มต้น: 300)
- หาก `HEARTBEAT_OK` ปรากฏใน **ช่วงกลาง** ของการตอบกลับ จะไม่ถูกปฏิบัติเป็นพิเศษ
- สำหรับการแจ้งเตือน **อย่า** ใส่ `HEARTBEAT_OK`; ให้ส่งคืนเฉพาะข้อความแจ้งเตือนเท่านั้น

นอกเหนือจาก Heartbeat แล้ว `HEARTBEAT_OK` ที่หลงมาที่จุดเริ่มต้น/ท้ายสุดของข้อความจะถูกตัดออกและบันทึก log; ข้อความที่มีเพียง `HEARTBEAT_OK` จะถูกทิ้ง

## Config

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Thinking message when available)
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

- `agents.defaults.heartbeat` กำหนดพฤติกรรม Heartbeat ส่วนกลาง
- `agents.list[].heartbeat` ผสานทับด้านบน หาก agent ใดมีบล็อก `heartbeat` จะมี **เฉพาะ agent เหล่านั้น** ที่รัน Heartbeat
- `channels.defaults.heartbeat` กำหนดค่าเริ่มต้นการมองเห็นสำหรับทุกช่องทาง
- `channels.<channel>.heartbeat` เขียนทับค่าเริ่มต้นของช่องทาง
- `channels.<channel>.accounts.<id>.heartbeat` (ช่องทางแบบหลายบัญชี) เขียนทับการตั้งค่ารายช่องทาง

### Heartbeat ราย agent

หากรายการใดใน `agents.list[]` มีบล็อก `heartbeat` จะมี **เฉพาะ agent เหล่านั้น** ที่รัน Heartbeat บล็อกราย agent จะผสานทับด้านบนของ `agents.defaults.heartbeat` (ดังนั้นคุณจึงตั้งค่าเริ่มต้นร่วมกันครั้งเดียว แล้วเขียนทับเป็นราย agent ได้)

ตัวอย่าง: agent สองตัว โดยมีเฉพาะ agent ตัวที่สองที่รัน Heartbeat

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

นอกช่วงเวลานี้ (ก่อน 9 โมงเช้าหรือหลัง 4 ทุ่มตามเวลาตะวันออก) Heartbeat จะถูกข้าม tick ถัดไปที่ถูกกำหนดเวลาไว้ภายในช่วงเวลาจะรันตามปกติ

### การตั้งค่าแบบ 24/7

หากคุณต้องการให้ Heartbeat รันตลอดวัน ให้ใช้รูปแบบใดรูปแบบหนึ่งต่อไปนี้:

- ละเว้น `activeHours` ทั้งหมด (ไม่มีการจำกัดด้วยกรอบเวลา ซึ่งเป็นพฤติกรรมเริ่มต้น)
- ตั้งค่าช่วงเวลาเต็มวัน: `activeHours: { start: "00:00", end: "24:00" }`

<Warning>
อย่าตั้งเวลา `start` และ `end` เป็นค่าเดียวกัน (ตัวอย่างเช่น `08:00` ถึง `08:00`) เพราะจะถือว่าเป็นกรอบเวลาที่มีความกว้างเป็นศูนย์ ดังนั้น Heartbeat จะถูกข้ามเสมอ
</Warning>

### ตัวอย่างหลายบัญชี

ใช้ `accountId` เพื่อกำหนดเป้าหมายไปยังบัญชีเฉพาะบนช่องทางแบบหลายบัญชี เช่น Telegram:

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
  ช่วงเวลา Heartbeat (สตริงระยะเวลา หน่วยเริ่มต้น = นาที)
</ParamField>
<ParamField path="model" type="string">
  การเขียนทับ model แบบไม่บังคับสำหรับการรัน Heartbeat (`provider/model`)
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  เมื่อเปิดใช้ ให้ส่งข้อความ `Thinking` แยกต่างหากด้วยเมื่อพร้อมใช้งาน (รูปแบบเดียวกับ `/reasoning on`)
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  เมื่อเป็น true การรัน Heartbeat จะใช้บริบท bootstrap แบบเบา และเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของ workspace
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  เมื่อเป็น true แต่ละ Heartbeat จะรันใน session ใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า ใช้รูปแบบการแยกเดียวกับ cron `sessionTarget: "isolated"` ลดต้นทุน token ต่อ Heartbeat ได้อย่างมาก ใช้ร่วมกับ `lightContext: true` เพื่อประหยัดสูงสุด การกำหนดเส้นทางการส่งยังคงใช้บริบท session หลัก
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปบน lane ที่ยุ่งเพิ่มเติมของ agent นั้น ได้แก่ subagent ที่ผูกกับ session ของตัวเอง หรืองานคำสั่งแบบซ้อน lane ของ Cron จะเลื่อน Heartbeat เสมอ แม้ไม่มี flag นี้ ดังนั้นโฮสต์ local-model จะไม่รัน prompt ของ Cron และ Heartbeat พร้อมกัน
</ParamField>
<ParamField path="session" type="string">
  คีย์ session แบบไม่บังคับสำหรับการรัน Heartbeat

- `main` (ค่าเริ่มต้น): session หลักของ agent
- คีย์ session ที่ระบุชัดเจน (คัดลอกจาก `openclaw sessions --json` หรือ [CLI sessions](/th/cli/sessions))
- รูปแบบคีย์ session: ดู [Sessions](/th/concepts/session) และ [Groups](/th/channels/groups)

</ParamField>
<ParamField path="target" type="string">
- `last`: ส่งไปยังช่องทางภายนอกที่ใช้ล่าสุด
- ช่องทางที่ระบุชัดเจน: ช่องทางหรือ id ของ plugin ใดก็ได้ที่กำหนดค่าไว้ เช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`
- `none` (ค่าเริ่มต้น): รัน Heartbeat แต่ **ไม่ส่ง** ออกภายนอก

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  ควบคุมพฤติกรรมการส่งแบบ direct/DM `allow`: อนุญาตการส่ง Heartbeat แบบ direct/DM `block`: ระงับการส่งแบบ direct/DM (`reason=dm-blocked`)

</ParamField>
<ParamField path="to" type="string">
  การเขียนทับผู้รับแบบไม่บังคับ (id เฉพาะช่องทาง เช่น E.164 สำหรับ WhatsApp หรือ chat id ของ Telegram) สำหรับหัวข้อ/เธรดของ Telegram ให้ใช้ `<chatId>:topic:<messageThreadId>`

</ParamField>
<ParamField path="accountId" type="string">
  รหัสบัญชีแบบไม่บังคับสำหรับช่องทางหลายบัญชี เมื่อ `target: "last"` รหัสบัญชีจะใช้กับช่องทางล่าสุดที่ resolve ได้ หากช่องทางนั้นรองรับบัญชี มิฉะนั้นจะถูกละเว้น หากรหัสบัญชีไม่ตรงกับบัญชีที่กำหนดค่าไว้สำหรับช่องทางที่ resolve ได้ การส่งจะถูกข้าม

</ParamField>
<ParamField path="prompt" type="string">
  แทนที่เนื้อหา prompt เริ่มต้น (ไม่ merge)

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  จำนวนอักขระสูงสุดที่อนุญาตหลัง `HEARTBEAT_OK` ก่อนส่ง

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  เมื่อเป็น true จะระงับ payload คำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  จำนวนวินาทีสูงสุดที่อนุญาตสำหรับ turn ของเอเจนต์ Heartbeat ก่อนถูกยกเลิก ปล่อยว่างไว้เพื่อใช้ `agents.defaults.timeoutSeconds` เมื่อมีการตั้งค่าไว้ มิฉะนั้นจะใช้ cadence ของ Heartbeat โดยจำกัดสูงสุดที่ 600 วินาที

</ParamField>
<ParamField path="activeHours" type="object">
  จำกัดการรัน Heartbeat ให้อยู่ภายในช่วงเวลา อ็อบเจกต์ที่มี `start` (HH:MM, รวมเวลานี้; ใช้ `00:00` สำหรับจุดเริ่มต้นของวัน), `end` (HH:MM ไม่รวมเวลานี้; อนุญาต `24:00` สำหรับจุดสิ้นสุดของวัน), และ `timezone` แบบไม่บังคับ

- ไม่ระบุหรือ `"user"`: ใช้ `agents.defaults.userTimezone` ของคุณหากตั้งค่าไว้ มิฉะนั้นจะ fallback เป็น timezone ของระบบโฮสต์
- `"local"`: ใช้ timezone ของระบบโฮสต์เสมอ
- ตัวระบุ IANA ใดๆ (เช่น `America/New_York`): ใช้โดยตรง หากไม่ถูกต้อง จะ fallback เป็นพฤติกรรม `"user"` ข้างต้น
- `start` และ `end` ต้องไม่เท่ากันสำหรับหน้าต่างเวลาที่ active; ค่าที่เท่ากันจะถือว่าเป็นความกว้างศูนย์ (อยู่นอกหน้าต่างเสมอ)
- นอกหน้าต่างเวลาที่ active, Heartbeat จะถูกข้ามจนถึง tick ถัดไปที่อยู่ในหน้าต่าง

</ParamField>

## พฤติกรรมการส่ง

<AccordionGroup>
  <Accordion title="การกำหนดเส้นทางเซสชันและเป้าหมาย">
    - Heartbeat จะรันในเซสชันหลักของเอเจนต์โดยค่าเริ่มต้น (`agent:<id>:<mainKey>`) หรือ `global` เมื่อ `session.scope = "global"` ตั้งค่า `session` เพื่อ override เป็นเซสชันช่องทางเฉพาะ (Discord/WhatsApp/ฯลฯ)
    - `session` มีผลเฉพาะกับบริบทการรันเท่านั้น การส่งถูกควบคุมโดย `target` และ `to`
    - หากต้องการส่งไปยังช่องทาง/ผู้รับเฉพาะ ให้ตั้งค่า `target` + `to` เมื่อใช้ `target: "last"` การส่งจะใช้ช่องทางภายนอกล่าสุดสำหรับเซสชันนั้น
    - การส่ง Heartbeat อนุญาตเป้าหมายแบบ direct/DM โดยค่าเริ่มต้น ตั้งค่า `directPolicy: "block"` เพื่อระงับการส่งไปยังเป้าหมาย direct แต่ยังคงรัน turn ของ Heartbeat
    - หากคิวหลัก, lane ของเซสชันเป้าหมาย, lane ของ cron, หรืองาน cron ที่ active ไม่ว่าง Heartbeat จะถูกข้ามและลองใหม่ภายหลัง
    - หาก `skipWhenBusy: true` subagent ที่ผูกกับ session key และ lane ซ้อนของเอเจนต์นี้จะเลื่อนการรัน Heartbeat ด้วย lane ที่ไม่ว่างของเอเจนต์อื่นจะไม่เลื่อนเอเจนต์นี้
    - หาก `target` resolve แล้วไม่มีปลายทางภายนอก การรันยังคงเกิดขึ้น แต่จะไม่มีการส่งข้อความขาออก

  </Accordion>
  <Accordion title="การมองเห็นและพฤติกรรมการข้าม">
    - หาก `showOk`, `showAlerts`, และ `useIndicator` ถูกปิดทั้งหมด การรันจะถูกข้ามตั้งแต่ต้นด้วย `reason=alerts-disabled`
    - หากปิดเฉพาะการส่ง alert, OpenClaw ยังสามารถรัน Heartbeat, อัปเดต timestamp ของงานที่ถึงกำหนด, กู้คืน timestamp idle ของเซสชัน, และระงับ payload alert ภายนอกได้
    - หากเป้าหมาย Heartbeat ที่ resolve ได้รองรับการพิมพ์ OpenClaw จะแสดงสถานะกำลังพิมพ์ขณะการรัน Heartbeat active อยู่ การทำงานนี้ใช้เป้าหมายเดียวกับที่ Heartbeat จะส่ง output แชตไปให้ และถูกปิดด้วย `typingMode: "never"`

  </Accordion>
  <Accordion title="วงจรชีวิตเซสชันและ audit">
    - การตอบกลับเฉพาะ Heartbeat **ไม่** ทำให้เซสชันยังมีชีวิตอยู่ metadata ของ Heartbeat อาจอัปเดตแถวเซสชัน แต่การหมดอายุแบบ idle ใช้ `lastInteractionAt` จากข้อความผู้ใช้/ช่องทางจริงล่าสุด และการหมดอายุรายวันใช้ `sessionStartedAt`
    - ประวัติใน Control UI และ WebChat จะซ่อน prompt ของ Heartbeat และ acknowledgment ที่เป็น OK เท่านั้น transcript ของเซสชันเบื้องหลังยังสามารถมี turn เหล่านั้นสำหรับ audit/replay ได้
    - [งานเบื้องหลัง](/th/automation/tasks) ที่ detached สามารถ enqueue เหตุการณ์ระบบและปลุก Heartbeat เมื่อเซสชันหลักควรรับรู้บางอย่างอย่างรวดเร็ว การปลุกนั้นไม่ได้ทำให้การรัน Heartbeat กลายเป็นงานเบื้องหลัง

  </Accordion>
</AccordionGroup>

## การควบคุมการมองเห็น

โดยค่าเริ่มต้น acknowledgment `HEARTBEAT_OK` จะถูกระงับ ในขณะที่เนื้อหา alert จะถูกส่ง คุณสามารถปรับค่านี้ต่อช่องทางหรือต่อบัญชีได้:

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

- `showOk`: ส่ง acknowledgment `HEARTBEAT_OK` เมื่อโมเดลส่งคืนการตอบกลับแบบ OK เท่านั้น
- `showAlerts`: ส่งเนื้อหา alert เมื่อโมเดลส่งคืนการตอบกลับที่ไม่ใช่ OK
- `useIndicator`: emit เหตุการณ์ indicator สำหรับพื้นผิวสถานะ UI

หากทั้ง **สามรายการ** เป็น false, OpenClaw จะข้ามการรัน Heartbeat ทั้งหมด (ไม่มีการเรียกโมเดล)

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

| เป้าหมาย | Config |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| พฤติกรรมเริ่มต้น (OK เงียบ, เปิด alert) | _(ไม่ต้องมี config)_ |
| เงียบทั้งหมด (ไม่มีข้อความ, ไม่มี indicator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| เฉพาะ indicator (ไม่มีข้อความ) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| OK เฉพาะในช่องทางเดียว | `channels.telegram.heartbeat: { showOk: true }` |

## HEARTBEAT.md (ไม่บังคับ)

หากมีไฟล์ `HEARTBEAT.md` อยู่ใน workspace, prompt เริ่มต้นจะบอกให้เอเจนต์อ่านไฟล์นั้น ให้คิดว่าเป็น "เช็กลิสต์ Heartbeat" ของคุณ: เล็ก เสถียร และปลอดภัยที่จะพิจารณาทุก 30 นาที

ในการรันปกติ `HEARTBEAT.md` จะถูก inject เฉพาะเมื่อเปิดใช้คำแนะนำ Heartbeat สำหรับเอเจนต์เริ่มต้น การปิด cadence ของ Heartbeat ด้วย `0m` หรือการตั้งค่า `includeSystemPromptSection: false` จะละเว้นไฟล์นี้จากบริบท bootstrap ปกติ

ใน Codex harness แบบ native เนื้อหา `HEARTBEAT.md` จะไม่ถูก inject เข้าไปใน turn หากไฟล์มีอยู่และมีเนื้อหาที่ไม่ใช่ whitespace คำสั่งโหมด collaboration ของ Heartbeat จะชี้ Codex ไปที่ไฟล์และบอกให้อ่านก่อนดำเนินการต่อ

หาก `HEARTBEAT.md` มีอยู่แต่แทบว่างเปล่า (มีเพียงบรรทัดว่าง, คอมเมนต์ Markdown/HTML, heading ของ Markdown เช่น `# Heading`, fence marker, หรือ stub เช็กลิสต์ว่าง) OpenClaw จะข้ามการรัน Heartbeat เพื่อประหยัดการเรียก API การข้ามนั้นจะรายงานเป็น `reason=empty-heartbeat-file` หากไฟล์หายไป Heartbeat ยังรันอยู่และโมเดลจะตัดสินใจว่าจะทำอะไร

ทำให้เล็กมาก (เช็กลิสต์สั้นๆ หรือ reminder) เพื่อหลีกเลี่ยง prompt bloat

ตัวอย่าง `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### บล็อก `tasks:`

`HEARTBEAT.md` ยังรองรับบล็อก `tasks:` แบบมีโครงสร้างขนาดเล็กสำหรับการตรวจตาม interval ภายใน Heartbeat เอง

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
    - OpenClaw parse บล็อก `tasks:` และตรวจแต่ละงานเทียบกับ `interval` ของงานนั้นเอง
    - เฉพาะงานที่ **ถึงกำหนด** เท่านั้นที่จะถูกรวมใน prompt ของ Heartbeat สำหรับ tick นั้น
    - หากไม่มีงานที่ถึงกำหนด Heartbeat จะถูกข้ามทั้งหมด (`reason=no-tasks-due`) เพื่อหลีกเลี่ยงการเรียกโมเดลโดยเปล่าประโยชน์
    - เนื้อหาที่ไม่ใช่งานใน `HEARTBEAT.md` จะถูกคงไว้และต่อท้ายเป็นบริบทเพิ่มเติมหลังรายการงานที่ถึงกำหนด
    - timestamp การรันล่าสุดของงานถูกเก็บไว้ในสถานะเซสชัน (`heartbeatTaskState`) ดังนั้น interval จึงอยู่รอดหลังการ restart ปกติ
    - timestamp ของงานจะถูกขยับไปข้างหน้าเฉพาะหลังการรัน Heartbeat ทำเส้นทางตอบกลับปกติเสร็จสิ้น การรันที่ถูกข้ามด้วย `empty-heartbeat-file` / `no-tasks-due` จะไม่ทำเครื่องหมายงานว่าเสร็จแล้ว

  </Accordion>
</AccordionGroup>

โหมดงานมีประโยชน์เมื่อคุณต้องการให้ไฟล์ Heartbeat หนึ่งไฟล์เก็บการตรวจสอบเป็นระยะหลายรายการโดยไม่ต้องจ่ายสำหรับทุกรายการในทุก tick

### เอเจนต์สามารถอัปเดต HEARTBEAT.md ได้หรือไม่?

ได้ หากคุณขอให้ทำ

`HEARTBEAT.md` เป็นเพียงไฟล์ปกติใน workspace ของเอเจนต์ ดังนั้นคุณสามารถบอกเอเจนต์ (ในแชตปกติ) ได้ประมาณนี้:

- "อัปเดต `HEARTBEAT.md` เพื่อเพิ่มการตรวจปฏิทินรายวัน"
- "เขียน `HEARTBEAT.md` ใหม่ให้สั้นลงและเน้นการติดตามผล inbox"

หากคุณต้องการให้สิ่งนี้เกิดขึ้นเชิงรุก คุณยังสามารถใส่บรรทัดชัดเจนใน prompt ของ Heartbeat เช่น: "หากเช็กลิสต์เริ่มล้าสมัย ให้อัปเดต HEARTBEAT.md ด้วยรายการที่ดีกว่า"

<Warning>
อย่าใส่ secret (API key, หมายเลขโทรศัพท์, token ส่วนตัว) ลงใน `HEARTBEAT.md` เพราะมันจะกลายเป็นส่วนหนึ่งของบริบท prompt
</Warning>

## การปลุกด้วยตนเอง (ตามต้องการ)

คุณสามารถ enqueue เหตุการณ์ระบบและ trigger Heartbeat ทันทีด้วย:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

หากเอเจนต์หลายตัวกำหนดค่า `heartbeat` ไว้ การปลุกด้วยตนเองจะรัน Heartbeat ของเอเจนต์เหล่านั้นแต่ละตัวทันที

ใช้ `--mode next-heartbeat` เพื่อรอ tick ที่กำหนดไว้ถัดไป

## การส่ง reasoning (ไม่บังคับ)

โดยค่าเริ่มต้น Heartbeat จะส่งเฉพาะ payload "คำตอบ" สุดท้ายเท่านั้น

หากคุณต้องการความโปร่งใส ให้เปิดใช้:

- `agents.defaults.heartbeat.includeReasoning: true`

เมื่อเปิดใช้ Heartbeat จะส่งข้อความแยกต่างหากที่ขึ้นต้นด้วย `Thinking` ด้วย (รูปแบบเดียวกับ `/reasoning on`) สิ่งนี้มีประโยชน์เมื่อเอเจนต์กำลังจัดการหลายเซสชัน/หลาย codex และคุณต้องการเห็นว่าทำไมมันจึงตัดสินใจ ping คุณ แต่ก็อาจรั่วรายละเอียดภายในมากกว่าที่คุณต้องการได้เช่นกัน ควรปิดไว้ในแชตกลุ่ม

## ความตระหนักเรื่องค่าใช้จ่าย

Heartbeat รัน turn ของเอเจนต์แบบเต็ม interval ที่สั้นกว่าจะใช้ token มากขึ้น เพื่อลดค่าใช้จ่าย:

- ใช้ `isolatedSession: true` เพื่อหลีกเลี่ยงการส่งประวัติการสนทนาเต็มรูปแบบ (~100K token ลดลงเหลือ ~2-5K ต่อการรัน)
- ใช้ `lightContext: true` เพื่อจำกัดไฟล์ bootstrap ให้เหลือเพียง `HEARTBEAT.md`
- ตั้งค่า `model` ที่ถูกกว่า (เช่น `ollama/llama3.2:1b`)
- ทำให้ `HEARTBEAT.md` เล็ก
- ใช้ `target: "none"` หากคุณต้องการเพียงอัปเดตสถานะภายใน

## Context overflow หลัง Heartbeat

หากก่อนหน้านี้ Heartbeat ทิ้งเซสชันที่มีอยู่ไว้บนโมเดล local ที่เล็กกว่า เช่น โมเดล Ollama ที่มีหน้าต่าง 32k และ turn ถัดไปของ main-session รายงาน context overflow ให้ reset runtime model ของเซสชันกลับไปเป็นโมเดลหลักที่กำหนดค่าไว้ ข้อความ reset ของ OpenClaw จะระบุเรื่องนี้เมื่อ runtime model ล่าสุดตรงกับ `heartbeat.model` ที่กำหนดค่าไว้

Heartbeat ปัจจุบันจะคง runtime model ที่มีอยู่ของเซสชันร่วมไว้หลังการรันเสร็จสิ้น คุณยังสามารถใช้ `isolatedSession: true` เพื่อรัน Heartbeat ในเซสชันใหม่ รวมกับ `lightContext: true` เพื่อให้ได้ prompt ที่เล็กที่สุด หรือเลือกโมเดล Heartbeat ที่มีหน้าต่าง context ใหญ่พอสำหรับเซสชันร่วมได้

## ที่เกี่ยวข้อง

- [Automation](/th/automation) — กลไก Automation ทั้งหมดโดยสรุป
- [งานเบื้องหลัง](/th/automation/tasks) — วิธีติดตามงานที่แยกออกไปรัน
- [เขตเวลา](/th/concepts/timezone) — วิธีที่เขตเวลามีผลต่อการกำหนดเวลา Heartbeat
- [การแก้ปัญหา](/th/automation/cron-jobs#troubleshooting) — การดีบักปัญหา Automation
