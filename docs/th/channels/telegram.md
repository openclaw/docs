---
read_when:
    - การทำงานกับฟีเจอร์ของ Telegram หรือ Webhook
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของบอต Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-30T09:39:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ffc0c1a6bb94fbab81ede0f08b0e3a165f06c599d4d06d4b9e70c8ba41121f7
    source_path: channels/telegram.md
    workflow: 16
---

พร้อมใช้งานจริงสำหรับ DM ของบอตและกลุ่มผ่าน grammY โหมดเริ่มต้นคือ long polling ส่วนโหมด webhook เป็นทางเลือก

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
    เปิด Telegram แล้วแชตกับ **@BotFather** (ยืนยันว่าแฮนเดิลเป็น `@BotFather` ตรงตามนี้)

    รัน `/newbot` ทำตามพรอมต์ แล้วบันทึกโทเค็นไว้

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

    โค้ดการจับคู่หมดอายุหลังจาก 1 ชั่วโมง

  </Step>

  <Step title="เพิ่มบอตลงในกลุ่ม">
    เพิ่มบอตลงในกลุ่มของคุณ จากนั้นตั้งค่า `channels.telegram.groups` และ `groupPolicy` ให้ตรงกับโมเดลการเข้าถึงของคุณ
  </Step>
</Steps>

<Note>
ลำดับการ resolve โทเค็นคำนึงถึงบัญชี ในทางปฏิบัติ ค่าจาก config จะชนะค่า fallback จาก env และ `TELEGRAM_BOT_TOKEN` จะใช้กับบัญชีเริ่มต้นเท่านั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="โหมดความเป็นส่วนตัวและการมองเห็นกลุ่ม">
    บอต Telegram มีค่าเริ่มต้นเป็น **Privacy Mode** ซึ่งจำกัดข้อความในกลุ่มที่บอตจะได้รับ

    หากบอตต้องเห็นข้อความทั้งหมดในกลุ่ม ให้ทำอย่างใดอย่างหนึ่ง:

    - ปิดโหมดความเป็นส่วนตัวผ่าน `/setprivacy` หรือ
    - ตั้งบอตเป็นผู้ดูแลกลุ่ม

    เมื่อสลับโหมดความเป็นส่วนตัว ให้ลบและเพิ่มบอตกลับเข้าไปใหม่ในแต่ละกลุ่มเพื่อให้ Telegram นำการเปลี่ยนแปลงไปใช้

  </Accordion>

  <Accordion title="สิทธิ์ของกลุ่ม">
    สถานะผู้ดูแลถูกควบคุมในการตั้งค่ากลุ่มของ Telegram

    บอตที่เป็นผู้ดูแลจะได้รับข้อความทั้งหมดในกลุ่ม ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มที่เปิดทำงานตลอดเวลา

  </Accordion>

  <Accordion title="ตัวสลับ BotFather ที่มีประโยชน์">

    - `/setjoingroups` เพื่ออนุญาต/ปฏิเสธการเพิ่มลงกลุ่ม
    - `/setprivacy` สำหรับพฤติกรรมการมองเห็นกลุ่ม

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

    `dmPolicy: "open"` พร้อม `allowFrom: ["*"]` ทำให้บัญชี Telegram ใดก็ตามที่พบหรือเดาชื่อผู้ใช้บอตได้สามารถสั่งงานบอตได้ ใช้เฉพาะกับบอตสาธารณะที่ตั้งใจเปิดให้ใช้จริงและมีเครื่องมือที่ถูกจำกัดอย่างเข้มงวดเท่านั้น บอตเจ้าของคนเดียวควรใช้ `allowlist` พร้อม ID ผู้ใช้แบบตัวเลข

    `channels.telegram.allowFrom` รับ ID ผู้ใช้ Telegram แบบตัวเลข คำนำหน้า `telegram:` / `tg:` ใช้ได้และจะถูกทำให้เป็นรูปแบบปกติ
    ใน config หลายบัญชี `channels.telegram.allowFrom` ระดับบนสุดที่จำกัดเข้มงวดจะถือเป็นขอบเขตความปลอดภัย: รายการ `allowFrom: ["*"]` ระดับบัญชีจะไม่ทำให้บัญชีนั้นเป็นสาธารณะ เว้นแต่ว่า allowlist ที่มีผลของบัญชียังคงมี wildcard ชัดเจนหลังจากรวมค่าแล้ว
    `dmPolicy: "allowlist"` ที่มี `allowFrom` ว่างจะบล็อก DM ทั้งหมดและถูกปฏิเสธโดยการตรวจสอบ config
    การตั้งค่าจะถามเฉพาะ ID ผู้ใช้แบบตัวเลขเท่านั้น
    หากคุณอัปเกรดแล้ว config ของคุณมีรายการ allowlist แบบ `@username` ให้รัน `openclaw doctor --fix` เพื่อ resolve รายการเหล่านั้น (พยายามทำให้ดีที่สุด ต้องใช้โทเค็นบอต Telegram)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์ allowlist ของ pairing store, `openclaw doctor --fix` สามารถกู้คืนรายการเข้าไปใน `channels.telegram.allowFrom` ในโฟลว์ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID ที่ระบุชัดเจน)

    สำหรับบอตเจ้าของคนเดียว แนะนำให้ใช้ `dmPolicy: "allowlist"` พร้อม ID `allowFrom` แบบตัวเลขที่ระบุชัดเจน เพื่อให้นโยบายการเข้าถึงคงทนใน config (แทนที่จะพึ่งพาการอนุมัติการจับคู่ก่อนหน้า)

    ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่ได้หมายความว่า "ผู้ส่งนี้ได้รับอนุญาตทุกที่"
    การจับคู่ให้สิทธิ์เข้าถึง DM หากยังไม่มีเจ้าของคำสั่ง การจับคู่ที่อนุมัติครั้งแรกจะตั้งค่า `commands.ownerAllowFrom` ด้วย เพื่อให้คำสั่งสำหรับเจ้าของเท่านั้นและการอนุมัติ exec มีบัญชีผู้ปฏิบัติการที่ระบุชัดเจน
    การอนุญาตผู้ส่งในกลุ่มยังคงมาจาก allowlist ใน config ที่ระบุชัดเจน
    หากคุณต้องการ "ฉันได้รับอนุญาตครั้งเดียว แล้วทั้ง DM และคำสั่งกลุ่มใช้งานได้" ให้ใส่ ID ผู้ใช้ Telegram แบบตัวเลขของคุณใน `channels.telegram.allowFrom`; สำหรับคำสั่งเฉพาะเจ้าของ ตรวจสอบให้แน่ใจว่า `commands.ownerAllowFrom` มี `telegram:<your user id>`

    ### การหา ID ผู้ใช้ Telegram ของคุณ

    วิธีที่ปลอดภัยกว่า (ไม่ใช้บอตบุคคลที่สาม):

    1. DM ไปหาบอตของคุณ
    2. รัน `openclaw logs --follow`
    3. อ่าน `from.id`

    วิธี Bot API ทางการ:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="นโยบายกลุ่มและ allowlist">
    มีการควบคุมสองอย่างที่ใช้ร่วมกัน:

    1. **กลุ่มใดได้รับอนุญาต** (`channels.telegram.groups`)
       - ไม่มี config `groups`:
         - เมื่อใช้ `groupPolicy: "open"`: กลุ่มใดก็ผ่านการตรวจสอบ ID กลุ่มได้
         - เมื่อใช้ `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการ `groups` (หรือ `"*"`)
       - กำหนดค่า `groups` แล้ว: ทำหน้าที่เป็น allowlist (ID ที่ระบุชัดเจนหรือ `"*"`)

    2. **ผู้ส่งใดได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่าไว้ Telegram จะ fallback ไปใช้ `allowFrom`
    รายการ `groupAllowFrom` ควรเป็น ID ผู้ใช้ Telegram แบบตัวเลข (คำนำหน้า `telegram:` / `tg:` จะถูกทำให้เป็นรูปแบบปกติ)
    อย่าใส่ ID แชตกลุ่มหรือ supergroup ของ Telegram ใน `groupAllowFrom` ID แชตที่เป็นลบต้องอยู่ใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเว้นสำหรับการอนุญาตผู้ส่ง
    ขอบเขตความปลอดภัย (`2026.2.25+`): การยืนยันสิทธิ์ผู้ส่งในกลุ่ม **ไม่** สืบทอดการอนุมัติจาก pairing store ของ DM
    การจับคู่ยังคงเป็นเฉพาะ DM สำหรับกลุ่ม ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` รายกลุ่ม/รายหัวข้อ
    หากไม่ได้ตั้งค่า `groupAllowFrom`, Telegram จะ fallback ไปใช้ `allowFrom` ใน config ไม่ใช่ pairing store
    รูปแบบที่ใช้ได้จริงสำหรับบอตเจ้าของคนเดียว: ตั้งค่า ID ผู้ใช้ของคุณใน `channels.telegram.allowFrom`, ปล่อย `groupAllowFrom` ไว้ไม่ต้องตั้งค่า และอนุญาตกลุ่มเป้าหมายใต้ `channels.telegram.groups`
    หมายเหตุ runtime: หาก `channels.telegram` หายไปทั้งหมด runtime จะมีค่าเริ่มต้นเป็น fail-closed `groupPolicy="allowlist"` เว้นแต่จะตั้งค่า `channels.defaults.groupPolicy` ไว้อย่างชัดเจน

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

      - ใส่ ID แชตกลุ่มหรือ supergroup ของ Telegram ที่เป็นลบ เช่น `-1001234567890` ใต้ `channels.telegram.groups`
      - ใส่ ID ผู้ใช้ Telegram เช่น `8734062810` ใต้ `groupAllowFrom` เมื่อคุณต้องการจำกัดว่าคนใดในกลุ่มที่ได้รับอนุญาตสามารถเรียกบอตได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกใดก็ได้ของกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอตได้

    </Warning>

  </Tab>

  <Tab title="พฤติกรรมการกล่าวถึง">
    การตอบกลับในกลุ่มต้องมีการกล่าวถึงโดยค่าเริ่มต้น

    การกล่าวถึงอาจมาจาก:

    - การกล่าวถึง `@botusername` แบบ native หรือ
    - รูปแบบการกล่าวถึงใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    ตัวสลับคำสั่งระดับเซสชัน:

    - `/activation always`
    - `/activation mention`

    สิ่งเหล่านี้อัปเดตเฉพาะสถานะเซสชัน ใช้ config เพื่อให้คงอยู่ถาวร

    ตัวอย่าง config แบบคงอยู่ถาวร:

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

- Telegram อยู่ภายใต้การดูแลของกระบวนการ gateway
- การกำหนดเส้นทางเป็นแบบ deterministic: ข้อความขาเข้าจาก Telegram จะตอบกลับไปยัง Telegram (โมเดลไม่ได้เลือกช่องทาง)
- ข้อความขาเข้าจะถูกทำให้เป็นรูปแบบปกติใน envelope ช่องทางร่วม พร้อม metadata การตอบกลับและ placeholder ของสื่อ
- เซสชันกลุ่มถูกแยกตาม ID กลุ่ม หัวข้อฟอรัมจะต่อท้าย `:topic:<threadId>` เพื่อแยกหัวข้อออกจากกัน
- ข้อความ DM สามารถมี `message_thread_id`; OpenClaw จะกำหนดเส้นทางด้วยคีย์เซสชันที่รับรู้ thread และคง ID thread ไว้สำหรับการตอบกลับ
- Long polling ใช้ grammY runner พร้อมการจัดลำดับตามแชต/ตาม thread concurrency โดยรวมของ runner sink ใช้ `agents.defaults.maxConcurrent`
- Long polling ถูก guard ภายในแต่ละกระบวนการ gateway เพื่อให้มี poller ที่ใช้งานอยู่เพียงตัวเดียวเท่านั้นที่ใช้โทเค็นบอตได้ในแต่ละครั้ง หากคุณยังเห็นข้อขัดแย้ง `getUpdates` 409 แสดงว่า gateway ของ OpenClaw อื่น สคริปต์ หรือ poller ภายนอกน่าจะกำลังใช้โทเค็นเดียวกัน
- การรีสตาร์ทโดย watchdog ของ long-polling จะ trigger หลังจากไม่มี liveness ของ `getUpdates` ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีโดยค่าเริ่มต้น เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อ deployment ของคุณยังพบการรีสตาร์ท polling-stall ผิดพลาดระหว่างงานที่ใช้เวลานาน ค่านี้เป็นมิลลิวินาทีและอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับ override รายบัญชี
- Telegram Bot API ไม่รองรับ read-receipt (`sendReadReceipts` ไม่เกี่ยวข้อง)

## อ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="พรีวิวสตรีมสด (การแก้ไขข้อความ)">
    OpenClaw สามารถสตรีมการตอบกลับบางส่วนแบบเรียลไทม์:

    - แชตโดยตรง: ข้อความพรีวิว + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความพรีวิว + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` เป็น `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - `progress` map เป็น `partial` บน Telegram (compat กับการตั้งชื่อข้ามช่องทาง)
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดต tool/progress จะใช้ข้อความพรีวิวที่แก้ไขเดิมซ้ำหรือไม่ (ค่าเริ่มต้น: `true` เมื่อ preview streaming เปิดใช้งาน)
    - ตรวจพบ `channels.telegram.streamMode` แบบ legacy และค่า boolean ของ `streaming`; รัน `openclaw doctor --fix` เพื่อ migrate ไปยัง `channels.telegram.streaming.mode`

    การอัปเดตพรีวิว tool-progress คือบรรทัดสั้น ๆ "กำลังทำงาน..." ที่แสดงขณะเครื่องมือทำงาน เช่น การดำเนินการคำสั่ง การอ่านไฟล์ การอัปเดตการวางแผน หรือสรุป patch Telegram เปิดใช้งานสิ่งเหล่านี้โดยค่าเริ่มต้นเพื่อให้ตรงกับพฤติกรรม OpenClaw ที่เผยแพร่ตั้งแต่ `v2026.4.22` เป็นต้นไป หากต้องการคงพรีวิวที่แก้ไขไว้สำหรับข้อความคำตอบ แต่ซ่อนบรรทัด tool-progress ให้ตั้งค่า:

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

    ใช้ `streaming.mode: "off"` เฉพาะเมื่อคุณต้องการการส่งเฉพาะคำตอบสุดท้าย: การแก้ไขพรีวิวของ Telegram จะถูกปิดใช้งาน และข้อความทั่วไปเกี่ยวกับ tool/progress จะถูกระงับแทนที่จะถูกส่งเป็นข้อความ "กำลังทำงาน..." แบบแยกเดี่ยว พรอมต์อนุมัติ payload สื่อ และข้อผิดพลาดยังคงถูกส่งผ่านการส่งผลลัพธ์สุดท้ายตามปกติ ใช้ `streaming.preview.toolProgress: false` เมื่อคุณต้องการคงเฉพาะการแก้ไขพรีวิวคำตอบไว้ พร้อมซ่อนบรรทัดสถานะ tool-progress

    สำหรับการตอบกลับแบบข้อความเท่านั้น:

    - พรีวิว DM/กลุ่ม/หัวข้อแบบสั้น: OpenClaw เก็บข้อความพรีวิวเดิมไว้และแก้ไขขั้นสุดท้ายในตำแหน่งเดิม
    - พรีวิวที่เก่ากว่าประมาณหนึ่งนาที: OpenClaw ส่งคำตอบที่เสร็จสมบูรณ์เป็นข้อความสุดท้ายใหม่ แล้วลบพรีวิว เพื่อให้เวลาประทับที่ Telegram แสดงสะท้อนเวลาที่ทำเสร็จแทนเวลาที่สร้างพรีวิว

    สำหรับคำตอบที่ซับซ้อน (เช่น เพย์โหลดสื่อ) OpenClaw จะกลับไปใช้การส่งคำตอบสุดท้ายตามปกติ แล้วลบข้อความพรีวิว

    การสตรีมพรีวิวแยกจากการสตรีมบล็อก เมื่อเปิดใช้การสตรีมบล็อกสำหรับ Telegram อย่างชัดเจน OpenClaw จะข้ามสตรีมพรีวิวเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

    หากการส่งแบบร่างเนทีฟไม่พร้อมใช้งาน/ถูกปฏิเสธ OpenClaw จะกลับไปใช้ `sendMessage` + `editMessageText` โดยอัตโนมัติ

    สตรีมการให้เหตุผลเฉพาะ Telegram:

    - `/reasoning stream` ส่งการให้เหตุผลไปยังพรีวิวสดระหว่างสร้างคำตอบ
    - คำตอบสุดท้ายจะถูกส่งโดยไม่มีข้อความการให้เหตุผล

  </Accordion>

  <Accordion title="การจัดรูปแบบและทางเลือกสำรอง HTML">
    ข้อความขาออกใช้ Telegram `parse_mode: "HTML"`

    - ข้อความที่คล้าย Markdown จะแสดงผลเป็น HTML ที่ปลอดภัยสำหรับ Telegram
    - HTML ดิบจากโมเดลจะถูก escape เพื่อลดความล้มเหลวในการ parse ของ Telegram
    - หาก Telegram ปฏิเสธ HTML ที่ parse แล้ว OpenClaw จะลองใหม่เป็นข้อความธรรมดา

    พรีวิวลิงก์เปิดใช้ตามค่าเริ่มต้น และปิดใช้ได้ด้วย `channels.telegram.linkPreview: false`

  </Accordion>

  <Accordion title="คำสั่งเนทีฟและคำสั่งแบบกำหนดเอง">
    การลงทะเบียนเมนูคำสั่งของ Telegram จะถูกจัดการตอนเริ่มต้นด้วย `setMyCommands`

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

    - ชื่อจะถูกปรับให้อยู่ในรูปแบบมาตรฐาน (ตัด `/` นำหน้าออก แปลงเป็นตัวพิมพ์เล็ก)
    - รูปแบบที่ถูกต้อง: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งแบบกำหนดเองไม่สามารถแทนที่คำสั่งเนทีฟได้
    - ความขัดแย้ง/รายการซ้ำจะถูกข้ามและบันทึกลงล็อก

    หมายเหตุ:

    - คำสั่งแบบกำหนดเองเป็นเพียงรายการเมนูเท่านั้น; ไม่ได้สร้างพฤติกรรมให้โดยอัตโนมัติ
    - คำสั่งของ Plugin/ทักษะยังทำงานได้เมื่อพิมพ์ แม้ไม่ได้แสดงในเมนู Telegram

    หากปิดใช้คำสั่งเนทีฟ คำสั่งในตัวจะถูกลบออก คำสั่งแบบกำหนดเอง/Plugin อาจยังลงทะเบียนได้หากมีการกำหนดค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังมีรายการล้นแม้หลังจากตัดทอนแล้ว; ลดคำสั่ง Plugin/ทักษะ/แบบกำหนดเอง หรือปิดใช้ `channels.telegram.commands.native`
    - `deleteWebhook`, `deleteMyCommands` หรือ `setMyCommands` ล้มเหลวด้วย `404: Not Found` ขณะที่คำสั่ง curl ตรงไปยัง Bot API ทำงานได้ อาจหมายความว่า `channels.telegram.apiRoot` ถูกตั้งเป็น endpoint เต็ม `/bot<TOKEN>` แล้ว `apiRoot` ต้องเป็นเฉพาะ root ของ Bot API เท่านั้น และ `openclaw doctor --fix` จะลบ `/bot<TOKEN>` ต่อท้ายที่เกิดขึ้นโดยไม่ตั้งใจ
    - `getMe returned 401` หมายความว่า Telegram ปฏิเสธโทเค็นบอตที่กำหนดค่าไว้ อัปเดต `botToken`, `tokenFile` หรือ `TELEGRAM_BOT_TOKEN` ด้วยโทเค็น BotFather ปัจจุบัน; OpenClaw จะหยุดก่อนการโพลล์ ดังนั้นจึงไม่ถูกรายงานเป็นความล้มเหลวในการล้าง Webhook
    - `setMyCommands failed` พร้อมข้อผิดพลาดเครือข่าย/fetch มักหมายความว่า DNS/HTTPS ขาออกไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งจับคู่อุปกรณ์ (`device-pair` Plugin)

    เมื่อติดตั้ง Plugin `device-pair`:

    1. `/pair` สร้างโค้ดตั้งค่า
    2. วางโค้ดในแอป iOS
    3. `/pair pending` แสดงรายการคำขอที่รอดำเนินการ (รวมถึงบทบาท/ขอบเขต)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบระบุชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    โค้ดตั้งค่าพกโทเค็น bootstrap อายุสั้น การส่งต่อ bootstrap ในตัวจะรักษาโทเค็น Node หลักไว้ที่ `scopes: []`; โทเค็น operator ใด ๆ ที่ถูกส่งต่อจะยังถูกจำกัดอยู่ที่ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write` การตรวจสอบขอบเขต bootstrap จะมีคำนำหน้าตามบทบาท ดังนั้นรายการอนุญาตของ operator นั้นจึงใช้ได้เฉพาะกับคำขอ operator; บทบาทที่ไม่ใช่ operator ยังต้องมีขอบเขตภายใต้คำนำหน้าบทบาทของตนเอง

    หากอุปกรณ์ลองใหม่ด้วยรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (เช่น บทบาท/ขอบเขต/กุญแจสาธารณะ) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` อื่น เรียก `/pair pending` อีกครั้งก่อนอนุมัติ

    รายละเอียดเพิ่มเติม: [การจับคู่](/th/channels/pairing#pair-via-telegram-recommended-for-ios)

  </Accordion>

  <Accordion title="ปุ่มอินไลน์">
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

    การตั้งค่าแทนที่รายบัญชี:

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

    รูปแบบเดิม `capabilities: ["inlineButtons"]` เทียบเป็น `inlineButtons: "all"`

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

    การคลิกคอลแบ็กจะถูกส่งต่อให้เอเจนต์เป็นข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="การกระทำกับข้อความ Telegram สำหรับเอเจนต์และระบบอัตโนมัติ">
    การกระทำของเครื่องมือ Telegram ได้แก่:

    - `sendMessage` (`to`, `content`, `mediaUrl` แบบไม่บังคับ, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor` แบบไม่บังคับ, `iconCustomEmojiId`)

    การกระทำกับข้อความของช่องทางมีชื่อย่อที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    ตัวควบคุมการเปิดใช้:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้)

    หมายเหตุ: `edit` และ `topic-create` เปิดใช้ตามค่าเริ่มต้นในปัจจุบัน และไม่มีสวิตช์ `channels.telegram.actions.*` แยกต่างหาก
    การส่งขณะรันไทม์ใช้สแนปช็อตการกำหนดค่า/ความลับที่ใช้งานอยู่ (ตอนเริ่มต้น/โหลดซ้ำ) ดังนั้นเส้นทางการกระทำจะไม่ทำการแก้ไขอ้างอิง SecretRef เฉพาะกิจซ้ำต่อการส่งแต่ละครั้ง

    ความหมายเชิงพฤติกรรมของการลบรีแอ็กชัน: [/tools/reactions](/th/tools/reactions)

  </Accordion>

  <Accordion title="แท็กเธรดการตอบกลับ">
    Telegram รองรับแท็กเธรดการตอบกลับแบบระบุชัดเจนในเอาต์พุตที่สร้างขึ้น:

    - `[[reply_to_current]]` ตอบกลับข้อความที่ทริกเกอร์
    - `[[reply_to:<id>]]` ตอบกลับ ID ข้อความ Telegram เฉพาะ

    `channels.telegram.replyToMode` ควบคุมการจัดการ:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`

    เมื่อเปิดใช้เธรดการตอบกลับและมีข้อความหรือคำบรรยายต้นฉบับของ Telegram พร้อมใช้งาน OpenClaw จะใส่ข้อความอ้างอิง Telegram แบบเนทีฟโดยอัตโนมัติ Telegram จำกัดข้อความอ้างอิงเนทีฟไว้ที่ 1024 หน่วยรหัส UTF-16 ดังนั้นข้อความที่ยาวกว่าจะถูกอ้างอิงจากจุดเริ่มต้น และกลับไปใช้การตอบกลับธรรมดาหาก Telegram ปฏิเสธข้อความอ้างอิง

    หมายเหตุ: `off` ปิดใช้เธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบระบุชัดเจนยังคงได้รับการใช้ตามนั้น

  </Accordion>

  <Accordion title="หัวข้อฟอรัมและพฤติกรรมเธรด">
    ซูเปอร์กรุ๊ปแบบฟอรัม:

    - คีย์เซสชันของหัวข้อจะต่อท้ายด้วย `:topic:<threadId>`
    - การตอบกลับและสถานะกำลังพิมพ์จะส่งไปยังเธรดของหัวข้อ
    - พาธ config ของหัวข้อ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษสำหรับหัวข้อทั่วไป (`threadId=1`):

    - การส่งข้อความจะละเว้น `message_thread_id` (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - การกระทำกำลังพิมพ์ยังคงรวม `message_thread_id`

    การสืบทอดของหัวข้อ: รายการหัวข้อจะสืบทอดการตั้งค่ากลุ่ม เว้นแต่จะถูกแทนที่ (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` ใช้เฉพาะระดับหัวข้อและไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม

    **การกำหนดเส้นทางเอเจนต์รายหัวข้อ**: แต่ละหัวข้อสามารถส่งไปยังเอเจนต์ที่ต่างกันได้โดยตั้งค่า `agentId` ใน config ของหัวข้อ ทำให้แต่ละหัวข้อมีพื้นที่ทำงาน หน่วยความจำ และเซสชันที่แยกเป็นของตนเอง ตัวอย่าง:

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

    **การผูกหัวข้อ ACP แบบถาวร**: หัวข้อฟอรัมสามารถปักหมุดเซสชันฮาร์เนส ACP ผ่านการผูก ACP แบบมีชนิดที่ระดับบนสุด (`bindings[]` ที่มี `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ ID ที่ระบุด้วยหัวข้อ เช่น `-1001234567890:topic:42`) ปัจจุบันจำกัดขอบเขตไว้ที่หัวข้อฟอรัมในกลุ่ม/ซูเปอร์กรุ๊ป ดู [เอเจนต์ ACP](/th/tools/acp-agents)

    **การสร้าง ACP ที่ผูกกับเธรดจากแชต**: `/acp spawn <agent> --thread here|auto` ผูกหัวข้อปัจจุบันกับเซสชัน ACP ใหม่; ข้อความต่อเนื่องจะถูกส่งไปที่นั่นโดยตรง OpenClaw ปักหมุดการยืนยันการสร้างไว้ในหัวข้อ ต้องใช้ `channels.telegram.threadBindings.spawnAcpSessions=true`

    บริบทเทมเพลตเปิดเผย `MessageThreadId` และ `IsForum` แชต DM ที่มี `message_thread_id` จะยังคงการกำหนดเส้นทาง DM แต่ใช้คีย์เซสชันที่รองรับเธรด

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยกโน้ตเสียงออกจากไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมแบบไฟล์เสียง
    - แท็ก `[[audio_as_voice]]` ในคำตอบของเอเจนต์เพื่อบังคับส่งเป็นโน้ตเสียง
    - ทรานสคริปต์ของโน้ตเสียงขาเข้าจะถูกจัดเป็นข้อความที่เครื่องสร้างและไม่น่าเชื่อถือในบริบทของเอเจนต์; การตรวจจับการกล่าวถึงยังคงใช้ทรานสคริปต์ดิบเพื่อให้ข้อความเสียงที่ถูกกั้นด้วยการกล่าวถึงยังทำงานต่อไป

    ตัวอย่างการกระทำกับข้อความ:

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

    Telegram แยกไฟล์วิดีโอออกจากโน้ตวิดีโอ

    ตัวอย่างการกระทำกับข้อความ:

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

    - WEBP แบบคงที่: ดาวน์โหลดและประมวลผล (ตัวยึดตำแหน่ง `<media:sticker>`)
    - TGS แบบเคลื่อนไหว: ข้าม
    - WEBM วิดีโอ: ข้าม

    ฟิลด์บริบทของสติกเกอร์:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ไฟล์แคชสติกเกอร์:

    - `~/.openclaw/telegram/sticker-cache.json`

    สติกเกอร์จะถูกอธิบายหนึ่งครั้ง (เมื่อทำได้) และถูกแคชไว้เพื่อลดการเรียกวิชันซ้ำ

    เปิดใช้การกระทำกับสติกเกอร์:

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

  <Accordion title="การแจ้งเตือนรีแอ็กชัน">
    รีแอ็กชันของ Telegram เข้ามาเป็นการอัปเดต `message_reaction` (แยกจากเพย์โหลดข้อความ)

    เมื่อเปิดใช้ OpenClaw จะเข้าคิวเหตุการณ์ระบบ เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    การกำหนดค่า:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงปฏิกิริยาของผู้ใช้ต่อข้อความที่บอตส่งเท่านั้น (พยายามอย่างดีที่สุดผ่านแคชข้อความที่ส่งแล้ว)
    - เหตุการณ์ปฏิกิริยายังคงเคารพการควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกละทิ้ง
    - Telegram ไม่ให้ ID เธรดในการอัปเดตปฏิกิริยา
      - กลุ่มที่ไม่ใช่ฟอรัมจะกำหนดเส้นทางไปยังเซสชันแชตกลุ่ม
      - กลุ่มฟอรัมจะกำหนดเส้นทางไปยังเซสชันหัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อต้นทางจริง

    `allowed_updates` สำหรับ polling/webhook จะรวม `message_reaction` โดยอัตโนมัติ

  </Accordion>

  <Accordion title="ปฏิกิริยา Ack">
    `ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการแก้ค่า:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - อีโมจิสำรองจากตัวตนของเอเจนต์ (`agents.list[].identity.emoji` มิฉะนั้นใช้ "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิ unicode (เช่น "👀")
    - ใช้ `""` เพื่อปิดใช้งานปฏิกิริยาสำหรับช่องทางหรือบัญชี

  </Accordion>

  <Accordion title="การเขียน Config จากเหตุการณ์และคำสั่งของ Telegram">
    การเขียน Config ของช่องทางเปิดใช้งานตามค่าเริ่มต้น (`configWrites !== false`)

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

  <Accordion title="Long polling เทียบกับ webhook">
    ค่าเริ่มต้นคือ long polling สำหรับโหมด webhook ให้ตั้งค่า `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; ตัวเลือกเสริมคือ `webhookPath`, `webhookHost`, `webhookPort` (ค่าเริ่มต้น `/telegram-webhook`, `127.0.0.1`, `8787`)

    listener ภายในจะ bind กับ `127.0.0.1:8787` สำหรับ ingress สาธารณะ ให้ใส่ reverse proxy ไว้หน้าพอร์ตภายใน หรือตั้งค่า `webhookHost: "0.0.0.0"` โดยตั้งใจ

    โหมด webhook จะตรวจสอบ request guards, token ลับของ Telegram และเนื้อหา JSON ก่อนส่งคืน `200` ให้ Telegram
    จากนั้น OpenClaw จะประมวลผลอัปเดตแบบอะซิงโครนัสผ่านเลนบอตต่อแชต/ต่อหัวข้อเดียวกับที่ long polling ใช้ ดังนั้นรอบการทำงานของเอเจนต์ที่ช้าจะไม่ทำให้ ACK การส่งของ Telegram ค้างอยู่

  </Accordion>

  <Accordion title="ขีดจำกัด การลองใหม่ และเป้าหมาย CLI">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` จะเลือกขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนการแบ่งตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ขาเข้าและขาออก
    - `channels.telegram.timeoutSeconds` แทนที่ timeout ของไคลเอนต์ Telegram API (ถ้าไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY)
    - ค่าเริ่มต้นของ `channels.telegram.pollingStallThresholdMs` คือ `120000`; ปรับระหว่าง `30000` ถึง `600000` เฉพาะสำหรับการรีสตาร์ท polling-stall ที่เป็นผลบวกเทียมเท่านั้น
    - ประวัติบริบทกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` คือปิดใช้งาน
    - บริบทเสริมของการตอบกลับ/อ้างอิง/ส่งต่อ ปัจจุบันถูกส่งผ่านตามที่ได้รับ
    - allowlist ของ Telegram โดยหลักใช้ควบคุมว่าใครสามารถทริกเกอร์เอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบสมบูรณ์
    - การควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Config `channels.telegram.retry` ใช้กับตัวช่วยส่ง Telegram (CLI/tools/actions) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้ การส่ง final-reply ขาเข้าก็ใช้ safe-send retry แบบมีขอบเขตสำหรับความล้มเหลวก่อนเชื่อมต่อ Telegram เช่นกัน แต่จะไม่ลองใหม่กับ envelope เครือข่ายหลังส่งที่กำกวมซึ่งอาจทำให้ข้อความที่มองเห็นซ้ำกัน

    เป้าหมายส่งของ CLI สามารถเป็น chat ID แบบตัวเลขหรือ username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Poll ของ Telegram ใช้ `openclaw message poll` และรองรับหัวข้อฟอรัม:

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
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอการส่งแบบปักหมุดเมื่อบอตสามารถปักหมุดในแชตนั้นได้
    - `--force-document` เพื่อส่งรูปภาพขาออกและ GIF เป็นเอกสารแทนการอัปโหลดเป็นภาพถ่ายที่บีบอัดหรือสื่อแอนิเมชัน

    การควบคุม action:

    - `channels.telegram.actions.sendMessage=false` ปิดใช้งานข้อความ Telegram ขาออก รวมถึง poll
    - `channels.telegram.actions.poll=false` ปิดใช้งานการสร้าง poll ของ Telegram โดยยังคงเปิดใช้การส่งปกติ

  </Accordion>

  <Accordion title="การอนุมัติ exec ใน Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถโพสต์พรอมต์ในแชตหรือหัวข้อต้นทางได้ตามต้องการ ผู้อนุมัติต้องเป็น ID ผู้ใช้ Telegram แบบตัวเลข

    เส้นทาง Config:

    - `channels.telegram.execApprovals.enabled` (เปิดใช้งานอัตโนมัติเมื่อแก้ค่า approver ได้อย่างน้อยหนึ่งราย)
    - `channels.telegram.execApprovals.approvers` (fallback ไปยัง ID เจ้าของแบบตัวเลขจาก `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` และ `defaultTo` ควบคุมว่าใครสามารถคุยกับบอตได้และบอตส่งการตอบกลับปกติไปที่ใด สิ่งเหล่านี้ไม่ได้ทำให้บุคคลเป็นผู้อนุมัติ exec การจับคู่ DM ที่ได้รับอนุมัติครั้งแรกจะบูตสแตรป `commands.ownerAllowFrom` เมื่อยังไม่มีเจ้าของคำสั่ง ดังนั้นการตั้งค่าเจ้าของเดียวจึงยังทำงานได้โดยไม่ต้องใส่ ID ซ้ำใต้ `execApprovals.approvers`

    การส่งไปยังช่องทางจะแสดงข้อความคำสั่งในแชต; เปิดใช้ `channel` หรือ `both` เฉพาะในกลุ่ม/หัวข้อที่เชื่อถือได้เท่านั้น เมื่อพรอมต์ไปถึงหัวข้อฟอรัม OpenClaw จะคงหัวข้อไว้สำหรับพรอมต์อนุมัติและการติดตามผล การอนุมัติ exec จะหมดอายุหลัง 30 นาทีตามค่าเริ่มต้น

    ปุ่มอนุมัติแบบ inline ยังต้องให้ `channels.telegram.capabilities.inlineButtons` อนุญาตพื้นผิวเป้าหมาย (`dm`, `group` หรือ `all`) ด้วย ID การอนุมัติที่ขึ้นต้นด้วย `plugin:` จะแก้ค่าผ่านการอนุมัติของ Plugin; รายการอื่นจะแก้ค่าผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## การควบคุมการตอบกลับข้อผิดพลาด

เมื่อเอเจนต์พบข้อผิดพลาดในการส่งหรือ provider Telegram สามารถตอบกลับด้วยข้อความข้อผิดพลาดหรือระงับไว้ได้ คีย์ Config สองคีย์ควบคุมพฤติกรรมนี้:

| คีย์                                 | ค่า            | ค่าเริ่มต้น | คำอธิบาย                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` ส่งข้อความข้อผิดพลาดที่เป็นมิตรไปยังแชต `silent` ระงับการตอบกลับข้อผิดพลาดทั้งหมด |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | เวลาขั้นต่ำระหว่างการตอบกลับข้อผิดพลาดไปยังแชตเดียวกัน ป้องกันสแปมข้อผิดพลาดระหว่างเหตุขัดข้อง        |

รองรับการแทนที่ต่อบัญชี ต่อกลุ่ม และต่อหัวข้อ (การสืบทอดเดียวกับคีย์ Config อื่นของ Telegram)

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

    - ถ้า `requireMention=false` โหมดความเป็นส่วนตัวของ Telegram ต้องอนุญาตการมองเห็นแบบเต็ม
      - BotFather: `/setprivacy` -> Disable
      - จากนั้นลบและเพิ่มบอตกลับเข้ากลุ่มใหม่
    - `openclaw channels status` เตือนเมื่อ Config คาดหวังข้อความกลุ่มที่ไม่ได้กล่าวถึง
    - `openclaw channels status --probe` สามารถตรวจสอบ ID กลุ่มแบบตัวเลขที่ระบุชัดเจนได้; wildcard `"*"` ไม่สามารถตรวจสอบสมาชิกภาพได้
    - การทดสอบเซสชันแบบเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอตไม่เห็นข้อความกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` กลุ่มต้องถูกระบุไว้ (หรือรวม `"*"`)
    - ตรวจสอบสมาชิกภาพของบอตในกลุ่ม
    - ตรวจสอบบันทึก: `openclaw logs --follow` เพื่อดูเหตุผลที่ข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานบางส่วนหรือไม่ทำงานเลย">

    - อนุญาตตัวตนผู้ส่งของคุณ (การจับคู่และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังคงมีผลแม้นโยบายกลุ่มจะเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู native มีรายการมากเกินไป; ลดคำสั่ง Plugin/Skills/กำหนดเอง หรือปิดใช้งานเมนู native
    - การเรียกเริ่มต้น `deleteMyCommands` / `setMyCommands` มีขอบเขตและลองใหม่หนึ่งครั้งผ่าน fallback ของ transport ของ Telegram เมื่อ request timeout ข้อผิดพลาดเครือข่าย/fetch ที่คงอยู่มักบ่งชี้ปัญหาการเข้าถึง DNS/HTTPS ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="Startup รายงาน token ที่ไม่ได้รับอนุญาต">

    - `getMe returned 401` คือความล้มเหลวในการยืนยันตัวตนของ Telegram สำหรับ token บอตที่ตั้งค่าไว้
    - คัดลอกใหม่หรือสร้าง token บอตใหม่ใน BotFather จากนั้นอัปเดต `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` หรือ `TELEGRAM_BOT_TOKEN` สำหรับบัญชีเริ่มต้น
    - `deleteWebhook 401 Unauthorized` ระหว่าง startup ก็เป็นความล้มเหลวของ auth เช่นกัน; การถือว่าเป็น "ไม่มี webhook อยู่" จะเพียงเลื่อนความล้มเหลวจาก token ที่ไม่ถูกต้องเดิมไปยังการเรียก API ภายหลัง
    - ถ้า `deleteWebhook` ล้มเหลวด้วยข้อผิดพลาดเครือข่ายชั่วคราวระหว่าง polling startup OpenClaw จะตรวจสอบ `getWebhookInfo`; เมื่อ Telegram รายงาน URL webhook ว่าง polling จะดำเนินต่อเพราะการล้างข้อมูลเสร็จสิ้นแล้ว

  </Accordion>

  <Accordion title="Polling หรือความไม่เสถียรของเครือข่าย">

    - Node 22+ + `fetch`/พร็อกซีแบบกำหนดเองอาจทำให้เกิดพฤติกรรมยกเลิกทันทีหากชนิดของ AbortSignal ไม่ตรงกัน.
    - บางโฮสต์ resolve `api.telegram.org` เป็น IPv6 ก่อน; IPv6 egress ที่เสียอาจทำให้เกิดความล้มเหลวของ Telegram API เป็นระยะ.
    - หาก log มี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!`, ตอนนี้ OpenClaw จะ retry ข้อผิดพลาดเหล่านี้ในฐานะข้อผิดพลาดเครือข่ายที่กู้คืนได้.
    - หาก log มี `Polling stall detected`, OpenClaw จะ restart polling และสร้าง Telegram transport ใหม่หลังจาก 120 วินาทีโดยไม่มี long-poll liveness ที่เสร็จสมบูรณ์ตามค่าเริ่มต้น.
    - `openclaw channels status --probe` และ `openclaw doctor` จะเตือนเมื่อบัญชี polling ที่กำลังทำงานยังทำ `getUpdates` ไม่เสร็จหลังช่วง startup grace, เมื่อบัญชี webhook ที่กำลังทำงานยังทำ `setWebhook` ไม่เสร็จหลังช่วง startup grace, หรือเมื่อกิจกรรม polling transport ที่สำเร็จล่าสุดเก่าเกินไป.
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่ทำงานนานยังสุขภาพดีแต่โฮสต์ของคุณยังรายงาน polling-stall restart แบบ false อยู่. stall ที่เกิดอย่างต่อเนื่องมักชี้ไปที่ปัญหา proxy, DNS, IPv6, หรือ TLS egress ระหว่างโฮสต์กับ `api.telegram.org`.
    - Telegram ยังเคารพ process proxy env สำหรับ Bot API transport ด้วย รวมถึง `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, และตัวแปรแบบตัวพิมพ์เล็กของค่าเหล่านั้น. `NO_PROXY` / `no_proxy` ยังสามารถ bypass `api.telegram.org` ได้.
    - หาก OpenClaw managed proxy ถูกกำหนดค่าผ่าน `OPENCLAW_PROXY_URL` สำหรับสภาพแวดล้อมบริการและไม่มี standard proxy env อยู่ Telegram จะใช้ URL นั้นสำหรับ Bot API transport ด้วย.
    - บนโฮสต์ VPS ที่มี direct egress/TLS ไม่เสถียร ให้ route การเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ ใช้ค่าเริ่มต้น `autoSelectFamily=true` (ยกเว้น WSL2) และ `dnsResultOrder=ipv4first`.
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนเมื่อใช้พฤติกรรม IPv4-only ให้บังคับ family selection:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบช่วง benchmark ของ RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาตแล้ว
      สำหรับการดาวน์โหลดสื่อ Telegram ตามค่าเริ่มต้น. หาก fake-IP หรือ
      transparent proxy ที่เชื่อถือได้ rewrite `api.telegram.org` ไปยังที่อยู่
      private/internal/special-use อื่นระหว่างการดาวน์โหลดสื่อ คุณสามารถ opt
      in bypass เฉพาะ Telegram ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - opt-in แบบเดียวกันมีให้ใช้ต่อบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - หาก proxy ของคุณ resolve โฮสต์สื่อ Telegram เป็น `198.18.x.x`, ให้ปิด
      flag อันตรายไว้ก่อน. สื่อ Telegram อนุญาตช่วง benchmark RFC 2544
      ตามค่าเริ่มต้นอยู่แล้ว.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` ทำให้การป้องกัน SSRF
      ของสื่อ Telegram อ่อนลง. ใช้เฉพาะสำหรับสภาพแวดล้อม proxy ที่เชื่อถือได้และควบคุมโดยผู้ดูแล
      เช่นการ route fake-IP ของ Clash, Mihomo, หรือ Surge เมื่อระบบเหล่านั้น
      synthesize คำตอบ private หรือ special-use นอกช่วง benchmark ของ RFC 2544.
      ปิดไว้สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ.
    </Warning>

    - Environment override (ชั่วคราว):
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

<Accordion title="ฟิลด์ Telegram ที่ให้สัญญาณสูง">

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; symlink จะถูกปฏิเสธ)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- การอนุมัติ exec: `execApprovals`, `accounts.*.execApprovals`
- command/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/replies: `replyToMode`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- formatting/delivery: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/network: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- root API แบบกำหนดเอง: `apiRoot` (root ของ Bot API เท่านั้น; อย่ารวม `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions: `reactionNotifications`, `reactionLevel`
- errors: `errorPolicy`, `errorCooldownMs`
- writes/history: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญของหลายบัญชี: เมื่อกำหนดค่า ID บัญชีตั้งแต่สองรายการขึ้นไป ให้ตั้ง `channels.telegram.defaultAccount` (หรือใส่ `channels.telegram.accounts.default`) เพื่อให้ default routing ชัดเจน. มิฉะนั้น OpenClaw จะ fallback ไปยัง ID บัญชีแรกที่ normalize แล้วและ `openclaw doctor` จะเตือน. บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom`, แต่จะไม่สืบทอดค่า `accounts.default.*`.
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Telegram กับ gateway.
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรม allowlist ของกลุ่มและหัวข้อ.
  </Card>
  <Card title="การ route Channel" icon="route" href="/th/channels/channel-routing">
    Route ข้อความขาเข้าไปยัง agent.
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    Threat model และการ hardening.
  </Card>
  <Card title="การ route หลาย agent" icon="sitemap" href="/th/concepts/multi-agent">
    จับคู่กลุ่มและหัวข้อกับ agent.
  </Card>
  <Card title="การแก้ไขปัญหา" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้าม Channel.
  </Card>
</CardGroup>
