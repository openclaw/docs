---
read_when:
    - กำลังทำงานกับฟีเจอร์หรือ Webhook ของ Telegram
summary: สถานะ ความสามารถ และการกำหนดค่าการรองรับบอต Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-26T11:24:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7d269b15bc2d377fa45f0516e435517ed366c0216d0bc31fe4f4bc080a6c726
    source_path: channels/telegram.md
    workflow: 15
---

พร้อมใช้งานในระดับ Production สำหรับ DM และกลุ่มของบอตผ่าน grammY โหมดค่าเริ่มต้นคือ long polling; โหมด webhook เป็นตัวเลือกเสริม

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับ Telegram คือ pairing
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    แนวทางวินิจฉัยและซ่อมแซมข้ามช่องทาง
  </Card>
  <Card title="การกำหนดค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าช่องทางแบบครบถ้วน
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="สร้างโทเค็นบอตใน BotFather">
    เปิด Telegram แล้วแชตกับ **@BotFather** (ตรวจสอบว่า handle เป็น `@BotFather` ตรงตัว)

    รัน `/newbot` ทำตามพรอมป์ แล้วบันทึกโทเค็นไว้

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

    Env สำรอง: `TELEGRAM_BOT_TOKEN=...` (เฉพาะบัญชีเริ่มต้น)
    Telegram **ไม่** ใช้ `openclaw channels login telegram`; ให้กำหนดค่าโทเค็นใน config/env แล้วจึงเริ่ม gateway

  </Step>

  <Step title="เริ่ม gateway และอนุมัติ DM แรก">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    โค้ด pairing หมดอายุภายใน 1 ชั่วโมง

  </Step>

  <Step title="เพิ่มบอตเข้ากลุ่ม">
    เพิ่มบอตเข้ากลุ่มของคุณ จากนั้นตั้งค่า `channels.telegram.groups` และ `groupPolicy` ให้ตรงกับโมเดลการเข้าถึงของคุณ
  </Step>
</Steps>

<Note>
ลำดับการ resolve โทเค็นรับรู้ตามบัญชี ในทางปฏิบัติ ค่าใน config จะมาก่อน env สำรอง และ `TELEGRAM_BOT_TOKEN` จะใช้กับบัญชีเริ่มต้นเท่านั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="โหมด Privacy และการมองเห็นในกลุ่ม">
    โดยค่าเริ่มต้นบอต Telegram จะเปิด **Privacy Mode** ซึ่งจำกัดข้อความกลุ่มที่บอตได้รับ

    หากบอตต้องเห็นข้อความทั้งหมดในกลุ่ม ให้ทำอย่างใดอย่างหนึ่งต่อไปนี้:

    - ปิด privacy mode ผ่าน `/setprivacy` หรือ
    - ทำให้บอตเป็นแอดมินของกลุ่ม

    เมื่อสลับ privacy mode ให้ลบแล้วเพิ่มบอตกลับเข้าไปใหม่ในแต่ละกลุ่มเพื่อให้ Telegram ใช้การเปลี่ยนแปลงนั้น

  </Accordion>

  <Accordion title="สิทธิ์ของกลุ่ม">
    สถานะแอดมินควบคุมในหน้าการตั้งค่ากลุ่มของ Telegram

    บอตที่เป็นแอดมินจะได้รับข้อความทั้งหมดในกลุ่ม ซึ่งมีประโยชน์สำหรับพฤติกรรมในกลุ่มแบบ always-on

  </Accordion>

  <Accordion title="ตัวเลือก BotFather ที่มีประโยชน์">

    - `/setjoingroups` เพื่ออนุญาต/ปฏิเสธการเพิ่มเข้ากลุ่ม
    - `/setprivacy` สำหรับพฤติกรรมการมองเห็นในกลุ่ม

  </Accordion>
</AccordionGroup>

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.telegram.dmPolicy` ควบคุมการเข้าถึงข้อความส่วนตัว:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist` (ต้องมี sender ID อย่างน้อยหนึ่งรายการใน `allowFrom`)
    - `open` (ต้องมี `"*"` อยู่ใน `allowFrom`)
    - `disabled`

    `channels.telegram.allowFrom` รับ Telegram user ID แบบตัวเลข รองรับ prefix `telegram:` / `tg:` และจะถูกทำให้เป็นรูปแบบมาตรฐาน
    `dmPolicy: "allowlist"` ที่มี `allowFrom` ว่างจะบล็อก DM ทั้งหมดและจะไม่ผ่านการตรวจสอบ config
    การตั้งค่าจะขอเฉพาะ user ID แบบตัวเลขเท่านั้น
    หากคุณอัปเกรดแล้ว config ยังมีรายการ allowlist แบบ `@username` ให้รัน `openclaw doctor --fix` เพื่อแก้ไขรายการเหล่านั้น (เป็นแบบ best-effort; ต้องมี Telegram bot token)
    หากก่อนหน้านี้คุณใช้ไฟล์ allowlist ของ pairing-store, `openclaw doctor --fix` สามารถกู้คืนรายการมาไว้ใน `channels.telegram.allowFrom` สำหรับ flow แบบ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID แบบ explicit)

    สำหรับบอตที่มีเจ้าของคนเดียว แนะนำให้ใช้ `dmPolicy: "allowlist"` พร้อม `allowFrom` ที่เป็น ID ตัวเลขแบบ explicit เพื่อให้นโยบายการเข้าถึงคงอยู่ใน config อย่างทนทาน (แทนการพึ่งพาการอนุมัติ pairing ก่อนหน้า)

    จุดที่มักสับสน: การอนุมัติ DM pairing ไม่ได้หมายความว่า "ผู้ส่งคนนี้ได้รับอนุญาตทุกที่"
    pairing ให้สิทธิ์เฉพาะ DM เท่านั้น การอนุญาตผู้ส่งในกลุ่มยังคงมาจาก allowlist แบบ explicit ใน config
    หากคุณต้องการให้ "ฉันได้รับอนุญาตครั้งเดียว แล้วใช้ได้ทั้ง DM และคำสั่งในกลุ่ม" ให้ใส่ Telegram user ID แบบตัวเลขของคุณใน `channels.telegram.allowFrom`

    ### การหา Telegram user ID ของคุณ

    วิธีที่ปลอดภัยกว่า (ไม่ใช้บอตบุคคลที่สาม):

    1. ส่ง DM ไปยังบอตของคุณ
    2. รัน `openclaw logs --follow`
    3. อ่านค่า `from.id`

    วิธีผ่าน Bot API อย่างเป็นทางการ:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีผ่านบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="นโยบายกลุ่มและ allowlist">
    มีสองตัวควบคุมที่ทำงานร่วมกัน:

    1. **กลุ่มใดบ้างที่ได้รับอนุญาต** (`channels.telegram.groups`)
       - ไม่มี config `groups`:
         - เมื่อ `groupPolicy: "open"`: ทุกกลุ่มสามารถผ่านการตรวจสอบ group-ID ได้
         - เมื่อ `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการใน `groups` (หรือ `"*"`)
       - มีการกำหนดค่า `groups`: จะทำหน้าที่เป็น allowlist (ID แบบ explicit หรือ `"*"`)

    2. **ผู้ส่งใดบ้างที่ได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับการกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่า Telegram จะ fallback ไปใช้ `allowFrom`
    รายการใน `groupAllowFrom` ควรเป็น Telegram user ID แบบตัวเลข (`telegram:` / `tg:` จะถูกทำให้เป็นรูปแบบมาตรฐาน)
    อย่าใส่ chat ID ของ Telegram group หรือ supergroup ใน `groupAllowFrom` ค่า chat ID ติดลบควรอยู่ใน `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเลยในการอนุญาตผู้ส่ง
    ขอบเขตด้านความปลอดภัย (`2026.2.25+`): การยืนยันสิทธิ์ผู้ส่งในกลุ่มจะ **ไม่** สืบทอดการอนุมัติ pairing-store ของ DM
    pairing ยังคงใช้กับ DM เท่านั้น สำหรับกลุ่ม ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` แบบรายกลุ่ม/รายหัวข้อ
    หากไม่ได้ตั้งค่า `groupAllowFrom` Telegram จะ fallback ไปใช้ `allowFrom` ใน config ไม่ใช่ pairing store
    รูปแบบที่ใช้ได้จริงสำหรับบอตเจ้าของคนเดียว: ใส่ user ID ของคุณใน `channels.telegram.allowFrom`, ปล่อย `groupAllowFrom` ว่างไว้, และอนุญาตกลุ่มเป้าหมายภายใต้ `channels.telegram.groups`
    หมายเหตุด้านรันไทม์: หากไม่มี `channels.telegram` เลย รันไทม์จะใช้ค่าเริ่มต้นแบบ fail-closed คือ `groupPolicy="allowlist"` เว้นแต่จะตั้ง `channels.defaults.groupPolicy` ไว้อย่างชัดเจน

    ตัวอย่าง: อนุญาตสมาชิกคนใดก็ได้ในหนึ่งกลุ่มที่ระบุ:

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

    ตัวอย่าง: อนุญาตเฉพาะผู้ใช้บางคนภายในหนึ่งกลุ่มที่ระบุ:

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

      - ให้นำ Telegram group หรือ supergroup chat ID ติดลบ เช่น `-1001234567890` ไปไว้ใต้ `channels.telegram.groups`
      - ให้นำ Telegram user ID เช่น `8734062810` ไปไว้ใต้ `groupAllowFrom` เมื่อคุณต้องการจำกัดว่าคนใดภายในกลุ่มที่ได้รับอนุญาตสามารถเรียกใช้บอตได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกคนใดก็ได้ของกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอตได้
    </Warning>

  </Tab>

  <Tab title="พฤติกรรมการกล่าวถึง">
    โดยค่าเริ่มต้น การตอบกลับในกลุ่มต้องมีการกล่าวถึง

    การกล่าวถึงอาจมาจาก:

    - การกล่าวถึงแบบเนทีฟ `@botusername` หรือ
    - รูปแบบการกล่าวถึงใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    การสลับผ่านคำสั่งระดับเซสชัน:

    - `/activation always`
    - `/activation mention`

    คำสั่งเหล่านี้อัปเดตเฉพาะสถานะของเซสชัน ใช้ config หากต้องการให้คงอยู่ถาวร

    ตัวอย่าง config แบบคงอยู่:

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

    การดู group chat ID:

    - ส่งต่อข้อความจากกลุ่มไปที่ `@userinfobot` / `@getidsbot`
    - หรืออ่านค่า `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจสอบ Bot API `getUpdates`

  </Tab>
</Tabs>

## พฤติกรรมขณะรัน

- Telegram เป็นของโปรเซส gateway
- การกำหนดเส้นทางเป็นแบบกำหนดแน่นอน: ข้อความขาเข้าจาก Telegram จะตอบกลับไปยัง Telegram (โมเดลไม่ได้เลือกช่องทาง)
- ข้อความขาเข้าจะถูกทำให้เป็นมาตรฐานเข้าสู่ซองข้อความช่องทางที่ใช้ร่วมกัน พร้อม metadata ของการตอบกลับและ placeholder ของสื่อ
- เซสชันของกลุ่มถูกแยกตาม group ID หัวข้อ forum จะต่อท้ายด้วย `:topic:<threadId>` เพื่อแยกแต่ละหัวข้อ
- ข้อความ DM สามารถมี `message_thread_id`; OpenClaw จะกำหนดเส้นทางด้วย session key ที่รับรู้ thread และเก็บ thread ID ไว้สำหรับการตอบกลับ
- Long polling ใช้ grammY runner พร้อมการจัดลำดับต่อแชต/ต่อ thread พร้อมกันโดยรวมของ runner sink ใช้ `agents.defaults.maxConcurrent`
- Long polling ถูกป้องกันภายในแต่ละโปรเซส gateway เพื่อให้มี poller ที่ใช้งานได้เพียงตัวเดียวต่อ bot token ในแต่ละเวลา หากคุณยังเห็นความขัดแย้ง `getUpdates` 409 อยู่ แสดงว่าน่าจะมี OpenClaw gateway, สคริปต์ หรือ poller ภายนอกตัวอื่นกำลังใช้โทเค็นเดียวกัน
- ตัว watchdog สำหรับ long-polling จะรีสตาร์ตหลังจากไม่มีสถานะ liveness ของ `getUpdates` ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีตามค่าเริ่มต้น เพิ่มค่า `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อ deployment ของคุณยังเกิดการรีสตาร์ตจาก polling-stall แบบผิดพลาดระหว่างงานที่ใช้เวลานาน ค่าเป็นมิลลิวินาทีและอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับการแทนที่รายบัญชี
- Telegram Bot API ไม่มีการรองรับใบตอบรับการอ่าน (`sendReadReceipts` ใช้ไม่ได้)

## เอกสารอ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="พรีวิวการสตรีมสด (การแก้ไขข้อความ)">
    OpenClaw สามารถสตรีมคำตอบบางส่วนแบบเรียลไทม์ได้:

    - แชตส่วนตัว: ข้อความพรีวิว + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความพรีวิว + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` คือ `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - `progress` จะ map เป็น `partial` บน Telegram (เพื่อให้เข้ากันได้กับการตั้งชื่อข้ามช่องทาง)
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดต tool/progress จะใช้ข้อความพรีวิวที่ถูกแก้ไขเดิมซ้ำหรือไม่ (ค่าเริ่มต้น: `true` เมื่อพรีวิวสตรีมมิงทำงานอยู่)
    - ตรวจพบ `channels.telegram.streamMode` แบบเดิมและค่า `streaming` แบบบูลีน; รัน `openclaw doctor --fix` เพื่อย้ายไปใช้ `channels.telegram.streaming.mode`

    การอัปเดตพรีวิวความคืบหน้าของเครื่องมือคือบรรทัดสั้น ๆ แบบ "Working..." ที่แสดงระหว่างที่เครื่องมือทำงาน เช่น การรันคำสั่ง การอ่านไฟล์ การอัปเดตแผน หรือสรุปแพตช์ Telegram เปิดสิ่งนี้ไว้ตามค่าเริ่มต้นเพื่อให้สอดคล้องกับพฤติกรรม OpenClaw ที่เผยแพร่แล้วตั้งแต่ `v2026.4.22` เป็นต้นไป หากต้องการเก็บพรีวิวที่แก้ไขไว้สำหรับข้อความคำตอบ แต่ซ่อนบรรทัดความคืบหน้าของเครื่องมือ ให้ตั้งค่า:

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

    ใช้ `streaming.mode: "off"` เฉพาะเมื่อคุณต้องการปิดการแก้ไขพรีวิวของ Telegram ทั้งหมด ใช้ `streaming.preview.toolProgress: false` เมื่อคุณต้องการปิดเฉพาะบรรทัดสถานะความคืบหน้าของเครื่องมือ

    สำหรับคำตอบที่เป็นข้อความล้วน:

    - DM: OpenClaw จะคงข้อความพรีวิวเดิมไว้และแก้ไขขั้นสุดท้ายในตำแหน่งเดิม (ไม่มีข้อความที่สอง)
    - กลุ่ม/หัวข้อ: OpenClaw จะคงข้อความพรีวิวเดิมไว้และแก้ไขขั้นสุดท้ายในตำแหน่งเดิม (ไม่มีข้อความที่สอง)

    สำหรับคำตอบที่ซับซ้อน (เช่น payload สื่อ) OpenClaw จะ fallback ไปใช้การส่งขั้นสุดท้ายตามปกติ แล้วค่อยล้างข้อความพรีวิว

    Preview streaming แยกจาก block streaming เมื่อเปิดใช้ block streaming สำหรับ Telegram อย่างชัดเจน OpenClaw จะข้าม preview stream เพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

    หาก native draft transport ใช้งานไม่ได้/ถูกปฏิเสธ OpenClaw จะ fallback โดยอัตโนมัติไปใช้ `sendMessage` + `editMessageText`

    สตรีม reasoning สำหรับ Telegram เท่านั้น:

    - `/reasoning stream` ส่ง reasoning ไปยังพรีวิวสดระหว่างการสร้าง
    - คำตอบสุดท้ายจะถูกส่งโดยไม่มีข้อความ reasoning

  </Accordion>

  <Accordion title="การจัดรูปแบบและ HTML fallback">
    ข้อความขาออกใช้ Telegram `parse_mode: "HTML"`

    - ข้อความแนว Markdown จะถูกเรนเดอร์เป็น HTML ที่ปลอดภัยสำหรับ Telegram
    - HTML ดิบจากโมเดลจะถูก escape เพื่อลดความล้มเหลวในการ parse ของ Telegram
    - หาก Telegram ปฏิเสธ HTML ที่ parse แล้ว OpenClaw จะลองใหม่เป็นข้อความล้วน

    เปิดใช้ link preview ตามค่าเริ่มต้น และสามารถปิดได้ด้วย `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="คำสั่งแบบเนทีฟและคำสั่งแบบกำหนดเอง">
    การลงทะเบียนเมนูคำสั่งของ Telegram จะจัดการตอนเริ่มต้นระบบด้วย `setMyCommands`

    ค่าเริ่มต้นของคำสั่งแบบเนทีฟ:

    - `commands.native: "auto"` เปิดใช้คำสั่งแบบเนทีฟสำหรับ Telegram

    เพิ่มรายการเมนูคำสั่งแบบกำหนดเอง:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "สำรองข้อมูล Git" },
        { command: "generate", description: "สร้างรูปภาพ" },
      ],
    },
  },
}
```

    กฎ:

    - ชื่อจะถูกทำให้เป็นรูปแบบมาตรฐาน (ตัด `/` นำหน้าออก, ใช้อักษรตัวเล็ก)
    - รูปแบบที่ใช้ได้: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งแบบกำหนดเองไม่สามารถแทนที่คำสั่งแบบเนทีฟได้
    - รายการที่ขัดแย้ง/ซ้ำกันจะถูกข้ามและบันทึกลงล็อก

    หมายเหตุ:

    - คำสั่งแบบกำหนดเองเป็นเพียงรายการเมนูเท่านั้น; ไม่ได้ติดตั้งพฤติกรรมให้อัตโนมัติ
    - คำสั่งจาก Plugin/Skills ยังสามารถทำงานได้เมื่อพิมพ์ แม้จะไม่แสดงในเมนู Telegram

    หากปิดคำสั่งแบบเนทีฟ คำสั่งที่มีมาในระบบจะถูกลบออก คำสั่งแบบกำหนดเอง/จาก Plugin อาจยังลงทะเบียนได้หากมีการกำหนดค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังมีรายการล้นแม้จะตัดทอนไปแล้ว; ให้ลดจำนวนคำสั่งจาก Plugin/Skills/แบบกำหนดเอง หรือปิด `channels.telegram.commands.native`
    - `setMyCommands failed` พร้อมข้อผิดพลาดเครือข่าย/fetch มักหมายถึง DNS/HTTPS ขาออกไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่ง pairing อุปกรณ์ (`device-pair` Plugin)

    เมื่อติดตั้ง Plugin `device-pair` แล้ว:

    1. `/pair` สร้างโค้ดสำหรับการตั้งค่า
    2. วางโค้ดในแอป iOS
    3. `/pair pending` แสดงรายการคำขอที่รอดำเนินการ (รวมถึง role/scopes)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบระบุชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    โค้ดสำหรับการตั้งค่ามี bootstrap token ที่มีอายุสั้น การส่งต่อ bootstrap ที่มีมาในระบบจะคง primary node token ไว้ที่ `scopes: []`; operator token ที่ถูกส่งต่อจะยังคงถูกจำกัดอยู่ที่ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write` การตรวจสอบ bootstrap scope ใช้ prefix ตาม role ดังนั้น allowlist ของ operator จะตอบสนองได้เฉพาะคำขอของ operator; role ที่ไม่ใช่ operator ยังต้องมี scopes ภายใต้ prefix ของ role นั้นเอง

    หากอุปกรณ์ลองใหม่โดยมีรายละเอียดการยืนยันตัวตนเปลี่ยนไป (เช่น role/scopes/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` อื่น ให้รัน `/pair pending` อีกครั้งก่อนอนุมัติ

    รายละเอียดเพิ่มเติม: [การจับคู่](/th/channels/pairing#pair-via-telegram-recommended-for-ios)

  </Accordion>

  <Accordion title="ปุ่มแบบอินไลน์">
    กำหนดค่าสโคปของ inline keyboard:

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

    สโคป:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (ค่าเริ่มต้น)

    `capabilities: ["inlineButtons"]` แบบเดิมจะ map ไปเป็น `inlineButtons: "all"`

    ตัวอย่างการดำเนินการของข้อความ:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "เลือกตัวเลือก:",
  buttons: [
    [
      { text: "ใช่", callback_data: "yes" },
      { text: "ไม่", callback_data: "no" },
    ],
    [{ text: "ยกเลิก", callback_data: "cancel" }],
  ],
}
```

    การคลิก callback จะถูกส่งต่อไปยังเอเจนต์เป็นข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="การดำเนินการข้อความ Telegram สำหรับเอเจนต์และระบบอัตโนมัติ">
    การดำเนินการของเครื่องมือ Telegram ประกอบด้วย:

    - `sendMessage` (`to`, `content`, `mediaUrl` แบบไม่บังคับ, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor`, `iconCustomEmojiId` แบบไม่บังคับ)

    การดำเนินการข้อความของช่องทางเปิดเผยชื่อแฝงที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    ตัวควบคุม gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้งาน)

    หมายเหตุ: ขณะนี้ `edit` และ `topic-create` เปิดใช้งานตามค่าเริ่มต้น และยังไม่มีสวิตช์ `channels.telegram.actions.*` แยกเฉพาะ
    การส่งในรันไทม์จะใช้ snapshot ของ config/secrets ที่ใช้งานอยู่ (ตอนเริ่มต้น/รีโหลด) ดังนั้นเส้นทางการดำเนินการจะไม่ทำการ resolve SecretRef ใหม่แบบเฉพาะกิจในแต่ละครั้งที่ส่ง

    ความหมายของการลบรีแอ็กชัน: [/tools/reactions](/th/tools/reactions)

  </Accordion>

  <Accordion title="แท็กเธรดการตอบกลับ">
    Telegram รองรับแท็กเธรดการตอบกลับแบบ explicit ในเอาต์พุตที่สร้างขึ้น:

    - `[[reply_to_current]]` ตอบกลับข้อความที่เป็นตัวกระตุ้น
    - `[[reply_to:<id>]]` ตอบกลับ Telegram message ID ที่ระบุ

    `channels.telegram.replyToMode` ควบคุมวิธีจัดการ:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`

    เมื่อเปิดใช้ reply threading และมีข้อความหรือ caption ต้นฉบับของ Telegram ให้ใช้งาน OpenClaw จะรวมข้อความ quote แบบเนทีฟของ Telegram โดยอัตโนมัติ Telegram จำกัดข้อความ quote แบบเนทีฟไว้ที่ 1024 UTF-16 code units ดังนั้นข้อความที่ยาวกว่านี้จะอ้างอิงจากต้นข้อความ และจะ fallback เป็นการตอบกลับแบบธรรมดาหาก Telegram ปฏิเสธ quote

    หมายเหตุ: `off` ปิด implicit reply threading แต่แท็ก `[[reply_to_*]]` แบบ explicit จะยังคงถูกนำมาใช้

  </Accordion>

  <Accordion title="หัวข้อฟอรั่มและพฤติกรรมของเธรด">
    สำหรับ forum supergroup:

    - session key ของหัวข้อจะต่อท้ายด้วย `:topic:<threadId>`
    - การตอบกลับและการพิมพ์จะกำหนดเป้าหมายไปยังเธรดของหัวข้อนั้น
    - พาธ config ของหัวข้อ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของหัวข้อทั่วไป (`threadId=1`):

    - การส่งข้อความจะไม่ใส่ `message_thread_id` (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - การดำเนินการพิมพ์จะยังคงใส่ `message_thread_id`

    การสืบทอดของหัวข้อ: รายการหัวข้อจะสืบทอดการตั้งค่าของกลุ่ม เว้นแต่จะมีการแทนที่ (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` ใช้ได้เฉพาะระดับหัวข้อและไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม

    **การกำหนดเส้นทางเอเจนต์รายหัวข้อ**: แต่ละหัวข้อสามารถกำหนดเส้นทางไปยังเอเจนต์ที่ต่างกันได้โดยตั้งค่า `agentId` ใน config ของหัวข้อ วิธีนี้ทำให้แต่ละหัวข้อมี workspace, memory และ session ที่แยกจากกันโดยสมบูรณ์ ตัวอย่าง:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // หัวข้อทั่วไป → เอเจนต์หลัก
                "3": { agentId: "zu" },        // หัวข้อ Dev → เอเจนต์ zu
                "5": { agentId: "coder" }      // รีวิวโค้ด → เอเจนต์ coder
              }
            }
          }
        }
      }
    }
    ```

    จากนั้นแต่ละหัวข้อจะมี session key ของตัวเอง: `agent:zu:telegram:group:-1001234567890:topic:3`

    **การผูก ACP แบบคงอยู่สำหรับหัวข้อ**: หัวข้อฟอรั่มสามารถตรึงเซสชัน ACP harness ผ่านการผูก ACP แบบมีชนิดระดับบนสุด (`bindings[]` ที่มี `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ id ที่ระบุหัวข้อ เช่น `-1001234567890:topic:42`) ปัจจุบันจำกัดขอบเขตสำหรับหัวข้อฟอรั่มใน groups/supergroups ดู [เอเจนต์ ACP](/th/tools/acp-agents)

    **การสร้าง ACP แบบผูกกับเธรดจากแชต**: `/acp spawn <agent> --thread here|auto` จะผูกหัวข้อปัจจุบันเข้ากับเซสชัน ACP ใหม่; ข้อความต่อ ๆ ไปจะถูกกำหนดเส้นทางไปที่นั่นโดยตรง OpenClaw จะปักหมุดข้อความยืนยันการสร้างไว้ภายในหัวข้อนั้น ต้องเปิด `channels.telegram.threadBindings.spawnAcpSessions=true`

    บริบทของเทมเพลตเปิดเผย `MessageThreadId` และ `IsForum` แชต DM ที่มี `message_thread_id` จะยังคงใช้การกำหนดเส้นทางแบบ DM แต่ใช้ session key ที่รับรู้ thread

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยกระหว่าง voice note กับไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมแบบไฟล์เสียง
    - แท็ก `[[audio_as_voice]]` ในคำตอบของเอเจนต์เพื่อบังคับให้ส่งเป็น voice note
    - ทรานสคริปต์ voice note ขาเข้าจะถูกจัดกรอบเป็นข้อความที่สร้างโดยเครื่องและไม่น่าเชื่อถือในบริบทของเอเจนต์; การตรวจจับการกล่าวถึงยังคงใช้ทรานสคริปต์ดิบ ดังนั้นข้อความเสียงที่ต้องมีการกล่าวถึงจึงยังทำงานได้ต่อไป

    ตัวอย่างการดำเนินการของข้อความ:

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

    Telegram แยกระหว่างไฟล์วิดีโอกับ video note

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

    Video note ไม่รองรับคำบรรยาย; ข้อความที่ให้มาจะถูกส่งแยกต่างหาก

    ### สติกเกอร์

    การจัดการสติกเกอร์ขาเข้า:

    - WEBP แบบคงที่: ดาวน์โหลดและประมวลผล (placeholder `<media:sticker>`)
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

    สติกเกอร์จะถูกอธิบายหนึ่งครั้ง (เมื่อเป็นไปได้) และแคชไว้เพื่อลดการเรียก vision ซ้ำ

    เปิดใช้การดำเนินการสติกเกอร์:

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
  query: "แมวโบกมือ",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="การแจ้งเตือนรีแอ็กชัน">
    รีแอ็กชันของ Telegram มาถึงในรูปแบบอัปเดต `message_reaction` (แยกจาก payload ของข้อความ)

    เมื่อเปิดใช้งาน OpenClaw จะเข้าคิวเหตุการณ์ของระบบ เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    การกำหนดค่า:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงเฉพาะรีแอ็กชันของผู้ใช้ต่อข้อความที่บอตส่งเท่านั้น (เป็นแบบ best-effort ผ่านแคชข้อความที่ส่ง)
    - เหตุการณ์รีแอ็กชันยังคงเคารพการควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ได้ให้ thread ID มาในอัปเดตรีแอ็กชัน
      - กลุ่มที่ไม่ใช่ forum จะกำหนดเส้นทางไปยัง session ของแชตกลุ่ม
      - กลุ่ม forum จะกำหนดเส้นทางไปยัง session ของหัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อที่เป็นต้นทางแบบตรงตัว

    `allowed_updates` สำหรับ polling/webhook จะรวม `message_reaction` ให้อัตโนมัติ

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` จะส่งอีโมจิยืนยันรับรู้ระหว่างที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback เป็นอีโมจิประจำตัวของเอเจนต์ (`agents.list[].identity.emoji`, ถ้าไม่มีใช้ "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิ Unicode (เช่น "👀")
    - ใช้ `""` เพื่อปิดรีแอ็กชันสำหรับช่องทางหรือบัญชีนั้น

  </Accordion>

  <Accordion title="การเขียน config จากเหตุการณ์และคำสั่งของ Telegram">
    การเขียน config ของช่องทางเปิดใช้งานตามค่าเริ่มต้น (`configWrites !== false`)

    การเขียนที่ถูกทริกเกอร์จาก Telegram รวมถึง:

    - เหตุการณ์การย้ายกลุ่ม (`migrate_to_chat_id`) เพื่ออัปเดต `channels.telegram.groups`
    - `/config set` และ `/config unset` (ต้องเปิดใช้คำสั่งไว้)

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
    ค่าเริ่มต้นคือ long polling สำหรับโหมด webhook ให้ตั้งค่า `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; `webhookPath`, `webhookHost`, `webhookPort` เป็นตัวเลือกเสริม (ค่าเริ่มต้นคือ `/telegram-webhook`, `127.0.0.1`, `8787`)

    ตัวรับฟังในเครื่องจะ bind ที่ `127.0.0.1:8787` สำหรับการรับทราฟฟิกจากสาธารณะ ให้ตั้ง reverse proxy ไว้หน้า local port หรือกำหนด `webhookHost: "0.0.0.0"` โดยตั้งใจ

    โหมด webhook จะตรวจสอบ request guard, secret token ของ Telegram และ JSON body ก่อนส่ง `200` กลับไปยัง Telegram
    จากนั้น OpenClaw จะประมวลผล update แบบ asynchronous ผ่านเลนบอตต่อแชต/ต่อหัวข้อเดียวกับที่ long polling ใช้ ดังนั้นเทิร์นของเอเจนต์ที่ช้าจะไม่ทำให้ ACK การส่งของ Telegram ค้างอยู่

  </Accordion>

  <Accordion title="ขีดจำกัด การลองใหม่ และเป้าหมาย CLI">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` จะให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนการแบ่งตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ทั้งขาเข้าและขาออก
    - `channels.telegram.timeoutSeconds` ใช้แทน timeout ของไคลเอนต์ Telegram API (หากไม่ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY)
    - `channels.telegram.pollingStallThresholdMs` มีค่าเริ่มต้นเป็น `120000`; ปรับค่าระหว่าง `30000` ถึง `600000` เฉพาะกรณีที่เกิดการรีสตาร์ตจาก polling-stall แบบ false positive
    - ประวัติบริบทของกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` คือปิดใช้งาน
    - ปัจจุบันบริบทเสริมของ reply/quote/forward จะถูกส่งผ่านตามที่ได้รับมา
    - allowlist ของ Telegram ทำหน้าที่หลักในการควบคุมว่าใครสามารถทริกเกอร์เอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบเต็มรูปแบบ
    - ตัวควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - config `channels.telegram.retry` ใช้กับตัวช่วยการส่งของ Telegram (CLI/tools/actions) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้

    เป้าหมายการส่งของ CLI ใช้ได้ทั้ง chat ID แบบตัวเลขหรือ username:

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

    แฟล็ก poll เฉพาะของ Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` สำหรับหัวข้อ forum (หรือใช้เป้าหมายแบบ `:topic:`)

    การส่งของ Telegram ยังรองรับ:

    - `--presentation` พร้อมบล็อก `buttons` สำหรับ inline keyboard เมื่อ `channels.telegram.capabilities.inlineButtons` อนุญาต
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอให้ส่งแบบปักหมุดเมื่อบอตมีสิทธิ์ปักหมุดในแชตนั้น
    - `--force-document` เพื่อส่งรูปภาพและ GIF ขาออกเป็น document แทนการอัปโหลดแบบรูปภาพที่ถูกบีบอัดหรือสื่อเคลื่อนไหว

    การควบคุม gating ของการดำเนินการ:

    - `channels.telegram.actions.sendMessage=false` จะปิดข้อความ Telegram ขาออก รวมถึง poll
    - `channels.telegram.actions.poll=false` จะปิดการสร้าง poll ของ Telegram แต่ยังคงเปิดการส่งข้อความปกติไว้

  </Accordion>

  <Accordion title="การอนุมัติ exec ใน Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถเลือกให้โพสต์พรอมป์ในแชตหรือหัวข้อที่เป็นต้นทางได้ ผู้อนุมัติต้องเป็น Telegram user ID แบบตัวเลข

    พาธ config:

    - `channels.telegram.execApprovals.enabled` (จะเปิดอัตโนมัติเมื่อสามารถ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งราย)
    - `channels.telegram.execApprovals.approvers` (fallback ไปใช้ owner ID แบบตัวเลขจาก `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    การส่งผ่านช่องทางจะแสดงข้อความคำสั่งในแชต; ให้เปิด `channel` หรือ `both` เฉพาะในกลุ่ม/หัวข้อที่เชื่อถือได้เท่านั้น เมื่อพรอมป์ไปอยู่ในหัวข้อ forum, OpenClaw จะคงหัวข้อนั้นไว้ทั้งสำหรับพรอมป์อนุมัติและข้อความติดตามผล การอนุมัติ exec จะหมดอายุภายใน 30 นาทีโดยค่าเริ่มต้น

    ปุ่มอนุมัติแบบอินไลน์ยังต้องให้ `channels.telegram.capabilities.inlineButtons` อนุญาตพื้นผิวเป้าหมาย (`dm`, `group` หรือ `all`) ด้วย approval ID ที่ขึ้นต้นด้วย `plugin:` จะ resolve ผ่านการอนุมัติของ Plugin; รายการอื่นจะ resolve ผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ Exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## ตัวควบคุมการตอบกลับข้อผิดพลาด

เมื่อเอเจนต์พบข้อผิดพลาดด้านการส่งหรือผู้ให้บริการ Telegram สามารถเลือกได้ว่าจะตอบกลับด้วยข้อความข้อผิดพลาดหรือซ่อนไว้ มี config สองคีย์ที่ควบคุมพฤติกรรมนี้:

| คีย์                                 | ค่า                | ค่าเริ่มต้น | คำอธิบาย                                                                                     |
| ----------------------------------- | ----------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`     | `reply` จะส่งข้อความข้อผิดพลาดที่เป็นมิตรไปยังแชต `silent` จะซ่อนการตอบกลับข้อผิดพลาดทั้งหมด |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`     | เวลาขั้นต่ำระหว่างการตอบกลับข้อผิดพลาดไปยังแชตเดียวกัน ป้องกันสแปมข้อผิดพลาดระหว่างระบบขัดข้อง |

รองรับการแทนที่รายบัญชี รายกลุ่ม และรายหัวข้อ (ใช้การสืบทอดแบบเดียวกับคีย์ config Telegram อื่น ๆ)

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // ซ่อนข้อผิดพลาดในกลุ่มนี้
        },
      },
    },
  },
}
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="บอตไม่ตอบกลับข้อความในกลุ่มที่ไม่มีการกล่าวถึง">

    - หาก `requireMention=false`, privacy mode ของ Telegram ต้องอนุญาตให้มองเห็นทั้งหมด
      - BotFather: `/setprivacy` -> Disable
      - จากนั้นลบแล้วเพิ่มบอตกลับเข้ากลุ่มใหม่
    - `openclaw channels status` จะแจ้งเตือนเมื่อ config คาดหวังข้อความกลุ่มที่ไม่มีการกล่าวถึง
    - `openclaw channels status --probe` สามารถตรวจสอบ group ID แบบตัวเลขที่ระบุชัดเจนได้; wildcard `"*"` ไม่สามารถ probe สมาชิกภาพได้
    - ทดสอบ session แบบรวดเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอตไม่เห็นข้อความกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` อยู่ ต้องมีรายการของกลุ่มนั้น (หรือมี `"*"`)
    - ตรวจสอบว่าบอตเป็นสมาชิกของกลุ่ม
    - ตรวจสอบล็อก: `openclaw logs --follow` เพื่อดูเหตุผลที่ถูกข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานได้บางส่วนหรือไม่ทำงานเลย">

    - อนุญาตตัวตนของผู้ส่งของคุณ (pairing และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังคงมีผลแม้ `groupPolicy` จะเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนูแบบเนทีฟมีรายการมากเกินไป; ให้ลดจำนวนคำสั่งจาก Plugin/Skills/แบบกำหนดเอง หรือปิดเมนูแบบเนทีฟ
    - `setMyCommands failed` พร้อมข้อผิดพลาดเครือข่าย/fetch มักบ่งชี้ถึงปัญหาการเข้าถึง DNS/HTTPS ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="Polling หรือเครือข่ายไม่เสถียร">

    - Node 22+ + fetch/proxy แบบกำหนดเอง อาจกระตุ้นพฤติกรรม abort ทันทีหากชนิดของ AbortSignal ไม่ตรงกัน
    - โฮสต์บางแห่ง resolve `api.telegram.org` ไปที่ IPv6 ก่อน; หาก egress ของ IPv6 เสียอาจทำให้ Telegram API ล้มเหลวเป็นช่วง ๆ
    - หากในล็อกมี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!`, ตอนนี้ OpenClaw จะลองใหม่กับข้อผิดพลาดเครือข่ายที่กู้คืนได้เหล่านี้
    - หากในล็อกมี `Polling stall detected`, OpenClaw จะรีสตาร์ต polling และสร้าง Telegram transport ใหม่หลังจากไม่มี liveness ของ long-poll ที่เสร็จสมบูรณ์ภายใน 120 วินาทีตามค่าเริ่มต้น
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่ใช้เวลานานยังคงปกติดี แต่โฮสต์ของคุณยังรายงานการรีสตาร์ตจาก polling-stall แบบผิดพลาด การ stall แบบต่อเนื่องมักชี้ไปที่ปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่างโฮสต์กับ `api.telegram.org`
    - บนโฮสต์ VPS ที่ direct egress/TLS ไม่เสถียร ให้กำหนดเส้นทางการเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ ใช้ค่าเริ่มต้น `autoSelectFamily=true` (ยกเว้น WSL2) และ `dnsResultOrder=ipv4first`
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนเมื่อบังคับใช้ IPv4 เท่านั้น ให้บังคับการเลือก family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบช่วง benchmark ของ RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาตอยู่แล้ว
      สำหรับการดาวน์โหลดสื่อ Telegram โดยค่าเริ่มต้น หาก fake-IP หรือ
      transparent proxy ที่เชื่อถือได้เขียนทับ `api.telegram.org` เป็น
      ที่อยู่ private/internal/special-use อื่นระหว่างการดาวน์โหลดสื่อ คุณสามารถเลือก
      เปิดการข้ามเฉพาะ Telegram นี้ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - ตัวเลือกนี้มีให้ใช้รายบัญชีเช่นกันที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หาก proxy ของคุณ resolve โฮสต์สื่อ Telegram ไปเป็น `198.18.x.x` ให้ปล่อย
      แฟล็กอันตรายนี้ปิดไว้ก่อน สื่อ Telegram อนุญาตช่วง benchmark ของ RFC 2544 อยู่แล้วตามค่าเริ่มต้น

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` ทำให้การป้องกัน
      SSRF ของสื่อ Telegram อ่อนลง ใช้เฉพาะในสภาพแวดล้อม proxy ที่เชื่อถือได้และควบคุมโดยโอเปอเรเตอร์
      เช่น การกำหนดเส้นทาง fake-IP ของ Clash, Mihomo หรือ Surge เมื่อระบบเหล่านั้น
      สร้างคำตอบแบบ private หรือ special-use นอกช่วง benchmark ของ RFC 2544 เท่านั้น
      สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ ให้ปล่อยปิดไว้
    </Warning>

    - การแทนที่ผ่าน environment (ชั่วคราว):
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

## เอกสารอ้างอิงการกำหนดค่า

เอกสารอ้างอิงหลัก: [เอกสารอ้างอิงการกำหนดค่า - Telegram](/th/gateway/config-channels#telegram)

<Accordion title="ฟิลด์ Telegram ที่มีสัญญาณสูง">

- การเริ่มต้นระบบ/การยืนยันตัวตน: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; symlink จะถูกปฏิเสธ)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- การอนุมัติ exec: `execApprovals`, `accounts.*.execApprovals`
- คำสั่ง/เมนู: `commands.native`, `commands.nativeSkills`, `customCommands`
- เธรด/การตอบกลับ: `replyToMode`
- การสตรีม: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- การจัดรูปแบบ/การส่ง: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- สื่อ/เครือข่าย: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- การดำเนินการ/ความสามารถ: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- รีแอ็กชัน: `reactionNotifications`, `reactionLevel`
- ข้อผิดพลาด: `errorPolicy`, `errorCooldownMs`
- การเขียน/ประวัติ: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญของหลายบัญชี: เมื่อมีการกำหนด account ID ตั้งแต่สองรายการขึ้นไป ให้ตั้ง `channels.telegram.defaultAccount` (หรือใส่ `channels.telegram.accounts.default`) เพื่อให้การกำหนดเส้นทางค่าเริ่มต้นชัดเจน มิฉะนั้น OpenClaw จะ fallback ไปยัง account ID แรกที่ถูกทำให้เป็นรูปแบบมาตรฐาน และ `openclaw doctor` จะแจ้งเตือน บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom` แต่จะไม่สืบทอดค่า `accounts.default.*`
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Telegram กับ gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรม allowlist ของกลุ่มและหัวข้อ
  </Card>
  <Card title="การกำหนดเส้นทางช่องทาง" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเสริมความมั่นคงปลอดภัย
  </Card>
  <Card title="การกำหนดเส้นทางหลายเอเจนต์" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกลุ่มและหัวข้อไปยังเอเจนต์
  </Card>
  <Card title="การแก้ไขปัญหา" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทาง
  </Card>
</CardGroup>
