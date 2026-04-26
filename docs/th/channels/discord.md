---
read_when:
    - กำลังทำงานเกี่ยวกับฟีเจอร์ของช่อง Discord
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าสำหรับบอต Discord
title: Discord
x-i18n:
    generated_at: "2026-04-26T11:22:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68f4e1885aab2438c38ef3735b752968b7e1ed70795d1c3903fad20ff183d3ca
    source_path: channels/discord.md
    workflow: 15
---

พร้อมสำหรับข้อความส่วนตัวและช่องกิลด์ผ่าน Gateway อย่างเป็นทางการของ Discord

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    Discord DM ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องและขั้นตอนการซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

คุณจะต้องสร้างแอปพลิเคชันใหม่พร้อมบอต เพิ่มบอตเข้าเซิร์ฟเวอร์ของคุณ และจับคู่กับ OpenClaw เราแนะนำให้เพิ่มบอตของคุณเข้าไปในเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากคุณยังไม่มี [ให้สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="สร้างแอปพลิเคชันและบอต Discord">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อ เช่น "OpenClaw"

    คลิก **Bot** ที่แถบด้านข้าง ตั้งค่า **Username** เป็นชื่อที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้ privileged intents">
    ยังอยู่ในหน้า **Bot** ให้เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับ allowlist ของบทบาทและการจับคู่ชื่อเป็น ID)
    - **Presence Intent** (ไม่บังคับ; ใช้เมื่อจำเป็นต้องอัปเดตสถานะเท่านั้น)

  </Step>

  <Step title="คัดลอกโทเค็นบอตของคุณ">
    เลื่อนกลับขึ้นไปด้านบนในหน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อจะเป็นเช่นนี้ แต่นี่เป็นการสร้างโทเค็นแรกของคุณ — ไม่มีสิ่งใดถูก "รีเซ็ต"
    </Note>

    คัดลอกโทเค็นและบันทึกไว้ในที่ใดที่หนึ่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในอีกไม่นาน

  </Step>

  <Step title="สร้าง URL คำเชิญและเพิ่มบอตเข้าเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** ที่แถบด้านข้าง คุณจะสร้าง URL คำเชิญพร้อมสิทธิ์ที่ถูกต้องเพื่อเพิ่มบอตเข้าเซิร์ฟเวอร์ของคุณ

    เลื่อนลงไปที่ **OAuth2 URL Generator** แล้วเปิดใช้:

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

    นี่คือชุดสิทธิ์พื้นฐานสำหรับช่องข้อความทั่วไป หากคุณวางแผนจะโพสต์ในเธรดของ Discord รวมถึงเวิร์กโฟลว์ของช่อง forum หรือ media ที่สร้างหรือต่อเนื่องเธรดด้วย ให้เปิดใช้ **Send Messages in Threads** เพิ่มเติม
    คัดลอก URL ที่สร้างขึ้นด้านล่างสุด วางลงในเบราว์เซอร์ของคุณ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอตของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิดใช้ Developer Mode และรวบรวม ID ของคุณ">
    กลับไปที่แอป Discord คุณต้องเปิดใช้ Developer Mode เพื่อให้สามารถคัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนเฟืองข้างอวาตาร์ของคุณ) → **Advanced** → เปิด **Developer Mode**
    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ของคุณไว้คู่กับ Bot Token — คุณจะส่งทั้งสามอย่างให้ OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาต DM จากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงานได้ Discord ต้องอนุญาตให้บอตของคุณส่ง DM ถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณ → **Privacy Settings** → เปิด **Direct Messages**

    การทำเช่นนี้จะทำให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอต) สามารถส่ง DM ถึงคุณได้ เปิดใช้งานค่านี้ไว้หากคุณต้องการใช้ Discord DM กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่องกิลด์ คุณสามารถปิด DM ได้หลังจากจับคู่แล้ว

  </Step>

  <Step title="ตั้งค่าโทเค็นบอตของคุณอย่างปลอดภัย (ห้ามส่งในแชต)">
    โทเค็นบอต Discord ของคุณเป็นความลับ (เหมือนรหัสผ่าน) ให้ตั้งค่าไว้บนเครื่องที่รัน OpenClaw ก่อนส่งข้อความหาเอเจนต์ของคุณ

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    หาก OpenClaw ทำงานอยู่แล้วเป็นบริการเบื้องหลัง ให้เริ่มต้นใหม่ผ่านแอป OpenClaw บน Mac หรือโดยการหยุดและเริ่มกระบวนการ `openclaw gateway run` ใหม่

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="บอกเอเจนต์ของคุณ">
        แชตกับเอเจนต์ OpenClaw ของคุณบนช่องที่มีอยู่แล้วช่องใดก็ได้ (เช่น Telegram) แล้วบอกมัน หาก Discord เป็นช่องแรกของคุณ ให้ใช้แท็บ CLI / config แทน

        > "ฉันได้ตั้งค่าโทเค็นบอต Discord ใน config แล้ว โปรดตั้งค่า Discord ให้เสร็จสมบูรณ์ด้วย User ID `<user_id>` และ Server ID `<server_id>`"
      </Tab>
      <Tab title="CLI / config">
        หากคุณต้องการใช้ config แบบอิงไฟล์ ให้ตั้งค่า:

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

        รองรับค่า `token` แบบข้อความล้วน และยังรองรับค่า SecretRef สำหรับ `channels.discord.token` ผ่านผู้ให้บริการ env/file/exec ดู [การจัดการความลับ](/th/gateway/secrets)

      </Tab>
    </Tabs>

  </Step>

  <Step title="อนุมัติการจับคู่ DM ครั้งแรก">
    รอจนกว่า Gateway จะทำงาน จากนั้นส่ง DM ไปยังบอตของคุณใน Discord บอตจะตอบกลับด้วยรหัสการจับคู่

    <Tabs>
      <Tab title="บอกเอเจนต์ของคุณ">
        ส่งรหัสการจับคู่ให้เอเจนต์ของคุณบนช่องที่มีอยู่เดิม:

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
การแยกโทเค็นรองรับการรับรู้ตามบัญชี ค่าโทเค็นใน config มีความสำคัญเหนือกว่า env fallback `DISCORD_BOT_TOKEN` จะถูกใช้สำหรับบัญชีเริ่มต้นเท่านั้น
สำหรับการเรียกออกขั้นสูง (เครื่องมือข้อความ/การทำงานของช่อง) ระบบจะใช้ `token` แบบระบุชัดต่อการเรียกนั้นสำหรับการเรียกครั้งนั้น ใช้กับการส่งและการดำเนินการแบบอ่าน/ตรวจสอบ เช่น read/search/fetch/thread/pins/permissions นโยบายบัญชี/การลองใหม่ยังคงมาจากบัญชีที่เลือกในสแนปช็อต runtime ที่ใช้งานอยู่
</Note>

## แนะนำ: ตั้งค่าเวิร์กสเปซกิลด์

เมื่อ DM ทำงานแล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็นเวิร์กสเปซเต็มรูปแบบ โดยแต่ละช่องจะมีเซสชันเอเจนต์ของตนเองพร้อมบริบทของตนเอง ซึ่งแนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีเพียงคุณกับบอตของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณไปยัง guild allowlist">
    การทำเช่นนี้จะทำให้เอเจนต์ของคุณสามารถตอบกลับในทุกช่องบนเซิร์ฟเวอร์ของคุณ ไม่ใช่เฉพาะ DM เท่านั้น

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
    ตามค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในช่องกิลด์ก็ต่อเมื่อถูก @mention เท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณน่าจะต้องการให้มันตอบทุกข้อความ

    <Tabs>
      <Tab title="บอกเอเจนต์ของคุณ">
        > "อนุญาตให้เอเจนต์ของฉันตอบกลับบนเซิร์ฟเวอร์นี้ได้โดยไม่ต้องถูก @mention"
      </Tab>
      <Tab title="Config">
        ตั้งค่า `requireMention: false` ใน config ของกิลด์ของคุณ:

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

  <Step title="วางแผนเรื่องหน่วยความจำในช่องกิลด์">
    ตามค่าเริ่มต้น หน่วยความจำระยะยาว (`MEMORY.md`) จะถูกโหลดเฉพาะในเซสชัน DM ช่องกิลด์จะไม่โหลด `MEMORY.md` อัตโนมัติ

    <Tabs>
      <Tab title="บอกเอเจนต์ของคุณ">
        > "เมื่อฉันถามคำถามในช่อง Discord ให้ใช้ memory_search หรือ memory_get หากคุณต้องการบริบทระยะยาวจาก `MEMORY.md`"
      </Tab>
      <Tab title="ด้วยตนเอง">
        หากคุณต้องการบริบทร่วมกันในทุกช่อง ให้ใส่คำสั่งที่คงที่ไว้ใน `AGENTS.md` หรือ `USER.md` (ไฟล์เหล่านี้จะถูกแทรกในทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงเมื่อจำเป็นด้วยเครื่องมือ memory
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างบางช่องบนเซิร์ฟเวอร์ Discord ของคุณและเริ่มแชตได้เลย เอเจนต์ของคุณสามารถเห็นชื่อช่องได้ และแต่ละช่องจะมีเซสชันแยกจากกันของตัวเอง — ดังนั้นคุณจึงสามารถตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ตามที่เหมาะกับเวิร์กโฟลว์ของคุณ

## โมเดล runtime

- Gateway เป็นผู้ดูแลการเชื่อมต่อ Discord
- การกำหนดเส้นทางการตอบกลับเป็นแบบกำหนดแน่นอน: ข้อความตอบกลับขาเข้าจาก Discord จะตอบกลับไปที่ Discord
- ข้อมูลเมตาของกิลด์/ช่อง Discord จะถูกเพิ่มเข้าไปในพรอมป์ของโมเดลในฐานะบริบทที่ไม่น่าเชื่อถือ ไม่ใช่คำนำหน้าคำตอบที่ผู้ใช้มองเห็นได้ หากโมเดลคัดลอกซองข้อมูลนั้นกลับมา OpenClaw จะลบข้อมูลเมตาที่คัดลอกนั้นออกจากข้อความตอบกลับขาออกและจากบริบทการเล่นซ้ำในอนาคต
- ตามค่าเริ่มต้น (`session.dmScope=main`) การแชตโดยตรงจะแชร์เซสชันหลักของเอเจนต์ (`agent:main:main`)
- ช่องกิลด์เป็นคีย์เซสชันแบบแยก (`agent:<agentId>:discord:channel:<channelId>`)
- Group DM จะถูกละเว้นตามค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่ง slash แบบเนทีฟจะทำงานในเซสชันคำสั่งที่แยกต่างหาก (`agent:<agentId>:discord:slash:<userId>`) โดยยังคงส่ง `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่ถูกกำหนดเส้นทาง
- การประกาศส่งข้อความแบบข้อความล้วนของ Cron/Heartbeat ไปยัง Discord จะใช้คำตอบสุดท้ายที่ผู้ช่วยมองเห็นได้เพียงครั้งเดียว เพย์โหลดสื่อและคอมโพเนนต์แบบมีโครงสร้างจะยังคงเป็นหลายข้อความเมื่อเอเจนต์ส่งเพย์โหลดที่ส่งมอบได้หลายรายการ

## ช่อง forum

ช่อง forum และ media ของ Discord รับได้เฉพาะโพสต์แบบเธรด OpenClaw รองรับสองวิธีในการสร้าง:

- ส่งข้อความไปยัง forum parent (`channel:<forumId>`) เพื่อสร้างเธรดอัตโนมัติ ชื่อเธรดจะใช้บรรทัดแรกของข้อความที่ไม่ว่าง
- ใช้ `openclaw message thread create` เพื่อสร้างเธรดโดยตรง อย่าส่ง `--message-id` สำหรับช่อง forum

ตัวอย่าง: ส่งไปยัง forum parent เพื่อสร้างเธรด

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

ตัวอย่าง: สร้าง forum thread โดยระบุชัดเจน

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

forum parent ไม่รองรับคอมโพเนนต์ของ Discord หากคุณต้องการคอมโพเนนต์ ให้ส่งไปยังเธรดโดยตรง (`channel:<threadId>`)

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับคอนเทนเนอร์ Discord components v2 สำหรับข้อความของเอเจนต์ ใช้เครื่องมือข้อความพร้อมเพย์โหลด `components` ผลลัพธ์ของการโต้ตอบจะถูกส่งกลับไปยังเอเจนต์เป็นข้อความขาเข้าปกติ และเป็นไปตามการตั้งค่า Discord `replyToMode` ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถวการกระทำรองรับได้สูงสุด 5 ปุ่ม หรือเมนูเลือกเดี่ยว 1 รายการ
- ประเภทการเลือก: `string`, `user`, `role`, `mentionable`, `channel`

ตามค่าเริ่มต้น คอมโพเนนต์จะใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่ออนุญาตให้ปุ่ม เมนูเลือก และฟอร์ม ถูกใช้งานได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดว่าใครสามารถคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (Discord user IDs, tags หรือ `*`) เมื่อกำหนดค่าไว้ ผู้ใช้ที่ไม่ตรงเงื่อนไขจะได้รับการปฏิเสธแบบชั่วคราวที่มองเห็นได้เฉพาะตนเอง

คำสั่ง slash `/model` และ `/models` จะเปิดตัวเลือกโมเดลแบบโต้ตอบที่มีดรอปดาวน์สำหรับผู้ให้บริการ โมเดล และ runtime ที่เข้ากันได้ พร้อมขั้นตอน Submit คำสั่ง `/models add` เลิกใช้งานแล้ว และตอนนี้จะส่งข้อความแจ้งการเลิกใช้งานแทนการลงทะเบียนโมเดลจากแชต การตอบกลับของตัวเลือกจะเป็นแบบ ephemeral และมีเพียงผู้ใช้ที่เรียกใช้เท่านั้นที่สามารถใช้งานได้

ไฟล์แนบ:

- บล็อก `file` ต้องชี้ไปยังการอ้างอิงไฟล์แนบ (`attachment://<filename>`)
- ระบุไฟล์แนบผ่าน `media`/`path`/`filePath` (ไฟล์เดียว); ใช้ `media-gallery` สำหรับหลายไฟล์
- ใช้ `filename` เพื่อแทนที่ชื่ออัปโหลดเมื่อควรให้ตรงกับการอ้างอิงไฟล์แนบ

ฟอร์ม modal:

- เพิ่ม `components.modal` ได้สูงสุด 5 ฟิลด์
- ประเภทฟิลด์: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw จะเพิ่มปุ่มทริกเกอร์ให้อัตโนมัติ

ตัวอย่าง:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "ข้อความ fallback แบบไม่บังคับ",
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
    - `open` (ต้องให้ `channels.discord.allowFrom` มี `"*"`; เดิม: `channels.discord.dm.allowFrom`)
    - `disabled`

    หากนโยบาย DM ไม่ใช่ open ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือได้รับพรอมป์ให้จับคู่ในโหมด `pairing`)

    ลำดับความสำคัญแบบหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อ `allowFrom` ของตัวเองไม่ได้ตั้งค่า
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การ mention แบบ `<@id>`

    ID ตัวเลขล้วนไม่ชัดเจนและจะถูกปฏิเสธ เว้นแต่จะระบุชนิดเป้าหมายผู้ใช้/ช่องอย่างชัดเจน

  </Tab>

  <Tab title="นโยบายกิลด์">
    การจัดการกิลด์ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    ค่า baseline ที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    พฤติกรรมของ `allowlist`:

    - กิลด์ต้องตรงกับ `channels.discord.guilds` (แนะนำ `id`, รองรับ slug)
    - allowlist ของผู้ส่งแบบไม่บังคับ: `users` (แนะนำ ID แบบคงที่) และ `roles` (เฉพาะ role ID); หากตั้งค่าอย่างใดอย่างหนึ่งไว้ ผู้ส่งจะได้รับอนุญาตเมื่อมีค่าตรงกับ `users` OR `roles`
    - การจับคู่ชื่อ/แท็กโดยตรงถูกปิดไว้ตามค่าเริ่มต้น; เปิด `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเมื่อจำเป็นจริง ๆ ในฐานะโหมดเข้ากันได้ฉุกเฉิน
    - รองรับชื่อ/แท็กสำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อมีการใช้รายการชื่อ/แท็ก
    - หากกิลด์มีการตั้งค่า `channels` ช่องที่ไม่อยู่ในรายการจะถูกปฏิเสธ
    - หากกิลด์ไม่มีบล็อก `channels` ทุกช่องในกิลด์ที่อยู่ใน allowlist จะได้รับอนุญาต

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

    หากคุณตั้งค่าเพียง `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` runtime fallback จะเป็น `groupPolicy="allowlist"` (พร้อมคำเตือนในล็อก) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`

  </Tab>

  <Tab title="การ mention และ Group DM">
    ข้อความในกิลด์จะถูกควบคุมด้วยการ mention ตามค่าเริ่มต้น

    การตรวจจับการ mention รวมถึง:

    - การ mention บอตแบบชัดเจน
    - รูปแบบการ mention ที่กำหนดไว้ (`agents.list[].groupChat.mentionPatterns`, fallback เป็น `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับบอตโดยนัยในกรณีที่รองรับ

    `requireMention` ถูกกำหนดต่อกิลด์/ช่อง (`channels.discord.guilds...`)
    `ignoreOtherMentions` สามารถตั้งค่าเพื่อทิ้งข้อความที่ mention ผู้ใช้/บทบาทอื่นแต่ไม่ได้ mention บอตได้ (ไม่รวม @everyone/@here)

    Group DM:

    - ค่าเริ่มต้น: ถูกละเว้น (`dm.groupEnabled=false`)
    - allowlist แบบไม่บังคับผ่าน `dm.groupChannels` (channel ID หรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตามบทบาท

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิกกิลด์ Discord ไปยังเอเจนต์ต่างกันตาม role ID การ bind ตามบทบาทยอมรับเฉพาะ role ID และจะถูกประเมินหลังการ bind แบบ peer หรือ parent-peer และก่อนการ bind แบบ guild-only หาก binding มีการตั้งค่าฟิลด์ match อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ทุกฟิลด์ที่กำหนดต้องตรงกันทั้งหมด

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

## คำสั่งแบบเนทีฟและการยืนยันสิทธิ์ของคำสั่ง

- `commands.native` มีค่าเริ่มต้นเป็น `"auto"` และเปิดใช้งานสำหรับ Discord
- การแทนที่เฉพาะช่อง: `channels.discord.commands.native`
- `commands.native=false` จะล้างคำสั่งแบบเนทีฟของ Discord ที่ลงทะเบียนไว้ก่อนหน้านี้อย่างชัดเจน
- การยืนยันสิทธิ์ของคำสั่งแบบเนทีฟใช้ allowlist/นโยบาย Discord เดียวกันกับการจัดการข้อความปกติ
- คำสั่งอาจยังมองเห็นได้ใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต; แต่เมื่อเรียกใช้งาน ระบบยังคงบังคับใช้การยืนยันสิทธิ์ของ OpenClaw และส่งกลับว่า "ไม่ได้รับอนุญาต"

ดู [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งและพฤติกรรม

การตั้งค่าคำสั่ง slash เริ่มต้น:

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

    หมายเหตุ: `off` จะปิดการทำเธรดตอบกลับโดยนัย แต่แท็ก `[[reply_to_*]]` แบบระบุชัดยังคงถูกใช้งาน
    `first` จะผูกการอ้างอิงการตอบกลับแบบเนทีฟโดยนัยกับข้อความ Discord ขาออกข้อความแรกของเทิร์นนั้นเสมอ
    `batched` จะผูกการอ้างอิงการตอบกลับแบบเนทีฟโดยนัยของ Discord เฉพาะเมื่อ
    เทิร์นขาเข้าเป็นชุดข้อความหลายข้อความที่ถูก debounce แล้วเท่านั้น ซึ่งมีประโยชน์
    เมื่อคุณต้องการใช้การตอบกลับแบบเนทีฟเป็นหลักสำหรับแชตที่ส่งรัวและกำกวม ไม่ใช่ทุก
    เทิร์นที่มีเพียงข้อความเดียว

    ID ของข้อความจะถูกแสดงในบริบท/ประวัติ เพื่อให้เอเจนต์สามารถกำหนดเป้าหมายข้อความเฉพาะได้

  </Accordion>

  <Accordion title="พรีวิวสตรีมแบบสด">
    OpenClaw สามารถสตรีมข้อความร่างตอบกลับได้โดยการส่งข้อความชั่วคราวและแก้ไขไปเรื่อย ๆ เมื่อมีข้อความเข้ามา `channels.discord.streaming` รับค่า `off` (ค่าเริ่มต้น) | `partial` | `block` | `progress` โดย `progress` จะถูกแมปเป็น `partial` บน Discord; `streamMode` เป็นชื่อเรียกเดิมและจะถูกย้ายให้อัตโนมัติ

    ค่าเริ่มต้นยังคงเป็น `off` เพราะการแก้ไขพรีวิวบน Discord จะชนข้อจำกัดอัตราอย่างรวดเร็ว เมื่อมีหลายบอตหรือหลาย Gateway ใช้บัญชีเดียวกัน

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

    - `partial` จะแก้ไขข้อความพรีวิวเดียวเมื่อมีโทเค็นเข้ามา
    - `block` จะส่งเป็นก้อนขนาดข้อความร่าง (ใช้ `draftChunk` เพื่อปรับขนาดและจุดตัด โดยถูกจำกัดไว้ตาม `textChunkLimit`)
    - ข้อความสื่อ ข้อผิดพลาด และข้อความสุดท้ายแบบตอบกลับชัดเจน จะยกเลิกการแก้ไขพรีวิวที่ค้างอยู่
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความพรีวิวเดิมซ้ำหรือไม่

    พรีวิวสตรีมรองรับเฉพาะข้อความ; การตอบกลับแบบสื่อจะ fallback ไปใช้การส่งตามปกติ เมื่อเปิด `block` streaming อย่างชัดเจน OpenClaw จะข้ามพรีวิวสตรีมเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

  </Accordion>

  <Accordion title="ประวัติ บริบท และพฤติกรรมเธรด">
    บริบทประวัติของกิลด์:

    - `channels.discord.historyLimit` ค่าเริ่มต้น `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` คือปิดใช้งาน

    การควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมเธรด:

    - เธรด Discord จะถูกกำหนดเส้นทางเป็นเซสชันของช่อง และสืบทอด config ของช่องแม่ เว้นแต่จะมีการแทนที่
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) ใช้เพื่อเลือกให้ auto-thread ใหม่เริ่มต้นจากทรานสคริปต์ของช่องแม่ การแทนที่ต่อบัญชีอยู่ภายใต้ `channels.discord.accounts.<id>.thread.inheritParent`
    - รีแอ็กชันของเครื่องมือข้อความสามารถ resolve เป้าหมาย DM แบบ `user:<id>` ได้
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะถูกรักษาไว้ระหว่าง fallback ของการเปิดใช้งานในขั้นตอนตอบกลับ

    หัวข้อของช่องจะถูกแทรกเป็นบริบทที่ **ไม่น่าเชื่อถือ** Allowlists ใช้ควบคุมว่าใครสามารถทริกเกอร์เอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบสมบูรณ์

  </Accordion>

  <Accordion title="เซสชันผูกกับเธรดสำหรับ subagent">
    Discord สามารถผูกเธรดกับเป้าหมายเซสชันได้ เพื่อให้ข้อความติดตามต่อในเธรดนั้นยังคงถูกกำหนดเส้นทางไปยังเซสชันเดิมต่อไป (รวมถึงเซสชัน subagent)

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/ใหม่กับเป้าหมาย subagent/เซสชัน
    - `/unfocus` เอาการผูกเธรดปัจจุบันออก
    - `/agents` แสดงรันที่กำลังใช้งานและสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการยกเลิกโฟกัสอัตโนมัติจากการไม่ใช้งานสำหรับการผูกแบบโฟกัส
    - `/session max-age <duration|off>` ตรวจสอบ/อัปเดตอายุสูงสุดแบบตายตัวสำหรับการผูกแบบโฟกัส

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
        spawnSubagentSessions: false, // เปิดใช้ตามต้องการ
      },
    },
  },
}
```

    หมายเหตุ:

    - `session.threadBindings.*` กำหนดค่าเริ่มต้นส่วนกลาง
    - `channels.discord.threadBindings.*` ใช้แทนที่พฤติกรรมของ Discord
    - `spawnSubagentSessions` ต้องเป็น true เพื่อสร้าง/ผูกเธรดอัตโนมัติสำหรับ `sessions_spawn({ thread: true })`
    - `spawnAcpSessions` ต้องเป็น true เพื่อสร้าง/ผูกเธรดอัตโนมัติสำหรับ ACP (`/acp spawn ... --thread ...` หรือ `sessions_spawn({ runtime: "acp", thread: true })`)
    - หากการผูกเธรดถูกปิดสำหรับบัญชีใด `/focus` และการดำเนินการผูกเธรดที่เกี่ยวข้องจะไม่พร้อมใช้งาน

    ดู [Sub-agents](/th/tools/subagents), [ACP Agents](/th/tools/acp-agents) และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="การผูกช่อง ACP แบบถาวร">
    สำหรับเวิร์กสเปซ ACP แบบเสถียรที่ "พร้อมใช้งานตลอดเวลา" ให้กำหนดค่า ACP bindings แบบมีชนิดที่ระดับบนสุด โดยกำหนดเป้าหมายไปยังบทสนทนา Discord

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

    - `/acp spawn codex --bind here` จะ bind ช่องหรือเธรดปัจจุบันเข้าที่เดิม และทำให้ข้อความในอนาคตยังคงอยู่ในเซสชัน ACP เดิม ข้อความในเธรดจะสืบทอด binding ของช่องแม่
    - ในช่องหรือเธรดที่ถูก bind อยู่ `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP เดิมที่เดิม การ bind เธรดชั่วคราวสามารถแทนที่การ resolve เป้าหมายได้ในขณะที่ยังทำงานอยู่
    - `spawnAcpSessions` จำเป็นเฉพาะเมื่อ OpenClaw ต้องสร้าง/bind child thread ผ่าน `--thread auto|here`

    ดู [ACP Agents](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมของ binding

  </Accordion>

  <Accordion title="การแจ้งเตือนรีแอ็กชัน">
    โหมดการแจ้งเตือนรีแอ็กชันต่อกิลด์:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    เหตุการณ์รีแอ็กชันจะถูกแปลงเป็น system events และแนบไปกับเซสชัน Discord ที่ถูกกำหนดเส้นทาง

  </Accordion>

  <Accordion title="รีแอ็กชันตอบรับ">
    `ackReaction` จะส่งอีโมจิตอบรับขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback เป็นอีโมจิ identity ของเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้นคือ "👀")

    หมายเหตุ:

    - Discord รองรับอีโมจิ unicode หรือชื่อ custom emoji
    - ใช้ `""` เพื่อปิดรีแอ็กชันสำหรับช่องหรือบัญชี

  </Accordion>

  <Accordion title="การเขียน config">
    การเขียน config ที่เริ่มจากช่องถูกเปิดใช้งานตามค่าเริ่มต้น

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
    กำหนดเส้นทางทราฟฟิก WebSocket ของ Discord gateway และการค้นหา REST ตอนเริ่มต้น (application ID + การ resolve allowlist) ผ่านพร็อกซี HTTP(S) ด้วย `channels.discord.proxy`

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    การแทนที่ต่อบัญชี:

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
    เปิดใช้การ resolve ของ PluralKit เพื่อแมปข้อความที่ถูก proxy ไปยัง identity ของ system member:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // ไม่บังคับ; ต้องใช้สำหรับระบบส่วนตัว
      },
    },
  },
}
```

    หมายเหตุ:

    - allowlists สามารถใช้ `pk:<memberId>` ได้
    - ชื่อแสดงผลของสมาชิกจะจับคู่ตามชื่อ/slug ได้ก็ต่อเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การค้นหาใช้ ID ข้อความต้นฉบับและถูกจำกัดตามช่วงเวลา
    - หากการค้นหาล้มเหลว ข้อความที่ถูก proxy จะถือเป็นข้อความจากบอตและจะถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="การกำหนดค่า Presence">
    การอัปเดต Presence จะถูกนำไปใช้เมื่อคุณตั้งค่าฟิลด์สถานะหรือกิจกรรม หรือเมื่อคุณเปิดใช้ auto presence

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

    ตัวอย่างสตรีมมิง:

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
    - 1: Streaming (ต้องใช้ `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (ใช้ข้อความกิจกรรมเป็นสถานะ state; ไม่บังคับต้องมีอีโมจิ)
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
        exhaustedText: "โทเค็นหมด",
      },
    },
  },
}
```

    Auto presence จะแมปความพร้อมใช้งานของ runtime ไปยังสถานะ Discord ดังนี้: healthy => online, degraded หรือ unknown => idle, exhausted หรือ unavailable => dnd ข้อความแทนที่แบบไม่บังคับ:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับ placeholder `{reason}`)

  </Accordion>

  <Accordion title="การอนุมัติใน Discord">
    Discord รองรับการจัดการการอนุมัติด้วยปุ่มใน DM และสามารถโพสต์พรอมป์การอนุมัติในช่องต้นทางได้ตามต้องการ

    พาธ config:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; fallback ไปที่ `commands.ownerAllowFrom` เมื่อทำได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord จะเปิดใช้ native exec approvals อัตโนมัติเมื่อ `enabled` ไม่ได้ตั้งค่าไว้หรือเป็น `"auto"` และสามารถ resolve approver ได้อย่างน้อยหนึ่งราย ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมาน approver ของ exec จาก `allowFrom` ของช่อง, `dm.allowFrom` แบบเดิม หรือ `defaultTo` ของข้อความโดยตรง ตั้งค่า `enabled: false` เพื่อปิด Discord ในฐานะ native approval client อย่างชัดเจน

    เมื่อ `target` เป็น `channel` หรือ `both` พรอมป์การอนุมัติจะมองเห็นได้ในช่อง มีเพียง approver ที่ resolve ได้เท่านั้นที่ใช้ปุ่มได้ ผู้ใช้อื่นจะได้รับการปฏิเสธแบบ ephemeral พรอมป์การอนุมัติจะมีข้อความคำสั่งรวมอยู่ด้วย ดังนั้นควรเปิดใช้การส่งไปยังช่องเฉพาะในช่องที่เชื่อถือได้เท่านั้น หากไม่สามารถหา ID ช่องจาก session key ได้ OpenClaw จะ fallback ไปส่งทาง DM

    Discord ยังเรนเดอร์ปุ่มอนุมัติร่วมที่ใช้โดยช่องแชตอื่นด้วย อะแดปเตอร์ Discord แบบเนทีฟเพิ่มหลัก ๆ ในส่วนการกำหนดเส้นทาง DM ของ approver และการกระจายไปยังช่อง
    เมื่อมีปุ่มเหล่านั้นอยู่ ปุ่มเหล่านั้นคือ UX หลักสำหรับการอนุมัติ; OpenClaw
    ควรรวมคำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่า
    chat approvals ไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นทางเลือกเดียว

    Gateway auth และ approval resolution เป็นไปตามสัญญา Gateway client ร่วม (`plugin:` IDs จะ resolve ผ่าน `plugin.approval.resolve`; ID อื่นผ่าน `exec.approval.resolve`) การอนุมัติจะหมดอายุภายใน 30 นาทีตามค่าเริ่มต้น

    ดู [การอนุมัติ Exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและข้อจำกัดของ action

Discord message actions ประกอบด้วยการส่งข้อความ การดูแลช่อง การกลั่นกรอง การ presence และ action เกี่ยวกับ metadata

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- รีแอ็กชัน: `react`, `reactions`, `emojiList`
- การกลั่นกรอง: `timeout`, `kick`, `ban`
- Presence: `setPresence`

action `event-create` รองรับพารามิเตอร์ `image` แบบไม่บังคับ (URL หรือพาธไฟล์ในเครื่อง) เพื่อตั้งค่าภาพหน้าปกของ scheduled event

ข้อจำกัดของ action อยู่ภายใต้ `channels.discord.actions.*`

พฤติกรรมข้อจำกัดค่าเริ่มต้น:

| กลุ่ม action                                                                                                                                                             | ค่าเริ่มต้น |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้งาน |
| roles                                                                                                                                                                    | ปิดใช้งาน |
| moderation                                                                                                                                                               | ปิดใช้งาน |
| presence                                                                                                                                                                 | ปิดใช้งาน |

## UI ของ Components v2

OpenClaw ใช้ Discord components v2 สำหรับ exec approvals และเครื่องหมายข้ามบริบท Discord message actions ยังสามารถรับ `components` สำหรับ UI แบบกำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้าง component payload ผ่านเครื่องมือ discord) ขณะที่ `embeds` แบบเดิมยังคงใช้งานได้ แต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` กำหนดสี accent ที่ใช้โดยคอนเทนเนอร์คอมโพเนนต์ของ Discord (hex)
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

Discord มีพื้นผิวเสียงสองแบบที่แยกจากกัน: **voice channels** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **voice message attachments** (รูปแบบพรีวิว waveform) Gateway รองรับทั้งสองแบบ

### ช่องเสียง

เช็กลิสต์การตั้งค่า:

1. เปิดใช้ Message Content Intent ใน Discord Developer Portal
2. เปิดใช้ Server Members Intent เมื่อใช้ allowlist ของ role/user
3. เชิญบอตด้วย scope `bot` และ `applications.commands`
4. ให้สิทธิ์ Connect, Speak, Send Messages และ Read Message History ในช่องเสียงเป้าหมาย
5. เปิดใช้ native commands (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งนี้ใช้เอเจนต์เริ่มต้นของบัญชีและเป็นไปตามกฎ allowlist และ group policy เดียวกันกับคำสั่ง Discord อื่น ๆ

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

- `voice.tts` ใช้แทน `messages.tts` สำหรับการเล่นเสียงเท่านั้น
- `voice.model` ใช้แทน LLM ที่ใช้สำหรับการตอบกลับในช่องเสียง Discord เท่านั้น หากไม่ตั้งค่า จะสืบทอดโมเดลของเอเจนต์ที่ถูกกำหนดเส้นทาง
- STT ใช้ `tools.media.audio`; `voice.model` ไม่มีผลต่อการถอดเสียง
- เทิร์นของทรานสคริปต์เสียงจะกำหนดสถานะ owner จาก Discord `allowFrom` (หรือ `dm.allowFrom`); ผู้พูดที่ไม่ใช่ owner ไม่สามารถเข้าถึงเครื่องมือสำหรับ owner เท่านั้นได้ (เช่น `gateway` และ `cron`)
- เสียงเปิดใช้งานตามค่าเริ่มต้น; ตั้งค่า `channels.discord.voice.enabled=false` เพื่อปิดใช้งาน
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` จะถูกส่งต่อไปยังตัวเลือก join ของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- OpenClaw ยังเฝ้าดูความล้มเหลวในการถอดรหัสฝั่งรับ และกู้คืนอัตโนมัติโดยออกจาก/เข้าร่วมช่องเสียงใหม่หลังเกิดความล้มเหลวซ้ำหลายครั้งในช่วงเวลาสั้น ๆ
- หากล็อกรับยังแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำ ๆ หลังอัปเดต ให้รวบรวมรายงาน dependency และล็อก บรรทัด `@discordjs/voice` ที่รวมมาแล้วมี upstream padding fix จาก discord.js PR #11449 ซึ่งปิดปัญหา discord.js issue #11419 แล้ว

ไปป์ไลน์ของช่องเสียง:

- การจับ PCM จาก Discord จะถูกแปลงเป็นไฟล์ WAV ชั่วคราว
- `tools.media.audio` จัดการ STT เช่น `openai/gpt-4o-mini-transcribe`
- ทรานสคริปต์จะถูกส่งผ่าน ingress และการกำหนดเส้นทางของ Discord ตามปกติ
- `voice.model` เมื่อถูกตั้งค่า จะใช้แทนเฉพาะ LLM สำหรับการตอบกลับของเทิร์นช่องเสียงนี้เท่านั้น
- `voice.tts` จะถูกรวมทับบน `messages.tts`; จากนั้นเสียงที่ได้จะถูกเล่นในช่องที่เข้าร่วมอยู่

ข้อมูลรับรองจะถูก resolve แยกตามคอมโพเนนต์: การยืนยันตัวตนของเส้นทาง LLM สำหรับ `voice.model`, การยืนยันตัวตน STT สำหรับ `tools.media.audio`, และการยืนยันตัวตน TTS สำหรับ `messages.tts`/`voice.tts`

### ข้อความเสียง

ข้อความเสียงของ Discord จะแสดงพรีวิว waveform และต้องใช้ออดิโอ OGG/Opus OpenClaw จะสร้าง waveform ให้อัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ Gateway เพื่อใช้ตรวจสอบและแปลงไฟล์

- ระบุเป็น **พาธไฟล์ในเครื่อง**
- ละเว้นเนื้อหาข้อความ (Discord จะปฏิเสธ payload ที่มีทั้งข้อความและข้อความเสียงพร้อมกัน)
- รองรับไฟล์เสียงทุกฟอร์แมต; OpenClaw จะแปลงเป็น OGG/Opus ตามความจำเป็น

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ใช้ intents ที่ไม่ได้รับอนุญาตหรือบอตไม่เห็นข้อความในกิลด์">

    - เปิดใช้ Message Content Intent
    - เปิดใช้ Server Members Intent เมื่อคุณต้องพึ่งพา user/member resolution
    - รีสตาร์ต Gateway หลังจากเปลี่ยน intents

  </Accordion>

  <Accordion title="ข้อความในกิลด์ถูกบล็อกโดยไม่คาดคิด">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบ guild allowlist ภายใต้ `channels.discord.guilds`
    - หากมี `channels` map ในกิลด์ จะอนุญาตเฉพาะช่องที่อยู่ในรายการเท่านั้น
    - ตรวจสอบพฤติกรรม `requireMention` และรูปแบบการ mention

    คำสั่งที่มีประโยชน์:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="ตั้ง require mention เป็น false แล้วแต่ยังถูกบล็อก">
    สาเหตุที่พบบ่อย:

    - `groupPolicy="allowlist"` โดยไม่มี guild/channel allowlist ที่ตรงกัน
    - กำหนดค่า `requireMention` ผิดตำแหน่ง (ต้องอยู่ใต้ `channels.discord.guilds` หรือรายการช่อง)
    - ผู้ส่งถูกบล็อกโดย allowlist `users` ของกิลด์/ช่อง

  </Accordion>

  <Accordion title="ตัวจัดการที่ทำงานนานหมดเวลาหรือมีการตอบกลับซ้ำ">

    ตัวอย่างล็อกทั่วไป:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    ปุ่มปรับงบเวลาของ listener:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    ปุ่มปรับเวลาหมดอายุของ worker run:

    - บัญชีเดียว: `channels.discord.inboundWorker.runTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - ค่าเริ่มต้น: `1800000` (30 นาที); ตั้งเป็น `0` เพื่อปิดใช้งาน

    ค่า baseline ที่แนะนำ:

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

    ใช้ `eventQueue.listenerTimeout` สำหรับการตั้งค่า listener ที่ช้า และใช้ `inboundWorker.runTimeoutMs`
    เฉพาะเมื่อคุณต้องการกลไกความปลอดภัยแยกต่างหากสำหรับเทิร์นของเอเจนต์ที่อยู่ในคิว

  </Accordion>

  <Accordion title="การตรวจสอบสิทธิ์ไม่ตรงกัน">
    การตรวจสอบสิทธิ์ของ `channels status --probe` ใช้งานได้เฉพาะกับ channel ID แบบตัวเลขเท่านั้น

    หากคุณใช้คีย์แบบ slug การจับคู่ขณะ runtime ยังอาจใช้งานได้ แต่ probe จะไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน

  </Accordion>

  <Accordion title="ปัญหา DM และการจับคู่">

    - ปิด DM: `channels.discord.dm.enabled=false`
    - ปิดนโยบาย DM: `channels.discord.dmPolicy="disabled"` (เดิม: `channels.discord.dm.policy`)
    - กำลังรอการอนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูประหว่างบอต">
    ตามค่าเริ่มต้น ข้อความที่เขียนโดยบอตจะถูกละเว้น

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎ mention และ allowlist ที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมลูป
    แนะนำให้ใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความจากบอตที่ mention บอตเท่านั้น

  </Accordion>

  <Accordion title="Voice STT หลุดพร้อม DecryptionFailed(...)">

    - ใช้ OpenClaw เวอร์ชันล่าสุด (`openclaw update`) เพื่อให้มีตรรกะกู้คืนการรับเสียงของ Discord
    - ยืนยันว่า `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มต้นจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้นของ upstream) และปรับเฉพาะเมื่อจำเป็น
    - ดูล็อกสำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากยังล้มเหลวหลังจากเข้าร่วมใหม่อัตโนมัติ ให้รวบรวมล็อกและเปรียบเทียบกับประวัติการรับ DAVE ฝั่ง upstream ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Discord](/th/gateway/config-channels#discord)

<Accordion title="ฟิลด์ Discord ที่มีสัญญาณชัดเจน">

- การเริ่มต้นระบบ/การยืนยันตัวตน: `enabled`, `token`, `accounts.*`, `allowBots`
- นโยบาย: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- คำสั่ง: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- คิวเหตุการณ์: `eventQueue.listenerTimeout` (งบเวลาของ listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- การตอบกลับ/ประวัติ: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่ง: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- การสตรีม: `streaming` (ชื่อเรียกเดิม: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- สื่อ/การลองใหม่: `mediaMaxMb` (จำกัดการอัปโหลดขาออกไปยัง Discord, ค่าเริ่มต้น `100MB`), `retry`
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ฟีเจอร์: `threadBindings`, `bindings[]` ระดับบนสุด (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการปฏิบัติการ

- ปฏิบัติต่อโทเค็นบอตเสมือนเป็นความลับ (แนะนำ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการดูแล)
- มอบสิทธิ์ Discord เท่าที่จำเป็นเท่านั้น
- หากสถานะการ deploy/state ของคำสั่งล้าสมัย ให้รีสตาร์ต Gateway และตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Discord กับ Gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรมของแชตกลุ่มและ allowlist
  </Card>
  <Card title="การกำหนดเส้นทางช่อง" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการทำให้แข็งแรง
  </Card>
  <Card title="การกำหนดเส้นทางหลายเอเจนต์" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกิลด์และช่องไปยังเอเจนต์
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟ
  </Card>
</CardGroup>
