---
read_when:
    - การทำงานกับฟีเจอร์ช่องทาง Discord
summary: สถานะการรองรับบอต Discord ความสามารถ และการกำหนดค่า
title: Discord
x-i18n:
    generated_at: "2026-05-10T19:21:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121b0b46bfb0d438f6ebfba4c93410c2ecfe8f99aa257e362b8767bf0aac27ce
    source_path: channels/discord.md
    workflow: 16
---

พร้อมสำหรับ DM และช่องกิลด์ผ่าน Discord gateway อย่างเป็นทางการ

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    Discord DM จะใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    ลักษณะการทำงานของคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องและโฟลว์การซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

คุณจะต้องสร้างแอปพลิเคชันใหม่พร้อมบอท เพิ่มบอทไปยังเซิร์ฟเวอร์ของคุณ และจับคู่กับ OpenClaw เราแนะนำให้เพิ่มบอทของคุณไปยังเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากยังไม่มี [ให้สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="สร้างแอปพลิเคชันและบอท Discord">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อประมาณว่า "OpenClaw"

    คลิก **Bot** ในแถบด้านข้าง ตั้งค่า **Username** เป็นชื่อที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้เจตนาแบบมีสิทธิ์พิเศษ">
    ยังคงอยู่ที่หน้า **Bot** เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับรายการอนุญาตตามบทบาทและการจับคู่ชื่อกับ ID)
    - **Presence Intent** (ไม่บังคับ; จำเป็นเฉพาะสำหรับการอัปเดตสถานะออนไลน์)

  </Step>

  <Step title="คัดลอกโทเค็นบอทของคุณ">
    เลื่อนกลับขึ้นไปที่หน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อจะเป็นเช่นนั้น แต่การดำเนินการนี้จะสร้างโทเค็นแรกของคุณ ไม่มีสิ่งใดถูก "รีเซ็ต"
    </Note>

    คัดลอกโทเค็นและบันทึกไว้ที่ใดสักแห่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในอีกไม่นาน

  </Step>

  <Step title="สร้าง URL เชิญและเพิ่มบอทไปยังเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** ในแถบด้านข้าง คุณจะสร้าง URL เชิญพร้อมสิทธิ์ที่ถูกต้องเพื่อเพิ่มบอทไปยังเซิร์ฟเวอร์ของคุณ

    เลื่อนลงไปที่ **OAuth2 URL Generator** แล้วเปิดใช้:

    - `bot`
    - `applications.commands`

    ส่วน **Bot Permissions** จะปรากฏด้านล่าง เปิดใช้อย่างน้อย:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (ไม่บังคับ)

    นี่คือชุดพื้นฐานสำหรับช่องข้อความทั่วไป หากคุณวางแผนจะโพสต์ในเธรด Discord รวมถึงเวิร์กโฟลว์ช่องฟอรัมหรือช่องสื่อที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้ **Send Messages in Threads** ด้วย
    คัดลอก URL ที่สร้างขึ้นด้านล่าง วางลงในเบราว์เซอร์ของคุณ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอทของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิดใช้ Developer Mode และรวบรวม ID ของคุณ">
    กลับไปที่แอป Discord คุณต้องเปิดใช้ Developer Mode เพื่อให้คัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนเฟืองถัดจากอวาตาร์ของคุณ) → **Advanced** → เปิดสวิตช์ **Developer Mode**
    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ของคุณไว้คู่กับ Bot Token ของคุณ คุณจะส่งทั้งสามอย่างให้ OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาต DM จากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงาน Discord ต้องอนุญาตให้บอทของคุณส่ง DM ถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณ → **Privacy Settings** → เปิดสวิตช์ **Direct Messages**

    สิ่งนี้อนุญาตให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอท) ส่ง DM ถึงคุณได้ เปิดใช้งานไว้หากคุณต้องการใช้ Discord DM กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่องกิลด์ คุณสามารถปิด DM หลังจากจับคู่แล้ว

  </Step>

  <Step title="ตั้งค่าโทเค็นบอทของคุณอย่างปลอดภัย (อย่าส่งในแชท)">
    โทเค็นบอท Discord ของคุณเป็นความลับ (เหมือนรหัสผ่าน) ตั้งค่าบนเครื่องที่รัน OpenClaw ก่อนส่งข้อความหาเอเจนต์ของคุณ

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

    หาก OpenClaw กำลังรันเป็นบริการเบื้องหลังอยู่แล้ว ให้รีสตาร์ตผ่านแอป OpenClaw Mac หรือโดยหยุดแล้วเริ่มกระบวนการ `openclaw gateway run` ใหม่
    สำหรับการติดตั้งบริการที่มีการจัดการ ให้รัน `openclaw gateway install` จากเชลล์ที่มี `DISCORD_BOT_TOKEN` อยู่ หรือเก็บตัวแปรไว้ใน `~/.openclaw/.env` เพื่อให้บริการสามารถ resolve env SecretRef ได้หลังรีสตาร์ต
    หากโฮสต์ของคุณถูกบล็อกหรือถูกจำกัดอัตราโดยการ lookup แอปพลิเคชันตอนเริ่มต้นของ Discord ให้ตั้งค่า ID แอปพลิเคชัน/ไคลเอนต์ Discord จาก Developer Portal เพื่อให้การเริ่มต้นข้าม REST call นั้นได้ ใช้ `channels.discord.applicationId` สำหรับบัญชีเริ่มต้น หรือ `channels.discord.accounts.<accountId>.applicationId` เมื่อคุณรันบอท Discord หลายตัว

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        แชทกับเอเจนต์ OpenClaw ของคุณบนช่องที่มีอยู่ใดก็ได้ (เช่น Telegram) แล้วบอกให้ตั้งค่า หาก Discord เป็นช่องแรกของคุณ ให้ใช้แท็บ CLI / config แทน

        > "I already set my Discord bot token in config. Please finish Discord setup with User ID `<user_id>` and Server ID `<server_id>`."
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

        Env fallback สำหรับบัญชีเริ่มต้น:

```bash
DISCORD_BOT_TOKEN=...
```

        สำหรับการตั้งค่าแบบสคริปต์หรือระยะไกล ให้เขียนบล็อก JSON5 เดียวกันด้วย `openclaw config patch --file ./discord.patch.json5 --dry-run` แล้วรันซ้ำโดยไม่มี `--dry-run` รองรับค่า `token` แบบข้อความธรรมดา และรองรับค่า SecretRef สำหรับ `channels.discord.token` ผ่าน provider แบบ env/file/exec ด้วย ดู [การจัดการความลับ](/th/gateway/secrets)

        สำหรับบอท Discord หลายตัว ให้เก็บโทเค็นบอทและ ID แอปพลิเคชันแต่ละชุดไว้ใต้บัญชีของตัวเอง `channels.discord.applicationId` ระดับบนจะถูกสืบทอดโดยบัญชีต่าง ๆ ดังนั้นให้ตั้งไว้ที่นั่นเฉพาะเมื่อทุกบัญชีควรใช้ ID แอปพลิเคชันเดียวกัน

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
    รอจนกว่า gateway จะรันอยู่ จากนั้น DM หาบอทของคุณใน Discord บอทจะตอบกลับด้วยรหัสจับคู่

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        ส่งรหัสจับคู่ไปยังเอเจนต์ของคุณบนช่องที่มีอยู่:

        > "Approve this Discord pairing code: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    รหัสจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง

    ตอนนี้คุณควรแชทกับเอเจนต์ของคุณใน Discord ผ่าน DM ได้แล้ว

  </Step>
</Steps>

<Note>
การ resolve โทเค็นรับรู้บัญชี ค่าโทเค็นใน config ชนะ env fallback `DISCORD_BOT_TOKEN` ใช้เฉพาะสำหรับบัญชีเริ่มต้นเท่านั้น
หากบัญชี Discord ที่เปิดใช้สองบัญชี resolve เป็นโทเค็นบอทเดียวกัน OpenClaw จะเริ่ม gateway monitor เพียงตัวเดียวสำหรับโทเค็นนั้น โทเค็นจาก config ชนะ env fallback เริ่มต้น มิฉะนั้นบัญชีที่เปิดใช้บัญชีแรกจะชนะ และบัญชีที่ซ้ำจะถูกรายงานว่าปิดใช้งาน
สำหรับการเรียก outbound ขั้นสูง (เครื่องมือ message/การกระทำของช่อง) จะใช้ `token` แบบระบุต่อการเรียกสำหรับการเรียกนั้น สิ่งนี้ใช้กับการกระทำแบบส่งและแบบอ่าน/probe (เช่น read/search/fetch/thread/pins/permissions) การตั้งค่านโยบายบัญชี/การลองซ้ำยังคงมาจากบัญชีที่เลือกใน snapshot รันไทม์ที่ใช้งานอยู่
</Note>

## แนะนำ: ตั้งค่าพื้นที่ทำงานกิลด์

เมื่อ DM ทำงานแล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็นพื้นที่ทำงานเต็มรูปแบบ โดยแต่ละช่องจะได้รับเซสชันเอเจนต์ของตัวเองพร้อมบริบทของตัวเอง วิธีนี้แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีแค่คุณกับบอทของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณไปยังรายการอนุญาตกิลด์">
    สิ่งนี้ทำให้เอเจนต์ของคุณตอบกลับในช่องใดก็ได้บนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ DM

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "Add my Discord Server ID `<server_id>` to the guild allowlist"
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
    โดยค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในช่องกิลด์เฉพาะเมื่อถูก @mentioned เท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณน่าจะต้องการให้ตอบกลับทุกข้อความ

    ในช่องกิลด์ การตอบกลับสุดท้ายของผู้ช่วยตามปกติจะยังคงเป็นส่วนตัวโดยค่าเริ่มต้น เอาต์พุต Discord ที่มองเห็นได้ต้องถูกส่งอย่างชัดเจนด้วยเครื่องมือ `message` เพื่อให้เอเจนต์สามารถเฝ้าดูแบบเงียบ ๆ ตามค่าเริ่มต้นและโพสต์เฉพาะเมื่อพิจารณาว่าการตอบกลับในช่องมีประโยชน์

    นั่นหมายความว่าโมเดลที่เลือกต้องเรียกเครื่องมือได้อย่างเชื่อถือ หาก Discord แสดงว่ากำลังพิมพ์และบันทึกแสดงการใช้โทเค็นแต่ไม่มีข้อความที่โพสต์ ให้ตรวจสอบบันทึกเซสชันสำหรับข้อความผู้ช่วยที่มี `didSendViaMessagingTool: false` นั่นหมายความว่าโมเดลสร้างคำตอบสุดท้ายแบบส่วนตัวแทนที่จะเรียก `message(action=send)` เปลี่ยนไปใช้โมเดลที่เรียกเครื่องมือได้แข็งแกร่งกว่า หรือใช้ config ด้านล่างเพื่อคืนค่าการตอบกลับสุดท้ายอัตโนมัติแบบเดิม

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "Allow my agent to respond on this server without having to be @mentioned"
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
    โดยค่าเริ่มต้น หน่วยความจำระยะยาว (MEMORY.md) จะโหลดเฉพาะในเซสชัน DM เท่านั้น ช่องกิลด์จะไม่โหลด MEMORY.md โดยอัตโนมัติ

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "When I ask questions in Discord channels, use memory_search or memory_get if you need long-term context from MEMORY.md."
      </Tab>
      <Tab title="Manual">
        หากคุณต้องการบริบทที่ใช้ร่วมกันในทุกช่อง ให้ใส่คำสั่งที่เสถียรไว้ใน `AGENTS.md` หรือ `USER.md` (จะถูกฉีดเข้าไปในทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงเมื่อต้องการด้วยเครื่องมือหน่วยความจำ
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างช่องบางช่องบนเซิร์ฟเวอร์ Discord ของคุณแล้วเริ่มแชท เอเจนต์ของคุณสามารถเห็นชื่อช่องได้ และแต่ละช่องจะได้รับเซสชันแยกของตัวเอง ดังนั้นคุณจึงสามารถตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ได้ที่เหมาะกับเวิร์กโฟลว์ของคุณ

## โมเดลรันไทม์

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord
- การกำหนดเส้นทางการตอบกลับเป็นแบบกำหนดแน่นอน: การตอบกลับขาเข้าจาก Discord จะกลับไปยัง Discord
- เมตาดาต้า guild/channel ของ Discord จะถูกเพิ่มไปยังพรอมป์ของโมเดลในฐานะบริบทที่ไม่น่าเชื่อถือ
  ไม่ใช่คำนำหน้าการตอบกลับที่ผู้ใช้มองเห็น หากโมเดลคัดลอกซองข้อมูลนั้น
  กลับมา OpenClaw จะลบเมตาดาต้าที่ถูกคัดลอกจากการตอบกลับขาออกและจาก
  บริบทการเล่นซ้ำในอนาคต
- โดยค่าเริ่มต้น (`session.dmScope=main`) แชตโดยตรงจะแชร์เซสชันหลักของเอเจนต์ (`agent:main:main`)
- ช่อง guild เป็นคีย์เซสชันที่แยกกัน (`agent:<agentId>:discord:channel:<channelId>`)
- Group DM จะถูกละเว้นโดยค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่ง slash แบบเนทีฟจะทำงานในเซสชันคำสั่งที่แยกไว้ (`agent:<agentId>:discord:slash:<userId>`) ขณะเดียวกันยังคงพก `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่ถูกกำหนดเส้นทาง
- การส่งประกาศ cron/heartbeat แบบข้อความล้วนไปยัง Discord ใช้คำตอบสุดท้าย
  ที่ผู้ช่วยมองเห็นได้เพียงครั้งเดียว เพย์โหลดสื่อและคอมโพเนนต์แบบมีโครงสร้างยังคง
  เป็นหลายข้อความเมื่อเอเจนต์ปล่อยเพย์โหลดที่ส่งมอบได้หลายรายการ

## ช่องฟอรัม

ช่องฟอรัมและสื่อของ Discord ยอมรับเฉพาะโพสต์ในเธรดเท่านั้น OpenClaw รองรับสองวิธีในการสร้างโพสต์เหล่านี้:

- ส่งข้อความไปยังฟอรัมหลัก (`channel:<forumId>`) เพื่อสร้างเธรดโดยอัตโนมัติ ชื่อเธรดจะใช้บรรทัดแรกที่ไม่ว่างของข้อความของคุณ
- ใช้ `openclaw message thread create` เพื่อสร้างเธรดโดยตรง อย่าส่ง `--message-id` สำหรับช่องฟอรัม

ตัวอย่าง: ส่งไปยังฟอรัมหลักเพื่อสร้างเธรด

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

ตัวอย่าง: สร้างเธรดฟอรัมอย่างชัดเจน

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

ฟอรัมหลักไม่ยอมรับคอมโพเนนต์ของ Discord หากคุณต้องใช้คอมโพเนนต์ ให้ส่งไปยังเธรดเอง (`channel:<threadId>`)

## คอมโพเนนต์เชิงโต้ตอบ

OpenClaw รองรับคอนเทนเนอร์คอมโพเนนต์ v2 ของ Discord สำหรับข้อความของเอเจนต์ ใช้เครื่องมือข้อความพร้อมเพย์โหลด `components` ผลลัพธ์ของการโต้ตอบจะถูกกำหนดเส้นทางกลับไปยังเอเจนต์เป็นข้อความขาเข้าปกติ และทำตามการตั้งค่า Discord `replyToMode` ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถวการดำเนินการอนุญาตได้สูงสุด 5 ปุ่ม หรือเมนูเลือกเดียวหนึ่งรายการ
- ประเภทการเลือก: `string`, `user`, `role`, `mentionable`, `channel`

โดยค่าเริ่มต้น คอมโพเนนต์ใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่ออนุญาตให้ใช้ปุ่ม เมนูเลือก และฟอร์มได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดว่าใครสามารถคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (ID ผู้ใช้ Discord, แท็ก หรือ `*`) เมื่อกำหนดค่าแล้ว ผู้ใช้ที่ไม่ตรงกันจะได้รับการปฏิเสธแบบชั่วคราว

คำสั่ง slash `/model` และ `/models` จะเปิดตัวเลือกโมเดลเชิงโต้ตอบพร้อมดรอปดาวน์ผู้ให้บริการ โมเดล และรันไทม์ที่เข้ากันได้ รวมถึงขั้นตอน Submit `/models add` เลิกใช้แล้ว และตอนนี้จะส่งคืนข้อความแจ้งการเลิกใช้แทนการลงทะเบียนโมเดลจากแชต การตอบกลับของตัวเลือกเป็นแบบชั่วคราว และมีเพียงผู้ใช้ที่เรียกใช้เท่านั้นที่สามารถใช้งานได้ เมนูเลือกของ Discord จำกัดไว้ที่ 25 ตัวเลือก ดังนั้นให้เพิ่มรายการ `provider/*` ไปยัง `agents.defaults.models` เมื่อคุณต้องการให้ตัวเลือกแสดงโมเดลที่ค้นพบแบบไดนามิกเฉพาะสำหรับผู้ให้บริการที่เลือก เช่น `openai-codex` หรือ `vllm`

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM `channels.discord.allowFrom` คือรายการอนุญาต DM แบบมาตรฐาน

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.discord.allowFrom` มี `"*"`)
    - `disabled`

    หากนโยบาย DM ไม่ได้เป็นแบบเปิด ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือถูกแจ้งให้จับคู่ในโหมด `pairing`)

    ลำดับความสำคัญของหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - สำหรับหนึ่งบัญชี `allowFrom` มีลำดับความสำคัญเหนือ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตนเองและ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    `channels.discord.dm.policy` และ `channels.discord.dm.allowFrom` แบบเดิมยังคงถูกอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อสามารถทำได้โดยไม่เปลี่ยนการเข้าถึง

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การกล่าวถึง `<@id>`

    โดยปกติ ID ตัวเลขล้วนจะแปลงเป็น ID ช่องเมื่อค่าเริ่มต้นของช่องทำงานอยู่ แต่ ID ที่อยู่ใน `allowFrom` ของ DM ที่มีผลของบัญชีจะถูกปฏิบัติเป็นเป้าหมาย DM ของผู้ใช้เพื่อความเข้ากันได้

  </Tab>

  <Tab title="Access groups">
    DM ของ Discord และการอนุญาตคำสั่งข้อความสามารถใช้รายการ `accessGroup:<name>` แบบไดนามิกใน `channels.discord.allowFrom`

    ชื่อกลุ่มการเข้าถึงใช้ร่วมกันข้ามช่องข้อความ ใช้ `type: "message.senders"` สำหรับกลุ่มแบบคงที่ที่สมาชิกแสดงด้วยไวยากรณ์ `allowFrom` ปกติของแต่ละช่อง หรือ `type: "discord.channelAudience"` เมื่อผู้ชม `ViewChannel` ปัจจุบันของช่อง Discord ควรกำหนดสมาชิกแบบไดนามิก ลักษณะการทำงานของกลุ่มการเข้าถึงที่ใช้ร่วมกันมีเอกสารไว้ที่นี่: [กลุ่มการเข้าถึง](/th/channels/access-groups)

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

    ช่องข้อความ Discord ไม่มีรายชื่อสมาชิกแยกต่างหาก `type: "discord.channelAudience"` จำลองสมาชิกเป็น: ผู้ส่ง DM เป็นสมาชิกของ guild ที่กำหนดค่าไว้ และขณะนี้มีสิทธิ์ `ViewChannel` ที่มีผลบนช่องที่กำหนดค่าไว้หลังจากใช้การเขียนทับของบทบาทและช่องแล้ว

    ตัวอย่าง: อนุญาตให้ทุกคนที่เห็น `#maintainers` สามารถ DM หาบอทได้ ขณะเดียวกันยังคงปิด DM สำหรับคนอื่นทั้งหมด

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

    การค้นหาจะล้มเหลวแบบปิด หาก Discord ส่งคืน `Missing Access` การค้นหาสมาชิกล้มเหลว หรือช่องเป็นของ guild อื่น ผู้ส่ง DM จะถูกถือว่าไม่ได้รับอนุญาต

    เปิดใช้ **Server Members Intent** ใน Discord Developer Portal สำหรับบอทเมื่อใช้กลุ่มการเข้าถึงตามผู้ชมของช่อง DM ไม่มีสถานะสมาชิก guild ดังนั้น OpenClaw จะแก้ไขสมาชิกผ่าน Discord REST ในเวลาที่อนุญาต

  </Tab>

  <Tab title="Guild policy">
    การจัดการ guild ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    พื้นฐานที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    ลักษณะการทำงานของ `allowlist`:

    - guild ต้องตรงกับ `channels.discord.guilds` (แนะนำให้ใช้ `id`, ยอมรับ slug)
    - รายการอนุญาตผู้ส่งที่เป็นทางเลือก: `users` (แนะนำ ID ที่เสถียร) และ `roles` (เฉพาะ ID บทบาท); หากกำหนดค่าอย่างใดอย่างหนึ่ง ผู้ส่งจะได้รับอนุญาตเมื่อพวกเขาตรงกับ `users` หรือ `roles`
    - การจับคู่ชื่อ/แท็กโดยตรงถูกปิดใช้งานโดยค่าเริ่มต้น เปิดใช้ `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะในโหมดความเข้ากันได้ฉุกเฉินเท่านั้น
    - รองรับชื่อ/แท็กสำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อมีการใช้รายการชื่อ/แท็ก
    - หาก guild มีการกำหนดค่า `channels` ช่องที่ไม่อยู่ในรายการจะถูกปฏิเสธ
    - หาก guild ไม่มีบล็อก `channels` ทุกช่องใน guild ที่อยู่ในรายการอนุญาตนั้นจะได้รับอนุญาต

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

    หากคุณตั้งค่าเฉพาะ `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` ค่าทดแทนขณะรันไทม์คือ `groupPolicy="allowlist"` (พร้อมคำเตือนในบันทึก) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`

  </Tab>

  <Tab title="Mentions and group DMs">
    ข้อความใน guild ถูกควบคุมด้วยการกล่าวถึงโดยค่าเริ่มต้น

    การตรวจจับการกล่าวถึงประกอบด้วย:

    - การกล่าวถึงบอทอย่างชัดเจน
    - รูปแบบการกล่าวถึงที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, ค่าทดแทน `messages.groupChat.mentionPatterns`)
    - ลักษณะการทำงานตอบกลับถึงบอทโดยนัยในกรณีที่รองรับ

    เมื่อเขียนข้อความ Discord ขาออก ให้ใช้ไวยากรณ์การกล่าวถึงแบบมาตรฐาน: `<@USER_ID>` สำหรับผู้ใช้, `<#CHANNEL_ID>` สำหรับช่อง และ `<@&ROLE_ID>` สำหรับบทบาท อย่าใช้รูปแบบการกล่าวถึงชื่อเล่นแบบเดิม `<@!USER_ID>`

    `requireMention` ถูกกำหนดค่าต่อ guild/channel (`channels.discord.guilds...`)
    `ignoreOtherMentions` เลือกได้ว่าจะทิ้งข้อความที่กล่าวถึงผู้ใช้/บทบาทอื่นแต่ไม่ได้กล่าวถึงบอทหรือไม่ (ยกเว้น @everyone/@here)

    Group DM:

    - ค่าเริ่มต้น: ละเว้น (`dm.groupEnabled=false`)
    - รายการอนุญาตที่เป็นทางเลือกผ่าน `dm.groupChannels` (ID ช่องหรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตามบทบาท

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิก guild ของ Discord ไปยังเอเจนต์ที่แตกต่างกันตาม ID บทบาท การผูกตามบทบาทยอมรับเฉพาะ ID บทบาทเท่านั้น และจะถูกประเมินหลังการผูกแบบ peer หรือ parent-peer และก่อนการผูกเฉพาะ guild หากการผูกตั้งค่าฟิลด์การจับคู่อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ฟิลด์ทั้งหมดที่กำหนดค่าต้องตรงกัน

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

## คำสั่งเนทีฟและการตรวจสอบสิทธิ์คำสั่ง

- `commands.native` มีค่าเริ่มต้นเป็น `"auto"` และเปิดใช้งานสำหรับ Discord.
- การแทนที่รายช่อง: `channels.discord.commands.native`.
- `commands.native=false` จะข้ามการลงทะเบียนและการล้างข้อมูลคำสั่ง slash ของ Discord ระหว่างเริ่มต้นระบบ คำสั่งที่ลงทะเบียนไว้ก่อนหน้านี้อาจยังมองเห็นได้ใน Discord จนกว่าคุณจะลบออกจากแอป Discord.
- การตรวจสอบสิทธิ์คำสั่งแบบเนทีฟใช้ allowlist/นโยบายของ Discord เดียวกับการจัดการข้อความปกติ.
- คำสั่งอาจยังมองเห็นได้ใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต; การเรียกใช้งานยังคงบังคับใช้การตรวจสอบสิทธิ์ของ OpenClaw และส่งคืน "not authorized".

ดู [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งและพฤติกรรม.

การตั้งค่าคำสั่ง slash เริ่มต้น:

- `ephemeral: true`

## รายละเอียดฟีเจอร์

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord รองรับแท็กตอบกลับในเอาต์พุตของเอเจนต์:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    ควบคุมโดย `channels.discord.replyToMode`:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`
    - `batched`

    หมายเหตุ: `off` ปิดการจัดเธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงมีผล.
    `first` แนบการอ้างอิงการตอบกลับเนทีฟโดยนัยกับข้อความ Discord ขาออกแรกของเทิร์นนั้นเสมอ.
    `batched` แนบการอ้างอิงการตอบกลับเนทีฟโดยนัยของ Discord เฉพาะเมื่อ
    เทิร์นขาเข้าเป็นชุดข้อความหลายข้อความที่ถูกหน่วงรวมไว้ สิ่งนี้มีประโยชน์
    เมื่อคุณต้องการให้การตอบกลับเนทีฟใช้เป็นหลักสำหรับแชตแบบต่อเนื่องที่คลุมเครือ ไม่ใช่ทุก
    เทิร์นที่มีข้อความเดียว.

    ID ข้อความจะแสดงในบริบท/ประวัติ เพื่อให้เอเจนต์สามารถระบุข้อความเป้าหมายได้.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw สามารถสตรีมร่างคำตอบได้โดยส่งข้อความชั่วคราวและแก้ไขข้อความนั้นเมื่อมีข้อความเข้ามา `channels.discord.streaming` รับค่า `off` | `partial` | `block` | `progress` (ค่าเริ่มต้น). `progress` เก็บร่างสถานะที่แก้ไขได้หนึ่งรายการและอัปเดตด้วยความคืบหน้าของเครื่องมือจนกว่าจะส่งผลลัพธ์สุดท้าย; ป้ายเริ่มต้นที่ใช้ร่วมกันเป็นบรรทัดแบบเลื่อนต่อเนื่อง จึงเลื่อนหายไปเหมือนส่วนอื่นเมื่อมีงานปรากฏมากพอ. `streamMode` เป็นนามแฝงรันไทม์เดิม เรียกใช้ `openclaw doctor --fix` เพื่อเขียนค่าคอนฟิกที่คงอยู่ให้เป็นคีย์มาตรฐาน.

    ตั้งค่า `channels.discord.streaming.mode` เป็น `off` เพื่อปิดการแก้ไขพรีวิวของ Discord. หากเปิดใช้งานการสตรีมแบบบล็อกของ Discord อย่างชัดเจน OpenClaw จะข้ามสตรีมพรีวิวเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน.

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

    - `partial` แก้ไขข้อความพรีวิวเดียวเมื่อโทเค็นเข้ามา.
    - `block` ส่งชิ้นส่วนขนาดเท่าร่าง (ใช้ `draftChunk` เพื่อปรับขนาดและจุดแบ่ง โดยถูกจำกัดที่ `textChunkLimit`).
    - สื่อ ข้อผิดพลาด และผลลัพธ์สุดท้ายแบบตอบกลับชัดเจนจะยกเลิกการแก้ไขพรีวิวที่รอดำเนินการ.
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความพรีวิวซ้ำหรือไม่.
    - แถวเครื่องมือ/ความคืบหน้าแสดงเป็นอีโมจิ + ชื่อ + รายละเอียดแบบกะทัดรัดเมื่อมีข้อมูล เช่น `🛠️ Bash: run tests` หรือ `🔎 Web Search: for "query"`.
    - `streaming.preview.commandText` / `streaming.progress.commandText` ควบคุมรายละเอียดคำสั่ง/exec ในบรรทัดความคืบหน้าแบบกะทัดรัด: `raw` (ค่าเริ่มต้น) หรือ `status` (เฉพาะป้ายเครื่องมือ).

    ซ่อนข้อความคำสั่ง/exec ดิบ ขณะยังคงแสดงบรรทัดความคืบหน้าแบบกะทัดรัด:

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

    การสตรีมพรีวิวรองรับเฉพาะข้อความ; การตอบกลับที่มีสื่อจะย้อนกลับไปใช้การส่งปกติ เมื่อเปิดใช้งานการสตรีม `block` อย่างชัดเจน OpenClaw จะข้ามสตรีมพรีวิวเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    บริบทประวัติของกิลด์:

    - ค่าเริ่มต้นของ `channels.discord.historyLimit` คือ `20`
    - ค่าสำรอง: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    การควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมของเธรด:

    - เธรด Discord ถูกจัดเส้นทางเป็นเซสชันช่องและสืบทอดค่าคอนฟิกจากช่องแม่ เว้นแต่จะถูกแทนที่.
    - เซสชันเธรดสืบทอดการเลือก `/model` ระดับเซสชันของช่องแม่เป็นค่ fallback เฉพาะโมเดล; การเลือก `/model` เฉพาะเธรดยังคงมีลำดับความสำคัญสูงกว่า และประวัติทรานสคริปต์ของแม่จะไม่ถูกคัดลอก เว้นแต่จะเปิดใช้การสืบทอดทรานสคริปต์.
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) เลือกให้เธรดอัตโนมัติใหม่เริ่มต้นจากทรานสคริปต์แม่ การแทนที่รายบัญชีอยู่ภายใต้ `channels.discord.accounts.<id>.thread.inheritParent`.
    - รีแอ็กชันของเครื่องมือข้อความสามารถแก้เป้าหมาย DM แบบ `user:<id>` ได้.
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะถูกรักษาไว้ระหว่าง fallback การเปิดใช้งานในขั้นตอบกลับ.

    หัวข้อช่องจะถูกแทรกเป็นบริบทที่ **ไม่น่าเชื่อถือ**. Allowlists ควบคุมว่าใครสามารถเรียกเอเจนต์ได้ ไม่ใช่ขอบเขตการลบข้อมูลบริบทเสริมทั้งหมด.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord สามารถผูกเธรดกับเป้าหมายเซสชัน เพื่อให้ข้อความติดตามผลในเธรดนั้นยังคงถูกจัดเส้นทางไปยังเซสชันเดิม (รวมถึงเซสชัน subagent).

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/ใหม่กับเป้าหมาย subagent/เซสชัน
    - `/unfocus` ลบการผูกของเธรดปัจจุบัน
    - `/agents` แสดงรันที่กำลังใช้งานและสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดต auto-unfocus จากการไม่มีความเคลื่อนไหวสำหรับการผูกที่โฟกัสอยู่
    - `/session max-age <duration|off>` ตรวจสอบ/อัปเดตอายุสูงสุดแบบบังคับสำหรับการผูกที่โฟกัสอยู่

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

    - `session.threadBindings.*` ตั้งค่าเริ่มต้นส่วนกลาง.
    - `channels.discord.threadBindings.*` แทนที่พฤติกรรม Discord.
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดอัตโนมัติสำหรับ `sessions_spawn({ thread: true })` และการสร้างเธรดของ ACP ค่าเริ่มต้น: `true`.
    - `defaultSpawnContext` ควบคุมบริบท subagent เนทีฟสำหรับการสร้างที่ผูกกับเธรด ค่าเริ่มต้น: `"fork"`.
    - คีย์ `spawnSubagentSessions`/`spawnAcpSessions` ที่เลิกใช้แล้วจะถูกย้ายโดย `openclaw doctor --fix`.
    - หากปิดใช้งานการผูกเธรดสำหรับบัญชีหนึ่ง `/focus` และการดำเนินการผูกเธรดที่เกี่ยวข้องจะไม่พร้อมใช้งาน.

    ดู [Sub-agents](/th/tools/subagents), [เอเจนต์ ACP](/th/tools/acp-agents), และ [อ้างอิงการกำหนดค่า](/th/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    สำหรับเวิร์กสเปซ ACP แบบ "always-on" ที่เสถียร ให้กำหนดค่าการผูก ACP แบบมีชนิดที่ระดับบนสุด ซึ่งชี้ไปยังการสนทนา Discord.

    พาธคอนฟิก:

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

    - `/acp spawn codex --bind here` ผูกช่องหรือเธรดปัจจุบันไว้ในตำแหน่งเดิม และทำให้ข้อความในอนาคตอยู่ในเซสชัน ACP เดิม เธรดข้อความสืบทอดการผูกของช่องแม่.
    - ในช่องหรือเธรดที่ผูกไว้ `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP เดิมในตำแหน่งเดิม การผูกเธรดชั่วคราวสามารถแทนที่การแก้เป้าหมายได้ขณะใช้งาน.
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดลูกผ่าน `--thread auto|here`.

    ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมการผูก.

  </Accordion>

  <Accordion title="Reaction notifications">
    โหมดการแจ้งเตือนรีแอ็กชันรายกิลด์:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    อีเวนต์รีแอ็กชันจะถูกแปลงเป็นอีเวนต์ระบบและแนบกับเซสชัน Discord ที่ถูกจัดเส้นทาง.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า.

    ลำดับการแก้ค่า:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback อีโมจิของตัวตนเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้น "👀")

    หมายเหตุ:

    - Discord ยอมรับอีโมจิ Unicode หรือชื่ออีโมจิกำหนดเอง.
    - ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับช่องหรือบัญชี.

  </Accordion>

  <Accordion title="Config writes">
    การเขียนคอนฟิกที่เริ่มจากช่องถูกเปิดใช้งานเป็นค่าเริ่มต้น.

    สิ่งนี้ส่งผลต่อโฟลว์ `/config set|unset` (เมื่อเปิดใช้งานฟีเจอร์คำสั่ง).

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
    จัดเส้นทางทราฟฟิก WebSocket ของ Gateway Discord และการค้นหา REST ตอนเริ่มต้น (ID แอปพลิเคชัน + การแก้ allowlist) ผ่านพร็อกซี HTTP(S) ด้วย `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    การแทนที่รายบัญชี:

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
    เปิดใช้งานการแก้ค่า PluralKit เพื่อแมปข้อความที่พร็อกซีไปยังตัวตนของสมาชิกระบบ:

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

    - allowlists สามารถใช้ `pk:<memberId>` ได้
    - ชื่อที่แสดงของสมาชิกจะถูกจับคู่ตามชื่อ/slug เท่านั้นเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การค้นหาใช้ ID ข้อความต้นฉบับและถูกจำกัดด้วยกรอบเวลา
    - หากการค้นหาล้มเหลว ข้อความที่พร็อกซีจะถูกถือว่าเป็นข้อความบอตและถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    ใช้ `mentionAliases` เมื่อเอเจนต์ต้องการการ mention ขาออกแบบกำหนดผลได้สำหรับผู้ใช้ Discord ที่รู้จัก คีย์คือ handle ที่ไม่มี `@` นำหน้า; ค่าคือ ID ผู้ใช้ Discord. handle ที่ไม่รู้จัก, `@everyone`, `@here`, และ mention ภายใน code span ของ Markdown จะคงเดิม.

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
    การอัปเดตสถานะ presence จะถูกนำไปใช้เมื่อคุณตั้งค่าฟิลด์สถานะหรือกิจกรรม หรือเมื่อคุณเปิดใช้ presence อัตโนมัติ.

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

    แผนผังชนิดกิจกรรม:

    - 0: กำลังเล่น
    - 1: กำลังสตรีม (ต้องมี `activityUrl`)
    - 2: กำลังฟัง
    - 3: กำลังดู
    - 4: กำหนดเอง (ใช้ข้อความกิจกรรมเป็นสถานะ; อีโมจิเป็นค่าที่เลือกได้)
    - 5: กำลังแข่งขัน

    ตัวอย่างการแสดงสถานะอัตโนมัติ (สัญญาณสถานะรันไทม์):

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

    การแสดงสถานะอัตโนมัติจะแมปความพร้อมใช้งานของรันไทม์กับสถานะ Discord: healthy => online, degraded หรือ unknown => idle, exhausted หรือ unavailable => dnd ข้อความเสริมที่เขียนทับได้:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับ placeholder `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord รองรับการจัดการการอนุมัติด้วยปุ่มใน DM และสามารถโพสต์พร้อมท์การอนุมัติในช่องทางต้นทางได้เป็นตัวเลือก

    พาธการกำหนดค่า:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; ถอยกลับไปใช้ `commands.ownerAllowFrom` เมื่อทำได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord จะเปิดใช้การอนุมัติการ exec แบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และสามารถแก้ไขผู้อนุมัติได้อย่างน้อยหนึ่งคน ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมานผู้อนุมัติการ exec จาก `allowFrom` ของช่องทาง, `dm.allowFrom` แบบเดิม หรือ `defaultTo` ของข้อความโดยตรง ตั้งค่า `enabled: false` เพื่อปิดใช้ Discord เป็นไคลเอนต์การอนุมัติแบบเนทีฟอย่างชัดเจน

    สำหรับคำสั่งกลุ่มที่ละเอียดอ่อนและจำกัดเฉพาะเจ้าของ เช่น `/diagnostics` และ `/export-trajectory` OpenClaw จะส่งพร้อมท์การอนุมัติและผลลัพธ์สุดท้ายแบบส่วนตัว โดยจะลองใช้ Discord DM ก่อนเมื่อเจ้าของที่เรียกใช้มีเส้นทางเจ้าของของ Discord; หากไม่มี จะถอยกลับไปใช้เส้นทางเจ้าของแรกที่พร้อมใช้งานจาก `commands.ownerAllowFrom` เช่น Telegram

    เมื่อ `target` เป็น `channel` หรือ `both` พร้อมท์การอนุมัติจะมองเห็นได้ในช่องทาง เฉพาะผู้อนุมัติที่แก้ไขได้เท่านั้นที่ใช้ปุ่มได้; ผู้ใช้อื่นจะได้รับการปฏิเสธแบบ ephemeral พร้อมท์การอนุมัติมีข้อความคำสั่งรวมอยู่ด้วย ดังนั้นให้เปิดใช้การส่งไปยังช่องทางเฉพาะในช่องทางที่เชื่อถือได้เท่านั้น หากไม่สามารถอนุมาน ID ช่องทางจากคีย์เซสชันได้ OpenClaw จะถอยกลับไปส่งผ่าน DM

    Discord ยังเรนเดอร์ปุ่มการอนุมัติร่วมที่ช่องทางแชตอื่นใช้ด้วย อะแดปเตอร์ Discord แบบเนทีฟส่วนใหญ่เพิ่มการกำหนดเส้นทาง DM ของผู้อนุมัติและการกระจายไปยังช่องทาง
    เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก; OpenClaw
    ควรรวมคำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของเครื่องมือบอกว่า
    การอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียวเท่านั้น
    หากรันไทม์การอนุมัติแบบเนทีฟของ Discord ไม่ได้ทำงานอยู่ OpenClaw จะคง
    พร้อมท์ `/approve <id> <decision>` แบบกำหนดแน่นอนในเครื่องให้มองเห็นได้ หาก
    รันไทม์ทำงานอยู่แต่ไม่สามารถส่งการ์ดแบบเนทีฟไปยังเป้าหมายใดได้
    OpenClaw จะส่งประกาศสำรองในแชตเดียวกันพร้อมคำสั่ง `/approve`
    ที่ตรงจากการอนุมัติที่รอดำเนินการ

    การยืนยันตัวตน Gateway และการแก้ไขการอนุมัติเป็นไปตามสัญญาไคลเอนต์ Gateway ร่วม (`plugin:` ID จะถูกแก้ไขผ่าน `plugin.approval.resolve`; ID อื่นผ่าน `exec.approval.resolve`) การอนุมัติหมดอายุหลัง 30 นาทีโดยค่าเริ่มต้น

    ดู [การอนุมัติการ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและเกตการดำเนินการ

การดำเนินการข้อความ Discord ประกอบด้วยการส่งข้อความ การดูแลช่องทาง การกลั่นกรอง การแสดงสถานะ และการดำเนินการเมตาดาต้า

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- รีแอ็กชัน: `react`, `reactions`, `emojiList`
- การกลั่นกรอง: `timeout`, `kick`, `ban`
- การแสดงสถานะ: `setPresence`

การดำเนินการ `event-create` รับพารามิเตอร์ `image` แบบไม่บังคับ (URL หรือพาธไฟล์ในเครื่อง) เพื่อตั้งค่าภาพหน้าปกของกิจกรรมที่กำหนดเวลาไว้

เกตการดำเนินการอยู่ภายใต้ `channels.discord.actions.*`

พฤติกรรมเกตเริ่มต้น:

| กลุ่มการดำเนินการ                                                                                                                                                             | ค่าเริ่มต้น  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้งาน  |
| roles                                                                                                                                                                    | ปิดใช้งาน |
| moderation                                                                                                                                                               | ปิดใช้งาน |
| presence                                                                                                                                                                 | ปิดใช้งาน |

## UI Components v2

OpenClaw ใช้ Discord components v2 สำหรับการอนุมัติการ exec และมาร์กเกอร์ข้ามบริบท การดำเนินการข้อความ Discord ยังสามารถรับ `components` สำหรับ UI แบบกำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้างเพย์โหลดคอมโพเนนต์ผ่านเครื่องมือ discord) ขณะที่ `embeds` แบบเดิมยังใช้งานได้แต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นที่คอนเทนเนอร์คอมโพเนนต์ Discord ใช้ (hex)
- ตั้งค่าต่อบัญชีด้วย `channels.discord.accounts.<id>.ui.components.accentColor`
- `embeds` จะถูกละเว้นเมื่อมี components v2

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

Discord มีพื้นผิวเสียงสองแบบที่แตกต่างกัน: **ช่องเสียง** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบพรีวิวคลื่นเสียง) Gateway รองรับทั้งสองแบบ

### ช่องเสียง

เช็กลิสต์การตั้งค่า:

1. เปิดใช้ Message Content Intent ใน Discord Developer Portal
2. เปิดใช้ Server Members Intent เมื่อใช้รายการอนุญาตตามบทบาท/ผู้ใช้
3. เชิญบอตด้วย scope `bot` และ `applications.commands`
4. ให้สิทธิ์ Connect, Speak, Send Messages และ Read Message History ในช่องเสียงเป้าหมาย
5. เปิดใช้คำสั่งแบบเนทีฟ (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งนี้ใช้เอเจนต์เริ่มต้นของบัญชีและทำตามกฎรายการอนุญาตและนโยบายกลุ่มเดียวกับคำสั่ง Discord อื่น

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

หากต้องการตรวจสอบสิทธิ์ที่มีผลจริงของบอตก่อนเข้าร่วม ให้รัน:

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
- `voice.mode` ควบคุมเส้นทางการสนทนา ค่าเริ่มต้นคือ `agent-proxy`: ส่วนหน้าเสียงแบบเรียลไทม์จัดการจังหวะรอบสนทนา การขัดจังหวะ และการเล่นเสียง มอบหมายงานสาระสำคัญให้เอเจนต์ OpenClaw ที่ถูกจัดเส้นทางผ่าน `openclaw_agent_consult` และปฏิบัติต่อผลลัพธ์เหมือนพรอมป์ Discord แบบพิมพ์จากผู้พูดคนนั้น `stt-tts` ยังคงใช้โฟลว์ STT แบบแบตช์เดิมร่วมกับ TTS `bidi` ให้โมเดลเรียลไทม์สนทนาโดยตรง พร้อมเปิดเผย `openclaw_agent_consult` สำหรับสมองของ OpenClaw
- `voice.agentSession` ควบคุมว่าการสนทนา OpenClaw ใดได้รับรอบเสียง ปล่อยว่างไว้เพื่อใช้เซสชันของช่องเสียงเอง หรือตั้งค่า `{ mode: "target", target: "channel:<text-channel-id>" }` เพื่อให้ช่องเสียงทำหน้าที่เป็นส่วนขยายไมโครโฟน/ลำโพงของเซสชันช่องข้อความ Discord ที่มีอยู่ เช่น `#maintainers`
- `voice.model` แทนที่สมองเอเจนต์ OpenClaw สำหรับการตอบสนองเสียง Discord และการปรึกษาแบบเรียลไทม์ ปล่อยว่างไว้เพื่อสืบทอดโมเดลเอเจนต์ที่ถูกจัดเส้นทาง ค่านี้แยกจาก `voice.realtime.model`
- `agent-proxy` จัดเส้นทางเสียงพูดผ่าน `discord-voice` ซึ่งรักษาการอนุญาตเจ้าของ/เครื่องมือตามปกติสำหรับผู้พูดและเซสชันเป้าหมาย แต่ซ่อนเครื่องมือ `tts` ของเอเจนต์เพราะเสียง Discord เป็นเจ้าของการเล่นเสียง ตามค่าเริ่มต้น `agent-proxy` ให้การปรึกษามีสิทธิ์เข้าถึงเครื่องมือเทียบเท่าเจ้าของเต็มรูปแบบสำหรับผู้พูดที่เป็นเจ้าของ (`voice.realtime.toolPolicy: "owner"`) และต้องการปรึกษาเอเจนต์ OpenClaw ก่อนคำตอบที่มีสาระอย่างมาก (`voice.realtime.consultPolicy: "always"`) ในโหมด `always` เริ่มต้นนั้น ชั้นเรียลไทม์จะไม่พูดเติมโดยอัตโนมัติก่อนคำตอบจากการปรึกษา แต่จะจับและถอดเสียงคำพูด จากนั้นพูดคำตอบ OpenClaw ที่ถูกจัดเส้นทาง หากคำตอบจากการปรึกษาแบบบังคับหลายรายการเสร็จขณะที่ Discord ยังเล่นคำตอบแรกอยู่ คำตอบแบบคำพูดตรงตัวรายการหลังจะถูกจัดคิวจนกว่าการเล่นเสียงจะว่าง แทนที่จะแทนที่เสียงพูดกลางประโยค
- ในโหมด `stt-tts` STT ใช้ `tools.media.audio`; `voice.model` ไม่มีผลต่อการถอดเสียง
- ในโหมดเรียลไทม์ `voice.realtime.provider`, `voice.realtime.model` และ `voice.realtime.voice` กำหนดค่าเซสชันเสียงเรียลไทม์ สำหรับ OpenAI Realtime 2 ร่วมกับสมอง Codex ให้ใช้ `voice.realtime.model: "gpt-realtime-2"` และ `voice.model: "openai-codex/gpt-5.5"`
- ผู้ให้บริการเรียลไทม์ OpenAI รองรับชื่ออีเวนต์ Realtime 2 ปัจจุบันและนามแฝงรุ่นเดิมที่เข้ากันได้กับ Codex สำหรับอีเวนต์เสียงเอาต์พุตและทรานสคริปต์ ดังนั้นสแนปช็อตผู้ให้บริการที่เข้ากันได้สามารถเปลี่ยนไปได้โดยไม่ทำให้เสียงผู้ช่วยหลุดหาย
- `voice.realtime.bargeIn` ควบคุมว่าอีเวนต์เริ่มพูดของผู้พูด Discord จะขัดจังหวะการเล่นเสียงเรียลไทม์ที่กำลังทำงานอยู่หรือไม่ หากไม่ได้ตั้งค่า จะใช้ตามการตั้งค่าการขัดจังหวะเสียงอินพุตของผู้ให้บริการเรียลไทม์
- `voice.realtime.minBargeInAudioEndMs` ควบคุมระยะเวลาการเล่นเสียงผู้ช่วยขั้นต่ำก่อนที่การแทรกพูดของ OpenAI แบบเรียลไทม์จะตัดเสียง ค่าเริ่มต้น: `250` ตั้งค่า `0` เพื่อขัดจังหวะทันทีในห้องที่เสียงสะท้อนต่ำ หรือเพิ่มค่าสำหรับชุดลำโพงที่มีเสียงสะท้อนมาก
- สำหรับเสียง OpenAI บนการเล่นเสียง Discord ให้ตั้งค่า `voice.tts.provider: "openai"` และเลือกเสียง Text-to-speech ใต้ `voice.tts.openai.voice` หรือ `voice.tts.providers.openai.voice` `cedar` เป็นตัวเลือกเสียงที่ฟังดูเป็นผู้ชายที่ดีบนโมเดล TTS ปัจจุบันของ OpenAI
- การแทนที่ `systemPrompt` ของ Discord รายช่องมีผลกับรอบทรานสคริปต์เสียงสำหรับช่องเสียงนั้น
- รอบทรานสคริปต์เสียงอนุมานสถานะเจ้าของจาก `allowFrom` ของ Discord (หรือ `dm.allowFrom`); ผู้พูดที่ไม่ใช่เจ้าของไม่สามารถเข้าถึงเครื่องมือเฉพาะเจ้าของได้ (เช่น `gateway` และ `cron`)
- เสียง Discord เป็นแบบเลือกเปิดใช้สำหรับคอนฟิกที่มีเฉพาะข้อความ ตั้งค่า `channels.discord.voice.enabled=true` (หรือคงบล็อก `channels.discord.voice` ที่มีอยู่) เพื่อเปิดใช้คำสั่ง `/vc` รันไทม์เสียง และ Gateway intent `GuildVoiceStates`
- `channels.discord.intents.voiceStates` สามารถแทนที่การสมัครใช้งาน voice-state intent ได้อย่างชัดเจน ปล่อยว่างไว้เพื่อให้ intent ทำตามการเปิดใช้เสียงที่มีผลจริง
- หาก `voice.autoJoin` มีหลายรายการสำหรับกิลด์เดียวกัน OpenClaw จะเข้าร่วมช่องที่กำหนดค่าไว้ล่าสุดสำหรับกิลด์นั้น
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` ส่งต่อไปยังตัวเลือกการเข้าร่วมของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- OpenClaw ใช้ตัวถอดรหัส `opusscript` แบบ JS ล้วนเป็นค่าเริ่มต้นสำหรับการรับเสียง Discord แพ็กเกจเนทีฟ `@discordjs/opus` ที่เป็นตัวเลือกจะถูกละเว้นโดยนโยบายติดตั้ง pnpm ของรีโพ เพื่อให้การติดตั้งปกติ เลน Docker และการทดสอบที่ไม่เกี่ยวข้องไม่คอมไพล์ native addon โฮสต์เฉพาะด้านประสิทธิภาพเสียงสามารถเลือกเปิดใช้ด้วย `OPENCLAW_DISCORD_OPUS_DECODER=native` หลังจากติดตั้ง native addon แล้ว
- `voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับความพยายาม `/vc join` และ auto-join ค่าเริ่มต้น: `30000`
- `voice.reconnectGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอให้เซสชันเสียงที่ถูกตัดการเชื่อมต่อเริ่มเชื่อมต่อใหม่ก่อนทำลายเซสชันนั้น ค่าเริ่มต้น: `15000`
- ในโหมด `stt-tts` การเล่นเสียงจะไม่หยุดเพียงเพราะผู้ใช้อีกคนเริ่มพูด เพื่อหลีกเลี่ยงวงจรฟีดแบ็ก OpenClaw จะละเว้นการจับเสียงใหม่ขณะ TTS กำลังเล่นอยู่ ให้พูดหลังจากการเล่นเสียงเสร็จเพื่อเข้ารอบถัดไป โหมดเรียลไทม์จะส่งต่อการเริ่มพูดของผู้พูดเป็นสัญญาณแทรกพูดไปยังผู้ให้บริการเรียลไทม์
- ในโหมดเรียลไทม์ เสียงสะท้อนจากลำโพงเข้าสู่ไมค์ที่เปิดอยู่อาจดูเหมือนการแทรกพูดและขัดจังหวะการเล่นเสียง สำหรับห้อง Discord ที่มีเสียงสะท้อนมาก ให้ตั้งค่า `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` เพื่อไม่ให้ OpenAI ขัดจังหวะอัตโนมัติเมื่อมีเสียงอินพุต เพิ่ม `voice.realtime.bargeIn: true` หากยังต้องการให้อีเวนต์เริ่มพูดของผู้พูด Discord ขัดจังหวะการเล่นเสียงที่กำลังทำงานอยู่ บริดจ์เรียลไทม์ OpenAI จะละเว้นการตัดทอนการเล่นเสียงที่สั้นกว่า `voice.realtime.minBargeInAudioEndMs` โดยถือว่าน่าจะเป็นเสียงสะท้อน/สัญญาณรบกวน และบันทึกเป็นรายการที่ข้ามแทนที่จะล้างการเล่นเสียง Discord
- `voice.captureSilenceGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอหลังจาก Discord รายงานว่าผู้พูดหยุดพูดแล้ว ก่อนสรุปเซกเมนต์เสียงนั้นสำหรับ STT ค่าเริ่มต้น: `2500`; เพิ่มค่านี้หาก Discord แยกช่วงหยุดตามปกติเป็นทรานสคริปต์ย่อยที่ขาดตอน
- เมื่อ ElevenLabs เป็นผู้ให้บริการ TTS ที่เลือก การเล่นเสียง Discord จะใช้ TTS แบบสตรีมและเริ่มจากสตรีมการตอบสนองของผู้ให้บริการ ผู้ให้บริการที่ไม่รองรับการสตรีมจะย้อนกลับไปใช้เส้นทางไฟล์ชั่วคราวที่สังเคราะห์แล้ว
- OpenClaw ยังเฝ้าดูความล้มเหลวในการถอดรหัสขารับและกู้คืนอัตโนมัติโดยออกจากช่องเสียงแล้วเข้าร่วมใหม่หลังเกิดความล้มเหลวซ้ำในช่วงเวลาสั้น
- หากบันทึกขารับแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำหลังอัปเดต ให้รวบรวมรายงาน dependency และบันทึก บรรทัด `@discordjs/voice` ที่บันเดิลมาพร้อมมีการแก้ไข padding จาก upstream ใน discord.js PR #11449 ซึ่งปิด discord.js issue #11419
- อีเวนต์ขารับ `The operation was aborted` เป็นสิ่งที่คาดไว้เมื่อ OpenClaw สรุปเซกเมนต์ผู้พูดที่จับไว้ อีเวนต์เหล่านี้เป็น diagnostics แบบละเอียด ไม่ใช่คำเตือน
- บันทึกเสียง Discord แบบละเอียดมีตัวอย่างทรานสคริปต์ STT หนึ่งบรรทัดที่จำกัดขนาดสำหรับแต่ละเซกเมนต์ผู้พูดที่ยอมรับ เพื่อให้การดีบักแสดงทั้งฝั่งผู้ใช้และฝั่งคำตอบของเอเจนต์โดยไม่เทข้อความทรานสคริปต์แบบไม่จำกัด
- ในโหมด `agent-proxy` fallback การปรึกษาแบบบังคับจะข้ามเศษทรานสคริปต์ที่น่าจะไม่สมบูรณ์ เช่น ข้อความที่ลงท้ายด้วย `...` หรือตัวเชื่อมท้ายอย่าง `and` รวมถึงคำปิดท้ายที่ชัดเจนว่าไม่ต้องดำเนินการ เช่น “เดี๋ยวกลับมา” หรือ “ลาก่อน” บันทึกจะแสดง `forced agent consult skipped reason=...` เมื่อสิ่งนี้ป้องกันคำตอบค้างคิวที่เก่าเกินไป

การตั้งค่า native opus สำหรับซอร์สเช็กเอาต์:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

ใช้ Node 22 สำหรับ Gateway เมื่อคุณต้องการ native addon ที่สร้างไว้ล่วงหน้าสำหรับ macOS arm64 จาก upstream หากคุณใช้รันไทม์ Node อื่น ตัวติดตั้งแบบเลือกเปิดใช้อาจต้องใช้ toolchain สำหรับซอร์สบิลด์ `node-gyp` ภายในเครื่อง

หลังติดตั้ง native addon แล้ว ให้เริ่ม Gateway ด้วย:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

บันทึกเสียงแบบละเอียดควรแสดง `discord voice: opus decoder: @discordjs/opus` หากไม่มีการเลือกเปิดใช้ผ่าน env หรือหาก native addon หายไปหรือโหลดบนโฮสต์ไม่ได้ OpenClaw จะบันทึก `discord voice: opus decoder: opusscript` และยังคงรับเสียงผ่าน fallback แบบ JS ล้วน

ไปป์ไลน์ STT ร่วมกับ TTS:

- การจับ PCM ของ Discord ถูกแปลงเป็นไฟล์ WAV ชั่วคราว
- `tools.media.audio` จัดการ STT เช่น `openai/gpt-4o-mini-transcribe`
- ทรานสคริปต์ถูกส่งผ่านทางเข้าและการจัดเส้นทางของ Discord ขณะที่ LLM ตอบสนองทำงานด้วยนโยบายเอาต์พุตเสียงที่ซ่อนเครื่องมือ `tts` ของเอเจนต์และขอข้อความที่ส่งกลับ เพราะเสียง Discord เป็นเจ้าของการเล่น TTS สุดท้าย
- เมื่อมีการตั้งค่า `voice.model` จะแทนที่เฉพาะ LLM ตอบสนองสำหรับรอบช่องเสียงนี้
- `voice.tts` ถูกผสานทับ `messages.tts`; ผู้ให้บริการที่รองรับการสตรีมจะป้อนข้อมูลให้ตัวเล่นโดยตรง มิฉะนั้นไฟล์เสียงผลลัพธ์จะถูกเล่นในช่องที่เข้าร่วม

ตัวอย่างเซสชันช่องเสียง agent-proxy เริ่มต้น:

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

เมื่อไม่มีบล็อก `voice.agentSession` แต่ละช่องเสียงจะมีเซสชัน OpenClaw ที่ถูกจัดเส้นทางของตัวเอง ตัวอย่างเช่น `/vc join channel:234567890123456789` พูดคุยกับเซสชันสำหรับช่องเสียง Discord นั้น โมเดลเรียลไทม์เป็นเพียงส่วนหน้าเสียงเท่านั้น คำขอที่มีสาระจะถูกส่งต่อไปยังเอเจนต์ OpenClaw ที่กำหนดค่าไว้ หากโมเดลเรียลไทม์สร้างทรานสคริปต์สุดท้ายโดยไม่เรียกเครื่องมือปรึกษา OpenClaw จะบังคับการปรึกษาเป็น fallback เพื่อให้ค่าเริ่มต้นยังคงทำงานเหมือนการคุยกับเอเจนต์

ตัวอย่าง STT ร่วมกับ TTS รุ่นเดิม:

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

ตัวอย่าง bidi แบบเรียลไทม์:

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

ในโหมด `agent-proxy` บอตจะเข้าร่วมช่องเสียงที่กำหนดค่าไว้ แต่รอบของเอเจนต์ OpenClaw ใช้เซสชันและเอเจนต์ที่ถูกจัดเส้นทางตามปกติของช่องเป้าหมาย เซสชันเสียงเรียลไทม์พูดผลลัพธ์ที่ส่งกลับเข้าไปในช่องเสียง เอเจนต์ผู้ควบคุมยังคงใช้เครื่องมือข้อความตามปกติได้ตามนโยบายเครื่องมือของตน รวมถึงการส่งข้อความ Discord แยกต่างหากหากนั่นเป็นการกระทำที่เหมาะสม

รูปแบบเป้าหมายที่มีประโยชน์:

- `target: "channel:123456789012345678"` จัดเส้นทางผ่านเซสชันช่องข้อความ Discord
- `target: "123456789012345678"` ถูกปฏิบัติเป็นเป้าหมายช่อง
- `target: "dm:123456789012345678"` หรือ `target: "user:123456789012345678"` จัดเส้นทางผ่านเซสชันข้อความส่วนตัวนั้น

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

ใช้การตั้งค่านี้เมื่อโมเดลได้ยินเสียงเล่นกลับของตัวเองจาก Discord ผ่านไมโครโฟนที่เปิดอยู่ แต่คุณยังต้องการขัดจังหวะด้วยการพูด OpenClaw จะป้องกันไม่ให้ OpenAI ขัดจังหวะอัตโนมัติจากเสียงอินพุตดิบ ในขณะที่ `bargeIn: true` ทำให้เหตุการณ์เริ่มพูดของลำโพง Discord และเสียงจากผู้พูดที่กำลังใช้งานอยู่แล้วสามารถยกเลิกคำตอบเรียลไทม์ที่กำลังทำงานอยู่ก่อนที่รอบเสียงที่จับได้ถัดไปจะไปถึง OpenAI สัญญาณพูดแทรกที่มาเร็วมากและมี `audioEndMs` ต่ำกว่า `minBargeInAudioEndMs` จะถูกถือว่าน่าจะเป็นเสียงสะท้อน/สัญญาณรบกวนและถูกละเว้น เพื่อไม่ให้โมเดลตัดเสียงตั้งแต่เฟรมแรกของการเล่นกลับ

ล็อกเสียงที่คาดหวัง:

- เมื่อเข้าร่วม: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- เมื่อเริ่มเรียลไทม์: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- เมื่อมีเสียงจากผู้พูด: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, และ `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- เมื่อข้ามเสียงพูดเก่า: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` หรือ `reason=non-actionable-closing ...`
- เมื่อคำตอบเรียลไทม์เสร็จสมบูรณ์: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- เมื่อการเล่นกลับหยุด/รีเซ็ต: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- เมื่อปรึกษาแบบเรียลไทม์: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- เมื่อเอเจนต์ตอบ: `discord voice: agent turn answer ...`
- เมื่อจัดคิวคำพูดแบบตรงตัว: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, ตามด้วย `discord voice: realtime exact speech dequeued reason=player-idle ...`
- เมื่อตรวจพบการพูดแทรก: `discord voice: realtime barge-in detected source=speaker-start ...` หรือ `discord voice: realtime barge-in detected source=active-speaker-audio ...`, ตามด้วย `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- เมื่อมีการขัดจังหวะเรียลไทม์: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, ตามด้วย `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` หรือ `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- เมื่อละเว้นเสียงสะท้อน/สัญญาณรบกวน: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- เมื่อปิดใช้การพูดแทรก: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- เมื่อการเล่นกลับไม่ได้ทำงาน: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

ในการดีบักเสียงที่ถูกตัด ให้อ่านล็อกเสียงเรียลไทม์เป็นไทม์ไลน์:

1. `realtime audio playback started` หมายถึง Discord เริ่มเล่นเสียงผู้ช่วยแล้ว Bridge จะเริ่มนับชังก์เอาต์พุตของผู้ช่วย ไบต์ PCM ของ Discord ไบต์เรียลไทม์ของผู้ให้บริการ และระยะเวลาเสียงสังเคราะห์จากจุดนี้
2. `realtime speaker turn opened` ระบุว่าผู้พูดใน Discord เริ่มมีสถานะใช้งานอยู่ หากการเล่นกลับกำลังทำงานอยู่แล้วและเปิดใช้ `bargeIn` สิ่งนี้อาจตามด้วย `barge-in detected source=speaker-start`
3. `realtime input audio started` ระบุเฟรมเสียงจริงแรกที่ได้รับสำหรับรอบผู้พูดนั้น `outputActive=true` หรือ `outputAudioMs` ที่ไม่เป็นศูนย์ตรงนี้หมายความว่าไมโครโฟนกำลังส่งอินพุตขณะที่การเล่นกลับของผู้ช่วยยังทำงานอยู่
4. `barge-in detected source=active-speaker-audio` หมายถึง OpenClaw เห็นเสียงผู้พูดสดขณะที่การเล่นกลับของผู้ช่วยทำงานอยู่ สิ่งนี้มีประโยชน์สำหรับแยกแยะการขัดจังหวะจริงออกจากเหตุการณ์เริ่มพูดของ Discord ที่ไม่มีเสียงที่เป็นประโยชน์
5. `barge-in requested reason=...` หมายถึง OpenClaw ขอให้ผู้ให้บริการเรียลไทม์ยกเลิกหรือตัดคำตอบที่กำลังทำงานอยู่ โดยมี `outputAudioMs`, `outputActive`, และ `playbackChunks` เพื่อให้คุณเห็นว่าเสียงผู้ช่วยเล่นไปแล้วมากแค่ไหนก่อนการขัดจังหวะ
6. `realtime audio playback stopped reason=...` คือจุดรีเซ็ตการเล่นกลับ Discord ในเครื่อง เหตุผลจะบอกว่าใครหยุดการเล่นกลับ: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, หรือ `session-close`
7. `realtime speaker turn closed` สรุปรอบอินพุตที่จับได้ `chunks=0` หรือ `hasAudio=false` หมายความว่ารอบผู้พูดเปิดขึ้น แต่ไม่มีเสียงที่ใช้งานได้ไปถึง Bridge เรียลไทม์ `interruptedPlayback=true` หมายความว่ารอบอินพุตนั้นทับซ้อนกับเอาต์พุตของผู้ช่วยและทริกเกอร์ตรรกะการพูดแทรก

ฟิลด์ที่มีประโยชน์:

- `outputAudioMs`: ระยะเวลาเสียงผู้ช่วยที่ผู้ให้บริการเรียลไทม์สร้างขึ้นก่อนบรรทัดล็อก
- `audioMs`: ระยะเวลาเสียงผู้ช่วยที่ OpenClaw นับก่อนการเล่นกลับหยุด
- `elapsedMs`: เวลาตามนาฬิกาจริงระหว่างการเปิดและปิดสตรีมการเล่นกลับหรือรอบผู้พูด
- `discordBytes`: ไบต์ PCM สเตอริโอ 48 kHz ที่ส่งไปยังหรือรับจากเสียง Discord
- `realtimeBytes`: ไบต์ PCM รูปแบบผู้ให้บริการที่ส่งไปยังหรือรับจากผู้ให้บริการเรียลไทม์
- `playbackChunks`: ชังก์เสียงผู้ช่วยที่ส่งต่อไปยัง Discord สำหรับคำตอบที่กำลังทำงานอยู่
- `sinceLastAudioMs`: ช่วงเวลาห่างระหว่างเฟรมเสียงผู้พูดที่จับได้ล่าสุดกับการปิดรอบผู้พูด

รูปแบบที่พบบ่อย:

- การตัดเสียงทันทีพร้อม `source=active-speaker-audio`, `outputAudioMs` น้อย และผู้ใช้คนเดิมอยู่ใกล้ ๆ มักชี้ว่าเสียงสะท้อนจากลำโพงเข้ามาในไมโครโฟน เพิ่ม `voice.realtime.minBargeInAudioEndMs`, ลดระดับเสียงลำโพง, ใช้หูฟัง, หรือตั้งค่า `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`
- `source=speaker-start` ตามด้วย `speaker turn closed ... hasAudio=false` หมายความว่า Discord รายงานว่าผู้พูดเริ่มพูด แต่ไม่มีเสียงไปถึง OpenClaw ซึ่งอาจเป็นเหตุการณ์เสียง Discord ชั่วคราว พฤติกรรม noise gate หรือไคลเอนต์เปิดไมโครโฟนชั่วขณะ
- `audio playback stopped reason=stream-close` โดยไม่มีการพูดแทรกหรือ `provider-clear-audio` ใกล้เคียง หมายความว่าสตรีมการเล่นกลับ Discord ในเครื่องสิ้นสุดโดยไม่คาดคิด ตรวจสอบล็อกผู้ให้บริการและตัวเล่น Discord ก่อนหน้า
- `capture ignored during playback (barge-in disabled)` หมายความว่า OpenClaw จงใจทิ้งอินพุตขณะที่เสียงผู้ช่วยทำงานอยู่ เปิดใช้ `voice.realtime.bargeIn` หากคุณต้องการให้เสียงพูดขัดจังหวะการเล่นกลับ
- `barge-in ignored ... outputActive=false` หมายความว่า VAD ของ Discord หรือผู้ให้บริการรายงานเสียงพูด แต่ OpenClaw ไม่มีการเล่นกลับที่กำลังทำงานอยู่ให้ขัดจังหวะ สิ่งนี้ไม่ควรตัดเสียง

ข้อมูลประจำตัวจะถูกแก้ไขแยกตามคอมโพเนนต์: การยืนยันตัวตนเส้นทาง LLM สำหรับ `voice.model`, การยืนยันตัวตน STT สำหรับ `tools.media.audio`, การยืนยันตัวตน TTS สำหรับ `messages.tts`/`voice.tts`, และการยืนยันตัวตนผู้ให้บริการเรียลไทม์สำหรับ `voice.realtime.providers` หรือการกำหนดค่าการยืนยันตัวตนปกติของผู้ให้บริการ

### ข้อความเสียง

ข้อความเสียง Discord แสดงตัวอย่างคลื่นเสียงและต้องใช้เสียง OGG/Opus OpenClaw สร้างคลื่นเสียงให้อัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ Gateway เพื่อใช้ตรวจสอบและแปลง

- ระบุ **พาธไฟล์ในเครื่อง** (URL จะถูกปฏิเสธ)
- ไม่ต้องใส่เนื้อหาข้อความ (Discord ปฏิเสธข้อความ + ข้อความเสียงในเพย์โหลดเดียวกัน)
- รองรับรูปแบบเสียงใดก็ได้ OpenClaw จะแปลงเป็น OGG/Opus ตามต้องการ

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - เปิดใช้ Message Content Intent
    - เปิดใช้ Server Members Intent เมื่อคุณต้องพึ่งพาการแก้ข้อมูลผู้ใช้/สมาชิก
    - รีสตาร์ท Gateway หลังจากเปลี่ยน intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบ allowlist ของ guild ใต้ `channels.discord.guilds`
    - หากมีแมป `channels` ของ guild อยู่ จะอนุญาตเฉพาะแชนเนลที่ระบุไว้เท่านั้น
    - ตรวจสอบพฤติกรรม `requireMention` และรูปแบบการ mention

    การตรวจสอบที่มีประโยชน์:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    สาเหตุที่พบบ่อย:

    - `groupPolicy="allowlist"` โดยไม่มี allowlist ของ guild/channel ที่ตรงกัน
    - กำหนดค่า `requireMention` ผิดตำแหน่ง (ต้องอยู่ใต้ `channels.discord.guilds` หรือรายการ channel)
    - ผู้ส่งถูกบล็อกโดย allowlist `users` ของ guild/channel

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    ล็อกทั่วไป:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    ปุ่มปรับคิว Gateway ของ Discord:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - สิ่งนี้ควบคุมเฉพาะงาน listener ของ Gateway Discord ไม่ใช่อายุการทำงานของรอบเอเจนต์

    Discord ไม่ใช้ timeout ที่ channel เป็นเจ้าของกับรอบเอเจนต์ที่อยู่ในคิว Message listeners จะส่งต่องานทันที และรัน Discord ที่อยู่ในคิวจะรักษาลำดับต่อ session จนกว่า lifecycle ของ session/tool/runtime จะเสร็จสมบูรณ์หรือยกเลิกงาน

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

  <Accordion title="Gateway metadata lookup timeout warnings">
    OpenClaw ดึงข้อมูลเมตา `/gateway/bot` ของ Discord ก่อนเชื่อมต่อ ความล้มเหลวชั่วคราวจะ fallback ไปยัง URL Gateway เริ่มต้นของ Discord และถูกจำกัดอัตราในล็อก

    ปุ่มปรับ timeout ของข้อมูลเมตา:

    - บัญชีเดียว: `channels.discord.gatewayInfoTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback ของ env เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - ค่าเริ่มต้น: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw รอเหตุการณ์ `READY` ของ Gateway Discord ระหว่างเริ่มต้นและหลังจาก runtime เชื่อมต่อใหม่ การตั้งค่าหลายบัญชีที่มีการหน่วงเวลาเริ่มต้นทีละส่วนอาจต้องใช้หน้าต่าง READY ตอนเริ่มต้นที่ยาวกว่าค่าเริ่มต้น

    ปุ่มปรับ READY timeout:

    - เริ่มต้นแบบบัญชีเดียว: `channels.discord.gatewayReadyTimeoutMs`
    - เริ่มต้นแบบหลายบัญชี: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback ของ env ตอนเริ่มต้นเมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นตอนเริ่มต้น: `15000` (15 วินาที), สูงสุด: `120000`
    - runtime แบบบัญชีเดียว: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime แบบหลายบัญชี: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback ของ env ตอน runtime เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นตอน runtime: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    การตรวจสอบสิทธิ์ของ `channels status --probe` ใช้งานได้เฉพาะกับ ID channel แบบตัวเลขเท่านั้น

    หากคุณใช้คีย์แบบ slug การจับคู่ตอน runtime ยังอาจทำงานได้ แต่ probe ไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน

  </Accordion>

  <Accordion title="DM and pairing issues">

    - ปิดใช้ DM: `channels.discord.dm.enabled=false`
    - ปิดใช้นโยบาย DM: `channels.discord.dmPolicy="disabled"` (ดั้งเดิม: `channels.discord.dm.policy`)
    - รอการอนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    โดยค่าเริ่มต้น ข้อความที่เขียนโดยบอตจะถูกละเว้น

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎ mention และ allowlist ที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมวนลูป
    แนะนำให้ใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความจากบอทที่ mention บอทเท่านั้น

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

    - อัปเดต OpenClaw ให้เป็นเวอร์ชันปัจจุบันอยู่เสมอ (`openclaw update`) เพื่อให้มีตรรกะการกู้คืนการรับเสียงของ Discord
    - ยืนยันว่า `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้นของ upstream) และปรับแต่งเฉพาะเมื่อจำเป็น
    - ดู log สำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากความล้มเหลวยังคงเกิดขึ้นหลังจาก rejoin อัตโนมัติ ให้รวบรวม log แล้วเปรียบเทียบกับประวัติการรับ DAVE ของ upstream ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## การอ้างอิงการกำหนดค่า

แหล่งอ้างอิงหลัก: [การอ้างอิงการกำหนดค่า - Discord](/th/gateway/config-channels#discord)

<Accordion title="ฟิลด์ Discord สัญญาณสูง">

- การเริ่มต้น/การตรวจสอบสิทธิ์: `enabled`, `token`, `accounts.*`, `allowBots`
- นโยบาย: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- คำสั่ง: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- คิวเหตุการณ์: `eventQueue.listenerTimeout` (งบประมาณ listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- การตอบกลับ/ประวัติ: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- การสตรีม: `streaming` (alias เดิม: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- สื่อ/การลองใหม่: `mediaMaxMb` (จำกัดการอัปโหลด Discord ขาออก ค่าเริ่มต้น `100MB`), `retry`
- การดำเนินการ: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ฟีเจอร์: `threadBindings`, `bindings[]` ระดับบนสุด (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการปฏิบัติการ

- ปฏิบัติกับ token ของบอทเป็นความลับ (แนะนำให้ใช้ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการควบคุมดูแล)
- มอบสิทธิ์ Discord ตามหลักสิทธิ์ขั้นต่ำ
- หากสถานะการ deploy/คำสั่งล้าสมัย ให้รีสตาร์ท gateway และตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

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
    โมเดลภัยคุกคามและการเพิ่มความแข็งแกร่ง
  </Card>
  <Card title="การกำหนดเส้นทางหลาย agent" icon="sitemap" href="/th/concepts/multi-agent">
    แมป guild และช่องกับ agent
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่ง native
  </Card>
</CardGroup>
