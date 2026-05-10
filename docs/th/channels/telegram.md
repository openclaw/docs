---
read_when:
    - การทำงานเกี่ยวกับฟีเจอร์ของ Telegram หรือ Webhook
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าบอต Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-10T19:24:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 87fc2994ced5e3c845b35f8c134ca04de317e83c3c2414de2dea4779a763f17e
    source_path: channels/telegram.md
    workflow: 16
---

พร้อมใช้งานระดับโปรดักชันสำหรับ DM ของบอตและกลุ่มผ่าน grammY โหมดเริ่มต้นคือ long polling; โหมด webhook เป็นทางเลือก

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
  <Step title="สร้างโทเค็นบอตใน BotFather">
    เปิด Telegram แล้วแชตกับ **@BotFather** (ยืนยันว่า handle คือ `@BotFather` ตรงกันทุกตัว)

    รัน `/newbot` ทำตามพรอมป์ และบันทึกโทเค็น

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

    ค่าสำรองจาก env: `TELEGRAM_BOT_TOKEN=...` (เฉพาะบัญชีเริ่มต้น)
    Telegram **ไม่** ใช้ `openclaw channels login telegram`; ให้กำหนดค่าโทเค็นใน config/env แล้วเริ่ม gateway

  </Step>

  <Step title="เริ่ม Gateway และอนุมัติ DM แรก">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    รหัสจับคู่หมดอายุหลังจาก 1 ชั่วโมง

  </Step>

  <Step title="เพิ่มบอตลงในกลุ่ม">
    เพิ่มบอตลงในกลุ่มของคุณ จากนั้นตั้งค่า `channels.telegram.groups` และ `groupPolicy` ให้ตรงกับโมเดลการเข้าถึงของคุณ
  </Step>
</Steps>

<Note>
ลำดับการ resolve โทเค็นรับรู้ตามบัญชี ในทางปฏิบัติ ค่าจาก config จะชนะค่าสำรองจาก env และ `TELEGRAM_BOT_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="โหมดความเป็นส่วนตัวและการมองเห็นในกลุ่ม">
    บอต Telegram มีค่าเริ่มต้นเป็น **Privacy Mode** ซึ่งจำกัดข้อความในกลุ่มที่บอตได้รับ

    หากบอตต้องเห็นข้อความทั้งหมดในกลุ่ม ให้ทำอย่างใดอย่างหนึ่ง:

    - ปิดโหมดความเป็นส่วนตัวผ่าน `/setprivacy` หรือ
    - ตั้งบอตเป็นผู้ดูแลกลุ่ม

    เมื่อสลับโหมดความเป็นส่วนตัว ให้ลบและเพิ่มบอตกลับเข้าไปในแต่ละกลุ่มเพื่อให้ Telegram นำการเปลี่ยนแปลงไปใช้

  </Accordion>

  <Accordion title="สิทธิ์ของกลุ่ม">
    สถานะผู้ดูแลถูกควบคุมในการตั้งค่ากลุ่ม Telegram

    บอตที่เป็นผู้ดูแลจะได้รับข้อความทั้งหมดในกลุ่ม ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มที่เปิดทำงานตลอดเวลา

  </Accordion>

  <Accordion title="ตัวเลือก BotFather ที่มีประโยชน์">

    - `/setjoingroups` เพื่ออนุญาต/ปฏิเสธการเพิ่มเข้ากลุ่ม
    - `/setprivacy` สำหรับพฤติกรรมการมองเห็นในกลุ่ม

  </Accordion>
</AccordionGroup>

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.telegram.dmPolicy` ควบคุมการเข้าถึงข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist` (ต้องมี sender ID อย่างน้อยหนึ่งรายการใน `allowFrom`)
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    `dmPolicy: "open"` พร้อม `allowFrom: ["*"]` ทำให้บัญชี Telegram ใดๆ ที่พบหรือเดาชื่อผู้ใช้ของบอตได้สามารถสั่งงานบอตได้ ใช้เฉพาะกับบอตสาธารณะที่ตั้งใจเปิดจริงและมีเครื่องมือที่จำกัดอย่างเข้มงวดเท่านั้น; บอตเจ้าของคนเดียวควรใช้ `allowlist` พร้อม ID ผู้ใช้แบบตัวเลข

    `channels.telegram.allowFrom` รับ ID ผู้ใช้ Telegram แบบตัวเลข คำนำหน้า `telegram:` / `tg:` ได้รับการยอมรับและ normalize
    ใน config หลายบัญชี `channels.telegram.allowFrom` ระดับบนสุดที่เข้มงวดจะถูกปฏิบัติเป็นขอบเขตความปลอดภัย: รายการ `allowFrom: ["*"]` ระดับบัญชีจะไม่ทำให้บัญชีนั้นเป็นสาธารณะ เว้นแต่ allowlist ที่มีผลของบัญชียังคงมี wildcard แบบชัดเจนหลังจาก merge
    `dmPolicy: "allowlist"` พร้อม `allowFrom` ว่างจะบล็อก DM ทั้งหมดและถูกปฏิเสธโดยการตรวจสอบ config
    การตั้งค่าจะขอเฉพาะ ID ผู้ใช้แบบตัวเลข
    หากคุณอัปเกรดแล้ว config ของคุณมีรายการ allowlist แบบ `@username` ให้รัน `openclaw doctor --fix` เพื่อ resolve รายการเหล่านั้น (ทำแบบ best-effort; ต้องใช้โทเค็นบอต Telegram)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์ allowlist ใน pairing-store, `openclaw doctor --fix` สามารถกู้คืนรายการเข้าไปยัง `channels.telegram.allowFrom` ใน flow แบบ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID ที่ระบุชัดเจน)

    สำหรับบอตเจ้าของคนเดียว ให้เลือก `dmPolicy: "allowlist"` พร้อม ID `allowFrom` แบบตัวเลขที่ระบุชัดเจน เพื่อให้นโยบายการเข้าถึงคงทนอยู่ใน config (แทนการพึ่งพาการอนุมัติการจับคู่ก่อนหน้า)

    ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่ได้หมายความว่า "ผู้ส่งนี้ได้รับอนุญาตทุกที่"
    การจับคู่ให้สิทธิ์การเข้าถึง DM หากยังไม่มีเจ้าของคำสั่ง การจับคู่ที่อนุมัติครั้งแรกจะตั้งค่า `commands.ownerAllowFrom` ด้วย เพื่อให้คำสั่งเฉพาะเจ้าของและการอนุมัติ exec มีบัญชีผู้ปฏิบัติงานที่ระบุชัดเจน
    การอนุญาตผู้ส่งในกลุ่มยังคงมาจาก allowlist ใน config ที่ระบุชัดเจน
    หากคุณต้องการ "ฉันได้รับอนุญาตครั้งเดียว แล้วทั้ง DM และคำสั่งกลุ่มใช้งานได้" ให้ใส่ ID ผู้ใช้ Telegram แบบตัวเลขของคุณใน `channels.telegram.allowFrom`; สำหรับคำสั่งเฉพาะเจ้าของ ตรวจสอบให้แน่ใจว่า `commands.ownerAllowFrom` มี `telegram:<your user id>`

    ### การหา ID ผู้ใช้ Telegram ของคุณ

    วิธีที่ปลอดภัยกว่า (ไม่มีบอตบุคคลที่สาม):

    1. ส่ง DM ไปยังบอตของคุณ
    2. รัน `openclaw logs --follow`
    3. อ่าน `from.id`

    วิธีทางการของ Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีของบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="นโยบายกลุ่มและ allowlist">
    มีตัวควบคุมสองรายการที่ใช้ร่วมกัน:

    1. **กลุ่มใดได้รับอนุญาต** (`channels.telegram.groups`)
       - ไม่มี config `groups`:
         - พร้อม `groupPolicy: "open"`: กลุ่มใดก็ผ่านการตรวจสอบ group-ID ได้
         - พร้อม `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการ `groups` (หรือ `"*"`)
       - กำหนดค่า `groups` แล้ว: ทำหน้าที่เป็น allowlist (ID ที่ระบุชัดเจนหรือ `"*"`)

    2. **ผู้ส่งใดได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่า Telegram จะ fallback ไปยัง `allowFrom`
    รายการ `groupAllowFrom` ควรเป็น ID ผู้ใช้ Telegram แบบตัวเลข (คำนำหน้า `telegram:` / `tg:` จะถูก normalize)
    อย่าใส่ ID แชตกลุ่มหรือ supergroup ของ Telegram ใน `groupAllowFrom` ID แชตที่เป็นค่าลบอยู่ใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเว้นสำหรับการอนุญาตผู้ส่ง
    ขอบเขตความปลอดภัย (`2026.2.25+`): auth ผู้ส่งในกลุ่ม **ไม่** inherit การอนุมัติจาก DM pairing-store
    การจับคู่ยังคงเป็นเฉพาะ DM สำหรับกลุ่ม ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` แบบรายกลุ่ม/รายหัวข้อ
    หากไม่ได้ตั้งค่า `groupAllowFrom`, Telegram จะ fallback ไปยัง config `allowFrom` ไม่ใช่ pairing store
    รูปแบบใช้งานจริงสำหรับบอตเจ้าของคนเดียว: ตั้งค่า ID ผู้ใช้ของคุณใน `channels.telegram.allowFrom`, ปล่อย `groupAllowFrom` ว่างไว้ และอนุญาตกลุ่มเป้าหมายใต้ `channels.telegram.groups`
    หมายเหตุ runtime: หาก `channels.telegram` หายไปทั้งหมด runtime จะใช้ค่าเริ่มต้นแบบ fail-closed `groupPolicy="allowlist"` เว้นแต่จะตั้งค่า `channels.defaults.groupPolicy` ไว้อย่างชัดเจน

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

      - ใส่ ID แชตกลุ่มหรือ supergroup ของ Telegram ที่เป็นค่าลบ เช่น `-1001234567890` ใต้ `channels.telegram.groups`
      - ใส่ ID ผู้ใช้ Telegram เช่น `8734062810` ใต้ `groupAllowFrom` เมื่อต้องการจำกัดว่าคนใดภายในกลุ่มที่ได้รับอนุญาตสามารถเรียกใช้บอตได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อต้องการให้สมาชิกคนใดก็ได้ของกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอตได้

    </Warning>

  </Tab>

  <Tab title="พฤติกรรมการ mention">
    การตอบกลับในกลุ่มต้องมีการ mention โดยค่าเริ่มต้น

    การ mention มาจาก:

    - mention แบบ native `@botusername` หรือ
    - รูปแบบ mention ใน:
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

    การหา ID แชตกลุ่ม:

    - forward ข้อความกลุ่มไปยัง `@userinfobot` / `@getidsbot`
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจสอบ Bot API `getUpdates`

  </Tab>
</Tabs>

## พฤติกรรม runtime

- Telegram เป็นของกระบวนการ Gateway
- การกำหนดเส้นทางเป็นแบบ deterministic: ข้อความขาเข้าจาก Telegram จะตอบกลับไปยัง Telegram (โมเดลไม่ได้เลือกช่องทาง)
- ข้อความขาเข้าจะถูก normalize เป็น envelope ช่องทางร่วมพร้อม metadata การตอบกลับ, placeholder สื่อ และ context reply-chain ที่บันทึกไว้สำหรับการตอบกลับ Telegram ที่ Gateway เคยสังเกตเห็น
- เซสชันกลุ่มถูกแยกตาม ID กลุ่ม หัวข้อ forum จะต่อท้าย `:topic:<threadId>` เพื่อแยกหัวข้อออกจากกัน
- ข้อความ DM อาจมี `message_thread_id`; OpenClaw จะเก็บรักษา ID เธรดไว้สำหรับการตอบกลับ แต่คง DM ไว้บนเซสชันแบบ flat โดยค่าเริ่มต้น กำหนดค่า `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` หรือ config หัวข้อที่ตรงกัน เมื่อคุณตั้งใจต้องการแยกเซสชันหัวข้อ DM
- Long polling ใช้ grammY runner พร้อมการจัดลำดับแบบ per-chat/per-thread concurrency โดยรวมของ runner sink ใช้ `agents.defaults.maxConcurrent`
- Long polling ถูกป้องกันภายในแต่ละกระบวนการ Gateway เพื่อให้มี poller ที่ทำงานอยู่เพียงตัวเดียวใช้โทเค็นบอตได้ในแต่ละครั้ง หากคุณยังเห็นข้อขัดแย้ง `getUpdates` 409 อาจมี Gateway ของ OpenClaw อื่น, สคริปต์ หรือ poller ภายนอกกำลังใช้โทเค็นเดียวกันอยู่
- การรีสตาร์ท watchdog ของ long-polling จะ trigger หลังจาก 120 วินาทีโดยค่าเริ่มต้น หากไม่มี liveness ของ `getUpdates` ที่เสร็จสมบูรณ์ เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อ deployment ของคุณยังเห็นการรีสตาร์ทจาก polling-stall แบบ false ระหว่างงานที่รันนาน ค่าอยู่ในหน่วยมิลลิวินาทีและอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับ override แบบรายบัญชี
- Telegram Bot API ไม่มีการรองรับ read-receipt (`sendReadReceipts` ไม่มีผล)

## อ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="พรีวิวสตรีมสด (แก้ไขข้อความ)">
    OpenClaw สามารถสตรีมคำตอบบางส่วนแบบเรียลไทม์:

    - แชตโดยตรง: ข้อความพรีวิว + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความพรีวิว + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` คือ `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - `progress` เก็บ draft สถานะที่แก้ไขได้หนึ่งรายการสำหรับความคืบหน้าของเครื่องมือ ล้างเมื่อเสร็จสิ้น และส่งคำตอบสุดท้ายเป็นข้อความปกติ
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความพรีวิวที่แก้ไขเดิมซ้ำหรือไม่ (ค่าเริ่มต้น: `true` เมื่อ preview streaming ทำงานอยู่)
    - `streaming.preview.commandText` ควบคุมรายละเอียด command/exec ภายในบรรทัด tool-progress เหล่านั้น: `raw` (ค่าเริ่มต้น, รักษาพฤติกรรมที่ release แล้ว) หรือ `status` (เฉพาะ label ของเครื่องมือ)
    - legacy `channels.telegram.streamMode` และค่า boolean `streaming` จะถูกตรวจพบ; รัน `openclaw doctor --fix` เพื่อ migrate ไปยัง `channels.telegram.streaming.mode`

    การอัปเดตพรีวิว tool-progress คือบรรทัดสถานะสั้นๆ ที่แสดงระหว่างเครื่องมือกำลังทำงาน เช่น การรันคำสั่ง การอ่านไฟล์ การอัปเดตการวางแผน หรือสรุป patch Telegram เปิดใช้สิ่งเหล่านี้ไว้โดยค่าเริ่มต้นเพื่อให้ตรงกับพฤติกรรม OpenClaw ที่ release แล้วตั้งแต่ `v2026.4.22` ขึ้นไป หากต้องการคงพรีวิวที่แก้ไขได้สำหรับข้อความคำตอบ แต่ซ่อนบรรทัด tool-progress ให้ตั้งค่า:

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

    หากต้องการให้ความคืบหน้าของเครื่องมือยังมองเห็นได้ แต่ซ่อนข้อความคำสั่ง/การรัน ให้ตั้งค่า:

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

    ใช้โหมด `progress` เมื่อต้องการให้เห็นความคืบหน้าของเครื่องมือโดยไม่แก้ไขคำตอบสุดท้ายลงในข้อความเดียวกันนั้น ใส่นโยบายข้อความคำสั่งไว้ใต้ `streaming.progress`:

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

    ใช้ `streaming.mode: "off"` เฉพาะเมื่อต้องการส่งเฉพาะผลลัพธ์สุดท้าย: การแก้ไขตัวอย่างข้อความของ Telegram จะถูกปิด และข้อความเครื่องมือ/ความคืบหน้าทั่วไปจะถูกระงับแทนที่จะส่งเป็นข้อความสถานะแยกต่างหาก พรอมป์การอนุมัติ เพย์โหลดสื่อ และข้อผิดพลาดยังคงถูกส่งผ่านการส่งผลลัพธ์สุดท้ายตามปกติ ใช้ `streaming.preview.toolProgress: false` เมื่อคุณต้องการคงเฉพาะการแก้ไขตัวอย่างคำตอบไว้ แต่ซ่อนบรรทัดสถานะความคืบหน้าของเครื่องมือ

    <Note>
      การตอบกลับแบบอ้างคำพูดที่เลือกของ Telegram เป็นข้อยกเว้น เมื่อ `replyToMode` เป็น `"first"`, `"all"` หรือ `"batched"` และข้อความขาเข้ามีข้อความอ้างคำพูดที่เลือกไว้ OpenClaw จะส่งคำตอบสุดท้ายผ่านเส้นทางการตอบกลับแบบอ้างคำพูดดั้งเดิมของ Telegram แทนการแก้ไขตัวอย่างคำตอบ ดังนั้น `streaming.preview.toolProgress` จึงไม่สามารถแสดงบรรทัดสถานะสั้น ๆ สำหรับรอบนั้นได้ การตอบกลับข้อความปัจจุบันที่ไม่มีข้อความอ้างคำพูดที่เลือกไว้ยังคงใช้การสตรีมตัวอย่าง ตั้งค่า `replyToMode: "off"` เมื่อการมองเห็นความคืบหน้าของเครื่องมือสำคัญกว่าการตอบกลับแบบอ้างคำพูดดั้งเดิม หรือตั้งค่า `streaming.preview.toolProgress: false` เพื่อยอมรับข้อแลกเปลี่ยนนี้
    </Note>

    สำหรับการตอบกลับแบบข้อความเท่านั้น:

    - ตัวอย่างสั้น ๆ ใน DM/กลุ่ม/หัวข้อ: OpenClaw จะเก็บข้อความตัวอย่างเดิมไว้และแก้ไขเป็นผลลัพธ์สุดท้ายในที่เดิม
    - ผลลัพธ์ข้อความยาวที่แยกเป็นหลายข้อความ Telegram จะใช้ตัวอย่างที่มีอยู่เป็นส่วนแรกของผลลัพธ์สุดท้ายเมื่อทำได้ จากนั้นส่งเฉพาะส่วนที่เหลือ
    - ผลลัพธ์สุดท้ายในโหมดความคืบหน้าจะล้างร่างสถานะและใช้การส่งผลลัพธ์สุดท้ายตามปกติแทนการแก้ไขร่างให้เป็นคำตอบ
    - หากการแก้ไขผลลัพธ์สุดท้ายล้มเหลวก่อนยืนยันข้อความที่เสร็จสมบูรณ์ OpenClaw จะใช้การส่งผลลัพธ์สุดท้ายตามปกติและล้างตัวอย่างที่ค้างอยู่

    สำหรับการตอบกลับที่ซับซ้อน (เช่น เพย์โหลดสื่อ) OpenClaw จะย้อนกลับไปใช้การส่งผลลัพธ์สุดท้ายตามปกติ แล้วล้างข้อความตัวอย่าง

    การสตรีมตัวอย่างแยกจากการสตรีมบล็อก เมื่อเปิดใช้งานการสตรีมบล็อกสำหรับ Telegram อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำ

    สตรีมเหตุผลเฉพาะ Telegram:

    - `/reasoning stream` ส่งเหตุผลไปยังตัวอย่างสดระหว่างการสร้าง
    - ตัวอย่างเหตุผลจะถูกลบหลังส่งผลลัพธ์สุดท้าย; ใช้ `/reasoning on` เมื่อต้องการให้เหตุผลยังคงมองเห็นได้
    - คำตอบสุดท้ายจะถูกส่งโดยไม่มีข้อความเหตุผล

  </Accordion>

  <Accordion title="การจัดรูปแบบและการถอยกลับเป็น HTML">
    ข้อความขาออกใช้ Telegram `parse_mode: "HTML"`

    - ข้อความแบบคล้าย Markdown จะถูกเรนเดอร์เป็น HTML ที่ปลอดภัยสำหรับ Telegram
    - HTML ดิบจากโมเดลจะถูก escape เพื่อลดความล้มเหลวในการแยกวิเคราะห์ของ Telegram
    - หาก Telegram ปฏิเสธ HTML ที่แยกวิเคราะห์แล้ว OpenClaw จะลองใหม่เป็นข้อความธรรมดา

    ตัวอย่างลิงก์เปิดใช้งานตามค่าเริ่มต้น และสามารถปิดได้ด้วย `channels.telegram.linkPreview: false`

  </Accordion>

  <Accordion title="คำสั่งดั้งเดิมและคำสั่งกำหนดเอง">
    การลงทะเบียนเมนูคำสั่งของ Telegram จัดการตอนเริ่มต้นด้วย `setMyCommands`

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

    - ชื่อจะถูกทำให้เป็นรูปแบบมาตรฐาน (ตัด `/` นำหน้าออก, แปลงเป็นตัวพิมพ์เล็ก)
    - รูปแบบที่ถูกต้อง: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งกำหนดเองไม่สามารถแทนที่คำสั่งดั้งเดิมได้
    - รายการที่ขัดแย้ง/ซ้ำกันจะถูกข้ามและบันทึกลงล็อก

    หมายเหตุ:

    - คำสั่งกำหนดเองเป็นเพียงรายการเมนูเท่านั้น; ไม่ได้นำพฤติกรรมไปใช้งานโดยอัตโนมัติ
    - คำสั่ง Plugin/skill ยังทำงานได้เมื่อพิมพ์ แม้จะไม่แสดงในเมนู Telegram

    หากปิดใช้งานคำสั่งดั้งเดิม คำสั่งในตัวจะถูกนำออก คำสั่งกำหนดเอง/Plugin อาจยังลงทะเบียนได้หากกำหนดค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังล้นหลังจากตัดรายการแล้ว; ลดคำสั่ง Plugin/skill/กำหนดเอง หรือปิดใช้งาน `channels.telegram.commands.native`
    - `deleteWebhook`, `deleteMyCommands` หรือ `setMyCommands` ล้มเหลวพร้อม `404: Not Found` ขณะที่คำสั่ง curl ของ Bot API โดยตรงทำงานได้ อาจหมายความว่า `channels.telegram.apiRoot` ถูกตั้งเป็นเอนด์พอยต์ `/bot<TOKEN>` แบบเต็ม `apiRoot` ต้องเป็นเพียงรากของ Bot API เท่านั้น และ `openclaw doctor --fix` จะลบ `/bot<TOKEN>` ท้ายค่าที่เผลอใส่ไว้
    - `getMe returned 401` หมายความว่า Telegram ปฏิเสธโทเคนบ็อตที่กำหนดค่าไว้ อัปเดต `botToken`, `tokenFile` หรือ `TELEGRAM_BOT_TOKEN` ด้วยโทเคน BotFather ปัจจุบัน; OpenClaw จะหยุดก่อนการ polling ดังนั้นกรณีนี้จะไม่ถูกรายงานเป็นความล้มเหลวในการล้าง Webhook
    - `setMyCommands failed` พร้อมข้อผิดพลาดเครือข่าย/fetch โดยทั่วไปหมายความว่า DNS/HTTPS ขาออกไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งจับคู่อุปกรณ์ (Plugin `device-pair`)

    เมื่อติดตั้ง Plugin `device-pair`:

    1. `/pair` สร้างโค้ดตั้งค่า
    2. วางโค้ดในแอป iOS
    3. `/pair pending` แสดงคำขอที่รอดำเนินการ (รวมถึง role/scopes)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบระบุชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    โค้ดตั้งค่าพกโทเคน bootstrap ที่มีอายุสั้น การส่งต่อ bootstrap ในตัวจะคงโทเคนโหนดหลักไว้ที่ `scopes: []`; โทเคนผู้ปฏิบัติการที่ถูกส่งต่อจะถูกจำกัดอยู่ที่ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write` การตรวจสอบขอบเขต bootstrap มีคำนำหน้าตามบทบาท ดังนั้น allowlist ของผู้ปฏิบัติการนั้นจะตอบสนองเฉพาะคำขอของผู้ปฏิบัติการเท่านั้น; บทบาทที่ไม่ใช่ผู้ปฏิบัติการยังต้องมีขอบเขตภายใต้คำนำหน้าบทบาทของตัวเอง

    หากอุปกรณ์ลองใหม่พร้อมรายละเอียดการรับรองความถูกต้องที่เปลี่ยนไป (เช่น role/scopes/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` อื่น ให้รัน `/pair pending` อีกครั้งก่อนอนุมัติ

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

    ขอบเขต:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (ค่าเริ่มต้น)

    `capabilities: ["inlineButtons"]` แบบเดิมจะแมปเป็น `inlineButtons: "all"`

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

    การคลิก callback จะถูกส่งต่อไปยัง agent เป็นข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="การกระทำกับข้อความ Telegram สำหรับ agent และระบบอัตโนมัติ">
    การกระทำของเครื่องมือ Telegram ประกอบด้วย:

    - `sendMessage` (`to`, `content`, ตัวเลือก `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, ตัวเลือก `iconColor`, `iconCustomEmojiId`)

    การกระทำกับข้อความของช่องทางเปิดเผยนามแฝงที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    ตัวควบคุมการ gate:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้งาน)

    หมายเหตุ: ปัจจุบัน `edit` และ `topic-create` เปิดใช้งานตามค่าเริ่มต้น และไม่มี toggle `channels.telegram.actions.*` แยกต่างหาก
    การส่งตอนรันไทม์ใช้ snapshot การกำหนดค่า/ความลับที่ใช้งานอยู่ (startup/reload) ดังนั้นเส้นทางการกระทำจะไม่ resolve `SecretRef` ซ้ำแบบเฉพาะกิจต่อการส่งแต่ละครั้ง

    ความหมายของการนำ reaction ออก: [/tools/reactions](/th/tools/reactions)

  </Accordion>

  <Accordion title="แท็กเธรดการตอบกลับ">
    Telegram รองรับแท็กเธรดการตอบกลับแบบชัดเจนในเอาต์พุตที่สร้างขึ้น:

    - `[[reply_to_current]]` ตอบกลับข้อความที่ทริกเกอร์
    - `[[reply_to:<id>]]` ตอบกลับ ID ข้อความ Telegram ที่ระบุ

    `channels.telegram.replyToMode` ควบคุมการจัดการ:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`

    เมื่อเปิดใช้งานเธรดการตอบกลับและมีข้อความหรือคำบรรยาย Telegram ต้นฉบับ OpenClaw จะรวมข้อความอ้างคำพูดแบบดั้งเดิมของ Telegram โดยอัตโนมัติ Telegram จำกัดข้อความอ้างคำพูดดั้งเดิมไว้ที่ 1024 หน่วยรหัส UTF-16 ดังนั้นข้อความที่ยาวกว่าจะถูกอ้างจากจุดเริ่มต้นและถอยกลับเป็นการตอบกลับแบบธรรมดาหาก Telegram ปฏิเสธข้อความอ้างคำพูด

    หมายเหตุ: `off` ปิดใช้งานเธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงถูกใช้งาน

  </Accordion>

  <Accordion title="หัวข้อฟอรัมและพฤติกรรมของเธรด">
    supergroup แบบฟอรัม:

    - คีย์เซสชันของหัวข้อจะต่อท้าย `:topic:<threadId>`
    - การตอบกลับและการพิมพ์จะมุ่งไปยังเธรดของหัวข้อ
    - เส้นทางการกำหนดค่าหัวข้อ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของหัวข้อทั่วไป (`threadId=1`):

    - การส่งข้อความจะละ `message_thread_id` (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - การกระทำการพิมพ์ยังคงรวม `message_thread_id`

    การสืบทอดของหัวข้อ: รายการหัวข้อจะสืบทอดการตั้งค่ากลุ่ม เว้นแต่จะถูกแทนที่ (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` ใช้เฉพาะหัวข้อและไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม

    **การกำหนดเส้นทาง agent ต่อหัวข้อ**: แต่ละหัวข้อสามารถกำหนดเส้นทางไปยัง agent อื่นได้โดยตั้งค่า `agentId` ในการกำหนดค่าหัวข้อ วิธีนี้ทำให้แต่ละหัวข้อมี workspace, memory และ session ที่แยกเป็นของตัวเอง ตัวอย่าง:

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

    **การผูกหัวข้อ ACP แบบถาวร**: หัวข้อฟอรัมสามารถปักหมุดเซสชัน harness ของ ACP ผ่านการผูก ACP แบบ typed ระดับบนสุด (`bindings[]` พร้อม `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ id ที่ระบุหัวข้อ เช่น `-1001234567890:topic:42`) ปัจจุบันจำกัดขอบเขตไว้ที่หัวข้อฟอรัมในกลุ่ม/supergroup ดู [Agent ACP](/th/tools/acp-agents)

    **การ spawn ACP ที่ผูกกับเธรดจากแชต**: `/acp spawn <agent> --thread here|auto` ผูกหัวข้อปัจจุบันกับเซสชัน ACP ใหม่; ข้อความติดตามจะถูกส่งไปที่นั่นโดยตรง OpenClaw จะปักหมุดการยืนยันการ spawn ไว้ในหัวข้อ ต้องให้ `channels.telegram.threadBindings.spawnSessions` ยังเปิดใช้งานอยู่ (ค่าเริ่มต้น: `true`)

    บริบทเทมเพลตเปิดเผย `MessageThreadId` และ `IsForum` แชตข้อความส่วนตัวที่มี `message_thread_id` จะรักษาการกำหนดเส้นทางข้อความส่วนตัวและเมทาดาทาการตอบกลับไว้บนเซสชันแบบแบนตามค่าเริ่มต้น โดยจะใช้คีย์เซสชันที่รับรู้เธรดก็ต่อเมื่อกำหนดค่าด้วย `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` หรือการกำหนดค่าหัวข้อที่ตรงกัน ใช้ `channels.telegram.dm.threadReplies` ระดับบนสุดสำหรับค่าเริ่มต้นของบัญชี หรือ `direct.<chatId>.threadReplies` สำหรับข้อความส่วนตัวหนึ่งรายการ

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยกระหว่างข้อความเสียงและไฟล์เสียง

    - ค่าเริ่มต้น: ลักษณะการทำงานของไฟล์เสียง
    - แท็ก `[[audio_as_voice]]` ในคำตอบของเอเจนต์เพื่อบังคับส่งเป็นข้อความเสียง
    - ทรานสคริปต์ข้อความเสียงขาเข้าจะถูกจัดกรอบเป็นข้อความที่สร้างโดยเครื่อง
      และไม่น่าเชื่อถือในบริบทของเอเจนต์ การตรวจจับการกล่าวถึงยังคงใช้ทรานสคริปต์ดิบ
      เพื่อให้ข้อความเสียงที่ถูกควบคุมด้วยการกล่าวถึงยังทำงานต่อไป

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

    Telegram แยกระหว่างไฟล์วิดีโอและวิดีโอโน้ต

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

    วิดีโอโน้ตไม่รองรับคำบรรยาย ข้อความที่ให้มาจะถูกส่งแยกต่างหาก

    ### สติกเกอร์

    การจัดการสติกเกอร์ขาเข้า:

    - WEBP แบบคงที่: ดาวน์โหลดและประมวลผล (ตัวแทน `<media:sticker>`)
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

    สติกเกอร์จะถูกอธิบายหนึ่งครั้ง (เมื่อเป็นไปได้) และแคชไว้เพื่อลดการเรียกใช้วิชันซ้ำ

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

  <Accordion title="การแจ้งเตือนรีแอ็กชัน">
    รีแอ็กชันของ Telegram จะมาถึงเป็นการอัปเดต `message_reaction` (แยกจากเพย์โหลดข้อความ)

    เมื่อเปิดใช้งาน OpenClaw จะจัดคิวเหตุการณ์ระบบ เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    การกำหนดค่า:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงรีแอ็กชันของผู้ใช้ต่อข้อความที่บอตส่งเท่านั้น (พยายามให้ดีที่สุดผ่านแคชข้อความที่ส่งแล้ว)
    - เหตุการณ์รีแอ็กชันยังคงเคารพการควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกละทิ้ง
    - Telegram ไม่ให้รหัสเธรดในการอัปเดตรีแอ็กชัน
      - กลุ่มที่ไม่ใช่ฟอรัมจะกำหนดเส้นทางไปยังเซสชันแชตกลุ่ม
      - กลุ่มฟอรัมจะกำหนดเส้นทางไปยังเซสชันหัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อต้นทางที่แน่นอน

    `allowed_updates` สำหรับการโพล/Webhook จะรวม `message_reaction` โดยอัตโนมัติ

  </Accordion>

  <Accordion title="รีแอ็กชันรับทราบ">
    `ackReaction` ส่งอีโมจิยืนยันการรับขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการแก้ค่า:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - อีโมจิสำรองจากตัวตนของเอเจนต์ (`agents.list[].identity.emoji` มิฉะนั้น "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิ Unicode (เช่น "👀")
    - ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับช่องทางหรือบัญชี

  </Accordion>

  <Accordion title="การเขียนการกำหนดค่าจากเหตุการณ์และคำสั่ง Telegram">
    การเขียนการกำหนดค่าของช่องทางเปิดใช้งานตามค่าเริ่มต้น (`configWrites !== false`)

    การเขียนที่ถูกทริกเกอร์โดย Telegram ได้แก่:

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

  <Accordion title="การโพลระยะยาวเทียบกับ Webhook">
    ค่าเริ่มต้นคือการโพลระยะยาว สำหรับโหมด Webhook ให้ตั้งค่า `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; ตัวเลือกเพิ่มเติมคือ `webhookPath`, `webhookHost`, `webhookPort` (ค่าเริ่มต้น `/telegram-webhook`, `127.0.0.1`, `8787`)

    ในโหมดการโพลระยะยาว OpenClaw จะคงค่า watermark สำหรับการรีสตาร์ตไว้หลังจากการอัปเดตถูกส่งต่อสำเร็จเท่านั้น หากตัวจัดการล้มเหลว การอัปเดตนั้นจะยังลองใหม่ได้ในโปรเซสเดียวกัน และจะไม่ถูกเขียนว่าเสร็จสมบูรณ์สำหรับการขจัดรายการซ้ำตอนรีสตาร์ต

    ตัวรับฟังภายในเครื่องผูกกับ `127.0.0.1:8787` สำหรับทางเข้าจากสาธารณะ ให้วาง reverse proxy ไว้หน้าพอร์ตภายในเครื่อง หรือตั้งค่า `webhookHost: "0.0.0.0"` อย่างตั้งใจ

    โหมด Webhook ตรวจสอบตัวป้องกันคำขอ โทเค็นลับของ Telegram และเนื้อหา JSON ก่อนส่งคืน `200` ให้ Telegram
    จากนั้น OpenClaw จะประมวลผลการอัปเดตแบบอะซิงโครนัสผ่านเลนบอตต่อแชต/ต่อหัวข้อเดียวกับที่ใช้โดยการโพลระยะยาว ดังนั้นรอบการทำงานของเอเจนต์ที่ช้าจะไม่ยึดการยืนยันการส่งมอบของ Telegram ไว้

  </Accordion>

  <Accordion title="ขีดจำกัด การลองใหม่ และเป้าหมาย CLI">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` ให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนการแบ่งตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ทั้งขาเข้าและขาออก
    - `channels.telegram.mediaGroupFlushMs` (ค่าเริ่มต้น 500) ควบคุมระยะเวลาที่อัลบั้ม/กลุ่มสื่อของ Telegram ถูกบัฟเฟอร์ก่อนที่ OpenClaw จะส่งต่อเป็นข้อความขาเข้าเดียว เพิ่มค่านี้หากส่วนต่าง ๆ ของอัลบั้มมาถึงช้า ลดค่านี้เพื่อลดเวลาแฝงของการตอบกลับอัลบั้ม
    - `channels.telegram.timeoutSeconds` เขียนทับระยะหมดเวลาของไคลเอนต์ Telegram API (หากไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY) ไคลเอนต์บอตจะจำกัดค่าที่กำหนดไว้ให้ต่ำกว่าตัวป้องกันคำขอข้อความขาออก/การพิมพ์ 60 วินาที เพื่อไม่ให้ grammY ยกเลิกการส่งคำตอบที่มองเห็นได้ก่อนที่ตัวป้องกันทรานสปอร์ตและตัวสำรองของ OpenClaw จะทำงานได้ การโพลระยะยาวยังคงใช้ตัวป้องกันคำขอ `getUpdates` 45 วินาที เพื่อไม่ให้การโพลที่ว่างอยู่ถูกปล่อยทิ้งไว้อย่างไม่มีกำหนด
    - ค่าเริ่มต้นของ `channels.telegram.pollingStallThresholdMs` คือ `120000`; ปรับระหว่าง `30000` ถึง `600000` เฉพาะสำหรับการรีสตาร์ตจากการโพลค้างแบบผลบวกลวงเท่านั้น
    - ประวัติบริบทกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` ปิดใช้งาน
    - บริบทเสริมของการตอบกลับ/การอ้างอิง/การส่งต่อจะถูกทำให้เป็นมาตรฐานเป็นหน้าต่างบริบทการสนทนาที่เลือกหนึ่งรายการเมื่อ Gateway สังเกตเห็นข้อความแม่แล้ว แคชข้อความที่สังเกตเห็นจะถูกคงอยู่ข้างที่เก็บเซสชัน Telegram รวม `reply_to_message` ชั้นตื้นเพียงรายการเดียวในการอัปเดต ดังนั้นเชนที่เก่ากว่าแคชจะถูกจำกัดตามเพย์โหลดการอัปเดตปัจจุบันของ Telegram
    - รายการอนุญาตของ Telegram มีหน้าที่หลักในการควบคุมว่าใครสามารถทริกเกอร์เอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมเต็มรูปแบบ
    - การควบคุมประวัติข้อความส่วนตัว:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - การกำหนดค่า `channels.telegram.retry` ใช้กับตัวช่วยส่ง Telegram (CLI/เครื่องมือ/แอ็กชัน) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้ การส่งคำตอบสุดท้ายขาเข้ายังใช้การลองส่งแบบปลอดภัยที่มีขอบเขตสำหรับความล้มเหลวก่อนเชื่อมต่อของ Telegram แต่จะไม่ลองใหม่กับซองเครือข่ายหลังส่งที่กำกวมซึ่งอาจทำให้ข้อความที่มองเห็นได้ซ้ำกัน

    เป้าหมายการส่งของ CLI และเครื่องมือข้อความสามารถเป็นรหัสแชตแบบตัวเลข ชื่อผู้ใช้ หรือเป้าหมายหัวข้อฟอรัม:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    โพล Telegram ใช้ `openclaw message poll` และรองรับหัวข้อฟอรัม:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    แฟล็กโพลเฉพาะ Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` สำหรับหัวข้อฟอรัม (หรือใช้เป้าหมาย `:topic:`)

    การส่ง Telegram ยังรองรับ:

    - `--presentation` พร้อมบล็อก `buttons` สำหรับคีย์บอร์ดแบบอินไลน์เมื่อ `channels.telegram.capabilities.inlineButtons` อนุญาต
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอการส่งแบบปักหมุดเมื่อบอตสามารถปักหมุดในแชตนั้นได้
    - `--force-document` เพื่อส่งรูปภาพขาออกและ GIF เป็นเอกสารแทนการอัปโหลดเป็นรูปภาพที่ถูกบีบอัดหรือสื่อเคลื่อนไหว

    การควบคุมแอ็กชัน:

    - `channels.telegram.actions.sendMessage=false` ปิดใช้งานข้อความ Telegram ขาออก รวมถึงโพล
    - `channels.telegram.actions.poll=false` ปิดใช้งานการสร้างโพล Telegram โดยยังคงเปิดใช้งานการส่งปกติไว้

  </Accordion>

  <Accordion title="การอนุมัติ exec ใน Telegram">
    Telegram รองรับการอนุมัติ exec ในข้อความส่วนตัวของผู้อนุมัติ และสามารถเลือกโพสต์พรอมป์ในแชตหรือหัวข้อต้นทางได้ ผู้อนุมัติต้องเป็นรหัสผู้ใช้ Telegram แบบตัวเลข

    พาธการกำหนดค่า:

    - `channels.telegram.execApprovals.enabled` (เปิดใช้งานอัตโนมัติเมื่อแก้ค่าได้อย่างน้อยหนึ่งผู้อนุมัติ)
    - `channels.telegram.execApprovals.approvers` (ถอยกลับไปใช้รหัสเจ้าของแบบตัวเลขจาก `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` และ `defaultTo` ควบคุมว่าใครคุยกับบอตได้และบอตส่งคำตอบปกติไปที่ใด ค่าเหล่านี้ไม่ได้ทำให้บุคคลนั้นเป็นผู้อนุมัติ exec การจับคู่ข้อความส่วนตัวครั้งแรกที่ได้รับอนุมัติจะบูตสแตรป `commands.ownerAllowFrom` เมื่อยังไม่มีเจ้าของคำสั่ง ดังนั้นการตั้งค่าเจ้าของหนึ่งคนยังคงทำงานได้โดยไม่ต้องใส่รหัสซ้ำใต้ `execApprovals.approvers`

    การส่งไปยังช่องทางจะแสดงข้อความคำสั่งในแชต เปิดใช้งาน `channel` หรือ `both` เฉพาะในกลุ่ม/หัวข้อที่เชื่อถือเท่านั้น เมื่อพรอมป์ไปถึงหัวข้อฟอรัม OpenClaw จะรักษาหัวข้อไว้สำหรับพรอมป์การอนุมัติและการติดตามผล การอนุมัติ exec จะหมดอายุหลังจาก 30 นาทีตามค่าเริ่มต้น

    ปุ่มอนุมัติแบบอินไลน์ยังต้องใช้ `channels.telegram.capabilities.inlineButtons` เพื่ออนุญาตพื้นผิวเป้าหมาย (`dm`, `group` หรือ `all`) รหัสการอนุมัติที่นำหน้าด้วย `plugin:` จะถูกแก้ค่าผ่านการอนุมัติของ Plugin ส่วนรายการอื่นจะถูกแก้ค่าผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## การควบคุมการตอบกลับข้อผิดพลาด

เมื่อเอเจนต์พบข้อผิดพลาดด้านการส่งมอบหรือผู้ให้บริการ Telegram สามารถตอบกลับด้วยข้อความข้อผิดพลาดหรือระงับไว้ได้ คีย์การกำหนดค่าสองรายการควบคุมลักษณะการทำงานนี้:

| คีย์                                | ค่า               | ค่าเริ่มต้น | คำอธิบาย                                                                                       |
| ----------------------------------- | ----------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`      | `reply` ส่งข้อความข้อผิดพลาดที่เป็นมิตรไปยังแชต `silent` ระงับการตอบกลับข้อผิดพลาดทั้งหมด |
| `channels.telegram.errorCooldownMs` | ตัวเลข (ms)       | `60000`      | เวลาขั้นต่ำระหว่างการตอบกลับข้อผิดพลาดไปยังแชตเดียวกัน ป้องกันข้อความข้อผิดพลาดจำนวนมากระหว่างระบบขัดข้อง |

รองรับการเขียนทับรายบัญชี รายกลุ่ม และรายหัวข้อ (การสืบทอดเดียวกับคีย์การกำหนดค่า Telegram อื่น ๆ)

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

    - หาก `requireMention=false` โหมดความเป็นส่วนตัวของ Telegram ต้องอนุญาตให้มองเห็นได้อย่างเต็มรูปแบบ
      - BotFather: `/setprivacy` -> ปิดใช้งาน
      - จากนั้นลบและเพิ่มบอตกลับเข้ากลุ่มอีกครั้ง
    - `openclaw channels status` จะเตือนเมื่อการกำหนดค่าคาดหวังข้อความกลุ่มที่ไม่ได้กล่าวถึง
    - `openclaw channels status --probe` สามารถตรวจสอบ ID กลุ่มแบบตัวเลขที่ระบุชัดเจนได้ ไม่สามารถตรวจสอบสมาชิกภาพของ wildcard `"*"` ได้
    - การทดสอบเซสชันอย่างเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอตไม่เห็นข้อความกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` อยู่ กลุ่มต้องถูกระบุไว้ (หรือรวม `"*"`)
    - ตรวจสอบสมาชิกภาพของบอตในกลุ่ม
    - ตรวจสอบล็อก: `openclaw logs --follow` เพื่อดูเหตุผลที่ข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานบางส่วนหรือไม่ทำงานเลย">

    - อนุญาตตัวตนผู้ส่งของคุณ (การจับคู่และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังคงมีผลแม้นโยบายกลุ่มเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนูเนทีฟมีรายการมากเกินไป ให้ลดจำนวนคำสั่งของ plugin/skill/คำสั่งกำหนดเอง หรือปิดใช้งานเมนูเนทีฟ
    - การเรียกตอนเริ่มต้น `deleteMyCommands` / `setMyCommands` และการเรียกสถานะการพิมพ์ `sendChatAction` มีขอบเขตจำกัดและลองซ้ำหนึ่งครั้งผ่านทางเลือกสำรองของทรานสปอร์ต Telegram เมื่อคำขอหมดเวลา ข้อผิดพลาดเครือข่าย/การดึงข้อมูลที่คงอยู่มักบ่งชี้ปัญหาการเข้าถึง DNS/HTTPS ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="ตอนเริ่มต้นรายงานว่าโทเค็นไม่ได้รับอนุญาต">

    - `getMe returned 401` คือความล้มเหลวในการยืนยันตัวตนของ Telegram สำหรับโทเค็นบอตที่กำหนดค่าไว้
    - คัดลอกใหม่หรือสร้างโทเค็นบอตใหม่ใน BotFather จากนั้นอัปเดต `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` หรือ `TELEGRAM_BOT_TOKEN` สำหรับบัญชีเริ่มต้น
    - `deleteWebhook 401 Unauthorized` ระหว่างเริ่มต้นก็เป็นความล้มเหลวในการยืนยันตัวตนเช่นกัน การถือว่าเป็น “ไม่มี webhook อยู่” จะเพียงเลื่อนความล้มเหลวจากโทเค็นไม่ถูกต้องเดียวกันไปยังการเรียก API ภายหลัง

  </Accordion>

  <Accordion title="การโพลหรือเครือข่ายไม่เสถียร">

    - Node 22+ พร้อม fetch/proxy แบบกำหนดเองอาจทำให้เกิดพฤติกรรมยกเลิกทันทีหากชนิด AbortSignal ไม่ตรงกัน
    - บางโฮสต์ resolve `api.telegram.org` เป็น IPv6 ก่อน การออก IPv6 ที่เสียอาจทำให้ Telegram API ล้มเหลวเป็นครั้งคราว
    - หากล็อกมี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!` ตอนนี้ OpenClaw จะลองซ้ำข้อผิดพลาดเหล่านี้ในฐานะข้อผิดพลาดเครือข่ายที่กู้คืนได้
    - ระหว่างการเริ่มต้นการโพล OpenClaw จะใช้ probe `getMe` ตอนเริ่มต้นที่สำเร็จซ้ำสำหรับ grammY เพื่อให้ runner ไม่ต้องใช้ `getMe` ครั้งที่สองก่อน `getUpdates` ครั้งแรก
    - หาก `deleteWebhook` ล้มเหลวด้วยข้อผิดพลาดเครือข่ายชั่วคราวระหว่างการเริ่มต้นการโพล OpenClaw จะเข้าสู่ long polling ต่อไปแทนการเรียก control-plane ก่อนโพลอีกครั้ง webhook ที่ยังทำงานอยู่จะแสดงเป็นข้อขัดแย้งของ `getUpdates` จากนั้น OpenClaw จะสร้างทรานสปอร์ต Telegram ใหม่และลองทำความสะอาด webhook อีกครั้ง
    - หากซ็อกเก็ต Telegram ถูกรีไซเคิลตามรอบเวลาคงที่ที่สั้น ให้ตรวจสอบว่า `channels.telegram.timeoutSeconds` ต่ำหรือไม่ ไคลเอนต์บอตจะ clamp ค่าที่กำหนดไว้ต่ำกว่า guard ของคำขอ outbound และ `getUpdates` แต่รุ่นเก่าอาจยกเลิกทุกการโพลหรือการตอบกลับเมื่อค่านี้ถูกตั้งต่ำกว่า guard เหล่านั้น
    - หากล็อกมี `Polling stall detected` OpenClaw จะเริ่มการโพลใหม่และสร้างทรานสปอร์ต Telegram ใหม่หลังจากไม่มี liveness ของ long-poll ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีตามค่าเริ่มต้น
    - `openclaw channels status --probe` และ `openclaw doctor` จะเตือนเมื่อบัญชีโพลที่กำลังทำงานยังไม่เสร็จสิ้น `getUpdates` หลังช่วงผ่อนผันตอนเริ่มต้น เมื่อบัญชี webhook ที่กำลังทำงานยังไม่เสร็จสิ้น `setWebhook` หลังช่วงผ่อนผันตอนเริ่มต้น หรือเมื่อกิจกรรมทรานสปอร์ตการโพลที่สำเร็จล่าสุดล้าสมัย
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่ใช้เวลานานยังปกติ แต่โฮสต์ของคุณยังรายงานการเริ่มใหม่จาก polling-stall แบบผิดพลาด การค้างที่คงอยู่มักชี้ไปยังปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่างโฮสต์กับ `api.telegram.org`
    - Telegram ยังเคารพ env proxy ของโปรเซสสำหรับทรานสปอร์ต Bot API รวมถึง `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และรูปแบบตัวพิมพ์เล็กของค่าเหล่านั้น `NO_PROXY` / `no_proxy` ยังสามารถข้าม `api.telegram.org` ได้
    - หาก OpenClaw managed proxy ถูกกำหนดค่าผ่าน `OPENCLAW_PROXY_URL` สำหรับสภาพแวดล้อมบริการและไม่มี env proxy มาตรฐาน Telegram จะใช้ URL นั้นสำหรับทรานสปอร์ต Bot API ด้วย
    - บนโฮสต์ VPS ที่มี direct egress/TLS ไม่เสถียร ให้ส่งเส้นทางการเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ มีค่าเริ่มต้นเป็น `autoSelectFamily=true` (ยกเว้น WSL2) ลำดับผลลัพธ์ DNS ของ Telegram จะเคารพ `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER` จากนั้น `channels.telegram.network.dnsResultOrder` จากนั้นค่าเริ่มต้นของโปรเซส เช่น `NODE_OPTIONS=--dns-result-order=ipv4first` หากไม่มีค่าใดมีผล Node 22+ จะ fallback เป็น `ipv4first`
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
      private/internal/special-use อื่นระหว่างการดาวน์โหลดสื่อ คุณสามารถเลือกใช้
      การข้ามเฉพาะ Telegram ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - การเลือกใช้เดียวกันมีให้ใช้ต่อบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หาก proxy ของคุณ resolve โฮสต์สื่อ Telegram เป็น `198.18.x.x` ให้ปิด
      flag อันตรายไว้ก่อน สื่อ Telegram อนุญาตช่วง benchmark RFC 2544
      ตามค่าเริ่มต้นอยู่แล้ว

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` ทำให้การป้องกัน SSRF
      ของสื่อ Telegram อ่อนลง ใช้เฉพาะกับสภาพแวดล้อม proxy ที่ผู้ปฏิบัติงานควบคุมและเชื่อถือได้
      เช่น การกำหนดเส้นทาง fake-IP ของ Clash, Mihomo หรือ Surge เมื่อสภาพแวดล้อมเหล่านั้น
      สร้างคำตอบ private หรือ special-use นอกช่วง benchmark RFC 2544
      ปิดไว้สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ
    </Warning>

    - การแทนที่ด้วยสภาพแวดล้อม (ชั่วคราว):
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

<Accordion title="ฟิลด์ Telegram สัญญาณสูง">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; symlink จะถูกปฏิเสธ)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- การอนุมัติ exec: `execApprovals`, `accounts.*.execApprovals`
- คำสั่ง/เมนู: `commands.native`, `commands.nativeSkills`, `customCommands`
- เธรด/การตอบกลับ: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- การสตรีม: `streaming` (ตัวอย่าง), `streaming.preview.toolProgress`, `blockStreaming`
- การจัดรูปแบบ/การส่ง: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- สื่อ/เครือข่าย: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- รูท API แบบกำหนดเอง: `apiRoot` (รูท Bot API เท่านั้น; อย่ารวม `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- การกระทำ/ความสามารถ: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaction: `reactionNotifications`, `reactionLevel`
- ข้อผิดพลาด: `errorPolicy`, `errorCooldownMs`
- การเขียน/ประวัติ: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญของหลายบัญชี: เมื่อมีการกำหนดค่า ID บัญชีตั้งแต่สองรายการขึ้นไป ให้ตั้งค่า `channels.telegram.defaultAccount` (หรือรวม `channels.telegram.accounts.default`) เพื่อทำให้การกำหนดเส้นทางเริ่มต้นชัดเจน มิฉะนั้น OpenClaw จะ fallback ไปยัง ID บัญชี normalized รายการแรก และ `openclaw doctor` จะเตือน บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom` แต่ไม่สืบทอดค่า `accounts.default.*`
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
  <Card title="การกำหนดเส้นทางแบบหลาย agent" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกลุ่มและหัวข้อไปยัง agent
  </Card>
  <Card title="การแก้ไขปัญหา" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้าม Channel
  </Card>
</CardGroup>
