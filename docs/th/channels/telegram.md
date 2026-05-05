---
read_when:
    - การทำงานกับฟีเจอร์ของ Telegram หรือ Webhook
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของบอต Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-05T06:16:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c75169335378482b80f1ceb669cefaa034ad3e589cf5f1d14c8252608ee46a
    source_path: channels/telegram.md
    workflow: 16
---

พร้อมใช้งานระดับโปรดักชันสำหรับ DM และกลุ่มของบอทผ่าน grammY โหมดเริ่มต้นคือ long polling; โหมด webhook เป็นตัวเลือก

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับ Telegram คือการจับคู่
  </Card>
  <Card title="การแก้ปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและคู่มือการซ่อมแซม
  </Card>
  <Card title="การกำหนดค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าช่องทางแบบครบถ้วน
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="สร้างโทเค็นบอทใน BotFather">
    เปิด Telegram และแชตกับ **@BotFather** (ยืนยันว่าแฮนเดิลตรงกับ `@BotFather` ทุกประการ)

    รัน `/newbot` ทำตามพรอมป์ และบันทึกโทเค็นไว้

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

    โค้ดจับคู่หมดอายุหลังจาก 1 ชั่วโมง

  </Step>

  <Step title="เพิ่มบอทเข้าไปในกลุ่ม">
    เพิ่มบอทเข้าไปในกลุ่มของคุณ จากนั้นตั้งค่า `channels.telegram.groups` และ `groupPolicy` ให้ตรงกับโมเดลการเข้าถึงของคุณ
  </Step>
</Steps>

<Note>
ลำดับการแก้ค่าโทเค็นรับรู้บัญชี ในทางปฏิบัติ ค่าจาก config ชนะค่าทดแทนจาก env และ `TELEGRAM_BOT_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="โหมดความเป็นส่วนตัวและการมองเห็นกลุ่ม">
    บอท Telegram มีค่าเริ่มต้นเป็น **Privacy Mode** ซึ่งจำกัดข้อความกลุ่มที่บอทได้รับ

    หากบอทต้องเห็นข้อความกลุ่มทั้งหมด ให้ทำอย่างใดอย่างหนึ่ง:

    - ปิดโหมดความเป็นส่วนตัวผ่าน `/setprivacy` หรือ
    - ตั้งให้บอทเป็นผู้ดูแลกลุ่ม

    เมื่อสลับโหมดความเป็นส่วนตัว ให้ลบแล้วเพิ่มบอทกลับเข้าไปในแต่ละกลุ่ม เพื่อให้ Telegram ใช้การเปลี่ยนแปลง

  </Accordion>

  <Accordion title="สิทธิ์ของกลุ่ม">
    สถานะผู้ดูแลควบคุมได้ในการตั้งค่ากลุ่ม Telegram

    บอทที่เป็นผู้ดูแลจะได้รับข้อความกลุ่มทั้งหมด ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มแบบเปิดตลอดเวลา

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
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    `dmPolicy: "open"` พร้อม `allowFrom: ["*"]` ทำให้บัญชี Telegram ใด ๆ ที่พบหรือเดาชื่อผู้ใช้บอทได้สามารถสั่งบอทได้ ใช้เฉพาะกับบอทสาธารณะที่ตั้งใจเปิดให้ใช้และมีเครื่องมือถูกจำกัดอย่างเข้มงวดเท่านั้น; บอทเจ้าของเดียวควรใช้ `allowlist` พร้อม ID ผู้ใช้แบบตัวเลข

    `channels.telegram.allowFrom` รับ ID ผู้ใช้ Telegram แบบตัวเลข รองรับและทำให้ prefix `telegram:` / `tg:` เป็นมาตรฐาน
    ใน config หลายบัญชี `channels.telegram.allowFrom` ระดับบนที่เข้มงวดจะถูกถือเป็นขอบเขตความปลอดภัย: รายการระดับบัญชี `allowFrom: ["*"]` จะไม่ทำให้บัญชีนั้นเป็นสาธารณะ เว้นแต่ allowlist ที่มีผลของบัญชียังมี wildcard แบบชัดเจนหลังจาก merge แล้ว
    `dmPolicy: "allowlist"` ที่มี `allowFrom` ว่างจะบล็อก DM ทั้งหมดและถูกปฏิเสธโดยการตรวจสอบ config
    การตั้งค่าจะขอเฉพาะ ID ผู้ใช้แบบตัวเลขเท่านั้น
    หากคุณอัปเกรดแล้ว config ของคุณมีรายการ allowlist แบบ `@username` ให้รัน `openclaw doctor --fix` เพื่อแก้ไขรายการเหล่านั้น (พยายามให้ดีที่สุด; ต้องใช้โทเค็นบอท Telegram)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์ allowlist ของ pairing-store, `openclaw doctor --fix` สามารถกู้คืนรายการเข้าไปใน `channels.telegram.allowFrom` ใน flow แบบ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID แบบชัดเจน)

    สำหรับบอทเจ้าของเดียว ให้ใช้ `dmPolicy: "allowlist"` พร้อม ID `allowFrom` แบบตัวเลขอย่างชัดเจน เพื่อให้นโยบายการเข้าถึงคงทนอยู่ใน config (แทนการพึ่งพาการอนุมัติการจับคู่ก่อนหน้า)

    ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่ได้หมายความว่า "ผู้ส่งนี้ได้รับอนุญาตทุกที่"
    การจับคู่ให้สิทธิ์เข้าถึง DM หากยังไม่มีเจ้าของคำสั่ง การจับคู่ที่อนุมัติครั้งแรกจะตั้งค่า `commands.ownerAllowFrom` ด้วย เพื่อให้คำสั่งเฉพาะเจ้าของและการอนุมัติ exec มีบัญชีผู้ปฏิบัติงานที่ชัดเจน
    การอนุญาตผู้ส่งในกลุ่มยังคงมาจาก allowlist ใน config ที่ชัดเจน
    หากคุณต้องการให้ "ฉันได้รับอนุญาตครั้งเดียว แล้วทั้ง DM และคำสั่งกลุ่มทำงานได้" ให้ใส่ ID ผู้ใช้ Telegram แบบตัวเลขของคุณใน `channels.telegram.allowFrom`; สำหรับคำสั่งเฉพาะเจ้าของ ให้แน่ใจว่า `commands.ownerAllowFrom` มี `telegram:<your user id>`

    ### การหา ID ผู้ใช้ Telegram ของคุณ

    วิธีที่ปลอดภัยกว่า (ไม่ใช้บอทบุคคลที่สาม):

    1. ส่ง DM ถึงบอทของคุณ
    2. รัน `openclaw logs --follow`
    3. อ่าน `from.id`

    วิธีทางการของ Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="นโยบายกลุ่มและ allowlist">
    มีตัวควบคุมสองอย่างที่ใช้ร่วมกัน:

    1. **กลุ่มใดได้รับอนุญาต** (`channels.telegram.groups`)
       - ไม่มี config `groups`:
         - เมื่อใช้ `groupPolicy: "open"`: กลุ่มใดก็ได้สามารถผ่านการตรวจ ID กลุ่ม
         - เมื่อใช้ `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการ `groups` (หรือ `"*"`)
       - กำหนดค่า `groups` แล้ว: ทำหน้าที่เป็น allowlist (ID แบบชัดเจนหรือ `"*"`)

    2. **ผู้ส่งใดได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับการกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่า Telegram จะ fallback ไปที่ `allowFrom`
    รายการ `groupAllowFrom` ควรเป็น ID ผู้ใช้ Telegram แบบตัวเลข (prefix `telegram:` / `tg:` จะถูกทำให้เป็นมาตรฐาน)
    อย่าใส่ ID แชตของกลุ่มหรือ supergroup Telegram ใน `groupAllowFrom` ID แชตค่าลบต้องอยู่ใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเว้นสำหรับการอนุญาตผู้ส่ง
    ขอบเขตความปลอดภัย (`2026.2.25+`): การตรวจสิทธิ์ผู้ส่งในกลุ่ม **ไม่** สืบทอดการอนุมัติ DM จาก pairing-store
    การจับคู่ยังคงเป็นเฉพาะ DM สำหรับกลุ่ม ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` รายกลุ่ม/ราย topic
    หากไม่ได้ตั้งค่า `groupAllowFrom`, Telegram จะ fallback ไปที่ config `allowFrom` ไม่ใช่ pairing store
    รูปแบบที่ใช้ได้จริงสำหรับบอทเจ้าของเดียว: ตั้งค่า ID ผู้ใช้ของคุณใน `channels.telegram.allowFrom`, ปล่อย `groupAllowFrom` ว่างไว้ และอนุญาตกลุ่มเป้าหมายใต้ `channels.telegram.groups`
    หมายเหตุ runtime: หาก `channels.telegram` หายไปทั้งหมด runtime จะใช้ค่าเริ่มต้นแบบ fail-closed `groupPolicy="allowlist"` เว้นแต่ตั้งค่า `channels.defaults.groupPolicy` ไว้อย่างชัดเจน

    ตัวอย่าง: อนุญาตสมาชิกใดก็ได้ในกลุ่มที่ระบุหนึ่งกลุ่ม:

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

    ตัวอย่าง: อนุญาตเฉพาะผู้ใช้ที่ระบุภายในกลุ่มที่ระบุหนึ่งกลุ่ม:

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

      - ใส่ ID แชตของกลุ่มหรือ supergroup Telegram ที่เป็นค่าลบ เช่น `-1001234567890` ใต้ `channels.telegram.groups`
      - ใส่ ID ผู้ใช้ Telegram เช่น `8734062810` ใต้ `groupAllowFrom` เมื่อคุณต้องการจำกัดว่าคนใดในกลุ่มที่ได้รับอนุญาตสามารถเรียกใช้บอทได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกใดก็ได้ของกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอทได้

    </Warning>

  </Tab>

  <Tab title="พฤติกรรมการ mention">
    การตอบกลับในกลุ่มต้อง mention โดยค่าเริ่มต้น

    การ mention อาจมาจาก:

    - การ mention แบบ native `@botusername` หรือ
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

    - forward ข้อความกลุ่มไปที่ `@userinfobot` / `@getidsbot`
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจดู Bot API `getUpdates`

  </Tab>
</Tabs>

## พฤติกรรม runtime

- Telegram ถูกเป็นเจ้าของโดยกระบวนการ gateway
- การ routing เป็นแบบกำหนดแน่นอน: ข้อความขาเข้าจาก Telegram จะตอบกลับไปที่ Telegram (โมเดลไม่ได้เลือกช่องทาง)
- ข้อความขาเข้าถูก normalize เข้าเป็น envelope ช่องทางร่วม พร้อม metadata การตอบกลับและ placeholder สื่อ
- เซสชันกลุ่มถูกแยกตาม ID กลุ่ม Forum topic จะต่อท้าย `:topic:<threadId>` เพื่อแยก topic ออกจากกัน
- ข้อความ DM สามารถมี `message_thread_id`; OpenClaw จะคง ID เธรดไว้สำหรับการตอบกลับ แต่ยังคงให้ DM อยู่บนเซสชันแบบแบนตามค่าเริ่มต้น กำหนดค่า `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` หรือ config topic ที่ตรงกัน เมื่อคุณตั้งใจต้องการแยกเซสชัน topic ของ DM
- Long polling ใช้ grammY runner พร้อมการจัดลำดับต่อแชต/ต่อเธรด concurrency โดยรวมของ runner sink ใช้ `agents.defaults.maxConcurrent`
- Long polling ถูกป้องกันภายในแต่ละกระบวนการ gateway เพื่อให้มี poller ที่ทำงานอยู่เพียงตัวเดียวใช้โทเค็นบอทได้ในแต่ละครั้ง หากคุณยังเห็น conflict `getUpdates` 409 น่าจะมี gateway OpenClaw อื่น สคริปต์ หรือ poller ภายนอกกำลังใช้โทเค็นเดียวกัน
- การรีสตาร์ท watchdog ของ long-polling จะทริกเกอร์หลังจากไม่มี liveness `getUpdates` ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีตามค่าเริ่มต้น เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อ deployment ของคุณยังเห็นการรีสตาร์ทจาก polling-stall แบบ false ระหว่างงานที่รันนาน ค่านี้มีหน่วยเป็นมิลลิวินาทีและอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับ override รายบัญชี
- Telegram Bot API ไม่รองรับ read receipt (`sendReadReceipts` ใช้ไม่ได้)

## อ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="ตัวอย่างสตรีมสด (การแก้ไขข้อความ)">
    OpenClaw สามารถสตรีมคำตอบบางส่วนแบบเรียลไทม์:

    - แชตโดยตรง: ข้อความ preview + `editMessageText`
    - กลุ่ม/topic: ข้อความ preview + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` คือ `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - `progress` เก็บร่างสถานะที่แก้ไขได้หนึ่งรายการ และอัปเดตด้วยความคืบหน้าของเครื่องมือจนกว่าจะส่งขั้นสุดท้าย
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความ preview ที่แก้ไขเดิมซ้ำหรือไม่ (ค่าเริ่มต้น: `true` เมื่อเปิดใช้ preview streaming)
    - `streaming.preview.commandText` ควบคุมรายละเอียด command/exec ภายในบรรทัดความคืบหน้าของเครื่องมือเหล่านั้น: `raw` (ค่าเริ่มต้น, รักษาพฤติกรรมที่ปล่อยแล้วไว้) หรือ `status` (เฉพาะป้ายกำกับเครื่องมือ)
    - ตรวจพบ `channels.telegram.streamMode` แบบ legacy และค่า boolean `streaming`; รัน `openclaw doctor --fix` เพื่อย้ายค่าเหล่านั้นไปยัง `channels.telegram.streaming.mode`

    การอัปเดต preview ความคืบหน้าของเครื่องมือคือบรรทัดสถานะสั้น ๆ ที่แสดงระหว่างเครื่องมือทำงาน เช่น การดำเนินการคำสั่ง การอ่านไฟล์ การอัปเดตการวางแผน หรือสรุป patch Telegram เปิดใช้สิ่งเหล่านี้ตามค่าเริ่มต้นเพื่อให้ตรงกับพฤติกรรม OpenClaw ที่ปล่อยแล้วตั้งแต่ `v2026.4.22` เป็นต้นไป หากต้องการเก็บ preview ที่แก้ไขได้สำหรับข้อความคำตอบ แต่ซ่อนบรรทัดความคืบหน้าของเครื่องมือ ให้ตั้งค่า:

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

    หากต้องการให้ความคืบหน้าของเครื่องมือยังมองเห็นได้ แต่ซ่อนข้อความ command/exec ให้ตั้งค่า:

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

    ใช้ `streaming.mode: "off"` เฉพาะเมื่อคุณต้องการการส่งเฉพาะคำตอบสุดท้ายเท่านั้น: การแก้ไขตัวอย่างคำตอบ Telegram จะถูกปิดใช้งาน และข้อความทั่วไปจากเครื่องมือ/ความคืบหน้าจะถูกระงับแทนที่จะถูกส่งเป็นข้อความสถานะแยกต่างหาก พรอมต์ขออนุมัติ เพย์โหลดสื่อ และข้อผิดพลาดยังคงถูกส่งผ่านการส่งคำตอบสุดท้ายตามปกติ ใช้ `streaming.preview.toolProgress: false` เมื่อคุณต้องการคงไว้เฉพาะการแก้ไขตัวอย่างคำตอบ แต่ซ่อนบรรทัดสถานะความคืบหน้าของเครื่องมือ

    <Note>
      การตอบกลับด้วยคำพูดอ้างอิงที่เลือกใน Telegram เป็นข้อยกเว้น เมื่อ `replyToMode` เป็น `"first"`, `"all"` หรือ `"batched"` และข้อความขาเข้ามีข้อความคำพูดอ้างอิงที่เลือกไว้ OpenClaw จะส่งคำตอบสุดท้ายผ่านเส้นทางการตอบกลับแบบคำพูดอ้างอิงดั้งเดิมของ Telegram แทนการแก้ไขตัวอย่างคำตอบ ดังนั้น `streaming.preview.toolProgress` จึงไม่สามารถแสดงบรรทัดสถานะสั้น ๆ สำหรับรอบนั้นได้ การตอบกลับข้อความปัจจุบันที่ไม่มีข้อความคำพูดอ้างอิงที่เลือกไว้ยังคงใช้การสตรีมตัวอย่างคำตอบได้ ตั้งค่า `replyToMode: "off"` เมื่อการมองเห็นความคืบหน้าของเครื่องมือสำคัญกว่าการตอบกลับแบบคำพูดอ้างอิงดั้งเดิม หรือตั้งค่า `streaming.preview.toolProgress: false` เพื่อยอมรับข้อแลกเปลี่ยนนี้
    </Note>

    สำหรับการตอบกลับแบบข้อความเท่านั้น:

    - ตัวอย่างคำตอบสั้นใน DM/กลุ่ม/หัวข้อ: OpenClaw จะคงข้อความตัวอย่างคำตอบเดิมไว้และแก้ไขครั้งสุดท้ายในตำแหน่งเดิม เว้นแต่มีข้อความที่มองเห็นได้และไม่ใช่ตัวอย่างคำตอบถูกส่งหลังจากตัวอย่างคำตอบปรากฏ
    - คำตอบสุดท้ายแบบข้อความยาวที่แบ่งเป็นหลายข้อความ Telegram จะนำตัวอย่างคำตอบเดิมมาใช้เป็นส่วนแรกของคำตอบสุดท้ายเมื่อทำได้ จากนั้นส่งเฉพาะส่วนที่เหลือ
    - ตัวอย่างคำตอบที่ตามด้วยเอาต์พุตที่มองเห็นได้และไม่ใช่ตัวอย่างคำตอบ: OpenClaw จะส่งคำตอบที่เสร็จสมบูรณ์เป็นข้อความสุดท้ายใหม่และล้างตัวอย่างคำตอบเก่า เพื่อให้คำตอบสุดท้ายปรากฏหลังเอาต์พุตระหว่างทาง
    - ตัวอย่างคำตอบที่เก่ากว่าประมาณหนึ่งนาที: OpenClaw จะส่งคำตอบที่เสร็จสมบูรณ์เป็นข้อความสุดท้ายใหม่แล้วล้างตัวอย่างคำตอบ เพื่อให้เวลาที่มองเห็นได้ของ Telegram สะท้อนเวลาที่เสร็จสมบูรณ์แทนเวลาที่สร้างตัวอย่างคำตอบ

    สำหรับการตอบกลับที่ซับซ้อน เช่น เพย์โหลดสื่อ OpenClaw จะถอยกลับไปใช้การส่งคำตอบสุดท้ายตามปกติ แล้วล้างข้อความตัวอย่างคำตอบ

    การสตรีมตัวอย่างคำตอบแยกจากการสตรีมบล็อก เมื่อเปิดใช้การสตรีมบล็อกอย่างชัดเจนสำหรับ Telegram OpenClaw จะข้ามสตรีมตัวอย่างคำตอบเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

    สตรีมเหตุผลเฉพาะ Telegram:

    - `/reasoning stream` ส่งเหตุผลไปยังตัวอย่างคำตอบสดระหว่างการสร้าง
    - ตัวอย่างเหตุผลจะถูกลบหลังการส่งคำตอบสุดท้าย; ใช้ `/reasoning on` เมื่อควรให้เหตุผลยังคงมองเห็นได้
    - คำตอบสุดท้ายถูกส่งโดยไม่มีข้อความเหตุผล

  </Accordion>

  <Accordion title="การจัดรูปแบบและทางเลือกสำรอง HTML">
    ข้อความขาออกใช้ Telegram `parse_mode: "HTML"`

    - ข้อความคล้าย Markdown จะถูกเรนเดอร์เป็น HTML ที่ปลอดภัยสำหรับ Telegram
    - HTML ดิบจากโมเดลจะถูกหลีกอักขระเพื่อลดความล้มเหลวในการแยกวิเคราะห์ของ Telegram
    - หาก Telegram ปฏิเสธ HTML ที่แยกวิเคราะห์แล้ว OpenClaw จะลองใหม่เป็นข้อความธรรมดา

    ตัวอย่างลิงก์เปิดใช้งานโดยค่าเริ่มต้น และสามารถปิดใช้งานได้ด้วย `channels.telegram.linkPreview: false`

  </Accordion>

  <Accordion title="คำสั่งดั้งเดิมและคำสั่งกำหนดเอง">
    การลงทะเบียนเมนูคำสั่ง Telegram จะถูกจัดการตอนเริ่มต้นด้วย `setMyCommands`

    ค่าเริ่มต้นของคำสั่งดั้งเดิม:

    - `commands.native: "auto"` เปิดใช้คำสั่งดั้งเดิมสำหรับ Telegram

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

    - ชื่อจะถูกทำให้เป็นรูปแบบมาตรฐาน (ตัด `/` นำหน้าออก, ใช้ตัวพิมพ์เล็ก)
    - รูปแบบที่ใช้ได้: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งกำหนดเองไม่สามารถแทนที่คำสั่งดั้งเดิมได้
    - ข้อขัดแย้ง/รายการซ้ำจะถูกข้ามและบันทึกล็อก

    หมายเหตุ:

    - คำสั่งกำหนดเองเป็นเพียงรายการเมนูเท่านั้น; ไม่ได้ติดตั้งพฤติกรรมให้อัตโนมัติ
    - คำสั่ง Plugin/Skills ยังสามารถทำงานได้เมื่อพิมพ์ แม้จะไม่แสดงในเมนู Telegram

    หากปิดใช้งานคำสั่งดั้งเดิม คำสั่งในตัวจะถูกนำออก คำสั่งกำหนดเอง/Plugin อาจยังลงทะเบียนได้หากกำหนดค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังล้นหลังจากตัดรายการแล้ว; ลดคำสั่ง Plugin/Skills/กำหนดเอง หรือปิดใช้งาน `channels.telegram.commands.native`
    - `deleteWebhook`, `deleteMyCommands` หรือ `setMyCommands` ล้มเหลวด้วย `404: Not Found` ขณะที่คำสั่ง curl ตรงไปยัง Bot API ทำงาน อาจหมายความว่า `channels.telegram.apiRoot` ถูกตั้งเป็นปลายทางเต็ม `/bot<TOKEN>` แล้ว `apiRoot` ต้องเป็นเพียงรูทของ Bot API เท่านั้น และ `openclaw doctor --fix` จะนำ `/bot<TOKEN>` ต่อท้ายที่เกิดโดยไม่ตั้งใจออก
    - `getMe returned 401` หมายความว่า Telegram ปฏิเสธโทเค็นบอตที่กำหนดค่าไว้ อัปเดต `botToken`, `tokenFile` หรือ `TELEGRAM_BOT_TOKEN` ด้วยโทเค็น BotFather ปัจจุบัน; OpenClaw จะหยุดก่อนการ polling ดังนั้นจึงไม่ถูกรายงานเป็นความล้มเหลวในการล้าง Webhook
    - `setMyCommands failed` พร้อมข้อผิดพลาดเครือข่าย/fetch โดยทั่วไปหมายความว่า DNS/HTTPS ขาออกไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งจับคู่อุปกรณ์ (`device-pair` Plugin)

    เมื่อติดตั้ง `device-pair` Plugin:

    1. `/pair` สร้างโค้ดตั้งค่า
    2. วางโค้ดในแอป iOS
    3. `/pair pending` แสดงรายการคำขอที่รอดำเนินการ (รวมถึงบทบาท/ขอบเขต)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบระบุชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    โค้ดตั้งค่าพกโทเค็นบูตสแตรปอายุสั้น การส่งต่อบูตสแตรปในตัวจะคงโทเค็น Node หลักไว้ที่ `scopes: []`; โทเค็นตัวดำเนินการที่ถูกส่งต่อใด ๆ จะยังถูกจำกัดไว้ที่ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write` การตรวจสอบขอบเขตบูตสแตรปมีคำนำหน้าบทบาท ดังนั้นรายการอนุญาตของตัวดำเนินการนั้นจึงตอบสนองได้เฉพาะคำขอตัวดำเนินการเท่านั้น; บทบาทที่ไม่ใช่ตัวดำเนินการยังต้องมีขอบเขตใต้คำนำหน้าบทบาทของตนเอง

    หากอุปกรณ์ลองใหม่ด้วยรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป เช่น บทบาท/ขอบเขต/กุญแจสาธารณะ คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` อื่น เรียก `/pair pending` อีกครั้งก่อนอนุมัติ

    รายละเอียดเพิ่มเติม: [การจับคู่](/th/channels/pairing#pair-via-telegram-recommended-for-ios)

  </Accordion>

  <Accordion title="ปุ่มอินไลน์">
    กำหนดค่าขอบเขตคีย์บอร์ดอินไลน์:

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

    การคลิก callback จะถูกส่งผ่านไปยัง agent เป็นข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="การกระทำข้อความ Telegram สำหรับ agent และระบบอัตโนมัติ">
    การกระทำเครื่องมือ Telegram ประกอบด้วย:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    การกระทำข้อความของช่องทางเปิดเผยชื่อแฝงที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    การควบคุมการกั้น:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้งาน)

    หมายเหตุ: `edit` และ `topic-create` เปิดใช้งานโดยค่าเริ่มต้นในขณะนี้ และไม่มีสวิตช์ `channels.telegram.actions.*` แยกต่างหาก
    การส่งขณะรันไทม์ใช้สแนปชอต config/secrets ที่ใช้งานอยู่ (เริ่มต้น/โหลดใหม่) ดังนั้นเส้นทางการกระทำจะไม่ทำการ resolve SecretRef ใหม่แบบเฉพาะกิจต่อการส่งแต่ละครั้ง

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

    เมื่อเปิดใช้เธรดการตอบกลับและมีข้อความหรือคำบรรยาย Telegram ต้นฉบับให้ใช้งาน OpenClaw จะรวมข้อความคำพูดอ้างอิงดั้งเดิมของ Telegram โดยอัตโนมัติ Telegram จำกัดข้อความคำพูดอ้างอิงดั้งเดิมไว้ที่ 1024 หน่วยโค้ด UTF-16 ดังนั้นข้อความที่ยาวกว่าจะถูกอ้างอิงจากจุดเริ่มต้น และถอยกลับไปเป็นการตอบกลับธรรมดาหาก Telegram ปฏิเสธคำพูดอ้างอิง

    หมายเหตุ: `off` ปิดใช้งานเธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงถูกใช้งาน

  </Accordion>

  <Accordion title="หัวข้อฟอรัมและพฤติกรรมเธรด">
    ซูเปอร์กรุ๊ปฟอรัม:

    - คีย์เซสชันหัวข้อจะต่อท้าย `:topic:<threadId>`
    - การตอบกลับและการพิมพ์จะกำหนดเป้าหมายไปยังเธรดหัวข้อ
    - เส้นทาง config ของหัวข้อ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของหัวข้อทั่วไป (`threadId=1`):

    - การส่งข้อความละเว้น `message_thread_id` (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - การกระทำการพิมพ์ยังรวม `message_thread_id`

    การสืบทอดหัวข้อ: รายการหัวข้อสืบทอดการตั้งค่ากลุ่ม เว้นแต่ถูกแทนที่ (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` เป็นของหัวข้อเท่านั้นและไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม

    **การกำหนดเส้นทาง agent รายหัวข้อ**: แต่ละหัวข้อสามารถกำหนดเส้นทางไปยัง agent ที่แตกต่างกันได้โดยตั้งค่า `agentId` ใน config ของหัวข้อ วิธีนี้ทำให้แต่ละหัวข้อมีพื้นที่ทำงาน หน่วยความจำ และเซสชันที่แยกเป็นของตนเอง ตัวอย่าง:

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

    **การผูกหัวข้อ ACP แบบถาวร**: หัวข้อฟอรัมสามารถปักหมุดเซสชัน harness ของ ACP ผ่านการผูก ACP แบบมีชนิดระดับบนสุด (`bindings[]` ที่มี `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ id ที่ระบุหัวข้อ เช่น `-1001234567890:topic:42`) ขณะนี้จำกัดขอบเขตไว้ที่หัวข้อฟอรัมในกลุ่ม/ซูเปอร์กรุ๊ป ดู [Agent ACP](/th/tools/acp-agents)

    **การ spawn ACP ที่ผูกกับเธรดจากแชต**: `/acp spawn <agent> --thread here|auto` ผูกหัวข้อปัจจุบันกับเซสชัน ACP ใหม่; ข้อความติดตามผลจะถูกกำหนดเส้นทางไปที่นั่นโดยตรง OpenClaw ปักหมุดการยืนยันการ spawn ไว้ในหัวข้อ ต้องให้ `channels.telegram.threadBindings.spawnSessions` เปิดใช้งานอยู่ต่อไป (ค่าเริ่มต้น: `true`)

    บริบทเทมเพลตเปิดเผย `MessageThreadId` และ `IsForum` แชต DM ที่มี `message_thread_id` จะคงการกำหนดเส้นทาง DM และเมตาดาต้าการตอบกลับบนเซสชันแบบแบนตามค่าเริ่มต้น โดยจะใช้คีย์เซสชันที่รับรู้เธรดเฉพาะเมื่อกำหนดค่าด้วย `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` หรือการกำหนดค่าหัวข้อที่ตรงกัน ใช้ `channels.telegram.dm.threadReplies` ระดับบนสุดสำหรับค่าเริ่มต้นของบัญชี หรือ `direct.<chatId>.threadReplies` สำหรับ DM หนึ่งรายการ

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยกความแตกต่างระหว่างบันทึกเสียงกับไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมแบบไฟล์เสียง
    - แท็ก `[[audio_as_voice]]` ในการตอบกลับของเอเจนต์เพื่อบังคับส่งเป็นบันทึกเสียง
    - ทรานสคริปต์ของบันทึกเสียงขาเข้าจะถูกจัดกรอบเป็นข้อความที่สร้างโดยเครื่อง
      และไม่น่าเชื่อถือในบริบทของเอเจนต์ การตรวจจับการกล่าวถึงยังคงใช้
      ทรานสคริปต์ดิบ เพื่อให้ข้อความเสียงที่ต้องมีการกล่าวถึงยังคงทำงานต่อไป

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

    บันทึกวิดีโอไม่รองรับคำบรรยาย ข้อความที่ให้มาจะถูกส่งแยกต่างหาก

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

    สติกเกอร์จะถูกอธิบายหนึ่งครั้ง (เมื่อทำได้) และแคชไว้เพื่อลดการเรียกวิชันซ้ำ

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

  <Accordion title="การแจ้งเตือนรีแอ็กชัน">
    รีแอ็กชันของ Telegram เข้ามาเป็นการอัปเดต `message_reaction` (แยกจากเพย์โหลดข้อความ)

    เมื่อเปิดใช้ OpenClaw จะจัดคิวเหตุการณ์ระบบ เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    การกำหนดค่า:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงเฉพาะรีแอ็กชันของผู้ใช้ต่อข้อความที่บอทส่ง (ทำแบบดีที่สุดเท่าที่ทำได้ผ่านแคชข้อความที่ส่งแล้ว)
    - เหตุการณ์รีแอ็กชันยังคงเคารพการควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ให้ ID เธรดในการอัปเดตรีแอ็กชัน
      - กลุ่มที่ไม่ใช่ฟอรัมจะกำหนดเส้นทางไปยังเซสชันแชตกลุ่ม
      - กลุ่มฟอรัมจะกำหนดเส้นทางไปยังเซสชันหัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อต้นทางที่แน่นอน

    `allowed_updates` สำหรับ polling/webhook จะรวม `message_reaction` โดยอัตโนมัติ

  </Accordion>

  <Accordion title="รีแอ็กชัน Ack">
    `ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการแก้ค่า:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - อีโมจิสำรองจากตัวตนของเอเจนต์ (`agents.list[].identity.emoji` มิฉะนั้นใช้ "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิยูนิโค้ด (เช่น "👀")
    - ใช้ `""` เพื่อปิดใช้รีแอ็กชันสำหรับช่องทางหรือบัญชี

  </Accordion>

  <Accordion title="การเขียนค่ากำหนดจากเหตุการณ์และคำสั่ง Telegram">
    การเขียนค่ากำหนดของช่องทางเปิดใช้ตามค่าเริ่มต้น (`configWrites !== false`)

    การเขียนที่ทริกเกอร์โดย Telegram ได้แก่:

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
    ค่าเริ่มต้นคือ long polling สำหรับโหมด webhook ให้ตั้งค่า `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; ตัวเลือกเสริมคือ `webhookPath`, `webhookHost`, `webhookPort` (ค่าเริ่มต้น `/telegram-webhook`, `127.0.0.1`, `8787`)

    ตัวรับฟังภายในเครื่องผูกกับ `127.0.0.1:8787` สำหรับทางเข้าสาธารณะ ให้ใส่ reverse proxy ไว้หน้าพอร์ตภายในเครื่อง หรือตั้งค่า `webhookHost: "0.0.0.0"` อย่างตั้งใจ

    โหมด Webhook ตรวจสอบการป้องกันคำขอ โทเค็นลับของ Telegram และเนื้อหา JSON ก่อนส่งคืน `200` ให้ Telegram
    จากนั้น OpenClaw จะประมวลผลการอัปเดตแบบอะซิงโครนัสผ่านเลนบอทต่อแชต/ต่อหัวข้อแบบเดียวกับที่ใช้โดย long polling ดังนั้นรอบการทำงานของเอเจนต์ที่ช้าจะไม่ยึด ACK การส่งมอบของ Telegram ไว้

  </Accordion>

  <Accordion title="ขีดจำกัด การลองซ้ำ และเป้าหมาย CLI">
    - `channels.telegram.textChunkLimit` มีค่าเริ่มต้นเป็น 4000
    - `channels.telegram.chunkMode="newline"` ให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนการแบ่งตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ขาเข้าและขาออก
    - `channels.telegram.mediaGroupFlushMs` (ค่าเริ่มต้น 500) ควบคุมระยะเวลาที่อัลบั้ม/กลุ่มสื่อของ Telegram ถูกบัฟเฟอร์ก่อนที่ OpenClaw จะส่งออกเป็นข้อความขาเข้าหนึ่งรายการ เพิ่มค่านี้หากส่วนต่างๆ ของอัลบั้มมาถึงช้า ลดค่านี้เพื่อลดเวลาแฝงของการตอบกลับอัลบั้ม
    - `channels.telegram.timeoutSeconds` แทนที่ timeout ของไคลเอนต์ Telegram API (ถ้าไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY) ไคลเอนต์บอทจะจำกัดค่าที่กำหนดไว้ซึ่งต่ำกว่าตัวป้องกันคำขอข้อความ/การพิมพ์ขาออก 60 วินาที เพื่อไม่ให้ grammY ยกเลิกการส่งมอบคำตอบที่มองเห็นได้ก่อนที่ตัวป้องกันการขนส่งและทางเลือกสำรองของ OpenClaw จะทำงานได้ Long polling ยังคงใช้ตัวป้องกันคำขอ `getUpdates` 45 วินาที เพื่อไม่ให้การ poll ที่ไม่ได้ใช้งานถูกละทิ้งอย่างไม่มีกำหนด
    - `channels.telegram.pollingStallThresholdMs` มีค่าเริ่มต้นเป็น `120000`; ปรับระหว่าง `30000` ถึง `600000` เฉพาะสำหรับการรีสตาร์ตจาก polling-stall ที่เป็นผลบวกเท็จ
    - ประวัติบริบทกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` จะปิดใช้
    - บริบทเสริมของการตอบกลับ/การอ้างอิง/การส่งต่อ ขณะนี้ส่งต่อไปตามที่ได้รับ
    - allowlist ของ Telegram โดยหลักแล้วควบคุมว่าใครสามารถทริกเกอร์เอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมทั้งหมด
    - ตัวควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - การกำหนดค่า `channels.telegram.retry` ใช้กับตัวช่วยส่ง Telegram (CLI/เครื่องมือ/การดำเนินการ) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้ การส่งมอบการตอบกลับสุดท้ายขาเข้ายังใช้การลองส่งซ้ำแบบ safe-send ที่มีขอบเขตสำหรับความล้มเหลวก่อนเชื่อมต่อ Telegram แต่จะไม่ลองซ้ำกับซองเครือข่ายหลังส่งที่คลุมเครือซึ่งอาจทำให้ข้อความที่มองเห็นได้ซ้ำกัน

    เป้าหมายส่งของ CLI และเครื่องมือข้อความสามารถเป็น ID แชตแบบตัวเลข ชื่อผู้ใช้ หรือเป้าหมายหัวข้อฟอรัม:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    การ poll ของ Telegram ใช้ `openclaw message poll` และรองรับหัวข้อฟอรัม:

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

    การส่ง Telegram ยังรองรับ:

    - `--presentation` พร้อมบล็อก `buttons` สำหรับคีย์บอร์ดแบบอินไลน์เมื่อ `channels.telegram.capabilities.inlineButtons` อนุญาต
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอการส่งมอบแบบปักหมุดเมื่อบอทสามารถปักหมุดในแชตนั้นได้
    - `--force-document` เพื่อส่งรูปภาพและ GIF ขาออกเป็นเอกสารแทนการอัปโหลดเป็นรูปภาพที่บีบอัดหรือสื่อเคลื่อนไหว

    การควบคุมการดำเนินการ:

    - `channels.telegram.actions.sendMessage=false` ปิดใช้ข้อความ Telegram ขาออก รวมถึง poll
    - `channels.telegram.actions.poll=false` ปิดใช้การสร้าง poll ของ Telegram โดยยังคงเปิดใช้การส่งปกติไว้

  </Accordion>

  <Accordion title="การอนุมัติ exec ใน Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถโพสต์ prompt ในแชตหรือหัวข้อต้นทางได้เป็นตัวเลือก ผู้อนุมัติต้องเป็น ID ผู้ใช้ Telegram แบบตัวเลข

    เส้นทางการกำหนดค่า:

    - `channels.telegram.execApprovals.enabled` (เปิดใช้อัตโนมัติเมื่อมีผู้อนุมัติอย่างน้อยหนึ่งคนที่แก้ค่าได้)
    - `channels.telegram.execApprovals.approvers` (ย้อนกลับไปใช้ ID เจ้าของแบบตัวเลขจาก `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` และ `defaultTo` ควบคุมว่าใครสามารถคุยกับบอทได้และบอทจะส่งคำตอบปกติไปที่ใด สิ่งเหล่านี้ไม่ได้ทำให้ใครเป็นผู้อนุมัติ exec การจับคู่ DM ที่ได้รับอนุมัติครั้งแรกจะบูตสแตรป `commands.ownerAllowFrom` เมื่อยังไม่มีเจ้าของคำสั่ง ดังนั้นการตั้งค่าเจ้าของหนึ่งคนยังคงทำงานได้โดยไม่ต้องระบุ ID ซ้ำใต้ `execApprovals.approvers`

    การส่งมอบผ่านช่องทางจะแสดงข้อความคำสั่งในแชต เปิดใช้ `channel` หรือ `both` เฉพาะในกลุ่ม/หัวข้อที่เชื่อถือได้ เมื่อ prompt ไปถึงหัวข้อฟอรัม OpenClaw จะรักษาหัวข้อนั้นไว้สำหรับ prompt การอนุมัติและการติดตามผล การอนุมัติ exec หมดอายุหลัง 30 นาทีตามค่าเริ่มต้น

    ปุ่มอนุมัติแบบอินไลน์ยังต้องให้ `channels.telegram.capabilities.inlineButtons` อนุญาตพื้นผิวเป้าหมาย (`dm`, `group` หรือ `all`) ด้วย ID การอนุมัติที่ขึ้นต้นด้วย `plugin:` จะแก้ค่าผ่านการอนุมัติของ plugin ส่วนอื่นๆ จะแก้ค่าผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ Exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## ตัวควบคุมการตอบกลับข้อผิดพลาด

เมื่อเอเจนต์พบข้อผิดพลาดในการส่งมอบหรือ provider Telegram สามารถตอบกลับด้วยข้อความข้อผิดพลาดหรือระงับไว้ได้ คีย์กำหนดค่าสองรายการควบคุมพฤติกรรมนี้:

| คีย์                                 | ค่า            | ค่าเริ่มต้น | คำอธิบาย                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` ส่งข้อความข้อผิดพลาดที่เป็นมิตรไปยังแชต `silent` ระงับการตอบกลับข้อผิดพลาดทั้งหมด |
| `channels.telegram.errorCooldownMs` | ตัวเลข (มิลลิวินาที)       | `60000` | เวลาขั้นต่ำระหว่างการตอบกลับข้อผิดพลาดไปยังแชตเดียวกัน ป้องกันสแปมข้อผิดพลาดระหว่างเกิดเหตุขัดข้อง        |

รองรับการแทนที่ต่อบัญชี ต่อกลุ่ม และต่อหัวข้อ (ใช้การสืบทอดแบบเดียวกับคีย์กำหนดค่า Telegram อื่นๆ)

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
  <Accordion title="บอทไม่ตอบสนองต่อข้อความกลุ่มที่ไม่ได้กล่าวถึง">

    - หาก `requireMention=false` โหมดความเป็นส่วนตัวของ Telegram ต้องอนุญาตให้มองเห็นได้ทั้งหมด
      - BotFather: `/setprivacy` -> Disable
      - จากนั้นลบบอตออกจากกลุ่มแล้วเพิ่มกลับเข้าไปใหม่
    - `openclaw channels status` จะแจ้งเตือนเมื่อการกำหนดค่าคาดว่าจะรับข้อความกลุ่มที่ไม่ได้กล่าวถึง
    - `openclaw channels status --probe` สามารถตรวจสอบ ID กลุ่มแบบตัวเลขที่ระบุชัดเจนได้; ไวลด์การ์ด `"*"` ไม่สามารถตรวจสอบสมาชิกภาพได้
    - การทดสอบเซสชันแบบเร็ว: `/activation always`.

  </Accordion>

  <Accordion title="บอตไม่เห็นข้อความกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` อยู่ ต้องระบุกลุ่มไว้ในรายการ (หรือรวม `"*"`)
    - ตรวจสอบสมาชิกภาพของบอตในกลุ่ม
    - ตรวจดูล็อก: `openclaw logs --follow` สำหรับเหตุผลที่ข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานบางส่วนหรือไม่ทำงานเลย">

    - อนุญาตตัวตนผู้ส่งของคุณ (การจับคู่และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังคงมีผลแม้นโยบายกลุ่มจะเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนูเนทีฟมีรายการมากเกินไป; ลดคำสั่ง Plugin/skill/คำสั่งกำหนดเอง หรือปิดใช้งานเมนูเนทีฟ
    - การเรียกตอนเริ่มต้น `deleteMyCommands` / `setMyCommands` และการเรียกแสดงสถานะกำลังพิมพ์ `sendChatAction` ถูกจำกัดขอบเขตและลองซ้ำหนึ่งครั้งผ่านทางเลือกสำรองของทรานสปอร์ต Telegram เมื่อคำขอหมดเวลา ข้อผิดพลาดเครือข่าย/การดึงข้อมูลที่ยังคงเกิดขึ้นมักบ่งชี้ปัญหา DNS/HTTPS ในการเข้าถึง `api.telegram.org`

  </Accordion>

  <Accordion title="การเริ่มต้นรายงานโทเค็นไม่ได้รับอนุญาต">

    - `getMe returned 401` คือความล้มเหลวในการยืนยันตัวตน Telegram สำหรับโทเค็นบอตที่กำหนดค่าไว้
    - คัดลอกใหม่หรือสร้างโทเค็นบอตใหม่ใน BotFather จากนั้นอัปเดต `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` หรือ `TELEGRAM_BOT_TOKEN` สำหรับบัญชีเริ่มต้น
    - `deleteWebhook 401 Unauthorized` ระหว่างเริ่มต้นก็เป็นความล้มเหลวของการยืนยันตัวตนเช่นกัน; การถือว่าเป็น "ไม่มี webhook อยู่" จะเพียงเลื่อนความล้มเหลวจากโทเค็นที่ไม่ถูกต้องเดียวกันไปยังการเรียก API ภายหลังเท่านั้น

  </Accordion>

  <Accordion title="การ polling หรือเครือข่ายไม่เสถียร">

    - Node 22+ + fetch/proxy แบบกำหนดเองอาจทำให้เกิดพฤติกรรมยกเลิกทันทีหากชนิด AbortSignal ไม่ตรงกัน
    - โฮสต์บางตัว resolve `api.telegram.org` เป็น IPv6 ก่อน; egress IPv6 ที่เสียอาจทำให้ Telegram API ล้มเหลวเป็นระยะ
    - หากล็อกมี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!` ตอนนี้ OpenClaw จะลองซ้ำโดยถือเป็นข้อผิดพลาดเครือข่ายที่กู้คืนได้
    - ระหว่างการเริ่มต้น polling, OpenClaw นำ probe `getMe` ตอนเริ่มต้นที่สำเร็จกลับมาใช้กับ grammY เพื่อให้ runner ไม่ต้องใช้ `getMe` ครั้งที่สองก่อน `getUpdates` ครั้งแรก
    - หาก `deleteWebhook` ล้มเหลวด้วยข้อผิดพลาดเครือข่ายชั่วคราวระหว่างเริ่มต้น polling, OpenClaw จะเข้าสู่ long polling ต่อแทนการเรียก control-plane ก่อน polling อีกครั้ง Webhook ที่ยังทำงานอยู่จะแสดงเป็นความขัดแย้งของ `getUpdates`; จากนั้น OpenClaw จะสร้างทรานสปอร์ต Telegram ใหม่และลองล้าง webhook อีกครั้ง
    - หากซ็อกเก็ต Telegram ถูกรีไซเคิลตามรอบเวลาคงที่สั้น ๆ ให้ตรวจสอบว่า `channels.telegram.timeoutSeconds` ต่ำหรือไม่; ไคลเอนต์บอตจะจำกัดค่าที่กำหนดไว้ให้ไม่ต่ำกว่า guard ของคำขอขาออกและ `getUpdates` แต่รุ่นเก่าอาจยกเลิกทุก poll หรือทุก reply เมื่อค่านี้ถูกตั้งต่ำกว่า guard เหล่านั้น
    - หากล็อกมี `Polling stall detected`, OpenClaw จะเริ่ม polling ใหม่และสร้างทรานสปอร์ต Telegram ใหม่หลังจาก 120 วินาทีที่ไม่มี liveness ของ long-poll ที่เสร็จสมบูรณ์ตามค่าเริ่มต้น
    - `openclaw channels status --probe` และ `openclaw doctor` จะแจ้งเตือนเมื่อบัญชี polling ที่กำลังทำงานยังไม่เสร็จสิ้น `getUpdates` หลังช่วงผ่อนผันตอนเริ่มต้น, เมื่อบัญชี webhook ที่กำลังทำงานยังไม่เสร็จสิ้น `setWebhook` หลังช่วงผ่อนผันตอนเริ่มต้น หรือเมื่อกิจกรรมทรานสปอร์ต polling ที่สำเร็จล่าสุดเก่าเกินไป
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่ทำงานนานยังปกติ แต่โฮสต์ของคุณยังรายงานการรีสตาร์ต polling-stall ที่เป็น false positive การค้างต่อเนื่องมักชี้ไปที่ปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่างโฮสต์กับ `api.telegram.org`
    - Telegram ยังเคารพ env proxy ของโปรเซสสำหรับทรานสปอร์ต Bot API รวมถึง `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และรูปแบบตัวพิมพ์เล็กของตัวแปรเหล่านี้ `NO_PROXY` / `no_proxy` ยังคง bypass `api.telegram.org` ได้
    - หาก proxy ที่ OpenClaw จัดการถูกกำหนดค่าผ่าน `OPENCLAW_PROXY_URL` สำหรับสภาพแวดล้อมบริการและไม่มี env proxy มาตรฐาน Telegram จะใช้ URL นั้นสำหรับทรานสปอร์ต Bot API ด้วย
    - บนโฮสต์ VPS ที่ egress/TLS โดยตรงไม่เสถียร ให้ route การเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ มีค่าเริ่มต้นเป็น `autoSelectFamily=true` (ยกเว้น WSL2) ลำดับผลลัพธ์ DNS ของ Telegram จะเคารพ `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER` จากนั้น `channels.telegram.network.dnsResultOrder` จากนั้นค่าเริ่มต้นของโปรเซส เช่น `NODE_OPTIONS=--dns-result-order=ipv4first`; หากไม่มีค่าใดมีผล Node 22+ จะ fallback เป็น `ipv4first`
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนกับพฤติกรรม IPv4-only ให้บังคับการเลือก family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบช่วง benchmark ของ RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาตแล้ว
      สำหรับการดาวน์โหลดสื่อ Telegram ตามค่าเริ่มต้น หาก fake-IP ที่เชื่อถือได้หรือ
      proxy แบบโปร่งใสเขียน `api.telegram.org` ใหม่เป็นที่อยู่
      private/internal/special-use อื่นระหว่างดาวน์โหลดสื่อ คุณสามารถเลือกใช้
      bypass เฉพาะ Telegram ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - การเลือกใช้แบบเดียวกันมีให้ต่อบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หาก proxy ของคุณ resolve โฮสต์สื่อ Telegram เป็น `198.18.x.x` ให้ปิด
      flag อันตรายไว้ก่อน สื่อ Telegram อนุญาตช่วง benchmark RFC 2544
      ตามค่าเริ่มต้นอยู่แล้ว

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` ทำให้การป้องกัน SSRF
      ของสื่อ Telegram อ่อนลง ใช้เฉพาะกับสภาพแวดล้อม proxy ที่เชื่อถือได้และควบคุมโดยผู้ปฏิบัติการ
      เช่น Clash, Mihomo หรือการ route fake-IP ของ Surge เมื่อเครื่องมือเหล่านั้น
      สร้างคำตอบ private หรือ special-use นอกช่วง benchmark RFC 2544
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

ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา Channel](/th/channels/troubleshooting).

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Telegram](/th/gateway/config-channels#telegram).

<Accordion title="ฟิลด์ Telegram ที่มีสัญญาณสูง">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; symlink จะถูกปฏิเสธ)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- การอนุมัติ exec: `execApprovals`, `accounts.*.execApprovals`
- คำสั่ง/เมนู: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/replies: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- การจัดรูปแบบ/การส่งมอบ: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- สื่อ/เครือข่าย: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- root API กำหนดเอง: `apiRoot` (root ของ Bot API เท่านั้น; อย่ารวม `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions: `reactionNotifications`, `reactionLevel`
- errors: `errorPolicy`, `errorCooldownMs`
- writes/history: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญแบบหลายบัญชี: เมื่อกำหนดค่า ID บัญชีตั้งแต่สองรายการขึ้นไป ให้ตั้ง `channels.telegram.defaultAccount` (หรือรวม `channels.telegram.accounts.default`) เพื่อทำให้การ route เริ่มต้นชัดเจน มิฉะนั้น OpenClaw จะ fallback เป็น ID บัญชีแรกที่ normalized แล้ว และ `openclaw doctor` จะแจ้งเตือน บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom` แต่ไม่สืบทอดค่า `accounts.default.*`
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
    Route ข้อความขาเข้าไปยัง agent
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการทำให้แข็งแกร่ง
  </Card>
  <Card title="การ route แบบหลาย agent" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกลุ่มและหัวข้อไปยัง agent
  </Card>
  <Card title="การแก้ไขปัญหา" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้าม Channel
  </Card>
</CardGroup>
