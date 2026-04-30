---
read_when:
    - การทำงานกับฟีเจอร์ Telegram หรือ Webhook
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของบอต Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-30T16:27:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d18ca6c7ab39d7d34848c562857661501d8364329f6e5a266213aa23846047dd
    source_path: channels/telegram.md
    workflow: 16
---

พร้อมใช้งานจริงสำหรับ DM ของบอทและกลุ่มผ่าน grammY โหมดเริ่มต้นคือ long polling; โหมด webhook เป็นทางเลือก

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับ Telegram คือการจับคู่
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและคู่มือการซ่อมแซม
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าช่องทางแบบครบถ้วน
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="Create the bot token in BotFather">
    เปิด Telegram แล้วแชทกับ **@BotFather** (ตรวจสอบว่า handle เป็น `@BotFather` ตรงทุกตัว)

    รัน `/newbot` ทำตามพรอมป์ และบันทึก token ไว้

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

    fallback ของ env: `TELEGRAM_BOT_TOKEN=...` (เฉพาะบัญชีเริ่มต้น)
    Telegram **ไม่** ใช้ `openclaw channels login telegram`; ให้กำหนดค่า token ใน config/env แล้วเริ่ม gateway

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
    เพิ่มบอทไปยังกลุ่มของคุณ จากนั้นตั้งค่า `channels.telegram.groups` และ `groupPolicy` ให้ตรงกับโมเดลการเข้าถึงของคุณ
  </Step>
</Steps>

<Note>
ลำดับการแก้ค่า token รับรู้ตามบัญชี ในทางปฏิบัติ ค่า config มีสิทธิ์เหนือ fallback ของ env และ `TELEGRAM_BOT_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    บอท Telegram ใช้ **Privacy Mode** เป็นค่าเริ่มต้น ซึ่งจำกัดข้อความกลุ่มที่บอทจะได้รับ

    หากบอทต้องเห็นข้อความกลุ่มทั้งหมด ให้ทำอย่างใดอย่างหนึ่ง:

    - ปิด privacy mode ผ่าน `/setprivacy` หรือ
    - ทำให้บอทเป็นผู้ดูแลกลุ่ม

    เมื่อสลับ privacy mode ให้นำบอทออกแล้วเพิ่มกลับเข้าไปใหม่ในแต่ละกลุ่ม เพื่อให้ Telegram ใช้การเปลี่ยนแปลง

  </Accordion>

  <Accordion title="Group permissions">
    สถานะผู้ดูแลควบคุมได้ในการตั้งค่ากลุ่ม Telegram

    บอทผู้ดูแลจะได้รับข้อความกลุ่มทั้งหมด ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มที่ทำงานตลอดเวลา

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
    - `allowlist` (ต้องมี sender ID อย่างน้อยหนึ่งรายการใน `allowFrom`)
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    `dmPolicy: "open"` พร้อม `allowFrom: ["*"]` ทำให้บัญชี Telegram ใดก็ตามที่พบหรือเดา username ของบอทได้สามารถสั่งงานบอทได้ ใช้เฉพาะกับบอทสาธารณะที่ตั้งใจไว้และมีเครื่องมือถูกจำกัดอย่างเข้มงวดเท่านั้น; บอทเจ้าของเดียวควรใช้ `allowlist` พร้อม user ID แบบตัวเลข

    `channels.telegram.allowFrom` รับ user ID ของ Telegram แบบตัวเลข prefix `telegram:` / `tg:` ใช้ได้และจะถูก normalize
    ใน config หลายบัญชี `channels.telegram.allowFrom` ระดับบนสุดที่จำกัดจะถือเป็นขอบเขตความปลอดภัย: รายการ `allowFrom: ["*"]` ระดับบัญชีจะไม่ทำให้บัญชีนั้นเป็นสาธารณะ เว้นแต่ allowlist ที่มีผลจริงของบัญชียังมี wildcard ที่ระบุชัดเจนหลังจาก merge แล้ว
    `dmPolicy: "allowlist"` พร้อม `allowFrom` ว่างจะบล็อก DM ทั้งหมดและถูกปฏิเสธโดยการตรวจสอบ config
    การตั้งค่าจะขอเฉพาะ user ID แบบตัวเลข
    หากคุณอัปเกรดแล้ว config ของคุณมีรายการ allowlist แบบ `@username` ให้รัน `openclaw doctor --fix` เพื่อ resolve รายการเหล่านั้น (พยายามอย่างดีที่สุด; ต้องใช้ token บอท Telegram)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์ allowlist ของ pairing-store, `openclaw doctor --fix` สามารถกู้รายการเข้าไปใน `channels.telegram.allowFrom` ในโฟลว์ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID ที่ระบุชัดเจน)

    สำหรับบอทเจ้าของเดียว ควรใช้ `dmPolicy: "allowlist"` พร้อม ID `allowFrom` แบบตัวเลขที่ระบุชัดเจน เพื่อให้นโยบายการเข้าถึงคงทนอยู่ใน config (แทนการพึ่งพาการอนุมัติการจับคู่ก่อนหน้า)

    ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่ได้หมายความว่า "sender นี้ได้รับอนุญาตทุกที่"
    การจับคู่ให้สิทธิ์เข้าถึง DM หากยังไม่มีเจ้าของคำสั่ง การจับคู่ที่อนุมัติครั้งแรกจะตั้งค่า `commands.ownerAllowFrom` ด้วย เพื่อให้คำสั่งเฉพาะเจ้าของและการอนุมัติ exec มีบัญชีผู้ปฏิบัติการที่ระบุชัดเจน
    การอนุญาต sender ในกลุ่มยังมาจาก allowlist ใน config ที่ระบุชัดเจน
    หากคุณต้องการ "ฉันได้รับอนุญาตครั้งเดียว แล้วทั้ง DM และคำสั่งกลุ่มใช้งานได้" ให้ใส่ user ID Telegram แบบตัวเลขของคุณใน `channels.telegram.allowFrom`; สำหรับคำสั่งเฉพาะเจ้าของ ตรวจสอบให้แน่ใจว่า `commands.ownerAllowFrom` มี `telegram:<your user id>`

    ### การหา user ID Telegram ของคุณ

    ปลอดภัยกว่า (ไม่ใช้บอทบุคคลที่สาม):

    1. DM บอทของคุณ
    2. รัน `openclaw logs --follow`
    3. อ่าน `from.id`

    วิธีทางการของ Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีของบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="Group policy and allowlists">
    มีตัวควบคุมสองอย่างที่ใช้ร่วมกัน:

    1. **กลุ่มใดได้รับอนุญาต** (`channels.telegram.groups`)
       - ไม่มี config `groups`:
         - พร้อม `groupPolicy: "open"`: กลุ่มใดก็ผ่านการตรวจสอบ group-ID ได้
         - พร้อม `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการ `groups` (หรือ `"*"`)
       - กำหนดค่า `groups` แล้ว: ทำหน้าที่เป็น allowlist (ID ที่ระบุชัดเจนหรือ `"*"`)

    2. **sender ใดได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับกรอง sender ในกลุ่ม หากไม่ได้ตั้งค่า Telegram จะ fallback ไปที่ `allowFrom`
    รายการ `groupAllowFrom` ควรเป็น user ID Telegram แบบตัวเลข (prefix `telegram:` / `tg:` จะถูก normalize)
    อย่าใส่ chat ID ของกลุ่มหรือ supergroup Telegram ใน `groupAllowFrom` chat ID ติดลบอยู่ภายใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเว้นสำหรับการอนุญาต sender
    ขอบเขตความปลอดภัย (`2026.2.25+`): การ auth sender ในกลุ่ม **ไม่** สืบทอดการอนุมัติจาก DM pairing-store
    การจับคู่ยังเป็นเฉพาะ DM เท่านั้น สำหรับกลุ่ม ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` ต่อกลุ่ม/ต่อ topic
    หากไม่ได้ตั้งค่า `groupAllowFrom`, Telegram จะ fallback ไปที่ `allowFrom` ของ config ไม่ใช่ pairing store
    รูปแบบที่ใช้งานได้จริงสำหรับบอทเจ้าของเดียว: ตั้งค่า user ID ของคุณใน `channels.telegram.allowFrom` ปล่อย `groupAllowFrom` ว่าง และอนุญาตกลุ่มเป้าหมายภายใต้ `channels.telegram.groups`
    หมายเหตุ runtime: หากไม่มี `channels.telegram` ทั้งหมด runtime จะใช้ค่าเริ่มต้นแบบ fail-closed `groupPolicy="allowlist"` เว้นแต่จะตั้งค่า `channels.defaults.groupPolicy` ไว้ชัดเจน

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

      - ใส่ chat ID ของกลุ่มหรือ supergroup Telegram ที่เป็นค่าติดลบ เช่น `-1001234567890` ไว้ภายใต้ `channels.telegram.groups`
      - ใส่ user ID Telegram เช่น `8734062810` ไว้ภายใต้ `groupAllowFrom` เมื่อคุณต้องการจำกัดว่าคนใดภายในกลุ่มที่ได้รับอนุญาตสามารถ trigger บอทได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกใดก็ได้ของกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอทได้

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    การตอบกลับในกลุ่มต้องมีการ mention เป็นค่าเริ่มต้น

    mention อาจมาจาก:

    - การ mention แบบ native `@botusername` หรือ
    - รูปแบบการ mention ใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    toggle คำสั่งระดับ session:

    - `/activation always`
    - `/activation mention`

    รายการเหล่านี้อัปเดตเฉพาะสถานะ session ใช้ config เพื่อให้คงอยู่ถาวร

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

    การรับ group chat ID:

    - forward ข้อความกลุ่มไปยัง `@userinfobot` / `@getidsbot`
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจสอบ Bot API `getUpdates`

  </Tab>
</Tabs>

## พฤติกรรมขณะ runtime

- Telegram เป็นของกระบวนการ gateway
- การ routing เป็นแบบ deterministic: ข้อความขาเข้า Telegram จะตอบกลับไปยัง Telegram (model ไม่เลือกช่องทาง)
- ข้อความขาเข้าจะถูก normalize เข้าเป็น envelope ช่องทางที่ใช้ร่วมกัน พร้อม metadata การตอบกลับและ placeholder สื่อ
- session กลุ่มถูกแยกตาม group ID topic ของ forum จะต่อท้าย `:topic:<threadId>` เพื่อแยก topic ออกจากกัน
- ข้อความ DM สามารถพก `message_thread_id`; OpenClaw จะ route ด้วย key ของ session ที่รับรู้ thread และคง thread ID ไว้สำหรับการตอบกลับ
- Long polling ใช้ grammY runner พร้อมการจัดลำดับต่อ chat/ต่อ thread concurrency ของ sink runner โดยรวมใช้ `agents.defaults.maxConcurrent`
- Long polling ถูก guard ภายในแต่ละกระบวนการ gateway เพื่อให้มี poller ที่ใช้งานอยู่เพียงตัวเดียวเท่านั้นที่ใช้ token บอทได้ในแต่ละครั้ง หากคุณยังเห็นความขัดแย้ง `getUpdates` 409 แสดงว่า gateway OpenClaw อื่น, script, หรือ poller ภายนอก น่าจะกำลังใช้ token เดียวกัน
- การ restart ของ watchdog สำหรับ long-polling trigger หลังจากไม่มี liveness ของ `getUpdates` ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีโดยค่าเริ่มต้น เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อ deployment ของคุณยังเห็นการ restart จาก polling-stall ที่เป็น false ระหว่างงานที่รันนาน ค่านี้เป็นมิลลิวินาทีและอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับ override ต่อบัญชี
- Telegram Bot API ไม่รองรับ read-receipt (`sendReadReceipts` ใช้ไม่ได้)

## อ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw สามารถ stream การตอบกลับบางส่วนแบบ real time ได้:

    - แชทโดยตรง: ข้อความ preview + `editMessageText`
    - กลุ่ม/topic: ข้อความ preview + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` คือ `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - `progress` map เป็น `partial` บน Telegram (เข้ากันได้กับการตั้งชื่อข้ามช่องทาง)
    - `streaming.preview.toolProgress` ควบคุมว่า update ของ tool/progress จะ reuse ข้อความ preview ที่แก้ไขเดิมหรือไม่ (ค่าเริ่มต้น: `true` เมื่อ preview streaming เปิดใช้งาน)
    - ตรวจพบ `channels.telegram.streamMode` legacy และค่า boolean `streaming`; รัน `openclaw doctor --fix` เพื่อ migrate เป็น `channels.telegram.streaming.mode`

    update preview ของ tool-progress คือบรรทัด "Working..." สั้น ๆ ที่แสดงระหว่างเครื่องมือทำงาน เช่น การเรียกใช้คำสั่ง การอ่านไฟล์ การอัปเดตแผน หรือสรุป patch Telegram เปิดรายการเหล่านี้ไว้เป็นค่าเริ่มต้นเพื่อให้ตรงกับพฤติกรรม OpenClaw ที่ release ตั้งแต่ `v2026.4.22` และหลังจากนั้น หากต้องการคง preview ที่แก้ไขสำหรับข้อความคำตอบแต่ซ่อนบรรทัด tool-progress ให้ตั้งค่า:

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

    ใช้ `streaming.mode: "off"` เฉพาะเมื่อคุณต้องการส่งเฉพาะผลลัพธ์สุดท้าย: การแก้ไข preview ของ Telegram จะถูกปิด และข้อความทั่วไปของ tool/progress จะถูก suppress แทนที่จะถูกส่งเป็นข้อความ "Working..." แยกต่างหาก พรอมป์อนุมัติ payload สื่อ และข้อผิดพลาดยัง route ผ่านการส่งผลลัพธ์สุดท้ายตามปกติ ใช้ `streaming.preview.toolProgress: false` เมื่อคุณต้องการคงเฉพาะการแก้ไข preview คำตอบไว้ พร้อมซ่อนบรรทัดสถานะ tool-progress

    สำหรับการตอบกลับแบบข้อความเท่านั้น:

    - ตัวอย่างพรีวิวสั้นใน DM/กลุ่ม/topic: OpenClaw เก็บข้อความพรีวิวเดิมไว้และทำการแก้ไขครั้งสุดท้ายในตำแหน่งเดิม
    - พรีวิวที่เก่ากว่าประมาณหนึ่งนาที: OpenClaw ส่งคำตอบที่เสร็จสมบูรณ์เป็นข้อความสุดท้ายใหม่ แล้วจึงล้างพรีวิวออก เพื่อให้เวลาที่ Telegram แสดงสะท้อนเวลาที่เสร็จสิ้นแทนเวลาที่สร้างพรีวิว

    สำหรับคำตอบที่ซับซ้อน (เช่นเพย์โหลดสื่อ) OpenClaw จะถอยกลับไปใช้การส่งข้อความสุดท้ายแบบปกติ แล้วจึงล้างข้อความพรีวิวออก

    การสตรีมพรีวิวแยกจากการสตรีมแบบบล็อก เมื่อเปิดใช้งานการสตรีมแบบบล็อกสำหรับ Telegram อย่างชัดเจน OpenClaw จะข้ามสตรีมพรีวิวเพื่อหลีกเลี่ยงการสตรีมซ้ำสองครั้ง

    สตรีมเหตุผลเฉพาะ Telegram:

    - `/reasoning stream` ส่งเหตุผลไปยังพรีวิวสดขณะกำลังสร้างคำตอบ
    - คำตอบสุดท้ายจะถูกส่งโดยไม่มีข้อความเหตุผล

  </Accordion>

  <Accordion title="การจัดรูปแบบและ fallback เป็น HTML">
    ข้อความขาออกใช้ Telegram `parse_mode: "HTML"`

    - ข้อความที่คล้าย Markdown จะถูกเรนเดอร์เป็น HTML ที่ปลอดภัยสำหรับ Telegram
    - HTML ดิบจากโมเดลจะถูก escape เพื่อลดความล้มเหลวในการ parse ของ Telegram
    - หาก Telegram ปฏิเสธ HTML ที่ parse แล้ว OpenClaw จะลองใหม่เป็นข้อความธรรมดา

    การพรีวิวลิงก์เปิดใช้งานตามค่าเริ่มต้น และปิดได้ด้วย `channels.telegram.linkPreview: false`

  </Accordion>

  <Accordion title="คำสั่ง native และคำสั่งกำหนดเอง">
    การลงทะเบียนเมนูคำสั่งของ Telegram ถูกจัดการตอนเริ่มต้นด้วย `setMyCommands`

    ค่าเริ่มต้นของคำสั่ง native:

    - `commands.native: "auto"` เปิดใช้งานคำสั่ง native สำหรับ Telegram

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
    - คำสั่งกำหนดเองไม่สามารถแทนที่คำสั่ง native ได้
    - ความขัดแย้ง/รายการซ้ำจะถูกข้ามและบันทึกในล็อก

    หมายเหตุ:

    - คำสั่งกำหนดเองเป็นเพียงรายการเมนูเท่านั้น; ไม่ได้ทำให้มีพฤติกรรมโดยอัตโนมัติ
    - คำสั่ง plugin/skill ยังทำงานได้เมื่อพิมพ์ แม้จะไม่แสดงในเมนู Telegram

    หากปิดใช้งานคำสั่ง native คำสั่งที่มีในตัวจะถูกลบออก คำสั่งกำหนดเอง/plugin อาจยังลงทะเบียนได้หากมีการตั้งค่าไว้

    ความล้มเหลวทั่วไปในการตั้งค่า:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังเกินขีดจำกัดหลังตัดรายการแล้ว; ลดจำนวนคำสั่ง plugin/skill/กำหนดเอง หรือปิดใช้งาน `channels.telegram.commands.native`
    - `deleteWebhook`, `deleteMyCommands`, หรือ `setMyCommands` ล้มเหลวด้วย `404: Not Found` ขณะที่คำสั่ง curl ไปยัง Bot API โดยตรงทำงานได้ อาจหมายความว่า `channels.telegram.apiRoot` ถูกตั้งเป็น endpoint แบบเต็ม `/bot<TOKEN>` แล้ว `apiRoot` ต้องเป็นเพียง root ของ Bot API เท่านั้น และ `openclaw doctor --fix` จะลบ `/bot<TOKEN>` ต่อท้ายที่เกิดขึ้นโดยไม่ตั้งใจออก
    - `getMe returned 401` หมายความว่า Telegram ปฏิเสธโทเคนบ็อตที่ตั้งค่าไว้ อัปเดต `botToken`, `tokenFile`, หรือ `TELEGRAM_BOT_TOKEN` ด้วยโทเคน BotFather ปัจจุบัน; OpenClaw หยุดก่อนเริ่ม polling ดังนั้นกรณีนี้จะไม่ถูกรายงานเป็นความล้มเหลวในการล้าง Webhook
    - `setMyCommands failed` พร้อมข้อผิดพลาด network/fetch มักหมายความว่า DNS/HTTPS ขาออกไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งจับคู่อุปกรณ์ (`device-pair` plugin)

    เมื่อติดตั้ง `device-pair` plugin:

    1. `/pair` สร้างรหัสตั้งค่า
    2. วางรหัสในแอป iOS
    3. `/pair pending` แสดงรายการคำขอที่รอดำเนินการ (รวมถึง role/scopes)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบระบุชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    รหัสตั้งค่าจะพาโทเคน bootstrap อายุสั้นมาด้วย การส่งต่อ bootstrap ในตัวจะรักษาโทเคนโหนดหลักไว้ที่ `scopes: []`; โทเคนผู้ดำเนินการที่ถูกส่งต่อจะยังจำกัดอยู่กับ `operator.approvals`, `operator.read`, `operator.talk.secrets`, และ `operator.write` การตรวจสอบ scope ของ bootstrap มี prefix ตาม role ดังนั้น allowlist ของผู้ดำเนินการนั้นจะตรงตามคำขอของผู้ดำเนินการเท่านั้น; role ที่ไม่ใช่ผู้ดำเนินการยังต้องมี scopes ภายใต้ prefix ของ role นั้นเอง

    หากอุปกรณ์ลองใหม่ด้วยรายละเอียด auth ที่เปลี่ยนไป (เช่น role/scopes/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` อื่น เรียก `/pair pending` อีกครั้งก่อนอนุมัติ

    รายละเอียดเพิ่มเติม: [การจับคู่](/th/channels/pairing#pair-via-telegram-recommended-for-ios)

  </Accordion>

  <Accordion title="ปุ่ม inline">
    ตั้งค่า scope ของแป้นพิมพ์ inline:

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

    Scopes:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (ค่าเริ่มต้น)

    `capabilities: ["inlineButtons"]` แบบเดิมจะ map เป็น `inlineButtons: "all"`

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

    การคลิก callback จะถูกส่งต่อไปยัง agent เป็นข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="action ข้อความ Telegram สำหรับ agent และระบบอัตโนมัติ">
    action ของเครื่องมือ Telegram ประกอบด้วย:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    action ข้อความของ channel เปิดเผย alias ที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    การควบคุมการ gate:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้งาน)

    หมายเหตุ: ขณะนี้ `edit` และ `topic-create` เปิดใช้งานตามค่าเริ่มต้น และไม่มี toggle `channels.telegram.actions.*` แยกต่างหาก
    การส่งขณะ runtime ใช้สแนปช็อต config/secrets ที่ใช้งานอยู่ (startup/reload) ดังนั้นเส้นทาง action จะไม่ทำการ resolve SecretRef ใหม่แบบเฉพาะกิจต่อการส่งแต่ละครั้ง

    ความหมายของการลบ reaction: [/tools/reactions](/th/tools/reactions)

  </Accordion>

  <Accordion title="แท็กเธรดการตอบกลับ">
    Telegram รองรับแท็กเธรดการตอบกลับแบบระบุชัดเจนในเอาต์พุตที่สร้างขึ้น:

    - `[[reply_to_current]]` ตอบกลับข้อความที่ทริกเกอร์
    - `[[reply_to:<id>]]` ตอบกลับ ID ข้อความ Telegram ที่ระบุ

    `channels.telegram.replyToMode` ควบคุมการจัดการ:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`

    เมื่อเปิดใช้งานเธรดการตอบกลับและมีข้อความหรือ caption ต้นฉบับของ Telegram พร้อมใช้งาน OpenClaw จะรวม excerpt quote แบบ native ของ Telegram โดยอัตโนมัติ Telegram จำกัดข้อความ quote แบบ native ไว้ที่ 1024 UTF-16 code units ดังนั้นข้อความที่ยาวกว่าจะถูก quote จากตอนต้น และจะ fallback เป็นการตอบกลับแบบธรรมดาหาก Telegram ปฏิเสธ quote

    หมายเหตุ: `off` ปิดใช้งานเธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบระบุชัดเจนจะยังได้รับการใช้งาน

  </Accordion>

  <Accordion title="Forum topics และพฤติกรรมของเธรด">
    Forum supergroups:

    - คีย์ session ของ topic ต่อท้ายด้วย `:topic:<threadId>`
    - การตอบกลับและการพิมพ์จะกำหนดเป้าหมายไปที่เธรด topic
    - เส้นทาง config ของ topic:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของ topic ทั่วไป (`threadId=1`):

    - การส่งข้อความจะละ `message_thread_id` (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - action การพิมพ์ยังรวม `message_thread_id`

    การสืบทอดของ topic: รายการ topic จะสืบทอดการตั้งค่ากลุ่ม เว้นแต่ถูก override (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` ใช้เฉพาะ topic และไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม

    **การ routing agent ราย topic**: แต่ละ topic สามารถ route ไปยัง agent คนละตัวได้ด้วยการตั้งค่า `agentId` ใน config ของ topic สิ่งนี้ทำให้แต่ละ topic มี workspace, memory, และ session ที่แยกของตนเอง ตัวอย่าง:

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

    จากนั้นแต่ละ topic จะมีคีย์ session ของตัวเอง: `agent:zu:telegram:group:-1001234567890:topic:3`

    **การผูก ACP topic แบบ persistent**: Forum topics สามารถ pin session ของ ACP harness ผ่าน ACP bindings แบบ typed ระดับบนสุด (`bindings[]` พร้อม `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"`, และ id ที่ qualify ด้วย topic เช่น `-1001234567890:topic:42`) ปัจจุบันจำกัด scope อยู่ที่ forum topics ใน groups/supergroups ดู [ACP Agents](/th/tools/acp-agents)

    **การ spawn ACP ที่ผูกกับเธรดจากแชต**: `/acp spawn <agent> --thread here|auto` ผูก topic ปัจจุบันเข้ากับ ACP session ใหม่; follow-up จะ route ไปที่นั่นโดยตรง OpenClaw จะ pin การยืนยัน spawn ใน topic ต้องใช้ `channels.telegram.threadBindings.spawnAcpSessions=true`

    บริบท template เปิดเผย `MessageThreadId` และ `IsForum` แชต DM ที่มี `message_thread_id` จะยังคงใช้ routing ของ DM แต่ใช้คีย์ session ที่รับรู้เธรด

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยก voice notes ออกจากไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมแบบไฟล์เสียง
    - แท็ก `[[audio_as_voice]]` ในคำตอบของ agent เพื่อบังคับให้ส่งเป็น voice-note
    - transcript ของ voice-note ขาเข้าจะถูกกรอบเป็นข้อความที่สร้างโดยเครื่อง,
      ไม่น่าเชื่อถือ ในบริบทของ agent; การตรวจจับ mention ยังคงใช้ transcript ดิบ
      ดังนั้นข้อความเสียงที่ gate ด้วย mention จึงยังทำงานต่อไป

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

    Telegram แยกไฟล์วิดีโอออกจาก video notes

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

    Video notes ไม่รองรับ caption; ข้อความที่ให้มาจะถูกส่งแยกต่างหาก

    ### สติกเกอร์

    การจัดการสติกเกอร์ขาเข้า:

    - WEBP แบบ static: ดาวน์โหลดและประมวลผล (placeholder `<media:sticker>`)
    - TGS แบบ animated: ข้าม
    - WEBM แบบวิดีโอ: ข้าม

    ฟิลด์บริบทของสติกเกอร์:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ไฟล์แคชสติกเกอร์:

    - `~/.openclaw/telegram/sticker-cache.json`

    สติกเกอร์จะถูกอธิบายหนึ่งครั้ง (เมื่อทำได้) และแคชไว้เพื่อลดการเรียก vision ซ้ำ

    เปิดใช้งาน action ของสติกเกอร์:

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

    action ส่งสติกเกอร์:

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
    reaction ของ Telegram มาถึงเป็นอัปเดต `message_reaction` (แยกจากเพย์โหลดข้อความ)

    เมื่อเปิดใช้งาน OpenClaw จะ enqueue system events เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงเฉพาะรีแอ็กชันของผู้ใช้ต่อข้อความที่บอทส่งเท่านั้น (พยายามทำให้ดีที่สุดผ่านแคชข้อความที่ส่งแล้ว)
    - อีเวนต์รีแอ็กชันยังคงเคารพการควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ให้ ID เธรดในการอัปเดตรีแอ็กชัน
      - กลุ่มที่ไม่ใช่ฟอรัมจะถูกส่งไปยังเซสชันแชตกลุ่ม
      - กลุ่มฟอรัมจะถูกส่งไปยังเซสชันหัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อต้นทางที่แน่นอน

    `allowed_updates` สำหรับ polling/webhook จะรวม `message_reaction` โดยอัตโนมัติ

  </Accordion>

  <Accordion title="รีแอ็กชันตอบรับ">
    `ackReaction` ส่งอีโมจิยืนยันขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการแก้ค่า:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - ตัวสำรองเป็นอีโมจิประจำตัวเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้นใช้ "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิแบบ unicode (เช่น "👀")
    - ใช้ `""` เพื่อปิดรีแอ็กชันสำหรับช่องทางหรือบัญชี

  </Accordion>

  <Accordion title="การเขียนคอนฟิกจากอีเวนต์และคำสั่งของ Telegram">
    การเขียนคอนฟิกช่องทางเปิดใช้งานตามค่าเริ่มต้น (`configWrites !== false`)

    การเขียนที่ถูกเรียกจาก Telegram รวมถึง:

    - อีเวนต์การย้ายกลุ่ม (`migrate_to_chat_id`) เพื่ออัปเดต `channels.telegram.groups`
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
    ค่าเริ่มต้นคือ long polling สำหรับโหมด Webhook ให้ตั้งค่า `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; ตัวเลือกเสริมคือ `webhookPath`, `webhookHost`, `webhookPort` (ค่าเริ่มต้น `/telegram-webhook`, `127.0.0.1`, `8787`)

    listener ภายในเครื่องจะ bind กับ `127.0.0.1:8787` สำหรับ public ingress ให้ตั้ง reverse proxy ไว้หน้าพอร์ตภายในเครื่อง หรือจงใจตั้งค่า `webhookHost: "0.0.0.0"`

    โหมด Webhook ตรวจสอบ request guards, โทเค็นลับของ Telegram และ JSON body ก่อนส่งคืน `200` ให้ Telegram
    จากนั้น OpenClaw จะประมวลผลการอัปเดตแบบอะซิงโครนัสผ่าน bot lanes ต่อแชต/ต่อหัวข้อเดียวกับที่ long polling ใช้ ดังนั้นรอบการทำงานของเอเจนต์ที่ช้าจะไม่ค้าง ACK การส่งของ Telegram

  </Accordion>

  <Accordion title="ขีดจำกัด การลองใหม่ และเป้าหมาย CLI">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` ให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนแบ่งตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ทั้งขาเข้าและขาออก
    - `channels.telegram.timeoutSeconds` แทนที่ timeout ของไคลเอนต์ Telegram API (ถ้าไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY) ไคลเอนต์บอทแบบ long-polling จะ clamp ค่าที่กำหนดซึ่งต่ำกว่า request guard `getUpdates` 45 วินาที เพื่อไม่ให้ idle polls ถูกยกเลิกก่อนหน้าต่าง poll 30 วินาทีจะเสร็จสิ้น
    - ค่าเริ่มต้นของ `channels.telegram.pollingStallThresholdMs` คือ `120000`; ปรับระหว่าง `30000` ถึง `600000` เฉพาะสำหรับการรีสตาร์ต polling-stall ที่เป็น false-positive เท่านั้น
    - ประวัติบริบทกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` คือปิดใช้งาน
    - บริบทเสริมของ reply/quote/forward ปัจจุบันจะถูกส่งต่อมาตามที่ได้รับ
    - allowlist ของ Telegram โดยหลักใช้ควบคุมว่าใครเรียกเอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบครบถ้วน
    - การควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - คอนฟิก `channels.telegram.retry` ใช้กับตัวช่วยส่งของ Telegram (CLI/tools/actions) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้ การส่งคำตอบสุดท้ายขาเข้ายังใช้ safe-send retry แบบจำกัดสำหรับความล้มเหลวก่อนเชื่อมต่อของ Telegram ด้วย แต่จะไม่ลองใหม่กับซองเครือข่ายหลังส่งที่กำกวมซึ่งอาจทำให้ข้อความที่มองเห็นได้ซ้ำกัน

    เป้าหมายการส่งของ CLI อาจเป็น ID แชตตัวเลขหรือชื่อผู้ใช้:

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
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอการส่งแบบปักหมุดเมื่อบอทสามารถปักหมุดในแชตนั้นได้
    - `--force-document` เพื่อส่งรูปภาพและ GIF ขาออกเป็นเอกสาร แทนการอัปโหลดเป็นรูปภาพที่บีบอัดหรือสื่อเคลื่อนไหว

    การกั้นการกระทำ:

    - `channels.telegram.actions.sendMessage=false` ปิดใช้งานข้อความ Telegram ขาออก รวมถึง poll
    - `channels.telegram.actions.poll=false` ปิดใช้งานการสร้าง poll ของ Telegram โดยยังคงเปิดการส่งปกติไว้

  </Accordion>

  <Accordion title="การอนุมัติ exec ใน Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถเลือกโพสต์ prompt ในแชตหรือหัวข้อต้นทางได้ ผู้อนุมัติต้องเป็น ID ผู้ใช้ Telegram แบบตัวเลข

    พาธคอนฟิก:

    - `channels.telegram.execApprovals.enabled` (เปิดใช้งานอัตโนมัติเมื่อแก้ค่า approver ได้อย่างน้อยหนึ่งราย)
    - `channels.telegram.execApprovals.approvers` (ถอยไปใช้ ID เจ้าของแบบตัวเลขจาก `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` และ `defaultTo` ควบคุมว่าใครคุยกับบอทได้และบอทส่งคำตอบปกติไปที่ใด สิ่งเหล่านี้ไม่ได้ทำให้คนใดคนหนึ่งเป็นผู้อนุมัติ exec การจับคู่ DM ที่อนุมัติครั้งแรกจะ bootstrap `commands.ownerAllowFrom` เมื่อยังไม่มีเจ้าของคำสั่ง ดังนั้นการตั้งค่าแบบเจ้าของคนเดียวยังทำงานได้โดยไม่ต้องใส่ ID ซ้ำใต้ `execApprovals.approvers`

    การส่งไปยังช่องทางจะแสดงข้อความคำสั่งในแชต; เปิดใช้งาน `channel` หรือ `both` เฉพาะในกลุ่ม/หัวข้อที่เชื่อถือได้เท่านั้น เมื่อ prompt ไปถึงหัวข้อฟอรัม OpenClaw จะรักษาหัวข้อนั้นไว้สำหรับ prompt การอนุมัติและข้อความติดตามผล การอนุมัติ exec จะหมดอายุหลัง 30 นาทีตามค่าเริ่มต้น

    ปุ่มอนุมัติแบบ inline ยังต้องให้ `channels.telegram.capabilities.inlineButtons` อนุญาตพื้นผิวเป้าหมาย (`dm`, `group` หรือ `all`) ด้วย ID การอนุมัติที่ขึ้นต้นด้วย `plugin:` จะแก้ค่าผ่านการอนุมัติของ Plugin; รายการอื่นจะแก้ค่าผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## การควบคุมการตอบกลับข้อผิดพลาด

เมื่อเอเจนต์พบข้อผิดพลาดด้านการส่งหรือ provider Telegram สามารถตอบกลับด้วยข้อความข้อผิดพลาดหรือระงับไว้ได้ คีย์คอนฟิกสองรายการควบคุมพฤติกรรมนี้:

| คีย์                                 | ค่า            | ค่าเริ่มต้น | คำอธิบาย                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` ส่งข้อความข้อผิดพลาดที่เป็นมิตรไปยังแชต `silent` ระงับการตอบกลับข้อผิดพลาดทั้งหมด |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | เวลาขั้นต่ำระหว่างการตอบกลับข้อผิดพลาดไปยังแชตเดียวกัน ป้องกันสแปมข้อผิดพลาดระหว่างเหตุขัดข้อง        |

รองรับการแทนที่ต่อบัญชี ต่อกลุ่ม และต่อหัวข้อ (ใช้การสืบทอดแบบเดียวกับคีย์คอนฟิก Telegram อื่นๆ)

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
  <Accordion title="บอทไม่ตอบสนองต่อข้อความกลุ่มที่ไม่ได้ mention">

    - ถ้า `requireMention=false` โหมด privacy ของ Telegram ต้องอนุญาตให้มองเห็นทั้งหมด
      - BotFather: `/setprivacy` -> Disable
      - จากนั้นลบ + เพิ่มบอทกลับเข้ากลุ่ม
    - `openclaw channels status` จะแจ้งเตือนเมื่อคอนฟิกคาดหวังข้อความกลุ่มที่ไม่ได้ mention
    - `openclaw channels status --probe` สามารถตรวจ ID กลุ่มตัวเลขที่ระบุชัดเจนได้; wildcard `"*"` ไม่สามารถ probe การเป็นสมาชิกได้
    - การทดสอบเซสชันอย่างเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอทไม่เห็นข้อความกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` กลุ่มต้องอยู่ในรายการ (หรือรวม `"*"`)
    - ตรวจสอบการเป็นสมาชิกของบอทในกลุ่ม
    - ตรวจสอบ log: `openclaw logs --follow` เพื่อดูเหตุผลการข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานบางส่วนหรือไม่ทำงานเลย">

    - อนุญาตตัวตนผู้ส่งของคุณ (การจับคู่และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังมีผลแม้นโยบายกลุ่มเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู native มีรายการมากเกินไป; ลดคำสั่งของ Plugin/skill/กำหนดเอง หรือปิดใช้งานเมนู native
    - การเรียก `deleteMyCommands` / `setMyCommands` ตอนเริ่มต้นมีขอบเขตจำกัด และจะลองใหม่หนึ่งครั้งผ่าน transport fallback ของ Telegram เมื่อ request timeout ข้อผิดพลาดเครือข่าย/fetch ที่คงอยู่มักบ่งชี้ปัญหา DNS/HTTPS ในการเข้าถึง `api.telegram.org`

  </Accordion>

  <Accordion title="การเริ่มต้นรายงาน token ที่ไม่ได้รับอนุญาต">

    - `getMe returned 401` คือความล้มเหลวในการยืนยันตัวตนของ Telegram สำหรับ bot token ที่กำหนดค่าไว้
    - คัดลอกใหม่หรือสร้าง bot token ใหม่ใน BotFather แล้วอัปเดต `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` หรือ `TELEGRAM_BOT_TOKEN` สำหรับบัญชีเริ่มต้น
    - `deleteWebhook 401 Unauthorized` ระหว่างเริ่มต้นก็เป็นความล้มเหลวด้าน auth เช่นกัน; การถือว่าเป็น "ไม่มี Webhook อยู่" จะเพียงเลื่อนความล้มเหลวจาก token ที่ไม่ถูกต้องเดียวกันไปยังการเรียก API ภายหลัง
    - ถ้า `deleteWebhook` ล้มเหลวด้วยข้อผิดพลาดเครือข่ายชั่วคราวระหว่างเริ่มต้น polling OpenClaw จะตรวจ `getWebhookInfo`; เมื่อ Telegram รายงาน URL ของ Webhook ว่าง polling จะดำเนินต่อเพราะ cleanup เป็นไปตามเงื่อนไขแล้ว

  </Accordion>

  <Accordion title="ความไม่เสถียรของ polling หรือเครือข่าย">

    - Node 22+ + fetch/proxy แบบกำหนดเองอาจทริกเกอร์พฤติกรรมยกเลิกทันทีหากชนิด AbortSignal ไม่ตรงกัน
    - โฮสต์บางตัว resolve `api.telegram.org` เป็น IPv6 ก่อน; IPv6 egress ที่เสียอาจทำให้ Telegram API ล้มเหลวเป็นครั้งคราว
    - หาก log มี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!` ตอนนี้ OpenClaw จะ retry ข้อผิดพลาดเหล่านี้เป็นข้อผิดพลาดเครือข่ายที่กู้คืนได้
    - หาก socket ของ Telegram ถูก recycle ตามรอบคงที่สั้น ๆ ให้ตรวจสอบว่า `channels.telegram.timeoutSeconds` ต่ำหรือไม่; client บอตแบบ long-polling จะ clamp ค่าที่กำหนดไว้ให้ต่ำกว่า request guard ของ `getUpdates` แต่ release เก่าอาจยกเลิกทุก poll เมื่อค่านี้ถูกตั้งให้ต่ำกว่า timeout ของ long-poll
    - หาก log มี `Polling stall detected` ตามค่าเริ่มต้น OpenClaw จะ restart polling และ rebuild transport ของ Telegram หลังจาก 120 วินาทีโดยไม่มี liveness ของ long-poll ที่เสร็จสมบูรณ์
    - `openclaw channels status --probe` และ `openclaw doctor` จะเตือนเมื่อบัญชี polling ที่กำลังทำงานยังไม่เสร็จสิ้น `getUpdates` หลังช่วงผ่อนผันตอนเริ่มต้น, เมื่อบัญชี webhook ที่กำลังทำงานยังไม่เสร็จสิ้น `setWebhook` หลังช่วงผ่อนผันตอนเริ่มต้น, หรือเมื่อ activity ของ polling transport ที่สำเร็จล่าสุดเก่าเกินไป
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่รันนานยังปกติ แต่โฮสต์ของคุณยังรายงานการ restart จาก polling-stall แบบ false อยู่ การค้างอย่างต่อเนื่องมักชี้ไปที่ปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่างโฮสต์กับ `api.telegram.org`
    - Telegram ยังใช้ env ของ process proxy สำหรับ transport ของ Bot API ด้วย รวมถึง `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และตัวแปรชื่อเดียวกันแบบตัวพิมพ์เล็ก `NO_PROXY` / `no_proxy` ยังสามารถ bypass `api.telegram.org` ได้
    - หาก proxy ที่ OpenClaw จัดการถูกกำหนดค่าผ่าน `OPENCLAW_PROXY_URL` สำหรับสภาพแวดล้อมบริการ และไม่มี env proxy มาตรฐาน Telegram จะใช้ URL นั้นสำหรับ transport ของ Bot API ด้วย
    - บนโฮสต์ VPS ที่ direct egress/TLS ไม่เสถียร ให้ route การเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ ใช้ค่าเริ่มต้นเป็น `autoSelectFamily=true` (ยกเว้น WSL2) และ `dnsResultOrder=ipv4first`
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนด้วยพฤติกรรม IPv4-only ให้บังคับการเลือก family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบช่วง benchmark ของ RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาตแล้ว
      สำหรับการดาวน์โหลดสื่อ Telegram ตามค่าเริ่มต้น หาก fake-IP ที่เชื่อถือได้หรือ
      transparent proxy rewrite `api.telegram.org` เป็น address แบบ
      private/internal/special-use อื่นระหว่างดาวน์โหลดสื่อ คุณสามารถ opt in
      เข้า bypass เฉพาะ Telegram ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - opt-in เดียวกันใช้ได้ต่อบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หาก proxy ของคุณ resolve โฮสต์สื่อ Telegram เป็น `198.18.x.x` ให้ปิด
      flag อันตรายไว้ก่อน สื่อ Telegram อนุญาตช่วง benchmark ของ RFC 2544
      อยู่แล้วตามค่าเริ่มต้น

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` ทำให้การป้องกัน SSRF
      ของสื่อ Telegram อ่อนลง ใช้เฉพาะกับสภาพแวดล้อม proxy ที่ผู้ปฏิบัติงานควบคุมและเชื่อถือได้
      เช่น Clash, Mihomo หรือการ route fake-IP ของ Surge เมื่อเครื่องมือเหล่านั้น
      สร้างคำตอบ private หรือ special-use นอกช่วง benchmark ของ RFC 2544
      ปิดไว้สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ
    </Warning>

    - Environment overrides (ชั่วคราว):
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

ความช่วยเหลือเพิ่มเติม: [การแก้ปัญหา Channel](/th/channels/troubleshooting).

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Telegram](/th/gateway/config-channels#telegram).

<Accordion title="ฟิลด์ Telegram สัญญาณสูง">

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปที่ไฟล์ปกติ; symlink จะถูกปฏิเสธ)
- access control: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- exec approvals: `execApprovals`, `accounts.*.execApprovals`
- command/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/replies: `replyToMode`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- formatting/delivery: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/network: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- custom API root: `apiRoot` (เฉพาะ root ของ Bot API; อย่าใส่ `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions: `reactionNotifications`, `reactionLevel`
- errors: `errorPolicy`, `errorCooldownMs`
- writes/history: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญของหลายบัญชี: เมื่อกำหนดค่า ID บัญชีตั้งแต่สองรายการขึ้นไป ให้ตั้ง `channels.telegram.defaultAccount` (หรือใส่ `channels.telegram.accounts.default`) เพื่อทำให้การ route ค่าเริ่มต้นชัดเจน มิฉะนั้น OpenClaw จะ fallback ไปยัง ID บัญชีแรกที่ normalize แล้ว และ `openclaw doctor` จะเตือน บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom` แต่ไม่สืบทอดค่า `accounts.default.*`
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Telegram กับ Gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรม allowlist ของกลุ่มและ topic
  </Card>
  <Card title="การ route Channel" icon="route" href="/th/channels/channel-routing">
    Route ข้อความขาเข้าไปยัง agent
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเพิ่มความแข็งแกร่ง
  </Card>
  <Card title="การ route แบบหลาย agent" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกลุ่มและ topic ไปยัง agent
  </Card>
  <Card title="การแก้ปัญหา" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้าม Channel
  </Card>
</CardGroup>
