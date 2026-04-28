---
read_when:
    - การตั้งค่าช่องทาง BlueBubbles
    - การแก้ไขปัญหาการจับคู่ Webhook
    - การกำหนดค่า iMessage บน macOS
sidebarTitle: BlueBubbles
summary: iMessage ผ่านเซิร์ฟเวอร์ macOS ของ BlueBubbles (การส่ง/รับผ่าน REST, การพิมพ์, รีแอ็กชัน, การจับคู่, การดำเนินการขั้นสูง)
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-26T11:22:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a9eef02110f9e40f60c0bbd413c7ad7e33c377a7cf9ca2ae43aa170100ff77
    source_path: channels/bluebubbles.md
    workflow: 15
---

สถานะ: Plugin ที่มากับระบบซึ่งสื่อสารกับเซิร์ฟเวอร์ macOS ของ BlueBubbles ผ่าน HTTP **แนะนำสำหรับการเชื่อมต่อ iMessage** เนื่องจากมี API ที่สมบูรณ์กว่าและตั้งค่าได้ง่ายกว่าเมื่อเทียบกับช่องทาง imsg แบบเดิม

<Note>
OpenClaw รุ่นปัจจุบันรวม BlueBubbles มาให้แล้ว ดังนั้นบิลด์แบบแพ็กเกจปกติจึงไม่ต้องมีขั้นตอน `openclaw plugins install` แยกต่างหาก
</Note>

## ภาพรวม

- ทำงานบน macOS ผ่านแอปตัวช่วยของ BlueBubbles ([bluebubbles.app](https://bluebubbles.app))
- แนะนำ/ทดสอบแล้ว: macOS Sequoia (15) ใช้งานได้บน macOS Tahoe (26); ขณะนี้การแก้ไขข้อความยังใช้งานไม่ได้บน Tahoe และการอัปเดตไอคอนกลุ่มอาจรายงานว่าสำเร็จแต่ไม่ซิงก์
- OpenClaw สื่อสารกับมันผ่าน REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`)
- ข้อความขาเข้ามาถึงผ่าน Webhook; การตอบกลับขาออก, ตัวบ่งชี้การพิมพ์, ใบตอบรับการอ่าน, และ tapback ใช้การเรียก REST
- ไฟล์แนบและสติกเกอร์จะถูกนำเข้าเป็นสื่อขาเข้า (และส่งต่อให้เอเจนต์เมื่อเป็นไปได้)
- การตอบกลับ Auto-TTS ที่สังเคราะห์เสียงเป็น MP3 หรือ CAF จะถูกส่งเป็นบับเบิลวอยซ์เมโมของ iMessage แทนไฟล์แนบธรรมดา
- การจับคู่/allowlist ทำงานเหมือนกับช่องทางอื่น (`/channels/pairing` เป็นต้น) โดยใช้ `channels.bluebubbles.allowFrom` + โค้ดการจับคู่
- รีแอ็กชันจะแสดงเป็นเหตุการณ์ของระบบเช่นเดียวกับ Slack/Telegram เพื่อให้เอเจนต์สามารถ "กล่าวถึง" รีแอ็กชันเหล่านั้นก่อนตอบกลับ
- ความสามารถขั้นสูง: แก้ไข, ยกเลิกการส่ง, เธรดการตอบกลับ, เอฟเฟกต์ข้อความ, การจัดการกลุ่ม

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง BlueBubbles">
    ติดตั้งเซิร์ฟเวอร์ BlueBubbles บน Mac ของคุณ (ทำตามคำแนะนำที่ [bluebubbles.app/install](https://bluebubbles.app/install))
  </Step>
  <Step title="เปิดใช้งาน web API">
    ในการตั้งค่า BlueBubbles ให้เปิดใช้งาน web API และตั้งรหัสผ่าน
  </Step>
  <Step title="กำหนดค่า OpenClaw">
    รัน `openclaw onboard` แล้วเลือก BlueBubbles หรือกำหนดค่าเองด้วยตนเอง:

    ```json5
    {
      channels: {
        bluebubbles: {
          enabled: true,
          serverUrl: "http://192.168.1.100:1234",
          password: "example-password",
          webhookPath: "/bluebubbles-webhook",
        },
      },
    }
    ```

  </Step>
  <Step title="ชี้ Webhook ไปยัง gateway">
    ชี้ Webhook ของ BlueBubbles ไปยัง gateway ของคุณ (ตัวอย่าง: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)
  </Step>
  <Step title="เริ่มต้น gateway">
    เริ่มต้น gateway; มันจะลงทะเบียนตัวจัดการ Webhook และเริ่มการจับคู่
  </Step>
</Steps>

<Warning>
**ความปลอดภัย**

- ตั้งรหัสผ่านสำหรับ Webhook เสมอ
- ต้องมีการยืนยันตัวตนของ Webhook ทุกครั้ง OpenClaw จะปฏิเสธคำขอ Webhook ของ BlueBubbles หากไม่มี password/guid ที่ตรงกับ `channels.bluebubbles.password` (เช่น `?password=<password>` หรือ `x-password`) โดยไม่ขึ้นกับโทโพโลยีของ loopback/proxy
- ระบบจะตรวจสอบการยืนยันตัวตนด้วยรหัสผ่านก่อนอ่าน/แยกวิเคราะห์เนื้อหา Webhook แบบเต็ม

</Warning>

## การทำให้ Messages.app ทำงานอยู่เสมอ (การตั้งค่า VM / headless)

ในการตั้งค่า macOS VM / always-on บางแบบ อาจเกิดกรณีที่ Messages.app เข้าสู่สถานะ "idle" (เหตุการณ์ขาเข้าหยุดจนกว่าจะเปิดแอป/นำแอปขึ้นเบื้องหน้า) วิธีแก้ง่าย ๆ คือ **กระตุ้น Messages ทุก 5 นาที** โดยใช้ AppleScript + LaunchAgent

<Steps>
  <Step title="บันทึก AppleScript">
    บันทึกสิ่งนี้เป็น `~/Scripts/poke-messages.scpt`:

    ```applescript
    try
      tell application "Messages"
        if not running then
          launch
        end if

        -- Touch the scripting interface to keep the process responsive.
        set _chatCount to (count of chats)
      end tell
    on error
      -- Ignore transient failures (first-run prompts, locked session, etc).
    end try
    ```

  </Step>
  <Step title="ติดตั้ง LaunchAgent">
    บันทึกสิ่งนี้เป็น `~/Library/LaunchAgents/com.user.poke-messages.plist`:

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>Label</key>
        <string>com.user.poke-messages</string>

        <key>ProgramArguments</key>
        <array>
          <string>/bin/bash</string>
          <string>-lc</string>
          <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
        </array>

        <key>RunAtLoad</key>
        <true/>

        <key>StartInterval</key>
        <integer>300</integer>

        <key>StandardOutPath</key>
        <string>/tmp/poke-messages.log</string>
        <key>StandardErrorPath</key>
        <string>/tmp/poke-messages.err</string>
      </dict>
    </plist>
    ```

    การตั้งค่านี้จะรัน **ทุก 300 วินาที** และ **เมื่อเข้าสู่ระบบ** การรันครั้งแรกอาจทำให้ macOS แสดงพรอมป์ **Automation** (`osascript` → Messages) ให้อนุมัติในเซสชันผู้ใช้เดียวกันกับที่รัน LaunchAgent

  </Step>
  <Step title="โหลดมัน">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## การเริ่มต้นใช้งาน

BlueBubbles พร้อมใช้งานในการตั้งค่าแบบโต้ตอบ:

```
openclaw onboard
```

วิซาร์ดจะถามข้อมูลดังนี้:

<ParamField path="Server URL" type="string" required>
  ที่อยู่เซิร์ฟเวอร์ BlueBubbles (เช่น `http://192.168.1.100:1234`)
</ParamField>
<ParamField path="Password" type="string" required>
  รหัสผ่าน API จากการตั้งค่า BlueBubbles Server
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  พาธปลายทาง Webhook
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open`, หรือ `disabled`
</ParamField>
<ParamField path="Allow list" type="string[]">
  หมายเลขโทรศัพท์ อีเมล หรือเป้าหมายแชต
</ParamField>

คุณยังสามารถเพิ่ม BlueBubbles ผ่าน CLI ได้เช่นกัน:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

<Tabs>
  <Tab title="DMs">
    - ค่าเริ่มต้น: `channels.bluebubbles.dmPolicy = "pairing"`
    - ผู้ส่งที่ไม่รู้จักจะได้รับโค้ดการจับคู่; ข้อความจะถูกเพิกเฉยจนกว่าจะได้รับการอนุมัติ (โค้ดหมดอายุภายใน 1 ชั่วโมง)
    - อนุมัติผ่าน:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - การจับคู่คือการแลกเปลี่ยนโทเค็นเริ่มต้น รายละเอียด: [การจับคู่](/th/channels/pairing)

  </Tab>
  <Tab title="กลุ่ม">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`)
    - `channels.bluebubbles.groupAllowFrom` ควบคุมว่าใครสามารถทริกเกอร์ในกลุ่มได้เมื่อกำหนด `allowlist`

  </Tab>
</Tabs>

### การเติมชื่อผู้ติดต่อให้สมบูรณ์ (macOS, ไม่บังคับ)

Webhook กลุ่มของ BlueBubbles มักมีเพียงที่อยู่ผู้เข้าร่วมแบบดิบเท่านั้น หากคุณต้องการให้บริบท `GroupMembers` แสดงชื่อผู้ติดต่อในเครื่องแทน คุณสามารถเลือกเปิดการเติมข้อมูลจาก Contacts ในเครื่องบน macOS ได้:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` เปิดใช้งานการค้นหา ค่าเริ่มต้น: `false`
- การค้นหาจะทำงานหลังจากที่การเข้าถึงกลุ่ม การอนุญาตคำสั่ง และ mention gating อนุญาตให้ข้อความผ่านแล้วเท่านั้น
- จะเติมข้อมูลเฉพาะผู้เข้าร่วมที่เป็นหมายเลขโทรศัพท์และยังไม่มีชื่อเท่านั้น
- หมายเลขโทรศัพท์ดิบจะยังคงใช้เป็นค่าทดแทนเมื่อไม่พบข้อมูลที่ตรงกันในเครื่อง

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Mention gating (กลุ่ม)

BlueBubbles รองรับ mention gating สำหรับแชตกลุ่ม โดยทำงานสอดคล้องกับพฤติกรรมของ iMessage/WhatsApp:

- ใช้ `agents.list[].groupChat.mentionPatterns` (หรือ `messages.groupChat.mentionPatterns`) เพื่อตรวจจับการกล่าวถึง
- เมื่อเปิดใช้ `requireMention` สำหรับกลุ่ม เอเจนต์จะตอบกลับเมื่อถูกกล่าวถึงเท่านั้น
- คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตจะข้าม mention gating ได้

การกำหนดค่ารายกลุ่ม:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // ค่าเริ่มต้นสำหรับทุกกลุ่ม
        "iMessage;-;chat123": { requireMention: false }, // แทนที่สำหรับกลุ่มเฉพาะ
      },
    },
  },
}
```

### Command gating

- คำสั่งควบคุม (เช่น `/config`, `/model`) ต้องได้รับการอนุญาต
- ใช้ `allowFrom` และ `groupAllowFrom` เพื่อตัดสินการอนุญาตคำสั่ง
- ผู้ส่งที่ได้รับอนุญาตสามารถรันคำสั่งควบคุมได้แม้ไม่ได้กล่าวถึงในกลุ่ม

### system prompt รายกลุ่ม

แต่ละรายการภายใต้ `channels.bluebubbles.groups.*` รองรับสตริง `systemPrompt` แบบไม่บังคับ ค่าในฟิลด์นี้จะถูกแทรกเข้าไปใน system prompt ของเอเจนต์ทุกครั้งที่จัดการข้อความในกลุ่มนั้น ดังนั้นคุณจึงกำหนดบุคลิกหรือกฎพฤติกรรมรายกลุ่มได้โดยไม่ต้องแก้ไข prompt ของเอเจนต์:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "ให้ตอบไม่เกิน 3 ประโยค ใช้น้ำเสียงสบาย ๆ ให้สอดคล้องกับกลุ่ม",
        },
      },
    },
  },
}
```

คีย์นี้จะตรงกับค่าที่ BlueBubbles รายงานเป็น `chatGuid` / `chatIdentifier` / `chatId` แบบตัวเลขสำหรับกลุ่มนั้น และรายการไวลด์การ์ด `"*"` จะใช้เป็นค่าเริ่มต้นสำหรับทุกกลุ่มที่ไม่มีรายการตรงกันแบบเป๊ะ (รูปแบบเดียวกับที่ใช้โดย `requireMention` และนโยบายเครื่องมือรายกลุ่ม) รายการที่ตรงกันแบบเป๊ะจะมีสิทธิ์เหนือกว่าไวลด์การ์ดเสมอ DM จะไม่ใช้ฟิลด์นี้; ให้ใช้การปรับแต่ง prompt ระดับเอเจนต์หรือระดับบัญชีแทน

#### ตัวอย่างการใช้งานจริง: การตอบกลับแบบเธรดและรีแอ็กชัน tapback (Private API)

เมื่อเปิดใช้งาน BlueBubbles Private API ข้อความขาเข้าจะมาพร้อมกับรหัสข้อความแบบสั้น (เช่น `[[reply_to:5]]`) และเอเจนต์สามารถเรียก `action=reply` เพื่อเธรดไปยังข้อความที่กำหนด หรือ `action=react` เพื่อส่ง tapback ได้ การใช้ `systemPrompt` รายกลุ่มเป็นวิธีที่เชื่อถือได้ในการทำให้เอเจนต์เลือกใช้เครื่องมือที่ถูกต้อง:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

ทั้งรีแอ็กชัน tapback และการตอบกลับแบบเธรดต้องใช้ BlueBubbles Private API; ดู [การดำเนินการขั้นสูง](#advanced-actions) และ [รหัสข้อความ](#message-ids-short-vs-full) สำหรับกลไกพื้นฐานที่เกี่ยวข้อง

## การผูกการสนทนา ACP

แชต BlueBubbles สามารถเปลี่ยนเป็นเวิร์กสเปซ ACP แบบคงอยู่ได้โดยไม่ต้องเปลี่ยนเลเยอร์การส่งข้อมูล

ขั้นตอนสำหรับโอเปอเรเตอร์แบบรวดเร็ว:

- รัน `/acp spawn codex --bind here` ภายใน DM หรือแชตกลุ่มที่ได้รับอนุญาต
- ข้อความถัดไปในบทสนทนา BlueBubbles เดียวกันนั้นจะถูกส่งต่อไปยังเซสชัน ACP ที่สร้างขึ้น
- `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมในที่เดิม
- `/acp close` จะปิดเซสชัน ACP และลบการผูกนั้นออก

ยังรองรับการผูกแบบคงอยู่ที่กำหนดค่าไว้ผ่านรายการ `bindings[]` ระดับบนสุดพร้อม `type: "acp"` และ `match.channel: "bluebubbles"` ด้วย

`match.peer.id` สามารถใช้รูปแบบเป้าหมาย BlueBubbles ที่รองรับใดก็ได้:

- ตัวจัดการ DM ที่ถูกทำให้เป็นรูปแบบมาตรฐานแล้ว เช่น `+15555550123` หรือ `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

สำหรับการผูกกลุ่มแบบคงที่ แนะนำให้ใช้ `chat_id:*` หรือ `chat_identifier:*`

ตัวอย่าง:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับพฤติกรรมการผูก ACP ที่ใช้ร่วมกัน

## การพิมพ์ + ใบตอบรับการอ่าน

- **ตัวบ่งชี้การพิมพ์**: ส่งโดยอัตโนมัติก่อนและระหว่างการสร้างคำตอบ
- **ใบตอบรับการอ่าน**: ควบคุมโดย `channels.bluebubbles.sendReadReceipts` (ค่าเริ่มต้น: `true`)
- **ตัวบ่งชี้การพิมพ์**: OpenClaw ส่งเหตุการณ์เริ่มพิมพ์; BlueBubbles จะล้างสถานะการพิมพ์โดยอัตโนมัติเมื่อส่งข้อความหรือเมื่อหมดเวลา (การหยุดเองผ่าน DELETE ไม่น่าเชื่อถือ)

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // ปิดใบตอบรับการอ่าน
    },
  },
}
```

## การดำเนินการขั้นสูง

BlueBubbles รองรับการดำเนินการข้อความขั้นสูงเมื่อเปิดใช้งานในการกำหนดค่า:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (ค่าเริ่มต้น: true)
        edit: true, // แก้ไขข้อความที่ส่งแล้ว (macOS 13+, ใช้งานไม่ได้บน macOS 26 Tahoe)
        unsend: true, // ยกเลิกการส่งข้อความ (macOS 13+)
        reply: true, // เธรดการตอบกลับตาม GUID ของข้อความ
        sendWithEffect: true, // เอฟเฟกต์ข้อความ (slam, loud, ฯลฯ)
        renameGroup: true, // เปลี่ยนชื่อแชตกลุ่ม
        setGroupIcon: true, // ตั้งค่าไอคอน/รูปภาพของแชตกลุ่ม (ไม่เสถียรบน macOS 26 Tahoe)
        addParticipant: true, // เพิ่มผู้เข้าร่วมในกลุ่ม
        removeParticipant: true, // ลบผู้เข้าร่วมออกจากกลุ่ม
        leaveGroup: true, // ออกจากแชตกลุ่ม
        sendAttachment: true, // ส่งไฟล์แนบ/สื่อ
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="การดำเนินการที่ใช้ได้">
    - **react**: เพิ่ม/ลบรีแอ็กชัน tapback (`messageId`, `emoji`, `remove`) ชุด tapback แบบเนทีฟของ iMessage คือ `love`, `like`, `dislike`, `laugh`, `emphasize` และ `question` เมื่อเอเจนต์เลือกอีโมจินอกเหนือจากชุดนี้ (เช่น `👀`) เครื่องมือรีแอ็กชันจะ fallback ไปใช้ `love` เพื่อให้ tapback ยังแสดงผลได้แทนที่จะทำให้คำขอทั้งหมดล้มเหลว รีแอ็กชันตอบรับที่กำหนดค่าไว้ยังคงตรวจสอบอย่างเข้มงวดและจะแสดงข้อผิดพลาดหากใช้ค่าที่ไม่รู้จัก
    - **edit**: แก้ไขข้อความที่ส่งแล้ว (`messageId`, `text`)
    - **unsend**: ยกเลิกการส่งข้อความ (`messageId`)
    - **reply**: ตอบกลับข้อความที่ระบุ (`messageId`, `text`, `to`)
    - **sendWithEffect**: ส่งพร้อมเอฟเฟกต์ iMessage (`text`, `to`, `effectId`)
    - **renameGroup**: เปลี่ยนชื่อแชตกลุ่ม (`chatGuid`, `displayName`)
    - **setGroupIcon**: ตั้งค่าไอคอน/รูปภาพของแชตกลุ่ม (`chatGuid`, `media`) — ไม่เสถียรบน macOS 26 Tahoe (API อาจคืนค่าสำเร็จแต่ไอคอนไม่ซิงก์)
    - **addParticipant**: เพิ่มคนเข้าสู่กลุ่ม (`chatGuid`, `address`)
    - **removeParticipant**: ลบคนออกจากกลุ่ม (`chatGuid`, `address`)
    - **leaveGroup**: ออกจากแชตกลุ่ม (`chatGuid`)
    - **upload-file**: ส่งสื่อ/ไฟล์ (`to`, `buffer`, `filename`, `asVoice`)
      - วอยซ์เมโม: ตั้งค่า `asVoice: true` พร้อมไฟล์เสียง **MP3** หรือ **CAF** เพื่อส่งเป็นข้อความเสียง iMessage BlueBubbles จะแปลง MP3 → CAF เมื่อส่งวอยซ์เมโม
    - ชื่อแฝงแบบเดิม: `sendAttachment` ยังใช้งานได้ แต่ `upload-file` คือชื่อการดำเนินการมาตรฐาน

  </Accordion>
</AccordionGroup>

### รหัสข้อความ (แบบสั้นเทียบกับแบบเต็ม)

OpenClaw อาจแสดงรหัสข้อความแบบ _สั้น_ (เช่น `1`, `2`) เพื่อประหยัดโทเค็น

- `MessageSid` / `ReplyToId` อาจเป็นรหัสแบบสั้น
- `MessageSidFull` / `ReplyToIdFull` มีรหัสเต็มของผู้ให้บริการ
- รหัสแบบสั้นอยู่ในหน่วยความจำ; อาจหมดอายุเมื่อรีสตาร์ตหรือเมื่อแคชถูกลบออก
- การดำเนินการรองรับ `messageId` แบบสั้นหรือแบบเต็ม แต่รหัสแบบสั้นจะเกิดข้อผิดพลาดหากไม่พร้อมใช้งานแล้ว

ใช้รหัสแบบเต็มสำหรับงานอัตโนมัติและการจัดเก็บแบบคงทน:

- เทมเพลต: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- บริบท: `MessageSidFull` / `ReplyToIdFull` ใน payload ขาเข้า

ดู [การกำหนดค่า](/th/gateway/configuration) สำหรับตัวแปรเทมเพลต

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## การรวม DM ที่ถูกแยกส่ง (คำสั่ง + URL ในการพิมพ์ครั้งเดียว)

เมื่อผู้ใช้พิมพ์คำสั่งและ URL พร้อมกันใน iMessage — เช่น `Dump https://example.com/article` — Apple จะแยกการส่งออกเป็น **การส่ง Webhook สองครั้งแยกกัน**:

1. ข้อความตัวอักษร (`"Dump"`)
2. บับเบิลตัวอย่าง URL (`"https://..."`) พร้อมภาพตัวอย่าง OG เป็นไฟล์แนบ

Webhook ทั้งสองจะมาถึง OpenClaw ห่างกันประมาณ ~0.8-2.0 วินาทีในสภาพแวดล้อมส่วนใหญ่ หากไม่มีการรวม เอเจนต์จะได้รับเฉพาะคำสั่งในเทิร์นที่ 1 แล้วตอบกลับ (มักเป็น "ส่ง URL มาให้ฉัน") และจะเห็น URL ในเทิร์นที่ 2 เท่านั้น — ซึ่งในตอนนั้นบริบทของคำสั่งได้หายไปแล้ว

`channels.bluebubbles.coalesceSameSenderDms` ใช้เปิด DM ให้รวม Webhook ต่อเนื่องจากผู้ส่งคนเดิมเป็นเอเจนต์เทิร์นเดียว แชตกลุ่มจะยังคงอ้างอิงตามข้อความแต่ละรายการเพื่อคงโครงสร้างเทิร์นของหลายผู้ใช้ไว้

<Tabs>
  <Tab title="เมื่อใดควรเปิดใช้">
    เปิดใช้เมื่อ:

    - คุณมี Skills ที่คาดหวัง `command + payload` ในข้อความเดียว (dump, paste, save, queue, ฯลฯ)
    - ผู้ใช้ของคุณวาง URL รูปภาพ หรือเนื้อหายาวพร้อมกับคำสั่ง
    - คุณยอมรับความหน่วงเพิ่มขึ้นของ DM turn ได้ (ดูด้านล่าง)

    ปล่อยปิดไว้เมื่อ:

    - คุณต้องการความหน่วงต่ำที่สุดสำหรับตัวกระตุ้น DM แบบคำเดียว
    - ทุก flow ของคุณเป็นคำสั่งแบบครั้งเดียวโดยไม่มี payload ตามมา

  </Tab>
  <Tab title="การเปิดใช้">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // เลือกเปิดใช้ (ค่าเริ่มต้น: false)
        },
      },
    }
    ```

    เมื่อเปิดแฟล็กนี้และไม่มี `messages.inbound.byChannel.bluebubbles` ที่กำหนดชัดเจน หน้าต่าง debounce จะขยายเป็น **2500 ms** (ค่าเริ่มต้นสำหรับกรณีไม่รวมคือ 500 ms) จำเป็นต้องใช้หน้าต่างที่กว้างขึ้น — จังหวะ split-send ของ Apple ที่ 0.8-2.0 วินาทีไม่พอดีกับค่าเริ่มต้นที่แคบกว่า

    หากต้องการปรับหน้าต่างด้วยตนเอง:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms ใช้ได้กับสภาพแวดล้อมส่วนใหญ่; เพิ่มเป็น 4000 ms หาก Mac ของคุณช้า
            // หรืออยู่ภายใต้แรงกดดันด้านหน่วยความจำ (พบว่าช่องว่างอาจเกิน 2 วินาทีได้)
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="ข้อแลกเปลี่ยน">
    - **ความหน่วงเพิ่มขึ้นสำหรับคำสั่งควบคุมใน DM** เมื่อเปิดแฟล็กนี้ ข้อความคำสั่งควบคุมใน DM (เช่น `Dump`, `Save` เป็นต้น) จะรอได้สูงสุดเท่าหน้าต่าง debounce ก่อนส่งต่อ เผื่อว่ามี payload webhook ตามมา คำสั่งในแชตกลุ่มยังคงส่งต่อทันที
    - **เอาต์พุตที่ถูกรวมมีขอบเขตจำกัด** — ข้อความที่รวมแล้วจำกัดที่ 4000 อักขระพร้อมเครื่องหมาย `…[truncated]` อย่างชัดเจน; ไฟล์แนบจำกัดที่ 20; รายการต้นทางจำกัดที่ 10 (หากเกินจะเก็บรายการแรกบวกกับรายการล่าสุดไว้) ทุก `messageId` ของต้นทางยังคงถูกส่งไปยัง inbound-dedupe เพื่อให้การ replay จาก MessagePoller ของเหตุการณ์เดี่ยวใด ๆ ในภายหลังยังถูกระบุว่าเป็นรายการซ้ำได้
    - **เลือกเปิดใช้เป็นรายช่องทาง** ช่องทางอื่น (Telegram, WhatsApp, Slack, …) จะไม่ได้รับผลกระทบ

  </Tab>
</Tabs>

### สถานการณ์ตัวอย่างและสิ่งที่เอเจนต์เห็น

| สิ่งที่ผู้ใช้พิมพ์                                                      | สิ่งที่ Apple ส่งมา      | ปิดแฟล็ก (ค่าเริ่มต้น)                   | เปิดแฟล็ก + หน้าต่าง 2500 ms                                              |
| ------------------------------------------------------------------------ | ------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| `Dump https://example.com` (ส่งครั้งเดียว)                               | 2 Webhook ห่างกัน ~1 วินาที | เอเจนต์ 2 เทิร์น: "Dump" เดี่ยว ๆ แล้วค่อยเป็น URL | 1 เทิร์น: ข้อความที่รวมแล้ว `Dump https://example.com`                   |
| `Save this 📎image.jpg caption` (ไฟล์แนบ + ข้อความ)                     | 2 Webhook                 | 2 เทิร์น                                | 1 เทิร์น: ข้อความ + รูปภาพ                                                |
| `/status` (คำสั่งเดี่ยว)                                                | 1 Webhook                 | ส่งต่อทันที                              | **รอได้สูงสุดตามหน้าต่าง แล้วจึงส่งต่อ**                                  |
| วาง URL เพียงอย่างเดียว                                                 | 1 Webhook                 | ส่งต่อทันที                              | ส่งต่อทันที (มีเพียงหนึ่งรายการใน bucket)                                  |
| ข้อความ + URL ที่ส่งเป็นสองข้อความแยกกันโดยตั้งใจ ห่างกันหลายนาที       | 2 Webhook นอกหน้าต่าง     | 2 เทิร์น                                | 2 เทิร์น (หน้าต่างหมดอายุระหว่างสองข้อความ)                               |
| ส่งถี่มากอย่างรวดเร็ว (>10 DM ขนาดเล็กภายในหน้าต่าง)                    | N Webhook                 | N เทิร์น                                 | 1 เทิร์น, เอาต์พุตมีขอบเขตจำกัด (ใช้รายการแรก + ล่าสุด, ใช้เพดานข้อความ/ไฟล์แนบ) |

### การแก้ไขปัญหาการรวม split-send

หากเปิดแฟล็กแล้วแต่ split-send ยังมาถึงเป็นสองเทิร์น ให้ตรวจสอบแต่ละชั้น:

<AccordionGroup>
  <Accordion title="โหลดการกำหนดค่าจริงแล้ว">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    จากนั้น `openclaw gateway restart` — แฟล็กนี้จะถูกอ่านตอนสร้าง debouncer-registry

  </Accordion>
  <Accordion title="หน้าต่าง debounce กว้างพอสำหรับสภาพแวดล้อมของคุณ">
    ดูที่ล็อกเซิร์ฟเวอร์ BlueBubbles ใน `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    วัดช่วงห่างระหว่างการส่งข้อความแบบ `"Dump"` กับการส่ง `"https://..."; Attachments:` ที่ตามมา เพิ่มค่า `messages.inbound.byChannel.bluebubbles` ให้ครอบคลุมช่วงนั้นอย่างสบาย

  </Accordion>
  <Accordion title="timestamp ใน JSONL ของ session ≠ เวลาที่ Webhook มาถึง">
    timestamp ของเหตุการณ์ใน session (`~/.openclaw/agents/<id>/sessions/*.jsonl`) สะท้อนเวลาที่ gateway ส่งข้อความให้เอเจนต์ **ไม่ใช่** เวลาที่ Webhook มาถึง หากข้อความที่สองถูกจัดคิวพร้อมแท็ก `[Queued messages while agent was busy]` แสดงว่าเทิร์นแรกยังประมวลผลอยู่เมื่อ Webhook ที่สองมาถึง — bucket สำหรับการรวมได้ flush ไปแล้ว ปรับหน้าต่างโดยอิงจากล็อกของเซิร์ฟเวอร์ BB ไม่ใช่ล็อกของ session
  </Accordion>
  <Accordion title="แรงกดดันด้านหน่วยความจำทำให้การส่งคำตอบช้าลง">
    บนเครื่องที่เล็กกว่า (8 GB) เทิร์นของเอเจนต์อาจใช้เวลานานจน bucket สำหรับการรวม flush ก่อนที่คำตอบจะเสร็จ และ URL จะกลายเป็นเทิร์นที่สองซึ่งถูกจัดคิว ตรวจสอบ `memory_pressure` และ `ps -o rss -p $(pgrep openclaw-gateway)`; หาก gateway ใช้ RSS เกิน ~500 MB และตัวบีบอัดกำลังทำงาน ให้ปิดโปรเซสหนักอื่น ๆ หรือย้ายไปใช้โฮสต์ที่ใหญ่ขึ้น
  </Accordion>
  <Accordion title="การส่งแบบ reply-quote เป็นอีกเส้นทางหนึ่ง">
    หากผู้ใช้แตะ `Dump` เป็น **การตอบกลับ** ต่อ URL-ballon ที่มีอยู่แล้ว (iMessage จะแสดงป้าย "1 Reply" บนบับเบิล Dump) URL จะอยู่ใน `replyToBody` ไม่ได้อยู่ใน Webhook ตัวที่สอง การรวมจึงไม่เกี่ยวข้อง — นี่เป็นเรื่องของ Skill/prompt ไม่ใช่เรื่องของ debouncer
  </Accordion>
</AccordionGroup>

## การสตรีมแบบบล็อก

ควบคุมว่าจะส่งคำตอบเป็นข้อความเดียวหรือสตรีมเป็นบล็อก:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // เปิดการสตรีมแบบบล็อก (ปิดเป็นค่าเริ่มต้น)
    },
  },
}
```

## สื่อ + ขีดจำกัด

- ไฟล์แนบขาเข้าจะถูกดาวน์โหลดและจัดเก็บไว้ในแคชสื่อ
- จำกัดขนาดสื่อผ่าน `channels.bluebubbles.mediaMaxMb` สำหรับสื่อขาเข้าและขาออก (ค่าเริ่มต้น: 8 MB)
- ข้อความขาออกจะถูกแบ่งเป็นชิ้นตาม `channels.bluebubbles.textChunkLimit` (ค่าเริ่มต้น: 4000 อักขระ)

## เอกสารอ้างอิงการกำหนดค่า

การกำหนดค่าแบบเต็ม: [การกำหนดค่า](/th/gateway/configuration)

<AccordionGroup>
  <Accordion title="การเชื่อมต่อและ Webhook">
    - `channels.bluebubbles.enabled`: เปิด/ปิดช่องทาง
    - `channels.bluebubbles.serverUrl`: URL ฐานของ BlueBubbles REST API
    - `channels.bluebubbles.password`: รหัสผ่าน API
    - `channels.bluebubbles.webhookPath`: พาธปลายทาง Webhook (ค่าเริ่มต้น: `/bluebubbles-webhook`)

  </Accordion>
  <Accordion title="นโยบายการเข้าถึง">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: `pairing`)
    - `channels.bluebubbles.allowFrom`: allowlist สำหรับ DM (handle, อีเมล, หมายเลข E.164, `chat_id:*`, `chat_guid:*`)
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`)
    - `channels.bluebubbles.groupAllowFrom`: allowlist ของผู้ส่งในกลุ่ม
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: บน macOS สามารถเลือกเติมข้อมูลผู้เข้าร่วมกลุ่มที่ไม่มีชื่อจาก Contacts ในเครื่องได้หลังจากผ่าน gating แล้ว ค่าเริ่มต้น: `false`
    - `channels.bluebubbles.groups`: การกำหนดค่ารายกลุ่ม (`requireMention` เป็นต้น)

  </Accordion>
  <Accordion title="การส่งและการแบ่งข้อความ">
    - `channels.bluebubbles.sendReadReceipts`: ส่งใบตอบรับการอ่าน (ค่าเริ่มต้น: `true`)
    - `channels.bluebubbles.blockStreaming`: เปิดใช้การสตรีมแบบบล็อก (ค่าเริ่มต้น: `false`; จำเป็นสำหรับการตอบกลับแบบสตรีม)
    - `channels.bluebubbles.textChunkLimit`: ขนาดชิ้นข้อความขาออกเป็นจำนวนอักขระ (ค่าเริ่มต้น: 4000)
    - `channels.bluebubbles.sendTimeoutMs`: timeout ต่อคำขอเป็นมิลลิวินาทีสำหรับการส่งข้อความขาออกผ่าน `/api/v1/message/text` (ค่าเริ่มต้น: 30000) เพิ่มค่านี้บนระบบ macOS 26 ที่การส่ง iMessage ผ่าน Private API อาจค้างนานกว่า 60 วินาทีภายในเฟรมเวิร์ก iMessage; ตัวอย่างเช่น `45000` หรือ `60000` ขณะนี้ probe, การค้นหาแชต, รีแอ็กชัน, การแก้ไข และ health check ยังคงใช้ค่าเริ่มต้นที่สั้นกว่าคือ 10 วินาที; มีแผนจะขยายให้ครอบคลุมรีแอ็กชันและการแก้ไขในภายหลัง การแทนที่รายบัญชี: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`
    - `channels.bluebubbles.chunkMode`: `length` (ค่าเริ่มต้น) จะแบ่งเฉพาะเมื่อเกิน `textChunkLimit`; `newline` จะแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว

  </Accordion>
  <Accordion title="สื่อและประวัติ">
    - `channels.bluebubbles.mediaMaxMb`: เพดานขนาดสื่อขาเข้า/ขาออกเป็น MB (ค่าเริ่มต้น: 8)
    - `channels.bluebubbles.mediaLocalRoots`: allowlist แบบระบุชัดเจนของไดเรกทอรีในเครื่องแบบ absolute ที่อนุญาตให้ใช้กับพาธสื่อภายในเครื่องสำหรับส่งออก การส่งด้วยพาธภายในเครื่องจะถูกปฏิเสธโดยค่าเริ่มต้นจนกว่าจะกำหนดค่านี้ การแทนที่รายบัญชี: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`
    - `channels.bluebubbles.coalesceSameSenderDms`: รวม Webhook DM ต่อเนื่องจากผู้ส่งคนเดิมให้เป็นเอเจนต์เทิร์นเดียว เพื่อให้ split-send แบบข้อความ+URL ของ Apple มาถึงเป็นข้อความเดียว (ค่าเริ่มต้น: `false`) ดู [การรวม DM ที่ถูกแยกส่ง](#coalescing-split-send-dms-command--url-in-one-composition) สำหรับสถานการณ์ การปรับหน้าต่างเวลา และข้อแลกเปลี่ยน เมื่อเปิดใช้โดยไม่มี `messages.inbound.byChannel.bluebubbles` ที่กำหนดชัดเจน จะขยายหน้าต่าง debounce ขาเข้าค่าเริ่มต้นจาก 500 ms เป็น 2500 ms
    - `channels.bluebubbles.historyLimit`: จำนวนข้อความกลุ่มสูงสุดสำหรับบริบท (0 คือปิดการใช้งาน)
    - `channels.bluebubbles.dmHistoryLimit`: ขีดจำกัดประวัติ DM

  </Accordion>
  <Accordion title="การดำเนินการและบัญชี">
    - `channels.bluebubbles.actions`: เปิด/ปิดการดำเนินการแต่ละรายการ
    - `channels.bluebubbles.accounts`: การกำหนดค่าหลายบัญชี

  </Accordion>
</AccordionGroup>

ตัวเลือกส่วนกลางที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (หรือ `messages.groupChat.mentionPatterns`)
- `messages.responsePrefix`

## การระบุที่อยู่ / เป้าหมายการส่ง

แนะนำให้ใช้ `chat_guid` เพื่อการกำหนดเส้นทางที่เสถียร:

- `chat_guid:iMessage;-;+15555550123` (แนะนำสำหรับกลุ่ม)
- `chat_id:123`
- `chat_identifier:...`
- handle โดยตรง: `+15555550123`, `user@example.com`
  - หาก handle โดยตรงยังไม่มีแชต DM อยู่ OpenClaw จะสร้างใหม่ผ่าน `POST /api/v1/chat/new` ซึ่งต้องเปิดใช้ BlueBubbles Private API

### การกำหนดเส้นทาง iMessage เทียบกับ SMS

เมื่อ handle เดียวกันมีทั้งแชต iMessage และแชต SMS บน Mac (เช่น หมายเลขโทรศัพท์ที่ลงทะเบียน iMessage แต่ก็เคยได้รับข้อความสำรองแบบบับเบิลสีเขียวด้วย) OpenClaw จะเลือกแชต iMessage ก่อนและจะไม่ลดระดับเป็น SMS แบบเงียบ ๆ หากต้องการบังคับใช้แชต SMS ให้ใช้ prefix เป้าหมาย `sms:` แบบชัดเจน (เช่น `sms:+15555550123`) สำหรับ handle ที่ไม่มีแชต iMessage ที่ตรงกัน ระบบจะยังคงส่งผ่านแชตที่ BlueBubbles รายงานกลับมา

## ความปลอดภัย

- คำขอ Webhook จะได้รับการยืนยันตัวตนโดยเปรียบเทียบ query param หรือ header ของ `guid`/`password` กับ `channels.bluebubbles.password`
- เก็บรหัสผ่าน API และปลายทาง Webhook เป็นความลับ (ถือว่าเป็นข้อมูลรับรอง)
- ไม่มีการข้ามการยืนยันตัวตน Webhook ของ BlueBubbles สำหรับ localhost หากคุณใช้ proxy กับทราฟฟิก Webhook ให้คงรหัสผ่าน BlueBubbles ไว้ในคำขอตลอดเส้นทาง `gateway.trustedProxies` ไม่ได้ใช้แทน `channels.bluebubbles.password` ในกรณีนี้ ดู [ความปลอดภัยของ Gateway](/th/gateway/security#reverse-proxy-configuration)
- เปิดใช้ HTTPS + กฎไฟร์วอลล์บนเซิร์ฟเวอร์ BlueBubbles หากมีการเปิดให้เข้าถึงจากนอก LAN ของคุณ

## การแก้ไขปัญหา

- หากเหตุการณ์การพิมพ์/การอ่านหยุดทำงาน ให้ตรวจสอบล็อก Webhook ของ BlueBubbles และยืนยันว่าพาธของ gateway ตรงกับ `channels.bluebubbles.webhookPath`
- โค้ดการจับคู่หมดอายุภายในหนึ่งชั่วโมง; ใช้ `openclaw pairing list bluebubbles` และ `openclaw pairing approve bluebubbles <code>`
- รีแอ็กชันต้องใช้ BlueBubbles private API (`POST /api/v1/message/react`); ตรวจสอบให้แน่ใจว่าเวอร์ชันของเซิร์ฟเวอร์รองรับ
- การแก้ไข/ยกเลิกการส่งต้องใช้ macOS 13+ และเวอร์ชันเซิร์ฟเวอร์ BlueBubbles ที่เข้ากันได้ บน macOS 26 (Tahoe) การแก้ไขยังใช้งานไม่ได้ในขณะนี้เนื่องจากการเปลี่ยนแปลงของ private API
- การอัปเดตไอคอนกลุ่มอาจไม่เสถียรบน macOS 26 (Tahoe): API อาจคืนค่าสำเร็จแต่ไอคอนใหม่ไม่ซิงก์
- OpenClaw จะซ่อนการดำเนินการที่ทราบว่าใช้งานไม่ได้โดยอัตโนมัติตามเวอร์ชัน macOS ของเซิร์ฟเวอร์ BlueBubbles หากการแก้ไขยังคงปรากฏบน macOS 26 (Tahoe) ให้ปิดเองด้วย `channels.bluebubbles.actions.edit=false`
- เปิดใช้ `coalesceSameSenderDms` แล้วแต่ split-send (เช่น `Dump` + URL) ยังมาถึงเป็นสองเทิร์น: ดูเช็กลิสต์ [การแก้ไขปัญหาการรวม split-send](#split-send-coalescing-troubleshooting) — สาเหตุที่พบบ่อยคือหน้าต่าง debounce แคบเกินไป, อ่าน timestamp ใน session log ผิดว่าเป็นเวลา Webhook มาถึง, หรือเป็นการส่งแบบ reply-quote (ซึ่งใช้ `replyToBody` ไม่ใช่ Webhook ตัวที่สอง)
- สำหรับข้อมูลสถานะ/สุขภาพระบบ: `openclaw status --all` หรือ `openclaw status --deep`

สำหรับข้อมูลอ้างอิงเวิร์กโฟลว์ของช่องทางทั่วไป ดู [ช่องทาง](/th/channels) และคู่มือ [Plugins](/th/tools/plugin)

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและ mention gating
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความมั่นคงปลอดภัย
