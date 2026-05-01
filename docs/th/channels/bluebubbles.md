---
read_when:
    - การตั้งค่าช่องทาง BlueBubbles
    - การแก้ไขปัญหาการจับคู่ Webhook
    - การกำหนดค่า iMessage บน macOS
sidebarTitle: BlueBubbles
summary: iMessage ผ่านเซิร์ฟเวอร์ macOS ของ BlueBubbles (การส่ง/รับผ่าน REST, สถานะกำลังพิมพ์, ปฏิกิริยา, การจับคู่, การดำเนินการขั้นสูง).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-01T10:13:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 499cc2a46db6e0eddfb897e96ec4b3e4a39ba9f2f6da8e7485c1c46562de4145
    source_path: channels/bluebubbles.md
    workflow: 16
---

สถานะ: Plugin ที่บันเดิลมาซึ่งพูดคุยกับเซิร์ฟเวอร์ BlueBubbles บน macOS ผ่าน HTTP **แนะนำสำหรับการผสานรวม iMessage** เนื่องจาก API ที่สมบูรณ์กว่าและตั้งค่าได้ง่ายกว่าเมื่อเทียบกับช่องทาง imsg แบบเดิม

<Note>
OpenClaw รุ่นปัจจุบันบันเดิล BlueBubbles มาให้แล้ว ดังนั้นบิลด์แพ็กเกจปกติจึงไม่ต้องมีขั้นตอน `openclaw plugins install` แยกต่างหาก
</Note>

## ภาพรวม

- ทำงานบน macOS ผ่านแอปช่วยเหลือ BlueBubbles ([bluebubbles.app](https://bluebubbles.app))
- แนะนำ/ทดสอบแล้ว: macOS Sequoia (15) macOS Tahoe (26) ใช้งานได้; ตอนนี้การแก้ไขยังเสียอยู่บน Tahoe และการอัปเดตไอคอนกลุ่มอาจรายงานว่าสำเร็จแต่ไม่ซิงก์
- OpenClaw พูดคุยกับมันผ่าน REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`)
- ข้อความขาเข้ามาทาง Webhook; การตอบกลับขาออก ตัวบ่งชี้การพิมพ์ ใบตอบรับการอ่าน และ tapback เป็นการเรียก REST
- ไฟล์แนบและสติกเกอร์จะถูกนำเข้าเป็นสื่อขาเข้า (และแสดงให้เอเจนต์เห็นเมื่อทำได้)
- การตอบกลับ Auto-TTS ที่สังเคราะห์เสียง MP3 หรือ CAF จะถูกส่งเป็นบับเบิลวอยซ์เมโมของ iMessage แทนไฟล์แนบธรรมดา
- การจับคู่/รายการอนุญาตทำงานเหมือนช่องทางอื่น (`/channels/pairing` ฯลฯ) ด้วย `channels.bluebubbles.allowFrom` + รหัสจับคู่
- ปฏิกิริยาจะถูกแสดงเป็นอีเวนต์ระบบเหมือน Slack/Telegram เพื่อให้เอเจนต์สามารถ "กล่าวถึง" ก่อนตอบกลับได้
- ฟีเจอร์ขั้นสูง: แก้ไข ยกเลิกการส่ง เธรดตอบกลับ เอฟเฟกต์ข้อความ การจัดการกลุ่ม

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง BlueBubbles">
    ติดตั้งเซิร์ฟเวอร์ BlueBubbles บน Mac ของคุณ (ทำตามคำแนะนำที่ [bluebubbles.app/install](https://bluebubbles.app/install))
  </Step>
  <Step title="เปิดใช้งานเว็บ API">
    ในการกำหนดค่า BlueBubbles ให้เปิดใช้งานเว็บ API และตั้งรหัสผ่าน
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
    ชี้ Webhook ของ BlueBubbles ไปที่ Gateway ของคุณ (ตัวอย่าง: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)
  </Step>
  <Step title="เริ่ม Gateway">
    เริ่ม Gateway; ระบบจะลงทะเบียนตัวจัดการ Webhook และเริ่มการจับคู่
  </Step>
</Steps>

<Warning>
**ความปลอดภัย**

- ตั้งรหัสผ่าน Webhook เสมอ
- ต้องยืนยันตัวตน Webhook เสมอ OpenClaw จะปฏิเสธคำขอ Webhook ของ BlueBubbles เว้นแต่คำขอนั้นจะมีรหัสผ่าน/guid ที่ตรงกับ `channels.bluebubbles.password` (เช่น `?password=<password>` หรือ `x-password`) ไม่ว่าโทโพโลยี loopback/proxy จะเป็นอย่างไร
- การยืนยันตัวตนด้วยรหัสผ่านจะถูกตรวจสอบก่อนอ่าน/แยกวิเคราะห์เนื้อหา Webhook แบบเต็ม

</Warning>

## การทำให้ Messages.app ทำงานต่อเนื่อง (การตั้งค่า VM / headless)

การตั้งค่า macOS VM / แบบเปิดตลอดบางแบบอาจทำให้ Messages.app เข้าสู่สถานะ "idle" (อีเวนต์ขาเข้าหยุดจนกว่าจะเปิดแอป/นำแอปขึ้นหน้า) วิธีเลี่ยงอย่างง่ายคือ **กระตุ้น Messages ทุก 5 นาที** ด้วย AppleScript + LaunchAgent

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

    สิ่งนี้ทำงาน **ทุก 300 วินาที** และ **เมื่อเข้าสู่ระบบ** การรันครั้งแรกอาจเรียกพรอมต์ **Automation** ของ macOS (`osascript` → Messages) ให้อนุมัติในเซสชันผู้ใช้เดียวกับที่รัน LaunchAgent

  </Step>
  <Step title="โหลดมัน">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## การเริ่มใช้งาน

BlueBubbles พร้อมใช้งานในการเริ่มใช้งานแบบโต้ตอบ:

```
openclaw onboard
```

วิซาร์ดจะถามหา:

<ParamField path="URL ของเซิร์ฟเวอร์" type="string" required>
  ที่อยู่เซิร์ฟเวอร์ BlueBubbles (เช่น `http://192.168.1.100:1234`)
</ParamField>
<ParamField path="รหัสผ่าน" type="string" required>
  รหัสผ่าน API จากการตั้งค่า BlueBubbles Server
</ParamField>
<ParamField path="เส้นทาง Webhook" type="string" default="/bluebubbles-webhook">
  เส้นทางเอนด์พอยต์ Webhook
</ParamField>
<ParamField path="นโยบาย DM" type="string">
  `pairing`, `allowlist`, `open`, หรือ `disabled`
</ParamField>
<ParamField path="รายการอนุญาต" type="string[]">
  หมายเลขโทรศัพท์ อีเมล หรือเป้าหมายแชท
</ParamField>

คุณยังเพิ่ม BlueBubbles ผ่าน CLI ได้ด้วย:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

<Tabs>
  <Tab title="DM">
    - ค่าเริ่มต้น: `channels.bluebubbles.dmPolicy = "pairing"`
    - ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่; ข้อความจะถูกละเว้นจนกว่าจะได้รับการอนุมัติ (รหัสหมดอายุหลัง 1 ชั่วโมง)
    - อนุมัติผ่าน:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - การจับคู่เป็นการแลกเปลี่ยนโทเคนเริ่มต้น รายละเอียด: [การจับคู่](/th/channels/pairing)

  </Tab>
  <Tab title="กลุ่ม">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`)
    - `channels.bluebubbles.groupAllowFrom` ควบคุมว่าใครสามารถทริกเกอร์ในกลุ่มได้เมื่อกำหนด `allowlist`

  </Tab>
</Tabs>

### การเติมชื่อผู้ติดต่อ (macOS, ไม่บังคับ)

Webhook กลุ่มของ BlueBubbles มักมีเพียงที่อยู่ผู้เข้าร่วมแบบดิบ หากคุณต้องการให้บริบท `GroupMembers` แสดงชื่อผู้ติดต่อในเครื่องแทน คุณสามารถเลือกใช้การเติมข้อมูล Contacts ในเครื่องบน macOS ได้:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` เปิดใช้งานการค้นหา ค่าเริ่มต้น: `false`
- การค้นหาจะทำงานเฉพาะหลังจากการเข้าถึงกลุ่ม การอนุญาตคำสั่ง และการกั้นด้วยการกล่าวถึงอนุญาตให้ข้อความผ่านแล้ว
- จะเติมข้อมูลเฉพาะผู้เข้าร่วมที่เป็นหมายเลขโทรศัพท์และยังไม่มีชื่อเท่านั้น
- หมายเลขโทรศัพท์ดิบยังคงเป็นค่าถอยกลับเมื่อไม่พบรายการที่ตรงกันในเครื่อง

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### การกั้นด้วยการกล่าวถึง (กลุ่ม)

BlueBubbles รองรับการกั้นด้วยการกล่าวถึงสำหรับแชทกลุ่ม โดยตรงกับพฤติกรรมของ iMessage/WhatsApp:

- ใช้ `agents.list[].groupChat.mentionPatterns` (หรือ `messages.groupChat.mentionPatterns`) เพื่อตรวจจับการกล่าวถึง
- เมื่อเปิดใช้ `requireMention` สำหรับกลุ่ม เอเจนต์จะตอบกลับเฉพาะเมื่อถูกกล่าวถึง
- คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตจะข้ามการกั้นด้วยการกล่าวถึง

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

### การกั้นคำสั่ง

- คำสั่งควบคุม (เช่น `/config`, `/model`) ต้องมีการอนุญาต
- ใช้ `allowFrom` และ `groupAllowFrom` เพื่อกำหนดการอนุญาตคำสั่ง
- ผู้ส่งที่ได้รับอนุญาตสามารถรันคำสั่งควบคุมได้ แม้ไม่ได้กล่าวถึงในกลุ่ม

### พรอมต์ระบบต่อกลุ่ม

แต่ละรายการภายใต้ `channels.bluebubbles.groups.*` รับสตริง `systemPrompt` ที่ไม่บังคับ ค่าจะถูกฉีดเข้าไปในพรอมต์ระบบของเอเจนต์ในทุกเทิร์นที่จัดการข้อความในกลุ่มนั้น ดังนั้นคุณจึงตั้งบุคลิกหรือกฎพฤติกรรมต่อกลุ่มได้โดยไม่ต้องแก้ไขพรอมต์ของเอเจนต์:

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

คีย์ตรงกับสิ่งที่ BlueBubbles รายงานเป็น `chatGuid` / `chatIdentifier` / `chatId` แบบตัวเลขสำหรับกลุ่ม และรายการไวลด์การ์ด `"*"` จะให้ค่าเริ่มต้นสำหรับทุกกลุ่มที่ไม่มีการจับคู่แบบตรงตัว (รูปแบบเดียวกับที่ใช้โดย `requireMention` และนโยบายเครื่องมือต่อกลุ่ม) การจับคู่แบบตรงตัวจะชนะไวลด์การ์ดเสมอ DM จะละเว้นฟิลด์นี้; ให้ใช้การปรับแต่งพรอมต์ระดับเอเจนต์หรือระดับบัญชีแทน

#### ตัวอย่างที่ทำงานได้: การตอบกลับแบบเธรดและปฏิกิริยา tapback (Private API)

เมื่อเปิดใช้ BlueBubbles Private API ข้อความขาเข้าจะมาพร้อม ID ข้อความแบบสั้น (เช่น `[[reply_to:5]]`) และเอเจนต์สามารถเรียก `action=reply` เพื่อเข้าร่วมเธรดในข้อความที่เจาะจง หรือ `action=react` เพื่อส่ง tapback ได้ `systemPrompt` ต่อกลุ่มเป็นวิธีที่เชื่อถือได้ในการทำให้เอเจนต์เลือกเครื่องมือที่ถูกต้อง:

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

แชท BlueBubbles สามารถเปลี่ยนเป็นเวิร์กสเปซ ACP ที่คงอยู่ได้โดยไม่ต้องเปลี่ยนเลเยอร์การขนส่ง

โฟลว์ผู้ควบคุมแบบรวดเร็ว:

- รัน `/acp spawn codex --bind here` ภายใน DM หรือแชทกลุ่มที่ได้รับอนุญาต
- ข้อความในอนาคตในการสนทนา BlueBubbles เดียวกันนั้นจะถูกส่งไปยังเซสชัน ACP ที่สร้างขึ้น
- `/new` และ `/reset` รีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมในที่เดิม
- `/acp close` ปิดเซสชัน ACP และลบการผูก

ยังรองรับการผูกถาวรที่กำหนดค่าไว้ผ่านรายการ `bindings[]` ระดับบนสุดด้วย `type: "acp"` และ `match.channel: "bluebubbles"`

`match.peer.id` สามารถใช้รูปแบบเป้าหมาย BlueBubbles ที่รองรับได้ทุกรูปแบบ:

- แฮนเดิล DM ที่ปรับมาตรฐานแล้ว เช่น `+15555550123` หรือ `user@example.com`
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

ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับพฤติกรรมการผูก ACP ร่วมกัน

## การพิมพ์ + ใบตอบรับการอ่าน

- **ตัวบ่งชี้การพิมพ์**: ส่งโดยอัตโนมัติก่อนและระหว่างการสร้างคำตอบ.
- **ใบตอบรับการอ่าน**: ควบคุมโดย `channels.bluebubbles.sendReadReceipts` (ค่าเริ่มต้น: `true`).
- **ตัวบ่งชี้การพิมพ์**: OpenClaw ส่งเหตุการณ์เริ่มพิมพ์; BlueBubbles ล้างสถานะการพิมพ์โดยอัตโนมัติเมื่อส่งหรือหมดเวลา (การหยุดด้วยตนเองผ่าน DELETE ไม่น่าเชื่อถือ).

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

BlueBubbles รองรับการดำเนินการข้อความขั้นสูงเมื่อเปิดใช้ในการกำหนดค่า:

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
  <Accordion title="Available actions">
    - **react**: เพิ่ม/ลบรีแอ็กชัน tapback (`messageId`, `emoji`, `remove`). ชุด tapback ดั้งเดิมของ iMessage คือ `love`, `like`, `dislike`, `laugh`, `emphasize` และ `question`. เมื่อเอเจนต์เลือกอีโมจินอกชุดนั้น (เช่น `👀`) เครื่องมือรีแอ็กชันจะถอยกลับไปใช้ `love` เพื่อให้ tapback ยังคงแสดงผล แทนที่จะทำให้คำขอทั้งหมดล้มเหลว. รีแอ็กชัน ack ที่กำหนดค่าไว้ยังคงตรวจสอบอย่างเข้มงวดและแจ้งข้อผิดพลาดเมื่อพบค่าที่ไม่รู้จัก.
    - **edit**: แก้ไขข้อความที่ส่งแล้ว (`messageId`, `text`).
    - **unsend**: ยกเลิกการส่งข้อความ (`messageId`).
    - **reply**: ตอบกลับข้อความเฉพาะ (`messageId`, `text`, `to`).
    - **sendWithEffect**: ส่งพร้อมเอฟเฟกต์ iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: เปลี่ยนชื่อแชตกลุ่ม (`chatGuid`, `displayName`).
    - **setGroupIcon**: ตั้งค่าไอคอน/รูปภาพของแชตกลุ่ม (`chatGuid`, `media`) — ไม่นิ่งบน macOS 26 Tahoe (API อาจส่งกลับว่าสำเร็จ แต่ไอคอนไม่ซิงก์).
    - **addParticipant**: เพิ่มบางคนเข้ากลุ่ม (`chatGuid`, `address`).
    - **removeParticipant**: ลบบางคนออกจากกลุ่ม (`chatGuid`, `address`).
    - **leaveGroup**: ออกจากแชตกลุ่ม (`chatGuid`).
    - **upload-file**: ส่งสื่อ/ไฟล์ (`to`, `buffer`, `filename`, `asVoice`).
      - บันทึกเสียง: ตั้งค่า `asVoice: true` พร้อมเสียง **MP3** หรือ **CAF** เพื่อส่งเป็นข้อความเสียง iMessage. BlueBubbles แปลง MP3 → CAF เมื่อส่งบันทึกเสียง.
    - ชื่อแฝงเดิม: `sendAttachment` ยังใช้งานได้ แต่ `upload-file` คือชื่อการดำเนินการมาตรฐาน.

  </Accordion>
</AccordionGroup>

### ID ข้อความ (แบบสั้นเทียบกับแบบเต็ม)

OpenClaw อาจแสดง ID ข้อความแบบ _สั้น_ (เช่น `1`, `2`) เพื่อลดจำนวนโทเค็น.

- `MessageSid` / `ReplyToId` อาจเป็น ID แบบสั้น.
- `MessageSidFull` / `ReplyToIdFull` มี ID แบบเต็มของผู้ให้บริการ.
- ID แบบสั้นอยู่ในหน่วยความจำ; อาจหมดอายุเมื่อรีสตาร์ตหรือเมื่อแคชถูกขับออก.
- การดำเนินการรับ `messageId` แบบสั้นหรือแบบเต็ม แต่ ID แบบสั้นจะเกิดข้อผิดพลาดถ้าไม่พร้อมใช้งานแล้ว.

ใช้ ID แบบเต็มสำหรับระบบอัตโนมัติและพื้นที่จัดเก็บที่ต้องคงทน:

- เทมเพลต: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- บริบท: `MessageSidFull` / `ReplyToIdFull` ในเพย์โหลดขาเข้า

ดู [การกำหนดค่า](/th/gateway/configuration) สำหรับตัวแปรเทมเพลต.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## การรวม DM แบบ split-send (คำสั่ง + URL ในการเขียนครั้งเดียว)

เมื่อผู้ใช้พิมพ์คำสั่งและ URL พร้อมกันใน iMessage — เช่น `Dump https://example.com/article` — Apple จะแยกการส่งเป็น **การส่ง Webhook สองรายการแยกกัน**:

1. ข้อความตัวอักษร (`"Dump"`).
2. บอลลูนพรีวิว URL (`"https://..."`) พร้อมรูปภาพ OG-preview เป็นไฟล์แนบ.

Webhook ทั้งสองรายการมาถึง OpenClaw ห่างกันประมาณ 0.8-2.0 วินาทีในชุดติดตั้งส่วนใหญ่. หากไม่มีการรวม เอเจนต์จะได้รับเฉพาะคำสั่งในเทิร์นที่ 1, ตอบกลับ (มักจะเป็น "ส่ง URL มาให้ฉัน"), และเห็น URL เฉพาะในเทิร์นที่ 2 — ซึ่ง ณ ตอนนั้นบริบทของคำสั่งหายไปแล้ว.

`channels.bluebubbles.coalesceSameSenderDms` เลือกให้ DM รวม Webhook จากผู้ส่งเดียวกันที่ต่อเนื่องกันเข้าเป็นเทิร์นเอเจนต์เดียว. แชตกลุ่มยังคงใช้คีย์ต่อข้อความเพื่อรักษาโครงสร้างเทิร์นของผู้ใช้หลายคน.

<Tabs>
  <Tab title="When to enable">
    เปิดใช้เมื่อ:

    - คุณส่ง Skills ที่คาดหวัง `command + payload` ในข้อความเดียว (dump, paste, save, queue ฯลฯ).
    - ผู้ใช้ของคุณวาง URL, รูปภาพ, หรือเนื้อหายาวพร้อมกับคำสั่ง.
    - คุณยอมรับความหน่วงของเทิร์น DM ที่เพิ่มขึ้นได้ (ดูด้านล่าง).

    ปิดไว้เมื่อ:

    - คุณต้องการความหน่วงของคำสั่งต่ำสุดสำหรับตัวกระตุ้น DM แบบคำเดียว.
    - โฟลว์ทั้งหมดของคุณเป็นคำสั่งแบบครั้งเดียวจบที่ไม่มีเพย์โหลดตามมา.

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    เมื่อเปิดแฟล็กและไม่มี `messages.inbound.byChannel.bluebubbles` ที่ระบุชัดเจน หน้าต่าง debounce จะขยายเป็น **2500 ms** (ค่าเริ่มต้นสำหรับกรณีที่ไม่รวมคือ 500 ms). จำเป็นต้องใช้หน้าต่างที่กว้างขึ้น — จังหวะ split-send ของ Apple ที่ 0.8-2.0 วินาทีไม่พอดีกับค่าเริ่มต้นที่แคบกว่า.

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
  <Tab title="Trade-offs">
    - **ความหน่วงที่เพิ่มขึ้นสำหรับคำสั่งควบคุม DM.** เมื่อเปิดแฟล็ก ข้อความคำสั่งควบคุม DM (เช่น `Dump`, `Save` ฯลฯ) จะรอได้ถึงหน้าต่าง debounce ก่อน dispatch เผื่อว่า Webhook เพย์โหลดกำลังจะมา. คำสั่งในแชตกลุ่มยังคง dispatch ทันที.
    - **เอาต์พุตที่รวมแล้วมีขอบเขตจำกัด** — ข้อความที่รวมแล้วจำกัดที่ 4000 อักขระพร้อมเครื่องหมาย `…[truncated]` ชัดเจน; ไฟล์แนบจำกัดที่ 20; รายการต้นทางจำกัดที่ 10 (เก็บรายการแรกพร้อมรายการล่าสุดเมื่อเกินกว่านั้น). `messageId` ของทุกต้นทางยังคงเข้าสู่ inbound-dedupe ดังนั้นการ replay ภายหลังของ MessagePoller สำหรับเหตุการณ์รายตัวใดๆ จะถูกจดจำว่าเป็นรายการซ้ำ.
    - **เลือกใช้เป็นรายช่องทาง.** ช่องทางอื่น (Telegram, WhatsApp, Slack, …) ไม่ได้รับผลกระทบ.

  </Tab>
</Tabs>

### สถานการณ์และสิ่งที่เอเจนต์เห็น

| ผู้ใช้เขียน                                                        | Apple ส่งมอบ              | ปิดแฟล็ก (ค่าเริ่มต้น)                  | เปิดแฟล็ก + หน้าต่าง 2500 ms                                           |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (ส่งครั้งเดียว)                         | 2 Webhook ห่างกัน ~1 วินาที | สองเทิร์นเอเจนต์: มีแค่ "Dump", แล้วตามด้วย URL | หนึ่งเทิร์น: ข้อความที่รวม `Dump https://example.com`                  |
| `Save this 📎image.jpg caption` (ไฟล์แนบ + ข้อความ)                | 2 Webhook                 | สองเทิร์น                               | หนึ่งเทิร์น: ข้อความ + รูปภาพ                                          |
| `/status` (คำสั่งเดี่ยว)                                          | 1 Webhook                 | dispatch ทันที                          | **รอได้ถึงหน้าต่าง แล้วจึง dispatch**                                  |
| วาง URL อย่างเดียว                                                 | 1 Webhook                 | dispatch ทันที                          | dispatch ทันที (มีรายการเดียวใน bucket)                                |
| ส่งข้อความ + URL เป็นข้อความแยกกันโดยตั้งใจ ห่างกันหลายนาที      | 2 Webhook นอกหน้าต่าง     | สองเทิร์น                               | สองเทิร์น (หน้าต่างหมดอายุระหว่างสองรายการ)                           |
| ส่ง DM ขนาดเล็กถี่มาก (>10 รายการภายในหน้าต่าง)                   | N Webhook                 | N เทิร์น                                | หนึ่งเทิร์น, เอาต์พุตมีขอบเขต (รายการแรก + ล่าสุด, ใช้เพดานข้อความ/ไฟล์แนบ) |

### การแก้ปัญหาการรวม split-send

หากเปิดแฟล็กแล้ว split-send ยังมาถึงเป็นสองเทิร์น ให้ตรวจสอบแต่ละชั้น:

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    จากนั้น `openclaw gateway restart` — แฟล็กจะถูกอ่านตอนสร้าง debouncer-registry.

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    ดูบันทึกเซิร์ฟเวอร์ BlueBubbles ที่ `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    วัดช่องว่างระหว่างการ dispatch ข้อความแบบ `"Dump"` กับการ dispatch `"https://..."; Attachments:` ที่ตามมา. เพิ่ม `messages.inbound.byChannel.bluebubbles` ให้ครอบคลุมช่องว่างนั้นอย่างสบาย.

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    ไทม์สแตมป์เหตุการณ์ของเซสชัน (`~/.openclaw/agents/<id>/sessions/*.jsonl`) สะท้อนเวลาที่ Gateway ส่งข้อความให้เอเจนต์, **ไม่ใช่** เวลาที่ Webhook มาถึง. ข้อความที่สองในคิวซึ่งติดแท็ก `[Queued messages while agent was busy]` หมายความว่าเทิร์นแรกยังทำงานอยู่เมื่อ Webhook ที่สองมาถึง — bucket สำหรับรวมถูก flush ไปแล้ว. ปรับหน้าต่างโดยอ้างอิงบันทึกเซิร์ฟเวอร์ BB ไม่ใช่บันทึกเซสชัน.
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    บนเครื่องขนาดเล็กกว่า (8 GB), เทิร์นเอเจนต์อาจใช้เวลานานพอที่ bucket สำหรับรวมจะ flush ก่อนการตอบกลับเสร็จ และ URL จะเข้ามาเป็นเทิร์นที่สองในคิว. ตรวจสอบ `memory_pressure` และ `ps -o rss -p $(pgrep openclaw-gateway)`; หาก Gateway ใช้ RSS เกิน ~500 MB และ compressor ทำงานอยู่ ให้ปิดกระบวนการหนักอื่นๆ หรือย้ายไปโฮสต์ที่ใหญ่ขึ้น.
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    หากผู้ใช้แตะ `Dump` เป็น **การตอบกลับ** บอลลูน URL ที่มีอยู่ (iMessage แสดงป้าย "1 Reply" บนบอลลูน Dump), URL จะอยู่ใน `replyToBody` ไม่ใช่ใน Webhook ที่สอง. การรวมใช้ไม่ได้ — นั่นเป็นเรื่องของ skill/prompt ไม่ใช่เรื่องของ debouncer.
  </Accordion>
</AccordionGroup>

## การสตรีมแบบบล็อก

ควบคุมว่าคำตอบจะถูกส่งเป็นข้อความเดียวหรือสตรีมเป็นบล็อก:

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

- ไฟล์แนบขาเข้าจะถูกดาวน์โหลดและจัดเก็บในแคชสื่อ.
- เพดานสื่อผ่าน `channels.bluebubbles.mediaMaxMb` สำหรับสื่อขาเข้าและขาออก (ค่าเริ่มต้น: 8 MB).
- ข้อความขาออกจะถูกแบ่งเป็นชิ้นตาม `channels.bluebubbles.textChunkLimit` (ค่าเริ่มต้น: 4000 อักขระ).

## ข้อมูลอ้างอิงการกำหนดค่า

การกำหนดค่าเต็ม: [การกำหนดค่า](/th/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`: เปิด/ปิดใช้งานช่องทาง.
    - `channels.bluebubbles.serverUrl`: URL ฐานของ BlueBubbles REST API.
    - `channels.bluebubbles.password`: รหัสผ่าน API.
    - `channels.bluebubbles.webhookPath`: เส้นทางปลายทาง Webhook (ค่าเริ่มต้น: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: `pairing`).
    - `channels.bluebubbles.allowFrom`: allowlist ของ DM (handles, อีเมล, หมายเลข E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: allowlist ของผู้ส่งกลุ่ม.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: บน macOS, เลือกเพิ่มข้อมูลผู้เข้าร่วมกลุ่มที่ไม่มีชื่อจาก Contacts ในเครื่องหลังผ่านการคัดกรอง. ค่าเริ่มต้น: `false`.
    - `channels.bluebubbles.groups`: การกำหนดค่าแบบรายกลุ่ม (`requireMention` ฯลฯ).

  </Accordion>
  <Accordion title="การส่งและการแบ่งชิ้น">
    - `channels.bluebubbles.sendReadReceipts`: ส่งใบตอบรับการอ่าน (ค่าเริ่มต้น: `true`)
    - `channels.bluebubbles.blockStreaming`: เปิดใช้การสตรีมแบบบล็อก (ค่าเริ่มต้น: `false`; จำเป็นสำหรับการตอบกลับแบบสตรีม)
    - `channels.bluebubbles.textChunkLimit`: ขนาดชิ้นข้อมูลขาออกเป็นจำนวนอักขระ (ค่าเริ่มต้น: 4000)
    - `channels.bluebubbles.sendTimeoutMs`: ระยะหมดเวลาต่อคำขอเป็นมิลลิวินาทีสำหรับการส่งข้อความขาออกผ่าน `/api/v1/message/text` (ค่าเริ่มต้น: 30000) เพิ่มค่านี้ในการตั้งค่า macOS 26 ที่การส่ง iMessage ผ่าน Private API อาจค้างอยู่ในเฟรมเวิร์ก iMessage ได้นานกว่า 60 วินาที เช่น `45000` หรือ `60000` ขณะนี้โพรบ การค้นหาแชต รีแอ็กชัน การแก้ไข และการตรวจสุขภาพยังคงใช้ค่าเริ่มต้นที่สั้นกว่า 10 วินาที มีแผนจะขยายความครอบคลุมไปยังรีแอ็กชันและการแก้ไขในงานติดตามผล การตั้งค่าทับเฉพาะบัญชี: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`
    - `channels.bluebubbles.chunkMode`: `length` (ค่าเริ่มต้น) แยกเฉพาะเมื่อเกิน `textChunkLimit`; `newline` แยกตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งชิ้นตามความยาว

  </Accordion>
  <Accordion title="สื่อและประวัติ">
    - `channels.bluebubbles.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า/ขาออกเป็น MB (ค่าเริ่มต้น: 8)
    - `channels.bluebubbles.mediaLocalRoots`: รายการอนุญาตแบบชัดเจนของไดเรกทอรีภายในเครื่องแบบสัมบูรณ์ที่อนุญาตสำหรับเส้นทางสื่อภายในเครื่องขาออก การส่งเส้นทางภายในเครื่องจะถูกปฏิเสธโดยค่าเริ่มต้น เว้นแต่จะกำหนดค่านี้ไว้ การตั้งค่าทับเฉพาะบัญชี: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`
    - `channels.bluebubbles.coalesceSameSenderDms`: รวม Webhook ของ DM จากผู้ส่งเดียวกันที่ต่อเนื่องกันให้เป็นเทิร์นเดียวของเอเจนต์ เพื่อให้การส่งแยกข้อความ+URL ของ Apple มาถึงเป็นข้อความเดียว (ค่าเริ่มต้น: `false`) ดู [การรวม DM ที่ถูกส่งแยก](#coalescing-split-send-dms-command--url-in-one-composition) สำหรับสถานการณ์ การปรับหน้าต่างเวลา และข้อแลกเปลี่ยน เมื่อเปิดใช้โดยไม่มี `messages.inbound.byChannel.bluebubbles` ที่ระบุชัดเจน จะขยายหน้าต่างดีบาวซ์ขาเข้าเริ่มต้นจาก 500 ms เป็น 2500 ms
    - `channels.bluebubbles.historyLimit`: จำนวนข้อความกลุ่มสูงสุดสำหรับบริบท (0 ปิดใช้)
    - `channels.bluebubbles.dmHistoryLimit`: ขีดจำกัดประวัติ DM
    - `channels.bluebubbles.replyContextApiFallback`: เมื่อการตอบกลับขาเข้ามาถึงโดยไม่มี `replyToBody`/`replyToSender` และแคชบริบทการตอบกลับในหน่วยความจำไม่พบ ให้ดึงข้อความต้นฉบับจาก BlueBubbles HTTP API เป็นทางสำรองแบบพยายามให้ดีที่สุด (ค่าเริ่มต้น: `false`) มีประโยชน์สำหรับการปรับใช้หลายอินสแตนซ์ที่ใช้บัญชี BlueBubbles เดียวกัน หลังรีสตาร์ทโปรเซส หรือหลังแคช TTL/LRU ที่มีอายุยาวถูกขับออก การดึงนี้มีการป้องกัน SSRF ด้วยนโยบายเดียวกับคำขอไคลเอนต์ BlueBubbles อื่นทั้งหมด ไม่โยนข้อผิดพลาด และเติมแคชเพื่อให้การตอบกลับครั้งถัดไปเฉลี่ยต้นทุนได้ การตั้งค่าทับเฉพาะบัญชี: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback` การตั้งค่าระดับช่องทางจะเผยแพร่ไปยังบัญชีที่ไม่ได้ระบุแฟล็กนี้

  </Accordion>
  <Accordion title="การดำเนินการและบัญชี">
    - `channels.bluebubbles.actions`: เปิด/ปิดการดำเนินการเฉพาะรายการ
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
- แฮนเดิลโดยตรง: `+15555550123`, `user@example.com`
  - หากแฮนเดิลโดยตรงไม่มีแชต DM อยู่แล้ว OpenClaw จะสร้างให้ผ่าน `POST /api/v1/chat/new` ซึ่งต้องเปิดใช้ BlueBubbles Private API

### การกำหนดเส้นทาง iMessage เทียบกับ SMS

เมื่อแฮนเดิลเดียวกันมีทั้งแชต iMessage และ SMS บน Mac (เช่น หมายเลขโทรศัพท์ที่ลงทะเบียน iMessage แล้ว แต่เคยได้รับข้อความสำรองแบบฟองเขียวด้วย) OpenClaw จะเลือกแชต iMessage และจะไม่ลดระดับเป็น SMS อย่างเงียบ ๆ หากต้องการบังคับใช้แชต SMS ให้ใช้คำนำหน้าเป้าหมาย `sms:` อย่างชัดเจน (เช่น `sms:+15555550123`) แฮนเดิลที่ไม่มีแชต iMessage ที่ตรงกันจะยังส่งผ่านแชตใดก็ตามที่ BlueBubbles รายงาน

## ความปลอดภัย

- คำขอ Webhook ได้รับการยืนยันตัวตนโดยเปรียบเทียบพารามิเตอร์คำค้นหรือส่วนหัว `guid`/`password` กับ `channels.bluebubbles.password`
- เก็บรหัสผ่าน API และปลายทาง Webhook เป็นความลับ (ปฏิบัติต่อสิ่งเหล่านี้เหมือนข้อมูลรับรอง)
- ไม่มีการข้ามการยืนยันตัวตน Webhook ของ BlueBubbles สำหรับ localhost หากคุณพร็อกซีทราฟฟิก Webhook ให้คงรหัสผ่าน BlueBubbles ไว้ในคำขอตลอดทาง `gateway.trustedProxies` ไม่ได้แทนที่ `channels.bluebubbles.password` ที่นี่ ดู [ความปลอดภัยของ Gateway](/th/gateway/security#reverse-proxy-configuration)
- เปิดใช้ HTTPS + กฎไฟร์วอลล์บนเซิร์ฟเวอร์ BlueBubbles หากเปิดให้เข้าถึงจากภายนอก LAN ของคุณ

## การแก้ไขปัญหา

- หากเหตุการณ์กำลังพิมพ์/อ่านหยุดทำงาน ให้ตรวจสอบบันทึก Webhook ของ BlueBubbles และยืนยันว่าเส้นทาง Gateway ตรงกับ `channels.bluebubbles.webhookPath`
- โค้ดการจับคู่หมดอายุหลังหนึ่งชั่วโมง; ใช้ `openclaw pairing list bluebubbles` และ `openclaw pairing approve bluebubbles <code>`
- รีแอ็กชันต้องใช้ BlueBubbles private API (`POST /api/v1/message/react`); ตรวจสอบให้แน่ใจว่าเวอร์ชันเซิร์ฟเวอร์เปิดเผย API นี้
- การแก้ไข/ยกเลิกการส่งต้องใช้ macOS 13+ และเวอร์ชันเซิร์ฟเวอร์ BlueBubbles ที่เข้ากันได้ บน macOS 26 (Tahoe) ขณะนี้การแก้ไขใช้งานไม่ได้เนื่องจากการเปลี่ยนแปลงของ private API
- การอัปเดตไอคอนกลุ่มอาจไม่เสถียรบน macOS 26 (Tahoe): API อาจคืนค่าสำเร็จแต่ไอคอนใหม่ไม่ซิงก์
- OpenClaw ซ่อนการดำเนินการที่ทราบว่าเสียโดยอัตโนมัติตามเวอร์ชัน macOS ของเซิร์ฟเวอร์ BlueBubbles หากการแก้ไขยังปรากฏบน macOS 26 (Tahoe) ให้ปิดใช้ด้วยตนเองโดยใช้ `channels.bluebubbles.actions.edit=false`
- เปิดใช้ `coalesceSameSenderDms` แล้วแต่การส่งแยก (เช่น `Dump` + URL) ยังมาถึงเป็นสองเทิร์น: ดูรายการตรวจสอบ [การแก้ไขปัญหาการรวมการส่งแยก](#split-send-coalescing-troubleshooting) — สาเหตุทั่วไปคือหน้าต่างดีบาวซ์แคบเกินไป การอ่านเวลาประทับในบันทึกเซสชันผิดว่าเป็นเวลาที่ Webhook มาถึง หรือการส่งแบบอ้างอิงคำตอบ (ซึ่งใช้ `replyToBody` ไม่ใช่ Webhook ที่สอง)
- สำหรับข้อมูลสถานะ/สุขภาพ: `openclaw status --all` หรือ `openclaw status --deep`

สำหรับข้อมูลอ้างอิงเวิร์กโฟลว์ช่องทางทั่วไป ดูคู่มือ [Channels](/th/channels) และ [Plugins](/th/tools/plugin)

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวม Channels](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการควบคุมการกล่าวถึง
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
