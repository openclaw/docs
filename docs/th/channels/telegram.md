---
read_when:
    - การทำงานกับฟีเจอร์ Telegram หรือ Webhook
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของบอต Telegram
title: Telegram
x-i18n:
    generated_at: "2026-06-30T14:28:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e143096bbcdf949ef11566ffe2a5360eea261cd5bf99f0cf90d31c8e9d4637d6
    source_path: channels/telegram.md
    workflow: 16
---

พร้อมใช้งานระดับโปรดักชันสำหรับ DM และกลุ่มของบอตผ่าน grammY การโพลแบบยาวเป็นโหมดเริ่มต้น ส่วนโหมด Webhook เป็นตัวเลือกเสริม

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
    เปิด Telegram และแชทกับ **@BotFather** (ยืนยันว่าแฮนเดิลเป็น `@BotFather` ตรงทุกตัว)

    รัน `/newbot` ทำตามพรอมต์ และบันทึกโทเค็นไว้

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

    ค่าถอยกลับจาก env: `TELEGRAM_BOT_TOKEN=...` (เฉพาะบัญชีเริ่มต้น)
    Telegram **ไม่** ใช้ `openclaw channels login telegram`; ให้กำหนดค่าโทเค็นใน config/env แล้วเริ่ม Gateway

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
    เพิ่มบอตลงในกลุ่มของคุณ จากนั้นรับ ID ทั้งสองรายการที่การเข้าถึงกลุ่มต้องใช้:

    - ID ผู้ใช้ Telegram ของคุณ ใช้ใน `allowFrom` / `groupAllowFrom`
    - ID แชทกลุ่ม Telegram ใช้เป็นคีย์ภายใต้ `channels.telegram.groups`

    สำหรับการตั้งค่าครั้งแรก ให้รับ ID แชทกลุ่มจาก `openclaw logs --follow`, บอต forwarded-ID หรือ Bot API `getUpdates` หลังจากอนุญาตกลุ่มแล้ว `/whoami@<bot_username>` สามารถยืนยัน ID ผู้ใช้และกลุ่มได้

    ID ซูเปอร์กรุ๊ป Telegram แบบลบที่ขึ้นต้นด้วย `-100` คือ ID แชทกลุ่ม ให้ใส่ไว้ภายใต้ `channels.telegram.groups` ไม่ใช่ภายใต้ `groupAllowFrom`

  </Step>
</Steps>

<Note>
ลำดับการแก้ไขโทเค็นคำนึงถึงบัญชี ในทางปฏิบัติ ค่า config จะชนะค่าถอยกลับจาก env และ `TELEGRAM_BOT_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
หลังจากเริ่มต้นสำเร็จ OpenClaw จะแคชตัวตนของบอตไว้ในไดเรกทอรีสถานะได้นานสูงสุด 24 ชั่วโมง เพื่อให้การรีสตาร์ตหลีกเลี่ยงการเรียก Telegram `getMe` เพิ่มเติมได้ การเปลี่ยนหรือลบโทเค็นจะล้างแคชนั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="โหมดความเป็นส่วนตัวและการมองเห็นในกลุ่ม">
    บอต Telegram มีค่าเริ่มต้นเป็น **โหมดความเป็นส่วนตัว** ซึ่งจำกัดข้อความกลุ่มที่บอตได้รับ

    หากบอตต้องเห็นข้อความกลุ่มทั้งหมด ให้ทำอย่างใดอย่างหนึ่ง:

    - ปิดโหมดความเป็นส่วนตัวผ่าน `/setprivacy` หรือ
    - ทำให้บอตเป็นผู้ดูแลกลุ่ม

    เมื่อสลับโหมดความเป็นส่วนตัว ให้ลบและเพิ่มบอตกลับเข้าไปใหม่ในแต่ละกลุ่มเพื่อให้ Telegram นำการเปลี่ยนแปลงไปใช้

  </Accordion>

  <Accordion title="สิทธิ์ของกลุ่ม">
    สถานะผู้ดูแลถูกควบคุมในการตั้งค่ากลุ่ม Telegram

    บอตผู้ดูแลจะได้รับข้อความกลุ่มทั้งหมด ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มที่ทำงานตลอดเวลา

  </Accordion>

  <Accordion title="ตัวสลับ BotFather ที่มีประโยชน์">

    - `/setjoingroups` เพื่ออนุญาต/ปฏิเสธการเพิ่มลงกลุ่ม
    - `/setprivacy` สำหรับพฤติกรรมการมองเห็นในกลุ่ม

  </Accordion>
</AccordionGroup>

## การควบคุมการเข้าถึงและการเปิดใช้งาน

### ตัวตนบอตในกลุ่ม

ในกลุ่มและหัวข้อฟอรัมของ Telegram การกล่าวถึงแฮนเดิลบอตที่กำหนดค่าไว้อย่างชัดเจน (เช่น `@my_bot`) จะถูกมองว่าเป็นการระบุถึงเอเจนต์ OpenClaw ที่เลือก แม้ชื่อบุคลิกของเอเจนต์จะแตกต่างจากชื่อผู้ใช้ Telegram ก็ตาม นโยบายปิดเสียงกลุ่มยังคงใช้กับทราฟฟิกกลุ่มที่ไม่เกี่ยวข้อง แต่แฮนเดิลบอตเองจะไม่ถือว่าเป็น "คนอื่น"

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.telegram.dmPolicy` ควบคุมการเข้าถึงข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist` (ต้องมี ID ผู้ส่งอย่างน้อยหนึ่งรายการใน `allowFrom`)
    - `open` (ต้องให้ `allowFrom` รวม `"*"`)
    - `disabled`

    `dmPolicy: "open"` พร้อม `allowFrom: ["*"]` อนุญาตให้บัญชี Telegram ใดก็ตามที่ค้นพบหรือเดาชื่อผู้ใช้บอตได้สั่งงานบอต ใช้เฉพาะกับบอตสาธารณะที่ตั้งใจเปิดให้ใช้และมีการจำกัดเครื่องมืออย่างเข้มงวดเท่านั้น บอตเจ้าของเดียวควรใช้ `allowlist` พร้อม ID ผู้ใช้แบบตัวเลข

    `channels.telegram.allowFrom` รับ ID ผู้ใช้ Telegram แบบตัวเลข รองรับและปรับรูปแบบคำนำหน้า `telegram:` / `tg:`
    ใน config หลายบัญชี `channels.telegram.allowFrom` ระดับบนสุดที่เข้มงวดจะถูกมองเป็นขอบเขตความปลอดภัย: รายการ `allowFrom: ["*"]` ระดับบัญชีจะไม่ทำให้บัญชีนั้นเป็นสาธารณะ เว้นแต่ allowlist ที่มีผลจริงของบัญชียังคงมี wildcard อย่างชัดเจนหลังจากรวมแล้ว
    `dmPolicy: "allowlist"` พร้อม `allowFrom` ว่างจะบล็อก DM ทั้งหมดและถูกปฏิเสธโดยการตรวจสอบ config
    การตั้งค่าจะถามหาเฉพาะ ID ผู้ใช้แบบตัวเลข
    หากคุณอัปเกรดแล้ว config ของคุณมีรายการ allowlist แบบ `@username` ให้รัน `openclaw doctor --fix` เพื่อแก้ไขรายการเหล่านั้น (ทำแบบ best-effort; ต้องใช้โทเค็นบอต Telegram)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์ allowlist ของ pairing-store, `openclaw doctor --fix` สามารถกู้คืนรายการเข้าไปยัง `channels.telegram.allowFrom` ในโฟลว์ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID ที่ระบุอย่างชัดเจน)

    สำหรับบอตเจ้าของเดียว แนะนำให้ใช้ `dmPolicy: "allowlist"` พร้อม ID `allowFrom` แบบตัวเลขที่ระบุชัดเจน เพื่อให้นโยบายการเข้าถึงคงทนอยู่ใน config (แทนการพึ่งพาการอนุมัติการจับคู่ก่อนหน้า)

    ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่ได้หมายความว่า "ผู้ส่งนี้ได้รับอนุญาตทุกที่"
    การจับคู่ให้สิทธิ์เข้าถึง DM หากยังไม่มีเจ้าของคำสั่ง การจับคู่ที่อนุมัติครั้งแรกจะตั้งค่า `commands.ownerAllowFrom` ด้วย เพื่อให้คำสั่งเฉพาะเจ้าของและการอนุมัติ exec มีบัญชีผู้ปฏิบัติงานที่ชัดเจน
    การอนุญาตผู้ส่งในกลุ่มยังมาจาก allowlist ที่กำหนดค่าอย่างชัดเจน
    หากคุณต้องการ "ฉันได้รับอนุญาตครั้งเดียว แล้วทั้ง DM และคำสั่งกลุ่มทำงานได้" ให้ใส่ ID ผู้ใช้ Telegram แบบตัวเลขของคุณใน `channels.telegram.allowFrom`; สำหรับคำสั่งเฉพาะเจ้าของ ตรวจสอบให้แน่ใจว่า `commands.ownerAllowFrom` มี `telegram:<your user id>`

    ### การหา ID ผู้ใช้ Telegram ของคุณ

    ปลอดภัยกว่า (ไม่มีบอตบุคคลที่สาม):

    1. ส่ง DM ไปยังบอตของคุณ
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
         - พร้อม `groupPolicy: "open"`: กลุ่มใดก็ผ่านการตรวจ ID กลุ่มได้
         - พร้อม `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการ `groups` (หรือ `"*"`)
       - กำหนดค่า `groups` แล้ว: ทำหน้าที่เป็น allowlist (ID ที่ระบุชัดเจนหรือ `"*"`)

    2. **ผู้ส่งใดได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่า Telegram จะถอยกลับไปใช้ `allowFrom`
    รายการ `groupAllowFrom` ควรเป็น ID ผู้ใช้ Telegram แบบตัวเลข (คำนำหน้า `telegram:` / `tg:` จะถูกปรับรูปแบบ)
    อย่าใส่ ID แชทกลุ่มหรือซูเปอร์กรุ๊ป Telegram ใน `groupAllowFrom` ID แชทแบบลบอยู่ภายใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเว้นสำหรับการอนุญาตผู้ส่ง
    ขอบเขตความปลอดภัย (`2026.2.25+`): การยืนยันสิทธิ์ผู้ส่งในกลุ่ม **ไม่** สืบทอดการอนุมัติจาก pairing-store ของ DM
    การจับคู่ยังคงเป็นของ DM เท่านั้น สำหรับกลุ่ม ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` ต่อกลุ่ม/ต่อหัวข้อ
    หากไม่ได้ตั้งค่า `groupAllowFrom` Telegram จะถอยกลับไปใช้ config `allowFrom` ไม่ใช่ pairing store
    รูปแบบที่ใช้งานได้จริงสำหรับบอตเจ้าของเดียว: ตั้งค่า ID ผู้ใช้ของคุณใน `channels.telegram.allowFrom`, ปล่อย `groupAllowFrom` ไว้ไม่ต้องตั้งค่า และอนุญาตกลุ่มเป้าหมายภายใต้ `channels.telegram.groups`
    หมายเหตุ runtime: หาก `channels.telegram` ขาดหายไปทั้งหมด runtime จะมีค่าเริ่มต้นแบบปิดเมื่อไม่ผ่านเป็น `groupPolicy="allowlist"` เว้นแต่จะตั้งค่า `channels.defaults.groupPolicy` อย่างชัดเจน

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

    ทดสอบจากกลุ่มด้วย `@<bot_username> ping` ข้อความกลุ่มธรรมดาจะไม่ทริกเกอร์บอตขณะที่ `requireMention: true`

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
      ข้อผิดพลาดที่พบบ่อย: `groupAllowFrom` ไม่ใช่ allowlist กลุ่ม Telegram

      - ใส่ ID แชทกลุ่มหรือซูเปอร์กรุ๊ป Telegram แบบลบ เช่น `-1001234567890` ภายใต้ `channels.telegram.groups`
      - ใส่ ID ผู้ใช้ Telegram เช่น `8734062810` ภายใต้ `groupAllowFrom` เมื่อคุณต้องการจำกัดว่าคนใดในกลุ่มที่ได้รับอนุญาตสามารถทริกเกอร์บอตได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกใดก็ได้ของกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอตได้

    </Warning>

  </Tab>

  <Tab title="พฤติกรรมการกล่าวถึง">
    การตอบกลับในกลุ่มต้องมีการกล่าวถึงตามค่าเริ่มต้น

    การกล่าวถึงอาจมาจาก:

    - การกล่าวถึงแบบเนทีฟ `@botusername` หรือ
    - รูปแบบการกล่าวถึงใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    ตัวสลับคำสั่งระดับเซสชัน:

    - `/activation always`
    - `/activation mention`

    รายการเหล่านี้อัปเดตเฉพาะสถานะเซสชัน ใช้ config เพื่อให้คงอยู่ถาวร

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

    คอนเท็กซ์ประวัติกลุ่มมีค่าเริ่มต้นเป็น `mention-only`: ข้อความกลุ่มก่อนหน้า
    จะถูกรวมเฉพาะเมื่อข้อความเหล่านั้นถูกส่งถึงบอต เป็นการตอบกลับบอต
    หรือเป็นข้อความของบอตเอง ตั้งค่า `includeGroupHistoryContext: "recent"` เพื่อ
    รวมประวัติห้องล่าสุดสำหรับกลุ่มที่เชื่อถือ ตั้งค่า
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

    การรับ ID แชทกลุ่ม:

    - ส่งต่อข้อความกลุ่มไปยัง `@userinfobot` / `@getidsbot`
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจสอบ Bot API `getUpdates`
    - หลังจากกลุ่มได้รับอนุญาตแล้ว ให้รัน `/whoami@<bot_username>` หากเปิดใช้คำสั่งเนทีฟ

  </Tab>
</Tabs>

## พฤติกรรม runtime

- Telegram เป็นของกระบวนการ gateway
- การกำหนดเส้นทางเป็นแบบกำหนดแน่นอน: ข้อความขาเข้าจาก Telegram จะตอบกลับไปยัง Telegram (โมเดลไม่ได้เลือกช่องทาง)
- ข้อความขาเข้าจะถูกทำให้เป็นมาตรฐานในซองช่องทางร่วม พร้อมเมตาดาตาการตอบกลับ ตัวยึดตำแหน่งสื่อ และบริบทห่วงโซ่การตอบกลับที่คงอยู่สำหรับการตอบกลับ Telegram ที่ gateway สังเกตพบ
- เซสชันกลุ่มจะแยกตาม ID กลุ่ม หัวข้อฟอรัมจะต่อท้าย `:topic:<threadId>` เพื่อแยกหัวข้อออกจากกัน
- ข้อความ DM สามารถมี `message_thread_id`; OpenClaw จะรักษาค่านี้ไว้สำหรับการตอบกลับ เซสชันหัวข้อ DM จะแยกเฉพาะเมื่อ Telegram `getMe` รายงาน `has_topics_enabled: true` สำหรับบอทเท่านั้น มิฉะนั้น DM จะยังอยู่ในเซสชันแบบแบน
- Long polling ใช้ grammY runner พร้อมการจัดลำดับต่อแชต/ต่อเธรด การทำงานพร้อมกันของ runner sink โดยรวมใช้ `agents.defaults.maxConcurrent`
- การเริ่มต้นหลายบัญชีจำกัดการ probe Telegram `getMe` ที่ทำพร้อมกัน เพื่อให้ fleet บอทขนาดใหญ่ไม่ fan out การ probe ทุกบัญชีพร้อมกัน
- Long polling ถูกป้องกันภายในแต่ละกระบวนการ gateway เพื่อให้มี poller ที่ใช้งานอยู่เพียงตัวเดียวใช้ bot token ได้ในแต่ละครั้ง หากคุณยังเห็นข้อขัดแย้ง `getUpdates` 409 แสดงว่า gateway OpenClaw อื่น สคริปต์ หรือ poller ภายนอกน่าจะใช้ token เดียวกันอยู่
- การรีสตาร์ตจาก watchdog ของ long-polling จะทริกเกอร์หลังจากไม่มี liveness ของ `getUpdates` ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีตามค่าเริ่มต้น เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการปรับใช้ของคุณยังเห็นการรีสตาร์ต polling-stall ที่ผิดพลาดระหว่างงานที่ใช้เวลานาน ค่านี้มีหน่วยเป็นมิลลิวินาที และอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับการ override ต่อบัญชี
- Telegram Bot API ไม่รองรับ read-receipt (`sendReadReceipts` ใช้ไม่ได้)

<Note>
  `channels.telegram.dm.threadReplies` และ `channels.telegram.direct.<chatId>.threadReplies` ถูกลบแล้ว เรียกใช้ `openclaw doctor --fix` หลังอัปเกรดหาก config ของคุณยังมี key เหล่านั้น การกำหนดเส้นทางหัวข้อ DM ตอนนี้ตามความสามารถของบอทจาก Telegram `getMe.has_topics_enabled` ซึ่งควบคุมโดยโหมด threaded ของ BotFather: บอทที่เปิดใช้ topics จะใช้เซสชัน DM ตามเธรดเมื่อ Telegram ส่ง `message_thread_id`; DM อื่นจะยังอยู่ในเซสชันแบบแบน
</Note>

## อ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="ตัวอย่าง live stream (การแก้ไขข้อความ)">
    OpenClaw สามารถสตรีมการตอบกลับบางส่วนแบบเรียลไทม์ได้:

    - แชตโดยตรง: ข้อความตัวอย่าง + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความตัวอย่าง + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` คือ `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - ตัวอย่างคำตอบเริ่มต้นสั้น ๆ จะถูก debounce แล้ว materialize หลังจากความล่าช้าที่มีขอบเขต หาก run ยังทำงานอยู่
    - `progress` จะเก็บ draft สถานะที่แก้ไขได้หนึ่งรายการสำหรับความคืบหน้าของเครื่องมือ แสดงป้ายสถานะที่เสถียรเมื่อมีกิจกรรมคำตอบเข้ามาก่อนความคืบหน้าของเครื่องมือ ล้างเมื่อเสร็จสิ้น และส่งคำตอบสุดท้ายเป็นข้อความปกติ
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความตัวอย่างที่แก้ไขเดิมซ้ำหรือไม่ (ค่าเริ่มต้น: `true` เมื่อการสตรีมตัวอย่างเปิดใช้งานอยู่)
    - `streaming.preview.commandText` ควบคุมรายละเอียด command/exec ภายในบรรทัด tool-progress เหล่านั้น: `raw` (ค่าเริ่มต้น รักษาพฤติกรรมที่เผยแพร่แล้ว) หรือ `status` (เฉพาะป้ายเครื่องมือ)
    - `streaming.progress.commentary` (ค่าเริ่มต้น: `false`) เลือกใช้ข้อความ commentary/preamble ของ assistant ใน draft ความคืบหน้าชั่วคราว
    - ตรวจพบ `channels.telegram.streamMode` แบบเก่า ค่า `streaming` แบบ boolean และ key ตัวอย่าง native draft ที่เลิกใช้แล้ว; เรียกใช้ `openclaw doctor --fix` เพื่อย้ายค่าเหล่านี้ไปยัง config การสตรีมปัจจุบัน

    การอัปเดตตัวอย่าง tool-progress คือบรรทัดสถานะสั้น ๆ ที่แสดงขณะเครื่องมือทำงาน เช่น การรันคำสั่ง การอ่านไฟล์ การอัปเดตแผน สรุป patch หรือข้อความ preamble/commentary ของ Codex ในโหมด Codex app-server Telegram เปิดใช้สิ่งเหล่านี้ตามค่าเริ่มต้นเพื่อให้ตรงกับพฤติกรรม OpenClaw ที่เผยแพร่ตั้งแต่ `v2026.4.22` เป็นต้นไป

    หากต้องการคงตัวอย่างที่แก้ไขสำหรับข้อความคำตอบ แต่ซ่อนบรรทัด tool-progress ให้ตั้งค่า:

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

    หากต้องการให้ tool-progress มองเห็นได้ แต่ซ่อนข้อความ command/exec ให้ตั้งค่า:

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

    ใช้โหมด `progress` เมื่อคุณต้องการความคืบหน้าของเครื่องมือที่มองเห็นได้โดยไม่แก้ไขคำตอบสุดท้ายเข้าไปในข้อความเดียวกันนั้น วางนโยบาย command-text ไว้ใต้ `streaming.progress`:

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

    ใช้ `streaming.mode: "off"` เฉพาะเมื่อคุณต้องการส่งเฉพาะผลลัพธ์สุดท้าย: การแก้ไขตัวอย่างของ Telegram จะถูกปิดใช้งาน และข้อความทั่วไปเกี่ยวกับเครื่องมือ/ความคืบหน้าจะถูกระงับแทนที่จะส่งเป็นข้อความสถานะแยกต่างหาก prompt การอนุมัติ payload สื่อ และข้อผิดพลาดยังคงกำหนดเส้นทางผ่านการส่งสุดท้ายตามปกติ ใช้ `streaming.preview.toolProgress: false` เมื่อคุณต้องการเก็บเฉพาะการแก้ไขตัวอย่างคำตอบ พร้อมซ่อนบรรทัดสถานะ tool-progress

    <Note>
      การตอบกลับ quote ที่เลือกใน Telegram เป็นข้อยกเว้น เมื่อ `replyToMode` เป็น `"first"`, `"all"` หรือ `"batched"` และข้อความขาเข้ามีข้อความ quote ที่เลือกไว้ OpenClaw จะส่งคำตอบสุดท้ายผ่านเส้นทาง quote-reply แบบ native ของ Telegram แทนการแก้ไขตัวอย่างคำตอบ ดังนั้น `streaming.preview.toolProgress` จึงไม่สามารถแสดงบรรทัดสถานะสั้น ๆ สำหรับ turn นั้นได้ การตอบกลับข้อความปัจจุบันที่ไม่มีข้อความ quote ที่เลือกไว้ยังคงใช้การสตรีมตัวอย่าง ตั้งค่า `replyToMode: "off"` เมื่อการมองเห็น tool-progress สำคัญกว่า native quote replies หรือตั้งค่า `streaming.preview.toolProgress: false` เพื่อยอมรับ trade-off นี้
    </Note>

    สำหรับการตอบกลับแบบข้อความเท่านั้น:

    - ตัวอย่าง DM/กลุ่ม/หัวข้อแบบสั้น: OpenClaw เก็บข้อความตัวอย่างเดิมไว้และทำการแก้ไขสุดท้ายในที่เดิม
    - ข้อความสุดท้ายแบบยาวที่แยกเป็นหลายข้อความ Telegram จะใช้ตัวอย่างที่มีอยู่ซ้ำเป็น chunk สุดท้ายแรกเมื่อเป็นไปได้ จากนั้นส่งเฉพาะ chunk ที่เหลือ
    - ผลลัพธ์สุดท้ายในโหมด progress จะล้าง draft สถานะและใช้การส่งสุดท้ายตามปกติแทนการแก้ไข draft ให้เป็นคำตอบ
    - หากการแก้ไขสุดท้ายล้มเหลวก่อนยืนยันข้อความที่เสร็จสมบูรณ์ OpenClaw จะใช้การส่งสุดท้ายตามปกติและล้างตัวอย่างเก่า

    สำหรับการตอบกลับที่ซับซ้อน (เช่น payload สื่อ) OpenClaw จะ fallback ไปยังการส่งสุดท้ายตามปกติแล้วล้างข้อความตัวอย่าง

    การสตรีมตัวอย่างแยกจาก block streaming เมื่อเปิดใช้ block streaming อย่างชัดเจนสำหรับ Telegram OpenClaw จะข้าม stream ตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

    พฤติกรรมของ reasoning stream:

    - `/reasoning stream` ใช้เส้นทาง reasoning-preview ของช่องทางที่รองรับ; บน Telegram จะสตรีม reasoning ลงในตัวอย่างสดขณะสร้าง
    - ตัวอย่าง reasoning จะถูกลบหลังการส่งสุดท้าย; ใช้ `/reasoning on` เมื่อควรให้ reasoning ยังคงมองเห็นได้
    - คำตอบสุดท้ายถูกส่งโดยไม่มีข้อความ reasoning

  </Accordion>

  <Accordion title="การจัดรูปแบบข้อความแบบ rich">
    ข้อความขาออกใช้ข้อความ Telegram HTML มาตรฐานตามค่าเริ่มต้น เพื่อให้การตอบกลับยังอ่านได้ในไคลเอนต์ Telegram ปัจจุบัน โหมดความเข้ากันได้นี้รองรับตัวหนา ตัวเอียง ลิงก์ โค้ด spoiler และ quote ปกติ แต่ไม่รองรับบล็อกเฉพาะ rich ของ Bot API 10.1 เช่น ตาราง native, details, rich media และสูตร

    ตั้งค่า `channels.telegram.richMessages: true` เพื่อเลือกใช้ข้อความ rich ของ Bot API 10.1:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    เมื่อเปิดใช้:

    - agent จะได้รับแจ้งว่าข้อความ rich ของ Telegram พร้อมใช้งานสำหรับบอท/บัญชีนี้
    - ข้อความ Markdown จะถูก render ผ่าน Markdown IR ของ OpenClaw และส่งเป็น Telegram rich HTML
    - payload rich HTML แบบชัดเจนจะรักษาแท็ก Bot API 10.1 ที่รองรับ เช่น headings, tables, details, rich media และ formulas
    - คำบรรยายสื่อยังคงใช้ Telegram HTML captions เพราะข้อความ rich ไม่ได้แทนที่ captions

    วิธีนี้ทำให้ข้อความโมเดลไม่ปะปนกับ sigil ของ Telegram Rich Markdown ดังนั้นสกุลเงินอย่าง `$400-600K` จะไม่ถูก parse เป็นคณิตศาสตร์ ข้อความ rich ที่ยาวจะถูกแบ่งโดยอัตโนมัติตามขีดจำกัด rich text และ rich block ของ Telegram ตารางที่เกินขีดจำกัดคอลัมน์ของ Telegram จะถูกส่งเป็น code blocks

    ค่าเริ่มต้น: ปิดเพื่อความเข้ากันได้ของไคลเอนต์ ข้อความ rich ต้องใช้ไคลเอนต์ Telegram ที่เข้ากันได้; ไคลเอนต์ Desktop, Web, Android และไคลเอนต์ third-party ปัจจุบันบางตัวแสดงข้อความ rich ที่ยอมรับแล้วว่าไม่รองรับ ปิดตัวเลือกนี้ไว้ เว้นแต่ทุกไคลเอนต์ที่ใช้กับบอทจะ render ได้ `/status` แสดงว่าเซสชัน Telegram ปัจจุบันเปิดหรือปิดข้อความ rich อยู่

    Link preview เปิดใช้ตามค่าเริ่มต้น `channels.telegram.linkPreview: false` จะข้ามการตรวจจับ entity อัตโนมัติสำหรับ rich text

  </Accordion>

  <Accordion title="คำสั่ง native และคำสั่งกำหนดเอง">
    การลงทะเบียนเมนูคำสั่ง Telegram จัดการตอนเริ่มต้นด้วย `setMyCommands`

    ค่าเริ่มต้นของคำสั่ง native:

    - `commands.native: "auto"` เปิดใช้คำสั่ง native สำหรับ Telegram

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

    - ชื่อจะถูกทำให้เป็นมาตรฐาน (ตัด `/` นำหน้าออก, ใช้ตัวพิมพ์เล็ก)
    - รูปแบบที่ถูกต้อง: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งกำหนดเองไม่สามารถ override คำสั่ง native ได้
    - ความขัดแย้ง/รายการซ้ำจะถูกข้ามและบันทึก log

    หมายเหตุ:

    - คำสั่งกำหนดเองเป็นเพียงรายการเมนูเท่านั้น; ไม่ได้ implement พฤติกรรมโดยอัตโนมัติ
    - คำสั่ง plugin/skill ยังคงทำงานได้เมื่อพิมพ์ แม้จะไม่แสดงในเมนู Telegram

    หากปิดใช้คำสั่ง native รายการ built-in จะถูกลบ Custom/plugin commands อาจยังลงทะเบียนได้หากกำหนดค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังล้นหลังจากตัดทอนแล้ว; ลดคำสั่ง plugin/skill/custom หรือปิดใช้ `channels.telegram.commands.native`
    - `deleteWebhook`, `deleteMyCommands` หรือ `setMyCommands` ล้มเหลวพร้อม `404: Not Found` ขณะที่คำสั่ง curl ของ Bot API โดยตรงทำงานได้ อาจหมายความว่า `channels.telegram.apiRoot` ถูกตั้งเป็น endpoint เต็ม `/bot<TOKEN>` ต้องให้ `apiRoot` เป็นเฉพาะ root ของ Bot API เท่านั้น และ `openclaw doctor --fix` จะลบ `/bot<TOKEN>` ต่อท้ายโดยไม่ตั้งใจ
    - `getMe returned 401` หมายความว่า Telegram ปฏิเสธ bot token ที่กำหนดค่าไว้ อัปเดต `botToken`, `tokenFile` หรือ `TELEGRAM_BOT_TOKEN` ด้วย token BotFather ปัจจุบัน; OpenClaw จะหยุดก่อน polling ดังนั้นจึงไม่ถูกรายงานเป็นความล้มเหลวในการ cleanup webhook
    - `setMyCommands failed` พร้อมข้อผิดพลาด network/fetch มักหมายความว่า outbound DNS/HTTPS ไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งจับคู่อุปกรณ์ (`device-pair` plugin)

    เมื่อมีการติดตั้ง `device-pair` plugin:

    1. `/pair` สร้างโค้ดตั้งค่า
    2. วางโค้ดในแอป iOS
    3. `/pair pending` แสดงรายการคำขอที่รอดำเนินการ (รวมถึง role/scopes)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบระบุชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    โค้ดตั้งค่ามี bootstrap token อายุสั้น bootstrap ด้วย setup-code ในตัวเป็นแบบ node-only: การเชื่อมต่อครั้งแรกจะสร้างคำขอ node ที่รอดำเนินการ และหลังอนุมัติ Gateway จะคืน node token ที่คงทนพร้อม `scopes: []` ไม่ได้คืน operator token ที่ส่งต่อมา; การเข้าถึงของ operator ต้องใช้การจับคู่ operator ที่อนุมัติแยกต่างหากหรือ token flow

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

    `capabilities: ["inlineButtons"]` แบบเดิมจะแมปเป็น `inlineButtons: "all"`

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

    ปุ่ม `web_app` ของ Telegram ใช้งานได้เฉพาะในแชตส่วนตัวระหว่างผู้ใช้กับ
    บอตเท่านั้น

    การคลิก Callback จะถูกส่งต่อไปยังเอเจนต์เป็นข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="การดำเนินการกับข้อความ Telegram สำหรับเอเจนต์และระบบอัตโนมัติ">
    การดำเนินการของเครื่องมือ Telegram ประกอบด้วย:

    - `sendMessage` (`to`, `content`, ตัวเลือก `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` หรือ `caption`, ปุ่มอินไลน์ `presentation` แบบไม่บังคับ; การแก้ไขเฉพาะปุ่มจะอัปเดตมาร์กอัปของการตอบกลับ)
    - `createForumTopic` (`chatId`, `name`, ตัวเลือก `iconColor`, `iconCustomEmojiId`)

    การดำเนินการกับข้อความของช่องทางเปิดเผยนามแฝงที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    ตัวควบคุมการเปิดใช้:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้งาน)

    หมายเหตุ: ปัจจุบัน `edit` และ `topic-create` เปิดใช้งานตามค่าเริ่มต้นและไม่มีตัวสลับ `channels.telegram.actions.*` แยกต่างหาก
    การส่งขณะรันไทม์ใช้สแนปชอต config/secret ที่ใช้งานอยู่ (ตอนเริ่มต้น/โหลดซ้ำ) ดังนั้นเส้นทางการดำเนินการจึงไม่ทำการ resolve SecretRef ใหม่แบบเฉพาะกิจในแต่ละครั้งที่ส่ง

    ความหมายของการลบรีแอ็กชัน: [/tools/reactions](/th/tools/reactions)

  </Accordion>

  <Accordion title="แท็กเธรดการตอบกลับ">
    Telegram รองรับแท็กเธรดการตอบกลับแบบชัดเจนในเอาต์พุตที่สร้างขึ้น:

    - `[[reply_to_current]]` ตอบกลับข้อความที่เรียกใช้งาน
    - `[[reply_to:<id>]]` ตอบกลับ ID ข้อความ Telegram ที่ระบุ

    `channels.telegram.replyToMode` ควบคุมการจัดการ:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`

    เมื่อเปิดใช้เธรดการตอบกลับและมีข้อความหรือคำบรรยายต้นฉบับของ Telegram พร้อมใช้งาน OpenClaw จะรวมข้อความอ้างอิงแบบเนทีฟของ Telegram โดยอัตโนมัติ Telegram จำกัดข้อความอ้างอิงแบบเนทีฟไว้ที่ 1024 หน่วยรหัส UTF-16 ดังนั้นข้อความที่ยาวกว่าจะถูกอ้างอิงตั้งแต่ต้นและย้อนกลับไปใช้การตอบกลับแบบธรรมดาหาก Telegram ปฏิเสธข้อความอ้างอิง

    หมายเหตุ: `off` จะปิดใช้งานเธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงถูกใช้งาน

  </Accordion>

  <Accordion title="หัวข้อฟอรัมและพฤติกรรมของเธรด">
    ซูเปอร์กรุ๊ปแบบฟอรัม:

    - คีย์เซสชันหัวข้อจะต่อท้ายด้วย `:topic:<threadId>`
    - การตอบกลับและสถานะกำลังพิมพ์จะกำหนดเป้าหมายไปยังเธรดของหัวข้อ
    - เส้นทาง config ของหัวข้อ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของหัวข้อทั่วไป (`threadId=1`):

    - การส่งข้อความจะละเว้น `message_thread_id` (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - การดำเนินการกำลังพิมพ์ยังคงรวม `message_thread_id`

    การสืบทอดของหัวข้อ: รายการหัวข้อจะสืบทอดการตั้งค่ากลุ่ม เว้นแต่จะถูกแทนที่ (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` ใช้เฉพาะหัวข้อและไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม
    `topics."*"` ตั้งค่าเริ่มต้นสำหรับทุกหัวข้อในกลุ่มนั้น; ID หัวข้อที่ตรงกันพอดียังคงมีสิทธิ์เหนือกว่า `"*"`

    **การกำหนดเส้นทางเอเจนต์ต่อหัวข้อ**: แต่ละหัวข้อสามารถกำหนดเส้นทางไปยังเอเจนต์คนละตัวได้โดยตั้งค่า `agentId` ใน config ของหัวข้อ สิ่งนี้ทำให้แต่ละหัวข้อมีพื้นที่ทำงาน หน่วยความจำ และเซสชันที่แยกกันของตัวเอง ตัวอย่าง:

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

    **การผูกหัวข้อ ACP แบบคงอยู่**: หัวข้อฟอรัมสามารถปักหมุดเซสชันฮาร์เนส ACP ผ่านการผูก ACP แบบมีชนิดที่ระดับบนสุด (`bindings[]` ที่มี `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ id ที่ระบุหัวข้อ เช่น `-1001234567890:topic:42`) ปัจจุบันจำกัดขอบเขตไว้ที่หัวข้อฟอรัมในกลุ่ม/ซูเปอร์กรุ๊ป ดู [เอเจนต์ ACP](/th/tools/acp-agents)

    **การสร้าง ACP ที่ผูกกับเธรดจากแชต**: `/acp spawn <agent> --thread here|auto` ผูกหัวข้อปัจจุบันกับเซสชัน ACP ใหม่; ข้อความติดตามผลจะถูกกำหนดเส้นทางไปที่นั่นโดยตรง OpenClaw ปักหมุดการยืนยันการสร้างไว้ในหัวข้อ ต้องให้ `channels.telegram.threadBindings.spawnSessions` ยังคงเปิดใช้งานอยู่ (ค่าเริ่มต้น: `true`)

    บริบทเทมเพลตเปิดเผย `MessageThreadId` และ `IsForum` แชต DM ที่มี `message_thread_id` จะเก็บ metadata การตอบกลับไว้; แชตเหล่านั้นใช้คีย์เซสชันที่รับรู้เธรดเฉพาะเมื่อ Telegram `getMe` รายงาน `has_topics_enabled: true` สำหรับบอต
    การแทนที่ `dm.threadReplies` และ `direct.*.threadReplies` เดิมถูกเลิกใช้โดยเจตนา; ใช้โหมดเธรดของ BotFather เป็นแหล่งความจริงเดียวและรัน `openclaw doctor --fix` เพื่อลบคีย์ config ที่ล้าสมัย

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยกความแตกต่างระหว่างบันทึกเสียงกับไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมแบบไฟล์เสียง
    - แท็ก `[[audio_as_voice]]` ในการตอบกลับของเอเจนต์เพื่อบังคับให้ส่งเป็นบันทึกเสียง
    - ข้อความถอดเสียงจากบันทึกเสียงขาเข้าจะถูกจัดกรอบเป็นข้อความที่เครื่องสร้างขึ้น
      และไม่น่าเชื่อถือในบริบทของเอเจนต์; การตรวจจับการกล่าวถึงยังคงใช้ข้อความถอดเสียงดิบ
      ดังนั้นข้อความเสียงที่ต้องมีการกล่าวถึงจึงยังทำงานต่อไป

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

    Telegram แยกไฟล์วิดีโอออกจากโน้ตวิดีโอ

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

    โน้ตวิดีโอไม่รองรับคำบรรยาย ข้อความที่ให้มาจะถูกส่งแยกต่างหาก

    ### สติกเกอร์

    การจัดการสติกเกอร์ขาเข้า:

    - WEBP แบบนิ่ง: ดาวน์โหลดและประมวลผล (placeholder `<media:sticker>`)
    - TGS แบบเคลื่อนไหว: ข้าม
    - WEBM แบบวิดีโอ: ข้าม

    ฟิลด์บริบทของสติกเกอร์:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    คำอธิบายสติกเกอร์จะถูกแคชในสถานะ Plugin ของ OpenClaw SQLite เพื่อลดการเรียกใช้การมองเห็นซ้ำ

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
    รีแอ็กชันของ Telegram จะเข้ามาเป็นอัปเดต `message_reaction` (แยกจาก payload ของข้อความ)

    เมื่อเปิดใช้ OpenClaw จะจัดคิวเหตุการณ์ระบบ เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    การกำหนดค่า:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงรีแอ็กชันของผู้ใช้ต่อข้อความที่บอตส่งเท่านั้น (พยายามให้ดีที่สุดผ่านแคชข้อความที่ส่ง)
    - เหตุการณ์รีแอ็กชันยังคงเคารพการควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ให้ ID เธรดในอัปเดตรีแอ็กชัน
      - กลุ่มที่ไม่ใช่ฟอรัมจะส่งต่อไปยังเซสชันแชตของกลุ่ม
      - กลุ่มฟอรัมจะส่งต่อไปยังเซสชันหัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อต้นทางที่แท้จริง

    `allowed_updates` สำหรับการโพล/Webhook จะรวม `message_reaction` โดยอัตโนมัติ

  </Accordion>

  <Accordion title="รีแอ็กชันตอบรับ">
    `ackReaction` ส่งอีโมจิตอบรับขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า `ackReactionScope` ตัดสินใจว่าอีโมจินั้นจะถูกส่งจริง *เมื่อใด*

    **ลำดับการแก้ค่าอีโมจิ (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - อีโมจิสำรองของตัวตนเอเจนต์ (`agents.list[].identity.emoji` ไม่เช่นนั้นใช้ "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิ Unicode (เช่น "👀")
    - ใช้ `""` เพื่อปิดใช้รีแอ็กชันสำหรับช่องทางหรือบัญชี

    **ขอบเขต (`messages.ackReactionScope`):**

    ผู้ให้บริการ Telegram อ่านขอบเขตจาก `messages.ackReactionScope` (ค่าเริ่มต้น `"group-mentions"`) ปัจจุบันยังไม่มีการแทนที่ในระดับบัญชี Telegram หรือระดับช่องทาง Telegram

    ค่า: `"all"` (DM + กลุ่ม), `"direct"` (เฉพาะ DM), `"group-all"` (ทุกข้อความกลุ่ม ไม่มี DM), `"group-mentions"` (กลุ่มเมื่อมีการกล่าวถึงบอต; **ไม่มี DM** — นี่คือค่าเริ่มต้น), `"off"` / `"none"` (ปิดใช้)

    <Note>
    ขอบเขตเริ่มต้น (`"group-mentions"`) จะไม่เรียกรีแอ็กชันตอบรับในข้อความโดยตรง หากต้องการรีแอ็กชันตอบรับบน DM ขาเข้าของ Telegram ให้ตั้ง `messages.ackReactionScope` เป็น `"direct"` หรือ `"all"` ค่านี้จะถูกอ่านเมื่อผู้ให้บริการ Telegram เริ่มทำงาน ดังนั้นจึงต้องรีสตาร์ท Gateway เพื่อให้การเปลี่ยนแปลงมีผล
    </Note>

  </Accordion>

  <Accordion title="การเขียนการกำหนดค่าจากเหตุการณ์และคำสั่งของ Telegram">
    การเขียนการกำหนดค่าช่องทางเปิดใช้ตามค่าเริ่มต้น (`configWrites !== false`)

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

  <Accordion title="การโพลระยะยาวเทียบกับ Webhook">
    ค่าเริ่มต้นคือการโพลระยะยาว สำหรับโหมด Webhook ให้ตั้ง `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; ตัวเลือกเสริมคือ `webhookPath`, `webhookHost`, `webhookPort` (ค่าเริ่มต้น `/telegram-webhook`, `127.0.0.1`, `8787`)

    ในโหมดการโพลระยะยาว OpenClaw จะคงค่า watermark การรีสตาร์ทไว้หลังจากอัปเดตถูกส่งต่อสำเร็จเท่านั้น หาก handler ล้มเหลว อัปเดตนั้นจะยังคงลองใหม่ได้ใน process เดิม และจะไม่ถูกเขียนว่าเสร็จสมบูรณ์สำหรับการลบรายการซ้ำหลังรีสตาร์ท

    ตัวรับฟังภายในเครื่องผูกกับ `127.0.0.1:8787` สำหรับทางเข้าจากสาธารณะ ให้ใส่ reverse proxy ไว้หน้าพอร์ตภายในเครื่อง หรือตั้ง `webhookHost: "0.0.0.0"` อย่างตั้งใจ

    โหมด Webhook จะตรวจสอบตัวป้องกันคำขอ โทเค็นลับของ Telegram และเนื้อหา JSON ก่อนส่งคืน `200` ไปยัง Telegram
    จากนั้น OpenClaw จะประมวลผลอัปเดตแบบอะซิงโครนัสผ่านเลนบอตต่อแชต/ต่อหัวข้อเดียวกับที่การโพลระยะยาวใช้ ดังนั้นรอบการทำงานของเอเจนต์ที่ช้าจะไม่รั้ง ACK การส่งมอบของ Telegram

  </Accordion>

  <Accordion title="ขีดจำกัด การลองใหม่ และเป้าหมาย CLI">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` จะให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนการแยกตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ขาเข้าและขาออก
    - `channels.telegram.mediaGroupFlushMs` (ค่าเริ่มต้น 500) ควบคุมระยะเวลาที่อัลบั้ม/กลุ่มสื่อของ Telegram ถูกบัฟเฟอร์ไว้ก่อนที่ OpenClaw จะส่งต่อเป็นข้อความขาเข้าหนึ่งรายการ เพิ่มค่านี้หากส่วนของอัลบั้มมาถึงช้า; ลดค่านี้เพื่อลดเวลาแฝงของการตอบกลับอัลบั้ม
    - `channels.telegram.timeoutSeconds` แทนที่ timeout ของไคลเอนต์ Telegram API (หากไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY) ไคลเอนต์บอตจะจำกัดค่าที่กำหนดไว้ให้ต่ำกว่าตัวคุมคำขอข้อความ/การพิมพ์ขาออก 60 วินาที เพื่อไม่ให้ grammY ยกเลิกการส่งมอบการตอบกลับที่มองเห็นได้ก่อนที่ตัวคุมการขนส่งและ fallback ของ OpenClaw จะทำงานได้ Long polling ยังใช้ตัวคุมคำขอ `getUpdates` 45 วินาที เพื่อไม่ให้การ poll ที่ว่างอยู่ถูกปล่อยทิ้งไว้อย่างไม่มีกำหนด
    - ค่าเริ่มต้นของ `channels.telegram.pollingStallThresholdMs` คือ `120000`; ปรับระหว่าง `30000` ถึง `600000` เฉพาะสำหรับการรีสตาร์ต polling-stall ที่เป็นผลบวกลวง
    - ประวัติบริบทกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` ปิดใช้งาน
    - บริบทเสริมของการตอบกลับ/อ้างอิง/ส่งต่อจะถูกทำให้เป็นปกติเป็นหน้าต่างบริบทการสนทนาที่เลือกไว้หนึ่งรายการ เมื่อ Gateway เคยสังเกตเห็นข้อความแม่แล้ว แคชข้อความที่สังเกตเห็นอยู่ในสถานะ Plugin SQLite ของ OpenClaw และ `openclaw doctor --fix` จะนำเข้า sidecar แบบเก่า Telegram รวม `reply_to_message` แบบตื้นเพียงหนึ่งรายการใน updates เท่านั้น ดังนั้นสายข้อความที่เก่ากว่าแคชจะถูกจำกัดตาม payload update ปัจจุบันของ Telegram
    - allowlist ของ Telegram ใช้ควบคุมเป็นหลักว่าใครสามารถเรียกเอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบเต็ม
    - การควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - การกำหนดค่า `channels.telegram.retry` ใช้กับตัวช่วยส่งของ Telegram (CLI/เครื่องมือ/การกระทำ) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้ การส่งมอบการตอบกลับสุดท้ายขาเข้ายังใช้การลองส่งแบบปลอดภัยที่มีขอบเขตสำหรับความล้มเหลวก่อนเชื่อมต่อของ Telegram แต่จะไม่ลองใหม่กับซองเครือข่ายหลังส่งที่คลุมเครือซึ่งอาจทำให้ข้อความที่มองเห็นได้ซ้ำกัน

    เป้าหมายการส่งของ CLI และเครื่องมือข้อความสามารถเป็น ID แชตตัวเลข ชื่อผู้ใช้ หรือเป้าหมายหัวข้อฟอรัม:

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

    flag สำหรับ poll เฉพาะ Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` สำหรับหัวข้อฟอรัม (หรือใช้เป้าหมาย `:topic:`)

    การส่งของ Telegram ยังรองรับ:

    - `--presentation` พร้อมบล็อก `buttons` สำหรับแป้นพิมพ์ inline เมื่อ `channels.telegram.capabilities.inlineButtons` อนุญาต
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอการส่งมอบแบบปักหมุดเมื่อบอตสามารถปักหมุดในแชตนั้นได้
    - `--force-document` เพื่อส่งรูปภาพ, GIF และวิดีโอขาออกเป็นเอกสารแทนการอัปโหลดเป็นรูปภาพที่บีบอัด สื่อแอนิเมชัน หรือวิดีโอ

    การควบคุมการกระทำ:

    - `channels.telegram.actions.sendMessage=false` ปิดใช้งานข้อความ Telegram ขาออก รวมถึง poll
    - `channels.telegram.actions.poll=false` ปิดใช้งานการสร้าง poll ของ Telegram โดยยังคงเปิดใช้งานการส่งปกติไว้

  </Accordion>

  <Accordion title="การอนุมัติ exec ใน Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถเลือกโพสต์พรอมต์ในแชตหรือหัวข้อต้นทางได้ ผู้อนุมัติต้องเป็น ID ผู้ใช้ Telegram แบบตัวเลข

    เส้นทางการกำหนดค่า:

    - `channels.telegram.execApprovals.enabled` (เปิดใช้งานอัตโนมัติเมื่อระบุผู้อนุมัติได้อย่างน้อยหนึ่งคน)
    - `channels.telegram.execApprovals.approvers` (fallback ไปยัง ID เจ้าของแบบตัวเลขจาก `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` และ `defaultTo` ควบคุมว่าใครสามารถคุยกับบอตได้และบอตส่งคำตอบปกติไปที่ใด ค่าเหล่านี้ไม่ได้ทำให้ใครเป็นผู้อนุมัติ exec การจับคู่ DM ที่ได้รับอนุมัติครั้งแรกจะเริ่มต้น `commands.ownerAllowFrom` เมื่อยังไม่มีเจ้าของคำสั่ง ดังนั้นการตั้งค่าเจ้าของคนเดียวยังคงทำงานได้โดยไม่ต้องทำ ID ซ้ำใน `execApprovals.approvers`

    การส่งมอบในช่องจะแสดงข้อความคำสั่งในแชต; เปิดใช้งาน `channel` หรือ `both` เฉพาะในกลุ่ม/หัวข้อที่เชื่อถือได้ เมื่อพรอมต์ไปถึงหัวข้อฟอรัม OpenClaw จะคงหัวข้อไว้สำหรับพรอมต์อนุมัติและการติดตามผล การอนุมัติ exec จะหมดอายุหลัง 30 นาทีโดยค่าเริ่มต้น

    ปุ่มอนุมัติ inline ยังต้องให้ `channels.telegram.capabilities.inlineButtons` อนุญาตพื้นผิวเป้าหมาย (`dm`, `group` หรือ `all`) ID การอนุมัติที่ขึ้นต้นด้วย `plugin:` จะ resolve ผ่านการอนุมัติของ plugin; รายการอื่นจะ resolve ผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## การควบคุมการตอบกลับข้อผิดพลาด

เมื่อเอเจนต์พบข้อผิดพลาดในการส่งมอบหรือ provider นโยบายข้อผิดพลาดจะควบคุมว่าจะส่งข้อความข้อผิดพลาดไปยังแชต Telegram หรือไม่:

| คีย์                                | ค่า                        | ค่าเริ่มต้น     | คำอธิบาย                                                                                                                                                                                               |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — ส่งทุกข้อความข้อผิดพลาดไปยังแชต `once` — ส่งข้อความข้อผิดพลาดที่ไม่ซ้ำแต่ละรายการหนึ่งครั้งต่อช่วง cooldown (ระงับข้อผิดพลาดซ้ำที่เหมือนกัน) `silent` — ไม่ส่งข้อความข้อผิดพลาดไปยังแชตเลย |
| `channels.telegram.errorCooldownMs` | ตัวเลข (ms)                | `14400000` (4h) | ช่วง cooldown สำหรับนโยบาย `once` หลังจากส่งข้อผิดพลาดแล้ว ข้อความข้อผิดพลาดเดียวกันจะถูกระงับจนกว่าช่วงเวลานี้จะผ่านไป ป้องกันสแปมข้อผิดพลาดระหว่างเหตุขัดข้อง                                      |

รองรับการแทนที่ต่อบัญชี ต่อกลุ่ม และต่อหัวข้อ (การสืบทอดเหมือนกับคีย์กำหนดค่า Telegram อื่นๆ)

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

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="บอตไม่ตอบสนองต่อข้อความกลุ่มที่ไม่ได้ mention">

    - หาก `requireMention=false` โหมดความเป็นส่วนตัวของ Telegram ต้องอนุญาตการมองเห็นแบบเต็ม
      - BotFather: `/setprivacy` -> Disable
      - จากนั้นนำบอตออกและเพิ่มกลับเข้าไปในกลุ่ม
    - `openclaw channels status` เตือนเมื่อการกำหนดค่าคาดหวังข้อความกลุ่มที่ไม่ได้ mention
    - `openclaw channels status --probe` สามารถตรวจ ID กลุ่มตัวเลขที่ชัดเจนได้; wildcard `"*"` ไม่สามารถตรวจสมาชิกภาพได้
    - การทดสอบเซสชันอย่างรวดเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอตไม่เห็นข้อความกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` กลุ่มต้องอยู่ในรายการ (หรือรวม `"*"`)
    - ตรวจสอบสมาชิกภาพของบอตในกลุ่ม
    - ตรวจสอบ log: `openclaw logs --follow` เพื่อดูเหตุผลที่ข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานได้บางส่วนหรือไม่ทำงานเลย">

    - อนุญาตตัวตนผู้ส่งของคุณ (การจับคู่และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังคงมีผลแม้นโยบายกลุ่มจะเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู native มีรายการมากเกินไป; ลดคำสั่ง plugin/skill/กำหนดเอง หรือปิดใช้งานเมนู native
    - การเรียกเริ่มต้น `deleteMyCommands` / `setMyCommands` และการเรียกพิมพ์ `sendChatAction` ถูกจำกัดเวลาและลองใหม่หนึ่งครั้งผ่าน transport fallback ของ Telegram เมื่อคำขอ timeout ข้อผิดพลาดเครือข่าย/fetch ที่คงอยู่มักบ่งชี้ปัญหาการเข้าถึง DNS/HTTPS ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="การเริ่มต้นรายงาน token ที่ไม่ได้รับอนุญาต">

    - `getMe returned 401` คือความล้มเหลวในการยืนยันตัวตนของ Telegram สำหรับ token บอตที่กำหนดค่าไว้
    - คัดลอกใหม่หรือสร้าง token บอตใหม่ใน BotFather จากนั้นอัปเดต `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` หรือ `TELEGRAM_BOT_TOKEN` สำหรับบัญชีเริ่มต้น
    - `deleteWebhook 401 Unauthorized` ระหว่างเริ่มต้นก็เป็นความล้มเหลวของ auth เช่นกัน; การถือว่าเป็น "ไม่มี webhook อยู่" จะเพียงเลื่อนความล้มเหลวจาก token ที่ไม่ถูกต้องเดิมไปยังการเรียก API ภายหลังเท่านั้น

  </Accordion>

  <Accordion title="Polling หรือเครือข่ายไม่เสถียร">

    - Node 22+ พร้อม fetch/proxy แบบกำหนดเองอาจทำให้เกิดพฤติกรรม abort ทันทีหากชนิด AbortSignal ไม่ตรงกัน
    - บางโฮสต์ resolve `api.telegram.org` เป็น IPv6 ก่อน; egress IPv6 ที่เสียอาจทำให้ Telegram API ล้มเหลวเป็นช่วงๆ
    - หาก log มี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!` ตอนนี้ OpenClaw จะลองใหม่กับข้อผิดพลาดเครือข่ายเหล่านี้ในฐานะข้อผิดพลาดที่กู้คืนได้
    - ระหว่างการเริ่มต้น polling OpenClaw จะใช้ probe `getMe` ที่สำเร็จจากการเริ่มต้นซ้ำสำหรับ grammY เพื่อให้ runner ไม่ต้องใช้ `getMe` ครั้งที่สองก่อน `getUpdates` แรก
    - หาก `deleteWebhook` ล้มเหลวด้วยข้อผิดพลาดเครือข่ายชั่วคราวระหว่างการเริ่มต้น polling OpenClaw จะดำเนินต่อเข้าสู่ long polling แทนการเรียก control-plane ก่อน poll อีกครั้ง webhook ที่ยัง active อยู่จะแสดงเป็นความขัดแย้งของ `getUpdates`; จากนั้น OpenClaw จะสร้าง transport ของ Telegram ใหม่และลองล้าง webhook อีกครั้ง
    - หาก socket ของ Telegram recycle ตาม cadence คงที่สั้นๆ ให้ตรวจสอบ `channels.telegram.timeoutSeconds` ที่ต่ำ; ไคลเอนต์บอตจะจำกัดค่าที่กำหนดไว้ให้ต่ำกว่าตัวคุมคำขอขาออกและ `getUpdates` แต่รุ่นเก่าอาจ abort ทุก poll หรือการตอบกลับเมื่อค่านี้ถูกตั้งต่ำกว่าตัวคุมเหล่านั้น
    - หาก log มี `Polling stall detected` OpenClaw จะรีสตาร์ต polling และสร้าง transport ของ Telegram ใหม่หลังจากไม่มี liveness ของ long-poll ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีโดยค่าเริ่มต้น
    - `openclaw channels status --probe` และ `openclaw doctor` เตือนเมื่อบัญชี polling ที่กำลังทำงานยังไม่เสร็จสิ้น `getUpdates` หลังช่วงผ่อนผันการเริ่มต้น เมื่อบัญชี webhook ที่กำลังทำงานยังไม่เสร็จสิ้น `setWebhook` หลังช่วงผ่อนผันการเริ่มต้น หรือเมื่อกิจกรรม transport polling ที่สำเร็จครั้งล่าสุดเก่าเกินไป
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่ใช้เวลานานยังปกติ แต่โฮสต์ของคุณยังรายงานการรีสตาร์ต polling-stall ที่เป็นผลบวกลวง การหยุดค้างที่คงอยู่มักชี้ไปยังปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่างโฮสต์กับ `api.telegram.org`
    - Telegram ยังเคารพ env proxy ของ process สำหรับ transport ของ Bot API รวมถึง `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และรูปแบบตัวพิมพ์เล็กของค่าเหล่านั้น `NO_PROXY` / `no_proxy` ยังสามารถข้าม `api.telegram.org` ได้
    - หาก proxy ที่ OpenClaw จัดการถูกกำหนดค่าผ่าน `OPENCLAW_PROXY_URL` สำหรับสภาพแวดล้อมบริการ และไม่มี env proxy มาตรฐาน Telegram จะใช้ URL นั้นสำหรับ transport ของ Bot API ด้วย
    - บนโฮสต์ VPS ที่มี egress/TLS โดยตรงไม่เสถียร ให้ route การเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ ตั้งค่าเริ่มต้นเป็น `autoSelectFamily=true` (ยกเว้น WSL2) ลำดับผลลัพธ์ DNS ของ Telegram จะทำตาม `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER` จากนั้น `channels.telegram.network.dnsResultOrder` จากนั้นค่าเริ่มต้นของโปรเซส เช่น `NODE_OPTIONS=--dns-result-order=ipv4first`; หากไม่มีข้อใดใช้ได้ Node 22+ จะ fallback เป็น `ipv4first`
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนด้วยพฤติกรรมแบบ IPv4 เท่านั้น ให้บังคับการเลือก family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบในช่วง benchmark ของ RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาตอยู่แล้ว
      สำหรับการดาวน์โหลดสื่อ Telegram ตามค่าเริ่มต้น หาก fake-IP ที่เชื่อถือได้หรือ
      transparent proxy เขียน `api.telegram.org` ใหม่เป็นที่อยู่ private/internal/special-use
      อื่นระหว่างการดาวน์โหลดสื่อ คุณสามารถเลือกใช้ bypass สำหรับ Telegram เท่านั้นได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - การเลือกใช้นี้มีให้ต่อบัญชีเช่นกันที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หาก proxy ของคุณ resolve โฮสต์สื่อ Telegram เป็น `198.18.x.x` ให้ปิด
      flag อันตรายไว้ก่อน สื่อ Telegram อนุญาตช่วง benchmark ของ RFC 2544
      ตามค่าเริ่มต้นอยู่แล้ว

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` ทำให้การป้องกัน SSRF
      สำหรับสื่อ Telegram อ่อนลง ใช้เฉพาะกับสภาพแวดล้อม proxy ที่เชื่อถือได้และควบคุมโดยผู้ปฏิบัติงาน
      เช่นการกำหนดเส้นทาง fake-IP ของ Clash, Mihomo หรือ Surge เมื่อระบบเหล่านั้น
      สร้างคำตอบ private หรือ special-use นอกช่วง benchmark ของ RFC 2544
      ให้ปิดไว้สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ
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

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Telegram](/th/gateway/config-channels#telegram)

<Accordion title="High-signal Telegram fields">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; symlink จะถูกปฏิเสธ)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- ค่าเริ่มต้นของหัวข้อ: `groups.<chatId>.topics."*"` ใช้กับหัวข้อ forum ที่ไม่ตรงกัน; topic ID ที่ตรงกันแบบเจาะจงจะแทนที่ค่านี้
- การอนุมัติ exec: `execApprovals`, `accounts.*.execApprovals`
- คำสั่ง/เมนู: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/replies: `replyToMode`
- streaming: `streaming` (ตัวอย่าง), `streaming.preview.toolProgress`, `blockStreaming`
- การจัดรูปแบบ/การส่งมอบ: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- สื่อ/เครือข่าย: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- root API แบบกำหนดเอง: `apiRoot` (เฉพาะ root ของ Bot API; อย่าใส่ `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions: `reactionNotifications`, `reactionLevel`
- ข้อผิดพลาด: `errorPolicy`, `errorCooldownMs`
- การเขียน/ประวัติ: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญของหลายบัญชี: เมื่อกำหนดค่า ID บัญชีตั้งแต่สองรายการขึ้นไป ให้ตั้งค่า `channels.telegram.defaultAccount` (หรือรวม `channels.telegram.accounts.default`) เพื่อให้การกำหนดเส้นทางเริ่มต้นชัดเจน มิฉะนั้น OpenClaw จะ fallback ไปยัง ID บัญชีที่ normalize แล้วรายการแรก และ `openclaw doctor` จะแจ้งเตือน บัญชีที่ตั้งชื่อไว้จะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom` แต่จะไม่สืบทอดค่า `accounts.default.*`
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Telegram กับ Gateway
  </Card>
  <Card title="Groups" icon="users" href="/th/channels/groups">
    พฤติกรรม allowlist ของกลุ่มและหัวข้อ
  </Card>
  <Card title="Channel routing" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยัง agent
  </Card>
  <Card title="Security" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเสริมความปลอดภัย
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกลุ่มและหัวข้อไปยัง agent
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้าม Channel
  </Card>
</CardGroup>
