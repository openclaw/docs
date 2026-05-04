---
read_when:
    - การทำงานกับฟีเจอร์ของ Telegram หรือ Webhook
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของบอต Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-04T09:36:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5711d53cf908a14024bc5a94f7d590bb4bcb6963a1d78049d7782871f4eae932
    source_path: channels/telegram.md
    workflow: 16
---

พร้อมใช้งานจริงสำหรับ DM และกลุ่มของบอตผ่าน grammY โหมดเริ่มต้นคือ long polling ส่วนโหมด webhook เป็นทางเลือก

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับ Telegram คือการจับคู่
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและคู่มือปฏิบัติสำหรับการซ่อมแซม
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าช่องทางแบบครบถ้วน
  </Card>
</CardGroup>

## ตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="Create the bot token in BotFather">
    เปิด Telegram แล้วแชตกับ **@BotFather** (ยืนยันว่าแฮนเดิลคือ `@BotFather` ทุกตัวอักษร)

    รัน `/newbot` ทำตามข้อความแจ้ง แล้วบันทึกโทเค็นไว้

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

    ค่าทดแทนจาก env: `TELEGRAM_BOT_TOKEN=...` (เฉพาะบัญชีเริ่มต้น)
    Telegram **ไม่** ใช้ `openclaw channels login telegram`; ให้กำหนดค่าโทเค็นใน config/env แล้วเริ่ม gateway

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    รหัสจับคู่หมดอายุหลังจาก 1 ชั่วโมง

  </Step>

  <Step title="Add the bot to a group">
    เพิ่มบอตเข้ากลุ่มของคุณ จากนั้นตั้งค่า `channels.telegram.groups` และ `groupPolicy` ให้ตรงกับโมเดลการเข้าถึงของคุณ
  </Step>
</Steps>

<Note>
ลำดับการแก้ค่าโทเค็นรับรู้ตามบัญชี ในทางปฏิบัติ ค่าจาก config จะชนะค่าทดแทนจาก env และ `TELEGRAM_BOT_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    บอต Telegram ใช้ **Privacy Mode** เป็นค่าเริ่มต้น ซึ่งจำกัดข้อความกลุ่มที่บอตจะได้รับ

    หากบอตต้องเห็นข้อความทั้งหมดในกลุ่ม ให้ทำอย่างใดอย่างหนึ่ง:

    - ปิด privacy mode ผ่าน `/setprivacy` หรือ
    - ตั้งบอตให้เป็นผู้ดูแลกลุ่ม

    เมื่อสลับ privacy mode ให้ลบแล้วเพิ่มบอตกลับเข้าไปในแต่ละกลุ่ม เพื่อให้ Telegram นำการเปลี่ยนแปลงไปใช้

  </Accordion>

  <Accordion title="Group permissions">
    สถานะผู้ดูแลควบคุมในหน้าการตั้งค่ากลุ่มของ Telegram

    บอตที่เป็นผู้ดูแลจะได้รับข้อความกลุ่มทั้งหมด ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มแบบเปิดตลอดเวลา

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` เพื่ออนุญาต/ปฏิเสธการเพิ่มเข้ากลุ่ม
    - `/setprivacy` สำหรับพฤติกรรมการมองเห็นในกลุ่ม

  </Accordion>
</AccordionGroup>

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` ควบคุมการเข้าถึงข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist` (ต้องมี ID ผู้ส่งอย่างน้อยหนึ่งรายการใน `allowFrom`)
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    `dmPolicy: "open"` พร้อม `allowFrom: ["*"]` ทำให้บัญชี Telegram ใดก็ตามที่พบหรือเดาชื่อผู้ใช้ของบอตได้สามารถสั่งงานบอตได้ ใช้เฉพาะกับบอตสาธารณะที่ตั้งใจเปิดจริงและมีเครื่องมือที่จำกัดอย่างเข้มงวดเท่านั้น; บอตเจ้าของเดียวควรใช้ `allowlist` พร้อม ID ผู้ใช้แบบตัวเลข

    `channels.telegram.allowFrom` รับ ID ผู้ใช้ Telegram แบบตัวเลข พรีฟิกซ์ `telegram:` / `tg:` ใช้ได้และจะถูกปรับให้อยู่ในรูปมาตรฐาน
    ใน config หลายบัญชี ค่า `channels.telegram.allowFrom` ระดับบนสุดที่จำกัดเข้มงวดจะถือเป็นขอบเขตความปลอดภัย: รายการ `allowFrom: ["*"]` ระดับบัญชีจะไม่ทำให้บัญชีนั้นเป็นสาธารณะ เว้นแต่ allowlist ที่มีผลของบัญชียังคงมี wildcard แบบชัดเจนหลังจากรวมค่าแล้ว
    `dmPolicy: "allowlist"` พร้อม `allowFrom` ว่างจะบล็อก DM ทั้งหมดและถูกปฏิเสธโดยการตรวจสอบความถูกต้องของ config
    การตั้งค่าจะขอเฉพาะ ID ผู้ใช้แบบตัวเลขเท่านั้น
    หากคุณอัปเกรดแล้ว config มีรายการ allowlist แบบ `@username` ให้รัน `openclaw doctor --fix` เพื่อแก้ให้เป็น ID (ทำเท่าที่ทำได้; ต้องใช้โทเค็นบอต Telegram)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์ allowlist ใน pairing-store, `openclaw doctor --fix` สามารถกู้รายการเข้าไปใน `channels.telegram.allowFrom` ใน flow แบบ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID ชัดเจน)

    สำหรับบอตเจ้าของเดียว ควรใช้ `dmPolicy: "allowlist"` พร้อม ID `allowFrom` แบบตัวเลขที่ระบุชัดเจน เพื่อให้นโยบายการเข้าถึงคงทนใน config (แทนการพึ่งพาการอนุมัติการจับคู่ก่อนหน้า)

    จุดที่มักสับสน: การอนุมัติการจับคู่ DM ไม่ได้หมายความว่า "ผู้ส่งนี้ได้รับอนุญาตทุกที่"
    การจับคู่ให้สิทธิ์เข้าถึง DM หากยังไม่มีเจ้าของคำสั่ง การจับคู่ที่อนุมัติครั้งแรกจะตั้ง `commands.ownerAllowFrom` ด้วย เพื่อให้คำสั่งสำหรับเจ้าของเท่านั้นและการอนุมัติ exec มีบัญชีผู้ปฏิบัติงานที่ชัดเจน
    การอนุญาตผู้ส่งในกลุ่มยังคงมาจาก allowlist ใน config ที่ระบุชัดเจน
    หากคุณต้องการ "ฉันได้รับอนุญาตครั้งเดียวแล้วทั้ง DM และคำสั่งในกลุ่มใช้งานได้" ให้ใส่ ID ผู้ใช้ Telegram แบบตัวเลขของคุณใน `channels.telegram.allowFrom`; สำหรับคำสั่งเจ้าของเท่านั้น ให้ตรวจสอบว่า `commands.ownerAllowFrom` มี `telegram:<your user id>`

    ### การหา ID ผู้ใช้ Telegram ของคุณ

    วิธีที่ปลอดภัยกว่า (ไม่มีบอตบุคคลที่สาม):

    1. DM ไปยังบอตของคุณ
    2. รัน `openclaw logs --follow`
    3. อ่าน `from.id`

    วิธีจาก Bot API อย่างเป็นทางการ:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีผ่านบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="Group policy and allowlists">
    มีตัวควบคุมสองส่วนที่ใช้ร่วมกัน:

    1. **กลุ่มใดได้รับอนุญาต** (`channels.telegram.groups`)
       - ไม่มี config `groups`:
         - เมื่อใช้ `groupPolicy: "open"`: ทุกกลุ่มสามารถผ่านการตรวจสอบ group-ID ได้
         - เมื่อใช้ `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการ `groups` (หรือ `"*"`)
       - กำหนดค่า `groups` แล้ว: ทำหน้าที่เป็น allowlist (ID ที่ระบุชัดเจนหรือ `"*"`)

    2. **ผู้ส่งใดได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่าไว้ Telegram จะย้อนกลับไปใช้ `allowFrom`
    รายการ `groupAllowFrom` ควรเป็น ID ผู้ใช้ Telegram แบบตัวเลข (พรีฟิกซ์ `telegram:` / `tg:` จะถูกปรับให้อยู่ในรูปมาตรฐาน)
    อย่าใส่ ID แชตของกลุ่ม Telegram หรือ supergroup ใน `groupAllowFrom` ID แชตค่าลบต้องอยู่ใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเว้นสำหรับการอนุญาตผู้ส่ง
    ขอบเขตความปลอดภัย (`2026.2.25+`): การตรวจสอบสิทธิ์ผู้ส่งในกลุ่ม **ไม่** สืบทอดการอนุมัติจาก DM pairing-store
    การจับคู่ยังคงเป็นเฉพาะ DM เท่านั้น สำหรับกลุ่ม ให้ตั้ง `groupAllowFrom` หรือ `allowFrom` รายกลุ่ม/รายหัวข้อ
    หากไม่ได้ตั้ง `groupAllowFrom`, Telegram จะย้อนกลับไปใช้ `allowFrom` จาก config ไม่ใช่ pairing store
    รูปแบบที่ใช้ได้จริงสำหรับบอตเจ้าของเดียว: ตั้ง ID ผู้ใช้ของคุณใน `channels.telegram.allowFrom` ปล่อย `groupAllowFrom` ไว้โดยไม่ตั้งค่า และอนุญาตกลุ่มเป้าหมายใต้ `channels.telegram.groups`
    หมายเหตุ runtime: หากไม่มี `channels.telegram` เลย runtime จะใช้ค่าเริ่มต้นแบบปิดเมื่อไม่อนุญาต `groupPolicy="allowlist"` เว้นแต่จะตั้ง `channels.defaults.groupPolicy` ไว้อย่างชัดเจน

    ตัวอย่าง: อนุญาตสมาชิกทุกคนในกลุ่มหนึ่งที่ระบุ:

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

    ตัวอย่าง: อนุญาตเฉพาะผู้ใช้ที่ระบุภายในกลุ่มหนึ่งที่ระบุ:

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

      - ใส่ ID แชตของกลุ่ม Telegram หรือ supergroup ที่เป็นค่าลบ เช่น `-1001234567890` ไว้ใต้ `channels.telegram.groups`
      - ใส่ ID ผู้ใช้ Telegram เช่น `8734062810` ไว้ใต้ `groupAllowFrom` เมื่อต้องการจำกัดว่าคนใดในกลุ่มที่ได้รับอนุญาตสามารถเรียกบอตได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกคนใดก็ได้ของกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอตได้

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    การตอบกลับในกลุ่มต้องมีการ mention โดยค่าเริ่มต้น

    การ mention อาจมาจาก:

    - การ mention แบบเนทีฟ `@botusername` หรือ
    - รูปแบบการ mention ใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    ตัวสลับคำสั่งระดับเซสชัน:

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

    การหา ID แชตของกลุ่ม:

    - ส่งต่อข้อความกลุ่มไปยัง `@userinfobot` / `@getidsbot`
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจสอบ `getUpdates` ของ Bot API

  </Tab>
</Tabs>

## พฤติกรรม runtime

- Telegram เป็นของกระบวนการ gateway
- การกำหนดเส้นทางเป็นแบบกำหนดแน่นอน: ข้อความขาเข้าจาก Telegram จะตอบกลับไปยัง Telegram (โมเดลไม่ได้เลือกช่องทาง)
- ข้อความขาเข้าถูกปรับให้อยู่ใน envelope ช่องทางร่วมพร้อมเมตาดาต้าการตอบกลับและ placeholder สื่อ
- เซสชันกลุ่มแยกตาม ID กลุ่ม หัวข้อ forum จะต่อท้าย `:topic:<threadId>` เพื่อแยกหัวข้อออกจากกัน
- ข้อความ DM สามารถมี `message_thread_id`; OpenClaw จะเก็บ thread ID ไว้สำหรับการตอบกลับ แต่คง DM ไว้บนเซสชันแบบแบนเป็นค่าเริ่มต้น กำหนดค่า `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` หรือ config หัวข้อที่ตรงกัน เมื่อคุณตั้งใจต้องการแยกเซสชันหัวข้อของ DM
- Long polling ใช้ grammY runner พร้อมการจัดลำดับต่อแชต/ต่อเธรด concurrency ของ runner sink โดยรวมใช้ `agents.defaults.maxConcurrent`
- Long polling ถูกป้องกันภายในแต่ละกระบวนการ gateway เพื่อให้มี poller ที่ใช้งานอยู่เพียงตัวเดียวที่ใช้โทเค็นบอตหนึ่งรายการในเวลาเดียวกัน หากคุณยังเห็น conflict `getUpdates` 409 อาจมี OpenClaw gateway, สคริปต์ หรือ poller ภายนอกอีกตัวกำลังใช้โทเค็นเดียวกัน
- การรีสตาร์ทจาก watchdog ของ long-polling จะทริกเกอร์หลังจาก 120 วินาทีที่ไม่มี liveness ของ `getUpdates` ที่เสร็จสมบูรณ์ตามค่าเริ่มต้น เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อ deployment ของคุณยังพบการรีสตาร์ท polling-stall ที่เป็น false ระหว่างงานที่ใช้เวลานาน ค่านี้มีหน่วยเป็นมิลลิวินาทีและอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับการ override ต่อบัญชี
- Telegram Bot API ไม่รองรับ read receipt (`sendReadReceipts` ใช้ไม่ได้)

## อ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw สามารถ stream การตอบกลับบางส่วนแบบเรียลไทม์:

    - แชตโดยตรง: ข้อความตัวอย่าง + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความตัวอย่าง + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` คือ `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - `progress` จะเก็บร่างสถานะที่แก้ไขได้หนึ่งรายการและอัปเดตด้วยความคืบหน้าของเครื่องมือจนกว่าจะส่งขั้นสุดท้าย
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความตัวอย่างที่แก้ไขเดิมซ้ำหรือไม่ (ค่าเริ่มต้น: `true` เมื่อ preview streaming เปิดใช้งานอยู่)
    - `streaming.preview.commandText` ควบคุมรายละเอียด command/exec ภายในบรรทัดความคืบหน้าของเครื่องมือเหล่านั้น: `raw` (ค่าเริ่มต้น รักษาพฤติกรรมที่เผยแพร่แล้ว) หรือ `status` (เฉพาะป้ายกำกับเครื่องมือ)
    - ตรวจพบค่า legacy `channels.telegram.streamMode` และค่า boolean `streaming`; รัน `openclaw doctor --fix` เพื่อย้ายไปยัง `channels.telegram.streaming.mode`

    การอัปเดตตัวอย่างความคืบหน้าของเครื่องมือคือบรรทัดสถานะสั้นๆ ที่แสดงขณะเครื่องมือทำงาน เช่น การรันคำสั่ง การอ่านไฟล์ การอัปเดตการวางแผน หรือสรุปแพตช์ Telegram เปิดใช้สิ่งเหล่านี้เป็นค่าเริ่มต้นเพื่อให้ตรงกับพฤติกรรม OpenClaw ที่เผยแพร่ตั้งแต่ `v2026.4.22` เป็นต้นไป หากต้องการคงตัวอย่างที่แก้ไขได้สำหรับข้อความคำตอบ แต่ซ่อนบรรทัดความคืบหน้าของเครื่องมือ ให้ตั้งค่า:

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

    หากต้องการคงความคืบหน้าของเครื่องมือให้มองเห็นได้ แต่ซ่อนข้อความ command/exec ให้ตั้งค่า:

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

    สำหรับโหมดร่างความคืบหน้า ให้วางนโยบายข้อความคำสั่งเดียวกันไว้ใต้ `streaming.progress`:

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

    ใช้ `streaming.mode: "off"` เฉพาะเมื่อคุณต้องการส่งเฉพาะคำตอบสุดท้ายเท่านั้น: การแก้ไขตัวอย่างคำตอบของ Telegram จะถูกปิดใช้ และข้อความทั่วไปเกี่ยวกับเครื่องมือ/ความคืบหน้าจะถูกระงับแทนที่จะส่งเป็นข้อความสถานะแยกต่างหาก พรอมป์ขออนุมัติ เพย์โหลดสื่อ และข้อผิดพลาดจะยังคงถูกส่งผ่านการส่งคำตอบสุดท้ายตามปกติ ใช้ `streaming.preview.toolProgress: false` เมื่อคุณต้องการคงการแก้ไขตัวอย่างคำตอบไว้เท่านั้น โดยซ่อนบรรทัดสถานะความคืบหน้าของเครื่องมือ

    <Note>
      การตอบกลับด้วยคำอ้างอิงที่เลือกใน Telegram เป็นข้อยกเว้น เมื่อ `replyToMode` เป็น `"first"`, `"all"` หรือ `"batched"` และข้อความขาเข้ามีข้อความอ้างอิงที่เลือก OpenClaw จะส่งคำตอบสุดท้ายผ่านเส้นทางตอบกลับคำอ้างอิงแบบเนทีฟของ Telegram แทนการแก้ไขตัวอย่างคำตอบ ดังนั้น `streaming.preview.toolProgress` จึงไม่สามารถแสดงบรรทัดสถานะสั้นสำหรับรอบนั้นได้ การตอบกลับข้อความปัจจุบันที่ไม่มีข้อความอ้างอิงที่เลือกจะยังคงใช้การสตรีมตัวอย่าง ตั้งค่า `replyToMode: "off"` เมื่อการมองเห็นความคืบหน้าของเครื่องมือสำคัญกว่าการตอบกลับคำอ้างอิงแบบเนทีฟ หรือตั้งค่า `streaming.preview.toolProgress: false` เพื่อยอมรับข้อแลกเปลี่ยนนี้
    </Note>

    สำหรับการตอบกลับแบบข้อความเท่านั้น:

    - ตัวอย่างสั้นใน DM/กลุ่ม/หัวข้อ: OpenClaw จะคงข้อความตัวอย่างเดิมไว้และแก้ไขสุดท้ายในตำแหน่งเดิม เว้นแต่มีข้อความที่มองเห็นได้ซึ่งไม่ใช่ตัวอย่างถูกส่งหลังจากตัวอย่างปรากฏ
    - ตัวอย่างที่ตามด้วยเอาต์พุตที่มองเห็นได้ซึ่งไม่ใช่ตัวอย่าง: OpenClaw จะส่งคำตอบที่เสร็จสมบูรณ์เป็นข้อความสุดท้ายใหม่ และล้างตัวอย่างเก่า เพื่อให้คำตอบสุดท้ายปรากฏหลังเอาต์พุตระหว่างกลาง
    - ตัวอย่างที่เก่ากว่าประมาณหนึ่งนาที: OpenClaw จะส่งคำตอบที่เสร็จสมบูรณ์เป็นข้อความสุดท้ายใหม่ แล้วจึงล้างตัวอย่าง เพื่อให้เวลาประทับที่มองเห็นได้ของ Telegram สะท้อนเวลาที่เสร็จสิ้นแทนเวลาที่สร้างตัวอย่าง

    สำหรับการตอบกลับที่ซับซ้อน (เช่น เพย์โหลดสื่อ) OpenClaw จะถอยกลับไปใช้การส่งคำตอบสุดท้ายตามปกติ แล้วจึงล้างข้อความตัวอย่าง

    การสตรีมตัวอย่างแยกจากการสตรีมบล็อก เมื่อเปิดใช้การสตรีมบล็อกสำหรับ Telegram อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

    สตรีมการให้เหตุผลเฉพาะ Telegram:

    - `/reasoning stream` ส่งการให้เหตุผลไปยังตัวอย่างสดขณะกำลังสร้างคำตอบ
    - ตัวอย่างการให้เหตุผลจะถูกลบหลังส่งคำตอบสุดท้าย ใช้ `/reasoning on` เมื่อควรให้การให้เหตุผลยังคงมองเห็นได้
    - คำตอบสุดท้ายจะถูกส่งโดยไม่มีข้อความการให้เหตุผล

  </Accordion>

  <Accordion title="การจัดรูปแบบและทางเลือกสำรอง HTML">
    ข้อความขาออกใช้ Telegram `parse_mode: "HTML"`

    - ข้อความลักษณะ Markdown จะถูกเรนเดอร์เป็น HTML ที่ปลอดภัยสำหรับ Telegram
    - HTML ดิบจากโมเดลจะถูก escape เพื่อลดความล้มเหลวในการแยกวิเคราะห์ของ Telegram
    - หาก Telegram ปฏิเสธ HTML ที่แยกวิเคราะห์แล้ว OpenClaw จะลองส่งใหม่เป็นข้อความธรรมดา

    ตัวอย่างลิงก์เปิดใช้โดยค่าเริ่มต้น และสามารถปิดใช้ได้ด้วย `channels.telegram.linkPreview: false`

  </Accordion>

  <Accordion title="คำสั่งเนทีฟและคำสั่งแบบกำหนดเอง">
    การลงทะเบียนเมนูคำสั่งของ Telegram จะจัดการตอนเริ่มต้นด้วย `setMyCommands`

    ค่าเริ่มต้นของคำสั่งเนทีฟ:

    - `commands.native: "auto"` เปิดใช้คำสั่งเนทีฟสำหรับ Telegram

    เพิ่มรายการเมนูคำสั่งแบบกำหนดเอง:

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
    - คำสั่งแบบกำหนดเองไม่สามารถแทนที่คำสั่งเนทีฟได้
    - ความขัดแย้ง/รายการซ้ำจะถูกข้ามและบันทึกในล็อก

    หมายเหตุ:

    - คำสั่งแบบกำหนดเองเป็นเพียงรายการเมนูเท่านั้น และจะไม่สร้างพฤติกรรมให้โดยอัตโนมัติ
    - คำสั่ง Plugin/Skills ยังสามารถทำงานได้เมื่อพิมพ์ แม้จะไม่แสดงในเมนู Telegram

    หากปิดใช้คำสั่งเนทีฟ คำสั่งในตัวจะถูกลบออก คำสั่งแบบกำหนดเอง/Plugin อาจยังลงทะเบียนได้หากกำหนดค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังล้นหลังจากตัดรายการแล้ว ให้ลดคำสั่ง Plugin/Skills/แบบกำหนดเอง หรือปิดใช้ `channels.telegram.commands.native`
    - `deleteWebhook`, `deleteMyCommands` หรือ `setMyCommands` ล้มเหลวด้วย `404: Not Found` ขณะที่คำสั่ง curl ของ Bot API โดยตรงทำงานได้ อาจหมายความว่า `channels.telegram.apiRoot` ถูกตั้งเป็นปลายทาง `/bot<TOKEN>` แบบเต็ม `apiRoot` ต้องเป็นเฉพาะราก Bot API เท่านั้น และ `openclaw doctor --fix` จะลบ `/bot<TOKEN>` ต่อท้ายที่เกิดโดยไม่ตั้งใจ
    - `getMe returned 401` หมายความว่า Telegram ปฏิเสธโทเค็นบอตที่กำหนดค่าไว้ อัปเดต `botToken`, `tokenFile` หรือ `TELEGRAM_BOT_TOKEN` ด้วยโทเค็น BotFather ปัจจุบัน; OpenClaw จะหยุดก่อนการ polling ดังนั้นจึงไม่ถูกรายงานเป็นความล้มเหลวในการล้าง Webhook
    - `setMyCommands failed` พร้อมข้อผิดพลาดเครือข่าย/fetch มักหมายความว่า DNS/HTTPS ขาออกไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งจับคู่อุปกรณ์ (Plugin `device-pair`)

    เมื่อมีการติดตั้ง Plugin `device-pair`:

    1. `/pair` สร้างรหัสตั้งค่า
    2. วางรหัสในแอป iOS
    3. `/pair pending` แสดงรายการคำขอที่รอดำเนินการ (รวมถึงบทบาท/ขอบเขต)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบระบุชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    รหัสตั้งค่ามีโทเค็นบูตสแตรปอายุสั้น การส่งต่อบูตสแตรปในตัวจะคงโทเค็นโหนดหลักไว้ที่ `scopes: []`; โทเค็นผู้ปฏิบัติการที่ถูกส่งต่อจะยังถูกจำกัดอยู่ที่ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write` การตรวจสอบขอบเขตบูตสแตรปมีคำนำหน้าบทบาท ดังนั้น allowlist ของผู้ปฏิบัติการนั้นจะตอบสนองเฉพาะคำขอผู้ปฏิบัติการเท่านั้น บทบาทที่ไม่ใช่ผู้ปฏิบัติการยังต้องมีขอบเขตภายใต้คำนำหน้าบทบาทของตนเอง

    หากอุปกรณ์ลองใหม่ด้วยรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (เช่น บทบาท/ขอบเขต/กุญแจสาธารณะ) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` อื่น เรียก `/pair pending` อีกครั้งก่อนอนุมัติ

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

    `capabilities: ["inlineButtons"]` แบบเดิมจะ map ไปเป็น `inlineButtons: "all"`

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

    การคลิก callback จะถูกส่งต่อไปยังเอเจนต์เป็นข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="การกระทำกับข้อความ Telegram สำหรับเอเจนต์และระบบอัตโนมัติ">
    การกระทำของเครื่องมือ Telegram ประกอบด้วย:

    - `sendMessage` (`to`, `content`, ตัวเลือก `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, ตัวเลือก `iconColor`, `iconCustomEmojiId`)

    การกระทำกับข้อความของช่องทางเปิดเผย alias ที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    ตัวควบคุม gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้)

    หมายเหตุ: `edit` และ `topic-create` เปิดใช้โดยค่าเริ่มต้นในปัจจุบัน และไม่มี toggle `channels.telegram.actions.*` แยกต่างหาก
    การส่งขณะรันไทม์ใช้สแนปชอตการกำหนดค่า/ความลับที่ใช้งานอยู่ (เริ่มต้น/โหลดใหม่) ดังนั้นเส้นทางการกระทำจะไม่ re-resolve SecretRef แบบเฉพาะกิจต่อการส่งแต่ละครั้ง

    ความหมายของการลบรีแอ็กชัน: [/tools/reactions](/th/tools/reactions)

  </Accordion>

  <Accordion title="แท็กเธรดการตอบกลับ">
    Telegram รองรับแท็กเธรดการตอบกลับแบบชัดเจนในเอาต์พุตที่สร้างขึ้น:

    - `[[reply_to_current]]` ตอบกลับข้อความที่เรียกใช้งาน
    - `[[reply_to:<id>]]` ตอบกลับ ID ข้อความ Telegram ที่ระบุ

    `channels.telegram.replyToMode` ควบคุมการจัดการ:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`

    เมื่อเปิดใช้เธรดการตอบกลับและมีข้อความหรือคำบรรยาย Telegram ต้นฉบับ OpenClaw จะใส่ข้อความอ้างอิง Telegram แบบเนทีฟโดยอัตโนมัติ Telegram จำกัดข้อความอ้างอิงแบบเนทีฟไว้ที่ 1024 หน่วยโค้ด UTF-16 ดังนั้นข้อความที่ยาวกว่าจะถูกอ้างอิงจากตอนต้น และถอยกลับไปใช้การตอบกลับธรรมดาหาก Telegram ปฏิเสธคำอ้างอิง

    หมายเหตุ: `off` ปิดใช้เธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงได้รับการปฏิบัติตาม

  </Accordion>

  <Accordion title="หัวข้อฟอรัมและพฤติกรรมของเธรด">
    ซูเปอร์กรุ๊ปแบบฟอรัม:

    - คีย์เซสชันของหัวข้อจะต่อท้าย `:topic:<threadId>`
    - การตอบกลับและการพิมพ์จะกำหนดเป้าหมายไปที่เธรดของหัวข้อ
    - เส้นทางการกำหนดค่าหัวข้อ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของหัวข้อทั่วไป (`threadId=1`):

    - การส่งข้อความจะละ `message_thread_id` (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - การกระทำการพิมพ์ยังคงรวม `message_thread_id`

    การสืบทอดของหัวข้อ: รายการหัวข้อจะสืบทอดการตั้งค่ากลุ่ม เว้นแต่ถูกแทนที่ (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` ใช้เฉพาะหัวข้อและไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม

    **การกำหนดเส้นทางเอเจนต์รายหัวข้อ**: แต่ละหัวข้อสามารถกำหนดเส้นทางไปยังเอเจนต์ที่ต่างกันได้โดยตั้งค่า `agentId` ในการกำหนดค่าหัวข้อ วิธีนี้ทำให้แต่ละหัวข้อมีพื้นที่ทำงาน หน่วยความจำ และเซสชันที่แยกเป็นของตนเอง ตัวอย่าง:

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

    **การผูกหัวข้อ ACP แบบถาวร**: หัวข้อฟอรัมสามารถปักหมุดเซสชัน ACP harness ผ่านการผูก ACP แบบมีชนิดที่ระดับบนสุด (`bindings[]` พร้อม `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ id ที่ระบุหัวข้อ เช่น `-1001234567890:topic:42`) ขณะนี้จำกัดขอบเขตเฉพาะหัวข้อฟอรัมในกลุ่ม/ซูเปอร์กรุ๊ป ดู [เอเจนต์ ACP](/th/tools/acp-agents)

    **การ spawn ACP ที่ผูกกับเธรดจากแชท**: `/acp spawn <agent> --thread here|auto` ผูกหัวข้อปัจจุบันกับเซสชัน ACP ใหม่; ข้อความติดตามผลจะถูกกำหนดเส้นทางไปที่นั่นโดยตรง OpenClaw จะปักหมุดการยืนยันการ spawn ในหัวข้อนั้น ต้องให้ `channels.telegram.threadBindings.spawnSessions` ยังคงเปิดใช้ (ค่าเริ่มต้น: `true`)

    บริบทของเทมเพลตเปิดเผย `MessageThreadId` และ `IsForum` แชต DM ที่มี `message_thread_id` จะคงการกำหนดเส้นทาง DM และเมตาดาต้าการตอบกลับไว้ในเซสชันแบบแบนตามค่าเริ่มต้น; โดยจะใช้คีย์เซสชันที่รับรู้เธรดเมื่อกำหนดค่าด้วย `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` หรือการกำหนดค่าหัวข้อที่ตรงกันเท่านั้น ใช้ `channels.telegram.dm.threadReplies` ระดับบนสุดสำหรับค่าเริ่มต้นของบัญชี หรือ `direct.<chatId>.threadReplies` สำหรับ DM รายการเดียว

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### ข้อความเสียง

    Telegram แยกความแตกต่างระหว่างบันทึกเสียงกับไฟล์เสียง

    - ค่าเริ่มต้น: ลักษณะการทำงานแบบไฟล์เสียง
    - แท็ก `[[audio_as_voice]]` ในคำตอบของเอเจนต์เพื่อบังคับให้ส่งเป็นบันทึกเสียง
    - ทรานสคริปต์ของบันทึกเสียงขาเข้าจะถูกใส่กรอบว่าเป็นข้อความที่เครื่องสร้างขึ้นและไม่น่าเชื่อถือ
      ในบริบทของเอเจนต์; การตรวจจับการกล่าวถึงยังคงใช้ทรานสคริปต์ดิบ
      ดังนั้นข้อความเสียงที่ต้องมีการกล่าวถึงจึงยังทำงานต่อไป

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

    Telegram แยกความแตกต่างระหว่างไฟล์วิดีโอกับบันทึกวิดีโอ

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

    บันทึกวิดีโอไม่รองรับคำบรรยาย; ข้อความที่ให้มาจะถูกส่งแยกต่างหาก

    ### สติกเกอร์

    การจัดการสติกเกอร์ขาเข้า:

    - WEBP แบบคงที่: ดาวน์โหลดและประมวลผลแล้ว (ตัวยึดตำแหน่ง `<media:sticker>`)
    - TGS แบบเคลื่อนไหว: ข้าม
    - WEBM แบบวิดีโอ: ข้าม

    ฟิลด์บริบทของสติกเกอร์:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ไฟล์แคชสติกเกอร์:

    - `~/.openclaw/telegram/sticker-cache.json`

    สติกเกอร์จะถูกอธิบายหนึ่งครั้ง (เมื่อทำได้) และแคชไว้เพื่อลดการเรียกใช้วิชันซ้ำ

    เปิดใช้การดำเนินการกับสติกเกอร์:

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

  <Accordion title="Reaction notifications">
    รีแอ็กชันของ Telegram มาถึงเป็นการอัปเดต `message_reaction` (แยกจากเพย์โหลดของข้อความ)

    เมื่อเปิดใช้ OpenClaw จะจัดคิวเหตุการณ์ระบบ เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    การกำหนดค่า:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงรีแอ็กชันของผู้ใช้ต่อข้อความที่บอตส่งเท่านั้น (พยายามให้ดีที่สุดผ่านแคชข้อความที่ส่งแล้ว)
    - เหตุการณ์รีแอ็กชันยังคงเคารพการควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ให้ ID เธรดในการอัปเดตรีแอ็กชัน
      - กลุ่มที่ไม่ใช่ฟอรัมจะกำหนดเส้นทางไปยังเซสชันแชตกลุ่ม
      - กลุ่มฟอรัมจะกำหนดเส้นทางไปยังเซสชันหัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อต้นทางที่แน่นอน

    `allowed_updates` สำหรับ polling/webhook จะรวม `message_reaction` โดยอัตโนมัติ

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` ส่งอีโมจิรับทราบในขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการแก้ค่า:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - อีโมจิสำรองจากตัวตนของเอเจนต์ (`agents.list[].identity.emoji` มิฉะนั้นใช้ "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิ unicode (เช่น "👀")
    - ใช้ `""` เพื่อปิดใช้รีแอ็กชันสำหรับช่องทางหรือบัญชี

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    การเขียนค่ากำหนดช่องทางเปิดใช้ตามค่าเริ่มต้น (`configWrites !== false`)

    การเขียนที่ทริกเกอร์โดย Telegram รวมถึง:

    - เหตุการณ์การย้ายกลุ่ม (`migrate_to_chat_id`) เพื่ออัปเดต `channels.telegram.groups`
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
    ค่าเริ่มต้นคือ long polling สำหรับโหมด Webhook ให้ตั้งค่า `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; ตัวเลือกเสริมคือ `webhookPath`, `webhookHost`, `webhookPort` (ค่าเริ่มต้น `/telegram-webhook`, `127.0.0.1`, `8787`)

    ตัวรับฟังภายในเครื่องผูกกับ `127.0.0.1:8787` สำหรับทางเข้าสาธารณะ ให้ตั้ง reverse proxy ไว้หน้าพอร์ตภายในเครื่อง หรือตั้งค่า `webhookHost: "0.0.0.0"` โดยตั้งใจ

    โหมด Webhook ตรวจสอบการ์ดคำขอ โทเค็นลับของ Telegram และเนื้อหา JSON ก่อนส่งคืน `200` ให้ Telegram
    จากนั้น OpenClaw จะประมวลผลการอัปเดตแบบอะซิงโครนัสผ่านเลนบอตต่อแชต/ต่อหัวข้อเดียวกับที่ long polling ใช้ ดังนั้นรอบการทำงานของเอเจนต์ที่ช้าจะไม่หน่วง ACK การส่งของ Telegram

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` จะให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนการแบ่งตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ทั้งขาเข้าและขาออก
    - `channels.telegram.mediaGroupFlushMs` (ค่าเริ่มต้น 500) ควบคุมระยะเวลาที่อัลบั้ม/กลุ่มสื่อของ Telegram จะถูกบัฟเฟอร์ก่อนที่ OpenClaw จะส่งต่อเป็นข้อความขาเข้าหนึ่งรายการ เพิ่มค่านี้หากชิ้นส่วนอัลบั้มมาถึงช้า; ลดค่านี้เพื่อลดเวลาแฝงของการตอบกลับอัลบั้ม
    - `channels.telegram.timeoutSeconds` แทนที่ timeout ของไคลเอนต์ Telegram API (หากไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY) ไคลเอนต์บอตจะหนีบค่าที่กำหนดไว้ต่ำกว่าการ์ดคำขอข้อความขาออก/การพิมพ์ 60 วินาที เพื่อให้ grammY ไม่ยกเลิกการส่งคำตอบที่มองเห็นได้ก่อนที่การ์ดทรานสปอร์ตและ fallback ของ OpenClaw จะทำงานได้ Long polling ยังคงใช้การ์ดคำขอ `getUpdates` 45 วินาที เพื่อไม่ให้การสำรวจที่ว่างอยู่ถูกละทิ้งอย่างไม่มีกำหนด
    - ค่าเริ่มต้นของ `channels.telegram.pollingStallThresholdMs` คือ `120000`; ปรับระหว่าง `30000` และ `600000` เฉพาะสำหรับการรีสตาร์ต polling-stall ที่เป็น false positive
    - ประวัติบริบทกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` ปิดใช้
    - บริบทเสริมของ reply/quote/forward ขณะนี้ถูกส่งต่อไปตามที่ได้รับ
    - allowlist ของ Telegram โดยหลักจะควบคุมว่าใครสามารถทริกเกอร์เอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมเต็มรูปแบบ
    - การควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - การกำหนดค่า `channels.telegram.retry` ใช้กับตัวช่วยส่ง Telegram (CLI/tools/actions) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้ การส่งคำตอบสุดท้ายขาเข้ายังใช้ safe-send retry แบบมีขอบเขตสำหรับความล้มเหลวก่อนเชื่อมต่อของ Telegram แต่จะไม่ลองซ้ำกับซองเครือข่ายหลังส่งที่กำกวมซึ่งอาจทำให้ข้อความที่มองเห็นได้ซ้ำกัน

    เป้าหมายการส่งของ CLI และ message-tool อาจเป็น ID แชตแบบตัวเลข ชื่อผู้ใช้ หรือเป้าหมายหัวข้อฟอรัม:

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

    - `--presentation` พร้อมบล็อก `buttons` สำหรับแป้นพิมพ์แบบอินไลน์เมื่อ `channels.telegram.capabilities.inlineButtons` อนุญาต
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอการส่งแบบปักหมุดเมื่อบอตสามารถปักหมุดในแชตนั้นได้
    - `--force-document` เพื่อส่งรูปภาพขาออกและ GIF เป็นเอกสารแทนการอัปโหลดแบบรูปภาพบีบอัดหรือสื่อเคลื่อนไหว

    การควบคุมการดำเนินการ:

    - `channels.telegram.actions.sendMessage=false` ปิดใช้ข้อความ Telegram ขาออก รวมถึง poll
    - `channels.telegram.actions.poll=false` ปิดใช้การสร้าง poll ของ Telegram โดยยังคงเปิดใช้การส่งปกติ

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถโพสต์พรอมต์ในแชตหรือหัวข้อต้นทางได้ตามตัวเลือก ผู้อนุมัติต้องเป็น ID ผู้ใช้ Telegram แบบตัวเลข

    เส้นทางการกำหนดค่า:

    - `channels.telegram.execApprovals.enabled` (เปิดใช้อัตโนมัติเมื่อแก้ค่าให้มีผู้อนุมัติได้อย่างน้อยหนึ่งคน)
    - `channels.telegram.execApprovals.approvers` (fallback ไปยัง ID เจ้าของแบบตัวเลขจาก `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` และ `defaultTo` ควบคุมว่าใครสามารถคุยกับบอตได้และบอตส่งคำตอบปกติไปที่ใด ค่าเหล่านี้ไม่ได้ทำให้ใครเป็นผู้อนุมัติ exec การจับคู่ DM ที่ได้รับอนุมัติครั้งแรกจะบูตสแตรป `commands.ownerAllowFrom` เมื่อยังไม่มีเจ้าของคำสั่ง ดังนั้นการตั้งค่าแบบเจ้าของคนเดียวยังทำงานได้โดยไม่ต้องทำ ID ซ้ำใต้ `execApprovals.approvers`

    การส่งผ่านช่องทางจะแสดงข้อความคำสั่งในแชต; เปิดใช้ `channel` หรือ `both` เฉพาะในกลุ่ม/หัวข้อที่เชื่อถือได้ เมื่อพรอมต์ไปถึงหัวข้อฟอรัม OpenClaw จะคงหัวข้อนั้นไว้สำหรับพรอมต์การอนุมัติและการติดตามผล การอนุมัติ exec หมดอายุหลังจาก 30 นาทีตามค่าเริ่มต้น

    ปุ่มอนุมัติแบบอินไลน์ยังต้องให้ `channels.telegram.capabilities.inlineButtons` อนุญาตพื้นผิวเป้าหมาย (`dm`, `group` หรือ `all`) ID การอนุมัติที่ขึ้นต้นด้วย `plugin:` จะแก้ค่าผ่านการอนุมัติของ Plugin; รายการอื่นจะแก้ค่าผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## การควบคุมการตอบกลับข้อผิดพลาด

เมื่อเอเจนต์พบข้อผิดพลาดในการส่งหรือจากผู้ให้บริการ Telegram สามารถตอบกลับด้วยข้อความข้อผิดพลาดหรือระงับไว้ได้ คีย์การกำหนดค่าสองรายการควบคุมพฤติกรรมนี้:

| คีย์                                 | ค่า            | ค่าเริ่มต้น | คำอธิบาย                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` ส่งข้อความข้อผิดพลาดที่เป็นมิตรไปยังแชต `silent` ระงับการตอบกลับข้อผิดพลาดทั้งหมด |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | เวลาขั้นต่ำระหว่างการตอบกลับข้อผิดพลาดไปยังแชตเดียวกัน ป้องกันสแปมข้อผิดพลาดระหว่างเหตุขัดข้อง        |

รองรับการแทนที่ต่อบัญชี ต่อกลุ่ม และต่อหัวข้อ (การสืบทอดเดียวกับคีย์การกำหนดค่า Telegram อื่นๆ)

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
  <Accordion title="Bot does not respond to non mention group messages">

    - หาก `requireMention=false` โหมดความเป็นส่วนตัวของ Telegram ต้องอนุญาตให้มองเห็นได้เต็มรูปแบบ
      - BotFather: `/setprivacy` -> ปิดใช้งาน
      - จากนั้นนำบอตออกจากกลุ่มแล้วเพิ่มกลับเข้าไปใหม่
    - `openclaw channels status` จะแจ้งเตือนเมื่อการกำหนดค่าคาดหวังข้อความกลุ่มที่ไม่ได้กล่าวถึงบอต
    - `openclaw channels status --probe` สามารถตรวจสอบ ID กลุ่มแบบตัวเลขที่ระบุอย่างชัดเจนได้; ไม่สามารถตรวจสอบการเป็นสมาชิกด้วยไวลด์การ์ด `"*"` ได้
    - การทดสอบเซสชันแบบเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอตไม่เห็นข้อความกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` อยู่ กลุ่มต้องอยู่ในรายการ (หรือใส่ `"*"`)
    - ตรวจสอบการเป็นสมาชิกของบอตในกลุ่ม
    - ตรวจสอบบันทึก: `openclaw logs --follow` เพื่อดูเหตุผลที่ข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานบางส่วนหรือไม่ทำงานเลย">

    - อนุญาตข้อมูลระบุตัวตนผู้ส่งของคุณ (การจับคู่และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังคงมีผลแม้นโยบายกลุ่มจะเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนูเนทีฟมีรายการมากเกินไป; ลดคำสั่ง Plugin/skill/กำหนดเอง หรือปิดใช้งานเมนูเนทีฟ
    - การเรียกเริ่มต้น `deleteMyCommands` / `setMyCommands` และการเรียกแสดงการพิมพ์ `sendChatAction` มีขอบเขตจำกัดและจะลองใหม่หนึ่งครั้งผ่านทางเลือกสำรองของทรานสปอร์ต Telegram เมื่อคำขอหมดเวลา ข้อผิดพลาดเครือข่าย/การดึงข้อมูลที่เกิดซ้ำมักบ่งชี้ปัญหาการเข้าถึง DNS/HTTPS ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="การเริ่มต้นรายงานว่าโทเค็นไม่ได้รับอนุญาต">

    - `getMe returned 401` คือความล้มเหลวในการตรวจสอบสิทธิ์ของ Telegram สำหรับโทเค็นบอตที่กำหนดค่าไว้
    - คัดลอกใหม่หรือสร้างโทเค็นบอตใหม่ใน BotFather แล้วอัปเดต `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` หรือ `TELEGRAM_BOT_TOKEN` สำหรับบัญชีเริ่มต้น
    - `deleteWebhook 401 Unauthorized` ระหว่างการเริ่มต้นก็เป็นความล้มเหลวในการตรวจสอบสิทธิ์เช่นกัน; การถือว่าเป็น "ไม่มี webhook อยู่" จะเพียงเลื่อนความล้มเหลวจากโทเค็นที่ผิดเดียวกันไปยังการเรียก API ภายหลังเท่านั้น

  </Accordion>

  <Accordion title="การโพลหรือเครือข่ายไม่เสถียร">

    - Node 22+ + fetch/proxy แบบกำหนดเองอาจทำให้เกิดพฤติกรรมยกเลิกทันทีหากชนิด AbortSignal ไม่ตรงกัน
    - โฮสต์บางตัว resolve `api.telegram.org` เป็น IPv6 ก่อน; ทางออก IPv6 ที่เสียอาจทำให้ Telegram API ล้มเหลวเป็นครั้งคราว
    - หากบันทึกมี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!` ตอนนี้ OpenClaw จะลองใหม่โดยถือว่าเป็นข้อผิดพลาดเครือข่ายที่กู้คืนได้
    - ระหว่างการเริ่มต้นการโพล OpenClaw จะนำโพรบ `getMe` ที่เริ่มต้นสำเร็จมาใช้ซ้ำสำหรับ grammY เพื่อให้ runner ไม่ต้องใช้ `getMe` ครั้งที่สองก่อน `getUpdates` ครั้งแรก
    - หาก `deleteWebhook` ล้มเหลวด้วยข้อผิดพลาดเครือข่ายชั่วคราวระหว่างการเริ่มต้นการโพล OpenClaw จะเข้าสู่ long polling ต่อไปแทนการเรียก control plane ก่อนโพลอีกครั้ง Webhook ที่ยังทำงานอยู่จะแสดงเป็นความขัดแย้งของ `getUpdates`; จากนั้น OpenClaw จะสร้างทรานสปอร์ต Telegram ใหม่และลองล้าง webhook อีกครั้ง
    - หากซ็อกเก็ต Telegram ถูกรีไซเคิลตามรอบเวลาคงที่สั้น ๆ ให้ตรวจสอบว่า `channels.telegram.timeoutSeconds` ต่ำหรือไม่; ไคลเอนต์บอตจะ clamp ค่าที่กำหนดไว้ซึ่งต่ำกว่าการ์ดคำขอขาออกและ `getUpdates` แต่รุ่นเก่าอาจยกเลิกทุกการโพลหรือการตอบกลับเมื่อค่านี้ถูกตั้งต่ำกว่าการ์ดเหล่านั้น
    - หากบันทึกมี `Polling stall detected` OpenClaw จะเริ่มการโพลใหม่และสร้างทรานสปอร์ต Telegram ใหม่หลังจากไม่มี long-poll liveness ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีโดยค่าเริ่มต้น
    - `openclaw channels status --probe` และ `openclaw doctor` จะแจ้งเตือนเมื่อบัญชีโพลที่กำลังทำงานยังไม่ได้ทำ `getUpdates` เสร็จหลังช่วงผ่อนผันการเริ่มต้น เมื่อบัญชี webhook ที่กำลังทำงานยังไม่ได้ทำ `setWebhook` เสร็จหลังช่วงผ่อนผันการเริ่มต้น หรือเมื่อกิจกรรมทรานสปอร์ตการโพลที่สำเร็จล่าสุดเก่าเกินไป
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่ทำงานยาวนานยังปกติ แต่โฮสต์ของคุณยังรายงานการเริ่มต้นใหม่จาก polling-stall แบบผิดพลาด การหยุดค้างต่อเนื่องมักชี้ไปที่ปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่างโฮสต์กับ `api.telegram.org`
    - Telegram ยังใช้ env proxy ของกระบวนการสำหรับทรานสปอร์ต Bot API ด้วย รวมถึง `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และตัวแปรตัวพิมพ์เล็กของค่าเหล่านั้น `NO_PROXY` / `no_proxy` ยังสามารถข้าม `api.telegram.org` ได้
    - หาก proxy ที่ OpenClaw จัดการถูกกำหนดค่าผ่าน `OPENCLAW_PROXY_URL` สำหรับสภาพแวดล้อมบริการ และไม่มี env proxy มาตรฐานอยู่ Telegram จะใช้ URL นั้นสำหรับทรานสปอร์ต Bot API ด้วย
    - บนโฮสต์ VPS ที่ direct egress/TLS ไม่เสถียร ให้กำหนดเส้นทางการเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ มีค่าเริ่มต้นเป็น `autoSelectFamily=true` (ยกเว้น WSL2) ลำดับผลลัพธ์ DNS ของ Telegram จะใช้ `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER` ก่อน จากนั้น `channels.telegram.network.dnsResultOrder` จากนั้นค่าเริ่มต้นของกระบวนการ เช่น `NODE_OPTIONS=--dns-result-order=ipv4first`; หากไม่มีค่าใดใช้ได้ Node 22+ จะถอยกลับไปใช้ `ipv4first`
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนด้วยพฤติกรรม IPv4-only ให้บังคับการเลือก family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบช่วงเบนช์มาร์ก RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาตแล้ว
      สำหรับการดาวน์โหลดสื่อ Telegram โดยค่าเริ่มต้น หาก fake-IP ที่เชื่อถือได้หรือ
      transparent proxy เขียน `api.telegram.org` ใหม่ไปยังที่อยู่
      private/internal/special-use อื่นระหว่างการดาวน์โหลดสื่อ คุณสามารถเลือกใช้
      การข้ามเฉพาะ Telegram ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - การเลือกใช้แบบเดียวกันมีให้ต่อบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หาก proxy ของคุณ resolve โฮสต์สื่อ Telegram เป็น `198.18.x.x` ให้ปิด
      แฟล็กอันตรายไว้ก่อน สื่อ Telegram อนุญาตช่วงเบนช์มาร์ก RFC 2544
      โดยค่าเริ่มต้นอยู่แล้ว

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` ทำให้การป้องกัน SSRF
      ของสื่อ Telegram อ่อนลง ใช้เฉพาะกับสภาพแวดล้อม proxy ที่เชื่อถือได้และควบคุมโดยผู้ปฏิบัติงาน
      เช่น การกำหนดเส้นทาง fake-IP ของ Clash, Mihomo หรือ Surge เมื่อระบบเหล่านั้น
      สังเคราะห์คำตอบแบบ private หรือ special-use นอกช่วงเบนช์มาร์ก RFC 2544
      ปิดไว้สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ
    </Warning>

    - การ override ด้วยสภาพแวดล้อม (ชั่วคราว):
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

## อ้างอิงการกำหนดค่า

อ้างอิงหลัก: [อ้างอิงการกำหนดค่า - Telegram](/th/gateway/config-channels#telegram)

<Accordion title="ฟิลด์ Telegram ที่มีสัญญาณสูง">

- การเริ่มต้น/การตรวจสอบสิทธิ์: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; symlink จะถูกปฏิเสธ)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- การอนุมัติ exec: `execApprovals`, `accounts.*.execApprovals`
- คำสั่ง/เมนู: `commands.native`, `commands.nativeSkills`, `customCommands`
- เธรด/การตอบกลับ: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- การสตรีม: `streaming` (พรีวิว), `streaming.preview.toolProgress`, `blockStreaming`
- การจัดรูปแบบ/การส่งมอบ: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- สื่อ/เครือข่าย: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- ราก API แบบกำหนดเอง: `apiRoot` (ราก Bot API เท่านั้น; อย่าใส่ `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- การกระทำ/ความสามารถ: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions: `reactionNotifications`, `reactionLevel`
- ข้อผิดพลาด: `errorPolicy`, `errorCooldownMs`
- การเขียน/ประวัติ: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญหลายบัญชี: เมื่อกำหนดค่า ID บัญชีตั้งแต่สองรายการขึ้นไป ให้ตั้ง `channels.telegram.defaultAccount` (หรือใส่ `channels.telegram.accounts.default`) เพื่อทำให้การกำหนดเส้นทางเริ่มต้นชัดเจน มิฉะนั้น OpenClaw จะถอยกลับไปใช้ ID บัญชีที่ normalize แล้วรายการแรก และ `openclaw doctor` จะแจ้งเตือน บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom` แต่ไม่สืบทอดค่าของ `accounts.default.*`
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
    กำหนดเส้นทางข้อความขาเข้าไปยัง agent
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเสริมความแข็งแกร่ง
  </Card>
  <Card title="การกำหนดเส้นทางหลาย agent" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกลุ่มและหัวข้อไปยัง agent
  </Card>
  <Card title="การแก้ปัญหา" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้าม Channel
  </Card>
</CardGroup>
