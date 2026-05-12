---
read_when:
    - การปรับความถี่ของ Heartbeat หรือข้อความ
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานตามกำหนดเวลา
sidebarTitle: Heartbeat
summary: ข้อความการโพลของ Heartbeat และกฎการแจ้งเตือน
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T00:59:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: de1fee0df75d9e8f356dc02d089f61ae5048c302169acc363eee2149e09aacb3
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat เทียบกับ cron?** ดู [Automation](/th/automation) สำหรับคำแนะนำว่าเมื่อใดควรใช้แต่ละอย่าง
</Note>

Heartbeat เรียกใช้ **รอบการทำงานของเอเจนต์เป็นระยะ** ในเซสชันหลัก เพื่อให้โมเดลสามารถแจ้งสิ่งที่ต้องให้ความสนใจได้โดยไม่ส่งข้อความรบกวนคุณมากเกินไป

Heartbeat คือรอบการทำงานของเซสชันหลักตามกำหนดเวลา — มัน **ไม่** สร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks) ระเบียนงานมีไว้สำหรับงานที่แยกออกไป (การรัน ACP, subagent, งาน cron แบบแยก)

การแก้ไขปัญหา: [งานตามกำหนดเวลา](/th/automation/cron-jobs#troubleshooting)

## เริ่มต้นอย่างรวดเร็ว (ผู้เริ่มต้น)

<Steps>
  <Step title="เลือกความถี่">
    เปิดใช้ heartbeat ไว้ (ค่าเริ่มต้นคือ `30m` หรือ `1h` สำหรับการยืนยันตัวตน Anthropic OAuth/token รวมถึงการใช้ Claude CLI ซ้ำ) หรือตั้งความถี่ของคุณเอง
  </Step>
  <Step title="เพิ่ม HEARTBEAT.md (ไม่บังคับ)">
    สร้างเช็กลิสต์ `HEARTBEAT.md` ขนาดเล็ก หรือบล็อก `tasks:` ในพื้นที่ทำงานของเอเจนต์
  </Step>
  <Step title="ตัดสินใจว่าจะส่งข้อความ heartbeat ไปที่ใด">
    `target: "none"` เป็นค่าเริ่มต้น; ตั้งค่า `target: "last"` เพื่อส่งไปยังผู้ติดต่อล่าสุด
  </Step>
  <Step title="ปรับแต่งเพิ่มเติม">
    - เปิดใช้การส่งเหตุผลของ heartbeat เพื่อความโปร่งใส
    - ใช้บริบทเริ่มต้นแบบเบา หากการรัน heartbeat ต้องการเพียง `HEARTBEAT.md`
    - เปิดใช้เซสชันแบบแยกเพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมดในแต่ละ heartbeat
    - จำกัด heartbeat ให้อยู่เฉพาะช่วงเวลาที่ใช้งาน (เวลาท้องถิ่น)

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

- ช่วงเวลา: `30m` (หรือ `1h` เมื่อโหมดการยืนยันตัวตนที่ตรวจพบคือ Anthropic OAuth/token auth รวมถึงการใช้ Claude CLI ซ้ำ) ตั้งค่า `agents.defaults.heartbeat.every` หรือ `agents.list[].heartbeat.every` รายเอเจนต์; ใช้ `0m` เพื่อปิดใช้งาน
- เนื้อหาพรอมป์ (กำหนดค่าได้ผ่าน `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- พรอมป์ heartbeat จะถูกส่ง **ตามตัวอักษร** เป็นข้อความของผู้ใช้ system prompt จะมีส่วน "Heartbeat" เฉพาะเมื่อเปิดใช้ heartbeat สำหรับเอเจนต์เริ่มต้น และการรันถูกทำเครื่องหมายไว้ภายใน
- เมื่อปิดใช้ heartbeat ด้วย `0m` การรันปกติจะไม่รวม `HEARTBEAT.md` จากบริบทเริ่มต้นด้วย เพื่อไม่ให้โมเดลเห็นคำสั่งที่มีไว้สำหรับ heartbeat เท่านั้น
- ช่วงเวลาที่ใช้งาน (`heartbeat.activeHours`) จะถูกตรวจในเขตเวลาที่กำหนดค่าไว้นอกช่วงเวลา heartbeat จะถูกข้ามจนกว่าจะถึง tick ถัดไปที่อยู่ในช่วงเวลา
- Heartbeat จะเลื่อนออกโดยอัตโนมัติขณะที่งาน cron กำลังทำงานหรืออยู่ในคิว ตั้งค่า `heartbeat.skipWhenBusy: true` เพื่อเลื่อนเมื่อมี lane ที่ยุ่งเพิ่มเติม (งาน subagent หรือคำสั่งซ้อน) ด้วย; สิ่งนี้มีประโยชน์สำหรับ Ollama ในเครื่องและโฮสต์แบบ runtime เดี่ยวที่มีข้อจำกัดอื่น ๆ

## พรอมป์ heartbeat มีไว้เพื่ออะไร

พรอมป์เริ่มต้นตั้งใจให้กว้าง:

- **งานเบื้องหลัง**: "พิจารณางานที่ยังค้างอยู่" กระตุ้นให้เอเจนต์ตรวจสอบการติดตามผล (กล่องขาเข้า ปฏิทิน ตัวเตือน งานในคิว) และแจ้งสิ่งที่เร่งด่วน
- **การเช็กอินกับมนุษย์**: "ตรวจดูมนุษย์ของคุณเป็นครั้งคราวในช่วงกลางวัน" กระตุ้นให้ส่งข้อความเบา ๆ เป็นครั้งคราวว่า "มีอะไรที่คุณต้องการไหม?" แต่หลีกเลี่ยงการส่งรบกวนตอนกลางคืนโดยใช้เขตเวลาท้องถิ่นที่คุณกำหนดค่าไว้ (ดู [เขตเวลา](/th/concepts/timezone))

Heartbeat สามารถตอบสนองต่องาน [เบื้องหลัง](/th/automation/tasks) ที่เสร็จแล้วได้ แต่การรัน heartbeat เองจะไม่สร้างระเบียนงาน

หากคุณต้องการให้ heartbeat ทำบางอย่างที่เฉพาะเจาะจงมาก (เช่น "ตรวจสถิติ Gmail PubSub" หรือ "ตรวจสอบสุขภาพ gateway") ให้ตั้งค่า `agents.defaults.heartbeat.prompt` (หรือ `agents.list[].heartbeat.prompt`) เป็นเนื้อหาแบบกำหนดเอง (ส่งตามตัวอักษร)

## สัญญาการตอบกลับ

- หากไม่มีสิ่งใดต้องให้ความสนใจ ให้ตอบด้วย **`HEARTBEAT_OK`**
- การรัน heartbeat ที่ใช้เครื่องมือได้อาจเรียก `heartbeat_respond` พร้อม `notify: false` เพื่อไม่ให้มีการอัปเดตที่มองเห็นได้ หรือ `notify: true` พร้อม `notificationText` สำหรับการแจ้งเตือน เมื่อมีอยู่ การตอบกลับเครื่องมือแบบมีโครงสร้างจะมีลำดับความสำคัญเหนือกว่าข้อความสำรอง
- ระหว่างการรัน heartbeat, OpenClaw จะถือว่า `HEARTBEAT_OK` เป็น ack เมื่อปรากฏที่ **ต้นหรือท้าย** ของการตอบกลับ token จะถูกตัดออก และการตอบกลับจะถูกทิ้งหากเนื้อหาที่เหลือมีขนาด **≤ `ackMaxChars`** (ค่าเริ่มต้น: 300)
- หาก `HEARTBEAT_OK` ปรากฏใน **กลาง** การตอบกลับ จะไม่ถูกปฏิบัติเป็นพิเศษ
- สำหรับการแจ้งเตือน **อย่า** ใส่ `HEARTBEAT_OK`; ให้ส่งคืนเฉพาะข้อความแจ้งเตือน

นอก heartbeat, `HEARTBEAT_OK` ที่หลุดมาที่ต้น/ท้ายของข้อความจะถูกตัดออกและบันทึกลงล็อก; ข้อความที่มีเพียง `HEARTBEAT_OK` จะถูกทิ้ง

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

- `agents.defaults.heartbeat` ตั้งค่าพฤติกรรม heartbeat ทั่วทั้งระบบ
- `agents.list[].heartbeat` ผสานทับด้านบน; หากเอเจนต์ใดมีบล็อก `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะรัน heartbeat
- `channels.defaults.heartbeat` ตั้งค่าค่าเริ่มต้นด้านการมองเห็นสำหรับทุกช่องทาง
- `channels.<channel>.heartbeat` แทนที่ค่าเริ่มต้นของช่องทาง
- `channels.<channel>.accounts.<id>.heartbeat` (ช่องทางหลายบัญชี) แทนที่การตั้งค่ารายช่องทาง

### Heartbeat ต่อเอเจนต์

หากรายการใดใน `agents.list[]` มีบล็อก `heartbeat` **เฉพาะเอเจนต์เหล่านั้นเท่านั้น** ที่จะรัน Heartbeat บล็อกต่อเอเจนต์จะผสานทับบน `agents.defaults.heartbeat` (ดังนั้นคุณจึงตั้งค่าเริ่มต้นที่ใช้ร่วมกันได้ครั้งเดียว แล้ว override ต่อเอเจนต์)

ตัวอย่าง: เอเจนต์สองตัว โดยมีเฉพาะเอเจนต์ตัวที่สองที่รัน Heartbeat

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

นอกช่วงเวลานี้ (ก่อน 9am หรือหลัง 10pm ตามเวลาฝั่งตะวันออก) Heartbeat จะถูกข้าม tick ที่กำหนดเวลาถัดไปซึ่งอยู่ภายในช่วงเวลาจะรันตามปกติ

### การตั้งค่า 24/7

หากคุณต้องการให้ Heartbeat รันตลอดทั้งวัน ให้ใช้รูปแบบใดรูปแบบหนึ่งต่อไปนี้:

- ละ `activeHours` ทั้งหมด (ไม่มีข้อจำกัดเรื่องช่วงเวลา ซึ่งเป็นพฤติกรรมเริ่มต้น)
- ตั้งค่าช่วงเวลาเต็มวัน: `activeHours: { start: "00:00", end: "24:00" }`

<Warning>
อย่าตั้งเวลา `start` และ `end` เป็นเวลาเดียวกัน (เช่น `08:00` ถึง `08:00`) ระบบจะถือว่าเป็นหน้าต่างเวลาที่มีความกว้างเป็นศูนย์ ดังนั้น Heartbeat จะถูกข้ามเสมอ
</Warning>

### ตัวอย่างหลายบัญชี

ใช้ `accountId` เพื่อกำหนดเป้าหมายไปยังบัญชีเฉพาะบนช่องทางที่มีหลายบัญชี เช่น Telegram:

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
  เมื่อเปิดใช้งาน จะส่งข้อความ `Reasoning:` แยกต่างหากด้วยเมื่อมีให้ใช้งาน (รูปแบบเดียวกับ `/reasoning on`)
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  เมื่อเป็น true การรัน Heartbeat จะใช้บริบทบูตสแตรปแบบเบา และเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์บูตสแตรปของเวิร์กสเปซ
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  เมื่อเป็น true แต่ละ Heartbeat จะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า ใช้รูปแบบการแยกเดียวกับ cron `sessionTarget: "isolated"` ลดต้นทุนโทเค็นต่อ Heartbeat อย่างมาก ใช้ร่วมกับ `lightContext: true` เพื่อประหยัดสูงสุด การกำหนดเส้นทางการส่งยังคงใช้บริบทของเซสชันหลัก
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปในเลนที่ยุ่งเป็นพิเศษ: งาน subagent หรือคำสั่งแบบซ้อน เลน Cron จะเลื่อน Heartbeat เสมอแม้ไม่มีแฟล็กนี้ เพื่อให้โฮสต์โมเดลในเครื่องไม่รันพรอมป์ Cron และ Heartbeat พร้อมกัน
</ParamField>
<ParamField path="session" type="string">
  คีย์เซสชันที่ไม่บังคับสำหรับการรัน Heartbeat.

- `main` (ค่าเริ่มต้น): เซสชันหลักของเอเจนต์
- คีย์เซสชันแบบระบุชัดเจน (คัดลอกจาก `openclaw sessions --json` หรือ [sessions CLI](/th/cli/sessions))
- รูปแบบคีย์เซสชัน: ดู [เซสชัน](/th/concepts/session) และ [กลุ่ม](/th/channels/groups)

</ParamField>
<ParamField path="target" type="string">
- `last`: ส่งไปยังช่องทางภายนอกที่ใช้ล่าสุด
- ช่องทางแบบระบุชัดเจน: ช่องทางหรือรหัส Plugin ใด ๆ ที่กำหนดค่าไว้ เช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`
- `none` (ค่าเริ่มต้น): เรียกใช้ Heartbeat แต่**ไม่ส่ง**ออกภายนอก

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  ควบคุมพฤติกรรมการส่งแบบตรง/DM `allow`: อนุญาตให้ส่ง Heartbeat แบบตรง/DM `block`: ระงับการส่งแบบตรง/DM (`reason=dm-blocked`)

</ParamField>
<ParamField path="to" type="string">
  ตัวเลือกแทนที่ผู้รับ (รหัสเฉพาะช่องทาง เช่น E.164 สำหรับ WhatsApp หรือรหัสแชต Telegram) สำหรับหัวข้อ/เธรด Telegram ให้ใช้ `<chatId>:topic:<messageThreadId>`

</ParamField>
<ParamField path="accountId" type="string">
  รหัสบัญชีเสริมสำหรับช่องทางหลายบัญชี เมื่อ `target: "last"` รหัสบัญชีจะนำไปใช้กับช่องทางล่าสุดที่แปลงค่าได้หากช่องทางนั้นรองรับบัญชี มิฉะนั้นจะถูกละเว้น หากรหัสบัญชีไม่ตรงกับบัญชีที่กำหนดค่าไว้สำหรับช่องทางที่แปลงค่าได้ ระบบจะข้ามการส่ง

</ParamField>
<ParamField path="prompt" type="string">
  แทนที่เนื้อหาพรอมป์เริ่มต้น (ไม่รวมเข้าด้วยกัน)

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  จำนวนอักขระสูงสุดที่อนุญาตหลัง `HEARTBEAT_OK` ก่อนส่งมอบ

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  เมื่อเป็น true จะระงับ payload คำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน heartbeat

</ParamField>
<ParamField path="activeHours" type="object">
  จำกัดการรัน heartbeat ให้อยู่ในช่วงเวลา อ็อบเจกต์ที่มี `start` (HH:MM, รวมเวลานี้ด้วย; ใช้ `00:00` สำหรับต้นวัน), `end` (HH:MM ไม่รวมเวลานี้; อนุญาตให้ใช้ `24:00` สำหรับสิ้นวัน) และ `timezone` ที่ไม่บังคับ

- ละไว้หรือ `"user"`: ใช้ `agents.defaults.userTimezone` ของคุณหากตั้งค่าไว้ มิฉะนั้นจะย้อนกลับไปใช้เขตเวลาของระบบโฮสต์
- `"local"`: ใช้เขตเวลาของระบบโฮสต์เสมอ
- ตัวระบุ IANA ใดๆ (เช่น `America/New_York`): ใช้โดยตรง; หากไม่ถูกต้อง จะย้อนกลับไปใช้ลักษณะการทำงานแบบ `"user"` ข้างต้น
- `start` และ `end` ต้องไม่เท่ากันสำหรับช่วงเวลาที่เปิดใช้งาน; ค่าที่เท่ากันจะถูกถือว่าเป็นความกว้างศูนย์ (อยู่นอกช่วงเวลาเสมอ)
- นอกช่วงเวลาที่เปิดใช้งาน heartbeat จะถูกข้ามจนกว่าจะถึง tick ถัดไปที่อยู่ภายในช่วงเวลา

</ParamField>

## ลักษณะการทำงานของการส่งมอบ

<AccordionGroup>
  <Accordion title="การกำหนดเส้นทางเซสชันและเป้าหมาย">
    - โดยค่าเริ่มต้น Heartbeat จะรันในเซสชันหลักของเอเจนต์ (`agent:<id>:<mainKey>`) หรือ `global` เมื่อ `session.scope = "global"` ตั้งค่า `session` เพื่อ override ไปยังเซสชันช่องทางเฉพาะ (Discord/WhatsApp/etc.)
    - `session` มีผลเฉพาะกับบริบทการรัน; การส่งมอบถูกควบคุมโดย `target` และ `to`
    - หากต้องการส่งมอบไปยังช่องทาง/ผู้รับเฉพาะ ให้ตั้งค่า `target` + `to` เมื่อใช้ `target: "last"` การส่งมอบจะใช้ช่องทางภายนอกล่าสุดสำหรับเซสชันนั้น
    - การส่งมอบ Heartbeat อนุญาตเป้าหมายแบบตรง/DM โดยค่าเริ่มต้น ตั้งค่า `directPolicy: "block"` เพื่อระงับการส่งไปยังเป้าหมายโดยตรง ขณะที่ยังคงรันรอบ Heartbeat
    - หากคิวหลัก, lane ของเซสชันเป้าหมาย, lane ของ cron หรืองาน cron ที่กำลังทำงานอยู่ไม่ว่าง Heartbeat จะถูกข้ามและลองใหม่ภายหลัง
    - หาก `skipWhenBusy: true` lane ของ subagent และ nested lane จะเลื่อนการรัน Heartbeat ออกไปด้วย
    - หาก `target` resolve แล้วไม่มีปลายทางภายนอก การรันยังคงเกิดขึ้นแต่จะไม่มีการส่งข้อความออกไป

  </Accordion>
  <Accordion title="การมองเห็นและลักษณะการข้าม">
    - หาก `showOk`, `showAlerts` และ `useIndicator` ถูกปิดใช้งานทั้งหมด การรันจะถูกข้ามตั้งแต่ต้นด้วย `reason=alerts-disabled`
    - หากปิดใช้งานเฉพาะการส่งมอบ alert OpenClaw ยังสามารถรัน Heartbeat, อัปเดต timestamp ของงานที่ถึงกำหนด, กู้คืน timestamp idle ของเซสชัน และระงับ payload alert ภายนอกได้
    - หากเป้าหมาย Heartbeat ที่ resolve ได้รองรับการแสดงว่ากำลังพิมพ์ OpenClaw จะแสดงว่ากำลังพิมพ์ขณะที่การรัน Heartbeat ทำงานอยู่ โดยใช้เป้าหมายเดียวกับที่ Heartbeat จะส่งเอาต์พุตแชตไปให้ และถูกปิดใช้งานด้วย `typingMode: "never"`

  </Accordion>
  <Accordion title="วงจรชีวิตเซสชันและ audit">
    - การตอบกลับเฉพาะ Heartbeat **จะไม่** ทำให้เซสชันคงอยู่ต่อ เมตาดาตา Heartbeat อาจอัปเดตแถวเซสชัน แต่การหมดอายุจาก idle ใช้ `lastInteractionAt` จากข้อความผู้ใช้/ช่องทางจริงล่าสุด และการหมดอายุรายวันใช้ `sessionStartedAt`
    - ประวัติ Control UI และ WebChat จะซ่อน prompt ของ Heartbeat และการตอบรับที่เป็น OK เท่านั้น transcript ของเซสชันเบื้องหลังยังคงมีรอบเหล่านั้นสำหรับ audit/replay ได้
    - [งานเบื้องหลัง](/th/automation/tasks) ที่แยกออกมาสามารถ enqueue เหตุการณ์ระบบและปลุก Heartbeat เมื่อเซสชันหลักควรรับรู้บางอย่างอย่างรวดเร็ว การปลุกนั้นไม่ได้ทำให้การรัน Heartbeat กลายเป็นงานเบื้องหลัง

  </Accordion>
</AccordionGroup>

## การควบคุมการมองเห็น

โดยค่าเริ่มต้น การตอบรับ `HEARTBEAT_OK` จะถูกระงับ ขณะที่เนื้อหา alert จะถูกส่งมอบ คุณสามารถปรับค่านี้เป็นรายช่องทางหรือรายบัญชีได้:

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

ลำดับความสำคัญ: รายบัญชี → รายช่องทาง → ค่าเริ่มต้นของช่องทาง → ค่าเริ่มต้นในตัว

### แต่ละ flag ทำอะไร

- `showOk`: ส่งการตอบรับ `HEARTBEAT_OK` เมื่อโมเดลส่งคืนการตอบกลับที่เป็น OK เท่านั้น
- `showAlerts`: ส่งเนื้อหา alert เมื่อโมเดลส่งคืนการตอบกลับที่ไม่ใช่ OK
- `useIndicator`: ส่งเหตุการณ์ indicator สำหรับพื้นผิวสถานะของ UI

หากทั้ง **สามรายการ** เป็น false OpenClaw จะข้ามการรัน Heartbeat ทั้งหมด (ไม่มีการเรียกโมเดล)

### ตัวอย่างรายช่องทางเทียบกับรายบัญชี

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
| ลักษณะการทำงานเริ่มต้น (OK เงียบ, เปิด alert) | _(no config needed)_                                                                     |
| เงียบทั้งหมด (ไม่มีข้อความ, ไม่มี indicator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| เฉพาะ indicator (ไม่มีข้อความ)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK ในช่องทางเดียวเท่านั้น                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (ไม่บังคับ)

หากมีไฟล์ `HEARTBEAT.md` อยู่ใน workspace prompt เริ่มต้นจะบอกให้เอเจนต์อ่านไฟล์นั้น ให้คิดว่าไฟล์นี้เป็น "เช็กลิสต์ heartbeat" ของคุณ: เล็ก, เสถียร และปลอดภัยพอที่จะรวมทุก 30 นาที

ในการรันปกติ `HEARTBEAT.md` จะถูกฉีดเข้าไปเฉพาะเมื่อเปิดใช้งานคำแนะนำ Heartbeat สำหรับเอเจนต์เริ่มต้นเท่านั้น การปิดใช้งาน cadence ของ Heartbeat ด้วย `0m` หรือการตั้งค่า `includeSystemPromptSection: false` จะละเว้นไฟล์นี้จากบริบท bootstrap ปกติ

หากมี `HEARTBEAT.md` อยู่แต่แทบว่างเปล่า (มีเฉพาะบรรทัดว่างและ header ของ markdown เช่น `# Heading`) OpenClaw จะข้ามการรัน Heartbeat เพื่อประหยัดการเรียก API การข้ามนั้นจะถูกรายงานเป็น `reason=empty-heartbeat-file` หากไฟล์หายไป Heartbeat จะยังคงรัน และโมเดลจะตัดสินใจว่าจะทำอะไร

ทำให้ไฟล์เล็กมาก (เช็กลิสต์หรือ reminder สั้นๆ) เพื่อหลีกเลี่ยง prompt ที่บวมเกินไป

ตัวอย่าง `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### บล็อก `tasks:`

`HEARTBEAT.md` ยังรองรับบล็อก `tasks:` แบบมีโครงสร้างขนาดเล็ก สำหรับการตรวจสอบตาม interval ภายใน Heartbeat เอง

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
  <Accordion title="ลักษณะการทำงาน">
    - OpenClaw parse บล็อก `tasks:` และตรวจสอบแต่ละงานเทียบกับ `interval` ของงานนั้นเอง
    - เฉพาะงานที่ **ถึงกำหนด** เท่านั้นที่จะถูกรวมใน prompt ของ Heartbeat สำหรับ tick นั้น
    - หากไม่มีงานถึงกำหนด Heartbeat จะถูกข้ามทั้งหมด (`reason=no-tasks-due`) เพื่อหลีกเลี่ยงการเรียกโมเดลโดยเปล่าประโยชน์
    - เนื้อหาที่ไม่ใช่งานใน `HEARTBEAT.md` จะถูกเก็บไว้และผนวกเป็นบริบทเพิ่มเติมหลังรายการงานที่ถึงกำหนด
    - timestamp การรันล่าสุดของงานจะถูกจัดเก็บในสถานะเซสชัน (`heartbeatTaskState`) ดังนั้น interval จึงยังอยู่รอดหลังการ restart ปกติ
    - timestamp ของงานจะถูกเลื่อนไปข้างหน้าเฉพาะหลังจากการรัน Heartbeat เส้นทางตอบกลับปกติเสร็จสิ้นแล้ว การรันที่ถูกข้ามด้วย `empty-heartbeat-file` / `no-tasks-due` จะไม่ทำเครื่องหมายว่างานเสร็จแล้ว

  </Accordion>
</AccordionGroup>

โหมดงานมีประโยชน์เมื่อคุณต้องการให้ไฟล์ Heartbeat ไฟล์เดียวเก็บการตรวจสอบเป็นระยะหลายรายการ โดยไม่ต้องจ่ายสำหรับทั้งหมดในทุก tick

### เอเจนต์สามารถอัปเดต HEARTBEAT.md ได้ไหม?

ได้ — หากคุณขอให้ทำ

`HEARTBEAT.md` เป็นเพียงไฟล์ปกติใน workspace ของเอเจนต์ ดังนั้นคุณสามารถบอกเอเจนต์ (ในแชตปกติ) ได้ เช่น:

- "อัปเดต `HEARTBEAT.md` เพื่อเพิ่มการตรวจสอบปฏิทินรายวัน"
- "เขียน `HEARTBEAT.md` ใหม่ให้สั้นลงและเน้นการติดตามกล่องจดหมาย"

หากคุณต้องการให้สิ่งนี้เกิดขึ้นแบบ proactive คุณสามารถรวมบรรทัดที่ชัดเจนไว้ใน prompt ของ Heartbeat ได้ เช่น: "หากเช็กลิสต์ล้าสมัย ให้อัปเดต HEARTBEAT.md ด้วยรายการที่ดีกว่า"

<Warning>
อย่าใส่ secrets (API keys, phone numbers, private tokens) ลงใน `HEARTBEAT.md` — ไฟล์นี้จะกลายเป็นส่วนหนึ่งของบริบท prompt
</Warning>

## การปลุกด้วยตนเอง (ตามต้องการ)

คุณสามารถ enqueue เหตุการณ์ระบบและ trigger Heartbeat ทันทีด้วย:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

หากมีหลายเอเจนต์ที่กำหนดค่า `heartbeat` ไว้ การปลุกด้วยตนเองจะรัน Heartbeat ของเอเจนต์เหล่านั้นแต่ละตัวทันที

ใช้ `--mode next-heartbeat` เพื่อรอ tick ที่กำหนดเวลาไว้ถัดไป

## การส่งมอบ reasoning (ไม่บังคับ)

โดยค่าเริ่มต้น Heartbeat จะส่งมอบเฉพาะ payload "คำตอบ" สุดท้ายเท่านั้น

หากคุณต้องการความโปร่งใส ให้เปิดใช้งาน:

- `agents.defaults.heartbeat.includeReasoning: true`

เมื่อเปิดใช้งาน Heartbeat จะส่งมอบข้อความแยกต่างหากที่ขึ้นต้นด้วย `Reasoning:` ด้วย (รูปแบบเดียวกับ `/reasoning on`) สิ่งนี้มีประโยชน์เมื่อเอเจนต์กำลังจัดการหลายเซสชัน/codex และคุณต้องการเห็นว่าทำไมเอเจนต์จึงตัดสินใจ ping คุณ — แต่ก็อาจเปิดเผยรายละเอียดภายในมากกว่าที่คุณต้องการด้วย แนะนำให้ปิดไว้ในแชตกลุ่ม

## การตระหนักถึงค่าใช้จ่าย

Heartbeat รันรอบเอเจนต์เต็มรูปแบบ interval ที่สั้นกว่าจะเผาผลาญ token มากขึ้น เพื่อลดค่าใช้จ่าย:

- ใช้ `isolatedSession: true` เพื่อหลีกเลี่ยงการส่งประวัติการสนทนาเต็มรูปแบบ (~100K token เหลือ ~2-5K ต่อการรัน)
- ใช้ `lightContext: true` เพื่อจำกัดไฟล์ bootstrap ให้เหลือเพียง `HEARTBEAT.md`
- ตั้งค่า `model` ที่ถูกกว่า (เช่น `ollama/llama3.2:1b`)
- ทำให้ `HEARTBEAT.md` มีขนาดเล็ก
- ใช้ `target: "none"` หากคุณต้องการเฉพาะการอัปเดตสถานะภายใน

## บริบทล้นหลัง Heartbeat

หาก Heartbeat ก่อนหน้านี้ทำให้เซสชันเดิมค้างอยู่บนโมเดล local ที่เล็กกว่า เช่น โมเดล Ollama ที่มี window 32k แล้วรอบถัดไปของเซสชันหลักรายงานว่าบริบทล้น ให้ reset โมเดล runtime ของเซสชันกลับไปเป็นโมเดลหลักที่กำหนดค่าไว้ ข้อความ reset ของ OpenClaw จะระบุเรื่องนี้เมื่อโมเดล runtime ล่าสุดตรงกับ `heartbeat.model` ที่กำหนดค่าไว้

Heartbeat ปัจจุบันจะคงโมเดล runtime เดิมของเซสชันที่แชร์ไว้หลังจากการรันเสร็จสิ้น คุณยังสามารถใช้ `isolatedSession: true` เพื่อรัน Heartbeat ในเซสชันใหม่ รวมกับ `lightContext: true` เพื่อให้ prompt เล็กที่สุด หรือเลือกโมเดล Heartbeat ที่มี context window ใหญ่พอสำหรับเซสชันที่แชร์

## ที่เกี่ยวข้อง

- [Automation](/th/automation) — กลไก automation ทั้งหมดโดยสรุป
- [งานเบื้องหลัง](/th/automation/tasks) — วิธีติดตามงานที่แยกออกมา
- [เขตเวลา](/th/concepts/timezone) — เขตเวลามีผลต่อการจัดกำหนดการ Heartbeat อย่างไร
- [การแก้ไขปัญหา](/th/automation/cron-jobs#troubleshooting) — การ debug ปัญหา automation
