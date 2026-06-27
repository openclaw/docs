---
read_when:
    - การทำงานกับฟีเจอร์ Telegram หรือ Webhook
summary: สถานะการรองรับบอต Telegram ความสามารถ และการกำหนดค่า
title: Telegram
x-i18n:
    generated_at: "2026-06-27T17:14:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f05ee57f06fe3b1c42ca19204bf74685ca3f05b1f02b9a6e36a7986e298b7edc
    source_path: channels/telegram.md
    workflow: 16
---

พร้อมใช้งานจริงสำหรับ DM ของบอตและกลุ่มผ่าน grammY โหมดเริ่มต้นคือการโพลระยะยาว ส่วนโหมด Webhook เป็นตัวเลือกเสริม

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
    เปิด Telegram แล้วแชทกับ **@BotFather** (ยืนยันว่าแฮนเดิลตรงกับ `@BotFather` ทุกประการ)

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

    ค่าสำรองจาก env: `TELEGRAM_BOT_TOKEN=...` (เฉพาะบัญชีเริ่มต้น)
    Telegram **ไม่** ใช้ `openclaw channels login telegram`; ให้กำหนดค่าโทเค็นใน config/env แล้วเริ่ม gateway

  </Step>

  <Step title="เริ่ม gateway และอนุมัติ DM แรก">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    รหัสจับคู่หมดอายุหลังจาก 1 ชั่วโมง

  </Step>

  <Step title="เพิ่มบอตเข้าในกลุ่ม">
    เพิ่มบอตเข้าในกลุ่มของคุณ จากนั้นรับ ID ทั้งสองรายการที่การเข้าถึงกลุ่มต้องใช้:

    - ID ผู้ใช้ Telegram ของคุณ ใช้ใน `allowFrom` / `groupAllowFrom`
    - ID แชทกลุ่ม Telegram ใช้เป็นคีย์ใต้ `channels.telegram.groups`

    สำหรับการตั้งค่าครั้งแรก ให้รับ ID แชทกลุ่มจาก `openclaw logs --follow`, บอต forwarded-ID หรือ Bot API `getUpdates` หลังจากอนุญาตกลุ่มแล้ว `/whoami@<bot_username>` สามารถยืนยัน ID ผู้ใช้และกลุ่มได้

    ID ของ supergroup ใน Telegram ที่เป็นค่าลบและขึ้นต้นด้วย `-100` คือ ID แชทกลุ่ม ให้วางไว้ใต้ `channels.telegram.groups` ไม่ใช่ใต้ `groupAllowFrom`

  </Step>
</Steps>

<Note>
ลำดับการแก้หาโทเค็นรับรู้ตามบัญชี ในทางปฏิบัติ ค่าจาก config จะชนะค่าสำรองจาก env และ `TELEGRAM_BOT_TOKEN` จะใช้กับบัญชีเริ่มต้นเท่านั้น
หลังจากเริ่มต้นสำเร็จ OpenClaw จะแคชตัวตนของบอตไว้ในไดเรกทอรีสถานะได้นานสูงสุด 24 ชั่วโมง เพื่อให้การรีสตาร์ตหลีกเลี่ยงการเรียก Telegram `getMe` เพิ่มเติมได้ การเปลี่ยนหรือลบโทเค็นจะล้างแคชนั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="โหมดความเป็นส่วนตัวและการมองเห็นในกลุ่ม">
    บอต Telegram จะใช้ **โหมดความเป็นส่วนตัว** เป็นค่าเริ่มต้น ซึ่งจำกัดข้อความกลุ่มที่บอตได้รับ

    หากบอตต้องเห็นข้อความกลุ่มทั้งหมด ให้ทำอย่างใดอย่างหนึ่ง:

    - ปิดโหมดความเป็นส่วนตัวผ่าน `/setprivacy` หรือ
    - ตั้งบอตเป็นผู้ดูแลกลุ่ม

    เมื่อสลับโหมดความเป็นส่วนตัว ให้ลบและเพิ่มบอตกลับเข้าไปใหม่ในแต่ละกลุ่ม เพื่อให้ Telegram นำการเปลี่ยนแปลงไปใช้

  </Accordion>

  <Accordion title="สิทธิ์ของกลุ่ม">
    สถานะผู้ดูแลถูกควบคุมในการตั้งค่ากลุ่ม Telegram

    บอตที่เป็นผู้ดูแลจะได้รับข้อความกลุ่มทั้งหมด ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มที่ทำงานตลอดเวลา

  </Accordion>

  <Accordion title="ตัวสลับ BotFather ที่มีประโยชน์">

    - `/setjoingroups` เพื่ออนุญาต/ปฏิเสธการเพิ่มเข้ากลุ่ม
    - `/setprivacy` สำหรับพฤติกรรมการมองเห็นในกลุ่ม

  </Accordion>
</AccordionGroup>

## การควบคุมการเข้าถึงและการเปิดใช้งาน

### ตัวตนบอตในกลุ่ม

ในกลุ่ม Telegram และหัวข้อฟอรัม การกล่าวถึงแฮนเดิลบอตที่กำหนดไว้อย่างชัดเจน (เช่น `@my_bot`) จะถือว่าเป็นการส่งถึงเอเจนต์ OpenClaw ที่เลือก แม้ชื่อบุคลิกของเอเจนต์จะแตกต่างจากชื่อผู้ใช้ Telegram ก็ตาม นโยบายปิดเสียงของกลุ่มยังคงใช้กับทราฟฟิกกลุ่มที่ไม่เกี่ยวข้อง แต่ตัวแฮนเดิลของบอตเองจะไม่ถือว่าเป็น "คนอื่น"

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.telegram.dmPolicy` ควบคุมการเข้าถึงข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist` (ต้องมี ID ผู้ส่งอย่างน้อยหนึ่งรายการใน `allowFrom`)
    - `open` (ต้องให้ `allowFrom` รวม `"*"`)
    - `disabled`

    `dmPolicy: "open"` พร้อม `allowFrom: ["*"]` ทำให้บัญชี Telegram ใดก็ตามที่พบหรือเดาชื่อผู้ใช้ของบอตได้สามารถสั่งงานบอตได้ ใช้เฉพาะกับบอตสาธารณะที่ตั้งใจเปิดและจำกัดเครื่องมืออย่างเข้มงวดเท่านั้น บอตเจ้าของคนเดียวควรใช้ `allowlist` พร้อม ID ผู้ใช้แบบตัวเลข

    `channels.telegram.allowFrom` รับ ID ผู้ใช้ Telegram แบบตัวเลข รองรับคำนำหน้า `telegram:` / `tg:` และจะถูกทำให้เป็นรูปแบบมาตรฐาน
    ใน config หลายบัญชี `channels.telegram.allowFrom` ระดับบนที่เข้มงวดจะถูกถือเป็นขอบเขตความปลอดภัย: รายการระดับบัญชี `allowFrom: ["*"]` จะไม่ทำให้บัญชีนั้นเป็นสาธารณะ เว้นแต่ allowlist ที่มีผลของบัญชียังคงมี wildcard ที่ระบุชัดเจนหลังจากผสานแล้ว
    `dmPolicy: "allowlist"` พร้อม `allowFrom` ว่างจะบล็อก DM ทั้งหมดและถูกปฏิเสธโดยการตรวจสอบ config
    การตั้งค่าจะถามหาเฉพาะ ID ผู้ใช้แบบตัวเลข
    หากคุณอัปเกรดแล้ว config ของคุณมีรายการ allowlist แบบ `@username` ให้เรียกใช้ `openclaw doctor --fix` เพื่อแก้ค่าเหล่านั้น (พยายามให้ดีที่สุด; ต้องใช้โทเค็นบอต Telegram)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์ allowlist ของ pairing-store, `openclaw doctor --fix` สามารถกู้รายการเข้าไปใน `channels.telegram.allowFrom` ในโฟลว์ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID ที่ระบุชัดเจน)

    สำหรับบอตเจ้าของคนเดียว ให้เลือกใช้ `dmPolicy: "allowlist"` พร้อม ID แบบตัวเลขที่ระบุชัดเจนใน `allowFrom` เพื่อให้นโยบายการเข้าถึงคงทนใน config (แทนที่จะพึ่งพาการอนุมัติการจับคู่ก่อนหน้า)

    ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่ได้หมายความว่า "ผู้ส่งรายนี้ได้รับอนุญาตทุกที่"
    การจับคู่ให้สิทธิ์เข้าถึง DM หากยังไม่มีเจ้าของคำสั่ง การจับคู่ที่อนุมัติครั้งแรกจะตั้งค่า `commands.ownerAllowFrom` ด้วย เพื่อให้คำสั่งเฉพาะเจ้าของและการอนุมัติ exec มีบัญชีผู้ปฏิบัติการที่ชัดเจน
    การอนุญาตผู้ส่งในกลุ่มยังคงมาจาก allowlist ใน config ที่ระบุชัดเจน
    หากคุณต้องการ "ฉันได้รับอนุญาตครั้งเดียว แล้วทั้ง DM และคำสั่งกลุ่มใช้งานได้" ให้วาง ID ผู้ใช้ Telegram แบบตัวเลขของคุณใน `channels.telegram.allowFrom`; สำหรับคำสั่งเฉพาะเจ้าของ ตรวจสอบให้แน่ใจว่า `commands.ownerAllowFrom` มี `telegram:<your user id>`

    ### การค้นหา ID ผู้ใช้ Telegram ของคุณ

    ปลอดภัยกว่า (ไม่มีบอตบุคคลที่สาม):

    1. ส่ง DM ถึงบอตของคุณ
    2. เรียกใช้ `openclaw logs --follow`
    3. อ่าน `from.id`

    วิธีทางการของ Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีจากบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="นโยบายกลุ่มและรายการอนุญาต">
    มีตัวควบคุมสองอย่างที่ใช้ร่วมกัน:

    1. **กลุ่มใดบ้างที่ได้รับอนุญาต** (`channels.telegram.groups`)
       - ไม่มี config `groups`:
         - เมื่อใช้ `groupPolicy: "open"`: กลุ่มใดก็ผ่านการตรวจ ID กลุ่มได้
         - เมื่อใช้ `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการ `groups` (หรือ `"*"`)
       - กำหนดค่า `groups` แล้ว: ทำหน้าที่เป็น allowlist (ID ที่ระบุชัดเจนหรือ `"*"`)

    2. **ผู้ส่งใดบ้างที่ได้รับอนุญาตในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่า Telegram จะย้อนกลับไปใช้ `allowFrom`
    รายการ `groupAllowFrom` ควรเป็น ID ผู้ใช้ Telegram แบบตัวเลข (คำนำหน้า `telegram:` / `tg:` จะถูกทำให้เป็นรูปแบบมาตรฐาน)
    อย่าวาง ID แชทกลุ่มหรือ supergroup ของ Telegram ใน `groupAllowFrom` ID แชทค่าลบควรอยู่ใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเว้นสำหรับการอนุญาตผู้ส่ง
    ขอบเขตความปลอดภัย (`2026.2.25+`): การตรวจสิทธิ์ผู้ส่งในกลุ่ม **ไม่** สืบทอดการอนุมัติ pairing-store ของ DM
    การจับคู่ยังคงเป็น DM เท่านั้น สำหรับกลุ่ม ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` รายกลุ่ม/รายหัวข้อ
    หากไม่ได้ตั้งค่า `groupAllowFrom`, Telegram จะย้อนกลับไปใช้ config `allowFrom` ไม่ใช่ pairing store
    รูปแบบใช้งานจริงสำหรับบอตเจ้าของคนเดียว: ตั้ง ID ผู้ใช้ของคุณใน `channels.telegram.allowFrom`, ปล่อย `groupAllowFrom` ว่างไว้ และอนุญาตกลุ่มเป้าหมายใต้ `channels.telegram.groups`
    หมายเหตุรันไทม์: หาก `channels.telegram` หายไปทั้งหมด รันไทม์จะใช้ค่าเริ่มต้นแบบ fail-closed `groupPolicy="allowlist"` เว้นแต่จะตั้งค่า `channels.defaults.groupPolicy` ไว้อย่างชัดเจน

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
      ข้อผิดพลาดที่พบบ่อย: `groupAllowFrom` ไม่ใช่รายการอนุญาตกลุ่ม Telegram

      - วาง ID แชทกลุ่มหรือ supergroup ของ Telegram ที่เป็นค่าลบ เช่น `-1001234567890` ไว้ใต้ `channels.telegram.groups`
      - วาง ID ผู้ใช้ Telegram เช่น `8734062810` ไว้ใต้ `groupAllowFrom` เมื่อคุณต้องการจำกัดว่าคนใดในกลุ่มที่ได้รับอนุญาตสามารถทริกเกอร์บอตได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกใดก็ได้ของกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอตได้

    </Warning>

  </Tab>

  <Tab title="พฤติกรรมการกล่าวถึง">
    การตอบกลับในกลุ่มต้องมีการกล่าวถึงเป็นค่าเริ่มต้น

    การกล่าวถึงอาจมาจาก:

    - การกล่าวถึงแบบเนทีฟ `@botusername` หรือ
    - รูปแบบการกล่าวถึงใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    ตัวสลับคำสั่งระดับเซสชัน:

    - `/activation always`
    - `/activation mention`

    สิ่งเหล่านี้อัปเดตเฉพาะสถานะเซสชัน ใช้ config สำหรับการคงค่า

    ตัวอย่าง config แบบคงค่า:

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
    หรือเป็นข้อความของบอตเอง ตั้งค่า `includeGroupHistoryContext: "recent"` เพื่อ
    รวมประวัติห้องล่าสุดสำหรับกลุ่มที่เชื่อถือได้ ตั้งค่า
    `includeGroupHistoryContext: "none"` เพื่อไม่ส่งประวัติกลุ่ม Telegram ก่อนหน้า
    ไปกับรอบถัดไป

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

    - ส่งต่อข้อความกลุ่มไปที่ `@userinfobot` / `@getidsbot`
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจสอบ Bot API `getUpdates`
    - หลังจากอนุญาตกลุ่มแล้ว ให้เรียกใช้ `/whoami@<bot_username>` หากเปิดใช้คำสั่งเนทีฟ

  </Tab>
</Tabs>

## พฤติกรรมรันไทม์

- Telegram เป็นเจ้าของโดยกระบวนการ Gateway
- การกำหนดเส้นทางเป็นแบบกำหนดแน่นอน: ข้อความขาเข้าของ Telegram จะตอบกลับไปยัง Telegram (โมเดลไม่ได้เลือกช่องทาง)
- ข้อความขาเข้าจะถูกทำให้เป็นรูปแบบมาตรฐานในซองช่องทางที่ใช้ร่วมกัน พร้อมเมตาดาตาการตอบกลับ ตัวแทนตำแหน่งสื่อ และบริบทสายการตอบกลับที่คงอยู่สำหรับการตอบกลับของ Telegram ที่ Gateway สังเกตเห็น
- เซสชันกลุ่มถูกแยกตาม ID กลุ่ม หัวข้อฟอรัมจะต่อท้าย `:topic:<threadId>` เพื่อแยกหัวข้อออกจากกัน
- ข้อความ DM สามารถมี `message_thread_id`; OpenClaw จะคงค่าไว้สำหรับการตอบกลับ เซสชันหัวข้อ DM จะแยกเฉพาะเมื่อ Telegram `getMe` รายงาน `has_topics_enabled: true` สำหรับบอท; มิฉะนั้น DM จะยังคงอยู่ในเซสชันแบบแบน
- การทำ long polling ใช้ grammY runner พร้อมการจัดลำดับต่อแชท/ต่อเธรด ความพร้อมกันของ runner sink โดยรวมใช้ `agents.defaults.maxConcurrent`
- การเริ่มต้นหลายบัญชีจำกัดการ probe `getMe` ของ Telegram ที่เกิดพร้อมกัน เพื่อให้ fleet บอทขนาดใหญ่ไม่กระจายการ probe ทุกบัญชีพร้อมกัน
- Long polling ถูกป้องกันภายในแต่ละกระบวนการ Gateway เพื่อให้มี poller ที่ใช้งานอยู่เพียงตัวเดียวใช้ token ของบอทได้ในเวลาเดียวกัน หากคุณยังเห็นข้อขัดแย้ง `getUpdates` 409 แสดงว่า Gateway ของ OpenClaw ตัวอื่น สคริปต์ หรือ poller ภายนอกน่าจะกำลังใช้ token เดียวกันอยู่
- การรีสตาร์ทจาก watchdog ของ long-polling จะถูกทริกเกอร์โดยค่าเริ่มต้นหลังจาก 120 วินาทีโดยไม่มี liveness ของ `getUpdates` ที่เสร็จสมบูรณ์ เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อ deployment ของคุณยังเห็นการรีสตาร์ท polling-stall แบบ false ระหว่างงานที่รันนาน ค่านี้อยู่ในหน่วยมิลลิวินาทีและอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับการ override ต่อบัญชี
- Telegram Bot API ไม่รองรับ read-receipt (`sendReadReceipts` ไม่ใช้กับกรณีนี้)

<Note>
  `channels.telegram.dm.threadReplies` และ `channels.telegram.direct.<chatId>.threadReplies` ถูกลบแล้ว รัน `openclaw doctor --fix` หลังอัปเกรดหาก config ของคุณยังมี key เหล่านั้นอยู่ การกำหนดเส้นทางหัวข้อ DM ตอนนี้จะทำตามความสามารถของบอทจาก Telegram `getMe.has_topics_enabled` ซึ่งควบคุมโดยโหมด threaded ของ BotFather: บอทที่เปิดใช้ topics จะใช้เซสชัน DM แบบ scoped ตามเธรดเมื่อ Telegram ส่ง `message_thread_id`; DM อื่นจะยังอยู่ในเซสชันแบบแบน
</Note>

## อ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="ตัวอย่างสตรีมสด (การแก้ไขข้อความ)">
    OpenClaw สามารถสตรีมคำตอบบางส่วนแบบเรียลไทม์ได้:

    - แชทโดยตรง: ข้อความตัวอย่าง + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความตัวอย่าง + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` คือ `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - ตัวอย่างคำตอบเริ่มต้นสั้น ๆ จะถูก debounce แล้ว materialize หลังจากความหน่วงที่มีขอบเขต หาก run ยัง active อยู่
    - `progress` จะคง draft สถานะที่แก้ไขได้หนึ่งรายการสำหรับความคืบหน้าของเครื่องมือ แสดงป้ายสถานะที่เสถียรเมื่อมีกิจกรรมคำตอบมาถึงก่อนความคืบหน้าของเครื่องมือ ล้างออกเมื่อเสร็จสิ้น และส่งคำตอบสุดท้ายเป็นข้อความปกติ
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความตัวอย่างที่แก้ไขเดียวกันซ้ำหรือไม่ (ค่าเริ่มต้น: `true` เมื่อ preview streaming เปิดใช้งานอยู่)
    - `streaming.preview.commandText` ควบคุมรายละเอียดคำสั่ง/exec ภายในบรรทัด tool-progress เหล่านั้น: `raw` (ค่าเริ่มต้น, คงพฤติกรรมที่เผยแพร่แล้วไว้) หรือ `status` (ป้ายเครื่องมือเท่านั้น)
    - `streaming.progress.commentary` (ค่าเริ่มต้น: `false`) เลือกเปิดข้อความ commentary/preamble ของ assistant ใน draft ความคืบหน้าชั่วคราว
    - legacy `channels.telegram.streamMode`, ค่า boolean ของ `streaming`, และ key native draft preview ที่เลิกใช้แล้วจะถูกตรวจพบ; รัน `openclaw doctor --fix` เพื่อ migrate ไปยัง config การสตรีมปัจจุบัน

    การอัปเดตตัวอย่าง tool-progress คือบรรทัดสถานะสั้น ๆ ที่แสดงขณะเครื่องมือทำงาน เช่น การรันคำสั่ง การอ่านไฟล์ การอัปเดตการวางแผน สรุป patch หรือข้อความ preamble/commentary ของ Codex ในโหมด Codex app-server Telegram เปิดสิ่งเหล่านี้ไว้โดยค่าเริ่มต้นเพื่อให้ตรงกับพฤติกรรม OpenClaw ที่เผยแพร่ตั้งแต่ `v2026.4.22` เป็นต้นไป

    หากต้องการคงตัวอย่างที่แก้ไขได้สำหรับข้อความคำตอบแต่ซ่อนบรรทัด tool-progress ให้ตั้งค่า:

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

    หากต้องการให้ tool-progress มองเห็นได้แต่ซ่อนข้อความคำสั่ง/exec ให้ตั้งค่า:

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

    ใช้ `streaming.mode: "off"` เฉพาะเมื่อคุณต้องการส่งเฉพาะผลลัพธ์สุดท้าย: การแก้ไขตัวอย่างของ Telegram จะถูกปิดใช้งาน และข้อความสถานะเครื่องมือ/ความคืบหน้าทั่วไปจะถูกระงับแทนที่จะส่งเป็นข้อความสถานะแยกต่างหาก prompt การอนุมัติ payload สื่อ และข้อผิดพลาดยังคงส่งผ่านการส่งผลลัพธ์สุดท้ายตามปกติ ใช้ `streaming.preview.toolProgress: false` เมื่อคุณต้องการคงการแก้ไขตัวอย่างคำตอบไว้เท่านั้นพร้อมซ่อนบรรทัดสถานะ tool-progress

    <Note>
      การตอบกลับ quote ที่เลือกของ Telegram เป็นข้อยกเว้น เมื่อ `replyToMode` เป็น `"first"`, `"all"` หรือ `"batched"` และข้อความขาเข้ามีข้อความ quote ที่เลือก OpenClaw จะส่งคำตอบสุดท้ายผ่านเส้นทาง quote-reply ดั้งเดิมของ Telegram แทนการแก้ไขตัวอย่างคำตอบ ดังนั้น `streaming.preview.toolProgress` จึงไม่สามารถแสดงบรรทัดสถานะสั้น ๆ สำหรับรอบนั้นได้ การตอบกลับข้อความปัจจุบันที่ไม่มีข้อความ quote ที่เลือกยังคงใช้ preview streaming ตั้งค่า `replyToMode: "off"` เมื่อความสามารถในการมองเห็น tool-progress สำคัญกว่าการตอบกลับ quote ดั้งเดิม หรือตั้งค่า `streaming.preview.toolProgress: false` เพื่อยอมรับ trade-off นี้
    </Note>

    สำหรับการตอบกลับแบบข้อความเท่านั้น:

    - ตัวอย่าง DM/กลุ่ม/หัวข้อแบบสั้น: OpenClaw จะคงข้อความตัวอย่างเดิมไว้และทำการแก้ไขสุดท้ายในที่เดิม
    - ผลลัพธ์สุดท้ายแบบข้อความยาวที่แยกเป็นข้อความ Telegram หลายข้อความจะใช้ตัวอย่างที่มีอยู่เป็น chunk สุดท้ายแรกเมื่อทำได้ แล้วส่งเฉพาะ chunk ที่เหลือ
    - ผลลัพธ์สุดท้ายในโหมด progress จะล้าง draft สถานะและใช้การส่งผลลัพธ์สุดท้ายตามปกติแทนการแก้ไข draft ให้เป็นคำตอบ
    - หากการแก้ไขสุดท้ายล้มเหลวก่อนยืนยันข้อความที่เสร็จสมบูรณ์ OpenClaw จะใช้การส่งผลลัพธ์สุดท้ายตามปกติและล้างตัวอย่างที่ค้างอยู่

    สำหรับการตอบกลับที่ซับซ้อน (เช่น payload สื่อ) OpenClaw จะ fallback ไปใช้การส่งผลลัพธ์สุดท้ายตามปกติแล้วล้างข้อความตัวอย่าง

    Preview streaming แยกจาก block streaming เมื่อเปิดใช้ block streaming สำหรับ Telegram อย่างชัดเจน OpenClaw จะข้าม preview stream เพื่อหลีกเลี่ยงการสตรีมซ้ำสอง

    พฤติกรรม reasoning stream:

    - `/reasoning stream` ใช้เส้นทาง reasoning-preview ของช่องทางที่รองรับ; บน Telegram จะสตรีม reasoning เข้าไปใน live preview ระหว่างสร้างคำตอบ
    - reasoning preview จะถูกลบหลังจากส่งผลลัพธ์สุดท้าย; ใช้ `/reasoning on` เมื่อควรให้ reasoning ยังคงมองเห็นได้
    - คำตอบสุดท้ายถูกส่งโดยไม่มีข้อความ reasoning

  </Accordion>

  <Accordion title="การจัดรูปแบบข้อความแบบ Rich">
    ข้อความขาออกใช้ข้อความ Telegram HTML มาตรฐานโดยค่าเริ่มต้น เพื่อให้คำตอบยังอ่านได้ใน client ของ Telegram ปัจจุบัน โหมดความเข้ากันได้นี้รองรับตัวหนา ตัวเอียง ลิงก์ โค้ด สปอยเลอร์ และ quote ตามปกติ แต่ไม่รองรับบล็อกแบบ rich-only ของ Bot API 10.1 เช่น ตารางดั้งเดิม details สื่อ rich และสูตร

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

    เมื่อเปิดใช้งาน:

    - agent จะได้รับแจ้งว่าข้อความ rich ของ Telegram พร้อมใช้งานสำหรับบอท/บัญชีนี้
    - ข้อความ Markdown จะถูก render ผ่าน Markdown IR ของ OpenClaw และส่งเป็น Telegram rich HTML
    - payload rich HTML แบบชัดเจนจะคง tag ของ Bot API 10.1 ที่รองรับไว้ เช่น heading, table, details, rich media และ formula
    - caption ของสื่อยังคงใช้ Telegram HTML captions เพราะข้อความ rich ไม่ได้แทนที่ caption

    วิธีนี้ช่วยให้ข้อความของโมเดลอยู่ห่างจาก sigil ของ Telegram Rich Markdown ดังนั้นสกุลเงินอย่าง `$400-600K` จะไม่ถูก parse เป็นคณิตศาสตร์ ข้อความ rich ที่ยาวจะถูกแยกอัตโนมัติตามขีดจำกัด rich text และ rich block ของ Telegram ตารางที่เกินขีดจำกัดคอลัมน์ของ Telegram จะถูกส่งเป็น code block

    ค่าเริ่มต้น: ปิดเพื่อความเข้ากันได้ของ client ข้อความ rich ต้องใช้ client ของ Telegram ที่เข้ากันได้; client Desktop, Web, Android และ third-party ปัจจุบันบางตัวแสดงข้อความ rich ที่รับแล้วเป็น unsupported ปิดตัวเลือกนี้ไว้ เว้นแต่ client ทุกตัวที่ใช้กับบอทสามารถ render ได้ `/status` แสดงว่าเซสชัน Telegram ปัจจุบันเปิดหรือปิดข้อความ rich อยู่

    Link preview เปิดใช้งานโดยค่าเริ่มต้น `channels.telegram.linkPreview: false` จะข้ามการตรวจจับ entity อัตโนมัติสำหรับ rich text

  </Accordion>

  <Accordion title="คำสั่งดั้งเดิมและคำสั่งกำหนดเอง">
    การลงทะเบียนเมนูคำสั่ง Telegram ถูกจัดการตอนเริ่มต้นด้วย `setMyCommands`

    ค่าเริ่มต้นของคำสั่งดั้งเดิม:

    - `commands.native: "auto"` เปิดใช้คำสั่งดั้งเดิมสำหรับ Telegram

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

    - ชื่อจะถูก normalize (ตัด `/` นำหน้าออก, แปลงเป็นตัวพิมพ์เล็ก)
    - pattern ที่ถูกต้อง: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งกำหนดเองไม่สามารถ override คำสั่งดั้งเดิมได้
    - ข้อขัดแย้ง/รายการซ้ำจะถูกข้ามและบันทึก log

    หมายเหตุ:

    - คำสั่งกำหนดเองเป็นเพียงรายการเมนูเท่านั้น; ไม่ได้ implement พฤติกรรมอัตโนมัติ
    - คำสั่งของ plugin/skill ยังทำงานได้เมื่อพิมพ์ แม้จะไม่แสดงในเมนู Telegram

    หากปิดใช้งานคำสั่งดั้งเดิม built-in จะถูกลบ คำสั่ง custom/plugin อาจยังลงทะเบียนได้หากกำหนดค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังล้นหลังจากตัดรายการแล้ว; ลดคำสั่ง plugin/skill/custom หรือปิด `channels.telegram.commands.native`
    - `deleteWebhook`, `deleteMyCommands` หรือ `setMyCommands` ล้มเหลวพร้อม `404: Not Found` ขณะที่คำสั่ง curl ของ Bot API โดยตรงทำงานได้ อาจหมายความว่า `channels.telegram.apiRoot` ถูกตั้งเป็น endpoint `/bot<TOKEN>` แบบเต็ม `apiRoot` ต้องเป็นเพียง root ของ Bot API เท่านั้น และ `openclaw doctor --fix` จะลบ `/bot<TOKEN>` ต่อท้ายที่เกิดขึ้นโดยไม่ตั้งใจ
    - `getMe returned 401` หมายความว่า Telegram ปฏิเสธ token ของบอทที่กำหนดค่าไว้ อัปเดต `botToken`, `tokenFile` หรือ `TELEGRAM_BOT_TOKEN` ด้วย token ปัจจุบันจาก BotFather; OpenClaw จะหยุดก่อน polling ดังนั้นกรณีนี้จะไม่ถูกรายงานเป็นความล้มเหลวในการล้าง webhook
    - `setMyCommands failed` พร้อมข้อผิดพลาด network/fetch มักหมายความว่า outbound DNS/HTTPS ไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งจับคู่อุปกรณ์ (plugin `device-pair`)

    เมื่อ plugin `device-pair` ติดตั้งอยู่:

    1. `/pair` สร้างโค้ดตั้งค่า
    2. วางโค้ดในแอป iOS
    3. `/pair pending` แสดงรายการคำขอที่รอดำเนินการ (รวม role/scopes)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบระบุชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    โค้ดตั้งค่ามี bootstrap token อายุสั้น bootstrap ด้วย setup-code ในตัวเป็นแบบ node-only: การเชื่อมต่อครั้งแรกจะสร้างคำขอ node ที่รอดำเนินการ และหลังอนุมัติ Gateway จะคืน token ของ node ที่คงทนพร้อม `scopes: []` ไม่ได้คืน token ผู้ปฏิบัติงานที่ hand off แล้ว; การเข้าถึงของผู้ปฏิบัติงานต้องใช้การจับคู่ผู้ปฏิบัติงานที่อนุมัติแยกต่างหากหรือ flow token แยกต่างหาก

    หากอุปกรณ์ลองใหม่ด้วยรายละเอียด auth ที่เปลี่ยนไป (เช่น role/scopes/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูก supersede และคำขอใหม่จะใช้ `requestId` อื่น รัน `/pair pending` อีกครั้งก่อนอนุมัติ

    รายละเอียดเพิ่มเติม: [การจับคู่](/th/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="ปุ่มแบบอินไลน์">
    กำหนดค่าขอบเขตแป้นพิมพ์แบบอินไลน์:

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

    ปุ่ม Telegram `web_app` ทำงานเฉพาะในแชตส่วนตัวระหว่างผู้ใช้กับ
    บอตเท่านั้น

    การคลิกคอลแบ็กจะถูกส่งให้เอเจนต์เป็นข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="การดำเนินการกับข้อความ Telegram สำหรับเอเจนต์และระบบอัตโนมัติ">
    การดำเนินการของเครื่องมือ Telegram ประกอบด้วย:

    - `sendMessage` (`to`, `content`, ตัวเลือก `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` หรือ `caption`, ตัวเลือกปุ่มอินไลน์ `presentation`; การแก้ไขเฉพาะปุ่มจะอัปเดตมาร์กอัปการตอบกลับ)
    - `createForumTopic` (`chatId`, `name`, ตัวเลือก `iconColor`, `iconCustomEmojiId`)

    การดำเนินการกับข้อความของช่องทางแสดงนามแฝงที่ใช้งานง่าย (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    การควบคุมเกต:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้งาน)

    หมายเหตุ: ขณะนี้ `edit` และ `topic-create` เปิดใช้งานโดยค่าเริ่มต้น และไม่มีตัวสลับ `channels.telegram.actions.*` แยกต่างหาก
    การส่งขณะรันไทม์ใช้สแนปช็อตการกำหนดค่า/ความลับที่ใช้งานอยู่ (เริ่มต้น/โหลดใหม่) ดังนั้นเส้นทางการดำเนินการจะไม่ทำการแก้ค่า SecretRef แบบเฉพาะกิจซ้ำต่อการส่งแต่ละครั้ง

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

    เมื่อเปิดใช้งานเธรดการตอบกลับและมีข้อความหรือคำบรรยาย Telegram ต้นฉบับ OpenClaw จะรวมข้อความอ้างอิง Telegram แบบเนทีฟโดยอัตโนมัติ Telegram จำกัดข้อความอ้างอิงเนทีฟไว้ที่ 1024 หน่วยรหัส UTF-16 ดังนั้นข้อความที่ยาวกว่าจะถูกอ้างอิงจากจุดเริ่มต้น และจะถอยกลับเป็นการตอบกลับแบบธรรมดาหาก Telegram ปฏิเสธการอ้างอิง

    หมายเหตุ: `off` ปิดใช้งานเธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงได้รับการปฏิบัติตาม

  </Accordion>

  <Accordion title="หัวข้อฟอรัมและพฤติกรรมของเธรด">
    ซูเปอร์กรุ๊ปแบบฟอรัม:

    - คีย์เซสชันของหัวข้อเติม `:topic:<threadId>` ต่อท้าย
    - การตอบกลับและการแสดงสถานะกำลังพิมพ์มุ่งไปยังเธรดหัวข้อ
    - เส้นทางการกำหนดค่าหัวข้อ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของหัวข้อทั่วไป (`threadId=1`):

    - การส่งข้อความละเว้น `message_thread_id` (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - การดำเนินการกำลังพิมพ์ยังคงรวม `message_thread_id`

    การสืบทอดของหัวข้อ: รายการหัวข้อสืบทอดการตั้งค่ากลุ่ม เว้นแต่จะถูกแทนที่ (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` ใช้เฉพาะหัวข้อและไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม
    `topics."*"` ตั้งค่าเริ่มต้นสำหรับทุกหัวข้อในกลุ่มนั้น; ID หัวข้อที่ตรงกันยังคงมีลำดับความสำคัญเหนือ `"*"`

    **การกำหนดเส้นทางเอเจนต์ต่อหัวข้อ**: แต่ละหัวข้อสามารถกำหนดเส้นทางไปยังเอเจนต์คนละตัวได้ด้วยการตั้งค่า `agentId` ในการกำหนดค่าหัวข้อ สิ่งนี้ทำให้แต่ละหัวข้อมีเวิร์กสเปซ หน่วยความจำ และเซสชันที่แยกจากกัน ตัวอย่าง:

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

    จากนั้นแต่ละหัวข้อจะมีคีย์เซสชันของตนเอง: `agent:zu:telegram:group:-1001234567890:topic:3`

    **การผูกหัวข้อ ACP แบบถาวร**: หัวข้อฟอรัมสามารถปักหมุดเซสชันฮาร์เนส ACP ผ่านการผูก ACP แบบมีชนิดที่ระดับบนสุด (`bindings[]` พร้อม `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ ID ที่ระบุหัวข้อ เช่น `-1001234567890:topic:42`) ขณะนี้จำกัดขอบเขตไว้ที่หัวข้อฟอรัมในกลุ่ม/ซูเปอร์กรุ๊ป ดู [เอเจนต์ ACP](/th/tools/acp-agents)

    **การสปอว์น ACP ที่ผูกกับเธรดจากแชต**: `/acp spawn <agent> --thread here|auto` ผูกหัวข้อปัจจุบันกับเซสชัน ACP ใหม่; ข้อความติดตามผลจะกำหนดเส้นทางไปที่นั่นโดยตรง OpenClaw ปักหมุดการยืนยันการสปอว์นไว้ในหัวข้อ ต้องให้ `channels.telegram.threadBindings.spawnSessions` ยังคงเปิดใช้งานอยู่ (ค่าเริ่มต้น: `true`)

    บริบทเทมเพลตแสดง `MessageThreadId` และ `IsForum` แชต DM ที่มี `message_thread_id` จะเก็บเมทาดาทาการตอบกลับไว้; แชตเหล่านั้นใช้คีย์เซสชันที่รับรู้เธรดเฉพาะเมื่อ Telegram `getMe` รายงาน `has_topics_enabled: true` สำหรับบอตเท่านั้น
    การแทนที่ `dm.threadReplies` และ `direct.*.threadReplies` เดิมถูกปลดออกโดยตั้งใจ; ใช้โหมดเธรดของ BotFather เป็นแหล่งความจริงเดียว และรัน `openclaw doctor --fix` เพื่อลบคีย์การกำหนดค่าที่ล้าสมัย

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยกความแตกต่างระหว่างบันทึกเสียงกับไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมแบบไฟล์เสียง
    - แท็ก `[[audio_as_voice]]` ในการตอบกลับของเอเจนต์เพื่อบังคับให้ส่งเป็นบันทึกเสียง
    - ทรานสคริปต์บันทึกเสียงขาเข้าถูกจัดกรอบเป็นข้อความที่สร้างโดยเครื่อง
      และไม่น่าเชื่อถือในบริบทของเอเจนต์; การตรวจจับการกล่าวถึงยังคงใช้
      ทรานสคริปต์ดิบ ดังนั้นข้อความเสียงที่ถูกเกตด้วยการกล่าวถึงจึงยังทำงานต่อไป

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

    โน้ตวิดีโอไม่รองรับคำบรรยายประกอบ ข้อความที่ระบุไว้จะถูกส่งแยกต่างหาก

    ### สติกเกอร์

    การจัดการสติกเกอร์ขาเข้า:

    - WEBP แบบคงที่: ดาวน์โหลดและประมวลผล (placeholder `<media:sticker>`)
    - TGS แบบเคลื่อนไหว: ข้าม
    - WEBM วิดีโอ: ข้าม

    ฟิลด์บริบทของสติกเกอร์:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    คำอธิบายสติกเกอร์ถูกแคชไว้ในสถานะ Plugin ของ OpenClaw SQLite เพื่อลดการเรียกใช้งานวิชันซ้ำ

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
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="การแจ้งเตือนรีแอ็กชัน">
    รีแอ็กชันของ Telegram เข้ามาเป็นการอัปเดต `message_reaction` (แยกจากเพย์โหลดข้อความ)

    เมื่อเปิดใช้งาน OpenClaw จะจัดคิวเหตุการณ์ระบบ เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    การกำหนดค่า:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงรีแอ็กชันของผู้ใช้ต่อข้อความที่บอตส่งเท่านั้น (แบบพยายามให้ดีที่สุดผ่านแคชข้อความที่ส่งแล้ว)
    - เหตุการณ์รีแอ็กชันยังคงเคารพการควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ให้รหัสเธรดในการอัปเดตรีแอ็กชัน
      - กลุ่มที่ไม่ใช่ฟอรัมจะส่งต่อไปยังเซสชันแชตกลุ่ม
      - กลุ่มฟอรัมจะส่งต่อไปยังเซสชันหัวข้อทั่วไปของกลุ่ม (`:topic:1`) ไม่ใช่หัวข้อต้นทางที่แน่นอน

    `allowed_updates` สำหรับการโพล/Webhook จะรวม `message_reaction` โดยอัตโนมัติ

  </Accordion>

  <Accordion title="รีแอ็กชันรับทราบ">
    `ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า `ackReactionScope` ตัดสินว่าอีโมจินั้นจะถูกส่งจริง *เมื่อใด*

    **ลำดับการแก้ค่าอีโมจิ (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - อีโมจิสำรองจากตัวตนของเอเจนต์ (`agents.list[].identity.emoji` มิฉะนั้นใช้ "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิยูนิโค้ด (เช่น "👀")
    - ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับแชนเนลหรือบัญชี

    **ขอบเขต (`messages.ackReactionScope`):**

    ผู้ให้บริการ Telegram อ่านขอบเขตจาก `messages.ackReactionScope` (ค่าเริ่มต้น `"group-mentions"`) ปัจจุบันไม่มีการ override ระดับบัญชี Telegram หรือระดับแชนเนล Telegram

    ค่า: `"all"` (ข้อความส่วนตัว + กลุ่ม), `"direct"` (เฉพาะข้อความส่วนตัว), `"group-all"` (ทุกข้อความกลุ่ม ไม่มีข้อความส่วนตัว), `"group-mentions"` (กลุ่มเมื่อมีการกล่าวถึงบอต; **ไม่มีข้อความส่วนตัว** — นี่คือค่าเริ่มต้น), `"off"` / `"none"` (ปิดใช้งาน)

    <Note>
    ขอบเขตเริ่มต้น (`"group-mentions"`) จะไม่เรียกรีแอ็กชันรับทราบในข้อความส่วนตัว หากต้องการให้มีรีแอ็กชันรับทราบกับข้อความส่วนตัวขาเข้าของ Telegram ให้ตั้ง `messages.ackReactionScope` เป็น `"direct"` หรือ `"all"` ค่านี้ถูกอ่านเมื่อผู้ให้บริการ Telegram เริ่มทำงาน ดังนั้นต้องรีสตาร์ต Gateway เพื่อให้การเปลี่ยนแปลงมีผล
    </Note>

  </Accordion>

  <Accordion title="การเขียนการกำหนดค่าจากเหตุการณ์และคำสั่งของ Telegram">
    การเขียนการกำหนดค่าแชนเนลเปิดใช้งานโดยค่าเริ่มต้น (`configWrites !== false`)

    การเขียนที่ถูกทริกเกอร์โดย Telegram รวมถึง:

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

  <Accordion title="การโพลแบบยาวเทียบกับ Webhook">
    ค่าเริ่มต้นคือการโพลแบบยาว สำหรับโหมด Webhook ให้ตั้ง `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; ตัวเลือกเสริมคือ `webhookPath`, `webhookHost`, `webhookPort` (ค่าเริ่มต้น `/telegram-webhook`, `127.0.0.1`, `8787`)

    ในโหมดการโพลแบบยาว OpenClaw จะคง watermark สำหรับการรีสตาร์ตไว้หลังจากส่งต่อการอัปเดตสำเร็จแล้วเท่านั้น หากตัวจัดการล้มเหลว การอัปเดตนั้นจะยังลองซ้ำได้ในโปรเซสเดียวกัน และจะไม่ถูกเขียนว่าเสร็จสมบูรณ์สำหรับการตัดซ้ำหลังรีสตาร์ต

    ตัวรับฟังในเครื่องผูกกับ `127.0.0.1:8787` สำหรับทางเข้าจากสาธารณะ ให้ตั้ง reverse proxy ไว้หน้า local port หรือตั้ง `webhookHost: "0.0.0.0"` อย่างตั้งใจ

    โหมด Webhook ตรวจสอบ guard ของคำขอ โทเค็นลับของ Telegram และเนื้อหา JSON ก่อนส่งคืน `200` ให้ Telegram
    จากนั้น OpenClaw จะประมวลผลการอัปเดตแบบอะซิงโครนัสผ่านเลนบอตต่อแชต/ต่อหัวข้อเดียวกับที่ใช้ในการโพลแบบยาว ดังนั้นเทิร์นของเอเจนต์ที่ช้าจะไม่ทำให้ ACK การส่งของ Telegram ค้าง

  </Accordion>

  <Accordion title="ขีดจำกัด การลองใหม่ และเป้าหมาย CLI">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` จะเลือกขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนการแยกตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ขาเข้าและขาออก
    - `channels.telegram.mediaGroupFlushMs` (ค่าเริ่มต้น 500) ควบคุมระยะเวลาที่อัลบั้ม/กลุ่มสื่อของ Telegram จะถูกบัฟเฟอร์ไว้ก่อนที่ OpenClaw จะส่งออกเป็นข้อความขาเข้าเดียว เพิ่มค่านี้หากส่วนต่าง ๆ ของอัลบั้มมาถึงช้า ลดค่านี้เพื่อลดเวลาแฝงของการตอบกลับอัลบั้ม
    - `channels.telegram.timeoutSeconds` แทนที่ timeout ของไคลเอนต์ Telegram API (หากไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY) ไคลเอนต์บอทจะจำกัดค่าที่ตั้งไว้ให้อยู่ต่ำกว่า guard คำขอข้อความ/การพิมพ์ขาออก 60 วินาที เพื่อให้ grammY ไม่ยกเลิกการส่งคำตอบที่มองเห็นได้ก่อนที่ transport guard และ fallback ของ OpenClaw จะทำงานได้ Long polling ยังคงใช้ guard คำขอ `getUpdates` 45 วินาที เพื่อไม่ให้ poll ที่ว่างอยู่ถูกทิ้งไว้อย่างไม่มีกำหนด
    - `channels.telegram.pollingStallThresholdMs` มีค่าเริ่มต้นเป็น `120000`; ปรับค่าระหว่าง `30000` ถึง `600000` เฉพาะสำหรับการรีสตาร์ท polling-stall ที่เป็นผลบวกเทียม
    - ประวัติบริบทกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` ปิดใช้งาน
    - บริบทเสริมจากการตอบกลับ/อ้างอิง/ส่งต่อจะถูกทำให้เป็นมาตรฐานเข้าในหน้าต่างบริบทการสนทนาที่เลือกไว้หนึ่งรายการ เมื่อ gateway สังเกตเห็นข้อความแม่แล้ว แคชข้อความที่สังเกตเห็นอยู่ในสถานะ Plugin SQLite ของ OpenClaw และ `openclaw doctor --fix` จะนำเข้า sidecar รุ่นเก่า Telegram รวม `reply_to_message` แบบตื้นเพียงหนึ่งรายการในอัปเดตเท่านั้น ดังนั้นเชนที่เก่ากว่าแคชจะถูกจำกัดตาม payload อัปเดตปัจจุบันของ Telegram
    - allowlist ของ Telegram ใช้กำกับเป็นหลักว่าใครสามารถทริกเกอร์ agent ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบเต็ม
    - การควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - คอนฟิก `channels.telegram.retry` ใช้กับตัวช่วยส่งของ Telegram (CLI/tools/actions) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้ การส่งคำตอบสุดท้ายขาเข้ายังใช้การลองส่งซ้ำแบบ safe-send ที่มีขอบเขตสำหรับความล้มเหลวก่อนเชื่อมต่อของ Telegram แต่จะไม่ลองซ้ำกับซองเครือข่ายหลังส่งที่กำกวม ซึ่งอาจทำให้ข้อความที่มองเห็นได้ซ้ำกัน

    เป้าหมายการส่งของ CLI และ message-tool สามารถเป็น chat ID แบบตัวเลข username หรือเป้าหมาย forum topic:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    poll ของ Telegram ใช้ `openclaw message poll` และรองรับ forum topic:

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
    - `--thread-id` สำหรับ forum topic (หรือใช้เป้าหมาย `:topic:`)

    การส่งของ Telegram ยังรองรับ:

    - `--presentation` พร้อมบล็อก `buttons` สำหรับ inline keyboard เมื่อ `channels.telegram.capabilities.inlineButtons` อนุญาต
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอการส่งแบบปักหมุดเมื่อบอทสามารถปักหมุดในแชตนั้นได้
    - `--force-document` เพื่อส่งรูปภาพ GIF และวิดีโอขาออกเป็นเอกสารแทนการอัปโหลดเป็นรูปภาพที่บีบอัด สื่อแบบเคลื่อนไหว หรือวิดีโอ

    การกำกับ action:

    - `channels.telegram.actions.sendMessage=false` ปิดใช้งานข้อความ Telegram ขาออก รวมถึง poll
    - `channels.telegram.actions.poll=false` ปิดใช้งานการสร้าง poll ของ Telegram โดยยังเปิดใช้การส่งปกติไว้

  </Accordion>

  <Accordion title="การอนุมัติ exec ใน Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถโพสต์ prompt ในแชตหรือตัว topic ต้นทางได้ตามตัวเลือก ผู้อนุมัติต้องเป็น Telegram user ID แบบตัวเลข

    เส้นทางคอนฟิก:

    - `channels.telegram.execApprovals.enabled` (เปิดใช้อัตโนมัติเมื่อ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งคน)
    - `channels.telegram.execApprovals.approvers` (fallback ไปยัง owner ID แบบตัวเลขจาก `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` และ `defaultTo` ควบคุมว่าใครคุยกับบอทได้และบอทส่งคำตอบปกติไปที่ใด สิ่งเหล่านี้ไม่ได้ทำให้ใครเป็นผู้อนุมัติ exec การจับคู่ DM ที่อนุมัติครั้งแรกจะ bootstrap `commands.ownerAllowFrom` เมื่อยังไม่มีเจ้าของคำสั่ง ดังนั้นการตั้งค่าแบบเจ้าของหนึ่งคนยังทำงานได้โดยไม่ต้องทำ ID ซ้ำใต้ `execApprovals.approvers`

    การส่งในช่องจะแสดงข้อความคำสั่งในแชต เปิดใช้ `channel` หรือ `both` เฉพาะในกลุ่ม/topic ที่เชื่อถือได้ เมื่อ prompt ไปถึง forum topic OpenClaw จะคง topic นั้นไว้สำหรับ prompt อนุมัติและการติดตามผล การอนุมัติ exec จะหมดอายุหลัง 30 นาทีตามค่าเริ่มต้น

    ปุ่มอนุมัติแบบ inline ยังต้องให้ `channels.telegram.capabilities.inlineButtons` อนุญาตพื้นผิวเป้าหมาย (`dm`, `group` หรือ `all`) ด้วย ID การอนุมัติที่ขึ้นต้นด้วย `plugin:` จะ resolve ผ่านการอนุมัติของ plugin; รายการอื่นจะ resolve ผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## การควบคุมการตอบกลับข้อผิดพลาด

เมื่อ agent พบข้อผิดพลาดด้านการส่งหรือ provider Telegram สามารถตอบกลับด้วยข้อความข้อผิดพลาดหรือปิดการแสดงผลได้ คีย์คอนฟิกสองรายการควบคุมพฤติกรรมนี้:

| คีย์                                | ค่า              | ค่าเริ่มต้น | คำอธิบาย                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` ส่งข้อความข้อผิดพลาดที่เป็นมิตรไปยังแชต `silent` ปิดการตอบกลับข้อผิดพลาดทั้งหมด |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | เวลาขั้นต่ำระหว่างการตอบกลับข้อผิดพลาดไปยังแชตเดียวกัน ป้องกันสแปมข้อผิดพลาดระหว่างเหตุขัดข้อง        |

รองรับการแทนที่รายบัญชี รายกลุ่ม และราย topic (ใช้การสืบทอดเดียวกับคีย์คอนฟิก Telegram อื่น ๆ)

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

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="บอทไม่ตอบกลับข้อความกลุ่มที่ไม่ได้ mention">

    - หาก `requireMention=false` โหมดความเป็นส่วนตัวของ Telegram ต้องอนุญาตการมองเห็นแบบเต็ม
      - BotFather: `/setprivacy` -> Disable
      - จากนั้นลบ + เพิ่มบอทกลับเข้าไปในกลุ่ม
    - `openclaw channels status` จะเตือนเมื่อคอนฟิกคาดหวังข้อความกลุ่มที่ไม่ได้ mention
    - `openclaw channels status --probe` สามารถตรวจสอบ group ID แบบตัวเลขที่ระบุชัดเจนได้; wildcard `"*"` ไม่สามารถ probe membership ได้
    - การทดสอบเซสชันแบบเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอทไม่เห็นข้อความกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` กลุ่มต้องถูกระบุไว้ (หรือรวม `"*"`)
    - ตรวจสอบ membership ของบอทในกลุ่ม
    - ตรวจสอบ log: `openclaw logs --follow` เพื่อดูเหตุผลการข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานบางส่วนหรือไม่ทำงานเลย">

    - อนุญาตตัวตนผู้ส่งของคุณ (การจับคู่และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังคงมีผลแม้นโยบายกลุ่มจะเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู native มีรายการมากเกินไป; ลดคำสั่งของ plugin/skill/custom หรือปิดเมนู native
    - การเรียก startup `deleteMyCommands` / `setMyCommands` และการเรียก typing `sendChatAction` ถูกจำกัดขอบเขตและลองใหม่หนึ่งครั้งผ่าน transport fallback ของ Telegram เมื่อคำขอ timeout ข้อผิดพลาด network/fetch ที่เกิดซ้ำมักบ่งชี้ปัญหาการเข้าถึง DNS/HTTPS ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="Startup รายงาน token ที่ไม่ได้รับอนุญาต">

    - `getMe returned 401` คือความล้มเหลวในการยืนยันตัวตนของ Telegram สำหรับ bot token ที่ตั้งค่าไว้
    - คัดลอกใหม่หรือสร้าง bot token ใหม่ใน BotFather แล้วอัปเดต `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` หรือ `TELEGRAM_BOT_TOKEN` สำหรับบัญชีเริ่มต้น
    - `deleteWebhook 401 Unauthorized` ระหว่าง startup ก็เป็นความล้มเหลวด้าน auth เช่นกัน; การปฏิบัติต่อมันเหมือน "ไม่มี webhook อยู่" จะเพียงเลื่อนความล้มเหลวจาก bad-token เดิมไปยังการเรียก API ภายหลังเท่านั้น

  </Accordion>

  <Accordion title="Polling หรือเครือข่ายไม่เสถียร">

    - Node 22+ + fetch/proxy แบบกำหนดเองอาจทริกเกอร์พฤติกรรม abort ทันทีหากชนิด AbortSignal ไม่ตรงกัน
    - host บางตัว resolve `api.telegram.org` เป็น IPv6 ก่อน; egress IPv6 ที่เสียอาจทำให้ Telegram API ล้มเหลวเป็นครั้งคราว
    - หาก log มี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!` ตอนนี้ OpenClaw จะลองใหม่กับรายการเหล่านี้ในฐานะข้อผิดพลาดเครือข่ายที่กู้คืนได้
    - ระหว่าง polling startup OpenClaw จะใช้ probe startup `getMe` ที่สำเร็จซ้ำสำหรับ grammY เพื่อให้ runner ไม่ต้องใช้ `getMe` ครั้งที่สองก่อน `getUpdates` ครั้งแรก
    - หาก `deleteWebhook` ล้มเหลวด้วยข้อผิดพลาดเครือข่ายชั่วคราวระหว่าง polling startup OpenClaw จะดำเนินต่อเข้าสู่ long polling แทนการเรียก control-plane ก่อน poll อีกครั้ง webhook ที่ยัง active อยู่จะแสดงเป็น conflict ของ `getUpdates`; จากนั้น OpenClaw จะสร้าง transport ของ Telegram ใหม่และลอง cleanup webhook ใหม่
    - หาก socket ของ Telegram ถูก recycle ในรอบเวลาคงที่สั้น ๆ ให้ตรวจสอบ `channels.telegram.timeoutSeconds` ที่ต่ำ; ไคลเอนต์บอทจะจำกัดค่าที่ตั้งไว้ให้อยู่ต่ำกว่า guard คำขอขาออกและ `getUpdates` แต่ release เก่ากว่าอาจ abort ทุก poll หรือคำตอบเมื่อค่านี้ถูกตั้งไว้ต่ำกว่า guard เหล่านั้น
    - หาก log มี `Polling stall detected` OpenClaw จะรีสตาร์ท polling และสร้าง transport ของ Telegram ใหม่หลังจากไม่มี liveness ของ long-poll ที่เสร็จสมบูรณ์เป็นเวลา 120 วินาทีตามค่าเริ่มต้น
    - `openclaw channels status --probe` และ `openclaw doctor` จะเตือนเมื่อบัญชี polling ที่กำลังทำงานยังทำ `getUpdates` ไม่เสร็จหลัง startup grace, เมื่อบัญชี webhook ที่กำลังทำงานยังทำ `setWebhook` ไม่เสร็จหลัง startup grace หรือเมื่อกิจกรรม transport polling ที่สำเร็จล่าสุดเก่าเกินไป
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่รันนานยังปกติแต่ host ของคุณยังรายงานการรีสตาร์ท polling-stall แบบผลบวกเทียม stall ที่เกิดซ้ำมักชี้ไปที่ปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่าง host กับ `api.telegram.org`
    - Telegram ยังเคารพ env proxy ของ process สำหรับ transport ของ Bot API รวมถึง `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และตัวแปรแบบตัวพิมพ์เล็กของแต่ละรายการ `NO_PROXY` / `no_proxy` ยังสามารถ bypass `api.telegram.org` ได้
    - หาก proxy ที่ OpenClaw จัดการถูกตั้งค่าผ่าน `OPENCLAW_PROXY_URL` สำหรับสภาพแวดล้อมบริการ และไม่มี env proxy มาตรฐานอยู่ Telegram จะใช้ URL นั้นสำหรับ transport ของ Bot API ด้วย
    - บน host VPS ที่ egress/TLS ตรงไม่เสถียร ให้ route การเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ มีค่าเริ่มต้นเป็น `autoSelectFamily=true` (ยกเว้น WSL2) ลำดับผลลัพธ์ DNS ของ Telegram เคารพ `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER` จากนั้น `channels.telegram.network.dnsResultOrder` จากนั้นค่าเริ่มต้นของ process เช่น `NODE_OPTIONS=--dns-result-order=ipv4first`; หากไม่มีรายการใดมีผล Node 22+ จะ fallback ไปที่ `ipv4first`
    - หาก host ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนกับพฤติกรรม IPv4-only ให้บังคับการเลือก family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - อนุญาตคำตอบช่วงเบนช์มาร์ก RFC 2544 (`198.18.0.0/15`) สำหรับการดาวน์โหลดสื่อของ Telegram อยู่แล้วตามค่าเริ่มต้น หาก fake-IP ที่เชื่อถือได้หรือพร็อกซีแบบโปร่งใสเขียน `api.telegram.org` ใหม่เป็นที่อยู่ private/internal/special-use อื่นระหว่างการดาวน์โหลดสื่อ คุณสามารถเลือกเปิดใช้การข้ามเฉพาะ Telegram ได้ดังนี้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - การเลือกเปิดใช้แบบเดียวกันมีให้ต่อบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หากพร็อกซีของคุณ resolve โฮสต์สื่อของ Telegram เป็น `198.18.x.x` ให้ปิด
      แฟล็กอันตรายไว้ก่อน สื่อของ Telegram อนุญาตช่วงเบนช์มาร์ก RFC 2544
      อยู่แล้วตามค่าเริ่มต้น

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` ทำให้การป้องกัน
      SSRF สำหรับสื่อของ Telegram อ่อนลง ใช้เฉพาะในสภาพแวดล้อมพร็อกซีที่เชื่อถือได้
      และควบคุมโดยผู้ปฏิบัติงาน เช่น การกำหนดเส้นทาง fake-IP ของ Clash, Mihomo หรือ
      Surge เมื่อระบบเหล่านั้นสังเคราะห์คำตอบ private หรือ special-use นอกช่วงเบนช์มาร์ก
      RFC 2544 ปล่อยให้ปิดไว้สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ
    </Warning>

    - การแทนที่ผ่านสภาพแวดล้อม (ชั่วคราว):
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

ความช่วยเหลือเพิ่มเติม: [การแก้ปัญหา Channel](/th/channels/troubleshooting)

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Telegram](/th/gateway/config-channels#telegram)

<Accordion title="High-signal Telegram fields">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; symlink จะถูกปฏิเสธ)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- ค่าเริ่มต้นของหัวข้อ: `groups.<chatId>.topics."*"` ใช้กับหัวข้อฟอรัมที่ไม่ตรงกัน; ID หัวข้อแบบตรงตัวจะเขียนทับค่านี้
- การอนุมัติ exec: `execApprovals`, `accounts.*.execApprovals`
- คำสั่ง/เมนู: `commands.native`, `commands.nativeSkills`, `customCommands`
- เธรด/การตอบกลับ: `replyToMode`
- การสตรีม: `streaming` (ตัวอย่าง), `streaming.preview.toolProgress`, `blockStreaming`
- การจัดรูปแบบ/การส่ง: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- สื่อ/เครือข่าย: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- root API แบบกำหนดเอง: `apiRoot` (root ของ Bot API เท่านั้น; อย่าใส่ `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- การดำเนินการ/ความสามารถ: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaction: `reactionNotifications`, `reactionLevel`
- ข้อผิดพลาด: `errorPolicy`, `errorCooldownMs`
- การเขียน/ประวัติ: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญแบบหลายบัญชี: เมื่อกำหนดค่า ID บัญชีตั้งแต่สองรายการขึ้นไป ให้ตั้งค่า `channels.telegram.defaultAccount` (หรือใส่ `channels.telegram.accounts.default`) เพื่อทำให้การกำหนดเส้นทางเริ่มต้นชัดเจน มิฉะนั้น OpenClaw จะย้อนกลับไปใช้ ID บัญชีแรกที่ผ่านการ normalize แล้ว และ `openclaw doctor` จะแจ้งเตือน บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom` แต่ไม่สืบทอดค่า `accounts.default.*`
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Telegram กับ gateway
  </Card>
  <Card title="Groups" icon="users" href="/th/channels/groups">
    พฤติกรรม allowlist ของกลุ่มและหัวข้อ
  </Card>
  <Card title="Channel routing" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยัง agent
  </Card>
  <Card title="Security" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเสริมความแข็งแกร่ง
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกลุ่มและหัวข้อกับ agent
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้าม Channel
  </Card>
</CardGroup>
