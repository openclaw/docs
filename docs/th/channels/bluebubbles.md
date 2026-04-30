---
read_when:
    - การตั้งค่าช่องทาง BlueBubbles
    - การแก้ไขปัญหาการจับคู่ Webhook
    - การกำหนดค่า iMessage บน macOS
sidebarTitle: BlueBubbles
summary: iMessage ผ่านเซิร์ฟเวอร์ BlueBubbles บน macOS (ส่ง/รับผ่าน REST, สถานะกำลังพิมพ์, การแสดงความรู้สึก, การจับคู่, การดำเนินการขั้นสูง).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-30T09:35:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a77b248ed86eb4114f8b7f1fc6bd4cea004d65095a0439a4a8c814bc180082c
    source_path: channels/bluebubbles.md
    workflow: 16
---

สถานะ: Plugin ที่บันเดิลมาซึ่งคุยกับเซิร์ฟเวอร์ BlueBubbles macOS ผ่าน HTTP **แนะนำสำหรับการผสานรวม iMessage** เนื่องจากมี API ที่สมบูรณ์กว่าและตั้งค่าง่ายกว่าเมื่อเทียบกับช่องทาง imsg แบบเดิม

<Note>
OpenClaw รุ่นปัจจุบันบันเดิล BlueBubbles มาให้แล้ว ดังนั้นบิลด์แพ็กเกจปกติจึงไม่ต้องมีขั้นตอน `openclaw plugins install` แยกต่างหาก
</Note>

## ภาพรวม

- ทำงานบน macOS ผ่านแอปผู้ช่วย BlueBubbles ([bluebubbles.app](https://bluebubbles.app))
- แนะนำ/ทดสอบแล้ว: macOS Sequoia (15) macOS Tahoe (26) ใช้งานได้; การแก้ไขยังเสียอยู่บน Tahoe ในขณะนี้ และการอัปเดตไอคอนกลุ่มอาจรายงานว่าสำเร็จแต่ไม่ซิงก์
- OpenClaw คุยกับมันผ่าน REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`)
- ข้อความขาเข้ามาถึงผ่าน Webhook; การตอบกลับขาออก ตัวบ่งชี้การพิมพ์ ใบตอบรับการอ่าน และ tapback เป็นการเรียก REST
- ไฟล์แนบและสติกเกอร์ถูกนำเข้าเป็นสื่อขาเข้า (และแสดงให้เอเจนต์เมื่อทำได้)
- การตอบกลับ Auto-TTS ที่สังเคราะห์เสียง MP3 หรือ CAF จะถูกส่งเป็นบับเบิลบันทึกเสียง iMessage แทนไฟล์แนบธรรมดา
- การจับคู่/allowlist ทำงานเหมือนช่องทางอื่น (`/channels/pairing` ฯลฯ) ด้วย `channels.bluebubbles.allowFrom` + รหัสจับคู่
- ปฏิกิริยาจะแสดงเป็นเหตุการณ์ระบบเหมือน Slack/Telegram เพื่อให้เอเจนต์สามารถ “กล่าวถึง” ได้ก่อนตอบกลับ
- ฟีเจอร์ขั้นสูง: แก้ไข, ยกเลิกส่ง, เธรดการตอบกลับ, เอฟเฟกต์ข้อความ, การจัดการกลุ่ม

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง BlueBubbles">
    ติดตั้งเซิร์ฟเวอร์ BlueBubbles บน Mac ของคุณ (ทำตามคำแนะนำที่ [bluebubbles.app/install](https://bluebubbles.app/install))
  </Step>
  <Step title="เปิดใช้งาน web API">
    ในการกำหนดค่า BlueBubbles ให้เปิดใช้งาน web API และตั้งรหัสผ่าน
  </Step>
  <Step title="กำหนดค่า OpenClaw">
    เรียกใช้ `openclaw onboard` แล้วเลือก BlueBubbles หรือกำหนดค่าด้วยตนเอง:

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
  <Step title="ชี้ Webhook ไปที่ Gateway">
    ชี้ Webhook ของ BlueBubbles ไปยัง Gateway ของคุณ (ตัวอย่าง: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)
  </Step>
  <Step title="เริ่ม Gateway">
    เริ่ม Gateway; มันจะลงทะเบียนตัวจัดการ Webhook และเริ่มการจับคู่
  </Step>
</Steps>

<Warning>
**ความปลอดภัย**

- ตั้งรหัสผ่าน Webhook เสมอ
- จำเป็นต้องตรวจสอบสิทธิ์ Webhook เสมอ OpenClaw จะปฏิเสธคำขอ Webhook ของ BlueBubbles เว้นแต่คำขอนั้นจะมี password/guid ที่ตรงกับ `channels.bluebubbles.password` (เช่น `?password=<password>` หรือ `x-password`) ไม่ว่าโทโพโลยีจะเป็น loopback/proxy แบบใดก็ตาม
- การตรวจสอบสิทธิ์ด้วยรหัสผ่านจะถูกตรวจสอบก่อนอ่าน/แยกวิเคราะห์เนื้อหา Webhook ทั้งหมด

</Warning>

## การคงให้ Messages.app ทำงานอยู่ (การตั้งค่า VM / headless)

การตั้งค่า macOS VM / แบบเปิดตลอดเวลาบางแบบอาจทำให้ Messages.app เข้าสู่สถานะ “idle” (เหตุการณ์ขาเข้าหยุดจนกว่าจะเปิดแอป/นำแอปมาไว้ด้านหน้า) วิธีเลี่ยงแบบง่ายคือ **สะกิด Messages ทุก 5 นาที** โดยใช้ AppleScript + LaunchAgent

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

    สิ่งนี้จะทำงาน **ทุก 300 วินาที** และ **เมื่อเข้าสู่ระบบ** การทำงานครั้งแรกอาจเรียกพรอมป์ **Automation** ของ macOS (`osascript` → Messages) อนุมัติพรอมป์เหล่านั้นในเซสชันผู้ใช้เดียวกับที่เรียกใช้ LaunchAgent

  </Step>
  <Step title="โหลดมัน">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## การเริ่มต้นใช้งาน

BlueBubbles มีให้ใช้ในการเริ่มต้นใช้งานแบบโต้ตอบ:

```
openclaw onboard
```

วิซาร์ดจะถามค่า:

<ParamField path="Server URL" type="string" required>
  ที่อยู่เซิร์ฟเวอร์ BlueBubbles (เช่น `http://192.168.1.100:1234`)
</ParamField>
<ParamField path="Password" type="string" required>
  รหัสผ่าน API จากการตั้งค่า BlueBubbles Server
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  เส้นทาง endpoint ของ Webhook
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open`, หรือ `disabled`
</ParamField>
<ParamField path="Allow list" type="string[]">
  หมายเลขโทรศัพท์ อีเมล หรือเป้าหมายแชต
</ParamField>

คุณยังสามารถเพิ่ม BlueBubbles ผ่าน CLI ได้:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

<Tabs>
  <Tab title="DM">
    - ค่าเริ่มต้น: `channels.bluebubbles.dmPolicy = "pairing"`
    - ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่; ข้อความจะถูกละเว้นจนกว่าจะได้รับอนุมัติ (รหัสหมดอายุหลัง 1 ชั่วโมง)
    - อนุมัติผ่าน:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - การจับคู่คือการแลกเปลี่ยนโทเค็นค่าเริ่มต้น รายละเอียด: [การจับคู่](/th/channels/pairing)

  </Tab>
  <Tab title="กลุ่ม">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`)
    - `channels.bluebubbles.groupAllowFrom` ควบคุมว่าใครสามารถทริกเกอร์ในกลุ่มได้เมื่อกำหนด `allowlist`

  </Tab>
</Tabs>

### การเพิ่มข้อมูลชื่อผู้ติดต่อ (macOS, ไม่บังคับ)

Webhook กลุ่มของ BlueBubbles มักมีเพียงที่อยู่ผู้เข้าร่วมแบบดิบ หากคุณต้องการให้บริบท `GroupMembers` แสดงชื่อผู้ติดต่อในเครื่องแทน คุณสามารถเลือกใช้การเพิ่มข้อมูล Contacts ในเครื่องบน macOS ได้:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` เปิดใช้งานการค้นหา ค่าเริ่มต้น: `false`
- การค้นหาจะทำงานหลังจากการเข้าถึงกลุ่ม การอนุญาตคำสั่ง และด่านการกล่าวถึงอนุญาตให้ข้อความผ่านแล้วเท่านั้น
- เพิ่มข้อมูลเฉพาะผู้เข้าร่วมที่เป็นโทรศัพท์และยังไม่มีชื่อเท่านั้น
- หมายเลขโทรศัพท์ดิบยังคงเป็นค่าทดแทนเมื่อไม่พบรายการที่ตรงกันในเครื่อง

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### ด่านการกล่าวถึง (กลุ่ม)

BlueBubbles รองรับด่านการกล่าวถึงสำหรับแชตกลุ่ม ซึ่งตรงกับพฤติกรรม iMessage/WhatsApp:

- ใช้ `agents.list[].groupChat.mentionPatterns` (หรือ `messages.groupChat.mentionPatterns`) เพื่อตรวจจับการกล่าวถึง
- เมื่อเปิดใช้งาน `requireMention` สำหรับกลุ่ม เอเจนต์จะตอบเมื่อถูกกล่าวถึงเท่านั้น
- คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตจะข้ามด่านการกล่าวถึง

การกำหนดค่าต่อกลุ่ม:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### ด่านคำสั่ง

- คำสั่งควบคุม (เช่น `/config`, `/model`) ต้องมีการอนุญาต
- ใช้ `allowFrom` และ `groupAllowFrom` เพื่อกำหนดการอนุญาตคำสั่ง
- ผู้ส่งที่ได้รับอนุญาตสามารถเรียกใช้คำสั่งควบคุมได้แม้ไม่ได้กล่าวถึงในกลุ่ม

### พรอมป์ระบบต่อกลุ่ม

แต่ละรายการภายใต้ `channels.bluebubbles.groups.*` รับสตริง `systemPrompt` แบบไม่บังคับ ค่าจะถูกฉีดเข้าไปในพรอมป์ระบบของเอเจนต์ในทุกเทิร์นที่จัดการข้อความในกลุ่มนั้น คุณจึงสามารถตั้ง persona หรือกฎพฤติกรรมต่อกลุ่มได้โดยไม่ต้องแก้ไขพรอมป์ของเอเจนต์:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

คีย์ตรงกับสิ่งที่ BlueBubbles รายงานเป็น `chatGuid` / `chatIdentifier` / `chatId` แบบตัวเลขสำหรับกลุ่ม และรายการไวลด์การ์ด `"*"` ให้ค่าเริ่มต้นสำหรับทุกกลุ่มที่ไม่มีการจับคู่ตรงกัน (รูปแบบเดียวกับที่ใช้โดย `requireMention` และนโยบายเครื่องมือต่อกลุ่ม) การจับคู่ตรงจะชนะไวลด์การ์ดเสมอ DM จะละเว้นฟิลด์นี้; ให้ใช้การปรับแต่งพรอมป์ระดับเอเจนต์หรือระดับบัญชีแทน

#### ตัวอย่างที่ใช้งานจริง: การตอบกลับแบบเธรดและปฏิกิริยา tapback (Private API)

เมื่อเปิดใช้งาน BlueBubbles Private API ข้อความขาเข้าจะมาพร้อม ID ข้อความแบบสั้น (เช่น `[[reply_to:5]]`) และเอเจนต์สามารถเรียก `action=reply` เพื่อเข้าเธรดในข้อความที่เจาะจง หรือ `action=react` เพื่อใส่ tapback ได้ `systemPrompt` ต่อกลุ่มเป็นวิธีที่เชื่อถือได้ในการทำให้เอเจนต์เลือกเครื่องมือที่ถูกต้อง:

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

ทั้งปฏิกิริยา tapback และการตอบกลับแบบเธรดต้องใช้ BlueBubbles Private API; ดู [การดำเนินการขั้นสูง](#advanced-actions) และ [ID ข้อความ](#message-ids-short-vs-full) สำหรับกลไกพื้นฐาน

## การผูกการสนทนา ACP

แชต BlueBubbles สามารถเปลี่ยนเป็นพื้นที่ทำงาน ACP ที่คงอยู่ได้โดยไม่เปลี่ยนชั้นการขนส่ง

โฟลว์ตัวดำเนินการแบบเร็ว:

- เรียกใช้ `/acp spawn codex --bind here` ภายใน DM หรือแชตกลุ่มที่อนุญาต
- ข้อความในอนาคตในบทสนทนา BlueBubbles เดียวกันนั้นจะถูกส่งต่อไปยังเซสชัน ACP ที่สร้างขึ้น
- `/new` และ `/reset` รีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมในตำแหน่งเดิม
- `/acp close` ปิดเซสชัน ACP และลบการผูก

ยังรองรับการผูกถาวรที่กำหนดค่าไว้ผ่านรายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` และ `match.channel: "bluebubbles"`

`match.peer.id` สามารถใช้รูปแบบเป้าหมาย BlueBubbles ใดก็ได้ที่รองรับ:

- แฮนเดิล DM ที่ปรับรูปแบบแล้ว เช่น `+15555550123` หรือ `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

สำหรับการผูกกลุ่มที่เสถียร ให้เลือกใช้ `chat_id:*` หรือ `chat_identifier:*`

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
- **ตัวบ่งชี้การพิมพ์**: OpenClaw ส่งเหตุการณ์เริ่มพิมพ์ BlueBubbles จะล้างสถานะการพิมพ์โดยอัตโนมัติเมื่อส่งหรือหมดเวลา (การหยุดด้วยตนเองผ่าน DELETE ไม่น่าเชื่อถือ)

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## การดำเนินการขั้นสูง

BlueBubbles รองรับการดำเนินการกับข้อความขั้นสูงเมื่อเปิดใช้ในการกำหนดค่า:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="การดำเนินการที่ใช้ได้">
    - **react**: เพิ่ม/ลบรีแอ็กชัน tapback (`messageId`, `emoji`, `remove`) ชุด tapback ดั้งเดิมของ iMessage คือ `love`, `like`, `dislike`, `laugh`, `emphasize` และ `question` เมื่อเอเจนต์เลือกอีโมจินอกชุดนั้น (เช่น `👀`) เครื่องมือรีแอ็กชันจะถอยกลับไปใช้ `love` เพื่อให้ tapback ยังแสดงผลแทนที่จะทำให้คำขอทั้งหมดล้มเหลว รีแอ็กชันตอบรับที่กำหนดค่าไว้ยังคงตรวจสอบอย่างเข้มงวดและจะเกิดข้อผิดพลาดเมื่อเจอค่าที่ไม่รู้จัก
    - **edit**: แก้ไขข้อความที่ส่งแล้ว (`messageId`, `text`)
    - **unsend**: ยกเลิกการส่งข้อความ (`messageId`)
    - **reply**: ตอบกลับข้อความที่ระบุ (`messageId`, `text`, `to`)
    - **sendWithEffect**: ส่งพร้อมเอฟเฟกต์ iMessage (`text`, `to`, `effectId`)
    - **renameGroup**: เปลี่ยนชื่อแชตกลุ่ม (`chatGuid`, `displayName`)
    - **setGroupIcon**: ตั้งค่าไอคอน/รูปภาพของแชตกลุ่ม (`chatGuid`, `media`) — ไม่เสถียรบน macOS 26 Tahoe (API อาจส่งกลับว่าสำเร็จ แต่ไอคอนไม่ซิงค์)
    - **addParticipant**: เพิ่มคนเข้ากลุ่ม (`chatGuid`, `address`)
    - **removeParticipant**: ลบคนออกจากกลุ่ม (`chatGuid`, `address`)
    - **leaveGroup**: ออกจากแชตกลุ่ม (`chatGuid`)
    - **upload-file**: ส่งสื่อ/ไฟล์ (`to`, `buffer`, `filename`, `asVoice`)
      - บันทึกเสียง: ตั้งค่า `asVoice: true` พร้อมเสียง **MP3** หรือ **CAF** เพื่อส่งเป็นข้อความเสียง iMessage BlueBubbles แปลง MP3 → CAF เมื่อส่งบันทึกเสียง
    - ชื่อแทนเดิม: `sendAttachment` ยังใช้งานได้ แต่ `upload-file` คือชื่อการดำเนินการมาตรฐาน

  </Accordion>
</AccordionGroup>

### ID ข้อความ (สั้นเทียบกับเต็ม)

OpenClaw อาจแสดง ID ข้อความแบบ _สั้น_ (เช่น `1`, `2`) เพื่อประหยัดโทเค็น

- `MessageSid` / `ReplyToId` สามารถเป็น ID แบบสั้นได้
- `MessageSidFull` / `ReplyToIdFull` มี ID แบบเต็มของผู้ให้บริการ
- ID แบบสั้นอยู่ในหน่วยความจำ อาจหมดอายุเมื่อรีสตาร์ทหรือล้างแคช
- การดำเนินการยอมรับ `messageId` แบบสั้นหรือเต็ม แต่ ID แบบสั้นจะเกิดข้อผิดพลาดหากไม่มีให้อีกต่อไป

ใช้ ID แบบเต็มสำหรับระบบอัตโนมัติและพื้นที่จัดเก็บที่ต้องคงทน:

- เทมเพลต: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- บริบท: `MessageSidFull` / `ReplyToIdFull` ในเพย์โหลดขาเข้า

ดู [การกำหนดค่า](/th/gateway/configuration) สำหรับตัวแปรเทมเพลต

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## การรวม DM ที่ถูกแยกส่ง (คำสั่ง + URL ในการเขียนครั้งเดียว)

เมื่อผู้ใช้พิมพ์คำสั่งและ URL พร้อมกันใน iMessage — เช่น `Dump https://example.com/article` — Apple จะแยกการส่งเป็น **การส่ง Webhook สองรายการแยกกัน**:

1. ข้อความตัวอักษร (`"Dump"`)
2. บอลลูนพรีวิว URL (`"https://..."`) พร้อมรูปภาพ OG-preview เป็นไฟล์แนบ

Webhook ทั้งสองมาถึง OpenClaw ห่างกันประมาณ 0.8-2.0 วินาทีในชุดติดตั้งส่วนใหญ่ หากไม่มีการรวม เอเจนต์จะได้รับเฉพาะคำสั่งในเทิร์นที่ 1 ตอบกลับ (มักเป็น "ส่ง URL มาให้ฉัน") แล้วจึงเห็น URL ในเทิร์นที่ 2 — ซึ่งถึงตอนนั้นบริบทของคำสั่งก็หายไปแล้ว

`channels.bluebubbles.coalesceSameSenderDms` เลือกให้ DM รวม Webhook ต่อเนื่องจากผู้ส่งเดียวกันเป็นเทิร์นเอเจนต์เดียว แชตกลุ่มยังคงใช้คีย์ต่อข้อความเพื่อรักษาโครงสร้างเทิร์นของผู้ใช้หลายคน

<Tabs>
  <Tab title="ควรเปิดใช้เมื่อใด">
    เปิดใช้เมื่อ:

    - คุณส่งมอบ Skills ที่คาดหวัง `command + payload` ในข้อความเดียว (dump, paste, save, queue ฯลฯ)
    - ผู้ใช้ของคุณวาง URL, รูปภาพ หรือเนื้อหายาวพร้อมคำสั่ง
    - คุณยอมรับเวลาแฝงของเทิร์น DM ที่เพิ่มขึ้นได้ (ดูด้านล่าง)

    ปิดไว้เมื่อ:

    - คุณต้องการเวลาแฝงของคำสั่งต่ำสุดสำหรับตัวกระตุ้น DM คำเดียว
    - โฟลว์ทั้งหมดของคุณเป็นคำสั่งแบบครั้งเดียวโดยไม่มีเพย์โหลดตามมา

  </Tab>
  <Tab title="การเปิดใช้">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    เมื่อเปิดแฟล็กและไม่มี `messages.inbound.byChannel.bluebubbles` ที่ระบุชัดเจน หน้าต่าง debounce จะขยายเป็น **2500 ms** (ค่าเริ่มต้นสำหรับแบบไม่รวมคือ 500 ms) ต้องใช้หน้าต่างที่กว้างขึ้น — จังหวะการแยกส่งของ Apple ที่ 0.8-2.0 วินาทีไม่พอดีกับค่าเริ่มต้นที่แคบกว่า

    หากต้องการปรับหน้าต่างเอง:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="ข้อแลกเปลี่ยน">
    - **เพิ่มเวลาแฝงสำหรับคำสั่งควบคุม DM** เมื่อเปิดแฟล็ก ข้อความคำสั่งควบคุม DM (เช่น `Dump`, `Save` ฯลฯ) จะรอได้ถึงหน้าต่าง debounce ก่อนส่งต่อ เผื่อว่าจะมี Webhook เพย์โหลดตามมา คำสั่งในแชตกลุ่มยังคงส่งต่อทันที
    - **เอาต์พุตที่รวมแล้วมีขอบเขตจำกัด** — ข้อความที่รวมจำกัดที่ 4000 อักขระพร้อมเครื่องหมาย `…[truncated]` ชัดเจน ไฟล์แนบจำกัดที่ 20 รายการ รายการต้นทางจำกัดที่ 10 รายการ (คงรายการแรกและรายการล่าสุดไว้เมื่อเกินกว่านั้น) `messageId` ของทุกต้นทางยังคงไปถึง inbound-dedupe เพื่อให้การเล่นซ้ำภายหลังของ MessagePoller สำหรับเหตุการณ์เดี่ยวใดๆ ถูกจดจำว่าเป็นรายการซ้ำ
    - **เลือกเปิดใช้ต่อช่องทาง** ช่องทางอื่น (Telegram, WhatsApp, Slack, …) ไม่ได้รับผลกระทบ

  </Tab>
</Tabs>

### สถานการณ์และสิ่งที่เอเจนต์เห็น

| ผู้ใช้เขียน                                                        | Apple ส่งมอบ              | ปิดแฟล็ก (ค่าเริ่มต้น)                  | เปิดแฟล็ก + หน้าต่าง 2500 ms                                           |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (ส่งครั้งเดียว)                         | 2 Webhook ห่างกัน ~1 วินาที | สองเทิร์นเอเจนต์: มีแค่ "Dump" แล้วตามด้วย URL | หนึ่งเทิร์น: ข้อความที่รวม `Dump https://example.com`                  |
| `Save this 📎image.jpg caption` (ไฟล์แนบ + ข้อความ)                | 2 Webhook                 | สองเทิร์น                              | หนึ่งเทิร์น: ข้อความ + รูปภาพ                                          |
| `/status` (คำสั่งเดี่ยว)                                           | 1 Webhook                 | ส่งต่อทันที                            | **รอได้ถึงหน้าต่าง แล้วจึงส่งต่อ**                                     |
| วาง URL อย่างเดียว                                                 | 1 Webhook                 | ส่งต่อทันที                            | ส่งต่อทันที (มีเพียงหนึ่งรายการในบัคเก็ต)                              |
| ข้อความ + URL ที่ตั้งใจส่งเป็นสองข้อความแยกกัน ห่างกันหลายนาที     | 2 Webhook นอกหน้าต่าง     | สองเทิร์น                              | สองเทิร์น (หน้าต่างหมดอายุระหว่างข้อความ)                             |
| ส่ง DM เล็กๆ ถี่มาก (>10 รายการภายในหน้าต่าง)                      | N Webhook                 | N เทิร์น                               | หนึ่งเทิร์น เอาต์พุตมีขอบเขตจำกัด (รายการแรก + ล่าสุด และใช้เพดานข้อความ/ไฟล์แนบ) |

### การแก้ปัญหาการรวมการแยกส่ง

หากเปิดแฟล็กแล้วแต่การแยกส่งยังมาถึงเป็นสองเทิร์น ให้ตรวจสอบแต่ละชั้น:

<AccordionGroup>
  <Accordion title="โหลดการกำหนดค่าจริงแล้ว">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    จากนั้น `openclaw gateway restart` — แฟล็กจะถูกอ่านตอนสร้าง debouncer-registry

  </Accordion>
  <Accordion title="หน้าต่าง debounce กว้างพอสำหรับชุดติดตั้งของคุณ">
    ดูบันทึกเซิร์ฟเวอร์ BlueBubbles ใต้ `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    วัดระยะห่างระหว่างการส่งต่อข้อความสไตล์ `"Dump"` และการส่งต่อ `"https://..."; Attachments:` ที่ตามมา เพิ่ม `messages.inbound.byChannel.bluebubbles` ให้ครอบคลุมระยะห่างนั้นอย่างสบาย

  </Accordion>
  <Accordion title="เวลาใน Session JSONL ≠ การมาถึงของ Webhook">
    เวลาเหตุการณ์ของเซสชัน (`~/.openclaw/agents/<id>/sessions/*.jsonl`) สะท้อนเวลาที่ Gateway ส่งข้อความให้เอเจนต์ **ไม่ใช่** เวลาที่ Webhook มาถึง ข้อความลำดับที่สองในคิวที่ติดแท็ก `[Queued messages while agent was busy]` หมายความว่าเทิร์นแรกยังทำงานอยู่เมื่อ Webhook ที่สองมาถึง — บัคเก็ต coalesce ถูก flush ไปแล้ว ปรับหน้าต่างตามบันทึกเซิร์ฟเวอร์ BB ไม่ใช่บันทึกเซสชัน
  </Accordion>
  <Accordion title="แรงกดดันหน่วยความจำทำให้การส่งคำตอบช้าลง">
    บนเครื่องขนาดเล็กกว่า (8 GB) เทิร์นของเอเจนต์อาจใช้เวลานานจนบัคเก็ต coalesce ถูก flush ก่อนที่คำตอบจะเสร็จ และ URL จึงเข้ามาเป็นเทิร์นที่สองในคิว ตรวจสอบ `memory_pressure` และ `ps -o rss -p $(pgrep openclaw-gateway)` หาก Gateway ใช้ RSS เกิน ~500 MB และคอมเพรสเซอร์ทำงานอยู่ ให้ปิดกระบวนการหนักอื่นๆ หรือย้ายไปโฮสต์ที่ใหญ่ขึ้น
  </Accordion>
  <Accordion title="การส่งแบบอ้างอิงคำตอบเป็นคนละเส้นทาง">
    หากผู้ใช้แตะ `Dump` เป็น **การตอบกลับ** บอลลูน URL ที่มีอยู่ (iMessage แสดงป้าย "1 Reply" บนบอลลูน Dump) URL จะอยู่ใน `replyToBody` ไม่ได้อยู่ใน Webhook ที่สอง การรวมไม่เกี่ยวข้อง — นั่นเป็นเรื่องของ skill/prompt ไม่ใช่เรื่องของ debouncer
  </Accordion>
</AccordionGroup>

## การสตรีมแบบบล็อก

ควบคุมว่าจะส่งคำตอบเป็นข้อความเดียวหรือสตรีมเป็นบล็อก:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## สื่อ + ขีดจำกัด

- ไฟล์แนบขาเข้าจะถูกดาวน์โหลดและจัดเก็บในแคชสื่อ
- เพดานสื่อผ่าน `channels.bluebubbles.mediaMaxMb` สำหรับสื่อขาเข้าและขาออก (ค่าเริ่มต้น: 8 MB)
- ข้อความขาออกถูกแบ่งเป็นชิ้นตาม `channels.bluebubbles.textChunkLimit` (ค่าเริ่มต้น: 4000 อักขระ)

## อ้างอิงการกำหนดค่า

การกำหนดค่าฉบับเต็ม: [การกำหนดค่า](/th/gateway/configuration)

<AccordionGroup>
  <Accordion title="การเชื่อมต่อและ Webhook">
    - `channels.bluebubbles.enabled`: เปิด/ปิดช่องทาง
    - `channels.bluebubbles.serverUrl`: URL ฐานของ BlueBubbles REST API
    - `channels.bluebubbles.password`: รหัสผ่าน API
    - `channels.bluebubbles.webhookPath`: พาธปลายทาง Webhook (ค่าเริ่มต้น: `/bluebubbles-webhook`)

  </Accordion>
  <Accordion title="นโยบายการเข้าถึง">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: `pairing`)
    - `channels.bluebubbles.allowFrom`: รายการอนุญาต DM (แฮนเดิล, อีเมล, หมายเลข E.164, `chat_id:*`, `chat_guid:*`)
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`)
    - `channels.bluebubbles.groupAllowFrom`: รายการอนุญาตผู้ส่งกลุ่ม
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: บน macOS เลือกเสริมข้อมูลผู้เข้าร่วมกลุ่มที่ไม่มีชื่อจาก Contacts ในเครื่องหลังผ่านการตรวจ gate ค่าเริ่มต้น: `false`
    - `channels.bluebubbles.groups`: การกำหนดค่าต่อกลุ่ม (`requireMention` ฯลฯ)

  </Accordion>
  <Accordion title="การส่งมอบและการแบ่งชิ้น">
    - `channels.bluebubbles.sendReadReceipts`: ส่งใบตอบรับการอ่าน (ค่าเริ่มต้น: `true`).
    - `channels.bluebubbles.blockStreaming`: เปิดใช้งานการสตรีมแบบบล็อก (ค่าเริ่มต้น: `false`; จำเป็นสำหรับการตอบกลับแบบสตรีม).
    - `channels.bluebubbles.textChunkLimit`: ขนาดชิ้นข้อความขาออกเป็นอักขระ (ค่าเริ่มต้น: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: ระยะหมดเวลาต่อคำขอเป็น ms สำหรับการส่งข้อความขาออกผ่าน `/api/v1/message/text` (ค่าเริ่มต้น: 30000). เพิ่มค่านี้ในชุดติดตั้ง macOS 26 ที่การส่ง iMessage ด้วย Private API อาจค้างได้นานกว่า 60 วินาทีภายในเฟรมเวิร์ก iMessage; ตัวอย่างเช่น `45000` หรือ `60000`. ปัจจุบันโพรบ การค้นหาแชต รีแอ็กชัน การแก้ไข และการตรวจสุขภาพยังคงใช้ค่าเริ่มต้นที่สั้นกว่า 10 วินาที; มีแผนขยายความครอบคลุมไปยังรีแอ็กชันและการแก้ไขในงานติดตามผล. การแทนที่รายบัญชี: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (ค่าเริ่มต้น) จะแบ่งเฉพาะเมื่อเกิน `textChunkLimit`; `newline` จะแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งชิ้นตามความยาว.

  </Accordion>
  <Accordion title="สื่อและประวัติ">
    - `channels.bluebubbles.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า/ขาออกเป็น MB (ค่าเริ่มต้น: 8).
    - `channels.bluebubbles.mediaLocalRoots`: รายการอนุญาตแบบชัดเจนของไดเรกทอรีภายในเครื่องแบบสัมบูรณ์ที่อนุญาตให้ใช้กับพาธสื่อภายในเครื่องขาออก. การส่งพาธภายในเครื่องจะถูกปฏิเสธโดยค่าเริ่มต้น เว้นแต่จะกำหนดค่านี้ไว้. การแทนที่รายบัญชี: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: รวม Webhook ของ DM จากผู้ส่งเดียวกันที่มาติดกันให้เป็นเทิร์นเดียวของเอเจนต์ เพื่อให้การส่งแบบแยกข้อความ+URL ของ Apple มาถึงเป็นข้อความเดียว (ค่าเริ่มต้น: `false`). ดู [การรวม DM ที่ส่งแบบแยก](#coalescing-split-send-dms-command--url-in-one-composition) สำหรับสถานการณ์ การปรับแต่งหน้าต่างเวลา และข้อแลกเปลี่ยน. ขยายหน้าต่าง debounce ขาเข้าเริ่มต้นจาก 500 ms เป็น 2500 ms เมื่อเปิดใช้งานโดยไม่มี `messages.inbound.byChannel.bluebubbles` ที่ระบุไว้อย่างชัดเจน.
    - `channels.bluebubbles.historyLimit`: จำนวนข้อความกลุ่มสูงสุดสำหรับบริบท (0 ปิดใช้งาน).
    - `channels.bluebubbles.dmHistoryLimit`: ขีดจำกัดประวัติ DM.

  </Accordion>
  <Accordion title="การดำเนินการและบัญชี">
    - `channels.bluebubbles.actions`: เปิด/ปิดการดำเนินการเฉพาะ.
    - `channels.bluebubbles.accounts`: การกำหนดค่าหลายบัญชี.

  </Accordion>
</AccordionGroup>

ตัวเลือกส่วนกลางที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (หรือ `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## การระบุที่อยู่ / เป้าหมายการส่งมอบ

แนะนำให้ใช้ `chat_guid` เพื่อการกำหนดเส้นทางที่เสถียร:

- `chat_guid:iMessage;-;+15555550123` (แนะนำสำหรับกลุ่ม)
- `chat_id:123`
- `chat_identifier:...`
- แฮนเดิลโดยตรง: `+15555550123`, `user@example.com`
  - หากแฮนเดิลโดยตรงไม่มีแชต DM อยู่แล้ว OpenClaw จะสร้างให้ผ่าน `POST /api/v1/chat/new`. สิ่งนี้ต้องเปิดใช้งาน BlueBubbles Private API.

### การกำหนดเส้นทาง iMessage เทียบกับ SMS

เมื่อแฮนเดิลเดียวกันมีทั้งแชต iMessage และ SMS บน Mac (ตัวอย่างเช่น หมายเลขโทรศัพท์ที่ลงทะเบียนกับ iMessage แต่เคยได้รับข้อความสำรองแบบลูกโป่งสีเขียวด้วย) OpenClaw จะเลือกแชต iMessage และจะไม่ลดระดับเป็น SMS โดยไม่แจ้ง. หากต้องการบังคับใช้แชต SMS ให้ใช้คำนำหน้าเป้าหมาย `sms:` อย่างชัดเจน (ตัวอย่างเช่น `sms:+15555550123`). แฮนเดิลที่ไม่มีแชต iMessage ที่ตรงกันจะยังส่งผ่านแชตใดก็ตามที่ BlueBubbles รายงาน.

## ความปลอดภัย

- คำขอ Webhook ได้รับการยืนยันตัวตนโดยเปรียบเทียบพารามิเตอร์ query หรือ header ของ `guid`/`password` กับ `channels.bluebubbles.password`.
- เก็บรหัสผ่าน API และ endpoint ของ Webhook ไว้เป็นความลับ (ปฏิบัติต่อสิ่งเหล่านี้เหมือนข้อมูลประจำตัว).
- ไม่มีการข้ามการยืนยันตัวตน Webhook ของ BlueBubbles สำหรับ localhost. หากคุณพร็อกซีทราฟฟิก Webhook ให้คงรหัสผ่าน BlueBubbles ไว้ในคำขอตลอดทางตั้งแต่ต้นจนจบ. `gateway.trustedProxies` ไม่ได้แทนที่ `channels.bluebubbles.password` ที่นี่. ดู [ความปลอดภัยของ Gateway](/th/gateway/security#reverse-proxy-configuration).
- เปิดใช้งาน HTTPS + กฎไฟร์วอลล์บนเซิร์ฟเวอร์ BlueBubbles หากเปิดให้เข้าถึงจากนอก LAN ของคุณ.

## การแก้ไขปัญหา

- หากเหตุการณ์การพิมพ์/การอ่านหยุดทำงาน ให้ตรวจสอบบันทึก Webhook ของ BlueBubbles และยืนยันว่าพาธ Gateway ตรงกับ `channels.bluebubbles.webhookPath`.
- รหัสจับคู่หมดอายุหลังจากหนึ่งชั่วโมง; ใช้ `openclaw pairing list bluebubbles` และ `openclaw pairing approve bluebubbles <code>`.
- รีแอ็กชันต้องใช้ private API ของ BlueBubbles (`POST /api/v1/message/react`); ตรวจสอบให้แน่ใจว่าเวอร์ชันเซิร์ฟเวอร์เปิดเผย API นี้.
- การแก้ไข/ยกเลิกการส่งต้องใช้ macOS 13+ และเวอร์ชันเซิร์ฟเวอร์ BlueBubbles ที่เข้ากันได้. บน macOS 26 (Tahoe) ขณะนี้การแก้ไขใช้งานไม่ได้เนื่องจากการเปลี่ยนแปลงของ private API.
- การอัปเดตไอคอนกลุ่มอาจไม่เสถียรบน macOS 26 (Tahoe): API อาจส่งคืนว่าสำเร็จ แต่ไอคอนใหม่ไม่ซิงค์.
- OpenClaw ซ่อนการดำเนินการที่ทราบว่าเสียโดยอัตโนมัติตามเวอร์ชัน macOS ของเซิร์ฟเวอร์ BlueBubbles. หากการแก้ไขยังปรากฏบน macOS 26 (Tahoe) ให้ปิดใช้งานด้วยตนเองโดยใช้ `channels.bluebubbles.actions.edit=false`.
- เปิดใช้งาน `coalesceSameSenderDms` แล้ว แต่การส่งแบบแยก (เช่น `Dump` + URL) ยังมาถึงเป็นสองเทิร์น: ดูเช็กลิสต์ [การแก้ไขปัญหาการรวมการส่งแบบแยก](#split-send-coalescing-troubleshooting) — สาเหตุที่พบบ่อยคือหน้าต่าง debounce แคบเกินไป, อ่านเวลาในบันทึกเซสชันผิดว่าเป็นเวลาที่ Webhook มาถึง, หรือการส่งแบบอ้างอิงการตอบกลับ (ซึ่งใช้ `replyToBody` ไม่ใช่ Webhook ที่สอง).
- สำหรับข้อมูลสถานะ/สุขภาพ: `openclaw status --all` หรือ `openclaw status --deep`.

สำหรับข้อมูลอ้างอิงเวิร์กโฟลว์ของแชนเนลทั่วไป ดูคู่มือ [แชนเนล](/th/channels) และ [Plugins](/th/tools/plugin).

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางแชนเนล](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวมแชนเนล](/th/channels) — แชนเนลที่รองรับทั้งหมด
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
