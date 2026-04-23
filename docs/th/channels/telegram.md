---
read_when:
    - การทำงานกับฟีเจอร์หรือ Webhook ของ Telegram
summary: สถานะการรองรับบอต Telegram, ความสามารถ และการตั้งค่า
title: Telegram
x-i18n:
    generated_at: "2026-04-23T10:14:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 024b76c3c71537995fc4efc26887eae516846d3f845d135b263d4d7f270afbb7
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

สถานะ: พร้อมใช้งานจริงสำหรับบอตใน DM + กลุ่มผ่าน grammY โดยโหมด long polling เป็นค่าเริ่มต้น และโหมด Webhook เป็นตัวเลือกเสริม

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับ Telegram คือการจับคู่
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    แนวทางวินิจฉัยและแก้ไขข้ามช่องทาง
  </Card>
  <Card title="การตั้งค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างคอนฟิกของช่องทางทั้งหมด
  </Card>
</CardGroup>

## ตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="สร้างโทเค็นบอตใน BotFather">
    เปิด Telegram แล้วแชตกับ **@BotFather** (ยืนยันว่า handle เป็น `@BotFather` ตรงตามนี้เท่านั้น)

    เรียกใช้ `/newbot` ทำตามขั้นตอน และบันทึกโทเค็นไว้

  </Step>

  <Step title="ตั้งค่าโทเค็นและนโยบาย DM">

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

    Env สำรอง: `TELEGRAM_BOT_TOKEN=...` (เฉพาะบัญชีเริ่มต้นเท่านั้น)
    Telegram **ไม่** ใช้ `openclaw channels login telegram`; ให้ตั้งค่าโทเค็นในคอนฟิก/ตัวแปรแวดล้อม แล้วจึงเริ่ม gateway

  </Step>

  <Step title="เริ่ม gateway และอนุมัติ DM แรก">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    รหัสการจับคู่จะหมดอายุภายใน 1 ชั่วโมง

  </Step>

  <Step title="เพิ่มบอตลงในกลุ่ม">
    เพิ่มบอตลงในกลุ่มของคุณ จากนั้นตั้งค่า `channels.telegram.groups` และ `groupPolicy` ให้ตรงกับรูปแบบการเข้าถึงของคุณ
  </Step>
</Steps>

<Note>
ลำดับการ resolve โทเค็นรองรับหลายบัญชี ในทางปฏิบัติ ค่าจากคอนฟิกมีความสำคัญเหนือ env สำรอง และ `TELEGRAM_BOT_TOKEN` จะใช้กับบัญชีเริ่มต้นเท่านั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="โหมดความเป็นส่วนตัวและการมองเห็นในกลุ่ม">
    ค่าเริ่มต้นของบอต Telegram คือ **Privacy Mode** ซึ่งจำกัดข้อความกลุ่มที่บอตจะได้รับ

    หากบอตจำเป็นต้องเห็นข้อความทั้งหมดในกลุ่ม ให้ทำอย่างใดอย่างหนึ่งต่อไปนี้:

    - ปิด privacy mode ผ่าน `/setprivacy` หรือ
    - ตั้งให้บอตเป็นผู้ดูแลระบบของกลุ่ม

    เมื่อสลับ privacy mode ให้ลบแล้วเพิ่มบอตกลับเข้าไปใหม่ในแต่ละกลุ่ม เพื่อให้ Telegram ใช้การเปลี่ยนแปลงดังกล่าว

  </Accordion>

  <Accordion title="สิทธิ์ของกลุ่ม">
    สถานะผู้ดูแลระบบถูกควบคุมในหน้าการตั้งค่ากลุ่มของ Telegram

    บอตที่เป็นผู้ดูแลระบบจะได้รับข้อความกลุ่มทั้งหมด ซึ่งมีประโยชน์สำหรับพฤติกรรมในกลุ่มที่ทำงานตลอดเวลา

  </Accordion>

  <Accordion title="ตัวเลือก BotFather ที่มีประโยชน์">

    - `/setjoingroups` เพื่ออนุญาต/ปฏิเสธการเพิ่มเข้ากลุ่ม
    - `/setprivacy` สำหรับพฤติกรรมการมองเห็นในกลุ่ม

  </Accordion>
</AccordionGroup>

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.telegram.dmPolicy` ควบคุมการเข้าถึง direct message:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist` (ต้องมี sender ID อย่างน้อยหนึ่งรายการใน `allowFrom`)
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` รับ Telegram user ID แบบตัวเลข โดยยอมรับและทำ normalization ให้กับคำนำหน้า `telegram:` / `tg:`
    `dmPolicy: "allowlist"` ที่มี `allowFrom` ว่าง จะบล็อก DM ทั้งหมดและจะไม่ผ่านการตรวจสอบคอนฟิก
    ขั้นตอนตั้งค่าจะขอเฉพาะ user ID แบบตัวเลขเท่านั้น
    หากคุณอัปเกรดมาแล้วและคอนฟิกมีรายการ allowlist แบบ `@username` ให้รัน `openclaw doctor --fix` เพื่อ resolve รายการเหล่านั้น (แบบ best-effort; ต้องมีโทเค็นบอต Telegram)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์ allowlist ใน pairing-store, `openclaw doctor --fix` สามารถกู้คืนรายการเข้าสู่ `channels.telegram.allowFrom` ใน flow แบบ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID แบบ explicit)

    สำหรับบอตที่มีเจ้าของคนเดียว ควรใช้ `dmPolicy: "allowlist"` ร่วมกับ `allowFrom` ที่เป็น ID ตัวเลขแบบ explicit เพื่อให้นโยบายการเข้าถึงคงอยู่ถาวรในคอนฟิก (แทนการพึ่งพาการอนุมัติการจับคู่ก่อนหน้า)

    จุดที่มักสับสน: การอนุมัติการจับคู่ DM ไม่ได้หมายความว่า "ผู้ส่งรายนี้ได้รับอนุญาตทุกที่"
    การจับคู่ให้สิทธิ์เข้าถึง DM เท่านั้น การอนุญาตผู้ส่งในกลุ่มยังคงมาจาก allowlist แบบ explicit ในคอนฟิก
    หากคุณต้องการให้ "ฉันได้รับอนุญาตครั้งเดียว แล้วใช้งานได้ทั้ง DM และคำสั่งในกลุ่ม" ให้นำ Telegram user ID แบบตัวเลขของคุณใส่ใน `channels.telegram.allowFrom`

    ### การค้นหา Telegram user ID ของคุณ

    วิธีที่ปลอดภัยกว่า (ไม่ใช้บอตบุคคลที่สาม):

    1. ส่ง DM ถึงบอตของคุณ
    2. รัน `openclaw logs --follow`
    3. อ่านค่า `from.id`

    วิธีทางการของ Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีผ่านบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="นโยบายกลุ่มและ allowlist">
    มีการควบคุมสองส่วนที่ทำงานร่วมกัน:

    1. **กลุ่มใดที่ได้รับอนุญาต** (`channels.telegram.groups`)
       - ไม่มีคอนฟิก `groups`:
         - เมื่อ `groupPolicy: "open"`: กลุ่มใดก็ได้สามารถผ่านการตรวจสอบ group-ID
         - เมื่อ `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการใน `groups` (หรือ `"*"`)
       - มีการตั้งค่า `groups`: จะทำหน้าที่เป็น allowlist (ID แบบ explicit หรือ `"*"`)

    2. **ผู้ส่งใดที่ได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับการกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่า Telegram จะ fallback ไปใช้ `allowFrom`
    รายการใน `groupAllowFrom` ควรเป็น Telegram user ID แบบตัวเลข (คำนำหน้า `telegram:` / `tg:` จะถูก normalize)
    อย่าใส่ Telegram group หรือ supergroup chat ID ลงใน `groupAllowFrom` chat ID แบบติดลบควรอยู่ใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเว้นสำหรับการอนุญาตผู้ส่ง
    ขอบเขตความปลอดภัย (`2026.2.25+`): การยืนยันตัวตนผู้ส่งในกลุ่มจะ **ไม่** สืบทอดการอนุมัติจาก pairing-store ของ DM
    การจับคู่ยังคงใช้กับ DM เท่านั้น สำหรับกลุ่ม ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` แบบรายกลุ่ม/รายหัวข้อ
    หากไม่ได้ตั้งค่า `groupAllowFrom` Telegram จะ fallback ไปใช้ `allowFrom` จากคอนฟิก ไม่ใช่ pairing store
    รูปแบบที่ใช้งานได้จริงสำหรับบอตเจ้าของคนเดียว: ใส่ user ID ของคุณใน `channels.telegram.allowFrom` ปล่อย `groupAllowFrom` ว่างไว้ และอนุญาตกลุ่มเป้าหมายใน `channels.telegram.groups`
    หมายเหตุรันไทม์: หากไม่มี `channels.telegram` เลย ค่าปริยายของรันไทม์จะเป็นแบบ fail-closed ด้วย `groupPolicy="allowlist"` เว้นแต่มีการตั้งค่า `channels.defaults.groupPolicy` แบบ explicit

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

      - ให้นำ Telegram group หรือ supergroup chat ID แบบติดลบ เช่น `-1001234567890` ไปไว้ใต้ `channels.telegram.groups`
      - ให้นำ Telegram user ID เช่น `8734062810` ไปไว้ใต้ `groupAllowFrom` เมื่อต้องการจำกัดว่าคนใดภายในกลุ่มที่ได้รับอนุญาตสามารถเรียกใช้บอตได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกคนใดก็ได้ของกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอตได้
    </Warning>

  </Tab>

  <Tab title="พฤติกรรมการ mention">
    โดยค่าเริ่มต้น การตอบกลับในกลุ่มต้องมีการ mention

    การ mention อาจมาจาก:

    - การ mention แบบ native `@botusername` หรือ
    - รูปแบบการ mention ใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    คำสั่งสลับระดับเซสชัน:

    - `/activation always`
    - `/activation mention`

    คำสั่งเหล่านี้อัปเดตเฉพาะสถานะของเซสชันเท่านั้น ให้ใช้คอนฟิกหากต้องการให้คงอยู่ถาวร

    ตัวอย่างคอนฟิกแบบคงอยู่:

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
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือดูจาก Bot API `getUpdates`

  </Tab>
</Tabs>

## พฤติกรรมขณะรันไทม์

- Telegram เป็นความรับผิดชอบของโพรเซส gateway
- การกำหนดเส้นทางเป็นแบบ deterministic: ข้อความตอบกลับที่มาจาก Telegram จะตอบกลับไปยัง Telegram (โมเดลไม่ได้เป็นผู้เลือกช่องทาง)
- ข้อความขาเข้าจะถูก normalize เข้าสู่ shared channel envelope พร้อม metadata ของการตอบกลับและ placeholder ของสื่อ
- เซสชันกลุ่มจะแยกตาม group ID หัวข้อฟอรัมจะต่อท้าย `:topic:<threadId>` เพื่อแยกหัวข้อออกจากกัน
- ข้อความ DM อาจมี `message_thread_id`; OpenClaw จะกำหนดเส้นทางด้วย session key ที่รับรู้เธรด และเก็บ thread ID ไว้สำหรับการตอบกลับ
- Long polling ใช้ grammY runner พร้อมการจัดลำดับต่อแชต/ต่อเธรด ค่า concurrency โดยรวมของ runner sink ใช้ `agents.defaults.maxConcurrent`
- watchdog ของ long polling จะรีสตาร์ตหลังจากไม่มี completed `getUpdates` liveness เป็นเวลา 120 วินาทีโดยค่าเริ่มต้น เพิ่มค่า `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อ deployment ของคุณยังพบการรีสตาร์ตจาก polling stall แบบ false positive ระหว่างงานที่ใช้เวลานาน ค่านี้เป็นมิลลิวินาที และอนุญาตช่วง `30000` ถึง `600000`; รองรับการ override รายบัญชี
- Telegram Bot API ไม่รองรับ read receipt (`sendReadReceipts` ใช้ไม่ได้)

## อ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="พรีวิวสตรีมแบบสด (แก้ไขข้อความ)">
    OpenClaw สามารถสตรีมคำตอบบางส่วนแบบเรียลไทม์ได้:

    - แชตส่วนตัว: ข้อความพรีวิว + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความพรีวิว + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` เป็น `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - `progress` จะถูกแมปเป็น `partial` บน Telegram (เพื่อความเข้ากันได้กับการตั้งชื่อข้ามช่องทาง)
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความพรีวิวที่ถูกแก้ไขข้อความเดิมซ้ำหรือไม่ (ค่าเริ่มต้น: `true`) ตั้งค่าเป็น `false` เพื่อแยกข้อความเครื่องมือ/ความคืบหน้าออกต่างหาก
    - ค่า legacy `channels.telegram.streamMode` และค่าบูลีนของ `streaming` จะถูกแมปให้อัตโนมัติ

    สำหรับคำตอบที่เป็นข้อความล้วน:

    - DM: OpenClaw จะคงข้อความพรีวิวเดิมไว้ และทำการแก้ไขครั้งสุดท้ายแทนที่ในข้อความเดิม (ไม่มีข้อความที่สอง)
    - กลุ่ม/หัวข้อ: OpenClaw จะคงข้อความพรีวิวเดิมไว้ และทำการแก้ไขครั้งสุดท้ายแทนที่ในข้อความเดิม (ไม่มีข้อความที่สอง)

    สำหรับคำตอบที่ซับซ้อน (เช่น payload ของสื่อ) OpenClaw จะ fallback ไปใช้การส่งมอบแบบสุดท้ายตามปกติ แล้วจึงล้างข้อความพรีวิวออก

    การสตรีมพรีวิวแยกจาก block streaming เมื่อเปิด block streaming สำหรับ Telegram แบบ explicit, OpenClaw จะข้ามการสตรีมพรีวิวเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

    หาก native draft transport ไม่พร้อมใช้งาน/ถูกปฏิเสธ OpenClaw จะ fallback ไปใช้ `sendMessage` + `editMessageText` โดยอัตโนมัติ

    สตรีม reasoning เฉพาะ Telegram:

    - `/reasoning stream` จะส่ง reasoning ไปยังพรีวิวแบบสดระหว่างการสร้างคำตอบ
    - คำตอบสุดท้ายจะถูกส่งโดยไม่มีข้อความ reasoning

  </Accordion>

  <Accordion title="การจัดรูปแบบและ HTML fallback">
    ข้อความขาออกใช้ Telegram `parse_mode: "HTML"`

    - ข้อความสไตล์ Markdown จะถูกเรนเดอร์เป็น HTML ที่ปลอดภัยสำหรับ Telegram
    - HTML ดิบจากโมเดลจะถูก escape เพื่อลดความล้มเหลวในการ parse ของ Telegram
    - หาก Telegram ปฏิเสธ HTML ที่ parse แล้ว OpenClaw จะ retry เป็นข้อความธรรมดา

    ลิงก์พรีวิวเปิดใช้งานโดยค่าเริ่มต้น และสามารถปิดได้ด้วย `channels.telegram.linkPreview: false`

  </Accordion>

  <Accordion title="คำสั่ง native และคำสั่งกำหนดเอง">
    การลงทะเบียนเมนูคำสั่งของ Telegram จะจัดการตอนเริ่มต้นระบบด้วย `setMyCommands`

    ค่าปริยายของคำสั่ง native:

    - `commands.native: "auto"` จะเปิดใช้คำสั่ง native สำหรับ Telegram

    เพิ่มรายการเมนูคำสั่งแบบกำหนดเอง:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "สำรองข้อมูล Git" },
        { command: "generate", description: "สร้างภาพ" },
      ],
    },
  },
}
```

    กฎ:

    - ชื่อจะถูก normalize (ตัด `/` นำหน้าออก, ใช้อักษรพิมพ์เล็ก)
    - รูปแบบที่ถูกต้อง: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งกำหนดเองไม่สามารถ override คำสั่ง native ได้
    - ความขัดแย้ง/รายการซ้ำจะถูกข้ามและบันทึกลง log

    หมายเหตุ:

    - คำสั่งกำหนดเองเป็นเพียงรายการในเมนูเท่านั้น; ไม่ได้สร้างพฤติกรรมให้อัตโนมัติ
    - คำสั่งจาก Plugin/Skills ยังคงใช้งานได้เมื่อพิมพ์เอง แม้จะไม่แสดงในเมนู Telegram

    หากปิดคำสั่ง native คำสั่งที่มีมาในระบบจะถูกนำออก คำสั่งกำหนดเอง/คำสั่งจาก Plugin อาจยังลงทะเบียนได้หากมีการตั้งค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังมีรายการมากเกินไปแม้หลังตัดทอนแล้ว; ให้ลดคำสั่งจาก Plugin/Skills/คำสั่งกำหนดเอง หรือปิด `channels.telegram.commands.native`
    - `setMyCommands failed` พร้อมข้อผิดพลาดเครือข่าย/fetch มักหมายความว่า DNS/HTTPS ขาออกไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งจับคู่อุปกรณ์ (`device-pair` Plugin)

    เมื่อมีการติดตั้ง Plugin `device-pair`:

    1. `/pair` จะสร้างรหัสตั้งค่า
    2. วางรหัสดังกล่าวในแอป iOS
    3. `/pair pending` จะแสดงรายการคำขอที่รออยู่ (รวมถึงบทบาท/ขอบเขต)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบ explicit
       - `/pair approve` เมื่อมีคำขอที่รออยู่เพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    รหัสตั้งค่าจะมี bootstrap token อายุสั้นติดมาด้วย การส่งต่อ bootstrap แบบ built-in จะคง primary node token ไว้ที่ `scopes: []`; operator token ใด ๆ ที่ถูกส่งต่อจะยังถูกจำกัดอยู่ใน `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write` การตรวจสอบขอบเขตของ bootstrap จะใช้คำนำหน้าตามบทบาท ดังนั้น allowlist ของ operator นี้จะตอบสนองได้เฉพาะคำขอของ operator; บทบาทที่ไม่ใช่ operator ยังต้องมีขอบเขตภายใต้คำนำหน้าบทบาทของตนเอง

    หากอุปกรณ์ retry พร้อมรายละเอียด auth ที่เปลี่ยนไป (เช่น บทบาท/ขอบเขต/public key) คำขอที่รออยู่ก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` คนละค่า ให้รัน `/pair pending` อีกครั้งก่อนอนุมัติ

    รายละเอียดเพิ่มเติม: [การจับคู่](/th/channels/pairing#pair-via-telegram-recommended-for-ios)

  </Accordion>

  <Accordion title="ปุ่ม inline">
    ตั้งค่าขอบเขตของ inline keyboard:

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

    การ override รายบัญชี:

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

    ค่าแบบ legacy `capabilities: ["inlineButtons"]` จะถูกแมปเป็น `inlineButtons: "all"`

    ตัวอย่าง message action:

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

    การคลิก callback จะถูกส่งให้เอเจนต์ในรูปแบบข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message action สำหรับเอเจนต์และระบบอัตโนมัติ">
    Telegram tool action มีดังนี้:

    - `sendMessage` (`to`, `content`, `mediaUrl` แบบไม่บังคับ, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor` แบบไม่บังคับ, `iconCustomEmojiId` แบบไม่บังคับ)

    Channel message action จะเปิดเผยชื่อเรียกที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    ตัวควบคุมการเปิดใช้:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้งาน)

    หมายเหตุ: ปัจจุบัน `edit` และ `topic-create` เปิดใช้งานโดยค่าเริ่มต้น และยังไม่มีสวิตช์ `channels.telegram.actions.*` แยกต่างหาก
    การส่งในรันไทม์จะใช้ snapshot ของคอนฟิก/ความลับที่กำลังใช้งานอยู่ (ตอนเริ่มต้น/โหลดใหม่) ดังนั้นเส้นทาง action จะไม่ทำ SecretRef re-resolution แบบเฉพาะกิจในการส่งแต่ละครั้ง

    ความหมายของการลบ reaction: [/tools/reactions](/th/tools/reactions)

  </Accordion>

  <Accordion title="แท็ก reply threading">
    Telegram รองรับแท็ก reply threading แบบ explicit ในผลลัพธ์ที่สร้างขึ้น:

    - `[[reply_to_current]]` ตอบกลับข้อความที่เป็นตัวกระตุ้น
    - `[[reply_to:<id>]]` ตอบกลับ Telegram message ID ที่ระบุ

    `channels.telegram.replyToMode` ควบคุมการจัดการ:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`

    หมายเหตุ: `off` จะปิด implicit reply threading แต่แท็ก `[[reply_to_*]]` แบบ explicit ยังคงได้รับการรองรับ

  </Accordion>

  <Accordion title="หัวข้อฟอรัมและพฤติกรรมของเธรด">
    สำหรับ forum supergroup:

    - session key ของหัวข้อจะต่อท้ายด้วย `:topic:<threadId>`
    - การตอบกลับและสถานะกำลังพิมพ์จะมุ่งไปยังเธรดของหัวข้อนั้น
    - เส้นทางคอนฟิกของหัวข้อ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของหัวข้อทั่วไป (`threadId=1`):

    - การส่งข้อความจะละ `message_thread_id` ออก (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - การกระทำประเภทกำลังพิมพ์ยังคงใส่ `message_thread_id`

    การสืบทอดของหัวข้อ: รายการหัวข้อจะสืบทอดการตั้งค่าจากกลุ่ม เว้นแต่จะมีการ override (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` เป็นของหัวข้อเท่านั้น และไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม

    **การกำหนดเส้นทางเอเจนต์รายหัวข้อ**: แต่ละหัวข้อสามารถกำหนดเส้นทางไปยังเอเจนต์คนละตัวได้โดยตั้งค่า `agentId` ในคอนฟิกของหัวข้อ ทำให้แต่ละหัวข้อมี workspace, memory และ session ที่แยกจากกัน ตัวอย่าง:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // หัวข้อทั่วไป → เอเจนต์ main
                "3": { agentId: "zu" },        // หัวข้อ dev → เอเจนต์ zu
                "5": { agentId: "coder" }      // code review → เอเจนต์ coder
              }
            }
          }
        }
      }
    }
    ```

    จากนั้นแต่ละหัวข้อจะมี session key ของตัวเอง: `agent:zu:telegram:group:-1001234567890:topic:3`

    **การผูกหัวข้อ ACP แบบคงอยู่**: หัวข้อฟอรัมสามารถปักหมุดเซสชัน ACP harness ผ่าน ACP binding แบบ typed ระดับบนสุด (`bindings[]` พร้อม `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ id ที่มีการระบุหัวข้อ เช่น `-1001234567890:topic:42`) ขณะนี้รองรับเฉพาะหัวข้อฟอรัมในกลุ่ม/supergroup ดู [ACP Agents](/th/tools/acp-agents)

    **การ spawn ACP ที่ผูกกับเธรดจากแชต**: `/acp spawn <agent> --thread here|auto` จะผูกหัวข้อปัจจุบันกับเซสชัน ACP ใหม่; การติดตามต่อจะถูกกำหนดเส้นทางไปยังเซสชันนั้นโดยตรง OpenClaw จะปักหมุดข้อความยืนยันการ spawn ไว้ในหัวข้อนั้น ต้องใช้ `channels.telegram.threadBindings.spawnAcpSessions=true`

    บริบทของ template จะเปิดเผย `MessageThreadId` และ `IsForum` แชต DM ที่มี `message_thread_id` จะยังคงใช้เส้นทาง DM แต่ใช้ session key ที่รับรู้เธรด

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยก voice note ออกจากไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมแบบไฟล์เสียง
    - ใส่แท็ก `[[audio_as_voice]]` ในคำตอบของเอเจนต์เพื่อบังคับให้ส่งเป็น voice note

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

    Video note ไม่รองรับคำบรรยายข้อความ; ข้อความที่ให้มาจะถูกส่งแยกต่างหาก

    ### สติกเกอร์

    การจัดการสติกเกอร์ขาเข้า:

    - WEBP แบบ static: ดาวน์โหลดและประมวลผล (placeholder `<media:sticker>`)
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

    เปิดใช้งาน sticker action:

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

    Sticker action สำหรับการส่ง:

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

  <Accordion title="การแจ้งเตือน reaction">
    Reaction ของ Telegram จะมาในรูปแบบอัปเดต `message_reaction` (แยกจาก payload ของข้อความ)

    เมื่อเปิดใช้งาน OpenClaw จะเข้าคิว system event เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    คอนฟิก:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงเฉพาะ reaction ของผู้ใช้ต่อข้อความที่บอตส่งเท่านั้น (แบบ best-effort ผ่านแคชของข้อความที่ส่ง)
    - เหตุการณ์ reaction ยังคงเคารพการควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ได้ให้ thread ID มาในอัปเดต reaction
      - กลุ่มที่ไม่ใช่ฟอรัมจะกำหนดเส้นทางไปยังเซสชันแชตของกลุ่ม
      - กลุ่มฟอรัมจะกำหนดเส้นทางไปยังเซสชันของหัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อที่เป็นต้นทางแบบตรงตัว

    `allowed_updates` สำหรับ polling/webhook จะรวม `message_reaction` ให้อัตโนมัติ

  </Accordion>

  <Accordion title="Ack reaction">
    `ackReaction` จะส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback ไปที่อีโมจิ identity ของเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้นใช้ "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิ unicode (เช่น "👀")
    - ใช้ `""` เพื่อปิด reaction สำหรับช่องทางหรือบัญชีนั้น

  </Accordion>

  <Accordion title="การเขียนคอนฟิกจากเหตุการณ์และคำสั่งของ Telegram">
    การเขียนคอนฟิกของช่องทางเปิดใช้งานโดยค่าเริ่มต้น (`configWrites !== false`)

    การเขียนที่ถูกกระตุ้นจาก Telegram มีดังนี้:

    - เหตุการณ์ย้ายกลุ่ม (`migrate_to_chat_id`) เพื่ออัปเดต `channels.telegram.groups`
    - `/config set` และ `/config unset` (ต้องเปิดใช้คำสั่งไว้)

    ปิดใช้งานได้ด้วย:

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
    ค่าเริ่มต้นคือ long polling สำหรับโหมด Webhook ให้ตั้งค่า `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; ส่วน `webhookPath`, `webhookHost`, `webhookPort` เป็นตัวเลือก (ค่าเริ่มต้น `/telegram-webhook`, `127.0.0.1`, `8787`)

    listener ภายในเครื่องจะ bind กับ `127.0.0.1:8787` สำหรับ ingress สาธารณะ ให้ใช้ reverse proxy ไว้ด้านหน้าพอร์ตภายในเครื่อง หรือกำหนด `webhookHost: "0.0.0.0"` โดยตั้งใจ

  </Accordion>

  <Accordion title="ขีดจำกัด การ retry และเป้าหมาย CLI">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` จะเลือกขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนการแบ่งตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ทั้งขาเข้าและขาออก
    - `channels.telegram.timeoutSeconds` ใช้ override ค่า timeout ของไคลเอนต์ Telegram API (หากไม่ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY)
    - `channels.telegram.pollingStallThresholdMs` มีค่าเริ่มต้นเป็น `120000`; ปรับค่าในช่วง `30000` ถึง `600000` เฉพาะเมื่อเกิดการรีสตาร์ตจาก polling stall แบบ false positive
    - ประวัติบริบทของกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` จะปิดใช้งาน
    - บริบทเสริมจากการตอบกลับ/อ้างอิง/ส่งต่อ ปัจจุบันจะถูกส่งผ่านตามที่ได้รับ
    - allowlist ของ Telegram มีไว้ควบคุมเป็นหลักว่าใครสามารถกระตุ้นเอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบครบถ้วน
    - ตัวควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - คอนฟิก `channels.telegram.retry` ใช้กับตัวช่วยการส่งของ Telegram (CLI/tools/actions) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้

    เป้าหมายการส่งของ CLI สามารถเป็น chat ID แบบตัวเลขหรือ username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    การสร้างโพลบน Telegram ใช้ `openclaw message poll` และรองรับหัวข้อฟอรัม:

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
    - `--thread-id` สำหรับหัวข้อฟอรัม (หรือใช้เป้าหมายแบบ `:topic:`)

    การส่งบน Telegram ยังรองรับ:

    - `--presentation` พร้อมบล็อก `buttons` สำหรับ inline keyboard เมื่อ `channels.telegram.capabilities.inlineButtons` อนุญาต
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอให้ปักหมุดข้อความเมื่อบอตมีสิทธิ์ปักหมุดในแชตนั้น
    - `--force-document` เพื่อส่งรูปภาพและ GIF ขาออกเป็นเอกสารแทนการอัปโหลดเป็นภาพที่ถูกบีบอัดหรือสื่อเคลื่อนไหว

    การควบคุมการเปิดใช้ action:

    - `channels.telegram.actions.sendMessage=false` จะปิดการส่งข้อความ Telegram ขาออก รวมถึงโพล
    - `channels.telegram.actions.poll=false` จะปิดการสร้างโพล Telegram โดยยังคงเปิดการส่งข้อความปกติไว้

  </Accordion>

  <Accordion title="การอนุมัติ exec ใน Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถเลือกให้โพสต์พรอมป์ในแชตหรือหัวข้อที่เป็นต้นทางได้ ผู้อนุมัติต้องเป็น Telegram user ID แบบตัวเลข

    เส้นทางคอนฟิก:

    - `channels.telegram.execApprovals.enabled` (จะเปิดใช้งานอัตโนมัติเมื่อสามารถ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งราย)
    - `channels.telegram.execApprovals.approvers` (fallback ไปใช้ owner ID แบบตัวเลขจาก `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    การส่งไปยังช่องทางจะแสดงข้อความคำสั่งในแชต; ควรเปิดใช้ `channel` หรือ `both` เฉพาะในกลุ่ม/หัวข้อที่เชื่อถือได้เท่านั้น เมื่อพรอมป์ถูกส่งเข้าไปในหัวข้อฟอรัม OpenClaw จะคงหัวข้อนั้นไว้ทั้งสำหรับพรอมป์อนุมัติและการติดตามผล การอนุมัติ exec จะหมดอายุโดยค่าเริ่มต้นหลัง 30 นาที

    ปุ่มอนุมัติแบบ inline ยังต้องให้ `channels.telegram.capabilities.inlineButtons` อนุญาตพื้นผิวเป้าหมาย (`dm`, `group` หรือ `all`) ด้วย approval ID ที่ขึ้นต้นด้วย `plugin:` จะถูก resolve ผ่านการอนุมัติของ Plugin; ส่วน ID อื่น ๆ จะถูก resolve ผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ Exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## ตัวควบคุมการตอบกลับข้อผิดพลาด

เมื่อเอเจนต์พบข้อผิดพลาดในการส่งมอบหรือจาก provider, Telegram สามารถเลือกตอบกลับด้วยข้อความแสดงข้อผิดพลาดหรือระงับไม่ตอบกลับก็ได้ มีคีย์คอนฟิกสองตัวที่ควบคุมพฤติกรรมนี้:

| คีย์                                 | ค่า                | ค่าเริ่มต้น | คำอธิบาย                                                                                  |
| ----------------------------------- | ----------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`     | `reply` จะส่งข้อความแสดงข้อผิดพลาดแบบเป็นมิตรกลับไปยังแชต `silent` จะระงับการตอบกลับข้อผิดพลาดทั้งหมด |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`     | เวลาขั้นต่ำระหว่างการตอบกลับข้อผิดพลาดไปยังแชตเดียวกัน ป้องกันสแปมข้อผิดพลาดระหว่างที่ระบบขัดข้อง        |

รองรับการ override รายบัญชี รายกลุ่ม และรายหัวข้อ (ใช้การสืบทอดแบบเดียวกับคีย์คอนฟิก Telegram อื่น ๆ)

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // ระงับข้อผิดพลาดในกลุ่มนี้
        },
      },
    },
  },
}
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="บอตไม่ตอบกลับข้อความในกลุ่มที่ไม่มีการ mention">

    - หาก `requireMention=false`, privacy mode ของ Telegram ต้องอนุญาตให้มองเห็นทั้งหมด
      - BotFather: `/setprivacy` -> Disable
      - จากนั้นลบแล้วเพิ่มบอตกลับเข้ากลุ่มใหม่
    - `openclaw channels status` จะแจ้งเตือนเมื่อคอนฟิกคาดหวังข้อความกลุ่มที่ไม่มีการ mention
    - `openclaw channels status --probe` สามารถตรวจสอบ group ID แบบตัวเลขที่ระบุอย่างชัดเจนได้; wildcard `"*"` ไม่สามารถตรวจสอบสมาชิกได้
    - ทดสอบเซสชันอย่างรวดเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอตมองไม่เห็นข้อความในกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` กลุ่มนั้นต้องถูกระบุไว้ (หรือมี `"*"`)
    - ตรวจสอบว่าบอตเป็นสมาชิกของกลุ่ม
    - ตรวจสอบ log: `openclaw logs --follow` เพื่อดูสาเหตุที่ถูกข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานได้บางส่วนหรือใช้ไม่ได้เลย">

    - อนุญาตตัวตนของผู้ส่งของคุณ (pairing และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังคงมีผลแม้ว่า group policy จะเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู native มีรายการมากเกินไป; ให้ลดคำสั่งจาก Plugin/Skills/คำสั่งกำหนดเอง หรือปิดเมนู native
    - `setMyCommands failed` พร้อมข้อผิดพลาดเครือข่าย/fetch มักบ่งชี้ว่ามีปัญหาการเข้าถึง DNS/HTTPS ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="ความไม่เสถียรของ polling หรือเครือข่าย">

    - Node 22+ + fetch/proxy แบบกำหนดเอง อาจกระตุ้นพฤติกรรมยกเลิกทันทีหากชนิดของ AbortSignal ไม่ตรงกัน
    - บางโฮสต์ resolve `api.telegram.org` ไปยัง IPv6 ก่อน; หาก egress ของ IPv6 มีปัญหา อาจทำให้ Telegram API ล้มเหลวเป็นช่วง ๆ
    - หาก log มี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!`, ตอนนี้ OpenClaw จะ retry ข้อผิดพลาดเหล่านี้ในฐานะข้อผิดพลาดเครือข่ายที่กู้คืนได้
    - หาก log มี `Polling stall detected`, OpenClaw จะรีสตาร์ต polling และสร้าง Telegram transport ใหม่หลังจากไม่มี completed long-poll liveness เป็นเวลา 120 วินาทีโดยค่าเริ่มต้น
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่ใช้เวลานานยังปกติดี แต่โฮสต์ของคุณยังรายงานการรีสตาร์ตจาก polling stall แบบ false positive อยู่ การ stall อย่างต่อเนื่องมักชี้ไปที่ปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่างโฮสต์กับ `api.telegram.org`
    - บนโฮสต์ VPS ที่ direct egress/TLS ไม่เสถียร ให้กำหนดเส้นทางการเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - ค่าเริ่มต้นของ Node 22+ คือ `autoSelectFamily=true` (ยกเว้น WSL2) และ `dnsResultOrder=ipv4first`
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนเมื่อบังคับใช้ IPv4 เท่านั้น ให้บังคับการเลือก family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบช่วง benchmark ตาม RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาตสำหรับการดาวน์โหลดสื่อ Telegram โดยค่าเริ่มต้นอยู่แล้ว หาก fake-IP ที่เชื่อถือได้หรือ transparent proxy เขียนทับ `api.telegram.org` ไปเป็นที่อยู่ private/internal/special-use อื่นระหว่างการดาวน์โหลดสื่อ คุณสามารถเลือกเปิด bypass เฉพาะ Telegram นี้ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - ตัวเลือก opt-in เดียวกันนี้มีแบบรายบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หาก proxy ของคุณ resolve โฮสต์สื่อของ Telegram ไปเป็น `198.18.x.x` ให้ปล่อย dangerous flag ปิดไว้ก่อน เพราะ Telegram media อนุญาตช่วง benchmark ตาม RFC 2544 อยู่แล้วโดยค่าเริ่มต้น

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` จะลดความเข้มงวดของการป้องกัน SSRF สำหรับสื่อ Telegram ใช้เฉพาะในสภาพแวดล้อม proxy ที่เชื่อถือได้และอยู่ภายใต้การควบคุมของผู้ดูแล เช่น การกำหนดเส้นทาง fake-IP ของ Clash, Mihomo หรือ Surge เมื่อระบบเหล่านั้นสร้างคำตอบ private หรือ special-use นอกช่วง benchmark ตาม RFC 2544 ให้ปล่อยปิดไว้สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ
    </Warning>

    - การ override ผ่านตัวแปรแวดล้อม (ชั่วคราว):
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

## ตัวชี้ไปยังเอกสารอ้างอิงคอนฟิก Telegram

เอกสารอ้างอิงหลัก:

- `channels.telegram.enabled`: เปิด/ปิดการเริ่มต้นช่องทาง
- `channels.telegram.botToken`: โทเค็นบอต (BotFather)
- `channels.telegram.tokenFile`: อ่านโทเค็นจากพาธไฟล์ปกติ ไม่อนุญาต symlink
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.telegram.allowFrom`: allowlist ของ DM (Telegram user ID แบบตัวเลข) `allowlist` ต้องมี sender ID อย่างน้อยหนึ่งรายการ `open` ต้องมี `"*"` `openclaw doctor --fix` สามารถ resolve รายการ `@username` แบบ legacy เป็น ID ได้ และสามารถกู้คืนรายการ allowlist จากไฟล์ pairing-store ใน flow การย้าย allowlist ได้
- `channels.telegram.actions.poll`: เปิดหรือปิดการสร้างโพล Telegram (ค่าเริ่มต้น: เปิด; แต่ยังคงต้องใช้ `sendMessage`)
- `channels.telegram.defaultTo`: เป้าหมาย Telegram เริ่มต้นที่ CLI `--deliver` ใช้เมื่อไม่ได้ระบุ `--reply-to` อย่างชัดเจน
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: allowlist)
- `channels.telegram.groupAllowFrom`: allowlist ของผู้ส่งในกลุ่ม (Telegram user ID แบบตัวเลข) `openclaw doctor --fix` สามารถ resolve รายการ `@username` แบบ legacy เป็น ID ได้ รายการที่ไม่ใช่ตัวเลขจะถูกละเว้นตอนยืนยันตัวตน การยืนยันตัวตนในกลุ่มจะไม่ใช้ fallback จาก DM pairing-store (`2026.2.25+`)
- ลำดับความสำคัญสำหรับหลายบัญชี:
  - เมื่อมีการตั้งค่า account ID ตั้งแต่สองบัญชีขึ้นไป ให้ตั้ง `channels.telegram.defaultAccount` (หรือใส่ `channels.telegram.accounts.default`) เพื่อระบุเส้นทางเริ่มต้นอย่างชัดเจน
  - หากไม่ได้ตั้งค่าทั้งสองอย่าง OpenClaw จะ fallback ไปยัง account ID แรกที่ normalize แล้ว และ `openclaw doctor` จะเตือน
  - `channels.telegram.accounts.default.allowFrom` และ `channels.telegram.accounts.default.groupAllowFrom` ใช้กับบัญชี `default` เท่านั้น
  - บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` และ `channels.telegram.groupAllowFrom` เมื่อไม่ได้ตั้งค่าระดับบัญชีไว้
  - บัญชีที่มีชื่อจะไม่สืบทอด `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`
- `channels.telegram.groups`: ค่าเริ่มต้นรายกลุ่ม + allowlist (ใช้ `"*"` สำหรับค่าเริ่มต้นแบบ global)
  - `channels.telegram.groups.<id>.groupPolicy`: override ระดับกลุ่มสำหรับ groupPolicy (`open | allowlist | disabled`)
  - `channels.telegram.groups.<id>.requireMention`: ค่าเริ่มต้นของการบังคับ mention
  - `channels.telegram.groups.<id>.skills`: ตัวกรอง Skills (ไม่ใส่ = ทุก Skills, ว่าง = ไม่มี)
  - `channels.telegram.groups.<id>.allowFrom`: override allowlist ของผู้ส่งรายกลุ่ม
  - `channels.telegram.groups.<id>.systemPrompt`: system prompt เพิ่มเติมสำหรับกลุ่ม
  - `channels.telegram.groups.<id>.enabled`: ปิดใช้งานกลุ่มเมื่อเป็น `false`
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: override รายหัวข้อ (ฟิลด์ของกลุ่ม + `agentId` ที่มีเฉพาะหัวข้อ)
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: กำหนดเส้นทางหัวข้อนี้ไปยังเอเจนต์ที่ระบุ (override ทั้งการกำหนดเส้นทางระดับกลุ่มและ binding)
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: override รายหัวข้อสำหรับ groupPolicy (`open | allowlist | disabled`)
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: override รายหัวข้อสำหรับการบังคับ mention
- `bindings[]` ระดับบนสุดที่มี `type: "acp"` และ topic id แบบ canonical `chatId:topic:topicId` ใน `match.peer.id`: ฟิลด์สำหรับการผูกหัวข้อ ACP แบบคงอยู่ (ดู [ACP Agents](/th/tools/acp-agents#channel-specific-settings))
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: กำหนดเส้นทางหัวข้อ DM ไปยังเอเจนต์ที่ระบุ (พฤติกรรมเดียวกับหัวข้อฟอรัม)
- `channels.telegram.execApprovals.enabled`: เปิดใช้งาน Telegram เป็นไคลเอนต์อนุมัติ exec แบบผ่านแชตสำหรับบัญชีนี้
- `channels.telegram.execApprovals.approvers`: Telegram user ID ที่อนุญาตให้อนุมัติหรือปฏิเสธคำขอ exec เป็นตัวเลือกเมื่อ `channels.telegram.allowFrom` หรือ `channels.telegram.defaultTo` โดยตรงระบุเจ้าของไว้แล้ว
- `channels.telegram.execApprovals.target`: `dm | channel | both` (ค่าเริ่มต้น: `dm`) `channel` และ `both` จะคงหัวข้อ Telegram ต้นทางไว้หากมี
- `channels.telegram.execApprovals.agentFilter`: ตัวกรอง agent ID แบบไม่บังคับสำหรับพรอมป์การอนุมัติที่ส่งต่อ
- `channels.telegram.execApprovals.sessionFilter`: ตัวกรอง session key แบบไม่บังคับ (substring หรือ regex) สำหรับพรอมป์การอนุมัติที่ส่งต่อ
- `channels.telegram.accounts.<account>.execApprovals`: override รายบัญชีสำหรับเส้นทางการอนุมัติ exec ของ Telegram และการอนุญาตผู้อนุมัติ
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (ค่าเริ่มต้น: allowlist)
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: override รายบัญชี
- `channels.telegram.commands.nativeSkills`: เปิด/ปิดคำสั่ง native Skills ของ Telegram
- `channels.telegram.replyToMode`: `off | first | all` (ค่าเริ่มต้น: `off`)
- `channels.telegram.textChunkLimit`: ขนาด chunk ขาออก (ตัวอักษร)
- `channels.telegram.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแยกที่บรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนการตัดตามความยาว
- `channels.telegram.linkPreview`: สลับการแสดงพรีวิวลิงก์สำหรับข้อความขาออก (ค่าเริ่มต้น: true)
- `channels.telegram.streaming`: `off | partial | block | progress` (พรีวิวการสตรีมแบบสด; ค่าเริ่มต้น: `partial`; `progress` จะถูกแมปเป็น `partial`; `block` ใช้เพื่อความเข้ากันได้กับโหมดพรีวิวแบบ legacy) การสตรีมพรีวิวของ Telegram ใช้ข้อความพรีวิวเพียงข้อความเดียวที่ถูกแก้ไขแทนที่
- `channels.telegram.streaming.preview.toolProgress`: ใช้ข้อความพรีวิวแบบสดซ้ำสำหรับการอัปเดตเครื่องมือ/ความคืบหน้าเมื่อการสตรีมพรีวิวทำงานอยู่ (ค่าเริ่มต้น: `true`) ตั้งค่าเป็น `false` เพื่อเก็บข้อความเครื่องมือ/ความคืบหน้าแยกต่างหาก
- `channels.telegram.mediaMaxMb`: ขีดจำกัดสื่อ Telegram ขาเข้า/ขาออก (MB, ค่าเริ่มต้น: 100)
- `channels.telegram.retry`: นโยบาย retry สำหรับตัวช่วยการส่งของ Telegram (CLI/tools/actions) เมื่อเกิดข้อผิดพลาด API ขาออกที่กู้คืนได้ (attempts, minDelayMs, maxDelayMs, jitter)
- `channels.telegram.network.autoSelectFamily`: override ค่า autoSelectFamily ของ Node (true=เปิด, false=ปิด) ค่าเริ่มต้นคือเปิดบน Node 22+ โดย WSL2 จะปิดไว้เป็นค่าเริ่มต้น
- `channels.telegram.network.dnsResultOrder`: override ลำดับผลลัพธ์ DNS (`ipv4first` หรือ `verbatim`) ค่าเริ่มต้นคือ `ipv4first` บน Node 22+
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: ตัวเลือกแบบอันตรายสำหรับสภาพแวดล้อม fake-IP หรือ transparent-proxy ที่เชื่อถือได้ ซึ่งการดาวน์โหลดสื่อ Telegram จะ resolve `api.telegram.org` ไปยังที่อยู่ private/internal/special-use ที่อยู่นอกช่วง benchmark ตาม RFC 2544 ที่อนุญาตโดยค่าเริ่มต้น
- `channels.telegram.proxy`: URL ของ proxy สำหรับการเรียก Bot API (SOCKS/HTTP)
- `channels.telegram.webhookUrl`: เปิดใช้โหมด Webhook (ต้องมี `channels.telegram.webhookSecret`)
- `channels.telegram.webhookSecret`: secret ของ Webhook (จำเป็นเมื่อมีการตั้งค่า webhookUrl)
- `channels.telegram.webhookPath`: พาธ Webhook ภายในเครื่อง (ค่าเริ่มต้น `/telegram-webhook`)
- `channels.telegram.webhookHost`: โฮสต์สำหรับ bind Webhook ภายในเครื่อง (ค่าเริ่มต้น `127.0.0.1`)
- `channels.telegram.webhookPort`: พอร์ตสำหรับ bind Webhook ภายในเครื่อง (ค่าเริ่มต้น `8787`)
- `channels.telegram.actions.reactions`: ควบคุมการเปิดใช้ reaction ของ Telegram tool
- `channels.telegram.actions.sendMessage`: ควบคุมการเปิดใช้การส่งข้อความของ Telegram tool
- `channels.telegram.actions.deleteMessage`: ควบคุมการเปิดใช้การลบข้อความของ Telegram tool
- `channels.telegram.actions.sticker`: ควบคุมการเปิดใช้ sticker action ของ Telegram — การส่งและการค้นหา (ค่าเริ่มต้น: false)
- `channels.telegram.reactionNotifications`: `off | own | all` — ควบคุมว่า reaction ใดจะกระตุ้น system event (ค่าเริ่มต้น: `own` หากไม่ได้ตั้งค่า)
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — ควบคุมความสามารถด้าน reaction ของเอเจนต์ (ค่าเริ่มต้น: `minimal` หากไม่ได้ตั้งค่า)
- `channels.telegram.errorPolicy`: `reply | silent` — ควบคุมพฤติกรรมการตอบกลับข้อผิดพลาด (ค่าเริ่มต้น: `reply`) รองรับการ override รายบัญชี/รายกลุ่ม/รายหัวข้อ
- `channels.telegram.errorCooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการตอบกลับข้อผิดพลาดไปยังแชตเดียวกัน (ค่าเริ่มต้น: `60000`) ป้องกันสแปมข้อผิดพลาดระหว่างระบบขัดข้อง

- [เอกสารอ้างอิงการตั้งค่า - Telegram](/th/gateway/configuration-reference#telegram)

ฟิลด์สำคัญเฉพาะ Telegram:

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; ไม่อนุญาต symlink)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- การอนุมัติ exec: `execApprovals`, `accounts.*.execApprovals`
- คำสั่ง/เมนู: `commands.native`, `commands.nativeSkills`, `customCommands`
- เธรด/การตอบกลับ: `replyToMode`
- การสตรีม: `streaming` (พรีวิว), `streaming.preview.toolProgress`, `blockStreaming`
- การจัดรูปแบบ/การส่งมอบ: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- สื่อ/เครือข่าย: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaction: `reactionNotifications`, `reactionLevel`
- ข้อผิดพลาด: `errorPolicy`, `errorCooldownMs`
- การเขียน/ประวัติ: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## ที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [กลุ่ม](/th/channels/groups)
- [ความปลอดภัย](/th/gateway/security)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
- [การแก้ไขปัญหา](/th/channels/troubleshooting)
