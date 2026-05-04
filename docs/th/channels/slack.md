---
read_when:
    - การตั้งค่า Slack หรือการดีบักโหมดซ็อกเก็ต/HTTP ของ Slack
summary: การตั้งค่า Slack และพฤติกรรมระหว่างการทำงาน (โหมดซ็อกเก็ต + URL คำขอ HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-04T02:22:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2be45f03511a64373b1f4316c59800eeeef8baccb4c00454b49999258b2e546b
    source_path: channels/slack.md
    workflow: 16
---

พร้อมใช้งานระดับโปรดักชันสำหรับ DM และช่องผ่านการผสานรวมแอป Slack โหมดเริ่มต้นคือ Socket Mode และรองรับ HTTP Request URLs ด้วย

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    Slack DM ใช้โหมดจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแคตตาล็อกคำสั่ง
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องและคู่มือการซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าแบบรวดเร็ว

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        ในการตั้งค่าแอป Slack ให้กดปุ่ม **[Create New App](https://api.slack.com/apps/new)**:

        - เลือก **from a manifest** และเลือกเวิร์กสเปซสำหรับแอปของคุณ
        - วาง [แมนิเฟสต์ตัวอย่าง](#manifest-and-scope-checklist) ด้านล่าง แล้วดำเนินการต่อเพื่อสร้าง
        - สร้าง **App-Level Token** (`xapp-...`) ที่มี `connections:write`
        - ติดตั้งแอปและคัดลอก **Bot Token** (`xoxb-...`) ที่แสดง

      </Step>

      <Step title="Configure OpenClaw">

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

        ทางเลือกสำรอง Env (เฉพาะบัญชีเริ่มต้น):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        ในการตั้งค่าแอป Slack ให้กดปุ่ม **[Create New App](https://api.slack.com/apps/new)**:

        - เลือก **from a manifest** และเลือกเวิร์กสเปซสำหรับแอปของคุณ
        - วาง [แมนิเฟสต์ตัวอย่าง](#manifest-and-scope-checklist) และอัปเดต URL ก่อนสร้าง
        - บันทึก **Signing Secret** สำหรับการตรวจสอบคำขอ
        - ติดตั้งแอปและคัดลอก **Bot Token** (`xoxb-...`) ที่แสดง

      </Step>

      <Step title="Configure OpenClaw">

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
        ใช้เส้นทาง Webhook ที่ไม่ซ้ำกันสำหรับ HTTP แบบหลายบัญชี

        กำหนด `webhookPath` แยกกันให้แต่ละบัญชี (ค่าเริ่มต้น `/slack/events`) เพื่อไม่ให้การลงทะเบียนชนกัน
        </Note>

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## การปรับแต่งการส่งผ่าน Socket Mode

OpenClaw ตั้งค่าระยะหมดเวลารอ pong ของไคลเอนต์ Slack SDK เป็น 15 วินาทีโดยค่าเริ่มต้นสำหรับ Socket Mode ให้แทนที่การตั้งค่าการส่งผ่านเฉพาะเมื่อคุณต้องปรับแต่งตามเวิร์กสเปซหรือโฮสต์เท่านั้น:

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

ใช้ตัวเลือกนี้เฉพาะกับเวิร์กสเปซ Socket Mode ที่บันทึก timeout ของ Slack websocket pong/server-ping หรือทำงานบนโฮสต์ที่ทราบว่ามีภาวะ event-loop starvation `clientPingTimeout` คือเวลารอ pong หลังจาก SDK ส่ง client ping; `serverPingTimeout` คือเวลารอ ping จากเซิร์ฟเวอร์ Slack ข้อความและอีเวนต์ของแอปยังคงเป็นสถานะแอปพลิเคชัน ไม่ใช่สัญญาณความพร้อมใช้งานของการส่งผ่าน

## รายการตรวจสอบแมนิเฟสต์และขอบเขต

แมนิเฟสต์แอป Slack พื้นฐานเหมือนกันสำหรับ Socket Mode และ HTTP Request URLs มีเพียงบล็อก `settings` (และ `url` ของ slash command) ที่แตกต่างกัน

แมนิเฟสต์พื้นฐาน (ค่าเริ่มต้น Socket Mode):

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

สำหรับ **โหมด HTTP Request URLs** ให้แทนที่ `settings` ด้วยตัวแปร HTTP และเพิ่ม `url` ให้แต่ละ slash command ต้องมี URL สาธารณะ:

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

### การตั้งค่าแมนิเฟสต์เพิ่มเติม

แสดงฟีเจอร์ต่าง ๆ ที่ขยายค่าเริ่มต้นด้านบน

แมนิเฟสต์เริ่มต้นเปิดใช้แท็บ **Home** ของ Slack App Home และสมัครรับ `app_home_opened` เมื่อสมาชิกเวิร์กสเปซเปิดแท็บ Home, OpenClaw จะเผยแพร่มุมมอง Home เริ่มต้นที่ปลอดภัยด้วย `views.publish`; ไม่มีเพย์โหลดการสนทนาหรือการกำหนดค่าส่วนตัวรวมอยู่ แท็บ **Messages** ยังคงเปิดใช้งานสำหรับ Slack DM

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    สามารถใช้ [slash command แบบเนทีฟ](#commands-and-slash-behavior) หลายรายการแทนคำสั่งที่กำหนดค่าไว้รายการเดียวได้ โดยมีรายละเอียดดังนี้:

    - ใช้ `/agentstatus` แทน `/status` เพราะคำสั่ง `/status` ถูกสงวนไว้
    - ทำให้มี slash command ใช้งานได้พร้อมกันไม่เกิน 25 รายการ

    แทนที่ส่วน `features.slash_commands` เดิมของคุณด้วยชุดย่อยของ [คำสั่งที่มีให้ใช้](/th/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

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
        ใช้รายการ `slash_commands` เดียวกับ Socket Mode ด้านบน และเพิ่ม `"url": "https://gateway-host.example.com/slack/events"` ให้ทุกรายการ ตัวอย่าง:

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
  <Accordion title="Optional authorship scopes (write operations)">
    เพิ่มขอบเขตบอท `chat:write.customize` หากคุณต้องการให้ข้อความขาออกใช้ตัวตนของเอเจนต์ที่ใช้งานอยู่ (ชื่อผู้ใช้และไอคอนแบบกำหนดเอง) แทนตัวตนเริ่มต้นของแอป Slack

    หากคุณใช้ไอคอนอีโมจิ Slack คาดหวังไวยากรณ์ `:emoji_name:`

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    หากคุณกำหนดค่า `channels.slack.userToken` ขอบเขตการอ่านทั่วไปคือ:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (หากคุณพึ่งพาการอ่านจากการค้นหาของ Slack)

  </Accordion>
</AccordionGroup>

## โมเดลโทเค็น

- ต้องมี `botToken` + `appToken` สำหรับ Socket Mode
- โหมด HTTP ต้องมี `botToken` + `signingSecret`
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับสตริงข้อความล้วน
  หรือออบเจ็กต์ SecretRef
- โทเค็นในค่ากำหนดจะแทนที่ env fallback
- env fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
- `userToken` (`xoxp-...`) กำหนดค่าได้ผ่าน config เท่านั้น (ไม่มี env fallback) และค่าเริ่มต้นเป็นพฤติกรรมแบบอ่านอย่างเดียว (`userTokenReadOnly: true`)

พฤติกรรมสแนปช็อตสถานะ:

- การตรวจสอบบัญชี Slack ติดตามฟิลด์ `*Source` และ `*Status`
  ต่อข้อมูลรับรอง (`botToken`, `appToken`, `signingSecret`, `userToken`)
- สถานะคือ `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าผ่าน SecretRef
  หรือแหล่งข้อมูลลับแบบไม่ฝังในบรรทัดแบบอื่น แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบัน
  ไม่สามารถ resolve ค่าจริงได้
- ในโหมด HTTP จะรวม `signingSecretStatus`; ใน Socket Mode
  คู่ที่จำเป็นคือ `botTokenStatus` + `appTokenStatus`

<Tip>
สำหรับ actions/การอ่าน directory สามารถเลือกใช้โทเค็นผู้ใช้ก่อนเมื่อกำหนดค่าไว้ สำหรับการเขียน โทเค็นบอทยังคงเป็นตัวเลือกหลัก; การเขียนด้วยโทเค็นผู้ใช้จะอนุญาตเฉพาะเมื่อ `userTokenReadOnly: false` และไม่มีโทเค็นบอทให้ใช้
</Tip>

## Actions และ gates

Slack actions ถูกควบคุมโดย `channels.slack.actions.*`

กลุ่ม action ที่มีในเครื่องมือ Slack ปัจจุบัน:

| กลุ่ม      | ค่าเริ่มต้น |
| ---------- | ------- |
| messages   | เปิดใช้งาน |
| reactions  | เปิดใช้งาน |
| pins       | เปิดใช้งาน |
| memberInfo | เปิดใช้งาน |
| emojiList  | เปิดใช้งาน |

action ข้อความ Slack ปัจจุบันประกอบด้วย `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list` `download-file` รับ ID ไฟล์ Slack ที่แสดงใน placeholder ไฟล์ขาเข้า และส่งคืนตัวอย่างภาพสำหรับรูปภาพหรือ metadata ของไฟล์ภายในเครื่องสำหรับไฟล์ชนิดอื่น

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM `channels.slack.allowFrom` คือ allowlist ของ DM ตามมาตรฐาน

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.slack.allowFrom` รวม `"*"`)
    - `disabled`

    แฟล็ก DM:

    - `dm.enabled` (ค่าเริ่มต้น true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (เดิม)
    - `dm.groupEnabled` (DM กลุ่มมีค่าเริ่มต้นเป็น false)
    - `dm.groupChannels` (allowlist MPIM แบบไม่บังคับ)

    ลำดับความสำคัญแบบหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่มีชื่อจะสืบทอด `channels.slack.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตัวเอง
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.slack.accounts.default.allowFrom`

    `channels.slack.dm.policy` และ `channels.slack.dm.allowFrom` แบบเดิมยังอ่านได้เพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปเป็น `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    การจับคู่ใน DM ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` ควบคุมการจัดการช่อง:

    - `open`
    - `allowlist`
    - `disabled`

    allowlist ของช่องอยู่ใต้ `channels.slack.channels` และ **ต้องใช้ ID ช่อง Slack ที่เสถียร** (เช่น `C12345678`) เป็นคีย์ config

    หมายเหตุรันไทม์: หากไม่มี `channels.slack` เลย (การตั้งค่าแบบ env เท่านั้น) รันไทม์จะ fallback ไปที่ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้ว่าจะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

    การ resolve ชื่อ/ID:

    - รายการ allowlist ของช่องและรายการ allowlist ของ DM จะถูก resolve ตอนเริ่มทำงานเมื่อการเข้าถึงโทเค็นอนุญาต
    - รายการชื่อช่องที่ resolve ไม่ได้จะถูกเก็บไว้ตามที่กำหนดค่า แต่จะถูกละเว้นสำหรับการกำหนดเส้นทางโดยค่าเริ่มต้น
    - การอนุญาตขาเข้าและการกำหนดเส้นทางช่องจะใช้ ID ก่อนโดยค่าเริ่มต้น; การจับคู่ชื่อผู้ใช้/slug โดยตรงต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    คีย์ตามชื่อ (`#channel-name` หรือ `channel-name`) **จะไม่** ตรงกันภายใต้ `groupPolicy: "allowlist"` การค้นหาช่องใช้ ID ก่อนโดยค่าเริ่มต้น ดังนั้นคีย์ตามชื่อจะไม่สามารถกำหนดเส้นทางสำเร็จได้เลย และข้อความทั้งหมดในช่องนั้นจะถูกบล็อกอย่างเงียบ ๆ ซึ่งต่างจาก `groupPolicy: "open"` ที่ไม่ต้องใช้คีย์ช่องสำหรับการกำหนดเส้นทาง และคีย์ตามชื่อดูเหมือนจะใช้งานได้

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
    ข้อความในช่องถูกกั้นด้วยการกล่าวถึงโดยค่าเริ่มต้น

    แหล่งที่มาของการกล่าวถึง:

    - การกล่าวถึงแอปอย่างชัดเจน (`<@botId>`)
    - การกล่าวถึงกลุ่มผู้ใช้ Slack (`<!subteam^S...>`) เมื่อผู้ใช้บอทเป็นสมาชิกของกลุ่มผู้ใช้นั้น; ต้องมี `usergroups:read`
    - รูปแบบ regex สำหรับการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรม thread แบบตอบกลับถึงบอทโดยนัย (ปิดใช้งานเมื่อ `thread.requireExplicitMention` เป็น `true`)

    การควบคุมรายช่อง (`channels.slack.channels.<id>`; ชื่อใช้ได้เฉพาะผ่านการ resolve ตอนเริ่มทำงานหรือ `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ `toolsBySender`: `id:`, `e164:`, `username:`, `name:` หรือ wildcard `"*"`
      (คีย์เดิมที่ไม่มี prefix ยัง map ไปที่ `id:` เท่านั้น)

    `allowBots` เป็นแบบระมัดระวังสำหรับช่องและช่องส่วนตัว: ข้อความในห้องที่เขียนโดยบอทจะถูกรับเฉพาะเมื่อบอทผู้ส่งอยู่ใน allowlist `users` ของห้องนั้นอย่างชัดเจน หรือเมื่อมี ID เจ้าของ Slack ที่ชัดเจนอย่างน้อยหนึ่งรายการจาก `channels.slack.allowFrom` เป็นสมาชิกห้องอยู่ในปัจจุบัน wildcard และรายการเจ้าของแบบชื่อที่แสดงไม่ถือว่าตอบสนองเงื่อนไขการมีอยู่ของเจ้าของ การมีอยู่ของเจ้าของใช้ Slack `conversations.members`; ตรวจสอบให้แน่ใจว่าแอปมีขอบเขตการอ่านที่ตรงกับชนิดห้อง (`channels:read` สำหรับช่องสาธารณะ, `groups:read` สำหรับช่องส่วนตัว) หากการค้นหาสมาชิกล้มเหลว OpenClaw จะทิ้งข้อความในห้องที่เขียนโดยบอท

  </Tab>
</Tabs>

## Threading, sessions และแท็กตอบกลับ

- DM กำหนดเส้นทางเป็น `direct`; ช่องเป็น `channel`; MPIM เป็น `group`
- การผูกเส้นทาง Slack รับ ID peer แบบดิบ รวมถึงรูปแบบเป้าหมาย Slack เช่น `channel:C12345678`, `user:U12345678` และ `<@U12345678>`
- ด้วยค่าเริ่มต้น `session.dmScope=main` DM ของ Slack จะถูกรวมไปที่ session หลักของเอเจนต์
- session ช่อง: `agent:<agentId>:slack:channel:<channelId>`
- การตอบกลับใน thread สามารถสร้าง suffix ของ session thread (`:thread:<threadTs>`) ได้เมื่อเกี่ยวข้อง
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความ thread ที่มีอยู่ซึ่งจะถูกดึงเมื่อ session thread ใหม่เริ่มต้น (ค่าเริ่มต้น `20`; ตั้ง `0` เพื่อปิดใช้งาน)
- `channels.slack.thread.requireExplicitMention` (ค่าเริ่มต้น `false`): เมื่อเป็น `true` จะระงับการกล่าวถึง thread โดยนัย เพื่อให้บอทตอบกลับเฉพาะการกล่าวถึง `@bot` อย่างชัดเจนภายใน thread แม้ว่าบอทจะเคยเข้าร่วมใน thread แล้วก็ตาม หากไม่มีค่านี้ การตอบกลับใน thread ที่บอทเคยเข้าร่วมจะข้าม gating ของ `requireMention`

การควบคุม reply threading:

- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: ต่อ `direct|group|channel`
- fallback เดิมสำหรับแชทโดยตรง: `channels.slack.dm.replyToMode`

รองรับแท็กตอบกลับแบบแมนนวล:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` ปิดใช้งาน reply threading **ทั้งหมด** ใน Slack รวมถึงแท็ก `[[reply_to_*]]` ที่ระบุอย่างชัดเจน ซึ่งต่างจาก Telegram ที่แท็กชัดเจนยังคงทำงานในโหมด `"off"` thread ของ Slack ซ่อนข้อความจากช่อง ขณะที่การตอบกลับของ Telegram ยังคงมองเห็นแบบ inline
</Note>

## รีแอ็กชันตอบรับ

`ackReaction` ส่งอีโมจิยืนยันขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

ลำดับการ resolve:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback อีโมจิตัวตนของเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้น "👀")

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"eyes"`)
- ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับบัญชี Slack หรือทั้งระบบ

## การสตรีมข้อความ

`channels.slack.streaming` ควบคุมพฤติกรรมตัวอย่างสด:

- `off`: ปิดใช้งานการสตรีมตัวอย่างสด
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความตัวอย่างด้วยผลลัพธ์บางส่วนล่าสุด
- `block`: ต่อท้ายการอัปเดตตัวอย่างแบบแบ่ง chunk
- `progress`: แสดงข้อความสถานะความคืบหน้าขณะสร้าง จากนั้นส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อตัวอย่างฉบับร่างทำงานอยู่ ให้กำหนดเส้นทางการอัปเดตเครื่องมือ/ความคืบหน้าเข้าไปในข้อความตัวอย่างที่แก้ไขข้อความเดียวกัน (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อคงข้อความเครื่องมือ/ความคืบหน้าแยกกัน

`channels.slack.streaming.nativeTransport` ควบคุมการสตรีมข้อความ native ของ Slack เมื่อ `channels.slack.streaming.mode` เป็น `partial` (ค่าเริ่มต้น: `true`)

- ต้องมี thread ตอบกลับเพื่อให้การสตรีมข้อความ native และสถานะ thread assistant ของ Slack ปรากฏ การเลือก thread ยังคงทำตาม `replyToMode`
- ช่อง, แชทกลุ่ม และราก DM ระดับบนสุดยังสามารถใช้ตัวอย่างฉบับร่างปกติได้เมื่อ native streaming ไม่พร้อมใช้งานหรือไม่มี thread ตอบกลับ
- DM ของ Slack ระดับบนสุดจะอยู่นอก thread โดยค่าเริ่มต้น ดังนั้นจึงไม่แสดงตัวอย่าง native stream/status แบบ thread-style ของ Slack; OpenClaw จะโพสต์และแก้ไขตัวอย่างฉบับร่างใน DM แทน
- payload สื่อและที่ไม่ใช่ข้อความจะ fallback ไปยังการส่งมอบปกติ
- ผลสุดท้ายของสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่; ผลสุดท้ายแบบข้อความ/บล็อกที่เข้าเกณฑ์จะ flush เฉพาะเมื่อสามารถแก้ไขตัวอย่างในตำแหน่งเดิมได้
- หากการสตรีมล้มเหลวระหว่างตอบกลับ OpenClaw จะ fallback ไปยังการส่งมอบปกติสำหรับ payload ที่เหลือ

ใช้ตัวอย่างฉบับร่างแทนการสตรีมข้อความ native ของ Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) ถูกย้ายอัตโนมัติไปเป็น `channels.slack.streaming.mode`
- boolean `channels.slack.streaming` ถูกย้ายอัตโนมัติไปเป็น `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport`
- `channels.slack.nativeStreaming` เดิมถูกย้ายอัตโนมัติไปเป็น `channels.slack.streaming.nativeTransport`

## fallback ของรีแอ็กชันการพิมพ์

`typingReaction` เพิ่มรีแอ็กชันชั่วคราวให้กับข้อความ Slack ขาเข้าขณะที่ OpenClaw กำลังประมวลผลการตอบกลับ จากนั้นลบออกเมื่อการรันเสร็จสิ้น สิ่งนี้มีประโยชน์มากที่สุดภายนอกการตอบกลับใน thread ซึ่งใช้ตัวบ่งชี้สถานะเริ่มต้น "is typing..."

ลำดับการ resolve:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"hourglass_flowing_sand"`)
- reaction เป็นแบบ best-effort และจะพยายามล้างข้อมูลอัตโนมัติหลังจากเส้นทางการตอบกลับหรือความล้มเหลวเสร็จสิ้น

## สื่อ, การแบ่งชิ้นส่วน, และการส่งมอบ

<AccordionGroup>
  <Accordion title="Inbound attachments">
    ไฟล์แนบของ Slack จะถูกดาวน์โหลดจาก URL ส่วนตัวที่โฮสต์โดย Slack (โฟลว์คำขอที่ยืนยันตัวตนด้วย token) และเขียนลง media store เมื่อ fetch สำเร็จและขีดจำกัดขนาดอนุญาต placeholder ของไฟล์จะมี Slack `fileId` เพื่อให้ agent สามารถ fetch ไฟล์ต้นฉบับด้วย `download-file`

    การดาวน์โหลดใช้ timeout ทั้งแบบ idle และ total ที่มีขอบเขตจำกัด หากการดึงไฟล์ Slack ค้างหรือล้มเหลว OpenClaw จะประมวลผลข้อความต่อไปและ fallback ไปยัง placeholder ของไฟล์

    ค่าเริ่มต้นของขีดจำกัดขนาด inbound ระหว่าง runtime คือ `20MB` เว้นแต่จะถูก override ด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="Outbound text and files">
    - ชิ้นส่วนข้อความใช้ `channels.slack.textChunkLimit` (ค่าเริ่มต้น 4000)
    - `channels.slack.chunkMode="newline"` เปิดใช้การแบ่งแบบย่อหน้าก่อน
    - การส่งไฟล์ใช้ Slack upload APIs และสามารถรวมการตอบกลับใน thread (`thread_ts`)
    - ขีดจำกัดสื่อ outbound จะทำตาม `channels.slack.mediaMaxMb` เมื่อกำหนดค่าไว้ มิฉะนั้นการส่งผ่าน channel จะใช้ค่าเริ่มต้นตามชนิด MIME จาก media pipeline

  </Accordion>

  <Accordion title="Delivery targets">
    เป้าหมายแบบชัดเจนที่แนะนำ:

    - `user:<id>` สำหรับ DM
    - `channel:<id>` สำหรับ channel

    Slack DM ที่เป็นข้อความ/บล็อกเท่านั้นสามารถโพสต์ไปยัง user ID ได้โดยตรง ส่วนการอัปโหลดไฟล์และการส่งแบบ thread จะเปิด DM ผ่าน Slack conversation APIs ก่อน เพราะเส้นทางเหล่านั้นต้องใช้ conversation ID ที่เป็นรูปธรรม

  </Accordion>
</AccordionGroup>

## คำสั่งและพฤติกรรม slash

คำสั่ง slash จะปรากฏใน Slack เป็นคำสั่งเดียวที่กำหนดค่าไว้ หรือเป็นหลายคำสั่ง native กำหนดค่า `channels.slack.slashCommand` เพื่อเปลี่ยนค่าเริ่มต้นของคำสั่ง:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

คำสั่ง native ต้องใช้ [การตั้งค่า manifest เพิ่มเติม](#additional-manifest-settings) ในแอป Slack ของคุณ และเปิดใช้ด้วย `channels.slack.commands.native: true` หรือ `commands.native: true` ในการกำหนดค่าระดับ global แทน

- โหมดอัตโนมัติของคำสั่ง native จะ **ปิด** สำหรับ Slack ดังนั้น `commands.native: "auto"` จะไม่เปิดใช้คำสั่ง native ของ Slack

```txt
/help
```

เมนู argument แบบ native ใช้กลยุทธ์การ render แบบ adaptive ที่แสดง modal ยืนยันก่อน dispatch ค่า option ที่เลือก:

- สูงสุด 5 options: บล็อกปุ่ม
- 6-100 options: เมนู static select
- มากกว่า 100 options: external select พร้อมการกรอง option แบบ async เมื่อมีตัวจัดการ interactivity options
- เกินขีดจำกัดของ Slack: ค่า option ที่เข้ารหัสจะ fallback ไปเป็นปุ่ม

```txt
/think
```

session แบบ slash ใช้คีย์แยก เช่น `agent:<agentId>:slack:slash:<userId>` และยังคง route การรันคำสั่งไปยัง session การสนทนาเป้าหมายโดยใช้ `CommandTargetSessionKey`

## การตอบกลับแบบ interactive

Slack สามารถ render คอนโทรลการตอบกลับแบบ interactive ที่ agent เขียนได้ แต่ฟีเจอร์นี้ถูกปิดไว้โดยค่าเริ่มต้น

เปิดใช้แบบ global:

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

หรือเปิดใช้เฉพาะบัญชี Slack หนึ่งบัญชี:

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

เมื่อเปิดใช้แล้ว agent สามารถ emit directive การตอบกลับเฉพาะ Slack ได้:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

directive เหล่านี้จะ compile เป็น Slack Block Kit และ route การคลิกหรือการเลือกกลับผ่านเส้นทาง event interaction ของ Slack ที่มีอยู่

หมายเหตุ:

- นี่คือ UI เฉพาะ Slack channel อื่นจะไม่แปล directive ของ Slack Block Kit เป็นระบบปุ่มของตนเอง
- ค่า callback แบบ interactive เป็น opaque token ที่ OpenClaw สร้างขึ้น ไม่ใช่ค่าดิบที่ agent เขียน
- หากบล็อก interactive ที่สร้างขึ้นจะเกินขีดจำกัดของ Slack Block Kit, OpenClaw จะ fallback ไปยังข้อความตอบกลับเดิมแทนการส่ง payload blocks ที่ไม่ถูกต้อง

## การอนุมัติ exec ใน Slack

Slack สามารถทำหน้าที่เป็น client การอนุมัติ native พร้อมปุ่มและ interaction แบบ interactive แทนการ fallback ไปยัง Web UI หรือ terminal

- การอนุมัติ exec ใช้ `channels.slack.execApprovals.*` สำหรับการ route DM/channel แบบ native
- การอนุมัติ Plugin ยังสามารถ resolve ผ่านพื้นผิวปุ่ม native ของ Slack เดียวกันได้ เมื่อคำขอมาถึง Slack อยู่แล้วและชนิด approval id คือ `plugin:`
- การตรวจสอบสิทธิ์ผู้อนุมัติยังคงถูกบังคับใช้: เฉพาะผู้ใช้ที่ระบุเป็น approver เท่านั้นที่สามารถ approve หรือ deny คำขอผ่าน Slack ได้

สิ่งนี้ใช้พื้นผิวปุ่มการอนุมัติร่วมแบบเดียวกับ channel อื่น เมื่อเปิดใช้ `interactivity` ในการตั้งค่าแอป Slack ของคุณ prompt การอนุมัติจะ render เป็นปุ่ม Block Kit โดยตรงในการสนทนา
เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก OpenClaw
ควรรวมคำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือบอกว่าการอนุมัติผ่าน chat
ไม่พร้อมใช้งาน หรือการอนุมัติแบบ manual เป็นเส้นทางเดียวเท่านั้น

เส้นทาง config:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; fallback ไปยัง `commands.ownerAllowFrom` เมื่อเป็นไปได้)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack จะเปิดใช้การอนุมัติ exec แบบ native โดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และ resolve
approver ได้อย่างน้อยหนึ่งรายการ ตั้งค่า `enabled: false` เพื่อปิดใช้ Slack เป็น client การอนุมัติ native อย่างชัดเจน
ตั้งค่า `enabled: true` เพื่อบังคับเปิดการอนุมัติ native เมื่อ resolve approver ได้

พฤติกรรมเริ่มต้นเมื่อไม่มี config การอนุมัติ exec ของ Slack ที่ชัดเจน:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

config แบบ Slack-native ที่ชัดเจนจำเป็นเฉพาะเมื่อคุณต้องการ override approver, เพิ่ม filter, หรือ
เลือกใช้การส่งมอบไปยัง chat ต้นทาง:

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

การส่งต่อ `approvals.exec` แบบ shared แยกต่างหาก ใช้เฉพาะเมื่อ prompt การอนุมัติ exec ต้อง
route ไปยัง chat อื่นหรือเป้าหมาย out-of-band ที่ชัดเจนด้วย การส่งต่อ `approvals.plugin` แบบ shared ก็
แยกต่างหากเช่นกัน ปุ่ม Slack-native ยังคงสามารถ resolve การอนุมัติ Plugin ได้เมื่อคำขอเหล่านั้นมาถึง
Slack อยู่แล้ว

`/approve` ใน chat เดียวกันยังทำงานใน channel และ DM ของ Slack ที่รองรับคำสั่งอยู่แล้ว ดู [การอนุมัติ exec](/th/tools/exec-approvals) สำหรับโมเดลการส่งต่อการอนุมัติแบบเต็ม

## Events และพฤติกรรมการปฏิบัติการ

- การแก้ไข/ลบข้อความจะถูก map เป็น system events
- thread broadcast (การตอบกลับ thread แบบ "Also send to channel") จะถูกประมวลผลเป็นข้อความผู้ใช้ปกติ
- event การเพิ่ม/ลบ reaction จะถูก map เป็น system events
- event สมาชิกเข้าร่วม/ออก, channel ถูกสร้าง/เปลี่ยนชื่อ, และ pin ถูกเพิ่ม/ลบ จะถูก map เป็น system events
- `channel_id_changed` สามารถ migrate คีย์ config ของ channel ได้เมื่อเปิดใช้ `configWrites`
- metadata ของหัวข้อ/วัตถุประสงค์ channel จะถูกปฏิบัติเป็น context ที่ไม่น่าเชื่อถือ และสามารถ inject เข้าไปใน routing context ได้
- thread starter และการ seed context จากประวัติ thread เริ่มต้นจะถูกกรองด้วย allowlist ผู้ส่งที่กำหนดค่าไว้เมื่อเกี่ยวข้อง
- block actions และ modal interactions จะ emit system events แบบมีโครงสร้าง `Slack interaction: ...` พร้อมฟิลด์ payload ที่ละเอียด:
  - block actions: ค่าที่เลือก, label, ค่า picker, และ metadata `workflow_*`
  - event modal `view_submission` และ `view_closed` พร้อม metadata channel ที่ถูก route และ input ของฟอร์ม

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Slack](/th/gateway/config-channels#slack)

<Accordion title="High-signal Slack fields">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- toggle ความเข้ากันได้: `dangerouslyAllowNameMatching` (break-glass; ปิดไว้เว้นแต่จำเป็น)
- การเข้าถึง channel: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/history: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- ops/features: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="No replies in channels">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - allowlist ของ channel (`channels.slack.channels`) — **คีย์ต้องเป็น channel ID** (`C12345678`) ไม่ใช่ชื่อ (`#channel-name`) คีย์ที่อิงชื่อจะล้มเหลวแบบเงียบภายใต้ `groupPolicy: "allowlist"` เพราะค่าเริ่มต้นของการ route channel ใช้ ID ก่อน วิธีหา ID: คลิกขวาที่ channel ใน Slack → **Copy link** — ค่า `C...` ที่ท้าย URL คือ channel ID
    - `requireMention`
    - allowlist `users` ต่อ channel

    คำสั่งที่มีประโยชน์:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM messages ignored">
    ตรวจสอบ:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (หรือ legacy `channels.slack.dm.policy`)
    - การอนุมัติ pairing / รายการ allowlist
    - event DM ของ Slack Assistant: log แบบ verbose ที่กล่าวถึง `drop message_changed`
      มักหมายความว่า Slack ส่ง event thread ของ Assistant ที่ถูกแก้ไขโดยไม่มี
      ผู้ส่งมนุษย์ที่กู้คืนได้ใน metadata ของข้อความ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    ตรวจสอบ bot + app token และการเปิดใช้ Socket Mode ในการตั้งค่าแอป Slack

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` แสดงว่าบัญชี Slack ถูก
    กำหนดค่าแล้ว แต่ runtime ปัจจุบันไม่สามารถ resolve ค่า
    ที่รองรับด้วย SecretRef ได้

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    ตรวจสอบ:

    - signing secret
    - path ของ Webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - `webhookPath` ที่ไม่ซ้ำกันต่อบัญชี HTTP

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏใน snapshot
    ของบัญชี แสดงว่าบัญชี HTTP ถูกกำหนดค่าแล้ว แต่ runtime ปัจจุบันไม่สามารถ
    resolve signing secret ที่รองรับด้วย SecretRef ได้

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    ตรวจสอบว่าคุณตั้งใจใช้:

    - โหมดคำสั่ง native (`channels.slack.commands.native: true`) พร้อมคำสั่ง slash ที่ตรงกันซึ่งลงทะเบียนใน Slack
    - หรือโหมดคำสั่ง slash เดี่ยว (`channels.slack.slashCommand.enabled: true`)

    ตรวจสอบ `commands.useAccessGroups` และ allowlist ของ channel/user ด้วย

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิง vision สำหรับไฟล์แนบ

Slack สามารถแนบสื่อที่ดาวน์โหลดแล้วเข้ากับ turn ของ agent เมื่อการดาวน์โหลดไฟล์ Slack สำเร็จและขีดจำกัดขนาดอนุญาต ไฟล์รูปภาพสามารถส่งผ่านเส้นทางการเข้าใจสื่อ หรือส่งตรงไปยังโมเดลตอบกลับที่รองรับ vision ได้ ส่วนไฟล์อื่นจะถูกเก็บเป็นบริบทไฟล์ที่ดาวน์โหลดได้ แทนที่จะถูกปฏิบัติเป็น input รูปภาพ

### ประเภทสื่อที่รองรับ

| ประเภทสื่อ                     | แหล่งที่มา               | พฤติกรรมปัจจุบัน                                                                  | หมายเหตุ                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| รูปภาพ JPEG / PNG / GIF / WebP | URL ไฟล์ Slack       | ดาวน์โหลดและแนบเข้ากับรอบสนทนาเพื่อให้จัดการด้วยความสามารถด้านวิชันได้                   | ขีดจำกัดต่อไฟล์: `channels.slack.mediaMaxMb` (ค่าเริ่มต้น 20 MB)                 |
| ไฟล์ PDF                      | URL ไฟล์ Slack       | ดาวน์โหลดและเปิดเผยเป็นบริบทไฟล์สำหรับเครื่องมือ เช่น `download-file` หรือ `pdf` | ขาเข้า Slack ไม่แปลง PDF เป็นอินพุตภาพสำหรับวิชันโดยอัตโนมัติ |
| ไฟล์อื่น ๆ                    | URL ไฟล์ Slack       | ดาวน์โหลดเมื่อเป็นไปได้และเปิดเผยเป็นบริบทไฟล์                              | ไฟล์ไบนารีจะไม่ถูกถือเป็นอินพุตรูปภาพ                               |
| การตอบกลับในเธรด                 | ไฟล์ของข้อความเริ่มเธรด | ไฟล์จากข้อความรากสามารถเติมเป็นบริบทได้เมื่อการตอบกลับไม่มีสื่อโดยตรง  | ข้อความเริ่มที่มีเฉพาะไฟล์ใช้ตัวยึดตำแหน่งไฟล์แนบ                          |
| ข้อความหลายรูปภาพ           | ไฟล์ Slack หลายไฟล์ | แต่ละไฟล์จะถูกประเมินแยกกัน                                              | การประมวลผล Slack จำกัดไว้ที่แปดไฟล์ต่อข้อความ                     |

### ไปป์ไลน์ขาเข้า

เมื่อมีข้อความ Slack พร้อมไฟล์แนบเข้ามา:

1. OpenClaw ดาวน์โหลดไฟล์จาก URL ส่วนตัวของ Slack โดยใช้โทเค็นบอต (`xoxb-...`)
2. เมื่อสำเร็จ ไฟล์จะถูกเขียนลงในที่เก็บสื่อ
3. พาธสื่อที่ดาวน์โหลดและประเภทเนื้อหาจะถูกเพิ่มลงในบริบทขาเข้า
4. พาธของโมเดล/เครื่องมือที่รองรับรูปภาพสามารถใช้ไฟล์แนบรูปภาพจากบริบทนั้นได้
5. ไฟล์ที่ไม่ใช่รูปภาพยังคงพร้อมใช้งานเป็นเมตาดาต้าไฟล์หรือการอ้างอิงสื่อสำหรับเครื่องมือที่จัดการไฟล์เหล่านั้นได้

### การสืบทอดไฟล์แนบจากรากเธรด

เมื่อมีข้อความเข้ามาในเธรด (มีพาเรนต์ `thread_ts`):

- หากตัวการตอบกลับเองไม่มีสื่อโดยตรง และข้อความรากที่รวมมามีไฟล์ Slack สามารถเติมไฟล์รากเป็นบริบทข้อความเริ่มเธรดได้
- ไฟล์แนบของการตอบกลับโดยตรงมีลำดับความสำคัญเหนือไฟล์แนบของข้อความราก
- ข้อความรากที่มีเฉพาะไฟล์และไม่มีข้อความจะแสดงด้วยตัวยึดตำแหน่งไฟล์แนบ เพื่อให้กลไกสำรองยังสามารถรวมไฟล์ของข้อความนั้นได้

### การจัดการไฟล์แนบหลายรายการ

เมื่อข้อความ Slack เดียวมีไฟล์แนบหลายรายการ:

- ไฟล์แนบแต่ละรายการจะถูกประมวลผลแยกกันผ่านไปป์ไลน์สื่อ
- การอ้างอิงสื่อที่ดาวน์โหลดจะถูกรวมไว้ในบริบทข้อความ
- ลำดับการประมวลผลเป็นไปตามลำดับไฟล์ของ Slack ในเพย์โหลดเหตุการณ์
- ความล้มเหลวในการดาวน์โหลดไฟล์แนบหนึ่งรายการจะไม่บล็อกรายการอื่น

### ขีดจำกัดขนาด การดาวน์โหลด และโมเดล

- **ขีดจำกัดขนาด**: ค่าเริ่มต้น 20 MB ต่อไฟล์ กำหนดค่าได้ผ่าน `channels.slack.mediaMaxMb`
- **ความล้มเหลวในการดาวน์โหลด**: ไฟล์ที่ Slack ให้บริการไม่ได้, URL หมดอายุ, ไฟล์ที่เข้าถึงไม่ได้, ไฟล์เกินขนาด และการตอบกลับ HTML สำหรับการตรวจสอบสิทธิ์/เข้าสู่ระบบของ Slack จะถูกข้ามแทนที่จะถูกรายงานว่าเป็นรูปแบบที่ไม่รองรับ
- **โมเดลวิชัน**: การวิเคราะห์รูปภาพใช้โมเดลตอบกลับที่ใช้งานอยู่เมื่อรองรับวิชัน หรือใช้โมเดลรูปภาพที่กำหนดค่าไว้ที่ `agents.defaults.imageModel`

### ขีดจำกัดที่ทราบ

| สถานการณ์                               | พฤติกรรมปัจจุบัน                                                             | วิธีแก้ไขชั่วคราว                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL ไฟล์ Slack หมดอายุ                 | ข้ามไฟล์; ไม่แสดงข้อผิดพลาด                                                 | อัปโหลดไฟล์ใหม่ใน Slack                                                |
| ไม่ได้กำหนดค่าโมเดลวิชัน            | ไฟล์แนบรูปภาพถูกจัดเก็บเป็นการอ้างอิงสื่อ แต่ไม่ถูกวิเคราะห์เป็นรูปภาพ | กำหนดค่า `agents.defaults.imageModel` หรือใช้โมเดลตอบกลับที่รองรับวิชัน |
| รูปภาพขนาดใหญ่มาก (> 20 MB โดยค่าเริ่มต้น) | ข้ามตามขีดจำกัดขนาด                                                         | เพิ่ม `channels.slack.mediaMaxMb` หาก Slack อนุญาต                       |
| ไฟล์แนบที่ส่งต่อ/แชร์           | ข้อความและสื่อรูปภาพ/ไฟล์ที่โฮสต์บน Slack เป็นแบบพยายามให้ดีที่สุด                       | แชร์ใหม่โดยตรงในเธรด OpenClaw                                   |
| ไฟล์แนบ PDF                        | จัดเก็บเป็นบริบทไฟล์/สื่อ ไม่ได้ถูกส่งผ่านวิชันรูปภาพโดยอัตโนมัติ  | ใช้ `download-file` สำหรับเมตาดาต้าไฟล์ หรือเครื่องมือ `pdf` สำหรับการวิเคราะห์ PDF   |

### เอกสารที่เกี่ยวข้อง

- [ไปป์ไลน์การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
- [เครื่องมือ PDF](/th/tools/pdf)
- มหากาพย์: [#51349](https://github.com/openclaw/openclaw/issues/51349) — การเปิดใช้วิชันสำหรับไฟล์แนบ Slack
- การทดสอบรีเกรสชัน: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- การยืนยันแบบสด: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Slack กับ Gateway
  </Card>
  <Card title="Groups" icon="users" href="/th/channels/groups">
    พฤติกรรมช่องและ DM กลุ่ม
  </Card>
  <Card title="Channel routing" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="Security" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเสริมความปลอดภัย
  </Card>
  <Card title="Configuration" icon="sliders" href="/th/gateway/configuration">
    เค้าโครงการกำหนดค่าและลำดับความสำคัญ
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    แคตตาล็อกคำสั่งและพฤติกรรม
  </Card>
</CardGroup>
