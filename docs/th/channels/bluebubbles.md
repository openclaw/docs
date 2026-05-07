---
read_when:
    - การตั้งค่าช่องทาง BlueBubbles
    - การแก้ไขปัญหาการจับคู่ Webhook
    - การกำหนดค่า iMessage บน macOS
sidebarTitle: BlueBubbles
summary: การรองรับ iMessage แบบเดิมผ่านเซิร์ฟเวอร์ macOS ของ BlueBubbles (การส่ง/รับผ่าน REST, การแสดงสถานะกำลังพิมพ์, รีแอ็กชัน, การจับคู่, การดำเนินการขั้นสูง).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-07T01:50:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: e32b35242c7e751b49dcd8d839bc291c80cb4d88c0b4ce6f65635b7ef2ed97c3
    source_path: channels/bluebubbles.md
    workflow: 16
---

สถานะ: Plugin แบบเดิมที่บันเดิลมาด้วย ซึ่งสื่อสารกับเซิร์ฟเวอร์ BlueBubbles บน macOS ผ่าน HTTP การตั้งค่า BlueBubbles ที่มีอยู่ยังคงใช้งานได้ต่อไป แต่การปรับใช้ OpenClaw iMessage ใหม่ควรเลือกใช้ Plugin [iMessage](/th/channels/imessage) แบบเนทีฟเมื่อข้อกำหนดของมันเหมาะกับโฮสต์ของคุณ

<Warning>
BlueBubbles เลิกแนะนำสำหรับการตั้งค่า OpenClaw ใหม่แล้ว

ระบบนิเวศ BlueBubbles ต้นน้ำยังคงมีการพัฒนาอยู่ แต่ OpenClaw พึ่งพา API ของเซิร์ฟเวอร์ BlueBubbles บน macOS ณ วันที่ 6 พฤษภาคม 2026 สาขาพัฒนาของ [`bluebubbles-server`](https://github.com/BlueBubblesApp/bluebubbles-server) อย่างเป็นทางการเปลี่ยนแปลงล่าสุดเมื่อ [22 มกราคม 2026](https://github.com/BlueBubblesApp/bluebubbles-server/commit/88a4921bbd5a8111f1e9582b83715cf877171037) และรุ่นเซิร์ฟเวอร์ล่าสุด ([`v1.9.9`](https://github.com/BlueBubblesApp/bluebubbles-server/releases/tag/v1.9.9)) เผยแพร่เมื่อ 16 พฤษภาคม 2025 แอปไคลเอนต์และรีโพซิทอรีตัวช่วยมีกิจกรรมใหม่กว่า ดังนั้นนี่ไม่ใช่การอ้างว่าโปรเจ็กต์ถูกละทิ้ง การเลิกแนะนำนี้เกี่ยวกับการลดการพึ่งพาของ OpenClaw ต่อเซิร์ฟเวอร์ HTTP ภายนอก, webhooks และพื้นผิวความเข้ากันได้กับ private API เมื่อเส้นทาง `imsg` แบบเนทีฟทำให้การผสานรวมอยู่บนสัญญา stdio ภายในเครื่อง
</Warning>

<Note>
รุ่น OpenClaw ปัจจุบันบันเดิล BlueBubbles มาให้ ดังนั้นบิลด์แบบแพ็กเกจปกติไม่ต้องมีขั้นตอน `openclaw plugins install` แยกต่างหาก
</Note>

## ภาพรวม

- ทำงานบน macOS ผ่านแอปตัวช่วย BlueBubbles ([bluebubbles.app](https://bluebubbles.app))
- ทางเลือกสำรองแบบเดิมสำหรับการติดตั้งที่พึ่งพา ID ช่องทาง BlueBubbles, สถานะ webhook, เป้าหมายกลุ่ม, การส่ง Cron หรือการกำหนดเส้นทางเวิร์กสเปซอยู่แล้ว
- แนะนำ/ทดสอบแล้ว: macOS Sequoia (15) macOS Tahoe (26) ใช้งานได้ แต่ปัจจุบันการแก้ไขยังเสียบน Tahoe และการอัปเดตไอคอนกลุ่มอาจรายงานว่าสำเร็จแต่ไม่ซิงก์
- OpenClaw สื่อสารกับมันผ่าน REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`)
- ข้อความขาเข้ามาถึงผ่าน webhooks; การตอบกลับขาออก, ตัวบ่งชี้การพิมพ์, ใบตอบรับการอ่าน และ tapbacks เป็นการเรียก REST
- ไฟล์แนบและสติกเกอร์จะถูกนำเข้าเป็นสื่อขาเข้า (และแสดงให้ agent เห็นเมื่อเป็นไปได้)
- การตอบกลับ Auto-TTS ที่สังเคราะห์เสียง MP3 หรือ CAF จะถูกส่งเป็นบับเบิลบันทึกเสียงของ iMessage แทนไฟล์แนบธรรมดา
- การจับคู่/allowlist ทำงานแบบเดียวกับช่องทางอื่น (`/channels/pairing` เป็นต้น) ด้วย `channels.bluebubbles.allowFrom` + โค้ดจับคู่
- ปฏิกิริยาจะถูกแสดงเป็นเหตุการณ์ระบบเหมือน Slack/Telegram เพื่อให้ agents สามารถ "กล่าวถึง" ก่อนตอบกลับได้
- ฟีเจอร์ขั้นสูง: แก้ไข, ยกเลิกการส่ง, เธรดการตอบกลับ, เอฟเฟกต์ข้อความ, การจัดการกลุ่ม

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง BlueBubbles">
    ติดตั้งเซิร์ฟเวอร์ BlueBubbles บน Mac ของคุณ (ทำตามคำแนะนำที่ [bluebubbles.app/install](https://bluebubbles.app/install))
  </Step>
  <Step title="เปิดใช้งาน web API">
    ในการตั้งค่า BlueBubbles ให้เปิดใช้งาน web API และตั้งรหัสผ่าน
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
  <Step title="ชี้ webhooks ไปที่ gateway">
    ชี้ webhooks ของ BlueBubbles ไปที่ gateway ของคุณ (ตัวอย่าง: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)
  </Step>
  <Step title="เริ่ม gateway">
    เริ่ม gateway; มันจะลงทะเบียนตัวจัดการ webhook และเริ่มการจับคู่
  </Step>
</Steps>

<Warning>
**ความปลอดภัย**

- ตั้งรหัสผ่าน webhook เสมอ
- ต้องมีการยืนยันตัวตนของ Webhook เสมอ OpenClaw จะปฏิเสธคำขอ webhook ของ BlueBubbles เว้นแต่คำขอนั้นมี password/guid ที่ตรงกับ `channels.bluebubbles.password` (เช่น `?password=<password>` หรือ `x-password`) ไม่ว่าโทโพโลยี loopback/proxy จะเป็นแบบใด
- การยืนยันตัวตนด้วยรหัสผ่านจะถูกตรวจสอบก่อนอ่าน/แยกวิเคราะห์เนื้อหา webhook แบบเต็ม

</Warning>

## ทำให้ Messages.app ยังทำงานอยู่ (การตั้งค่า VM / แบบไม่มีหน้าจอ)

การตั้งค่า macOS VM / เปิดตลอดบางแบบอาจทำให้ Messages.app เข้าสถานะ "idle" (เหตุการณ์ขาเข้าหยุดจนกว่าแอปจะถูกเปิด/นำมาอยู่เบื้องหน้า) วิธีเลี่ยงแบบง่ายคือ **กระตุ้น Messages ทุก 5 นาที** ด้วย AppleScript + LaunchAgent

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

    สิ่งนี้จะทำงาน **ทุก 300 วินาที** และ **เมื่อเข้าสู่ระบบ** การเรียกใช้ครั้งแรกอาจเรียกพรอมป์ **Automation** ของ macOS (`osascript` → Messages) อนุมัติพรอมป์เหล่านั้นในเซสชันผู้ใช้เดียวกับที่เรียกใช้ LaunchAgent

  </Step>
  <Step title="โหลด">
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

วิซาร์ดจะขอข้อมูล:

<ParamField path="URL เซิร์ฟเวอร์" type="string" required>
  ที่อยู่เซิร์ฟเวอร์ BlueBubbles (เช่น `http://192.168.1.100:1234`)
</ParamField>
<ParamField path="รหัสผ่าน" type="string" required>
  รหัสผ่าน API จากการตั้งค่า BlueBubbles Server
</ParamField>
<ParamField path="พาธ Webhook" type="string" default="/bluebubbles-webhook">
  พาธเอนด์พอยต์ Webhook
</ParamField>
<ParamField path="นโยบาย DM" type="string">
  `pairing`, `allowlist`, `open` หรือ `disabled`
</ParamField>
<ParamField path="รายการอนุญาต" type="string[]">
  หมายเลขโทรศัพท์, อีเมล หรือเป้าหมายแชต
</ParamField>

คุณยังสามารถเพิ่ม BlueBubbles ผ่าน CLI ได้:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## การควบคุมการเข้าถึง (DMs + กลุ่ม)

<Tabs>
  <Tab title="DMs">
    - ค่าเริ่มต้น: `channels.bluebubbles.dmPolicy = "pairing"`
    - ผู้ส่งที่ไม่รู้จักจะได้รับโค้ดจับคู่; ข้อความจะถูกละเว้นจนกว่าจะอนุมัติ (โค้ดหมดอายุหลัง 1 ชั่วโมง)
    - อนุมัติผ่าน:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - การจับคู่คือการแลกเปลี่ยนโทเคนเริ่มต้น รายละเอียด: [การจับคู่](/th/channels/pairing)

  </Tab>
  <Tab title="กลุ่ม">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`)
    - `channels.bluebubbles.groupAllowFrom` ควบคุมว่าใครสามารถทริกเกอร์ในกลุ่มเมื่อกำหนด `allowlist`

  </Tab>
</Tabs>

### การเติมเต็มชื่อผู้ติดต่อ (macOS, ไม่บังคับ)

webhooks กลุ่มของ BlueBubbles มักมีเพียงที่อยู่ผู้เข้าร่วมแบบดิบ หากคุณต้องการให้บริบท `GroupMembers` แสดงชื่อผู้ติดต่อภายในเครื่องแทน คุณสามารถเลือกใช้การเติมเต็มจาก Contacts ภายในเครื่องบน macOS ได้:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` เปิดใช้งานการค้นหา ค่าเริ่มต้น: `false`
- การค้นหาจะทำงานหลังจากการเข้าถึงกลุ่ม, การอนุญาตคำสั่ง และการกั้นการกล่าวถึงอนุญาตให้ข้อความผ่านแล้วเท่านั้น
- เฉพาะผู้เข้าร่วมที่เป็นหมายเลขโทรศัพท์และยังไม่มีชื่อเท่านั้นที่จะถูกเติมเต็ม
- หมายเลขโทรศัพท์ดิบยังคงเป็นทางเลือกสำรองเมื่อไม่พบรายการที่ตรงกันภายในเครื่อง

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### การกั้นการกล่าวถึง (กลุ่ม)

BlueBubbles รองรับการกั้นการกล่าวถึงสำหรับแชตกลุ่ม โดยสอดคล้องกับพฤติกรรมของ iMessage/WhatsApp:

- ใช้ `agents.list[].groupChat.mentionPatterns` (หรือ `messages.groupChat.mentionPatterns`) เพื่อตรวจจับการกล่าวถึง
- เมื่อเปิดใช้งาน `requireMention` สำหรับกลุ่ม agent จะตอบกลับเฉพาะเมื่อถูกกล่าวถึงเท่านั้น
- คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตจะข้ามการกั้นการกล่าวถึง

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

- คำสั่งควบคุม (เช่น `/config`, `/model`) ต้องได้รับอนุญาต
- ใช้ `allowFrom` และ `groupAllowFrom` เพื่อกำหนดการอนุญาตคำสั่ง
- ผู้ส่งที่ได้รับอนุญาตสามารถเรียกใช้คำสั่งควบคุมได้แม้ไม่ได้กล่าวถึงในกลุ่ม

### system prompt ต่อกลุ่ม

แต่ละรายการภายใต้ `channels.bluebubbles.groups.*` รับสตริง `systemPrompt` แบบไม่บังคับ ค่านี้จะถูกฉีดเข้าไปใน system prompt ของ agent ในทุกเทิร์นที่จัดการข้อความในกลุ่มนั้น เพื่อให้คุณตั้งบุคลิกหรือกฎพฤติกรรมต่อกลุ่มได้โดยไม่ต้องแก้ไขพรอมป์ของ agent:

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

คีย์ตรงกับสิ่งที่ BlueBubbles รายงานเป็น `chatGuid` / `chatIdentifier` / `chatId` แบบตัวเลขสำหรับกลุ่ม และรายการ wildcard `"*"` ให้ค่าเริ่มต้นสำหรับทุกกลุ่มที่ไม่มีรายการตรงแบบเป๊ะ (รูปแบบเดียวกับที่ใช้โดย `requireMention` และนโยบายเครื่องมือต่อกลุ่ม) รายการที่ตรงแบบเป๊ะชนะ wildcard เสมอ DMs จะละเว้นฟิลด์นี้; ให้ใช้การปรับแต่งพรอมป์ระดับ agent หรือระดับบัญชีแทน

#### ตัวอย่างที่ใช้งานจริง: การตอบกลับแบบเธรดและปฏิกิริยา tapback (Private API)

เมื่อเปิดใช้งาน BlueBubbles Private API ข้อความขาเข้าจะมาพร้อม ID ข้อความแบบสั้น (เช่น `[[reply_to:5]]`) และ agent สามารถเรียก `action=reply` เพื่อเธรดเข้าไปยังข้อความเฉพาะ หรือ `action=react` เพื่อวาง tapback ได้ `systemPrompt` ต่อกลุ่มเป็นวิธีที่เชื่อถือได้ในการทำให้ agent เลือกเครื่องมือที่ถูกต้อง:

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

แชต BlueBubbles สามารถเปลี่ยนเป็นเวิร์กสเปซ ACP ที่คงทนได้โดยไม่ต้องเปลี่ยนเลเยอร์การขนส่ง

ขั้นตอนเร็วสำหรับผู้ปฏิบัติงาน:

- เรียกใช้ `/acp spawn codex --bind here` ภายใน DM หรือแชตกลุ่มที่ได้รับอนุญาต
- ข้อความในอนาคตในบทสนทนา BlueBubbles เดียวกันนั้นจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่สร้างขึ้น
- `/new` และ `/reset` รีเซ็ตเซสชัน ACP ที่ผูกไว้เดิม ณ จุดเดิม
- `/acp close` ปิดเซสชัน ACP และลบการผูก

ยังรองรับการผูกถาวรที่กำหนดค่าไว้ผ่านรายการ `bindings[]` ระดับบนสุดด้วย `type: "acp"` และ `match.channel: "bluebubbles"`

`match.peer.id` สามารถใช้รูปแบบเป้าหมาย BlueBubbles ที่รองรับใดก็ได้:

- แฮนด์เดิล DM ที่ปรับให้เป็นมาตรฐานแล้ว เช่น `+15555550123` หรือ `user@example.com`
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

## การกำลังพิมพ์ + ใบตอบรับการอ่าน

- **ตัวบ่งชี้การกำลังพิมพ์**: ส่งโดยอัตโนมัติก่อนและระหว่างการสร้างคำตอบ
- **ใบตอบรับการอ่าน**: ควบคุมโดย `channels.bluebubbles.sendReadReceipts` (ค่าเริ่มต้น: `true`)
- **ตัวบ่งชี้การกำลังพิมพ์**: OpenClaw ส่งเหตุการณ์เริ่มพิมพ์ BlueBubbles จะล้างสถานะกำลังพิมพ์โดยอัตโนมัติเมื่อส่งหรือหมดเวลา (การหยุดด้วยตนเองผ่าน DELETE ไม่น่าเชื่อถือ)

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## การทำงานขั้นสูง

BlueBubbles รองรับการทำงานกับข้อความขั้นสูงเมื่อเปิดใช้ใน config:

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
  <Accordion title="การทำงานที่มีให้ใช้">
    - **react**: เพิ่ม/ลบรีแอ็กชัน tapback (`messageId`, `emoji`, `remove`) ชุด tapback ดั้งเดิมของ iMessage คือ `love`, `like`, `dislike`, `laugh`, `emphasize` และ `question` เมื่อเอเจนต์เลือกอีโมจินอกชุดนั้น (เช่น `👀`) เครื่องมือรีแอ็กชันจะถอยกลับไปใช้ `love` เพื่อให้ tapback ยังคงแสดงผลแทนที่จะทำให้คำขอทั้งหมดล้มเหลว รีแอ็กชัน ack ที่กำหนดค่าไว้ยังคงตรวจสอบอย่างเข้มงวดและจะแจ้งข้อผิดพลาดเมื่อพบค่าที่ไม่รู้จัก
    - **edit**: แก้ไขข้อความที่ส่งแล้ว (`messageId`, `text`)
    - **unsend**: ยกเลิกการส่งข้อความ (`messageId`)
    - **reply**: ตอบกลับข้อความที่ระบุ (`messageId`, `text`, `to`)
    - **sendWithEffect**: ส่งพร้อมเอฟเฟกต์ iMessage (`text`, `to`, `effectId`)
    - **renameGroup**: เปลี่ยนชื่อแชตกลุ่ม (`chatGuid`, `displayName`)
    - **setGroupIcon**: ตั้งค่าไอคอน/รูปภาพของแชตกลุ่ม (`chatGuid`, `media`) - ไม่เสถียรบน macOS 26 Tahoe (API อาจส่งผลว่าสำเร็จ แต่ไอคอนไม่ซิงค์)
    - **addParticipant**: เพิ่มบุคคลในกลุ่ม (`chatGuid`, `address`)
    - **removeParticipant**: นำบุคคลออกจากกลุ่ม (`chatGuid`, `address`)
    - **leaveGroup**: ออกจากแชตกลุ่ม (`chatGuid`)
    - **upload-file**: ส่งสื่อ/ไฟล์ (`to`, `buffer`, `filename`, `asVoice`)
      - บันทึกเสียง: ตั้งค่า `asVoice: true` พร้อมเสียง **MP3** หรือ **CAF** เพื่อส่งเป็นข้อความเสียง iMessage BlueBubbles จะแปลง MP3 → CAF เมื่อส่งบันทึกเสียง
    - ชื่อแทนแบบเดิม: `sendAttachment` ยังใช้งานได้ แต่ `upload-file` คือชื่อการทำงานมาตรฐาน

  </Accordion>
</AccordionGroup>

### ID ข้อความ (แบบสั้นกับแบบเต็ม)

OpenClaw อาจแสดง ID ข้อความแบบ _สั้น_ (เช่น `1`, `2`) เพื่อประหยัดโทเค็น

- `MessageSid` / `ReplyToId` อาจเป็น ID แบบสั้น
- `MessageSidFull` / `ReplyToIdFull` มี ID เต็มของผู้ให้บริการ
- ID แบบสั้นอยู่ในหน่วยความจำ และอาจหมดอายุเมื่อรีสตาร์ทหรือเมื่อแคชถูกขับออก
- การทำงานต่าง ๆ รับ `messageId` แบบสั้นหรือแบบเต็ม แต่ ID แบบสั้นจะแจ้งข้อผิดพลาดหากไม่มีให้ใช้แล้ว

ใช้ ID แบบเต็มสำหรับการทำงานอัตโนมัติและพื้นที่เก็บข้อมูลที่ต้องคงทน:

- เทมเพลต: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- บริบท: `MessageSidFull` / `ReplyToIdFull` ในเพย์โหลดขาเข้า

ดู [การกำหนดค่า](/th/gateway/configuration) สำหรับตัวแปรเทมเพลต

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## การรวม DM ที่ถูกแยกส่ง (คำสั่ง + URL ในการเขียนครั้งเดียว)

เมื่อผู้ใช้พิมพ์คำสั่งและ URL พร้อมกันใน iMessage - เช่น `Dump https://example.com/article` - Apple จะแยกการส่งออกเป็น **การส่งมอบ Webhook สองรายการแยกกัน**:

1. ข้อความตัวอักษร (`"Dump"`)
2. บอลลูนพรีวิว URL (`"https://..."`) พร้อมรูปภาพ OG-preview เป็นไฟล์แนบ

Webhook ทั้งสองมาถึง OpenClaw ห่างกันประมาณ 0.8-2.0 วินาทีในสภาพแวดล้อมส่วนใหญ่ หากไม่มีการรวม เอเจนต์จะได้รับเฉพาะคำสั่งในรอบที่ 1 ตอบกลับ (มักเป็น "ส่ง URL มาให้ฉัน") และเพิ่งเห็น URL ในรอบที่ 2 ซึ่ง ณ ตอนนั้นบริบทของคำสั่งก็หายไปแล้ว

`channels.bluebubbles.coalesceSameSenderDms` เลือกให้ DM รวม Webhook ที่ติดต่อกันจากผู้ส่งเดียวกันเป็นรอบเอเจนต์เดียว แชตกลุ่มยังคงจัดคีย์แยกตามข้อความเพื่อรักษาโครงสร้างรอบของผู้ใช้หลายคนไว้

<Tabs>
  <Tab title="ควรเปิดใช้เมื่อใด">
    เปิดใช้เมื่อ:

    - คุณส่ง Skills ที่คาดหวัง `command + payload` ในข้อความเดียว (dump, paste, save, queue เป็นต้น)
    - ผู้ใช้ของคุณวาง URL, รูปภาพ หรือเนื้อหายาวพร้อมกับคำสั่ง
    - คุณยอมรับเวลาแฝงของรอบ DM ที่เพิ่มขึ้นได้ (ดูด้านล่าง)

    ปล่อยให้ปิดใช้เมื่อ:

    - คุณต้องการเวลาแฝงขั้นต่ำสำหรับทริกเกอร์ DM แบบคำเดียว
    - โฟลว์ทั้งหมดของคุณเป็นคำสั่งครั้งเดียวจบโดยไม่มีเพย์โหลดตามมา

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

    เมื่อเปิดแฟล็กและไม่มี `messages.inbound.byChannel.bluebubbles` ที่ระบุชัดเจน หน้าต่าง debounce จะขยายเป็น **2500 ms** (ค่าเริ่มต้นสำหรับการไม่รวมคือ 500 ms) จำเป็นต้องใช้หน้าต่างที่กว้างขึ้น เพราะจังหวะ split-send ของ Apple ที่ 0.8-2.0 วินาทีไม่พอดีกับค่าเริ่มต้นที่แคบกว่า

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
    - **เวลาแฝงที่เพิ่มขึ้นสำหรับคำสั่งควบคุม DM** เมื่อเปิดแฟล็ก ข้อความคำสั่งควบคุม DM (เช่น `Dump`, `Save` เป็นต้น) จะรอสูงสุดเท่ากับหน้าต่าง debounce ก่อนส่งต่อ เผื่อมี Webhook เพย์โหลดตามมา คำสั่งในแชตกลุ่มยังคงส่งต่อทันที
    - **ผลลัพธ์ที่รวมแล้วมีขอบเขต** - ข้อความที่รวมแล้วจำกัดที่ 4000 อักขระพร้อมมาร์กเกอร์ `…[truncated]` ที่ชัดเจน ไฟล์แนบจำกัดที่ 20 รายการ รายการแหล่งที่มาจำกัดที่ 10 รายการ (คงรายการแรกบวกรายการล่าสุดไว้เมื่อเกินกว่านั้น) `messageId` ของทุกแหล่งที่มายังคงไปถึงการขจัดข้อมูลซ้ำขาเข้า ดังนั้นการเล่นซ้ำ MessagePoller ภายหลังของเหตุการณ์รายรายการใด ๆ จะถูกจดจำว่าเป็นรายการซ้ำ
    - **เลือกใช้ได้ตามแต่ละช่องทาง** ช่องทางอื่น (Telegram, WhatsApp, Slack, …) ไม่ได้รับผลกระทบ

  </Tab>
</Tabs>

### สถานการณ์และสิ่งที่เอเจนต์เห็น

| ผู้ใช้เขียน                                                        | Apple ส่งมอบ              | ปิดแฟล็ก (ค่าเริ่มต้น)                   | เปิดแฟล็ก + หน้าต่าง 2500 ms                                           |
| ------------------------------------------------------------------ | ------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (ส่งครั้งเดียว)                         | 2 Webhook ห่างกัน ~1 วินาที | เอเจนต์สองรอบ: มีแค่ "Dump" แล้วตามด้วย URL | หนึ่งรอบ: ข้อความที่รวมแล้ว `Dump https://example.com`                 |
| `Save this 📎image.jpg caption` (ไฟล์แนบ + ข้อความ)                | 2 Webhook                 | สองรอบ                                  | หนึ่งรอบ: ข้อความ + รูปภาพ                                             |
| `/status` (คำสั่งเดี่ยว)                                           | 1 Webhook                 | ส่งต่อทันที                              | **รอสูงสุดเท่าหน้าต่าง แล้วจึงส่งต่อ**                                  |
| วาง URL อย่างเดียว                                                 | 1 Webhook                 | ส่งต่อทันที                              | ส่งต่อทันที (มีเพียงรายการเดียวใน bucket)                              |
| ข้อความ + URL ที่ตั้งใจส่งเป็นข้อความแยกกันสองรายการ ห่างกันหลายนาที | 2 Webhook นอกหน้าต่าง     | สองรอบ                                  | สองรอบ (หน้าต่างหมดอายุระหว่างกัน)                                     |
| ส่ง DM สั้น ๆ จำนวนมากอย่างรวดเร็ว (>10 รายการภายในหน้าต่าง)      | N Webhook                 | N รอบ                                    | หนึ่งรอบ ผลลัพธ์มีขอบเขต (แรก + ล่าสุด ใช้ขีดจำกัดข้อความ/ไฟล์แนบแล้ว) |

### การแก้ปัญหาการรวม split-send

หากเปิดแฟล็กแล้ว แต่ split-send ยังมาถึงเป็นสองรอบ ให้ตรวจสอบแต่ละชั้น:

<AccordionGroup>
  <Accordion title="โหลด config จริงแล้ว">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    จากนั้น `openclaw gateway restart` - แฟล็กถูกอ่านตอนสร้าง debouncer-registry

  </Accordion>
  <Accordion title="หน้าต่าง debounce กว้างพอสำหรับสภาพแวดล้อมของคุณ">
    ดู log ของเซิร์ฟเวอร์ BlueBubbles ใต้ `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    วัดช่วงห่างระหว่างการส่งต่อข้อความแบบ `"Dump"` กับการส่งต่อ `"https://..."; Attachments:` ที่ตามมา เพิ่ม `messages.inbound.byChannel.bluebubbles` ให้ครอบคลุมช่วงห่างนั้นอย่างสบาย

  </Accordion>
  <Accordion title="ไทม์สแตมป์ JSONL ของเซสชัน ≠ การมาถึงของ Webhook">
    ไทม์สแตมป์เหตุการณ์ของเซสชัน (`~/.openclaw/agents/<id>/sessions/*.jsonl`) สะท้อนเวลาที่ Gateway ส่งข้อความให้เอเจนต์ **ไม่ใช่** เวลาที่ Webhook มาถึง ข้อความที่สองในคิวซึ่งติดแท็ก `[Queued messages while agent was busy]` หมายความว่ารอบแรกยังทำงานอยู่เมื่อ Webhook ที่สองมาถึง - bucket การรวมถูก flush ไปแล้ว ปรับหน้าต่างเทียบกับ log เซิร์ฟเวอร์ BB ไม่ใช่ log เซสชัน
  </Accordion>
  <Accordion title="แรงกดดันหน่วยความจำทำให้การส่งคำตอบช้าลง">
    บนเครื่องขนาดเล็กกว่า (8 GB) รอบเอเจนต์อาจใช้เวลานานพอที่ bucket การรวมจะ flush ก่อนที่การตอบกลับเสร็จ และ URL จะเข้ามาเป็นรอบที่สองในคิว ตรวจสอบ `memory_pressure` และ `ps -o rss -p $(pgrep openclaw-gateway)`; หาก Gateway ใช้ RSS เกินประมาณ 500 MB และ compressor ทำงานอยู่ ให้ปิดกระบวนการหนักอื่น ๆ หรือย้ายไปโฮสต์ที่ใหญ่ขึ้น
  </Accordion>
  <Accordion title="การส่งแบบอ้างอิงตอบกลับเป็นเส้นทางคนละแบบ">
    หากผู้ใช้แตะ `Dump` เป็น **การตอบกลับ** บอลลูน URL ที่มีอยู่ (iMessage แสดงป้าย "1 Reply" บนบับเบิล Dump) URL จะอยู่ใน `replyToBody` ไม่ใช่ใน Webhook ที่สอง การรวมไม่เกี่ยวข้อง - นั่นเป็นเรื่องของ skill/prompt ไม่ใช่เรื่องของ debouncer
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

## ข้อมูลอ้างอิงการกำหนดค่า

การกำหนดค่าแบบเต็ม: [การกำหนดค่า](/th/gateway/configuration)

<AccordionGroup>
  <Accordion title="การเชื่อมต่อและ Webhook">
    - `channels.bluebubbles.enabled`: เปิด/ปิดแชนเนล
    - `channels.bluebubbles.serverUrl`: URL ฐานของ REST API สำหรับ BlueBubbles
    - `channels.bluebubbles.password`: รหัสผ่าน API
    - `channels.bluebubbles.webhookPath`: พาธ endpoint ของ Webhook (ค่าเริ่มต้น: `/bluebubbles-webhook`)

  </Accordion>
  <Accordion title="นโยบายการเข้าถึง">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: `pairing`)
    - `channels.bluebubbles.allowFrom`: รายการที่อนุญาตสำหรับ DM (handles, อีเมล, หมายเลข E.164, `chat_id:*`, `chat_guid:*`)
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`)
    - `channels.bluebubbles.groupAllowFrom`: รายการที่อนุญาตสำหรับผู้ส่งในกลุ่ม
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: บน macOS เลือกเติมข้อมูลผู้เข้าร่วมกลุ่มที่ไม่มีชื่อจาก Contacts ภายในเครื่องหลังผ่านการคัดกรองแล้ว ค่าเริ่มต้น: `false`
    - `channels.bluebubbles.groups`: การกำหนดค่าต่อกลุ่ม (`requireMention` ฯลฯ)

  </Accordion>
  <Accordion title="การจัดส่งและการแบ่งข้อความ">
    - `channels.bluebubbles.sendReadReceipts`: ส่งใบตอบรับว่าอ่านแล้ว (ค่าเริ่มต้น: `true`)
    - `channels.bluebubbles.blockStreaming`: เปิดใช้ block streaming (ค่าเริ่มต้น: `false`; จำเป็นสำหรับการตอบกลับแบบสตรีม)
    - `channels.bluebubbles.textChunkLimit`: ขนาดส่วนข้อความขาออกเป็นอักขระ (ค่าเริ่มต้น: 4000)
    - `channels.bluebubbles.sendTimeoutMs`: ระยะหมดเวลาต่อคำขอเป็น ms สำหรับการส่งข้อความขาออกผ่าน `/api/v1/message/text` (ค่าเริ่มต้น: 30000) เพิ่มค่านี้บนชุดติดตั้ง macOS 26 ที่การส่งผ่าน Private API ของ iMessage อาจค้างได้นานกว่า 60 วินาทีภายในเฟรมเวิร์ก iMessage; เช่น `45000` หรือ `60000` ปัจจุบัน probes, การค้นหาแชท, reactions, edits และ health checks ยังคงใช้ค่าเริ่มต้นที่สั้นกว่า 10 วินาที; มีแผนขยายการครอบคลุมไปยัง reactions และ edits เป็นงานถัดไป การแทนที่ค่าต่อบัญชี: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`
    - `channels.bluebubbles.chunkMode`: `length` (ค่าเริ่มต้น) จะแบ่งเฉพาะเมื่อเกิน `textChunkLimit`; `newline` จะแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว

  </Accordion>
  <Accordion title="สื่อและประวัติ">
    - `channels.bluebubbles.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า/ขาออกเป็น MB (ค่าเริ่มต้น: 8)
    - `channels.bluebubbles.mediaLocalRoots`: รายการที่อนุญาตอย่างชัดเจนของไดเรกทอรีภายในเครื่องแบบ absolute ที่อนุญาตให้ใช้กับพาธสื่อภายในเครื่องขาออก การส่งพาธภายในเครื่องจะถูกปฏิเสธโดยค่าเริ่มต้น เว้นแต่จะกำหนดค่านี้ไว้ การแทนที่ค่าต่อบัญชี: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`
    - `channels.bluebubbles.coalesceSameSenderDms`: รวม Webhook ของ DM จากผู้ส่งเดียวกันที่มาต่อเนื่องกันให้เป็นหนึ่งรอบของ agent เพื่อให้การส่งแยกข้อความ+URL ของ Apple มาถึงเป็นข้อความเดียว (ค่าเริ่มต้น: `false`) ดู [การรวม DM ที่ถูกส่งแยก](#coalescing-split-send-dms-command--url-in-one-composition) สำหรับสถานการณ์ การปรับหน้าต่างเวลา และข้อแลกเปลี่ยน เมื่อเปิดใช้โดยไม่มี `messages.inbound.byChannel.bluebubbles` ที่ระบุไว้ชัดเจน จะขยายหน้าต่าง debounce ขาเข้าเริ่มต้นจาก 500 ms เป็น 2500 ms
    - `channels.bluebubbles.historyLimit`: จำนวนข้อความกลุ่มสูงสุดสำหรับบริบท (0 หมายถึงปิดใช้)
    - `channels.bluebubbles.dmHistoryLimit`: ขีดจำกัดประวัติ DM
    - `channels.bluebubbles.replyContextApiFallback`: เมื่อ reply ขาเข้ามาถึงโดยไม่มี `replyToBody`/`replyToSender` และแคช reply-context ในหน่วยความจำไม่พบรายการ ให้ดึงข้อความต้นฉบับจาก BlueBubbles HTTP API เป็น fallback แบบ best-effort (ค่าเริ่มต้น: `false`) มีประโยชน์สำหรับการติดตั้งหลายอินสแตนซ์ที่ใช้บัญชี BlueBubbles เดียวกันร่วมกัน หลังรีสตาร์ทโปรเซส หรือหลังการไล่ออกจากแคช TTL/LRU ที่มีอายุยาวนาน การดึงข้อมูลมีการป้องกัน SSRF ด้วยนโยบายเดียวกับคำขอไคลเอนต์ BlueBubbles อื่นทั้งหมด ไม่ throw และเติมแคชเพื่อให้ reply ถัดไปใช้ต้นทุนร่วมกันได้ การแทนที่ค่าต่อบัญชี: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback` การตั้งค่าระดับแชนเนลจะส่งต่อไปยังบัญชีที่ละเว้น flag นี้

  </Accordion>
  <Accordion title="การกระทำและบัญชี">
    - `channels.bluebubbles.actions`: เปิด/ปิดการกระทำเฉพาะรายการ
    - `channels.bluebubbles.accounts`: การกำหนดค่าหลายบัญชี

  </Accordion>
</AccordionGroup>

ตัวเลือกระดับ global ที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (หรือ `messages.groupChat.mentionPatterns`)
- `messages.responsePrefix`

## การระบุที่อยู่ / เป้าหมายการจัดส่ง

ควรใช้ `chat_guid` เพื่อการกำหนดเส้นทางที่เสถียร:

- `chat_guid:iMessage;-;+15555550123` (แนะนำสำหรับกลุ่ม)
- `chat_id:123`
- `chat_identifier:...`
- handles โดยตรง: `+15555550123`, `user@example.com`
  - หาก handle โดยตรงไม่มีแชท DM ที่มีอยู่ OpenClaw จะสร้างให้ผ่าน `POST /api/v1/chat/new` ซึ่งต้องเปิดใช้ BlueBubbles Private API

### การกำหนดเส้นทาง iMessage เทียบกับ SMS

เมื่อ handle เดียวกันมีทั้งแชท iMessage และ SMS บน Mac (เช่น หมายเลขโทรศัพท์ที่ลงทะเบียน iMessage แล้ว แต่เคยได้รับ fallback แบบ green-bubble ด้วย) OpenClaw จะเลือกแชท iMessage และจะไม่ลดระดับเป็น SMS แบบเงียบ ๆ หากต้องการบังคับใช้แชท SMS ให้ใช้ prefix เป้าหมาย `sms:` อย่างชัดเจน (เช่น `sms:+15555550123`) Handles ที่ไม่มีแชท iMessage ตรงกันจะยังส่งผ่านแชทใดก็ตามที่ BlueBubbles รายงาน

## ความปลอดภัย

- คำขอ Webhook จะได้รับการยืนยันตัวตนโดยเปรียบเทียบ query params หรือ headers ของ `guid`/`password` กับ `channels.bluebubbles.password`
- เก็บรหัสผ่าน API และ endpoint ของ Webhook เป็นความลับ (ปฏิบัติกับสิ่งเหล่านี้เหมือน credentials)
- ไม่มีการข้ามการยืนยันตัวตน Webhook ของ BlueBubbles สำหรับ localhost หากคุณ proxy ทราฟฟิก Webhook ให้คงรหัสผ่าน BlueBubbles ไว้ในคำขอแบบ end-to-end `gateway.trustedProxies` ไม่ได้แทนที่ `channels.bluebubbles.password` ที่นี่ ดู [ความปลอดภัยของ Gateway](/th/gateway/security#reverse-proxy-configuration)
- เปิดใช้ HTTPS + กฎ firewall บนเซิร์ฟเวอร์ BlueBubbles หากเปิดเผยออกนอก LAN ของคุณ

## การแก้ปัญหา

- หากเหตุการณ์ typing/read หยุดทำงาน ให้ตรวจสอบบันทึก Webhook ของ BlueBubbles และยืนยันว่าพาธ Gateway ตรงกับ `channels.bluebubbles.webhookPath`
- โค้ด pairing หมดอายุหลังหนึ่งชั่วโมง; ใช้ `openclaw pairing list bluebubbles` และ `openclaw pairing approve bluebubbles <code>`
- Reactions ต้องใช้ private API ของ BlueBubbles (`POST /api/v1/message/react`); ตรวจสอบให้แน่ใจว่าเวอร์ชันเซิร์ฟเวอร์เปิดเผย API นี้
- Edit/unsend ต้องใช้ macOS 13+ และเวอร์ชันเซิร์ฟเวอร์ BlueBubbles ที่เข้ากันได้ บน macOS 26 (Tahoe) ขณะนี้ edit ใช้งานไม่ได้เนื่องจากการเปลี่ยนแปลง private API
- การอัปเดตไอคอนกลุ่มอาจไม่เสถียรบน macOS 26 (Tahoe): API อาจส่งคืนว่าสำเร็จ แต่ไอคอนใหม่ไม่ sync
- OpenClaw จะซ่อนการกระทำที่ทราบว่าเสียโดยอัตโนมัติตามเวอร์ชัน macOS ของเซิร์ฟเวอร์ BlueBubbles หาก edit ยังคงปรากฏบน macOS 26 (Tahoe) ให้ปิดด้วยตนเองโดยใช้ `channels.bluebubbles.actions.edit=false`
- เปิดใช้ `coalesceSameSenderDms` แล้ว แต่ split-sends (เช่น `Dump` + URL) ยังมาถึงเป็นสองรอบ: ดู checklist [การแก้ปัญหาการรวม split-send](#split-send-coalescing-troubleshooting) - สาเหตุทั่วไปคือหน้าต่าง debounce แคบเกินไป, อ่าน timestamp ของ session-log ผิดเป็นเวลาที่ Webhook มาถึง, หรือการส่งแบบ reply-quote (ซึ่งใช้ `replyToBody` ไม่ใช่ Webhook ที่สอง)
- สำหรับข้อมูลสถานะ/สุขภาพ: `openclaw status --all` หรือ `openclaw status --deep`

สำหรับอ้างอิง workflow ของแชนเนลทั่วไป โปรดดู [แชนเนล](/th/channels) และคู่มือ [Plugins](/th/tools/plugin)

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางแชนเนล](/th/channels/channel-routing) - การกำหนดเส้นทาง session สำหรับข้อความ
- [ภาพรวมแชนเนล](/th/channels) - แชนเนลที่รองรับทั้งหมด
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชทกลุ่มและการคัดกรองด้วย mention
- [Pairing](/th/channels/pairing) - การยืนยันตัวตน DM และ flow การ pairing
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
