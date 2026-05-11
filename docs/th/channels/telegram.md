---
read_when:
    - การทำงานกับฟีเจอร์ของ Telegram หรือ Webhook
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของบอต Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-11T20:21:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f14e59b18e3727b13598d2a5f83ba3ca4267c27c1bd295d36ad20c64707791a
    source_path: channels/telegram.md
    workflow: 16
---

พร้อมใช้งานจริงสำหรับ DM และกลุ่มของบอทผ่าน grammY โหมดเริ่มต้นคือ long polling ส่วนโหมด Webhook เป็นตัวเลือก

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับ Telegram คือการจับคู่
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและคู่มือการซ่อมแซม
  </Card>
  <Card title="การกำหนดค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าช่องทางฉบับเต็ม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="สร้างโทเค็นบอทใน BotFather">
    เปิด Telegram แล้วแชตกับ **@BotFather** (ยืนยันว่าแฮนเดิลเป็น `@BotFather` ทุกตัวอักษร)

    เรียกใช้ `/newbot` ทำตามพรอมต์ และบันทึกโทเค็นไว้

  </Step>

  <Step title="กำหนดค่าโทเค็นและนโยบาย DM">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    ค่า env สำรอง: `TELEGRAM_BOT_TOKEN=...` (บัญชีเริ่มต้นเท่านั้น)
    Telegram **ไม่** ใช้ `openclaw channels login telegram`; ให้กำหนดค่าโทเค็นใน config/env แล้วจึงเริ่ม gateway

  </Step>

  <Step title="เริ่ม Gateway และอนุมัติ DM แรก">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    รหัสจับคู่หมดอายุหลังจาก 1 ชั่วโมง

  </Step>

  <Step title="เพิ่มบอทลงในกลุ่ม">
    เพิ่มบอทลงในกลุ่มของคุณ จากนั้นรับ ID ทั้งสองรายการที่การเข้าถึงกลุ่มต้องใช้:

    - ID ผู้ใช้ Telegram ของคุณ ใช้ใน `allowFrom` / `groupAllowFrom`
    - ID แชตกลุ่ม Telegram ใช้เป็นคีย์ภายใต้ `channels.telegram.groups`

    สำหรับการตั้งค่าครั้งแรก ให้รับ ID แชตกลุ่มจาก `openclaw logs --follow`, บอท forwarded-ID หรือ Bot API `getUpdates` หลังจากอนุญาตกลุ่มแล้ว `/whoami@<bot_username>` สามารถยืนยัน ID ผู้ใช้และกลุ่มได้

    ID ซูเปอร์กรุ๊ป Telegram แบบค่าลบที่ขึ้นต้นด้วย `-100` คือ ID แชตกลุ่ม ให้วางไว้ภายใต้ `channels.telegram.groups` ไม่ใช่ภายใต้ `groupAllowFrom`

  </Step>
</Steps>

<Note>
ลำดับการค้นหาโทเค็นรับรู้ตามบัญชี ในทางปฏิบัติ ค่าจาก config จะชนะค่า env สำรอง และ `TELEGRAM_BOT_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="โหมดความเป็นส่วนตัวและการมองเห็นในกลุ่ม">
    บอท Telegram เริ่มต้นที่ **Privacy Mode** ซึ่งจำกัดข้อความกลุ่มที่บอทจะได้รับ

    หากบอทต้องเห็นข้อความทั้งหมดในกลุ่ม ให้ทำอย่างใดอย่างหนึ่ง:

    - ปิดโหมดความเป็นส่วนตัวผ่าน `/setprivacy` หรือ
    - ตั้งให้บอทเป็นผู้ดูแลกลุ่ม

    เมื่อสลับโหมดความเป็นส่วนตัว ให้ลบและเพิ่มบอทกลับเข้าไปใหม่ในแต่ละกลุ่ม เพื่อให้ Telegram นำการเปลี่ยนแปลงไปใช้

  </Accordion>

  <Accordion title="สิทธิ์ของกลุ่ม">
    สถานะผู้ดูแลควบคุมได้ในการตั้งค่ากลุ่ม Telegram

    บอทผู้ดูแลจะได้รับข้อความทั้งหมดในกลุ่ม ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มแบบทำงานตลอดเวลา

  </Accordion>

  <Accordion title="สวิตช์ BotFather ที่มีประโยชน์">

    - `/setjoingroups` เพื่ออนุญาต/ปฏิเสธการเพิ่มเข้ากลุ่ม
    - `/setprivacy` สำหรับพฤติกรรมการมองเห็นในกลุ่ม

  </Accordion>
</AccordionGroup>

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.telegram.dmPolicy` ควบคุมการเข้าถึงข้อความตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist` (ต้องมี ID ผู้ส่งอย่างน้อยหนึ่งรายการใน `allowFrom`)
    - `open` (ต้องให้ `allowFrom` รวม `"*"`)
    - `disabled`

    `dmPolicy: "open"` พร้อม `allowFrom: ["*"]` ทำให้บัญชี Telegram ใดก็ตามที่พบหรือเดาชื่อผู้ใช้บอทได้สามารถสั่งงานบอทได้ ใช้เฉพาะกับบอทสาธารณะที่ตั้งใจเปิดใช้งานและมีเครื่องมือที่จำกัดอย่างเข้มงวดเท่านั้น; บอทเจ้าของคนเดียวควรใช้ `allowlist` พร้อม ID ผู้ใช้แบบตัวเลข

    `channels.telegram.allowFrom` รับ ID ผู้ใช้ Telegram แบบตัวเลข รองรับและทำให้ prefix `telegram:` / `tg:` เป็นมาตรฐาน
    ใน config หลายบัญชี `channels.telegram.allowFrom` ระดับบนสุดที่จำกัดเข้มงวดจะถูกถือเป็นขอบเขตความปลอดภัย: รายการ `allowFrom: ["*"]` ระดับบัญชีจะไม่ทำให้บัญชีนั้นเป็นสาธารณะ เว้นแต่ allowlist ที่มีผลของบัญชียังคงมี wildcard ที่ระบุชัดเจนหลังจากผสานแล้ว
    `dmPolicy: "allowlist"` ที่มี `allowFrom` ว่างจะบล็อก DM ทั้งหมด และถูกปฏิเสธโดยการตรวจสอบ config
    การตั้งค่าจะขอเฉพาะ ID ผู้ใช้แบบตัวเลข
    หากคุณอัปเกรดแล้ว config ของคุณมีรายการ allowlist แบบ `@username` ให้เรียกใช้ `openclaw doctor --fix` เพื่อแก้ไขรายการเหล่านั้น (พยายามทำให้ดีที่สุด; ต้องใช้โทเค็นบอท Telegram)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์ allowlist ของ pairing-store `openclaw doctor --fix` สามารถกู้คืนรายการเข้าสู่ `channels.telegram.allowFrom` ในโฟลว์ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID ที่ระบุชัดเจน)

    สำหรับบอทเจ้าของคนเดียว ควรใช้ `dmPolicy: "allowlist"` พร้อม ID `allowFrom` แบบตัวเลขที่ระบุชัดเจน เพื่อให้นโยบายการเข้าถึงคงทนอยู่ใน config (แทนการพึ่งพาการอนุมัติการจับคู่ก่อนหน้า)

    ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่ได้หมายความว่า "ผู้ส่งรายนี้ได้รับอนุญาตทุกที่"
    การจับคู่ให้สิทธิ์การเข้าถึง DM หากยังไม่มีเจ้าของคำสั่ง การจับคู่ที่อนุมัติครั้งแรกจะตั้งค่า `commands.ownerAllowFrom` ด้วย เพื่อให้คำสั่งเฉพาะเจ้าของและการอนุมัติ exec มีบัญชีผู้ปฏิบัติการที่ระบุชัดเจน
    การอนุญาตผู้ส่งในกลุ่มยังคงมาจาก allowlist ใน config ที่ระบุชัดเจน
    หากคุณต้องการ "ฉันได้รับอนุญาตครั้งเดียว แล้วทั้ง DM และคำสั่งในกลุ่มใช้งานได้" ให้วาง ID ผู้ใช้ Telegram แบบตัวเลขของคุณใน `channels.telegram.allowFrom`; สำหรับคำสั่งเฉพาะเจ้าของ ตรวจสอบให้แน่ใจว่า `commands.ownerAllowFrom` มี `telegram:<your user id>`

    ### การหา ID ผู้ใช้ Telegram ของคุณ

    วิธีที่ปลอดภัยกว่า (ไม่มีบอทบุคคลที่สาม):

    1. ส่ง DM ไปยังบอทของคุณ
    2. เรียกใช้ `openclaw logs --follow`
    3. อ่าน `from.id`

    วิธี Bot API อย่างเป็นทางการ:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="นโยบายกลุ่มและ allowlist">
    มีตัวควบคุมสองอย่างที่ทำงานร่วมกัน:

    1. **กลุ่มใดได้รับอนุญาต** (`channels.telegram.groups`)
       - ไม่มี config `groups`:
         - เมื่อใช้ `groupPolicy: "open"`: กลุ่มใดก็ผ่านการตรวจสอบ ID กลุ่มได้
         - เมื่อใช้ `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการ `groups` (หรือ `"*"`)
       - กำหนดค่า `groups` แล้ว: ทำหน้าที่เป็น allowlist (ID ที่ระบุชัดเจนหรือ `"*"`)

    2. **ผู้ส่งใดได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่า Telegram จะ fallback ไปที่ `allowFrom`
    รายการ `groupAllowFrom` ควรเป็น ID ผู้ใช้ Telegram แบบตัวเลข (`telegram:` / `tg:` prefixes จะถูกทำให้เป็นมาตรฐาน)
    อย่าใส่ ID แชตกลุ่มหรือซูเปอร์กรุ๊ป Telegram ใน `groupAllowFrom` ID แชตแบบค่าลบอยู่ภายใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเว้นสำหรับการอนุญาตผู้ส่ง
    ขอบเขตความปลอดภัย (`2026.2.25+`): auth ผู้ส่งในกลุ่ม **ไม่** สืบทอดการอนุมัติจาก DM pairing-store
    การจับคู่ยังคงใช้กับ DM เท่านั้น สำหรับกลุ่ม ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` ต่อกลุ่ม/ต่อหัวข้อ
    หากไม่ได้ตั้งค่า `groupAllowFrom` Telegram จะ fallback ไปที่ config `allowFrom` ไม่ใช่ pairing store
    รูปแบบใช้งานจริงสำหรับบอทเจ้าของคนเดียว: ตั้งค่า ID ผู้ใช้ของคุณใน `channels.telegram.allowFrom` ปล่อย `groupAllowFrom` ว่างไว้ และอนุญาตกลุ่มเป้าหมายภายใต้ `channels.telegram.groups`
    หมายเหตุ runtime: หากไม่มี `channels.telegram` เลย runtime จะใช้ค่าเริ่มต้นแบบ fail-closed `groupPolicy="allowlist"` เว้นแต่จะตั้งค่า `channels.defaults.groupPolicy` ไว้ชัดเจน

    การตั้งค่ากลุ่มเฉพาะเจ้าของ:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    ทดสอบจากกลุ่มด้วย `@<bot_username> ping` ข้อความกลุ่มปกติจะไม่เรียกบอทขณะที่ `requireMention: true`

    ตัวอย่าง: อนุญาตสมาชิกใดก็ได้ในกลุ่มเฉพาะหนึ่งกลุ่ม:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    ตัวอย่าง: อนุญาตเฉพาะผู้ใช้บางรายภายในกลุ่มเฉพาะหนึ่งกลุ่ม:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      ข้อผิดพลาดที่พบบ่อย: `groupAllowFrom` ไม่ใช่ allowlist ของกลุ่ม Telegram

      - วาง ID แชตกลุ่มหรือซูเปอร์กรุ๊ป Telegram แบบค่าลบ เช่น `-1001234567890` ไว้ภายใต้ `channels.telegram.groups`
      - วาง ID ผู้ใช้ Telegram เช่น `8734062810` ไว้ภายใต้ `groupAllowFrom` เมื่อคุณต้องการจำกัดว่าคนใดในกลุ่มที่ได้รับอนุญาตสามารถเรียกบอทได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกคนใดก็ได้ของกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอทได้

    </Warning>

  </Tab>

  <Tab title="พฤติกรรมการ mention">
    การตอบกลับในกลุ่มต้องมี mention โดยค่าเริ่มต้น

    mention อาจมาจาก:

    - mention `@botusername` แบบ native หรือ
    - รูปแบบ mention ใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    สวิตช์คำสั่งระดับเซสชัน:

    - `/activation always`
    - `/activation mention`

    สิ่งเหล่านี้อัปเดตเฉพาะสถานะเซสชัน ใช้ config เพื่อให้คงอยู่ถาวร

    ตัวอย่าง config แบบถาวร:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    การรับ ID แชตกลุ่ม:

    - ส่งต่อข้อความกลุ่มไปยัง `@userinfobot` / `@getidsbot`
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจสอบ Bot API `getUpdates`
    - หลังจากอนุญาตกลุ่มแล้ว ให้เรียกใช้ `/whoami@<bot_username>` หากเปิดใช้คำสั่ง native

  </Tab>
</Tabs>

## พฤติกรรม runtime

- Telegram อยู่ภายใต้การดูแลของกระบวนการ gateway
- การ routing เป็นแบบ deterministic: ข้อความขาเข้า Telegram จะตอบกลับไปยัง Telegram (โมเดลไม่เลือกช่องทาง)
- ข้อความขาเข้าจะถูก normalize เป็น envelope ช่องทางร่วม พร้อม metadata การตอบกลับ, placeholder สื่อ และบริบท reply-chain ที่คงอยู่สำหรับการตอบกลับ Telegram ที่ gateway สังเกตเห็น
- เซสชันกลุ่มแยกตาม ID กลุ่ม หัวข้อฟอรัมจะต่อท้าย `:topic:<threadId>` เพื่อแยกหัวข้อออกจากกัน
- ข้อความ DM สามารถมี `message_thread_id`; OpenClaw จะเก็บ thread ID ไว้สำหรับการตอบกลับ แต่คง DM ไว้บนเซสชันแบบแบนโดยค่าเริ่มต้น กำหนดค่า `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` หรือ config หัวข้อที่ตรงกัน เมื่อคุณตั้งใจต้องการแยกเซสชันหัวข้อ DM
- Long polling ใช้ grammY runner พร้อมการจัดลำดับต่อแชต/ต่อเธรด concurrency โดยรวมของ runner sink ใช้ `agents.defaults.maxConcurrent`
- Long polling ถูก guard ภายในแต่ละกระบวนการ gateway เพื่อให้มี poller ที่ทำงานอยู่เพียงตัวเดียวใช้โทเค็นบอทได้ในแต่ละครั้ง หากคุณยังเห็นข้อขัดแย้ง `getUpdates` 409 อาจมี OpenClaw gateway, สคริปต์ หรือ poller ภายนอกตัวอื่นใช้โทเค็นเดียวกันอยู่
- การรีสตาร์ทจาก watchdog ของ long-polling จะทำงานหลังจากไม่มี liveness ของ `getUpdates` ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีโดยค่าเริ่มต้น เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อ deployment ของคุณยังเห็นการรีสตาร์ทจาก polling-stall ที่เป็น false ระหว่างงานที่รันนาน ค่านี้อยู่ในหน่วยมิลลิวินาที และอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับการ override ต่อบัญชี
- Telegram Bot API ไม่รองรับ read-receipt (`sendReadReceipts` ใช้ไม่ได้)

## อ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="พรีวิว live stream (การแก้ไขข้อความ)">
    OpenClaw สามารถสตรีมการตอบกลับบางส่วนแบบเรียลไทม์ได้:

    - แชตตรง: ข้อความพรีวิว + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความพรีวิว + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` คือ `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - `progress` เก็บร่างสถานะที่แก้ไขได้หนึ่งรายการสำหรับความคืบหน้าของเครื่องมือ ล้างเมื่อเสร็จสิ้น และส่งคำตอบสุดท้ายเป็นข้อความปกติ
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความพรีวิวที่แก้ไขข้อความเดิมซ้ำหรือไม่ (ค่าเริ่มต้น: `true` เมื่อการสตรีมพรีวิวทำงานอยู่)
    - `streaming.preview.commandText` ควบคุมรายละเอียดคำสั่ง/การรันภายในบรรทัดความคืบหน้าเครื่องมือเหล่านั้น: `raw` (ค่าเริ่มต้น รักษาพฤติกรรมที่เผยแพร่แล้วไว้) หรือ `status` (เฉพาะป้ายกำกับเครื่องมือ)
    - ตรวจพบค่าเดิม `channels.telegram.streamMode` และค่า boolean `streaming`; รัน `openclaw doctor --fix` เพื่อย้ายไปยัง `channels.telegram.streaming.mode`

    การอัปเดตพรีวิวความคืบหน้าเครื่องมือคือบรรทัดสถานะสั้น ๆ ที่แสดงขณะเครื่องมือทำงาน เช่น การรันคำสั่ง การอ่านไฟล์ การอัปเดตแผน หรือสรุปแพตช์ Telegram เปิดใช้ค่าเหล่านี้ตามค่าเริ่มต้นเพื่อให้ตรงกับพฤติกรรม OpenClaw ที่เผยแพร่ตั้งแต่ `v2026.4.22` เป็นต้นไป หากต้องการเก็บพรีวิวที่แก้ไขได้สำหรับข้อความคำตอบ แต่ซ่อนบรรทัดความคืบหน้าเครื่องมือ ให้ตั้งค่า:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    หากต้องการให้เห็นความคืบหน้าเครื่องมือ แต่ซ่อนข้อความคำสั่ง/การรัน ให้ตั้งค่า:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    ใช้โหมด `progress` เมื่อคุณต้องการให้เห็นความคืบหน้าเครื่องมือโดยไม่แก้ไขคำตอบสุดท้ายลงในข้อความเดียวกันนั้น วางนโยบายข้อความคำสั่งไว้ใต้ `streaming.progress`:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    ใช้ `streaming.mode: "off"` เฉพาะเมื่อคุณต้องการส่งเฉพาะผลลัพธ์สุดท้าย: การแก้ไขพรีวิวของ Telegram จะถูกปิดใช้ และเสียงรบกวนทั่วไปเกี่ยวกับเครื่องมือ/ความคืบหน้าจะถูกระงับแทนการส่งเป็นข้อความสถานะแยกต่างหาก พรอมป์อนุมัติ เพย์โหลดสื่อ และข้อผิดพลาดยังคงส่งผ่านการส่งผลลัพธ์สุดท้ายตามปกติ ใช้ `streaming.preview.toolProgress: false` เมื่อคุณต้องการเก็บการแก้ไขพรีวิวคำตอบไว้เท่านั้น ขณะซ่อนบรรทัดสถานะความคืบหน้าเครื่องมือ

    <Note>
      การตอบกลับคำพูดอ้างอิงที่เลือกไว้ใน Telegram เป็นข้อยกเว้น เมื่อ `replyToMode` เป็น `"first"`, `"all"` หรือ `"batched"` และข้อความขาเข้ามีข้อความคำพูดอ้างอิงที่เลือกไว้ OpenClaw จะส่งคำตอบสุดท้ายผ่านเส้นทางการตอบกลับคำพูดอ้างอิงแบบเนทีฟของ Telegram แทนการแก้ไขพรีวิวคำตอบ ดังนั้น `streaming.preview.toolProgress` จึงไม่สามารถแสดงบรรทัดสถานะสั้น ๆ สำหรับรอบนั้นได้ การตอบกลับข้อความปัจจุบันที่ไม่มีข้อความคำพูดอ้างอิงที่เลือกไว้ยังคงใช้การสตรีมพรีวิว ตั้งค่า `replyToMode: "off"` เมื่อการมองเห็นความคืบหน้าเครื่องมือสำคัญกว่าการตอบกลับคำพูดอ้างอิงแบบเนทีฟ หรือ ตั้งค่า `streaming.preview.toolProgress: false` เพื่อยอมรับการแลกเปลี่ยนนี้
    </Note>

    สำหรับการตอบกลับแบบข้อความเท่านั้น:

    - พรีวิวสั้นใน DM/กลุ่ม/หัวข้อ: OpenClaw เก็บข้อความพรีวิวเดิมไว้และทำการแก้ไขสุดท้ายในที่เดิม
    - ผลลัพธ์สุดท้ายแบบข้อความยาวที่แบ่งเป็นหลายข้อความ Telegram จะใช้พรีวิวที่มีอยู่เป็นชิ้นสุดท้ายชิ้นแรกเมื่อทำได้ จากนั้นส่งเฉพาะชิ้นที่เหลือ
    - ผลลัพธ์สุดท้ายในโหมดความคืบหน้าจะล้างร่างสถานะและใช้การส่งผลลัพธ์สุดท้ายตามปกติแทนการแก้ไขร่างให้เป็นคำตอบ
    - หากการแก้ไขสุดท้ายล้มเหลวก่อนยืนยันข้อความที่เสร็จสมบูรณ์ OpenClaw จะใช้การส่งผลลัพธ์สุดท้ายตามปกติและล้างพรีวิวที่ค้างอยู่

    สำหรับการตอบกลับที่ซับซ้อน (เช่น เพย์โหลดสื่อ) OpenClaw จะถอยกลับไปใช้การส่งผลลัพธ์สุดท้ายตามปกติ จากนั้นล้างข้อความพรีวิว

    การสตรีมพรีวิวแยกจากการสตรีมแบบบล็อก เมื่อเปิดใช้การสตรีมแบบบล็อกอย่างชัดเจนสำหรับ Telegram OpenClaw จะข้ามสตรีมพรีวิวเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

    สตรีมการให้เหตุผลเฉพาะ Telegram:

    - `/reasoning stream` ส่งการให้เหตุผลไปยังพรีวิวสดขณะสร้างคำตอบ
    - พรีวิวการให้เหตุผลจะถูกลบหลังจากส่งผลลัพธ์สุดท้าย; ใช้ `/reasoning on` เมื่อควรให้การให้เหตุผลยังคงมองเห็นได้
    - คำตอบสุดท้ายจะถูกส่งโดยไม่มีข้อความการให้เหตุผล

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    ข้อความขาออกใช้ Telegram `parse_mode: "HTML"`

    - ข้อความที่คล้าย Markdown จะถูกแสดงผลเป็น HTML ที่ปลอดภัยสำหรับ Telegram
    - HTML ดิบจากโมเดลจะถูก escape เพื่อลดความล้มเหลวในการแยกวิเคราะห์ของ Telegram
    - หาก Telegram ปฏิเสธ HTML ที่แยกวิเคราะห์แล้ว OpenClaw จะลองใหม่เป็นข้อความธรรมดา

    พรีวิวลิงก์เปิดใช้ตามค่าเริ่มต้น และปิดใช้ได้ด้วย `channels.telegram.linkPreview: false`

  </Accordion>

  <Accordion title="Native commands and custom commands">
    การลงทะเบียนเมนูคำสั่งของ Telegram จัดการตอนเริ่มต้นด้วย `setMyCommands`

    ค่าเริ่มต้นของคำสั่งเนทีฟ:

    - `commands.native: "auto"` เปิดใช้คำสั่งเนทีฟสำหรับ Telegram

    เพิ่มรายการเมนูคำสั่งกำหนดเอง:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    กฎ:

    - ชื่อจะถูกทำให้เป็นรูปแบบมาตรฐาน (ตัด `/` นำหน้าออก แปลงเป็นตัวพิมพ์เล็ก)
    - รูปแบบที่ถูกต้อง: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งกำหนดเองไม่สามารถแทนที่คำสั่งเนทีฟได้
    - รายการที่ชนกัน/ซ้ำกันจะถูกข้ามและบันทึก log

    หมายเหตุ:

    - คำสั่งกำหนดเองเป็นเพียงรายการเมนู; ไม่ได้ติดตั้งพฤติกรรมให้อัตโนมัติ
    - คำสั่งของ Plugin/skill ยังทำงานได้เมื่อพิมพ์ แม้จะไม่แสดงในเมนู Telegram

    หากปิดใช้คำสั่งเนทีฟ รายการในตัวจะถูกลบ คำสั่งกำหนดเอง/Plugin อาจยังลงทะเบียนได้หากกำหนดค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังเกินขีดจำกัดหลังตัดทอนแล้ว; ลดคำสั่ง Plugin/skill/กำหนดเอง หรือปิดใช้ `channels.telegram.commands.native`
    - `deleteWebhook`, `deleteMyCommands` หรือ `setMyCommands` ล้มเหลวด้วย `404: Not Found` ขณะที่คำสั่ง curl โดยตรงของ Bot API ใช้งานได้ อาจหมายความว่า `channels.telegram.apiRoot` ถูกตั้งเป็น endpoint เต็ม `/bot<TOKEN>` ต้องให้ `apiRoot` เป็นเพียงรากของ Bot API เท่านั้น และ `openclaw doctor --fix` จะลบ `/bot<TOKEN>` ต่อท้ายที่ตั้งโดยไม่ตั้งใจออก
    - `getMe returned 401` หมายความว่า Telegram ปฏิเสธโทเค็นบอทที่กำหนดค่าไว้ อัปเดต `botToken`, `tokenFile` หรือ `TELEGRAM_BOT_TOKEN` ด้วยโทเค็น BotFather ปัจจุบัน; OpenClaw จะหยุดก่อน polling ดังนั้นจะไม่ถูกรายงานเป็นความล้มเหลวในการล้าง Webhook
    - `setMyCommands failed` พร้อมข้อผิดพลาดเครือข่าย/fetch มักหมายความว่า DNS/HTTPS ขาออกไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งจับคู่อุปกรณ์ (Plugin `device-pair`)

    เมื่อติดตั้ง Plugin `device-pair`:

    1. `/pair` สร้างรหัสตั้งค่า
    2. วางรหัสในแอป iOS
    3. `/pair pending` แสดงรายการคำขอที่รอดำเนินการ (รวม role/scopes)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบระบุชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    รหัสตั้งค่ามีโทเค็น bootstrap อายุสั้น การส่งต่อ bootstrap ในตัวจะเก็บโทเค็นโหนดหลักไว้ที่ `scopes: []`; โทเค็น operator ที่ถูกส่งต่อใด ๆ จะยังจำกัดอยู่ที่ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write` การตรวจสอบขอบเขต bootstrap จะมีคำนำหน้าตาม role ดังนั้น allowlist ของ operator นั้นจึงตอบสนองเฉพาะคำขอของ operator เท่านั้น; role ที่ไม่ใช่ operator ยังต้องมี scopes ภายใต้คำนำหน้า role ของตัวเอง

    หากอุปกรณ์ลองใหม่พร้อมรายละเอียด auth ที่เปลี่ยนไป (เช่น role/scopes/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` อื่น รัน `/pair pending` อีกครั้งก่อนอนุมัติ

    รายละเอียดเพิ่มเติม: [การจับคู่](/th/channels/pairing#pair-via-telegram-recommended-for-ios)

  </Accordion>

  <Accordion title="Inline buttons">
    กำหนดขอบเขตแป้นพิมพ์อินไลน์:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    การแทนที่รายบัญชี:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    ขอบเขต:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (ค่าเริ่มต้น)

    ค่าเดิม `capabilities: ["inlineButtons"]` แมปเป็น `inlineButtons: "all"`

    ตัวอย่าง action ของข้อความ:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    การคลิก callback จะถูกส่งให้อีเจนต์เป็นข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    action ของเครื่องมือ Telegram ได้แก่:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    action ข้อความของช่องทางเปิดเผย alias ที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    การควบคุม gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้)

    หมายเหตุ: `edit` และ `topic-create` เปิดใช้ตามค่าเริ่มต้นในปัจจุบัน และไม่มี toggle `channels.telegram.actions.*` แยกต่างหาก
    การส่งขณะรันไทม์ใช้สแนปช็อต config/secrets ที่ใช้งานอยู่ (startup/reload) ดังนั้นเส้นทาง action จะไม่ทำการ resolve SecretRef ซ้ำแบบเฉพาะกิจต่อการส่งแต่ละครั้ง

    ความหมายของการลบ reaction: [/tools/reactions](/th/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram รองรับแท็ก reply threading แบบชัดเจนในผลลัพธ์ที่สร้างขึ้น:

    - `[[reply_to_current]]` ตอบกลับข้อความที่ทริกเกอร์
    - `[[reply_to:<id>]]` ตอบกลับ ID ข้อความ Telegram ที่ระบุ

    `channels.telegram.replyToMode` ควบคุมการจัดการ:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`

    เมื่อเปิดใช้ reply threading และมีข้อความหรือคำบรรยาย Telegram ต้นฉบับ OpenClaw จะรวม excerpt คำพูดอ้างอิง Telegram แบบเนทีฟให้อัตโนมัติ Telegram จำกัดข้อความคำพูดอ้างอิงแบบเนทีฟไว้ที่ 1024 code units ของ UTF-16 ดังนั้นข้อความที่ยาวกว่าจะถูกอ้างอิงจากส่วนต้น และถอยกลับไปเป็นการตอบกลับธรรมดาหาก Telegram ปฏิเสธคำพูดอ้างอิง

    หมายเหตุ: `off` ปิดใช้ reply threading แบบนัย แท็ก `[[reply_to_*]]` ที่ระบุชัดเจนยังคงถูกใช้งาน

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    ซูเปอร์กรุ๊ปแบบฟอรัม:

    - คีย์เซสชันของหัวข้อจะต่อท้าย `:topic:<threadId>`
    - การตอบกลับและการพิมพ์จะกำหนดเป้าหมายไปยังเธรดหัวข้อ
    - เส้นทาง config ของหัวข้อ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของหัวข้อทั่วไป (`threadId=1`):

    - การส่งข้อความละเว้น `message_thread_id` (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - action การพิมพ์ยังคงรวม `message_thread_id`

    การสืบทอดของหัวข้อ: รายการหัวข้อจะสืบทอดการตั้งค่ากลุ่ม เว้นแต่ถูกแทนที่ (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` เป็นค่าเฉพาะหัวข้อเท่านั้น และไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม

    **การกำหนดเส้นทางอีเจนต์รายหัวข้อ**: แต่ละหัวข้อสามารถกำหนดเส้นทางไปยังอีเจนต์ที่แตกต่างกันได้โดยตั้งค่า `agentId` ใน config ของหัวข้อ วิธีนี้ทำให้แต่ละหัวข้อมีพื้นที่ทำงาน หน่วยความจำ และเซสชันที่แยกจากกัน ตัวอย่าง:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    จากนั้นแต่ละหัวข้อจะมีคีย์เซสชันของตัวเอง: `agent:zu:telegram:group:-1001234567890:topic:3`

    **การผูกหัวข้อ ACP แบบถาวร**: หัวข้อฟอรัมสามารถปักหมุดเซสชันฮาร์เนส ACP ผ่านการผูก ACP แบบมีชนิดที่ระดับบนสุด (`bindings[]` พร้อม `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ id ที่ระบุหัวข้อ เช่น `-1001234567890:topic:42`) ปัจจุบันจำกัดขอบเขตไว้ที่หัวข้อฟอรัมในกลุ่ม/ซูเปอร์กรุ๊ป ดู [ตัวแทน ACP](/th/tools/acp-agents)

    **การสร้าง ACP ที่ผูกกับเธรดจากแชต**: `/acp spawn <agent> --thread here|auto` จะผูกหัวข้อปัจจุบันกับเซสชัน ACP ใหม่ การติดตามผลจะถูกส่งไปที่นั่นโดยตรง OpenClaw จะปักหมุดการยืนยันการสร้างไว้ในหัวข้อนั้น ต้องให้ `channels.telegram.threadBindings.spawnSessions` เปิดใช้งานอยู่เสมอ (ค่าเริ่มต้น: `true`)

    บริบทเทมเพลตแสดง `MessageThreadId` และ `IsForum` แชต DM ที่มี `message_thread_id` จะคงการกำหนดเส้นทาง DM และเมทาดาทาการตอบกลับไว้ในเซสชันแบบแบนตามค่าเริ่มต้น โดยจะใช้คีย์เซสชันที่รู้จักเธรดเฉพาะเมื่อกำหนดค่าด้วย `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` หรือการกำหนดค่าหัวข้อที่ตรงกัน ใช้ `channels.telegram.dm.threadReplies` ระดับบนสุดสำหรับค่าเริ่มต้นของบัญชี หรือ `direct.<chatId>.threadReplies` สำหรับ DM หนึ่งรายการ

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยกความแตกต่างระหว่างบันทึกเสียงกับไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมแบบไฟล์เสียง
    - แท็ก `[[audio_as_voice]]` ในการตอบกลับของตัวแทนเพื่อบังคับให้ส่งเป็นบันทึกเสียง
    - ทรานสคริปต์บันทึกเสียงขาเข้าจะถูกจัดกรอบเป็นข้อความที่เครื่องสร้างขึ้นและไม่น่าเชื่อถือในบริบทของตัวแทน การตรวจจับการกล่าวถึงยังคงใช้ทรานสคริปต์ดิบ ดังนั้นข้อความเสียงที่ถูกควบคุมด้วยการกล่าวถึงจึงยังทำงานต่อไป

    ตัวอย่างแอ็กชันข้อความ:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### ข้อความวิดีโอ

    Telegram แยกความแตกต่างระหว่างไฟล์วิดีโอกับบันทึกวิดีโอ

    ตัวอย่างแอ็กชันข้อความ:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    บันทึกวิดีโอไม่รองรับคำบรรยาย ข้อความที่ระบุจะถูกส่งแยกต่างหาก

    ### สติกเกอร์

    การจัดการสติกเกอร์ขาเข้า:

    - WEBP แบบคงที่: ดาวน์โหลดและประมวลผลแล้ว (ตัวแทน `<media:sticker>`)
    - TGS แบบเคลื่อนไหว: ข้าม
    - WEBM วิดีโอ: ข้าม

    ฟิลด์บริบทสติกเกอร์:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ไฟล์แคชสติกเกอร์:

    - `~/.openclaw/telegram/sticker-cache.json`

    สติกเกอร์จะถูกอธิบายหนึ่งครั้ง (เมื่อเป็นไปได้) และแคชไว้เพื่อลดการเรียกวิชันซ้ำ

    เปิดใช้งานแอ็กชันสติกเกอร์:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    แอ็กชันส่งสติกเกอร์:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    ค้นหาสติกเกอร์ที่แคชไว้:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="การแจ้งเตือนปฏิกิริยา">
    ปฏิกิริยา Telegram จะเข้ามาเป็นอัปเดต `message_reaction` (แยกจากเพย์โหลดข้อความ)

    เมื่อเปิดใช้งาน OpenClaw จะจัดคิวเหตุการณ์ระบบ เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    การกำหนดค่า:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงปฏิกิริยาของผู้ใช้ต่อข้อความที่บอตส่งเท่านั้น (พยายามอย่างดีที่สุดผ่านแคชข้อความที่ส่งแล้ว)
    - เหตุการณ์ปฏิกิริยายังคงเคารพการควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ให้ ID เธรดในอัปเดตปฏิกิริยา
      - กลุ่มที่ไม่ใช่ฟอรัมจะกำหนดเส้นทางไปยังเซสชันแชตกลุ่ม
      - กลุ่มฟอรัมจะกำหนดเส้นทางไปยังเซสชันหัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อต้นทางที่แน่นอน

    `allowed_updates` สำหรับ polling/webhook จะรวม `message_reaction` โดยอัตโนมัติ

  </Accordion>

  <Accordion title="ปฏิกิริยา Ack">
    `ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการแก้ไขค่า:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - อีโมจิสำรองจากตัวตนของตัวแทน (`agents.list[].identity.emoji` มิฉะนั้นใช้ "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิ Unicode (เช่น "👀")
    - ใช้ `""` เพื่อปิดใช้งานปฏิกิริยาสำหรับช่องทางหรือบัญชี

  </Accordion>

  <Accordion title="การเขียนค่ากำหนดจากเหตุการณ์และคำสั่ง Telegram">
    การเขียนค่ากำหนดของช่องทางเปิดใช้งานตามค่าเริ่มต้น (`configWrites !== false`)

    การเขียนที่ทริกเกอร์โดย Telegram รวมถึง:

    - เหตุการณ์การย้ายกลุ่ม (`migrate_to_chat_id`) เพื่ออัปเดต `channels.telegram.groups`
    - `/config set` และ `/config unset` (ต้องเปิดใช้งานคำสั่ง)

    ปิดใช้งาน:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling เทียบกับ webhook">
    ค่าเริ่มต้นคือ long polling สำหรับโหมด webhook ให้ตั้งค่า `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; ตัวเลือกเสริมคือ `webhookPath`, `webhookHost`, `webhookPort` (ค่าเริ่มต้น `/telegram-webhook`, `127.0.0.1`, `8787`)

    ในโหมด long-polling OpenClaw จะบันทึก watermark การรีสตาร์ตอย่างถาวรเฉพาะหลังจากอัปเดตถูก dispatch สำเร็จแล้ว หากตัวจัดการล้มเหลว อัปเดตนั้นจะยัง retry ได้ในกระบวนการเดียวกันและจะไม่ถูกเขียนว่าเสร็จสมบูรณ์สำหรับการ dedupe หลังรีสตาร์ต

    ตัวรับฟังภายในเครื่องจะ bind กับ `127.0.0.1:8787` สำหรับ ingress สาธารณะ ให้ตั้ง reverse proxy ไว้หน้าพอร์ตภายในเครื่อง หรือกำหนด `webhookHost: "0.0.0.0"` อย่างตั้งใจ

    โหมด Webhook จะตรวจสอบ request guards, โทเค็นลับของ Telegram และเนื้อหา JSON ก่อนส่งคืน `200` ให้ Telegram
    จากนั้น OpenClaw จะประมวลผลอัปเดตแบบอะซิงโครนัสผ่านเลนบอตต่อแชต/ต่อหัวข้อชุดเดียวกับที่ใช้โดย long polling ดังนั้นรอบการทำงานของตัวแทนที่ช้าจะไม่รั้ง ACK การส่งมอบของ Telegram

  </Accordion>

  <Accordion title="ขีดจำกัด การลองใหม่ และเป้าหมาย CLI">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` จะให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนการแบ่งตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ขาเข้าและขาออก
    - `channels.telegram.mediaGroupFlushMs` (ค่าเริ่มต้น 500) ควบคุมระยะเวลาที่อัลบั้ม/กลุ่มสื่อของ Telegram จะถูกบัฟเฟอร์ก่อนที่ OpenClaw จะ dispatch เป็นข้อความขาเข้าหนึ่งรายการ เพิ่มค่านี้หากส่วนของอัลบั้มมาถึงช้า ลดค่านี้เพื่อลดเวลาแฝงของการตอบกลับอัลบั้ม
    - `channels.telegram.timeoutSeconds` override timeout ของไคลเอนต์ Telegram API (หากไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY) ไคลเอนต์บอตจะ clamp ค่าที่กำหนดไว้ให้ต่ำกว่า guard คำขอข้อความขาออก/typing 60 วินาที เพื่อให้ grammY ไม่ยกเลิกการส่งมอบการตอบกลับที่มองเห็นได้ก่อนที่ transport guard และ fallback ของ OpenClaw จะทำงาน Long polling ยังคงใช้ guard คำขอ `getUpdates` 45 วินาที เพื่อไม่ให้ idle polls ถูกปล่อยทิ้งไว้ไม่มีกำหนด
    - ค่าเริ่มต้นของ `channels.telegram.pollingStallThresholdMs` คือ `120000`; ปรับระหว่าง `30000` ถึง `600000` เฉพาะสำหรับการรีสตาร์ต polling-stall ที่เป็น false positive
    - ประวัติบริบทกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` ปิดใช้งาน
    - บริบทเสริมของ reply/quote/forward จะถูกทำให้เป็นปกติไว้ในหน้าต่างบริบทการสนทนาที่เลือกหนึ่งรายการเมื่อ gateway สังเกตเห็นข้อความแม่แล้ว แคชข้อความที่สังเกตเห็นจะถูกบันทึกถาวรไว้ข้าง store เซสชัน Telegram รวม `reply_to_message` แบบตื้นเพียงรายการเดียวในอัปเดต ดังนั้น chain ที่เก่ากว่าแคชจะถูกจำกัดไว้ที่เพย์โหลดอัปเดตปัจจุบันของ Telegram
    - allowlist ของ Telegram ใช้ควบคุมหลักว่าใครสามารถทริกเกอร์ตัวแทนได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบเต็ม
    - การควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - การกำหนดค่า `channels.telegram.retry` ใช้กับตัวช่วยส่ง Telegram (CLI/tools/actions) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้ การส่งมอบ final-reply ขาเข้ายังใช้ safe-send retry แบบมีขอบเขตสำหรับความล้มเหลวของ Telegram ก่อนเชื่อมต่อ แต่จะไม่ retry ซองเครือข่ายหลังส่งที่กำกวมซึ่งอาจทำให้ข้อความที่มองเห็นได้ซ้ำกัน

    เป้าหมายการส่งของ CLI และ message-tool สามารถเป็น chat ID แบบตัวเลข username หรือเป้าหมายหัวข้อฟอรัมได้:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    polls ของ Telegram ใช้ `openclaw message poll` และรองรับหัวข้อฟอรัม:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    แฟล็ก poll เฉพาะ Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` สำหรับหัวข้อฟอรัม (หรือใช้เป้าหมาย `:topic:`)

    การส่งของ Telegram ยังรองรับ:

    - `--presentation` พร้อมบล็อก `buttons` สำหรับ inline keyboards เมื่อ `channels.telegram.capabilities.inlineButtons` อนุญาต
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอการส่งมอบแบบปักหมุดเมื่อบอตสามารถปักหมุดในแชตนั้นได้
    - `--force-document` เพื่อส่งรูปภาพ, GIF และวิดีโอขาออกเป็นเอกสาร แทนการอัปโหลดแบบรูปภาพที่บีบอัด สื่อเคลื่อนไหว หรือวิดีโอ

    การควบคุมแอ็กชัน:

    - `channels.telegram.actions.sendMessage=false` ปิดใช้งานข้อความ Telegram ขาออก รวมถึง polls
    - `channels.telegram.actions.poll=false` ปิดใช้งานการสร้าง poll ของ Telegram โดยยังคงเปิดใช้งานการส่งปกติไว้

  </Accordion>

  <Accordion title="การอนุมัติ exec ใน Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถเลือกโพสต์ prompt ในแชตหรือหัวข้อต้นทางได้ ผู้อนุมัติต้องเป็น ID ผู้ใช้ Telegram แบบตัวเลข

    เส้นทางการกำหนดค่า:

    - `channels.telegram.execApprovals.enabled` (เปิดใช้งานอัตโนมัติเมื่อแก้ไขผู้อนุมัติได้อย่างน้อยหนึ่งราย)
    - `channels.telegram.execApprovals.approvers` (fallback ไปยัง ID เจ้าของแบบตัวเลขจาก `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` และ `defaultTo` ควบคุมว่าใครสามารถคุยกับบอตได้และบอตจะส่งการตอบกลับปกติไปที่ใด สิ่งเหล่านี้ไม่ได้ทำให้ใครเป็นผู้อนุมัติ exec การจับคู่ DM ที่อนุมัติครั้งแรกจะ bootstrap `commands.ownerAllowFrom` เมื่อยังไม่มีเจ้าของคำสั่ง ดังนั้นการตั้งค่าเจ้าของเดียวจึงยังทำงานได้โดยไม่ต้องทำ ID ซ้ำภายใต้ `execApprovals.approvers`

    การส่งมอบผ่านช่องทางจะแสดงข้อความคำสั่งในแชต เปิดใช้งาน `channel` หรือ `both` เฉพาะในกลุ่ม/หัวข้อที่เชื่อถือได้เท่านั้น เมื่อ prompt ไปถึงหัวข้อฟอรัม OpenClaw จะรักษาหัวข้อไว้สำหรับ prompt การอนุมัติและการติดตามผล การอนุมัติ exec จะหมดอายุหลัง 30 นาทีตามค่าเริ่มต้น

    ปุ่มอนุมัติแบบ inline ยังต้องให้ `channels.telegram.capabilities.inlineButtons` อนุญาตพื้นผิวเป้าหมาย (`dm`, `group` หรือ `all`) ID การอนุมัติที่ขึ้นต้นด้วย `plugin:` จะ resolve ผ่านการอนุมัติของ Plugin รายการอื่นจะ resolve ผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## การควบคุมการตอบกลับข้อผิดพลาด

เมื่อเอเจนต์พบข้อผิดพลาดด้านการนำส่งหรือผู้ให้บริการ Telegram สามารถตอบกลับด้วยข้อความข้อผิดพลาดหรือระงับไว้ได้ คีย์การกำหนดค่าสองรายการควบคุมพฤติกรรมนี้:

| คีย์                                 | ค่า               | ค่าเริ่มต้น | คำอธิบาย                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` ส่งข้อความข้อผิดพลาดที่เป็นมิตรไปยังแชต `silent` ระงับการตอบกลับข้อผิดพลาดทั้งหมด |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | เวลาขั้นต่ำระหว่างการตอบกลับข้อผิดพลาดไปยังแชตเดียวกัน ป้องกันสแปมข้อผิดพลาดระหว่างการขัดข้อง |

รองรับการแทนที่ค่าต่อบัญชี ต่อกลุ่ม และต่อหัวข้อ (ใช้การสืบทอดเดียวกับคีย์การกำหนดค่า Telegram อื่น ๆ)

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="บอทไม่ตอบสนองต่อข้อความกลุ่มที่ไม่ได้กล่าวถึง">

    - หาก `requireMention=false` โหมดความเป็นส่วนตัวของ Telegram ต้องอนุญาตให้มองเห็นได้เต็มรูปแบบ
      - BotFather: `/setprivacy` -> ปิดใช้งาน
      - จากนั้นนำบอทออกจากกลุ่มแล้วเพิ่มกลับเข้าไปใหม่
    - `openclaw channels status` เตือนเมื่อการกำหนดค่าคาดหวังข้อความกลุ่มที่ไม่ได้กล่าวถึง
    - `openclaw channels status --probe` สามารถตรวจสอบ ID กลุ่มแบบตัวเลขที่ระบุชัดเจนได้; wildcard `"*"` ไม่สามารถตรวจสอบสมาชิกภาพได้
    - การทดสอบเซสชันแบบเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอทไม่เห็นข้อความกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` กลุ่มต้องถูกระบุไว้ (หรือรวม `"*"`)
    - ตรวจสอบสมาชิกภาพของบอทในกลุ่ม
    - ตรวจสอบบันทึก: `openclaw logs --follow` เพื่อดูเหตุผลการข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานได้บางส่วนหรือไม่ทำงานเลย">

    - อนุญาตตัวตนผู้ส่งของคุณ (การจับคู่และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังคงมีผลแม้นโยบายกลุ่มจะเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนูเนทีฟมีรายการมากเกินไป; ลดคำสั่ง Plugin/skill/กำหนดเอง หรือปิดใช้งานเมนูเนทีฟ
    - การเรียกตอนเริ่มต้น `deleteMyCommands` / `setMyCommands` และการเรียกพิมพ์ `sendChatAction` มีขอบเขตจำกัดและลองใหม่หนึ่งครั้งผ่าน fallback การขนส่งของ Telegram เมื่อคำขอหมดเวลา ข้อผิดพลาดเครือข่าย/fetch ที่เกิดซ้ำมักบ่งชี้ปัญหาการเข้าถึง DNS/HTTPS ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="การเริ่มต้นรายงานโทเค็นที่ไม่ได้รับอนุญาต">

    - `getMe returned 401` คือความล้มเหลวในการยืนยันตัวตนของ Telegram สำหรับโทเค็นบอทที่กำหนดค่าไว้
    - คัดลอกใหม่หรือสร้างโทเค็นบอทใหม่ใน BotFather จากนั้นอัปเดต `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` หรือ `TELEGRAM_BOT_TOKEN` สำหรับบัญชีเริ่มต้น
    - `deleteWebhook 401 Unauthorized` ระหว่างการเริ่มต้นก็เป็นความล้มเหลวในการยืนยันตัวตนเช่นกัน; การถือว่าเป็น "ไม่มี webhook อยู่" จะเพียงเลื่อนความล้มเหลวจากโทเค็นที่ไม่ถูกต้องเดิมไปยังการเรียก API ภายหลังเท่านั้น

  </Accordion>

  <Accordion title="Polling หรือเครือข่ายไม่เสถียร">

    - Node 22+ + fetch/proxy แบบกำหนดเองอาจทำให้เกิดพฤติกรรมยกเลิกทันทีหากชนิด AbortSignal ไม่ตรงกัน
    - บางโฮสต์ resolve `api.telegram.org` เป็น IPv6 ก่อน; egress IPv6 ที่เสียอาจทำให้ Telegram API ล้มเหลวเป็นระยะ
    - หากบันทึกมี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!` ตอนนี้ OpenClaw จะลองใหม่โดยถือว่าเป็นข้อผิดพลาดเครือข่ายที่กู้คืนได้
    - ระหว่างการเริ่มต้น polling OpenClaw ใช้ probe `getMe` จากการเริ่มต้นที่สำเร็จซ้ำสำหรับ grammY เพื่อให้ runner ไม่จำเป็นต้องมี `getMe` ครั้งที่สองก่อน `getUpdates` ครั้งแรก
    - หาก `deleteWebhook` ล้มเหลวด้วยข้อผิดพลาดเครือข่ายชั่วคราวระหว่างการเริ่มต้น polling OpenClaw จะดำเนินต่อไปยัง long polling แทนการเรียก control-plane ก่อน poll อีกครั้ง Webhook ที่ยังทำงานอยู่จะแสดงเป็นข้อขัดแย้งของ `getUpdates`; จากนั้น OpenClaw จะสร้างการขนส่ง Telegram ใหม่และลองล้าง webhook อีกครั้ง
    - หากซ็อกเก็ต Telegram recycle ตามรอบคงที่สั้น ๆ ให้ตรวจสอบ `channels.telegram.timeoutSeconds` ที่ต่ำ; ไคลเอนต์บอทจะ clamp ค่าที่กำหนดไว้ต่ำกว่าตัวป้องกันคำขอขาออกและ `getUpdates` แต่รุ่นเก่าอาจยกเลิกทุก poll หรือทุกการตอบกลับเมื่อค่านี้ถูกตั้งต่ำกว่าตัวป้องกันเหล่านั้น
    - หากบันทึกมี `Polling stall detected` OpenClaw จะรีสตาร์ท polling และสร้างการขนส่ง Telegram ใหม่หลังจากไม่มี long-poll liveness ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีโดยค่าเริ่มต้น
    - `openclaw channels status --probe` และ `openclaw doctor` เตือนเมื่อบัญชี polling ที่กำลังทำงานยังทำ `getUpdates` ไม่สำเร็จหลังช่วงผ่อนผันการเริ่มต้น เมื่อบัญชี webhook ที่กำลังทำงานยังทำ `setWebhook` ไม่สำเร็จหลังช่วงผ่อนผันการเริ่มต้น หรือเมื่อกิจกรรมการขนส่ง polling ที่สำเร็จล่าสุดเก่าเกินไป
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่ทำงานนานยังปกติดีแต่โฮสต์ของคุณยังรายงานการรีสตาร์ทจาก polling-stall ผิดพลาด การ stall ที่เกิดซ้ำมักชี้ไปที่ปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่างโฮสต์กับ `api.telegram.org`
    - Telegram ยังเคารพ env proxy ของโปรเซสสำหรับการขนส่ง Bot API รวมถึง `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และรูปแบบตัวพิมพ์เล็กของค่าเหล่านั้น `NO_PROXY` / `no_proxy` ยังสามารถ bypass `api.telegram.org` ได้
    - หาก proxy ที่จัดการโดย OpenClaw ถูกกำหนดค่าผ่าน `OPENCLAW_PROXY_URL` สำหรับสภาพแวดล้อมบริการและไม่มี env proxy มาตรฐาน Telegram จะใช้ URL นั้นสำหรับการขนส่ง Bot API ด้วย
    - บนโฮสต์ VPS ที่มี egress/TLS โดยตรงไม่เสถียร ให้ route การเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ ใช้ค่าเริ่มต้น `autoSelectFamily=true` (ยกเว้น WSL2) ลำดับผลลัพธ์ DNS ของ Telegram เคารพ `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER` จากนั้น `channels.telegram.network.dnsResultOrder` จากนั้นค่าเริ่มต้นของโปรเซส เช่น `NODE_OPTIONS=--dns-result-order=ipv4first`; หากไม่มีค่าใดใช้ได้ Node 22+ จะ fallback เป็น `ipv4first`
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนด้วยพฤติกรรม IPv4-only ให้บังคับการเลือก family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบช่วง benchmark ของ RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาตแล้ว
      สำหรับการดาวน์โหลดสื่อ Telegram โดยค่าเริ่มต้น หาก fake-IP ที่เชื่อถือได้หรือ
      transparent proxy เขียน `api.telegram.org` ใหม่เป็นที่อยู่
      private/internal/special-use อื่นระหว่างการดาวน์โหลดสื่อ คุณสามารถเลือกใช้
      bypass เฉพาะ Telegram ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - การเลือกใช้งานเดียวกันมีให้ต่อบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หาก proxy ของคุณ resolve โฮสต์สื่อ Telegram เป็น `198.18.x.x` ให้ปิด
      flag อันตรายไว้ก่อน สื่อ Telegram อนุญาตช่วง benchmark RFC 2544
      อยู่แล้วโดยค่าเริ่มต้น

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` ทำให้การป้องกัน SSRF
      ของสื่อ Telegram อ่อนลง ใช้เฉพาะกับสภาพแวดล้อม proxy ที่เชื่อถือได้และควบคุมโดยผู้ปฏิบัติงาน
      เช่น Clash, Mihomo หรือการ route fake-IP ของ Surge เมื่อระบบเหล่านั้น
      สร้างคำตอบแบบ private หรือ special-use นอกช่วง benchmark RFC 2544
      ปิดไว้สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ
    </Warning>

    - การแทนที่จากสภาพแวดล้อม (ชั่วคราว):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - ตรวจสอบคำตอบ DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

ความช่วยเหลือเพิ่มเติม: [การแก้ปัญหา Channel](/th/channels/troubleshooting)

## เอกสารอ้างอิงการกำหนดค่า

เอกสารอ้างอิงหลัก: [เอกสารอ้างอิงการกำหนดค่า - Telegram](/th/gateway/config-channels#telegram)

<Accordion title="ฟิลด์ Telegram ที่มีสัญญาณสำคัญ">

- การเริ่มต้น/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; symlink จะถูกปฏิเสธ)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- การอนุมัติ exec: `execApprovals`, `accounts.*.execApprovals`
- คำสั่ง/เมนู: `commands.native`, `commands.nativeSkills`, `customCommands`
- เธรด/การตอบกลับ: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (ตัวอย่าง), `streaming.preview.toolProgress`, `blockStreaming`
- การจัดรูปแบบ/การนำส่ง: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- สื่อ/เครือข่าย: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- root API แบบกำหนดเอง: `apiRoot` (root ของ Bot API เท่านั้น; อย่ารวม `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions: `reactionNotifications`, `reactionLevel`
- ข้อผิดพลาด: `errorPolicy`, `errorCooldownMs`
- การเขียน/ประวัติ: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญของหลายบัญชี: เมื่อกำหนดค่า ID บัญชีสองรายการขึ้นไป ให้ตั้ง `channels.telegram.defaultAccount` (หรือรวม `channels.telegram.accounts.default`) เพื่อทำให้การ route ค่าเริ่มต้นชัดเจน มิฉะนั้น OpenClaw จะ fallback ไปยัง ID บัญชีแรกที่ normalize แล้ว และ `openclaw doctor` จะแจ้งเตือน บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom` แต่ไม่สืบทอดค่า `accounts.default.*`
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Telegram กับ gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรม allowlist ของกลุ่มและหัวข้อ
  </Card>
  <Card title="การ route Channel" icon="route" href="/th/channels/channel-routing">
    Route ข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการทำให้แข็งแกร่ง
  </Card>
  <Card title="การ route หลายเอเจนต์" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกลุ่มและหัวข้อไปยังเอเจนต์
  </Card>
  <Card title="การแก้ปัญหา" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้าม Channel
  </Card>
</CardGroup>
