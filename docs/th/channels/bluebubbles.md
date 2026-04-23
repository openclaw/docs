---
read_when:
    - การตั้งค่าช่องทาง BlueBubbles
    - การแก้ไขปัญหาการจับคู่ Webhook
    - การกำหนดค่า iMessage บน macOS
summary: iMessage ผ่านเซิร์ฟเวอร์ BlueBubbles บน macOS (การส่ง/รับผ่าน REST, การพิมพ์, รีแอ็กชัน, การจับคู่, การดำเนินการขั้นสูง)
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-23T10:13:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1c1670bb453a1f78bb8e35e4b7065ceeba46ce93180e1288745621f8c4179c9
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

สถานะ: Plugin ที่มาพร้อมในชุด ซึ่งสื่อสารกับเซิร์ฟเวอร์ BlueBubbles บน macOS ผ่าน HTTP **แนะนำสำหรับการผสานรวม iMessage** เนื่องจากมี API ที่ครบกว่ามากและตั้งค่าได้ง่ายกว่าเมื่อเทียบกับช่องทาง imsg แบบเดิม

## Plugin ที่มาพร้อมในชุด

OpenClaw รุ่นปัจจุบันมาพร้อมกับ BlueBubbles ดังนั้นบิลด์แพ็กเกจปกติจึงไม่
จำเป็นต้องมีขั้นตอน `openclaw plugins install` แยกต่างหาก

## ภาพรวม

- ทำงานบน macOS ผ่านแอปช่วยเหลือ BlueBubbles ([bluebubbles.app](https://bluebubbles.app))
- แนะนำ/ทดสอบแล้ว: macOS Sequoia (15) ใช้งานได้บน macOS Tahoe (26); อย่างไรก็ตาม ขณะนี้การแก้ไขข้อความใช้ไม่ได้บน Tahoe และการอัปเดตไอคอนกลุ่มอาจรายงานว่าสำเร็จแต่ไม่ซิงก์
- OpenClaw สื่อสารกับระบบนี้ผ่าน REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`)
- ข้อความขาเข้ามาถึงผ่าน Webhook; การตอบกลับขาออก ตัวบ่งชี้การพิมพ์ ใบตอบรับการอ่าน และ tapback ใช้การเรียก REST
- ไฟล์แนบและสติกเกอร์จะถูกรับเข้าเป็นสื่อขาเข้า (และแสดงให้ agent เห็นเมื่อเป็นไปได้)
- การจับคู่/allowlist ทำงานเหมือนกับช่องทางอื่น (`/channels/pairing` เป็นต้น) โดยใช้ `channels.bluebubbles.allowFrom` + รหัสการจับคู่
- รีแอ็กชันจะแสดงเป็นเหตุการณ์ระบบเช่นเดียวกับ Slack/Telegram เพื่อให้ agent สามารถ "กล่าวถึง" รีแอ็กชันเหล่านั้นก่อนตอบกลับ
- ความสามารถขั้นสูง: แก้ไข ยกเลิกส่ง เธรดการตอบกลับ เอฟเฟกต์ข้อความ การจัดการกลุ่ม

## เริ่มต้นอย่างรวดเร็ว

1. ติดตั้งเซิร์ฟเวอร์ BlueBubbles บน Mac ของคุณ (ทำตามคำแนะนำที่ [bluebubbles.app/install](https://bluebubbles.app/install))
2. ในการกำหนดค่า BlueBubbles ให้เปิดใช้งาน web API และตั้งรหัสผ่าน
3. เรียกใช้ `openclaw onboard` แล้วเลือก BlueBubbles หรือกำหนดค่าด้วยตนเอง:

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
5. เริ่มต้น Gateway; ระบบจะลงทะเบียนตัวจัดการ Webhook และเริ่มการจับคู่

หมายเหตุด้านความปลอดภัย:

- ตั้งรหัสผ่าน Webhook เสมอ
- จำเป็นต้องมีการยืนยันตัวตนของ Webhook เสมอ OpenClaw จะปฏิเสธคำขอ Webhook ของ BlueBubbles หากคำขอนั้นไม่มี password/guid ที่ตรงกับ `channels.bluebubbles.password` (เช่น `?password=<password>` หรือ `x-password`) โดยไม่ขึ้นกับโทโพโลยี loopback/proxy
- ระบบจะตรวจสอบการยืนยันตัวตนด้วยรหัสผ่านก่อนอ่าน/แยกวิเคราะห์เนื้อหา Webhook แบบเต็ม

## ทำให้ Messages.app ทำงานอยู่เสมอ (การตั้งค่า VM / headless)

การตั้งค่าบางแบบของ macOS VM / always-on อาจทำให้ Messages.app เข้าสู่สถานะ “idle” ได้ (เหตุการณ์ขาเข้าหยุดจนกว่าจะเปิดแอปหรือทำให้แอปอยู่เบื้องหน้า) วิธีแก้ง่าย ๆ คือ **กระตุ้น Messages ทุก 5 นาที** โดยใช้ AppleScript + LaunchAgent

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

- การตั้งค่านี้จะทำงาน **ทุก 300 วินาที** และ **เมื่อเข้าสู่ระบบ**
- การรันครั้งแรกอาจทำให้ macOS แสดงพรอมต์ **Automation** (`osascript` → Messages) ให้อนุมัติภายในเซสชันผู้ใช้เดียวกับที่รัน LaunchAgent

โหลดด้วยคำสั่ง:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## การตั้งค่าเริ่มต้น

BlueBubbles พร้อมใช้งานในการตั้งค่าแบบโต้ตอบ:

```
openclaw onboard
```

ตัวช่วยสร้างจะถามข้อมูลต่อไปนี้:

- **Server URL** (จำเป็น): ที่อยู่เซิร์ฟเวอร์ BlueBubbles (เช่น `http://192.168.1.100:1234`)
- **Password** (จำเป็น): รหัสผ่าน API จากการตั้งค่า BlueBubbles Server
- **Webhook path** (ไม่บังคับ): ค่าเริ่มต้นคือ `/bluebubbles-webhook`
- **DM policy**: pairing, allowlist, open หรือ disabled
- **Allow list**: หมายเลขโทรศัพท์ อีเมล หรือเป้าหมายแชต

คุณยังสามารถเพิ่ม BlueBubbles ผ่าน CLI ได้:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

DM:

- ค่าเริ่มต้น: `channels.bluebubbles.dmPolicy = "pairing"`
- ผู้ส่งที่ไม่รู้จักจะได้รับรหัสการจับคู่; ข้อความจะถูกเพิกเฉยจนกว่าจะได้รับอนุมัติ (รหัสหมดอายุภายใน 1 ชั่วโมง)
- อนุมัติผ่าน:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- การจับคู่คือการแลกเปลี่ยนโทเค็นเริ่มต้น รายละเอียด: [Pairing](/th/channels/pairing)

กลุ่ม:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`)
- `channels.bluebubbles.groupAllowFrom` ควบคุมว่าใครสามารถทริกเกอร์ในกลุ่มได้เมื่อมีการตั้งค่า `allowlist`

### การเติมชื่อผู้ติดต่อ (macOS, ไม่บังคับ)

Webhook ของกลุ่ม BlueBubbles มักมีเพียงที่อยู่ผู้เข้าร่วมแบบดิบเท่านั้น หากคุณต้องการให้บริบท `GroupMembers` แสดงชื่อผู้ติดต่อในเครื่องแทน คุณสามารถเลือกใช้การเติมข้อมูลจาก Contacts ในเครื่องบน macOS ได้:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` เปิดใช้การค้นหานี้ ค่าเริ่มต้น: `false`
- การค้นหาจะทำงานหลังจากที่การเข้าถึงกลุ่ม การอนุญาตคำสั่ง และ mention gating อนุญาตให้ข้อความผ่านแล้วเท่านั้น
- จะเติมข้อมูลเฉพาะผู้เข้าร่วมที่เป็นหมายเลขโทรศัพท์และยังไม่มีชื่อเท่านั้น
- หมายเลขโทรศัพท์ดิบจะยังคงใช้เป็นค่าทดแทนเมื่อไม่พบรายการที่ตรงกันในเครื่อง

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

BlueBubbles รองรับ mention gating สำหรับแชตกลุ่ม โดยทำงานสอดคล้องกับ iMessage/WhatsApp:

- ใช้ `agents.list[].groupChat.mentionPatterns` (หรือ `messages.groupChat.mentionPatterns`) เพื่อตรวจจับการกล่าวถึง
- เมื่อเปิด `requireMention` สำหรับกลุ่ม agent จะตอบกลับเฉพาะเมื่อถูกกล่าวถึง
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
        "iMessage;-;chat123": { requireMention: false }, // แทนที่สำหรับกลุ่มเฉพาะ
      },
    },
  },
}
```

### Command gating

- คำสั่งควบคุม (เช่น `/config`, `/model`) ต้องมีการอนุญาต
- ใช้ `allowFrom` และ `groupAllowFrom` เพื่อกำหนดการอนุญาตคำสั่ง
- ผู้ส่งที่ได้รับอนุญาตสามารถเรียกใช้คำสั่งควบคุมได้แม้ไม่มีการกล่าวถึงในกลุ่ม

### system prompt รายกลุ่ม

แต่ละรายการภายใต้ `channels.bluebubbles.groups.*` รองรับสตริง `systemPrompt` แบบไม่บังคับ ค่านี้จะถูกฉีดเข้าไปใน system prompt ของ agent ทุกครั้งที่จัดการข้อความในกลุ่มนั้น ดังนั้นคุณจึงสามารถกำหนดบุคลิกหรือนโยบายพฤติกรรมรายกลุ่มได้โดยไม่ต้องแก้ไขพรอมต์ของ agent:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "ให้ตอบไม่เกิน 3 ประโยค สะท้อนโทนสบาย ๆ ของกลุ่ม",
        },
      },
    },
  },
}
```

คีย์นี้ต้องตรงกับค่าที่ BlueBubbles รายงานเป็น `chatGuid` / `chatIdentifier` / `chatId` แบบตัวเลขสำหรับกลุ่มนั้น และรายการ wildcard `"*"` จะใช้เป็นค่าเริ่มต้นสำหรับทุกกลุ่มที่ไม่มีรายการตรงกันแบบ exact (รูปแบบเดียวกับที่ใช้โดย `requireMention` และนโยบายเครื่องมือรายกลุ่ม) รายการที่ตรงกันแบบ exact จะมีลำดับความสำคัญเหนือ wildcard เสมอ ฟิลด์นี้จะไม่ใช้กับ DM; หากต้องการปรับแต่ง ให้ใช้การปรับแต่ง prompt ระดับ agent หรือระดับบัญชีแทน

#### ตัวอย่างการใช้งานจริง: การตอบกลับแบบเธรดและรีแอ็กชัน tapback (Private API)

เมื่อเปิดใช้ BlueBubbles Private API ข้อความขาเข้าจะมาพร้อมรหัสข้อความแบบสั้น (เช่น `[[reply_to:5]]`) และ agent สามารถเรียก `action=reply` เพื่อเธรดเข้าไปในข้อความเฉพาะ หรือ `action=react` เพื่อส่ง tapback ได้ `systemPrompt` รายกลุ่มเป็นวิธีที่เชื่อถือได้ในการทำให้ agent เลือกเครื่องมือที่ถูกต้อง:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "เมื่อโต้ตอบในกลุ่มนี้ ให้เรียก action=reply พร้อม",
            "messageId แบบ [[reply_to:N]] จากบริบทเสมอ เพื่อให้คำตอบของคุณเธรด",
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

ทั้งรีแอ็กชัน tapback และการตอบกลับแบบเธรดต้องใช้ BlueBubbles Private API; ดูกลไกพื้นฐานได้ที่ [Advanced actions](#advanced-actions) และ [Message IDs](#message-ids-short-vs-full)

## การผูกการสนทนา ACP

แชต BlueBubbles สามารถเปลี่ยนเป็นเวิร์กสเปซ ACP แบบคงทนได้โดยไม่ต้องเปลี่ยนเลเยอร์การขนส่ง

ขั้นตอนการทำงานอย่างรวดเร็วสำหรับผู้ปฏิบัติงาน:

- เรียกใช้ `/acp spawn codex --bind here` ภายใน DM หรือแชตกลุ่มที่ได้รับอนุญาต
- ข้อความในอนาคตในบทสนทนา BlueBubbles เดียวกันนั้นจะถูกส่งไปยังเซสชัน ACP ที่สร้างขึ้น
- `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมในตำแหน่งเดิม
- `/acp close` จะปิดเซสชัน ACP และลบการผูกออก

นอกจากนี้ยังรองรับการผูกแบบคงทนที่กำหนดค่าไว้ผ่านรายการ `bindings[]` ระดับบนสุด โดยใช้ `type: "acp"` และ `match.channel: "bluebubbles"`

`match.peer.id` สามารถใช้รูปแบบเป้าหมาย BlueBubbles ที่รองรับได้ทุกรูปแบบ:

- handle ของ DM ที่ทำ normalization แล้ว เช่น `+15555550123` หรือ `user@example.com`
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

ดูพฤติกรรมการผูก ACP ที่ใช้ร่วมกันได้ที่ [ACP Agents](/th/tools/acp-agents)

## การพิมพ์ + ใบตอบรับการอ่าน

- **ตัวบ่งชี้การพิมพ์**: ถูกส่งโดยอัตโนมัติก่อนและระหว่างการสร้างการตอบกลับ
- **ใบตอบรับการอ่าน**: ควบคุมโดย `channels.bluebubbles.sendReadReceipts` (ค่าเริ่มต้น: `true`)
- **ตัวบ่งชี้การพิมพ์**: OpenClaw ส่งเหตุการณ์เริ่มพิมพ์; BlueBubbles จะล้างสถานะการพิมพ์โดยอัตโนมัติเมื่อส่งข้อความหรือเมื่อหมดเวลา (การหยุดด้วยตนเองผ่าน DELETE ไม่เสถียร)

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
        reactions: true, // tapback (ค่าเริ่มต้น: true)
        edit: true, // แก้ไขข้อความที่ส่งแล้ว (macOS 13+, ใช้งานไม่ได้บน macOS 26 Tahoe)
        unsend: true, // ยกเลิกส่งข้อความ (macOS 13+)
        reply: true, // ตอบกลับแบบเธรดตาม message GUID
        sendWithEffect: true, // เอฟเฟกต์ข้อความ (slam, loud เป็นต้น)
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

การดำเนินการที่พร้อมใช้งาน:

- **react**: เพิ่ม/ลบรีแอ็กชัน tapback (`messageId`, `emoji`, `remove`) ชุด tapback แบบเนทีฟของ iMessage คือ `love`, `like`, `dislike`, `laugh`, `emphasize` และ `question` เมื่อ agent เลือกอีโมจินอกชุดนี้ (เช่น `👀`) เครื่องมือรีแอ็กชันจะ fallback ไปใช้ `love` เพื่อให้ tapback ยังแสดงผลแทนที่จะทำให้ทั้งคำขอล้มเหลว รีแอ็กชันตอบรับที่กำหนดค่าไว้ยังคงตรวจสอบอย่างเข้มงวดและจะ error หากเป็นค่าที่ไม่รู้จัก
- **edit**: แก้ไขข้อความที่ส่งแล้ว (`messageId`, `text`)
- **unsend**: ยกเลิกส่งข้อความ (`messageId`)
- **reply**: ตอบกลับข้อความที่ระบุ (`messageId`, `text`, `to`)
- **sendWithEffect**: ส่งพร้อมเอฟเฟกต์ iMessage (`text`, `to`, `effectId`)
- **renameGroup**: เปลี่ยนชื่อแชตกลุ่ม (`chatGuid`, `displayName`)
- **setGroupIcon**: ตั้งค่าไอคอน/รูปภาพของแชตกลุ่ม (`chatGuid`, `media`) — ไม่เสถียรบน macOS 26 Tahoe (API อาจรายงานว่าสำเร็จ แต่ไอคอนไม่ซิงก์)
- **addParticipant**: เพิ่มบุคคลเข้าไปในกลุ่ม (`chatGuid`, `address`)
- **removeParticipant**: ลบบุคคลออกจากกลุ่ม (`chatGuid`, `address`)
- **leaveGroup**: ออกจากแชตกลุ่ม (`chatGuid`)
- **upload-file**: ส่งสื่อ/ไฟล์ (`to`, `buffer`, `filename`, `asVoice`)
  - บันทึกเสียง: ตั้งค่า `asVoice: true` พร้อมเสียง **MP3** หรือ **CAF** เพื่อส่งเป็นข้อความเสียง iMessage BlueBubbles จะแปลง MP3 → CAF เมื่อส่งบันทึกเสียง
- alias แบบเดิม: `sendAttachment` ยังใช้งานได้ แต่ `upload-file` คือชื่อการดำเนินการมาตรฐาน

### Message IDs (แบบสั้นเทียบกับแบบเต็ม)

OpenClaw อาจแสดงรหัสข้อความแบบ _สั้น_ (เช่น `1`, `2`) เพื่อประหยัดโทเค็น

- `MessageSid` / `ReplyToId` อาจเป็นรหัสแบบสั้น
- `MessageSidFull` / `ReplyToIdFull` มีรหัสแบบเต็มของ provider
- รหัสแบบสั้นเก็บไว้ในหน่วยความจำ; อาจหมดอายุเมื่อรีสตาร์ตหรือเมื่อ cache ถูกไล่ออก
- การดำเนินการรองรับ `messageId` ทั้งแบบสั้นและแบบเต็ม แต่รหัสแบบสั้นจะ error หากไม่มีข้อมูลนั้นแล้ว

ให้ใช้รหัสแบบเต็มสำหรับระบบอัตโนมัติและการจัดเก็บแบบคงทน:

- เทมเพลต: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- บริบท: `MessageSidFull` / `ReplyToIdFull` ใน payload ขาเข้า

ดูตัวแปรเทมเพลตได้ที่ [Configuration](/th/gateway/configuration)

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## การรวม DM ที่ถูกแยกส่ง (คำสั่ง + URL ในการพิมพ์ครั้งเดียว)

เมื่อผู้ใช้พิมพ์คำสั่งและ URL พร้อมกันใน iMessage — เช่น `Dump https://example.com/article` — Apple จะแยกการส่งออกเป็น **การส่ง Webhook สองครั้งแยกกัน**:

1. ข้อความข้อความล้วน (`"Dump"`)
2. บอลลูนพรีวิว URL (`"https://..."`) พร้อมรูปพรีวิว OG เป็นไฟล์แนบ

Webhook ทั้งสองจะมาถึง OpenClaw ห่างกันประมาณ ~0.8-2.0 วินาทีในระบบส่วนใหญ่ หากไม่มีการรวม agent จะได้รับเฉพาะคำสั่งในเทิร์นที่ 1 ตอบกลับ (มักเป็น "ส่ง URL มาให้ฉัน") และจะเห็น URL ในเทิร์นที่ 2 เท่านั้น — ซึ่งตอนนั้นบริบทของคำสั่งเดิมได้หายไปแล้ว

`channels.bluebubbles.coalesceSameSenderDms` ใช้เปิดการรวม Webhook ต่อเนื่องจากผู้ส่งคนเดียวกันใน DM ให้เป็นเทิร์นเดียวของ agent แชตกลุ่มยังคงใช้คีย์แยกตามแต่ละข้อความ เพื่อคงโครงสร้างเทิร์นแบบหลายผู้ใช้ไว้

### ควรเปิดใช้เมื่อใด

เปิดใช้เมื่อ:

- คุณมี Skills ที่คาดหวัง `command + payload` ในข้อความเดียวกัน (dump, paste, save, queue เป็นต้น)
- ผู้ใช้ของคุณวาง URL รูปภาพ หรือเนื้อหายาวร่วมกับคำสั่ง
- คุณยอมรับ latency ที่เพิ่มขึ้นของเทิร์น DM ได้ (ดูด้านล่าง)

ปล่อยให้ปิดไว้เมื่อ:

- คุณต้องการ latency ต่ำสุดสำหรับการทริกเกอร์ DM แบบคำเดียว
- ทุก flow ของคุณเป็นคำสั่งแบบครั้งเดียวที่ไม่มี payload ตามมา

### การเปิดใช้งาน

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // เปิดใช้แบบ opt-in (ค่าเริ่มต้น: false)
    },
  },
}
```

เมื่อเปิดแฟลกนี้ และไม่มีการกำหนด `messages.inbound.byChannel.bluebubbles` โดยชัดเจน หน้าต่าง debounce จะถูกขยายเป็น **2500 ms** (ค่าเริ่มต้นสำหรับกรณีไม่รวมคือ 500 ms) จำเป็นต้องใช้หน้าต่างที่กว้างขึ้นนี้ — จังหวะแยกส่งของ Apple ที่ 0.8-2.0 วินาทีไม่พอดีกับค่าเริ่มต้นที่แคบกว่า

หากต้องการปรับหน้าต่างด้วยตัวเอง:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms ใช้ได้กับระบบส่วนใหญ่; เพิ่มเป็น 4000 ms หาก Mac ของคุณช้า
        // หรืออยู่ภายใต้แรงกดดันด้านหน่วยความจำ (พบว่าช่องว่างอาจยืดเกิน 2 วินาทีได้)
        bluebubbles: 2500,
      },
    },
  },
}
```

### ข้อแลกเปลี่ยน

- **latency เพิ่มขึ้นสำหรับคำสั่งควบคุมใน DM** เมื่อเปิดแฟลก ข้อความคำสั่งควบคุมใน DM (เช่น `Dump`, `Save` เป็นต้น) จะรอจนถึงหน้าต่าง debounce ก่อนจึงค่อย dispatch เผื่อว่ามี payload Webhook ตามมา คำสั่งในแชตกลุ่มยังคง dispatch ทันที
- **ผลลัพธ์ที่รวมแล้วมีขอบเขตจำกัด** — ข้อความที่รวมจะจำกัดที่ 4000 อักขระพร้อมเครื่องหมาย `…[truncated]` อย่างชัดเจน; ไฟล์แนบจำกัดที่ 20; รายการแหล่งที่มาจำกัดที่ 10 (เก็บรายการแรกบวกกับรายการล่าสุดเมื่อเกินจากนั้น) `messageId` ของทุกแหล่งที่มายังคงถูกส่งผ่าน inbound-dedupe ดังนั้นหากมี MessagePoller เล่นซ้ำเหตุการณ์ใดภายหลัง ระบบจะยังรู้จำว่าเป็นข้อมูลซ้ำ
- **เป็นแบบ opt-in และแยกตามช่องทาง** ช่องทางอื่น (Telegram, WhatsApp, Slack, …) จะไม่ได้รับผลกระทบ

### สถานการณ์และสิ่งที่ agent เห็น

| สิ่งที่ผู้ใช้พิมพ์                                                      | สิ่งที่ Apple ส่งมา      | ปิดแฟลก (ค่าเริ่มต้น)                  | เปิดแฟลก + หน้าต่าง 2500 ms                                              |
| ---------------------------------------------------------------------- | ------------------------ | -------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (ส่งครั้งเดียว)                             | 2 Webhook ห่างกัน ~1 วินาที | สองเทิร์นของ agent: มีแค่ "Dump" แล้วตามด้วย URL | หนึ่งเทิร์น: ข้อความที่รวมแล้ว `Dump https://example.com`                |
| `Save this 📎image.jpg caption` (ไฟล์แนบ + ข้อความ)                    | 2 Webhook                | สองเทิร์น                              | หนึ่งเทิร์น: ข้อความ + รูปภาพ                                           |
| `/status` (คำสั่งเดี่ยว)                                                | 1 Webhook                | dispatch ทันที                         | **รอได้สูงสุดตามหน้าต่าง แล้วจึง dispatch**                              |
| วาง URL เพียงอย่างเดียว                                                 | 1 Webhook                | dispatch ทันที                         | dispatch ทันที (มีเพียงรายการเดียวใน bucket)                             |
| ข้อความ + URL ถูกส่งเป็นสองข้อความแยกกันโดยตั้งใจ ห่างกันหลายนาที     | 2 Webhook นอกหน้าต่าง    | สองเทิร์น                              | สองเทิร์น (หน้าต่างหมดอายุระหว่างนั้น)                                   |
| ส่งถี่อย่างรวดเร็ว (>10 DM สั้นภายในหน้าต่าง)                         | N Webhook                | N เทิร์น                               | หนึ่งเทิร์น, ผลลัพธ์มีขอบเขตจำกัด (รายการแรก + ล่าสุด, ใช้เพดานข้อความ/ไฟล์แนบ) |

### การแก้ไขปัญหาการรวม split-send

หากเปิดแฟลกแล้วแต่ split-send ยังมาถึงเป็นสองเทิร์น ให้ตรวจสอบแต่ละชั้นดังนี้:

1. **โหลด config จริงหรือไม่**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   จากนั้น `openclaw gateway restart` — ระบบจะอ่านแฟลกนี้ตอนสร้าง debouncer-registry

2. **หน้าต่าง debounce กว้างพอสำหรับระบบของคุณหรือไม่** ดู log ของเซิร์ฟเวอร์ BlueBubbles ที่ `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   วัดช่วงห่างระหว่าง dispatch ของข้อความแบบ `"Dump"` กับ dispatch ของ `"https://..."; Attachments:` ที่ตามมา เพิ่มค่า `messages.inbound.byChannel.bluebubbles` ให้ครอบคลุมช่วงนั้นอย่างสบาย

3. **timestamp ใน session JSONL ≠ เวลาที่ Webhook มาถึง** timestamp ของเหตุการณ์ใน session (`~/.openclaw/agents/<id>/sessions/*.jsonl`) สะท้อนเวลาที่ Gateway ส่งข้อความให้ agent **ไม่ใช่** เวลาที่ Webhook มาถึง หากข้อความที่สองถูกแท็ก `[Queued messages while agent was busy]` แปลว่าเทิร์นแรกยังทำงานอยู่ตอนที่ Webhook ที่สองมาถึง — bucket สำหรับการรวมถูก flush ไปแล้ว ให้ปรับหน้าต่างโดยอิงจาก log ของเซิร์ฟเวอร์ BB ไม่ใช่ log ของ session

4. **แรงกดดันด้านหน่วยความจำทำให้การ dispatch การตอบกลับช้าลง** บนเครื่องขนาดเล็ก (8 GB) เทิร์นของ agent อาจนานพอที่ทำให้ bucket สำหรับการรวมถูก flush ก่อนที่คำตอบจะเสร็จ และ URL กลายเป็นเทิร์นที่สองในคิว ตรวจสอบ `memory_pressure` และ `ps -o rss -p $(pgrep openclaw-gateway)`; หาก Gateway ใช้ RSS เกิน ~500 MB และตัวบีบอัดกำลังทำงาน ให้ปิดโปรเซสหนักอื่น ๆ หรือย้ายไปใช้โฮสต์ที่ใหญ่ขึ้น

5. **การส่งแบบอ้างอิงการตอบกลับเป็นอีกเส้นทางหนึ่ง** หากผู้ใช้แตะ `Dump` เป็น **การตอบกลับ** ต่อ URL-balloon ที่มีอยู่แล้ว (iMessage จะแสดงป้าย "1 Reply" บนบับเบิล Dump) URL จะอยู่ใน `replyToBody` ไม่ใช่ใน Webhook ตัวที่สอง การรวมจะไม่ถูกใช้ — นี่เป็นเรื่องของ skill/prompt ไม่ใช่เรื่องของ debouncer

## Block streaming

ควบคุมว่าจะส่งคำตอบเป็นข้อความเดียวหรือสตรีมเป็นบล็อก:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // เปิดใช้ block streaming (ปิดโดยค่าเริ่มต้น)
    },
  },
}
```

## สื่อ + ขีดจำกัด

- ไฟล์แนบขาเข้าจะถูกดาวน์โหลดและจัดเก็บไว้ใน media cache
- จำกัดขนาดสื่อผ่าน `channels.bluebubbles.mediaMaxMb` สำหรับสื่อขาเข้าและขาออก (ค่าเริ่มต้น: 8 MB)
- ข้อความขาออกจะถูกแบ่งเป็นช่วงตาม `channels.bluebubbles.textChunkLimit` (ค่าเริ่มต้น: 4000 อักขระ)

## เอกสารอ้างอิงการกำหนดค่า

การกำหนดค่าแบบเต็ม: [Configuration](/th/gateway/configuration)

ตัวเลือกของ provider:

- `channels.bluebubbles.enabled`: เปิด/ปิดช่องทาง
- `channels.bluebubbles.serverUrl`: URL ฐานของ BlueBubbles REST API
- `channels.bluebubbles.password`: รหัสผ่าน API
- `channels.bluebubbles.webhookPath`: พาธของปลายทาง Webhook (ค่าเริ่มต้น: `/bluebubbles-webhook`)
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: `pairing`)
- `channels.bluebubbles.allowFrom`: allowlist สำหรับ DM (handle, อีเมล, หมายเลข E.164, `chat_id:*`, `chat_guid:*`)
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`)
- `channels.bluebubbles.groupAllowFrom`: allowlist ของผู้ส่งในกลุ่ม
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: บน macOS สามารถเลือกเติมข้อมูลผู้เข้าร่วมกลุ่มที่ยังไม่มีชื่อจาก Contacts ในเครื่องได้ หลังจากผ่าน gating แล้ว ค่าเริ่มต้น: `false`
- `channels.bluebubbles.groups`: การกำหนดค่ารายกลุ่ม (`requireMention` เป็นต้น)
- `channels.bluebubbles.sendReadReceipts`: ส่งใบตอบรับการอ่าน (ค่าเริ่มต้น: `true`)
- `channels.bluebubbles.blockStreaming`: เปิดใช้ block streaming (ค่าเริ่มต้น: `false`; จำเป็นสำหรับการตอบกลับแบบสตรีม)
- `channels.bluebubbles.textChunkLimit`: ขนาด chunk ขาออกเป็นจำนวนอักขระ (ค่าเริ่มต้น: 4000)
- `channels.bluebubbles.sendTimeoutMs`: timeout ต่อคำขอเป็นมิลลิวินาทีสำหรับการส่งข้อความขาออกผ่าน `/api/v1/message/text` (ค่าเริ่มต้น: 30000) ให้เพิ่มค่านี้ในระบบ macOS 26 ที่การส่ง iMessage ผ่าน Private API อาจค้างนานกว่า 60 วินาทีภายในเฟรมเวิร์ก iMessage; ตัวอย่างเช่น `45000` หรือ `60000` ขณะนี้ probe, การค้นหาแชต, รีแอ็กชัน, การแก้ไข และการตรวจสอบสถานะยังคงใช้ค่าเริ่มต้นสั้นกว่า 10 วินาที; มีแผนจะขยายให้ครอบคลุมรีแอ็กชันและการแก้ไขในลำดับถัดไป การ override รายบัญชี: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`
- `channels.bluebubbles.chunkMode`: `length` (ค่าเริ่มต้น) จะแยกเฉพาะเมื่อเกิน `textChunkLimit`; `newline` จะแยกตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแยกตามความยาว
- `channels.bluebubbles.mediaMaxMb`: เพดานขนาดสื่อขาเข้า/ขาออกเป็น MB (ค่าเริ่มต้น: 8)
- `channels.bluebubbles.mediaLocalRoots`: allowlist แบบระบุชัดของไดเรกทอรีภายในเครื่องแบบ absolute ที่อนุญาตให้ใช้กับพาธสื่อขาออกในเครื่อง โดยค่าเริ่มต้นการส่งพาธในเครื่องจะถูกปฏิเสธ เว้นแต่จะกำหนดค่านี้ไว้ การ override รายบัญชี: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`
- `channels.bluebubbles.coalesceSameSenderDms`: รวม Webhook ของ DM ที่มาจากผู้ส่งคนเดียวกันต่อเนื่องกันให้เป็นเทิร์นเดียวของ agent เพื่อให้การแยกส่งข้อความ+URL ของ Apple มาถึงเป็นข้อความเดียว (ค่าเริ่มต้น: `false`) ดู [Coalescing split-send DMs](#coalescing-split-send-dms-command--url-in-one-composition) สำหรับสถานการณ์ การปรับหน้าต่าง และข้อแลกเปลี่ยน เมื่อเปิดใช้งานโดยไม่มีการกำหนด `messages.inbound.byChannel.bluebubbles` อย่างชัดเจน ระบบจะขยายหน้าต่าง inbound debounce เริ่มต้นจาก 500 ms เป็น 2500 ms
- `channels.bluebubbles.historyLimit`: จำนวนข้อความกลุ่มสูงสุดสำหรับบริบท (0 คือปิดใช้งาน)
- `channels.bluebubbles.dmHistoryLimit`: ขีดจำกัดประวัติ DM
- `channels.bluebubbles.actions`: เปิด/ปิดการดำเนินการเฉพาะรายการ
- `channels.bluebubbles.accounts`: การกำหนดค่าแบบหลายบัญชี

ตัวเลือกแบบ global ที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (หรือ `messages.groupChat.mentionPatterns`)
- `messages.responsePrefix`

## การระบุที่อยู่ / เป้าหมายการส่ง

แนะนำให้ใช้ `chat_guid` เพื่อการกำหนดเส้นทางที่เสถียร:

- `chat_guid:iMessage;-;+15555550123` (แนะนำสำหรับกลุ่ม)
- `chat_id:123`
- `chat_identifier:...`
- handle โดยตรง: `+15555550123`, `user@example.com`
  - หาก handle โดยตรงยังไม่มีแชต DM อยู่ OpenClaw จะสร้างแชตใหม่ผ่าน `POST /api/v1/chat/new` ต้องเปิดใช้ BlueBubbles Private API ด้วย

### การกำหนดเส้นทาง iMessage เทียบกับ SMS

เมื่อ handle เดียวกันมีทั้งแชต iMessage และ SMS อยู่บน Mac (เช่น หมายเลขโทรศัพท์ที่ลงทะเบียนกับ iMessage แต่เคยได้รับข้อความ fallback แบบฟองสีเขียวด้วย) OpenClaw จะเลือกแชต iMessage และจะไม่ลดระดับเป็น SMS แบบเงียบ ๆ หากต้องการบังคับใช้แชต SMS ให้ใช้คำนำหน้าเป้าหมาย `sms:` แบบระบุชัด (เช่น `sms:+15555550123`) ส่วน handle ที่ไม่มีแชต iMessage ที่ตรงกันจะยังคงส่งผ่านแชตใดก็ตามที่ BlueBubbles รายงานมา

## ความปลอดภัย

- คำขอ Webhook ได้รับการยืนยันตัวตนโดยเปรียบเทียบ query param หรือ header ของ `guid`/`password` กับ `channels.bluebubbles.password`
- เก็บรหัสผ่าน API และปลายทาง Webhook ให้เป็นความลับ (ถือว่าเป็นข้อมูลรับรอง)
- ไม่มีการข้ามการยืนยันตัวตนของ Webhook ผ่าน localhost สำหรับ BlueBubbles หากคุณทำ proxy ทราฟฟิก Webhook ให้คงรหัสผ่าน BlueBubbles ไว้กับคำขอตลอดเส้นทาง `gateway.trustedProxies` ไม่ได้ใช้แทน `channels.bluebubbles.password` ในกรณีนี้ ดู [Gateway security](/th/gateway/security#reverse-proxy-configuration)
- เปิดใช้ HTTPS + กฎ firewall บนเซิร์ฟเวอร์ BlueBubbles หากจะเปิดให้เข้าถึงจากนอก LAN

## การแก้ไขปัญหา

- หากเหตุการณ์การพิมพ์/การอ่านหยุดทำงาน ให้ตรวจสอบ log ของ Webhook BlueBubbles และยืนยันว่าพาธของ Gateway ตรงกับ `channels.bluebubbles.webhookPath`
- รหัสการจับคู่จะหมดอายุหลังหนึ่งชั่วโมง; ใช้ `openclaw pairing list bluebubbles` และ `openclaw pairing approve bluebubbles <code>`
- รีแอ็กชันต้องใช้ BlueBubbles private API (`POST /api/v1/message/react`); ตรวจสอบให้แน่ใจว่าเวอร์ชันของเซิร์ฟเวอร์รองรับ
- การแก้ไข/ยกเลิกส่งต้องใช้ macOS 13+ และ BlueBubbles server เวอร์ชันที่รองรับ บน macOS 26 (Tahoe) ฟีเจอร์แก้ไขยังใช้งานไม่ได้ในขณะนี้เนื่องจากการเปลี่ยนแปลงของ private API
- การอัปเดตไอคอนกลุ่มอาจไม่เสถียรบน macOS 26 (Tahoe): API อาจรายงานว่าสำเร็จ แต่ไอคอนใหม่ไม่ซิงก์
- OpenClaw จะซ่อนการดำเนินการที่ทราบว่าใช้งานไม่ได้โดยอัตโนมัติตามเวอร์ชัน macOS ของเซิร์ฟเวอร์ BlueBubbles หาก `edit` ยังแสดงอยู่บน macOS 26 (Tahoe) ให้ปิดเองด้วย `channels.bluebubbles.actions.edit=false`
- เปิด `coalesceSameSenderDms` แล้วแต่ split-send (เช่น `Dump` + URL) ยังมาถึงเป็นสองเทิร์น: ดูรายการตรวจสอบ [split-send coalescing troubleshooting](#split-send-coalescing-troubleshooting) — สาเหตุที่พบบ่อยคือหน้าต่าง debounce แคบเกินไป, อ่าน timestamp ของ session log ผิดว่าเป็นเวลาที่ Webhook มาถึง, หรือเป็นการส่งแบบอ้างอิงการตอบกลับ (ซึ่งใช้ `replyToBody` ไม่ใช่ Webhook ตัวที่สอง)
- สำหรับข้อมูลสถานะ/สุขภาพระบบ: `openclaw status --all` หรือ `openclaw status --deep`

สำหรับเอกสารอ้างอิงเวิร์กโฟลว์ของช่องทางโดยทั่วไป ดู [Channels](/th/channels) และคู่มือ [Plugins](/th/tools/plugin)

## ที่เกี่ยวข้อง

- [Channels Overview](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และ flow การจับคู่
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและ mention gating
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้ระบบแข็งแรงขึ้น
