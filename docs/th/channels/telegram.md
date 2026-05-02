---
read_when:
    - การทำงานกับฟีเจอร์ของ Telegram หรือ Webhook
summary: สถานะการรองรับบอต Telegram ความสามารถ และการกำหนดค่า
title: Telegram
x-i18n:
    generated_at: "2026-05-02T10:09:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b5a733970f21e6b5a145b9ebb13134fb8e18b81fa0c723607019837c60f5497
    source_path: channels/telegram.md
    workflow: 16
---

พร้อมใช้งานในระดับโปรดักชันสำหรับข้อความส่วนตัวของบอตและกลุ่มผ่าน grammY การโพลแบบยาวเป็นโหมดเริ่มต้น โหมด Webhook เป็นตัวเลือกเสริม.

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบายข้อความส่วนตัวเริ่มต้นสำหรับ Telegram คือการจับคู่
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและคู่มือปฏิบัติการซ่อมแซม
  </Card>
  <Card title="การกำหนดค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าช่องทางแบบครบถ้วน
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="สร้างโทเค็นบอตใน BotFather">
    เปิด Telegram แล้วแชทกับ **@BotFather** (ยืนยันว่าชื่อผู้ใช้ตรงกับ `@BotFather` ทุกตัว)

    เรียกใช้ `/newbot` ทำตามข้อความแจ้ง และบันทึกโทเค็น

  </Step>

  <Step title="กำหนดค่าโทเค็นและนโยบายข้อความส่วนตัว">

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

    ค่าทดแทนจากตัวแปรสภาพแวดล้อม: `TELEGRAM_BOT_TOKEN=...` (เฉพาะบัญชีเริ่มต้น)
    Telegram **ไม่** ใช้ `openclaw channels login telegram`; ให้กำหนดค่าโทเค็นในการกำหนดค่าหรือตัวแปรสภาพแวดล้อม แล้วเริ่ม Gateway

  </Step>

  <Step title="เริ่ม Gateway และอนุมัติข้อความส่วนตัวแรก">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    รหัสจับคู่หมดอายุหลังจาก 1 ชั่วโมง

  </Step>

  <Step title="เพิ่มบอตลงในกลุ่ม">
    เพิ่มบอตลงในกลุ่มของคุณ จากนั้นตั้งค่า `channels.telegram.groups` และ `groupPolicy` ให้ตรงกับรูปแบบการเข้าถึงของคุณ
  </Step>
</Steps>

<Note>
ลำดับการเลือกใช้โทเค็นคำนึงถึงบัญชี ในทางปฏิบัติ ค่าจากการกำหนดค่ามีลำดับเหนือค่าทดแทนจากตัวแปรสภาพแวดล้อม และ `TELEGRAM_BOT_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="โหมดความเป็นส่วนตัวและการมองเห็นกลุ่ม">
    บอต Telegram มีค่าเริ่มต้นเป็น **โหมดความเป็นส่วนตัว** ซึ่งจำกัดข้อความกลุ่มที่บอตได้รับ

    หากบอตจำเป็นต้องเห็นข้อความกลุ่มทั้งหมด ให้ทำอย่างใดอย่างหนึ่ง:

    - ปิดโหมดความเป็นส่วนตัวผ่าน `/setprivacy`, หรือ
    - ตั้งบอตเป็นผู้ดูแลกลุ่ม

    เมื่อสลับโหมดความเป็นส่วนตัว ให้ลบ + เพิ่มบอตกลับเข้าไปใหม่ในแต่ละกลุ่ม เพื่อให้ Telegram นำการเปลี่ยนแปลงไปใช้

  </Accordion>

  <Accordion title="สิทธิ์ของกลุ่ม">
    สถานะผู้ดูแลควบคุมได้ในการตั้งค่ากลุ่มของ Telegram

    บอตที่เป็นผู้ดูแลจะได้รับข้อความกลุ่มทั้งหมด ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มที่ทำงานตลอดเวลา

  </Accordion>

  <Accordion title="ตัวเลือกสลับที่มีประโยชน์ของ BotFather">

    - `/setjoingroups` เพื่ออนุญาต/ปฏิเสธการเพิ่มเข้ากลุ่ม
    - `/setprivacy` สำหรับพฤติกรรมการมองเห็นกลุ่ม

  </Accordion>
</AccordionGroup>

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="นโยบายข้อความส่วนตัว">
    `channels.telegram.dmPolicy` ควบคุมการเข้าถึงข้อความส่วนตัว:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist` (ต้องมี ID ผู้ส่งอย่างน้อยหนึ่งรายการใน `allowFrom`)
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    `dmPolicy: "open"` พร้อม `allowFrom: ["*"]` ทำให้บัญชี Telegram ใดก็ตามที่พบหรือเดาชื่อผู้ใช้ของบอตได้สามารถสั่งงานบอตได้ ใช้เฉพาะกับบอตที่ตั้งใจให้สาธารณะและจำกัดเครื่องมืออย่างเข้มงวด บอตที่มีเจ้าของคนเดียวควรใช้ `allowlist` พร้อม ID ผู้ใช้แบบตัวเลข

    `channels.telegram.allowFrom` ยอมรับ ID ผู้ใช้ Telegram แบบตัวเลข ระบบยอมรับและปรับคำนำหน้า `telegram:` / `tg:` ให้อยู่ในรูปแบบมาตรฐาน
    ในการกำหนดค่าหลายบัญชี ค่า `channels.telegram.allowFrom` ระดับบนที่จำกัดสิทธิ์จะถือเป็นขอบเขตความปลอดภัย: รายการ `allowFrom: ["*"]` ระดับบัญชีจะไม่ทำให้บัญชีนั้นเป็นสาธารณะ เว้นแต่รายการอนุญาตของบัญชีที่มีผลจริงหลังผสานแล้วยังมีไวลด์การ์ดที่ระบุชัดเจน
    `dmPolicy: "allowlist"` พร้อม `allowFrom` ที่ว่างจะบล็อกข้อความส่วนตัวทั้งหมดและถูกการตรวจสอบการกำหนดค่าปฏิเสธ
    ขั้นตอนตั้งค่าจะขอเฉพาะ ID ผู้ใช้แบบตัวเลขเท่านั้น
    หากคุณอัปเกรดและการกำหนดค่าของคุณมีรายการอนุญาตแบบ `@username` ให้รัน `openclaw doctor --fix` เพื่อแก้ไขรายการเหล่านั้น (พยายามอย่างดีที่สุด; ต้องใช้โทเค็นบอต Telegram)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์รายการอนุญาตในพื้นที่เก็บการจับคู่ `openclaw doctor --fix` สามารถกู้คืนรายการเข้าสู่ `channels.telegram.allowFrom` ในโฟลว์รายการอนุญาตได้ (เช่นเมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID ที่ระบุชัดเจน)

    สำหรับบอตที่มีเจ้าของคนเดียว ให้ใช้ `dmPolicy: "allowlist"` พร้อม ID `allowFrom` แบบตัวเลขที่ระบุชัดเจน เพื่อให้นโยบายการเข้าถึงคงทนในการกำหนดค่า (แทนการพึ่งพาการอนุมัติการจับคู่ก่อนหน้า)

    ความเข้าใจผิดที่พบบ่อย: การอนุมัติการจับคู่ข้อความส่วนตัวไม่ได้หมายความว่า "ผู้ส่งนี้ได้รับอนุญาตทุกที่"
    การจับคู่ให้สิทธิ์เข้าถึงข้อความส่วนตัว หากยังไม่มีเจ้าของคำสั่ง การจับคู่รายการแรกที่ได้รับอนุมัติจะตั้งค่า `commands.ownerAllowFrom` ด้วย เพื่อให้คำสั่งเฉพาะเจ้าของและการอนุมัติการรันคำสั่งมีบัญชีผู้ปฏิบัติการที่ระบุชัดเจน
    การอนุญาตผู้ส่งในกลุ่มยังคงมาจากรายการอนุญาตที่ระบุชัดเจนในการกำหนดค่า
    หากคุณต้องการ "ฉันได้รับอนุญาตครั้งเดียว แล้วทั้งข้อความส่วนตัวและคำสั่งกลุ่มก็ใช้งานได้" ให้ใส่ ID ผู้ใช้ Telegram แบบตัวเลขของคุณใน `channels.telegram.allowFrom`; สำหรับคำสั่งเฉพาะเจ้าของ ตรวจสอบให้แน่ใจว่า `commands.ownerAllowFrom` มี `telegram:<your user id>`

    ### การหา ID ผู้ใช้ Telegram ของคุณ

    ปลอดภัยกว่า (ไม่มีบอตบุคคลที่สาม):

    1. ส่งข้อความส่วนตัวถึงบอตของคุณ
    2. รัน `openclaw logs --follow`
    3. อ่านค่า `from.id`

    วิธีด้วย Bot API อย่างเป็นทางการ:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีผ่านบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="นโยบายกลุ่มและรายการอนุญาต">
    การควบคุมสองส่วนจะใช้ร่วมกัน:

    1. **กลุ่มใดได้รับอนุญาต** (`channels.telegram.groups`)
       - ไม่มีการกำหนดค่า `groups`:
         - เมื่อมี `groupPolicy: "open"`: กลุ่มใดก็ได้ผ่านการตรวจสอบ ID กลุ่มได้
         - เมื่อมี `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการ `groups` (หรือ `"*"`)
       - กำหนดค่า `groups` แล้ว: ทำหน้าที่เป็นรายการอนุญาต (ID ที่ระบุชัดเจนหรือ `"*"`)

    2. **ผู้ส่งใดได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    ใช้ `groupAllowFrom` สำหรับการกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่า Telegram จะย้อนกลับไปใช้ `allowFrom`
    รายการ `groupAllowFrom` ควรเป็น ID ผู้ใช้ Telegram แบบตัวเลข (คำนำหน้า `telegram:` / `tg:` จะถูกปรับให้อยู่ในรูปแบบมาตรฐาน)
    อย่าใส่ ID แชทของกลุ่มหรือซูเปอร์กรุ๊ป Telegram ใน `groupAllowFrom` ID แชทติดลบควรอยู่ใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเว้นสำหรับการอนุญาตผู้ส่ง
    ขอบเขตความปลอดภัย (`2026.2.25+`): การยืนยันสิทธิ์ผู้ส่งในกลุ่ม **ไม่** สืบทอดการอนุมัติการจับคู่ข้อความส่วนตัวจากพื้นที่เก็บการจับคู่
    การจับคู่ยังคงเป็นเฉพาะข้อความส่วนตัว สำหรับกลุ่ม ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` ต่อกลุ่ม/ต่อหัวข้อ
    หากไม่ได้ตั้งค่า `groupAllowFrom` Telegram จะย้อนกลับไปใช้ `allowFrom` จากการกำหนดค่า ไม่ใช่พื้นที่เก็บการจับคู่
    รูปแบบที่ใช้งานจริงสำหรับบอตที่มีเจ้าของคนเดียว: ตั้งค่า ID ผู้ใช้ของคุณใน `channels.telegram.allowFrom` ปล่อย `groupAllowFrom` ไว้โดยไม่ตั้งค่า และอนุญาตกลุ่มเป้าหมายใต้ `channels.telegram.groups`
    หมายเหตุรันไทม์: หากไม่มี `channels.telegram` เลย รันไทม์จะปิดกั้นโดยค่าเริ่มต้นด้วย `groupPolicy="allowlist"` เว้นแต่จะตั้งค่า `channels.defaults.groupPolicy` อย่างชัดเจน

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
      ข้อผิดพลาดที่พบบ่อย: `groupAllowFrom` ไม่ใช่รายการอนุญาตกลุ่ม Telegram

      - ใส่ ID แชทติดลบของกลุ่มหรือซูเปอร์กรุ๊ป Telegram เช่น `-1001234567890` ไว้ใต้ `channels.telegram.groups`
      - ใส่ ID ผู้ใช้ Telegram เช่น `8734062810` ไว้ใต้ `groupAllowFrom` เมื่อคุณต้องการจำกัดว่าคนใดภายในกลุ่มที่ได้รับอนุญาตสามารถเรียกใช้บอตได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกใดก็ได้ของกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอตได้

    </Warning>

  </Tab>

  <Tab title="พฤติกรรมการกล่าวถึง">
    การตอบกลับในกลุ่มต้องมีการกล่าวถึงเป็นค่าเริ่มต้น

    การกล่าวถึงอาจมาจาก:

    - การกล่าวถึง `@botusername` ในตัว, หรือ
    - รูปแบบการกล่าวถึงใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    คำสั่งสลับระดับเซสชัน:

    - `/activation always`
    - `/activation mention`

    คำสั่งเหล่านี้อัปเดตเฉพาะสถานะเซสชัน ใช้การกำหนดค่าสำหรับความคงอยู่

    ตัวอย่างการกำหนดค่าที่คงอยู่:

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

    การรับ ID แชทกลุ่ม:

    - ส่งต่อข้อความกลุ่มไปยัง `@userinfobot` / `@getidsbot`
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจสอบ Bot API `getUpdates`

  </Tab>
</Tabs>

## พฤติกรรมรันไทม์

- Telegram อยู่ภายใต้การจัดการของกระบวนการ Gateway
- การกำหนดเส้นทางเป็นแบบกำหนดได้แน่นอน: ข้อความขาเข้าจาก Telegram จะตอบกลับไปยัง Telegram (โมเดลไม่เลือกช่องทาง)
- ข้อความขาเข้าจะถูกทำให้เป็นรูปแบบมาตรฐานในกรอบข้อมูลช่องทางที่ใช้ร่วมกัน พร้อมเมทาดาตาการตอบกลับและตัวยึดตำแหน่งสื่อ
- เซสชันกลุ่มถูกแยกตาม ID กลุ่ม หัวข้อฟอรัมจะต่อท้าย `:topic:<threadId>` เพื่อแยกหัวข้อออกจากกัน
- ข้อความส่วนตัวอาจมี `message_thread_id`; OpenClaw จะเก็บรักษา ID เธรดไว้สำหรับการตอบกลับ แต่คงข้อความส่วนตัวไว้บนเซสชันแบบแบนเป็นค่าเริ่มต้น กำหนดค่า `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true`, หรือการกำหนดค่าหัวข้อที่ตรงกัน เมื่อคุณตั้งใจต้องการแยกเซสชันหัวข้อของข้อความส่วนตัว
- การโพลแบบยาวใช้ grammY runner พร้อมการจัดลำดับแยกตามแชท/เธรด ความพร้อมกันของส่วนรับผลของ runner โดยรวมใช้ `agents.defaults.maxConcurrent`
- การโพลแบบยาวมีการป้องกันภายในกระบวนการ Gateway แต่ละตัว เพื่อให้มีตัวโพลที่ใช้งานอยู่เพียงตัวเดียวที่ใช้โทเค็นบอตได้ในแต่ละครั้ง หากคุณยังเห็นความขัดแย้ง `getUpdates` 409 อาจมี Gateway OpenClaw อื่น สคริปต์ หรือตัวโพลภายนอกกำลังใช้โทเค็นเดียวกัน
- การรีสตาร์ตของตัวเฝ้าระวังการโพลแบบยาวจะทริกเกอร์หลังจาก 120 วินาทีโดยค่าเริ่มต้น หากไม่มีสัญญาณมีชีวิตของ `getUpdates` ที่เสร็จสมบูรณ์ เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการปรับใช้ของคุณยังพบการรีสตาร์ตจากการโพลค้างแบบผิดพลาดระหว่างงานที่ใช้เวลานาน ค่านี้มีหน่วยเป็นมิลลิวินาทีและอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับการแทนที่ค่ารายบัญชี
- Telegram Bot API ไม่มีการรองรับการยืนยันว่าอ่านแล้ว (`sendReadReceipts` ใช้ไม่ได้)

## ข้อมูลอ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="ตัวอย่างการสตรีมสด (การแก้ไขข้อความ)">
    OpenClaw สามารถสตรีมคำตอบบางส่วนแบบเรียลไทม์:

    - แชทโดยตรง: ข้อความตัวอย่าง + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความตัวอย่าง + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` เป็น `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - `progress` แมปเป็น `partial` บน Telegram (เข้ากันได้กับการตั้งชื่อข้ามช่องทาง)
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความตัวอย่างที่ถูกแก้ไขข้อความเดิมซ้ำหรือไม่ (ค่าเริ่มต้น: `true` เมื่อการสตรีมตัวอย่างทำงานอยู่)
    - ระบบตรวจพบ `channels.telegram.streamMode` แบบเดิมและค่า `streaming` แบบบูลีน; รัน `openclaw doctor --fix` เพื่อย้ายค่าเหล่านั้นไปยัง `channels.telegram.streaming.mode`

    การอัปเดตตัวอย่างความคืบหน้าของเครื่องมือคือบรรทัดสั้น ๆ แบบ "กำลังทำงาน..." ที่แสดงระหว่างที่เครื่องมือทำงาน เช่น การรันคำสั่ง การอ่านไฟล์ การอัปเดตการวางแผน หรือสรุปแพตช์ Telegram เปิดใช้งานรายการเหล่านี้เป็นค่าเริ่มต้นเพื่อให้ตรงกับพฤติกรรม OpenClaw ที่เผยแพร่ตั้งแต่ `v2026.4.22` เป็นต้นไป หากต้องการคงตัวอย่างที่แก้ไขแล้วสำหรับข้อความคำตอบ แต่ซ่อนบรรทัดความคืบหน้าของเครื่องมือ ให้ตั้งค่า:

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

    ใช้ `streaming.mode: "off"` เฉพาะเมื่อต้องการส่งเฉพาะผลลัพธ์สุดท้ายเท่านั้น: การแก้ไขตัวอย่างข้อความล่วงหน้าของ Telegram จะถูกปิดใช้งาน และข้อความทั่วไปจากเครื่องมือ/ความคืบหน้าจะถูกระงับแทนการส่งเป็นข้อความ "Working..." แยกต่างหาก พรอมต์อนุมัติ เพย์โหลดสื่อ และข้อผิดพลาดยังคงส่งผ่านการส่งผลลัพธ์สุดท้ายตามปกติ ใช้ `streaming.preview.toolProgress: false` เมื่อคุณต้องการคงเฉพาะการแก้ไขตัวอย่างคำตอบไว้ พร้อมซ่อนบรรทัดสถานะความคืบหน้าของเครื่องมือ

    สำหรับการตอบกลับแบบข้อความเท่านั้น:

    - ตัวอย่างข้อความสั้นใน DM/กลุ่ม/หัวข้อ: OpenClaw จะคงข้อความตัวอย่างเดิมไว้และแก้ไขเป็นผลลัพธ์สุดท้ายในตำแหน่งเดิม
    - ตัวอย่างข้อความที่เก่ากว่าประมาณหนึ่งนาที: OpenClaw จะส่งคำตอบที่เสร็จแล้วเป็นข้อความสุดท้ายใหม่ จากนั้นล้างตัวอย่างข้อความ เพื่อให้เวลาที่ Telegram แสดงสะท้อนเวลาที่เสร็จสิ้นแทนเวลาที่สร้างตัวอย่างข้อความ

    สำหรับการตอบกลับที่ซับซ้อน (เช่น เพย์โหลดสื่อ) OpenClaw จะถอยกลับไปใช้การส่งผลลัพธ์สุดท้ายตามปกติ แล้วจึงล้างข้อความตัวอย่าง

    การสตรีมตัวอย่างแยกจากการสตรีมบล็อก เมื่อเปิดใช้งานการสตรีมบล็อกสำหรับ Telegram อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำสองทาง

    สตรีมเหตุผลเฉพาะ Telegram:

    - `/reasoning stream` ส่งเหตุผลไปยังตัวอย่างสดระหว่างการสร้าง
    - คำตอบสุดท้ายจะถูกส่งโดยไม่มีข้อความเหตุผล

  </Accordion>

  <Accordion title="การจัดรูปแบบและการถอยกลับเป็น HTML">
    ข้อความขาออกใช้ Telegram `parse_mode: "HTML"`

    - ข้อความลักษณะ Markdown จะถูกเรนเดอร์เป็น HTML ที่ปลอดภัยสำหรับ Telegram
    - HTML ดิบจากโมเดลจะถูก escape เพื่อลดความล้มเหลวในการแยกวิเคราะห์ของ Telegram
    - หาก Telegram ปฏิเสธ HTML ที่แยกวิเคราะห์แล้ว OpenClaw จะลองใหม่เป็นข้อความธรรมดา

    การแสดงตัวอย่างลิงก์เปิดใช้งานโดยค่าเริ่มต้น และสามารถปิดใช้งานด้วย `channels.telegram.linkPreview: false`

  </Accordion>

  <Accordion title="คำสั่งเนทีฟและคำสั่งกำหนดเอง">
    การลงทะเบียนเมนูคำสั่งของ Telegram จะจัดการตอนเริ่มต้นด้วย `setMyCommands`

    ค่าเริ่มต้นของคำสั่งเนทีฟ:

    - `commands.native: "auto"` เปิดใช้งานคำสั่งเนทีฟสำหรับ Telegram

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

    - ชื่อจะถูกทำให้เป็นรูปแบบมาตรฐาน (ตัด `/` นำหน้าออก, แปลงเป็นตัวพิมพ์เล็ก)
    - รูปแบบที่ถูกต้อง: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งกำหนดเองไม่สามารถเขียนทับคำสั่งเนทีฟได้
    - ความขัดแย้ง/รายการซ้ำจะถูกข้ามและบันทึกลงล็อก

    หมายเหตุ:

    - คำสั่งกำหนดเองเป็นเพียงรายการเมนูเท่านั้น ไม่ได้ติดตั้งพฤติกรรมให้โดยอัตโนมัติ
    - คำสั่งของ plugin/skill ยังสามารถทำงานได้เมื่อพิมพ์ แม้จะไม่แสดงในเมนู Telegram

    หากปิดใช้งานคำสั่งเนทีฟ คำสั่งในตัวจะถูกลบออก คำสั่งกำหนดเอง/plugin อาจยังลงทะเบียนได้หากกำหนดค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังมีรายการเกินหลังจากตัดแล้ว ให้ลดคำสั่ง plugin/skill/กำหนดเอง หรือปิดใช้งาน `channels.telegram.commands.native`
    - `deleteWebhook`, `deleteMyCommands` หรือ `setMyCommands` ล้มเหลวพร้อม `404: Not Found` ขณะที่คำสั่ง curl ไปยัง Bot API โดยตรงทำงานได้ อาจหมายความว่า `channels.telegram.apiRoot` ถูกตั้งเป็น endpoint `/bot<TOKEN>` แบบเต็ม `apiRoot` ต้องเป็นเฉพาะรากของ Bot API เท่านั้น และ `openclaw doctor --fix` จะลบ `/bot<TOKEN>` ต่อท้ายที่เกิดจากความผิดพลาด
    - `getMe returned 401` หมายความว่า Telegram ปฏิเสธโทเค็นบอตที่กำหนดค่าไว้ อัปเดต `botToken`, `tokenFile` หรือ `TELEGRAM_BOT_TOKEN` ด้วยโทเค็น BotFather ปัจจุบัน; OpenClaw จะหยุดก่อน polling ดังนั้นจึงไม่ถูกรายงานเป็นความล้มเหลวในการล้าง Webhook
    - `setMyCommands failed` พร้อมข้อผิดพลาดเครือข่าย/fetch โดยทั่วไปหมายความว่า DNS/HTTPS ขาออกไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งจับคู่อุปกรณ์ (Plugin `device-pair`)

    เมื่อติดตั้ง Plugin `device-pair`:

    1. `/pair` สร้างรหัสตั้งค่า
    2. วางรหัสในแอป iOS
    3. `/pair pending` แสดงรายการคำขอที่รอดำเนินการ (รวมบทบาท/ขอบเขต)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติอย่างชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    รหัสตั้งค่ามีโทเค็น bootstrap อายุสั้น การส่งมอบ bootstrap ในตัวจะคงโทเค็นโหนดหลักไว้ที่ `scopes: []`; โทเค็น operator ที่ถูกส่งมอบใดๆ จะยังถูกจำกัดอยู่ที่ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write` การตรวจสอบขอบเขต bootstrap มีคำนำหน้าบทบาท ดังนั้น allowlist ของ operator นั้นจะตอบสนองเฉพาะคำขอของ operator เท่านั้น; บทบาทที่ไม่ใช่ operator ยังต้องมีขอบเขตภายใต้คำนำหน้าบทบาทของตนเอง

    หากอุปกรณ์ลองใหม่พร้อมรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (เช่น บทบาท/ขอบเขต/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` อื่น ให้รัน `/pair pending` อีกครั้งก่อนอนุมัติ

    รายละเอียดเพิ่มเติม: [การจับคู่](/th/channels/pairing#pair-via-telegram-recommended-for-ios)

  </Accordion>

  <Accordion title="ปุ่มอินไลน์">
    กำหนดค่าขอบเขตแป้นพิมพ์อินไลน์:

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

    `capabilities: ["inlineButtons"]` แบบเดิมจะจับคู่เป็น `inlineButtons: "all"`

    ตัวอย่างการดำเนินการกับข้อความ:

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

    การคลิก callback จะถูกส่งต่อไปยังเอเจนต์เป็นข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="การดำเนินการข้อความ Telegram สำหรับเอเจนต์และระบบอัตโนมัติ">
    การดำเนินการของเครื่องมือ Telegram รวมถึง:

    - `sendMessage` (`to`, `content`, ตัวเลือก `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, ตัวเลือก `iconColor`, `iconCustomEmojiId`)

    การดำเนินการข้อความของช่องทางเปิดเผย alias ที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    การควบคุม gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้งาน)

    หมายเหตุ: `edit` และ `topic-create` เปิดใช้งานโดยค่าเริ่มต้นในขณะนี้ และไม่มี toggle `channels.telegram.actions.*` แยกต่างหาก
    การส่งขณะรันใช้สแนปช็อต config/secrets ที่ใช้งานอยู่ (ตอนเริ่มต้น/โหลดใหม่) ดังนั้นเส้นทางการดำเนินการจะไม่ทำการ resolve `SecretRef` ใหม่แบบเฉพาะกิจต่อการส่งแต่ละครั้ง

    ความหมายของการลบ reaction: [/tools/reactions](/th/tools/reactions)

  </Accordion>

  <Accordion title="แท็กเธรดการตอบกลับ">
    Telegram รองรับแท็กเธรดการตอบกลับแบบชัดเจนในเอาต์พุตที่สร้างขึ้น:

    - `[[reply_to_current]]` ตอบกลับข้อความที่กระตุ้น
    - `[[reply_to:<id>]]` ตอบกลับ ID ข้อความ Telegram ที่ระบุ

    `channels.telegram.replyToMode` ควบคุมการจัดการ:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`

    เมื่อเปิดใช้งานเธรดการตอบกลับและมีข้อความหรือคำบรรยาย Telegram ต้นฉบับให้ใช้ OpenClaw จะใส่ข้อความอ้างอิง Telegram แบบเนทีฟโดยอัตโนมัติ Telegram จำกัดข้อความอ้างอิงเนทีฟไว้ที่ 1024 หน่วยโค้ด UTF-16 ดังนั้นข้อความที่ยาวกว่าจะถูกอ้างจากจุดเริ่มต้น และถอยกลับเป็นการตอบกลับแบบธรรมดาหาก Telegram ปฏิเสธข้อความอ้างอิง

    หมายเหตุ: `off` ปิดใช้งานเธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงถูกใช้

  </Accordion>

  <Accordion title="หัวข้อฟอรัมและพฤติกรรมเธรด">
    ซูเปอร์กรุ๊ปแบบฟอรัม:

    - คีย์เซสชันหัวข้อจะต่อท้าย `:topic:<threadId>`
    - การตอบกลับและสถานะกำลังพิมพ์จะชี้ไปที่เธรดหัวข้อ
    - เส้นทาง config หัวข้อ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของหัวข้อทั่วไป (`threadId=1`):

    - การส่งข้อความจะละเว้น `message_thread_id` (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - การดำเนินการกำลังพิมพ์ยังคงรวม `message_thread_id`

    การสืบทอดของหัวข้อ: รายการหัวข้อจะสืบทอดการตั้งค่ากลุ่ม เว้นแต่จะถูกแทนที่ (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` เป็นของหัวข้อเท่านั้นและไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม

    **การกำหนดเส้นทางเอเจนต์รายหัวข้อ**: แต่ละหัวข้อสามารถกำหนดเส้นทางไปยังเอเจนต์อื่นได้โดยตั้งค่า `agentId` ใน config หัวข้อ สิ่งนี้ทำให้แต่ละหัวข้อมี workspace, memory และ session แยกเป็นของตนเอง ตัวอย่าง:

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

    จากนั้นแต่ละหัวข้อจะมีคีย์เซสชันของตนเอง: `agent:zu:telegram:group:-1001234567890:topic:3`

    **การผูกหัวข้อ ACP แบบถาวร**: หัวข้อฟอรัมสามารถ pin เซสชัน harness ของ ACP ผ่านการผูก ACP แบบ typed ระดับบนสุด (`bindings[]` พร้อม `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ id ที่ระบุหัวข้อ เช่น `-1001234567890:topic:42`) ปัจจุบันจำกัดขอบเขตไว้ที่หัวข้อฟอรัมในกลุ่ม/ซูเปอร์กรุ๊ป ดู [เอเจนต์ ACP](/th/tools/acp-agents)

    **การ spawn ACP ที่ผูกกับเธรดจากแชต**: `/acp spawn <agent> --thread here|auto` ผูกหัวข้อปัจจุบันกับเซสชัน ACP ใหม่; ข้อความติดตามผลจะถูกกำหนดเส้นทางไปที่นั่นโดยตรง OpenClaw จะ pin การยืนยันการ spawn ไว้ในหัวข้อ ต้องให้ `channels.telegram.threadBindings.spawnSessions` เปิดใช้งานอยู่ต่อไป (ค่าเริ่มต้น: `true`)

    บริบทเทมเพลตเปิดเผย `MessageThreadId` และ `IsForum` แชต DM ที่มี `message_thread_id` จะคงการกำหนดเส้นทาง DM และเมตาดาต้าการตอบกลับบนเซสชันแบบแบนโดยค่าเริ่มต้น; จะใช้คีย์เซสชันที่รับรู้เธรดเฉพาะเมื่อกำหนดค่าด้วย `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` หรือ config หัวข้อที่ตรงกัน ใช้ `channels.telegram.dm.threadReplies` ระดับบนสุดเป็นค่าเริ่มต้นของบัญชี หรือ `direct.<chatId>.threadReplies` สำหรับ DM หนึ่งรายการ

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยกความแตกต่างระหว่างโน้ตเสียงกับไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมไฟล์เสียง
    - แท็ก `[[audio_as_voice]]` ในคำตอบของเอเจนต์เพื่อบังคับให้ส่งเป็นโน้ตเสียง
    - transcript ของโน้ตเสียงขาเข้าจะถูกจัดกรอบเป็นข้อความที่สร้างโดยเครื่อง
      ซึ่งไม่น่าเชื่อถือในบริบทเอเจนต์; การตรวจจับการกล่าวถึงยังคงใช้
      transcript ดิบ ดังนั้นข้อความเสียงที่ถูกควบคุมด้วยการกล่าวถึงจึงยังทำงานต่อไป

    ตัวอย่างการดำเนินการกับข้อความ:

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

    Telegram แยกความแตกต่างระหว่างไฟล์วิดีโอกับโน้ตวิดีโอ

    ตัวอย่างการดำเนินการกับข้อความ:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    โน้ตวิดีโอไม่รองรับคำบรรยาย; ข้อความที่ให้มาจะถูกส่งแยกต่างหาก

    ### สติกเกอร์

    การจัดการสติกเกอร์ขาเข้า:

    - WEBP แบบ static: ดาวน์โหลดและประมวลผล (placeholder `<media:sticker>`)
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

    สติกเกอร์จะถูกอธิบายหนึ่งครั้ง (เมื่อเป็นไปได้) และแคชไว้เพื่อลดการเรียก vision ซ้ำ

    เปิดใช้งานการดำเนินการสติกเกอร์:

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

    ส่งการดำเนินการสติกเกอร์:

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

  <Accordion title="การแจ้งเตือนรีแอ็กชัน">
    รีแอ็กชันของ Telegram จะมาถึงเป็นอัปเดต `message_reaction` (แยกจาก payload ของข้อความ)

    เมื่อเปิดใช้ OpenClaw จะจัดคิวเหตุการณ์ระบบ เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    การกำหนดค่า:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงรีแอ็กชันของผู้ใช้ต่อข้อความที่บอตส่งเท่านั้น (พยายามให้ดีที่สุดผ่านแคชข้อความที่ส่งแล้ว)
    - เหตุการณ์รีแอ็กชันยังคงเคารพการควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ได้ให้ ID เธรดในอัปเดตรีแอ็กชัน
      - กลุ่มที่ไม่ใช่ฟอรัมจะกำหนดเส้นทางไปยังเซสชันแชตกลุ่ม
      - กลุ่มฟอรัมจะกำหนดเส้นทางไปยังเซสชันหัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อต้นทางที่แน่นอน

    `allowed_updates` สำหรับ polling/webhook จะรวม `message_reaction` โดยอัตโนมัติ

  </Accordion>

  <Accordion title="รีแอ็กชัน Ack">
    `ackReaction` ส่งอีโมจิยืนยันขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการแก้ค่า:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - ค่า fallback อีโมจิของตัวตน agent (`agents.list[].identity.emoji`, มิฉะนั้นเป็น "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิ unicode (เช่น "👀")
    - ใช้ `""` เพื่อปิดใช้รีแอ็กชันสำหรับ channel หรือบัญชี

  </Accordion>

  <Accordion title="การเขียน config จากเหตุการณ์และคำสั่ง Telegram">
    การเขียน config ของ Channel เปิดใช้เป็นค่าเริ่มต้น (`configWrites !== false`)

    การเขียนที่ถูกเรียกจาก Telegram ได้แก่:

    - เหตุการณ์ย้ายกลุ่ม (`migrate_to_chat_id`) เพื่ออัปเดต `channels.telegram.groups`
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

  <Accordion title="Long polling เทียบกับ webhook">
    ค่าเริ่มต้นคือ long polling สำหรับโหมด webhook ให้ตั้งค่า `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; ตัวเลือกเพิ่มเติมคือ `webhookPath`, `webhookHost`, `webhookPort` (ค่าเริ่มต้น `/telegram-webhook`, `127.0.0.1`, `8787`)

    listener ภายในเครื่อง bind กับ `127.0.0.1:8787` สำหรับ ingress สาธารณะ ให้ตั้ง reverse proxy ไว้หน้าพอร์ตภายในเครื่อง หรือตั้ง `webhookHost: "0.0.0.0"` อย่างตั้งใจ

    โหมด Webhook จะตรวจสอบ request guards, โทเค็นลับของ Telegram และ body JSON ก่อนส่งคืน `200` ให้ Telegram
    จากนั้น OpenClaw จะประมวลผลอัปเดตแบบอะซิงโครนัสผ่าน lane บอตต่อแชต/ต่อหัวข้อเดียวกับที่ long polling ใช้ ดังนั้นรอบการทำงานของ agent ที่ช้าจะไม่ค้าง ACK การส่งของ Telegram

  </Accordion>

  <Accordion title="ขีดจำกัด การลองซ้ำ และเป้าหมาย CLI">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` จะให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนการแบ่งตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ขาเข้าและขาออก
    - `channels.telegram.timeoutSeconds` แทนที่ timeout ของ client Telegram API (หากไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY) Bot clients จะ clamp ค่าที่กำหนดไว้ให้ต่ำกว่า guard คำขอข้อความขาออก/typing 60 วินาที เพื่อไม่ให้ grammY ยกเลิกการส่งคำตอบที่มองเห็นได้ก่อนที่ transport guard และ fallback ของ OpenClaw จะทำงานได้ Long polling ยังใช้ request guard 45 วินาทีสำหรับ `getUpdates` เพื่อไม่ให้ idle polls ถูกปล่อยทิ้งไว้ไม่มีกำหนด
    - ค่าเริ่มต้นของ `channels.telegram.pollingStallThresholdMs` คือ `120000`; ปรับระหว่าง `30000` ถึง `600000` เฉพาะสำหรับการ restart จาก polling-stall ที่เป็น false positive
    - ประวัติบริบทกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` ปิดใช้
    - ขณะนี้บริบทเสริมของ reply/quote/forward จะถูกส่งต่อไปตามที่ได้รับ
    - allowlists ของ Telegram ใช้ gate หลักว่าใครเรียก agent ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมเต็มรูปแบบ
    - การควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - config `channels.telegram.retry` ใช้กับตัวช่วยส่งของ Telegram (CLI/tools/actions) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้ การส่ง final-reply ขาเข้าก็ใช้ safe-send retry แบบมีขอบเขตสำหรับความล้มเหลวก่อนเชื่อมต่อของ Telegram แต่จะไม่ลองซ้ำกับซองเครือข่ายหลังส่งที่กำกวมซึ่งอาจทำให้ข้อความที่มองเห็นได้ซ้ำกัน

    เป้าหมายการส่ง CLI อาจเป็น chat ID แบบตัวเลขหรือ username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    poll ของ Telegram ใช้ `openclaw message poll` และรองรับหัวข้อฟอรัม:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    flags สำหรับ poll เฉพาะ Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` สำหรับหัวข้อฟอรัม (หรือใช้เป้าหมาย `:topic:`)

    การส่ง Telegram ยังรองรับ:

    - `--presentation` พร้อมบล็อก `buttons` สำหรับ inline keyboards เมื่อ `channels.telegram.capabilities.inlineButtons` อนุญาต
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอการส่งแบบปักหมุดเมื่อบอตสามารถปักหมุดในแชตนั้นได้
    - `--force-document` เพื่อส่งรูปภาพขาออกและ GIF เป็นเอกสารแทนการอัปโหลดเป็นรูปภาพที่บีบอัดหรือสื่อเคลื่อนไหว

    การ gate action:

    - `channels.telegram.actions.sendMessage=false` ปิดใช้ข้อความ Telegram ขาออก รวมถึง polls
    - `channels.telegram.actions.poll=false` ปิดใช้การสร้าง poll ของ Telegram โดยยังเปิดใช้การส่งปกติไว้

  </Accordion>

  <Accordion title="การอนุมัติ exec ใน Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถเลือกโพสต์ prompt ในแชตหรือหัวข้อต้นทางได้ ผู้อนุมัติต้องเป็น ID ผู้ใช้ Telegram แบบตัวเลข

    path การกำหนดค่า:

    - `channels.telegram.execApprovals.enabled` (เปิดใช้อัตโนมัติเมื่อแก้ค่า approver ได้อย่างน้อยหนึ่งราย)
    - `channels.telegram.execApprovals.approvers` (fallback ไปยัง owner IDs แบบตัวเลขจาก `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` และ `defaultTo` ควบคุมว่าใครคุยกับบอตได้และบอตส่งคำตอบปกติไปที่ใด สิ่งเหล่านี้ไม่ได้ทำให้ใครเป็นผู้อนุมัติ exec การจับคู่ DM ที่อนุมัติครั้งแรกจะ bootstrap `commands.ownerAllowFrom` เมื่อยังไม่มี command owner ดังนั้นการตั้งค่าแบบเจ้าของหนึ่งรายยังทำงานได้โดยไม่ต้องทำ ID ซ้ำใต้ `execApprovals.approvers`

    การส่งผ่าน Channel จะแสดงข้อความคำสั่งในแชต; เปิดใช้ `channel` หรือ `both` เฉพาะในกลุ่ม/หัวข้อที่เชื่อถือได้เท่านั้น เมื่อ prompt ไปถึงหัวข้อฟอรัม OpenClaw จะรักษาหัวข้อไว้สำหรับ prompt การอนุมัติและการติดตามผล การอนุมัติ exec หมดอายุหลัง 30 นาทีโดยค่าเริ่มต้น

    ปุ่มอนุมัติแบบ inline ยังต้องให้ `channels.telegram.capabilities.inlineButtons` อนุญาตพื้นผิวเป้าหมาย (`dm`, `group` หรือ `all`) ด้วย ID การอนุมัติที่ขึ้นต้นด้วย `plugin:` จะ resolve ผ่านการอนุมัติของ Plugin; รายการอื่นจะ resolve ผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## การควบคุมการตอบกลับข้อผิดพลาด

เมื่อ agent พบข้อผิดพลาดในการส่งหรือ provider, Telegram สามารถตอบกลับด้วยข้อความข้อผิดพลาดหรือระงับไว้ได้ คีย์ config สองรายการควบคุมพฤติกรรมนี้:

| คีย์                                 | ค่า            | ค่าเริ่มต้น | คำอธิบาย                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` ส่งข้อความข้อผิดพลาดที่เป็นมิตรไปยังแชต `silent` ระงับการตอบกลับข้อผิดพลาดทั้งหมด |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | เวลาขั้นต่ำระหว่างการตอบกลับข้อผิดพลาดไปยังแชตเดียวกัน ป้องกันสแปมข้อผิดพลาดระหว่าง outage        |

รองรับการ override ต่อบัญชี ต่อกลุ่ม และต่อหัวข้อ (inheritance เดียวกับคีย์ config อื่นของ Telegram)

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
  <Accordion title="บอตไม่ตอบกลับข้อความกลุ่มที่ไม่ได้ mention">

    - หาก `requireMention=false` โหมด privacy ของ Telegram ต้องอนุญาตให้มองเห็นได้เต็มรูปแบบ
      - BotFather: `/setprivacy` -> Disable
      - จากนั้นนำบอตออกจากกลุ่มและเพิ่มกลับเข้าไปใหม่
    - `openclaw channels status` เตือนเมื่อ config คาดหวังข้อความกลุ่มที่ไม่ได้ mention
    - `openclaw channels status --probe` สามารถตรวจสอบ ID กลุ่มตัวเลขที่ระบุชัดเจนได้; wildcard `"*"` ไม่สามารถ probe membership ได้
    - การทดสอบเซสชันแบบเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอตไม่เห็นข้อความกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` กลุ่มต้องอยู่ในรายการ (หรือรวม `"*"`)
    - ตรวจสอบ membership ของบอตในกลุ่ม
    - ตรวจสอบ logs: `openclaw logs --follow` สำหรับเหตุผลที่ skip

  </Accordion>

  <Accordion title="คำสั่งทำงานได้บางส่วนหรือไม่ได้เลย">

    - authorize ตัวตนผู้ส่งของคุณ (การจับคู่และ/หรือ `allowFrom` แบบตัวเลข)
    - การ authorize คำสั่งยังคงมีผลแม้นโยบายกลุ่มจะเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู native มีรายการมากเกินไป; ลดจำนวนคำสั่งของ plugin/skill/custom หรือปิดใช้เมนู native
    - การเรียก startup `deleteMyCommands` / `setMyCommands` และการเรียก typing `sendChatAction` มีขอบเขตและ retry หนึ่งครั้งผ่าน transport fallback ของ Telegram เมื่อ request timeout ข้อผิดพลาด network/fetch ที่เกิดซ้ำมักบ่งชี้ปัญหาการเข้าถึง DNS/HTTPS ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="startup รายงาน token ที่ไม่ได้รับอนุญาต">

    - `getMe returned 401` คือความล้มเหลวในการ authentication ของ Telegram สำหรับ bot token ที่กำหนดค่าไว้
    - คัดลอกใหม่หรือสร้าง bot token ใหม่ใน BotFather จากนั้นอัปเดต `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` หรือ `TELEGRAM_BOT_TOKEN` สำหรับบัญชีเริ่มต้น
    - `deleteWebhook 401 Unauthorized` ระหว่าง startup ก็เป็นความล้มเหลวของ auth เช่นกัน; การมองว่าเป็น "ไม่มี webhook อยู่" จะเพียงเลื่อนความล้มเหลวจาก bad-token เดิมไปยัง API calls ภายหลัง
    - หาก `deleteWebhook` ล้มเหลวด้วยข้อผิดพลาดเครือข่ายชั่วคราวระหว่าง polling startup, OpenClaw จะตรวจสอบ `getWebhookInfo`; เมื่อ Telegram รายงานว่า URL ของ webhook ว่าง polling จะดำเนินต่อเพราะการล้างข้อมูลสำเร็จตามเงื่อนไขแล้ว

  </Accordion>

  <Accordion title="Polling หรือความไม่เสถียรของเครือข่าย">

    - Node 22+ + fetch/พร็อกซีแบบกำหนดเองอาจทำให้เกิดพฤติกรรมยกเลิกทันทีหากชนิด AbortSignal ไม่ตรงกัน
    - บางโฮสต์แปลง `api.telegram.org` เป็น IPv6 ก่อน; ทราฟฟิกขาออก IPv6 ที่เสียอาจทำให้ Telegram API ล้มเหลวเป็นครั้งคราว
    - หากบันทึกมี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!` ตอนนี้ OpenClaw จะลองใหม่โดยถือว่าเป็นข้อผิดพลาดเครือข่ายที่กู้คืนได้
    - หากซ็อกเก็ต Telegram ถูกรีไซเคิลตามรอบคงที่สั้น ๆ ให้ตรวจสอบว่า `channels.telegram.timeoutSeconds` ต่ำหรือไม่; ไคลเอนต์บอทจะบีบค่าที่กำหนดไว้ซึ่งต่ำกว่าตัวป้องกันคำขอขาออกและ `getUpdates` แต่รุ่นเก่าอาจยกเลิกทุกการโพลหรือการตอบกลับเมื่อค่านี้ถูกตั้งต่ำกว่าตัวป้องกันเหล่านั้น
    - หากบันทึกมี `Polling stall detected` OpenClaw จะเริ่มการโพลใหม่และสร้างทรานสปอร์ต Telegram ใหม่หลังจากไม่มี liveness ของ long-poll ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีตามค่าเริ่มต้น
    - `openclaw channels status --probe` และ `openclaw doctor` จะเตือนเมื่อบัญชีโพลที่กำลังทำงานยังทำ `getUpdates` ไม่เสร็จหลังช่วงผ่อนผันเมื่อเริ่มต้น เมื่อบัญชี Webhook ที่กำลังทำงานยังทำ `setWebhook` ไม่เสร็จหลังช่วงผ่อนผันเมื่อเริ่มต้น หรือเมื่อกิจกรรมทรานสปอร์ตโพลที่สำเร็จล่าสุดเก่าเกินไป
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่ใช้เวลานานยังปกติ แต่โฮสต์ของคุณยังรายงานการรีสตาร์ตจาก polling-stall แบบผิดพลาด การค้างต่อเนื่องมักชี้ไปที่ปัญหาพร็อกซี, DNS, IPv6 หรือ TLS ขาออกระหว่างโฮสต์กับ `api.telegram.org`
    - Telegram ยังเคารพ env พร็อกซีของโปรเซสสำหรับทรานสปอร์ต Bot API รวมถึง `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และตัวแปรชื่อพิมพ์เล็กของรายการเหล่านั้น `NO_PROXY` / `no_proxy` ยังสามารถข้าม `api.telegram.org` ได้
    - หากพร็อกซีที่ OpenClaw จัดการถูกกำหนดค่าผ่าน `OPENCLAW_PROXY_URL` สำหรับสภาพแวดล้อมบริการและไม่มี env พร็อกซีมาตรฐาน Telegram จะใช้ URL นั้นสำหรับทรานสปอร์ต Bot API ด้วย
    - บนโฮสต์ VPS ที่มีการเชื่อมต่อขาออกโดยตรง/TLS ไม่เสถียร ให้ส่งการเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ มีค่าเริ่มต้นเป็น `autoSelectFamily=true` (ยกเว้น WSL2) ลำดับผลลัพธ์ DNS ของ Telegram จะเคารพ `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER` ตามด้วย `channels.telegram.network.dnsResultOrder` แล้วตามด้วยค่าเริ่มต้นของโปรเซส เช่น `NODE_OPTIONS=--dns-result-order=ipv4first`; หากไม่มีค่าใดใช้ได้ Node 22+ จะย้อนกลับไปใช้ `ipv4first`
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนด้วยพฤติกรรมเฉพาะ IPv4 ให้บังคับการเลือก family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบช่วง benchmark ของ RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาตแล้ว
      สำหรับการดาวน์โหลดสื่อ Telegram ตามค่าเริ่มต้น หาก fake-IP ที่เชื่อถือได้หรือ
      พร็อกซีแบบโปร่งใสเขียน `api.telegram.org` ใหม่เป็นที่อยู่
      private/internal/special-use อื่นระหว่างดาวน์โหลดสื่อ คุณสามารถเลือกใช้
      การข้ามเฉพาะ Telegram ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - การเลือกใช้แบบเดียวกันมีให้ต่อบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หากพร็อกซีของคุณแปลงโฮสต์สื่อ Telegram เป็น `198.18.x.x` ให้ปิด
      แฟล็กอันตรายไว้ก่อน สื่อ Telegram อนุญาตช่วง benchmark
      RFC 2544 ตามค่าเริ่มต้นอยู่แล้ว

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` ทำให้การป้องกัน SSRF ของสื่อ Telegram
      อ่อนลง ใช้เฉพาะกับสภาพแวดล้อมพร็อกซีที่ควบคุมโดยผู้ปฏิบัติการและเชื่อถือได้
      เช่น การกำหนดเส้นทาง fake-IP ของ Clash, Mihomo หรือ Surge เมื่อสิ่งเหล่านั้น
      สังเคราะห์คำตอบ private หรือ special-use ที่อยู่นอกช่วง benchmark
      RFC 2544 ปิดไว้สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ
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

ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา Channel](/th/channels/troubleshooting).

## อ้างอิงการกำหนดค่า

อ้างอิงหลัก: [อ้างอิงการกำหนดค่า - Telegram](/th/gateway/config-channels#telegram).

<Accordion title="ฟิลด์ Telegram สัญญาณสูง">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; symlinks จะถูกปฏิเสธ)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- การอนุมัติการดำเนินการ: `execApprovals`, `accounts.*.execApprovals`
- คำสั่ง/เมนู: `commands.native`, `commands.nativeSkills`, `customCommands`
- เธรด/การตอบกลับ: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- การสตรีม: `streaming` (ตัวอย่าง), `streaming.preview.toolProgress`, `blockStreaming`
- การจัดรูปแบบ/การส่งมอบ: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- สื่อ/เครือข่าย: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- ราก API แบบกำหนดเอง: `apiRoot` (เฉพาะราก Bot API; อย่าใส่ `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- การดำเนินการ/ความสามารถ: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions: `reactionNotifications`, `reactionLevel`
- ข้อผิดพลาด: `errorPolicy`, `errorCooldownMs`
- การเขียน/ประวัติ: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญแบบหลายบัญชี: เมื่อมีการกำหนดค่า ID บัญชีตั้งแต่สองรายการขึ้นไป ให้ตั้ง `channels.telegram.defaultAccount` (หรือใส่ `channels.telegram.accounts.default`) เพื่อให้การกำหนดเส้นทางเริ่มต้นชัดเจน มิฉะนั้น OpenClaw จะย้อนกลับไปใช้ ID บัญชีที่ normalize แล้วรายการแรก และ `openclaw doctor` จะเตือน บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom` แต่จะไม่สืบทอดค่า `accounts.default.*`
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Telegram กับ Gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรม allowlist ของกลุ่มและหัวข้อ
  </Card>
  <Card title="การกำหนดเส้นทาง Channel" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยัง agents
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเสริมความแข็งแกร่ง
  </Card>
  <Card title="การกำหนดเส้นทางแบบหลาย agent" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกลุ่มและหัวข้อไปยัง agents
  </Card>
  <Card title="การแก้ไขปัญหา" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้าม Channel
  </Card>
</CardGroup>
