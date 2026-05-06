---
read_when:
    - การตั้งค่าช่องทาง BlueBubbles
    - การแก้ไขปัญหาการจับคู่ Webhook
    - การกำหนดค่า iMessage บน macOS
sidebarTitle: BlueBubbles
summary: iMessage ผ่านเซิร์ฟเวอร์ macOS ของ BlueBubbles (การส่ง/รับผ่าน REST, สถานะกำลังพิมพ์, ปฏิกิริยา, การจับคู่, การดำเนินการขั้นสูง).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-06T09:02:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f2308a016826addc1098937d764b753ee08f3e86f39b0657c930a12b486793f
    source_path: channels/bluebubbles.md
    workflow: 16
---

สถานะ: Plugin ที่บันเดิลมาด้วยซึ่งสื่อสารกับเซิร์ฟเวอร์ BlueBubbles บน macOS ผ่าน HTTP **แนะนำสำหรับการผสานรวม iMessage** เนื่องจากมี API ที่สมบูรณ์กว่าและตั้งค่าง่ายกว่าเมื่อเทียบกับช่องทาง imsg แบบเดิม

<Note>
รีลีสปัจจุบันของ OpenClaw บันเดิล BlueBubbles มาด้วย ดังนั้นบิลด์แบบแพ็กเกจปกติจึงไม่จำเป็นต้องมีขั้นตอน `openclaw plugins install` แยกต่างหาก
</Note>

## ภาพรวม

- ทำงานบน macOS ผ่านแอปช่วยเหลือ BlueBubbles ([bluebubbles.app](https://bluebubbles.app))
- แนะนำ/ผ่านการทดสอบแล้ว: macOS Sequoia (15) macOS Tahoe (26) ใช้งานได้ แต่การแก้ไขยังเสียอยู่บน Tahoe และการอัปเดตไอคอนกลุ่มอาจรายงานว่าสำเร็จแต่ไม่ซิงก์
- OpenClaw สื่อสารกับมันผ่าน REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`)
- ข้อความขาเข้ามาผ่าน webhooks; การตอบกลับขาออก ตัวบ่งชี้การพิมพ์ ใบตอบรับการอ่าน และ tapbacks เป็น REST calls
- ไฟล์แนบและสติกเกอร์จะถูกนำเข้าเป็นสื่อขาเข้า (และแสดงให้ agent เมื่อทำได้)
- การตอบกลับ Auto-TTS ที่สังเคราะห์เสียง MP3 หรือ CAF จะถูกส่งเป็นบับเบิลข้อความเสียง iMessage แทนไฟล์แนบธรรมดา
- การจับคู่/allowlist ทำงานแบบเดียวกับช่องทางอื่น (`/channels/pairing` เป็นต้น) ด้วย `channels.bluebubbles.allowFrom` + รหัสการจับคู่
- ปฏิกิริยาจะแสดงเป็นเหตุการณ์ระบบเช่นเดียวกับ Slack/Telegram เพื่อให้ agent สามารถ "mention" ก่อนตอบกลับได้
- คุณสมบัติขั้นสูง: แก้ไข, ยกเลิกการส่ง, เธรดตอบกลับ, เอฟเฟกต์ข้อความ, การจัดการกลุ่ม

## เริ่มใช้งานอย่างรวดเร็ว

<Steps>
  <Step title="Install BlueBubbles">
    ติดตั้งเซิร์ฟเวอร์ BlueBubbles บน Mac ของคุณ (ทำตามคำแนะนำที่ [bluebubbles.app/install](https://bluebubbles.app/install))
  </Step>
  <Step title="Enable the web API">
    ในการตั้งค่า BlueBubbles ให้เปิดใช้งาน web API และตั้งรหัสผ่าน
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
    ชี้ webhooks ของ BlueBubbles ไปที่ gateway ของคุณ (ตัวอย่าง: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)
  </Step>
  <Step title="Start the gateway">
    เริ่ม gateway; มันจะลงทะเบียนตัวจัดการ webhook และเริ่มการจับคู่
  </Step>
</Steps>

<Warning>
**ความปลอดภัย**

- ตั้งรหัสผ่าน webhook เสมอ
- ต้องมีการตรวจสอบสิทธิ์ webhook เสมอ OpenClaw จะปฏิเสธคำขอ webhook ของ BlueBubbles เว้นแต่ว่าคำขอนั้นมี password/guid ที่ตรงกับ `channels.bluebubbles.password` (เช่น `?password=<password>` หรือ `x-password`) ไม่ว่า topology ของ loopback/proxy จะเป็นอย่างไร
- การตรวจสอบสิทธิ์ด้วยรหัสผ่านจะถูกตรวจสอบก่อนอ่าน/แยกวิเคราะห์เนื้อหา webhook ทั้งหมด

</Warning>

## ทำให้ Messages.app ยังทำงานอยู่ (การตั้งค่า VM / headless)

การตั้งค่า macOS VM / แบบเปิดตลอดเวลาบางอย่างอาจทำให้ Messages.app เข้าสู่สถานะ "idle" (เหตุการณ์ขาเข้าหยุดจนกว่าแอปจะถูกเปิด/นำมาไว้ด้านหน้า) วิธีแก้แบบง่ายคือ **กระตุ้น Messages ทุก 5 นาที** โดยใช้ AppleScript + LaunchAgent

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

    สิ่งนี้จะทำงาน **ทุก 300 วินาที** และ **เมื่อเข้าสู่ระบบ** การทำงานครั้งแรกอาจเรียกพรอมป์ **Automation** ของ macOS (`osascript` → Messages) อนุมัติพรอมป์เหล่านั้นในเซสชันผู้ใช้เดียวกับที่เรียกใช้ LaunchAgent

  </Step>
  <Step title="Load it">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## การเริ่มต้นใช้งาน

BlueBubbles พร้อมใช้งานในการเริ่มต้นใช้งานแบบโต้ตอบ:

```
openclaw onboard
```

วิซาร์ดจะถามข้อมูลต่อไปนี้:

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

คุณยังสามารถเพิ่ม BlueBubbles ผ่าน CLI ได้ด้วย:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## การควบคุมการเข้าถึง (DMs + กลุ่ม)

<Tabs>
  <Tab title="DMs">
    - ค่าเริ่มต้น: `channels.bluebubbles.dmPolicy = "pairing"`
    - ผู้ส่งที่ไม่รู้จักจะได้รับรหัสการจับคู่; ข้อความจะถูกละเว้นจนกว่าจะอนุมัติ (รหัสหมดอายุหลังจาก 1 ชั่วโมง)
    - อนุมัติผ่าน:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - การจับคู่เป็นการแลกเปลี่ยนโทเค็นเริ่มต้น รายละเอียด: [การจับคู่](/th/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`)
    - `channels.bluebubbles.groupAllowFrom` ควบคุมว่าใครสามารถทริกเกอร์ในกลุ่มเมื่อมีการตั้งค่า `allowlist`

  </Tab>
</Tabs>

### การเติมชื่อผู้ติดต่อ (macOS, ไม่บังคับ)

webhook ของกลุ่ม BlueBubbles มักมีเฉพาะที่อยู่ผู้เข้าร่วมแบบดิบ หากคุณต้องการให้บริบท `GroupMembers` แสดงชื่อผู้ติดต่อภายในเครื่องแทน คุณสามารถเลือกเปิดการเติมข้อมูลจาก Contacts ภายในเครื่องบน macOS ได้:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` เปิดใช้งานการค้นหา ค่าเริ่มต้น: `false`
- การค้นหาจะทำงานหลังจากการเข้าถึงกลุ่ม การอนุญาตคำสั่ง และ mention gating อนุญาตให้ข้อความผ่านแล้วเท่านั้น
- เติมข้อมูลเฉพาะผู้เข้าร่วมที่เป็นหมายเลขโทรศัพท์ซึ่งยังไม่มีชื่อเท่านั้น
- หมายเลขโทรศัพท์ดิบจะยังคงเป็นค่าทดแทนเมื่อไม่พบรายการที่ตรงกันภายในเครื่อง

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

BlueBubbles รองรับ mention gating สำหรับแชตกลุ่ม โดยสอดคล้องกับพฤติกรรมของ iMessage/WhatsApp:

- ใช้ `agents.list[].groupChat.mentionPatterns` (หรือ `messages.groupChat.mentionPatterns`) เพื่อตรวจจับ mentions
- เมื่อเปิดใช้งาน `requireMention` สำหรับกลุ่ม agent จะตอบกลับเฉพาะเมื่อถูก mention
- คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตจะข้าม mention gating

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

### Command gating

- คำสั่งควบคุม (เช่น `/config`, `/model`) ต้องมีการอนุญาต
- ใช้ `allowFrom` และ `groupAllowFrom` เพื่อกำหนดการอนุญาตคำสั่ง
- ผู้ส่งที่ได้รับอนุญาตสามารถเรียกใช้คำสั่งควบคุมได้แม้ไม่ได้ mention ในกลุ่ม

### system prompt ต่อกลุ่ม

แต่ละรายการภายใต้ `channels.bluebubbles.groups.*` รับสตริง `systemPrompt` แบบไม่บังคับ ค่านี้จะถูกฉีดเข้าไปใน system prompt ของ agent ในทุก turn ที่จัดการข้อความในกลุ่มนั้น คุณจึงสามารถตั้ง persona หรือกฎพฤติกรรมต่อกลุ่มได้โดยไม่ต้องแก้ไข prompt ของ agent:

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

คีย์จะตรงกับสิ่งที่ BlueBubbles รายงานเป็น `chatGuid` / `chatIdentifier` / `chatId` แบบตัวเลขสำหรับกลุ่ม และรายการ wildcard `"*"` จะให้ค่าเริ่มต้นสำหรับทุกกลุ่มที่ไม่มีการจับคู่แบบ exact (รูปแบบเดียวกับที่ใช้โดย `requireMention` และนโยบายเครื่องมือต่อกลุ่ม) การจับคู่แบบ exact จะมีผลเหนือ wildcard เสมอ DMs จะละเว้นฟิลด์นี้; ใช้การปรับแต่ง prompt ระดับ agent หรือระดับบัญชีแทน

#### ตัวอย่างที่ทำงานจริง: การตอบกลับแบบเธรดและปฏิกิริยา tapback (Private API)

เมื่อเปิดใช้งาน BlueBubbles Private API ข้อความขาเข้าจะมาพร้อม ID ข้อความแบบสั้น (เช่น `[[reply_to:5]]`) และ agent สามารถเรียก `action=reply` เพื่อเข้าร่วมเธรดกับข้อความที่ระบุ หรือ `action=react` เพื่อใส่ tapback ได้ `systemPrompt` ต่อกลุ่มเป็นวิธีที่เชื่อถือได้เพื่อให้ agent เลือกเครื่องมือที่ถูกต้อง:

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

ทั้งปฏิกิริยา tapback และการตอบกลับแบบเธรดต้องใช้ BlueBubbles Private API; ดู [การดำเนินการขั้นสูง](#advanced-actions) และ [ID ข้อความ](#message-ids-short-vs-full) สำหรับกลไกพื้นฐาน

## การผูกการสนทนา ACP

แชต BlueBubbles สามารถแปลงเป็น workspace ของ ACP ที่คงทนได้โดยไม่ต้องเปลี่ยน transport layer

โฟลว์ผู้ปฏิบัติงานแบบรวดเร็ว:

- เรียกใช้ `/acp spawn codex --bind here` ภายใน DM หรือแชตกลุ่มที่อนุญาต
- ข้อความในอนาคตในบทสนทนา BlueBubbles เดียวกันนั้นจะถูกส่งต่อไปยังเซสชัน ACP ที่สร้างขึ้น
- `/new` และ `/reset` รีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมในตำแหน่งเดิม
- `/acp close` ปิดเซสชัน ACP และลบการผูก

ยังรองรับการผูกแบบถาวรที่กำหนดค่าไว้ผ่านรายการ `bindings[]` ระดับบนสุด โดยมี `type: "acp"` และ `match.channel: "bluebubbles"`

`match.peer.id` สามารถใช้รูปแบบเป้าหมาย BlueBubbles ที่รองรับได้ทุกรูปแบบ:

- handle ของ DM ที่ normalize แล้ว เช่น `+15555550123` หรือ `user@example.com`
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

ดู [ACP Agents](/th/tools/acp-agents) สำหรับพฤติกรรมการผูก ACP ที่ใช้ร่วมกัน

## การพิมพ์ + ใบตอบรับการอ่าน

- **ตัวบ่งชี้การพิมพ์**: ส่งโดยอัตโนมัติก่อนและระหว่างการสร้างคำตอบ
- **ใบตอบรับการอ่าน**: ควบคุมโดย `channels.bluebubbles.sendReadReceipts` (ค่าเริ่มต้น: `true`)
- **ตัวบ่งชี้การพิมพ์**: OpenClaw ส่งเหตุการณ์เริ่มพิมพ์; BlueBubbles จะล้างสถานะการพิมพ์โดยอัตโนมัติเมื่อส่งหรือหมดเวลา (การหยุดด้วยตนเองผ่าน DELETE ไม่น่าเชื่อถือ)

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
  <Accordion title="การดำเนินการที่พร้อมใช้งาน">
    - **react**: เพิ่ม/ลบรีแอ็กชัน tapback (`messageId`, `emoji`, `remove`) ชุด tapback ดั้งเดิมของ iMessage คือ `love`, `like`, `dislike`, `laugh`, `emphasize` และ `question` เมื่อเอเจนต์เลือกอีโมจินอกชุดนั้น (เช่น `👀`) เครื่องมือรีแอ็กชันจะถอยกลับไปใช้ `love` เพื่อให้ tapback ยังแสดงผลได้แทนที่จะทำให้คำขอทั้งหมดล้มเหลว รีแอ็กชัน ack ที่กำหนดค่าไว้ยังคงตรวจสอบอย่างเข้มงวดและเกิดข้อผิดพลาดเมื่อพบค่าที่ไม่รู้จัก
    - **edit**: แก้ไขข้อความที่ส่งแล้ว (`messageId`, `text`)
    - **unsend**: ยกเลิกการส่งข้อความ (`messageId`)
    - **reply**: ตอบกลับข้อความเฉพาะ (`messageId`, `text`, `to`)
    - **sendWithEffect**: ส่งพร้อมเอฟเฟกต์ iMessage (`text`, `to`, `effectId`)
    - **renameGroup**: เปลี่ยนชื่อแชตกลุ่ม (`chatGuid`, `displayName`)
    - **setGroupIcon**: ตั้งค่าไอคอน/รูปภาพของแชตกลุ่ม (`chatGuid`, `media`) - ทำงานไม่เสถียรบน macOS 26 Tahoe (API อาจส่งคืนว่าสำเร็จแต่ไอคอนไม่ซิงค์)
    - **addParticipant**: เพิ่มคนเข้ากลุ่ม (`chatGuid`, `address`)
    - **removeParticipant**: ลบคนออกจากกลุ่ม (`chatGuid`, `address`)
    - **leaveGroup**: ออกจากแชตกลุ่ม (`chatGuid`)
    - **upload-file**: ส่งสื่อ/ไฟล์ (`to`, `buffer`, `filename`, `asVoice`)
      - วอยซ์เมโม: ตั้งค่า `asVoice: true` กับเสียง **MP3** หรือ **CAF** เพื่อส่งเป็นข้อความเสียง iMessage BlueBubbles จะแปลง MP3 → CAF เมื่อส่งวอยซ์เมโม
    - นามแฝงเดิม: `sendAttachment` ยังใช้งานได้ แต่ `upload-file` คือชื่อการดำเนินการหลัก

  </Accordion>
</AccordionGroup>

### ID ข้อความ (แบบสั้นเทียบกับแบบเต็ม)

OpenClaw อาจแสดง ID ข้อความแบบ_สั้น_ (เช่น `1`, `2`) เพื่อลดจำนวนโทเค็น

- `MessageSid` / `ReplyToId` สามารถเป็น ID แบบสั้นได้
- `MessageSidFull` / `ReplyToIdFull` มี ID เต็มของผู้ให้บริการ
- ID แบบสั้นอยู่ในหน่วยความจำ และอาจหมดอายุเมื่อรีสตาร์ตหรือเมื่อแคชถูกขับออก
- การดำเนินการยอมรับ `messageId` แบบสั้นหรือแบบเต็ม แต่ ID แบบสั้นจะเกิดข้อผิดพลาดหากไม่มีให้ใช้งานแล้ว

ใช้ ID เต็มสำหรับระบบอัตโนมัติและการจัดเก็บที่ต้องคงทน:

- เทมเพลต: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- บริบท: `MessageSidFull` / `ReplyToIdFull` ในเพย์โหลดขาเข้า

ดู [การกำหนดค่า](/th/gateway/configuration) สำหรับตัวแปรเทมเพลต

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## การรวม DM ที่ถูกแยกส่ง (คำสั่ง + URL ในการเขียนข้อความครั้งเดียว)

เมื่อผู้ใช้พิมพ์คำสั่งและ URL พร้อมกันใน iMessage - เช่น `Dump https://example.com/article` - Apple จะแยกการส่งเป็น **การส่ง Webhook สองครั้งแยกกัน**:

1. ข้อความตัวอักษร (`"Dump"`)
2. บอลลูนตัวอย่าง URL (`"https://..."`) พร้อมรูปภาพตัวอย่าง OG เป็นไฟล์แนบ

Webhook ทั้งสองจะมาถึง OpenClaw ห่างกันประมาณ 0.8-2.0 วินาทีในชุดติดตั้งส่วนใหญ่ หากไม่มีการรวม เอเจนต์จะได้รับคำสั่งเพียงอย่างเดียวในเทิร์นที่ 1 ตอบกลับ (มักเป็น "ส่ง URL มาให้ฉัน") และจะเห็น URL เฉพาะในเทิร์นที่ 2 ซึ่งถึงตอนนั้นบริบทของคำสั่งก็หายไปแล้ว

`channels.bluebubbles.coalesceSameSenderDms` เลือกให้ DM รวม Webhook ต่อเนื่องจากผู้ส่งเดียวกันเป็นเทิร์นเอเจนต์เดียว แชตกลุ่มยังคงใช้คีย์ต่อข้อความเพื่อรักษาโครงสร้างเทิร์นของผู้ใช้หลายคนไว้

<Tabs>
  <Tab title="ควรเปิดใช้เมื่อใด">
    เปิดใช้เมื่อ:

    - คุณจัดส่ง Skills ที่คาดหวัง `command + payload` ในข้อความเดียว (dump, paste, save, queue ฯลฯ)
    - ผู้ใช้ของคุณวาง URL, รูปภาพ หรือเนื้อหายาวร่วมกับคำสั่ง
    - คุณยอมรับความหน่วงของเทิร์น DM ที่เพิ่มขึ้นได้ (ดูด้านล่าง)

    ปล่อยให้ปิดใช้เมื่อ:

    - คุณต้องการความหน่วงของคำสั่งต่ำสุดสำหรับตัวกระตุ้น DM แบบคำเดียว
    - โฟลว์ทั้งหมดของคุณเป็นคำสั่งแบบครั้งเดียวจบโดยไม่มีเพย์โหลดตามมา

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

    เมื่อเปิดแฟล็กและไม่มี `messages.inbound.byChannel.bluebubbles` ที่ระบุชัดเจน หน้าต่าง debounce จะขยายเป็น **2500 ms** (ค่าเริ่มต้นสำหรับแบบไม่รวมคือ 500 ms) หน้าต่างที่กว้างขึ้นจำเป็น เพราะจังหวะการแยกส่งของ Apple ที่ 0.8-2.0 วินาทีไม่พอดีกับค่าเริ่มต้นที่แคบกว่า

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
    - **ความหน่วงที่เพิ่มขึ้นสำหรับคำสั่งควบคุมใน DM** เมื่อเปิดแฟล็ก ข้อความคำสั่งควบคุมใน DM (เช่น `Dump`, `Save` ฯลฯ) ตอนนี้จะรอได้สูงสุดเท่าหน้าต่าง debounce ก่อนส่งต่อ เผื่อว่าจะมี Webhook เพย์โหลดตามมา คำสั่งในแชตกลุ่มยังคงส่งต่อทันที
    - **เอาต์พุตที่รวมแล้วมีขอบเขตจำกัด** - ข้อความที่รวมกันจำกัดที่ 4000 อักขระพร้อมเครื่องหมาย `…[truncated]` ที่ชัดเจน; ไฟล์แนบจำกัดที่ 20; รายการแหล่งที่มาจำกัดที่ 10 (เก็บรายการแรกและล่าสุดไว้เมื่่อเกินนั้น) `messageId` ของทุกแหล่งที่มายังคงไปถึงการขจัดรายการซ้ำขาเข้า เพื่อให้การเล่นซ้ำเหตุการณ์แต่ละรายการในภายหลังโดย MessagePoller ถูกจดจำว่าเป็นรายการซ้ำ
    - **เลือกเปิดใช้เป็นรายช่องทาง** ช่องทางอื่น (Telegram, WhatsApp, Slack, …) ไม่ได้รับผลกระทบ

  </Tab>
</Tabs>

### สถานการณ์และสิ่งที่เอเจนต์เห็น

| ผู้ใช้เขียน                                                        | Apple ส่งมอบ              | ปิดแฟล็ก (ค่าเริ่มต้น)                  | เปิดแฟล็ก + หน้าต่าง 2500 ms                                           |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (ส่งครั้งเดียว)                         | 2 Webhook ห่างกัน ~1 วินาที | สองเทิร์นของเอเจนต์: "Dump" อย่างเดียว แล้วตามด้วย URL | หนึ่งเทิร์น: ข้อความรวม `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (ไฟล์แนบ + ข้อความ)                | 2 Webhook                 | สองเทิร์น                               | หนึ่งเทิร์น: ข้อความ + รูปภาพ                                          |
| `/status` (คำสั่งเดี่ยว)                                           | 1 Webhook                 | ส่งต่อทันที                             | **รอได้สูงสุดเท่าหน้าต่าง แล้วจึงส่งต่อ**                              |
| วาง URL เพียงอย่างเดียว                                           | 1 Webhook                 | ส่งต่อทันที                             | ส่งต่อทันที (มีเพียงหนึ่งรายการในบักเก็ต)                              |
| ข้อความ + URL ที่ตั้งใจส่งเป็นสองข้อความแยกกัน ห่างกันหลายนาที    | 2 Webhook นอกหน้าต่าง     | สองเทิร์น                               | สองเทิร์น (หน้าต่างหมดอายุระหว่างสองข้อความ)                          |
| ส่ง DM สั้น ๆ อย่างรวดเร็วจำนวนมาก (>10 รายการในหน้าต่าง)        | N Webhook                 | N เทิร์น                                | หนึ่งเทิร์น เอาต์พุตมีขอบเขตจำกัด (รายการแรก + ล่าสุด ใช้ขีดจำกัดข้อความ/ไฟล์แนบ) |

### การแก้ปัญหาการรวมการแยกส่ง

หากเปิดแฟล็กแล้วแต่การแยกส่งยังมาถึงเป็นสองเทิร์น ให้ตรวจสอบแต่ละชั้น:

<AccordionGroup>
  <Accordion title="โหลดการกำหนดค่าจริงแล้ว">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    จากนั้น `openclaw gateway restart` - แฟล็กจะถูกอ่านเมื่อสร้าง debouncer-registry

  </Accordion>
  <Accordion title="หน้าต่าง debounce กว้างพอสำหรับชุดติดตั้งของคุณ">
    ดูบันทึกเซิร์ฟเวอร์ BlueBubbles ใต้ `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    วัดช่องว่างระหว่างการส่งต่อข้อความแบบ `"Dump"` กับการส่งต่อ `"https://..."; Attachments:` ที่ตามมา เพิ่ม `messages.inbound.byChannel.bluebubbles` ให้ครอบคลุมช่องว่างนั้นอย่างสบาย

  </Accordion>
  <Accordion title="ไทม์สแตมป์ JSONL ของเซสชัน ≠ การมาถึงของ Webhook">
    ไทม์สแตมป์เหตุการณ์เซสชัน (`~/.openclaw/agents/<id>/sessions/*.jsonl`) สะท้อนเวลาที่ Gateway ส่งข้อความให้เอเจนต์ **ไม่ใช่** เวลาที่ Webhook มาถึง ข้อความที่สองที่ถูกเข้าคิวและติดแท็ก `[Queued messages while agent was busy]` หมายความว่าเทิร์นแรกยังทำงานอยู่เมื่อ Webhook ที่สองมาถึง - บักเก็ตการรวมได้ flush ไปแล้ว ปรับหน้าต่างโดยอ้างอิงบันทึกเซิร์ฟเวอร์ BB ไม่ใช่บันทึกเซสชัน
  </Accordion>
  <Accordion title="แรงกดดันหน่วยความจำทำให้การส่งคำตอบช้าลง">
    บนเครื่องขนาดเล็กกว่า (8 GB) เทิร์นของเอเจนต์อาจใช้เวลานานพอที่บักเก็ตการรวมจะ flush ก่อนที่การตอบกลับจะเสร็จ และ URL จะตกไปเป็นเทิร์นที่สองที่เข้าคิว ตรวจสอบ `memory_pressure` และ `ps -o rss -p $(pgrep openclaw-gateway)`; หาก Gateway ใช้ RSS เกิน ~500 MB และคอมเพรสเซอร์ทำงานอยู่ ให้ปิดกระบวนการหนักอื่น ๆ หรือย้ายไปโฮสต์ที่ใหญ่กว่า
  </Accordion>
  <Accordion title="การส่งแบบอ้างอิงตอบกลับเป็นเส้นทางอื่น">
    หากผู้ใช้แตะ `Dump` เป็น **การตอบกลับ** ไปยังบอลลูน URL ที่มีอยู่ (iMessage แสดงป้าย "1 Reply" บนบอลลูน Dump) URL จะอยู่ใน `replyToBody` ไม่ใช่ใน Webhook ที่สอง การรวมไม่เกี่ยวข้อง - นั่นเป็นเรื่องของ skill/prompt ไม่ใช่เรื่องของ debouncer
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

- ไฟล์แนบขาเข้าจะถูกดาวน์โหลดและเก็บไว้ในแคชสื่อ
- ขีดจำกัดสื่อผ่าน `channels.bluebubbles.mediaMaxMb` สำหรับสื่อขาเข้าและขาออก (ค่าเริ่มต้น: 8 MB)
- ข้อความขาออกถูกแบ่งเป็นชิ้นตาม `channels.bluebubbles.textChunkLimit` (ค่าเริ่มต้น: 4000 อักขระ)

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
    - `channels.bluebubbles.allowFrom`: รายการอนุญาต DM (แฮนเดิล, อีเมล, หมายเลข E.164, `chat_id:*`, `chat_guid:*`)
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`)
    - `channels.bluebubbles.groupAllowFrom`: รายการอนุญาตผู้ส่งกลุ่ม
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: บน macOS เลือกเพิ่มข้อมูลผู้เข้าร่วมกลุ่มที่ไม่มีชื่อจาก Contacts ในเครื่องหลังผ่านการคัดกรอง ค่าเริ่มต้น: `false`
    - `channels.bluebubbles.groups`: การกำหนดค่าต่อกลุ่ม (`requireMention` ฯลฯ)

  </Accordion>
  <Accordion title="การส่งมอบและการแบ่งชิ้น">
    - `channels.bluebubbles.sendReadReceipts`: ส่งใบตอบรับการอ่าน (ค่าเริ่มต้น: `true`)
    - `channels.bluebubbles.blockStreaming`: เปิดใช้การสตรีมแบบบล็อก (ค่าเริ่มต้น: `false`; จำเป็นสำหรับการตอบกลับแบบสตรีม)
    - `channels.bluebubbles.textChunkLimit`: ขนาดชิ้นข้อความขาออกเป็นจำนวนอักขระ (ค่าเริ่มต้น: 4000)
    - `channels.bluebubbles.sendTimeoutMs`: เวลาหมดเวลาต่อคำขอเป็นมิลลิวินาทีสำหรับการส่งข้อความขาออกผ่าน `/api/v1/message/text` (ค่าเริ่มต้น: 30000) เพิ่มค่านี้ในชุดติดตั้ง macOS 26 ที่การส่ง iMessage ผ่าน Private API อาจค้างนานกว่า 60 วินาทีภายในเฟรมเวิร์ก iMessage เช่น `45000` หรือ `60000` ขณะนี้โพรบ การค้นหาแชต รีแอ็กชัน การแก้ไข และการตรวจสุขภาพยังคงใช้ค่าเริ่มต้นที่สั้นกว่า 10 วินาทีอยู่ และมีแผนจะขยายการครอบคลุมไปยังรีแอ็กชันและการแก้ไขในงานต่อเนื่อง การแทนที่รายบัญชี: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`
    - `channels.bluebubbles.chunkMode`: `length` (ค่าเริ่มต้น) จะแบ่งเฉพาะเมื่อเกิน `textChunkLimit`; `newline` จะแบ่งที่บรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว

  </Accordion>
  <Accordion title="สื่อและประวัติ">
    - `channels.bluebubbles.mediaMaxMb`: เพดานสื่อขาเข้า/ขาออกเป็น MB (ค่าเริ่มต้น: 8)
    - `channels.bluebubbles.mediaLocalRoots`: รายการอนุญาตแบบชัดเจนของไดเรกทอรีภายในเครื่องแบบสัมบูรณ์ที่อนุญาตสำหรับเส้นทางสื่อภายในเครื่องขาออก การส่งผ่านเส้นทางภายในเครื่องจะถูกปฏิเสธเป็นค่าเริ่มต้น เว้นแต่จะตั้งค่านี้ไว้ การแทนที่รายบัญชี: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`
    - `channels.bluebubbles.coalesceSameSenderDms`: รวม Webhook DM ต่อเนื่องจากผู้ส่งคนเดียวกันเป็นหนึ่งเทิร์นของเอเจนต์ เพื่อให้การส่งแบบแยกข้อความ+URL ของ Apple มาถึงเป็นข้อความเดียว (ค่าเริ่มต้น: `false`) ดู [การรวม DM ที่ส่งแบบแยก](#coalescing-split-send-dms-command--url-in-one-composition) สำหรับสถานการณ์ การปรับหน้าต่างเวลา และข้อแลกเปลี่ยน เมื่อเปิดใช้โดยไม่มี `messages.inbound.byChannel.bluebubbles` แบบชัดเจน จะขยายหน้าต่าง debounce ขาเข้าเริ่มต้นจาก 500 ms เป็น 2500 ms
    - `channels.bluebubbles.historyLimit`: จำนวนข้อความกลุ่มสูงสุดสำหรับบริบท (0 คือปิดใช้)
    - `channels.bluebubbles.dmHistoryLimit`: ขีดจำกัดประวัติ DM
    - `channels.bluebubbles.replyContextApiFallback`: เมื่อการตอบกลับขาเข้ามาถึงโดยไม่มี `replyToBody`/`replyToSender` และไม่พบในแคชบริบทการตอบกลับในหน่วยความจำ ให้ดึงข้อความต้นฉบับจาก BlueBubbles HTTP API เป็นทางสำรองแบบพยายามอย่างดีที่สุด (ค่าเริ่มต้น: `false`) มีประโยชน์สำหรับการติดตั้งหลายอินสแตนซ์ที่ใช้บัญชี BlueBubbles เดียวกัน หลังจากรีสตาร์ทกระบวนการ หรือหลังจากการขับออกจากแคช TTL/LRU ที่มีอายุยาว การดึงนี้มีการป้องกัน SSRF ด้วยนโยบายเดียวกับคำขอไคลเอนต์ BlueBubbles อื่นทุกคำขอ ไม่โยนข้อผิดพลาด และเติมแคชเพื่อให้การตอบกลับถัดไปเฉลี่ยต้นทุนได้ การแทนที่รายบัญชี: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback` การตั้งค่าระดับช่องทางจะส่งต่อไปยังบัญชีที่ไม่ได้ระบุแฟล็กนี้

  </Accordion>
  <Accordion title="การดำเนินการและบัญชี">
    - `channels.bluebubbles.actions`: เปิด/ปิดการดำเนินการเฉพาะรายการ
    - `channels.bluebubbles.accounts`: การกำหนดค่าหลายบัญชี

  </Accordion>
</AccordionGroup>

ตัวเลือกส่วนกลางที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (หรือ `messages.groupChat.mentionPatterns`)
- `messages.responsePrefix`

## การระบุที่อยู่ / เป้าหมายการส่งมอบ

แนะนำให้ใช้ `chat_guid` เพื่อการกำหนดเส้นทางที่เสถียร:

- `chat_guid:iMessage;-;+15555550123` (แนะนำสำหรับกลุ่ม)
- `chat_id:123`
- `chat_identifier:...`
- แฮนเดิลโดยตรง: `+15555550123`, `user@example.com`
  - หากแฮนเดิลโดยตรงยังไม่มีแชต DM อยู่แล้ว OpenClaw จะสร้างให้ผ่าน `POST /api/v1/chat/new` ซึ่งต้องเปิดใช้ BlueBubbles Private API

### การกำหนดเส้นทาง iMessage เทียบกับ SMS

เมื่อแฮนเดิลเดียวกันมีทั้งแชต iMessage และ SMS บน Mac (เช่น หมายเลขโทรศัพท์ที่ลงทะเบียนกับ iMessage แต่เคยได้รับข้อความสำรองแบบฟองสีเขียวด้วย) OpenClaw จะเลือกใช้แชต iMessage และจะไม่ลดระดับเป็น SMS โดยเงียบ ๆ หากต้องการบังคับใช้แชต SMS ให้ใช้คำนำหน้าเป้าหมาย `sms:` แบบชัดเจน (เช่น `sms:+15555550123`) แฮนเดิลที่ไม่มีแชต iMessage ที่ตรงกันจะยังส่งผ่านแชตใดก็ตามที่ BlueBubbles รายงาน

## ความปลอดภัย

- คำขอ Webhook จะตรวจสอบสิทธิ์โดยเปรียบเทียบพารามิเตอร์หรือเฮดเดอร์ query `guid`/`password` กับ `channels.bluebubbles.password`
- เก็บรหัสผ่าน API และปลายทาง Webhook ไว้เป็นความลับ (ปฏิบัติเหมือนเป็นข้อมูลรับรอง)
- ไม่มีการข้ามการตรวจสอบสิทธิ์ Webhook ของ BlueBubbles สำหรับ localhost หากคุณพร็อกซีทราฟฟิก Webhook ให้คงรหัสผ่าน BlueBubbles ไว้ในคำขอตลอดเส้นทาง `gateway.trustedProxies` ไม่ได้แทนที่ `channels.bluebubbles.password` ที่นี่ ดู [ความปลอดภัยของ Gateway](/th/gateway/security#reverse-proxy-configuration)
- เปิดใช้ HTTPS + กฎไฟร์วอลล์บนเซิร์ฟเวอร์ BlueBubbles หากเปิดเผยออกนอก LAN ของคุณ

## การแก้ไขปัญหา

- หากเหตุการณ์การพิมพ์/การอ่านหยุดทำงาน ให้ตรวจสอบบันทึก Webhook ของ BlueBubbles และยืนยันว่าเส้นทาง Gateway ตรงกับ `channels.bluebubbles.webhookPath`
- โค้ดจับคู่หมดอายุหลังจากหนึ่งชั่วโมง ใช้ `openclaw pairing list bluebubbles` และ `openclaw pairing approve bluebubbles <code>`
- รีแอ็กชันต้องใช้ BlueBubbles private API (`POST /api/v1/message/react`); ตรวจสอบให้แน่ใจว่าเวอร์ชันเซิร์ฟเวอร์เปิดเผย API นี้
- การแก้ไข/ยกเลิกการส่งต้องใช้ macOS 13+ และเวอร์ชันเซิร์ฟเวอร์ BlueBubbles ที่เข้ากันได้ บน macOS 26 (Tahoe) ขณะนี้การแก้ไขใช้งานไม่ได้เนื่องจากการเปลี่ยนแปลง Private API
- การอัปเดตไอคอนกลุ่มอาจไม่เสถียรบน macOS 26 (Tahoe): API อาจส่งคืนว่าสำเร็จ แต่ไอคอนใหม่ไม่ซิงก์
- OpenClaw จะซ่อนการดำเนินการที่ทราบว่าใช้งานไม่ได้โดยอัตโนมัติตามเวอร์ชัน macOS ของเซิร์ฟเวอร์ BlueBubbles หากการแก้ไขยังปรากฏบน macOS 26 (Tahoe) ให้ปิดด้วยตนเองโดยใช้ `channels.bluebubbles.actions.edit=false`
- เปิดใช้ `coalesceSameSenderDms` แล้วแต่การส่งแบบแยก (เช่น `Dump` + URL) ยังมาถึงเป็นสองเทิร์น: ดูเช็กลิสต์ [การแก้ไขปัญหาการรวมการส่งแบบแยก](#split-send-coalescing-troubleshooting) - สาเหตุทั่วไปคือหน้าต่าง debounce แคบเกินไป, อ่านเวลาในบันทึกเซสชันผิดว่าเป็นเวลาที่ Webhook มาถึง, หรือการส่งพร้อมอ้างคำตอบ (ซึ่งใช้ `replyToBody` ไม่ใช่ Webhook ที่สอง)
- สำหรับข้อมูลสถานะ/สุขภาพ: `openclaw status --all` หรือ `openclaw status --deep`

สำหรับอ้างอิงเวิร์กโฟลว์ช่องทางทั่วไป ดู [ช่องทาง](/th/channels) และคู่มือ [Plugin](/th/tools/plugin)

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวมช่องทาง](/th/channels) - ช่องทางที่รองรับทั้งหมด
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การจับคู่](/th/channels/pairing) - การตรวจสอบสิทธิ์ DM และโฟลว์การจับคู่
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
