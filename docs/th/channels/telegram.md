---
read_when:
    - การทำงานกับฟีเจอร์ของ Telegram หรือ Webhook
summary: สถานะการรองรับบอต Telegram, ความสามารถ และการกำหนดค่า
title: Telegram
x-i18n:
    generated_at: "2026-07-03T17:45:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 202d6eaaf9348203855659d30616368995bce9269082e60dfed67c8d444abf18
    source_path: channels/telegram.md
    workflow: 16
---

พร้อมใช้งานจริงสำหรับ DM และกลุ่มของบอตผ่าน grammY โหมดเริ่มต้นคือ long polling ส่วนโหมด webhook เป็นตัวเลือกเสริม

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับ Telegram คือการจับคู่
  </Card>
  <Card title="การแก้ไขปัญหา Channel" icon="wrench" href="/th/channels/troubleshooting">
    คู่มือวินิจฉัยและซ่อมแซมข้าม Channel
  </Card>
  <Card title="การกำหนดค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่า Channel แบบครบถ้วน
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="สร้างโทเค็นบอตใน BotFather">
    เปิด Telegram แล้วแชตกับ **@BotFather** (ยืนยันว่า handle คือ `@BotFather` ทุกตัวอักษร)

    รัน `/newbot` ทำตามพรอมต์ แล้วบันทึกโทเค็น

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
    Telegram **ไม่** ใช้ `openclaw channels login telegram`; ให้กำหนดค่าโทเค็นใน config/env แล้วเริ่ม gateway

  </Step>

  <Step title="เริ่ม gateway และอนุมัติ DM แรก">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    รหัสจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง

  </Step>

  <Step title="เพิ่มบอตลงในกลุ่ม">
    เพิ่มบอตลงในกลุ่มของคุณ จากนั้นรับ ID ทั้งสองรายการที่การเข้าถึงกลุ่มต้องใช้:

    - ID ผู้ใช้ Telegram ของคุณ ใช้ใน `allowFrom` / `groupAllowFrom`
    - ID แชตกลุ่ม Telegram ใช้เป็นคีย์ใต้ `channels.telegram.groups`

    สำหรับการตั้งค่าครั้งแรก ให้รับ ID แชตกลุ่มจาก `openclaw logs --follow`, บอต forwarded-ID หรือ Bot API `getUpdates` หลังจากกลุ่มได้รับอนุญาตแล้ว `/whoami@<bot_username>` สามารถยืนยัน ID ผู้ใช้และ ID กลุ่มได้

    ID ซูเปอร์กรุ๊ป Telegram ที่เป็นค่าลบและขึ้นต้นด้วย `-100` คือ ID แชตกลุ่ม ให้วางไว้ใต้ `channels.telegram.groups` ไม่ใช่ใต้ `groupAllowFrom`

  </Step>
</Steps>

<Note>
ลำดับการแก้ค่าโทเค็นรับรู้ตามบัญชี ในทางปฏิบัติ ค่า config จะชนะค่าทดแทนจาก env และ `TELEGRAM_BOT_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
หลังจากเริ่มต้นสำเร็จ OpenClaw จะแคชตัวตนของบอตในไดเรกทอรีสถานะได้นานถึง 24 ชั่วโมง เพื่อให้การเริ่มใหม่หลีกเลี่ยงการเรียก Telegram `getMe` เพิ่มเติมได้ การเปลี่ยนหรือลบโทเค็นจะล้างแคชนั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="โหมดความเป็นส่วนตัวและการมองเห็นในกลุ่ม">
    บอต Telegram มีค่าเริ่มต้นเป็น **Privacy Mode** ซึ่งจำกัดข้อความกลุ่มที่บอตได้รับ

    หากบอตต้องเห็นข้อความกลุ่มทั้งหมด ให้ทำอย่างใดอย่างหนึ่ง:

    - ปิดโหมดความเป็นส่วนตัวผ่าน `/setprivacy` หรือ
    - ทำให้บอตเป็นผู้ดูแลกลุ่ม

    เมื่อสลับโหมดความเป็นส่วนตัว ให้ลบ + เพิ่มบอตกลับเข้าไปใหม่ในแต่ละกลุ่ม เพื่อให้ Telegram ใช้การเปลี่ยนแปลง

  </Accordion>

  <Accordion title="สิทธิ์ของกลุ่ม">
    สถานะผู้ดูแลควบคุมได้ในการตั้งค่ากลุ่ม Telegram

    บอตที่เป็นผู้ดูแลจะได้รับข้อความกลุ่มทั้งหมด ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มที่เปิดทำงานตลอดเวลา

  </Accordion>

  <Accordion title="สวิตช์ BotFather ที่มีประโยชน์">

    - `/setjoingroups` เพื่ออนุญาต/ปฏิเสธการเพิ่มเข้ากลุ่ม
    - `/setprivacy` สำหรับพฤติกรรมการมองเห็นในกลุ่ม

  </Accordion>
</AccordionGroup>

## การควบคุมการเข้าถึงและการเปิดใช้งาน

### ตัวตนบอตในกลุ่ม

ในกลุ่มและหัวข้อฟอรัมของ Telegram การกล่าวถึง handle ของบอตที่กำหนดไว้อย่างชัดเจน (เช่น `@my_bot`) จะถือว่าเป็นการเรียกหา agent OpenClaw ที่เลือกไว้ แม้ว่าชื่อ persona ของ agent จะแตกต่างจากชื่อผู้ใช้ Telegram ก็ตาม นโยบายความเงียบของกลุ่มยังคงมีผลกับทราฟฟิกกลุ่มที่ไม่เกี่ยวข้อง แต่ handle ของบอตเองจะไม่ถือว่าเป็น "คนอื่น"

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.telegram.dmPolicy` ควบคุมการเข้าถึงข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist` (ต้องมี ID ผู้ส่งอย่างน้อยหนึ่งรายการใน `allowFrom`)
    - `open` (ต้องให้ `allowFrom` รวม `"*"`)
    - `disabled`

    `dmPolicy: "open"` พร้อม `allowFrom: ["*"]` ทำให้บัญชี Telegram ใดก็ตามที่พบหรือเดาชื่อผู้ใช้บอตได้สามารถสั่งงานบอตได้ ใช้เฉพาะกับบอตสาธารณะที่ตั้งใจเปิดให้ใช้งานและมีเครื่องมือที่จำกัดอย่างเข้มงวดเท่านั้น บอตที่มีเจ้าของคนเดียวควรใช้ `allowlist` พร้อม ID ผู้ใช้แบบตัวเลข

    `channels.telegram.allowFrom` รับ ID ผู้ใช้ Telegram แบบตัวเลข รองรับคำนำหน้า `telegram:` / `tg:` และจะทำให้เป็นรูปแบบปกติ
    ในการกำหนดค่าหลายบัญชี `channels.telegram.allowFrom` ระดับบนสุดที่เข้มงวดจะถือเป็นขอบเขตความปลอดภัย: รายการ `allowFrom: ["*"]` ระดับบัญชีจะไม่ทำให้บัญชีนั้นเป็นสาธารณะ เว้นแต่ allowlist ที่มีผลของบัญชียังคงมีไวลด์การ์ดที่ระบุไว้อย่างชัดเจนหลังจากรวมแล้ว
    `dmPolicy: "allowlist"` ที่มี `allowFrom` ว่างจะบล็อก DM ทั้งหมดและจะถูกปฏิเสธโดยการตรวจสอบการกำหนดค่า
    การตั้งค่าจะถามเฉพาะ ID ผู้ใช้แบบตัวเลขเท่านั้น
    หากคุณอัปเกรดแล้วการกำหนดค่าของคุณมีรายการ allowlist แบบ `@username` ให้รัน `openclaw doctor --fix` เพื่อแก้ไขรายการเหล่านั้น (พยายามอย่างดีที่สุด; ต้องใช้โทเค็นบอต Telegram)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์ allowlist ของ pairing-store, `openclaw doctor --fix` สามารถกู้คืนรายการเข้าไปใน `channels.telegram.allowFrom` ในโฟลว์ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID ที่ระบุไว้อย่างชัดเจน)

    สำหรับบอตที่มีเจ้าของคนเดียว ควรใช้ `dmPolicy: "allowlist"` พร้อม ID `allowFrom` แบบตัวเลขที่ระบุไว้อย่างชัดเจน เพื่อให้นโยบายการเข้าถึงคงทนอยู่ในการกำหนดค่า (แทนที่จะพึ่งพาการอนุมัติการจับคู่ก่อนหน้า)

    ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่ได้หมายความว่า "ผู้ส่งนี้ได้รับอนุญาตทุกที่"
    การจับคู่ให้สิทธิ์เข้าถึง DM หากยังไม่มีเจ้าของคำสั่ง การจับคู่ที่ได้รับอนุมัติครั้งแรกจะตั้งค่า `commands.ownerAllowFrom` ด้วย เพื่อให้คำสั่งสำหรับเจ้าของเท่านั้นและการอนุมัติ exec มีบัญชีผู้ปฏิบัติงานที่ระบุไว้อย่างชัดเจน
    การอนุญาตผู้ส่งในกลุ่มยังคงมาจาก allowlist ในการกำหนดค่าที่ระบุไว้อย่างชัดเจน
    หากคุณต้องการ "ฉันได้รับอนุญาตครั้งเดียว แล้วทั้ง DM และคำสั่งกลุ่มก็ใช้งานได้" ให้ใส่ ID ผู้ใช้ Telegram แบบตัวเลขของคุณใน `channels.telegram.allowFrom`; สำหรับคำสั่งสำหรับเจ้าของเท่านั้น ตรวจสอบให้แน่ใจว่า `commands.ownerAllowFrom` มี `telegram:<your user id>`

    ### การหา ID ผู้ใช้ Telegram ของคุณ

    ปลอดภัยกว่า (ไม่มีบอตของบุคคลที่สาม):

    1. ส่ง DM ไปหาบอตของคุณ
    2. รัน `openclaw logs --follow`
    3. อ่าน `from.id`

    วิธี Bot API อย่างเป็นทางการ:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีของบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="Group policy and allowlists">
    การควบคุมสองอย่างใช้ร่วมกัน:

    1. **กลุ่มใดได้รับอนุญาต** (`channels.telegram.groups`)
       - ไม่มีการกำหนดค่า `groups`:
         - เมื่อใช้ `groupPolicy: "open"`: กลุ่มใดก็ผ่านการตรวจสอบ ID กลุ่มได้
         - เมื่อใช้ `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการ `groups` (หรือ `"*"`)
       - มีการกำหนดค่า `groups`: ทำหน้าที่เป็น allowlist (ID ที่ระบุไว้อย่างชัดเจนหรือ `"*"`)

    2. **ผู้ส่งใดได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่าไว้ Telegram จะถอยกลับไปใช้ `allowFrom`
    รายการ `groupAllowFrom` ควรเป็น ID ผู้ใช้ Telegram แบบตัวเลข (คำนำหน้า `telegram:` / `tg:` จะถูกทำให้เป็นรูปแบบปกติ)
    อย่าใส่ ID แชตของกลุ่มหรือซูเปอร์กรุ๊ป Telegram ใน `groupAllowFrom` ID แชตแบบลบควรอยู่ใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเว้นสำหรับการอนุญาตผู้ส่ง
    ขอบเขตความปลอดภัย (`2026.2.25+`): การตรวจสอบสิทธิ์ผู้ส่งในกลุ่มจะ**ไม่**สืบทอดการอนุมัติจาก pairing-store ของ DM
    การจับคู่ยังคงใช้กับ DM เท่านั้น สำหรับกลุ่ม ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` ต่อกลุ่ม/ต่อหัวข้อ
    หากไม่ได้ตั้งค่า `groupAllowFrom`, Telegram จะถอยกลับไปใช้ `allowFrom` จากการกำหนดค่า ไม่ใช่ pairing store
    รูปแบบที่ใช้งานจริงสำหรับบอตที่มีเจ้าของคนเดียว: ตั้งค่า ID ผู้ใช้ของคุณใน `channels.telegram.allowFrom`, ปล่อย `groupAllowFrom` ว่างไว้, และอนุญาตกลุ่มเป้าหมายใต้ `channels.telegram.groups`
    หมายเหตุขณะรัน: หาก `channels.telegram` หายไปทั้งหมด runtime จะใช้ค่าเริ่มต้นแบบปิดเมื่อไม่ผ่าน `groupPolicy="allowlist"` เว้นแต่จะตั้งค่า `channels.defaults.groupPolicy` ไว้อย่างชัดเจน

    การตั้งค่ากลุ่มสำหรับเจ้าของเท่านั้น:

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

    ทดสอบจากกลุ่มด้วย `@<bot_username> ping` ข้อความกลุ่มธรรมดาจะไม่เรียกบอตขณะที่ `requireMention: true`

    ตัวอย่าง: อนุญาตสมาชิกคนใดก็ได้ในกลุ่มเฉพาะหนึ่งกลุ่ม:

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

    ตัวอย่าง: อนุญาตเฉพาะผู้ใช้ที่กำหนดภายในกลุ่มเฉพาะหนึ่งกลุ่ม:

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

      - ใส่ ID แชตของกลุ่มหรือซูเปอร์กรุ๊ป Telegram แบบลบ เช่น `-1001234567890` ใต้ `channels.telegram.groups`
      - ใส่ ID ผู้ใช้ Telegram เช่น `8734062810` ใต้ `groupAllowFrom` เมื่อคุณต้องการจำกัดว่าคนใดภายในกลุ่มที่ได้รับอนุญาตสามารถเรียกบอตได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกคนใดก็ได้ของกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอตได้

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    การตอบกลับในกลุ่มต้องมีการกล่าวถึงโดยค่าเริ่มต้น

    การกล่าวถึงอาจมาจาก:

    - การกล่าวถึง `@botusername` แบบเนทีฟ หรือ
    - รูปแบบการกล่าวถึงใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    การสลับคำสั่งระดับเซสชัน:

    - `/activation always`
    - `/activation mention`

    รายการเหล่านี้อัปเดตเฉพาะสถานะเซสชัน ใช้การกำหนดค่าสำหรับการคงอยู่ถาวร

    ตัวอย่างการกำหนดค่าถาวร:

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

    บริบทประวัติกลุ่มเปิดอยู่เสมอสำหรับกลุ่มและถูกจำกัดด้วย
    `historyLimit` ตั้งค่า `channels.telegram.historyLimit: 0` เพื่อปิดใช้งานหน้าต่างประวัติกลุ่มของ
    Telegram คีย์ `includeGroupHistoryContext` ที่เลิกใช้แล้วจะถูกนำออกโดย `openclaw doctor --fix`

    การหา ID แชตของกลุ่ม:

    - ส่งต่อข้อความกลุ่มไปยัง `@userinfobot` / `@getidsbot`
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจสอบ Bot API `getUpdates`
    - หลังจากอนุญาตกลุ่มแล้ว ให้รัน `/whoami@<bot_username>` หากเปิดใช้งานคำสั่งเนทีฟ

  </Tab>
</Tabs>

## พฤติกรรม runtime

- Telegram อยู่ภายใต้การเป็นเจ้าของของกระบวนการ gateway
- การกำหนดเส้นทางเป็นแบบกำหนดแน่นอน: ข้อความขาเข้าของ Telegram จะตอบกลับไปที่ Telegram (โมเดลไม่ได้เลือกช่องทาง)
- ข้อความขาเข้าจะถูกทำให้เป็นมาตรฐานเป็น envelope ช่องทางร่วม พร้อม metadata การตอบกลับ, placeholder สื่อ และบริบท reply-chain ที่คงอยู่สำหรับการตอบกลับของ Telegram ที่ gateway สังเกตเห็น
- เซสชันกลุ่มถูกแยกด้วย ID กลุ่ม หัวข้อฟอรัมจะต่อท้าย `:topic:<threadId>` เพื่อแยกหัวข้อออกจากกัน
- ข้อความ DM สามารถมี `message_thread_id`; OpenClaw จะรักษาค่านั้นไว้สำหรับการตอบกลับ เซสชันหัวข้อ DM จะแยกเฉพาะเมื่อ Telegram `getMe` รายงาน `has_topics_enabled: true` สำหรับบอตเท่านั้น มิฉะนั้น DM จะอยู่ในเซสชันแบบแบน
- Long polling ใช้ grammY runner พร้อมการจัดลำดับต่อแชต/ต่อเธรด concurrency ของ runner sink โดยรวมใช้ `agents.defaults.maxConcurrent`
- การเริ่มต้นหลายบัญชีจำกัดจำนวน probe Telegram `getMe` ที่ทำพร้อมกัน เพื่อให้ฝูงบอตขนาดใหญ่ไม่กระจาย probe ทุกบัญชีพร้อมกัน
- Long polling ถูกป้องกันภายในแต่ละกระบวนการ gateway เพื่อให้มี poller ที่ใช้งานอยู่เพียงตัวเดียวใช้ bot token ได้ในแต่ละครั้ง หากคุณยังเห็นข้อขัดแย้ง `getUpdates` 409 แสดงว่า gateway ของ OpenClaw ตัวอื่น, สคริปต์ หรือ poller ภายนอกน่าจะกำลังใช้ token เดียวกัน
- การรีสตาร์ทจาก watchdog ของ long-polling จะทริกเกอร์หลังจากไม่มี liveness ของ `getUpdates` ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีโดยค่าเริ่มต้น เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อ deployment ของคุณยังเห็นการรีสตาร์ท polling-stall ที่เป็น false ระหว่างงานที่ทำงานนาน ค่าอยู่ในหน่วยมิลลิวินาทีและอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับการ override ต่อบัญชี
- Telegram Bot API ไม่มีการรองรับ read-receipt (`sendReadReceipts` ใช้ไม่ได้)

<Note>
  `channels.telegram.dm.threadReplies` และ `channels.telegram.direct.<chatId>.threadReplies` ถูกลบแล้ว รัน `openclaw doctor --fix` หลังอัปเกรดหาก config ของคุณยังมี key เหล่านั้น การกำหนดเส้นทางหัวข้อ DM ตอนนี้ตามความสามารถของบอตจาก Telegram `getMe.has_topics_enabled` ซึ่งควบคุมโดยโหมด threaded ของ BotFather: บอตที่เปิดใช้หัวข้อจะใช้เซสชัน DM แบบ scoped ตามเธรดเมื่อ Telegram ส่ง `message_thread_id`; DM อื่นจะอยู่ในเซสชันแบบแบน
</Note>

## อ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="พรีวิวสตรีมสด (การแก้ไขข้อความ)">
    OpenClaw สามารถสตรีมคำตอบบางส่วนแบบเรียลไทม์ได้:

    - แชตโดยตรง: ข้อความพรีวิว + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความพรีวิว + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` คือ `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - พรีวิวคำตอบเริ่มต้นแบบสั้นจะถูก debounce แล้ว materialize หลังจากดีเลย์ที่มีขอบเขต หาก run ยังทำงานอยู่
    - `progress` จะคง draft สถานะที่แก้ไขได้หนึ่งรายการสำหรับความคืบหน้าของเครื่องมือ แสดง label สถานะที่เสถียรเมื่อมีกิจกรรมคำตอบมาถึงก่อนความคืบหน้าของเครื่องมือ ล้างเมื่อเสร็จสมบูรณ์ และส่งคำตอบสุดท้ายเป็นข้อความปกติ
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความพรีวิวที่แก้ไขเดิมซ้ำหรือไม่ (ค่าเริ่มต้น: `true` เมื่อ preview streaming ทำงานอยู่)
    - `streaming.preview.commandText` ควบคุมรายละเอียด command/exec ภายในบรรทัด tool-progress เหล่านั้น: `raw` (ค่าเริ่มต้น, คงพฤติกรรมที่ปล่อยแล้วไว้) หรือ `status` (เฉพาะ label เครื่องมือ)
    - `streaming.progress.commentary` (ค่าเริ่มต้น: `false`) เลือกใช้ข้อความ commentary/preamble ของผู้ช่วยใน draft ความคืบหน้าชั่วคราว
    - legacy `channels.telegram.streamMode`, ค่า boolean ของ `streaming`, และ key พรีวิว native draft ที่เลิกใช้แล้วจะถูกตรวจจับ; รัน `openclaw doctor --fix` เพื่อ migrate ไปยัง config streaming ปัจจุบัน

    การอัปเดตพรีวิว tool-progress คือบรรทัดสถานะแบบสั้นที่แสดงขณะเครื่องมือทำงาน เช่น การรันคำสั่ง, การอ่านไฟล์, การอัปเดตแผน, สรุป patch หรือข้อความ preamble/commentary ของ Codex ในโหมด Codex app-server Telegram เปิดใช้งานสิ่งเหล่านี้ตามค่าเริ่มต้นเพื่อให้ตรงกับพฤติกรรม OpenClaw ที่ปล่อยแล้วตั้งแต่ `v2026.4.22` เป็นต้นไป

    หากต้องการคงพรีวิวที่แก้ไขสำหรับข้อความคำตอบ แต่ซ่อนบรรทัด tool-progress ให้ตั้งค่า:

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

    หากต้องการให้ tool-progress ยังคงมองเห็นได้ แต่ซ่อนข้อความ command/exec ให้ตั้งค่า:

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

    ใช้โหมด `progress` เมื่อคุณต้องการให้เห็นความคืบหน้าของเครื่องมือโดยไม่แก้ไขคำตอบสุดท้ายเข้าไปในข้อความเดียวกันนั้น วางนโยบาย command-text ไว้ใต้ `streaming.progress`:

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

    ใช้ `streaming.mode: "off"` เฉพาะเมื่อคุณต้องการการส่งเฉพาะคำตอบสุดท้าย: การแก้ไขพรีวิวของ Telegram จะถูกปิดใช้งาน และ chatter เครื่องมือ/ความคืบหน้าแบบทั่วไปจะถูกระงับแทนที่จะส่งเป็นข้อความสถานะแยกต่างหาก prompt การอนุมัติ, payload สื่อ และข้อผิดพลาดยังคงส่งผ่านการส่งคำตอบสุดท้ายตามปกติ ใช้ `streaming.preview.toolProgress: false` เมื่อคุณต้องการคงเฉพาะการแก้ไขพรีวิวคำตอบไว้ขณะซ่อนบรรทัดสถานะ tool-progress

    <Note>
      การตอบกลับ quote ที่เลือกใน Telegram เป็นข้อยกเว้น เมื่อ `replyToMode` เป็น `"first"`, `"all"` หรือ `"batched"` และข้อความขาเข้ามีข้อความ quote ที่เลือก OpenClaw จะส่งคำตอบสุดท้ายผ่านเส้นทาง quote-reply native ของ Telegram แทนการแก้ไขพรีวิวคำตอบ ดังนั้น `streaming.preview.toolProgress` จึงไม่สามารถแสดงบรรทัดสถานะแบบสั้นสำหรับ turn นั้นได้ การตอบกลับข้อความปัจจุบันที่ไม่มีข้อความ quote ที่เลือกยังคงใช้ preview streaming ตั้งค่า `replyToMode: "off"` เมื่อความสามารถในการมองเห็น tool-progress สำคัญกว่า native quote replies หรือกำหนด `streaming.preview.toolProgress: false` เพื่อยอมรับ trade-off
    </Note>

    สำหรับการตอบกลับแบบข้อความเท่านั้น:

    - พรีวิว DM/กลุ่ม/หัวข้อแบบสั้น: OpenClaw จะคงข้อความพรีวิวเดิมไว้และทำการแก้ไขสุดท้ายในที่เดิม
    - คำตอบสุดท้ายข้อความยาวที่แบ่งเป็นหลายข้อความ Telegram จะใช้พรีวิวที่มีอยู่เป็น chunk สุดท้าย chunk แรกเมื่อทำได้ แล้วส่งเฉพาะ chunk ที่เหลือ
    - คำตอบสุดท้ายในโหมด progress จะล้าง draft สถานะและใช้การส่งคำตอบสุดท้ายตามปกติแทนการแก้ไข draft ให้เป็นคำตอบ
    - หากการแก้ไขสุดท้ายล้มเหลวก่อนยืนยันข้อความที่เสร็จสมบูรณ์ OpenClaw จะใช้การส่งคำตอบสุดท้ายตามปกติและล้างพรีวิวเก่า

    สำหรับการตอบกลับที่ซับซ้อน (เช่น payload สื่อ) OpenClaw จะ fallback ไปยังการส่งคำตอบสุดท้ายตามปกติ แล้วล้างข้อความพรีวิว

    Preview streaming แยกจาก block streaming เมื่อเปิดใช้ block streaming สำหรับ Telegram อย่างชัดเจน OpenClaw จะข้าม preview stream เพื่อหลีกเลี่ยงการสตรีมซ้ำ

    พฤติกรรม reasoning stream:

    - `/reasoning stream` ใช้เส้นทาง reasoning-preview ของช่องทางที่รองรับ; บน Telegram จะสตรีม reasoning เข้าไปในพรีวิวสดขณะสร้างคำตอบ
    - พรีวิว reasoning จะถูกลบหลังจากส่งคำตอบสุดท้าย; ใช้ `/reasoning on` เมื่อควรให้ reasoning ยังคงมองเห็นได้
    - คำตอบสุดท้ายถูกส่งโดยไม่มีข้อความ reasoning

  </Accordion>

  <Accordion title="การจัดรูปแบบข้อความแบบ rich">
    ข้อความขาออกใช้ข้อความ HTML มาตรฐานของ Telegram ตามค่าเริ่มต้น เพื่อให้คำตอบยังอ่านได้ในไคลเอนต์ Telegram ปัจจุบัน โหมดความเข้ากันได้นี้รองรับตัวหนา ตัวเอียง ลิงก์ โค้ด spoilers และ quotes ปกติ แต่ไม่รองรับบล็อกเฉพาะ rich ของ Bot API 10.1 เช่น ตาราง native, details, rich media และสูตร

    ตั้งค่า `channels.telegram.richMessages: true` เพื่อเลือกใช้ข้อความ rich ของ Bot API 10.1:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    เมื่อเปิดใช้งาน:

    - agent จะได้รับแจ้งว่าข้อความ rich ของ Telegram พร้อมใช้งานสำหรับบอต/บัญชีนี้
    - ข้อความ Markdown จะถูก render ผ่าน Markdown IR ของ OpenClaw และส่งเป็น HTML rich ของ Telegram
    - payload HTML rich แบบชัดเจนจะรักษา tag Bot API 10.1 ที่รองรับ เช่น heading, table, details, rich media และ formula
    - caption สื่อยังคงใช้ caption HTML ของ Telegram เพราะข้อความ rich ไม่ได้แทนที่ caption

    สิ่งนี้กันข้อความของโมเดลออกจาก sigil ของ Telegram Rich Markdown ดังนั้นสกุลเงินอย่าง `$400-600K` จะไม่ถูก parse เป็นคณิตศาสตร์ ข้อความ rich ยาวจะถูกแบ่งโดยอัตโนมัติตามขีดจำกัด rich text และ rich block ของ Telegram ตารางที่เกินขีดจำกัดจำนวนคอลัมน์ของ Telegram จะถูกส่งเป็น code block

    ค่าเริ่มต้น: ปิดเพื่อความเข้ากันได้กับไคลเอนต์ ข้อความ rich ต้องใช้ไคลเอนต์ Telegram ที่เข้ากันได้; ไคลเอนต์ Desktop, Web, Android และ third-party ปัจจุบันบางตัวแสดงข้อความ rich ที่ยอมรับแล้วว่าไม่รองรับ ปิดตัวเลือกนี้ไว้ เว้นแต่ไคลเอนต์ทุกตัวที่ใช้กับบอตสามารถ render ได้ `/status` แสดงว่าเซสชัน Telegram ปัจจุบันเปิดหรือปิดข้อความ rich อยู่

    Link previews เปิดใช้งานตามค่าเริ่มต้น `channels.telegram.linkPreview: false` ข้ามการตรวจจับ entity อัตโนมัติสำหรับ rich text

  </Accordion>

  <Accordion title="คำสั่ง native และคำสั่งกำหนดเอง">
    การลงทะเบียนเมนูคำสั่งของ Telegram จัดการตอนเริ่มต้นด้วย `setMyCommands`

    ค่าเริ่มต้นของคำสั่ง native:

    - `commands.native: "auto"` เปิดใช้คำสั่ง native สำหรับ Telegram

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

    - ชื่อจะถูก normalize (ตัด `/` ด้านหน้าออก, แปลงเป็นตัวพิมพ์เล็ก)
    - รูปแบบที่ถูกต้อง: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งกำหนดเองไม่สามารถ override คำสั่ง native
    - ข้อขัดแย้ง/รายการซ้ำจะถูกข้ามและบันทึก log

    หมายเหตุ:

    - คำสั่งกำหนดเองเป็นเพียงรายการเมนูเท่านั้น; ไม่ได้ implement พฤติกรรมโดยอัตโนมัติ
    - คำสั่ง plugin/skill ยังทำงานได้เมื่อพิมพ์ แม้ไม่ได้แสดงในเมนู Telegram

    หากปิดใช้คำสั่ง native คำสั่ง built-in จะถูกลบ Custom/plugin commands อาจยังลงทะเบียนได้หากกำหนดค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังล้นหลังจากตัดออกแล้ว; ลดคำสั่ง plugin/skill/custom หรือปิดใช้งาน `channels.telegram.commands.native`
    - `deleteWebhook`, `deleteMyCommands` หรือ `setMyCommands` ล้มเหลวพร้อม `404: Not Found` ขณะที่คำสั่ง curl ของ Bot API โดยตรงทำงานได้ อาจหมายความว่า `channels.telegram.apiRoot` ถูกตั้งเป็น endpoint เต็ม `/bot<TOKEN>` แล้ว `apiRoot` ต้องเป็นเฉพาะ root ของ Bot API เท่านั้น และ `openclaw doctor --fix` จะลบ `/bot<TOKEN>` ที่ต่อท้ายโดยไม่ตั้งใจ
    - `getMe returned 401` หมายความว่า Telegram ปฏิเสธ bot token ที่กำหนดค่าไว้ อัปเดต `botToken`, `tokenFile` หรือ `TELEGRAM_BOT_TOKEN` ด้วย token ปัจจุบันจาก BotFather; OpenClaw จะหยุดก่อน polling ดังนั้นสิ่งนี้จะไม่ถูกรายงานเป็นความล้มเหลวของ webhook cleanup
    - `setMyCommands failed` พร้อมข้อผิดพลาด network/fetch มักหมายความว่า outbound DNS/HTTPS ไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งจับคู่อุปกรณ์ (plugin `device-pair`)

    เมื่อติดตั้ง plugin `device-pair`:

    1. `/pair` สร้าง setup code
    2. วาง code ในแอป iOS
    3. `/pair pending` แสดงรายการคำขอที่รอดำเนินการ (รวม role/scopes)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    setup code มี bootstrap token อายุสั้น bootstrap ด้วย setup-code ในตัวจะคืนค่า durable node token พร้อม `scopes: []` รวมถึง operator handoff token ที่มีขอบเขตสำหรับการ onboarding มือถือที่เชื่อถือได้ operator token นั้นสามารถอ่านการกำหนดค่า native ณ เวลาตั้งค่าได้ แต่ไม่ให้ scope การเปลี่ยนแปลงการจับคู่หรือ `operator.admin`

    หากอุปกรณ์ลองใหม่ด้วยรายละเอียด auth ที่เปลี่ยนไป (เช่น role/scopes/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` คนละค่า รัน `/pair pending` อีกครั้งก่อนอนุมัติ

    รายละเอียดเพิ่มเติม: [การจับคู่](/th/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="ปุ่มแบบอินไลน์">
    กำหนดค่าสโคปของคีย์บอร์ดแบบอินไลน์:

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

    การแทนที่ค่าต่อบัญชี:

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

    สโคป:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (ค่าเริ่มต้น)

    `capabilities: ["inlineButtons"]` แบบเดิมจะแมปไปยัง `inlineButtons: "all"`

    ตัวอย่างแอ็กชันข้อความ:

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

    ตัวอย่างปุ่ม Mini App:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    ปุ่ม `web_app` ของ Telegram ทำงานได้เฉพาะในแชตส่วนตัวระหว่างผู้ใช้กับ
    บอตเท่านั้น

    การคลิก callback ที่ไม่ได้ถูกอ้างสิทธิ์โดย handler แบบอินเทอร์แอ็กทีฟของ Plugin
    ที่ลงทะเบียนไว้ จะถูกส่งต่อให้เอเจนต์เป็นข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="แอ็กชันข้อความ Telegram สำหรับเอเจนต์และระบบอัตโนมัติ">
    แอ็กชันเครื่องมือ Telegram ประกอบด้วย:

    - `sendMessage` (`to`, `content`, `mediaUrl` แบบไม่บังคับ, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` หรือ `caption`, ปุ่มอินไลน์ `presentation` แบบไม่บังคับ; การแก้ไขเฉพาะปุ่มจะอัปเดต reply markup)
    - `createForumTopic` (`chatId`, `name`, `iconColor` แบบไม่บังคับ, `iconCustomEmojiId`)

    แอ็กชันข้อความของช่องทางเปิดเผยนามแฝงที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    การควบคุมการเปิดใช้:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้งาน)

    หมายเหตุ: ปัจจุบัน `edit` และ `topic-create` เปิดใช้งานตามค่าเริ่มต้น และไม่มี toggle `channels.telegram.actions.*` แยกต่างหาก
    การส่งขณะรันไทม์ใช้สแนปช็อต config/secrets ที่ใช้งานอยู่ (ตอนเริ่มต้น/โหลดใหม่) ดังนั้นพาธของแอ็กชันจึงไม่ทำการแก้ค่า SecretRef ใหม่แบบเฉพาะกิจต่อการส่งแต่ละครั้ง

    ความหมายของการลบรีแอ็กชัน: [/tools/reactions](/th/tools/reactions)

  </Accordion>

  <Accordion title="แท็กเธรดการตอบกลับ">
    Telegram รองรับแท็กเธรดการตอบกลับแบบชัดเจนในเอาต์พุตที่สร้างขึ้น:

    - `[[reply_to_current]]` ตอบกลับข้อความที่ทริกเกอร์
    - `[[reply_to:<id>]]` ตอบกลับ ID ข้อความ Telegram ที่ระบุ

    `channels.telegram.replyToMode` ควบคุมการจัดการ:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`

    เมื่อเปิดใช้เธรดการตอบกลับและมีข้อความหรือคำบรรยายต้นฉบับของ Telegram อยู่ OpenClaw จะใส่ข้อความอ้างอิงของ Telegram แบบเนทีฟให้โดยอัตโนมัติ Telegram จำกัดข้อความอ้างอิงแบบเนทีฟไว้ที่ 1024 หน่วยรหัส UTF-16 ดังนั้นข้อความที่ยาวกว่าจะถูกอ้างอิงจากช่วงต้นและถอยกลับไปเป็นการตอบกลับแบบธรรมดาหาก Telegram ปฏิเสธข้อความอ้างอิงนั้น

    หมายเหตุ: `off` ปิดใช้งานเธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงถูกใช้งาน

  </Accordion>

  <Accordion title="หัวข้อฟอรัมและพฤติกรรมของเธรด">
    ซูเปอร์กรุ๊ปแบบฟอรัม:

    - คีย์เซสชันของหัวข้อจะต่อท้ายด้วย `:topic:<threadId>`
    - การตอบกลับและการแสดงสถานะกำลังพิมพ์จะกำหนดเป้าหมายไปที่เธรดของหัวข้อ
    - พาธ config ของหัวข้อ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของหัวข้อทั่วไป (`threadId=1`):

    - การส่งข้อความจะละ `message_thread_id` (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - แอ็กชันกำลังพิมพ์ยังคงใส่ `message_thread_id`

    การสืบทอดของหัวข้อ: รายการหัวข้อจะสืบทอดการตั้งค่าของกลุ่ม เว้นแต่จะถูกแทนที่ (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` ใช้เฉพาะหัวข้อและไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม
    `topics."*"` ตั้งค่าเริ่มต้นให้ทุกหัวข้อในกลุ่มนั้น; ID หัวข้อที่ตรงกันแบบเจาะจงยังคงมีผลเหนือ `"*"`

    **การกำหนดเส้นทางเอเจนต์ต่อหัวข้อ**: แต่ละหัวข้อสามารถกำหนดเส้นทางไปยังเอเจนต์คนละตัวได้ด้วยการตั้งค่า `agentId` ใน config ของหัวข้อ สิ่งนี้ทำให้แต่ละหัวข้อมีพื้นที่ทำงาน หน่วยความจำ และเซสชันที่แยกจากกันของตัวเอง ตัวอย่าง:

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

    **การผูกหัวข้อ ACP แบบถาวร**: หัวข้อฟอรัมสามารถตรึงเซสชัน harness ของ ACP ผ่านการผูก ACP แบบมีชนิดที่ระดับบนสุด (`bindings[]` พร้อม `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ id ที่ระบุหัวข้อ เช่น `-1001234567890:topic:42`) ปัจจุบันจำกัดสโคปไว้ที่หัวข้อฟอรัมในกลุ่ม/ซูเปอร์กรุ๊ป ดู [เอเจนต์ ACP](/th/tools/acp-agents)

    **การ spawn ACP ที่ผูกกับเธรดจากแชต**: `/acp spawn <agent> --thread here|auto` ผูกหัวข้อปัจจุบันกับเซสชัน ACP ใหม่; การติดตามผลจะกำหนดเส้นทางไปที่นั่นโดยตรง OpenClaw จะตรึงการยืนยันการ spawn ไว้ในหัวข้อ ต้องให้ `channels.telegram.threadBindings.spawnSessions` ยังคงเปิดใช้งานอยู่ (ค่าเริ่มต้น: `true`)

    บริบทเทมเพลตเปิดเผย `MessageThreadId` และ `IsForum` แชต DM ที่มี `message_thread_id` จะเก็บ metadata การตอบกลับไว้; แชตเหล่านั้นจะใช้คีย์เซสชันที่รับรู้เธรดก็ต่อเมื่อ Telegram `getMe` รายงาน `has_topics_enabled: true` สำหรับบอต
    การแทนที่ `dm.threadReplies` และ `direct.*.threadReplies` เดิมถูกเลิกใช้อย่างตั้งใจ; ใช้โหมด threaded ของ BotFather เป็นแหล่งความจริงเดียว และรัน `openclaw doctor --fix` เพื่อลบคีย์ config ที่ล้าสมัย

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยกความแตกต่างระหว่าง voice note กับไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมแบบไฟล์เสียง
    - แท็ก `[[audio_as_voice]]` ในการตอบกลับของเอเจนต์เพื่อบังคับให้ส่งเป็น voice note
    - transcript ของ voice note ขาเข้าจะถูกจัดกรอบเป็นข้อความที่เครื่องสร้างขึ้น
      ซึ่งไม่น่าเชื่อถือในบริบทของเอเจนต์; การตรวจจับการกล่าวถึงยังคงใช้
      transcript ดิบ ดังนั้นข้อความเสียงที่ถูกจำกัดด้วยการกล่าวถึงจึงยังทำงานต่อไป

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

    Telegram แยกไฟล์วิดีโอออกจากวิดีโอโน้ต

    ตัวอย่างการกระทำของข้อความ:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    วิดีโอโน้ตไม่รองรับคำบรรยาย ข้อความที่ให้มาจะถูกส่งแยกต่างหาก

    ### สติกเกอร์

    การจัดการสติกเกอร์ขาเข้า:

    - WEBP แบบสแตติก: ดาวน์โหลดและประมวลผลแล้ว (ตัวยึดตำแหน่ง `<media:sticker>`)
    - TGS แบบเคลื่อนไหว: ข้าม
    - WEBM แบบวิดีโอ: ข้าม

    ฟิลด์บริบทของสติกเกอร์:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    คำอธิบายสติกเกอร์ถูกแคชไว้ในสถานะ Plugin ของ OpenClaw SQLite เพื่อลดการเรียกวิชันซ้ำ

    เปิดใช้การกระทำสติกเกอร์:

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

    การกระทำส่งสติกเกอร์:

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
    ปฏิกิริยาของ Telegram มาถึงเป็นการอัปเดต `message_reaction` (แยกจากเพย์โหลดข้อความ)

    เมื่อเปิดใช้ OpenClaw จะจัดคิวเหตุการณ์ระบบ เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    การกำหนดค่า:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงปฏิกิริยาของผู้ใช้ต่อข้อความที่บอตส่งเท่านั้น (พยายามให้ดีที่สุดผ่านแคชข้อความที่ส่ง)
    - เหตุการณ์ปฏิกิริยายังคงเคารพการควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ให้ ID เธรดในการอัปเดตปฏิกิริยา
      - กลุ่มที่ไม่ใช่ฟอรัมจะกำหนดเส้นทางไปยังเซสชันแชตกลุ่ม
      - กลุ่มฟอรัมจะกำหนดเส้นทางไปยังเซสชันหัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อต้นทางที่แน่นอน

    `allowed_updates` สำหรับการโพล/Webhook จะรวม `message_reaction` โดยอัตโนมัติ

  </Accordion>

  <Accordion title="ปฏิกิริยา ack">
    `ackReaction` ส่งอีโมจิตอบรับขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า `ackReactionScope` ตัดสินว่าอีโมจินั้นจะถูกส่งจริง *เมื่อใด*

    **ลำดับการแก้ค่าอีโมจิ (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - ทางเลือกสำรองอีโมจิของตัวตนเอเจนต์ (`agents.list[].identity.emoji` มิฉะนั้นใช้ "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิยูนิโค้ด (เช่น "👀")
    - ใช้ `""` เพื่อปิดใช้ปฏิกิริยาสำหรับช่องทางหรือบัญชี

    **ขอบเขต (`messages.ackReactionScope`):**

    ผู้ให้บริการ Telegram อ่านขอบเขตจาก `messages.ackReactionScope` (ค่าเริ่มต้น `"group-mentions"`) ปัจจุบันยังไม่มีการแทนที่ระดับบัญชี Telegram หรือระดับช่องทาง Telegram

    ค่า: `"all"` (DM + กลุ่ม), `"direct"` (DM เท่านั้น), `"group-all"` (ทุกข้อความกลุ่ม ไม่มี DM), `"group-mentions"` (กลุ่มเมื่อมีการกล่าวถึงบอต; **ไม่มี DM** — นี่คือค่าเริ่มต้น), `"off"` / `"none"` (ปิดใช้)

    <Note>
    ขอบเขตเริ่มต้น (`"group-mentions"`) จะไม่เรียกใช้ปฏิกิริยา ack ในข้อความโดยตรง หากต้องการให้มีปฏิกิริยา ack ใน DM ขาเข้าของ Telegram ให้ตั้ง `messages.ackReactionScope` เป็น `"direct"` หรือ `"all"` ค่านี้ถูกอ่านเมื่อผู้ให้บริการ Telegram เริ่มทำงาน ดังนั้นต้องรีสตาร์ท Gateway เพื่อให้การเปลี่ยนแปลงมีผล
    </Note>

  </Accordion>

  <Accordion title="การเขียนการกำหนดค่าจากเหตุการณ์และคำสั่งของ Telegram">
    การเขียนการกำหนดค่าช่องทางเปิดใช้เป็นค่าเริ่มต้น (`configWrites !== false`)

    การเขียนที่ถูกเรียกจาก Telegram รวมถึง:

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

  <Accordion title="การโพลแบบยาวเทียบกับ Webhook">
    ค่าเริ่มต้นคือการโพลแบบยาว สำหรับโหมด Webhook ให้ตั้ง `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; ตัวเลือกเสริมคือ `webhookPath`, `webhookHost`, `webhookPort` (ค่าเริ่มต้น `/telegram-webhook`, `127.0.0.1`, `8787`)

    ในโหมดการโพลแบบยาว OpenClaw จะคงลายน้ำการรีสตาร์ทไว้หลังจากการอัปเดตถูกจัดส่งสำเร็จเท่านั้น หากตัวจัดการล้มเหลว การอัปเดตนั้นจะยังลองซ้ำได้ในกระบวนการเดียวกัน และจะไม่ถูกเขียนว่าเสร็จสมบูรณ์สำหรับการตัดรายการซ้ำเมื่อรีสตาร์ท

    ตัวรับฟังภายในเครื่องผูกกับ `127.0.0.1:8787` สำหรับทางเข้าสาธารณะ ให้ใส่พร็อกซีย้อนกลับไว้หน้าพอร์ตภายในเครื่อง หรือตั้ง `webhookHost: "0.0.0.0"` โดยตั้งใจ

    โหมด Webhook ตรวจสอบตัวป้องกันคำขอ โทเค็นลับของ Telegram และเนื้อหา JSON ก่อนส่งคืน `200` ให้ Telegram
    จากนั้น OpenClaw จะประมวลผลการอัปเดตแบบอะซิงโครนัสผ่านเลนบอตต่อแชต/ต่อหัวข้อเดียวกับที่ใช้โดยการโพลแบบยาว ดังนั้นเทิร์นเอเจนต์ที่ช้าจะไม่หน่วง ACK การส่งมอบของ Telegram

  </Accordion>

  <Accordion title="ขีดจำกัด การลองใหม่ และเป้าหมาย CLI">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` จะเลือกขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนการแบ่งตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ขาเข้าและขาออก
    - `channels.telegram.mediaGroupFlushMs` (ค่าเริ่มต้น 500) ควบคุมระยะเวลาที่อัลบั้ม/กลุ่มสื่อ Telegram ถูกบัฟเฟอร์ก่อนที่ OpenClaw จะส่งเป็นข้อความขาเข้าหนึ่งข้อความ เพิ่มค่านี้หากส่วนของอัลบั้มมาถึงช้า ลดค่านี้เพื่อลดเวลาแฝงของการตอบกลับอัลบั้ม
    - `channels.telegram.timeoutSeconds` แทนที่ timeout ของไคลเอนต์ Telegram API (หากไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY) ไคลเอนต์บอตจะจำกัดค่าที่ตั้งไว้ให้ต่ำกว่า guard คำขอข้อความขาออก/typing 60 วินาที เพื่อให้ grammY ไม่ยกเลิกการส่งคำตอบที่มองเห็นได้ก่อนที่ transport guard และ fallback ของ OpenClaw จะทำงานได้ Long polling ยังคงใช้ guard คำขอ `getUpdates` 45 วินาที เพื่อไม่ให้การ poll ขณะว่างถูกทิ้งไว้อย่างไม่มีกำหนด
    - ค่าเริ่มต้นของ `channels.telegram.pollingStallThresholdMs` คือ `120000`; ปรับระหว่าง `30000` ถึง `600000` เฉพาะสำหรับการรีสตาร์ตจาก polling-stall ที่เป็น false positive
    - ประวัติบริบทของกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` ปิดใช้งาน
    - บริบทเสริมของการตอบกลับ/อ้างอิง/ส่งต่อจะถูก normalize เป็นหน้าต่างบริบทบทสนทนาที่เลือกหนึ่งรายการเมื่อ gateway เคยเห็นข้อความแม่แล้ว แคชข้อความที่สังเกตเห็นอยู่ในสถานะ Plugin SQLite ของ OpenClaw และ `openclaw doctor --fix` จะนำเข้า sidecar เดิม Telegram รวม `reply_to_message` แบบตื้นเพียงหนึ่งรายการในการอัปเดต ดังนั้นสายข้อความที่เก่ากว่าแคชจะถูกจำกัดตาม payload การอัปเดตปัจจุบันของ Telegram
    - allowlist ของ Telegram มีไว้หลัก ๆ เพื่อควบคุมว่าใครสามารถเรียก agent ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบเต็ม
    - การควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - การกำหนดค่า `channels.telegram.retry` ใช้กับตัวช่วยส่ง Telegram (CLI/tools/actions) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้ การส่งคำตอบสุดท้ายขาเข้ายังใช้การลองใหม่แบบ safe-send ที่มีขอบเขตสำหรับความล้มเหลวก่อนเชื่อมต่อของ Telegram แต่จะไม่ลองใหม่กับ envelope เครือข่ายหลังส่งที่กำกวมซึ่งอาจทำให้ข้อความที่มองเห็นได้ซ้ำกัน

    เป้าหมายการส่งของ CLI และ message-tool สามารถเป็น ID แชตแบบตัวเลข username หรือเป้าหมายหัวข้อ forum:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    การ poll ของ Telegram ใช้ `openclaw message poll` และรองรับหัวข้อ forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    flag สำหรับ poll เฉพาะ Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` สำหรับหัวข้อ forum (หรือใช้เป้าหมาย `:topic:`)

    การส่งผ่าน Telegram ยังรองรับ:

    - `--presentation` พร้อมบล็อก `buttons` สำหรับ inline keyboard เมื่อ `channels.telegram.capabilities.inlineButtons` อนุญาต
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอการส่งแบบปักหมุดเมื่อบอตสามารถปักหมุดในแชตนั้นได้
    - `--force-document` เพื่อส่งรูปภาพ GIF และวิดีโอขาออกเป็นเอกสารแทนการอัปโหลดแบบรูปภาพที่ถูกบีบอัด สื่อเคลื่อนไหว หรือวิดีโอ

    การควบคุม action:

    - `channels.telegram.actions.sendMessage=false` ปิดใช้งานข้อความ Telegram ขาออก รวมถึง poll
    - `channels.telegram.actions.poll=false` ปิดใช้งานการสร้าง poll ของ Telegram โดยยังคงเปิดใช้งานการส่งปกติ

  </Accordion>

  <Accordion title="การอนุมัติ exec ใน Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถโพสต์ prompt ในแชตหรือหัวข้อต้นทางได้ตามต้องการ ผู้อนุมัติต้องเป็น ID ผู้ใช้ Telegram แบบตัวเลข

    เส้นทาง config:

    - `channels.telegram.execApprovals.enabled` (เปิดใช้งานอัตโนมัติเมื่อ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งราย)
    - `channels.telegram.execApprovals.approvers` (fallback เป็น ID เจ้าของแบบตัวเลขจาก `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` และ `defaultTo` ควบคุมว่าใครสามารถคุยกับบอตได้และบอตส่งคำตอบปกติไปที่ใด สิ่งเหล่านี้ไม่ได้ทำให้ใครเป็นผู้อนุมัติ exec การจับคู่ DM ที่ได้รับอนุมัติครั้งแรกจะ bootstrap `commands.ownerAllowFrom` เมื่อยังไม่มีเจ้าของคำสั่ง ดังนั้นการตั้งค่าแบบเจ้าของหนึ่งรายยังคงทำงานได้โดยไม่ต้องทำ ID ซ้ำใต้ `execApprovals.approvers`

    การส่งไปยัง channel จะแสดงข้อความคำสั่งในแชต เปิดใช้งาน `channel` หรือ `both` เฉพาะในกลุ่ม/หัวข้อที่เชื่อถือได้ เมื่อ prompt ไปถึงหัวข้อ forum, OpenClaw จะรักษาหัวข้อไว้สำหรับ prompt การอนุมัติและข้อความติดตามผล การอนุมัติ exec จะหมดอายุหลัง 30 นาทีโดยค่าเริ่มต้น

    ปุ่มอนุมัติแบบ inline ยังต้องให้ `channels.telegram.capabilities.inlineButtons` อนุญาต surface เป้าหมาย (`dm`, `group` หรือ `all`) ID การอนุมัติที่ขึ้นต้นด้วย `plugin:` จะ resolve ผ่านการอนุมัติของ Plugin ส่วนรายการอื่นจะ resolve ผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## การควบคุมคำตอบข้อผิดพลาด

เมื่อ agent พบข้อผิดพลาดในการส่งหรือ provider นโยบายข้อผิดพลาดจะควบคุมว่าจะส่งข้อความข้อผิดพลาดไปยังแชต Telegram หรือไม่:

| คีย์                                 | ค่า                       | ค่าเริ่มต้น      | คำอธิบาย                                                                                                                                                                                               |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — ส่งทุกข้อความข้อผิดพลาดไปยังแชต `once` — ส่งข้อความข้อผิดพลาดที่ไม่ซ้ำกันแต่ละรายการหนึ่งครั้งต่อช่วง cooldown (ระงับข้อผิดพลาดที่เหมือนกันซ้ำ ๆ) `silent` — ไม่ส่งข้อความข้อผิดพลาดไปยังแชต |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | ช่วง cooldown สำหรับนโยบาย `once` หลังจากส่งข้อผิดพลาดแล้ว ข้อความข้อผิดพลาดเดียวกันจะถูกระงับจนกว่าช่วงเวลานี้จะผ่านไป ป้องกันสแปมข้อผิดพลาดระหว่าง outage                                      |

รองรับการ override แบบต่อบัญชี ต่อกลุ่ม และต่อหัวข้อ (ใช้การสืบทอดเดียวกับคีย์ config อื่นของ Telegram)

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
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
  <Accordion title="บอตไม่ตอบสนองต่อข้อความกลุ่มที่ไม่ได้ mention">

    - หาก `requireMention=false` โหมด privacy ของ Telegram ต้องอนุญาตการมองเห็นแบบเต็ม
      - BotFather: `/setprivacy` -> Disable
      - จากนั้นลบและเพิ่มบอตกลับเข้ากลุ่ม
    - `openclaw channels status` เตือนเมื่อ config คาดหวังข้อความกลุ่มที่ไม่ได้ mention
    - `openclaw channels status --probe` สามารถตรวจสอบ ID กลุ่มแบบตัวเลขที่ระบุชัดเจนได้ wildcard `"*"` ไม่สามารถ probe membership ได้
    - การทดสอบเซสชันแบบเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอตไม่เห็นข้อความกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` กลุ่มต้องถูกระบุไว้ (หรือรวม `"*"`)
    - ตรวจสอบ membership ของบอตในกลุ่ม
    - ตรวจสอบ log: `openclaw logs --follow` เพื่อดูเหตุผลการข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานบางส่วนหรือไม่ทำงานเลย">

    - อนุญาตตัวตนผู้ส่งของคุณ (การจับคู่และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังคงมีผลแม้นโยบายกลุ่มจะเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู native มีรายการมากเกินไป ลดคำสั่ง Plugin/skill/custom หรือปิดใช้งานเมนู native
    - การเรียก startup ของ `deleteMyCommands` / `setMyCommands` และการเรียก typing ของ `sendChatAction` มีขอบเขตและลองใหม่หนึ่งครั้งผ่าน transport fallback ของ Telegram เมื่อ request timeout ข้อผิดพลาด network/fetch ที่เกิดอย่างต่อเนื่องมักบ่งชี้ปัญหาการเข้าถึง DNS/HTTPS ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="Startup รายงาน token ไม่ได้รับอนุญาต">

    - `getMe returned 401` คือความล้มเหลวในการยืนยันตัวตนของ Telegram สำหรับ token บอตที่กำหนดค่าไว้
    - คัดลอกใหม่หรือสร้าง token บอตใหม่ใน BotFather จากนั้นอัปเดต `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` หรือ `TELEGRAM_BOT_TOKEN` สำหรับบัญชีเริ่มต้น
    - `deleteWebhook 401 Unauthorized` ระหว่าง startup ก็เป็นความล้มเหลวด้าน auth เช่นกัน การถือว่ามันเป็น "ไม่มี webhook อยู่" จะเพียงเลื่อนความล้มเหลวจาก bad-token เดิมไปยังการเรียก API ภายหลัง

  </Accordion>

  <Accordion title="Polling หรือเครือข่ายไม่เสถียร">

    - Node 22+ พร้อม custom fetch/proxy อาจทำให้เกิดพฤติกรรม abort ทันทีหากชนิด AbortSignal ไม่ตรงกัน
    - โฮสต์บางตัว resolve `api.telegram.org` เป็น IPv6 ก่อน; IPv6 egress ที่เสียอาจทำให้ Telegram API ล้มเหลวเป็นครั้งคราว
    - หาก log มี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!` ตอนนี้ OpenClaw จะลองใหม่กับข้อผิดพลาดเครือข่ายเหล่านี้ในฐานะข้อผิดพลาดที่กู้คืนได้
    - ระหว่าง polling startup, OpenClaw จะใช้ probe `getMe` จาก startup ที่สำเร็จซ้ำสำหรับ grammY เพื่อให้ runner ไม่ต้องใช้ `getMe` ครั้งที่สองก่อน `getUpdates` ครั้งแรก
    - หาก `deleteWebhook` ล้มเหลวด้วยข้อผิดพลาดเครือข่ายชั่วคราวระหว่าง polling startup, OpenClaw จะเข้าสู่ long polling ต่อไปแทนการเรียก control-plane ก่อน poll อีกครั้ง webhook ที่ยัง active จะแสดงเป็น conflict ของ `getUpdates`; จากนั้น OpenClaw จะสร้าง transport ของ Telegram ใหม่และลอง cleanup webhook อีกครั้ง
    - หาก socket ของ Telegram recycle ตามจังหวะคงที่สั้น ๆ ให้ตรวจสอบว่า `channels.telegram.timeoutSeconds` ต่ำหรือไม่ ไคลเอนต์บอตจะจำกัดค่าที่ตั้งไว้ให้ต่ำกว่า guard ของคำขอขาออกและ `getUpdates` แต่ release เก่าอาจ abort ทุก poll หรือ reply เมื่อค่านี้ถูกตั้งต่ำกว่า guard เหล่านั้น
    - หาก log มี `Polling stall detected`, OpenClaw จะรีสตาร์ต polling และสร้าง transport ของ Telegram ใหม่หลังจากไม่มี liveness ของ long-poll ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีโดยค่าเริ่มต้น
    - `openclaw channels status --probe` และ `openclaw doctor` เตือนเมื่อบัญชี polling ที่กำลังทำงานยังไม่ทำ `getUpdates` เสร็จหลัง startup grace เมื่อบัญชี webhook ที่กำลังทำงานยังไม่ทำ `setWebhook` เสร็จหลัง startup grace หรือเมื่อกิจกรรม transport polling ที่สำเร็จล่าสุดเก่าเกินไป
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่ใช้เวลานานยังปกติ แต่โฮสต์ของคุณยังรายงานการรีสตาร์ตจาก polling-stall แบบ false ปัญหา stall ต่อเนื่องมักชี้ไปที่ปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่างโฮสต์กับ `api.telegram.org`
    - Telegram ยังเคารพ env proxy ของ process สำหรับ transport ของ Bot API รวมถึง `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และรูปแบบตัวพิมพ์เล็กของค่าเหล่านั้น `NO_PROXY` / `no_proxy` ยังสามารถ bypass `api.telegram.org` ได้
    - หาก proxy ที่ OpenClaw จัดการถูกกำหนดค่าผ่าน `OPENCLAW_PROXY_URL` สำหรับสภาพแวดล้อมบริการ และไม่มี env proxy มาตรฐาน Telegram จะใช้ URL นั้นสำหรับ transport ของ Bot API ด้วย
    - บนโฮสต์ VPS ที่ direct egress/TLS ไม่เสถียร ให้ route การเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ มีค่าเริ่มต้นเป็น `autoSelectFamily=true` (ยกเว้น WSL2) ลำดับผลลัพธ์ DNS ของ Telegram จะทำตาม `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER` จากนั้น `channels.telegram.network.dnsResultOrder` จากนั้นค่าเริ่มต้นของโปรเซส เช่น `NODE_OPTIONS=--dns-result-order=ipv4first`; หากไม่มีข้อใดใช้ได้ Node 22+ จะถอยกลับไปใช้ `ipv4first`
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนเมื่อใช้พฤติกรรมแบบ IPv4 เท่านั้น ให้บังคับการเลือกแฟมิลี:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบในช่วงเบนช์มาร์ก RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาตแล้ว
      สำหรับการดาวน์โหลดสื่อ Telegram ตามค่าเริ่มต้น หาก IP ปลอมที่เชื่อถือได้หรือ
      พร็อกซีแบบโปร่งใสเขียน `api.telegram.org` ใหม่เป็นที่อยู่
      ส่วนตัว/ภายใน/ใช้งานพิเศษอื่นระหว่างการดาวน์โหลดสื่อ คุณสามารถเลือกเปิดใช้
      การข้ามเฉพาะ Telegram ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - การเลือกเปิดใช้แบบเดียวกันมีให้ใช้รายบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หากพร็อกซีของคุณแปลงโฮสต์สื่อ Telegram เป็น `198.18.x.x` ให้ปิด
      แฟล็กอันตรายไว้ก่อน สื่อ Telegram อนุญาตช่วงเบนช์มาร์ก RFC 2544
      ตามค่าเริ่มต้นอยู่แล้ว

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` ทำให้การป้องกัน SSRF
      ของสื่อ Telegram อ่อนลง ใช้เฉพาะในสภาพแวดล้อมพร็อกซีที่เชื่อถือได้และควบคุมโดยผู้ปฏิบัติงาน
      เช่น การกำหนดเส้นทาง IP ปลอมของ Clash, Mihomo หรือ Surge เมื่อเครื่องมือเหล่านั้น
      สร้างคำตอบส่วนตัวหรือใช้งานพิเศษนอกช่วงเบนช์มาร์ก RFC 2544
      ปิดไว้สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ
    </Warning>

    - การเขียนทับผ่านสภาพแวดล้อม (ชั่วคราว):
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

<Accordion title="High-signal Telegram fields">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; symlinks จะถูกปฏิเสธ)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- ค่าเริ่มต้นของหัวข้อ: `groups.<chatId>.topics."*"` ใช้กับหัวข้อฟอรัมที่ไม่ตรงกัน; ID หัวข้อแบบตรงจะเขียนทับค่าเริ่มต้นนี้
- การอนุมัติการสั่งรัน: `execApprovals`, `accounts.*.execApprovals`
- คำสั่ง/เมนู: `commands.native`, `commands.nativeSkills`, `customCommands`
- เธรด/การตอบกลับ: `replyToMode`
- การสตรีม: `streaming` (ตัวอย่าง), `streaming.preview.toolProgress`, `blockStreaming`
- การจัดรูปแบบ/การส่งมอบ: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- สื่อ/เครือข่าย: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- ราก API แบบกำหนดเอง: `apiRoot` (ราก Bot API เท่านั้น; อย่าใส่ `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- การกระทำ/ความสามารถ: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- รีแอ็กชัน: `reactionNotifications`, `reactionLevel`
- ข้อผิดพลาด: `errorPolicy`, `errorCooldownMs`
- การเขียน/ประวัติ: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญหลายบัญชี: เมื่อกำหนดค่า ID บัญชีตั้งแต่สองรายการขึ้นไป ให้ตั้งค่า `channels.telegram.defaultAccount` (หรือใส่ `channels.telegram.accounts.default`) เพื่อให้การกำหนดเส้นทางเริ่มต้นชัดเจน มิฉะนั้น OpenClaw จะถอยกลับไปใช้ ID บัญชีตัวแรกที่ผ่านการทำให้เป็นมาตรฐาน และ `openclaw doctor` จะเตือน บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom` แต่จะไม่สืบทอดค่า `accounts.default.*`
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Telegram กับ Gateway
  </Card>
  <Card title="Groups" icon="users" href="/th/channels/groups">
    พฤติกรรมรายการอนุญาตของกลุ่มและหัวข้อ
  </Card>
  <Card title="Channel routing" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="Security" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเสริมความแข็งแกร่ง
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกลุ่มและหัวข้อไปยังเอเจนต์
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทาง
  </Card>
</CardGroup>
