---
read_when:
    - การตั้งค่าช่องทาง BlueBubbles
    - การแก้ไขปัญหาการจับคู่ Webhook
    - การกำหนดค่า iMessage บน macOS
sidebarTitle: BlueBubbles
summary: iMessage ผ่านเซิร์ฟเวอร์ macOS ของ BlueBubbles (การส่ง/รับผ่าน REST, การพิมพ์, การตอบสนอง, การจับคู่, การดำเนินการขั้นสูง).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-04T02:21:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78a054da0c7c32b161997acd05914896259dd1a050e736a4c9e438a452ab6a51
    source_path: channels/bluebubbles.md
    workflow: 16
---

สถานะ: Plugin ที่บันเดิลมาซึ่งสื่อสารกับเซิร์ฟเวอร์ BlueBubbles macOS ผ่าน HTTP **แนะนำสำหรับการผสานรวม iMessage** เนื่องจากมี API ที่สมบูรณ์กว่าและตั้งค่าง่ายกว่าเมื่อเทียบกับช่องทาง imsg แบบเดิม

<Note>
OpenClaw รุ่นปัจจุบันบันเดิล BlueBubbles มาให้แล้ว ดังนั้นบิลด์แบบแพ็กเกจปกติจึงไม่ต้องมีขั้นตอน `openclaw plugins install` แยกต่างหาก
</Note>

## ภาพรวม

- ทำงานบน macOS ผ่านแอปตัวช่วย BlueBubbles ([bluebubbles.app](https://bluebubbles.app))
- แนะนำ/ทดสอบแล้ว: macOS Sequoia (15) macOS Tahoe (26) ใช้งานได้; ขณะนี้การแก้ไขยังใช้ไม่ได้บน Tahoe และการอัปเดตไอคอนกลุ่มอาจรายงานว่าสำเร็จแต่ไม่ซิงก์
- OpenClaw สื่อสารกับมันผ่าน REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`)
- ข้อความขาเข้ามาผ่าน Webhook; การตอบกลับขาออก, ตัวบ่งชี้การพิมพ์, ใบรับทราบการอ่าน และ tapback เป็นการเรียก REST
- ไฟล์แนบและสติกเกอร์จะถูกนำเข้าเป็นสื่อขาเข้า (และแสดงให้เอเจนต์เห็นเมื่อทำได้)
- การตอบกลับ Auto-TTS ที่สังเคราะห์เสียง MP3 หรือ CAF จะถูกส่งเป็นบับเบิลบันทึกเสียงของ iMessage แทนไฟล์แนบธรรมดา
- การจับคู่/allowlist ทำงานเหมือนช่องทางอื่น (`/channels/pairing` เป็นต้น) ด้วย `channels.bluebubbles.allowFrom` + โค้ดจับคู่
- รีแอ็กชันจะแสดงเป็นเหตุการณ์ระบบเช่นเดียวกับ Slack/Telegram เพื่อให้เอเจนต์สามารถ "กล่าวถึง" ก่อนตอบกลับได้
- คุณสมบัติขั้นสูง: แก้ไข, ยกเลิกการส่ง, เธรดการตอบกลับ, เอฟเฟกต์ข้อความ, การจัดการกลุ่ม

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Install BlueBubbles">
    ติดตั้งเซิร์ฟเวอร์ BlueBubbles บน Mac ของคุณ (ทำตามคำแนะนำที่ [bluebubbles.app/install](https://bluebubbles.app/install))
  </Step>
  <Step title="Enable the web API">
    ในการกำหนดค่า BlueBubbles ให้เปิดใช้ web API และตั้งรหัสผ่าน
  </Step>
  <Step title="Configure OpenClaw">
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
  <Step title="Point webhooks at the gateway">
    ชี้ Webhook ของ BlueBubbles ไปยัง Gateway ของคุณ (ตัวอย่าง: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)
  </Step>
  <Step title="Start the gateway">
    เริ่ม Gateway; ระบบจะลงทะเบียนตัวจัดการ Webhook และเริ่มการจับคู่
  </Step>
</Steps>

<Warning>
**ความปลอดภัย**

- ตั้งรหัสผ่าน Webhook เสมอ
- ต้องมีการยืนยันตัวตนของ Webhook เสมอ OpenClaw จะปฏิเสธคำขอ Webhook ของ BlueBubbles เว้นแต่คำขอนั้นจะมีรหัสผ่าน/guid ที่ตรงกับ `channels.bluebubbles.password` (เช่น `?password=<password>` หรือ `x-password`) โดยไม่ขึ้นกับโทโพโลยี loopback/proxy
- ระบบจะตรวจสอบการยืนยันตัวตนด้วยรหัสผ่านก่อนอ่าน/แยกวิเคราะห์เนื้อหา Webhook แบบเต็ม

</Warning>

## การทำให้ Messages.app ทำงานอยู่เสมอ (VM / การตั้งค่าแบบไม่มีหน้าจอ)

การตั้งค่า macOS VM / แบบเปิดตลอดเวลาบางแบบอาจทำให้ Messages.app เข้าสู่สถานะ "idle" (เหตุการณ์ขาเข้าหยุดจนกว่าแอปจะถูกเปิด/นำมาไว้ด้านหน้า) วิธีแก้แบบง่ายคือ **กระตุ้น Messages ทุก 5 นาที** โดยใช้ AppleScript + LaunchAgent

<Steps>
  <Step title="Save the AppleScript">
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
  <Step title="Install a LaunchAgent">
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

    สิ่งนี้จะทำงาน **ทุก 300 วินาที** และ **เมื่อเข้าสู่ระบบ** การเรียกใช้ครั้งแรกอาจทำให้ macOS แสดงพร้อมท์ **Automation** (`osascript` → Messages) อนุมัติพร้อมท์เหล่านั้นในเซสชันผู้ใช้เดียวกับที่เรียกใช้ LaunchAgent

  </Step>
  <Step title="Load it">
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

ตัวช่วยตั้งค่าจะถามค่าเหล่านี้:

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
  หมายเลขโทรศัพท์, อีเมล หรือเป้าหมายแชท
</ParamField>

คุณยังสามารถเพิ่ม BlueBubbles ผ่าน CLI ได้ด้วย:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

<Tabs>
  <Tab title="DMs">
    - ค่าเริ่มต้น: `channels.bluebubbles.dmPolicy = "pairing"`
    - ผู้ส่งที่ไม่รู้จักจะได้รับโค้ดจับคู่; ข้อความจะถูกละเว้นจนกว่าจะได้รับอนุมัติ (โค้ดหมดอายุหลัง 1 ชั่วโมง)
    - อนุมัติผ่าน:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - การจับคู่เป็นการแลกเปลี่ยนโทเค็นค่าเริ่มต้น รายละเอียด: [การจับคู่](/th/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`)
    - `channels.bluebubbles.groupAllowFrom` ควบคุมว่าใครสามารถทริกเกอร์ในกลุ่มเมื่อกำหนด `allowlist`

  </Tab>
</Tabs>

### การเติมชื่อผู้ติดต่อ (macOS, ไม่บังคับ)

Webhook กลุ่มของ BlueBubbles มักมีเฉพาะที่อยู่ผู้เข้าร่วมแบบดิบ หากคุณต้องการให้บริบท `GroupMembers` แสดงชื่อผู้ติดต่อในเครื่องแทน คุณสามารถเลือกใช้การเติมข้อมูลจาก Contacts ในเครื่องบน macOS ได้:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` เปิดใช้การค้นหา ค่าเริ่มต้น: `false`
- การค้นหาจะทำงานหลังจากการเข้าถึงกลุ่ม, การอนุญาตคำสั่ง และด่านการกล่าวถึงได้อนุญาตให้ข้อความผ่านแล้วเท่านั้น
- ระบบจะเติมข้อมูลเฉพาะผู้เข้าร่วมที่เป็นหมายเลขโทรศัพท์และยังไม่มีชื่อเท่านั้น
- หมายเลขโทรศัพท์ดิบจะยังคงเป็นค่าทดแทนเมื่อไม่พบรายการที่ตรงกันในเครื่อง

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

BlueBubbles รองรับด่านการกล่าวถึงสำหรับแชทกลุ่ม โดยสอดคล้องกับพฤติกรรมของ iMessage/WhatsApp:

- ใช้ `agents.list[].groupChat.mentionPatterns` (หรือ `messages.groupChat.mentionPatterns`) เพื่อตรวจจับการกล่าวถึง
- เมื่อเปิดใช้ `requireMention` สำหรับกลุ่ม เอเจนต์จะตอบเฉพาะเมื่อถูกกล่าวถึง
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

แต่ละรายการภายใต้ `channels.bluebubbles.groups.*` รับสตริง `systemPrompt` ที่ไม่บังคับได้ ค่านี้จะถูกฉีดเข้าไปในพรอมป์ระบบของเอเจนต์ทุกเทิร์นที่จัดการข้อความในกลุ่มนั้น เพื่อให้คุณตั้งบุคลิกหรือกฎพฤติกรรมต่อกลุ่มได้โดยไม่ต้องแก้ไขพรอมป์ของเอเจนต์:

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

คีย์ตรงกับค่าที่ BlueBubbles รายงานเป็น `chatGuid` / `chatIdentifier` / `chatId` แบบตัวเลขสำหรับกลุ่ม และรายการไวลด์การ์ด `"*"` จะให้ค่าเริ่มต้นสำหรับทุกกลุ่มที่ไม่มีรายการตรงกันแบบแน่นอน (เป็นรูปแบบเดียวกับที่ใช้โดย `requireMention` และนโยบายเครื่องมือต่อกลุ่ม) รายการตรงกันแบบแน่นอนจะชนะไวลด์การ์ดเสมอ DM จะละเว้นฟิลด์นี้; ใช้การปรับแต่งพรอมป์ระดับเอเจนต์หรือระดับบัญชีแทน

#### ตัวอย่างที่ใช้งานจริง: การตอบกลับแบบเธรดและรีแอ็กชัน tapback (Private API)

เมื่อเปิดใช้ BlueBubbles Private API ข้อความขาเข้าจะมาพร้อม ID ข้อความแบบสั้น (เช่น `[[reply_to:5]]`) และเอเจนต์สามารถเรียก `action=reply` เพื่อเธรดเข้าไปยังข้อความเฉพาะ หรือ `action=react` เพื่อวาง tapback ได้ `systemPrompt` ต่อกลุ่มเป็นวิธีที่เชื่อถือได้ในการทำให้เอเจนต์เลือกเครื่องมือที่ถูกต้อง:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: "When replying in this group, always call action=reply with the [[reply_to:N]] messageId from context so your response threads under the triggering message. Never send a new unlinked message. For short acknowledgements ('ok', 'got it', 'on it'), use action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓) instead of sending a text reply.",
        },
      },
    },
  },
}
```

ทั้งรีแอ็กชัน tapback และการตอบกลับแบบเธรดต้องใช้ BlueBubbles Private API; ดู [การดำเนินการขั้นสูง](#advanced-actions) และ [ID ข้อความ](#message-ids-short-vs-full) สำหรับกลไกพื้นฐาน

## การผูกการสนทนา ACP

แชท BlueBubbles สามารถเปลี่ยนเป็นเวิร์กสเปซ ACP ที่คงทนได้โดยไม่ต้องเปลี่ยนเลเยอร์การขนส่ง

โฟลว์ผู้ปฏิบัติงานแบบเร็ว:

- เรียกใช้ `/acp spawn codex --bind here` ภายใน DM หรือแชทกลุ่มที่อนุญาต
- ข้อความในอนาคตในการสนทนา BlueBubbles เดียวกันนั้นจะถูกส่งไปยังเซสชัน ACP ที่สร้างขึ้น
- `/new` และ `/reset` รีเซ็ตเซสชัน ACP ที่ผูกเดียวกันในตำแหน่งเดิม
- `/acp close` ปิดเซสชัน ACP และลบการผูก

การผูกแบบถาวรที่กำหนดค่าไว้ยังรองรับผ่านรายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` และ `match.channel: "bluebubbles"`

`match.peer.id` สามารถใช้รูปแบบเป้าหมาย BlueBubbles ที่รองรับใดก็ได้:

- แฮนเดิล DM ที่ทำให้เป็นมาตรฐานแล้ว เช่น `+15555550123` หรือ `user@example.com`
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

ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับพฤติกรรมการผูก ACP ที่ใช้ร่วมกัน

## การพิมพ์ + ใบรับทราบการอ่าน

- **ตัวบ่งชี้การพิมพ์**: ส่งโดยอัตโนมัติก่อนและระหว่างการสร้างคำตอบ
- **ใบรับทราบการอ่าน**: ควบคุมโดย `channels.bluebubbles.sendReadReceipts` (ค่าเริ่มต้น: `true`)
- **ตัวบ่งชี้การพิมพ์**: OpenClaw ส่งเหตุการณ์เริ่มพิมพ์; BlueBubbles จะล้างการพิมพ์โดยอัตโนมัติเมื่อส่งหรือหมดเวลา (การหยุดด้วยตนเองผ่าน DELETE ไม่น่าเชื่อถือ)

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

BlueBubbles รองรับการดำเนินการข้อความขั้นสูงเมื่อเปิดใช้ใน config:

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
    - **react**: เพิ่ม/ลบปฏิกิริยา tapback (`messageId`, `emoji`, `remove`) ชุด tapback ดั้งเดิมของ iMessage คือ `love`, `like`, `dislike`, `laugh`, `emphasize` และ `question` เมื่อเอเจนต์เลือกอีโมจินอกชุดนั้น (เช่น `👀`) เครื่องมือปฏิกิริยาจะ fallback เป็น `love` เพื่อให้ tapback ยังแสดงผลแทนที่จะทำให้คำขอทั้งหมดล้มเหลว ปฏิกิริยา ack ที่กำหนดค่าไว้ยังตรวจสอบอย่างเข้มงวดและจะแจ้งข้อผิดพลาดเมื่อเจอค่าที่ไม่รู้จัก
    - **edit**: แก้ไขข้อความที่ส่งแล้ว (`messageId`, `text`)
    - **unsend**: ยกเลิกการส่งข้อความ (`messageId`)
    - **reply**: ตอบกลับข้อความที่ระบุ (`messageId`, `text`, `to`)
    - **sendWithEffect**: ส่งพร้อมเอฟเฟกต์ iMessage (`text`, `to`, `effectId`)
    - **renameGroup**: เปลี่ยนชื่อแชตกลุ่ม (`chatGuid`, `displayName`)
    - **setGroupIcon**: ตั้งค่าไอคอน/รูปภาพของแชตกลุ่ม (`chatGuid`, `media`) — ไม่เสถียรบน macOS 26 Tahoe (API อาจส่งคืนว่าสำเร็จ แต่ไอคอนไม่ซิงก์)
    - **addParticipant**: เพิ่มบุคคลลงในกลุ่ม (`chatGuid`, `address`)
    - **removeParticipant**: ลบบุคคลออกจากกลุ่ม (`chatGuid`, `address`)
    - **leaveGroup**: ออกจากแชตกลุ่ม (`chatGuid`)
    - **upload-file**: ส่งสื่อ/ไฟล์ (`to`, `buffer`, `filename`, `asVoice`)
      - วอยซ์เมโม: ตั้งค่า `asVoice: true` พร้อมเสียง **MP3** หรือ **CAF** เพื่อส่งเป็นข้อความเสียง iMessage BlueBubbles แปลง MP3 → CAF เมื่อส่งวอยซ์เมโม
    - นามแฝงเดิม: `sendAttachment` ยังใช้งานได้ แต่ `upload-file` คือชื่อการดำเนินการมาตรฐาน

  </Accordion>
</AccordionGroup>

### ID ข้อความ (แบบสั้นเทียบกับแบบเต็ม)

OpenClaw อาจแสดง ID ข้อความแบบ _สั้น_ (เช่น `1`, `2`) เพื่อประหยัดโทเคน

- `MessageSid` / `ReplyToId` อาจเป็น ID แบบสั้นได้
- `MessageSidFull` / `ReplyToIdFull` มี ID แบบเต็มของผู้ให้บริการ
- ID แบบสั้นอยู่ในหน่วยความจำ และอาจหมดอายุเมื่อรีสตาร์ทหรือเมื่อ cache ถูกขับออก
- การดำเนินการยอมรับ `messageId` แบบสั้นหรือแบบเต็ม แต่ ID แบบสั้นจะแจ้งข้อผิดพลาดหากไม่มีให้ใช้แล้ว

ใช้ ID แบบเต็มสำหรับระบบอัตโนมัติและการจัดเก็บที่ต้องคงทน:

- เทมเพลต: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- บริบท: `MessageSidFull` / `ReplyToIdFull` ใน payload ขาเข้า

ดู [การกำหนดค่า](/th/gateway/configuration) สำหรับตัวแปรเทมเพลต

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## รวม DM แบบส่งแยก (คำสั่ง + URL ในการเขียนข้อความครั้งเดียว)

เมื่อผู้ใช้พิมพ์คำสั่งและ URL พร้อมกันใน iMessage — เช่น `Dump https://example.com/article` — Apple จะแยกการส่งเป็น **Webhook สองรายการแยกกัน**:

1. ข้อความตัวอักษร (`"Dump"`)
2. บอลลูนตัวอย่าง URL (`"https://..."`) พร้อมรูปภาพตัวอย่าง OG เป็นไฟล์แนบ

Webhook ทั้งสองมาถึง OpenClaw ห่างกันประมาณ 0.8-2.0 วินาทีในชุดติดตั้งส่วนใหญ่ หากไม่มีการรวม เอเจนต์จะได้รับคำสั่งอย่างเดียวในเทิร์น 1 ตอบกลับ (มักเป็น "ส่ง URL มาให้ฉัน") และเห็น URL เฉพาะในเทิร์น 2 — ซึ่งตอนนั้นบริบทของคำสั่งหายไปแล้ว

`channels.bluebubbles.coalesceSameSenderDms` เลือกให้ DM รวม Webhook ต่อเนื่องจากผู้ส่งคนเดียวกันเป็นเทิร์นเอเจนต์เดียว แชตกลุ่มยังคง key ตามแต่ละข้อความเพื่อรักษาโครงสร้างเทิร์นแบบหลายผู้ใช้

<Tabs>
  <Tab title="ควรเปิดใช้เมื่อใด">
    เปิดใช้เมื่อ:

    - คุณส่ง Skills ที่คาดหวัง `command + payload` ในข้อความเดียว (dump, paste, save, queue ฯลฯ)
    - ผู้ใช้ของคุณวาง URL, รูปภาพ หรือเนื้อหายาวร่วมกับคำสั่ง
    - คุณยอมรับ latency ของเทิร์น DM ที่เพิ่มขึ้นได้ (ดูด้านล่าง)

    ปล่อยให้ปิดใช้เมื่อ:

    - คุณต้องการ latency ต่ำสุดสำหรับทริกเกอร์ DM แบบคำเดียว
    - flow ทั้งหมดของคุณเป็นคำสั่งครั้งเดียวที่ไม่มี payload ตามมา

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

    เมื่อเปิดแฟล็กและไม่มี `messages.inbound.byChannel.bluebubbles` ที่ระบุชัดเจน หน้าต่าง debounce จะขยายเป็น **2500 ms** (ค่าเริ่มต้นสำหรับแบบไม่รวมคือ 500 ms) จำเป็นต้องใช้หน้าต่างที่กว้างขึ้น — จังหวะการส่งแยกของ Apple ที่ 0.8-2.0 วินาทีไม่พอดีกับค่าเริ่มต้นที่แคบกว่า

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
    - **latency ที่เพิ่มขึ้นสำหรับคำสั่งควบคุม DM** เมื่อเปิดแฟล็ก ข้อความคำสั่งควบคุม DM (เช่น `Dump`, `Save` ฯลฯ) จะรอได้สูงสุดเท่าหน้าต่าง debounce ก่อน dispatch เผื่อมี Webhook payload กำลังมา คำสั่งในแชตกลุ่มยัง dispatch ทันที
    - **เอาต์พุตที่รวมแล้วมีขอบเขตจำกัด** — ข้อความที่รวมกันจำกัดที่ 4000 อักขระพร้อมตัวทำเครื่องหมาย `…[truncated]` ที่ชัดเจน ไฟล์แนบจำกัดที่ 20 รายการ รายการ source จำกัดที่ 10 รายการ (เก็บรายการแรกพร้อมรายการล่าสุดเมื่อเกินกว่านั้น) `messageId` ของทุก source ยังไปถึง inbound-dedupe เพื่อให้การ replay ภายหลังของ MessagePoller สำหรับเหตุการณ์เดี่ยวใดๆ ถูกจดจำว่าเป็นข้อมูลซ้ำ
    - **เลือกเปิดใช้ราย channel** channel อื่นๆ (Telegram, WhatsApp, Slack, …) ไม่ได้รับผลกระทบ

  </Tab>
</Tabs>

### สถานการณ์และสิ่งที่เอเจนต์เห็น

| ผู้ใช้เขียน                                                      | Apple ส่งมอบ            | ปิดแฟล็ก (ค่าเริ่มต้น)                      | เปิดแฟล็ก + หน้าต่าง 2500 ms                                                |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (ส่งครั้งเดียว)                              | 2 Webhook ห่างกันประมาณ 1 วินาที     | สองเทิร์นเอเจนต์: "Dump" อย่างเดียว จากนั้น URL | หนึ่งเทิร์น: ข้อความที่รวมแล้ว `Dump https://example.com`                        |
| `Save this 📎image.jpg caption` (ไฟล์แนบ + ข้อความ)                | 2 Webhook                | สองเทิร์น                               | หนึ่งเทิร์น: ข้อความ + รูปภาพ                                                  |
| `/status` (คำสั่งเดี่ยว)                                     | 1 Webhook                 | dispatch ทันที                        | **รอได้สูงสุดเท่าหน้าต่าง แล้วจึง dispatch**                                    |
| วาง URL เพียงอย่างเดียว                                                   | 1 Webhook                 | dispatch ทันที                        | dispatch ทันที (มีเพียงรายการเดียวใน bucket)                             |
| ข้อความ + URL ที่ส่งเป็นข้อความแยกสองรายการโดยตั้งใจ ห่างกันหลายนาที | 2 Webhook นอกหน้าต่าง | สองเทิร์น                               | สองเทิร์น (หน้าต่างหมดอายุระหว่างกัน)                                 |
| ส่ง DM เล็กๆ ถี่มาก (>10 รายการในหน้าต่าง)                          | N Webhook                | N เทิร์น                                 | หนึ่งเทิร์น เอาต์พุตมีขอบเขตจำกัด (รายการแรก + ล่าสุด ใช้ขีดจำกัดข้อความ/ไฟล์แนบ) |

### การแก้ปัญหาการรวมการส่งแยก

หากเปิดแฟล็กแล้ว แต่การส่งแยกยังมาถึงเป็นสองเทิร์น ให้ตรวจสอบแต่ละชั้น:

<AccordionGroup>
  <Accordion title="โหลด config แล้วจริง">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    จากนั้น `openclaw gateway restart` — แฟล็กนี้ถูกอ่านตอนสร้าง debouncer-registry

  </Accordion>
  <Accordion title="หน้าต่าง debounce กว้างพอสำหรับชุดติดตั้งของคุณ">
    ดู log ของเซิร์ฟเวอร์ BlueBubbles ใต้ `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    วัดช่องว่างระหว่างการ dispatch ข้อความแบบ `"Dump"` กับการ dispatch `"https://..."; Attachments:` ที่ตามมา เพิ่ม `messages.inbound.byChannel.bluebubbles` ให้ครอบคลุมช่องว่างนั้นอย่างสบาย

  </Accordion>
  <Accordion title="timestamp ของ Session JSONL ≠ การมาถึงของ Webhook">
    timestamp ของเหตุการณ์ session (`~/.openclaw/agents/<id>/sessions/*.jsonl`) สะท้อนเวลาที่ Gateway ส่งข้อความให้เอเจนต์ **ไม่ใช่** เวลาที่ Webhook มาถึง ข้อความที่สองในคิวที่ติดแท็ก `[Queued messages while agent was busy]` หมายความว่าเทิร์นแรกยังทำงานอยู่เมื่อ Webhook ที่สองมาถึง — bucket รวมได้ flush ไปแล้ว ปรับหน้าต่างเทียบกับ log ของเซิร์ฟเวอร์ BB ไม่ใช่ log ของ session
  </Accordion>
  <Accordion title="memory pressure ทำให้การ dispatch คำตอบช้าลง">
    บนเครื่องขนาดเล็ก (8 GB) เทิร์นเอเจนต์อาจใช้เวลานานพอที่ bucket รวมจะ flush ก่อนการตอบกลับเสร็จ และ URL จะตกเป็นเทิร์นที่สองในคิว ตรวจสอบ `memory_pressure` และ `ps -o rss -p $(pgrep openclaw-gateway)`; หาก Gateway เกินประมาณ 500 MB RSS และ compressor ทำงานอยู่ ให้ปิด process หนักอื่นๆ หรือย้ายไป host ที่ใหญ่กว่า
  </Accordion>
  <Accordion title="การส่งแบบอ้างอิงคำตอบเป็นเส้นทางคนละแบบ">
    หากผู้ใช้แตะ `Dump` เป็น **การตอบกลับ** บอลลูน URL ที่มีอยู่แล้ว (iMessage แสดง badge "1 Reply" บน bubble Dump) URL จะอยู่ใน `replyToBody` ไม่ใช่ใน Webhook ที่สอง การรวมใช้ไม่ได้ — นั่นเป็นเรื่องของ skill/prompt ไม่ใช่เรื่องของ debouncer
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

- ไฟล์แนบขาเข้าจะถูกดาวน์โหลดและจัดเก็บใน cache สื่อ
- ขีดจำกัดสื่อผ่าน `channels.bluebubbles.mediaMaxMb` สำหรับสื่อขาเข้าและขาออก (ค่าเริ่มต้น: 8 MB)
- ข้อความขาออกจะถูกแบ่ง chunk ตาม `channels.bluebubbles.textChunkLimit` (ค่าเริ่มต้น: 4000 อักขระ)

## อ้างอิงการกำหนดค่า

การกำหนดค่าทั้งหมด: [การกำหนดค่า](/th/gateway/configuration)

<AccordionGroup>
  <Accordion title="การเชื่อมต่อและ Webhook">
    - `channels.bluebubbles.enabled`: เปิด/ปิด channel
    - `channels.bluebubbles.serverUrl`: URL ฐานของ BlueBubbles REST API
    - `channels.bluebubbles.password`: รหัสผ่าน API
    - `channels.bluebubbles.webhookPath`: path endpoint ของ Webhook (ค่าเริ่มต้น: `/bluebubbles-webhook`)

  </Accordion>
  <Accordion title="นโยบายการเข้าถึง">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: `pairing`)
    - `channels.bluebubbles.allowFrom`: allowlist ของ DM (handles, emails, หมายเลข E.164, `chat_id:*`, `chat_guid:*`)
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`)
    - `channels.bluebubbles.groupAllowFrom`: allowlist ของผู้ส่งในกลุ่ม
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: บน macOS เลือกเติมข้อมูลผู้เข้าร่วมกลุ่มที่ไม่มีชื่อจาก Contacts ในเครื่องหลังผ่าน gating แล้ว ค่าเริ่มต้น: `false`
    - `channels.bluebubbles.groups`: config รายกลุ่ม (`requireMention` ฯลฯ)

  </Accordion>
  <Accordion title="การส่งมอบและการแบ่งส่วน">
    - `channels.bluebubbles.sendReadReceipts`: ส่งใบตอบรับว่าอ่านแล้ว (ค่าเริ่มต้น: `true`).
    - `channels.bluebubbles.blockStreaming`: เปิดใช้ block streaming (ค่าเริ่มต้น: `false`; จำเป็นสำหรับการตอบกลับแบบสตรีม).
    - `channels.bluebubbles.textChunkLimit`: ขนาดส่วนข้อความขาออกเป็นจำนวนอักขระ (ค่าเริ่มต้น: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: เวลาหมดเวลาต่อคำขอเป็นมิลลิวินาทีสำหรับการส่งข้อความขาออกผ่าน `/api/v1/message/text` (ค่าเริ่มต้น: 30000). เพิ่มค่านี้ในการตั้งค่า macOS 26 ที่การส่ง Private API iMessage อาจค้างอยู่ภายในเฟรมเวิร์ก iMessage นานกว่า 60 วินาที; ตัวอย่างเช่น `45000` หรือ `60000`. โพรบ การค้นหาแชท รีแอ็กชัน การแก้ไข และการตรวจสุขภาพยังคงใช้ค่าเริ่มต้นที่สั้นกว่า 10 วินาทีในปัจจุบัน; มีแผนจะขยายความครอบคลุมไปยังรีแอ็กชันและการแก้ไขเป็นงานติดตามผล. การแทนที่ต่อบัญชี: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (ค่าเริ่มต้น) จะแยกเฉพาะเมื่อเกิน `textChunkLimit`; `newline` จะแยกตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนการแบ่งส่วนตามความยาว.

  </Accordion>
  <Accordion title="สื่อและประวัติ">
    - `channels.bluebubbles.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า/ขาออกเป็น MB (ค่าเริ่มต้น: 8).
    - `channels.bluebubbles.mediaLocalRoots`: allowlist แบบระบุชัดเจนของไดเรกทอรีภายในเครื่องแบบ absolute ที่อนุญาตสำหรับพาธสื่อขาออกภายในเครื่อง. การส่งพาธภายในเครื่องจะถูกปฏิเสธโดยค่าเริ่มต้น เว้นแต่จะกำหนดค่านี้ไว้. การแทนที่ต่อบัญชี: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: รวม Webhook DM ต่อเนื่องจากผู้ส่งเดียวกันให้เป็นหนึ่งรอบของเอเจนต์ เพื่อให้การส่งแบบแยกข้อความ+URL ของ Apple มาถึงเป็นข้อความเดียว (ค่าเริ่มต้น: `false`). ดู [การรวม DM ที่ส่งแบบแยก](#coalescing-split-send-dms-command--url-in-one-composition) สำหรับสถานการณ์ การปรับหน้าต่างเวลา และข้อแลกเปลี่ยน. ขยายหน้าต่าง debounce ขาเข้าเริ่มต้นจาก 500 ms เป็น 2500 ms เมื่อเปิดใช้โดยไม่มี `messages.inbound.byChannel.bluebubbles` ที่ระบุชัดเจน.
    - `channels.bluebubbles.historyLimit`: จำนวนข้อความกลุ่มสูงสุดสำหรับบริบท (0 คือปิดใช้).
    - `channels.bluebubbles.dmHistoryLimit`: ขีดจำกัดประวัติ DM.
    - `channels.bluebubbles.replyContextApiFallback`: เมื่อคำตอบขาเข้ามาถึงโดยไม่มี `replyToBody`/`replyToSender` และแคชบริบทคำตอบในหน่วยความจำไม่พบข้อมูล ให้ดึงข้อความต้นฉบับจาก BlueBubbles HTTP API เป็นทางเลือกสำรองแบบพยายามเต็มที่ (ค่าเริ่มต้น: `false`). มีประโยชน์สำหรับการปรับใช้หลายอินสแตนซ์ที่แชร์บัญชี BlueBubbles เดียวกัน หลังรีสตาร์ตโปรเซส หรือหลังการขับข้อมูลออกจากแคช TTL/LRU ที่มีอายุยาว. การดึงข้อมูลถูกป้องกัน SSRF ด้วยนโยบายเดียวกับทุกคำขอไคลเอนต์ BlueBubbles อื่นๆ ไม่ throw และเติมแคชเพื่อให้คำตอบถัดไปใช้ต้นทุนเฉลี่ยลดลง. การแทนที่ต่อบัญชี: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. การตั้งค่าระดับช่องทางจะเผยแพร่ไปยังบัญชีที่ไม่ได้ระบุแฟล็กนี้.

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

ควรใช้ `chat_guid` สำหรับการกำหนดเส้นทางที่เสถียร:

- `chat_guid:iMessage;-;+15555550123` (แนะนำสำหรับกลุ่ม)
- `chat_id:123`
- `chat_identifier:...`
- แฮนเดิลโดยตรง: `+15555550123`, `user@example.com`
  - หากแฮนเดิลโดยตรงไม่มีแชท DM อยู่แล้ว OpenClaw จะสร้างผ่าน `POST /api/v1/chat/new`. สิ่งนี้จำเป็นต้องเปิดใช้ BlueBubbles Private API.

### การกำหนดเส้นทาง iMessage เทียบกับ SMS

เมื่อแฮนเดิลเดียวกันมีทั้งแชท iMessage และ SMS บน Mac (เช่น หมายเลขโทรศัพท์ที่ลงทะเบียนกับ iMessage แต่เคยได้รับ fallback แบบฟองสีเขียวด้วย) OpenClaw จะเลือกแชท iMessage และจะไม่ลดระดับเป็น SMS โดยเงียบๆ. หากต้องการบังคับใช้แชท SMS ให้ใช้คำนำหน้าเป้าหมาย `sms:` แบบระบุชัดเจน (เช่น `sms:+15555550123`). แฮนเดิลที่ไม่มีแชท iMessage ตรงกันจะยังส่งผ่านแชทใดก็ตามที่ BlueBubbles รายงาน.

## ความปลอดภัย

- คำขอ Webhook จะได้รับการยืนยันตัวตนโดยเปรียบเทียบพารามิเตอร์คิวรีหรือเฮดเดอร์ `guid`/`password` กับ `channels.bluebubbles.password`.
- เก็บรหัสผ่าน API และปลายทาง Webhook เป็นความลับ (ปฏิบัติกับสิ่งเหล่านี้เหมือนข้อมูลรับรอง).
- ไม่มีการข้ามการยืนยันตัวตน Webhook ของ BlueBubbles สำหรับ localhost. หากคุณพร็อกซีทราฟฟิก Webhook ให้คงรหัสผ่าน BlueBubbles ไว้ในคำขอตลอดเส้นทาง. `gateway.trustedProxies` ไม่ได้แทนที่ `channels.bluebubbles.password` ที่นี่. ดู [ความปลอดภัยของ Gateway](/th/gateway/security#reverse-proxy-configuration).
- เปิดใช้ HTTPS + กฎไฟร์วอลล์บนเซิร์ฟเวอร์ BlueBubbles หากเปิดเผยออกนอก LAN ของคุณ.

## การแก้ไขปัญหา

- หากอีเวนต์การพิมพ์/อ่านหยุดทำงาน ให้ตรวจสอบล็อก Webhook ของ BlueBubbles และยืนยันว่าพาธ Gateway ตรงกับ `channels.bluebubbles.webhookPath`.
- รหัสจับคู่หมดอายุหลังจากหนึ่งชั่วโมง; ใช้ `openclaw pairing list bluebubbles` และ `openclaw pairing approve bluebubbles <code>`.
- รีแอ็กชันต้องใช้ BlueBubbles private API (`POST /api/v1/message/react`); ตรวจสอบให้แน่ใจว่าเวอร์ชันเซิร์ฟเวอร์เปิดเผย API นี้.
- การแก้ไข/ยกเลิกการส่งต้องใช้ macOS 13+ และเวอร์ชันเซิร์ฟเวอร์ BlueBubbles ที่เข้ากันได้. บน macOS 26 (Tahoe) การแก้ไขยังใช้ไม่ได้ในปัจจุบันเนื่องจากการเปลี่ยนแปลง private API.
- การอัปเดตไอคอนกลุ่มอาจไม่เสถียรบน macOS 26 (Tahoe): API อาจคืนค่าสำเร็จแต่ไอคอนใหม่ไม่ซิงค์.
- OpenClaw ซ่อนการดำเนินการที่ทราบว่าใช้งานไม่ได้โดยอัตโนมัติตามเวอร์ชัน macOS ของเซิร์ฟเวอร์ BlueBubbles. หากการแก้ไขยังปรากฏบน macOS 26 (Tahoe) ให้ปิดใช้ด้วยตนเองด้วย `channels.bluebubbles.actions.edit=false`.
- เปิดใช้ `coalesceSameSenderDms` แล้วแต่การส่งแบบแยก (เช่น `Dump` + URL) ยังมาถึงเป็นสองรอบ: ดูเช็กลิสต์ [การแก้ไขปัญหาการรวมการส่งแบบแยก](#split-send-coalescing-troubleshooting) — สาเหตุทั่วไปคือหน้าต่าง debounce แคบเกินไป, อ่าน timestamp ของ session-log ผิดว่าเป็นเวลาที่ Webhook มาถึง, หรือการส่ง reply-quote (ซึ่งใช้ `replyToBody` ไม่ใช่ Webhook ที่สอง).
- สำหรับข้อมูลสถานะ/สุขภาพ: `openclaw status --all` หรือ `openclaw status --deep`.

สำหรับข้อมูลอ้างอิงเวิร์กโฟลว์ช่องทางทั่วไป ดูคู่มือ [Channels](/th/channels) และ [Plugins](/th/tools/plugin).

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชทกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
