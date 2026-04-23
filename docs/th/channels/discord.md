---
read_when:
    - กำลังทำงานกับฟีเจอร์ของช่องทาง Discord
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าสำหรับบอท Discord
title: Discord
x-i18n:
    generated_at: "2026-04-23T10:13:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1160a0b221bc3251722a81c00c65ee7c2001efce345248727f1f3c8580a0e953
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

สถานะ: พร้อมใช้งานสำหรับ DM และช่องทาง guild ผ่าน Discord gateway อย่างเป็นทางการ

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    Discord DM ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยและขั้นตอนการซ่อมแซมข้ามช่องทาง
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

คุณจะต้องสร้างแอปพลิเคชันใหม่พร้อมบอท เพิ่มบอทเข้าไปในเซิร์ฟเวอร์ของคุณ และจับคู่บอทกับ OpenClaw เราแนะนำให้เพิ่มบอทของคุณเข้าไปในเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากคุณยังไม่มี ให้[สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="สร้างแอปพลิเคชัน Discord และบอท">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อเช่น "OpenClaw"

    คลิก **Bot** ที่แถบด้านข้าง ตั้งค่า **Username** เป็นชื่อที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้งาน privileged intents">
    ที่หน้า **Bot** เดิม ให้เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้งาน:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับ role allowlist และการจับคู่ชื่อเป็น ID)
    - **Presence Intent** (ไม่บังคับ; ต้องใช้เฉพาะเมื่ออัปเดตสถานะการออนไลน์)

  </Step>

  <Step title="คัดลอก bot token ของคุณ">
    เลื่อนกลับขึ้นไปด้านบนของหน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อจะเป็นแบบนั้น แต่นี่คือการสร้าง token แรกของคุณ — ไม่มีสิ่งใดถูก "รีเซ็ต"
    </Note>

    คัดลอก token แล้วเก็บไว้ในที่ปลอดภัย นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในอีกไม่ช้า

  </Step>

  <Step title="สร้าง invite URL และเพิ่มบอทเข้าเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** ที่แถบด้านข้าง คุณจะสร้าง invite URL ที่มีสิทธิ์ถูกต้องสำหรับเพิ่มบอทเข้าเซิร์ฟเวอร์ของคุณ

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

    นี่คือชุดสิทธิ์พื้นฐานสำหรับช่องทางข้อความทั่วไป หากคุณวางแผนจะโพสต์ใน Discord threads รวมถึงเวิร์กโฟลว์ของช่องทาง forum หรือ media ที่สร้างหรือใช้งาน thread ต่อ ให้เปิดใช้งาน **Send Messages in Threads** เพิ่มด้วย
    คัดลอก URL ที่สร้างไว้ด้านล่าง วางลงในเบราว์เซอร์ของคุณ เลือกเซิร์ฟเวอร์ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอทของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิดใช้งาน Developer Mode และรวบรวม ID ของคุณ">
    กลับไปที่แอป Discord คุณต้องเปิดใช้งาน Developer Mode เพื่อให้สามารถคัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนรูปเฟืองข้างอวาตาร์ของคุณ) → **Advanced** → เปิด **Developer Mode**
    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ของคุณไว้พร้อมกับ Bot Token — คุณจะส่งทั้งสามอย่างนี้ให้ OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาต DM จากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงานได้ Discord ต้องอนุญาตให้บอทของคุณส่ง DM ถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** → **Privacy Settings** → เปิด **Direct Messages**

    การดำเนินการนี้ทำให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอท) ส่ง DM ถึงคุณได้ เปิดค่านี้ไว้หากคุณต้องการใช้ Discord DM กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่องทาง guild คุณสามารถปิด DM ได้หลังจากการจับคู่เสร็จสิ้น

  </Step>

  <Step title="ตั้งค่า bot token ของคุณอย่างปลอดภัย (อย่าส่งในแชต)">
    Discord bot token ของคุณเป็นความลับ (เหมือนรหัสผ่าน) ตั้งค่าบนเครื่องที่รัน OpenClaw ก่อนส่งข้อความถึงเอเจนต์ของคุณ

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    หาก OpenClaw กำลังทำงานอยู่แล้วในฐานะบริการเบื้องหลัง ให้รีสตาร์ตผ่านแอป OpenClaw Mac หรือหยุดแล้วเริ่มกระบวนการ `openclaw gateway run` ใหม่

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="บอกเอเจนต์ของคุณ">
        แชตกับเอเจนต์ OpenClaw ของคุณผ่านช่องทางที่มีอยู่แล้วช่องทางใดก็ได้ (เช่น Telegram) แล้วบอกมัน หาก Discord เป็นช่องทางแรกของคุณ ให้ใช้แท็บ CLI / config แทน

        > "ฉันตั้งค่า Discord bot token ไว้ใน config แล้ว โปรดตั้งค่า Discord ให้เสร็จโดยใช้ User ID `<user_id>` และ Server ID `<server_id>`"
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

        env สำรองสำหรับบัญชีเริ่มต้น:

```bash
DISCORD_BOT_TOKEN=...
```

        รองรับค่า `token` แบบข้อความล้วน รองรับค่า SecretRef สำหรับ `channels.discord.token` เช่นกันในผู้ให้บริการแบบ env/file/exec ดู [การจัดการความลับ](/th/gateway/secrets)

      </Tab>
    </Tabs>

  </Step>

  <Step title="อนุมัติการจับคู่ DM ครั้งแรก">
    รอจน gateway กำลังทำงาน จากนั้นส่ง DM ถึงบอทของคุณใน Discord บอทจะตอบกลับด้วยรหัสการจับคู่

    <Tabs>
      <Tab title="บอกเอเจนต์ของคุณ">
        ส่งรหัสการจับคู่ไปยังเอเจนต์ของคุณบนช่องทางที่มีอยู่เดิม:

        > "อนุมัติรหัสการจับคู่ Discord นี้: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    รหัสการจับคู่จะหมดอายุภายใน 1 ชั่วโมง

    ตอนนี้คุณควรสามารถแชตกับเอเจนต์ของคุณใน Discord ผ่าน DM ได้แล้ว

  </Step>
</Steps>

<Note>
การแปลงค่า token รับรู้ตามบัญชี ค่า token ใน config มีสิทธิ์เหนือกว่า env สำรอง `DISCORD_BOT_TOKEN` จะถูกใช้สำหรับบัญชีเริ่มต้นเท่านั้น
สำหรับการเรียกออกขั้นสูง (message tool/channel actions) จะใช้ `token` แบบระบุชัดเจนต่อการเรียกสำหรับการเรียกนั้น ใช้กับการส่งและการกระทำแบบอ่าน/ตรวจสอบได้ด้วย (เช่น read/search/fetch/thread/pins/permissions) ขณะที่นโยบายบัญชี/การลองใหม่ยังคงมาจากบัญชีที่เลือกใน active runtime snapshot
</Note>

## แนะนำ: ตั้งค่า guild workspace

เมื่อ DM ใช้งานได้แล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณให้เป็น workspace เต็มรูปแบบ โดยแต่ละช่องทางจะมี agent session ของตัวเองพร้อมบริบทของตัวเอง แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีแค่คุณกับบอทของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณเข้า guild allowlist">
    การดำเนินการนี้ทำให้เอเจนต์ของคุณสามารถตอบกลับได้ในทุกช่องทางบนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ DM

    <Tabs>
      <Tab title="บอกเอเจนต์ของคุณ">
        > "เพิ่ม Discord Server ID `<server_id>` ของฉันไปยัง guild allowlist"
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

  <Step title="อนุญาตให้ตอบกลับโดยไม่ต้อง @mention">
    ตามค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในช่องทาง guild เมื่อถูก @mention เท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณน่าจะต้องการให้มันตอบทุกข้อความ

    <Tabs>
      <Tab title="บอกเอเจนต์ของคุณ">
        > "อนุญาตให้เอเจนต์ของฉันตอบกลับบนเซิร์ฟเวอร์นี้ได้โดยไม่ต้องถูก @mention"
      </Tab>
      <Tab title="Config">
        ตั้งค่า `requireMention: false` ใน config ของ guild:

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

      </Tab>
    </Tabs>

  </Step>

  <Step title="วางแผนเรื่องหน่วยความจำในช่องทาง guild">
    ตามค่าเริ่มต้น หน่วยความจำระยะยาว (`MEMORY.md`) จะถูกโหลดเฉพาะใน DM sessions เท่านั้น ช่องทาง guild จะไม่โหลด `MEMORY.md` อัตโนมัติ

    <Tabs>
      <Tab title="บอกเอเจนต์ของคุณ">
        > "เมื่อฉันถามคำถามใน Discord channels ให้ใช้ memory_search หรือ memory_get หากคุณต้องการบริบทระยะยาวจาก MEMORY.md"
      </Tab>
      <Tab title="ด้วยตนเอง">
        หากคุณต้องการบริบทที่ใช้ร่วมกันในทุกช่องทาง ให้วางคำสั่งที่คงที่ไว้ใน `AGENTS.md` หรือ `USER.md` (ไฟล์เหล่านี้จะถูก inject สำหรับทุก session) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงเมื่อจำเป็นด้วย memory tools
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างช่องทางบางช่องบนเซิร์ฟเวอร์ Discord ของคุณแล้วเริ่มแชต เอเจนต์ของคุณสามารถเห็นชื่อช่องทางได้ และแต่ละช่องทางจะมี session แยกจากกันโดยสมบูรณ์ — ดังนั้นคุณสามารถตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ได้ที่เหมาะกับเวิร์กโฟลว์ของคุณ

## โมเดลการทำงานขณะรัน

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord
- การกำหนดเส้นทางการตอบกลับเป็นแบบกำหนดแน่นอน: ข้อความขาเข้าจาก Discord จะตอบกลับไปยัง Discord
- ตามค่าเริ่มต้น (`session.dmScope=main`) การแชตโดยตรงจะใช้ agent main session ร่วมกัน (`agent:main:main`)
- ช่องทาง guild ใช้ session keys แบบแยกกัน (`agent:<agentId>:discord:channel:<channelId>`)
- Group DM จะถูกละเว้นตามค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่ง Slash แบบเนทีฟทำงานใน command sessions แบบแยก (`agent:<agentId>:discord:slash:<userId>`) แต่ยังคงพก `CommandTargetSessionKey` ไปยัง session การสนทนาที่ถูกกำหนดเส้นทาง

## ช่องทาง forum

Discord forum และ media channels ยอมรับเฉพาะโพสต์แบบ thread เท่านั้น OpenClaw รองรับ 2 วิธีในการสร้าง:

- ส่งข้อความไปยัง forum parent (`channel:<forumId>`) เพื่อสร้าง thread อัตโนมัติ ชื่อ thread จะใช้บรรทัดแรกที่ไม่ว่างของข้อความของคุณ
- ใช้ `openclaw message thread create` เพื่อสร้าง thread โดยตรง อย่าส่ง `--message-id` สำหรับช่องทาง forum

ตัวอย่าง: ส่งไปยัง forum parent เพื่อสร้าง thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

ตัวอย่าง: สร้าง forum thread โดยระบุชัดเจน

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

forum parents ไม่รองรับ Discord components หากคุณต้องการ components ให้ส่งไปยัง thread นั้นโดยตรง (`channel:<threadId>`)

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับ Discord components v2 containers สำหรับข้อความของเอเจนต์ ใช้ message tool พร้อม payload `components` ผลลัพธ์ของ interaction จะถูกกำหนดเส้นทางกลับไปยังเอเจนต์เป็นข้อความขาเข้าปกติ และเป็นไปตามการตั้งค่า Discord `replyToMode` ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Action rows รองรับได้สูงสุด 5 ปุ่ม หรือ select menu เดี่ยว 1 รายการ
- ประเภท select: `string`, `user`, `role`, `mentionable`, `channel`

ตามค่าเริ่มต้น components จะใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่ออนุญาตให้ปุ่ม selects และ forms ใช้ได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดว่าใครสามารถคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (Discord user IDs, tags หรือ `*`) เมื่อกำหนดค่าไว้ ผู้ใช้ที่ไม่ตรงเงื่อนไขจะได้รับข้อความปฏิเสธแบบ ephemeral

คำสั่ง Slash `/model` และ `/models` จะเปิดตัวเลือกโมเดลแบบโต้ตอบพร้อมดรอปดาวน์ผู้ให้บริการและโมเดล รวมทั้งขั้นตอน Submit เว้นแต่ `commands.modelsWrite=false` `/models add` ยังรองรับการเพิ่มรายการผู้ให้บริการ/โมเดลใหม่จากแชตด้วย และโมเดลที่เพิ่มใหม่จะปรากฏโดยไม่ต้องรีสตาร์ต gateway การตอบกลับของตัวเลือกเป็นแบบ ephemeral และมีเพียงผู้ใช้ที่เรียกคำสั่งเท่านั้นที่ใช้งานได้

ไฟล์แนบ:

- บล็อก `file` ต้องชี้ไปที่ attachment reference (`attachment://<filename>`)
- ระบุไฟล์แนบผ่าน `media`/`path`/`filePath` (ไฟล์เดียว); ใช้ `media-gallery` สำหรับหลายไฟล์
- ใช้ `filename` เพื่อเขียนทับชื่ออัปโหลดเมื่อจำเป็นต้องให้ตรงกับ attachment reference

ฟอร์ม Modal:

- เพิ่ม `components.modal` ได้สูงสุด 5 ฟิลด์
- ประเภทฟิลด์: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw จะเพิ่มปุ่มทริกเกอร์ให้อัตโนมัติ

ตัวอย่าง:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "ข้อความสำรองที่ไม่บังคับ",
  components: {
    reusable: true,
    text: "เลือกเส้นทาง",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "อนุมัติ",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "ปฏิเสธ", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "เลือกตัวเลือก",
          options: [
            { label: "ตัวเลือก A", value: "a" },
            { label: "ตัวเลือก B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "รายละเอียด",
      triggerLabel: "เปิดฟอร์ม",
      fields: [
        { type: "text", label: "ผู้ร้องขอ" },
        {
          type: "select",
          label: "ลำดับความสำคัญ",
          options: [
            { label: "ต่ำ", value: "low" },
            { label: "สูง", value: "high" },
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
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM (เดิม: `channels.discord.dm.policy`):

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.discord.allowFrom` มี `"*"` อยู่ด้วย; เดิม: `channels.discord.dm.allowFrom`)
    - `disabled`

    หากนโยบาย DM ไม่ใช่ open ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือได้รับการแจ้งให้จับคู่ในโหมด `pairing`)

    ลำดับความสำคัญแบบหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อยังไม่ได้ตั้งค่า `allowFrom` ของตัวเอง
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การกล่าวถึงแบบ `<@id>`

    ID ตัวเลขล้วนไม่ชัดเจนและจะถูกปฏิเสธ เว้นแต่จะระบุชนิดเป้าหมายผู้ใช้/ช่องทางไว้อย่างชัดเจน

  </Tab>

  <Tab title="นโยบาย Guild">
    การจัดการ Guild ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    ค่าพื้นฐานที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    พฤติกรรมของ `allowlist`:

    - guild ต้องตรงกับ `channels.discord.guilds` (แนะนำให้ใช้ `id`, ยอมรับ `slug`)
    - allowlist ของผู้ส่งแบบไม่บังคับ: `users` (แนะนำให้ใช้ ID ที่คงที่) และ `roles` (ใช้ได้เฉพาะ role IDs); หากกำหนดอย่างใดอย่างหนึ่งไว้ ผู้ส่งจะได้รับอนุญาตเมื่อตรงกับ `users` หรือ `roles`
    - การจับคู่ชื่อ/แท็กโดยตรงถูกปิดใช้งานตามค่าเริ่มต้น; ให้เปิด `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเมื่อจำเป็นในโหมดความเข้ากันได้แบบฉุกเฉินเท่านั้น
    - รองรับชื่อ/แท็กสำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อมีการใช้รายการชื่อ/แท็ก
    - หาก guild มีการกำหนด `channels` ไว้ ช่องทางที่ไม่อยู่ในรายการจะถูกปฏิเสธ
    - หาก guild ไม่มีบล็อก `channels` ช่องทางทั้งหมดใน guild ที่อยู่ใน allowlist จะได้รับอนุญาต

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

    หากคุณตั้งค่าเพียง `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` runtime fallback จะเป็น `groupPolicy="allowlist"` (พร้อมคำเตือนใน logs) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open` ก็ตาม

  </Tab>

  <Tab title="การกล่าวถึงและ group DM">
    ข้อความใน guild จะถูกกำหนดให้ต้องมีการกล่าวถึงตามค่าเริ่มต้น

    การตรวจจับการกล่าวถึงรวมถึง:

    - การกล่าวถึงบอทโดยตรง
    - รูปแบบการกล่าวถึงที่กำหนดไว้ (`agents.list[].groupChat.mentionPatterns`, สำรองไปยัง `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับบอทโดยนัยในกรณีที่รองรับ

    `requireMention` ถูกกำหนดค่าต่อ guild/ช่องทาง (`channels.discord.guilds...`)
    `ignoreOtherMentions` สามารถตั้งค่าให้ละทิ้งข้อความที่กล่าวถึงผู้ใช้/role อื่นแต่ไม่ได้กล่าวถึงบอทได้ (ไม่นับ @everyone/@here)

    Group DMs:

    - ค่าเริ่มต้น: ละเว้น (`dm.groupEnabled=false`)
    - allowlist แบบไม่บังคับผ่าน `dm.groupChannels` (channel IDs หรือ slugs)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตาม role

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิก Discord guild ไปยังเอเจนต์ต่างกันตาม role ID การผูกตาม role ยอมรับเฉพาะ role IDs และจะถูกประเมินหลังการผูก peer หรือ parent-peer และก่อนการผูกเฉพาะ guild หาก binding ตั้งค่า match fields อื่นไว้ด้วย (เช่น `peer` + `guildId` + `roles`) ทุกฟิลด์ที่กำหนดไว้ต้องตรงกันทั้งหมด

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

## การตั้งค่า Developer Portal

<AccordionGroup>
  <Accordion title="สร้างแอปและบอท">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. คัดลอก bot token

  </Accordion>

  <Accordion title="Privileged intents">
    ใน **Bot -> Privileged Gateway Intents** ให้เปิดใช้งาน:

    - Message Content Intent
    - Server Members Intent (แนะนำ)

    Presence intent เป็นตัวเลือกและจำเป็นเฉพาะเมื่อคุณต้องการรับการอัปเดตสถานะการออนไลน์เท่านั้น การตั้งค่าสถานะของบอท (`setPresence`) ไม่จำเป็นต้องเปิดใช้งานการอัปเดตสถานะของสมาชิก

  </Accordion>

  <Accordion title="OAuth scopes และสิทธิ์พื้นฐาน">
    ตัวสร้าง OAuth URL:

    - scopes: `bot`, `applications.commands`

    สิทธิ์พื้นฐานที่มักใช้:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (ไม่บังคับ)

    นี่คือชุดสิทธิ์พื้นฐานสำหรับช่องทางข้อความทั่วไป หากคุณวางแผนจะโพสต์ใน Discord threads รวมถึงเวิร์กโฟลว์ของช่องทาง forum หรือ media ที่สร้างหรือใช้งาน thread ต่อ ให้เปิดใช้งาน **Send Messages in Threads** เพิ่มด้วย
    หลีกเลี่ยง `Administrator` เว้นแต่จำเป็นอย่างชัดเจน

  </Accordion>

  <Accordion title="คัดลอก ID">
    เปิดใช้งาน Discord Developer Mode แล้วคัดลอก:

    - server ID
    - channel ID
    - user ID

    ควรใช้ ID ตัวเลขใน config ของ OpenClaw เพื่อให้การตรวจสอบและการ probe เชื่อถือได้

  </Accordion>
</AccordionGroup>

## คำสั่งแบบเนทีฟและการยืนยันสิทธิ์ของคำสั่ง

- `commands.native` มีค่าเริ่มต้นเป็น `"auto"` และเปิดใช้งานสำหรับ Discord
- การเขียนทับต่อช่องทาง: `channels.discord.commands.native`
- `commands.native=false` จะล้างคำสั่งแบบเนทีฟของ Discord ที่เคยลงทะเบียนไว้ก่อนหน้าอย่างชัดเจน
- การยืนยันสิทธิ์ของคำสั่งแบบเนทีฟใช้ allowlists/นโยบาย Discord เดียวกันกับการจัดการข้อความปกติ
- คำสั่งอาจยังมองเห็นได้ใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต; แต่เมื่อเรียกใช้จริง OpenClaw จะยังคงบังคับใช้นโยบายสิทธิ์และส่งกลับว่า "ไม่ได้รับอนุญาต"

ดู [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งและพฤติกรรม

การตั้งค่าคำสั่ง Slash เริ่มต้น:

- `ephemeral: true`

## รายละเอียดฟีเจอร์

<AccordionGroup>
  <Accordion title="แท็กการตอบกลับและการตอบกลับแบบเนทีฟ">
    Discord รองรับแท็กการตอบกลับในผลลัพธ์ของเอเจนต์:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    ควบคุมโดย `channels.discord.replyToMode`:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`
    - `batched`

    หมายเหตุ: `off` จะปิด implicit reply threading แต่แท็ก `[[reply_to_*]]` ที่ระบุอย่างชัดเจนจะยังคงมีผล
    `first` จะผูก implicit native reply reference เข้ากับข้อความ Discord ขาออกข้อความแรกของรอบนั้นเสมอ
    `batched` จะผูก implicit native reply reference ของ Discord เฉพาะเมื่อ
    รอบขาเข้าเป็นชุดที่ถูกดีบาวซ์จากหลายข้อความเท่านั้น วิธีนี้มีประโยชน์
    เมื่อคุณต้องการ native replies เป็นหลักสำหรับแชตที่คลุมเครือและส่งถี่เป็นชุด ไม่ใช่ทุก
    รอบที่มีข้อความเดียว

    message IDs จะถูกแสดงใน context/history เพื่อให้เอเจนต์กำหนดเป้าหมายข้อความที่ต้องการได้

  </Accordion>

  <Accordion title="พรีวิวสตรีมแบบสด">
    OpenClaw สามารถสตรีมฉบับร่างการตอบกลับได้โดยส่งข้อความชั่วคราวและแก้ไขข้อความนั้นเมื่อมีข้อความเข้ามา `channels.discord.streaming` รองรับ `off` (ค่าเริ่มต้น) | `partial` | `block` | `progress` โดย `progress` จะถูกแมปเป็น `partial` บน Discord; `streamMode` เป็นชื่อเดิมและจะถูกย้ายให้อัตโนมัติ

    ค่าเริ่มต้นยังคงเป็น `off` เนื่องจากการแก้ไขพรีวิวใน Discord จะชน rate limits ได้อย่างรวดเร็วเมื่อมีหลายบอทหรือหลาย gateway ใช้บัญชีเดียวกันร่วมกัน

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

    - `partial` จะแก้ไขข้อความพรีวิวเดียวเมื่อ token ทยอยเข้ามา
    - `block` จะปล่อยข้อความเป็นช่วงขนาดฉบับร่าง (ใช้ `draftChunk` เพื่อปรับขนาดและตำแหน่งแบ่ง โดยถูกจำกัดไม่เกิน `textChunkLimit`)
    - ข้อความสื่อ media ข้อผิดพลาด และข้อความ final แบบตอบกลับโดยชัดเจน จะยกเลิกการแก้ไขพรีวิวที่ค้างอยู่
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าการอัปเดต tool/progress จะใช้ข้อความพรีวิวซ้ำหรือไม่

    พรีวิวสตรีมรองรับเฉพาะข้อความเท่านั้น; การตอบกลับที่มี media จะกลับไปใช้การส่งแบบปกติ เมื่อเปิด `block` streaming อย่างชัดเจน OpenClaw จะข้าม preview stream เพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

  </Accordion>

  <Accordion title="ประวัติ บริบท และพฤติกรรมของ thread">
    บริบทประวัติของ guild:

    - `channels.discord.historyLimit` ค่าเริ่มต้น `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` คือปิดใช้งาน

    ตัวควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมของ thread:

    - Discord threads จะถูกกำหนดเส้นทางเป็น channel sessions และสืบทอด config ของ parent channel เว้นแต่จะมีการเขียนทับ
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) ทำให้ auto-threads ใหม่สามารถเลือกใช้การเริ่มต้นจาก transcript ของ parent ได้ การเขียนทับต่อบัญชีอยู่ภายใต้ `channels.discord.accounts.<id>.thread.inheritParent`
    - ปฏิกิริยาของ message-tool สามารถ resolve เป้าหมาย DM แบบ `user:<id>` ได้
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะยังคงถูกเก็บไว้ระหว่าง fallback การเปิดใช้งานในช่วงตอบกลับ

    หัวข้อของช่องทางจะถูก inject เป็นบริบทแบบ **ไม่เชื่อถือ** allowlists ใช้ควบคุมว่าใครสามารถกระตุ้นเอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบสมบูรณ์

  </Accordion>

  <Accordion title="sessions ที่ผูกกับ thread สำหรับ subagents">
    Discord สามารถผูก thread เข้ากับเป้าหมาย session ได้ เพื่อให้ข้อความติดตามผลใน thread นั้นยังคงถูกกำหนดเส้นทางไปยัง session เดิม (รวมถึง subagent sessions)

    คำสั่ง:

    - `/focus <target>` ผูก thread ปัจจุบัน/ใหม่เข้ากับเป้าหมาย subagent/session
    - `/unfocus` ลบการผูกของ thread ปัจจุบัน
    - `/agents` แสดง runs ที่กำลังทำงานและสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการยกเลิกโฟกัสอัตโนมัติจากการไม่มีการใช้งานสำหรับ focused bindings
    - `/session max-age <duration|off>` ตรวจสอบ/อัปเดตอายุสูงสุดแบบตายตัวสำหรับ focused bindings

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
        spawnSubagentSessions: false, // เปิดใช้เมื่อเลือกเอง
      },
    },
  },
}
```

    หมายเหตุ:

    - `session.threadBindings.*` กำหนดค่าเริ่มต้นแบบโกลบอล
    - `channels.discord.threadBindings.*` ใช้เขียนทับพฤติกรรมของ Discord
    - `spawnSubagentSessions` ต้องเป็น true เพื่อสร้าง/ผูก threads อัตโนมัติสำหรับ `sessions_spawn({ thread: true })`
    - `spawnAcpSessions` ต้องเป็น true เพื่อสร้าง/ผูก threads อัตโนมัติสำหรับ ACP (`/acp spawn ... --thread ...` หรือ `sessions_spawn({ runtime: "acp", thread: true })`)
    - หากปิดใช้งาน thread bindings สำหรับบัญชีหนึ่งอยู่ `/focus` และการดำเนินการผูก thread ที่เกี่ยวข้องจะไม่พร้อมใช้งาน

    ดู [Sub-agents](/th/tools/subagents), [ACP Agents](/th/tools/acp-agents) และ [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="การผูก ACP channel แบบคงอยู่ถาวร">
    สำหรับ ACP workspaces แบบคงที่ที่ "พร้อมใช้งานตลอดเวลา" ให้กำหนด typed ACP bindings ระดับบนสุดที่ชี้ไปยังการสนทนา Discord

    พาธ config:

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

    - `/acp spawn codex --bind here` จะผูกช่องทางหรือ thread ปัจจุบันไว้กับที่ และทำให้ข้อความในอนาคตยังคงอยู่บน ACP session เดิม ข้อความใน thread จะสืบทอดการผูกของ parent channel
    - ในช่องทางหรือ thread ที่ถูกผูกไว้แล้ว `/new` และ `/reset` จะรีเซ็ต ACP session เดิมในที่เดิม การผูก thread ชั่วคราวสามารถเขียนทับการแปลงเป้าหมายได้ขณะยังทำงานอยู่
    - `spawnAcpSessions` จำเป็นเฉพาะเมื่อ OpenClaw ต้องสร้าง/ผูก child thread ผ่าน `--thread auto|here`

    ดู [ACP Agents](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมการผูก

  </Accordion>

  <Accordion title="การแจ้งเตือนปฏิกิริยา">
    โหมดการแจ้งเตือนปฏิกิริยาต่อ guild:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    เหตุการณ์ปฏิกิริยาจะถูกแปลงเป็น system events และแนบเข้ากับ Discord session ที่ถูกกำหนดเส้นทาง

  </Accordion>

  <Accordion title="ปฏิกิริยา Ack">
    `ackReaction` จะส่งอีโมจิรับทราบขณะ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - อีโมจิ fallback จากตัวตนของเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้นเป็น "👀")

    หมายเหตุ:

    - Discord รองรับอีโมจิยูนิโค้ดหรือชื่ออีโมจิแบบกำหนดเอง
    - ใช้ `""` เพื่อปิดใช้งานปฏิกิริยาสำหรับช่องทางหรือบัญชี

  </Accordion>

  <Accordion title="การเขียน config">
    การเขียน config ที่เริ่มจากช่องทางเปิดใช้งานตามค่าเริ่มต้น

    สิ่งนี้มีผลต่อโฟลว์ `/config set|unset` (เมื่อเปิดใช้งานฟีเจอร์คำสั่ง)

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
    กำหนดเส้นทางทราฟฟิก WebSocket ของ Discord gateway และการค้นหา REST ตอนเริ่มต้น (application ID + การ resolve allowlist) ผ่าน HTTP(S) proxy ด้วย `channels.discord.proxy`

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    การเขียนทับต่อบัญชี:

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
    เปิดใช้งานการ resolve ของ PluralKit เพื่อแมปข้อความที่ถูก proxy ไปยังตัวตน system member:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // ไม่บังคับ; จำเป็นสำหรับ systems แบบ private
      },
    },
  },
}
```

    หมายเหตุ:

    - allowlists สามารถใช้ `pk:<memberId>` ได้
    - ชื่อแสดงผลของสมาชิกจะถูกจับคู่ตาม name/slug เท่านั้นเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การค้นหาใช้ message ID ต้นฉบับและถูกจำกัดด้วยช่วงเวลา
    - หากการค้นหาล้มเหลว ข้อความที่ถูก proxy จะถูกถือเป็นข้อความจากบอทและถูกละทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="การกำหนดค่า Presence">
    การอัปเดต Presence จะถูกนำไปใช้เมื่อคุณตั้งค่าฟิลด์สถานะหรือกิจกรรม หรือเมื่อคุณเปิดใช้งาน auto presence

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

    ตัวอย่างกิจกรรม (custom status เป็นประเภทกิจกรรมค่าเริ่มต้น):

```json5
{
  channels: {
    discord: {
      activity: "เวลาโฟกัส",
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
      activity: "เขียนโค้ดสด",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    แผนที่ประเภทกิจกรรม:

    - 0: Playing
    - 1: Streaming (ต้องมี `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (ใช้ข้อความกิจกรรมเป็นสถานะ state; อีโมจิเป็นตัวเลือก)
    - 5: Competing

    ตัวอย่าง auto presence (สัญญาณสุขภาพของ runtime):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token หมด",
      },
    },
  },
}
```

    auto presence จะแมปความพร้อมใช้งานของ runtime ไปยังสถานะ Discord: healthy => online, degraded หรือ unknown => idle, exhausted หรือ unavailable => dnd การเขียนทับข้อความแบบไม่บังคับ:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับ placeholder `{reason}`)

  </Accordion>

  <Accordion title="การอนุมัติใน Discord">
    Discord รองรับการจัดการการอนุมัติแบบใช้ปุ่มใน DM และสามารถเลือกโพสต์ข้อความแจ้งการอนุมัติในช่องทางต้นทางได้

    พาธ config:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; fallback ไปที่ `commands.ownerAllowFrom` ได้เมื่อเป็นไปได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord จะเปิดใช้งาน native exec approvals อัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และสามารถ resolve approver ได้อย่างน้อยหนึ่งราย ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมาน exec approvers จาก `allowFrom` ของช่องทาง, `dm.allowFrom` แบบเดิม หรือ `defaultTo` ของข้อความโดยตรง ตั้งค่า `enabled: false` เพื่อปิดใช้งาน Discord ในฐานะไคลเอนต์การอนุมัติแบบเนทีฟอย่างชัดเจน

    เมื่อ `target` เป็น `channel` หรือ `both` ข้อความแจ้งการอนุมัติจะมองเห็นได้ในช่องทาง มีเพียง approvers ที่ resolve ได้เท่านั้นที่ใช้ปุ่มได้; ผู้ใช้อื่นจะได้รับข้อความปฏิเสธแบบ ephemeral ข้อความแจ้งการอนุมัติจะมีข้อความคำสั่งรวมอยู่ด้วย ดังนั้นให้เปิดใช้งานการส่งในช่องทางเฉพาะในช่องทางที่เชื่อถือได้เท่านั้น หากไม่สามารถอนุมาน channel ID จาก session key ได้ OpenClaw จะ fallback ไปส่งทาง DM

    Discord ยังเรนเดอร์ปุ่มอนุมัติที่ใช้ร่วมกันกับช่องทางแชตอื่นด้วย ตัว adapter แบบเนทีฟของ Discord เพิ่มหลักๆ ในด้านการกำหนดเส้นทาง DM ของ approver และการกระจายไปยังช่องทาง
    เมื่อมีปุ่มเหล่านั้นอยู่ ปุ่มเหล่านั้นคือ UX หลักสำหรับการอนุมัติ OpenClaw
    ควรใส่คำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของ tool ระบุว่า
    chat approvals ไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียวเท่านั้น

    การยืนยันสิทธิ์ของ Gateway และการ resolve การอนุมัติจะเป็นไปตามสัญญา Gateway client ที่ใช้ร่วมกัน (`plugin:` IDs จะ resolve ผ่าน `plugin.approval.resolve`; IDs อื่น resolve ผ่าน `exec.approval.resolve`) การอนุมัติจะหมดอายุภายใน 30 นาทีตามค่าเริ่มต้น

    ดู [Exec approvals](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Tools และ action gates

Discord message actions ครอบคลุมการส่งข้อความ การดูแลช่องทาง การดูแลความเรียบร้อย Presence และการกระทำกับ metadata

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- ปฏิกิริยา: `react`, `reactions`, `emojiList`
- การดูแลความเรียบร้อย: `timeout`, `kick`, `ban`
- Presence: `setPresence`

แอ็กชัน `event-create` รองรับพารามิเตอร์ `image` แบบไม่บังคับ (URL หรือพาธไฟล์ในเครื่อง) เพื่อกำหนดภาพหน้าปกของ scheduled event

action gates อยู่ภายใต้ `channels.discord.actions.*`

พฤติกรรม gate เริ่มต้น:

| Action group                                                                                                                                                             | ค่าเริ่มต้น |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้งาน  |
| roles                                                                                                                                                                    | ปิดใช้งาน   |
| moderation                                                                                                                                                               | ปิดใช้งาน   |
| presence                                                                                                                                                                 | ปิดใช้งาน   |

## UI ของ Components v2

OpenClaw ใช้ Discord components v2 สำหรับ exec approvals และ cross-context markers นอกจากนี้ Discord message actions ยังสามารถรับ `components` สำหรับ UI แบบกำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้าง component payload ผ่าน discord tool) ขณะที่ `embeds` แบบเดิมยังคงใช้ได้ แต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` กำหนดสี accent ที่ใช้โดย Discord component containers (hex)
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

Discord มีพื้นผิวเสียง 2 แบบที่แยกจากกัน: **voice channels** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบพรีวิว waveform) gateway รองรับทั้งสองแบบ

### Voice channels

ข้อกำหนด:

- เปิดใช้งานคำสั่งแบบเนทีฟ (`commands.native` หรือ `channels.discord.commands.native`)
- กำหนดค่า `channels.discord.voice`
- บอทต้องมีสิทธิ์ Connect + Speak ใน voice channel เป้าหมาย

ใช้ `/vc join|leave|status` เพื่อควบคุม sessions คำสั่งนี้ใช้เอเจนต์ค่าเริ่มต้นของบัญชี และเป็นไปตามกฎ allowlist และ group policy เดียวกันกับคำสั่ง Discord อื่นๆ

ตัวอย่างการเข้าร่วมอัตโนมัติ:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

หมายเหตุ:

- `voice.tts` จะเขียนทับ `messages.tts` สำหรับการเล่นเสียงเท่านั้น
- รอบ transcript ของเสียงจะอนุมานสถานะเจ้าของจาก Discord `allowFrom` (หรือ `dm.allowFrom`); ผู้พูดที่ไม่ใช่เจ้าของจะไม่สามารถเข้าถึง tools ที่สงวนไว้สำหรับเจ้าของเท่านั้นได้ (เช่น `gateway` และ `cron`)
- เสียงเปิดใช้งานตามค่าเริ่มต้น; ตั้งค่า `channels.discord.voice.enabled=false` เพื่อปิดใช้งาน
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` จะส่งผ่านไปยัง join options ของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- OpenClaw ยังเฝ้าดู receive decrypt failures และกู้คืนอัตโนมัติโดยออกจากและเข้าร่วม voice channel ใหม่หลังเกิดความล้มเหลวซ้ำหลายครั้งในช่วงเวลาสั้นๆ
- หาก receive logs แสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำๆ อาจเป็นบั๊ก receive ฝั่ง upstream ของ `@discordjs/voice` ที่ติดตามไว้ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

### ข้อความเสียง

ข้อความเสียงใน Discord จะแสดงพรีวิว waveform และต้องใช้ออดิโอรูปแบบ OGG/Opus OpenClaw จะสร้าง waveform ให้อัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ gateway เพื่อใช้ตรวจสอบและแปลงไฟล์

- ระบุเป็น **พาธไฟล์ในเครื่อง** (ระบบจะปฏิเสธ URL)
- อย่าใส่เนื้อหาข้อความ (Discord ปฏิเสธข้อความ + ข้อความเสียงใน payload เดียวกัน)
- รองรับไฟล์เสียงทุกรูปแบบ; OpenClaw จะแปลงเป็น OGG/Opus ตามความจำเป็น

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ใช้ intents ที่ไม่ได้รับอนุญาตหรือบอทไม่เห็นข้อความใน guild">

    - เปิดใช้งาน Message Content Intent
    - เปิดใช้งาน Server Members Intent เมื่อต้องใช้การ resolve ผู้ใช้/สมาชิก
    - รีสตาร์ต gateway หลังเปลี่ยน intents

  </Accordion>

  <Accordion title="ข้อความใน guild ถูกบล็อกอย่างไม่คาดคิด">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบ guild allowlist ภายใต้ `channels.discord.guilds`
    - หากมีแผนที่ `channels` ของ guild อยู่ จะอนุญาตเฉพาะช่องทางที่อยู่ในรายการเท่านั้น
    - ตรวจสอบพฤติกรรม `requireMention` และรูปแบบการกล่าวถึง

    คำสั่งที่มีประโยชน์:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="ตั้ง requireMention เป็น false แล้วแต่ยังถูกบล็อก">
    สาเหตุที่พบบ่อย:

    - `groupPolicy="allowlist"` แต่ไม่มี guild/channel allowlist ที่ตรงกัน
    - กำหนด `requireMention` ไว้ผิดตำแหน่ง (ต้องอยู่ใต้ `channels.discord.guilds` หรือรายการ channel)
    - ผู้ส่งถูกบล็อกโดย allowlist `users` ของ guild/channel

  </Accordion>

  <Accordion title="ตัวจัดการที่ทำงานนานหมดเวลาหรือมีการตอบกลับซ้ำ">

    logs ที่พบบ่อย:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    ตัวปรับ budget ของ listener:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    ตัวปรับ run timeout ของ worker:

    - บัญชีเดียว: `channels.discord.inboundWorker.runTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - ค่าเริ่มต้น: `1800000` (30 นาที); ตั้งเป็น `0` เพื่อปิดใช้งาน

    ค่าพื้นฐานที่แนะนำ:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    ใช้ `eventQueue.listenerTimeout` สำหรับการตั้งค่า listener ที่ช้า และ `inboundWorker.runTimeoutMs`
    เฉพาะเมื่อคุณต้องการ safety valve แยกต่างหากสำหรับรอบเอเจนต์ที่อยู่ในคิว

  </Accordion>

  <Accordion title="ผลการตรวจสอบสิทธิ์ไม่ตรงกัน">
    การตรวจสอบสิทธิ์ของ `channels status --probe` ใช้ได้เฉพาะกับ channel ID แบบตัวเลขเท่านั้น

    หากคุณใช้คีย์แบบ slug การจับคู่ขณะรันอาจยังทำงานได้ แต่ probe จะไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน

  </Accordion>

  <Accordion title="ปัญหา DM และการจับคู่">

    - ปิดใช้งาน DM: `channels.discord.dm.enabled=false`
    - ปิดใช้งานนโยบาย DM: `channels.discord.dmPolicy="disabled"` (เดิม: `channels.discord.dm.policy`)
    - กำลังรอการอนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูปบอทคุยกับบอท">
    ตามค่าเริ่มต้น ข้อความที่สร้างโดยบอทจะถูกละเว้น

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎการกล่าวถึงและ allowlist ที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมแบบลูป
    ควรใช้ `channels.discord.allowBots="mentions"` เพื่อยอมรับเฉพาะข้อความจากบอทที่กล่าวถึงบอทเท่านั้น

  </Accordion>

  <Accordion title="Voice STT หลุดพร้อม DecryptionFailed(...)">

    - อัปเดต OpenClaw ให้เป็นปัจจุบัน (`openclaw update`) เพื่อให้มีตรรกะกู้คืนการรับเสียงของ Discord
    - ยืนยันว่า `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้นของ upstream) แล้วค่อยปรับเมื่อจำเป็นเท่านั้น
    - ดู logs สำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากยังล้มเหลวต่อหลังจากเข้าร่วมใหม่อัตโนมัติ ให้รวบรวม logs และเปรียบเทียบกับ [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## จุดอ้างอิงในเอกสารการกำหนดค่า

ข้อมูลอ้างอิงหลัก:

- [เอกสารอ้างอิงการกำหนดค่า - Discord](/th/gateway/configuration-reference#discord)

ฟิลด์ Discord ที่สำคัญ:

- การเริ่มต้นระบบ/การยืนยันตัวตน: `enabled`, `token`, `accounts.*`, `allowBots`
- นโยบาย: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- คำสั่ง: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- คิวเหตุการณ์: `eventQueue.listenerTimeout` (budget ของ listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- การตอบกลับ/ประวัติ: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่ง: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- การสตรีม: `streaming` (ชื่อเดิม: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/การลองใหม่: `mediaMaxMb`, `retry`
  - `mediaMaxMb` จำกัดขนาดอัปโหลดขาออกไปยัง Discord (ค่าเริ่มต้น: `100MB`)
- actions: `actions.*`
- Presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ฟีเจอร์: `threadBindings`, `bindings[]` ระดับบนสุด (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## ความปลอดภัยและการดำเนินงาน

- ปฏิบัติต่อ bot tokens เป็นความลับ (ควรใช้ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการควบคุมดูแล)
- ให้สิทธิ์ Discord เท่าที่จำเป็นเท่านั้น
- หากสถานะการ deploy/state ของคำสั่งล้าสมัย ให้รีสตาร์ต gateway แล้วตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

## ที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [กลุ่ม](/th/channels/groups)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [ความปลอดภัย](/th/gateway/security)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
- [การแก้ไขปัญหา](/th/channels/troubleshooting)
- [คำสั่ง Slash](/th/tools/slash-commands)
