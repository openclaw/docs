---
read_when:
    - การปรับความถี่หรือการส่งข้อความของ Heartbeat
    - การเลือกระหว่าง Heartbeat และ Cron สำหรับงานตามกำหนดเวลา
sidebarTitle: Heartbeat
summary: ข้อความการสำรวจ Heartbeat และกฎการแจ้งเตือน
title: Heartbeat
x-i18n:
    generated_at: "2026-07-12T16:05:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat เทียบกับ Cron?** ดูคำแนะนำว่าควรใช้แต่ละแบบเมื่อใดได้ที่ [ระบบอัตโนมัติ](/th/automation)
</Note>

Heartbeat เรียกใช้ **รอบการทำงานของเอเจนต์เป็นระยะ** ในเซสชันหลัก เพื่อให้โมเดลแจ้งสิ่งที่ต้องได้รับความสนใจโดยไม่ส่งข้อความรบกวนคุณมากเกินไป

Heartbeat คือรอบการทำงานตามกำหนดเวลาในเซสชันหลัก โดย **ไม่** สร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks) ระเบียนงานมีไว้สำหรับงานที่แยกออกไปทำต่างหาก (การทำงานของ ACP, เอเจนต์ย่อย, งาน Cron แบบแยกส่วน)

การแก้ไขปัญหา: [งานตามกำหนดเวลา](/th/automation/cron-jobs#troubleshooting)

## เริ่มต้นอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

<Steps>
  <Step title="เลือกความถี่">
    เปิดใช้ Heartbeat ไว้ (ค่าเริ่มต้นคือ `30m` หรือ `1h` เมื่อกำหนดค่าการยืนยันตัวตนด้วย OAuth/โทเค็นของ Anthropic รวมถึงการใช้ข้อมูลจาก Claude CLI ซ้ำ) หรือกำหนดความถี่ของคุณเอง
  </Step>
  <Step title="เพิ่ม HEARTBEAT.md (ไม่บังคับ)">
    สร้างรายการตรวจสอบขนาดเล็กใน `HEARTBEAT.md` หรือบล็อก `tasks:` ในพื้นที่ทำงานของเอเจนต์
  </Step>
  <Step title="กำหนดปลายทางของข้อความ Heartbeat">
    `target: "none"` เป็นค่าเริ่มต้น ให้ตั้งค่า `target: "last"` เพื่อส่งไปยังผู้ติดต่อล่าสุด
  </Step>
  <Step title="การปรับแต่งเพิ่มเติม">
    - เปิดใช้การส่งเหตุผลของ Heartbeat เพื่อความโปร่งใส
    - ใช้บริบทเริ่มต้นแบบประหยัด หากการทำงานของ Heartbeat ต้องใช้เพียง `HEARTBEAT.md`
    - เปิดใช้เซสชันแบบแยกส่วนเพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมดในทุก Heartbeat
    - จำกัด Heartbeat ให้ทำงานเฉพาะช่วงเวลาที่ใช้งาน (เวลาท้องถิ่น)

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
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## ค่าเริ่มต้น

- ช่วงเวลา: `30m` การใช้ค่าเริ่มต้นของผู้ให้บริการ Anthropic จะเพิ่มเป็น `1h` เมื่อโหมดการยืนยันตัวตนที่ได้คือ OAuth/โทเค็น (รวมถึงการใช้ข้อมูลจาก Claude CLI ซ้ำ) แต่เฉพาะเมื่อยังไม่ได้ตั้งค่า `heartbeat.every` กำหนด `agents.defaults.heartbeat.every` หรือ `agents.list[].heartbeat.every` รายเอเจนต์ และใช้ `0m` เพื่อปิดใช้งาน
- เนื้อหาพรอมต์ (กำหนดค่าได้ผ่าน `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- การหมดเวลา: รอบการทำงานของ Heartbeat ที่ไม่ได้กำหนดค่าจะใช้ `agents.defaults.timeoutSeconds` หากมีการตั้งค่าไว้ มิฉะนั้นจะใช้ความถี่ของ Heartbeat โดยจำกัดสูงสุดไว้ที่ 600 วินาที กำหนด `agents.defaults.heartbeat.timeoutSeconds` หรือ `agents.list[].heartbeat.timeoutSeconds` รายเอเจนต์สำหรับงาน Heartbeat ที่ใช้เวลานานกว่านั้น
- พรอมต์ Heartbeat จะถูกส่ง **ตามข้อความเดิมทุกประการ** ในฐานะข้อความของผู้ใช้ พรอมต์ระบบจะมีส่วน "Heartbeats" เฉพาะเมื่อเปิดใช้ Heartbeat สำหรับเอเจนต์เริ่มต้น (และ `includeSystemPromptSection` ไม่ใช่ `false`) และการทำงานดังกล่าวจะถูกทำเครื่องหมายไว้ภายใน
- เมื่อปิดใช้ Heartbeat ด้วย `0m` การทำงานปกติจะไม่นำ `HEARTBEAT.md` เข้าในบริบทเริ่มต้นด้วย เพื่อไม่ให้โมเดลเห็นคำสั่งที่มีไว้สำหรับ Heartbeat เท่านั้น
- ช่วงเวลาที่ใช้งาน (`heartbeat.activeHours`) จะได้รับการตรวจสอบตามเขตเวลาที่กำหนดค่าไว้ เมื่ออยู่นอกช่วง Heartbeat จะถูกข้ามจนถึงรอบถัดไปที่อยู่ภายในช่วง
- Heartbeat จะเลื่อนออกไปโดยอัตโนมัติขณะที่งาน Cron กำลังทำงานหรืออยู่ในคิว ตั้งค่า `heartbeat.skipWhenBusy: true` เพื่อเลื่อนเอเจนต์ออกไปด้วย เมื่อเอเจนต์ย่อยที่ผูกกับคีย์เซสชันของเอเจนต์นั้นหรือช่องทางคำสั่งแบบซ้อนกำลังทำงาน เอเจนต์ระดับเดียวกันจะไม่หยุดชั่วคราวเพียงเพราะเอเจนต์อื่นมีงานของเอเจนต์ย่อยกำลังดำเนินอยู่

## จุดประสงค์ของพรอมต์ Heartbeat

พรอมต์เริ่มต้นตั้งใจให้ครอบคลุมกว้าง:

- **งานเบื้องหลัง**: "Consider outstanding tasks" กระตุ้นให้เอเจนต์ตรวจสอบสิ่งที่ต้องติดตามต่อ (กล่องจดหมาย ปฏิทิน การแจ้งเตือน งานในคิว) และแจ้งสิ่งเร่งด่วน
- **การสอบถามผู้ใช้**: "Checkup sometimes on your human during day time" กระตุ้นให้ส่งข้อความสั้น ๆ เป็นครั้งคราวว่า "มีอะไรให้ช่วยไหม" แต่หลีกเลี่ยงการส่งข้อความรบกวนในเวลากลางคืนด้วยการใช้เขตเวลาท้องถิ่นที่คุณกำหนดค่าไว้ (ดู [เขตเวลา](/th/concepts/timezone))

Heartbeat สามารถตอบสนองต่องาน [เบื้องหลัง](/th/automation/tasks) ที่เสร็จสิ้นแล้วได้ แต่การทำงานของ Heartbeat เองจะไม่สร้างระเบียนงาน

หากคุณต้องการให้ Heartbeat ทำสิ่งที่เฉพาะเจาะจงมาก (เช่น "ตรวจสอบสถิติ Gmail PubSub" หรือ "ตรวจสอบสถานะของ Gateway") ให้ตั้งค่า `agents.defaults.heartbeat.prompt` (หรือ `agents.list[].heartbeat.prompt`) เป็นเนื้อหาที่กำหนดเอง (ส่งตามข้อความเดิมทุกประการ)

## ข้อตกลงการตอบกลับ

- หากไม่มีสิ่งใดต้องได้รับความสนใจ ให้ตอบกลับด้วย **`HEARTBEAT_OK`**
- การทำงานของ Heartbeat อาจเรียก `heartbeat_respond` โดยใช้ `notify: false` เพื่อไม่แสดงการอัปเดต หรือใช้ `notify: true` พร้อม `notificationText` สำหรับการแจ้งเตือนแทน หากมีการตอบกลับจากเครื่องมือแบบมีโครงสร้าง การตอบกลับนั้นจะมีลำดับความสำคัญเหนือข้อความสำรอง
- ระหว่างการทำงานของ Heartbeat OpenClaw จะถือว่า `HEARTBEAT_OK` เป็นการตอบรับเมื่อปรากฏที่ **จุดเริ่มต้นหรือจุดสิ้นสุด** ของคำตอบ โทเค็นดังกล่าวจะถูกตัดออก และคำตอบจะถูกละทิ้งหากเนื้อหาที่เหลือมีความยาว **≤ `ackMaxChars`** (ค่าเริ่มต้น: 300)
- หาก `HEARTBEAT_OK` ปรากฏอยู่ **ตรงกลาง** คำตอบ ระบบจะไม่จัดการเป็นกรณีพิเศษ
- สำหรับการแจ้งเตือน **ห้าม** ใส่ `HEARTBEAT_OK` ให้ส่งกลับเฉพาะข้อความแจ้งเตือน

นอกการทำงานของ Heartbeat ระบบจะตัด `HEARTBEAT_OK` ที่หลงอยู่ตรงจุดเริ่มต้นหรือจุดสิ้นสุดของข้อความออกและบันทึกลงในบันทึก ข้อความที่มีเพียง `HEARTBEAT_OK` จะถูกละทิ้ง

## การกำหนดค่า

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
        includeSystemPromptSection: true, // default: true; false omits the ## Heartbeats system prompt section for the default agent
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### ขอบเขตและลำดับความสำคัญ

- `agents.defaults.heartbeat` กำหนดพฤติกรรม Heartbeat โดยรวม
- `agents.list[].heartbeat` จะผสานทับค่าดังกล่าว หากเอเจนต์ใดมีบล็อก `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะเรียกใช้ Heartbeat
- `channels.defaults.heartbeat` กำหนดค่าเริ่มต้นด้านการมองเห็นสำหรับทุกช่องทาง
- `channels.<channel>.heartbeat` เขียนทับค่าเริ่มต้นของช่องทาง
- `channels.<channel>.accounts.<id>.heartbeat` (ช่องทางแบบหลายบัญชี) เขียนทับการตั้งค่ารายช่องทาง

### Heartbeat รายเอเจนต์

หากรายการใดใน `agents.list[]` มีบล็อก `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะเรียกใช้ Heartbeat บล็อกรายเอเจนต์จะผสานทับ `agents.defaults.heartbeat` (คุณจึงสามารถกำหนดค่าเริ่มต้นร่วมกันครั้งเดียวและเขียนทับเป็นรายเอเจนต์ได้)

ตัวอย่าง: มีเอเจนต์สองตัว โดยมีเพียงเอเจนต์ตัวที่สองที่เรียกใช้ Heartbeat

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

จำกัด Heartbeat ให้ทำงานเฉพาะเวลาทำการในเขตเวลาที่ระบุ:

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

เมื่ออยู่นอกช่วงนี้ (ก่อน 9:00 น. หรือหลัง 22:00 น. ตามเวลาตะวันออก) Heartbeat จะถูกข้าม รอบตามกำหนดเวลาถัดไปที่อยู่ภายในช่วงจะทำงานตามปกติ

### การตั้งค่าให้ทำงานตลอด 24 ชั่วโมงทุกวัน

หากคุณต้องการให้ Heartbeat ทำงานตลอดทั้งวัน ให้ใช้รูปแบบใดรูปแบบหนึ่งต่อไปนี้:

- ละ `activeHours` ทั้งหมด (ไม่มีข้อจำกัดด้านช่วงเวลา ซึ่งเป็นพฤติกรรมเริ่มต้น)
- กำหนดช่วงเต็มวัน: `activeHours: { start: "00:00", end: "24:00" }`

<Warning>
อย่ากำหนดเวลา `start` และ `end` ให้เหมือนกัน (เช่น `08:00` ถึง `08:00`) ระบบจะถือว่าเป็นช่วงเวลาที่มีความกว้างเป็นศูนย์ ดังนั้น Heartbeat จะถูกข้ามเสมอ
</Warning>

### ตัวอย่างหลายบัญชี

ใช้ `accountId` เพื่อระบุบัญชีที่ต้องการบนช่องทางแบบหลายบัญชี เช่น Telegram:

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

### หมายเหตุเกี่ยวกับฟิลด์

<ParamField path="every" type="string">
  ช่วงเวลาของ Heartbeat (สตริงระยะเวลา หน่วยเริ่มต้น = นาที)
</ParamField>
<ParamField path="model" type="string">
  การเขียนทับโมเดลสำหรับการทำงานของ Heartbeat ซึ่งไม่บังคับ (`provider/model`)
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  เมื่อเปิดใช้ ระบบจะส่งข้อความ `Thinking` แยกต่างหากด้วยเมื่อมีให้ใช้งาน (รูปแบบเดียวกับ `/reasoning on`)
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  เมื่อเป็นจริง การทำงานของ Heartbeat จะใช้บริบทเริ่มต้นแบบประหยัด และเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์เริ่มต้นของพื้นที่ทำงาน
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  เมื่อเป็นจริง Heartbeat แต่ละครั้งจะทำงานในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า โดยใช้รูปแบบการแยกส่วนเดียวกับ `sessionTarget: "isolated"` ของ Cron ซึ่งช่วยลดค่าใช้จ่ายโทเค็นต่อ Heartbeat ได้อย่างมาก ใช้ร่วมกับ `lightContext: true` เพื่อประหยัดสูงสุด การกำหนดเส้นทางการส่งยังคงใช้บริบทของเซสชันหลัก
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  เมื่อเป็นจริง การทำงานของ Heartbeat จะเลื่อนออกไปเมื่อช่องทางงานเพิ่มเติมของเอเจนต์นั้นไม่ว่าง ได้แก่ เอเจนต์ย่อยที่ผูกกับคีย์เซสชันของตนเองหรืองานคำสั่งแบบซ้อน ช่องทาง Cron จะเลื่อน Heartbeat ออกไปเสมอแม้ไม่มีแฟล็กนี้ เพื่อให้โฮสต์โมเดลภายในเครื่องไม่เรียกใช้พรอมต์ Cron และ Heartbeat พร้อมกัน
</ParamField>
<ParamField path="session" type="string">
  คีย์เซสชันสำหรับการทำงานของ Heartbeat ซึ่งไม่บังคับ

- `main` (ค่าเริ่มต้น): เซสชันหลักของเอเจนต์
- คีย์เซสชันที่ระบุชัดเจน (คัดลอกจาก `openclaw sessions --json` หรือ [CLI สำหรับเซสชัน](/th/cli/sessions))
- รูปแบบคีย์เซสชัน: ดู [เซสชัน](/th/concepts/session) และ [กลุ่ม](/th/channels/groups)

</ParamField>
<ParamField path="target" type="string">
- `last`: ส่งไปยังช่องทางภายนอกที่ใช้ล่าสุด
- ช่องทางที่ระบุชัดเจน: ช่องทางหรือรหัส Plugin ใด ๆ ที่กำหนดค่าไว้ เช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`
- `none` (ค่าเริ่มต้น): เรียกใช้ Heartbeat แต่ **ไม่ส่ง** ไปยังภายนอก

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  ควบคุมพฤติกรรมการส่งโดยตรง/DM `allow`: อนุญาตให้ส่ง Heartbeat โดยตรง/DM `block`: ระงับการส่งโดยตรง/DM (`reason=dm-blocked`)

</ParamField>
<ParamField path="to" type="string">
  ตัวเลือกเสริมสำหรับแทนที่ผู้รับ (รหัสเฉพาะของช่องทาง เช่น E.164 สำหรับ WhatsApp หรือรหัสแชต Telegram) สำหรับหัวข้อ/เธรดของ Telegram ให้ใช้ `<chatId>:topic:<messageThreadId>`

</ParamField>
<ParamField path="accountId" type="string">
  รหัสบัญชีเสริมสำหรับช่องทางที่รองรับหลายบัญชี เมื่อกำหนด `target: "last"` รหัสบัญชีจะใช้กับช่องทางล่าสุดที่ถูกระบุ หากช่องทางนั้นรองรับบัญชี มิฉะนั้นระบบจะไม่สนใจค่านี้ หากรหัสบัญชีไม่ตรงกับบัญชีที่กำหนดค่าไว้สำหรับช่องทางที่ถูกระบุ ระบบจะข้ามการส่ง

</ParamField>
<ParamField path="prompt" type="string">
  แทนที่เนื้อหาพรอมต์เริ่มต้น (ไม่ผสานรวม)

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  กำหนดว่าจะแทรกส่วน `## Heartbeats` ของพรอมต์ระบบสำหรับเอเจนต์เริ่มต้นหรือไม่ ตั้งค่าเป็น `false` เพื่อคงพฤติกรรม Heartbeat ขณะทำงาน (รอบเวลา การส่ง และ HEARTBEAT.md) แต่ไม่รวมคำสั่ง Heartbeat ไว้ในพรอมต์ระบบของเอเจนต์

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  จำนวนอักขระสูงสุดที่อนุญาตหลัง `HEARTBEAT_OK` ก่อนส่ง

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  เมื่อเป็นจริง จะระงับเพย์โหลดคำเตือนข้อผิดพลาดของเครื่องมือระหว่างการทำงานของ Heartbeat

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  จำนวนวินาทีสูงสุดที่อนุญาตให้เทิร์นของเอเจนต์ Heartbeat ทำงานก่อนถูกยุติ ปล่อยว่างเพื่อใช้ `agents.defaults.timeoutSeconds` หากตั้งค่าไว้ มิฉะนั้นจะใช้รอบเวลาของ Heartbeat โดยจำกัดสูงสุดที่ 600 วินาที

</ParamField>
<ParamField path="activeHours" type="object">
  จำกัดการทำงานของ Heartbeat ให้อยู่ภายในช่วงเวลาที่กำหนด อ็อบเจกต์ประกอบด้วย `start` (HH:MM รวมเวลาที่ระบุ ใช้ `00:00` สำหรับเวลาเริ่มต้นวัน), `end` (HH:MM ไม่รวมเวลาที่ระบุ อนุญาตให้ใช้ `24:00` สำหรับเวลาสิ้นสุดวัน) และ `timezone` ที่เป็นตัวเลือกเสริม

- ไม่ระบุหรือ `"user"`: ใช้ `agents.defaults.userTimezone` หากตั้งค่าไว้ มิฉะนั้นจะใช้เขตเวลาของระบบโฮสต์
- `"local"`: ใช้เขตเวลาของระบบโฮสต์เสมอ
- ตัวระบุ IANA ใด ๆ (เช่น `America/New_York`): ใช้โดยตรง หากไม่ถูกต้อง จะกลับไปใช้พฤติกรรม `"user"` ข้างต้น
- `start` และ `end` ต้องไม่เท่ากันสำหรับช่วงเวลาที่เปิดใช้งาน ค่าที่เท่ากันจะถือว่ามีความกว้างเป็นศูนย์ (อยู่นอกช่วงเวลาเสมอ)
- เมื่ออยู่นอกช่วงเวลาที่เปิดใช้งาน ระบบจะข้าม Heartbeat จนถึงรอบถัดไปที่อยู่ภายในช่วงเวลา

</ParamField>

## พฤติกรรมการส่ง

<AccordionGroup>
  <Accordion title="เซสชันและการกำหนดเส้นทางเป้าหมาย">
    - โดยค่าเริ่มต้น Heartbeat จะทำงานในเซสชันหลักของเอเจนต์ (`agent:<id>:<mainKey>`) หรือ `global` เมื่อ `session.scope = "global"` ตั้งค่า `session` เพื่อแทนที่ด้วยเซสชันของช่องทางที่ระบุ (Discord/WhatsApp/ฯลฯ)
    - `session` มีผลเฉพาะต่อบริบทการทำงาน ส่วนการส่งควบคุมด้วย `target` และ `to`
    - หากต้องการส่งไปยังช่องทาง/ผู้รับที่ระบุ ให้ตั้งค่า `target` + `to` เมื่อใช้ `target: "last"` การส่งจะใช้ช่องทางภายนอกล่าสุดของเซสชันนั้น
    - โดยค่าเริ่มต้น การส่ง Heartbeat อนุญาตเป้าหมายแบบโดยตรง/DM ตั้งค่า `directPolicy: "block"` เพื่อระงับการส่งไปยังเป้าหมายโดยตรง แต่ยังคงเรียกใช้เทิร์น Heartbeat
    - หากคิวหลัก เลนของเซสชันเป้าหมาย เลน Cron หรืองาน Cron ที่กำลังทำงานอยู่ไม่ว่าง ระบบจะข้าม Heartbeat และลองใหม่ภายหลัง
    - หากตั้งค่า `skipWhenBusy: true` เลนของเอเจนต์ย่อยที่ผูกกับคีย์เซสชันและเลนซ้อนของเอเจนต์นี้จะเลื่อนการทำงานของ Heartbeat ด้วย เลนที่ไม่ว่างของเอเจนต์อื่นจะไม่ทำให้เอเจนต์นี้เลื่อนการทำงาน
    - หาก `target` ไม่สามารถระบุปลายทางภายนอกได้ การทำงานยังคงเกิดขึ้น แต่จะไม่มีการส่งข้อความออก

  </Accordion>
  <Accordion title="การมองเห็นและพฤติกรรมการข้าม">
    - หากปิดใช้งาน `showOk`, `showAlerts` และ `useIndicator` ทั้งหมด ระบบจะข้ามการทำงานตั้งแต่ต้นด้วย `reason=alerts-disabled`
    - หากปิดใช้งานเฉพาะการส่งการแจ้งเตือน OpenClaw ยังสามารถเรียกใช้ Heartbeat อัปเดตการประทับเวลาของงานที่ถึงกำหนด คืนค่าการประทับเวลาไม่ได้ใช้งานของเซสชัน และระงับเพย์โหลดการแจ้งเตือนภายนอก
    - หากเป้าหมาย Heartbeat ที่ถูกระบุรองรับสถานะกำลังพิมพ์ OpenClaw จะแสดงสถานะกำลังพิมพ์ขณะที่ Heartbeat ทำงาน โดยใช้เป้าหมายเดียวกับที่ Heartbeat จะส่งผลลัพธ์แชตไป และสามารถปิดใช้งานได้ด้วย `typingMode: "never"`

  </Accordion>
  <Accordion title="วงจรชีวิตของเซสชันและการตรวจสอบ">
    - การตอบกลับที่มีเฉพาะ Heartbeat จะ**ไม่**ทำให้เซสชันคงอยู่ต่อไป เมตาดาต้า Heartbeat อาจอัปเดตแถวของเซสชัน แต่การหมดอายุเนื่องจากไม่ได้ใช้งานจะใช้ `lastInteractionAt` จากข้อความจริงล่าสุดของผู้ใช้/ช่องทาง และการหมดอายุรายวันจะใช้ `sessionStartedAt`
    - ประวัติใน Control UI และ WebChat จะซ่อนพรอมต์ Heartbeat และการตอบรับที่มีเฉพาะ OK แต่ทรานสคริปต์เซสชันเบื้องหลังยังคงมีเทิร์นเหล่านั้นเพื่อการตรวจสอบ/เล่นซ้ำ
    - [งานเบื้องหลัง](/th/automation/tasks) ที่แยกออกมาสามารถเพิ่มอีเวนต์ระบบเข้าคิวและปลุก Heartbeat เมื่อควรแจ้งให้เซสชันหลักทราบบางสิ่งอย่างรวดเร็ว การปลุกดังกล่าวไม่ได้ทำให้การทำงานของ Heartbeat กลายเป็นงานเบื้องหลัง

  </Accordion>
</AccordionGroup>

## การควบคุมการมองเห็น

โดยค่าเริ่มต้น การตอบรับ `HEARTBEAT_OK` จะถูกระงับ ขณะที่เนื้อหาการแจ้งเตือนจะถูกส่ง คุณสามารถปรับค่าแยกตามช่องทางหรือบัญชีได้ดังนี้:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # ซ่อน HEARTBEAT_OK (ค่าเริ่มต้น)
      showAlerts: true # แสดงข้อความแจ้งเตือน (ค่าเริ่มต้น)
      useIndicator: true # ปล่อยอีเวนต์ตัวบ่งชี้ (ค่าเริ่มต้น)
  telegram:
    heartbeat:
      showOk: true # แสดงการตอบรับ OK บน Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # ระงับการส่งการแจ้งเตือนสำหรับบัญชีนี้
```

ลำดับความสำคัญ: รายบัญชี → รายช่องทาง → ค่าเริ่มต้นของช่องทาง → ค่าเริ่มต้นในตัวระบบ

### หน้าที่ของแต่ละแฟล็ก

- `showOk`: ส่งการตอบรับ `HEARTBEAT_OK` เมื่อโมเดลส่งคืนคำตอบที่มีเฉพาะ OK
- `showAlerts`: ส่งเนื้อหาการแจ้งเตือนเมื่อโมเดลส่งคืนคำตอบที่ไม่ใช่ OK
- `useIndicator`: ปล่อยอีเวนต์ตัวบ่งชี้สำหรับพื้นผิวสถานะของ UI

หาก**ทั้งสามค่า**เป็นเท็จ OpenClaw จะข้ามการทำงานของ Heartbeat ทั้งหมด (ไม่มีการเรียกโมเดล)

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
      showOk: true # บัญชี Slack ทั้งหมด
    accounts:
      ops:
        heartbeat:
          showAlerts: false # ระงับการแจ้งเตือนเฉพาะบัญชี ops
  telegram:
    heartbeat:
      showOk: true
```

### รูปแบบที่ใช้บ่อย

| เป้าหมาย                                      | การกำหนดค่า                                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| พฤติกรรมเริ่มต้น (OK แบบเงียบ เปิดการแจ้งเตือน) | _(ไม่ต้องกำหนดค่า)_                                                                     |
| เงียบทั้งหมด (ไม่มีข้อความ ไม่มีตัวบ่งชี้) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| เฉพาะตัวบ่งชี้ (ไม่มีข้อความ)              | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| แสดง OK ในช่องทางเดียวเท่านั้น              | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (ตัวเลือกเสริม)

หากมีไฟล์ `HEARTBEAT.md` อยู่ในพื้นที่ทำงาน พรอมต์เริ่มต้นจะบอกให้เอเจนต์อ่านไฟล์นี้ ให้มองว่าไฟล์นี้เป็น "รายการตรวจสอบ Heartbeat" ของคุณ ซึ่งควรมีขนาดเล็ก คงที่ และปลอดภัยสำหรับการพิจารณาทุก 30 นาที

ในการทำงานปกติ ระบบจะแทรก `HEARTBEAT.md` เฉพาะเมื่อเปิดใช้งานคำแนะนำ Heartbeat สำหรับเอเจนต์เริ่มต้น การปิดใช้งานรอบเวลาของ Heartbeat ด้วย `0m` หรือการตั้งค่า `includeSystemPromptSection: false` จะไม่นำไฟล์นี้ไปรวมในบริบทเริ่มต้นตามปกติ

บนชุดควบคุม Codex แบบเนทีฟ เนื้อหาของ `HEARTBEAT.md` จะไม่ถูกแทรกเข้าไปในเทิร์นเหมือนไฟล์เริ่มต้นอื่น หากไฟล์มีอยู่และมีเนื้อหาที่ไม่ใช่ช่องว่าง หมายเหตุโหมดการทำงานร่วมกันของ Heartbeat จะชี้ให้ Codex ไปยังไฟล์ดังกล่าวและบอกให้อ่านไฟล์ก่อนดำเนินการต่อ

หากมี `HEARTBEAT.md` แต่แทบไม่มีเนื้อหา (มีเพียงบรรทัดว่าง ความคิดเห็น Markdown/HTML หัวข้อ Markdown เช่น `# Heading` เครื่องหมายรั้วโค้ด หรือโครงรายการตรวจสอบที่ว่างเปล่า) OpenClaw จะข้ามการทำงานของ Heartbeat เพื่อประหยัดการเรียก API การข้ามดังกล่าวจะรายงานเป็น `reason=empty-heartbeat-file` หากไม่มีไฟล์ Heartbeat จะยังคงทำงานและโมเดลจะตัดสินใจว่าควรทำอะไร

รักษาไฟล์ให้มีขนาดเล็ก (รายการตรวจสอบหรือข้อความเตือนสั้น ๆ) เพื่อหลีกเลี่ยงไม่ให้พรอมต์มีขนาดใหญ่เกินไป

ตัวอย่าง `HEARTBEAT.md`:

```md
# รายการตรวจสอบ Heartbeat

- ตรวจอย่างรวดเร็ว: มีเรื่องเร่งด่วนในกล่องข้อความหรือไม่?
- หากเป็นช่วงกลางวัน ให้ตรวจสอบสถานะเล็กน้อยถ้าไม่มีเรื่องอื่นรอดำเนินการ
- หากงานติดขัด ให้จดว่า_ขาดอะไร_ และถาม Peter ในครั้งถัดไป
```

### บล็อก `tasks:`

`HEARTBEAT.md` ยังรองรับบล็อก `tasks:` แบบมีโครงสร้างขนาดเล็กสำหรับการตรวจสอบตามช่วงเวลาภายใน Heartbeat เอง

ตัวอย่าง:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "ตรวจหาอีเมลที่ยังไม่ได้อ่านและเร่งด่วน แล้วทำเครื่องหมายรายการที่ไวต่อเวลา"
- name: calendar-scan
  interval: 2h
  prompt: "ตรวจหาการประชุมที่กำลังจะมาถึงซึ่งต้องเตรียมตัวหรือติดตามผล"

# คำสั่งเพิ่มเติม

- เขียนการแจ้งเตือนให้สั้น
- หากไม่มีสิ่งใดต้องดำเนินการหลังตรวจงานที่ถึงกำหนดทั้งหมดแล้ว ให้ตอบ HEARTBEAT_OK
```

<AccordionGroup>
  <Accordion title="พฤติกรรม">
    - OpenClaw จะแยกวิเคราะห์บล็อก `tasks:` และตรวจสอบแต่ละงานตาม `interval` ของงานนั้น
    - เฉพาะงานที่**ถึงกำหนด**เท่านั้นที่จะถูกรวมไว้ในพรอมต์ Heartbeat สำหรับรอบนั้น
    - หากไม่มีงานถึงกำหนด ระบบจะข้าม Heartbeat ทั้งหมด (`reason=no-tasks-due`) เพื่อหลีกเลี่ยงการเรียกโมเดลโดยเปล่าประโยชน์
    - เนื้อหาที่ไม่ใช่งานใน `HEARTBEAT.md` จะถูกเก็บไว้และต่อท้ายเป็นบริบทเพิ่มเติมหลังรายการงานที่ถึงกำหนด
    - การประทับเวลาที่เรียกใช้งานล่าสุดจะจัดเก็บไว้ในสถานะเซสชัน (`heartbeatTaskState`) ดังนั้นช่วงเวลาจึงยังคงอยู่หลังการเริ่มระบบใหม่ตามปกติ
    - การประทับเวลาของงานจะเลื่อนไปข้างหน้าหลังจาก Heartbeat ทำงานผ่านเส้นทางการตอบกลับปกติจนเสร็จสมบูรณ์เท่านั้น การทำงานที่ถูกข้ามด้วย `empty-heartbeat-file` / `no-tasks-due` จะไม่ทำเครื่องหมายว่างานเสร็จสมบูรณ์

  </Accordion>
</AccordionGroup>

โหมดงานมีประโยชน์เมื่อคุณต้องการใช้ไฟล์ Heartbeat ไฟล์เดียวเก็บการตรวจสอบตามรอบเวลาหลายรายการ โดยไม่ต้องเสียค่าใช้จ่ายสำหรับทุกรายการในทุกรอบ

### เอเจนต์สามารถอัปเดต HEARTBEAT.md ได้หรือไม่?

ได้ หากคุณขอให้ดำเนินการ

`HEARTBEAT.md` เป็นเพียงไฟล์ปกติในพื้นที่ทำงานของเอเจนต์ ดังนั้นคุณสามารถบอกเอเจนต์ (ในแชตปกติ) ได้ดังนี้:

- "อัปเดต `HEARTBEAT.md` เพื่อเพิ่มการตรวจสอบปฏิทินรายวัน"
- "เขียน `HEARTBEAT.md` ใหม่ให้สั้นลงและมุ่งเน้นการติดตามผลจากกล่องข้อความ"

หากต้องการให้เกิดขึ้นเชิงรุก คุณสามารถใส่บรรทัดที่ชัดเจนในพรอมต์ Heartbeat ได้เช่นกัน เช่น: "หากรายการตรวจสอบล้าสมัย ให้อัปเดต HEARTBEAT.md ด้วยรายการที่ดีกว่า"

<Warning>
อย่าใส่ข้อมูลลับ (คีย์ API หมายเลขโทรศัพท์ โทเค็นส่วนตัว) ลงใน `HEARTBEAT.md` เพราะไฟล์นี้จะกลายเป็นส่วนหนึ่งของบริบทพรอมต์
</Warning>

## การปลุกด้วยตนเอง (ตามคำขอ)

ใช้ `openclaw system event` เพื่อเพิ่มอีเวนต์ระบบเข้าคิวและเลือกเรียก Heartbeat ทันที:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

| แฟล็ก                         | คำอธิบาย                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `--text <text>`              | ข้อความอีเวนต์ระบบ (จำเป็น)                                                                    |
| `--mode <mode>`              | `now` เรียก Heartbeat ทันที ส่วน `next-heartbeat` (ค่าเริ่มต้น) รอรอบเวลาถัดไปที่กำหนดไว้ |
| `--session-key <sessionKey>` | กำหนดเป้าหมายอีเวนต์เป็นเซสชันที่ระบุ ค่าเริ่มต้นคือเซสชันหลักของเอเจนต์                   |
| `--json`                     | แสดงผลเป็น JSON                                                                                     |

หากไม่ได้ระบุ `--session-key` และมีเอเจนต์หลายตัวที่กำหนดค่า `heartbeat` ไว้ `--mode now` จะเรียก Heartbeat ของเอเจนต์เหล่านั้นทั้งหมดทันที

การควบคุม Heartbeat ที่เกี่ยวข้องในกลุ่ม CLI เดียวกัน:

```bash
openclaw system heartbeat last     # แสดงอีเวนต์ Heartbeat ล่าสุด
openclaw system heartbeat enable   # เปิดใช้งาน Heartbeat
openclaw system heartbeat disable  # ปิดใช้งาน Heartbeat
```

## การส่งกระบวนการให้เหตุผล (ตัวเลือกเสริม)

ตามค่าเริ่มต้น Heartbeat จะส่งเฉพาะเพย์โหลด "คำตอบ" สุดท้ายเท่านั้น

หากต้องการความโปร่งใส ให้เปิดใช้งาน:

- `agents.defaults.heartbeat.includeReasoning: true`

เมื่อเปิดใช้งาน Heartbeat จะส่งข้อความแยกต่างหากที่ขึ้นต้นด้วย `Thinking` ด้วย (มีรูปแบบเดียวกับ `/reasoning on`) ซึ่งมีประโยชน์เมื่อตัวแทนกำลังจัดการหลายเซสชัน/หลาย codex และคุณต้องการทราบว่าเหตุใดจึงตัดสินใจส่งการแจ้งเตือนถึงคุณ แต่ก็อาจเปิดเผยรายละเอียดภายในมากกว่าที่คุณต้องการ แนะนำให้ปิดไว้ในการแชทกลุ่ม

## การคำนึงถึงค่าใช้จ่าย

Heartbeat จะเรียกใช้รอบการทำงานของตัวแทนแบบเต็ม ช่วงเวลาที่สั้นลงจะใช้โทเค็นมากขึ้น วิธีลดค่าใช้จ่าย:

- ใช้ `isolatedSession: true` เพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมด (ลดจากประมาณ 100K โทเค็นเหลือประมาณ 2–5K ต่อการเรียกใช้)
- ใช้ `lightContext: true` เพื่อจำกัดไฟล์เริ่มต้นให้เหลือเพียง `HEARTBEAT.md`
- ตั้งค่า `model` ที่มีราคาถูกกว่า (เช่น `ollama/llama3.2:1b`)
- ทำให้ `HEARTBEAT.md` มีขนาดเล็ก
- ใช้ `target: "none"` หากต้องการเพียงอัปเดตสถานะภายใน

## บริบทล้นหลังจาก Heartbeat

Heartbeat จะคงโมเดลรันไทม์ปัจจุบันของเซสชันที่ใช้ร่วมกันไว้หลังจากการเรียกใช้เสร็จสิ้น ดังนั้น Heartbeat ที่สลับเซสชันไปใช้โมเดลภายในเครื่องที่เล็กกว่า (ตัวอย่างเช่น โมเดล Ollama ที่มีหน้าต่างบริบท 32k) อาจทำให้โมเดลดังกล่าวยังคงถูกใช้ในรอบถัดไปของเซสชันหลัก หากรอบถัดไปนั้นรายงานว่าบริบทล้น และโมเดลรันไทม์ล่าสุดของเซสชันตรงกับ `heartbeat.model` ที่กำหนดไว้ ข้อความกู้คืนของ OpenClaw จะระบุว่าการที่โมเดล Heartbeat ค้างมาใช้ต่อเป็นสาเหตุที่เป็นไปได้ และจะแนะนำวิธีแก้ไข

เพื่อหลีกเลี่ยงปัญหานี้ ให้ใช้ `isolatedSession: true` เพื่อเรียกใช้ Heartbeat ในเซสชันใหม่ (อาจใช้ร่วมกับ `lightContext: true` เพื่อให้พรอมต์มีขนาดเล็กที่สุด) หรือเลือกโมเดล Heartbeat ที่มีหน้าต่างบริบทใหญ่เพียงพอสำหรับเซสชันที่ใช้ร่วมกัน

## เนื้อหาที่เกี่ยวข้อง

- [ระบบอัตโนมัติ](/th/automation) - ภาพรวมกลไกระบบอัตโนมัติทั้งหมด
- [งานเบื้องหลัง](/th/automation/tasks) - วิธีติดตามงานที่ทำงานแยกออกมา
- [เขตเวลา](/th/concepts/timezone) - ผลของเขตเวลาต่อการกำหนดเวลา Heartbeat
- [การแก้ไขปัญหา](/th/automation/cron-jobs#troubleshooting) - การแก้ไขข้อบกพร่องของระบบอัตโนมัติ
