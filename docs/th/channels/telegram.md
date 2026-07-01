---
read_when:
    - การทำงานกับฟีเจอร์ Telegram หรือ Webhook
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าบอต Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-01T20:37:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 541ce276cf045b19461167513d86e2dd9a5bb8ff95bcb9e55f10440e2e66a165
    source_path: channels/telegram.md
    workflow: 16
---

พร้อมใช้งานระดับโปรดักชันสำหรับ DM ของบอตและกลุ่มผ่าน grammY โหมดเริ่มต้นคือ long polling ส่วนโหมด webhook เป็นตัวเลือกเสริม

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับ Telegram คือการจับคู่
  </Card>
  <Card title="การแก้ปัญหา Channel" icon="wrench" href="/th/channels/troubleshooting">
    คู่มือวินิจฉัยและซ่อมแซมข้าม Channel
  </Card>
  <Card title="การกำหนดค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่า Channel แบบครบถ้วน
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="สร้างโทเค็นบอตใน BotFather">
    เปิด Telegram แล้วคุยกับ **@BotFather** (ยืนยันว่าแฮนเดิลตรงกับ `@BotFather` ทุกตัวอักษร)

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

    ค่าทดแทนจาก env: `TELEGRAM_BOT_TOKEN=...` (เฉพาะบัญชีเริ่มต้น)
    Telegram **ไม่** ใช้ `openclaw channels login telegram`; ให้กำหนดค่าโทเค็นใน config/env แล้วเริ่ม Gateway

  </Step>

  <Step title="เริ่ม Gateway และอนุมัติ DM แรก">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    โค้ดจับคู่หมดอายุหลังจาก 1 ชั่วโมง

  </Step>

  <Step title="เพิ่มบอตเข้ากลุ่ม">
    เพิ่มบอตเข้ากลุ่มของคุณ จากนั้นหา ID ทั้งสองรายการที่การเข้าถึงกลุ่มต้องใช้:

    - ID ผู้ใช้ Telegram ของคุณ ใช้ใน `allowFrom` / `groupAllowFrom`
    - ID แชตกลุ่ม Telegram ใช้เป็นคีย์ภายใต้ `channels.telegram.groups`

    สำหรับการตั้งค่าครั้งแรก ให้หา ID แชตกลุ่มจาก `openclaw logs --follow`, บอต forwarded-ID หรือ Bot API `getUpdates` หลังจากอนุญาตกลุ่มแล้ว `/whoami@<bot_username>` สามารถยืนยัน ID ผู้ใช้และ ID กลุ่มได้

    ID ซูเปอร์กรุ๊ป Telegram ที่เป็นค่าลบและขึ้นต้นด้วย `-100` คือ ID แชตกลุ่ม ให้ใส่ไว้ภายใต้ `channels.telegram.groups` ไม่ใช่ภายใต้ `groupAllowFrom`

  </Step>
</Steps>

<Note>
ลำดับการแก้ค่าโทเค็นรับรู้ตามบัญชี ในทางปฏิบัติ ค่า config ชนะค่าทดแทนจาก env และ `TELEGRAM_BOT_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
หลังจากเริ่มต้นสำเร็จ OpenClaw จะแคชตัวตนบอตไว้ในไดเรกทอรีสถานะได้นานสูงสุด 24 ชั่วโมง เพื่อให้การรีสตาร์ตหลีกเลี่ยงการเรียก Telegram `getMe` เพิ่มได้ การเปลี่ยนหรือลบโทเค็นจะล้างแคชนั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="โหมดความเป็นส่วนตัวและการมองเห็นในกลุ่ม">
    โดยค่าเริ่มต้น บอต Telegram ใช้ **Privacy Mode** ซึ่งจำกัดข้อความกลุ่มที่บอตจะได้รับ

    หากบอตต้องเห็นข้อความกลุ่มทั้งหมด ให้ทำอย่างใดอย่างหนึ่ง:

    - ปิดโหมดความเป็นส่วนตัวผ่าน `/setprivacy` หรือ
    - ตั้งบอตเป็นผู้ดูแลกลุ่ม

    เมื่อสลับโหมดความเป็นส่วนตัว ให้ลบและเพิ่มบอตกลับเข้าไปในแต่ละกลุ่ม เพื่อให้ Telegram นำการเปลี่ยนแปลงไปใช้

  </Accordion>

  <Accordion title="สิทธิ์ของกลุ่ม">
    สถานะผู้ดูแลถูกควบคุมในการตั้งค่ากลุ่ม Telegram

    บอตผู้ดูแลจะได้รับข้อความกลุ่มทั้งหมด ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มแบบเปิดตลอดเวลา

  </Accordion>

  <Accordion title="ตัวสลับ BotFather ที่มีประโยชน์">

    - `/setjoingroups` เพื่ออนุญาต/ปฏิเสธการเพิ่มเข้ากลุ่ม
    - `/setprivacy` สำหรับพฤติกรรมการมองเห็นในกลุ่ม

  </Accordion>
</AccordionGroup>

## การควบคุมการเข้าถึงและการเปิดใช้งาน

### ตัวตนบอตในกลุ่ม

ในกลุ่มและหัวข้อฟอรัมของ Telegram การกล่าวถึงแฮนเดิลบอตที่กำหนดค่าไว้อย่างชัดเจน (เช่น `@my_bot`) จะถือว่าเป็นการส่งถึงเอเจนต์ OpenClaw ที่เลือกไว้ แม้ชื่อ persona ของเอเจนต์จะแตกต่างจากชื่อผู้ใช้ Telegram ก็ตาม นโยบายเงียบของกลุ่มยังคงใช้กับทราฟฟิกกลุ่มที่ไม่เกี่ยวข้อง แต่ตัวแฮนเดิลบอตเองจะไม่ถือว่าเป็น "คนอื่น"

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.telegram.dmPolicy` ควบคุมการเข้าถึงข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist` (ต้องมี ID ผู้ส่งอย่างน้อยหนึ่งรายการใน `allowFrom`)
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    `dmPolicy: "open"` พร้อม `allowFrom: ["*"]` ทำให้บัญชี Telegram ใดก็ตามที่พบหรือเดาชื่อผู้ใช้บอตได้สามารถสั่งงานบอตได้ ใช้เฉพาะกับบอตสาธารณะที่ตั้งใจเปิดจริงและมีเครื่องมือที่จำกัดอย่างเข้มงวดเท่านั้น บอตเจ้าของคนเดียวควรใช้ `allowlist` พร้อม ID ผู้ใช้แบบตัวเลข

    `channels.telegram.allowFrom` รับ ID ผู้ใช้ Telegram แบบตัวเลข รองรับและปรับ `telegram:` / `tg:` prefixes ให้เป็นรูปแบบปกติ
    ใน config หลายบัญชี `channels.telegram.allowFrom` ระดับบนสุดที่เข้มงวดจะถือเป็นขอบเขตความปลอดภัย: รายการระดับบัญชี `allowFrom: ["*"]` จะไม่ทำให้บัญชีนั้นเป็นสาธารณะ เว้นแต่ allowlist ที่มีผลจริงของบัญชียังคงมี wildcard อย่างชัดเจนหลังจากรวมแล้ว
    `dmPolicy: "allowlist"` พร้อม `allowFrom` ว่างจะบล็อก DM ทั้งหมดและถูกปฏิเสธโดยการตรวจสอบ config
    การตั้งค่าจะถามเฉพาะ ID ผู้ใช้แบบตัวเลขเท่านั้น
    หากคุณอัปเกรดแล้ว config ของคุณมีรายการ allowlist เป็น `@username` ให้รัน `openclaw doctor --fix` เพื่อแก้ไขรายการเหล่านั้น (ทำแบบ best-effort; ต้องใช้โทเค็นบอต Telegram)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์ allowlist ของ pairing-store, `openclaw doctor --fix` สามารถกู้คืนรายการเข้าไปใน `channels.telegram.allowFrom` ในโฟลว์ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID ที่ระบุชัดเจน)

    สำหรับบอตเจ้าของคนเดียว แนะนำให้ใช้ `dmPolicy: "allowlist"` พร้อม ID `allowFrom` แบบตัวเลขที่ระบุชัดเจน เพื่อให้คงนโยบายการเข้าถึงไว้ใน config ได้ทนทาน (แทนที่จะพึ่งพาการอนุมัติการจับคู่ก่อนหน้า)

    ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่ได้หมายความว่า "ผู้ส่งนี้ได้รับอนุญาตทุกที่"
    การจับคู่ให้สิทธิ์เข้าถึง DM หากยังไม่มีเจ้าของคำสั่ง การจับคู่ที่อนุมัติครั้งแรกจะตั้ง `commands.ownerAllowFrom` ด้วย เพื่อให้คำสั่งเฉพาะเจ้าของและการอนุมัติ exec มีบัญชีผู้ปฏิบัติการที่ชัดเจน
    การอนุญาตผู้ส่งในกลุ่มยังคงมาจาก allowlist ที่ระบุชัดเจนใน config
    หากคุณต้องการ "ฉันได้รับอนุญาตครั้งเดียว แล้วทั้ง DM และคำสั่งในกลุ่มใช้งานได้" ให้ใส่ ID ผู้ใช้ Telegram แบบตัวเลขของคุณใน `channels.telegram.allowFrom`; สำหรับคำสั่งเฉพาะเจ้าของ ให้ตรวจสอบว่า `commands.ownerAllowFrom` มี `telegram:<your user id>`

    ### การหา ID ผู้ใช้ Telegram ของคุณ

    ปลอดภัยกว่า (ไม่ใช้บอตบุคคลที่สาม):

    1. DM ไปยังบอตของคุณ
    2. รัน `openclaw logs --follow`
    3. อ่าน `from.id`

    วิธีอย่างเป็นทางการของ Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีของบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="นโยบายกลุ่มและ allowlist">
    ตัวควบคุมสองอย่างทำงานร่วมกัน:

    1. **กลุ่มใดได้รับอนุญาต** (`channels.telegram.groups`)
       - ไม่มี config `groups`:
         - พร้อม `groupPolicy: "open"`: กลุ่มใดก็ผ่านการตรวจ ID กลุ่มได้
         - พร้อม `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการ `groups` (หรือ `"*"`)
       - กำหนดค่า `groups` แล้ว: ทำหน้าที่เป็น allowlist (ID ที่ระบุชัดเจนหรือ `"*"`)

    2. **ผู้ส่งใดได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่า Telegram จะย้อนกลับไปใช้ `allowFrom`
    รายการ `groupAllowFrom` ควรเป็น ID ผู้ใช้ Telegram แบบตัวเลข (`telegram:` / `tg:` prefixes จะถูกปรับเป็นรูปแบบปกติ)
    อย่าใส่ ID แชตกลุ่มหรือซูเปอร์กรุ๊ป Telegram ใน `groupAllowFrom` ID แชตค่าลบอยู่ภายใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเว้นสำหรับการอนุญาตผู้ส่ง
    ขอบเขตความปลอดภัย (`2026.2.25+`): การยืนยันสิทธิ์ผู้ส่งในกลุ่ม **ไม่** สืบทอดการอนุมัติจาก pairing-store ของ DM
    การจับคู่ยังคงเป็น DM เท่านั้น สำหรับกลุ่ม ให้ตั้ง `groupAllowFrom` หรือ `allowFrom` รายกลุ่ม/รายหัวข้อ
    หากไม่ได้ตั้งค่า `groupAllowFrom`, Telegram จะย้อนกลับไปใช้ `allowFrom` จาก config ไม่ใช่ pairing store
    รูปแบบที่ใช้งานได้จริงสำหรับบอตเจ้าของคนเดียว: ตั้ง ID ผู้ใช้ของคุณใน `channels.telegram.allowFrom`, ปล่อย `groupAllowFrom` ว่างไว้ และอนุญาตกลุ่มเป้าหมายภายใต้ `channels.telegram.groups`
    หมายเหตุ runtime: หาก `channels.telegram` หายไปทั้งหมด runtime จะใช้ค่าเริ่มต้นแบบ fail-closed `groupPolicy="allowlist"` เว้นแต่ `channels.defaults.groupPolicy` จะถูกตั้งไว้อย่างชัดเจน

    การตั้งค่ากลุ่มเฉพาะเจ้าของ:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    ทดสอบจากกลุ่มด้วย `@<bot_username> ping` ข้อความกลุ่มธรรมดาจะไม่เรียกบอตขณะ `requireMention: true`

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

      - ใส่ ID กลุ่มหรือซูเปอร์กรุ๊ป Telegram ที่เป็นค่าลบ เช่น `-1001234567890` ไว้ภายใต้ `channels.telegram.groups`
      - ใส่ ID ผู้ใช้ Telegram เช่น `8734062810` ไว้ภายใต้ `groupAllowFrom` เมื่อคุณต้องการจำกัดว่าคนใดในกลุ่มที่ได้รับอนุญาตสามารถเรียกบอตได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกใดก็ได้ของกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอตได้

    </Warning>

  </Tab>

  <Tab title="พฤติกรรมการกล่าวถึง">
    การตอบกลับในกลุ่มต้องมีการกล่าวถึงโดยค่าเริ่มต้น

    การกล่าวถึงอาจมาจาก:

    - การกล่าวถึงแบบ native `@botusername` หรือ
    - รูปแบบการกล่าวถึงใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    ตัวสลับคำสั่งระดับเซสชัน:

    - `/activation always`
    - `/activation mention`

    สิ่งเหล่านี้อัปเดตเฉพาะสถานะเซสชันเท่านั้น ใช้ config เพื่อให้คงอยู่ถาวร

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

    บริบทประวัติกลุ่มมีค่าเริ่มต้นเป็น `mention-only`: ข้อความกลุ่มก่อนหน้า
    จะถูกรวมเฉพาะเมื่อข้อความนั้นส่งถึงบอต เป็นการตอบกลับบอต
    หรือเป็นข้อความของบอตเอง ตั้ง `includeGroupHistoryContext: "recent"` เพื่อ
    รวมประวัติห้องล่าสุดสำหรับกลุ่มที่เชื่อถือได้ ตั้ง
    `includeGroupHistoryContext: "none"` เพื่อไม่ส่งประวัติกลุ่ม Telegram ก่อนหน้า
    ไปกับเทิร์นถัดไป

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    การหา ID แชตกลุ่ม:

    - ส่งต่อข้อความกลุ่มไปยัง `@userinfobot` / `@getidsbot`
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจสอบ Bot API `getUpdates`
    - หลังจากกลุ่มได้รับอนุญาตแล้ว ให้รัน `/whoami@<bot_username>` หากเปิดใช้งานคำสั่ง native

  </Tab>
</Tabs>

## พฤติกรรม runtime

- Telegram เป็นของกระบวนการ Gateway
- การกำหนดเส้นทางเป็นแบบกำหนดแน่นอน: ข้อความขาเข้าของ Telegram จะตอบกลับไปยัง Telegram (โมเดลไม่ได้เลือกช่องทาง)
- ข้อความขาเข้าจะถูกปรับรูปแบบเป็นซองข้อความช่องทางที่ใช้ร่วมกัน พร้อมเมทาดาทาการตอบกลับ ตัวแทนตำแหน่งสื่อ และบริบทลำดับการตอบกลับที่บันทึกไว้สำหรับการตอบกลับ Telegram ที่ Gateway ได้สังเกตเห็น
- เซสชันกลุ่มถูกแยกตาม ID กลุ่ม หัวข้อฟอรัมจะต่อท้าย `:topic:<threadId>` เพื่อให้หัวข้อแยกจากกัน
- ข้อความ DM สามารถมี `message_thread_id`; OpenClaw จะคงค่าไว้สำหรับการตอบกลับ เซสชันหัวข้อ DM จะแยกเฉพาะเมื่อ Telegram `getMe` รายงาน `has_topics_enabled: true` สำหรับบอต มิฉะนั้น DM จะยังอยู่ในเซสชันแบบราบ
- Long polling ใช้ grammY runner พร้อมการจัดลำดับต่อแชท/ต่อเธรด การทำงานพร้อมกันของ runner sink โดยรวมใช้ `agents.defaults.maxConcurrent`
- การเริ่มต้นหลายบัญชีจำกัดจำนวนการตรวจสอบ Telegram `getMe` ที่ทำพร้อมกัน เพื่อไม่ให้ฟลีตบอตขนาดใหญ่กระจายการตรวจสอบทุกบัญชีพร้อมกัน
- Long polling ถูกป้องกันภายในแต่ละกระบวนการ Gateway เพื่อให้มี poller ที่ทำงานอยู่เพียงตัวเดียวเท่านั้นที่ใช้โทเค็นบอตได้ในแต่ละครั้ง หากคุณยังเห็นข้อขัดแย้ง `getUpdates` 409 แสดงว่า Gateway ของ OpenClaw อื่น สคริปต์ หรือ poller ภายนอกน่าจะกำลังใช้โทเค็นเดียวกันอยู่
- การรีสตาร์ตจาก watchdog ของ long-polling จะถูกเรียกหลังจากไม่มี liveness ของ `getUpdates` ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีตามค่าเริ่มต้น เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการปรับใช้ของคุณยังเห็นการรีสตาร์ตจาก polling-stall เท็จระหว่างงานที่ทำงานนาน ค่านี้มีหน่วยเป็นมิลลิวินาทีและอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับการ override ต่อบัญชี
- Telegram Bot API ไม่มีการรองรับใบตอบรับการอ่าน (`sendReadReceipts` ใช้ไม่ได้)

<Note>
  `channels.telegram.dm.threadReplies` และ `channels.telegram.direct.<chatId>.threadReplies` ถูกลบออกแล้ว เรียกใช้ `openclaw doctor --fix` หลังอัปเกรดหาก config ของคุณยังมีคีย์เหล่านั้น การกำหนดเส้นทางหัวข้อ DM ตอนนี้ทำตามความสามารถของบอตจาก Telegram `getMe.has_topics_enabled` ซึ่งถูกควบคุมโดยโหมดเธรดของ BotFather: บอตที่เปิดหัวข้อจะใช้เซสชัน DM ที่ผูกกับเธรดเมื่อ Telegram ส่ง `message_thread_id`; DM อื่นจะยังอยู่ในเซสชันแบบราบ
</Note>

## อ้างอิงคุณสมบัติ

<AccordionGroup>
  <Accordion title="ตัวอย่างสตรีมสด (การแก้ไขข้อความ)">
    OpenClaw สามารถสตรีมคำตอบบางส่วนแบบเรียลไทม์ได้:

    - แชทโดยตรง: ข้อความตัวอย่าง + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความตัวอย่าง + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` คือ `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - ตัวอย่างคำตอบเริ่มต้นสั้นๆ จะถูก debounce แล้วทำให้เป็นข้อความจริงหลังจากดีเลย์ที่มีขอบเขต หากการรันยังทำงานอยู่
    - `progress` คงร่างสถานะที่แก้ไขได้หนึ่งรายการสำหรับความคืบหน้าของเครื่องมือ แสดงป้ายสถานะคงที่เมื่อมีกิจกรรมคำตอบมาถึงก่อนความคืบหน้าของเครื่องมือ ล้างเมื่อเสร็จสิ้น และส่งคำตอบสุดท้ายเป็นข้อความปกติ
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความตัวอย่างที่แก้ไขเดิมซ้ำหรือไม่ (ค่าเริ่มต้น: `true` เมื่อการสตรีมตัวอย่างทำงานอยู่)
    - `streaming.preview.commandText` ควบคุมรายละเอียดคำสั่ง/exec ภายในบรรทัดความคืบหน้าของเครื่องมือเหล่านั้น: `raw` (ค่าเริ่มต้น, คงพฤติกรรมที่เผยแพร่แล้วไว้) หรือ `status` (เฉพาะป้ายเครื่องมือ)
    - `streaming.progress.commentary` (ค่าเริ่มต้น: `false`) เลือกรับข้อความคำอธิบาย/คำนำของผู้ช่วยในร่างความคืบหน้าชั่วคราว
    - ระบบจะตรวจพบ `channels.telegram.streamMode` แบบเก่า ค่า `streaming` แบบบูลีน และคีย์ตัวอย่างร่าง native ที่เลิกใช้แล้ว; เรียกใช้ `openclaw doctor --fix` เพื่อย้ายไปยัง config การสตรีมปัจจุบัน

    การอัปเดตตัวอย่างความคืบหน้าของเครื่องมือคือบรรทัดสถานะสั้นๆ ที่แสดงระหว่างเครื่องมือทำงาน เช่น การดำเนินการคำสั่ง การอ่านไฟล์ การอัปเดตการวางแผน สรุปแพตช์ หรือข้อความคำนำ/คำอธิบายของ Codex ในโหมด app-server ของ Codex Telegram เปิดใช้งานค่าเหล่านี้ตามค่าเริ่มต้นเพื่อให้ตรงกับพฤติกรรม OpenClaw ที่เผยแพร่ตั้งแต่ `v2026.4.22` เป็นต้นไป

    หากต้องการคงตัวอย่างที่แก้ไขสำหรับข้อความคำตอบ แต่ซ่อนบรรทัดความคืบหน้าของเครื่องมือ ให้ตั้งค่า:

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

    หากต้องการให้ความคืบหน้าของเครื่องมือยังมองเห็นได้ แต่ซ่อนข้อความคำสั่ง/exec ให้ตั้งค่า:

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

    ใช้โหมด `progress` เมื่อคุณต้องการความคืบหน้าของเครื่องมือที่มองเห็นได้โดยไม่แก้ไขคำตอบสุดท้ายเข้าไปในข้อความเดียวกันนั้น วางนโยบายข้อความคำสั่งไว้ใต้ `streaming.progress`:

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

    ใช้ `streaming.mode: "off"` เฉพาะเมื่อคุณต้องการการส่งเฉพาะคำตอบสุดท้าย: การแก้ไขตัวอย่างของ Telegram จะถูกปิดใช้งาน และการพูดคุยทั่วไปของเครื่องมือ/ความคืบหน้าจะถูกระงับแทนที่จะส่งเป็นข้อความสถานะแยกต่างหาก พรอมต์อนุมัติ เพย์โหลดสื่อ และข้อผิดพลาดยังคงกำหนดเส้นทางผ่านการส่งสุดท้ายตามปกติ ใช้ `streaming.preview.toolProgress: false` เมื่อคุณต้องการคงเฉพาะการแก้ไขตัวอย่างคำตอบไว้ ขณะซ่อนบรรทัดสถานะความคืบหน้าของเครื่องมือ

    <Note>
      การตอบกลับคำพูดอ้างอิงที่เลือกของ Telegram เป็นข้อยกเว้น เมื่อ `replyToMode` เป็น `"first"`, `"all"` หรือ `"batched"` และข้อความขาเข้ามีข้อความคำพูดอ้างอิงที่เลือก OpenClaw จะส่งคำตอบสุดท้ายผ่านเส้นทาง quote-reply native ของ Telegram แทนการแก้ไขตัวอย่างคำตอบ ดังนั้น `streaming.preview.toolProgress` จึงไม่สามารถแสดงบรรทัดสถานะสั้นๆ สำหรับรอบนั้นได้ การตอบกลับข้อความปัจจุบันที่ไม่มีข้อความคำพูดอ้างอิงที่เลือกยังคงใช้การสตรีมตัวอย่าง ตั้งค่า `replyToMode: "off"` เมื่อการมองเห็นความคืบหน้าของเครื่องมือสำคัญกว่าการตอบกลับคำพูดอ้างอิง native หรือตั้งค่า `streaming.preview.toolProgress: false` เพื่อรับทราบ trade-off นี้
    </Note>

    สำหรับการตอบกลับแบบข้อความเท่านั้น:

    - ตัวอย่าง DM/กลุ่ม/หัวข้อแบบสั้น: OpenClaw คงข้อความตัวอย่างเดิมไว้และทำการแก้ไขสุดท้ายในตำแหน่งเดิม
    - คำตอบสุดท้ายแบบข้อความยาวที่แยกเป็นข้อความ Telegram หลายข้อความ จะใช้ตัวอย่างเดิมซ้ำเป็นชิ้นส่วนสุดท้ายแรกเมื่อเป็นไปได้ แล้วส่งเฉพาะชิ้นส่วนที่เหลือ
    - คำตอบสุดท้ายในโหมดความคืบหน้าจะล้างร่างสถานะและใช้การส่งสุดท้ายตามปกติแทนการแก้ไขร่างให้เป็นคำตอบ
    - หากการแก้ไขสุดท้ายล้มเหลวก่อนยืนยันข้อความที่เสร็จสมบูรณ์ OpenClaw จะใช้การส่งสุดท้ายตามปกติและล้างตัวอย่างที่ค้างอยู่

    สำหรับการตอบกลับที่ซับซ้อน (เช่น เพย์โหลดสื่อ) OpenClaw จะย้อนกลับไปใช้การส่งสุดท้ายตามปกติ แล้วล้างข้อความตัวอย่าง

    การสตรีมตัวอย่างแยกจาก block streaming เมื่อเปิดใช้งาน block streaming อย่างชัดเจนสำหรับ Telegram OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำ

    พฤติกรรมสตรีมเหตุผล:

    - `/reasoning stream` ใช้เส้นทางตัวอย่างเหตุผลของช่องทางที่รองรับ; บน Telegram จะสตรีมเหตุผลเข้าไปในตัวอย่างสดระหว่างสร้างคำตอบ
    - ตัวอย่างเหตุผลจะถูกลบหลังการส่งสุดท้าย; ใช้ `/reasoning on` เมื่อควรให้เหตุผลยังมองเห็นได้
    - คำตอบสุดท้ายจะถูกส่งโดยไม่มีข้อความเหตุผล

  </Accordion>

  <Accordion title="การจัดรูปแบบข้อความแบบสมบูรณ์">
    ข้อความขาออกใช้ข้อความ HTML มาตรฐานของ Telegram ตามค่าเริ่มต้น เพื่อให้คำตอบยังอ่านง่ายในไคลเอนต์ Telegram ปัจจุบัน โหมดความเข้ากันได้นี้รองรับตัวหนา ตัวเอียง ลิงก์ โค้ด สปอยเลอร์ และคำพูดอ้างอิงตามปกติ แต่ไม่รองรับบล็อกแบบ rich-only ของ Bot API 10.1 เช่น ตาราง native รายละเอียด สื่อ rich และสูตร

    ตั้งค่า `channels.telegram.richMessages: true` เพื่อเลือกรับข้อความ rich ของ Bot API 10.1:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    เมื่อเปิดใช้งาน:

    - เอเจนต์จะได้รับแจ้งว่าข้อความ rich ของ Telegram พร้อมใช้งานสำหรับบอต/บัญชีนี้
    - ข้อความ Markdown จะถูกเรนเดอร์ผ่าน Markdown IR ของ OpenClaw และส่งเป็น HTML rich ของ Telegram
    - เพย์โหลด HTML rich ที่ระบุชัดเจนจะคงแท็ก Bot API 10.1 ที่รองรับไว้ เช่น หัวเรื่อง ตาราง รายละเอียด สื่อ rich และสูตร
    - คำบรรยายสื่อยังคงใช้คำบรรยาย HTML ของ Telegram เพราะข้อความ rich ไม่ได้แทนที่คำบรรยาย

    วิธีนี้ทำให้ข้อความของโมเดลอยู่ห่างจากสัญลักษณ์ Telegram Rich Markdown ดังนั้นสกุลเงินอย่าง `$400-600K` จะไม่ถูกแยกวิเคราะห์เป็นคณิตศาสตร์ ข้อความ rich แบบยาวจะถูกแยกโดยอัตโนมัติตามขีดจำกัดข้อความ rich และบล็อก rich ของ Telegram ตารางที่เกินขีดจำกัดคอลัมน์ของ Telegram จะถูกส่งเป็นบล็อกโค้ด

    ค่าเริ่มต้น: ปิดเพื่อความเข้ากันได้ของไคลเอนต์ ข้อความ rich ต้องใช้ไคลเอนต์ Telegram ที่เข้ากันได้; ไคลเอนต์เดสก์ท็อป เว็บ Android และไคลเอนต์บุคคลที่สามบางตัวในปัจจุบันแสดงข้อความ rich ที่รับแล้วว่าไม่รองรับ ปิดตัวเลือกนี้ไว้ เว้นแต่ไคลเอนต์ทุกตัวที่ใช้กับบอตสามารถเรนเดอร์ได้ `/status` แสดงว่าเซสชัน Telegram ปัจจุบันเปิดหรือปิดข้อความ rich อยู่

    การแสดงตัวอย่างลิงก์เปิดใช้งานตามค่าเริ่มต้น `channels.telegram.linkPreview: false` จะข้ามการตรวจจับเอนทิตีอัตโนมัติสำหรับข้อความ rich

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

    - ชื่อจะถูกปรับรูปแบบ (ลบ `/` นำหน้า, แปลงเป็นตัวพิมพ์เล็ก)
    - รูปแบบที่ถูกต้อง: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งกำหนดเองไม่สามารถ override คำสั่ง native ได้
    - ข้อขัดแย้ง/รายการซ้ำจะถูกข้ามและบันทึกลงล็อก

    หมายเหตุ:

    - คำสั่งกำหนดเองเป็นเพียงรายการเมนูเท่านั้น; ไม่ได้ใช้งานพฤติกรรมโดยอัตโนมัติ
    - คำสั่ง Plugin/Skills ยังทำงานได้เมื่อพิมพ์ แม้จะไม่แสดงในเมนู Telegram

    หากปิดใช้งานคำสั่ง native รายการในตัวจะถูกลบ คำสั่งกำหนดเอง/Plugin อาจยังลงทะเบียนได้หากกำหนดค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายถึงเมนู Telegram ยังล้นหลังจากตัดรายการแล้ว; ลดคำสั่ง Plugin/Skills/กำหนดเอง หรือปิดใช้งาน `channels.telegram.commands.native`
    - `deleteWebhook`, `deleteMyCommands` หรือ `setMyCommands` ล้มเหลวพร้อม `404: Not Found` ขณะที่คำสั่ง curl ของ Bot API โดยตรงทำงานได้ อาจหมายความว่า `channels.telegram.apiRoot` ถูกตั้งเป็น endpoint `/bot<TOKEN>` แบบเต็ม `apiRoot` ต้องเป็นเฉพาะ root ของ Bot API เท่านั้น และ `openclaw doctor --fix` จะลบ `/bot<TOKEN>` ต่อท้ายที่เกิดขึ้นโดยไม่ตั้งใจ
    - `getMe returned 401` หมายถึง Telegram ปฏิเสธโทเค็นบอตที่กำหนดค่าไว้ อัปเดต `botToken`, `tokenFile` หรือ `TELEGRAM_BOT_TOKEN` ด้วยโทเค็น BotFather ปัจจุบัน; OpenClaw หยุดก่อน polling ดังนั้นจึงไม่ถูกรายงานเป็นความล้มเหลวในการล้าง webhook
    - `setMyCommands failed` พร้อมข้อผิดพลาดเครือข่าย/fetch มักหมายถึง DNS/HTTPS ขาออกไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งจับคู่อุปกรณ์ (Plugin `device-pair`)

    เมื่อมีการติดตั้ง Plugin `device-pair`:

    1. `/pair` สร้างโค้ดตั้งค่า
    2. วางโค้ดในแอป iOS
    3. `/pair pending` แสดงรายการคำขอที่รอดำเนินการ (รวม role/scopes)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบระบุชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    โค้ดตั้งค่าพกโทเค็น bootstrap อายุสั้น bootstrap ด้วยโค้ดตั้งค่าในตัวเป็นแบบ node-only: การเชื่อมต่อครั้งแรกสร้างคำขอ node ที่รอดำเนินการ และหลังอนุมัติ Gateway จะส่งคืนโทเค็น node แบบถาวรพร้อม `scopes: []` โดยไม่ส่งคืนโทเค็น operator ที่ส่งต่อให้; การเข้าถึงแบบ operator ต้องใช้การจับคู่ operator ที่อนุมัติแยกต่างหากหรือโฟลว์โทเค็น

    หากอุปกรณ์ลองใหม่ด้วยรายละเอียด auth ที่เปลี่ยนไป (เช่น role/scopes/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` อื่น เรียกใช้ `/pair pending` อีกครั้งก่อนอนุมัติ

    รายละเอียดเพิ่มเติม: [การจับคู่](/th/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="ปุ่มแบบอินไลน์">
    กำหนดค่าขอบเขตคีย์บอร์ดแบบอินไลน์:

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

    `capabilities: ["inlineButtons"]` แบบเดิมจะแมปไปยัง `inlineButtons: "all"`

    ตัวอย่างการดำเนินการกับข้อความ:

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

    ตัวอย่างปุ่ม Mini App:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    ปุ่ม `web_app` ของ Telegram ใช้งานได้เฉพาะในการแชทส่วนตัวระหว่างผู้ใช้กับ
    บอตเท่านั้น

    การคลิก Callback ที่ไม่ได้ถูกอ้างสิทธิ์โดยตัวจัดการอินเทอร์แอ็กทีฟของ Plugin
    ที่ลงทะเบียนไว้จะถูกส่งต่อไปยังเอเจนต์เป็นข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="การดำเนินการกับข้อความ Telegram สำหรับเอเจนต์และระบบอัตโนมัติ">
    การดำเนินการเครื่องมือ Telegram ประกอบด้วย:

    - `sendMessage` (`to`, `content`, `mediaUrl` ที่ไม่บังคับ, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` หรือ `caption`, ปุ่มอินไลน์ `presentation` ที่ไม่บังคับ; การแก้ไขเฉพาะปุ่มจะอัปเดตมาร์กอัปการตอบกลับ)
    - `createForumTopic` (`chatId`, `name`, `iconColor` ที่ไม่บังคับ, `iconCustomEmojiId`)

    การดำเนินการกับข้อความของช่องทางจะแสดงนามแฝงที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    การควบคุมเกต:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้งาน)

    หมายเหตุ: ขณะนี้ `edit` และ `topic-create` เปิดใช้งานตามค่าเริ่มต้นและไม่มีตัวสลับ `channels.telegram.actions.*` แยกต่างหาก
    การส่งขณะรันไทม์ใช้สแนปช็อต config/secret ที่ใช้งานอยู่ (ตอนเริ่มต้น/โหลดซ้ำ) ดังนั้นเส้นทางการดำเนินการจะไม่ทำการแก้ไข SecretRef ซ้ำแบบเฉพาะกิจในแต่ละครั้งที่ส่ง

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

    เมื่อเปิดใช้งานเธรดการตอบกลับและมีข้อความหรือคำบรรยาย Telegram ต้นฉบับอยู่ OpenClaw จะรวมข้อความอ้างอิงย่อของ Telegram แบบเนทีฟให้โดยอัตโนมัติ Telegram จำกัดข้อความอ้างอิงแบบเนทีฟไว้ที่ 1024 หน่วยรหัส UTF-16 ดังนั้นข้อความที่ยาวกว่าจะถูกอ้างอิงตั้งแต่ต้นและจะถอยกลับไปใช้การตอบกลับแบบธรรมดาหาก Telegram ปฏิเสธข้อความอ้างอิง

    หมายเหตุ: `off` ปิดใช้งานเธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงได้รับการใช้งาน

  </Accordion>

  <Accordion title="หัวข้อฟอรัมและพฤติกรรมของเธรด">
    ซูเปอร์กรุ๊ปแบบฟอรัม:

    - คีย์เซสชันของหัวข้อจะเติม `:topic:<threadId>` ต่อท้าย
    - การตอบกลับและสถานะกำลังพิมพ์จะกำหนดเป้าหมายไปยังเธรดของหัวข้อ
    - เส้นทาง config ของหัวข้อ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของหัวข้อทั่วไป (`threadId=1`):

    - การส่งข้อความจะละ `message_thread_id` (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - การดำเนินการกำลังพิมพ์ยังคงรวม `message_thread_id`

    การสืบทอดของหัวข้อ: รายการหัวข้อจะสืบทอดการตั้งค่ากลุ่มเว้นแต่ถูกแทนที่ (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` เป็นของหัวข้อเท่านั้นและไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม
    `topics."*"` ตั้งค่าเริ่มต้นสำหรับทุกหัวข้อในกลุ่มนั้น; ID หัวข้อแบบตรงกันยังคงมีสิทธิ์เหนือกว่า `"*"`

    **การกำหนดเส้นทางเอเจนต์ต่อหัวข้อ**: แต่ละหัวข้อสามารถกำหนดเส้นทางไปยังเอเจนต์ที่ต่างกันได้โดยตั้งค่า `agentId` ใน config ของหัวข้อ สิ่งนี้ทำให้แต่ละหัวข้อมีพื้นที่ทำงาน หน่วยความจำ และเซสชันที่แยกเป็นของตัวเอง ตัวอย่าง:

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

    **การผูกหัวข้อ ACP แบบถาวร**: หัวข้อฟอรัมสามารถตรึงเซสชัน harness ของ ACP ผ่านการผูก ACP แบบมีชนิดที่ระดับบนสุด (`bindings[]` พร้อม `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ id ที่ระบุหัวข้อ เช่น `-1001234567890:topic:42`) ขณะนี้จำกัดขอบเขตไว้ที่หัวข้อฟอรัมในกลุ่ม/ซูเปอร์กรุ๊ป ดู [เอเจนต์ ACP](/th/tools/acp-agents)

    **การสร้าง ACP ที่ผูกกับเธรดจากแชท**: `/acp spawn <agent> --thread here|auto` ผูกหัวข้อปัจจุบันกับเซสชัน ACP ใหม่; ข้อความติดตามผลจะถูกกำหนดเส้นทางไปที่นั่นโดยตรง OpenClaw จะตรึงการยืนยันการสร้างไว้ในหัวข้อ ต้องให้ `channels.telegram.threadBindings.spawnSessions` ยังคงเปิดใช้งานอยู่ (ค่าเริ่มต้น: `true`)

    บริบทเทมเพลตแสดง `MessageThreadId` และ `IsForum` แชท DM ที่มี `message_thread_id` จะเก็บเมตาดาต้าการตอบกลับไว้; แชทเหล่านี้ใช้คีย์เซสชันที่รับรู้เธรดเฉพาะเมื่อ Telegram `getMe` รายงาน `has_topics_enabled: true` สำหรับบอต
    การแทนที่ `dm.threadReplies` และ `direct.*.threadReplies` เดิมถูกเลิกใช้อย่างตั้งใจ; ใช้โหมดเธรดของ BotFather เป็นแหล่งความจริงเดียว และรัน `openclaw doctor --fix` เพื่อลบคีย์ config ที่ล้าสมัย

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยกความแตกต่างระหว่างวอยซ์โน้ตกับไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมแบบไฟล์เสียง
    - แท็ก `[[audio_as_voice]]` ในการตอบกลับของเอเจนต์เพื่อบังคับให้ส่งเป็นวอยซ์โน้ต
    - ทรานสคริปต์วอยซ์โน้ตขาเข้าจะถูกจัดกรอบเป็นข้อความที่สร้างโดยเครื่อง
      และไม่น่าเชื่อถือในบริบทของเอเจนต์; การตรวจจับการกล่าวถึงยังคงใช้
      ทรานสคริปต์ดิบ ดังนั้นข้อความเสียงที่ถูกเกตด้วยการกล่าวถึงจึงยังคงทำงานต่อไป

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

    Telegram แยกความแตกต่างระหว่างไฟล์วิดีโอกับโน้ตวิดีโอ

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

    โน้ตวิดีโอไม่รองรับคำบรรยาย ข้อความที่ให้มาจะถูกส่งแยกต่างหาก

    ### สติกเกอร์

    การจัดการสติกเกอร์ขาเข้า:

    - WEBP แบบคงที่: ดาวน์โหลดและประมวลผลแล้ว (ตัวแทน `<media:sticker>`)
    - TGS แบบเคลื่อนไหว: ข้าม
    - WEBM แบบวิดีโอ: ข้าม

    ฟิลด์บริบทของสติกเกอร์:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    คำอธิบายสติกเกอร์ถูกแคชไว้ในสถานะ Plugin ของ OpenClaw SQLite เพื่อลดการเรียกใช้งานด้านการมองเห็นซ้ำ

    เปิดใช้แอ็กชันสติกเกอร์:

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
    รีแอ็กชันของ Telegram มาถึงเป็นการอัปเดต `message_reaction` (แยกจากเพย์โหลดข้อความ)

    เมื่อเปิดใช้ OpenClaw จะจัดคิวเหตุการณ์ระบบ เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    การกำหนดค่า:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงรีแอ็กชันของผู้ใช้ต่อข้อความที่บ็อตส่งเท่านั้น (พยายามให้ดีที่สุดผ่านแคชข้อความที่ส่ง)
    - เหตุการณ์รีแอ็กชันยังคงเคารพการควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ให้รหัสเธรดในการอัปเดตรีแอ็กชัน
      - กลุ่มที่ไม่ใช่ฟอรัมจะส่งต่อไปยังเซสชันแชตกลุ่ม
      - กลุ่มฟอรัมจะส่งต่อไปยังเซสชันหัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อที่เป็นต้นทางจริง

    `allowed_updates` สำหรับ polling/webhook จะรวม `message_reaction` โดยอัตโนมัติ

  </Accordion>

  <Accordion title="รีแอ็กชัน ack">
    `ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า `ackReactionScope` ตัดสินว่าอีโมจินั้นจะถูกส่งจริง *เมื่อใด*

    **ลำดับการแก้ค่าอีโมจิ (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - ค่าอีโมจิสำรองจากตัวตนของเอเจนต์ (`agents.list[].identity.emoji` มิฉะนั้นใช้ "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิยูนิโค้ด (เช่น "👀")
    - ใช้ `""` เพื่อปิดใช้รีแอ็กชันสำหรับช่องทางหรือบัญชี

    **ขอบเขต (`messages.ackReactionScope`):**

    ผู้ให้บริการ Telegram อ่านขอบเขตจาก `messages.ackReactionScope` (ค่าเริ่มต้น `"group-mentions"`) ปัจจุบันยังไม่มีการแทนที่ในระดับบัญชี Telegram หรือระดับช่องทาง Telegram

    ค่า: `"all"` (ข้อความส่วนตัว + กลุ่ม), `"direct"` (ข้อความส่วนตัวเท่านั้น), `"group-all"` (ทุกข้อความกลุ่ม ไม่มีข้อความส่วนตัว), `"group-mentions"` (กลุ่มเมื่อมีการกล่าวถึงบ็อต; **ไม่มีข้อความส่วนตัว** — นี่คือค่าเริ่มต้น), `"off"` / `"none"` (ปิดใช้)

    <Note>
    ขอบเขตเริ่มต้น (`"group-mentions"`) จะไม่เรียกรีแอ็กชัน ack ในข้อความโดยตรง หากต้องการรับรีแอ็กชัน ack บนข้อความส่วนตัว Telegram ขาเข้า ให้ตั้งค่า `messages.ackReactionScope` เป็น `"direct"` หรือ `"all"` ค่านี้ถูกอ่านเมื่อผู้ให้บริการ Telegram เริ่มทำงาน ดังนั้นจำเป็นต้องรีสตาร์ต Gateway เพื่อให้การเปลี่ยนแปลงมีผล
    </Note>

  </Accordion>

  <Accordion title="การเขียนการกำหนดค่าจากเหตุการณ์และคำสั่งของ Telegram">
    การเขียนการกำหนดค่าของช่องทางเปิดใช้เป็นค่าเริ่มต้น (`configWrites !== false`)

    การเขียนที่ถูกทริกเกอร์โดย Telegram รวมถึง:

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

    ในโหมด long-polling OpenClaw จะคงค่า watermark การรีสตาร์ตไว้หลังจากอัปเดตถูกส่งต่อสำเร็จเท่านั้น หากตัวจัดการล้มเหลว อัปเดตนั้นจะยังคงลองใหม่ได้ในกระบวนการเดียวกัน และจะไม่ถูกเขียนว่าเสร็จสมบูรณ์สำหรับการตัดซ้ำเมื่อรีสตาร์ต

    ตัวรับฟังภายในเครื่องผูกกับ `127.0.0.1:8787` สำหรับทางเข้าจากสาธารณะ ให้ใส่ reverse proxy ไว้หน้าพอร์ตภายในเครื่อง หรือตั้งค่า `webhookHost: "0.0.0.0"` อย่างตั้งใจ

    โหมด Webhook ตรวจสอบตัวป้องกันคำขอ โทเค็นลับของ Telegram และเนื้อหา JSON ก่อนส่งคืน `200` ให้ Telegram
    จากนั้น OpenClaw จะประมวลผลอัปเดตแบบอะซิงโครนัสผ่านเลนบ็อตแยกตามแชต/หัวข้อเดียวกับที่ใช้โดย long polling ดังนั้นรอบการทำงานของเอเจนต์ที่ช้าจะไม่ทำให้การตอบรับการส่งมอบของ Telegram ค้างอยู่

  </Accordion>

  <Accordion title="ขีดจำกัด การลองใหม่ และเป้าหมาย CLI">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` จะให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนการแบ่งตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ทั้งขาเข้าและขาออก
    - `channels.telegram.mediaGroupFlushMs` (ค่าเริ่มต้น 500) ควบคุมระยะเวลาที่อัลบั้ม/กลุ่มสื่อของ Telegram จะถูกบัฟเฟอร์ไว้ก่อนที่ OpenClaw จะส่งต่อเป็นข้อความขาเข้าหนึ่งข้อความ เพิ่มค่านี้หากส่วนต่าง ๆ ของอัลบั้มมาถึงช้า หรือลดค่าเพื่อลดเวลาแฝงของการตอบกลับอัลบั้ม
    - `channels.telegram.timeoutSeconds` แทนที่ค่า timeout ของไคลเอนต์ Telegram API (หากไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY) ไคลเอนต์บอตจะจำกัดค่าที่กำหนดไว้ให้ต่ำกว่าตัวป้องกันคำขอข้อความ/การพิมพ์ขาออก 60 วินาที เพื่อไม่ให้ grammY ยกเลิกการส่งคำตอบที่มองเห็นได้ก่อนที่ตัวป้องกันและ fallback ของทรานสปอร์ต OpenClaw จะทำงาน Long polling ยังคงใช้ตัวป้องกันคำขอ `getUpdates` 45 วินาที เพื่อไม่ให้การโพลที่ไม่ได้ใช้งานถูกปล่อยทิ้งไว้อย่างไม่มีกำหนด
    - ค่าเริ่มต้นของ `channels.telegram.pollingStallThresholdMs` คือ `120000`; ปรับในช่วง `30000` ถึง `600000` เฉพาะกรณีการรีสตาร์ท polling-stall ที่เป็น false-positive
    - ประวัติบริบทกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` คือปิดใช้งาน
    - บริบทเสริมของการตอบกลับ/การอ้างอิง/การส่งต่อจะถูกทำให้เป็นมาตรฐานเป็นหน้าต่างบริบทการสนทนาที่เลือกไว้หนึ่งรายการ เมื่อ Gateway เคยสังเกตเห็นข้อความต้นทางแล้ว แคชข้อความที่สังเกตเห็นอยู่ในสถานะ Plugin ของ OpenClaw SQLite และ `openclaw doctor --fix` จะนำเข้า sidecar เดิม Telegram รวม `reply_to_message` แบบตื้นเพียงหนึ่งรายการใน updates ดังนั้นเชนที่เก่ากว่าแคชจะถูกจำกัดตามเพย์โหลด update ปัจจุบันของ Telegram
    - allowlist ของ Telegram ใช้ควบคุมเป็นหลักว่าใครสามารถเรียก agent ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบสมบูรณ์
    - ตัวควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - การตั้งค่า `channels.telegram.retry` ใช้กับตัวช่วยส่งของ Telegram (CLI/tools/actions) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้ การส่งคำตอบสุดท้ายขาเข้ายังใช้การลองใหม่แบบ safe-send ที่มีขอบเขตสำหรับความล้มเหลวก่อนเชื่อมต่อของ Telegram แต่จะไม่ลองใหม่กับ envelope เครือข่ายหลังส่งที่กำกวมซึ่งอาจทำให้เกิดข้อความที่มองเห็นได้ซ้ำ

    เป้าหมายการส่งของ CLI และ message-tool สามารถเป็น chat ID แบบตัวเลข, username หรือเป้าหมายหัวข้อฟอรัม:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    การโพลของ Telegram ใช้ `openclaw message poll` และรองรับหัวข้อฟอรัม:

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

    - `--presentation` พร้อมบล็อก `buttons` สำหรับคีย์บอร์ด inline เมื่อ `channels.telegram.capabilities.inlineButtons` อนุญาต
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอการส่งแบบปักหมุดเมื่อบอตสามารถปักหมุดในแชตนั้นได้
    - `--force-document` เพื่อส่งรูปภาพ, GIF และวิดีโอขาออกเป็นเอกสาร แทนการอัปโหลดเป็นรูปภาพแบบบีบอัด สื่อเคลื่อนไหว หรือวิดีโอ

    การควบคุมการอนุญาต action:

    - `channels.telegram.actions.sendMessage=false` ปิดใช้งานข้อความ Telegram ขาออก รวมถึง poll
    - `channels.telegram.actions.poll=false` ปิดใช้งานการสร้าง poll ของ Telegram โดยยังคงเปิดใช้งานการส่งปกติไว้

  </Accordion>

  <Accordion title="การอนุมัติ exec ใน Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถเลือกโพสต์ prompt ในแชตหรือหัวข้อที่เป็นต้นทางได้ ผู้อนุมัติต้องเป็น ID ผู้ใช้ Telegram แบบตัวเลข

    พาธการตั้งค่า:

    - `channels.telegram.execApprovals.enabled` (เปิดใช้งานอัตโนมัติเมื่อมีผู้อนุมัติอย่างน้อยหนึ่งรายที่ resolve ได้)
    - `channels.telegram.execApprovals.approvers` (fallback ไปยัง ID เจ้าของแบบตัวเลขจาก `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` และ `defaultTo` ควบคุมว่าใครสามารถคุยกับบอตได้และบอตจะส่งคำตอบปกติไปที่ใด สิ่งเหล่านี้ไม่ได้ทำให้ใครเป็นผู้อนุมัติ exec การจับคู่ DM ที่ได้รับอนุมัติครั้งแรกจะ bootstrap `commands.ownerAllowFrom` เมื่อยังไม่มีเจ้าของคำสั่ง ดังนั้นการตั้งค่าแบบเจ้าของหนึ่งรายยังทำงานได้โดยไม่ต้องระบุ ID ซ้ำใต้ `execApprovals.approvers`

    การส่งผ่านช่องทางจะแสดงข้อความคำสั่งในแชต เปิดใช้ `channel` หรือ `both` เฉพาะในกลุ่ม/หัวข้อที่เชื่อถือได้ เมื่อ prompt ไปถึงหัวข้อฟอรัม OpenClaw จะรักษาหัวข้อนั้นไว้สำหรับ prompt อนุมัติและการติดตามผล การอนุมัติ exec จะหมดอายุหลัง 30 นาทีโดยค่าเริ่มต้น

    ปุ่มอนุมัติ inline ยังต้องให้ `channels.telegram.capabilities.inlineButtons` อนุญาตพื้นผิวเป้าหมาย (`dm`, `group` หรือ `all`) ID การอนุมัติที่ขึ้นต้นด้วย `plugin:` จะ resolve ผ่านการอนุมัติของ Plugin ส่วนรายการอื่นจะ resolve ผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## ตัวควบคุมการตอบกลับข้อผิดพลาด

เมื่อ agent พบข้อผิดพลาดในการส่งหรือข้อผิดพลาดของ provider นโยบายข้อผิดพลาดจะควบคุมว่าจะส่งข้อความข้อผิดพลาดไปยังแชต Telegram หรือไม่:

| คีย์                                 | ค่า                     | ค่าเริ่มต้น         | คำอธิบาย                                                                                                                                                                                               |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — ส่งทุกข้อความข้อผิดพลาดไปยังแชต `once` — ส่งข้อความข้อผิดพลาดที่ไม่ซ้ำกันแต่ละรายการหนึ่งครั้งต่อหน้าต่าง cooldown (ระงับข้อผิดพลาดที่เหมือนกันซ้ำ) `silent` — ไม่ส่งข้อความข้อผิดพลาดไปยังแชต |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | หน้าต่าง cooldown สำหรับนโยบาย `once` หลังจากส่งข้อผิดพลาดแล้ว ข้อความข้อผิดพลาดเดียวกันจะถูกระงับจนกว่าช่วงเวลานี้จะผ่านไป ป้องกันสแปมข้อผิดพลาดระหว่างเหตุขัดข้อง                                      |

รองรับการ override รายบัญชี รายกลุ่ม และรายหัวข้อ (การสืบทอดเหมือนกับคีย์การตั้งค่า Telegram อื่น ๆ)

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
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
  <Accordion title="บอตไม่ตอบสนองต่อข้อความกลุ่มที่ไม่ mention">

    - หาก `requireMention=false` โหมดความเป็นส่วนตัวของ Telegram ต้องอนุญาตการมองเห็นแบบเต็ม
      - BotFather: `/setprivacy` -> Disable
      - จากนั้นนำบอตออกจากกลุ่มแล้วเพิ่มกลับเข้าไปใหม่
    - `openclaw channels status` จะเตือนเมื่อการตั้งค่าคาดหวังข้อความกลุ่มที่ไม่ได้ mention
    - `openclaw channels status --probe` สามารถตรวจสอบ ID กลุ่มแบบตัวเลขที่ระบุชัดเจนได้ wildcard `"*"` ไม่สามารถ probe สมาชิกภาพได้
    - ทดสอบ session อย่างรวดเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอตไม่เห็นข้อความกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` กลุ่มต้องอยู่ในรายการ (หรือรวม `"*"`)
    - ตรวจสอบสมาชิกภาพของบอตในกลุ่ม
    - ตรวจสอบบันทึก: `openclaw logs --follow` เพื่อดูเหตุผลการข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานบางส่วนหรือไม่ทำงานเลย">

    - อนุญาตตัวตนผู้ส่งของคุณ (การจับคู่และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังคงมีผลแม้นโยบายกลุ่มจะเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู native มีรายการมากเกินไป ลดจำนวนคำสั่ง Plugin/skill/custom หรือปิดใช้งานเมนู native
    - การเรียกตอนเริ่มต้น `deleteMyCommands` / `setMyCommands` และการเรียกการพิมพ์ `sendChatAction` มีขอบเขตและลองใหม่หนึ่งครั้งผ่าน fallback ทรานสปอร์ตของ Telegram เมื่อคำขอ timeout ข้อผิดพลาดเครือข่าย/fetch ที่คงอยู่มักชี้ไปที่ปัญหาการเข้าถึง DNS/HTTPS ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="การเริ่มต้นรายงาน token ไม่ได้รับอนุญาต">

    - `getMe returned 401` คือความล้มเหลวการยืนยันตัวตนของ Telegram สำหรับ token บอตที่กำหนดค่าไว้
    - คัดลอกซ้ำหรือสร้าง token บอตใหม่ใน BotFather แล้วอัปเดต `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` หรือ `TELEGRAM_BOT_TOKEN` สำหรับบัญชีเริ่มต้น
    - `deleteWebhook 401 Unauthorized` ระหว่างเริ่มต้นก็เป็นความล้มเหลวด้าน auth เช่นกัน การถือว่าสิ่งนี้เป็น "ไม่มี webhook อยู่" จะเพียงเลื่อนความล้มเหลวจาก token ที่ไม่ถูกต้องเดิมไปยังการเรียก API ภายหลังเท่านั้น

  </Accordion>

  <Accordion title="ความไม่เสถียรของ polling หรือเครือข่าย">

    - Node 22+ พร้อม custom fetch/proxy อาจทำให้เกิดพฤติกรรม abort ทันทีหากชนิด AbortSignal ไม่ตรงกัน
    - โฮสต์บางราย resolve `api.telegram.org` เป็น IPv6 ก่อน; egress IPv6 ที่เสียอาจทำให้ Telegram API ล้มเหลวเป็นระยะ
    - หากบันทึกมี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!` ตอนนี้ OpenClaw จะลองใหม่กับรายการเหล่านี้ในฐานะข้อผิดพลาดเครือข่ายที่กู้คืนได้
    - ระหว่างการเริ่มต้น polling OpenClaw จะใช้ probe `getMe` จากการเริ่มต้นที่สำเร็จซ้ำสำหรับ grammY เพื่อให้ runner ไม่ต้องใช้ `getMe` ครั้งที่สองก่อน `getUpdates` ครั้งแรก
    - หาก `deleteWebhook` ล้มเหลวด้วยข้อผิดพลาดเครือข่ายชั่วคราวระหว่างการเริ่มต้น polling OpenClaw จะดำเนินต่อไปยัง long polling แทนการเรียก control-plane ก่อน poll อีกครั้ง webhook ที่ยังทำงานอยู่จะแสดงเป็นความขัดแย้งของ `getUpdates`; จากนั้น OpenClaw จะสร้างทรานสปอร์ต Telegram ใหม่และลองล้าง webhook อีกครั้ง
    - หาก socket ของ Telegram ถูก recycle ตามรอบเวลาคงที่สั้น ๆ ให้ตรวจสอบ `channels.telegram.timeoutSeconds` ที่ต่ำ ไคลเอนต์บอตจะจำกัดค่าที่กำหนดไว้ให้ต่ำกว่าตัวป้องกันคำขอขาออกและ `getUpdates` แต่รุ่นเก่าอาจ abort ทุก poll หรือทุกคำตอบเมื่อค่านี้ถูกตั้งต่ำกว่าตัวป้องกันเหล่านั้น
    - หากบันทึกมี `Polling stall detected` OpenClaw จะรีสตาร์ท polling และสร้างทรานสปอร์ต Telegram ใหม่หลังจากไม่มี liveness ของ long-poll ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีโดยค่าเริ่มต้น
    - `openclaw channels status --probe` และ `openclaw doctor` จะเตือนเมื่อบัญชี polling ที่กำลังทำงานยังไม่เสร็จสิ้น `getUpdates` หลังช่วงผ่อนผันการเริ่มต้น เมื่อบัญชี webhook ที่กำลังทำงานยังไม่เสร็จสิ้น `setWebhook` หลังช่วงผ่อนผันการเริ่มต้น หรือเมื่อกิจกรรมทรานสปอร์ต polling ที่สำเร็จล่าสุดล้าสมัย
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่รันนานยังปกติ แต่โฮสต์ของคุณยังรายงานการรีสตาร์ท polling-stall ที่เป็น false อยู่ การ stall ที่คงอยู่มักชี้ไปที่ปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่างโฮสต์กับ `api.telegram.org`
    - Telegram ยังเคารพ env proxy ของ process สำหรับทรานสปอร์ต Bot API รวมถึง `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และตัวแปรชื่อเดียวกันแบบตัวพิมพ์เล็ก `NO_PROXY` / `no_proxy` ยังสามารถข้าม `api.telegram.org` ได้
    - หาก proxy ที่ OpenClaw จัดการถูกกำหนดค่าผ่าน `OPENCLAW_PROXY_URL` สำหรับสภาพแวดล้อมบริการ และไม่มี env proxy มาตรฐาน Telegram จะใช้ URL นั้นสำหรับทรานสปอร์ต Bot API ด้วย
    - บนโฮสต์ VPS ที่มี direct egress/TLS ไม่เสถียร ให้ route การเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ ตั้งค่าเริ่มต้นเป็น `autoSelectFamily=true` (ยกเว้น WSL2) ลำดับผลลัพธ์ DNS ของ Telegram จะเคารพ `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER` จากนั้น `channels.telegram.network.dnsResultOrder` จากนั้นค่าเริ่มต้นของโปรเซส เช่น `NODE_OPTIONS=--dns-result-order=ipv4first`; หากไม่มีค่าใดมีผล Node 22+ จะ fallback เป็น `ipv4first`
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนด้วยพฤติกรรมแบบ IPv4 เท่านั้น ให้บังคับการเลือก family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบในช่วง benchmark ของ RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาตอยู่แล้ว
      สำหรับการดาวน์โหลดสื่อของ Telegram ตามค่าเริ่มต้น หาก fake-IP ที่เชื่อถือได้หรือ
      transparent proxy เขียน `api.telegram.org` ใหม่ให้เป็นที่อยู่
      private/internal/special-use อื่นระหว่างการดาวน์โหลดสื่อ คุณสามารถเลือกเปิด
      bypass เฉพาะ Telegram ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - ตัวเลือกเดียวกันนี้มีให้ใช้ต่อบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หาก proxy ของคุณ resolve โฮสต์สื่อของ Telegram เป็น `198.18.x.x` ให้ปิด
      flag อันตรายไว้ก่อน สื่อของ Telegram อนุญาตช่วง benchmark ของ RFC 2544
      อยู่แล้วตามค่าเริ่มต้น

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` ทำให้การป้องกัน SSRF
      สำหรับสื่อของ Telegram อ่อนลง ใช้เฉพาะกับสภาพแวดล้อม proxy ที่ควบคุมโดยผู้ปฏิบัติงานและเชื่อถือได้
      เช่น Clash, Mihomo หรือ Surge fake-IP routing เมื่อสิ่งเหล่านี้
      สังเคราะห์คำตอบแบบ private หรือ special-use นอกช่วง benchmark ของ RFC 2544
      ปิดไว้สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ
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

ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)

## อ้างอิงการกำหนดค่า

อ้างอิงหลัก: [อ้างอิงการกำหนดค่า - Telegram](/th/gateway/config-channels#telegram)

<Accordion title="ฟิลด์ Telegram ที่มีสัญญาณสูง">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; symlinks จะถูกปฏิเสธ)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- ค่าเริ่มต้นของ topic: `groups.<chatId>.topics."*"` ใช้กับ forum topics ที่ไม่ตรงกัน; topic IDs แบบตรงตัวจะ override ค่านี้
- การอนุมัติ exec: `execApprovals`, `accounts.*.execApprovals`
- คำสั่ง/เมนู: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/replies: `replyToMode`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- การจัดรูปแบบ/การส่งมอบ: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- สื่อ/เครือข่าย: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- ราก API แบบกำหนดเอง: `apiRoot` (เฉพาะราก Bot API เท่านั้น; อย่าใส่ `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- การดำเนินการ/ความสามารถ: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- ปฏิกิริยา: `reactionNotifications`, `reactionLevel`
- ข้อผิดพลาด: `errorPolicy`, `errorCooldownMs`
- การเขียน/ประวัติ: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญแบบหลายบัญชี: เมื่อกำหนดค่า account IDs ตั้งแต่สองรายการขึ้นไป ให้ตั้ง `channels.telegram.defaultAccount` (หรือใส่ `channels.telegram.accounts.default`) เพื่อทำให้การ routing ค่าเริ่มต้นชัดเจน มิฉะนั้น OpenClaw จะ fallback ไปยัง account ID ที่ normalize แล้วรายการแรก และ `openclaw doctor` จะแจ้งเตือน บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom` แต่ไม่สืบทอดค่า `accounts.default.*`
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Telegram กับ Gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรม allowlist ของกลุ่มและ topic
  </Card>
  <Card title="การ routing ช่องทาง" icon="route" href="/th/channels/channel-routing">
    route ข้อความขาเข้าไปยัง agents
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการ hardening
  </Card>
  <Card title="การ routing แบบหลาย agent" icon="sitemap" href="/th/concepts/multi-agent">
    จับคู่กลุ่มและ topics เข้ากับ agents
  </Card>
  <Card title="การแก้ไขปัญหา" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทาง
  </Card>
</CardGroup>
