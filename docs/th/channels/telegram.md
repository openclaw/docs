---
read_when:
    - กำลังทำงานกับฟีเจอร์หรือ webhook ของ Telegram
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของบอต Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-25T13:42:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24c32a83e86358afb662c9c354a1b538c90693d07dcc048eaf047dabd6822f7e
    source_path: channels/telegram.md
    workflow: 15
---

พร้อมใช้งานจริงสำหรับ DM และกลุ่มของบอตผ่าน grammY โหมด long polling เป็นโหมดเริ่มต้น และโหมด webhook เป็นตัวเลือกเสริม

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับ Telegram คือ Pairing
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    แนวทางวินิจฉัยและแก้ไขปัญหาข้ามช่องทาง
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/th/gateway/configuration">
    รูปแบบการกำหนดค่าช่องทางแบบเต็มและตัวอย่าง
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="สร้าง bot token ใน BotFather">
    เปิด Telegram และแชตกับ **@BotFather** (ตรวจสอบว่า handle เป็น `@BotFather` ตรงตัว)

    เรียกใช้ `/newbot` ทำตามขั้นตอน และบันทึก token ไว้

  </Step>

  <Step title="กำหนดค่า token และนโยบาย DM">

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
    Telegram **ไม่ได้** ใช้ `openclaw channels login telegram`; ให้กำหนดค่า token ใน config/env แล้วจึงเริ่มต้น gateway

  </Step>

  <Step title="เริ่มต้น gateway และอนุมัติ DM แรก">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    รหัส Pairing หมดอายุภายใน 1 ชั่วโมง

  </Step>

  <Step title="เพิ่มบอตเข้ากลุ่ม">
    เพิ่มบอตลงในกลุ่มของคุณ จากนั้นตั้งค่า `channels.telegram.groups` และ `groupPolicy` ให้ตรงกับโมเดลการเข้าถึงของคุณ
  </Step>
</Steps>

<Note>
ลำดับการ resolve token รับรู้ขอบเขตของบัญชี ในทางปฏิบัติ ค่าใน config จะมีผลเหนือกว่า env สำรอง และ `TELEGRAM_BOT_TOKEN` จะใช้กับบัญชีเริ่มต้นเท่านั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="Privacy mode และการมองเห็นในกลุ่ม">
    โดยค่าเริ่มต้น บอต Telegram จะเปิด **Privacy Mode** ซึ่งจำกัดข้อความกลุ่มที่บอตได้รับ

    หากบอตต้องเห็นข้อความทั้งหมดในกลุ่ม ให้ทำอย่างใดอย่างหนึ่งต่อไปนี้:

    - ปิด privacy mode ผ่าน `/setprivacy` หรือ
    - ทำให้บอตเป็นแอดมินกลุ่ม

    เมื่อสลับ privacy mode ให้ลบบอตออกแล้วเพิ่มกลับเข้าไปใหม่ในแต่ละกลุ่ม เพื่อให้ Telegram ใช้การเปลี่ยนแปลงดังกล่าว

  </Accordion>

  <Accordion title="สิทธิ์ของกลุ่ม">
    สถานะแอดมินควบคุมได้ในการตั้งค่ากลุ่มของ Telegram

    บอตที่เป็นแอดมินจะได้รับข้อความทั้งหมดในกลุ่ม ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มแบบทำงานตลอดเวลา

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
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` รับ Telegram user ID แบบตัวเลข โดยรองรับคำนำหน้า `telegram:` / `tg:` และจะถูกปรับให้อยู่ในรูปแบบมาตรฐาน
    `dmPolicy: "allowlist"` ที่มี `allowFrom` ว่าง จะบล็อก DM ทั้งหมดและจะไม่ผ่านการตรวจสอบ config
    การตั้งค่าจะขอเฉพาะ user ID แบบตัวเลขเท่านั้น
    หากคุณอัปเกรดแล้ว config ของคุณมีรายการ allowlist แบบ `@username` ให้เรียกใช้ `openclaw doctor --fix` เพื่อ resolve รายการเหล่านั้น (best-effort; ต้องมี Telegram bot token)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์ allowlist ใน pairing store, `openclaw doctor --fix` สามารถกู้คืนรายการไปยัง `channels.telegram.allowFrom` ใน flow แบบ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID แบบระบุชัดเจน)

    สำหรับบอตที่มีเจ้าของคนเดียว ควรใช้ `dmPolicy: "allowlist"` พร้อม `allowFrom` ที่เป็น ID ตัวเลขแบบระบุชัดเจน เพื่อให้นโยบายการเข้าถึงคงอยู่ใน config อย่างถาวร (แทนที่จะพึ่งพาการอนุมัติ pairing ก่อนหน้า)

    ความสับสนที่พบบ่อย: การอนุมัติ DM Pairing ไม่ได้หมายความว่า "ผู้ส่งรายนี้ได้รับอนุญาตทุกที่"
    Pairing ให้สิทธิ์การเข้าถึง DM เท่านั้น การอนุญาตผู้ส่งในกลุ่มยังคงมาจาก allowlist ใน config ที่กำหนดไว้อย่างชัดเจน
    หากคุณต้องการให้ "ฉันได้รับอนุญาตครั้งเดียว แล้วใช้ได้ทั้ง DM และคำสั่งกลุ่ม" ให้ใส่ Telegram user ID แบบตัวเลขของคุณใน `channels.telegram.allowFrom`

    ### การหา Telegram user ID ของคุณ

    วิธีที่ปลอดภัยกว่า (ไม่ใช้บอตของบุคคลที่สาม):

    1. ส่ง DM ถึงบอตของคุณ
    2. เรียกใช้ `openclaw logs --follow`
    3. อ่าน `from.id`

    วิธีอย่างเป็นทางการผ่าน Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีผ่านบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="นโยบายกลุ่มและ allowlist">
    มีตัวควบคุมสองส่วนที่ทำงานร่วมกัน:

    1. **กลุ่มใดได้รับอนุญาต** (`channels.telegram.groups`)
       - ไม่มี config `groups`:
         - เมื่อ `groupPolicy: "open"`: ทุกกลุ่มสามารถผ่านการตรวจสอบ group-ID ได้
         - เมื่อ `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการใน `groups` (หรือ `"*"`)
       - มีการกำหนดค่า `groups`: จะทำหน้าที่เป็น allowlist (ID แบบระบุชัดเจนหรือ `"*"`)

    2. **ผู้ส่งใดได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับการกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่า Telegram จะย้อนกลับไปใช้ `allowFrom`
    รายการใน `groupAllowFrom` ควรเป็น Telegram user ID แบบตัวเลข (`telegram:` / `tg:` จะถูกปรับให้อยู่ในรูปแบบมาตรฐาน)
    อย่าใส่ Telegram group หรือ supergroup chat ID ลงใน `groupAllowFrom` negative chat ID ควรอยู่ภายใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเลยสำหรับการอนุญาตผู้ส่ง
    ขอบเขตความปลอดภัย (`2026.2.25+`): การยืนยันผู้ส่งในกลุ่ม **จะไม่** สืบทอดการอนุมัติจาก pairing store ของ DM
    Pairing ยังคงเป็น DM-only สำหรับกลุ่ม ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` แบบต่อกลุ่ม/ต่อหัวข้อ
    หากไม่ได้ตั้งค่า `groupAllowFrom` Telegram จะย้อนกลับไปใช้ `allowFrom` ใน config ไม่ใช่ pairing store
    รูปแบบที่ใช้ได้จริงสำหรับบอตเจ้าของคนเดียว: ตั้ง user ID ของคุณใน `channels.telegram.allowFrom`, ไม่ต้องตั้ง `groupAllowFrom`, และอนุญาตกลุ่มเป้าหมายภายใต้ `channels.telegram.groups`
    หมายเหตุด้าน runtime: หากไม่มี `channels.telegram` เลย runtime จะใช้ค่าเริ่มต้นแบบ fail-closed คือ `groupPolicy="allowlist"` เว้นแต่จะมีการตั้งค่า `channels.defaults.groupPolicy` ไว้อย่างชัดเจน

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

      - ใส่ Telegram group หรือ supergroup chat ID แบบติดลบ เช่น `-1001234567890` ไว้ใต้ `channels.telegram.groups`
      - ใส่ Telegram user ID เช่น `8734062810` ไว้ใต้ `groupAllowFrom` เมื่อต้องการจำกัดว่าคนใดภายในกลุ่มที่ได้รับอนุญาตสามารถเรียกใช้บอตได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกคนใดก็ได้ของกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอตได้
    </Warning>

  </Tab>

  <Tab title="พฤติกรรมการ mention">
    โดยค่าเริ่มต้น การตอบกลับในกลุ่มต้องมีการ mention

    การ mention อาจมาจาก:

    - การ mention แบบเนทีฟ `@botusername` หรือ
    - รูปแบบการ mention ใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    การสลับโหมดคำสั่งในระดับเซสชัน:

    - `/activation always`
    - `/activation mention`

    สิ่งเหล่านี้จะอัปเดตเฉพาะสถานะของเซสชันเท่านั้น ใช้ config หากต้องการให้คงอยู่ถาวร

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

    การดู group chat ID:

    - ส่งต่อข้อความจากกลุ่มไปที่ `@userinfobot` / `@getidsbot`
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจสอบผ่าน Bot API `getUpdates`

  </Tab>
</Tabs>

## พฤติกรรมขณะทำงาน

- Telegram เป็นของกระบวนการ gateway
- การกำหนดเส้นทางเป็นแบบกำหนดแน่นอน: ข้อความตอบกลับขาเข้าจาก Telegram จะตอบกลับไปที่ Telegram (โมเดลไม่ได้เป็นผู้เลือกช่องทาง)
- ข้อความขาเข้าจะถูก normalize ให้อยู่ใน shared channel envelope พร้อม metadata ของการตอบกลับและ placeholder ของสื่อ
- เซสชันของกลุ่มจะถูกแยกตาม group ID หัวข้อของ forum จะต่อท้าย `:topic:<threadId>` เพื่อให้แต่ละหัวข้อแยกจากกัน
- ข้อความ DM สามารถมี `message_thread_id`; OpenClaw จะกำหนดเส้นทางด้วย session key ที่รับรู้เธรด และคง thread ID ไว้สำหรับการตอบกลับ
- Long polling ใช้ grammY runner พร้อมการจัดลำดับต่อแชต/ต่อเธรด ระดับ concurrency รวมของ runner sink ใช้ `agents.defaults.maxConcurrent`
- Long polling ถูกป้องกันภายในแต่ละกระบวนการ gateway เพื่อให้มี active poller เพียงตัวเดียวที่ใช้ bot token ได้ในแต่ละครั้ง หากคุณยังเห็นความขัดแย้ง `getUpdates` 409 เป็นไปได้ว่ามี OpenClaw gateway, สคริปต์ หรือ poller ภายนอกอื่นกำลังใช้ token เดียวกัน
- ตัว watchdog ของ long-polling จะรีสตาร์ทหากไม่มี completed `getUpdates` liveness ภายใน 120 วินาทีตามค่าเริ่มต้น เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อ deployment ของคุณยังพบการรีสตาร์ทจาก polling stall ที่เป็นผลลวงระหว่างงานที่ใช้เวลานาน ค่านี้มีหน่วยเป็นมิลลิวินาที และอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับการแทนที่ต่อบัญชี
- Telegram Bot API ไม่มีการรองรับ read receipt (`sendReadReceipts` ใช้ไม่ได้)

## ข้อมูลอ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="พรีวิวสตรีมแบบสด (การแก้ไขข้อความ)">
    OpenClaw สามารถสตรีมการตอบกลับบางส่วนแบบเรียลไทม์ได้:

    - แชตส่วนตัว: ข้อความพรีวิว + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความพรีวิว + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` เป็น `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - `progress` จะถูกแมปเป็น `partial` บน Telegram (เพื่อความเข้ากันได้กับการตั้งชื่อข้ามช่องทาง)
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดต tool/progress จะใช้ข้อความพรีวิวที่แก้ไขเดิมซ้ำหรือไม่ (ค่าเริ่มต้น: `true` เมื่อพรีวิวสตรีมเปิดใช้งาน)
    - ระบบจะตรวจจับ `channels.telegram.streamMode` แบบเดิมและค่า `streaming` แบบบูลีน; เรียกใช้ `openclaw doctor --fix` เพื่อย้ายไปใช้ `channels.telegram.streaming.mode`

    การอัปเดตพรีวิวความคืบหน้าของ tool คือบรรทัดสั้น ๆ แบบ "กำลังทำงาน..." ที่แสดงขณะ tool กำลังทำงาน เช่น การรันคำสั่ง การอ่านไฟล์ การอัปเดตแผน หรือสรุปแพตช์ Telegram เปิดสิ่งนี้ไว้ตามค่าเริ่มต้นเพื่อให้ตรงกับพฤติกรรมของ OpenClaw ที่เผยแพร่ตั้งแต่ `v2026.4.22` ขึ้นไป หากต้องการคงพรีวิวที่แก้ไขไว้สำหรับข้อความคำตอบ แต่ซ่อนบรรทัดความคืบหน้าของ tool ให้ตั้งค่า:

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

    ใช้ `streaming.mode: "off"` เฉพาะเมื่อคุณต้องการปิดการแก้ไขพรีวิวของ Telegram ทั้งหมด ใช้ `streaming.preview.toolProgress: false` เมื่อต้องการปิดเฉพาะบรรทัดสถานะความคืบหน้าของ tool

    สำหรับการตอบกลับแบบข้อความล้วน:

    - DM: OpenClaw จะคงข้อความพรีวิวเดิมไว้และทำการแก้ไขครั้งสุดท้ายในตำแหน่งเดิม (ไม่มีข้อความที่สอง)
    - กลุ่ม/หัวข้อ: OpenClaw จะคงข้อความพรีวิวเดิมไว้และทำการแก้ไขครั้งสุดท้ายในตำแหน่งเดิม (ไม่มีข้อความที่สอง)

    สำหรับการตอบกลับที่ซับซ้อน (เช่น payload สื่อ) OpenClaw จะย้อนกลับไปใช้การส่งปลายทางแบบปกติ แล้วจึงล้างข้อความพรีวิว

    พรีวิวสตรีมแยกจาก block streaming เมื่อเปิด block streaming อย่างชัดเจนสำหรับ Telegram แล้ว OpenClaw จะข้ามพรีวิวสตรีมเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

    หาก native draft transport ไม่พร้อมใช้งาน/ถูกปฏิเสธ OpenClaw จะย้อนกลับไปใช้ `sendMessage` + `editMessageText` โดยอัตโนมัติ

    สตรีม reasoning เฉพาะ Telegram:

    - `/reasoning stream` จะส่ง reasoning ไปยังพรีวิวสดระหว่างการสร้าง
    - คำตอบสุดท้ายจะถูกส่งโดยไม่มีข้อความ reasoning

  </Accordion>

  <Accordion title="การจัดรูปแบบและ HTML fallback">
    ข้อความขาออกใช้ Telegram `parse_mode: "HTML"`

    - ข้อความลักษณะ Markdown จะถูกเรนเดอร์เป็น HTML ที่ปลอดภัยสำหรับ Telegram
    - HTML ดิบจากโมเดลจะถูก escape เพื่อลดความล้มเหลวในการ parse ของ Telegram
    - หาก Telegram ปฏิเสธ HTML ที่ parse แล้ว OpenClaw จะลองใหม่เป็นข้อความธรรมดา

    การแสดงตัวอย่างลิงก์เปิดใช้งานตามค่าเริ่มต้น และสามารถปิดได้ด้วย `channels.telegram.linkPreview: false`

  </Accordion>

  <Accordion title="คำสั่งแบบเนทีฟและคำสั่งแบบกำหนดเอง">
    การลงทะเบียนเมนูคำสั่งของ Telegram จะถูกจัดการตอนเริ่มต้นด้วย `setMyCommands`

    ค่าเริ่มต้นของคำสั่งแบบเนทีฟ:

    - `commands.native: "auto"` จะเปิดใช้คำสั่งแบบเนทีฟสำหรับ Telegram

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

    - ชื่อจะถูกปรับให้อยู่ในรูปแบบมาตรฐาน (ตัด `/` นำหน้าออก, ใช้อักษรตัวพิมพ์เล็ก)
    - รูปแบบที่ถูกต้อง: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งแบบกำหนดเองไม่สามารถแทนที่คำสั่งแบบเนทีฟได้
    - ความขัดแย้ง/รายการซ้ำจะถูกข้ามและบันทึกไว้

    หมายเหตุ:

    - คำสั่งแบบกำหนดเองเป็นเพียงรายการในเมนูเท่านั้น ไม่ได้มีการทำงานให้อัตโนมัติ
    - คำสั่งจาก Plugin/Skills ยังสามารถทำงานได้เมื่อพิมพ์ แม้จะไม่แสดงในเมนู Telegram

    หากปิดคำสั่งแบบเนทีฟ คำสั่งในตัวจะถูกนำออก คำสั่งแบบกำหนดเอง/Plugin อาจยังลงทะเบียนได้หากมีการกำหนดค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังมีรายการมากเกินไปหลังจากตัดลดแล้ว; ให้ลดจำนวนคำสั่งจาก Plugin/Skills/แบบกำหนดเอง หรือปิด `channels.telegram.commands.native`
    - `setMyCommands failed` พร้อมข้อผิดพลาด network/fetch โดยทั่วไปหมายความว่า DNS/HTTPS ขาออกไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งการจับคู่อุปกรณ์ (Plugin `device-pair`)

    เมื่อติดตั้ง Plugin `device-pair` แล้ว:

    1. `/pair` จะสร้าง setup code
    2. วางรหัสในแอป iOS
    3. `/pair pending` จะแสดงรายการคำขอที่รอดำเนินการ (รวมถึง role/scope)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบระบุชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    setup code มี bootstrap token แบบอายุสั้น การ handoff bootstrap ในตัวจะคง token หลักของ node ไว้ที่ `scopes: []`; token operator ที่ถูก handed-off จะยังคงถูกจำกัดอยู่ที่ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write` การตรวจสอบ scope ของ bootstrap ใช้คำนำหน้าตาม role ดังนั้น allowlist ของ operator จะตอบสนองได้เฉพาะคำขอของ operator; role ที่ไม่ใช่ operator ยังคงต้องมี scope ภายใต้คำนำหน้าของ role ของตนเอง

    หากอุปกรณ์ลองใหม่ด้วยรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (เช่น role/scope/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` คนละตัว ให้เรียก `/pair pending` ใหม่อีกครั้งก่อนอนุมัติ

    รายละเอียดเพิ่มเติม: [Pairing](/th/channels/pairing#pair-via-telegram-recommended-for-ios)

  </Accordion>

  <Accordion title="ปุ่มอินไลน์">
    กำหนดค่าขอบเขตของแป้นพิมพ์อินไลน์:

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

    ค่าแบบเดิม `capabilities: ["inlineButtons"]` จะถูกแมปเป็น `inlineButtons: "all"`

    ตัวอย่าง action ของข้อความ:

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

    การคลิก callback จะถูกส่งต่อไปยังเอเจนต์ในรูปแบบข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message action สำหรับเอเจนต์และระบบอัตโนมัติ">
    Telegram tool action ประกอบด้วย:

    - `sendMessage` (`to`, `content`, ตัวเลือก `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, ตัวเลือก `iconColor`, `iconCustomEmojiId`)

    Channel message action มี alias ที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    ตัวควบคุมการเปิดใช้:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้งาน)

    หมายเหตุ: `edit` และ `topic-create` เปิดใช้งานตามค่าเริ่มต้นอยู่แล้วในปัจจุบัน และไม่มีสวิตช์ `channels.telegram.actions.*` แยกต่างหาก
    การส่งขณะทำงานจะใช้ snapshot ของ config/secrets ที่ใช้งานอยู่ (ตอนเริ่มต้น/รีโหลด) ดังนั้นเส้นทาง action จะไม่ทำการ resolve SecretRef แบบเฉพาะกิจซ้ำใหม่ทุกครั้งที่ส่ง

    ความหมายของการนำ reaction ออก: [/tools/reactions](/th/tools/reactions)

  </Accordion>

  <Accordion title="แท็กการตอบกลับแบบเธรด">
    Telegram รองรับแท็กการตอบกลับแบบเธรดอย่างชัดเจนในผลลัพธ์ที่สร้างขึ้น:

    - `[[reply_to_current]]` ตอบกลับข้อความที่เป็นตัวกระตุ้น
    - `[[reply_to:<id>]]` ตอบกลับไปยัง Telegram message ID ที่ระบุ

    `channels.telegram.replyToMode` ควบคุมการจัดการ:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`

    หมายเหตุ: `off` จะปิดการตอบกลับแบบเธรดโดยปริยาย แต่แท็ก `[[reply_to_*]]` แบบระบุชัดเจนจะยังคงมีผล

  </Accordion>

  <Accordion title="หัวข้อฟอรัมและพฤติกรรมของเธรด">
    Forum supergroup:

    - session key ของหัวข้อจะต่อท้ายด้วย `:topic:<threadId>`
    - การตอบกลับและสถานะกำลังพิมพ์จะกำหนดเป้าหมายไปยังเธรดของหัวข้อ
    - พาธ config ของหัวข้อ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของหัวข้อทั่วไป (`threadId=1`):

    - การส่งข้อความจะละ `message_thread_id` ออก (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - action การพิมพ์จะยังคงรวม `message_thread_id`

    การสืบทอดของหัวข้อ: รายการของหัวข้อจะสืบทอดการตั้งค่าของกลุ่ม เว้นแต่จะมีการแทนที่ (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` เป็นค่าเฉพาะระดับหัวข้อและจะไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม

    **การกำหนดเส้นทางเอเจนต์ต่อหัวข้อ**: แต่ละหัวข้อสามารถกำหนดเส้นทางไปยังเอเจนต์ที่ต่างกันได้โดยตั้งค่า `agentId` ใน config ของหัวข้อ ซึ่งทำให้แต่ละหัวข้อมี workspace, memory และ session ที่แยกจากกัน ตัวอย่าง:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // หัวข้อ General → เอเจนต์ main
                "3": { agentId: "zu" },        // หัวข้อ Dev → เอเจนต์ zu
                "5": { agentId: "coder" }      // Code review → เอเจนต์ coder
              }
            }
          }
        }
      }
    }
    ```

    จากนั้นแต่ละหัวข้อจะมี session key ของตัวเอง: `agent:zu:telegram:group:-1001234567890:topic:3`

    **การ bind หัวข้อ ACP แบบถาวร**: หัวข้อในฟอรัมสามารถปักหมุดเซสชัน ACP harness ผ่าน ACP binding แบบมีชนิดระดับบนสุดได้ (`bindings[]` โดยมี `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ id ที่ระบุหัวข้อ เช่น `-1001234567890:topic:42`) ปัจจุบันจำกัดขอบเขตไว้กับหัวข้อฟอรัมในกลุ่ม/supergroup ดู [ACP Agents](/th/tools/acp-agents)

    **การสร้าง ACP แบบผูกกับเธรดจากแชต**: `/acp spawn <agent> --thread here|auto` จะ bind หัวข้อปัจจุบันเข้ากับเซสชัน ACP ใหม่; ข้อความติดตามผลจะถูกกำหนดเส้นทางไปที่นั่นโดยตรง OpenClaw จะปักหมุดข้อความยืนยันการสร้างไว้ในหัวข้อนั้น ต้องใช้ `channels.telegram.threadBindings.spawnAcpSessions=true`

    Template context แสดง `MessageThreadId` และ `IsForum` แชต DM ที่มี `message_thread_id` จะยังคงใช้การกำหนดเส้นทางแบบ DM แต่ใช้ session key ที่รับรู้เธรด

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยก voice note ออกจากไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมแบบไฟล์เสียง
    - แท็ก `[[audio_as_voice]]` ในคำตอบของเอเจนต์เพื่อบังคับส่งเป็น voice note

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

    Telegram แยกไฟล์วิดีโอออกจาก video note

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

    Video note ไม่รองรับคำบรรยาย; ข้อความที่ให้มาจะถูกส่งแยกต่างหาก

    ### สติกเกอร์

    การจัดการสติกเกอร์ขาเข้า:

    - WEBP แบบคงที่: ดาวน์โหลดและประมวลผล (placeholder `<media:sticker>`)
    - TGS แบบเคลื่อนไหว: ข้าม
    - WEBM แบบวิดีโอ: ข้าม

    ฟิลด์ context ของสติกเกอร์:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ไฟล์แคชสติกเกอร์:

    - `~/.openclaw/telegram/sticker-cache.json`

    สติกเกอร์จะถูกอธิบายหนึ่งครั้ง (เมื่อเป็นไปได้) และแคชไว้เพื่อลดการเรียกใช้ vision ซ้ำ

    เปิดใช้ action ของสติกเกอร์:

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

    Action สำหรับส่งสติกเกอร์:

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
    reaction ของ Telegram จะเข้ามาเป็นอัปเดต `message_reaction` (แยกจาก payload ของข้อความ)

    เมื่อเปิดใช้งาน OpenClaw จะนำ system event เข้าคิว เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    การกำหนดค่า:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึง reaction ของผู้ใช้ต่อข้อความที่บอตส่งเท่านั้น (best-effort ผ่านแคชข้อความที่ส่ง)
    - event ของ reaction ยังคงเคารพการควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ได้ให้ thread ID มาในอัปเดต reaction
      - กลุ่มที่ไม่ใช่ฟอรัมจะถูกกำหนดเส้นทางไปยังเซสชันแชตของกลุ่ม
      - กลุ่มฟอรัมจะถูกกำหนดเส้นทางไปยังเซสชันหัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อที่เป็นต้นทางจริง

    `allowed_updates` สำหรับ polling/webhook จะรวม `message_reaction` โดยอัตโนมัติ

  </Accordion>

  <Accordion title="Ack reaction">
    `ackReaction` จะส่งอีโมจิยืนยันตอบรับขณะ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback เป็นอีโมจิ identity ของเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้นเป็น "👀")

    หมายเหตุ:

    - Telegram ต้องใช้อีโมจิแบบ unicode (เช่น "👀")
    - ใช้ `""` เพื่อปิด reaction สำหรับช่องทางหรือบัญชี

  </Accordion>

  <Accordion title="การเขียน config จาก event และคำสั่งของ Telegram">
    การเขียน config ของช่องทางเปิดใช้งานตามค่าเริ่มต้น (`configWrites !== false`)

    การเขียนที่ถูกทริกเกอร์จาก Telegram รวมถึง:

    - event การย้ายกลุ่ม (`migrate_to_chat_id`) เพื่ออัปเดต `channels.telegram.groups`
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
    ค่าเริ่มต้นคือ long polling สำหรับโหมด webhook ให้ตั้ง `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; ตัวเลือกเสริมคือ `webhookPath`, `webhookHost`, `webhookPort` (ค่าเริ่มต้น `/telegram-webhook`, `127.0.0.1`, `8787`)

    local listener จะ bind กับ `127.0.0.1:8787` สำหรับ public ingress ให้ใช้ reverse proxy หน้า local port หรือกำหนด `webhookHost: "0.0.0.0"` อย่างตั้งใจ

    โหมด webhook จะตรวจสอบ request guard, secret token ของ Telegram และ JSON body ก่อนส่งกลับ `200` ไปยัง Telegram
จากนั้น OpenClaw จะประมวลผล update แบบอะซิงโครนัสผ่าน lane ของบอตแบบต่อแชต/ต่อหัวข้อเดียวกับที่ใช้ใน long polling ดังนั้นรอบการทำงานของเอเจนต์ที่ช้าจึงไม่ทำให้ delivery ACK ของ Telegram ถูกหน่วง

  </Accordion>

  <Accordion title="ขีดจำกัด การลองใหม่ และเป้าหมายของ CLI">
    - `channels.telegram.textChunkLimit` มีค่าเริ่มต้นเป็น 4000
    - `channels.telegram.chunkMode="newline"` จะให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนแบ่งตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ทั้งขาเข้าและขาออก
    - `channels.telegram.timeoutSeconds` ใช้แทนค่า timeout ของไคลเอนต์ Telegram API (หากไม่ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY)
    - `channels.telegram.pollingStallThresholdMs` มีค่าเริ่มต้นเป็น `120000`; ปรับได้ระหว่าง `30000` ถึง `600000` เฉพาะกรณีที่เกิดการรีสตาร์ทจาก polling stall แบบ false positive
    - ประวัติ context ของกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` คือปิดใช้งาน
    - context เสริมจากการตอบกลับ/อ้างอิง/ส่งต่อ ปัจจุบันจะถูกส่งผ่านตามที่ได้รับ
    - allowlist ของ Telegram ใช้ควบคุมเป็นหลักว่าใครสามารถทริกเกอร์เอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิด context เสริมแบบสมบูรณ์
    - ตัวควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - การกำหนดค่า `channels.telegram.retry` ใช้กับตัวช่วยส่งของ Telegram (CLI/tools/actions) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้

    เป้าหมายการส่งของ CLI สามารถเป็น chat ID แบบตัวเลขหรือ username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    การทำ poll ของ Telegram ใช้ `openclaw message poll` และรองรับหัวข้อฟอรัม:

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
    - `--thread-id` สำหรับหัวข้อฟอรัม (หรือใช้ target แบบ `:topic:`)

    การส่งของ Telegram ยังรองรับ:

    - `--presentation` พร้อมบล็อก `buttons` สำหรับแป้นพิมพ์อินไลน์ เมื่อ `channels.telegram.capabilities.inlineButtons` อนุญาต
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอการส่งแบบปักหมุดเมื่อบอตสามารถปักหมุดในแชตนั้นได้
    - `--force-document` เพื่อส่งรูปภาพและ GIF ขาออกเป็น document แทนการอัปโหลดแบบรูปภาพบีบอัดหรือสื่อเคลื่อนไหว

    การควบคุมการเปิดใช้ action:

    - `channels.telegram.actions.sendMessage=false` จะปิดข้อความ Telegram ขาออก รวมถึง poll
    - `channels.telegram.actions.poll=false` จะปิดการสร้าง poll ของ Telegram ขณะยังคงเปิดการส่งข้อความปกติ

  </Accordion>

  <Accordion title="การอนุมัติ exec ใน Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถเลือกให้โพสต์พรอมต์ในแชตหรือหัวข้อที่เป็นต้นทางได้ ผู้อนุมัติต้องเป็น Telegram user ID แบบตัวเลข

    พาธ config:

    - `channels.telegram.execApprovals.enabled` (เปิดใช้อัตโนมัติเมื่อสามารถ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งราย)
    - `channels.telegram.execApprovals.approvers` (fallback ไปยัง owner ID แบบตัวเลขจาก `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    การส่งในช่องทางจะแสดงข้อความคำสั่งในแชต; เปิดใช้ `channel` หรือ `both` เฉพาะในกลุ่ม/หัวข้อที่เชื่อถือได้เท่านั้น เมื่อพรอมต์ถูกส่งไปยังหัวข้อฟอรัม OpenClaw จะคงหัวข้อนั้นไว้สำหรับพรอมต์อนุมัติและข้อความติดตามผล การอนุมัติ exec หมดอายุภายใน 30 นาทีตามค่าเริ่มต้น

    ปุ่มอนุมัติแบบอินไลน์ยังต้องให้ `channels.telegram.capabilities.inlineButtons` อนุญาตพื้นผิวเป้าหมาย (`dm`, `group` หรือ `all`) ด้วย approval ID ที่ขึ้นต้นด้วย `plugin:` จะ resolve ผ่านการอนุมัติของ Plugin; ส่วน ID อื่นจะ resolve ผ่านการอนุมัติ exec ก่อน

    ดู [Exec approvals](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## ตัวควบคุมการตอบกลับข้อผิดพลาด

เมื่อเอเจนต์พบข้อผิดพลาดด้านการส่งหรือ provider Telegram สามารถตอบกลับด้วยข้อความข้อผิดพลาดหรือระงับไว้ได้ มี config key สองตัวที่ควบคุมพฤติกรรมนี้:

| คีย์                                | ค่า              | ค่าเริ่มต้น | คำอธิบาย                                                                                  |
| ----------------------------------- | ---------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` จะส่งข้อความข้อผิดพลาดที่เป็นมิตรกลับไปยังแชต `silent` จะระงับการตอบกลับข้อผิดพลาดทั้งหมด |
| `channels.telegram.errorCooldownMs` | number (ms)      | `60000`     | เวลาขั้นต่ำระหว่างการตอบกลับข้อผิดพลาดไปยังแชตเดียวกัน ป้องกันการส่งข้อผิดพลาดรัวระหว่างระบบขัดข้อง |

รองรับการแทนที่ต่อบัญชี ต่อกลุ่ม และต่อหัวข้อ (ใช้การสืบทอดแบบเดียวกับ config key อื่นของ Telegram)

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

    - หาก `requireMention=false` privacy mode ของ Telegram ต้องอนุญาตให้มองเห็นได้ทั้งหมด
      - BotFather: `/setprivacy` -> Disable
      - จากนั้นลบแล้วเพิ่มบอตกลับเข้ากลุ่มใหม่
    - `openclaw channels status` จะแจ้งเตือนเมื่อ config คาดหวังข้อความกลุ่มที่ไม่มีการ mention
    - `openclaw channels status --probe` สามารถตรวจสอบ group ID แบบตัวเลขที่ระบุชัดเจนได้; wildcard `"*"` ไม่สามารถ probe สมาชิกภาพได้
    - ทดสอบเซสชันอย่างรวดเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอตไม่เห็นข้อความกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` กลุ่มนั้นต้องถูกระบุไว้ (หรือมี `"*"`)
    - ตรวจสอบการเป็นสมาชิกของบอตในกลุ่ม
    - ตรวจสอบบันทึก: `openclaw logs --follow` เพื่อดูเหตุผลที่ถูกข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานได้บางส่วนหรือใช้ไม่ได้เลย">

    - อนุญาตตัวตนผู้ส่งของคุณ (pairing และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังคงมีผลแม้ `groupPolicy` จะเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนูแบบเนทีฟมีรายการมากเกินไป; ให้ลดคำสั่งจาก Plugin/Skills/แบบกำหนดเอง หรือปิดเมนูแบบเนทีฟ
    - `setMyCommands failed` พร้อมข้อผิดพลาด network/fetch มักชี้ถึงปัญหาการเข้าถึง DNS/HTTPS ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="Polling หรือเครือข่ายไม่เสถียร">

    - Node 22+ + fetch/proxy แบบกำหนดเอง อาจทำให้เกิดพฤติกรรม abort ทันทีหากชนิดของ AbortSignal ไม่ตรงกัน
    - โฮสต์บางแห่ง resolve `api.telegram.org` เป็น IPv6 ก่อน; หาก IPv6 egress เสีย อาจทำให้ Telegram API ล้มเหลวเป็นช่วง ๆ
    - หากบันทึกมี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!` ตอนนี้ OpenClaw จะลองใหม่ให้เป็นข้อผิดพลาดเครือข่ายที่กู้คืนได้
    - หากบันทึกมี `Polling stall detected` OpenClaw จะรีสตาร์ท polling และสร้าง Telegram transport ใหม่หลังจากไม่มี completed long-poll liveness เป็นเวลา 120 วินาทีตามค่าเริ่มต้น
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่ใช้เวลานานยังทำงานปกติ แต่โฮสต์ของคุณยังรายงานการรีสตาร์ทจาก polling stall แบบ false positive ต่อเนื่อง stall แบบต่อเนื่องมักชี้ไปที่ปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่างโฮสต์กับ `api.telegram.org`
    - บนโฮสต์ VPS ที่ direct egress/TLS ไม่เสถียร ให้กำหนดเส้นทางการเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ ใช้ค่าเริ่มต้น `autoSelectFamily=true` (ยกเว้น WSL2) และ `dnsResultOrder=ipv4first`
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนเมื่อใช้พฤติกรรมแบบ IPv4-only ให้บังคับการเลือก family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบช่วง benchmark ตาม RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาต
      สำหรับการดาวน์โหลดสื่อของ Telegram ตามค่าเริ่มต้นอยู่แล้ว หาก fake-IP หรือ
      transparent proxy ที่เชื่อถือได้เขียนทับ `api.telegram.org` เป็น
      ที่อยู่ private/internal/special-use อื่นระหว่างการดาวน์โหลดสื่อ คุณสามารถเลือกเปิด
      bypass เฉพาะ Telegram นี้ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - ตัวเลือกนี้ยังมีให้ใช้ต่อบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หาก proxy ของคุณ resolve โฮสต์สื่อของ Telegram เป็น `198.18.x.x` ให้ปล่อย
      dangerous flag ปิดไว้ก่อน Telegram media อนุญาตช่วง benchmark ตาม RFC 2544
      อยู่แล้วตามค่าเริ่มต้น

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` ทำให้การป้องกัน SSRF ของสื่อ Telegram อ่อนลง ใช้เฉพาะในสภาพแวดล้อม proxy ที่ผู้ปฏิบัติงานควบคุมและเชื่อถือได้ เช่น การกำหนดเส้นทาง fake-IP ของ Clash, Mihomo หรือ Surge เมื่อระบบเหล่านั้นสร้างคำตอบ private หรือ special-use ที่อยู่นอกช่วง benchmark ตาม RFC 2544 ปล่อยให้ปิดไว้สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ
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

ความช่วยเหลือเพิ่มเติม: [Channel troubleshooting](/th/channels/troubleshooting)

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [Configuration reference - Telegram](/th/gateway/config-channels#telegram)

<Accordion title="ฟิลด์ Telegram ที่มีสัญญาณสูง">

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; symlink จะถูกปฏิเสธ)
- access control: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- exec approvals: `execApprovals`, `accounts.*.execApprovals`
- command/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/replies: `replyToMode`
- streaming: `streaming` (พรีวิว), `streaming.preview.toolProgress`, `blockStreaming`
- formatting/delivery: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/network: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions: `reactionNotifications`, `reactionLevel`
- errors: `errorPolicy`, `errorCooldownMs`
- writes/history: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญของหลายบัญชี: เมื่อมีการกำหนด account ID สองรายการขึ้นไป ให้ตั้ง `channels.telegram.defaultAccount` (หรือใส่ `channels.telegram.accounts.default`) เพื่อทำให้การกำหนดเส้นทางเริ่มต้นชัดเจน มิฉะนั้น OpenClaw จะ fallback ไปยัง account ID ตัวแรกที่ถูก normalize และ `openclaw doctor` จะเตือน บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom` แต่จะไม่สืบทอดค่าจาก `accounts.default.*`
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Telegram เข้ากับ Gateway
  </Card>
  <Card title="Groups" icon="users" href="/th/channels/groups">
    พฤติกรรม allowlist ของกลุ่มและหัวข้อ
  </Card>
  <Card title="Channel routing" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="Security" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเสริมความปลอดภัย
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกลุ่มและหัวข้อไปยังเอเจนต์
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทาง
  </Card>
</CardGroup>
