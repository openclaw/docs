---
read_when:
    - การทำงานเกี่ยวกับฟีเจอร์ของ Telegram หรือ Webhook
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าบอต Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-06T09:03:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08475cd9dd3cf641f482db94a0581e4e382a60be4bd6f3bf3d50b980b0235090
    source_path: channels/telegram.md
    workflow: 16
---

พร้อมใช้งานระดับโปรดักชันสำหรับ DM ของบอตและกลุ่มผ่าน grammY โหมดเริ่มต้นคือ long polling ส่วนโหมด Webhook เป็นตัวเลือก

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับ Telegram คือการจับคู่
  </Card>
  <Card title="การแก้ปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและเพลย์บุ๊กการซ่อมแซม
  </Card>
  <Card title="การกำหนดค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าช่องทางแบบเต็ม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="สร้างโทเค็นบอตใน BotFather">
    เปิด Telegram แล้วแชตกับ **@BotFather** (ยืนยันว่าแฮนเดิลเป็น `@BotFather` ทุกตัวอักษร)

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

    ค่า fallback จาก env: `TELEGRAM_BOT_TOKEN=...` (เฉพาะบัญชีเริ่มต้น)
    Telegram **ไม่** ใช้ `openclaw channels login telegram`; ให้กำหนดค่าโทเค็นใน config/env แล้วเริ่ม gateway

  </Step>

  <Step title="เริ่ม gateway และอนุมัติ DM แรก">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    โค้ดจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง

  </Step>

  <Step title="เพิ่มบอตเข้ากลุ่ม">
    เพิ่มบอตเข้ากลุ่มของคุณ แล้วตั้งค่า `channels.telegram.groups` และ `groupPolicy` ให้ตรงกับโมเดลการเข้าถึงของคุณ
  </Step>
</Steps>

<Note>
ลำดับการหาโทเค็นรับรู้ตามบัญชี ในทางปฏิบัติ ค่าจาก config จะชนะค่า fallback จาก env และ `TELEGRAM_BOT_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="โหมดความเป็นส่วนตัวและการมองเห็นในกลุ่ม">
    บอต Telegram มีค่าเริ่มต้นเป็น **โหมดความเป็นส่วนตัว** ซึ่งจำกัดข้อความกลุ่มที่บอตได้รับ

    หากบอตต้องเห็นข้อความกลุ่มทั้งหมด ให้ทำอย่างใดอย่างหนึ่ง:

    - ปิดโหมดความเป็นส่วนตัวผ่าน `/setprivacy` หรือ
    - ตั้งให้บอตเป็นผู้ดูแลกลุ่ม

    เมื่อสลับโหมดความเป็นส่วนตัว ให้ลบ + เพิ่มบอตใหม่ในแต่ละกลุ่มเพื่อให้ Telegram นำการเปลี่ยนแปลงไปใช้

  </Accordion>

  <Accordion title="สิทธิ์ของกลุ่ม">
    สถานะผู้ดูแลควบคุมได้ในการตั้งค่ากลุ่ม Telegram

    บอตที่เป็นผู้ดูแลจะได้รับข้อความกลุ่มทั้งหมด ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มแบบทำงานตลอดเวลา

  </Accordion>

  <Accordion title="ตัวเลือกสลับที่มีประโยชน์ของ BotFather">

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
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    `dmPolicy: "open"` พร้อม `allowFrom: ["*"]` ทำให้บัญชี Telegram ใดก็ตามที่พบหรือเดาชื่อผู้ใช้ของบอตได้สามารถสั่งงานบอตได้ ใช้เฉพาะกับบอตสาธารณะที่ตั้งใจเปิดจริงและมีเครื่องมือที่จำกัดอย่างเข้มงวดเท่านั้น; บอตเจ้าของเดียวควรใช้ `allowlist` พร้อม ID ผู้ใช้แบบตัวเลข

    `channels.telegram.allowFrom` รับ ID ผู้ใช้ Telegram แบบตัวเลข รองรับและปรับรูปแบบ prefix `telegram:` / `tg:`
    ใน config หลายบัญชี `channels.telegram.allowFrom` ระดับบนสุดที่เข้มงวดจะถูกใช้เป็นขอบเขตความปลอดภัย: รายการ `allowFrom: ["*"]` ระดับบัญชีจะไม่ทำให้บัญชีนั้นเป็นสาธารณะ เว้นแต่ allowlist ที่มีผลของบัญชียังคงมี wildcard ที่ระบุชัดเจนหลังการ merge
    `dmPolicy: "allowlist"` ที่มี `allowFrom` ว่างจะบล็อก DM ทั้งหมดและถูกปฏิเสธโดยการตรวจสอบ config
    การตั้งค่าจะถามหาเฉพาะ ID ผู้ใช้แบบตัวเลขเท่านั้น
    หากคุณอัปเกรดแล้ว config ของคุณมีรายการ allowlist แบบ `@username` ให้เรียกใช้ `openclaw doctor --fix` เพื่อ resolve รายการเหล่านั้น (ทำได้เท่าที่เป็นไปได้; ต้องใช้โทเค็นบอต Telegram)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์ allowlist ของ pairing-store, `openclaw doctor --fix` สามารถกู้รายการเข้าไปใน `channels.telegram.allowFrom` ในโฟลว์ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID ที่ระบุชัดเจน)

    สำหรับบอตเจ้าของเดียว แนะนำให้ใช้ `dmPolicy: "allowlist"` พร้อม ID `allowFrom` แบบตัวเลขที่ระบุชัดเจน เพื่อให้นโยบายการเข้าถึงคงทนใน config (แทนการพึ่งพาการอนุมัติการจับคู่ก่อนหน้า)

    ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่ได้หมายความว่า "ผู้ส่งนี้ได้รับอนุญาตทุกที่"
    การจับคู่ให้สิทธิ์เข้าถึง DM หากยังไม่มีเจ้าของคำสั่ง การจับคู่ที่ได้รับอนุมัติครั้งแรกจะตั้งค่า `commands.ownerAllowFrom` ด้วย เพื่อให้คำสั่งสำหรับเจ้าของเท่านั้นและการอนุมัติ exec มีบัญชีผู้ปฏิบัติงานที่ระบุชัดเจน
    การอนุญาตผู้ส่งในกลุ่มยังคงมาจาก allowlist ใน config ที่ระบุชัดเจน
    หากคุณต้องการ "ฉันได้รับอนุญาตครั้งเดียว แล้วทั้ง DM และคำสั่งกลุ่มทำงาน" ให้ใส่ ID ผู้ใช้ Telegram แบบตัวเลขของคุณใน `channels.telegram.allowFrom`; สำหรับคำสั่งสำหรับเจ้าของเท่านั้น ให้แน่ใจว่า `commands.ownerAllowFrom` มี `telegram:<your user id>`

    ### การหา ID ผู้ใช้ Telegram ของคุณ

    วิธีที่ปลอดภัยกว่า (ไม่ใช้บอตบุคคลที่สาม):

    1. DM ไปยังบอตของคุณ
    2. เรียกใช้ `openclaw logs --follow`
    3. อ่าน `from.id`

    วิธีทางการของ Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีของบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="นโยบายกลุ่มและ allowlist">
    มีการควบคุมสองอย่างที่ใช้ร่วมกัน:

    1. **กลุ่มใดได้รับอนุญาต** (`channels.telegram.groups`)
       - ไม่มี config `groups`:
         - พร้อม `groupPolicy: "open"`: ทุกกลุ่มสามารถผ่านการตรวจสอบ group-ID ได้
         - พร้อม `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการ `groups` (หรือ `"*"`)
       - กำหนดค่า `groups` แล้ว: ทำหน้าที่เป็น allowlist (ID ที่ระบุชัดเจนหรือ `"*"`)

    2. **ผู้ส่งใดได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่า Telegram จะ fallback ไปที่ `allowFrom`
    รายการ `groupAllowFrom` ควรเป็น ID ผู้ใช้ Telegram แบบตัวเลข (prefix `telegram:` / `tg:` จะถูกปรับรูปแบบ)
    อย่าใส่ ID แชตของกลุ่มหรือซูเปอร์กรุ๊ป Telegram ใน `groupAllowFrom` ID แชตค่าลบต้องอยู่ใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเว้นสำหรับการอนุญาตผู้ส่ง
    ขอบเขตความปลอดภัย (`2026.2.25+`): การยืนยันสิทธิ์ผู้ส่งในกลุ่ม **ไม่** สืบทอดการอนุมัติ pairing-store ของ DM
    การจับคู่ยังคงเป็นแบบ DM เท่านั้น สำหรับกลุ่ม ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` ต่อกลุ่ม/ต่อหัวข้อ
    หากไม่ได้ตั้งค่า `groupAllowFrom`, Telegram จะ fallback ไปที่ `allowFrom` ใน config ไม่ใช่ pairing store
    รูปแบบที่ใช้ได้จริงสำหรับบอตเจ้าของเดียว: ตั้งค่า ID ผู้ใช้ของคุณใน `channels.telegram.allowFrom`, ปล่อย `groupAllowFrom` ให้ไม่ได้ตั้งค่า และอนุญาตกลุ่มเป้าหมายใต้ `channels.telegram.groups`
    หมายเหตุรันไทม์: หาก `channels.telegram` หายไปทั้งหมด รันไทม์จะมีค่าเริ่มต้นเป็น fail-closed `groupPolicy="allowlist"` เว้นแต่ `channels.defaults.groupPolicy` จะถูกตั้งค่าไว้ชัดเจน

    ตัวอย่าง: อนุญาตสมาชิกทุกคนในกลุ่มเฉพาะหนึ่งกลุ่ม:

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

      - ใส่ ID แชตของกลุ่มหรือซูเปอร์กรุ๊ป Telegram ที่เป็นค่าลบ เช่น `-1001234567890` ไว้ใต้ `channels.telegram.groups`
      - ใส่ ID ผู้ใช้ Telegram เช่น `8734062810` ไว้ใต้ `groupAllowFrom` เมื่อคุณต้องการจำกัดว่าคนใดในกลุ่มที่ได้รับอนุญาตสามารถเรียกบอตได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกคนใดก็ได้ในกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอตได้

    </Warning>

  </Tab>

  <Tab title="พฤติกรรมการ mention">
    การตอบกลับในกลุ่มต้องมีการ mention ตามค่าเริ่มต้น

    การ mention อาจมาจาก:

    - การ mention แบบ native `@botusername` หรือ
    - รูปแบบ mention ใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    ตัวเลือกสลับคำสั่งระดับเซสชัน:

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

    การหา ID แชตกลุ่ม:

    - ส่งต่อข้อความกลุ่มไปยัง `@userinfobot` / `@getidsbot`
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจดู Bot API `getUpdates`

  </Tab>
</Tabs>

## พฤติกรรมรันไทม์

- Telegram อยู่ภายใต้การดูแลของกระบวนการ gateway
- การกำหนดเส้นทางเป็นแบบกำหนดแน่นอน: ข้อความขาเข้าจาก Telegram จะตอบกลับไปที่ Telegram (โมเดลไม่ได้เลือกช่องทาง)
- ข้อความขาเข้าจะถูก normalize เป็น envelope ช่องทางร่วม พร้อม metadata การตอบกลับและ placeholder สื่อ
- เซสชันกลุ่มถูกแยกตาม ID กลุ่ม หัวข้อฟอรัมจะต่อท้าย `:topic:<threadId>` เพื่อแยกหัวข้อออกจากกัน
- ข้อความ DM สามารถมี `message_thread_id`; OpenClaw จะคง ID เธรดไว้สำหรับการตอบกลับ แต่ให้ DM อยู่บนเซสชันแบบแบนตามค่าเริ่มต้น กำหนดค่า `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` หรือ config หัวข้อที่ตรงกัน เมื่อคุณตั้งใจต้องการการแยกเซสชันหัวข้อของ DM
- Long polling ใช้ grammY runner พร้อมการจัดลำดับต่อแชต/ต่อเธรด concurrency ของ runner sink โดยรวมใช้ `agents.defaults.maxConcurrent`
- Long polling มีการป้องกันภายในแต่ละกระบวนการ gateway เพื่อให้มี poller ที่ใช้งานอยู่เพียงหนึ่งตัวเท่านั้นที่ใช้โทเค็นบอตได้ในแต่ละครั้ง หากคุณยังเห็น conflict `getUpdates` 409 แสดงว่า OpenClaw gateway, สคริปต์ หรือ poller ภายนอกอื่นน่าจะกำลังใช้โทเค็นเดียวกัน
- การรีสตาร์ทจาก watchdog ของ long-polling จะถูกเรียกหลังจากไม่มี liveness ของ `getUpdates` ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีตามค่าเริ่มต้น เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อ deployment ของคุณยังเห็นการรีสตาร์ท polling-stall แบบผิดพลาดระหว่างงานที่รันนาน ค่านี้มีหน่วยเป็นมิลลิวินาทีและอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับการ override ต่อบัญชี
- Telegram Bot API ไม่รองรับ read-receipt (`sendReadReceipts` ไม่เกี่ยวข้อง)

## อ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="พรีวิวสตรีมสด (การแก้ไขข้อความ)">
    OpenClaw สามารถสตรีมคำตอบบางส่วนแบบเรียลไทม์ได้:

    - แชตโดยตรง: ข้อความพรีวิว + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความพรีวิว + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` คือ `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - `progress` จะคงร่างสถานะที่แก้ไขได้หนึ่งรายการสำหรับความคืบหน้าของเครื่องมือ ล้างเมื่อเสร็จสิ้น และส่งคำตอบสุดท้ายเป็นข้อความปกติ
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความพรีวิวที่แก้ไขเดียวกันซ้ำหรือไม่ (ค่าเริ่มต้น: `true` เมื่อการสตรีมพรีวิวเปิดใช้งานอยู่)
    - `streaming.preview.commandText` ควบคุมรายละเอียดคำสั่ง/exec ภายในบรรทัดความคืบหน้าของเครื่องมือเหล่านั้น: `raw` (ค่าเริ่มต้น, คงพฤติกรรมที่เผยแพร่แล้วไว้) หรือ `status` (เฉพาะป้ายกำกับเครื่องมือ)
    - ตรวจพบค่า legacy `channels.telegram.streamMode` และค่า boolean `streaming`; เรียกใช้ `openclaw doctor --fix` เพื่อ migrate ค่าเหล่านั้นไปยัง `channels.telegram.streaming.mode`

    การอัปเดตพรีวิวความคืบหน้าของเครื่องมือคือบรรทัดสถานะสั้น ๆ ที่แสดงระหว่างเครื่องมือทำงาน เช่น การดำเนินการคำสั่ง การอ่านไฟล์ การอัปเดตการวางแผน หรือสรุปแพตช์ Telegram เปิดสิ่งเหล่านี้ไว้ตามค่าเริ่มต้นเพื่อให้ตรงกับพฤติกรรม OpenClaw ที่เผยแพร่ตั้งแต่ `v2026.4.22` เป็นต้นไป หากต้องการคงพรีวิวที่แก้ไขสำหรับข้อความคำตอบ แต่ซ่อนบรรทัดความคืบหน้าของเครื่องมือ ให้ตั้งค่า:

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

    หากต้องการให้ความคืบหน้าของเครื่องมือยังมองเห็นได้แต่ซ่อนข้อความคำสั่ง/exec ให้ตั้งค่า:

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

    ใช้โหมด `progress` เมื่อต้องการให้เห็นความคืบหน้าของเครื่องมือโดยไม่แก้ไขคำตอบสุดท้ายเข้าไปในข้อความเดียวกันนั้น ใส่นโยบายข้อความคำสั่งไว้ใต้ `streaming.progress`:

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

    ใช้ `streaming.mode: "off"` เฉพาะเมื่อต้องการส่งเฉพาะผลลัพธ์สุดท้ายเท่านั้น: การแก้ไขพรีวิวของ Telegram จะถูกปิด และข้อความทั่วไปเกี่ยวกับเครื่องมือ/ความคืบหน้าจะถูกระงับแทนที่จะส่งเป็นข้อความสถานะแยกต่างหาก พรอมต์อนุมัติ payload สื่อ และข้อผิดพลาดยังคงส่งผ่านการส่งผลลัพธ์สุดท้ายตามปกติ ใช้ `streaming.preview.toolProgress: false` เมื่อต้องการคงการแก้ไขพรีวิวคำตอบไว้เท่านั้น พร้อมซ่อนบรรทัดสถานะความคืบหน้าของเครื่องมือ

    <Note>
      การตอบกลับแบบอ้างอิงข้อความที่เลือกของ Telegram เป็นข้อยกเว้น เมื่อ `replyToMode` เป็น `"first"`, `"all"` หรือ `"batched"` และข้อความขาเข้ามีข้อความอ้างอิงที่เลือกไว้ OpenClaw จะส่งคำตอบสุดท้ายผ่านเส้นทาง quote-reply แบบเนทีฟของ Telegram แทนการแก้ไขพรีวิวคำตอบ ดังนั้น `streaming.preview.toolProgress` จึงไม่สามารถแสดงบรรทัดสถานะสั้น ๆ สำหรับรอบนั้นได้ การตอบกลับข้อความปัจจุบันที่ไม่มีข้อความอ้างอิงที่เลือกไว้ยังคงใช้การสตรีมพรีวิว ตั้งค่า `replyToMode: "off"` เมื่อการมองเห็นความคืบหน้าของเครื่องมือสำคัญกว่าการตอบกลับแบบอ้างอิงเนทีฟ หรือตั้งค่า `streaming.preview.toolProgress: false` เพื่อยอมรับข้อแลกเปลี่ยนนี้
    </Note>

    สำหรับการตอบกลับแบบข้อความเท่านั้น:

    - พรีวิวสั้นใน DM/กลุ่ม/หัวข้อ: OpenClaw เก็บข้อความพรีวิวเดิมไว้และแก้ไขเป็นผลลัพธ์สุดท้ายในตำแหน่งเดิม
    - ผลลัพธ์สุดท้ายแบบข้อความยาวที่ถูกแบ่งเป็นหลายข้อความ Telegram จะใช้พรีวิวเดิมซ้ำเป็นชิ้นแรกของผลลัพธ์สุดท้ายเมื่อทำได้ จากนั้นส่งเฉพาะชิ้นที่เหลือ
    - ผลลัพธ์สุดท้ายในโหมดความคืบหน้าจะล้างแบบร่างสถานะและใช้การส่งผลลัพธ์สุดท้ายตามปกติแทนการแก้ไขแบบร่างให้เป็นคำตอบ
    - หากการแก้ไขผลลัพธ์สุดท้ายล้มเหลวก่อนยืนยันข้อความที่เสร็จสมบูรณ์ OpenClaw จะใช้การส่งผลลัพธ์สุดท้ายตามปกติและล้างพรีวิวที่ค้างอยู่

    สำหรับการตอบกลับที่ซับซ้อน เช่น payload สื่อ OpenClaw จะกลับไปใช้การส่งผลลัพธ์สุดท้ายตามปกติ แล้วล้างข้อความพรีวิว

    การสตรีมพรีวิวแยกจากการสตรีมบล็อก เมื่อเปิดใช้การสตรีมบล็อกสำหรับ Telegram อย่างชัดเจน OpenClaw จะข้ามสตรีมพรีวิวเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

    สตรีม reasoning เฉพาะ Telegram:

    - `/reasoning stream` ส่ง reasoning ไปยังพรีวิวสดขณะกำลังสร้างคำตอบ
    - พรีวิว reasoning จะถูกลบหลังส่งผลลัพธ์สุดท้าย ใช้ `/reasoning on` เมื่อต้องการให้ reasoning ยังคงมองเห็นได้
    - คำตอบสุดท้ายจะถูกส่งโดยไม่มีข้อความ reasoning

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    ข้อความขาออกใช้ Telegram `parse_mode: "HTML"`

    - ข้อความที่คล้าย Markdown จะถูกเรนเดอร์เป็น HTML ที่ปลอดภัยสำหรับ Telegram
    - HTML ดิบจากโมเดลจะถูก escape เพื่อลดความล้มเหลวในการแยกวิเคราะห์ของ Telegram
    - หาก Telegram ปฏิเสธ HTML ที่แยกวิเคราะห์แล้ว OpenClaw จะลองใหม่เป็นข้อความล้วน

    พรีวิวลิงก์เปิดใช้งานเป็นค่าเริ่มต้น และปิดได้ด้วย `channels.telegram.linkPreview: false`

  </Accordion>

  <Accordion title="Native commands and custom commands">
    การลงทะเบียนเมนูคำสั่งของ Telegram จะจัดการเมื่อเริ่มต้นด้วย `setMyCommands`

    ค่าเริ่มต้นของคำสั่งเนทีฟ:

    - `commands.native: "auto"` เปิดใช้คำสั่งเนทีฟสำหรับ Telegram

    เพิ่มรายการเมนูคำสั่งที่กำหนดเอง:

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

    - ชื่อจะถูก normalize (ตัด `/` นำหน้าออก แปลงเป็นตัวพิมพ์เล็ก)
    - รูปแบบที่ใช้ได้: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งที่กำหนดเองไม่สามารถแทนที่คำสั่งเนทีฟได้
    - รายการที่ขัดแย้ง/ซ้ำกันจะถูกข้ามและบันทึกลงล็อก

    หมายเหตุ:

    - คำสั่งที่กำหนดเองเป็นเพียงรายการเมนูเท่านั้น ไม่ได้ติดตั้งพฤติกรรมให้อัตโนมัติ
    - คำสั่งของ Plugin/Skills ยังใช้งานได้เมื่อพิมพ์ แม้จะไม่แสดงในเมนู Telegram

    หากปิดใช้คำสั่งเนทีฟ คำสั่งในตัวจะถูกลบออก คำสั่งแบบกำหนดเอง/Plugin ยังอาจลงทะเบียนได้หากกำหนดค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายถึงเมนู Telegram ยังมีรายการเกินหลังตัดแต่งแล้ว ให้ลดคำสั่ง Plugin/Skills/กำหนดเอง หรือปิดใช้ `channels.telegram.commands.native`
    - `deleteWebhook`, `deleteMyCommands` หรือ `setMyCommands` ล้มเหลวด้วย `404: Not Found` ขณะที่คำสั่ง curl ไปยัง Bot API โดยตรงใช้งานได้ อาจหมายความว่า `channels.telegram.apiRoot` ถูกตั้งเป็น endpoint `/bot<TOKEN>` แบบเต็ม `apiRoot` ต้องเป็นเฉพาะ root ของ Bot API เท่านั้น และ `openclaw doctor --fix` จะลบ `/bot<TOKEN>` ท้ายค่าที่ใส่มาโดยไม่ตั้งใจ
    - `getMe returned 401` หมายถึง Telegram ปฏิเสธโทเค็นบอทที่กำหนดค่าไว้ อัปเดต `botToken`, `tokenFile` หรือ `TELEGRAM_BOT_TOKEN` ด้วยโทเค็น BotFather ปัจจุบัน OpenClaw จะหยุดก่อน polling ดังนั้นจึงไม่ถูกรายงานเป็นความล้มเหลวในการล้าง Webhook
    - `setMyCommands failed` พร้อมข้อผิดพลาด network/fetch โดยทั่วไปหมายถึง DNS/HTTPS ขาออกไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งจับคู่อุปกรณ์ (`device-pair` plugin)

    เมื่อติดตั้ง plugin `device-pair`:

    1. `/pair` สร้างโค้ดตั้งค่า
    2. วางโค้ดในแอป iOS
    3. `/pair pending` แสดงรายการคำขอที่รอดำเนินการ (รวมถึง role/scopes)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบระบุชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    โค้ดตั้งค่ามีโทเค็น bootstrap อายุสั้น การส่งมอบ bootstrap ในตัวจะคงโทเค็น node หลักไว้ที่ `scopes: []`; โทเค็นผู้ปฏิบัติงานใด ๆ ที่ส่งมอบจะถูกจำกัดอยู่ที่ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write` การตรวจสอบ scope ของ bootstrap มีคำนำหน้าตาม role ดังนั้น allowlist ของผู้ปฏิบัติงานจึงใช้ได้เฉพาะกับคำขอของผู้ปฏิบัติงานเท่านั้น role ที่ไม่ใช่ผู้ปฏิบัติงานยังคงต้องมี scopes ใต้คำนำหน้า role ของตัวเอง

    หากอุปกรณ์ลองใหม่ด้วยรายละเอียด auth ที่เปลี่ยนไป เช่น role/scopes/public key คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` ที่ต่างออกไป เรียก `/pair pending` อีกครั้งก่อนอนุมัติ

    รายละเอียดเพิ่มเติม: [การจับคู่](/th/channels/pairing#pair-via-telegram-recommended-for-ios)

  </Accordion>

  <Accordion title="Inline buttons">
    กำหนดค่า scope ของแป้นพิมพ์ inline:

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

    การ override ต่อบัญชี:

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

    `capabilities: ["inlineButtons"]` แบบเดิมจะแมปเป็น `inlineButtons: "all"`

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

    การคลิก callback จะถูกส่งต่อให้ agent เป็นข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    action ของเครื่องมือ Telegram ประกอบด้วย:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    action ของข้อความช่องทางเปิดเผย alias ที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    ตัวควบคุม gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้)

    หมายเหตุ: ปัจจุบัน `edit` และ `topic-create` เปิดใช้เป็นค่าเริ่มต้น และไม่มี toggle `channels.telegram.actions.*` แยกต่างหาก
    การส่งขณะ runtime ใช้สแนปช็อต config/secrets ที่ใช้งานอยู่ (startup/reload) ดังนั้นเส้นทาง action จะไม่ทำการ resolve SecretRef ใหม่แบบเฉพาะกิจต่อการส่งแต่ละครั้ง

    ความหมายของการลบ reaction: [/tools/reactions](/th/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram รองรับแท็ก reply threading แบบชัดเจนในเอาต์พุตที่สร้างขึ้น:

    - `[[reply_to_current]]` ตอบกลับข้อความที่เรียกใช้
    - `[[reply_to:<id>]]` ตอบกลับ ID ข้อความ Telegram ที่ระบุ

    `channels.telegram.replyToMode` ควบคุมการจัดการ:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`

    เมื่อเปิดใช้ reply threading และมีข้อความหรือคำบรรยายต้นฉบับของ Telegram พร้อมใช้งาน OpenClaw จะรวมข้อความอ้างอิง Telegram แบบเนทีฟโดยอัตโนมัติ Telegram จำกัดข้อความอ้างอิงเนทีฟไว้ที่ 1024 UTF-16 code units ดังนั้นข้อความที่ยาวกว่านั้นจะถูกอ้างอิงจากตอนต้น และ fallback เป็นการตอบกลับแบบล้วนหาก Telegram ปฏิเสธการอ้างอิง

    หมายเหตุ: `off` ปิดใช้ reply threading โดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงถูกใช้งาน

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    supergroup แบบ forum:

    - คีย์ session ของหัวข้อจะต่อท้ายด้วย `:topic:<threadId>`
    - การตอบกลับและการพิมพ์จะกำหนดเป้าหมายไปที่ thread ของหัวข้อ
    - เส้นทาง config ของหัวข้อ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของหัวข้อทั่วไป (`threadId=1`):

    - การส่งข้อความจะละเว้น `message_thread_id` (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - action การพิมพ์ยังคงรวม `message_thread_id`

    การสืบทอดของหัวข้อ: รายการหัวข้อจะสืบทอดการตั้งค่ากลุ่ม เว้นแต่จะ override (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` ใช้เฉพาะหัวข้อและไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม

    **การ routing agent ต่อหัวข้อ**: แต่ละหัวข้อสามารถ route ไปยัง agent คนละตัวได้โดยตั้งค่า `agentId` ใน config ของหัวข้อ วิธีนี้ทำให้แต่ละหัวข้อมี workspace, memory และ session ที่แยกของตัวเอง ตัวอย่าง:

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

    จากนั้นแต่ละหัวข้อจะมีคีย์ session ของตัวเอง: `agent:zu:telegram:group:-1001234567890:topic:3`

    **การผูกหัวข้อ ACP แบบคงอยู่**: หัวข้อ forum สามารถ pin session ของ ACP harness ผ่านการผูก ACP แบบ typed ระดับบนสุด (`bindings[]` พร้อม `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ id ที่ระบุหัวข้อ เช่น `-1001234567890:topic:42`) ปัจจุบันจำกัดขอบเขตไว้ที่หัวข้อ forum ในกลุ่ม/supergroup ดู [ACP Agents](/th/tools/acp-agents)

    **การ spawn ACP ที่ผูกกับ thread จากแชต**: `/acp spawn <agent> --thread here|auto` ผูกหัวข้อปัจจุบันกับ session ACP ใหม่ การติดตามผลจะ route ไปที่นั่นโดยตรง OpenClaw pin การยืนยัน spawn ในหัวข้อ ต้องให้ `channels.telegram.threadBindings.spawnSessions` ยังคงเปิดใช้ (ค่าเริ่มต้น: `true`)

    บริบทเทมเพลตเปิดเผย `MessageThreadId` และ `IsForum` แชต DM ที่มี `message_thread_id` จะคงการกำหนดเส้นทาง DM และเมตาดาต้าการตอบกลับไว้บนเซสชันแบบ flat โดยค่าเริ่มต้น และจะใช้คีย์เซสชันที่รับรู้เธรดเมื่อกำหนดค่าด้วย `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` หรือ config หัวข้อที่ตรงกันเท่านั้น ใช้ `channels.telegram.dm.threadReplies` ระดับบนสุดเป็นค่าเริ่มต้นของบัญชี หรือ `direct.<chatId>.threadReplies` สำหรับ DM หนึ่งรายการ

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยก voice note ออกจากไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมไฟล์เสียง
    - แท็ก `[[audio_as_voice]]` ในคำตอบของเอเจนต์เพื่อบังคับส่งเป็น voice note
    - ทรานสคริปต์ voice note ขาเข้าจะถูกจัดกรอบเป็นข้อความที่สร้างโดยเครื่องและไม่น่าเชื่อถือในบริบทของเอเจนต์ การตรวจจับการกล่าวถึงยังคงใช้ทรานสคริปต์ดิบ ดังนั้นข้อความเสียงที่ถูกควบคุมด้วยการกล่าวถึงยังทำงานต่อไป

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

    Telegram แยกไฟล์วิดีโอออกจาก video note

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

    Video note ไม่รองรับคำบรรยาย ข้อความที่ระบุไว้จะถูกส่งแยกต่างหาก

    ### สติกเกอร์

    การจัดการสติกเกอร์ขาเข้า:

    - WEBP แบบ static: ดาวน์โหลดและประมวลผลแล้ว (placeholder `<media:sticker>`)
    - TGS แบบ animated: ข้าม
    - WEBM แบบ video: ข้าม

    ฟิลด์บริบทสติกเกอร์:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ไฟล์แคชสติกเกอร์:

    - `~/.openclaw/telegram/sticker-cache.json`

    สติกเกอร์จะถูกอธิบายหนึ่งครั้ง (เมื่อทำได้) และถูกแคชเพื่อลดการเรียก vision ซ้ำ

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

    ส่ง sticker action:

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
    รีแอ็กชันของ Telegram เข้ามาเป็นอัปเดต `message_reaction` (แยกจาก payload ของข้อความ)

    เมื่อเปิดใช้ OpenClaw จะจัดคิวอีเวนต์ระบบ เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงรีแอ็กชันของผู้ใช้ต่อข้อความที่บอทส่งเท่านั้น (พยายามทำให้ดีที่สุดผ่านแคชข้อความที่ส่ง)
    - อีเวนต์รีแอ็กชันยังคงเคารพการควบคุมสิทธิ์เข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ให้ ID เธรดในอัปเดตรีแอ็กชัน
      - กลุ่มที่ไม่ใช่ฟอรัมจะกำหนดเส้นทางไปยังเซสชันแชตกลุ่ม
      - กลุ่มฟอรัมจะกำหนดเส้นทางไปยังเซสชันหัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อต้นทางที่แน่นอน

    `allowed_updates` สำหรับ polling/webhook จะรวม `message_reaction` โดยอัตโนมัติ

  </Accordion>

  <Accordion title="รีแอ็กชัน Ack">
    `ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback เป็นอีโมจิ identity ของเอเจนต์ (`agents.list[].identity.emoji` มิฉะนั้น "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิ unicode (เช่น "👀")
    - ใช้ `""` เพื่อปิดใช้รีแอ็กชันสำหรับช่องหรือบัญชี

  </Accordion>

  <Accordion title="การเขียน Config จากอีเวนต์และคำสั่งของ Telegram">
    การเขียน config ช่องเปิดใช้โดยค่าเริ่มต้น (`configWrites !== false`)

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

  <Accordion title="Long polling เทียบกับ webhook">
    ค่าเริ่มต้นคือ long polling สำหรับโหมด webhook ให้ตั้งค่า `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; `webhookPath`, `webhookHost`, `webhookPort` เป็นตัวเลือกเสริม (ค่าเริ่มต้น `/telegram-webhook`, `127.0.0.1`, `8787`)

    ในโหมด long-polling OpenClaw จะคง watermark การรีสตาร์ตไว้หลังจากอัปเดต dispatch สำเร็จแล้วเท่านั้น หาก handler ล้มเหลว อัปเดตนั้นจะยัง retry ได้ในโปรเซสเดิม และจะไม่ถูกเขียนว่าเสร็จสมบูรณ์สำหรับ restart dedupe

    listener ในเครื่อง bind กับ `127.0.0.1:8787` สำหรับ ingress สาธารณะ ให้ใส่ reverse proxy ไว้หน้า port ในเครื่อง หรือจงใจตั้งค่า `webhookHost: "0.0.0.0"`

    โหมด Webhook ตรวจสอบ request guard, secret token ของ Telegram และ body JSON ก่อนส่งคืน `200` ให้ Telegram
    จากนั้น OpenClaw จะประมวลผลอัปเดตแบบ async ผ่าน lane บอทแบบต่อแชต/ต่อหัวข้อเดียวกับที่ long polling ใช้ ดังนั้น turn ของเอเจนต์ที่ช้าจะไม่ค้าง delivery ACK ของ Telegram

  </Accordion>

  <Accordion title="ขีดจำกัด การลองใหม่ และเป้าหมาย CLI">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` เลือกขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนการแบ่งตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ขาเข้าและขาออก
    - `channels.telegram.mediaGroupFlushMs` (ค่าเริ่มต้น 500) ควบคุมระยะเวลาที่อัลบั้ม/กลุ่มสื่อของ Telegram จะถูก buffer ก่อน OpenClaw dispatch เป็นข้อความขาเข้าหนึ่งรายการ เพิ่มค่านี้หากส่วนต่าง ๆ ของอัลบั้มมาถึงช้า ลดค่านี้เพื่อลด latency การตอบกลับอัลบั้ม
    - `channels.telegram.timeoutSeconds` override timeout ของไคลเอนต์ Telegram API (หากไม่ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY) ไคลเอนต์บอท clamp ค่าที่กำหนดไว้ต่ำกว่า guard ของคำขอข้อความขาออก/typing 60 วินาที เพื่อให้ grammY ไม่ abort การส่งคำตอบที่มองเห็นได้ก่อน transport guard และ fallback ของ OpenClaw จะทำงานได้ Long polling ยังใช้ guard คำขอ `getUpdates` 45 วินาที เพื่อไม่ให้ idle poll ถูกปล่อยทิ้งไว้อย่างไม่มีกำหนด
    - ค่าเริ่มต้นของ `channels.telegram.pollingStallThresholdMs` คือ `120000`; ปรับระหว่าง `30000` ถึง `600000` เฉพาะสำหรับการรีสตาร์ต polling-stall ที่เป็น false positive
    - ประวัติบริบทกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` ปิดใช้
    - บริบทเสริมของ reply/quote/forward ปัจจุบันถูกส่งผ่านตามที่ได้รับ
    - allowlist ของ Telegram มีหน้าที่หลักในการควบคุมว่าใครสามารถทริกเกอร์เอเจนต์ได้ ไม่ใช่ขอบเขตการ redaction บริบทเสริมแบบเต็ม
    - การควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - config `channels.telegram.retry` ใช้กับ helper การส่งของ Telegram (CLI/tools/actions) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้ การส่ง final reply ขาเข้ายังใช้ safe-send retry แบบมีขอบเขตสำหรับความล้มเหลวก่อนเชื่อมต่อของ Telegram แต่จะไม่ retry envelope เครือข่ายหลังส่งที่คลุมเครือ ซึ่งอาจทำให้ข้อความที่มองเห็นซ้ำได้

    เป้าหมายการส่งของ CLI และ message-tool อาจเป็น ID แชตแบบตัวเลข, username หรือเป้าหมายหัวข้อฟอรัม:

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

    flag poll เฉพาะ Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` สำหรับหัวข้อฟอรัม (หรือใช้เป้าหมาย `:topic:`)

    การส่งของ Telegram ยังรองรับ:

    - `--presentation` พร้อม block `buttons` สำหรับ inline keyboard เมื่อ `channels.telegram.capabilities.inlineButtons` อนุญาต
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอการส่งแบบปักหมุดเมื่อบอทสามารถปักหมุดในแชตนั้นได้
    - `--force-document` เพื่อส่งรูปภาพขาออกและ GIF เป็นเอกสารแทนการอัปโหลดเป็นรูปภาพที่บีบอัดหรือสื่อแบบ animated

    การ gate action:

    - `channels.telegram.actions.sendMessage=false` ปิดใช้ข้อความ Telegram ขาออก รวมถึง poll
    - `channels.telegram.actions.poll=false` ปิดใช้การสร้าง poll ของ Telegram โดยยังคงเปิดใช้การส่งปกติไว้

  </Accordion>

  <Accordion title="การอนุมัติ exec ใน Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถโพสต์ prompt ในแชตหรือหัวข้อต้นทางได้เป็นตัวเลือก ผู้อนุมัติต้องเป็น ID ผู้ใช้ Telegram แบบตัวเลข

    เส้นทาง config:

    - `channels.telegram.execApprovals.enabled` (เปิดใช้อัตโนมัติเมื่อ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งคน)
    - `channels.telegram.execApprovals.approvers` (fallback ไปยัง ID เจ้าของแบบตัวเลขจาก `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` และ `defaultTo` ควบคุมว่าใครคุยกับบอทได้ และบอทส่งคำตอบปกติไปที่ใด สิ่งเหล่านี้ไม่ได้ทำให้ใครเป็นผู้อนุมัติ exec การจับคู่ DM ที่อนุมัติครั้งแรกจะ bootstrap `commands.ownerAllowFrom` เมื่อยังไม่มีเจ้าของคำสั่ง ดังนั้นการตั้งค่าแบบเจ้าของคนเดียวยังคงทำงานได้โดยไม่ต้องทำ ID ซ้ำใต้ `execApprovals.approvers`

    การส่งไปยังช่องจะแสดงข้อความคำสั่งในแชต เปิดใช้ `channel` หรือ `both` เฉพาะในกลุ่ม/หัวข้อที่เชื่อถือได้เท่านั้น เมื่อ prompt ไปถึงหัวข้อฟอรัม OpenClaw จะรักษาหัวข้อนั้นไว้สำหรับ prompt การอนุมัติและการติดตามผล การอนุมัติ exec หมดอายุหลัง 30 นาทีโดยค่าเริ่มต้น

    ปุ่มอนุมัติ inline ยังต้องให้ `channels.telegram.capabilities.inlineButtons` อนุญาตพื้นผิวเป้าหมาย (`dm`, `group` หรือ `all`) ID การอนุมัติที่ขึ้นต้นด้วย `plugin:` จะ resolve ผ่านการอนุมัติของ plugin ส่วนอื่น ๆ จะ resolve ผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## การควบคุมคำตอบข้อผิดพลาด

เมื่อเอเจนต์พบข้อผิดพลาดการส่งหรือ provider Telegram สามารถตอบกลับด้วยข้อความข้อผิดพลาดหรือระงับไว้ได้ คีย์ config สองรายการควบคุมพฤติกรรมนี้:

| คีย์                                | ค่า               | ค่าเริ่มต้น | คำอธิบาย                                                                                       |
| ----------------------------------- | ----------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`     | `reply` ส่งข้อความข้อผิดพลาดที่เป็นมิตรไปยังแชต `silent` ระงับคำตอบข้อผิดพลาดทั้งหมด |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`     | เวลาขั้นต่ำระหว่างคำตอบข้อผิดพลาดไปยังแชตเดียวกัน ป้องกันสแปมข้อผิดพลาดระหว่างเหตุขัดข้อง |

รองรับ override แบบต่อบัญชี ต่อกลุ่ม และต่อหัวข้อ (การสืบทอดเดียวกับคีย์ config อื่นของ Telegram)

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
      - BotFather: `/setprivacy` -> ปิดใช้งาน
      - จากนั้นนำบอตออกจากกลุ่มแล้วเพิ่มกลับเข้าไปใหม่
    - `openclaw channels status` จะแจ้งเตือนเมื่อการตั้งค่าคาดหวังข้อความกลุ่มที่ไม่ได้กล่าวถึง
    - `openclaw channels status --probe` สามารถตรวจสอบ ID กลุ่มแบบตัวเลขที่ระบุชัดเจนได้; wildcard `"*"` ไม่สามารถตรวจสอบการเป็นสมาชิกได้
    - การทดสอบเซสชันอย่างรวดเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอตไม่เห็นข้อความกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` ต้องระบุกลุ่มไว้ในรายการ (หรือรวม `"*"`)
    - ตรวจสอบการเป็นสมาชิกกลุ่มของบอต
    - ตรวจสอบบันทึก: `openclaw logs --follow` เพื่อดูเหตุผลที่ข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานบางส่วนหรือไม่ทำงานเลย">

    - อนุญาตตัวตนผู้ส่งของคุณ (การจับคู่และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังคงมีผลแม้นโยบายกลุ่มจะเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนูเนทีฟมีรายการมากเกินไป; ลดคำสั่ง Plugin/Skills/กำหนดเอง หรือปิดใช้งานเมนูเนทีฟ
    - การเรียกตอนเริ่มต้น `deleteMyCommands` / `setMyCommands` และการเรียกพิมพ์ `sendChatAction` ถูกจำกัดขอบเขตและลองใหม่หนึ่งครั้งผ่านทางเลือกสำรองของทรานสปอร์ต Telegram เมื่อคำขอหมดเวลา ข้อผิดพลาดเครือข่าย/การดึงข้อมูลที่เกิดซ้ำมักบ่งชี้ปัญหาการเข้าถึง DNS/HTTPS ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="รายงานตอนเริ่มต้นว่าโทเค็นไม่ได้รับอนุญาต">

    - `getMe returned 401` คือความล้มเหลวในการยืนยันตัวตนของ Telegram สำหรับโทเค็นบอตที่ตั้งค่าไว้
    - คัดลอกใหม่หรือสร้างโทเค็นบอตใหม่ใน BotFather จากนั้นอัปเดต `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` หรือ `TELEGRAM_BOT_TOKEN` สำหรับบัญชีเริ่มต้น
    - `deleteWebhook 401 Unauthorized` ระหว่างเริ่มต้นก็เป็นความล้มเหลวด้านการยืนยันตัวตนเช่นกัน; การปฏิบัติต่อกรณีนี้เป็น "ไม่มี Webhook อยู่" จะเพียงเลื่อนความล้มเหลวจากโทเค็นที่ไม่ถูกต้องเดิมไปยังการเรียก API ภายหลังเท่านั้น

  </Accordion>

  <Accordion title="การโพลหรือเครือข่ายไม่เสถียร">

    - Node 22+ + fetch/proxy แบบกำหนดเองอาจทำให้เกิดพฤติกรรม abort ทันทีหากชนิด AbortSignal ไม่ตรงกัน
    - โฮสต์บางแห่ง resolve `api.telegram.org` เป็น IPv6 ก่อน; การออก IPv6 ที่เสียอาจทำให้ Telegram API ล้มเหลวเป็นครั้งคราว
    - หากบันทึกมี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!` ตอนนี้ OpenClaw จะลองใหม่โดยถือว่าเป็นข้อผิดพลาดเครือข่ายที่กู้คืนได้
    - ระหว่างการเริ่มต้นการโพล OpenClaw จะใช้ probe `getMe` ตอนเริ่มต้นที่สำเร็จซ้ำสำหรับ grammY เพื่อให้ runner ไม่ต้องใช้ `getMe` ครั้งที่สองก่อน `getUpdates` ครั้งแรก
    - หาก `deleteWebhook` ล้มเหลวด้วยข้อผิดพลาดเครือข่ายชั่วคราวระหว่างการเริ่มต้นการโพล OpenClaw จะเข้าสู่ long polling ต่อแทนการเรียก control-plane ก่อนโพลอีกครั้ง Webhook ที่ยังทำงานอยู่จะแสดงเป็นข้อขัดแย้งของ `getUpdates`; จากนั้น OpenClaw จะสร้างทรานสปอร์ต Telegram ใหม่และลองล้าง Webhook อีกครั้ง
    - หากซ็อกเก็ต Telegram ถูกรีไซเคิลตามรอบคงที่สั้น ๆ ให้ตรวจสอบว่า `channels.telegram.timeoutSeconds` ต่ำหรือไม่; ไคลเอนต์บอตจะ clamp ค่าที่ตั้งไว้ต่ำกว่า outbound และ guard ของคำขอ `getUpdates` แต่รุ่นเก่าอาจ abort ทุกการโพลหรือทุกการตอบกลับเมื่อค่านี้ตั้งต่ำกว่า guard เหล่านั้น
    - หากบันทึกมี `Polling stall detected` โดยค่าเริ่มต้น OpenClaw จะเริ่มการโพลใหม่และสร้างทรานสปอร์ต Telegram ใหม่หลังจากไม่มี liveness ของ long-poll ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาที
    - `openclaw channels status --probe` และ `openclaw doctor` จะแจ้งเตือนเมื่อบัญชีโพลที่กำลังทำงานยังไม่เสร็จสิ้น `getUpdates` หลังช่วงผ่อนผันตอนเริ่มต้น, เมื่อบัญชี Webhook ที่กำลังทำงานยังไม่เสร็จสิ้น `setWebhook` หลังช่วงผ่อนผันตอนเริ่มต้น, หรือเมื่อกิจกรรมทรานสปอร์ตการโพลที่สำเร็จล่าสุดล้าสมัย
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่ใช้เวลานานยังปกติ แต่โฮสต์ของคุณยังรายงานการรีสตาร์ท polling-stall ผิดพลาด การค้างที่เกิดซ้ำมักชี้ไปที่ปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่างโฮสต์กับ `api.telegram.org`
    - Telegram ยังเคารพ env proxy ของโปรเซสสำหรับทรานสปอร์ต Bot API รวมถึง `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และตัวแปรตัวพิมพ์เล็กของตัวแปรเหล่านั้น `NO_PROXY` / `no_proxy` ยังสามารถข้าม `api.telegram.org` ได้
    - หากตั้งค่า proxy ที่ OpenClaw จัดการผ่าน `OPENCLAW_PROXY_URL` สำหรับสภาพแวดล้อมบริการ และไม่มี env proxy มาตรฐาน Telegram จะใช้ URL นั้นสำหรับทรานสปอร์ต Bot API ด้วย
    - บนโฮสต์ VPS ที่ direct egress/TLS ไม่เสถียร ให้ส่งการเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ ตั้งค่าเริ่มต้นเป็น `autoSelectFamily=true` (ยกเว้น WSL2) ลำดับผลลัพธ์ DNS ของ Telegram จะเคารพ `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER` จากนั้น `channels.telegram.network.dnsResultOrder` จากนั้นค่าเริ่มต้นของโปรเซส เช่น `NODE_OPTIONS=--dns-result-order=ipv4first`; หากไม่มีค่าใดใช้ได้ Node 22+ จะ fallback เป็น `ipv4first`
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนด้วยพฤติกรรม IPv4-only ให้บังคับการเลือก family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบช่วง benchmark ตาม RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาต
      สำหรับการดาวน์โหลดสื่อ Telegram ตามค่าเริ่มต้นอยู่แล้ว หาก fake-IP ที่เชื่อถือได้หรือ
      proxy แบบโปร่งใส rewrite `api.telegram.org` เป็นที่อยู่
      private/internal/special-use อื่นระหว่างการดาวน์โหลดสื่อ คุณสามารถเลือกใช้
      การ bypass เฉพาะ Telegram ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - การเลือกใช้งานเดียวกันมีให้ต่อบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หาก proxy ของคุณ resolve โฮสต์สื่อ Telegram เป็น `198.18.x.x` ให้ปิด
      แฟล็กอันตรายไว้ก่อน สื่อ Telegram อนุญาตช่วง benchmark ตาม RFC 2544
      ตามค่าเริ่มต้นอยู่แล้ว

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` ทำให้การป้องกัน SSRF
      ของสื่อ Telegram อ่อนลง ใช้เฉพาะกับสภาพแวดล้อม proxy ที่ควบคุมโดยผู้ปฏิบัติงานและเชื่อถือได้
      เช่น Clash, Mihomo หรือการกำหนดเส้นทาง fake-IP ของ Surge เมื่อสิ่งเหล่านี้
      สังเคราะห์คำตอบ private หรือ special-use นอกช่วง benchmark ตาม RFC 2544
      ปิดไว้สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ
    </Warning>

    - การ override ผ่านสภาพแวดล้อม (ชั่วคราว):
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

## ข้อมูลอ้างอิงการตั้งค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการตั้งค่า - Telegram](/th/gateway/config-channels#telegram)

<Accordion title="ฟิลด์ Telegram ที่ให้สัญญาณชัดเจน">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; symlink จะถูกปฏิเสธ)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- การอนุมัติ exec: `execApprovals`, `accounts.*.execApprovals`
- คำสั่ง/เมนู: `commands.native`, `commands.nativeSkills`, `customCommands`
- เธรด/การตอบกลับ: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- การสตรีม: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- การจัดรูปแบบ/การส่งมอบ: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- สื่อ/เครือข่าย: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- ราก API แบบกำหนดเอง: `apiRoot` (ราก Bot API เท่านั้น; อย่าใส่ `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- การกระทำ/ความสามารถ: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions: `reactionNotifications`, `reactionLevel`
- ข้อผิดพลาด: `errorPolicy`, `errorCooldownMs`
- การเขียน/ประวัติ: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญของหลายบัญชี: เมื่อมีการตั้งค่า ID บัญชีสองรายการขึ้นไป ให้ตั้ง `channels.telegram.defaultAccount` (หรือรวม `channels.telegram.accounts.default`) เพื่อทำให้การกำหนดเส้นทางเริ่มต้นชัดเจน มิฉะนั้น OpenClaw จะ fallback ไปยัง ID บัญชีตัวแรกที่ normalize แล้ว และ `openclaw doctor` จะแจ้งเตือน บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom` แต่ไม่สืบทอดค่า `accounts.default.*`
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Telegram กับ Gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรม allowlist ของกลุ่มและหัวข้อ
  </Card>
  <Card title="การกำหนดเส้นทางช่องทาง" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยัง agent
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเพิ่มความแข็งแกร่ง
  </Card>
  <Card title="การกำหนดเส้นทางหลาย agent" icon="sitemap" href="/th/concepts/multi-agent">
    จับคู่กลุ่มและหัวข้อกับ agent
  </Card>
  <Card title="การแก้ไขปัญหา" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทาง
  </Card>
</CardGroup>
