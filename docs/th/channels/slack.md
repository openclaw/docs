---
read_when:
    - การตั้งค่า Slack หรือการดีบักโหมด socket/HTTP ของ Slack
summary: การตั้งค่า Slack และพฤติกรรมขณะรันไทม์ (Socket Mode + URL คำขอ HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-06T17:52:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3afcedca5004c18949206eee2b2620d07a02c76ef663bea80f29ec2591f737b
    source_path: channels/slack.md
    workflow: 16
---

พร้อมใช้งานในระบบจริงสำหรับ DM และช่องต่าง ๆ ผ่านการผสานรวมแอป Slack โหมดเริ่มต้นคือ Socket Mode และรองรับ HTTP Request URLs ด้วย

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ Slack ใช้โหมดจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องและคู่มือการซ่อมแซม
  </Card>
</CardGroup>

## การเลือก Socket Mode หรือ HTTP Request URLs

ทรานสปอร์ตทั้งสองแบบพร้อมใช้งานในระบบจริงและมีความสามารถเทียบเท่ากันสำหรับการส่งข้อความ คำสั่ง Slash, App Home และการโต้ตอบ เลือกตามรูปแบบการปรับใช้ ไม่ใช่ตามฟีเจอร์

| ข้อพิจารณา                      | Socket Mode (ค่าเริ่มต้น)                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| URL Gateway สาธารณะ           | ไม่จำเป็น                                                                         | จำเป็น (DNS, TLS, reverse proxy หรือ tunnel)                                                                   |
| เครือข่ายขาออก             | ต้องเข้าถึง WSS ขาออกไปยัง `wss-primary.slack.com` ได้                            | ไม่มี WS ขาออก; มีเฉพาะ HTTPS ขาเข้า                                                                             |
| โทเค็นที่ต้องใช้                | Bot token (`xoxb-...`) + App-Level Token (`xapp-...`) พร้อม `connections:write`       | Bot token (`xoxb-...`) + Signing Secret                                                                        |
| แล็ปท็อปสำหรับพัฒนา / อยู่หลังไฟร์วอลล์ | ใช้ได้ทันที                                                                          | ต้องมี tunnel สาธารณะ (ngrok, Cloudflare Tunnel, Tailscale Funnel) หรือ Gateway staging                          |
| การขยายแนวนอน           | หนึ่งเซสชัน Socket Mode ต่อแอปต่อโฮสต์; Gateway หลายตัวต้องใช้แอป Slack แยกกัน | ตัวจัดการ POST แบบไร้สถานะ; replica ของ Gateway หลายตัวสามารถใช้แอปเดียวร่วมกันหลัง load balancer                     |
| หลายบัญชีบน Gateway เดียว | รองรับ; แต่ละบัญชีเปิด WS ของตัวเอง                                             | รองรับ; แต่ละบัญชีต้องมี `webhookPath` ไม่ซ้ำกัน (ค่าเริ่มต้น `/slack/events`) เพื่อไม่ให้การลงทะเบียนชนกัน |
| ทรานสปอร์ตคำสั่ง Slash      | ส่งผ่านการเชื่อมต่อ WS; `slash_commands[].url` จะถูกละเว้น                  | Slack ส่ง POST ไปยัง `slash_commands[].url`; ต้องมีฟิลด์นี้เพื่อให้คำสั่งถูกส่งต่อ                           |
| การลงนามคำขอ              | ไม่ใช้ (การยืนยันตัวตนคือ App-Level Token)                                               | Slack ลงนามทุกคำขอ; OpenClaw ตรวจสอบด้วย `signingSecret`                                              |
| การกู้คืนเมื่อการเชื่อมต่อหลุด  | Slack SDK เชื่อมต่อใหม่อัตโนมัติ; การปรับแต่งทรานสปอร์ต pong-timeout ของ gateway มีผล       | ไม่มีการเชื่อมต่อถาวรให้หลุด; การลองใหม่เป็นรายคำขอจาก Slack                                           |

<Note>
  **เลือก Socket Mode** สำหรับโฮสต์ Gateway เดี่ยว แล็ปท็อปสำหรับพัฒนา และเครือข่ายภายในองค์กรที่เข้าถึง `*.slack.com` ขาออกได้แต่รับ HTTPS ขาเข้าไม่ได้

**เลือก HTTP Request URLs** เมื่อรัน replica ของ Gateway หลายตัวหลัง load balancer เมื่อ WSS ขาออกถูกบล็อกแต่ HTTPS ขาเข้าได้รับอนุญาต หรือเมื่อคุณมีการจบ Slack webhooks ที่ reverse proxy อยู่แล้ว
</Note>

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="Socket Mode (ค่าเริ่มต้น)">
    <Steps>
      <Step title="สร้างแอป Slack ใหม่">
        เปิด [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → เลือก workspace ของคุณ → วาง manifest รายการใดรายการหนึ่งด้านล่าง → **Next** → **Create**

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
          **Recommended** ตรงกับชุดฟีเจอร์เต็มของ Slack Plugin ที่รวมมา: App Home, คำสั่ง Slash, ไฟล์, reactions, pins, DM กลุ่ม และการอ่าน emoji/usergroup เลือก **Minimal** เมื่อนโยบายของ workspace จำกัด scopes — ครอบคลุม DM, ประวัติช่อง/กลุ่ม, mentions และคำสั่ง Slash แต่ตัดไฟล์, reactions, pins, group-DM (`mpim:*`), `emoji:read` และ `usergroups:read` ออก ดู [รายการตรวจสอบ manifest และ scope](#manifest-and-scope-checklist) สำหรับเหตุผลราย scope และตัวเลือกแบบเพิ่มได้ เช่น คำสั่ง Slash เพิ่มเติม
        </Note>

        หลังจาก Slack สร้างแอปแล้ว:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: เพิ่ม `connections:write` บันทึก แล้วคัดลอกค่า `xapp-...`
        - **Install App → Install to Workspace**: คัดลอก `xoxb-...` Bot User OAuth Token

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

        Env fallback (เฉพาะบัญชีเริ่มต้น):

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
      <Step title="สร้างแอป Slack ใหม่">
        เปิด [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → เลือก workspace ของคุณ → วาง manifest รายการใดรายการหนึ่งด้านล่าง → แทนที่ `https://gateway-host.example.com/slack/events` ด้วย URL Gateway สาธารณะของคุณ → **Next** → **Create**

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
          **Recommended** ตรงกับชุดฟีเจอร์ทั้งหมดของ Slack Plugin ที่มาพร้อมระบบ; **Minimal** ตัดไฟล์ รีแอ็กชัน พิน DM แบบกลุ่ม (`mpim:*`), `emoji:read` และ `usergroups:read` ออกสำหรับเวิร์กสเปซที่จำกัดสิทธิ์เข้มงวด ดู [รายการตรวจสอบ manifest และ scope](#manifest-and-scope-checklist) สำหรับเหตุผลของแต่ละ scope
        </Note>

        <Info>
          ช่อง URL ทั้งสาม (`slash_commands[].url`, `event_subscriptions.request_url` และ `interactivity.request_url` / `message_menu_options_url`) ชี้ไปยัง endpoint เดียวกันของ OpenClaw schema ของ manifest ใน Slack กำหนดให้ตั้งชื่อแยกกัน แต่ OpenClaw route ตามชนิด payload ดังนั้น `webhookPath` เดียว (ค่าเริ่มต้น `/slack/events`) ก็เพียงพอแล้ว คำสั่ง Slash ที่ไม่มี `slash_commands[].url` จะไม่ทำงานอย่างเงียบ ๆ ในโหมด HTTP
        </Info>

        หลังจาก Slack สร้างแอปแล้ว:

        - **Basic Information → App Credentials**: คัดลอก **Signing Secret** สำหรับการตรวจสอบคำขอ
        - **Install App → Install to Workspace**: คัดลอก Bot User OAuth Token `xoxb-...`

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
        ใช้พาธ Webhook ที่ไม่ซ้ำกันสำหรับ HTTP หลายบัญชี

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

## การปรับแต่งการรับส่งข้อมูล Socket Mode

OpenClaw ตั้งค่า timeout สำหรับ pong ของไคลเอนต์ Slack SDK เป็น 15 วินาทีโดยค่าเริ่มต้นสำหรับ Socket Mode ให้ override การตั้งค่าการรับส่งข้อมูลเฉพาะเมื่อคุณต้องปรับแต่งตามเวิร์กสเปซหรือโฮสต์เท่านั้น:

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

ใช้ตัวเลือกนี้เฉพาะกับเวิร์กสเปซ Socket Mode ที่บันทึก timeout ของ Slack websocket pong/server-ping หรือทำงานบนโฮสต์ที่ทราบว่ามี event loop starvation `clientPingTimeout` คือเวลารอ pong หลังจาก SDK ส่ง client ping; `serverPingTimeout` คือเวลารอ ping จากเซิร์ฟเวอร์ Slack ข้อความและเหตุการณ์ของแอปยังคงเป็นสถานะของแอปพลิเคชัน ไม่ใช่สัญญาณความพร้อมทำงานของการรับส่งข้อมูล

## รายการตรวจสอบ manifest และ scope

manifest พื้นฐานของแอป Slack เหมือนกันสำหรับ Socket Mode และ HTTP Request URLs มีเฉพาะบล็อก `settings` (และ `url` ของคำสั่ง Slash) ที่ต่างกัน

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

สำหรับ **โหมด HTTP Request URLs** ให้แทนที่ `settings` ด้วยตัวแปร HTTP และเพิ่ม `url` ให้คำสั่ง Slash แต่ละรายการ ต้องมี URL สาธารณะ:

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

แสดงฟีเจอร์ต่าง ๆ ที่ขยายจากค่าเริ่มต้นข้างต้น

manifest เริ่มต้นเปิดใช้แท็บ **Home** ของ Slack App Home และสมัครรับ `app_home_opened` เมื่อสมาชิกเวิร์กสเปซเปิดแท็บ Home, OpenClaw จะเผยแพร่มุมมอง Home เริ่มต้นที่ปลอดภัยด้วย `views.publish`; ไม่มี payload การสนทนาหรือการกำหนดค่าส่วนตัวรวมอยู่ด้วย แท็บ **Messages** ยังคงเปิดใช้สำหรับ DM ของ Slack

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    สามารถใช้ [คำสั่ง Slash แบบเนทีฟ](#commands-and-slash-behavior) หลายรายการแทนคำสั่งเดียวที่กำหนดค่าไว้ได้ โดยมีรายละเอียดดังนี้:

    - ใช้ `/agentstatus` แทน `/status` เพราะคำสั่ง `/status` ถูกสงวนไว้
    - สามารถเปิดใช้คำสั่ง Slash ได้พร้อมกันไม่เกิน 25 รายการ

    แทนที่ส่วน `features.slash_commands` เดิมของคุณด้วยชุดย่อยของ [คำสั่งที่พร้อมใช้งาน](/th/tools/slash-commands#command-list):

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
        ใช้รายการ `slash_commands` เดียวกับ Socket Mode ข้างต้น และเพิ่ม `"url": "https://gateway-host.example.com/slack/events"` ให้ทุกรายการ ตัวอย่าง:

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
  <Accordion title="ขอบเขตผู้เขียนแบบเลือกได้ (การดำเนินการเขียน)">
    เพิ่มขอบเขตบอต `chat:write.customize` หากคุณต้องการให้ข้อความขาออกใช้ตัวตนของเอเจนต์ที่ใช้งานอยู่ (ชื่อผู้ใช้และไอคอนแบบกำหนดเอง) แทนตัวตนเริ่มต้นของแอป Slack

    หากคุณใช้ไอคอนอีโมจิ Slack คาดหวังไวยากรณ์แบบ `:emoji_name:`

  </Accordion>
  <Accordion title="ขอบเขตโทเค็นผู้ใช้แบบเลือกได้ (การดำเนินการอ่าน)">
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

- `botToken` + `appToken` จำเป็นสำหรับ Socket Mode
- โหมด HTTP ต้องใช้ `botToken` + `signingSecret`
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับสตริงข้อความธรรมดา
  หรือออบเจ็กต์ SecretRef
- โทเค็นในคอนฟิกจะแทนที่ env fallback
- env fallback ของ `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
- `userToken` (`xoxp-...`) ใช้ได้เฉพาะในคอนฟิก (ไม่มี env fallback) และค่าเริ่มต้นเป็นพฤติกรรมอ่านอย่างเดียว (`userTokenReadOnly: true`)

พฤติกรรมของสแนปช็อตสถานะ:

- การตรวจสอบบัญชี Slack ติดตามฟิลด์ `*Source` และ `*Status`
  ตามข้อมูลรับรองแต่ละรายการ (`botToken`, `appToken`, `signingSecret`, `userToken`)
- สถานะคือ `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าผ่าน SecretRef
  หรือแหล่งซีเคร็ตแบบไม่อินไลน์อื่น แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบัน
  ไม่สามารถ resolve ค่าจริงได้
- ในโหมด HTTP จะรวม `signingSecretStatus`; ใน Socket Mode คู่ที่จำเป็นคือ
  `botTokenStatus` + `appTokenStatus`

<Tip>
สำหรับการดำเนินการ/การอ่านไดเรกทอรี สามารถเลือกใช้โทเค็นผู้ใช้ก่อนเมื่อกำหนดค่าไว้ สำหรับการเขียน โทเค็นบอตยังคงเป็นตัวเลือกที่ต้องการ; การเขียนด้วยโทเค็นผู้ใช้อนุญาตเฉพาะเมื่อ `userTokenReadOnly: false` และโทเค็นบอตไม่พร้อมใช้งาน
</Tip>

## การดำเนินการและเกต

การดำเนินการของ Slack ถูกควบคุมโดย `channels.slack.actions.*`

กลุ่มการดำเนินการที่พร้อมใช้ในเครื่องมือ Slack ปัจจุบัน:

| กลุ่ม      | ค่าเริ่มต้น |
| ---------- | ------- |
| messages   | เปิดใช้ |
| reactions  | เปิดใช้ |
| pins       | เปิดใช้ |
| memberInfo | เปิดใช้ |
| emojiList  | เปิดใช้ |

การดำเนินการข้อความ Slack ปัจจุบันรวมถึง `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list` `download-file` รับ ID ไฟล์ Slack ที่แสดงใน placeholder ไฟล์ขาเข้า และคืนค่าตัวอย่างรูปภาพสำหรับรูปภาพหรือเมทาดาทาไฟล์ภายในเครื่องสำหรับไฟล์ประเภทอื่น

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM `channels.slack.allowFrom` คือ allowlist สำหรับ DM แบบ canonical

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.slack.allowFrom` รวม `"*"`)
    - `disabled`

    แฟล็ก DM:

    - `dm.enabled` (ค่าเริ่มต้นคือ true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (ค่าเริ่มต้นของ DM กลุ่มคือ false)
    - `dm.groupChannels` (allowlist MPIM แบบเลือกได้)

    ลำดับความสำคัญหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่ตั้งชื่อจะสืบทอด `channels.slack.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตัวเอง
    - บัญชีที่ตั้งชื่อจะไม่สืบทอด `channels.slack.accounts.default.allowFrom`

    Legacy `channels.slack.dm.policy` และ `channels.slack.dm.allowFrom` ยังคงถูกอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    การจับคู่ใน DM ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="นโยบายช่อง">
    `channels.slack.groupPolicy` ควบคุมการจัดการช่อง:

    - `open`
    - `allowlist`
    - `disabled`

    allowlist ของช่องอยู่ใต้ `channels.slack.channels` และ **ต้องใช้ ID ช่อง Slack ที่เสถียร** (เช่น `C12345678`) เป็นคีย์คอนฟิก

    หมายเหตุรันไทม์: หาก `channels.slack` หายไปทั้งหมด (การตั้งค่าแบบ env-only) รันไทม์จะ fallback เป็น `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

    การ resolve ชื่อ/ID:

    - รายการ allowlist ของช่องและรายการ allowlist ของ DM จะถูก resolve ตอนเริ่มต้นเมื่อการเข้าถึงโทเค็นอนุญาต
    - รายการชื่อช่องที่ยัง resolve ไม่ได้จะถูกเก็บไว้ตามที่กำหนดค่า แต่ค่าเริ่มต้นจะไม่ใช้สำหรับการกำหนดเส้นทาง
    - การอนุญาตขาเข้าและการกำหนดเส้นทางช่องใช้ ID-first เป็นค่าเริ่มต้น; การจับคู่ชื่อผู้ใช้/slug โดยตรงต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    คีย์ตามชื่อ (`#channel-name` หรือ `channel-name`) **จะไม่** จับคู่ภายใต้ `groupPolicy: "allowlist"` การค้นหาช่องใช้ ID-first เป็นค่าเริ่มต้น ดังนั้นคีย์ตามชื่อจะไม่มีทางกำหนดเส้นทางสำเร็จ และข้อความทั้งหมดในช่องนั้นจะถูกบล็อกแบบเงียบ พฤติกรรมนี้ต่างจาก `groupPolicy: "open"` ซึ่งไม่จำเป็นต้องมีคีย์ช่องสำหรับการกำหนดเส้นทาง และคีย์ตามชื่อจะดูเหมือนใช้งานได้

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

    ไม่ถูกต้อง (ถูกบล็อกแบบเงียบภายใต้ `groupPolicy: "allowlist"`):

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

  <Tab title="การกล่าวถึงและผู้ใช้ช่อง">
    ข้อความช่องถูก gate ด้วยการกล่าวถึงเป็นค่าเริ่มต้น

    แหล่งที่มาของการกล่าวถึง:

    - การกล่าวถึงแอปอย่างชัดเจน (`<@botId>`)
    - การกล่าวถึงกลุ่มผู้ใช้ Slack (`<!subteam^S...>`) เมื่อผู้ใช้บอตเป็นสมาชิกของกลุ่มผู้ใช้นั้น; ต้องใช้ `usergroups:read`
    - รูปแบบ regex สำหรับการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรมเธรดตอบกลับถึงบอตโดยนัย (ปิดใช้งานเมื่อ `thread.requireExplicitMention` เป็น `true`)

    การควบคุมรายช่อง (`channels.slack.channels.<id>`; ชื่อใช้ได้เฉพาะผ่านการ resolve ตอนเริ่มต้นหรือ `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ `toolsBySender`: `id:`, `e164:`, `username:`, `name:` หรือ wildcard `"*"`
      (คีย์ legacy ที่ไม่มี prefix ยังคงแมปไปยัง `id:` เท่านั้น)

    `allowBots` มีแนวทางระมัดระวังสำหรับช่องและช่องส่วนตัว: ข้อความห้องที่เขียนโดยบอตจะถูกรับเฉพาะเมื่อบอตผู้ส่งถูกระบุไว้อย่างชัดเจนใน allowlist `users` ของห้องนั้น หรือเมื่อมี ID เจ้าของ Slack อย่างชัดเจนอย่างน้อยหนึ่งรายการจาก `channels.slack.allowFrom` เป็นสมาชิกห้องอยู่ในขณะนั้น Wildcard และรายการเจ้าของแบบชื่อที่แสดงไม่ถือว่าเป็นการมีอยู่ของเจ้าของ การมีอยู่ของเจ้าของใช้ Slack `conversations.members`; ตรวจสอบให้แน่ใจว่าแอปมีขอบเขตการอ่านที่ตรงกับประเภทห้อง (`channels:read` สำหรับช่องสาธารณะ, `groups:read` สำหรับช่องส่วนตัว) หากการค้นหาสมาชิกล้มเหลว OpenClaw จะทิ้งข้อความห้องที่เขียนโดยบอต

  </Tab>
</Tabs>

## เธรด เซสชัน และแท็กตอบกลับ

- DM กำหนดเส้นทางเป็น `direct`; ช่องเป็น `channel`; MPIM เป็น `group`
- การผูกเส้นทาง Slack รับ ID เพียร์ดิบ รวมถึงรูปแบบเป้าหมาย Slack เช่น `channel:C12345678`, `user:U12345678` และ `<@U12345678>`
- ด้วยค่าเริ่มต้น `session.dmScope=main` DM ของ Slack จะรวมเป็นเซสชันหลักของเอเจนต์
- เซสชันช่อง: `agent:<agentId>:slack:channel:<channelId>`
- การตอบกลับในเธรดสามารถสร้าง suffix ของเซสชันเธรด (`:thread:<threadTs>`) เมื่อใช้ได้
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความเธรดเดิมที่จะดึงเมื่อเซสชันเธรดใหม่เริ่มต้น (ค่าเริ่มต้น `20`; ตั้ง `0` เพื่อปิดใช้งาน)
- `channels.slack.thread.requireExplicitMention` (ค่าเริ่มต้น `false`): เมื่อเป็น `true` จะระงับการกล่าวถึงเธรดโดยนัย เพื่อให้บอตตอบเฉพาะการกล่าวถึง `@bot` อย่างชัดเจนภายในเธรด แม้บอตจะเคยเข้าร่วมเธรดแล้วก็ตาม หากไม่มีค่านี้ การตอบกลับในเธรดที่บอตเข้าร่วมจะข้ามการ gate ของ `requireMention`

การควบคุมเธรดการตอบกลับ:

- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: ต่อ `direct|group|channel`
- fallback legacy สำหรับแชตโดยตรง: `channels.slack.dm.replyToMode`

รองรับแท็กตอบกลับแบบกำหนดเอง:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` ปิดใช้งานเธรดการตอบกลับ **ทั้งหมด** ใน Slack รวมถึงแท็ก `[[reply_to_*]]` ที่ชัดเจนด้วย พฤติกรรมนี้ต่างจาก Telegram ซึ่งแท็กที่ชัดเจนยังคงถูกเคารพในโหมด `"off"` เธรดของ Slack ซ่อนข้อความจากช่อง ในขณะที่การตอบกลับของ Telegram ยังคงมองเห็นแบบอินไลน์
</Note>

## รีแอ็กชัน Ack

`ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

ลำดับการ resolve:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback อีโมจิตัวตนของเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้น "👀")

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"eyes"`)
- ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับบัญชี Slack หรือแบบทั่วทั้งระบบ

## การสตรีมข้อความ

`channels.slack.streaming` ควบคุมพฤติกรรม live preview:

- `off`: ปิดใช้งานการสตรีม live preview
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความ preview ด้วยเอาต์พุตบางส่วนล่าสุด
- `block`: เพิ่มอัปเดต preview แบบแบ่งชิ้นต่อท้าย
- `progress`: แสดงข้อความสถานะความคืบหน้าระหว่างสร้าง แล้วส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อ draft preview ใช้งานอยู่ ให้กำหนดเส้นทางอัปเดต tool/progress เข้าไปยังข้อความ preview เดียวกันที่ถูกแก้ไข (ค่าเริ่มต้น: `true`) ตั้ง `false` เพื่อแยกข้อความ tool/progress
- `streaming.preview.commandText` / `streaming.progress.commandText`: ตั้งเป็น `status` เพื่อคงบรรทัด tool-progress แบบกะทัดรัดไว้ ขณะซ่อนข้อความคำสั่ง/exec ดิบ (ค่าเริ่มต้น: `raw`)

ซ่อนข้อความคำสั่ง/exec ดิบ โดยยังคงบรรทัดความคืบหน้าแบบกะทัดรัด:

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

`channels.slack.streaming.nativeTransport` ควบคุมการสตรีมข้อความ native ของ Slack เมื่อ `channels.slack.streaming.mode` เป็น `partial` (ค่าเริ่มต้น: `true`)

- ต้องมีเธรดตอบกลับพร้อมใช้งานเพื่อให้การสตรีมข้อความ native และสถานะเธรดผู้ช่วยของ Slack ปรากฏ การเลือกเธรดยังคงตาม `replyToMode`
- ช่อง group-chat และรูท DM ระดับบนสุดยังสามารถใช้ draft preview ปกติได้เมื่อ native streaming ไม่พร้อมใช้งานหรือไม่มีเธรดตอบกลับอยู่
- DM ระดับบนสุดของ Slack ยังคงอยู่นอกเธรดเป็นค่าเริ่มต้น ดังนั้นจึงไม่แสดง native stream/status preview แบบสไตล์เธรดของ Slack; OpenClaw จะโพสต์และแก้ไข draft preview ใน DM แทน
- เพย์โหลดสื่อและเพย์โหลดที่ไม่ใช่ข้อความจะ fallback เป็นการส่งมอบปกติ
- ผลลัพธ์สุดท้ายที่เป็นสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไข preview ที่ค้างอยู่; ผลลัพธ์สุดท้ายที่เป็น text/block และเข้าเกณฑ์จะ flush เฉพาะเมื่อสามารถแก้ไข preview เดิมได้
- หากการสตรีมล้มเหลวกลางการตอบกลับ OpenClaw จะ fallback เป็นการส่งมอบปกติสำหรับเพย์โหลดที่เหลือ

ใช้ draft preview แทนการสตรีมข้อความ native ของ Slack:

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

คีย์ legacy:

- `channels.slack.streamMode` (`replace | status_final | append`) เป็นนามแฝงรันไทม์แบบเดิมสำหรับ `channels.slack.streaming.mode`
- บูลีน `channels.slack.streaming` เป็นนามแฝงรันไทม์แบบเดิมสำหรับ `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport`
- `channels.slack.nativeStreaming` แบบเดิมเป็นนามแฝงรันไทม์สำหรับ `channels.slack.streaming.nativeTransport`
- เรียกใช้ `openclaw doctor --fix` เพื่อเขียนการกำหนดค่า Slack streaming ที่คงไว้ใหม่ให้เป็นคีย์มาตรฐาน

## การสำรองปฏิกิริยากำลังพิมพ์

`typingReaction` เพิ่มปฏิกิริยาชั่วคราวให้กับข้อความ Slack ขาเข้าในขณะที่ OpenClaw กำลังประมวลผลการตอบกลับ แล้วลบออกเมื่อการรันเสร็จสิ้น สิ่งนี้มีประโยชน์มากที่สุดนอกการตอบกลับในเธรด ซึ่งใช้ตัวบ่งชี้สถานะเริ่มต้น "กำลังพิมพ์..."

ลำดับการแก้ค่า:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack คาดหวัง shortcode (ตัวอย่างเช่น `"hourglass_flowing_sand"`)
- ปฏิกิริยานี้เป็นแบบพยายามให้ดีที่สุด และจะพยายามล้างข้อมูลโดยอัตโนมัติหลังจากเส้นทางตอบกลับหรือเส้นทางล้มเหลวเสร็จสมบูรณ์

## สื่อ การแบ่งส่วน และการส่งมอบ

<AccordionGroup>
  <Accordion title="Inbound attachments">
    ไฟล์แนบ Slack จะถูกดาวน์โหลดจาก URL ส่วนตัวที่โฮสต์โดย Slack (โฟลว์คำขอที่ยืนยันตัวตนด้วยโทเค็น) และเขียนลงในที่เก็บสื่อเมื่อการดึงข้อมูลสำเร็จและขีดจำกัดขนาดอนุญาต ตัวแทนไฟล์มี `fileId` ของ Slack เพื่อให้เอเจนต์สามารถดึงไฟล์ต้นฉบับด้วย `download-file`

    การดาวน์โหลดใช้ timeout ของเวลาว่างและเวลารวมแบบมีขอบเขต หากการดึงไฟล์ Slack ค้างหรือล้มเหลว OpenClaw จะประมวลผลข้อความต่อไปและถอยกลับไปใช้ตัวแทนไฟล์

    ค่าขีดจำกัดขนาดขาเข้าระหว่างรันไทม์เริ่มต้นเป็น `20MB` เว้นแต่จะถูกแทนที่ด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="Outbound text and files">
    - ส่วนข้อความใช้ `channels.slack.textChunkLimit` (ค่าเริ่มต้น 4000)
    - `channels.slack.chunkMode="newline"` เปิดใช้การแบ่งโดยให้ย่อหน้ามาก่อน
    - การส่งไฟล์ใช้ API อัปโหลดของ Slack และสามารถรวมการตอบกลับในเธรด (`thread_ts`) ได้
    - ขีดจำกัดสื่อขาออกเป็นไปตาม `channels.slack.mediaMaxMb` เมื่อกำหนดค่าไว้ มิฉะนั้นการส่งผ่านช่องจะใช้ค่าเริ่มต้นตามชนิด MIME จากไปป์ไลน์สื่อ

  </Accordion>

  <Accordion title="Delivery targets">
    เป้าหมายที่ระบุอย่างชัดเจนที่แนะนำ:

    - `user:<id>` สำหรับ DM
    - `channel:<id>` สำหรับช่อง

    DM ของ Slack ที่เป็นข้อความ/บล็อกเท่านั้นสามารถโพสต์ไปยัง ID ผู้ใช้ได้โดยตรง ส่วนการอัปโหลดไฟล์และการส่งแบบมีเธรดจะเปิด DM ผ่าน API การสนทนาของ Slack ก่อน เพราะเส้นทางเหล่านั้นต้องใช้ ID การสนทนาที่เป็นรูปธรรม

  </Accordion>
</AccordionGroup>

## คำสั่งและพฤติกรรม slash

คำสั่ง slash จะปรากฏใน Slack เป็นคำสั่งที่กำหนดค่าไว้คำสั่งเดียวหรือเป็นคำสั่ง native หลายคำสั่ง กำหนดค่า `channels.slack.slashCommand` เพื่อเปลี่ยนค่าเริ่มต้นของคำสั่ง:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

คำสั่ง native ต้องใช้ [การตั้งค่า manifest เพิ่มเติม](#additional-manifest-settings) ในแอป Slack ของคุณ และเปิดใช้ด้วย `channels.slack.commands.native: true` หรือ `commands.native: true` ในการกำหนดค่าระดับ global แทน

- โหมดอัตโนมัติของคำสั่ง native ปิดอยู่สำหรับ Slack ดังนั้น `commands.native: "auto"` จะไม่เปิดใช้คำสั่ง native ของ Slack

```txt
/help
```

เมนูอาร์กิวเมนต์ native ใช้กลยุทธ์การแสดงผลแบบปรับตัวได้ ซึ่งแสดงโมดัลยืนยันก่อนส่งค่าตัวเลือกที่เลือก:

- สูงสุด 5 ตัวเลือก: บล็อกปุ่ม
- 6-100 ตัวเลือก: เมนู static select
- มากกว่า 100 ตัวเลือก: external select พร้อมการกรองตัวเลือกแบบ async เมื่อมีตัวจัดการตัวเลือกของ interactivity
- เกินขีดจำกัดของ Slack: ค่าตัวเลือกที่เข้ารหัสจะถอยกลับไปใช้ปุ่ม

```txt
/think
```

เซสชัน slash ใช้คีย์แบบแยก เช่น `agent:<agentId>:slack:slash:<userId>` และยังคง route การดำเนินคำสั่งไปยังเซสชันการสนทนาเป้าหมายโดยใช้ `CommandTargetSessionKey`

## การตอบกลับแบบโต้ตอบ

Slack สามารถแสดงผลตัวควบคุมการตอบกลับแบบโต้ตอบที่เอเจนต์เขียนได้ แต่ฟีเจอร์นี้ถูกปิดโดยค่าเริ่มต้น

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

เมื่อเปิดใช้ เอเจนต์สามารถปล่อย directive การตอบกลับเฉพาะ Slack ได้:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

directive เหล่านี้จะคอมไพล์เป็น Slack Block Kit และ route การคลิกหรือการเลือกกลับผ่านเส้นทางเหตุการณ์ interaction ของ Slack ที่มีอยู่

หมายเหตุ:

- นี่คือ UI เฉพาะ Slack ช่องอื่นจะไม่แปล directive ของ Slack Block Kit เป็นระบบปุ่มของตนเอง
- ค่า callback แบบโต้ตอบเป็นโทเค็นทึบที่ OpenClaw สร้างขึ้น ไม่ใช่ค่าดิบที่เอเจนต์เขียน
- หากบล็อกแบบโต้ตอบที่สร้างขึ้นจะเกินขีดจำกัดของ Slack Block Kit OpenClaw จะถอยกลับไปใช้ข้อความตอบกลับเดิมแทนการส่ง payload บล็อกที่ไม่ถูกต้อง

## การอนุมัติ exec ใน Slack

Slack สามารถทำหน้าที่เป็นไคลเอนต์อนุมัติ native พร้อมปุ่มและ interaction แบบโต้ตอบ แทนการถอยกลับไปใช้ Web UI หรือเทอร์มินัล

- การอนุมัติ exec ใช้ `channels.slack.execApprovals.*` สำหรับการ route DM/ช่องแบบ native
- การอนุมัติ Plugin ยังสามารถแก้ค่าได้ผ่านพื้นผิวปุ่มแบบ Slack-native เดียวกัน เมื่อคำขอนั้นมาถึง Slack อยู่แล้วและชนิด id ของการอนุมัติเป็น `plugin:`
- การอนุญาตผู้อนุมัติยังคงถูกบังคับใช้: เฉพาะผู้ใช้ที่ระบุว่าเป็นผู้อนุมัติเท่านั้นที่สามารถอนุมัติหรือปฏิเสธคำขอผ่าน Slack ได้

สิ่งนี้ใช้พื้นผิวปุ่มอนุมัติร่วมเดียวกันกับช่องอื่น เมื่อเปิดใช้ `interactivity` ในการตั้งค่าแอป Slack ของคุณ พรอมป์การอนุมัติจะแสดงผลเป็นปุ่ม Block Kit โดยตรงในการสนทนา
เมื่อมีปุ่มเหล่านั้นอยู่ ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก OpenClaw
ควรรวมคำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่าการอนุมัติทางแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบ manual เป็นเส้นทางเดียวเท่านั้น

พาธการกำหนดค่า:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; ถอยกลับไปใช้ `commands.ownerAllowFrom` เมื่อทำได้)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack จะเปิดใช้การอนุมัติ exec แบบ native โดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และมีผู้อนุมัติอย่างน้อยหนึ่งรายที่แก้ค่าได้ ตั้งค่า `enabled: false` เพื่อปิดใช้ Slack เป็นไคลเอนต์อนุมัติ native อย่างชัดเจน
ตั้งค่า `enabled: true` เพื่อบังคับเปิดการอนุมัติ native เมื่อผู้อนุมัติแก้ค่าได้

พฤติกรรมเริ่มต้นเมื่อไม่มีการกำหนดค่าการอนุมัติ exec ของ Slack อย่างชัดเจน:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

การกำหนดค่า Slack-native แบบชัดเจนจำเป็นเฉพาะเมื่อคุณต้องการแทนที่ผู้อนุมัติ เพิ่มตัวกรอง หรือ
เลือกใช้การส่งมอบผ่านแชตต้นทาง:

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

การส่งต่อ `approvals.exec` ร่วมเป็นคนละส่วนกัน ใช้เฉพาะเมื่อพรอมป์การอนุมัติ exec ต้อง
route ไปยังแชตอื่นหรือเป้าหมาย out-of-band ที่ระบุอย่างชัดเจนด้วย การส่งต่อ `approvals.plugin` ร่วมก็เป็น
คนละส่วนเช่นกัน ปุ่ม Slack-native ยังสามารถแก้ค่าการอนุมัติ Plugin ได้เมื่อคำขอเหล่านั้นมาถึง
Slack อยู่แล้ว

`/approve` ในแชตเดียวกันยังทำงานในช่อง Slack และ DM ที่รองรับคำสั่งอยู่แล้ว ดู [การอนุมัติ Exec](/th/tools/exec-approvals) สำหรับโมเดลการส่งต่อการอนุมัติฉบับเต็ม

## เหตุการณ์และพฤติกรรมการปฏิบัติการ

- การแก้ไข/ลบข้อความจะถูกแมปเป็นเหตุการณ์ระบบ
- การ broadcast ในเธรด (การตอบกลับเธรดแบบ "ส่งไปยังช่องด้วย") จะถูกประมวลผลเป็นข้อความผู้ใช้ตามปกติ
- เหตุการณ์เพิ่ม/ลบปฏิกิริยาจะถูกแมปเป็นเหตุการณ์ระบบ
- เหตุการณ์สมาชิกเข้าร่วม/ออก ช่องถูกสร้าง/เปลี่ยนชื่อ และเพิ่ม/ลบ pin จะถูกแมปเป็นเหตุการณ์ระบบ
- `channel_id_changed` สามารถย้ายคีย์การกำหนดค่าช่องได้เมื่อเปิดใช้ `configWrites`
- เมทาดาทา topic/purpose ของช่องถือเป็นบริบทที่ไม่น่าเชื่อถือและสามารถถูกฉีดเข้าในบริบทการ route ได้
- ตัวเริ่มเธรดและการตั้งค่าบริบทประวัติเธรดเริ่มต้นจะถูกกรองตาม allowlist ผู้ส่งที่กำหนดค่าไว้เมื่อใช้ได้
- Block actions และ modal interactions ปล่อยเหตุการณ์ระบบ `Slack interaction: ...` แบบมีโครงสร้างพร้อมฟิลด์ payload ที่ครบถ้วน:
  - block actions: ค่าที่เลือก label ค่าของ picker และเมทาดาทา `workflow_*`
  - เหตุการณ์ modal `view_submission` และ `view_closed` พร้อมเมทาดาทาช่องที่ route แล้วและอินพุตฟอร์ม

## เอกสารอ้างอิงการกำหนดค่า

เอกสารอ้างอิงหลัก: [เอกสารอ้างอิงการกำหนดค่า - Slack](/th/gateway/config-channels#slack)

<Accordion title="High-signal Slack fields">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (แบบเดิม: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- toggle ความเข้ากันได้: `dangerouslyAllowNameMatching` (break-glass; ปิดไว้เว้นแต่จำเป็น)
- การเข้าถึงช่อง: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- เธรด/ประวัติ: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- ops/features: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="No replies in channels">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - allowlist ของช่อง (`channels.slack.channels`) — **คีย์ต้องเป็น ID ช่อง** (`C12345678`) ไม่ใช่ชื่อ (`#channel-name`) คีย์ตามชื่อจะล้มเหลวแบบเงียบภายใต้ `groupPolicy: "allowlist"` เพราะการ route ช่องใช้ ID เป็นอันดับแรกโดยค่าเริ่มต้น วิธีหา ID: คลิกขวาที่ช่องใน Slack → **คัดลอกลิงก์** — ค่า `C...` ที่ท้าย URL คือ ID ช่อง
    - `requireMention`
    - allowlist `users` รายช่อง

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
    - `channels.slack.dmPolicy` (หรือแบบเดิม `channels.slack.dm.policy`)
    - การอนุมัติการ pairing / รายการ allowlist
    - เหตุการณ์ DM ของ Slack Assistant: log แบบ verbose ที่กล่าวถึง `drop message_changed`
      มักหมายความว่า Slack ส่งเหตุการณ์เธรด Assistant ที่แก้ไขแล้วโดยไม่มี
      ผู้ส่งที่เป็นมนุษย์ที่กู้คืนได้ในเมทาดาทาข้อความ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    ตรวจสอบ bot + app tokens และการเปิดใช้ Socket Mode ในการตั้งค่าแอป Slack

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` แสดงว่าบัญชี Slack ถูก
    กำหนดค่าไว้แล้ว แต่รันไทม์ปัจจุบันไม่สามารถแก้ค่าที่หนุนด้วย SecretRef ได้

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    ตรวจสอบ:

    - signing secret
    - พาธ Webhook
    - URL คำขอของ Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` ที่ไม่ซ้ำกันต่อบัญชี HTTP

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏใน snapshot
    ของบัญชี แสดงว่าบัญชี HTTP ถูกกำหนดค่าไว้แล้ว แต่รันไทม์ปัจจุบันไม่สามารถ
    แก้ค่า signing secret ที่หนุนด้วย SecretRef ได้

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    ตรวจสอบว่าคุณตั้งใจใช้สิ่งใด:

    - โหมดคำสั่ง native (`channels.slack.commands.native: true`) พร้อมคำสั่ง slash ที่ตรงกันซึ่งลงทะเบียนใน Slack
    - หรือโหมดคำสั่ง slash เดียว (`channels.slack.slashCommand.enabled: true`)

    ตรวจสอบ `commands.useAccessGroups` และ allowlist ของช่อง/ผู้ใช้ด้วย

  </Accordion>
</AccordionGroup>

## เอกสารอ้างอิงวิชันของไฟล์แนบ

Slack สามารถแนบสื่อที่ดาวน์โหลดแล้วเข้ากับรอบของเอเจนต์ได้เมื่อดาวน์โหลดไฟล์จาก Slack สำเร็จและขีดจำกัดขนาดอนุญาต ไฟล์รูปภาพสามารถส่งผ่านเส้นทางการทำความเข้าใจสื่อหรือส่งตรงไปยังโมเดลตอบกลับที่รองรับการมองเห็นได้ ส่วนไฟล์อื่นจะถูกเก็บไว้เป็นบริบทไฟล์ที่ดาวน์โหลดได้ แทนที่จะถูกปฏิบัติเป็นอินพุตรูปภาพ

### ประเภทสื่อที่รองรับ

| ประเภทสื่อ                     | แหล่งที่มา               | พฤติกรรมปัจจุบัน                                                                  | หมายเหตุ                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| รูปภาพ JPEG / PNG / GIF / WebP | Slack file URL       | ดาวน์โหลดและแนบเข้ากับรอบเพื่อการจัดการที่รองรับการมองเห็น                   | ขีดจำกัดต่อไฟล์: `channels.slack.mediaMaxMb` (ค่าเริ่มต้น 20 MB)                 |
| ไฟล์ PDF                      | Slack file URL       | ดาวน์โหลดและเปิดเผยเป็นบริบทไฟล์สำหรับเครื่องมือ เช่น `download-file` หรือ `pdf` | ขาเข้าของ Slack ไม่แปลง PDF เป็นอินพุตการมองเห็นรูปภาพโดยอัตโนมัติ |
| ไฟล์อื่น                    | Slack file URL       | ดาวน์โหลดเมื่อทำได้และเปิดเผยเป็นบริบทไฟล์                              | ไฟล์ไบนารีจะไม่ถูกปฏิบัติเป็นอินพุตรูปภาพ                               |
| การตอบกลับในเธรด                 | ไฟล์ของข้อความเริ่มเธรด | ไฟล์ในข้อความรากสามารถถูกเติมเป็นบริบทได้เมื่อข้อความตอบกลับไม่มีสื่อโดยตรง  | ข้อความเริ่มต้นที่มีเฉพาะไฟล์จะใช้ตัวยึดตำแหน่งไฟล์แนบ                          |
| ข้อความหลายรูปภาพ           | ไฟล์ Slack หลายไฟล์ | แต่ละไฟล์จะถูกประเมินแยกกัน                                              | การประมวลผล Slack จำกัดไว้ที่แปดไฟล์ต่อข้อความ                     |

### ไปป์ไลน์ขาเข้า

เมื่อข้อความ Slack ที่มีไฟล์แนบมาถึง:

1. OpenClaw ดาวน์โหลดไฟล์จาก URL ส่วนตัวของ Slack โดยใช้โทเค็นบอต (`xoxb-...`)
2. เมื่อสำเร็จ ไฟล์จะถูกเขียนไปยังที่เก็บสื่อ
3. เส้นทางสื่อที่ดาวน์โหลดและชนิดเนื้อหาจะถูกเพิ่มลงในบริบทขาเข้า
4. เส้นทางโมเดล/เครื่องมือที่รองรับรูปภาพสามารถใช้ไฟล์แนบรูปภาพจากบริบทนั้นได้
5. ไฟล์ที่ไม่ใช่รูปภาพยังคงพร้อมใช้งานเป็นข้อมูลเมตาของไฟล์หรือการอ้างอิงสื่อสำหรับเครื่องมือที่จัดการได้

### การสืบทอดไฟล์แนบจากรากของเธรด

เมื่อข้อความมาถึงในเธรด (มีพาเรนต์ `thread_ts`):

- หากข้อความตอบกลับเองไม่มีสื่อโดยตรงและข้อความรากที่รวมมามีไฟล์ Slack สามารถเติมไฟล์รากเป็นบริบทของข้อความเริ่มเธรดได้
- ไฟล์แนบโดยตรงในข้อความตอบกลับจะมีลำดับความสำคัญเหนือไฟล์แนบจากข้อความราก
- ข้อความรากที่มีเฉพาะไฟล์และไม่มีข้อความจะถูกแทนด้วยตัวยึดตำแหน่งไฟล์แนบ เพื่อให้ทางเลือกสำรองยังสามารถรวมไฟล์ของข้อความนั้นได้

### การจัดการไฟล์แนบหลายรายการ

เมื่อข้อความ Slack เดียวมีไฟล์แนบหลายรายการ:

- ไฟล์แนบแต่ละรายการจะถูกประมวลผลแยกกันผ่านไปป์ไลน์สื่อ
- การอ้างอิงสื่อที่ดาวน์โหลดแล้วจะถูกรวมไว้ในบริบทข้อความ
- ลำดับการประมวลผลเป็นไปตามลำดับไฟล์ของ Slack ในเพย์โหลดเหตุการณ์
- ความล้มเหลวในการดาวน์โหลดไฟล์แนบหนึ่งรายการจะไม่บล็อกไฟล์อื่น

### ขนาด การดาวน์โหลด และขีดจำกัดของโมเดล

- **ขีดจำกัดขนาด**: ค่าเริ่มต้น 20 MB ต่อไฟล์ กำหนดค่าได้ผ่าน `channels.slack.mediaMaxMb`
- **ความล้มเหลวในการดาวน์โหลด**: ไฟล์ที่ Slack ให้บริการไม่ได้, URL หมดอายุ, ไฟล์ที่เข้าถึงไม่ได้, ไฟล์เกินขนาด และการตอบกลับ HTML สำหรับการยืนยันตัวตน/เข้าสู่ระบบของ Slack จะถูกข้าม แทนที่จะถูกรายงานว่าเป็นรูปแบบที่ไม่รองรับ
- **โมเดลการมองเห็น**: การวิเคราะห์รูปภาพใช้โมเดลตอบกลับที่ใช้งานอยู่เมื่อโมเดลนั้นรองรับการมองเห็น หรือใช้โมเดลรูปภาพที่กำหนดค่าไว้ที่ `agents.defaults.imageModel`

### ข้อจำกัดที่ทราบ

| สถานการณ์                               | พฤติกรรมปัจจุบัน                                                             | วิธีแก้ปัญหา                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Slack file URL หมดอายุ                 | ไฟล์ถูกข้าม; ไม่แสดงข้อผิดพลาด                                                 | อัปโหลดไฟล์ใหม่ใน Slack                                                |
| ยังไม่ได้กำหนดค่าโมเดลการมองเห็น            | ไฟล์แนบรูปภาพถูกเก็บเป็นการอ้างอิงสื่อ แต่ไม่ถูกวิเคราะห์เป็นรูปภาพ | กำหนดค่า `agents.defaults.imageModel` หรือใช้โมเดลตอบกลับที่รองรับการมองเห็น |
| รูปภาพขนาดใหญ่มาก (> 20 MB ตามค่าเริ่มต้น) | ถูกข้ามตามขีดจำกัดขนาด                                                         | เพิ่ม `channels.slack.mediaMaxMb` หาก Slack อนุญาต                       |
| ไฟล์แนบที่ส่งต่อ/แชร์           | ข้อความและสื่อรูปภาพ/ไฟล์ที่โฮสต์บน Slack เป็นแบบ best-effort                       | แชร์ซ้ำโดยตรงในเธรด OpenClaw                                   |
| ไฟล์แนบ PDF                        | เก็บเป็นบริบทไฟล์/สื่อ ไม่ได้ถูกส่งผ่านการมองเห็นรูปภาพโดยอัตโนมัติ  | ใช้ `download-file` สำหรับข้อมูลเมตาของไฟล์ หรือเครื่องมือ `pdf` สำหรับการวิเคราะห์ PDF   |

### เอกสารที่เกี่ยวข้อง

- [ไปป์ไลน์การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
- [เครื่องมือ PDF](/th/tools/pdf)
- มหากาพย์: [#51349](https://github.com/openclaw/openclaw/issues/51349) — การเปิดใช้การมองเห็นสำหรับไฟล์แนบ Slack
- การทดสอบการถดถอย: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- การตรวจสอบแบบสด: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Slack กับ Gateway
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
    โครงร่างการกำหนดค่าและลำดับความสำคัญ
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    แค็ตตาล็อกคำสั่งและพฤติกรรม
  </Card>
</CardGroup>
