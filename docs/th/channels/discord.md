---
read_when:
    - กำลังทำงานเกี่ยวกับฟีเจอร์ของช่อง Discord
summary: สถานะการรองรับบอต Discord, ความสามารถ และการกำหนดค่า
title: Discord
x-i18n:
    generated_at: "2026-05-07T01:50:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0422fe8a25a7c40d49c4a8c6ec5683c729c09b79d5d03daefc0fcf032f6d75c2
    source_path: channels/discord.md
    workflow: 16
---

พร้อมใช้งานกับ DM และช่องกิลด์ผ่าน Discord gateway อย่างเป็นทางการ

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    Discord DM มีค่าเริ่มต้นเป็นโหมดการจับคู่
  </Card>
  <Card title="คำสั่งสแลช" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องและโฟลว์การซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

คุณจะต้องสร้างแอปพลิเคชันใหม่พร้อมบอท เพิ่มบอทไปยังเซิร์ฟเวอร์ของคุณ และจับคู่กับ OpenClaw เราแนะนำให้เพิ่มบอทของคุณไปยังเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากคุณยังไม่มี [ให้สร้างขึ้นมาก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="สร้างแอปพลิเคชันและบอทของ Discord">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อประมาณว่า "OpenClaw"

    คลิก **Bot** บนแถบด้านข้าง ตั้งค่า **Username** เป็นชื่อที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้ privileged intents">
    ยังอยู่ในหน้า **Bot** เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับรายการอนุญาตตามบทบาทและการจับคู่ชื่อกับ ID)
    - **Presence Intent** (ไม่บังคับ; จำเป็นเฉพาะสำหรับการอัปเดต presence)

  </Step>

  <Step title="คัดลอกโทเค็นบอทของคุณ">
    เลื่อนกลับขึ้นไปบนหน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อนี้จะสื่อเช่นนั้น แต่สิ่งนี้จะสร้างโทเค็นแรกของคุณ ไม่มีสิ่งใดถูก "รีเซ็ต"
    </Note>

    คัดลอกโทเค็นและบันทึกไว้ที่ใดที่หนึ่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในไม่ช้า

  </Step>

  <Step title="สร้าง URL เชิญและเพิ่มบอทไปยังเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** บนแถบด้านข้าง คุณจะสร้าง URL เชิญที่มีสิทธิ์ที่ถูกต้องเพื่อเพิ่มบอทไปยังเซิร์ฟเวอร์ของคุณ

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

    นี่คือชุดพื้นฐานสำหรับช่องข้อความปกติ หากคุณวางแผนจะโพสต์ในเธรด Discord รวมถึงเวิร์กโฟลว์ของช่องฟอรัมหรือสื่อที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้ **Send Messages in Threads** ด้วย
    คัดลอก URL ที่สร้างขึ้นด้านล่าง วางลงในเบราว์เซอร์ของคุณ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอทของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิดใช้ Developer Mode และเก็บ ID ของคุณ">
    กลับไปที่แอป Discord คุณต้องเปิดใช้ Developer Mode เพื่อให้คัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนเฟืองถัดจากอวาตาร์ของคุณ) → **Advanced** → เปิด **Developer Mode**
    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ของคุณไว้พร้อมกับ Bot Token คุณจะส่งทั้งสามอย่างนี้ให้ OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาต DM จากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงาน Discord ต้องอนุญาตให้บอทของคุณส่ง DM ถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณ → **Privacy Settings** → เปิด **Direct Messages**

    สิ่งนี้ช่วยให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอท) ส่ง DM ถึงคุณได้ เปิดสิ่งนี้ไว้หากคุณต้องการใช้ Discord DM กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่องกิลด์ คุณสามารถปิด DM หลังจากจับคู่แล้วได้

  </Step>

  <Step title="ตั้งค่าโทเค็นบอทของคุณอย่างปลอดภัย (อย่าส่งในแชต)">
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

    หาก OpenClaw รันอยู่แล้วในฐานะบริการเบื้องหลัง ให้รีสตาร์ทผ่านแอป OpenClaw บน Mac หรือหยุดแล้วเริ่มกระบวนการ `openclaw gateway run` ใหม่
    สำหรับการติดตั้งบริการที่มีการจัดการ ให้รัน `openclaw gateway install` จากเชลล์ที่มี `DISCORD_BOT_TOKEN` อยู่ หรือเก็บตัวแปรไว้ใน `~/.openclaw/.env` เพื่อให้บริการ resolve env SecretRef ได้หลังรีสตาร์ท
    หากโฮสต์ของคุณถูกบล็อกหรือถูกจำกัดอัตราโดยการค้นหาแอปพลิเคชันตอนเริ่มต้นของ Discord ให้ตั้งค่า ID แอปพลิเคชัน/ไคลเอนต์ Discord จาก Developer Portal เพื่อให้การเริ่มต้นข้าม REST call นั้นได้ ใช้ `channels.discord.applicationId` สำหรับบัญชีเริ่มต้น หรือ `channels.discord.accounts.<accountId>.applicationId` เมื่อคุณรันบอท Discord หลายตัว

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        แชตกับเอเจนต์ OpenClaw ของคุณบนช่องที่มีอยู่ใดก็ได้ (เช่น Telegram) แล้วบอกมัน หาก Discord เป็นช่องแรกของคุณ ให้ใช้แท็บ CLI / config แทน

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

        env fallback สำหรับบัญชีเริ่มต้น:

```bash
DISCORD_BOT_TOKEN=...
```

        สำหรับการตั้งค่าแบบสคริปต์หรือระยะไกล ให้เขียนบล็อก JSON5 เดียวกันด้วย `openclaw config patch --file ./discord.patch.json5 --dry-run` แล้วรันซ้ำโดยไม่มี `--dry-run` รองรับค่า `token` แบบข้อความธรรมดา และรองรับค่า SecretRef สำหรับ `channels.discord.token` ข้ามผู้ให้บริการ env/file/exec ด้วย ดู [การจัดการความลับ](/th/gateway/secrets)

        สำหรับบอท Discord หลายตัว ให้เก็บโทเค็นบอทและ ID แอปพลิเคชันของแต่ละตัวไว้ใต้บัญชีของมัน `channels.discord.applicationId` ระดับบนสุดจะถูกสืบทอดโดยบัญชีต่างๆ ดังนั้นให้ตั้งค่าที่นั่นเฉพาะเมื่อทุกบัญชีควรใช้ ID แอปพลิเคชันเดียวกัน

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
    รอจนกว่า gateway จะรันอยู่ จากนั้นส่ง DM ถึงบอทของคุณใน Discord มันจะตอบกลับด้วยรหัสจับคู่

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        ส่งรหัสจับคู่ให้เอเจนต์ของคุณบนช่องที่มีอยู่:

        > "อนุมัติรหัสจับคู่ Discord นี้: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    รหัสจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง

    ตอนนี้คุณควรแชตกับเอเจนต์ของคุณใน Discord ผ่าน DM ได้แล้ว

  </Step>
</Steps>

<Note>
การ resolve โทเค็นรับรู้บัญชี ค่าโทเค็นใน config จะชนะ env fallback `DISCORD_BOT_TOKEN` ใช้สำหรับบัญชีเริ่มต้นเท่านั้น
หากบัญชี Discord ที่เปิดใช้สองบัญชี resolve เป็นโทเค็นบอทเดียวกัน OpenClaw จะเริ่ม gateway monitor เพียงตัวเดียวสำหรับโทเค็นนั้น โทเค็นที่มาจาก config จะชนะ env fallback เริ่มต้น มิฉะนั้นบัญชีที่เปิดใช้บัญชีแรกจะชนะ และบัญชีที่ซ้ำจะถูกรายงานว่าปิดใช้งาน
สำหรับ outbound call ขั้นสูง (เครื่องมือ message/การกระทำของช่อง) จะใช้ `token` แบบระบุต่อการเรียกสำหรับการเรียกนั้น สิ่งนี้ใช้กับการกระทำแบบ send และ read/probe (เช่น read/search/fetch/thread/pins/permissions) การตั้งค่านโยบายบัญชี/การลองซ้ำยังคงมาจากบัญชีที่เลือกใน runtime snapshot ที่ใช้งานอยู่
</Note>

## แนะนำ: ตั้งค่าพื้นที่ทำงานกิลด์

เมื่อ DM ใช้งานได้แล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็นพื้นที่ทำงานเต็มรูปแบบ ซึ่งแต่ละช่องจะมีเซสชันเอเจนต์ของตัวเองพร้อมบริบทของตัวเอง สิ่งนี้แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีเพียงคุณและบอทของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณไปยังรายการอนุญาตของกิลด์">
    สิ่งนี้ช่วยให้เอเจนต์ของคุณตอบกลับในทุกช่องบนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ DM

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
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

  <Step title="อนุญาตการตอบกลับโดยไม่ต้อง @mention">
    ตามค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในช่องกิลด์เมื่อถูก @mention เท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณน่าจะต้องการให้มันตอบกลับทุกข้อความ

    ในช่องกิลด์ คำตอบสุดท้ายปกติของผู้ช่วยจะยังคงเป็นส่วนตัวตามค่าเริ่มต้น เอาต์พุต Discord ที่มองเห็นได้ต้องส่งอย่างชัดเจนด้วยเครื่องมือ `message` เพื่อให้เอเจนต์สามารถเฝ้าดูเงียบๆ ตามค่าเริ่มต้น และโพสต์เฉพาะเมื่อมันตัดสินว่าการตอบกลับในช่องมีประโยชน์

    นี่หมายความว่าโมเดลที่เลือกต้องเรียกใช้เครื่องมือได้อย่างเชื่อถือได้ หาก Discord แสดงว่ากำลังพิมพ์และ log แสดงการใช้โทเค็นแต่ไม่มีข้อความโพสต์ ให้ตรวจสอบ log ของเซสชันเพื่อหาข้อความผู้ช่วยที่มี `didSendViaMessagingTool: false` นั่นหมายความว่าโมเดลสร้างคำตอบสุดท้ายส่วนตัวแทนที่จะเรียก `message(action=send)` ให้เปลี่ยนเป็นโมเดลที่เรียกใช้เครื่องมือได้ดีกว่า หรือใช้ config ด้านล่างเพื่อกู้คืนคำตอบสุดท้ายอัตโนมัติแบบเดิม

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "อนุญาตให้เอเจนต์ของฉันตอบกลับบนเซิร์ฟเวอร์นี้โดยไม่ต้องถูก @mention"
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
    ตามค่าเริ่มต้น หน่วยความจำระยะยาว (MEMORY.md) จะโหลดเฉพาะในเซสชัน DM ช่องกิลด์จะไม่โหลด MEMORY.md โดยอัตโนมัติ

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เมื่อฉันถามคำถามในช่อง Discord ให้ใช้ memory_search หรือ memory_get หากคุณต้องการบริบทระยะยาวจาก MEMORY.md"
      </Tab>
      <Tab title="ด้วยตนเอง">
        หากคุณต้องการบริบทที่ใช้ร่วมกันในทุกช่อง ให้ใส่คำสั่งที่คงที่ไว้ใน `AGENTS.md` หรือ `USER.md` (จะถูกฉีดเข้าไปในทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงเมื่อต้องการด้วยเครื่องมือหน่วยความจำ
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้สร้างช่องบางช่องบนเซิร์ฟเวอร์ Discord ของคุณแล้วเริ่มแชตได้เลย เอเจนต์ของคุณสามารถเห็นชื่อช่อง และแต่ละช่องจะมีเซสชันแยกของตัวเอง ดังนั้นคุณจึงตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ตามที่เหมาะกับเวิร์กโฟลว์ของคุณได้

## โมเดลรันไทม์

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord
- การกำหนดเส้นทางคำตอบเป็นแบบกำหนดแน่นอน: คำตอบขาเข้าจาก Discord จะตอบกลับไปยัง Discord
- เมตาดาต้า guild/channel ของ Discord จะถูกเพิ่มลงในพรอมป์ของโมเดลเป็นบริบทที่ไม่น่าเชื่อถือ
  ไม่ใช่คำนำหน้าคำตอบที่ผู้ใช้มองเห็น หากโมเดลคัดลอกซองข้อมูลนั้นกลับมา
  OpenClaw จะลบเมตาดาต้าที่ถูกคัดลอกออกจากคำตอบขาออกและจาก
  บริบทสำหรับเล่นซ้ำในอนาคต
- ตามค่าเริ่มต้น (`session.dmScope=main`) แชทโดยตรงจะแชร์เซสชันหลักของเอเจนต์ (`agent:main:main`)
- ช่องกิลด์เป็นคีย์เซสชันที่แยกกัน (`agent:<agentId>:discord:channel:<channelId>`)
- ระบบจะละเว้น DM แบบกลุ่มตามค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่ง slash แบบเนทีฟจะทำงานในเซสชันคำสั่งที่แยกกัน (`agent:<agentId>:discord:slash:<userId>`) ขณะที่ยังคงพก `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่ถูกกำหนดเส้นทาง
- การส่งประกาศ cron/heartbeat แบบข้อความล้วนไปยัง Discord ใช้คำตอบสุดท้าย
  ที่ผู้ช่วยมองเห็นหนึ่งครั้ง ส่วน payload สื่อและคอมโพเนนต์แบบมีโครงสร้างยังคง
  เป็นหลายข้อความเมื่อเอเจนต์ปล่อย payload ที่ส่งมอบได้หลายรายการ

## ช่องฟอรัม

ช่องฟอรัมและช่องสื่อของ Discord รับเฉพาะโพสต์ในเธรดเท่านั้น OpenClaw รองรับสองวิธีในการสร้าง:

- ส่งข้อความไปยังฟอรัมหลัก (`channel:<forumId>`) เพื่อสร้างเธรดโดยอัตโนมัติ ชื่อเธรดใช้บรรทัดแรกที่ไม่ว่างในข้อความของคุณ
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

OpenClaw รองรับคอนเทนเนอร์คอมโพเนนต์ Discord v2 สำหรับข้อความของเอเจนต์ ใช้เครื่องมือข้อความพร้อม payload `components` ผลลัพธ์จากการโต้ตอบจะถูกกำหนดเส้นทางกลับไปยังเอเจนต์เป็นข้อความขาเข้าปกติ และทำตามการตั้งค่า `replyToMode` ของ Discord ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถวการกระทำอนุญาตให้มีปุ่มได้สูงสุด 5 ปุ่ม หรือเมนูเลือกเดี่ยวหนึ่งรายการ
- ประเภทตัวเลือก: `string`, `user`, `role`, `mentionable`, `channel`

ตามค่าเริ่มต้น คอมโพเนนต์ใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่ออนุญาตให้ใช้ปุ่ม ตัวเลือก และฟอร์มได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดว่าใครคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (ID ผู้ใช้ Discord, แท็ก หรือ `*`) เมื่อกำหนดค่าไว้ ผู้ใช้ที่ไม่ตรงกันจะได้รับการปฏิเสธแบบ ephemeral

คำสั่ง slash `/model` และ `/models` จะเปิดตัวเลือกโมเดลแบบโต้ตอบที่มีดรอปดาวน์ผู้ให้บริการ โมเดล และ runtime ที่เข้ากันได้ พร้อมขั้นตอนส่ง `/models add` เลิกใช้แล้วและตอนนี้จะส่งคืนข้อความแจ้งเลิกใช้แทนการลงทะเบียนโมเดลจากแชท คำตอบของตัวเลือกเป็นแบบ ephemeral และมีเพียงผู้ใช้ที่เรียกใช้เท่านั้นที่ใช้ได้

ไฟล์แนบ:

- บล็อก `file` ต้องชี้ไปยังการอ้างอิงไฟล์แนบ (`attachment://<filename>`)
- ระบุไฟล์แนบผ่าน `media`/`path`/`filePath` (ไฟล์เดียว); ใช้ `media-gallery` สำหรับหลายไฟล์
- ใช้ `filename` เพื่อแทนที่ชื่ออัปโหลดเมื่อควรตรงกับการอ้างอิงไฟล์แนบ

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM `channels.discord.allowFrom` คือ allowlist DM หลักที่เป็นมาตรฐาน

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.discord.allowFrom` มี `"*"`)
    - `disabled`

    หากนโยบาย DM ไม่ใช่แบบเปิด ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือถูกแจ้งให้จับคู่ในโหมด `pairing`)

    ลำดับความสำคัญของหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - สำหรับบัญชีเดียว `allowFrom` มีลำดับความสำคัญเหนือ `dm.allowFrom` เดิม
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อทั้ง `allowFrom` ของตัวเองและ `dm.allowFrom` เดิมไม่ได้ตั้งค่า
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    `channels.discord.dm.policy` และ `channels.discord.dm.allowFrom` เดิมยังอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การกล่าวถึง `<@id>`

    โดยปกติ ID ตัวเลขล้วนจะ resolve เป็น ID ช่องเมื่อมีค่าเริ่มต้นของช่องที่ใช้งานอยู่ แต่ ID ที่อยู่ใน `allowFrom` ของ DM ที่มีผลของบัญชีจะถูกถือเป็นเป้าหมาย DM ผู้ใช้เพื่อความเข้ากันได้

  </Tab>

  <Tab title="DM access groups">
    DM ของ Discord สามารถใช้รายการ `accessGroup:<name>` แบบไดนามิกใน `channels.discord.allowFrom`

    ชื่อกลุ่มการเข้าถึงแชร์ร่วมกันระหว่างช่องข้อความ ใช้ `type: "message.senders"` สำหรับกลุ่มแบบคงที่ที่สมาชิกแสดงด้วยไวยากรณ์ `allowFrom` ปกติของแต่ละช่อง หรือ `type: "discord.channelAudience"` เมื่อกลุ่มผู้ชม `ViewChannel` ปัจจุบันของช่อง Discord ควรกำหนดสมาชิกแบบไดนามิก พฤติกรรมกลุ่มการเข้าถึงที่แชร์มีเอกสารที่นี่: [กลุ่มการเข้าถึง](/th/channels/access-groups)

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

    ช่องข้อความ Discord ไม่มีรายชื่อสมาชิกแยกต่างหาก `type: "discord.channelAudience"` จำลองสมาชิกเป็น: ผู้ส่ง DM เป็นสมาชิกของกิลด์ที่กำหนดค่าไว้ และปัจจุบันมีสิทธิ์ `ViewChannel` ที่มีผลบนช่องที่กำหนดค่าไว้ หลังจากนำ role และการเขียนทับช่องมาใช้แล้ว

    ตัวอย่าง: อนุญาตให้ทุกคนที่เห็น `#maintainers` ส่ง DM ไปยังบอตได้ ขณะที่ยังคงปิด DM สำหรับทุกคนอื่น

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

    เปิดใช้งาน **Server Members Intent** ใน Discord Developer Portal สำหรับบอตเมื่อใช้กลุ่มการเข้าถึงแบบผู้ชมช่อง DM ไม่มีสถานะสมาชิกกิลด์ ดังนั้น OpenClaw จะ resolve สมาชิกผ่าน Discord REST ขณะอนุญาตสิทธิ์

  </Tab>

  <Tab title="Guild policy">
    การจัดการกิลด์ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    baseline ที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    พฤติกรรม `allowlist`:

    - กิลด์ต้องตรงกับ `channels.discord.guilds` (แนะนำให้ใช้ `id`, ยอมรับ slug)
    - allowlist ผู้ส่งแบบเลือกได้: `users` (แนะนำ ID ที่เสถียร) และ `roles` (เฉพาะ ID role); หากกำหนดค่าอย่างใดอย่างหนึ่ง ผู้ส่งจะได้รับอนุญาตเมื่อเทียบตรงกับ `users` หรือ `roles`
    - การจับคู่ชื่อ/แท็กโดยตรงถูกปิดตามค่าเริ่มต้น เปิด `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเป็นโหมดความเข้ากันได้กรณีฉุกเฉินเท่านั้น
    - รองรับชื่อ/แท็กสำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อใช้รายการชื่อ/แท็ก
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

    หากคุณตั้งค่าเฉพาะ `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` fallback ขณะ runtime คือ `groupPolicy="allowlist"` (พร้อมคำเตือนในบันทึก) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`

  </Tab>

  <Tab title="Mentions and group DMs">
    ข้อความกิลด์ถูก gate ด้วยการกล่าวถึงตามค่าเริ่มต้น

    การตรวจจับการกล่าวถึงรวมถึง:

    - การกล่าวถึงบอตอย่างชัดเจน
    - รูปแบบการกล่าวถึงที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับถึงบอตโดยนัยในกรณีที่รองรับ

    เมื่อเขียนข้อความ Discord ขาออก ให้ใช้ไวยากรณ์การกล่าวถึงแบบมาตรฐาน: `<@USER_ID>` สำหรับผู้ใช้, `<#CHANNEL_ID>` สำหรับช่อง และ `<@&ROLE_ID>` สำหรับ role อย่าใช้รูปแบบการกล่าวถึงชื่อเล่นเดิม `<@!USER_ID>`

    `requireMention` ถูกกำหนดค่าต่อกิลด์/ช่อง (`channels.discord.guilds...`)
    `ignoreOtherMentions` เลือกได้ว่าจะทิ้งข้อความที่กล่าวถึงผู้ใช้/role อื่นแต่ไม่ได้กล่าวถึงบอต (ยกเว้น @everyone/@here)

    DM แบบกลุ่ม:

    - ค่าเริ่มต้น: ละเว้น (`dm.groupEnabled=false`)
    - allowlist แบบเลือกได้ผ่าน `dm.groupChannels` (ID ช่องหรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตาม role

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิกกิลด์ Discord ไปยังเอเจนต์ต่างกันตาม ID role bindings ตาม role รับเฉพาะ ID role และจะถูกประเมินหลังจาก bindings แบบ peer หรือ parent-peer และก่อน bindings เฉพาะกิลด์ หาก binding ตั้งค่าฟิลด์ match อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ฟิลด์ที่กำหนดค่าทั้งหมดต้องตรงกัน

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
- การเขียนทับรายช่อง: `channels.discord.commands.native`
- `commands.native=false` ข้ามการลงทะเบียนและการล้างคำสั่ง slash-command ของ Discord ระหว่างเริ่มต้นระบบ คำสั่งที่เคยลงทะเบียนไว้อาจยังมองเห็นได้ใน Discord จนกว่าคุณจะลบออกจากแอป Discord
- การยืนยันตัวตนของคำสั่งแบบ native ใช้รายการอนุญาต/นโยบายของ Discord ชุดเดียวกับการจัดการข้อความปกติ
- คำสั่งอาจยังมองเห็นได้ใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต แต่การดำเนินการยังบังคับใช้การยืนยันตัวตนของ OpenClaw และส่งคืนข้อความ "not authorized"

ดู [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งและพฤติกรรม

การตั้งค่าคำสั่ง slash เริ่มต้น:

- `ephemeral: true`

## รายละเอียดฟีเจอร์

<AccordionGroup>
  <Accordion title="แท็กตอบกลับและการตอบกลับแบบ native">
    Discord รองรับแท็กตอบกลับในเอาต์พุตของเอเจนต์:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    ควบคุมโดย `channels.discord.replyToMode`:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`
    - `batched`

    หมายเหตุ: `off` ปิดการทำเธรดคำตอบโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงถูกใช้งาน
    `first` จะแนบการอ้างอิงคำตอบ native โดยนัยกับข้อความ Discord ขาออกแรกของรอบนั้นเสมอ
    `batched` จะแนบการอ้างอิงคำตอบ native โดยนัยของ Discord เฉพาะเมื่อ
    รอบขาเข้าเป็นชุดข้อความหลายรายการที่ถูก debounce แล้ว ซึ่งมีประโยชน์
    เมื่อคุณต้องการใช้การตอบกลับ native เป็นหลักสำหรับแชตที่ส่งถี่และกำกวม ไม่ใช่ทุก
    รอบที่มีข้อความเดียว

    ID ข้อความจะแสดงในบริบท/ประวัติ เพื่อให้เอเจนต์สามารถกำหนดเป้าหมายข้อความเฉพาะได้

  </Accordion>

  <Accordion title="ตัวอย่างสตรีมสด">
    OpenClaw สามารถสตรีมคำตอบฉบับร่างโดยส่งข้อความชั่วคราวและแก้ไขเมื่อมีข้อความเข้ามา `channels.discord.streaming` รับค่า `off` | `partial` | `block` | `progress` (ค่าเริ่มต้น) `progress` จะคงฉบับร่างสถานะที่แก้ไขได้ไว้หนึ่งรายการ และอัปเดตด้วยความคืบหน้าของเครื่องมือจนกว่าจะส่งผลลัพธ์สุดท้าย; `streamMode` เป็น alias ของรันไทม์แบบเดิม เรียกใช้ `openclaw doctor --fix` เพื่อเขียนค่ากำหนดที่บันทึกไว้ใหม่ให้เป็นคีย์มาตรฐาน

    ตั้งค่า `channels.discord.streaming.mode` เป็น `off` เพื่อปิดการแก้ไขตัวอย่างบน Discord หากเปิดใช้งานการสตรีมแบบบล็อกของ Discord อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial` แก้ไขข้อความตัวอย่างรายการเดียวเมื่อโทเค็นเข้ามา
    - `block` ส่งชิ้นส่วนขนาดร่าง (ใช้ `draftChunk` เพื่อปรับขนาดและจุดตัด โดยถูกจำกัดไม่เกิน `textChunkLimit`)
    - สื่อ ข้อผิดพลาด และผลลัพธ์สุดท้ายแบบตอบกลับชัดเจนจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าจะนำข้อความตัวอย่างมาใช้ซ้ำสำหรับอัปเดตเครื่องมือ/ความคืบหน้าหรือไม่
    - `streaming.preview.commandText` / `streaming.progress.commandText` ควบคุมรายละเอียดคำสั่ง/exec ในบรรทัดความคืบหน้าแบบกะทัดรัด: `raw` (ค่าเริ่มต้น) หรือ `status` (เฉพาะป้ายชื่อเครื่องมือ)

    ซ่อนข้อความคำสั่ง/exec ดิบโดยยังคงบรรทัดความคืบหน้าแบบกะทัดรัดไว้:

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

    การสตรีมตัวอย่างรองรับเฉพาะข้อความเท่านั้น; คำตอบแบบสื่อจะ fallback ไปใช้การส่งแบบปกติ เมื่อเปิดใช้งานการสตรีมแบบ `block` อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

  </Accordion>

  <Accordion title="ประวัติ บริบท และพฤติกรรมเธรด">
    บริบทประวัติของกิลด์:

    - ค่าเริ่มต้นของ `channels.discord.historyLimit` คือ `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    ตัวควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมเธรด:

    - เธรด Discord จะถูกกำหนดเส้นทางเป็นเซสชันของช่อง และสืบทอดค่ากำหนดของช่องแม่ เว้นแต่จะถูกเขียนทับ
    - เซสชันเธรดสืบทอดการเลือก `/model` ระดับเซสชันของช่องแม่เป็น fallback เฉพาะโมเดล; การเลือก `/model` ภายในเธรดยังคงมีลำดับความสำคัญ และประวัติทรานสคริปต์ของช่องแม่จะไม่ถูกคัดลอก เว้นแต่เปิดใช้งานการสืบทอดทรานสคริปต์
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) เลือกให้เธรดอัตโนมัติใหม่เริ่มต้นจากทรานสคริปต์ของช่องแม่ การเขียนทับรายบัญชีอยู่ใต้ `channels.discord.accounts.<id>.thread.inheritParent`
    - รีแอ็กชันของเครื่องมือส่งข้อความสามารถ resolve เป้าหมาย DM แบบ `user:<id>` ได้
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะถูกคงไว้ระหว่าง fallback การเปิดใช้งานในขั้นตอบกลับ

    หัวข้อของช่องจะถูกฉีดเป็นบริบทที่ **ไม่น่าเชื่อถือ** รายการอนุญาตควบคุมว่าใครสามารถเรียกใช้เอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบเต็มรูปแบบ

  </Accordion>

  <Accordion title="เซสชันผูกกับเธรดสำหรับ subagents">
    Discord สามารถผูกเธรดกับเป้าหมายเซสชัน เพื่อให้ข้อความติดตามในเธรดนั้นยังถูกส่งไปยังเซสชันเดิม (รวมถึงเซสชัน subagent)

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/ใหม่กับเป้าหมาย subagent/เซสชัน
    - `/unfocus` ลบการผูกเธรดปัจจุบัน
    - `/agents` แสดงรันที่ใช้งานอยู่และสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการ auto-unfocus เมื่อไม่มีกิจกรรมสำหรับการผูกที่โฟกัสอยู่
    - `/session max-age <duration|off>` ตรวจสอบ/อัปเดตอายุสูงสุดแบบบังคับสำหรับการผูกที่โฟกัสอยู่

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

    - `session.threadBindings.*` ตั้งค่าเริ่มต้นส่วนกลาง
    - `channels.discord.threadBindings.*` เขียนทับพฤติกรรมของ Discord
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดอัตโนมัติสำหรับ `sessions_spawn({ thread: true })` และการ spawn เธรดของ ACP ค่าเริ่มต้น: `true`
    - `defaultSpawnContext` ควบคุมบริบท subagent แบบ native สำหรับการ spawn ที่ผูกกับเธรด ค่าเริ่มต้น: `"fork"`
    - คีย์ `spawnSubagentSessions`/`spawnAcpSessions` ที่เลิกใช้แล้วจะถูกย้ายโดย `openclaw doctor --fix`
    - หากการผูกเธรดถูกปิดใช้งานสำหรับบัญชีหนึ่ง `/focus` และการดำเนินการผูกเธรดที่เกี่ยวข้องจะไม่พร้อมใช้งาน

    ดู [Sub-agents](/th/tools/subagents), [เอเจนต์ ACP](/th/tools/acp-agents), และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="การผูกช่อง ACP แบบถาวร">
    สำหรับเวิร์กสเปซ ACP แบบ "always-on" ที่เสถียร ให้กำหนดค่าการผูก ACP แบบมีชนิดระดับบนสุดที่กำหนดเป้าหมายไปยังการสนทนา Discord

    พาธ Config:

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

    - `/acp spawn codex --bind here` ผูกช่องหรือเธรดปัจจุบันไว้ที่ตำแหน่งเดิม และเก็บข้อความในอนาคตไว้ในเซสชัน ACP เดิม ข้อความเธรดสืบทอดการผูกของช่องแม่
    - ในช่องหรือเธรดที่ถูกผูกไว้ `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP เดิมที่ตำแหน่งเดิม การผูกเธรดชั่วคราวสามารถเขียนทับการ resolve เป้าหมายระหว่างที่ใช้งานอยู่ได้
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดลูกผ่าน `--thread auto|here`

    ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมการผูก

  </Accordion>

  <Accordion title="การแจ้งเตือนรีแอ็กชัน">
    โหมดการแจ้งเตือนรีแอ็กชันรายกิลด์:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    อีเวนต์รีแอ็กชันจะถูกแปลงเป็นอีเวนต์ระบบและแนบกับเซสชัน Discord ที่ถูกกำหนดเส้นทาง

  </Accordion>

  <Accordion title="รีแอ็กชันตอบรับ">
    `ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback เป็นอีโมจิตัวตนของเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้น "👀")

    หมายเหตุ:

    - Discord ยอมรับอีโมจิ unicode หรือชื่ออีโมจิแบบกำหนดเอง
    - ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับช่องหรือบัญชี

  </Accordion>

  <Accordion title="การเขียน Config">
    การเขียน config ที่เริ่มจากช่องจะเปิดใช้งานเป็นค่าเริ่มต้น

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
    กำหนดเส้นทางทราฟฟิก WebSocket ของ Gateway ของ Discord และการค้นหา REST ตอนเริ่มต้น (application ID + การ resolve รายการอนุญาต) ผ่านพร็อกซี HTTP(S) ด้วย `channels.discord.proxy`

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
    เปิดใช้งานการ resolve ของ PluralKit เพื่อแมปข้อความที่ถูกพร็อกซีไปยังตัวตนสมาชิกของระบบ:

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
    - ชื่อแสดงของสมาชิกจะถูกจับคู่ด้วยชื่อ/slug เท่านั้นเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การค้นหาใช้ ID ข้อความเดิมและถูกจำกัดด้วยกรอบเวลา
    - หากการค้นหาล้มเหลว ข้อความที่ถูกพร็อกซีจะถูกถือว่าเป็นข้อความบอทและถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="alias การกล่าวถึงขาออก">
    ใช้ `mentionAliases` เมื่อเอเจนต์ต้องการการกล่าวถึงขาออกแบบกำหนดผลได้แน่นอนสำหรับผู้ใช้ Discord ที่รู้จัก คีย์คือ handle ที่ไม่มี `@` นำหน้า; ค่าคือ ID ผู้ใช้ Discord handle ที่ไม่รู้จัก, `@everyone`, `@here`, และการกล่าวถึงภายใน Markdown code span จะไม่ถูกเปลี่ยนแปลง

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
    การอัปเดต Presence จะถูกใช้เมื่อคุณตั้งค่าฟิลด์สถานะหรือกิจกรรม หรือเมื่อคุณเปิดใช้งาน Presence อัตโนมัติ

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

    แมปชนิดกิจกรรม:

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

    การแสดงสถานะอัตโนมัติแมปความพร้อมใช้งานขณะรันกับสถานะ Discord: healthy => online, degraded หรือ unknown => idle, exhausted หรือ unavailable => dnd การแทนที่ข้อความเสริม:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับ placeholder `{reason}`)

  </Accordion>

  <Accordion title="การอนุมัติใน Discord">
    Discord รองรับการจัดการการอนุมัติด้วยปุ่มใน DM และสามารถโพสต์พรอมป์การอนุมัติในช่องต้นทางได้ตามต้องการ

    พาธการกำหนดค่า:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; ใช้ `commands.ownerAllowFrom` เป็นค่า fallback เมื่อทำได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord เปิดใช้การอนุมัติ exec แบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และสามารถระบุผู้อนุมัติได้อย่างน้อยหนึ่งราย ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมานผู้อนุมัติ exec จาก `allowFrom` ของช่อง, `dm.allowFrom` แบบเดิม หรือ `defaultTo` ของข้อความโดยตรง ตั้งค่า `enabled: false` เพื่อปิดใช้ Discord ในฐานะไคลเอนต์การอนุมัติแบบเนทีฟอย่างชัดเจน

    สำหรับคำสั่งกลุ่มที่ละเอียดอ่อนและจำกัดเฉพาะเจ้าของ เช่น `/diagnostics` และ `/export-trajectory` OpenClaw จะส่งพรอมป์การอนุมัติและผลลัพธ์สุดท้ายแบบส่วนตัว โดยจะลองใช้ Discord DM ก่อนเมื่อเจ้าของที่เรียกใช้มีเส้นทางเจ้าของผ่าน Discord; หากไม่พร้อมใช้งาน จะ fallback ไปยังเส้นทางเจ้าของแรกที่มีจาก `commands.ownerAllowFrom` เช่น Telegram

    เมื่อ `target` เป็น `channel` หรือ `both` พรอมป์การอนุมัติจะมองเห็นได้ในช่อง เฉพาะผู้อนุมัติที่ระบุได้เท่านั้นที่ใช้ปุ่มได้; ผู้ใช้อื่นจะได้รับการปฏิเสธแบบ ephemeral พรอมป์การอนุมัติมีข้อความคำสั่งอยู่ด้วย ดังนั้นให้เปิดใช้การส่งไปยังช่องเฉพาะในช่องที่เชื่อถือได้เท่านั้น หากไม่สามารถดึง ID ช่องจากคีย์เซสชันได้ OpenClaw จะ fallback ไปส่งผ่าน DM

    Discord ยังเรนเดอร์ปุ่มอนุมัติร่วมที่ใช้โดยช่องแชทอื่นด้วย อะแดปเตอร์ Discord แบบเนทีฟหลัก ๆ จะเพิ่มการกำหนดเส้นทาง DM ของผู้อนุมัติและการกระจายไปยังช่อง
    เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก; OpenClaw
    ควรรวมคำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์เครื่องมือระบุว่า
    การอนุมัติผ่านแชทไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียวเท่านั้น
    หาก runtime การอนุมัติแบบเนทีฟของ Discord ไม่ทำงาน OpenClaw จะยังแสดง
    พรอมป์ `/approve <id> <decision>` แบบ deterministic ภายในเครื่องไว้ หาก
    runtime ทำงานอยู่แต่ไม่สามารถส่งการ์ดแบบเนทีฟไปยังเป้าหมายใดได้
    OpenClaw จะส่งประกาศ fallback ในแชทเดียวกันพร้อมคำสั่ง `/approve`
    ที่ตรงจากการอนุมัติที่รอดำเนินการ

    การตรวจสอบสิทธิ์ Gateway และการแก้ผลการอนุมัติทำตามสัญญาไคลเอนต์ Gateway ร่วมกัน (ID `plugin:` จะ resolve ผ่าน `plugin.approval.resolve`; ID อื่นผ่าน `exec.approval.resolve`) โดยค่าเริ่มต้น การอนุมัติจะหมดอายุหลัง 30 นาที

    ดู [การอนุมัติ exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและเกตการดำเนินการ

การดำเนินการข้อความ Discord รวมถึงการส่งข้อความ, การดูแลช่อง, การกลั่นกรอง, สถานะ presence และการดำเนินการ metadata

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- ปฏิกิริยา: `react`, `reactions`, `emojiList`
- การกลั่นกรอง: `timeout`, `kick`, `ban`
- สถานะ presence: `setPresence`

การดำเนินการ `event-create` รับพารามิเตอร์ `image` แบบไม่บังคับ (URL หรือพาธไฟล์ในเครื่อง) เพื่อตั้งค่าภาพปกของกิจกรรมที่กำหนดเวลาไว้

เกตการดำเนินการอยู่ภายใต้ `channels.discord.actions.*`

พฤติกรรมเกตเริ่มต้น:

| กลุ่มการดำเนินการ                                                                                                                                                       | ค่าเริ่มต้น |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้     |
| roles                                                                                                                                                                    | ปิดใช้      |
| moderation                                                                                                                                                               | ปิดใช้      |
| presence                                                                                                                                                                 | ปิดใช้      |

## UI Components v2

OpenClaw ใช้ Discord components v2 สำหรับการอนุมัติ exec และตัวทำเครื่องหมายข้ามบริบท การดำเนินการข้อความ Discord ยังสามารถรับ `components` สำหรับ UI แบบกำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้าง payload ของ component ผ่านเครื่องมือ discord) ในขณะที่ `embeds` แบบเดิมยังพร้อมใช้งาน แต่ไม่แนะนำ

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

Discord มีพื้นผิวเสียงสองแบบที่แตกต่างกัน: **ช่องเสียง** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบตัวอย่าง waveform) Gateway รองรับทั้งสองแบบ

### ช่องเสียง

รายการตรวจสอบการตั้งค่า:

1. เปิดใช้ Message Content Intent ใน Discord Developer Portal
2. เปิดใช้ Server Members Intent เมื่อใช้ allowlist ของบทบาท/ผู้ใช้
3. เชิญบอตด้วย scope `bot` และ `applications.commands`
4. ให้สิทธิ์ Connect, Speak, Send Messages และ Read Message History ในช่องเสียงเป้าหมาย
5. เปิดใช้คำสั่งแบบเนทีฟ (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งนี้ใช้เอเจนต์ค่าเริ่มต้นของบัญชีและทำตามกฎ allowlist และนโยบายกลุ่มเดียวกับคำสั่ง Discord อื่น ๆ

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

- `voice.tts` แทนที่ `messages.tts` เฉพาะสำหรับการเล่นเสียงเท่านั้น
- `voice.model` แทนที่ LLM ที่ใช้สำหรับการตอบกลับของช่องเสียง Discord เท่านั้น ปล่อยไว้ไม่ตั้งค่าเพื่อสืบทอดโมเดลของเอเจนต์ที่ถูก route
- STT ใช้ `tools.media.audio`; `voice.model` ไม่ส่งผลต่อการถอดเสียง
- การแทนที่ `systemPrompt` ของ Discord รายช่องมีผลกับรอบ transcript เสียงสำหรับช่องเสียงนั้น
- รอบ transcript เสียงอนุมานสถานะเจ้าของจาก `allowFrom` ของ Discord (หรือ `dm.allowFrom`); ผู้พูดที่ไม่ใช่เจ้าของไม่สามารถเข้าถึงเครื่องมือที่จำกัดเฉพาะเจ้าของได้ (เช่น `gateway` และ `cron`)
- เสียง Discord เป็นแบบ opt-in สำหรับ config แบบข้อความเท่านั้น; ตั้งค่า `channels.discord.voice.enabled=true` (หรือคงบล็อก `channels.discord.voice` ที่มีอยู่ไว้) เพื่อเปิดใช้คำสั่ง `/vc`, runtime เสียง และ intent Gateway `GuildVoiceStates`
- `channels.discord.intents.voiceStates` สามารถแทนที่การสมัครรับ intent สถานะเสียงได้อย่างชัดเจน ปล่อยไว้ไม่ตั้งค่าเพื่อให้ intent ทำตามการเปิดใช้เสียงที่มีผลจริง
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือก join ของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- `voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายามเข้าร่วมอัตโนมัติ ค่าเริ่มต้น: `30000`
- `voice.reconnectGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอให้เซสชันเสียงที่ตัดการเชื่อมต่อเริ่มเชื่อมต่อใหม่ก่อนทำลายเซสชัน ค่าเริ่มต้น: `15000`
- OpenClaw ยังเฝ้าดูความล้มเหลวในการถอดรหัส receive และกู้คืนอัตโนมัติโดยออกจาก/เข้าร่วมช่องเสียงใหม่หลังเกิดความล้มเหลวซ้ำในช่วงเวลาสั้น ๆ
- หาก log receive แสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำหลังอัปเดต ให้รวบรวมรายงาน dependency และ log ไลน์ `@discordjs/voice` ที่บันเดิลมี upstream padding fix จาก discord.js PR #11449 ซึ่งปิด discord.js issue #11419 แล้ว

ไปป์ไลน์ช่องเสียง:

- การจับ PCM ของ Discord ถูกแปลงเป็นไฟล์ temp WAV
- `tools.media.audio` จัดการ STT เช่น `openai/gpt-4o-mini-transcribe`
- transcript ถูกส่งผ่าน ingress และ routing ของ Discord ขณะที่ LLM สำหรับการตอบกลับทำงานด้วยนโยบาย voice-output ที่ซ่อนเครื่องมือ `tts` ของเอเจนต์และขอข้อความที่ส่งกลับ เพราะเสียง Discord เป็นเจ้าของการเล่น TTS สุดท้าย
- `voice.model` เมื่อถูกตั้งค่า จะแทนที่เฉพาะ LLM สำหรับการตอบกลับในรอบช่องเสียงนี้
- `voice.tts` ถูก merge ทับ `messages.tts`; เสียงผลลัพธ์จะถูกเล่นในช่องที่เข้าร่วมอยู่

ข้อมูลประจำตัวถูก resolve แยกตาม component: การตรวจสอบสิทธิ์ route ของ LLM สำหรับ `voice.model`, การตรวจสอบสิทธิ์ STT สำหรับ `tools.media.audio` และการตรวจสอบสิทธิ์ TTS สำหรับ `messages.tts`/`voice.tts`

### ข้อความเสียง

ข้อความเสียง Discord แสดงตัวอย่าง waveform และต้องใช้เสียง OGG/Opus OpenClaw สร้าง waveform อัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ Gateway เพื่อ inspect และแปลง

- ระบุ **พาธไฟล์ในเครื่อง** (URL จะถูกปฏิเสธ)
- ละเว้นเนื้อหาข้อความ (Discord ปฏิเสธข้อความ + ข้อความเสียงใน payload เดียวกัน)
- รองรับรูปแบบเสียงใดก็ได้; OpenClaw จะแปลงเป็น OGG/Opus ตามต้องการ

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ใช้ intent ที่ไม่ได้รับอนุญาตหรือบอตไม่เห็นข้อความ guild">

    - เปิดใช้ Message Content Intent
    - เปิดใช้ Server Members Intent เมื่อคุณพึ่งพาการ resolve ผู้ใช้/สมาชิก
    - รีสตาร์ท Gateway หลังเปลี่ยน intent

  </Accordion>

  <Accordion title="ข้อความ guild ถูกบล็อกโดยไม่คาดคิด">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบ guild allowlist ใต้ `channels.discord.guilds`
    - หากมี map `channels` ของ guild จะอนุญาตเฉพาะช่องที่ระบุไว้เท่านั้น
    - ตรวจสอบพฤติกรรม `requireMention` และรูปแบบ mention

    การตรวจสอบที่มีประโยชน์:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention เป็น false แต่ยังถูกบล็อก">
    สาเหตุทั่วไป:

    - `groupPolicy="allowlist"` โดยไม่มี guild/channel allowlist ที่ตรงกัน
    - กำหนดค่า `requireMention` ผิดที่ (ต้องอยู่ใต้ `channels.discord.guilds` หรือรายการช่อง)
    - ผู้ส่งถูกบล็อกโดย allowlist `users` ของ guild/channel

  </Accordion>

  <Accordion title="รอบ Discord ที่รันนานหรือการตอบกลับซ้ำ">

    log ทั่วไป:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    ปุ่มปรับแต่งคิว Gateway ของ Discord:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ค่านี้ควบคุมเฉพาะงาน listener ของ Discord Gateway ไม่ใช่อายุการทำงานของรอบเอเจนต์

    Discord ไม่ใช้ timeout ที่ช่องเป็นเจ้าของกับรอบเอเจนต์ที่เข้าคิวไว้ listener ข้อความส่งต่อทันที และการรัน Discord ที่เข้าคิวไว้จะรักษาลำดับต่อเซสชันไว้จนกว่าวงจรชีวิตของเซสชัน/เครื่องมือ/runtime จะเสร็จสิ้นหรือยกเลิกงาน

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

  <Accordion title="คำเตือนการหมดเวลาค้นหาเมตาดาตาของ Gateway">
    OpenClaw ดึงเมตาดาตา Discord `/gateway/bot` ก่อนเชื่อมต่อ ความล้มเหลวชั่วคราวจะถอยกลับไปใช้ URL Gateway เริ่มต้นของ Discord และถูกจำกัดอัตราในบันทึก

    ตัวปรับแต่งการหมดเวลาของเมตาดาตา:

    - บัญชีเดียว: `channels.discord.gatewayInfoTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env fallback เมื่อยังไม่ได้ตั้งค่าคอนฟิก: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - ค่าเริ่มต้น: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="การรีสตาร์ตเมื่อ Gateway READY หมดเวลา">
    OpenClaw รอเหตุการณ์ Gateway `READY` ของ Discord ระหว่างเริ่มต้นและหลังจากเชื่อมต่อใหม่ในรันไทม์ การตั้งค่าหลายบัญชีที่มีการเหลื่อมเวลาเริ่มต้นอาจต้องใช้ช่วงเวลา READY ตอนเริ่มต้นที่ยาวกว่าค่าเริ่มต้น

    ตัวปรับแต่งการหมดเวลา READY:

    - บัญชีเดียวตอนเริ่มต้น: `channels.discord.gatewayReadyTimeoutMs`
    - หลายบัญชีตอนเริ่มต้น: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - env fallback ตอนเริ่มต้นเมื่อยังไม่ได้ตั้งค่าคอนฟิก: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นตอนเริ่มต้น: `15000` (15 วินาที), สูงสุด: `120000`
    - บัญชีเดียวในรันไทม์: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - หลายบัญชีในรันไทม์: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - env fallback ในรันไทม์เมื่อยังไม่ได้ตั้งค่าคอนฟิก: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นในรันไทม์: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="ความไม่ตรงกันในการตรวจสอบสิทธิ์">
    การตรวจสอบสิทธิ์ `channels status --probe` ใช้งานได้เฉพาะกับ ID ช่องแบบตัวเลขเท่านั้น

    หากคุณใช้คีย์แบบ slug การจับคู่ในรันไทม์ยังอาจทำงานได้ แต่ probe ไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน

  </Accordion>

  <Accordion title="ปัญหา DM และการจับคู่">

    - ปิดใช้งาน DM: `channels.discord.dm.enabled=false`
    - ปิดใช้งานนโยบาย DM: `channels.discord.dmPolicy="disabled"` (เดิม: `channels.discord.dm.policy`)
    - กำลังรอการอนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูปจากบอตถึงบอต">
    โดยค่าเริ่มต้น ข้อความที่บอตเป็นผู้เขียนจะถูกละเว้น

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎการ mention และ allowlist ที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมลูป
    แนะนำให้ใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความจากบอตที่ mention บอตเท่านั้น

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

  <Accordion title="Voice STT หายไปพร้อม DecryptionFailed(...)">

    - ใช้ OpenClaw เวอร์ชันปัจจุบันเสมอ (`openclaw update`) เพื่อให้มีตรรกะการกู้คืนการรับเสียงของ Discord
    - ยืนยันว่า `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้นของ upstream) และปรับเฉพาะเมื่อจำเป็น
    - ดูบันทึกสำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากยังมีความล้มเหลวต่อหลังจาก rejoin อัตโนมัติ ให้รวบรวมบันทึกและเปรียบเทียบกับประวัติการรับ DAVE ของ upstream ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Discord](/th/gateway/config-channels#discord).

<Accordion title="ฟิลด์ Discord ที่ให้สัญญาณสูง">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `token`, `accounts.*`, `allowBots`
- นโยบาย: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- คำสั่ง: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- คิวเหตุการณ์: `eventQueue.listenerTimeout` (งบเวลาของ listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- การตอบกลับ/ประวัติ: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- การสตรีม: `streaming` (นามแฝงเดิม: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- สื่อ/การลองใหม่: `mediaMaxMb` (จำกัดการอัปโหลด Discord ขาออก, ค่าเริ่มต้น `100MB`), `retry`
- การดำเนินการ: `actions.*`
- สถานะตัวตน: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ฟีเจอร์: `threadBindings`, `bindings[]` ระดับบนสุด (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการปฏิบัติการ

- ปฏิบัติต่อโทเค็นบอตเป็นความลับ (แนะนำให้ใช้ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการควบคุม)
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
    โมเดลภัยคุกคามและการเสริมความแข็งแกร่ง
  </Card>
  <Card title="การกำหนดเส้นทางหลายเอเจนต์" icon="sitemap" href="/th/concepts/multi-agent">
    แมป guild และช่องไปยังเอเจนต์
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟ
  </Card>
</CardGroup>
