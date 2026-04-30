---
read_when:
    - การทำงานกับฟีเจอร์ช่อง Discord
summary: สถานะการรองรับบอต Discord ความสามารถ และการกำหนดค่า
title: Discord
x-i18n:
    generated_at: "2026-04-30T09:35:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f31af2801e7faf6456d4452a5f43b0e42a067b86b7e562c308fa450a847356
    source_path: channels/discord.md
    workflow: 16
---

พร้อมใช้งานสำหรับ DM และช่องกิลด์ผ่าน Discord gateway อย่างเป็นทางการ

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    Discord DM จะตั้งค่าเริ่มต้นเป็นโหมดจับคู่
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแคตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยและโฟลว์ซ่อมแซมข้ามช่อง
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

คุณจะต้องสร้างแอปพลิเคชันใหม่พร้อมบอต เพิ่มบอตลงในเซิร์ฟเวอร์ของคุณ และจับคู่กับ OpenClaw เราแนะนำให้เพิ่มบอตของคุณลงในเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากคุณยังไม่มี [ให้สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="สร้างแอปพลิเคชันและบอต Discord">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อประมาณว่า "OpenClaw"

    คลิก **Bot** ในแถบด้านข้าง ตั้งค่า **Username** เป็นชื่อที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้ privileged intents">
    ขณะที่ยังอยู่ในหน้า **Bot** ให้เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับรายการอนุญาตตามบทบาทและการจับคู่ชื่อกับ ID)
    - **Presence Intent** (ไม่บังคับ; จำเป็นเฉพาะสำหรับการอัปเดตสถานะการปรากฏตัว)

  </Step>

  <Step title="คัดลอกโทเคนบอตของคุณ">
    เลื่อนกลับขึ้นไปที่หน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อจะเป็นแบบนั้น แต่การดำเนินการนี้จะสร้างโทเคนแรกของคุณ ไม่มีอะไรถูก "รีเซ็ต"
    </Note>

    คัดลอกโทเคนและบันทึกไว้ที่ใดที่หนึ่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในอีกสักครู่

  </Step>

  <Step title="สร้าง URL เชิญและเพิ่มบอตลงในเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** ในแถบด้านข้าง คุณจะสร้าง URL เชิญพร้อมสิทธิ์ที่ถูกต้องเพื่อเพิ่มบอตลงในเซิร์ฟเวอร์ของคุณ

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
      - เพิ่มปฏิกิริยา (ไม่บังคับ)

    นี่คือชุดพื้นฐานสำหรับช่องข้อความปกติ หากคุณวางแผนจะโพสต์ในเธรด Discord รวมถึงเวิร์กโฟลว์ช่องฟอรัมหรือสื่อที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้ **Send Messages in Threads** ด้วย
    คัดลอก URL ที่สร้างขึ้นด้านล่าง วางลงในเบราว์เซอร์ของคุณ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอตของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิดใช้ Developer Mode และเก็บ ID ของคุณ">
    กลับไปที่แอป Discord คุณต้องเปิดใช้ Developer Mode เพื่อให้คัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนเฟืองถัดจากอวาตาร์ของคุณ) → **Advanced** → เปิด **Developer Mode**
    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ไว้พร้อมกับ Bot Token ของคุณ คุณจะส่งทั้งสามอย่างให้ OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาต DM จากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงานได้ Discord ต้องอนุญาตให้บอตของคุณส่ง DM ถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณ → **Privacy Settings** → เปิด **Direct Messages**

    การตั้งค่านี้ทำให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอต) ส่ง DM ถึงคุณได้ เปิดค่านี้ไว้หากคุณต้องการใช้ Discord DM กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่องกิลด์ คุณสามารถปิด DM หลังจากจับคู่แล้วได้

  </Step>

  <Step title="ตั้งค่าโทเคนบอตของคุณอย่างปลอดภัย (อย่าส่งในแชต)">
    โทเคนบอต Discord ของคุณเป็นความลับ (เหมือนรหัสผ่าน) ตั้งค่าไว้บนเครื่องที่รัน OpenClaw ก่อนส่งข้อความถึงเอเจนต์ของคุณ

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

    หาก OpenClaw กำลังทำงานเป็นบริการพื้นหลังอยู่แล้ว ให้รีสตาร์ทผ่านแอป OpenClaw Mac หรือโดยการหยุดแล้วเริ่มกระบวนการ `openclaw gateway run` ใหม่
    สำหรับการติดตั้งแบบบริการที่จัดการ ให้รัน `openclaw gateway install` จาก shell ที่มี `DISCORD_BOT_TOKEN` อยู่ หรือเก็บตัวแปรไว้ใน `~/.openclaw/.env` เพื่อให้บริการสามารถ resolve env SecretRef ได้หลังรีสตาร์ท
    หากโฮสต์ของคุณถูกบล็อกหรือถูกจำกัดอัตราโดยการค้นหาแอปพลิเคชันตอนเริ่มต้นของ Discord ให้ตั้งค่า application/client ID ของ Discord จาก Developer Portal เพื่อให้การเริ่มต้นข้าม REST call นั้นได้ ใช้ `channels.discord.applicationId` สำหรับบัญชีเริ่มต้น หรือ `channels.discord.accounts.<accountId>.applicationId` เมื่อคุณรันบอต Discord หลายตัว

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        แชตกับเอเจนต์ OpenClaw ของคุณในช่องที่มีอยู่ใดก็ได้ (เช่น Telegram) แล้วบอกเอเจนต์ หาก Discord เป็นช่องแรกของคุณ ให้ใช้แท็บ CLI / config แทน

        > "ฉันตั้งค่าโทเคนบอต Discord ใน config แล้ว โปรดตั้งค่า Discord ให้เสร็จด้วย User ID `<user_id>` และ Server ID `<server_id>`"
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

        สำหรับการตั้งค่าแบบสคริปต์หรือระยะไกล ให้เขียนบล็อก JSON5 เดียวกันด้วย `openclaw config patch --file ./discord.patch.json5 --dry-run` แล้วรันซ้ำโดยไม่มี `--dry-run` รองรับค่า `token` แบบข้อความธรรมดา และรองรับค่า SecretRef สำหรับ `channels.discord.token` ข้าม providers แบบ env/file/exec ด้วย ดู [การจัดการ Secrets](/th/gateway/secrets)

        สำหรับบอต Discord หลายตัว ให้เก็บโทเคนบอตและ application ID แต่ละตัวไว้ใต้บัญชีของตัวเอง `channels.discord.applicationId` ระดับบนจะถูกสืบทอดโดยบัญชี ดังนั้นให้ตั้งค่าตรงนั้นเฉพาะเมื่อทุกบัญชีควรใช้ application ID เดียวกัน

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
    รอจนกว่า gateway จะทำงาน จากนั้น DM ไปหาบอตของคุณใน Discord บอตจะตอบกลับด้วยรหัสจับคู่

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
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

    รหัสจับคู่หมดอายุหลังจาก 1 ชั่วโมง

    ตอนนี้คุณควรแชตกับเอเจนต์ของคุณใน Discord ผ่าน DM ได้แล้ว

  </Step>
</Steps>

<Note>
การ resolve โทเคนรับรู้ตามบัญชี ค่าโทเคนใน config ชนะ env fallback `DISCORD_BOT_TOKEN` ใช้สำหรับบัญชีเริ่มต้นเท่านั้น
หากบัญชี Discord ที่เปิดใช้อยู่สองบัญชี resolve เป็นโทเคนบอตเดียวกัน OpenClaw จะเริ่ม gateway monitor เพียงตัวเดียวสำหรับโทเคนนั้น โทเคนจาก config จะชนะ env fallback เริ่มต้น; ไม่เช่นนั้นบัญชีแรกที่เปิดใช้จะชนะ และบัญชีที่ซ้ำจะถูกรายงานว่าปิดใช้อยู่
สำหรับการเรียกขาออกขั้นสูง (เครื่องมือข้อความ/การดำเนินการช่อง) จะใช้ `token` แบบระบุชัดต่อการเรียกสำหรับการเรียกนั้น สิ่งนี้ใช้กับการดำเนินการแบบส่งและอ่าน/ตรวจสอบ (เช่น read/search/fetch/thread/pins/permissions) การตั้งค่านโยบายบัญชี/การลองซ้ำยังคงมาจากบัญชีที่เลือกใน snapshot runtime ที่ใช้งานอยู่
</Note>

## แนะนำ: ตั้งค่าพื้นที่ทำงานกิลด์

เมื่อ DM ทำงานแล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็นพื้นที่ทำงานเต็มรูปแบบ โดยแต่ละช่องจะได้รับเซสชันเอเจนต์ของตัวเองพร้อมบริบทของตัวเอง แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีเพียงคุณและบอตของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณลงในรายการอนุญาตกิลด์">
    การตั้งค่านี้ทำให้เอเจนต์ของคุณตอบกลับได้ในทุกช่องบนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ DM

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เพิ่ม Discord Server ID `<server_id>` ของฉันลงในรายการอนุญาตกิลด์"
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
    โดยค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในช่องกิลด์เฉพาะเมื่อถูก @mentioned สำหรับเซิร์ฟเวอร์ส่วนตัว คุณอาจต้องการให้ตอบกลับทุกข้อความ

    ในช่องกิลด์ คำตอบสุดท้ายปกติของผู้ช่วยจะยังคงเป็นส่วนตัวตามค่าเริ่มต้น เอาต์พุต Discord ที่มองเห็นได้ต้องถูกส่งอย่างชัดเจนด้วยเครื่องมือ `message` เพื่อให้เอเจนต์สามารถเฝ้าดูแบบเงียบ ๆ ตามค่าเริ่มต้น และโพสต์เฉพาะเมื่อเห็นว่าคำตอบในช่องนั้นมีประโยชน์

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

        หากต้องการกู้คืนคำตอบสุดท้ายอัตโนมัติแบบเดิมสำหรับห้องกลุ่ม/ช่อง ให้ตั้งค่า `messages.groupChat.visibleReplies: "automatic"`

      </Tab>
    </Tabs>

  </Step>

  <Step title="วางแผนสำหรับหน่วยความจำในช่องกิลด์">
    โดยค่าเริ่มต้น หน่วยความจำระยะยาว (MEMORY.md) จะโหลดเฉพาะในเซสชัน DM ช่องกิลด์จะไม่โหลด MEMORY.md โดยอัตโนมัติ

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เมื่อฉันถามคำถามในช่อง Discord ให้ใช้ memory_search หรือ memory_get หากคุณต้องการบริบทระยะยาวจาก MEMORY.md"
      </Tab>
      <Tab title="Manual">
        หากคุณต้องการบริบทที่ใช้ร่วมกันในทุกช่อง ให้ใส่คำแนะนำที่คงที่ไว้ใน `AGENTS.md` หรือ `USER.md` (ไฟล์เหล่านี้จะถูกฉีดเข้าไปในทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงเมื่อจำเป็นด้วยเครื่องมือ memory
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างช่องบางช่องบนเซิร์ฟเวอร์ Discord ของคุณแล้วเริ่มแชต เอเจนต์ของคุณเห็นชื่อช่องได้ และแต่ละช่องจะได้รับเซสชันที่แยกจากกันของตัวเอง ดังนั้นคุณสามารถตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ตามที่เหมาะกับเวิร์กโฟลว์ของคุณ

## โมเดล Runtime

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord
- การกำหนดเส้นทางการตอบกลับเป็นแบบกำหนดแน่นอน: การตอบกลับขาเข้าจาก Discord จะกลับไปยัง Discord
- เมทาดาทา guild/channel ของ Discord จะถูกเพิ่มเข้าไปในพรอมป์ของโมเดลในฐานะบริบทที่ไม่น่าเชื่อถือ
  ไม่ใช่คำนำหน้าการตอบกลับที่ผู้ใช้มองเห็น หากโมเดลคัดลอกกรอบข้อมูลนั้น
  กลับมา OpenClaw จะตัดเมทาดาทาที่ถูกคัดลอกออกจากการตอบกลับขาออกและจาก
  บริบทการเล่นซ้ำในอนาคต
- โดยค่าเริ่มต้น (`session.dmScope=main`) แชทโดยตรงจะแชร์เซสชันหลักของเอเจนต์ (`agent:main:main`)
- ช่อง guild ใช้คีย์เซสชันแยกต่างหาก (`agent:<agentId>:discord:channel:<channelId>`)
- Group DM จะถูกละเว้นตามค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่ง slash แบบเนทีฟจะทำงานในเซสชันคำสั่งที่แยกต่างหาก (`agent:<agentId>:discord:slash:<userId>`) ขณะยังคงพก `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่ถูกกำหนดเส้นทาง
- การส่งประกาศ cron/heartbeat แบบข้อความล้วนไปยัง Discord จะใช้คำตอบสุดท้าย
  ที่ผู้ช่วยมองเห็นได้หนึ่งครั้ง เพย์โหลดสื่อและคอมโพเนนต์แบบมีโครงสร้างยังคงเป็น
  หลายข้อความเมื่อเอเจนต์ปล่อยเพย์โหลดที่ส่งมอบได้หลายรายการ

## ช่องฟอรัม

ช่องฟอรัมและช่องสื่อของ Discord รับเฉพาะโพสต์เธรดเท่านั้น OpenClaw รองรับสองวิธีในการสร้างโพสต์เหล่านี้:

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

ฟอรัมหลักไม่รับคอมโพเนนต์ของ Discord หากคุณต้องการคอมโพเนนต์ ให้ส่งไปยังเธรดนั้นเอง (`channel:<threadId>`)

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับคอนเทนเนอร์คอมโพเนนต์ v2 ของ Discord สำหรับข้อความของเอเจนต์ ใช้เครื่องมือข้อความพร้อมเพย์โหลด `components` ผลลัพธ์การโต้ตอบจะถูกกำหนดเส้นทางกลับไปยังเอเจนต์เป็นข้อความขาเข้าปกติ และทำตามการตั้งค่า `replyToMode` ของ Discord ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถวการกระทำอนุญาตให้มีปุ่มได้สูงสุด 5 ปุ่ม หรือเมนูเลือกเดียวหนึ่งรายการ
- ประเภทการเลือก: `string`, `user`, `role`, `mentionable`, `channel`

โดยค่าเริ่มต้น คอมโพเนนต์ใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่ออนุญาตให้ใช้ปุ่ม เมนูเลือก และฟอร์มได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดว่าใครสามารถคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (ID ผู้ใช้ Discord, แท็ก หรือ `*`) เมื่อกำหนดค่าแล้ว ผู้ใช้ที่ไม่ตรงกันจะได้รับข้อความปฏิเสธแบบ ephemeral

คำสั่ง slash `/model` และ `/models` จะเปิดตัวเลือกโมเดลแบบโต้ตอบที่มีดรอปดาวน์ provider, โมเดล และรันไทม์ที่เข้ากันได้ พร้อมขั้นตอน Submit `/models add` เลิกใช้แล้ว และตอนนี้จะส่งคืนข้อความเลิกใช้แทนการลงทะเบียนโมเดลจากแชท การตอบกลับของตัวเลือกเป็นแบบ ephemeral และมีเพียงผู้ใช้ที่เรียกใช้งานเท่านั้นที่ใช้ได้

ไฟล์แนบ:

- บล็อก `file` ต้องชี้ไปยังอ้างอิงไฟล์แนบ (`attachment://<filename>`)
- ระบุไฟล์แนบผ่าน `media`/`path`/`filePath` (ไฟล์เดียว); ใช้ `media-gallery` สำหรับหลายไฟล์
- ใช้ `filename` เพื่อแทนที่ชื่ออัปโหลดเมื่อควรตรงกับอ้างอิงไฟล์แนบ

ฟอร์มโมดัล:

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
  <Tab title="นโยบาย DM">
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM `channels.discord.allowFrom` คือ allowlist ของ DM แบบมาตรฐาน

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.discord.allowFrom` รวม `"*"`)
    - `disabled`

    หากนโยบาย DM ไม่ใช่ open ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือถูกแจ้งให้จับคู่ในโหมด `pairing`)

    ลำดับความสำคัญของหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - สำหรับหนึ่งบัญชี `allowFrom` มีลำดับความสำคัญเหนือ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตัวเองและ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    `channels.discord.dm.policy` และ `channels.discord.dm.allowFrom` แบบเดิมยังคงถูกอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การกล่าวถึง `<@id>`

    ID ตัวเลขเปล่าปกติจะแปลงเป็น ID ช่องเมื่อมีค่าเริ่มต้นของช่องที่ใช้งานอยู่ แต่ ID ที่อยู่ใน `allowFrom` ของ DM ที่มีผลของบัญชีจะถูกถือเป็นเป้าหมาย user DM เพื่อความเข้ากันได้

  </Tab>

  <Tab title="นโยบาย Guild">
    การจัดการ Guild ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    baseline ที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    พฤติกรรม `allowlist`:

    - guild ต้องตรงกับ `channels.discord.guilds` (แนะนำให้ใช้ `id`, ยอมรับ slug)
    - allowlist ของผู้ส่งแบบไม่บังคับ: `users` (แนะนำ ID ที่เสถียร) และ `roles` (ID บทบาทเท่านั้น); หากกำหนดอย่างใดอย่างหนึ่ง ผู้ส่งจะได้รับอนุญาตเมื่อพวกเขาตรงกับ `users` หรือ `roles`
    - การจับคู่ชื่อ/แท็กโดยตรงถูกปิดตามค่าเริ่มต้น; เปิดใช้ `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเป็นโหมดความเข้ากันได้ฉุกเฉิน
    - รองรับชื่อ/แท็กสำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อมีการใช้รายการชื่อ/แท็ก
    - หาก guild มีการกำหนดค่า `channels` ช่องที่ไม่ได้อยู่ในรายการจะถูกปฏิเสธ
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

    หากคุณตั้งค่าเฉพาะ `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` ค่าทดแทนของรันไทม์คือ `groupPolicy="allowlist"` (พร้อมคำเตือนในบันทึก) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`

  </Tab>

  <Tab title="การกล่าวถึงและ group DM">
    ข้อความ Guild ถูกควบคุมด้วยการกล่าวถึงตามค่าเริ่มต้น

    การตรวจจับการกล่าวถึงประกอบด้วย:

    - การกล่าวถึงบอตโดยชัดเจน
    - รูปแบบการกล่าวถึงที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, ค่าทดแทน `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับถึงบอตโดยนัยในกรณีที่รองรับ

    `requireMention` ถูกกำหนดค่าต่อ guild/channel (`channels.discord.guilds...`)
    `ignoreOtherMentions` เลือกได้ว่าจะทิ้งข้อความที่กล่าวถึงผู้ใช้/บทบาทอื่นแต่ไม่ใช่บอตหรือไม่ (ยกเว้น @everyone/@here)

    Group DM:

    - ค่าเริ่มต้น: ละเว้น (`dm.groupEnabled=false`)
    - allowlist แบบไม่บังคับผ่าน `dm.groupChannels` (ID ช่องหรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตามบทบาท

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิก guild ของ Discord ไปยังเอเจนต์ต่างกันตาม ID บทบาท การผูกตามบทบาทรับเฉพาะ ID บทบาท และจะถูกประเมินหลังการผูกแบบ peer หรือ parent-peer และก่อนการผูกแบบ guild-only หากการผูกยังตั้งค่าฟิลด์การจับคู่อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ฟิลด์ทั้งหมดที่กำหนดค่าต้องตรงกัน

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

## คำสั่งเนทีฟและการอนุญาตคำสั่ง

- `commands.native` มีค่าเริ่มต้นเป็น `"auto"` และเปิดใช้สำหรับ Discord
- การแทนที่ต่อช่อง: `channels.discord.commands.native`
- `commands.native=false` จะล้างคำสั่งเนทีฟของ Discord ที่ลงทะเบียนไว้ก่อนหน้าอย่างชัดเจน
- การอนุญาตคำสั่งเนทีฟใช้ allowlist/นโยบาย Discord เดียวกับการจัดการข้อความปกติ
- คำสั่งอาจยังมองเห็นได้ใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต; การเรียกใช้งานยังคงบังคับใช้การอนุญาตของ OpenClaw และส่งคืน "not authorized"

ดู [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งและพฤติกรรม

การตั้งค่าคำสั่ง slash เริ่มต้น:

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

    หมายเหตุ: `off` ปิดการทำเธรดตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงถูกเคารพ
    `first` จะแนบอ้างอิงการตอบกลับเนทีฟโดยนัยกับข้อความ Discord ขาออกแรกของรอบเสมอ
    `batched` จะแนบอ้างอิงการตอบกลับเนทีฟโดยนัยของ Discord เฉพาะเมื่อ
    รอบขาเข้าเป็นชุดข้อความหลายข้อความที่ถูก debounce ซึ่งมีประโยชน์
    เมื่อคุณต้องการการตอบกลับเนทีฟหลัก ๆ สำหรับแชทที่มาเป็นชุดและอาจกำกวม ไม่ใช่ทุก
    รอบข้อความเดี่ยว

    ID ข้อความจะแสดงในบริบท/ประวัติเพื่อให้เอเจนต์กำหนดเป้าหมายข้อความเฉพาะได้

  </Accordion>

  <Accordion title="พรีวิวสตรีมสด">
    OpenClaw สามารถสตรีมร่างการตอบกลับโดยส่งข้อความชั่วคราวและแก้ไขเมื่อข้อความเข้ามา `channels.discord.streaming` รับค่า `off` (ค่าเริ่มต้น) | `partial` | `block` | `progress` `progress` จะแมปเป็น `partial` บน Discord; `streamMode` เป็น alias แบบเดิมและจะถูกย้ายค่าอัตโนมัติ

    ค่าเริ่มต้นยังคงเป็น `off` เพราะการแก้ไขพรีวิวของ Discord จะชน rate limit อย่างรวดเร็วเมื่อมีบอตหรือ Gateway หลายตัวแชร์บัญชีเดียวกัน

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

    - `partial` แก้ไขข้อความพรีวิวเดียวเมื่อโทเคนเข้ามา
    - `block` ส่งชิ้นงานขนาดร่าง (ใช้ `draftChunk` เพื่อปรับขนาดและจุดแบ่ง โดยถูกจำกัดไม่เกิน `textChunkLimit`)
    - สื่อ ข้อผิดพลาด และผลลัพธ์สุดท้ายแบบตอบกลับชัดเจนจะยกเลิกการแก้ไขพรีวิวที่รอดำเนินการ
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความพรีวิวซ้ำหรือไม่

    การสตรีมพรีวิวรองรับเฉพาะข้อความเท่านั้น; การตอบกลับสื่อจะย้อนกลับไปใช้การส่งปกติ เมื่อเปิดใช้การสตรีม `block` อย่างชัดเจน OpenClaw จะข้ามสตรีมพรีวิวเพื่อหลีกเลี่ยงการสตรีมซ้ำ

  </Accordion>

  <Accordion title="ประวัติ บริบท และพฤติกรรมของเธรด">
    บริบทประวัติ Guild:

    - ค่าเริ่มต้น `channels.discord.historyLimit` คือ `20`
    - ค่าทดแทน: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    การควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    ลักษณะการทำงานของเธรด:

    - เธรด Discord จะถูกกำหนดเส้นทางเป็นเซสชันของช่องและสืบทอดการกำหนดค่าของช่องหลัก เว้นแต่จะถูกแทนที่
    - เซสชันเธรดจะสืบทอดการเลือก `/model` ระดับเซสชันของช่องหลักเป็นค่าทางเลือกสำรองเฉพาะโมเดลเท่านั้น; การเลือก `/model` ภายในเธรดยังคงมีลำดับความสำคัญกว่า และประวัติทรานสคริปต์ของช่องหลักจะไม่ถูกคัดลอก เว้นแต่เปิดใช้งานการสืบทอดทรานสคริปต์
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) เลือกให้เธรดอัตโนมัติใหม่เริ่มต้นจากทรานสคริปต์ของช่องหลัก การแทนที่ต่อบัญชีอยู่ภายใต้ `channels.discord.accounts.<id>.thread.inheritParent`
    - รีแอ็กชันของเครื่องมือข้อความสามารถแก้เป้าหมาย DM แบบ `user:<id>` ได้
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะถูกคงไว้ระหว่างทางเลือกสำรองของการเปิดใช้งานขั้นตอนตอบกลับ

    หัวข้อของช่องจะถูกแทรกเป็นบริบทที่ **ไม่น่าเชื่อถือ** รายการอนุญาตควบคุมว่าใครสามารถเรียกใช้งานเอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมทั้งหมด

  </Accordion>

  <Accordion title="เซสชันที่ผูกกับเธรดสำหรับเอเจนต์ย่อย">
    Discord สามารถผูกเธรดกับเป้าหมายเซสชันได้ เพื่อให้ข้อความติดตามผลในเธรดนั้นยังคงถูกกำหนดเส้นทางไปยังเซสชันเดียวกัน (รวมถึงเซสชันของเอเจนต์ย่อย)

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/ใหม่กับเป้าหมายเอเจนต์ย่อย/เซสชัน
    - `/unfocus` ลบการผูกของเธรดปัจจุบัน
    - `/agents` แสดงรันที่ใช้งานอยู่และสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการเลิกโฟกัสอัตโนมัติเมื่อไม่มีกิจกรรมสำหรับการผูกที่โฟกัสอยู่
    - `/session max-age <duration|off>` ตรวจสอบ/อัปเดตอายุสูงสุดแบบตายตัวสำหรับการผูกที่โฟกัสอยู่

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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    หมายเหตุ:

    - `session.threadBindings.*` ตั้งค่าเริ่มต้นส่วนกลาง
    - `channels.discord.threadBindings.*` แทนที่ลักษณะการทำงานของ Discord
    - `spawnSubagentSessions` ต้องเป็น true เพื่อสร้าง/ผูกเธรดโดยอัตโนมัติสำหรับ `sessions_spawn({ thread: true })`
    - `spawnAcpSessions` ต้องเป็น true เพื่อสร้าง/ผูกเธรดโดยอัตโนมัติสำหรับ ACP (`/acp spawn ... --thread ...` หรือ `sessions_spawn({ runtime: "acp", thread: true })`)
    - หากปิดใช้งานการผูกเธรดสำหรับบัญชีหนึ่ง `/focus` และการดำเนินการผูกเธรดที่เกี่ยวข้องจะไม่พร้อมใช้งาน

    ดู [เอเจนต์ย่อย](/th/tools/subagents), [เอเจนต์ ACP](/th/tools/acp-agents) และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="การผูกช่อง ACP แบบถาวร">
    สำหรับพื้นที่ทำงาน ACP แบบ "always-on" ที่เสถียร ให้กำหนดค่าการผูก ACP แบบมีชนิดที่ระดับบนสุดซึ่งกำหนดเป้าหมายไปยังการสนทนา Discord

    พาธการกำหนดค่า:

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

    - `/acp spawn codex --bind here` ผูกช่องหรือเธรดปัจจุบันในตำแหน่งเดิม และคงข้อความในอนาคตไว้บนเซสชัน ACP เดียวกัน ข้อความเธรดจะสืบทอดการผูกของช่องหลัก
    - ในช่องหรือเธรดที่ถูกผูกไว้ `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP เดียวกันในตำแหน่งเดิม การผูกเธรดชั่วคราวสามารถแทนที่การแก้เป้าหมายได้ขณะใช้งานอยู่
    - `spawnAcpSessions` จำเป็นเฉพาะเมื่อ OpenClaw ต้องสร้าง/ผูกเธรดย่อยผ่าน `--thread auto|here`

    ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับรายละเอียดลักษณะการทำงานของการผูก

  </Accordion>

  <Accordion title="การแจ้งเตือนรีแอ็กชัน">
    โหมดการแจ้งเตือนรีแอ็กชันต่อกิลด์:

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
    - อีโมจิสำรองของตัวตนเอเจนต์ (`agents.list[].identity.emoji` ไม่เช่นนั้นใช้ "👀")

    หมายเหตุ:

    - Discord รองรับอีโมจิ unicode หรือชื่ออีโมจิแบบกำหนดเอง
    - ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับช่องหรือบัญชี

  </Accordion>

  <Accordion title="การเขียนการกำหนดค่า">
    การเขียนการกำหนดค่าที่เริ่มจากช่องเปิดใช้งานตามค่าเริ่มต้น

    สิ่งนี้มีผลกับโฟลว์ `/config set|unset` (เมื่อเปิดใช้งานฟีเจอร์คำสั่ง)

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
    กำหนดเส้นทางทราฟฟิก WebSocket ของ Discord gateway และการค้นหา REST ตอนเริ่มต้น (application ID + การแก้รายการอนุญาต) ผ่านพร็อกซี HTTP(S) ด้วย `channels.discord.proxy`

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
    เปิดใช้งานการแก้ค่า PluralKit เพื่อแมปข้อความที่พร็อกซีไปยังตัวตนสมาชิกของระบบ:

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
    - ชื่อที่แสดงของสมาชิกจะถูกจับคู่ด้วยชื่อ/slug เท่านั้นเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การค้นหาใช้ ID ข้อความต้นฉบับและถูกจำกัดด้วยกรอบเวลา
    - หากการค้นหาล้มเหลว ข้อความที่พร็อกซีจะถูกถือว่าเป็นข้อความบอทและถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="การกำหนดค่าสถานะ Presence">
    การอัปเดต Presence จะถูกนำไปใช้เมื่อคุณตั้งค่าฟิลด์สถานะหรือกิจกรรม หรือเมื่อคุณเปิดใช้งาน Presence อัตโนมัติ

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

    แผนที่ชนิดกิจกรรม:

    - 0: กำลังเล่น
    - 1: กำลังสตรีม (ต้องมี `activityUrl`)
    - 2: กำลังฟัง
    - 3: กำลังดู
    - 4: กำหนดเอง (ใช้ข้อความกิจกรรมเป็นสถานะ; อีโมจิไม่บังคับ)
    - 5: กำลังแข่งขัน

    ตัวอย่าง Presence อัตโนมัติ (สัญญาณสุขภาพรันไทม์):

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

    Presence อัตโนมัติแมปความพร้อมใช้งานของรันไทม์ไปยังสถานะ Discord: healthy => online, degraded หรือ unknown => idle, exhausted หรือ unavailable => dnd ข้อความแทนที่ที่ไม่บังคับ:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับตัวแทนที่ `{reason}`)

  </Accordion>

  <Accordion title="การอนุมัติใน Discord">
    Discord รองรับการจัดการการอนุมัติด้วยปุ่มใน DM และสามารถเลือกโพสต์พรอมป์การอนุมัติในช่องต้นทางได้

    พาธการกำหนดค่า:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; ถอยกลับไปใช้ `commands.ownerAllowFrom` เมื่อทำได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord เปิดใช้งานการอนุมัติ exec แบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และสามารถแก้ค่าผู้อนุมัติได้อย่างน้อยหนึ่งคน ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมานผู้อนุมัติ exec จาก `allowFrom` ของช่อง, `dm.allowFrom` เดิม หรือ `defaultTo` ของข้อความโดยตรง ตั้งค่า `enabled: false` เพื่อปิดใช้งาน Discord เป็นไคลเอนต์การอนุมัติแบบเนทีฟอย่างชัดเจน

    สำหรับคำสั่งกลุ่มที่ละเอียดอ่อนเฉพาะเจ้าของ เช่น `/diagnostics` และ `/export-trajectory` OpenClaw จะส่งพรอมป์การอนุมัติและผลลัพธ์สุดท้ายแบบส่วนตัว โดยจะลอง DM ของ Discord ก่อนเมื่อเจ้าของที่เรียกใช้งานมีเส้นทางเจ้าของของ Discord; หากไม่มี จะถอยกลับไปใช้เส้นทางเจ้าของแรกที่พร้อมใช้งานจาก `commands.ownerAllowFrom` เช่น Telegram

    เมื่อ `target` เป็น `channel` หรือ `both` พรอมป์การอนุมัติจะปรากฏในช่อง เฉพาะผู้อนุมัติที่แก้ค่าแล้วเท่านั้นที่ใช้ปุ่มได้; ผู้ใช้อื่นจะได้รับการปฏิเสธแบบชั่วคราว พรอมป์การอนุมัติจะรวมข้อความคำสั่งไว้ด้วย ดังนั้นให้เปิดใช้งานการส่งไปยังช่องเฉพาะในช่องที่เชื่อถือได้เท่านั้น หากไม่สามารถดึง ID ช่องจากคีย์เซสชันได้ OpenClaw จะถอยกลับไปส่งผ่าน DM

    Discord ยังเรนเดอร์ปุ่มการอนุมัติที่ใช้ร่วมกันโดยช่องแชตอื่นด้วย อะแดปเตอร์ Discord แบบเนทีฟจะเพิ่มการกำหนดเส้นทาง DM ของผู้อนุมัติและการกระจายไปยังช่องเป็นหลัก
    เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก; OpenClaw
    ควรรวมคำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์เครื่องมือระบุว่า
    การอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียว
    หากรันไทม์การอนุมัติแบบเนทีฟของ Discord ไม่ได้ทำงานอยู่ OpenClaw จะคงพรอมป์
    `/approve <id> <decision>` แบบกำหนดตายตัวภายในเครื่องให้มองเห็นได้ หากรันไทม์
    ทำงานอยู่แต่ไม่สามารถส่งการ์ดแบบเนทีฟไปยังเป้าหมายใดได้
    OpenClaw จะส่งประกาศทางเลือกสำรองในแชตเดียวกันพร้อมคำสั่ง `/approve`
    ที่ตรงจากการอนุมัติที่รอดำเนินการ

    การยืนยันตัวตน Gateway และการแก้การอนุมัติเป็นไปตามสัญญาไคลเอนต์ Gateway ที่ใช้ร่วมกัน (ID แบบ `plugin:` แก้ผ่าน `plugin.approval.resolve`; ID อื่นแก้ผ่าน `exec.approval.resolve`) การอนุมัติหมดอายุหลังจาก 30 นาทีตามค่าเริ่มต้น

    ดู [การอนุมัติ Exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและเกตการดำเนินการ

การดำเนินการข้อความ Discord รวมถึงการรับส่งข้อความ การดูแลช่อง การกลั่นกรอง Presence และการดำเนินการเมทาดาทา

ตัวอย่างหลัก:

- การรับส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- รีแอ็กชัน: `react`, `reactions`, `emojiList`
- การกลั่นกรอง: `timeout`, `kick`, `ban`
- Presence: `setPresence`

การดำเนินการ `event-create` รับพารามิเตอร์ `image` ที่ไม่บังคับ (URL หรือพาธไฟล์ภายในเครื่อง) เพื่อตั้งค่าภาพหน้าปกของเหตุการณ์ตามกำหนดการ

เกตการดำเนินการอยู่ภายใต้ `channels.discord.actions.*`

ลักษณะการทำงานเริ่มต้นของเกต:

| กลุ่มการดำเนินการ                                                                                                                                                             | ค่าเริ่มต้น  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้งาน  |
| roles                                                                                                                                                                    | ปิดใช้งาน |
| moderation                                                                                                                                                               | ปิดใช้งาน |
| presence                                                                                                                                                                 | ปิดใช้งาน |

## UI Components v2

OpenClaw ใช้ Discord components v2 สำหรับการอนุมัติ exec และตัวทำเครื่องหมายข้ามบริบท การดำเนินการกับข้อความ Discord ยังสามารถรับ `components` สำหรับ UI แบบกำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้าง payload ของ component ผ่านเครื่องมือ discord) ขณะที่ `embeds` แบบเดิมยังคงใช้ได้แต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นที่ใช้โดยคอนเทนเนอร์ component ของ Discord (hex)
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

Discord มีพื้นผิวเสียงที่แตกต่างกันสองแบบ: **ช่องเสียง** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบตัวอย่างคลื่นเสียง) Gateway รองรับทั้งสองแบบ

### ช่องเสียง

รายการตรวจสอบการตั้งค่า:

1. เปิดใช้งาน Message Content Intent ใน Discord Developer Portal
2. เปิดใช้งาน Server Members Intent เมื่อใช้รายการอนุญาตตามบทบาท/ผู้ใช้
3. เชิญบอทด้วยขอบเขต `bot` และ `applications.commands`
4. ให้สิทธิ์ Connect, Speak, Send Messages และ Read Message History ในช่องเสียงเป้าหมาย
5. เปิดใช้งานคำสั่ง native (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งนี้ใช้ agent เริ่มต้นของบัญชีและทำตามกฎรายการอนุญาตและนโยบายกลุ่มเดียวกับคำสั่ง Discord อื่นๆ

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

- `voice.tts` แทนที่ `messages.tts` สำหรับการเล่นเสียงเท่านั้น
- `voice.model` แทนที่ LLM ที่ใช้สำหรับการตอบกลับช่องเสียง Discord เท่านั้น ปล่อยว่างไว้เพื่อสืบทอดโมเดล agent ที่ถูกกำหนดเส้นทาง
- STT ใช้ `tools.media.audio`; `voice.model` ไม่มีผลต่อการถอดเสียง
- เทิร์นทรานสคริปต์เสียงได้สถานะเจ้าของจาก Discord `allowFrom` (หรือ `dm.allowFrom`); ผู้พูดที่ไม่ใช่เจ้าของไม่สามารถเข้าถึงเครื่องมือเฉพาะเจ้าของได้ (เช่น `gateway` และ `cron`)
- เสียงเปิดใช้งานโดยค่าเริ่มต้น; ตั้งค่า `channels.discord.voice.enabled=false` เพื่อปิดใช้งานรันไทม์เสียงและ Gateway intent `GuildVoiceStates`
- `channels.discord.intents.voiceStates` สามารถแทนที่การสมัครรับ intent สถานะเสียงได้อย่างชัดเจน ปล่อยว่างไว้เพื่อให้ intent ทำตาม `voice.enabled`
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือก join ของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- OpenClaw ยังเฝ้าดูความล้มเหลวในการถอดรหัสขาเข้าและกู้คืนอัตโนมัติโดยออกจากช่องเสียงแล้วเข้าร่วมใหม่หลังเกิดความล้มเหลวซ้ำๆ ในช่วงเวลาสั้นๆ
- หากบันทึกขาเข้าแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำๆ หลังอัปเดต ให้รวบรวมรายงาน dependency และบันทึก บรรทัด `@discordjs/voice` ที่รวมมาแล้วมีการแก้ไข padding จาก upstream ใน discord.js PR #11449 ซึ่งปิด discord.js issue #11419

ไปป์ไลน์ช่องเสียง:

- การจับ Discord PCM ถูกแปลงเป็นไฟล์ WAV ชั่วคราว
- `tools.media.audio` จัดการ STT เช่น `openai/gpt-4o-mini-transcribe`
- ทรานสคริปต์ถูกส่งผ่าน ingress และการกำหนดเส้นทาง Discord ปกติ
- เมื่อกำหนด `voice.model` จะแทนที่เฉพาะ LLM สำหรับการตอบกลับของเทิร์นช่องเสียงนี้
- `voice.tts` ถูกผสานทับ `messages.tts`; เสียงที่ได้จะถูกเล่นในช่องที่เข้าร่วมอยู่

ข้อมูลประจำตัวถูก resolve แยกตาม component: auth ของเส้นทาง LLM สำหรับ `voice.model`, auth ของ STT สำหรับ `tools.media.audio` และ auth ของ TTS สำหรับ `messages.tts`/`voice.tts`

### ข้อความเสียง

ข้อความเสียง Discord แสดงตัวอย่างคลื่นเสียงและต้องใช้เสียง OGG/Opus OpenClaw สร้างคลื่นเสียงให้อัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ Gateway เพื่อตรวจสอบและแปลง

- ระบุ **พาธไฟล์ในเครื่อง** (URL จะถูกปฏิเสธ)
- ละเว้นเนื้อหาข้อความ (Discord ปฏิเสธข้อความ + ข้อความเสียงใน payload เดียวกัน)
- ยอมรับรูปแบบเสียงใดก็ได้; OpenClaw จะแปลงเป็น OGG/Opus ตามต้องการ

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - เปิดใช้งาน Message Content Intent
    - เปิดใช้งาน Server Members Intent เมื่อคุณพึ่งพาการ resolve ผู้ใช้/สมาชิก
    - รีสตาร์ท Gateway หลังเปลี่ยน intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบรายการอนุญาต guild ภายใต้ `channels.discord.guilds`
    - หากมี map `channels` ของ guild จะอนุญาตเฉพาะช่องที่ระบุไว้เท่านั้น
    - ตรวจสอบพฤติกรรม `requireMention` และรูปแบบ mention

    การตรวจสอบที่มีประโยชน์:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    สาเหตุทั่วไป:

    - `groupPolicy="allowlist"` โดยไม่มีรายการอนุญาต guild/channel ที่ตรงกัน
    - กำหนดค่า `requireMention` ผิดตำแหน่ง (ต้องอยู่ภายใต้ `channels.discord.guilds` หรือรายการช่อง)
    - ผู้ส่งถูกบล็อกโดยรายการอนุญาต `users` ของ guild/channel

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    บันทึกทั่วไป:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    ปุ่มปรับแต่งคิว Discord Gateway:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ค่านี้ควบคุมเฉพาะงาน listener ของ Discord Gateway ไม่ใช่อายุเทิร์นของ agent

    Discord ไม่ใช้ timeout ที่ช่องเป็นเจ้าของกับเทิร์น agent ที่อยู่ในคิว listener ข้อความส่งต่อทันที และการรัน Discord ที่อยู่ในคิวจะรักษาลำดับต่อเซสชันจนกว่า lifecycle ของเซสชัน/เครื่องมือ/รันไทม์จะเสร็จสิ้นหรือยกเลิกงาน

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
    OpenClaw ดึง metadata Discord `/gateway/bot` ก่อนเชื่อมต่อ ความล้มเหลวชั่วคราวจะ fallback ไปยัง URL Gateway เริ่มต้นของ Discord และถูกจำกัดอัตราในบันทึก

    ปุ่มปรับแต่ง timeout ของ metadata:

    - บัญชีเดียว: `channels.discord.gatewayInfoTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env fallback เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - ค่าเริ่มต้น: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    การตรวจสอบสิทธิ์ `channels status --probe` ใช้ได้เฉพาะกับ ID ช่องแบบตัวเลขเท่านั้น

    หากคุณใช้คีย์ slug การจับคู่ขณะรันไทม์ยังคงทำงานได้ แต่ probe ไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน

  </Accordion>

  <Accordion title="DM and pairing issues">

    - ปิดใช้งาน DM: `channels.discord.dm.enabled=false`
    - ปิดใช้งานนโยบาย DM: `channels.discord.dmPolicy="disabled"` (เดิม: `channels.discord.dm.policy`)
    - กำลังรอการอนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    โดยค่าเริ่มต้น ข้อความที่บอทสร้างจะถูกละเว้น

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎ mention และรายการอนุญาตที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมวนลูป
    แนะนำให้ใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความจากบอทที่ mention บอทเท่านั้น

  </Accordion>

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - ทำให้ OpenClaw เป็นเวอร์ชันปัจจุบัน (`openclaw update`) เพื่อให้มีตรรกะกู้คืนการรับเสียง Discord
    - ยืนยัน `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้น upstream) และปรับเฉพาะเมื่อจำเป็น
    - ดูบันทึกสำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากความล้มเหลวยังคงดำเนินต่อหลังเข้าร่วมใหม่อัตโนมัติ ให้รวบรวมบันทึกและเปรียบเทียบกับประวัติการรับ DAVE upstream ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Discord](/th/gateway/config-channels#discord)

<Accordion title="High-signal Discord fields">

- การเริ่มต้น/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- นโยบาย: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- คำสั่ง: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- คิวเหตุการณ์: `eventQueue.listenerTimeout` (งบเวลา listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- metadata ของ Gateway: `gatewayInfoTimeoutMs`
- การตอบกลับ/ประวัติ: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- การสตรีม: `streaming` (alias เดิม: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- สื่อ/การลองใหม่: `mediaMaxMb` (จำกัดการอัปโหลด Discord ขาออก ค่าเริ่มต้น `100MB`), `retry`
- การดำเนินการ: `actions.*`
- สถานะออนไลน์: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ฟีเจอร์: `threadBindings`, `bindings[]` ระดับบนสุด (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการดำเนินงาน

- ปฏิบัติกับโทเค็นบอทเหมือนเป็นความลับ (แนะนำ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการควบคุมดูแล)
- ให้สิทธิ์ Discord เท่าที่จำเป็นน้อยที่สุด
- หากสถานะ deploy/state ของคำสั่งล้าสมัย ให้รีสตาร์ท Gateway และตรวจสอบซ้ำด้วย `openclaw channels status --probe`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Discord กับ Gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    ลักษณะการทำงานของแชทกลุ่มและรายการอนุญาต
  </Card>
  <Card title="การกำหนดเส้นทางช่องทาง" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    แบบจำลองภัยคุกคามและการเสริมความแข็งแกร่ง
  </Card>
  <Card title="การกำหนดเส้นทางหลายเอเจนต์" icon="sitemap" href="/th/concepts/multi-agent">
    จับคู่กิลด์และช่องทางกับเอเจนต์
  </Card>
  <Card title="คำสั่งสแลช" icon="terminal" href="/th/tools/slash-commands">
    ลักษณะการทำงานของคำสั่งแบบเนทีฟ
  </Card>
</CardGroup>
