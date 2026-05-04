---
read_when:
    - การตั้งค่า Slack หรือการดีบักโหมด socket/HTTP ของ Slack
summary: การตั้งค่า Slack และพฤติกรรมขณะรัน (โหมด Socket + URL ของคำขอ HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-04T07:02:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4a91fc1ae5f1e03f714308be54e164ef204809e74efabed8dc75c3035c14228
    source_path: channels/slack.md
    workflow: 16
---

พร้อมใช้งานระดับโปรดักชันสำหรับ DM และช่องผ่านการผสานรวม Slack app โหมดเริ่มต้นคือ Socket Mode และยังรองรับ HTTP Request URLs ด้วย

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    Slack DM ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    ลักษณะการทำงานของคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องและคู่มือปฏิบัติการซ่อมแซม
  </Card>
</CardGroup>

## ตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="Socket Mode (ค่าเริ่มต้น)">
    <Steps>
      <Step title="สร้าง Slack app ใหม่">
        ในการตั้งค่า Slack app ให้กดปุ่ม **[Create New App](https://api.slack.com/apps/new)**:

        - เลือก **from a manifest** และเลือก workspace สำหรับแอปของคุณ
        - วาง [manifest ตัวอย่าง](#manifest-and-scope-checklist) ด้านล่างและดำเนินการต่อเพื่อสร้าง
        - สร้าง **App-Level Token** (`xapp-...`) พร้อม `connections:write`
        - ติดตั้งแอปและคัดลอก **Bot Token** (`xoxb-...`) ที่แสดง

      </Step>

      <Step title="กำหนดค่า OpenClaw">

        การตั้งค่า SecretRef ที่แนะนำ:

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        Env สำรอง (เฉพาะบัญชีเริ่มต้นเท่านั้น):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="เริ่ม Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="สร้าง Slack app ใหม่">
        ในการตั้งค่า Slack app ให้กดปุ่ม **[Create New App](https://api.slack.com/apps/new)**:

        - เลือก **from a manifest** และเลือก workspace สำหรับแอปของคุณ
        - วาง [manifest ตัวอย่าง](#manifest-and-scope-checklist) และอัปเดต URL ก่อนสร้าง
        - บันทึก **Signing Secret** สำหรับการตรวจสอบคำขอ
        - ติดตั้งแอปและคัดลอก **Bot Token** (`xoxb-...`) ที่แสดง

      </Step>

      <Step title="กำหนดค่า OpenClaw">

        การตั้งค่า SecretRef ที่แนะนำ:

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        ใช้ webhook path ที่ไม่ซ้ำกันสำหรับ HTTP หลายบัญชี

        กำหนด `webhookPath` ที่แตกต่างกันให้แต่ละบัญชี (ค่าเริ่มต้น `/slack/events`) เพื่อไม่ให้การลงทะเบียนชนกัน
        </Note>

      </Step>

      <Step title="เริ่ม Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## การปรับแต่งการส่งข้อมูลของ Socket Mode

OpenClaw ตั้งค่า pong timeout ของไคลเอนต์ Slack SDK เป็น 15 วินาทีโดยค่าเริ่มต้นสำหรับ Socket Mode ให้แทนที่การตั้งค่าการส่งข้อมูลเฉพาะเมื่อคุณต้องปรับแต่งตาม workspace หรือโฮสต์เท่านั้น:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

ใช้ตัวเลือกนี้เฉพาะกับ workspace ของ Socket Mode ที่บันทึก Slack websocket pong/server-ping timeout หรือทำงานบนโฮสต์ที่มีปัญหา event-loop starvation ที่ทราบอยู่แล้ว `clientPingTimeout` คือเวลารอ pong หลังจาก SDK ส่ง client ping ส่วน `serverPingTimeout` คือเวลารอ ping จากเซิร์ฟเวอร์ Slack ข้อความและเหตุการณ์ของแอปยังคงเป็นสถานะแอปพลิเคชัน ไม่ใช่สัญญาณความพร้อมของการส่งข้อมูล

## รายการตรวจสอบ manifest และ scope

Slack app manifest พื้นฐานเหมือนกันสำหรับ Socket Mode และ HTTP Request URLs มีเฉพาะบล็อก `settings` (และ `url` ของคำสั่ง slash) ที่ต่างกัน

manifest พื้นฐาน (ค่าเริ่มต้น Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

สำหรับ **โหมด HTTP Request URLs** ให้แทนที่ `settings` ด้วยตัวแปร HTTP และเพิ่ม `url` ในแต่ละคำสั่ง slash ต้องมี URL สาธารณะ:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### การตั้งค่า manifest เพิ่มเติม

แสดงฟีเจอร์ต่าง ๆ ที่ขยายค่าเริ่มต้นด้านบน

manifest เริ่มต้นเปิดใช้แท็บ **Home** ของ Slack App Home และสมัครรับ `app_home_opened` เมื่อสมาชิก workspace เปิดแท็บ Home, OpenClaw จะเผยแพร่มุมมอง Home เริ่มต้นที่ปลอดภัยด้วย `views.publish` โดยไม่รวม payload การสนทนาหรือการกำหนดค่าส่วนตัว แท็บ **Messages** ยังคงเปิดใช้สำหรับ Slack DM

<AccordionGroup>
  <Accordion title="คำสั่ง slash แบบเนทีฟที่ไม่บังคับ">

    สามารถใช้ [คำสั่ง slash แบบเนทีฟ](#commands-and-slash-behavior) หลายคำสั่งแทนคำสั่งเดียวที่กำหนดค่าไว้พร้อมรายละเอียดปลีกย่อยได้:

    - ใช้ `/agentstatus` แทน `/status` เพราะคำสั่ง `/status` ถูกสงวนไว้
    - สามารถเปิดให้ใช้คำสั่ง slash ได้พร้อมกันไม่เกิน 25 คำสั่ง

    แทนที่ส่วน `features.slash_commands` ที่มีอยู่ด้วยชุดย่อยของ [คำสั่งที่มีให้ใช้](/th/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (ค่าเริ่มต้น)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Start a new session",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "Reset the current session"
    },
    {
      "command": "/compact",
      "description": "Compact the session context",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Stop the current run"
    },
    {
      "command": "/session",
      "description": "Manage thread-binding expiry",
      "usage_hint": "idle <duration|off> or max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "Set the thinking level",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Toggle verbose output",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Show or set fast mode",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Toggle reasoning visibility",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Toggle elevated mode",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Show or set exec defaults",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/model",
      "description": "Show or set the model",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "List providers/models",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "Show the short help summary"
    },
    {
      "command": "/commands",
      "description": "Show the generated command catalog"
    },
    {
      "command": "/tools",
      "description": "Show what the current agent can use right now",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Show runtime status, including provider usage/quota when available"
    },
    {
      "command": "/tasks",
      "description": "List active/recent background tasks for the current session"
    },
    {
      "command": "/context",
      "description": "Explain how context is assembled",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Show your sender identity"
    },
    {
      "command": "/skill",
      "description": "Run a skill by name",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP Request URLs">
        ใช้รายการ `slash_commands` เดียวกับ Socket Mode ด้านบน และเพิ่ม `"url": "https://gateway-host.example.com/slack/events"` ในทุกรายการ ตัวอย่าง:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Start a new session",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Show the short help summary",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        ทำซ้ำค่า `url` นั้นในทุกคำสั่งในรายการ

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="ขอบเขตผู้เขียนเพิ่มเติม (การดำเนินการเขียน)">
    เพิ่มขอบเขตบอต `chat:write.customize` หากคุณต้องการให้ข้อความขาออกใช้อัตลักษณ์ของเอเจนต์ที่ใช้งานอยู่ (ชื่อผู้ใช้และไอคอนแบบกำหนดเอง) แทนอัตลักษณ์เริ่มต้นของแอป Slack

    หากคุณใช้ไอคอนอีโมจิ Slack คาดหวังไวยากรณ์แบบ `:emoji_name:`

  </Accordion>
  <Accordion title="ขอบเขตโทเค็นผู้ใช้เพิ่มเติม (การดำเนินการอ่าน)">
    หากคุณกำหนดค่า `channels.slack.userToken` ขอบเขตการอ่านโดยทั่วไปคือ:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (หากคุณพึ่งพาการอ่านการค้นหาของ Slack)

  </Accordion>
</AccordionGroup>

## โมเดลโทเค็น

- จำเป็นต้องมี `botToken` + `appToken` สำหรับ Socket Mode
- โหมด HTTP ต้องใช้ `botToken` + `signingSecret`
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับสตริงข้อความธรรมดา
  หรือออบเจ็กต์ SecretRef
- โทเค็นในคอนฟิกจะแทนที่ env fallback
- env fallback ของ `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
- `userToken` (`xoxp-...`) เป็นแบบคอนฟิกเท่านั้น (ไม่มี env fallback) และมีค่าเริ่มต้นเป็นพฤติกรรมอ่านอย่างเดียว (`userTokenReadOnly: true`)

พฤติกรรมสแนปช็อตสถานะ:

- การตรวจสอบบัญชี Slack ติดตามฟิลด์ `*Source` และ `*Status`
  ต่อข้อมูลประจำตัว (`botToken`, `appToken`, `signingSecret`, `userToken`)
- สถานะคือ `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าผ่าน SecretRef
  หรือแหล่งความลับแบบไม่ฝังในบรรทัดอื่น แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบัน
  ไม่สามารถแก้ค่าแท้จริงได้
- ในโหมด HTTP จะรวม `signingSecretStatus` ไว้ด้วย; ใน Socket Mode
  คู่ที่จำเป็นคือ `botTokenStatus` + `appTokenStatus`

<Tip>
สำหรับการอ่านแอ็กชัน/ไดเรกทอรี สามารถเลือกใช้โทเค็นผู้ใช้ก่อนเมื่อกำหนดค่าไว้ สำหรับการเขียน โทเค็นบอตยังคงเป็นตัวเลือกหลัก; การเขียนด้วยโทเค็นผู้ใช้จะอนุญาตเฉพาะเมื่อ `userTokenReadOnly: false` และโทเค็นบอตไม่พร้อมใช้งาน
</Tip>

## แอ็กชันและเกต

แอ็กชัน Slack ควบคุมโดย `channels.slack.actions.*`

กลุ่มแอ็กชันที่พร้อมใช้งานในเครื่องมือ Slack ปัจจุบัน:

| กลุ่ม      | ค่าเริ่มต้น |
| ---------- | ------- |
| messages   | เปิดใช้งาน |
| reactions  | เปิดใช้งาน |
| pins       | เปิดใช้งาน |
| memberInfo | เปิดใช้งาน |
| emojiList  | เปิดใช้งาน |

แอ็กชันข้อความ Slack ปัจจุบันประกอบด้วย `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list` `download-file` รับ ID ไฟล์ Slack ที่แสดงในตัวแทนที่ไฟล์ขาเข้า และคืนค่าตัวอย่างรูปภาพสำหรับรูปภาพ หรือเมตาดาต้าไฟล์ในเครื่องสำหรับไฟล์ประเภทอื่น

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM `channels.slack.allowFrom` คือ allowlist ของ DM ตามมาตรฐาน

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.slack.allowFrom` รวม `"*"`)
    - `disabled`

    แฟล็ก DM:

    - `dm.enabled` (ค่าเริ่มต้น true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (เดิม)
    - `dm.groupEnabled` (DM แบบกลุ่มมีค่าเริ่มต้น false)
    - `dm.groupChannels` (allowlist MPIM เพิ่มเติม)

    ลำดับความสำคัญของหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่มีชื่อจะสืบทอด `channels.slack.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตัวเอง
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.slack.accounts.default.allowFrom`

    ยังคงอ่าน `channels.slack.dm.policy` และ `channels.slack.dm.allowFrom` เดิมเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    การจับคู่ใน DM ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="นโยบายช่อง">
    `channels.slack.groupPolicy` ควบคุมการจัดการช่อง:

    - `open`
    - `allowlist`
    - `disabled`

    allowlist ของช่องอยู่ภายใต้ `channels.slack.channels` และ**ต้องใช้ ID ช่อง Slack ที่เสถียร** (เช่น `C12345678`) เป็นคีย์คอนฟิก

    หมายเหตุรันไทม์: หาก `channels.slack` หายไปทั้งหมด (การตั้งค่าแบบ env-only) รันไทม์จะ fallback ไปเป็น `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

    การแก้ชื่อ/ID:

    - รายการ allowlist ของช่องและรายการ allowlist ของ DM จะถูกแก้ตอนเริ่มต้นเมื่อการเข้าถึงโทเค็นอนุญาต
    - รายการชื่อช่องที่แก้ไม่ได้จะคงไว้ตามที่กำหนดค่า แต่จะถูกละเว้นสำหรับการกำหนดเส้นทางโดยค่าเริ่มต้น
    - การอนุญาตขาเข้าและการกำหนดเส้นทางช่องจะใช้ ID เป็นหลักโดยค่าเริ่มต้น; การจับคู่ชื่อผู้ใช้/slug โดยตรงต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    คีย์ตามชื่อ (`#channel-name` หรือ `channel-name`) จะ**ไม่**จับคู่ภายใต้ `groupPolicy: "allowlist"` การค้นหาช่องใช้ ID เป็นหลักโดยค่าเริ่มต้น ดังนั้นคีย์ตามชื่อจะไม่มีทางกำหนดเส้นทางสำเร็จ และข้อความทั้งหมดในช่องนั้นจะถูกบล็อกอย่างเงียบ ๆ ซึ่งแตกต่างจาก `groupPolicy: "open"` ที่ไม่จำเป็นต้องใช้คีย์ช่องสำหรับการกำหนดเส้นทาง และคีย์ตามชื่อดูเหมือนจะใช้งานได้

    ใช้ ID ช่อง Slack เป็นคีย์เสมอ วิธีค้นหา: คลิกขวาที่ช่องใน Slack → **Copy link** — ID (`C...`) จะปรากฏที่ท้าย URL

    ถูกต้อง:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    ไม่ถูกต้อง (ถูกบล็อกอย่างเงียบ ๆ ภายใต้ `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Mentions and channel users">
    ข้อความในช่องทางถูกควบคุมด้วยการกล่าวถึงโดยค่าเริ่มต้น

    แหล่งที่มาของการกล่าวถึง:

    - การกล่าวถึงแอปอย่างชัดเจน (`<@botId>`)
    - การกล่าวถึงกลุ่มผู้ใช้ Slack (`<!subteam^S...>`) เมื่อผู้ใช้บอทเป็นสมาชิกของกลุ่มผู้ใช้นั้น ต้องใช้ `usergroups:read`
    - รูปแบบ regex สำหรับการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`, สำรองเป็น `messages.groupChat.mentionPatterns`)
    - พฤติกรรมเธรดตอบกลับถึงบอทโดยนัย (ปิดใช้งานเมื่อ `thread.requireExplicitMention` เป็น `true`)

    การควบคุมรายช่องทาง (`channels.slack.channels.<id>`; ใช้ชื่อได้เฉพาะผ่านการแก้ค่าเมื่อเริ่มต้นหรือ `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ของ `toolsBySender`: `id:`, `e164:`, `username:`, `name:`, หรือ wildcard `"*"`
      (คีย์แบบเดิมที่ไม่มีคำนำหน้ายังคงแมปไปยัง `id:` เท่านั้น)

    `allowBots` มีความระมัดระวังสำหรับช่องทางและช่องทางส่วนตัว: ข้อความในห้องที่เขียนโดยบอทจะถูกรับเฉพาะเมื่อบอทผู้ส่งถูกระบุไว้อย่างชัดเจนใน allowlist `users` ของห้องนั้น หรือเมื่อมี ID เจ้าของ Slack ที่ชัดเจนอย่างน้อยหนึ่งรายการจาก `channels.slack.allowFrom` เป็นสมาชิกห้องอยู่ในขณะนั้น wildcard และรายการเจ้าของที่เป็นชื่อที่แสดงไม่ถือว่าเป็นการมีอยู่ของเจ้าของ การมีอยู่ของเจ้าของใช้ Slack `conversations.members`; ตรวจสอบให้แน่ใจว่าแอปมี scope อ่านที่ตรงกับประเภทห้อง (`channels:read` สำหรับช่องทางสาธารณะ, `groups:read` สำหรับช่องทางส่วนตัว) หากการค้นหาสมาชิกล้มเหลว OpenClaw จะทิ้งข้อความในห้องที่เขียนโดยบอท

  </Tab>
</Tabs>

## เธรด เซสชัน และแท็กตอบกลับ

- DM กำหนดเส้นทางเป็น `direct`; ช่องทางเป็น `channel`; MPIM เป็น `group`
- การผูกเส้นทางของ Slack รับ ID เพียร์ดิบ รวมถึงรูปแบบเป้าหมาย Slack เช่น `channel:C12345678`, `user:U12345678`, และ `<@U12345678>`
- ด้วยค่าเริ่มต้น `session.dmScope=main` DM ของ Slack จะยุบรวมเข้าเซสชันหลักของเอเจนต์
- เซสชันช่องทาง: `agent:<agentId>:slack:channel:<channelId>`
- การตอบกลับในเธรดสามารถสร้างส่วนท้ายเซสชันของเธรด (`:thread:<threadTs>`) เมื่อใช้ได้
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความเธรดที่มีอยู่ซึ่งจะถูกดึงเมื่อเซสชันเธรดใหม่เริ่มต้น (ค่าเริ่มต้น `20`; ตั้งเป็น `0` เพื่อปิดใช้งาน)
- `channels.slack.thread.requireExplicitMention` (ค่าเริ่มต้น `false`): เมื่อเป็น `true` จะระงับการกล่าวถึงเธรดโดยนัย เพื่อให้บอทตอบเฉพาะการกล่าวถึง `@bot` อย่างชัดเจนภายในเธรด แม้ว่าบอทจะเคยเข้าร่วมเธรดนั้นแล้วก็ตาม หากไม่มีค่านี้ การตอบกลับในเธรดที่บอทเคยเข้าร่วมจะข้ามการควบคุม `requireMention`

การควบคุมเธรดการตอบกลับ:

- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: แยกตาม `direct|group|channel`
- ค่าสำรองเดิมสำหรับแชทโดยตรง: `channels.slack.dm.replyToMode`

รองรับแท็กตอบกลับแบบกำหนดเอง:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` ปิดใช้งานเธรดการตอบกลับ **ทั้งหมด** ใน Slack รวมถึงแท็ก `[[reply_to_*]]` ที่ชัดเจน ซึ่งต่างจาก Telegram ที่ยังคงใช้แท็กที่ชัดเจนในโหมด `"off"` อยู่ เธรดของ Slack ซ่อนข้อความจากช่องทาง ขณะที่การตอบกลับของ Telegram ยังคงมองเห็นแบบอินไลน์
</Note>

## รีแอ็กชันรับทราบ

`ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

ลำดับการแก้ค่า:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- อีโมจิสำรองจากตัวตนของเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้นเป็น "👀")

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"eyes"`)
- ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับบัญชี Slack หรือทั่วทั้งระบบ

## การสตรีมข้อความ

`channels.slack.streaming` ควบคุมพฤติกรรมตัวอย่างสด:

- `off`: ปิดใช้งานการสตรีมตัวอย่างสด
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความตัวอย่างด้วยผลลัพธ์บางส่วนล่าสุด
- `block`: ต่อท้ายการอัปเดตตัวอย่างเป็นชิ้น ๆ
- `progress`: แสดงข้อความสถานะความคืบหน้าระหว่างสร้าง แล้วจึงส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อตัวอย่างฉบับร่างทำงาน ให้กำหนดเส้นทางการอัปเดตเครื่องมือ/ความคืบหน้าเข้าไปยังข้อความตัวอย่างที่ถูกแก้ไขเดียวกัน (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อแยกข้อความเครื่องมือ/ความคืบหน้าออกต่างหาก
- `streaming.preview.commandText` / `streaming.progress.commandText`: ตั้งเป็น `status` เพื่อคงบรรทัดความคืบหน้าของเครื่องมือแบบกะทัดรัด พร้อมซ่อนข้อความคำสั่ง/การดำเนินการดิบ (ค่าเริ่มต้น: `raw`)

ซ่อนข้อความคำสั่ง/การดำเนินการดิบ พร้อมคงบรรทัดความคืบหน้าแบบกะทัดรัด:

```json
{
  "channels": {
    "slack": {
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

`channels.slack.streaming.nativeTransport` ควบคุมการสตรีมข้อความแบบเนทีฟของ Slack เมื่อ `channels.slack.streaming.mode` เป็น `partial` (ค่าเริ่มต้น: `true`)

- ต้องมีเธรดตอบกลับสำหรับการสตรีมข้อความแบบเนทีฟและเพื่อให้สถานะเธรดผู้ช่วยของ Slack ปรากฏ การเลือกเธรดยังคงเป็นไปตาม `replyToMode`
- รากของช่องทาง แชทกลุ่ม และ DM ระดับบนยังคงใช้ตัวอย่างฉบับร่างปกติได้เมื่อการสตรีมแบบเนทีฟใช้ไม่ได้หรือไม่มีเธรดตอบกลับ
- DM ระดับบนของ Slack ยังคงอยู่นอกเธรดโดยค่าเริ่มต้น ดังนั้นจึงไม่แสดงตัวอย่างสตรีม/สถานะแบบเนทีฟสไตล์เธรดของ Slack; OpenClaw จะโพสต์และแก้ไขตัวอย่างฉบับร่างใน DM แทน
- สื่อและ payload ที่ไม่ใช่ข้อความจะย้อนกลับไปใช้การส่งตามปกติ
- ผลลัพธ์สุดท้ายของสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่; ผลลัพธ์สุดท้ายของข้อความ/บล็อกที่เข้าเกณฑ์จะ flush เฉพาะเมื่อสามารถแก้ไขตัวอย่างเดิมได้
- หากการสตรีมล้มเหลวระหว่างการตอบกลับ OpenClaw จะย้อนกลับไปใช้การส่งตามปกติสำหรับ payload ที่เหลือ

ใช้ตัวอย่างฉบับร่างแทนการสตรีมข้อความแบบเนทีฟของ Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

คีย์เดิม:

- `channels.slack.streamMode` (`replace | status_final | append`) จะถูกย้ายโดยอัตโนมัติไปยัง `channels.slack.streaming.mode`
- boolean `channels.slack.streaming` จะถูกย้ายโดยอัตโนมัติไปยัง `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport`
- `channels.slack.nativeStreaming` แบบเดิมจะถูกย้ายโดยอัตโนมัติไปยัง `channels.slack.streaming.nativeTransport`

## ค่าสำรองรีแอ็กชันการพิมพ์

`typingReaction` จะเพิ่มรีแอคชันชั่วคราวให้กับข้อความ Slack ขาเข้าขณะที่ OpenClaw กำลังประมวลผลคำตอบ แล้วลบออกเมื่อการรันเสร็จสิ้น วิธีนี้มีประโยชน์มากที่สุดนอกเหนือจากการตอบกลับในเธรด ซึ่งใช้ตัวบ่งชี้สถานะเริ่มต้นว่า "กำลังพิมพ์..."

ลำดับการแก้ไขค่า:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack คาดหวัง shortcodes (ตัวอย่างเช่น `"hourglass_flowing_sand"`)
- รีแอคชันเป็นแบบพยายามอย่างดีที่สุด และจะพยายามล้างค่าโดยอัตโนมัติหลังจากเส้นทางการตอบกลับหรือความล้มเหลวเสร็จสมบูรณ์

## สื่อ การแบ่งชิ้น และการส่งมอบ

<AccordionGroup>
  <Accordion title="ไฟล์แนบขาเข้า">
    ไฟล์แนบ Slack จะถูกดาวน์โหลดจาก URL ส่วนตัวที่ Slack โฮสต์ไว้ (โฟลว์คำขอที่ตรวจสอบสิทธิ์ด้วยโทเค็น) และเขียนลงในที่เก็บสื่อเมื่อดึงข้อมูลสำเร็จและข้อจำกัดขนาดอนุญาต ตัวแทนไฟล์มี `fileId` ของ Slack เพื่อให้เอเจนต์ดึงไฟล์ต้นฉบับด้วย `download-file` ได้

    การดาวน์โหลดใช้ timeout แบบ idle และรวมที่มีขอบเขตจำกัด หากการดึงไฟล์ Slack ค้างหรือล้มเหลว OpenClaw จะประมวลผลข้อความต่อไปและถอยกลับไปใช้ตัวแทนไฟล์

    ขีดจำกัดขนาดขาเข้าขณะรันมีค่าเริ่มต้นเป็น `20MB` เว้นแต่จะถูกแทนที่ด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="ข้อความและไฟล์ขาออก">
    - ชิ้นข้อความใช้ `channels.slack.textChunkLimit` (ค่าเริ่มต้น 4000)
    - `channels.slack.chunkMode="newline"` เปิดใช้การแบ่งแบบยึดย่อหน้าเป็นหลัก
    - การส่งไฟล์ใช้ API อัปโหลดของ Slack และสามารถรวมการตอบกลับในเธรด (`thread_ts`) ได้
    - ขีดจำกัดสื่อขาออกใช้ `channels.slack.mediaMaxMb` เมื่อกำหนดค่าไว้ มิฉะนั้นการส่งของช่องทางจะใช้ค่าเริ่มต้นตามชนิด MIME จากไปป์ไลน์สื่อ

  </Accordion>

  <Accordion title="เป้าหมายการส่งมอบ">
    เป้าหมายแบบระบุชัดเจนที่แนะนำ:

    - `user:<id>` สำหรับ DM
    - `channel:<id>` สำหรับช่องทาง

    DM ของ Slack ที่เป็นข้อความ/บล็อกอย่างเดียวสามารถโพสต์ไปยัง ID ผู้ใช้ได้โดยตรง ส่วนการอัปโหลดไฟล์และการส่งในเธรดจะเปิด DM ผ่าน API การสนทนาของ Slack ก่อน เพราะเส้นทางเหล่านั้นต้องใช้ ID การสนทนาที่เป็นรูปธรรม

  </Accordion>
</AccordionGroup>

## คำสั่งและพฤติกรรม slash

คำสั่ง slash ปรากฏใน Slack เป็นคำสั่งที่กำหนดค่าไว้คำสั่งเดียวหรือคำสั่ง native หลายคำสั่ง กำหนดค่า `channels.slack.slashCommand` เพื่อเปลี่ยนค่าเริ่มต้นของคำสั่ง:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

คำสั่ง native ต้องใช้ [การตั้งค่า manifest เพิ่มเติม](#additional-manifest-settings) ในแอป Slack ของคุณ และเปิดใช้ด้วย `channels.slack.commands.native: true` หรือ `commands.native: true` ในการกำหนดค่าส่วนกลางแทน

- โหมดอัตโนมัติของคำสั่ง native **ปิดอยู่** สำหรับ Slack ดังนั้น `commands.native: "auto"` จึงไม่เปิดใช้คำสั่ง native ของ Slack

```txt
/help
```

เมนูอาร์กิวเมนต์ native ใช้กลยุทธ์การเรนเดอร์แบบปรับตามบริบท ซึ่งแสดงโมดัลยืนยันก่อน dispatch ค่าตัวเลือกที่เลือก:

- สูงสุด 5 ตัวเลือก: บล็อกปุ่ม
- 6-100 ตัวเลือก: เมนู static select
- มากกว่า 100 ตัวเลือก: external select พร้อมการกรองตัวเลือกแบบ async เมื่อมีตัวจัดการตัวเลือก interactivity
- เกินขีดจำกัดของ Slack: ค่าตัวเลือกที่เข้ารหัสจะถอยกลับไปใช้ปุ่ม

```txt
/think
```

เซสชัน slash ใช้คีย์แยกกัน เช่น `agent:<agentId>:slack:slash:<userId>` และยังคงกำหนดเส้นทางการดำเนินคำสั่งไปยังเซสชันการสนทนาเป้าหมายโดยใช้ `CommandTargetSessionKey`

## การตอบกลับแบบอินเทอร์แอคทีฟ

Slack สามารถเรนเดอร์ตัวควบคุมการตอบกลับแบบอินเทอร์แอคทีฟที่เอเจนต์เขียนได้ แต่ฟีเจอร์นี้ถูกปิดไว้โดยค่าเริ่มต้น

เปิดใช้แบบทั่วทั้งระบบ:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

หรือเปิดใช้เฉพาะบัญชี Slack บัญชีเดียว:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

เมื่อเปิดใช้ เอเจนต์สามารถปล่อย directive การตอบกลับเฉพาะ Slack ได้:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Directive เหล่านี้คอมไพล์เป็น Slack Block Kit และกำหนดเส้นทางการคลิกหรือการเลือกกลับผ่านเส้นทางเหตุการณ์การโต้ตอบ Slack ที่มีอยู่

หมายเหตุ:

- นี่คือ UI เฉพาะ Slack ช่องทางอื่นจะไม่แปล directive ของ Slack Block Kit เป็นระบบปุ่มของตนเอง
- ค่าคอลแบ็กแบบอินเทอร์แอคทีฟเป็นโทเค็นทึบที่ OpenClaw สร้างขึ้น ไม่ใช่ค่าดิบที่เอเจนต์เขียน
- หากบล็อกอินเทอร์แอคทีฟที่สร้างขึ้นจะเกินขีดจำกัด Slack Block Kit OpenClaw จะถอยกลับไปใช้ข้อความตอบกลับเดิมแทนการส่ง payload บล็อกที่ไม่ถูกต้อง

## การอนุมัติ Exec ใน Slack

Slack สามารถทำหน้าที่เป็นไคลเอนต์อนุมัติ native ที่มีปุ่มและการโต้ตอบแบบอินเทอร์แอคทีฟ แทนการถอยกลับไปใช้ Web UI หรือเทอร์มินัล

- การอนุมัติ Exec ใช้ `channels.slack.execApprovals.*` สำหรับการกำหนดเส้นทาง DM/ช่องทางแบบ native
- การอนุมัติ Plugin ยังสามารถแก้ไขผ่านพื้นผิวปุ่ม Slack-native เดียวกันได้ เมื่อคำขอมาถึง Slack อยู่แล้วและชนิด approval id เป็น `plugin:`
- การให้สิทธิ์ผู้อนุมัติยังคงถูกบังคับใช้: เฉพาะผู้ใช้ที่ระบุว่าเป็นผู้อนุมัติเท่านั้นที่สามารถอนุมัติหรือปฏิเสธคำขอผ่าน Slack ได้

สิ่งนี้ใช้พื้นผิวปุ่มอนุมัติแบบใช้ร่วมกันเดียวกับช่องทางอื่น เมื่อเปิดใช้ `interactivity` ในการตั้งค่าแอป Slack ของคุณ พรอมป์อนุมัติจะเรนเดอร์เป็นปุ่ม Block Kit โดยตรงในการสนทนา
เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก OpenClaw
ควรรวมคำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของเครื่องมือบอกว่าการอนุมัติผ่านแชต
ไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียวเท่านั้น

เส้นทางการกำหนดค่า:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; ถอยกลับไปใช้ `commands.ownerAllowFrom` เมื่อเป็นไปได้)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack จะเปิดใช้การอนุมัติ exec แบบ native โดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และแก้ไขผู้อนุมัติได้อย่างน้อยหนึ่งราย
ตั้งค่า `enabled: false` เพื่อปิดใช้ Slack เป็นไคลเอนต์อนุมัติ native อย่างชัดเจน
ตั้งค่า `enabled: true` เพื่อบังคับเปิดการอนุมัติ native เมื่อแก้ไขผู้อนุมัติได้

พฤติกรรมเริ่มต้นเมื่อไม่มีการกำหนดค่าการอนุมัติ exec ของ Slack อย่างชัดเจน:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

การกำหนดค่า Slack-native แบบชัดเจนจำเป็นเฉพาะเมื่อคุณต้องการแทนที่ผู้อนุมัติ เพิ่มตัวกรอง หรือ
เลือกใช้การส่งมอบไปยังแชตต้นทาง:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

การส่งต่อ `approvals.exec` แบบใช้ร่วมกันแยกต่างหาก ใช้เฉพาะเมื่อพรอมป์อนุมัติ exec ต้อง
กำหนดเส้นทางไปยังแชตอื่นหรือเป้าหมายนอกแบนด์ที่ระบุชัดเจนด้วย การส่งต่อ `approvals.plugin` แบบใช้ร่วมกันก็
แยกต่างหากเช่นกัน ปุ่ม Slack-native ยังสามารถแก้ไขการอนุมัติ Plugin ได้เมื่อคำขอเหล่านั้นมาถึง
Slack อยู่แล้ว

`/approve` ในแชตเดียวกันยังใช้ได้ในช่องทาง Slack และ DM ที่รองรับคำสั่งอยู่แล้ว ดู [การอนุมัติ Exec](/th/tools/exec-approvals) สำหรับโมเดลการส่งต่อการอนุมัติฉบับเต็ม

## เหตุการณ์และพฤติกรรมการปฏิบัติการ

- การแก้ไข/ลบข้อความถูกแมปเป็นเหตุการณ์ระบบ
- การ broadcast เธรด (การตอบกลับในเธรดแบบ "ส่งไปยังช่องทางด้วย") ถูกประมวลผลเป็นข้อความผู้ใช้ปกติ
- เหตุการณ์เพิ่ม/ลบรีแอคชันถูกแมปเป็นเหตุการณ์ระบบ
- เหตุการณ์สมาชิกเข้าร่วม/ออก ช่องทางถูกสร้าง/เปลี่ยนชื่อ และการเพิ่ม/ลบ pin ถูกแมปเป็นเหตุการณ์ระบบ
- `channel_id_changed` สามารถย้ายคีย์การกำหนดค่าช่องทางเมื่อเปิดใช้ `configWrites`
- เมตาดาต้า topic/purpose ของช่องทางถือเป็นบริบทที่ไม่น่าเชื่อถือและสามารถถูกฉีดเข้าไปในบริบทการกำหนดเส้นทางได้
- การ seed บริบทของผู้เริ่มเธรดและประวัติเธรดเริ่มต้นจะถูกกรองตาม allowlist ผู้ส่งที่กำหนดค่าไว้เมื่อเกี่ยวข้อง
- Block actions และการโต้ตอบ modal ปล่อยเหตุการณ์ระบบ `Slack interaction: ...` แบบมีโครงสร้าง พร้อมฟิลด์ payload ที่สมบูรณ์:
  - block actions: ค่าที่เลือก, labels, ค่า picker และเมตาดาต้า `workflow_*`
  - เหตุการณ์ modal `view_submission` และ `view_closed` พร้อมเมตาดาต้าช่องทางที่กำหนดเส้นทางและอินพุตฟอร์ม

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Slack](/th/gateway/config-channels#slack)

<Accordion title="ฟิลด์ Slack ที่มีสัญญาณสูง">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- สวิตช์ความเข้ากันได้: `dangerouslyAllowNameMatching` (break-glass; ปิดไว้เว้นแต่จำเป็น)
- การเข้าถึงช่องทาง: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- เธรด/ประวัติ: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- ops/ฟีเจอร์: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในช่องทาง">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - allowlist ของช่องทาง (`channels.slack.channels`) — **คีย์ต้องเป็น ID ช่องทาง** (`C12345678`) ไม่ใช่ชื่อ (`#channel-name`) คีย์แบบอิงชื่อจะล้มเหลวแบบเงียบภายใต้ `groupPolicy: "allowlist"` เพราะการกำหนดเส้นทางช่องทางใช้ ID เป็นหลักโดยค่าเริ่มต้น วิธีหา ID: คลิกขวาที่ช่องทางใน Slack → **Copy link** — ค่า `C...` ที่ท้าย URL คือ ID ช่องทาง
    - `requireMention`
    - allowlist `users` รายช่องทาง

    คำสั่งที่มีประโยชน์:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="ข้อความ DM ถูกละเว้น">
    ตรวจสอบ:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (หรือ legacy `channels.slack.dm.policy`)
    - การอนุมัติการจับคู่ / รายการ allowlist
    - เหตุการณ์ DM ของ Slack Assistant: บันทึก verbose ที่กล่าวถึง `drop message_changed`
      มักหมายความว่า Slack ส่งเหตุการณ์เธรด Assistant ที่ถูกแก้ไขโดยไม่มี
      ผู้ส่งที่เป็นมนุษย์ซึ่งกู้คืนได้ในเมตาดาต้าข้อความ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode ไม่เชื่อมต่อ">
    ตรวจสอบ bot + app tokens และการเปิดใช้ Socket Mode ในการตั้งค่าแอป Slack

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` แสดงว่าบัญชี Slack
    ถูกกำหนดค่าไว้ แต่ runtime ปัจจุบันไม่สามารถแก้ไขค่า
    ที่รองรับด้วย SecretRef ได้

  </Accordion>

  <Accordion title="HTTP mode ไม่ได้รับเหตุการณ์">
    ตรวจสอบ:

    - signing secret
    - webhook path
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - `webhookPath` ที่ไม่ซ้ำกันต่อบัญชี HTTP

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏใน snapshot
    ของบัญชี แสดงว่าบัญชี HTTP ถูกกำหนดค่าไว้ แต่ runtime ปัจจุบันไม่สามารถ
    แก้ไข signing secret ที่รองรับด้วย SecretRef ได้

  </Accordion>

  <Accordion title="คำสั่ง native/slash ไม่ทำงาน">
    ตรวจสอบว่าคุณตั้งใจใช้แบบใด:

    - โหมดคำสั่ง native (`channels.slack.commands.native: true`) พร้อมคำสั่ง slash ที่ตรงกันซึ่งลงทะเบียนใน Slack
    - หรือโหมดคำสั่ง slash เดียว (`channels.slack.slashCommand.enabled: true`)

    ตรวจสอบ `commands.useAccessGroups` และ allowlist ของช่องทาง/ผู้ใช้ด้วย

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิง vision ของไฟล์แนบ

Slack สามารถแนบสื่อที่ดาวน์โหลดแล้วเข้ากับรอบของเอเจนต์ได้เมื่อการดาวน์โหลดไฟล์ Slack สำเร็จและข้อจำกัดขนาดอนุญาต ไฟล์ภาพสามารถส่งผ่านเส้นทางการทำความเข้าใจสื่อหรือส่งตรงไปยังโมเดลตอบกลับที่รองรับ vision ได้ ส่วนไฟล์อื่นจะถูกเก็บไว้เป็นบริบทไฟล์ที่ดาวน์โหลดได้ แทนที่จะถูกปฏิบัติเป็นอินพุตรูปภาพ

### ประเภทสื่อที่รองรับ

| ประเภทสื่อ                     | แหล่งที่มา               | ลักษณะการทำงานปัจจุบัน                                                                  | หมายเหตุ                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| รูปภาพ JPEG / PNG / GIF / WebP | URL ไฟล์ Slack       | ดาวน์โหลดและแนบเข้ากับเทิร์นเพื่อการจัดการที่รองรับการมองเห็น                   | ขีดจำกัดต่อไฟล์: `channels.slack.mediaMaxMb` (ค่าเริ่มต้น 20 MB)                 |
| ไฟล์ PDF                      | URL ไฟล์ Slack       | ดาวน์โหลดและแสดงเป็นบริบทไฟล์สำหรับเครื่องมือ เช่น `download-file` หรือ `pdf` | ขาเข้าของ Slack ไม่แปลง PDF เป็นอินพุตการมองเห็นภาพโดยอัตโนมัติ |
| ไฟล์อื่น                    | URL ไฟล์ Slack       | ดาวน์โหลดเมื่อเป็นไปได้และแสดงเป็นบริบทไฟล์                              | ไฟล์ไบนารีจะไม่ถูกปฏิบัติเป็นอินพุตรูปภาพ                               |
| การตอบกลับในเธรด                 | ไฟล์ของข้อความเริ่มเธรด | ไฟล์ของข้อความรากสามารถถูกเติมเป็นบริบทได้เมื่อการตอบกลับไม่มีสื่อโดยตรง  | ข้อความเริ่มต้นที่มีเฉพาะไฟล์ใช้ตัวยึดตำแหน่งไฟล์แนบ                          |
| ข้อความหลายรูปภาพ           | ไฟล์ Slack หลายไฟล์ | แต่ละไฟล์จะถูกประเมินแยกกัน                                              | การประมวลผล Slack จำกัดไว้ที่แปดไฟล์ต่อข้อความ                     |

### ไปป์ไลน์ขาเข้า

เมื่อข้อความ Slack ที่มีไฟล์แนบมาถึง:

1. OpenClaw ดาวน์โหลดไฟล์จาก URL ส่วนตัวของ Slack โดยใช้โทเค็นบอต (`xoxb-...`)
2. ไฟล์จะถูกเขียนลงในที่จัดเก็บสื่อเมื่อสำเร็จ
3. เส้นทางสื่อที่ดาวน์โหลดแล้วและชนิดเนื้อหาจะถูกเพิ่มลงในบริบทขาเข้า
4. เส้นทางโมเดล/เครื่องมือที่รองรับรูปภาพสามารถใช้ไฟล์แนบรูปภาพจากบริบทนั้นได้
5. ไฟล์ที่ไม่ใช่รูปภาพยังคงพร้อมใช้งานเป็นเมตาดาต้าไฟล์หรือข้อมูลอ้างอิงสื่อสำหรับเครื่องมือที่จัดการได้

### การสืบทอดไฟล์แนบจากรากของเธรด

เมื่อข้อความมาถึงในเธรด (มีพาเรนต์ `thread_ts`):

- หากการตอบกลับเองไม่มีสื่อโดยตรง และข้อความรากที่รวมมามีไฟล์ Slack สามารถเติมไฟล์รากเป็นบริบทเริ่มต้นของเธรดได้
- ไฟล์แนบของการตอบกลับโดยตรงมีลำดับความสำคัญเหนือไฟล์แนบของข้อความราก
- ข้อความรากที่มีเฉพาะไฟล์และไม่มีข้อความจะแสดงด้วยตัวยึดตำแหน่งไฟล์แนบ เพื่อให้ตัวสำรองยังคงรวมไฟล์ของข้อความนั้นได้

### การจัดการไฟล์แนบหลายรายการ

เมื่อข้อความ Slack เดียวมีไฟล์แนบหลายรายการ:

- ไฟล์แนบแต่ละรายการจะถูกประมวลผลแยกกันผ่านไปป์ไลน์สื่อ
- ข้อมูลอ้างอิงสื่อที่ดาวน์โหลดแล้วจะถูกรวบรวมลงในบริบทข้อความ
- ลำดับการประมวลผลเป็นไปตามลำดับไฟล์ของ Slack ในเพย์โหลดเหตุการณ์
- ความล้มเหลวในการดาวน์โหลดไฟล์แนบหนึ่งรายการไม่บล็อกรายการอื่น

### ขนาด การดาวน์โหลด และขีดจำกัดของโมเดล

- **ขีดจำกัดขนาด**: ค่าเริ่มต้น 20 MB ต่อไฟล์ กำหนดค่าได้ผ่าน `channels.slack.mediaMaxMb`
- **ความล้มเหลวในการดาวน์โหลด**: ไฟล์ที่ Slack ให้บริการไม่ได้, URL หมดอายุ, ไฟล์ที่เข้าถึงไม่ได้, ไฟล์เกินขนาด และการตอบกลับ HTML สำหรับการยืนยันตัวตน/เข้าสู่ระบบ Slack จะถูกข้ามแทนที่จะถูกรายงานว่าเป็นรูปแบบที่ไม่รองรับ
- **โมเดลการมองเห็น**: การวิเคราะห์รูปภาพใช้โมเดลตอบกลับที่ใช้งานอยู่เมื่อโมเดลนั้นรองรับการมองเห็น หรือใช้โมเดลรูปภาพที่กำหนดค่าไว้ที่ `agents.defaults.imageModel`

### ขีดจำกัดที่ทราบ

| สถานการณ์                               | ลักษณะการทำงานปัจจุบัน                                                             | วิธีแก้ไข                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL ไฟล์ Slack หมดอายุ                 | ข้ามไฟล์; ไม่แสดงข้อผิดพลาด                                                 | อัปโหลดไฟล์ใน Slack อีกครั้ง                                                |
| ยังไม่ได้กำหนดค่าโมเดลการมองเห็น            | ไฟล์แนบรูปภาพจะถูกจัดเก็บเป็นข้อมูลอ้างอิงสื่อ แต่ไม่ได้วิเคราะห์เป็นรูปภาพ | กำหนดค่า `agents.defaults.imageModel` หรือใช้โมเดลตอบกลับที่รองรับการมองเห็น |
| รูปภาพขนาดใหญ่มาก (> 20 MB โดยค่าเริ่มต้น) | ข้ามตามขีดจำกัดขนาด                                                         | เพิ่ม `channels.slack.mediaMaxMb` หาก Slack อนุญาต                       |
| ไฟล์แนบที่ส่งต่อ/แชร์           | ข้อความและสื่อรูปภาพ/ไฟล์ที่โฮสต์บน Slack เป็นแบบพยายามให้ดีที่สุด                       | แชร์ใหม่โดยตรงในเธรด OpenClaw                                   |
| ไฟล์แนบ PDF                        | จัดเก็บเป็นบริบทไฟล์/สื่อ ไม่ได้ส่งผ่านการมองเห็นรูปภาพโดยอัตโนมัติ  | ใช้ `download-file` สำหรับเมตาดาต้าไฟล์ หรือเครื่องมือ `pdf` สำหรับการวิเคราะห์ PDF   |

### เอกสารที่เกี่ยวข้อง

- [ไปป์ไลน์การเข้าใจสื่อ](/th/nodes/media-understanding)
- [เครื่องมือ PDF](/th/tools/pdf)
- มหากาพย์: [#51349](https://github.com/openclaw/openclaw/issues/51349) — การเปิดใช้การมองเห็นไฟล์แนบ Slack
- การทดสอบรีเกรสชัน: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- การตรวจสอบแบบสด: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Slack กับ Gateway
  </Card>
  <Card title="Groups" icon="users" href="/th/channels/groups">
    พฤติกรรมของช่องและ DM กลุ่ม
  </Card>
  <Card title="Channel routing" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="Security" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเสริมความแข็งแกร่ง
  </Card>
  <Card title="Configuration" icon="sliders" href="/th/gateway/configuration">
    โครงร่างการกำหนดค่าและลำดับความสำคัญ
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    แคตตาล็อกคำสั่งและพฤติกรรม
  </Card>
</CardGroup>
