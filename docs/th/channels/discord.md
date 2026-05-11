---
read_when:
    - การพัฒนาฟีเจอร์ช่องทาง Discord
summary: สถานะการรองรับบอต Discord ความสามารถ และการกำหนดค่า
title: Discord
x-i18n:
    generated_at: "2026-05-11T20:20:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70107cf53c44f80e42f99f670aacf6eed8b77d839c05bccc853cd91a7273e5aa
    source_path: channels/discord.md
    workflow: 16
---

พร้อมใช้งานสำหรับ DM และช่องกิลด์ผ่าน Discord gateway อย่างเป็นทางการ

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ Discord ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่งสแลช" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องและขั้นตอนการซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

คุณจะต้องสร้างแอปพลิเคชันใหม่พร้อมบอต เพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ และจับคู่บอตกับ OpenClaw เราแนะนำให้เพิ่มบอตของคุณไปยังเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากคุณยังไม่มี [ให้สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="สร้างแอปพลิเคชันและบอต Discord">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อประมาณว่า "OpenClaw"

    คลิก **Bot** บนแถบด้านข้าง ตั้งค่า **Username** เป็นชื่อที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้เจตนาแบบมีสิทธิพิเศษ">
    ยังอยู่ในหน้า **Bot** ให้เลื่อนลงไปที่ **Privileged Gateway Intents** และเปิดใช้:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับรายการอนุญาตบทบาทและการจับคู่ชื่อกับ ID)
    - **Presence Intent** (ไม่บังคับ; จำเป็นเฉพาะสำหรับการอัปเดตสถานะ presence)

  </Step>

  <Step title="คัดลอกโทเค็นบอตของคุณ">
    เลื่อนกลับขึ้นไปบนหน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อจะเป็นเช่นนั้น แต่นี่คือการสร้างโทเค็นแรกของคุณ — ไม่มีสิ่งใดถูก "รีเซ็ต"
    </Note>

    คัดลอกโทเค็นและบันทึกไว้ที่ใดที่หนึ่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในอีกไม่นาน

  </Step>

  <Step title="สร้าง URL คำเชิญและเพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** บนแถบด้านข้าง คุณจะสร้าง URL คำเชิญพร้อมสิทธิ์ที่ถูกต้องเพื่อเพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ

    เลื่อนลงไปที่ **OAuth2 URL Generator** และเปิดใช้:

    - `bot`
    - `applications.commands`

    ส่วน **Bot Permissions** จะปรากฏด้านล่าง เปิดใช้อย่างน้อย:

    **General Permissions**
      - ดูช่อง
    **Text Permissions**
      - ส่งข้อความ
      - อ่านประวัติข้อความ
      - ฝังลิงก์
      - แนบไฟล์
      - เพิ่มรีแอ็กชัน (ไม่บังคับ)

    นี่คือชุดพื้นฐานสำหรับช่องข้อความปกติ หากคุณวางแผนจะโพสต์ในเธรด Discord รวมถึงเวิร์กโฟลว์ช่องฟอรัมหรือสื่อที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้ **Send Messages in Threads** ด้วย
    คัดลอก URL ที่สร้างขึ้นด้านล่าง วางลงในเบราว์เซอร์ของคุณ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอตของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิดใช้โหมดนักพัฒนาและรวบรวม ID ของคุณ">
    กลับไปที่แอป Discord คุณต้องเปิดใช้โหมดนักพัฒนาเพื่อให้คัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนเฟืองข้างอวาตาร์ของคุณ) → **Advanced** → เปิด **Developer Mode**
    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ของคุณไว้คู่กับ Bot Token — คุณจะส่งทั้งสามรายการให้ OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาต DM จากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงานได้ Discord ต้องอนุญาตให้บอตส่ง DM ถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณ → **Privacy Settings** → เปิด **Direct Messages**

    การดำเนินการนี้ให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอต) ส่ง DM ถึงคุณได้ เปิดใช้งานสิ่งนี้ไว้หากคุณต้องการใช้ DM ของ Discord กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่องกิลด์ คุณสามารถปิด DM หลังจากจับคู่แล้วได้

  </Step>

  <Step title="ตั้งค่าโทเค็นบอตของคุณอย่างปลอดภัย (อย่าส่งในแชต)">
    โทเค็นบอต Discord ของคุณเป็นความลับ (เหมือนรหัสผ่าน) ตั้งค่าไว้บนเครื่องที่รัน OpenClaw ก่อนส่งข้อความถึงเอเจนต์ของคุณ

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    หาก OpenClaw กำลังรันเป็นบริการเบื้องหลังอยู่แล้ว ให้รีสตาร์ตผ่านแอป OpenClaw Mac หรือโดยหยุดและเริ่มกระบวนการ `openclaw gateway run` ใหม่
    สำหรับการติดตั้งบริการที่มีการจัดการ ให้รัน `openclaw gateway install` จากเชลล์ที่มี `DISCORD_BOT_TOKEN` อยู่ หรือเก็บตัวแปรไว้ใน `~/.openclaw/.env` เพื่อให้บริการแก้ค่า env SecretRef ได้หลังรีสตาร์ต
    หากโฮสต์ของคุณถูกบล็อกหรือถูกจำกัดอัตราโดยการค้นหาแอปพลิเคชันเริ่มต้นของ Discord ให้ตั้งค่า ID แอปพลิเคชัน/ไคลเอนต์ Discord จาก Developer Portal เพื่อให้การเริ่มต้นข้ามการเรียก REST นั้นได้ ใช้ `channels.discord.applicationId` สำหรับบัญชีเริ่มต้น หรือ `channels.discord.accounts.<accountId>.applicationId` เมื่อคุณรันบอต Discord หลายตัว

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        แชตกับเอเจนต์ OpenClaw ของคุณบนช่องที่มีอยู่ใดก็ได้ (เช่น Telegram) แล้วบอกมัน หาก Discord เป็นช่องแรกของคุณ ให้ใช้แท็บ CLI / การกำหนดค่าแทน

        > "ฉันตั้งค่าโทเค็นบอต Discord ในการกำหนดค่าแล้ว โปรดตั้งค่า Discord ให้เสร็จด้วย User ID `<user_id>` และ Server ID `<server_id>`"
      </Tab>
      <Tab title="CLI / การกำหนดค่า">
        หากคุณต้องการการกำหนดค่าแบบไฟล์ ให้ตั้งค่า:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        env สำรองสำหรับบัญชีเริ่มต้น:

```bash
DISCORD_BOT_TOKEN=...
```

        สำหรับการตั้งค่าแบบสคริปต์หรือระยะไกล ให้เขียนบล็อก JSON5 เดียวกันด้วย `openclaw config patch --file ./discord.patch.json5 --dry-run` แล้วรันอีกครั้งโดยไม่มี `--dry-run` รองรับค่า `token` แบบข้อความธรรมดา และรองรับค่า SecretRef สำหรับ `channels.discord.token` ใน provider แบบ env/file/exec เช่นกัน ดู [การจัดการความลับ](/th/gateway/secrets)

        สำหรับบอต Discord หลายตัว ให้เก็บโทเค็นบอตและ ID แอปพลิเคชันแต่ละรายการไว้ใต้บัญชีของมัน `channels.discord.applicationId` ระดับบนจะถูกสืบทอดโดยบัญชีต่าง ๆ ดังนั้นให้ตั้งค่าไว้ที่นั่นเฉพาะเมื่อทุกบัญชีควรใช้ ID แอปพลิเคชันเดียวกัน

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="อนุมัติการจับคู่ DM ครั้งแรก">
    รอจนกว่า gateway จะรันอยู่ จากนั้นส่ง DM ถึงบอตของคุณใน Discord บอตจะตอบกลับพร้อมรหัสการจับคู่

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        ส่งรหัสการจับคู่ให้เอเจนต์ของคุณบนช่องที่มีอยู่:

        > "อนุมัติรหัสการจับคู่ Discord นี้: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    รหัสการจับคู่หมดอายุหลังจาก 1 ชั่วโมง

    ตอนนี้คุณควรแชตกับเอเจนต์ของคุณใน Discord ผ่าน DM ได้แล้ว

  </Step>
</Steps>

<Note>
การแก้ค่าโทเค็นรับรู้บัญชี ค่าโทเค็นในการกำหนดค่าจะชนะ env สำรอง `DISCORD_BOT_TOKEN` ใช้เฉพาะสำหรับบัญชีเริ่มต้น
หากบัญชี Discord ที่เปิดใช้อยู่สองบัญชีแก้ค่าเป็นโทเค็นบอตเดียวกัน OpenClaw จะเริ่มตัวตรวจสอบ Gateway เพียงตัวเดียวสำหรับโทเค็นนั้น โทเค็นที่มาจากการกำหนดค่าจะชนะ env สำรองเริ่มต้น มิฉะนั้นบัญชีที่เปิดใช้เป็นรายการแรกจะชนะ และบัญชีที่ซ้ำจะถูกรายงานว่าปิดใช้งาน
สำหรับการเรียกออกขั้นสูง (เครื่องมือข้อความ/การดำเนินการของช่อง) จะใช้ `token` แบบระบุต่อการเรียกสำหรับการเรียกนั้น สิ่งนี้ใช้กับการส่งและการดำเนินการแบบอ่าน/โพรบ (เช่น read/search/fetch/thread/pins/permissions) การตั้งค่านโยบายบัญชี/การลองใหม่ยังคงมาจากบัญชีที่เลือกในสแนปช็อตรันไทม์ที่ใช้งานอยู่
</Note>

## แนะนำ: ตั้งค่าเวิร์กสเปซกิลด์

เมื่อ DM ทำงานแล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็นเวิร์กสเปซเต็มรูปแบบที่แต่ละช่องจะมีเซสชันเอเจนต์ของตัวเองพร้อมบริบทของตัวเอง แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีเพียงคุณกับบอตของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณลงในรายการอนุญาตกิลด์">
    สิ่งนี้ทำให้เอเจนต์ของคุณตอบกลับในช่องใดก็ได้บนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ DM

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เพิ่ม Discord Server ID `<server_id>` ของฉันลงในรายการอนุญาตกิลด์"
      </Tab>
      <Tab title="การกำหนดค่า">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="อนุญาตการตอบกลับโดยไม่ต้อง @mention">
    ตามค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในช่องกิลด์เฉพาะเมื่อถูก @mentioned สำหรับเซิร์ฟเวอร์ส่วนตัว คุณอาจต้องการให้ตอบทุกข้อความ

    ในช่องกิลด์ คำตอบสุดท้ายปกติของผู้ช่วยจะยังคงเป็นส่วนตัวตามค่าเริ่มต้น เอาต์พุต Discord ที่มองเห็นได้ต้องส่งอย่างชัดเจนด้วยเครื่องมือ `message` เพื่อให้เอเจนต์เฝ้าดูได้ตามค่าเริ่มต้นและโพสต์เฉพาะเมื่อมันตัดสินว่าการตอบกลับในช่องมีประโยชน์

    ซึ่งหมายความว่าโมเดลที่เลือกต้องเรียกใช้เครื่องมือได้อย่างน่าเชื่อถือ หาก Discord แสดงว่ากำลังพิมพ์และล็อกแสดงการใช้โทเค็นแต่ไม่มีข้อความที่โพสต์ ให้ตรวจล็อกเซสชันเพื่อดูข้อความผู้ช่วยที่มี `didSendViaMessagingTool: false` นั่นหมายความว่าโมเดลสร้างคำตอบสุดท้ายแบบส่วนตัวแทนที่จะเรียก `message(action=send)` เปลี่ยนไปใช้โมเดลที่เรียกเครื่องมือได้แข็งแกร่งกว่า หรือใช้การกำหนดค่าด้านล่างเพื่อคืนค่าคำตอบสุดท้ายอัตโนมัติแบบเดิม

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "อนุญาตให้เอเจนต์ของฉันตอบกลับบนเซิร์ฟเวอร์นี้โดยไม่ต้องถูก @mentioned"
      </Tab>
      <Tab title="การกำหนดค่า">
        ตั้งค่า `requireMention: false` ในการกำหนดค่ากิลด์ของคุณ:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

        หากต้องการคืนค่าคำตอบสุดท้ายอัตโนมัติแบบเดิมสำหรับห้องกลุ่ม/ช่อง ให้ตั้งค่า `messages.groupChat.visibleReplies: "automatic"`

      </Tab>
    </Tabs>

  </Step>

  <Step title="วางแผนเรื่องหน่วยความจำในช่องกิลด์">
    ตามค่าเริ่มต้น หน่วยความจำระยะยาว (MEMORY.md) จะโหลดเฉพาะในเซสชัน DM ช่องกิลด์จะไม่โหลด MEMORY.md โดยอัตโนมัติ

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เมื่อฉันถามคำถามในช่อง Discord ให้ใช้ memory_search หรือ memory_get หากคุณต้องการบริบทระยะยาวจาก MEMORY.md"
      </Tab>
      <Tab title="ด้วยตนเอง">
        หากคุณต้องการบริบทที่ใช้ร่วมกันในทุกช่อง ให้ใส่คำแนะนำที่เสถียรไว้ใน `AGENTS.md` หรือ `USER.md` (จะถูกฉีดเข้าไปในทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงตามต้องการด้วยเครื่องมือหน่วยความจำ
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างช่องบางช่องบนเซิร์ฟเวอร์ Discord ของคุณและเริ่มแชต เอเจนต์ของคุณสามารถเห็นชื่อช่อง และแต่ละช่องจะมีเซสชันแยกของตัวเอง — คุณจึงสามารถตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ได้ที่เหมาะกับเวิร์กโฟลว์ของคุณ

## โมเดลรันไทม์

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord
- การกำหนดเส้นทางการตอบกลับเป็นแบบกำหนดแน่นอน: การตอบกลับขาเข้าจาก Discord จะกลับไปยัง Discord
- เมทาดาทาของกิลด์/ช่อง Discord จะถูกเพิ่มไปยังพรอมป์ของโมเดลในฐานะบริบทที่ไม่น่าเชื่อถือ
  ไม่ใช่คำนำหน้าการตอบกลับที่ผู้ใช้มองเห็น หากโมเดลคัดลอกกรอบข้อมูลนั้น
  กลับมา OpenClaw จะลบเมทาดาทาที่คัดลอกออกจากการตอบกลับขาออกและจาก
  บริบทการเล่นซ้ำในอนาคต
- โดยค่าเริ่มต้น (`session.dmScope=main`) แชตโดยตรงจะแชร์เซสชันหลักของเอเจนต์ (`agent:main:main`)
- ช่องกิลด์จะแยกเป็นคีย์เซสชันต่างหาก (`agent:<agentId>:discord:channel:<channelId>`)
- Group DM จะถูกละเว้นโดยค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่งสแลชแบบเนทีฟทำงานในเซสชันคำสั่งที่แยกต่างหาก (`agent:<agentId>:discord:slash:<userId>`) ขณะเดียวกันยังคงพก `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่ถูกกำหนดเส้นทาง
- การส่งประกาศ cron/Heartbeat แบบข้อความล้วนไปยัง Discord จะใช้คำตอบสุดท้าย
  ที่ผู้ช่วยมองเห็นหนึ่งครั้ง ส่วนเพย์โหลดสื่อและคอมโพเนนต์แบบมีโครงสร้างยังคงเป็น
  หลายข้อความเมื่อเอเจนต์ส่งเพย์โหลดที่จัดส่งได้หลายรายการ

## ช่องฟอรัม

ช่องฟอรัมและช่องสื่อของ Discord ยอมรับเฉพาะโพสต์เธรดเท่านั้น OpenClaw รองรับสองวิธีในการสร้างโพสต์เหล่านี้:

- ส่งข้อความไปยังฟอรัมแม่ (`channel:<forumId>`) เพื่อสร้างเธรดอัตโนมัติ ชื่อเธรดจะใช้บรรทัดแรกที่ไม่ว่างของข้อความคุณ
- ใช้ `openclaw message thread create` เพื่อสร้างเธรดโดยตรง อย่าส่ง `--message-id` สำหรับช่องฟอรัม

ตัวอย่าง: ส่งไปยังฟอรัมแม่เพื่อสร้างเธรด

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

ตัวอย่าง: สร้างเธรดฟอรัมอย่างชัดเจน

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

ฟอรัมแม่ไม่ยอมรับคอมโพเนนต์ Discord หากคุณต้องการคอมโพเนนต์ ให้ส่งไปยังเธรดเอง (`channel:<threadId>`)

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับคอนเทนเนอร์คอมโพเนนต์ Discord v2 สำหรับข้อความเอเจนต์ ใช้เครื่องมือข้อความพร้อมเพย์โหลด `components` ผลลัพธ์จากการโต้ตอบจะถูกกำหนดเส้นทางกลับไปยังเอเจนต์ในฐานะข้อความขาเข้าปกติ และทำตามการตั้งค่า Discord `replyToMode` ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถวการดำเนินการอนุญาตปุ่มได้สูงสุด 5 ปุ่ม หรือเมนูเลือกเดี่ยวหนึ่งเมนู
- ประเภทการเลือก: `string`, `user`, `role`, `mentionable`, `channel`

โดยค่าเริ่มต้น คอมโพเนนต์ใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่อให้ปุ่ม การเลือก และฟอร์มใช้งานได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดผู้ที่คลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (ID ผู้ใช้ Discord, แท็ก หรือ `*`) เมื่อกำหนดค่าแล้ว ผู้ใช้ที่ไม่ตรงกันจะได้รับการปฏิเสธแบบชั่วคราว

คำสั่งสแลช `/model` และ `/models` จะเปิดตัวเลือกโมเดลแบบโต้ตอบ พร้อมดรอปดาวน์ผู้ให้บริการ โมเดล และรันไทม์ที่เข้ากันได้ รวมถึงขั้นตอนส่ง `/models add` เลิกใช้แล้ว และตอนนี้จะส่งคืนข้อความเลิกใช้แทนการลงทะเบียนโมเดลจากแชต คำตอบของตัวเลือกเป็นแบบชั่วคราว และมีเพียงผู้ใช้ที่เรียกใช้งานเท่านั้นที่ใช้ได้ เมนูเลือกของ Discord จำกัดไว้ที่ 25 ตัวเลือก ดังนั้นให้เพิ่มรายการ `provider/*` ไปยัง `agents.defaults.models` เมื่อคุณต้องการให้ตัวเลือกแสดงโมเดลที่ค้นพบแบบไดนามิกเฉพาะสำหรับผู้ให้บริการที่เลือก เช่น `openai-codex` หรือ `vllm`

ไฟล์แนบ:

- บล็อก `file` ต้องชี้ไปยังการอ้างอิงไฟล์แนบ (`attachment://<filename>`)
- ระบุไฟล์แนบผ่าน `media`/`path`/`filePath` (ไฟล์เดียว); ใช้ `media-gallery` สำหรับหลายไฟล์
- ใช้ `filename` เพื่อแทนที่ชื่ออัปโหลดเมื่อควรตรงกับการอ้างอิงไฟล์แนบ

ฟอร์มโมดัล:

- เพิ่ม `components.modal` พร้อมฟิลด์ได้สูงสุด 5 ฟิลด์
- ประเภทฟิลด์: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw เพิ่มปุ่มทริกเกอร์ให้อัตโนมัติ

ตัวอย่าง:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM `channels.discord.allowFrom` คือ allowlist DM ตามแบบบัญญัติ

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.discord.allowFrom` รวม `"*"`)
    - `disabled`

    หากนโยบาย DM ไม่ได้เปิด ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือได้รับพรอมป์ให้จับคู่ในโหมด `pairing`)

    ลำดับความสำคัญของหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - สำหรับบัญชีเดียว `allowFrom` มีลำดับความสำคัญเหนือ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตนเองและ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    `channels.discord.dm.policy` และ `channels.discord.dm.allowFrom` แบบเดิมยังคงอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    รูปแบบเป้าหมาย DM สำหรับการจัดส่ง:

    - `user:<id>`
    - การกล่าวถึง `<@id>`

    โดยปกติ ID ตัวเลขล้วนจะถูก resolve เป็น ID ช่องเมื่อค่าเริ่มต้นของช่องทำงานอยู่ แต่ ID ที่อยู่ใน DM `allowFrom` ที่มีผลของบัญชีจะถูกปฏิบัติเป็นเป้าหมาย DM ผู้ใช้เพื่อความเข้ากันได้

  </Tab>

  <Tab title="กลุ่มการเข้าถึง">
    DM ของ Discord และการอนุญาตคำสั่งข้อความสามารถใช้รายการ `accessGroup:<name>` แบบไดนามิกใน `channels.discord.allowFrom`

    ชื่อกลุ่มการเข้าถึงถูกแชร์ข้ามช่องข้อความ ใช้ `type: "message.senders"` สำหรับกลุ่มแบบคงที่ที่สมาชิกระบุด้วยไวยากรณ์ `allowFrom` ปกติของแต่ละช่อง หรือ `type: "discord.channelAudience"` เมื่อผู้ชม `ViewChannel` ปัจจุบันของช่อง Discord ควรกำหนดสมาชิกแบบไดนามิก พฤติกรรมกลุ่มการเข้าถึงที่แชร์มีเอกสารไว้ที่นี่: [กลุ่มการเข้าถึง](/th/channels/access-groups)

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    ช่องข้อความ Discord ไม่มีรายชื่อสมาชิกแยกต่างหาก `type: "discord.channelAudience"` จำลองสมาชิกเป็น: ผู้ส่ง DM เป็นสมาชิกของกิลด์ที่กำหนดค่าไว้ และในปัจจุบันมีสิทธิ์ `ViewChannel` ที่มีผลบนช่องที่กำหนดค่าไว้หลังจากใช้บทบาทและการเขียนทับของช่องแล้ว

    ตัวอย่าง: อนุญาตให้ทุกคนที่เห็น `#maintainers` ส่ง DM ถึงบอตได้ ขณะเดียวกันปิด DM สำหรับคนอื่นทั้งหมด

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    คุณสามารถผสมรายการแบบไดนามิกและแบบคงที่ได้:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    การค้นหาจะล้มเหลวแบบปิด หาก Discord ส่งคืน `Missing Access` การค้นหาสมาชิกล้มเหลว หรือช่องอยู่ในกิลด์อื่น ผู้ส่ง DM จะถูกถือว่าไม่ได้รับอนุญาต

    เปิดใช้ **Server Members Intent** ใน Discord Developer Portal สำหรับบอตเมื่อใช้กลุ่มการเข้าถึงแบบผู้ชมช่อง DM ไม่มีสถานะสมาชิกกิลด์ ดังนั้น OpenClaw จะ resolve สมาชิกผ่าน Discord REST ณ เวลาอนุญาต

  </Tab>

  <Tab title="นโยบายกิลด์">
    การจัดการกิลด์ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    ค่าพื้นฐานที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    พฤติกรรม `allowlist`:

    - กิลด์ต้องตรงกับ `channels.discord.guilds` (แนะนำ `id` และยอมรับ slug)
    - allowlist ผู้ส่งแบบไม่บังคับ: `users` (แนะนำ ID ที่เสถียร) และ `roles` (เฉพาะ ID บทบาท); หากมีการกำหนดค่าอย่างใดอย่างหนึ่ง ผู้ส่งจะได้รับอนุญาตเมื่อผู้ส่งตรงกับ `users` หรือ `roles`
    - การจับคู่ชื่อ/แท็กโดยตรงถูกปิดใช้งานโดยค่าเริ่มต้น; เปิดใช้ `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเป็นโหมดความเข้ากันได้ในกรณีฉุกเฉิน
    - รองรับชื่อ/แท็กสำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อใช้รายการชื่อ/แท็ก
    - หากกิลด์มีการกำหนดค่า `channels` ช่องที่ไม่อยู่ในรายการจะถูกปฏิเสธ
    - หากกิลด์ไม่มีบล็อก `channels` ทุกช่องในกิลด์ที่อยู่ใน allowlist นั้นจะได้รับอนุญาต

    ตัวอย่าง:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    หากคุณตั้งค่าเฉพาะ `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` ค่า fallback ขณะรันไทม์คือ `groupPolicy="allowlist"` (พร้อมคำเตือนในบันทึก) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`

  </Tab>

  <Tab title="การกล่าวถึงและ Group DM">
    ข้อความกิลด์ถูกควบคุมด้วยการกล่าวถึงโดยค่าเริ่มต้น

    การตรวจจับการกล่าวถึงรวมถึง:

    - การกล่าวถึงบอตโดยชัดเจน
    - รูปแบบการกล่าวถึงที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับถึงบอตโดยนัยในกรณีที่รองรับ

    เมื่อเขียนข้อความ Discord ขาออก ให้ใช้ไวยากรณ์การกล่าวถึงตามแบบบัญญัติ: `<@USER_ID>` สำหรับผู้ใช้, `<#CHANNEL_ID>` สำหรับช่อง และ `<@&ROLE_ID>` สำหรับบทบาท อย่าใช้รูปแบบการกล่าวถึงชื่อเล่นแบบเดิม `<@!USER_ID>`

    `requireMention` ถูกกำหนดค่าต่อกิลด์/ช่อง (`channels.discord.guilds...`)
    `ignoreOtherMentions` เลือกทิ้งข้อความที่กล่าวถึงผู้ใช้/บทบาทอื่นแต่ไม่ใช่บอต (ยกเว้น @everyone/@here)

    Group DM:

    - ค่าเริ่มต้น: ถูกละเว้น (`dm.groupEnabled=false`)
    - allowlist แบบไม่บังคับผ่าน `dm.groupChannels` (ID ช่องหรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตามบทบาท

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิกกิลด์ Discord ไปยังเอเจนต์ต่าง ๆ ตาม ID บทบาท การผูกตามบทบาทยอมรับเฉพาะ ID บทบาท และจะถูกประเมินหลังจากการผูก peer หรือ parent-peer และก่อนการผูกเฉพาะกิลด์ หากการผูกตั้งค่าฟิลด์การจับคู่อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ฟิลด์ที่กำหนดค่าทั้งหมดต้องตรงกัน

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## คำสั่งเนทีฟและการอนุญาตคำสั่ง

- `commands.native` มีค่าเริ่มต้นเป็น `"auto"` และเปิดใช้งานสำหรับ Discord
- การเขียนทับรายช่อง: `channels.discord.commands.native`
- `commands.native=false` ข้ามการลงทะเบียนและการล้างคำสั่ง slash-command ของ Discord ระหว่างเริ่มต้น คำสั่งที่ลงทะเบียนไว้ก่อนหน้านี้อาจยังมองเห็นได้ใน Discord จนกว่าคุณจะลบออกจากแอป Discord
- การยืนยันสิทธิ์ของคำสั่งแบบเนทีฟใช้รายการอนุญาต/นโยบายของ Discord ชุดเดียวกับการจัดการข้อความปกติ
- คำสั่งอาจยังมองเห็นได้ใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต การเรียกใช้ยังคงบังคับใช้การยืนยันสิทธิ์ของ OpenClaw และส่งคืน "not authorized"

ดู [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแคตตาล็อกคำสั่งและพฤติกรรม

การตั้งค่าคำสั่ง slash เริ่มต้น:

- `ephemeral: true`

## รายละเอียดฟีเจอร์

<AccordionGroup>
  <Accordion title="แท็กตอบกลับและการตอบกลับแบบเนทีฟ">
    Discord รองรับแท็กตอบกลับในเอาต์พุตของเอเจนต์:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    ควบคุมโดย `channels.discord.replyToMode`:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`
    - `batched`

    หมายเหตุ: `off` ปิดการร้อยเธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงถูกปฏิบัติตาม
    `first` จะแนบการอ้างอิงการตอบกลับแบบเนทีฟโดยนัยกับข้อความ Discord ขาออกแรกของเทิร์นนั้นเสมอ
    `batched` จะแนบการอ้างอิงการตอบกลับแบบเนทีฟโดยนัยของ Discord เฉพาะเมื่อ
    เทิร์นขาเข้าเป็นชุดข้อความหลายข้อความที่ถูกรวบแบบหน่วงเวลา ซึ่งมีประโยชน์
    เมื่อคุณต้องการการตอบกลับแบบเนทีฟเป็นหลักสำหรับแชตที่พรั่งพรูและคลุมเครือ ไม่ใช่ทุก
    เทิร์นที่มีข้อความเดียว

    ID ข้อความจะแสดงในบริบท/ประวัติ เพื่อให้เอเจนต์สามารถเล็งไปยังข้อความเฉพาะได้

  </Accordion>

  <Accordion title="ตัวอย่างสตรีมสด">
    OpenClaw สามารถสตรีมร่างคำตอบโดยส่งข้อความชั่วคราวและแก้ไขข้อความนั้นเมื่อมีข้อความเข้ามา `channels.discord.streaming` รับค่า `off` | `partial` | `block` | `progress` (ค่าเริ่มต้น) `progress` คงร่างสถานะหนึ่งรายการที่แก้ไขได้ไว้ และอัปเดตด้วยความคืบหน้าของเครื่องมือจนกว่าจะส่งมอบขั้นสุดท้าย ป้ายเริ่มต้นที่ใช้ร่วมกันเป็นบรรทัดที่เลื่อนไปเรื่อย ๆ จึงเลื่อนหายไปเหมือนส่วนอื่นเมื่อมีงานปรากฏมากพอ `streamMode` เป็นนามแฝงรันไทม์แบบเดิม รัน `openclaw doctor --fix` เพื่อเขียนคอนฟิกที่บันทึกไว้ใหม่เป็นคีย์มาตรฐาน

    ตั้งค่า `channels.discord.streaming.mode` เป็น `off` เพื่อปิดการแก้ไขตัวอย่าง Discord หากเปิดใช้งานการสตรีมแบบบล็อกของ Discord ไว้อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำ

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial` แก้ไขข้อความตัวอย่างเดียวเมื่อโทเค็นเข้ามา
    - `block` ปล่อยก้อนข้อความขนาดร่าง (ใช้ `draftChunk` เพื่อปรับขนาดและจุดแบ่ง โดยถูกจำกัดไว้ที่ `textChunkLimit`)
    - ผลลัพธ์สุดท้ายที่เป็นสื่อ ข้อผิดพลาด และการตอบกลับแบบชัดเจนจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความตัวอย่างซ้ำหรือไม่
    - แถวเครื่องมือ/ความคืบหน้าแสดงผลเป็นอีโมจิแบบกระชับ + ชื่อ + รายละเอียดเมื่อมี เช่น `🛠️ Bash: run tests` หรือ `🔎 Web Search: for "query"`
    - `streaming.preview.commandText` / `streaming.progress.commandText` ควบคุมรายละเอียดคำสั่ง/exec ในบรรทัดความคืบหน้าแบบกระชับ: `raw` (ค่าเริ่มต้น) หรือ `status` (เฉพาะป้ายเครื่องมือ)

    ซ่อนข้อความคำสั่ง/exec ดิบโดยยังคงบรรทัดความคืบหน้าแบบกระชับไว้:

    ```json
    {
      "channels": {
        "discord": {
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

    การสตรีมตัวอย่างรองรับเฉพาะข้อความ การตอบกลับที่เป็นสื่อจะถอยกลับไปใช้การส่งมอบปกติ เมื่อเปิดใช้งานการสตรีม `block` ไว้อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำ

  </Accordion>

  <Accordion title="ประวัติ บริบท และพฤติกรรมเธรด">
    บริบทประวัติของกิลด์:

    - ค่าเริ่มต้นของ `channels.discord.historyLimit` คือ `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    การควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมเธรด:

    - เธรด Discord ถูกกำหนดเส้นทางเป็นเซสชันช่องทาง และสืบทอดคอนฟิกช่องทางแม่ เว้นแต่จะถูกเขียนทับ
    - เซสชันเธรดสืบทอดการเลือก `/model` ระดับเซสชันของช่องทางแม่เป็น fallback เฉพาะโมเดล การเลือก `/model` ภายในเธรดยังคงมีลำดับความสำคัญเหนือกว่า และประวัติทรานสคริปต์ของช่องทางแม่จะไม่ถูกคัดลอก เว้นแต่จะเปิดใช้งานการสืบทอดทรานสคริปต์
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) เลือกให้ auto-threads ใหม่เริ่มด้วยข้อมูลจากทรานสคริปต์ของช่องทางแม่ การเขียนทับรายบัญชีอยู่ใต้ `channels.discord.accounts.<id>.thread.inheritParent`
    - รีแอ็กชันของเครื่องมือข้อความสามารถ resolve เป้าหมาย DM แบบ `user:<id>` ได้
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะถูกคงไว้ระหว่าง fallback การเปิดใช้งานในขั้นตอนตอบกลับ

    หัวข้อช่องทางถูกฉีดเข้าเป็นบริบทที่ **ไม่น่าเชื่อถือ** รายการอนุญาตควบคุมว่าใครสามารถเรียกเอเจนต์ได้ ไม่ใช่ขอบเขตการแก้ไขข้อมูลบริบทเสริมแบบเต็มรูปแบบ

  </Accordion>

  <Accordion title="เซสชันผูกกับเธรดสำหรับซับเอเจนต์">
    Discord สามารถผูกเธรดกับเป้าหมายเซสชัน เพื่อให้ข้อความติดตามผลในเธรดนั้นยังคงถูกกำหนดเส้นทางไปยังเซสชันเดิม (รวมถึงเซสชันซับเอเจนต์)

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/ใหม่กับเป้าหมายซับเอเจนต์/เซสชัน
    - `/unfocus` ลบการผูกเธรดปัจจุบัน
    - `/agents` แสดงรันที่ใช้งานอยู่และสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการยกเลิกโฟกัสอัตโนมัติเมื่อไม่มีกิจกรรมสำหรับการผูกที่โฟกัสอยู่
    - `/session max-age <duration|off>` ตรวจสอบ/อัปเดตอายุสูงสุดแบบตายตัวสำหรับการผูกที่โฟกัสอยู่

    คอนฟิก:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    หมายเหตุ:

    - `session.threadBindings.*` ตั้งค่าเริ่มต้นส่วนกลาง
    - `channels.discord.threadBindings.*` เขียนทับพฤติกรรมของ Discord
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดอัตโนมัติสำหรับ `sessions_spawn({ thread: true })` และการสปอว์นเธรด ACP ค่าเริ่มต้น: `true`
    - `defaultSpawnContext` ควบคุมบริบทซับเอเจนต์แบบเนทีฟสำหรับการสปอว์นที่ผูกกับเธรด ค่าเริ่มต้น: `"fork"`
    - คีย์ `spawnSubagentSessions`/`spawnAcpSessions` ที่เลิกใช้แล้วจะถูกย้ายโดย `openclaw doctor --fix`
    - หากการผูกเธรดถูกปิดใช้งานสำหรับบัญชีหนึ่ง `/focus` และการดำเนินการผูกเธรดที่เกี่ยวข้องจะไม่พร้อมใช้งาน

    ดู [ซับเอเจนต์](/th/tools/subagents), [เอเจนต์ ACP](/th/tools/acp-agents) และ [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="การผูกช่องทาง ACP แบบคงอยู่">
    สำหรับพื้นที่ทำงาน ACP แบบ "always-on" ที่เสถียร ให้กำหนดค่าการผูก ACP แบบมีชนิดที่ระดับบนสุด โดยเล็งไปยังการสนทนา Discord

    เส้นทางคอนฟิก:

    - `bindings[]` พร้อม `type: "acp"` และ `match.channel: "discord"`

    ตัวอย่าง:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    หมายเหตุ:

    - `/acp spawn codex --bind here` ผูกช่องทางหรือเธรดปัจจุบันไว้ตรงตำแหน่งเดิม และคงข้อความในอนาคตไว้บนเซสชัน ACP เดิม ข้อความในเธรดสืบทอดการผูกช่องทางแม่
    - ในช่องทางหรือเธรดที่ถูกผูกไว้ `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP เดิมไว้ตรงตำแหน่งเดิม การผูกเธรดชั่วคราวสามารถเขียนทับการ resolve เป้าหมายได้ขณะใช้งานอยู่
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดย่อยผ่าน `--thread auto|here`

    ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมการผูก

  </Accordion>

  <Accordion title="การแจ้งเตือนรีแอ็กชัน">
    โหมดการแจ้งเตือนรีแอ็กชันรายกิลด์:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    อีเวนต์รีแอ็กชันจะถูกแปลงเป็นอีเวนต์ระบบและแนบเข้ากับเซสชัน Discord ที่ถูกกำหนดเส้นทาง

  </Accordion>

  <Accordion title="รีแอ็กชันรับทราบ">
    `ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback อีโมจิตัวตนเอเจนต์ (`agents.list[].identity.emoji` มิฉะนั้นใช้ "👀")

    หมายเหตุ:

    - Discord รับอีโมจิ Unicode หรือชื่ออีโมจิแบบกำหนดเอง
    - ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับช่องทางหรือบัญชี

  </Accordion>

  <Accordion title="การเขียนคอนฟิก">
    การเขียนคอนฟิกที่เริ่มจากช่องทางเปิดใช้งานเป็นค่าเริ่มต้น

    สิ่งนี้มีผลกับโฟลว์ `/config set|unset` (เมื่อฟีเจอร์คำสั่งเปิดใช้งาน)

    ปิดใช้งาน:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="พร็อกซี Gateway">
    กำหนดเส้นทางทราฟฟิก WebSocket ของ Gateway Discord และการค้นหา REST ตอนเริ่มต้น (ID แอปพลิเคชัน + การ resolve รายการอนุญาต) ผ่านพร็อกซี HTTP(S) ด้วย `channels.discord.proxy`

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    การเขียนทับรายบัญชี:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="การรองรับ PluralKit">
    เปิดใช้งานการ resolve ของ PluralKit เพื่อแมปข้อความที่ถูกพร็อกซีไปยังตัวตนสมาชิกของระบบ:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    หมายเหตุ:

    - รายการอนุญาตสามารถใช้ `pk:<memberId>` ได้
    - ชื่อแสดงของสมาชิกจะถูกจับคู่ด้วยชื่อ/slug เท่านั้นเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การค้นหาใช้ ID ข้อความต้นฉบับและถูกจำกัดด้วยช่วงเวลา
    - หากการค้นหาล้มเหลว ข้อความที่ถูกพร็อกซีจะถูกถือว่าเป็นข้อความบอตและถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="นามแฝงเมนชันขาออก">
    ใช้ `mentionAliases` เมื่อเอเจนต์ต้องการเมนชันขาออกที่กำหนดได้แน่นอนสำหรับผู้ใช้ Discord ที่รู้จัก คีย์คือแฮนเดิลที่ไม่มี `@` นำหน้า ค่าคือ ID ผู้ใช้ Discord แฮนเดิลที่ไม่รู้จัก, `@everyone`, `@here` และเมนชันภายในช่วงโค้ด Markdown จะถูกปล่อยไว้ไม่เปลี่ยนแปลง

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="การกำหนดค่า Presence">
    การอัปเดต Presence จะถูกใช้เมื่อคุณตั้งค่าฟิลด์สถานะหรือกิจกรรม หรือเมื่อคุณเปิดใช้ Presence อัตโนมัติ

    ตัวอย่างเฉพาะสถานะ:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    ตัวอย่างกิจกรรม (สถานะกำหนดเองเป็นชนิดกิจกรรมเริ่มต้น):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    ตัวอย่างการสตรีม:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    แผนที่ชนิดกิจกรรม:

    - 0: กำลังเล่น
    - 1: กำลังสตรีม (ต้องใช้ `activityUrl`)
    - 2: กำลังฟัง
    - 3: กำลังดู
    - 4: กำหนดเอง (ใช้ข้อความกิจกรรมเป็นสถานะ; อีโมจิเป็นทางเลือก)
    - 5: กำลังแข่งขัน

    ตัวอย่างสถานะอัตโนมัติ (สัญญาณสุขภาพของรันไทม์):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    สถานะอัตโนมัติแมปความพร้อมใช้งานของรันไทม์กับสถานะ Discord: ปกติ => online, เสื่อมประสิทธิภาพหรือไม่ทราบ => idle, หมดหรือไม่พร้อมใช้งาน => dnd ข้อความเสริมสำหรับแทนที่:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับ placeholder `{reason}`)

  </Accordion>

  <Accordion title="การอนุมัติใน Discord">
    Discord รองรับการจัดการการอนุมัติด้วยปุ่มใน DM และสามารถโพสต์พรอมต์การอนุมัติในช่องต้นทางได้เป็นทางเลือก

    พาธการกำหนดค่า:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; ถอยกลับไปใช้ `commands.ownerAllowFrom` เมื่อเป็นไปได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord เปิดใช้การอนุมัติ exec แบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และสามารถระบุผู้อนุมัติได้อย่างน้อยหนึ่งราย ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมานผู้อนุมัติ exec จาก `allowFrom` ของช่อง, `dm.allowFrom` แบบเดิม หรือ `defaultTo` ของข้อความโดยตรง ตั้งค่า `enabled: false` เพื่อปิดใช้งาน Discord เป็นไคลเอนต์การอนุมัติแบบเนทีฟอย่างชัดเจน

    สำหรับคำสั่งกลุ่มที่ละเอียดอ่อนและจำกัดเฉพาะเจ้าของ เช่น `/diagnostics` และ `/export-trajectory` OpenClaw จะส่งพรอมต์การอนุมัติและผลลัพธ์สุดท้ายแบบส่วนตัว โดยจะลองใช้ Discord DM ก่อนเมื่อเจ้าของที่เรียกใช้มีเส้นทางเจ้าของ Discord; หากไม่มี จะถอยกลับไปใช้เส้นทางเจ้าของรายการแรกที่พร้อมใช้งานจาก `commands.ownerAllowFrom` เช่น Telegram

    เมื่อ `target` เป็น `channel` หรือ `both` พรอมต์การอนุมัติจะมองเห็นได้ในช่อง เฉพาะผู้อนุมัติที่ระบุได้เท่านั้นที่ใช้ปุ่มได้; ผู้ใช้อื่นจะได้รับการปฏิเสธแบบ ephemeral พรอมต์การอนุมัติรวมข้อความคำสั่งไว้ด้วย ดังนั้นให้เปิดใช้การส่งไปยังช่องเฉพาะในช่องที่เชื่อถือได้เท่านั้น หากไม่สามารถหา ID ช่องจากคีย์เซสชันได้ OpenClaw จะถอยกลับไปส่งผ่าน DM

    Discord ยังเรนเดอร์ปุ่มการอนุมัติที่ใช้ร่วมกันโดยช่องแชตอื่นด้วย อะแดปเตอร์ Discord แบบเนทีฟหลัก ๆ จะเพิ่มการกำหนดเส้นทาง DM ของผู้อนุมัติและการกระจายไปยังช่อง
    เมื่อมีปุ่มเหล่านั้นอยู่ ปุ่มเหล่านั้นจะเป็น UX การอนุมัติหลัก; OpenClaw
    ควรรวมคำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่า
    การอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียวเท่านั้น
    หากรันไทม์การอนุมัติแบบเนทีฟของ Discord ไม่ได้ทำงานอยู่ OpenClaw จะคง
    พรอมต์ `/approve <id> <decision>` แบบ deterministic ภายในเครื่องให้มองเห็นได้ หาก
    รันไทม์ทำงานอยู่แต่ไม่สามารถส่งการ์ดเนทีฟไปยังเป้าหมายใด ๆ ได้
    OpenClaw จะส่งประกาศสำรองในแชตเดียวกันพร้อมคำสั่ง `/approve`
    ที่ตรงจากการอนุมัติที่รอดำเนินการ

    การตรวจสอบสิทธิ์ Gateway และการแก้ไขการอนุมัติเป็นไปตามสัญญาไคลเอนต์ Gateway ที่ใช้ร่วมกัน (ID `plugin:` แก้ไขผ่าน `plugin.approval.resolve`; ID อื่นผ่าน `exec.approval.resolve`) การอนุมัติจะหมดอายุหลัง 30 นาทีโดยค่าเริ่มต้น

    ดู [การอนุมัติ Exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและเกตการทำงาน

การทำงานของข้อความ Discord รวมถึงการส่งข้อความ การดูแลช่อง การกลั่นกรอง สถานะ และการทำงานกับเมทาดาทา

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- รีแอ็กชัน: `react`, `reactions`, `emojiList`
- การกลั่นกรอง: `timeout`, `kick`, `ban`
- สถานะ: `setPresence`

การทำงาน `event-create` รับพารามิเตอร์ `image` แบบไม่บังคับ (URL หรือพาธไฟล์ภายในเครื่อง) เพื่อตั้งค่าภาพหน้าปกของเหตุการณ์ที่กำหนดเวลาไว้

เกตการทำงานอยู่ภายใต้ `channels.discord.actions.*`

พฤติกรรมเกตเริ่มต้น:

| กลุ่มการทำงาน                                                                                                                                                            | ค่าเริ่มต้น |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled  |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## UI คอมโพเนนต์ v2

OpenClaw ใช้คอมโพเนนต์ Discord v2 สำหรับการอนุมัติ exec และเครื่องหมายข้ามบริบท การทำงานของข้อความ Discord ยังรับ `components` สำหรับ UI แบบกำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้างเพย์โหลดคอมโพเนนต์ผ่านเครื่องมือ discord) ขณะที่ `embeds` แบบเดิมยังพร้อมใช้งานแต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นที่ใช้โดยคอนเทนเนอร์คอมโพเนนต์ Discord (hex)
- ตั้งค่าต่อบัญชีด้วย `channels.discord.accounts.<id>.ui.components.accentColor`
- `embeds` จะถูกละเว้นเมื่อมีคอมโพเนนต์ v2 อยู่

ตัวอย่าง:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## เสียง

Discord มีพื้นผิวเสียงสองแบบที่แยกจากกัน: **ช่องเสียง** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบพรีวิวคลื่นเสียง) gateway รองรับทั้งสองแบบ

### ช่องเสียง

เช็กลิสต์การตั้งค่า:

1. เปิดใช้ Message Content Intent ใน Discord Developer Portal
2. เปิดใช้ Server Members Intent เมื่อใช้ allowlist ของบทบาท/ผู้ใช้
3. เชิญบอตด้วยสโคป `bot` และ `applications.commands`
4. ให้สิทธิ์ Connect, Speak, Send Messages และ Read Message History ในช่องเสียงเป้าหมาย
5. เปิดใช้คำสั่งเนทีฟ (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งใช้เอเจนต์เริ่มต้นของบัญชีและปฏิบัติตามกฎ allowlist และนโยบายกลุ่มเดียวกับคำสั่ง Discord อื่น

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

เพื่อตรวจสอบสิทธิ์ที่มีผลของบอตก่อนเข้าร่วม ให้รัน:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

ตัวอย่างการเข้าร่วมอัตโนมัติ:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

หมายเหตุ:

- `voice.tts` แทนที่ `messages.tts` สำหรับการเล่นเสียง `stt-tts` เท่านั้น โหมดเรียลไทม์ใช้ `voice.realtime.voice`
- `voice.mode` ควบคุมเส้นทางการสนทนา ค่าเริ่มต้นคือ `agent-proxy`: ส่วนหน้าเสียงแบบเรียลไทม์จัดการจังหวะการผลัดพูด การขัดจังหวะ และการเล่นเสียง มอบหมายงานที่มีสาระให้กับเอเจนต์ OpenClaw ที่ถูกกำหนดเส้นทางผ่าน `openclaw_agent_consult` และปฏิบัติกับผลลัพธ์เหมือนพรอมต์ Discord แบบพิมพ์จากผู้พูดคนนั้น `stt-tts` คงโฟลว์ STT แบบแบตช์ร่วมกับ TTS แบบเดิมไว้ `bidi` ให้โมเดลเรียลไทม์สนทนาโดยตรงพร้อมเปิดเผย `openclaw_agent_consult` สำหรับสมอง OpenClaw
- `voice.agentSession` ควบคุมว่าการสนทนา OpenClaw ใดจะรับผลัดเสียง ปล่อยไว้โดยไม่ตั้งค่าเพื่อใช้เซสชันของช่องเสียงเอง หรือตั้งค่า `{ mode: "target", target: "channel:<text-channel-id>" }` เพื่อให้ช่องเสียงทำหน้าที่เป็นส่วนขยายไมโครโฟน/ลำโพงของเซสชันช่องข้อความ Discord ที่มีอยู่ เช่น `#maintainers`
- `voice.model` แทนที่สมองเอเจนต์ OpenClaw สำหรับการตอบกลับเสียง Discord และการปรึกษาแบบเรียลไทม์ ปล่อยไว้โดยไม่ตั้งค่าเพื่อสืบทอดโมเดลเอเจนต์ที่ถูกกำหนดเส้นทาง ค่านี้แยกจาก `voice.realtime.model`
- `agent-proxy` กำหนดเส้นทางคำพูดผ่าน `discord-voice` ซึ่งรักษาการอนุญาตเจ้าของ/เครื่องมือตามปกติสำหรับผู้พูดและเซสชันเป้าหมาย แต่ซ่อนเครื่องมือ `tts` ของเอเจนต์เพราะเสียง Discord เป็นผู้ดูแลการเล่นเสียง ตามค่าเริ่มต้น `agent-proxy` ให้การปรึกษามีสิทธิ์เข้าถึงเครื่องมือเทียบเท่าเจ้าของเต็มรูปแบบสำหรับผู้พูดที่เป็นเจ้าของ (`voice.realtime.toolPolicy: "owner"`) และให้ความสำคัญอย่างมากกับการปรึกษาเอเจนต์ OpenClaw ก่อนคำตอบที่มีสาระ (`voice.realtime.consultPolicy: "always"`) ในโหมด `always` เริ่มต้นนั้น เลเยอร์เรียลไทม์จะไม่พูดข้อความเติมช่องว่างโดยอัตโนมัติก่อนคำตอบจากการปรึกษา แต่จะจับและถอดเสียงคำพูด จากนั้นพูดคำตอบ OpenClaw ที่ถูกกำหนดเส้นทาง หากคำตอบจากการปรึกษาแบบบังคับหลายรายการเสร็จสิ้นขณะที่ Discord ยังเล่นคำตอบแรกอยู่ คำตอบที่เป็นคำพูดตรงตัวรายการถัดไปจะถูกจัดคิวจนกว่าการเล่นจะว่าง แทนที่จะแทนที่คำพูดกลางประโยค
- ในโหมด `stt-tts` STT ใช้ `tools.media.audio`; `voice.model` ไม่มีผลต่อการถอดเสียง
- ในโหมดเรียลไทม์ `voice.realtime.provider`, `voice.realtime.model` และ `voice.realtime.voice` กำหนดค่าเซสชันเสียงเรียลไทม์ สำหรับ OpenAI Realtime 2 ร่วมกับสมอง Codex ให้ใช้ `voice.realtime.model: "gpt-realtime-2"` และ `voice.model: "openai-codex/gpt-5.5"`
- ผู้ให้บริการเรียลไทม์ของ OpenAI ยอมรับชื่ออีเวนต์ Realtime 2 ปัจจุบันและนามแฝงแบบเดิมที่เข้ากันได้กับ Codex สำหรับอีเวนต์เสียงเอาต์พุตและทรานสคริปต์ ดังนั้นสแนปช็อตผู้ให้บริการที่เข้ากันได้จึงเปลี่ยนแปลงได้โดยไม่ทำให้เสียงผู้ช่วยหลุดหาย
- `voice.realtime.bargeIn` ควบคุมว่าอีเวนต์เริ่มพูดของผู้พูด Discord จะขัดจังหวะการเล่นเรียลไทม์ที่ทำงานอยู่หรือไม่ หากไม่ได้ตั้งค่า จะตามการตั้งค่าการขัดจังหวะเสียงอินพุตของผู้ให้บริการเรียลไทม์
- `voice.realtime.minBargeInAudioEndMs` ควบคุมระยะเวลาการเล่นเสียงผู้ช่วยขั้นต่ำก่อนที่การแทรกพูดของ OpenAI แบบเรียลไทม์จะตัดเสียง ค่าเริ่มต้น: `250` ตั้งเป็น `0` เพื่อขัดจังหวะทันทีในห้องที่เสียงสะท้อนต่ำ หรือเพิ่มค่าสำหรับการตั้งค่าลำโพงที่มีเสียงสะท้อนมาก
- สำหรับเสียง OpenAI บนการเล่นเสียง Discord ให้ตั้งค่า `voice.tts.provider: "openai"` และเลือกเสียง Text-to-speech ภายใต้ `voice.tts.openai.voice` หรือ `voice.tts.providers.openai.voice` `cedar` เป็นตัวเลือกที่ฟังดูเป็นเสียงผู้ชายที่ดีในโมเดล OpenAI TTS ปัจจุบัน
- การแทนที่ `systemPrompt` ของ Discord ต่อช่องมีผลกับผลัดทรานสคริปต์เสียงสำหรับช่องเสียงนั้น
- ผลัดทรานสคริปต์เสียงระบุสถานะเจ้าของจาก `allowFrom` ของ Discord (หรือ `dm.allowFrom`); ผู้พูดที่ไม่ใช่เจ้าของไม่สามารถเข้าถึงเครื่องมือสำหรับเจ้าของเท่านั้นได้ (เช่น `gateway` และ `cron`)
- เสียง Discord เป็นแบบเลือกเปิดสำหรับการกำหนดค่าที่มีเฉพาะข้อความ ตั้งค่า `channels.discord.voice.enabled=true` (หรือคงบล็อก `channels.discord.voice` ที่มีอยู่) เพื่อเปิดใช้คำสั่ง `/vc` รันไทม์เสียง และเจตนา Gateway `GuildVoiceStates`
- `channels.discord.intents.voiceStates` สามารถแทนที่การสมัครรับเจตนาสถานะเสียงอย่างชัดเจนได้ ปล่อยไว้โดยไม่ตั้งค่าเพื่อให้เจตนาตามการเปิดใช้เสียงที่มีผล
- หาก `voice.autoJoin` มีหลายรายการสำหรับกิลด์เดียวกัน OpenClaw จะเข้าร่วมช่องที่กำหนดค่าล่าสุดสำหรับกิลด์นั้น
- `voice.allowedChannels` เป็นรายการอนุญาตการพำนักที่เป็นตัวเลือก ปล่อยไว้โดยไม่ตั้งค่าเพื่ออนุญาตให้ `/vc join` เข้าสู่ช่องเสียง Discord ที่ได้รับอนุญาตใดก็ได้ เมื่อตั้งค่าแล้ว `/vc join` การเข้าร่วมอัตโนมัติเมื่อเริ่มต้น และการย้ายสถานะเสียงของบอตจะถูกจำกัดไว้ที่รายการ `{ guildId, channelId }` ที่ระบุ ตั้งค่าเป็นอาร์เรย์ว่างเพื่อปฏิเสธการเข้าร่วมเสียง Discord ทั้งหมด หาก Discord ย้ายบอตออกนอกรายการอนุญาต OpenClaw จะออกจากช่องนั้นและกลับเข้าร่วมเป้าหมายเข้าร่วมอัตโนมัติที่กำหนดค่าไว้เมื่อมีเป้าหมายพร้อมใช้งาน
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือกการเข้าร่วมของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- OpenClaw ใช้ตัวถอดรหัส `opusscript` แบบ pure-JS เป็นค่าเริ่มต้นสำหรับการรับเสียง Discord แพ็กเกจเนทีฟ `@discordjs/opus` ที่เป็นตัวเลือกจะถูกละเว้นโดยนโยบายติดตั้ง pnpm ของ repo เพื่อให้การติดตั้งปกติ เลน Docker และการทดสอบที่ไม่เกี่ยวข้องไม่คอมไพล์แอดออนเนทีฟ โฮสต์สำหรับประสิทธิภาพเสียงโดยเฉพาะสามารถเลือกใช้ได้ด้วย `OPENCLAW_DISCORD_OPUS_DECODER=native` หลังติดตั้งแอดออนเนทีฟ
- `voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายามเข้าร่วมอัตโนมัติ ค่าเริ่มต้น: `30000`
- `voice.reconnectGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอให้เซสชันเสียงที่ถูกตัดการเชื่อมต่อเริ่มเชื่อมต่อใหม่ก่อนทำลายเซสชัน ค่าเริ่มต้น: `15000`
- ในโหมด `stt-tts` การเล่นเสียงไม่หยุดเพียงเพราะผู้ใช้อีกคนเริ่มพูด เพื่อหลีกเลี่ยงลูปฟีดแบ็ก OpenClaw จะละเว้นการจับเสียงใหม่ขณะที่ TTS กำลังเล่นอยู่ ให้พูดหลังการเล่นจบสำหรับผลัดถัดไป โหมดเรียลไทม์ส่งต่อการเริ่มพูดของผู้พูดเป็นสัญญาณแทรกพูดไปยังผู้ให้บริการเรียลไทม์
- ในโหมดเรียลไทม์ เสียงสะท้อนจากลำโพงเข้าไมค์ที่เปิดอยู่อาจดูเหมือนการแทรกพูดและขัดจังหวะการเล่นได้ สำหรับห้อง Discord ที่มีเสียงสะท้อนมาก ให้ตั้งค่า `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` เพื่อไม่ให้ OpenAI ขัดจังหวะโดยอัตโนมัติเมื่อมีเสียงอินพุต เพิ่ม `voice.realtime.bargeIn: true` หากคุณยังต้องการให้อีเวนต์เริ่มพูดของผู้พูด Discord ขัดจังหวะการเล่นที่ทำงานอยู่ บริดจ์เรียลไทม์ของ OpenAI จะละเว้นการตัดทอนการเล่นที่สั้นกว่า `voice.realtime.minBargeInAudioEndMs` โดยถือว่าน่าจะเป็นเสียงสะท้อน/สัญญาณรบกวน และบันทึกเป็นรายการที่ข้ามแทนการล้างการเล่น Discord
- `voice.captureSilenceGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอหลังจาก Discord รายงานว่าผู้พูดหยุดพูด ก่อนสรุปเซกเมนต์เสียงนั้นสำหรับ STT ค่าเริ่มต้น: `2500`; เพิ่มค่านี้หาก Discord แยกช่วงหยุดตามปกติเป็นทรานสคริปต์บางส่วนที่ขาดเป็นท่อน
- เมื่อ ElevenLabs เป็นผู้ให้บริการ TTS ที่เลือก การเล่นเสียง Discord จะใช้ TTS แบบสตรีมและเริ่มจากสตรีมการตอบกลับของผู้ให้บริการ ผู้ให้บริการที่ไม่รองรับการสตรีมจะถอยกลับไปใช้เส้นทางไฟล์ชั่วคราวที่สังเคราะห์แล้ว
- OpenClaw ยังเฝ้าดูความล้มเหลวในการถอดรหัสฝั่งรับ และกู้คืนอัตโนมัติโดยออกจาก/เข้าร่วมช่องเสียงใหม่หลังพบความล้มเหลวซ้ำในช่วงเวลาสั้น
- หากบันทึกฝั่งรับแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำหลังอัปเดต ให้รวบรวมรายงาน dependency และบันทึก บรรทัด `@discordjs/voice` ที่บันเดิลมารวมการแก้ไข padding จาก upstream discord.js PR #11449 ซึ่งปิด discord.js issue #11419
- อีเวนต์รับ `The operation was aborted` เป็นสิ่งที่คาดไว้เมื่อ OpenClaw สรุปเซกเมนต์ผู้พูดที่จับไว้ อีเวนต์เหล่านี้เป็นการวินิจฉัยแบบละเอียด ไม่ใช่คำเตือน
- บันทึกเสียง Discord แบบละเอียดมีตัวอย่างทรานสคริปต์ STT หนึ่งบรรทัดแบบจำกัดขนาดสำหรับแต่ละเซกเมนต์ผู้พูดที่ยอมรับ ดังนั้นการดีบักจะแสดงทั้งฝั่งผู้ใช้และฝั่งคำตอบของเอเจนต์โดยไม่เทข้อความทรานสคริปต์แบบไม่จำกัด
- ในโหมด `agent-proxy` การถอยกลับไปปรึกษาแบบบังคับจะข้ามเศษทรานสคริปต์ที่น่าจะไม่สมบูรณ์ เช่น ข้อความที่ลงท้ายด้วย `...` หรือตัวเชื่อมท้ายอย่าง `and` รวมถึงคำปิดท้ายที่ชัดเจนว่าไม่ใช่การกระทำ เช่น “เดี๋ยวกลับมา” หรือ “ลาก่อน” บันทึกจะแสดง `forced agent consult skipped reason=...` เมื่อสิ่งนี้ป้องกันคำตอบที่ค้างคิวเก่า

การตั้งค่า opus เนทีฟสำหรับเช็กเอาต์ซอร์ส:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

ใช้ Node 22 สำหรับ Gateway เมื่อต้องการแอดออนเนทีฟ prebuilt สำหรับ macOS arm64 จาก upstream หากใช้รันไทม์ Node อื่น ตัวติดตั้งแบบเลือกใช้อาจต้องใช้ toolchain สร้างจากซอร์ส `node-gyp` ในเครื่อง

หลังติดตั้งแอดออนเนทีฟแล้ว ให้เริ่ม Gateway ด้วย:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

บันทึกเสียงแบบละเอียดควรแสดง `discord voice: opus decoder: @discordjs/opus` หากไม่มีการเลือกใช้ผ่าน env หรือหากแอดออนเนทีฟหายไปหรือโหลดบนโฮสต์ไม่ได้ OpenClaw จะบันทึก `discord voice: opus decoder: opusscript` และรับเสียงต่อผ่านตัวถอยกลับแบบ pure-JS

ไปป์ไลน์ STT ร่วมกับ TTS:

- การจับ PCM ของ Discord ถูกแปลงเป็นไฟล์ชั่วคราว WAV
- `tools.media.audio` จัดการ STT เช่น `openai/gpt-4o-mini-transcribe`
- ทรานสคริปต์ถูกส่งผ่าน ingress และการกำหนดเส้นทางของ Discord ขณะที่ LLM ตอบกลับทำงานด้วยนโยบายเอาต์พุตเสียงที่ซ่อนเครื่องมือ `tts` ของเอเจนต์และขอข้อความที่ส่งกลับ เพราะเสียง Discord เป็นผู้ดูแลการเล่น TTS ขั้นสุดท้าย
- `voice.model` เมื่อตั้งค่า จะแทนที่เฉพาะ LLM ตอบกลับสำหรับผลัดช่องเสียงนี้
- `voice.tts` ถูกผสานทับ `messages.tts`; ผู้ให้บริการที่รองรับการสตรีมจะส่งข้อมูลเข้าตัวเล่นโดยตรง มิฉะนั้นไฟล์เสียงที่ได้จะถูกเล่นในช่องที่เข้าร่วมอยู่

ตัวอย่างเซสชันช่องเสียง `agent-proxy` เริ่มต้น:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

เมื่อไม่มีบล็อก `voice.agentSession` แต่ละช่องเสียงจะได้เซสชัน OpenClaw ที่ถูกกำหนดเส้นทางของตัวเอง เช่น `/vc join channel:234567890123456789` จะคุยกับเซสชันสำหรับช่องเสียง Discord นั้น โมเดลเรียลไทม์เป็นเพียงส่วนหน้าเสียงเท่านั้น คำขอที่มีสาระจะถูกส่งให้เอเจนต์ OpenClaw ที่กำหนดค่าไว้ หากโมเดลเรียลไทม์สร้างทรานสคริปต์สุดท้ายโดยไม่เรียกเครื่องมือปรึกษา OpenClaw จะบังคับการปรึกษาเป็นทางถอยกลับเพื่อให้ค่าเริ่มต้นยังทำงานเหมือนการคุยกับเอเจนต์

ตัวอย่าง STT ร่วมกับ TTS แบบเดิม:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          openai: {
            model: "gpt-4o-mini-tts",
            voice: "cedar",
          },
        },
      },
    },
  },
}
```

ตัวอย่าง bidi เรียลไทม์:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

เสียงในฐานะส่วนขยายของเซสชันช่อง Discord ที่มีอยู่:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai-codex/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

ในโหมด `agent-proxy` บอตจะเข้าร่วมช่องเสียงที่กำหนดค่าไว้ แต่ผลัดของเอเจนต์ OpenClaw ใช้เซสชันและเอเจนต์ที่ถูกกำหนดเส้นทางตามปกติของช่องเป้าหมาย เซสชันเสียงเรียลไทม์จะพูดผลลัพธ์ที่ส่งกลับเข้าไปในช่องเสียง เอเจนต์ผู้ควบคุมยังสามารถใช้เครื่องมือข้อความตามปกติตามนโยบายเครื่องมือของตนได้ รวมถึงการส่งข้อความ Discord แยกต่างหากหากนั่นเป็นการกระทำที่ถูกต้อง

รูปแบบเป้าหมายที่มีประโยชน์:

- `target: "channel:123456789012345678"` กำหนดเส้นทางผ่านเซสชันช่องข้อความ Discord
- `target: "123456789012345678"` ถูกปฏิบัติเป็นเป้าหมายช่อง
- `target: "dm:123456789012345678"` หรือ `target: "user:123456789012345678"` กำหนดเส้นทางผ่านเซสชันข้อความส่วนตัวนั้น

ตัวอย่าง OpenAI Realtime สำหรับสภาพแวดล้อมที่มีเสียงสะท้อนมาก:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

ใช้ค่านี้เมื่อโมเดลได้ยินเสียงเล่นกลับของตัวเองใน Discord ผ่านไมค์ที่เปิดอยู่ แต่คุณยังต้องการขัดจังหวะด้วยการพูด OpenClaw จะป้องกันไม่ให้ OpenAI ขัดจังหวะอัตโนมัติจากเสียงอินพุตดิบ ขณะที่ `bargeIn: true` ทำให้เหตุการณ์เริ่มพูดของลำโพง Discord และเสียงของผู้พูดที่กำลังทำงานอยู่สามารถยกเลิกการตอบกลับแบบเรียลไทม์ที่กำลังทำงานก่อนที่รอบเสียงถัดไปที่จับได้จะไปถึง OpenAI สัญญาณ barge-in ที่มาเร็วมากซึ่งมี `audioEndMs` ต่ำกว่า `minBargeInAudioEndMs` จะถือว่าน่าจะเป็นเสียงสะท้อน/สัญญาณรบกวนและถูกละเว้น เพื่อให้โมเดลไม่ตัดเสียงตั้งแต่เฟรมเล่นกลับแรก

บันทึกเสียงที่คาดหวัง:

- เมื่อเข้าร่วม: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- เมื่อเริ่มแบบเรียลไทม์: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- เมื่อมีเสียงผู้พูด: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, และ `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- เมื่อข้ามคำพูดเก่า: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` หรือ `reason=non-actionable-closing ...`
- เมื่อการตอบกลับแบบเรียลไทม์เสร็จสิ้น: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- เมื่อหยุด/รีเซ็ตการเล่นกลับ: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- เมื่อ consult แบบเรียลไทม์: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- เมื่อเอเจนต์ตอบ: `discord voice: agent turn answer ...`
- เมื่อจัดคิวคำพูดแบบตรงตัว: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...` ตามด้วย `discord voice: realtime exact speech dequeued reason=player-idle ...`
- เมื่อตรวจพบ barge-in: `discord voice: realtime barge-in detected source=speaker-start ...` หรือ `discord voice: realtime barge-in detected source=active-speaker-audio ...` ตามด้วย `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- เมื่อมีการขัดจังหวะแบบเรียลไทม์: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in` ตามด้วยอย่างใดอย่างหนึ่งระหว่าง `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` หรือ `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- เมื่อเสียงสะท้อน/สัญญาณรบกวนถูกละเว้น: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- เมื่อปิดใช้ barge-in: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- เมื่อการเล่นกลับว่างอยู่: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

ในการดีบักเสียงที่ถูกตัด ให้อ่านบันทึกเสียงแบบเรียลไทม์เป็นไทม์ไลน์:

1. `realtime audio playback started` หมายความว่า Discord เริ่มเล่นเสียงผู้ช่วยแล้ว bridge จะเริ่มนับชังก์เอาต์พุตของผู้ช่วย, ไบต์ PCM ของ Discord, ไบต์แบบเรียลไทม์ของผู้ให้บริการ และระยะเวลาเสียงที่สังเคราะห์จากจุดนี้
2. `realtime speaker turn opened` ทำเครื่องหมายว่าผู้พูด Discord เริ่มใช้งาน หากการเล่นกลับกำลังทำงานอยู่แล้วและเปิดใช้ `bargeIn` อยู่ อาจตามด้วย `barge-in detected source=speaker-start`
3. `realtime input audio started` ทำเครื่องหมายเฟรมเสียงจริงเฟรมแรกที่ได้รับสำหรับรอบผู้พูดนั้น `outputActive=true` หรือ `outputAudioMs` ที่ไม่เป็นศูนย์ตรงนี้หมายความว่าไมค์กำลังส่งอินพุตขณะที่การเล่นกลับของผู้ช่วยยังทำงานอยู่
4. `barge-in detected source=active-speaker-audio` หมายความว่า OpenClaw พบเสียงผู้พูดสดขณะที่การเล่นกลับของผู้ช่วยกำลังทำงานอยู่ สิ่งนี้มีประโยชน์สำหรับแยกแยะการขัดจังหวะจริงออกจากเหตุการณ์เริ่มพูดของ Discord ที่ไม่มีเสียงที่ใช้ได้
5. `barge-in requested reason=...` หมายความว่า OpenClaw ขอให้ผู้ให้บริการแบบเรียลไทม์ยกเลิกหรือตัดทอนการตอบกลับที่กำลังทำงานอยู่ โดยรวม `outputAudioMs`, `outputActive`, และ `playbackChunks` เพื่อให้คุณเห็นว่าเสียงผู้ช่วยเล่นไปจริงมากแค่ไหนก่อนการขัดจังหวะ
6. `realtime audio playback stopped reason=...` คือจุดรีเซ็ตการเล่นกลับ Discord ภายในเครื่อง เหตุผลจะบอกว่าใครหยุดการเล่นกลับ: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, หรือ `session-close`
7. `realtime speaker turn closed` สรุปรอบอินพุตที่จับได้ `chunks=0` หรือ `hasAudio=false` หมายความว่ารอบผู้พูดเปิดขึ้นแต่ไม่มีเสียงที่ใช้ได้ไปถึง bridge แบบเรียลไทม์ `interruptedPlayback=true` หมายความว่ารอบอินพุตนั้นซ้อนทับกับเอาต์พุตของผู้ช่วยและทริกเกอร์ตรรกะ barge-in

ฟิลด์ที่มีประโยชน์:

- `outputAudioMs`: ระยะเวลาเสียงผู้ช่วยที่สร้างโดยผู้ให้บริการแบบเรียลไทม์ก่อนบรรทัดบันทึก
- `audioMs`: ระยะเวลาเสียงผู้ช่วยที่ OpenClaw นับก่อนการเล่นกลับหยุด
- `elapsedMs`: เวลาตามนาฬิกาจริงระหว่างการเปิดและปิดสตรีมเล่นกลับหรือรอบผู้พูด
- `discordBytes`: ไบต์ PCM สเตอริโอ 48 kHz ที่ส่งไปยังหรือรับจากเสียง Discord
- `realtimeBytes`: ไบต์ PCM รูปแบบผู้ให้บริการที่ส่งไปยังหรือรับจากผู้ให้บริการแบบเรียลไทม์
- `playbackChunks`: ชังก์เสียงผู้ช่วยที่ส่งต่อไปยัง Discord สำหรับการตอบกลับที่กำลังทำงาน
- `sinceLastAudioMs`: ช่องว่างระหว่างเฟรมเสียงผู้พูดที่จับได้ล่าสุดกับการปิดรอบผู้พูด

รูปแบบที่พบบ่อย:

- การตัดเสียงทันทีพร้อม `source=active-speaker-audio`, `outputAudioMs` น้อย และผู้ใช้คนเดียวกันอยู่ใกล้ ๆ มักชี้ไปที่เสียงสะท้อนจากลำโพงเข้าไมค์ เพิ่ม `voice.realtime.minBargeInAudioEndMs`, ลดระดับเสียงลำโพง, ใช้หูฟัง หรือกำหนด `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`
- `source=speaker-start` ตามด้วย `speaker turn closed ... hasAudio=false` หมายความว่า Discord รายงานการเริ่มพูดแต่ไม่มีเสียงไปถึง OpenClaw ซึ่งอาจเป็นเหตุการณ์เสียง Discord ชั่วคราว พฤติกรรม noise gate หรือไคลเอนต์กดไมค์ชั่วครู่
- `audio playback stopped reason=stream-close` โดยไม่มี barge-in หรือ `provider-clear-audio` ใกล้เคียง หมายความว่าสตรีมเล่นกลับ Discord ภายในเครื่องจบลงโดยไม่คาดคิด ตรวจสอบบันทึกผู้ให้บริการและเครื่องเล่น Discord ก่อนหน้า
- `capture ignored during playback (barge-in disabled)` หมายความว่า OpenClaw ตั้งใจทิ้งอินพุตขณะที่เสียงผู้ช่วยกำลังทำงาน เปิดใช้ `voice.realtime.bargeIn` หากคุณต้องการให้คำพูดขัดจังหวะการเล่นกลับ
- `barge-in ignored ... outputActive=false` หมายความว่า Discord หรือ VAD ของผู้ให้บริการรายงานคำพูด แต่ OpenClaw ไม่มีการเล่นกลับที่กำลังทำงานให้ขัดจังหวะ สิ่งนี้ไม่ควรตัดเสียง

ข้อมูลประจำตัวจะถูกแก้ตามแต่ละคอมโพเนนต์: auth เส้นทาง LLM สำหรับ `voice.model`, auth STT สำหรับ `tools.media.audio`, auth TTS สำหรับ `messages.tts`/`voice.tts`, และ auth ผู้ให้บริการแบบเรียลไทม์สำหรับ `voice.realtime.providers` หรือคอนฟิก auth ปกติของผู้ให้บริการ

### ข้อความเสียง

ข้อความเสียง Discord แสดงตัวอย่างรูปคลื่นและต้องใช้เสียง OGG/Opus OpenClaw สร้างรูปคลื่นให้อัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ Gateway เพื่อตรวจสอบและแปลง

- ระบุ **พาธไฟล์ภายในเครื่อง** (URL จะถูกปฏิเสธ)
- ละเว้นเนื้อหาข้อความ (Discord ปฏิเสธข้อความ + ข้อความเสียงใน payload เดียวกัน)
- ยอมรับรูปแบบเสียงใดก็ได้ OpenClaw จะแปลงเป็น OGG/Opus ตามต้องการ

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ใช้ intents ที่ไม่อนุญาต หรือบอทไม่เห็นข้อความ guild">

    - เปิดใช้ Message Content Intent
    - เปิดใช้ Server Members Intent เมื่อคุณพึ่งพาการแก้ข้อมูลผู้ใช้/สมาชิก
    - รีสตาร์ท Gateway หลังเปลี่ยน intents

  </Accordion>

  <Accordion title="ข้อความ guild ถูกบล็อกโดยไม่คาดคิด">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบ allowlist ของ guild ภายใต้ `channels.discord.guilds`
    - หากมีแมป `channels` ของ guild จะอนุญาตเฉพาะช่องที่อยู่ในรายการเท่านั้น
    - ตรวจสอบพฤติกรรม `requireMention` และรูปแบบการ mention

    การตรวจสอบที่มีประโยชน์:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention เป็น false แต่ยังถูกบล็อก">
    สาเหตุที่พบบ่อย:

    - `groupPolicy="allowlist"` โดยไม่มี allowlist ของ guild/channel ที่ตรงกัน
    - กำหนดค่า `requireMention` ผิดตำแหน่ง (ต้องอยู่ภายใต้ `channels.discord.guilds` หรือรายการช่อง)
    - ผู้ส่งถูกบล็อกโดย allowlist `users` ของ guild/channel

  </Accordion>

  <Accordion title="รอบ Discord ที่ทำงานนาน หรือการตอบกลับซ้ำ">

    บันทึกทั่วไป:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    ปุ่มปรับคิว Gateway ของ Discord:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ค่านี้ควบคุมเฉพาะงาน listener ของ Gateway Discord ไม่ใช่อายุรอบของเอเจนต์

    Discord ไม่ใช้ timeout ที่ช่องเป็นเจ้าของกับรอบเอเจนต์ที่อยู่ในคิว message listener จะส่งต่องานทันที และการรัน Discord ที่อยู่ในคิวจะรักษาลำดับตามเซสชันไว้จนกว่า lifecycle ของเซสชัน/เครื่องมือ/runtime จะเสร็จสิ้นหรือยกเลิกงาน

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="คำเตือน timeout ของการค้นหา metadata Gateway">
    OpenClaw ดึง metadata `/gateway/bot` ของ Discord ก่อนเชื่อมต่อ ความล้มเหลวชั่วคราวจะ fallback ไปยัง URL Gateway เริ่มต้นของ Discord และถูกจำกัดอัตราในบันทึก

    ปุ่มปรับ timeout ของ metadata:

    - บัญชีเดียว: `channels.discord.gatewayInfoTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env fallback เมื่อไม่ได้กำหนดคอนฟิก: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - ค่าเริ่มต้น: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout ทำให้รีสตาร์ท">
    OpenClaw รอเหตุการณ์ `READY` ของ Gateway Discord ระหว่างเริ่มต้นและหลังจาก runtime เชื่อมต่อใหม่ การตั้งค่าหลายบัญชีที่มีการเว้นจังหวะเริ่มต้นอาจต้องใช้หน้าต่าง READY ตอนเริ่มต้นที่นานกว่าค่าเริ่มต้น

    ปุ่มปรับ timeout ของ READY:

    - ตอนเริ่มต้น บัญชีเดียว: `channels.discord.gatewayReadyTimeoutMs`
    - ตอนเริ่มต้น หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - env fallback ตอนเริ่มต้นเมื่อไม่ได้กำหนดคอนฟิก: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นตอนเริ่มต้น: `15000` (15 วินาที), สูงสุด: `120000`
    - runtime บัญชีเดียว: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - env fallback ของ runtime เมื่อไม่ได้กำหนดคอนฟิก: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นของ runtime: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="ผลตรวจสอบสิทธิ์ไม่ตรงกัน">
    การตรวจสอบสิทธิ์ของ `channels status --probe` ใช้ได้เฉพาะกับ ID ช่องแบบตัวเลขเท่านั้น

    หากคุณใช้คีย์ slug การจับคู่ระหว่าง runtime ยังอาจทำงานได้ แต่ probe ไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน

  </Accordion>

  <Accordion title="ปัญหา DM และการจับคู่">

    - DM ถูกปิดใช้: `channels.discord.dm.enabled=false`
    - นโยบาย DM ถูกปิดใช้: `channels.discord.dmPolicy="disabled"` (แบบเดิม: `channels.discord.dm.policy`)
    - กำลังรอการอนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูปบอทต่อบอท">
    โดยค่าเริ่มต้น ข้อความที่เขียนโดยบอทจะถูกละเว้น

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎการ mention และรายการอนุญาตที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมวนลูป
    แนะนำให้ใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความจากบอตที่ mention บอตนั้นเท่านั้น

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Voice STT หยุดทำงานพร้อม DecryptionFailed(...)">

    - อัปเดต OpenClaw ให้เป็นปัจจุบันเสมอ (`openclaw update`) เพื่อให้มีตรรกะการกู้คืนการรับเสียงของ Discord
    - ยืนยันว่า `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้นของ upstream) และปรับเฉพาะเมื่อจำเป็น
    - ดูบันทึกสำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากยังเกิดความล้มเหลวหลังจาก rejoin อัตโนมัติ ให้รวบรวมบันทึกและเทียบกับประวัติการรับ DAVE ของ upstream ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## เอกสารอ้างอิงการกำหนดค่า

เอกสารอ้างอิงหลัก: [เอกสารอ้างอิงการกำหนดค่า - Discord](/th/gateway/config-channels#discord)

<Accordion title="ฟิลด์ Discord ที่มีสัญญาณสำคัญ">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `token`, `accounts.*`, `allowBots`
- นโยบาย: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- คำสั่ง: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- คิวเหตุการณ์: `eventQueue.listenerTimeout` (งบเวลาของ listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- การตอบกลับ/ประวัติ: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่ง: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- การสตรีม: `streaming` (นามแฝงเดิม: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- สื่อ/การลองใหม่: `mediaMaxMb` (จำกัดการอัปโหลดออกไปยัง Discord, ค่าเริ่มต้น `100MB`), `retry`
- การดำเนินการ: `actions.*`
- สถานะ: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ฟีเจอร์: `threadBindings`, `bindings[]` ระดับบนสุด (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการปฏิบัติการ

- ปฏิบัติกับโทเคนบอตเป็นความลับ (`DISCORD_BOT_TOKEN` แนะนำในสภาพแวดล้อมที่มีการกำกับดูแล)
- ให้สิทธิ์ Discord ตามหลักสิทธิ์น้อยที่สุด
- หากการ deploy/สถานะของคำสั่งล้าสมัย ให้รีสตาร์ท Gateway แล้วตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Discord กับ Gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรมของแชทกลุ่มและรายการอนุญาต
  </Card>
  <Card title="การกำหนดเส้นทางช่องทาง" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยัง agents
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    แบบจำลองภัยคุกคามและการเสริมความแข็งแกร่ง
  </Card>
  <Card title="การกำหนดเส้นทางหลาย agent" icon="sitemap" href="/th/concepts/multi-agent">
    แมป guilds และ channels กับ agents
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟ
  </Card>
</CardGroup>
