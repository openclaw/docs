---
read_when:
    - การตั้งค่าช่องทาง BlueBubbles
    - การแก้ไขปัญหาการจับคู่ Webhook
    - การกำหนดค่า iMessage บน macOS
summary: iMessage ผ่านเซิร์ฟเวอร์ BlueBubbles บน macOS (ส่ง/รับผ่าน REST, การพิมพ์, รีแอ็กชัน, การจับคู่, การดำเนินการขั้นสูง)
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-25T13:41:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5185202d668f56e5f2e22c1858325595eea7cca754b9b3a809c886c53ae68770
    source_path: channels/bluebubbles.md
    workflow: 15
---

สถานะ: Plugin ที่มาพร้อมกับระบบ ซึ่งสื่อสารกับเซิร์ฟเวอร์ BlueBubbles บน macOS ผ่าน HTTP **แนะนำสำหรับการผสานรวม iMessage** เนื่องจากมี API ที่สมบูรณ์กว่าและตั้งค่าได้ง่ายกว่าเมื่อเทียบกับช่องทาง imsg แบบเดิม

## Plugin ที่มาพร้อมกับระบบ

OpenClaw รุ่นปัจจุบันมาพร้อมกับ BlueBubbles ดังนั้นโดยปกติแล้วในบิลด์แพ็กเกจทั่วไป
จึงไม่ต้องมีขั้นตอน `openclaw plugins install` แยกต่างหาก

## ภาพรวม

- ทำงานบน macOS ผ่านแอปตัวช่วย BlueBubbles ([bluebubbles.app](https://bluebubbles.app))
- แนะนำ/ทดสอบแล้ว: macOS Sequoia (15) ใช้งานได้บน macOS Tahoe (26); ขณะนี้การแก้ไขข้อความยังใช้งานไม่ได้บน Tahoe และการอัปเดตไอคอนกลุ่มอาจรายงานว่าสำเร็จแต่ไม่ซิงค์
- OpenClaw สื่อสารกับมันผ่าน REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`)
- ข้อความขาเข้ามาถึงผ่าน Webhook; การตอบกลับขาออก ตัวบ่งชี้การพิมพ์ ใบตอบรับการอ่าน และ tapback ใช้การเรียก REST
- ไฟล์แนบและสติกเกอร์จะถูกรับเข้าเป็นสื่อขาเข้า (และจะแสดงต่อให้เอเจนต์เมื่อเป็นไปได้)
- การจับคู่/allowlist ทำงานเหมือนกับช่องทางอื่น (`/channels/pairing` เป็นต้น) โดยใช้ `channels.bluebubbles.allowFrom` + รหัสการจับคู่
- รีแอ็กชันจะแสดงเป็นเหตุการณ์ระบบเช่นเดียวกับ Slack/Telegram เพื่อให้เอเจนต์สามารถ "กล่าวถึง" สิ่งเหล่านั้นก่อนตอบกลับ
- ฟีเจอร์ขั้นสูง: แก้ไข ยกเลิกส่ง เธรดการตอบกลับ เอฟเฟ็กต์ข้อความ การจัดการกลุ่ม

## เริ่มต้นอย่างรวดเร็ว

1. ติดตั้งเซิร์ฟเวอร์ BlueBubbles บน Mac ของคุณ (ทำตามคำแนะนำที่ [bluebubbles.app/install](https://bluebubbles.app/install))
2. ในการกำหนดค่า BlueBubbles ให้เปิดใช้งาน web API และตั้งรหัสผ่าน
3. รัน `openclaw onboard` แล้วเลือก BlueBubbles หรือกำหนดค่าด้วยตนเอง:

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

4. ชี้ Webhook ของ BlueBubbles ไปยัง Gateway ของคุณ (ตัวอย่าง: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)
5. เริ่ม Gateway; ระบบจะลงทะเบียนตัวจัดการ Webhook และเริ่มการจับคู่

หมายเหตุด้านความปลอดภัย:

- ตั้งรหัสผ่าน Webhook เสมอ
- ต้องมีการยืนยันตัวตนของ Webhook เสมอ OpenClaw จะปฏิเสธคำขอ Webhook ของ BlueBubbles เว้นแต่จะมี password/guid ที่ตรงกับ `channels.bluebubbles.password` (ตัวอย่างเช่น `?password=<password>` หรือ `x-password`) โดยไม่ขึ้นกับ topology ของ loopback/proxy
- ระบบจะตรวจสอบการยืนยันตัวตนด้วยรหัสผ่านก่อนอ่าน/แยกวิเคราะห์เนื้อหา Webhook แบบเต็ม

## การทำให้ Messages.app ทำงานอยู่เสมอ (การตั้งค่า VM / headless)

การตั้งค่า macOS VM / always-on บางแบบอาจทำให้ Messages.app เข้าสู่สถานะ “idle” (เหตุการณ์ขาเข้าจะหยุดจนกว่าจะเปิดแอป/นำแอปขึ้น foreground) วิธีแก้ชั่วคราวอย่างง่ายคือ **กระตุ้น Messages ทุก 5 นาที** โดยใช้ AppleScript + LaunchAgent

### 1) บันทึก AppleScript

บันทึกไฟล์นี้เป็น:

- `~/Scripts/poke-messages.scpt`

สคริปต์ตัวอย่าง (ไม่โต้ตอบ; ไม่ดึงโฟกัส):

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

### 2) ติดตั้ง LaunchAgent

บันทึกไฟล์นี้เป็น:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

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

หมายเหตุ:

- การทำงานนี้จะรัน **ทุก 300 วินาที** และ **เมื่อเข้าสู่ระบบ**
- การรันครั้งแรกอาจทำให้ macOS แสดงพรอมป์ **Automation** (`osascript` → Messages) ให้อนุมัติในเซสชันผู้ใช้เดียวกันกับที่รัน LaunchAgent

โหลดด้วยคำสั่ง:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## การเริ่มต้นใช้งาน

BlueBubbles พร้อมใช้งานในการเริ่มต้นแบบโต้ตอบ:

```
openclaw onboard
```

ตัวช่วยสร้างจะถามข้อมูลต่อไปนี้:

- **Server URL** (จำเป็น): ที่อยู่เซิร์ฟเวอร์ BlueBubbles (เช่น `http://192.168.1.100:1234`)
- **Password** (จำเป็น): รหัสผ่าน API จากการตั้งค่า BlueBubbles Server
- **Webhook path** (ไม่บังคับ): ค่าเริ่มต้นคือ `/bluebubbles-webhook`
- **นโยบาย DM**: pairing, allowlist, open หรือ disabled
- **รายการอนุญาต**: หมายเลขโทรศัพท์ อีเมล หรือเป้าหมายแชต

คุณยังสามารถเพิ่ม BlueBubbles ผ่าน CLI ได้:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

DM:

- ค่าเริ่มต้น: `channels.bluebubbles.dmPolicy = "pairing"`
- ผู้ส่งที่ไม่รู้จักจะได้รับรหัสการจับคู่; ข้อความจะถูกละเว้นจนกว่าจะได้รับการอนุมัติ (รหัสหมดอายุภายใน 1 ชั่วโมง)
- อนุมัติผ่าน:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- การจับคู่คือการแลกเปลี่ยนโทเค็นเริ่มต้น ดูรายละเอียดได้ที่: [Pairing](/th/channels/pairing)

กลุ่ม:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`)
- `channels.bluebubbles.groupAllowFrom` ควบคุมว่าใครสามารถทริกเกอร์ในกลุ่มได้เมื่อกำหนด `allowlist`

### การเพิ่มข้อมูลชื่อผู้ติดต่อ (macOS, ไม่บังคับ)

Webhook กลุ่มของ BlueBubbles มักมีเพียงที่อยู่ดิบของผู้เข้าร่วมเท่านั้น หากคุณต้องการให้บริบท `GroupMembers` แสดงชื่อผู้ติดต่อในเครื่องแทน คุณสามารถเลือกเปิดการเพิ่มข้อมูลจาก Contacts ในเครื่องบน macOS ได้:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` เปิดใช้การค้นหา ค่าเริ่มต้น: `false`
- การค้นหาจะทำงานเฉพาะหลังจากที่การเข้าถึงกลุ่ม การอนุญาตคำสั่ง และ mention gating อนุญาตให้ข้อความผ่านแล้วเท่านั้น
- ระบบจะเพิ่มข้อมูลให้เฉพาะผู้เข้าร่วมที่เป็นหมายเลขโทรศัพท์และยังไม่มีชื่อ
- หมายเลขโทรศัพท์ดิบจะยังคงใช้เป็นค่าทางเลือกเมื่อไม่พบข้อมูลที่ตรงกันในเครื่อง

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

BlueBubbles รองรับ mention gating สำหรับแชตกลุ่ม ซึ่งสอดคล้องกับพฤติกรรมของ iMessage/WhatsApp:

- ใช้ `agents.list[].groupChat.mentionPatterns` (หรือ `messages.groupChat.mentionPatterns`) เพื่อตรวจจับการ mention
- เมื่อเปิดใช้ `requireMention` สำหรับกลุ่ม เอเจนต์จะตอบกลับเฉพาะเมื่อถูก mention
- คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตจะข้าม mention gating

การกำหนดค่ารายกลุ่ม:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // ค่าเริ่มต้นสำหรับทุกกลุ่ม
        "iMessage;-;chat123": { requireMention: false }, // เขียนทับสำหรับกลุ่มเฉพาะ
      },
    },
  },
}
```

### Command gating

- คำสั่งควบคุม (เช่น `/config`, `/model`) ต้องได้รับการอนุญาต
- ใช้ `allowFrom` และ `groupAllowFrom` เพื่อกำหนดการอนุญาตคำสั่ง
- ผู้ส่งที่ได้รับอนุญาตสามารถรันคำสั่งควบคุมได้แม้ไม่มีการ mention ในกลุ่ม

### system prompt รายกลุ่ม

แต่ละรายการภายใต้ `channels.bluebubbles.groups.*` รองรับสตริง `systemPrompt` แบบไม่บังคับ ค่านี้จะถูกแทรกเข้าไปใน system prompt ของเอเจนต์ทุกครั้งที่จัดการข้อความในกลุ่มนั้น ดังนั้นคุณจึงสามารถกำหนดบุคลิกหรือนโยบายพฤติกรรมรายกลุ่มได้โดยไม่ต้องแก้ไข prompt ของเอเจนต์:

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

คีย์นี้จะตรงกับค่าที่ BlueBubbles รายงานเป็น `chatGuid` / `chatIdentifier` / `chatId` แบบตัวเลขสำหรับกลุ่ม และรายการ wildcard `"*"` จะใช้เป็นค่าเริ่มต้นสำหรับทุกกลุ่มที่ไม่มีรายการตรงกันแบบ exact (เป็นรูปแบบเดียวกับที่ใช้โดย `requireMention` และนโยบายเครื่องมือรายกลุ่ม) รายการแบบ exact จะมีลำดับความสำคัญเหนือ wildcard เสมอ ฟิลด์นี้จะไม่ใช้กับ DM; ให้ใช้การปรับแต่ง prompt ระดับเอเจนต์หรือระดับบัญชีแทน

#### ตัวอย่างการใช้งานจริง: การตอบกลับแบบเธรดและรีแอ็กชัน tapback (Private API)

เมื่อเปิดใช้ BlueBubbles Private API ข้อความขาเข้าจะมาพร้อมรหัสข้อความแบบสั้น (ตัวอย่างเช่น `[[reply_to:5]]`) และเอเจนต์สามารถเรียก `action=reply` เพื่อส่งตอบในข้อความที่กำหนด หรือ `action=react` เพื่อใส่ tapback ได้ การใช้ `systemPrompt` รายกลุ่มเป็นวิธีที่เชื่อถือได้ในการทำให้เอเจนต์เลือกใช้เครื่องมือที่ถูกต้อง:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "เมื่อโต้ตอบในกลุ่มนี้ ให้เรียก action=reply พร้อมกับ",
            "messageId แบบ [[reply_to:N]] จากบริบทเสมอ เพื่อให้การตอบกลับของคุณ",
            "อยู่ใต้ข้อความที่เป็นตัวกระตุ้น ห้ามส่งข้อความใหม่ที่ไม่เชื่อมโยง",
            "",
            "สำหรับการตอบรับสั้น ๆ ('ok', 'got it', 'on it') ให้ใช้",
            "action=react พร้อมอีโมจิ tapback ที่เหมาะสม (❤️, 👍, 😂, ‼️, ❓)",
            "แทนการส่งข้อความตอบกลับ",
          ].join(" "),
        },
      },
    },
  },
}
```

ทั้งรีแอ็กชัน tapback และการตอบกลับแบบเธรดต้องใช้ BlueBubbles Private API; ดู [Advanced actions](#advanced-actions) และ [Message IDs](#message-ids-short-vs-full) สำหรับกลไกพื้นฐาน

## การผูกบทสนทนา ACP

แชต BlueBubbles สามารถเปลี่ยนเป็นเวิร์กสเปซ ACP แบบถาวรได้โดยไม่ต้องเปลี่ยนเลเยอร์การขนส่ง

ขั้นตอนการใช้งานแบบรวดเร็วสำหรับโอเปอเรเตอร์:

- รัน `/acp spawn codex --bind here` ภายใน DM หรือแชตกลุ่มที่ได้รับอนุญาต
- ข้อความในอนาคตในบทสนทนา BlueBubbles เดียวกันนั้นจะถูกส่งไปยังเซสชัน ACP ที่ถูกสร้างขึ้น
- `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP ที่ผูกไว้อันเดิมในตำแหน่งเดิม
- `/acp close` จะปิดเซสชัน ACP และลบการผูก

ระบบยังรองรับการผูกแบบถาวรที่กำหนดค่าไว้ผ่านรายการ `bindings[]` ระดับบนสุด โดยใช้ `type: "acp"` และ `match.channel: "bluebubbles"`

`match.peer.id` สามารถใช้รูปแบบเป้าหมาย BlueBubbles ใดก็ได้ที่รองรับ:

- แฮนเดิล DM ที่ทำ normalization แล้ว เช่น `+15555550123` หรือ `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

สำหรับการผูกกลุ่มที่เสถียร แนะนำให้ใช้ `chat_id:*` หรือ `chat_identifier:*`

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

ดู [ACP Agents](/th/tools/acp-agents) สำหรับพฤติกรรมการผูก ACP ที่ใช้ร่วมกัน

## การพิมพ์ + ใบตอบรับการอ่าน

- **ตัวบ่งชี้การพิมพ์**: ส่งโดยอัตโนมัติก่อนและระหว่างการสร้างคำตอบ
- **ใบตอบรับการอ่าน**: ควบคุมโดย `channels.bluebubbles.sendReadReceipts` (ค่าเริ่มต้น: `true`)
- **ตัวบ่งชี้การพิมพ์**: OpenClaw ส่งเหตุการณ์เริ่มพิมพ์; BlueBubbles จะล้างสถานะการพิมพ์โดยอัตโนมัติเมื่อส่งหรือหมดเวลา (การหยุดด้วยตนเองผ่าน DELETE ไม่น่าเชื่อถือ)

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // ปิดใช้งานใบตอบรับการอ่าน
    },
  },
}
```

## การดำเนินการขั้นสูง

BlueBubbles รองรับการดำเนินการกับข้อความขั้นสูงเมื่อเปิดใช้งานในการกำหนดค่า:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback (ค่าเริ่มต้น: true)
        edit: true, // แก้ไขข้อความที่ส่งแล้ว (macOS 13+, ใช้งานไม่ได้บน macOS 26 Tahoe)
        unsend: true, // ยกเลิกส่งข้อความ (macOS 13+)
        reply: true, // เธรดการตอบกลับด้วย GUID ของข้อความ
        sendWithEffect: true, // เอฟเฟ็กต์ข้อความ (slam, loud เป็นต้น)
        renameGroup: true, // เปลี่ยนชื่อแชตกลุ่ม
        setGroupIcon: true, // ตั้งค่าไอคอน/รูปภาพแชตกลุ่ม (ไม่เสถียรบน macOS 26 Tahoe)
        addParticipant: true, // เพิ่มผู้เข้าร่วมในกลุ่ม
        removeParticipant: true, // ลบผู้เข้าร่วมออกจากกลุ่ม
        leaveGroup: true, // ออกจากแชตกลุ่ม
        sendAttachment: true, // ส่งไฟล์แนบ/สื่อ
      },
    },
  },
}
```

การดำเนินการที่ใช้ได้:

- **react**: เพิ่ม/ลบรีแอ็กชัน tapback (`messageId`, `emoji`, `remove`) ชุด tapback แบบเนทีฟของ iMessage คือ `love`, `like`, `dislike`, `laugh`, `emphasize` และ `question` เมื่อเอเจนต์เลือกอีโมจิที่อยู่นอกชุดนี้ (เช่น `👀`) เครื่องมือรีแอ็กชันจะ fallback ไปใช้ `love` เพื่อให้ tapback ยังแสดงผลได้แทนที่จะทำให้คำขอทั้งหมดล้มเหลว ส่วนรีแอ็กชันตอบรับที่กำหนดค่าไว้ยังคงตรวจสอบอย่างเข้มงวดและจะเกิดข้อผิดพลาดหากเป็นค่าที่ไม่รู้จัก
- **edit**: แก้ไขข้อความที่ส่งแล้ว (`messageId`, `text`)
- **unsend**: ยกเลิกส่งข้อความ (`messageId`)
- **reply**: ตอบกลับข้อความที่ระบุ (`messageId`, `text`, `to`)
- **sendWithEffect**: ส่งพร้อมเอฟเฟ็กต์ iMessage (`text`, `to`, `effectId`)
- **renameGroup**: เปลี่ยนชื่อแชตกลุ่ม (`chatGuid`, `displayName`)
- **setGroupIcon**: ตั้งค่าไอคอน/รูปภาพของแชตกลุ่ม (`chatGuid`, `media`) — ไม่เสถียรบน macOS 26 Tahoe (API อาจส่งกลับว่าสำเร็จ แต่ไอคอนไม่ซิงค์)
- **addParticipant**: เพิ่มบุคคลในกลุ่ม (`chatGuid`, `address`)
- **removeParticipant**: ลบบุคคลออกจากกลุ่ม (`chatGuid`, `address`)
- **leaveGroup**: ออกจากแชตกลุ่ม (`chatGuid`)
- **upload-file**: ส่งสื่อ/ไฟล์ (`to`, `buffer`, `filename`, `asVoice`)
  - บันทึกเสียง: ตั้งค่า `asVoice: true` พร้อมเสียง **MP3** หรือ **CAF** เพื่อส่งเป็นข้อความเสียง iMessage BlueBubbles จะแปลง MP3 → CAF เมื่อส่งบันทึกเสียง
- ชื่อแฝงแบบเดิม: `sendAttachment` ยังใช้งานได้ แต่ `upload-file` คือชื่อการดำเนินการมาตรฐาน

### รหัสข้อความ (แบบสั้นเทียบกับแบบเต็ม)

OpenClaw อาจแสดงรหัสข้อความแบบ _สั้น_ (เช่น `1`, `2`) เพื่อประหยัดโทเค็น

- `MessageSid` / `ReplyToId` อาจเป็นรหัสแบบสั้น
- `MessageSidFull` / `ReplyToIdFull` มีรหัสเต็มของผู้ให้บริการ
- รหัสแบบสั้นอยู่ในหน่วยความจำ; อาจหมดอายุเมื่อรีสตาร์ตหรือมีการล้างแคช
- การดำเนินการรองรับ `messageId` ทั้งแบบสั้นและแบบเต็ม แต่รหัสแบบสั้นจะเกิดข้อผิดพลาดหากไม่มีข้อมูลนั้นแล้ว

ใช้รหัสแบบเต็มสำหรับระบบอัตโนมัติและการจัดเก็บแบบถาวร:

- เทมเพลต: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- บริบท: `MessageSidFull` / `ReplyToIdFull` ใน payload ขาเข้า

ดู [Configuration](/th/gateway/configuration) สำหรับตัวแปรเทมเพลต

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## การรวม DM แบบแยกส่ง (คำสั่ง + URL ในการพิมพ์ครั้งเดียว)

เมื่อผู้ใช้พิมพ์คำสั่งและ URL พร้อมกันใน iMessage — เช่น `Dump https://example.com/article` — Apple จะแยกการส่งออกเป็น **การส่งผ่าน Webhook สองครั้งแยกกัน**:

1. ข้อความตัวอักษร (`"Dump"`)
2. บอลลูนแสดงตัวอย่าง URL (`"https://..."`) พร้อมรูปตัวอย่าง OG เป็นไฟล์แนบ

โดยทั่วไป Webhook ทั้งสองจะมาถึง OpenClaw ห่างกันประมาณ ~0.8-2.0 วินาทีในระบบส่วนใหญ่ หากไม่มีการรวม เอเจนต์จะได้รับเฉพาะคำสั่งในเทิร์นที่ 1 ตอบกลับไปก่อน (มักจะเป็น "ส่ง URL มาให้ฉัน") และจะเห็น URL ในเทิร์นที่ 2 เท่านั้น — ซึ่งตอนนั้นบริบทของคำสั่งหายไปแล้ว

`channels.bluebubbles.coalesceSameSenderDms` ใช้เลือกให้ DM รวม Webhook ที่ต่อเนื่องกันจากผู้ส่งคนเดียวกันเข้าเป็นเทิร์นเดียวของเอเจนต์ แชตกลุ่มยังคงใช้คีย์ตามข้อความแต่ละรายการเพื่อรักษาโครงสร้างเทิร์นแบบหลายผู้ใช้

### ควรเปิดใช้เมื่อใด

เปิดใช้เมื่อ:

- คุณมี Skills ที่คาดหวังให้ `คำสั่ง + payload` มาในข้อความเดียวกัน (dump, paste, save, queue เป็นต้น)
- ผู้ใช้ของคุณวาง URL รูปภาพ หรือเนื้อหายาวพร้อมกับคำสั่ง
- คุณยอมรับเวลาแฝงของเทิร์น DM ที่เพิ่มขึ้นได้ (ดูด้านล่าง)

ปล่อยปิดไว้เมื่อ:

- คุณต้องการเวลาแฝงต่ำที่สุดสำหรับคำสั่ง DM แบบคำเดียว
- ทุก flow ของคุณเป็นคำสั่งแบบ one-shot ที่ไม่มี payload ตามมา

### การเปิดใช้

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // เลือกเปิดใช้ (ค่าเริ่มต้น: false)
    },
  },
}
```

เมื่อเปิดแฟล็กนี้และไม่มีการกำหนด `messages.inbound.byChannel.bluebubbles` อย่างชัดเจน หน้าต่าง debounce จะขยายเป็น **2500 ms** (ค่าเริ่มต้นสำหรับกรณีไม่รวมคือ 500 ms) จำเป็นต้องใช้หน้าต่างที่กว้างขึ้นนี้ — จังหวะการแยกส่งของ Apple ที่ 0.8-2.0 วินาทีไม่พอดีกับค่าปริยายที่แคบกว่า

หากต้องการปรับหน้าต่างด้วยตนเอง:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms ใช้งานได้กับระบบส่วนใหญ่; เพิ่มเป็น 4000 ms หาก Mac ของคุณช้า
        // หรืออยู่ภายใต้แรงกดดันด้านหน่วยความจำ (มีการสังเกตว่าช่องว่างอาจยืดเกิน 2 วินาทีได้)
        bluebubbles: 2500,
      },
    },
  },
}
```

### ข้อแลกเปลี่ยน

- **เวลาแฝงเพิ่มขึ้นสำหรับคำสั่งควบคุม DM** เมื่อเปิดแฟล็กนี้ ข้อความคำสั่งควบคุม DM (เช่น `Dump`, `Save` เป็นต้น) จะรอสูงสุดตามหน้าต่าง debounce ก่อน dispatch เผื่อว่าจะมี Webhook ของ payload ตามมา ส่วนคำสั่งในแชตกลุ่มยังคง dispatch ทันที
- **ผลลัพธ์ที่รวมมีขอบเขตจำกัด** — ข้อความที่รวมแล้วจำกัดที่ 4000 อักขระพร้อมตัวบ่งชี้ `…[truncated]` อย่างชัดเจน; ไฟล์แนบจำกัดที่ 20; รายการต้นทางจำกัดที่ 10 (เก็บรายการแรกบวกกับรายการล่าสุดเมื่อเกินจากนั้น) ทุก `messageId` ต้นทางยังคงส่งต่อไปยัง inbound-dedupe เพื่อให้การ replay ภายหลังจาก MessagePoller ของเหตุการณ์ใดเหตุการณ์หนึ่งถูกจดจำว่าเป็นข้อมูลซ้ำ
- **เลือกเปิดใช้เป็นรายช่องทาง** ช่องทางอื่น (Telegram, WhatsApp, Slack, …) จะไม่ได้รับผลกระทบ

### สถานการณ์และสิ่งที่เอเจนต์เห็น

| สิ่งที่ผู้ใช้พิมพ์                                                    | สิ่งที่ Apple ส่งมา      | ปิดแฟล็ก (ค่าเริ่มต้น)                  | เปิดแฟล็ก + หน้าต่าง 2500 ms                                             |
| ---------------------------------------------------------------------- | ------------------------ | ---------------------------------------- | ------------------------------------------------------------------------- |
| `Dump https://example.com` (ส่งครั้งเดียว)                            | 2 Webhook ห่างกัน ~1 วินาที | เอเจนต์ 2 เทิร์น: มีแค่ "Dump" แล้วค่อย URL | 1 เทิร์น: ข้อความที่รวมแล้ว `Dump https://example.com`                  |
| `Save this 📎image.jpg caption` (ไฟล์แนบ + ข้อความ)                   | 2 Webhook                | 2 เทิร์น                                 | 1 เทิร์น: ข้อความ + รูปภาพ                                                |
| `/status` (คำสั่งเดี่ยว)                                               | 1 Webhook                | dispatch ทันที                           | **รอได้สูงสุดตามหน้าต่าง แล้วจึง dispatch**                               |
| วาง URL เพียงอย่างเดียว                                                | 1 Webhook                | dispatch ทันที                           | dispatch ทันที (มีเพียงรายการเดียวในบัคเก็ต)                              |
| ข้อความ + URL ที่ส่งแยกกันโดยตั้งใจ ห่างกันเป็นนาที                  | 2 Webhook นอกหน้าต่าง    | 2 เทิร์น                                 | 2 เทิร์น (หน้าต่างหมดอายุระหว่างสองรายการ)                               |
| ส่งถี่มากอย่างรวดเร็ว (>10 DM สั้น ๆ ภายในหน้าต่าง)                  | N Webhook                | N เทิร์น                                 | 1 เทิร์น, ผลลัพธ์แบบมีขอบเขต (ใช้รายการแรก + ล่าสุด พร้อมจำกัดข้อความ/ไฟล์แนบ) |

### การแก้ไขปัญหาการรวม split-send

หากเปิดแฟล็กแล้วแต่ split-send ยังมาถึงเป็นสองเทิร์น ให้ตรวจสอบแต่ละชั้นดังนี้:

1. **โหลดการกำหนดค่าจริงแล้ว**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   จากนั้นรัน `openclaw gateway restart` — แฟล็กนี้จะถูกอ่านตอนสร้าง debouncer-registry

2. **หน้าต่าง debounce กว้างพอสำหรับระบบของคุณหรือไม่** ดู log ของเซิร์ฟเวอร์ BlueBubbles ที่ `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   วัดช่วงเวลาระหว่างการ dispatch ข้อความแบบ `"Dump"` กับการ dispatch `"https://..."; Attachments:` ที่ตามมา จากนั้นเพิ่ม `messages.inbound.byChannel.bluebubbles` ให้ครอบคลุมช่วงเวลานั้นอย่างสบาย

3. **timestamp ใน JSONL ของเซสชัน ≠ เวลาที่ Webhook มาถึง** timestamp ของเหตุการณ์ในเซสชัน (`~/.openclaw/agents/<id>/sessions/*.jsonl`) สะท้อนเวลาที่ Gateway ส่งข้อความให้เอเจนต์ **ไม่ใช่** เวลาที่ Webhook มาถึง หากข้อความที่สองถูกติดแท็ก `[Queued messages while agent was busy]` แปลว่าเทิร์นแรกยังทำงานอยู่ตอนที่ Webhook ที่สองมาถึง — บัคเก็ตการรวมได้ flush ไปแล้ว ให้ปรับหน้าต่างจาก log ของเซิร์ฟเวอร์ BB ไม่ใช่จาก session log

4. **แรงกดดันด้านหน่วยความจำทำให้การ dispatch คำตอบช้าลง** บนเครื่องขนาดเล็กกว่า (8 GB) เทิร์นของเอเจนต์อาจใช้เวลานานจนบัคเก็ตการรวม flush ก่อนที่คำตอบจะเสร็จ และ URL จะเข้าเป็นเทิร์นที่สองแบบ queued ให้ตรวจสอบ `memory_pressure` และ `ps -o rss -p $(pgrep openclaw-gateway)`; หาก Gateway ใช้ RSS เกิน ~500 MB และตัวบีบอัดกำลังทำงาน ให้ปิดโปรเซสหนักอื่น ๆ หรือขยับไปใช้โฮสต์ที่ใหญ่ขึ้น

5. **การส่งแบบ reply-quote เป็นอีกเส้นทางหนึ่ง** หากผู้ใช้แตะ `Dump` เป็น **การตอบกลับ** ไปยัง URL-balloon ที่มีอยู่แล้ว (iMessage จะแสดงป้าย "1 Reply" บนบับเบิล Dump) URL จะอยู่ใน `replyToBody` ไม่ได้อยู่ใน Webhook ตัวที่สอง การรวมจะไม่เกี่ยวข้อง — นี่เป็นประเด็นของ skill/prompt ไม่ใช่ของ debouncer

## Block streaming

ควบคุมว่าจะส่งคำตอบเป็นข้อความเดียวหรือสตรีมเป็นบล็อก:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // เปิดใช้ block streaming (ปิดเป็นค่าเริ่มต้น)
    },
  },
}
```

## สื่อ + ข้อจำกัด

- ไฟล์แนบขาเข้าจะถูกดาวน์โหลดและจัดเก็บไว้ในแคชสื่อ
- จำกัดขนาดสื่อผ่าน `channels.bluebubbles.mediaMaxMb` สำหรับสื่อขาเข้าและขาออก (ค่าเริ่มต้น: 8 MB)
- ข้อความขาออกจะถูกแบ่งเป็นส่วนตาม `channels.bluebubbles.textChunkLimit` (ค่าเริ่มต้น: 4000 อักขระ)

## เอกสารอ้างอิงการกำหนดค่า

การกำหนดค่าแบบเต็ม: [Configuration](/th/gateway/configuration)

ตัวเลือกของผู้ให้บริการ:

- `channels.bluebubbles.enabled`: เปิด/ปิดใช้งานช่องทาง
- `channels.bluebubbles.serverUrl`: URL ฐานของ BlueBubbles REST API
- `channels.bluebubbles.password`: รหัสผ่าน API
- `channels.bluebubbles.webhookPath`: พาธปลายทาง Webhook (ค่าเริ่มต้น: `/bluebubbles-webhook`)
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: `pairing`)
- `channels.bluebubbles.allowFrom`: allowlist สำหรับ DM (แฮนเดิล, อีเมล, หมายเลข E.164, `chat_id:*`, `chat_guid:*`)
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`)
- `channels.bluebubbles.groupAllowFrom`: allowlist ของผู้ส่งในกลุ่ม
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: บน macOS สามารถเลือกเพิ่มข้อมูลผู้เข้าร่วมกลุ่มที่ไม่มีชื่อจาก Contacts ในเครื่องได้หลังผ่าน gating แล้ว ค่าเริ่มต้น: `false`
- `channels.bluebubbles.groups`: การกำหนดค่ารายกลุ่ม (`requireMention` เป็นต้น)
- `channels.bluebubbles.sendReadReceipts`: ส่งใบตอบรับการอ่าน (ค่าเริ่มต้น: `true`)
- `channels.bluebubbles.blockStreaming`: เปิดใช้ block streaming (ค่าเริ่มต้น: `false`; จำเป็นสำหรับการตอบกลับแบบสตรีม)
- `channels.bluebubbles.textChunkLimit`: ขนาด chunk ขาออกเป็นจำนวนอักขระ (ค่าเริ่มต้น: 4000)
- `channels.bluebubbles.sendTimeoutMs`: ระยะหมดเวลาต่อคำขอในหน่วย ms สำหรับการส่งข้อความขาออกผ่าน `/api/v1/message/text` (ค่าเริ่มต้น: 30000) เพิ่มค่านี้ในระบบ macOS 26 ที่การส่ง iMessage ผ่าน Private API อาจค้างในเฟรมเวิร์ก iMessage นานเกิน 60 วินาที; ตัวอย่างเช่น `45000` หรือ `60000` ปัจจุบัน probe, การค้นหาแชต, รีแอ็กชัน, การแก้ไข และการตรวจสอบสถานะยังคงใช้ค่าเริ่มต้นที่สั้นกว่า 10 วินาที; มีแผนจะขยายให้ครอบคลุมรีแอ็กชันและการแก้ไขในภายหลัง การเขียนทับค่ารายบัญชี: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`
- `channels.bluebubbles.chunkMode`: `length` (ค่าเริ่มต้น) จะแบ่งเฉพาะเมื่อเกิน `textChunkLimit`; `newline` จะแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- `channels.bluebubbles.mediaMaxMb`: เพดานขนาดสื่อขาเข้า/ขาออกเป็น MB (ค่าเริ่มต้น: 8)
- `channels.bluebubbles.mediaLocalRoots`: allowlist แบบระบุชัดของไดเรกทอรีภายในเครื่องแบบ absolute ที่อนุญาตสำหรับพาธสื่อขาออกในเครื่อง การส่งพาธในเครื่องจะถูกปฏิเสธเป็นค่าเริ่มต้นหากไม่ได้กำหนดค่านี้ การเขียนทับค่ารายบัญชี: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`
- `channels.bluebubbles.coalesceSameSenderDms`: รวม Webhook DM ที่ต่อเนื่องกันจากผู้ส่งคนเดียวกันให้เป็นเทิร์นเดียวของเอเจนต์ เพื่อให้การแยกส่งข้อความ+URL ของ Apple มาถึงเป็นข้อความเดียว (ค่าเริ่มต้น: `false`) ดู [การรวม DM แบบแยกส่ง](#coalescing-split-send-dms-command--url-in-one-composition) สำหรับสถานการณ์ การปรับหน้าต่าง และข้อแลกเปลี่ยน เมื่อเปิดใช้งานโดยไม่มีการกำหนด `messages.inbound.byChannel.bluebubbles` อย่างชัดเจน ระบบจะขยายหน้าต่าง debounce ขาเข้าปริยายจาก 500 ms เป็น 2500 ms
- `channels.bluebubbles.historyLimit`: จำนวนข้อความกลุ่มสูงสุดสำหรับบริบท (0 คือปิดใช้งาน)
- `channels.bluebubbles.dmHistoryLimit`: ขีดจำกัดประวัติ DM
- `channels.bluebubbles.actions`: เปิด/ปิดใช้งานการดำเนินการเฉพาะ
- `channels.bluebubbles.accounts`: การกำหนดค่าแบบหลายบัญชี

ตัวเลือกส่วนกลางที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (หรือ `messages.groupChat.mentionPatterns`)
- `messages.responsePrefix`

## การอ้างที่อยู่ / เป้าหมายการส่ง

แนะนำให้ใช้ `chat_guid` สำหรับการกำหนดเส้นทางที่เสถียร:

- `chat_guid:iMessage;-;+15555550123` (แนะนำสำหรับกลุ่ม)
- `chat_id:123`
- `chat_identifier:...`
- แฮนเดิลโดยตรง: `+15555550123`, `user@example.com`
  - หากแฮนเดิลโดยตรงยังไม่มีแชต DM อยู่ OpenClaw จะสร้างแชตใหม่ผ่าน `POST /api/v1/chat/new` ซึ่งต้องเปิดใช้ BlueBubbles Private API

### การกำหนดเส้นทาง iMessage เทียบกับ SMS

เมื่อแฮนเดิลเดียวกันมีทั้งแชต iMessage และแชต SMS อยู่บน Mac (ตัวอย่างเช่น หมายเลขโทรศัพท์ที่ลงทะเบียน iMessage แต่เคยได้รับข้อความ fallback แบบบับเบิลสีเขียวด้วย) OpenClaw จะเลือกแชต iMessage ก่อนและจะไม่ลดระดับไปใช้ SMS แบบเงียบ ๆ หากต้องการบังคับใช้แชต SMS ให้ใช้คำนำหน้าเป้าหมาย `sms:` แบบชัดเจน (ตัวอย่างเช่น `sms:+15555550123`) สำหรับแฮนเดิลที่ไม่มีแชต iMessage ที่ตรงกัน ระบบจะยังส่งผ่านแชตใดก็ตามที่ BlueBubbles รายงาน

## ความปลอดภัย

- คำขอ Webhook จะยืนยันตัวตนโดยเปรียบเทียบ query param หรือ header ของ `guid`/`password` กับ `channels.bluebubbles.password`
- เก็บรหัสผ่าน API และปลายทาง Webhook เป็นความลับ (ถือว่าเป็นข้อมูลรับรอง)
- ไม่มีการ bypass localhost สำหรับการยืนยันตัวตน Webhook ของ BlueBubbles หากคุณ proxy ทราฟฟิก Webhook ให้คงรหัสผ่าน BlueBubbles ไว้ในคำขอตั้งแต่ต้นทางถึงปลายทาง `gateway.trustedProxies` ไม่ได้ใช้แทน `channels.bluebubbles.password` ในกรณีนี้ ดู [Gateway security](/th/gateway/security#reverse-proxy-configuration)
- เปิดใช้ HTTPS + กฎไฟร์วอลล์บนเซิร์ฟเวอร์ BlueBubbles หากมีการเปิดให้เข้าถึงนอก LAN ของคุณ

## การแก้ไขปัญหา

- หากเหตุการณ์การพิมพ์/การอ่านหยุดทำงาน ให้ตรวจสอบ log ของ Webhook ใน BlueBubbles และยืนยันว่าพาธ Gateway ตรงกับ `channels.bluebubbles.webhookPath`
- รหัสการจับคู่จะหมดอายุหลังหนึ่งชั่วโมง; ใช้ `openclaw pairing list bluebubbles` และ `openclaw pairing approve bluebubbles <code>`
- รีแอ็กชันต้องใช้ BlueBubbles private API (`POST /api/v1/message/react`); ตรวจสอบให้แน่ใจว่าเวอร์ชันเซิร์ฟเวอร์รองรับ
- การแก้ไข/ยกเลิกส่งต้องใช้ macOS 13+ และเวอร์ชันเซิร์ฟเวอร์ BlueBubbles ที่เข้ากันได้ บน macOS 26 (Tahoe) การแก้ไขยังใช้งานไม่ได้ในขณะนี้เนื่องจากการเปลี่ยนแปลงใน private API
- การอัปเดตไอคอนกลุ่มอาจไม่เสถียรบน macOS 26 (Tahoe): API อาจตอบกลับว่าสำเร็จ แต่ไอคอนใหม่ไม่ซิงค์
- OpenClaw จะซ่อนการดำเนินการที่ทราบว่าใช้งานไม่ได้โดยอัตโนมัติตามเวอร์ชัน macOS ของเซิร์ฟเวอร์ BlueBubbles หาก `edit` ยังแสดงอยู่บน macOS 26 (Tahoe) ให้ปิดด้วยตนเองโดยใช้ `channels.bluebubbles.actions.edit=false`
- เปิดใช้ `coalesceSameSenderDms` แล้วแต่ split-send (เช่น `Dump` + URL) ยังมาถึงเป็นสองเทิร์น: ดูรายการตรวจสอบ [การแก้ไขปัญหาการรวม split-send](#split-send-coalescing-troubleshooting) — สาเหตุที่พบบ่อยคือหน้าต่าง debounce แคบเกินไป, การอ่าน timestamp ของ session log ผิดว่าเป็นเวลาที่ Webhook มาถึง, หรือเป็นการส่งแบบ reply-quote (ซึ่งใช้ `replyToBody` ไม่ใช่ Webhook ตัวที่สอง)
- สำหรับข้อมูลสถานะ/สุขภาพระบบ: `openclaw status --all` หรือ `openclaw status --deep`

สำหรับเอกสารอ้างอิงเวิร์กโฟลว์ช่องทางทั่วไป ดู [Channels](/th/channels) และคู่มือ [Plugins](/th/tools/plugin)

## ที่เกี่ยวข้อง

- [Channels Overview](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และ flow การจับคู่
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและ mention gating
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้แข็งแกร่งขึ้น
