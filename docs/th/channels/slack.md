---
read_when:
    - การตั้งค่า Slack หรือการดีบักโหมดซ็อกเก็ต/HTTP ของ Slack
summary: การตั้งค่า Slack และพฤติกรรมขณะรัน (โหมดซ็อกเก็ต + URL คำขอ HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-10T19:24:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbebdd96c28aed547179d89ac5ea86e4c6b3b420aaceff5e7aa491317697db1e
    source_path: channels/slack.md
    workflow: 16
---

พร้อมใช้งานจริงสำหรับ DM และช่องผ่านการผสานรวมแอป Slack โหมดเริ่มต้นคือโหมด Socket และยังรองรับ URL คำขอ HTTP ด้วย

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ Slack ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องและคู่มือการซ่อมแซม
  </Card>
</CardGroup>

## การเลือกโหมด Socket หรือ URL คำขอ HTTP

ทรานสปอร์ตทั้งสองแบบพร้อมใช้งานจริงและมีฟีเจอร์เทียบเท่ากันสำหรับการส่งข้อความ, คำสั่ง Slash, App Home และการโต้ตอบ เลือกตามรูปแบบการดีพลอย ไม่ใช่ตามฟีเจอร์

| ประเด็น                      | โหมด Socket (ค่าเริ่มต้น)                                                                | URL คำขอ HTTP                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| URL Gateway สาธารณะ           | ไม่จำเป็น                                                                         | จำเป็น (DNS, TLS, reverse proxy หรือ tunnel)                                                                   |
| เครือข่ายขาออก             | ต้องเข้าถึง WSS ขาออกไปยัง `wss-primary.slack.com` ได้                            | ไม่มี WS ขาออก; มีเฉพาะ HTTPS ขาเข้า                                                                             |
| โทเค็นที่ต้องใช้                | โทเค็นบอต (`xoxb-...`) + โทเค็นระดับแอป (`xapp-...`) ที่มี `connections:write`       | โทเค็นบอต (`xoxb-...`) + Signing Secret                                                                        |
| แล็ปท็อปสำหรับพัฒนา / อยู่หลังไฟร์วอลล์ | ใช้งานได้ทันที                                                                          | ต้องมี tunnel สาธารณะ (ngrok, Cloudflare Tunnel, Tailscale Funnel) หรือ Gateway สำหรับ staging                          |
| การสเกลแนวนอน           | หนึ่งเซสชันโหมด Socket ต่อแอปต่อโฮสต์; Gateway หลายตัวต้องใช้แอป Slack แยกกัน | ตัวจัดการ POST แบบไร้สถานะ; replica ของ Gateway หลายตัวสามารถแชร์แอปเดียวหลัง load balancer ได้                     |
| หลายบัญชีบน Gateway เดียว | รองรับ; แต่ละบัญชีเปิด WS ของตัวเอง                                             | รองรับ; แต่ละบัญชีต้องมี `webhookPath` ที่ไม่ซ้ำกัน (ค่าเริ่มต้น `/slack/events`) เพื่อให้การลงทะเบียนไม่ชนกัน |
| ทรานสปอร์ตของคำสั่ง Slash      | ส่งผ่านการเชื่อมต่อ WS; `slash_commands[].url` จะถูกละเว้น                  | Slack ส่ง POST ไปยัง `slash_commands[].url`; ต้องมีฟิลด์นี้เพื่อให้คำสั่งถูกส่งต่อ                           |
| การเซ็นคำขอ              | ไม่ใช้ (การยืนยันตัวตนคือโทเค็นระดับแอป)                                               | Slack เซ็นทุกคำขอ; OpenClaw ตรวจสอบด้วย `signingSecret`                                              |
| การกู้คืนเมื่อการเชื่อมต่อหลุด  | Slack SDK เชื่อมต่อใหม่อัตโนมัติ; ใช้การปรับแต่งทรานสปอร์ต pong-timeout ของ Gateway       | ไม่มีการเชื่อมต่อถาวรให้หลุด; Slack retry เป็นรายคำขอ                                           |

<Note>
  **เลือกโหมด Socket** สำหรับโฮสต์ Gateway เดียว, แล็ปท็อปสำหรับพัฒนา และเครือข่าย on-prem ที่เข้าถึง `*.slack.com` ขาออกได้ แต่รับ HTTPS ขาเข้าไม่ได้

**เลือก URL คำขอ HTTP** เมื่อรัน replica ของ Gateway หลายตัวหลัง load balancer, เมื่อ WSS ขาออกถูกบล็อกแต่อนุญาต HTTPS ขาเข้า หรือเมื่อคุณ terminate Webhook ของ Slack ที่ reverse proxy อยู่แล้ว
</Note>

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="โหมด Socket (ค่าเริ่มต้น)">
    <Steps>
      <Step title="สร้างแอป Slack ใหม่">
        เปิด [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → เลือก workspace ของคุณ → วาง manifest ใด manifest หนึ่งด้านล่าง → **Next** → **Create**

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
          **Recommended** ตรงกับชุดฟีเจอร์เต็มของ Plugin Slack ที่มาพร้อมกัน: App Home, คำสั่ง Slash, ไฟล์, reaction, pin, DM กลุ่ม และการอ่าน emoji/usergroup เลือก **Minimal** เมื่อนโยบายของ workspace จำกัด scope โดยครอบคลุม DM, ประวัติช่อง/กลุ่ม, mention และคำสั่ง Slash แต่ตัดไฟล์, reaction, pin, DM กลุ่ม (`mpim:*`), `emoji:read` และ `usergroups:read` ออก ดู [เช็กลิสต์ manifest และ scope](#manifest-and-scope-checklist) สำหรับเหตุผลราย scope และตัวเลือกเพิ่มเติม เช่น คำสั่ง Slash เพิ่มเติม
        </Note>

        หลังจาก Slack สร้างแอปแล้ว:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: เพิ่ม `connections:write`, บันทึก, คัดลอกค่า `xapp-...`
        - **Install App → Install to Workspace**: คัดลอก Bot User OAuth Token `xoxb-...`

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

        fallback ของ env (เฉพาะบัญชีเริ่มต้น):

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

  <Tab title="URL คำขอ HTTP">
    <Steps>
      <Step title="สร้างแอป Slack ใหม่">
        เปิด [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → เลือก workspace ของคุณ → วาง manifest ใด manifest หนึ่งด้านล่าง → แทนที่ `https://gateway-host.example.com/slack/events` ด้วย URL Gateway สาธารณะของคุณ → **Next** → **Create**

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
          **แนะนำ** ตรงกับชุดฟีเจอร์เต็มของ Slack plugin ที่รวมมาให้; **ขั้นต่ำ** ตัดไฟล์ รีแอ็กชัน หมุด group-DM (`mpim:*`), `emoji:read` และ `usergroups:read` ออกสำหรับพื้นที่ทำงานที่มีข้อจำกัดเข้มงวด ดู [รายการตรวจสอบ manifest และ scope](#manifest-and-scope-checklist) สำหรับเหตุผลราย scope
        </Note>

        <Info>
          ฟิลด์ URL ทั้งสาม (`slash_commands[].url`, `event_subscriptions.request_url` และ `interactivity.request_url` / `message_menu_options_url`) ทั้งหมดชี้ไปที่ endpoint เดียวกันของ OpenClaw สคีมา manifest ของ Slack กำหนดให้ตั้งชื่อแยกกัน แต่ OpenClaw กำหนดเส้นทางตามชนิด payload ดังนั้น `webhookPath` เดียว (ค่าเริ่มต้น `/slack/events`) ก็เพียงพอแล้ว Slash commands ที่ไม่มี `slash_commands[].url` จะไม่ทำงานแบบเงียบ ๆ ในโหมด HTTP
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
        ใช้เส้นทาง Webhook ที่ไม่ซ้ำกันสำหรับ HTTP หลายบัญชี

        กำหนด `webhookPath` ที่แตกต่างกันให้แต่ละบัญชี (ค่าเริ่มต้น `/slack/events`) เพื่อให้การลงทะเบียนไม่ชนกัน
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

## การปรับแต่งการขนส่งของ Socket Mode

OpenClaw ตั้งค่า timeout ของ pong สำหรับไคลเอนต์ Slack SDK เป็น 15 วินาทีโดยค่าเริ่มต้นสำหรับ Socket Mode ให้ override การตั้งค่าการขนส่งเฉพาะเมื่อคุณต้องปรับแต่งตามพื้นที่ทำงานหรือโฮสต์เท่านั้น:

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

ใช้สิ่งนี้เฉพาะกับพื้นที่ทำงาน Socket Mode ที่บันทึก timeout ของ Slack websocket pong/server-ping หรือทำงานบนโฮสต์ที่ทราบว่ามีปัญหา event loop starvation `clientPingTimeout` คือเวลารอ pong หลังจาก SDK ส่ง client ping; `serverPingTimeout` คือเวลารอ ping จากเซิร์ฟเวอร์ Slack ข้อความและเหตุการณ์ของแอปยังคงเป็นสถานะแอปพลิเคชัน ไม่ใช่สัญญาณความมีชีวิตของการขนส่ง

## รายการตรวจสอบ manifest และ scope

manifest พื้นฐานของแอป Slack จะเหมือนกันสำหรับ Socket Mode และ HTTP Request URLs เฉพาะบล็อก `settings` (และ `url` ของ slash command) เท่านั้นที่ต่างกัน

manifest พื้นฐาน (ค่าเริ่มต้นของ Socket Mode):

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

สำหรับ **โหมด HTTP Request URLs** ให้แทนที่ `settings` ด้วยรูปแบบ HTTP และเพิ่ม `url` ให้กับ slash command แต่ละรายการ ต้องใช้ URL สาธารณะ:

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

เปิดใช้งานฟีเจอร์ต่าง ๆ ที่ขยายจากค่าเริ่มต้นข้างต้น

manifest เริ่มต้นเปิดใช้งานแท็บ **Home** ของ Slack App Home และสมัครรับ `app_home_opened` เมื่อสมาชิกพื้นที่ทำงานเปิดแท็บ Home, OpenClaw จะเผยแพร่มุมมอง Home เริ่มต้นที่ปลอดภัยด้วย `views.publish`; ไม่มี payload การสนทนาหรือการกำหนดค่าส่วนตัวรวมอยู่ด้วย แท็บ **Messages** ยังคงเปิดใช้งานสำหรับ Slack DMs

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    สามารถใช้ [native slash commands](#commands-and-slash-behavior) หลายรายการแทนคำสั่งที่กำหนดค่าไว้คำสั่งเดียวได้ โดยมีรายละเอียดปลีกย่อยดังนี้:

    - ใช้ `/agentstatus` แทน `/status` เพราะคำสั่ง `/status` ถูกสงวนไว้
    - สามารถเปิดให้ใช้ slash commands ได้พร้อมกันไม่เกิน 25 รายการ

    แทนที่ส่วน `features.slash_commands` เดิมของคุณด้วยชุดย่อยจาก [คำสั่งที่ใช้ได้](/th/tools/slash-commands#command-list):

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
        ใช้รายการ `slash_commands` เดียวกับ Socket Mode ข้างต้น และเพิ่ม `"url": "https://gateway-host.example.com/slack/events"` ให้กับทุกรายการ ตัวอย่าง:

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

        ทำซ้ำค่า `url` นั้นกับทุกคำสั่งในรายการ

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="ขอบเขตผู้เขียนเสริม (การดำเนินการเขียน)">
    เพิ่มขอบเขตบอท `chat:write.customize` หากคุณต้องการให้ข้อความขาออกใช้ตัวตนของเอเจนต์ที่ใช้งานอยู่ (ชื่อผู้ใช้และไอคอนแบบกำหนดเอง) แทนตัวตนเริ่มต้นของแอป Slack

    หากคุณใช้ไอคอนอีโมจิ Slack คาดหวังไวยากรณ์ `:emoji_name:`

  </Accordion>
  <Accordion title="ขอบเขตโทเค็นผู้ใช้เสริม (การดำเนินการอ่าน)">
    หากคุณกำหนดค่า `channels.slack.userToken` ขอบเขตการอ่านทั่วไปคือ:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (หากคุณพึ่งพาการอ่านผ่านการค้นหาของ Slack)

  </Accordion>
</AccordionGroup>

## โมเดลโทเค็น

- `botToken` + `appToken` จำเป็นสำหรับ Socket Mode
- โหมด HTTP ต้องใช้ `botToken` + `signingSecret`
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับสตริงข้อความธรรมดา
  หรือออบเจ็กต์ SecretRef
- โทเค็นในค่ากำหนดจะแทนที่ค่า env สำรอง
- ค่า env สำรอง `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
- `userToken` (`xoxp-...`) กำหนดค่าได้ผ่าน config เท่านั้น (ไม่มีค่า env สำรอง) และมีค่าเริ่มต้นเป็นพฤติกรรมอ่านอย่างเดียว (`userTokenReadOnly: true`)

พฤติกรรมสแนปช็อตสถานะ:

- การตรวจสอบบัญชี Slack ติดตามฟิลด์ `*Source` และ `*Status`
  ต่อข้อมูลประจำตัว (`botToken`, `appToken`, `signingSecret`, `userToken`)
- สถานะคือ `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าผ่าน SecretRef
  หรือแหล่งความลับแบบไม่ฝังในบรรทัดอื่น แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบัน
  ไม่สามารถ resolve ค่าจริงได้
- ในโหมด HTTP จะรวม `signingSecretStatus`; ใน Socket Mode
  คู่ที่จำเป็นคือ `botTokenStatus` + `appTokenStatus`

<Tip>
สำหรับ actions/การอ่านไดเรกทอรี อาจเลือกใช้โทเค็นผู้ใช้ก่อนเมื่อกำหนดค่าไว้ สำหรับการเขียน โทเค็นบอทยังคงถูกเลือกก่อน; การเขียนด้วยโทเค็นผู้ใช้อนุญาตเฉพาะเมื่อ `userTokenReadOnly: false` และโทเค็นบอทไม่พร้อมใช้งาน
</Tip>

## Actions และเกต

actions ของ Slack ถูกควบคุมโดย `channels.slack.actions.*`

กลุ่ม action ที่พร้อมใช้งานในเครื่องมือ Slack ปัจจุบัน:

| กลุ่ม      | ค่าเริ่มต้น |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

actions ข้อความ Slack ปัจจุบันประกอบด้วย `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list` `download-file` รับ ID ไฟล์ Slack ที่แสดงใน placeholder ไฟล์ขาเข้า และส่งคืนตัวอย่างภาพสำหรับรูปภาพหรือเมตาดาต้าไฟล์ภายในเครื่องสำหรับไฟล์ประเภทอื่น

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM `channels.slack.allowFrom` คือ allowlist สำหรับ DM ตาม canonical

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.slack.allowFrom` รวม `"*"`)
    - `disabled`

    แฟล็ก DM:

    - `dm.enabled` (ค่าเริ่มต้น true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (DM กลุ่มมีค่าเริ่มต้น false)
    - `dm.groupChannels` (allowlist MPIM แบบไม่บังคับ)

    ลำดับความสำคัญสำหรับหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่มีชื่อจะสืบทอด `channels.slack.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตัวเอง
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.slack.accounts.default.allowFrom`

    Legacy `channels.slack.dm.policy` และ `channels.slack.dm.allowFrom` ยังคงถูกอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปเป็น `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนแปลงการเข้าถึง

    การจับคู่ใน DM ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="นโยบายช่อง">
    `channels.slack.groupPolicy` ควบคุมการจัดการช่อง:

    - `open`
    - `allowlist`
    - `disabled`

    allowlist ของช่องอยู่ใต้ `channels.slack.channels` และ **ต้องใช้ ID ช่อง Slack ที่เสถียร** (เช่น `C12345678`) เป็นคีย์ใน config

    หมายเหตุรันไทม์: หาก `channels.slack` หายไปทั้งหมด (การตั้งค่าแบบ env เท่านั้น) รันไทม์จะถอยไปใช้ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้ว่า `channels.defaults.groupPolicy` จะถูกตั้งค่าไว้ก็ตาม)

    การ resolve ชื่อ/ID:

    - รายการ allowlist ของช่องและรายการ allowlist ของ DM จะถูก resolve เมื่อเริ่มต้น หากการเข้าถึงด้วยโทเค็นอนุญาต
    - รายการชื่อช่องที่ resolve ไม่ได้จะถูกเก็บไว้ตามที่กำหนดค่า แต่โดยค่าเริ่มต้นจะถูกละเว้นในการกำหนดเส้นทาง
    - การอนุญาตขาเข้าและการกำหนดเส้นทางช่องเป็นแบบ ID-first โดยค่าเริ่มต้น; การจับคู่ชื่อผู้ใช้/slug โดยตรงต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    คีย์ตามชื่อ (`#channel-name` หรือ `channel-name`) **ไม่** ตรงกันภายใต้ `groupPolicy: "allowlist"` การค้นหาช่องเป็นแบบ ID-first โดยค่าเริ่มต้น ดังนั้นคีย์ตามชื่อจะไม่มีวันกำหนดเส้นทางสำเร็จ และข้อความทั้งหมดในช่องนั้นจะถูกบล็อกอย่างเงียบ ๆ สิ่งนี้ต่างจาก `groupPolicy: "open"` ซึ่งไม่จำเป็นต้องใช้คีย์ช่องสำหรับการกำหนดเส้นทาง และคีย์ตามชื่อดูเหมือนว่าจะใช้งานได้

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

  <Tab title="การ mention และผู้ใช้ในช่อง">
    ข้อความในช่องถูกกั้นด้วย mention โดยค่าเริ่มต้น

    แหล่งที่มาของ mention:

    - การ mention แอปโดยชัดแจ้ง (`<@botId>`)
    - การ mention กลุ่มผู้ใช้ Slack (`<!subteam^S...>`) เมื่อผู้ใช้บอทเป็นสมาชิกของกลุ่มผู้ใช้นั้น; ต้องใช้ `usergroups:read`
    - รูปแบบ regex ของ mention (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรมเธรดตอบกลับบอทแบบแฝง (ถูกปิดใช้งานเมื่อ `thread.requireExplicitMention` เป็น `true`)

    การควบคุมต่อช่อง (`channels.slack.channels.<id>`; ชื่อใช้ได้ผ่านการ resolve ตอนเริ่มต้นหรือ `dangerouslyAllowNameMatching` เท่านั้น):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ `toolsBySender`: `id:`, `e164:`, `username:`, `name:` หรือ wildcard `"*"`
      (คีย์ legacy ที่ไม่มี prefix ยังคงแมปไปที่ `id:` เท่านั้น)

    `allowBots` เป็นแบบอนุรักษ์นิยมสำหรับช่องและช่องส่วนตัว: ข้อความในห้องที่เขียนโดยบอทจะถูกรับเฉพาะเมื่อบอทผู้ส่งถูกระบุอย่างชัดเจนใน allowlist `users` ของห้องนั้น หรือเมื่อ ID เจ้าของ Slack ที่ชัดแจ้งอย่างน้อยหนึ่งรายการจาก `channels.slack.allowFrom` เป็นสมาชิกห้องในขณะนั้น wildcard และรายการเจ้าของแบบชื่อที่แสดงไม่ถือว่าเป็นการมีอยู่ของเจ้าของ การมีอยู่ของเจ้าของใช้ Slack `conversations.members`; ตรวจสอบให้แน่ใจว่าแอปมีขอบเขตการอ่านที่ตรงกับประเภทห้อง (`channels:read` สำหรับช่องสาธารณะ, `groups:read` สำหรับช่องส่วนตัว) หากการค้นหาสมาชิกล้มเหลว OpenClaw จะทิ้งข้อความในห้องที่เขียนโดยบอท

  </Tab>
</Tabs>

## เธรด เซสชัน และแท็กตอบกลับ

- DM กำหนดเส้นทางเป็น `direct`; ช่องเป็น `channel`; MPIM เป็น `group`
- การผูกเส้นทาง Slack รับ ID peer ดิบ รวมถึงรูปแบบเป้าหมาย Slack เช่น `channel:C12345678`, `user:U12345678` และ `<@U12345678>`
- ด้วยค่าเริ่มต้น `session.dmScope=main` DM ของ Slack จะถูกรวมเข้ากับเซสชันหลักของเอเจนต์
- เซสชันช่อง: `agent:<agentId>:slack:channel:<channelId>`
- การตอบกลับในเธรดสามารถสร้างส่วนต่อท้ายเซสชันเธรด (`:thread:<threadTs>`) เมื่อใช้ได้
- ในช่องที่ OpenClaw จัดการข้อความระดับบนสุดโดยไม่ต้องการ mention อย่างชัดแจ้ง `replyToMode` ที่ไม่ใช่ `off` จะกำหนดเส้นทาง root ที่จัดการแล้วแต่ละรายการไปยัง `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` เพื่อให้เธรด Slack ที่มองเห็นได้แมปกับเซสชัน OpenClaw เดียวตั้งแต่เทิร์นแรก
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความเธรดที่มีอยู่เดิมซึ่งจะถูกดึงเมื่อเซสชันเธรดใหม่เริ่มต้น (ค่าเริ่มต้น `20`; ตั้งเป็น `0` เพื่อปิดใช้งาน)
- `channels.slack.thread.requireExplicitMention` (ค่าเริ่มต้น `false`): เมื่อเป็น `true` จะระงับ mention เธรดแบบแฝง เพื่อให้บอทตอบเฉพาะ mention `@bot` ที่ชัดแจ้งภายในเธรด แม้ว่าบอทจะเคยเข้าร่วมในเธรดแล้วก็ตาม หากไม่มีค่านี้ การตอบกลับในเธรดที่บอทเข้าร่วมจะข้ามการกั้น `requireMention`

การควบคุมเธรดตอบกลับ:

- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: ต่อ `direct|group|channel`
- fallback legacy สำหรับแชตโดยตรง: `channels.slack.dm.replyToMode`

รองรับแท็กตอบกลับด้วยตนเอง:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

สำหรับการตอบกลับเธรด Slack อย่างชัดแจ้งจากเครื่องมือ `message` ให้ตั้ง `replyBroadcast: true` พร้อม `action: "send"` และ `threadId` หรือ `replyTo` เพื่อขอให้ Slack กระจายการตอบกลับเธรดไปยังช่องแม่ด้วย สิ่งนี้แมปกับแฟล็ก `reply_broadcast` ของ Slack `chat.postMessage` และรองรับเฉพาะการส่งข้อความหรือ Block Kit เท่านั้น ไม่รองรับการอัปโหลดสื่อ

เมื่อการเรียกเครื่องมือ `message` ทำงานภายในเธรด Slack และกำหนดเป้าหมายไปยังช่องเดียวกัน OpenClaw จะสืบทอดเธรด Slack ปัจจุบันตาม `replyToMode` ตามปกติ ตั้ง `topLevel: true` บน `action: "send"` หรือ `action: "upload-file"` เพื่อบังคับให้สร้างข้อความใหม่ในช่องแม่แทน `threadId: null` ถูกรับเป็นการเลือกไม่ใช้ระดับบนสุดแบบเดียวกัน

<Note>
`replyToMode="off"` ปิดใช้งานเธรดตอบกลับ **ทั้งหมด** ใน Slack รวมถึงแท็ก `[[reply_to_*]]` ที่ชัดแจ้ง สิ่งนี้ต่างจาก Telegram ซึ่งแท็กที่ชัดแจ้งยังคงถูกเคารพในโหมด `"off"` เธรด Slack ซ่อนข้อความจากช่อง ขณะที่การตอบกลับของ Telegram ยังคงมองเห็นแบบ inline
</Note>

## ปฏิกิริยารับทราบ

`ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

ลำดับการ resolve:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback อีโมจิตัวตนเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้น "👀")

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"eyes"`)
- ใช้ `""` เพื่อปิดใช้งาน reaction สำหรับบัญชี Slack หรือทั่วทั้งระบบ

## การสตรีมข้อความ

`channels.slack.streaming` ควบคุมพฤติกรรม live preview:

- `off`: ปิดใช้งานการสตรีม live preview
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความ preview ด้วยเอาต์พุตบางส่วนล่าสุด
- `block`: ต่อท้ายการอัปเดต preview เป็นชิ้น ๆ
- `progress`: แสดงข้อความสถานะความคืบหน้าระหว่างสร้าง แล้วจึงส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อ draft preview ทำงานอยู่ ให้กำหนดเส้นทางการอัปเดตเครื่องมือ/ความคืบหน้าเข้าไปในข้อความ preview เดียวกันที่ถูกแก้ไข (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อเก็บข้อความเครื่องมือ/ความคืบหน้าแยกต่างหาก
- `streaming.preview.commandText` / `streaming.progress.commandText`: ตั้งเป็น `status` เพื่อเก็บบรรทัดความคืบหน้าเครื่องมือแบบกระชับขณะซ่อนข้อความคำสั่ง/exec ดิบ (ค่าเริ่มต้น: `raw`)

ซ่อนข้อความคำสั่ง/exec ดิบขณะเก็บบรรทัดความคืบหน้าแบบกระชับ:

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

- เธรดตอบกลับต้องพร้อมใช้งานเพื่อให้การสตรีมข้อความแบบเนทีฟและสถานะเธรดผู้ช่วยของ Slack แสดงขึ้น การเลือกเธรดยังคงเป็นไปตาม `replyToMode`
- รากของช่อง แชตกลุ่ม และ DM ระดับบนสุดยังคงใช้ตัวอย่างแบบร่างปกติได้เมื่อการสตรีมแบบเนทีฟไม่พร้อมใช้งานหรือไม่มีเธรดตอบกลับอยู่
- DM ระดับบนสุดของ Slack จะอยู่นอกเธรดตามค่าเริ่มต้น ดังนั้นจึงไม่แสดงตัวอย่างสตรีม/สถานะแบบเนทีฟลักษณะเธรดของ Slack; OpenClaw จะโพสต์และแก้ไขตัวอย่างแบบร่างใน DM แทน
- เพย์โหลดสื่อและเพย์โหลดที่ไม่ใช่ข้อความจะถอยกลับไปใช้การส่งตามปกติ
- ผลลัพธ์สุดท้ายที่เป็นสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่; ผลลัพธ์สุดท้ายที่เป็นข้อความ/บล็อกและเข้าเกณฑ์จะ flush เฉพาะเมื่อแก้ไขตัวอย่างแทนที่เดิมได้เท่านั้น
- หากการสตรีมล้มเหลวกลางคันระหว่างตอบกลับ OpenClaw จะถอยกลับไปใช้การส่งตามปกติสำหรับเพย์โหลดที่เหลือ

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

คีย์เดิม:

- `channels.slack.streamMode` (`replace | status_final | append`) เป็น alias รันไทม์เดิมสำหรับ `channels.slack.streaming.mode`
- boolean `channels.slack.streaming` เป็น alias รันไทม์เดิมสำหรับ `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport`
- `channels.slack.nativeStreaming` เดิมเป็น alias รันไทม์สำหรับ `channels.slack.streaming.nativeTransport`
- รัน `openclaw doctor --fix` เพื่อเขียน config การสตรีม Slack ที่บันทึกไว้ใหม่เป็นคีย์ตาม canonical

## การถอยกลับของปฏิกิริยากำลังพิมพ์

`typingReaction` เพิ่มปฏิกิริยาชั่วคราวให้ข้อความ Slack ขาเข้าในขณะที่ OpenClaw กำลังประมวลผลคำตอบ จากนั้นลบออกเมื่อการรันเสร็จสิ้น สิ่งนี้มีประโยชน์ที่สุดเมื่ออยู่นอกการตอบกลับในเธรด ซึ่งใช้ตัวบ่งชี้สถานะ "is typing..." ตามค่าเริ่มต้น

ลำดับการ resolve:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"hourglass_flowing_sand"`)
- ปฏิกิริยานี้เป็นแบบ best-effort และจะพยายาม cleanup โดยอัตโนมัติหลังจากเส้นทางการตอบกลับหรือความล้มเหลวเสร็จสิ้น

## สื่อ การแบ่งชิ้น และการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบขาเข้า">
    ไฟล์แนบของ Slack จะถูกดาวน์โหลดจาก URL ส่วนตัวที่โฮสต์โดย Slack (โฟลว์คำขอที่ยืนยันตัวตนด้วยโทเค็น) และเขียนลงใน media store เมื่อ fetch สำเร็จและขีดจำกัดขนาดอนุญาต ตัวยึดตำแหน่งไฟล์มี `fileId` ของ Slack เพื่อให้เอเจนต์ fetch ไฟล์ต้นฉบับด้วย `download-file` ได้

    การดาวน์โหลดใช้ timeout แบบ idle และแบบรวมที่มีขอบเขต หากการดึงไฟล์ Slack ชะงักหรือล้มเหลว OpenClaw จะยังคงประมวลผลข้อความและถอยกลับไปใช้ตัวยึดตำแหน่งไฟล์

    ขีดจำกัดขนาดขาเข้าของรันไทม์มีค่าเริ่มต้นเป็น `20MB` เว้นแต่จะ override ด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="ข้อความและไฟล์ขาออก">
    - ชิ้นข้อความใช้ `channels.slack.textChunkLimit` (ค่าเริ่มต้น 4000)
    - `channels.slack.chunkMode="newline"` เปิดใช้การแยกโดยให้ย่อหน้ามาก่อน
    - การส่งไฟล์ใช้ API อัปโหลดของ Slack และสามารถรวมการตอบกลับในเธรด (`thread_ts`) ได้
    - ขีดจำกัดสื่อขาออกเป็นไปตาม `channels.slack.mediaMaxMb` เมื่อกำหนดค่าไว้; ไม่เช่นนั้นการส่งผ่านช่องจะใช้ค่าเริ่มต้นตามชนิด MIME จาก pipeline สื่อ

  </Accordion>

  <Accordion title="เป้าหมายการส่ง">
    เป้าหมายแบบ explicit ที่แนะนำ:

    - `user:<id>` สำหรับ DM
    - `channel:<id>` สำหรับช่อง

    DM ของ Slack ที่เป็นข้อความ/บล็อกเท่านั้นสามารถโพสต์โดยตรงไปยัง user ID ได้; การอัปโหลดไฟล์และการส่งแบบเธรดจะเปิด DM ผ่าน API การสนทนาของ Slack ก่อน เพราะเส้นทางเหล่านั้นต้องใช้ conversation ID ที่เป็นรูปธรรม

  </Accordion>
</AccordionGroup>

## คำสั่งและพฤติกรรม slash

คำสั่ง slash จะปรากฏใน Slack เป็นคำสั่งที่กำหนดค่าไว้คำสั่งเดียวหรือหลายคำสั่งแบบเนทีฟ กำหนดค่า `channels.slack.slashCommand` เพื่อเปลี่ยนค่าเริ่มต้นของคำสั่ง:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

คำสั่งแบบเนทีฟต้องมี [การตั้งค่า manifest เพิ่มเติม](#additional-manifest-settings) ในแอป Slack ของคุณ และเปิดใช้ด้วย `channels.slack.commands.native: true` หรือ `commands.native: true` ในการกำหนดค่ารวมแทน

- โหมดอัตโนมัติของคำสั่งเนทีฟเป็น **off** สำหรับ Slack ดังนั้น `commands.native: "auto"` จะไม่เปิดใช้คำสั่งเนทีฟของ Slack

```txt
/help
```

เมนูอาร์กิวเมนต์แบบเนทีฟใช้กลยุทธ์การเรนเดอร์แบบปรับตัวได้ ซึ่งแสดง modal ยืนยันก่อน dispatch ค่าตัวเลือกที่เลือก:

- สูงสุด 5 ตัวเลือก: บล็อกปุ่ม
- 6-100 ตัวเลือก: เมนู static select
- มากกว่า 100 ตัวเลือก: external select พร้อมการกรองตัวเลือกแบบ async เมื่อ handler ตัวเลือก interactivity พร้อมใช้งาน
- เกินขีดจำกัดของ Slack: ค่าตัวเลือกที่เข้ารหัสจะถอยกลับไปใช้ปุ่ม

```txt
/think
```

เซสชัน slash ใช้คีย์แยก เช่น `agent:<agentId>:slack:slash:<userId>` และยังคง route การดำเนินคำสั่งไปยังเซสชันการสนทนาเป้าหมายโดยใช้ `CommandTargetSessionKey`

## การตอบกลับแบบโต้ตอบ

Slack สามารถเรนเดอร์ตัวควบคุมการตอบกลับแบบโต้ตอบที่เอเจนต์เขียนได้ แต่ฟีเจอร์นี้ถูกปิดใช้งานตามค่าเริ่มต้น

เปิดใช้แบบรวม:

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

เมื่อเปิดใช้ เอเจนต์สามารถส่ง directive ตอบกลับเฉพาะ Slack ได้:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

directive เหล่านี้ compile เป็น Slack Block Kit และ route การคลิกหรือการเลือกกลับผ่านเส้นทางเหตุการณ์ interaction ของ Slack ที่มีอยู่

หมายเหตุ:

- นี่คือ UI เฉพาะ Slack ช่องอื่นจะไม่แปล directive ของ Slack Block Kit เป็นระบบปุ่มของตัวเอง
- ค่า callback แบบโต้ตอบเป็นโทเค็น opaque ที่ OpenClaw สร้างขึ้น ไม่ใช่ค่าดิบที่เอเจนต์เขียน
- หากบล็อกแบบโต้ตอบที่สร้างขึ้นจะเกินขีดจำกัด Slack Block Kit OpenClaw จะถอยกลับไปใช้การตอบกลับข้อความต้นฉบับแทนการส่งเพย์โหลดบล็อกที่ไม่ถูกต้อง

## การอนุมัติ exec ใน Slack

Slack สามารถทำหน้าที่เป็นไคลเอ็นต์อนุมัติแบบเนทีฟด้วยปุ่มและ interaction แบบโต้ตอบ แทนที่จะถอยกลับไปใช้ Web UI หรือเทอร์มินัล

- การอนุมัติ exec ใช้ `channels.slack.execApprovals.*` สำหรับการ route DM/ช่องแบบเนทีฟ
- การอนุมัติ Plugin ยังสามารถ resolve ผ่านพื้นผิวปุ่มแบบเนทีฟของ Slack เดียวกันได้ เมื่อคำขอนั้นมาถึง Slack อยู่แล้วและชนิด approval id คือ `plugin:`
- การอนุญาตผู้อนุมัติยังคงถูกบังคับใช้: เฉพาะผู้ใช้ที่ระบุว่าเป็นผู้อนุมัติเท่านั้นที่สามารถอนุมัติหรือปฏิเสธคำขอผ่าน Slack ได้

สิ่งนี้ใช้พื้นผิวปุ่มอนุมัติร่วมแบบเดียวกับช่องอื่น เมื่อเปิดใช้ `interactivity` ในการตั้งค่าแอป Slack ของคุณ prompt การอนุมัติจะเรนเดอร์เป็นปุ่ม Block Kit โดยตรงในการสนทนา
เมื่อปุ่มเหล่านั้นปรากฏ ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก; OpenClaw
ควรรวมคำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์เครื่องมือบอกว่าการอนุมัติผ่านแชต
ไม่พร้อมใช้งานหรือการอนุมัติแบบ manual เป็นเส้นทางเดียวเท่านั้น

พาธ config:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; ถอยกลับไปใช้ `commands.ownerAllowFrom` เมื่อเป็นไปได้)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack เปิดใช้การอนุมัติ exec แบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และมี
ผู้อนุมัติอย่างน้อยหนึ่งรายที่ resolve ได้ ตั้งค่า `enabled: false` เพื่อปิดใช้งาน Slack เป็นไคลเอ็นต์อนุมัติแบบเนทีฟอย่างชัดเจน
ตั้งค่า `enabled: true` เพื่อบังคับเปิดการอนุมัติแบบเนทีฟเมื่อ resolve ผู้อนุมัติได้

พฤติกรรมเริ่มต้นเมื่อไม่มี config การอนุมัติ exec ของ Slack แบบ explicit:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

ต้องใช้ config แบบเนทีฟของ Slack ที่ explicit เฉพาะเมื่อคุณต้องการ override ผู้อนุมัติ เพิ่มตัวกรอง หรือ
เลือกใช้การส่งแบบ origin-chat:

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

การ forward `approvals.exec` ร่วมเป็นคนละส่วนกัน ใช้เฉพาะเมื่อ prompt การอนุมัติ exec ต้อง
route ไปยังแชตอื่นหรือเป้าหมาย out-of-band แบบ explicit ด้วย การ forward `approvals.plugin` ร่วมก็
เป็นคนละส่วนกันเช่นกัน; ปุ่มแบบเนทีฟของ Slack ยังคง resolve การอนุมัติ Plugin ได้เมื่อคำขอเหล่านั้นมาถึง
Slack อยู่แล้ว

Same-chat `/approve` ยังทำงานในช่อง Slack และ DM ที่รองรับคำสั่งอยู่แล้ว ดู [การอนุมัติ exec](/th/tools/exec-approvals) สำหรับโมเดลการ forward การอนุมัติฉบับเต็ม

## เหตุการณ์และพฤติกรรมการปฏิบัติงาน

- การแก้ไข/ลบข้อความถูก map เป็นเหตุการณ์ระบบ
- การ broadcast เธรด ("Also send to channel" สำหรับการตอบกลับในเธรด) จะถูกประมวลผลเป็นข้อความผู้ใช้ตามปกติ
- เหตุการณ์เพิ่ม/ลบปฏิกิริยาถูก map เป็นเหตุการณ์ระบบ
- เหตุการณ์สมาชิกเข้าร่วม/ออก ช่องถูกสร้าง/เปลี่ยนชื่อ และเพิ่ม/ลบ pin ถูก map เป็นเหตุการณ์ระบบ
- `channel_id_changed` สามารถ migrate คีย์ config ของช่องได้เมื่อเปิดใช้ `configWrites`
- metadata หัวข้อ/วัตถุประสงค์ของช่องถือเป็นบริบทที่ไม่น่าเชื่อถือและสามารถ inject เข้าไปในบริบทการ routing ได้
- การ seed บริบทของผู้เริ่มเธรดและประวัติเธรดเริ่มต้นจะถูกกรองด้วย allowlist ของผู้ส่งที่กำหนดค่าไว้เมื่อเกี่ยวข้อง
- Block actions และ modal interactions จะ emit เหตุการณ์ระบบ `Slack interaction: ...` แบบมีโครงสร้างพร้อมฟิลด์เพย์โหลดละเอียด:
  - block actions: ค่าที่เลือก, labels, picker values และ metadata `workflow_*`
  - เหตุการณ์ modal `view_submission` และ `view_closed` พร้อม metadata ของช่องที่ route แล้วและ input ของฟอร์ม

## อ้างอิงการกำหนดค่า

อ้างอิงหลัก: [อ้างอิงการกำหนดค่า - Slack](/th/gateway/config-channels#slack)

<Accordion title="ฟิลด์ Slack ที่มีสัญญาณสูง">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (เดิม: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- toggle ความเข้ากันได้: `dangerouslyAllowNameMatching` (break-glass; ปิดไว้เว้นแต่จำเป็น)
- การเข้าถึงช่อง: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- เธรด/ประวัติ: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่ง: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- unfurls: `unfurlLinks`, `unfurlMedia` สำหรับการควบคุมตัวอย่างลิงก์/สื่อของ `chat.postMessage`
- ops/features: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในช่อง">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - allowlist ของช่อง (`channels.slack.channels`) — **คีย์ต้องเป็น channel ID** (`C12345678`) ไม่ใช่ชื่อ (`#channel-name`) คีย์แบบชื่อจะล้มเหลวแบบเงียบภายใต้ `groupPolicy: "allowlist"` เพราะการ routing ช่องเป็นแบบ ID-first ตามค่าเริ่มต้น หากต้องการหา ID: คลิกขวาที่ช่องใน Slack → **Copy link** — ค่า `C...` ที่ท้าย URL คือ channel ID
    - `requireMention`
    - allowlist `users` รายช่อง

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
    - `channels.slack.dmPolicy` (หรือ `channels.slack.dm.policy` เดิม)
    - การอนุมัติการ pair / รายการ allowlist
    - เหตุการณ์ DM ของ Slack Assistant: log แบบ verbose ที่กล่าวถึง `drop message_changed`
      โดยปกติหมายความว่า Slack ส่งเหตุการณ์ Assistant-thread ที่แก้ไขแล้วโดยไม่มี
      ผู้ส่งที่เป็นมนุษย์ซึ่งกู้คืนได้ใน metadata ข้อความ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode ไม่เชื่อมต่อ">
    ตรวจสอบความถูกต้องของ bot + app tokens และการเปิดใช้ Socket Mode ในการตั้งค่าแอป Slack

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` หมายความว่าบัญชี Slack
    ถูกกำหนดค่าแล้ว แต่รันไทม์ปัจจุบันไม่สามารถ resolve ค่า
    ที่อิงกับ SecretRef ได้

  </Accordion>

  <Accordion title="โหมด HTTP ไม่ได้รับเหตุการณ์">
    ตรวจสอบ:

    - signing secret
    - เส้นทาง webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - `webhookPath` ที่ไม่ซ้ำกันต่อบัญชี HTTP

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏในสแนปช็อตบัญชี
    แสดงว่าบัญชี HTTP ได้รับการกำหนดค่าแล้ว แต่ runtime ปัจจุบันไม่สามารถ
    resolve signing secret ที่มี SecretRef รองรับได้

  </Accordion>

  <Accordion title="คำสั่ง Native/slash ไม่ทำงาน">
    ตรวจสอบว่าคุณตั้งใจใช้แบบใด:

    - โหมดคำสั่ง native (`channels.slack.commands.native: true`) พร้อมคำสั่ง slash ที่ตรงกันซึ่งลงทะเบียนไว้ใน Slack
    - หรือโหมดคำสั่ง slash เดี่ยว (`channels.slack.slashCommand.enabled: true`)

    ตรวจสอบ `commands.useAccessGroups` และ allowlist ของช่อง/ผู้ใช้ด้วย

  </Accordion>
</AccordionGroup>

## เอกสารอ้างอิงวิชันสำหรับไฟล์แนบ

Slack สามารถแนบสื่อที่ดาวน์โหลดแล้วเข้ากับรอบการทำงานของเอเจนต์ได้เมื่อการดาวน์โหลดไฟล์ Slack สำเร็จและขีดจำกัดขนาดอนุญาต ไฟล์รูปภาพสามารถส่งผ่านเส้นทางการทำความเข้าใจสื่อหรือส่งตรงไปยังโมเดลตอบกลับที่รองรับวิชันได้ ส่วนไฟล์อื่นๆ จะถูกเก็บไว้เป็นบริบทไฟล์ที่ดาวน์โหลดได้แทนที่จะถูกปฏิบัติเป็นอินพุตรูปภาพ

### ประเภทสื่อที่รองรับ

| ประเภทสื่อ                     | แหล่งที่มา               | พฤติกรรมปัจจุบัน                                                                  | หมายเหตุ                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| รูปภาพ JPEG / PNG / GIF / WebP | URL ไฟล์ Slack       | ดาวน์โหลดและแนบเข้ากับรอบการทำงานสำหรับการจัดการที่รองรับวิชัน                   | ขีดจำกัดต่อไฟล์: `channels.slack.mediaMaxMb` (ค่าเริ่มต้น 20 MB)                 |
| ไฟล์ PDF                      | URL ไฟล์ Slack       | ดาวน์โหลดและเปิดเผยเป็นบริบทไฟล์สำหรับเครื่องมือ เช่น `download-file` หรือ `pdf` | ขาเข้า Slack จะไม่แปลง PDF เป็นอินพุตวิชันรูปภาพโดยอัตโนมัติ |
| ไฟล์อื่นๆ                    | URL ไฟล์ Slack       | ดาวน์โหลดเมื่อทำได้และเปิดเผยเป็นบริบทไฟล์                              | ไฟล์ไบนารีจะไม่ถูกปฏิบัติเป็นอินพุตรูปภาพ                               |
| การตอบกลับในเธรด                 | ไฟล์ของข้อความเริ่มเธรด | ไฟล์ของข้อความรากสามารถถูก hydrate เป็นบริบทเมื่อการตอบกลับไม่มีสื่อโดยตรง  | ตัวเริ่มเธรดที่มีเฉพาะไฟล์จะใช้ placeholder ของไฟล์แนบ                          |
| ข้อความหลายรูปภาพ           | ไฟล์ Slack หลายไฟล์ | แต่ละไฟล์จะถูกประเมินแยกกัน                                              | การประมวลผล Slack จำกัดไว้ที่แปดไฟล์ต่อข้อความ                     |

### Pipeline ขาเข้า

เมื่อข้อความ Slack ที่มีไฟล์แนบมาถึง:

1. OpenClaw ดาวน์โหลดไฟล์จาก URL ส่วนตัวของ Slack โดยใช้โทเค็นบอต (`xoxb-...`)
2. ไฟล์จะถูกเขียนไปยัง media store เมื่อสำเร็จ
3. เส้นทางสื่อที่ดาวน์โหลดแล้วและประเภทเนื้อหาจะถูกเพิ่มในบริบทขาเข้า
4. เส้นทางโมเดล/เครื่องมือที่รองรับรูปภาพสามารถใช้ไฟล์แนบรูปภาพจากบริบทนั้นได้
5. ไฟล์ที่ไม่ใช่รูปภาพยังคงพร้อมใช้งานเป็นเมตาดาต้าไฟล์หรือการอ้างอิงสื่อสำหรับเครื่องมือที่จัดการได้

### การสืบทอดไฟล์แนบจากรากของเธรด

เมื่อข้อความมาถึงในเธรด (มีพาเรนต์ `thread_ts`):

- หากการตอบกลับเองไม่มีสื่อโดยตรงและข้อความรากที่รวมมามีไฟล์ Slack สามารถ hydrate ไฟล์รากเป็นบริบทตัวเริ่มเธรดได้
- ไฟล์แนบของการตอบกลับโดยตรงมีลำดับความสำคัญเหนือไฟล์แนบของข้อความราก
- ข้อความรากที่มีเฉพาะไฟล์และไม่มีข้อความจะแสดงด้วย placeholder ของไฟล์แนบ เพื่อให้ fallback ยังสามารถรวมไฟล์ของข้อความนั้นได้

### การจัดการไฟล์แนบหลายรายการ

เมื่อข้อความ Slack เดียวมีไฟล์แนบหลายรายการ:

- ไฟล์แนบแต่ละรายการจะถูกประมวลผลแยกกันผ่าน pipeline สื่อ
- การอ้างอิงสื่อที่ดาวน์โหลดแล้วจะถูกรวมเข้าในบริบทข้อความ
- ลำดับการประมวลผลเป็นไปตามลำดับไฟล์ของ Slack ใน payload เหตุการณ์
- ความล้มเหลวในการดาวน์โหลดไฟล์แนบรายการหนึ่งจะไม่บล็อกรายการอื่น

### ขีดจำกัดขนาด การดาวน์โหลด และโมเดล

- **ขีดจำกัดขนาด**: ค่าเริ่มต้น 20 MB ต่อไฟล์ กำหนดค่าได้ผ่าน `channels.slack.mediaMaxMb`
- **ความล้มเหลวในการดาวน์โหลด**: ไฟล์ที่ Slack ให้บริการไม่ได้, URL หมดอายุ, ไฟล์ที่เข้าถึงไม่ได้, ไฟล์เกินขนาด และการตอบกลับ HTML สำหรับ auth/login ของ Slack จะถูกข้ามแทนที่จะถูกรายงานว่าเป็นรูปแบบที่ไม่รองรับ
- **โมเดลวิชัน**: การวิเคราะห์รูปภาพใช้โมเดลตอบกลับที่ใช้งานอยู่เมื่อโมเดลนั้นรองรับวิชัน หรือใช้โมเดลรูปภาพที่กำหนดค่าไว้ที่ `agents.defaults.imageModel`

### ขีดจำกัดที่ทราบ

| สถานการณ์                               | พฤติกรรมปัจจุบัน                                                             | วิธีแก้ปัญหาชั่วคราว                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL ไฟล์ Slack หมดอายุ                 | ไฟล์ถูกข้าม; ไม่แสดงข้อผิดพลาด                                                 | อัปโหลดไฟล์อีกครั้งใน Slack                                                |
| ไม่ได้กำหนดค่าโมเดลวิชัน            | ไฟล์แนบรูปภาพถูกเก็บเป็นการอ้างอิงสื่อ แต่ไม่ถูกวิเคราะห์เป็นรูปภาพ | กำหนดค่า `agents.defaults.imageModel` หรือใช้โมเดลตอบกลับที่รองรับวิชัน |
| รูปภาพขนาดใหญ่มาก (> 20 MB ตามค่าเริ่มต้น) | ถูกข้ามตามขีดจำกัดขนาด                                                         | เพิ่ม `channels.slack.mediaMaxMb` หาก Slack อนุญาต                       |
| ไฟล์แนบที่ส่งต่อ/แชร์           | ข้อความและสื่อรูปภาพ/ไฟล์ที่โฮสต์บน Slack เป็นแบบพยายามให้ดีที่สุด                       | แชร์โดยตรงอีกครั้งในเธรด OpenClaw                                   |
| ไฟล์แนบ PDF                        | เก็บเป็นบริบทไฟล์/สื่อ ไม่ได้ส่งผ่านวิชันรูปภาพโดยอัตโนมัติ  | ใช้ `download-file` สำหรับเมตาดาต้าไฟล์ หรือเครื่องมือ `pdf` สำหรับการวิเคราะห์ PDF   |

### เอกสารที่เกี่ยวข้อง

- [Pipeline การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
- [เครื่องมือ PDF](/th/tools/pdf)
- อีพิก: [#51349](https://github.com/openclaw/openclaw/issues/51349) — การเปิดใช้งานวิชันสำหรับไฟล์แนบ Slack
- การทดสอบ regression: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- การตรวจสอบแบบสด: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Slack กับ Gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรมของช่องและ DM กลุ่ม
  </Card>
  <Card title="การกำหนดเส้นทางช่อง" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเสริมความแข็งแกร่ง
  </Card>
  <Card title="การกำหนดค่า" icon="sliders" href="/th/gateway/configuration">
    เลย์เอาต์ config และลำดับความสำคัญ
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    แค็ตตาล็อกคำสั่งและพฤติกรรม
  </Card>
</CardGroup>
