---
read_when:
    - การทำงานกับฟีเจอร์ช่องทาง Discord
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าบอต Discord
title: Discord
x-i18n:
    generated_at: "2026-06-27T17:09:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90ed02258347113ca5b1dfcc5169a48190e3b4e1273d27a8a5c45f0f930cdbbf
    source_path: channels/discord.md
    workflow: 16
---

พร้อมสำหรับ DM และช่องกิลด์ผ่าน Discord Gateway อย่างเป็นทางการ

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    DM ของ Discord จะใช้โหมดจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยและขั้นตอนซ่อมแซมข้ามช่อง
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

คุณจะต้องสร้างแอปพลิเคชันใหม่พร้อมบอต เพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ และจับคู่บอตกับ OpenClaw เราแนะนำให้เพิ่มบอตของคุณไปยังเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากยังไม่มี [ให้สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="Create a Discord application and bot">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อประมาณว่า "OpenClaw"

    คลิก **Bot** บนแถบด้านข้าง ตั้งค่า **Username** เป็นชื่อที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="Enable privileged intents">
    ยังอยู่ในหน้า **Bot** ให้เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับรายการอนุญาตตามบทบาทและการจับคู่ชื่อกับ ID)
    - **Presence Intent** (ไม่บังคับ; จำเป็นเฉพาะสำหรับการอัปเดตสถานะ presence)

  </Step>

  <Step title="Copy your bot token">
    เลื่อนกลับขึ้นไปในหน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อจะเป็นเช่นนั้น แต่การดำเนินการนี้จะสร้างโทเค็นแรกของคุณ — ไม่ได้มีสิ่งใดถูก "รีเซ็ต"
    </Note>

    คัดลอกโทเค็นและบันทึกไว้ที่ใดที่หนึ่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในอีกไม่ช้า

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    คลิก **OAuth2** บนแถบด้านข้าง คุณจะสร้าง URL เชิญที่มีสิทธิ์ถูกต้องเพื่อเพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ

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

    นี่คือชุดพื้นฐานสำหรับช่องข้อความปกติ หากคุณวางแผนจะโพสต์ในเธรดของ Discord รวมถึงเวิร์กโฟลว์ช่องฟอรัมหรือช่องสื่อที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้ **Send Messages in Threads** ด้วย
    คัดลอก URL ที่สร้างขึ้นด้านล่าง วางในเบราว์เซอร์ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอตของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    กลับไปที่แอป Discord คุณต้องเปิดใช้ Developer Mode เพื่อให้คัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนเฟืองถัดจากอวาตาร์ของคุณ) → **Advanced** → เปิด **Developer Mode**
    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ไว้คู่กับ Bot Token ของคุณ — คุณจะส่งทั้งสามอย่างให้ OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="Allow DMs from server members">
    เพื่อให้การจับคู่ทำงานได้ Discord ต้องอนุญาตให้บอตของคุณ DM ถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณ → **Privacy Settings** → เปิด **Direct Messages**

    วิธีนี้อนุญาตให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอต) ส่ง DM ถึงคุณได้ เปิดค่านี้ไว้หากคุณต้องการใช้ DM ของ Discord กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่องกิลด์ คุณสามารถปิด DM หลังจากจับคู่แล้วได้

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    โทเค็นบอต Discord ของคุณเป็นความลับ (เหมือนรหัสผ่าน) ตั้งค่าโทเค็นนี้บนเครื่องที่รัน OpenClaw ก่อนส่งข้อความถึงเอเจนต์ของคุณ

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

    หาก OpenClaw กำลังรันเป็นบริการเบื้องหลังอยู่แล้ว ให้รีสตาร์ทผ่านแอป OpenClaw Mac หรือหยุดแล้วเริ่มกระบวนการ `openclaw gateway run` ใหม่
    สำหรับการติดตั้งแบบบริการที่จัดการให้ ให้รัน `openclaw gateway install` จากเชลล์ที่มี `DISCORD_BOT_TOKEN` อยู่ หรือเก็บตัวแปรไว้ใน `~/.openclaw/.env` เพื่อให้บริการ resolve env SecretRef ได้หลังรีสตาร์ท
    หากโฮสต์ของคุณถูกบล็อกหรือถูกจำกัดอัตราโดยการค้นหาแอปพลิเคชันตอนเริ่มต้นของ Discord ให้ตั้งค่า ID แอปพลิเคชัน/ไคลเอนต์ Discord จาก Developer Portal เพื่อให้การเริ่มต้นข้ามการเรียก REST นั้นได้ ใช้ `channels.discord.applicationId` สำหรับบัญชีเริ่มต้น หรือ `channels.discord.accounts.<accountId>.applicationId` เมื่อคุณรันบอต Discord หลายตัว

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        แชตกับเอเจนต์ OpenClaw ของคุณในช่องที่มีอยู่แล้วช่องใดก็ได้ (เช่น Telegram) แล้วบอกเอเจนต์ หาก Discord เป็นช่องแรกของคุณ ให้ใช้แท็บ CLI / config แทน

        > "ฉันตั้งค่าโทเค็นบอต Discord ใน config แล้ว โปรดตั้งค่า Discord ให้เสร็จด้วย User ID `<user_id>` และ Server ID `<server_id>`"
      </Tab>
      <Tab title="CLI / config">
        หากคุณต้องการใช้ config แบบไฟล์ ให้ตั้งค่า:

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

        สำหรับการตั้งค่าแบบสคริปต์หรือระยะไกล ให้เขียนบล็อก JSON5 เดียวกันด้วย `openclaw config patch --file ./discord.patch.json5 --dry-run` แล้วรันซ้ำโดยไม่มี `--dry-run` รองรับค่า `token` แบบข้อความธรรมดา และรองรับค่า SecretRef สำหรับ `channels.discord.token` ใน provider แบบ env/file/exec ด้วย ดู [การจัดการความลับ](/th/gateway/secrets)

        สำหรับบอต Discord หลายตัว ให้เก็บโทเค็นบอตและ application ID แต่ละรายการไว้ใต้บัญชีของตัวเอง `channels.discord.applicationId` ระดับบนจะถูกสืบทอดโดยบัญชีต่าง ๆ ดังนั้นให้ตั้งค่าที่นั่นเฉพาะเมื่อทุกบัญชีควรใช้ application ID เดียวกัน

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

  <Step title="Approve first DM pairing">
    รอจนกว่า Gateway จะรันอยู่ จากนั้น DM ถึงบอตของคุณใน Discord บอตจะตอบกลับด้วยรหัสจับคู่

    <Tabs>
      <Tab title="Ask your agent">
        ส่งรหัสจับคู่ให้เอเจนต์ของคุณในช่องที่มีอยู่:

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
การ resolve โทเค็นรับรู้ตามบัญชี ค่าโทเค็นใน config มีลำดับความสำคัญเหนือ env fallback `DISCORD_BOT_TOKEN` ใช้สำหรับบัญชีเริ่มต้นเท่านั้น
หากบัญชี Discord ที่เปิดใช้สองบัญชี resolve ไปยังโทเค็นบอตเดียวกัน OpenClaw จะเริ่ม Gateway monitor เพียงตัวเดียวสำหรับโทเค็นนั้น โทเค็นที่มาจาก config มีลำดับความสำคัญเหนือ env fallback เริ่มต้น มิฉะนั้นบัญชีที่เปิดใช้บัญชีแรกจะชนะ และบัญชีที่ซ้ำจะถูกรายงานว่าปิดใช้งาน
สำหรับการเรียกออกขั้นสูง (เครื่องมือข้อความ/การดำเนินการช่อง) จะใช้ `token` แบบระบุต่อการเรียกอย่างชัดเจนสำหรับการเรียกนั้น ข้อนี้ใช้กับการส่งและการดำเนินการแบบอ่าน/ตรวจสอบ (เช่น read/search/fetch/thread/pins/permissions) การตั้งค่า policy/retry ของบัญชียังคงมาจากบัญชีที่เลือกในสแนปช็อตรันไทม์ที่ใช้งานอยู่
</Note>

## แนะนำ: ตั้งค่าพื้นที่ทำงานกิลด์

เมื่อ DM ทำงานแล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็นพื้นที่ทำงานเต็มรูปแบบที่แต่ละช่องมีเซสชันเอเจนต์ของตัวเองพร้อมบริบทของตัวเอง วิธีนี้แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีแค่คุณและบอตของคุณ

<Steps>
  <Step title="Add your server to the guild allowlist">
    วิธีนี้ทำให้เอเจนต์ของคุณตอบกลับในช่องใดก็ได้บนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ DM

    <Tabs>
      <Tab title="Ask your agent">
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

  <Step title="Allow responses without @mention">
    โดยค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในช่องกิลด์เฉพาะเมื่อถูก @mention เท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณอาจต้องการให้เอเจนต์ตอบกลับทุกข้อความ

    ในช่องกิลด์ การตอบกลับปกติจะโพสต์โดยอัตโนมัติตามค่าเริ่มต้น สำหรับห้องที่เปิดตลอดเวลาและใช้ร่วมกัน ให้เลือกใช้ `messages.groupChat.visibleReplies: "message_tool"` เพื่อให้เอเจนต์เฝ้าดูเงียบ ๆ และโพสต์เฉพาะเมื่อมันตัดสินใจว่าการตอบกลับในช่องมีประโยชน์ วิธีนี้ทำงานได้ดีที่สุดกับโมเดลรุ่นล่าสุดที่ใช้เครื่องมือได้เชื่อถือได้ เช่น GPT 5.5 เหตุการณ์ห้องแบบแวดล้อมจะเงียบไว้จนกว่าเครื่องมือจะส่ง ดู [เหตุการณ์ห้องแบบแวดล้อม](/th/channels/ambient-room-events) สำหรับ config โหมดเฝ้าดูแบบเต็ม

    หาก Discord แสดงว่ากำลังพิมพ์และล็อกแสดงการใช้โทเค็นแต่ไม่มีข้อความถูกโพสต์ ให้ตรวจสอบว่า turn นั้นถูกกำหนดค่าเป็นเหตุการณ์ห้องแบบแวดล้อม หรือเลือกใช้การตอบกลับที่มองเห็นได้ผ่าน message-tool หรือไม่

    <Tabs>
      <Tab title="Ask your agent">
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

        หากต้องการบังคับให้การตอบกลับกลุ่ม/ช่องที่มองเห็นได้ต้องส่งผ่าน message-tool ให้ตั้งค่า `messages.groupChat.visibleReplies: "message_tool"`

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    โดยค่าเริ่มต้น หน่วยความจำระยะยาว (`MEMORY.md`) จะโหลดเฉพาะในเซสชัน DM ช่องกิลด์จะไม่โหลด MEMORY.md โดยอัตโนมัติ

    <Tabs>
      <Tab title="Ask your agent">
        > "เมื่อฉันถามคำถามในช่อง Discord ให้ใช้ memory_search หรือ memory_get หากคุณต้องการบริบทระยะยาวจาก MEMORY.md"
      </Tab>
      <Tab title="Manual">
        หากคุณต้องการบริบทร่วมในทุกช่อง ให้ใส่คำสั่งที่เสถียรไว้ใน `AGENTS.md` หรือ `USER.md` (ไฟล์เหล่านี้จะถูกฉีดเข้าไปในทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงเมื่อจำเป็นด้วยเครื่องมือ memory
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างช่องบางช่องบนเซิร์ฟเวอร์ Discord ของคุณและเริ่มแชต เอเจนต์ของคุณมองเห็นชื่อช่องได้ และแต่ละช่องจะมีเซสชันที่แยกจากกันของตัวเอง — ดังนั้นคุณสามารถตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ได้ที่เหมาะกับเวิร์กโฟลว์ของคุณ

## โมเดลรันไทม์

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord
- การกำหนดเส้นทางคำตอบเป็นแบบกำหนดแน่นอน: คำตอบขาเข้าจาก Discord จะตอบกลับไปยัง Discord
- เมทาดาทาของกิลด์/ช่อง Discord จะถูกเพิ่มลงในพรอมป์ของโมเดลเป็นบริบทที่ไม่น่าเชื่อถือ
  ไม่ใช่คำนำหน้าคำตอบที่ผู้ใช้มองเห็น หากโมเดลคัดลอกซองข้อมูลนั้น
  กลับมา OpenClaw จะตัดเมทาดาทาที่ถูกคัดลอกออกจากคำตอบขาออกและจาก
  บริบทสำหรับเล่นซ้ำในอนาคต
- โดยค่าเริ่มต้น (`session.dmScope=main`) แชตโดยตรงจะแชร์เซสชันหลักของเอเจนต์ (`agent:main:main`)
- ช่องกิลด์เป็นคีย์เซสชันที่แยกจากกัน (`agent:<agentId>:discord:channel:<channelId>`)
- Group DM จะถูกละเว้นโดยค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่งสแลชแบบเนทีฟทำงานในเซสชันคำสั่งที่แยกกัน (`agent:<agentId>:discord:slash:<userId>`) ขณะยังคงพก `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่ถูกกำหนดเส้นทาง
- การส่งประกาศ Cron/Heartbeat แบบข้อความเท่านั้นไปยัง Discord จะใช้คำตอบสุดท้าย
  ที่ผู้ช่วยมองเห็นได้เพียงครั้งเดียว เพย์โหลดสื่อและคอมโพเนนต์แบบมีโครงสร้างยังคง
  เป็นหลายข้อความเมื่อเอเจนต์ปล่อยเพย์โหลดที่ส่งได้หลายรายการ

## ช่องฟอรัม

ช่องฟอรัมและช่องสื่อของ Discord รับเฉพาะโพสต์ในเธรดเท่านั้น OpenClaw รองรับสองวิธีในการสร้าง:

- ส่งข้อความไปยังพาเรนต์ของฟอรัม (`channel:<forumId>`) เพื่อสร้างเธรดโดยอัตโนมัติ ชื่อเธรดจะใช้บรรทัดแรกที่ไม่ว่างของข้อความของคุณ
- ใช้ `openclaw message thread create` เพื่อสร้างเธรดโดยตรง อย่าส่ง `--message-id` สำหรับช่องฟอรัม

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

พาเรนต์ของฟอรัมไม่รับคอมโพเนนต์ Discord หากคุณต้องการคอมโพเนนต์ ให้ส่งไปยังเธรดเอง (`channel:<threadId>`)

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับคอนเทนเนอร์คอมโพเนนต์ Discord v2 สำหรับข้อความเอเจนต์ ใช้เครื่องมือข้อความพร้อมเพย์โหลด `components` ผลลัพธ์จากการโต้ตอบจะถูกกำหนดเส้นทางกลับไปยังเอเจนต์เป็นข้อความขาเข้าปกติ และทำตามการตั้งค่า Discord `replyToMode` ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถวการกระทำอนุญาตให้มีปุ่มได้สูงสุด 5 ปุ่มหรือเมนูเลือกหนึ่งรายการ
- ประเภทการเลือก: `string`, `user`, `role`, `mentionable`, `channel`

โดยค่าเริ่มต้น คอมโพเนนต์ใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่ออนุญาตให้ใช้ปุ่ม ตัวเลือก และฟอร์มได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดว่าใครคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (ID ผู้ใช้ Discord, แท็ก หรือ `*`) เมื่อกำหนดค่าแล้ว ผู้ใช้ที่ไม่ตรงกันจะได้รับข้อความปฏิเสธแบบชั่วคราว

คอลแบ็กคอมโพเนนต์หมดอายุหลัง 30 นาทีโดยค่าเริ่มต้น ตั้งค่า `channels.discord.agentComponents.ttlMs` เพื่อเปลี่ยนอายุรีจิสทรีคอลแบ็กนั้นสำหรับบัญชี Discord เริ่มต้น หรือ `channels.discord.accounts.<accountId>.agentComponents.ttlMs` เพื่อเขียนทับบัญชีหนึ่งในชุดหลายบัญชี ค่ามีหน่วยเป็นมิลลิวินาที ต้องเป็นจำนวนเต็มบวก และถูกจำกัดไว้ที่ `86400000` (24 ชั่วโมง) TTL ที่ยาวขึ้นมีประโยชน์สำหรับเวิร์กโฟลว์ตรวจทานหรืออนุมัติที่ต้องให้ปุ่มยังใช้งานได้ แต่ยังขยายช่วงเวลาที่ข้อความ Discord เก่ายังสามารถทริกเกอร์การกระทำได้ด้วย ควรใช้ TTL ที่สั้นที่สุดที่เหมาะกับเวิร์กโฟลว์ และคงค่าเริ่มต้นไว้เมื่อคอลแบ็กที่ค้างเก่าจะทำให้เกิดความประหลาดใจ

คำสั่งสแลช `/model` และ `/models` เปิดตัวเลือกโมเดลแบบโต้ตอบที่มีดรอปดาวน์ผู้ให้บริการ โมเดล และรันไทม์ที่เข้ากันได้ รวมถึงขั้นตอนส่ง `/models add` เลิกใช้แล้วและตอนนี้จะส่งคืนข้อความเลิกใช้แทนการลงทะเบียนโมเดลจากแชต คำตอบของตัวเลือกเป็นแบบชั่วคราวและเฉพาะผู้ใช้ที่เรียกใช้เท่านั้นที่ใช้ได้ เมนูเลือกของ Discord จำกัดไว้ที่ 25 ตัวเลือก ดังนั้นให้เพิ่มรายการ `provider/*` ลงใน `agents.defaults.models` เมื่อคุณต้องการให้ตัวเลือกแสดงโมเดลที่ค้นพบแบบไดนามิกเฉพาะสำหรับผู้ให้บริการที่เลือก เช่น `openai` หรือ `vllm`

ไฟล์แนบ:

- บล็อก `file` ต้องชี้ไปยังการอ้างอิงไฟล์แนบ (`attachment://<filename>`)
- ระบุไฟล์แนบผ่าน `media`/`path`/`filePath` (ไฟล์เดียว); ใช้ `media-gallery` สำหรับหลายไฟล์
- ใช้ `filename` เพื่อเขียนทับชื่ออัปโหลดเมื่อควรตรงกับการอ้างอิงไฟล์แนบ

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

    หากนโยบาย DM ไม่เปิด ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือถูกแจ้งให้จับคู่ในโหมด `pairing`)

    ลำดับความสำคัญแบบหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - สำหรับบัญชีหนึ่ง `allowFrom` มีลำดับความสำคัญเหนือ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตัวเองและ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    `channels.discord.dm.policy` และ `channels.discord.dm.allowFrom` แบบเดิมยังคงถูกอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การกล่าวถึง `<@id>`

    โดยปกติ ID ตัวเลขล้วนจะถูกแก้เป็น ID ช่องเมื่อมีค่าเริ่มต้นของช่องที่ใช้งานอยู่ แต่ ID ที่ระบุไว้ใน `allowFrom` ของ DM ที่มีผลของบัญชีจะถูกปฏิบัติเป็นเป้าหมาย DM ของผู้ใช้เพื่อความเข้ากันได้

  </Tab>

  <Tab title="Access groups">
    การอนุญาต DM ของ Discord และคำสั่งข้อความสามารถใช้รายการ `accessGroup:<name>` แบบไดนามิกใน `channels.discord.allowFrom`

    ชื่อกลุ่มการเข้าถึงถูกใช้ร่วมกันข้ามช่องข้อความ ใช้ `type: "message.senders"` สำหรับกลุ่มแบบคงที่ที่สมาชิกแสดงด้วยไวยากรณ์ `allowFrom` ปกติของแต่ละช่อง หรือ `type: "discord.channelAudience"` เมื่อผู้ชม `ViewChannel` ปัจจุบันของช่อง Discord ควรกำหนดสมาชิกแบบไดนามิก พฤติกรรมกลุ่มการเข้าถึงร่วมมีเอกสารไว้ที่นี่: [กลุ่มการเข้าถึง](/th/channels/access-groups)

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

    ช่องข้อความ Discord ไม่มีรายชื่อสมาชิกแยกต่างหาก `type: "discord.channelAudience"` จำลองสมาชิกเป็น: ผู้ส่ง DM เป็นสมาชิกของกิลด์ที่กำหนดค่าไว้ และปัจจุบันมีสิทธิ์ `ViewChannel` ที่มีผลบนช่องที่กำหนดค่าไว้หลังจากนำบทบาทและการเขียนทับช่องมาใช้แล้ว

    ตัวอย่าง: อนุญาตให้ทุกคนที่เห็น `#maintainers` สามารถ DM บอตได้ ขณะยังคงปิด DM สำหรับคนอื่นทั้งหมด

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

    เปิดใช้งาน **Server Members Intent** ใน Discord Developer Portal สำหรับบอตเมื่อใช้กลุ่มการเข้าถึงแบบผู้ชมช่อง DM ไม่มีสถานะสมาชิกกิลด์ ดังนั้น OpenClaw จะแก้สมาชิกผ่าน Discord REST ณ เวลาการอนุญาต

  </Tab>

  <Tab title="Guild policy">
    การจัดการกิลด์ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    ฐานความปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    พฤติกรรม `allowlist`:

    - กิลด์ต้องตรงกับ `channels.discord.guilds` (แนะนำให้ใช้ `id`, รองรับ slug)
    - รายการอนุญาตผู้ส่งแบบไม่บังคับ: `users` (แนะนำ ID ที่เสถียร) และ `roles` (เฉพาะ ID บทบาท); หากมีการกำหนดค่าอย่างใดอย่างหนึ่ง ผู้ส่งจะได้รับอนุญาตเมื่อผู้ส่งตรงกับ `users` หรือ `roles`
    - การจับคู่ชื่อ/แท็กโดยตรงถูกปิดใช้งานโดยค่าเริ่มต้น; เปิด `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเป็นโหมดความเข้ากันได้ยามจำเป็นเท่านั้น
    - รองรับชื่อ/แท็กสำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อใช้รายการชื่อ/แท็ก
    - หากกิลด์มีการกำหนดค่า `channels` ช่องที่ไม่ได้อยู่ในรายการจะถูกปฏิเสธ
    - หากกิลด์ไม่มีบล็อก `channels` ช่องทั้งหมดในกิลด์ที่อยู่ในรายการอนุญาตนั้นจะได้รับอนุญาต

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

    หากคุณตั้งค่าเฉพาะ `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` ฟอลแบ็กรันไทม์คือ `groupPolicy="allowlist"` (พร้อมคำเตือนในบันทึก) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`

  </Tab>

  <Tab title="Mentions and group DMs">
    ข้อความกิลด์ถูกกั้นด้วยการกล่าวถึงโดยค่าเริ่มต้น

    การตรวจจับการกล่าวถึงประกอบด้วย:

    - การกล่าวถึงบอตอย่างชัดเจน
    - รูปแบบการกล่าวถึงที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, ฟอลแบ็ก `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับไปยังบอตโดยนัยในกรณีที่รองรับ

    เมื่อเขียนข้อความ Discord ขาออก ให้ใช้ไวยากรณ์การกล่าวถึงแบบมาตรฐาน: `<@USER_ID>` สำหรับผู้ใช้, `<#CHANNEL_ID>` สำหรับช่อง และ `<@&ROLE_ID>` สำหรับบทบาท อย่าใช้รูปแบบการกล่าวถึงชื่อเล่นแบบเดิม `<@!USER_ID>`

    `requireMention` ถูกกำหนดค่าต่อกิลด์/ช่อง (`channels.discord.guilds...`)
    `ignoreOtherMentions` สามารถเลือกให้ทิ้งข้อความที่กล่าวถึงผู้ใช้/บทบาทอื่นแต่ไม่ได้กล่าวถึงบอต (ยกเว้น @everyone/@here)

    Group DM:

    - ค่าเริ่มต้น: ถูกละเว้น (`dm.groupEnabled=false`)
    - รายการอนุญาตแบบไม่บังคับผ่าน `dm.groupChannels` (ID ช่องหรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตามบทบาท

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิกกิลด์ Discord ไปยังเอเจนต์ต่าง ๆ ตาม ID ของบทบาท การผูกตามบทบาทรับเฉพาะ ID ของบทบาทเท่านั้น และจะถูกประเมินหลังการผูกแบบเพียร์หรือเพียร์หลัก และก่อนการผูกแบบเฉพาะกิลด์ หากการผูกหนึ่งตั้งค่าฟิลด์การจับคู่อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ฟิลด์ทั้งหมดที่กำหนดค่าต้องตรงกัน

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
- การแทนที่รายช่อง: `channels.discord.commands.native`
- `commands.native=false` จะข้ามการลงทะเบียนและการล้างคำสั่งสแลชของ Discord ระหว่างเริ่มต้น คำสั่งที่เคยลงทะเบียนไว้อาจยังแสดงอยู่ใน Discord จนกว่าคุณจะลบออกจากแอป Discord
- การยืนยันสิทธิ์คำสั่งเนทีฟใช้รายการอนุญาต/นโยบายของ Discord ชุดเดียวกับการจัดการข้อความปกติ
- คำสั่งอาจยังแสดงใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต แต่การดำเนินการยังคงบังคับใช้การยืนยันสิทธิ์ของ OpenClaw และส่งคืน "ไม่ได้รับอนุญาต"

ดู [คำสั่งสแลช](/th/tools/slash-commands) สำหรับแคตตาล็อกคำสั่งและพฤติกรรม

การตั้งค่าคำสั่งสแลชเริ่มต้น:

- `ephemeral: true`

## รายละเอียดฟีเจอร์

<AccordionGroup>
  <Accordion title="แท็กตอบกลับและการตอบกลับเนทีฟ">
    Discord รองรับแท็กตอบกลับในเอาต์พุตของเอเจนต์:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    ควบคุมโดย `channels.discord.replyToMode`:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`
    - `batched`

    หมายเหตุ: `off` ปิดการทำเธรดตอบกลับแบบแฝง แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงถูกใช้งาน
    `first` จะแนบการอ้างอิงการตอบกลับเนทีฟแบบแฝงกับข้อความ Discord ขาออกแรกของเทิร์นนั้นเสมอ
    `batched` จะแนบการอ้างอิงการตอบกลับเนทีฟแบบแฝงของ Discord เฉพาะเมื่อ
    เหตุการณ์ขาเข้าเป็นชุดข้อความหลายข้อความที่ถูกหน่วงรวมกัน ซึ่งมีประโยชน์
    เมื่อคุณต้องการการตอบกลับเนทีฟเป็นหลักสำหรับแชตที่มาถี่และกำกวม ไม่ใช่ทุก
    เทิร์นที่มีข้อความเดียว

    ID ข้อความจะแสดงในบริบท/ประวัติ เพื่อให้เอเจนต์สามารถระบุข้อความเป้าหมายได้

  </Accordion>

  <Accordion title="ตัวอย่างลิงก์">
    Discord สร้าง rich link embeds สำหรับ URL ตามค่าเริ่มต้น OpenClaw จะระงับ embed ที่สร้างขึ้นเหล่านั้นในข้อความ Discord ขาออกตามค่าเริ่มต้น ดังนั้น URL ที่เอเจนต์ส่งจะยังเป็นลิงก์ธรรมดา เว้นแต่คุณเลือกเปิดใช้:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    ตั้งค่า `channels.discord.accounts.<id>.suppressEmbeds` เพื่อแทนที่สำหรับบัญชีเดียว การส่งด้วยเครื่องมือข้อความของเอเจนต์ยังสามารถส่ง `suppressEmbeds: false` สำหรับข้อความเดียวได้ เพย์โหลด `embeds` ของ Discord แบบชัดเจนจะไม่ถูกระงับโดยการตั้งค่าตัวอย่างลิงก์เริ่มต้น

  </Accordion>

  <Accordion title="ตัวอย่างสตรีมสด">
    OpenClaw สามารถสตรีมฉบับร่างของคำตอบโดยส่งข้อความชั่วคราวและแก้ไขเมื่อมีข้อความเข้ามา `channels.discord.streaming` รับค่า `off` | `partial` | `block` | `progress` (ค่าเริ่มต้น) `progress` จะเก็บฉบับร่างสถานะที่แก้ไขได้หนึ่งรายการ และอัปเดตด้วยความคืบหน้าของเครื่องมือจนกว่าจะส่งขั้นสุดท้าย ป้ายเริ่มต้นที่ใช้ร่วมกันเป็นบรรทัดแบบเลื่อนต่อเนื่อง ดังนั้นเมื่อมีงานมากพอ บรรทัดนั้นจะเลื่อนหายไปเหมือนส่วนอื่น `streamMode` เป็นนามแฝงรันไทม์เดิม เรียกใช้ `openclaw doctor --fix` เพื่อเขียนค่าคอนฟิกที่คงอยู่ใหม่เป็นคีย์มาตรฐาน

    ตั้งค่า `channels.discord.streaming.mode` เป็น `off` เพื่อปิดการแก้ไขตัวอย่าง Discord หากเปิดใช้การสตรีมแบบบล็อกของ Discord อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `partial` แก้ไขข้อความตัวอย่างเดียวเมื่อโทเค็นมาถึง
    - `block` ส่งชิ้นส่วนขนาดฉบับร่าง (ใช้ `draftChunk` เพื่อปรับขนาดและจุดแบ่ง โดยจำกัดไม่เกิน `textChunkLimit`)
    - สื่อ ข้อผิดพลาด และผลลัพธ์สุดท้ายแบบตอบกลับชัดเจนจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความตัวอย่างซ้ำหรือไม่
    - แถวเครื่องมือ/ความคืบหน้าจะแสดงเป็นอีโมจิ + ชื่อ + รายละเอียดแบบกะทัดรัดเมื่อมี เช่น `🛠️ Bash: run tests` หรือ `🔎 Web Search: for "query"`
    - `streaming.progress.commentary` (ค่าเริ่มต้น `false`) เลือกเปิดข้อความคำบรรยาย/คำนำของผู้ช่วยในฉบับร่างความคืบหน้าชั่วคราว คำบรรยายจะถูกล้างก่อนแสดงผล ยังคงเป็นข้อมูลชั่วคราว และไม่เปลี่ยนการส่งคำตอบสุดท้าย
    - `streaming.progress.maxLineChars` ควบคุมงบตัวอย่างความคืบหน้าต่อบรรทัด ข้อความร้อยแก้วจะถูกย่อที่ขอบเขตคำ ส่วนรายละเอียดคำสั่งและเส้นทางจะเก็บส่วนท้ายที่เป็นประโยชน์ไว้
    - `streaming.preview.commandText` / `streaming.progress.commandText` ควบคุมรายละเอียดคำสั่ง/การรันในบรรทัดความคืบหน้าแบบกะทัดรัด: `raw` (ค่าเริ่มต้น) หรือ `status` (เฉพาะป้ายเครื่องมือ)

    ซ่อนข้อความคำสั่ง/การรันดิบ ขณะที่ยังคงบรรทัดความคืบหน้าแบบกะทัดรัด:

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

    การสตรีมตัวอย่างเป็นข้อความเท่านั้น การตอบกลับแบบสื่อจะย้อนกลับไปใช้การส่งปกติ เมื่อเปิดใช้การสตรีมแบบ `block` อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

  </Accordion>

  <Accordion title="ประวัติ บริบท และพฤติกรรมเธรด">
    บริบทประวัติกิลด์:

    - ค่าเริ่มต้นของ `channels.discord.historyLimit` คือ `20`
    - สำรอง: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    การควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมเธรด:

    - เธรด Discord จะถูกกำหนดเส้นทางเป็นเซสชันช่อง และสืบทอดค่าคอนฟิกช่องหลัก เว้นแต่มีการแทนที่
    - เซสชันเธรดสืบทอดการเลือก `/model` ระดับเซสชันของช่องหลักเป็นทางเลือกสำรองเฉพาะโมเดล การเลือก `/model` เฉพาะเธรดยังคงมีลำดับความสำคัญเหนือกว่า และประวัติทรานสคริปต์ของช่องหลักจะไม่ถูกคัดลอก เว้นแต่เปิดใช้การสืบทอดทรานสคริปต์
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) เลือกให้เธรดอัตโนมัติใหม่เริ่มต้นด้วยข้อมูลจากทรานสคริปต์หลัก การแทนที่รายบัญชีอยู่ใต้ `channels.discord.accounts.<id>.thread.inheritParent`
    - รีแอ็กชันของเครื่องมือข้อความสามารถแก้เป้าหมาย DM แบบ `user:<id>` ได้
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะถูกคงไว้ระหว่างการสำรองการเปิดใช้งานในขั้นตอบกลับ

    หัวข้อช่องจะถูกแทรกเป็นบริบทที่ **ไม่น่าเชื่อถือ** รายการอนุญาตควบคุมว่าใครสามารถเรียกเอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบครบถ้วน

  </Accordion>

  <Accordion title="เซสชันที่ผูกกับเธรดสำหรับเอเจนต์ย่อย">
    Discord สามารถผูกเธรดกับเป้าหมายเซสชัน เพื่อให้ข้อความถัดไปในเธรดนั้นยังคงถูกกำหนดเส้นทางไปยังเซสชันเดิม (รวมถึงเซสชันเอเจนต์ย่อย)

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/ใหม่กับเป้าหมายเอเจนต์ย่อย/เซสชัน
    - `/unfocus` ลบการผูกเธรดปัจจุบัน
    - `/agents` แสดงรันที่ใช้งานอยู่และสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการยกเลิกโฟกัสอัตโนมัติเมื่อไม่มีความเคลื่อนไหวสำหรับการผูกที่โฟกัสอยู่
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

    - `session.threadBindings.*` ตั้งค่าเริ่มต้นทั่วระบบ
    - `channels.discord.threadBindings.*` แทนที่พฤติกรรมของ Discord
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดอัตโนมัติสำหรับ `sessions_spawn({ thread: true })` และการสร้างเธรด ACP ค่าเริ่มต้น: `true`
    - `defaultSpawnContext` ควบคุมบริบทเอเจนต์ย่อยเนทีฟสำหรับการสร้างที่ผูกกับเธรด ค่าเริ่มต้น: `"fork"`
    - คีย์ `spawnSubagentSessions`/`spawnAcpSessions` ที่เลิกใช้แล้วจะถูกย้ายโดย `openclaw doctor --fix`
    - หากการผูกเธรดถูกปิดใช้งานสำหรับบัญชีหนึ่ง `/focus` และการดำเนินการผูกเธรดที่เกี่ยวข้องจะไม่พร้อมใช้งาน

    ดู [เอเจนต์ย่อย](/th/tools/subagents), [เอเจนต์ ACP](/th/tools/acp-agents) และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="การผูกช่อง ACP แบบคงอยู่">
    สำหรับพื้นที่ทำงาน ACP แบบ "เปิดตลอด" ที่เสถียร ให้กำหนดค่าการผูก ACP แบบมีชนิดที่ระดับบนสุดซึ่งกำหนดเป้าหมายไปยังการสนทนา Discord

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

    - `/acp spawn codex --bind here` ผูกช่องหรือเธรดปัจจุบันไว้ในตำแหน่งเดิม และเก็บข้อความในอนาคตไว้ในเซสชัน ACP เดียวกัน ข้อความเธรดจะสืบทอดการผูกของช่องหลัก
    - ในช่องหรือเธรดที่ถูกผูก `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP เดิมในตำแหน่งเดิม การผูกเธรดชั่วคราวสามารถแทนที่การแก้เป้าหมายได้ขณะทำงานอยู่
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดลูกผ่าน `--thread auto|here`

    ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมการผูก

  </Accordion>

  <Accordion title="การแจ้งเตือนรีแอ็กชัน">
    โหมดการแจ้งเตือนรีแอ็กชันรายกิลด์:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    เหตุการณ์รีแอ็กชันจะถูกแปลงเป็นเหตุการณ์ระบบและแนบกับเซสชัน Discord ที่ถูกกำหนดเส้นทาง

  </Accordion>

  <Accordion title="รีแอ็กชันรับทราบ">
    `ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการแก้ค่า:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - อีโมจิตัวตนของเอเจนต์เป็นค่าทางเลือกสำรอง (`agents.list[].identity.emoji` มิฉะนั้น "👀")

    หมายเหตุ:

    - Discord รับอีโมจิยูนิโค้ดหรือชื่ออีโมจิกำหนดเอง
    - ใช้ `""` เพื่อปิดรีแอ็กชันสำหรับช่องหรือบัญชี

  </Accordion>

  <Accordion title="การเขียนคอนฟิก">
    การเขียนคอนฟิกที่เริ่มจากช่องเปิดใช้งานตามค่าเริ่มต้น

    สิ่งนี้มีผลกับโฟลว์ `/config set|unset` (เมื่อเปิดใช้ฟีเจอร์คำสั่ง)

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
    กำหนดเส้นทางทราฟฟิก WebSocket ของ Gateway Discord และการค้นหา REST ตอนเริ่มต้น (ID แอปพลิเคชัน + การแก้รายการอนุญาต) ผ่านพร็อกซี HTTP(S) ด้วย `channels.discord.proxy`

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
    เปิดใช้การแก้ค่า PluralKit เพื่อแมปข้อความที่ส่งผ่านพร็อกซีไปยังตัวตนสมาชิกของระบบ:

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
    - ชื่อแสดงผลของสมาชิกจะถูกจับคู่ตาม name/slug เท่านั้นเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การค้นหาใช้ ID ข้อความต้นฉบับและถูกจำกัดด้วยกรอบเวลา
    - หากการค้นหาล้มเหลว ข้อความที่ถูกพร็อกซีจะถูกถือว่าเป็นข้อความบ็อตและถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="นามแฝงการกล่าวถึงขาออก">
    ใช้ `mentionAliases` เมื่อเอเจนต์ต้องการการกล่าวถึงขาออกที่กำหนดแน่นอนสำหรับผู้ใช้ Discord ที่รู้จัก คีย์คือแฮนเดิลที่ไม่มี `@` นำหน้า; ค่าคือ ID ผู้ใช้ Discord แฮนเดิลที่ไม่รู้จัก, `@everyone`, `@here` และการกล่าวถึงภายในช่วงโค้ด Markdown จะถูกปล่อยไว้ไม่เปลี่ยนแปลง

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

    ตัวอย่างกิจกรรม (สถานะกำหนดเองเป็นประเภทกิจกรรมเริ่มต้น):

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

    แผนที่ประเภทกิจกรรม:

    - 0: กำลังเล่น
    - 1: กำลังสตรีม (ต้องมี `activityUrl`)
    - 2: กำลังฟัง
    - 3: กำลังดู
    - 4: กำหนดเอง (ใช้ข้อความกิจกรรมเป็นสถานะ; อีโมจิเป็นทางเลือก)
    - 5: กำลังแข่งขัน

    ตัวอย่าง Presence อัตโนมัติ (สัญญาณสุขภาพของรันไทม์):

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

    Presence อัตโนมัติแมปความพร้อมใช้งานของรันไทม์กับสถานะ Discord: healthy => online, degraded หรือ unknown => idle, exhausted หรือ unavailable => dnd การแทนที่ข้อความที่เป็นทางเลือก:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับตัวแทน `{reason}`)

  </Accordion>

  <Accordion title="การอนุมัติใน Discord">
    Discord รองรับการจัดการการอนุมัติแบบปุ่มใน DM และสามารถโพสต์พรอมป์การอนุมัติในช่องต้นทางได้ตามตัวเลือก

    พาธการกำหนดค่า:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (เป็นทางเลือก; ถอยกลับไปใช้ `commands.ownerAllowFrom` เมื่อทำได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord เปิดใช้การอนุมัติ exec แบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และสามารถระบุผู้อนุมัติได้อย่างน้อยหนึ่งราย ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมานผู้อนุมัติ exec จาก `allowFrom` ของช่อง, `dm.allowFrom` แบบเดิม หรือ `defaultTo` ของ direct-message ตั้งค่า `enabled: false` เพื่อปิดใช้ Discord ในฐานะไคลเอนต์การอนุมัติเนทีฟอย่างชัดเจน

    สำหรับคำสั่งกลุ่มที่ละเอียดอ่อนและเฉพาะเจ้าของเท่านั้น เช่น `/diagnostics` และ `/export-trajectory` OpenClaw จะส่งพรอมป์การอนุมัติและผลลัพธ์สุดท้ายแบบส่วนตัว โดยจะลองใช้ Discord DM ก่อนเมื่อเจ้าของที่เรียกใช้มีเส้นทางเจ้าของ Discord; หากไม่พร้อมใช้งาน จะถอยกลับไปใช้เส้นทางเจ้าของแรกที่พร้อมใช้งานจาก `commands.ownerAllowFrom` เช่น Telegram

    เมื่อ `target` เป็น `channel` หรือ `both` พรอมป์การอนุมัติจะมองเห็นได้ในช่อง เฉพาะผู้อนุมัติที่ระบุได้เท่านั้นที่ใช้ปุ่มได้; ผู้ใช้คนอื่นจะได้รับการปฏิเสธแบบชั่วคราว พรอมป์การอนุมัติรวมข้อความคำสั่งไว้ด้วย ดังนั้นให้เปิดใช้การส่งไปยังช่องเฉพาะในช่องที่เชื่อถือได้เท่านั้น หากไม่สามารถอนุมาน ID ช่องจากคีย์เซสชันได้ OpenClaw จะถอยกลับไปส่งผ่าน DM

    Discord ยังเรนเดอร์ปุ่มการอนุมัติร่วมที่ช่องแชตอื่นใช้ด้วย อะแดปเตอร์ Discord แบบเนทีฟหลัก ๆ จะเพิ่มการกำหนดเส้นทาง DM ของผู้อนุมัติและการกระจายไปยังช่อง
    เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก; OpenClaw
    ควรรวมคำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่า
    การอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียว
    หากรันไทม์การอนุมัติเนทีฟของ Discord ไม่ทำงาน OpenClaw จะคง
    พรอมป์ `/approve <id> <decision>` แบบกำหนดแน่นอนในเครื่องให้มองเห็นได้ หาก
    รันไทม์ทำงานอยู่แต่ไม่สามารถส่งการ์ดเนทีฟไปยังเป้าหมายใดได้
    OpenClaw จะส่งประกาศทางเลือกในแชตเดียวกันพร้อมคำสั่ง `/approve`
    ที่แน่นอนจากการอนุมัติที่รอดำเนินการ

    การตรวจสอบสิทธิ์ Gateway และการแก้ไขการอนุมัติทำตามสัญญาไคลเอนต์ Gateway ร่วม (`plugin:` IDs แก้ไขผ่าน `plugin.approval.resolve`; ID อื่นผ่าน `exec.approval.resolve`) การอนุมัติจะหมดอายุหลังจาก 30 นาทีโดยค่าเริ่มต้น

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและประตูการดำเนินการ

การดำเนินการข้อความ Discord รวมถึงการส่งข้อความ การดูแลช่อง การมอดเดอเรชัน Presence และการดำเนินการเมทาดาทา

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- ปฏิกิริยา: `react`, `reactions`, `emojiList`
- การมอดเดอเรชัน: `timeout`, `kick`, `ban`
- Presence: `setPresence`

การดำเนินการ `event-create` รับพารามิเตอร์ `image` ที่เป็นทางเลือก (URL หรือพาธไฟล์ในเครื่อง) เพื่อตั้งค่าภาพหน้าปกของเหตุการณ์ที่กำหนดเวลาไว้

ประตูการดำเนินการอยู่ภายใต้ `channels.discord.actions.*`

พฤติกรรมประตูเริ่มต้น:

| กลุ่มการดำเนินการ                                                                                                                                                         | ค่าเริ่มต้น |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้ |
| roles                                                                                                                                                                    | ปิดใช้ |
| moderation                                                                                                                                                               | ปิดใช้ |
| presence                                                                                                                                                                 | ปิดใช้ |

## UI ของ Components v2

OpenClaw ใช้ Discord components v2 สำหรับการอนุมัติ exec และเครื่องหมายข้ามบริบท การดำเนินการข้อความ Discord ยังสามารถรับ `components` สำหรับ UI แบบกำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้างเพย์โหลดคอมโพเนนต์ผ่านเครื่องมือ discord) ขณะที่ `embeds` แบบเดิมยังพร้อมใช้งาน แต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นที่ใช้โดยคอนเทนเนอร์คอมโพเนนต์ Discord (hex)
- ตั้งค่าต่อบัญชีด้วย `channels.discord.accounts.<id>.ui.components.accentColor`
- `channels.discord.agentComponents.ttlMs` ควบคุมระยะเวลาที่ callback ของคอมโพเนนต์ Discord ที่ส่งไปยังคงถูกลงทะเบียนอยู่ (ค่าเริ่มต้น `1800000`, สูงสุด `86400000`) ตั้งค่าต่อบัญชีด้วย `channels.discord.accounts.<id>.agentComponents.ttlMs`
- `embeds` จะถูกละเว้นเมื่อมี components v2
- การแสดงตัวอย่าง URL ธรรมดาถูกระงับโดยค่าเริ่มต้น ตั้งค่า `suppressEmbeds: false` ในการดำเนินการข้อความเมื่อควรขยายลิงก์ขาออกลิงก์เดียว

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

Discord มีพื้นผิวเสียงสองแบบที่แตกต่างกัน: **ช่องเสียง** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบตัวอย่างเวฟฟอร์ม) Gateway รองรับทั้งสองแบบ

### ช่องเสียง

เช็กลิสต์การตั้งค่า:

1. เปิดใช้ Message Content Intent ใน Discord Developer Portal
2. เปิดใช้ Server Members Intent เมื่อใช้ allowlists สำหรับบทบาท/ผู้ใช้
3. เชิญบ็อตด้วยสโคป `bot` และ `applications.commands`
4. ให้สิทธิ์ Connect, Speak, Send Messages และ Read Message History ในช่องเสียงเป้าหมาย
5. เปิดใช้คำสั่งเนทีฟ (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งจะใช้เอเจนต์เริ่มต้นของบัญชีและทำตามกฎ allowlist และนโยบายกลุ่มเดียวกับคำสั่ง Discord อื่น ๆ

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

เพื่อตรวจสอบสิทธิ์ที่มีผลจริงของบ็อตก่อนเข้าร่วม ให้รัน:

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
        model: "openai/gpt-5.5",
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
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

หมายเหตุ:

- `voice.tts` จะแทนที่ `messages.tts` เฉพาะสำหรับการเล่นเสียง `stt-tts` เท่านั้น โหมดเรียลไทม์ใช้ `voice.realtime.speakerVoice`
- `voice.mode` ควบคุมเส้นทางการสนทนา ค่าเริ่มต้นคือ `agent-proxy`: ส่วนหน้าเสียงแบบเรียลไทม์จัดการจังหวะของเทิร์น การขัดจังหวะ และการเล่นเสียง มอบหมายงานที่เป็นสาระให้เอเจนต์ OpenClaw ที่ถูกกำหนดเส้นทางผ่าน `openclaw_agent_consult` และปฏิบัติกับผลลัพธ์เหมือนพรอมป์ Discord แบบพิมพ์จากผู้พูดคนนั้น `stt-tts` ยังคงใช้โฟลว์ STT แบบแบตช์รุ่นเก่าร่วมกับ TTS `bidi` ให้โมเดลเรียลไทม์สนทนาได้โดยตรงพร้อมเปิดเผย `openclaw_agent_consult` สำหรับสมอง OpenClaw
- `voice.agentSession` ควบคุมว่าการสนทนา OpenClaw ใดจะรับเทิร์นเสียง เว้นว่างไว้เพื่อใช้เซสชันของช่องเสียงเอง หรือตั้งค่า `{ mode: "target", target: "channel:<text-channel-id>" }` เพื่อให้ช่องเสียงทำหน้าที่เป็นส่วนขยายไมโครโฟน/ลำโพงของเซสชันช่องข้อความ Discord ที่มีอยู่ เช่น `#maintainers`
- `voice.model` แทนที่สมองเอเจนต์ OpenClaw สำหรับคำตอบเสียง Discord และการปรึกษาแบบเรียลไทม์ เว้นว่างไว้เพื่อสืบทอดโมเดลเอเจนต์ที่ถูกกำหนดเส้นทาง ค่านี้แยกจาก `voice.realtime.model`
- `voice.followUsers` ให้บอตเข้าร่วม ย้าย และออกจากเสียง Discord กับผู้ใช้ที่เลือกไว้ ดู [ติดตามผู้ใช้ในเสียง](#follow-users-in-voice) สำหรับกฎพฤติกรรมและตัวอย่าง
- `agent-proxy` กำหนดเส้นทางเสียงพูดผ่าน `discord-voice` ซึ่งรักษาการอนุญาตเจ้าของ/เครื่องมือตามปกติสำหรับผู้พูดและเซสชันเป้าหมาย แต่ซ่อนเครื่องมือ `tts` ของเอเจนต์เพราะเสียง Discord เป็นเจ้าของการเล่นเสียง โดยค่าเริ่มต้น `agent-proxy` ให้การปรึกษามีสิทธิ์เข้าถึงเครื่องมือเทียบเท่าเจ้าของเต็มรูปแบบสำหรับผู้พูดที่เป็นเจ้าของ (`voice.realtime.toolPolicy: "owner"`) และแนะนำอย่างยิ่งให้ปรึกษาเอเจนต์ OpenClaw ก่อนคำตอบที่เป็นสาระ (`voice.realtime.consultPolicy: "always"`) ในโหมด `always` เริ่มต้นนั้น ชั้นเรียลไทม์จะไม่พูดข้อความเติมก่อนคำตอบจากการปรึกษาโดยอัตโนมัติ แต่จะจับและถอดเสียงคำพูด แล้วจึงพูดคำตอบ OpenClaw ที่ถูกกำหนดเส้นทาง หากคำตอบจากการปรึกษาแบบบังคับหลายรายการเสร็จสิ้นขณะที่ Discord ยังเล่นคำตอบแรกอยู่ คำตอบเสียงพูดที่ตรงเป๊ะในภายหลังจะถูกเข้าคิวจนกว่าการเล่นเสียงจะว่าง แทนที่จะแทนที่เสียงพูดกลางประโยค
- ในโหมด `stt-tts` STT ใช้ `tools.media.audio`; `voice.model` ไม่มีผลต่อการถอดเสียง
- ในโหมดเรียลไทม์ `voice.realtime.provider`, `voice.realtime.model` และ `voice.realtime.speakerVoice` กำหนดค่าเซสชันเสียงเรียลไทม์ สำหรับ OpenAI Realtime 2 ร่วมกับสมอง Codex ให้ใช้ `voice.realtime.model: "gpt-realtime-2"` และ `voice.model: "openai/gpt-5.5"`
- โหมดเสียงเรียลไทม์รวมไฟล์โปรไฟล์ขนาดเล็ก `IDENTITY.md`, `USER.md` และ `SOUL.md` ไว้ในคำสั่งของผู้ให้บริการเรียลไทม์ตามค่าเริ่มต้น เพื่อให้เทิร์นตรงที่รวดเร็วยังคงมีอัตลักษณ์ การยึดโยงกับผู้ใช้ และบุคลิกเดียวกับเอเจนต์ OpenClaw ที่ถูกกำหนดเส้นทาง ตั้งค่า `voice.realtime.bootstrapContextFiles` เป็นชุดย่อยเพื่อปรับแต่ง หรือ `[]` เพื่อปิดใช้งาน ไฟล์บูตสแตรปเรียลไทม์ที่รองรับจำกัดอยู่ที่ไฟล์โปรไฟล์เหล่านั้น; `AGENTS.md` ยังคงอยู่ในบริบทเอเจนต์ปกติ บริบทโปรไฟล์ที่ถูกฉีดเข้าไปไม่ได้แทนที่ `openclaw_agent_consult` สำหรับงานในเวิร์กสเปซ ข้อเท็จจริงปัจจุบัน การค้นหาหน่วยความจำ หรือการกระทำที่มีเครื่องมือรองรับ
- ในโหมดเรียลไทม์ OpenAI `agent-proxy` ให้ตั้งค่า `voice.realtime.requireWakeName: true` เพื่อให้เสียงเรียลไทม์ Discord เงียบจนกว่าทรานสคริปต์จะขึ้นต้นหรือลงท้ายด้วยชื่อปลุก ชื่อปลุกที่กำหนดค่าต้องมีหนึ่งหรือสองคำ หากไม่ได้ตั้งค่า `voice.realtime.wakeNames` OpenClaw จะใช้ `name` ของเอเจนต์ที่ถูกกำหนดเส้นทางร่วมกับ `OpenClaw` และถอยกลับไปใช้รหัสเอเจนต์ร่วมกับ `OpenClaw` การกั้นด้วยชื่อปลุกจะปิดการตอบกลับอัตโนมัติของผู้ให้บริการเรียลไทม์ กำหนดเส้นทางเทิร์นที่ยอมรับผ่านเส้นทางปรึกษาเอเจนต์ OpenClaw และให้การตอบรับแบบพูดสั้นๆ เมื่อชื่อปลุกนำหน้าถูกจดจำจากการถอดเสียงบางส่วนก่อนทรานสคริปต์สุดท้ายจะมาถึง
- ผู้ให้บริการเรียลไทม์ OpenAI ยอมรับชื่อเหตุการณ์ Realtime 2 ปัจจุบันและชื่อแฝงดั้งเดิมที่เข้ากันได้กับ Codex สำหรับเหตุการณ์เสียงเอาต์พุตและทรานสคริปต์ ดังนั้นสแนปช็อตผู้ให้บริการที่เข้ากันได้จึงเปลี่ยนแปลงได้โดยไม่ทำให้เสียงผู้ช่วยหลุดหาย
- `voice.realtime.bargeIn` ควบคุมว่าเหตุการณ์เริ่มพูดของผู้พูด Discord จะขัดจังหวะการเล่นเสียงเรียลไทม์ที่กำลังทำงานอยู่หรือไม่ หากไม่ได้ตั้งค่า จะทำตามการตั้งค่าการขัดจังหวะเสียงอินพุตของผู้ให้บริการเรียลไทม์
- `voice.realtime.minBargeInAudioEndMs` ควบคุมระยะเวลาขั้นต่ำของการเล่นเสียงผู้ช่วยก่อนที่ barge-in เรียลไทม์ OpenAI จะตัดเสียง ค่าเริ่มต้น: `250` ตั้งค่า `0` เพื่อขัดจังหวะทันทีในห้องที่มีเสียงสะท้อนต่ำ หรือเพิ่มค่านี้สำหรับชุดลำโพงที่มีเสียงสะท้อนมาก
- สำหรับเสียง OpenAI บนการเล่นเสียง Discord ให้ตั้งค่า `voice.tts.provider: "openai"` และเลือกเสียง Text-to-speech ใต้ `voice.tts.providers.openai.speakerVoice` `cedar` เป็นตัวเลือกที่ให้เสียงแนวผู้ชายที่ดีบนโมเดล OpenAI TTS ปัจจุบัน
- การแทนที่ `systemPrompt` ของ Discord รายช่องจะมีผลกับเทิร์นทรานสคริปต์เสียงสำหรับช่องเสียงนั้น
- เทิร์นทรานสคริปต์เสียงอนุมานสถานะเจ้าของจาก Discord `allowFrom` (หรือ `dm.allowFrom`) สำหรับคำสั่งที่กั้นด้วยเจ้าของและการกระทำของช่อง การมองเห็นเครื่องมือเอเจนต์ทำตามนโยบายเครื่องมือที่กำหนดค่าสำหรับเซสชันที่ถูกกำหนดเส้นทาง
- เสียง Discord เป็นแบบเลือกเปิดสำหรับคอนฟิกที่มีแต่ข้อความ; ตั้งค่า `channels.discord.voice.enabled=true` (หรือคงบล็อก `channels.discord.voice` ที่มีอยู่) เพื่อเปิดใช้คำสั่ง `/vc` รันไทม์เสียง และ Gateway intent `GuildVoiceStates`
- `channels.discord.intents.voiceStates` สามารถแทนที่การสมัครรับ intent สถานะเสียงได้อย่างชัดเจน เว้นว่างไว้เพื่อให้ intent ทำตามการเปิดใช้เสียงที่มีผลจริง
- หาก `voice.autoJoin` มีหลายรายการสำหรับกิลด์เดียวกัน OpenClaw จะเข้าร่วมช่องที่กำหนดค่าไว้ล่าสุดสำหรับกิลด์นั้น
- `voice.allowedChannels` เป็น allowlist การพำนักที่ไม่บังคับ เว้นว่างไว้เพื่ออนุญาตให้ `/vc join` เข้าช่องเสียง Discord ใดๆ ที่ได้รับอนุญาต เมื่อตั้งค่าแล้ว `/vc join`, การเข้าร่วมอัตโนมัติเมื่อเริ่มต้น และการย้ายสถานะเสียงของบอตจะถูกจำกัดไว้ที่รายการ `{ guildId, channelId }` ที่ระบุ ตั้งค่าเป็นอาร์เรย์ว่างเพื่อปฏิเสธการเข้าร่วมเสียง Discord ทั้งหมด หาก Discord ย้ายบอตออกนอก allowlist OpenClaw จะออกจากช่องนั้นและเข้าร่วมเป้าหมาย auto-join ที่กำหนดค่าไว้อีกครั้งเมื่อมี
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือก join ของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- OpenClaw ใช้โคเดก `libopus-wasm` ที่รวมมาให้สำหรับการรับเสียง Discord และการเล่น PCM ดิบแบบเรียลไทม์ มาพร้อมบิลด์ libopus WebAssembly ที่ตรึงไว้และไม่ต้องใช้ addon opus แบบเนทีฟ
- `voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายาม auto-join ค่าเริ่มต้น: `30000`
- `voice.reconnectGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอให้เซสชันเสียงที่ถูกตัดการเชื่อมต่อเริ่มเชื่อมต่อใหม่ก่อนทำลายเซสชัน ค่าเริ่มต้น: `15000`
- ในโหมด `stt-tts` การเล่นเสียงจะไม่หยุดเพียงเพราะผู้ใช้อื่นเริ่มพูด เพื่อหลีกเลี่ยงลูปเสียงสะท้อน OpenClaw จะเพิกเฉยต่อการจับเสียงใหม่ขณะ TTS กำลังเล่นอยู่; ให้พูดหลังการเล่นเสียงจบเพื่อเข้าสู่เทิร์นถัดไป โหมดเรียลไทม์ส่งต่อการเริ่มพูดของผู้พูดเป็นสัญญาณ barge-in ไปยังผู้ให้บริการเรียลไทม์
- ในโหมดเรียลไทม์ เสียงสะท้อนจากลำโพงเข้าสู่ไมค์ที่เปิดอยู่อาจดูเหมือน barge-in และขัดจังหวะการเล่นเสียง สำหรับห้อง Discord ที่มีเสียงสะท้อนมาก ให้ตั้งค่า `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` เพื่อไม่ให้ OpenAI ขัดจังหวะอัตโนมัติเมื่อมีเสียงอินพุต เพิ่ม `voice.realtime.bargeIn: true` หากคุณยังต้องการให้เหตุการณ์เริ่มพูดของผู้พูด Discord ขัดจังหวะการเล่นเสียงที่กำลังทำงานอยู่ บริดจ์เรียลไทม์ OpenAI จะเพิกเฉยต่อการตัดการเล่นเสียงที่สั้นกว่า `voice.realtime.minBargeInAudioEndMs` โดยถือว่าน่าจะเป็นเสียงสะท้อน/สัญญาณรบกวน และบันทึกว่า skipped แทนการล้างการเล่นเสียง Discord
- `voice.captureSilenceGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอหลังจาก Discord รายงานว่าผู้พูดหยุดพูด ก่อนสรุปเซกเมนต์เสียงนั้นสำหรับ STT ค่าเริ่มต้น: `2000`; เพิ่มค่านี้หาก Discord แยกช่วงหยุดปกติออกเป็นทรานสคริปต์บางส่วนที่กระตุก
- เมื่อ ElevenLabs เป็นผู้ให้บริการ TTS ที่เลือก การเล่นเสียง Discord จะใช้ TTS แบบสตรีมมิงและเริ่มจากสตรีมคำตอบของผู้ให้บริการ ผู้ให้บริการที่ไม่รองรับสตรีมมิงจะถอยกลับไปใช้เส้นทางไฟล์ชั่วคราวที่สังเคราะห์แล้ว
- OpenClaw ยังเฝ้าดูความล้มเหลวในการถอดรหัสฝั่งรับและกู้คืนอัตโนมัติด้วยการออกจาก/เข้าร่วมช่องเสียงอีกครั้งหลังเกิดความล้มเหลวซ้ำๆ ในช่วงเวลาสั้นๆ
- หากล็อกรับแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำๆ หลังอัปเดต ให้เก็บรายงาน dependency และล็อก บรรทัด `@discordjs/voice` ที่รวมมามีการแก้แพดดิงจาก upstream จาก discord.js PR #11449 ซึ่งปิด discord.js issue #11419
- เหตุการณ์รับ `The operation was aborted` เป็นสิ่งที่คาดไว้เมื่อ OpenClaw สรุปเซกเมนต์ผู้พูดที่จับไว้; สิ่งเหล่านี้เป็นการวินิจฉัยแบบละเอียด ไม่ใช่คำเตือน
- ล็อกเสียง Discord แบบละเอียดรวมตัวอย่างทรานสคริปต์ STT หนึ่งบรรทัดที่มีขอบเขตสำหรับแต่ละเซกเมนต์ผู้พูดที่ยอมรับ เพื่อให้การดีบักแสดงทั้งฝั่งผู้ใช้และฝั่งคำตอบของเอเจนต์โดยไม่เทข้อความทรานสคริปต์แบบไม่จำกัด
- ในโหมด `agent-proxy` fallback การปรึกษาแบบบังคับจะข้ามชิ้นส่วนทรานสคริปต์ที่น่าจะยังไม่สมบูรณ์ เช่น ข้อความที่ลงท้ายด้วย `...` หรือตัวเชื่อมท้ายอย่าง `and` รวมถึงการปิดท้ายที่เห็นชัดว่าไม่ใช่สิ่งที่ต้องดำเนินการ เช่น “be right back” หรือ “bye” ล็อกจะแสดง `forced agent consult skipped reason=...` เมื่อสิ่งนี้ป้องกันคำตอบค้างเก่าที่ถูกเข้าคิว

### ติดตามผู้ใช้ในเสียง

ใช้ `voice.followUsers` เมื่อคุณต้องการให้บอตเสียง Discord อยู่กับผู้ใช้ Discord ที่รู้จักหนึ่งคนขึ้นไป แทนการเข้าร่วมห้องคงที่เมื่อเริ่มต้นหรือรอ `/vc join`

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

พฤติกรรม:

- `followUsers` ยอมรับรหัสผู้ใช้ Discord แบบดิบและค่า `discord:<id>` OpenClaw ทำให้ทั้งสองรูปแบบเป็นรูปแบบปกติก่อนจับคู่เหตุการณ์สถานะเสียง
- `followUsersEnabled` มีค่าเริ่มต้นเป็น `true` เมื่อกำหนดค่า `followUsers` ตั้งค่าเป็น `false` เพื่อเก็บรายการที่บันทึกไว้แต่หยุดการติดตามเสียงอัตโนมัติ
- เมื่อผู้ใช้ที่ถูกติดตามเข้าร่วมช่องเสียงที่อนุญาต OpenClaw จะเข้าร่วมช่องนั้น เมื่อผู้ใช้ย้าย OpenClaw จะย้ายตาม เมื่อผู้ใช้ที่ถูกติดตามที่ใช้งานอยู่ตัดการเชื่อมต่อ OpenClaw จะออก
- หากผู้ใช้ที่ถูกติดตามหลายคนอยู่ในกิลด์เดียวกันและผู้ใช้ที่ถูกติดตามที่ใช้งานอยู่ออก OpenClaw จะย้ายไปยังช่องของผู้ใช้ที่ถูกติดตามอีกคนที่ติดตามอยู่ก่อนออกจากกิลด์ หากผู้ใช้ที่ถูกติดตามหลายคนย้ายพร้อมกัน เหตุการณ์สถานะเสียงที่สังเกตเห็นล่าสุดจะชนะ
- `allowedChannels` ยังคงมีผล ผู้ใช้ที่ถูกติดตามในช่องที่ไม่อนุญาตจะถูกเพิกเฉย และเซสชันที่เป็นของการติดตามจะย้ายไปยังผู้ใช้ที่ถูกติดตามอีกคนหรือออก
- OpenClaw กระทบยอดเหตุการณ์สถานะเสียงที่พลาดไปเมื่อเริ่มต้นและตามช่วงเวลาที่มีขอบเขต การกระทบยอดจะสุ่มตัวอย่างกิลด์ที่กำหนดค่าและจำกัดการค้นหา REST ต่อการรัน ดังนั้นรายการ `followUsers` ที่ใหญ่มากอาจใช้เวลามากกว่าหนึ่งช่วงเวลากว่าจะลู่เข้า
- หาก Discord หรือผู้ดูแลระบบย้ายบอตขณะที่กำลังติดตามผู้ใช้ OpenClaw จะสร้างเซสชันเสียงใหม่และคงความเป็นเจ้าของการติดตามไว้เมื่อปลายทางได้รับอนุญาต หากบอตถูกย้ายออกนอก `allowedChannels` OpenClaw จะออกและเข้าร่วมเป้าหมายที่กำหนดค่าไว้อีกครั้งเมื่อมี
- การกู้คืนการรับ DAVE อาจออกและเข้าร่วมช่องเดิมอีกครั้งหลังความล้มเหลวในการถอดรหัสซ้ำๆ เซสชันที่เป็นของการติดตามจะคงความเป็นเจ้าของการติดตามผ่านเส้นทางการกู้คืนนั้น ดังนั้นเมื่อผู้ใช้ที่ถูกติดตามตัดการเชื่อมต่อในภายหลังก็ยังออกจากช่อง

เลือกระหว่างโหมดการเข้าร่วม:

- ใช้ `followUsers` สำหรับการตั้งค่าส่วนตัวหรือของผู้ปฏิบัติงานที่บอตควรอยู่ในเสียงโดยอัตโนมัติเมื่อคุณอยู่
- ใช้ `autoJoin` สำหรับบอตห้องคงที่ที่ควรอยู่ประจำแม้ไม่มีผู้ใช้ที่ติดตามอยู่ในเสียง
- ใช้ `/vc join` สำหรับการเข้าร่วมแบบครั้งเดียวหรือห้องที่การมีอยู่ในเสียงโดยอัตโนมัติอาจทำให้แปลกใจ

โคเดกเสียง Discord:

- บันทึกการรับเสียงแสดง `discord voice: opus decoder: libopus-wasm`
- การเล่นแบบเรียลไทม์เข้ารหัส PCM สเตอริโอดิบ 48 kHz เป็น Opus ด้วยแพ็กเกจ `libopus-wasm` ที่รวมมาเดียวกัน ก่อนส่งต่อแพ็กเก็ตให้ `@discordjs/voice`
- การเล่นไฟล์และสตรีมจากผู้ให้บริการจะแปลงรหัสเป็น PCM สเตอริโอดิบ 48 kHz ด้วย ffmpeg แล้วใช้ `libopus-wasm` สำหรับสตรีมแพ็กเก็ต Opus ที่ส่งไปยัง Discord

ไปป์ไลน์ STT พร้อม TTS:

- การจับ PCM จาก Discord จะถูกแปลงเป็นไฟล์ชั่วคราว WAV
- `tools.media.audio` จัดการ STT เช่น `openai/gpt-4o-mini-transcribe`
- ข้อความถอดเสียงจะถูกส่งผ่านทางเข้าและการกำหนดเส้นทางของ Discord ขณะที่ LLM สำหรับคำตอบทำงานด้วยนโยบายเอาต์พุตเสียงที่ซ่อนเครื่องมือ `tts` ของเอเจนต์และขอให้ส่งคืนข้อความ เพราะเสียงของ Discord เป็นเจ้าของการเล่น TTS ขั้นสุดท้าย
- `voice.model` เมื่อกำหนดไว้ จะแทนที่เฉพาะ LLM สำหรับคำตอบของรอบช่องเสียงนี้
- `voice.tts` จะถูกผสานทับ `messages.tts`; ผู้ให้บริการที่รองรับการสตรีมจะป้อนข้อมูลให้ตัวเล่นโดยตรง ไม่เช่นนั้นไฟล์เสียงที่ได้จะถูกเล่นในช่องที่เข้าร่วมอยู่

ตัวอย่างเซสชันช่องเสียง agent-proxy เริ่มต้น:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

เมื่อไม่มีบล็อก `voice.agentSession` ช่องเสียงแต่ละช่องจะได้เซสชัน OpenClaw ที่กำหนดเส้นทางของตนเอง ตัวอย่างเช่น `/vc join channel:234567890123456789` จะคุยกับเซสชันของช่องเสียง Discord นั้น โมเดลเรียลไทม์เป็นเพียงส่วนหน้าด้านเสียงเท่านั้น คำขอที่เป็นสาระสำคัญจะถูกส่งต่อให้เอเจนต์ OpenClaw ที่กำหนดค่าไว้ หากโมเดลเรียลไทม์สร้างข้อความถอดเสียงสุดท้ายโดยไม่เรียกเครื่องมือปรึกษา OpenClaw จะบังคับการปรึกษาเป็นทางสำรอง เพื่อให้ค่าเริ่มต้นยังทำงานเหมือนกำลังคุยกับเอเจนต์

ตัวอย่าง STT พร้อม TTS แบบเดิม:

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
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
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
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
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
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

ในโหมด `agent-proxy` บอตจะเข้าร่วมช่องเสียงที่กำหนดค่าไว้ แต่รอบของเอเจนต์ OpenClaw จะใช้เซสชันและเอเจนต์ที่กำหนดเส้นทางตามปกติของช่องเป้าหมาย เซสชันเสียงเรียลไทม์จะพูดผลลัพธ์ที่ส่งคืนกลับเข้าไปในช่องเสียง เอเจนต์ผู้ควบคุมยังคงใช้เครื่องมือข้อความตามปกติได้ตามนโยบายเครื่องมือของตน รวมถึงการส่งข้อความ Discord แยกต่างหากหากนั่นเป็นการกระทำที่เหมาะสม

ขณะที่การรัน OpenClaw ที่มอบหมายกำลังทำงาน ข้อความถอดเสียงใหม่จาก Discord voice จะถูกจัดการเป็นการควบคุมการรันสดก่อนเริ่มรอบเอเจนต์อีกครั้ง วลีเช่น "status", "cancel that", "use the smaller fix" หรือ "when you're done also check tests" จะถูกจัดประเภทเป็นสถานะ การยกเลิก การชี้นำ หรืออินพุตติดตามผลสำหรับเซสชันที่กำลังทำงาน ผลลัพธ์ของสถานะ การยกเลิก การชี้นำที่ยอมรับ และการติดตามผลจะถูกพูดกลับเข้าไปในช่องเสียง เพื่อให้ผู้เรียกทราบว่า OpenClaw จัดการคำขอนั้นหรือไม่

รูปแบบเป้าหมายที่มีประโยชน์:

- `target: "channel:123456789012345678"` กำหนดเส้นทางผ่านเซสชันช่องข้อความ Discord
- `target: "123456789012345678"` จะถูกจัดการเป็นเป้าหมายช่อง
- `target: "dm:123456789012345678"` หรือ `target: "user:123456789012345678"` กำหนดเส้นทางผ่านเซสชันข้อความตรงนั้น

ตัวอย่าง OpenAI Realtime ที่มีเสียงสะท้อนมาก:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
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

ใช้ค่านี้เมื่อโมเดลได้ยินเสียงเล่นกลับของตัวเองจาก Discord ผ่านไมค์ที่เปิดอยู่ แต่คุณยังต้องการขัดจังหวะด้วยการพูด OpenClaw จะป้องกันไม่ให้ OpenAI ขัดจังหวะอัตโนมัติจากเสียงอินพุตดิบ ขณะที่ `bargeIn: true` ทำให้เหตุการณ์เริ่มพูดของผู้พูดใน Discord และเสียงของผู้พูดที่กำลังใช้งานอยู่สามารถยกเลิกคำตอบเรียลไทม์ที่กำลังทำงาน ก่อนที่รอบที่จับได้ถัดไปจะไปถึง OpenAI สัญญาณแทรกพูดที่มาเร็วมากซึ่งมี `audioEndMs` ต่ำกว่า `minBargeInAudioEndMs` จะถูกถือว่าน่าจะเป็นเสียงสะท้อน/เสียงรบกวนและถูกเพิกเฉย เพื่อให้โมเดลไม่ตัดเสียงตั้งแต่เฟรมเล่นกลับแรก

บันทึกเสียงที่คาดหวัง:

- เมื่อเข้าร่วม: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- เมื่อเริ่มเรียลไทม์: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- เมื่อมีเสียงผู้พูด: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` และ `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- เมื่อข้ามคำพูดเก่า: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` หรือ `reason=non-actionable-closing ...`
- เมื่อคำตอบเรียลไทม์เสร็จสมบูรณ์: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- เมื่อหยุด/รีเซ็ตการเล่น: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- เมื่อปรึกษาแบบเรียลไทม์: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- เมื่อเอเจนต์ตอบ: `discord voice: agent turn answer ...`
- เมื่อจัดคิวคำพูดตรงตามต้นฉบับ: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...` ตามด้วย `discord voice: realtime exact speech dequeued reason=player-idle ...`
- เมื่อตรวจพบการแทรกพูด: `discord voice: realtime barge-in detected source=speaker-start ...` หรือ `discord voice: realtime barge-in detected source=active-speaker-audio ...` ตามด้วย `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- เมื่อเกิดการขัดจังหวะแบบเรียลไทม์: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in` ตามด้วย `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` หรือ `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- เมื่อเพิกเฉยเสียงสะท้อน/เสียงรบกวน: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- เมื่อปิดใช้การแทรกพูด: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- เมื่อการเล่นว่างอยู่: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

เมื่อต้องการดีบักเสียงที่ถูกตัด ให้อ่านบันทึกเสียงเรียลไทม์เป็นไทม์ไลน์:

1. `realtime audio playback started` หมายความว่า Discord เริ่มเล่นเสียงผู้ช่วยแล้ว บริดจ์จะเริ่มนับชิ้นเสียงเอาต์พุตของผู้ช่วย ไบต์ PCM ของ Discord ไบต์เรียลไทม์ของผู้ให้บริการ และระยะเวลาเสียงที่สังเคราะห์จากจุดนี้
2. `realtime speaker turn opened` ระบุว่าผู้พูดใน Discord เริ่มทำงาน หากการเล่นกำลังทำงานอยู่แล้วและเปิดใช้ `bargeIn` อยู่ อาจตามด้วย `barge-in detected source=speaker-start`
3. `realtime input audio started` ระบุเฟรมเสียงจริงเฟรมแรกที่ได้รับสำหรับรอบผู้พูดนั้น `outputActive=true` หรือ `outputAudioMs` ที่ไม่เป็นศูนย์ตรงนี้หมายความว่าไมค์กำลังส่งอินพุตขณะที่เสียงผู้ช่วยยังเล่นอยู่
4. `barge-in detected source=active-speaker-audio` หมายความว่า OpenClaw เห็นเสียงผู้พูดสดขณะที่เสียงผู้ช่วยกำลังเล่นอยู่ สิ่งนี้มีประโยชน์ในการแยกการขัดจังหวะจริงออกจากเหตุการณ์เริ่มพูดของ Discord ที่ไม่มีเสียงที่ใช้ได้
5. `barge-in requested reason=...` หมายความว่า OpenClaw ขอให้ผู้ให้บริการเรียลไทม์ยกเลิกหรือตัดคำตอบที่กำลังทำงานอยู่ โดยมี `outputAudioMs`, `outputActive` และ `playbackChunks` เพื่อให้คุณเห็นว่าเสียงผู้ช่วยเล่นไปจริงเท่าใดก่อนการขัดจังหวะ
6. `realtime audio playback stopped reason=...` คือจุดรีเซ็ตการเล่น Discord ในเครื่อง เหตุผลจะบอกว่าใครหยุดการเล่น: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` หรือ `session-close`
7. `realtime speaker turn closed` สรุปรอบอินพุตที่จับได้ `chunks=0` หรือ `hasAudio=false` หมายความว่ารอบผู้พูดเปิดขึ้นแต่ไม่มีเสียงที่ใช้ได้ไปถึงบริดจ์เรียลไทม์ `interruptedPlayback=true` หมายความว่ารอบอินพุตนั้นทับซ้อนกับเอาต์พุตของผู้ช่วยและทริกเกอร์ตรรกะการแทรกพูด

ฟิลด์ที่มีประโยชน์:

- `outputAudioMs`: ระยะเวลาเสียงผู้ช่วยที่ผู้ให้บริการเรียลไทม์สร้างก่อนบรรทัดบันทึก
- `audioMs`: ระยะเวลาเสียงผู้ช่วยที่ OpenClaw นับก่อนการเล่นหยุดลง
- `elapsedMs`: เวลาตามนาฬิการะหว่างการเปิดและปิดสตรีมการเล่นหรือรอบผู้พูด
- `discordBytes`: ไบต์ PCM สเตอริโอ 48 kHz ที่ส่งไปยังหรือรับจาก Discord voice
- `realtimeBytes`: ไบต์ PCM รูปแบบผู้ให้บริการที่ส่งไปยังหรือรับจากผู้ให้บริการเรียลไทม์
- `playbackChunks`: ชิ้นเสียงผู้ช่วยที่ส่งต่อไปยัง Discord สำหรับคำตอบที่กำลังทำงาน
- `sinceLastAudioMs`: ช่องว่างระหว่างเฟรมเสียงผู้พูดที่จับได้ล่าสุดกับการปิดรอบผู้พูด

รูปแบบที่พบบ่อย:

- การตัดเสียงทันทีพร้อม `source=active-speaker-audio`, `outputAudioMs` ค่าน้อย และผู้ใช้คนเดียวกันอยู่ใกล้เคียง มักชี้ไปที่เสียงสะท้อนจากลำโพงเข้ามาในไมค์ เพิ่ม `voice.realtime.minBargeInAudioEndMs`, ลดระดับเสียงลำโพง, ใช้หูฟัง หรือกำหนด `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`
- `source=speaker-start` ตามด้วย `speaker turn closed ... hasAudio=false` หมายความว่า Discord รายงานการเริ่มพูดแต่ไม่มีเสียงไปถึง OpenClaw นั่นอาจเป็นเหตุการณ์เสียง Discord ชั่วคราว พฤติกรรม noise gate หรือไคลเอนต์ที่เปิดไมค์ชั่วขณะ
- `audio playback stopped reason=stream-close` โดยไม่มีการแทรกพูดหรือ `provider-clear-audio` ใกล้เคียง หมายความว่าสตรีมการเล่น Discord ในเครื่องจบลงโดยไม่คาดคิด ตรวจสอบบันทึกผู้ให้บริการและตัวเล่น Discord ก่อนหน้า
- `capture ignored during playback (barge-in disabled)` หมายความว่า OpenClaw ตั้งใจทิ้งอินพุตขณะที่เสียงผู้ช่วยกำลังทำงาน เปิดใช้ `voice.realtime.bargeIn` หากคุณต้องการให้คำพูดขัดจังหวะการเล่น
- `barge-in ignored ... outputActive=false` หมายความว่า Discord หรือ VAD ของผู้ให้บริการรายงานว่ามีคำพูด แต่ OpenClaw ไม่มีการเล่นที่กำลังทำงานให้ขัดจังหวะ สิ่งนี้ไม่ควรตัดเสียง

ข้อมูลรับรองจะถูกแก้ไขแยกตามคอมโพเนนต์: การยืนยันตัวตนเส้นทาง LLM สำหรับ `voice.model`, การยืนยันตัวตน STT สำหรับ `tools.media.audio`, การยืนยันตัวตน TTS สำหรับ `messages.tts`/`voice.tts` และการยืนยันตัวตนผู้ให้บริการเรียลไทม์สำหรับ `voice.realtime.providers` หรือการกำหนดค่าการยืนยันตัวตนปกติของผู้ให้บริการ

### ข้อความเสียง

ข้อความเสียง Discord แสดงตัวอย่างรูปคลื่นและต้องใช้เสียง OGG/Opus OpenClaw สร้างรูปคลื่นโดยอัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ Gateway เพื่อตรวจสอบและแปลง

- ระบุ **พาธไฟล์ในเครื่อง** (URL จะถูกปฏิเสธ)
- ละเว้นเนื้อหาข้อความ (Discord ปฏิเสธข้อความ + ข้อความเสียงใน payload เดียวกัน)
- รองรับรูปแบบเสียงใดก็ได้; OpenClaw จะแปลงเป็น OGG/Opus ตามต้องการ

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="ใช้งาน intents ที่ไม่อนุญาต หรือบอทไม่เห็นข้อความของ guild">

    - เปิดใช้งาน Message Content Intent
    - เปิดใช้งาน Server Members Intent เมื่อคุณต้องพึ่งพาการ resolve ผู้ใช้/สมาชิก
    - รีสตาร์ท gateway หลังจากเปลี่ยน intents

  </Accordion>

  <Accordion title="ข้อความ guild ถูกบล็อกโดยไม่คาดคิด">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบ allowlist ของ guild ใต้ `channels.discord.guilds`
    - หากมีแมป `channels` ของ guild อยู่ จะอนุญาตเฉพาะช่องที่ระบุไว้เท่านั้น
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
    - กำหนดค่า `requireMention` ผิดตำแหน่ง (ต้องอยู่ใต้ `channels.discord.guilds` หรือรายการ channel)
    - ผู้ส่งถูกบล็อกโดย allowlist `users` ของ guild/channel

  </Accordion>

  <Accordion title="เทิร์น Discord ที่ใช้เวลานานหรือการตอบซ้ำ">

    ล็อกทั่วไป:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    ค่าปรับแต่งคิว Discord gateway:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ค่านี้ควบคุมเฉพาะงาน listener ของ Discord gateway ไม่ใช่อายุของเทิร์น agent

    Discord ไม่ใช้ timeout ที่ channel เป็นเจ้าของกับเทิร์น agent ที่อยู่ในคิว Message listeners จะส่งต่อทันที และการรัน Discord ที่อยู่ในคิวจะรักษาลำดับต่อ session จนกว่า lifecycle ของ session/tool/runtime จะเสร็จสิ้นหรือยกเลิกงาน

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

  <Accordion title="คำเตือน timeout จากการค้นหา metadata ของ Gateway">
    OpenClaw ดึง metadata `/gateway/bot` ของ Discord ก่อนเชื่อมต่อ ความล้มเหลวชั่วคราวจะ fallback ไปยัง URL gateway เริ่มต้นของ Discord และถูกจำกัดอัตราในล็อก

    ค่าปรับแต่ง metadata timeout:

    - บัญชีเดียว: `channels.discord.gatewayInfoTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env fallback เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - ค่าเริ่มต้น: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="READY timeout ของ Gateway ทำให้รีสตาร์ท">
    OpenClaw รอเหตุการณ์ `READY` ของ Discord gateway ระหว่างเริ่มต้นและหลังจาก runtime reconnect การตั้งค่าหลายบัญชีที่มีการ stagger ตอนเริ่มต้นอาจต้องใช้ช่วงเวลา READY ตอนเริ่มต้นที่นานกว่าค่าเริ่มต้น

    ค่าปรับแต่ง READY timeout:

    - เริ่มต้นแบบบัญชีเดียว: `channels.discord.gatewayReadyTimeoutMs`
    - เริ่มต้นแบบหลายบัญชี: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - startup env fallback เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นตอนเริ่มต้น: `15000` (15 วินาที), สูงสุด: `120000`
    - runtime แบบบัญชีเดียว: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime แบบหลายบัญชี: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - runtime env fallback เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ค่าเริ่มต้น runtime: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="permission audit ไม่ตรงกัน">
    การตรวจสอบสิทธิ์ `channels status --probe` ใช้งานได้เฉพาะกับ ID ช่องที่เป็นตัวเลขเท่านั้น

    หากคุณใช้คีย์ slug การจับคู่ runtime ยังอาจทำงานได้ แต่ probe ไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน

  </Accordion>

  <Accordion title="ปัญหา DM และ pairing">

    - ปิดใช้งาน DM: `channels.discord.dm.enabled=false`
    - ปิดใช้งานนโยบาย DM: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - กำลังรอการอนุมัติ pairing ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูปจากบอทถึงบอท">
    โดยค่าเริ่มต้น ข้อความที่บอทเขียนจะถูกเพิกเฉย

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎ mention และ allowlist ที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมลูป
    ควรใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความจากบอทที่ mention บอทนี้

    OpenClaw ยังมาพร้อม [การป้องกันลูปบอท](/th/channels/bot-loop-protection) แบบใช้ร่วมกัน เมื่อใดก็ตามที่ `allowBots` อนุญาตให้ข้อความที่บอทเขียนเข้าสู่ dispatch Discord จะแมปเหตุการณ์ขาเข้าเป็นข้อเท็จจริง `(account, channel, bot pair)` และ pair guard ทั่วไปจะ suppress pair หลังจากเกิน event budget ที่กำหนด guard นี้ป้องกันลูปสองบอทที่ runaway ซึ่งก่อนหน้านี้ต้องหยุดด้วย rate limit ของ Discord; มันไม่กระทบ deployment แบบบอทเดี่ยวหรือการตอบกลับครั้งเดียวจากบอทที่ยังอยู่ใต้ budget

    การตั้งค่าเริ่มต้น (ทำงานเมื่อมีการตั้งค่า `allowBots`):

    - `maxEventsPerWindow: 20` -- bot pair สามารถแลกเปลี่ยนข้อความได้ 20 ข้อความภายใน sliding window
    - `windowSeconds: 60` -- ความยาวของ sliding window
    - `cooldownSeconds: 60` -- เมื่อ budget ถูกใช้จนถึงขีดจำกัดแล้ว ข้อความ bot-to-bot เพิ่มเติมทุกข้อความในทิศทางใดก็ตามจะถูก drop เป็นเวลาหนึ่งนาที

    กำหนดค่า default แบบใช้ร่วมกันหนึ่งครั้งใต้ `channels.defaults.botLoopProtection` แล้ว override Discord เมื่อ workflow ที่ถูกต้องต้องการพื้นที่เผื่อมากขึ้น ลำดับ precedence คือ:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - ค่าเริ่มต้นในตัว

    Discord ใช้คีย์ทั่วไป `maxEventsPerWindow`, `windowSeconds` และ `cooldownSeconds`

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Voice STT drop พร้อม DecryptionFailed(...)">

    - อัปเดต OpenClaw ให้เป็นปัจจุบันอยู่เสมอ (`openclaw update`) เพื่อให้มีตรรกะกู้คืนการรับเสียง Discord
    - ยืนยัน `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้นของ upstream) และปรับเฉพาะเมื่อจำเป็น
    - ดูล็อกสำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากยังเกิดความล้มเหลวต่อหลังจาก rejoin อัตโนมัติ ให้รวบรวมล็อกและเปรียบเทียบกับประวัติการรับ DAVE ของ upstream ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## อ้างอิงการกำหนดค่า

อ้างอิงหลัก: [อ้างอิงการกำหนดค่า - Discord](/th/gateway/config-channels#discord)

<Accordion title="ฟิลด์ Discord ที่ให้สัญญาณสูง">

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- command: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- คิวเหตุการณ์: `eventQueue.listenerTimeout` (listener budget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- reply/history: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (legacy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb` (จำกัดการอัปโหลดขาออกของ Discord, ค่าเริ่มต้น `100MB`), `retry`
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- features: `threadBindings`, top-level `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการปฏิบัติการ

- ถือว่า bot tokens เป็นความลับ (แนะนำ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการกำกับดูแล)
- ให้สิทธิ์ Discord แบบ least-privilege
- หาก command deploy/state ล้าสมัย ให้รีสตาร์ท gateway และตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Discord กับ gateway
  </Card>
  <Card title="Groups" icon="users" href="/th/channels/groups">
    พฤติกรรม group chat และ allowlist
  </Card>
  <Card title="Channel routing" icon="route" href="/th/channels/channel-routing">
    route ข้อความขาเข้าไปยัง agents
  </Card>
  <Card title="Security" icon="shield" href="/th/gateway/security">
    threat model และการ hardening
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/th/concepts/multi-agent">
    แมป guilds และ channels ไปยัง agents
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่ง native
  </Card>
</CardGroup>
