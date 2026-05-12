---
read_when:
    - การทำงานกับฟีเจอร์ของ Telegram หรือ Webhook
summary: สถานะการรองรับบอต Telegram ความสามารถ และการกำหนดค่า
title: Telegram
x-i18n:
    generated_at: "2026-05-12T12:48:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 185ac6051d3da2037b2727a6afca98bef946bc62c3f2b22cc9afe9831669297b
    source_path: channels/telegram.md
    workflow: 16
---

พร้อมใช้งานจริงสำหรับ DM ของบอตและกลุ่มผ่าน grammY โหมดเริ่มต้นคือ long polling; โหมด Webhook เป็นตัวเลือก

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับ Telegram คือการจับคู่
  </Card>
  <Card title="การแก้ปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    คู่มือวินิจฉัยและซ่อมแซมข้ามช่องทาง
  </Card>
  <Card title="การกำหนดค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าช่องทางแบบเต็ม
  </Card>
</CardGroup>

## ตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="สร้างโทเค็นบอตใน BotFather">
    เปิด Telegram แล้วแชตกับ **@BotFather** (ยืนยันว่าแฮนเดิลเป็น `@BotFather` ตรงตามนี้)

    เรียกใช้ `/newbot` ทำตามพรอมป์ แล้วบันทึกโทเค็นไว้

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

    ค่าทดแทนจาก env: `TELEGRAM_BOT_TOKEN=...` (เฉพาะบัญชีเริ่มต้น)
    Telegram **ไม่** ใช้ `openclaw channels login telegram`; ให้กำหนดค่าโทเค็นใน config/env แล้วเริ่ม Gateway

  </Step>

  <Step title="เริ่ม Gateway และอนุมัติ DM แรก">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    โค้ดจับคู่หมดอายุหลังจาก 1 ชั่วโมง

  </Step>

  <Step title="เพิ่มบอตเข้ากลุ่ม">
    เพิ่มบอตเข้ากลุ่มของคุณ แล้วรับ ID ทั้งสองที่จำเป็นสำหรับการเข้าถึงกลุ่ม:

    - ID ผู้ใช้ Telegram ของคุณ ซึ่งใช้ใน `allowFrom` / `groupAllowFrom`
    - ID แชตกลุ่ม Telegram ซึ่งใช้เป็นคีย์ภายใต้ `channels.telegram.groups`

    สำหรับการตั้งค่าครั้งแรก ให้รับ ID แชตกลุ่มจาก `openclaw logs --follow`, บอต forwarded-ID หรือ Bot API `getUpdates` หลังจากอนุญาตกลุ่มแล้ว `/whoami@<bot_username>` สามารถยืนยัน ID ผู้ใช้และ ID กลุ่มได้

    ID ซูเปอร์กรุ๊ป Telegram แบบค่าลบที่ขึ้นต้นด้วย `-100` คือ ID แชตกลุ่ม ให้ใส่ไว้ใต้ `channels.telegram.groups` ไม่ใช่ใต้ `groupAllowFrom`

  </Step>
</Steps>

<Note>
ลำดับการระบุโทเค็นรับรู้ตามบัญชี ในทางปฏิบัติ ค่า config ชนะค่าทดแทนจาก env และ `TELEGRAM_BOT_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="โหมดความเป็นส่วนตัวและการมองเห็นในกลุ่ม">
    โดยค่าเริ่มต้น บอต Telegram ใช้ **โหมดความเป็นส่วนตัว** ซึ่งจำกัดข้อความกลุ่มที่บอตได้รับ

    หากบอตต้องเห็นข้อความกลุ่มทั้งหมด ให้ทำอย่างใดอย่างหนึ่ง:

    - ปิดโหมดความเป็นส่วนตัวผ่าน `/setprivacy` หรือ
    - ทำให้บอตเป็นผู้ดูแลกลุ่ม

    เมื่อสลับโหมดความเป็นส่วนตัว ให้ลบแล้วเพิ่มบอตกลับเข้าไปในแต่ละกลุ่ม เพื่อให้ Telegram นำการเปลี่ยนแปลงไปใช้

  </Accordion>

  <Accordion title="สิทธิ์ของกลุ่ม">
    สถานะผู้ดูแลควบคุมใน settings ของกลุ่ม Telegram

    บอตที่เป็นผู้ดูแลจะได้รับข้อความกลุ่มทั้งหมด ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มแบบเปิดตลอดเวลา

  </Accordion>

  <Accordion title="ตัวสลับ BotFather ที่มีประโยชน์">

    - `/setjoingroups` เพื่ออนุญาต/ปฏิเสธการเพิ่มเข้ากลุ่ม
    - `/setprivacy` สำหรับพฤติกรรมการมองเห็นในกลุ่ม

  </Accordion>
</AccordionGroup>

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.telegram.dmPolicy` ควบคุมการเข้าถึงข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist` (ต้องมี ID ผู้ส่งอย่างน้อยหนึ่งรายการใน `allowFrom`)
    - `open` (ต้องให้ `allowFrom` รวม `"*"`)
    - `disabled`

    `dmPolicy: "open"` พร้อม `allowFrom: ["*"]` ทำให้บัญชี Telegram ใดก็ตามที่พบหรือเดาชื่อผู้ใช้ของบอตได้สามารถสั่งงานบอตได้ ใช้เฉพาะกับบอตสาธารณะที่ตั้งใจให้เปิดใช้ โดยมีเครื่องมือที่จำกัดอย่างเข้มงวด; บอตเจ้าของคนเดียวควรใช้ `allowlist` พร้อม ID ผู้ใช้แบบตัวเลข

    `channels.telegram.allowFrom` รับ ID ผู้ใช้ Telegram แบบตัวเลข พรีฟิกซ์ `telegram:` / `tg:` ยอมรับได้และจะถูกทำให้เป็นรูปแบบมาตรฐาน
    ใน config หลายบัญชี ค่า `channels.telegram.allowFrom` ระดับบนที่เข้มงวดจะถูกปฏิบัติเป็นขอบเขตความปลอดภัย: รายการ `allowFrom: ["*"]` ระดับบัญชีจะไม่ทำให้บัญชีนั้นเป็นสาธารณะ เว้นแต่ allowlist ของบัญชีที่มีผลหลังรวมแล้วยังคงมี wildcard อย่างชัดเจน
    `dmPolicy: "allowlist"` พร้อม `allowFrom` ว่างจะบล็อก DM ทั้งหมดและถูกปฏิเสธโดยการตรวจสอบ config
    การตั้งค่าจะถามเฉพาะ ID ผู้ใช้แบบตัวเลข
    หากคุณอัปเกรดแล้ว config ของคุณมีรายการ allowlist แบบ `@username` ให้เรียกใช้ `openclaw doctor --fix` เพื่อ resolve รายการเหล่านั้น (พยายามให้ดีที่สุด; ต้องใช้โทเค็นบอต Telegram)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์ allowlist ของ pairing-store, `openclaw doctor --fix` สามารถกู้รายการเข้าสู่ `channels.telegram.allowFrom` ในโฟลว์ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID ที่ระบุชัดเจน)

    สำหรับบอตเจ้าของคนเดียว ให้เลือกใช้ `dmPolicy: "allowlist"` พร้อม ID `allowFrom` แบบตัวเลขที่ระบุชัดเจน เพื่อให้นโยบายการเข้าถึงคงทนใน config (แทนการขึ้นกับการอนุมัติการจับคู่ก่อนหน้า)

    ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่ได้หมายความว่า "ผู้ส่งรายนี้ได้รับอนุญาตทุกที่"
    การจับคู่ให้สิทธิ์เข้าถึง DM หากยังไม่มีเจ้าของคำสั่ง การจับคู่ที่อนุมัติครั้งแรกยังตั้งค่า `commands.ownerAllowFrom` เพื่อให้คำสั่งเฉพาะเจ้าของและการอนุมัติ exec มีบัญชีผู้ปฏิบัติการที่ชัดเจน
    การอนุญาตผู้ส่งในกลุ่มยังมาจาก allowlist ใน config ที่ระบุชัดเจน
    หากคุณต้องการ "ฉันได้รับอนุญาตครั้งเดียว แล้วทั้ง DM และคำสั่งกลุ่มใช้งานได้" ให้ใส่ ID ผู้ใช้ Telegram แบบตัวเลขของคุณใน `channels.telegram.allowFrom`; สำหรับคำสั่งเฉพาะเจ้าของ ให้ตรวจสอบว่า `commands.ownerAllowFrom` มี `telegram:<your user id>`

    ### การหา ID ผู้ใช้ Telegram ของคุณ

    วิธีที่ปลอดภัยกว่า (ไม่มีบอตบุคคลที่สาม):

    1. DM ไปยังบอตของคุณ
    2. เรียกใช้ `openclaw logs --follow`
    3. อ่าน `from.id`

    วิธี Bot API อย่างเป็นทางการ:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="นโยบายกลุ่มและ allowlist">
    การควบคุมสองอย่างทำงานร่วมกัน:

    1. **กลุ่มใดได้รับอนุญาต** (`channels.telegram.groups`)
       - ไม่มี config `groups`:
         - พร้อม `groupPolicy: "open"`: กลุ่มใดก็ผ่านการตรวจสอบ ID กลุ่มได้
         - พร้อม `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการ `groups` (หรือ `"*"`)
       - กำหนดค่า `groups` แล้ว: ทำหน้าที่เป็น allowlist (ID ที่ระบุชัดเจนหรือ `"*"`)

    2. **ผู้ส่งใดได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่า Telegram จะย้อนกลับไปใช้ `allowFrom`
    รายการ `groupAllowFrom` ควรเป็น ID ผู้ใช้ Telegram แบบตัวเลข (พรีฟิกซ์ `telegram:` / `tg:` จะถูกทำให้เป็นรูปแบบมาตรฐาน)
    อย่าใส่ ID แชตกลุ่มหรือซูเปอร์กรุ๊ป Telegram ใน `groupAllowFrom` ID แชตค่าลบต้องอยู่ใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเว้นสำหรับการอนุญาตผู้ส่ง
    ขอบเขตความปลอดภัย (`2026.2.25+`): การตรวจสิทธิ์ผู้ส่งในกลุ่ม **ไม่** สืบทอดการอนุมัติจาก DM pairing-store
    การจับคู่ยังคงเป็นเฉพาะ DM สำหรับกลุ่ม ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` รายกลุ่ม/รายหัวข้อ
    หากไม่ได้ตั้งค่า `groupAllowFrom` Telegram จะย้อนกลับไปใช้ config `allowFrom` ไม่ใช่ pairing store
    รูปแบบที่ใช้งานได้จริงสำหรับบอตเจ้าของคนเดียว: ตั้งค่า ID ผู้ใช้ของคุณใน `channels.telegram.allowFrom`, ปล่อย `groupAllowFrom` ให้ไม่ตั้งค่า และอนุญาตกลุ่มเป้าหมายภายใต้ `channels.telegram.groups`
    หมายเหตุ runtime: หาก `channels.telegram` หายไปทั้งหมด runtime จะใช้ค่าเริ่มต้นแบบ fail-closed `groupPolicy="allowlist"` เว้นแต่จะตั้งค่า `channels.defaults.groupPolicy` อย่างชัดเจน

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

    ทดสอบจากกลุ่มด้วย `@<bot_username> ping` ข้อความกลุ่มธรรมดาจะไม่ trigger บอตขณะ `requireMention: true`

    ตัวอย่าง: อนุญาตสมาชิกคนใดก็ได้ในกลุ่มที่ระบุหนึ่งกลุ่ม:

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

    ตัวอย่าง: อนุญาตเฉพาะผู้ใช้ที่ระบุในกลุ่มที่ระบุหนึ่งกลุ่ม:

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

      - ใส่ ID แชตกลุ่มหรือซูเปอร์กรุ๊ป Telegram แบบค่าลบ เช่น `-1001234567890` ไว้ใต้ `channels.telegram.groups`
      - ใส่ ID ผู้ใช้ Telegram เช่น `8734062810` ไว้ใต้ `groupAllowFrom` เมื่อคุณต้องการจำกัดว่าคนใดในกลุ่มที่อนุญาตสามารถ trigger บอตได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกคนใดก็ได้ของกลุ่มที่อนุญาตสามารถคุยกับบอตได้

    </Warning>

  </Tab>

  <Tab title="พฤติกรรมการ mention">
    การตอบกลับในกลุ่มต้องมี mention โดยค่าเริ่มต้น

    mention อาจมาจาก:

    - mention แบบ native `@botusername` หรือ
    - รูปแบบ mention ใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    ตัวสลับคำสั่งระดับ session:

    - `/activation always`
    - `/activation mention`

    สิ่งเหล่านี้อัปเดตเฉพาะสถานะ session ใช้ config เพื่อให้คงอยู่ถาวร

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

    - forward ข้อความกลุ่มไปยัง `@userinfobot` / `@getidsbot`
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจสอบ Bot API `getUpdates`
    - หลังจากอนุญาตกลุ่มแล้ว ให้เรียกใช้ `/whoami@<bot_username>` หากเปิดใช้คำสั่ง native

  </Tab>
</Tabs>

## พฤติกรรม runtime

- Telegram เป็นของกระบวนการ Gateway
- การ routing เป็นแบบกำหนดแน่นอน: ข้อความขาเข้า Telegram จะตอบกลับไปยัง Telegram (โมเดลไม่ได้เลือกช่องทาง)
- ข้อความขาเข้าจะถูก normalize เป็น envelope ช่องทางร่วม พร้อม metadata การตอบกลับ, media placeholders และบริบท reply-chain ที่บันทึกถาวรสำหรับการตอบกลับ Telegram ที่ Gateway สังเกตเห็น
- session กลุ่มถูกแยกตาม ID กลุ่ม หัวข้อ forum จะเติม `:topic:<threadId>` เพื่อแยกหัวข้อออกจากกัน
- ข้อความ DM สามารถมี `message_thread_id`; OpenClaw รักษา ID เธรดไว้สำหรับการตอบกลับ แต่คง DM ไว้ใน session แบบ flat โดยค่าเริ่มต้น กำหนดค่า `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` หรือ config หัวข้อที่ตรงกัน เมื่อคุณตั้งใจต้องการแยก session หัวข้อของ DM
- Long polling ใช้ grammY runner พร้อมการจัดลำดับต่อแชต/ต่อเธรด concurrency ของ runner sink โดยรวมใช้ `agents.defaults.maxConcurrent`
- Long polling ถูกป้องกันภายในแต่ละกระบวนการ Gateway เพื่อให้มี poller ที่ active เพียงหนึ่งตัวเท่านั้นที่ใช้โทเค็นบอตได้ในแต่ละครั้ง หากคุณยังเห็นความขัดแย้ง `getUpdates` 409 แสดงว่า Gateway ของ OpenClaw อีกตัว สคริปต์ หรือ poller ภายนอกน่าจะกำลังใช้โทเค็นเดียวกัน
- การ restart ของ watchdog สำหรับ long-polling จะ trigger หลังจากไม่มี liveness ของ `getUpdates` ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีโดยค่าเริ่มต้น เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อ deployment ของคุณยังเห็นการ restart จาก polling-stall แบบ false ระหว่างงานที่ใช้เวลานาน ค่านี้มีหน่วยเป็นมิลลิวินาทีและอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับ override ต่อบัญชี
- Telegram Bot API ไม่รองรับ read-receipt (`sendReadReceipts` ไม่ใช้กับกรณีนี้)

## อ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="พรีวิวสตรีมสด (การแก้ไขข้อความ)">
    OpenClaw สามารถสตรีมคำตอบบางส่วนแบบเรียลไทม์ได้:

    - แชตโดยตรง: ข้อความพรีวิว + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความพรีวิว + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` คือ `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - `progress` เก็บร่างสถานะที่แก้ไขได้ไว้หนึ่งรายการสำหรับความคืบหน้าของเครื่องมือ ล้างเมื่อเสร็จสมบูรณ์ และส่งคำตอบสุดท้ายเป็นข้อความปกติ
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความตัวอย่างที่แก้ไขแล้วข้อความเดิมซ้ำหรือไม่ (ค่าเริ่มต้น: `true` เมื่อการสตรีมตัวอย่างเปิดใช้งานอยู่)
    - `streaming.preview.commandText` ควบคุมรายละเอียดคำสั่ง/การดำเนินการภายในบรรทัดความคืบหน้าของเครื่องมือเหล่านั้น: `raw` (ค่าเริ่มต้น, รักษาพฤติกรรมที่เผยแพร่แล้วไว้) หรือ `status` (ป้ายกำกับเครื่องมือเท่านั้น)
    - ตรวจพบค่าเดิม `channels.telegram.streamMode` และค่า boolean ของ `streaming`; รัน `openclaw doctor --fix` เพื่อย้ายค่าเหล่านั้นไปยัง `channels.telegram.streaming.mode`

    การอัปเดตตัวอย่างความคืบหน้าของเครื่องมือคือบรรทัดสถานะสั้น ๆ ที่แสดงระหว่างที่เครื่องมือทำงาน เช่น การดำเนินการคำสั่ง การอ่านไฟล์ การอัปเดตแผน หรือสรุปแพตช์ Telegram เปิดใช้งานสิ่งเหล่านี้เป็นค่าเริ่มต้นเพื่อให้ตรงกับพฤติกรรม OpenClaw ที่เผยแพร่ตั้งแต่ `v2026.4.22` และหลังจากนั้น หากต้องการเก็บตัวอย่างที่แก้ไขได้สำหรับข้อความคำตอบแต่ซ่อนบรรทัดความคืบหน้าของเครื่องมือ ให้ตั้งค่า:

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

    หากต้องการให้ความคืบหน้าของเครื่องมือยังมองเห็นได้แต่ซ่อนข้อความคำสั่ง/การดำเนินการ ให้ตั้งค่า:

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

    ใช้โหมด `progress` เมื่อคุณต้องการความคืบหน้าของเครื่องมือที่มองเห็นได้โดยไม่แก้ไขคำตอบสุดท้ายลงในข้อความเดียวกันนั้น วางนโยบายข้อความคำสั่งไว้ใต้ `streaming.progress`:

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

    ใช้ `streaming.mode: "off"` เฉพาะเมื่อคุณต้องการส่งเฉพาะผลลัพธ์สุดท้าย: การแก้ไขตัวอย่างของ Telegram จะถูกปิดใช้งาน และการพูดคุยทั่วไปของเครื่องมือ/ความคืบหน้าจะถูกระงับแทนที่จะส่งเป็นข้อความสถานะแยกต่างหาก พรอมป์การอนุมัติ payload สื่อ และข้อผิดพลาดยังคงถูกส่งผ่านการส่งผลลัพธ์สุดท้ายตามปกติ ใช้ `streaming.preview.toolProgress: false` เมื่อคุณต้องการเก็บเฉพาะการแก้ไขตัวอย่างคำตอบไว้พร้อมกับซ่อนบรรทัดสถานะความคืบหน้าของเครื่องมือ

    <Note>
      การตอบกลับแบบอ้างอิงที่เลือกของ Telegram เป็นข้อยกเว้น เมื่อ `replyToMode` เป็น `"first"`, `"all"` หรือ `"batched"` และข้อความขาเข้ามีข้อความอ้างอิงที่เลือกไว้ OpenClaw จะส่งคำตอบสุดท้ายผ่านเส้นทางการตอบกลับแบบอ้างอิงดั้งเดิมของ Telegram แทนการแก้ไขตัวอย่างคำตอบ ดังนั้น `streaming.preview.toolProgress` จึงไม่สามารถแสดงบรรทัดสถานะสั้น ๆ สำหรับรอบนั้นได้ การตอบกลับข้อความปัจจุบันที่ไม่มีข้อความอ้างอิงที่เลือกไว้ยังคงใช้การสตรีมตัวอย่าง ตั้งค่า `replyToMode: "off"` เมื่อการมองเห็นความคืบหน้าของเครื่องมือสำคัญกว่าการตอบกลับแบบอ้างอิงดั้งเดิม หรือตั้งค่า `streaming.preview.toolProgress: false` เพื่อยอมรับข้อแลกเปลี่ยนนี้
    </Note>

    สำหรับการตอบกลับแบบข้อความเท่านั้น:

    - ตัวอย่างแบบสั้นใน DM/กลุ่ม/หัวข้อ: OpenClaw เก็บข้อความตัวอย่างเดิมไว้และทำการแก้ไขสุดท้ายในตำแหน่งเดิม
    - ผลลัพธ์สุดท้ายแบบข้อความยาวที่แยกเป็นหลายข้อความ Telegram จะใช้ตัวอย่างที่มีอยู่เป็นส่วนสุดท้ายส่วนแรกเมื่อทำได้ แล้วส่งเฉพาะส่วนที่เหลือ
    - ผลลัพธ์สุดท้ายในโหมดความคืบหน้าจะล้างร่างสถานะและใช้การส่งผลลัพธ์สุดท้ายตามปกติแทนการแก้ไขร่างให้เป็นคำตอบ
    - หากการแก้ไขสุดท้ายล้มเหลวก่อนยืนยันข้อความที่เสร็จสมบูรณ์ OpenClaw จะใช้การส่งผลลัพธ์สุดท้ายตามปกติและล้างตัวอย่างที่ค้างอยู่

    สำหรับการตอบกลับที่ซับซ้อน (เช่น payload สื่อ) OpenClaw จะถอยกลับไปใช้การส่งผลลัพธ์สุดท้ายตามปกติแล้วล้างข้อความตัวอย่าง

    การสตรีมตัวอย่างแยกจากการสตรีมแบบบล็อก เมื่อเปิดใช้งานการสตรีมแบบบล็อกสำหรับ Telegram อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

    สตรีมเหตุผลเฉพาะ Telegram:

    - `/reasoning stream` ส่งเหตุผลไปยังตัวอย่างแบบสดระหว่างการสร้าง
    - ตัวอย่างเหตุผลจะถูกลบหลังการส่งผลลัพธ์สุดท้าย; ใช้ `/reasoning on` เมื่อต้องการให้เหตุผลยังคงมองเห็นได้
    - คำตอบสุดท้ายถูกส่งโดยไม่มีข้อความเหตุผล

  </Accordion>

  <Accordion title="การจัดรูปแบบและ HTML fallback">
    ข้อความขาออกใช้ Telegram `parse_mode: "HTML"`

    - ข้อความแบบคล้าย Markdown จะถูกเรนเดอร์เป็น HTML ที่ปลอดภัยสำหรับ Telegram
    - แท็ก HTML ที่ Telegram รองรับจะถูกรักษาไว้; HTML ที่ไม่รองรับจะถูก escape
    - หาก Telegram ปฏิเสธ HTML ที่แยกวิเคราะห์แล้ว OpenClaw จะลองใหม่เป็นข้อความธรรมดา

    ตัวอย่างลิงก์เปิดใช้งานเป็นค่าเริ่มต้นและปิดได้ด้วย `channels.telegram.linkPreview: false`

  </Accordion>

  <Accordion title="คำสั่งดั้งเดิมและคำสั่งกำหนดเอง">
    การลงทะเบียนเมนูคำสั่งของ Telegram ถูกจัดการตอนเริ่มต้นด้วย `setMyCommands`

    ค่าเริ่มต้นของคำสั่งดั้งเดิม:

    - `commands.native: "auto"` เปิดใช้งานคำสั่งดั้งเดิมสำหรับ Telegram

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

    - ชื่อจะถูกทำให้เป็นรูปแบบปกติ (ลบ `/` นำหน้า, แปลงเป็นตัวพิมพ์เล็ก)
    - รูปแบบที่ถูกต้อง: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งกำหนดเองไม่สามารถแทนที่คำสั่งดั้งเดิมได้
    - รายการที่ขัดแย้ง/ซ้ำจะถูกข้ามและบันทึกในล็อก

    หมายเหตุ:

    - คำสั่งกำหนดเองเป็นเพียงรายการเมนู; ไม่ได้ใช้งานพฤติกรรมโดยอัตโนมัติ
    - คำสั่ง Plugin/Skills ยังสามารถทำงานได้เมื่อพิมพ์ แม้จะไม่แสดงในเมนู Telegram

    หากปิดใช้งานคำสั่งดั้งเดิม คำสั่งในตัวจะถูกลบออก คำสั่งกำหนดเอง/Plugin อาจยังลงทะเบียนได้หากกำหนดค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังล้นหลังจากตัดทอนแล้ว; ลดจำนวนคำสั่ง Plugin/Skills/กำหนดเอง หรือปิดใช้งาน `channels.telegram.commands.native`
    - `deleteWebhook`, `deleteMyCommands` หรือ `setMyCommands` ล้มเหลวด้วย `404: Not Found` ขณะที่คำสั่ง curl ไปยัง Bot API โดยตรงทำงานได้ อาจหมายความว่า `channels.telegram.apiRoot` ถูกตั้งเป็น endpoint `/bot<TOKEN>` แบบเต็ม `apiRoot` ต้องเป็นเฉพาะ root ของ Bot API เท่านั้น และ `openclaw doctor --fix` จะลบ `/bot<TOKEN>` ต่อท้ายที่ตั้งโดยไม่ได้ตั้งใจ
    - `getMe returned 401` หมายความว่า Telegram ปฏิเสธโทเคนบอตที่กำหนดค่าไว้ อัปเดต `botToken`, `tokenFile` หรือ `TELEGRAM_BOT_TOKEN` ด้วยโทเคน BotFather ปัจจุบัน; OpenClaw จะหยุดก่อน polling ดังนั้นสิ่งนี้จะไม่ถูกรายงานเป็นความล้มเหลวในการล้าง Webhook
    - `setMyCommands failed` พร้อมข้อผิดพลาดเครือข่าย/fetch มักหมายความว่า DNS/HTTPS ขาออกไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งจับคู่อุปกรณ์ (Plugin `device-pair`)

    เมื่อมีการติดตั้ง Plugin `device-pair`:

    1. `/pair` สร้างโค้ดตั้งค่า
    2. วางโค้ดในแอป iOS
    3. `/pair pending` แสดงรายการคำขอที่รอดำเนินการ (รวม role/scopes)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบระบุชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    โค้ดตั้งค่ามีโทเคน bootstrap อายุสั้น การส่งต่อ bootstrap ในตัวเก็บโทเคน node หลักไว้ที่ `scopes: []`; โทเคน operator ที่ส่งต่อใด ๆ จะถูกจำกัดไว้ที่ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write` การตรวจสอบ scope ของ bootstrap มีคำนำหน้า role ดังนั้น allowlist ของ operator นั้นจึงตอบสนองเฉพาะคำขอ operator; role ที่ไม่ใช่ operator ยังต้องมี scope ภายใต้คำนำหน้า role ของตนเอง

    หากอุปกรณ์ลองใหม่พร้อมรายละเอียด auth ที่เปลี่ยนไป (เช่น role/scopes/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` คนละค่า รัน `/pair pending` อีกครั้งก่อนอนุมัติ

    รายละเอียดเพิ่มเติม: [การจับคู่](/th/channels/pairing#pair-via-telegram-recommended-for-ios)

  </Accordion>

  <Accordion title="ปุ่มอินไลน์">
    กำหนดค่า scope ของแป้นพิมพ์อินไลน์:

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

    การแทนที่ต่อบัญชี:

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

    Scopes:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (ค่าเริ่มต้น)

    ค่าเดิม `capabilities: ["inlineButtons"]` แมปไปยัง `inlineButtons: "all"`

    ตัวอย่างการกระทำกับข้อความ:

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

    การคลิก callback จะถูกส่งไปยัง agent เป็นข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="การกระทำกับข้อความ Telegram สำหรับ agent และ automation">
    การกระทำของเครื่องมือ Telegram ได้แก่:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    การกระทำของข้อความช่องทางเปิดเผย alias ที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    ตัวควบคุมการ gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้งาน)

    หมายเหตุ: ปัจจุบัน `edit` และ `topic-create` เปิดใช้งานเป็นค่าเริ่มต้นและไม่มี toggle `channels.telegram.actions.*` แยกต่างหาก
    การส่งขณะรันไทม์ใช้ snapshot ของ config/secrets ที่ใช้งานอยู่ (startup/reload) ดังนั้นเส้นทางการกระทำจะไม่ทำการ resolve SecretRef เฉพาะกิจซ้ำต่อการส่งแต่ละครั้ง

    ความหมายของการลบ reaction: [/tools/reactions](/th/tools/reactions)

  </Accordion>

  <Accordion title="แท็กเธรดการตอบกลับ">
    Telegram รองรับแท็กเธรดการตอบกลับแบบชัดเจนในเอาต์พุตที่สร้างขึ้น:

    - `[[reply_to_current]]` ตอบกลับข้อความที่ทริกเกอร์
    - `[[reply_to:<id>]]` ตอบกลับ ID ข้อความ Telegram ที่ระบุ

    `channels.telegram.replyToMode` ควบคุมการจัดการ:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`

    เมื่อเปิดใช้งานเธรดการตอบกลับและมีข้อความหรือคำบรรยาย Telegram ดั้งเดิมพร้อมใช้งาน OpenClaw จะรวมข้อความตัดตอนอ้างอิงแบบดั้งเดิมของ Telegram โดยอัตโนมัติ Telegram จำกัดข้อความอ้างอิงดั้งเดิมไว้ที่ 1024 หน่วยโค้ด UTF-16 ดังนั้นข้อความที่ยาวกว่าจะถูกอ้างอิงจากจุดเริ่มต้นและถอยกลับไปเป็นการตอบกลับแบบธรรมดาหาก Telegram ปฏิเสธการอ้างอิง

    หมายเหตุ: `off` ปิดใช้งานเธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงถูกใช้งาน

  </Accordion>

  <Accordion title="หัวข้อฟอรัมและพฤติกรรมเธรด">
    ซูเปอร์กรุ๊ปแบบฟอรัม:

    - คีย์เซสชันหัวข้อเติม `:topic:<threadId>` ต่อท้าย
    - การตอบกลับและการพิมพ์กำหนดเป้าหมายไปยังเธรดหัวข้อ
    - เส้นทาง config ของหัวข้อ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของหัวข้อทั่วไป (`threadId=1`):

    - การส่งข้อความละเว้น `message_thread_id` (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - การกระทำการพิมพ์ยังคงรวม `message_thread_id`

    การสืบทอดหัวข้อ: รายการหัวข้อสืบทอดการตั้งค่ากลุ่ม เว้นแต่จะถูกแทนที่ (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` เป็นเฉพาะหัวข้อและไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม

    **การกำหนดเส้นทาง agent ต่อหัวข้อ**: แต่ละหัวข้อสามารถกำหนดเส้นทางไปยัง agent คนละตัวได้โดยตั้งค่า `agentId` ใน config ของหัวข้อ สิ่งนี้ทำให้แต่ละหัวข้อมี workspace, memory และ session ที่แยกจากกันเป็นของตัวเอง ตัวอย่าง:

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

    **การผูกหัวข้อ ACP แบบถาวร**: หัวข้อฟอรัมสามารถปักหมุดเซสชัน ACP harness ผ่านการผูก ACP แบบมีชนิดที่ระดับบนสุด (`bindings[]` ที่มี `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ id ที่ระบุหัวข้อ เช่น `-1001234567890:topic:42`) ปัจจุบันจำกัดขอบเขตไว้ที่หัวข้อฟอรัมในกลุ่ม/ซูเปอร์กรุ๊ป ดู [Agent ACP](/th/tools/acp-agents)

    **การสร้าง ACP ที่ผูกกับเธรดจากแชต**: `/acp spawn <agent> --thread here|auto` จะผูกหัวข้อปัจจุบันกับเซสชัน ACP ใหม่ การติดตามผลจะถูกกำหนดเส้นทางไปที่นั่นโดยตรง OpenClaw จะปักหมุดการยืนยันการสร้างไว้ในหัวข้อ ต้องเปิดใช้ `channels.telegram.threadBindings.spawnSessions` อยู่เสมอ (ค่าเริ่มต้น: `true`)

    บริบทเทมเพลตเปิดเผย `MessageThreadId` และ `IsForum` แชต DM ที่มี `message_thread_id` จะยังคงใช้การกำหนดเส้นทาง DM และเมทาดาทาการตอบกลับบนเซสชันแบบแบนตามค่าเริ่มต้น และจะใช้คีย์เซสชันที่รู้จักเธรดเฉพาะเมื่อกำหนดค่าด้วย `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` หรือการกำหนดค่าหัวข้อที่ตรงกัน ใช้ `channels.telegram.dm.threadReplies` ระดับบนสุดสำหรับค่าเริ่มต้นของบัญชี หรือ `direct.<chatId>.threadReplies` สำหรับ DM หนึ่งรายการ

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### ข้อความเสียง

    Telegram แยกความแตกต่างระหว่างบันทึกเสียงกับไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมแบบไฟล์เสียง
    - ใส่แท็ก `[[audio_as_voice]]` ในคำตอบของ agent เพื่อบังคับส่งเป็นบันทึกเสียง
    - ข้อความถอดเสียงของบันทึกเสียงขาเข้าจะถูกจัดกรอบเป็นข้อความที่สร้างโดยเครื่องและไม่น่าเชื่อถือในบริบทของ agent; การตรวจจับการกล่าวถึงยังคงใช้ข้อความถอดเสียงดิบ ดังนั้นข้อความเสียงที่ถูกจำกัดด้วยการกล่าวถึงยังคงทำงานต่อไป

    ตัวอย่าง message action:

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

    ตัวอย่าง message action:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    บันทึกวิดีโอไม่รองรับคำบรรยาย ข้อความที่ให้มาจะถูกส่งแยกต่างหาก

    ### สติกเกอร์

    การจัดการสติกเกอร์ขาเข้า:

    - WEBP แบบคงที่: ดาวน์โหลดและประมวลผลแล้ว (ตัวยึดตำแหน่ง `<media:sticker>`)
    - TGS แบบเคลื่อนไหว: ข้าม
    - WEBM แบบวิดีโอ: ข้าม

    ฟิลด์บริบทสติกเกอร์:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ไฟล์แคชสติกเกอร์:

    - `~/.openclaw/telegram/sticker-cache.json`

    สติกเกอร์จะถูกอธิบายหนึ่งครั้ง (เมื่อเป็นไปได้) และแคชไว้เพื่อลดการเรียก vision ซ้ำ

    เปิดใช้ action สติกเกอร์:

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

    action ส่งสติกเกอร์:

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

  <Accordion title="Reaction notifications">
    รีแอ็กชันของ Telegram จะเข้ามาเป็นการอัปเดต `message_reaction` (แยกจากเพย์โหลดข้อความ)

    เมื่อเปิดใช้ OpenClaw จะจัดคิวอีเวนต์ระบบ เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    การกำหนดค่า:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงเฉพาะรีแอ็กชันของผู้ใช้ต่อข้อความที่บ็อตส่ง (ทำแบบดีที่สุดเท่าที่ทำได้ผ่านแคชข้อความที่ส่ง)
    - อีเวนต์รีแอ็กชันยังคงเคารพการควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ให้ thread ID ในการอัปเดตรีแอ็กชัน
      - กลุ่มที่ไม่ใช่ฟอรัมจะกำหนดเส้นทางไปยังเซสชันแชตกลุ่ม
      - กลุ่มฟอรัมจะกำหนดเส้นทางไปยังเซสชันหัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อต้นทางที่แน่นอน

    `allowed_updates` สำหรับ polling/webhook จะรวม `message_reaction` โดยอัตโนมัติ

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการแก้ค่า:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - อีโมจิสำรองจากตัวตนของ agent (`agents.list[].identity.emoji` มิฉะนั้นใช้ "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิ unicode (เช่น "👀")
    - ใช้ `""` เพื่อปิดใช้รีแอ็กชันสำหรับ channel หรือบัญชี

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    การเขียนการกำหนดค่า channel เปิดใช้ตามค่าเริ่มต้น (`configWrites !== false`)

    การเขียนที่ทริกเกอร์โดย Telegram รวมถึง:

    - อีเวนต์การย้ายกลุ่ม (`migrate_to_chat_id`) เพื่ออัปเดต `channels.telegram.groups`
    - `/config set` และ `/config unset` (ต้องเปิดใช้คำสั่ง)

    ปิดใช้:

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

  <Accordion title="Long polling vs webhook">
    ค่าเริ่มต้นคือ long polling สำหรับโหมด webhook ให้ตั้งค่า `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; ตัวเลือกเพิ่มเติมคือ `webhookPath`, `webhookHost`, `webhookPort` (ค่าเริ่มต้น `/telegram-webhook`, `127.0.0.1`, `8787`)

    ในโหมด long-polling OpenClaw จะบันทึก watermark การรีสตาร์ทคงทนเฉพาะหลังจาก dispatch การอัปเดตสำเร็จแล้ว หาก handler ล้มเหลว การอัปเดตนั้นยังคง retry ได้ในกระบวนการเดียวกัน และจะไม่ถูกเขียนว่าเสร็จสมบูรณ์สำหรับการลบรายการซ้ำเมื่อรีสตาร์ท

    listener ภายในเครื่องผูกกับ `127.0.0.1:8787` สำหรับ ingress สาธารณะ ให้ใส่ reverse proxy ไว้หน้า port ภายในเครื่อง หรือตั้งค่า `webhookHost: "0.0.0.0"` อย่างตั้งใจ

    โหมด Webhook ตรวจสอบ request guards, secret token ของ Telegram และ JSON body ก่อนส่งคืน `200` ให้ Telegram
    จากนั้น OpenClaw จะประมวลผลการอัปเดตแบบอะซิงโครนัสผ่าน bot lane แบบต่อแชต/ต่อหัวข้อเดียวกับที่ long polling ใช้ ดังนั้นรอบ agent ที่ช้าจะไม่หน่วง ACK การส่งมอบของ Telegram

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` จะเลือกใช้ขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนการแบ่งตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ขาเข้าและขาออก
    - `channels.telegram.mediaGroupFlushMs` (ค่าเริ่มต้น 500) ควบคุมระยะเวลาที่อัลบั้ม/กลุ่มสื่อของ Telegram ถูกบัฟเฟอร์ก่อนที่ OpenClaw จะ dispatch เป็นข้อความขาเข้าหนึ่งรายการ เพิ่มค่านี้หากส่วนของอัลบั้มมาถึงช้า ลดค่านี้เพื่อลด latency ของการตอบกลับอัลบั้ม
    - `channels.telegram.timeoutSeconds` แทนที่ timeout ของไคลเอนต์ Telegram API (หากไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY) ไคลเอนต์บ็อตจะบีบค่าที่กำหนดไว้ให้ต่ำกว่า request guard ข้อความขาออก/typing 60 วินาที เพื่อให้ grammY ไม่ยกเลิกการส่งคำตอบที่มองเห็นได้ก่อนที่ transport guard และ fallback ของ OpenClaw จะทำงาน Long polling ยังคงใช้ request guard `getUpdates` 45 วินาที เพื่อไม่ให้ idle poll ถูกละทิ้งอย่างไม่มีกำหนด
    - `channels.telegram.pollingStallThresholdMs` มีค่าเริ่มต้นเป็น `120000`; ปรับระหว่าง `30000` ถึง `600000` เฉพาะสำหรับการรีสตาร์ท polling-stall แบบ false-positive
    - ประวัติบริบทกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` ปิดใช้
    - บริบทเสริมของการตอบกลับ/อ้างอิง/ส่งต่อจะถูกปรับให้อยู่ในหน้าต่างบริบทการสนทนาที่เลือกไว้หนึ่งรายการ เมื่อ Gateway ได้สังเกตข้อความต้นทางแล้ว แคชข้อความที่สังเกตจะถูกคงไว้ข้าง store เซสชัน Telegram รวม `reply_to_message` แบบตื้นเพียงหนึ่งรายการในการอัปเดต ดังนั้น chain ที่เก่ากว่าแคชจะถูกจำกัดตามเพย์โหลดการอัปเดตปัจจุบันของ Telegram
    - allowlist ของ Telegram ใช้กำกับหลัก ๆ ว่าใครสามารถทริกเกอร์ agent ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมเต็มรูปแบบ
    - การควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - การกำหนดค่า `channels.telegram.retry` ใช้กับตัวช่วยส่งของ Telegram (CLI/tools/actions) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้ การส่งคำตอบสุดท้ายขาเข้าก็ใช้ safe-send retry แบบมีขอบเขตสำหรับความล้มเหลวก่อนเชื่อมต่อ Telegram แต่จะไม่ retry envelope เครือข่ายหลังส่งที่คลุมเครือซึ่งอาจทำให้ข้อความที่มองเห็นได้ซ้ำ

    เป้าหมายการส่งของ CLI และ message-tool อาจเป็น chat ID แบบตัวเลข, username หรือเป้าหมายหัวข้อฟอรัม:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    poll ของ Telegram ใช้ `openclaw message poll` และรองรับหัวข้อฟอรัม:

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

    - `--presentation` พร้อมบล็อก `buttons` สำหรับ inline keyboard เมื่อ `channels.telegram.capabilities.inlineButtons` อนุญาต
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอการส่งแบบปักหมุดเมื่อบ็อตสามารถปักหมุดในแชตนั้นได้
    - `--force-document` เพื่อส่งรูปภาพ, GIF และวิดีโอขาออกเป็นเอกสารแทนการอัปโหลดแบบภาพถ่ายที่ถูกบีบอัด, สื่อเคลื่อนไหว หรือวิดีโอ

    การกำกับ action:

    - `channels.telegram.actions.sendMessage=false` ปิดใช้ข้อความ Telegram ขาออก รวมถึง poll
    - `channels.telegram.actions.poll=false` ปิดใช้การสร้าง poll ของ Telegram โดยยังคงเปิดการส่งปกติไว้

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถเลือกโพสต์ prompt ในแชตหรือหัวข้อต้นทางได้ ผู้อนุมัติต้องเป็น Telegram user ID แบบตัวเลข

    เส้นทางการกำหนดค่า:

    - `channels.telegram.execApprovals.enabled` (เปิดใช้อัตโนมัติเมื่อสามารถ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งคน)
    - `channels.telegram.execApprovals.approvers` (fallback ไปยัง owner ID แบบตัวเลขจาก `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` และ `defaultTo` ควบคุมว่าใครคุยกับบ็อตได้ และบ็อตส่งคำตอบปกติไปที่ไหน สิ่งเหล่านี้ไม่ได้ทำให้ใครเป็นผู้อนุมัติ exec การจับคู่ DM ที่อนุมัติครั้งแรกจะ bootstrap `commands.ownerAllowFrom` เมื่อยังไม่มีเจ้าของคำสั่ง ดังนั้นการตั้งค่าแบบเจ้าของหนึ่งคนยังคงทำงานได้โดยไม่ต้องทำ ID ซ้ำใต้ `execApprovals.approvers`

    การส่งมอบผ่าน channel จะแสดงข้อความคำสั่งในแชต เปิดใช้ `channel` หรือ `both` เฉพาะในกลุ่ม/หัวข้อที่เชื่อถือได้เท่านั้น เมื่อ prompt ไปถึงหัวข้อฟอรัม OpenClaw จะรักษาหัวข้อนั้นไว้สำหรับ prompt การอนุมัติและการติดตามผล การอนุมัติ exec หมดอายุหลัง 30 นาทีตามค่าเริ่มต้น

    ปุ่มอนุมัติแบบ inline ยังต้องให้ `channels.telegram.capabilities.inlineButtons` อนุญาตพื้นผิวเป้าหมาย (`dm`, `group` หรือ `all`) ID การอนุมัติที่ขึ้นต้นด้วย `plugin:` จะ resolve ผ่านการอนุมัติของ Plugin; รายการอื่นจะ resolve ผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ Exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## การควบคุมการตอบกลับข้อผิดพลาด

เมื่อเอเจนต์พบข้อผิดพลาดในการส่งหรือข้อผิดพลาดจากผู้ให้บริการ Telegram สามารถตอบกลับด้วยข้อความข้อผิดพลาดหรือระงับข้อความนั้นได้ คีย์การกำหนดค่าสองคีย์ควบคุมลักษณะการทำงานนี้:

| คีย์                                | ค่า               | ค่าเริ่มต้น | คำอธิบาย                                                                                         |
| ----------------------------------- | ----------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`     | `reply` ส่งข้อความข้อผิดพลาดที่เป็นมิตรไปยังแชต `silent` ระงับการตอบกลับข้อผิดพลาดทั้งหมด         |
| `channels.telegram.errorCooldownMs` | ตัวเลข (ms)       | `60000`     | เวลาขั้นต่ำระหว่างการตอบกลับข้อผิดพลาดไปยังแชตเดียวกัน ป้องกันสแปมข้อผิดพลาดระหว่างบริการล่ม      |

รองรับการเขียนทับต่อบัญชี ต่อกลุ่ม และต่อหัวข้อ (ใช้การสืบทอดแบบเดียวกับคีย์การกำหนดค่า Telegram อื่น ๆ)

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

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="บอตไม่ตอบกลับข้อความกลุ่มที่ไม่ได้กล่าวถึง">

    - หาก `requireMention=false` โหมดความเป็นส่วนตัวของ Telegram ต้องอนุญาตให้มองเห็นได้ทั้งหมด
      - BotFather: `/setprivacy` -> ปิดใช้งาน
      - จากนั้นลบและเพิ่มบอตกลับเข้ากลุ่มใหม่
    - `openclaw channels status` เตือนเมื่อการกำหนดค่าคาดหวังข้อความกลุ่มที่ไม่ได้กล่าวถึง
    - `openclaw channels status --probe` สามารถตรวจสอบ ID กลุ่มแบบตัวเลขที่ระบุชัดเจนได้ wildcard `"*"` ไม่สามารถตรวจสอบสมาชิกภาพได้
    - การทดสอบเซสชันแบบเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอตไม่เห็นข้อความกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` กลุ่มต้องถูกระบุไว้ (หรือรวม `"*"`)
    - ตรวจสอบสมาชิกภาพของบอตในกลุ่ม
    - ตรวจทานบันทึก: `openclaw logs --follow` เพื่อดูเหตุผลที่ถูกข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานบางส่วนหรือไม่ทำงานเลย">

    - อนุญาตตัวตนผู้ส่งของคุณ (การจับคู่และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังคงมีผลแม้นโยบายกลุ่มเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนูเนทีฟมีรายการมากเกินไป ให้ลดคำสั่ง Plugin/Skills/กำหนดเอง หรือปิดใช้งานเมนูเนทีฟ
    - การเรียก `deleteMyCommands` / `setMyCommands` ตอนเริ่มต้นและการเรียกพิมพ์ `sendChatAction` ถูกจำกัดขอบเขตและลองซ้ำหนึ่งครั้งผ่านการสำรองการขนส่งของ Telegram เมื่อคำขอหมดเวลา ข้อผิดพลาดเครือข่าย/fetch ที่เกิดอย่างต่อเนื่องมักบ่งชี้ปัญหาการเข้าถึง DNS/HTTPS ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="รายงานตอนเริ่มต้นว่าโทเค็นไม่ได้รับอนุญาต">

    - `getMe returned 401` คือความล้มเหลวในการยืนยันตัวตนของ Telegram สำหรับโทเค็นบอตที่กำหนดค่าไว้
    - คัดลอกใหม่หรือสร้างโทเค็นบอตใหม่ใน BotFather แล้วอัปเดต `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` หรือ `TELEGRAM_BOT_TOKEN` สำหรับบัญชีเริ่มต้น
    - `deleteWebhook 401 Unauthorized` ระหว่างเริ่มต้นก็เป็นความล้มเหลวด้านการยืนยันตัวตนเช่นกัน การถือว่าเป็น "ไม่มี Webhook อยู่" จะเพียงเลื่อนความล้มเหลวจากโทเค็นผิดเดิมไปยังการเรียก API ภายหลังเท่านั้น

  </Accordion>

  <Accordion title="Polling หรือเครือข่ายไม่เสถียร">

    - Node 22+ + fetch/proxy แบบกำหนดเองอาจทำให้เกิดพฤติกรรมยกเลิกทันทีหากชนิด AbortSignal ไม่ตรงกัน
    - บางโฮสต์ resolve `api.telegram.org` ไปเป็น IPv6 ก่อน ทางออก IPv6 ที่เสียอาจทำให้ Telegram API ล้มเหลวเป็นครั้งคราว
    - หากบันทึกมี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!` ตอนนี้ OpenClaw จะลองซ้ำข้อผิดพลาดเหล่านี้ในฐานะข้อผิดพลาดเครือข่ายที่กู้คืนได้
    - ระหว่างเริ่มต้น polling OpenClaw ใช้ probe `getMe` ตอนเริ่มต้นที่สำเร็จซ้ำสำหรับ grammY เพื่อให้ runner ไม่ต้องมี `getMe` ครั้งที่สองก่อน `getUpdates` ครั้งแรก
    - หาก `deleteWebhook` ล้มเหลวด้วยข้อผิดพลาดเครือข่ายชั่วคราวระหว่างเริ่มต้น polling OpenClaw จะดำเนินต่อไปยัง long polling แทนการเรียก control-plane ก่อน poll อีกครั้ง Webhook ที่ยังทำงานอยู่จะปรากฏเป็นความขัดแย้งของ `getUpdates` จากนั้น OpenClaw จะสร้างการขนส่ง Telegram ใหม่และลองล้าง Webhook อีกครั้ง
    - หากซ็อกเก็ต Telegram ถูกรีไซเคิลตามรอบเวลาคงที่สั้น ๆ ให้ตรวจสอบ `channels.telegram.timeoutSeconds` ที่ต่ำเกินไป ไคลเอนต์บอตจะ clamp ค่าที่กำหนดต่ำกว่า guard ของคำขอขาออกและ `getUpdates` แต่รุ่นเก่าอาจยกเลิกทุก poll หรือการตอบกลับเมื่อค่านี้ถูกตั้งต่ำกว่า guard เหล่านั้น
    - หากบันทึกมี `Polling stall detected` OpenClaw จะเริ่ม polling ใหม่และสร้างการขนส่ง Telegram ใหม่หลังจากไม่มี liveness ของ long-poll ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีตามค่าเริ่มต้น
    - `openclaw channels status --probe` และ `openclaw doctor` เตือนเมื่อบัญชี polling ที่กำลังทำงานยังไม่ทำ `getUpdates` สำเร็จหลังช่วงผ่อนผันตอนเริ่มต้น เมื่อบัญชี Webhook ที่กำลังทำงานยังไม่ทำ `setWebhook` สำเร็จหลังช่วงผ่อนผันตอนเริ่มต้น หรือเมื่อกิจกรรมการขนส่ง polling ที่สำเร็จล่าสุดเก่าเกินไป
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่ทำงานนานยังสมบูรณ์ดีแต่โฮสต์ของคุณยังรายงานการเริ่มใหม่จาก polling-stall แบบผิดพลาด การค้างอย่างต่อเนื่องมักชี้ไปที่ปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่างโฮสต์กับ `api.telegram.org`
    - Telegram ยังเคารพ env proxy ของโปรเซสสำหรับการขนส่ง Bot API รวมถึง `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และรูปแบบตัวพิมพ์เล็กของตัวแปรเหล่านั้น `NO_PROXY` / `no_proxy` ยังสามารถข้าม `api.telegram.org` ได้
    - หาก proxy ที่ OpenClaw จัดการถูกกำหนดค่าผ่าน `OPENCLAW_PROXY_URL` สำหรับสภาพแวดล้อมบริการและไม่มี env proxy มาตรฐาน Telegram จะใช้ URL นั้นสำหรับการขนส่ง Bot API ด้วย
    - บนโฮสต์ VPS ที่มี direct egress/TLS ไม่เสถียร ให้ route การเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ มีค่าเริ่มต้นเป็น `autoSelectFamily=true` (ยกเว้น WSL2) ลำดับผลลัพธ์ DNS ของ Telegram เคารพ `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER` จากนั้น `channels.telegram.network.dnsResultOrder` จากนั้นค่าเริ่มต้นของโปรเซส เช่น `NODE_OPTIONS=--dns-result-order=ipv4first`; หากไม่มีรายการใดใช้ได้ Node 22+ จะ fallback เป็น `ipv4first`
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนด้วยพฤติกรรมเฉพาะ IPv4 ให้บังคับการเลือก family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบช่วง benchmark ของ RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาตอยู่แล้ว
      สำหรับการดาวน์โหลดสื่อ Telegram ตามค่าเริ่มต้น หาก fake-IP ที่เชื่อถือได้หรือ
      transparent proxy เขียน `api.telegram.org` ใหม่เป็นที่อยู่
      ส่วนตัว/ภายใน/การใช้งานพิเศษอื่น ๆ ระหว่างดาวน์โหลดสื่อ คุณสามารถเลือก
      ใช้ bypass เฉพาะ Telegram ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - opt-in เดียวกันมีให้ต่อบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หาก proxy ของคุณ resolve โฮสต์สื่อ Telegram เป็น `198.18.x.x` ให้ปิด
      แฟล็กอันตรายไว้ก่อน สื่อ Telegram อนุญาตช่วง benchmark ของ RFC 2544
      ตามค่าเริ่มต้นอยู่แล้ว

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` ทำให้การป้องกัน SSRF
      สำหรับสื่อ Telegram อ่อนลง ใช้เฉพาะกับสภาพแวดล้อม proxy ที่ควบคุมโดยผู้ดำเนินการ
      และเชื่อถือได้ เช่น การ route fake-IP ของ Clash, Mihomo หรือ Surge เมื่อสภาพแวดล้อมเหล่านั้น
      สร้างคำตอบส่วนตัวหรือการใช้งานพิเศษนอกช่วง benchmark ของ RFC 2544
      ปิดไว้สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ
    </Warning>

    - การเขียนทับด้วยสภาพแวดล้อม (ชั่วคราว):
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

ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)

## อ้างอิงการกำหนดค่า

อ้างอิงหลัก: [อ้างอิงการกำหนดค่า - Telegram](/th/gateway/config-channels#telegram)

<Accordion title="ฟิลด์ Telegram ที่มีสัญญาณสำคัญ">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ symlink ถูกปฏิเสธ)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- การอนุมัติ exec: `execApprovals`, `accounts.*.execApprovals`
- คำสั่ง/เมนู: `commands.native`, `commands.nativeSkills`, `customCommands`
- เธรด/การตอบกลับ: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- การสตรีม: `streaming` (พรีวิว), `streaming.preview.toolProgress`, `blockStreaming`
- การจัดรูปแบบ/การส่ง: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- สื่อ/เครือข่าย: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- ราก API แบบกำหนดเอง: `apiRoot` (ราก Bot API เท่านั้น อย่าใส่ `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- การกระทำ/ความสามารถ: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaction: `reactionNotifications`, `reactionLevel`
- ข้อผิดพลาด: `errorPolicy`, `errorCooldownMs`
- การเขียน/ประวัติ: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญแบบหลายบัญชี: เมื่อกำหนดค่า ID บัญชีตั้งแต่สองรายการขึ้นไป ให้ตั้ง `channels.telegram.defaultAccount` (หรือรวม `channels.telegram.accounts.default`) เพื่อทำให้การ route ค่าเริ่มต้นชัดเจน มิฉะนั้น OpenClaw จะ fallback ไปยัง ID บัญชีแรกที่ normalize แล้ว และ `openclaw doctor` จะเตือน บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom` แต่ไม่สืบทอดค่า `accounts.default.*`
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Telegram กับ Gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรม allowlist ของกลุ่มและหัวข้อ
  </Card>
  <Card title="การ route ช่องทาง" icon="route" href="/th/channels/channel-routing">
    route ข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    แบบจำลองภัยคุกคามและการเสริมความปลอดภัย
  </Card>
  <Card title="การ route หลายเอเจนต์" icon="sitemap" href="/th/concepts/multi-agent">
    จับคู่กลุ่มและหัวข้อกับเอเจนต์
  </Card>
  <Card title="การแก้ไขปัญหา" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทาง
  </Card>
</CardGroup>
