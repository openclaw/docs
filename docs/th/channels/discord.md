---
read_when:
    - กำลังทำงานกับฟีเจอร์ช่องทาง Discord
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของบอต Discord
title: Discord
x-i18n:
    generated_at: "2026-06-30T14:29:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74244c721bfd752bf4ce73a6739503c902a14d07edef5ca6300c87f717669a7e
    source_path: channels/discord.md
    workflow: 16
---

พร้อมสำหรับ DM และช่องกิลด์ผ่าน Gateway อย่างเป็นทางการของ Discord

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    Discord DM ใช้โหมดจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องและโฟลว์การซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

คุณจะต้องสร้างแอปพลิเคชันใหม่พร้อมบอต เพิ่มบอตลงในเซิร์ฟเวอร์ของคุณ และจับคู่กับ OpenClaw เราแนะนำให้เพิ่มบอตของคุณลงในเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากคุณยังไม่มี [ให้สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="สร้างแอปพลิเคชันและบอต Discord">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อประมาณว่า "OpenClaw"

    คลิก **Bot** ในแถบด้านข้าง ตั้งค่า **Username** เป็นชื่อที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้งาน privileged intents">
    ยังอยู่ที่หน้า **Bot** เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้งาน:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับ allowlist ตามบทบาทและการจับคู่ชื่อเป็น ID)
    - **Presence Intent** (ไม่บังคับ; จำเป็นเฉพาะสำหรับการอัปเดตสถานะ presence)

  </Step>

  <Step title="คัดลอกโทเค็นบอตของคุณ">
    เลื่อนกลับขึ้นไปที่หน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อจะเป็นเช่นนั้น การดำเนินการนี้จะสร้างโทเค็นแรกของคุณ โดยไม่มีอะไรถูก "รีเซ็ต"
    </Note>

    คัดลอกโทเค็นและบันทึกไว้ที่ใดที่หนึ่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในอีกไม่นาน

  </Step>

  <Step title="สร้าง URL เชิญและเพิ่มบอตลงในเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** ในแถบด้านข้าง คุณจะสร้าง URL เชิญพร้อมสิทธิ์ที่ถูกต้องเพื่อเพิ่มบอตลงในเซิร์ฟเวอร์ของคุณ

    เลื่อนลงไปที่ **OAuth2 URL Generator** แล้วเปิดใช้งาน:

    - `bot`
    - `applications.commands`

    ส่วน **Bot Permissions** จะปรากฏด้านล่าง เปิดใช้งานอย่างน้อย:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (ไม่บังคับ)

    นี่คือชุดพื้นฐานสำหรับช่องข้อความปกติ หากคุณวางแผนจะโพสต์ในเธรด Discord รวมถึงเวิร์กโฟลว์ช่อง forum หรือ media ที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้งาน **Send Messages in Threads** ด้วย
    คัดลอก URL ที่สร้างขึ้นด้านล่าง วางลงในเบราว์เซอร์ของคุณ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอตของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิดใช้งาน Developer Mode และรวบรวม ID ของคุณ">
    กลับไปที่แอป Discord คุณต้องเปิดใช้งาน Developer Mode เพื่อให้คัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนเฟืองถัดจากอวาตาร์ของคุณ) → เลื่อนไปที่ **Developer** ในแถบด้านข้าง → เปิด **Developer Mode**

        *(หมายเหตุ: ในแอป Discord บนมือถือ Developer Mode อยู่ใต้ **App Settings** → **Advanced**)*

    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ของคุณไว้พร้อมกับ Bot Token คุณจะส่งทั้งสามอย่างให้ OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาต DM จากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงาน Discord ต้องอนุญาตให้บอตของคุณส่ง DM ถึงคุณได้ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณ → **Privacy Settings** → เปิด **Direct Messages**

    การตั้งค่านี้ทำให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอต) ส่ง DM ถึงคุณได้ เปิดค่านี้ไว้หากคุณต้องการใช้ Discord DM กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่องกิลด์ คุณสามารถปิด DM หลังจากจับคู่แล้วได้

  </Step>

  <Step title="ตั้งค่าโทเค็นบอตของคุณอย่างปลอดภัย (อย่าส่งในแชท)">
    โทเค็นบอต Discord ของคุณเป็นข้อมูลลับ (เหมือนรหัสผ่าน) ตั้งค่าบนเครื่องที่รัน OpenClaw ก่อนส่งข้อความถึงเอเจนต์ของคุณ

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

    หาก OpenClaw กำลังรันเป็นบริการเบื้องหลังอยู่แล้ว ให้รีสตาร์ทผ่านแอป OpenClaw Mac หรือโดยหยุดแล้วเริ่มกระบวนการ `openclaw gateway run` ใหม่
    สำหรับการติดตั้งเป็นบริการที่จัดการไว้ ให้รัน `openclaw gateway install` จาก shell ที่มี `DISCORD_BOT_TOKEN` อยู่ หรือเก็บตัวแปรไว้ใน `~/.openclaw/.env` เพื่อให้บริการสามารถ resolve env SecretRef ได้หลังรีสตาร์ท
    หากโฮสต์ของคุณถูกบล็อกหรือถูกจำกัดอัตราโดยการ lookup แอปพลิเคชันตอนเริ่มต้นของ Discord ให้ตั้งค่า application/client ID ของ Discord จาก Developer Portal เพื่อให้การเริ่มต้นข้าม REST call นั้นได้ ใช้ `channels.discord.applicationId` สำหรับบัญชีเริ่มต้น หรือ `channels.discord.accounts.<accountId>.applicationId` เมื่อคุณรันบอต Discord หลายตัว

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        แชทกับเอเจนต์ OpenClaw ของคุณในช่องที่มีอยู่ใดก็ได้ (เช่น Telegram) แล้วบอกข้อมูลนี้ หาก Discord เป็นช่องแรกของคุณ ให้ใช้แท็บ CLI / config แทน

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

        สำหรับการตั้งค่าแบบสคริปต์หรือระยะไกล ให้เขียนบล็อก JSON5 เดียวกันด้วย `openclaw config patch --file ./discord.patch.json5 --dry-run` แล้วรันอีกครั้งโดยไม่มี `--dry-run` รองรับค่า `token` แบบ plaintext และรองรับค่า SecretRef สำหรับ `channels.discord.token` ผ่านผู้ให้บริการ env/file/exec เช่นกัน ดู [การจัดการความลับ](/th/gateway/secrets)

        สำหรับบอต Discord หลายตัว ให้เก็บโทเค็นบอตและ application ID แต่ละตัวไว้ใต้บัญชีของมันเอง `channels.discord.applicationId` ระดับบนสุดจะถูกสืบทอดโดยบัญชี ดังนั้นให้ตั้งไว้ตรงนั้นเฉพาะเมื่อทุกบัญชีควรใช้ application ID เดียวกัน

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
    รอจนกว่า Gateway จะรันอยู่ จากนั้น DM ไปหาบอตของคุณใน Discord บอตจะตอบกลับด้วยรหัสจับคู่

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        ส่งรหัสจับคู่ให้เอเจนต์ของคุณในช่องที่มีอยู่:

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

    ตอนนี้คุณควรสามารถแชทกับเอเจนต์ของคุณใน Discord ผ่าน DM ได้แล้ว

  </Step>
</Steps>

<Note>
การ resolve โทเค็นรับรู้ตามบัญชี ค่าโทเค็นใน config ชนะ env fallback `DISCORD_BOT_TOKEN` ใช้เฉพาะกับบัญชีเริ่มต้นเท่านั้น
หากบัญชี Discord ที่เปิดใช้งานสองบัญชี resolve เป็นโทเค็นบอตเดียวกัน OpenClaw จะเริ่ม gateway monitor เพียงหนึ่งตัวสำหรับโทเค็นนั้น โทเค็นที่มาจาก config จะชนะ env fallback เริ่มต้น มิฉะนั้นบัญชีแรกที่เปิดใช้งานจะชนะ และบัญชีที่ซ้ำจะถูกรายงานว่าปิดใช้งาน
สำหรับการเรียก outbound ขั้นสูง (message tool/channel actions) จะใช้ `token` แบบระบุต่อการเรียกสำหรับการเรียกนั้น การตั้งค่านี้ใช้กับ action แบบส่งและอ่าน/probe-style (เช่น read/search/fetch/thread/pins/permissions) การตั้งค่านโยบายบัญชี/ลองใหม่ยังมาจากบัญชีที่เลือกใน runtime snapshot ที่ใช้งานอยู่
</Note>

## แนะนำ: ตั้งค่าพื้นที่ทำงานกิลด์

เมื่อ DM ทำงานแล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็นพื้นที่ทำงานเต็มรูปแบบที่แต่ละช่องมีเซสชันเอเจนต์ของตัวเองพร้อมบริบทของตัวเอง แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีแค่คุณกับบอตของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณลงใน allowlist ของกิลด์">
    การตั้งค่านี้ทำให้เอเจนต์ของคุณตอบกลับในช่องใดก็ได้บนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ DM

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
    ตามค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในช่องกิลด์เมื่อถูก @mentioned เท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณน่าจะต้องการให้ตอบกลับทุกข้อความ

    ในช่องกิลด์ การตอบกลับปกติจะโพสต์โดยอัตโนมัติตามค่าเริ่มต้น สำหรับห้องแชร์ที่เปิดตลอด ให้เลือกใช้ `messages.groupChat.visibleReplies: "message_tool"` เพื่อให้เอเจนต์เฝ้าดูอย่างเงียบ ๆ และโพสต์เฉพาะเมื่อมันตัดสินใจว่าการตอบกลับในช่องมีประโยชน์ วิธีนี้ทำงานได้ดีที่สุดกับโมเดลรุ่นล่าสุดที่ใช้เครื่องมือได้เชื่อถือได้ เช่น GPT 5.5 เหตุการณ์ห้องแบบ ambient จะเงียบไว้เว้นแต่เครื่องมือจะส่ง ดู [เหตุการณ์ห้องแบบ ambient](/th/channels/ambient-room-events) สำหรับ config โหมดเฝ้าดูแบบเต็ม

    หาก Discord แสดงว่ากำลังพิมพ์และล็อกแสดงการใช้โทเค็นแต่ไม่มีข้อความที่โพสต์ ให้ตรวจสอบว่าเทิร์นนั้นถูกกำหนดค่าเป็นเหตุการณ์ห้องแบบ ambient หรือเลือกใช้การตอบกลับที่มองเห็นได้ผ่าน message-tool หรือไม่

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

        หากต้องการบังคับให้ใช้ message-tool sends สำหรับการตอบกลับกลุ่ม/ช่องที่มองเห็นได้ ให้ตั้งค่า `messages.groupChat.visibleReplies: "message_tool"`

      </Tab>
    </Tabs>

  </Step>

  <Step title="วางแผนสำหรับหน่วยความจำในช่องกิลด์">
    ตามค่าเริ่มต้น หน่วยความจำระยะยาว (MEMORY.md) จะโหลดเฉพาะในเซสชัน DM ช่องกิลด์จะไม่โหลด MEMORY.md โดยอัตโนมัติ

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "When I ask questions in Discord channels, use memory_search or memory_get if you need long-term context from MEMORY.md."
      </Tab>
      <Tab title="Manual">
        หากคุณต้องการบริบทที่แชร์ในทุกช่อง ให้ใส่คำสั่งที่เสถียรไว้ใน `AGENTS.md` หรือ `USER.md` (สิ่งเหล่านี้ถูกฉีดเข้าไปในทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงตามต้องการด้วยเครื่องมือ memory
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างช่องบางช่องบนเซิร์ฟเวอร์ Discord ของคุณแล้วเริ่มแชท เอเจนต์ของคุณสามารถเห็นชื่อช่อง และแต่ละช่องจะมีเซสชันแยกของตัวเอง ดังนั้นคุณจึงตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ตามที่เหมาะกับเวิร์กโฟลว์ของคุณได้

## โมเดล runtime

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord.
- การกำหนดเส้นทางการตอบกลับเป็นแบบกำหนดได้แน่นอน: การตอบกลับขาเข้าจาก Discord จะกลับไปยัง Discord.
- เมตาดาต้าของกิลด์/ช่อง Discord จะถูกเพิ่มลงในพรอมป์ของโมเดลเป็นบริบทที่ไม่น่าเชื่อถือ
  ไม่ใช่คำนำหน้าการตอบกลับที่ผู้ใช้มองเห็น หากโมเดลคัดลอกซองข้อมูลนั้น
  กลับมา OpenClaw จะตัดเมตาดาต้าที่ถูกคัดลอกออกจากการตอบกลับขาออกและจาก
  บริบทการเล่นซ้ำในอนาคต
- โดยค่าเริ่มต้น (`session.dmScope=main`) แชตโดยตรงจะแชร์เซสชันหลักของเอเจนต์ (`agent:main:main`).
- ช่องกิลด์เป็นคีย์เซสชันที่แยกกัน (`agent:<agentId>:discord:channel:<channelId>`).
- Group DM จะถูกละเว้นโดยค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`).
- คำสั่งสแลชแบบเนทีฟจะทำงานในเซสชันคำสั่งที่แยกกัน (`agent:<agentId>:discord:slash:<userId>`) ขณะที่ยังคงพก `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่ถูกกำหนดเส้นทาง
- การส่งประกาศ cron/heartbeat แบบข้อความเท่านั้นไปยัง Discord ใช้คำตอบสุดท้าย
  ที่ผู้ช่วยมองเห็นหนึ่งครั้ง เพย์โหลดสื่อและคอมโพเนนต์แบบมีโครงสร้างยังคงเป็น
  หลายข้อความเมื่อเอเจนต์ปล่อยเพย์โหลดที่ส่งมอบได้หลายรายการ

## ช่องฟอรัม

ช่องฟอรัมและช่องสื่อของ Discord รับเฉพาะโพสต์ในเธรดเท่านั้น OpenClaw รองรับสองวิธีในการสร้าง:

- ส่งข้อความไปยังฟอรัมหลัก (`channel:<forumId>`) เพื่อสร้างเธรดอัตโนมัติ ชื่อเธรดจะใช้บรรทัดแรกที่ไม่ว่างของข้อความของคุณ
- ใช้ `openclaw message thread create` เพื่อสร้างเธรดโดยตรง อย่าส่ง `--message-id` สำหรับช่องฟอรัม

ตัวอย่าง: ส่งไปยังฟอรัมหลักเพื่อสร้างเธรด

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

ตัวอย่าง: สร้างเธรดฟอรัมโดยระบุอย่างชัดเจน

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

ฟอรัมหลักไม่รับคอมโพเนนต์ Discord หากคุณต้องการคอมโพเนนต์ ให้ส่งไปยังเธรดนั้นเอง (`channel:<threadId>`).

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับคอนเทนเนอร์คอมโพเนนต์ Discord v2 สำหรับข้อความของเอเจนต์ ใช้เครื่องมือข้อความพร้อมเพย์โหลด `components` ผลลัพธ์จากการโต้ตอบจะถูกกำหนดเส้นทางกลับไปยังเอเจนต์เป็นข้อความขาเข้าปกติ และทำตามการตั้งค่า Discord `replyToMode` ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถวแอ็กชันอนุญาตให้มีปุ่มได้สูงสุด 5 ปุ่มหรือเมนูเลือกเดี่ยวหนึ่งรายการ
- ประเภทการเลือก: `string`, `user`, `role`, `mentionable`, `channel`

โดยค่าเริ่มต้น คอมโพเนนต์ใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่ออนุญาตให้ปุ่ม ตัวเลือก และฟอร์มถูกใช้ได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดว่าใครสามารถคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (ID ผู้ใช้ Discord, แท็ก หรือ `*`) เมื่อกำหนดค่าแล้ว ผู้ใช้ที่ไม่ตรงกันจะได้รับการปฏิเสธแบบ ephemeral

คอลแบ็กของคอมโพเนนต์หมดอายุหลัง 30 นาทีโดยค่าเริ่มต้น ตั้งค่า `channels.discord.agentComponents.ttlMs` เพื่อเปลี่ยนอายุรีจิสทรีคอลแบ็กนั้นสำหรับบัญชี Discord เริ่มต้น หรือ `channels.discord.accounts.<accountId>.agentComponents.ttlMs` เพื่อแทนที่บัญชีหนึ่งบัญชีในการตั้งค่าหลายบัญชี ค่านี้เป็นมิลลิวินาที ต้องเป็นจำนวนเต็มบวก และมีเพดานที่ `86400000` (24 ชั่วโมง) TTL ที่ยาวขึ้นมีประโยชน์สำหรับเวิร์กโฟลว์รีวิวหรืออนุมัติที่ต้องให้ปุ่มยังใช้งานได้ แต่ก็ขยายช่วงเวลาที่ข้อความ Discord เก่ายังสามารถทริกเกอร์แอ็กชันได้ด้วย ควรใช้ TTL ที่สั้นที่สุดที่พอดีกับเวิร์กโฟลว์ และคงค่าเริ่มต้นไว้เมื่อคอลแบ็กที่ค้างเก่าอาจทำให้สับสน

คำสั่งสแลช `/model` และ `/models` เปิดตัวเลือกโมเดลแบบโต้ตอบ พร้อมดรอปดาวน์ผู้ให้บริการ โมเดล และรันไทม์ที่เข้ากันได้ รวมถึงขั้นตอน Submit `/models add` ถูกเลิกใช้แล้ว และตอนนี้จะส่งคืนข้อความเลิกใช้แทนการลงทะเบียนโมเดลจากแชต การตอบกลับของตัวเลือกเป็นแบบ ephemeral และมีเพียงผู้ใช้ที่เรียกใช้เท่านั้นที่สามารถใช้งานได้ เมนูเลือกของ Discord จำกัดไว้ที่ 25 ตัวเลือก ดังนั้นให้เพิ่มรายการ `provider/*` ลงใน `agents.defaults.models` เมื่อคุณต้องการให้ตัวเลือกแสดงโมเดลที่ค้นพบแบบไดนามิกเฉพาะสำหรับผู้ให้บริการที่เลือก เช่น `openai` หรือ `vllm`

ไฟล์แนบ:

- บล็อก `file` ต้องชี้ไปยังการอ้างอิงไฟล์แนบ (`attachment://<filename>`)
- ระบุไฟล์แนบผ่าน `media`/`path`/`filePath` (ไฟล์เดียว); ใช้ `media-gallery` สำหรับหลายไฟล์
- ใช้ `filename` เพื่อแทนที่ชื่ออัปโหลดเมื่อควรตรงกับการอ้างอิงไฟล์แนบ

ฟอร์มโมดอล:

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
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM `channels.discord.allowFrom` คือ allowlist ของ DM แบบ canonical

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.discord.allowFrom` รวม `"*"`)
    - `disabled`

    หากนโยบาย DM ไม่ได้เปิด ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือถูกแจ้งให้จับคู่ในโหมด `pairing`)

    ลำดับความสำคัญแบบหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - สำหรับหนึ่งบัญชี `allowFrom` มีลำดับความสำคัญเหนือ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อ `allowFrom` ของตนเองและ `dm.allowFrom` แบบเดิมไม่ได้ตั้งค่าไว้
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    `channels.discord.dm.policy` และ `channels.discord.dm.allowFrom` แบบเดิมยังคงอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การกล่าวถึง `<@id>`

    ID ตัวเลขล้วนโดยปกติจะแก้เป็น ID ช่องเมื่อมีค่าเริ่มต้นของช่องที่ใช้งานอยู่ แต่ ID ที่อยู่ใน DM `allowFrom` ที่มีผลของบัญชีจะถูกปฏิบัติเป็นเป้าหมาย DM ของผู้ใช้เพื่อความเข้ากันได้

  </Tab>

  <Tab title="Access groups">
    DM ของ Discord และการอนุญาตคำสั่งข้อความสามารถใช้รายการ `accessGroup:<name>` แบบไดนามิกใน `channels.discord.allowFrom`

    ชื่อกลุ่มการเข้าถึงใช้ร่วมกันระหว่างช่องข้อความ ใช้ `type: "message.senders"` สำหรับกลุ่มแบบคงที่ที่สมาชิกแสดงด้วยไวยากรณ์ `allowFrom` ปกติของแต่ละช่อง หรือ `type: "discord.channelAudience"` เมื่อกลุ่มผู้ชม `ViewChannel` ปัจจุบันของช่อง Discord ควรกำหนดสมาชิกแบบไดนามิก พฤติกรรมกลุ่มการเข้าถึงที่ใช้ร่วมกันมีบันทึกไว้ที่นี่: [กลุ่มการเข้าถึง](/th/channels/access-groups)

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

    ช่องข้อความ Discord ไม่มีรายชื่อสมาชิกแยกต่างหาก `type: "discord.channelAudience"` จำลองสมาชิกภาพเป็น: ผู้ส่ง DM เป็นสมาชิกของกิลด์ที่กำหนดค่าไว้ และปัจจุบันมีสิทธิ์ `ViewChannel` ที่มีผลบนช่องที่กำหนดค่าไว้ หลังจากใช้การเขียนทับของบทบาทและช่องแล้ว

    ตัวอย่าง: อนุญาตให้ใครก็ตามที่มองเห็น `#maintainers` ส่ง DM ถึงบอทได้ ขณะที่ยังปิด DM สำหรับทุกคนอื่น

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

    การค้นหาจะล้มเหลวแบบปิด หาก Discord ส่งคืน `Missing Access` การค้นหาสมาชิกล้มเหลว หรือช่องเป็นของกิลด์อื่น ผู้ส่ง DM จะถูกปฏิบัติว่าไม่ได้รับอนุญาต

    เปิดใช้งาน **Server Members Intent** ของ Discord Developer Portal สำหรับบอทเมื่อใช้กลุ่มการเข้าถึงแบบผู้ชมช่อง DM ไม่มีสถานะสมาชิกกิลด์ ดังนั้น OpenClaw จะแก้สมาชิกผ่าน Discord REST ณ เวลาที่อนุญาต

  </Tab>

  <Tab title="Guild policy">
    การจัดการกิลด์ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    พื้นฐานที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    พฤติกรรม `allowlist`:

    - กิลด์ต้องตรงกับ `channels.discord.guilds` (แนะนำให้ใช้ `id`, รับ slug ได้)
    - allowlist ของผู้ส่งแบบไม่บังคับ: `users` (แนะนำ ID ที่เสถียร) และ `roles` (เฉพาะ ID บทบาท); หากกำหนดค่าอย่างใดอย่างหนึ่ง ผู้ส่งจะได้รับอนุญาตเมื่อจับคู่กับ `users` หรือ `roles`
    - การจับคู่ชื่อ/แท็กโดยตรงถูกปิดใช้งานโดยค่าเริ่มต้น; เปิด `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเป็นโหมดความเข้ากันได้แบบฉุกเฉิน
    - รองรับชื่อ/แท็กสำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อมีการใช้รายการชื่อ/แท็ก
    - หากกิลด์มีการกำหนดค่า `channels` ช่องที่ไม่ได้อยู่ในรายการจะถูกปฏิเสธ
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

    หากคุณตั้งค่าเฉพาะ `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` fallback ของรันไทม์คือ `groupPolicy="allowlist"` (พร้อมคำเตือนในล็อก) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`

  </Tab>

  <Tab title="Mentions and group DMs">
    ข้อความกิลด์ถูกควบคุมด้วยการกล่าวถึงโดยค่าเริ่มต้น

    การตรวจจับการกล่าวถึงรวมถึง:

    - การกล่าวถึงบอทโดยตรง
    - รูปแบบการกล่าวถึงที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับถึงบอทโดยนัยในกรณีที่รองรับ

    เมื่อเขียนข้อความ Discord ขาออก ให้ใช้ไวยากรณ์การกล่าวถึงแบบ canonical: `<@USER_ID>` สำหรับผู้ใช้, `<#CHANNEL_ID>` สำหรับช่อง และ `<@&ROLE_ID>` สำหรับบทบาท อย่าใช้รูปแบบการกล่าวถึงชื่อเล่นแบบเดิม `<@!USER_ID>`

    `requireMention` ถูกกำหนดค่าต่อกิลด์/ช่อง (`channels.discord.guilds...`).
    `ignoreOtherMentions` สามารถเลือกให้ทิ้งข้อความที่กล่าวถึงผู้ใช้/บทบาทอื่นแต่ไม่ได้กล่าวถึงบอท (ยกเว้น @everyone/@here)

    Group DM:

    - ค่าเริ่มต้น: ละเว้น (`dm.groupEnabled=false`)
    - allowlist แบบไม่บังคับผ่าน `dm.groupChannels` (ID ช่องหรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตามบทบาท

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิกกิลด์ Discord ไปยัง agent ต่าง ๆ ตาม ID ของบทบาท การผูกตามบทบาทรับเฉพาะ ID ของบทบาทเท่านั้น และจะถูกประเมินหลังจากการผูกแบบ peer หรือ parent-peer และก่อนการผูกแบบเฉพาะกิลด์ หากการผูกหนึ่งตั้งค่าฟิลด์ match อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ฟิลด์ที่กำหนดไว้ทั้งหมดต้องตรงกัน

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

- `commands.native` มีค่าเริ่มต้นเป็น `"auto"` และเปิดใช้งานสำหรับ Discord
- การ override ราย channel: `channels.discord.commands.native`
- `commands.native=false` จะข้ามการลงทะเบียนและการล้างคำสั่ง slash ของ Discord ระหว่างเริ่มต้น คำสั่งที่เคยลงทะเบียนไว้อาจยังมองเห็นได้ใน Discord จนกว่าคุณจะลบออกจากแอป Discord
- การตรวจสอบสิทธิ์คำสั่งเนทีฟใช้ allowlist/นโยบายของ Discord ชุดเดียวกับการจัดการข้อความปกติ
- คำสั่งอาจยังมองเห็นได้ใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต แต่การดำเนินการยังคงบังคับใช้การตรวจสอบสิทธิ์ของ OpenClaw และส่งคืน "ไม่ได้รับอนุญาต"

ดู [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งและพฤติกรรม

การตั้งค่าคำสั่ง slash เริ่มต้น:

- `ephemeral: true`

## รายละเอียดฟีเจอร์

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord รองรับแท็กตอบกลับในเอาต์พุตของ agent:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    ควบคุมโดย `channels.discord.replyToMode`:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`
    - `batched`

    หมายเหตุ: `off` ปิดการทำเธรดตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงถูกใช้งาน
    `first` จะแนบอ้างอิงการตอบกลับเนทีฟโดยนัยกับข้อความ Discord ขาออกแรกของ turn เสมอ
    `batched` จะแนบอ้างอิงการตอบกลับเนทีฟโดยนัยของ Discord เฉพาะเมื่อ
    เหตุการณ์ขาเข้าเป็นชุดข้อความหลายรายการที่ถูก debounce แล้ว สิ่งนี้มีประโยชน์
    เมื่อคุณต้องการให้การตอบกลับเนทีฟใช้เป็นหลักกับแชตที่มาเป็นชุดและกำกวม ไม่ใช่ทุก
    turn ที่มีข้อความเดียว

    ID ข้อความจะแสดงใน context/history เพื่อให้ agent กำหนดเป้าหมายข้อความเฉพาะได้

  </Accordion>

  <Accordion title="Link previews">
    โดยค่าเริ่มต้น Discord จะสร้าง embed ลิงก์แบบ rich สำหรับ URL OpenClaw จะปิดกั้น embed ที่สร้างขึ้นเหล่านั้นในข้อความ Discord ขาออกตามค่าเริ่มต้น ดังนั้น URL ที่ agent ส่งจะยังเป็นลิงก์ธรรมดา เว้นแต่คุณจะเลือกเปิดใช้:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    ตั้งค่า `channels.discord.accounts.<id>.suppressEmbeds` เพื่อ override บัญชีหนึ่งบัญชี การส่งผ่าน message-tool ของ agent ยังสามารถส่ง `suppressEmbeds: false` สำหรับข้อความเดียวได้ด้วย payload `embeds` ของ Discord แบบชัดเจนจะไม่ถูกปิดกั้นโดยการตั้งค่า link-preview เริ่มต้น

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw สามารถสตรีมร่างคำตอบได้โดยส่งข้อความชั่วคราวและแก้ไขเมื่อมีข้อความเข้ามา `channels.discord.streaming` รับค่า `off` | `partial` | `block` | `progress` (ค่าเริ่มต้น) `progress` เก็บร่างสถานะที่แก้ไขได้หนึ่งรายการและอัปเดตด้วยความคืบหน้าของเครื่องมือจนกว่าจะส่งขั้นสุดท้าย ป้ายกำกับเริ่มต้นที่ใช้ร่วมกันเป็นบรรทัดแบบเลื่อนต่อเนื่อง จึงเลื่อนหายไปเหมือนส่วนอื่นเมื่อมีงานมากพอปรากฏ `streamMode` เป็น alias runtime เดิม เรียกใช้ `openclaw doctor --fix` เพื่อเขียน config ที่เก็บไว้ใหม่ไปยังคีย์ canonical

    ตั้งค่า `channels.discord.streaming.mode` เป็น `off` เพื่อปิดการแก้ไขตัวอย่าง Discord หากเปิดใช้การสตรีมแบบ block ของ Discord อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

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

    - `partial` แก้ไขข้อความตัวอย่างรายการเดียวเมื่อ token มาถึง
    - `block` ส่งชิ้นส่วนขนาดร่าง (ใช้ `draftChunk` เพื่อปรับขนาดและจุดแบ่ง โดยจำกัดไม่เกิน `textChunkLimit`)
    - ผลลัพธ์สุดท้ายที่เป็นสื่อ ข้อผิดพลาด และการตอบกลับแบบชัดเจนจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความตัวอย่างซ้ำหรือไม่
    - แถวเครื่องมือ/ความคืบหน้าแสดงเป็น emoji แบบกะทัดรัด + ชื่อ + รายละเอียดเมื่อมี เช่น `🛠️ Bash: run tests` หรือ `🔎 Web Search: for "query"`
    - `streaming.progress.commentary` (ค่าเริ่มต้น `false`) เลือกเปิดใช้ข้อความคำอธิบาย/คำนำของ assistant ในร่างความคืบหน้าชั่วคราว คำอธิบายจะถูกล้างก่อนแสดงผล ยังคงเป็นแบบชั่วคราว และไม่เปลี่ยนการส่งคำตอบขั้นสุดท้าย
    - `streaming.progress.maxLineChars` ควบคุมงบประมาณตัวอย่างความคืบหน้าต่อบรรทัด ข้อความร้อยแก้วจะถูกย่อบนขอบเขตคำ ส่วนรายละเอียดคำสั่งและ path จะเก็บ suffix ที่มีประโยชน์ไว้
    - `streaming.preview.commandText` / `streaming.progress.commandText` ควบคุมรายละเอียดคำสั่ง/exec ในบรรทัดความคืบหน้าแบบกะทัดรัด: `raw` (ค่าเริ่มต้น) หรือ `status` (เฉพาะป้ายกำกับเครื่องมือ)

    ซ่อนข้อความคำสั่ง/exec ดิบโดยยังคงเก็บบรรทัดความคืบหน้าแบบกะทัดรัดไว้:

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

    การสตรีมตัวอย่างรองรับเฉพาะข้อความเท่านั้น การตอบกลับแบบสื่อจะ fallback ไปยังการส่งปกติ เมื่อเปิดใช้การสตรีมแบบ `block` อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    context ประวัติกิลด์:

    - ค่าเริ่มต้น `channels.discord.historyLimit` คือ `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    การควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมเธรด:

    - เธรด Discord จะกำหนดเส้นทางเป็น session ของ channel และสืบทอด config ของ channel แม่ เว้นแต่จะถูก override
    - session ของเธรดสืบทอดการเลือก `/model` ระดับ session ของ channel แม่เป็น fallback เฉพาะ model; การเลือก `/model` ในเธรดเองยังคงมีลำดับความสำคัญเหนือกว่า และประวัติ transcript ของแม่จะไม่ถูกคัดลอก เว้นแต่เปิดใช้การสืบทอด transcript
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) เลือกให้ auto-thread ใหม่ seed จาก transcript ของแม่ การ override รายบัญชีอยู่ใต้ `channels.discord.accounts.<id>.thread.inheritParent`
    - reaction จาก message-tool สามารถ resolve เป้าหมาย DM แบบ `user:<id>` ได้
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะถูกคงไว้ระหว่าง fallback การเปิดใช้งานขั้นตอนตอบกลับ

    topic ของ channel จะถูกฉีดเข้าเป็น context ที่ **ไม่น่าเชื่อถือ** allowlist ควบคุมว่าใครสามารถ trigger agent ได้ ไม่ใช่ขอบเขตการ redact supplemental-context แบบเต็มรูปแบบ

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord สามารถผูกเธรดกับเป้าหมาย session เพื่อให้ข้อความติดตามผลในเธรดนั้นยังคงกำหนดเส้นทางไปยัง session เดิม (รวมถึง session ของ subagent)

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/ใหม่กับเป้าหมาย subagent/session
    - `/unfocus` ลบการผูกเธรดปัจจุบัน
    - `/agents` แสดง run ที่ใช้งานอยู่และสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดต auto-unfocus เมื่อไม่มีกิจกรรมสำหรับการผูกที่ focus อยู่
    - `/session max-age <duration|off>` ตรวจสอบ/อัปเดตอายุสูงสุดแบบ hard สำหรับการผูกที่ focus อยู่

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

    - `session.threadBindings.*` ตั้งค่าเริ่มต้น global
    - `channels.discord.threadBindings.*` override พฤติกรรม Discord
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดย่อยอัตโนมัติสำหรับ `sessions_spawn({ thread: true })` และการ spawn เธรด ACP ค่าเริ่มต้น: `true`
    - `defaultSpawnContext` ควบคุม context ของ subagent เนทีฟสำหรับการ spawn ที่ผูกกับเธรด ค่าเริ่มต้น: `"fork"`
    - คีย์ `spawnSubagentSessions`/`spawnAcpSessions` ที่เลิกใช้แล้วจะถูก migrate โดย `openclaw doctor --fix`
    - หากการผูกเธรดถูกปิดใช้งานสำหรับบัญชีหนึ่ง `/focus` และการดำเนินการผูกเธรดที่เกี่ยวข้องจะใช้ไม่ได้

    ดู [Sub-agents](/th/tools/subagents), [Agent ACP](/th/tools/acp-agents) และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    สำหรับ workspace ACP แบบ "always-on" ที่เสถียร ให้กำหนดค่าการผูก ACP แบบ typed ระดับบนสุดที่กำหนดเป้าหมายไปยัง conversation ของ Discord

    Config path:

    - `bindings[]` ที่มี `type: "acp"` และ `match.channel: "discord"`

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

    - `/acp spawn codex --bind here` ผูก channel หรือเธรดปัจจุบันไว้ในตำแหน่งเดิม และเก็บข้อความในอนาคตไว้บน session ACP เดิม ข้อความในเธรดสืบทอดการผูกของ channel แม่
    - ใน channel หรือเธรดที่ถูกผูก `/new` และ `/reset` จะ reset session ACP เดิมในตำแหน่งเดิม การผูกเธรดชั่วคราวสามารถ override การ resolve เป้าหมายขณะใช้งานอยู่
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดย่อยผ่าน `--thread auto|here`

    ดู [Agent ACP](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมการผูก

  </Accordion>

  <Accordion title="Reaction notifications">
    โหมดการแจ้งเตือน reaction รายกิลด์:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    เหตุการณ์ reaction จะถูกแปลงเป็นเหตุการณ์ระบบและแนบกับ session Discord ที่ถูกกำหนดเส้นทาง

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` ส่ง emoji รับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback เป็น emoji ตัวตนของ agent (`agents.list[].identity.emoji` มิฉะนั้น "👀")

    หมายเหตุ:

    - Discord รับ emoji unicode หรือชื่อ emoji แบบกำหนดเอง
    - ใช้ `""` เพื่อปิด reaction สำหรับ channel หรือบัญชี

  </Accordion>

  <Accordion title="Config writes">
    การเขียน config ที่เริ่มโดย channel เปิดใช้งานตามค่าเริ่มต้น

    สิ่งนี้มีผลต่อ flow `/config set|unset` (เมื่อเปิดใช้งานฟีเจอร์คำสั่ง)

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
    กำหนดเส้นทางทราฟฟิก WebSocket ของ Gateway Discord และการ lookup REST ตอนเริ่มต้น (application ID + การ resolve allowlist) ผ่านพร็อกซี HTTP(S) ด้วย `channels.discord.proxy`

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
    เปิดใช้การ resolve PluralKit เพื่อ map ข้อความที่ถูก proxy ไปยังตัวตนของสมาชิกระบบ:

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
    - ชื่อที่แสดงของสมาชิกจะจับคู่ตามชื่อ/slug เฉพาะเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การค้นหาใช้ ID ข้อความต้นฉบับและถูกจำกัดด้วยกรอบเวลา
    - หากการค้นหาล้มเหลว ข้อความที่ถูกพร็อกซีจะถูกถือเป็นข้อความของบอตและถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    ใช้ `mentionAliases` เมื่อเอเจนต์ต้องการการกล่าวถึงขาออกแบบกำหนดแน่นอนสำหรับผู้ใช้ Discord ที่รู้จัก คีย์คือ handle ที่ไม่มี `@` นำหน้า ค่าเป็น ID ผู้ใช้ Discord ส่วน handle ที่ไม่รู้จัก, `@everyone`, `@here` และการกล่าวถึงภายใน code span ของ Markdown จะคงไว้ไม่เปลี่ยนแปลง

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

    ตัวอย่างกิจกรรม (สถานะแบบกำหนดเองเป็นประเภทกิจกรรมเริ่มต้น):

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

    แผนผังประเภทกิจกรรม:

    - 0: กำลังเล่น
    - 1: กำลังสตรีม (ต้องใช้ `activityUrl`)
    - 2: กำลังฟัง
    - 3: กำลังดู
    - 4: กำหนดเอง (ใช้ข้อความกิจกรรมเป็นสถานะ; emoji เป็นตัวเลือก)
    - 5: กำลังแข่งขัน

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

    auto presence จับคู่ความพร้อมใช้งานของ runtime กับสถานะ Discord: healthy => online, degraded หรือ unknown => idle, exhausted หรือ unavailable => dnd การแทนที่ข้อความแบบไม่บังคับ:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับ placeholder `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord รองรับการจัดการการอนุมัติด้วยปุ่มใน DM และสามารถโพสต์พรอมต์การอนุมัติในช่องต้นทางได้ตามต้องการ

    พาธการกำหนดค่า:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; fallback ไปที่ `commands.ownerAllowFrom` เมื่อเป็นไปได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord จะเปิดใช้การอนุมัติ exec แบบ native โดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และมีผู้อนุมัติอย่างน้อยหนึ่งรายที่ resolve ได้ ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมานผู้อนุมัติ exec จากช่อง `allowFrom`, `dm.allowFrom` แบบ legacy หรือ `defaultTo` ของ direct-message ตั้งค่า `enabled: false` เพื่อปิดใช้ Discord เป็นไคลเอนต์การอนุมัติแบบ native อย่างชัดเจน

    สำหรับคำสั่งกลุ่มที่ละเอียดอ่อนและจำกัดเฉพาะเจ้าของ เช่น `/diagnostics` และ `/export-trajectory` OpenClaw จะส่งพรอมต์การอนุมัติและผลลัพธ์สุดท้ายแบบส่วนตัว ระบบจะลองใช้ Discord DM ก่อนเมื่อเจ้าของที่เรียกใช้มีเส้นทางเจ้าของ Discord หากไม่มี จะ fallback ไปยังเส้นทางเจ้าของแรกที่พร้อมใช้งานจาก `commands.ownerAllowFrom` เช่น Telegram

    เมื่อ `target` เป็น `channel` หรือ `both` พรอมต์การอนุมัติจะมองเห็นได้ในช่อง เฉพาะผู้อนุมัติที่ resolve แล้วเท่านั้นที่ใช้ปุ่มได้ ผู้ใช้อื่นจะได้รับการปฏิเสธแบบ ephemeral พรอมต์การอนุมัติมีข้อความคำสั่งอยู่ด้วย ดังนั้นให้เปิดใช้การส่งไปยังช่องเฉพาะในช่องที่เชื่อถือได้เท่านั้น หากไม่สามารถหา ID ช่องจากคีย์เซสชันได้ OpenClaw จะ fallback ไปส่งผ่าน DM

    Discord ยังเรนเดอร์ปุ่มการอนุมัติร่วมที่ช่องแชตอื่นใช้ด้วย อะแดปเตอร์ Discord แบบ native จะเพิ่มการกำหนดเส้นทาง DM ของผู้อนุมัติและการ fanout ไปยังช่องเป็นหลัก
    เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก; OpenClaw
    ควรใส่คำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่า
    การอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียว
    หาก runtime การอนุมัติแบบ native ของ Discord ไม่ทำงาน OpenClaw จะคงพรอมต์
    `/approve <id> <decision>` แบบกำหนดแน่นอนในเครื่องให้มองเห็นได้ หาก
    runtime ทำงานอยู่แต่ไม่สามารถส่งการ์ดแบบ native ไปยังเป้าหมายใดได้
    OpenClaw จะส่งประกาศ fallback ในแชตเดียวกันพร้อมคำสั่ง `/approve`
    ที่ตรงกันจากการอนุมัติที่รอดำเนินการ

    การตรวจสอบสิทธิ์ Gateway และการ resolve การอนุมัติเป็นไปตามสัญญาไคลเอนต์ Gateway ร่วมกัน (ID `plugin:` resolve ผ่าน `plugin.approval.resolve`; ID อื่นผ่าน `exec.approval.resolve`) การอนุมัติจะหมดอายุหลัง 30 นาทีโดยค่าเริ่มต้น

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและ action gates

การดำเนินการกับข้อความ Discord รวมถึงการส่งข้อความ, การดูแลช่อง, moderation, presence และการดำเนินการ metadata

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- การตอบสนอง: `react`, `reactions`, `emojiList`
- moderation: `timeout`, `kick`, `ban`
- presence: `setPresence`

การดำเนินการ `event-create` รับพารามิเตอร์ `image` แบบไม่บังคับ (URL หรือพาธไฟล์ในเครื่อง) เพื่อตั้งค่ารูปภาพปกของเหตุการณ์ที่กำหนดเวลาไว้

Action gates อยู่ภายใต้ `channels.discord.actions.*`

พฤติกรรม gate เริ่มต้น:

| กลุ่มการดำเนินการ                                                                                                                                                       | ค่าเริ่มต้น |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้งาน |
| roles                                                                                                                                                                    | ปิดใช้งาน |
| moderation                                                                                                                                                               | ปิดใช้งาน |
| presence                                                                                                                                                                 | ปิดใช้งาน |

## UI Components v2

OpenClaw ใช้ Discord components v2 สำหรับการอนุมัติ exec และเครื่องหมายข้ามบริบท การดำเนินการกับข้อความ Discord ยังสามารถรับ `components` สำหรับ UI แบบกำหนดเองได้ (ขั้นสูง; ต้องสร้าง payload ของ component ผ่านเครื่องมือ discord) ขณะที่ `embeds` แบบ legacy ยังคงใช้ได้แต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นที่ใช้โดยคอนเทนเนอร์ component ของ Discord (hex)
- ตั้งค่ารายบัญชีด้วย `channels.discord.accounts.<id>.ui.components.accentColor`
- `channels.discord.agentComponents.ttlMs` ควบคุมระยะเวลาที่ callback ของ component Discord ที่ส่งไปยังคงลงทะเบียนอยู่ (ค่าเริ่มต้น `1800000`, สูงสุด `86400000`) ตั้งค่ารายบัญชีด้วย `channels.discord.accounts.<id>.agentComponents.ttlMs`
- `embeds` จะถูกละเว้นเมื่อมี components v2 อยู่
- การแสดงตัวอย่าง URL แบบธรรมดาจะถูกระงับโดยค่าเริ่มต้น ตั้งค่า `suppressEmbeds: false` บนการดำเนินการข้อความเมื่อควรขยายลิงก์ขาออกเพียงลิงก์เดียว

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

Discord มีพื้นผิวเสียงที่แตกต่างกันสองแบบ: **ช่องเสียง** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบแสดงตัวอย่าง waveform) Gateway รองรับทั้งสองแบบ

### ช่องเสียง

เช็กลิสต์การตั้งค่า:

1. เปิดใช้ Message Content Intent ใน Discord Developer Portal
2. เปิดใช้ Server Members Intent เมื่อใช้ allowlists ตามบทบาท/ผู้ใช้
3. เชิญบอตด้วย scope `bot` และ `applications.commands`
4. ให้สิทธิ์ Connect, Speak, Send Messages และ Read Message History ในช่องเสียงเป้าหมาย
5. เปิดใช้คำสั่ง native (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งใช้เอเจนต์เริ่มต้นของบัญชีและทำตามกฎ allowlist และนโยบายกลุ่มเดียวกับคำสั่ง Discord อื่น

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

หากต้องการตรวจสอบสิทธิ์ที่มีผลจริงของบอตก่อนเข้าร่วม ให้รัน:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

ตัวอย่าง auto-join:

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

- `voice.tts` จะแทนที่ `messages.tts` สำหรับการเล่นเสียง `stt-tts` เท่านั้น โหมด Realtime ใช้ `voice.realtime.speakerVoice`
- `voice.mode` ควบคุมเส้นทางการสนทนา ค่าเริ่มต้นคือ `agent-proxy`: ส่วนหน้าเสียงแบบ realtime จัดการจังหวะของเทิร์น การขัดจังหวะ และการเล่นเสียง มอบหมายงานสำคัญให้เอเจนต์ OpenClaw ที่ถูกกำหนดเส้นทางผ่าน `openclaw_agent_consult` และปฏิบัติต่อผลลัพธ์เหมือนพรอมต์ Discord แบบพิมพ์จากผู้พูดคนนั้น `stt-tts` คงโฟลว์ STT แบบแบตช์รุ่นเก่าร่วมกับ TTS ส่วน `bidi` ให้โมเดล realtime สนทนาโดยตรง พร้อมเปิดเผย `openclaw_agent_consult` สำหรับสมองของ OpenClaw
- `voice.agentSession` ควบคุมว่าบทสนทนา OpenClaw ใดจะรับเทิร์นเสียง ปล่อยไว้ไม่ตั้งค่าเพื่อใช้เซสชันของช่องเสียงเอง หรือตั้งค่า `{ mode: "target", target: "channel:<text-channel-id>" }` เพื่อให้ช่องเสียงทำหน้าที่เป็นส่วนขยายไมโครโฟน/ลำโพงของเซสชันช่องข้อความ Discord ที่มีอยู่ เช่น `#maintainers`
- `voice.model` จะแทนที่สมองเอเจนต์ OpenClaw สำหรับการตอบกลับด้วยเสียงของ Discord และการปรึกษาแบบ realtime ปล่อยไว้ไม่ตั้งค่าเพื่อสืบทอดโมเดลเอเจนต์ที่ถูกกำหนดเส้นทาง ค่านี้แยกจาก `voice.realtime.model`
- `voice.followUsers` ให้บอตเข้าร่วม ย้าย และออกจากเสียง Discord ตามผู้ใช้ที่เลือก ดู [ติดตามผู้ใช้ในเสียง](#follow-users-in-voice) สำหรับกฎพฤติกรรมและตัวอย่าง
- `agent-proxy` กำหนดเส้นทางคำพูดผ่าน `discord-voice` ซึ่งคงการอนุญาตเจ้าของ/เครื่องมือตามปกติสำหรับผู้พูดและเซสชันเป้าหมาย แต่ซ่อนเครื่องมือเอเจนต์ `tts` เพราะเสียง Discord เป็นเจ้าของการเล่นเสียง โดยค่าเริ่มต้น `agent-proxy` ให้การปรึกษามีสิทธิ์เข้าถึงเครื่องมือเต็มรูปแบบเทียบเท่าเจ้าของสำหรับผู้พูดที่เป็นเจ้าของ (`voice.realtime.toolPolicy: "owner"`) และต้องการปรึกษาเอเจนต์ OpenClaw อย่างมากก่อนคำตอบที่มีสาระ (`voice.realtime.consultPolicy: "always"`) ในโหมด `always` เริ่มต้นนั้น ชั้น realtime จะไม่พูดเติมช่องว่างโดยอัตโนมัติก่อนคำตอบจากการปรึกษา แต่จะจับและถอดเสียงคำพูด จากนั้นพูดคำตอบ OpenClaw ที่ถูกกำหนดเส้นทาง หากคำตอบจากการปรึกษาที่บังคับหลายรายการเสร็จขณะที่ Discord ยังเล่นคำตอบแรกอยู่ คำตอบคำพูดตรงตัวภายหลังจะถูกจัดคิวจนกว่าการเล่นจะว่าง แทนที่จะแทนที่คำพูดกลางประโยค
- ในโหมด `stt-tts` STT ใช้ `tools.media.audio`; `voice.model` ไม่มีผลต่อการถอดเสียง
- ในโหมด realtime, `voice.realtime.provider`, `voice.realtime.model` และ `voice.realtime.speakerVoice` กำหนดค่าเซสชันเสียง realtime สำหรับ OpenAI Realtime 2 ร่วมกับสมอง Codex ให้ใช้ `voice.realtime.model: "gpt-realtime-2"` และ `voice.model: "openai/gpt-5.5"`
- โหมดเสียง realtime จะรวมไฟล์โปรไฟล์ขนาดเล็ก `IDENTITY.md`, `USER.md` และ `SOUL.md` ไว้ในคำสั่งของผู้ให้บริการ realtime โดยค่าเริ่มต้น เพื่อให้เทิร์นตรงที่รวดเร็วยังคงตัวตน การยึดโยงกับผู้ใช้ และบุคลิกเดียวกับเอเจนต์ OpenClaw ที่ถูกกำหนดเส้นทาง ตั้งค่า `voice.realtime.bootstrapContextFiles` เป็นชุดย่อยเพื่อปรับแต่งสิ่งนี้ หรือ `[]` เพื่อปิดใช้งาน ไฟล์บูตสแตรป realtime ที่รองรับจำกัดอยู่ที่ไฟล์โปรไฟล์เหล่านั้น; `AGENTS.md` จะยังอยู่ในบริบทเอเจนต์ปกติ บริบทโปรไฟล์ที่แทรกเข้ามาไม่แทนที่ `openclaw_agent_consult` สำหรับงานในเวิร์กสเปซ ข้อเท็จจริงปัจจุบัน การค้นหาหน่วยความจำ หรือการกระทำที่มีเครื่องมือรองรับ
- ในโหมด OpenAI `agent-proxy` realtime ให้ตั้งค่า `voice.realtime.requireWakeName: true` เพื่อให้เสียง realtime ของ Discord เงียบจนกว่าข้อความถอดเสียงจะเริ่มหรือจบด้วยชื่อปลุก ชื่อปลุกที่กำหนดค่าต้องมีหนึ่งหรือสองคำ หากไม่ได้ตั้งค่า `voice.realtime.wakeNames` OpenClaw จะใช้ `name` ของเอเจนต์ที่ถูกกำหนดเส้นทางร่วมกับ `OpenClaw` และถอยกลับไปใช้รหัสเอเจนต์ร่วมกับ `OpenClaw` การกั้นด้วยชื่อปลุกจะปิดการตอบกลับอัตโนมัติของผู้ให้บริการ realtime กำหนดเส้นทางเทิร์นที่ยอมรับผ่านเส้นทางปรึกษาเอเจนต์ OpenClaw และให้การตอบรับแบบพูดสั้นๆ เมื่อรู้จำชื่อปลุกนำหน้าจากการถอดเสียงบางส่วนก่อนที่ข้อความถอดเสียงสุดท้ายจะมาถึง
- ผู้ให้บริการ OpenAI realtime ยอมรับชื่ออีเวนต์ Realtime 2 ปัจจุบันและนามแฝงรุ่นเก่าที่เข้ากันได้กับ Codex สำหรับอีเวนต์เสียงเอาต์พุตและข้อความถอดเสียง ดังนั้นสแนปช็อตผู้ให้บริการที่เข้ากันได้สามารถเปลี่ยนไปได้โดยไม่ทำให้เสียงผู้ช่วยหายไป
- `voice.realtime.bargeIn` ควบคุมว่าอีเวนต์ผู้พูดเริ่มของ Discord จะขัดจังหวะการเล่นเสียง realtime ที่กำลังทำงานอยู่หรือไม่ หากไม่ได้ตั้งค่า จะตามการตั้งค่าการขัดจังหวะเสียงอินพุตของผู้ให้บริการ realtime
- `voice.realtime.minBargeInAudioEndMs` ควบคุมระยะเวลาการเล่นเสียงผู้ช่วยขั้นต่ำก่อนที่ barge-in ของ OpenAI realtime จะตัดเสียง ค่าเริ่มต้น: `250` ตั้งค่า `0` เพื่อขัดจังหวะทันทีในห้องที่มีเสียงสะท้อนต่ำ หรือเพิ่มค่านี้สำหรับชุดลำโพงที่มีเสียงสะท้อนมาก
- สำหรับเสียง OpenAI บนการเล่นของ Discord ให้ตั้งค่า `voice.tts.provider: "openai"` และเลือกเสียง Text-to-speech ใต้ `voice.tts.providers.openai.speakerVoice` `cedar` เป็นตัวเลือกเสียงแนวผู้ชายที่ดีบนโมเดล OpenAI TTS ปัจจุบัน
- การแทนที่ `systemPrompt` ของ Discord รายช่องจะใช้กับเทิร์นข้อความถอดเสียงสำหรับช่องเสียงนั้น
- เทิร์นข้อความถอดเสียงจะสืบทอดสถานะเจ้าของจาก Discord `allowFrom` (หรือ `dm.allowFrom`) สำหรับคำสั่งที่จำกัดเฉพาะเจ้าของและการกระทำของช่อง การมองเห็นเครื่องมือเอเจนต์เป็นไปตามนโยบายเครื่องมือที่กำหนดค่าสำหรับเซสชันที่ถูกกำหนดเส้นทาง
- เสียง Discord เป็นแบบเลือกเปิดสำหรับคอนฟิกที่เป็นข้อความเท่านั้น; ตั้งค่า `channels.discord.voice.enabled=true` (หรือคงบล็อก `channels.discord.voice` ที่มีอยู่) เพื่อเปิดใช้คำสั่ง `/vc`, รันไทม์เสียง และ Gateway intent `GuildVoiceStates`
- `channels.discord.intents.voiceStates` สามารถแทนที่การสมัครรับ intent สถานะเสียงได้อย่างชัดเจน ปล่อยไว้ไม่ตั้งค่าเพื่อให้ intent ตามการเปิดใช้เสียงที่มีผลจริง
- หาก `voice.autoJoin` มีหลายรายการสำหรับกิลด์เดียวกัน OpenClaw จะเข้าร่วมช่องที่กำหนดค่าไว้รายการสุดท้ายสำหรับกิลด์นั้น
- `voice.allowedChannels` เป็น allowlist สำหรับการพำนักที่ไม่บังคับ ปล่อยไว้ไม่ตั้งค่าเพื่ออนุญาตให้ `/vc join` เข้าช่องเสียง Discord ที่ได้รับอนุญาตใดก็ได้ เมื่อตั้งค่าแล้ว `/vc join`, การเข้าร่วมอัตโนมัติเมื่อเริ่มต้น และการย้ายสถานะเสียงของบอตจะถูกจำกัดไว้ที่รายการ `{ guildId, channelId }` ที่ระบุ ตั้งค่าเป็นอาร์เรย์ว่างเพื่อปฏิเสธการเข้าร่วมเสียง Discord ทั้งหมด หาก Discord ย้ายบอตออกนอก allowlist OpenClaw จะออกจากช่องนั้นและเข้าร่วมเป้าหมาย auto-join ที่กำหนดค่าไว้อีกครั้งเมื่อมีอยู่
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือกการเข้าร่วมของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- OpenClaw ใช้โคเดก `libopus-wasm` ที่บันเดิลมาสำหรับการรับเสียง Discord และการเล่น PCM ดิบแบบ realtime โดยจัดส่งบิลด์ libopus WebAssembly ที่ปักหมุดไว้ และไม่ต้องใช้ส่วนเสริม opus แบบเนทีฟ
- `voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายาม auto-join ค่าเริ่มต้น: `30000`
- `voice.reconnectGraceMs` ควบคุมว่า OpenClaw จะรอนานเท่าใดให้เซสชันเสียงที่ตัดการเชื่อมต่อเริ่มเชื่อมต่อใหม่ก่อนทำลายเซสชัน ค่าเริ่มต้น: `15000`
- ในโหมด `stt-tts` การเล่นเสียงจะไม่หยุดเพียงเพราะผู้ใช้อื่นเริ่มพูด เพื่อหลีกเลี่ยงลูปฟีดแบ็ก OpenClaw จะละเว้นการจับเสียงใหม่ขณะ TTS กำลังเล่นอยู่; พูดหลังการเล่นจบเพื่อเข้าสู่เทิร์นถัดไป โหมด realtime จะส่งต่อการเริ่มพูดเป็นสัญญาณ barge-in ไปยังผู้ให้บริการ realtime
- ในโหมด realtime เสียงสะท้อนจากลำโพงเข้าสู่ไมค์ที่เปิดอยู่อาจดูเหมือน barge-in และขัดจังหวะการเล่น สำหรับห้อง Discord ที่มีเสียงสะท้อนมาก ให้ตั้งค่า `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` เพื่อไม่ให้ OpenAI ขัดจังหวะอัตโนมัติเมื่อมีเสียงอินพุต เพิ่ม `voice.realtime.bargeIn: true` หากคุณยังต้องการให้อีเวนต์ผู้พูดเริ่มของ Discord ขัดจังหวะการเล่นที่กำลังทำงานอยู่ บริดจ์ OpenAI realtime จะละเว้นการตัดการเล่นที่สั้นกว่า `voice.realtime.minBargeInAudioEndMs` โดยถือว่าน่าจะเป็นเสียงสะท้อน/สัญญาณรบกวน และบันทึกเป็นรายการที่ข้ามแทนการล้างการเล่น Discord
- `voice.captureSilenceGraceMs` ควบคุมว่า OpenClaw จะรอนานเท่าใดหลังจาก Discord รายงานว่าผู้พูดหยุดแล้ว ก่อนสรุปเซกเมนต์เสียงนั้นสำหรับ STT ค่าเริ่มต้น: `2000`; เพิ่มค่านี้หาก Discord แบ่งช่วงหยุดปกติออกเป็นข้อความถอดเสียงบางส่วนที่ขาดตอน
- เมื่อ ElevenLabs เป็นผู้ให้บริการ TTS ที่เลือก การเล่นเสียง Discord จะใช้ TTS แบบสตรีมมิงและเริ่มจากสตรีมการตอบกลับของผู้ให้บริการ ผู้ให้บริการที่ไม่รองรับสตรีมมิงจะถอยกลับไปใช้เส้นทางไฟล์ชั่วคราวที่สังเคราะห์แล้ว
- OpenClaw ยังเฝ้าดูความล้มเหลวในการถอดรหัสฝั่งรับ และกู้คืนอัตโนมัติโดยออกจาก/เข้าร่วมช่องเสียงใหม่หลังเกิดความล้มเหลวซ้ำๆ ในช่วงเวลาสั้นๆ
- หากล็อกรับแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำๆ หลังอัปเดต ให้รวบรวมรายงาน dependency และล็อก บรรทัด `@discordjs/voice` ที่บันเดิลมารวมการแก้ไข padding จาก upstream ของ discord.js PR #11449 ซึ่งปิด discord.js issue #11419
- อีเวนต์รับ `The operation was aborted` เป็นสิ่งที่คาดไว้เมื่อ OpenClaw สรุปเซกเมนต์ผู้พูดที่จับไว้; เป็นการวินิจฉัยแบบละเอียด ไม่ใช่คำเตือน
- ล็อกเสียง Discord แบบละเอียดมีตัวอย่างข้อความถอดเสียง STT แบบหนึ่งบรรทัดที่จำกัดขนาดสำหรับแต่ละเซกเมนต์ผู้พูดที่ยอมรับ เพื่อให้การดีบักแสดงทั้งฝั่งผู้ใช้และฝั่งการตอบกลับของเอเจนต์โดยไม่ทิ้งข้อความถอดเสียงแบบไม่จำกัดขนาด
- ในโหมด `agent-proxy` fallback การปรึกษาที่บังคับจะข้ามชิ้นส่วนข้อความถอดเสียงที่น่าจะยังไม่สมบูรณ์ เช่น ข้อความที่ลงท้ายด้วย `...` หรือตัวเชื่อมต่อท้ายประโยคอย่าง `and` รวมถึงคำปิดท้ายที่เห็นได้ชัดว่าไม่ต้องดำเนินการ เช่น “เดี๋ยวกลับมา” หรือ “ลาก่อน” ล็อกจะแสดง `forced agent consult skipped reason=...` เมื่อสิ่งนี้ป้องกันคำตอบค้างคิวที่ล้าสมัย

### ติดตามผู้ใช้ในเสียง

ใช้ `voice.followUsers` เมื่อคุณต้องการให้บอตเสียง Discord อยู่กับผู้ใช้ Discord ที่รู้จักหนึ่งคนหรือมากกว่า แทนที่จะเข้าร่วมช่องคงที่เมื่อเริ่มต้นหรือรอ `/vc join`

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

- `followUsers` ยอมรับรหัสผู้ใช้ Discord แบบดิบและค่า `discord:<id>` OpenClaw จะทำให้ทั้งสองรูปแบบเป็นมาตรฐานก่อนจับคู่อีเวนต์สถานะเสียง
- `followUsersEnabled` มีค่าเริ่มต้นเป็น `true` เมื่อกำหนดค่า `followUsers` ตั้งค่าเป็น `false` เพื่อคงรายการที่บันทึกไว้แต่หยุดการติดตามเสียงอัตโนมัติ
- เมื่อผู้ใช้ที่ติดตามเข้าร่วมช่องเสียงที่อนุญาต OpenClaw จะเข้าร่วมช่องนั้น เมื่อผู้ใช้ย้าย OpenClaw จะย้ายตาม เมื่อผู้ใช้ที่ติดตามที่ใช้งานอยู่ตัดการเชื่อมต่อ OpenClaw จะออก
- หากผู้ใช้ที่ติดตามหลายคนอยู่ในกิลด์เดียวกันและผู้ใช้ที่ติดตามที่ใช้งานอยู่ออก OpenClaw จะย้ายไปยังช่องของผู้ใช้ที่ติดตามอีกคนที่ติดตามไว้ก่อนออกจากกิลด์ หากผู้ใช้ที่ติดตามหลายคนย้ายพร้อมกัน อีเวนต์สถานะเสียงล่าสุดที่สังเกตได้จะเป็นผู้ชนะ
- `allowedChannels` ยังคงมีผล ผู้ใช้ที่ติดตามในช่องที่ไม่อนุญาตจะถูกละเว้น และเซสชันที่เป็นของการติดตามจะย้ายไปยังผู้ใช้ที่ติดตามอีกคนหรือออก
- OpenClaw จะปรับให้สอดคล้องกับอีเวนต์สถานะเสียงที่พลาดไปเมื่อเริ่มต้นและตามช่วงเวลาที่จำกัด การปรับให้สอดคล้องจะสุ่มตัวอย่างกิลด์ที่กำหนดค่าไว้และจำกัดจำนวนการค้นหา REST ต่อรอบ ดังนั้นรายการ `followUsers` ที่ใหญ่มากอาจใช้เวลามากกว่าหนึ่งช่วงจึงจะบรรจบ
- หาก Discord หรือผู้ดูแลระบบย้ายบอตขณะที่กำลังติดตามผู้ใช้ OpenClaw จะสร้างเซสชันเสียงใหม่และคงความเป็นเจ้าของการติดตามไว้เมื่อปลายทางได้รับอนุญาต หากบอตถูกย้ายออกนอก `allowedChannels` OpenClaw จะออกและเข้าร่วมเป้าหมายที่กำหนดค่าไว้เมื่อมีอยู่
- การกู้คืนการรับ DAVE อาจออกและเข้าร่วมช่องเดิมอีกครั้งหลังเกิดความล้มเหลวในการถอดรหัสซ้ำๆ เซสชันที่เป็นของการติดตามจะคงความเป็นเจ้าของการติดตามผ่านเส้นทางกู้คืนนั้น ดังนั้นเมื่อผู้ใช้ที่ติดตามตัดการเชื่อมต่อในภายหลังก็จะยังออกจากช่อง

เลือกระหว่างโหมดการเข้าร่วม:

- ใช้ `followUsers` สำหรับการตั้งค่าส่วนตัวหรือผู้ปฏิบัติงานที่บอตควรอยู่ในเสียงโดยอัตโนมัติเมื่อคุณอยู่
- ใช้ `autoJoin` สำหรับบอตห้องคงที่ที่ควรอยู่แม้ไม่มีผู้ใช้ที่ติดตามอยู่ในเสียง
- ใช้ `/vc join` สำหรับการเข้าร่วมครั้งเดียวหรือห้องที่การมีเสียงอัตโนมัติอาจทำให้แปลกใจ

โคเดกเสียง Discord:

- บันทึกการรับเสียงแสดง `discord voice: opus decoder: libopus-wasm`
- การเล่นแบบ Realtime เข้ารหัส PCM สเตอริโอ 48 kHz ดิบเป็น Opus ด้วยแพ็กเกจ `libopus-wasm` ที่รวมมาเดียวกัน ก่อนส่งแพ็กเก็ตให้ `@discordjs/voice`
- การเล่นไฟล์และการเล่นจากสตรีมของผู้ให้บริการจะแปลงรหัสเป็น PCM สเตอริโอ 48 kHz ดิบด้วย ffmpeg แล้วใช้ `libopus-wasm` สำหรับสตรีมแพ็กเก็ต Opus ที่ส่งไปยัง Discord

ไปป์ไลน์ STT พร้อม TTS:

- การจับ PCM จาก Discord ถูกแปลงเป็นไฟล์ชั่วคราว WAV
- `tools.media.audio` จัดการ STT เช่น `openai/gpt-4o-mini-transcribe`
- ข้อความถอดเสียงถูกส่งผ่านทางเข้าของ Discord และการกำหนดเส้นทาง ขณะที่ LLM สำหรับการตอบกลับทำงานด้วยนโยบายเอาต์พุตเสียงที่ซ่อนเครื่องมือ `tts` ของเอเจนต์และขอข้อความที่ส่งกลับ เพราะเสียงของ Discord เป็นเจ้าของการเล่น TTS ขั้นสุดท้าย
- `voice.model` เมื่อถูกตั้งค่า จะแทนที่เฉพาะ LLM สำหรับการตอบกลับในเทิร์นช่องเสียงนี้
- `voice.tts` ถูกผสานทับ `messages.tts`; ผู้ให้บริการที่รองรับการสตรีมจะป้อนข้อมูลให้ตัวเล่นโดยตรง มิฉะนั้นไฟล์เสียงที่ได้จะถูกเล่นในช่องที่เข้าร่วม

ตัวอย่างเซสชันช่องเสียง `agent-proxy` เริ่มต้น:

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

เมื่อไม่มีบล็อก `voice.agentSession` แต่ละช่องเสียงจะได้เซสชัน OpenClaw ที่กำหนดเส้นทางของตัวเอง ตัวอย่างเช่น `/vc join channel:234567890123456789` จะคุยกับเซสชันสำหรับช่องเสียง Discord นั้น โมเดล realtime เป็นเพียงส่วนหน้าด้านเสียงเท่านั้น; คำขอที่มีสาระสำคัญจะถูกส่งต่อให้เอเจนต์ OpenClaw ที่กำหนดค่าไว้ หากโมเดล realtime สร้างข้อความถอดเสียงสุดท้ายโดยไม่เรียกเครื่องมือ consult OpenClaw จะบังคับ consult เป็นทางสำรองเพื่อให้ค่าเริ่มต้นยังทำงานเหมือนการคุยกับเอเจนต์

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

ตัวอย่าง bidi แบบ Realtime:

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

ในโหมด `agent-proxy` บอทจะเข้าร่วมช่องเสียงที่กำหนดค่าไว้ แต่เทิร์นของเอเจนต์ OpenClaw จะใช้เซสชันที่กำหนดเส้นทางตามปกติและเอเจนต์ของช่องเป้าหมาย เซสชันเสียง realtime จะพูดผลลัพธ์ที่ส่งกลับเข้าไปในช่องเสียง เอเจนต์ supervisor ยังสามารถใช้เครื่องมือข้อความปกติตามนโยบายเครื่องมือของตนได้ รวมถึงการส่งข้อความ Discord แยกต่างหากหากนั่นคือการกระทำที่ถูกต้อง

ขณะที่การรัน OpenClaw ที่มอบหมายกำลังทำงานอยู่ ข้อความถอดเสียง Discord ใหม่จะถูกปฏิบัติเป็นการควบคุมการรันสดก่อนเริ่มเทิร์นเอเจนต์อีกครั้ง วลีเช่น "status", "cancel that", "use the smaller fix" หรือ "when you're done also check tests" จะถูกจัดประเภทเป็นสถานะ ยกเลิก การชี้นำ หรืออินพุตติดตามผลสำหรับเซสชันที่ใช้งานอยู่ ผลลัพธ์สถานะ ยกเลิก การชี้นำที่ยอมรับ และติดตามผลจะถูกพูดกลับเข้าไปในช่องเสียงเพื่อให้ผู้โทรทราบว่า OpenClaw จัดการคำขอแล้วหรือไม่

รูปแบบเป้าหมายที่มีประโยชน์:

- `target: "channel:123456789012345678"` กำหนดเส้นทางผ่านเซสชันช่องข้อความ Discord
- `target: "123456789012345678"` ถือเป็นเป้าหมายช่อง
- `target: "dm:123456789012345678"` หรือ `target: "user:123456789012345678"` กำหนดเส้นทางผ่านเซสชันข้อความโดยตรงนั้น

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

ใช้สิ่งนี้เมื่อโมเดลได้ยินการเล่น Discord ของตัวเองผ่านไมค์ที่เปิดอยู่ แต่คุณยังต้องการขัดจังหวะด้วยการพูด OpenClaw จะป้องกันไม่ให้ OpenAI ขัดจังหวะอัตโนมัติจากเสียงอินพุตดิบ ขณะที่ `bargeIn: true` ทำให้อีเวนต์เริ่มพูดของลำโพง Discord และเสียงของผู้พูดที่ทำงานอยู่แล้วสามารถยกเลิกการตอบกลับ realtime ที่กำลังทำงานก่อนที่เทิร์นที่จับได้ถัดไปจะไปถึง OpenAI สัญญาณการแทรกพูดที่เร็วมากซึ่งมี `audioEndMs` ต่ำกว่า `minBargeInAudioEndMs` จะถือว่าน่าจะเป็นเสียงสะท้อน/เสียงรบกวนและถูกละเว้น เพื่อไม่ให้โมเดลตัดเสียงตั้งแต่เฟรมการเล่นแรก

บันทึกเสียงที่คาดไว้:

- เมื่อเข้าร่วม: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- เมื่อเริ่ม realtime: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- เมื่อมีเสียงผู้พูด: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` และ `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- เมื่อข้ามคำพูดเก่า: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` หรือ `reason=non-actionable-closing ...`
- เมื่อการตอบกลับ realtime เสร็จสมบูรณ์: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- เมื่อหยุด/รีเซ็ตการเล่น: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- เมื่อ consult แบบ realtime: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- เมื่อเอเจนต์ตอบ: `discord voice: agent turn answer ...`
- เมื่อจัดคิวคำพูดแบบตรงตัว: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...` ตามด้วย `discord voice: realtime exact speech dequeued reason=player-idle ...`
- เมื่อตรวจพบการแทรกพูด: `discord voice: realtime barge-in detected source=speaker-start ...` หรือ `discord voice: realtime barge-in detected source=active-speaker-audio ...` ตามด้วย `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- เมื่อ realtime ถูกขัดจังหวะ: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in` ตามด้วย `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` หรือ `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- เมื่อเพิกเฉยเสียงสะท้อน/เสียงรบกวน: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- เมื่อปิดการแทรกพูด: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- เมื่อการเล่นว่างอยู่: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

หากต้องการดีบักเสียงที่ถูกตัด ให้อ่านบันทึกเสียง realtime เป็นไทม์ไลน์:

1. `realtime audio playback started` หมายถึง Discord เริ่มเล่นเสียงผู้ช่วยแล้ว บริดจ์จะเริ่มนับชังก์เอาต์พุตของผู้ช่วย ไบต์ PCM ของ Discord ไบต์ realtime ของผู้ให้บริการ และระยะเวลาเสียงที่สังเคราะห์จากจุดนี้
2. `realtime speaker turn opened` ระบุว่าผู้พูด Discord เริ่มทำงาน หากการเล่นกำลังทำงานอยู่แล้วและเปิดใช้ `bargeIn` สิ่งนี้อาจตามด้วย `barge-in detected source=speaker-start`
3. `realtime input audio started` ระบุเฟรมเสียงจริงเฟรมแรกที่ได้รับสำหรับเทิร์นผู้พูดนั้น `outputActive=true` หรือ `outputAudioMs` ที่ไม่เป็นศูนย์ตรงนี้หมายความว่าไมค์กำลังส่งอินพุตขณะที่การเล่นของผู้ช่วยยังทำงานอยู่
4. `barge-in detected source=active-speaker-audio` หมายถึง OpenClaw เห็นเสียงผู้พูดสดขณะที่การเล่นของผู้ช่วยทำงานอยู่ สิ่งนี้มีประโยชน์ในการแยกการขัดจังหวะจริงออกจากอีเวนต์เริ่มพูดของ Discord ที่ไม่มีเสียงที่ใช้ได้
5. `barge-in requested reason=...` หมายถึง OpenClaw ขอให้ผู้ให้บริการ realtime ยกเลิกหรือตัดการตอบกลับที่ทำงานอยู่ รายการนี้รวม `outputAudioMs`, `outputActive` และ `playbackChunks` เพื่อให้คุณเห็นว่าเสียงผู้ช่วยเล่นไปจริงมากเพียงใดก่อนการขัดจังหวะ
6. `realtime audio playback stopped reason=...` คือจุดรีเซ็ตการเล่น Discord ในเครื่อง เหตุผลบอกว่าใครหยุดการเล่น: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` หรือ `session-close`
7. `realtime speaker turn closed` สรุปเทิร์นอินพุตที่จับได้ `chunks=0` หรือ `hasAudio=false` หมายถึงเทิร์นผู้พูดเปิดขึ้นแต่ไม่มีเสียงที่ใช้งานได้ไปถึงบริดจ์ realtime `interruptedPlayback=true` หมายถึงเทิร์นอินพุตนั้นทับซ้อนกับเอาต์พุตผู้ช่วยและกระตุ้นตรรกะการแทรกพูด

ฟิลด์ที่มีประโยชน์:

- `outputAudioMs`: ระยะเวลาเสียงผู้ช่วยที่ผู้ให้บริการ realtime สร้างก่อนบรรทัดบันทึก
- `audioMs`: ระยะเวลาเสียงผู้ช่วยที่ OpenClaw นับก่อนการเล่นหยุด
- `elapsedMs`: เวลาตามนาฬิกาจริงระหว่างการเปิดและปิดสตรีมการเล่นหรือเทิร์นผู้พูด
- `discordBytes`: ไบต์ PCM สเตอริโอ 48 kHz ที่ส่งไปยังหรือรับจากเสียง Discord
- `realtimeBytes`: ไบต์ PCM รูปแบบผู้ให้บริการที่ส่งไปยังหรือรับจากผู้ให้บริการ realtime
- `playbackChunks`: ชังก์เสียงผู้ช่วยที่ส่งต่อไปยัง Discord สำหรับการตอบกลับที่ทำงานอยู่
- `sinceLastAudioMs`: ช่องว่างระหว่างเฟรมเสียงผู้พูดที่จับได้ล่าสุดกับการปิดเทิร์นผู้พูด

รูปแบบที่พบบ่อย:

- การตัดเสียงทันทีพร้อม `source=active-speaker-audio`, `outputAudioMs` ค่าน้อย และผู้ใช้คนเดียวกันอยู่ใกล้เคียง มักชี้ไปที่เสียงสะท้อนจากลำโพงเข้าสู่ไมค์ เพิ่ม `voice.realtime.minBargeInAudioEndMs`, ลดระดับเสียงลำโพง, ใช้หูฟัง หรือกำหนด `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`
- `source=speaker-start` ตามด้วย `speaker turn closed ... hasAudio=false` หมายถึง Discord รายงานการเริ่มพูด แต่ไม่มีเสียงไปถึง OpenClaw นั่นอาจเป็นอีเวนต์เสียง Discord ชั่วคราว พฤติกรรม noise gate หรือไคลเอนต์เปิดไมค์ชั่วขณะ
- `audio playback stopped reason=stream-close` โดยไม่มีการแทรกพูดใกล้เคียงหรือ `provider-clear-audio` หมายความว่าสตรีมการเล่น Discord ในเครื่องจบโดยไม่คาดคิด ตรวจสอบบันทึกผู้ให้บริการและตัวเล่น Discord ก่อนหน้า
- `capture ignored during playback (barge-in disabled)` หมายถึง OpenClaw จงใจทิ้งอินพุตขณะที่เสียงผู้ช่วยทำงานอยู่ เปิดใช้ `voice.realtime.bargeIn` หากคุณต้องการให้คำพูดขัดจังหวะการเล่น
- `barge-in ignored ... outputActive=false` หมายถึง Discord หรือ VAD ของผู้ให้บริการรายงานคำพูด แต่ OpenClaw ไม่มีการเล่นที่ทำงานอยู่ให้ขัดจังหวะ สิ่งนี้ไม่ควรตัดเสียง

ข้อมูลรับรองถูกแยกแก้ตามคอมโพเนนต์: การยืนยันตัวตนเส้นทาง LLM สำหรับ `voice.model`, การยืนยันตัวตน STT สำหรับ `tools.media.audio`, การยืนยันตัวตน TTS สำหรับ `messages.tts`/`voice.tts` และการยืนยันตัวตนผู้ให้บริการ realtime สำหรับ `voice.realtime.providers` หรือการกำหนดค่าการยืนยันตัวตนปกติของผู้ให้บริการ

### ข้อความเสียง

ข้อความเสียง Discord แสดงตัวอย่างรูปคลื่นและต้องใช้เสียง OGG/Opus OpenClaw สร้างรูปคลื่นให้อัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ Gateway เพื่อตรวจสอบและแปลงเสียง.

- ระบุ **พาธไฟล์ในเครื่อง** (URL จะถูกปฏิเสธ)
- ไม่ต้องใส่เนื้อหาข้อความ (Discord ปฏิเสธข้อความ + ข้อความเสียงใน payload เดียวกัน)
- รองรับรูปแบบเสียงใดก็ได้; OpenClaw จะแปลงเป็น OGG/Opus ตามจำเป็น.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ใช้ intents ที่ไม่อนุญาต หรือบอตไม่เห็นข้อความใน guild">

    - เปิดใช้ Message Content Intent
    - เปิดใช้ Server Members Intent เมื่อคุณต้องพึ่งพาการ resolve ผู้ใช้/สมาชิก
    - รีสตาร์ท gateway หลังเปลี่ยน intents

  </Accordion>

  <Accordion title="ข้อความใน guild ถูกบล็อกโดยไม่คาดคิด">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบ allowlist ของ guild ใต้ `channels.discord.guilds`
    - หากมีแผนที่ `channels` ของ guild อยู่ จะอนุญาตเฉพาะช่องที่ระบุไว้เท่านั้น
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

  <Accordion title="Discord turns ที่ทำงานนาน หรือการตอบซ้ำ">

    บันทึกทั่วไป:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    ปุ่มปรับคิว Discord gateway:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - สิ่งนี้ควบคุมเฉพาะงาน listener ของ Discord gateway ไม่ใช่อายุการทำงานของ agent turn

    Discord ไม่ใช้ timeout ที่ channel เป็นเจ้าของกับ agent turns ที่อยู่ในคิว Message listeners จะส่งต่อทันที และ Discord runs ที่อยู่ในคิวจะคงลำดับต่อ session ไว้จนกว่า lifecycle ของ session/tool/runtime จะเสร็จสิ้นหรือยกเลิกงาน.

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

  <Accordion title="คำเตือน timeout ของการค้นหา metadata ของ Gateway">
    OpenClaw ดึง metadata `/gateway/bot` ของ Discord ก่อนเชื่อมต่อ ความล้มเหลวชั่วคราวจะ fallback ไปยัง gateway URL เริ่มต้นของ Discord และถูกจำกัดอัตราในบันทึก.

    ปุ่มปรับ metadata timeout:

    - บัญชีเดียว: `channels.discord.gatewayInfoTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env fallback เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - ค่าเริ่มต้น: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw รอ event `READY` ของ Discord gateway ระหว่าง startup และหลัง runtime reconnects การตั้งค่าแบบหลายบัญชีที่มีการ stagger startup อาจต้องใช้ช่วงเวลา startup READY ที่นานกว่าค่าเริ่มต้น.

    ปุ่มปรับ READY timeout:

    - startup บัญชีเดียว: `channels.discord.gatewayReadyTimeoutMs`
    - startup หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - startup env fallback เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นของ startup: `15000` (15 วินาที), สูงสุด: `120000`
    - runtime บัญชีเดียว: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - runtime env fallback เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นของ runtime: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="Permissions audit ไม่ตรงกัน">
    การตรวจสอบสิทธิ์ `channels status --probe` ใช้งานได้เฉพาะกับ channel IDs ที่เป็นตัวเลขเท่านั้น.

    หากคุณใช้ slug keys การจับคู่ runtime ยังอาจทำงานได้ แต่ probe ไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน.

  </Accordion>

  <Accordion title="ปัญหา DM และ pairing">

    - ปิดใช้ DM: `channels.discord.dm.enabled=false`
    - ปิดใช้นโยบาย DM: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - กำลังรอการอนุมัติ pairing ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูปบอตต่อบอต">
    โดยค่าเริ่มต้น ข้อความที่เขียนโดยบอตจะถูกละเว้น.

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎ mention และ allowlist ที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมลูป.
    แนะนำให้ใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความบอตที่ mention บอตเท่านั้น.

    OpenClaw ยังมาพร้อม [การป้องกันลูปบอต](/th/channels/bot-loop-protection) แบบใช้ร่วมกัน เมื่อใดก็ตามที่ `allowBots` อนุญาตให้ข้อความที่เขียนโดยบอตไปถึง dispatch, Discord จะแมป event ขาเข้าเป็นข้อเท็จจริง `(account, channel, bot pair)` และตัวป้องกันคู่ทั่วไปจะระงับคู่นั้นหลังจากเกินงบ event ที่กำหนดไว้ ตัวป้องกันนี้ป้องกันลูปบอตสองตัวที่วิ่งไม่หยุด ซึ่งก่อนหน้านี้ต้องถูกหยุดโดย rate limits ของ Discord; ไม่มีผลต่อการ deploy บอตตัวเดียวหรือการตอบจากบอตครั้งเดียวที่ยังอยู่ภายใต้งบ.

    การตั้งค่าเริ่มต้น (ทำงานเมื่อมีการตั้งค่า `allowBots`):

    - `maxEventsPerWindow: 20` -- คู่บอตสามารถแลกเปลี่ยนข้อความได้ 20 ข้อความภายใน sliding window
    - `windowSeconds: 60` -- ความยาวของ sliding window
    - `cooldownSeconds: 60` -- เมื่อใช้งบเกินแล้ว ข้อความบอตต่อบอตเพิ่มเติมทุกข้อความในทิศทางใดก็ตามจะถูกทิ้งเป็นเวลาหนึ่งนาที

    กำหนดค่า default ที่ใช้ร่วมกันครั้งเดียวใต้ `channels.defaults.botLoopProtection` แล้ว override Discord เมื่อ workflow ที่ถูกต้องต้องการพื้นที่เพิ่ม ลำดับความสำคัญคือ:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - ค่าเริ่มต้นในตัว

    Discord ใช้คีย์ทั่วไป `maxEventsPerWindow`, `windowSeconds`, และ `cooldownSeconds`.

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

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - อัปเดต OpenClaw ให้เป็นเวอร์ชันปัจจุบัน (`openclaw update`) เพื่อให้มี logic การกู้คืนการรับเสียง Discord
    - ยืนยันว่า `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้น upstream) และปรับเฉพาะเมื่อจำเป็น
    - ดูบันทึกสำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากยังล้มเหลวหลังจาก rejoin อัตโนมัติ ให้รวบรวมบันทึกและเปรียบเทียบกับประวัติการรับ DAVE upstream ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## อ้างอิงการกำหนดค่า

อ้างอิงหลัก: [อ้างอิงการกำหนดค่า - Discord](/th/gateway/config-channels#discord).

<Accordion title="ฟิลด์ Discord ที่ให้สัญญาณสูง">

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- command: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout` (งบ listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- reply/history: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legacy: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb` (จำกัดการอัปโหลด Discord ขาออก, ค่าเริ่มต้น `100MB`), `retry`
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- features: `threadBindings`, top-level `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการปฏิบัติการ

- ปฏิบัติกับโทเค็นบอตเป็นความลับ (`DISCORD_BOT_TOKEN` แนะนำในสภาพแวดล้อมที่มีการกำกับดูแล)
- ให้สิทธิ์ Discord แบบน้อยที่สุดเท่าที่จำเป็น
- หากการ deploy/state ของคำสั่งล้าสมัย ให้รีสตาร์ท gateway และตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`.

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Discord กับ gateway.
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรม group chat และ allowlist.
  </Card>
  <Card title="การกำหนดเส้นทาง Channel" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยัง agents.
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    Threat model และการ hardening.
  </Card>
  <Card title="การกำหนดเส้นทาง Multi-agent" icon="sitemap" href="/th/concepts/multi-agent">
    แมป guilds และ channels ไปยัง agents.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่ง native.
  </Card>
</CardGroup>
