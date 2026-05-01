---
read_when:
    - การทำงานกับฟีเจอร์ช่องทาง Discord
summary: สถานะการรองรับบอต Discord ความสามารถ และการกำหนดค่า
title: Discord
x-i18n:
    generated_at: "2026-05-01T10:13:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd12f85a0acb30f606ef97512c04b443b2be301272962340cb08596f91489bd2
    source_path: channels/discord.md
    workflow: 16
---

พร้อมสำหรับ DM และช่องของกิลด์ผ่าน Discord gateway อย่างเป็นทางการ

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    Discord DM จะใช้โหมดจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
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
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อเป็นบางอย่างเช่น "OpenClaw"

    คลิก **Bot** บนแถบด้านข้าง ตั้งค่า **Username** เป็นชื่อใดก็ได้ที่คุณใช้เรียก agent OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้งาน privileged intents">
    ยังอยู่ที่หน้า **Bot** เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้งาน:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับ role allowlist และการจับคู่ชื่อกับ ID)
    - **Presence Intent** (ไม่บังคับ; ต้องใช้เฉพาะสำหรับการอัปเดต presence)

  </Step>

  <Step title="คัดลอกโทเคนบอตของคุณ">
    เลื่อนกลับขึ้นไปบนหน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อจะเป็นเช่นนั้น แต่นี่จะสร้างโทเคนแรกของคุณ — ไม่มีสิ่งใดถูก "รีเซ็ต"
    </Note>

    คัดลอกโทเคนและบันทึกไว้ที่ใดที่หนึ่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในอีกสักครู่

  </Step>

  <Step title="สร้าง URL เชิญและเพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** บนแถบด้านข้าง คุณจะสร้าง URL เชิญพร้อมสิทธิ์ที่ถูกต้องเพื่อเพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ

    เลื่อนลงไปที่ **OAuth2 URL Generator** แล้วเปิดใช้งาน:

    - `bot`
    - `applications.commands`

    ส่วน **Bot Permissions** จะปรากฏด้านล่าง เปิดใช้งานอย่างน้อย:

    **General Permissions**
      - ดูช่อง
    **Text Permissions**
      - ส่งข้อความ
      - อ่านประวัติข้อความ
      - ฝังลิงก์
      - แนบไฟล์
      - เพิ่มรีแอ็กชัน (ไม่บังคับ)

    นี่คือชุดพื้นฐานสำหรับช่องข้อความปกติ หากคุณวางแผนจะโพสต์ในเธรด Discord รวมถึงเวิร์กโฟลว์ช่อง forum หรือ media ที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้งาน **Send Messages in Threads** ด้วย
    คัดลอก URL ที่สร้างขึ้นด้านล่าง วางลงในเบราว์เซอร์ของคุณ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอตของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิดใช้งาน Developer Mode และเก็บ ID ของคุณ">
    กลับไปที่แอป Discord คุณต้องเปิดใช้งาน Developer Mode เพื่อให้คัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนเฟืองถัดจากอวาตาร์ของคุณ) → **Advanced** → เปิด **Developer Mode**
    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ของคุณไว้ข้าง Bot Token — คุณจะส่งทั้งสามอย่างไปยัง OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาต DM จากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงานได้ Discord ต้องอนุญาตให้บอตของคุณส่ง DM ถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณ → **Privacy Settings** → เปิด **Direct Messages**

    สิ่งนี้ทำให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอต) ส่ง DM ถึงคุณได้ เปิดใช้งานสิ่งนี้ไว้หากคุณต้องการใช้ Discord DM กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่องกิลด์ คุณสามารถปิดใช้งาน DM หลังจากจับคู่แล้วได้

  </Step>

  <Step title="ตั้งค่าโทเคนบอตของคุณอย่างปลอดภัย (อย่าส่งในแชต)">
    โทเคนบอต Discord ของคุณเป็นความลับ (เหมือนรหัสผ่าน) ตั้งค่าบนเครื่องที่รัน OpenClaw ก่อนส่งข้อความถึง agent ของคุณ

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

    หาก OpenClaw กำลังรันเป็นบริการเบื้องหลังอยู่แล้ว ให้รีสตาร์ทผ่านแอป OpenClaw Mac หรือโดยหยุดและเริ่มกระบวนการ `openclaw gateway run` ใหม่
    สำหรับการติดตั้งแบบบริการที่จัดการ ให้รัน `openclaw gateway install` จาก shell ที่มี `DISCORD_BOT_TOKEN` อยู่ หรือเก็บตัวแปรไว้ใน `~/.openclaw/.env` เพื่อให้บริการ resolve env SecretRef ได้หลังจากรีสตาร์ท
    หากโฮสต์ของคุณถูกบล็อกหรือถูกจำกัดอัตราโดยการค้นหาแอปพลิเคชันตอนเริ่มต้นของ Discord ให้ตั้งค่า ID แอปพลิเคชัน/ไคลเอนต์ Discord จาก Developer Portal เพื่อให้การเริ่มต้นข้าม REST call นั้นได้ ใช้ `channels.discord.applicationId` สำหรับบัญชีเริ่มต้น หรือ `channels.discord.accounts.<accountId>.applicationId` เมื่อคุณรันบอต Discord หลายตัว

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="ถาม agent ของคุณ">
        แชตกับ agent OpenClaw ของคุณบนช่องที่มีอยู่ใดก็ได้ (เช่น Telegram) แล้วบอกสิ่งนี้ หาก Discord เป็นช่องแรกของคุณ ให้ใช้แท็บ CLI / config แทน

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

        สำหรับการตั้งค่าแบบสคริปต์หรือระยะไกล ให้เขียนบล็อก JSON5 เดียวกันด้วย `openclaw config patch --file ./discord.patch.json5 --dry-run` แล้วรันซ้ำโดยไม่มี `--dry-run` รองรับค่า `token` แบบ plaintext รองรับค่า SecretRef สำหรับ `channels.discord.token` ข้ามผู้ให้บริการ env/file/exec ด้วย ดู [การจัดการความลับ](/th/gateway/secrets)

        สำหรับบอต Discord หลายตัว ให้เก็บโทเคนบอตและ application ID แต่ละรายการไว้ใต้บัญชีของตัวเอง `channels.discord.applicationId` ระดับบนจะถูกสืบทอดโดยบัญชี ดังนั้นให้ตั้งค่าที่นั่นเฉพาะเมื่อทุกบัญชีควรใช้ application ID เดียวกัน

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
    รอจนกว่า Gateway จะรันอยู่ จากนั้น DM ไปยังบอตของคุณใน Discord บอตจะตอบกลับด้วยรหัสจับคู่

    <Tabs>
      <Tab title="ถาม agent ของคุณ">
        ส่งรหัสจับคู่ให้ agent ของคุณบนช่องที่มีอยู่:

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

    ตอนนี้คุณควรแชตกับ agent ของคุณใน Discord ผ่าน DM ได้แล้ว

  </Step>
</Steps>

<Note>
การ resolve โทเคนรับรู้ตามบัญชี ค่าโทเคนใน config จะชนะ env fallback `DISCORD_BOT_TOKEN` ใช้เฉพาะสำหรับบัญชีเริ่มต้นเท่านั้น
หากบัญชี Discord ที่เปิดใช้งานสองบัญชี resolve ไปยังโทเคนบอตเดียวกัน OpenClaw จะเริ่ม gateway monitor เพียงหนึ่งรายการสำหรับโทเคนนั้น โทเคนที่มาจาก config จะชนะ env fallback เริ่มต้น มิฉะนั้นบัญชีที่เปิดใช้งานรายการแรกจะชนะ และบัญชีซ้ำจะถูกรายงานว่าปิดใช้งาน
สำหรับ outbound calls ขั้นสูง (เครื่องมือ message/การกระทำของช่อง) จะใช้ `token` แบบระบุต่อ call สำหรับ call นั้น สิ่งนี้ใช้กับการกระทำแบบ send และ read/probe-style (เช่น read/search/fetch/thread/pins/permissions) การตั้งค่า policy/retry ของบัญชียังคงมาจากบัญชีที่เลือกใน active runtime snapshot
</Note>

## แนะนำ: ตั้งค่า workspace ของกิลด์

เมื่อ DM ทำงานแล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็น workspace เต็มรูปแบบที่แต่ละช่องมี session ของ agent ของตัวเองพร้อมบริบทของตัวเอง สิ่งนี้แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีแค่คุณและบอตของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณไปยัง guild allowlist">
    สิ่งนี้ทำให้ agent ของคุณตอบกลับในช่องใดก็ได้บนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ DM

    <Tabs>
      <Tab title="ถาม agent ของคุณ">
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

  <Step title="อนุญาตการตอบกลับโดยไม่มี @mention">
    โดยค่าเริ่มต้น agent ของคุณจะตอบกลับในช่องกิลด์เมื่อถูก @mentioned เท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณน่าจะต้องการให้ agent ตอบกลับทุกข้อความ

    ในช่องกิลด์ คำตอบสุดท้ายปกติของ assistant จะยังคงเป็นส่วนตัวตามค่าเริ่มต้น เอาต์พุต Discord ที่มองเห็นได้ต้องถูกส่งอย่างชัดเจนด้วยเครื่องมือ `message` เพื่อให้ agent สามารถเฝ้าดูอยู่เบื้องหลังตามค่าเริ่มต้น และโพสต์เฉพาะเมื่อ agent ตัดสินใจว่าการตอบกลับในช่องมีประโยชน์

    <Tabs>
      <Tab title="ถาม agent ของคุณ">
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

  <Step title="วางแผนสำหรับ memory ในช่องกิลด์">
    โดยค่าเริ่มต้น memory ระยะยาว (MEMORY.md) จะโหลดใน session DM เท่านั้น ช่องกิลด์จะไม่โหลด MEMORY.md อัตโนมัติ

    <Tabs>
      <Tab title="ถาม agent ของคุณ">
        > "When I ask questions in Discord channels, use memory_search or memory_get if you need long-term context from MEMORY.md."
      </Tab>
      <Tab title="Manual">
        หากคุณต้องการบริบทร่วมในทุกช่อง ให้ใส่คำสั่งที่เสถียรไว้ใน `AGENTS.md` หรือ `USER.md` (สิ่งเหล่านี้จะถูก injected สำหรับทุก session) เก็บโน้ตระยะยาวไว้ใน `MEMORY.md` และเข้าถึงตามต้องการด้วยเครื่องมือ memory
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างช่องบางช่องบนเซิร์ฟเวอร์ Discord ของคุณและเริ่มแชต agent ของคุณสามารถเห็นชื่อช่อง และแต่ละช่องจะมี session แยกของตัวเอง — ดังนั้นคุณสามารถตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ตามที่เข้ากับเวิร์กโฟลว์ของคุณ

## โมเดล runtime

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord
- การกำหนดเส้นทางการตอบกลับเป็นแบบกำหนดแน่นอน: การตอบกลับขาเข้าจาก Discord จะกลับไปยัง Discord
- เมตาดาตาของกิลด์/ช่อง Discord จะถูกเพิ่มลงในพรอมป์ของโมเดลเป็นบริบทที่ไม่น่าเชื่อถือ
  ไม่ใช่คำนำหน้าการตอบกลับที่ผู้ใช้มองเห็น หากโมเดลคัดลอก envelope นั้น
  กลับมา OpenClaw จะลบเมตาดาตาที่ถูกคัดลอกออกจากการตอบกลับขาออกและจาก
  บริบท replay ในอนาคต
- โดยค่าเริ่มต้น (`session.dmScope=main`) แชตโดยตรงจะแชร์เซสชันหลักของเอเจนต์ (`agent:main:main`)
- ช่องกิลด์เป็นคีย์เซสชันที่แยกกัน (`agent:<agentId>:discord:channel:<channelId>`)
- Group DM จะถูกละเว้นโดยค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่งสแลชแบบเนทีฟทำงานในเซสชันคำสั่งที่แยกไว้ (`agent:<agentId>:discord:slash:<userId>`) ขณะที่ยังคงพก `CommandTargetSessionKey` ไปยังเซสชันสนทนาที่ถูกกำหนดเส้นทาง
- การส่งประกาศ cron/Heartbeat แบบข้อความเท่านั้นไปยัง Discord ใช้คำตอบสุดท้ายที่
  assistant มองเห็นหนึ่งครั้ง เพย์โหลดสื่อและคอมโพเนนต์แบบมีโครงสร้างจะยังคง
  เป็นหลายข้อความเมื่อเอเจนต์ปล่อยเพย์โหลดที่ส่งมอบได้หลายรายการ

## ช่องฟอรัม

ช่องฟอรัมและช่องสื่อของ Discord รับได้เฉพาะโพสต์ในเธรดเท่านั้น OpenClaw รองรับสองวิธีในการสร้างรายการเหล่านี้:

- ส่งข้อความไปยังพาเรนต์ฟอรัม (`channel:<forumId>`) เพื่อสร้างเธรดโดยอัตโนมัติ ชื่อเธรดจะใช้บรรทัดแรกที่ไม่ว่างของข้อความของคุณ
- ใช้ `openclaw message thread create` เพื่อสร้างเธรดโดยตรง อย่าส่ง `--message-id` สำหรับช่องฟอรัม

ตัวอย่าง: ส่งไปยังพาเรนต์ฟอรัมเพื่อสร้างเธรด

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

ตัวอย่าง: สร้างเธรดฟอรัมอย่างชัดเจน

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

พาเรนต์ฟอรัมไม่รับคอมโพเนนต์ Discord หากคุณต้องใช้คอมโพเนนต์ ให้ส่งไปยังเธรดนั้นเอง (`channel:<threadId>`)

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับคอนเทนเนอร์คอมโพเนนต์ v2 ของ Discord สำหรับข้อความเอเจนต์ ใช้เครื่องมือข้อความพร้อมเพย์โหลด `components` ผลลัพธ์การโต้ตอบจะถูกกำหนดเส้นทางกลับไปยังเอเจนต์เป็นข้อความขาเข้าปกติและทำตามการตั้งค่า Discord `replyToMode` ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถว action อนุญาตปุ่มได้สูงสุด 5 ปุ่มหรือเมนู select เดียว
- ประเภท select: `string`, `user`, `role`, `mentionable`, `channel`

โดยค่าเริ่มต้น คอมโพเนนต์ใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่ออนุญาตให้ใช้ปุ่ม, select และฟอร์มได้หลายครั้งจนกว่าจะหมดอายุ

เพื่อจำกัดว่าใครคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (Discord user ID, แท็ก หรือ `*`) เมื่อกำหนดค่าแล้ว ผู้ใช้ที่ไม่ตรงกันจะได้รับการปฏิเสธแบบ ephemeral

คำสั่งสแลช `/model` และ `/models` เปิดตัวเลือกโมเดลแบบโต้ตอบที่มีดรอปดาวน์ provider, โมเดล และ runtime ที่เข้ากันได้ พร้อมขั้นตอน Submit `/models add` เลิกใช้แล้วและตอนนี้จะส่งคืนข้อความแจ้งเลิกใช้แทนการลงทะเบียนโมเดลจากแชต การตอบกลับของตัวเลือกเป็นแบบ ephemeral และมีเพียงผู้ใช้ที่เรียกใช้เท่านั้นที่ใช้ได้

ไฟล์แนบ:

- บล็อก `file` ต้องชี้ไปยังการอ้างอิงไฟล์แนบ (`attachment://<filename>`)
- ระบุไฟล์แนบผ่าน `media`/`path`/`filePath` (ไฟล์เดียว); ใช้ `media-gallery` สำหรับหลายไฟล์
- ใช้ `filename` เพื่อแทนที่ชื่ออัปโหลดเมื่อควรตรงกับการอ้างอิงไฟล์แนบ

ฟอร์ม modal:

- เพิ่ม `components.modal` พร้อมฟิลด์ได้สูงสุด 5 ฟิลด์
- ประเภทฟิลด์: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw เพิ่มปุ่มทริกเกอร์โดยอัตโนมัติ

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
    - `open` (ต้องให้ `channels.discord.allowFrom` มี `"*"`)
    - `disabled`

    หากนโยบาย DM ไม่ใช่ open ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือถูกแจ้งให้ pairing ในโหมด `pairing`)

    ลำดับความสำคัญแบบหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - สำหรับบัญชีเดียว `allowFrom` มีลำดับความสำคัญเหนือ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อ `allowFrom` ของตัวเองและ `dm.allowFrom` แบบเดิมไม่ได้ตั้งค่า
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    `channels.discord.dm.policy` และ `channels.discord.dm.allowFrom` แบบเดิมยังอ่านอยู่เพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การ mention `<@id>`

    โดยปกติ ID ตัวเลขล้วนจะ resolve เป็น ID ช่องเมื่อค่าเริ่มต้นของช่อง active อยู่ แต่ ID ที่อยู่ใน DM `allowFrom` ที่มีผลของบัญชีจะถูกปฏิบัติเป็นเป้าหมาย DM ของผู้ใช้เพื่อความเข้ากันได้

  </Tab>

  <Tab title="Guild policy">
    การจัดการกิลด์ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    baseline ที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    พฤติกรรม `allowlist`:

    - กิลด์ต้องตรงกับ `channels.discord.guilds` (แนะนำให้ใช้ `id`, รองรับ slug)
    - allowlist ผู้ส่งที่เลือกได้: `users` (แนะนำ stable ID) และ `roles` (role ID เท่านั้น); หากกำหนดค่าอย่างใดอย่างหนึ่ง ผู้ส่งจะได้รับอนุญาตเมื่อตรงกับ `users` หรือ `roles`
    - การจับคู่ชื่อ/แท็กโดยตรงถูกปิดโดยค่าเริ่มต้น; เปิดใช้ `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเป็นโหมดความเข้ากันได้แบบ break-glass เท่านั้น
    - รองรับชื่อ/แท็กสำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อใช้รายการชื่อ/แท็ก
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

    หากคุณตั้งค่าเฉพาะ `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` fallback ตอน runtime คือ `groupPolicy="allowlist"` (พร้อมคำเตือนในล็อก) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`

  </Tab>

  <Tab title="Mentions and group DMs">
    ข้อความกิลด์ถูกควบคุมด้วย mention โดยค่าเริ่มต้น

    การตรวจจับ mention รวมถึง:

    - การ mention บอทอย่างชัดเจน
    - รูปแบบ mention ที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรม reply-to-bot โดยนัยในกรณีที่รองรับ

    `requireMention` ถูกกำหนดค่าต่อกิลด์/ช่อง (`channels.discord.guilds...`)
    `ignoreOtherMentions` สามารถเลือกให้ทิ้งข้อความที่ mention ผู้ใช้/บทบาทอื่นแต่ไม่ใช่บอทได้ (ยกเว้น @everyone/@here)

    Group DM:

    - ค่าเริ่มต้น: ละเว้น (`dm.groupEnabled=false`)
    - allowlist ที่เลือกได้ผ่าน `dm.groupChannels` (ID ช่องหรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตามบทบาท

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิกกิลด์ Discord ไปยังเอเจนต์ต่าง ๆ ตาม role ID binding ตามบทบาทรับเฉพาะ role ID และจะถูกประเมินหลัง binding แบบ peer หรือ parent-peer และก่อน binding แบบ guild-only หาก binding ตั้งค่าฟิลด์ match อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ฟิลด์ที่กำหนดค่าทั้งหมดต้องตรงกัน

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
- การแทนที่ต่อช่อง: `channels.discord.commands.native`
- `commands.native=false` ล้างคำสั่งเนทีฟของ Discord ที่ลงทะเบียนไว้ก่อนหน้านี้อย่างชัดเจน
- การตรวจสอบสิทธิ์คำสั่งเนทีฟใช้ allowlist/นโยบายของ Discord เดียวกับการจัดการข้อความปกติ
- คำสั่งอาจยังมองเห็นได้ใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต; การดำเนินการยังคงบังคับใช้การตรวจสอบสิทธิ์ของ OpenClaw และส่งคืน "not authorized"

ดู [คำสั่งสแลช](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งและพฤติกรรม

การตั้งค่าคำสั่งสแลชเริ่มต้น:

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

    หมายเหตุ: `off` ปิดการทำเธรดตอบกลับโดยนัย แท็ก `[[reply_to_*]]` ที่ชัดเจนยังคงได้รับการปฏิบัติตาม
    `first` แนบการอ้างอิง native reply โดยนัยกับข้อความ Discord ขาออกข้อความแรกของเทิร์นเสมอ
    `batched` แนบการอ้างอิง native reply โดยนัยของ Discord เฉพาะเมื่อ
    เทิร์นขาเข้าเป็นชุดที่ debounce จากหลายข้อความ สิ่งนี้มีประโยชน์
    เมื่อคุณต้องการ native reply เป็นหลักสำหรับแชตที่มาเป็น burst และกำกวม ไม่ใช่ทุก
    เทิร์นข้อความเดี่ยว

    ID ข้อความจะแสดงในบริบท/ประวัติเพื่อให้เอเจนต์สามารถกำหนดเป้าหมายข้อความเฉพาะได้

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw สามารถสตรีมร่างคำตอบโดยส่งข้อความชั่วคราวและแก้ไขเมื่อมีข้อความเข้ามา `channels.discord.streaming` รับค่า `off` (ค่าเริ่มต้น) | `partial` | `block` | `progress` `progress` แมปเป็น `partial` บน Discord; `streamMode` เป็น alias แบบเดิมและจะถูกย้ายค่าโดยอัตโนมัติ

    ค่าเริ่มต้นยังคงเป็น `off` เพราะการแก้ไข preview ของ Discord จะชน rate limit อย่างรวดเร็วเมื่อมีบอทหรือ Gateway หลายตัวแชร์บัญชีเดียวกัน

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

    - `partial` แก้ไขข้อความ preview เดียวเมื่อ token เข้ามา
    - `block` ปล่อย chunk ขนาดร่าง (ใช้ `draftChunk` เพื่อปรับขนาดและจุดแบ่ง โดย clamp ตาม `textChunkLimit`)
    - สื่อ, ข้อผิดพลาด และผลลัพธ์สุดท้ายแบบ explicit-reply จะยกเลิกการแก้ไข preview ที่ค้างอยู่
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าอัปเดตของเครื่องมือ/ความคืบหน้าจะใช้ข้อความ preview ซ้ำหรือไม่

    การสตรีม preview เป็นแบบข้อความเท่านั้น; การตอบกลับแบบสื่อจะ fallback ไปยังการส่งปกติ เมื่อเปิดใช้การสตรีม `block` อย่างชัดเจน OpenClaw จะข้ามสตรีม preview เพื่อหลีกเลี่ยงการสตรีมซ้ำ

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    บริบทประวัติกิลด์:

    - ค่าเริ่มต้นของ `channels.discord.historyLimit` คือ `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    การควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมของเธรด:

    - เธรดของ Discord จะถูกกำหนดเส้นทางเป็นเซสชันของช่องทางและสืบทอดคอนฟิกของช่องทางแม่ เว้นแต่จะถูกกำหนดทับ.
    - เซสชันของเธรดจะสืบทอดการเลือก `/model` ระดับเซสชันของช่องทางแม่เป็นทางเลือกสำรองเฉพาะโมเดลเท่านั้น; การเลือก `/model` ภายในเธรดยังคงมีลำดับความสำคัญสูงกว่า และจะไม่คัดลอกประวัติบันทึกการสนทนาของแม่ เว้นแต่เปิดใช้การสืบทอดบันทึกการสนทนา.
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) เลือกให้เธรดอัตโนมัติใหม่เริ่มต้นจากบันทึกการสนทนาของแม่. การกำหนดทับรายบัญชีอยู่ใต้ `channels.discord.accounts.<id>.thread.inheritParent`.
    - ปฏิกิริยาจากเครื่องมือข้อความสามารถระบุเป้าหมายข้อความส่วนตัวแบบ `user:<id>` ได้.
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะถูกคงไว้ระหว่างการเปิดใช้งานแบบทางเลือกสำรองในขั้นตอบกลับ.

    หัวข้อช่องทางจะถูกแทรกเป็นบริบทที่**ไม่น่าเชื่อถือ**. รายการอนุญาตควบคุมว่าใครสามารถเรียกเอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมอย่างเต็มรูปแบบ.

  </Accordion>

  <Accordion title="เซสชันที่ผูกกับเธรดสำหรับซับเอเจนต์">
    Discord สามารถผูกเธรดกับเป้าหมายเซสชัน เพื่อให้ข้อความติดตามผลในเธรดนั้นยังคงถูกกำหนดเส้นทางไปยังเซสชันเดียวกัน (รวมถึงเซสชันของซับเอเจนต์).

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/ใหม่กับเป้าหมายซับเอเจนต์/เซสชัน
    - `/unfocus` ลบการผูกเธรดปัจจุบัน
    - `/agents` แสดงการทำงานที่ยังทำงานอยู่และสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งานสำหรับการผูกที่โฟกัสอยู่
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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    หมายเหตุ:

    - `session.threadBindings.*` ตั้งค่าเริ่มต้นส่วนกลาง.
    - `channels.discord.threadBindings.*` กำหนดทับพฤติกรรมของ Discord.
    - `spawnSubagentSessions` ต้องเป็น true เพื่อสร้าง/ผูกเธรดอัตโนมัติสำหรับ `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` ต้องเป็น true เพื่อสร้าง/ผูกเธรดอัตโนมัติสำหรับ ACP (`/acp spawn ... --thread ...` หรือ `sessions_spawn({ runtime: "acp", thread: true })`).
    - หากปิดใช้งานการผูกเธรดสำหรับบัญชีหนึ่ง `/focus` และการดำเนินการผูกเธรดที่เกี่ยวข้องจะไม่พร้อมใช้งาน.

    ดู [ซับเอเจนต์](/th/tools/subagents), [เอเจนต์ ACP](/th/tools/acp-agents), และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference).

  </Accordion>

  <Accordion title="การผูกช่องทาง ACP แบบคงอยู่">
    สำหรับเวิร์กสเปซ ACP แบบ "ทำงานตลอดเวลา" ที่เสถียร ให้กำหนดค่าการผูก ACP แบบมีชนิดในระดับบนสุดที่ชี้ไปยังการสนทนาของ Discord.

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

    - `/acp spawn codex --bind here` จะผูกช่องทางหรือเธรดปัจจุบันไว้กับที่ และทำให้ข้อความในอนาคตอยู่ในเซสชัน ACP เดิม. ข้อความในเธรดจะสืบทอดการผูกของช่องทางแม่.
    - ในช่องทางหรือเธรดที่ถูกผูกไว้ `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP เดิมไว้กับที่. การผูกเธรดชั่วคราวสามารถกำหนดทับการระบุเป้าหมายได้ขณะทำงานอยู่.
    - `spawnAcpSessions` จำเป็นเฉพาะเมื่อ OpenClaw ต้องสร้าง/ผูกเธรดย่อยผ่าน `--thread auto|here`.

    ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมการผูก.

  </Accordion>

  <Accordion title="การแจ้งเตือนปฏิกิริยา">
    โหมดการแจ้งเตือนปฏิกิริยาต่อกิลด์:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    เหตุการณ์ปฏิกิริยาจะถูกแปลงเป็นเหตุการณ์ระบบและแนบกับเซสชัน Discord ที่ถูกกำหนดเส้นทาง.

  </Accordion>

  <Accordion title="ปฏิกิริยาตอบรับ">
    `ackReaction` ส่งอีโมจิรับทราบในขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า.

    ลำดับการแก้ค่า:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - อีโมจิประจำตัวเอเจนต์เป็นทางเลือกสำรอง (`agents.list[].identity.emoji`, ไม่เช่นนั้น "👀")

    หมายเหตุ:

    - Discord ยอมรับอีโมจิ Unicode หรือชื่ออีโมจิแบบกำหนดเอง.
    - ใช้ `""` เพื่อปิดใช้งานปฏิกิริยาสำหรับช่องทางหรือบัญชี.

  </Accordion>

  <Accordion title="การเขียนคอนฟิก">
    การเขียนคอนฟิกที่เริ่มจากช่องทางเปิดใช้งานตามค่าเริ่มต้น.

    สิ่งนี้มีผลกับโฟลว์ `/config set|unset` (เมื่อเปิดใช้ฟีเจอร์คำสั่ง).

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
    กำหนดเส้นทางทราฟฟิก WebSocket ของ Gateway Discord และการค้นหา REST ตอนเริ่มต้น (รหัสแอปพลิเคชัน + การระบุรายการอนุญาต) ผ่านพร็อกซี HTTP(S) ด้วย `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    การกำหนดทับรายบัญชี:

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
    เปิดใช้การแก้ค่าของ PluralKit เพื่อจับคู่ข้อความที่ถูกพร็อกซีไปยังตัวตนสมาชิกของระบบ:

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

    - รายการอนุญาตสามารถใช้ `pk:<memberId>`
    - ชื่อที่แสดงของสมาชิกจะถูกจับคู่ตามชื่อ/slug เฉพาะเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การค้นหาใช้รหัสข้อความต้นฉบับและถูกจำกัดด้วยกรอบเวลา
    - หากค้นหาไม่สำเร็จ ข้อความที่ถูกพร็อกซีจะถูกถือเป็นข้อความบอตและถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="การกำหนดค่าสถานะออนไลน์">
    การอัปเดตสถานะออนไลน์จะถูกใช้เมื่อคุณตั้งค่าฟิลด์สถานะหรือกิจกรรม หรือเมื่อเปิดใช้สถานะออนไลน์อัตโนมัติ.

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

    ตัวอย่างกิจกรรม (สถานะแบบกำหนดเองเป็นชนิดกิจกรรมเริ่มต้น):

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

    แมปชนิดกิจกรรม:

    - 0: กำลังเล่น
    - 1: กำลังสตรีม (ต้องใช้ `activityUrl`)
    - 2: กำลังฟัง
    - 3: กำลังดู
    - 4: กำหนดเอง (ใช้ข้อความกิจกรรมเป็นสถานะ; อีโมจิเป็นตัวเลือก)
    - 5: กำลังแข่งขัน

    ตัวอย่างสถานะออนไลน์อัตโนมัติ (สัญญาณสุขภาพรันไทม์):

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

    สถานะออนไลน์อัตโนมัติแมปความพร้อมใช้งานของรันไทม์ไปยังสถานะ Discord: สุขภาพดี => ออนไลน์, เสื่อมลงหรือไม่ทราบ => ไม่อยู่, หมดทรัพยากรหรือไม่พร้อมใช้งาน => ห้ามรบกวน. ข้อความกำหนดทับที่เลือกได้:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับตัวแทนค่า `{reason}`)

  </Accordion>

  <Accordion title="การอนุมัติใน Discord">
    Discord รองรับการจัดการการอนุมัติผ่านปุ่มในข้อความส่วนตัว และสามารถโพสต์ข้อความแจ้งการอนุมัติในช่องทางต้นทางได้ตามต้องการ.

    พาธคอนฟิก:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; ถอยกลับไปใช้ `commands.ownerAllowFrom` เมื่อเป็นไปได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord จะเปิดใช้การอนุมัติการเรียกใช้แบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และสามารถระบุผู้อนุมัติได้อย่างน้อยหนึ่งคน ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom`. Discord จะไม่อนุมานผู้อนุมัติการเรียกใช้จาก `allowFrom` ของช่องทาง, `dm.allowFrom` แบบเดิม, หรือ `defaultTo` ของข้อความส่วนตัว. ตั้งค่า `enabled: false` เพื่อปิดใช้ Discord ในฐานะไคลเอนต์การอนุมัติแบบเนทีฟอย่างชัดเจน.

    สำหรับคำสั่งกลุ่มที่ละเอียดอ่อนและเฉพาะเจ้าของเท่านั้น เช่น `/diagnostics` และ `/export-trajectory`, OpenClaw จะส่งข้อความแจ้งการอนุมัติและผลลัพธ์สุดท้ายแบบส่วนตัว. ระบบจะลองใช้ข้อความส่วนตัวของ Discord ก่อนเมื่อเจ้าของที่เรียกใช้มีเส้นทางเจ้าของของ Discord; หากไม่มี ระบบจะถอยกลับไปใช้เส้นทางเจ้าของแรกที่พร้อมใช้งานจาก `commands.ownerAllowFrom` เช่น Telegram.

    เมื่อ `target` เป็น `channel` หรือ `both` ข้อความแจ้งการอนุมัติจะมองเห็นได้ในช่องทาง. เฉพาะผู้อนุมัติที่ระบุได้เท่านั้นที่ใช้ปุ่มได้; ผู้ใช้อื่นจะได้รับการปฏิเสธแบบชั่วคราว. ข้อความแจ้งการอนุมัติรวมข้อความคำสั่งไว้ด้วย ดังนั้นให้เปิดใช้การส่งผ่านช่องทางเฉพาะในช่องทางที่เชื่อถือได้เท่านั้น. หากไม่สามารถอนุมานรหัสช่องทางจากคีย์เซสชันได้ OpenClaw จะถอยกลับไปส่งเป็นข้อความส่วนตัว.

    Discord ยังเรนเดอร์ปุ่มอนุมัติร่วมที่ช่องทางแชตอื่นใช้. อะแดปเตอร์ Discord แบบเนทีฟหลักๆ เพิ่มการกำหนดเส้นทางข้อความส่วนตัวไปยังผู้อนุมัติและการกระจายไปยังช่องทาง.
    เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นคือประสบการณ์การอนุมัติหลัก; OpenClaw
    ควรรวมคำสั่ง `/approve` แบบทำเองเฉพาะเมื่อผลลัพธ์เครื่องมือระบุว่า
    การอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบทำเองเป็นเส้นทางเดียว.
    หากรันไทม์การอนุมัติแบบเนทีฟของ Discord ไม่ทำงาน OpenClaw จะคง
    ข้อความแจ้ง `/approve <id> <decision>` แบบกำหนดได้แน่นอนในเครื่องให้มองเห็นได้. หาก
    รันไทม์ทำงานอยู่แต่ไม่สามารถส่งการ์ดเนทีฟไปยังเป้าหมายใดได้,
    OpenClaw จะส่งประกาศทางเลือกสำรองในแชตเดียวกันพร้อมคำสั่ง `/approve`
    แบบตรงตัวจากการอนุมัติที่ค้างอยู่.

    การยืนยันตัวตนของ Gateway และการแก้ผลการอนุมัติทำตามสัญญาไคลเอนต์ Gateway ร่วม (รหัสแบบ `plugin:` จะถูกแก้ผ่าน `plugin.approval.resolve`; รหัสอื่นผ่าน `exec.approval.resolve`). การอนุมัติหมดอายุหลังจาก 30 นาทีตามค่าเริ่มต้น.

    ดู [การอนุมัติการเรียกใช้](/th/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## เครื่องมือและเกตการดำเนินการ

การกระทำกับข้อความ Discord รวมถึงการส่งข้อความ, การจัดการช่องทาง, การกลั่นกรอง, สถานะออนไลน์, และการกระทำกับเมตาดาตา.

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- ปฏิกิริยา: `react`, `reactions`, `emojiList`
- การกลั่นกรอง: `timeout`, `kick`, `ban`
- สถานะออนไลน์: `setPresence`

การกระทำ `event-create` รับพารามิเตอร์ `image` ที่ไม่บังคับ (URL หรือพาธไฟล์ในเครื่อง) เพื่อตั้งค่ารูปภาพหน้าปกของเหตุการณ์ที่กำหนดเวลาไว้.

เกตการดำเนินการอยู่ใต้ `channels.discord.actions.*`.

พฤติกรรมเกตเริ่มต้น:

| กลุ่มการดำเนินการ                                                                                                                                                             | ค่าเริ่มต้น  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้งาน  |
| roles                                                                                                                                                                    | ปิดใช้งาน |
| moderation                                                                                                                                                               | ปิดใช้งาน |
| presence                                                                                                                                                                 | ปิดใช้งาน |

## ส่วนติดต่อผู้ใช้คอมโพเนนต์ v2

OpenClaw ใช้คอมโพเนนต์ Discord v2 สำหรับการอนุมัติ exec และเครื่องหมายข้ามบริบท การดำเนินการกับข้อความ Discord ยังสามารถรับ `components` สำหรับส่วนติดต่อผู้ใช้แบบกำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้างเพย์โหลดคอมโพเนนต์ผ่านเครื่องมือ discord) ขณะที่ `embeds` แบบเดิมยังใช้งานได้ แต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นที่ใช้โดยคอนเทนเนอร์คอมโพเนนต์ของ Discord (hex)
- ตั้งค่าต่อบัญชีด้วย `channels.discord.accounts.<id>.ui.components.accentColor`
- `embeds` จะถูกละเว้นเมื่อมีคอมโพเนนต์ v2

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

Discord มีพื้นผิวเสียงที่แตกต่างกันสองแบบ: **ช่องเสียง** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบตัวอย่างคลื่นเสียง) Gateway รองรับทั้งสองแบบ

### ช่องเสียง

รายการตรวจสอบการตั้งค่า:

1. เปิดใช้งาน Message Content Intent ใน Discord Developer Portal
2. เปิดใช้งาน Server Members Intent เมื่อใช้ allowlist ของบทบาท/ผู้ใช้
3. เชิญบอตด้วยขอบเขต `bot` และ `applications.commands`
4. ให้สิทธิ์ Connect, Speak, Send Messages และ Read Message History ในช่องเสียงเป้าหมาย
5. เปิดใช้งานคำสั่งเนทีฟ (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งนี้ใช้เอเจนต์เริ่มต้นของบัญชี และทำตามกฎ allowlist และนโยบายกลุ่มเดียวกับคำสั่ง Discord อื่นๆ

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

- `voice.tts` จะแทนที่ `messages.tts` สำหรับการเล่นเสียงเท่านั้น
- `voice.model` จะแทนที่ LLM ที่ใช้สำหรับการตอบกลับช่องเสียง Discord เท่านั้น ปล่อยไว้ไม่ตั้งค่าเพื่อสืบทอดโมเดลเอเจนต์ที่ถูกกำหนดเส้นทาง
- STT ใช้ `tools.media.audio`; `voice.model` ไม่ส่งผลต่อการถอดเสียง
- เทิร์นทรานสคริปต์เสียงอนุมานสถานะเจ้าของจาก `allowFrom` ของ Discord (หรือ `dm.allowFrom`); ผู้พูดที่ไม่ใช่เจ้าของไม่สามารถเข้าถึงเครื่องมือสำหรับเจ้าของเท่านั้นได้ (เช่น `gateway` และ `cron`)
- เสียงเปิดใช้งานโดยค่าเริ่มต้น; ตั้งค่า `channels.discord.voice.enabled=false` เพื่อปิดใช้งานรันไทม์เสียงและ Gateway intent `GuildVoiceStates`
- `channels.discord.intents.voiceStates` สามารถแทนที่การสมัครรับ intent สถานะเสียงได้อย่างชัดเจน ปล่อยไว้ไม่ตั้งค่าเพื่อให้ intent ทำตาม `voice.enabled`
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือกการเข้าร่วมของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- OpenClaw ยังเฝ้าดูความล้มเหลวในการถอดรหัสขารับ และกู้คืนอัตโนมัติโดยออกจาก/เข้าร่วมช่องเสียงใหม่หลังเกิดความล้มเหลวซ้ำๆ ในช่วงเวลาสั้นๆ
- หากบันทึกขารับแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำๆ หลังอัปเดต ให้รวบรวมรายงาน dependency และบันทึก รายการ `@discordjs/voice` ที่มาพร้อมกันรวมการแก้ไข padding จากต้นน้ำใน discord.js PR #11449 ซึ่งปิด issue #11419 ของ discord.js แล้ว

ไปป์ไลน์ช่องเสียง:

- การจับเสียง PCM ของ Discord จะถูกแปลงเป็นไฟล์ชั่วคราว WAV
- `tools.media.audio` จัดการ STT เช่น `openai/gpt-4o-mini-transcribe`
- ทรานสคริปต์จะถูกส่งผ่าน ingress และการกำหนดเส้นทางของ Discord ขณะที่ LLM สำหรับการตอบกลับทำงานด้วยนโยบายเอาต์พุตเสียงที่ซ่อนเครื่องมือ `tts` ของเอเจนต์และขอข้อความที่ส่งคืน เพราะเสียง Discord เป็นเจ้าของการเล่น TTS สุดท้าย
- เมื่อมีการตั้งค่า `voice.model` จะแทนที่เฉพาะ LLM สำหรับการตอบกลับของเทิร์นช่องเสียงนี้
- `voice.tts` จะถูกผสานทับ `messages.tts`; เสียงที่ได้จะถูกเล่นในช่องที่เข้าร่วม

ข้อมูลรับรองจะถูกแก้ไขแยกตามคอมโพเนนต์: การตรวจสอบสิทธิ์เส้นทาง LLM สำหรับ `voice.model`, การตรวจสอบสิทธิ์ STT สำหรับ `tools.media.audio` และการตรวจสอบสิทธิ์ TTS สำหรับ `messages.tts`/`voice.tts`

### ข้อความเสียง

ข้อความเสียง Discord แสดงตัวอย่างคลื่นเสียงและต้องใช้ออดิโอ OGG/Opus OpenClaw สร้างคลื่นเสียงให้อัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ Gateway เพื่อสำรวจและแปลง

- ระบุ **เส้นทางไฟล์ในเครื่อง** (URL จะถูกปฏิเสธ)
- ละเว้นเนื้อหาข้อความ (Discord ปฏิเสธข้อความ + ข้อความเสียงในเพย์โหลดเดียวกัน)
- ยอมรับรูปแบบเสียงใดๆ; OpenClaw จะแปลงเป็น OGG/Opus ตามต้องการ

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ใช้ intent ที่ไม่อนุญาต หรือบอตไม่เห็นข้อความ guild">

    - เปิดใช้งาน Message Content Intent
    - เปิดใช้งาน Server Members Intent เมื่อคุณพึ่งพาการแก้ไขผู้ใช้/สมาชิก
    - รีสตาร์ต Gateway หลังเปลี่ยน intent

  </Accordion>

  <Accordion title="ข้อความ guild ถูกบล็อกโดยไม่คาดคิด">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบ allowlist ของ guild ใต้ `channels.discord.guilds`
    - หากมีแมป `channels` ของ guild เฉพาะช่องที่ระบุไว้เท่านั้นที่ได้รับอนุญาต
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

    - `groupPolicy="allowlist"` โดยไม่มี allowlist ของ guild/ช่องที่ตรงกัน
    - กำหนดค่า `requireMention` ผิดตำแหน่ง (ต้องอยู่ใต้ `channels.discord.guilds` หรือรายการช่อง)
    - ผู้ส่งถูกบล็อกโดย allowlist `users` ของ guild/ช่อง

  </Accordion>

  <Accordion title="เทิร์น Discord ที่ทำงานนาน หรือการตอบกลับซ้ำ">

    บันทึกทั่วไป:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    ปุ่มปรับคิว Gateway ของ Discord:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - สิ่งนี้ควบคุมเฉพาะงานตัวฟัง Gateway ของ Discord ไม่ใช่อายุการทำงานของเทิร์นเอเจนต์

    Discord ไม่ใช้การหมดเวลาที่ช่องเป็นเจ้าของกับเทิร์นเอเจนต์ที่อยู่ในคิว ตัวฟังข้อความส่งต่อทันที และการรัน Discord ที่อยู่ในคิวจะคงลำดับต่อเซสชันไว้จนกว่าวงจรชีวิตเซสชัน/เครื่องมือ/รันไทม์จะเสร็จสิ้นหรือยกเลิกงาน

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
    OpenClaw ดึงเมตาดาต้า `/gateway/bot` ของ Discord ก่อนเชื่อมต่อ ความล้มเหลวชั่วคราวจะถอยกลับไปใช้ URL Gateway เริ่มต้นของ Discord และถูกจำกัดอัตราในบันทึก

    ปุ่มปรับการหมดเวลาเมตาดาต้า:

    - บัญชีเดียว: `channels.discord.gatewayInfoTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - ค่าถอยกลับจาก env เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - ค่าเริ่มต้น: `30000` (30 วินาที), ค่าสูงสุด: `120000`

  </Accordion>

  <Accordion title="การตรวจสอบสิทธิ์ไม่ตรงกัน">
    การตรวจสอบสิทธิ์ `channels status --probe` ใช้ได้เฉพาะกับ ID ช่องแบบตัวเลขเท่านั้น

    หากคุณใช้คีย์ slug การจับคู่รันไทม์ยังอาจทำงานได้ แต่ probe ไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน

  </Accordion>

  <Accordion title="ปัญหา DM และการจับคู่">

    - ปิดใช้งาน DM: `channels.discord.dm.enabled=false`
    - ปิดใช้งานนโยบาย DM: `channels.discord.dmPolicy="disabled"` (เดิม: `channels.discord.dm.policy`)
    - รอการอนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูปบอตต่อบอต">
    โดยค่าเริ่มต้น ข้อความที่สร้างโดยบอตจะถูกละเว้น

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎการกล่าวถึงและ allowlist ที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมลูป
    แนะนำให้ใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความบอตที่กล่าวถึงบอตเท่านั้น

  </Accordion>

  <Accordion title="Voice STT หลุดด้วย DecryptionFailed(...)">

    - รักษา OpenClaw ให้เป็นเวอร์ชันปัจจุบัน (`openclaw update`) เพื่อให้มีตรรกะการกู้คืนการรับเสียง Discord
    - ยืนยัน `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้นต้นน้ำ) และปรับเฉพาะเมื่อจำเป็น
    - ดูบันทึกสำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากความล้มเหลวยังคงเกิดขึ้นหลังเข้าร่วมใหม่อัตโนมัติ ให้รวบรวมบันทึกและเปรียบเทียบกับประวัติการรับ DAVE ต้นน้ำใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Discord](/th/gateway/config-channels#discord)

<Accordion title="ฟิลด์ Discord ที่ให้สัญญาณสำคัญ">

- การเริ่มต้น/การตรวจสอบสิทธิ์: `enabled`, `token`, `accounts.*`, `allowBots`
- นโยบาย: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- คำสั่ง: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- คิวเหตุการณ์: `eventQueue.listenerTimeout` (งบตัวฟัง), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- เมตาดาต้า Gateway: `gatewayInfoTimeoutMs`
- การตอบกลับ/ประวัติ: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- สตรีมมิง: `streaming` (นามแฝงเดิม: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- สื่อ/ลองใหม่: `mediaMaxMb` (จำกัดการอัปโหลดออกไปยัง Discord, ค่าเริ่มต้น `100MB`), `retry`
- การดำเนินการ: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- ส่วนติดต่อผู้ใช้: `ui.components.accentColor`
- ฟีเจอร์: `threadBindings`, `bindings[]` ระดับบนสุด (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการดำเนินงาน

- ปฏิบัติต่อโทเค็นบอตเป็นความลับ (แนะนำ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการกำกับดูแล)
- ให้สิทธิ์ Discord ตามหลักสิทธิ์น้อยที่สุด
- หากการปรับใช้/สถานะคำสั่งล้าสมัย ให้รีสตาร์ต Gateway และตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Discord เข้ากับ Gateway
  </Card>
  <Card title="Groups" icon="users" href="/th/channels/groups">
    ลักษณะการทำงานของแชตกลุ่มและรายการที่อนุญาต
  </Card>
  <Card title="Channel routing" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="Security" icon="shield" href="/th/gateway/security">
    แบบจำลองภัยคุกคามและการเสริมความปลอดภัย
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกิลด์และช่องไปยังเอเจนต์
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    ลักษณะการทำงานของคำสั่งแบบเนทีฟ
  </Card>
</CardGroup>
