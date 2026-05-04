---
read_when:
    - การทำงานกับฟีเจอร์ช่องทาง Discord
summary: สถานะการรองรับบอต Discord ความสามารถ และการกำหนดค่า
title: Discord
x-i18n:
    generated_at: "2026-05-04T07:02:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e00f9d9b134296ac1ca52bb4058fc62ea7a95c4d46d9478648b2ecdd448652a
    source_path: channels/discord.md
    workflow: 16
---

พร้อมสำหรับ DM และช่องกิลด์ผ่าน Gateway ทางการของ Discord

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ Discord จะใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแคตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องและขั้นตอนการซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าแบบเร็ว

คุณจะต้องสร้างแอปพลิเคชันใหม่พร้อมบอต เพิ่มบอตลงในเซิร์ฟเวอร์ของคุณ และจับคู่กับ OpenClaw เราแนะนำให้เพิ่มบอตของคุณลงในเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากคุณยังไม่มี ให้[สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="สร้างแอปพลิเคชันและบอต Discord">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อเช่น "OpenClaw"

    คลิก **Bot** บนแถบด้านข้าง ตั้งค่า **Username** เป็นชื่อใดก็ได้ที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้งาน privileged intents">
    ยังอยู่บนหน้า **Bot** ให้เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้งาน:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับ allowlist ตามบทบาทและการจับคู่ชื่อกับ ID)
    - **Presence Intent** (ไม่บังคับ; จำเป็นเฉพาะสำหรับการอัปเดต presence)

  </Step>

  <Step title="คัดลอกโทเค็นบอตของคุณ">
    เลื่อนกลับขึ้นไปบนหน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อจะเป็นเช่นนั้น แต่นี่คือการสร้างโทเค็นแรกของคุณ — ไม่มีสิ่งใดถูก "รีเซ็ต"
    </Note>

    คัดลอกโทเค็นและบันทึกไว้ที่ใดที่หนึ่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในอีกไม่นาน

  </Step>

  <Step title="สร้าง URL คำเชิญและเพิ่มบอตลงในเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** บนแถบด้านข้าง คุณจะสร้าง URL คำเชิญพร้อมสิทธิ์ที่ถูกต้องเพื่อเพิ่มบอตลงในเซิร์ฟเวอร์ของคุณ

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
    คัดลอก URL ที่สร้างไว้ด้านล่าง วางในเบราว์เซอร์ของคุณ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอตของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิดใช้งาน Developer Mode และเก็บ ID ของคุณ">
    กลับไปที่แอป Discord คุณต้องเปิดใช้งาน Developer Mode เพื่อให้คัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนเฟืองถัดจากรูปโปรไฟล์ของคุณ) → **Advanced** → เปิด **Developer Mode**
    2. คลิกขวาที่ **server icon** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **own avatar** ของคุณ → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ของคุณไว้คู่กับ Bot Token — คุณจะส่งทั้งสามอย่างไปยัง OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาต DM จากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงาน Discord ต้องอนุญาตให้บอตของคุณส่ง DM ถึงคุณได้ คลิกขวาที่ **server icon** ของคุณ → **Privacy Settings** → เปิด **Direct Messages**

    การตั้งค่านี้ทำให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอต) ส่ง DM ถึงคุณได้ เปิดไว้ต่อไปหากคุณต้องการใช้ DM ของ Discord กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่องกิลด์ คุณสามารถปิด DM หลังจากจับคู่แล้ว

  </Step>

  <Step title="ตั้งค่าโทเค็นบอตอย่างปลอดภัย (อย่าส่งในแชต)">
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

    หาก OpenClaw กำลังรันเป็นบริการเบื้องหลังอยู่แล้ว ให้รีสตาร์ทผ่านแอป OpenClaw Mac หรือหยุดแล้วเริ่มกระบวนการ `openclaw gateway run` ใหม่
    สำหรับการติดตั้งบริการที่จัดการไว้ ให้รัน `openclaw gateway install` จากเชลล์ที่มี `DISCORD_BOT_TOKEN` อยู่ หรือเก็บตัวแปรไว้ใน `~/.openclaw/.env` เพื่อให้บริการ resolve env SecretRef ได้หลังรีสตาร์ท
    หากโฮสต์ของคุณถูกบล็อกหรือถูกจำกัดอัตราโดยการค้นหาแอปพลิเคชันตอนเริ่มต้นของ Discord ให้ตั้งค่า ID แอปพลิเคชัน/ไคลเอนต์ Discord จาก Developer Portal เพื่อให้การเริ่มต้นข้าม REST call นั้นได้ ใช้ `channels.discord.applicationId` สำหรับบัญชีค่าเริ่มต้น หรือ `channels.discord.accounts.<accountId>.applicationId` เมื่อคุณรันบอต Discord หลายตัว

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        แชตกับเอเจนต์ OpenClaw ของคุณบนช่องที่มีอยู่ใดก็ได้ (เช่น Telegram) แล้วบอกเอเจนต์ หาก Discord เป็นช่องแรกของคุณ ให้ใช้แท็บ CLI / config แทน

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

        Env fallback สำหรับบัญชีค่าเริ่มต้น:

```bash
DISCORD_BOT_TOKEN=...
```

        สำหรับการตั้งค่าแบบสคริปต์หรือระยะไกล ให้เขียนบล็อก JSON5 เดียวกันด้วย `openclaw config patch --file ./discord.patch.json5 --dry-run` แล้วรันซ้ำโดยไม่มี `--dry-run` รองรับค่า `token` แบบ plaintext และรองรับค่า SecretRef สำหรับ `channels.discord.token` ผ่านผู้ให้บริการ env/file/exec ด้วย ดู [การจัดการ Secrets](/th/gateway/secrets)

        สำหรับบอต Discord หลายตัว ให้เก็บโทเค็นบอตและ ID แอปพลิเคชันแต่ละตัวไว้ใต้บัญชีของตัวเอง `channels.discord.applicationId` ระดับบนสุดจะถูกสืบทอดโดยบัญชีต่างๆ ดังนั้นให้ตั้งไว้ตรงนั้นเฉพาะเมื่อทุกบัญชีควรใช้ ID แอปพลิเคชันเดียวกัน

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
    รอจนกว่า Gateway จะรันอยู่ แล้วส่ง DM ถึงบอตของคุณใน Discord บอตจะตอบกลับด้วยรหัสจับคู่

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        ส่งรหัสจับคู่ไปยังเอเจนต์ของคุณบนช่องที่มีอยู่:

        > "อนุมัติรหัสจับคู่ Discord นี้: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    รหัสจับคู่หมดอายุหลังจาก 1 ชั่วโมง

    ตอนนี้คุณควรแชตกับเอเจนต์ของคุณใน Discord ผ่าน DM ได้แล้ว

  </Step>
</Steps>

<Note>
การ resolve โทเค็นรับรู้ตามบัญชี ค่าโทเค็นใน config มีลำดับความสำคัญเหนือ env fallback `DISCORD_BOT_TOKEN` ใช้เฉพาะกับบัญชีค่าเริ่มต้นเท่านั้น
หากบัญชี Discord ที่เปิดใช้งานสองบัญชี resolve เป็นโทเค็นบอตเดียวกัน OpenClaw จะเริ่ม gateway monitor เพียงหนึ่งตัวสำหรับโทเค็นนั้น โทเค็นจาก config มีลำดับความสำคัญเหนือ env fallback ค่าเริ่มต้น มิฉะนั้นบัญชีที่เปิดใช้งานบัญชีแรกจะมีลำดับความสำคัญ และบัญชีซ้ำจะถูกรายงานว่าปิดใช้งาน
สำหรับ outbound call ขั้นสูง (เครื่องมือ message/การดำเนินการ channel) จะใช้ `token` แบบระบุต่อ call สำหรับ call นั้น การตั้งค่านี้ใช้กับการส่งและการดำเนินการแบบอ่าน/probe (เช่น read/search/fetch/thread/pins/permissions) การตั้งค่านโยบายบัญชี/retry ยังคงมาจากบัญชีที่เลือกใน runtime snapshot ที่ใช้งานอยู่
</Note>

## แนะนำ: ตั้งค่าพื้นที่ทำงานกิลด์

เมื่อ DM ทำงานแล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็นพื้นที่ทำงานเต็มรูปแบบที่แต่ละช่องมีเซสชันเอเจนต์ของตัวเองพร้อมบริบทของตัวเอง แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีแค่คุณและบอตของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณลงใน guild allowlist">
    การตั้งค่านี้ทำให้เอเจนต์ของคุณตอบสนองในช่องใดก็ได้บนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ DM

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เพิ่ม Discord Server ID `<server_id>` ของฉันลงใน guild allowlist"
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
    โดยค่าเริ่มต้น เอเจนต์ของคุณจะตอบสนองในช่องกิลด์เฉพาะเมื่อถูก @mention เท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณน่าจะต้องการให้ตอบทุกข้อความ

    ในช่องกิลด์ คำตอบสุดท้ายปกติของผู้ช่วยจะยังคงเป็นส่วนตัวโดยค่าเริ่มต้น เอาต์พุต Discord ที่มองเห็นได้ต้องถูกส่งอย่างชัดเจนด้วยเครื่องมือ `message` เพื่อให้เอเจนต์เฝ้าดูได้ตามค่าเริ่มต้นและโพสต์เฉพาะเมื่อเห็นว่าการตอบกลับในช่องมีประโยชน์

    ซึ่งหมายความว่าโมเดลที่เลือกต้องเรียกใช้เครื่องมือได้อย่างน่าเชื่อถือ หาก Discord แสดงว่ากำลังพิมพ์และบันทึกแสดงการใช้โทเค็นแต่ไม่มีข้อความที่โพสต์ ให้ตรวจบันทึกเซสชันสำหรับข้อความผู้ช่วยที่มี `didSendViaMessagingTool: false` นั่นหมายความว่าโมเดลสร้างคำตอบสุดท้ายแบบส่วนตัวแทนการเรียก `message(action=send)` ให้เปลี่ยนไปใช้โมเดลที่เรียกเครื่องมือได้ดีกว่า หรือใช้ config ด้านล่างเพื่อกู้คืนการตอบกลับสุดท้ายอัตโนมัติแบบเดิม

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "อนุญาตให้เอเจนต์ของฉันตอบสนองบนเซิร์ฟเวอร์นี้โดยไม่ต้องถูก @mentioned"
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

        หากต้องการกู้คืนการตอบกลับสุดท้ายอัตโนมัติแบบเดิมสำหรับห้องกลุ่ม/channel ให้ตั้งค่า `messages.groupChat.visibleReplies: "automatic"`

      </Tab>
    </Tabs>

  </Step>

  <Step title="วางแผนสำหรับหน่วยความจำในช่องกิลด์">
    โดยค่าเริ่มต้น หน่วยความจำระยะยาว (MEMORY.md) จะโหลดเฉพาะในเซสชัน DM ช่องกิลด์จะไม่โหลด MEMORY.md อัตโนมัติ

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เมื่อฉันถามคำถามในช่อง Discord ให้ใช้ memory_search หรือ memory_get หากคุณต้องการบริบทระยะยาวจาก MEMORY.md"
      </Tab>
      <Tab title="Manual">
        หากคุณต้องการบริบทร่วมในทุกช่อง ให้ใส่คำสั่งที่คงที่ไว้ใน `AGENTS.md` หรือ `USER.md` (ไฟล์เหล่านี้ถูกฉีดเข้าไปในทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงตามต้องการด้วยเครื่องมือ memory
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างช่องบางส่วนบนเซิร์ฟเวอร์ Discord ของคุณและเริ่มแชต เอเจนต์ของคุณมองเห็นชื่อช่องได้ และแต่ละช่องจะได้รับเซสชันแยกของตัวเอง — ดังนั้นคุณสามารถตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ตามที่เหมาะกับเวิร์กโฟลว์ของคุณ

## โมเดลรันไทม์

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord.
- การกำหนดเส้นทางคำตอบเป็นแบบกำหนดแน่นอน: คำตอบขาเข้าจาก Discord จะตอบกลับไปยัง Discord.
- เมตาดาต้า guild/channel ของ Discord จะถูกเพิ่มเข้าไปในพรอมป์ของโมเดลเป็นบริบทที่ไม่น่าเชื่อถือ
  ไม่ใช่เป็นคำนำหน้าคำตอบที่ผู้ใช้มองเห็น หากโมเดลคัดลอกซองข้อมูลนั้น
  กลับมา OpenClaw จะตัดเมตาดาต้าที่ถูกคัดลอกออกจากคำตอบขาออกและจาก
  บริบท replay ในอนาคต.
- โดยค่าเริ่มต้น (`session.dmScope=main`) แชตโดยตรงจะแชร์เซสชันหลักของเอเจนต์ (`agent:main:main`).
- ช่อง guild เป็นคีย์เซสชันที่แยกกัน (`agent:<agentId>:discord:channel:<channelId>`).
- Group DM จะถูกเพิกเฉยโดยค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`).
- คำสั่ง slash แบบเนทีฟจะทำงานในเซสชันคำสั่งที่แยกกัน (`agent:<agentId>:discord:slash:<userId>`) โดยยังคงพก `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่ถูกกำหนดเส้นทาง.
- การส่งประกาศ cron/heartbeat แบบข้อความเท่านั้นไปยัง Discord ใช้คำตอบสุดท้าย
  ที่ผู้ช่วยมองเห็นเพียงครั้งเดียว ส่วนเพย์โหลดสื่อและคอมโพเนนต์แบบมีโครงสร้างยังคงเป็น
  หลายข้อความเมื่อเอเจนต์ปล่อยเพย์โหลดที่ส่งได้หลายรายการ.

## ช่อง Forum

ช่อง forum และ media ของ Discord รับได้เฉพาะโพสต์ thread เท่านั้น OpenClaw รองรับสองวิธีในการสร้าง:

- ส่งข้อความไปยัง parent ของ forum (`channel:<forumId>`) เพื่อสร้าง thread อัตโนมัติ ชื่อ thread ใช้บรรทัดแรกที่ไม่ว่างของข้อความคุณ.
- ใช้ `openclaw message thread create` เพื่อสร้าง thread โดยตรง อย่าส่ง `--message-id` สำหรับช่อง forum.

ตัวอย่าง: ส่งไปยัง parent ของ forum เพื่อสร้าง thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

ตัวอย่าง: สร้าง forum thread อย่างชัดเจน

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

parent ของ forum ไม่รับคอมโพเนนต์ Discord หากคุณต้องการคอมโพเนนต์ ให้ส่งไปยัง thread เอง (`channel:<threadId>`).

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับคอนเทนเนอร์ Discord components v2 สำหรับข้อความของเอเจนต์ ใช้เครื่องมือ message พร้อมเพย์โหลด `components` ผลลัพธ์การโต้ตอบจะถูกกำหนดเส้นทางกลับไปยังเอเจนต์เป็นข้อความขาเข้าปกติ และปฏิบัติตามการตั้งค่า Discord `replyToMode` ที่มีอยู่.

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถว action อนุญาตให้มีปุ่มได้สูงสุด 5 ปุ่ม หรือเมนู select เดี่ยวหนึ่งเมนู
- ประเภท select: `string`, `user`, `role`, `mentionable`, `channel`

โดยค่าเริ่มต้น คอมโพเนนต์ใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่อให้ปุ่ม, select และฟอร์มใช้งานได้หลายครั้งจนกว่าจะหมดอายุ.

เพื่อจำกัดว่าใครสามารถคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (Discord user IDs, tags หรือ `*`) เมื่อกำหนดค่าแล้ว ผู้ใช้ที่ไม่ตรงกันจะได้รับการปฏิเสธแบบ ephemeral.

คำสั่ง slash `/model` และ `/models` จะเปิดตัวเลือกโมเดลแบบโต้ตอบที่มี dropdown ของ provider, model และ runtime ที่เข้ากันได้ พร้อมขั้นตอน Submit `/models add` เลิกใช้แล้วและตอนนี้ส่งคืนข้อความเลิกใช้แทนการลงทะเบียนโมเดลจากแชต คำตอบของตัวเลือกเป็นแบบ ephemeral และมีเพียงผู้ใช้ที่เรียกใช้เท่านั้นที่ใช้งานได้.

ไฟล์แนบ:

- บล็อก `file` ต้องชี้ไปยังการอ้างอิง attachment (`attachment://<filename>`)
- ระบุไฟล์แนบผ่าน `media`/`path`/`filePath` (ไฟล์เดียว); ใช้ `media-gallery` สำหรับหลายไฟล์
- ใช้ `filename` เพื่อแทนที่ชื่ออัปโหลดเมื่อควรตรงกับการอ้างอิง attachment

ฟอร์ม modal:

- เพิ่ม `components.modal` โดยมีฟิลด์ได้สูงสุด 5 ฟิลด์
- ประเภทฟิลด์: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw เพิ่มปุ่ม trigger ให้อัตโนมัติ

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
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM `channels.discord.allowFrom` คือ allowlist ของ DM ที่เป็นมาตรฐาน.

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.discord.allowFrom` รวม `"*"`)
    - `disabled`

    หากนโยบาย DM ไม่ใช่ open ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือได้รับพรอมป์ให้ pairing ในโหมด `pairing`).

    ลำดับความสำคัญแบบหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น.
    - สำหรับบัญชีเดียว `allowFrom` มีความสำคัญเหนือกว่า `dm.allowFrom` แบบ legacy.
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อ `allowFrom` ของตัวเองและ `dm.allowFrom` แบบ legacy ไม่ได้ตั้งค่าไว้.
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` และ `channels.discord.dm.allowFrom` แบบ legacy ยังอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายไปยัง `dmPolicy` และ `allowFrom` เมื่อสามารถทำได้โดยไม่เปลี่ยนการเข้าถึง.

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การ mention `<@id>`

    ID ตัวเลขล้วนโดยปกติจะ resolve เป็น channel IDs เมื่อมีค่าเริ่มต้นของช่องที่ใช้งานอยู่ แต่ ID ที่อยู่ใน `allowFrom` ของ DM ที่มีผลของบัญชีจะถูกถือเป็นเป้าหมาย user DM เพื่อความเข้ากันได้.

  </Tab>

  <Tab title="กลุ่มการเข้าถึง DM">
    Discord DMs สามารถใช้รายการ `accessGroup:<name>` แบบไดนามิกใน `channels.discord.allowFrom`.

    ชื่อกลุ่มการเข้าถึงใช้ร่วมกันระหว่างช่องข้อความ ใช้ `type: "message.senders"` สำหรับกลุ่ม static ที่สมาชิกแสดงด้วยไวยากรณ์ `allowFrom` ปกติของแต่ละช่อง หรือ `type: "discord.channelAudience"` เมื่อผู้ชม `ViewChannel` ปัจจุบันของช่อง Discord ควรกำหนดสมาชิกแบบไดนามิก พฤติกรรมกลุ่มการเข้าถึงที่ใช้ร่วมกันมีเอกสารไว้ที่นี่: [กลุ่มการเข้าถึง](/th/channels/access-groups).

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

    ช่องข้อความ Discord ไม่มีรายการสมาชิกแยกต่างหาก `type: "discord.channelAudience"` จำลองสมาชิกว่า: ผู้ส่ง DM เป็นสมาชิกของ guild ที่กำหนดค่าไว้ และปัจจุบันมีสิทธิ์ `ViewChannel` ที่มีผลบนช่องที่กำหนดค่าไว้หลังจากนำ role และ channel overwrites ไปใช้แล้ว.

    ตัวอย่าง: อนุญาตให้ทุกคนที่เห็น `#maintainers` สามารถ DM ไปยังบอตได้ ขณะยังปิด DM สำหรับคนอื่นทั้งหมด.

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

    คุณสามารถผสมรายการ dynamic และ static ได้:

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

    การ lookup จะล้มเหลวแบบปิด หาก Discord ส่งคืน `Missing Access`, การ lookup สมาชิกไม่สำเร็จ หรือช่องเป็นของ guild อื่น ผู้ส่ง DM จะถูกถือว่าไม่ได้รับอนุญาต.

    เปิดใช้ **Server Members Intent** ใน Discord Developer Portal สำหรับบอตเมื่อใช้กลุ่มการเข้าถึงแบบ channel-audience DM ไม่มีสถานะสมาชิก guild ดังนั้น OpenClaw จะ resolve สมาชิกผ่าน Discord REST ณ เวลาตรวจสอบสิทธิ์.

  </Tab>

  <Tab title="นโยบาย Guild">
    การจัดการ guild ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    baseline ที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`.

    พฤติกรรม `allowlist`:

    - guild ต้องตรงกับ `channels.discord.guilds` (`id` แนะนำ, slug ยอมรับได้)
    - allowlist ผู้ส่งแบบเลือกได้: `users` (แนะนำ stable IDs) และ `roles` (role IDs เท่านั้น); หากกำหนดค่าอย่างใดอย่างหนึ่ง ผู้ส่งจะได้รับอนุญาตเมื่อจับคู่กับ `users` หรือ `roles`
    - การจับคู่ชื่อ/tag โดยตรงถูกปิดใช้งานโดยค่าเริ่มต้น; เปิดใช้ `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเป็นโหมดความเข้ากันได้แบบ break-glass
    - รองรับชื่อ/tags สำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อใช้รายการชื่อ/tag
    - หาก guild มีการกำหนดค่า `channels` ช่องที่ไม่อยู่ในรายการจะถูกปฏิเสธ
    - หาก guild ไม่มีบล็อก `channels` ทุกช่องใน guild ที่อยู่ใน allowlist นั้นจะได้รับอนุญาต

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

    หากคุณตั้งค่าเฉพาะ `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` runtime fallback คือ `groupPolicy="allowlist"` (พร้อมคำเตือนใน logs) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`.

  </Tab>

  <Tab title="Mentions และ group DMs">
    ข้อความ guild ถูก gate ด้วย mention โดยค่าเริ่มต้น.

    การตรวจจับ mention รวมถึง:

    - การ mention บอตอย่างชัดเจน
    - รูปแบบ mention ที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรม reply-to-bot โดยนัยในกรณีที่รองรับ

    เมื่อเขียนข้อความ Discord ขาออก ให้ใช้ไวยากรณ์ mention มาตรฐาน: `<@USER_ID>` สำหรับผู้ใช้, `<#CHANNEL_ID>` สำหรับช่อง และ `<@&ROLE_ID>` สำหรับ roles อย่าใช้รูปแบบ mention ชื่อเล่น legacy `<@!USER_ID>`.

    `requireMention` ถูกกำหนดค่าต่อ guild/channel (`channels.discord.guilds...`).
    `ignoreOtherMentions` เลือกได้ว่าจะทิ้งข้อความที่ mention ผู้ใช้/role อื่นแต่ไม่ใช่บอต (ยกเว้น @everyone/@here).

    Group DMs:

    - ค่าเริ่มต้น: ถูกเพิกเฉย (`dm.groupEnabled=false`)
    - allowlist แบบเลือกได้ผ่าน `dm.groupChannels` (channel IDs หรือ slugs)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตาม role

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิก guild ของ Discord ไปยังเอเจนต์ต่างกันตาม role ID bindings ตาม role รับเฉพาะ role IDs และจะถูกประเมินหลังจาก bindings แบบ peer หรือ parent-peer และก่อน bindings แบบ guild-only หาก binding ตั้งค่าฟิลด์ match อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ฟิลด์ที่กำหนดค่าทั้งหมดต้องตรงกัน.

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

- `commands.native` มีค่าเริ่มต้นเป็น `"auto"` และเปิดใช้สำหรับ Discord.
- การแทนที่รายช่องทาง: `channels.discord.commands.native`.
- `commands.native=false` จะข้ามการลงทะเบียนและการล้างคำสั่ง slash ของ Discord ระหว่างการเริ่มต้น คำสั่งที่ลงทะเบียนไว้ก่อนหน้านี้อาจยังแสดงใน Discord จนกว่าคุณจะลบออกจากแอป Discord.
- การยืนยันสิทธิ์คำสั่งแบบเนทีฟใช้ allowlist/นโยบาย Discord เดียวกับการจัดการข้อความปกติ.
- คำสั่งอาจยังแสดงใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต แต่การเรียกใช้ยังบังคับใช้การยืนยันสิทธิ์ของ OpenClaw และส่งคืน "not authorized".

ดู [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งและพฤติกรรม.

การตั้งค่าคำสั่ง slash เริ่มต้น:

- `ephemeral: true`

## รายละเอียดฟีเจอร์

<AccordionGroup>
  <Accordion title="แท็กตอบกลับและการตอบกลับแบบเนทีฟ">
    Discord รองรับแท็กตอบกลับในผลลัพธ์ของเอเจนต์:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    ควบคุมโดย `channels.discord.replyToMode`:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`
    - `batched`

    หมายเหตุ: `off` ปิดการทำเธรดตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบระบุชัดเจนยังคงทำงาน.
    `first` จะแนบการอ้างอิงการตอบกลับแบบเนทีฟโดยนัยเข้ากับข้อความ Discord ขาออกแรกของรอบเสมอ.
    `batched` จะแนบการอ้างอิงการตอบกลับแบบเนทีฟโดยนัยของ Discord เฉพาะเมื่อ
    รอบขาเข้าเป็นชุดข้อความหลายข้อความที่ผ่านการหน่วงรวมแล้ว สิ่งนี้มีประโยชน์
    เมื่อคุณต้องการการตอบกลับแบบเนทีฟสำหรับแชตที่มาเป็นชุดและกำกวมเป็นหลัก ไม่ใช่ทุก
    รอบที่มีข้อความเดียว.

    ID ข้อความจะแสดงในบริบท/ประวัติเพื่อให้เอเจนต์สามารถเล็งไปยังข้อความเฉพาะได้.

  </Accordion>

  <Accordion title="ตัวอย่างสตรีมสด">
    OpenClaw สามารถสตรีมร่างคำตอบได้โดยส่งข้อความชั่วคราวและแก้ไขเมื่อมีข้อความเข้ามา `channels.discord.streaming` รับค่า `off` (ค่าเริ่มต้น) | `partial` | `block` | `progress`. `progress` จะคงร่างสถานะที่แก้ไขได้หนึ่งรายการและอัปเดตด้วยความคืบหน้าของเครื่องมือจนกว่าจะส่งผลลัพธ์สุดท้าย; `streamMode` เป็น alias แบบเก่าและจะถูกย้ายให้อัตโนมัติ.

    ค่าเริ่มต้นยังคงเป็น `off` เพราะการแก้ไขตัวอย่างของ Discord จะชนขีดจำกัดอัตราอย่างรวดเร็วเมื่อบอตหรือ Gateway หลายตัวใช้บัญชีเดียวกัน.

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

    - `partial` แก้ไขข้อความตัวอย่างเดียวเมื่อโทเค็นเข้ามา.
    - `block` ส่งชิ้นส่วนขนาดร่างออกมา (ใช้ `draftChunk` เพื่อปรับขนาดและจุดตัด โดยถูกจำกัดไม่เกิน `textChunkLimit`).
    - สื่อ ข้อผิดพลาด และผลลัพธ์สุดท้ายที่ตอบกลับแบบระบุชัดเจนจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่.
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความตัวอย่างซ้ำหรือไม่.
    - `streaming.preview.commandText` / `streaming.progress.commandText` ควบคุมรายละเอียดคำสั่ง/การรันในบรรทัดความคืบหน้าแบบกะทัดรัด: `raw` (ค่าเริ่มต้น) หรือ `status` (เฉพาะป้ายกำกับเครื่องมือ).

    ซ่อนข้อความคำสั่ง/การรันดิบโดยยังคงบรรทัดความคืบหน้าแบบกะทัดรัดไว้:

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

    การสตรีมตัวอย่างรองรับเฉพาะข้อความ; การตอบกลับด้วยสื่อจะย้อนกลับไปใช้การส่งแบบปกติ เมื่อเปิดใช้การสตรีม `block` อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำ.

  </Accordion>

  <Accordion title="ประวัติ บริบท และพฤติกรรมเธรด">
    บริบทประวัติของกิลด์:

    - `channels.discord.historyLimit` ค่าเริ่มต้น `20`
    - ค่าทดแทน: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    การควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมเธรด:

    - เธรด Discord จะถูกกำหนดเส้นทางเป็นเซสชันช่องทางและสืบทอดการกำหนดค่าช่องทางแม่ เว้นแต่มีการแทนที่.
    - เซสชันเธรดสืบทอดการเลือก `/model` ระดับเซสชันของช่องทางแม่เป็นค่าทดแทนเฉพาะโมเดล; การเลือก `/model` ภายในเธรดยังคงมีลำดับความสำคัญสูงกว่า และประวัติ transcript ของแม่จะไม่ถูกคัดลอก เว้นแต่เปิดใช้การสืบทอด transcript.
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) เลือกให้ auto-thread ใหม่เริ่มต้นจาก transcript ของแม่ การแทนที่รายบัญชีอยู่ใต้ `channels.discord.accounts.<id>.thread.inheritParent`.
    - รีแอ็กชันของเครื่องมือข้อความสามารถระบุเป้าหมาย DM แบบ `user:<id>` ได้.
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะถูกคงไว้ระหว่าง fallback การเปิดใช้งานในขั้นตอบกลับ.

    หัวข้อช่องทางจะถูกฉีดเป็นบริบทที่ **ไม่น่าเชื่อถือ** allowlist ควบคุมว่าใครสามารถเรียกเอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมทั้งหมด.

  </Accordion>

  <Accordion title="เซสชันที่ผูกกับเธรดสำหรับ subagent">
    Discord สามารถผูกเธรดกับเป้าหมายเซสชัน เพื่อให้ข้อความติดตามผลในเธรดนั้นยังคงถูกส่งไปยังเซสชันเดียวกัน (รวมถึงเซสชัน subagent).

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/ใหม่กับเป้าหมาย subagent/เซสชัน
    - `/unfocus` ลบการผูกเธรดปัจจุบัน
    - `/agents` แสดง run ที่ทำงานอยู่และสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการยกเลิกโฟกัสอัตโนมัติเมื่อไม่มีความเคลื่อนไหวสำหรับการผูกที่โฟกัสอยู่
    - `/session max-age <duration|off>` ตรวจสอบ/อัปเดตอายุสูงสุดแบบบังคับสำหรับการผูกที่โฟกัสอยู่

    การกำหนดค่า:

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
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดอัตโนมัติสำหรับ `sessions_spawn({ thread: true })` และการ spawn เธรด ACP ค่าเริ่มต้น: `true`.
    - `defaultSpawnContext` ควบคุมบริบท subagent แบบเนทีฟสำหรับการ spawn ที่ผูกกับเธรด ค่าเริ่มต้น: `"fork"`.
    - คีย์ `spawnSubagentSessions`/`spawnAcpSessions` ที่เลิกใช้แล้วจะถูกย้ายโดย `openclaw doctor --fix`.
    - หากการผูกเธรดถูกปิดใช้งานสำหรับบัญชี `/focus` และการดำเนินการผูกเธรดที่เกี่ยวข้องจะใช้ไม่ได้.

    ดู [Sub-agents](/th/tools/subagents), [เอเจนต์ ACP](/th/tools/acp-agents), และ [อ้างอิงการกำหนดค่า](/th/gateway/configuration-reference).

  </Accordion>

  <Accordion title="การผูกช่องทาง ACP แบบคงอยู่">
    สำหรับ workspace ACP ที่เสถียรและ "เปิดตลอดเวลา" ให้กำหนดค่าการผูก ACP แบบ typed ระดับบนสุดที่ชี้ไปยังการสนทนา Discord.

    เส้นทางการกำหนดค่า:

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

    - `/acp spawn codex --bind here` ผูกช่องทางหรือเธรดปัจจุบันไว้ตรงจุดนั้น และคงข้อความในอนาคตไว้บนเซสชัน ACP เดียวกัน ข้อความในเธรดสืบทอดการผูกช่องทางแม่.
    - ในช่องทางหรือเธรดที่ถูกผูกไว้ `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP เดียวกันตรงจุดนั้น การผูกเธรดชั่วคราวสามารถแทนที่การระบุเป้าหมายได้ขณะทำงานอยู่.
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดลูกผ่าน `--thread auto|here`.

    ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมการผูก.

  </Accordion>

  <Accordion title="การแจ้งเตือนรีแอ็กชัน">
    โหมดการแจ้งเตือนรีแอ็กชันรายกิลด์:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    เหตุการณ์รีแอ็กชันจะถูกแปลงเป็นเหตุการณ์ระบบและแนบกับเซสชัน Discord ที่ถูกกำหนดเส้นทาง.

  </Accordion>

  <Accordion title="รีแอ็กชันรับทราบ">
    `ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า.

    ลำดับการแก้ค่า:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback อีโมจิของตัวตนเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้น "👀")

    หมายเหตุ:

    - Discord รับอีโมจิ Unicode หรือชื่ออีโมจิแบบกำหนดเอง.
    - ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับช่องทางหรือบัญชี.

  </Accordion>

  <Accordion title="การเขียนการกำหนดค่า">
    การเขียนการกำหนดค่าที่เริ่มจากช่องทางเปิดใช้อยู่ตามค่าเริ่มต้น.

    สิ่งนี้มีผลต่อ flow `/config set|unset` (เมื่อเปิดใช้ฟีเจอร์คำสั่ง).

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
    กำหนดเส้นทางทราฟฟิก WebSocket ของ Discord gateway และการค้นหา REST ตอนเริ่มต้น (ID แอปพลิเคชัน + การแก้ค่า allowlist) ผ่านพร็อกซี HTTP(S) ด้วย `channels.discord.proxy`.

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
    เปิดใช้การแก้ค่า PluralKit เพื่อแมปข้อความที่ถูกพร็อกซีไปยังตัวตนสมาชิกระบบ:

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

    - allowlist สามารถใช้ `pk:<memberId>`
    - ชื่อที่แสดงของสมาชิกจะถูกจับคู่ตาม name/slug เฉพาะเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การค้นหาใช้ ID ข้อความต้นฉบับและถูกจำกัดด้วยกรอบเวลา
    - หากการค้นหาล้มเหลว ข้อความที่ถูกพร็อกซีจะถือเป็นข้อความบอตและถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="alias การ mention ขาออก">
    ใช้ `mentionAliases` เมื่อเอเจนต์ต้องการ mention ขาออกแบบกำหนดแน่นอนสำหรับผู้ใช้ Discord ที่รู้จัก คีย์คือ handle ที่ไม่มี `@` นำหน้า; ค่าคือ ID ผู้ใช้ Discord. handle ที่ไม่รู้จัก, `@everyone`, `@here`, และ mention ภายใน code span ของ Markdown จะถูกปล่อยไว้ตามเดิม.

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

  <Accordion title="การกำหนดค่า presence">
    การอัปเดต presence จะถูกใช้เมื่อคุณตั้งค่าช่อง status หรือ activity หรือเมื่อคุณเปิดใช้ auto presence.

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

    ตัวอย่าง activity (custom status คือชนิด activity เริ่มต้น):

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

    แผนที่ชนิด activity:

    - 0: กำลังเล่น
    - 1: กำลังสตรีม (ต้องใช้ `activityUrl`)
    - 2: กำลังฟัง
    - 3: กำลังดู
    - 4: กำหนดเอง (ใช้ข้อความ activity เป็นสถานะ status; อีโมจิเป็นทางเลือก)
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

    การแสดงสถานะอัตโนมัติจะจับคู่ความพร้อมใช้งานขณะรันไทม์กับสถานะ Discord: healthy => online, degraded หรือ unknown => idle, exhausted หรือ unavailable => dnd การแทนที่ข้อความแบบเลือกได้:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับ placeholder `{reason}`)

  </Accordion>

  <Accordion title="การอนุมัติใน Discord">
    Discord รองรับการจัดการการอนุมัติด้วยปุ่มใน DM และสามารถโพสต์พรอมต์การอนุมัติในแชนเนลต้นทางได้ตามต้องการ

    พาธการกำหนดค่า:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (เลือกได้; ย้อนกลับไปใช้ `commands.ownerAllowFrom` เมื่อทำได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord จะเปิดใช้งานการอนุมัติ exec แบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และสามารถระบุผู้อนุมัติได้อย่างน้อยหนึ่งราย ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมานผู้อนุมัติ exec จาก `allowFrom` ของแชนเนล, `dm.allowFrom` แบบเดิม, หรือ `defaultTo` ของข้อความส่วนตัว ตั้งค่า `enabled: false` เพื่อปิดใช้งาน Discord ในฐานะไคลเอนต์การอนุมัติแบบเนทีฟอย่างชัดเจน

    สำหรับคำสั่งกลุ่มที่ละเอียดอ่อนและจำกัดเฉพาะเจ้าของ เช่น `/diagnostics` และ `/export-trajectory` OpenClaw จะส่งพรอมต์การอนุมัติและผลลัพธ์สุดท้ายแบบส่วนตัว โดยจะลองใช้ Discord DM ก่อนเมื่อเจ้าของที่เรียกใช้มีเส้นทางเจ้าของของ Discord; หากไม่มี จะย้อนกลับไปใช้เส้นทางเจ้าของที่พร้อมใช้งานรายการแรกจาก `commands.ownerAllowFrom` เช่น Telegram

    เมื่อ `target` เป็น `channel` หรือ `both` พรอมต์การอนุมัติจะมองเห็นได้ในแชนเนล เฉพาะผู้อนุมัติที่ระบุได้เท่านั้นที่ใช้ปุ่มได้; ผู้ใช้อื่นจะได้รับการปฏิเสธแบบ ephemeral พรอมต์การอนุมัติมีข้อความคำสั่งอยู่ด้วย ดังนั้นให้เปิดใช้การส่งไปยังแชนเนลเฉพาะในแชนเนลที่เชื่อถือได้เท่านั้น หากไม่สามารถได้ ID แชนเนลจากคีย์เซสชัน OpenClaw จะย้อนกลับไปส่งผ่าน DM

    Discord ยังเรนเดอร์ปุ่มการอนุมัติร่วมที่ใช้โดยแชนเนลแชตอื่นด้วย อะแดปเตอร์ Discord แบบเนทีฟเพิ่มการกำหนดเส้นทาง DM ของผู้อนุมัติและการกระจายไปยังแชนเนลเป็นหลัก
    เมื่อปุ่มเหล่านั้นมีอยู่ ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก; OpenClaw
    ควรรวมคำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของเครื่องมือบอกว่า
    การอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียวเท่านั้น
    หากรันไทม์การอนุมัติแบบเนทีฟของ Discord ไม่ได้ทำงาน OpenClaw จะคง
    พรอมต์ `/approve <id> <decision>` แบบกำหนดแน่นอนในเครื่องให้มองเห็นได้ หาก
    รันไทม์ทำงานอยู่ แต่ไม่สามารถส่งการ์ดแบบเนทีฟไปยังเป้าหมายใดได้
    OpenClaw จะส่งประกาศสำรองในแชตเดียวกันพร้อมคำสั่ง `/approve`
    ที่ตรงกันจากการอนุมัติที่รอดำเนินการ

    การรับรองความถูกต้องของ Gateway และการแก้ผลการอนุมัติเป็นไปตามสัญญาไคลเอนต์ Gateway ร่วม (`plugin:` ID จะแก้ผ่าน `plugin.approval.resolve`; ID อื่นผ่าน `exec.approval.resolve`) ตามค่าเริ่มต้น การอนุมัติจะหมดอายุหลังจาก 30 นาที

    ดู [การอนุมัติ Exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและเกตการดำเนินการ

การดำเนินการกับข้อความ Discord รวมถึงการส่งข้อความ, การดูแลแชนเนล, การกลั่นกรอง, presence, และการดำเนินการกับเมตาดาต้า

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- รีแอ็กชัน: `react`, `reactions`, `emojiList`
- การกลั่นกรอง: `timeout`, `kick`, `ban`
- presence: `setPresence`

การดำเนินการ `event-create` รับพารามิเตอร์ `image` แบบเลือกได้ (URL หรือพาธไฟล์ในเครื่อง) เพื่อตั้งค่าภาพหน้าปกของอีเวนต์ที่กำหนดเวลาไว้

เกตการดำเนินการอยู่ใต้ `channels.discord.actions.*`

พฤติกรรมเกตเริ่มต้น:

| กลุ่มการดำเนินการ                                                                                                                                                         | ค่าเริ่มต้น |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้งาน |
| roles                                                                                                                                                                    | ปิดใช้งาน |
| moderation                                                                                                                                                               | ปิดใช้งาน |
| presence                                                                                                                                                                 | ปิดใช้งาน |

## UI Components v2

OpenClaw ใช้ Discord components v2 สำหรับการอนุมัติ exec และมาร์กเกอร์ข้ามบริบท การดำเนินการกับข้อความ Discord ยังสามารถรับ `components` สำหรับ UI แบบกำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้างเพย์โหลด component ผ่านเครื่องมือ discord) ขณะที่ `embeds` แบบเดิมยังพร้อมใช้งาน แต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นที่ใช้โดยคอนเทนเนอร์ component ของ Discord (hex)
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

Discord มีพื้นผิวเสียงที่แตกต่างกันสองแบบ: **แชนเนลเสียง** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบตัวอย่างคลื่นเสียง) Gateway รองรับทั้งสองแบบ

### แชนเนลเสียง

รายการตรวจสอบการตั้งค่า:

1. เปิดใช้งาน Message Content Intent ใน Discord Developer Portal
2. เปิดใช้งาน Server Members Intent เมื่อใช้รายการอนุญาตตามบทบาท/ผู้ใช้
3. เชิญบอทด้วยสโคป `bot` และ `applications.commands`
4. ให้สิทธิ์ Connect, Speak, Send Messages, และ Read Message History ในแชนเนลเสียงเป้าหมาย
5. เปิดใช้งานคำสั่งเนทีฟ (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งนี้ใช้เอเจนต์เริ่มต้นของบัญชี และปฏิบัติตามกฎรายการอนุญาตและนโยบายกลุ่มเดียวกับคำสั่ง Discord อื่น

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
- `voice.model` แทนที่ LLM ที่ใช้สำหรับคำตอบในแชนเนลเสียง Discord เท่านั้น ปล่อยให้ไม่ตั้งค่าเพื่อสืบทอดโมเดลเอเจนต์ที่ถูกกำหนดเส้นทางมา
- STT ใช้ `tools.media.audio`; `voice.model` ไม่มีผลต่อการถอดเสียง
- การแทนที่ `systemPrompt` ของ Discord ต่อแชนเนลจะใช้กับรอบ transcript เสียงสำหรับแชนเนลเสียงนั้น
- รอบ transcript เสียงได้สถานะเจ้าของจาก `allowFrom` ของ Discord (หรือ `dm.allowFrom`); ผู้พูดที่ไม่ใช่เจ้าของไม่สามารถเข้าถึงเครื่องมือเฉพาะเจ้าของได้ (เช่น `gateway` และ `cron`)
- เสียง Discord เป็นแบบ opt-in สำหรับการกำหนดค่าแบบข้อความเท่านั้น; ตั้งค่า `channels.discord.voice.enabled=true` (หรือคงบล็อก `channels.discord.voice` ที่มีอยู่) เพื่อเปิดใช้งานคำสั่ง `/vc`, รันไทม์เสียง, และ Gateway intent `GuildVoiceStates`
- `channels.discord.intents.voiceStates` สามารถแทนที่การสมัครรับ intent สถานะเสียงได้อย่างชัดเจน ปล่อยให้ไม่ตั้งค่าเพื่อให้ intent เป็นไปตามการเปิดใช้งานเสียงที่มีผลจริง
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` ส่งต่อไปยังตัวเลือก join ของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- `voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับความพยายาม `/vc join` และการเข้าร่วมอัตโนมัติ ค่าเริ่มต้น: `30000`
- `voice.reconnectGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอให้เซสชันเสียงที่ตัดการเชื่อมต่อเริ่มเชื่อมต่อใหม่ก่อนทำลายเซสชันนั้น ค่าเริ่มต้น: `15000`
- OpenClaw ยังเฝ้าดูความล้มเหลวในการถอดรหัสฝั่งรับ และกู้คืนอัตโนมัติด้วยการออกจาก/เข้าร่วมแชนเนลเสียงใหม่หลังเกิดความล้มเหลวซ้ำในช่วงเวลาสั้น
- หากบันทึกฝั่งรับแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำหลังอัปเดต ให้รวบรวมรายงาน dependency และบันทึก บรรทัด `@discordjs/voice` ที่บันเดิลมามีการแก้ไข padding จาก upstream ใน discord.js PR #11449 ซึ่งปิด discord.js issue #11419 แล้ว

ไปป์ไลน์แชนเนลเสียง:

- การจับเสียง PCM จาก Discord ถูกแปลงเป็นไฟล์ WAV ชั่วคราว
- `tools.media.audio` จัดการ STT เช่น `openai/gpt-4o-mini-transcribe`
- transcript ถูกส่งผ่าน ingress และการกำหนดเส้นทางของ Discord ขณะที่ LLM สำหรับคำตอบทำงานด้วยนโยบายเอาต์พุตเสียงที่ซ่อนเครื่องมือ `tts` ของเอเจนต์และขอข้อความที่ส่งคืน เพราะเสียง Discord เป็นเจ้าของการเล่น TTS ขั้นสุดท้าย
- `voice.model` เมื่อถูกตั้งค่า จะแทนที่เฉพาะ LLM สำหรับคำตอบในรอบแชนเนลเสียงนี้
- `voice.tts` จะถูกผสานทับ `messages.tts`; เสียงที่ได้จะถูกเล่นในแชนเนลที่เข้าร่วมอยู่

ข้อมูลประจำตัวจะถูกแก้ต่อ component: การรับรองความถูกต้องของเส้นทาง LLM สำหรับ `voice.model`, การรับรองความถูกต้องของ STT สำหรับ `tools.media.audio`, และการรับรองความถูกต้องของ TTS สำหรับ `messages.tts`/`voice.tts`

### ข้อความเสียง

ข้อความเสียง Discord แสดงตัวอย่างคลื่นเสียงและต้องใช้เสียง OGG/Opus OpenClaw สร้างคลื่นเสียงให้อัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ Gateway เพื่อตรวจสอบและแปลง

- ระบุ **พาธไฟล์ในเครื่อง** (URL จะถูกปฏิเสธ)
- ละเว้นเนื้อหาข้อความ (Discord ปฏิเสธข้อความ + ข้อความเสียงในเพย์โหลดเดียวกัน)
- รองรับรูปแบบเสียงใดก็ได้; OpenClaw จะแปลงเป็น OGG/Opus ตามจำเป็น

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ใช้ intents ที่ไม่อนุญาต หรือบอทไม่เห็นข้อความ guild">

    - เปิดใช้งาน Message Content Intent
    - เปิดใช้งาน Server Members Intent เมื่อคุณพึ่งพาการแก้ข้อมูลผู้ใช้/สมาชิก
    - รีสตาร์ท gateway หลังเปลี่ยน intents

  </Accordion>

  <Accordion title="ข้อความ guild ถูกบล็อกโดยไม่คาดคิด">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบรายการอนุญาตของ guild ใต้ `channels.discord.guilds`
    - หากมีแผนที่ `channels` ของ guild จะอนุญาตเฉพาะแชนเนลที่ระบุไว้เท่านั้น
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

    - `groupPolicy="allowlist"` โดยไม่มีรายการอนุญาตของ guild/channel ที่ตรงกัน
    - กำหนดค่า `requireMention` ผิดตำแหน่ง (ต้องอยู่ใต้ `channels.discord.guilds` หรือรายการแชนเนล)
    - ผู้ส่งถูกบล็อกโดยรายการอนุญาต `users` ของ guild/channel

  </Accordion>

  <Accordion title="รอบ Discord ที่ทำงานนาน หรือคำตอบซ้ำ">

    บันทึกทั่วไป:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    ปุ่มปรับคิว Gateway ของ Discord:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ค่านี้ควบคุมเฉพาะงาน listener ของ Gateway Discord ไม่ใช่อายุการทำงานของรอบเอเจนต์

    Discord จะไม่ใช้ timeout ที่เป็นของแชนเนลกับรอบเอเจนต์ที่อยู่ในคิว Message listeners จะส่งต่อทันที และการทำงาน Discord ที่อยู่ในคิวจะรักษาลำดับต่อเซสชันไว้จนกว่าวงจรชีวิตของเซสชัน/เครื่องมือ/รันไทม์จะเสร็จสิ้นหรือยกเลิกงาน

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

  <Accordion title="คำเตือนหมดเวลาการค้นหาข้อมูลเมตาของ Gateway">
    OpenClaw ดึงข้อมูลเมตา `/gateway/bot` ของ Discord ก่อนเชื่อมต่อ ความล้มเหลวชั่วคราวจะย้อนกลับไปใช้ URL Gateway เริ่มต้นของ Discord และถูกจำกัดอัตราในบันทึก

    ตัวปรับค่าหมดเวลาของข้อมูลเมตา:

    - บัญชีเดียว: `channels.discord.gatewayInfoTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env fallback เมื่อไม่ได้ตั้งค่าคอนฟิก: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - ค่าเริ่มต้น: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="การรีสตาร์ตเมื่อ Gateway READY หมดเวลา">
    OpenClaw รอเหตุการณ์ `READY` ของ Gateway Discord ระหว่างเริ่มต้นระบบและหลังการเชื่อมต่อใหม่ขณะทำงาน การตั้งค่าหลายบัญชีที่มีการหน่วงเวลาเริ่มต้นแบบเหลื่อมกันอาจต้องใช้ช่วงเวลา READY ตอนเริ่มต้นที่ยาวกว่าค่าเริ่มต้น

    ตัวปรับค่าหมดเวลา READY:

    - เริ่มต้นแบบบัญชีเดียว: `channels.discord.gatewayReadyTimeoutMs`
    - เริ่มต้นแบบหลายบัญชี: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - startup env fallback เมื่อไม่ได้ตั้งค่าคอนฟิก: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นตอนเริ่มต้น: `15000` (15 วินาที), สูงสุด: `120000`
    - ขณะทำงานแบบบัญชีเดียว: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - ขณะทำงานแบบหลายบัญชี: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - runtime env fallback เมื่อไม่ได้ตั้งค่าคอนฟิก: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นขณะทำงาน: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="สิทธิ์ไม่ตรงกันในการตรวจสอบ">
    การตรวจสอบสิทธิ์ของ `channels status --probe` ใช้ได้เฉพาะกับ ID ช่องที่เป็นตัวเลขเท่านั้น

    หากคุณใช้คีย์แบบ slug การจับคู่ขณะทำงานยังสามารถทำงานได้ แต่ probe ไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน

  </Accordion>

  <Accordion title="ปัญหา DM และการจับคู่">

    - ปิดใช้งาน DM: `channels.discord.dm.enabled=false`
    - ปิดใช้งานนโยบาย DM: `channels.discord.dmPolicy="disabled"` (แบบเดิม: `channels.discord.dm.policy`)
    - กำลังรอการอนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูปบอตถึงบอต">
    โดยค่าเริ่มต้น ข้อความที่เขียนโดยบอตจะถูกละเว้น

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎ mention และ allowlist ที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมลูป
    แนะนำให้ใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความบอตที่กล่าวถึงบอตเท่านั้น

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

  <Accordion title="Voice STT หลุดพร้อม DecryptionFailed(...)">

    - อัปเดต OpenClaw ให้เป็นปัจจุบันอยู่เสมอ (`openclaw update`) เพื่อให้มีตรรกะการกู้คืนการรับเสียงของ Discord
    - ยืนยันว่า `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้นจาก upstream) และปรับเฉพาะเมื่อจำเป็น
    - ดูบันทึกสำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากความล้มเหลวยังคงเกิดขึ้นหลังจากเข้าร่วมใหม่โดยอัตโนมัติ ให้รวบรวมบันทึกและเปรียบเทียบกับประวัติการรับ DAVE จาก upstream ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## เอกสารอ้างอิงการตั้งค่า

เอกสารอ้างอิงหลัก: [เอกสารอ้างอิงการตั้งค่า - Discord](/th/gateway/config-channels#discord)

<Accordion title="ฟิลด์ Discord ที่มีสัญญาณสูง">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `token`, `accounts.*`, `allowBots`
- นโยบาย: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- คำสั่ง: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- คิวเหตุการณ์: `eventQueue.listenerTimeout` (งบประมาณ listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- การตอบกลับ/ประวัติ: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- การสตรีม: `streaming` (นามแฝงแบบเดิม: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- สื่อ/การลองใหม่: `mediaMaxMb` (จำกัดการอัปโหลดขาออกของ Discord, ค่าเริ่มต้น `100MB`), `retry`
- การดำเนินการ: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ฟีเจอร์: `threadBindings`, `bindings[]` ระดับบนสุด (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการปฏิบัติการ

- ถือว่าโทเค็นบอตเป็นความลับ (แนะนำให้ใช้ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการกำกับดูแล)
- ให้สิทธิ์ Discord เท่าที่จำเป็นน้อยที่สุด
- หากการ deploy/สถานะของคำสั่งล้าสมัย ให้รีสตาร์ต Gateway และตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Discord กับ Gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรมแชตกลุ่มและ allowlist
  </Card>
  <Card title="การกำหนดเส้นทางช่อง" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเสริมความปลอดภัย
  </Card>
  <Card title="การกำหนดเส้นทางหลายเอเจนต์" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกิลด์และช่องไปยังเอเจนต์
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งเนทีฟ
  </Card>
</CardGroup>
