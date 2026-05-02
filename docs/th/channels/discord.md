---
read_when:
    - การทำงานกับฟีเจอร์ช่องทาง Discord
summary: สถานะการรองรับบอต Discord ความสามารถ และการกำหนดค่า
title: Discord
x-i18n:
    generated_at: "2026-05-02T10:07:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 42223982a8bfd288d29a1f402b37141557718a407537011956b878b91b894e62
    source_path: channels/discord.md
    workflow: 16
---

พร้อมใช้งานสำหรับ DM และช่องกิลด์ผ่าน Discord gateway อย่างเป็นทางการ

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    Discord DM ใช้โหมดจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องและขั้นตอนการซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

คุณต้องสร้างแอปพลิเคชันใหม่พร้อมบอต เพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ และจับคู่กับ OpenClaw เราแนะนำให้เพิ่มบอตของคุณไปยังเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากยังไม่มี [ให้สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="สร้างแอปพลิเคชันและบอต Discord">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อเป็นอย่างเช่น "OpenClaw"

    คลิก **Bot** บนแถบด้านข้าง ตั้งค่า **Username** เป็นชื่อที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้งาน privileged intents">
    ยังคงอยู่ที่หน้า **Bot** เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้งาน:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับรายการอนุญาตตามบทบาทและการจับคู่ชื่อกับ ID)
    - **Presence Intent** (ไม่บังคับ; จำเป็นเฉพาะสำหรับการอัปเดตสถานะ)

  </Step>

  <Step title="คัดลอกโทเค็นบอตของคุณ">
    เลื่อนกลับขึ้นไปที่หน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อจะเป็นเช่นนั้น แต่ขั้นตอนนี้จะสร้างโทเค็นแรกของคุณ โดยไม่มีสิ่งใดถูก "รีเซ็ต"
    </Note>

    คัดลอกโทเค็นและบันทึกไว้ที่ใดที่หนึ่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในอีกไม่นาน

  </Step>

  <Step title="สร้าง URL คำเชิญและเพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** บนแถบด้านข้าง คุณจะสร้าง URL คำเชิญพร้อมสิทธิ์ที่ถูกต้องเพื่อเพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ

    เลื่อนลงไปที่ **OAuth2 URL Generator** แล้วเปิดใช้งาน:

    - `bot`
    - `applications.commands`

    ส่วน **Bot Permissions** จะปรากฏด้านล่าง เปิดใช้งานอย่างน้อย:

    **สิทธิ์ทั่วไป**
      - ดูช่อง
    **สิทธิ์ข้อความ**
      - ส่งข้อความ
      - อ่านประวัติข้อความ
      - ฝังลิงก์
      - แนบไฟล์
      - เพิ่มรีแอ็กชัน (ไม่บังคับ)

    นี่คือชุดพื้นฐานสำหรับช่องข้อความปกติ หากคุณวางแผนจะโพสต์ในเธรด Discord รวมถึงเวิร์กโฟลว์ของช่องฟอรัมหรือสื่อที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้งาน **Send Messages in Threads** ด้วย
    คัดลอก URL ที่สร้างขึ้นที่ด้านล่าง วางลงในเบราว์เซอร์ของคุณ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอตของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิดใช้งานโหมดนักพัฒนาและรวบรวม ID ของคุณ">
    กลับไปที่แอป Discord คุณต้องเปิดใช้งานโหมดนักพัฒนาเพื่อให้คัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนเฟืองถัดจากอวาตาร์ของคุณ) → **Advanced** → เปิด **Developer Mode**
    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ของคุณไว้ข้าง ๆ Bot Token เพราะคุณจะส่งทั้งสามอย่างไปยัง OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาต DM จากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงานได้ Discord ต้องอนุญาตให้บอตของคุณส่ง DM ถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณ → **Privacy Settings** → เปิด **Direct Messages**

    การตั้งค่านี้ให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอต) ส่ง DM ถึงคุณได้ เปิดใช้งานค่านี้ไว้หากคุณต้องการใช้ Discord DM กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่องกิลด์ คุณสามารถปิด DM ได้หลังจากจับคู่แล้ว

  </Step>

  <Step title="ตั้งค่าโทเค็นบอตของคุณอย่างปลอดภัย (อย่าส่งในแชต)">
    โทเค็นบอต Discord ของคุณเป็นความลับ (เหมือนรหัสผ่าน) ตั้งค่าไว้บนเครื่องที่รัน OpenClaw ก่อนส่งข้อความหาเอเจนต์ของคุณ

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
    สำหรับการติดตั้งแบบบริการที่มีการจัดการ ให้รัน `openclaw gateway install` จากเชลล์ที่มี `DISCORD_BOT_TOKEN` อยู่ หรือเก็บตัวแปรไว้ใน `~/.openclaw/.env` เพื่อให้บริการสามารถแก้ค่า env SecretRef ได้หลังจากรีสตาร์ท
    หากโฮสต์ของคุณถูกบล็อกหรือถูกจำกัดอัตราโดยการค้นหาแอปพลิเคชันตอนเริ่มต้นของ Discord ให้ตั้งค่า ID แอปพลิเคชัน/ไคลเอนต์ Discord จาก Developer Portal เพื่อให้การเริ่มต้นข้าม REST call นั้นได้ ใช้ `channels.discord.applicationId` สำหรับบัญชีเริ่มต้น หรือ `channels.discord.accounts.<accountId>.applicationId` เมื่อคุณรันบอต Discord หลายตัว

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        แชตกับเอเจนต์ OpenClaw ของคุณบนช่องที่มีอยู่ใดก็ได้ (เช่น Telegram) แล้วบอกเอเจนต์ หาก Discord เป็นช่องแรกของคุณ ให้ใช้แท็บ CLI / config แทน

        > "ฉันตั้งค่าโทเค็นบอต Discord ใน config แล้ว โปรดตั้งค่า Discord ให้เสร็จสิ้นด้วย User ID `<user_id>` และ Server ID `<server_id>`"
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

        สำหรับการตั้งค่าแบบสคริปต์หรือระยะไกล ให้เขียนบล็อก JSON5 เดียวกันด้วย `openclaw config patch --file ./discord.patch.json5 --dry-run` แล้วรันอีกครั้งโดยไม่มี `--dry-run` รองรับค่า `token` แบบข้อความธรรมดา และรองรับค่า SecretRef สำหรับ `channels.discord.token` ผ่านผู้ให้บริการ env/file/exec ด้วย ดู [การจัดการความลับ](/th/gateway/secrets)

        สำหรับบอต Discord หลายตัว ให้เก็บโทเค็นบอตและ ID แอปพลิเคชันแต่ละรายการไว้ใต้บัญชีของตัวเอง `channels.discord.applicationId` ระดับบนสุดจะถูกสืบทอดโดยบัญชีต่าง ๆ ดังนั้นให้ตั้งค่าไว้ที่นั่นเฉพาะเมื่อทุกบัญชีควรใช้ ID แอปพลิเคชันเดียวกัน

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
การแก้ค่าโทเค็นรับรู้ตามบัญชี ค่าโทเค็นใน config มีลำดับความสำคัญเหนือ env fallback `DISCORD_BOT_TOKEN` ใช้เฉพาะกับบัญชีเริ่มต้นเท่านั้น
หากบัญชี Discord ที่เปิดใช้งานสองบัญชีแก้ค่าเป็นโทเค็นบอตเดียวกัน OpenClaw จะเริ่ม gateway monitor เพียงตัวเดียวสำหรับโทเค็นนั้น โทเค็นที่มาจาก config มีลำดับความสำคัญเหนือ env fallback เริ่มต้น มิฉะนั้นบัญชีที่เปิดใช้งานบัญชีแรกจะชนะ และบัญชีที่ซ้ำจะถูกรายงานว่าปิดใช้งาน
สำหรับการเรียกขาออกขั้นสูง (เครื่องมือข้อความ/การดำเนินการช่อง) จะใช้ `token` ต่อการเรียกที่ระบุชัดเจนสำหรับการเรียกนั้น สิ่งนี้ใช้กับการดำเนินการแบบส่งและอ่าน/ตรวจสอบ (ตัวอย่างเช่น read/search/fetch/thread/pins/permissions) การตั้งค่านโยบายบัญชี/การลองใหม่ยังคงมาจากบัญชีที่เลือกในสแนปช็อต runtime ที่ใช้งานอยู่
</Note>

## แนะนำ: ตั้งค่าพื้นที่ทำงานกิลด์

เมื่อ DM ทำงานแล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็นพื้นที่ทำงานเต็มรูปแบบที่แต่ละช่องมีเซสชันเอเจนต์ของตัวเองพร้อมบริบทของตัวเอง แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีเพียงคุณและบอตของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณไปยังรายการอนุญาตกิลด์">
    การตั้งค่านี้ทำให้เอเจนต์ของคุณตอบกลับในช่องใดก็ได้บนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ DM

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เพิ่ม Discord Server ID `<server_id>` ของฉันไปยังรายการอนุญาตกิลด์"
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
    โดยค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในช่องกิลด์เฉพาะเมื่อถูก @mentioned เท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณอาจต้องการให้ตอบกลับทุกข้อความ

    ในช่องกิลด์ คำตอบสุดท้ายปกติของผู้ช่วยยังคงเป็นส่วนตัวตามค่าเริ่มต้น เอาต์พุต Discord ที่มองเห็นได้ต้องส่งอย่างชัดเจนด้วยเครื่องมือ `message` เพื่อให้เอเจนต์สามารถเฝ้าดูเงียบ ๆ เป็นค่าเริ่มต้นและโพสต์เฉพาะเมื่อเห็นว่าการตอบกลับในช่องมีประโยชน์

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
    โดยค่าเริ่มต้น หน่วยความจำระยะยาว (MEMORY.md) จะโหลดเฉพาะในเซสชัน DM ช่องกิลด์จะไม่โหลด MEMORY.md โดยอัตโนมัติ

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เมื่อฉันถามคำถามในช่อง Discord ให้ใช้ memory_search หรือ memory_get หากคุณต้องการบริบทระยะยาวจาก MEMORY.md"
      </Tab>
      <Tab title="Manual">
        หากคุณต้องการบริบทร่วมในทุกช่อง ให้ใส่คำสั่งที่คงที่ไว้ใน `AGENTS.md` หรือ `USER.md` (ไฟล์เหล่านี้จะถูกแทรกสำหรับทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงเมื่อจำเป็นด้วยเครื่องมือหน่วยความจำ
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างช่องบางช่องบนเซิร์ฟเวอร์ Discord ของคุณแล้วเริ่มแชต เอเจนต์ของคุณมองเห็นชื่อช่องได้ และแต่ละช่องจะมีเซสชันแยกของตัวเอง ดังนั้นคุณจึงตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ได้ที่เหมาะกับเวิร์กโฟลว์ของคุณ

## โมเดล runtime

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord
- การกำหนดเส้นทางการตอบกลับเป็นแบบกำหนดแน่นอน: คำตอบขาเข้าจาก Discord จะตอบกลับไปยัง Discord
- เมทาดาทาของ Discord guild/channel จะถูกเพิ่มลงในพรอมป์ของโมเดลเป็นบริบทที่ไม่น่าเชื่อถือ
  ไม่ใช่คำนำหน้าคำตอบที่ผู้ใช้มองเห็น หากโมเดลคัดลอก envelope นั้น
  กลับมา OpenClaw จะตัดเมทาดาทาที่ถูกคัดลอกออกจากคำตอบขาออกและจาก
  บริบท replay ในอนาคต
- โดยค่าเริ่มต้น (`session.dmScope=main`) แชตโดยตรงจะแชร์เซสชันหลักของ agent (`agent:main:main`)
- ช่อง Guild จะเป็นคีย์เซสชันที่แยกกัน (`agent:<agentId>:discord:channel:<channelId>`)
- Group DM จะถูกละเว้นโดยค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่ง slash แบบเนทีฟจะทำงานในเซสชันคำสั่งที่แยกกัน (`agent:<agentId>:discord:slash:<userId>`) ในขณะที่ยังคงพก `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่ถูกกำหนดเส้นทาง
- การส่งประกาศ Cron/Heartbeat แบบข้อความเท่านั้นไปยัง Discord จะใช้คำตอบสุดท้าย
  ที่ผู้ช่วยมองเห็นได้เพียงครั้งเดียว เพย์โหลดสื่อและคอมโพเนนต์แบบมีโครงสร้างยังคงเป็น
  หลายข้อความเมื่อ agent ส่งเพย์โหลดที่ส่งมอบได้หลายรายการ

## ช่องฟอรัม

ช่องฟอรัมและช่องสื่อของ Discord ยอมรับเฉพาะโพสต์ใน thread เท่านั้น OpenClaw รองรับการสร้างได้สองวิธี:

- ส่งข้อความไปยัง parent ของฟอรัม (`channel:<forumId>`) เพื่อสร้าง thread อัตโนมัติ ชื่อ thread จะใช้บรรทัดแรกที่ไม่ว่างของข้อความของคุณ
- ใช้ `openclaw message thread create` เพื่อสร้าง thread โดยตรง อย่าส่ง `--message-id` สำหรับช่องฟอรัม

ตัวอย่าง: ส่งไปยัง parent ของฟอรัมเพื่อสร้าง thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

ตัวอย่าง: สร้าง thread ฟอรัมอย่างชัดเจน

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Parent ของฟอรัมไม่ยอมรับคอมโพเนนต์ Discord หากคุณต้องการคอมโพเนนต์ ให้ส่งไปยัง thread นั้นเอง (`channel:<threadId>`)

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับคอนเทนเนอร์คอมโพเนนต์ Discord v2 สำหรับข้อความของ agent ใช้เครื่องมือข้อความพร้อมเพย์โหลด `components` ผลลัพธ์การโต้ตอบจะถูกกำหนดเส้นทางกลับไปยัง agent เป็นข้อความขาเข้าปกติ และทำตามการตั้งค่า `replyToMode` ของ Discord ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถวการกระทำรองรับปุ่มได้สูงสุด 5 ปุ่มหรือเมนูเลือกเดี่ยวหนึ่งรายการ
- ประเภทการเลือก: `string`, `user`, `role`, `mentionable`, `channel`

โดยค่าเริ่มต้น คอมโพเนนต์ใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่ออนุญาตให้ใช้ปุ่ม รายการเลือก และฟอร์มได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดว่าใครสามารถคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (ID ผู้ใช้ Discord, tag หรือ `*`) เมื่อกำหนดค่าแล้ว ผู้ใช้ที่ไม่ตรงกันจะได้รับการปฏิเสธแบบ ephemeral

คำสั่ง slash `/model` และ `/models` จะเปิดตัวเลือกโมเดลแบบโต้ตอบพร้อมดรอปดาวน์ provider, โมเดล และ runtime ที่เข้ากันได้ รวมถึงขั้นตอน Submit `/models add` เลิกใช้แล้ว และตอนนี้จะส่งคืนข้อความแจ้งการเลิกใช้แทนการลงทะเบียนโมเดลจากแชต คำตอบของตัวเลือกเป็นแบบ ephemeral และมีเพียงผู้ใช้ที่เรียกใช้เท่านั้นที่สามารถใช้งานได้

ไฟล์แนบ:

- บล็อก `file` ต้องชี้ไปยังการอ้างอิงไฟล์แนบ (`attachment://<filename>`)
- ระบุไฟล์แนบผ่าน `media`/`path`/`filePath` (ไฟล์เดียว); ใช้ `media-gallery` สำหรับหลายไฟล์
- ใช้ `filename` เพื่อแทนที่ชื่ออัปโหลดเมื่อควรตรงกับการอ้างอิงไฟล์แนบ

ฟอร์ม Modal:

- เพิ่ม `components.modal` ที่มีได้สูงสุด 5 ฟิลด์
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
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM `channels.discord.allowFrom` คือ allowlist ของ DM แบบ canonical

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.discord.allowFrom` รวม `"*"`)
    - `disabled`

    หากนโยบาย DM ไม่ใช่ open ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือถูกแจ้งให้ pairing ในโหมด `pairing`)

    ลำดับความสำคัญแบบหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - สำหรับบัญชีเดียว `allowFrom` มีลำดับความสำคัญเหนือ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อ `allowFrom` ของตัวเองและ `dm.allowFrom` แบบเดิมไม่ได้ตั้งค่า
    - บัญชีที่มีชื่อไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    `channels.discord.dm.policy` และ `channels.discord.dm.allowFrom` แบบเดิมยังคงถูกอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านั้นไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การ mention `<@id>`

    ID ตัวเลขเปล่าโดยปกติจะ resolve เป็น ID ช่องเมื่อมีค่าเริ่มต้นของช่องที่ใช้งานอยู่ แต่ ID ที่อยู่ใน DM `allowFrom` ที่มีผลของบัญชีจะถูกถือเป็นเป้าหมาย DM ของผู้ใช้เพื่อความเข้ากันได้

  </Tab>

  <Tab title="DM access groups">
    DM ของ Discord สามารถใช้รายการ `accessGroup:<name>` แบบไดนามิกใน `channels.discord.allowFrom`

    ชื่อ access group ใช้ร่วมกันระหว่างช่องข้อความ ใช้ `type: "message.senders"` สำหรับกลุ่มแบบ static ที่สมาชิกแสดงด้วยไวยากรณ์ `allowFrom` ปกติของแต่ละช่อง หรือ `type: "discord.channelAudience"` เมื่อผู้ชม `ViewChannel` ปัจจุบันของช่อง Discord ควรกำหนดสมาชิกแบบไดนามิก พฤติกรรม access-group ที่ใช้ร่วมกันมีเอกสารที่นี่: [กลุ่มการเข้าถึง](/th/channels/access-groups)

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

    ช่องข้อความ Discord ไม่มีรายชื่อสมาชิกแยกต่างหาก `type: "discord.channelAudience"` โมเดลสมาชิกเป็น: ผู้ส่ง DM เป็นสมาชิกของ guild ที่กำหนดค่าไว้ และขณะนี้มีสิทธิ์ `ViewChannel` ที่มีผลบนช่องที่กำหนดค่าไว้หลังจากใช้ role และการเขียนทับของช่องแล้ว

    ตัวอย่าง: อนุญาตให้ทุกคนที่เห็น `#maintainers` สามารถ DM บอตได้ ในขณะที่ยังคงปิด DM สำหรับคนอื่นทั้งหมด

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

    คุณสามารถผสมรายการแบบไดนามิกและแบบ static ได้:

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

    การค้นหาจะล้มเหลวแบบปิด หาก Discord ส่งคืน `Missing Access` การค้นหาสมาชิกล้มเหลว หรือช่องเป็นของ guild อื่น ผู้ส่ง DM จะถูกถือว่าไม่ได้รับอนุญาต

    เปิดใช้ **Server Members Intent** ใน Discord Developer Portal สำหรับบอตเมื่อใช้ access group แบบ channel-audience DM ไม่มีสถานะสมาชิก guild ดังนั้น OpenClaw จะ resolve สมาชิกผ่าน Discord REST ขณะตรวจสอบสิทธิ์

  </Tab>

  <Tab title="Guild policy">
    การจัดการ Guild ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Baseline ที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    พฤติกรรมของ `allowlist`:

    - guild ต้องตรงกับ `channels.discord.guilds` (แนะนำให้ใช้ `id`, ยอมรับ slug)
    - allowlist ของผู้ส่งแบบไม่บังคับ: `users` (แนะนำ ID ที่เสถียร) และ `roles` (เฉพาะ role ID); หากกำหนดค่าอย่างใดอย่างหนึ่ง ผู้ส่งจะได้รับอนุญาตเมื่อจับคู่กับ `users` หรือ `roles`
    - การจับคู่ name/tag โดยตรงถูกปิดใช้งานโดยค่าเริ่มต้น; เปิดใช้ `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเป็นโหมดความเข้ากันได้แบบ break-glass
    - รองรับ names/tags สำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อใช้รายการ name/tag
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

    หากคุณตั้งค่าเฉพาะ `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` fallback ของ runtime คือ `groupPolicy="allowlist"` (พร้อมคำเตือนในบันทึก) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`

  </Tab>

  <Tab title="Mentions and group DMs">
    ข้อความ Guild ถูก gate ด้วย mention โดยค่าเริ่มต้น

    การตรวจจับ mention รวมถึง:

    - การ mention บอตอย่างชัดเจน
    - รูปแบบ mention ที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรม reply-to-bot โดยนัยในกรณีที่รองรับ

    เมื่อเขียนข้อความ Discord ขาออก ให้ใช้ไวยากรณ์ mention แบบ canonical: `<@USER_ID>` สำหรับผู้ใช้, `<#CHANNEL_ID>` สำหรับช่อง และ `<@&ROLE_ID>` สำหรับ role อย่าใช้รูปแบบ mention ชื่อเล่นแบบเดิม `<@!USER_ID>`

    `requireMention` ถูกกำหนดค่าต่อ guild/channel (`channels.discord.guilds...`)
    `ignoreOtherMentions` สามารถเลือกให้ทิ้งข้อความที่ mention ผู้ใช้/role อื่นแต่ไม่ใช่บอต (ยกเว้น @everyone/@here)

    Group DM:

    - ค่าเริ่มต้น: ถูกละเว้น (`dm.groupEnabled=false`)
    - allowlist แบบไม่บังคับผ่าน `dm.groupChannels` (ID ช่องหรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทาง agent ตาม role

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิก guild ของ Discord ไปยัง agent ที่ต่างกันตาม role ID binding แบบ role-based ยอมรับเฉพาะ role ID และจะถูกประเมินหลังจาก binding แบบ peer หรือ parent-peer และก่อน binding แบบ guild-only หาก binding ตั้งค่าฟิลด์ match อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ฟิลด์ที่กำหนดค่าทั้งหมดต้องตรงกัน

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
- การแทนที่เฉพาะช่องทาง: `channels.discord.commands.native`
- `commands.native=false` จะล้างคำสั่งเนทีฟของ Discord ที่เคยลงทะเบียนไว้ก่อนหน้านี้อย่างชัดเจน
- การตรวจสอบสิทธิ์คำสั่งเนทีฟใช้ allowlist/นโยบายของ Discord ชุดเดียวกับการจัดการข้อความปกติ
- คำสั่งอาจยังมองเห็นได้ในส่วนติดต่อผู้ใช้ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต แต่การเรียกใช้ยังคงบังคับใช้การตรวจสอบสิทธิ์ของ OpenClaw และส่งคืน "ไม่ได้รับอนุญาต"

ดู [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแคตตาล็อกคำสั่งและลักษณะการทำงาน

การตั้งค่าคำสั่ง Slash เริ่มต้น:

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

    หมายเหตุ: `off` ปิดการทำเธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` ที่ระบุอย่างชัดเจนยังคงมีผล
    `first` จะแนบการอ้างอิงการตอบกลับเนทีฟโดยนัยกับข้อความ Discord ขาออกแรกของรอบนั้นเสมอ
    `batched` จะแนบการอ้างอิงการตอบกลับเนทีฟโดยนัยของ Discord ก็ต่อเมื่อ
    รอบข้อความขาเข้าเป็นชุดข้อความหลายรายการที่ถูกดีเบานซ์แล้วเท่านั้น สิ่งนี้มีประโยชน์
    เมื่อคุณต้องการใช้การตอบกลับเนทีฟเป็นหลักสำหรับแชตที่มาเป็นชุดและกำกวม ไม่ใช่ทุก
    รอบข้อความเดี่ยว

    รหัสข้อความจะแสดงในบริบท/ประวัติ เพื่อให้เอเจนต์สามารถกำหนดเป้าหมายข้อความเฉพาะได้

  </Accordion>

  <Accordion title="ตัวอย่างสตรีมสด">
    OpenClaw สามารถสตรีมฉบับร่างของคำตอบได้โดยส่งข้อความชั่วคราวและแก้ไขข้อความนั้นเมื่อมีข้อความใหม่เข้ามา `channels.discord.streaming` รับค่า `off` (ค่าเริ่มต้น) | `partial` | `block` | `progress` โดย `progress` จะแมปเป็น `partial` บน Discord; `streamMode` เป็นนามแฝงรุ่นเก่าและจะถูกย้ายค่าอัตโนมัติ

    ค่าเริ่มต้นยังคงเป็น `off` เพราะการแก้ไขตัวอย่างบน Discord จะชนขีดจำกัดอัตราอย่างรวดเร็วเมื่อมีบอตหรือ Gateway หลายตัวใช้บัญชีร่วมกัน

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

    - `partial` แก้ไขข้อความตัวอย่างรายการเดียวเมื่อโทเคนเข้ามา
    - `block` ส่งชิ้นส่วนขนาดฉบับร่าง (ใช้ `draftChunk` เพื่อปรับขนาดและจุดตัด โดยถูกจำกัดไม่ให้เกิน `textChunkLimit`)
    - สื่อ ข้อผิดพลาด และผลลัพธ์สุดท้ายแบบตอบกลับชัดเจนจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความตัวอย่างซ้ำหรือไม่

    การสตรีมตัวอย่างรองรับเฉพาะข้อความเท่านั้น; การตอบกลับที่เป็นสื่อจะย้อนกลับไปใช้การส่งตามปกติ เมื่อเปิดใช้งานการสตรีมแบบ `block` อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

  </Accordion>

  <Accordion title="ประวัติ บริบท และลักษณะการทำงานของเธรด">
    บริบทประวัติกิลด์:

    - ค่าเริ่มต้นของ `channels.discord.historyLimit` คือ `20`
    - ค่าสำรอง: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    การควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    ลักษณะการทำงานของเธรด:

    - เธรด Discord จะถูกกำหนดเส้นทางเป็นเซสชันของช่องทางและสืบทอดการกำหนดค่าช่องทางหลัก เว้นแต่จะถูกแทนที่
    - เซสชันเธรดจะสืบทอดการเลือก `/model` ระดับเซสชันของช่องทางหลักเป็นค่าสำรองเฉพาะโมเดล; การเลือก `/model` ภายในเธรดยังคงมีลำดับความสำคัญเหนือกว่า และประวัติทรานสคริปต์ของช่องทางหลักจะไม่ถูกคัดลอก เว้นแต่จะเปิดใช้งานการสืบทอดทรานสคริปต์
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) ให้เธรดอัตโนมัติใหม่เริ่มต้นด้วยข้อมูลจากทรานสคริปต์ของช่องทางหลัก การแทนที่รายบัญชีอยู่ใต้ `channels.discord.accounts.<id>.thread.inheritParent`
    - รีแอ็กชันของเครื่องมือข้อความสามารถแก้เป้าหมาย DM แบบ `user:<id>` ได้
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะถูกเก็บไว้ระหว่างค่าสำรองการเปิดใช้งานในขั้นตอนตอบกลับ

    หัวข้อช่องทางจะถูกแทรกเป็นบริบทที่ **ไม่น่าเชื่อถือ** Allowlists ใช้จำกัดว่าใครสามารถเรียกเอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบเต็มรูปแบบ

  </Accordion>

  <Accordion title="เซสชันที่ผูกกับเธรดสำหรับเอเจนต์ย่อย">
    Discord สามารถผูกเธรดกับเป้าหมายเซสชัน เพื่อให้ข้อความติดตามผลในเธรดนั้นยังคงถูกกำหนดเส้นทางไปยังเซสชันเดิม (รวมถึงเซสชันเอเจนต์ย่อย)

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/ใหม่กับเป้าหมายเอเจนต์ย่อย/เซสชัน
    - `/unfocus` ลบการผูกเธรดปัจจุบัน
    - `/agents` แสดงการรันที่ใช้งานอยู่และสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งานสำหรับการผูกที่ถูกโฟกัส
    - `/session max-age <duration|off>` ตรวจสอบ/อัปเดตอายุสูงสุดแบบตายตัวสำหรับการผูกที่ถูกโฟกัส

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

    - `session.threadBindings.*` ตั้งค่าเริ่มต้นส่วนกลาง
    - `channels.discord.threadBindings.*` แทนที่ลักษณะการทำงานของ Discord
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดอัตโนมัติสำหรับ `sessions_spawn({ thread: true })` และการสร้างเธรด ACP ค่าเริ่มต้น: `true`
    - `defaultSpawnContext` ควบคุมบริบทเอเจนต์ย่อยเนทีฟสำหรับการสร้างที่ผูกกับเธรด ค่าเริ่มต้น: `"fork"`
    - คีย์ `spawnSubagentSessions`/`spawnAcpSessions` ที่เลิกใช้แล้วจะถูกย้ายค่าโดย `openclaw doctor --fix`
    - หากปิดใช้งานการผูกเธรดสำหรับบัญชีหนึ่ง `/focus` และการดำเนินการผูกเธรดที่เกี่ยวข้องจะใช้งานไม่ได้

    ดู [เอเจนต์ย่อย](/th/tools/subagents), [เอเจนต์ ACP](/th/tools/acp-agents), และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="การผูกช่องทาง ACP แบบคงอยู่">
    สำหรับพื้นที่ทำงาน ACP แบบ "เปิดตลอดเวลา" ที่เสถียร ให้กำหนดค่าการผูก ACP แบบมีชนิดระดับบนสุดซึ่งกำหนดเป้าหมายไปยังการสนทนา Discord

    พาธการกำหนดค่า:

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

    - `/acp spawn codex --bind here` ผูกช่องทางหรือเธรดปัจจุบันไว้ ณ ตำแหน่งเดิม และทำให้ข้อความในอนาคตอยู่ในเซสชัน ACP เดิม ข้อความเธรดจะสืบทอดการผูกของช่องทางหลัก
    - ในช่องทางหรือเธรดที่ถูกผูกไว้ `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP เดิม ณ ตำแหน่งเดิม การผูกเธรดชั่วคราวสามารถแทนที่การแก้เป้าหมายได้ขณะที่เปิดใช้งานอยู่
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดลูกผ่าน `--thread auto|here`

    ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับรายละเอียดลักษณะการทำงานของการผูก

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
    - ค่าสำรองอีโมจิของตัวตนเอเจนต์ (`agents.list[].identity.emoji` มิฉะนั้นใช้ "👀")

    หมายเหตุ:

    - Discord ยอมรับอีโมจิยูนิโค้ดหรือชื่ออีโมจิที่กำหนดเอง
    - ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับช่องทางหรือบัญชี

  </Accordion>

  <Accordion title="การเขียนการกำหนดค่า">
    การเขียนการกำหนดค่าที่เริ่มจากช่องทางเปิดใช้งานตามค่าเริ่มต้น

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
    กำหนดเส้นทางทราฟฟิก WebSocket ของ Gateway Discord และการค้นหา REST ตอนเริ่มต้น (รหัสแอปพลิเคชัน + การแก้ค่า allowlist) ผ่านพร็อกซี HTTP(S) ด้วย `channels.discord.proxy`

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
    เปิดใช้งานการแก้ค่า PluralKit เพื่อแมปข้อความที่ถูกพร็อกซีไปยังตัวตนสมาชิกระบบ:

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
    - ชื่อที่แสดงของสมาชิกจะถูกจับคู่ด้วยชื่อ/slug เท่านั้นเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การค้นหาใช้รหัสข้อความเดิมและถูกจำกัดด้วยกรอบเวลา
    - หากการค้นหาล้มเหลว ข้อความที่ถูกพร็อกซีจะถูกปฏิบัติเป็นข้อความบอตและถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="นามแฝงการกล่าวถึงขาออก">
    ใช้ `mentionAliases` เมื่อเอเจนต์ต้องการการกล่าวถึงขาออกที่กำหนดแน่นอนสำหรับผู้ใช้ Discord ที่รู้จัก คีย์คือแฮนเดิลที่ไม่มี `@` นำหน้า; ค่าคือรหัสผู้ใช้ Discord แฮนเดิลที่ไม่รู้จัก, `@everyone`, `@here`, และการกล่าวถึงภายใน code spans ของ Markdown จะถูกปล่อยไว้ไม่เปลี่ยนแปลง

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

    ตัวอย่างกิจกรรม (สถานะกำหนดเองเป็นชนิดกิจกรรมเริ่มต้น):

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

    Presence อัตโนมัติจะแมปความพร้อมใช้งานของรันไทม์กับสถานะ Discord: ปกติ => ออนไลน์, เสื่อมคุณภาพหรือไม่ทราบ => ไม่อยู่, ใช้หมดหรือไม่พร้อมใช้งาน => ห้ามรบกวน การแทนที่ข้อความแบบไม่บังคับ:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับตัวแทนค่า `{reason}`)

  </Accordion>

  <Accordion title="การอนุมัติใน Discord">
    Discord รองรับการจัดการการอนุมัติด้วยปุ่มใน DM และสามารถโพสต์พรอมป์การอนุมัติในช่องทางต้นทางได้แบบไม่บังคับ

    พาธการกำหนดค่า:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; ย้อนกลับไปใช้ `commands.ownerAllowFrom` เมื่อเป็นไปได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord เปิดใช้การอนุมัติ exec แบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และสามารถระบุผู้อนุมัติได้อย่างน้อยหนึ่งราย ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมานผู้อนุมัติ exec จาก `allowFrom` ของช่อง, `dm.allowFrom` แบบเก่า หรือ `defaultTo` ของข้อความส่วนตัว ตั้งค่า `enabled: false` เพื่อปิดใช้ Discord ในฐานะไคลเอนต์การอนุมัติแบบเนทีฟอย่างชัดเจน

    สำหรับคำสั่งกลุ่มที่มีความละเอียดอ่อนและใช้ได้เฉพาะ owner เท่านั้น เช่น `/diagnostics` และ `/export-trajectory` OpenClaw จะส่งพรอมป์อนุมัติและผลลัพธ์สุดท้ายแบบส่วนตัว โดยจะลองใช้ Discord DM ก่อนเมื่อ owner ที่เรียกใช้มีเส้นทาง owner ของ Discord หากไม่มี จะย้อนกลับไปใช้เส้นทาง owner แรกที่พร้อมใช้งานจาก `commands.ownerAllowFrom` เช่น Telegram

    เมื่อ `target` เป็น `channel` หรือ `both` พรอมป์อนุมัติจะมองเห็นได้ในช่อง เฉพาะผู้อนุมัติที่ระบุได้แล้วเท่านั้นที่ใช้ปุ่มได้ ผู้ใช้อื่นจะได้รับการปฏิเสธแบบ ephemeral พรอมป์อนุมัติจะมีข้อความคำสั่งอยู่ด้วย ดังนั้นให้เปิดใช้การส่งไปยังช่องเฉพาะในช่องที่เชื่อถือได้เท่านั้น หากไม่สามารถหา ID ของช่องจากคีย์เซสชันได้ OpenClaw จะย้อนกลับไปส่งผ่าน DM

    Discord ยังเรนเดอร์ปุ่มอนุมัติร่วมที่ช่องแชทอื่นใช้ด้วย อะแดปเตอร์ Discord แบบเนทีฟจะเพิ่มการกำหนดเส้นทาง DM ของผู้อนุมัติและการกระจายไปยังช่องเป็นหลัก
    เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก; OpenClaw
    ควรรวมคำสั่ง `/approve` แบบด้วยตนเองเฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่า
    การอนุมัติผ่านแชทไม่พร้อมใช้งาน หรือการอนุมัติด้วยตนเองเป็นเส้นทางเดียวเท่านั้น
    หากรันไทม์การอนุมัติแบบเนทีฟของ Discord ไม่ทำงาน OpenClaw จะยังแสดง
    พรอมป์ `/approve <id> <decision>` แบบกำหนดแน่นอนในเครื่องไว้ หาก
    รันไทม์ทำงานอยู่แต่ไม่สามารถส่งการ์ดเนทีฟไปยังเป้าหมายใดได้
    OpenClaw จะส่งประกาศสำรองในแชทเดียวกันพร้อมคำสั่ง `/approve`
    ที่ตรงจากการอนุมัติที่ค้างอยู่

    การตรวจสอบสิทธิ์ Gateway และการแก้ผลการอนุมัติเป็นไปตามสัญญาไคลเอนต์ Gateway ร่วมกัน (`plugin:` IDs แก้ผ่าน `plugin.approval.resolve`; ID อื่นแก้ผ่าน `exec.approval.resolve`) การอนุมัติจะหมดอายุหลัง 30 นาทีตามค่าเริ่มต้น

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและ action gates

แอ็กชันข้อความของ Discord รวมถึงการส่งข้อความ การดูแลช่อง การกลั่นกรอง presence และแอ็กชัน metadata

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- ปฏิกิริยา: `react`, `reactions`, `emojiList`
- การกลั่นกรอง: `timeout`, `kick`, `ban`
- presence: `setPresence`

แอ็กชัน `event-create` รับพารามิเตอร์ `image` แบบไม่บังคับ (URL หรือพาธไฟล์ในเครื่อง) เพื่อตั้งค่าภาพปกของกิจกรรมที่กำหนดเวลาไว้

Action gates อยู่ภายใต้ `channels.discord.actions.*`

พฤติกรรม gate เริ่มต้น:

| กลุ่มแอ็กชัน                                                                                                                                                             | ค่าเริ่มต้น  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้งาน  |
| roles                                                                                                                                                                    | ปิดใช้งาน |
| moderation                                                                                                                                                               | ปิดใช้งาน |
| presence                                                                                                                                                                 | ปิดใช้งาน |

## UI Components v2

OpenClaw ใช้ Discord components v2 สำหรับการอนุมัติ exec และเครื่องหมายข้ามบริบท แอ็กชันข้อความของ Discord ยังสามารถรับ `components` สำหรับ UI แบบกำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้างเพย์โหลดคอมโพเนนต์ผ่านเครื่องมือ discord) ขณะที่ `embeds` แบบเก่ายังใช้ได้แต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นที่ใช้โดยคอนเทนเนอร์คอมโพเนนต์ของ Discord (hex)
- ตั้งค่าแยกตามบัญชีด้วย `channels.discord.accounts.<id>.ui.components.accentColor`
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

Discord มีพื้นผิวเสียงที่แตกต่างกันสองแบบ: **ช่องเสียง** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบตัวอย่างคลื่นเสียง) Gateway รองรับทั้งสองแบบ

### ช่องเสียง

เช็กลิสต์การตั้งค่า:

1. เปิดใช้ Message Content Intent ใน Discord Developer Portal
2. เปิดใช้ Server Members Intent เมื่อใช้ allowlists ของ role/user
3. เชิญบอตด้วย scope `bot` และ `applications.commands`
4. ให้สิทธิ์ Connect, Speak, Send Messages และ Read Message History ในช่องเสียงเป้าหมาย
5. เปิดใช้คำสั่งเนทีฟ (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งนี้ใช้ agent เริ่มต้นของบัญชีและปฏิบัติตามกฎ allowlist และนโยบายกลุ่มเดียวกับคำสั่ง Discord อื่น

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

- `voice.tts` จะแทนที่ `messages.tts` สำหรับการเล่นเสียงเท่านั้น
- `voice.model` จะแทนที่ LLM ที่ใช้สำหรับการตอบกลับในช่องเสียง Discord เท่านั้น เว้นว่างไว้เพื่อสืบทอดโมเดล agent ที่กำหนดเส้นทางไว้
- STT ใช้ `tools.media.audio`; `voice.model` ไม่มีผลต่อการถอดเสียง
- การแทนที่ `systemPrompt` ของ Discord ต่อช่องจะใช้กับรอบ transcript ของเสียงสำหรับช่องเสียงนั้น
- รอบ transcript ของเสียงจะอนุมานสถานะ owner จาก `allowFrom` ของ Discord (หรือ `dm.allowFrom`); ผู้พูดที่ไม่ใช่ owner จะเข้าถึงเครื่องมือเฉพาะ owner ไม่ได้ (เช่น `gateway` และ `cron`)
- เสียงของ Discord เป็นแบบ opt-in สำหรับการกำหนดค่าที่เป็นข้อความเท่านั้น; ตั้งค่า `channels.discord.voice.enabled=true` (หรือคงบล็อก `channels.discord.voice` ที่มีอยู่ไว้) เพื่อเปิดใช้คำสั่ง `/vc`, รันไทม์เสียง และ intent Gateway `GuildVoiceStates`
- `channels.discord.intents.voiceStates` สามารถแทนที่การสมัครรับ intent สถานะเสียงได้อย่างชัดเจน เว้นว่างไว้เพื่อให้ intent ทำตามการเปิดใช้งานเสียงที่มีผล
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` จะส่งต่อไปยังตัวเลือก join ของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- `voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายามเข้าร่วมอัตโนมัติ ค่าเริ่มต้น: `30000`
- `voice.reconnectGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอให้เซสชันเสียงที่ตัดการเชื่อมต่อเริ่มเชื่อมต่อใหม่ก่อนทำลายเซสชัน ค่าเริ่มต้น: `15000`
- OpenClaw ยังเฝ้าดูความล้มเหลวในการถอดรหัสขาเข้าและกู้คืนอัตโนมัติโดยออกจากช่องเสียงแล้วเข้าร่วมใหม่หลังจากเกิดความล้มเหลวซ้ำในช่วงเวลาสั้นๆ
- หากบันทึกการรับแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำหลังจากอัปเดต ให้รวบรวมรายงาน dependency และบันทึก สาย `@discordjs/voice` ที่บันเดิลมามีการแก้ไข padding จาก upstream ใน PR #11449 ของ discord.js ซึ่งปิด issue #11419 ของ discord.js แล้ว

ไปป์ไลน์ช่องเสียง:

- การจับ PCM ของ Discord จะถูกแปลงเป็นไฟล์ WAV ชั่วคราว
- `tools.media.audio` จัดการ STT เช่น `openai/gpt-4o-mini-transcribe`
- transcript จะถูกส่งผ่าน ingress และการกำหนดเส้นทางของ Discord ขณะที่ LLM สำหรับตอบกลับทำงานด้วยนโยบายเอาต์พุตเสียงที่ซ่อนเครื่องมือ `tts` ของ agent และขอให้ส่งคืนข้อความ เพราะเสียงของ Discord เป็นเจ้าของการเล่น TTS สุดท้าย
- เมื่อมีการตั้งค่า `voice.model` จะแทนที่เฉพาะ LLM สำหรับตอบกลับในรอบช่องเสียงนี้เท่านั้น
- `voice.tts` จะถูกผสานทับ `messages.tts`; เสียงที่ได้จะถูกเล่นในช่องที่เข้าร่วม

ข้อมูลประจำตัวจะถูกแก้แยกตามคอมโพเนนต์: auth เส้นทาง LLM สำหรับ `voice.model`, auth ของ STT สำหรับ `tools.media.audio` และ auth ของ TTS สำหรับ `messages.tts`/`voice.tts`

### ข้อความเสียง

ข้อความเสียงของ Discord แสดงตัวอย่างคลื่นเสียงและต้องใช้ออดิโอ OGG/Opus OpenClaw สร้างคลื่นเสียงให้อัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ Gateway เพื่อตรวจสอบและแปลง

- ระบุ **พาธไฟล์ในเครื่อง** (URL จะถูกปฏิเสธ)
- ละเว้นเนื้อหาข้อความ (Discord ปฏิเสธข้อความ + ข้อความเสียงในเพย์โหลดเดียวกัน)
- รับรูปแบบเสียงใดก็ได้; OpenClaw จะแปลงเป็น OGG/Opus ตามต้องการ

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - เปิดใช้ Message Content Intent
    - เปิดใช้ Server Members Intent เมื่อคุณพึ่งพาการแก้ข้อมูล user/member
    - รีสตาร์ท gateway หลังเปลี่ยน intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบ guild allowlist ภายใต้ `channels.discord.guilds`
    - หากมีแผนที่ `channels` ของ guild จะอนุญาตเฉพาะช่องที่ระบุไว้เท่านั้น
    - ตรวจสอบพฤติกรรม `requireMention` และรูปแบบการ mention

    การตรวจสอบที่มีประโยชน์:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    สาเหตุที่พบบ่อย:

    - `groupPolicy="allowlist"` โดยไม่มี allowlist ของ guild/channel ที่ตรงกัน
    - กำหนดค่า `requireMention` ผิดตำแหน่ง (ต้องอยู่ภายใต้ `channels.discord.guilds` หรือรายการช่อง)
    - ผู้ส่งถูกบล็อกโดย allowlist `users` ของ guild/channel

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    บันทึกทั่วไป:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    ปุ่มปรับคิว Gateway ของ Discord:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - สิ่งนี้ควบคุมเฉพาะงาน listener ของ Gateway Discord ไม่ใช่อายุการทำงานของรอบ agent

    Discord ไม่ได้ใช้ timeout ที่ช่องเป็นเจ้าของกับรอบ agent ที่เข้าคิวอยู่ listener ข้อความจะส่งต่อทันที และการรัน Discord ที่เข้าคิวจะรักษาลำดับต่อเซสชันไว้จนกว่าวงจรชีวิตของ session/tool/runtime จะเสร็จสมบูรณ์หรือยกเลิกงาน

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
    OpenClaw ดึง metadata `/gateway/bot` ของ Discord ก่อนเชื่อมต่อ ความล้มเหลวชั่วคราวจะย้อนกลับไปใช้ URL Gateway เริ่มต้นของ Discord และถูกจำกัดอัตราในบันทึก

    ปุ่มปรับ timeout ของ metadata:

    - บัญชีเดียว: `channels.discord.gatewayInfoTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env สำรองเมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - ค่าเริ่มต้น: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw รอเหตุการณ์ Gateway `READY` ของ Discord ระหว่างการเริ่มต้นและหลังจากเชื่อมต่อใหม่ขณะรันอยู่ การตั้งค่าหลายบัญชีที่มีการหน่วงเวลาเริ่มต้นเป็นลำดับอาจต้องใช้ช่วงเวลา READY ตอนเริ่มต้นที่นานกว่าค่าเริ่มต้น

    ตัวปรับค่า timeout ของ READY:

    - บัญชีเดียวตอนเริ่มต้น: `channels.discord.gatewayReadyTimeoutMs`
    - หลายบัญชีตอนเริ่มต้น: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - ค่า env สำรองตอนเริ่มต้นเมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นตอนเริ่มต้น: `15000` (15 วินาที), สูงสุด: `120000`
    - บัญชีเดียวขณะรันอยู่: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - หลายบัญชีขณะรันอยู่: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - ค่า env สำรองขณะรันอยู่เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นขณะรันอยู่: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    การตรวจสอบสิทธิ์ของ `channels status --probe` ทำงานได้เฉพาะกับ ID ช่องแบบตัวเลขเท่านั้น

    หากคุณใช้คีย์แบบ slug การจับคู่ขณะรันอยู่ยังทำงานได้ แต่ probe จะไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน

  </Accordion>

  <Accordion title="DM and pairing issues">

    - ปิดใช้งาน DM: `channels.discord.dm.enabled=false`
    - ปิดใช้งานนโยบาย DM: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - กำลังรอการอนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    โดยค่าเริ่มต้น ข้อความที่เขียนโดยบอตจะถูกละเว้น

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎการ mention และ allowlist ที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมวนลูป
    แนะนำให้ใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความจากบอตที่ mention ถึงบอตเท่านั้น

  </Accordion>

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - อัปเดต OpenClaw ให้เป็นเวอร์ชันปัจจุบัน (`openclaw update`) เพื่อให้มีตรรกะกู้คืนการรับเสียงของ Discord
    - ยืนยันว่า `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้นของ upstream) และปรับเฉพาะเมื่อจำเป็น
    - ดูบันทึกสำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากยังเกิดความล้มเหลวต่อไปหลังจาก rejoin อัตโนมัติ ให้รวบรวมบันทึกและเปรียบเทียบกับประวัติการรับ DAVE ของ upstream ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Discord](/th/gateway/config-channels#discord)

<Accordion title="High-signal Discord fields">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `token`, `accounts.*`, `allowBots`
- นโยบาย: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- คำสั่ง: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- คิวเหตุการณ์: `eventQueue.listenerTimeout` (งบเวลา listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- การตอบกลับ/ประวัติ: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- การสตรีม: `streaming` (alias แบบ legacy: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- สื่อ/การลองใหม่: `mediaMaxMb` (จำกัดการอัปโหลดไปยัง Discord ขาออก, ค่าเริ่มต้น `100MB`), `retry`
- การดำเนินการ: `actions.*`
- สถานะการแสดงตน: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ฟีเจอร์: `threadBindings`, `bindings[]` ระดับบนสุด (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการดำเนินงาน

- ปฏิบัติต่อโทเค็นบอตเป็นความลับ (แนะนำให้ใช้ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการกำกับดูแล)
- ให้สิทธิ์ Discord ตามหลักสิทธิ์เท่าที่จำเป็น
- หากการ deploy/state ของคำสั่งล้าสมัย ให้รีสตาร์ต Gateway และตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Discord กับ Gateway
  </Card>
  <Card title="Groups" icon="users" href="/th/channels/groups">
    พฤติกรรมแชตกลุ่มและ allowlist
  </Card>
  <Card title="Channel routing" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="Security" icon="shield" href="/th/gateway/security">
    แบบจำลองภัยคุกคามและการเสริมความปลอดภัย
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/th/concepts/multi-agent">
    แมป guild และช่องไปยังเอเจนต์
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่ง native
  </Card>
</CardGroup>
