---
read_when:
    - กำลังทำงานกับฟีเจอร์ช่องทาง Discord
summary: สถานะการรองรับบอต Discord ความสามารถ และการกำหนดค่า
title: Discord
x-i18n:
    generated_at: "2026-07-03T02:57:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e8724b02baa1a2dba1ac932e20533c9293b6021f30b1a79107349c34f195e5
    source_path: channels/discord.md
    workflow: 16
---

พร้อมใช้งานสำหรับ DM และช่องกิลด์ผ่าน Discord gateway อย่างเป็นทางการ

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    Discord DM ใช้โหมดจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยและโฟลว์ซ่อมแซมข้ามช่องทาง
  </Card>
</CardGroup>

## การตั้งค่าแบบรวดเร็ว

คุณจะต้องสร้างแอปพลิเคชันใหม่พร้อมบอท เพิ่มบอทเข้าเซิร์ฟเวอร์ของคุณ และจับคู่กับ OpenClaw เราแนะนำให้เพิ่มบอทของคุณเข้าเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากยังไม่มี ให้[สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="Create a Discord application and bot">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อประมาณว่า "OpenClaw"

    คลิก **Bot** บนแถบด้านข้าง ตั้งค่า **Username** เป็นชื่อที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="Enable privileged intents">
    ยังอยู่ที่หน้า **Bot** ให้เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับรายการอนุญาตตามบทบาทและการจับคู่ชื่อกับ ID)
    - **Presence Intent** (ไม่บังคับ; จำเป็นเฉพาะสำหรับการอัปเดตสถานะ presence)

  </Step>

  <Step title="Copy your bot token">
    เลื่อนกลับขึ้นไปที่หน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อจะเป็นแบบนั้น แต่การทำงานนี้สร้างโทเค็นแรกของคุณ ไม่มีอะไรถูก "รีเซ็ต"
    </Note>

    คัดลอกโทเค็นและบันทึกไว้ที่ใดที่หนึ่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในอีกไม่นาน

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    คลิก **OAuth2** บนแถบด้านข้าง คุณจะสร้าง URL เชิญพร้อมสิทธิ์ที่ถูกต้องเพื่อเพิ่มบอทเข้าเซิร์ฟเวอร์ของคุณ

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

    นี่คือชุดพื้นฐานสำหรับช่องข้อความปกติ หากคุณวางแผนจะโพสต์ในเธรด Discord รวมถึงเวิร์กโฟลว์ช่องฟอรัมหรือสื่อที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้ **Send Messages in Threads** ด้วย
    คัดลอก URL ที่สร้างไว้ด้านล่าง วางลงในเบราว์เซอร์ของคุณ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอทของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    กลับไปที่แอป Discord คุณต้องเปิดใช้ Developer Mode เพื่อให้คัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนเฟืองข้างอวาตาร์ของคุณ) → เลื่อนไปที่ **Developer** ในแถบด้านข้าง → เปิด **Developer Mode**

        *(หมายเหตุ: ในแอป Discord บนมือถือ Developer Mode อยู่ใต้ **App Settings** → **Advanced**)*

    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ของคุณไว้พร้อมกับ Bot Token คุณจะส่งทั้งสามรายการให้ OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="Allow DMs from server members">
    เพื่อให้การจับคู่ทำงานได้ Discord ต้องอนุญาตให้บอทของคุณส่ง DM ถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณ → **Privacy Settings** → เปิด **Direct Messages**

    สิ่งนี้ช่วยให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอท) ส่ง DM ถึงคุณได้ เปิดใช้งานค่านี้ไว้หากคุณต้องการใช้ Discord DM กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่องกิลด์ คุณสามารถปิด DM หลังจับคู่แล้วได้

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
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

    หาก OpenClaw รันเป็นบริการเบื้องหลังอยู่แล้ว ให้รีสตาร์ทผ่านแอป OpenClaw Mac หรือหยุดแล้วเริ่มกระบวนการ `openclaw gateway run` ใหม่
    สำหรับการติดตั้งแบบบริการที่มีการจัดการ ให้รัน `openclaw gateway install` จากเชลล์ที่มี `DISCORD_BOT_TOKEN` อยู่ หรือเก็บตัวแปรไว้ใน `~/.openclaw/.env` เพื่อให้บริการ resolve env SecretRef ได้หลังรีสตาร์ท
    หากโฮสต์ของคุณถูกบล็อกหรือถูกจำกัดอัตราโดยการค้นหาแอปพลิเคชันตอนเริ่มต้นของ Discord ให้ตั้งค่า ID แอปพลิเคชัน/ไคลเอนต์ Discord จาก Developer Portal เพื่อให้การเริ่มต้นข้ามการเรียก REST นั้นได้ ใช้ `channels.discord.applicationId` สำหรับบัญชีเริ่มต้น หรือ `channels.discord.accounts.<accountId>.applicationId` เมื่อคุณรันบอท Discord หลายตัว

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        แชทกับเอเจนต์ OpenClaw ของคุณบนช่องทางที่มีอยู่ใดก็ได้ (เช่น Telegram) แล้วบอกเอเจนต์ หาก Discord เป็นช่องทางแรกของคุณ ให้ใช้แท็บ CLI / config แทน

        > "ฉันตั้งค่าโทเค็นบอท Discord ใน config แล้ว โปรดตั้งค่า Discord ให้เสร็จด้วย User ID `<user_id>` และ Server ID `<server_id>`"
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

        สำหรับการตั้งค่าแบบสคริปต์หรือระยะไกล ให้เขียนบล็อก JSON5 เดียวกันด้วย `openclaw config patch --file ./discord.patch.json5 --dry-run` แล้วรันซ้ำโดยไม่มี `--dry-run` รองรับค่า `token` แบบ plaintext และรองรับค่า SecretRef สำหรับ `channels.discord.token` ผ่านผู้ให้บริการ env/file/exec ด้วย ดู [การจัดการความลับ](/th/gateway/secrets)

        สำหรับบอท Discord หลายตัว ให้เก็บโทเค็นบอทและ ID แอปพลิเคชันของแต่ละตัวไว้ใต้บัญชีของตัวเอง `channels.discord.applicationId` ระดับบนสุดจะถูกสืบทอดโดยบัญชี ดังนั้นให้ตั้งไว้ที่นั่นเฉพาะเมื่อทุกบัญชีควรใช้ ID แอปพลิเคชันเดียวกัน

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
    รอจนกว่า gateway จะรันอยู่ จากนั้นส่ง DM ถึงบอทของคุณใน Discord บอทจะตอบกลับด้วยรหัสจับคู่

    <Tabs>
      <Tab title="Ask your agent">
        ส่งรหัสจับคู่ให้เอเจนต์ของคุณบนช่องทางที่มีอยู่:

        > "อนุมัติรหัสจับคู่ Discord นี้: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    รหัสจับคู่หมดอายุหลัง 1 ชั่วโมง

    ตอนนี้คุณควรแชทกับเอเจนต์ของคุณใน Discord ผ่าน DM ได้แล้ว

  </Step>
</Steps>

<Note>
การ resolve โทเค็นรับรู้บัญชี ค่าโทเค็นใน config ชนะ env fallback `DISCORD_BOT_TOKEN` ใช้เฉพาะสำหรับบัญชีเริ่มต้นเท่านั้น
หากบัญชี Discord ที่เปิดใช้งานสองบัญชี resolve เป็นโทเค็นบอทเดียวกัน OpenClaw จะเริ่มตัวมอนิเตอร์ gateway เพียงตัวเดียวสำหรับโทเค็นนั้น โทเค็นจาก config ชนะ env fallback เริ่มต้น มิฉะนั้นบัญชีที่เปิดใช้งานบัญชีแรกจะชนะ และบัญชีซ้ำจะถูกรายงานว่าปิดใช้งาน
สำหรับการเรียกขาออกขั้นสูง (เครื่องมือข้อความ/การกระทำของช่องทาง) จะใช้ `token` แบบระบุชัดต่อการเรียกสำหรับการเรียกนั้น สิ่งนี้ใช้กับการกระทำแบบส่งและอ่าน/probe (เช่น read/search/fetch/thread/pins/permissions) การตั้งค่านโยบายบัญชี/การลองซ้ำยังคงมาจากบัญชีที่เลือกในสแนปช็อต runtime ที่ใช้งานอยู่
</Note>

## แนะนำ: ตั้งค่าพื้นที่ทำงานกิลด์

เมื่อ DM ทำงานแล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็นพื้นที่ทำงานเต็มรูปแบบที่แต่ละช่องมีเซสชันเอเจนต์ของตัวเองพร้อมบริบทของตัวเอง แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีเพียงคุณและบอทของคุณ

<Steps>
  <Step title="Add your server to the guild allowlist">
    สิ่งนี้ทำให้เอเจนต์ของคุณตอบกลับได้ในทุกช่องบนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ DM

    <Tabs>
      <Tab title="Ask your agent">
        > "เพิ่ม Discord Server ID `<server_id>` ของฉันเข้าในรายการอนุญาตของกิลด์"
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
    โดยค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในช่องกิลด์เฉพาะเมื่อถูก @mentioned สำหรับเซิร์ฟเวอร์ส่วนตัว คุณอาจต้องการให้เอเจนต์ตอบกลับทุกข้อความ

    ในช่องกิลด์ การตอบกลับปกติจะโพสต์โดยอัตโนมัติตามค่าเริ่มต้น สำหรับห้องที่แชร์และเปิดตลอดเวลา ให้เลือกใช้ `messages.groupChat.visibleReplies: "message_tool"` เพื่อให้เอเจนต์เฝ้าดูอย่างเงียบ ๆ และโพสต์เฉพาะเมื่อมันตัดสินว่าการตอบกลับในช่องมีประโยชน์ วิธีนี้ทำงานได้ดีที่สุดกับโมเดลรุ่นล่าสุดที่เชื่อถือการใช้เครื่องมือได้ เช่น GPT 5.5 เหตุการณ์ห้องแบบ ambient จะเงียบไว้เว้นแต่เครื่องมือจะส่ง ดู [เหตุการณ์ห้องแบบ ambient](/th/channels/ambient-room-events) สำหรับ config โหมดเฝ้าดูฉบับเต็ม

    หาก Discord แสดงการพิมพ์และล็อกแสดงการใช้โทเค็นแต่ไม่มีข้อความที่โพสต์ ให้ตรวจสอบว่า turn ถูกกำหนดค่าเป็นเหตุการณ์ห้องแบบ ambient หรือเลือกใช้การตอบกลับที่มองเห็นได้ผ่าน message-tool หรือไม่

    <Tabs>
      <Tab title="Ask your agent">
        > "อนุญาตให้เอเจนต์ของฉันตอบกลับบนเซิร์ฟเวอร์นี้ได้โดยไม่ต้องถูก @mentioned"
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

        หากต้องการบังคับให้ส่งผ่าน message-tool สำหรับการตอบกลับกลุ่ม/ช่องทางที่มองเห็นได้ ให้ตั้งค่า `messages.groupChat.visibleReplies: "message_tool"`

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    โดยค่าเริ่มต้น หน่วยความจำระยะยาว (MEMORY.md) จะโหลดเฉพาะในเซสชัน DM ช่องกิลด์จะไม่โหลด MEMORY.md โดยอัตโนมัติ

    <Tabs>
      <Tab title="Ask your agent">
        > "เมื่อฉันถามคำถามในช่อง Discord ให้ใช้ memory_search หรือ memory_get หากคุณต้องการบริบทระยะยาวจาก MEMORY.md"
      </Tab>
      <Tab title="Manual">
        หากคุณต้องการบริบทที่แชร์ในทุกช่อง ให้ใส่คำสั่งที่เสถียรไว้ใน `AGENTS.md` หรือ `USER.md` (เอกสารเหล่านี้จะถูกฉีดเข้าไปในทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงเมื่อต้องการด้วยเครื่องมือหน่วยความจำ
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างช่องบางช่องบนเซิร์ฟเวอร์ Discord ของคุณและเริ่มแชท เอเจนต์ของคุณเห็นชื่อช่องได้ และแต่ละช่องจะมีเซสชันแยกของตัวเอง ดังนั้นคุณสามารถตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ตามที่เหมาะกับเวิร์กโฟลว์ของคุณได้

## โมเดล runtime

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord
- การกำหนดเส้นทางการตอบกลับเป็นแบบกำหนดแน่นอน: การตอบกลับขาเข้าจาก Discord จะกลับไปที่ Discord
- เมทาดาทาของกิลด์/ช่อง Discord จะถูกเพิ่มเข้าไปในพรอมป์ของโมเดลเป็นบริบทที่ไม่น่าเชื่อถือ
  ไม่ใช่เป็นคำนำหน้าการตอบกลับที่ผู้ใช้มองเห็น หากโมเดลคัดลอกซองข้อมูลนั้น
  กลับมา OpenClaw จะลบเมทาดาทาที่ถูกคัดลอกจากการตอบกลับขาออกและจาก
  บริบทการเล่นซ้ำในอนาคต
- โดยค่าเริ่มต้น (`session.dmScope=main`) แชทโดยตรงจะแชร์เซสชันหลักของ agent (`agent:main:main`)
- ช่องกิลด์เป็นคีย์เซสชันที่แยกกัน (`agent:<agentId>:discord:channel:<channelId>`)
- Group DM จะถูกละเว้นโดยค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่ง slash แบบเนทีฟจะทำงานในเซสชันคำสั่งที่แยกกัน (`agent:<agentId>:discord:slash:<userId>`) โดยยังคงพก `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่ถูกกำหนดเส้นทาง
- การส่งประกาศแบบข้อความเท่านั้นของ Cron/Heartbeat ไปยัง Discord ใช้คำตอบสุดท้าย
  ที่ assistant มองเห็นเพียงครั้งเดียว เพย์โหลดสื่อและคอมโพเนนต์แบบมีโครงสร้างยังคงเป็น
  หลายข้อความเมื่อ agent ส่งเพย์โหลดที่ส่งมอบได้หลายรายการ

## ช่องฟอรัม

ช่องฟอรัมและช่องสื่อของ Discord รับเฉพาะโพสต์เธรดเท่านั้น OpenClaw รองรับสองวิธีในการสร้างเธรดเหล่านี้:

- ส่งข้อความไปยังฟอรัมพาเรนต์ (`channel:<forumId>`) เพื่อสร้างเธรดโดยอัตโนมัติ ชื่อเธรดจะใช้บรรทัดแรกที่ไม่ว่างของข้อความของคุณ
- ใช้ `openclaw message thread create` เพื่อสร้างเธรดโดยตรง อย่าส่ง `--message-id` สำหรับช่องฟอรัม

ตัวอย่าง: ส่งไปยังฟอรัมพาเรนต์เพื่อสร้างเธรด

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

ตัวอย่าง: สร้างเธรดฟอรัมอย่างชัดเจน

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

ฟอรัมพาเรนต์ไม่รับคอมโพเนนต์ Discord หากคุณต้องการคอมโพเนนต์ ให้ส่งไปยังเธรดนั้นเอง (`channel:<threadId>`)

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับคอนเทนเนอร์คอมโพเนนต์ Discord v2 สำหรับข้อความของ agent ใช้เครื่องมือข้อความพร้อมเพย์โหลด `components` ผลลัพธ์การโต้ตอบจะถูกกำหนดเส้นทางกลับไปยัง agent เป็นข้อความขาเข้าปกติ และทำตามการตั้งค่า Discord `replyToMode` ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถวการกระทำอนุญาตให้มีปุ่มได้สูงสุด 5 ปุ่ม หรือเมนูเลือกเดียว
- ประเภทการเลือก: `string`, `user`, `role`, `mentionable`, `channel`

โดยค่าเริ่มต้น คอมโพเนนต์ใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่อให้ปุ่ม รายการเลือก และฟอร์มสามารถใช้ได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดว่าใครสามารถคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (ID ผู้ใช้ Discord, แท็ก หรือ `*`) เมื่อกำหนดค่าแล้ว ผู้ใช้ที่ไม่ตรงกันจะได้รับการปฏิเสธแบบ ephemeral

Callback ของคอมโพเนนต์จะหมดอายุหลังจาก 30 นาทีโดยค่าเริ่มต้น ตั้งค่า `channels.discord.agentComponents.ttlMs` เพื่อเปลี่ยนอายุการใช้งานของรีจิสทรี callback นั้นสำหรับบัญชี Discord เริ่มต้น หรือ `channels.discord.accounts.<accountId>.agentComponents.ttlMs` เพื่อเขียนทับบัญชีหนึ่งในการตั้งค่าหลายบัญชี ค่านี้เป็นมิลลิวินาที ต้องเป็นจำนวนเต็มบวก และถูกจำกัดไว้ที่ `86400000` (24 ชั่วโมง) TTL ที่ยาวขึ้นมีประโยชน์สำหรับเวิร์กโฟลว์รีวิวหรืออนุมัติที่ต้องให้ปุ่มยังใช้งานได้ แต่ก็ขยายช่วงเวลาที่ข้อความ Discord เก่ายังสามารถทริกเกอร์การกระทำได้เช่นกัน ควรใช้ TTL ที่สั้นที่สุดที่เหมาะกับเวิร์กโฟลว์ และคงค่าเริ่มต้นไว้เมื่อ callback ที่ค้างเก่าอาจทำให้ประหลาดใจ

คำสั่ง slash `/model` และ `/models` จะเปิดตัวเลือกโมเดลแบบโต้ตอบ พร้อมดรอปดาวน์ผู้ให้บริการ โมเดล และ runtime ที่เข้ากันได้ รวมถึงขั้นตอน Submit `/models add` เลิกใช้แล้ว และตอนนี้จะส่งคืนข้อความแจ้งการเลิกใช้แทนการลงทะเบียนโมเดลจากแชท การตอบกลับของตัวเลือกเป็นแบบ ephemeral และมีเพียงผู้ใช้ที่เรียกใช้เท่านั้นที่สามารถใช้ได้ เมนูเลือกของ Discord จำกัดไว้ที่ 25 ตัวเลือก ดังนั้นให้เพิ่มรายการ `provider/*` ไปยัง `agents.defaults.models` เมื่อคุณต้องการให้ตัวเลือกแสดงโมเดลที่ค้นพบแบบไดนามิกเฉพาะสำหรับผู้ให้บริการที่เลือก เช่น `openai` หรือ `vllm`

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
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM `channels.discord.allowFrom` คือ allowlist ของ DM ตามรูปแบบมาตรฐาน

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.discord.allowFrom` รวม `"*"`)
    - `disabled`

    หากนโยบาย DM ไม่ใช่ open ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือได้รับแจ้งให้จับคู่ในโหมด `pairing`)

    ลำดับความสำคัญของหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - สำหรับบัญชีเดียว `allowFrom` มีลำดับความสำคัญเหนือ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อ `allowFrom` ของตนเองและ `dm.allowFrom` แบบเดิมไม่ได้ตั้งค่า
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    `channels.discord.dm.policy` และ `channels.discord.dm.allowFrom` แบบเดิมยังคงอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การ mention `<@id>`

    ID ตัวเลขเปล่าโดยปกติจะ resolve เป็น ID ช่องเมื่อมีค่าเริ่มต้นของช่องทำงานอยู่ แต่ ID ที่อยู่ใน DM `allowFrom` ที่มีผลของบัญชีจะถูกถือเป็นเป้าหมาย DM ของผู้ใช้เพื่อความเข้ากันได้

  </Tab>

  <Tab title="Access groups">
    DM ของ Discord และการอนุญาตคำสั่งข้อความสามารถใช้รายการ `accessGroup:<name>` แบบไดนามิกใน `channels.discord.allowFrom`

    ชื่อกลุ่มการเข้าถึงแชร์ร่วมกันข้ามช่องข้อความ ใช้ `type: "message.senders"` สำหรับกลุ่มแบบคงที่ที่สมาชิกแสดงด้วยไวยากรณ์ `allowFrom` ปกติของแต่ละช่อง หรือ `type: "discord.channelAudience"` เมื่อผู้ชม `ViewChannel` ปัจจุบันของช่อง Discord ควรกำหนดสมาชิกแบบไดนามิก พฤติกรรมกลุ่มการเข้าถึงที่แชร์กันมีเอกสารที่นี่: [กลุ่มการเข้าถึง](/th/channels/access-groups)

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

    ช่องข้อความ Discord ไม่มีรายการสมาชิกแยกต่างหาก `type: "discord.channelAudience"` จำลองสมาชิกเป็น: ผู้ส่ง DM เป็นสมาชิกของกิลด์ที่กำหนดค่าไว้ และปัจจุบันมีสิทธิ์ `ViewChannel` ที่มีผลบนช่องที่กำหนดค่าไว้หลังจากใช้การเขียนทับบทบาทและช่องแล้ว

    ตัวอย่าง: อนุญาตให้ทุกคนที่เห็น `#maintainers` สามารถ DM บอทได้ ขณะที่ยังคงปิด DM สำหรับคนอื่นทั้งหมด

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

    เปิดใช้งาน **Server Members Intent** ใน Discord Developer Portal สำหรับบอทเมื่อใช้กลุ่มการเข้าถึงแบบผู้ชมช่อง DM ไม่มีสถานะสมาชิกกิลด์ ดังนั้น OpenClaw จึง resolve สมาชิกผ่าน Discord REST ในเวลาที่อนุญาต

  </Tab>

  <Tab title="Guild policy">
    การจัดการกิลด์ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    baseline ที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    พฤติกรรม `allowlist`:

    - กิลด์ต้องตรงกับ `channels.discord.guilds` (แนะนำ `id`, รับ slug ได้)
    - allowlist ของผู้ส่งแบบไม่บังคับ: `users` (แนะนำ ID ที่เสถียร) และ `roles` (เฉพาะ ID บทบาท); หากกำหนดค่าอย่างใดอย่างหนึ่ง ผู้ส่งจะได้รับอนุญาตเมื่อมีค่าตรงกับ `users` หรือ `roles`
    - การจับคู่ชื่อ/แท็กโดยตรงถูกปิดโดยค่าเริ่มต้น; เปิดใช้ `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเป็นโหมดความเข้ากันได้แบบ break-glass
    - `users` รองรับชื่อ/แท็ก แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อใช้รายการชื่อ/แท็ก
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

    หากคุณตั้งค่าเฉพาะ `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` fallback ของ runtime คือ `groupPolicy="allowlist"` (พร้อมคำเตือนใน log) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`

  </Tab>

  <Tab title="Mentions and group DMs">
    ข้อความกิลด์ต้องผ่านการ gate ด้วย mention โดยค่าเริ่มต้น

    การตรวจจับ mention รวมถึง:

    - mention บอทอย่างชัดเจน
    - รูปแบบ mention ที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับถึงบอทโดยนัยในกรณีที่รองรับ

    เมื่อเขียนข้อความ Discord ขาออก ให้ใช้ไวยากรณ์ mention ตามรูปแบบมาตรฐาน: `<@USER_ID>` สำหรับผู้ใช้, `<#CHANNEL_ID>` สำหรับช่อง และ `<@&ROLE_ID>` สำหรับบทบาท อย่าใช้รูปแบบ mention ชื่อเล่นแบบเดิม `<@!USER_ID>`

    `requireMention` ถูกกำหนดค่าต่อกิลด์/ช่อง (`channels.discord.guilds...`)
    `ignoreOtherMentions` สามารถเลือกให้ละทิ้งข้อความที่ mention ผู้ใช้/บทบาทอื่นแต่ไม่ได้ mention บอท (ยกเว้น @everyone/@here)

    Group DM:

    - ค่าเริ่มต้น: ถูกละเว้น (`dm.groupEnabled=false`)
    - allowlist แบบไม่บังคับผ่าน `dm.groupChannels` (ID ช่องหรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทาง agent ตามบทบาท

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิกกิลด์ Discord ไปยัง agent ต่างกันตาม ID ของบทบาท การผูกตามบทบาทรับเฉพาะ ID ของบทบาทเท่านั้น และจะถูกประเมินหลังการผูกแบบ peer หรือ parent-peer และก่อนการผูกแบบเฉพาะกิลด์ หากการผูกหนึ่งตั้งค่าฟิลด์การจับคู่อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ฟิลด์ที่กำหนดไว้ทั้งหมดต้องตรงกัน

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
- การเขียนทับรายช่องทาง: `channels.discord.commands.native`
- `commands.native=false` จะข้ามการลงทะเบียนและการล้างคำสั่ง slash ของ Discord ระหว่างการเริ่มต้น คำสั่งที่เคยลงทะเบียนไว้อาจยังมองเห็นได้ใน Discord จนกว่าคุณจะลบออกจากแอป Discord
- การตรวจสอบสิทธิ์คำสั่งเนทีฟใช้ allowlist/นโยบายของ Discord ชุดเดียวกับการจัดการข้อความปกติ
- คำสั่งอาจยังมองเห็นได้ใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต แต่การดำเนินการยังคงบังคับใช้การตรวจสอบสิทธิ์ของ OpenClaw และส่งคืน "ไม่ได้รับอนุญาต"

ดู [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งและพฤติกรรม

การตั้งค่าคำสั่ง slash เริ่มต้น:

- `ephemeral: true`

## รายละเอียดฟีเจอร์

<AccordionGroup>
  <Accordion title="แท็กการตอบกลับและการตอบกลับเนทีฟ">
    Discord รองรับแท็กการตอบกลับในเอาต์พุตของ agent:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    ควบคุมโดย `channels.discord.replyToMode`:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`
    - `batched`

    หมายเหตุ: `off` ปิดการสร้างเธรดตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงถูกใช้งาน
    `first` จะแนบการอ้างอิงการตอบกลับเนทีฟโดยนัยไปกับข้อความ Discord ขาออกข้อความแรกของรอบนั้นเสมอ
    `batched` จะแนบการอ้างอิงการตอบกลับเนทีฟโดยนัยของ Discord เฉพาะเมื่อเหตุการณ์ขาเข้าเป็นแบตช์แบบ debounce ของหลายข้อความ ซึ่งมีประโยชน์
    เมื่อคุณต้องการการตอบกลับเนทีฟเป็นหลักสำหรับแชตที่เข้ามาเป็นชุดอย่างกำกวม ไม่ใช่ทุก
    รอบที่มีข้อความเดียว

    ID ข้อความจะแสดงในบริบท/ประวัติ เพื่อให้ agent สามารถกำหนดเป้าหมายข้อความเฉพาะได้

  </Accordion>

  <Accordion title="ตัวอย่างลิงก์">
    Discord สร้าง embed ลิงก์แบบสมบูรณ์สำหรับ URL ตามค่าเริ่มต้น OpenClaw จะระงับ embed ที่สร้างขึ้นเหล่านั้นบนข้อความ Discord ขาออกตามค่าเริ่มต้น ดังนั้น URL ที่ agent ส่งจะคงเป็นลิงก์ธรรมดา เว้นแต่คุณเลือกเปิดใช้:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    ตั้งค่า `channels.discord.accounts.<id>.suppressEmbeds` เพื่อเขียนทับสำหรับหนึ่งบัญชี การส่งด้วยเครื่องมือข้อความของ agent ยังสามารถส่ง `suppressEmbeds: false` สำหรับข้อความเดียวได้ด้วย เพย์โหลด `embeds` ของ Discord แบบชัดเจนจะไม่ถูกระงับโดยการตั้งค่าตัวอย่างลิงก์เริ่มต้น

  </Accordion>

  <Accordion title="ตัวอย่างสตรีมสด">
    OpenClaw สามารถสตรีมร่างคำตอบโดยส่งข้อความชั่วคราวและแก้ไขเมื่อมีข้อความเข้ามา `channels.discord.streaming` รับค่า `off` | `partial` | `block` | `progress` (ค่าเริ่มต้น) `progress` เก็บร่างสถานะที่แก้ไขได้ไว้หนึ่งรายการและอัปเดตด้วยความคืบหน้าของเครื่องมือจนกว่าจะส่งขั้นสุดท้าย ป้ายเริ่มต้นที่ใช้ร่วมกันเป็นบรรทัดที่เลื่อนไปเรื่อย ๆ จึงเลื่อนหายไปเหมือนส่วนที่เหลือเมื่อมีงานปรากฏมากพอ `streamMode` เป็น alias รันไทม์แบบเดิม เรียกใช้ `openclaw doctor --fix` เพื่อเขียน config ที่คงอยู่ให้เป็นคีย์มาตรฐาน

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

    - `partial` แก้ไขข้อความตัวอย่างเดียวเมื่อ token เข้ามา
    - `block` ส่งชิ้นส่วนขนาดร่าง (ใช้ `draftChunk` เพื่อปรับขนาดและจุดตัด โดยถูกจำกัดไว้ที่ `textChunkLimit`)
    - สื่อ ข้อผิดพลาด และผลลัพธ์สุดท้ายที่เป็นการตอบกลับแบบชัดเจนจะยกเลิกการแก้ไขตัวอย่างที่รออยู่
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความตัวอย่างซ้ำหรือไม่
    - แถวเครื่องมือ/ความคืบหน้าจะแสดงเป็นอีโมจิ + ชื่อ + รายละเอียดแบบกระชับเมื่อมี เช่น `🛠️ Bash: run tests` หรือ `🔎 Web Search: for "query"`
    - `streaming.progress.commentary` (ค่าเริ่มต้น `false`) เลือกรับข้อความคำอธิบาย/คำนำของ assistant ในร่างความคืบหน้าชั่วคราว คำอธิบายจะถูกทำความสะอาดก่อนแสดงผล คงอยู่ชั่วคราว และไม่เปลี่ยนการส่งคำตอบสุดท้าย
    - `streaming.progress.maxLineChars` ควบคุมงบประมาณตัวอย่างความคืบหน้าต่อบรรทัด ข้อความร้อยแก้วจะถูกย่อที่ขอบเขตคำ ส่วนรายละเอียดคำสั่งและพาธจะเก็บ suffix ที่เป็นประโยชน์ไว้
    - `streaming.preview.commandText` / `streaming.progress.commandText` ควบคุมรายละเอียดคำสั่ง/exec ในบรรทัดความคืบหน้าแบบกระชับ: `raw` (ค่าเริ่มต้น) หรือ `status` (เฉพาะป้ายเครื่องมือ)

    ซ่อนข้อความคำสั่ง/exec ดิบ โดยยังคงบรรทัดความคืบหน้าแบบกระชับไว้:

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

    การสตรีมตัวอย่างรองรับเฉพาะข้อความเท่านั้น การตอบกลับแบบสื่อจะย้อนกลับไปใช้การส่งปกติ เมื่อเปิดใช้การสตรีม `block` อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

  </Accordion>

  <Accordion title="ประวัติ บริบท และพฤติกรรมเธรด">
    บริบทประวัติกิลด์:

    - ค่าเริ่มต้นของ `channels.discord.historyLimit` คือ `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    การควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมเธรด:

    - เธรด Discord จะถูกกำหนดเส้นทางเป็นเซสชันช่องทางและสืบทอด config ของช่องทางแม่ เว้นแต่ถูกเขียนทับ
    - เซสชันเธรดสืบทอดการเลือก `/model` ระดับเซสชันของช่องทางแม่เป็น fallback เฉพาะโมเดล การเลือก `/model` ภายในเธรดยังคงมีลำดับความสำคัญสูงกว่า และประวัติ transcript ของแม่จะไม่ถูกคัดลอก เว้นแต่เปิดใช้การสืบทอด transcript
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) เลือกให้ auto-thread ใหม่ seed จาก transcript ของแม่ การเขียนทับรายบัญชีอยู่ภายใต้ `channels.discord.accounts.<id>.thread.inheritParent`
    - reaction ของเครื่องมือข้อความสามารถ resolve เป้าหมาย DM แบบ `user:<id>` ได้
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะถูกเก็บไว้ระหว่าง fallback การเปิดใช้งานในขั้นตอบกลับ

    หัวข้อช่องทางจะถูกฉีดเข้าเป็นบริบทที่ **ไม่น่าเชื่อถือ** allowlist ควบคุมว่าใครสามารถเรียก agent ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบเต็มรูปแบบ

  </Accordion>

  <Accordion title="เซสชันที่ผูกกับเธรดสำหรับ subagent">
    Discord สามารถผูกเธรดกับเป้าหมายเซสชัน เพื่อให้ข้อความติดตามผลในเธรดนั้นยังคงถูกกำหนดเส้นทางไปยังเซสชันเดิม (รวมถึงเซสชัน subagent)

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/ใหม่กับเป้าหมาย subagent/เซสชัน
    - `/unfocus` ลบการผูกเธรดปัจจุบัน
    - `/agents` แสดง run ที่ใช้งานอยู่และสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการ auto-unfocus เมื่อไม่มีการใช้งานสำหรับการผูกที่ focus อยู่
    - `/session max-age <duration|off>` ตรวจสอบ/อัปเดตอายุสูงสุดแบบ hard max สำหรับการผูกที่ focus อยู่

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

    - `session.threadBindings.*` ตั้งค่าเริ่มต้นทั่วโลก
    - `channels.discord.threadBindings.*` เขียนทับพฤติกรรม Discord
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดอัตโนมัติสำหรับ `sessions_spawn({ thread: true })` และการ spawn เธรด ACP ค่าเริ่มต้น: `true`
    - `defaultSpawnContext` ควบคุมบริบท subagent เนทีฟสำหรับการ spawn ที่ผูกกับเธรด ค่าเริ่มต้น: `"fork"`
    - คีย์ `spawnSubagentSessions`/`spawnAcpSessions` ที่เลิกใช้แล้วจะถูกย้ายโดย `openclaw doctor --fix`
    - หากการผูกเธรดถูกปิดสำหรับบัญชีหนึ่ง `/focus` และการดำเนินการผูกเธรดที่เกี่ยวข้องจะไม่พร้อมใช้งาน

    ดู [Sub-agents](/th/tools/subagents), [ACP Agents](/th/tools/acp-agents), และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="การผูกช่องทาง ACP แบบคงอยู่">
    สำหรับเวิร์กสเปซ ACP แบบ "เปิดตลอดเวลา" ที่เสถียร ให้กำหนดค่าการผูก ACP แบบมีชนิดที่ระดับบนสุดซึ่งกำหนดเป้าหมายไปยังการสนทนา Discord

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

    - `/acp spawn codex --bind here` ผูกช่องทางหรือเธรดปัจจุบันไว้กับที่ และให้ข้อความในอนาคตอยู่ในเซสชัน ACP เดิม ข้อความในเธรดจะสืบทอดการผูกของช่องทางแม่
    - ในช่องทางหรือเธรดที่ถูกผูกไว้ `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP เดิมไว้กับที่ การผูกเธรดชั่วคราวสามารถเขียนทับการ resolve เป้าหมายขณะใช้งานอยู่
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดลูกผ่าน `--thread auto|here`

    ดู [ACP Agents](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมการผูก

  </Accordion>

  <Accordion title="การแจ้งเตือน reaction">
    โหมดการแจ้งเตือน reaction รายกิลด์:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    เหตุการณ์ reaction จะถูกแปลงเป็นเหตุการณ์ระบบและแนบกับเซสชัน Discord ที่ถูกกำหนดเส้นทาง

  </Accordion>

  <Accordion title="Reaction ยืนยันรับ">
    `ackReaction` ส่งอีโมจิยืนยันรับขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback อีโมจิตัวตนของ agent (`agents.list[].identity.emoji` มิฉะนั้นใช้ "👀")

    หมายเหตุ:

    - Discord รับอีโมจิ unicode หรือชื่ออีโมจิกำหนดเอง
    - ใช้ `""` เพื่อปิด reaction สำหรับช่องทางหรือบัญชี

  </Accordion>

  <Accordion title="การเขียน Config">
    การเขียน config ที่เริ่มจากช่องทางเปิดใช้งานตามค่าเริ่มต้น

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

  <Accordion title="พร็อกซี Gateway">
    กำหนดเส้นทางทราฟฟิก WebSocket ของ gateway Discord และการค้นหา REST ตอนเริ่มต้น (ID แอปพลิเคชัน + การ resolve allowlist) ผ่านพร็อกซี HTTP(S) ด้วย `channels.discord.proxy`
    การพร็อกซี WebSocket ของ Discord Gateway เป็นแบบชัดเจน การเชื่อมต่อ WebSocket จะไม่สืบทอดตัวแปรสภาพแวดล้อมพร็อกซีโดยรอบจากกระบวนการ Gateway การค้นหา REST ตอนเริ่มต้นใช้พร็อกซีนี้เมื่อกำหนดค่า `channels.discord.proxy`

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    การเขียนทับรายบัญชี:

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
    เปิดใช้การแปลง PluralKit เพื่อแมปข้อความที่ถูกพร็อกซีไปยังตัวตนของสมาชิกในระบบ:

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
    - การค้นหาใช้ ID ข้อความเดิมและถูกจำกัดด้วยกรอบเวลา
    - หากการค้นหาล้มเหลว ข้อความที่ถูกพร็อกซีจะถูกมองว่าเป็นข้อความของบอทและถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="นามแฝงของการกล่าวถึงขาออก">
    ใช้ `mentionAliases` เมื่อเอเจนต์ต้องการการกล่าวถึงขาออกที่กำหนดแน่นอนสำหรับผู้ใช้ Discord ที่รู้จัก คีย์คือแฮนเดิลที่ไม่มี `@` นำหน้า; ค่าคือ ID ผู้ใช้ Discord แฮนเดิลที่ไม่รู้จัก, `@everyone`, `@here` และการกล่าวถึงภายใน code span ของ Markdown จะถูกปล่อยไว้ตามเดิม

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
    การอัปเดต Presence จะถูกนำไปใช้เมื่อคุณตั้งค่าฟิลด์สถานะหรือกิจกรรม หรือเมื่อคุณเปิดใช้ Presence อัตโนมัติ

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

    แผนผังชนิดกิจกรรม:

    - 0: กำลังเล่น
    - 1: กำลังสตรีม (ต้องใช้ `activityUrl`)
    - 2: กำลังฟัง
    - 3: กำลังดู
    - 4: กำหนดเอง (ใช้ข้อความกิจกรรมเป็นสถานะ; อีโมจิเป็นตัวเลือก)
    - 5: กำลังแข่งขัน

    ตัวอย่าง Presence อัตโนมัติ (สัญญาณสุขภาพของ runtime):

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

    Presence อัตโนมัติจะแมปความพร้อมใช้งานของ runtime ไปยังสถานะ Discord: healthy => online, degraded หรือ unknown => idle, exhausted หรือ unavailable => dnd ข้อความแทนที่แบบไม่บังคับ:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับ placeholder `{reason}`)

  </Accordion>

  <Accordion title="การอนุมัติใน Discord">
    Discord รองรับการจัดการการอนุมัติด้วยปุ่มใน DM และสามารถโพสต์พรอมป์การอนุมัติในช่องทางต้นทางได้แบบเลือกได้

    เส้นทางการกำหนดค่า:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; ถอยกลับไปใช้ `commands.ownerAllowFrom` เมื่อเป็นไปได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord จะเปิดใช้การอนุมัติ exec แบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และสามารถแก้ไขผู้อนุมัติได้อย่างน้อยหนึ่งราย ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord ไม่อนุมานผู้อนุมัติ exec จาก `allowFrom` ของช่องทาง, `dm.allowFrom` แบบเดิม หรือ `defaultTo` ของ direct message ตั้งค่า `enabled: false` เพื่อปิดใช้ Discord เป็นไคลเอนต์การอนุมัติแบบเนทีฟอย่างชัดเจน

    สำหรับคำสั่งกลุ่มที่ละเอียดอ่อนและจำกัดเฉพาะเจ้าของ เช่น `/diagnostics` และ `/export-trajectory` OpenClaw จะส่งพรอมป์การอนุมัติและผลลัพธ์สุดท้ายแบบส่วนตัว โดยจะลองใช้ Discord DM ก่อนเมื่อเจ้าของที่เรียกใช้มีเส้นทางเจ้าของ Discord; หากไม่มี จะถอยกลับไปยังเส้นทางเจ้าของแรกที่พร้อมใช้งานจาก `commands.ownerAllowFrom` เช่น Telegram

    เมื่อ `target` เป็น `channel` หรือ `both` พรอมป์การอนุมัติจะมองเห็นได้ในช่องทาง เฉพาะผู้อนุมัติที่แก้ไขได้แล้วเท่านั้นที่ใช้ปุ่มได้; ผู้ใช้อื่นจะได้รับการปฏิเสธแบบ ephemeral พรอมป์การอนุมัติจะมีข้อความคำสั่งรวมอยู่ด้วย ดังนั้นให้เปิดใช้การส่งไปยังช่องทางเฉพาะในช่องทางที่เชื่อถือได้เท่านั้น หากไม่สามารถอนุมาน ID ช่องทางจากคีย์เซสชันได้ OpenClaw จะถอยกลับไปส่งทาง DM

    Discord ยังเรนเดอร์ปุ่มการอนุมัติแบบใช้ร่วมกันที่ใช้โดยช่องทางแชตอื่น อะแดปเตอร์ Discord แบบเนทีฟหลัก ๆ จะเพิ่มการกำหนดเส้นทาง DM ของผู้อนุมัติและการ fanout ไปยังช่องทาง
    เมื่อมีปุ่มเหล่านั้นอยู่ ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก; OpenClaw
    ควรรวมคำสั่ง `/approve` แบบแมนนวลไว้เฉพาะเมื่อผลลัพธ์ของเครื่องมือบอกว่า
    การอนุมัติผ่านแชตไม่พร้อมใช้งานหรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียว
    หาก runtime การอนุมัติแบบเนทีฟของ Discord ไม่ทำงาน OpenClaw จะคง
    พรอมป์ `/approve <id> <decision>` แบบกำหนดแน่นอนในเครื่องให้มองเห็นได้ หาก
    runtime ทำงานแต่ไม่สามารถส่งการ์ดแบบเนทีฟไปยังเป้าหมายใด ๆ ได้
    OpenClaw จะส่งประกาศ fallback ในแชตเดียวกันพร้อมคำสั่ง `/approve`
    ที่ตรงจากการอนุมัติที่รอดำเนินการ

    การตรวจสอบสิทธิ์ Gateway และการแก้ไขการอนุมัติเป็นไปตามสัญญาไคลเอนต์ Gateway แบบใช้ร่วมกัน (ID `plugin:` แก้ไขผ่าน `plugin.approval.resolve`; ID อื่นผ่าน `exec.approval.resolve`) การอนุมัติหมดอายุหลังจาก 30 นาทีโดยค่าเริ่มต้น

    ดู [การอนุมัติ Exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและเกตการดำเนินการ

การดำเนินการข้อความ Discord รวมถึงการส่งข้อความ, การดูแลช่องทาง, การกลั่นกรอง, Presence และการดำเนินการกับเมทาดาทา

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- รีแอ็กชัน: `react`, `reactions`, `emojiList`
- การกลั่นกรอง: `timeout`, `kick`, `ban`
- Presence: `setPresence`

การดำเนินการ `event-create` รับพารามิเตอร์ `image` แบบไม่บังคับ (URL หรือเส้นทางไฟล์ในเครื่อง) เพื่อตั้งค่ารูปภาพหน้าปกของอีเวนต์ที่กำหนดเวลาไว้

เกตการดำเนินการอยู่ใต้ `channels.discord.actions.*`

พฤติกรรมเกตเริ่มต้น:

| กลุ่มการดำเนินการ                                                                                                                                                             | ค่าเริ่มต้น  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้งาน  |
| roles                                                                                                                                                                    | ปิดใช้งาน |
| moderation                                                                                                                                                               | ปิดใช้งาน |
| presence                                                                                                                                                                 | ปิดใช้งาน |

## UI ของ Components v2

OpenClaw ใช้ Discord components v2 สำหรับการอนุมัติ exec และมาร์กเกอร์ข้ามบริบท การดำเนินการข้อความ Discord ยังสามารถรับ `components` สำหรับ UI แบบกำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้างเพย์โหลดคอมโพเนนต์ผ่านเครื่องมือ discord) ขณะที่ `embeds` แบบเดิมยังคงใช้ได้แต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นที่ใช้โดยคอนเทนเนอร์คอมโพเนนต์ของ Discord (hex)
- ตั้งค่าต่อบัญชีด้วย `channels.discord.accounts.<id>.ui.components.accentColor`
- `channels.discord.agentComponents.ttlMs` ควบคุมระยะเวลาที่ callback ของคอมโพเนนต์ Discord ที่ส่งไปแล้วยังคงลงทะเบียนอยู่ (ค่าเริ่มต้น `1800000`, สูงสุด `86400000`) ตั้งค่าต่อบัญชีด้วย `channels.discord.accounts.<id>.agentComponents.ttlMs`
- `embeds` จะถูกละเว้นเมื่อมี components v2 อยู่
- การแสดงตัวอย่าง URL แบบธรรมดาจะถูกระงับโดยค่าเริ่มต้น ตั้งค่า `suppressEmbeds: false` บนการดำเนินการข้อความเมื่อลิงก์ขาออกเดี่ยวควรขยาย

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

Discord มีพื้นผิวเสียงสองแบบที่แตกต่างกัน: **ช่องทางเสียง** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบตัวอย่าง waveform) Gateway รองรับทั้งสองแบบ

### ช่องทางเสียง

รายการตรวจสอบการตั้งค่า:

1. เปิดใช้ Message Content Intent ใน Discord Developer Portal
2. เปิดใช้ Server Members Intent เมื่อใช้ allowlists ของบทบาท/ผู้ใช้
3. เชิญบอทด้วย scope `bot` และ `applications.commands`
4. ให้สิทธิ์ Connect, Speak, Send Messages และ Read Message History ในช่องทางเสียงเป้าหมาย
5. เปิดใช้คำสั่งเนทีฟ (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งจะใช้เอเจนต์เริ่มต้นของบัญชีและทำตามกฎ allowlist และนโยบายกลุ่มเดียวกับคำสั่ง Discord อื่น

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

หากต้องการตรวจสอบสิทธิ์จริงของบอทก่อนเข้าร่วม ให้รัน:

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

- `voice.tts` จะแทนที่ `messages.tts` สำหรับการเล่นเสียง `stt-tts` เท่านั้น โหมด Realtime ใช้ `voice.realtime.speakerVoice`
- `voice.mode` ควบคุมเส้นทางการสนทนา ค่าเริ่มต้นคือ `agent-proxy`: ส่วนหน้าเสียงแบบ realtime จัดการจังหวะรอบสนทนา การขัดจังหวะ และการเล่นเสียง มอบหมายงานที่มีสาระให้เอเจนต์ OpenClaw ที่ถูกกำหนดเส้นทางผ่าน `openclaw_agent_consult` และปฏิบัติกับผลลัพธ์เหมือนพรอมป์ Discord แบบพิมพ์จากผู้พูดคนนั้น `stt-tts` คงโฟลว์ STT แบบแบตช์เดิมร่วมกับ TTS ไว้ `bidi` ให้โมเดล realtime สนทนาโดยตรงพร้อมเปิดเผย `openclaw_agent_consult` สำหรับสมอง OpenClaw
- `voice.agentSession` ควบคุมว่าการสนทนา OpenClaw ใดจะได้รับรอบสนทนาด้วยเสียง ปล่อยไว้ไม่ตั้งค่าเพื่อใช้เซสชันของช่องเสียงเอง หรือตั้งเป็น `{ mode: "target", target: "channel:<text-channel-id>" }` เพื่อให้ช่องเสียงทำหน้าที่เป็นส่วนขยายไมโครโฟน/ลำโพงของเซสชันช่องข้อความ Discord ที่มีอยู่ เช่น `#maintainers`
- `voice.model` จะแทนที่สมองเอเจนต์ OpenClaw สำหรับการตอบกลับเสียง Discord และ realtime consult ปล่อยไว้ไม่ตั้งค่าเพื่อสืบทอดโมเดลเอเจนต์ที่ถูกกำหนดเส้นทาง ค่านี้แยกจาก `voice.realtime.model`
- `voice.followUsers` ให้บอตเข้าร่วม ย้าย และออกจากเสียง Discord พร้อมผู้ใช้ที่เลือก ดู [ติดตามผู้ใช้ในเสียง](#follow-users-in-voice) สำหรับกฎพฤติกรรมและตัวอย่าง
- `agent-proxy` กำหนดเส้นทางเสียงพูดผ่าน `discord-voice` ซึ่งคงการอนุญาตเจ้าของ/เครื่องมือตามปกติสำหรับผู้พูดและเซสชันเป้าหมาย แต่ซ่อนเครื่องมือ `tts` ของเอเจนต์ เพราะเสียง Discord เป็นเจ้าของการเล่นเสียง โดยค่าเริ่มต้น `agent-proxy` ให้ consult เข้าถึงเครื่องมือเต็มรูปแบบเทียบเท่าเจ้าของสำหรับผู้พูดที่เป็นเจ้าของ (`voice.realtime.toolPolicy: "owner"`) และต้องการ consult เอเจนต์ OpenClaw ก่อนคำตอบที่มีสาระอย่างมาก (`voice.realtime.consultPolicy: "always"`) ในโหมด `always` เริ่มต้นนั้น เลเยอร์ realtime จะไม่พูดข้อความเติมเวลาโดยอัตโนมัติก่อนคำตอบจาก consult แต่จะจับและถอดเสียงคำพูด จากนั้นพูดคำตอบ OpenClaw ที่ถูกกำหนดเส้นทาง หากคำตอบ consult ที่ถูกบังคับหลายรายการเสร็จขณะที่ Discord ยังเล่นคำตอบแรกอยู่ คำตอบแบบถ้อยคำตรงตัวที่ตามมาจะถูกจัดคิวจนกว่าการเล่นเสียงจะว่าง แทนที่จะแทนที่คำพูดกลางประโยค
- ในโหมด `stt-tts` STT ใช้ `tools.media.audio`; `voice.model` ไม่มีผลต่อการถอดเสียง
- ในโหมด realtime, `voice.realtime.provider`, `voice.realtime.model` และ `voice.realtime.speakerVoice` กำหนดค่าเซสชันเสียง realtime สำหรับ OpenAI Realtime 2 ร่วมกับสมอง Codex ให้ใช้ `voice.realtime.model: "gpt-realtime-2"` และ `voice.model: "openai/gpt-5.5"`
- โหมดเสียง realtime จะรวมไฟล์โปรไฟล์ขนาดเล็ก `IDENTITY.md`, `USER.md` และ `SOUL.md` ในคำสั่งของผู้ให้บริการ realtime โดยค่าเริ่มต้น เพื่อให้รอบสนทนาโดยตรงที่รวดเร็วคงตัวตน การยึดโยงผู้ใช้ และบุคลิกเดียวกับเอเจนต์ OpenClaw ที่ถูกกำหนดเส้นทาง ตั้งค่า `voice.realtime.bootstrapContextFiles` เป็นชุดย่อยเพื่อปรับแต่งสิ่งนี้ หรือ `[]` เพื่อปิดใช้งาน ไฟล์ bootstrap realtime ที่รองรับจำกัดอยู่ที่ไฟล์โปรไฟล์เหล่านั้น; `AGENTS.md` จะยังอยู่ในบริบทเอเจนต์ปกติ บริบทโปรไฟล์ที่ฉีดเข้าไปไม่ได้แทนที่ `openclaw_agent_consult` สำหรับงานใน workspace ข้อเท็จจริงปัจจุบัน การค้นหาหน่วยความจำ หรือการกระทำที่มีเครื่องมือรองรับ
- ในโหมด realtime `agent-proxy` ของ OpenAI ให้ตั้งค่า `voice.realtime.requireWakeName: true` เพื่อให้เสียง realtime ของ Discord เงียบจนกว่าถอดเสียงจะเริ่มหรือลงท้ายด้วยชื่อปลุก ชื่อปลุกที่กำหนดค่าต้องมีหนึ่งหรือสองคำ หากไม่ได้ตั้งค่า `voice.realtime.wakeNames` OpenClaw จะใช้ `name` ของเอเจนต์ที่ถูกกำหนดเส้นทางรวมกับ `OpenClaw` และ fallback เป็น id เอเจนต์รวมกับ `OpenClaw` การกั้นด้วยชื่อปลุกจะปิดใช้งานการตอบกลับอัตโนมัติของผู้ให้บริการ realtime กำหนดเส้นทางรอบสนทนาที่รับผ่านเส้นทาง consult ของเอเจนต์ OpenClaw และให้การตอบรับแบบพูดสั้น ๆ เมื่อรู้จำชื่อปลุกนำหน้าจากการถอดเสียงบางส่วนก่อนถอดเสียงสุดท้ายมาถึง
- ผู้ให้บริการ realtime ของ OpenAI ยอมรับชื่อเหตุการณ์ Realtime 2 ปัจจุบันและชื่อแทนแบบดั้งเดิมที่เข้ากันได้กับ Codex สำหรับเหตุการณ์เสียงเอาต์พุตและถอดเสียง ดังนั้น snapshot ของผู้ให้บริการที่เข้ากันได้สามารถเปลี่ยนแปลงได้โดยไม่ทำให้เสียงผู้ช่วยหายไป
- `voice.realtime.bargeIn` ควบคุมว่าเหตุการณ์เริ่มพูดของผู้พูดใน Discord จะขัดจังหวะการเล่นเสียง realtime ที่กำลังทำงานอยู่หรือไม่ หากไม่ได้ตั้งค่า จะตามการตั้งค่าการขัดจังหวะเสียงอินพุตของผู้ให้บริการ realtime
- `voice.realtime.minBargeInAudioEndMs` ควบคุมระยะเวลาการเล่นเสียงขั้นต่ำของผู้ช่วยก่อนที่ barge-in realtime ของ OpenAI จะตัดเสียง ค่าเริ่มต้น: `250` ตั้งเป็น `0` สำหรับการขัดจังหวะทันทีในห้องที่เสียงสะท้อนต่ำ หรือเพิ่มค่านี้สำหรับการตั้งค่าลำโพงที่มีเสียงสะท้อนมาก
- สำหรับเสียง OpenAI บนการเล่นเสียง Discord ให้ตั้งค่า `voice.tts.provider: "openai"` และเลือกเสียง Text-to-speech ภายใต้ `voice.tts.providers.openai.speakerVoice` `cedar` เป็นตัวเลือกเสียงแนวผู้ชายที่ดีบนโมเดล TTS ปัจจุบันของ OpenAI
- การแทนที่ `systemPrompt` ของ Discord รายช่องจะมีผลกับรอบถอดเสียงของช่องเสียงนั้น
- รอบถอดเสียงจะอนุมานสถานะเจ้าของจาก `allowFrom` ของ Discord (หรือ `dm.allowFrom`) สำหรับคำสั่งที่จำกัดเฉพาะเจ้าของและการกระทำของช่อง การมองเห็นเครื่องมือเอเจนต์จะตามนโยบายเครื่องมือที่กำหนดค่าสำหรับเซสชันที่ถูกกำหนดเส้นทาง
- เสียง Discord เป็นแบบเลือกเปิดสำหรับการกำหนดค่าแบบข้อความเท่านั้น; ตั้งค่า `channels.discord.voice.enabled=true` (หรือคงบล็อก `channels.discord.voice` ที่มีอยู่) เพื่อเปิดใช้คำสั่ง `/vc`, runtime เสียง และ gateway intent `GuildVoiceStates`
- `channels.discord.intents.voiceStates` สามารถแทนที่การสมัครใช้งาน intent สถานะเสียงได้อย่างชัดเจน ปล่อยไว้ไม่ตั้งค่าเพื่อให้ intent ตามการเปิดใช้งานเสียงที่มีผลจริง
- หาก `voice.autoJoin` มีหลายรายการสำหรับ guild เดียวกัน OpenClaw จะเข้าร่วมช่องที่กำหนดค่าล่าสุดสำหรับ guild นั้น
- `voice.allowedChannels` เป็น allowlist ถิ่นที่อยู่แบบไม่บังคับ ปล่อยไว้ไม่ตั้งค่าเพื่ออนุญาตให้ `/vc join` เข้าช่องเสียง Discord ที่ได้รับอนุญาตใดก็ได้ เมื่อตั้งค่าแล้ว `/vc join`, การเข้าร่วมอัตโนมัติเมื่อเริ่มต้น และการย้ายสถานะเสียงของบอตจะถูกจำกัดไว้เฉพาะรายการ `{ guildId, channelId }` ที่ระบุ ตั้งเป็นอาร์เรย์ว่างเพื่อปฏิเสธการเข้าร่วมเสียง Discord ทั้งหมด หาก Discord ย้ายบอตออกนอก allowlist, OpenClaw จะออกจากช่องนั้นและเข้าร่วมเป้าหมาย auto-join ที่กำหนดค่าไว้ใหม่เมื่อมี
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือกการเข้าร่วมของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- OpenClaw ใช้โคเดก `libopus-wasm` ที่บันเดิลมาสำหรับการรับเสียง Discord และการเล่น PCM ดิบแบบ realtime โดยจัดส่งบิลด์ WebAssembly ของ libopus ที่ตรึงเวอร์ชันไว้ และไม่ต้องใช้ native opus addons
- `voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับความพยายาม `/vc join` และ auto-join ค่าเริ่มต้น: `30000`
- `voice.reconnectGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอให้เซสชันเสียงที่ตัดการเชื่อมต่อเริ่มเชื่อมต่อใหม่ก่อนทำลายเซสชัน ค่าเริ่มต้น: `15000`
- ในโหมด `stt-tts` การเล่นเสียงจะไม่หยุดเพียงเพราะผู้ใช้อีกคนเริ่มพูด เพื่อหลีกเลี่ยงลูป feedback, OpenClaw จะละเว้นการจับเสียงใหม่ขณะ TTS กำลังเล่นอยู่; พูดหลังการเล่นเสียงจบเพื่อเริ่มรอบถัดไป โหมด realtime จะส่งการเริ่มพูดของผู้พูดเป็นสัญญาณ barge-in ไปยังผู้ให้บริการ realtime
- ในโหมด realtime เสียงสะท้อนจากลำโพงเข้าสู่ไมค์ที่เปิดอยู่อาจดูเหมือน barge-in และขัดจังหวะการเล่นเสียง สำหรับห้อง Discord ที่มีเสียงสะท้อนมาก ให้ตั้งค่า `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` เพื่อไม่ให้ OpenAI ขัดจังหวะอัตโนมัติเมื่อมีเสียงอินพุต เพิ่ม `voice.realtime.bargeIn: true` หากคุณยังต้องการให้เหตุการณ์เริ่มพูดของผู้พูดใน Discord ขัดจังหวะการเล่นเสียงที่กำลังทำงานอยู่ สะพาน realtime ของ OpenAI จะละเว้นการตัดการเล่นเสียงที่สั้นกว่า `voice.realtime.minBargeInAudioEndMs` โดยถือว่าน่าจะเป็นเสียงสะท้อน/เสียงรบกวน และบันทึกเป็นรายการที่ข้ามแทนการล้างการเล่นเสียง Discord
- `voice.captureSilenceGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอหลังจาก Discord รายงานว่าผู้พูดหยุดแล้ว ก่อนสรุปเซกเมนต์เสียงนั้นสำหรับ STT ค่าเริ่มต้น: `2000`; เพิ่มค่านี้หาก Discord แยกช่วงหยุดปกติออกเป็นถอดเสียงบางส่วนที่ขาดตอน
- เมื่อ ElevenLabs เป็นผู้ให้บริการ TTS ที่เลือก การเล่นเสียง Discord จะใช้ TTS แบบสตรีมและเริ่มจากสตรีมการตอบกลับของผู้ให้บริการ ผู้ให้บริการที่ไม่รองรับการสตรีมจะ fallback ไปยังเส้นทางไฟล์ชั่วคราวที่สังเคราะห์แล้ว
- OpenClaw ยังเฝ้าดูความล้มเหลวในการถอดรหัสการรับ และกู้คืนอัตโนมัติโดยออกจาก/เข้าร่วมช่องเสียงใหม่หลังเกิดความล้มเหลวซ้ำในหน้าต่างเวลาสั้น ๆ
- หากบันทึกการรับแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำ ๆ หลังอัปเดต ให้รวบรวมรายงาน dependency และบันทึก บรรทัด `@discordjs/voice` ที่บันเดิลรวมการแก้ไข padding upstream จาก discord.js PR #11449 ซึ่งปิด discord.js issue #11419
- เหตุการณ์รับ `The operation was aborted` เป็นสิ่งที่คาดไว้เมื่อ OpenClaw สรุปเซกเมนต์ผู้พูดที่จับไว้; เป็นการวินิจฉัยแบบละเอียด ไม่ใช่คำเตือน
- บันทึกเสียง Discord แบบละเอียดรวมตัวอย่างถอดเสียง STT หนึ่งบรรทัดแบบจำกัดสำหรับแต่ละเซกเมนต์ผู้พูดที่รับไว้ เพื่อให้การดีบักแสดงทั้งฝั่งผู้ใช้และฝั่งคำตอบของเอเจนต์โดยไม่ทิ้งข้อความถอดเสียงแบบไม่จำกัด
- ในโหมด `agent-proxy` fallback consult ที่ถูกบังคับจะข้ามชิ้นส่วนถอดเสียงที่น่าจะไม่สมบูรณ์ เช่น ข้อความที่ลงท้ายด้วย `...` หรือตัวเชื่อมท้ายอย่าง `and` รวมถึงคำปิดท้ายที่เห็นชัดว่าไม่ต้องดำเนินการ เช่น “เดี๋ยวกลับมา” หรือ “ลาก่อน” บันทึกจะแสดง `forced agent consult skipped reason=...` เมื่อสิ่งนี้ป้องกันคำตอบเก่าที่ค้างอยู่ในคิว

### ติดตามผู้ใช้ในเสียง

ใช้ `voice.followUsers` เมื่อคุณต้องการให้บอตเสียง Discord อยู่กับผู้ใช้ Discord ที่รู้จักหนึ่งคนขึ้นไป แทนการเข้าร่วมช่องคงที่เมื่อเริ่มต้นหรือรอ `/vc join`

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

- `followUsers` ยอมรับ ID ผู้ใช้ Discord แบบดิบและค่า `discord:<id>` OpenClaw ทำให้ทั้งสองรูปแบบเป็นมาตรฐานก่อนจับคู่เหตุการณ์สถานะเสียง
- `followUsersEnabled` มีค่าเริ่มต้นเป็น `true` เมื่อกำหนดค่า `followUsers` ตั้งเป็น `false` เพื่อเก็บรายการที่บันทึกไว้แต่หยุดการติดตามเสียงอัตโนมัติ
- เมื่อผู้ใช้ที่ติดตามเข้าร่วมช่องเสียงที่อนุญาต OpenClaw จะเข้าร่วมช่องนั้น เมื่อผู้ใช้ย้าย OpenClaw จะย้ายตาม เมื่อผู้ใช้ที่ติดตามที่ใช้งานอยู่ตัดการเชื่อมต่อ OpenClaw จะออก
- หากมีผู้ใช้ที่ติดตามหลายคนอยู่ใน guild เดียวกันและผู้ใช้ที่ติดตามที่ใช้งานอยู่ออก OpenClaw จะย้ายไปยังช่องของผู้ใช้ที่ติดตามอีกคนที่ถูกติดตามอยู่ก่อนออกจาก guild หากผู้ใช้ที่ติดตามหลายคนย้ายพร้อมกัน เหตุการณ์สถานะเสียงที่สังเกตล่าสุดจะเป็นผู้ชนะ
- `allowedChannels` ยังคงมีผล ผู้ใช้ที่ติดตามในช่องที่ไม่อนุญาตจะถูกละเว้น และเซสชันที่เป็นของการติดตามจะย้ายไปยังผู้ใช้ที่ติดตามอีกคนหรือออก
- OpenClaw กระทบยอดเหตุการณ์สถานะเสียงที่พลาดไปเมื่อเริ่มต้นและตามช่วงเวลาที่จำกัด การกระทบยอดจะสุ่มตัวอย่าง guild ที่กำหนดค่าและจำกัด REST lookups ต่อรอบ ดังนั้นรายการ `followUsers` ที่ใหญ่มากอาจต้องใช้มากกว่าหนึ่งช่วงเวลาเพื่อบรรจบ
- หาก Discord หรือผู้ดูแลระบบย้ายบอตขณะที่กำลังติดตามผู้ใช้ OpenClaw จะสร้างเซสชันเสียงใหม่และรักษาความเป็นเจ้าของการติดตามไว้เมื่อปลายทางได้รับอนุญาต หากบอตถูกย้ายออกนอก `allowedChannels`, OpenClaw จะออกและเข้าร่วมเป้าหมายที่กำหนดค่าไว้ใหม่เมื่อมีอยู่
- การกู้คืนการรับ DAVE อาจออกจากและเข้าร่วมช่องเดิมใหม่หลังเกิดความล้มเหลวในการถอดรหัสซ้ำ เซสชันที่เป็นของการติดตามจะคงความเป็นเจ้าของการติดตามผ่านเส้นทางกู้นี้ ดังนั้นการตัดการเชื่อมต่อของผู้ใช้ที่ติดตามในภายหลังยังคงทำให้ออกจากช่อง

เลือกระหว่างโหมดการเข้าร่วม:

- ใช้ `followUsers` สำหรับการตั้งค่าส่วนตัวหรือของผู้ปฏิบัติงานที่บอตควรอยู่ในเสียงโดยอัตโนมัติเมื่อคุณอยู่
- ใช้ `autoJoin` สำหรับบอตห้องคงที่ที่ควรอยู่แม้ไม่มีผู้ใช้ที่ติดตามอยู่ในเสียง
- ใช้ `/vc join` สำหรับการเข้าร่วมครั้งเดียวหรือห้องที่การปรากฏตัวด้วยเสียงอัตโนมัติจะน่าประหลาดใจ

โคเดกเสียง Discord:

- บันทึกการรับเสียงแสดง `discord voice: opus decoder: libopus-wasm`
- การเล่นแบบ Realtime เข้ารหัส PCM สเตอริโอดิบ 48 kHz เป็น Opus ด้วยแพ็กเกจ `libopus-wasm` ที่รวมมาเดียวกัน ก่อนส่งต่อแพ็กเก็ตให้ `@discordjs/voice`
- การเล่นไฟล์และสตรีมจากผู้ให้บริการจะแปลงรหัสเป็น PCM สเตอริโอดิบ 48 kHz ด้วย ffmpeg จากนั้นใช้ `libopus-wasm` สำหรับสตรีมแพ็กเก็ต Opus ที่ส่งไปยัง Discord

ไปป์ไลน์ STT พร้อม TTS:

- การจับ PCM ของ Discord จะถูกแปลงเป็นไฟล์ชั่วคราว WAV
- `tools.media.audio` จัดการ STT เช่น `openai/gpt-4o-mini-transcribe`
- ทรานสคริปต์จะถูกส่งผ่านทางขาเข้าและการกำหนดเส้นทางของ Discord ขณะที่ LLM สำหรับการตอบสนองทำงานด้วยนโยบายเอาต์พุตเสียงที่ซ่อนเครื่องมือ `tts` ของเอเจนต์และขอข้อความที่ส่งกลับมา เพราะเสียง Discord เป็นเจ้าของการเล่น TTS ขั้นสุดท้าย
- `voice.model` เมื่อกำหนดค่าไว้ จะ override เฉพาะ LLM สำหรับการตอบสนองในเทิร์นช่องเสียงนี้เท่านั้น
- `voice.tts` จะถูกผสานทับ `messages.tts`; ผู้ให้บริการที่รองรับการสตรีมจะส่งเข้าผู้เล่นโดยตรง มิฉะนั้นไฟล์เสียงที่ได้จะถูกเล่นในช่องที่เข้าร่วมอยู่

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

หากไม่มีบล็อก `voice.agentSession` แต่ละช่องเสียงจะมีเซสชัน OpenClaw ที่กำหนดเส้นทางเป็นของตนเอง ตัวอย่างเช่น `/vc join channel:234567890123456789` จะพูดคุยกับเซสชันสำหรับช่องเสียง Discord นั้น โมเดล realtime เป็นเพียงส่วนหน้าเสียงเท่านั้น; คำขอที่มีสาระจะถูกส่งต่อให้เอเจนต์ OpenClaw ที่กำหนดค่าไว้ หากโมเดล realtime สร้างทรานสคริปต์สุดท้ายโดยไม่เรียกเครื่องมือปรึกษา OpenClaw จะบังคับการปรึกษาเป็น fallback เพื่อให้ค่าเริ่มต้นยังคงทำงานเหมือนการพูดคุยกับเอเจนต์

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

ในโหมด `agent-proxy` บอตจะเข้าร่วมช่องเสียงที่กำหนดค่าไว้ แต่เทิร์นเอเจนต์ OpenClaw จะใช้เซสชันและเอเจนต์ที่กำหนดเส้นทางตามปกติของช่องเป้าหมาย เซสชันเสียง realtime จะพูดผลลัพธ์ที่ส่งกลับเข้าไปในช่องเสียง เอเจนต์ supervisor ยังสามารถใช้เครื่องมือข้อความปกติตามนโยบายเครื่องมือของตน รวมถึงการส่งข้อความ Discord แยกต่างหากหากนั่นคือการกระทำที่เหมาะสม

ขณะที่การรัน OpenClaw ที่มอบหมายกำลังทำงานอยู่ ทรานสคริปต์เสียง Discord ใหม่จะถูกปฏิบัติเป็นการควบคุมการรันแบบสดก่อนเริ่มเทิร์นเอเจนต์อีกครั้ง วลีเช่น "status", "cancel that", "use the smaller fix" หรือ "when you're done also check tests" จะถูกจัดประเภทเป็นสถานะ ยกเลิก การชี้นำ หรืออินพุตติดตามผลสำหรับเซสชันที่ทำงานอยู่ ผลลัพธ์ของสถานะ การยกเลิก การชี้นำที่ยอมรับ และการติดตามผลจะถูกพูดกลับเข้าไปในช่องเสียง เพื่อให้ผู้เรียกรู้ว่า OpenClaw จัดการคำขอแล้วหรือไม่

รูปแบบเป้าหมายที่มีประโยชน์:

- `target: "channel:123456789012345678"` กำหนดเส้นทางผ่านเซสชันช่องข้อความ Discord
- `target: "123456789012345678"` จะถูกปฏิบัติเป็นเป้าหมายช่อง
- `target: "dm:123456789012345678"` หรือ `target: "user:123456789012345678"` กำหนดเส้นทางผ่านเซสชันข้อความส่วนตัวนั้น

ตัวอย่าง OpenAI Realtime ที่มี echo มาก:

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

ใช้สิ่งนี้เมื่อโมเดลได้ยินเสียงเล่นกลับ Discord ของตัวเองผ่านไมค์ที่เปิดอยู่ แต่คุณยังต้องการขัดจังหวะด้วยการพูด OpenClaw จะป้องกันไม่ให้ OpenAI ขัดจังหวะอัตโนมัติเมื่อมีเสียงอินพุตดิบ ขณะที่ `bargeIn: true` ทำให้เหตุการณ์เริ่มพูดของลำโพง Discord และเสียงผู้พูดที่ทำงานอยู่แล้วสามารถยกเลิกการตอบสนอง realtime ที่ทำงานอยู่ก่อนที่เทิร์นที่จับได้ถัดไปจะไปถึง OpenAI สัญญาณ barge-in ที่มาเร็วมากซึ่งมี `audioEndMs` ต่ำกว่า `minBargeInAudioEndMs` จะถูกปฏิบัติว่าเป็น echo/สัญญาณรบกวนที่เป็นไปได้และถูกละเว้น เพื่อไม่ให้โมเดลตัดเสียงตั้งแต่เฟรมเล่นกลับแรก

บันทึกเสียงที่คาดไว้:

- เมื่อเข้าร่วม: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- เมื่อเริ่ม realtime: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- เมื่อมีเสียงผู้พูด: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` และ `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- เมื่อข้ามคำพูดเก่าที่ค้างอยู่: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` หรือ `reason=non-actionable-closing ...`
- เมื่อการตอบสนอง realtime เสร็จสมบูรณ์: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- เมื่อหยุด/รีเซ็ตการเล่น: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- เมื่อปรึกษา realtime: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- เมื่อเอเจนต์ตอบ: `discord voice: agent turn answer ...`
- เมื่อจัดคิวคำพูดแบบตรงตัว: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...` ตามด้วย `discord voice: realtime exact speech dequeued reason=player-idle ...`
- เมื่อตรวจพบ barge-in: `discord voice: realtime barge-in detected source=speaker-start ...` หรือ `discord voice: realtime barge-in detected source=active-speaker-audio ...` ตามด้วย `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- เมื่อ realtime ถูกขัดจังหวะ: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in` ตามด้วย `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` หรือ `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- เมื่อ echo/สัญญาณรบกวนถูกละเว้น: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- เมื่อปิดใช้ barge-in: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- เมื่อการเล่นไม่ได้ใช้งาน: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

หากต้องการดีบักเสียงที่ถูกตัด ให้อ่านบันทึกเสียง realtime เป็นไทม์ไลน์:

1. `realtime audio playback started` หมายความว่า Discord เริ่มเล่นเสียงผู้ช่วยแล้ว bridge จะเริ่มนับชิ้นส่วนเอาต์พุตของผู้ช่วย ไบต์ PCM ของ Discord ไบต์ realtime ของผู้ให้บริการ และระยะเวลาเสียงที่สังเคราะห์จากจุดนี้
2. `realtime speaker turn opened` ทำเครื่องหมายว่าผู้พูด Discord เริ่มทำงาน หากการเล่นทำงานอยู่แล้วและเปิดใช้ `bargeIn` สิ่งนี้อาจตามด้วย `barge-in detected source=speaker-start`
3. `realtime input audio started` ทำเครื่องหมายเฟรมเสียงจริงแรกที่ได้รับสำหรับเทิร์นผู้พูดนั้น `outputActive=true` หรือ `outputAudioMs` ที่ไม่เป็นศูนย์ที่นี่หมายความว่าไมค์กำลังส่งอินพุตขณะที่เสียงผู้ช่วยยังเล่นอยู่
4. `barge-in detected source=active-speaker-audio` หมายความว่า OpenClaw เห็นเสียงผู้พูดสดขณะที่เสียงผู้ช่วยกำลังเล่นอยู่ สิ่งนี้มีประโยชน์สำหรับแยกการขัดจังหวะจริงออกจากเหตุการณ์เริ่มพูดของ Discord ที่ไม่มีเสียงที่ใช้ได้
5. `barge-in requested reason=...` หมายความว่า OpenClaw ขอให้ผู้ให้บริการ realtime ยกเลิกหรือตัดทอนการตอบสนองที่ทำงานอยู่ โดยมี `outputAudioMs`, `outputActive` และ `playbackChunks` เพื่อให้คุณเห็นว่าเสียงผู้ช่วยเล่นไปจริงเท่าใดก่อนการขัดจังหวะ
6. `realtime audio playback stopped reason=...` คือจุดรีเซ็ตการเล่น Discord ภายในเครื่อง เหตุผลบอกว่าใครหยุดการเล่น: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` หรือ `session-close`
7. `realtime speaker turn closed` สรุปเทิร์นอินพุตที่จับได้ `chunks=0` หรือ `hasAudio=false` หมายความว่าเทิร์นผู้พูดเปิดขึ้นแต่ไม่มีเสียงที่ใช้ได้ไปถึง bridge realtime `interruptedPlayback=true` หมายความว่าเทิร์นอินพุตนั้นซ้อนทับเอาต์พุตผู้ช่วยและทริกเกอร์ตรรกะ barge-in

ฟิลด์ที่มีประโยชน์:

- `outputAudioMs`: ระยะเวลาเสียงผู้ช่วยที่สร้างโดยผู้ให้บริการ realtime ก่อนบรรทัดบันทึก
- `audioMs`: ระยะเวลาเสียงผู้ช่วยที่ OpenClaw นับก่อนหยุดการเล่น
- `elapsedMs`: เวลาตามนาฬิการะหว่างการเปิดและปิดสตรีมการเล่นหรือเทิร์นผู้พูด
- `discordBytes`: ไบต์ PCM สเตอริโอ 48 kHz ที่ส่งไปยังหรือรับจากเสียง Discord
- `realtimeBytes`: ไบต์ PCM รูปแบบผู้ให้บริการที่ส่งไปยังหรือรับจากผู้ให้บริการ realtime
- `playbackChunks`: ชิ้นส่วนเสียงผู้ช่วยที่ส่งต่อไปยัง Discord สำหรับการตอบสนองที่ทำงานอยู่
- `sinceLastAudioMs`: ช่องว่างระหว่างเฟรมเสียงผู้พูดที่จับได้ล่าสุดกับการปิดเทิร์นผู้พูด

รูปแบบทั่วไป:

- การตัดเสียงทันทีพร้อม `source=active-speaker-audio`, `outputAudioMs` น้อย และผู้ใช้คนเดิมอยู่ใกล้ ๆ มักชี้ไปที่ echo จากลำโพงเข้าสู่ไมค์ เพิ่ม `voice.realtime.minBargeInAudioEndMs`, ลดระดับเสียงลำโพง, ใช้หูฟัง หรือกำหนด `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`
- `source=speaker-start` ตามด้วย `speaker turn closed ... hasAudio=false` หมายความว่า Discord รายงานการเริ่มพูดแต่ไม่มีเสียงไปถึง OpenClaw นั่นอาจเป็นเหตุการณ์เสียง Discord ชั่วคราว พฤติกรรม noise gate หรือไคลเอนต์แตะเปิดไมค์ชั่วครู่
- `audio playback stopped reason=stream-close` โดยไม่มี barge-in หรือ `provider-clear-audio` อยู่ใกล้ ๆ หมายความว่าสตรีมการเล่น Discord ภายในเครื่องสิ้นสุดโดยไม่คาดคิด ตรวจสอบบันทึกผู้ให้บริการและผู้เล่น Discord ก่อนหน้านี้
- `capture ignored during playback (barge-in disabled)` หมายความว่า OpenClaw ตั้งใจทิ้งอินพุตขณะที่เสียงผู้ช่วยทำงานอยู่ เปิดใช้ `voice.realtime.bargeIn` หากคุณต้องการให้คำพูดขัดจังหวะการเล่น
- `barge-in ignored ... outputActive=false` หมายความว่า Discord หรือ VAD ของผู้ให้บริการรายงานคำพูด แต่ OpenClaw ไม่มีการเล่นที่ทำงานอยู่ให้ขัดจังหวะ สิ่งนี้ไม่ควรตัดเสียง

ข้อมูลประจำตัวจะถูก resolve แยกตามคอมโพเนนต์: auth ของเส้นทาง LLM สำหรับ `voice.model`, auth ของ STT สำหรับ `tools.media.audio`, auth ของ TTS สำหรับ `messages.tts`/`voice.tts` และ auth ของผู้ให้บริการ realtime สำหรับ `voice.realtime.providers` หรือการกำหนดค่า auth ปกติของผู้ให้บริการ

### ข้อความเสียง

ข้อความเสียง Discord แสดงตัวอย่าง waveform และต้องใช้เสียง OGG/Opus OpenClaw สร้าง waveform โดยอัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ Gateway เพื่อตรวจสอบและแปลง

- ระบุ **พาธไฟล์ภายในเครื่อง** (URL จะถูกปฏิเสธ)
- ไม่ต้องใส่เนื้อหาข้อความ (Discord ปฏิเสธข้อความ + ข้อความเสียงใน payload เดียวกัน)
- รองรับรูปแบบเสียงใดก็ได้ OpenClaw จะแปลงเป็น OGG/Opus ตามต้องการ

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ใช้อินเทนต์ที่ไม่อนุญาต หรือบอตไม่เห็นข้อความกิลด์">

    - เปิดใช้ Message Content Intent
    - เปิดใช้ Server Members Intent เมื่อคุณต้องพึ่งพาการระบุตัวตนผู้ใช้/สมาชิก
    - รีสตาร์ต Gateway หลังจากเปลี่ยนอินเทนต์

  </Accordion>

  <Accordion title="ข้อความกิลด์ถูกบล็อกโดยไม่คาดคิด">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบรายการอนุญาตของกิลด์ใต้ `channels.discord.guilds`
    - หากมีแผนที่ `channels` ของกิลด์ จะอนุญาตเฉพาะช่องที่ระบุไว้เท่านั้น
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

    - `groupPolicy="allowlist"` โดยไม่มีรายการอนุญาตของกิลด์/ช่องที่ตรงกัน
    - กำหนดค่า `requireMention` ผิดตำแหน่ง (ต้องอยู่ใต้ `channels.discord.guilds` หรือรายการช่อง)
    - ผู้ส่งถูกบล็อกโดยรายการอนุญาต `users` ของกิลด์/ช่อง

  </Accordion>

  <Accordion title="เทิร์น Discord ที่ทำงานนาน หรือการตอบซ้ำ">

    บันทึกทั่วไป:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    ปุ่มปรับคิว Gateway ของ Discord:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ค่านี้ควบคุมเฉพาะงาน listener ของ Gateway ของ Discord ไม่ใช่อายุการทำงานของเทิร์นเอเจนต์

    Discord ไม่ใช้ timeout ที่ช่องเป็นเจ้าของกับเทิร์นเอเจนต์ที่อยู่ในคิว ตัวรับฟังข้อความจะส่งต่องานทันที และงาน Discord ที่อยู่ในคิวจะรักษาลำดับต่อเซสชันไว้จนกว่าวงจรชีวิตของเซสชัน/tool/runtime จะเสร็จสิ้นหรือยกเลิกงาน

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
    OpenClaw ดึง metadata Discord `/gateway/bot` ก่อนเชื่อมต่อ ความล้มเหลวชั่วคราวจะ fallback ไปใช้ URL Gateway เริ่มต้นของ Discord และถูกจำกัดอัตราในบันทึก

    ปุ่มปรับ timeout ของ metadata:

    - บัญชีเดียว: `channels.discord.gatewayInfoTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env fallback เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - ค่าเริ่มต้น: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout ทำให้รีสตาร์ต">
    OpenClaw รอเหตุการณ์ `READY` ของ Gateway ของ Discord ระหว่างการเริ่มต้นและหลังจาก runtime เชื่อมต่อใหม่ การตั้งค่าหลายบัญชีที่มีการหน่วงเวลาเริ่มต้นแบบกระจายอาจต้องใช้ช่วงเวลา READY ตอนเริ่มต้นที่ยาวกว่าค่าเริ่มต้น

    ปุ่มปรับ READY timeout:

    - เริ่มต้น บัญชีเดียว: `channels.discord.gatewayReadyTimeoutMs`
    - เริ่มต้น หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - เริ่มต้น env fallback เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นตอนเริ่มต้น: `15000` (15 วินาที), สูงสุด: `120000`
    - runtime บัญชีเดียว: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - runtime env fallback เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ค่าเริ่มต้น runtime: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="การตรวจสอบสิทธิ์ไม่ตรงกัน">
    การตรวจสอบสิทธิ์ `channels status --probe` ใช้ได้เฉพาะกับ ID ช่องแบบตัวเลขเท่านั้น

    หากคุณใช้คีย์ slug การจับคู่ใน runtime ยังทำงานได้ แต่ probe ไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน

  </Accordion>

  <Accordion title="ปัญหา DM และการจับคู่">

    - ปิดใช้ DM: `channels.discord.dm.enabled=false`
    - ปิดใช้นโยบาย DM: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - กำลังรอการอนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูปบอตถึงบอต">
    โดยค่าเริ่มต้น ข้อความที่บอตเขียนจะถูกละเว้น

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎ mention และรายการอนุญาตที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมลูป
    แนะนำให้ใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความจากบอตที่ mention บอตเท่านั้น

    OpenClaw ยังมาพร้อม [การป้องกันลูปบอต](/th/channels/bot-loop-protection) แบบใช้ร่วมกัน เมื่อใดก็ตามที่ `allowBots` อนุญาตให้ข้อความที่บอตเขียนเข้าสู่ dispatch Discord จะแมปเหตุการณ์ขาเข้าเป็นข้อเท็จจริง `(account, channel, bot pair)` และตัวป้องกันคู่แบบทั่วไปจะระงับคู่นั้นหลังจากเกินงบเหตุการณ์ที่กำหนดไว้ ตัวป้องกันนี้ป้องกันลูปสองบอตที่หลุดควบคุม ซึ่งก่อนหน้านี้ต้องหยุดด้วย rate limit ของ Discord แต่จะไม่กระทบการติดตั้งใช้งานบอตตัวเดียว หรือการตอบกลับบอตแบบครั้งเดียวที่ยังอยู่ต่ำกว่างบ

    การตั้งค่าเริ่มต้น (ทำงานเมื่อมีการตั้งค่า `allowBots`):

    - `maxEventsPerWindow: 20` -- คู่บอตสามารถแลกเปลี่ยนข้อความได้ 20 ข้อความภายใน sliding window
    - `windowSeconds: 60` -- ความยาวของ sliding window
    - `cooldownSeconds: 60` -- เมื่อเกินงบ ข้อความบอตถึงบอตเพิ่มเติมทุกข้อความในทิศทางใดก็ตามจะถูกทิ้งเป็นเวลาหนึ่งนาที

    กำหนดค่าเริ่มต้นที่ใช้ร่วมกันหนึ่งครั้งใต้ `channels.defaults.botLoopProtection` จากนั้น override Discord เมื่อ workflow ที่ถูกต้องต้องการพื้นที่เพิ่มเติม ลำดับความสำคัญคือ:

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

  <Accordion title="Voice STT หลุดด้วย DecryptionFailed(...)">

    - ใช้ OpenClaw เวอร์ชันปัจจุบันอยู่เสมอ (`openclaw update`) เพื่อให้มีลอจิกกู้คืนการรับเสียงของ Discord
    - ยืนยันว่า `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้น upstream) และปรับเฉพาะเมื่อจำเป็น
    - ดูบันทึกสำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากความล้มเหลวยังดำเนินต่อหลังจาก rejoin อัตโนมัติ ให้รวบรวมบันทึกและเปรียบเทียบกับประวัติการรับ DAVE upstream ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## เอกสารอ้างอิงการกำหนดค่า

เอกสารอ้างอิงหลัก: [เอกสารอ้างอิงการกำหนดค่า - Discord](/th/gateway/config-channels#discord)

<Accordion title="ฟิลด์ Discord ที่ให้สัญญาณสำคัญ">

- การเริ่มต้น/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- นโยบาย: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- คำสั่ง: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- คิวเหตุการณ์: `eventQueue.listenerTimeout` (งบ listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- การตอบกลับ/ประวัติ: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่ง: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- การสตรีม: `streaming` (alias legacy: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- สื่อ/การลองใหม่: `mediaMaxMb` (จำกัดการอัปโหลดขาออกของ Discord, ค่าเริ่มต้น `100MB`), `retry`
- การดำเนินการ: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ฟีเจอร์: `threadBindings`, `bindings[]` ระดับบนสุด (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการปฏิบัติการ

- ปฏิบัติกับโทเคนบอตเป็นความลับ (แนะนำ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการควบคุม)
- ให้สิทธิ์ Discord ตามหลักสิทธิ์น้อยที่สุด
- หากสถานะ deploy/state ของคำสั่งล้าสมัย ให้รีสตาร์ต Gateway และตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Discord กับ Gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรมแชตกลุ่มและรายการอนุญาต
  </Card>
  <Card title="การกำหนดเส้นทางช่อง" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    Threat model และการเสริมความแข็งแกร่ง
  </Card>
  <Card title="การกำหนดเส้นทางหลายเอเจนต์" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกิลด์และช่องไปยังเอเจนต์
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่ง native
  </Card>
</CardGroup>
