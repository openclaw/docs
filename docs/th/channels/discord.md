---
read_when:
    - กำลังทำงานเกี่ยวกับฟีเจอร์ของช่อง Discord
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าสำหรับบอท Discord
title: Discord
x-i18n:
    generated_at: "2026-04-25T13:41:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 685dd2dce8a299233b14e7bdd5f502ee92f740b7dbb3104e86e0c2f36aabcfe1
    source_path: channels/discord.md
    workflow: 15
---

พร้อมสำหรับ DM และช่อง guild ผ่าน Discord gateway อย่างเป็นทางการ

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    Discord DM ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยและโฟลว์การซ่อมแซมข้ามช่อง
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

คุณจะต้องสร้างแอปพลิเคชันใหม่พร้อมบอท เพิ่มบอทเข้าไปยังเซิร์ฟเวอร์ของคุณ และจับคู่บอทกับ OpenClaw เราแนะนำให้เพิ่มบอทของคุณลงในเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากคุณยังไม่มี ให้[สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="สร้างแอปพลิเคชัน Discord และบอท">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อ เช่น "OpenClaw"

    คลิก **Bot** ที่แถบด้านข้าง ตั้งค่า **Username** เป็นชื่อที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้งาน privileged intents">
    ขณะที่ยังอยู่ในหน้า **Bot** เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้งาน:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับ allowlist ของ role และการจับคู่ชื่อเป็น ID)
    - **Presence Intent** (ไม่บังคับ; ต้องใช้เฉพาะเมื่อจำเป็นต้องอัปเดตสถานะออนไลน์)

  </Step>

  <Step title="คัดลอกโทเค็นบอทของคุณ">
    เลื่อนกลับขึ้นไปด้านบนของหน้า **Bot** แล้วคลิก **Reset Token**.

    <Note>
    แม้ชื่อจะเป็นเช่นนั้น แต่นี่คือการสร้างโทเค็นแรกของคุณ — ไม่มีอะไรถูก "รีเซ็ต"
    </Note>

    คัดลอกโทเค็นและบันทึกไว้ที่ใดที่หนึ่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในอีกไม่ช้า

  </Step>

  <Step title="สร้าง URL คำเชิญและเพิ่มบอทลงในเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** ที่แถบด้านข้าง คุณจะสร้าง URL คำเชิญพร้อมสิทธิ์ที่ถูกต้องสำหรับเพิ่มบอทลงในเซิร์ฟเวอร์ของคุณ

    เลื่อนลงไปที่ **OAuth2 URL Generator** แล้วเปิดใช้งาน:

    - `bot`
    - `applications.commands`

    ส่วน **Bot Permissions** จะปรากฏขึ้นด้านล่าง เปิดใช้งานอย่างน้อย:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (ไม่บังคับ)

    นี่คือชุดสิทธิ์พื้นฐานสำหรับช่องข้อความทั่วไป หากคุณวางแผนจะโพสต์ใน Discord thread รวมถึงเวิร์กโฟลว์ของช่อง forum หรือ media ที่สร้างหรือดำเนิน thread ต่อ ให้เปิด **Send Messages in Threads** ด้วย
    คัดลอก URL ที่สร้างขึ้นด้านล่าง วางลงในเบราว์เซอร์ของคุณ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอทของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิด Developer Mode และรวบรวม ID ของคุณ">
    กลับไปที่แอป Discord คุณต้องเปิด Developer Mode เพื่อให้สามารถคัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนเฟืองข้างอวตารของคุณ) → **Advanced** → เปิด **Developer Mode**
    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวตารของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ของคุณไว้พร้อมกับ Bot Token — คุณจะส่งทั้งสามค่านี้ให้ OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาต DM จากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงานได้ Discord ต้องอนุญาตให้บอทของคุณส่ง DM ถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** → **Privacy Settings** → เปิด **Direct Messages**

    การตั้งค่านี้จะอนุญาตให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอท) ส่ง DM ถึงคุณได้ เปิดค่านี้ไว้หากคุณต้องการใช้ Discord DM กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่อง guild คุณสามารถปิด DM ได้หลังจากจับคู่เสร็จแล้ว

  </Step>

  <Step title="ตั้งค่าโทเค็นบอทของคุณอย่างปลอดภัย (อย่าส่งในแชต)">
    โทเค็นบอท Discord ของคุณเป็นข้อมูลลับ (เหมือนรหัสผ่าน) ตั้งค่าไว้บนเครื่องที่รัน OpenClaw ก่อนส่งข้อความหาเอเจนต์ของคุณ

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    หาก OpenClaw ทำงานอยู่แล้วในฐานะบริการเบื้องหลัง ให้รีสตาร์ทผ่านแอป OpenClaw บน Mac หรือหยุดแล้วเริ่มกระบวนการ `openclaw gateway run` ใหม่

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="ขอให้เอเจนต์ของคุณทำ">
        แชตกับเอเจนต์ OpenClaw ของคุณบนช่องที่มีอยู่แล้วช่องใดก็ได้ (เช่น Telegram) แล้วบอกมัน หาก Discord เป็นช่องแรกของคุณ ให้ใช้แท็บ CLI / config แทน

        > "ฉันตั้งค่าโทเค็นบอท Discord ไว้ใน config แล้ว โปรดตั้งค่า Discord ให้เสร็จสมบูรณ์ด้วย User ID `<user_id>` และ Server ID `<server_id>`"
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

        Env fallback สำหรับบัญชี default:

```bash
DISCORD_BOT_TOKEN=...
```

        รองรับค่า `token` แบบ plaintext ด้วย และรองรับค่า SecretRef สำหรับ `channels.discord.token` ผ่าน provider แบบ env/file/exec ดูเพิ่มเติมที่ [การจัดการความลับ](/th/gateway/secrets)

      </Tab>
    </Tabs>

  </Step>

  <Step title="อนุมัติการจับคู่ DM ครั้งแรก">
    รอจนกว่า gateway จะทำงาน จากนั้นส่ง DM ถึงบอทของคุณใน Discord บอทจะตอบกลับด้วยรหัสการจับคู่

    <Tabs>
      <Tab title="ขอให้เอเจนต์ของคุณทำ">
        ส่งรหัสการจับคู่ให้เอเจนต์ของคุณบนช่องเดิมที่คุณใช้อยู่:

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
การแก้ไขค่าโทเค็นรับรู้ตามบัญชี ค่าของโทเค็นใน config จะมีลำดับความสำคัญสูงกว่า env fallback `DISCORD_BOT_TOKEN` จะถูกใช้เฉพาะสำหรับบัญชี default เท่านั้น
สำหรับการเรียกใช้งานขาออกขั้นสูง (เครื่องมือข้อความ/การดำเนินการของช่อง) `token` แบบระบุชัดเจนต่อการเรียกหนึ่งครั้งจะถูกใช้สำหรับการเรียกนั้น กฎนี้ใช้กับทั้งการส่งและการดำเนินการแบบอ่าน/ตรวจสอบ เช่น read/search/fetch/thread/pins/permissions) ขณะที่นโยบายบัญชี/การตั้งค่า retry ยังคงมาจากบัญชีที่เลือกใน active runtime snapshot
</Note>

## แนะนำ: ตั้งค่าเวิร์กสเปซ guild

เมื่อ DM ใช้งานได้แล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็นเวิร์กสเปซเต็มรูปแบบ โดยแต่ละช่องจะมีเซสชันเอเจนต์ของตนเองพร้อมบริบทของตนเอง ซึ่งแนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีเพียงคุณกับบอทของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณลงใน guild allowlist">
    การตั้งค่านี้ทำให้เอเจนต์ของคุณสามารถตอบกลับในทุกช่องของเซิร์ฟเวอร์คุณได้ ไม่ใช่เฉพาะ DM เท่านั้น

    <Tabs>
      <Tab title="ขอให้เอเจนต์ของคุณทำ">
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

  <Step title="อนุญาตให้ตอบกลับโดยไม่ต้อง @mention">
    ตามค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในช่อง guild เมื่อถูก @mention เท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณอาจต้องการให้มันตอบทุกข้อความ

    <Tabs>
      <Tab title="ขอให้เอเจนต์ของคุณทำ">
        > "อนุญาตให้เอเจนต์ของฉันตอบกลับบนเซิร์ฟเวอร์นี้ได้โดยไม่ต้องถูก @mentioned"
      </Tab>
      <Tab title="Config">
        ตั้งค่า `requireMention: false` ใน config ของ guild:

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

  <Step title="วางแผนเรื่องหน่วยความจำในช่อง guild">
    ตามค่าเริ่มต้น หน่วยความจำระยะยาว (`MEMORY.md`) จะถูกโหลดเฉพาะในเซสชัน DM ช่อง guild จะไม่โหลด `MEMORY.md` โดยอัตโนมัติ

    <Tabs>
      <Tab title="ขอให้เอเจนต์ของคุณทำ">
        > "เมื่อฉันถามคำถามในช่อง Discord ให้ใช้ memory_search หรือ memory_get หากคุณต้องการบริบทระยะยาวจาก MEMORY.md"
      </Tab>
      <Tab title="ทำด้วยตนเอง">
        หากคุณต้องการบริบทร่วมกันในทุกช่อง ให้วางคำสั่งที่คงที่ไว้ใน `AGENTS.md` หรือ `USER.md` (ไฟล์เหล่านี้จะถูก inject ในทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงเมื่อจำเป็นด้วยเครื่องมือ memory
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างช่องบางช่องบนเซิร์ฟเวอร์ Discord ของคุณแล้วเริ่มแชตได้เลย เอเจนต์ของคุณสามารถมองเห็นชื่อช่องได้ และแต่ละช่องจะมีเซสชันแยกจากกันโดยอิสระ — คุณจึงสามารถตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ได้ที่เหมาะกับเวิร์กโฟลว์ของคุณ

## โมเดลรันไทม์

- Gateway เป็นผู้ดูแลการเชื่อมต่อ Discord
- การกำหนดเส้นทางการตอบกลับเป็นแบบกำหนดแน่นอน: ข้อความขาเข้าจาก Discord จะตอบกลับไปยัง Discord
- ตามค่าเริ่มต้น (`session.dmScope=main`) แชตแบบ direct จะใช้เซสชันหลักของเอเจนต์ร่วมกัน (`agent:main:main`)
- ช่อง guild ใช้คีย์เซสชันแบบแยกกัน (`agent:<agentId>:discord:channel:<channelId>`)
- Group DM จะถูกละเว้นตามค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่ง slash แบบเนทีฟจะทำงานในเซสชันคำสั่งแบบแยก (`agent:<agentId>:discord:slash:<userId>`) ขณะเดียวกันก็ยังพก `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่ถูกกำหนดเส้นทาง
- การส่งประกาศแบบข้อความล้วนของ Cron/Heartbeat ไปยัง Discord จะใช้คำตอบสุดท้ายที่ผู้ช่วยมองเห็นได้เพียงครั้งเดียว
  ส่วน payload ของสื่อและคอมโพเนนต์แบบมีโครงสร้างจะยังคงเป็นหลายข้อความเมื่อเอเจนต์ส่ง payload ที่สามารถจัดส่งได้หลายรายการ

## ช่อง forum

ช่อง forum และ media ของ Discord ยอมรับเฉพาะโพสต์แบบ thread เท่านั้น OpenClaw รองรับ 2 วิธีในการสร้าง:

- ส่งข้อความไปยัง forum parent (`channel:<forumId>`) เพื่อสร้าง thread อัตโนมัติ ชื่อ thread จะใช้บรรทัดแรกที่ไม่ว่างของข้อความของคุณ
- ใช้ `openclaw message thread create` เพื่อสร้าง thread โดยตรง อย่าส่ง `--message-id` สำหรับช่อง forum

ตัวอย่าง: ส่งไปยัง forum parent เพื่อสร้าง thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

ตัวอย่าง: สร้าง forum thread โดยระบุชัดเจน

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

forum parent ไม่รองรับ Discord components หากคุณต้องการ components ให้ส่งไปยัง thread เอง (`channel:<threadId>`)

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับ Discord components v2 containers สำหรับข้อความของเอเจนต์ ใช้เครื่องมือข้อความพร้อม payload `components` ผลลัพธ์ของ interaction จะถูกส่งกลับไปยังเอเจนต์เป็นข้อความขาเข้าตามปกติ และเป็นไปตามการตั้งค่า Discord `replyToMode` ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Action row รองรับปุ่มได้สูงสุด 5 ปุ่ม หรือ select menu เดียว
- ประเภท Select: `string`, `user`, `role`, `mentionable`, `channel`

ตามค่าเริ่มต้น components ใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่ออนุญาตให้ปุ่ม select และฟอร์มถูกใช้งานได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดว่าใครสามารถคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (Discord user ID, tag หรือ `*`) เมื่อกำหนดค่าไว้ ผู้ใช้ที่ไม่ตรงเงื่อนไขจะได้รับข้อความปฏิเสธแบบ ephemeral

คำสั่ง slash `/model` และ `/models` จะเปิดตัวเลือก model แบบโต้ตอบ ซึ่งมีดรอปดาวน์สำหรับ provider, model และ runtime ที่เข้ากันได้ พร้อมขั้นตอน Submit คำสั่ง `/models add` ถูกเลิกใช้งานแล้ว และตอนนี้จะส่งกลับข้อความแจ้งการเลิกใช้งานแทนการลงทะเบียน model จากแชต การตอบกลับของตัวเลือกจะเป็นแบบ ephemeral และมีเพียงผู้ใช้ที่เรียกใช้งานเท่านั้นที่สามารถใช้ได้

ไฟล์แนบ:

- บล็อก `file` ต้องชี้ไปยัง attachment reference (`attachment://<filename>`)
- ระบุไฟล์แนบผ่าน `media`/`path`/`filePath` (ไฟล์เดียว); ใช้ `media-gallery` สำหรับหลายไฟล์
- ใช้ `filename` เพื่อแทนที่ชื่ออัปโหลดเมื่อควรให้ตรงกับ attachment reference

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
  message: "ข้อความสำรองแบบไม่บังคับ",
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
          placeholder: "เลือกหนึ่งตัวเลือก",
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
        { type: "text", label: "ผู้ขอ" },
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
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM (แบบเดิม: `channels.discord.dm.policy`):

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.discord.allowFrom` มี `"*"`; แบบเดิม: `channels.discord.dm.allowFrom`)
    - `disabled`

    หากนโยบาย DM ไม่ใช่ open ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือถูกแจ้งให้จับคู่ในโหมด `pairing`)

    ลำดับความสำคัญแบบหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อ `allowFrom` ของตนเองยังไม่ได้ตั้งค่า
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การ mention แบบ `<@id>`

    ID ตัวเลขล้วนไม่มีบริบทชัดเจนและจะถูกปฏิเสธ เว้นแต่จะระบุชนิดเป้าหมาย user/channel อย่างชัดเจน

  </Tab>

  <Tab title="นโยบาย Guild">
    การจัดการ Guild ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    ค่าพื้นฐานที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    พฤติกรรมของ `allowlist`:

    - guild ต้องตรงกับ `channels.discord.guilds` (แนะนำให้ใช้ `id`, ยอมรับ `slug`)
    - allowlist ของผู้ส่งแบบไม่บังคับ: `users` (แนะนำให้ใช้ ID แบบคงที่) และ `roles` (เฉพาะ role ID); หากมีการตั้งค่าอย่างใดอย่างหนึ่ง ผู้ส่งจะได้รับอนุญาตเมื่อตรงกับ `users` หรือ `roles`
    - การจับคู่ชื่อ/tag โดยตรงถูกปิดไว้ตามค่าเริ่มต้น; เปิด `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเมื่อจำเป็นจริงในโหมดความเข้ากันได้ฉุกเฉิน
    - รองรับชื่อ/tag สำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อมีการใช้รายการชื่อ/tag
    - หาก guild มีการกำหนด `channels` ช่องที่ไม่อยู่ในรายการจะถูกปฏิเสธ
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

    หากคุณตั้งค่าเพียง `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` ค่า fallback ระหว่างรันจะเป็น `groupPolicy="allowlist"` (พร้อมคำเตือนใน log) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`

  </Tab>

  <Tab title="Mentions และ group DM">
    ข้อความใน guild จะถูกบังคับให้ mention ตามค่าเริ่มต้น

    การตรวจจับ mention รวมถึง:

    - mention บอทโดยตรงอย่างชัดเจน
    - รูปแบบ mention ที่กำหนดไว้ (`agents.list[].groupChat.mentionPatterns`, fallback คือ `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับบอทโดยปริยายในกรณีที่รองรับ

    `requireMention` ถูกกำหนดค่าแยกตาม guild/channel (`channels.discord.guilds...`)
    `ignoreOtherMentions` สามารถเลือกให้ทิ้งข้อความที่ mention ผู้ใช้/role อื่นแต่ไม่ mention บอทได้ (ไม่รวม @everyone/@here)

    Group DM:

    - ค่าเริ่มต้น: ถูกละเว้น (`dm.groupEnabled=false`)
    - allowlist แบบไม่บังคับผ่าน `dm.groupChannels` (channel ID หรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตาม role

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิก Discord guild ไปยังเอเจนต์ต่างกันตาม role ID การ bind ตาม role รองรับเฉพาะ role ID และจะถูกประเมินหลัง peer หรือ parent-peer binding และก่อน guild-only binding หาก binding กำหนด match field อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ทุกฟิลด์ที่ตั้งค่าไว้จะต้องตรงกันทั้งหมด

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

## คำสั่งเนทีฟและการยืนยันตัวตนของคำสั่ง

- `commands.native` มีค่าเริ่มต้นเป็น `"auto"` และเปิดใช้งานสำหรับ Discord
- การแทนที่แยกตามช่อง: `channels.discord.commands.native`
- `commands.native=false` จะล้างคำสั่งเนทีฟของ Discord ที่เคยลงทะเบียนไว้ก่อนหน้าอย่างชัดเจน
- การยืนยันตัวตนของคำสั่งเนทีฟใช้ allowlist/นโยบายของ Discord ชุดเดียวกับการจัดการข้อความปกติ
- คำสั่งอาจยังมองเห็นได้ใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต; แต่เมื่อเรียกใช้จริงจะยังบังคับใช้การยืนยันตัวตนของ OpenClaw และส่งกลับว่า "ไม่ได้รับอนุญาต"

ดู [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งและพฤติกรรม

การตั้งค่าคำสั่ง slash ค่าเริ่มต้น:

- `ephemeral: true`

## รายละเอียดฟีเจอร์

<AccordionGroup>
  <Accordion title="แท็กการตอบกลับและการตอบกลับแบบเนทีฟ">
    Discord รองรับแท็กการตอบกลับในเอาต์พุตของเอเจนต์:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    ควบคุมโดย `channels.discord.replyToMode`:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`
    - `batched`

    หมายเหตุ: `off` จะปิดการจัดเธรดตอบกลับโดยปริยาย แต่แท็ก `[[reply_to_*]]` ที่ระบุไว้อย่างชัดเจนจะยังคงถูกใช้งาน
    `first` จะผูก native reply reference แบบปริยายกับข้อความ Discord ขาออกข้อความแรกของเทิร์นนั้นเสมอ
    `batched` จะผูก native reply reference แบบปริยายของ Discord เฉพาะเมื่อ
    เทิร์นขาเข้าเป็นชุดข้อความหลายข้อความที่ถูก debounce เท่านั้น ซึ่งมีประโยชน์
    หากคุณต้องการใช้ native reply เป็นหลักกับแชตที่ถี่และกำกวม ไม่ใช่ทุก
    เทิร์นที่มีข้อความเดียว

    ID ของข้อความจะถูกส่งต่อเข้าไปใน context/history เพื่อให้เอเจนต์สามารถระบุเป้าหมายข้อความเฉพาะได้

  </Accordion>

  <Accordion title="พรีวิวสตรีมแบบสด">
    OpenClaw สามารถสตรีมคำตอบฉบับร่างได้โดยส่งข้อความชั่วคราวและแก้ไขข้อความนั้นเมื่อมีข้อความเข้ามา `channels.discord.streaming` รองรับ `off` (ค่าเริ่มต้น) | `partial` | `block` | `progress` โดย `progress` จะถูกแมปเป็น `partial` บน Discord; `streamMode` เป็นชื่อแทนแบบเดิมและจะถูกย้ายให้อัตโนมัติ

    ค่าเริ่มต้นยังคงเป็น `off` เพราะการแก้ไขพรีวิวบน Discord จะชน rate limit ได้เร็วเมื่อมีหลายบอทหรือหลาย gateway ใช้บัญชีเดียวกัน

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

    - `partial` จะแก้ไขข้อความพรีวิวข้อความเดียวเมื่อ token ทยอยเข้ามา
    - `block` จะส่งเป็นก้อนขนาดฉบับร่าง (ใช้ `draftChunk` เพื่อปรับขนาดและจุดแบ่ง โดยจะถูกจำกัดไม่เกิน `textChunkLimit`)
    - ข้อความสุดท้ายแบบสื่อ, ข้อผิดพลาด และ explicit-reply จะยกเลิกการแก้ไขพรีวิวที่ยังค้างอยู่
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความพรีวิวเดิมซ้ำหรือไม่

    การสตรีมพรีวิวรองรับเฉพาะข้อความ; การตอบกลับแบบสื่อจะ fallback ไปใช้การส่งแบบปกติ เมื่อเปิด `block` streaming อย่างชัดเจน OpenClaw จะข้าม preview stream เพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

  </Accordion>

  <Accordion title="ประวัติ บริบท และพฤติกรรมของ thread">
    บริบทประวัติของ guild:

    - `channels.discord.historyLimit` ค่าเริ่มต้น `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` คือปิดใช้งาน

    ตัวควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมของ thread:

    - Discord thread จะถูกกำหนดเส้นทางเป็นเซสชันของช่อง และสืบทอด config ของช่องแม่ เว้นแต่จะมีการแทนที่
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) ใช้เลือกให้ auto-thread ใหม่เริ่มต้นจาก transcript ของ parent ได้ โดยการแทนที่รายบัญชีอยู่ภายใต้ `channels.discord.accounts.<id>.thread.inheritParent`
    - reaction ของเครื่องมือข้อความสามารถ resolve เป้าหมาย DM แบบ `user:<id>` ได้
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะยังคงถูกเก็บไว้ระหว่าง fallback ของการเปิดใช้งานในขั้นตอนตอบกลับ

    หัวข้อของช่องจะถูก inject เป็นบริบทแบบ **ไม่น่าเชื่อถือ** allowlist ควบคุมว่าใครสามารถกระตุ้นเอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมอย่างสมบูรณ์

  </Accordion>

  <Accordion title="เซสชันแบบผูกกับ thread สำหรับ subagent">
    Discord สามารถผูก thread เข้ากับเป้าหมายเซสชันได้ เพื่อให้ข้อความติดตามใน thread นั้นยังคงถูกกำหนดเส้นทางไปยังเซสชันเดิมต่อไป (รวมถึงเซสชัน subagent)

    คำสั่ง:

    - `/focus <target>` ผูก thread ปัจจุบัน/ใหม่เข้ากับเป้าหมาย subagent/session
    - `/unfocus` ลบการผูกของ thread ปัจจุบัน
    - `/agents` แสดงรันที่กำลังทำงานและสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการยกเลิก focus อัตโนมัติเมื่อไม่มีการใช้งานสำหรับ binding ที่โฟกัสอยู่
    - `/session max-age <duration|off>` ตรวจสอบ/อัปเดตอายุสูงสุดแบบตายตัวสำหรับ binding ที่โฟกัสอยู่

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
        spawnSubagentSessions: false, // เปิดใช้แบบ opt-in
      },
    },
  },
}
```

    หมายเหตุ:

    - `session.threadBindings.*` กำหนดค่าเริ่มต้นแบบโกลบอล
    - `channels.discord.threadBindings.*` ใช้แทนที่พฤติกรรมของ Discord
    - `spawnSubagentSessions` ต้องเป็น true จึงจะสร้าง/ผูก thread อัตโนมัติสำหรับ `sessions_spawn({ thread: true })`
    - `spawnAcpSessions` ต้องเป็น true จึงจะสร้าง/ผูก thread อัตโนมัติสำหรับ ACP (`/acp spawn ... --thread ...` หรือ `sessions_spawn({ runtime: "acp", thread: true })`)
    - หากปิด thread bindings สำหรับบัญชีหนึ่ง `/focus` และการดำเนินการ thread binding ที่เกี่ยวข้องจะใช้งานไม่ได้

    ดู [Sub-agents](/th/tools/subagents), [ACP Agents](/th/tools/acp-agents) และ [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="การผูกช่อง ACP แบบถาวร">
    สำหรับเวิร์กสเปซ ACP แบบเสถียรที่ "ทำงานตลอดเวลา" ให้กำหนด ACP binding แบบมีชนิดที่ระดับบนสุดโดยกำหนดเป้าหมายไปยังการสนทนาใน Discord

    เส้นทาง config:

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

    - `/acp spawn codex --bind here` จะผูกช่องหรือ thread ปัจจุบันไว้ในตำแหน่งเดิม และทำให้ข้อความในอนาคตคงอยู่บนเซสชัน ACP เดิม ข้อความใน thread จะสืบทอดการผูกของช่องแม่
    - ในช่องหรือ thread ที่ถูกผูกไว้ `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP เดิมในตำแหน่งเดิม การผูก thread ชั่วคราวสามารถแทนที่การ resolve เป้าหมายได้ในขณะที่ยังทำงานอยู่
    - `spawnAcpSessions` จำเป็นเฉพาะเมื่อ OpenClaw ต้องสร้าง/ผูก child thread ผ่าน `--thread auto|here`

    ดู [ACP Agents](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมของการผูก

  </Accordion>

  <Accordion title="การแจ้งเตือน reaction">
    โหมดการแจ้งเตือน reaction แยกตาม guild:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    เหตุการณ์ reaction จะถูกแปลงเป็น system event และแนบเข้ากับเซสชัน Discord ที่ถูกกำหนดเส้นทาง

  </Accordion>

  <Accordion title="Ack reaction">
    `ackReaction` จะส่งอีโมจิยืนยันขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback เป็นอีโมจิ identity ของเอเจนต์ (`agents.list[].identity.emoji`, หรือไม่เช่นนั้นคือ "👀")

    หมายเหตุ:

    - Discord รองรับอีโมจิ unicode หรือชื่อ custom emoji
    - ใช้ `""` เพื่อปิด reaction สำหรับช่องหรือบัญชี

  </Accordion>

  <Accordion title="การเขียน config">
    การเขียน config ที่เริ่มจากช่องถูกเปิดใช้งานตามค่าเริ่มต้น

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
    กำหนดเส้นทางทราฟฟิก WebSocket ของ Discord Gateway และการค้นหา REST ตอนเริ่มต้น (application ID + การ resolve allowlist) ผ่านพร็อกซี HTTP(S) ด้วย `channels.discord.proxy`

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
    เปิดใช้งานการ resolve ของ PluralKit เพื่อแมปข้อความที่ถูก proxy ไปยัง identity ของ system member:

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

    - allowlist สามารถใช้ `pk:<memberId>` ได้
    - ชื่อแสดงผลของ member จะถูกจับคู่ด้วยชื่อ/slug เท่านั้นเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การค้นหาใช้ message ID ต้นฉบับและถูกจำกัดด้วยช่วงเวลา
    - หากการค้นหาล้มเหลว ข้อความที่ถูก proxy จะถูกถือว่าเป็นข้อความจากบอทและถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="การกำหนดค่า presence">
    การอัปเดต presence จะถูกนำไปใช้เมื่อคุณตั้งค่าสถานะหรือฟิลด์ activity หรือเมื่อคุณเปิดใช้งาน auto presence

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

    ตัวอย่าง activity (custom status เป็นประเภท activity ค่าเริ่มต้น):

```json5
{
  channels: {
    discord: {
      activity: "เวลาสำหรับโฟกัส",
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
      activity: "ไลฟ์โค้ดดิ้ง",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    แผนที่ประเภท activity:

    - 0: Playing
    - 1: Streaming (ต้องใช้ `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (ใช้ข้อความ activity เป็นสถานะ state; อีโมจิเป็นตัวเลือก)
    - 5: Competing

    ตัวอย่าง auto presence (สัญญาณสุขภาพของ runtime):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token หมด",
      },
    },
  },
}
```

    auto presence จะแมปความพร้อมใช้งานของ runtime ไปยังสถานะของ Discord: healthy => online, degraded หรือ unknown => idle, exhausted หรือ unavailable => dnd ตัวเลือกการแทนที่ข้อความ:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับ placeholder `{reason}`)

  </Accordion>

  <Accordion title="การอนุมัติใน Discord">
    Discord รองรับการจัดการการอนุมัติด้วยปุ่มใน DM และสามารถเลือกให้โพสต์พรอมต์การอนุมัติในช่องต้นทางได้

    เส้นทาง config:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; fallback ไปยัง `commands.ownerAllowFrom` เมื่อเป็นไปได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord จะเปิดใช้งาน native exec approvals โดยอัตโนมัติเมื่อ `enabled` ไม่ได้ตั้งค่าไว้หรือเป็น `"auto"` และสามารถ resolve approver ได้อย่างน้อยหนึ่งราย ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมาน exec approver จาก `allowFrom` ของช่อง, `dm.allowFrom` แบบเดิม หรือ `defaultTo` ของ direct message ตั้งค่า `enabled: false` เพื่อปิด Discord ในฐานะ native approval client อย่างชัดเจน

    เมื่อ `target` เป็น `channel` หรือ `both` พรอมต์การอนุมัติจะมองเห็นได้ในช่อง มีเพียง approver ที่ resolve ได้เท่านั้นที่สามารถใช้ปุ่มได้; ผู้ใช้อื่นจะได้รับข้อความปฏิเสธแบบ ephemeral พรอมต์การอนุมัติจะมีข้อความคำสั่งรวมอยู่ด้วย ดังนั้นควรเปิดการส่งในช่องเฉพาะช่องที่เชื่อถือได้เท่านั้น หากไม่สามารถหา channel ID จาก session key ได้ OpenClaw จะ fallback ไปส่งผ่าน DM

    Discord ยังเรนเดอร์ปุ่มอนุมัติร่วมที่ใช้โดยช่องแชตอื่นด้วย ตัว adapter แบบเนทีฟของ Discord เพิ่มหลัก ๆ คือการกำหนดเส้นทาง DM ของ approver และการกระจายไปยังช่อง
    เมื่อมีปุ่มเหล่านั้นอยู่ ปุ่มเหล่านั้นคือ UX หลักสำหรับการอนุมัติ; OpenClaw
    ควรใส่คำสั่ง `/approve` แบบทำด้วยตนเองเฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่า
    การอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติด้วยตนเองเป็นทางเลือกเดียว

    การยืนยันตัวตน Gateway และการ resolve การอนุมัติเป็นไปตามสัญญาร่วมของ Gateway client (`plugin:` ID จะ resolve ผ่าน `plugin.approval.resolve`; ID อื่นผ่าน `exec.approval.resolve`) การอนุมัติจะหมดอายุหลังจาก 30 นาทีตามค่าเริ่มต้น

    ดู [Exec approvals](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและ action gate

การดำเนินการข้อความของ Discord ครอบคลุมการส่งข้อความ การดูแลช่อง การควบคุม moderation, presence และการดำเนินการเกี่ยวกับ metadata

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reaction: `react`, `reactions`, `emojiList`
- moderation: `timeout`, `kick`, `ban`
- presence: `setPresence`

การดำเนินการ `event-create` รองรับพารามิเตอร์ `image` แบบไม่บังคับ (URL หรือพาธไฟล์ในเครื่อง) เพื่อกำหนดภาพปกของ scheduled event

action gate อยู่ภายใต้ `channels.discord.actions.*`

พฤติกรรม gate ค่าเริ่มต้น:

| กลุ่มการดำเนินการ                                                                                                                                                       | ค่าเริ่มต้น |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้งาน  |
| roles                                                                                                                                                                    | ปิดใช้งาน   |
| moderation                                                                                                                                                               | ปิดใช้งาน   |
| presence                                                                                                                                                                 | ปิดใช้งาน   |

## UI ของ Components v2

OpenClaw ใช้ Discord components v2 สำหรับ exec approvals และ cross-context marker การดำเนินการข้อความของ Discord ยังสามารถรับ `components` สำหรับ UI แบบกำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้าง component payload ผ่านเครื่องมือ discord) ขณะที่ `embeds` แบบเดิมยังคงใช้ได้แต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` กำหนดสี accent ที่ใช้โดย Discord component container (hex)
- ตั้งค่ารายบัญชีได้ด้วย `channels.discord.accounts.<id>.ui.components.accentColor`
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

Discord มีพื้นผิวการใช้งานด้านเสียงอยู่สองแบบ: **voice channels** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบพรีวิว waveform) โดย gateway รองรับทั้งสองแบบ

### Voice channels

เช็กลิสต์การตั้งค่า:

1. เปิดใช้งาน Message Content Intent ใน Discord Developer Portal
2. เปิดใช้งาน Server Members Intent เมื่อมีการใช้ allowlist ของ role/user
3. เชิญบอทด้วย scope `bot` และ `applications.commands`
4. มอบสิทธิ์ Connect, Speak, Send Messages และ Read Message History ใน voice channel เป้าหมาย
5. เปิดใช้งานคำสั่งเนทีฟ (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งนี้จะใช้เอเจนต์ค่าเริ่มต้นของบัญชีและเป็นไปตามกฎ allowlist และ group policy เดียวกับคำสั่ง Discord อื่น ๆ

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
- `voice.model` ใช้แทน LLM ที่ใช้เฉพาะกับคำตอบใน Discord voice channel เท่านั้น หากไม่ตั้งค่าไว้ จะสืบทอด model ของเอเจนต์ที่ถูกกำหนดเส้นทาง
- STT ใช้ `tools.media.audio`; `voice.model` ไม่มีผลต่อการถอดเสียง
- เทิร์นของ transcript เสียงจะอนุมานสถานะ owner จาก Discord `allowFrom` (หรือ `dm.allowFrom`); ผู้พูดที่ไม่ใช่ owner จะไม่สามารถเข้าถึงเครื่องมือเฉพาะ owner ได้ (เช่น `gateway` และ `cron`)
- เสียงถูกเปิดใช้งานตามค่าเริ่มต้น; ตั้ง `channels.discord.voice.enabled=false` เพื่อปิดใช้งาน
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` จะส่งต่อไปยังตัวเลือก join ของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- OpenClaw ยังเฝ้าดูความล้มเหลวในการถอดรหัสฝั่งรับและกู้คืนอัตโนมัติโดยออกจาก voice channel แล้วเข้าร่วมใหม่หลังจากเกิดความล้มเหลวซ้ำหลายครั้งในช่วงเวลาสั้น ๆ
- หาก log ฝั่งรับยังคงแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำหลังการอัปเดต ให้รวบรวมรายงาน dependency และ log บรรทัด `@discordjs/voice` ที่รวมมาได้รวม upstream padding fix จาก discord.js PR #11449 ซึ่งปิด issue #11419 ของ discord.js แล้ว

ไปป์ไลน์ของ voice channel:

- การจับเสียง PCM จาก Discord จะถูกแปลงเป็นไฟล์ WAV ชั่วคราว
- `tools.media.audio` จัดการ STT เช่น `openai/gpt-4o-mini-transcribe`
- transcript จะถูกส่งผ่าน ingress และการกำหนดเส้นทางของ Discord ตามปกติ
- `voice.model` เมื่อกำหนดไว้ จะใช้แทนเฉพาะ LLM สำหรับคำตอบของเทิร์นใน voice channel นี้
- `voice.tts` จะถูกรวมทับบน `messages.tts`; เสียงที่ได้จะถูกเล่นในช่องที่เข้าร่วมอยู่

ข้อมูลรับรองจะถูก resolve แยกตามองค์ประกอบ: การยืนยันตัวตนของเส้นทาง LLM สำหรับ `voice.model`, การยืนยันตัวตน STT สำหรับ `tools.media.audio` และการยืนยันตัวตน TTS สำหรับ `messages.tts`/`voice.tts`

### ข้อความเสียง

ข้อความเสียงของ Discord จะแสดงพรีวิว waveform และต้องใช้เสียง OGG/Opus OpenClaw จะสร้าง waveform ให้อัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ gateway เพื่อใช้ตรวจสอบและแปลงไฟล์

- ระบุ **พาธไฟล์ในเครื่อง** (URL จะถูกปฏิเสธ)
- ไม่ต้องใส่ข้อความประกอบ (Discord จะปฏิเสธ payload ที่มีทั้งข้อความและข้อความเสียงพร้อมกัน)
- รองรับไฟล์เสียงทุกรูปแบบ; OpenClaw จะแปลงเป็น OGG/Opus ตามความจำเป็น

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="ใช้ intents ที่ไม่ได้รับอนุญาต หรือบอทไม่เห็นข้อความใน guild">

    - เปิดใช้งาน Message Content Intent
    - เปิดใช้งาน Server Members Intent เมื่อคุณพึ่งพาการ resolve ผู้ใช้/สมาชิก
    - รีสตาร์ท gateway หลังจากเปลี่ยน intents

  </Accordion>

  <Accordion title="ข้อความใน guild ถูกบล็อกโดยไม่คาดคิด">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบ guild allowlist ภายใต้ `channels.discord.guilds`
    - หากมีแผนที่ `channels` ของ guild อยู่ จะอนุญาตเฉพาะช่องที่อยู่ในรายการเท่านั้น
    - ตรวจสอบพฤติกรรม `requireMention` และรูปแบบ mention

    คำสั่งตรวจสอบที่มีประโยชน์:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="ตั้ง requireMention เป็น false แล้วแต่ยังถูกบล็อก">
    สาเหตุที่พบบ่อย:

    - `groupPolicy="allowlist"` โดยไม่มี guild/channel allowlist ที่ตรงกัน
    - กำหนด `requireMention` ไว้ผิดตำแหน่ง (ต้องอยู่ใต้ `channels.discord.guilds` หรือรายการ channel)
    - ผู้ส่งถูกบล็อกโดย allowlist `users` ของ guild/channel

  </Accordion>

  <Accordion title="ตัวจัดการที่ทำงานนานหมดเวลา หรือมีการตอบกลับซ้ำ">

    log ที่พบบ่อย:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    ค่าควบคุมงบเวลาของ listener:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    ค่าควบคุมเวลาหมดอายุของ worker run:

    - บัญชีเดียว: `channels.discord.inboundWorker.runTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - ค่าเริ่มต้น: `1800000` (30 นาที); ตั้งเป็น `0` เพื่อปิดใช้งาน

    ค่าพื้นฐานที่แนะนำ:

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

  <Accordion title="ผลตรวจสอบสิทธิ์ไม่ตรงกัน">
    การตรวจสอบสิทธิ์ของ `channels status --probe` ใช้งานได้เฉพาะกับ channel ID แบบตัวเลขเท่านั้น

    หากคุณใช้คีย์แบบ slug การจับคู่ใน runtime อาจยังทำงานได้ แต่ probe จะไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน

  </Accordion>

  <Accordion title="ปัญหา DM และการจับคู่">

    - DM ถูกปิดใช้งาน: `channels.discord.dm.enabled=false`
    - นโยบาย DM ถูกปิดใช้งาน: `channels.discord.dmPolicy="disabled"` (แบบเดิม: `channels.discord.dm.policy`)
    - กำลังรอการอนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูประหว่างบอทกับบอท">
    ตามค่าเริ่มต้น ข้อความที่เขียนโดยบอทจะถูกละเว้น

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎ mention และ allowlist ที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมแบบลูป
    แนะนำให้ใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความจากบอทที่ mention บอทเท่านั้น

  </Accordion>

  <Accordion title="Voice STT หลุดพร้อม DecryptionFailed(...)">

    - ใช้ OpenClaw เวอร์ชันปัจจุบัน (`openclaw update`) เพื่อให้มีตรรกะกู้คืนการรับเสียงของ Discord
    - ยืนยันว่า `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้น upstream) และปรับแต่งเฉพาะเมื่อจำเป็น
    - ดู log สำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากยังมีปัญหาหลังจากเข้าร่วมใหม่อัตโนมัติ ให้รวบรวม log และเปรียบเทียบกับประวัติการรับ DAVE ของ upstream ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## เอกสารอ้างอิงการกำหนดค่า

เอกสารอ้างอิงหลัก: [เอกสารอ้างอิงการกำหนดค่า - Discord](/th/gateway/config-channels#discord)

<Accordion title="ฟิลด์ Discord ที่มีสัญญาณสูง">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `token`, `accounts.*`, `allowBots`
- นโยบาย: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- คำสั่ง: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout` (งบเวลาของ listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- การตอบกลับ/ประวัติ: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่ง: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- การสตรีม: `streaming` (ชื่อแทนแบบเดิม: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- สื่อ/การลองใหม่: `mediaMaxMb` (จำกัดการอัปโหลด Discord ขาออก ค่าเริ่มต้น `100MB`), `retry`
- การดำเนินการ: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ฟีเจอร์: `threadBindings`, `bindings[]` ระดับบนสุด (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการปฏิบัติการ

- ปฏิบัติต่อโทเค็นบอทเป็นความลับ (แนะนำ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการควบคุม)
- ให้สิทธิ์ Discord เท่าที่จำเป็นขั้นต่ำ
- หากสถานะ/การ deploy ของคำสั่งล้าสมัย ให้รีสตาร์ท gateway แล้วตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Discord กับ gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรมของแชตกลุ่มและ allowlist
  </Card>
  <Card title="การกำหนดเส้นทางช่อง" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    แบบจำลองภัยคุกคามและการทำให้แข็งแกร่ง
  </Card>
  <Card title="การกำหนดเส้นทางหลายเอเจนต์" icon="sitemap" href="/th/concepts/multi-agent">
    แมป guild และช่องไปยังเอเจนต์
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟ
  </Card>
</CardGroup>
