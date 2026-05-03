---
read_when:
    - การทำงานกับฟีเจอร์ Telegram หรือ Webhook
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของบอต Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-03T21:27:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 528ace9dae29eda22f98cc1436ec16146eb9d83edc73aa6db1ab8283f4f873c0
    source_path: channels/telegram.md
    workflow: 16
---

พร้อมใช้งานจริงสำหรับ DM ของบอตและกลุ่มผ่าน grammY โหมดเริ่มต้นคือ long polling; โหมด webhook เป็นตัวเลือกเสริม

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับ Telegram คือการจับคู่
  </Card>
  <Card title="การแก้ไขปัญหา Channel" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้าม Channel และ playbook สำหรับการซ่อมแซม
  </Card>
  <Card title="การกำหนดค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่า Channel แบบครบถ้วน
  </Card>
</CardGroup>

## การตั้งค่าแบบรวดเร็ว

<Steps>
  <Step title="สร้างโทเค็นบอตใน BotFather">
    เปิด Telegram แล้วแชตกับ **@BotFather** (ยืนยันว่า handle คือ `@BotFather` ทุกตัวอักษร)

    เรียกใช้ `/newbot` ทำตาม prompt แล้วบันทึกโทเค็นไว้

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
    Telegram **ไม่** ใช้ `openclaw channels login telegram`; ให้กำหนดค่าโทเค็นใน config/env แล้วจึงเริ่ม gateway

  </Step>

  <Step title="เริ่ม Gateway และอนุมัติ DM แรก">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    โค้ดจับคู่หมดอายุหลังจาก 1 ชั่วโมง

  </Step>

  <Step title="เพิ่มบอตลงในกลุ่ม">
    เพิ่มบอตลงในกลุ่มของคุณ แล้วตั้งค่า `channels.telegram.groups` และ `groupPolicy` ให้ตรงกับรูปแบบการเข้าถึงของคุณ
  </Step>
</Steps>

<Note>
ลำดับการแก้ค่าโทเค็นรับรู้ระดับบัญชี ในทางปฏิบัติ ค่า config จะมีลำดับเหนือกว่าค่าทดแทนจาก env และ `TELEGRAM_BOT_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="โหมดความเป็นส่วนตัวและการมองเห็นในกลุ่ม">
    บอต Telegram มีค่าเริ่มต้นเป็น **โหมดความเป็นส่วนตัว** ซึ่งจำกัดข้อความกลุ่มที่บอตได้รับ

    หากบอตต้องเห็นข้อความทั้งหมดในกลุ่ม ให้ทำอย่างใดอย่างหนึ่ง:

    - ปิดโหมดความเป็นส่วนตัวผ่าน `/setprivacy` หรือ
    - ทำให้บอตเป็นผู้ดูแลกลุ่ม

    เมื่อสลับโหมดความเป็นส่วนตัว ให้ลบ + เพิ่มบอตกลับเข้าไปใหม่ในแต่ละกลุ่ม เพื่อให้ Telegram นำการเปลี่ยนแปลงไปใช้

  </Accordion>

  <Accordion title="สิทธิ์ของกลุ่ม">
    สถานะผู้ดูแลถูกควบคุมในการตั้งค่ากลุ่ม Telegram

    บอตผู้ดูแลจะได้รับข้อความกลุ่มทั้งหมด ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มที่ทำงานตลอดเวลา

  </Accordion>

  <Accordion title="ตัวสลับที่มีประโยชน์ใน BotFather">

    - `/setjoingroups` เพื่ออนุญาต/ปฏิเสธการเพิ่มลงกลุ่ม
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

    `dmPolicy: "open"` พร้อม `allowFrom: ["*"]` ทำให้บัญชี Telegram ใด ๆ ที่พบหรือเดาชื่อผู้ใช้ของบอตได้สามารถสั่งงานบอตได้ ใช้เฉพาะกับบอตสาธารณะที่ตั้งใจเปิดให้ใช้ โดยมีเครื่องมือที่จำกัดอย่างเข้มงวดเท่านั้น; บอตเจ้าของคนเดียวควรใช้ `allowlist` พร้อม ID ผู้ใช้แบบตัวเลข

    `channels.telegram.allowFrom` รับ ID ผู้ใช้ Telegram แบบตัวเลข รองรับ prefix `telegram:` / `tg:` และจะถูกทำให้เป็นรูปแบบมาตรฐาน
    ใน config หลายบัญชี ค่า `channels.telegram.allowFrom` ระดับบนสุดที่เข้มงวดจะถูกถือเป็นขอบเขตความปลอดภัย: รายการ `allowFrom: ["*"]` ระดับบัญชีจะไม่ทำให้บัญชีนั้นเป็นสาธารณะ เว้นแต่ allowlist ที่มีผลของบัญชียังคงมี wildcard แบบชัดเจนหลังจากรวมค่าแล้ว
    `dmPolicy: "allowlist"` พร้อม `allowFrom` ว่างจะบล็อก DM ทั้งหมดและถูกปฏิเสธโดยการตรวจสอบ config
    ขั้นตอนตั้งค่าจะขอเฉพาะ ID ผู้ใช้แบบตัวเลข
    หากคุณอัปเกรดแล้ว config ของคุณมีรายการ allowlist แบบ `@username` ให้เรียกใช้ `openclaw doctor --fix` เพื่อแก้ค่าเหล่านั้น (พยายามให้ดีที่สุด; ต้องมีโทเค็นบอต Telegram)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์ allowlist ของ pairing-store, `openclaw doctor --fix` สามารถกู้คืนรายการเข้าไปใน `channels.telegram.allowFrom` ใน flow แบบ allowlist ได้ (ตัวอย่างเช่นเมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID ที่ระบุไว้อย่างชัดเจน)

    สำหรับบอตเจ้าของคนเดียว แนะนำให้ใช้ `dmPolicy: "allowlist"` พร้อม ID `allowFrom` แบบตัวเลขที่ระบุชัดเจน เพื่อให้นโยบายการเข้าถึงคงทนอยู่ใน config (แทนการพึ่งพาการอนุมัติการจับคู่ก่อนหน้า)

    ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่ได้หมายความว่า "ผู้ส่งรายนี้ได้รับอนุญาตทุกที่"
    การจับคู่ให้สิทธิ์เข้าถึง DM หากยังไม่มีเจ้าของคำสั่ง การจับคู่ที่อนุมัติครั้งแรกจะตั้งค่า `commands.ownerAllowFrom` ด้วย เพื่อให้คำสั่งเฉพาะเจ้าของและการอนุมัติ exec มีบัญชีผู้ปฏิบัติการที่ชัดเจน
    การอนุญาตผู้ส่งในกลุ่มยังคงมาจาก allowlist ที่กำหนดค่าไว้อย่างชัดเจน
    หากคุณต้องการ "ฉันได้รับอนุญาตครั้งเดียว แล้วทั้ง DM และคำสั่งในกลุ่มใช้งานได้" ให้ใส่ ID ผู้ใช้ Telegram แบบตัวเลขของคุณใน `channels.telegram.allowFrom`; สำหรับคำสั่งเฉพาะเจ้าของ ตรวจสอบให้แน่ใจว่า `commands.ownerAllowFrom` มี `telegram:<your user id>`

    ### การหา ID ผู้ใช้ Telegram ของคุณ

    ปลอดภัยกว่า (ไม่มีบอตบุคคลที่สาม):

    1. ส่ง DM ถึงบอตของคุณ
    2. เรียกใช้ `openclaw logs --follow`
    3. อ่าน `from.id`

    วิธีทางการของ Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="นโยบายกลุ่มและ allowlist">
    มีการควบคุมสองส่วนที่ใช้ร่วมกัน:

    1. **กลุ่มใดได้รับอนุญาต** (`channels.telegram.groups`)
       - ไม่มี config `groups`:
         - พร้อม `groupPolicy: "open"`: กลุ่มใด ๆ ผ่านการตรวจสอบ group-ID ได้
         - พร้อม `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการ `groups` (หรือ `"*"`)
       - กำหนดค่า `groups` แล้ว: ทำหน้าที่เป็น allowlist (ID ที่ระบุชัดเจนหรือ `"*"`)

    2. **ผู้ส่งใดได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับการกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่า Telegram จะ fallback ไปที่ `allowFrom`
    รายการ `groupAllowFrom` ควรเป็น ID ผู้ใช้ Telegram แบบตัวเลข (`telegram:` / `tg:` prefix จะถูกทำให้เป็นรูปแบบมาตรฐาน)
    อย่าใส่ ID แชตของกลุ่มหรือ supergroup ของ Telegram ใน `groupAllowFrom` ID แชตติดลบต้องอยู่ใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเว้นสำหรับการอนุญาตผู้ส่ง
    ขอบเขตความปลอดภัย (`2026.2.25+`): auth ผู้ส่งในกลุ่ม **ไม่** สืบทอดการอนุมัติจาก pairing-store ของ DM
    การจับคู่ยังเป็นเฉพาะ DM เท่านั้น สำหรับกลุ่ม ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` รายกลุ่ม/รายหัวข้อ
    หากไม่ได้ตั้งค่า `groupAllowFrom`, Telegram จะ fallback ไปที่ config `allowFrom` ไม่ใช่ pairing store
    รูปแบบที่ใช้ได้จริงสำหรับบอตเจ้าของคนเดียว: ตั้งค่า ID ผู้ใช้ของคุณใน `channels.telegram.allowFrom` ปล่อย `groupAllowFrom` ให้ไม่ได้ตั้งค่า และอนุญาตกลุ่มเป้าหมายใต้ `channels.telegram.groups`
    หมายเหตุ runtime: หาก `channels.telegram` หายไปทั้งหมด runtime จะมีค่าเริ่มต้นแบบ fail-closed เป็น `groupPolicy="allowlist"` เว้นแต่จะตั้งค่า `channels.defaults.groupPolicy` ไว้อย่างชัดเจน

    ตัวอย่าง: อนุญาตสมาชิกใดก็ได้ในกลุ่มหนึ่งที่ระบุ:

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

      - ใส่ ID แชตของกลุ่มหรือ supergroup ของ Telegram ที่ติดลบ เช่น `-1001234567890` ไว้ใต้ `channels.telegram.groups`
      - ใส่ ID ผู้ใช้ Telegram เช่น `8734062810` ไว้ใต้ `groupAllowFrom` เมื่อคุณต้องการจำกัดว่าคนใดในกลุ่มที่ได้รับอนุญาตสามารถเรียกบอตได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกใดก็ได้ของกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอตได้

    </Warning>

  </Tab>

  <Tab title="พฤติกรรมการ mention">
    การตอบกลับในกลุ่มต้องมี mention ตามค่าเริ่มต้น

    mention สามารถมาจาก:

    - mention แบบ native `@botusername` หรือ
    - รูปแบบ mention ใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    ตัวสลับคำสั่งระดับ session:

    - `/activation always`
    - `/activation mention`

    สิ่งเหล่านี้อัปเดตเฉพาะสถานะ session เท่านั้น ใช้ config เพื่อความคงทน

    ตัวอย่าง config แบบคงทน:

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

    - forward ข้อความกลุ่มไปยัง `@userinfobot` / `@getidsbot`
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจสอบ Bot API `getUpdates`

  </Tab>
</Tabs>

## พฤติกรรม runtime

- Telegram ถูกเป็นเจ้าของโดยโปรเซส gateway
- การกำหนดเส้นทางเป็นแบบกำหนดแน่นอน: ข้อความขาเข้าจาก Telegram จะตอบกลับไปยัง Telegram (โมเดลไม่ได้เลือก Channel)
- ข้อความขาเข้าถูกทำให้เป็นรูปแบบมาตรฐานใน envelope Channel ที่ใช้ร่วมกัน พร้อม metadata การตอบกลับและ placeholder ของสื่อ
- session ของกลุ่มถูกแยกตาม ID กลุ่ม หัวข้อฟอรัมจะต่อท้าย `:topic:<threadId>` เพื่อแยกหัวข้อออกจากกัน
- ข้อความ DM สามารถมี `message_thread_id`; OpenClaw จะรักษา thread ID ไว้สำหรับการตอบกลับ แต่คง DM ไว้บน session แบบแบนตามค่าเริ่มต้น กำหนดค่า `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` หรือ config หัวข้อที่ตรงกัน เมื่อคุณตั้งใจต้องการการแยก session ของหัวข้อ DM
- Long polling ใช้ grammY runner พร้อมการจัดลำดับต่อแชต/ต่อ thread concurrency ของ runner sink โดยรวมใช้ `agents.defaults.maxConcurrent`
- Long polling ถูกป้องกันภายในแต่ละโปรเซส gateway เพื่อให้ poller ที่ active เพียงหนึ่งตัวใช้โทเค็นบอตได้ในแต่ละครั้ง หากคุณยังเห็นข้อขัดแย้ง `getUpdates` 409 น่าจะมี OpenClaw gateway อื่น, script หรือ poller ภายนอกกำลังใช้โทเค็นเดียวกันอยู่
- watchdog ของ long-polling จะทริกเกอร์การ restart ตามค่าเริ่มต้นหลังจากไม่มี liveness ของ `getUpdates` ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาที เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อ deployment ของคุณยังเห็นการ restart จาก polling-stall แบบ false ระหว่างงานที่ใช้เวลานาน ค่านี้เป็นมิลลิวินาทีและอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับ override รายบัญชี
- Telegram Bot API ไม่มีการรองรับ read-receipt (`sendReadReceipts` ใช้ไม่ได้)

## อ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="ตัวอย่างสตรีมสด (การแก้ไขข้อความ)">
    OpenClaw สามารถสตรีมคำตอบบางส่วนแบบ real time ได้:

    - แชตโดยตรง: ข้อความตัวอย่าง + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความตัวอย่าง + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` คือ `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - `progress` เก็บ draft สถานะที่แก้ไขได้หนึ่งรายการและอัปเดตด้วยความคืบหน้าของเครื่องมือจนกว่าจะส่งข้อความสุดท้าย
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความตัวอย่างที่แก้ไขข้อความเดิมซ้ำหรือไม่ (ค่าเริ่มต้น: `true` เมื่อ preview streaming ทำงานอยู่)
    - ค่าเดิม `channels.telegram.streamMode` และค่า boolean ของ `streaming` จะถูกตรวจพบ; เรียกใช้ `openclaw doctor --fix` เพื่อย้ายค่าเหล่านั้นไปยัง `channels.telegram.streaming.mode`

    การอัปเดตตัวอย่างความคืบหน้าของเครื่องมือคือบรรทัดสถานะสั้น ๆ ที่แสดงระหว่างที่เครื่องมือทำงาน เช่น การเรียกใช้คำสั่ง การอ่านไฟล์ การอัปเดตการวางแผน หรือสรุป patch Telegram เปิดใช้สิ่งเหล่านี้ตามค่าเริ่มต้นเพื่อให้ตรงกับพฤติกรรม OpenClaw ที่เผยแพร่ตั้งแต่ `v2026.4.22` และใหม่กว่า หากต้องการคงตัวอย่างที่แก้ไขได้สำหรับข้อความคำตอบ แต่ซ่อนบรรทัดความคืบหน้าของเครื่องมือ ให้ตั้งค่า:

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

    ใช้ `streaming.mode: "off"` เฉพาะเมื่อคุณต้องการส่งเฉพาะผลลัพธ์สุดท้ายเท่านั้น: การแก้ไขพรีวิวของ Telegram จะถูกปิด และข้อความทั่วไปเกี่ยวกับเครื่องมือ/ความคืบหน้าจะถูกระงับแทนที่จะส่งเป็นข้อความสถานะแยกต่างหาก พรอมป์ขออนุมัติ เพย์โหลดสื่อ และข้อผิดพลาดจะยังถูกส่งผ่านการส่งผลลัพธ์สุดท้ายตามปกติ ใช้ `streaming.preview.toolProgress: false` เมื่อคุณต้องการคงการแก้ไขพรีวิวคำตอบไว้เท่านั้น พร้อมซ่อนบรรทัดสถานะความคืบหน้าของเครื่องมือ

    <Note>
      การตอบกลับคำพูดที่เลือกของ Telegram เป็นข้อยกเว้น เมื่อ `replyToMode` เป็น `"first"`, `"all"` หรือ `"batched"` และข้อความขาเข้ามีข้อความคำพูดที่เลือก OpenClaw จะส่งคำตอบสุดท้ายผ่านเส้นทางการตอบกลับคำพูดแบบเนทีฟของ Telegram แทนการแก้ไขพรีวิวคำตอบ ดังนั้น `streaming.preview.toolProgress` จึงไม่สามารถแสดงบรรทัดสถานะสั้นๆ สำหรับเทิร์นนั้นได้ การตอบกลับข้อความปัจจุบันที่ไม่มีข้อความคำพูดที่เลือกยังคงใช้การสตรีมพรีวิวได้ ตั้งค่า `replyToMode: "off"` เมื่อการมองเห็นความคืบหน้าของเครื่องมือสำคัญกว่าการตอบกลับคำพูดแบบเนทีฟ หรือตั้งค่า `streaming.preview.toolProgress: false` เพื่อยอมรับข้อแลกเปลี่ยนนี้
    </Note>

    สำหรับการตอบกลับแบบข้อความเท่านั้น:

    - พรีวิวสั้นใน DM/กลุ่ม/หัวข้อ: OpenClaw จะคงข้อความพรีวิวเดิมไว้และแก้ไขครั้งสุดท้ายในที่เดิม เว้นแต่ว่ามีข้อความที่มองเห็นได้ซึ่งไม่ใช่พรีวิวถูกส่งหลังจากพรีวิวปรากฏ
    - พรีวิวที่ตามด้วยเอาต์พุตที่มองเห็นได้ซึ่งไม่ใช่พรีวิว: OpenClaw จะส่งการตอบกลับที่เสร็จสมบูรณ์เป็นข้อความสุดท้ายใหม่ และล้างพรีวิวเก่าออก เพื่อให้คำตอบสุดท้ายปรากฏหลังเอาต์พุตระหว่างทาง
    - พรีวิวที่เก่ากว่าประมาณหนึ่งนาที: OpenClaw จะส่งการตอบกลับที่เสร็จสมบูรณ์เป็นข้อความสุดท้ายใหม่ แล้วจึงล้างพรีวิวออก เพื่อให้เวลาที่มองเห็นได้ของ Telegram สะท้อนเวลาที่เสร็จสมบูรณ์แทนเวลาที่สร้างพรีวิว

    สำหรับการตอบกลับที่ซับซ้อน (เช่น เพย์โหลดสื่อ) OpenClaw จะย้อนกลับไปใช้การส่งผลลัพธ์สุดท้ายตามปกติ แล้วจึงล้างข้อความพรีวิวออก

    การสตรีมพรีวิวแยกจากการสตรีมบล็อก เมื่อเปิดใช้การสตรีมบล็อกอย่างชัดเจนสำหรับ Telegram OpenClaw จะข้ามสตรีมพรีวิวเพื่อหลีกเลี่ยงการสตรีมซ้ำ

    สตรีมการให้เหตุผลเฉพาะ Telegram:

    - `/reasoning stream` ส่งการให้เหตุผลไปยังพรีวิวสดระหว่างสร้างคำตอบ
    - คำตอบสุดท้ายจะถูกส่งโดยไม่มีข้อความการให้เหตุผล

  </Accordion>

  <Accordion title="การจัดรูปแบบและการย้อนกลับไปใช้ HTML">
    ข้อความขาออกใช้ Telegram `parse_mode: "HTML"`

    - ข้อความแบบคล้าย Markdown จะถูกเรนเดอร์เป็น HTML ที่ปลอดภัยสำหรับ Telegram
    - HTML ดิบจากโมเดลจะถูก escape เพื่อลดความล้มเหลวในการแยกวิเคราะห์ของ Telegram
    - หาก Telegram ปฏิเสธ HTML ที่แยกวิเคราะห์แล้ว OpenClaw จะลองใหม่เป็นข้อความธรรมดา

    พรีวิวลิงก์เปิดใช้ตามค่าเริ่มต้น และปิดได้ด้วย `channels.telegram.linkPreview: false`

  </Accordion>

  <Accordion title="คำสั่งเนทีฟและคำสั่งกำหนดเอง">
    การลงทะเบียนเมนูคำสั่งของ Telegram จะถูกจัดการตอนเริ่มต้นด้วย `setMyCommands`

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

    - ชื่อจะถูกทำให้เป็นรูปแบบมาตรฐาน (ตัด `/` นำหน้าออก, แปลงเป็นตัวพิมพ์เล็ก)
    - รูปแบบที่ถูกต้อง: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งกำหนดเองไม่สามารถแทนที่คำสั่งเนทีฟได้
    - รายการที่ขัดแย้ง/ซ้ำจะถูกข้ามและบันทึกลงล็อก

    หมายเหตุ:

    - คำสั่งกำหนดเองเป็นเพียงรายการเมนูเท่านั้น; ไม่ได้ติดตั้งพฤติกรรมให้อัตโนมัติ
    - คำสั่งของ plugin/skill ยังคงทำงานได้เมื่อพิมพ์ แม้จะไม่แสดงในเมนู Telegram

    หากปิดใช้คำสั่งเนทีฟ คำสั่งในตัวจะถูกนำออก คำสั่งกำหนดเอง/plugin อาจยังลงทะเบียนได้หากกำหนดค่าไว้

    ความล้มเหลวทั่วไปในการตั้งค่า:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังคงล้นหลังจากตัดรายการแล้ว; ลดจำนวนคำสั่ง plugin/skill/กำหนดเอง หรือปิดใช้ `channels.telegram.commands.native`
    - `deleteWebhook`, `deleteMyCommands` หรือ `setMyCommands` ล้มเหลวด้วย `404: Not Found` ขณะที่คำสั่ง curl โดยตรงไปยัง Bot API ทำงานได้ อาจหมายความว่า `channels.telegram.apiRoot` ถูกตั้งค่าเป็นปลายทางเต็ม `/bot<TOKEN>` แล้ว `apiRoot` ต้องเป็นเฉพาะรากของ Bot API เท่านั้น และ `openclaw doctor --fix` จะลบ `/bot<TOKEN>` ต่อท้ายที่เผลอใส่ไว้
    - `getMe returned 401` หมายความว่า Telegram ปฏิเสธโทเค็นบอตที่กำหนดค่าไว้ อัปเดต `botToken`, `tokenFile` หรือ `TELEGRAM_BOT_TOKEN` ด้วยโทเค็น BotFather ปัจจุบัน; OpenClaw จะหยุดก่อน polling ดังนั้นจะไม่ถูกรายงานเป็นความล้มเหลวในการล้าง Webhook
    - `setMyCommands failed` พร้อมข้อผิดพลาดเครือข่าย/fetch มักหมายความว่า DNS/HTTPS ขาออกไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งจับคู่อุปกรณ์ (plugin `device-pair`)

    เมื่อติดตั้ง plugin `device-pair`:

    1. `/pair` สร้างโค้ดตั้งค่า
    2. วางโค้ดในแอป iOS
    3. `/pair pending` แสดงรายการคำขอที่รอดำเนินการ (รวม role/scopes)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบระบุชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    โค้ดตั้งค่ามีโทเค็น bootstrap อายุสั้น การส่งต่อ bootstrap ในตัวจะคงโทเค็นโหนดหลักไว้ที่ `scopes: []`; โทเค็นผู้ปฏิบัติการใดๆ ที่ถูกส่งต่อจะยังถูกจำกัดอยู่ที่ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write` การตรวจสอบ scope ของ bootstrap มีคำนำหน้า role ดังนั้น allowlist ของผู้ปฏิบัติการนั้นจึงตอบสนองได้เฉพาะคำขอของผู้ปฏิบัติการเท่านั้น; role ที่ไม่ใช่ผู้ปฏิบัติการยังต้องมี scope ภายใต้คำนำหน้า role ของตนเอง

    หากอุปกรณ์ลองใหม่ด้วยรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (เช่น role/scopes/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` คนละค่า เรียก `/pair pending` อีกครั้งก่อนอนุมัติ

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

    `capabilities: ["inlineButtons"]` แบบเก่าจะ map เป็น `inlineButtons: "all"`

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

    การคลิก callback จะถูกส่งต่อไปยังเอเจนต์เป็นข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="action ข้อความ Telegram สำหรับเอเจนต์และระบบอัตโนมัติ">
    action ของเครื่องมือ Telegram ได้แก่:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    action ข้อความของช่องทางเปิดเผย alias ที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    ตัวควบคุมการกั้นการใช้งาน:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้)

    หมายเหตุ: ปัจจุบัน `edit` และ `topic-create` เปิดใช้ตามค่าเริ่มต้น และไม่มี toggle แยกใน `channels.telegram.actions.*`
    การส่งขณะรันใช้ snapshot ของ config/secrets ที่ใช้งานอยู่ (เริ่มต้น/โหลดใหม่) ดังนั้นเส้นทาง action จะไม่ทำการ resolve SecretRef แบบเฉพาะกิจใหม่ต่อการส่งแต่ละครั้ง

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

    เมื่อเปิดใช้เธรดการตอบกลับและมีข้อความหรือคำบรรยาย Telegram ต้นฉบับ OpenClaw จะใส่ข้อความคำพูดแบบเนทีฟของ Telegram โดยอัตโนมัติ Telegram จำกัดข้อความคำพูดแบบเนทีฟไว้ที่ 1024 code unit แบบ UTF-16 ดังนั้นข้อความที่ยาวกว่าจะถูกยกมาจากตอนต้น และจะย้อนกลับไปเป็นการตอบกลับแบบธรรมดาหาก Telegram ปฏิเสธคำพูดนั้น

    หมายเหตุ: `off` ปิดใช้เธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงถูกใช้งาน

  </Accordion>

  <Accordion title="หัวข้อฟอรัมและพฤติกรรมเธรด">
    ซูเปอร์กรุ๊ปแบบฟอรัม:

    - คีย์เซสชันหัวข้อต่อท้ายด้วย `:topic:<threadId>`
    - การตอบกลับและการแสดงว่ากำลังพิมพ์จะมุ่งไปยังเธรดหัวข้อ
    - เส้นทาง config ของหัวข้อ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของหัวข้อทั่วไป (`threadId=1`):

    - การส่งข้อความละเว้น `message_thread_id` (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - action การพิมพ์ยังใส่ `message_thread_id`

    การสืบทอดของหัวข้อ: รายการหัวข้อจะสืบทอดการตั้งค่ากลุ่ม เว้นแต่ถูกแทนที่ (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` ใช้เฉพาะหัวข้อและไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม

    **การกำหนดเส้นทางเอเจนต์รายหัวข้อ**: แต่ละหัวข้อสามารถกำหนดเส้นทางไปยังเอเจนต์คนละตัวได้โดยตั้งค่า `agentId` ใน config ของหัวข้อ วิธีนี้ทำให้แต่ละหัวข้อมี workspace, memory และเซสชันที่แยกเป็นของตัวเอง ตัวอย่าง:

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

    **การผูกหัวข้อ ACP แบบคงอยู่**: หัวข้อฟอรัมสามารถ pin เซสชัน harness ของ ACP ผ่านการผูก ACP แบบมีชนิดที่ระดับบนสุด (`bindings[]` พร้อม `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ ID ที่ระบุหัวข้อ เช่น `-1001234567890:topic:42`) ปัจจุบันจำกัดขอบเขตไว้ที่หัวข้อฟอรัมในกลุ่ม/ซูเปอร์กรุ๊ป ดู [เอเจนต์ ACP](/th/tools/acp-agents)

    **การ spawn ACP ที่ผูกกับเธรดจากแชต**: `/acp spawn <agent> --thread here|auto` ผูกหัวข้อปัจจุบันกับเซสชัน ACP ใหม่; ข้อความต่อๆ ไปจะถูกกำหนดเส้นทางไปที่นั่นโดยตรง OpenClaw จะ pin การยืนยันการ spawn ในหัวข้อ ต้องให้ `channels.telegram.threadBindings.spawnSessions` เปิดใช้อยู่ (ค่าเริ่มต้น: `true`)

    บริบทเทมเพลตเปิดเผย `MessageThreadId` และ `IsForum` แชต DM ที่มี `message_thread_id` จะคงการกำหนดเส้นทาง DM และเมทาดาทาการตอบกลับไว้บนเซสชันแบบ flat ตามค่าเริ่มต้น; จะใช้คีย์เซสชันที่รับรู้เธรดก็ต่อเมื่อกำหนดค่าด้วย `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` หรือ config หัวข้อที่ตรงกัน ใช้ `channels.telegram.dm.threadReplies` ระดับบนสุดสำหรับค่าเริ่มต้นของบัญชี หรือ `direct.<chatId>.threadReplies` สำหรับ DM หนึ่งรายการ

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยกความแตกต่างระหว่างบันทึกเสียงกับไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมไฟล์เสียง
    - แท็ก `[[audio_as_voice]]` ในการตอบกลับของเอเจนต์เพื่อบังคับส่งเป็นบันทึกเสียง
    - ทรานสคริปต์บันทึกเสียงขาเข้าจะถูกจัดกรอบเป็นข้อความที่เครื่องสร้างขึ้น
      และไม่น่าเชื่อถือในบริบทของเอเจนต์; การตรวจจับการกล่าวถึงยังคงใช้ทรานสคริปต์
      ดิบ ดังนั้นข้อความเสียงที่ถูกกั้นด้วยการกล่าวถึงจึงยังทำงานต่อไปได้

    ตัวอย่าง action ของข้อความ:

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

    ตัวอย่าง action ของข้อความ:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    วิดีโอโน้ตไม่รองรับคำบรรยายภาพ ข้อความที่ให้มาจะถูกส่งแยกต่างหาก

    ### สติกเกอร์

    การจัดการสติกเกอร์ขาเข้า:

    - WEBP แบบคงที่: ดาวน์โหลดและประมวลผลแล้ว (placeholder `<media:sticker>`)
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

    สติกเกอร์จะถูกอธิบายหนึ่งครั้ง (เมื่อทำได้) และถูกแคชไว้เพื่อลดการเรียก vision ซ้ำ

    เปิดใช้ action สำหรับสติกเกอร์:

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

    action สำหรับส่งสติกเกอร์:

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

  <Accordion title="การแจ้งเตือน Reaction">
    Reaction ของ Telegram จะมาถึงเป็นการอัปเดต `message_reaction` (แยกจาก payload ของข้อความ)

    เมื่อเปิดใช้ OpenClaw จะจัดคิวเหตุการณ์ระบบ เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึง reaction ของผู้ใช้ต่อข้อความที่บอตส่งเท่านั้น (แบบ best-effort ผ่านแคชข้อความที่ส่งแล้ว)
    - เหตุการณ์ reaction ยังคงเคารพการควบคุมสิทธิ์เข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ให้ thread ID ในการอัปเดต reaction
      - กลุ่มที่ไม่ใช่ forum จะ route ไปยัง session แชตกลุ่ม
      - กลุ่ม forum จะ route ไปยัง session หัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อต้นทางที่แน่นอน

    `allowed_updates` สำหรับ polling/webhook จะรวม `message_reaction` โดยอัตโนมัติ

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback เป็นอีโมจิ identity ของเอเจนต์ (`agents.list[].identity.emoji` มิฉะนั้นใช้ "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิ Unicode (เช่น "👀")
    - ใช้ `""` เพื่อปิดใช้งาน reaction สำหรับ channel หรือบัญชี

  </Accordion>

  <Accordion title="การเขียน Config จากเหตุการณ์และคำสั่งของ Telegram">
    การเขียน config ของ channel เปิดใช้โดยค่าเริ่มต้น (`configWrites !== false`)

    การเขียนที่ถูก trigger จาก Telegram ได้แก่:

    - เหตุการณ์การย้ายกลุ่ม (`migrate_to_chat_id`) เพื่ออัปเดต `channels.telegram.groups`
    - `/config set` และ `/config unset` (ต้องเปิดใช้คำสั่ง)

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
    ค่าเริ่มต้นคือ long polling สำหรับโหมด webhook ให้ตั้งค่า `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; ตัวเลือกเพิ่มเติมคือ `webhookPath`, `webhookHost`, `webhookPort` (ค่าเริ่มต้น `/telegram-webhook`, `127.0.0.1`, `8787`)

    listener ในเครื่อง bind กับ `127.0.0.1:8787` สำหรับ public ingress ให้ใส่ reverse proxy ไว้หน้าพอร์ตในเครื่อง หรือตั้งค่า `webhookHost: "0.0.0.0"` อย่างตั้งใจ

    โหมด Webhook จะตรวจสอบ request guard, secret token ของ Telegram และ body JSON ก่อนส่งคืน `200` ให้ Telegram
    จากนั้น OpenClaw จะประมวลผลการอัปเดตแบบ asynchronous ผ่าน bot lane ต่อแชต/ต่อหัวข้อเดียวกับที่ long polling ใช้ ดังนั้น agent turn ที่ช้าจะไม่ทำให้ ACK การส่งของ Telegram ค้างอยู่

  </Accordion>

  <Accordion title="ขีดจำกัด การ retry และเป้าหมาย CLI">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` จะให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนแยกตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ขาเข้าและขาออก
    - `channels.telegram.mediaGroupFlushMs` (ค่าเริ่มต้น 500) ควบคุมระยะเวลาที่อัลบั้ม/กลุ่มสื่อของ Telegram จะถูก buffer ก่อนที่ OpenClaw จะ dispatch เป็นข้อความขาเข้าหนึ่งข้อความ เพิ่มค่านี้หากส่วนต่าง ๆ ของอัลบั้มมาถึงช้า ลดค่านี้เพื่อลด latency ของการตอบกลับอัลบั้ม
    - `channels.telegram.timeoutSeconds` override timeout ของไคลเอนต์ Telegram API (หากไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY) ไคลเอนต์บอตจะ clamp ค่าที่ config ไว้ซึ่งต่ำกว่า guard 60 วินาทีสำหรับ request ข้อความ/typing ขาออก เพื่อให้ grammY ไม่ abort การส่ง reply ที่มองเห็นได้ก่อนที่ transport guard และ fallback ของ OpenClaw จะทำงาน Long polling ยังคงใช้ guard 45 วินาทีสำหรับ request `getUpdates` เพื่อไม่ให้ idle poll ถูกปล่อยทิ้งไว้อย่างไม่มีกำหนด
    - ค่าเริ่มต้นของ `channels.telegram.pollingStallThresholdMs` คือ `120000`; ปรับระหว่าง `30000` ถึง `600000` เฉพาะสำหรับการ restart จาก polling-stall แบบ false positive
    - ประวัติบริบทกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` คือปิดใช้งาน
    - บริบทเสริมของ reply/quote/forward ปัจจุบันจะถูกส่งต่อตามที่ได้รับ
    - allowlist ของ Telegram หลัก ๆ ใช้ gate ว่าใคร trigger เอเจนต์ได้ ไม่ใช่ขอบเขตการลบข้อมูลบริบทเสริมแบบเต็ม
    - ตัวควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - config `channels.telegram.retry` ใช้กับ helper ส่ง Telegram (CLI/tools/actions) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้ การส่ง final-reply ขาเข้าก็ใช้ safe-send retry แบบมีขอบเขตสำหรับความล้มเหลว pre-connect ของ Telegram เช่นกัน แต่จะไม่ retry envelope เครือข่ายหลังส่งที่กำกวมซึ่งอาจทำให้ข้อความที่มองเห็นได้ซ้ำกัน

    เป้าหมายการส่งของ CLI เป็น numeric chat ID หรือ username ได้:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    poll ของ Telegram ใช้ `openclaw message poll` และรองรับหัวข้อ forum:

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
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอการส่งแบบปักหมุดเมื่อบอตปักหมุดในแชตนั้นได้
    - `--force-document` เพื่อส่งรูปภาพและ GIF ขาออกเป็นเอกสารแทนการอัปโหลดแบบภาพถ่ายที่บีบอัดหรือสื่อเคลื่อนไหว

    การ gate action:

    - `channels.telegram.actions.sendMessage=false` ปิดใช้งานข้อความ Telegram ขาออก รวมถึง poll
    - `channels.telegram.actions.poll=false` ปิดใช้งานการสร้าง poll ของ Telegram แต่ยังเปิดใช้การส่งปกติไว้

  </Accordion>

  <Accordion title="การอนุมัติ Exec ใน Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถโพสต์ prompt ในแชตหรือหัวข้อต้นทางได้ตามต้องการ ผู้อนุมัติต้องเป็น numeric Telegram user ID

    path ของ config:

    - `channels.telegram.execApprovals.enabled` (เปิดใช้โดยอัตโนมัติเมื่อ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งคน)
    - `channels.telegram.execApprovals.approvers` (fallback ไปยัง numeric owner ID จาก `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` และ `defaultTo` ควบคุมว่าใครคุยกับบอตได้ และบอตส่ง reply ปกติไปที่ใด สิ่งเหล่านี้ไม่ได้ทำให้ใครเป็นผู้อนุมัติ exec การจับคู่ DM ที่ได้รับอนุมัติครั้งแรกจะ bootstrap `commands.ownerAllowFrom` เมื่อยังไม่มีเจ้าของคำสั่ง ดังนั้นการตั้งค่าเจ้าของหนึ่งคนยังทำงานได้โดยไม่ต้องใส่ ID ซ้ำใต้ `execApprovals.approvers`

    การส่งไปยัง channel จะแสดงข้อความคำสั่งในแชต เปิดใช้ `channel` หรือ `both` เฉพาะในกลุ่ม/หัวข้อที่เชื่อถือได้เท่านั้น เมื่อ prompt ไปถึงหัวข้อ forum OpenClaw จะรักษาหัวข้อนั้นไว้สำหรับ prompt การอนุมัติและข้อความติดตาม การอนุมัติ exec หมดอายุหลังจาก 30 นาทีโดยค่าเริ่มต้น

    ปุ่มอนุมัติแบบ inline ยังต้องให้ `channels.telegram.capabilities.inlineButtons` อนุญาต surface เป้าหมาย (`dm`, `group` หรือ `all`) ด้วย ID การอนุมัติที่ขึ้นต้นด้วย `plugin:` จะ resolve ผ่านการอนุมัติของ plugin ส่วน ID อื่นจะ resolve ผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ Exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## ตัวควบคุมการตอบกลับข้อผิดพลาด

เมื่อเอเจนต์พบข้อผิดพลาดการส่งหรือ provider Telegram สามารถตอบกลับด้วยข้อความข้อผิดพลาดหรือระงับไว้ได้ มี config key สองรายการที่ควบคุมพฤติกรรมนี้:

| Key                                 | Values            | ค่าเริ่มต้น | คำอธิบาย                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` ส่งข้อความข้อผิดพลาดที่เป็นมิตรไปยังแชต `silent` ระงับการตอบกลับข้อผิดพลาดทั้งหมด |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | เวลาขั้นต่ำระหว่างการตอบกลับข้อผิดพลาดไปยังแชตเดียวกัน ป้องกัน spam ข้อผิดพลาดระหว่างเหตุขัดข้อง        |

รองรับ override ต่อบัญชี ต่อกลุ่ม และต่อหัวข้อ (ใช้การสืบทอดเดียวกับ config key อื่นของ Telegram)

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
  <Accordion title="บอตไม่ตอบสนองต่อข้อความกลุ่มที่ไม่ mention">

    - หาก `requireMention=false` โหมด privacy ของ Telegram ต้องอนุญาตการมองเห็นแบบเต็ม
      - BotFather: `/setprivacy` -> Disable
      - จากนั้นลบ + เพิ่มบอตกลับเข้ากลุ่ม
    - `openclaw channels status` จะเตือนเมื่อ config คาดหวังข้อความกลุ่มที่ไม่ได้ mention
    - `openclaw channels status --probe` ตรวจสอบ numeric group ID ที่ระบุชัดได้ wildcard `"*"` ไม่สามารถ probe membership ได้
    - ทดสอบ session แบบเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอตไม่เห็นข้อความกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` กลุ่มต้องอยู่ในรายการ (หรือรวม `"*"`)
    - ตรวจสอบ membership ของบอตในกลุ่ม
    - ตรวจสอบ log: `openclaw logs --follow` เพื่อดูเหตุผลที่ข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานบางส่วนหรือไม่ทำงานเลย">

    - อนุญาต identity ของผู้ส่งของคุณ (การจับคู่และ/หรือ numeric `allowFrom`)
    - การอนุญาตคำสั่งยังคงมีผลแม้เมื่อ policy ของกลุ่มเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู native มีรายการมากเกินไป ลดคำสั่ง plugin/skill/custom หรือปิดใช้งานเมนู native
    - การเรียก startup `deleteMyCommands` / `setMyCommands` และการเรียก typing `sendChatAction` ถูกจำกัดเวลาและ retry หนึ่งครั้งผ่าน transport fallback ของ Telegram เมื่อ request timeout ข้อผิดพลาด network/fetch ที่เกิดซ้ำมักบ่งชี้ปัญหา DNS/HTTPS reachability ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="Startup รายงาน token ไม่ได้รับอนุญาต">

    - `getMe returned 401` คือความล้มเหลวในการยืนยันตัวตนของ Telegram สำหรับโทเค็นบอตที่กำหนดค่าไว้
    - คัดลอกใหม่หรือสร้างโทเค็นบอตใหม่ใน BotFather จากนั้นอัปเดต `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` หรือ `TELEGRAM_BOT_TOKEN` สำหรับบัญชีเริ่มต้น
    - `deleteWebhook 401 Unauthorized` ระหว่างการเริ่มต้นก็เป็นความล้มเหลวในการยืนยันตัวตนเช่นกัน การถือว่าเป็น "ไม่มี webhook อยู่" จะเพียงเลื่อนความล้มเหลวจากโทเค็นที่ผิดเดิมไปยังการเรียก API ภายหลังเท่านั้น

  </Accordion>

  <Accordion title="ความไม่เสถียรของ polling หรือเครือข่าย">

    - Node 22+ + fetch/proxy แบบกำหนดเองอาจทำให้เกิดพฤติกรรมยกเลิกทันทีหากชนิด AbortSignal ไม่ตรงกัน
    - โฮสต์บางตัว resolve `api.telegram.org` เป็น IPv6 ก่อน egress IPv6 ที่เสียอาจทำให้ Telegram API ล้มเหลวเป็นครั้งคราว
    - หาก log มี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!` ตอนนี้ OpenClaw จะลองใหม่โดยถือว่าเป็นข้อผิดพลาดเครือข่ายที่กู้คืนได้
    - ระหว่างการเริ่มต้น polling, OpenClaw จะใช้ probe `getMe` ตอนเริ่มต้นที่สำเร็จซ้ำสำหรับ grammY เพื่อให้ runner ไม่ต้องใช้ `getMe` ครั้งที่สองก่อน `getUpdates` ครั้งแรก
    - หาก `deleteWebhook` ล้มเหลวด้วยข้อผิดพลาดเครือข่ายชั่วคราวระหว่างการเริ่มต้น polling, OpenClaw จะทำ long polling ต่อแทนการเรียก control-plane ก่อน poll อีกครั้ง หากยังมี webhook ที่ใช้งานอยู่ จะปรากฏเป็นความขัดแย้งของ `getUpdates`; จากนั้น OpenClaw จะสร้าง transport ของ Telegram ใหม่และลองล้าง webhook อีกครั้ง
    - หาก socket ของ Telegram ถูกรีไซเคิลตามรอบคงที่สั้น ๆ ให้ตรวจสอบว่า `channels.telegram.timeoutSeconds` ต่ำหรือไม่; client บอตจะ clamp ค่าที่กำหนดไว้ให้ไม่ต่ำกว่า guard ของคำขอ outbound และ `getUpdates` แต่ release เก่าอาจยกเลิกทุก poll หรือ reply เมื่อค่านี้ถูกตั้งต่ำกว่า guard เหล่านั้น
    - หาก log มี `Polling stall detected` โดยค่าเริ่มต้น OpenClaw จะเริ่ม polling ใหม่และสร้าง transport ของ Telegram ใหม่หลังจาก 120 วินาทีโดยไม่มี liveness ของ long-poll ที่เสร็จสมบูรณ์
    - `openclaw channels status --probe` และ `openclaw doctor` จะเตือนเมื่อบัญชี polling ที่กำลังทำงานยังทำ `getUpdates` ไม่เสร็จหลังช่วงผ่อนผันการเริ่มต้น เมื่อบัญชี webhook ที่กำลังทำงานยังทำ `setWebhook` ไม่เสร็จหลังช่วงผ่อนผันการเริ่มต้น หรือเมื่อกิจกรรม transport ของ polling ที่สำเร็จครั้งล่าสุดเก่าเกินไป
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่ทำงานนานยังปกติ แต่โฮสต์ของคุณยังรายงานการรีสตาร์ทจาก polling-stall ผิดพลาดอยู่ การ stall ต่อเนื่องมักชี้ไปที่ปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่างโฮสต์กับ `api.telegram.org`
    - Telegram ยังเคารพ env proxy ของ process สำหรับ transport ของ Bot API รวมถึง `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และตัวแปรตัวพิมพ์เล็กของรายการเหล่านี้ `NO_PROXY` / `no_proxy` ยังสามารถ bypass `api.telegram.org` ได้
    - หากกำหนดค่า proxy ที่ OpenClaw จัดการผ่าน `OPENCLAW_PROXY_URL` สำหรับสภาพแวดล้อมบริการ และไม่มี env proxy มาตรฐานอยู่ Telegram จะใช้ URL นั้นสำหรับ transport ของ Bot API ด้วย
    - บนโฮสต์ VPS ที่มี egress/TLS โดยตรงไม่เสถียร ให้ route การเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ มีค่าเริ่มต้นเป็น `autoSelectFamily=true` (ยกเว้น WSL2) ลำดับผลลัพธ์ DNS ของ Telegram จะเคารพ `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER` ก่อน จากนั้น `channels.telegram.network.dnsResultOrder` แล้วจึงเป็นค่าเริ่มต้นของ process เช่น `NODE_OPTIONS=--dns-result-order=ipv4first`; หากไม่มีรายการใดใช้ได้ Node 22+ จะ fallback เป็น `ipv4first`
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนด้วยพฤติกรรม IPv4-only ให้บังคับการเลือก family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบช่วง benchmark ของ RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาต
      สำหรับการดาวน์โหลดสื่อ Telegram ตามค่าเริ่มต้นอยู่แล้ว หาก fake-IP ที่เชื่อถือได้หรือ
      proxy แบบโปร่งใสเขียน `api.telegram.org` ใหม่เป็นที่อยู่
      private/internal/special-use อื่นระหว่างการดาวน์โหลดสื่อ คุณสามารถ opt
      in เข้า bypass เฉพาะ Telegram ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - opt-in เดียวกันนี้ใช้ได้ต่อบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หาก proxy ของคุณ resolve โฮสต์สื่อ Telegram เป็น `198.18.x.x` ให้ปิด
      flag อันตรายไว้ก่อน สื่อ Telegram อนุญาตช่วง benchmark RFC 2544
      ตามค่าเริ่มต้นอยู่แล้ว

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` ทำให้การป้องกัน
      SSRF ของสื่อ Telegram อ่อนลง ใช้เฉพาะกับสภาพแวดล้อม proxy ที่ผู้ปฏิบัติการควบคุมและเชื่อถือได้
      เช่น Clash, Mihomo หรือ Surge fake-IP routing เมื่อระบบเหล่านั้น
      สร้างคำตอบ private หรือ special-use นอกช่วง benchmark RFC 2544
      ปล่อยให้ปิดไว้สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ
    </Warning>

    - การ override ด้วย environment (ชั่วคราว):
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

## อ้างอิงการกำหนดค่า

อ้างอิงหลัก: [อ้างอิงการกำหนดค่า - Telegram](/th/gateway/config-channels#telegram)

<Accordion title="ฟิลด์ Telegram ที่ให้สัญญาณสูง">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; symlink จะถูกปฏิเสธ)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- การอนุมัติ exec: `execApprovals`, `accounts.*.execApprovals`
- คำสั่ง/เมนู: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/replies: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- การจัดรูปแบบ/การส่งมอบ: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- สื่อ/เครือข่าย: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- root API แบบกำหนดเอง: `apiRoot` (เฉพาะ root ของ Bot API เท่านั้น; อย่าใส่ `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions: `reactionNotifications`, `reactionLevel`
- ข้อผิดพลาด: `errorPolicy`, `errorCooldownMs`
- การเขียน/ประวัติ: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญของหลายบัญชี: เมื่อกำหนดค่า ID บัญชีตั้งแต่สองรายการขึ้นไป ให้ตั้ง `channels.telegram.defaultAccount` (หรือใส่ `channels.telegram.accounts.default`) เพื่อทำให้ routing เริ่มต้นชัดเจน มิฉะนั้น OpenClaw จะ fallback ไปยัง ID บัญชีที่ normalize แล้วรายการแรก และ `openclaw doctor` จะเตือน บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom` แต่ไม่สืบทอดค่า `accounts.default.*`
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Telegram กับ gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรม allowlist ของกลุ่มและหัวข้อ
  </Card>
  <Card title="Channel routing" icon="route" href="/th/channels/channel-routing">
    Route ข้อความขาเข้าไปยัง agent
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    threat model และการ hardening
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/th/concepts/multi-agent">
    map กลุ่มและหัวข้อไปยัง agent
  </Card>
  <Card title="การแก้ไขปัญหา" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้าม channel
  </Card>
</CardGroup>
