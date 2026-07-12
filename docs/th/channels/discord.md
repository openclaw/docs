---
read_when:
    - การพัฒนาฟีเจอร์ของช่อง Discord
summary: การตั้งค่าบอต Discord, คีย์การกำหนดค่า, คอมโพเนนต์, เสียง และการแก้ไขปัญหา
title: Discord
x-i18n:
    generated_at: "2026-07-12T15:51:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw เชื่อมต่อกับ Discord ในฐานะบอตผ่าน Gateway อย่างเป็นทางการของ Discord รองรับทั้งข้อความส่วนตัวและช่องของเซิร์ฟเวอร์

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    ข้อความส่วนตัวของ Discord ใช้โหมดจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    ลักษณะการทำงานของคำสั่งแบบเนทีฟและรายการคำสั่ง
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    ขั้นตอนการวินิจฉัยและแก้ไขปัญหาที่ใช้ร่วมกันระหว่างช่อง
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

สร้างแอปพลิเคชัน Discord พร้อมบอต เพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ แล้วจับคู่กับ OpenClaw หากทำได้ ให้ใช้เซิร์ฟเวอร์ส่วนตัว หากจำเป็นให้[สร้างเซิร์ฟเวอร์ก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**)

<Steps>
  <Step title="Create a Discord application and bot">
    ใน [Discord Developer Portal](https://discord.com/developers/applications) ให้คลิก **New Application** แล้วตั้งชื่อแอปพลิเคชัน (เช่น "OpenClaw")

    เปิด **Bot** ในแถบด้านข้าง แล้วตั้งค่า **Username** เป็นชื่อเอเจนต์ของคุณ

  </Step>

  <Step title="Enable privileged intents">
    ขณะที่ยังอยู่ในหน้า **Bot** ให้เปิดใช้งานรายการต่อไปนี้ใต้ **Privileged Gateway Intents**:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ และจำเป็นสำหรับรายการอนุญาตตามบทบาท การจับคู่ชื่อกับ ID และกลุ่มสิทธิ์เข้าถึงผู้รับสารของช่อง)
    - **Presence Intent** (ไม่บังคับ ใช้สำหรับการอัปเดตสถานะออนไลน์เท่านั้น)

  </Step>

  <Step title="Copy your bot token">
    ในหน้า **Bot** ให้คลิก **Reset Token** แล้วคัดลอกโทเค็น

    <Note>
    แม้ชื่อจะสื่อเช่นนั้น แต่การดำเนินการนี้จะสร้างโทเค็นแรกของคุณ โดยไม่ได้มีสิ่งใดถูก "รีเซ็ต"
    </Note>

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    เปิด **OAuth2** ในแถบด้านข้าง ในส่วน **OAuth2 URL Generator** ให้เปิดใช้งานขอบเขตต่อไปนี้:

    - `bot`
    - `applications.commands`

    ในส่วน **Bot Permissions** ที่ปรากฏขึ้น ให้เปิดใช้งานอย่างน้อย:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (ไม่บังคับ)

    รายการนี้เป็นสิทธิ์พื้นฐานสำหรับช่องข้อความทั่วไป หากบอตจะโพสต์ในเธรด รวมถึงเวิร์กโฟลว์ของช่องฟอรัมหรือสื่อที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้งาน **Send Messages in Threads** ด้วย

    คัดลอก URL ที่สร้างขึ้น เปิดในเบราว์เซอร์ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** จากนั้นบอตควรปรากฏในเซิร์ฟเวอร์ของคุณ

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    ในแอป Discord ให้เปิดใช้งาน Developer Mode เพื่อให้คัดลอก ID ได้:

    1. **User Settings** (ไอคอนรูปเฟือง) → **Developer** → เปิด **Developer Mode**
       *(บนอุปกรณ์เคลื่อนที่: **App Settings** → **Advanced**)*
    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** → **Copy Server ID**
    3. คลิกขวาที่ **รูปประจำตัวของคุณเอง** → **Copy User ID**

    เก็บ Server ID และ User ID ไว้กับโทเค็นบอต เพราะคุณจะต้องใช้ทั้งสามรายการในขั้นตอนถัดไป

  </Step>

  <Step title="Allow DMs from server members">
    เพื่อให้การจับคู่ทำงาน Discord ต้องอนุญาตให้บอตส่งข้อความส่วนตัวถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** → **Privacy Settings** → เปิด **Direct Messages**

    เปิดการตั้งค่านี้ไว้หากคุณใช้ข้อความส่วนตัวของ Discord กับ OpenClaw หากใช้เฉพาะช่องของเซิร์ฟเวอร์ คุณสามารถปิดได้หลังจากจับคู่เสร็จแล้ว

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    โทเค็นบอตเป็นข้อมูลลับ ให้ตั้งค่าบนเครื่องที่ใช้งาน OpenClaw ก่อนส่งข้อความถึงเอเจนต์ของคุณ:

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

    หาก OpenClaw ทำงานเป็นบริการเบื้องหลังอยู่แล้ว ให้เริ่มการทำงานใหม่ผ่านแอป OpenClaw สำหรับ Mac หรือหยุดแล้วเริ่มกระบวนการ `openclaw gateway run` ใหม่
    สำหรับการติดตั้งแบบบริการที่มีการจัดการ ให้เรียกใช้ `openclaw gateway install` จากเชลล์ที่ตั้งค่า `DISCORD_BOT_TOKEN` ไว้ หรือเก็บตัวแปรไว้ใน `~/.openclaw/.env` เพื่อให้บริการสามารถแก้ค่า env SecretRef ได้หลังจากเริ่มการทำงานใหม่
    หากโฮสต์ของคุณถูกบล็อกหรือจำกัดอัตราการเรียกใช้จากการค้นหาแอปพลิเคชันระหว่างเริ่มต้นของ Discord ให้ตั้งค่า ID แอปพลิเคชัน/ไคลเอนต์จาก Developer Portal เพื่อให้ขั้นตอนเริ่มต้นข้ามการเรียก REST นั้นได้ โดยใช้ `channels.discord.applicationId` สำหรับบัญชีเริ่มต้น หรือ `channels.discord.accounts.<accountId>.applicationId` สำหรับแต่ละบอต

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        สนทนากับเอเจนต์ OpenClaw ของคุณผ่านช่องที่มีอยู่แล้ว (เช่น Telegram) และแจ้งให้เอเจนต์ดำเนินการ หาก Discord เป็นช่องแรกของคุณ ให้ใช้แท็บ CLI / การกำหนดค่าแทน

        > "ฉันตั้งค่าโทเค็นบอต Discord ในการกำหนดค่าแล้ว โปรดตั้งค่า Discord ให้เสร็จสมบูรณ์โดยใช้ User ID `<user_id>` และ Server ID `<server_id>`"
      </Tab>
      <Tab title="CLI / config">
        การกำหนดค่าผ่านไฟล์:

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

        สำหรับการตั้งค่าด้วยสคริปต์หรือจากระยะไกล ให้เขียนบล็อก JSON5 เดียวกันด้วย `openclaw config patch --file ./discord.patch.json5 --dry-run` แล้วเรียกใช้อีกครั้งโดยไม่มี `--dry-run` นอกจากนี้ยังรองรับสตริง `token` แบบข้อความธรรมดา และรองรับค่า SecretRef สำหรับ `channels.discord.token` ผ่านผู้ให้บริการ env/file/exec โปรดดู[การจัดการข้อมูลลับ](/th/gateway/secrets)

        สำหรับบอต Discord หลายตัว ให้เก็บโทเค็นบอตและ ID แอปพลิเคชันของแต่ละบอตไว้ภายใต้บัญชีของบอตนั้น `channels.discord.applicationId` ระดับบนสุดจะถูกสืบทอดโดยบัญชีต่าง ๆ ดังนั้นให้ตั้งค่าที่ตำแหน่งนั้นเฉพาะเมื่อทุกบัญชีใช้ ID แอปพลิเคชันเดียวกัน

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
    เมื่อ Gateway ทำงานแล้ว ให้ส่งข้อความส่วนตัวถึงบอตของคุณใน Discord บอตจะตอบกลับด้วยรหัสจับคู่

    <Tabs>
      <Tab title="Ask your agent">
        ส่งรหัสจับคู่ให้เอเจนต์ผ่านช่องที่มีอยู่แล้ว:

        > "อนุมัติรหัสจับคู่ Discord นี้: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    รหัสจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง เมื่ออนุมัติแล้ว ให้สนทนากับเอเจนต์ผ่านข้อความส่วนตัวของ Discord

  </Step>
</Steps>

<Note>
การแก้ค่าโทเค็นคำนึงถึงบัญชี ค่าโทเค็นในการกำหนดค่ามีลำดับความสำคัญเหนือ env สำรอง และจะใช้ `DISCORD_BOT_TOKEN` สำหรับบัญชีเริ่มต้นเท่านั้น
หากบัญชี Discord ที่เปิดใช้งานสองบัญชีแก้ค่าเป็นโทเค็นบอตเดียวกัน OpenClaw จะเริ่มตัวเฝ้าติดตาม Gateway เพียงตัวเดียวสำหรับโทเค็นนั้น โดยโทเค็นจากการกำหนดค่ามีลำดับความสำคัญเหนือ env สำรอง มิฉะนั้นบัญชีแรกที่เปิดใช้งานจะมีลำดับความสำคัญ และบัญชีที่ซ้ำกันจะถูกรายงานว่าปิดใช้งานด้วยเหตุผล `duplicate bot token`
สำหรับการเรียกขาออกขั้นสูง (เครื่องมือส่งข้อความ/การดำเนินการของช่อง) ระบบจะใช้ `token` ที่ระบุอย่างชัดเจนต่อการเรียกสำหรับการเรียกนั้น ข้อนี้ใช้กับทั้งการส่งและการดำเนินการลักษณะอ่าน/ตรวจสอบ (อ่าน/ค้นหา/ดึงข้อมูล/เธรด/ข้อความปักหมุด/สิทธิ์) การตั้งค่านโยบายบัญชีและการลองใหม่ยังคงมาจากบัญชีที่เลือกในสแนปช็อตรันไทม์ที่ใช้งานอยู่
</Note>

## แนะนำ: ตั้งค่าพื้นที่ทำงานของเซิร์ฟเวอร์

เมื่อข้อความส่วนตัวทำงานแล้ว คุณสามารถเปลี่ยนเซิร์ฟเวอร์ให้เป็นพื้นที่ทำงานเต็มรูปแบบ ซึ่งแต่ละช่องมีเซสชันเอเจนต์และบริบทแยกเป็นของตนเอง แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีเพียงคุณและบอตของคุณ

<Steps>
  <Step title="Add your server to the guild allowlist">
    การดำเนินการนี้ช่วยให้เอเจนต์ตอบกลับได้ในทุกช่องบนเซิร์ฟเวอร์ของคุณ ไม่ใช่เฉพาะข้อความส่วนตัว

    <Tabs>
      <Tab title="Ask your agent">
        > "เพิ่ม Server ID ของ Discord `<server_id>` ของฉันไปยังรายการอนุญาตของเซิร์ฟเวอร์"
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
    โดยค่าเริ่มต้น เอเจนต์จะตอบกลับในช่องของเซิร์ฟเวอร์เฉพาะเมื่อถูก @กล่าวถึงเท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณอาจต้องการให้เอเจนต์ตอบทุกข้อความ

    ในช่องของเซิร์ฟเวอร์ การตอบกลับปกติจะถูกโพสต์โดยอัตโนมัติตามค่าเริ่มต้น สำหรับห้องที่ใช้ร่วมกันและเปิดตลอดเวลา ให้เลือกใช้ `messages.groupChat.visibleReplies: "message_tool"` เพื่อให้เอเจนต์เฝ้าดูอยู่เงียบ ๆ และโพสต์เฉพาะเมื่อพิจารณาว่าการตอบกลับในช่องมีประโยชน์ วิธีนี้ทำงานได้ดีที่สุดกับโมเดลรุ่นล่าสุดที่ใช้เครื่องมือได้อย่างน่าเชื่อถือ เช่น GPT-5.6 Sol เหตุการณ์ห้องโดยรอบจะไม่ส่งเสียงรบกวน เว้นแต่เครื่องมือจะส่งข้อความ โปรดดู[เหตุการณ์ห้องโดยรอบ](/th/channels/ambient-room-events)สำหรับการกำหนดค่าโหมดเฝ้าดูอย่างครบถ้วน

    หาก Discord แสดงสถานะกำลังพิมพ์และบันทึกแสดงการใช้โทเค็น แต่ไม่มีข้อความถูกโพสต์ ให้ตรวจสอบว่ารอบการทำงานนั้นได้รับการกำหนดค่าเป็นเหตุการณ์ห้องโดยรอบหรือเลือกใช้การตอบกลับที่มองเห็นได้ผ่านเครื่องมือส่งข้อความหรือไม่

    <Tabs>
      <Tab title="Ask your agent">
        > "อนุญาตให้เอเจนต์ของฉันตอบกลับบนเซิร์ฟเวอร์นี้โดยไม่ต้องถูก @กล่าวถึง"
      </Tab>
      <Tab title="Config">
        ตั้งค่า `requireMention: false` ในการกำหนดค่าเซิร์ฟเวอร์ของคุณ:

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

        หากต้องการบังคับให้การตอบกลับแบบกลุ่ม/ช่องที่มองเห็นได้ส่งผ่านเครื่องมือส่งข้อความ ให้ตั้งค่า `messages.groupChat.visibleReplies: "message_tool"`

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    หน่วยความจำระยะยาว (MEMORY.md) จะโหลดโดยอัตโนมัติเฉพาะในเซสชันข้อความส่วนตัว เซสชันในช่องของเซิร์ฟเวอร์จะไม่โหลดไฟล์นี้

    <Tabs>
      <Tab title="Ask your agent">
        > "เมื่อฉันถามคำถามในช่อง Discord ให้ใช้ memory_search หรือ memory_get หากต้องการบริบทระยะยาวจาก MEMORY.md"
      </Tab>
      <Tab title="Manual">
        สำหรับบริบทที่ใช้ร่วมกันในทุกช่อง ให้ใส่คำสั่งที่คงที่ไว้ใน `AGENTS.md` หรือ `USER.md` (ระบบจะแทรกให้ทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงเมื่อต้องการด้วยเครื่องมือหน่วยความจำ
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างช่องและเริ่มสนทนา เอเจนต์จะเห็นชื่อช่อง และแต่ละช่องเป็นเซสชันที่แยกจากกัน คุณสามารถตั้งค่า `#coding`, `#home`, `#research` หรือช่องใด ๆ ที่เหมาะกับเวิร์กโฟลว์ของคุณ

## โมเดลรันไทม์

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord
- การกำหนดเส้นทางตอบกลับเป็นแบบตายตัว: ข้อความขาเข้าจาก Discord จะตอบกลับไปยัง Discord
- ระบบจะเพิ่มข้อมูลเมตาของเซิร์ฟเวอร์/ช่อง Discord ลงในพรอมต์ของโมเดลในฐานะบริบทที่ไม่น่าเชื่อถือ ไม่ใช่คำนำหน้าคำตอบที่ผู้ใช้มองเห็น หากโมเดลคัดลอกกรอบข้อมูลนั้นกลับมา OpenClaw จะนำข้อมูลเมตาที่คัดลอกออกจากคำตอบขาออกและบริบทสำหรับการเล่นซ้ำในอนาคต
- โดยค่าเริ่มต้น (`session.dmScope=main`) การสนทนาโดยตรงจะใช้เซสชันหลักของเอเจนต์ร่วมกัน (`agent:main:main`)
- ช่องของเซิร์ฟเวอร์ใช้คีย์เซสชันที่แยกจากกัน (`agent:<agentId>:discord:channel:<channelId>`)
- ข้อความส่วนตัวแบบกลุ่มจะถูกละเว้นโดยค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่งสแลชแบบเนทีฟทำงานในเซสชันคำสั่งที่แยกจากกัน (`agent:<agentId>:discord:slash:<userId>`) โดยยังคงส่ง `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่กำหนดเส้นทางไว้
- การส่งประกาศ Cron/Heartbeat แบบข้อความล้วนไปยัง Discord จะยุบเหลือเพียงคำตอบสุดท้ายที่ผู้ช่วยมองเห็นและส่งเพียงครั้งเดียว เพย์โหลดสื่อและคอมโพเนนต์แบบมีโครงสร้างจะยังคงส่งเป็นหลายข้อความเมื่อเอเจนต์สร้างเพย์โหลดที่ส่งมอบได้หลายรายการ

## ช่องฟอรัม

ช่องฟอรัมและช่องสื่อของ Discord รับเฉพาะโพสต์ในเธรด OpenClaw รองรับการสร้างโพสต์ดังกล่าวสองวิธี:

- ส่งข้อความไปยังฟอรัมแม่ (`channel:<forumId>`) เพื่อสร้างเธรดโดยอัตโนมัติ ชื่อเธรดจะใช้บรรทัดแรกที่ไม่ว่างของข้อความ (ตัดให้ไม่เกินขีดจำกัดชื่อเธรด 100 อักขระของ Discord)
- ใช้ `openclaw message thread create` เพื่อสร้างเธรดโดยตรง อย่าส่ง `--message-id` สำหรับช่องฟอรัม

ส่งไปยังฟอรัมแม่เพื่อสร้างเธรด:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

สร้างเธรดฟอรัมอย่างชัดเจน:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

ฟอรัมแม่ไม่รองรับคอมโพเนนต์ของ Discord หากต้องการใช้คอมโพเนนต์ ให้ส่งไปยังตัวเธรดโดยตรง (`channel:<threadId>`)

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับคอนเทนเนอร์คอมโพเนนต์ v2 ของ Discord สำหรับข้อความจากเอเจนต์ ใช้เครื่องมือส่งข้อความพร้อมเพย์โหลด `components` ผลลัพธ์จากการโต้ตอบจะถูกส่งกลับไปยังเอเจนต์ในรูปแบบข้อความขาเข้าปกติ และเป็นไปตามการตั้งค่า `replyToMode` ของ Discord ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถวการดำเนินการรองรับปุ่มสูงสุด 5 ปุ่ม หรือเมนูเลือกหนึ่งรายการ
- ประเภทการเลือก: `string`, `user`, `role`, `mentionable`, `channel`

ตามค่าเริ่มต้น คอมโพเนนต์จะใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่อให้สามารถใช้ปุ่ม เมนูเลือก และแบบฟอร์มได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดผู้ที่สามารถคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (รหัสผู้ใช้ Discord, แท็ก หรือ `*`) ผู้ใช้ที่ไม่ตรงเงื่อนไขจะได้รับข้อความปฏิเสธแบบชั่วคราวที่มองเห็นได้เฉพาะตนเอง

โดยค่าเริ่มต้น คอลแบ็กของคอมโพเนนต์จะหมดอายุหลังจาก 30 นาที ตั้งค่า `channels.discord.agentComponents.ttlMs` เพื่อเปลี่ยนอายุของรีจิสทรีคอลแบ็กสำหรับบัญชีเริ่มต้น หรือกำหนด `channels.discord.accounts.<accountId>.agentComponents.ttlMs` แยกตามบัญชี ค่านี้มีหน่วยเป็นมิลลิวินาที ต้องเป็นจำนวนเต็มบวก และมีค่าสูงสุด `86400000` (24 ชั่วโมง) ค่า TTL ที่ยาวขึ้นเหมาะกับเวิร์กโฟลว์การตรวจสอบ/อนุมัติที่ต้องการให้ปุ่มยังคงใช้งานได้ แต่จะขยายช่วงเวลาที่ข้อความ Discord เก่ายังสามารถทริกเกอร์การดำเนินการได้ ควรใช้ TTL ที่สั้นที่สุดซึ่งเพียงพอต่อการใช้งาน และคงค่าเริ่มต้นไว้หากคอลแบ็กเก่าอาจทำให้เกิดพฤติกรรมที่ไม่คาดคิด

คำสั่งแบบสแลช `/model` และ `/models` จะเปิดตัวเลือกโมเดลแบบโต้ตอบ ซึ่งมีรายการแบบเลื่อนลงสำหรับผู้ให้บริการ โมเดล และรันไทม์ที่เข้ากันได้ พร้อมขั้นตอน Submit คำสั่ง `/models add` เลิกใช้งานแล้ว และจะส่งคืนข้อความแจ้งการเลิกใช้งานแทนการลงทะเบียนโมเดลจากแชต การตอบกลับของตัวเลือกเป็นแบบชั่วคราวที่มองเห็นได้เฉพาะตนเอง และใช้งานได้เฉพาะผู้ใช้ที่เรียกคำสั่ง เมนูเลือกของ Discord จำกัดไว้ที่ 25 ตัวเลือก ดังนั้นให้เพิ่มรายการ `provider/*` ลงใน `agents.defaults.models` เมื่อต้องการให้ตัวเลือกแสดงโมเดลที่ค้นพบแบบไดนามิกเฉพาะสำหรับผู้ให้บริการที่เลือก เช่น `openai` หรือ `vllm`

ไฟล์แนบ:

- บล็อก `file` ต้องชี้ไปยังการอ้างอิงไฟล์แนบ (`attachment://<filename>`)
- ระบุไฟล์แนบผ่าน `media`/`path`/`filePath` (ไฟล์เดียว) ใช้ `media-gallery` สำหรับหลายไฟล์
- ใช้ `filename` เพื่อแทนที่ชื่อไฟล์ที่อัปโหลด เมื่อต้องการให้ชื่อตรงกับการอ้างอิงไฟล์แนบ

แบบฟอร์มโมดัล:

- เพิ่ม `components.modal` โดยมีฟิลด์ได้สูงสุด 5 ฟิลด์
- ประเภทฟิลด์: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw จะเพิ่มปุ่มทริกเกอร์ให้อัตโนมัติ

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
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM ส่วน `channels.discord.allowFrom` คือรายการอนุญาต DM หลัก

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist` (ต้องมีผู้ส่งอย่างน้อยหนึ่งรายใน `allowFrom`)
    - `open` (กำหนดให้ `channels.discord.allowFrom` ต้องมี `"*"`)
    - `disabled`

    หากนโยบาย DM ไม่ใช่แบบเปิด ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือได้รับข้อความแจ้งให้จับคู่ในโหมด `pairing`)

    ลำดับความสำคัญสำหรับหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - สำหรับหนึ่งบัญชี `allowFrom` มีลำดับความสำคัญเหนือ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อไม่ได้ตั้งค่าทั้ง `allowFrom` ของบัญชีนั้นและ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    ระบบยังคงอ่าน `channels.discord.dm.policy` และ `channels.discord.dm.allowFrom` แบบเดิมเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อสามารถทำได้โดยไม่เปลี่ยนแปลงการเข้าถึง

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การกล่าวถึง `<@id>`

    โดยปกติ รหัสตัวเลขล้วนจะถูกตีความเป็นรหัสช่องเมื่อมีค่าเริ่มต้นของช่องทำงานอยู่ แต่รหัสที่อยู่ใน `allowFrom` สำหรับ DM ที่มีผลของบัญชีจะถูกตีความเป็นเป้าหมาย DM ของผู้ใช้เพื่อความเข้ากันได้

  </Tab>

  <Tab title="Access groups">
    DM ของ Discord และการอนุญาตคำสั่งข้อความสามารถใช้รายการแบบไดนามิก `accessGroup:<name>` ใน `channels.discord.allowFrom`

    ชื่อกลุ่มการเข้าถึงใช้ร่วมกันในทุกช่องข้อความ ใช้ `type: "message.senders"` สำหรับกลุ่มแบบคงที่ซึ่งระบุสมาชิกด้วยไวยากรณ์ `allowFrom` ปกติของแต่ละช่อง หรือใช้ `type: "discord.channelAudience"` เมื่อต้องการให้กลุ่มผู้ใช้ที่มีสิทธิ์ `ViewChannel` ในปัจจุบันของช่อง Discord เป็นตัวกำหนดสมาชิกแบบไดนามิก พฤติกรรมร่วมของกลุ่มการเข้าถึง: [กลุ่มการเข้าถึง](/th/channels/access-groups)

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

    ช่องข้อความ Discord ไม่มีรายชื่อสมาชิกแยกต่างหาก `type: "discord.channelAudience"` กำหนดรูปแบบสมาชิกดังนี้: ผู้ส่ง DM เป็นสมาชิกของกิลด์ที่กำหนดค่าไว้ และมีสิทธิ์ `ViewChannel` ที่มีผลอยู่ในปัจจุบันบนช่องที่กำหนดค่า หลังจากใช้บทบาทและการเขียนทับสิทธิ์ของช่องแล้ว

    ตัวอย่าง: อนุญาตให้ทุกคนที่มองเห็น `#maintainers` ส่ง DM ถึงบอตได้ ขณะที่ยังคงปิด DM สำหรับบุคคลอื่นทั้งหมด

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

    การค้นหาจะปฏิเสธการเข้าถึงเมื่อเกิดข้อผิดพลาด หาก Discord ส่งคืน `Missing Access` การค้นหาสมาชิกล้มเหลว หรือช่องเป็นของกิลด์อื่น ผู้ส่ง DM จะถูกถือว่าไม่มีสิทธิ์

    เปิดใช้ **Server Members Intent** ใน Discord Developer Portal เมื่อใช้กลุ่มการเข้าถึงตามกลุ่มผู้ใช้ของช่อง เนื่องจาก DM ไม่มีสถานะสมาชิกกิลด์ OpenClaw จึงค้นหาสมาชิกผ่าน Discord REST ในขณะตรวจสอบสิทธิ์

  </Tab>

  <Tab title="Guild policy">
    การจัดการกิลด์ควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    ค่าพื้นฐานที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    พฤติกรรมของ `allowlist`:

    - กิลด์ต้องตรงกับ `channels.discord.guilds` (แนะนำให้ใช้ `id` และรองรับ slug)
    - รายการอนุญาตผู้ส่งแบบไม่บังคับ: `users` (แนะนำให้ใช้รหัสที่คงที่) และ `roles` (รหัสบทบาทเท่านั้น) หากกำหนดค่าอย่างใดอย่างหนึ่ง ผู้ส่งจะได้รับอนุญาตเมื่อตรงกับ `users` หรือ `roles`
    - การจับคู่ชื่อ/แท็กโดยตรงถูกปิดใช้งานตามค่าเริ่มต้น เปิดใช้ `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเป็นโหมดความเข้ากันได้ฉุกเฉินเท่านั้น
    - `users` รองรับชื่อ/แท็ก แต่รหัสปลอดภัยกว่า `openclaw security audit` จะแจ้งเตือนเมื่อใช้รายการชื่อ/แท็ก
    - หากกิลด์กำหนดค่า `channels` ไว้ ช่องที่ไม่อยู่ในรายการจะถูกปฏิเสธ
    - หากกิลด์ไม่มีบล็อก `channels` ช่องทั้งหมดในกิลด์ที่อยู่ในรายการอนุญาตจะได้รับอนุญาต

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
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    คีย์ `allow` แบบเดิมที่กำหนดแยกตามช่องจะถูกย้ายไปเป็น `enabled` โดย `openclaw doctor --fix`

    หากคุณตั้งค่าเฉพาะ `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` ค่าสำรองขณะรันไทม์คือ `groupPolicy="allowlist"` (พร้อมคำเตือนในบันทึก) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`

  </Tab>

  <Tab title="Mentions and group DMs">
    โดยค่าเริ่มต้น ข้อความในกิลด์ต้องมีการกล่าวถึง

    การตรวจจับการกล่าวถึงประกอบด้วย:

    - การกล่าวถึงบอตอย่างชัดเจน
    - รูปแบบการกล่าวถึงที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns` โดยใช้ `messages.groupChat.mentionPatterns` เป็นค่าสำรอง)
    - พฤติกรรมการตอบกลับถึงบอตโดยนัยในกรณีที่รองรับ

    เมื่อเขียนข้อความขาออกของ Discord ให้ใช้ไวยากรณ์การกล่าวถึงมาตรฐาน: `<@USER_ID>` สำหรับผู้ใช้ `<#CHANNEL_ID>` สำหรับช่อง และ `<@&ROLE_ID>` สำหรับบทบาท อย่าใช้รูปแบบการกล่าวถึงชื่อเล่นแบบเดิม `<@!USER_ID>`

    กำหนดค่า `requireMention` แยกตามกิลด์/ช่อง (`channels.discord.guilds...`)
    `ignoreOtherMentions` สามารถเลือกให้ละทิ้งข้อความที่กล่าวถึงผู้ใช้/บทบาทอื่นแต่ไม่ได้กล่าวถึงบอต (ไม่รวม @everyone/@here)

    DM แบบกลุ่ม:

    - ค่าเริ่มต้น: ไม่สนใจ (`dm.groupEnabled=false`)
    - รายการอนุญาตแบบไม่บังคับผ่าน `dm.groupChannels` (รหัสช่องหรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตามบทบาท

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิกกิลด์ Discord ไปยังเอเจนต์ต่าง ๆ ตามรหัสบทบาท การผูกตามบทบาทรองรับเฉพาะรหัสบทบาท และจะถูกประเมินหลังการผูกแบบเพียร์หรือเพียร์แม่ แต่ก่อนการผูกเฉพาะกิลด์ หากการผูกกำหนดฟิลด์จับคู่อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ฟิลด์ที่กำหนดค่าทั้งหมดต้องตรงกัน

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
- การเขียนทับแยกตามช่องทาง: `channels.discord.commands.native`
- `commands.native=false` จะข้ามการลงทะเบียนและการล้างคำสั่งแบบสแลชของ Discord ระหว่างการเริ่มต้นระบบ คำสั่งที่ลงทะเบียนไว้ก่อนหน้านี้อาจยังปรากฏใน Discord จนกว่าคุณจะลบออกจากแอป Discord
- การยืนยันสิทธิ์ของคำสั่งเนทีฟใช้รายการอนุญาต/นโยบายของ Discord ชุดเดียวกับการจัดการข้อความปกติ
- คำสั่งอาจยังปรากฏใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต แต่เมื่อเรียกใช้งาน OpenClaw จะบังคับใช้การยืนยันสิทธิ์และตอบว่า "ไม่ได้รับอนุญาต"
- การตั้งค่าเริ่มต้นของคำสั่งแบบสแลช: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`)

ดูแค็ตตาล็อกและลักษณะการทำงานของคำสั่งได้ที่ [คำสั่งแบบสแลช](/th/tools/slash-commands)

## รายละเอียดฟีเจอร์

<AccordionGroup>
  <Accordion title="แท็กการตอบกลับและการตอบกลับแบบเนทีฟ">
    Discord รองรับแท็กการตอบกลับในเอาต์พุตของเอเจนต์:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    ควบคุมด้วย `channels.discord.replyToMode`:

    - `off` (ค่าเริ่มต้น): ไม่มีการจัดเธรดการตอบกลับโดยนัย แต่ยังคงใช้แท็ก `[[reply_to_*]]` ที่ระบุอย่างชัดเจน
    - `first`: แนบการอ้างอิงการตอบกลับแบบเนทีฟโดยนัยกับข้อความ Discord ขาออกข้อความแรกของรอบ
    - `all`: แนบกับข้อความขาออกทุกข้อความ
    - `batched`: แนบเฉพาะเมื่อเหตุการณ์ขาเข้าเป็นชุดข้อความหลายรายการที่ผ่านการหน่วงเพื่อลดการเรียกซ้ำ เหมาะเมื่อคุณต้องการการตอบกลับแบบเนทีฟเป็นหลักสำหรับการสนทนาที่ส่งข้อความถี่และกำกวม ไม่ใช่ทุกรอบที่มีข้อความเดียว

    รหัสข้อความจะแสดงในบริบท/ประวัติ เพื่อให้เอเจนต์ระบุเป้าหมายเป็นข้อความเฉพาะได้

  </Accordion>

  <Accordion title="ตัวอย่างลิงก์">
    โดยค่าเริ่มต้น Discord จะสร้างเนื้อหาฝังแบบสมบูรณ์สำหรับ URL ส่วน OpenClaw จะระงับเนื้อหาฝังที่สร้างขึ้นเหล่านั้นในข้อความ Discord ขาออกโดยค่าเริ่มต้น ดังนั้น URL ที่เอเจนต์ส่งจะยังคงเป็นลิงก์ธรรมดา เว้นแต่คุณจะเลือกเปิดใช้:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    ตั้งค่า `channels.discord.accounts.<id>.suppressEmbeds` เพื่อเขียนทับสำหรับบัญชีหนึ่งบัญชี การส่งผ่านเครื่องมือข้อความของเอเจนต์สามารถส่ง `suppressEmbeds: false` สำหรับข้อความเดียวได้เช่นกัน เพย์โหลด `embeds` ของ Discord ที่ระบุอย่างชัดเจนจะไม่ถูกระงับโดยการตั้งค่าตัวอย่างลิงก์เริ่มต้น

  </Accordion>

  <Accordion title="ตัวอย่างสตรีมสด">
    OpenClaw สามารถสตรีมร่างคำตอบโดยส่งข้อความชั่วคราวและแก้ไขข้อความนั้นเมื่อข้อความเข้ามา `channels.discord.streaming.mode` รับค่า `off` | `partial` | `block` | `progress` (ค่าเริ่มต้นเมื่อไม่ได้ตั้งค่าคีย์ `streaming`/`streamMode` แบบเดิม) `streamMode` เป็นนามแฝงแบบเดิม ให้เรียกใช้ `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าที่บันทึกไว้ใหม่ให้อยู่ในรูปแบบ `streaming` แบบซ้อนที่เป็นมาตรฐาน

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

    - `off` ปิดการแก้ไขตัวอย่าง Discord
    - `partial` แก้ไขข้อความตัวอย่างข้อความเดียวเมื่อโทเค็นเข้ามา
    - `block` ส่งส่วนข้อความขนาดเท่าร่าง ปรับขนาดและจุดแบ่งด้วย `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`) โดยจะถูกจำกัดไม่ให้เกิน `textChunkLimit` เมื่อเปิดใช้การสตรีมแบบบล็อกอย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน
    - `progress` เก็บร่างสถานะที่แก้ไขได้หนึ่งรายการและอัปเดตด้วยความคืบหน้าของเครื่องมือจนกว่าจะส่งผลลัพธ์สุดท้าย ป้ายเริ่มต้นที่ใช้ร่วมกันเป็นบรรทัดที่เลื่อนต่อเนื่อง จึงจะเลื่อนหายไปเหมือนส่วนอื่นเมื่อมีรายละเอียดงานมากพอ
    - ผลลัพธ์สุดท้ายที่เป็นสื่อ ข้อผิดพลาด และการตอบกลับที่ระบุอย่างชัดเจนจะยกเลิกการแก้ไขตัวอย่างที่รอดำเนินการ
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความตัวอย่างซ้ำหรือไม่
    - แถวเครื่องมือ/ความคืบหน้าจะแสดงในรูปแบบกระชับเป็นอีโมจิ + ชื่อเรื่อง + รายละเอียดเมื่อมี เช่น `🛠️ Bash: เรียกใช้การทดสอบ` หรือ `🔎 Web Search: สำหรับ "คำค้น"`
    - `streaming.progress.commentary` (ค่าเริ่มต้น `false`) ใช้เลือกให้รวมข้อความคำอธิบาย/ข้อความนำของผู้ช่วยในร่างความคืบหน้าชั่วคราว ข้อความคำอธิบายจะถูกทำความสะอาดก่อนแสดงผล ยังคงเป็นข้อมูลชั่วคราว และไม่เปลี่ยนแปลงการส่งคำตอบสุดท้าย
    - `streaming.progress.maxLineChars` ควบคุมโควตาตัวอย่างความคืบหน้าต่อบรรทัด ข้อความร้อยแก้วจะถูกย่อที่ขอบเขตคำ ส่วนรายละเอียดคำสั่งและพาธจะคงส่วนท้ายที่มีประโยชน์ไว้
    - `streaming.preview.commandText` / `streaming.progress.commandText` ควบคุมรายละเอียดคำสั่ง/การดำเนินการในบรรทัดความคืบหน้าแบบกระชับ: `raw` (ค่าเริ่มต้น) หรือ `status` (เฉพาะป้ายเครื่องมือ)

    ซ่อนข้อความคำสั่ง/การดำเนินการดิบ โดยยังคงแสดงบรรทัดความคืบหน้าแบบกระชับ:

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

    การสตรีมตัวอย่างรองรับเฉพาะข้อความ การตอบกลับที่มีสื่อจะกลับไปใช้การส่งตามปกติ

  </Accordion>

  <Accordion title="ประวัติ บริบท และลักษณะการทำงานของเธรด">
    บริบทประวัติกิลด์:

    - ค่าเริ่มต้นของ `channels.discord.historyLimit` คือ `20`
    - ค่าสำรอง: `messages.groupChat.historyLimit`
    - `0` หมายถึงปิดใช้งาน

    การควบคุมประวัติข้อความส่วนตัว:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    ลักษณะการทำงานของเธรด:

    - เธรด Discord จะถูกกำหนดเส้นทางเป็นเซสชันของช่องและสืบทอดการกำหนดค่าของช่องแม่ เว้นแต่จะมีการเขียนทับ
    - เซสชันเธรดสืบทอดการเลือก `/model` ระดับเซสชันของช่องแม่เป็นค่าสำรองเฉพาะโมเดล การเลือก `/model` ภายในเธรดมีลำดับความสำคัญสูงกว่า และจะไม่คัดลอกประวัติทรานสคริปต์ของช่องแม่ เว้นแต่จะเปิดใช้การสืบทอดทรานสคริปต์
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) เลือกให้เธรดอัตโนมัติใหม่เริ่มต้นด้วยทรานสคริปต์จากช่องแม่ การเขียนทับแยกตามบัญชี: `channels.discord.accounts.<id>.thread.inheritParent`
    - รีแอ็กชันจากเครื่องมือข้อความสามารถจำแนกเป้าหมายข้อความส่วนตัว `user:<id>` ได้
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะยังคงอยู่ระหว่างการใช้ค่าสำรองเพื่อเปิดใช้งานในขั้นตอนการตอบกลับ

    หัวข้อช่องจะถูกแทรกเป็นบริบทที่ **ไม่น่าเชื่อถือ** รายการอนุญาตควบคุมว่าใครสามารถเรียกเอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมทั้งหมด

  </Accordion>

  <Accordion title="เซสชันที่ผูกกับเธรดสำหรับเอเจนต์ย่อย">
    Discord สามารถผูกเธรดกับเป้าหมายเซสชัน เพื่อให้ข้อความติดตามผลในเธรดนั้นยังคงถูกกำหนดเส้นทางไปยังเซสชันเดิม (รวมถึงเซสชันของเอเจนต์ย่อย)

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/เธรดใหม่กับเป้าหมายเอเจนต์ย่อย/เซสชัน
    - `/unfocus` ลบการผูกเธรดปัจจุบัน
    - `/agents` แสดงการทำงานที่ใช้งานอยู่และสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการยกเลิกการโฟกัสอัตโนมัติเมื่อไม่มีการใช้งานสำหรับการผูกที่โฟกัสอยู่
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
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    หมายเหตุ:

    - `session.threadBindings.*` กำหนดค่าเริ่มต้นส่วนกลาง ส่วน `channels.discord.threadBindings.*` เขียนทับลักษณะการทำงานของ Discord
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดอัตโนมัติสำหรับ `sessions_spawn({ thread: true })` และการสร้างเธรด ACP ค่าเริ่มต้น: `true`
    - `defaultSpawnContext` ควบคุมบริบทเนทีฟของเอเจนต์ย่อยสำหรับการสร้างที่ผูกกับเธรด ค่าเริ่มต้น: `"fork"`
    - คีย์ `spawnSubagentSessions`/`spawnAcpSessions` ที่เลิกใช้แล้วจะถูกย้ายข้อมูลโดย `openclaw doctor --fix`
    - หากปิดใช้การผูกเธรดสำหรับบัญชีหนึ่ง `/focus` และการดำเนินการผูกเธรดที่เกี่ยวข้องจะไม่พร้อมใช้งาน

    ดู [เอเจนต์ย่อย](/th/tools/subagents), [เอเจนต์ ACP](/th/tools/acp-agents) และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="การผูกช่อง ACP แบบถาวร">
    สำหรับพื้นที่ทำงาน ACP แบบ "เปิดตลอดเวลา" ที่มีความเสถียร ให้กำหนดค่าการผูก ACP แบบระบุชนิดในระดับบนสุด โดยกำหนดเป้าหมายไปยังการสนทนา Discord

    พาธการกำหนดค่า: `bindings[]` ที่มี `type: "acp"` และ `match.channel: "discord"`

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

    - `/acp spawn codex --bind here` ผูกช่องหรือเธรดปัจจุบันไว้กับตำแหน่งเดิม และทำให้ข้อความในอนาคตใช้เซสชัน ACP เดิมต่อไป ข้อความในเธรดสืบทอดการผูกของช่องแม่
    - ในช่องหรือเธรดที่ผูกไว้ `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP เดิมภายในตำแหน่งนั้น การผูกเธรดชั่วคราวสามารถเขียนทับการจำแนกเป้าหมายขณะที่ยังทำงานอยู่
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดย่อยผ่าน `--thread auto|here`

    ดูรายละเอียดลักษณะการทำงานของการผูกได้ที่ [เอเจนต์ ACP](/th/tools/acp-agents)

  </Accordion>

  <Accordion title="การแจ้งเตือนรีแอ็กชัน">
    โหมดการแจ้งเตือนรีแอ็กชันแยกตามกิลด์ (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    เหตุการณ์รีแอ็กชันจะถูกแปลงเป็นเหตุการณ์ระบบและแนบกับเซสชัน Discord ที่กำหนดเส้นทางแล้ว

  </Accordion>

  <Accordion title="รีแอ็กชันตอบรับ">
    `ackReaction` ส่งอีโมจิตอบรับขณะที่ OpenClaw ประมวลผลข้อความขาเข้า

    ลำดับการจำแนกค่า:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - ใช้อีโมจิประจำตัวเอเจนต์เป็นค่าสำรอง (`agents.list[].identity.emoji` หากไม่มีให้ใช้ "👀")

    หมายเหตุ:

    - Discord รองรับอีโมจิยูนิโคดหรือชื่ออีโมจิที่กำหนดเอง
    - ใช้ `""` เพื่อปิดใช้รีแอ็กชันสำหรับช่องหรือบัญชี

    **ขอบเขต (`messages.ackReactionScope`):**

    ค่า: `"all"` (ข้อความส่วนตัว + กลุ่ม รวมถึงเหตุการณ์ห้องที่เกิดขึ้นโดยรอบ), `"direct"` (ข้อความส่วนตัวเท่านั้น), `"group-all"` (ทุกข้อความกลุ่มยกเว้นเหตุการณ์ห้องที่เกิดขึ้นโดยรอบ ไม่มีข้อความส่วนตัว), `"group-mentions"` (กลุ่มเมื่อมีการกล่าวถึงบอต โดย **ไม่มีข้อความส่วนตัว** และเป็นค่าเริ่มต้น), `"off"` / `"none"` (ปิดใช้งาน)

    <Note>
    ขอบเขตเริ่มต้น (`"group-mentions"`) จะไม่เรียกรีแอ็กชันตอบรับในข้อความส่วนตัวหรือเหตุการณ์ห้องที่เกิดขึ้นโดยรอบ หากต้องการรีแอ็กชันตอบรับสำหรับข้อความส่วนตัว Discord ขาเข้าและเหตุการณ์ในห้องที่เงียบ ให้ตั้งค่า `messages.ackReactionScope` เป็น `"all"`
    </Note>

  </Accordion>

  <Accordion title="การเขียนการกำหนดค่า">
    การเขียนการกำหนดค่าที่เริ่มต้นจากช่องจะเปิดใช้งานโดยค่าเริ่มต้น ซึ่งมีผลต่อโฟลว์ `/config set|unset` (เมื่อเปิดใช้ฟีเจอร์คำสั่ง)

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
    กำหนดเส้นทางทราฟฟิก WebSocket ของเกตเวย์ Discord และการค้นหา REST ระหว่างเริ่มต้นระบบ (รหัสแอปพลิเคชัน + การจำแนกรายการอนุญาต) ผ่านพร็อกซี HTTP(S) ด้วย `channels.discord.proxy`
    ต้องกำหนดการใช้พร็อกซีสำหรับ WebSocket ของเกตเวย์ Discord อย่างชัดเจน การเชื่อมต่อ WebSocket จะไม่สืบทอดตัวแปรสภาพแวดล้อมพร็อกซีโดยรอบจากกระบวนการ Gateway การค้นหา REST ระหว่างเริ่มต้นระบบจะใช้พร็อกซีนี้เมื่อกำหนดค่า `channels.discord.proxy`

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    การเขียนทับแยกตามบัญชี:

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
    เปิดใช้การจำแนก PluralKit เพื่อจับคู่ข้อความที่ส่งผ่านพร็อกซีกับข้อมูลประจำตัวสมาชิกของระบบ:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // ไม่บังคับ; จำเป็นสำหรับระบบส่วนตัว
      },
    },
  },
}
```

    หมายเหตุ:

    - รายการอนุญาตสามารถใช้ `pk:<memberId>`
    - ชื่อที่แสดงของสมาชิกจะจับคู่ด้วยชื่อ/สลักเท่านั้นเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การค้นหาจะเรียกใช้ API ของ PluralKit ด้วย ID ข้อความต้นฉบับ
    - หากการค้นหาล้มเหลว ข้อความที่ส่งผ่านพร็อกซีจะถือเป็นข้อความจากบอตและถูกละทิ้ง เว้นแต่ `allowBots` จะอนุญาตให้ผ่าน

  </Accordion>

  <Accordion title="Outbound mention aliases">
    ใช้ `mentionAliases` เมื่อเอเจนต์ต้องระบุการกล่าวถึงขาออกแบบกำหนดแน่นอนสำหรับผู้ใช้ Discord ที่ทราบอยู่แล้ว คีย์คือชื่อเรียกที่ไม่มี `@` นำหน้า ส่วนค่าคือ ID ผู้ใช้ Discord ชื่อเรียกที่ไม่รู้จัก, `@everyone`, `@here` และการกล่าวถึงภายในช่วงโค้ด Markdown จะคงเดิม

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
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
    การอัปเดตสถานะการออนไลน์จะมีผลเมื่อคุณกำหนดฟิลด์สถานะหรือกิจกรรม หรือเมื่อเปิดใช้สถานะการออนไลน์อัตโนมัติ

    เฉพาะสถานะ:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    กิจกรรม (สถานะแบบกำหนดเองเป็นประเภทกิจกรรมเริ่มต้นเมื่อกำหนด `activity`):

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

    การสตรีม:

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

    ตารางประเภทกิจกรรม:

    - 0: กำลังเล่น
    - 1: กำลังสตรีม (ต้องมี `activityUrl`; และ `activityUrl` ต้องใช้ร่วมกับ `activityType: 1`)
    - 2: กำลังฟัง
    - 3: กำลังรับชม
    - 4: กำหนดเอง (ใช้ข้อความกิจกรรมเป็นค่าสถานะ; อีโมจิไม่บังคับ)
    - 5: กำลังแข่งขัน

    สถานะการออนไลน์อัตโนมัติ (สัญญาณสุขภาพของรันไทม์):

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

    สถานะการออนไลน์อัตโนมัติจะจับคู่ความพร้อมใช้งานของรันไทม์กับสถานะ Discord: ปกติ => ออนไลน์, ประสิทธิภาพลดลงหรือไม่ทราบ => ไม่ได้ใช้งาน, โทเค็นหมดหรือไม่พร้อมใช้งาน => ห้ามรบกวน ค่าเริ่มต้น: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (ต้องน้อยกว่าหรือเท่ากับ `intervalMs`) สามารถกำหนดข้อความทดแทนได้:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับตัวยึดตำแหน่ง `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord รองรับการจัดการการอนุมัติด้วยปุ่มในข้อความส่วนตัว และสามารถเลือกโพสต์คำขออนุมัติในช่องต้นทางได้

    พาธการกำหนดค่า:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; หากทำได้จะย้อนกลับไปใช้ `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord จะเปิดใช้การอนุมัติการดำเนินการแบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้กำหนด `enabled` หรือกำหนดเป็น `"auto"` และสามารถระบุผู้อนุมัติได้อย่างน้อยหนึ่งราย ไม่ว่าจะจาก `execApprovals.approvers` หรือ `commands.ownerAllowFrom` Discord จะไม่อนุมานผู้อนุมัติการดำเนินการจาก `allowFrom` ของช่อง, `dm.allowFrom` แบบเดิม หรือ `defaultTo` ของข้อความส่วนตัว กำหนด `enabled: false` เพื่อปิดใช้ Discord ในฐานะไคลเอนต์การอนุมัติแบบเนทีฟอย่างชัดเจน

    สำหรับคำสั่งกลุ่มที่ละเอียดอ่อนและจำกัดเฉพาะเจ้าของ เช่น `/diagnostics` และ `/export-trajectory` OpenClaw จะส่งคำขออนุมัติและผลลัพธ์สุดท้ายแบบส่วนตัว โดยจะลองใช้ข้อความส่วนตัวของ Discord ก่อนเมื่อเจ้าของที่เรียกใช้มีเส้นทางเจ้าของผ่าน Discord มิฉะนั้นจะย้อนกลับไปใช้เส้นทางเจ้าของแรกที่พร้อมใช้งานจาก `commands.ownerAllowFrom` เช่น Telegram

    เมื่อ `target` เป็น `channel` หรือ `both` คำขออนุมัติจะปรากฏในช่อง เฉพาะผู้อนุมัติที่ระบุได้เท่านั้นที่สามารถใช้ปุ่มได้ ส่วนผู้ใช้อื่นจะได้รับการปฏิเสธที่มองเห็นได้เฉพาะตน คำขออนุมัติจะแสดงข้อความคำสั่งด้วย ดังนั้นควรเปิดใช้การส่งไปยังช่องเฉพาะในช่องที่เชื่อถือได้ หากไม่สามารถหา ID ช่องจากคีย์เซสชันได้ OpenClaw จะย้อนกลับไปส่งผ่านข้อความส่วนตัว

    Discord จะแสดงปุ่มอนุมัติร่วมที่ช่องแชตอื่นใช้ อะแดปเตอร์ Discord แบบเนทีฟมีหน้าที่หลักในการกำหนดเส้นทางข้อความส่วนตัวไปยังผู้อนุมัติและกระจายไปยังช่อง เมื่อมีปุ่มเหล่านี้ ปุ่มจะเป็นประสบการณ์หลักสำหรับการอนุมัติ OpenClaw ควรแสดงคำสั่ง `/approve` แบบดำเนินการเองเฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่าการอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติด้วยตนเองเป็นหนทางเดียว หากรันไทม์การอนุมัติแบบเนทีฟของ Discord ไม่ทำงาน OpenClaw จะยังแสดงข้อความแจ้ง `/approve <id> <decision>` ที่กำหนดผลลัพธ์แน่นอนภายในเครื่อง หากรันไทม์ทำงานอยู่แต่ไม่สามารถส่งการ์ดแบบเนทีฟไปยังเป้าหมายใดได้ OpenClaw จะส่งข้อความแจ้งสำรองในแชตเดียวกัน พร้อมคำสั่ง `/approve` ที่ตรงกับการอนุมัติที่รอดำเนินการทุกประการ

    การยืนยันตัวตนของ Gateway และการประมวลผลการอนุมัติเป็นไปตามสัญญาไคลเอนต์ Gateway ร่วม (ID ที่ขึ้นต้นด้วย `plugin:` จะประมวลผลผ่าน `plugin.approval.resolve`; ID อื่นจะผ่าน `exec.approval.resolve`) โดยค่าเริ่มต้น การอนุมัติจะหมดอายุหลังจาก 30 นาที

    ดู[การอนุมัติการดำเนินการ](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและด่านควบคุมการดำเนินการ

การดำเนินการกับข้อความ Discord ครอบคลุมการรับส่งข้อความ การดูแลช่อง การกลั่นกรอง สถานะการออนไลน์ และข้อมูลเมตา

ตัวอย่างหลัก:

- การรับส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- ปฏิกิริยา: `react`, `reactions`, `emojiList`
- การกลั่นกรอง: `timeout`, `kick`, `ban`
- สถานะการออนไลน์: `setPresence`

การดำเนินการ `event-create` รองรับพารามิเตอร์ `image` ที่ไม่บังคับ (URL หรือพาธไฟล์ภายในเครื่อง) สำหรับกำหนดภาพปกของกิจกรรมตามกำหนดการ

ด่านควบคุมการดำเนินการอยู่ภายใต้ `channels.discord.actions.*`

พฤติกรรมเริ่มต้นของด่านควบคุม:

| กลุ่มการดำเนินการ                                                                                                                                                             | ค่าเริ่มต้น  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้  |
| roles                                                                                                                                                                    | ปิดใช้ |
| moderation                                                                                                                                                               | ปิดใช้ |
| presence                                                                                                                                                                 | ปิดใช้ |

## UI คอมโพเนนต์ v2

OpenClaw ใช้คอมโพเนนต์ Discord v2 สำหรับการอนุมัติการดำเนินการและเครื่องหมายข้ามบริบท การดำเนินการกับข้อความ Discord ยังสามารถรับ `components` สำหรับ UI แบบกำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้างเพย์โหลดคอมโพเนนต์ผ่านเครื่องมือ Discord) ขณะที่ `embeds` แบบเดิมยังคงใช้งานได้แต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` กำหนดสีเน้นที่คอนเทนเนอร์คอมโพเนนต์ Discord ใช้ (เลขฐานสิบหก) แยกตามบัญชี: `channels.discord.accounts.<id>.ui.components.accentColor`
- `channels.discord.agentComponents.ttlMs` ควบคุมระยะเวลาที่คอลแบ็กของคอมโพเนนต์ Discord ที่ส่งไปแล้วยังคงลงทะเบียนอยู่ (ค่าเริ่มต้น `1800000`, สูงสุด `86400000`) แยกตามบัญชี: `channels.discord.accounts.<id>.agentComponents.ttlMs`
- ระบบจะละเว้น `embeds` เมื่อมีคอมโพเนนต์ v2
- การแสดงตัวอย่าง URL ธรรมดาจะถูกระงับโดยค่าเริ่มต้น กำหนด `suppressEmbeds: false` ในการดำเนินการกับข้อความเมื่อต้องการให้ลิงก์ขาออกเพียงลิงก์เดียวแสดงตัวอย่างแบบขยาย

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

Discord มีพื้นผิวเสียงสองแบบที่แตกต่างกัน ได้แก่ **ช่องเสียง** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบแสดงตัวอย่างคลื่นเสียง) Gateway รองรับทั้งสองแบบ

### ช่องเสียง

รายการตรวจสอบการตั้งค่า:

1. เปิดใช้ Message Content Intent ใน Discord Developer Portal
2. เปิดใช้ Server Members Intent เมื่อใช้รายการอนุญาตตามบทบาท/ผู้ใช้
3. เชิญบอตโดยใช้ขอบเขต `bot` และ `applications.commands`
4. ให้สิทธิ์ Connect, Speak, Send Messages และ Read Message History ในช่องเสียงเป้าหมาย
5. เปิดใช้คำสั่งแบบเนทีฟ (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งนี้ใช้เอเจนต์เริ่มต้นของบัญชีและปฏิบัติตามกฎรายการอนุญาตและนโยบายกลุ่มเดียวกับคำสั่ง Discord อื่น

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

หากต้องการตรวจสอบสิทธิ์ที่มีผลจริงของบอตก่อนเข้าร่วม:

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
        model: "openai/gpt-5.6-sol",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

หมายเหตุ:

- เสียงของ Discord เป็นฟีเจอร์ที่ต้องเลือกเปิดใช้สำหรับการกำหนดค่าที่ใช้เฉพาะข้อความ ให้ตั้งค่า `channels.discord.voice.enabled=true` (หรือคงบล็อก `channels.discord.voice` ที่มีอยู่ไว้) เพื่อเปิดใช้คำสั่ง `/vc`, รันไทม์เสียง และเจตนาของ Gateway `GuildVoiceStates` ส่วน `channels.discord.intents.voiceStates` สามารถเขียนทับการสมัครรับเจตนานี้อย่างชัดเจนได้ หากไม่ตั้งค่า ระบบจะทำตามสถานะการเปิดใช้เสียงที่มีผลจริง
- `voice.mode` ควบคุมเส้นทางการสนทนา ค่าเริ่มต้นคือ `agent-proxy`: ส่วนหน้าสำหรับเสียงแบบเรียลไทม์จะจัดการจังหวะผลัดการพูด การขัดจังหวะ และการเล่นเสียง มอบหมายงานที่มีสาระให้เอเจนต์ OpenClaw ที่ถูกกำหนดเส้นทางผ่าน `openclaw_agent_consult` และปฏิบัติต่อผลลัพธ์เสมือนเป็นพรอมต์ Discord ที่ผู้พูดคนนั้นพิมพ์เข้ามา ส่วน `stt-tts` จะคงโฟลว์แบบชุดเดิมที่ใช้ STT ร่วมกับ TTS และ `bidi` ช่วยให้โมเดลเรียลไทม์สนทนาได้โดยตรง พร้อมเปิดให้ใช้ `openclaw_agent_consult` เป็นสมองของ OpenClaw
- `voice.agentSession` ควบคุมว่าการสนทนา OpenClaw ใดจะรับผลัดการพูดด้วยเสียง หากไม่ตั้งค่า จะใช้เซสชันของช่องเสียงเอง หรือตั้งค่าเป็น `{ mode: "target", target: "channel:<text-channel-id>" }` เพื่อให้ช่องเสียงทำหน้าที่เป็นส่วนขยายไมโครโฟน/ลำโพงของเซสชันช่องข้อความ Discord ที่มีอยู่ เช่น `#maintainers`
- `voice.model` เขียนทับสมองเอเจนต์ OpenClaw สำหรับการตอบกลับด้วยเสียงใน Discord และการปรึกษาแบบเรียลไทม์ หากไม่ตั้งค่า จะสืบทอดโมเดลเอเจนต์ที่ถูกกำหนดเส้นทาง ค่านี้แยกจาก `voice.realtime.model`
- `voice.followUsers` ช่วยให้บอตเข้าร่วม ย้าย และออกจากเสียง Discord ตามผู้ใช้ที่เลือก โปรดดู [ติดตามผู้ใช้ในเสียง](#follow-users-in-voice)
- `agent-proxy` กำหนดเส้นทางเสียงพูดผ่าน `discord-voice` ซึ่งยังคงการอนุญาตของเจ้าของ/เครื่องมือตามปกติสำหรับผู้พูดและเซสชันเป้าหมาย แต่ซ่อนเครื่องมือ `tts` ของเอเจนต์ เนื่องจากเสียง Discord เป็นผู้ควบคุมการเล่น ตามค่าเริ่มต้น `agent-proxy` ให้สิทธิ์เข้าถึงเครื่องมือแบบเต็มเทียบเท่าเจ้าของแก่การปรึกษาสำหรับผู้พูดที่เป็นเจ้าของ (`voice.realtime.toolPolicy: "owner"`) และให้ความสำคัญอย่างยิ่งกับการปรึกษาเอเจนต์ OpenClaw ก่อนตอบคำถามที่มีสาระ (`voice.realtime.consultPolicy: "always"`) ในโหมด `always` เริ่มต้นนี้ ชั้นเรียลไทม์จะไม่พูดข้อความถ่วงเวลาโดยอัตโนมัติก่อนคำตอบจากการปรึกษา แต่จะจับและถอดเสียงคำพูด จากนั้นจึงพูดคำตอบของ OpenClaw ที่ถูกกำหนดเส้นทาง หากคำตอบจากการปรึกษาแบบบังคับหลายรายการเสร็จสิ้นขณะที่ Discord ยังเล่นคำตอบแรกอยู่ คำตอบแบบใช้ข้อความตรงเป็นคำพูดรายการหลังจะถูกเข้าคิวจนกว่าการเล่นจะว่าง แทนที่จะเขียนทับเสียงพูดกลางประโยค
- ในโหมด `stt-tts` ระบบ STT ใช้ `tools.media.audio` และ `voice.model` ไม่มีผลต่อการถอดเสียง
- ในโหมดเรียลไทม์ `voice.realtime.provider`, `voice.realtime.model` และ `voice.realtime.speakerVoice` ใช้กำหนดค่าเซสชันเสียงเรียลไทม์ สำหรับ OpenAI Realtime 2.1 ร่วมกับสมอง Codex ให้ใช้ `voice.realtime.model: "gpt-realtime-2.1"` และ `voice.model: "openai/gpt-5.6-sol"`
- โดยค่าเริ่มต้น โหมดเสียงเรียลไทม์จะรวมไฟล์โปรไฟล์ขนาดเล็ก `IDENTITY.md`, `USER.md` และ `SOUL.md` ไว้ในคำสั่งของผู้ให้บริการเรียลไทม์ เพื่อให้ผลัดการพูดโดยตรงแบบรวดเร็วยังคงอัตลักษณ์ การยึดโยงกับผู้ใช้ และบุคลิกเดียวกับเอเจนต์ OpenClaw ที่ถูกกำหนดเส้นทาง ตั้งค่า `voice.realtime.bootstrapContextFiles` เป็นชุดย่อยเพื่อปรับแต่ง หรือเป็น `[]` เพื่อปิดใช้ รองรับเฉพาะไฟล์โปรไฟล์เหล่านี้เท่านั้น ส่วน `AGENTS.md` ยังคงอยู่ในบริบทเอเจนต์ตามปกติ บริบทโปรไฟล์ที่แทรกเข้ามาไม่สามารถใช้แทน `openclaw_agent_consult` สำหรับงานในพื้นที่ทำงาน ข้อเท็จจริงปัจจุบัน การค้นหาหน่วยความจำ หรือการดำเนินการที่อาศัยเครื่องมือได้
- ในโหมดเรียลไทม์ `agent-proxy` ของ OpenAI ให้ตั้งค่า `voice.realtime.requireWakeName: true` เพื่อให้เสียงเรียลไทม์ของ Discord เงียบอยู่จนกว่าข้อความถอดเสียงจะเริ่มต้นหรือลงท้ายด้วยชื่อปลุก ชื่อปลุกที่กำหนดค่าต้องมีหนึ่งหรือสองคำ หากไม่ได้ตั้งค่า `voice.realtime.wakeNames` OpenClaw จะใช้ `name` ของเอเจนต์ที่ถูกกำหนดเส้นทางร่วมกับ `OpenClaw` และหากไม่มีจะใช้รหัสเอเจนต์ร่วมกับ `OpenClaw` การคัดกรองด้วยชื่อปลุกจะปิดการตอบกลับอัตโนมัติของผู้ให้บริการเรียลไทม์ กำหนดเส้นทางผลัดการพูดที่ยอมรับผ่านเส้นทางการปรึกษาเอเจนต์ OpenClaw และกล่าวตอบรับสั้น ๆ เมื่อระบบจดจำชื่อปลุกที่อยู่ต้นข้อความจากการถอดเสียงบางส่วนได้ ก่อนข้อความถอดเสียงสุดท้ายจะมาถึง
- ผู้ให้บริการเรียลไทม์ของ OpenAI รองรับชื่อเหตุการณ์ Realtime 2 ปัจจุบันและนามแฝงแบบเดิมที่เข้ากันได้กับ Codex สำหรับเหตุการณ์เสียงเอาต์พุตและข้อความถอดเสียง ดังนั้นสแนปช็อตผู้ให้บริการที่เข้ากันได้จึงเปลี่ยนแปลงคลาดเคลื่อนได้โดยไม่ทำให้เสียงของผู้ช่วยสูญหาย
- `voice.realtime.bargeIn` ควบคุมว่าเหตุการณ์เริ่มพูดของผู้พูดใน Discord จะขัดจังหวะการเล่นเสียงเรียลไทม์ที่กำลังทำงานอยู่หรือไม่ หากไม่ตั้งค่า ระบบจะทำตามการตั้งค่าการขัดจังหวะด้วยเสียงอินพุตของผู้ให้บริการเรียลไทม์
- `voice.realtime.minBargeInAudioEndMs` ควบคุมระยะเวลาขั้นต่ำของการเล่นเสียงผู้ช่วย ก่อนที่การขัดจังหวะแบบเรียลไทม์ของ OpenAI จะตัดเสียง ค่าเริ่มต้น: `250` ตั้งค่าเป็น `0` เพื่อขัดจังหวะทันทีในห้องที่มีเสียงสะท้อนต่ำ หรือเพิ่มค่าในสภาพแวดล้อมที่ใช้ลำโพงและมีเสียงสะท้อนมาก
- `voice.tts` เขียนทับ `messages.tts` เฉพาะสำหรับการเล่นเสียงในโหมด `stt-tts` ส่วนโหมดเรียลไทม์จะใช้ `voice.realtime.speakerVoice` แทน สำหรับเสียง OpenAI ที่ใช้เล่นใน Discord ให้ตั้งค่า `voice.tts.provider: "openai"` และเลือกเสียงแปลงข้อความเป็นคำพูดภายใต้ `voice.tts.providers.openai.speakerVoice` โดย `cedar` เป็นตัวเลือกที่ให้โทนเสียงผู้ชายได้ดีบนโมเดล TTS ของ OpenAI ปัจจุบัน
- การเขียนทับ `systemPrompt` ของ Discord รายช่องจะมีผลกับผลัดการพูดจากข้อความถอดเสียงในช่องเสียงนั้น
- ผลัดการพูดจากข้อความถอดเสียงจะกำหนดสถานะเจ้าของจาก `allowFrom` ของ Discord (หรือ `dm.allowFrom`) สำหรับคำสั่งและการดำเนินการในช่องที่จำกัดเฉพาะเจ้าของ การมองเห็นเครื่องมือของเอเจนต์จะเป็นไปตามนโยบายเครื่องมือที่กำหนดค่าสำหรับเซสชันที่ถูกกำหนดเส้นทาง
- หาก `voice.autoJoin` มีหลายรายการสำหรับกิลด์เดียวกัน OpenClaw จะเข้าร่วมช่องสุดท้ายที่กำหนดค่าไว้สำหรับกิลด์นั้น
- `voice.allowedChannels` คือรายการอนุญาตสำหรับช่องที่พำนักซึ่งเป็นตัวเลือก หากไม่ตั้งค่า จะอนุญาตให้ `/vc join` เข้าสู่ช่องเสียง Discord ใด ๆ ที่ได้รับอนุญาต เมื่อตั้งค่า `/vc join`, การเข้าร่วมอัตโนมัติเมื่อเริ่มต้น และการย้ายสถานะเสียงของบอต จะถูกจำกัดไว้เฉพาะรายการ `{ guildId, channelId }` ที่ระบุ ตั้งค่าเป็นอาร์เรย์ว่างเพื่อปฏิเสธการเข้าร่วมเสียง Discord ทั้งหมด หาก Discord ย้ายบอตออกนอกรายการอนุญาต OpenClaw จะออกจากช่องนั้นและกลับเข้าร่วมเป้าหมายการเข้าร่วมอัตโนมัติที่กำหนดค่าไว้เมื่อมีเป้าหมายดังกล่าว
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` จะถูกส่งต่อไปยังตัวเลือกการเข้าร่วมของ `@discordjs/voice` โดยค่าเริ่มต้นของต้นทางคือ `daveEncryption=true` และ `decryptionFailureTolerance=24`
- OpenClaw ใช้โคเดก `libopus-wasm` ที่รวมมาให้สำหรับการรับเสียง Discord และการเล่น PCM ดิบแบบเรียลไทม์ โดยมาพร้อมบิลด์ WebAssembly ของ libopus ที่ตรึงเวอร์ชันไว้ และไม่ต้องใช้ส่วนเสริม opus แบบเนทีฟ
- `voice.connectTimeoutMs` ควบคุมระยะเวลารอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับความพยายาม `/vc join` และการเข้าร่วมอัตโนมัติ ค่าเริ่มต้น: `30000`
- `voice.reconnectGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอให้เซสชันเสียงที่ตัดการเชื่อมต่อเริ่มเชื่อมต่อใหม่ก่อนทำลายเซสชัน ค่าเริ่มต้น: `15000`
- ในโหมด `stt-tts` การเล่นเสียงจะไม่หยุดเพียงเพราะผู้ใช้อื่นเริ่มพูด เพื่อหลีกเลี่ยงวงจรป้อนกลับ OpenClaw จะละเว้นการจับเสียงใหม่ขณะ TTS กำลังเล่น ให้พูดหลังจากเล่นเสร็จสำหรับผลัดถัดไป โหมดเรียลไทม์จะส่งต่อการเริ่มพูดของผู้พูดเป็นสัญญาณขัดจังหวะไปยังผู้ให้บริการเรียลไทม์
- ในโหมดเรียลไทม์ เสียงสะท้อนจากลำโพงที่เข้าสู่ไมโครโฟนซึ่งเปิดอยู่ อาจดูเหมือนการขัดจังหวะและหยุดการเล่นเสียง สำหรับห้อง Discord ที่มีเสียงสะท้อนมาก ให้ตั้งค่า `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` เพื่อไม่ให้ OpenAI ขัดจังหวะอัตโนมัติเมื่อมีเสียงอินพุต เพิ่ม `voice.realtime.bargeIn: true` หากยังต้องการให้เหตุการณ์เริ่มพูดของผู้พูดใน Discord ขัดจังหวะการเล่นที่กำลังทำงานอยู่ บริดจ์เรียลไทม์ของ OpenAI จะละเว้นการตัดการเล่นที่สั้นกว่า `voice.realtime.minBargeInAudioEndMs` โดยถือว่าน่าจะเป็นเสียงสะท้อน/สัญญาณรบกวน และบันทึกว่าได้ข้ามเหตุการณ์นั้น แทนที่จะล้างการเล่นของ Discord
- `voice.captureSilenceGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอหลังจาก Discord รายงานว่าผู้พูดหยุดพูด ก่อนสรุปเซกเมนต์เสียงนั้นเพื่อส่งให้ STT ค่าเริ่มต้น: `2000` ให้เพิ่มค่านี้หาก Discord แบ่งช่วงหยุดปกติออกเป็นข้อความถอดเสียงบางส่วนที่ขาดเป็นช่วง ๆ
- เมื่อเลือก ElevenLabs เป็นผู้ให้บริการ TTS การเล่นเสียง Discord จะใช้ TTS แบบสตรีมและเริ่มเล่นจากสตรีมการตอบกลับของผู้ให้บริการ ผู้ให้บริการที่ไม่รองรับการสตรีมจะย้อนกลับไปใช้เส้นทางไฟล์ชั่วคราวที่สังเคราะห์ขึ้น
- OpenClaw เฝ้าดูความล้มเหลวในการถอดรหัสของเสียงที่รับ และกู้คืนอัตโนมัติโดยออกจากแล้วกลับเข้าร่วมช่องเสียงหลังเกิดความล้มเหลวซ้ำ ๆ ภายในช่วงเวลาสั้น
- หากหลังอัปเดต บันทึกการรับแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำ ๆ ให้รวบรวมรายงานการขึ้นต่อกันและบันทึก บรรทัด `@discordjs/voice` ที่รวมมาให้มีการแก้ไขปัญหาการเติมข้อมูลจาก PR #11449 ของ discord.js ต้นทาง ซึ่งปิดปัญหา #11419 ของ discord.js แล้ว
- เหตุการณ์การรับ `The operation was aborted` เป็นสิ่งที่คาดไว้เมื่อ OpenClaw สรุปเซกเมนต์เสียงของผู้พูดที่จับไว้ เหตุการณ์เหล่านี้เป็นข้อมูลวินิจฉัยแบบละเอียด ไม่ใช่คำเตือน
- บันทึกเสียง Discord แบบละเอียดจะมีตัวอย่างข้อความถอดเสียง STT หนึ่งบรรทัดที่จำกัดความยาวสำหรับแต่ละเซกเมนต์ของผู้พูดที่ยอมรับ เพื่อให้การแก้จุดบกพร่องแสดงทั้งฝั่งผู้ใช้และฝั่งคำตอบของเอเจนต์โดยไม่เทข้อความถอดเสียงที่ไม่จำกัดความยาว
- ในโหมด `agent-proxy` การย้อนกลับไปใช้การปรึกษาแบบบังคับจะข้ามส่วนข้อความถอดเสียงที่น่าจะไม่สมบูรณ์ เช่น ข้อความที่ลงท้ายด้วย `...` หรือคำเชื่อมท้ายอย่าง "และ" รวมถึงคำปิดท้ายที่เห็นชัดว่าไม่ต้องดำเนินการ เช่น "เดี๋ยวกลับมา" หรือ "ลาก่อน" บันทึกจะแสดง `forced agent consult skipped reason=...` เมื่อกลไกนี้ป้องกันคำตอบเก่าที่ค้างอยู่ในคิว

### ติดตามผู้ใช้ในเสียง

ใช้ `voice.followUsers` เมื่อต้องการให้บอตเสียง Discord อยู่กับผู้ใช้ Discord ที่รู้จักตั้งแต่หนึ่งคนขึ้นไป แทนการเข้าร่วมช่องคงที่เมื่อเริ่มต้นหรือรอ `/vc join`

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

ลักษณะการทำงาน:

- `followUsers` ยอมรับรหัสผู้ใช้ Discord แบบดิบและค่า `discord:<id>` OpenClaw จะปรับทั้งสองรูปแบบให้เป็นมาตรฐานก่อนจับคู่เหตุการณ์สถานะเสียง
- `followUsersEnabled` มีค่าเริ่มต้นเป็น `true` เมื่อกำหนดค่า `followUsers` ตั้งค่าเป็น `false` เพื่อเก็บรายการที่บันทึกไว้แต่หยุดการติดตามเสียงอัตโนมัติ
- เมื่อผู้ใช้ที่ติดตามเข้าร่วมช่องเสียงที่อนุญาต OpenClaw จะเข้าร่วมช่องนั้น เมื่อผู้ใช้ย้าย OpenClaw จะย้ายตาม และเมื่อผู้ใช้ที่กำลังติดตามตัดการเชื่อมต่อ OpenClaw จะออก
- หากมีผู้ใช้ที่ติดตามหลายคนอยู่ในกิลด์เดียวกัน และผู้ใช้ที่กำลังติดตามออก OpenClaw จะย้ายไปยังช่องของผู้ใช้ที่ติดตามและกำลังถูกตรวจสอบคนอื่นก่อนออกจากกิลด์ หากผู้ใช้ที่ติดตามหลายคนย้ายพร้อมกัน เหตุการณ์สถานะเสียงที่สังเกตเห็นล่าสุดจะมีผล
- `allowedChannels` ยังคงมีผล ผู้ใช้ที่ติดตามซึ่งอยู่ในช่องที่ไม่อนุญาตจะถูกละเว้น และเซสชันที่การติดตามเป็นเจ้าของจะย้ายไปยังผู้ใช้ที่ติดตามคนอื่นหรือออก
- OpenClaw จะกระทบยอดเหตุการณ์สถานะเสียงที่พลาดไปเมื่อเริ่มต้นและตามช่วงเวลาที่จำกัดไว้ การกระทบยอดจะสุ่มตรวจสอบกิลด์ที่กำหนดค่าและจำกัดจำนวนการค้นหาผ่าน REST ต่อรอบ ดังนั้นรายการ `followUsers` ที่มีขนาดใหญ่มากอาจต้องใช้มากกว่าหนึ่งช่วงเวลาจึงจะเข้าสู่สถานะสอดคล้องกัน
- หาก Discord หรือผู้ดูแลระบบย้ายบอตขณะที่กำลังติดตามผู้ใช้ OpenClaw จะสร้างเซสชันเสียงใหม่และคงความเป็นเจ้าของโดยการติดตามไว้เมื่อปลายทางได้รับอนุญาต หากบอตถูกย้ายออกนอก `allowedChannels` OpenClaw จะออกและกลับเข้าร่วมเป้าหมายที่กำหนดค่าไว้เมื่อมีเป้าหมายดังกล่าว
- การกู้คืนการรับ DAVE อาจออกจากและกลับเข้าร่วมช่องเดิมหลังจากถอดรหัสล้มเหลวซ้ำ ๆ เซสชันที่การติดตามเป็นเจ้าของจะคงความเป็นเจ้าของโดยการติดตามผ่านเส้นทางการกู้คืนนี้ ดังนั้นเมื่อผู้ใช้ที่ติดตามตัดการเชื่อมต่อในภายหลัง ระบบยังคงออกจากช่อง

เลือกระหว่างโหมดการเข้าร่วม:

- ใช้ `followUsers` สำหรับการตั้งค่าส่วนบุคคลหรือการตั้งค่าของผู้ควบคุม ซึ่งบอตควรอยู่ในเสียงโดยอัตโนมัติเมื่อคุณอยู่
- ใช้ `autoJoin` สำหรับบอตประจำห้องที่ควรอยู่แม้ไม่มีผู้ใช้ที่ติดตามอยู่ในเสียง
- ใช้ `/vc join` สำหรับการเข้าร่วมครั้งเดียวหรือห้องที่การปรากฏตัวด้วยเสียงอัตโนมัติอาจเป็นเรื่องไม่คาดคิด

โคเดกเสียง Discord:

- บันทึกการรับเสียงแสดง `discord voice: opus decoder: libopus-wasm`
- การเล่นแบบเรียลไทม์จะเข้ารหัส PCM สเตอริโอดิบ 48 kHz เป็น Opus ด้วยแพ็กเกจ `libopus-wasm` ที่รวมมาให้ชุดเดียวกัน ก่อนส่งแพ็กเก็ตให้ `@discordjs/voice`
- การเล่นจากไฟล์และสตรีมของผู้ให้บริการจะแปลงเป็น PCM สเตอริโอดิบ 48 kHz ด้วย ffmpeg จากนั้นใช้ `libopus-wasm` สำหรับสตรีมแพ็กเก็ต Opus ที่ส่งไปยัง Discord

ไปป์ไลน์ STT ร่วมกับ TTS:

- การบันทึกเสียง PCM ของ Discord จะถูกแปลงเป็นไฟล์ WAV ชั่วคราว
- `tools.media.audio` จัดการ STT เช่น `openai/gpt-4o-mini-transcribe`
- ทรานสคริปต์จะถูกส่งผ่านทางเข้าข้อความและการกำหนดเส้นทางของ Discord ขณะที่ LLM สำหรับการตอบกลับทำงานภายใต้นโยบายเอาต์พุตเสียงที่ซ่อนเครื่องมือ `tts` ของเอเจนต์และกำหนดให้ส่งคืนข้อความ เนื่องจากระบบเสียงของ Discord เป็นผู้ควบคุมการเล่น TTS ขั้นสุดท้าย
- เมื่อตั้งค่า `voice.model` ค่านี้จะแทนที่เฉพาะ LLM สำหรับการตอบกลับในรอบของช่องเสียงนี้
- `voice.tts` จะถูกรวมทับบน `messages.tts` โดยผู้ให้บริการที่รองรับการสตรีมจะส่งข้อมูลเข้าสู่เครื่องเล่นโดยตรง มิฉะนั้นไฟล์เสียงที่ได้จะถูกเล่นในช่องที่เข้าร่วมอยู่

ตัวอย่างเซสชันช่องเสียงแบบพร็อกซีเอเจนต์เริ่มต้น:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

หากไม่มีบล็อก `voice.agentSession` ช่องเสียงแต่ละช่องจะมีเซสชัน OpenClaw ที่กำหนดเส้นทางไว้เป็นของตนเอง ตัวอย่างเช่น `/vc join channel:234567890123456789` จะสื่อสารกับเซสชันของช่องเสียง Discord นั้น โมเดลแบบเรียลไทม์เป็นเพียงส่วนหน้าสำหรับเสียงเท่านั้น ส่วนคำขอที่มีเนื้อหาสาระจะถูกส่งต่อให้เอเจนต์ OpenClaw ที่กำหนดค่าไว้ หากโมเดลแบบเรียลไทม์สร้างทรานสคริปต์สุดท้ายโดยไม่เรียกใช้เครื่องมือปรึกษา OpenClaw จะบังคับให้มีการปรึกษาเป็นกลไกสำรอง เพื่อให้พฤติกรรมเริ่มต้นยังคงเหมือนการสนทนากับเอเจนต์

ตัวอย่าง STT ร่วมกับ TTS แบบเดิม:

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

ตัวอย่างการสื่อสารสองทิศทางแบบเรียลไทม์:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
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
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

ในโหมด `agent-proxy` บอตจะเข้าร่วมช่องเสียงที่กำหนดค่าไว้ แต่รอบการทำงานของเอเจนต์ OpenClaw จะใช้เซสชันและเอเจนต์ที่กำหนดเส้นทางตามปกติของช่องเป้าหมาย เซสชันเสียงแบบเรียลไทม์จะพูดผลลัพธ์ที่ส่งคืนกลับเข้าไปในช่องเสียง เอเจนต์ควบคุมยังคงใช้เครื่องมือรับส่งข้อความตามปกติได้ตามนโยบายเครื่องมือของตน รวมถึงการส่งข้อความ Discord แยกต่างหาก หากเป็นการดำเนินการที่เหมาะสม

ขณะที่การทำงาน OpenClaw ที่มอบหมายไว้กำลังดำเนินอยู่ ทรานสคริปต์เสียง Discord ใหม่จะถูกใช้เป็นคำสั่งควบคุมการทำงานแบบสด ก่อนที่จะเริ่มรอบการทำงานของเอเจนต์อีกครั้ง วลีอย่าง "สถานะ", "ยกเลิกอันนั้น", "ใช้การแก้ไขที่เล็กกว่า" หรือ "เมื่อเสร็จแล้วให้ตรวจสอบการทดสอบด้วย" จะถูกจำแนกเป็นอินพุตสำหรับสถานะ การยกเลิก การชี้นำ หรือการติดตามผลของเซสชันที่กำลังทำงาน ผลลัพธ์ของสถานะ การยกเลิก การชี้นำที่ยอมรับ และการติดตามผลจะถูกพูดกลับเข้าไปในช่องเสียง เพื่อให้ผู้เรียกทราบว่า OpenClaw จัดการคำขอนั้นแล้วหรือไม่

รูปแบบเป้าหมายที่มีประโยชน์:

- `target: "channel:123456789012345678"` กำหนดเส้นทางผ่านเซสชันช่องข้อความ Discord
- `target: "123456789012345678"` จะถือว่าเป็นเป้าหมายช่อง
- `target: "dm:123456789012345678"` หรือ `target: "user:123456789012345678"` กำหนดเส้นทางผ่านเซสชันข้อความโดยตรงนั้น

ตัวอย่าง OpenAI Realtime สำหรับสภาพแวดล้อมที่มีเสียงสะท้อนมาก:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
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

ใช้การตั้งค่านี้เมื่อโมเดลได้ยินเสียงที่ Discord เล่นกลับของตัวเองผ่านไมโครโฟนที่เปิดอยู่ แต่คุณยังต้องการขัดจังหวะด้วยการพูด OpenClaw จะป้องกันไม่ให้ OpenAI ขัดจังหวะโดยอัตโนมัติจากเสียงอินพุตดิบ ขณะที่ `bargeIn: true` ช่วยให้เหตุการณ์เริ่มพูดของผู้พูดใน Discord และเสียงของผู้พูดที่กำลังใช้งานอยู่สามารถยกเลิกการตอบกลับแบบเรียลไทม์ที่กำลังทำงาน ก่อนที่รอบเสียงที่บันทึกถัดไปจะไปถึง OpenAI สัญญาณแทรกเสียงที่เกิดเร็วมากและมีค่า `audioEndMs` ต่ำกว่า `minBargeInAudioEndMs` จะถือว่าอาจเป็นเสียงสะท้อนหรือสัญญาณรบกวนและถูกละเว้น เพื่อไม่ให้โมเดลหยุดเสียงตั้งแต่เฟรมแรกของการเล่น

บันทึกเสียงที่ควรพบ:

- เมื่อเข้าร่วม: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- เมื่อเริ่มทำงานแบบเรียลไทม์: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- เมื่อมีเสียงจากผู้พูด: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` และ `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- เมื่อข้ามคำพูดเก่าที่ค้างอยู่: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` หรือ `reason=non-actionable-closing ...`
- เมื่อการตอบกลับแบบเรียลไทม์เสร็จสิ้น: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- เมื่อหยุดหรือรีเซ็ตการเล่น: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- เมื่อมีการปรึกษาแบบเรียลไทม์: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- เมื่อเอเจนต์ตอบ: `discord voice: agent turn answer ...`
- เมื่อจัดคิวคำพูดแบบตรงตามข้อความ: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...` ตามด้วย `discord voice: realtime exact speech dequeued reason=player-idle ...`
- เมื่อตรวจพบการแทรกเสียง: `discord voice: realtime barge-in detected source=speaker-start ...` หรือ `discord voice: realtime barge-in detected source=active-speaker-audio ...` ตามด้วย `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- เมื่อขัดจังหวะแบบเรียลไทม์: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in` ตามด้วย `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` หรือ `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- เมื่อละเว้นเสียงสะท้อนหรือสัญญาณรบกวน: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- เมื่อปิดใช้การแทรกเสียง: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- เมื่อไม่มีการเล่นเสียง: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

หากต้องการดีบักเสียงที่ถูกตัด ให้อ่านบันทึกเสียงแบบเรียลไทม์ตามลำดับเวลา:

1. `realtime audio playback started` หมายความว่า Discord เริ่มเล่นเสียงของผู้ช่วยแล้ว บริดจ์จะเริ่มนับส่วนข้อมูลเอาต์พุตของผู้ช่วย จำนวนไบต์ PCM ของ Discord จำนวนไบต์แบบเรียลไทม์ของผู้ให้บริการ และระยะเวลาเสียงที่สังเคราะห์ขึ้นนับจากจุดนี้
2. `realtime speaker turn opened` ระบุว่าผู้พูดใน Discord เริ่มทำงาน หากกำลังเล่นเสียงอยู่แล้วและเปิดใช้ `bargeIn` เหตุการณ์นี้อาจตามด้วย `barge-in detected source=speaker-start`
3. `realtime input audio started` ระบุเฟรมเสียงจริงเฟรมแรกที่ได้รับในรอบการพูดนั้น หากตรงนี้มี `outputActive=true` หรือ `outputAudioMs` ไม่เป็นศูนย์ แสดงว่าไมโครโฟนกำลังส่งอินพุตขณะที่เสียงของผู้ช่วยยังคงเล่นอยู่
4. `barge-in detected source=active-speaker-audio` หมายความว่า OpenClaw ตรวจพบเสียงสดจากผู้พูดขณะที่เสียงของผู้ช่วยกำลังเล่นอยู่ ข้อมูลนี้ช่วยแยกแยะการขัดจังหวะจริงออกจากเหตุการณ์เริ่มพูดของ Discord ที่ไม่มีเสียงที่ใช้งานได้
5. `barge-in requested reason=...` หมายความว่า OpenClaw ขอให้ผู้ให้บริการแบบเรียลไทม์ยกเลิกหรือตัดการตอบกลับที่กำลังทำงาน โดยมี `outputAudioMs`, `outputActive` และ `playbackChunks` เพื่อให้เห็นว่าเสียงของผู้ช่วยถูกเล่นจริงไปมากเพียงใดก่อนการขัดจังหวะ
6. `realtime audio playback stopped reason=...` คือจุดรีเซ็ตการเล่นเสียงภายใน Discord เหตุผลจะระบุว่าใครหยุดการเล่น ได้แก่ `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` หรือ `session-close`
7. `realtime speaker turn closed` สรุปรอบอินพุตที่บันทึกไว้ หาก `chunks=0` หรือ `hasAudio=false` หมายความว่ารอบการพูดเปิดขึ้น แต่ไม่มีเสียงที่ใช้งานได้ไปถึงบริดจ์แบบเรียลไทม์ หาก `interruptedPlayback=true` หมายความว่ารอบอินพุตนั้นทับซ้อนกับเอาต์พุตของผู้ช่วยและเรียกใช้ตรรกะการแทรกเสียง

ฟิลด์ที่มีประโยชน์:

- `outputAudioMs`: ระยะเวลาเสียงของผู้ช่วยที่ผู้ให้บริการแบบเรียลไทม์สร้างขึ้นก่อนบรรทัดบันทึกนั้น
- `audioMs`: ระยะเวลาเสียงของผู้ช่วยที่ OpenClaw นับได้ก่อนหยุดเล่น
- `elapsedMs`: เวลาตามนาฬิการะหว่างการเปิดและปิดสตรีมการเล่นหรือรอบการพูด
- `discordBytes`: จำนวนไบต์ PCM สเตอริโอ 48 kHz ที่ส่งไปยังหรือรับมาจากระบบเสียง Discord
- `realtimeBytes`: จำนวนไบต์ PCM ในรูปแบบของผู้ให้บริการที่ส่งไปยังหรือรับมาจากผู้ให้บริการแบบเรียลไทม์
- `playbackChunks`: ส่วนข้อมูลเสียงของผู้ช่วยที่ส่งต่อไปยัง Discord สำหรับการตอบกลับที่กำลังทำงาน
- `sinceLastAudioMs`: ช่วงเวลาระหว่างเฟรมเสียงล่าสุดของผู้พูดที่บันทึกได้กับการปิดรอบการพูด

รูปแบบที่พบบ่อย:

- เสียงถูกตัดทันทีโดยมี `source=active-speaker-audio`, ค่า `outputAudioMs` ต่ำ และผู้ใช้คนเดิมอยู่ใกล้เคียง มักบ่งชี้ว่าเสียงสะท้อนจากลำโพงเข้าสู่ไมโครโฟน ให้เพิ่ม `voice.realtime.minBargeInAudioEndMs` ลดระดับเสียงลำโพง ใช้หูฟัง หรือตั้งค่า `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`
- `source=speaker-start` ตามด้วย `speaker turn closed ... hasAudio=false` หมายความว่า Discord รายงานว่าผู้พูดเริ่มพูด แต่ไม่มีเสียงไปถึง OpenClaw ซึ่งอาจเป็นเหตุการณ์เสียงชั่วคราวของ Discord พฤติกรรมของตัวกรองเสียงรบกวน หรือไคลเอนต์เปิดไมโครโฟนเพียงชั่วขณะ
- `audio playback stopped reason=stream-close` โดยไม่มีการแทรกเสียงหรือ `provider-clear-audio` ใกล้เคียง หมายความว่าสตรีมการเล่นเสียงภายใน Discord สิ้นสุดลงโดยไม่คาดคิด ให้ตรวจสอบบันทึกของผู้ให้บริการและเครื่องเล่น Discord ก่อนหน้านั้น
- `capture ignored during playback (barge-in disabled)` หมายความว่า OpenClaw ละทิ้งอินพุตโดยเจตนาขณะที่เสียงของผู้ช่วยกำลังเล่นอยู่ เปิดใช้ `voice.realtime.bargeIn` หากต้องการให้เสียงพูดขัดจังหวะการเล่น
- `barge-in ignored ... outputActive=false` หมายความว่า Discord หรือ VAD ของผู้ให้บริการรายงานเสียงพูด แต่ OpenClaw ไม่มีการเล่นเสียงที่กำลังทำงานให้ขัดจังหวะ กรณีนี้ไม่ควรตัดเสียง

ข้อมูลประจำตัวจะถูกแยกแก้ไขตามแต่ละองค์ประกอบ ได้แก่ การรับรองความถูกต้องของเส้นทาง LLM สำหรับ `voice.model`, การรับรองความถูกต้องของ STT สำหรับ `tools.media.audio`, การรับรองความถูกต้องของ TTS สำหรับ `messages.tts`/`voice.tts` และการรับรองความถูกต้องของผู้ให้บริการแบบเรียลไทม์สำหรับ `voice.realtime.providers` หรือการกำหนดค่าการรับรองความถูกต้องตามปกติของผู้ให้บริการ

### ข้อความเสียง

ข้อความเสียง Discord แสดงตัวอย่างรูปคลื่นและต้องใช้เสียง OGG/Opus OpenClaw สร้างรูปคลื่นโดยอัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ Gateway เพื่อตรวจสอบและแปลงไฟล์

- ระบุ **เส้นทางไฟล์ภายในเครื่อง** (URL จะถูกปฏิเสธ)
- ไม่ต้องระบุเนื้อหาข้อความ (Discord ปฏิเสธข้อความและข้อความเสียงที่อยู่ในเพย์โหลดเดียวกัน)
- รองรับรูปแบบเสียงทุกชนิด โดย OpenClaw จะแปลงเป็น OGG/Opus ตามความจำเป็น

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ใช้เจตนาที่ไม่ได้รับอนุญาต หรือบอตไม่เห็นข้อความในกิลด์">

    - เปิดใช้งาน Message Content Intent
    - เปิดใช้งาน Server Members Intent เมื่อคุณต้องใช้การระบุผู้ใช้/สมาชิก
    - รีสตาร์ต Gateway หลังจากเปลี่ยน intents

  </Accordion>

  <Accordion title="ข้อความในกิลด์ถูกบล็อกโดยไม่คาดคิด">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบรายการอนุญาตของกิลด์ภายใต้ `channels.discord.guilds`
    - หากมีแมป `channels` ของกิลด์ จะอนุญาตเฉพาะช่องที่ระบุไว้เท่านั้น
    - ตรวจสอบลักษณะการทำงานของ `requireMention` และรูปแบบการกล่าวถึง

    การตรวจสอบที่มีประโยชน์:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="ตั้งค่าไม่ต้องกล่าวถึงแล้วแต่ยังถูกบล็อก">
    สาเหตุที่พบบ่อย:

    - `groupPolicy="allowlist"` โดยไม่มีรายการอนุญาตของกิลด์/ช่องที่ตรงกัน
    - กำหนดค่า `requireMention` ผิดตำแหน่ง (ต้องอยู่ภายใต้ `channels.discord.guilds` หรือรายการของช่อง)
    - ผู้ส่งถูกบล็อกโดยรายการอนุญาต `users` ของกิลด์/ช่อง

  </Accordion>

  <Accordion title="รอบการทำงานของ Discord ใช้เวลานานหรือมีการตอบซ้ำ">

    บันทึกทั่วไป:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    ตัวปรับแต่งคิว Gateway ของ Discord:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ค่านี้ควบคุมเฉพาะงานของตัวรับฟัง Gateway ของ Discord ไม่ใช่อายุการทำงานของรอบเอเจนต์

    Discord ไม่ใช้การหมดเวลาที่ช่องเป็นเจ้าของกับรอบเอเจนต์ที่อยู่ในคิว ตัวรับฟังข้อความจะส่งต่องานทันที และงาน Discord ที่อยู่ในคิวจะรักษาลำดับของแต่ละเซสชันไว้จนกว่าวงจรชีวิตของเซสชัน/เครื่องมือ/รันไทม์จะเสร็จสมบูรณ์หรือยกเลิกงาน

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

  <Accordion title="คำเตือนการหมดเวลาขณะค้นหาข้อมูลเมตาของ Gateway">
    OpenClaw ดึงข้อมูลเมตา `/gateway/bot` ของ Discord ก่อนเชื่อมต่อ หากเกิดความล้มเหลวชั่วคราว ระบบจะย้อนกลับไปใช้ URL ของ Gateway เริ่มต้นของ Discord และจำกัดอัตราการบันทึกข้อความ

    ตัวปรับแต่งการหมดเวลาของข้อมูลเมตา:

    - บัญชีเดียว: `channels.discord.gatewayInfoTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - ค่าสำรองจากตัวแปรสภาพแวดล้อมเมื่อไม่ได้กำหนดค่าในไฟล์ตั้งค่า: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - ค่าเริ่มต้น: `30000` (30 วินาที), ค่าสูงสุด: `120000`

  </Accordion>

  <Accordion title="การรีสตาร์ตเมื่อเหตุการณ์ READY ของ Gateway หมดเวลา">
    OpenClaw รอเหตุการณ์ `READY` ของ Gateway จาก Discord ระหว่างการเริ่มต้นระบบและหลังการเชื่อมต่อรันไทม์ใหม่ การตั้งค่าแบบหลายบัญชีที่ทยอยเริ่มต้นอาจต้องใช้ช่วงเวลารอ READY ระหว่างเริ่มต้นที่นานกว่าค่าเริ่มต้น

    ตัวปรับแต่งการหมดเวลา READY:

    - การเริ่มต้นแบบบัญชีเดียว: `channels.discord.gatewayReadyTimeoutMs`
    - การเริ่มต้นแบบหลายบัญชี: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - ค่าสำรองจากตัวแปรสภาพแวดล้อมระหว่างเริ่มต้นเมื่อไม่ได้กำหนดค่าในไฟล์ตั้งค่า: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นระหว่างเริ่มต้น: `15000` (15 วินาที), ค่าสูงสุด: `120000`
    - รันไทม์แบบบัญชีเดียว: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - รันไทม์แบบหลายบัญชี: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - ค่าสำรองจากตัวแปรสภาพแวดล้อมของรันไทม์เมื่อไม่ได้กำหนดค่าในไฟล์ตั้งค่า: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นของรันไทม์: `30000` (30 วินาที), ค่าสูงสุด: `120000`

  </Accordion>

  <Accordion title="ผลการตรวจสอบสิทธิ์ไม่ตรงกัน">
    การตรวจสอบสิทธิ์ของ `channels status --probe` ใช้ได้เฉพาะกับ ID ช่องที่เป็นตัวเลขเท่านั้น

    หากคุณใช้คีย์แบบ slug การจับคู่ขณะรันไทม์ยังคงทำงานได้ แต่การตรวจสอบไม่สามารถยืนยันสิทธิ์ได้อย่างสมบูรณ์

  </Accordion>

  <Accordion title="ปัญหาข้อความส่วนตัวและการจับคู่">

    - ปิดใช้งานข้อความส่วนตัว: `channels.discord.dm.enabled=false`
    - ปิดใช้งานนโยบายข้อความส่วนตัว: `channels.discord.dmPolicy="disabled"` (แบบเดิม: `channels.discord.dm.policy`)
    - กำลังรอการอนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูประหว่างบอต">
    โดยค่าเริ่มต้น ระบบจะละเว้นข้อความที่บอตเป็นผู้ส่ง

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎการกล่าวถึงและรายการอนุญาตที่เข้มงวดเพื่อหลีกเลี่ยงการเกิดลูป
    ควรใช้ `channels.discord.allowBots="mentions"` เพื่อยอมรับเฉพาะข้อความจากบอตที่กล่าวถึงบอตนี้เท่านั้น

    OpenClaw ยังมาพร้อมกับ [การป้องกันลูปของบอต](/th/channels/bot-loop-protection) ที่ใช้ร่วมกัน เมื่อใดก็ตามที่ `allowBots` อนุญาตให้ข้อความจากบอตเข้าสู่การส่งต่อ Discord จะแมปเหตุการณ์ขาเข้าเป็นข้อเท็จจริง `(บัญชี, ช่อง, คู่บอต)` และตัวป้องกันคู่แบบทั่วไปจะระงับคู่นั้นหลังจากเกินโควตาเหตุการณ์ที่กำหนด ตัวป้องกันนี้ช่วยหยุดลูปสองบอตที่ควบคุมไม่ได้ ซึ่งก่อนหน้านี้ต้องอาศัยการจำกัดอัตราของ Discord เพื่อหยุด และไม่ส่งผลต่อการติดตั้งใช้งานแบบบอตเดียวหรือการตอบกลับจากบอตเพียงครั้งเดียวที่ไม่เกินโควตา

    การตั้งค่าเริ่มต้น (ทำงานเมื่อตั้งค่า `allowBots`):

    - `maxEventsPerWindow: 20` -- คู่บอตสามารถแลกเปลี่ยนข้อความได้ 20 ข้อความภายในกรอบเวลาแบบเลื่อน
    - `windowSeconds: 60` -- ความยาวของกรอบเวลาแบบเลื่อน
    - `cooldownSeconds: 60` -- เมื่อใช้โควตาครบแล้ว ข้อความระหว่างบอตเพิ่มเติมทุกข้อความในทั้งสองทิศทางจะถูกทิ้งเป็นเวลาหนึ่งนาที

    กำหนดค่าเริ่มต้นที่ใช้ร่วมกันเพียงครั้งเดียวภายใต้ `channels.defaults.botLoopProtection` แล้วเขียนทับสำหรับ Discord เมื่อเวิร์กโฟลว์ที่ถูกต้องต้องการโควตาเพิ่มขึ้น ลำดับความสำคัญคือ:

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
      // การเขียนทับสำหรับ Discord ทั้งหมดที่ไม่บังคับ บล็อกบัญชีจะเขียนทับแต่ละฟิลด์
      // และรับช่วงฟิลด์ที่ละไว้จากที่นี่
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha รับฟังบอตอื่นเฉพาะเมื่อบอตเหล่านั้นกล่าวถึง Alpha
          allowBots: "mentions",
        },
        bravo: {
          // Bravo รับฟังข้อความ Discord ทั้งหมดที่บอตเป็นผู้ส่ง
          allowBots: true,
          mentionAliases: {
            // อนุญาตให้ Bravo เขียนการกล่าวถึง Alpha ใน Discord ด้วย ID ผู้ใช้ที่กำหนดค่าไว้
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // อนุญาตได้สูงสุดห้าข้อความต่อนาทีก่อนระงับคู่นี้
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

  <Accordion title="เสียงพูดเป็นข้อความขาดหายพร้อมข้อผิดพลาด DecryptionFailed(...)">

    - อัปเดต OpenClaw ให้เป็นเวอร์ชันปัจจุบันเสมอ (`openclaw update`) เพื่อให้มีตรรกะกู้คืนการรับเสียงของ Discord
    - ยืนยันว่า `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้นของต้นทาง) และปรับเฉพาะเมื่อจำเป็น
    - เฝ้าดูบันทึกต่อไปนี้:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากยังเกิดความล้มเหลวหลังจากเข้าร่วมใหม่โดยอัตโนมัติ ให้รวบรวมบันทึกและเปรียบเทียบกับประวัติการรับ DAVE ของต้นทางใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Discord](/th/gateway/config-channels#discord)

<Accordion title="ฟิลด์ Discord ที่สำคัญ">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- นโยบาย: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- คำสั่ง: `commands.native`, `commands.useAccessGroups` (ส่วนกลาง), `configWrites`, `slashCommand.ephemeral`
- คิวเหตุการณ์: `eventQueue.listenerTimeout` (โควตาเวลาของตัวรับฟัง, ค่าเริ่มต้น `120000`), `eventQueue.maxQueueSize` (ค่าเริ่มต้น `10000`), `eventQueue.maxConcurrency` (ค่าเริ่มต้น `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- การตอบกลับ/ประวัติ: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่ง: `textChunkLimit` (ค่าเริ่มต้น `2000`), `maxLinesPerMessage` (ค่าเริ่มต้น `17`)
- การสตรีม: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (คีย์แบบแบนเดิม `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` จะถูกย้ายไปยัง `streaming.*` โดย `openclaw doctor --fix`)
- สื่อ/การลองใหม่: `mediaMaxMb` (จำกัดขนาดการอัปโหลดขาออกไปยัง Discord, ค่าเริ่มต้น `100`), `retry`
- การดำเนินการ: `actions.*`
- สถานะการแสดงตัว: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- ส่วนติดต่อผู้ใช้: `ui.components.accentColor`
- คุณสมบัติ: `threadBindings`, `bindings[]` ระดับบนสุด (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการดำเนินงาน

- จัดการโทเค็นของบอตเสมือนเป็นข้อมูลลับ (แนะนำให้ใช้ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีระบบกำกับดูแล)
- ให้สิทธิ์ Discord เท่าที่จำเป็นเท่านั้น
- หากการปรับใช้/สถานะคำสั่งล้าสมัย ให้รีสตาร์ต Gateway และตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Discord กับ Gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    ลักษณะการทำงานของแชตกลุ่มและรายการอนุญาต
  </Card>
  <Card title="การกำหนดเส้นทางช่อง" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    แบบจำลองภัยคุกคามและการเสริมความมั่นคงปลอดภัย
  </Card>
  <Card title="การกำหนดเส้นทางหลายเอเจนต์" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกิลด์และช่องกับเอเจนต์
  </Card>
  <Card title="คำสั่งแบบสแลช" icon="terminal" href="/th/tools/slash-commands">
    ลักษณะการทำงานของคำสั่งแบบเนทีฟ
  </Card>
</CardGroup>
