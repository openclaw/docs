---
read_when:
    - การตั้งค่า Slack หรือการดีบักโหมดซ็อกเก็ต/HTTP ของ Slack
summary: การตั้งค่า Slack และพฤติกรรมขณะรัน (โหมด Socket + URL คำขอ HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-11T20:21:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34e740fd5cb0ca936edce1843316cde17570d77778bdf4fc761cad77c51ee9cf
    source_path: channels/slack.md
    workflow: 16
---

พร้อมใช้งานจริงสำหรับ DM และช่องทางผ่านการผสานรวมแอป Slack โหมดเริ่มต้นคือ Socket Mode และยังรองรับ HTTP Request URLs ด้วย

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ Slack ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่งสแลช" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและเพลย์บุ๊กการซ่อมแซม
  </Card>
</CardGroup>

## การเลือก Socket Mode หรือ HTTP Request URLs

ทรานสปอร์ตทั้งสองแบบพร้อมใช้งานจริงและมีความสามารถเทียบเท่ากันสำหรับการรับส่งข้อความ คำสั่งสแลช App Home และการโต้ตอบ เลือกตามรูปแบบการปรับใช้ ไม่ใช่ตามฟีเจอร์

| ประเด็น                      | Socket Mode (ค่าเริ่มต้น)                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| URL สาธารณะของ Gateway           | ไม่จำเป็น                                                                         | จำเป็น (DNS, TLS, reverse proxy หรือ tunnel)                                                                   |
| เครือข่ายขาออก             | ต้องเข้าถึง WSS ขาออกไปยัง `wss-primary.slack.com` ได้                            | ไม่มี WS ขาออก มีเฉพาะ HTTPS ขาเข้า                                                                             |
| โทเค็นที่ต้องใช้                | โทเค็นบอต (`xoxb-...`) + App-Level Token (`xapp-...`) พร้อม `connections:write`       | โทเค็นบอต (`xoxb-...`) + Signing Secret                                                                        |
| แล็ปท็อปสำหรับพัฒนา / อยู่หลังไฟร์วอลล์ | ใช้งานได้ทันที                                                                          | ต้องมี tunnel สาธารณะ (ngrok, Cloudflare Tunnel, Tailscale Funnel) หรือ Gateway สำหรับ staging                          |
| การขยายแบบแนวนอน           | หนึ่งเซสชัน Socket Mode ต่อแอปต่อโฮสต์; Gateway หลายตัวต้องใช้แอป Slack แยกกัน | ตัวจัดการ POST แบบ stateless; replica ของ Gateway หลายตัวสามารถใช้แอปเดียวกันหลัง load balancer ได้                     |
| หลายบัญชีบน Gateway เดียว | รองรับ; แต่ละบัญชีเปิด WS ของตัวเอง                                             | รองรับ; แต่ละบัญชีต้องมี `webhookPath` ที่ไม่ซ้ำกัน (ค่าเริ่มต้น `/slack/events`) เพื่อไม่ให้การลงทะเบียนชนกัน |
| ทรานสปอร์ตของคำสั่งสแลช      | ส่งผ่านการเชื่อมต่อ WS; `slash_commands[].url` จะถูกละเว้น                  | Slack ส่ง POST ไปยัง `slash_commands[].url`; จำเป็นต้องมีฟิลด์นี้เพื่อให้คำสั่งถูก dispatch                           |
| การลงนามคำขอ              | ไม่ได้ใช้ (การยืนยันตัวตนคือ App-Level Token)                                               | Slack ลงนามทุกคำขอ; OpenClaw ตรวจสอบด้วย `signingSecret`                                              |
| การกู้คืนเมื่อการเชื่อมต่อหลุด  | Slack SDK เชื่อมต่อใหม่อัตโนมัติ; ใช้การปรับแต่งทรานสปอร์ต pong-timeout ของ gateway       | ไม่มีการเชื่อมต่อถาวรให้หลุด; การลองใหม่เป็นรายคำขอจาก Slack                                           |

<Note>
  **เลือก Socket Mode** สำหรับโฮสต์ Gateway เดี่ยว แล็ปท็อปสำหรับพัฒนา และเครือข่าย on-prem ที่เข้าถึง `*.slack.com` ขาออกได้ แต่รับ HTTPS ขาเข้าไม่ได้

**เลือก HTTP Request URLs** เมื่อรัน replica ของ Gateway หลายตัวหลัง load balancer เมื่อ WSS ขาออกถูกบล็อกแต่ HTTPS ขาเข้าได้รับอนุญาต หรือเมื่อคุณ terminate เว็บฮุก Slack ที่ reverse proxy อยู่แล้ว
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
          **Recommended** ตรงกับชุดฟีเจอร์เต็มของ Slack plugin ที่รวมมาให้: App Home, คำสั่งสแลช, ไฟล์, reactions, pins, DM แบบกลุ่ม และการอ่าน emoji/usergroup เลือก **Minimal** เมื่อนโยบาย workspace จำกัด scope โดยครอบคลุม DM, ประวัติช่องทาง/กลุ่ม, การ mention และคำสั่งสแลช แต่ตัดไฟล์, reactions, pins, group-DM (`mpim:*`), `emoji:read` และ `usergroups:read` ออก ดู [รายการตรวจสอบ manifest และ scope](#manifest-and-scope-checklist) สำหรับเหตุผลของแต่ละ scope และตัวเลือกแบบเพิ่มได้ เช่น คำสั่งสแลชเพิ่มเติม
        </Note>

        หลังจาก Slack สร้างแอปแล้ว:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: เพิ่ม `connections:write` บันทึก แล้วคัดลอกค่า `xapp-...`
        - **Install App → Install to Workspace**: คัดลอก Bot User OAuth Token ค่า `xoxb-...`

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

      <Step title="เริ่ม gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="สร้างแอป Slack ใหม่">
        เปิด [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → เลือก workspace ของคุณ → วาง manifest รายการใดรายการหนึ่งด้านล่าง → แทนที่ `https://gateway-host.example.com/slack/events` ด้วย URL สาธารณะของ Gateway ของคุณ → **Next** → **Create**

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
          **แนะนำ** ตรงกับชุดฟีเจอร์เต็มของ Slack Plugin ที่มาพร้อมแพ็กเกจ; **Minimal** ตัดไฟล์ รีแอ็กชัน หมุด DM แบบกลุ่ม (`mpim:*`), `emoji:read` และ `usergroups:read` ออกสำหรับ workspace ที่มีข้อจำกัด ดูเหตุผลราย scope ได้ที่ [รายการตรวจสอบ manifest และ scope](#manifest-and-scope-checklist)
        </Note>

        <Info>
          ฟิลด์ URL ทั้งสาม (`slash_commands[].url`, `event_subscriptions.request_url` และ `interactivity.request_url` / `message_menu_options_url`) ชี้ไปยัง endpoint เดียวกันของ OpenClaw ทั้งหมด schema ของ manifest ใน Slack กำหนดให้ต้องตั้งชื่อแยกกัน แต่ OpenClaw route ตามชนิด payload ดังนั้น `webhookPath` เดียว (ค่าเริ่มต้น `/slack/events`) ก็เพียงพอแล้ว slash command ที่ไม่มี `slash_commands[].url` จะไม่ทำงานอย่างเงียบ ๆ ในโหมด HTTP
        </Info>

        หลังจาก Slack สร้างแอปแล้ว:

        - **Basic Information → App Credentials**: คัดลอก **Signing Secret** สำหรับตรวจสอบคำขอ
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
        ใช้ webhook path ที่ไม่ซ้ำกันสำหรับ HTTP หลายบัญชี

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

## การปรับแต่งการส่งผ่าน Socket Mode

OpenClaw ตั้งค่า timeout ของ pong ในไคลเอนต์ Slack SDK เป็น 15 วินาทีโดยค่าเริ่มต้นสำหรับ Socket Mode ให้ override การตั้งค่าการส่งผ่านเฉพาะเมื่อคุณต้องปรับแต่งตาม workspace หรือ host เท่านั้น:

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

ใช้ตัวเลือกนี้เฉพาะกับ workspace แบบ Socket Mode ที่บันทึก timeout ของ Slack websocket pong/server-ping หรือทำงานบน host ที่ทราบว่ามีภาวะ event loop starvation `clientPingTimeout` คือเวลารอ pong หลังจาก SDK ส่ง client ping; `serverPingTimeout` คือเวลารอ ping จากเซิร์ฟเวอร์ Slack ข้อความและ event ของแอปยังคงเป็นสถานะของแอปพลิเคชัน ไม่ใช่สัญญาณความพร้อมใช้งานของการส่งผ่าน

## รายการตรวจสอบ manifest และ scope

manifest พื้นฐานของแอป Slack เหมือนกันสำหรับ Socket Mode และ HTTP Request URLs ต่างกันเฉพาะบล็อก `settings` (และ `url` ของ slash command)

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

### การตั้งค่า manifest เพิ่มเติม

แสดงฟีเจอร์ต่าง ๆ ที่ขยายค่าเริ่มต้นด้านบน

The default manifest enables the Slack App Home **Home** tab and subscribes to `app_home_opened`. When a workspace member opens the Home tab, OpenClaw publishes a safe default Home view with `views.publish`; no conversation payload or private configuration is included. The **Messages** tab remains enabled for Slack DMs.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    สามารถใช้ [slash command แบบ native](#commands-and-slash-behavior) หลายคำสั่งแทนคำสั่งเดียวที่กำหนดค่าไว้ได้ โดยมีข้อควรคำนึงดังนี้:

    - ใช้ `/agentstatus` แทน `/status` เพราะคำสั่ง `/status` ถูกสงวนไว้
    - เปิดใช้ slash command พร้อมกันได้ไม่เกิน 25 คำสั่ง

    แทนที่ส่วน `features.slash_commands` เดิมของคุณด้วยชุดย่อยของ [คำสั่งที่ใช้ได้](/th/tools/slash-commands#command-list):

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
  <Accordion title="ขอบเขตการระบุผู้เขียนที่ไม่บังคับ (การดำเนินการเขียน)">
    เพิ่มขอบเขตบอต `chat:write.customize` หากคุณต้องการให้ข้อความขาออกใช้ตัวตนของเอเจนต์ที่ใช้งานอยู่ (ชื่อผู้ใช้และไอคอนแบบกำหนดเอง) แทนตัวตนเริ่มต้นของแอป Slack

    หากคุณใช้ไอคอนอีโมจิ Slack คาดหวังไวยากรณ์แบบ `:emoji_name:`

  </Accordion>
  <Accordion title="ขอบเขตโทเค็นผู้ใช้ที่ไม่บังคับ (การดำเนินการอ่าน)">
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

- `botToken` + `appToken` จำเป็นสำหรับ Socket Mode
- โหมด HTTP ต้องใช้ `botToken` + `signingSecret`
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับค่าสตริง
  ข้อความธรรมดาหรือออบเจ็กต์ SecretRef
- โทเค็นในคอนฟิกจะเขียนทับค่าทดแทนจาก env
- ค่าทดแทน env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
- `userToken` (`xoxp-...`) ใช้ได้เฉพาะในคอนฟิก (ไม่มีค่าทดแทนจาก env) และมีพฤติกรรมเริ่มต้นเป็นอ่านอย่างเดียว (`userTokenReadOnly: true`)

พฤติกรรมสแนปชอตสถานะ:

- การตรวจสอบบัญชี Slack ติดตามฟิลด์ `*Source` และ `*Status`
  ต่อข้อมูลรับรอง (`botToken`, `appToken`, `signingSecret`, `userToken`)
- สถานะคือ `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าผ่าน SecretRef
  หรือแหล่งที่มาความลับแบบไม่ฝังในบรรทัดอื่น แต่คำสั่ง/เส้นทางรันไทม์ปัจจุบัน
  ไม่สามารถแปลงเป็นค่าจริงได้
- ในโหมด HTTP จะรวม `signingSecretStatus`; ใน Socket Mode
  คู่ที่จำเป็นคือ `botTokenStatus` + `appTokenStatus`

<Tip>
สำหรับแอ็กชัน/การอ่านไดเรกทอรี สามารถเลือกใช้โทเค็นผู้ใช้ก่อนเมื่อกำหนดค่าไว้ สำหรับการเขียน โทเค็นบอตยังคงเป็นตัวเลือกหลัก; การเขียนด้วยโทเค็นผู้ใช้จะอนุญาตเฉพาะเมื่อ `userTokenReadOnly: false` และโทเค็นบอตไม่พร้อมใช้งาน
</Tip>

## แอ็กชันและเกต

แอ็กชัน Slack ถูกควบคุมโดย `channels.slack.actions.*`

กลุ่มแอ็กชันที่พร้อมใช้งานในเครื่องมือ Slack ปัจจุบัน:

| กลุ่ม      | ค่าเริ่มต้น |
| ---------- | ------- |
| messages   | เปิดใช้งาน |
| reactions  | เปิดใช้งาน |
| pins       | เปิดใช้งาน |
| memberInfo | เปิดใช้งาน |
| emojiList  | เปิดใช้งาน |

แอ็กชันข้อความ Slack ปัจจุบันรวมถึง `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list` `download-file` รับ ID ไฟล์ Slack ที่แสดงในตัวยึดตำแหน่งไฟล์ขาเข้า และคืนค่าตัวอย่างรูปภาพสำหรับรูปภาพ หรือเมทาดาทาไฟล์ในเครื่องสำหรับไฟล์ชนิดอื่น

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM `channels.slack.allowFrom` คือรายการอนุญาต DM มาตรฐาน

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.slack.allowFrom` รวม `"*"`)
    - `disabled`

    แฟล็ก DM:

    - `dm.enabled` (ค่าเริ่มต้น true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (เดิม)
    - `dm.groupEnabled` (DM กลุ่มมีค่าเริ่มต้นเป็น false)
    - `dm.groupChannels` (รายการอนุญาต MPIM ที่ไม่บังคับ)

    ลำดับความสำคัญหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่มีชื่อจะสืบทอด `channels.slack.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตัวเอง
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.slack.accounts.default.allowFrom`

    `channels.slack.dm.policy` และ `channels.slack.dm.allowFrom` แบบเดิมยังคงถูกอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    การจับคู่ใน DM ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="นโยบายแชนเนล">
    `channels.slack.groupPolicy` ควบคุมการจัดการแชนเนล:

    - `open`
    - `allowlist`
    - `disabled`

    รายการอนุญาตแชนเนลอยู่ภายใต้ `channels.slack.channels` และ **ต้องใช้ ID แชนเนล Slack ที่เสถียร** (ตัวอย่างเช่น `C12345678`) เป็นคีย์คอนฟิก

    หมายเหตุรันไทม์: หาก `channels.slack` หายไปทั้งหมด (การตั้งค่าด้วย env เท่านั้น) รันไทม์จะถอยกลับไปใช้ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

    การแปลงชื่อ/ID:

    - รายการอนุญาตแชนเนลและรายการอนุญาต DM จะถูกแปลงเมื่อเริ่มต้น เมื่อการเข้าถึงโทเค็นอนุญาต
    - รายการชื่อแชนเนลที่แปลงไม่ได้จะถูกเก็บตามที่กำหนดค่าไว้ แต่จะถูกละเว้นสำหรับการกำหนดเส้นทางตามค่าเริ่มต้น
    - การอนุญาตขาเข้าและการกำหนดเส้นทางแชนเนลใช้ ID เป็นหลักตามค่าเริ่มต้น; การจับคู่ชื่อผู้ใช้/slug โดยตรงต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    คีย์ที่อิงตามชื่อ (`#channel-name` หรือ `channel-name`) จะ **ไม่** จับคู่ภายใต้ `groupPolicy: "allowlist"` การค้นหาแชนเนลใช้ ID เป็นหลักตามค่าเริ่มต้น ดังนั้นคีย์ที่อิงตามชื่อจะไม่มีวันกำหนดเส้นทางสำเร็จ และข้อความทั้งหมดในแชนเนลนั้นจะถูกบล็อกอย่างเงียบ ๆ สิ่งนี้แตกต่างจาก `groupPolicy: "open"` ซึ่งไม่ต้องใช้คีย์แชนเนลสำหรับการกำหนดเส้นทาง และคีย์ที่อิงตามชื่อดูเหมือนจะใช้งานได้

    ใช้ ID แชนเนล Slack เป็นคีย์เสมอ วิธีค้นหา: คลิกขวาที่แชนเนลใน Slack → **Copy link** — ID (`C...`) จะปรากฏท้าย URL

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

  <Tab title="การกล่าวถึงและผู้ใช้แชนเนล">
    ข้อความแชนเนลต้องผ่านเกตการกล่าวถึงตามค่าเริ่มต้น

    แหล่งที่มาของการกล่าวถึง:

    - การกล่าวถึงแอปโดยตรง (`<@botId>`)
    - การกล่าวถึงกลุ่มผู้ใช้ Slack (`<!subteam^S...>`) เมื่อผู้ใช้บอตเป็นสมาชิกของกลุ่มผู้ใช้นั้น; ต้องใช้ `usergroups:read`
    - รูปแบบ regex สำหรับการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`, ค่าทดแทน `messages.groupChat.mentionPatterns`)
    - พฤติกรรมเธรดตอบกลับบอตโดยนัย (ปิดใช้งานเมื่อ `thread.requireExplicitMention` เป็น `true`)

    การควบคุมต่อแชนเนล (`channels.slack.channels.<id>`; ชื่อใช้ได้เฉพาะผ่านการแปลงเมื่อเริ่มต้นหรือ `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (รายการอนุญาต)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` หรือไวลด์การ์ด `"*"`
      (คีย์เดิมที่ไม่มีคำนำหน้ายังคงแมปไปที่ `id:` เท่านั้น)

    `allowBots` มีแนวทางแบบระมัดระวังสำหรับแชนเนลและแชนเนลส่วนตัว: ข้อความในห้องที่เขียนโดยบอตจะถูกรับเฉพาะเมื่อบอตผู้ส่งถูกระบุไว้อย่างชัดเจนในรายการอนุญาต `users` ของห้องนั้น หรือเมื่อมี ID เจ้าของ Slack ที่ชัดเจนอย่างน้อยหนึ่งรายการจาก `channels.slack.allowFrom` ที่ขณะนี้เป็นสมาชิกห้องอยู่ ไวลด์การ์ดและรายการเจ้าของแบบชื่อที่แสดงไม่ถือว่ามีเจ้าของอยู่ การมีอยู่ของเจ้าของใช้ Slack `conversations.members`; ตรวจสอบให้แน่ใจว่าแอปมีขอบเขตการอ่านที่ตรงกับชนิดห้อง (`channels:read` สำหรับแชนเนลสาธารณะ, `groups:read` สำหรับแชนเนลส่วนตัว) หากการค้นหาสมาชิกล้มเหลว OpenClaw จะทิ้งข้อความในห้องที่เขียนโดยบอต

  </Tab>
</Tabs>

## เธรด เซสชัน และแท็กตอบกลับ

- DM กำหนดเส้นทางเป็น `direct`; แชนเนลเป็น `channel`; MPIM เป็น `group`
- การผูกเส้นทาง Slack รับ ID เพียร์ดิบ รวมถึงรูปแบบเป้าหมาย Slack เช่น `channel:C12345678`, `user:U12345678` และ `<@U12345678>`
- เมื่อใช้ค่าเริ่มต้น `session.dmScope=main` Slack DM จะยุบรวมเป็นเซสชันหลักของเอเจนต์
- เซสชันแชนเนล: `agent:<agentId>:slack:channel:<channelId>`
- การตอบกลับในเธรดสามารถสร้างส่วนต่อท้ายเซสชันเธรด (`:thread:<threadTs>`) เมื่อใช้ได้
- ในแชนเนลที่ OpenClaw จัดการข้อความระดับบนสุดโดยไม่ต้องกล่าวถึงอย่างชัดเจน `replyToMode` ที่ไม่ใช่ `off` จะกำหนดเส้นทาง root ที่ถูกจัดการแต่ละรายการไปยัง `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` เพื่อให้เธรด Slack ที่มองเห็นได้แมปกับหนึ่งเซสชัน OpenClaw ตั้งแต่เทิร์นแรก
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความเธรดที่มีอยู่ซึ่งจะถูกดึงเมื่อเซสชันเธรดใหม่เริ่มต้น (ค่าเริ่มต้น `20`; ตั้งค่า `0` เพื่อปิดใช้งาน)
- `channels.slack.thread.requireExplicitMention` (ค่าเริ่มต้น `false`): เมื่อเป็น `true` จะระงับการกล่าวถึงเธรดโดยนัย เพื่อให้บอตตอบกลับเฉพาะการกล่าวถึง `@bot` อย่างชัดเจนภายในเธรด แม้บอตจะเคยมีส่วนร่วมในเธรดแล้วก็ตาม หากไม่มีค่านี้ การตอบกลับในเธรดที่บอตมีส่วนร่วมจะข้ามเกต `requireMention`

การควบคุมเธรดตอบกลับ:

- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: ต่อ `direct|group|channel`
- ค่าทดแทนเดิมสำหรับแชตโดยตรง: `channels.slack.dm.replyToMode`

รองรับแท็กตอบกลับแบบกำหนดเอง:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

สำหรับการตอบกลับเธรด Slack อย่างชัดเจนจากเครื่องมือ `message` ให้ตั้งค่า `replyBroadcast: true` พร้อม `action: "send"` และ `threadId` หรือ `replyTo` เพื่อขอให้ Slack เผยแพร่การตอบกลับเธรดไปยังแชนเนลแม่ด้วย ค่านี้แมปกับแฟล็ก `reply_broadcast` ของ `chat.postMessage` ใน Slack และรองรับเฉพาะการส่งข้อความหรือ Block Kit เท่านั้น ไม่รองรับการอัปโหลดสื่อ

เมื่อการเรียกเครื่องมือ `message` ทำงานภายในเธรด Slack และกำหนดเป้าหมายไปยังแชนเนลเดียวกัน โดยปกติ OpenClaw จะสืบทอดเธรด Slack ปัจจุบันตาม `replyToMode` ตั้งค่า `topLevel: true` บน `action: "send"` หรือ `action: "upload-file"` เพื่อบังคับให้เป็นข้อความแชนเนลแม่ใหม่แทน ยอมรับ `threadId: null` เป็นการเลือกไม่ใช้ระดับบนสุดแบบเดียวกัน

<Note>
`replyToMode="off"` ปิดใช้งานเธรดตอบกลับ **ทั้งหมด** ใน Slack รวมถึงแท็ก `[[reply_to_*]]` ที่ชัดเจน สิ่งนี้แตกต่างจาก Telegram ซึ่งแท็กที่ชัดเจนยังคงมีผลในโหมด `"off"` เธรด Slack ซ่อนข้อความจากแชนเนล ขณะที่การตอบกลับใน Telegram ยังคงมองเห็นแบบอินไลน์
</Note>

## รีแอ็กชันรับทราบ

`ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

ลำดับการแปลงค่า:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- อีโมจิสำรองจากตัวตนเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้น "👀")

หมายเหตุ:

- Slack คาดหวัง shortcode (ตัวอย่างเช่น `"eyes"`)
- ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับบัญชี Slack หรือทั่วทั้งระบบ

## การสตรีมข้อความ

`channels.slack.streaming` ควบคุมพฤติกรรมตัวอย่างสด:

- `off`: ปิดใช้งานการสตรีมตัวอย่างสด
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความตัวอย่างด้วยเอาต์พุตบางส่วนล่าสุด
- `block`: ต่อท้ายการอัปเดตตัวอย่างแบบแบ่งชังก์
- `progress`: แสดงข้อความสถานะความคืบหน้าขณะกำลังสร้าง แล้วจึงส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อตัวอย่างฉบับร่างทำงานอยู่ ให้กำหนดเส้นทางการอัปเดตเครื่องมือ/ความคืบหน้าไปยังข้อความตัวอย่างที่แก้ไขเดียวกัน (ค่าเริ่มต้น: `true`) ตั้งค่า `false` เพื่อเก็บข้อความเครื่องมือ/ความคืบหน้าแยกต่างหาก
- `streaming.preview.commandText` / `streaming.progress.commandText`: ตั้งค่าเป็น `status` เพื่อเก็บบรรทัดความคืบหน้าเครื่องมือแบบกะทัดรัด พร้อมซ่อนข้อความคำสั่ง/exec ดิบ (ค่าเริ่มต้น: `raw`)

ซ่อนข้อความคำสั่ง/exec ดิบ พร้อมเก็บบรรทัดความคืบหน้าแบบกะทัดรัดไว้:

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

`channels.slack.streaming.nativeTransport` ควบคุมการสตรีมข้อความเนทีฟของ Slack เมื่อ `channels.slack.streaming.mode` เป็น `partial` (ค่าเริ่มต้น: `true`)

- ต้องมีเธรดตอบกลับสำหรับการสตรีมข้อความแบบเนทีฟและการแสดงสถานะเธรดของ Slack assistant การเลือกเธรดยังคงเป็นไปตาม `replyToMode`
- รากของช่อง, แชทกลุ่ม และ DM ระดับบนสุดยังคงใช้ตัวอย่างแบบร่างปกติได้เมื่อการสตรีมแบบเนทีฟไม่พร้อมใช้งานหรือไม่มีเธรดตอบกลับ
- DM ของ Slack ระดับบนสุดจะอยู่นอกเธรดโดยค่าเริ่มต้น ดังนั้นจึงไม่แสดงตัวอย่างสตรีม/สถานะแบบเนทีฟสไตล์เธรดของ Slack; OpenClaw จะโพสต์และแก้ไขตัวอย่างแบบร่างใน DM แทน
- สื่อและเพย์โหลดที่ไม่ใช่ข้อความจะถอยกลับไปใช้การส่งตามปกติ
- ผลลัพธ์สุดท้ายของสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่; ผลลัพธ์สุดท้ายของข้อความ/บล็อกที่เข้าเกณฑ์จะฟลัชเฉพาะเมื่อสามารถแก้ไขตัวอย่างเดิมได้
- หากการสตรีมล้มเหลวกลางการตอบกลับ OpenClaw จะถอยกลับไปใช้การส่งตามปกติสำหรับเพย์โหลดที่เหลือ

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

- `channels.slack.streamMode` (`replace | status_final | append`) เป็นนามแฝงรันไทม์เดิมของ `channels.slack.streaming.mode`
- boolean `channels.slack.streaming` เป็นนามแฝงรันไทม์เดิมของ `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport`
- `channels.slack.nativeStreaming` เดิมเป็นนามแฝงรันไทม์ของ `channels.slack.streaming.nativeTransport`
- รัน `openclaw doctor --fix` เพื่อเขียนค่าคอนฟิกการสตรีมของ Slack ที่บันทึกไว้ใหม่ให้เป็นคีย์มาตรฐาน

## การถอยกลับของปฏิกิริยากำลังพิมพ์

`typingReaction` เพิ่มปฏิกิริยาชั่วคราวให้กับข้อความ Slack ขาเข้าขณะที่ OpenClaw กำลังประมวลผลการตอบกลับ แล้วลบออกเมื่อการรันเสร็จสิ้น สิ่งนี้มีประโยชน์ที่สุดนอกการตอบกลับในเธรด ซึ่งใช้ตัวบ่งชี้สถานะ "is typing..." เป็นค่าเริ่มต้น

ลำดับการแก้ค่า:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"hourglass_flowing_sand"`)
- ปฏิกิริยาเป็นแบบพยายามให้ดีที่สุด และจะพยายามล้างออกโดยอัตโนมัติหลังเส้นทางการตอบกลับหรือความล้มเหลวเสร็จสิ้น

## สื่อ การแบ่งชิ้น และการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบขาเข้า">
    ไฟล์แนบของ Slack จะถูกดาวน์โหลดจาก URL ส่วนตัวที่โฮสต์โดย Slack (โฟลว์คำขอที่ตรวจสอบสิทธิ์ด้วยโทเค็น) และเขียนลง media store เมื่อดึงสำเร็จและขีดจำกัดขนาดอนุญาต ตัวแทนไฟล์มี `fileId` ของ Slack เพื่อให้ agent ดึงไฟล์ต้นฉบับด้วย `download-file` ได้

    การดาวน์โหลดใช้ timeout แบบจำกัดทั้งเวลาว่างและเวลารวม หากการดึงไฟล์ Slack ค้างหรือล้มเหลว OpenClaw จะประมวลผลข้อความต่อไปและถอยกลับไปใช้ตัวแทนไฟล์

    ขีดจำกัดขนาดขาเข้าของรันไทม์มีค่าเริ่มต้นเป็น `20MB` เว้นแต่จะถูกแทนที่ด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="ข้อความและไฟล์ขาออก">
    - ชิ้นข้อความใช้ `channels.slack.textChunkLimit` (ค่าเริ่มต้น 4000)
    - `channels.slack.chunkMode="newline"` เปิดใช้การแบ่งโดยให้ย่อหน้ามาก่อน
    - การส่งไฟล์ใช้ API อัปโหลดของ Slack และสามารถรวมการตอบกลับในเธรด (`thread_ts`) ได้
    - ขีดจำกัดสื่อขาออกเป็นไปตาม `channels.slack.mediaMaxMb` เมื่อกำหนดค่าไว้; มิฉะนั้นการส่งของช่องจะใช้ค่าเริ่มต้นตามชนิด MIME จาก media pipeline

  </Accordion>

  <Accordion title="เป้าหมายการส่ง">
    เป้าหมายแบบระบุชัดที่แนะนำ:

    - `user:<id>` สำหรับ DM
    - `channel:<id>` สำหรับช่อง

    DM ของ Slack ที่มีเฉพาะข้อความ/บล็อกสามารถโพสต์ไปยัง ID ผู้ใช้โดยตรงได้; การอัปโหลดไฟล์และการส่งในเธรดจะเปิด DM ผ่าน API การสนทนาของ Slack ก่อน เพราะเส้นทางเหล่านั้นต้องใช้ ID การสนทนาที่เป็นรูปธรรม

  </Accordion>
</AccordionGroup>

## คำสั่งและพฤติกรรม slash

คำสั่ง slash จะแสดงใน Slack เป็นคำสั่งที่กำหนดค่าไว้คำสั่งเดียวหรือหลายคำสั่งแบบเนทีฟ กำหนดค่า `channels.slack.slashCommand` เพื่อเปลี่ยนค่าเริ่มต้นของคำสั่ง:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

คำสั่งแบบเนทีฟต้องใช้ [การตั้งค่า manifest เพิ่มเติม](#additional-manifest-settings) ในแอป Slack ของคุณ และเปิดใช้ด้วย `channels.slack.commands.native: true` หรือ `commands.native: true` ในการกำหนดค่าระดับ global แทน

- โหมดอัตโนมัติของคำสั่งแบบเนทีฟจะ **ปิด** สำหรับ Slack ดังนั้น `commands.native: "auto"` จะไม่เปิดใช้คำสั่งแบบเนทีฟของ Slack

```txt
/help
```

เมนูอาร์กิวเมนต์แบบเนทีฟใช้กลยุทธ์การเรนเดอร์แบบปรับตัวที่แสดง modal ยืนยันก่อนส่งค่าตัวเลือกที่เลือก:

- สูงสุด 5 ตัวเลือก: บล็อกปุ่ม
- 6-100 ตัวเลือก: เมนู static select
- มากกว่า 100 ตัวเลือก: external select พร้อมการกรองตัวเลือกแบบ async เมื่อมีตัวจัดการตัวเลือก interactivity
- เกินขีดจำกัดของ Slack: ค่าตัวเลือกที่เข้ารหัสจะถอยกลับไปใช้ปุ่ม

```txt
/think
```

เซสชัน slash ใช้คีย์ที่แยกกัน เช่น `agent:<agentId>:slack:slash:<userId>` และยังคงกำหนดเส้นทางการดำเนินการคำสั่งไปยังเซสชันการสนทนาเป้าหมายโดยใช้ `CommandTargetSessionKey`

## การตอบกลับแบบโต้ตอบ

Slack สามารถเรนเดอร์ตัวควบคุมการตอบกลับแบบโต้ตอบที่ agent เขียนได้ แต่ฟีเจอร์นี้ปิดใช้งานโดยค่าเริ่มต้น

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

เมื่อเปิดใช้ agent สามารถส่ง directive การตอบกลับเฉพาะ Slack ได้:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

directive เหล่านี้จะคอมไพล์เป็น Slack Block Kit และกำหนดเส้นทางการคลิกหรือการเลือกกลับผ่านเส้นทางเหตุการณ์ interaction ของ Slack ที่มีอยู่

หมายเหตุ:

- นี่คือ UI เฉพาะ Slack ช่องอื่นจะไม่แปล directive ของ Slack Block Kit เป็นระบบปุ่มของตนเอง
- ค่า callback แบบโต้ตอบเป็นโทเค็นทึบที่ OpenClaw สร้างขึ้น ไม่ใช่ค่าดิบที่ agent เขียน
- หากบล็อกแบบโต้ตอบที่สร้างขึ้นจะเกินขีดจำกัดของ Slack Block Kit, OpenClaw จะถอยกลับไปใช้ข้อความตอบกลับต้นฉบับแทนการส่งเพย์โหลดบล็อกที่ไม่ถูกต้อง

## การอนุมัติ exec ใน Slack

Slack สามารถทำหน้าที่เป็นไคลเอ็นต์การอนุมัติแบบเนทีฟด้วยปุ่มและ interaction แบบโต้ตอบ แทนการถอยกลับไปใช้ Web UI หรือเทอร์มินัล

- การอนุมัติ exec ใช้ `channels.slack.execApprovals.*` สำหรับการกำหนดเส้นทาง DM/ช่องแบบเนทีฟ
- การอนุมัติ Plugin ยังคงแก้ผ่านพื้นผิวปุ่มแบบเนทีฟของ Slack เดียวกันได้เมื่อคำขอเข้ามาใน Slack อยู่แล้วและชนิด ID การอนุมัติคือ `plugin:`
- การอนุญาตผู้อนุมัติยังคงถูกบังคับใช้: เฉพาะผู้ใช้ที่ระบุว่าเป็นผู้อนุมัติเท่านั้นที่อนุมัติหรือปฏิเสธคำขอผ่าน Slack ได้

สิ่งนี้ใช้พื้นผิวปุ่มการอนุมัติแบบใช้ร่วมกันเดียวกับช่องอื่น เมื่อเปิดใช้ `interactivity` ในการตั้งค่าแอป Slack ของคุณ prompt การอนุมัติจะเรนเดอร์เป็นปุ่ม Block Kit ในการสนทนาโดยตรง
เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก; OpenClaw
ควรรวมคำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือบอกว่าการอนุมัติผ่านแชทไม่พร้อมใช้งาน หรือการอนุมัติแบบ manual เป็นเส้นทางเดียวเท่านั้น

เส้นทางคอนฟิก:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; ถอยกลับไปใช้ `commands.ownerAllowFrom` เมื่อเป็นไปได้)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack จะเปิดใช้การอนุมัติ exec แบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และแก้ผู้อนุมัติได้อย่างน้อยหนึ่งราย
ตั้งค่า `enabled: false` เพื่อปิดใช้งาน Slack เป็นไคลเอ็นต์การอนุมัติแบบเนทีฟอย่างชัดเจน
ตั้งค่า `enabled: true` เพื่อบังคับเปิดการอนุมัติแบบเนทีฟเมื่อแก้ผู้อนุมัติได้

พฤติกรรมเริ่มต้นเมื่อไม่มีคอนฟิกการอนุมัติ exec ของ Slack แบบชัดเจน:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

คอนฟิกแบบเนทีฟของ Slack ที่ชัดเจนจำเป็นเฉพาะเมื่อคุณต้องการแทนที่ผู้อนุมัติ เพิ่มตัวกรอง หรือ
เลือกใช้การส่งไปยังแชทต้นทาง:

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

การส่งต่อ `approvals.exec` แบบใช้ร่วมกันแยกต่างหาก ใช้เฉพาะเมื่อ prompt การอนุมัติ exec ต้องกำหนดเส้นทางไปยังแชทอื่นหรือเป้าหมายนอกแบนด์ที่ระบุชัดด้วย การส่งต่อ `approvals.plugin` แบบใช้ร่วมกันก็
แยกต่างหากเช่นกัน; ปุ่มแบบเนทีฟของ Slack ยังคงแก้การอนุมัติ Plugin ได้เมื่อคำขอเหล่านั้นเข้ามาใน Slack อยู่แล้ว

`/approve` ในแชทเดียวกันยังทำงานในช่องและ DM ของ Slack ที่รองรับคำสั่งอยู่แล้วด้วย ดู [การอนุมัติ exec](/th/tools/exec-approvals) สำหรับโมเดลการส่งต่อการอนุมัติฉบับเต็ม

## เหตุการณ์และพฤติกรรมการดำเนินงาน

- การแก้ไข/ลบข้อความจะถูกแมปเป็นเหตุการณ์ระบบ
- การ broadcast เธรด ("Also send to channel" สำหรับการตอบกลับในเธรด) จะถูกประมวลผลเป็นข้อความผู้ใช้ตามปกติ
- เหตุการณ์เพิ่ม/ลบปฏิกิริยาจะถูกแมปเป็นเหตุการณ์ระบบ
- เหตุการณ์สมาชิกเข้าร่วม/ออก, สร้าง/เปลี่ยนชื่อช่อง และเพิ่ม/ลบ pin จะถูกแมปเป็นเหตุการณ์ระบบ
- `channel_id_changed` สามารถย้ายคีย์คอนฟิกช่องเมื่อเปิดใช้ `configWrites`
- metadata หัวข้อ/วัตถุประสงค์ของช่องจะถูกถือว่าเป็นบริบทที่ไม่น่าเชื่อถือ และสามารถถูกฉีดเข้าสู่บริบทการกำหนดเส้นทางได้
- ตัวเริ่มเธรดและการ seed บริบทประวัติเธรดเริ่มต้นจะถูกกรองโดย allowlist ผู้ส่งที่กำหนดค่าไว้เมื่อเกี่ยวข้อง
- block actions และ modal interactions จะ emit เหตุการณ์ระบบ `Slack interaction: ...` แบบมีโครงสร้างพร้อมฟิลด์เพย์โหลดที่ละเอียด:
  - block actions: ค่าที่เลือก, labels, ค่า picker และ metadata `workflow_*`
  - เหตุการณ์ modal `view_submission` และ `view_closed` พร้อม metadata ช่องที่กำหนดเส้นทางแล้วและอินพุตแบบฟอร์ม

## อ้างอิงการกำหนดค่า

อ้างอิงหลัก: [อ้างอิงการกำหนดค่า - Slack](/th/gateway/config-channels#slack)

<Accordion title="ฟิลด์ Slack ที่มีสัญญาณสูง">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (เดิม: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- สวิตช์ความเข้ากันได้: `dangerouslyAllowNameMatching` (break-glass; ปิดไว้เว้นแต่จำเป็น)
- การเข้าถึงช่อง: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- เธรด/ประวัติ: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่ง: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- unfurls: `unfurlLinks`, `unfurlMedia` สำหรับการควบคุมตัวอย่างลิงก์/สื่อของ `chat.postMessage`
- ops/features: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในช่อง">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - allowlist ของช่อง (`channels.slack.channels`) — **คีย์ต้องเป็น ID ช่อง** (`C12345678`) ไม่ใช่ชื่อ (`#channel-name`) คีย์ตามชื่อจะล้มเหลวแบบเงียบภายใต้ `groupPolicy: "allowlist"` เพราะการกำหนดเส้นทางช่องเป็นแบบ ID มาก่อนโดยค่าเริ่มต้น วิธีหา ID: คลิกขวาที่ช่องใน Slack → **Copy link** — ค่า `C...` ที่ท้าย URL คือ ID ช่อง
    - `requireMention`
    - allowlist `users` ต่อช่อง

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
    - การอนุมัติการจับคู่ / รายการ allowlist
    - เหตุการณ์ DM ของ Slack Assistant: log แบบละเอียดที่กล่าวถึง `drop message_changed`
      โดยปกติหมายความว่า Slack ส่งเหตุการณ์ Assistant-thread ที่แก้ไขแล้วโดยไม่มี
      ผู้ส่งที่เป็นมนุษย์ซึ่งกู้คืนได้ใน metadata ข้อความ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode ไม่เชื่อมต่อ">
    ตรวจสอบ token ของ bot + app และการเปิดใช้ Socket Mode ในการตั้งค่าแอป Slack

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` แสดงว่าบัญชี Slack
    ถูกกำหนดค่าไว้แล้ว แต่รันไทม์ปัจจุบันไม่สามารถแก้ค่า
    ที่รองรับด้วย SecretRef ได้

  </Accordion>

  <Accordion title="โหมด HTTP ไม่ได้รับเหตุการณ์">
    ตรวจสอบ:

    - signing secret
    - เส้นทาง webhook
    - URL คำขอของ Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` ที่ไม่ซ้ำกันต่อบัญชี HTTP

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏในสแนปช็อต
    บัญชี แสดงว่าบัญชี HTTP ถูกกำหนดค่าแล้ว แต่รันไทม์ปัจจุบันไม่สามารถ
    แก้ค่า signing secret ที่อ้างอิงผ่าน SecretRef ได้

  </Accordion>

  <Accordion title="คำสั่ง native/slash ไม่ทำงาน">
    ตรวจสอบว่าคุณตั้งใจใช้:

    - โหมดคำสั่ง native (`channels.slack.commands.native: true`) พร้อมคำสั่ง slash ที่ตรงกันซึ่งลงทะเบียนไว้ใน Slack
    - หรือโหมดคำสั่ง slash เดี่ยว (`channels.slack.slashCommand.enabled: true`)

    ตรวจสอบ `commands.useAccessGroups` และรายการอนุญาตของช่อง/ผู้ใช้ด้วย

  </Accordion>
</AccordionGroup>

## อ้างอิงวิชันสำหรับไฟล์แนบ

Slack สามารถแนบสื่อที่ดาวน์โหลดแล้วเข้ากับรอบของเอเจนต์ได้เมื่อการดาวน์โหลดไฟล์ Slack สำเร็จและขีดจำกัดขนาดอนุญาต ไฟล์รูปภาพสามารถส่งผ่านเส้นทางการทำความเข้าใจสื่อหรือส่งตรงไปยังโมเดลตอบกลับที่รองรับวิชันได้ ส่วนไฟล์อื่นจะถูกเก็บไว้เป็นบริบทไฟล์ที่ดาวน์โหลดได้แทนที่จะถือเป็นอินพุตรูปภาพ

### ประเภทสื่อที่รองรับ

| ประเภทสื่อ                     | แหล่งที่มา               | พฤติกรรมปัจจุบัน                                                                  | หมายเหตุ                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| รูปภาพ JPEG / PNG / GIF / WebP | URL ไฟล์ Slack       | ดาวน์โหลดและแนบเข้ากับรอบเพื่อการจัดการที่รองรับวิชัน                   | ขีดจำกัดต่อไฟล์: `channels.slack.mediaMaxMb` (ค่าเริ่มต้น 20 MB)                 |
| ไฟล์ PDF                      | URL ไฟล์ Slack       | ดาวน์โหลดและเปิดเผยเป็นบริบทไฟล์สำหรับเครื่องมือ เช่น `download-file` หรือ `pdf` | ขาเข้าของ Slack ไม่แปลง PDF เป็นอินพุตวิชันรูปภาพโดยอัตโนมัติ |
| ไฟล์อื่น                    | URL ไฟล์ Slack       | ดาวน์โหลดเมื่อทำได้และเปิดเผยเป็นบริบทไฟล์                              | ไฟล์ไบนารีจะไม่ถูกถือเป็นอินพุตรูปภาพ                               |
| การตอบกลับในเธรด                 | ไฟล์ของข้อความเริ่มเธรด | ไฟล์จากข้อความรากสามารถถูกเติมเป็นบริบทได้เมื่อการตอบกลับไม่มีสื่อโดยตรง  | ข้อความเริ่มต้นที่มีเฉพาะไฟล์จะใช้ตัวยึดตำแหน่งไฟล์แนบ                          |
| ข้อความหลายรูปภาพ           | ไฟล์ Slack หลายไฟล์ | แต่ละไฟล์จะถูกประเมินแยกกัน                                              | การประมวลผลของ Slack จำกัดไว้ที่แปดไฟล์ต่อข้อความ                     |

### ไปป์ไลน์ขาเข้า

เมื่อข้อความ Slack ที่มีไฟล์แนบมาถึง:

1. OpenClaw ดาวน์โหลดไฟล์จาก URL ส่วนตัวของ Slack โดยใช้โทเคนบอต (`xoxb-...`)
2. ไฟล์จะถูกเขียนลงในที่เก็บสื่อเมื่อสำเร็จ
3. เส้นทางสื่อที่ดาวน์โหลดแล้วและชนิดเนื้อหาจะถูกเพิ่มในบริบทขาเข้า
4. เส้นทางโมเดล/เครื่องมือที่รองรับรูปภาพสามารถใช้ไฟล์แนบรูปภาพจากบริบทนั้นได้
5. ไฟล์ที่ไม่ใช่รูปภาพยังคงพร้อมใช้งานเป็นเมทาดาทาไฟล์หรือการอ้างอิงสื่อสำหรับเครื่องมือที่จัดการไฟล์เหล่านั้นได้

### การสืบทอดไฟล์แนบจากรากของเธรด

เมื่อข้อความมาถึงในเธรด (มีพาเรนต์ `thread_ts`):

- หากการตอบกลับนั้นไม่มีสื่อโดยตรง และข้อความรากที่รวมมามีไฟล์ Slack สามารถเติมไฟล์รากเป็นบริบทเริ่มต้นของเธรดได้
- ไฟล์แนบของการตอบกลับโดยตรงจะมีลำดับความสำคัญเหนือไฟล์แนบของข้อความราก
- ข้อความรากที่มีเฉพาะไฟล์และไม่มีข้อความจะแสดงด้วยตัวยึดตำแหน่งไฟล์แนบเพื่อให้ทางเลือกสำรองยังรวมไฟล์ของข้อความนั้นได้

### การจัดการไฟล์แนบหลายรายการ

เมื่อข้อความ Slack เดียวมีไฟล์แนบหลายไฟล์:

- แต่ละไฟล์แนบจะถูกประมวลผลแยกกันผ่านไปป์ไลน์สื่อ
- การอ้างอิงสื่อที่ดาวน์โหลดแล้วจะถูกรวมเข้าในบริบทข้อความ
- ลำดับการประมวลผลเป็นไปตามลำดับไฟล์ของ Slack ในเพย์โหลดเหตุการณ์
- ความล้มเหลวในการดาวน์โหลดไฟล์แนบหนึ่งรายการจะไม่บล็อกไฟล์อื่น

### ขีดจำกัดขนาด การดาวน์โหลด และโมเดล

- **ขีดจำกัดขนาด**: ค่าเริ่มต้น 20 MB ต่อไฟล์ กำหนดค่าได้ผ่าน `channels.slack.mediaMaxMb`
- **ความล้มเหลวในการดาวน์โหลด**: ไฟล์ที่ Slack ให้บริการไม่ได้, URL หมดอายุ, ไฟล์ที่เข้าถึงไม่ได้, ไฟล์เกินขนาด และการตอบกลับ HTML สำหรับการยืนยันตัวตน/เข้าสู่ระบบของ Slack จะถูกข้ามแทนที่จะถูกรายงานว่าเป็นรูปแบบที่ไม่รองรับ
- **โมเดลวิชัน**: การวิเคราะห์รูปภาพใช้โมเดลตอบกลับที่ใช้งานอยู่เมื่อรองรับวิชัน หรือใช้โมเดลรูปภาพที่กำหนดค่าไว้ที่ `agents.defaults.imageModel`

### ขีดจำกัดที่ทราบ

| สถานการณ์                               | พฤติกรรมปัจจุบัน                                                             | วิธีแก้ไข                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL ไฟล์ Slack หมดอายุ                 | ไฟล์ถูกข้าม; ไม่มีข้อผิดพลาดแสดง                                                 | อัปโหลดไฟล์ใน Slack อีกครั้ง                                                |
| ไม่ได้กำหนดค่าโมเดลวิชัน            | ไฟล์แนบรูปภาพถูกเก็บเป็นการอ้างอิงสื่อ แต่ไม่ถูกวิเคราะห์เป็นรูปภาพ | กำหนดค่า `agents.defaults.imageModel` หรือใช้โมเดลตอบกลับที่รองรับวิชัน |
| รูปภาพขนาดใหญ่มาก (> 20 MB ตามค่าเริ่มต้น) | ถูกข้ามตามขีดจำกัดขนาด                                                         | เพิ่ม `channels.slack.mediaMaxMb` หาก Slack อนุญาต                       |
| ไฟล์แนบที่ส่งต่อ/แชร์           | ข้อความและสื่อรูปภาพ/ไฟล์ที่โฮสต์บน Slack เป็นแบบพยายามให้ดีที่สุด                       | แชร์โดยตรงอีกครั้งในเธรด OpenClaw                                   |
| ไฟล์แนบ PDF                        | เก็บเป็นบริบทไฟล์/สื่อ ไม่ได้กำหนดเส้นทางผ่านวิชันรูปภาพโดยอัตโนมัติ  | ใช้ `download-file` สำหรับเมทาดาทาไฟล์ หรือเครื่องมือ `pdf` สำหรับการวิเคราะห์ PDF   |

### เอกสารที่เกี่ยวข้อง

- [ไปป์ไลน์การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
- [เครื่องมือ PDF](/th/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — การเปิดใช้งานวิชันสำหรับไฟล์แนบ Slack
- การทดสอบถดถอย: [#51353](https://github.com/openclaw/openclaw/issues/51353)
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
    โครงร่างคอนฟิกและลำดับความสำคัญ
  </Card>
  <Card title="คำสั่ง slash" icon="terminal" href="/th/tools/slash-commands">
    แคตตาล็อกคำสั่งและพฤติกรรม
  </Card>
</CardGroup>
