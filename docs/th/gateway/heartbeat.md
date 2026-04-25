---
read_when:
    - การปรับรอบเวลา Heartbeat หรือการส่งข้อความ
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานตามกำหนดเวลา
summary: ข้อความการโพลของ Heartbeat และกฎการแจ้งเตือน
title: Heartbeat
x-i18n:
    generated_at: "2026-04-25T13:48:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17353a03bbae7ad564548e767099f8596764e2cf9bc3d457ec9fc3482ba7d71c
    source_path: gateway/heartbeat.md
    workflow: 15
---

> **Heartbeat หรือ Cron?** ดู [Automation & Tasks](/th/automation) สำหรับคำแนะนำว่าเมื่อใดควรใช้แต่ละแบบ

Heartbeat จะรัน **เทิร์นของเอเจนต์แบบเป็นระยะ** ในเซสชันหลัก เพื่อให้โมเดล
สามารถแจ้งสิ่งที่ต้องใส่ใจได้โดยไม่รบกวนคุณมากเกินไป

Heartbeat คือเทิร์นของเซสชันหลักที่ถูกจัดเวลาไว้ — มัน **จะไม่** สร้างระเบียน[งานเบื้องหลัง](/th/automation/tasks)
ระเบียนงานมีไว้สำหรับงานที่แยกออกไป (การรัน ACP, subagents, งาน cron แบบ isolated)

การแก้ไขปัญหา: [งานตามกำหนดเวลา](/th/automation/cron-jobs#troubleshooting)

## เริ่มต้นอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. เปิดใช้ heartbeat ไว้ต่อไป (ค่าเริ่มต้นคือ `30m` หรือ `1h` สำหรับการยืนยันตัวตนแบบ Anthropic OAuth/token รวมถึงการใช้ Claude CLI ซ้ำ) หรือตั้งรอบเวลาของคุณเอง
2. สร้างรายการตรวจสอบ `HEARTBEAT.md` แบบสั้น ๆ หรือบล็อก `tasks:` ใน workspace ของเอเจนต์ (ไม่บังคับแต่แนะนำ)
3. ตัดสินใจว่าจะให้ข้อความ heartbeat ไปที่ใด (`target: "none"` เป็นค่าเริ่มต้น; ตั้ง `target: "last"` เพื่อกำหนดเส้นทางไปยังผู้ติดต่อคนล่าสุด)
4. ไม่บังคับ: เปิดใช้การส่ง reasoning ของ heartbeat เพื่อความโปร่งใส
5. ไม่บังคับ: ใช้บริบท bootstrap แบบเบา หากการรัน heartbeat ต้องใช้เพียง `HEARTBEAT.md`
6. ไม่บังคับ: เปิดใช้เซสชันแบบ isolated เพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมดในแต่ละ heartbeat
7. ไม่บังคับ: จำกัด heartbeat ให้อยู่ในช่วงเวลาที่ใช้งาน (เวลาท้องถิ่น)

ตัวอย่างคอนฟิก:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // ส่งไปยังผู้ติดต่อคนล่าสุดอย่างชัดเจน (ค่าเริ่มต้นคือ "none")
        directPolicy: "allow", // ค่าเริ่มต้น: allow ปลายทาง direct/DM; ตั้ง "block" เพื่อระงับ
        lightContext: true, // ไม่บังคับ: inject เฉพาะ HEARTBEAT.md จากไฟล์ bootstrap
        isolatedSession: true, // ไม่บังคับ: เซสชันใหม่ทุกครั้งที่รัน (ไม่มีประวัติการสนทนา)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // ไม่บังคับ: ส่งข้อความ `Reasoning:` แยกด้วย
      },
    },
  },
}
```

## ค่าเริ่มต้น

- ช่วงเวลา: `30m` (หรือ `1h` เมื่อโหมดการยืนยันตัวตนที่ตรวจพบคือ Anthropic OAuth/token รวมถึงการใช้ Claude CLI ซ้ำ) ตั้งค่า `agents.defaults.heartbeat.every` หรือ `agents.list[].heartbeat.every` ต่อเอเจนต์; ใช้ `0m` เพื่อปิดใช้งาน
- เนื้อหาพรอมป์ (กำหนดค่าได้ผ่าน `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- พรอมป์ heartbeat จะถูกส่ง **ตามตัวอักษรทุกประการ** เป็นข้อความผู้ใช้ system
  prompt จะมีส่วน “Heartbeat” ก็ต่อเมื่อเปิดใช้ heartbeat สำหรับ
  เอเจนต์ค่าเริ่มต้น และการรันถูกทำเครื่องหมายภายในไว้
- เมื่อปิดใช้งาน heartbeat ด้วย `0m` การรันปกติจะละ `HEARTBEAT.md`
  ออกจากบริบท bootstrap ด้วย เพื่อไม่ให้โมเดลเห็นคำสั่งที่ใช้เฉพาะ heartbeat
- `activeHours` (`heartbeat.activeHours`) จะถูกตรวจสอบในเขตเวลาที่กำหนดค่าไว้
  นอกช่วงเวลาดังกล่าว heartbeat จะถูกข้ามไปจนกว่าจะถึง tick ถัดไปที่อยู่ภายในช่วงเวลา

## พรอมป์ heartbeat ใช้เพื่ออะไร

พรอมป์ค่าเริ่มต้นตั้งใจให้ครอบคลุมกว้าง:

- **งานเบื้องหลัง**: “Consider outstanding tasks” ชี้นำให้เอเจนต์ตรวจสอบ
  งานติดค้าง (กล่องจดหมาย ปฏิทิน การเตือน งานที่เข้าคิวไว้) และแจ้งสิ่งเร่งด่วน
- **การเช็กอินกับมนุษย์**: “Checkup sometimes on your human during day time” ชี้นำให้มี
  ข้อความเบา ๆ เป็นครั้งคราว เช่น “มีอะไรให้ช่วยไหม?” แต่หลีกเลี่ยงการรบกวนตอนกลางคืน
  โดยใช้เขตเวลาท้องถิ่นที่กำหนดไว้ของคุณ (ดู [/concepts/timezone](/th/concepts/timezone))

Heartbeat สามารถตอบสนองต่อ[งานเบื้องหลัง](/th/automation/tasks)ที่เสร็จแล้วได้ แต่การรัน heartbeat เองจะไม่สร้างระเบียนงาน

หากคุณต้องการให้ heartbeat ทำสิ่งใดอย่างเฉพาะเจาะจงมาก (เช่น “ตรวจสอบสถิติ Gmail PubSub”
หรือ “ตรวจสอบสุขภาพของ gateway”) ให้ตั้ง `agents.defaults.heartbeat.prompt` (หรือ
`agents.list[].heartbeat.prompt`) เป็นเนื้อหาแบบกำหนดเอง (ส่งตามตัวอักษรทุกประการ)

## ข้อตกลงของการตอบกลับ

- หากไม่มีอะไรต้องใส่ใจ ให้ตอบด้วย **`HEARTBEAT_OK`**
- ระหว่างการรัน heartbeat OpenClaw จะถือว่า `HEARTBEAT_OK` เป็นการตอบรับเมื่อมันปรากฏ
  ที่ **ต้นหรือท้าย** ของคำตอบ token นี้จะถูกตัดออก และคำตอบจะถูก
  ทิ้งหากเนื้อหาที่เหลือมีความยาว **≤ `ackMaxChars`** (ค่าเริ่มต้น: 300)
- หาก `HEARTBEAT_OK` ปรากฏอยู่ **กลาง** คำตอบ มันจะไม่ถูกปฏิบัติเป็นกรณีพิเศษ
- สำหรับการแจ้งเตือน **อย่า** ใส่ `HEARTBEAT_OK`; ให้ส่งคืนเฉพาะข้อความแจ้งเตือน

นอกการรัน heartbeat หากมี `HEARTBEAT_OK` หลุดมาอยู่ต้น/ท้ายของข้อความ ระบบจะตัดออก
และบันทึกล็อก; ข้อความที่มีเพียง `HEARTBEAT_OK` อย่างเดียวจะถูกทิ้ง

## คอนฟิก

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // ค่าเริ่มต้น: 30m (0m คือปิดใช้งาน)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // ค่าเริ่มต้น: false (ส่งข้อความ Reasoning: แยกเมื่อมี)
        lightContext: false, // ค่าเริ่มต้น: false; true จะเก็บเฉพาะ HEARTBEAT.md จากไฟล์ bootstrap ของ workspace
        isolatedSession: false, // ค่าเริ่มต้น: false; true จะรัน heartbeat แต่ละครั้งในเซสชันใหม่ (ไม่มีประวัติการสนทนา)
        target: "last", // ค่าเริ่มต้น: none | ตัวเลือก: last | none | <channel id> (core หรือ Plugin เช่น "bluebubbles")
        to: "+15551234567", // override ปลายทางเฉพาะช่องทางแบบไม่บังคับ
        accountId: "ops-bot", // id บัญชีของช่องทางแบบหลายบัญชีแบบไม่บังคับ
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // จำนวนอักขระสูงสุดที่อนุญาตหลัง HEARTBEAT_OK
      },
    },
  },
}
```

### ขอบเขตและลำดับความสำคัญ

- `agents.defaults.heartbeat` กำหนดพฤติกรรม heartbeat ส่วนกลาง
- `agents.list[].heartbeat` จะ merge ทับด้านบน; หากเอเจนต์ใดมีบล็อก `heartbeat` จะมี **เฉพาะเอเจนต์เหล่านั้นเท่านั้น** ที่รัน heartbeat
- `channels.defaults.heartbeat` กำหนดค่าเริ่มต้นด้านการมองเห็นสำหรับทุกช่องทาง
- `channels.<channel>.heartbeat` override ค่าเริ่มต้นของช่องทาง
- `channels.<channel>.accounts.<id>.heartbeat` (ช่องทางแบบหลายบัญชี) override การตั้งค่ารายช่องทาง

### heartbeat ต่อเอเจนต์

หากรายการใดใน `agents.list[]` มีบล็อก `heartbeat` จะมี **เฉพาะเอเจนต์เหล่านั้น**
ที่รัน heartbeat บล็อกต่อเอเจนต์จะ merge ทับ `agents.defaults.heartbeat`
(ดังนั้นคุณจึงตั้งค่าเริ่มต้นร่วมกันครั้งเดียวแล้ว override รายเอเจนต์ได้)

ตัวอย่าง: มีเอเจนต์สองตัว และมีเพียงเอเจนต์ตัวที่สองเท่านั้นที่รัน heartbeat

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // ส่งไปยังผู้ติดต่อคนล่าสุดอย่างชัดเจน (ค่าเริ่มต้นคือ "none")
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

จำกัด heartbeat ให้อยู่ในเวลาทำการของธุรกิจในเขตเวลาที่กำหนด:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // ส่งไปยังผู้ติดต่อคนล่าสุดอย่างชัดเจน (ค่าเริ่มต้นคือ "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // ไม่บังคับ; ใช้ userTimezone ของคุณหากตั้งไว้ มิฉะนั้นใช้เขตเวลาของโฮสต์
        },
      },
    },
  },
}
```

นอกช่วงเวลานี้ (ก่อน 9 โมงเช้าหรือหลัง 4 ทุ่มตามเวลา Eastern) heartbeat จะถูกข้ามไป การ tick ครั้งถัดไปที่อยู่ภายในช่วงเวลาจะรันตามปกติ

### การตั้งค่า 24/7

หากคุณต้องการให้ heartbeat รันทั้งวัน ให้ใช้รูปแบบใดรูปแบบหนึ่งต่อไปนี้:

- ละ `activeHours` ไว้ทั้งหมด (ไม่มีการจำกัดช่วงเวลา; นี่คือพฤติกรรมค่าเริ่มต้น)
- ตั้งหน้าต่างเต็มวัน: `activeHours: { start: "00:00", end: "24:00" }`

อย่าตั้ง `start` และ `end` เป็นเวลาเดียวกัน (เช่น `08:00` ถึง `08:00`)
ระบบจะถือว่านี่เป็นหน้าต่างความกว้างศูนย์ ดังนั้น heartbeat จะถูกข้ามเสมอ

### ตัวอย่างหลายบัญชี

ใช้ `accountId` เพื่อกำหนดเป้าหมายบัญชีเฉพาะบนช่องทางแบบหลายบัญชี เช่น Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // ไม่บังคับ: กำหนดเส้นทางไปยัง topic/thread เฉพาะ
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

- `every`: ช่วงเวลา heartbeat (สตริงระยะเวลา; หน่วยค่าเริ่มต้น = นาที)
- `model`: override โมเดลแบบไม่บังคับสำหรับการรัน heartbeat (`provider/model`)
- `includeReasoning`: เมื่อเปิดใช้ จะส่งข้อความ `Reasoning:` แยกด้วยเมื่อมี (รูปแบบเดียวกับ `/reasoning on`)
- `lightContext`: เมื่อเป็น true การรัน heartbeat จะใช้บริบท bootstrap แบบเบา และเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของ workspace
- `isolatedSession`: เมื่อเป็น true heartbeat แต่ละครั้งจะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า ใช้รูปแบบการแยกแบบเดียวกับ cron `sessionTarget: "isolated"` ช่วยลดต้นทุนโทเค็นต่อ heartbeat อย่างมาก ควรใช้ร่วมกับ `lightContext: true` เพื่อประหยัดสูงสุด การกำหนดเส้นทางการส่งยังคงใช้บริบทของเซสชันหลัก
- `session`: session key แบบไม่บังคับสำหรับการรัน heartbeat
  - `main` (ค่าเริ่มต้น): เซสชันหลักของเอเจนต์
  - session key แบบชัดเจน (คัดลอกจาก `openclaw sessions --json` หรือ [sessions CLI](/th/cli/sessions))
  - รูปแบบ session key: ดู [Sessions](/th/concepts/session) และ [Groups](/th/channels/groups)
- `target`:
  - `last`: ส่งไปยังช่องทางภายนอกล่าสุดที่ใช้
  - ช่องทางแบบชัดเจน: ช่องทางหรือ Plugin id ใดก็ได้ที่กำหนดค่าไว้ เช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`
  - `none` (ค่าเริ่มต้น): รัน heartbeat แต่ **ไม่ส่งออกภายนอก**
- `directPolicy`: ควบคุมพฤติกรรมการส่งแบบ direct/DM:
  - `allow` (ค่าเริ่มต้น): อนุญาตการส่ง heartbeat แบบ direct/DM
  - `block`: ระงับการส่งแบบ direct/DM (`reason=dm-blocked`)
- `to`: override ผู้รับแบบไม่บังคับ (id เฉพาะช่องทาง เช่น E.164 สำหรับ WhatsApp หรือ chat id ของ Telegram) สำหรับ topic/thread ของ Telegram ให้ใช้ `<chatId>:topic:<messageThreadId>`
- `accountId`: account id แบบไม่บังคับสำหรับช่องทางแบบหลายบัญชี เมื่อ `target: "last"` account id จะถูกใช้กับช่องทางล่าสุดที่ resolve แล้วหากรองรับบัญชี; มิฉะนั้นจะถูกละเลย หาก account id ไม่ตรงกับบัญชีที่กำหนดค่าไว้สำหรับช่องทางที่ resolve แล้ว การส่งจะถูกข้าม
- `prompt`: override เนื้อหาพรอมป์ค่าเริ่มต้น (ไม่ merge)
- `ackMaxChars`: จำนวนอักขระสูงสุดที่อนุญาตหลัง `HEARTBEAT_OK` ก่อนส่ง
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับ payload คำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน heartbeat
- `activeHours`: จำกัดการรัน heartbeat ให้อยู่ในหน้าต่างเวลา เป็นออบเจ็กต์ที่มี `start` (HH:MM, รวมค่า; ใช้ `00:00` สำหรับต้นวัน), `end` (HH:MM แบบไม่รวมค่า; อนุญาต `24:00` สำหรับปลายวัน) และ `timezone` แบบไม่บังคับ
  - ละไว้หรือเป็น `"user"`: ใช้ `agents.defaults.userTimezone` ของคุณหากตั้งไว้ มิฉะนั้น fallback ไปยังเขตเวลาของระบบโฮสต์
  - `"local"`: ใช้เขตเวลาของระบบโฮสต์เสมอ
  - identifier แบบ IANA ใด ๆ (เช่น `America/New_York`): ใช้โดยตรง; หากไม่ถูกต้อง จะ fallback ไปยังพฤติกรรม `"user"` ด้านบน
  - `start` และ `end` ต้องไม่เท่ากันสำหรับหน้าต่างที่ทำงานอยู่; หากเท่ากันจะถือเป็นหน้าต่างความกว้างศูนย์ (อยู่นอกหน้าต่างเสมอ)
  - นอกหน้าต่างที่ทำงานอยู่ heartbeat จะถูกข้ามไปจนกว่าจะถึง tick ถัดไปภายในหน้าต่าง

## พฤติกรรมการส่งต่อ

- โดยค่าเริ่มต้น Heartbeat จะรันในเซสชันหลักของเอเจนต์ (`agent:<id>:<mainKey>`),
  หรือ `global` เมื่อ `session.scope = "global"` ตั้งค่า `session` เพื่อ override ไปยัง
  เซสชันของช่องทางที่ต้องการโดยเฉพาะ (Discord/WhatsApp/ฯลฯ)
- `session` มีผลเฉพาะกับบริบทของการรันเท่านั้น; การส่งต่อถูกควบคุมด้วย `target` และ `to`
- หากต้องการส่งไปยังช่องทาง/ผู้รับที่ระบุ ให้ตั้งค่า `target` + `to` เมื่อใช้
  `target: "last"` การส่งจะใช้ช่องทางภายนอกล่าสุดของเซสชันนั้น
- โดยค่าเริ่มต้น การส่งของ heartbeat อนุญาตปลายทางแบบ direct/DM ตั้งค่า `directPolicy: "block"` เพื่อระงับการส่งไปยังเป้าหมายแบบ direct ขณะยังคงรันเทิร์น heartbeat ต่อไป
- หากคิวหลักกำลังยุ่ง heartbeat จะถูกข้ามและลองใหม่ภายหลัง
- หาก `target` resolve แล้วไม่พบปลายทางภายนอก การรันจะยังเกิดขึ้นแต่จะไม่มี
  การส่งข้อความออกภายนอก
- หาก `showOk`, `showAlerts` และ `useIndicator` ถูกปิดทั้งหมด การรันจะถูกข้ามตั้งแต่ต้นด้วย `reason=alerts-disabled`
- หากปิดเฉพาะการส่งการแจ้งเตือน OpenClaw ยังสามารถรัน heartbeat อัปเดตเวลาประทับของงานที่ถึงกำหนด คืนค่าเวลาประทับสถานะ idle ของเซสชัน และระงับ payload การแจ้งเตือนขาออกได้
- หากเป้าหมาย heartbeat ที่ resolve แล้วรองรับการพิมพ์ OpenClaw จะแสดงสถานะกำลังพิมพ์ขณะ
  การรัน heartbeat กำลังทำงานอยู่ ระบบนี้ใช้เป้าหมายเดียวกับที่ heartbeat จะใช้
  ส่งเอาต์พุตแชต และจะถูกปิดด้วย `typingMode: "never"`
- คำตอบที่เป็น heartbeat-only **จะไม่** ทำให้เซสชันยังคง active; ค่า `updatedAt` ล่าสุด
  จะถูกคืนค่าเพื่อให้การหมดอายุเมื่อ idle ทำงานตามปกติ
- ประวัติใน Control UI และ WebChat จะซ่อนพรอมป์ heartbeat และการตอบรับ
  ที่เป็น OK-only อย่างไรก็ตาม transcript เซสชันที่อยู่เบื้องล่างยังคงอาจมีเทิร์นเหล่านั้น
  สำหรับการตรวจสอบย้อนหลัง/การเล่นซ้ำ
- [งานเบื้องหลัง](/th/automation/tasks)ที่แยกออกไปสามารถเพิ่ม system event เข้าคิวและปลุก heartbeat เมื่อเซสชันหลักควรรับรู้บางอย่างอย่างรวดเร็ว การปลุกนั้นไม่ได้ทำให้การรัน heartbeat กลายเป็นงานเบื้องหลัง

## ตัวควบคุมการแสดงผล

โดยค่าเริ่มต้น การตอบรับ `HEARTBEAT_OK` จะถูกระงับไว้ ขณะที่เนื้อหาการแจ้งเตือนจะ
ถูกส่งออก คุณสามารถปรับค่านี้รายช่องทางหรือรายบัญชีได้:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # ซ่อน HEARTBEAT_OK (ค่าเริ่มต้น)
      showAlerts: true # แสดงข้อความแจ้งเตือน (ค่าเริ่มต้น)
      useIndicator: true # ปล่อยอีเวนต์ indicator (ค่าเริ่มต้น)
  telegram:
    heartbeat:
      showOk: true # แสดงการตอบรับ OK บน Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # ระงับการส่งการแจ้งเตือนสำหรับบัญชีนี้
```

ลำดับความสำคัญ: รายบัญชี → รายช่องทาง → ค่าเริ่มต้นของช่องทาง → ค่าเริ่มต้นในตัว

### แต่ละแฟล็กทำอะไร

- `showOk`: ส่งการตอบรับ `HEARTBEAT_OK` เมื่อโมเดลส่งคืนคำตอบที่เป็น OK-only
- `showAlerts`: ส่งเนื้อหาการแจ้งเตือนเมื่อโมเดลส่งคืนคำตอบที่ไม่ใช่ OK
- `useIndicator`: ปล่อยอีเวนต์ indicator สำหรับพื้นผิวสถานะของ UI

หาก **ทั้งสามค่า** เป็น false OpenClaw จะข้ามการรัน heartbeat ทั้งหมด (ไม่มีการเรียกโมเดล)

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

| เป้าหมาย                                 | คอนฟิก                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| พฤติกรรมค่าเริ่มต้น (OK แบบเงียบ, แจ้งเตือนเปิด) | _(ไม่ต้องกำหนดค่า)_                                                                     |
| เงียบทั้งหมด (ไม่มีข้อความ, ไม่มี indicator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| indicator อย่างเดียว (ไม่มีข้อความ)      | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| แสดง OK ในช่องทางเดียวเท่านั้น           | `channels.telegram.heartbeat: { showOk: true }`                                          |

## `HEARTBEAT.md` (ไม่บังคับ)

หากมีไฟล์ `HEARTBEAT.md` อยู่ใน workspace พรอมป์ค่าเริ่มต้นจะบอกให้
เอเจนต์อ่านไฟล์นั้น คุณอาจมองมันเป็น “รายการตรวจสอบ heartbeat” ของคุณ: เล็ก คงที่ และ
ปลอดภัยที่จะรวมทุก 30 นาที

ในการรันปกติ `HEARTBEAT.md` จะถูก inject เฉพาะเมื่อ
เปิดใช้คำแนะนำ heartbeat สำหรับเอเจนต์ค่าเริ่มต้น การปิดรอบเวลา heartbeat ด้วย `0m` หรือ
ตั้งค่า `includeSystemPromptSection: false` จะทำให้ไฟล์นี้ไม่ถูกรวมในบริบท bootstrap
ปกติ

หากมี `HEARTBEAT.md` อยู่แต่แทบไม่มีเนื้อหาเลย (มีเพียงบรรทัดว่างและ heading แบบ markdown
เช่น `# Heading`) OpenClaw จะข้ามการรัน heartbeat เพื่อประหยัดการเรียก API
การข้ามนี้จะถูกรายงานเป็น `reason=empty-heartbeat-file`
หากไม่มีไฟล์ heartbeat จะยังคงรัน และให้โมเดลตัดสินใจว่าจะทำอะไร

ควรทำให้ไฟล์นี้เล็กมาก (รายการตรวจสอบสั้น ๆ หรือการเตือนความจำ) เพื่อหลีกเลี่ยง prompt bloat

ตัวอย่าง `HEARTBEAT.md`:

```md
# รายการตรวจสอบ Heartbeat

- สแกนอย่างรวดเร็ว: มีอะไรเร่งด่วนในกล่องจดหมายไหม?
- หากเป็นเวลากลางวัน ให้เช็กอินเบา ๆ หากไม่มีอย่างอื่นค้างอยู่
- หากงานติดขัด ให้จดไว้ว่า _ขาดอะไร_ และถาม Peter ในครั้งถัดไป
```

### บล็อก `tasks:`

`HEARTBEAT.md` ยังรองรับบล็อก `tasks:` แบบมีโครงสร้างขนาดเล็กสำหรับการตรวจสอบ
ตามช่วงเวลาภายใน heartbeat เอง

ตัวอย่าง:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# คำแนะนำเพิ่มเติม

- ให้การแจ้งเตือนสั้น ๆ
- หากหลังจากตรวจทุกงานที่ถึงกำหนดแล้วยังไม่มีอะไรต้องใส่ใจ ให้ตอบ HEARTBEAT_OK
```

พฤติกรรม:

- OpenClaw จะแยกวิเคราะห์บล็อก `tasks:` และตรวจสอบแต่ละงานกับ `interval` ของงานนั้นเอง
- จะรวมเฉพาะงานที่ **ถึงกำหนด** ในพรอมป์ heartbeat สำหรับ tick นั้น
- หากไม่มีงานใดถึงกำหนด heartbeat จะถูกข้ามทั้งหมด (`reason=no-tasks-due`) เพื่อหลีกเลี่ยงการเรียกโมเดลโดยเปล่าประโยชน์
- เนื้อหาที่ไม่ใช่งานใน `HEARTBEAT.md` จะถูกรักษาไว้และผนวกเป็นบริบทเพิ่มเติมต่อจากรายการงานที่ถึงกำหนด
- เวลาประทับการรันล่าสุดของงานจะถูกเก็บไว้ในสถานะของเซสชัน (`heartbeatTaskState`) ดังนั้นช่วงเวลาจะคงอยู่ข้ามการรีสตาร์ตปกติ
- เวลาประทับของงานจะถูกเลื่อนไปข้างหน้าหลังจากการรัน heartbeat ผ่านเส้นทางการตอบกลับปกติเสร็จสิ้นแล้วเท่านั้น การรันที่ถูกข้ามด้วย `empty-heartbeat-file` / `no-tasks-due` จะไม่ทำเครื่องหมายว่างานเสร็จสมบูรณ์

โหมด task มีประโยชน์เมื่อคุณต้องการให้ไฟล์ heartbeat ไฟล์เดียวเก็บการตรวจสอบเป็นระยะหลายรายการ โดยไม่ต้องจ่ายต้นทุนสำหรับทุกรายการในทุก tick

### เอเจนต์สามารถอัปเดต `HEARTBEAT.md` ได้ไหม?

ได้ — ถ้าคุณสั่งให้ทำ

`HEARTBEAT.md` เป็นเพียงไฟล์ปกติใน workspace ของเอเจนต์ ดังนั้นคุณสามารถบอก
เอเจนต์ (ในแชตปกติ) ด้วยข้อความเช่น:

- “อัปเดต `HEARTBEAT.md` เพื่อเพิ่มการตรวจปฏิทินรายวัน”
- “เขียน `HEARTBEAT.md` ใหม่ให้สั้นลงและเน้นการติดตามงานจากกล่องจดหมาย”

หากคุณต้องการให้สิ่งนี้เกิดขึ้นเชิงรุก คุณยังสามารถใส่บรรทัดที่ชัดเจนไว้ใน
พรอมป์ heartbeat ได้ เช่น: “If the checklist becomes stale, update HEARTBEAT.md
with a better one.”

หมายเหตุด้านความปลอดภัย: อย่าใส่ความลับ (API keys, หมายเลขโทรศัพท์, private tokens) ลงใน
`HEARTBEAT.md` — เพราะมันจะกลายเป็นส่วนหนึ่งของบริบทพรอมป์

## การปลุกแบบแมนนวล (ตามต้องการ)

คุณสามารถเพิ่ม system event เข้าคิวและเรียก heartbeat ทันทีได้ด้วย:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

หากมีหลายเอเจนต์ที่กำหนดค่า `heartbeat` ไว้ การปลุกแบบแมนนวลจะรัน heartbeat ของเอเจนต์แต่ละตัวเหล่านั้น
ทันที

ใช้ `--mode next-heartbeat` เพื่อรอ tick ที่ตั้งเวลาไว้ครั้งถัดไป

## การส่ง reasoning (ไม่บังคับ)

โดยค่าเริ่มต้น heartbeat จะส่งเฉพาะ payload “answer” สุดท้าย

หากคุณต้องการความโปร่งใส ให้เปิดใช้:

- `agents.defaults.heartbeat.includeReasoning: true`

เมื่อเปิดใช้ Heartbeat จะส่งข้อความแยกที่ขึ้นต้นด้วย
`Reasoning:` ด้วย (รูปแบบเดียวกับ `/reasoning on`) ฟีเจอร์นี้มีประโยชน์เมื่อเอเจนต์
กำลังจัดการหลายเซสชัน/codexes และคุณต้องการเห็นว่าเหตุใดมันจึงตัดสินใจ ping
คุณ — แต่มันก็อาจเปิดเผยรายละเอียดภายในมากกว่าที่คุณต้องการด้วย ควรปิดไว้ในแชตกลุ่ม

## การตระหนักถึงต้นทุน

Heartbeat รันเทิร์นเอเจนต์เต็มรูปแบบ ช่วงเวลาที่สั้นลงจะใช้โทเค็นมากขึ้น วิธีลดต้นทุน:

- ใช้ `isolatedSession: true` เพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมด (~100K โทเค็นลดลงเหลือ ~2-5K ต่อการรัน)
- ใช้ `lightContext: true` เพื่อจำกัดไฟล์ bootstrap ให้เหลือแค่ `HEARTBEAT.md`
- ตั้งค่า `model` ที่ถูกกว่า (เช่น `ollama/llama3.2:1b`)
- ทำให้ `HEARTBEAT.md` มีขนาดเล็ก
- ใช้ `target: "none"` หากคุณต้องการเพียงการอัปเดตสถานะภายใน

## ที่เกี่ยวข้อง

- [Automation & Tasks](/th/automation) — ภาพรวมของกลไกการทำงานอัตโนมัติทั้งหมด
- [Background Tasks](/th/automation/tasks) — วิธีติดตามงานที่แยกออกไป
- [Timezone](/th/concepts/timezone) — เขตเวลาส่งผลต่อการตั้งเวลา heartbeat อย่างไร
- [Troubleshooting](/th/automation/cron-jobs#troubleshooting) — การแก้ไขปัญหาด้านระบบอัตโนมัติ
