---
read_when:
    - กำลังทำงานกับฟีเจอร์ช่องทาง Discord
summary: สถานะการรองรับบอต Discord ความสามารถ และการกำหนดค่า
title: Discord
x-i18n:
    generated_at: "2026-05-04T02:21:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: df4e045e39f8977f779fe409abf41dad0d950c92f1230c51ff356343513df812
    source_path: channels/discord.md
    workflow: 16
---

พร้อมสำหรับ DM และช่องกิลด์ผ่าน Discord gateway อย่างเป็นทางการ

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ Discord จะใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแคตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและโฟลว์การซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

คุณจะต้องสร้างแอปพลิเคชันใหม่พร้อมบอต เพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ และจับคู่กับ OpenClaw เราแนะนำให้เพิ่มบอตของคุณไปยังเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากคุณยังไม่มี [ให้สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="สร้างแอปพลิเคชันและบอต Discord">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อเป็นอย่างเช่น "OpenClaw"

    คลิก **Bot** บนแถบด้านข้าง ตั้งค่า **Username** เป็นชื่อที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้งาน privileged intents">
    ยังคงอยู่บนหน้า **Bot** เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้งาน:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับรายการอนุญาตตามบทบาทและการจับคู่ชื่อกับ ID)
    - **Presence Intent** (ไม่บังคับ; ต้องใช้เฉพาะสำหรับการอัปเดต presence)

  </Step>

  <Step title="คัดลอกโทเค็นบอตของคุณ">
    เลื่อนกลับขึ้นไปบนหน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อจะเป็นเช่นนั้น แต่สิ่งนี้จะสร้างโทเค็นแรกของคุณ ไม่มีสิ่งใดถูก "รีเซ็ต"
    </Note>

    คัดลอกโทเค็นแล้วบันทึกไว้ที่ใดที่หนึ่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในไม่ช้า

  </Step>

  <Step title="สร้าง URL คำเชิญและเพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** บนแถบด้านข้าง คุณจะสร้าง URL คำเชิญที่มีสิทธิ์ที่ถูกต้องเพื่อเพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ

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

    นี่คือชุดพื้นฐานสำหรับช่องข้อความปกติ หากคุณวางแผนจะโพสต์ในเธรดของ Discord รวมถึงเวิร์กโฟลว์ช่องฟอรัมหรือสื่อที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้งาน **Send Messages in Threads** ด้วย
    คัดลอก URL ที่สร้างขึ้นที่ด้านล่าง วางลงในเบราว์เซอร์ของคุณ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอตของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิดใช้งาน Developer Mode และรวบรวม ID ของคุณ">
    กลับไปที่แอป Discord คุณต้องเปิดใช้งาน Developer Mode เพื่อให้คัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนเฟืองถัดจากอวาตาร์ของคุณ) → **Advanced** → เปิดสวิตช์ **Developer Mode**
    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ของคุณไว้ร่วมกับ Bot Token คุณจะส่งทั้งสามรายการให้ OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาต DM จากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงานได้ Discord ต้องอนุญาตให้บอตของคุณส่ง DM ถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณ → **Privacy Settings** → เปิดสวิตช์ **Direct Messages**

    สิ่งนี้ทำให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอต) ส่ง DM ถึงคุณได้ เปิดใช้งานไว้หากคุณต้องการใช้ DM ของ Discord กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่องกิลด์ คุณสามารถปิดใช้งาน DM หลังการจับคู่ได้

  </Step>

  <Step title="ตั้งค่าโทเค็นบอตของคุณอย่างปลอดภัย (อย่าส่งในแชต)">
    โทเค็นบอต Discord ของคุณเป็นความลับ (เหมือนรหัสผ่าน) ตั้งค่าบนเครื่องที่รัน OpenClaw ก่อนส่งข้อความถึงเอเจนต์ของคุณ

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
    สำหรับการติดตั้งบริการที่จัดการแล้ว ให้รัน `openclaw gateway install` จากเชลล์ที่มี `DISCORD_BOT_TOKEN` อยู่ หรือเก็บตัวแปรไว้ใน `~/.openclaw/.env` เพื่อให้บริการสามารถ resolve env SecretRef ได้หลังรีสตาร์ท
    หากโฮสต์ของคุณถูกบล็อกหรือถูกจำกัดอัตราโดยการค้นหาแอปพลิเคชันของ Discord ตอนเริ่มต้น ให้ตั้งค่า ID แอปพลิเคชัน/ไคลเอนต์ Discord จาก Developer Portal เพื่อให้การเริ่มต้นข้าม REST call นั้นได้ ใช้ `channels.discord.applicationId` สำหรับบัญชีเริ่มต้น หรือ `channels.discord.accounts.<accountId>.applicationId` เมื่อคุณรันบอต Discord หลายตัว

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        แชตกับเอเจนต์ OpenClaw ของคุณบนช่องทางที่มีอยู่ใดก็ได้ (เช่น Telegram) แล้วบอกเอเจนต์ หาก Discord เป็นช่องทางแรกของคุณ ให้ใช้แท็บ CLI / config แทน

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

        สำหรับการตั้งค่าแบบสคริปต์หรือระยะไกล ให้เขียนบล็อก JSON5 เดียวกันด้วย `openclaw config patch --file ./discord.patch.json5 --dry-run` แล้วรันซ้ำโดยไม่มี `--dry-run` รองรับค่า `token` แบบ plaintext ค่า SecretRef ก็รองรับสำหรับ `channels.discord.token` ผ่านผู้ให้บริการ env/file/exec เช่นกัน ดู [การจัดการความลับ](/th/gateway/secrets)

        สำหรับบอต Discord หลายตัว ให้เก็บโทเค็นบอตและ ID แอปพลิเคชันแต่ละตัวไว้ใต้บัญชีของมัน `channels.discord.applicationId` ระดับบนจะถูกสืบทอดโดยบัญชี ดังนั้นให้ตั้งค่าไว้ตรงนั้นเฉพาะเมื่อทุกบัญชีควรใช้ ID แอปพลิเคชันเดียวกัน

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
    รอจนกว่า gateway จะรันอยู่ จากนั้นส่ง DM ถึงบอตของคุณใน Discord บอตจะตอบกลับด้วยรหัสการจับคู่

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        ส่งรหัสการจับคู่ให้เอเจนต์ของคุณบนช่องทางที่มีอยู่:

        > "อนุมัติรหัสการจับคู่ Discord นี้: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    รหัสการจับคู่จะหมดอายุหลัง 1 ชั่วโมง

    ตอนนี้คุณควรสามารถแชตกับเอเจนต์ของคุณใน Discord ผ่าน DM ได้แล้ว

  </Step>
</Steps>

<Note>
การ resolve โทเค็นรับรู้ตามบัญชี ค่าโทเค็นใน config จะชนะ env fallback `DISCORD_BOT_TOKEN` ใช้เฉพาะสำหรับบัญชีเริ่มต้นเท่านั้น
หากบัญชี Discord ที่เปิดใช้งานสองบัญชี resolve ไปยังโทเค็นบอตเดียวกัน OpenClaw จะเริ่ม gateway monitor เพียงตัวเดียวสำหรับโทเค็นนั้น โทเค็นจาก config จะชนะ env fallback เริ่มต้น มิฉะนั้นบัญชีที่เปิดใช้งานบัญชีแรกจะชนะ และบัญชีที่ซ้ำจะถูกรายงานว่าปิดใช้งาน
สำหรับการเรียกขาออกขั้นสูง (เครื่องมือข้อความ/การทำงานของช่องทาง) จะใช้ `token` แบบระบุต่อการเรียกสำหรับการเรียกนั้น สิ่งนี้ใช้กับการทำงานแบบส่งและอ่าน/ตรวจสอบ (เช่น read/search/fetch/thread/pins/permissions) การตั้งค่านโยบายบัญชี/การลองซ้ำยังคงมาจากบัญชีที่เลือกใน snapshot รันไทม์ที่ใช้งานอยู่
</Note>

## แนะนำ: ตั้งค่าเวิร์กสเปซกิลด์

เมื่อ DM ใช้งานได้แล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็นเวิร์กสเปซเต็มรูปแบบ โดยแต่ละช่องจะมีเซสชันเอเจนต์ของตัวเองพร้อมบริบทของตัวเอง วิธีนี้แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีเพียงคุณและบอตของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณไปยังรายการอนุญาตของกิลด์">
    สิ่งนี้ทำให้เอเจนต์ของคุณตอบกลับในช่องใดก็ได้บนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ DM

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

  <Step title="อนุญาตให้ตอบกลับโดยไม่ต้อง @mention">
    โดยค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในช่องกิลด์เมื่อถูก @mention เท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณอาจต้องการให้ตอบกลับทุกข้อความ

    ในช่องกิลด์ คำตอบสุดท้ายปกติของผู้ช่วยจะยังคงเป็นส่วนตัวโดยค่าเริ่มต้น เอาต์พุต Discord ที่มองเห็นได้ต้องถูกส่งอย่างชัดเจนด้วยเครื่องมือ `message` ดังนั้นเอเจนต์จึงสามารถเฝ้าดูอยู่เบื้องหลังเป็นค่าเริ่มต้น และโพสต์เฉพาะเมื่อมันตัดสินว่าคำตอบในช่องมีประโยชน์

    ซึ่งหมายความว่าโมเดลที่เลือกต้องเรียกเครื่องมือได้อย่างเชื่อถือได้ หาก Discord แสดงว่ากำลังพิมพ์และบันทึกแสดงการใช้โทเค็นแต่ไม่มีข้อความที่โพสต์ ให้ตรวจสอบบันทึกเซสชันสำหรับข้อความผู้ช่วยที่มี `didSendViaMessagingTool: false` นั่นหมายความว่าโมเดลสร้างคำตอบสุดท้ายส่วนตัวแทนการเรียก `message(action=send)` เปลี่ยนไปใช้โมเดลที่เรียกเครื่องมือได้แข็งแรงกว่า หรือใช้ config ด้านล่างเพื่อคืนค่าคำตอบสุดท้ายอัตโนมัติแบบเดิม

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
        หากคุณต้องการบริบทที่ใช้ร่วมกันในทุกช่อง ให้วางคำสั่งที่คงที่ไว้ใน `AGENTS.md` หรือ `USER.md` (ไฟล์เหล่านี้จะถูกฉีดเข้าไปในทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงเมื่อต้องการด้วยเครื่องมือหน่วยความจำ
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้สร้างช่องบางช่องบนเซิร์ฟเวอร์ Discord ของคุณแล้วเริ่มแชตได้เลย เอเจนต์ของคุณสามารถเห็นชื่อช่อง และแต่ละช่องจะมีเซสชันแยกของตัวเอง ดังนั้นคุณจึงตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ได้ที่เหมาะกับเวิร์กโฟลว์ของคุณ

## โมเดลรันไทม์

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord.
- การกำหนดเส้นทางการตอบกลับเป็นแบบกำหนดตายตัว: ข้อความตอบกลับขาเข้าจาก Discord จะย้อนกลับไปยัง Discord.
- เมทาดาทาของ guild/channel ใน Discord จะถูกเพิ่มลงในพรอมป์ของโมเดลในฐานะบริบทที่ไม่น่าเชื่อถือ ไม่ใช่คำนำหน้าการตอบกลับที่ผู้ใช้เห็น หากโมเดลคัดลอกซองข้อมูลนั้นกลับมา OpenClaw จะลบเมทาดาทาที่ถูกคัดลอกออกจากคำตอบขาออกและจากบริบทการเล่นซ้ำในอนาคต.
- โดยค่าเริ่มต้น (`session.dmScope=main`) แชตโดยตรงจะแชร์เซสชันหลักของเอเจนต์ (`agent:main:main`).
- ช่อง guild จะถูกแยกเป็นคีย์เซสชัน (`agent:<agentId>:discord:channel:<channelId>`).
- Group DM จะถูกละเว้นโดยค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`).
- คำสั่ง slash แบบเนทีฟจะทำงานในเซสชันคำสั่งที่แยกไว้ (`agent:<agentId>:discord:slash:<userId>`) โดยยังคงพา `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่ถูกกำหนดเส้นทาง.
- การส่งประกาศ cron/heartbeat แบบข้อความล้วนไปยัง Discord จะใช้คำตอบสุดท้ายที่ assistant มองเห็นเพียงครั้งเดียว เพย์โหลดสื่อและคอมโพเนนต์แบบมีโครงสร้างยังคงเป็นหลายข้อความเมื่อเอเจนต์ปล่อยเพย์โหลดที่ส่งได้หลายรายการ.

## ช่องฟอรัม

ช่องฟอรัมและช่องสื่อของ Discord รับเฉพาะโพสต์ในเธรดเท่านั้น OpenClaw รองรับสองวิธีในการสร้างโพสต์เหล่านี้:

- ส่งข้อความไปยังฟอรัมหลัก (`channel:<forumId>`) เพื่อสร้างเธรดอัตโนมัติ ชื่อเธรดจะใช้บรรทัดแรกที่ไม่ว่างของข้อความของคุณ.
- ใช้ `openclaw message thread create` เพื่อสร้างเธรดโดยตรง อย่าส่ง `--message-id` สำหรับช่องฟอรัม.

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

ฟอรัมหลักไม่รับคอมโพเนนต์ของ Discord หากคุณต้องการคอมโพเนนต์ ให้ส่งไปยังเธรดนั้นเอง (`channel:<threadId>`).

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับคอนเทนเนอร์คอมโพเนนต์ v2 ของ Discord สำหรับข้อความของเอเจนต์ ใช้เครื่องมือข้อความพร้อมเพย์โหลด `components` ผลลัพธ์การโต้ตอบจะถูกกำหนดเส้นทางกลับไปยังเอเจนต์เป็นข้อความขาเข้าปกติ และทำตามการตั้งค่า Discord `replyToMode` ที่มีอยู่.

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถวการดำเนินการอนุญาตปุ่มได้สูงสุด 5 ปุ่มหรือเมนูเลือกเดียวหนึ่งเมนู
- ประเภทการเลือก: `string`, `user`, `role`, `mentionable`, `channel`

โดยค่าเริ่มต้น คอมโพเนนต์ใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่ออนุญาตให้ใช้ปุ่ม เมนูเลือก และฟอร์มได้หลายครั้งจนกว่าจะหมดอายุ.

หากต้องการจำกัดว่าใครคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (ID ผู้ใช้ Discord, แท็ก หรือ `*`) เมื่อกำหนดค่าแล้ว ผู้ใช้ที่ไม่ตรงกันจะได้รับการปฏิเสธแบบ ephemeral.

คำสั่ง slash `/model` และ `/models` จะเปิดตัวเลือกโมเดลแบบโต้ตอบพร้อม dropdown สำหรับ provider, โมเดล และ runtime ที่เข้ากันได้ รวมถึงขั้นตอน Submit `/models add` เลิกใช้แล้วและตอนนี้จะส่งคืนข้อความแจ้งการเลิกใช้แทนการลงทะเบียนโมเดลจากแชต การตอบกลับของตัวเลือกเป็นแบบ ephemeral และมีเพียงผู้ใช้ที่เรียกใช้เท่านั้นที่ใช้ได้.

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
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM `channels.discord.allowFrom` คือ allowlist สำหรับ DM ตามมาตรฐาน.

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.discord.allowFrom` รวม `"*"`)
    - `disabled`

    หากนโยบาย DM ไม่ใช่แบบเปิด ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือได้รับพรอมป์ให้จับคู่ในโหมด `pairing`).

    ลำดับความสำคัญสำหรับหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น.
    - สำหรับบัญชีเดียว `allowFrom` มีลำดับความสำคัญเหนือ `dm.allowFrom` แบบเดิม.
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อ `allowFrom` ของตัวเองและ `dm.allowFrom` แบบเดิมไม่ได้ตั้งค่า.
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` และ `channels.discord.dm.allowFrom` แบบเดิมยังถูกอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านั้นไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง.

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การ mention แบบ `<@id>`

    โดยปกติ ID ตัวเลขล้วนจะ resolve เป็น ID ช่องเมื่อมีค่าเริ่มต้นของช่องที่ใช้งานอยู่ แต่ ID ที่อยู่ใน DM `allowFrom` ที่มีผลของบัญชีจะถูกถือเป็นเป้าหมาย DM ของผู้ใช้เพื่อความเข้ากันได้.

  </Tab>

  <Tab title="DM access groups">
    DM ของ Discord สามารถใช้รายการ `accessGroup:<name>` แบบไดนามิกใน `channels.discord.allowFrom`.

    ชื่อ access group ใช้ร่วมกันระหว่างช่องข้อความ ใช้ `type: "message.senders"` สำหรับกลุ่มแบบคงที่ซึ่งสมาชิกแสดงด้วยไวยากรณ์ `allowFrom` ปกติของแต่ละช่อง หรือใช้ `type: "discord.channelAudience"` เมื่อผู้ชม `ViewChannel` ปัจจุบันของช่อง Discord ควรกำหนดสมาชิกแบบไดนามิก พฤติกรรม access-group ที่ใช้ร่วมกันมีเอกสารไว้ที่นี่: [กลุ่มการเข้าถึง](/th/channels/access-groups).

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

    ช่องข้อความของ Discord ไม่มีรายชื่อสมาชิกแยกต่างหาก `type: "discord.channelAudience"` จำลองสมาชิกภาพดังนี้: ผู้ส่ง DM เป็นสมาชิกของ guild ที่กำหนดค่าและปัจจุบันมีสิทธิ์ `ViewChannel` ที่มีผลบนช่องที่กำหนดค่าหลังจากนำ role และการ override ของช่องมาใช้แล้ว.

    ตัวอย่าง: อนุญาตให้ทุกคนที่เห็น `#maintainers` ได้ DM ไปยังบอท ขณะที่ยังปิด DM สำหรับคนอื่นทั้งหมด.

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

    การค้นหาจะล้มเหลวแบบปิด หาก Discord ส่งคืน `Missing Access`, การค้นหาสมาชิกล้มเหลว หรือช่องอยู่ใน guild อื่น ผู้ส่ง DM จะถูกถือว่าไม่ได้รับอนุญาต.

    เปิดใช้ **Server Members Intent** ใน Discord Developer Portal สำหรับบอทเมื่อใช้ access group แบบ channel-audience DM ไม่มีสถานะสมาชิก guild ดังนั้น OpenClaw จะ resolve สมาชิกผ่าน Discord REST ณ เวลาตรวจสอบสิทธิ์.

  </Tab>

  <Tab title="Guild policy">
    การจัดการ guild ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    baseline ที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`.

    พฤติกรรม `allowlist`:

    - guild ต้องตรงกับ `channels.discord.guilds` (แนะนำให้ใช้ `id`, ยอมรับ slug)
    - allowlist ของผู้ส่งแบบไม่บังคับ: `users` (แนะนำ ID ที่เสถียร) และ `roles` (เฉพาะ ID ของ role); หากกำหนดอย่างใดอย่างหนึ่ง ผู้ส่งจะได้รับอนุญาตเมื่อ ตรงกับ `users` หรือ `roles`
    - การจับคู่ชื่อ/แท็กโดยตรงถูกปิดโดยค่าเริ่มต้น; เปิดใช้ `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเป็นโหมดความเข้ากันได้แบบฉุกเฉิน
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

    หากคุณตั้งค่าเพียง `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` fallback ขณะรันจะเป็น `groupPolicy="allowlist"` (พร้อมคำเตือนใน log) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    ข้อความ guild ต้องผ่าน mention gate โดยค่าเริ่มต้น.

    การตรวจจับ mention รวมถึง:

    - การ mention บอทอย่างชัดเจน
    - รูปแบบ mention ที่กำหนดค่า (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับถึงบอทโดยนัยในกรณีที่รองรับ

    เมื่อเขียนข้อความ Discord ขาออก ให้ใช้ไวยากรณ์ mention ตามมาตรฐาน: `<@USER_ID>` สำหรับผู้ใช้, `<#CHANNEL_ID>` สำหรับช่อง และ `<@&ROLE_ID>` สำหรับ role อย่าใช้รูปแบบ mention ชื่อเล่นแบบเดิม `<@!USER_ID>`.

    `requireMention` ถูกกำหนดค่าต่อ guild/channel (`channels.discord.guilds...`).
    `ignoreOtherMentions` สามารถเลือกให้ทิ้งข้อความที่ mention ผู้ใช้/role อื่นแต่ไม่ได้ mention บอท (ยกเว้น @everyone/@here).

    Group DM:

    - ค่าเริ่มต้น: ถูกละเว้น (`dm.groupEnabled=false`)
    - allowlist แบบไม่บังคับผ่าน `dm.groupChannels` (ID ช่องหรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตาม role

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิก guild ของ Discord ไปยังเอเจนต์ต่างกันตาม ID ของ role การ binding ตาม role รับเฉพาะ ID ของ role และจะถูกประเมินหลังจาก binding แบบ peer หรือ parent-peer และก่อน binding แบบ guild-only หาก binding ตั้งค่าฟิลด์ match อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ฟิลด์ที่กำหนดค่าทั้งหมดต้องตรงกัน.

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

- `commands.native` มีค่าเริ่มต้นเป็น `"auto"` และเปิดใช้สำหรับ Discord
- การเขียนทับรายช่องทาง: `channels.discord.commands.native`
- `commands.native=false` จะข้ามการลงทะเบียนและการล้างคำสั่ง slash ของ Discord ระหว่างเริ่มต้น คำสั่งที่เคยลงทะเบียนไว้ก่อนหน้านี้อาจยังมองเห็นได้ใน Discord จนกว่าคุณจะนำออกจากแอป Discord
- การยืนยันตัวตนของคำสั่งแบบเนทีฟใช้ allowlist/นโยบาย Discord ชุดเดียวกับการจัดการข้อความปกติ
- คำสั่งอาจยังมองเห็นได้ใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต แต่การเรียกใช้ยังคงบังคับใช้การยืนยันตัวตนของ OpenClaw และส่งคืน "ไม่ได้รับอนุญาต"

ดู [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งและพฤติกรรม

การตั้งค่าคำสั่ง slash เริ่มต้น:

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

    หมายเหตุ: `off` ปิดการจัดเธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` ที่ระบุชัดเจนยังคงใช้งานได้
    `first` จะแนบการอ้างอิงการตอบกลับแบบเนทีฟโดยนัยกับข้อความ Discord ขาออกแรกของรอบนั้นเสมอ
    `batched` จะแนบการอ้างอิงการตอบกลับแบบเนทีฟโดยนัยของ Discord เฉพาะเมื่อ
    รอบขาเข้าเป็นชุดข้อความหลายข้อความที่ถูกรวมด้วย debounce เท่านั้น วิธีนี้มีประโยชน์
    เมื่อคุณต้องการการตอบกลับแบบเนทีฟเป็นหลักสำหรับแชตที่ส่งถี่และคลุมเครือ ไม่ใช่ทุก
    รอบที่มีข้อความเดียว

    ID ข้อความจะแสดงในบริบท/ประวัติ เพื่อให้เอเจนต์สามารถเจาะจงข้อความเป้าหมายได้

  </Accordion>

  <Accordion title="ตัวอย่างสตรีมสด">
    OpenClaw สามารถสตรีมร่างคำตอบได้โดยส่งข้อความชั่วคราวและแก้ไขเมื่อมีข้อความเข้ามา `channels.discord.streaming` รับค่า `off` (ค่าเริ่มต้น) | `partial` | `block` | `progress` `progress` จะคงร่างสถานะที่แก้ไขได้หนึ่งรายการไว้ และอัปเดตด้วยความคืบหน้าของเครื่องมือจนกว่าจะส่งคำตอบสุดท้าย; `streamMode` เป็น alias เดิมและจะถูกย้ายให้อัตโนมัติ

    ค่าเริ่มต้นยังคงเป็น `off` เพราะการแก้ไขตัวอย่างของ Discord จะชน rate limit ได้เร็วเมื่อมีบอตหรือ Gateway หลายตัวใช้บัญชีเดียวกัน

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

    - `partial` แก้ไขข้อความตัวอย่างเดียวเมื่อ token เข้ามา
    - `block` ส่งชิ้นส่วนขนาดร่างออกมา (ใช้ `draftChunk` เพื่อปรับขนาดและจุดแบ่ง โดยจำกัดไว้ที่ `textChunkLimit`)
    - ผลลัพธ์สุดท้ายที่เป็นสื่อ ข้อผิดพลาด และการตอบกลับที่ระบุชัดเจนจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าจะนำข้อความตัวอย่างกลับมาใช้กับการอัปเดตเครื่องมือ/ความคืบหน้าหรือไม่

    การสตรีมตัวอย่างรองรับเฉพาะข้อความเท่านั้น; การตอบกลับด้วยสื่อจะย้อนกลับไปใช้การส่งตามปกติ เมื่อเปิดใช้การสตรีม `block` อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

  </Accordion>

  <Accordion title="ประวัติ บริบท และพฤติกรรมเธรด">
    บริบทประวัติของกิลด์:

    - `channels.discord.historyLimit` ค่าเริ่มต้น `20`
    - ทางเลือกสำรอง: `messages.groupChat.historyLimit`
    - `0` ปิดใช้

    การควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมเธรด:

    - เธรด Discord จะถูกกำหนดเส้นทางเป็นเซสชันช่องทางและสืบทอดค่าคอนฟิกช่องทางแม่ เว้นแต่จะมีการเขียนทับ
    - เซสชันเธรดสืบทอดการเลือก `/model` ระดับเซสชันของช่องทางแม่เป็นทางเลือกสำรองเฉพาะโมเดล; การเลือก `/model` ภายในเธรดยังคงมีลำดับความสำคัญสูงกว่า และจะไม่คัดลอกประวัติ transcript ของแม่ เว้นแต่จะเปิดใช้การสืบทอด transcript
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) เลือกให้ auto-thread ใหม่เริ่มด้วยข้อมูลจาก transcript ของแม่ การเขียนทับรายบัญชีอยู่ใต้ `channels.discord.accounts.<id>.thread.inheritParent`
    - reaction ของ message-tool สามารถ resolve เป้าหมาย DM แบบ `user:<id>` ได้
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะถูกคงไว้ระหว่างทางเลือกสำรองของการเปิดใช้งานขั้นตอบกลับ

    หัวข้อช่องทางถูกฉีดเข้าเป็นบริบทที่ **ไม่น่าเชื่อถือ** Allowlists จำกัดว่าใครสามารถกระตุ้นเอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมทั้งหมด

  </Accordion>

  <Accordion title="เซสชันผูกกับเธรดสำหรับ subagent">
    Discord สามารถผูกเธรดกับเป้าหมายเซสชันเพื่อให้ข้อความติดตามผลในเธรดนั้นยังคงถูกกำหนดเส้นทางไปยังเซสชันเดิม (รวมถึงเซสชัน subagent)

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/ใหม่กับเป้าหมาย subagent/เซสชัน
    - `/unfocus` นำการผูกเธรดปัจจุบันออก
    - `/agents` แสดง run ที่ใช้งานอยู่และสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการ unfocus อัตโนมัติเมื่อไม่มีการใช้งานสำหรับการผูกที่ focus อยู่
    - `/session max-age <duration|off>` ตรวจสอบ/อัปเดตอายุสูงสุดแบบบังคับสำหรับการผูกที่ focus อยู่

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
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    หมายเหตุ:

    - `session.threadBindings.*` ตั้งค่าเริ่มต้นส่วนกลาง
    - `channels.discord.threadBindings.*` เขียนทับพฤติกรรม Discord
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดอัตโนมัติสำหรับ `sessions_spawn({ thread: true })` และการ spawn เธรด ACP ค่าเริ่มต้น: `true`
    - `defaultSpawnContext` ควบคุมบริบท subagent แบบเนทีฟสำหรับการ spawn ที่ผูกกับเธรด ค่าเริ่มต้น: `"fork"`
    - คีย์ `spawnSubagentSessions`/`spawnAcpSessions` ที่เลิกใช้แล้วจะถูกย้ายโดย `openclaw doctor --fix`
    - หากปิดใช้การผูกเธรดสำหรับบัญชีหนึ่ง `/focus` และการดำเนินการผูกเธรดที่เกี่ยวข้องจะไม่พร้อมใช้งาน

    ดู [Sub-agents](/th/tools/subagents), [เอเจนต์ ACP](/th/tools/acp-agents) และ [อ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="การผูกช่องทาง ACP แบบถาวร">
    สำหรับเวิร์กสเปซ ACP แบบ "เปิดตลอด" ที่เสถียร ให้กำหนดค่าการผูก ACP แบบ typed ระดับบนสุดที่ชี้ไปยังการสนทนา Discord

    เส้นทางคอนฟิก:

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

    - `/acp spawn codex --bind here` ผูกช่องทางหรือเธรดปัจจุบันไว้ที่เดิมและทำให้ข้อความในอนาคตอยู่ในเซสชัน ACP เดิม ข้อความในเธรดสืบทอดการผูกของช่องทางแม่
    - ในช่องทางหรือเธรดที่ถูกผูกไว้ `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP เดิมที่เดิม การผูกเธรดชั่วคราวสามารถเขียนทับการ resolve เป้าหมายขณะใช้งานอยู่
    - `spawnSessions` จำกัดการสร้าง/ผูกเธรดลูกผ่าน `--thread auto|here`

    ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมการผูก

  </Accordion>

  <Accordion title="การแจ้งเตือน reaction">
    โหมดการแจ้งเตือน reaction รายกิลด์:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    เหตุการณ์ reaction จะถูกแปลงเป็นเหตุการณ์ระบบและแนบกับเซสชัน Discord ที่ถูกกำหนดเส้นทาง

  </Accordion>

  <Accordion title="Reaction ตอบรับ">
    `ackReaction` ส่งอีโมจิยืนยันการรับทราบขณะ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback อีโมจิตัวตนเอเจนต์ (`agents.list[].identity.emoji`, ไม่เช่นนั้น "👀")

    หมายเหตุ:

    - Discord รับอีโมจิ unicode หรือชื่ออีโมจิแบบกำหนดเอง
    - ใช้ `""` เพื่อปิดใช้ reaction สำหรับช่องทางหรือบัญชี

  </Accordion>

  <Accordion title="การเขียนคอนฟิก">
    การเขียนคอนฟิกที่เริ่มจากช่องทางเปิดใช้งานเป็นค่าเริ่มต้น

    สิ่งนี้มีผลต่อ flow `/config set|unset` (เมื่อเปิดใช้ฟีเจอร์คำสั่ง)

    ปิดใช้:

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
    กำหนดเส้นทางทราฟฟิก WebSocket ของ Discord gateway และการ lookup REST ตอนเริ่มต้น (application ID + การ resolve allowlist) ผ่านพร็อกซี HTTP(S) ด้วย `channels.discord.proxy`

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

  <Accordion title="รองรับ PluralKit">
    เปิดใช้การ resolve PluralKit เพื่อแมปข้อความที่ถูก proxy กับตัวตนสมาชิกระบบ:

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
    - ชื่อแสดงผลของสมาชิกจะถูกจับคู่ด้วยชื่อ/slug เฉพาะเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การ lookup ใช้ ID ข้อความต้นฉบับและถูกจำกัดด้วยกรอบเวลา
    - หาก lookup ล้มเหลว ข้อความที่ถูก proxy จะถูกถือเป็นข้อความบอตและถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="Alias สำหรับ mention ขาออก">
    ใช้ `mentionAliases` เมื่อเอเจนต์ต้องการ mention ขาออกแบบกำหนดแน่นอนสำหรับผู้ใช้ Discord ที่รู้จัก คีย์คือ handle ที่ไม่มี `@` นำหน้า; ค่าคือ ID ผู้ใช้ Discord handle ที่ไม่รู้จัก, `@everyone`, `@here` และ mention ภายใน code span ของ Markdown จะไม่ถูกเปลี่ยน

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
    การอัปเดต presence จะถูกนำไปใช้เมื่อคุณตั้งค่าฟิลด์สถานะหรือกิจกรรม หรือเมื่อคุณเปิดใช้ auto presence

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

    ตัวอย่างกิจกรรม (สถานะแบบกำหนดเองเป็นประเภทกิจกรรมเริ่มต้น):

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

    แผนที่ประเภทกิจกรรม:

    - 0: กำลังเล่น
    - 1: กำลังสตรีม (ต้องมี `activityUrl`)
    - 2: กำลังฟัง
    - 3: กำลังดู
    - 4: กำหนดเอง (ใช้ข้อความกิจกรรมเป็น state ของสถานะ; อีโมจิเป็นตัวเลือก)
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

    auto presence แมปความพร้อมใช้งานของ runtime ไปยังสถานะ Discord: healthy => online, degraded หรือ unknown => idle, exhausted หรือ unavailable => dnd การเขียนทับข้อความแบบเลือกได้:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับ placeholder `{reason}`)

  </Accordion>

  <Accordion title="การอนุมัติใน Discord">
    Discord รองรับการจัดการการอนุมัติด้วยปุ่มใน DM และสามารถเลือกโพสต์ prompt การอนุมัติในช่องทางต้นทางได้

    เส้นทางคอนฟิก:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; ย้อนกลับไปใช้ `commands.ownerAllowFrom` เมื่อเป็นไปได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord เปิดใช้การอนุมัติ exec แบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือมีค่าเป็น `"auto"` และสามารถระบุผู้อนุมัติได้อย่างน้อยหนึ่งราย ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมานผู้อนุมัติ exec จาก `allowFrom` ของช่อง, `dm.allowFrom` แบบเดิม, หรือ `defaultTo` ของข้อความส่วนตัว ตั้งค่า `enabled: false` เพื่อปิดใช้งาน Discord ในฐานะไคลเอนต์อนุมัติแบบเนทีฟอย่างชัดเจน

    สำหรับคำสั่งกลุ่มที่ละเอียดอ่อนและจำกัดเฉพาะเจ้าของ เช่น `/diagnostics` และ `/export-trajectory` OpenClaw จะส่งพรอมต์อนุมัติและผลลัพธ์สุดท้ายแบบส่วนตัว โดยจะลองใช้ Discord DM ก่อนเมื่อเจ้าของที่เรียกใช้มีเส้นทางเจ้าของของ Discord; หากไม่พร้อมใช้งาน จะย้อนกลับไปใช้เส้นทางเจ้าของแรกที่พร้อมใช้งานจาก `commands.ownerAllowFrom` เช่น Telegram

    เมื่อ `target` เป็น `channel` หรือ `both` พรอมต์อนุมัติจะปรากฏในช่อง เฉพาะผู้อนุมัติที่ระบุได้แล้วเท่านั้นที่ใช้ปุ่มได้; ผู้ใช้อื่นจะได้รับการปฏิเสธแบบชั่วคราว พรอมต์อนุมัติมีข้อความคำสั่งรวมอยู่ด้วย ดังนั้นให้เปิดใช้การส่งไปยังช่องเฉพาะในช่องที่เชื่อถือได้เท่านั้น หากไม่สามารถอนุมาน ID ช่องจากคีย์เซสชันได้ OpenClaw จะย้อนกลับไปส่งผ่าน DM

    Discord ยังแสดงปุ่มอนุมัติร่วมที่ช่องแชทอื่นใช้ด้วย อะแดปเตอร์ Discord แบบเนทีฟหลัก ๆ แล้วเพิ่มการกำหนดเส้นทาง DM ของผู้อนุมัติและการกระจายไปยังช่อง
    เมื่อมีปุ่มเหล่านั้น ปุ่มดังกล่าวคือ UX การอนุมัติหลัก; OpenClaw
    ควรมีคำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่า
    การอนุมัติผ่านแชทไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียวเท่านั้น
    หากรันไทม์การอนุมัติแบบเนทีฟของ Discord ไม่ทำงาน OpenClaw จะคงพรอมต์
    `/approve <id> <decision>` แบบกำหนดได้ซ้ำในเครื่องให้มองเห็นได้ หาก
    รันไทม์ทำงานอยู่แต่ไม่สามารถส่งการ์ดแบบเนทีฟไปยังเป้าหมายใด ๆ ได้
    OpenClaw จะส่งประกาศสำรองในแชทเดียวกันพร้อมคำสั่ง `/approve`
    ที่ตรงกันจากการอนุมัติที่ค้างอยู่

    การตรวจสอบสิทธิ์ของ Gateway และการแก้ผลการอนุมัติเป็นไปตามสัญญาไคลเอนต์ Gateway ร่วมกัน (`plugin:` IDs แก้ผ่าน `plugin.approval.resolve`; IDs อื่นแก้ผ่าน `exec.approval.resolve`) การอนุมัติหมดอายุหลังจาก 30 นาทีโดยค่าเริ่มต้น

    ดู [การอนุมัติ Exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและเกตการกระทำ

การกระทำของข้อความ Discord ประกอบด้วยการส่งข้อความ การดูแลช่อง การมอดเดอเรชัน สถานะการแสดงตัว และการกระทำกับเมทาดาทา

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- รีแอ็กชัน: `react`, `reactions`, `emojiList`
- มอดเดอเรชัน: `timeout`, `kick`, `ban`
- สถานะการแสดงตัว: `setPresence`

การกระทำ `event-create` รับพารามิเตอร์ `image` ที่ไม่บังคับ (URL หรือพาธไฟล์ในเครื่อง) เพื่อตั้งค่ารูปภาพหน้าปกของเหตุการณ์ที่กำหนดเวลาไว้

เกตการกระทำอยู่ใต้ `channels.discord.actions.*`

พฤติกรรมเกตเริ่มต้น:

| กลุ่มการกระทำ                                                                                                                                                             | ค่าเริ่มต้น  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้  |
| roles                                                                                                                                                                    | ปิดใช้ |
| moderation                                                                                                                                                               | ปิดใช้ |
| presence                                                                                                                                                                 | ปิดใช้ |

## UI Components v2

OpenClaw ใช้ Discord components v2 สำหรับการอนุมัติ exec และเครื่องหมายข้ามบริบท การกระทำของข้อความ Discord ยังสามารถรับ `components` สำหรับ UI แบบกำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้างเพย์โหลดคอมโพเนนต์ผ่านเครื่องมือ discord) ขณะที่ `embeds` แบบเดิมยังคงพร้อมใช้งาน แต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นที่คอนเทนเนอร์คอมโพเนนต์ของ Discord ใช้ (hex)
- ตั้งค่าแยกตามบัญชีด้วย `channels.discord.accounts.<id>.ui.components.accentColor`
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

Discord มีพื้นผิวเสียงสองแบบที่แยกจากกัน: **ช่องเสียง** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบพรีวิวคลื่นเสียง) Gateway รองรับทั้งสองแบบ

### ช่องเสียง

รายการตรวจสอบการตั้งค่า:

1. เปิดใช้ Message Content Intent ใน Discord Developer Portal
2. เปิดใช้ Server Members Intent เมื่อใช้รายการอนุญาตบทบาท/ผู้ใช้
3. เชิญบอทด้วยสโคป `bot` และ `applications.commands`
4. ให้สิทธิ์ Connect, Speak, Send Messages และ Read Message History ในช่องเสียงเป้าหมาย
5. เปิดใช้คำสั่งแบบเนทีฟ (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งนี้ใช้เอเจนต์เริ่มต้นของบัญชีและทำตามกฎรายการอนุญาตและนโยบายกลุ่มเดียวกับคำสั่ง Discord อื่น ๆ

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
- `voice.model` จะแทนที่ LLM ที่ใช้สำหรับการตอบกลับช่องเสียง Discord เท่านั้น ปล่อยไว้ไม่ตั้งค่าเพื่อสืบทอดโมเดลเอเจนต์ที่กำหนดเส้นทางไว้
- STT ใช้ `tools.media.audio`; `voice.model` ไม่มีผลต่อการถอดเสียง
- การแทนที่ `systemPrompt` ของ Discord รายช่องจะมีผลกับรอบถอดเสียงของช่องเสียงนั้น
- รอบถอดเสียงจะอนุมานสถานะเจ้าของจาก `allowFrom` ของ Discord (หรือ `dm.allowFrom`); ผู้พูดที่ไม่ใช่เจ้าของไม่สามารถเข้าถึงเครื่องมือเฉพาะเจ้าของได้ (เช่น `gateway` และ `cron`)
- เสียง Discord เป็นแบบเลือกเปิดสำหรับคอนฟิกข้อความเท่านั้น; ตั้งค่า `channels.discord.voice.enabled=true` (หรือคงบล็อก `channels.discord.voice` ที่มีอยู่) เพื่อเปิดใช้คำสั่ง `/vc`, รันไทม์เสียง และ Gateway intent `GuildVoiceStates`
- `channels.discord.intents.voiceStates` สามารถแทนที่การสมัครใช้งาน voice-state intent ได้อย่างชัดเจน ปล่อยไว้ไม่ตั้งค่าเพื่อให้ intent เป็นไปตามการเปิดใช้เสียงที่มีผลจริง
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` ส่งต่อไปยังตัวเลือก join ของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- `voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายามเข้าร่วมอัตโนมัติ ค่าเริ่มต้น: `30000`
- `voice.reconnectGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอให้เซสชันเสียงที่ตัดการเชื่อมต่อเริ่มเชื่อมต่อใหม่ก่อนทำลายเซสชันนั้น ค่าเริ่มต้น: `15000`
- OpenClaw ยังเฝ้าดูความล้มเหลวในการถอดรหัสฝั่งรับและกู้คืนอัตโนมัติโดยออกจากช่องเสียงแล้วเข้าร่วมใหม่หลังเกิดความล้มเหลวซ้ำ ๆ ในช่วงเวลาสั้น ๆ
- หากบันทึกฝั่งรับแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำ ๆ หลังอัปเดต ให้รวบรวมรายงาน dependency และบันทึก บรรทัด `@discordjs/voice` ที่รวมมาแล้วมี upstream padding fix จาก discord.js PR #11449 ซึ่งปิด discord.js issue #11419 แล้ว

ไปป์ไลน์ช่องเสียง:

- การจับ Discord PCM จะถูกแปลงเป็นไฟล์ WAV ชั่วคราว
- `tools.media.audio` จัดการ STT เช่น `openai/gpt-4o-mini-transcribe`
- ทรานสคริปต์ถูกส่งผ่านทางเข้าและการกำหนดเส้นทางของ Discord ขณะที่ LLM สำหรับตอบกลับทำงานด้วยนโยบายเอาต์พุตเสียงที่ซ่อนเครื่องมือ `tts` ของเอเจนต์และขอให้ส่งคืนเป็นข้อความ เพราะเสียง Discord เป็นเจ้าของการเล่น TTS สุดท้าย
- เมื่อกำหนด `voice.model` ไว้ จะแทนที่เฉพาะ LLM สำหรับตอบกลับในรอบช่องเสียงนี้
- `voice.tts` จะถูกผสานทับ `messages.tts`; เสียงที่ได้จะถูกเล่นในช่องที่เข้าร่วมอยู่

ข้อมูลประจำตัวถูกแก้แยกตามคอมโพเนนต์: การตรวจสอบสิทธิ์เส้นทาง LLM สำหรับ `voice.model`, การตรวจสอบสิทธิ์ STT สำหรับ `tools.media.audio`, และการตรวจสอบสิทธิ์ TTS สำหรับ `messages.tts`/`voice.tts`

### ข้อความเสียง

ข้อความเสียง Discord แสดงพรีวิวคลื่นเสียงและต้องใช้เสียง OGG/Opus OpenClaw สร้างคลื่นเสียงให้อัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ Gateway เพื่อตรวจสอบและแปลง

- ระบุ **พาธไฟล์ในเครื่อง** (URL จะถูกปฏิเสธ)
- ละเว้นเนื้อหาข้อความ (Discord ปฏิเสธข้อความ + ข้อความเสียงในเพย์โหลดเดียวกัน)
- รองรับรูปแบบเสียงใดก็ได้; OpenClaw จะแปลงเป็น OGG/Opus ตามจำเป็น

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - เปิดใช้ Message Content Intent
    - เปิดใช้ Server Members Intent เมื่อคุณพึ่งพาการระบุผู้ใช้/สมาชิก
    - รีสตาร์ท Gateway หลังเปลี่ยน intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบรายการอนุญาต guild ใต้ `channels.discord.guilds`
    - หากมีแมป `channels` ของ guild จะอนุญาตเฉพาะช่องที่ระบุไว้เท่านั้น
    - ตรวจสอบพฤติกรรม `requireMention` และรูปแบบการกล่าวถึง

    การตรวจสอบที่มีประโยชน์:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    สาเหตุที่พบบ่อย:

    - `groupPolicy="allowlist"` โดยไม่มีรายการอนุญาต guild/channel ที่ตรงกัน
    - กำหนดค่า `requireMention` ผิดตำแหน่ง (ต้องอยู่ใต้ `channels.discord.guilds` หรือรายการช่อง)
    - ผู้ส่งถูกบล็อกโดยรายการอนุญาต `users` ของ guild/channel

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    บันทึกทั่วไป:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    ปุ่มปรับแต่งคิว Gateway ของ Discord:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ค่านี้ควบคุมเฉพาะงาน listener ของ Gateway Discord ไม่ใช่อายุการทำงานของรอบเอเจนต์

    Discord ไม่ใช้การหมดเวลาที่ช่องเป็นเจ้าของกับรอบเอเจนต์ที่อยู่ในคิว ตัวฟังข้อความจะส่งต่องานทันที และการรัน Discord ที่เข้าคิวจะรักษาลำดับรายเซสชันไว้จนกว่าวงจรชีวิตของเซสชัน/เครื่องมือ/รันไทม์จะเสร็จสมบูรณ์หรือยกเลิกงาน

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
    OpenClaw ดึงข้อมูลเมทาดาทา `/gateway/bot` ของ Discord ก่อนเชื่อมต่อ ความล้มเหลวชั่วคราวจะย้อนกลับไปใช้ URL Gateway เริ่มต้นของ Discord และถูกจำกัดอัตราในบันทึก

    ปุ่มปรับแต่งการหมดเวลาเมทาดาทา:

    - บัญชีเดียว: `channels.discord.gatewayInfoTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - ค่า env สำรองเมื่อไม่ได้ตั้งค่าคอนฟิก: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - ค่าเริ่มต้น: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="การรีสตาร์ตเมื่อ Gateway READY หมดเวลา">
    OpenClaw รอเหตุการณ์ `READY` ของ Gateway ของ Discord ระหว่างการเริ่มต้นและหลังจากการเชื่อมต่อใหม่ขณะรันไทม์ การตั้งค่าหลายบัญชีที่มีการหน่วงเวลาเริ่มต้นทีละบัญชีอาจต้องใช้ช่วงเวลา READY ตอนเริ่มต้นที่นานกว่าค่าเริ่มต้น

    ปุ่มปรับค่าการหมดเวลา READY:

    - การเริ่มต้นแบบบัญชีเดียว: `channels.discord.gatewayReadyTimeoutMs`
    - การเริ่มต้นแบบหลายบัญชี: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - ค่า env สำรองสำหรับการเริ่มต้นเมื่อไม่ได้ตั้งค่าคอนฟิก: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นสำหรับการเริ่มต้น: `15000` (15 วินาที), สูงสุด: `120000`
    - รันไทม์แบบบัญชีเดียว: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - รันไทม์แบบหลายบัญชี: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - ค่า env สำรองสำหรับรันไทม์เมื่อไม่ได้ตั้งค่าคอนฟิก: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นสำหรับรันไทม์: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="ความไม่ตรงกันในการตรวจสอบสิทธิ์">
    การตรวจสอบสิทธิ์ด้วย `channels status --probe` ใช้งานได้เฉพาะกับ ID ช่องแบบตัวเลขเท่านั้น

    หากคุณใช้คีย์แบบ slug การจับคู่ขณะรันไทม์อาจยังใช้งานได้ แต่ probe ไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน

  </Accordion>

  <Accordion title="ปัญหา DM และการจับคู่">

    - ปิดใช้งาน DM: `channels.discord.dm.enabled=false`
    - ปิดใช้งานนโยบาย DM: `channels.discord.dmPolicy="disabled"` (แบบเดิม: `channels.discord.dm.policy`)
    - กำลังรออนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูปจากบอตถึงบอต">
    โดยค่าเริ่มต้น ข้อความที่เขียนโดยบอตจะถูกละเว้น

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎการกล่าวถึงและ allowlist ที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมแบบลูป
    แนะนำให้ใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความจากบอตที่กล่าวถึงบอตนี้เท่านั้น

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

    - ใช้ OpenClaw เวอร์ชันปัจจุบันอยู่เสมอ (`openclaw update`) เพื่อให้มีตรรกะกู้คืนการรับเสียงของ Discord
    - ยืนยันว่า `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้นจาก upstream) และปรับเฉพาะเมื่อจำเป็น
    - ดูบันทึกสำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากยังล้มเหลวต่อหลังจากเข้าร่วมใหม่โดยอัตโนมัติ ให้รวบรวมบันทึกและเปรียบเทียบกับประวัติการรับ DAVE จาก upstream ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Discord](/th/gateway/config-channels#discord)

<Accordion title="ฟิลด์ Discord ที่มีสัญญาณสำคัญ">

- การเริ่มต้น/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- นโยบาย: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- คำสั่ง: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- คิวเหตุการณ์: `eventQueue.listenerTimeout` (งบเวลา listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- การตอบกลับ/ประวัติ: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่งข้อความ: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- การสตรีม: `streaming` (alias เดิม: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- สื่อ/การลองใหม่: `mediaMaxMb` (จำกัดการอัปโหลดออกไปยัง Discord, ค่าเริ่มต้น `100MB`), `retry`
- การดำเนินการ: `actions.*`
- สถานะออนไลน์: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ฟีเจอร์: `threadBindings`, `bindings[]` ระดับบน (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการปฏิบัติงาน

- ปฏิบัติต่อโทเคนบอตเป็นความลับ (แนะนำให้ใช้ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการควบคุม)
- ให้สิทธิ์ Discord เท่าที่จำเป็นน้อยที่สุด
- หากสถานะการ deploy คำสั่ง/สถานะค้าง ให้รีสตาร์ต Gateway และตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

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
    แมป guild และช่องกับเอเจนต์
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟ
  </Card>
</CardGroup>
