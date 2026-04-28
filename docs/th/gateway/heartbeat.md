---
read_when:
    - การปรับความถี่หรือการส่งข้อความของ Heartbeat
    - การเลือกระหว่าง Heartbeat และ Cron สำหรับงานที่ตั้งเวลาไว้
sidebarTitle: Heartbeat
summary: ข้อความ polling ของ Heartbeat และกฎการแจ้งเตือน
title: Heartbeat
x-i18n:
    generated_at: "2026-04-26T11:29:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0d3e9c531062d90e8e24cb7795fed20bc0985c3eadc8ed367295fc2544d14e
    source_path: gateway/heartbeat.md
    workflow: 15
---

<Note>
**Heartbeat เทียบกับ cron?** ดู [ระบบอัตโนมัติและงาน](/th/automation) สำหรับคำแนะนำว่าเมื่อใดควรใช้แต่ละแบบ
</Note>

Heartbeat จะรัน **เทิร์นของเอเจนต์แบบเป็นระยะ** ในเซสชันหลัก เพื่อให้โมเดลสามารถแจ้งสิ่งที่ต้องให้ความสนใจได้โดยไม่รบกวนคุณมากเกินไป

Heartbeat คือเทิร์นของเซสชันหลักที่ถูกตั้งเวลาไว้ — มัน **ไม่** สร้างระเบียน[งานเบื้องหลัง](/th/automation/tasks) ระเบียนงานมีไว้สำหรับงานที่แยกออกจากเซสชัน (การรัน ACP, subagents, งาน cron แบบแยกอิสระ)

การแก้ปัญหา: [งานที่ตั้งเวลาไว้](/th/automation/cron-jobs#troubleshooting)

## เริ่มต้นอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

<Steps>
  <Step title="เลือกความถี่">
    ปล่อยให้ Heartbeat เปิดใช้งานไว้ (ค่าเริ่มต้นคือ `30m` หรือ `1h` สำหรับ Anthropic OAuth/token auth รวมถึงการใช้ Claude CLI ซ้ำ) หรือกำหนดความถี่ของคุณเอง
  </Step>
  <Step title="เพิ่ม HEARTBEAT.md (ไม่บังคับ)">
    สร้างเช็กลิสต์เล็ก ๆ ใน `HEARTBEAT.md` หรือบล็อก `tasks:` ใน workspace ของเอเจนต์
  </Step>
  <Step title="ตัดสินใจว่าจะส่งข้อความ Heartbeat ไปที่ใด">
    `target: "none"` เป็นค่าเริ่มต้น; ตั้ง `target: "last"` เพื่อส่งไปยังผู้ติดต่อรายล่าสุด
  </Step>
  <Step title="การปรับแต่งเพิ่มเติม (ไม่บังคับ)">
    - เปิดใช้การส่ง reasoning ของ Heartbeat เพื่อความโปร่งใส
    - ใช้ bootstrap context แบบน้ำหนักเบา หากการรัน Heartbeat ต้องการเพียง `HEARTBEAT.md`
    - เปิดใช้ isolated sessions เพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมดในทุก Heartbeat
    - จำกัด Heartbeats ให้อยู่ในช่วงเวลาที่ใช้งานจริง (เวลาท้องถิ่น)

  </Step>
</Steps>

ตัวอย่าง config:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // ส่งไปยังผู้ติดต่อรายล่าสุดแบบ explicit (ค่าเริ่มต้นคือ "none")
        directPolicy: "allow", // ค่าเริ่มต้น: อนุญาตเป้าหมายแบบ direct/DM; ตั้ง "block" เพื่อระงับ
        lightContext: true, // ไม่บังคับ: inject เฉพาะ HEARTBEAT.md จาก bootstrap files
        isolatedSession: true, // ไม่บังคับ: เซสชันใหม่ในแต่ละรอบ (ไม่มีประวัติการสนทนา)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // ไม่บังคับ: ส่งข้อความ `Reasoning:` แยกต่างหากด้วย
      },
    },
  },
}
```

## ค่าเริ่มต้น

- ช่วงเวลา: `30m` (หรือ `1h` เมื่อโหมด auth ที่ตรวจพบคือ Anthropic OAuth/token auth รวมถึงการใช้ Claude CLI ซ้ำ) ตั้งค่า `agents.defaults.heartbeat.every` หรือ `agents.list[].heartbeat.every` แยกต่อเอเจนต์; ใช้ `0m` เพื่อปิดใช้งาน
- เนื้อหา prompt (กำหนดค่าได้ผ่าน `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- prompt ของ Heartbeat จะถูกส่ง **ตามข้อความตรงตัว** เป็น user message system prompt จะมีส่วน "Heartbeat" ก็ต่อเมื่อเปิดใช้ Heartbeats สำหรับเอเจนต์ค่าเริ่มต้น และการรันถูกทำเครื่องหมายภายใน
- เมื่อปิดใช้งาน Heartbeats ด้วย `0m` การรันปกติก็จะละ `HEARTBEAT.md` ออกจาก bootstrap context เช่นกัน เพื่อไม่ให้โมเดลเห็นคำสั่งที่มีไว้เฉพาะ Heartbeat
- Active hours (`heartbeat.activeHours`) จะถูกตรวจสอบใน timezone ที่ตั้งค่าไว้ นอกช่วงเวลานั้น Heartbeats จะถูกข้ามจนกว่าจะถึง tick ถัดไปที่อยู่ภายในช่วง

## prompt ของ Heartbeat มีไว้ทำอะไร

prompt ค่าเริ่มต้นถูกออกแบบให้กว้างโดยตั้งใจ:

- **งานเบื้องหลัง**: "Consider outstanding tasks" เป็นการกระตุ้นให้เอเจนต์ทบทวนงานติดค้าง (กล่องข้อความเข้า, ปฏิทิน, การเตือน, งานที่เข้าคิวไว้) และแจ้งสิ่งเร่งด่วน
- **การเช็กอินกับมนุษย์**: "Checkup sometimes on your human during day time" เป็นการกระตุ้นให้มีข้อความเบา ๆ เป็นครั้งคราวว่า "มีอะไรให้ช่วยไหม?" แต่หลีกเลี่ยงการรบกวนตอนกลางคืนโดยใช้ timezone ท้องถิ่นที่ตั้งค่าไว้ของคุณ (ดู [Timezone](/th/concepts/timezone))

Heartbeat สามารถตอบสนองต่อ[งานเบื้องหลัง](/th/automation/tasks)ที่เสร็จสมบูรณ์แล้วได้ แต่การรัน Heartbeat เองจะไม่สร้างระเบียนงาน

หากคุณต้องการให้ Heartbeat ทำสิ่งที่เฉพาะเจาะจงมาก (เช่น "ตรวจสอบสถิติ Gmail PubSub" หรือ "ตรวจสอบ health ของ gateway") ให้ตั้งค่า `agents.defaults.heartbeat.prompt` (หรือ `agents.list[].heartbeat.prompt`) เป็นเนื้อหาแบบกำหนดเอง (ส่งตามข้อความตรงตัว)

## ข้อตกลงของการตอบกลับ

- หากไม่มีสิ่งใดต้องให้ความสนใจ ให้ตอบด้วย **`HEARTBEAT_OK`**
- ระหว่างการรัน Heartbeat OpenClaw จะถือว่า `HEARTBEAT_OK` เป็น ack เมื่อมันปรากฏที่ **ต้นหรือท้าย** ของคำตอบ token นี้จะถูกตัดออก และคำตอบจะถูกทิ้งหากเนื้อหาที่เหลือมีความยาว **≤ `ackMaxChars`** (ค่าเริ่มต้น: 300)
- หาก `HEARTBEAT_OK` ปรากฏอยู่ **ตรงกลาง** ของคำตอบ มันจะไม่ถูกปฏิบัติเป็นพิเศษ
- สำหรับการแจ้งเตือน **อย่า** ใส่ `HEARTBEAT_OK`; ให้ส่งเฉพาะข้อความแจ้งเตือนเท่านั้น

นอกการรัน Heartbeat, `HEARTBEAT_OK` ที่หลงมาอยู่ต้น/ท้ายของข้อความจะถูกตัดออกและบันทึกลง log; ข้อความที่มีเพียง `HEARTBEAT_OK` อย่างเดียวจะถูกทิ้ง

## Config

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // ค่าเริ่มต้น: 30m (0m คือปิดใช้งาน)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // ค่าเริ่มต้น: false (ส่งข้อความ Reasoning: แยกต่างหากเมื่อมี)
        lightContext: false, // ค่าเริ่มต้น: false; true จะเก็บเฉพาะ HEARTBEAT.md จาก workspace bootstrap files
        isolatedSession: false, // ค่าเริ่มต้น: false; true จะรันแต่ละ heartbeat ในเซสชันใหม่ (ไม่มีประวัติการสนทนา)
        target: "last", // ค่าเริ่มต้น: none | ตัวเลือก: last | none | <channel id> (core หรือ Plugin เช่น "bluebubbles")
        to: "+15551234567", // ไม่บังคับ: override เฉพาะช่องทาง
        accountId: "ops-bot", // ไม่บังคับ: channel id สำหรับหลายบัญชี
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // จำนวนอักขระสูงสุดที่อนุญาตหลัง HEARTBEAT_OK
      },
    },
  },
}
```

### ขอบเขตและลำดับความสำคัญ

- `agents.defaults.heartbeat` กำหนดพฤติกรรม Heartbeat แบบ global
- `agents.list[].heartbeat` จะ merge ทับด้านบน; หากเอเจนต์ใดมีบล็อก `heartbeat` **จะรัน Heartbeats เฉพาะเอเจนต์เหล่านั้นเท่านั้น**
- `channels.defaults.heartbeat` กำหนดค่าเริ่มต้นของการมองเห็นสำหรับทุกช่องทาง
- `channels.<channel>.heartbeat` override ค่าเริ่มต้นของช่องทาง
- `channels.<channel>.accounts.<id>.heartbeat` (ช่องทางหลายบัญชี) override แยกตามช่องทาง

### Heartbeats แยกต่อเอเจนต์

หากมี entry ใดใน `agents.list[]` ที่มีบล็อก `heartbeat` **จะรัน Heartbeats เฉพาะเอเจนต์เหล่านั้นเท่านั้น** บล็อกแยกต่อเอเจนต์จะ merge ทับ `agents.defaults.heartbeat` (ดังนั้นคุณจึงตั้งค่า default ร่วมกันครั้งเดียวแล้ว override แยกต่อเอเจนต์ได้)

ตัวอย่าง: มีเอเจนต์สองตัว แต่มีเพียงเอเจนต์ตัวที่สองที่รัน Heartbeats

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // ส่งไปยังผู้ติดต่อรายล่าสุดแบบ explicit (ค่าเริ่มต้นคือ "none")
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

### ตัวอย่าง active hours

จำกัด Heartbeats ให้อยู่ในเวลาทำการใน timezone ที่เฉพาะเจาะจง:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // ส่งไปยังผู้ติดต่อรายล่าสุดแบบ explicit (ค่าเริ่มต้นคือ "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // ไม่บังคับ; ใช้ userTimezone ของคุณหากตั้งไว้ มิฉะนั้นใช้ host tz
        },
      },
    },
  },
}
```

นอกช่วงเวลานี้ (ก่อน 9 โมงเช้าหรือหลัง 4 ทุ่มตามเวลา Eastern) Heartbeats จะถูกข้าม tick ที่ตั้งเวลาไว้ถัดไปภายในช่วงจะรันตามปกติ

### การตั้งค่าแบบ 24/7

หากคุณต้องการให้ Heartbeats ทำงานตลอดทั้งวัน ให้ใช้หนึ่งในรูปแบบเหล่านี้:

- ละ `activeHours` ออกไปเลย (ไม่มีข้อจำกัดด้านช่วงเวลา; นี่คือพฤติกรรมค่าเริ่มต้น)
- ตั้งช่วงเวลาเต็มวัน: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
อย่าตั้ง `start` และ `end` เป็นเวลาเดียวกัน (เช่น `08:00` ถึง `08:00`) เพราะจะถูกมองว่าเป็นช่วงเวลาที่กว้างเป็นศูนย์ ทำให้ Heartbeats ถูกข้ามเสมอ
</Warning>

### ตัวอย่างหลายบัญชี

ใช้ `accountId` เพื่อกำหนดเป้าหมายไปยังบัญชีเฉพาะบนช่องทางหลายบัญชีอย่าง Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // ไม่บังคับ: route ไปยัง topic/thread ที่เฉพาะเจาะจง
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
  ช่วงเวลา Heartbeat (สตริงระยะเวลา; หน่วยค่าเริ่มต้น = นาที)
</ParamField>
<ParamField path="model" type="string">
  การ override โมเดลแบบไม่บังคับสำหรับการรัน Heartbeat (`provider/model`)
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  เมื่อเปิดใช้งาน จะส่งข้อความ `Reasoning:` แยกต่างหากด้วยเมื่อมี (รูปแบบเดียวกับ `/reasoning on`)
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  เมื่อเป็น true การรัน Heartbeat จะใช้ bootstrap context แบบน้ำหนักเบา และเก็บไว้เฉพาะ `HEARTBEAT.md` จาก workspace bootstrap files
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  เมื่อเป็น true แต่ละ Heartbeat จะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า ใช้รูปแบบการแยกเดียวกับ cron `sessionTarget: "isolated"` ลดต้นทุน token ต่อ Heartbeat อย่างมาก ใช้ร่วมกับ `lightContext: true` เพื่อประหยัดสูงสุด ส่วน delivery routing ยังคงใช้บริบทของเซสชันหลัก
</ParamField>
<ParamField path="session" type="string">
  session key แบบไม่บังคับสำหรับการรัน Heartbeat

  - `main` (ค่าเริ่มต้น): เซสชันหลักของเอเจนต์
  - session key แบบ explicit (คัดลอกจาก `openclaw sessions --json` หรือ [sessions CLI](/th/cli/sessions))
  - รูปแบบ session key: ดู [Sessions](/th/concepts/session) และ [Groups](/th/channels/groups)

</ParamField>
<ParamField path="target" type="string">
  - `last`: ส่งไปยังช่องทางภายนอกที่ใช้งานล่าสุด
  - explicit channel: ช่องทางหรือ Plugin id ใดก็ได้ที่ตั้งค่าไว้ เช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`
  - `none` (ค่าเริ่มต้น): รัน Heartbeat แต่ **ไม่ส่ง** ออกภายนอก

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  ควบคุมพฤติกรรมการส่งแบบ direct/DM `allow`: อนุญาตการส่ง Heartbeat แบบ direct/DM `block`: ระงับการส่งแบบ direct/DM (`reason=dm-blocked`)
</ParamField>
<ParamField path="to" type="string">
  การ override ผู้รับแบบไม่บังคับ (id เฉพาะช่องทาง เช่น E.164 สำหรับ WhatsApp หรือ Telegram chat id) สำหรับ Telegram topics/threads ให้ใช้ `<chatId>:topic:<messageThreadId>`
</ParamField>
<ParamField path="accountId" type="string">
  account id แบบไม่บังคับสำหรับช่องทางหลายบัญชี เมื่อ `target: "last"` account id จะใช้กับช่องทางล่าสุดที่ resolve แล้วหากรองรับ accounts; มิฉะนั้นจะถูกละเลย หาก account id ไม่ตรงกับบัญชีที่ตั้งค่าไว้สำหรับช่องทางที่ resolve แล้ว การส่งจะถูกข้าม
</ParamField>
<ParamField path="prompt" type="string">
  override เนื้อหา prompt ค่าเริ่มต้น (ไม่ merge)
</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  จำนวนอักขระสูงสุดที่อนุญาตหลัง `HEARTBEAT_OK` ก่อนส่ง
</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  เมื่อเป็น true จะระงับ payload คำเตือนข้อผิดพลาดของ tool ระหว่างการรัน Heartbeat
</ParamField>
<ParamField path="activeHours" type="object">
  จำกัดการรัน Heartbeat ให้อยู่ในช่วงเวลาหนึ่ง ออบเจ็กต์ที่มี `start` (HH:MM, รวมจุดเริ่มต้น; ใช้ `00:00` สำหรับต้นวัน), `end` (HH:MM แบบไม่รวมจุดสิ้นสุด; อนุญาต `24:00` สำหรับสิ้นวัน) และ `timezone` แบบไม่บังคับ

  - หากละไว้หรือเป็น `"user"`: จะใช้ `agents.defaults.userTimezone` ของคุณหากตั้งไว้ มิฉะนั้นจะ fallback ไปใช้ timezone ของระบบโฮสต์
  - `"local"`: ใช้ timezone ของระบบโฮสต์เสมอ
  - ตัวระบุ IANA ใด ๆ (เช่น `America/New_York`): ใช้โดยตรง; หากไม่ถูกต้อง จะ fallback ไปใช้พฤติกรรมแบบ `"user"` ข้างต้น
  - `start` และ `end` ต้องไม่เท่ากันสำหรับ active window; หากค่าเท่ากันจะถือว่าเป็นหน้าต่างกว้างศูนย์ (อยู่นอกช่วงเสมอ)
  - นอก active window, Heartbeats จะถูกข้ามจนกว่าจะถึง tick ถัดไปที่อยู่ภายในช่วง

</ParamField>

## พฤติกรรมการส่ง

<AccordionGroup>
  <Accordion title="การกำหนดเส้นทางเซสชันและเป้าหมาย">
    - Heartbeats จะรันในเซสชันหลักของเอเจนต์โดยค่าเริ่มต้น (`agent:<id>:<mainKey>`) หรือ `global` เมื่อ `session.scope = "global"` ตั้ง `session` เพื่อ override ไปยังเซสชันของช่องทางเฉพาะ (Discord/WhatsApp/ฯลฯ)
    - `session` มีผลเฉพาะกับบริบทของการรัน; การส่งถูกควบคุมโดย `target` และ `to`
    - หากต้องการส่งไปยังช่องทาง/ผู้รับที่เฉพาะเจาะจง ให้ตั้ง `target` + `to` เมื่อใช้ `target: "last"` การส่งจะใช้ช่องทางภายนอกล่าสุดสำหรับเซสชันนั้น
    - โดยค่าเริ่มต้น การส่ง Heartbeat อนุญาตเป้าหมายแบบ direct/DM ตั้ง `directPolicy: "block"` เพื่อระงับการส่งไปยังเป้าหมายแบบ direct ขณะยังคงรันเทิร์น Heartbeat
    - หากคิวหลักกำลังยุ่ง Heartbeat จะถูกข้ามและลองใหม่ภายหลัง
    - หาก `target` resolve แล้วไม่พบปลายทางภายนอก การรันจะยังเกิดขึ้น แต่จะไม่มีการส่งข้อความขาออก

  </Accordion>
  <Accordion title="พฤติกรรมการมองเห็นและการข้าม">
    - หากปิด `showOk`, `showAlerts` และ `useIndicator` ทั้งหมด การรันจะถูกข้ามตั้งแต่ต้นเป็น `reason=alerts-disabled`
    - หากปิดเฉพาะการส่งการแจ้งเตือน OpenClaw ยังคงรัน Heartbeat, อัปเดต timestamps ของ due-task, กู้คืน session idle timestamp และระงับ payload การแจ้งเตือนขาออกได้
    - หากเป้าหมาย Heartbeat ที่ resolve แล้วรองรับ typing, OpenClaw จะแสดง typing ระหว่างที่การรัน Heartbeat กำลังทำงาน โดยจะใช้เป้าหมายเดียวกับที่ Heartbeat จะส่งผลลัพธ์แชตไป และสามารถปิดได้ด้วย `typingMode: "never"`

  </Accordion>
  <Accordion title="วงจรชีวิตเซสชันและ audit">
    - คำตอบที่เป็น Heartbeat เท่านั้นจะ **ไม่** ทำให้เซสชันยังคง active metadata ของ Heartbeat อาจอัปเดตแถวของเซสชันได้ แต่ idle expiry ใช้ `lastInteractionAt` จากข้อความผู้ใช้/ช่องทางจริงล่าสุด และ daily expiry ใช้ `sessionStartedAt`
    - ประวัติของ Control UI และ WebChat จะซ่อน prompt ของ Heartbeat และ acknowledgments ที่เป็น OK-only อย่างไรก็ตาม transcript ของเซสชันเบื้องล่างยังอาจมีเทิร์นเหล่านั้นเพื่อใช้สำหรับ audit/replay
    - [งานเบื้องหลัง](/th/automation/tasks)แบบแยกอิสระสามารถเข้าคิว system event และปลุก Heartbeat เมื่อเซสชันหลักควรรับรู้บางอย่างอย่างรวดเร็ว การปลุกนั้นไม่ได้ทำให้การรัน Heartbeat กลายเป็นงานเบื้องหลัง

  </Accordion>
</AccordionGroup>

## ตัวควบคุมการมองเห็น

โดยค่าเริ่มต้น acknowledgments แบบ `HEARTBEAT_OK` จะถูกระงับ ขณะที่เนื้อหาการแจ้งเตือนจะถูกส่ง คุณสามารถปรับสิ่งนี้แยกตามช่องทางหรือแยกตามบัญชีได้:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # ซ่อน HEARTBEAT_OK (ค่าเริ่มต้น)
      showAlerts: true # แสดงข้อความแจ้งเตือน (ค่าเริ่มต้น)
      useIndicator: true # ส่งเหตุการณ์ตัวบ่งชี้ (ค่าเริ่มต้น)
  telegram:
    heartbeat:
      showOk: true # แสดง acknowledgments แบบ OK บน Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # ระงับการส่งการแจ้งเตือนสำหรับบัญชีนี้
```

ลำดับความสำคัญ: ต่อบัญชี → ต่อช่องทาง → ค่าเริ่มต้นของช่องทาง → ค่าเริ่มต้นที่ฝังมาในระบบ

### แต่ละ flag ทำอะไร

- `showOk`: ส่ง acknowledgment แบบ `HEARTBEAT_OK` เมื่อโมเดลส่งคำตอบที่เป็น OK-only
- `showAlerts`: ส่งเนื้อหาการแจ้งเตือนเมื่อโมเดลส่งคำตอบที่ไม่ใช่ OK
- `useIndicator`: ส่งเหตุการณ์ตัวบ่งชี้สำหรับพื้นผิวสถานะของ UI

หาก **ทั้งสามค่า** เป็น false OpenClaw จะข้ามการรัน Heartbeat ทั้งหมด (ไม่มีการเรียกโมเดล)

### ตัวอย่างแยกตามช่องทางเทียบกับแยกตามบัญชี

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # ทุกบัญชี Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # ระงับการแจ้งเตือนเฉพาะบัญชี ops
  telegram:
    heartbeat:
      showOk: true
```

### รูปแบบที่พบบ่อย

| เป้าหมาย                                 | Config                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| พฤติกรรมค่าเริ่มต้น (OK เงียบ, แจ้งเตือนเปิด) | _(ไม่ต้องมี config)_                                                                     |
| เงียบทั้งหมด (ไม่มีข้อความ, ไม่มีตัวบ่งชี้) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| เฉพาะตัวบ่งชี้ (ไม่มีข้อความ)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| แสดง OK เฉพาะในช่องทางเดียว              | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (ไม่บังคับ)

หากมีไฟล์ `HEARTBEAT.md` อยู่ใน workspace, prompt ค่าเริ่มต้นจะบอกให้เอเจนต์อ่านมัน ให้คิดว่ามันคือ "เช็กลิสต์ Heartbeat" ของคุณ: เล็ก คงที่ และปลอดภัยที่จะรวมทุก 30 นาที

ในการรันปกติ `HEARTBEAT.md` จะถูก inject ก็ต่อเมื่อเปิดใช้คำแนะนำ Heartbeat สำหรับเอเจนต์ค่าเริ่มต้น การปิดความถี่ Heartbeat ด้วย `0m` หรือตั้ง `includeSystemPromptSection: false` จะละมันออกจาก bootstrap context ปกติ

หากมี `HEARTBEAT.md` อยู่แต่แทบไม่มีเนื้อหา (มีเพียงบรรทัดว่างและหัวข้อ markdown เช่น `# Heading`) OpenClaw จะข้ามการรัน Heartbeat เพื่อประหยัดการเรียก API การข้ามนี้จะถูกรายงานเป็น `reason=empty-heartbeat-file` หากไม่มีไฟล์อยู่ Heartbeat จะยังคงรัน และโมเดลจะเป็นผู้ตัดสินใจว่าจะทำอะไร

ควรทำให้เล็ก (เช็กลิสต์สั้น ๆ หรือการเตือนความจำ) เพื่อหลีกเลี่ยง prompt bloat

ตัวอย่าง `HEARTBEAT.md`:

```md
# เช็กลิสต์ Heartbeat

- สแกนเร็ว ๆ: มีอะไรด่วนในกล่องข้อความเข้าหรือไม่?
- หากเป็นเวลากลางวัน ให้เช็กอินแบบเบา ๆ หากไม่มีอย่างอื่นค้างอยู่
- หากงานติดขัด ให้เขียนว่า _ขาดอะไรอยู่_ และถาม Peter ครั้งถัดไป
```

### บล็อก `tasks:`

`HEARTBEAT.md` ยังรองรับบล็อก `tasks:` แบบมีโครงสร้างขนาดเล็ก สำหรับการตรวจสอบตามช่วงเวลาภายใน Heartbeat เอง

ตัวอย่าง:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "ตรวจอีเมลที่ยังไม่ได้อ่านและเร่งด่วน พร้อมทำเครื่องหมายสิ่งที่ไวต่อเวลา"
- name: calendar-scan
  interval: 2h
  prompt: "ตรวจดูการประชุมที่กำลังจะมาถึงซึ่งต้องเตรียมหรือติดตามต่อ"

# คำแนะนำเพิ่มเติม

- ให้การแจ้งเตือนสั้น
- หากไม่มีสิ่งใดต้องให้ความสนใจหลังจากงานที่ครบกำหนดทั้งหมดแล้ว ให้ตอบ HEARTBEAT_OK
```

<AccordionGroup>
  <Accordion title="พฤติกรรม">
    - OpenClaw จะ parse บล็อก `tasks:` และตรวจสอบแต่ละงานเทียบกับ `interval` ของงานนั้นเอง
    - จะรวมเฉพาะงานที่ **ถึงกำหนด** เข้าใน prompt ของ Heartbeat สำหรับ tick นั้น
    - หากไม่มีงานใดถึงกำหนด Heartbeat จะถูกข้ามทั้งหมด (`reason=no-tasks-due`) เพื่อหลีกเลี่ยงการเรียกโมเดลโดยเปล่าประโยชน์
    - เนื้อหาที่ไม่ใช่งานใน `HEARTBEAT.md` จะถูกเก็บไว้และผนวกเป็นบริบทเพิ่มเติมหลังรายการงานที่ถึงกำหนด
    - timestamps ของการรันงานครั้งล่าสุดจะถูกเก็บในสถานะเซสชัน (`heartbeatTaskState`) ดังนั้น intervals จะยังอยู่ต่อแม้รีสตาร์ตตามปกติ
    - timestamps ของงานจะถูกเลื่อนต่อเมื่อการรัน Heartbeat ผ่านเส้นทางคำตอบปกติครบถ้วนแล้วเท่านั้น การรันที่ถูกข้ามแบบ `empty-heartbeat-file` / `no-tasks-due` จะไม่ทำเครื่องหมายว่างานเสร็จ

  </Accordion>
</AccordionGroup>

โหมดงานนี้มีประโยชน์เมื่อคุณต้องการให้ไฟล์ Heartbeat ไฟล์เดียวเก็บการตรวจสอบเป็นระยะหลายอย่าง โดยไม่ต้องเสียค่าใช้จ่ายสำหรับทุกงานในทุก tick

### เอเจนต์สามารถอัปเดต HEARTBEAT.md ได้หรือไม่?

ได้ — หากคุณสั่งมัน

`HEARTBEAT.md` เป็นเพียงไฟล์ปกติใน workspace ของเอเจนต์ ดังนั้นคุณสามารถบอกเอเจนต์ (ในแชตปกติ) เช่น:

- "อัปเดต `HEARTBEAT.md` เพื่อเพิ่มการตรวจปฏิทินรายวัน"
- "เขียน `HEARTBEAT.md` ใหม่ให้สั้นลงและเน้นการติดตามกล่องข้อความเข้า"

หากคุณต้องการให้สิ่งนี้เกิดขึ้นเชิงรุก คุณสามารถเพิ่มบรรทัดแบบ explicit ใน prompt ของ Heartbeat ได้เช่นกัน เช่น: "หากเช็กลิสต์เริ่มล้าสมัย ให้อัปเดต HEARTBEAT.md เป็นเวอร์ชันที่ดีกว่า"

<Warning>
อย่าใส่ secrets (API keys, หมายเลขโทรศัพท์, private tokens) ลงใน `HEARTBEAT.md` — เพราะมันจะกลายเป็นส่วนหนึ่งของบริบท prompt
</Warning>

## ปลุกแบบ manual (ตามต้องการ)

คุณสามารถเข้าคิว system event และทริกเกอร์ Heartbeat ทันทีได้ด้วย:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

หากมีหลายเอเจนต์ที่ตั้งค่า `heartbeat` ไว้ การปลุกแบบ manual จะรัน Heartbeat ของเอเจนต์แต่ละตัวทันที

ใช้ `--mode next-heartbeat` เพื่อรอ tick ที่ตั้งเวลาไว้ถัดไป

## การส่ง reasoning (ไม่บังคับ)

โดยค่าเริ่มต้น Heartbeats จะส่งเฉพาะ payload "คำตอบ" สุดท้าย

หากคุณต้องการความโปร่งใส ให้เปิดใช้:

- `agents.defaults.heartbeat.includeReasoning: true`

เมื่อเปิดใช้งาน Heartbeats จะส่งข้อความแยกที่ขึ้นต้นด้วย `Reasoning:` ด้วย (รูปแบบเดียวกับ `/reasoning on`) สิ่งนี้มีประโยชน์เมื่อเอเจนต์กำลังจัดการหลายเซสชัน/codexes และคุณต้องการเห็นว่าทำไมมันจึงตัดสินใจส่งข้อความหาคุณ — แต่ก็อาจเปิดเผยรายละเอียดภายในมากกว่าที่คุณต้องการได้เช่นกัน ควรปิดไว้ในแชตกลุ่ม

## การตระหนักถึงค่าใช้จ่าย

Heartbeats จะรันเทิร์นของเอเจนต์เต็มรูปแบบ ช่วงเวลาที่สั้นลงจะใช้ token มากขึ้น หากต้องการลดค่าใช้จ่าย:

- ใช้ `isolatedSession: true` เพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมด (~100K tokens ลดลงเหลือ ~2-5K ต่อการรัน)
- ใช้ `lightContext: true` เพื่อจำกัด bootstrap files ให้เหลือเพียง `HEARTBEAT.md`
- ตั้ง `model` ที่ถูกกว่า (เช่น `ollama/llama3.2:1b`)
- ทำ `HEARTBEAT.md` ให้เล็ก
- ใช้ `target: "none"` หากคุณต้องการเพียงการอัปเดตสถานะภายใน

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติและงาน](/th/automation) — ภาพรวมของกลไกระบบอัตโนมัติทั้งหมด
- [งานเบื้องหลัง](/th/automation/tasks) — วิธีติดตามงานที่แยกออกจากเซสชัน
- [Timezone](/th/concepts/timezone) — วิธีที่ timezone มีผลต่อการตั้งเวลา Heartbeat
- [การแก้ปัญหา](/th/automation/cron-jobs#troubleshooting) — การดีบักปัญหาระบบอัตโนมัติ
