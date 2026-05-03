---
read_when:
    - การทำงานกับฟีเจอร์ช่อง Discord
summary: สถานะการรองรับบอต Discord ความสามารถ และการกำหนดค่า
title: Discord
x-i18n:
    generated_at: "2026-05-03T21:27:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a38cb3c8e25c1f3d6b7ddfc35a0445dc264be74d74b08d0051528b462b743a3
    source_path: channels/discord.md
    workflow: 16
---

พร้อมสำหรับ DM และช่องกิลด์ผ่าน Discord gateway อย่างเป็นทางการ

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    Discord DM ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและขั้นตอนการซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

คุณจะต้องสร้างแอปพลิเคชันใหม่ที่มีบอต เพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ และจับคู่กับ OpenClaw เราแนะนำให้เพิ่มบอตของคุณไปยังเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากยังไม่มี ให้[สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="สร้างแอปพลิเคชันและบอต Discord">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อประมาณว่า "OpenClaw"

    คลิก **Bot** ในแถบด้านข้าง ตั้งค่า **Username** เป็นชื่อที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้ privileged intents">
    ยังอยู่ในหน้า **Bot** ให้เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับรายการอนุญาตตามบทบาทและการจับคู่ชื่อเป็น ID)
    - **Presence Intent** (ไม่บังคับ; จำเป็นเฉพาะสำหรับการอัปเดตสถานะการปรากฏตัว)

  </Step>

  <Step title="คัดลอกโทเค็นบอตของคุณ">
    เลื่อนกลับขึ้นไปในหน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อจะเป็นเช่นนั้น แต่สิ่งนี้จะสร้างโทเค็นแรกของคุณ โดยไม่มีอะไรถูก "รีเซ็ต"
    </Note>

    คัดลอกโทเค็นและบันทึกไว้ที่ใดที่หนึ่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในอีกไม่นาน

  </Step>

  <Step title="สร้าง URL เชิญและเพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** ในแถบด้านข้าง คุณจะสร้าง URL เชิญพร้อมสิทธิ์ที่ถูกต้องเพื่อเพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ

    เลื่อนลงไปที่ **OAuth2 URL Generator** แล้วเปิดใช้:

    - `bot`
    - `applications.commands`

    ส่วน **Bot Permissions** จะปรากฏด้านล่าง เปิดใช้อย่างน้อย:

    **สิทธิ์ทั่วไป**
      - ดูช่อง
    **สิทธิ์ข้อความ**
      - ส่งข้อความ
      - อ่านประวัติข้อความ
      - ฝังลิงก์
      - แนบไฟล์
      - เพิ่มรีแอ็กชัน (ไม่บังคับ)

    นี่คือชุดพื้นฐานสำหรับช่องข้อความปกติ หากคุณวางแผนจะโพสต์ในเธรด Discord รวมถึงเวิร์กโฟลว์ช่องฟอรัมหรือสื่อที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้ **Send Messages in Threads** ด้วย
    คัดลอก URL ที่สร้างขึ้นที่ด้านล่าง วางลงในเบราว์เซอร์ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอตของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิดใช้ Developer Mode และรวบรวม ID ของคุณ">
    กลับไปที่แอป Discord คุณต้องเปิดใช้ Developer Mode เพื่อให้คัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนรูปเฟืองถัดจากอวาตาร์ของคุณ) → **Advanced** → เปิดสวิตช์ **Developer Mode**
    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ของคุณไว้พร้อมกับ Bot Token คุณจะส่งทั้งสามอย่างให้ OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาต DM จากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงานได้ Discord ต้องอนุญาตให้บอตส่ง DM ถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณ → **Privacy Settings** → เปิดสวิตช์ **Direct Messages**

    สิ่งนี้ทำให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอต) ส่ง DM ถึงคุณได้ เปิดค่านี้ไว้หากคุณต้องการใช้ Discord DM กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่องกิลด์ คุณสามารถปิด DM หลังจากจับคู่แล้วได้

  </Step>

  <Step title="ตั้งค่าโทเค็นบอตของคุณอย่างปลอดภัย (อย่าส่งในแชต)">
    โทเค็นบอต Discord ของคุณเป็นความลับ (เหมือนรหัสผ่าน) ตั้งค่าบนเครื่องที่เรียกใช้ OpenClaw ก่อนส่งข้อความหาเอเจนต์ของคุณ

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

    หาก OpenClaw ทำงานเป็นบริการเบื้องหลังอยู่แล้ว ให้รีสตาร์ทผ่านแอป OpenClaw Mac หรือโดยหยุดแล้วเริ่มกระบวนการ `openclaw gateway run` ใหม่
    สำหรับการติดตั้งบริการที่มีการจัดการ ให้เรียกใช้ `openclaw gateway install` จากเชลล์ที่มี `DISCORD_BOT_TOKEN` อยู่ หรือจัดเก็บตัวแปรไว้ใน `~/.openclaw/.env` เพื่อให้บริการ resolve ค่า env SecretRef ได้หลังรีสตาร์ท
    หากโฮสต์ของคุณถูกบล็อกหรือถูกจำกัดอัตราโดยการค้นหาแอปพลิเคชันตอนเริ่มต้นของ Discord ให้ตั้งค่า ID แอปพลิเคชัน/ไคลเอนต์ Discord จาก Developer Portal เพื่อให้การเริ่มต้นข้ามการเรียก REST นั้นได้ ใช้ `channels.discord.applicationId` สำหรับบัญชีเริ่มต้น หรือ `channels.discord.accounts.<accountId>.applicationId` เมื่อคุณเรียกใช้บอต Discord หลายตัว

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        แชตกับเอเจนต์ OpenClaw ของคุณในช่องทางที่มีอยู่ใดก็ได้ (เช่น Telegram) แล้วบอกเอเจนต์ หาก Discord เป็นช่องทางแรกของคุณ ให้ใช้แท็บ CLI / config แทน

        > "ฉันตั้งค่าโทเค็นบอต Discord ใน config แล้ว โปรดตั้งค่า Discord ให้เสร็จด้วย User ID `<user_id>` และ Server ID `<server_id>`"
      </Tab>
      <Tab title="CLI / config">
        หากคุณต้องการ config แบบไฟล์ ให้ตั้งค่า:

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

        ค่า env fallback สำหรับบัญชีเริ่มต้น:

```bash
DISCORD_BOT_TOKEN=...
```

        สำหรับการตั้งค่าแบบสคริปต์หรือระยะไกล ให้เขียนบล็อก JSON5 เดียวกันด้วย `openclaw config patch --file ./discord.patch.json5 --dry-run` แล้วเรียกใช้อีกครั้งโดยไม่มี `--dry-run` รองรับค่า `token` แบบข้อความล้วน รองรับค่า SecretRef สำหรับ `channels.discord.token` ใน provider แบบ env/file/exec ด้วยเช่นกัน ดู [การจัดการความลับ](/th/gateway/secrets)

        สำหรับบอต Discord หลายตัว ให้เก็บโทเค็นบอตและ ID แอปพลิเคชันแต่ละรายการไว้ใต้บัญชีของตัวเอง `channels.discord.applicationId` ระดับบนสุดจะถูกสืบทอดโดยบัญชี ดังนั้นตั้งค่าที่นั่นเฉพาะเมื่อทุกบัญชีควรใช้ ID แอปพลิเคชันเดียวกัน

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
    รอจนกว่า gateway จะทำงาน แล้วส่ง DM ถึงบอตของคุณใน Discord บอตจะตอบกลับด้วยรหัสการจับคู่

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        ส่งรหัสการจับคู่ให้เอเจนต์ของคุณในช่องทางที่มีอยู่:

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
การ resolve โทเค็นรับรู้ตามบัญชี ค่าโทเค็นใน config จะมีสิทธิ์เหนือ env fallback `DISCORD_BOT_TOKEN` ใช้สำหรับบัญชีเริ่มต้นเท่านั้น
หากบัญชี Discord ที่เปิดใช้สองบัญชี resolve เป็นโทเค็นบอตเดียวกัน OpenClaw จะเริ่มตัวตรวจสอบ gateway เพียงตัวเดียวสำหรับโทเค็นนั้น โทเค็นที่มาจาก config จะมีสิทธิ์เหนือ env fallback เริ่มต้น มิฉะนั้นบัญชีที่เปิดใช้งานบัญชีแรกจะมีสิทธิ์ และบัญชีซ้ำจะถูกรายงานว่าปิดใช้งาน
สำหรับการเรียกออกขั้นสูง (เครื่องมือ message/การดำเนินการช่องทาง) ค่า `token` ต่อการเรียกที่ระบุอย่างชัดเจนจะถูกใช้สำหรับการเรียกนั้น สิ่งนี้ใช้กับการดำเนินการแบบส่งและอ่าน/ตรวจสอบ (เช่น read/search/fetch/thread/pins/permissions) การตั้งค่านโยบายบัญชี/การลองใหม่ยังคงมาจากบัญชีที่เลือกในสแนปช็อตรันไทม์ที่ใช้งานอยู่
</Note>

## แนะนำ: ตั้งค่าพื้นที่ทำงานแบบกิลด์

เมื่อ DM ทำงานแล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็นพื้นที่ทำงานเต็มรูปแบบ โดยแต่ละช่องจะได้เซสชันเอเจนต์ของตัวเองพร้อมบริบทของตัวเอง วิธีนี้แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีเพียงคุณและบอตของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณไปยังรายการอนุญาตของกิลด์">
    สิ่งนี้ทำให้เอเจนต์ของคุณตอบกลับในช่องใดก็ได้บนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ DM

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เพิ่ม Discord Server ID `<server_id>` ของฉันไปยังรายการอนุญาตของกิลด์"
      </Tab>
      <Tab title="Config">

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
    โดยค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในช่องกิลด์เฉพาะเมื่อถูก @mention เท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณอาจต้องการให้ตอบกลับทุกข้อความ

    ในช่องกิลด์ คำตอบสุดท้ายปกติของผู้ช่วยยังคงเป็นส่วนตัวโดยค่าเริ่มต้น เอาต์พุต Discord ที่มองเห็นได้ต้องถูกส่งอย่างชัดเจนด้วยเครื่องมือ `message` เพื่อให้เอเจนต์สามารถเฝ้าดูแบบเงียบ ๆ เป็นค่าเริ่มต้น และโพสต์เฉพาะเมื่อเห็นว่าการตอบในช่องมีประโยชน์

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "อนุญาตให้เอเจนต์ของฉันตอบกลับบนเซิร์ฟเวอร์นี้ได้โดยไม่ต้องถูก @mentioned"
      </Tab>
      <Tab title="Config">
        ตั้งค่า `requireMention: false` ใน config กิลด์ของคุณ:

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

        หากต้องการคืนค่าการตอบกลับสุดท้ายอัตโนมัติแบบเดิมสำหรับห้องกลุ่ม/ช่อง ให้ตั้งค่า `messages.groupChat.visibleReplies: "automatic"`

      </Tab>
    </Tabs>

  </Step>

  <Step title="วางแผนสำหรับหน่วยความจำในช่องกิลด์">
    โดยค่าเริ่มต้น หน่วยความจำระยะยาว (MEMORY.md) จะโหลดเฉพาะในเซสชัน DM ช่องกิลด์จะไม่โหลด MEMORY.md อัตโนมัติ

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เมื่อฉันถามคำถามในช่อง Discord ให้ใช้ memory_search หรือ memory_get หากคุณต้องการบริบทระยะยาวจาก MEMORY.md"
      </Tab>
      <Tab title="ด้วยตนเอง">
        หากคุณต้องการบริบทที่ใช้ร่วมกันในทุกช่อง ให้ใส่คำสั่งที่คงที่ไว้ใน `AGENTS.md` หรือ `USER.md` (ไฟล์เหล่านี้จะถูกแทรกสำหรับทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงเมื่อจำเป็นด้วยเครื่องมือหน่วยความจำ
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้สร้างช่องบางช่องบนเซิร์ฟเวอร์ Discord ของคุณแล้วเริ่มแชตได้เลย เอเจนต์ของคุณสามารถเห็นชื่อช่อง และแต่ละช่องจะได้เซสชันแยกของตัวเอง ดังนั้นคุณสามารถตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ตามที่เหมาะกับเวิร์กโฟลว์ของคุณ

## โมเดลรันไทม์

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord
- การกำหนดเส้นทางการตอบกลับเป็นแบบกำหนดแน่นอน: การตอบกลับขาเข้าจาก Discord จะกลับไปยัง Discord
- เมทาดาทาของกิลด์/ช่อง Discord จะถูกเพิ่มเข้าไปในพรอมป์ของโมเดลเป็นบริบทที่ไม่น่าเชื่อถือ
  ไม่ใช่คำนำหน้าการตอบกลับที่ผู้ใช้มองเห็น หากโมเดลคัดลอกซองข้อมูลนั้นกลับมา
  OpenClaw จะตัดเมทาดาทาที่ถูกคัดลอกออกจากการตอบกลับขาออกและจาก
  บริบทการเล่นซ้ำในอนาคต
- โดยค่าเริ่มต้น (`session.dmScope=main`) แชตโดยตรงจะแชร์เซสชันหลักของเอเจนต์ (`agent:main:main`)
- ช่องของกิลด์จะเป็นคีย์เซสชันที่แยกออกจากกัน (`agent:<agentId>:discord:channel:<channelId>`)
- Group DM จะถูกละเว้นโดยค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่ง slash แบบเนทีฟจะทำงานในเซสชันคำสั่งที่แยกออกจากกัน (`agent:<agentId>:discord:slash:<userId>`) แต่ยังคงพา `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่ถูกกำหนดเส้นทาง
- การส่งประกาศ Cron/Heartbeat แบบข้อความเท่านั้นไปยัง Discord ใช้คำตอบสุดท้าย
  ที่ผู้ช่วยมองเห็นหนึ่งครั้ง เพย์โหลดสื่อและคอมโพเนนต์แบบมีโครงสร้างยังคงเป็น
  หลายข้อความเมื่อเอเจนต์ปล่อยเพย์โหลดที่ส่งมอบได้หลายรายการ

## ช่องฟอรัม

ช่องฟอรัมและช่องสื่อของ Discord รับได้เฉพาะโพสต์ในเธรดเท่านั้น OpenClaw รองรับสองวิธีในการสร้างเธรด:

- ส่งข้อความไปยังพาเรนต์ของฟอรัม (`channel:<forumId>`) เพื่อสร้างเธรดโดยอัตโนมัติ ชื่อเธรดจะใช้บรรทัดแรกที่ไม่ว่างของข้อความคุณ
- ใช้ `openclaw message thread create` เพื่อสร้างเธรดโดยตรง ห้ามส่ง `--message-id` สำหรับช่องฟอรัม

ตัวอย่าง: ส่งไปยังพาเรนต์ของฟอรัมเพื่อสร้างเธรด

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

ตัวอย่าง: สร้างเธรดฟอรัมอย่างชัดเจน

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

พาเรนต์ของฟอรัมไม่รับคอมโพเนนต์ Discord หากต้องใช้คอมโพเนนต์ ให้ส่งไปยังตัวเธรดเอง (`channel:<threadId>`)

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับคอนเทนเนอร์คอมโพเนนต์ v2 ของ Discord สำหรับข้อความเอเจนต์ ใช้เครื่องมือข้อความพร้อมเพย์โหลด `components` ผลลัพธ์จากการโต้ตอบจะถูกกำหนดเส้นทางกลับไปยังเอเจนต์ในฐานะข้อความขาเข้าปกติ และทำตามการตั้งค่า `replyToMode` ของ Discord ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถวการกระทำอนุญาตให้มีปุ่มได้สูงสุด 5 ปุ่มหรือเมนูเลือกเดียวหนึ่งรายการ
- ประเภทการเลือก: `string`, `user`, `role`, `mentionable`, `channel`

โดยค่าเริ่มต้น คอมโพเนนต์ใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่ออนุญาตให้ใช้ปุ่ม ตัวเลือก และฟอร์มได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดว่าใครคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (ID ผู้ใช้ Discord, แท็ก หรือ `*`) เมื่อกำหนดค่าแล้ว ผู้ใช้ที่ไม่ตรงกันจะได้รับการปฏิเสธแบบชั่วคราว

คำสั่ง slash `/model` และ `/models` จะเปิดตัวเลือกโมเดลแบบโต้ตอบพร้อมดรอปดาวน์ผู้ให้บริการ โมเดล และรันไทม์ที่เข้ากันได้ รวมถึงขั้นตอน Submit `/models add` เลิกใช้แล้วและตอนนี้จะส่งคืนข้อความการเลิกใช้แทนการลงทะเบียนโมเดลจากแชต การตอบกลับของตัวเลือกเป็นแบบชั่วคราว และมีเพียงผู้ใช้ที่เรียกใช้เท่านั้นที่ใช้งานได้

ไฟล์แนบ:

- บล็อก `file` ต้องชี้ไปยังการอ้างอิงไฟล์แนบ (`attachment://<filename>`)
- ระบุไฟล์แนบผ่าน `media`/`path`/`filePath` (ไฟล์เดียว); ใช้ `media-gallery` สำหรับหลายไฟล์
- ใช้ `filename` เพื่อแทนที่ชื่ออัปโหลดเมื่อควรตรงกับการอ้างอิงไฟล์แนบ

ฟอร์มโมดัล:

- เพิ่ม `components.modal` พร้อมฟิลด์ได้สูงสุด 5 ฟิลด์
- ประเภทฟิลด์: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw จะเพิ่มปุ่มทริกเกอร์โดยอัตโนมัติ

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM `channels.discord.allowFrom` คือ allowlist สำหรับ DM ที่เป็นมาตรฐาน

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องมี `channels.discord.allowFrom` ที่รวม `"*"`)
    - `disabled`

    หากนโยบาย DM ไม่ได้เปิดอยู่ ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือได้รับพรอมป์ให้จับคู่ในโหมด `pairing`)

    ลำดับความสำคัญของหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - สำหรับบัญชีเดียว `allowFrom` มีลำดับความสำคัญเหนือ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อ `allowFrom` ของตัวเองและ `dm.allowFrom` แบบเดิมไม่ได้ถูกตั้งค่า
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    `channels.discord.dm.policy` และ `channels.discord.dm.allowFrom` แบบเดิมยังคงอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การกล่าวถึง `<@id>`

    ID ที่เป็นตัวเลขล้วนโดยปกติจะถูกแก้เป็น ID ช่องเมื่อมีค่าเริ่มต้นของช่องทำงานอยู่ แต่ ID ที่อยู่ใน `allowFrom` สำหรับ DM ที่มีผลของบัญชีจะถูกปฏิบัติเป็นเป้าหมาย DM ของผู้ใช้เพื่อความเข้ากันได้

  </Tab>

  <Tab title="DM access groups">
    DM ของ Discord สามารถใช้รายการ `accessGroup:<name>` แบบไดนามิกใน `channels.discord.allowFrom`

    ชื่อกลุ่มการเข้าถึงใช้ร่วมกันในช่องข้อความต่างๆ ใช้ `type: "message.senders"` สำหรับกลุ่มแบบคงที่ซึ่งสมาชิกถูกระบุด้วยไวยากรณ์ `allowFrom` ปกติของแต่ละช่อง หรือ `type: "discord.channelAudience"` เมื่อผู้ชม `ViewChannel` ปัจจุบันของช่อง Discord ควรกำหนดสมาชิกภาพแบบไดนามิก พฤติกรรมกลุ่มการเข้าถึงที่ใช้ร่วมกันมีเอกสารที่นี่: [กลุ่มการเข้าถึง](/th/channels/access-groups)

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

    ช่องข้อความ Discord ไม่มีรายชื่อสมาชิกแยกต่างหาก `type: "discord.channelAudience"` จำลองสมาชิกภาพดังนี้: ผู้ส่ง DM เป็นสมาชิกของกิลด์ที่กำหนดค่าไว้ และในขณะนั้นมีสิทธิ์ `ViewChannel` ที่มีผลบนช่องที่กำหนดค่าไว้หลังจากนำบทบาทและการเขียนทับของช่องมาใช้แล้ว

    ตัวอย่าง: อนุญาตให้ทุกคนที่เห็น `#maintainers` สามารถ DM บอตได้ ขณะเดียวกันยังคงปิด DM สำหรับคนอื่นทั้งหมด

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

    การค้นหาจะล้มเหลวแบบปิด หาก Discord ส่งคืน `Missing Access` การค้นหาสมาชิกล้มเหลว หรือช่องเป็นของกิลด์อื่น ผู้ส่ง DM จะถูกถือว่าไม่ได้รับอนุญาต

    เปิดใช้ **Server Members Intent** ใน Discord Developer Portal สำหรับบอตเมื่อใช้กลุ่มการเข้าถึงแบบผู้ชมช่อง DM ไม่มีสถานะสมาชิกกิลด์ ดังนั้น OpenClaw จะแก้หาสมาชิกผ่าน Discord REST ตอนอนุญาตสิทธิ์

  </Tab>

  <Tab title="Guild policy">
    การจัดการกิลด์ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    เส้นฐานที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    พฤติกรรมของ `allowlist`:

    - กิลด์ต้องตรงกับ `channels.discord.guilds` (แนะนำ `id`, รับ slug ได้)
    - allowlist ผู้ส่งแบบไม่บังคับ: `users` (แนะนำ ID ที่เสถียร) และ `roles` (เฉพาะ ID บทบาท); หากกำหนดค่าอย่างใดอย่างหนึ่ง ผู้ส่งจะได้รับอนุญาตเมื่อเข้าคู่กับ `users` หรือ `roles`
    - การจับคู่ชื่อ/แท็กโดยตรงถูกปิดใช้งานโดยค่าเริ่มต้น; เปิดใช้ `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเป็นโหมดความเข้ากันได้แบบฉุกเฉิน
    - รองรับชื่อ/แท็กสำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อมีการใช้รายการชื่อ/แท็ก
    - หากกิลด์มีการกำหนดค่า `channels` ช่องที่ไม่อยู่ในรายการจะถูกปฏิเสธ
    - หากกิลด์ไม่มีบล็อก `channels` ช่องทั้งหมดในกิลด์ที่อยู่ใน allowlist นั้นจะได้รับอนุญาต

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

    หากคุณตั้งค่าเพียง `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` ค่า fallback ตอนรันไทม์คือ `groupPolicy="allowlist"` (พร้อมคำเตือนในล็อก) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`

  </Tab>

  <Tab title="Mentions and group DMs">
    ข้อความของกิลด์ถูกควบคุมด้วยการกล่าวถึงโดยค่าเริ่มต้น

    การตรวจจับการกล่าวถึงรวมถึง:

    - การกล่าวถึงบอตอย่างชัดเจน
    - รูปแบบการกล่าวถึงที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับบอตโดยนัยในกรณีที่รองรับ

    เมื่อเขียนข้อความ Discord ขาออก ให้ใช้ไวยากรณ์การกล่าวถึงมาตรฐาน: `<@USER_ID>` สำหรับผู้ใช้, `<#CHANNEL_ID>` สำหรับช่อง และ `<@&ROLE_ID>` สำหรับบทบาท ห้ามใช้รูปแบบการกล่าวถึงชื่อเล่นแบบเดิม `<@!USER_ID>`

    `requireMention` ถูกกำหนดค่าต่อกิลด์/ช่อง (`channels.discord.guilds...`)
    `ignoreOtherMentions` เลือกได้ว่าจะทิ้งข้อความที่กล่าวถึงผู้ใช้/บทบาทอื่นแต่ไม่ได้กล่าวถึงบอตหรือไม่ (ยกเว้น @everyone/@here)

    Group DM:

    - ค่าเริ่มต้น: ละเว้น (`dm.groupEnabled=false`)
    - allowlist แบบไม่บังคับผ่าน `dm.groupChannels` (ID ช่องหรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตามบทบาท

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิกกิลด์ Discord ไปยังเอเจนต์ต่างๆ ตาม ID บทบาท การผูกตามบทบาทรับเฉพาะ ID บทบาทเท่านั้น และจะถูกประเมินหลังจากการผูกแบบ peer หรือ parent-peer และก่อนการผูกแบบเฉพาะกิลด์ หากการผูกตั้งค่าฟิลด์ match อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ฟิลด์ที่กำหนดค่าทั้งหมดต้องตรงกัน

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

## คำสั่งเนทีฟและการยืนยันสิทธิ์คำสั่ง

- `commands.native` มีค่าเริ่มต้นเป็น `"auto"` และเปิดใช้งานสำหรับ Discord
- การ override ราย channel: `channels.discord.commands.native`
- `commands.native=false` จะข้ามการลงทะเบียนและการล้างคำสั่ง slash ของ Discord ระหว่าง startup คำสั่งที่เคยลงทะเบียนไว้ก่อนหน้านี้อาจยังมองเห็นได้ใน Discord จนกว่าคุณจะลบออกจากแอป Discord
- การยืนยันตัวตนของคำสั่ง native ใช้ allowlist/policy ของ Discord ชุดเดียวกับการจัดการข้อความปกติ
- คำสั่งอาจยังมองเห็นได้ใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต แต่การดำเนินการยังคงบังคับใช้การยืนยันตัวตนของ OpenClaw และส่งคืน "ไม่ได้รับอนุญาต"

ดู [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งและพฤติกรรม

การตั้งค่าคำสั่ง slash เริ่มต้น:

- `ephemeral: true`

## รายละเอียดฟีเจอร์

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord รองรับแท็กการตอบกลับในเอาต์พุตของ agent:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    ควบคุมโดย `channels.discord.replyToMode`:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`
    - `batched`

    หมายเหตุ: `off` ปิดใช้งานการจัดเธรดการตอบกลับแบบแฝง แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงถูกใช้ตามปกติ
    `first` จะแนบอ้างอิงการตอบกลับ native แบบแฝงกับข้อความ Discord ขาออกแรกของรอบนั้นเสมอ
    `batched` จะแนบอ้างอิงการตอบกลับ native แบบแฝงของ Discord เฉพาะเมื่อ
    รอบขาเข้าเป็นแบตช์ที่หน่วงรวมจากหลายข้อความ สิ่งนี้มีประโยชน์
    เมื่อคุณต้องการการตอบกลับ native เป็นหลักสำหรับแชตที่ส่งถี่และกำกวม ไม่ใช่ทุก
    รอบที่มีข้อความเดียว

    ID ข้อความจะถูกแสดงใน context/history เพื่อให้ agent สามารถกำหนดเป้าหมายข้อความเฉพาะได้

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw สามารถสตรีมคำตอบฉบับร่างได้โดยส่งข้อความชั่วคราวและแก้ไขข้อความนั้นเมื่อข้อความใหม่เข้ามา `channels.discord.streaming` รับค่า `off` (ค่าเริ่มต้น) | `partial` | `block` | `progress` `progress` จะคงฉบับร่างสถานะที่แก้ไขได้หนึ่งรายการและอัปเดตด้วยความคืบหน้าของเครื่องมือจนกว่าจะส่งผลลัพธ์สุดท้าย; `streamMode` เป็น alias แบบเดิมและจะถูกย้ายให้อัตโนมัติ

    ค่าเริ่มต้นยังคงเป็น `off` เพราะการแก้ไขตัวอย่างของ Discord ชน rate limit ได้อย่างรวดเร็วเมื่อ bot หรือ gateway หลายตัวใช้บัญชีเดียวกัน

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` แก้ไขข้อความตัวอย่างรายการเดียวเมื่อ token เข้ามา
    - `block` ส่ง chunk ขนาดฉบับร่าง (ใช้ `draftChunk` เพื่อปรับขนาดและจุดตัด โดยถูกจำกัดไม่เกิน `textChunkLimit`)
    - ผลลัพธ์สุดท้ายที่เป็นสื่อ ข้อผิดพลาด และการตอบกลับแบบชัดเจนจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าจะให้การอัปเดตเครื่องมือ/ความคืบหน้าใช้ข้อความตัวอย่างซ้ำหรือไม่

    การสตรีมตัวอย่างรองรับเฉพาะข้อความ; การตอบกลับที่เป็นสื่อจะ fallback ไปใช้การส่งแบบปกติ เมื่อเปิดใช้งานการสตรีม `block` อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    context ประวัติของ guild:

    - ค่าเริ่มต้นของ `channels.discord.historyLimit` คือ `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    การควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมของ thread:

    - thread ของ Discord จะ route เป็น session ของ channel และสืบทอด config ของ channel แม่ เว้นแต่จะถูก override
    - session ของ thread จะสืบทอดการเลือก `/model` ระดับ session ของ channel แม่เป็น fallback เฉพาะโมเดล; การเลือก `/model` เฉพาะใน thread ยังคงมีลำดับความสำคัญสูงกว่า และประวัติ transcript ของแม่จะไม่ถูกคัดลอก เว้นแต่จะเปิดใช้งานการสืบทอด transcript
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) เลือกให้ auto-thread ใหม่ seed จาก transcript ของแม่ การ override รายบัญชีอยู่ภายใต้ `channels.discord.accounts.<id>.thread.inheritParent`
    - reaction ของ message-tool สามารถ resolve เป้าหมาย DM แบบ `user:<id>` ได้
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะถูกคงไว้ระหว่าง fallback การเปิดใช้งานขั้นตอบกลับ

    หัวข้อ channel จะถูกฉีดเข้าเป็น context ที่ **ไม่น่าเชื่อถือ** allowlist ควบคุมว่าใครเรียก agent ได้ ไม่ใช่ขอบเขตการลบข้อมูล context เสริมทั้งหมด

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord สามารถผูก thread กับเป้าหมาย session เพื่อให้ข้อความติดตามผลใน thread นั้นยังคง route ไปยัง session เดิม (รวมถึง session ของ subagent)

    คำสั่ง:

    - `/focus <target>` ผูก thread ปัจจุบัน/ใหม่กับเป้าหมาย subagent/session
    - `/unfocus` ลบการผูก thread ปัจจุบัน
    - `/agents` แสดง run ที่ใช้งานอยู่และสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการ auto-unfocus เมื่อไม่มี activity สำหรับการผูกที่โฟกัสอยู่
    - `/session max-age <duration|off>` ตรวจสอบ/อัปเดตอายุสูงสุดแบบ hard max สำหรับการผูกที่โฟกัสอยู่

    Config:

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
    - `channels.discord.threadBindings.*` override พฤติกรรมของ Discord
    - `spawnSessions` ควบคุมการสร้าง/ผูก thread อัตโนมัติสำหรับ `sessions_spawn({ thread: true })` และการ spawn thread ของ ACP ค่าเริ่มต้น: `true`
    - `defaultSpawnContext` ควบคุม context ของ subagent native สำหรับการ spawn ที่ผูกกับ thread ค่าเริ่มต้น: `"fork"`
    - key `spawnSubagentSessions`/`spawnAcpSessions` ที่เลิกใช้แล้วจะถูกย้ายโดย `openclaw doctor --fix`
    - หากการผูก thread ถูกปิดใช้งานสำหรับบัญชี `/focus` และการดำเนินการผูก thread ที่เกี่ยวข้องจะไม่พร้อมใช้งาน

    ดู [Sub-agents](/th/tools/subagents), [ACP Agents](/th/tools/acp-agents) และ [Configuration Reference](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    สำหรับ workspace ACP แบบ "always-on" ที่เสถียร ให้กำหนดค่า binding ACP แบบมีชนิดที่ระดับบนสุดซึ่งกำหนดเป้าหมายไปยังบทสนทนา Discord

    เส้นทาง config:

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

    - `/acp spawn codex --bind here` ผูก channel หรือ thread ปัจจุบันไว้ในตำแหน่งเดิมและคงข้อความในอนาคตไว้บน session ACP เดิม ข้อความใน thread จะสืบทอด binding ของ channel แม่
    - ใน channel หรือ thread ที่ถูกผูกไว้ `/new` และ `/reset` จะ reset session ACP เดิมในตำแหน่งเดิม การผูก thread ชั่วคราวสามารถ override การ resolve เป้าหมายได้ขณะใช้งานอยู่
    - `spawnSessions` ควบคุมการสร้าง/ผูก thread ลูกผ่าน `--thread auto|here`

    ดู [ACP Agents](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมการผูก

  </Accordion>

  <Accordion title="Reaction notifications">
    โหมดการแจ้งเตือน reaction ราย guild:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    event ของ reaction จะถูกแปลงเป็น system event และแนบกับ session Discord ที่ถูก route

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` ส่ง emoji ยืนยันการรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback emoji ของตัวตน agent (`agents.list[].identity.emoji` มิฉะนั้นคือ "👀")

    หมายเหตุ:

    - Discord รับ emoji unicode หรือชื่อ emoji custom
    - ใช้ `""` เพื่อปิดใช้งาน reaction สำหรับ channel หรือบัญชี

  </Accordion>

  <Accordion title="Config writes">
    การเขียน config ที่เริ่มจาก channel เปิดใช้งานโดยค่าเริ่มต้น

    สิ่งนี้มีผลกับ flow `/config set|unset` (เมื่อเปิดใช้งานฟีเจอร์คำสั่ง)

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

  <Accordion title="Gateway proxy">
    route ทราฟฟิก WebSocket ของ Gateway Discord และการค้นหา REST ตอน startup (application ID + การ resolve allowlist) ผ่านพร็อกซี HTTP(S) ด้วย `channels.discord.proxy`

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    การ override รายบัญชี:

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

  <Accordion title="PluralKit support">
    เปิดใช้งานการ resolve ของ PluralKit เพื่อ map ข้อความที่ถูก proxy ไปยังตัวตนสมาชิกของระบบ:

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

    - allowlist สามารถใช้ `pk:<memberId>` ได้
    - ชื่อแสดงของสมาชิกจะถูกจับคู่ด้วยชื่อ/slug เท่านั้นเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การ lookup ใช้ ID ข้อความต้นฉบับและถูกจำกัดด้วยช่วงเวลา
    - หาก lookup ล้มเหลว ข้อความที่ถูก proxy จะถูกถือเป็นข้อความ bot และถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    ใช้ `mentionAliases` เมื่อ agent ต้องการ mention ขาออกแบบ deterministic สำหรับผู้ใช้ Discord ที่รู้จัก key เป็น handle ที่ไม่มี `@` นำหน้า; value เป็น ID ผู้ใช้ Discord handle ที่ไม่รู้จัก, `@everyone`, `@here` และ mention ภายใน span โค้ด Markdown จะถูกปล่อยไว้ไม่เปลี่ยนแปลง

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

  <Accordion title="Presence configuration">
    การอัปเดต presence จะถูกนำไปใช้เมื่อคุณตั้งค่า field status หรือ activity หรือเมื่อคุณเปิดใช้งาน auto presence

    ตัวอย่างเฉพาะ status:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    ตัวอย่าง activity (custom status เป็นชนิด activity เริ่มต้น):

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

    map ชนิด activity:

    - 0: Playing
    - 1: Streaming (ต้องมี `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (ใช้ข้อความ activity เป็นสถานะของ status; emoji เป็นตัวเลือก)
    - 5: Competing

    ตัวอย่าง auto presence (สัญญาณสุขภาพ runtime):

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

    auto presence map ความพร้อมใช้งานของ runtime ไปยัง status ของ Discord: healthy => online, degraded หรือ unknown => idle, exhausted หรือ unavailable => dnd การ override ข้อความแบบตัวเลือก:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับ placeholder `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord รองรับการจัดการการอนุมัติด้วยปุ่มใน DM และสามารถโพสต์ prompt การอนุมัติใน channel ต้นทางได้ตามตัวเลือก

    เส้นทาง config:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; ย้อนกลับไปใช้ `commands.ownerAllowFrom` เมื่อทำได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord จะเปิดใช้การอนุมัติ exec แบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และสามารถระบุผู้อนุมัติได้อย่างน้อยหนึ่งคน ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมานผู้อนุมัติ exec จาก `allowFrom` ของแชนแนล, `dm.allowFrom` แบบเดิม หรือ `defaultTo` ของข้อความโดยตรง ตั้งค่า `enabled: false` เพื่อปิดใช้ Discord เป็นไคลเอนต์การอนุมัติแบบเนทีฟอย่างชัดเจน

    สำหรับคำสั่งกลุ่มที่ละเอียดอ่อนและจำกัดเฉพาะเจ้าของ เช่น `/diagnostics` และ `/export-trajectory` OpenClaw จะส่งพรอมป์การอนุมัติและผลลัพธ์สุดท้ายแบบส่วนตัว โดยจะลองใช้ Discord DM ก่อนเมื่อเจ้าของที่เรียกใช้มีเส้นทางเจ้าของของ Discord; หากไม่มี จะย้อนกลับไปใช้เส้นทางเจ้าของแรกที่พร้อมใช้งานจาก `commands.ownerAllowFrom` เช่น Telegram

    เมื่อ `target` เป็น `channel` หรือ `both` พรอมป์การอนุมัติจะมองเห็นได้ในแชนแนล เฉพาะผู้อนุมัติที่ระบุได้เท่านั้นที่ใช้ปุ่มได้; ผู้ใช้อื่นจะได้รับการปฏิเสธแบบชั่วคราว พรอมป์การอนุมัติจะมีข้อความคำสั่งอยู่ด้วย ดังนั้นให้เปิดใช้การส่งผ่านแชนแนลเฉพาะในแชนแนลที่เชื่อถือได้เท่านั้น หากไม่สามารถดึง ID แชนแนลจากคีย์เซสชันได้ OpenClaw จะย้อนกลับไปส่งผ่าน DM

    Discord ยังแสดงปุ่มอนุมัติที่ใช้ร่วมกันกับแชนแนลแชทอื่นด้วย อะแดปเตอร์ Discord แบบเนทีฟหลัก ๆ จะเพิ่มการจัดเส้นทาง DM ของผู้อนุมัติและการกระจายไปยังแชนแนล
    เมื่อมีปุ่มเหล่านั้นอยู่ ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก; OpenClaw
    ควรรวมคำสั่ง `/approve` แบบแมนนวลไว้เฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่า
    การอนุมัติผ่านแชทไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นวิธีเดียวเท่านั้น
    หากรันไทม์การอนุมัติแบบเนทีฟของ Discord ไม่ทำงาน OpenClaw จะคงพรอมป์
    `/approve <id> <decision>` แบบกำหนดได้ในเครื่องให้มองเห็นได้ หากรันไทม์
    ทำงานอยู่แต่ไม่สามารถส่งการ์ดเนทีฟไปยังเป้าหมายใดได้ OpenClaw จะส่งประกาศ
    สำรองในแชทเดียวกันพร้อมคำสั่ง `/approve` ที่ตรงกันจากการอนุมัติที่รอดำเนินการ

    การตรวจสอบสิทธิ์ Gateway และการระบุผลการอนุมัติทำตามสัญญาไคลเอนต์ Gateway ที่ใช้ร่วมกัน (`plugin:` IDs ระบุผลผ่าน `plugin.approval.resolve`; IDs อื่นผ่าน `exec.approval.resolve`) การอนุมัติจะหมดอายุหลังจาก 30 นาทีตามค่าเริ่มต้น

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและเกตการดำเนินการ

การดำเนินการกับข้อความ Discord รวมถึงการส่งข้อความ การดูแลแชนแนล การกลั่นกรอง การแสดงสถานะ และการดำเนินการกับเมตาดาต้า

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- รีแอ็กชัน: `react`, `reactions`, `emojiList`
- การกลั่นกรอง: `timeout`, `kick`, `ban`
- การแสดงสถานะ: `setPresence`

การดำเนินการ `event-create` รับพารามิเตอร์ `image` แบบไม่บังคับ (URL หรือพาธไฟล์ในเครื่อง) เพื่อตั้งค่าภาพปกของอีเวนต์ที่กำหนดเวลาไว้

เกตการดำเนินการอยู่ภายใต้ `channels.discord.actions.*`

พฤติกรรมเกตเริ่มต้น:

| กลุ่มการดำเนินการ                                                                                                                                                             | ค่าเริ่มต้น  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้  |
| roles                                                                                                                                                                    | ปิดใช้ |
| moderation                                                                                                                                                               | ปิดใช้ |
| presence                                                                                                                                                                 | ปิดใช้ |

## UI Components v2

OpenClaw ใช้ Discord components v2 สำหรับการอนุมัติ exec และมาร์กเกอร์ข้ามบริบท การดำเนินการกับข้อความ Discord ยังรับ `components` สำหรับ UI แบบกำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้างเพย์โหลดคอมโพเนนต์ผ่านเครื่องมือ discord) ขณะที่ `embeds` แบบเดิมยังพร้อมใช้งานแต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นที่ใช้โดยคอนเทนเนอร์คอมโพเนนต์ของ Discord (hex)
- ตั้งค่าต่อบัญชีด้วย `channels.discord.accounts.<id>.ui.components.accentColor`
- `embeds` จะถูกละเว้นเมื่อมี components v2 อยู่

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

Discord มีพื้นผิวเสียงที่แตกต่างกันสองแบบ: **แชนแนลเสียง** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบพรีวิวคลื่นเสียง) Gateway รองรับทั้งสองแบบ

### แชนแนลเสียง

รายการตรวจสอบการตั้งค่า:

1. เปิดใช้ Message Content Intent ใน Discord Developer Portal
2. เปิดใช้ Server Members Intent เมื่อใช้รายการอนุญาตบทบาท/ผู้ใช้
3. เชิญบอตด้วยสโคป `bot` และ `applications.commands`
4. ให้สิทธิ์ Connect, Speak, Send Messages และ Read Message History ในแชนแนลเสียงเป้าหมาย
5. เปิดใช้คำสั่งเนทีฟ (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งนี้ใช้เอเจนต์เริ่มต้นของบัญชีและทำตามรายการอนุญาตและกฎนโยบายกลุ่มเดียวกับคำสั่ง Discord อื่น ๆ

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

ตัวอย่างการเข้าร่วมอัตโนมัติ:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

หมายเหตุ:

- `voice.tts` แทนที่ `messages.tts` สำหรับการเล่นเสียงเท่านั้น
- `voice.model` แทนที่ LLM ที่ใช้สำหรับการตอบกลับในแชนแนลเสียง Discord เท่านั้น ปล่อยว่างไว้เพื่อสืบทอดโมเดลเอเจนต์ที่ถูกกำหนดเส้นทาง
- STT ใช้ `tools.media.audio`; `voice.model` ไม่ส่งผลต่อการถอดเสียง
- การแทนที่ `systemPrompt` ของ Discord ต่อแชนแนลจะใช้กับรอบข้อความถอดเสียงสำหรับแชนแนลเสียงนั้น
- รอบข้อความถอดเสียงจะดึงสถานะเจ้าของจาก `allowFrom` ของ Discord (หรือ `dm.allowFrom`); ผู้พูดที่ไม่ใช่เจ้าของไม่สามารถเข้าถึงเครื่องมือเฉพาะเจ้าของได้ (เช่น `gateway` และ `cron`)
- เสียง Discord เป็นแบบเลือกเปิดสำหรับคอนฟิกที่เป็นข้อความเท่านั้น; ตั้งค่า `channels.discord.voice.enabled=true` (หรือคงบล็อก `channels.discord.voice` ที่มีอยู่) เพื่อเปิดใช้คำสั่ง `/vc`, รันไทม์เสียง และ Gateway intent `GuildVoiceStates`
- `channels.discord.intents.voiceStates` สามารถแทนที่การสมัครรับ intent สถานะเสียงได้อย่างชัดเจน ปล่อยว่างไว้เพื่อให้ intent ทำตามการเปิดใช้เสียงที่มีผลจริง
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือก join ของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- `voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และการพยายามเข้าร่วมอัตโนมัติ ค่าเริ่มต้น: `30000`
- `voice.reconnectGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอให้เซสชันเสียงที่ถูกตัดการเชื่อมต่อเริ่มเชื่อมต่อใหม่ก่อนทำลายเซสชันนั้น ค่าเริ่มต้น: `15000`
- OpenClaw ยังเฝ้าดูความล้มเหลวในการถอดรหัสฝั่งรับ และกู้คืนอัตโนมัติโดยออกจาก/เข้าร่วมแชนแนลเสียงอีกครั้งหลังเกิดความล้มเหลวซ้ำ ๆ ในช่วงเวลาสั้น
- หากบันทึกฝั่งรับแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำ ๆ หลังอัปเดต ให้รวบรวมรายงานการพึ่งพาและบันทึก บรรทัด `@discordjs/voice` ที่รวมมาแล้วมีแพตช์แก้ padding จาก upstream ใน discord.js PR #11449 ซึ่งปิด discord.js issue #11419

ไปป์ไลน์แชนแนลเสียง:

- การจับ PCM ของ Discord ถูกแปลงเป็นไฟล์ WAV ชั่วคราว
- `tools.media.audio` จัดการ STT เช่น `openai/gpt-4o-mini-transcribe`
- ข้อความถอดเสียงถูกส่งผ่านทางเข้าและการจัดเส้นทางของ Discord ขณะที่ LLM ตอบกลับทำงานด้วยนโยบายเอาต์พุตเสียงที่ซ่อนเครื่องมือ `tts` ของเอเจนต์และขอให้คืนข้อความ เพราะเสียง Discord เป็นเจ้าของการเล่น TTS สุดท้าย
- `voice.model` เมื่อกำหนดไว้ จะแทนที่เฉพาะ LLM ตอบกลับสำหรับรอบแชนแนลเสียงนี้
- `voice.tts` ถูกผสานทับ `messages.tts`; เสียงผลลัพธ์จะถูกเล่นในแชนแนลที่เข้าร่วมอยู่

ข้อมูลรับรองถูกระบุต่อคอมโพเนนต์: การตรวจสอบสิทธิ์เส้นทาง LLM สำหรับ `voice.model`, การตรวจสอบสิทธิ์ STT สำหรับ `tools.media.audio` และการตรวจสอบสิทธิ์ TTS สำหรับ `messages.tts`/`voice.tts`

### ข้อความเสียง

ข้อความเสียง Discord แสดงพรีวิวคลื่นเสียงและต้องใช้ออดิโอ OGG/Opus OpenClaw สร้างคลื่นเสียงให้อัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ Gateway เพื่อตรวจสอบและแปลง

- ระบุ **พาธไฟล์ในเครื่อง** (URL จะถูกปฏิเสธ)
- ละเว้นเนื้อหาข้อความ (Discord ปฏิเสธข้อความ + ข้อความเสียงในเพย์โหลดเดียวกัน)
- รองรับรูปแบบออดิโอใดก็ได้; OpenClaw จะแปลงเป็น OGG/Opus ตามต้องการ

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ใช้ intents ที่ไม่อนุญาต หรือบอตไม่เห็นข้อความกิลด์">

    - เปิดใช้ Message Content Intent
    - เปิดใช้ Server Members Intent เมื่อคุณพึ่งพาการระบุผู้ใช้/สมาชิก
    - รีสตาร์ท Gateway หลังเปลี่ยน intents

  </Accordion>

  <Accordion title="ข้อความกิลด์ถูกบล็อกโดยไม่คาดคิด">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบรายการอนุญาตกิลด์ภายใต้ `channels.discord.guilds`
    - หากมีแผนที่ `channels` ของกิลด์อยู่ จะอนุญาตเฉพาะแชนแนลที่ระบุไว้เท่านั้น
    - ตรวจสอบพฤติกรรม `requireMention` และรูปแบบการกล่าวถึง

    การตรวจสอบที่มีประโยชน์:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention เป็น false แต่ยังถูกบล็อก">
    สาเหตุทั่วไป:

    - `groupPolicy="allowlist"` โดยไม่มีรายการอนุญาตกิลด์/แชนแนลที่ตรงกัน
    - กำหนดค่า `requireMention` ผิดตำแหน่ง (ต้องอยู่ภายใต้ `channels.discord.guilds` หรือรายการแชนแนล)
    - ผู้ส่งถูกบล็อกโดยรายการอนุญาต `users` ของกิลด์/แชนแนล

  </Accordion>

  <Accordion title="รอบ Discord ที่ทำงานนาน หรือการตอบกลับซ้ำ">

    บันทึกทั่วไป:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    ปุ่มปรับแต่งคิว Gateway ของ Discord:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ค่านี้ควบคุมเฉพาะงานตัวฟัง Gateway ของ Discord ไม่ใช่อายุรอบของเอเจนต์

    Discord ไม่ใช้ไทม์เอาต์ที่แชนแนลเป็นเจ้าของกับรอบเอเจนต์ที่เข้าคิวไว้ ตัวฟังข้อความจะส่งต่อทันที และการรัน Discord ที่เข้าคิวไว้จะรักษาลำดับต่อเซสชันจนกว่าอายุการทำงานของเซสชัน/เครื่องมือ/รันไทม์จะเสร็จสิ้นหรือยกเลิกงาน

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

  <Accordion title="คำเตือนหมดเวลาการค้นหาเมตาดาต้า Gateway">
    OpenClaw ดึงเมตาดาต้า `/gateway/bot` ของ Discord ก่อนเชื่อมต่อ ความล้มเหลวชั่วคราวจะย้อนกลับไปใช้ URL Gateway เริ่มต้นของ Discord และถูกจำกัดอัตราในบันทึก

    ปุ่มปรับแต่งไทม์เอาต์เมตาดาต้า:

    - บัญชีเดียว: `channels.discord.gatewayInfoTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env สำรองเมื่อไม่ได้ตั้งค่าคอนฟิก: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - ค่าเริ่มต้น: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="Gateway รีสตาร์ทเมื่อ READY หมดเวลา">
    OpenClaw รอเหตุการณ์ `READY` ของ gateway ของ Discord ระหว่างการเริ่มต้นและหลังการเชื่อมต่อใหม่ขณะรันไทม์ การตั้งค่าหลายบัญชีที่มีการหน่วงเวลาเริ่มต้นอาจต้องใช้ช่วงเวลา READY ตอนเริ่มต้นที่ยาวกว่าค่าเริ่มต้น

    ตัวปรับแต่งการหมดเวลา READY:

    - บัญชีเดียวตอนเริ่มต้น: `channels.discord.gatewayReadyTimeoutMs`
    - หลายบัญชีตอนเริ่มต้น: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - ค่าสำรอง env ตอนเริ่มต้นเมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นตอนเริ่มต้น: `15000` (15 วินาที), สูงสุด: `120000`
    - บัญชีเดียวขณะรันไทม์: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - หลายบัญชีขณะรันไทม์: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - ค่าสำรอง env ขณะรันไทม์เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นขณะรันไทม์: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="การตรวจสอบสิทธิ์ไม่ตรงกัน">
    การตรวจสอบสิทธิ์ของ `channels status --probe` ใช้งานได้เฉพาะกับ ID ช่องแบบตัวเลขเท่านั้น

    หากคุณใช้คีย์แบบ slug การจับคู่ขณะรันไทม์ยังคงทำงานได้ แต่ probe จะไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน

  </Accordion>

  <Accordion title="ปัญหา DM และการจับคู่">

    - ปิดใช้งาน DM: `channels.discord.dm.enabled=false`
    - ปิดใช้งานนโยบาย DM: `channels.discord.dmPolicy="disabled"` (เดิม: `channels.discord.dm.policy`)
    - กำลังรออนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูปจากบอตถึงบอต">
    โดยค่าเริ่มต้น ข้อความที่บอตเป็นผู้เขียนจะถูกละเว้น

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎการกล่าวถึงและ allowlist ที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมวนลูป
    แนะนำให้ใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความจากบอตที่กล่าวถึงบอตนี้เท่านั้น

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

  <Accordion title="STT เสียงหลุดพร้อม DecryptionFailed(...)">

    - ใช้ OpenClaw เวอร์ชันปัจจุบันเสมอ (`openclaw update`) เพื่อให้มีตรรกะกู้คืนการรับเสียงของ Discord
    - ยืนยันว่า `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้นจาก upstream) และปรับเฉพาะเมื่อจำเป็น
    - ดูบันทึกสำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากยังล้มเหลวต่อหลังจากเข้าร่วมใหม่อัตโนมัติ ให้รวบรวมบันทึกและเปรียบเทียบกับประวัติการรับ DAVE จาก upstream ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Discord](/th/gateway/config-channels#discord)

<Accordion title="ฟิลด์ Discord ที่มีสัญญาณสำคัญ">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `token`, `accounts.*`, `allowBots`
- นโยบาย: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- คำสั่ง: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- คิวเหตุการณ์: `eventQueue.listenerTimeout` (งบเวลาของ listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- การตอบกลับ/ประวัติ: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่ง: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- การสตรีม: `streaming` (alias เดิม: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- สื่อ/การลองใหม่: `mediaMaxMb` (จำกัดการอัปโหลดออกไปยัง Discord, ค่าเริ่มต้น `100MB`), `retry`
- การกระทำ: `actions.*`
- สถานะออนไลน์: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ฟีเจอร์: `threadBindings`, ระดับบนสุด `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการปฏิบัติการ

- จัดการโทเค็นบอตเป็นความลับ (แนะนำให้ใช้ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการกำกับดูแล)
- ให้สิทธิ์ Discord เท่าที่จำเป็นเท่านั้น
- หากการ deploy/สถานะของคำสั่งล้าสมัย ให้รีสตาร์ท gateway แล้วตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Discord กับ gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรมแชตกลุ่มและ allowlist
  </Card>
  <Card title="การกำหนดเส้นทางช่อง" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยัง agent
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    แบบจำลองภัยคุกคามและการเพิ่มความแข็งแกร่ง
  </Card>
  <Card title="การกำหนดเส้นทางแบบหลาย agent" icon="sitemap" href="/th/concepts/multi-agent">
    จับคู่ guild และช่องกับ agent
  </Card>
  <Card title="คำสั่ง slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่ง native
  </Card>
</CardGroup>
