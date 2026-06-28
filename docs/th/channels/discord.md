---
read_when:
    - กำลังทำงานกับฟีเจอร์ช่องทาง Discord
summary: สถานะการรองรับบอต Discord ความสามารถ และการกำหนดค่า
title: Discord
x-i18n:
    generated_at: "2026-06-28T20:40:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91bda14cfdd7bf5045413d97c56936ea7150b396e0e7ecd4ac300e1a811377cb
    source_path: channels/discord.md
    workflow: 16
---

พร้อมสำหรับข้อความส่วนตัวและช่องทางกิลด์ผ่าน Discord Gateway อย่างเป็นทางการ

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    ข้อความส่วนตัวของ Discord ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่งแบบสแลช" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและโฟลว์การซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

คุณจะต้องสร้างแอปพลิเคชันใหม่พร้อมบอต เพิ่มบอตลงในเซิร์ฟเวอร์ของคุณ และจับคู่บอตกับ OpenClaw เราแนะนำให้เพิ่มบอตของคุณลงในเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากคุณยังไม่มี ให้[สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **สร้างของฉันเอง > สำหรับฉันและเพื่อนของฉัน**)

<Steps>
  <Step title="สร้างแอปพลิเคชันและบอต Discord">
    ไปที่ [พอร์ทัลนักพัฒนา Discord](https://discord.com/developers/applications) แล้วคลิก **แอปพลิเคชันใหม่** ตั้งชื่อประมาณว่า "OpenClaw"

    คลิก **บอต** บนแถบด้านข้าง ตั้งค่า **ชื่อผู้ใช้** เป็นชื่อที่คุณเรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้ intent ที่มีสิทธิพิเศษ">
    ยังคงอยู่ในหน้า **บอต** เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับรายการอนุญาตตามบทบาทและการจับคู่ชื่อกับ ID)
    - **Presence Intent** (ไม่บังคับ; จำเป็นเฉพาะสำหรับการอัปเดตสถานะการออนไลน์)

  </Step>

  <Step title="คัดลอกโทเค็นบอตของคุณ">
    เลื่อนกลับขึ้นไปในหน้า **บอต** แล้วคลิก **รีเซ็ตโทเค็น**

    <Note>
    แม้ชื่อจะเป็นเช่นนั้น แต่นี่คือการสร้างโทเค็นแรกของคุณ — ไม่มีสิ่งใดถูก "รีเซ็ต"
    </Note>

    คัดลอกโทเค็นและบันทึกไว้ที่ใดที่หนึ่ง นี่คือ **โทเค็นบอต** ของคุณ และคุณจะต้องใช้ในอีกไม่นาน

  </Step>

  <Step title="สร้าง URL เชิญและเพิ่มบอตลงในเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** บนแถบด้านข้าง คุณจะสร้าง URL เชิญพร้อมสิทธิ์ที่ถูกต้องเพื่อเพิ่มบอตลงในเซิร์ฟเวอร์ของคุณ

    เลื่อนลงไปที่ **ตัวสร้าง URL OAuth2** แล้วเปิดใช้:

    - `bot`
    - `applications.commands`

    ส่วน **สิทธิ์ของบอต** จะปรากฏด้านล่าง เปิดใช้อย่างน้อย:

    **สิทธิ์ทั่วไป**
      - ดูช่องทาง
    **สิทธิ์ข้อความ**
      - ส่งข้อความ
      - อ่านประวัติข้อความ
      - ฝังลิงก์
      - แนบไฟล์
      - เพิ่มรีแอ็กชัน (ไม่บังคับ)

    นี่คือชุดพื้นฐานสำหรับช่องข้อความปกติ หากคุณวางแผนจะโพสต์ในเธรด Discord รวมถึงเวิร์กโฟลว์ช่องฟอรัมหรือสื่อที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้ **ส่งข้อความในเธรด** ด้วย
    คัดลอก URL ที่สร้างขึ้นด้านล่าง วางลงในเบราว์เซอร์ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **ดำเนินการต่อ** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอตของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิดใช้โหมดนักพัฒนาและรวบรวม ID ของคุณ">
    กลับไปที่แอป Discord คุณต้องเปิดใช้โหมดนักพัฒนาเพื่อให้คัดลอก ID ภายในได้

    1. คลิก **การตั้งค่าผู้ใช้** (ไอคอนรูปเฟืองถัดจากอวาตาร์ของคุณ) → เลื่อนไปที่ **นักพัฒนา** ในแถบด้านข้าง → เปิด **โหมดนักพัฒนา**

        *(หมายเหตุ: ในแอป Discord บนมือถือ โหมดนักพัฒนาอยู่ใต้ **การตั้งค่าแอป** → **ขั้นสูง**)*

    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **คัดลอก ID เซิร์ฟเวอร์**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **คัดลอก ID ผู้ใช้**

    บันทึก **ID เซิร์ฟเวอร์** และ **ID ผู้ใช้** ของคุณไว้ข้างโทเค็นบอต — คุณจะส่งทั้งสามอย่างให้ OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาตข้อความส่วนตัวจากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงาน Discord ต้องอนุญาตให้บอตส่งข้อความส่วนตัวถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณ → **การตั้งค่าความเป็นส่วนตัว** → เปิด **ข้อความส่วนตัว**

    สิ่งนี้ทำให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอต) ส่งข้อความส่วนตัวถึงคุณได้ เปิดไว้หากคุณต้องการใช้ข้อความส่วนตัวของ Discord กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่องทางกิลด์ คุณสามารถปิดข้อความส่วนตัวหลังจากจับคู่แล้วได้

  </Step>

  <Step title="ตั้งค่าโทเค็นบอตของคุณอย่างปลอดภัย (อย่าส่งในแชต)">
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

    หาก OpenClaw รันอยู่เป็นบริการเบื้องหลังอยู่แล้ว ให้รีสตาร์ตผ่านแอป OpenClaw Mac หรือโดยหยุดและเริ่มกระบวนการ `openclaw gateway run` ใหม่
    สำหรับการติดตั้งบริการที่จัดการไว้ ให้รัน `openclaw gateway install` จากเชลล์ที่มี `DISCORD_BOT_TOKEN` อยู่ หรือเก็บตัวแปรไว้ใน `~/.openclaw/.env` เพื่อให้บริการสามารถ resolve env SecretRef ได้หลังรีสตาร์ต
    หากโฮสต์ของคุณถูกบล็อกหรือถูกจำกัดอัตราโดยการค้นหาแอปพลิเคชันตอนเริ่มต้นของ Discord ให้ตั้งค่า ID แอปพลิเคชัน/ไคลเอนต์ Discord จากพอร์ทัลนักพัฒนา เพื่อให้การเริ่มต้นข้าม REST call นั้นได้ ใช้ `channels.discord.applicationId` สำหรับบัญชีเริ่มต้น หรือ `channels.discord.accounts.<accountId>.applicationId` เมื่อคุณรันบอต Discord หลายตัว

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        แชตกับเอเจนต์ OpenClaw ของคุณบนช่องทางที่มีอยู่ใดก็ได้ (เช่น Telegram) แล้วบอกเอเจนต์ หาก Discord เป็นช่องทางแรกของคุณ ให้ใช้แท็บ CLI / การกำหนดค่าแทน

        > "ฉันตั้งค่าโทเค็นบอต Discord ในการกำหนดค่าแล้ว โปรดตั้งค่า Discord ให้เสร็จด้วย ID ผู้ใช้ `<user_id>` และ ID เซิร์ฟเวอร์ `<server_id>`"
      </Tab>
      <Tab title="CLI / การกำหนดค่า">
        หากคุณต้องการการกำหนดค่าแบบใช้ไฟล์ ให้ตั้งค่า:

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

        สำหรับการตั้งค่าแบบสคริปต์หรือระยะไกล ให้เขียนบล็อก JSON5 เดียวกันด้วย `openclaw config patch --file ./discord.patch.json5 --dry-run` แล้วรันซ้ำโดยไม่มี `--dry-run` รองรับค่า `token` แบบข้อความธรรมดา ค่า SecretRef ก็รองรับสำหรับ `channels.discord.token` ผ่านผู้ให้บริการ env/file/exec เช่นกัน ดู [การจัดการความลับ](/th/gateway/secrets)

        สำหรับบอต Discord หลายตัว ให้เก็บโทเค็นบอตและ ID แอปพลิเคชันแต่ละตัวไว้ใต้บัญชีของตนเอง `channels.discord.applicationId` ระดับบนจะถูกสืบทอดโดยบัญชี ดังนั้นให้ตั้งค่าที่นั่นเฉพาะเมื่อทุกบัญชีควรใช้ ID แอปพลิเคชันเดียวกัน

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

  <Step title="อนุมัติการจับคู่ข้อความส่วนตัวครั้งแรก">
    รอจนกว่า Gateway จะรันอยู่ แล้วส่งข้อความส่วนตัวถึงบอตของคุณใน Discord บอตจะตอบกลับด้วยรหัสจับคู่

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
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

    รหัสจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง

    ตอนนี้คุณควรแชตกับเอเจนต์ของคุณใน Discord ผ่านข้อความส่วนตัวได้แล้ว

  </Step>
</Steps>

<Note>
การ resolve โทเค็นรับรู้บัญชี ค่าโทเค็นในการกำหนดค่ามีสิทธิ์เหนือ env fallback `DISCORD_BOT_TOKEN` ใช้สำหรับบัญชีเริ่มต้นเท่านั้น
หากบัญชี Discord ที่เปิดใช้อยู่สองบัญชี resolve เป็นโทเค็นบอตเดียวกัน OpenClaw จะเริ่มตัวตรวจสอบ Gateway เพียงตัวเดียวสำหรับโทเค็นนั้น โทเค็นที่มาจากการกำหนดค่ามีสิทธิ์เหนือ env fallback เริ่มต้น มิฉะนั้นบัญชีที่เปิดใช้งานบัญชีแรกจะชนะ และบัญชีที่ซ้ำกันจะถูกรายงานว่าปิดใช้งาน
สำหรับการเรียกขาออกขั้นสูง (เครื่องมือข้อความ/การดำเนินการช่องทาง) จะใช้ `token` ต่อการเรียกแบบชัดเจนสำหรับการเรียกนั้น สิ่งนี้ใช้กับการดำเนินการแบบส่งและอ่าน/ตรวจสอบ (เช่น อ่าน/ค้นหา/ดึงข้อมูล/เธรด/ปักหมุด/สิทธิ์) การตั้งค่านโยบายบัญชี/การลองใหม่ยังคงมาจากบัญชีที่เลือกในสแนปช็อตรันไทม์ที่ใช้งานอยู่
</Note>

## แนะนำ: ตั้งค่าพื้นที่ทำงานกิลด์

เมื่อข้อความส่วนตัวทำงานแล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็นพื้นที่ทำงานเต็มรูปแบบที่แต่ละช่องทางมีเซสชันเอเจนต์ของตัวเองพร้อมบริบทของตัวเอง แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีเพียงคุณและบอตของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณลงในรายการอนุญาตกิลด์">
    สิ่งนี้ทำให้เอเจนต์ของคุณตอบกลับในช่องทางใดก็ได้บนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ข้อความส่วนตัว

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เพิ่ม ID เซิร์ฟเวอร์ Discord ของฉัน `<server_id>` ลงในรายการอนุญาตกิลด์"
      </Tab>
      <Tab title="การกำหนดค่า">

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
    ตามค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในช่องทางกิลด์เมื่อถูก @mentioned เท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณน่าจะต้องการให้ตอบกลับทุกข้อความ

    ในช่องทางกิลด์ การตอบกลับปกติจะโพสต์โดยอัตโนมัติตามค่าเริ่มต้น สำหรับห้องที่แชร์และเปิดตลอดเวลา ให้เลือกใช้ `messages.groupChat.visibleReplies: "message_tool"` เพื่อให้เอเจนต์เฝ้าดูเงียบ ๆ และโพสต์เฉพาะเมื่อมันตัดสินว่าการตอบกลับในช่องทางมีประโยชน์ วิธีนี้ทำงานได้ดีที่สุดกับโมเดลรุ่นล่าสุดที่เชื่อถือเครื่องมือได้ เช่น GPT 5.5 เหตุการณ์ห้องแบบ ambient จะยังเงียบอยู่เว้นแต่เครื่องมือจะส่ง ดู [เหตุการณ์ห้องแบบ ambient](/th/channels/ambient-room-events) สำหรับการกำหนดค่าโหมดเฝ้าดูแบบเต็ม

    หาก Discord แสดงการพิมพ์และล็อกแสดงการใช้โทเค็นแต่ไม่มีข้อความที่โพสต์ ให้ตรวจสอบว่าเทิร์นนั้นถูกกำหนดค่าเป็นเหตุการณ์ห้องแบบ ambient หรือเลือกใช้การตอบกลับที่มองเห็นได้ผ่านเครื่องมือข้อความหรือไม่

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "อนุญาตให้เอเจนต์ของฉันตอบกลับบนเซิร์ฟเวอร์นี้โดยไม่ต้องถูก @mentioned"
      </Tab>
      <Tab title="การกำหนดค่า">
        ตั้งค่า `requireMention: false` ในการกำหนดค่ากิลด์ของคุณ:

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

        หากต้องการบังคับให้การตอบกลับกลุ่ม/ช่องทางที่มองเห็นได้ต้องส่งผ่านเครื่องมือข้อความ ให้ตั้งค่า `messages.groupChat.visibleReplies: "message_tool"`

      </Tab>
    </Tabs>

  </Step>

  <Step title="วางแผนสำหรับหน่วยความจำในช่องทางกิลด์">
    ตามค่าเริ่มต้น หน่วยความจำระยะยาว (MEMORY.md) จะโหลดเฉพาะในเซสชันข้อความส่วนตัว ช่องทางกิลด์จะไม่โหลด MEMORY.md โดยอัตโนมัติ

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เมื่อฉันถามคำถามในช่องทาง Discord ให้ใช้ memory_search หรือ memory_get หากคุณต้องการบริบทระยะยาวจาก MEMORY.md"
      </Tab>
      <Tab title="ด้วยตนเอง">
        หากคุณต้องการบริบทที่แชร์ในทุกช่องทาง ให้ใส่คำสั่งที่เสถียรไว้ใน `AGENTS.md` หรือ `USER.md` (ไฟล์เหล่านี้จะถูกฉีดเข้าไปในทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงตามต้องการด้วยเครื่องมือหน่วยความจำ
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างช่องทางบางช่องบนเซิร์ฟเวอร์ Discord ของคุณและเริ่มแชต เอเจนต์ของคุณสามารถเห็นชื่อช่องทางได้ และแต่ละช่องทางจะมีเซสชันแยกของตัวเอง — ดังนั้นคุณสามารถตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ได้ที่เหมาะกับเวิร์กโฟลว์ของคุณ

## โมเดลรันไทม์

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord
- การกำหนดเส้นทางการตอบกลับเป็นแบบกำหนดแน่นอน: ข้อความตอบกลับขาเข้าจาก Discord จะกลับไปที่ Discord
- เมตาดาต้าของกิลด์/ช่อง Discord จะถูกเพิ่มลงในพรอมป์ของโมเดลเป็นบริบทที่ไม่น่าเชื่อถือ
  ไม่ใช่คำนำหน้าการตอบกลับที่ผู้ใช้มองเห็น หากโมเดลคัดลอกซองข้อมูลนั้น
  กลับมา OpenClaw จะลบเมตาดาต้าที่ถูกคัดลอกออกจากการตอบกลับขาออกและจาก
  บริบทการเล่นซ้ำในอนาคต
- โดยค่าเริ่มต้น (`session.dmScope=main`) แชทโดยตรงจะแชร์เซสชันหลักของเอเจนต์ (`agent:main:main`)
- ช่องกิลด์เป็นคีย์เซสชันที่แยกกัน (`agent:<agentId>:discord:channel:<channelId>`)
- Group DM จะถูกละเว้นโดยค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่ง slash ดั้งเดิมทำงานในเซสชันคำสั่งที่แยกกัน (`agent:<agentId>:discord:slash:<userId>`) ขณะเดียวกันยังคงพก `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่ถูกกำหนดเส้นทาง
- การส่งประกาศ cron/Heartbeat แบบข้อความเท่านั้นไปยัง Discord ใช้คำตอบสุดท้าย
  ที่ผู้ช่วยมองเห็นหนึ่งครั้ง ส่วนเพย์โหลดสื่อและคอมโพเนนต์แบบมีโครงสร้างยังคงเป็น
  หลายข้อความเมื่อเอเจนต์ปล่อยเพย์โหลดที่ส่งได้หลายรายการ

## ช่องฟอรัม

ช่องฟอรัมและช่องสื่อของ Discord รับเฉพาะโพสต์ในเธรดเท่านั้น OpenClaw รองรับสองวิธีในการสร้าง:

- ส่งข้อความไปยังฟอรัมหลัก (`channel:<forumId>`) เพื่อสร้างเธรดโดยอัตโนมัติ ชื่อเธรดใช้บรรทัดแรกที่ไม่ว่างของข้อความคุณ
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

ฟอรัมหลักไม่รับคอมโพเนนต์ Discord หากคุณต้องใช้คอมโพเนนต์ ให้ส่งไปยังเธรดเอง (`channel:<threadId>`)

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับคอนเทนเนอร์คอมโพเนนต์ Discord v2 สำหรับข้อความของเอเจนต์ ใช้เครื่องมือข้อความพร้อมเพย์โหลด `components` ผลลัพธ์จากการโต้ตอบจะถูกกำหนดเส้นทางกลับไปยังเอเจนต์เป็นข้อความขาเข้าปกติ และทำตามการตั้งค่า Discord `replyToMode` ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถวการกระทำรองรับปุ่มได้สูงสุด 5 ปุ่มหรือเมนูเลือกเดี่ยวหนึ่งเมนู
- ประเภทการเลือก: `string`, `user`, `role`, `mentionable`, `channel`

โดยค่าเริ่มต้น คอมโพเนนต์ใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่ออนุญาตให้ปุ่ม ตัวเลือก และฟอร์มถูกใช้ได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดว่าใครสามารถคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (ID ผู้ใช้ Discord, แท็ก หรือ `*`) เมื่อกำหนดค่าแล้ว ผู้ใช้ที่ไม่ตรงกันจะได้รับการปฏิเสธแบบ ephemeral

คอลแบ็กของคอมโพเนนต์หมดอายุหลัง 30 นาทีโดยค่าเริ่มต้น ตั้งค่า `channels.discord.agentComponents.ttlMs` เพื่อเปลี่ยนอายุรีจิสทรีคอลแบ็กนั้นสำหรับบัญชี Discord เริ่มต้น หรือ `channels.discord.accounts.<accountId>.agentComponents.ttlMs` เพื่อแทนที่บัญชีหนึ่งในชุดหลายบัญชี ค่าคือมิลลิวินาที ต้องเป็นจำนวนเต็มบวก และจำกัดสูงสุดที่ `86400000` (24 ชั่วโมง) TTL ที่ยาวขึ้นมีประโยชน์สำหรับเวิร์กโฟลว์การรีวิวหรือการอนุมัติที่ต้องให้ปุ่มยังใช้งานได้ แต่ก็ขยายช่วงเวลาที่ข้อความ Discord เก่ายังสามารถทริกเกอร์การกระทำได้ด้วย ควรใช้ TTL ที่สั้นที่สุดที่พอดีกับเวิร์กโฟลว์ และคงค่าเริ่มต้นไว้เมื่อคอลแบ็กเก่าอาจทำให้ประหลาดใจ

คำสั่ง slash `/model` และ `/models` เปิดตัวเลือกโมเดลแบบโต้ตอบที่มีดรอปดาวน์ผู้ให้บริการ โมเดล และรันไทม์ที่เข้ากันได้ พร้อมขั้นตอน Submit `/models add` เลิกใช้แล้วและตอนนี้จะส่งข้อความแจ้งการเลิกใช้แทนการลงทะเบียนโมเดลจากแชท การตอบกลับของตัวเลือกเป็นแบบ ephemeral และมีเพียงผู้ใช้ที่เรียกใช้เท่านั้นที่ใช้งานได้ เมนูเลือกของ Discord จำกัดที่ 25 ตัวเลือก ดังนั้นให้เพิ่มรายการ `provider/*` ลงใน `agents.defaults.models` เมื่อคุณต้องการให้ตัวเลือกแสดงโมเดลที่ค้นพบแบบไดนามิกเฉพาะสำหรับผู้ให้บริการที่เลือก เช่น `openai` หรือ `vllm`

ไฟล์แนบ:

- บล็อก `file` ต้องชี้ไปที่การอ้างอิงไฟล์แนบ (`attachment://<filename>`)
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
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM `channels.discord.allowFrom` คือ allowlist ของ DM แบบมาตรฐาน

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.discord.allowFrom` รวม `"*"`)
    - `disabled`

    หากนโยบาย DM ไม่ได้เปิดอยู่ ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือได้รับข้อความให้จับคู่ในโหมด `pairing`)

    ลำดับความสำคัญของหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้เฉพาะกับบัญชี `default`
    - สำหรับบัญชีเดียว `allowFrom` มีลำดับความสำคัญเหนือ `dm.allowFrom` แบบเดิม
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อ `allowFrom` ของตนเองและ `dm.allowFrom` แบบเดิมไม่ได้ตั้งค่า
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    `channels.discord.dm.policy` และ `channels.discord.dm.allowFrom` แบบเดิมยังคงถูกอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การ mention `<@id>`

    โดยปกติ ID ตัวเลขล้วนจะถูกแปลงเป็น ID ช่องเมื่อค่าเริ่มต้นของช่องเปิดใช้งานอยู่ แต่ ID ที่อยู่ใน DM `allowFrom` ที่มีผลของบัญชีจะถูกปฏิบัติเป็นเป้าหมาย DM ของผู้ใช้เพื่อความเข้ากันได้

  </Tab>

  <Tab title="Access groups">
    DM ของ Discord และการอนุญาตคำสั่งข้อความสามารถใช้รายการ `accessGroup:<name>` แบบไดนามิกใน `channels.discord.allowFrom`

    ชื่อกลุ่มการเข้าถึงใช้ร่วมกันในช่องข้อความต่าง ๆ ใช้ `type: "message.senders"` สำหรับกลุ่มคงที่ที่สมาชิกแสดงด้วยไวยากรณ์ `allowFrom` ปกติของแต่ละช่อง หรือ `type: "discord.channelAudience"` เมื่อผู้ชม `ViewChannel` ปัจจุบันของช่อง Discord ควรกำหนดสมาชิกแบบไดนามิก พฤติกรรมกลุ่มการเข้าถึงร่วมกันมีเอกสารไว้ที่นี่: [กลุ่มการเข้าถึง](/th/channels/access-groups)

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

    ช่องข้อความ Discord ไม่มีรายชื่อสมาชิกแยกต่างหาก `type: "discord.channelAudience"` จำลองสมาชิกเป็น: ผู้ส่ง DM เป็นสมาชิกของกิลด์ที่กำหนดค่าและในขณะนั้นมีสิทธิ์ `ViewChannel` ที่มีผลบนช่องที่กำหนดค่าหลังจากใช้ role และการเขียนทับของช่องแล้ว

    ตัวอย่าง: อนุญาตให้ใครก็ตามที่เห็น `#maintainers` สามารถ DM บอตได้ โดยยังคงปิด DM สำหรับคนอื่นทั้งหมด

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

    คุณสามารถผสมรายการไดนามิกและคงที่ได้:

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

    การค้นหาล้มเหลวแบบปิด หาก Discord ส่งคืน `Missing Access` การค้นหาสมาชิกล้มเหลว หรือช่องเป็นของกิลด์อื่น ผู้ส่ง DM จะถูกถือว่าไม่ได้รับอนุญาต

    เปิดใช้งาน **Server Members Intent** ใน Discord Developer Portal สำหรับบอตเมื่อใช้กลุ่มการเข้าถึงแบบผู้ชมช่อง DM ไม่มีสถานะสมาชิกกิลด์ ดังนั้น OpenClaw จึงแก้ไขสมาชิกผ่าน Discord REST ในเวลาที่อนุญาต

  </Tab>

  <Tab title="Guild policy">
    การจัดการกิลด์ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    ค่าพื้นฐานที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    พฤติกรรมของ `allowlist`:

    - กิลด์ต้องตรงกับ `channels.discord.guilds` (แนะนำ `id`, ยอมรับ slug)
    - allowlist ของผู้ส่งแบบไม่บังคับ: `users` (แนะนำ ID ที่เสถียร) และ `roles` (เฉพาะ ID ของ role); หากกำหนดค่าอย่างใดอย่างหนึ่ง ผู้ส่งจะได้รับอนุญาตเมื่อตรงกับ `users` หรือ `roles`
    - การจับคู่ชื่อ/แท็กโดยตรงถูกปิดใช้งานโดยค่าเริ่มต้น; เปิดใช้ `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเป็นโหมดความเข้ากันได้แบบฉุกเฉิน
    - รองรับชื่อ/แท็กสำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อใช้รายการชื่อ/แท็ก
    - หากกิลด์มีการกำหนดค่า `channels` ช่องที่ไม่อยู่ในรายการจะถูกปฏิเสธ
    - หากกิลด์ไม่มีบล็อก `channels` ช่องทั้งหมดในกิลด์ที่อยู่ใน allowlist นั้นจะได้รับอนุญาต

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

    หากคุณตั้งค่าเฉพาะ `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` fallback ของรันไทม์คือ `groupPolicy="allowlist"` (พร้อมคำเตือนในล็อก) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open`

  </Tab>

  <Tab title="Mentions and group DMs">
    ข้อความกิลด์ต้องผ่านการ mention โดยค่าเริ่มต้น

    การตรวจจับ mention รวมถึง:

    - การ mention บอตอย่างชัดเจน
    - รูปแบบ mention ที่กำหนดค่า (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับถึงบอตโดยนัยในกรณีที่รองรับ

    เมื่อเขียนข้อความ Discord ขาออก ให้ใช้ไวยากรณ์ mention แบบมาตรฐาน: `<@USER_ID>` สำหรับผู้ใช้, `<#CHANNEL_ID>` สำหรับช่อง และ `<@&ROLE_ID>` สำหรับ role อย่าใช้รูปแบบ mention ชื่อเล่นแบบเดิม `<@!USER_ID>`

    `requireMention` ถูกกำหนดค่าต่อกิลด์/ช่อง (`channels.discord.guilds...`)
    `ignoreOtherMentions` สามารถละทิ้งข้อความที่ mention ผู้ใช้/role อื่นแต่ไม่ได้ mention บอต (ไม่รวม @everyone/@here)

    Group DM:

    - ค่าเริ่มต้น: ถูกละเว้น (`dm.groupEnabled=false`)
    - allowlist แบบไม่บังคับผ่าน `dm.groupChannels` (ID ช่องหรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตาม role

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิกกิลด์ Discord ไปยังเอเจนต์ต่าง ๆ ตาม ID บทบาท การผูกตามบทบาทรับเฉพาะ ID บทบาทเท่านั้น และจะถูกประเมินหลังการผูกแบบ peer หรือ parent-peer และก่อนการผูกแบบเฉพาะกิลด์ หากการผูกตั้งค่าฟิลด์การจับคู่อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ฟิลด์ทั้งหมดที่กำหนดค่าต้องตรงกัน

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
- การแทนที่รายช่องทาง: `channels.discord.commands.native`
- `commands.native=false` ข้ามการลงทะเบียนและการล้างคำสั่ง slash-command ของ Discord ระหว่างเริ่มต้น คำสั่งที่ลงทะเบียนไว้ก่อนหน้านี้อาจยังมองเห็นได้ใน Discord จนกว่าคุณจะลบออกจากแอป Discord
- การยืนยันสิทธิ์คำสั่งเนทีฟใช้รายการอนุญาต/นโยบาย Discord เดียวกับการจัดการข้อความปกติ
- คำสั่งอาจยังมองเห็นได้ใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต แต่การเรียกใช้ยังคงบังคับใช้การยืนยันสิทธิ์ของ OpenClaw และส่งคืน "not authorized"

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

    หมายเหตุ: `off` ปิดการร้อยเธรดการตอบกลับโดยนัย แท็ก `[[reply_to_*]]` แบบชัดเจนยังคงถูกใช้งาน
    `first` จะแนบอ้างอิงการตอบกลับเนทีฟโดยนัยไปกับข้อความ Discord ขาออกแรกของเทิร์นนั้นเสมอ
    `batched` จะแนบอ้างอิงการตอบกลับเนทีฟโดยนัยของ Discord เฉพาะเมื่อ
    เหตุการณ์ขาเข้าเป็นชุดข้อความหลายข้อความที่ถูกหน่วงรวมกัน ซึ่งมีประโยชน์
    เมื่อคุณต้องการการตอบกลับเนทีฟเป็นหลักสำหรับแชตที่ส่งถี่และกำกวม ไม่ใช่ทุก
    เทิร์นที่มีข้อความเดียว

    ID ข้อความจะแสดงในบริบท/ประวัติเพื่อให้เอเจนต์กำหนดเป้าหมายข้อความเฉพาะได้

  </Accordion>

  <Accordion title="ตัวอย่างลิงก์">
    Discord สร้าง rich link embeds สำหรับ URL โดยค่าเริ่มต้น OpenClaw ระงับ embeds ที่สร้างขึ้นเหล่านั้นในข้อความ Discord ขาออกโดยค่าเริ่มต้น เพื่อให้ URL ที่เอเจนต์ส่งยังคงเป็นลิงก์ธรรมดา เว้นแต่คุณเลือกเปิดใช้:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    ตั้งค่า `channels.discord.accounts.<id>.suppressEmbeds` เพื่อแทนที่สำหรับบัญชีเดียว การส่งผ่านเครื่องมือข้อความของเอเจนต์ยังสามารถส่ง `suppressEmbeds: false` สำหรับข้อความเดียวได้ด้วย เพย์โหลด `embeds` ของ Discord แบบชัดเจนจะไม่ถูกระงับโดยการตั้งค่าตัวอย่างลิงก์เริ่มต้น

  </Accordion>

  <Accordion title="ตัวอย่างสตรีมสด">
    OpenClaw สามารถสตรีมร่างคำตอบโดยส่งข้อความชั่วคราวและแก้ไขเมื่อข้อความมาถึง `channels.discord.streaming` รับค่า `off` | `partial` | `block` | `progress` (ค่าเริ่มต้น) `progress` เก็บร่างสถานะที่แก้ไขได้หนึ่งรายการและอัปเดตด้วยความคืบหน้าของเครื่องมือจนกว่าจะส่งขั้นสุดท้าย ป้ายกำกับเริ่มต้นที่ใช้ร่วมกันเป็นบรรทัดเลื่อน ดังนั้นเมื่อมีงานปรากฏมากพอ ก็จะเลื่อนหายไปเหมือนส่วนอื่น `streamMode` เป็นนามแฝงรันไทม์แบบเดิม เรียกใช้ `openclaw doctor --fix` เพื่อเขียนค่าคอนฟิกที่บันทึกไว้ใหม่ให้เป็นคีย์ตามหลัก

    ตั้งค่า `channels.discord.streaming.mode` เป็น `off` เพื่อปิดการแก้ไขตัวอย่าง Discord หากเปิดใช้การสตรีมแบบบล็อกของ Discord อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำ

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

    - `partial` แก้ไขข้อความตัวอย่างเดียวเมื่อโทเค็นมาถึง
    - `block` ส่งชิ้นส่วนขนาดร่าง (ใช้ `draftChunk` เพื่อปรับขนาดและจุดตัด โดยถูกจำกัดไม่เกิน `textChunkLimit`)
    - ผลลัพธ์สุดท้ายที่เป็นสื่อ ข้อผิดพลาด และการตอบกลับแบบชัดเจนจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าการอัปเดตเครื่องมือ/ความคืบหน้าจะใช้ข้อความตัวอย่างซ้ำหรือไม่
    - แถวเครื่องมือ/ความคืบหน้าแสดงเป็นอีโมจิ + ชื่อ + รายละเอียดแบบกะทัดรัดเมื่อมี เช่น `🛠️ Bash: run tests` หรือ `🔎 Web Search: for "query"`
    - `streaming.progress.commentary` (ค่าเริ่มต้น `false`) เลือกเปิดใช้ข้อความคำอธิบาย/คำเกริ่นของผู้ช่วยในร่างความคืบหน้าชั่วคราว คำอธิบายจะถูกทำความสะอาดก่อนแสดงผล คงอยู่ชั่วคราว และไม่เปลี่ยนการส่งคำตอบขั้นสุดท้าย
    - `streaming.progress.maxLineChars` ควบคุมงบประมาณตัวอย่างความคืบหน้าต่อบรรทัด ข้อความทั่วไปจะถูกย่อบนขอบเขตคำ ส่วนรายละเอียดคำสั่งและพาธจะเก็บส่วนท้ายที่มีประโยชน์ไว้
    - `streaming.preview.commandText` / `streaming.progress.commandText` ควบคุมรายละเอียดคำสั่ง/exec ในบรรทัดความคืบหน้าแบบกะทัดรัด: `raw` (ค่าเริ่มต้น) หรือ `status` (เฉพาะป้ายกำกับเครื่องมือ)

    ซ่อนข้อความคำสั่ง/exec ดิบโดยยังคงแสดงบรรทัดความคืบหน้าแบบกะทัดรัด:

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

    การสตรีมตัวอย่างเป็นแบบข้อความเท่านั้น การตอบกลับที่เป็นสื่อจะถอยกลับไปใช้การส่งตามปกติ เมื่อเปิดใช้การสตรีมแบบ `block` อย่างชัดเจน OpenClaw จะข้ามสตรีมตัวอย่างเพื่อหลีกเลี่ยงการสตรีมซ้ำ

  </Accordion>

  <Accordion title="ประวัติ บริบท และพฤติกรรมเธรด">
    บริบทประวัติกิลด์:

    - ค่าเริ่มต้นของ `channels.discord.historyLimit` คือ `20`
    - ทางเลือกสำรอง: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    การควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมเธรด:

    - เธรด Discord จะถูกกำหนดเส้นทางเป็นเซสชันช่องทางและสืบทอดค่าคอนฟิกช่องทางแม่ เว้นแต่ถูกแทนที่
    - เซสชันเธรดสืบทอดการเลือก `/model` ระดับเซสชันของช่องทางแม่เป็นทางเลือกสำรองเฉพาะโมเดล การเลือก `/model` ภายในเธรดยังคงมีลำดับความสำคัญเหนือกว่า และประวัติทรานสคริปต์ของแม่จะไม่ถูกคัดลอก เว้นแต่เปิดใช้การสืบทอดทรานสคริปต์
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) เลือกให้เธรดอัตโนมัติใหม่เริ่มต้นด้วยข้อมูลจากทรานสคริปต์แม่ การแทนที่รายบัญชีอยู่ภายใต้ `channels.discord.accounts.<id>.thread.inheritParent`
    - รีแอ็กชันของเครื่องมือข้อความสามารถแก้เป้าหมาย DM แบบ `user:<id>` ได้
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะถูกคงไว้ระหว่างทางเลือกสำรองของการเปิดใช้งานในขั้นตอบกลับ

    หัวข้อช่องทางจะถูกฉีดเข้าเป็นบริบทที่ **ไม่น่าเชื่อถือ** รายการอนุญาตควบคุมว่าใครสามารถเรียกเอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบสมบูรณ์

  </Accordion>

  <Accordion title="เซสชันที่ผูกกับเธรดสำหรับเอเจนต์ย่อย">
    Discord สามารถผูกเธรดกับเป้าหมายเซสชันเพื่อให้ข้อความติดตามผลในเธรดนั้นยังคงกำหนดเส้นทางไปยังเซสชันเดิม (รวมถึงเซสชันเอเจนต์ย่อย)

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/ใหม่กับเป้าหมายซับเอเจนต์/เซสชัน
    - `/unfocus` ลบการผูกเธรดปัจจุบัน
    - `/agents` แสดงรันที่ใช้งานอยู่และสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการยกเลิกโฟกัสอัตโนมัติเมื่อไม่มีกิจกรรมสำหรับการผูกที่โฟกัสอยู่
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

    - `session.threadBindings.*` ตั้งค่าเริ่มต้นส่วนกลาง
    - `channels.discord.threadBindings.*` แทนที่พฤติกรรมของ Discord
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดอัตโนมัติสำหรับ `sessions_spawn({ thread: true })` และการสร้างเธรด ACP ค่าเริ่มต้น: `true`
    - `defaultSpawnContext` ควบคุมบริบทซับเอเจนต์เนทีฟสำหรับการสร้างที่ผูกกับเธรด ค่าเริ่มต้น: `"fork"`
    - คีย์ `spawnSubagentSessions`/`spawnAcpSessions` ที่เลิกใช้แล้วจะถูกย้ายโดย `openclaw doctor --fix`
    - หากการผูกเธรดถูกปิดใช้งานสำหรับบัญชีหนึ่ง `/focus` และการดำเนินการผูกเธรดที่เกี่ยวข้องจะไม่พร้อมใช้งาน

    ดู [ซับเอเจนต์](/th/tools/subagents), [เอเจนต์ ACP](/th/tools/acp-agents) และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    สำหรับพื้นที่ทำงาน ACP แบบเสถียรที่ "เปิดตลอดเวลา" ให้กำหนดค่าการผูก ACP แบบระบุชนิดระดับบนสุดที่ชี้ไปยังการสนทนา Discord

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

    - `/acp spawn codex --bind here` ผูกช่องหรือเธรดปัจจุบันไว้ตรงจุดนั้น และเก็บข้อความในอนาคตไว้ในเซสชัน ACP เดียวกัน ข้อความในเธรดจะสืบทอดการผูกของช่องแม่
    - ในช่องหรือเธรดที่ถูกผูกไว้ `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP เดิมตรงจุดนั้น การผูกเธรดชั่วคราวสามารถแทนที่การแก้เป้าหมายขณะที่ยังใช้งานอยู่ได้
    - `spawnSessions` ควบคุมการสร้าง/ผูกเธรดย่อยผ่าน `--thread auto|here`

    ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมการผูก

  </Accordion>

  <Accordion title="Reaction notifications">
    โหมดการแจ้งเตือนรีแอ็กชันต่อกิลด์:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    เหตุการณ์รีแอ็กชันจะถูกแปลงเป็นเหตุการณ์ระบบและแนบกับเซสชัน Discord ที่ถูกกำหนดเส้นทาง

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการแก้ค่า:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - ทางเลือกสำรองอีโมจิของตัวตนเอเจนต์ (`agents.list[].identity.emoji`, else "👀")

    หมายเหตุ:

    - Discord ยอมรับอีโมจิ Unicode หรือชื่ออีโมจิแบบกำหนดเอง
    - ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับช่องหรือบัญชี

  </Accordion>

  <Accordion title="Config writes">
    การเขียนการกำหนดค่าที่เริ่มจากช่องถูกเปิดใช้งานเป็นค่าเริ่มต้น

    สิ่งนี้มีผลต่อโฟลว์ `/config set|unset` (เมื่อเปิดใช้งานฟีเจอร์คำสั่ง)

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

  <Accordion title="Gateway proxy">
    กำหนดเส้นทางทราฟฟิก WebSocket ของ Discord Gateway และการค้นหา REST ตอนเริ่มต้น (ID แอปพลิเคชัน + การแก้ allowlist) ผ่านพร็อกซี HTTP(S) ด้วย `channels.discord.proxy`

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

  <Accordion title="PluralKit support">
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

    - รายการอนุญาตสามารถใช้ `pk:<memberId>` ได้
    - ชื่อที่แสดงของสมาชิกจะจับคู่ตามชื่อ/slug เท่านั้นเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การค้นหาใช้ ID ข้อความเดิมและถูกจำกัดด้วยกรอบเวลา
    - หากการค้นหาล้มเหลว ข้อความที่ถูกพร็อกซีจะถูกถือว่าเป็นข้อความจากบอตและถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    ใช้ `mentionAliases` เมื่อเอเจนต์ต้องการการกล่าวถึงขาออกแบบกำหนดแน่นอนสำหรับผู้ใช้ Discord ที่รู้จัก คีย์คือ handle ที่ไม่มี `@` นำหน้า ค่าคือ ID ผู้ใช้ Discord ส่วน handle ที่ไม่รู้จัก, `@everyone`, `@here` และการกล่าวถึงภายใน code span ของ Markdown จะคงไว้ไม่เปลี่ยนแปลง

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

  <Accordion title="Presence configuration">
    การอัปเดตสถานะออนไลน์จะถูกใช้เมื่อคุณตั้งค่าฟิลด์สถานะหรือกิจกรรม หรือเมื่อคุณเปิดใช้สถานะออนไลน์อัตโนมัติ

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

    ตัวอย่างกิจกรรม (สถานะกำหนดเองเป็นประเภทกิจกรรมเริ่มต้น):

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
    - 4: กำหนดเอง (ใช้ข้อความกิจกรรมเป็นสถานะ; อีโมจิเป็นตัวเลือก)
    - 5: กำลังแข่งขัน

    ตัวอย่างสถานะออนไลน์อัตโนมัติ (สัญญาณสุขภาพ runtime):

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

    สถานะออนไลน์อัตโนมัติจะแมปความพร้อมใช้งานของ runtime ไปยังสถานะ Discord: healthy => online, degraded หรือ unknown => idle, exhausted หรือ unavailable => dnd ข้อความเสริมสำหรับเขียนทับ:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับ placeholder `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord รองรับการจัดการการอนุมัติผ่านปุ่มใน DM และสามารถเลือกโพสต์พรอมป์การอนุมัติในช่องทางต้นทางได้

    พาธการกำหนดค่า:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; fallback ไปที่ `commands.ownerAllowFrom` เมื่อเป็นไปได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord จะเปิดใช้การอนุมัติ exec แบบ native อัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และสามารถ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งราย ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมานผู้อนุมัติ exec จาก `allowFrom` ของช่องทาง, `dm.allowFrom` แบบเดิม หรือ `defaultTo` ของ direct-message ตั้งค่า `enabled: false` เพื่อปิดใช้ Discord ในฐานะไคลเอนต์การอนุมัติ native อย่างชัดเจน

    สำหรับคำสั่งกลุ่มที่ละเอียดอ่อนและจำกัดเฉพาะเจ้าของ เช่น `/diagnostics` และ `/export-trajectory` OpenClaw จะส่งพรอมป์การอนุมัติและผลลัพธ์สุดท้ายแบบส่วนตัว โดยจะลองใช้ Discord DM ก่อนเมื่อเจ้าของที่เรียกใช้มีเส้นทางเจ้าของ Discord หากไม่มี จะ fallback ไปยังเส้นทางเจ้าของแรกที่พร้อมใช้งานจาก `commands.ownerAllowFrom` เช่น Telegram

    เมื่อ `target` เป็น `channel` หรือ `both` พรอมป์การอนุมัติจะมองเห็นได้ในช่องทาง เฉพาะผู้อนุมัติที่ resolve แล้วเท่านั้นที่ใช้ปุ่มได้ ผู้ใช้อื่นจะได้รับการปฏิเสธแบบ ephemeral พรอมป์การอนุมัติรวมข้อความคำสั่งไว้ด้วย ดังนั้นให้เปิดใช้การส่งไปยังช่องทางเฉพาะในช่องทางที่เชื่อถือได้ หากไม่สามารถอนุมาน ID ช่องทางจาก session key ได้ OpenClaw จะ fallback ไปส่งผ่าน DM

    Discord ยังเรนเดอร์ปุ่มการอนุมัติร่วมที่ช่องแชตอื่นใช้ด้วย adapter native ของ Discord หลัก ๆ แล้วเพิ่มการกำหนดเส้นทาง DM ของผู้อนุมัติและการกระจายไปยังช่องทาง
    เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก OpenClaw
    ควรรวมคำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์เครื่องมือระบุว่า
    การอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียวเท่านั้น
    หาก runtime การอนุมัติ native ของ Discord ไม่ทำงาน OpenClaw จะคง
    พรอมป์ `/approve <id> <decision>` แบบกำหนดแน่นอนในเครื่องให้มองเห็นได้ หาก
    runtime ทำงานอยู่แต่ไม่สามารถส่งการ์ด native ไปยังเป้าหมายใดได้
    OpenClaw จะส่งประกาศ fallback ในแชตเดียวกันพร้อมคำสั่ง `/approve`
    ที่ตรงจากการอนุมัติที่ค้างอยู่

    การยืนยันตัวตน Gateway และการ resolve การอนุมัติเป็นไปตามสัญญาไคลเอนต์ Gateway ที่ใช้ร่วมกัน (ID `plugin:` resolve ผ่าน `plugin.approval.resolve`; ID อื่นผ่าน `exec.approval.resolve`) การอนุมัติหมดอายุหลัง 30 นาทีโดยค่าเริ่มต้น

    ดู [การอนุมัติ Exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและเกตการดำเนินการ

การดำเนินการกับข้อความ Discord รวมถึงการส่งข้อความ การดูแลช่องทาง การกลั่นกรอง สถานะออนไลน์ และการดำเนินการกับเมตาดาต้า

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- การตอบสนอง: `react`, `reactions`, `emojiList`
- การกลั่นกรอง: `timeout`, `kick`, `ban`
- สถานะออนไลน์: `setPresence`

การดำเนินการ `event-create` รับพารามิเตอร์ `image` แบบไม่บังคับ (URL หรือพาธไฟล์ในเครื่อง) เพื่อตั้งค่าภาพปกของเหตุการณ์ที่กำหนดเวลาไว้

เกตการดำเนินการอยู่ภายใต้ `channels.discord.actions.*`

พฤติกรรมเกตเริ่มต้น:

| กลุ่มการดำเนินการ                                                                                                                                                       | ค่าเริ่มต้น  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้งาน  |
| roles                                                                                                                                                                    | ปิดใช้งาน |
| moderation                                                                                                                                                               | ปิดใช้งาน |
| presence                                                                                                                                                                 | ปิดใช้งาน |

## UI Components v2

OpenClaw ใช้ Discord components v2 สำหรับการอนุมัติ exec และเครื่องหมายข้ามบริบท การดำเนินการกับข้อความ Discord ยังรับ `components` สำหรับ UI กำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้าง payload ของ component ผ่านเครื่องมือ discord) ขณะที่ `embeds` แบบเดิมยังคงใช้ได้แต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นที่ใช้โดยคอนเทนเนอร์ component ของ Discord (hex)
- ตั้งค่าแยกตามบัญชีด้วย `channels.discord.accounts.<id>.ui.components.accentColor`
- `channels.discord.agentComponents.ttlMs` ควบคุมระยะเวลาที่ callback ของ component Discord ที่ส่งไปยังคงลงทะเบียนอยู่ (ค่าเริ่มต้น `1800000`, สูงสุด `86400000`) ตั้งค่าแยกตามบัญชีด้วย `channels.discord.accounts.<id>.agentComponents.ttlMs`
- `embeds` จะถูกละเว้นเมื่อมี components v2
- การแสดงตัวอย่าง URL แบบข้อความล้วนจะถูกระงับโดยค่าเริ่มต้น ตั้งค่า `suppressEmbeds: false` ในการดำเนินการข้อความเมื่อควรขยายลิงก์ขาออกเพียงลิงก์เดียว

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

Discord มีพื้นผิวเสียงที่แยกกันสองแบบ: **ช่องเสียง** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **ไฟล์แนบข้อความเสียง** (รูปแบบพรีวิวคลื่นเสียง) Gateway รองรับทั้งสองแบบ

### ช่องเสียง

รายการตรวจสอบการตั้งค่า:

1. เปิดใช้ Message Content Intent ใน Discord Developer Portal
2. เปิดใช้ Server Members Intent เมื่อใช้รายการอนุญาตตามบทบาท/ผู้ใช้
3. เชิญบอตด้วย scope `bot` และ `applications.commands`
4. ให้สิทธิ์ Connect, Speak, Send Messages และ Read Message History ในช่องเสียงเป้าหมาย
5. เปิดใช้คำสั่ง native (`commands.native` หรือ `channels.discord.commands.native`)
6. กำหนดค่า `channels.discord.voice`

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งนี้ใช้เอเจนต์เริ่มต้นของบัญชีและทำตามกฎรายการอนุญาตและนโยบายกลุ่มเดียวกับคำสั่ง Discord อื่น ๆ

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

หากต้องการตรวจสอบสิทธิ์ที่มีผลจริงของบอตก่อนเข้าร่วม ให้เรียกใช้:

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

- `voice.tts` แทนที่ `messages.tts` สำหรับการเล่นเสียง `stt-tts` เท่านั้น โหมดเรียลไทม์ใช้ `voice.realtime.speakerVoice`
- `voice.mode` ควบคุมเส้นทางการสนทนา ค่าเริ่มต้นคือ `agent-proxy`: ส่วนหน้าเสียงแบบเรียลไทม์จัดการจังหวะเทิร์น การขัดจังหวะ และการเล่นเสียง มอบหมายงานที่มีสาระให้เอเจนต์ OpenClaw ที่ถูกกำหนดเส้นทางผ่าน `openclaw_agent_consult` และปฏิบัติกับผลลัพธ์เหมือนพรอมป์ Discord แบบพิมพ์จากผู้พูดคนนั้น `stt-tts` คงโฟลว์ STT แบบแบตช์เดิมพร้อม TTS ไว้ `bidi` ให้โมเดลเรียลไทม์สนทนาได้โดยตรง ขณะเปิดเผย `openclaw_agent_consult` สำหรับสมอง OpenClaw
- `voice.agentSession` ควบคุมว่าการสนทนา OpenClaw ใดจะรับเทิร์นเสียง ปล่อยว่างไว้เพื่อใช้เซสชันของช่องเสียงเอง หรือตั้งเป็น `{ mode: "target", target: "channel:<text-channel-id>" }` เพื่อให้ช่องเสียงทำหน้าที่เป็นส่วนขยายไมโครโฟน/ลำโพงของเซสชันช่องข้อความ Discord ที่มีอยู่ เช่น `#maintainers`
- `voice.model` แทนที่สมองเอเจนต์ OpenClaw สำหรับการตอบกลับเสียง Discord และการปรึกษาแบบเรียลไทม์ ปล่อยว่างไว้เพื่อสืบทอดโมเดลเอเจนต์ที่ถูกกำหนดเส้นทาง ค่านี้แยกจาก `voice.realtime.model`
- `voice.followUsers` ให้บอตเข้าร่วม ย้าย และออกจากเสียง Discord พร้อมผู้ใช้ที่เลือก ดูกฎพฤติกรรมและตัวอย่างที่ [ติดตามผู้ใช้ในเสียง](#follow-users-in-voice)
- `agent-proxy` กำหนดเส้นทางเสียงพูดผ่าน `discord-voice` ซึ่งรักษาการอนุญาตเจ้าของ/เครื่องมือตามปกติสำหรับผู้พูดและเซสชันเป้าหมาย แต่ซ่อนเครื่องมือ `tts` ของเอเจนต์เพราะเสียง Discord เป็นเจ้าของการเล่นเสียง โดยค่าเริ่มต้น `agent-proxy` ให้การปรึกษามีสิทธิ์ใช้เครื่องมือเต็มรูปแบบเทียบเท่าเจ้าของสำหรับผู้พูดที่เป็นเจ้าของ (`voice.realtime.toolPolicy: "owner"`) และให้ความสำคัญอย่างยิ่งกับการปรึกษาเอเจนต์ OpenClaw ก่อนคำตอบที่มีสาระ (`voice.realtime.consultPolicy: "always"`) ในโหมดเริ่มต้น `always` นั้น เลเยอร์เรียลไทม์จะไม่พูดเติมช่องว่างอัตโนมัติก่อนคำตอบจากการปรึกษา แต่จะจับและถอดเสียงคำพูด จากนั้นพูดคำตอบ OpenClaw ที่ถูกกำหนดเส้นทาง หากคำตอบจากการปรึกษาแบบบังคับหลายรายการเสร็จขณะที่ Discord ยังเล่นคำตอบแรกอยู่ คำตอบคำพูดตรงตัวถัดไปจะถูกเข้าคิวจนกว่าการเล่นเสียงจะว่าง แทนที่จะแทนที่คำพูดกลางประโยค
- ในโหมด `stt-tts` STT ใช้ `tools.media.audio`; `voice.model` ไม่มีผลต่อการถอดเสียง
- ในโหมดเรียลไทม์ `voice.realtime.provider`, `voice.realtime.model` และ `voice.realtime.speakerVoice` กำหนดค่าเซสชันเสียงเรียลไทม์ สำหรับ OpenAI Realtime 2 พร้อมสมอง Codex ให้ใช้ `voice.realtime.model: "gpt-realtime-2"` และ `voice.model: "openai/gpt-5.5"`
- โหมดเสียงเรียลไทม์รวมไฟล์โปรไฟล์ `IDENTITY.md`, `USER.md` และ `SOUL.md` ขนาดเล็กไว้ในคำสั่งของผู้ให้บริการเรียลไทม์โดยค่าเริ่มต้น เพื่อให้เทิร์นตรงที่รวดเร็วยังคงอัตลักษณ์ การอิงข้อมูลผู้ใช้ และบุคลิกเดียวกับเอเจนต์ OpenClaw ที่ถูกกำหนดเส้นทาง ตั้ง `voice.realtime.bootstrapContextFiles` เป็นชุดย่อยเพื่อปรับแต่งสิ่งนี้ หรือ `[]` เพื่อปิดใช้ ไฟล์บูตสแตรปเรียลไทม์ที่รองรับจำกัดอยู่ที่ไฟล์โปรไฟล์เหล่านั้น; `AGENTS.md` ยังคงอยู่ในบริบทเอเจนต์ตามปกติ บริบทโปรไฟล์ที่ฉีดเข้าไปไม่ได้แทนที่ `openclaw_agent_consult` สำหรับงานในเวิร์กสเปซ ข้อเท็จจริงปัจจุบัน การค้นหาหน่วยความจำ หรือการดำเนินการที่มีเครื่องมือรองรับ
- ในโหมดเรียลไทม์ OpenAI `agent-proxy` ให้ตั้ง `voice.realtime.requireWakeName: true` เพื่อให้เสียงเรียลไทม์ Discord เงียบจนกว่าข้อความถอดเสียงจะเริ่มต้นหรือจบลงด้วยชื่อปลุก ชื่อปลุกที่กำหนดค่าต้องมีหนึ่งหรือสองคำ หากไม่ได้ตั้ง `voice.realtime.wakeNames` OpenClaw จะใช้ `name` ของเอเจนต์ที่ถูกกำหนดเส้นทางพร้อม `OpenClaw` และย้อนกลับไปใช้รหัสเอเจนต์พร้อม `OpenClaw` การกั้นด้วยชื่อปลุกจะปิดใช้การตอบกลับอัตโนมัติของผู้ให้บริการเรียลไทม์ กำหนดเส้นทางเทิร์นที่ยอมรับผ่านเส้นทางปรึกษาเอเจนต์ OpenClaw และให้การตอบรับแบบพูดสั้น ๆ เมื่อรู้จำชื่อปลุกนำหน้าจากการถอดเสียงบางส่วนก่อนที่ข้อความถอดเสียงสุดท้ายจะมาถึง
- ผู้ให้บริการเรียลไทม์ OpenAI ยอมรับชื่อเหตุการณ์ Realtime 2 ปัจจุบันและนามแฝงเดิมที่เข้ากันได้กับ Codex สำหรับเหตุการณ์เสียงเอาต์พุตและข้อความถอดเสียง ดังนั้นสแนปช็อตผู้ให้บริการที่เข้ากันได้จึงเปลี่ยนแปลงได้โดยไม่ทำให้เสียงผู้ช่วยหลุดหาย
- `voice.realtime.bargeIn` ควบคุมว่าเหตุการณ์เริ่มพูดของผู้พูด Discord จะขัดจังหวะการเล่นเสียงเรียลไทม์ที่ทำงานอยู่หรือไม่ หากไม่ได้ตั้งค่า จะทำตามการตั้งค่าการขัดจังหวะเสียงอินพุตของผู้ให้บริการเรียลไทม์
- `voice.realtime.minBargeInAudioEndMs` ควบคุมระยะเวลาการเล่นเสียงผู้ช่วยขั้นต่ำก่อนที่การแทรกพูดของ OpenAI เรียลไทม์จะตัดเสียง ค่าเริ่มต้น: `250` ตั้ง `0` เพื่อขัดจังหวะทันทีในห้องที่เสียงสะท้อนต่ำ หรือเพิ่มค่านี้สำหรับการตั้งค่าลำโพงที่มีเสียงสะท้อนมาก
- สำหรับเสียง OpenAI บนการเล่นเสียง Discord ให้ตั้ง `voice.tts.provider: "openai"` และเลือกเสียงแปลงข้อความเป็นคำพูดภายใต้ `voice.tts.providers.openai.speakerVoice` `cedar` เป็นตัวเลือกที่ให้เสียงโทนชายที่ดีบนโมเดล OpenAI TTS ปัจจุบัน
- การแทนที่ `systemPrompt` รายช่องของ Discord มีผลกับเทิร์นข้อความถอดเสียงสำหรับช่องเสียงนั้น
- เทิร์นข้อความถอดเสียงจะอนุมานสถานะเจ้าของจาก `allowFrom` ของ Discord (หรือ `dm.allowFrom`) สำหรับคำสั่งที่จำกัดเฉพาะเจ้าของและการดำเนินการของช่อง การมองเห็นเครื่องมือเอเจนต์ทำตามนโยบายเครื่องมือที่กำหนดค่าสำหรับเซสชันที่ถูกกำหนดเส้นทาง
- เสียง Discord เป็นแบบเลือกเปิดสำหรับคอนฟิกข้อความเท่านั้น; ตั้ง `channels.discord.voice.enabled=true` (หรือคงบล็อก `channels.discord.voice` ที่มีอยู่) เพื่อเปิดใช้คำสั่ง `/vc` รันไทม์เสียง และ Gateway intent `GuildVoiceStates`
- `channels.discord.intents.voiceStates` สามารถแทนที่การสมัครรับ intent สถานะเสียงได้โดยตรง ปล่อยว่างไว้เพื่อให้ intent ทำตามการเปิดใช้เสียงที่มีผล
- หาก `voice.autoJoin` มีหลายรายการสำหรับกิลด์เดียวกัน OpenClaw จะเข้าร่วมช่องที่กำหนดค่าไว้ล่าสุดสำหรับกิลด์นั้น
- `voice.allowedChannels` เป็น allowlist ถิ่นที่อยู่แบบไม่บังคับ ปล่อยว่างไว้เพื่ออนุญาต `/vc join` เข้าช่องเสียง Discord ที่ได้รับอนุญาตใดก็ได้ เมื่อตั้งค่าแล้ว `/vc join`, การเข้าร่วมอัตโนมัติเมื่อเริ่มต้น และการย้ายสถานะเสียงของบอตจะถูกจำกัดไว้ที่รายการ `{ guildId, channelId }` ที่ระบุ ตั้งเป็นอาร์เรย์ว่างเพื่อปฏิเสธการเข้าร่วมเสียง Discord ทั้งหมด หาก Discord ย้ายบอตออกนอก allowlist OpenClaw จะออกจากช่องนั้นและเข้าร่วมเป้าหมาย auto-join ที่กำหนดค่าไว้อีกครั้งเมื่อมีเป้าหมายพร้อมใช้
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือกการเข้าร่วมของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- OpenClaw ใช้โคเดก `libopus-wasm` ที่บันเดิลมาสำหรับการรับเสียง Discord และการเล่น PCM ดิบแบบเรียลไทม์ โดยมาพร้อมบิลด์ libopus WebAssembly ที่ปักเวอร์ชันไว้ และไม่ต้องใช้ native opus addons
- `voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายาม auto-join ค่าเริ่มต้น: `30000`
- `voice.reconnectGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอให้เซสชันเสียงที่ตัดการเชื่อมต่อเริ่มเชื่อมต่อใหม่ก่อนทำลายเซสชันนั้น ค่าเริ่มต้น: `15000`
- ในโหมด `stt-tts` การเล่นเสียงจะไม่หยุดเพียงเพราะผู้ใช้อีกคนเริ่มพูด เพื่อหลีกเลี่ยงลูปฟีดแบ็ก OpenClaw จะไม่สนใจการจับเสียงใหม่ขณะ TTS กำลังเล่นอยู่; ให้พูดหลังการเล่นเสียงจบเพื่อเริ่มเทิร์นถัดไป โหมดเรียลไทม์ส่งต่อการเริ่มพูดของผู้พูดเป็นสัญญาณแทรกพูดไปยังผู้ให้บริการเรียลไทม์
- ในโหมดเรียลไทม์ เสียงสะท้อนจากลำโพงเข้าสู่ไมค์ที่เปิดอยู่อาจดูเหมือนการแทรกพูดและขัดจังหวะการเล่นเสียง สำหรับห้อง Discord ที่มีเสียงสะท้อนมาก ให้ตั้ง `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` เพื่อป้องกันไม่ให้ OpenAI ขัดจังหวะอัตโนมัติเมื่อมีเสียงอินพุต เพิ่ม `voice.realtime.bargeIn: true` หากคุณยังต้องการให้เหตุการณ์เริ่มพูดของผู้พูด Discord ขัดจังหวะการเล่นเสียงที่ทำงานอยู่ บริดจ์เรียลไทม์ OpenAI จะละเว้นการตัดการเล่นเสียงที่สั้นกว่า `voice.realtime.minBargeInAudioEndMs` โดยถือว่าน่าจะเป็นเสียงสะท้อน/สัญญาณรบกวน และบันทึกเป็นรายการที่ข้าม แทนที่จะล้างการเล่นเสียง Discord
- `voice.captureSilenceGraceMs` ควบคุมระยะเวลาที่ OpenClaw รอหลังจาก Discord รายงานว่าผู้พูดหยุดพูด ก่อนสรุปเซกเมนต์เสียงนั้นสำหรับ STT ค่าเริ่มต้น: `2000`; เพิ่มค่านี้หาก Discord แยกการหยุดตามปกติออกเป็นข้อความถอดเสียงบางส่วนที่ขาดช่วง
- เมื่อ ElevenLabs เป็นผู้ให้บริการ TTS ที่เลือก การเล่นเสียง Discord จะใช้ TTS แบบสตรีมมิงและเริ่มจากสตรีมการตอบกลับของผู้ให้บริการ ผู้ให้บริการที่ไม่รองรับสตรีมมิงจะย้อนกลับไปใช้เส้นทางไฟล์ชั่วคราวที่สังเคราะห์แล้ว
- OpenClaw ยังเฝ้าดูความล้มเหลวในการถอดรหัสฝั่งรับและกู้คืนอัตโนมัติโดยออกจาก/เข้าร่วมช่องเสียงใหม่หลังเกิดความล้มเหลวซ้ำ ๆ ภายในช่วงเวลาสั้น ๆ
- หากบันทึกฝั่งรับแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำ ๆ หลังอัปเดต ให้เก็บรายงาน dependency และบันทึก บรรทัด `@discordjs/voice` ที่บันเดิลมารวมการแก้ไข padding จากต้นน้ำใน discord.js PR #11449 ซึ่งปิด discord.js issue #11419 แล้ว
- เหตุการณ์รับ `The operation was aborted` เป็นสิ่งที่คาดไว้เมื่อ OpenClaw สรุปเซกเมนต์ผู้พูดที่จับไว้; เหตุการณ์เหล่านี้เป็นการวินิจฉัยแบบละเอียด ไม่ใช่คำเตือน
- บันทึกเสียง Discord แบบละเอียดรวมตัวอย่างข้อความถอดเสียง STT หนึ่งบรรทัดแบบจำกัดความยาวสำหรับแต่ละเซกเมนต์ผู้พูดที่ยอมรับ เพื่อให้การดีบักแสดงทั้งฝั่งผู้ใช้และฝั่งคำตอบของเอเจนต์โดยไม่ทิ้งข้อความถอดเสียงแบบไม่จำกัดความยาว
- ในโหมด `agent-proxy` fallback การปรึกษาแบบบังคับจะข้ามชิ้นส่วนข้อความถอดเสียงที่น่าจะยังไม่สมบูรณ์ เช่น ข้อความที่ลงท้ายด้วย `...` หรือตัวเชื่อมท้ายประโยคอย่าง `and` รวมถึงคำปิดท้ายที่ชัดเจนว่าไม่ต้องดำเนินการ เช่น “be right back” หรือ “bye” บันทึกจะแสดง `forced agent consult skipped reason=...` เมื่อสิ่งนี้ป้องกันคำตอบค้างในคิวที่ล้าสมัย

### ติดตามผู้ใช้ในเสียง

ใช้ `voice.followUsers` เมื่อคุณต้องการให้บอตเสียง Discord อยู่กับผู้ใช้ Discord ที่รู้จักหนึ่งคนหรือมากกว่า แทนที่จะเข้าร่วมช่องคงที่เมื่อเริ่มต้นหรือรอ `/vc join`

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

- `followUsers` ยอมรับรหัสผู้ใช้ Discord แบบดิบและค่า `discord:<id>` OpenClaw จะทำให้ทั้งสองรูปแบบเป็นมาตรฐานก่อนจับคู่เหตุการณ์สถานะเสียง
- `followUsersEnabled` มีค่าเริ่มต้นเป็น `true` เมื่อกำหนดค่า `followUsers` ตั้งเป็น `false` เพื่อเก็บรายการที่บันทึกไว้แต่หยุดการติดตามเสียงอัตโนมัติ
- เมื่อผู้ใช้ที่ติดตามเข้าร่วมช่องเสียงที่อนุญาต OpenClaw จะเข้าร่วมช่องนั้น เมื่อผู้ใช้ย้าย OpenClaw จะย้ายตาม เมื่อผู้ใช้ที่ติดตามซึ่งใช้งานอยู่ตัดการเชื่อมต่อ OpenClaw จะออก
- หากมีผู้ใช้ที่ติดตามหลายคนอยู่ในกิลด์เดียวกัน และผู้ใช้ที่ติดตามซึ่งใช้งานอยู่ออกไป OpenClaw จะย้ายไปยังช่องของผู้ใช้ที่ติดตามอีกคนที่ติดตามอยู่ก่อนออกจากกิลด์ หากผู้ใช้ที่ติดตามหลายคนย้ายพร้อมกัน เหตุการณ์สถานะเสียงล่าสุดที่สังเกตได้จะเป็นตัวตัดสิน
- `allowedChannels` ยังคงมีผล ผู้ใช้ที่ติดตามในช่องที่ไม่อนุญาตจะถูกละเว้น และเซสชันที่เป็นของการติดตามจะย้ายไปยังผู้ใช้ที่ติดตามอีกคนหรือออก
- OpenClaw ปรับสภาพเหตุการณ์สถานะเสียงที่พลาดไปเมื่อเริ่มต้นและตามช่วงเวลาที่จำกัด การปรับสภาพจะสุ่มตัวอย่างกิลด์ที่กำหนดค่าไว้และจำกัดการค้นหา REST ต่อรอบ ดังนั้นรายการ `followUsers` ที่ใหญ่มากอาจต้องใช้มากกว่าหนึ่งช่วงเวลาจึงจะบรรจบ
- หาก Discord หรือผู้ดูแลย้ายบอตขณะที่กำลังติดตามผู้ใช้ OpenClaw จะสร้างเซสชันเสียงใหม่และรักษาความเป็นเจ้าของการติดตามไว้เมื่อปลายทางได้รับอนุญาต หากบอตถูกย้ายออกนอก `allowedChannels` OpenClaw จะออกและเข้าร่วมเป้าหมายที่กำหนดค่าไว้อีกครั้งเมื่อมีอยู่
- การกู้คืน DAVE ฝั่งรับอาจออกและเข้าร่วมช่องเดิมอีกครั้งหลังเกิดความล้มเหลวในการถอดรหัสซ้ำ ๆ เซสชันที่เป็นของการติดตามจะรักษาความเป็นเจ้าของการติดตามผ่านเส้นทางกู้คืนนี้ ดังนั้นเมื่อผู้ใช้ที่ติดตามตัดการเชื่อมต่อในภายหลัง ก็ยังออกจากช่องได้

เลือกระหว่างโหมดเข้าร่วม:

- ใช้ `followUsers` สำหรับการตั้งค่าส่วนตัวหรือผู้ปฏิบัติการที่บอตควรอยู่ในเสียงโดยอัตโนมัติเมื่อคุณอยู่
- ใช้ `autoJoin` สำหรับบอตประจำห้องที่ควรอยู่แม้ไม่มีผู้ใช้ที่ติดตามอยู่ในเสียง
- ใช้ `/vc join` สำหรับการเข้าร่วมครั้งเดียวหรือห้องที่การอยู่ในเสียงโดยอัตโนมัติอาจทำให้ประหลาดใจ

โคเดกเสียง Discord:

- บันทึกการรับเสียงแสดง `discord voice: opus decoder: libopus-wasm`.
- การเล่นกลับแบบเรียลไทม์เข้ารหัส PCM สเตอริโอดิบ 48 kHz เป็น Opus ด้วยแพ็กเกจ `libopus-wasm` ที่บันเดิลเดียวกัน ก่อนส่งแพ็กเก็ตให้ `@discordjs/voice`.
- การเล่นกลับจากไฟล์และสตรีมของผู้ให้บริการแปลงรหัสเป็น PCM สเตอริโอดิบ 48 kHz ด้วย ffmpeg แล้วใช้ `libopus-wasm` สำหรับสตรีมแพ็กเก็ต Opus ที่ส่งไปยัง Discord.

ไปป์ไลน์ STT ร่วมกับ TTS:

- การจับเสียง PCM ของ Discord ถูกแปลงเป็นไฟล์ชั่วคราว WAV.
- `tools.media.audio` จัดการ STT เช่น `openai/gpt-4o-mini-transcribe`.
- ทรานสคริปต์ถูกส่งผ่านขาเข้าของ Discord และการกำหนดเส้นทาง ขณะที่ LLM สำหรับการตอบกลับทำงานด้วยนโยบายเอาต์พุตเสียงที่ซ่อนเครื่องมือ `tts` ของเอเจนต์และขอให้ส่งคืนข้อความ เพราะเสียงของ Discord เป็นเจ้าของการเล่นกลับ TTS ขั้นสุดท้าย.
- เมื่อตั้งค่า `voice.model` จะเขียนทับเฉพาะ LLM สำหรับการตอบกลับของเทิร์นช่องเสียงนี้.
- `voice.tts` ถูกผสานทับ `messages.tts`; ผู้ให้บริการที่รองรับการสตรีมจะป้อนข้อมูลให้ตัวเล่นโดยตรง มิฉะนั้นไฟล์เสียงที่ได้จะถูกเล่นในช่องที่เข้าร่วมอยู่.

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

เมื่อไม่มีบล็อก `voice.agentSession` แต่ละช่องเสียงจะมีเซสชัน OpenClaw ที่กำหนดเส้นทางเอง ตัวอย่างเช่น `/vc join channel:234567890123456789` จะคุยกับเซสชันของช่องเสียง Discord นั้น โมเดลเรียลไทม์เป็นเพียงส่วนหน้าด้านเสียงเท่านั้น คำขอที่มีสาระสำคัญจะถูกส่งต่อให้เอเจนต์ OpenClaw ที่กำหนดค่าไว้ หากโมเดลเรียลไทม์สร้างทรานสคริปต์สุดท้ายโดยไม่เรียกเครื่องมือปรึกษา OpenClaw จะบังคับให้ปรึกษาเป็น fallback เพื่อให้ค่าเริ่มต้นยังคงทำงานเหมือนการคุยกับเอเจนต์.

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

ตัวอย่าง bidi เรียลไทม์:

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

ในโหมด `agent-proxy` บอตจะเข้าร่วมช่องเสียงที่กำหนดค่าไว้ แต่เทิร์นของเอเจนต์ OpenClaw จะใช้เซสชันและเอเจนต์ที่กำหนดเส้นทางตามปกติของช่องเป้าหมาย เซสชันเสียงเรียลไทม์จะพูดผลลัพธ์ที่ส่งคืนกลับเข้าไปในช่องเสียง เอเจนต์ผู้ควบคุมยังคงใช้เครื่องมือข้อความปกติได้ตามนโยบายเครื่องมือของตน รวมถึงการส่งข้อความ Discord แยกต่างหากหากนั่นคือการกระทำที่เหมาะสม.

ขณะที่การรัน OpenClaw ที่มอบหมายงานไว้กำลังทำงานอยู่ ทรานสคริปต์เสียง Discord ใหม่จะถูกถือเป็นการควบคุมการรันสดก่อนเริ่มเทิร์นเอเจนต์อีกครั้ง วลีอย่างเช่น "status", "cancel that", "use the smaller fix" หรือ "when you're done also check tests" จะถูกจำแนกเป็นสถานะ ยกเลิก การชี้นำ หรืออินพุตติดตามผลสำหรับเซสชันที่กำลังทำงานอยู่ ผลลัพธ์ของสถานะ ยกเลิก การชี้นำที่ยอมรับแล้ว และการติดตามผลจะถูกพูดกลับเข้าไปในช่องเสียง เพื่อให้ผู้เรียกรู้ว่า OpenClaw จัดการคำขอแล้วหรือไม่.

รูปแบบเป้าหมายที่มีประโยชน์:

- `target: "channel:123456789012345678"` กำหนดเส้นทางผ่านเซสชันช่องข้อความ Discord.
- `target: "123456789012345678"` จะถูกถือเป็นเป้าหมายช่อง.
- `target: "dm:123456789012345678"` หรือ `target: "user:123456789012345678"` กำหนดเส้นทางผ่านเซสชันข้อความโดยตรงนั้น.

ตัวอย่าง OpenAI Realtime ที่มีเอคโคมาก:

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

ใช้สิ่งนี้เมื่อโมเดลได้ยินเสียงเล่นกลับ Discord ของตัวเองผ่านไมค์ที่เปิดอยู่ แต่คุณยังต้องการขัดจังหวะด้วยการพูด OpenClaw ป้องกันไม่ให้ OpenAI ขัดจังหวะอัตโนมัติจากเสียงอินพุตดิบ ขณะที่ `bargeIn: true` ทำให้เหตุการณ์เริ่มพูดของผู้พูด Discord และเสียงผู้พูดที่กำลังใช้งานอยู่แล้วยกเลิกการตอบกลับเรียลไทม์ที่กำลังทำงาน ก่อนที่เทิร์นที่จับเสียงถัดไปจะไปถึง OpenAI สัญญาณ barge-in ที่เร็วมากซึ่งมี `audioEndMs` ต่ำกว่า `minBargeInAudioEndMs` จะถูกถือว่าน่าจะเป็นเอคโค/สัญญาณรบกวนและถูกละเว้น เพื่อไม่ให้โมเดลตัดเสียงตั้งแต่เฟรมการเล่นกลับแรก.

บันทึกเสียงที่คาดไว้:

- เมื่อเข้าร่วม: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- เมื่อเริ่มเรียลไทม์: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- เมื่อมีเสียงผู้พูด: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` และ `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- เมื่อข้ามคำพูดเก่าที่ค้างอยู่: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` หรือ `reason=non-actionable-closing ...`
- เมื่อการตอบกลับเรียลไทม์เสร็จสมบูรณ์: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- เมื่อการเล่นกลับหยุด/รีเซ็ต: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- เมื่อปรึกษาแบบเรียลไทม์: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- เมื่อเอเจนต์ตอบ: `discord voice: agent turn answer ...`
- เมื่อจัดคิวคำพูดตรงตามต้นฉบับ: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...` ตามด้วย `discord voice: realtime exact speech dequeued reason=player-idle ...`
- เมื่อตรวจพบ barge-in: `discord voice: realtime barge-in detected source=speaker-start ...` หรือ `discord voice: realtime barge-in detected source=active-speaker-audio ...` ตามด้วย `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- เมื่อมีการขัดจังหวะแบบเรียลไทม์: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in` ตามด้วย `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` หรือ `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- เมื่อเอคโค/สัญญาณรบกวนถูกละเว้น: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- เมื่อ barge-in ถูกปิดใช้งาน: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- เมื่อการเล่นกลับว่างอยู่: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

หากต้องการดีบักเสียงที่ถูกตัด ให้อ่านบันทึกเสียงเรียลไทม์เป็นไทม์ไลน์:

1. `realtime audio playback started` หมายความว่า Discord เริ่มเล่นเสียงผู้ช่วยแล้ว บริดจ์จะเริ่มนับชังก์เอาต์พุตของผู้ช่วย ไบต์ PCM ของ Discord ไบต์เรียลไทม์ของผู้ให้บริการ และระยะเวลาเสียงที่สังเคราะห์จากจุดนี้.
2. `realtime speaker turn opened` ทำเครื่องหมายว่าผู้พูด Discord เริ่มใช้งาน หากการเล่นกลับทำงานอยู่แล้วและเปิดใช้ `bargeIn` อาจตามด้วย `barge-in detected source=speaker-start`.
3. `realtime input audio started` ทำเครื่องหมายเฟรมเสียงจริงเฟรมแรกที่ได้รับสำหรับเทิร์นผู้พูดนั้น `outputActive=true` หรือ `outputAudioMs` ที่ไม่เป็นศูนย์ตรงนี้หมายความว่าไมค์กำลังส่งอินพุตขณะที่การเล่นกลับของผู้ช่วยยังทำงานอยู่.
4. `barge-in detected source=active-speaker-audio` หมายความว่า OpenClaw เห็นเสียงผู้พูดสดขณะที่การเล่นกลับของผู้ช่วยทำงานอยู่ สิ่งนี้มีประโยชน์สำหรับแยกการขัดจังหวะจริงออกจากเหตุการณ์เริ่มพูดของ Discord ที่ไม่มีเสียงที่มีประโยชน์.
5. `barge-in requested reason=...` หมายความว่า OpenClaw ขอให้ผู้ให้บริการเรียลไทม์ยกเลิกหรือตัดทอนการตอบกลับที่กำลังทำงานอยู่ โดยมี `outputAudioMs`, `outputActive` และ `playbackChunks` เพื่อให้คุณเห็นว่าเสียงผู้ช่วยเล่นไปแล้วมากน้อยเพียงใดก่อนการขัดจังหวะ.
6. `realtime audio playback stopped reason=...` คือจุดรีเซ็ตการเล่นกลับ Discord ภายในเครื่อง เหตุผลบอกว่าใครหยุดการเล่นกลับ: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` หรือ `session-close`.
7. `realtime speaker turn closed` สรุปเทิร์นอินพุตที่จับได้ `chunks=0` หรือ `hasAudio=false` หมายความว่าเทิร์นผู้พูดเปิดขึ้น แต่ไม่มีเสียงที่ใช้ได้ไปถึงบริดจ์เรียลไทม์ `interruptedPlayback=true` หมายความว่าเทิร์นอินพุตนั้นซ้อนทับกับเอาต์พุตผู้ช่วยและทริกเกอร์ตรรกะ barge-in.

ฟิลด์ที่มีประโยชน์:

- `outputAudioMs`: ระยะเวลาเสียงผู้ช่วยที่สร้างโดยผู้ให้บริการเรียลไทม์ก่อนบรรทัดบันทึก.
- `audioMs`: ระยะเวลาเสียงผู้ช่วยที่ OpenClaw นับก่อนการเล่นกลับหยุด.
- `elapsedMs`: เวลาตามนาฬิกาจริงระหว่างการเปิดและปิดสตรีมการเล่นกลับหรือเทิร์นผู้พูด.
- `discordBytes`: ไบต์ PCM สเตอริโอ 48 kHz ที่ส่งไปยังหรือรับจากเสียง Discord.
- `realtimeBytes`: ไบต์ PCM รูปแบบผู้ให้บริการที่ส่งไปยังหรือรับจากผู้ให้บริการเรียลไทม์.
- `playbackChunks`: ชังก์เสียงผู้ช่วยที่ส่งต่อไปยัง Discord สำหรับการตอบกลับที่กำลังทำงานอยู่.
- `sinceLastAudioMs`: ช่องว่างระหว่างเฟรมเสียงผู้พูดที่จับได้ล่าสุดกับการปิดเทิร์นผู้พูด.

รูปแบบที่พบบ่อย:

- การตัดเสียงทันทีพร้อม `source=active-speaker-audio`, `outputAudioMs` เล็ก และผู้ใช้คนเดียวกันอยู่ใกล้ ๆ มักชี้ว่าเอคโคจากลำโพงเข้าไมค์ เพิ่ม `voice.realtime.minBargeInAudioEndMs`, ลดระดับเสียงลำโพง, ใช้หูฟัง หรือกำหนด `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` ตามด้วย `speaker turn closed ... hasAudio=false` หมายความว่า Discord รายงานการเริ่มพูด แต่ไม่มีเสียงไปถึง OpenClaw นั่นอาจเป็นเหตุการณ์เสียง Discord ชั่วคราว พฤติกรรม noise gate หรือไคลเอนต์กดไมค์ชั่วขณะ.
- `audio playback stopped reason=stream-close` โดยไม่มี barge-in หรือ `provider-clear-audio` ใกล้เคียง หมายความว่าสตรีมการเล่นกลับ Discord ภายในเครื่องสิ้นสุดโดยไม่คาดคิด ตรวจสอบบันทึกของผู้ให้บริการและตัวเล่น Discord ก่อนหน้า.
- `capture ignored during playback (barge-in disabled)` หมายความว่า OpenClaw จงใจทิ้งอินพุตขณะที่เสียงผู้ช่วยกำลังทำงาน เปิดใช้ `voice.realtime.bargeIn` หากคุณต้องการให้คำพูดขัดจังหวะการเล่นกลับ.
- `barge-in ignored ... outputActive=false` หมายความว่า Discord หรือ VAD ของผู้ให้บริการรายงานคำพูด แต่ OpenClaw ไม่มีการเล่นกลับที่กำลังทำงานอยู่ให้ขัดจังหวะ สิ่งนี้ไม่ควรตัดเสียง.

ข้อมูลประจำตัวจะถูกแก้ไขแยกตามคอมโพเนนต์: การยืนยันตัวตนเส้นทาง LLM สำหรับ `voice.model`, การยืนยันตัวตน STT สำหรับ `tools.media.audio`, การยืนยันตัวตน TTS สำหรับ `messages.tts`/`voice.tts` และการยืนยันตัวตนผู้ให้บริการเรียลไทม์สำหรับ `voice.realtime.providers` หรือการกำหนดค่าการยืนยันตัวตนปกติของผู้ให้บริการ.

### ข้อความเสียง

ข้อความเสียง Discord แสดงตัวอย่างรูปคลื่นและต้องใช้เสียง OGG/Opus OpenClaw สร้างรูปคลื่นให้อัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ Gateway เพื่อตรวจสอบและแปลง.

- ระบุ **พาธไฟล์ในเครื่อง** (URL จะถูกปฏิเสธ)
- ไม่ต้องใส่เนื้อหาข้อความ (Discord ปฏิเสธข้อความ + ข้อความเสียงใน payload เดียวกัน)
- ยอมรับรูปแบบเสียงใดก็ได้ OpenClaw จะแปลงเป็น OGG/Opus ตามต้องการ

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ใช้งาน intents ที่ไม่อนุญาต หรือบอตไม่เห็นข้อความ guild">

    - เปิดใช้ Message Content Intent
    - เปิดใช้ Server Members Intent เมื่อคุณพึ่งพาการระบุผู้ใช้/สมาชิก
    - รีสตาร์ท gateway หลังจากเปลี่ยน intents

  </Accordion>

  <Accordion title="ข้อความ guild ถูกบล็อกโดยไม่คาดคิด">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบ allowlist ของ guild ใต้ `channels.discord.guilds`
    - ถ้ามีแมป `channels` ของ guild อยู่ จะอนุญาตเฉพาะช่องที่ระบุไว้เท่านั้น
    - ตรวจสอบพฤติกรรม `requireMention` และรูปแบบ mention

    การตรวจสอบที่มีประโยชน์:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention เป็น false แต่ยังถูกบล็อก">
    สาเหตุที่พบบ่อย:

    - `groupPolicy="allowlist"` โดยไม่มี allowlist ของ guild/channel ที่ตรงกัน
    - กำหนดค่า `requireMention` ผิดตำแหน่ง (ต้องอยู่ใต้ `channels.discord.guilds` หรือรายการ channel)
    - ผู้ส่งถูกบล็อกโดย allowlist ของ guild/channel `users`

  </Accordion>

  <Accordion title="เทิร์น Discord ที่ใช้เวลานานหรือการตอบกลับซ้ำ">

    ล็อกทั่วไป:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    knobs ของคิว Discord gateway:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ค่านี้ควบคุมเฉพาะงาน listener ของ Discord gateway ไม่ใช่อายุของเทิร์น agent

    Discord ไม่ได้ใช้ timeout ที่ channel เป็นเจ้าของกับเทิร์น agent ที่เข้าคิวอยู่ Message listeners จะส่งต่อทันที และการรัน Discord ที่เข้าคิวจะรักษาลำดับต่อ session ไว้จนกว่า lifecycle ของ session/tool/runtime จะเสร็จสิ้นหรือยกเลิกงาน

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

  <Accordion title="คำเตือน timeout ในการค้นหา metadata ของ Gateway">
    OpenClaw ดึง metadata `/gateway/bot` ของ Discord ก่อนเชื่อมต่อ ความล้มเหลวชั่วคราวจะ fallback ไปยัง URL gateway เริ่มต้นของ Discord และถูกจำกัดอัตราในล็อก

    knobs ของ metadata timeout:

    - บัญชีเดียว: `channels.discord.gatewayInfoTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env fallback เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - ค่าเริ่มต้น: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="Gateway รีสตาร์ทเพราะ READY timeout">
    OpenClaw รอเหตุการณ์ `READY` ของ Discord gateway ระหว่าง startup และหลังจาก runtime reconnects การตั้งค่าหลายบัญชีที่มีการเหลื่อมเวลา startup อาจต้องใช้หน้าต่าง READY ตอน startup ที่ยาวกว่าค่าเริ่มต้น

    knobs ของ READY timeout:

    - startup บัญชีเดียว: `channels.discord.gatewayReadyTimeoutMs`
    - startup หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - startup env fallback เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นของ startup: `15000` (15 วินาที), สูงสุด: `120000`
    - runtime บัญชีเดียว: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime หลายบัญชี: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - runtime env fallback เมื่อไม่ได้ตั้งค่า config: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ค่าเริ่มต้นของ runtime: `30000` (30 วินาที), สูงสุด: `120000`

  </Accordion>

  <Accordion title="ผล audit สิทธิ์ไม่ตรงกัน">
    การตรวจสอบสิทธิ์ `channels status --probe` ใช้ได้เฉพาะกับ ID channel แบบตัวเลขเท่านั้น

    ถ้าคุณใช้คีย์ slug การจับคู่ของ runtime ยังทำงานได้ แต่ probe ไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน

  </Accordion>

  <Accordion title="ปัญหา DM และการจับคู่">

    - ปิดใช้ DM: `channels.discord.dm.enabled=false`
    - ปิดใช้นโยบาย DM: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - กำลังรอการอนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูปบอตถึงบอต">
    โดยค่าเริ่มต้น ข้อความที่บอตเป็นผู้เขียนจะถูกละเว้น

    ถ้าคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎ mention และ allowlist ที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมลูป
    แนะนำให้ใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความบอตที่ mention บอตเท่านั้น

    OpenClaw ยังมาพร้อม [การป้องกันลูปบอต](/th/channels/bot-loop-protection) แบบแชร์ เมื่อใดก็ตามที่ `allowBots` อนุญาตให้ข้อความที่บอตเป็นผู้เขียนไปถึง dispatch, Discord จะแมปเหตุการณ์ขาเข้าเป็นข้อเท็จจริง `(account, channel, bot pair)` และตัวป้องกันคู่แบบทั่วไปจะระงับคู่นั้นหลังจากข้ามงบประมาณเหตุการณ์ที่กำหนดไว้ ตัวป้องกันนี้ป้องกันลูปสองบอตที่วิ่งไม่หยุด ซึ่งก่อนหน้านี้ต้องหยุดด้วย rate limits ของ Discord; ไม่กระทบกับการ deploy แบบบอตเดียวหรือการตอบกลับของบอตแบบครั้งเดียวที่ยังอยู่ใต้งบประมาณ

    การตั้งค่าเริ่มต้น (ใช้งานเมื่อมีการตั้งค่า `allowBots`):

    - `maxEventsPerWindow: 20` -- คู่บอตสามารถแลกเปลี่ยน 20 ข้อความภายในหน้าต่างเลื่อน
    - `windowSeconds: 60` -- ความยาวของหน้าต่างเลื่อน
    - `cooldownSeconds: 60` -- เมื่อใช้งบประมาณถึงขีดจำกัด ข้อความบอตถึงบอตเพิ่มเติมทุกข้อความในทั้งสองทิศทางจะถูกทิ้งเป็นเวลาหนึ่งนาที

    กำหนดค่าเริ่มต้นแบบแชร์หนึ่งครั้งใต้ `channels.defaults.botLoopProtection` แล้ว override Discord เมื่อ workflow ที่ถูกต้องต้องการพื้นที่เพิ่มขึ้น ลำดับความสำคัญคือ:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - ค่าเริ่มต้นในตัว

    Discord ใช้คีย์ทั่วไป `maxEventsPerWindow`, `windowSeconds`, และ `cooldownSeconds`

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

  <Accordion title="Voice STT หลุดพร้อม DecryptionFailed(...)">

    - รักษา OpenClaw ให้เป็นปัจจุบัน (`openclaw update`) เพื่อให้มีตรรกะการกู้คืนการรับเสียงของ Discord
    - ยืนยัน `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้น upstream) และปรับเฉพาะเมื่อจำเป็น
    - เฝ้าดูล็อกสำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - ถ้าความล้มเหลวยังดำเนินต่อหลังจาก rejoin อัตโนมัติ ให้รวบรวมล็อกและเปรียบเทียบกับประวัติการรับ DAVE upstream ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) และ [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Discord](/th/gateway/config-channels#discord)

<Accordion title="ฟิลด์ Discord ที่มีสัญญาณสูง">

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- command: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout` (งบประมาณ listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- reply/history: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legacy: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb` (จำกัดการอัปโหลดขาออกของ Discord, ค่าเริ่มต้น `100MB`), `retry`
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- features: `threadBindings`, top-level `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการปฏิบัติการ

- ถือว่าโทเค็นบอตเป็นความลับ (แนะนำ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการกำกับดูแล)
- ให้สิทธิ์ Discord เท่าที่จำเป็นน้อยที่สุด
- ถ้า command deploy/state ค้าง ให้รีสตาร์ท gateway และตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Discord กับ gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรม group chat และ allowlist
  </Card>
  <Card title="การกำหนดเส้นทาง channel" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยัง agents
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    Threat model และการ hardening
  </Card>
  <Card title="การกำหนดเส้นทางหลาย agent" icon="sitemap" href="/th/concepts/multi-agent">
    แมป guilds และ channels ไปยัง agents
  </Card>
  <Card title="คำสั่ง slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่ง native
  </Card>
</CardGroup>
