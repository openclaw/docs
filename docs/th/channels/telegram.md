---
read_when:
    - การทำงานกับฟีเจอร์ของ Telegram หรือ Webhook
summary: สถานะการรองรับบอต Telegram ความสามารถ และการกำหนดค่า
title: Telegram
x-i18n:
    generated_at: "2026-07-02T17:48:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b9fc8030adf0525b8b0680fc9ca344cd2c1ba2164b2a4acdb805c7076603bea
    source_path: channels/telegram.md
    workflow: 16
---

พร้อมใช้งานระดับโปรดักชันสำหรับ DM ของบอตและกลุ่มผ่าน grammY โหมดเริ่มต้นคือ long polling ส่วนโหมด Webhook เป็นตัวเลือกเสริม

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับ Telegram คือการจับคู่
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและคู่มือการซ่อมแซม
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าช่องทางแบบเต็ม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="Create the bot token in BotFather">
    เปิด Telegram แล้วแชตกับ **@BotFather** (ยืนยันว่า handle คือ `@BotFather` ตรงตามนี้)

    เรียกใช้ `/newbot` ทำตามพรอมป์ แล้วบันทึกโทเค็นไว้

  </Step>

  <Step title="Configure token and DM policy">

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

    ค่า env สำรอง: `TELEGRAM_BOT_TOKEN=...` (เฉพาะบัญชีเริ่มต้น)
    Telegram **ไม่** ใช้ `openclaw channels login telegram`; ให้กำหนดค่าโทเค็นใน config/env แล้วเริ่ม gateway

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    รหัสจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง

  </Step>

  <Step title="Add the bot to a group">
    เพิ่มบอตเข้ากลุ่มของคุณ แล้วรับ ID ทั้งสองค่าที่การเข้าถึงกลุ่มต้องใช้:

    - ID ผู้ใช้ Telegram ของคุณ ซึ่งใช้ใน `allowFrom` / `groupAllowFrom`
    - ID แชตกลุ่ม Telegram ซึ่งใช้เป็นคีย์ใต้ `channels.telegram.groups`

    สำหรับการตั้งค่าครั้งแรก ให้รับ ID แชตกลุ่มจาก `openclaw logs --follow`, บอต forwarded-ID หรือ Bot API `getUpdates` หลังจากอนุญาตกลุ่มแล้ว `/whoami@<bot_username>` สามารถยืนยัน ID ผู้ใช้และกลุ่มได้

    ID ของ Telegram supergroup ที่เป็นค่าลบและขึ้นต้นด้วย `-100` คือ ID แชตกลุ่ม ให้ใส่ไว้ใต้ `channels.telegram.groups` ไม่ใช่ใต้ `groupAllowFrom`

  </Step>
</Steps>

<Note>
ลำดับการแก้ค่าโทเค็นรับรู้ตามบัญชี ในทางปฏิบัติ ค่า config จะชนะค่า env สำรอง และ `TELEGRAM_BOT_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
หลังจากเริ่มต้นสำเร็จ OpenClaw จะแคชตัวตนของบอตไว้ในไดเรกทอรี state ได้นานสูงสุด 24 ชั่วโมง เพื่อให้การรีสตาร์ตเลี่ยงการเรียก Telegram `getMe` เพิ่มเติมได้ การเปลี่ยนหรือลบโทเค็นจะล้างแคชนั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    บอต Telegram มีค่าเริ่มต้นเป็น **Privacy Mode** ซึ่งจำกัดข้อความกลุ่มที่บอตจะได้รับ

    หากบอตต้องเห็นข้อความกลุ่มทั้งหมด ให้ทำอย่างใดอย่างหนึ่ง:

    - ปิด privacy mode ผ่าน `/setprivacy` หรือ
    - ตั้งบอตเป็นผู้ดูแลกลุ่ม

    เมื่อสลับ privacy mode ให้ลบและเพิ่มบอตกลับเข้าไปใหม่ในแต่ละกลุ่ม เพื่อให้ Telegram นำการเปลี่ยนแปลงไปใช้

  </Accordion>

  <Accordion title="Group permissions">
    สถานะผู้ดูแลควบคุมได้ในการตั้งค่ากลุ่ม Telegram

    บอตที่เป็นผู้ดูแลจะได้รับข้อความกลุ่มทั้งหมด ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มที่เปิดทำงานตลอดเวลา

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` เพื่ออนุญาต/ปฏิเสธการเพิ่มเข้ากลุ่ม
    - `/setprivacy` สำหรับพฤติกรรมการมองเห็นในกลุ่ม

  </Accordion>
</AccordionGroup>

## การควบคุมการเข้าถึงและการเปิดใช้งาน

### ตัวตนบอตในกลุ่ม

ในกลุ่มและหัวข้อฟอรัมของ Telegram การ mention handle ของบอตที่กำหนดค่าไว้อย่างชัดเจน (เช่น `@my_bot`) จะถือว่าเป็นการส่งถึงเอเจนต์ OpenClaw ที่เลือกไว้ แม้ชื่อ persona ของเอเจนต์จะแตกต่างจากชื่อผู้ใช้ Telegram ก็ตาม นโยบายความเงียบของกลุ่มยังใช้กับทราฟฟิกกลุ่มที่ไม่เกี่ยวข้อง แต่ handle ของบอตเองไม่ถือว่าเป็น "คนอื่น"

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` ควบคุมการเข้าถึงข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist` (ต้องมี ID ผู้ส่งอย่างน้อยหนึ่งค่าใน `allowFrom`)
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    `dmPolicy: "open"` พร้อม `allowFrom: ["*"]` ทำให้บัญชี Telegram ใดก็ตามที่ค้นพบหรือเดาชื่อผู้ใช้บอตได้สามารถสั่งงานบอตได้ ใช้เฉพาะกับบอตสาธารณะที่ตั้งใจให้เป็นเช่นนั้นและมีเครื่องมือที่จำกัดอย่างเข้มงวดเท่านั้น บอตเจ้าของคนเดียวควรใช้ `allowlist` พร้อม ID ผู้ใช้แบบตัวเลข

    `channels.telegram.allowFrom` รับ ID ผู้ใช้ Telegram แบบตัวเลข prefix `telegram:` / `tg:` ใช้ได้และจะถูก normalize
    ใน config หลายบัญชี `channels.telegram.allowFrom` ระดับบนสุดที่เข้มงวดจะถือเป็นขอบเขตความปลอดภัย: รายการ `allowFrom: ["*"]` ระดับบัญชีจะไม่ทำให้บัญชีนั้นเป็นสาธารณะ เว้นแต่ allowlist ที่มีผลของบัญชียังคงมี wildcard อย่างชัดเจนหลังจาก merge แล้ว
    `dmPolicy: "allowlist"` พร้อม `allowFrom` ว่างจะบล็อก DM ทั้งหมดและถูกปฏิเสธโดยการตรวจสอบ config
    การตั้งค่าจะขอเฉพาะ ID ผู้ใช้แบบตัวเลขเท่านั้น
    หากคุณอัปเกรดแล้ว config ของคุณมีรายการ allowlist แบบ `@username` ให้เรียกใช้ `openclaw doctor --fix` เพื่อแก้ค่าเหล่านั้น (ทำแบบ best-effort; ต้องใช้โทเค็นบอต Telegram)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์ allowlist ของ pairing-store อยู่ `openclaw doctor --fix` สามารถกู้คืนรายการเข้าไปใน `channels.telegram.allowFrom` ใน flow แบบ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID ที่ระบุไว้อย่างชัดเจน)

    สำหรับบอตเจ้าของคนเดียว แนะนำให้ใช้ `dmPolicy: "allowlist"` พร้อม ID `allowFrom` แบบตัวเลขที่ระบุชัดเจน เพื่อให้นโยบายการเข้าถึงคงทนอยู่ใน config (แทนการพึ่งพาการอนุมัติการจับคู่ก่อนหน้า)

    ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่ได้หมายความว่า "ผู้ส่งนี้ได้รับอนุญาตทุกที่"
    การจับคู่ให้สิทธิ์เข้าถึง DM หากยังไม่มีเจ้าของคำสั่ง การจับคู่ที่อนุมัติครั้งแรกจะตั้งค่า `commands.ownerAllowFrom` ด้วย เพื่อให้คำสั่งเฉพาะเจ้าของและการอนุมัติ exec มีบัญชีผู้ปฏิบัติงานที่ชัดเจน
    การอนุญาตผู้ส่งในกลุ่มยังคงมาจาก allowlist ใน config ที่ระบุไว้อย่างชัดเจน
    หากคุณต้องการ "ฉันได้รับอนุญาตครั้งเดียว แล้วทั้ง DM และคำสั่งกลุ่มใช้งานได้" ให้ใส่ ID ผู้ใช้ Telegram แบบตัวเลขของคุณใน `channels.telegram.allowFrom`; สำหรับคำสั่งเฉพาะเจ้าของ ให้แน่ใจว่า `commands.ownerAllowFrom` มี `telegram:<your user id>`

    ### การค้นหา ID ผู้ใช้ Telegram ของคุณ

    ปลอดภัยกว่า (ไม่ใช้บอตบุคคลที่สาม):

    1. DM บอตของคุณ
    2. เรียกใช้ `openclaw logs --follow`
    3. อ่าน `from.id`

    วิธี Bot API อย่างเป็นทางการ:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="Group policy and allowlists">
    มีการควบคุมสองส่วนที่ใช้ร่วมกัน:

    1. **กลุ่มใดได้รับอนุญาต** (`channels.telegram.groups`)
       - ไม่มี config `groups`:
         - เมื่อใช้ `groupPolicy: "open"`: กลุ่มใดก็ผ่านการตรวจสอบ ID กลุ่มได้
         - เมื่อใช้ `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการ `groups` (หรือ `"*"`)
       - กำหนดค่า `groups` แล้ว: ทำหน้าที่เป็น allowlist (ID ที่ระบุชัดเจนหรือ `"*"`)

    2. **ผู้ส่งใดได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับการกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่า Telegram จะ fallback ไปที่ `allowFrom`
    รายการ `groupAllowFrom` ควรเป็น ID ผู้ใช้ Telegram แบบตัวเลข (prefix `telegram:` / `tg:` จะถูก normalize)
    อย่าใส่ ID แชตกลุ่มหรือ supergroup ของ Telegram ใน `groupAllowFrom` ID แชตที่เป็นค่าลบต้องอยู่ใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเว้นสำหรับการอนุญาตผู้ส่ง
    ขอบเขตความปลอดภัย (`2026.2.25+`): auth ผู้ส่งในกลุ่ม **ไม่** สืบทอดการอนุมัติจาก DM pairing-store
    การจับคู่ยังคงเป็น DM-only สำหรับกลุ่ม ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` ต่อกลุ่ม/ต่อหัวข้อ
    หากไม่ได้ตั้งค่า `groupAllowFrom` Telegram จะ fallback ไปที่ config `allowFrom` ไม่ใช่ pairing store
    รูปแบบใช้งานจริงสำหรับบอตเจ้าของคนเดียว: ตั้ง ID ผู้ใช้ของคุณใน `channels.telegram.allowFrom` ปล่อย `groupAllowFrom` ไว้ไม่ต้องตั้งค่า และอนุญาตกลุ่มเป้าหมายใต้ `channels.telegram.groups`
    หมายเหตุ runtime: หาก `channels.telegram` หายไปทั้งหมด runtime จะมีค่าเริ่มต้นเป็น fail-closed `groupPolicy="allowlist"` เว้นแต่ `channels.defaults.groupPolicy` จะถูกตั้งค่าไว้อย่างชัดเจน

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

    ทดสอบจากกลุ่มด้วย `@<bot_username> ping` ข้อความกลุ่มธรรมดาจะไม่ trigger บอตขณะที่ `requireMention: true`

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

    ตัวอย่าง: อนุญาตเฉพาะผู้ใช้บางคนภายในกลุ่มเฉพาะหนึ่งกลุ่ม:

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

      - ใส่ ID แชตกลุ่มหรือ supergroup ของ Telegram ที่เป็นค่าลบ เช่น `-1001234567890` ไว้ใต้ `channels.telegram.groups`
      - ใส่ ID ผู้ใช้ Telegram เช่น `8734062810` ไว้ใต้ `groupAllowFrom` เมื่อคุณต้องการจำกัดว่าคนใดในกลุ่มที่ได้รับอนุญาตสามารถ trigger บอตได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกคนใดก็ได้ของกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอตได้

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    การตอบกลับในกลุ่มต้องมี mention โดยค่าเริ่มต้น

    mention อาจมาจาก:

    - mention แบบ native `@botusername` หรือ
    - รูปแบบ mention ใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    toggle คำสั่งระดับ session:

    - `/activation always`
    - `/activation mention`

    สิ่งเหล่านี้อัปเดตเฉพาะ state ของ session ใช้ config เพื่อให้คงอยู่ถาวร

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

    บริบทประวัติกลุ่มเปิดใช้งานเสมอสำหรับกลุ่มและถูกจำกัดด้วย
    `historyLimit` ตั้งค่า `channels.telegram.historyLimit: 0` เพื่อปิดใช้งานหน้าต่างประวัติกลุ่ม
    Telegram คีย์ `includeGroupHistoryContext` ที่เลิกใช้แล้วจะถูกลบโดย `openclaw doctor --fix`

    การรับ ID แชตกลุ่ม:

    - forward ข้อความกลุ่มไปยัง `@userinfobot` / `@getidsbot`
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจสอบ Bot API `getUpdates`
    - หลังจากอนุญาตกลุ่มแล้ว ให้เรียกใช้ `/whoami@<bot_username>` หากเปิดใช้งานคำสั่ง native

  </Tab>
</Tabs>

## พฤติกรรม Runtime

- Telegram เป็นของ Gateway process
- การกำหนดเส้นทางเป็นแบบกำหนดแน่นอน: ข้อความขาเข้าจาก Telegram จะตอบกลับไปยัง Telegram (โมเดลไม่เลือกช่องทาง)
- ข้อความขาเข้าจะถูกทำให้เป็นมาตรฐานเป็น channel envelope ร่วม พร้อมเมทาดาทาการตอบกลับ ตัวแทนสื่อ และบริบท reply-chain ที่บันทึกไว้สำหรับการตอบกลับของ Telegram ที่ Gateway เคยสังเกตเห็น
- เซสชันกลุ่มถูกแยกตาม group ID หัวข้อฟอรัมจะเติม `:topic:<threadId>` เพื่อแยกหัวข้อออกจากกัน
- ข้อความ DM สามารถมี `message_thread_id`; OpenClaw จะเก็บค่านี้ไว้สำหรับการตอบกลับ เซสชันหัวข้อ DM จะแยกเฉพาะเมื่อ Telegram `getMe` รายงาน `has_topics_enabled: true` สำหรับบอต มิฉะนั้น DM จะยังอยู่ในเซสชันแบบแบน
- Long polling ใช้ grammY runner พร้อมการจัดลำดับต่อแชท/ต่อเธรด concurrency รวมของ runner sink ใช้ `agents.defaults.maxConcurrent`
- การเริ่มต้นหลายบัญชีจำกัดจำนวน probe ของ Telegram `getMe` ที่ทำพร้อมกัน เพื่อไม่ให้ bot fleet ขนาดใหญ่กระจาย probe ทุกบัญชีพร้อมกัน
- Long polling ถูกป้องกันภายในแต่ละ Gateway process เพื่อให้มี poller ที่ใช้งานอยู่เพียงตัวเดียวเท่านั้นที่ใช้ bot token ได้ในแต่ละครั้ง หากคุณยังเห็นข้อขัดแย้ง `getUpdates` 409 เป็นไปได้ว่า Gateway ของ OpenClaw อีกตัวหนึ่ง สคริปต์ หรือ poller ภายนอกกำลังใช้ token เดียวกัน
- การรีสตาร์ตจาก watchdog ของ long-polling จะทริกเกอร์หลังจากไม่มี liveness ของ `getUpdates` ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีตามค่าเริ่มต้น เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการปรับใช้ของคุณยังเห็นการรีสตาร์ต polling-stall ที่เป็น false ระหว่างงานที่รันนาน ค่านี้เป็นมิลลิวินาทีและอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับการ override รายบัญชี
- Telegram Bot API ไม่รองรับ read-receipt (`sendReadReceipts` ใช้ไม่ได้)

<Note>
  `channels.telegram.dm.threadReplies` และ `channels.telegram.direct.<chatId>.threadReplies` ถูกลบแล้ว รัน `openclaw doctor --fix` หลังอัปเกรดหาก config ของคุณยังมี key เหล่านั้น การกำหนดเส้นทางหัวข้อ DM ตอนนี้ทำตามความสามารถของบอตจาก Telegram `getMe.has_topics_enabled` ซึ่งควบคุมโดยโหมด threaded ของ BotFather: บอตที่เปิด topics จะใช้เซสชัน DM แบบอิงเธรดเมื่อ Telegram ส่ง `message_thread_id`; DM อื่นๆ จะยังอยู่ในเซสชันแบบแบน
</Note>

## เอกสารอ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="ตัวอย่างสตรีมสด (การแก้ไขข้อความ)">
    OpenClaw สามารถสตรีมคำตอบบางส่วนแบบเรียลไทม์ได้:

    - แชทโดยตรง: ข้อความตัวอย่าง + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความตัวอย่าง + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` คือ `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - ตัวอย่างคำตอบเริ่มต้นแบบสั้นจะถูก debounce แล้วจึง materialize หลังจากดีเลย์ที่จำกัดไว้หาก run ยังทำงานอยู่
    - `progress` เก็บร่างสถานะที่แก้ไขได้หนึ่งรายการสำหรับความคืบหน้าของเครื่องมือ แสดงป้ายสถานะที่เสถียรเมื่อมีกิจกรรมคำตอบมาก่อนความคืบหน้าของเครื่องมือ ล้างเมื่อเสร็จสิ้น และส่งคำตอบสุดท้ายเป็นข้อความปกติ
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความตัวอย่างที่แก้ไขเดิมซ้ำหรือไม่ (ค่าเริ่มต้น: `true` เมื่อ preview streaming ทำงานอยู่)
    - `streaming.preview.commandText` ควบคุมรายละเอียด command/exec ภายในบรรทัด tool-progress เหล่านั้น: `raw` (ค่าเริ่มต้น, รักษาพฤติกรรมที่เผยแพร่แล้ว) หรือ `status` (เฉพาะป้ายเครื่องมือ)
    - `streaming.progress.commentary` (ค่าเริ่มต้น: `false`) เลือกใช้ข้อความ commentary/preamble ของผู้ช่วยในร่างความคืบหน้าชั่วคราว
    - ระบบตรวจพบ `channels.telegram.streamMode` แบบ legacy, ค่า `streaming` แบบ boolean และ key native draft preview ที่เลิกใช้แล้ว; รัน `openclaw doctor --fix` เพื่อย้ายไปยัง config streaming ปัจจุบัน

    การอัปเดตตัวอย่าง tool-progress คือบรรทัดสถานะสั้นๆ ที่แสดงขณะเครื่องมือทำงาน เช่น การเรียกคำสั่ง การอ่านไฟล์ การอัปเดตแผน สรุปแพตช์ หรือข้อความ preamble/commentary ของ Codex ในโหมด Codex app-server Telegram เปิดสิ่งเหล่านี้ไว้ตามค่าเริ่มต้นเพื่อให้ตรงกับพฤติกรรม OpenClaw ที่เผยแพร่ตั้งแต่ `v2026.4.22` และหลังจากนั้น

    หากต้องการเก็บตัวอย่างที่แก้ไขสำหรับข้อความคำตอบ แต่ซ่อนบรรทัด tool-progress ให้ตั้งค่า:

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

    หากต้องการให้ tool-progress มองเห็นได้ แต่ซ่อนข้อความ command/exec ให้ตั้งค่า:

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

    ใช้โหมด `progress` เมื่อคุณต้องการความคืบหน้าของเครื่องมือที่มองเห็นได้โดยไม่แก้ไขคำตอบสุดท้ายเข้าไปในข้อความเดียวกันนั้น วางนโยบาย command-text ไว้ใต้ `streaming.progress`:

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

    ใช้ `streaming.mode: "off"` เฉพาะเมื่อคุณต้องการการส่งเฉพาะคำตอบสุดท้าย: การแก้ไขตัวอย่างของ Telegram จะถูกปิดใช้ และข้อความทั่วไปของเครื่องมือ/ความคืบหน้าจะถูกระงับแทนที่จะส่งเป็นข้อความสถานะแยกต่างหาก พรอมป์อนุมัติ payload สื่อ และข้อผิดพลาดยังคงถูกส่งผ่านการส่งคำตอบสุดท้ายตามปกติ ใช้ `streaming.preview.toolProgress: false` เมื่อคุณต้องการเก็บเฉพาะการแก้ไขตัวอย่างคำตอบไว้ในขณะที่ซ่อนบรรทัดสถานะ tool-progress

    <Note>
      การตอบกลับ quote ที่เลือกใน Telegram เป็นข้อยกเว้น เมื่อ `replyToMode` เป็น `"first"`, `"all"` หรือ `"batched"` และข้อความขาเข้ามีข้อความ quote ที่เลือกไว้ OpenClaw จะส่งคำตอบสุดท้ายผ่านเส้นทาง quote-reply แบบ native ของ Telegram แทนการแก้ไขตัวอย่างคำตอบ ดังนั้น `streaming.preview.toolProgress` จึงไม่สามารถแสดงบรรทัดสถานะสั้นๆ สำหรับ turn นั้นได้ การตอบกลับข้อความปัจจุบันที่ไม่มีข้อความ quote ที่เลือกไว้ยังคงใช้ preview streaming ตั้งค่า `replyToMode: "off"` เมื่อการมองเห็น tool-progress สำคัญกว่าการตอบกลับ quote แบบ native หรือตั้งค่า `streaming.preview.toolProgress: false` เพื่อยอมรับข้อแลกเปลี่ยนนี้
    </Note>

    สำหรับการตอบกลับแบบข้อความเท่านั้น:

    - ตัวอย่าง DM/กลุ่ม/หัวข้อแบบสั้น: OpenClaw เก็บข้อความตัวอย่างเดิมไว้และแก้ไขสุดท้ายในที่เดิม
    - ข้อความสุดท้ายแบบยาวที่ถูกแบ่งเป็นหลายข้อความ Telegram จะใช้ตัวอย่างเดิมซ้ำเป็นส่วนสุดท้ายส่วนแรกเมื่อเป็นไปได้ แล้วส่งเฉพาะส่วนที่เหลือ
    - ข้อความสุดท้ายในโหมด progress จะล้างร่างสถานะและใช้การส่งคำตอบสุดท้ายตามปกติแทนการแก้ไขร่างให้เป็นคำตอบ
    - หากการแก้ไขสุดท้ายล้มเหลวก่อนยืนยันข้อความที่เสร็จสมบูรณ์ OpenClaw จะใช้การส่งคำตอบสุดท้ายตามปกติและล้างตัวอย่างที่ค้างอยู่

    สำหรับการตอบกลับที่ซับซ้อน (เช่น payload สื่อ) OpenClaw จะ fallback ไปยังการส่งคำตอบสุดท้ายตามปกติ แล้วล้างข้อความตัวอย่าง

    Preview streaming แยกจาก block streaming เมื่อเปิดใช้ block streaming สำหรับ Telegram อย่างชัดเจน OpenClaw จะข้าม preview stream เพื่อหลีกเลี่ยงการสตรีมซ้ำ

    พฤติกรรม reasoning stream:

    - `/reasoning stream` ใช้เส้นทาง reasoning-preview ของช่องทางที่รองรับ; บน Telegram จะสตรีม reasoning เข้าไปในตัวอย่างสดขณะสร้าง
    - ตัวอย่าง reasoning จะถูกลบหลังการส่งคำตอบสุดท้าย; ใช้ `/reasoning on` เมื่อ reasoning ควรคงให้มองเห็นได้
    - คำตอบสุดท้ายจะถูกส่งโดยไม่มีข้อความ reasoning

  </Accordion>

  <Accordion title="การจัดรูปแบบข้อความแบบสมบูรณ์">
    ข้อความขาออกใช้ข้อความ Telegram HTML มาตรฐานตามค่าเริ่มต้น เพื่อให้คำตอบยังอ่านได้ในไคลเอนต์ Telegram ปัจจุบัน โหมดความเข้ากันได้นี้รองรับตัวหนา ตัวเอียง ลิงก์ โค้ด สปอยเลอร์ และ quote ตามปกติ แต่ไม่รองรับบล็อก rich-only ของ Bot API 10.1 เช่น ตาราง native, details, rich media และสูตร

    ตั้งค่า `channels.telegram.richMessages: true` เพื่อเลือกใช้ rich messages ของ Bot API 10.1:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    เมื่อเปิดใช้:

    - Agent จะได้รับแจ้งว่า Telegram rich messages พร้อมใช้งานสำหรับบอต/บัญชีนี้
    - ข้อความ Markdown จะถูกเรนเดอร์ผ่าน Markdown IR ของ OpenClaw และส่งเป็น Telegram rich HTML
    - payload rich HTML แบบชัดเจนจะรักษา tag ของ Bot API 10.1 ที่รองรับ เช่น heading, table, details, rich media และ formula
    - คำบรรยายสื่อยังคงใช้ Telegram HTML captions เพราะ rich messages ไม่ได้แทนที่ captions

    วิธีนี้ช่วยกันข้อความของโมเดลออกจากสัญลักษณ์ Telegram Rich Markdown ดังนั้นสกุลเงินอย่าง `$400-600K` จะไม่ถูก parse เป็นคณิตศาสตร์ ข้อความ rich text ที่ยาวจะถูกแบ่งอัตโนมัติตามขีดจำกัด rich text และ rich block ของ Telegram ตารางที่เกินขีดจำกัดคอลัมน์ของ Telegram จะถูกส่งเป็น code block

    ค่าเริ่มต้น: ปิดเพื่อความเข้ากันได้ของไคลเอนต์ Rich messages ต้องใช้ไคลเอนต์ Telegram ที่เข้ากันได้; ไคลเอนต์ Desktop, Web, Android และ third-party บางตัวในปัจจุบันแสดง rich messages ที่ยอมรับแล้วว่าไม่รองรับ ปิดตัวเลือกนี้ไว้ เว้นแต่ไคลเอนต์ทุกตัวที่ใช้กับบอตสามารถเรนเดอร์ได้ `/status` แสดงว่าเซสชัน Telegram ปัจจุบันเปิดหรือปิด rich messages อยู่

    Link previews เปิดใช้ตามค่าเริ่มต้น `channels.telegram.linkPreview: false` จะข้ามการตรวจจับ entity อัตโนมัติสำหรับ rich text

  </Accordion>

  <Accordion title="คำสั่ง native และคำสั่งกำหนดเอง">
    การลงทะเบียนเมนูคำสั่ง Telegram จัดการตอนเริ่มต้นด้วย `setMyCommands`

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

    - ชื่อจะถูกทำให้เป็นมาตรฐาน (ตัด `/` นำหน้า, แปลงเป็นตัวพิมพ์เล็ก)
    - รูปแบบที่ถูกต้อง: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งกำหนดเองไม่สามารถ override คำสั่ง native ได้
    - ความขัดแย้ง/รายการซ้ำจะถูกข้ามและบันทึก log

    หมายเหตุ:

    - คำสั่งกำหนดเองเป็นเพียงรายการเมนูเท่านั้น; ไม่ได้ implement พฤติกรรมให้อัตโนมัติ
    - คำสั่ง Plugin/skill ยังทำงานได้เมื่อพิมพ์ แม้จะไม่แสดงในเมนู Telegram

    หากปิดใช้คำสั่ง native ระบบจะลบ built-ins ออก คำสั่งกำหนดเอง/Plugin อาจยังลงทะเบียนได้หากมีการกำหนดค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังล้นหลังจากตัดลดแล้ว; ลดคำสั่ง Plugin/skill/กำหนดเอง หรือปิดใช้ `channels.telegram.commands.native`
    - การที่ `deleteWebhook`, `deleteMyCommands` หรือ `setMyCommands` ล้มเหลวพร้อม `404: Not Found` ขณะที่คำสั่ง Bot API ผ่าน curl โดยตรงทำงานได้ อาจหมายความว่า `channels.telegram.apiRoot` ถูกตั้งเป็น endpoint เต็ม `/bot<TOKEN>` แล้ว `apiRoot` ต้องเป็นเฉพาะ root ของ Bot API เท่านั้น และ `openclaw doctor --fix` จะลบ `/bot<TOKEN>` ต่อท้ายที่เกิดโดยไม่ตั้งใจ
    - `getMe returned 401` หมายความว่า Telegram ปฏิเสธ bot token ที่กำหนดค่าไว้ อัปเดต `botToken`, `tokenFile` หรือ `TELEGRAM_BOT_TOKEN` ด้วย token ปัจจุบันจาก BotFather; OpenClaw จะหยุดก่อน polling ดังนั้นจึงไม่ถูกรายงานเป็นความล้มเหลวของการล้าง webhook
    - `setMyCommands failed` พร้อมข้อผิดพลาด network/fetch มักหมายความว่า outbound DNS/HTTPS ไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งจับคู่อุปกรณ์ (Plugin `device-pair`)

    เมื่อ Plugin `device-pair` ติดตั้งอยู่:

    1. `/pair` สร้างโค้ดตั้งค่า
    2. วางโค้ดในแอป iOS
    3. `/pair pending` แสดงรายการคำขอที่รอดำเนินการ (รวม role/scopes)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบระบุชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    โค้ดตั้งค่ามี bootstrap token อายุสั้น Bootstrap ด้วยโค้ดตั้งค่าในตัวเป็น node-only: การเชื่อมต่อครั้งแรกจะสร้างคำขอ node ที่รอดำเนินการ และหลังจากอนุมัติแล้ว Gateway จะคืน node token ที่คงทนพร้อม `scopes: []` ไม่ได้คืน operator token ที่ส่งต่อมา; การเข้าถึงแบบ operator ต้องใช้การจับคู่ operator ที่อนุมัติแยกต่างหากหรือ token flow

    หากอุปกรณ์ retry ด้วยรายละเอียด auth ที่เปลี่ยนไป (เช่น role/scopes/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` ที่ต่างออกไป รัน `/pair pending` อีกครั้งก่อนอนุมัติ

    รายละเอียดเพิ่มเติม: [การจับคู่](/th/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="ปุ่มแบบอินไลน์">
    กำหนดค่าขอบเขตแป้นพิมพ์แบบอินไลน์:

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

    `capabilities: ["inlineButtons"]` แบบเดิมจะถูกแมปเป็น `inlineButtons: "all"`

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

    ปุ่ม `web_app` ของ Telegram ใช้งานได้เฉพาะในแชตส่วนตัวระหว่างผู้ใช้กับ
    บอตเท่านั้น

    การคลิก callback ที่ไม่ได้ถูกอ้างสิทธิ์โดย handler แบบโต้ตอบของ plugin
    ที่ลงทะเบียนไว้ จะถูกส่งต่อไปยัง agent เป็นข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="การดำเนินการข้อความ Telegram สำหรับ agent และระบบอัตโนมัติ">
    การดำเนินการของเครื่องมือ Telegram มีดังนี้:

    - `sendMessage` (`to`, `content`, `mediaUrl` ที่ไม่บังคับ, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` หรือ `caption`, ปุ่มอินไลน์ `presentation` ที่ไม่บังคับ; การแก้ไขเฉพาะปุ่มจะอัปเดต reply markup)
    - `createForumTopic` (`chatId`, `name`, `iconColor` ที่ไม่บังคับ, `iconCustomEmojiId`)

    การดำเนินการข้อความของช่องทางเปิดเผย alias ที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    การควบคุม gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้งาน)

    หมายเหตุ: ปัจจุบัน `edit` และ `topic-create` เปิดใช้งานตามค่าเริ่มต้น และไม่มี toggle `channels.telegram.actions.*` แยกต่างหาก
    การส่งขณะรันไทม์ใช้สแนปช็อต config/secrets ที่ทำงานอยู่ (startup/reload) ดังนั้น path การดำเนินการจะไม่ทำการ resolve SecretRef ใหม่แบบเฉพาะกิจต่อการส่งแต่ละครั้ง

    ความหมายของการลบ reaction: [/tools/reactions](/th/tools/reactions)

  </Accordion>

  <Accordion title="แท็กเธรดการตอบกลับ">
    Telegram รองรับแท็กเธรดการตอบกลับแบบชัดเจนในเอาต์พุตที่สร้างขึ้น:

    - `[[reply_to_current]]` ตอบกลับข้อความที่เรียกใช้งาน
    - `[[reply_to:<id>]]` ตอบกลับ ID ข้อความ Telegram ที่ระบุ

    `channels.telegram.replyToMode` ควบคุมการจัดการ:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`

    เมื่อเปิดใช้งานเธรดการตอบกลับและมีข้อความหรือคำบรรยายต้นฉบับของ Telegram พร้อมใช้งาน OpenClaw จะรวมข้อความอ้างอิงแบบ native ของ Telegram โดยอัตโนมัติ Telegram จำกัดข้อความอ้างอิงแบบ native ไว้ที่ 1024 หน่วยรหัส UTF-16 ดังนั้นข้อความที่ยาวกว่าจะถูกอ้างอิงจากตอนต้น และจะถอยกลับเป็นการตอบกลับธรรมดาหาก Telegram ปฏิเสธการอ้างอิง

    หมายเหตุ: `off` ปิดใช้งานเธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงมีผล

  </Accordion>

  <Accordion title="หัวข้อฟอรัมและพฤติกรรมของเธรด">
    supergroup แบบฟอรัม:

    - คีย์เซสชันของหัวข้อจะต่อท้ายด้วย `:topic:<threadId>`
    - การตอบกลับและการแสดงกำลังพิมพ์จะกำหนดเป้าหมายไปยังเธรดหัวข้อ
    - path config ของหัวข้อ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของหัวข้อทั่วไป (`threadId=1`):

    - การส่งข้อความจะละเว้น `message_thread_id` (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - การดำเนินการกำลังพิมพ์ยังคงรวม `message_thread_id`

    การสืบทอดของหัวข้อ: รายการหัวข้อจะสืบทอดการตั้งค่ากลุ่ม เว้นแต่ถูกแทนที่ (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` เป็นเฉพาะหัวข้อและไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม
    `topics."*"` ตั้งค่าเริ่มต้นสำหรับทุกหัวข้อในกลุ่มนั้น; ID หัวข้อที่ตรงกันทุกประการยังคงมีลำดับเหนือกว่า `"*"`

    **การกำหนดเส้นทาง agent ต่อหัวข้อ**: แต่ละหัวข้อสามารถกำหนดเส้นทางไปยัง agent คนละตัวได้โดยตั้งค่า `agentId` ใน config ของหัวข้อ วิธีนี้ทำให้แต่ละหัวข้อมี workspace, memory และเซสชันที่แยกเป็นของตัวเอง ตัวอย่าง:

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

    **การผูกหัวข้อ ACP แบบถาวร**: หัวข้อฟอรัมสามารถปักหมุดเซสชัน ACP harness ผ่านการผูก ACP แบบ typed ระดับบนสุด (`bindings[]` พร้อม `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ id ที่ระบุหัวข้อ เช่น `-1001234567890:topic:42`) ปัจจุบันจำกัดขอบเขตไว้ที่หัวข้อฟอรัมในกลุ่ม/supergroup ดู [ACP Agents](/th/tools/acp-agents)

    **การ spawn ACP ที่ผูกกับเธรดจากแชต**: `/acp spawn <agent> --thread here|auto` ผูกหัวข้อปัจจุบันกับเซสชัน ACP ใหม่; การติดตามผลจะถูกกำหนดเส้นทางไปที่นั่นโดยตรง OpenClaw ปักหมุดการยืนยันการ spawn ไว้ในหัวข้อ ต้องให้ `channels.telegram.threadBindings.spawnSessions` ยังคงเปิดใช้งานอยู่ (ค่าเริ่มต้น: `true`)

    บริบทเทมเพลตเปิดเผย `MessageThreadId` และ `IsForum` แชต DM ที่มี `message_thread_id` จะเก็บ metadata การตอบกลับไว้; แชตเหล่านั้นใช้คีย์เซสชันที่รับรู้เธรดเฉพาะเมื่อ Telegram `getMe` รายงาน `has_topics_enabled: true` สำหรับบอต
    การแทนที่ `dm.threadReplies` และ `direct.*.threadReplies` เดิมถูกเลิกใช้โดยเจตนา; ใช้โหมดเธรดของ BotFather เป็นแหล่งความจริงเดียว และเรียกใช้ `openclaw doctor --fix` เพื่อลบคีย์ config ที่ค้างอยู่

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยกความแตกต่างระหว่าง voice note กับไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมแบบไฟล์เสียง
    - แท็ก `[[audio_as_voice]]` ในการตอบกลับของ agent เพื่อบังคับส่งเป็น voice note
    - transcript ของ voice note ขาเข้าจะถูกจัดกรอบเป็นข้อความที่สร้างโดยเครื่อง
      และไม่น่าเชื่อถือในบริบทของ agent; การตรวจจับ mention ยังคงใช้
      transcript ดิบ ดังนั้นข้อความเสียงที่ถูกควบคุมด้วย mention จึงยังทำงานต่อไป

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

    Telegram แยกความแตกต่างระหว่างไฟล์วิดีโอกับวิดีโอโน้ต

    ตัวอย่างการดำเนินการของข้อความ:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    วิดีโอโน้ตไม่รองรับคำบรรยาย ข้อความที่ระบุไว้จะถูกส่งแยกต่างหาก

    ### สติกเกอร์

    การจัดการสติกเกอร์ขาเข้า:

    - WEBP แบบคงที่: ดาวน์โหลดและประมวลผลแล้ว (placeholder `<media:sticker>`)
    - TGS แบบเคลื่อนไหว: ข้าม
    - WEBM วิดีโอ: ข้าม

    ฟิลด์บริบทของสติกเกอร์:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    คำอธิบายสติกเกอร์จะถูกแคชไว้ในสถานะ Plugin ของ OpenClaw SQLite เพื่อลดการเรียกใช้งาน vision ซ้ำ

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

    การดำเนินการส่งสติกเกอร์:

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
    ปฏิกิริยาของ Telegram จะมาถึงเป็นอัปเดต `message_reaction` (แยกจาก payload ของข้อความ)

    เมื่อเปิดใช้งาน OpenClaw จะนำเหตุการณ์ระบบเข้าคิว เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    การกำหนดค่า:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงปฏิกิริยาของผู้ใช้ต่อข้อความที่บอตส่งเท่านั้น (ทำแบบพยายามให้ดีที่สุดผ่านแคชข้อความที่ส่งแล้ว)
    - เหตุการณ์ปฏิกิริยายังคงเคารพการควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ได้ให้ ID เธรดในอัปเดตปฏิกิริยา
      - กลุ่มที่ไม่ใช่ฟอรัมจะส่งไปยังเซสชันแชตกลุ่ม
      - กลุ่มฟอรัมจะส่งไปยังเซสชันหัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อต้นทางที่แน่นอน

    `allowed_updates` สำหรับ polling/webhook จะรวม `message_reaction` โดยอัตโนมัติ

  </Accordion>

  <Accordion title="ปฏิกิริยารับทราบ">
    `ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า `ackReactionScope` ตัดสินว่าอีโมจินั้นจะถูกส่งจริง *เมื่อใด*

    **ลำดับการระบุอีโมจิ (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - อีโมจิสำรองจากตัวตนของเอเจนต์ (`agents.list[].identity.emoji`, ไม่เช่นนั้นใช้ "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิ unicode (เช่น "👀")
    - ใช้ `""` เพื่อปิดใช้งานปฏิกิริยาสำหรับช่องทางหรือบัญชี

    **ขอบเขต (`messages.ackReactionScope`):**

    ผู้ให้บริการ Telegram อ่านขอบเขตจาก `messages.ackReactionScope` (ค่าเริ่มต้น `"group-mentions"`) ปัจจุบันไม่มีการแทนที่ระดับบัญชี Telegram หรือระดับช่องทาง Telegram

    ค่า: `"all"` (DM + กลุ่ม), `"direct"` (DM เท่านั้น), `"group-all"` (ทุกข้อความกลุ่ม ไม่มี DM), `"group-mentions"` (กลุ่มเมื่อมีการกล่าวถึงบอต; **ไม่มี DM** — นี่คือค่าเริ่มต้น), `"off"` / `"none"` (ปิดใช้งาน)

    <Note>
    ขอบเขตเริ่มต้น (`"group-mentions"`) จะไม่เรียกปฏิกิริยารับทราบในข้อความโดยตรง หากต้องการให้มีปฏิกิริยารับทราบใน DM ขาเข้าของ Telegram ให้ตั้งค่า `messages.ackReactionScope` เป็น `"direct"` หรือ `"all"` ค่านี้ถูกอ่านเมื่อผู้ให้บริการ Telegram เริ่มทำงาน ดังนั้นจึงต้องรีสตาร์ท Gateway เพื่อให้การเปลี่ยนแปลงมีผล
    </Note>

  </Accordion>

  <Accordion title="การเขียนค่ากำหนดจากเหตุการณ์และคำสั่งของ Telegram">
    การเขียนค่ากำหนดของช่องทางเปิดใช้งานตามค่าเริ่มต้น (`configWrites !== false`)

    การเขียนที่ถูกทริกเกอร์โดย Telegram รวมถึง:

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

  <Accordion title="Long polling เทียบกับ Webhook">
    ค่าเริ่มต้นคือ long polling สำหรับโหมด Webhook ให้ตั้งค่า `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; `webhookPath`, `webhookHost`, `webhookPort` เป็นตัวเลือกเพิ่มเติม (ค่าเริ่มต้น `/telegram-webhook`, `127.0.0.1`, `8787`)

    ในโหมด long-polling OpenClaw จะคงค่า restart watermark ไว้หลังจากอัปเดตถูก dispatch สำเร็จเท่านั้น หาก handler ล้มเหลว อัปเดตนั้นจะยังคง retry ได้ในกระบวนการเดิมและจะไม่ถูกเขียนว่าเสร็จสมบูรณ์สำหรับ restart dedupe

    listener ภายในเครื่อง bind กับ `127.0.0.1:8787` สำหรับ ingress สาธารณะ ให้ใส่ reverse proxy ไว้หน้า local port หรือตั้งค่า `webhookHost: "0.0.0.0"` อย่างตั้งใจ

    โหมด Webhook ตรวจสอบ request guard, token ลับของ Telegram และ JSON body ก่อนส่งคืน `200` ให้ Telegram
    จากนั้น OpenClaw จะประมวลผลอัปเดตแบบอะซิงโครนัสผ่าน lane บอตต่อแชต/ต่อหัวข้อเดียวกับที่ใช้โดย long polling ดังนั้นรอบการทำงานของเอเจนต์ที่ช้าจะไม่หน่วง ACK การส่งมอบของ Telegram

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` จะให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนการแบ่งตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ทั้งขาเข้าและขาออก
    - `channels.telegram.mediaGroupFlushMs` (ค่าเริ่มต้น 500) ควบคุมระยะเวลาที่อัลบั้มหรือกลุ่มสื่อของ Telegram ถูกพักไว้ก่อนที่ OpenClaw จะส่งต่อเป็นข้อความขาเข้าเดียว เพิ่มค่านี้หากส่วนต่าง ๆ ของอัลบั้มมาถึงช้า หรือลดค่านี้เพื่อลดเวลาแฝงของการตอบกลับอัลบั้ม
    - `channels.telegram.timeoutSeconds` แทนที่เวลา timeout ของไคลเอนต์ Telegram API (หากไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY) ไคลเอนต์บอตจะจำกัดค่าที่กำหนดไว้ให้ต่ำกว่าตัวป้องกันคำขอข้อความ/การพิมพ์ขาออก 60 วินาที เพื่อไม่ให้ grammY ยกเลิกการส่งคำตอบที่ผู้ใช้มองเห็นก่อนที่ตัวป้องกันและ fallback ของ transport ใน OpenClaw จะทำงาน Long polling ยังคงใช้ตัวป้องกันคำขอ `getUpdates` 45 วินาที เพื่อไม่ให้การ poll ที่ไม่มีข้อมูลถูกปล่อยค้างไว้ไม่มีกำหนด
    - `channels.telegram.pollingStallThresholdMs` มีค่าเริ่มต้นเป็น `120000`; ปรับระหว่าง `30000` ถึง `600000` เฉพาะกรณีการรีสตาร์ทจาก polling-stall ที่เป็น false positive เท่านั้น
    - ประวัติบริบทของกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` หมายถึงปิดใช้งาน
    - บริบทเสริมจากการตอบกลับ/การอ้างอิง/การส่งต่อจะถูก normalize เข้าเป็นหน้าต่างบริบทการสนทนาที่เลือกไว้หนึ่งรายการ เมื่อ Gateway เคยสังเกตเห็นข้อความต้นทางแล้ว แคชข้อความที่สังเกตเห็นอยู่ในสถานะ Plugin ของ OpenClaw SQLite และ `openclaw doctor --fix` จะนำเข้า sidecar แบบ legacy Telegram จะใส่เฉพาะ `reply_to_message` ชั้นตื้นหนึ่งรายการในอัปเดต ดังนั้น chain ที่เก่ากว่าแคชจะถูกจำกัดตาม payload อัปเดตปัจจุบันของ Telegram
    - allowlist ของ Telegram มีหน้าที่หลักในการควบคุมว่าใครสามารถกระตุ้นเอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบสมบูรณ์
    - การควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - การกำหนดค่า `channels.telegram.retry` ใช้กับตัวช่วยส่งของ Telegram (CLI/เครื่องมือ/actions) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้ การส่งคำตอบสุดท้ายขาเข้าก็ใช้การ retry แบบ safe-send ที่มีขอบเขตสำหรับความล้มเหลวก่อนเชื่อมต่อกับ Telegram เช่นกัน แต่จะไม่ retry envelope เครือข่ายหลังส่งที่กำกวมซึ่งอาจทำให้ข้อความที่ผู้ใช้เห็นซ้ำได้

    เป้าหมายการส่งของ CLI และเครื่องมือข้อความสามารถเป็น chat ID แบบตัวเลข, username หรือเป้าหมายหัวข้อ forum ได้:

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

    การส่งของ Telegram ยังรองรับ:

    - `--presentation` พร้อมบล็อก `buttons` สำหรับ inline keyboard เมื่อ `channels.telegram.capabilities.inlineButtons` อนุญาต
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอการส่งแบบปักหมุดเมื่อบอตสามารถปักหมุดในแชตนั้นได้
    - `--force-document` เพื่อส่งรูปภาพ, GIF และวิดีโอขาออกเป็นเอกสารแทนการอัปโหลดแบบรูปภาพบีบอัด, สื่อแอนิเมชัน หรือวิดีโอ

    การควบคุม action:

    - `channels.telegram.actions.sendMessage=false` ปิดใช้งานข้อความ Telegram ขาออก รวมถึง poll
    - `channels.telegram.actions.poll=false` ปิดใช้งานการสร้าง poll ของ Telegram โดยยังคงเปิดใช้งานการส่งปกติไว้

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถเลือกโพสต์ prompt ในแชตหรือหัวข้อที่เป็นต้นทางได้ ผู้อนุมัติต้องเป็น user ID ของ Telegram แบบตัวเลข

    path การกำหนดค่า:

    - `channels.telegram.execApprovals.enabled` (เปิดใช้งานอัตโนมัติเมื่อ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งราย)
    - `channels.telegram.execApprovals.approvers` (fallback ไปยัง owner ID แบบตัวเลขจาก `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` และ `defaultTo` ควบคุมว่าใครสามารถคุยกับบอตได้และบอตส่งคำตอบปกติไปที่ใด สิ่งเหล่านี้ไม่ได้ทำให้ใครเป็นผู้อนุมัติ exec การจับคู่ DM ที่อนุมัติครั้งแรกจะ bootstrap `commands.ownerAllowFrom` เมื่อยังไม่มีเจ้าของคำสั่ง ดังนั้นการตั้งค่าแบบเจ้าของหนึ่งรายจึงยังทำงานได้โดยไม่ต้องใส่ ID ซ้ำใต้ `execApprovals.approvers`

    การส่งผ่านช่องทางจะแสดงข้อความคำสั่งในแชต เปิดใช้งาน `channel` หรือ `both` เฉพาะในกลุ่ม/หัวข้อที่เชื่อถือได้เท่านั้น เมื่อ prompt ไปถึงหัวข้อ forum OpenClaw จะคงหัวข้อนั้นไว้สำหรับ prompt การอนุมัติและการติดตามผล การอนุมัติ exec จะหมดอายุหลัง 30 นาทีโดยค่าเริ่มต้น

    ปุ่มอนุมัติแบบ inline ยังต้องให้ `channels.telegram.capabilities.inlineButtons` อนุญาตพื้นผิวเป้าหมาย (`dm`, `group` หรือ `all`) ด้วย ID การอนุมัติที่ขึ้นต้นด้วย `plugin:` จะ resolve ผ่านการอนุมัติของ Plugin; รายการอื่นจะ resolve ผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## การควบคุมคำตอบข้อผิดพลาด

เมื่อเอเจนต์พบข้อผิดพลาดจากการส่งหรือ provider นโยบายข้อผิดพลาดจะควบคุมว่าจะส่งข้อความข้อผิดพลาดไปยังแชต Telegram หรือไม่:

| คีย์                                 | ค่า                     | ค่าเริ่มต้น         | คำอธิบาย                                                                                                                                                                                               |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — ส่งทุกข้อความข้อผิดพลาดไปยังแชต `once` — ส่งข้อความข้อผิดพลาดที่ไม่ซ้ำแต่ละข้อความหนึ่งครั้งต่อช่วง cooldown (ระงับข้อผิดพลาดซ้ำที่เหมือนกัน) `silent` — ไม่ส่งข้อความข้อผิดพลาดไปยังแชต |
| `channels.telegram.errorCooldownMs` | ตัวเลข (ms)                | `14400000` (4h) | ช่วง cooldown สำหรับนโยบาย `once` หลังส่งข้อผิดพลาดแล้ว ข้อความข้อผิดพลาดเดียวกันจะถูกระงับจนกว่าช่วงเวลานี้จะผ่านไป ช่วยป้องกันสแปมข้อผิดพลาดระหว่าง outage                                      |

รองรับ override รายบัญชี รายกลุ่ม และรายหัวข้อ (ใช้ inheritance เดียวกับคีย์การกำหนดค่า Telegram อื่น ๆ)

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
  <Accordion title="Bot does not respond to non mention group messages">

    - หาก `requireMention=false` โหมด privacy ของ Telegram ต้องอนุญาตการมองเห็นแบบเต็ม
      - BotFather: `/setprivacy` -> Disable
      - จากนั้นนำบอตออกจากกลุ่มแล้วเพิ่มกลับเข้าไปใหม่
    - `openclaw channels status` จะแจ้งเตือนเมื่อการกำหนดค่าคาดหวังข้อความกลุ่มที่ไม่ได้ mention
    - `openclaw channels status --probe` สามารถตรวจสอบ group ID แบบตัวเลขที่ระบุชัดเจนได้; wildcard `"*"` ไม่สามารถตรวจสอบ membership ได้
    - การทดสอบ session แบบเร็ว: `/activation always`

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - เมื่อมี `channels.telegram.groups` กลุ่มต้องอยู่ในรายการ (หรือใส่ `"*"`)
    - ตรวจสอบ membership ของบอตในกลุ่ม
    - ตรวจสอบ log: `openclaw logs --follow` เพื่อดูเหตุผลที่ข้าม

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - อนุญาตตัวตนผู้ส่งของคุณ (การจับคู่และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังคงมีผลแม้นโยบายกลุ่มจะเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู native มีรายการมากเกินไป; ลดคำสั่งจาก Plugin/Skills/แบบกำหนดเอง หรือปิดใช้งานเมนู native
    - การเรียกตอนเริ่มต้น `deleteMyCommands` / `setMyCommands` และการเรียกพิมพ์ `sendChatAction` มีขอบเขตจำกัดและ retry หนึ่งครั้งผ่าน transport fallback ของ Telegram เมื่อคำขอ timeout ข้อผิดพลาด network/fetch ที่เกิดซ้ำมักบ่งชี้ปัญหาการเข้าถึง DNS/HTTPS ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="Startup reports unauthorized token">

    - `getMe returned 401` คือความล้มเหลวในการยืนยันตัวตนของ Telegram สำหรับ bot token ที่กำหนดค่าไว้
    - คัดลอกหรือสร้าง bot token ใหม่ใน BotFather แล้วอัปเดต `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` หรือ `TELEGRAM_BOT_TOKEN` สำหรับบัญชีเริ่มต้น
    - `deleteWebhook 401 Unauthorized` ระหว่างเริ่มต้นก็เป็นความล้มเหลวด้าน auth เช่นกัน; การถือว่าเป็น "ไม่มี webhook อยู่" จะเพียงเลื่อนความล้มเหลวจาก token ที่ไม่ถูกต้องเดิมไปยังการเรียก API ในภายหลัง

  </Accordion>

  <Accordion title="Polling or network instability">

    - Node 22+ พร้อม fetch/proxy แบบกำหนดเองอาจกระตุ้นพฤติกรรม abort ทันทีหากชนิด AbortSignal ไม่ตรงกัน
    - บาง host resolve `api.telegram.org` เป็น IPv6 ก่อน; egress IPv6 ที่เสียอาจทำให้ Telegram API ล้มเหลวเป็นครั้งคราว
    - หาก log มี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!` ตอนนี้ OpenClaw จะ retry รายการเหล่านี้เป็นข้อผิดพลาดเครือข่ายที่กู้คืนได้
    - ระหว่างการเริ่มต้น polling OpenClaw จะนำ probe `getMe` ตอนเริ่มต้นที่สำเร็จกลับมาใช้กับ grammY เพื่อให้ runner ไม่ต้องใช้ `getMe` ครั้งที่สองก่อน `getUpdates` ครั้งแรก
    - หาก `deleteWebhook` ล้มเหลวด้วยข้อผิดพลาดเครือข่ายชั่วคราวระหว่างการเริ่มต้น polling OpenClaw จะดำเนินต่อไปสู่ long polling แทนการเรียก control-plane ก่อน poll อีกครั้ง webhook ที่ยัง active อยู่จะแสดงเป็น conflict ของ `getUpdates`; จากนั้น OpenClaw จะสร้าง transport ของ Telegram ใหม่และ retry การล้าง webhook
    - หาก socket ของ Telegram ถูก recycle ตามรอบคงที่สั้น ๆ ให้ตรวจสอบว่า `channels.telegram.timeoutSeconds` ต่ำหรือไม่; ไคลเอนต์บอตจะจำกัดค่าที่กำหนดไว้ให้ต่ำกว่าตัวป้องกันคำขอขาออกและ `getUpdates` แต่ release เก่าอาจ abort ทุก poll หรือทุกคำตอบเมื่อค่านี้ถูกตั้งให้ต่ำกว่าตัวป้องกันเหล่านั้น
    - หาก log มี `Polling stall detected` OpenClaw จะรีสตาร์ท polling และสร้าง transport ของ Telegram ใหม่หลังจากไม่มี liveness ของ long-poll ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีโดยค่าเริ่มต้น
    - `openclaw channels status --probe` และ `openclaw doctor` จะแจ้งเตือนเมื่อบัญชี polling ที่ทำงานอยู่ยังไม่ได้ทำ `getUpdates` สำเร็จหลังช่วงผ่อนผันตอนเริ่มต้น เมื่อบัญชี webhook ที่ทำงานอยู่ยังไม่ได้ทำ `setWebhook` สำเร็จหลังช่วงผ่อนผันตอนเริ่มต้น หรือเมื่อกิจกรรม transport ของ polling ที่สำเร็จล่าสุดเก่าเกินไป
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่ทำงานนานยังปกติ แต่ host ของคุณยังรายงานการรีสตาร์ทจาก polling-stall แบบ false อยู่ การ stall ต่อเนื่องมักชี้ไปที่ปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่าง host กับ `api.telegram.org`
    - Telegram ยังรองรับ env proxy ของ process สำหรับ transport ของ Bot API รวมถึง `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และรูปแบบตัวพิมพ์เล็กของค่าเหล่านี้ `NO_PROXY` / `no_proxy` ยังสามารถ bypass `api.telegram.org` ได้
    - หาก proxy ที่ OpenClaw จัดการถูกกำหนดค่าผ่าน `OPENCLAW_PROXY_URL` สำหรับสภาพแวดล้อม service และไม่มี env proxy มาตรฐาน Telegram จะใช้ URL นั้นสำหรับ transport ของ Bot API ด้วย
    - บน VPS host ที่มี egress/TLS โดยตรงไม่เสถียร ให้ route การเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ ตั้งค่าเริ่มต้นเป็น `autoSelectFamily=true` (ยกเว้น WSL2) ลำดับผลลัพธ์ DNS ของ Telegram จะใช้ `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER` ก่อน ตามด้วย `channels.telegram.network.dnsResultOrder` แล้วจึงใช้ค่าเริ่มต้นของกระบวนการ เช่น `NODE_OPTIONS=--dns-result-order=ipv4first`; หากไม่มีค่าใดใช้ได้ Node 22+ จะถอยกลับไปใช้ `ipv4first`
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนด้วยพฤติกรรมแบบ IPv4 เท่านั้น ให้บังคับการเลือกแฟมิลี:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบช่วงเบนช์มาร์ก RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาตแล้ว
      สำหรับการดาวน์โหลดสื่อ Telegram ตามค่าเริ่มต้น หาก fake-IP ที่เชื่อถือได้หรือ
      พร็อกซีแบบ transparent เขียน `api.telegram.org` ใหม่เป็นที่อยู่
      ส่วนตัว/ภายใน/ใช้งานพิเศษอื่นระหว่างการดาวน์โหลดสื่อ คุณสามารถเลือกใช้
      การบายพาสเฉพาะ Telegram ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - การเลือกใช้เดียวกันนี้มีให้ต่อบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หากพร็อกซีของคุณแปลงโฮสต์สื่อ Telegram เป็น `198.18.x.x` ให้ปิดแฟล็ก
      อันตรายไว้ก่อน สื่อ Telegram อนุญาตช่วงเบนช์มาร์ก RFC 2544
      ตามค่าเริ่มต้นอยู่แล้ว

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` ทำให้การป้องกัน
      SSRF ของสื่อ Telegram อ่อนลง ใช้เฉพาะกับสภาพแวดล้อมพร็อกซีที่ควบคุมโดยผู้ปฏิบัติงานที่เชื่อถือได้
      เช่น การกำหนดเส้นทาง fake-IP ของ Clash, Mihomo หรือ Surge เมื่อระบบเหล่านั้น
      สร้างคำตอบแบบส่วนตัวหรือใช้งานพิเศษนอกช่วงเบนช์มาร์ก RFC 2544
      ปิดไว้สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ
    </Warning>

    - การแทนที่ด้วย environment (ชั่วคราว):
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

ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา Channel](/th/channels/troubleshooting)

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Telegram](/th/gateway/config-channels#telegram)

<Accordion title="ฟิลด์ Telegram ที่มีสัญญาณสำคัญ">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; symlink จะถูกปฏิเสธ)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- ค่าเริ่มต้นของหัวข้อ: `groups.<chatId>.topics."*"` ใช้กับหัวข้อฟอรัมที่ไม่ตรงกัน; ID หัวข้อที่ตรงกันจะแทนที่ค่านี้
- การอนุมัติ exec: `execApprovals`, `accounts.*.execApprovals`
- คำสั่ง/เมนู: `commands.native`, `commands.nativeSkills`, `customCommands`
- เธรด/การตอบกลับ: `replyToMode`
- การสตรีม: `streaming` (พรีวิว), `streaming.preview.toolProgress`, `blockStreaming`
- การจัดรูปแบบ/การส่งมอบ: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- สื่อ/เครือข่าย: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- ราก API แบบกำหนดเอง: `apiRoot` (ราก Bot API เท่านั้น; อย่าใส่ `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- การดำเนินการ/ความสามารถ: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- ปฏิกิริยา: `reactionNotifications`, `reactionLevel`
- ข้อผิดพลาด: `errorPolicy`, `errorCooldownMs`
- การเขียน/ประวัติ: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญของหลายบัญชี: เมื่อกำหนดค่า ID บัญชีตั้งแต่สองบัญชีขึ้นไป ให้ตั้งค่า `channels.telegram.defaultAccount` (หรือรวม `channels.telegram.accounts.default`) เพื่อทำให้การกำหนดเส้นทางเริ่มต้นชัดเจน มิฉะนั้น OpenClaw จะถอยกลับไปใช้ ID บัญชีแรกที่ normalize แล้ว และ `openclaw doctor` จะแจ้งเตือน บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom` แต่ไม่สืบทอดค่า `accounts.default.*`
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
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเสริมความแข็งแกร่ง
  </Card>
  <Card title="การกำหนดเส้นทางหลายเอเจนต์" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกลุ่มและหัวข้อไปยังเอเจนต์
  </Card>
  <Card title="การแก้ไขปัญหา" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้าม Channel
  </Card>
</CardGroup>
