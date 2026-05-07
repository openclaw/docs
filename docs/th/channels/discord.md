---
read_when:
    - การทำงานกับฟีเจอร์ช่องทาง Discord
summary: สถานะการรองรับบอต Discord ความสามารถ และการกำหนดค่า
title: Discord
x-i18n:
    generated_at: "2026-05-07T13:13:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805a093452b7af1c844919cdf776d898c6fd39f63f1bf363967dd471842eebd5
    source_path: channels/discord.md
    workflow: 16
---

พร้อมใช้งานสำหรับ DM และช่องกิลด์ผ่าน Discord gateway อย่างเป็นทางการ

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ Discord จะใช้โหมดจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแคตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องและโฟลว์การซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าแบบรวดเร็ว

คุณจะต้องสร้างแอปพลิเคชันใหม่พร้อมบอต เพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ และจับคู่กับ OpenClaw เราแนะนำให้เพิ่มบอตของคุณไปยังเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากคุณยังไม่มี [ให้สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="สร้างแอปพลิเคชันและบอต Discord">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อเป็นอย่างเช่น "OpenClaw"

    คลิก **Bot** บนแถบด้านข้าง ตั้งค่า **Username** เป็นชื่อใดก็ได้ที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้ privileged intents">
    ยังคงอยู่ที่หน้า **Bot** ให้เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับรายการอนุญาตตามบทบาทและการจับคู่ชื่อกับ ID)
    - **Presence Intent** (ไม่บังคับ; จำเป็นเฉพาะสำหรับการอัปเดต presence)

  </Step>

  <Step title="คัดลอกโทเค็นบอตของคุณ">
    เลื่อนกลับขึ้นไปบนหน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อจะเป็นเช่นนั้น แต่นี่จะสร้างโทเค็นแรกของคุณ — ไม่มีอะไรถูก "รีเซ็ต"
    </Note>

    คัดลอกโทเค็นและบันทึกไว้ที่ใดที่หนึ่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในอีกไม่นาน

  </Step>

  <Step title="สร้าง URL เชิญและเพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** บนแถบด้านข้าง คุณจะสร้าง URL เชิญพร้อมสิทธิ์ที่เหมาะสมเพื่อเพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ

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

    นี่คือชุดพื้นฐานสำหรับช่องข้อความปกติ หากคุณวางแผนจะโพสต์ในเธรดของ Discord รวมถึงเวิร์กโฟลว์ช่องฟอรัมหรือสื่อที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้ **Send Messages in Threads** ด้วย
    คัดลอก URL ที่สร้างขึ้นด้านล่าง วางลงในเบราว์เซอร์ของคุณ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอตของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิดใช้ Developer Mode และรวบรวม ID ของคุณ">
    กลับไปที่แอป Discord คุณต้องเปิดใช้ Developer Mode เพื่อให้คัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนเฟืองข้างอวาตาร์ของคุณ) → **Advanced** → เปิด **Developer Mode**
    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ของคุณไว้พร้อมกับ Bot Token — คุณจะส่งทั้งสามอย่างให้ OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาต DM จากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงานได้ Discord ต้องอนุญาตให้บอตของคุณส่ง DM ถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณ → **Privacy Settings** → เปิด **Direct Messages**

    สิ่งนี้ทำให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอต) ส่ง DM ถึงคุณได้ ให้เปิดไว้หากคุณต้องการใช้ DM ของ Discord กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่องกิลด์ คุณสามารถปิด DM หลังจับคู่แล้วได้

  </Step>

  <Step title="ตั้งค่าโทเค็นบอตของคุณอย่างปลอดภัย (อย่าส่งในแชต)">
    โทเค็นบอต Discord ของคุณเป็นความลับ (เหมือนรหัสผ่าน) ตั้งค่าบนเครื่องที่รัน OpenClaw ก่อนส่งข้อความถึงเอเจนต์ของคุณ

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

    หาก OpenClaw กำลังรันเป็นบริการเบื้องหลังอยู่แล้ว ให้รีสตาร์ตผ่านแอป OpenClaw Mac หรือหยุดและเริ่มกระบวนการ `openclaw gateway run` ใหม่
    สำหรับการติดตั้งบริการที่มีการจัดการ ให้รัน `openclaw gateway install` จากเชลล์ที่มี `DISCORD_BOT_TOKEN` อยู่ หรือเก็บตัวแปรไว้ใน `~/.openclaw/.env` เพื่อให้บริการสามารถแก้ SecretRef ของ env ได้หลังรีสตาร์ต
    หากโฮสต์ของคุณถูกบล็อกหรือถูกจำกัดอัตราโดยการค้นหาแอปพลิเคชันตอนเริ่มต้นของ Discord ให้ตั้งค่า application/client ID ของ Discord จาก Developer Portal เพื่อให้การเริ่มต้นข้าม REST call นั้นได้ ใช้ `channels.discord.applicationId` สำหรับบัญชีเริ่มต้น หรือ `channels.discord.accounts.<accountId>.applicationId` เมื่อคุณรันบอต Discord หลายตัว

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        แชตกับเอเจนต์ OpenClaw ของคุณบนช่องใดก็ได้ที่มีอยู่ (เช่น Telegram) แล้วบอกมัน หาก Discord เป็นช่องแรกของคุณ ให้ใช้แท็บ CLI / config แทน

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

        env fallback สำหรับบัญชีเริ่มต้น:

```bash
DISCORD_BOT_TOKEN=...
```

        สำหรับการตั้งค่าแบบสคริปต์หรือระยะไกล ให้เขียนบล็อก JSON5 เดียวกันด้วย `openclaw config patch --file ./discord.patch.json5 --dry-run` แล้วรันซ้ำโดยไม่มี `--dry-run` รองรับค่า `token` แบบข้อความธรรมดา และรองรับค่า SecretRef สำหรับ `channels.discord.token` ผ่านผู้ให้บริการ env/file/exec ด้วย ดู [การจัดการความลับ](/th/gateway/secrets)

        สำหรับบอต Discord หลายตัว ให้เก็บโทเค็นบอตและ application ID แต่ละตัวไว้ภายใต้บัญชีของมัน `channels.discord.applicationId` ระดับบนจะถูกสืบทอดโดยบัญชีต่างๆ ดังนั้นให้ตั้งค่าที่นั่นเฉพาะเมื่อทุกบัญชีควรใช้ application ID เดียวกัน

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
    รอจนกว่า gateway จะรันอยู่ จากนั้นส่ง DM ถึงบอตของคุณใน Discord บอตจะตอบกลับด้วยรหัสจับคู่

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        ส่งรหัสจับคู่ให้เอเจนต์ของคุณบนช่องที่มีอยู่:

        > "อนุมัติรหัสจับคู่ Discord นี้: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    รหัสจับคู่จะหมดอายุหลัง 1 ชั่วโมง

    ตอนนี้คุณควรแชตกับเอเจนต์ของคุณใน Discord ผ่าน DM ได้แล้ว

  </Step>
</Steps>

<Note>
การแก้โทเค็นรับรู้ตามบัญชี ค่าโทเค็นใน config ชนะ env fallback `DISCORD_BOT_TOKEN` ใช้เฉพาะสำหรับบัญชีเริ่มต้นเท่านั้น
หากบัญชี Discord ที่เปิดใช้สองบัญชีแก้เป็นโทเค็นบอตเดียวกัน OpenClaw จะเริ่ม gateway monitor เพียงตัวเดียวสำหรับโทเค็นนั้น โทเค็นที่มาจาก config จะชนะ env fallback เริ่มต้น มิฉะนั้นบัญชีที่เปิดใช้บัญชีแรกจะชนะ และบัญชีซ้ำจะถูกรายงานว่าปิดใช้งาน
สำหรับ outbound calls ขั้นสูง (เครื่องมือ message/การกระทำของช่อง) จะใช้ `token` แบบระบุราย call สำหรับ call นั้น สิ่งนี้ใช้กับการกระทำส่งและอ่าน/ตรวจสอบแบบ probe (เช่น read/search/fetch/thread/pins/permissions) นโยบายบัญชี/การตั้งค่า retry ยังคงมาจากบัญชีที่เลือกใน runtime snapshot ที่ใช้งานอยู่
</Note>

## แนะนำ: ตั้งค่าพื้นที่ทำงานของกิลด์

เมื่อ DM ทำงานแล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็นพื้นที่ทำงานเต็มรูปแบบที่แต่ละช่องจะได้เซสชันเอเจนต์ของตัวเองพร้อมบริบทของตัวเอง วิธีนี้แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีเพียงคุณและบอตของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณลงในรายการอนุญาตของกิลด์">
    สิ่งนี้เปิดให้เอเจนต์ของคุณตอบกลับในช่องใดก็ได้บนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ DM

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เพิ่ม Discord Server ID `<server_id>` ของฉันลงในรายการอนุญาตของกิลด์"
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
    ตามค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในช่องกิลด์เฉพาะเมื่อถูก @mentioned เท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณอาจต้องการให้ตอบกลับทุกข้อความ

    ในช่องกิลด์ คำตอบสุดท้ายปกติของผู้ช่วยจะยังเป็นส่วนตัวตามค่าเริ่มต้น เอาต์พุต Discord ที่มองเห็นได้ต้องถูกส่งอย่างชัดเจนด้วยเครื่องมือ `message` เพื่อให้เอเจนต์สามารถเฝ้าดูแบบเงียบๆ เป็นค่าเริ่มต้นและโพสต์เฉพาะเมื่อมันตัดสินใจว่าการตอบกลับในช่องมีประโยชน์

    ซึ่งหมายความว่าโมเดลที่เลือกต้องเรียกใช้เครื่องมือได้อย่างน่าเชื่อถือ หาก Discord แสดงว่ากำลังพิมพ์และล็อกแสดงการใช้โทเค็นแต่ไม่มีข้อความที่โพสต์ ให้ตรวจสอบล็อกเซสชันสำหรับข้อความผู้ช่วยที่มี `didSendViaMessagingTool: false` นั่นหมายความว่าโมเดลสร้างคำตอบสุดท้ายแบบส่วนตัวแทนที่จะเรียก `message(action=send)` ให้เปลี่ยนไปใช้โมเดลที่เรียกใช้เครื่องมือได้ดีกว่า หรือใช้ config ด้านล่างเพื่อคืนค่าคำตอบสุดท้ายอัตโนมัติแบบเดิม

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "อนุญาตให้เอเจนต์ของฉันตอบกลับบนเซิร์ฟเวอร์นี้โดยไม่ต้องถูก @mentioned"
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

        หากต้องการคืนค่าคำตอบสุดท้ายอัตโนมัติแบบเดิมสำหรับห้องกลุ่ม/ช่อง ให้ตั้งค่า `messages.groupChat.visibleReplies: "automatic"`

      </Tab>
    </Tabs>

  </Step>

  <Step title="วางแผนสำหรับหน่วยความจำในช่องกิลด์">
    ตามค่าเริ่มต้น หน่วยความจำระยะยาว (MEMORY.md) จะโหลดเฉพาะในเซสชัน DM ช่องกิลด์จะไม่โหลด MEMORY.md โดยอัตโนมัติ

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เมื่อฉันถามคำถามในช่อง Discord ให้ใช้ memory_search หรือ memory_get หากคุณต้องการบริบทระยะยาวจาก MEMORY.md"
      </Tab>
      <Tab title="Manual">
        หากคุณต้องการบริบทร่วมในทุกช่อง ให้ใส่คำสั่งที่เสถียรไว้ใน `AGENTS.md` หรือ `USER.md` (ทั้งสองจะถูกแทรกในทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงเมื่อจำเป็นด้วยเครื่องมือ memory
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างช่องบางช่องบนเซิร์ฟเวอร์ Discord ของคุณและเริ่มแชต เอเจนต์ของคุณสามารถเห็นชื่อช่องได้ และแต่ละช่องจะได้เซสชันแยกของตัวเอง — ดังนั้นคุณจึงตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ได้ที่เหมาะกับเวิร์กโฟลว์ของคุณ

## โมเดลรันไทม์

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord
- การกำหนดเส้นทางการตอบกลับเป็นแบบกำหนดตายตัว: การตอบกลับขาเข้าจาก Discord จะตอบกลับไปยัง Discord
- เมตาดาต้า guild/channel ของ Discord จะถูกเพิ่มในพรอมป์ตของโมเดลเป็นบริบทที่ไม่น่าเชื่อถือ
  ไม่ใช่คำนำหน้าการตอบกลับที่ผู้ใช้มองเห็น หากโมเดลคัดลอกกรอบข้อมูลนั้น
  กลับมา OpenClaw จะลบเมตาดาต้าที่ถูกคัดลอกออกจากการตอบกลับขาออกและจาก
  บริบทการเล่นซ้ำในอนาคต
- โดยค่าเริ่มต้น (`session.dmScope=main`) แชตโดยตรงจะแชร์เซสชันหลักของเอเจนต์ (`agent:main:main`)
- ช่อง guild เป็นคีย์เซสชันที่แยกกัน (`agent:<agentId>:discord:channel:<channelId>`)
- Group DM จะถูกละเว้นโดยค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่ง slash แบบเนทีฟทำงานในเซสชันคำสั่งที่แยกกัน (`agent:<agentId>:discord:slash:<userId>`) ขณะที่ยังพก `CommandTargetSessionKey` ไปยังเซสชันสนทนาที่ถูกกำหนดเส้นทาง
- การส่งประกาศ cron/heartbeat แบบข้อความล้วนไปยัง Discord ใช้คำตอบสุดท้าย
  ที่ผู้ช่วยมองเห็นได้เพียงครั้งเดียว เพย์โหลดสื่อและคอมโพเนนต์แบบมีโครงสร้างยังคงเป็น
  หลายข้อความเมื่อเอเจนต์ปล่อยเพย์โหลดที่ส่งได้หลายรายการ

## ช่องฟอรัม

ช่องฟอรัมและช่องสื่อของ Discord รับเฉพาะโพสต์ในเธรดเท่านั้น OpenClaw รองรับสองวิธีในการสร้างรายการเหล่านี้:

- ส่งข้อความไปยังฟอรัมแม่ (`channel:<forumId>`) เพื่อสร้างเธรดโดยอัตโนมัติ ชื่อเธรดจะใช้บรรทัดแรกที่ไม่ว่างของข้อความของคุณ
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

ฟอรัมแม่ไม่รับคอมโพเนนต์ของ Discord หากคุณต้องการคอมโพเนนต์ ให้ส่งไปยังเธรดนั้นเอง (`channel:<threadId>`)

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับคอนเทนเนอร์คอมโพเนนต์ Discord v2 สำหรับข้อความของเอเจนต์ ใช้เครื่องมือข้อความพร้อมเพย์โหลด `components` ผลลัพธ์การโต้ตอบจะถูกกำหนดเส้นทางกลับไปยังเอเจนต์เป็นข้อความขาเข้าปกติ และทำตามการตั้งค่า `replyToMode` ของ Discord ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถวการกระทำอนุญาตให้มีปุ่มได้สูงสุด 5 ปุ่ม หรือเมนูเลือกหนึ่งเมนู
- ประเภทการเลือก: `string`, `user`, `role`, `mentionable`, `channel`

โดยค่าเริ่มต้น คอมโพเนนต์จะใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่ออนุญาตให้ใช้ปุ่ม เมนูเลือก และฟอร์มได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดว่าใครสามารถคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (ID ผู้ใช้ Discord, แท็ก หรือ `*`) เมื่อกำหนดค่าแล้ว ผู้ใช้ที่ไม่ตรงกันจะได้รับการปฏิเสธแบบ ephemeral

คำสั่ง slash `/model` และ `/models` จะเปิดตัวเลือกโมเดลแบบโต้ตอบพร้อมดรอปดาวน์ผู้ให้บริการ โมเดล และรันไทม์ที่เข้ากันได้ รวมถึงขั้นตอน Submit `/models add` เลิกใช้แล้ว และตอนนี้จะส่งคืนข้อความแจ้งเลิกใช้แทนการลงทะเบียนโมเดลจากแชต การตอบกลับของตัวเลือกเป็นแบบ ephemeral และมีเพียงผู้ใช้ที่เรียกใช้เท่านั้นที่สามารถใช้งานได้

ไฟล์แนบ:

- บล็อก `file` ต้องชี้ไปยังการอ้างอิงไฟล์แนบ (`attachment://<filename>`)
- ระบุไฟล์แนบผ่าน `media`/`path`/`filePath` (ไฟล์เดียว); ใช้ `media-gallery` สำหรับหลายไฟล์
- ใช้ `filename` เพื่อแทนที่ชื่ออัปโหลดเมื่อควรตรงกับการอ้างอิงไฟล์แนบ

ฟอร์มโมดัล:

- เพิ่ม `components.modal` ที่มีฟิลด์ได้สูงสุด 5 ฟิลด์
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
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM `channels.discord.allowFrom` คือ allowlist ของ DM ที่เป็นมาตรฐาน

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.discord.allowFrom` รวม `"*"`)
    - `disabled`

    หากนโยบาย DM ไม่ใช่ open ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือถูกแจ้งให้ pairing ในโหมด `pairing`)

    ลำดับความสำคัญของหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - สำหรับหนึ่งบัญชี `allowFrom` มีลำดับความสำคัญเหนือ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อ `allowFrom` ของตัวเองและ `dm.allowFrom` แบบเดิมไม่ได้ตั้งค่าไว้
    - บัญชีที่มีชื่อไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    `channels.discord.dm.policy` และ `channels.discord.dm.allowFrom` แบบเดิมยังคงถูกอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การกล่าวถึง `<@id>`

    ID ตัวเลขล้วนโดยปกติจะแปลงเป็น ID ช่องเมื่อมีค่าเริ่มต้นของช่องใช้งานอยู่ แต่ ID ที่ระบุใน `allowFrom` ของ DM ที่มีผลสำหรับบัญชีจะถูกมองเป็นเป้าหมาย DM ของผู้ใช้เพื่อความเข้ากันได้

  </Tab>

  <Tab title="DM access groups">
    DM ของ Discord สามารถใช้รายการ `accessGroup:<name>` แบบไดนามิกใน `channels.discord.allowFrom`

    ชื่อกลุ่มการเข้าถึงใช้ร่วมกันในหลายช่องข้อความ ใช้ `type: "message.senders"` สำหรับกลุ่มแบบคงที่ที่สมาชิกแสดงในไวยากรณ์ `allowFrom` ปกติของแต่ละช่อง หรือ `type: "discord.channelAudience"` เมื่อผู้ชม `ViewChannel` ปัจจุบันของช่อง Discord ควรกำหนดสมาชิกแบบไดนามิก พฤติกรรมกลุ่มการเข้าถึงที่ใช้ร่วมกันมีเอกสารไว้ที่นี่: [กลุ่มการเข้าถึง](/th/channels/access-groups)

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

    ช่องข้อความ Discord ไม่มีรายชื่อสมาชิกแยกต่างหาก `type: "discord.channelAudience"` จำลองสมาชิกดังนี้: ผู้ส่ง DM เป็นสมาชิกของ guild ที่กำหนดค่าไว้ และในขณะนั้นมีสิทธิ์ `ViewChannel` ที่มีผลบนช่องที่กำหนดค่าไว้หลังจากนำบทบาทและการเขียนทับของช่องมาใช้แล้ว

    ตัวอย่าง: อนุญาตให้ทุกคนที่มองเห็น `#maintainers` ส่ง DM ถึงบอตได้ ขณะที่ยังปิด DM สำหรับคนอื่นทั้งหมด

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

    การค้นหาจะล้มเหลวแบบปิด หาก Discord ส่งคืน `Missing Access` การค้นหาสมาชิกไม่สำเร็จ หรือช่องอยู่คนละ guild ผู้ส่ง DM จะถูกมองว่าไม่ได้รับอนุญาต

    เปิดใช้งาน **Server Members Intent** ใน Discord Developer Portal สำหรับบอตเมื่อใช้กลุ่มการเข้าถึงตามผู้ชมของช่อง DM ไม่มีสถานะสมาชิก guild ดังนั้น OpenClaw จึงแปลงข้อมูลสมาชิกผ่าน Discord REST ณ เวลาการอนุญาต

  </Tab>

  <Tab title="Guild policy">
    การจัดการ guild ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    ค่าพื้นฐานที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    พฤติกรรมของ `allowlist`:

    - guild ต้องตรงกับ `channels.discord.guilds` (แนะนำ `id`, ยอมรับ slug)
    - allowlist ของผู้ส่งแบบไม่บังคับ: `users` (แนะนำ ID ที่เสถียร) และ `roles` (ID บทบาทเท่านั้น); หากกำหนดค่าอย่างใดอย่างหนึ่ง ผู้ส่งจะได้รับอนุญาตเมื่อตรงกับ `users` หรือ `roles`
    - การจับคู่ชื่อ/แท็กโดยตรงถูกปิดโดยค่าเริ่มต้น; เปิดใช้ `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะในโหมดความเข้ากันได้แบบฉุกเฉินเท่านั้น
    - รองรับชื่อ/แท็กสำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อใช้รายการชื่อ/แท็ก
    - หาก guild มีการกำหนดค่า `channels` ช่องที่ไม่อยู่ในรายการจะถูกปฏิเสธ
    - หาก guild ไม่มีบล็อก `channels` ช่องทั้งหมดใน guild ที่อยู่ใน allowlist นั้นจะได้รับอนุญาต

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

    หากคุณตั้งค่าเฉพาะ `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` ค่า fallback ของรันไทม์คือ `groupPolicy="allowlist"` (พร้อมคำเตือนในบันทึก) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`

  </Tab>

  <Tab title="Mentions and group DMs">
    ข้อความใน guild ถูกกั้นด้วยการกล่าวถึงโดยค่าเริ่มต้น

    การตรวจจับการกล่าวถึงรวมถึง:

    - การกล่าวถึงบอตโดยตรง
    - รูปแบบการกล่าวถึงที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับถึงบอตโดยนัยในกรณีที่รองรับ

    เมื่อเขียนข้อความ Discord ขาออก ให้ใช้ไวยากรณ์การกล่าวถึงมาตรฐาน: `<@USER_ID>` สำหรับผู้ใช้, `<#CHANNEL_ID>` สำหรับช่อง และ `<@&ROLE_ID>` สำหรับบทบาท อย่าใช้รูปแบบการกล่าวถึงชื่อเล่นแบบเดิม `<@!USER_ID>`

    `requireMention` ถูกกำหนดค่าต่อ guild/channel (`channels.discord.guilds...`)
    `ignoreOtherMentions` สามารถละทิ้งข้อความที่กล่าวถึงผู้ใช้/บทบาทอื่นแต่ไม่ได้กล่าวถึงบอตได้ตามต้องการ (ไม่รวม @everyone/@here)

    Group DM:

    - ค่าเริ่มต้น: ถูกละเว้น (`dm.groupEnabled=false`)
    - allowlist แบบไม่บังคับผ่าน `dm.groupChannels` (ID ช่องหรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตามบทบาท

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิก guild ของ Discord ไปยังเอเจนต์ต่าง ๆ ตาม ID บทบาท การผูกตามบทบาทรับเฉพาะ ID บทบาท และจะถูกประเมินหลังการผูก peer หรือ parent-peer และก่อนการผูกเฉพาะ guild หากการผูกตั้งค่าฟิลด์การจับคู่อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ฟิลด์ที่กำหนดค่าทั้งหมดต้องตรงกัน

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

- `commands.native` มีค่าเริ่มต้นเป็น `"auto"` และเปิดใช้สำหรับ Discord
- การแทนที่รายช่อง: `channels.discord.commands.native`
- `commands.native=false` ข้ามการลงทะเบียนและการล้างคำสั่ง slash ของ Discord ระหว่างการเริ่มต้นระบบ คำสั่งที่ลงทะเบียนไว้ก่อนหน้าอาจยังคงมองเห็นได้ใน Discord จนกว่าคุณจะลบออกจากแอป Discord
- การยืนยันสิทธิ์ของคำสั่งแบบเนทีฟใช้รายการอนุญาต/นโยบาย Discord ชุดเดียวกับการจัดการข้อความปกติ
- คำสั่งอาจยังคงมองเห็นได้ใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต แต่การดำเนินการยังคงบังคับใช้การยืนยันสิทธิ์ของ OpenClaw และส่งคืน "ไม่ได้รับอนุญาต"

ดู [คำสั่ง slash](/th/tools/slash-commands) สำหรับแคตตาล็อกคำสั่งและพฤติกรรม

การตั้งค่าคำสั่ง slash เริ่มต้น:

- `ephemeral: true`

## รายละเอียดฟีเจอร์

<AccordionGroup>
  <Accordion title="แท็กตอบกลับและการตอบกลับแบบเนทีฟ">
    Discord รองรับแท็กตอบกลับในเอาต์พุตของ agent:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    ควบคุมโดย `channels.discord.replyToMode`:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`
    - `batched`

    หมายเหตุ: `off` ปิดการจัดเธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` ที่ระบุชัดเจนยังคงมีผล
    `first` แนบการอ้างอิงการตอบกลับแบบเนทีฟโดยนัยกับข้อความ Discord ขาออกแรกของรอบนั้นเสมอ
    `batched` จะแนบการอ้างอิงการตอบกลับแบบเนทีฟโดยนัยของ Discord เฉพาะเมื่อ
    รอบข้อความขาเข้าเป็นชุดข้อความหลายข้อความที่ถูก debounce ซึ่งมีประโยชน์
    เมื่อคุณต้องการให้การตอบกลับแบบเนทีฟใช้หลัก ๆ กับแชตที่มาเป็นชุดแบบกำกวม ไม่ใช่กับ
    ทุกรอบที่มีข้อความเดียว

    ID ข้อความจะถูกแสดงในบริบท/ประวัติ เพื่อให้ agent สามารถกำหนดเป้าหมายข้อความเฉพาะได้

  </Accordion>

  <Accordion title="ตัวอย่างสตรีมสด">
    OpenClaw สามารถสตรีมร่างคำตอบโดยส่งข้อความชั่วคราวและแก้ไขข้อความนั้นเมื่อมีข้อความเข้ามา `channels.discord.streaming` รับค่า `off` | `partial` | `block` | `progress` (ค่าเริ่มต้น) `progress` เก็บร่างสถานะหนึ่งรายการที่แก้ไขได้ และอัปเดตด้วยความคืบหน้าของเครื่องมือจนกว่าจะส่งผลลัพธ์สุดท้าย `streamMode` เป็นนามแฝงรันไทม์แบบเดิม เรียกใช้ `openclaw doctor --fix` เพื่อเขียน config ที่จัดเก็บไว้ใหม่ไปยังคีย์มาตรฐาน

    ตั้งค่า `channels.discord.streaming.mode` เป็น `off` เพื่อปิดการแก้ไขตัวอย่างของ Discord หากเปิดใช้การสตรีมแบบ block ของ Discord อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

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

    - `partial` แก้ไขข้อความตัวอย่างเดียวเมื่อ token มาถึง
    - `block` ส่งชิ้นส่วนขนาดร่าง (ใช้ `draftChunk` เพื่อปรับขนาดและจุดตัด ซึ่งถูกจำกัดไว้ที่ `textChunkLimit`)
    - ผลลัพธ์สุดท้ายที่เป็นสื่อ ข้อผิดพลาด และการตอบกลับที่ระบุชัดเจนจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความตัวอย่างซ้ำหรือไม่
    - `streaming.preview.commandText` / `streaming.progress.commandText` ควบคุมรายละเอียดคำสั่ง/exec ในบรรทัดความคืบหน้าแบบกะทัดรัด: `raw` (ค่าเริ่มต้น) หรือ `status` (เฉพาะป้ายกำกับเครื่องมือ)

    ซ่อนข้อความคำสั่ง/exec ดิบ ขณะยังคงบรรทัดความคืบหน้าแบบกะทัดรัดไว้:

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

    การสตรีมตัวอย่างรองรับเฉพาะข้อความ การตอบกลับที่เป็นสื่อจะย้อนกลับไปใช้การส่งแบบปกติ เมื่อเปิดใช้การสตรีมแบบ `block` อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

  </Accordion>

  <Accordion title="ประวัติ บริบท และพฤติกรรมเธรด">
    บริบทประวัติของกิลด์:

    - ค่าเริ่มต้นของ `channels.discord.historyLimit` คือ `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` ปิดใช้

    การควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมเธรด:

    - เธรด Discord จะถูกกำหนดเส้นทางเป็นเซสชันของช่อง และสืบทอด config ของช่องแม่ เว้นแต่จะถูกแทนที่
    - เซสชันเธรดจะสืบทอดการเลือก `/model` ระดับเซสชันของช่องแม่เป็น fallback เฉพาะโมเดล การเลือก `/model` ภายในเธรดยังคงมีลำดับความสำคัญเหนือกว่า และประวัติ transcript ของแม่จะไม่ถูกคัดลอก เว้นแต่จะเปิดใช้การสืบทอด transcript
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) เลือกให้ auto-thread ใหม่เริ่มต้นจาก transcript ของแม่ การแทนที่รายบัญชีอยู่ใต้ `channels.discord.accounts.<id>.thread.inheritParent`
    - ปฏิกิริยาจากเครื่องมือข้อความสามารถ resolve เป้าหมาย DM แบบ `user:<id>` ได้
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะถูกคงไว้ระหว่าง fallback การเปิดใช้งานขั้นตอบกลับ

    หัวข้อช่องจะถูกฉีดเป็นบริบทที่ **ไม่น่าเชื่อถือ** รายการอนุญาตควบคุมว่าใครสามารถเรียก agent ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบสมบูรณ์

  </Accordion>

  <Accordion title="เซสชันที่ผูกกับเธรดสำหรับ subagent">
    Discord สามารถผูกเธรดกับเป้าหมายเซสชัน เพื่อให้ข้อความติดตามผลในเธรดนั้นยังคงกำหนดเส้นทางไปยังเซสชันเดิม (รวมถึงเซสชัน subagent)

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/ใหม่กับเป้าหมาย subagent/เซสชัน
    - `/unfocus` ลบการผูกเธรดปัจจุบัน
    - `/agents` แสดงการรันที่ใช้งานอยู่และสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการเลิกโฟกัสอัตโนมัติเมื่อไม่มีกิจกรรมสำหรับการผูกที่โฟกัสอยู่
    - `/session max-age <duration|off>` ตรวจสอบ/อัปเดตอายุสูงสุดแบบตายตัวสำหรับการผูกที่โฟกัสอยู่

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
    - `channels.discord.threadBindings.*` แทนที่พฤติกรรม Discord
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดอัตโนมัติสำหรับ `sessions_spawn({ thread: true })` และการ spawn เธรดของ ACP ค่าเริ่มต้น: `true`
    - `defaultSpawnContext` ควบคุมบริบท subagent แบบเนทีฟสำหรับการ spawn ที่ผูกกับเธรด ค่าเริ่มต้น: `"fork"`
    - คีย์ `spawnSubagentSessions`/`spawnAcpSessions` ที่เลิกใช้แล้วจะถูกย้ายข้อมูลโดย `openclaw doctor --fix`
    - หากการผูกเธรดถูกปิดใช้สำหรับบัญชีหนึ่ง `/focus` และการดำเนินการผูกเธรดที่เกี่ยวข้องจะไม่พร้อมใช้งาน

    ดู [Sub-agents](/th/tools/subagents), [ACP Agents](/th/tools/acp-agents) และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="การผูกช่อง ACP แบบถาวร">
    สำหรับเวิร์กสเปซ ACP แบบ "เปิดตลอดเวลา" ที่เสถียร ให้กำหนดค่าการผูก ACP แบบมีชนิดที่ระดับบนสุด โดยกำหนดเป้าหมายไปยังการสนทนา Discord

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

    - `/acp spawn codex --bind here` ผูกช่องหรือเธรดปัจจุบันไว้ที่เดิม และทำให้ข้อความในอนาคตอยู่บนเซสชัน ACP เดิม ข้อความเธรดจะสืบทอดการผูกของช่องแม่
    - ในช่องหรือเธรดที่ถูกผูกไว้ `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP เดิมที่เดิม การผูกเธรดชั่วคราวสามารถแทนที่การ resolve เป้าหมายขณะทำงานอยู่ได้
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดลูกผ่าน `--thread auto|here`

    ดู [ACP Agents](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมการผูก

  </Accordion>

  <Accordion title="การแจ้งเตือนปฏิกิริยา">
    โหมดการแจ้งเตือนปฏิกิริยารายกิลด์:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    เหตุการณ์ปฏิกิริยาจะถูกแปลงเป็นเหตุการณ์ระบบและแนบกับเซสชัน Discord ที่ถูกกำหนดเส้นทาง

  </Accordion>

  <Accordion title="ปฏิกิริยา Ack">
    `ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback อีโมจิ identity ของ agent (`agents.list[].identity.emoji` หรือ "👀")

    หมายเหตุ:

    - Discord ยอมรับอีโมจิ unicode หรือชื่ออีโมจิแบบกำหนดเอง
    - ใช้ `""` เพื่อปิดใช้ปฏิกิริยาสำหรับช่องหรือบัญชี

  </Accordion>

  <Accordion title="การเขียน Config">
    การเขียน config ที่เริ่มจากช่องจะเปิดใช้เป็นค่าเริ่มต้น

    สิ่งนี้มีผลกับ flow `/config set|unset` (เมื่อเปิดใช้ฟีเจอร์คำสั่ง)

    ปิดใช้:

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
    กำหนดเส้นทางทราฟฟิก WebSocket ของ Discord Gateway และการค้นหา REST ตอนเริ่มต้น (ID แอปพลิเคชัน + การ resolve รายการอนุญาต) ผ่านพร็อกซี HTTP(S) ด้วย `channels.discord.proxy`

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

  <Accordion title="การรองรับ PluralKit">
    เปิดใช้การ resolve ของ PluralKit เพื่อแมปข้อความที่ถูก proxied กับ identity ของสมาชิกระบบ:

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
    - ชื่อแสดงของสมาชิกจะถูกจับคู่ตามชื่อ/slug เท่านั้นเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การค้นหาใช้ ID ข้อความต้นฉบับและถูกจำกัดด้วยช่วงเวลา
    - หากการค้นหาล้มเหลว ข้อความที่ถูก proxied จะถือเป็นข้อความของ bot และถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="นามแฝง mention ขาออก">
    ใช้ `mentionAliases` เมื่อ agent ต้องการ mention ขาออกที่กำหนดได้แน่นอนสำหรับผู้ใช้ Discord ที่รู้จัก คีย์คือ handle ที่ไม่มี `@` นำหน้า ค่าเป็น ID ผู้ใช้ Discord handle ที่ไม่รู้จัก, `@everyone`, `@here` และ mention ภายใน code span ของ Markdown จะคงเดิม

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
    การอัปเดต presence จะถูกใช้เมื่อคุณตั้งค่าฟิลด์สถานะหรือกิจกรรม หรือเมื่อคุณเปิดใช้ auto presence

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

    ตัวอย่างกิจกรรม (สถานะแบบกำหนดเองคือชนิดกิจกรรมเริ่มต้น):

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
    - 1: กำลังสตรีม (ต้องมี `activityUrl`)
    - 2: กำลังฟัง
    - 3: กำลังดู
    - 4: กำหนดเอง (ใช้ข้อความกิจกรรมเป็นสถานะ status; อีโมจิเป็นตัวเลือก)
    - 5: กำลังแข่งขัน

    ตัวอย่าง auto presence (สัญญาณสุขภาพรันไทม์):

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

    สถานะอัตโนมัติจะแมปความพร้อมใช้งานของรันไทม์ไปยังสถานะ Discord: healthy => online, degraded หรือ unknown => idle, exhausted หรือ unavailable => dnd การแทนที่ข้อความที่ไม่บังคับ:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับ placeholder `{reason}`)

  </Accordion>

  <Accordion title="การอนุมัติใน Discord">
    Discord รองรับการจัดการการอนุมัติแบบใช้ปุ่มใน DM และสามารถโพสต์พรอมป์การอนุมัติในช่องทางต้นทางได้ตามต้องการ

    เส้นทาง config:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; fallback ไปที่ `commands.ownerAllowFrom` เมื่อทำได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord จะเปิดใช้งานการอนุมัติ exec แบบ native โดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และสามารถระบุผู้อนุมัติได้อย่างน้อยหนึ่งราย ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมานผู้อนุมัติ exec จากช่องทาง `allowFrom`, `dm.allowFrom` แบบเดิม หรือ `defaultTo` ของข้อความโดยตรง ตั้งค่า `enabled: false` เพื่อปิดใช้งาน Discord เป็นไคลเอนต์การอนุมัติแบบ native อย่างชัดเจน

    สำหรับคำสั่งกลุ่มที่ละเอียดอ่อนและจำกัดเฉพาะเจ้าของ เช่น `/diagnostics` และ `/export-trajectory` OpenClaw จะส่งพรอมป์การอนุมัติและผลลัพธ์สุดท้ายแบบส่วนตัว โดยจะลองใช้ Discord DM ก่อนเมื่อเจ้าของที่เรียกใช้มีเส้นทางเจ้าของ Discord; หากไม่พร้อมใช้งาน จะ fallback ไปยังเส้นทางเจ้าของแรกที่พร้อมใช้งานจาก `commands.ownerAllowFrom` เช่น Telegram

    เมื่อ `target` เป็น `channel` หรือ `both` พรอมป์การอนุมัติจะมองเห็นได้ในช่องทาง เฉพาะผู้อนุมัติที่ระบุได้เท่านั้นที่ใช้ปุ่มได้; ผู้ใช้อื่นจะได้รับการปฏิเสธแบบ ephemeral พรอมป์การอนุมัติรวมข้อความคำสั่งไว้ด้วย ดังนั้นให้เปิดใช้งานการส่งไปยังช่องทางเฉพาะในช่องทางที่เชื่อถือได้เท่านั้น หากไม่สามารถหา ID ช่องทางจาก session key ได้ OpenClaw จะ fallback ไปส่งผ่าน DM

    Discord ยังแสดงผลปุ่มอนุมัติที่ใช้ร่วมกันโดยช่องแชทอื่นด้วย adapter แบบ native ของ Discord เพิ่มการกำหนดเส้นทาง DM ไปยังผู้อนุมัติและการกระจายไปยังช่องทางเป็นหลัก
    เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก; OpenClaw
    ควรใส่คำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่า
    การอนุมัติผ่านแชทไม่พร้อมใช้งาน หรือการอนุมัติแบบ manual เป็นเส้นทางเดียว
    หากรันไทม์การอนุมัติแบบ native ของ Discord ไม่ active OpenClaw จะยังคงแสดง
    พรอมป์ `/approve <id> <decision>` แบบ deterministic ใน local ไว้ หาก
    รันไทม์ active แต่ไม่สามารถส่งการ์ด native ไปยังเป้าหมายใดได้
    OpenClaw จะส่งประกาศ fallback ในแชทเดียวกันพร้อมคำสั่ง `/approve`
    ที่ตรงกันจากการอนุมัติที่ค้างอยู่

    การตรวจสอบสิทธิ์ Gateway และการ resolve การอนุมัติเป็นไปตามสัญญาไคลเอนต์ Gateway ที่ใช้ร่วมกัน (ID `plugin:` resolve ผ่าน `plugin.approval.resolve`; ID อื่นผ่าน `exec.approval.resolve`) การอนุมัติจะหมดอายุหลังจาก 30 นาทีโดยค่าเริ่มต้น

    ดู [การอนุมัติ Exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและ action gates

การกระทำกับข้อความ Discord รวมถึงการส่งข้อความ การดูแลช่องทาง การกลั่นกรอง สถานะ และการกระทำกับ metadata

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reactions: `react`, `reactions`, `emojiList`
- การกลั่นกรอง: `timeout`, `kick`, `ban`
- สถานะ: `setPresence`

การกระทำ `event-create` รับพารามิเตอร์ `image` ที่ไม่บังคับ (URL หรือเส้นทางไฟล์ local) เพื่อตั้งค่าภาพหน้าปกของกิจกรรมที่กำหนดเวลาไว้

Action gates อยู่ภายใต้ `channels.discord.actions.*`

พฤติกรรม gate เริ่มต้น:

| กลุ่มการกระทำ                                                                                                                                                             | ค่าเริ่มต้น  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled  |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## UI Components v2

OpenClaw ใช้ Discord components v2 สำหรับการอนุมัติ exec และเครื่องหมายข้าม context การกระทำกับข้อความ Discord สามารถรับ `components` สำหรับ UI แบบกำหนดเองได้เช่นกัน (ขั้นสูง; ต้องสร้าง component payload ผ่านเครื่องมือ discord) ขณะที่ `embeds` แบบเดิมยังพร้อมใช้งานแต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` ตั้งค่าสี accent ที่ใช้โดยคอนเทนเนอร์ component ของ Discord (hex)
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

Discord มี surface เสียงที่แตกต่างกันสองแบบ: **ช่องเสียง** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบพรีวิว waveform) Gateway รองรับทั้งสองแบบ

### ช่องเสียง

เช็กลิสต์การตั้งค่า:

1. เปิดใช้งาน Message Content Intent ใน Discord Developer Portal
2. เปิดใช้งาน Server Members Intent เมื่อใช้ allowlist สำหรับ role/user
3. เชิญบอตด้วย scope `bot` และ `applications.commands`
4. ให้สิทธิ์ Connect, Speak, Send Messages และ Read Message History ในช่องเสียงเป้าหมาย
5. เปิดใช้งานคำสั่ง native (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุม session คำสั่งนี้ใช้ agent เริ่มต้นของบัญชีและปฏิบัติตามกฎ allowlist และนโยบายกลุ่มเดียวกับคำสั่ง Discord อื่น

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

หากต้องการตรวจสอบสิทธิ์ effective ของบอตก่อนเข้าร่วม ให้รัน:

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

- `voice.tts` จะแทนที่ `messages.tts` เฉพาะสำหรับการเล่นเสียง
- `voice.model` จะแทนที่ LLM ที่ใช้สำหรับคำตอบในช่องเสียง Discord เท่านั้น เว้นว่างไว้เพื่อสืบทอดโมเดล agent ที่ถูกกำหนดเส้นทาง
- STT ใช้ `tools.media.audio`; `voice.model` ไม่มีผลต่อการถอดเสียง
- การแทนที่ `systemPrompt` ต่อช่องทางของ Discord จะมีผลกับ turn ของ transcript เสียงสำหรับช่องเสียงนั้น
- turn ของ transcript เสียงจะหา status เจ้าของจาก `allowFrom` (หรือ `dm.allowFrom`) ของ Discord; ผู้พูดที่ไม่ใช่เจ้าของไม่สามารถเข้าถึงเครื่องมือเฉพาะเจ้าของได้ (ตัวอย่างเช่น `gateway` และ `cron`)
- เสียง Discord เป็นแบบ opt-in สำหรับ config แบบข้อความเท่านั้น; ตั้งค่า `channels.discord.voice.enabled=true` (หรือคงบล็อก `channels.discord.voice` ที่มีอยู่) เพื่อเปิดใช้งานคำสั่ง `/vc`, รันไทม์เสียง และ Gateway intent `GuildVoiceStates`
- `channels.discord.intents.voiceStates` สามารถแทนที่การสมัครรับ voice-state intent ได้อย่างชัดเจน เว้นว่างไว้เพื่อให้ intent ตามการเปิดใช้งานเสียง effective
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือก join ของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- `voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายาม auto-join ค่าเริ่มต้น: `30000`
- `voice.reconnectGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอให้ session เสียงที่ disconnected เริ่ม reconnect ก่อนทำลาย session นั้น ค่าเริ่มต้น: `15000`
- การเล่นเสียงจะไม่หยุดเพียงเพราะผู้ใช้อื่นเริ่มพูด เพื่อหลีกเลี่ยง feedback loop OpenClaw จะละเว้นการ capture เสียงใหม่ขณะ TTS กำลังเล่น; ให้พูดหลังจากการเล่นจบเพื่อเข้าสู่ turn ถัดไป
- `voice.captureSilenceGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอหลังจาก Discord รายงานว่าผู้พูดหยุดแล้ว ก่อน finalize segment เสียงนั้นสำหรับ STT ค่าเริ่มต้น: `2500`; เพิ่มค่านี้หาก Discord แยกการหยุดพูดตามปกติออกเป็น transcript บางส่วนที่ขาดช่วง
- เมื่อ ElevenLabs เป็นผู้ให้บริการ TTS ที่เลือก การเล่นเสียง Discord จะใช้ TTS แบบ streaming และเริ่มจาก response stream ของผู้ให้บริการ ผู้ให้บริการที่ไม่รองรับ streaming จะ fallback ไปยังเส้นทาง temp-file ที่สังเคราะห์แล้ว
- OpenClaw ยังเฝ้าดูความล้มเหลวในการ decrypt ฝั่งรับและกู้คืนอัตโนมัติด้วยการออกจาก/เข้าร่วมช่องเสียงใหม่หลังเกิดความล้มเหลวซ้ำในช่วงเวลาสั้น
- หาก log ฝั่งรับแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำหลังอัปเดต ให้รวบรวมรายงาน dependency และ log บรรทัด `@discordjs/voice` ที่ bundle มารวม upstream padding fix จาก discord.js PR #11449 ซึ่งปิด discord.js issue #11419
- event รับ `The operation was aborted` เป็นสิ่งที่คาดไว้เมื่อ OpenClaw finalize segment ของผู้พูดที่ capture ไว้; เป็น diagnostics แบบ verbose ไม่ใช่ warnings

pipeline ช่องเสียง:

- การ capture PCM ของ Discord จะถูกแปลงเป็นไฟล์ temp WAV
- `tools.media.audio` จัดการ STT ตัวอย่างเช่น `openai/gpt-4o-mini-transcribe`
- transcript จะถูกส่งผ่าน ingress และ routing ของ Discord ขณะที่ response LLM รันด้วยนโยบาย voice-output ที่ซ่อนเครื่องมือ `tts` ของ agent และขอข้อความที่ส่งกลับ เพราะเสียง Discord เป็นเจ้าของการเล่น TTS สุดท้าย
- `voice.model` เมื่อกำหนดไว้ จะแทนที่เฉพาะ response LLM สำหรับ turn ช่องเสียงนี้
- `voice.tts` จะถูก merge ทับ `messages.tts`; ผู้ให้บริการที่รองรับ streaming จะป้อน player โดยตรง มิฉะนั้นไฟล์เสียงที่ได้จะถูกเล่นในช่องทางที่เข้าร่วมอยู่

Credentials จะถูก resolve ต่อ component: auth เส้นทาง LLM สำหรับ `voice.model`, auth STT สำหรับ `tools.media.audio` และ auth TTS สำหรับ `messages.tts`/`voice.tts`

### ข้อความเสียง

ข้อความเสียง Discord แสดงพรีวิว waveform และต้องใช้ออดิโอ OGG/Opus OpenClaw สร้าง waveform โดยอัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ Gateway เพื่อตรวจสอบและแปลง

- ระบุ **เส้นทางไฟล์ local** (URL จะถูกปฏิเสธ)
- ละเว้นเนื้อหาข้อความ (Discord ปฏิเสธข้อความ + ข้อความเสียงใน payload เดียวกัน)
- ยอมรับรูปแบบออดิโอใดก็ได้; OpenClaw จะแปลงเป็น OGG/Opus ตามต้องการ

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ใช้ intents ที่ไม่อนุญาต หรือบอตไม่เห็นข้อความ guild">

    - เปิดใช้งาน Message Content Intent
    - เปิดใช้งาน Server Members Intent เมื่อคุณพึ่งพาการ resolve user/member
    - restart gateway หลังจากเปลี่ยน intents

  </Accordion>

  <Accordion title="ข้อความ guild ถูกบล็อกโดยไม่คาดคิด">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบ allowlist ของ guild ภายใต้ `channels.discord.guilds`
    - หากมี map `channels` ของ guild จะอนุญาตเฉพาะช่องทางที่ระบุไว้เท่านั้น
    - ตรวจสอบพฤติกรรม `requireMention` และรูปแบบการ mention

    การตรวจสอบที่มีประโยชน์:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false แต่ยังถูกบล็อก">
    สาเหตุที่พบบ่อย:

    - `groupPolicy="allowlist"` โดยไม่มี guild/channel allowlist ที่ตรงกัน
    - กำหนดค่า `requireMention` ผิดตำแหน่ง (ต้องอยู่ใต้ `channels.discord.guilds` หรือรายการ channel)
    - ผู้ส่งถูกบล็อกโดย guild/channel `users` allowlist

  </Accordion>

  <Accordion title="รอบการทำงาน Discord ที่ใช้เวลานานหรือการตอบซ้ำ">

    บันทึกทั่วไป:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    ค่าปรับแต่งคิว Discord Gateway:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ค่านี้ควบคุมเฉพาะงาน listener ของ Discord Gateway เท่านั้น ไม่ใช่อายุของรอบการทำงาน agent

    Discord ไม่ใช้ timeout ที่ channel เป็นเจ้าของกับรอบการทำงาน agent ที่อยู่ในคิว Message listeners จะส่งต่องานทันที และงาน Discord ที่อยู่ในคิวจะรักษาลำดับต่อ session จนกว่า lifecycle ของ session/tool/runtime จะเสร็จสิ้นหรือยกเลิกงาน

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

  <Accordion title="คำเตือน timeout ในการค้นหา metadata ของ Gateway">
    OpenClaw ดึง metadata `/gateway/bot` ของ Discord ก่อนเชื่อมต่อ ความล้มเหลวชั่วคราวจะถอยกลับไปใช้ URL Gateway เริ่มต้นของ Discord และถูกจำกัดอัตราในบันทึก

    ค่าปรับแต่ง timeout ของ metadata:

    - บัญชีเดียว: `channels.discord.gatewayInfoTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env fallback เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - ค่าเริ่มต้น: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw รอเหตุการณ์ `READY` ของ Gateway Discord ระหว่างการเริ่มต้นและหลังจาก runtime reconnects การตั้งค่าหลายบัญชีที่มีการหน่วงเวลาเริ่มต้นแบบ staggered อาจต้องใช้ช่วงเวลา startup READY ที่ยาวกว่าค่าเริ่มต้น

    ค่าปรับแต่ง READY timeout:

    - startup บัญชีเดียว: `channels.discord.gatewayReadyTimeoutMs`
    - startup หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - startup env fallback เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - startup ค่าเริ่มต้น: `15000` (15 วินาที), สูงสุด: `120000`
    - runtime บัญชีเดียว: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - runtime env fallback เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtime ค่าเริ่มต้น: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    การตรวจสอบสิทธิ์ของ `channels status --probe` ใช้ได้เฉพาะกับ ID channel แบบตัวเลขเท่านั้น

    หากคุณใช้ slug keys การจับคู่ runtime อาจยังทำงานได้ แต่ probe ไม่สามารถตรวจสอบสิทธิ์ได้อย่างครบถ้วน

  </Accordion>

  <Accordion title="ปัญหา DM และการจับคู่">

    - ปิดใช้งาน DM: `channels.discord.dm.enabled=false`
    - ปิดใช้งานนโยบาย DM: `channels.discord.dmPolicy="disabled"` (เดิม: `channels.discord.dm.policy`)
    - กำลังรอการอนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูปบอตต่อบอต">
    ตามค่าเริ่มต้น ข้อความที่เขียนโดยบอตจะถูกละเว้น

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎการ mention และ allowlist ที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมลูป
    ควรใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความจากบอตที่ mention บอตเท่านั้น

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

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - รักษา OpenClaw ให้เป็นเวอร์ชันปัจจุบัน (`openclaw update`) เพื่อให้มี logic การกู้คืนการรับเสียง Discord
    - ยืนยัน `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้น upstream) แล้วปรับแต่งเฉพาะเมื่อจำเป็น
    - ดูบันทึกสำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากความล้มเหลวยังคงเกิดขึ้นหลังจาก rejoin อัตโนมัติ ให้เก็บบันทึกและเปรียบเทียบกับประวัติการรับ DAVE upstream ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## เอกสารอ้างอิงการกำหนดค่า

เอกสารอ้างอิงหลัก: [เอกสารอ้างอิงการกำหนดค่า - Discord](/th/gateway/config-channels#discord).

<Accordion title="ฟิลด์ Discord ที่ให้สัญญาณสำคัญ">

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- command: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout` (งบประมาณ listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- reply/history: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias เดิม: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb` (จำกัดการอัปโหลด Discord ขาออก ค่าเริ่มต้น `100MB`), `retry`
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- features: `threadBindings`, `bindings[]` ระดับบนสุด (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการปฏิบัติการ

- ปฏิบัติต่อ token ของบอตเป็นความลับ (แนะนำให้ใช้ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการกำกับดูแล)
- ให้สิทธิ์ Discord ตามหลักสิทธิ์น้อยที่สุด
- หาก command deploy/state ล้าสมัย ให้รีสตาร์ท Gateway และตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Discord กับ Gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรม group chat และ allowlist
  </Card>
  <Card title="การกำหนดเส้นทาง channel" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยัง agents
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    Threat model และการเสริมความแข็งแกร่ง
  </Card>
  <Card title="การกำหนดเส้นทาง multi-agent" icon="sitemap" href="/th/concepts/multi-agent">
    แมป guilds และ channels ไปยัง agents
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรม command แบบเนทีฟ
  </Card>
</CardGroup>
