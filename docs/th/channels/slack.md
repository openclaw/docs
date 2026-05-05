---
read_when:
    - การตั้งค่า Slack หรือการดีบักโหมดซ็อกเก็ต/HTTP ของ Slack
summary: การตั้งค่า Slack และพฤติกรรมขณะรัน (Socket Mode + HTTP Request URLs)
title: Slack
x-i18n:
    generated_at: "2026-05-05T01:44:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a8e1cbfd3d99bfc24d79b56ee762d1ab399402391b241ff40698249b0828008
    source_path: channels/slack.md
    workflow: 16
---

พร้อมใช้งานจริงสำหรับ DM และช่องทางผ่านการผสานรวมแอป Slack โหมดเริ่มต้นคือ Socket Mode และยังรองรับ HTTP Request URLs ด้วย

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    Slack DM ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    ลักษณะการทำงานของคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและคู่มือปฏิบัติสำหรับการซ่อมแซม
  </Card>
</CardGroup>

## การเลือก Socket Mode หรือ HTTP Request URLs

ทรานสปอร์ตทั้งสองแบบพร้อมใช้งานจริงและมีความสามารถทัดเทียมกันสำหรับการรับส่งข้อความ, slash commands, App Home และการโต้ตอบ ให้เลือกตามรูปแบบการปรับใช้ ไม่ใช่ตามฟีเจอร์

| ประเด็น                      | Socket Mode (ค่าเริ่มต้น)                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| URL ของ Gateway สาธารณะ           | ไม่จำเป็น                                                                         | จำเป็น (DNS, TLS, reverse proxy หรือ tunnel)                                                                   |
| เครือข่ายขาออก             | ต้องเข้าถึง WSS ขาออกไปยัง `wss-primary.slack.com` ได้                            | ไม่มี WS ขาออก มีเฉพาะ HTTPS ขาเข้า                                                                             |
| โทเค็นที่ต้องใช้                | โทเค็นบอต (`xoxb-...`) + App-Level Token (`xapp-...`) พร้อม `connections:write`       | โทเค็นบอต (`xoxb-...`) + Signing Secret                                                                        |
| แล็ปท็อปสำหรับพัฒนา / อยู่หลังไฟร์วอลล์ | ใช้งานได้ทันที                                                                          | ต้องมี tunnel สาธารณะ (ngrok, Cloudflare Tunnel, Tailscale Funnel) หรือ Gateway สำหรับ staging                          |
| การปรับขนาดแนวนอน           | หนึ่งเซสชัน Socket Mode ต่อแอปต่อโฮสต์; Gateway หลายตัวต้องใช้แอป Slack แยกกัน | ตัวจัดการ POST แบบไร้สถานะ; เรพลิกา Gateway หลายตัวสามารถใช้แอปเดียวร่วมกันหลัง load balancer                     |
| หลายบัญชีบน Gateway เดียว | รองรับ; แต่ละบัญชีเปิด WS ของตนเอง                                             | รองรับ; แต่ละบัญชีต้องมี `webhookPath` ที่ไม่ซ้ำกัน (ค่าเริ่มต้น `/slack/events`) เพื่อไม่ให้การลงทะเบียนชนกัน |
| ทรานสปอร์ตของ slash command      | ส่งผ่านการเชื่อมต่อ WS; `slash_commands[].url` จะถูกละเว้น                  | Slack ส่ง POST ไปยัง `slash_commands[].url`; ต้องมีฟิลด์นี้เพื่อให้คำสั่งถูก dispatch                           |
| การลงนามคำขอ              | ไม่ได้ใช้ (การยืนยันตัวตนคือ App-Level Token)                                               | Slack ลงนามทุกคำขอ; OpenClaw ตรวจสอบด้วย `signingSecret`                                              |
| การกู้คืนเมื่อการเชื่อมต่อหลุด  | Slack SDK เชื่อมต่อใหม่อัตโนมัติ; ใช้การปรับแต่งทรานสปอร์ต pong-timeout ของ Gateway       | ไม่มีการเชื่อมต่อถาวรให้หลุด; การลองใหม่เป็นรายคำขอจาก Slack                                           |

<Note>
  **เลือก Socket Mode** สำหรับโฮสต์ที่มี Gateway เดียว, แล็ปท็อปสำหรับพัฒนา และเครือข่ายภายในองค์กรที่เข้าถึง `*.slack.com` ขาออกได้ แต่รับ HTTPS ขาเข้าไม่ได้

**เลือก HTTP Request URLs** เมื่อรันเรพลิกา Gateway หลายตัวหลัง load balancer, เมื่อ WSS ขาออกถูกบล็อกแต่อนุญาต HTTPS ขาเข้า หรือเมื่อคุณยุติ Slack webhooks ที่ reverse proxy อยู่แล้ว
</Note>

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        เปิด [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → เลือกเวิร์กสเปซของคุณ → วางหนึ่งใน manifest ด้านล่าง → **Next** → **Create**

        <CodeGroup>

```json Recommended
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

```json Minimal
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
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
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **แนะนำ** ตรงกับชุดฟีเจอร์เต็มของ Slack Plugin ที่รวมมา: App Home, slash commands, ไฟล์, reactions, pins, group DMs และการอ่าน emoji/usergroup เลือก **ขั้นต่ำ** เมื่อนโยบายเวิร์กสเปซจำกัด scopes โดยครอบคลุม DM, ประวัติช่องทาง/กลุ่ม, mentions และ slash commands แต่ตัดไฟล์, reactions, pins, group-DM (`mpim:*`), `emoji:read` และ `usergroups:read` ออก ดู [รายการตรวจสอบ manifest และ scope](#manifest-and-scope-checklist) สำหรับเหตุผลของแต่ละ scope และตัวเลือกแบบเพิ่มได้ เช่น slash commands เพิ่มเติม
        </Note>

        หลังจาก Slack สร้างแอปแล้ว:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: เพิ่ม `connections:write`, บันทึก, คัดลอกค่า `xapp-...`
        - **Install App → Install to Workspace**: คัดลอก Bot User OAuth Token ค่า `xoxb-...`

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

        ทางเลือกสำรองผ่าน env (เฉพาะบัญชีเริ่มต้น):

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
        เปิด [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → เลือกเวิร์กสเปซของคุณ → วางหนึ่งใน manifest ด้านล่าง → แทนที่ `https://gateway-host.example.com/slack/events` ด้วย URL ของ Gateway สาธารณะของคุณ → **Next** → **Create**

        <CodeGroup>

```json Recommended
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
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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

```json Minimal
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
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im"
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

        </CodeGroup>

        <Note>
          **แนะนำ** ตรงกับชุดฟีเจอร์เต็มของ Slack plugin ที่รวมมาให้; **ขั้นต่ำ** ตัดไฟล์ รีแอ็กชัน พิน กลุ่ม DM (`mpim:*`), `emoji:read` และ `usergroups:read` ออกสำหรับเวิร์กสเปซที่จำกัดสิทธิ์มาก ดู [รายการตรวจสอบ manifest และ scope](#manifest-and-scope-checklist) สำหรับเหตุผลของแต่ละ scope
        </Note>

        <Info>
          ฟิลด์ URL ทั้งสาม (`slash_commands[].url`, `event_subscriptions.request_url` และ `interactivity.request_url` / `message_menu_options_url`) ชี้ไปยัง endpoint เดียวกันของ OpenClaw ทั้งหมด สคีมา manifest ของ Slack กำหนดให้ตั้งชื่อแยกกัน แต่ OpenClaw route ตามชนิดของ payload ดังนั้น `webhookPath` เดียว (ค่าเริ่มต้น `/slack/events`) ก็เพียงพอ Slash command ที่ไม่มี `slash_commands[].url` จะไม่ทำงานแบบเงียบ ๆ ในโหมด HTTP
        </Info>

        หลังจาก Slack สร้างแอปแล้ว:

        - **Basic Information → App Credentials**: คัดลอก **Signing Secret** สำหรับการตรวจสอบคำขอ
        - **Install App → Install to Workspace**: คัดลอก Bot User OAuth Token รูปแบบ `xoxb-...`

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
        ใช้เส้นทาง Webhook ที่ไม่ซ้ำกันสำหรับ HTTP หลายบัญชี

        กำหนด `webhookPath` ที่แตกต่างกันให้แต่ละบัญชี (ค่าเริ่มต้น `/slack/events`) เพื่อไม่ให้การลงทะเบียนชนกัน
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

## การปรับแต่ง transport สำหรับ Socket Mode

OpenClaw ตั้งค่า pong timeout ของไคลเอนต์ Slack SDK เป็น 15 วินาทีโดยค่าเริ่มต้นสำหรับ Socket Mode ให้ override การตั้งค่า transport เฉพาะเมื่อคุณต้องการปรับแต่งตามเวิร์กสเปซหรือโฮสต์เท่านั้น:

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

ใช้สิ่งนี้เฉพาะกับเวิร์กสเปซ Socket Mode ที่บันทึก timeout ของ Slack websocket pong/server-ping หรือทำงานบนโฮสต์ที่ทราบว่ามี event-loop starvation `clientPingTimeout` คือเวลารอ pong หลังจาก SDK ส่ง client ping; `serverPingTimeout` คือเวลารอ ping จากเซิร์ฟเวอร์ Slack ข้อความและอีเวนต์ของแอปยังคงเป็นสถานะแอปพลิเคชัน ไม่ใช่สัญญาณความมีชีวิตของ transport

## รายการตรวจสอบ manifest และ scope

manifest พื้นฐานของแอป Slack เหมือนกันสำหรับ Socket Mode และ HTTP Request URLs เฉพาะบล็อก `settings` (และ `url` ของ slash command) เท่านั้นที่ต่างกัน

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

สำหรับโหมด **HTTP Request URLs** ให้แทนที่ `settings` ด้วยตัวแปร HTTP และเพิ่ม `url` ให้แต่ละ slash command ต้องมี URL สาธารณะ:

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

เปิดใช้ฟีเจอร์ต่าง ๆ ที่ขยายจากค่าเริ่มต้นข้างต้น

manifest เริ่มต้นเปิดใช้แท็บ **Home** ของ Slack App Home และ subscribe ไปที่ `app_home_opened` เมื่อสมาชิกเวิร์กสเปซเปิดแท็บ Home OpenClaw จะเผยแพร่มุมมอง Home ค่าเริ่มต้นที่ปลอดภัยด้วย `views.publish`; ไม่มี payload การสนทนาหรือการกำหนดค่าส่วนตัวรวมอยู่ แท็บ **Messages** ยังคงเปิดใช้สำหรับ DM ของ Slack

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    สามารถใช้ [native slash commands](#commands-and-slash-behavior) หลายรายการแทนคำสั่งเดียวที่กำหนดค่าไว้ โดยมีรายละเอียดดังนี้:

    - ใช้ `/agentstatus` แทน `/status` เพราะคำสั่ง `/status` ถูกสงวนไว้
    - ไม่สามารถเปิดใช้ slash command พร้อมกันได้เกิน 25 รายการ

    แทนที่ส่วน `features.slash_commands` ที่มีอยู่ด้วยชุดย่อยของ [คำสั่งที่ใช้ได้](/th/tools/slash-commands#command-list):

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
        ใช้รายการ `slash_commands` เดียวกับ Socket Mode ข้างต้น และเพิ่ม `"url": "https://gateway-host.example.com/slack/events"` ให้ทุก entry ตัวอย่าง:

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
  <Accordion title="ขอบเขตผู้เขียนที่ไม่บังคับ (การดำเนินการเขียน)">
    เพิ่มขอบเขตบอต `chat:write.customize` หากคุณต้องการให้ข้อความขาออกใช้ตัวตนของเอเจนต์ที่ใช้งานอยู่ (ชื่อผู้ใช้และไอคอนแบบกำหนดเอง) แทนตัวตนเริ่มต้นของแอป Slack

    หากคุณใช้ไอคอนอีโมจิ Slack คาดว่าจะใช้ไวยากรณ์ `:emoji_name:`

  </Accordion>
  <Accordion title="ขอบเขตโทเค็นผู้ใช้ที่ไม่บังคับ (การดำเนินการอ่าน)">
    หากคุณกำหนดค่า `channels.slack.userToken` ขอบเขตการอ่านทั่วไปคือ:

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

- ต้องมี `botToken` + `appToken` สำหรับ Socket Mode
- โหมด HTTP ต้องใช้ `botToken` + `signingSecret`
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับสตริงข้อความล้วน
  หรือออบเจกต์ SecretRef
- โทเค็นในค่ากำหนดจะเขียนทับ env fallback
- env fallback ของ `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
- `userToken` (`xoxp-...`) กำหนดค่าได้เฉพาะใน config (ไม่มี env fallback) และมีค่าเริ่มต้นเป็นพฤติกรรมอ่านอย่างเดียว (`userTokenReadOnly: true`)

พฤติกรรมสแนปช็อตสถานะ:

- การตรวจสอบบัญชี Slack ติดตามฟิลด์ `*Source` และ `*Status`
  ต่อข้อมูลรับรอง (`botToken`, `appToken`, `signingSecret`, `userToken`)
- สถานะคือ `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าผ่าน SecretRef
  หรือแหล่งความลับแบบไม่อินไลน์อื่น แต่คำสั่ง/เส้นทางรันไทม์ปัจจุบัน
  ไม่สามารถแก้ค่าแท้จริงได้
- ในโหมด HTTP จะรวม `signingSecretStatus`; ใน Socket Mode
  คู่ที่จำเป็นคือ `botTokenStatus` + `appTokenStatus`

<Tip>
สำหรับการอ่าน actions/directory อาจเลือกใช้โทเค็นผู้ใช้ก่อนเมื่อกำหนดค่าไว้ สำหรับการเขียน โทเค็นบอตยังคงเป็นตัวเลือกหลัก การเขียนด้วยโทเค็นผู้ใช้อนุญาตเฉพาะเมื่อ `userTokenReadOnly: false` และโทเค็นบอตไม่พร้อมใช้งาน
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

Slack message actions ปัจจุบันประกอบด้วย `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list` `download-file` รับ Slack file IDs ที่แสดงในตัวแทนที่ไฟล์ขาเข้า และส่งคืนตัวอย่างรูปภาพสำหรับรูปภาพ หรือเมทาดาทาไฟล์ในเครื่องสำหรับไฟล์ชนิดอื่น

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM `channels.slack.allowFrom` คือรายการอนุญาต DM หลัก

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.slack.allowFrom` รวม `"*"`)
    - `disabled`

    แฟล็ก DM:

    - `dm.enabled` (ค่าเริ่มต้น true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (แบบเดิม)
    - `dm.groupEnabled` (DM แบบกลุ่ม ค่าเริ่มต้น false)
    - `dm.groupChannels` (รายการอนุญาต MPIM ที่ไม่บังคับ)

    ลำดับความสำคัญหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่มีชื่อจะสืบทอด `channels.slack.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตนเอง
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.slack.accounts.default.allowFrom`

    `channels.slack.dm.policy` และ `channels.slack.dm.allowFrom` แบบเดิมยังคงถูกอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปเป็น `dmPolicy` และ `allowFrom` เมื่อสามารถทำได้โดยไม่เปลี่ยนแปลงการเข้าถึง

    การจับคู่ใน DM ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="นโยบายช่อง">
    `channels.slack.groupPolicy` ควบคุมการจัดการช่อง:

    - `open`
    - `allowlist`
    - `disabled`

    รายการอนุญาตช่องอยู่ภายใต้ `channels.slack.channels` และ **ต้องใช้ ID ช่อง Slack ที่เสถียร** (เช่น `C12345678`) เป็นคีย์ config

    หมายเหตุรันไทม์: หาก `channels.slack` ไม่มีอยู่เลย (ตั้งค่าผ่าน env เท่านั้น) รันไทม์จะ fallback ไปที่ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้ว่า `channels.defaults.groupPolicy` จะถูกตั้งค่าไว้ก็ตาม)

    การแก้ชื่อ/ID:

    - รายการในรายการอนุญาตช่องและรายการอนุญาต DM จะถูกแก้เมื่อเริ่มต้น หากการเข้าถึงโทเค็นอนุญาต
    - รายการชื่อช่องที่แก้ไม่ได้จะถูกเก็บไว้ตามที่กำหนดค่า แต่โดยค่าเริ่มต้นจะถูกละเว้นสำหรับการกำหนดเส้นทาง
    - การอนุญาตขาเข้าและการกำหนดเส้นทางช่องใช้ ID เป็นหลักโดยค่าเริ่มต้น การจับคู่ชื่อผู้ใช้/slug โดยตรงต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    คีย์แบบอิงชื่อ (`#channel-name` หรือ `channel-name`) จะ **ไม่** จับคู่ภายใต้ `groupPolicy: "allowlist"` การค้นหาช่องใช้ ID เป็นหลักโดยค่าเริ่มต้น ดังนั้นคีย์แบบอิงชื่อจะไม่มีทางกำหนดเส้นทางสำเร็จ และข้อความทั้งหมดในช่องนั้นจะถูกบล็อกอย่างเงียบ ๆ ซึ่งต่างจาก `groupPolicy: "open"` ที่ไม่ต้องใช้คีย์ช่องสำหรับการกำหนดเส้นทาง และคีย์แบบอิงชื่อดูเหมือนจะใช้งานได้

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

    ไม่ถูกต้อง (ถูกบล็อกแบบเงียบเมื่อใช้ `groupPolicy: "allowlist"`):

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
    ข้อความในช่องจะถูกควบคุมด้วยการกล่าวถึงโดยค่าเริ่มต้น

    แหล่งที่มาของการกล่าวถึง:

    - การกล่าวถึงแอปอย่างชัดเจน (`<@botId>`)
    - การกล่าวถึงกลุ่มผู้ใช้ Slack (`<!subteam^S...>`) เมื่อผู้ใช้บอตเป็นสมาชิกของกลุ่มผู้ใช้นั้น ต้องใช้ `usergroups:read`
    - รูปแบบ regex สำหรับการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`, ค่าสำรอง `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับเธรดถึงบอตโดยนัย (ปิดใช้งานเมื่อ `thread.requireExplicitMention` เป็น `true`)

    การควบคุมรายช่อง (`channels.slack.channels.<id>`; ใช้ชื่อได้ผ่านการแก้ไขตอนเริ่มต้นหรือ `dangerouslyAllowNameMatching` เท่านั้น):

    - `requireMention`
    - `users` (รายการอนุญาต)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ `toolsBySender`: `id:`, `e164:`, `username:`, `name:`, หรือไวลด์การ์ด `"*"`
      (คีย์แบบเดิมที่ไม่มีคำนำหน้ายังคงแมปเป็น `id:` เท่านั้น)

    `allowBots` ใช้นโยบายแบบรัดกุมสำหรับช่องและช่องส่วนตัว: ข้อความห้องที่เขียนโดยบอตจะถูกรับเฉพาะเมื่อบอตผู้ส่งถูกระบุไว้อย่างชัดเจนในรายการอนุญาต `users` ของห้องนั้น หรือเมื่อมี ID เจ้าของ Slack ที่ระบุชัดเจนอย่างน้อยหนึ่งรายการจาก `channels.slack.allowFrom` เป็นสมาชิกห้องอยู่ในขณะนั้น ไวลด์การ์ดและรายการเจ้าของแบบชื่อที่แสดงไม่ถือว่าเป็นการมีอยู่ของเจ้าของ การมีอยู่ของเจ้าของใช้ Slack `conversations.members`; ตรวจสอบให้แน่ใจว่าแอปมี scope สำหรับอ่านที่ตรงกับชนิดห้อง (`channels:read` สำหรับช่องสาธารณะ, `groups:read` สำหรับช่องส่วนตัว) หากการค้นหาสมาชิกล้มเหลว OpenClaw จะทิ้งข้อความห้องที่เขียนโดยบอต

  </Tab>
</Tabs>

## เธรด เซสชัน และแท็กตอบกลับ

- DM จะถูกกำหนดเส้นทางเป็น `direct`; ช่องเป็น `channel`; MPIM เป็น `group`
- การผูกเส้นทาง Slack รับ ID ของเพียร์แบบดิบ รวมถึงรูปแบบเป้าหมาย Slack เช่น `channel:C12345678`, `user:U12345678` และ `<@U12345678>`
- ด้วยค่าเริ่มต้น `session.dmScope=main` DM ของ Slack จะถูกรวมเข้ากับเซสชันหลักของเอเจนต์
- เซสชันช่อง: `agent:<agentId>:slack:channel:<channelId>`
- การตอบกลับในเธรดสามารถสร้างส่วนต่อท้ายเซสชันเธรด (`:thread:<threadTs>`) ได้เมื่อใช้ได้
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความเธรดที่มีอยู่ซึ่งจะถูกดึงเมื่อเซสชันเธรดใหม่เริ่มต้น (ค่าเริ่มต้น `20`; ตั้งเป็น `0` เพื่อปิดใช้งาน)
- `channels.slack.thread.requireExplicitMention` (ค่าเริ่มต้น `false`): เมื่อเป็น `true` จะระงับการกล่าวถึงเธรดโดยนัย เพื่อให้บอตตอบเฉพาะการกล่าวถึง `@bot` อย่างชัดเจนภายในเธรด แม้ว่าบอตจะเคยเข้าร่วมในเธรดนั้นแล้วก็ตาม หากไม่มีค่านี้ การตอบกลับในเธรดที่บอตเข้าร่วมจะข้ามการควบคุม `requireMention`

การควบคุมเธรดตอบกลับ:

- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: แยกตาม `direct|group|channel`
- ค่าสำรองแบบเดิมสำหรับแชตโดยตรง: `channels.slack.dm.replyToMode`

รองรับแท็กตอบกลับด้วยตนเอง:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` ปิดใช้งานเธรดตอบกลับ **ทั้งหมด** ใน Slack รวมถึงแท็ก `[[reply_to_*]]` ที่ระบุชัดเจน ซึ่งแตกต่างจาก Telegram ที่ยังคงเคารพแท็กที่ระบุชัดเจนในโหมด `"off"` เธรด Slack จะซ่อนข้อความจากช่อง ขณะที่การตอบกลับของ Telegram ยังคงมองเห็นได้แบบอินไลน์
</Note>

## รีแอ็กชันรับทราบ

`ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

ลำดับการแก้ไขค่า:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- ค่าสำรองอีโมจิของตัวตนเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้นใช้ "👀")

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"eyes"`)
- ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับบัญชี Slack หรือแบบทั่วทั้งระบบ

## การสตรีมข้อความ

`channels.slack.streaming` ควบคุมพฤติกรรมตัวอย่างสด:

- `off`: ปิดใช้งานการสตรีมตัวอย่างสด
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความตัวอย่างด้วยเอาต์พุตบางส่วนล่าสุด
- `block`: ผนวกการอัปเดตตัวอย่างแบบแบ่งชิ้น
- `progress`: แสดงข้อความสถานะความคืบหน้าระหว่างสร้าง แล้วส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อตัวอย่างแบบร่างทำงานอยู่ ให้กำหนดเส้นทางการอัปเดตเครื่องมือ/ความคืบหน้าเข้าไปยังข้อความตัวอย่างที่ถูกแก้ไขข้อความเดียวกัน (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อเก็บข้อความเครื่องมือ/ความคืบหน้าแยกกัน
- `streaming.preview.commandText` / `streaming.progress.commandText`: ตั้งเป็น `status` เพื่อคงบรรทัดความคืบหน้าของเครื่องมือแบบกะทัดรัดไว้พร้อมซ่อนข้อความคำสั่ง/การเรียกใช้แบบดิบ (ค่าเริ่มต้น: `raw`)

ซ่อนข้อความคำสั่ง/การเรียกใช้แบบดิบ พร้อมคงบรรทัดความคืบหน้าแบบกะทัดรัดไว้:

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

- ต้องมีเธรดตอบกลับสำหรับการสตรีมข้อความแบบเนทีฟและสถานะเธรดผู้ช่วยของ Slack จึงจะปรากฏ การเลือกเธรดยังคงเป็นไปตาม `replyToMode`
- รากของช่อง แชตกลุ่ม และ DM ระดับบนสุดยังคงใช้ตัวอย่างแบบร่างปกติได้เมื่อการสตรีมแบบเนทีฟใช้งานไม่ได้หรือไม่มีเธรดตอบกลับ
- DM ระดับบนสุดของ Slack จะอยู่นอกเธรดโดยค่าเริ่มต้น จึงไม่แสดงตัวอย่างสตรีม/สถานะแบบเนทีฟสไตล์เธรดของ Slack; OpenClaw จะโพสต์และแก้ไขตัวอย่างแบบร่างใน DM แทน
- สื่อและ payload ที่ไม่ใช่ข้อความจะถอยกลับไปใช้การส่งปกติ
- ผลลัพธ์สุดท้ายของสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่รอดำเนินการ; ผลลัพธ์สุดท้ายแบบข้อความ/บล็อกที่เข้าเกณฑ์จะ flush เฉพาะเมื่อสามารถแก้ไขตัวอย่างในตำแหน่งเดิมได้
- หากการสตรีมล้มเหลวระหว่างตอบกลับ OpenClaw จะถอยกลับไปใช้การส่งปกติสำหรับ payload ที่เหลือ

ใช้ตัวอย่างแบบร่างแทนการสตรีมข้อความแบบเนทีฟของ Slack:

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

คีย์แบบเดิม:

- `channels.slack.streamMode` (`replace | status_final | append`) จะถูกย้ายโดยอัตโนมัติไปยัง `channels.slack.streaming.mode`
- ค่า boolean `channels.slack.streaming` จะถูกย้ายโดยอัตโนมัติไปยัง `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport`
- `channels.slack.nativeStreaming` แบบเดิมจะถูกย้ายโดยอัตโนมัติไปยัง `channels.slack.streaming.nativeTransport`

## ค่าสำรองรีแอ็กชันกำลังพิมพ์

`typingReaction` จะเพิ่ม reaction ชั่วคราวให้กับข้อความ Slack ขาเข้าขณะที่ OpenClaw กำลังประมวลผลคำตอบ จากนั้นจะลบออกเมื่อการรันเสร็จสิ้น วิธีนี้มีประโยชน์มากที่สุดนอกเหนือจากการตอบกลับในเธรด ซึ่งใช้ตัวบ่งชี้สถานะเริ่มต้นว่า "is typing..."

ลำดับการแก้ค่า:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"hourglass_flowing_sand"`)
- reaction เป็นแบบพยายามให้ดีที่สุด และจะพยายามล้างค่าโดยอัตโนมัติหลังจากเส้นทางการตอบกลับหรือความล้มเหลวเสร็จสิ้น

## สื่อ การแบ่งชิ้นส่วน และการส่งมอบ

<AccordionGroup>
  <Accordion title="ไฟล์แนบขาเข้า">
    ไฟล์แนบของ Slack จะถูกดาวน์โหลดจาก URL ส่วนตัวที่โฮสต์โดย Slack (โฟลว์คำขอที่ตรวจสอบสิทธิ์ด้วยโทเค็น) และเขียนไปยัง media store เมื่อดึงข้อมูลสำเร็จและข้อจำกัดขนาดอนุญาต placeholder ของไฟล์จะรวม Slack `fileId` เพื่อให้ agent สามารถดึงไฟล์ต้นฉบับด้วย `download-file`

    การดาวน์โหลดใช้ timeout สำหรับช่วง idle และเวลารวมแบบมีขอบเขต หากการดึงไฟล์ Slack ค้างหรือล้มเหลว OpenClaw จะยังคงประมวลผลข้อความต่อไปและถอยกลับไปใช้ placeholder ของไฟล์

    ขีดจำกัดขนาดขาเข้าขณะรันมีค่าเริ่มต้นเป็น `20MB` เว้นแต่จะถูก override ด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="ข้อความและไฟล์ขาออก">
    - ชิ้นส่วนข้อความใช้ `channels.slack.textChunkLimit` (ค่าเริ่มต้น 4000)
    - `channels.slack.chunkMode="newline"` เปิดใช้การแบ่งโดยยึดย่อหน้าก่อน
    - การส่งไฟล์ใช้ API อัปโหลดของ Slack และสามารถรวมการตอบกลับในเธรด (`thread_ts`)
    - ขีดจำกัดสื่อขาออกจะทำตาม `channels.slack.mediaMaxMb` เมื่อมีการตั้งค่า มิฉะนั้นการส่งผ่านช่องทางจะใช้ค่าเริ่มต้นตามชนิด MIME จาก media pipeline

  </Accordion>

  <Accordion title="เป้าหมายการส่งมอบ">
    เป้าหมายแบบระบุชัดเจนที่แนะนำ:

    - `user:<id>` สำหรับ DM
    - `channel:<id>` สำหรับช่อง

    DM ของ Slack ที่มีเฉพาะข้อความ/บล็อกสามารถโพสต์ตรงไปยัง ID ผู้ใช้ได้ ส่วนการอัปโหลดไฟล์และการส่งแบบมีเธรดจะเปิด DM ผ่าน API การสนทนาของ Slack ก่อน เพราะเส้นทางเหล่านั้นต้องใช้ ID การสนทนาที่เป็นรูปธรรม

  </Accordion>
</AccordionGroup>

## คำสั่งและพฤติกรรม slash

คำสั่ง slash ใน Slack จะปรากฏเป็นคำสั่งเดียวที่ตั้งค่าไว้หรือหลายคำสั่ง native ตั้งค่า `channels.slack.slashCommand` เพื่อเปลี่ยนค่าเริ่มต้นของคำสั่ง:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

คำสั่ง native ต้องใช้ [การตั้งค่า manifest เพิ่มเติม](#additional-manifest-settings) ในแอป Slack ของคุณ และเปิดใช้ด้วย `channels.slack.commands.native: true` หรือ `commands.native: true` ในการตั้งค่าส่วนกลางแทน

- โหมดอัตโนมัติของคำสั่ง native จะ **ปิด** สำหรับ Slack ดังนั้น `commands.native: "auto"` จะไม่เปิดใช้คำสั่ง native ของ Slack

```txt
/help
```

เมนูอาร์กิวเมนต์ native ใช้กลยุทธ์การเรนเดอร์แบบปรับตัวได้ ซึ่งแสดง modal ยืนยันก่อนส่งค่าตัวเลือกที่เลือก:

- สูงสุด 5 ตัวเลือก: บล็อกปุ่ม
- 6-100 ตัวเลือก: เมนู static select
- มากกว่า 100 ตัวเลือก: external select พร้อมการกรองตัวเลือกแบบ async เมื่อมี handler สำหรับตัวเลือก interactivity
- เกินขีดจำกัดของ Slack: ค่าตัวเลือกที่เข้ารหัสจะถอยกลับไปใช้ปุ่ม

```txt
/think
```

เซสชัน slash ใช้คีย์แยกอย่าง `agent:<agentId>:slack:slash:<userId>` และยังคง route การเรียกใช้คำสั่งไปยังเซสชันการสนทนาเป้าหมายโดยใช้ `CommandTargetSessionKey`

## การตอบกลับแบบโต้ตอบ

Slack สามารถเรนเดอร์ตัวควบคุมการตอบกลับแบบโต้ตอบที่ agent เขียนขึ้นได้ แต่ฟีเจอร์นี้ถูกปิดไว้ตามค่าเริ่มต้น

เปิดใช้ทั่วทั้งระบบ:

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

หรือเปิดใช้สำหรับบัญชี Slack บัญชีเดียวเท่านั้น:

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

เมื่อเปิดใช้ agent สามารถปล่อย directive การตอบกลับเฉพาะ Slack ได้:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

directive เหล่านี้จะคอมไพล์เป็น Slack Block Kit และ route การคลิกหรือการเลือกกลับผ่านเส้นทาง event การโต้ตอบของ Slack ที่มีอยู่

หมายเหตุ:

- นี่คือ UI เฉพาะ Slack ช่องทางอื่นจะไม่แปล directive ของ Slack Block Kit เป็นระบบปุ่มของตัวเอง
- ค่า callback แบบโต้ตอบเป็นโทเค็นทึบที่ OpenClaw สร้างขึ้น ไม่ใช่ค่าดิบที่ agent เขียน
- หากบล็อกแบบโต้ตอบที่สร้างขึ้นจะเกินขีดจำกัดของ Slack Block Kit OpenClaw จะถอยกลับไปใช้ข้อความตอบกลับต้นฉบับแทนการส่ง payload บล็อกที่ไม่ถูกต้อง

## การอนุมัติ exec ใน Slack

Slack สามารถทำหน้าที่เป็นไคลเอนต์อนุมัติ native ด้วยปุ่มและการโต้ตอบแบบโต้ตอบ แทนการถอยกลับไปใช้ Web UI หรือเทอร์มินัล

- การอนุมัติ exec ใช้ `channels.slack.execApprovals.*` สำหรับการ route DM/ช่องแบบ native
- การอนุมัติ Plugin ยังสามารถ resolve ผ่านพื้นผิวปุ่ม Slack-native เดียวกันได้เมื่อคำขอมาถึง Slack อยู่แล้ว และชนิด ID การอนุมัติคือ `plugin:`
- การอนุญาตผู้อนุมัติยังคงถูกบังคับใช้: เฉพาะผู้ใช้ที่ระบุว่าเป็นผู้อนุมัติเท่านั้นที่สามารถอนุมัติหรือปฏิเสธคำขอผ่าน Slack ได้

สิ่งนี้ใช้พื้นผิวปุ่มอนุมัติที่ใช้ร่วมกันเดียวกับช่องทางอื่น เมื่อเปิดใช้ `interactivity` ในการตั้งค่าแอป Slack ของคุณ prompt การอนุมัติจะเรนเดอร์เป็นปุ่ม Block Kit โดยตรงในการสนทนา
เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นจะเป็น UX การอนุมัติหลัก OpenClaw
ควรรวมคำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์เครื่องมือบอกว่าการอนุมัติผ่านแชต
ไม่พร้อมใช้งาน หรือการอนุมัติแบบ manual เป็นเส้นทางเดียวเท่านั้น

เส้นทางการตั้งค่า:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; ถอยกลับไปใช้ `commands.ownerAllowFrom` เมื่อเป็นไปได้)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack จะเปิดใช้การอนุมัติ exec native โดยอัตโนมัติเมื่อ `enabled` ไม่ได้ตั้งค่าไว้หรือเป็น `"auto"` และสามารถ resolve
ผู้อนุมัติได้อย่างน้อยหนึ่งราย ตั้งค่า `enabled: false` เพื่อปิดใช้ Slack ในฐานะไคลเอนต์อนุมัติ native อย่างชัดเจน
ตั้งค่า `enabled: true` เพื่อบังคับเปิดการอนุมัติ native เมื่อสามารถ resolve ผู้อนุมัติได้

พฤติกรรมเริ่มต้นเมื่อไม่มีการตั้งค่าการอนุมัติ exec ของ Slack แบบชัดเจน:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

จำเป็นต้องใช้การตั้งค่า Slack-native แบบชัดเจนเฉพาะเมื่อคุณต้องการ override ผู้อนุมัติ เพิ่มตัวกรอง หรือ
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

การส่งต่อ `approvals.exec` ที่ใช้ร่วมกันเป็นคนละส่วน ใช้เฉพาะเมื่อ prompt การอนุมัติ exec ต้อง
route ไปยังแชตอื่นหรือเป้าหมายนอกช่องทางที่ระบุชัดเจนด้วย การส่งต่อ `approvals.plugin` ที่ใช้ร่วมกันก็เป็น
คนละส่วนเช่นกัน ปุ่ม Slack-native ยังสามารถ resolve การอนุมัติ Plugin ได้เมื่อคำขอเหล่านั้นมาถึง
Slack อยู่แล้ว

`/approve` ในแชตเดียวกันยังทำงานในช่อง Slack และ DM ที่รองรับคำสั่งอยู่แล้ว ดู [การอนุมัติ exec](/th/tools/exec-approvals) สำหรับโมเดลการส่งต่อการอนุมัติฉบับเต็ม

## event และพฤติกรรมการปฏิบัติงาน

- การแก้ไข/ลบข้อความจะถูก map เป็น event ระบบ
- การ broadcast เธรด (การตอบกลับเธรดแบบ "Also send to channel") จะถูกประมวลผลเป็นข้อความผู้ใช้ปกติ
- event การเพิ่ม/ลบ reaction จะถูก map เป็น event ระบบ
- event สมาชิกเข้าร่วม/ออกจากช่อง สร้าง/เปลี่ยนชื่อช่อง และเพิ่ม/ลบ pin จะถูก map เป็น event ระบบ
- `channel_id_changed` สามารถย้ายคีย์การตั้งค่าช่องได้เมื่อเปิดใช้ `configWrites`
- metadata หัวข้อ/วัตถุประสงค์ของช่องจะถือเป็น context ที่ไม่น่าเชื่อถือ และสามารถถูก inject เข้าไปใน routing context ได้
- ตัวเริ่มเธรดและการ seed context ประวัติเธรดเริ่มต้นจะถูกกรองด้วย allowlist ผู้ส่งที่ตั้งค่าไว้เมื่อเกี่ยวข้อง
- block actions และการโต้ตอบ modal จะปล่อย event ระบบ `Slack interaction: ...` แบบมีโครงสร้าง พร้อมฟิลด์ payload ที่ละเอียด:
  - block actions: ค่าที่เลือก label ค่าตัวเลือก picker และ metadata `workflow_*`
  - event modal `view_submission` และ `view_closed` พร้อม metadata ช่องที่ถูก route และข้อมูลฟอร์ม

## ข้อมูลอ้างอิงการตั้งค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการตั้งค่า - Slack](/th/gateway/config-channels#slack)

<Accordion title="ฟิลด์ Slack ที่มีสัญญาณสูง">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- toggle ความเข้ากันได้: `dangerouslyAllowNameMatching` (break-glass; ปิดไว้เว้นแต่จำเป็น)
- การเข้าถึงช่อง: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- เธรด/ประวัติ: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- ops/ฟีเจอร์: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในช่อง">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - allowlist ของช่อง (`channels.slack.channels`) — **คีย์ต้องเป็น ID ช่อง** (`C12345678`) ไม่ใช่ชื่อ (`#channel-name`) คีย์ที่อิงชื่อล้มเหลวแบบเงียบภายใต้ `groupPolicy: "allowlist"` เพราะการ route ช่องเป็นแบบ ID-first ตามค่าเริ่มต้น วิธีหา ID: คลิกขวาช่องใน Slack → **Copy link** — ค่า `C...` ที่ท้าย URL คือ ID ช่อง
    - `requireMention`
    - allowlist `users` รายช่อง

    คำสั่งที่มีประโยชน์:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="ข้อความ DM ถูกเพิกเฉย">
    ตรวจสอบ:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (หรือ legacy `channels.slack.dm.policy`)
    - การอนุมัติการจับคู่ / รายการ allowlist
    - event DM ของ Slack Assistant: log แบบ verbose ที่กล่าวถึง `drop message_changed`
      มักหมายความว่า Slack ส่ง event เธรด Assistant ที่ถูกแก้ไขมาโดยไม่มี
      ผู้ส่งที่เป็นมนุษย์ซึ่งกู้คืนได้ใน metadata ของข้อความ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode ไม่เชื่อมต่อ">
    ตรวจสอบความถูกต้องของโทเค็น bot + app และการเปิดใช้ Socket Mode ในการตั้งค่าแอป Slack

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` หมายความว่าบัญชี Slack
    ถูกตั้งค่าแล้ว แต่ runtime ปัจจุบันไม่สามารถ resolve ค่า
    ที่อิง SecretRef ได้

  </Accordion>

  <Accordion title="โหมด HTTP ไม่ได้รับ event">
    ตรวจสอบความถูกต้อง:

    - signing secret
    - webhook path
    - URL คำขอของ Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` ที่ไม่ซ้ำกันสำหรับแต่ละบัญชี HTTP

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏใน snapshot
    บัญชี หมายความว่าบัญชี HTTP ถูกตั้งค่าแล้ว แต่ runtime ปัจจุบันไม่สามารถ
    resolve signing secret ที่อิง SecretRef ได้

  </Accordion>

  <Accordion title="คำสั่ง native/slash ไม่ทำงาน">
    ตรวจสอบว่าคุณตั้งใจใช้แบบใด:

    - โหมดคำสั่ง native (`channels.slack.commands.native: true`) พร้อมคำสั่ง slash ที่ตรงกันซึ่งลงทะเบียนไว้ใน Slack
    - หรือโหมดคำสั่ง slash เดี่ยว (`channels.slack.slashCommand.enabled: true`)

    ตรวจสอบ `commands.useAccessGroups` และ allowlist ของช่อง/ผู้ใช้ด้วย

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิง vision สำหรับไฟล์แนบ

Slack สามารถแนบสื่อที่ดาวน์โหลดแล้วเข้ากับ turn ของ agent ได้เมื่อการดาวน์โหลดไฟล์ Slack สำเร็จและข้อจำกัดขนาดอนุญาต ไฟล์รูปภาพสามารถส่งผ่านเส้นทางการทำความเข้าใจสื่อหรือส่งตรงไปยังโมเดลตอบกลับที่รองรับ vision ได้ ส่วนไฟล์อื่นจะถูกเก็บไว้เป็น context ไฟล์ที่ดาวน์โหลดได้ แทนที่จะถือเป็น input รูปภาพ

### ประเภทสื่อที่รองรับ

| ประเภทสื่อ                     | แหล่งที่มา               | พฤติกรรมปัจจุบัน                                                                  | หมายเหตุ                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| รูปภาพ JPEG / PNG / GIF / WebP | URL ไฟล์ Slack       | ดาวน์โหลดและแนบเข้ากับเทิร์นเพื่อการจัดการที่รองรับการมองเห็น                   | ขีดจำกัดต่อไฟล์: `channels.slack.mediaMaxMb` (ค่าเริ่มต้น 20 MB)                 |
| ไฟล์ PDF                      | URL ไฟล์ Slack       | ดาวน์โหลดและเปิดเผยเป็นบริบทไฟล์สำหรับเครื่องมือ เช่น `download-file` หรือ `pdf` | ขาเข้า Slack ไม่แปลง PDF เป็นอินพุตภาพสำหรับการมองเห็นโดยอัตโนมัติ |
| ไฟล์อื่น                    | URL ไฟล์ Slack       | ดาวน์โหลดเมื่อเป็นไปได้ และเปิดเผยเป็นบริบทไฟล์                              | ไฟล์ไบนารีไม่ถูกปฏิบัติเป็นอินพุตภาพ                               |
| การตอบกลับในเธรด                 | ไฟล์ของข้อความเริ่มเธรด | ไฟล์ของข้อความรากสามารถถูกเติมเป็นบริบทได้เมื่อการตอบกลับไม่มีสื่อโดยตรง  | ข้อความเริ่มต้นที่มีเฉพาะไฟล์จะใช้ตัวยึดตำแหน่งไฟล์แนบ                          |
| ข้อความหลายภาพ           | ไฟล์ Slack หลายไฟล์ | แต่ละไฟล์ถูกประเมินแยกกัน                                              | การประมวลผล Slack จำกัดไว้ที่แปดไฟล์ต่อข้อความ                     |

### ไปป์ไลน์ขาเข้า

เมื่อข้อความ Slack ที่มีไฟล์แนบมาถึง:

1. OpenClaw ดาวน์โหลดไฟล์จาก URL ส่วนตัวของ Slack โดยใช้โทเค็นบอต (`xoxb-...`)
2. เมื่อสำเร็จ ไฟล์จะถูกเขียนไปยังที่เก็บสื่อ
3. พาธสื่อที่ดาวน์โหลดและชนิดเนื้อหาจะถูกเพิ่มเข้าในบริบทขาเข้า
4. พาธโมเดล/เครื่องมือที่รองรับรูปภาพสามารถใช้ไฟล์แนบรูปภาพจากบริบทนั้นได้
5. ไฟล์ที่ไม่ใช่รูปภาพยังคงพร้อมใช้งานเป็นเมทาดาทาไฟล์หรือการอ้างอิงสื่อสำหรับเครื่องมือที่จัดการได้

### การสืบทอดไฟล์แนบจากรากของเธรด

เมื่อข้อความมาถึงในเธรด (มีพาเรนต์ `thread_ts`):

- หากการตอบกลับเองไม่มีสื่อโดยตรง และข้อความรากที่รวมมามีไฟล์ Slack สามารถเติมไฟล์รากเป็นบริบทข้อความเริ่มเธรดได้
- ไฟล์แนบของการตอบกลับโดยตรงมีลำดับความสำคัญเหนือไฟล์แนบของข้อความราก
- ข้อความรากที่มีเฉพาะไฟล์และไม่มีข้อความจะแสดงด้วยตัวยึดตำแหน่งไฟล์แนบ เพื่อให้ fallback ยังรวมไฟล์ของข้อความนั้นได้

### การจัดการไฟล์แนบหลายรายการ

เมื่อข้อความ Slack เดียวมีไฟล์แนบหลายรายการ:

- ไฟล์แนบแต่ละรายการถูกประมวลผลแยกกันผ่านไปป์ไลน์สื่อ
- การอ้างอิงสื่อที่ดาวน์โหลดจะถูกรวมเข้าในบริบทข้อความ
- ลำดับการประมวลผลเป็นไปตามลำดับไฟล์ของ Slack ในเพย์โหลดเหตุการณ์
- ความล้มเหลวในการดาวน์โหลดไฟล์แนบรายการหนึ่งจะไม่บล็อกรายการอื่น

### ขนาด การดาวน์โหลด และขีดจำกัดของโมเดล

- **ขีดจำกัดขนาด**: ค่าเริ่มต้น 20 MB ต่อไฟล์ กำหนดค่าได้ผ่าน `channels.slack.mediaMaxMb`
- **ความล้มเหลวในการดาวน์โหลด**: ไฟล์ที่ Slack ให้บริการไม่ได้, URL หมดอายุ, ไฟล์ที่เข้าถึงไม่ได้, ไฟล์เกินขนาด และการตอบสนอง HTML สำหรับการยืนยันตัวตน/เข้าสู่ระบบของ Slack จะถูกข้าม แทนที่จะถูกรายงานว่าเป็นรูปแบบที่ไม่รองรับ
- **โมเดลการมองเห็น**: การวิเคราะห์รูปภาพใช้โมเดลตอบกลับที่ใช้งานอยู่เมื่อรองรับการมองเห็น หรือใช้โมเดลรูปภาพที่กำหนดค่าไว้ที่ `agents.defaults.imageModel`

### ขีดจำกัดที่ทราบ

| สถานการณ์                               | พฤติกรรมปัจจุบัน                                                             | วิธีแก้ไข                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL ไฟล์ Slack หมดอายุ                 | ไฟล์ถูกข้าม; ไม่มีข้อผิดพลาดแสดง                                                 | อัปโหลดไฟล์อีกครั้งใน Slack                                                |
| ไม่ได้กำหนดค่าโมเดลการมองเห็น            | ไฟล์แนบรูปภาพถูกจัดเก็บเป็นการอ้างอิงสื่อ แต่ไม่ได้วิเคราะห์เป็นรูปภาพ | กำหนดค่า `agents.defaults.imageModel` หรือใช้โมเดลตอบกลับที่รองรับการมองเห็น |
| รูปภาพขนาดใหญ่มาก (> 20 MB ตามค่าเริ่มต้น) | ถูกข้ามตามขีดจำกัดขนาด                                                         | เพิ่ม `channels.slack.mediaMaxMb` หาก Slack อนุญาต                       |
| ไฟล์แนบที่ส่งต่อ/แชร์มา           | ข้อความและสื่อรูปภาพ/ไฟล์ที่โฮสต์บน Slack เป็นแบบพยายามให้ดีที่สุด                       | แชร์โดยตรงอีกครั้งในเธรด OpenClaw                                   |
| ไฟล์แนบ PDF                        | จัดเก็บเป็นบริบทไฟล์/สื่อ ไม่ได้ส่งผ่านการมองเห็นรูปภาพโดยอัตโนมัติ  | ใช้ `download-file` สำหรับเมทาดาทาไฟล์ หรือเครื่องมือ `pdf` สำหรับการวิเคราะห์ PDF   |

### เอกสารที่เกี่ยวข้อง

- [ไปป์ไลน์การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
- [เครื่องมือ PDF](/th/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — การเปิดใช้งานการมองเห็นไฟล์แนบ Slack
- การทดสอบถดถอย: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- การยืนยันแบบสด: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Slack กับ gateway
  </Card>
  <Card title="Groups" icon="users" href="/th/channels/groups">
    พฤติกรรมของช่องและ DM แบบกลุ่ม
  </Card>
  <Card title="Channel routing" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="Security" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเสริมความปลอดภัย
  </Card>
  <Card title="Configuration" icon="sliders" href="/th/gateway/configuration">
    โครงร่าง config และลำดับความสำคัญ
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    แคตตาล็อกคำสั่งและพฤติกรรม
  </Card>
</CardGroup>
