---
read_when:
    - การทำงานกับฟีเจอร์ของช่องทาง Discord
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของบอต Discord
title: Discord
x-i18n:
    generated_at: "2026-05-06T17:52:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11cc911dbc569db7a31ce4a16de167bc8ea771d1dd7842cb151f666f3cb9285b
    source_path: channels/discord.md
    workflow: 16
---

พร้อมใช้งานสำหรับ DM และช่องกิลด์ผ่าน Discord Gateway อย่างเป็นทางการ

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    Discord DM มีค่าเริ่มต้นเป็นโหมดการจับคู่
  </Card>
  <Card title="คำสั่งสแลช" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องและขั้นตอนการซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

คุณต้องสร้างแอปพลิเคชันใหม่พร้อมบอต เพิ่มบอตลงในเซิร์ฟเวอร์ของคุณ และจับคู่กับ OpenClaw เราแนะนำให้เพิ่มบอตของคุณลงในเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากคุณยังไม่มี [ให้สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="สร้างแอปพลิเคชันและบอต Discord">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อเป็นอย่างเช่น "OpenClaw"

    คลิก **Bot** บนแถบด้านข้าง ตั้งค่า **Username** เป็นชื่อที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้งานอินเทนต์ที่มีสิทธิ์พิเศษ">
    ยังอยู่ในหน้า **Bot** ให้เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้งาน:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับ allowlist ของบทบาทและการจับคู่ชื่อกับ ID)
    - **Presence Intent** (ไม่บังคับ; จำเป็นเฉพาะสำหรับการอัปเดตสถานะ presence)

  </Step>

  <Step title="คัดลอกโทเค็นบอตของคุณ">
    เลื่อนกลับขึ้นไปในหน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อจะเป็นเช่นนั้น แต่การดำเนินการนี้จะสร้างโทเค็นแรกของคุณ — ไม่มีอะไรถูก "รีเซ็ต"
    </Note>

    คัดลอกโทเค็นและบันทึกไว้ที่ใดที่หนึ่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในอีกสักครู่

  </Step>

  <Step title="สร้าง URL เชิญและเพิ่มบอตลงในเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** บนแถบด้านข้าง คุณจะสร้าง URL เชิญพร้อมสิทธิ์ที่ถูกต้องเพื่อเพิ่มบอตลงในเซิร์ฟเวอร์ของคุณ

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

    นี่คือชุดพื้นฐานสำหรับช่องข้อความปกติ หากคุณวางแผนจะโพสต์ในเธรด Discord รวมถึงเวิร์กโฟลว์ของช่องฟอรัมหรือสื่อที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้งาน **Send Messages in Threads** ด้วย
    คัดลอก URL ที่สร้างขึ้นด้านล่าง วางลงในเบราว์เซอร์ของคุณ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอตของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิดใช้งาน Developer Mode และรวบรวม ID ของคุณ">
    กลับไปที่แอป Discord คุณต้องเปิดใช้งาน Developer Mode เพื่อให้คัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนเฟืองถัดจากอวาตาร์ของคุณ) → **Advanced** → เปิด **Developer Mode**
    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ของคุณไว้ข้าง Bot Token — คุณจะส่งทั้งสามอย่างให้ OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาต DM จากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงานได้ Discord ต้องอนุญาตให้บอตของคุณส่ง DM ถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณ → **Privacy Settings** → เปิด **Direct Messages**

    การตั้งค่านี้ทำให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอต) ส่ง DM ถึงคุณได้ เปิดใช้งานไว้หากคุณต้องการใช้ Discord DM กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่องกิลด์ คุณสามารถปิด DM ได้หลังจากจับคู่แล้ว

  </Step>

  <Step title="ตั้งค่าโทเค็นบอตของคุณอย่างปลอดภัย (อย่าส่งในแชต)">
    โทเค็นบอต Discord ของคุณเป็นความลับ (เหมือนรหัสผ่าน) ตั้งค่าบนเครื่องที่รัน OpenClaw ก่อนส่งข้อความหาเอเจนต์ของคุณ

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
    สำหรับการติดตั้งบริการแบบจัดการ ให้รัน `openclaw gateway install` จากเชลล์ที่มี `DISCORD_BOT_TOKEN` อยู่ หรือเก็บตัวแปรไว้ใน `~/.openclaw/.env` เพื่อให้บริการ resolve env SecretRef ได้หลังรีสตาร์ท
    หากโฮสต์ของคุณถูกบล็อกหรือถูกจำกัดอัตราโดยการค้นหาแอปพลิเคชันตอนเริ่มต้นของ Discord ให้ตั้งค่า ID แอปพลิเคชัน/ไคลเอนต์ Discord จาก Developer Portal เพื่อให้การเริ่มต้นข้าม REST call นั้นได้ ใช้ `channels.discord.applicationId` สำหรับบัญชีเริ่มต้น หรือ `channels.discord.accounts.<accountId>.applicationId` เมื่อคุณรันบอต Discord หลายตัว

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        แชตกับเอเจนต์ OpenClaw ของคุณบนช่องที่มีอยู่ใดก็ได้ (เช่น Telegram) แล้วบอกเอเจนต์ หาก Discord เป็นช่องแรกของคุณ ให้ใช้แท็บ CLI / config แทน

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

        Env fallback สำหรับบัญชีเริ่มต้น:

```bash
DISCORD_BOT_TOKEN=...
```

        สำหรับการตั้งค่าแบบสคริปต์หรือระยะไกล ให้เขียนบล็อก JSON5 เดียวกันด้วย `openclaw config patch --file ./discord.patch.json5 --dry-run` แล้วรันอีกครั้งโดยไม่มี `--dry-run` รองรับค่า `token` แบบข้อความธรรมดา และยังรองรับค่า SecretRef สำหรับ `channels.discord.token` ผ่าน provider แบบ env/file/exec ด้วย ดู [การจัดการความลับ](/th/gateway/secrets)

        สำหรับบอต Discord หลายตัว ให้เก็บโทเค็นบอตและ ID แอปพลิเคชันแต่ละรายการไว้ใต้บัญชีของตัวเอง `channels.discord.applicationId` ระดับบนจะถูกสืบทอดโดยบัญชีต่าง ๆ ดังนั้นให้ตั้งค่าตรงนั้นเฉพาะเมื่อทุกบัญชีควรใช้ ID แอปพลิเคชันเดียวกัน

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
    รอจนกว่า Gateway จะรันอยู่ จากนั้นส่ง DM ถึงบอตของคุณใน Discord บอตจะตอบกลับด้วยโค้ดการจับคู่

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        ส่งโค้ดการจับคู่ให้เอเจนต์ของคุณบนช่องที่มีอยู่:

        > "อนุมัติโค้ดการจับคู่ Discord นี้: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    โค้ดการจับคู่หมดอายุหลังจาก 1 ชั่วโมง

    ตอนนี้คุณควรสามารถแชตกับเอเจนต์ของคุณใน Discord ผ่าน DM ได้แล้ว

  </Step>
</Steps>

<Note>
การ resolve โทเค็นรับรู้ตามบัญชี ค่าโทเค็นใน config มีสิทธิ์เหนือกว่า env fallback `DISCORD_BOT_TOKEN` ใช้สำหรับบัญชีเริ่มต้นเท่านั้น
หากบัญชี Discord ที่เปิดใช้งานสองบัญชี resolve เป็นโทเค็นบอตเดียวกัน OpenClaw จะเริ่มตัวตรวจสอบ Gateway เพียงตัวเดียวสำหรับโทเค็นนั้น โทเค็นที่มาจาก config มีสิทธิ์เหนือกว่า env fallback เริ่มต้น มิฉะนั้นบัญชีที่เปิดใช้งานบัญชีแรกจะชนะ และบัญชีซ้ำจะถูกรายงานว่าปิดใช้งาน
สำหรับการเรียกขาออกขั้นสูง (เครื่องมือ message/การทำงานของช่อง) จะใช้ `token` แบบระบุต่อการเรียกสำหรับการเรียกนั้น การดำเนินการนี้ใช้กับการส่งและการอ่าน/การตรวจสอบแบบ probe (เช่น read/search/fetch/thread/pins/permissions) การตั้งค่า policy/retry ของบัญชียังคงมาจากบัญชีที่เลือกในสแนปช็อต runtime ที่ใช้งานอยู่
</Note>

## แนะนำ: ตั้งค่าเวิร์กสเปซกิลด์

เมื่อ DM ใช้งานได้แล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็นเวิร์กสเปซเต็มรูปแบบที่แต่ละช่องจะมีเซสชันเอเจนต์ของตัวเองพร้อมบริบทของตัวเอง การตั้งค่านี้แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีเพียงคุณและบอตของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณใน allowlist ของกิลด์">
    การตั้งค่านี้ทำให้เอเจนต์ของคุณตอบกลับได้ในทุกช่องบนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ DM

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เพิ่ม Discord Server ID `<server_id>` ของฉันลงใน allowlist ของกิลด์"
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

  <Step title="อนุญาตให้ตอบกลับโดยไม่มี @mention">
    โดยค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในช่องกิลด์เฉพาะเมื่อถูก @mention เท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณอาจต้องการให้ตอบกลับทุกข้อความ

    ในช่องกิลด์ คำตอบสุดท้ายปกติของผู้ช่วยจะยังคงเป็นส่วนตัวโดยค่าเริ่มต้น เอาต์พุต Discord ที่มองเห็นได้ต้องถูกส่งอย่างชัดเจนด้วยเครื่องมือ `message` เพื่อให้เอเจนต์สามารถสังเกตการณ์โดยค่าเริ่มต้นและโพสต์เฉพาะเมื่อพิจารณาว่าการตอบกลับในช่องมีประโยชน์

    หมายความว่าโมเดลที่เลือกต้องเรียกใช้เครื่องมือได้อย่างเชื่อถือได้ หาก Discord แสดงการพิมพ์และบันทึกแสดงการใช้โทเค็นแต่ไม่มีข้อความที่โพสต์ ให้ตรวจสอบบันทึกเซสชันเพื่อดูข้อความผู้ช่วยที่มี `didSendViaMessagingTool: false` นั่นหมายความว่าโมเดลสร้างคำตอบสุดท้ายแบบส่วนตัวแทนที่จะเรียก `message(action=send)` ให้สลับไปใช้โมเดลที่เรียกใช้เครื่องมือได้แข็งแกร่งกว่า หรือใช้ config ด้านล่างเพื่อคืนค่าการตอบกลับสุดท้ายอัตโนมัติแบบเดิม

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

        หากต้องการคืนค่าการตอบกลับสุดท้ายอัตโนมัติแบบเดิมสำหรับห้องกลุ่ม/ช่อง ให้ตั้งค่า `messages.groupChat.visibleReplies: "automatic"`

      </Tab>
    </Tabs>

  </Step>

  <Step title="วางแผนสำหรับ memory ในช่องกิลด์">
    โดยค่าเริ่มต้น หน่วยความจำระยะยาว (MEMORY.md) จะโหลดเฉพาะในเซสชัน DM ช่องกิลด์จะไม่โหลด MEMORY.md โดยอัตโนมัติ

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เมื่อฉันถามคำถามในช่อง Discord ให้ใช้ memory_search หรือ memory_get หากคุณต้องการบริบทระยะยาวจาก MEMORY.md"
      </Tab>
      <Tab title="ด้วยตนเอง">
        หากคุณต้องการบริบทร่วมในทุกช่อง ให้ใส่คำสั่งที่เสถียรไว้ใน `AGENTS.md` หรือ `USER.md` (ไฟล์เหล่านี้จะถูก inject สำหรับทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงเมื่อจำเป็นด้วยเครื่องมือ memory
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างช่องบางช่องบนเซิร์ฟเวอร์ Discord ของคุณและเริ่มแชต เอเจนต์ของคุณจะเห็นชื่อช่อง และแต่ละช่องจะได้รับเซสชันแยกของตัวเอง — ดังนั้นคุณจึงตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ตามที่เหมาะกับเวิร์กโฟลว์ของคุณได้

## โมเดล runtime

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord
- การกำหนดเส้นทางการตอบกลับเป็นแบบกำหนดแน่นอน: การตอบกลับขาเข้าใน Discord จะกลับไปยัง Discord
- เมทาดาทาของกิลด์/ช่อง Discord จะถูกเพิ่มลงในพรอมต์โมเดลเป็นบริบทที่ไม่น่าเชื่อถือ
  ไม่ใช่เป็นคำนำหน้าการตอบกลับที่ผู้ใช้มองเห็น หากโมเดลคัดลอกข้อมูลครอบนั้น
  กลับมา OpenClaw จะตัดเมทาดาทาที่ถูกคัดลอกออกจากการตอบกลับขาออกและจาก
  บริบทการเล่นซ้ำในอนาคต
- โดยค่าเริ่มต้น (`session.dmScope=main`) แชตโดยตรงจะแชร์เซสชันหลักของเอเจนต์ (`agent:main:main`)
- ช่องกิลด์เป็นคีย์เซสชันที่แยกกัน (`agent:<agentId>:discord:channel:<channelId>`)
- DM แบบกลุ่มจะถูกละเว้นโดยค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่งสแลชแบบเนทีฟทำงานในเซสชันคำสั่งที่แยกกัน (`agent:<agentId>:discord:slash:<userId>`) โดยยังคงพก `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่ถูกกำหนดเส้นทาง
- การส่งประกาศ Cron/Heartbeat แบบข้อความเท่านั้นไปยัง Discord ใช้คำตอบสุดท้าย
  ที่ผู้ช่วยมองเห็นหนึ่งครั้ง เพย์โหลดสื่อและคอมโพเนนต์แบบมีโครงสร้างยังคงเป็น
  หลายข้อความเมื่อเอเจนต์ปล่อยเพย์โหลดที่ส่งมอบได้หลายรายการ

## ช่องฟอรัม

ช่องฟอรัมและช่องสื่อของ Discord รับเฉพาะโพสต์ในเธรดเท่านั้น OpenClaw รองรับสองวิธีในการสร้างโพสต์เหล่านี้:

- ส่งข้อความไปยังฟอรัมหลัก (`channel:<forumId>`) เพื่อสร้างเธรดอัตโนมัติ ชื่อเธรดจะใช้บรรทัดแรกที่ไม่ว่างของข้อความของคุณ
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

ฟอรัมหลักไม่รับคอมโพเนนต์ Discord หากคุณต้องการคอมโพเนนต์ ให้ส่งไปยังเธรดนั้นเอง (`channel:<threadId>`)

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับคอนเทนเนอร์คอมโพเนนต์ Discord v2 สำหรับข้อความเอเจนต์ ใช้เครื่องมือข้อความพร้อมเพย์โหลด `components` ผลลัพธ์การโต้ตอบจะถูกกำหนดเส้นทางกลับไปยังเอเจนต์เป็นข้อความขาเข้าปกติ และทำตามการตั้งค่า `replyToMode` ของ Discord ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถวแอ็กชันอนุญาตให้มีปุ่มได้สูงสุด 5 ปุ่ม หรือเมนูเลือกหนึ่งเมนู
- ประเภทการเลือก: `string`, `user`, `role`, `mentionable`, `channel`

โดยค่าเริ่มต้น คอมโพเนนต์ใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่อให้ปุ่ม การเลือก และฟอร์มใช้งานได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดว่าใครคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (ID ผู้ใช้ Discord, แท็ก หรือ `*`) เมื่อกำหนดค่าแล้ว ผู้ใช้ที่ไม่ตรงกันจะได้รับการปฏิเสธแบบชั่วคราว

คำสั่งสแลช `/model` และ `/models` เปิดตัวเลือกโมเดลแบบโต้ตอบที่มีดรอปดาวน์ผู้ให้บริการ โมเดล และรันไทม์ที่เข้ากันได้ พร้อมขั้นตอนส่ง `/models add` เลิกใช้แล้วและตอนนี้จะส่งคืนข้อความแจ้งการเลิกใช้แทนการลงทะเบียนโมเดลจากแชต การตอบกลับของตัวเลือกเป็นแบบชั่วคราวและมีเพียงผู้ใช้ที่เรียกใช้เท่านั้นที่ใช้งานได้

ไฟล์แนบ:

- บล็อก `file` ต้องชี้ไปยังการอ้างอิงไฟล์แนบ (`attachment://<filename>`)
- ระบุไฟล์แนบผ่าน `media`/`path`/`filePath` (ไฟล์เดียว); ใช้ `media-gallery` สำหรับหลายไฟล์
- ใช้ `filename` เพื่อแทนที่ชื่ออัปโหลดเมื่อควรให้ตรงกับการอ้างอิงไฟล์แนบ

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
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM `channels.discord.allowFrom` คือรายการอนุญาต DM ตามแบบบัญญัติ

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.discord.allowFrom` มี `"*"`)
    - `disabled`

    หากนโยบาย DM ไม่ได้เปิดอยู่ ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือถูกขอให้จับคู่ในโหมด `pairing`)

    ลำดับความสำคัญของหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - สำหรับหนึ่งบัญชี `allowFrom` มีลำดับความสำคัญเหนือ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อ `allowFrom` ของตนเองและ `dm.allowFrom` แบบเดิมไม่ได้ตั้งค่าไว้
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    `channels.discord.dm.policy` และ `channels.discord.dm.allowFrom` แบบเดิมยังคงอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การกล่าวถึง `<@id>`

    ปกติ ID ตัวเลขล้วนจะถูกแปลงเป็น ID ช่องเมื่อค่าเริ่มต้นของช่องทำงานอยู่ แต่ ID ที่ระบุไว้ใน `allowFrom` ของ DM ที่มีผลของบัญชีจะถูกถือเป็นเป้าหมาย DM ของผู้ใช้เพื่อความเข้ากันได้

  </Tab>

  <Tab title="DM access groups">
    DM ของ Discord สามารถใช้รายการ `accessGroup:<name>` แบบไดนามิกใน `channels.discord.allowFrom`

    ชื่อกลุ่มการเข้าถึงใช้ร่วมกันข้ามช่องข้อความ ใช้ `type: "message.senders"` สำหรับกลุ่มคงที่ที่สมาชิกถูกแสดงด้วยไวยากรณ์ `allowFrom` ปกติของแต่ละช่อง หรือ `type: "discord.channelAudience"` เมื่อกลุ่มผู้ชม `ViewChannel` ปัจจุบันของช่อง Discord ควรกำหนดสมาชิกแบบไดนามิก พฤติกรรมกลุ่มการเข้าถึงที่ใช้ร่วมกันมีเอกสารไว้ที่นี่: [กลุ่มการเข้าถึง](/th/channels/access-groups)

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

    ช่องข้อความ Discord ไม่มีรายการสมาชิกแยกต่างหาก `type: "discord.channelAudience"` จำลองสมาชิกภาพเป็น: ผู้ส่ง DM เป็นสมาชิกของกิลด์ที่กำหนดค่าไว้และปัจจุบันมีสิทธิ์ `ViewChannel` ที่มีผลบนช่องที่กำหนดค่าไว้หลังจากใช้บทบาทและการเขียนทับของช่องแล้ว

    ตัวอย่าง: อนุญาตให้ทุกคนที่มองเห็น `#maintainers` ส่ง DM ไปยังบอตได้ โดยยังคงปิด DM สำหรับทุกคนอื่น

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

    เปิดใช้ **Server Members Intent** ใน Discord Developer Portal สำหรับบอตเมื่อใช้กลุ่มการเข้าถึงแบบผู้ชมช่อง DM ไม่มีสถานะสมาชิกกิลด์ ดังนั้น OpenClaw จึงแปลงสมาชิกผ่าน Discord REST ณ เวลาการอนุญาต

  </Tab>

  <Tab title="Guild policy">
    การจัดการกิลด์ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    ค่าพื้นฐานที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    พฤติกรรม `allowlist`:

    - กิลด์ต้องตรงกับ `channels.discord.guilds` (แนะนำให้ใช้ `id`, ยอมรับ slug)
    - รายการอนุญาตผู้ส่งแบบไม่บังคับ: `users` (แนะนำ ID ที่คงที่) และ `roles` (เฉพาะ ID บทบาท); หากกำหนดค่าอย่างใดอย่างหนึ่งไว้ ผู้ส่งจะได้รับอนุญาตเมื่อ ตรงกับ `users` หรือ `roles`
    - การจับคู่ชื่อ/แท็กโดยตรงถูกปิดใช้งานโดยค่าเริ่มต้น; เปิดใช้ `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเป็นโหมดความเข้ากันได้ฉุกเฉินเท่านั้น
    - รองรับชื่อ/แท็กสำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อใช้รายการชื่อ/แท็ก
    - หากกิลด์มีการกำหนดค่า `channels` ช่องที่ไม่อยู่ในรายการจะถูกปฏิเสธ
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

    หากคุณตั้งค่าเฉพาะ `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` ค่าสำรองรันไทม์คือ `groupPolicy="allowlist"` (พร้อมคำเตือนในบันทึก) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`

  </Tab>

  <Tab title="Mentions and group DMs">
    ข้อความกิลด์จะถูกควบคุมด้วยการกล่าวถึงโดยค่าเริ่มต้น

    การตรวจจับการกล่าวถึงรวมถึง:

    - การกล่าวถึงบอตโดยชัดเจน
    - รูปแบบการกล่าวถึงที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, ค่าสำรอง `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับถึงบอตโดยนัยในกรณีที่รองรับ

    เมื่อเขียนข้อความ Discord ขาออก ให้ใช้ไวยากรณ์การกล่าวถึงตามแบบบัญญัติ: `<@USER_ID>` สำหรับผู้ใช้, `<#CHANNEL_ID>` สำหรับช่อง และ `<@&ROLE_ID>` สำหรับบทบาท อย่าใช้รูปแบบการกล่าวถึงชื่อเล่นแบบเดิม `<@!USER_ID>`

    `requireMention` ถูกกำหนดค่าต่อกิลด์/ช่อง (`channels.discord.guilds...`)
    `ignoreOtherMentions` เลือกได้ว่าจะละทิ้งข้อความที่กล่าวถึงผู้ใช้/บทบาทอื่นแต่ไม่ได้กล่าวถึงบอต (ยกเว้น @everyone/@here)

    DM แบบกลุ่ม:

    - ค่าเริ่มต้น: ละเว้น (`dm.groupEnabled=false`)
    - รายการอนุญาตแบบไม่บังคับผ่าน `dm.groupChannels` (ID ช่องหรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตามบทบาท

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิกกิลด์ Discord ไปยังเอเจนต์ต่างกันตาม ID บทบาท การผูกตามบทบาทรับเฉพาะ ID บทบาทและจะถูกประเมินหลังการผูก peer หรือ parent-peer และก่อนการผูกแบบเฉพาะกิลด์ หากการผูกตั้งค่าฟิลด์การจับคู่อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ฟิลด์ที่กำหนดค่าทั้งหมดต้องตรงกัน

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
- `commands.native=false` จะข้ามการลงทะเบียนคำสั่ง slash ของ Discord และการล้างข้อมูลระหว่างการเริ่มต้น คำสั่งที่เคยลงทะเบียนไว้ก่อนหน้าอาจยังมองเห็นได้ใน Discord จนกว่าคุณจะนำคำสั่งเหล่านั้นออกจากแอป Discord
- การยืนยันสิทธิ์คำสั่งแบบเนทีฟใช้ allowlists/นโยบายของ Discord ชุดเดียวกับการจัดการข้อความปกติ
- คำสั่งอาจยังมองเห็นได้ใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต แต่การดำเนินการยังบังคับใช้การยืนยันสิทธิ์ของ OpenClaw และส่งคืน "not authorized"

ดู [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแคตตาล็อกคำสั่งและพฤติกรรม

การตั้งค่าเริ่มต้นของคำสั่ง slash:

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

    หมายเหตุ: `off` จะปิดการเธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงถูกใช้งาน
    `first` จะแนบการอ้างอิงการตอบกลับแบบเนทีฟโดยนัยกับข้อความ Discord ขาออกแรกของรอบเสมอ
    `batched` จะแนบการอ้างอิงการตอบกลับแบบเนทีฟโดยนัยของ Discord เฉพาะเมื่อรอบขาเข้าเป็นชุดข้อความหลายข้อความที่ถูกหน่วงรวมกัน ซึ่งมีประโยชน์เมื่อคุณต้องการใช้การตอบกลับแบบเนทีฟเป็นหลักสำหรับแชตที่ส่งมารัวและคลุมเครือ ไม่ใช่ทุกรอบที่มีข้อความเดียว

    ID ข้อความจะแสดงในบริบท/ประวัติ เพื่อให้เอเจนต์กำหนดเป้าหมายข้อความเฉพาะได้

  </Accordion>

  <Accordion title="ตัวอย่างสตรีมสด">
    OpenClaw สามารถสตรีมร่างคำตอบได้โดยส่งข้อความชั่วคราวและแก้ไขข้อความนั้นเมื่อมีข้อความเข้ามา `channels.discord.streaming` รับค่า `off` (ค่าเริ่มต้น) | `partial` | `block` | `progress` `progress` จะคงร่างสถานะที่แก้ไขได้หนึ่งรายการและอัปเดตด้วยความคืบหน้าของเครื่องมือจนกว่าจะส่งผลลัพธ์สุดท้าย; `streamMode` เป็นนามแฝงรันไทม์แบบเดิม ให้รัน `openclaw doctor --fix` เพื่อเขียน config ที่บันทึกไว้ใหม่เป็นคีย์มาตรฐาน

    ค่าเริ่มต้นยังคงเป็น `off` เพราะการแก้ไขตัวอย่างใน Discord จะชน rate limit อย่างรวดเร็วเมื่อมีบอทหรือ Gateway หลายตัวใช้งานบัญชีเดียวกัน

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
    - `block` ส่งชิ้นส่วนขนาดร่างออกมา (ใช้ `draftChunk` เพื่อปรับขนาดและจุดตัด โดยถูกจำกัดไว้ที่ `textChunkLimit`)
    - ผลลัพธ์สุดท้ายที่เป็นสื่อ ข้อผิดพลาด และการตอบกลับแบบชัดเจนจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าจะนำข้อความตัวอย่างกลับมาใช้กับการอัปเดตเครื่องมือ/ความคืบหน้าหรือไม่
    - `streaming.preview.commandText` / `streaming.progress.commandText` ควบคุมรายละเอียดคำสั่ง/การ execute ในบรรทัดความคืบหน้าแบบกระชับ: `raw` (ค่าเริ่มต้น) หรือ `status` (เฉพาะป้ายกำกับเครื่องมือ)

    ซ่อนข้อความคำสั่ง/การ execute แบบดิบโดยยังคงบรรทัดความคืบหน้าแบบกระชับไว้:

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

    การสตรีมตัวอย่างรองรับเฉพาะข้อความเท่านั้น; การตอบกลับที่เป็นสื่อจะย้อนกลับไปใช้การส่งตามปกติ เมื่อเปิดใช้งานการสตรีมแบบ `block` อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

  </Accordion>

  <Accordion title="ประวัติ บริบท และพฤติกรรมของเธรด">
    บริบทประวัติของ guild:

    - ค่าเริ่มต้น `channels.discord.historyLimit` คือ `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    การควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมของเธรด:

    - เธรด Discord จะถูกกำหนดเส้นทางเป็นเซสชันของช่อง และสืบทอด config ของช่องแม่ เว้นแต่จะถูกแทนที่
    - เซสชันเธรดสืบทอดการเลือก `/model` ระดับเซสชันของช่องแม่เป็น fallback เฉพาะโมเดล; การเลือก `/model` ภายในเธรดยังคงมีลำดับความสำคัญเหนือกว่า และประวัติ transcript ของแม่จะไม่ถูกคัดลอก เว้นแต่จะเปิดใช้งานการสืบทอด transcript
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) เลือกให้เธรดอัตโนมัติใหม่เริ่ม seed จาก transcript ของแม่ การแทนที่รายบัญชีอยู่ใต้ `channels.discord.accounts.<id>.thread.inheritParent`
    - รีแอ็กชันของ message-tool สามารถ resolve เป้าหมาย DM แบบ `user:<id>` ได้
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะถูกคงไว้ระหว่าง fallback การเปิดใช้งานในขั้นตอบกลับ

    หัวข้อช่องจะถูกฉีดเป็นบริบทที่ **ไม่น่าเชื่อถือ** allowlists ควบคุมว่าใครสามารถเรียกเอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบครบถ้วน

  </Accordion>

  <Accordion title="เซสชันที่ผูกกับเธรดสำหรับ subagents">
    Discord สามารถผูกเธรดกับเป้าหมายเซสชัน เพื่อให้ข้อความติดตามผลในเธรดนั้นยังคงถูกกำหนดเส้นทางไปยังเซสชันเดียวกัน (รวมถึงเซสชัน subagent)

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/ใหม่กับเป้าหมาย subagent/เซสชัน
    - `/unfocus` นำการผูกเธรดปัจจุบันออก
    - `/agents` แสดงงานที่กำลังทำงานและสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการ auto-unfocus เมื่อไม่มีการใช้งานสำหรับการผูกที่โฟกัสอยู่
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

    - `session.threadBindings.*` ตั้งค่าเริ่มต้นทั่วระบบ
    - `channels.discord.threadBindings.*` แทนที่พฤติกรรมของ Discord
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดอัตโนมัติสำหรับ `sessions_spawn({ thread: true })` และการ spawn เธรดของ ACP ค่าเริ่มต้น: `true`
    - `defaultSpawnContext` ควบคุมบริบท subagent แบบเนทีฟสำหรับการ spawn ที่ผูกกับเธรด ค่าเริ่มต้น: `"fork"`
    - คีย์ `spawnSubagentSessions`/`spawnAcpSessions` ที่เลิกใช้แล้วจะถูกย้ายโดย `openclaw doctor --fix`
    - หากการผูกเธรดถูกปิดใช้งานสำหรับบัญชี `/focus` และการดำเนินการผูกเธรดที่เกี่ยวข้องจะไม่พร้อมใช้งาน

    ดู [Sub-agents](/th/tools/subagents), [เอเจนต์ ACP](/th/tools/acp-agents), และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="การผูกช่อง ACP แบบถาวร">
    สำหรับ workspace ACP แบบ "always-on" ที่เสถียร ให้กำหนดค่าการผูก ACP แบบมีชนิดในระดับบนสุดที่กำหนดเป้าหมายเป็นการสนทนา Discord

    พาธ Config:

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

    - `/acp spawn codex --bind here` ผูกช่องหรือเธรดปัจจุบันไว้กับที่ และคงข้อความในอนาคตไว้บนเซสชัน ACP เดิม ข้อความในเธรดสืบทอดการผูกของช่องแม่
    - ในช่องหรือเธรดที่ถูกผูกไว้ `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP เดิมไว้กับที่ การผูกเธรดชั่วคราวสามารถแทนที่การ resolve เป้าหมายขณะทำงานอยู่ได้
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดย่อยผ่าน `--thread auto|here`

    ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมการผูก

  </Accordion>

  <Accordion title="การแจ้งเตือนรีแอ็กชัน">
    โหมดการแจ้งเตือนรีแอ็กชันราย guild:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    อีเวนต์รีแอ็กชันจะถูกแปลงเป็นอีเวนต์ระบบและแนบเข้ากับเซสชัน Discord ที่ถูกกำหนดเส้นทาง

  </Accordion>

  <Accordion title="รีแอ็กชัน Ack">
    `ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback อีโมจิประจำตัวเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้น "👀")

    หมายเหตุ:

    - Discord รับอีโมจิ unicode หรือชื่ออีโมจิแบบกำหนดเอง
    - ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับช่องหรือบัญชี

  </Accordion>

  <Accordion title="การเขียน Config">
    การเขียน config ที่เริ่มจากช่องเปิดใช้งานโดยค่าเริ่มต้น

    สิ่งนี้ส่งผลต่อ flow `/config set|unset` (เมื่อเปิดใช้งานฟีเจอร์คำสั่ง)

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
    เปิดใช้งานการ resolve ของ PluralKit เพื่อแมปข้อความที่ถูก proxy ไปยังตัวตนของสมาชิกระบบ:

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
    - ชื่อแสดงผลของสมาชิกจะถูกจับคู่ตามชื่อ/slug เฉพาะเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การค้นหาใช้ ID ข้อความดั้งเดิมและถูกจำกัดด้วยกรอบเวลา
    - หากการค้นหาล้มเหลว ข้อความที่ถูก proxy จะถือเป็นข้อความบอทและถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="นามแฝงการ mention ขาออก">
    ใช้ `mentionAliases` เมื่อเอเจนต์ต้องการ mention ขาออกแบบกำหนดได้แน่นอนสำหรับผู้ใช้ Discord ที่รู้จัก คีย์คือ handle ที่ไม่มี `@` นำหน้า; ค่าคือ ID ผู้ใช้ Discord handle ที่ไม่รู้จัก, `@everyone`, `@here`, และ mention ภายใน code span ของ Markdown จะไม่ถูกเปลี่ยนแปลง

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
    การอัปเดต presence จะถูกนำไปใช้เมื่อคุณตั้งค่าช่อง status หรือ activity หรือเมื่อคุณเปิดใช้งาน auto presence

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

    ตัวอย่างการ Streaming:

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

    - 0: Playing
    - 1: Streaming (ต้องมี `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (ใช้ข้อความ activity เป็นสถานะของ status; emoji เป็นทางเลือก)
    - 5: Competing

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

    สถานะอัตโนมัติจะแมปความพร้อมใช้งานขณะรันกับสถานะ Discord: healthy => online, degraded หรือ unknown => idle, exhausted หรือ unavailable => dnd การเขียนทับข้อความที่เลือกได้:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับตัวแทน `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord รองรับการจัดการการอนุมัติด้วยปุ่มใน DM และสามารถโพสต์พรอมต์การอนุมัติในช่องทางต้นทางได้ตามต้องการ

    พาธการตั้งค่า:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (เลือกได้; จะถอยกลับไปใช้ `commands.ownerAllowFrom` เมื่อทำได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord จะเปิดใช้งานการอนุมัติ exec แบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และสามารถระบุผู้อนุมัติได้อย่างน้อยหนึ่งราย ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมานผู้อนุมัติ exec จาก `allowFrom` ของช่องทาง, `dm.allowFrom` แบบเดิม หรือ `defaultTo` ของข้อความโดยตรง ตั้งค่า `enabled: false` เพื่อปิดใช้งาน Discord ในฐานะไคลเอนต์การอนุมัติแบบเนทีฟอย่างชัดเจน

    สำหรับคำสั่งกลุ่มที่ละเอียดอ่อนและจำกัดเฉพาะเจ้าของ เช่น `/diagnostics` และ `/export-trajectory` OpenClaw จะส่งพรอมต์การอนุมัติและผลลัพธ์สุดท้ายแบบส่วนตัว โดยจะลองใช้ Discord DM ก่อนเมื่อเจ้าของที่เรียกใช้มีเส้นทางเจ้าของของ Discord; หากไม่มี จะถอยกลับไปยังเส้นทางเจ้าของแรกที่ใช้ได้จาก `commands.ownerAllowFrom` เช่น Telegram

    เมื่อ `target` เป็น `channel` หรือ `both` พรอมต์การอนุมัติจะมองเห็นได้ในช่องทาง เฉพาะผู้อนุมัติที่ระบุได้เท่านั้นที่ใช้ปุ่มได้; ผู้ใช้อื่นจะได้รับการปฏิเสธแบบชั่วคราวที่เห็นเฉพาะตน พรอมต์การอนุมัติมีข้อความคำสั่งรวมอยู่ด้วย ดังนั้นให้เปิดใช้การส่งไปยังช่องทางเฉพาะในช่องทางที่เชื่อถือได้เท่านั้น หากไม่สามารถดึง ID ช่องทางจากคีย์เซสชันได้ OpenClaw จะถอยกลับไปส่งผ่าน DM

    Discord ยังเรนเดอร์ปุ่มอนุมัติร่วมที่ใช้โดยช่องทางแชตอื่นด้วย อะแดปเตอร์ Discord แบบเนทีฟจะเพิ่มการกำหนดเส้นทาง DM ของผู้อนุมัติและการกระจายไปยังช่องทางเป็นหลัก
    เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก; OpenClaw
    ควรรวมคำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์เครื่องมือระบุว่า
    การอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียว
    หากรันไทม์การอนุมัติแบบเนทีฟของ Discord ไม่ได้ทำงาน OpenClaw จะคง
    พรอมต์ `/approve <id> <decision>` แบบกำหนดแน่นอนในเครื่องให้มองเห็นได้ หาก
    รันไทม์ทำงานอยู่แต่ไม่สามารถส่งการ์ดแบบเนทีฟไปยังเป้าหมายใดได้
    OpenClaw จะส่งประกาศสำรองในแชตเดียวกันพร้อมคำสั่ง `/approve`
    ที่ตรงจากการอนุมัติที่รอดำเนินการ

    การตรวจสอบสิทธิ์ Gateway และการแก้ผลการอนุมัติเป็นไปตามสัญญาไคลเอนต์ Gateway ร่วม (`plugin:` ID จะแก้ผลผ่าน `plugin.approval.resolve`; ID อื่นผ่าน `exec.approval.resolve`) การอนุมัติจะหมดอายุหลัง 30 นาทีตามค่าเริ่มต้น

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและเกตการดำเนินการ

การดำเนินการข้อความของ Discord รวมถึงการส่งข้อความ, ผู้ดูแลช่องทาง, การมอดเดอเรต, สถานะ และการดำเนินการเมทาดาทา

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- ปฏิกิริยา: `react`, `reactions`, `emojiList`
- การมอดเดอเรต: `timeout`, `kick`, `ban`
- สถานะ: `setPresence`

การดำเนินการ `event-create` รับพารามิเตอร์ `image` ที่เลือกได้ (URL หรือพาธไฟล์ในเครื่อง) เพื่อกำหนดภาพหน้าปกของอีเวนต์ที่กำหนดเวลาไว้

เกตการดำเนินการอยู่ใต้ `channels.discord.actions.*`

ลักษณะการทำงานของเกตเริ่มต้น:

| กลุ่มการดำเนินการ                                                                                                                                                             | ค่าเริ่มต้น  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้งาน  |
| roles                                                                                                                                                                    | ปิดใช้งาน |
| moderation                                                                                                                                                               | ปิดใช้งาน |
| presence                                                                                                                                                                 | ปิดใช้งาน |

## UI Components v2

OpenClaw ใช้ Discord components v2 สำหรับการอนุมัติ exec และเครื่องหมายข้ามบริบท การดำเนินการข้อความของ Discord ยังสามารถรับ `components` สำหรับ UI แบบกำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้างเพย์โหลดคอมโพเนนต์ผ่านเครื่องมือ discord) ในขณะที่ `embeds` แบบเดิมยังคงใช้ได้ แต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นที่ใช้โดยคอนเทนเนอร์คอมโพเนนต์ของ Discord (hex)
- ตั้งค่ารายบัญชีด้วย `channels.discord.accounts.<id>.ui.components.accentColor`
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

Discord มีพื้นผิวเสียงสองแบบที่แตกต่างกัน: **ช่องทางเสียง** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบพรีวิวคลื่นเสียง) Gateway รองรับทั้งสองแบบ

### ช่องทางเสียง

รายการตรวจสอบการตั้งค่า:

1. เปิดใช้ Message Content Intent ใน Discord Developer Portal
2. เปิดใช้ Server Members Intent เมื่อใช้รายการอนุญาตตามบทบาท/ผู้ใช้
3. เชิญบอทด้วยขอบเขต `bot` และ `applications.commands`
4. ให้สิทธิ์ Connect, Speak, Send Messages และ Read Message History ในช่องทางเสียงเป้าหมาย
5. เปิดใช้คำสั่งเนทีฟ (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งจะใช้เอเจนต์เริ่มต้นของบัญชีและทำตามกฎรายการอนุญาตและนโยบายกลุ่มเดียวกับคำสั่ง Discord อื่น

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

- `voice.tts` เขียนทับ `messages.tts` สำหรับการเล่นเสียงเท่านั้น
- `voice.model` เขียนทับ LLM ที่ใช้สำหรับการตอบกลับในช่องทางเสียงของ Discord เท่านั้น ปล่อยไว้ไม่ตั้งค่าเพื่อสืบทอดโมเดลเอเจนต์ที่กำหนดเส้นทางไว้
- STT ใช้ `tools.media.audio`; `voice.model` ไม่มีผลต่อการถอดเสียง
- การเขียนทับ `systemPrompt` ของ Discord รายช่องทางจะใช้กับเทิร์นทรานสคริปต์เสียงสำหรับช่องทางเสียงนั้น
- เทิร์นทรานสคริปต์เสียงจะอนุมานสถานะเจ้าของจาก `allowFrom` ของ Discord (หรือ `dm.allowFrom`); ผู้พูดที่ไม่ใช่เจ้าของไม่สามารถเข้าถึงเครื่องมือเฉพาะเจ้าของได้ (เช่น `gateway` และ `cron`)
- เสียง Discord เป็นแบบเลือกเปิดสำหรับการตั้งค่าแบบข้อความเท่านั้น; ตั้งค่า `channels.discord.voice.enabled=true` (หรือคงบล็อก `channels.discord.voice` ที่มีอยู่) เพื่อเปิดใช้คำสั่ง `/vc`, รันไทม์เสียง และ Gateway intent `GuildVoiceStates`
- `channels.discord.intents.voiceStates` สามารถเขียนทับการสมัครรับ intent สถานะเสียงได้อย่างชัดเจน ปล่อยไว้ไม่ตั้งค่าเพื่อให้ intent เป็นไปตามการเปิดใช้งานเสียงที่มีผล
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือกการเข้าร่วมของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- `voice.connectTimeoutMs` ควบคุมการรอ Ready ของ `@discordjs/voice` ตอนเริ่มต้นสำหรับ `/vc join` และความพยายามเข้าร่วมอัตโนมัติ ค่าเริ่มต้น: `30000`
- `voice.reconnectGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอให้เซสชันเสียงที่ถูกตัดการเชื่อมต่อเริ่มเชื่อมต่อใหม่ก่อนทำลายเซสชัน ค่าเริ่มต้น: `15000`
- OpenClaw ยังเฝ้าดูความล้มเหลวในการถอดรหัสฝั่งรับและกู้คืนอัตโนมัติด้วยการออกจาก/เข้าร่วมช่องทางเสียงใหม่หลังเกิดความล้มเหลวซ้ำในช่วงเวลาสั้น
- หากบันทึกฝั่งรับแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำหลังอัปเดต ให้รวบรวมรายงาน dependency และบันทึก บรรทัด `@discordjs/voice` ที่ bundled มาพร้อมการแก้ไข padding จาก upstream ใน discord.js PR #11449 ซึ่งปิด discord.js issue #11419

ไปป์ไลน์ช่องทางเสียง:

- การจับ PCM ของ Discord จะถูกแปลงเป็นไฟล์ WAV ชั่วคราว
- `tools.media.audio` จัดการ STT เช่น `openai/gpt-4o-mini-transcribe`
- ทรานสคริปต์จะถูกส่งผ่าน ingress และการกำหนดเส้นทางของ Discord ขณะที่ LLM ตอบกลับทำงานด้วยนโยบายเอาต์พุตเสียงที่ซ่อนเครื่องมือ `tts` ของเอเจนต์และขอข้อความที่ส่งคืน เพราะเสียง Discord เป็นเจ้าของการเล่น TTS สุดท้าย
- เมื่อกำหนด `voice.model` จะเขียนทับเฉพาะ LLM ตอบกลับสำหรับเทิร์นช่องทางเสียงนี้
- `voice.tts` จะถูกผสานทับ `messages.tts`; เสียงที่ได้จะถูกเล่นในช่องทางที่เข้าร่วม

ข้อมูลประจำตัวจะถูกแก้รายคอมโพเนนต์: การตรวจสอบสิทธิ์เส้นทาง LLM สำหรับ `voice.model`, การตรวจสอบสิทธิ์ STT สำหรับ `tools.media.audio` และการตรวจสอบสิทธิ์ TTS สำหรับ `messages.tts`/`voice.tts`

### ข้อความเสียง

ข้อความเสียง Discord แสดงพรีวิวคลื่นเสียงและต้องใช้เสียง OGG/Opus OpenClaw จะสร้างคลื่นเสียงโดยอัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ Gateway เพื่อตรวจสอบและแปลง

- ระบุ **พาธไฟล์ในเครื่อง** (URL จะถูกปฏิเสธ)
- ละเว้นเนื้อหาข้อความ (Discord ปฏิเสธข้อความ + ข้อความเสียงในเพย์โหลดเดียวกัน)
- ยอมรับรูปแบบเสียงใดก็ได้; OpenClaw จะแปลงเป็น OGG/Opus ตามต้องการ

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - เปิดใช้ Message Content Intent
    - เปิดใช้ Server Members Intent เมื่อคุณพึ่งพาการระบุตัวผู้ใช้/สมาชิก
    - รีสตาร์ท Gateway หลังเปลี่ยน intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบรายการอนุญาตของ guild ใต้ `channels.discord.guilds`
    - หากมีแมป `channels` ของ guild จะอนุญาตเฉพาะช่องทางที่อยู่ในรายการเท่านั้น
    - ตรวจสอบลักษณะการทำงานของ `requireMention` และรูปแบบการ mention

    การตรวจสอบที่มีประโยชน์:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    สาเหตุทั่วไป:

    - `groupPolicy="allowlist"` โดยไม่มีรายการอนุญาตของ guild/ช่องทางที่ตรงกัน
    - กำหนดค่า `requireMention` ผิดตำแหน่ง (ต้องอยู่ใต้ `channels.discord.guilds` หรือรายการช่องทาง)
    - ผู้ส่งถูกบล็อกโดยรายการอนุญาต `users` ของ guild/ช่องทาง

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    บันทึกทั่วไป:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    ปุ่มปรับคิว Discord Gateway:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - สิ่งนี้ควบคุมเฉพาะงาน listener ของ Discord Gateway ไม่ใช่อายุเทิร์นของเอเจนต์

    Discord ไม่ใช้ timeout ที่ช่องทางเป็นเจ้าของกับเทิร์นเอเจนต์ที่เข้าคิว Listener ข้อความจะส่งต่องานทันที และการรัน Discord ที่เข้าคิวจะรักษาลำดับต่อเซสชันไว้จนกว่าวงจรชีวิตของเซสชัน/เครื่องมือ/รันไทม์จะเสร็จสิ้นหรือยกเลิกงาน

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

  <Accordion title="คำเตือนการหมดเวลาของการค้นหาเมทาดาทา Gateway">
    OpenClaw ดึงเมทาดาทา `/gateway/bot` ของ Discord ก่อนเชื่อมต่อ ความล้มเหลวชั่วคราวจะถอยกลับไปใช้ URL Gateway เริ่มต้นของ Discord และจะถูกจำกัดอัตราในบันทึก

    ค่าปรับแต่งการหมดเวลาของเมทาดาทา:

    - บัญชีเดียว: `channels.discord.gatewayInfoTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - ค่า env สำรองเมื่อไม่ได้ตั้งค่าคอนฟิก: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - ค่าเริ่มต้น: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="การรีสตาร์ตเมื่อ Gateway READY หมดเวลา">
    OpenClaw รออีเวนต์ `READY` ของ Gateway Discord ระหว่างการเริ่มต้นและหลังจากเชื่อมต่อใหม่ตอนรันไทม์ การตั้งค่าหลายบัญชีที่หน่วงการเริ่มต้นเป็นลำดับอาจต้องใช้หน้าต่าง READY ตอนเริ่มต้นที่ยาวกว่าค่าเริ่มต้น

    ค่าปรับแต่งการหมดเวลา READY:

    - บัญชีเดียวตอนเริ่มต้น: `channels.discord.gatewayReadyTimeoutMs`
    - หลายบัญชีตอนเริ่มต้น: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - ค่า env สำรองตอนเริ่มต้นเมื่อไม่ได้ตั้งค่าคอนฟิก: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นตอนเริ่มต้น: `15000` (15 วินาที), สูงสุด: `120000`
    - บัญชีเดียวตอนรันไทม์: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - หลายบัญชีตอนรันไทม์: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - ค่า env สำรองตอนรันไทม์เมื่อไม่ได้ตั้งค่าคอนฟิก: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นตอนรันไทม์: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="ความไม่ตรงกันของการตรวจสอบสิทธิ์">
    การตรวจสอบสิทธิ์ของ `channels status --probe` ใช้งานได้เฉพาะกับ ID ช่องที่เป็นตัวเลขเท่านั้น

    หากคุณใช้คีย์แบบ slug การจับคู่ตอนรันไทม์ยังอาจทำงานได้ แต่ probe ไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน

  </Accordion>

  <Accordion title="ปัญหา DM และการจับคู่">

    - ปิดใช้ DM: `channels.discord.dm.enabled=false`
    - ปิดใช้นโยบาย DM: `channels.discord.dmPolicy="disabled"` (แบบเดิม: `channels.discord.dm.policy`)
    - กำลังรอการอนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูปจากบอตสู่บอต">
    โดยค่าเริ่มต้น ข้อความที่บอตเป็นผู้เขียนจะถูกละเว้น

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎการกล่าวถึงและ allowlist ที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมแบบลูป
    แนะนำให้ใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความจากบอตที่กล่าวถึงบอตเท่านั้น

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

    - อัปเดต OpenClaw ให้เป็นปัจจุบัน (`openclaw update`) เพื่อให้มีลอจิกกู้คืนการรับเสียงของ Discord
    - ยืนยันว่า `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้นของต้นน้ำ) และปรับเฉพาะเมื่อจำเป็น
    - ดูบันทึกสำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากยังล้มเหลวต่อไปหลังจาก rejoin อัตโนมัติ ให้รวบรวมบันทึกและเปรียบเทียบกับประวัติการรับ DAVE ของต้นน้ำใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## อ้างอิงคอนฟิก

อ้างอิงหลัก: [อ้างอิงคอนฟิก - Discord](/th/gateway/config-channels#discord)

<Accordion title="ฟิลด์ Discord สัญญาณสูง">

- การเริ่มต้น/การรับรองความถูกต้อง: `enabled`, `token`, `accounts.*`, `allowBots`
- นโยบาย: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- คำสั่ง: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- คิวอีเวนต์: `eventQueue.listenerTimeout` (งบเวลาของ listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- การตอบกลับ/ประวัติ: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- การสตรีม: `streaming` (นามแฝงแบบเดิม: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- สื่อ/การลองใหม่: `mediaMaxMb` (จำกัดการอัปโหลดขาออกของ Discord, ค่าเริ่มต้น `100MB`), `retry`
- การกระทำ: `actions.*`
- การแสดงสถานะ: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ฟีเจอร์: `threadBindings`, `bindings[]` ระดับบนสุด (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการปฏิบัติการ

- จัดการโทเค็นบอตเป็นความลับ (แนะนำ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการควบคุมดูแล)
- มอบสิทธิ์ Discord เท่าที่จำเป็น
- หากการ deploy/state ของคำสั่งล้าสมัย ให้รีสตาร์ต Gateway และตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

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
    โมเดลภัยคุกคามและการเพิ่มความแข็งแกร่ง
  </Card>
  <Card title="การกำหนดเส้นทางหลายเอเจนต์" icon="sitemap" href="/th/concepts/multi-agent">
    แมป guild และช่องไปยังเอเจนต์
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟ
  </Card>
</CardGroup>
