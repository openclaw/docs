---
read_when:
    - การตั้งค่า Slack หรือการดีบักโหมดซ็อกเก็ต, HTTP หรือรีเลย์ของ Slack
summary: การตั้งค่า Slack และพฤติกรรมขณะรัน (Socket Mode, URL คำขอ HTTP และโหมดรีเลย์)
title: Slack
x-i18n:
    generated_at: "2026-06-27T17:13:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

พร้อมใช้งานจริงสำหรับ DM และช่องผ่านการผสานรวมแอป Slack โหมดเริ่มต้นคือ Socket Mode; รองรับ HTTP Request URLs ด้วยเช่นกัน โหมด relay มีไว้สำหรับการปรับใช้แบบมีการจัดการที่เราเตอร์ที่เชื่อถือได้เป็นเจ้าของทางเข้า Slack

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    DM ของ Slack ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    ลักษณะการทำงานของคำสั่งเนทีฟและแคตตาล็อกคำสั่ง
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องและคู่มือการซ่อมแซม
  </Card>
</CardGroup>

## การเลือก Socket Mode หรือ HTTP Request URLs

ทั้งสองทรานสปอร์ตพร้อมใช้งานจริงและมีความสามารถเทียบเท่ากันสำหรับการส่งข้อความ คำสั่ง slash, App Home และการโต้ตอบ ให้เลือกตามรูปแบบการปรับใช้ ไม่ใช่ตามฟีเจอร์

| ประเด็น                      | Socket Mode (ค่าเริ่มต้น)                                                                                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL Gateway สาธารณะ           | ไม่จำเป็น                                                                                                                                         | จำเป็น (DNS, TLS, reverse proxy หรือ tunnel)                                                                   |
| เครือข่ายขาออก             | ต้องเข้าถึง WSS ขาออกไปยัง `wss-primary.slack.com` ได้                                                                                            | ไม่มี WS ขาออก; มีเฉพาะ HTTPS ขาเข้า                                                                             |
| โทเค็นที่จำเป็น                | โทเค็นบอต + App-Level Token พร้อม `connections:write`                                                                                                 | โทเค็นบอต + Signing Secret                                                                                     |
| แล็ปท็อปสำหรับพัฒนา / อยู่หลังไฟร์วอลล์ | ใช้งานได้ทันที                                                                                                                                          | ต้องมี tunnel สาธารณะ (ngrok, Cloudflare Tunnel, Tailscale Funnel) หรือ Gateway สำหรับ staging                          |
| การปรับขนาดแนวนอน           | หนึ่งเซสชัน Socket Mode ต่อแอปต่อโฮสต์; Gateway หลายตัวต้องใช้แอป Slack แยกกัน                                                                 | ตัวจัดการ POST แบบไร้สถานะ; replica ของ Gateway หลายตัวสามารถใช้แอปเดียวกันหลัง load balancer ได้                     |
| หลายบัญชีบน Gateway เดียว | รองรับ; แต่ละบัญชีเปิด WS ของตัวเอง                                                                                                             | รองรับ; แต่ละบัญชีต้องมี `webhookPath` ที่ไม่ซ้ำกัน (ค่าเริ่มต้น `/slack/events`) เพื่อไม่ให้การลงทะเบียนชนกัน |
| ทรานสปอร์ตของคำสั่ง slash      | ส่งผ่านการเชื่อมต่อ WS; `slash_commands[].url` จะถูกละเว้น                                                                                  | Slack ส่ง POST ไปยัง `slash_commands[].url`; ต้องมีฟิลด์นี้เพื่อให้คำสั่งถูก dispatch                           |
| การลงนามคำขอ              | ไม่ได้ใช้ (การยืนยันตัวตนคือ App-Level Token)                                                                                                               | Slack ลงนามทุกคำขอ; OpenClaw ตรวจสอบด้วย `signingSecret`                                              |
| การกู้คืนเมื่อการเชื่อมต่อหลุด  | เปิดใช้การเชื่อมต่อใหม่อัตโนมัติของ Slack SDK; OpenClaw ยังรีสตาร์ตเซสชัน Socket Mode ที่ล้มเหลวด้วย backoff แบบมีขอบเขต การปรับแต่งทรานสปอร์ต pong-timeout มีผลใช้ | ไม่มีการเชื่อมต่อถาวรให้หลุด; การลองใหม่เป็นรายคำขอจาก Slack                                           |

<Note>
  **เลือก Socket Mode** สำหรับโฮสต์ Gateway เดี่ยว แล็ปท็อปสำหรับพัฒนา และเครือข่ายภายในองค์กรที่เข้าถึง `*.slack.com` ขาออกได้ แต่รับ HTTPS ขาเข้าไม่ได้

**เลือก HTTP Request URLs** เมื่อเรียกใช้ replica ของ Gateway หลายตัวหลัง load balancer เมื่อ WSS ขาออกถูกบล็อกแต่อนุญาต HTTPS ขาเข้า หรือเมื่อคุณรับ Slack webhooks ที่ reverse proxy อยู่แล้ว
</Note>

### โหมด relay

โหมด relay แยกทางเข้า Slack ออกจาก OpenClaw gateway เราเตอร์ที่เชื่อถือได้เป็นเจ้าของ
การเชื่อมต่อ Slack Socket Mode เดี่ยว เลือก gateway ปลายทาง และส่งต่ออีเวนต์แบบมีชนิด
ผ่าน websocket ที่ผ่านการยืนยันตัวตนแล้ว gateway ยังคงใช้โทเค็นบอตของตัวเองสำหรับ
การเรียก Slack Web API ขาออก

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

URL relay ต้องใช้ `wss://` เว้นแต่ว่าชี้ไปยัง localhost ให้ถือว่า bearer token และ
ตารางเส้นทางของเราเตอร์เป็นส่วนหนึ่งของขอบเขตการอนุญาต Slack: อีเวนต์ที่ถูกกำหนดเส้นทางจะเข้าสู่
ตัวจัดการข้อความ Slack ปกติในฐานะ activation ที่ได้รับอนุญาตแล้ว `slack_identity` ที่เราเตอร์ให้มา
ในเฟรม `hello` ของ websocket สามารถตั้งชื่อผู้ใช้และไอคอนขาออกเริ่มต้นได้; identity ที่ผู้เรียกส่งมาอย่างชัดเจน
ยังคงมีสิทธิ์เหนือกว่า การเชื่อมต่อ relay จะเชื่อมต่อใหม่ด้วยจังหวะ backoff แบบมีขอบเขตเดียวกับ Socket Mode
และล้าง identity ที่เราเตอร์ให้มาทุกครั้งที่ตัดการเชื่อมต่อ

## ติดตั้ง

ติดตั้ง Slack ก่อนกำหนดค่าช่อง:

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` ลงทะเบียนและเปิดใช้งาน Plugin Plugin ยังคงไม่ทำอะไรจนกว่าคุณจะกำหนดค่าแอป Slack และการตั้งค่าช่องด้านล่าง ดู [Plugins](/th/tools/plugin) สำหรับลักษณะการทำงานทั่วไปของ Plugin และกฎการติดตั้ง

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **Recommended** ตรงกับชุดฟีเจอร์เต็มของ Slack Plugin: App Home, คำสั่ง slash, ไฟล์, reactions, pins, DM แบบกลุ่ม และการอ่าน emoji/usergroup เลือก **Minimal** เมื่อนโยบาย workspace จำกัด scopes — ครอบคลุม DM, ประวัติช่อง/กลุ่ม, mentions และคำสั่ง slash แต่ตัดไฟล์, reactions, pins, DM แบบกลุ่ม (`mpim:*`), `emoji:read` และ `usergroups:read` ออก ดู [รายการตรวจสอบ manifest และ scope](#manifest-and-scope-checklist) สำหรับเหตุผลราย scope และตัวเลือกแบบเพิ่มได้ เช่น คำสั่ง slash เพิ่มเติม
        </Note>

        หลังจาก Slack สร้างแอปแล้ว:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: เพิ่ม `connections:write`, บันทึก, คัดลอก App-Level Token
        - **Install App -> Install to Workspace**: คัดลอก Bot User OAuth Token

      </Step>

      <Step title="Configure OpenClaw">

        การตั้งค่า SecretRef ที่แนะนำ:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
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

        fallback ผ่าน env (เฉพาะบัญชีเริ่มต้น):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
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
        เปิด [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → เลือกเวิร์กสเปซของคุณ → วาง manifest รายการใดรายการหนึ่งด้านล่าง → แทนที่ `https://gateway-host.example.com/slack/events` ด้วย URL Gateway สาธารณะของคุณ → **Next** → **Create**.

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **Recommended** ตรงกับชุดฟีเจอร์ทั้งหมดของ Slack Plugin; **Minimal** ตัดไฟล์, reactions, pins, group-DM (`mpim:*`), `emoji:read` และ `usergroups:read` ออกสำหรับเวิร์กสเปซที่มีข้อจำกัด ดูเหตุผลราย scope ได้ที่ [รายการตรวจสอบ manifest และ scope](#manifest-and-scope-checklist)
        </Note>

        <Info>
          ฟิลด์ URL ทั้งสาม (`slash_commands[].url`, `event_subscriptions.request_url` และ `interactivity.request_url` / `message_menu_options_url`) ชี้ไปยัง endpoint เดียวกันของ OpenClaw schema ของ manifest ของ Slack กำหนดให้ตั้งชื่อแยกกัน แต่ OpenClaw route ตามชนิดของ payload ดังนั้น `webhookPath` เดียว (ค่าเริ่มต้น `/slack/events`) ก็เพียงพอ Slash commands ที่ไม่มี `slash_commands[].url` จะไม่ทำงานโดยไม่แจ้งเตือนในโหมด HTTP
        </Info>

        หลังจาก Slack สร้างแอปแล้ว:

        - **Basic Information → App Credentials**: คัดลอก **Signing Secret** สำหรับการตรวจสอบคำขอ
        - **Install App -> Install to Workspace**: คัดลอก Bot User OAuth Token

      </Step>

      <Step title="Configure OpenClaw">

        การตั้งค่า SecretRef ที่แนะนำ:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
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
        ใช้ webhook path ที่ไม่ซ้ำกันสำหรับ HTTP แบบหลายบัญชี

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

## การปรับแต่ง transport ของ Socket Mode

OpenClaw ตั้งค่า timeout สำหรับ pong ของไคลเอนต์ Slack SDK เป็น 15 วินาทีโดยค่าเริ่มต้นสำหรับ Socket Mode ให้ override การตั้งค่า transport เฉพาะเมื่อคุณต้องปรับแต่งให้เหมาะกับเวิร์กสเปซหรือโฮสต์เฉพาะ:

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

ใช้เฉพาะกับเวิร์กสเปซ Socket Mode ที่บันทึก timeout ของ Slack websocket pong/server-ping หรือทำงานบนโฮสต์ที่ทราบว่ามีภาวะ event-loop starvation `clientPingTimeout` คือเวลารอ pong หลังจาก SDK ส่ง client ping; `serverPingTimeout` คือเวลารอ ping จากเซิร์ฟเวอร์ Slack ข้อความและเหตุการณ์ของแอปยังคงเป็นสถานะแอปพลิเคชัน ไม่ใช่สัญญาณความมีชีวิตของ transport

หมายเหตุ:

- `socketMode` จะถูกละเว้นในโหมด HTTP Request URL
- การตั้งค่า `channels.slack.socketMode` พื้นฐานมีผลกับบัญชี Slack ทั้งหมด เว้นแต่จะถูก override การ override รายบัญชีใช้ `channels.slack.accounts.<accountId>.socketMode`; เนื่องจากนี่เป็น object override ให้รวมทุกฟิลด์การปรับแต่ง socket ที่คุณต้องการสำหรับบัญชีนั้น
- มีเพียง `clientPingTimeout` เท่านั้นที่มีค่าเริ่มต้นของ OpenClaw (`15000`) `serverPingTimeout` และ `pingPongLoggingEnabled` จะถูกส่งไปยัง Slack SDK เฉพาะเมื่อกำหนดค่าไว้
- backoff ในการรีสตาร์ท Socket Mode เริ่มประมาณ 2 วินาทีและจำกัดสูงสุดประมาณ 30 วินาที ความล้มเหลวแบบกู้คืนได้ระหว่างเริ่มต้น, รอเริ่มต้น และตัดการเชื่อมต่อจะ retry จนกว่า channel จะหยุด ข้อผิดพลาดถาวรของบัญชีและ credentials เช่น auth ไม่ถูกต้อง, token ถูกเพิกถอน หรือ scopes ขาดหาย จะล้มเหลวทันทีแทนที่จะ retry ตลอดไป

## รายการตรวจสอบ manifest และ scope

manifest พื้นฐานของแอป Slack เหมือนกันสำหรับ Socket Mode และ HTTP Request URLs เฉพาะบล็อก `settings` (และ `url` ของ slash command) เท่านั้นที่ต่างกัน

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

แสดงฟีเจอร์ต่าง ๆ ที่ขยายค่าเริ่มต้นข้างต้น

แท็บ **Home** ของ Slack App Home และสมัครรับ `app_home_opened` ถูกเปิดใช้งานในแมนิเฟสต์เริ่มต้น เมื่อสมาชิกเวิร์กสเปซเปิดแท็บ Home, OpenClaw จะเผยแพร่มุมมอง Home เริ่มต้นที่ปลอดภัยด้วย `views.publish`; ไม่มีเพย์โหลดการสนทนาหรือการกำหนดค่าส่วนตัวรวมอยู่ด้วย แท็บ **Messages** ยังคงเปิดใช้งานสำหรับ Slack DM แมนิเฟสต์ยังเปิดใช้งานเธรดผู้ช่วยของ Slack ด้วย `features.assistant_view`, `assistant:write`, `assistant_thread_started` และ `assistant_thread_context_changed`; เธรดผู้ช่วยจะถูกส่งต่อไปยังเซสชันเธรด OpenClaw ของตัวเอง และเก็บบริบทเธรดที่ Slack ให้ไว้ให้พร้อมใช้งานกับเอเจนต์

<AccordionGroup>
  <Accordion title="คำสั่ง slash แบบเนทีฟที่เลือกใช้ได้">

    สามารถใช้ [คำสั่ง slash แบบเนทีฟ](#commands-and-slash-behavior) หลายรายการแทนคำสั่งที่กำหนดค่าไว้รายการเดียวได้ โดยมีรายละเอียดปลีกย่อยดังนี้:

    - ใช้ `/agentstatus` แทน `/status` เนื่องจากคำสั่ง `/status` ถูกสงวนไว้
    - สามารถทำให้คำสั่ง slash พร้อมใช้งานพร้อมกันได้ไม่เกิน 25 รายการ

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
      "command": "/approve",
      "description": "Approve or deny pending approval requests",
      "usage_hint": "<id> <decision>"
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
      <Tab title="URL คำขอ HTTP">
        ใช้รายการ `slash_commands` เดียวกับ Socket Mode ด้านบน และเพิ่ม `"url": "https://gateway-host.example.com/slack/events"` ให้กับทุกรายการ ตัวอย่าง:

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
  <Accordion title="ขอบเขตการระบุผู้เขียนที่เลือกใช้ได้ (การเขียน)">
    เพิ่มขอบเขตบอต `chat:write.customize` หากคุณต้องการให้ข้อความขาออกใช้ตัวตนของเอเจนต์ที่ใช้งานอยู่ (ชื่อผู้ใช้และไอคอนแบบกำหนดเอง) แทนตัวตนเริ่มต้นของแอป Slack

    หากคุณใช้ไอคอนอีโมจิ Slack คาดหวังไวยากรณ์แบบ `:emoji_name:`

  </Accordion>
  <Accordion title="ขอบเขตโทเค็นผู้ใช้ที่เลือกใช้ได้ (การอ่าน)">
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

- ต้องมี `botToken` + `appToken` สำหรับ Socket Mode
- โหมด HTTP ต้องใช้ `botToken` + `signingSecret`
- โหมด Relay ต้องใช้ `botToken` รวมถึง `relay.url`, `relay.authToken` และ `relay.gatewayId`; ไม่ใช้โทเค็นแอปหรือ signing secret
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` และ `userToken` รับสตริงข้อความธรรมดา
  หรือออบเจ็กต์ SecretRef ได้
- โทเค็นจากการกำหนดค่าจะแทนที่ env fallback
- env fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
- `userToken` กำหนดค่าได้เท่านั้น (ไม่มี env fallback) และมีค่าเริ่มต้นเป็นพฤติกรรมอ่านอย่างเดียว (`userTokenReadOnly: true`)

พฤติกรรมสแนปช็อตสถานะ:

- การตรวจสอบบัญชี Slack ติดตามฟิลด์ `*Source` และ `*Status` ต่อข้อมูลประจำตัว
  (`botToken`, `appToken`, `signingSecret`, `userToken`)
- สถานะคือ `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าผ่าน SecretRef
  หรือแหล่งข้อมูลลับแบบไม่ฝังในบรรทัดอื่น แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบัน
  ไม่สามารถแปลงค่าเป็นค่าจริงได้
- ในโหมด HTTP จะรวม `signingSecretStatus`; ใน Socket Mode คู่ที่ต้องมีคือ
  `botTokenStatus` + `appTokenStatus`

<Tip>
สำหรับการอ่าน actions/directory สามารถให้ความสำคัญกับโทเค็นผู้ใช้เมื่อกำหนดค่าไว้ สำหรับการเขียน โทเค็นบอตยังคงเป็นตัวเลือกหลัก; การเขียนด้วยโทเค็นผู้ใช้จะอนุญาตเฉพาะเมื่อ `userTokenReadOnly: false` และโทเค็นบอตไม่พร้อมใช้งาน
</Tip>

## แอ็กชันและเกต

แอ็กชันของ Slack ควบคุมด้วย `channels.slack.actions.*`

กลุ่มแอ็กชันที่มีในเครื่องมือ Slack ปัจจุบัน:

| กลุ่ม      | ค่าเริ่มต้น |
| ---------- | ------- |
| messages   | เปิดใช้งาน |
| reactions  | เปิดใช้งาน |
| pins       | เปิดใช้งาน |
| memberInfo | เปิดใช้งาน |
| emojiList  | เปิดใช้งาน |

แอ็กชันข้อความ Slack ปัจจุบันประกอบด้วย `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list` `download-file` รับ ID ไฟล์ Slack ที่แสดงในตัวแทนตำแหน่งไฟล์ขาเข้า และส่งคืนตัวอย่างรูปภาพสำหรับรูปภาพหรือเมทาดาทาไฟล์ในเครื่องสำหรับไฟล์ประเภทอื่น

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

  <Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM `channels.slack.allowFrom` คือรายการอนุญาต DM หลัก

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.slack.allowFrom` รวม `"*"`)
    - `disabled`

    แฟล็ก DM:

    - `dm.enabled` (ค่าเริ่มต้น true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (เดิม)
    - `dm.groupEnabled` (DM กลุ่มมีค่าเริ่มต้นเป็น false)
    - `dm.groupChannels` (รายการอนุญาต MPIM แบบไม่บังคับ)

    ลำดับความสำคัญเมื่อมีหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่ตั้งชื่อไว้จะสืบทอด `channels.slack.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตัวเอง
    - บัญชีที่ตั้งชื่อไว้จะไม่สืบทอด `channels.slack.accounts.default.allowFrom`

    `channels.slack.dm.policy` และ `channels.slack.dm.allowFrom` แบบเดิมยังคงอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    การจับคู่ใน DM ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` ควบคุมการจัดการช่อง:

    - `open`
    - `allowlist`
    - `disabled`

    รายการอนุญาตของช่องอยู่ใต้ `channels.slack.channels` และ**ต้องใช้ ID ช่อง Slack ที่เสถียร** (เช่น `C12345678`) เป็นคีย์การตั้งค่า

    หมายเหตุรันไทม์: หาก `channels.slack` หายไปทั้งหมด (การตั้งค่าด้วย env เท่านั้น) รันไทม์จะย้อนกลับไปใช้ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` แล้วก็ตาม)

    การแปลงชื่อ/ID:

    - รายการอนุญาตของช่องและรายการอนุญาตของ DM จะถูกแปลงเมื่อเริ่มต้น หากการเข้าถึงด้วยโทเค็นอนุญาต
    - รายการชื่อช่องที่แปลงไม่ได้จะถูกเก็บไว้ตามที่ตั้งค่า แต่โดยค่าเริ่มต้นจะถูกละเว้นสำหรับการกำหนดเส้นทาง
    - การอนุญาตขาเข้าและการกำหนดเส้นทางช่องจะใช้ ID เป็นหลักโดยค่าเริ่มต้น; การจับคู่ชื่อผู้ใช้/slug โดยตรงต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    คีย์ตามชื่อ (`#channel-name` หรือ `channel-name`) จะ**ไม่**ตรงกันภายใต้ `groupPolicy: "allowlist"` การค้นหาช่องใช้ ID เป็นหลักโดยค่าเริ่มต้น ดังนั้นคีย์ตามชื่อจะไม่มีวันกำหนดเส้นทางสำเร็จ และข้อความทั้งหมดในช่องนั้นจะถูกบล็อกอย่างเงียบ ๆ ซึ่งแตกต่างจาก `groupPolicy: "open"` ที่ไม่ต้องใช้คีย์ช่องสำหรับการกำหนดเส้นทาง และคีย์ตามชื่อจะดูเหมือนใช้งานได้

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
    โดยค่าเริ่มต้น ข้อความในช่องจะถูกกั้นด้วยการกล่าวถึง

    แหล่งที่มาของการกล่าวถึง:

    - การกล่าวถึงแอปอย่างชัดเจน (`<@botId>`)
    - การกล่าวถึงกลุ่มผู้ใช้ Slack (`<!subteam^S...>`) เมื่อผู้ใช้บอตเป็นสมาชิกของกลุ่มผู้ใช้นั้น; ต้องใช้ `usergroups:read`
    - รูปแบบ regex สำหรับการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรมเธรดการตอบกลับบอตโดยนัย (ปิดใช้งานเมื่อ `thread.requireExplicitMention` เป็น `true`)

    การควบคุมต่อช่อง (`channels.slack.channels.<id>`; ชื่อใช้ได้ผ่านการแปลงเมื่อเริ่มต้นหรือ `dangerouslyAllowNameMatching` เท่านั้น):

    - `requireMention`
    - `users` (รายการอนุญาต)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:`, หรือไวลด์การ์ด `"*"`
      (คีย์เดิมที่ไม่มีคำนำหน้ายังคงแมปไปยัง `id:` เท่านั้น)

    `allowBots` เป็นแบบอนุรักษนิยมสำหรับช่องและช่องส่วนตัว: ข้อความห้องที่เขียนโดยบอทจะถูกยอมรับเฉพาะเมื่อบอทผู้ส่งถูกระบุไว้อย่างชัดเจนใน allowlist `users` ของห้องนั้น หรือเมื่อมี ID เจ้าของ Slack อย่างชัดเจนอย่างน้อยหนึ่งรายการจาก `channels.slack.allowFrom` เป็นสมาชิกของห้องอยู่ในขณะนั้น ไวลด์การ์ดและรายการเจ้าของแบบชื่อที่แสดงไม่ถือว่าเข้าเงื่อนไขการมีอยู่ของเจ้าของ การมีอยู่ของเจ้าของใช้ Slack `conversations.members`; ตรวจให้แน่ใจว่าแอปมี read scope ที่ตรงกับประเภทห้อง (`channels:read` สำหรับช่องสาธารณะ, `groups:read` สำหรับช่องส่วนตัว) หากการค้นหาสมาชิกล้มเหลว OpenClaw จะทิ้งข้อความห้องที่เขียนโดยบอท

    ข้อความ Slack ที่เขียนโดยบอทและได้รับการยอมรับใช้ [การป้องกันลูปบอท](/th/channels/bot-loop-protection) ร่วมกัน กำหนดค่า `channels.defaults.botLoopProtection` สำหรับงบประมาณเริ่มต้น จากนั้นเขียนทับด้วย `channels.slack.botLoopProtection` หรือ `channels.slack.channels.<id>.botLoopProtection` เมื่อเวิร์กสเปซหรือช่องต้องการขีดจำกัดที่ต่างออกไป

  </Tab>
</Tabs>

## เธรด เซสชัน และแท็กตอบกลับ

- DM จะกำหนดเส้นทางเป็น `direct`; ช่องเป็น `channel`; MPIM เป็น `group`
- การผูกเส้นทาง Slack รับ ID เพียร์ดิบ รวมถึงรูปแบบเป้าหมาย Slack เช่น `channel:C12345678`, `user:U12345678` และ `<@U12345678>`
- เมื่อใช้ค่าเริ่มต้น `session.dmScope=main` DM ของ Slack จะถูกรวมเข้ากับเซสชันหลักของเอเจนต์
- เซสชันช่อง: `agent:<agentId>:slack:channel:<channelId>`
- ข้อความช่องระดับบนสุดทั่วไปจะอยู่ในเซสชันต่อช่อง แม้เมื่อ `replyToMode` ไม่ใช่ `off`
- การตอบกลับเธรด Slack ใช้ `thread_ts` ของ Slack ของพาเรนต์สำหรับส่วนท้ายเซสชัน (`:thread:<threadTs>`) แม้เมื่อปิดการตอบกลับแบบเธรดขาออกด้วย `replyToMode="off"`
- OpenClaw จะเพาะ root ช่องระดับบนสุดที่เข้าเงื่อนไขไว้ใน `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` เมื่อคาดว่า root นั้นจะเริ่มเธรด Slack ที่มองเห็นได้ เพื่อให้ root และการตอบกลับเธรดภายหลังใช้เซสชัน OpenClaw เดียวกัน สิ่งนี้ใช้กับอีเวนต์ `app_mention`, การจับคู่บอทอย่างชัดเจนหรือ mention-pattern ที่กำหนดค่าไว้ และช่อง `requireMention: false` ที่มี `replyToMode` ไม่ใช่ `off`
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความเธรดที่มีอยู่ที่จะถูกดึงเมื่อเซสชันเธรดใหม่เริ่มต้น (ค่าเริ่มต้น `20`; ตั้งเป็น `0` เพื่อปิด)
- `channels.slack.thread.requireExplicitMention` (ค่าเริ่มต้น `false`): เมื่อเป็น `true` จะระงับการกล่าวถึงเธรดโดยนัย เพื่อให้บอทตอบสนองเฉพาะการกล่าวถึง `@bot` อย่างชัดเจนภายในเธรด แม้เมื่อบอทเคยร่วมอยู่ในเธรดแล้ว หากไม่มีสิ่งนี้ การตอบกลับในเธรดที่บอทเข้าร่วมจะข้ามการกั้น `requireMention`

ตัวควบคุมการตอบกลับแบบเธรด:

- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: ต่อ `direct|group|channel`
- fallback แบบ legacy สำหรับแชทโดยตรง: `channels.slack.dm.replyToMode`

รองรับแท็กตอบกลับด้วยตนเอง:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

สำหรับการตอบกลับเธรด Slack อย่างชัดเจนจากเครื่องมือ `message` ให้ตั้ง `replyBroadcast: true` พร้อม `action: "send"` และ `threadId` หรือ `replyTo` เพื่อขอให้ Slack กระจายการตอบกลับเธรดไปยังช่องพาเรนต์ด้วย สิ่งนี้แมปกับแฟล็ก `reply_broadcast` ของ Slack `chat.postMessage` และรองรับเฉพาะการส่งข้อความหรือ Block Kit เท่านั้น ไม่รองรับการอัปโหลดสื่อ

เมื่อการเรียกเครื่องมือ `message` ทำงานภายในเธรด Slack และกำหนดเป้าหมายเป็นช่องเดียวกัน OpenClaw โดยปกติจะสืบทอดเธรด Slack ปัจจุบันตาม `replyToMode` ตั้ง `topLevel: true` บน `action: "send"` หรือ `action: "upload-file"` เพื่อบังคับให้เป็นข้อความใหม่ในช่องพาเรนต์แทน `threadId: null` จะถูกยอมรับเป็นการเลือกไม่ใช้ระดับบนสุดแบบเดียวกัน

<Note>
`replyToMode="off"` ปิดการตอบกลับ Slack แบบเธรดขาออก รวมถึงแท็ก `[[reply_to_*]]` อย่างชัดเจน แต่ไม่ได้ทำให้เซสชันเธรด Slack ขาเข้าแบนราบ: ข้อความที่โพสต์ไว้แล้วภายในเธรด Slack จะยังคงกำหนดเส้นทางไปยังเซสชัน `:thread:<threadTs>` สิ่งนี้ต่างจาก Telegram ซึ่งแท็กอย่างชัดเจนยังคงได้รับการเคารพในโหมด `"off"` เธรด Slack ซ่อนข้อความจากช่อง ขณะที่การตอบกลับ Telegram ยังคงมองเห็นแบบอินไลน์
</Note>

## รีแอ็กชัน Ack

`ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า `ackReactionScope` ตัดสินว่าอีโมจินั้นจะถูกส่งจริง _เมื่อใด_

### อีโมจิ (`ackReaction`)

ลำดับการแก้ค่า:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback อีโมจิของตัวตนเอเจนต์ (`agents.list[].identity.emoji` มิฉะนั้น `"eyes"` / 👀)

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"eyes"`)
- ใช้ `""` เพื่อปิดรีแอ็กชันสำหรับบัญชี Slack หรือทั่วโลก

### ขอบเขต (`messages.ackReactionScope`)

ผู้ให้บริการ Slack อ่านขอบเขตจาก `messages.ackReactionScope` (ค่าเริ่มต้น `"group-mentions"`) ปัจจุบันไม่มีการเขียนทับระดับบัญชี Slack หรือระดับช่อง Slack; ค่านี้เป็นแบบทั่วทั้ง gateway

ค่า:

- `"all"`: รีแอ็กต์ใน DM และกลุ่ม
- `"direct"`: รีแอ็กต์เฉพาะใน DM
- `"group-all"`: รีแอ็กต์กับทุกข้อความกลุ่ม (ไม่มี DM)
- `"group-mentions"` (ค่าเริ่มต้น): รีแอ็กต์ในกลุ่ม แต่เฉพาะเมื่อมีการกล่าวถึงบอท (หรือใน mentionables ของกลุ่มที่เลือกเข้าร่วม) **ไม่รวม DM**
- `"off"` / `"none"`: ไม่รีแอ็กต์เลย

<Note>
ขอบเขตเริ่มต้น (`"group-mentions"`) จะไม่เรียกรีแอ็กชัน ack ในข้อความโดยตรง หากต้องการเห็น `ackReaction` ที่กำหนดค่าไว้ (เช่น `"eyes"`) บน DM Slack ขาเข้า ให้ตั้ง `messages.ackReactionScope` เป็น `"direct"` หรือ `"all"` `messages.ackReactionScope` จะถูกอ่านตอนผู้ให้บริการ Slack เริ่มต้น ดังนั้นต้องรีสตาร์ท gateway เพื่อให้การเปลี่ยนแปลงมีผล
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // react in DMs and groups
  },
}
```

## การสตรีมข้อความ

`channels.slack.streaming` ควบคุมพฤติกรรมตัวอย่างสด:

- `off`: ปิดการสตรีมตัวอย่างสด
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความตัวอย่างด้วยผลลัพธ์บางส่วนล่าสุด
- `block`: ต่อท้ายการอัปเดตตัวอย่างแบบเป็นชิ้น
- `progress`: แสดงข้อความสถานะความคืบหน้าขณะสร้าง จากนั้นส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อตัวอย่างฉบับร่างทำงานอยู่ ให้กำหนดเส้นทางการอัปเดตเครื่องมือ/ความคืบหน้าเข้าสู่ข้อความตัวอย่างที่ถูกแก้ไขเดียวกัน (ค่าเริ่มต้น: `true`) ตั้ง `false` เพื่อเก็บข้อความเครื่องมือ/ความคืบหน้าแยกต่างหาก
- `streaming.preview.commandText` / `streaming.progress.commandText`: ตั้งเป็น `status` เพื่อคงบรรทัดความคืบหน้าของเครื่องมือแบบกะทัดรัดไว้ ขณะซ่อนข้อความคำสั่ง/exec ดิบ (ค่าเริ่มต้น: `raw`)

ซ่อนข้อความคำสั่ง/exec ดิบขณะที่ยังคงบรรทัดความคืบหน้าแบบกะทัดรัด:

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

การ์ดงานความคืบหน้าแบบเนทีฟของ Slack เป็นแบบเลือกใช้สำหรับโหมดความคืบหน้า ตั้ง `channels.slack.streaming.progress.nativeTaskCards` เป็น `true` พร้อม `channels.slack.streaming.mode="progress"` เพื่อส่งการ์ดแผน/งานแบบเนทีฟของ Slack ขณะงานกำลังทำงาน จากนั้นอัปเดตการ์ดงานเดียวกันเมื่อเสร็จสิ้น หากไม่มีแฟล็กนี้ โหมดความคืบหน้าจะคงพฤติกรรมตัวอย่างฉบับร่างแบบพกพาไว้

- ต้องมีเธรดตอบกลับเพื่อให้การสตรีมข้อความแบบเนทีฟและสถานะเธรดผู้ช่วยของ Slack ปรากฏ การเลือกเธรดยังคงเป็นไปตาม `replyToMode`
- root ของช่อง แชทกลุ่ม และ DM ระดับบนสุดยังคงใช้ตัวอย่างฉบับร่างปกติได้เมื่อการสตรีมแบบเนทีฟไม่พร้อมใช้งานหรือไม่มีเธรดตอบกลับ
- DM Slack ระดับบนสุดจะอยู่นอกเธรดโดยค่าเริ่มต้น ดังนั้นจะไม่แสดงตัวอย่างสตรีม/สถานะแบบเนทีฟสไตล์เธรดของ Slack; OpenClaw จะโพสต์และแก้ไขตัวอย่างฉบับร่างใน DM แทน
- สื่อและเพย์โหลดที่ไม่ใช่ข้อความจะ fallback ไปยังการส่งปกติ
- ผลลัพธ์สุดท้ายที่เป็นสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่; ผลลัพธ์สุดท้ายแบบข้อความ/block ที่เข้าเงื่อนไขจะ flush เฉพาะเมื่อสามารถแก้ไขตัวอย่างในที่เดิมได้
- หากการสตรีมล้มเหลวกลางการตอบกลับ OpenClaw จะ fallback ไปยังการส่งปกติสำหรับเพย์โหลดที่เหลือ

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

เลือกใช้การ์ดงานความคืบหน้าแบบเนทีฟของ Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

คีย์ Legacy:

- `channels.slack.streamMode` (`replace | status_final | append`) เป็น alias รันไทม์แบบ legacy สำหรับ `channels.slack.streaming.mode`
- boolean `channels.slack.streaming` เป็น alias รันไทม์แบบ legacy สำหรับ `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport`
- `channels.slack.nativeStreaming` แบบ legacy เป็น alias รันไทม์สำหรับ `channels.slack.streaming.nativeTransport`
- รัน `openclaw doctor --fix` เพื่อเขียน config การสตรีม Slack ที่คงอยู่แล้วใหม่เป็นคีย์ canonical

## fallback รีแอ็กชันการพิมพ์

`typingReaction` เพิ่มรีแอ็กชันชั่วคราวให้กับข้อความ Slack ขาเข้าขณะที่ OpenClaw กำลังประมวลผลการตอบกลับ จากนั้นลบออกเมื่อการรันเสร็จสิ้น สิ่งนี้มีประโยชน์มากที่สุดนอกการตอบกลับเธรด ซึ่งใช้ตัวบ่งชี้สถานะ "is typing..." เริ่มต้น

ลำดับการแก้ค่า:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"hourglass_flowing_sand"`)
- รีแอ็กชันเป็นแบบ best-effort และจะพยายามล้างข้อมูลโดยอัตโนมัติหลังเส้นทางตอบกลับหรือล้มเหลวเสร็จสิ้น

## สื่อ การแบ่งชิ้น และการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบขาเข้า">
    ไฟล์แนบ Slack จะถูกดาวน์โหลดจาก URL ส่วนตัวที่โฮสต์โดย Slack (โฟลว์คำขอที่ยืนยันตัวตนด้วยโทเค็น) และเขียนไปยังที่เก็บสื่อเมื่อการดึงสำเร็จและขีดจำกัดขนาดอนุญาต placeholder ของไฟล์จะมี Slack `fileId` เพื่อให้เอเจนต์ดึงไฟล์ต้นฉบับด้วย `download-file` ได้

    การดาวน์โหลดใช้ timeout แบบ idle และรวมที่มีขอบเขต หากการดึงไฟล์ Slack ค้างหรือล้มเหลว OpenClaw จะยังคงประมวลผลข้อความต่อและ fallback ไปยัง placeholder ของไฟล์

    เพดานขนาดขาเข้าของรันไทม์มีค่าเริ่มต้นเป็น `20MB` เว้นแต่จะถูกเขียนทับด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="ข้อความและไฟล์ขาออก">
    - ชิ้นข้อความใช้ `channels.slack.textChunkLimit` (ค่าเริ่มต้น 4000)
    - `channels.slack.chunkMode="newline"` เปิดใช้การแบ่งแบบย่อหน้าก่อน
    - การส่งไฟล์ใช้ API อัปโหลดของ Slack และสามารถรวมการตอบกลับเธรด (`thread_ts`) ได้
    - เพดานสื่อขาออกจะตาม `channels.slack.mediaMaxMb` เมื่อกำหนดค่าไว้; มิฉะนั้นการส่งผ่านช่องจะใช้ค่าเริ่มต้นตามชนิด MIME จากไปป์ไลน์สื่อ

  </Accordion>

  <Accordion title="เป้าหมายการส่ง">
    เป้าหมายที่ชัดเจนที่แนะนำ:

    - `user:<id>` สำหรับ DM
    - `channel:<id>` สำหรับช่อง

    DM Slack ที่เป็นข้อความ/block เท่านั้นสามารถโพสต์ไปยัง ID ผู้ใช้ได้โดยตรง; การอัปโหลดไฟล์และการส่งแบบเธรดจะเปิด DM ผ่าน API การสนทนาของ Slack ก่อน เพราะเส้นทางเหล่านั้นต้องการ ID การสนทนาที่เป็นรูปธรรม

  </Accordion>
</AccordionGroup>

## คำสั่งและพฤติกรรมสแลช

คำสั่งสแลชจะแสดงใน Slack เป็นคำสั่งที่กำหนดค่าไว้คำสั่งเดียวหรือหลายคำสั่งเนทีฟ กำหนดค่า `channels.slack.slashCommand` เพื่อเปลี่ยนค่าเริ่มต้นของคำสั่ง:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

คำสั่งเนทีฟต้องใช้ [การตั้งค่า manifest เพิ่มเติม](#additional-manifest-settings) ในแอป Slack ของคุณ และเปิดใช้ด้วย `channels.slack.commands.native: true` หรือ `commands.native: true` ในการกำหนดค่าส่วนกลางแทน

- โหมดอัตโนมัติของคำสั่งเนทีฟเป็น **ปิด** สำหรับ Slack ดังนั้น `commands.native: "auto"` จะไม่เปิดใช้คำสั่งเนทีฟของ Slack

```txt
/help
```

เมนูอาร์กิวเมนต์เนทีฟใช้กลยุทธ์การเรนเดอร์แบบปรับตัว ซึ่งแสดง modal ยืนยันก่อน dispatch ค่า option ที่เลือก:

- สูงสุด 5 ตัวเลือก: block ปุ่ม
- 6-100 ตัวเลือก: เมนูเลือกแบบ static
- มากกว่า 100 ตัวเลือก: เลือกแบบ external พร้อมการกรอง option แบบ async เมื่อมีตัวจัดการ interactivity options
- เกินขีดจำกัด Slack: ค่า option ที่เข้ารหัสจะ fallback ไปเป็นปุ่ม

```txt
/think
```

เซสชัน Slash ใช้คีย์ที่แยกกัน เช่น `agent:<agentId>:slack:slash:<userId>` และยังคงกำหนดเส้นทางการเรียกใช้คำสั่งไปยังเซสชันการสนทนาเป้าหมายโดยใช้ `CommandTargetSessionKey`

## การตอบกลับแบบโต้ตอบ

Slack สามารถแสดงผลตัวควบคุมการตอบกลับแบบโต้ตอบที่ agent เขียนขึ้นได้ แต่ฟีเจอร์นี้ถูกปิดใช้งานโดยค่าเริ่มต้น
สำหรับเอาต์พุตใหม่จาก agent, CLI และ Plugin ให้เลือกใช้ปุ่ม `presentation`
หรือบล็อก select ที่ใช้ร่วมกันเป็นหลัก ทั้งสองใช้เส้นทางการโต้ตอบของ Slack
เดียวกัน และยังลดระดับการทำงานได้บนช่องทางอื่น

เปิดใช้งานแบบทั่วทั้งระบบ:

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

หรือเปิดใช้งานเฉพาะบัญชี Slack หนึ่งบัญชี:

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

เมื่อเปิดใช้งานแล้ว agents ยังสามารถส่งคำสั่งตอบกลับแบบ Slack-only ที่เลิกแนะนำแล้วได้:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

คำสั่งเหล่านี้จะถูกคอมไพล์เป็น Slack Block Kit และกำหนดเส้นทางการคลิกหรือการเลือก
กลับผ่านเส้นทางเหตุการณ์การโต้ตอบของ Slack ที่มีอยู่ เก็บไว้สำหรับพรอมป์เก่า
และทางออกเฉพาะ Slack; ใช้ presentation ที่ใช้ร่วมกันสำหรับตัวควบคุมแบบพกพาใหม่

API ของตัวคอมไพเลอร์คำสั่งก็เลิกแนะนำสำหรับโค้ด producer ใหม่เช่นกัน:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

ใช้เพย์โหลด `presentation` และ `buildSlackPresentationBlocks(...)` สำหรับตัวควบคุมใหม่
ที่แสดงผลใน Slack

หมายเหตุ:

- นี่คือ UI ดั้งเดิมเฉพาะ Slack ช่องทางอื่นจะไม่แปลคำสั่ง Slack Block
  Kit เป็นระบบปุ่มของตนเอง
- ค่าคอลแบ็กแบบโต้ตอบเป็นโทเค็นทึบที่ OpenClaw สร้างขึ้น ไม่ใช่ค่าดิบที่ agent เขียนขึ้น
- หากบล็อกแบบโต้ตอบที่สร้างขึ้นจะเกินขีดจำกัดของ Slack Block Kit, OpenClaw จะถอยกลับไปใช้ข้อความตอบกลับเดิมแทนการส่งเพย์โหลด blocks ที่ไม่ถูกต้อง

### การส่ง modal ที่ Plugin เป็นเจ้าของ

Plugin ของ Slack ที่ลงทะเบียนตัวจัดการแบบโต้ตอบยังสามารถรับเหตุการณ์วงจรชีวิต
`view_submission` และ `view_closed` ก่อนที่ OpenClaw จะบีบอัด
เพย์โหลดสำหรับเหตุการณ์ระบบที่ agent มองเห็นได้ ใช้รูปแบบการกำหนดเส้นทางเหล่านี้แบบใดแบบหนึ่ง
เมื่อเปิด Slack modal:

- ตั้งค่า `callback_id` เป็น `openclaw:<namespace>:<payload>`
- หรือเก็บ `callback_id` ที่มีอยู่ไว้ และใส่ `pluginInteractiveData:
"<namespace>:<payload>"` ใน `private_metadata` ของ modal

ตัวจัดการจะได้รับ `ctx.interaction.kind` เป็น `view_submission` หรือ
`view_closed`, `inputs` ที่ทำให้เป็นมาตรฐานแล้ว และอ็อบเจ็กต์ `stateValues` ดิบแบบเต็มจาก
Slack การกำหนดเส้นทางด้วย callback-id อย่างเดียวเพียงพอสำหรับเรียกใช้ตัวจัดการของ Plugin; ใส่
ฟิลด์การกำหนดเส้นทางผู้ใช้/เซสชัน `private_metadata` ของ modal ที่มีอยู่ด้วยเมื่อ
modal ควรสร้างเหตุการณ์ระบบที่ agent มองเห็นได้ด้วย agent จะได้รับ
เหตุการณ์ระบบ `Slack interaction: ...` แบบกะทัดรัดและผ่านการลบข้อมูลอ่อนไหวแล้ว หากตัวจัดการส่งคืน
`systemEvent.summary`, `systemEvent.reference` หรือ `systemEvent.data` ฟิลด์เหล่านั้น
จะถูกรวมไว้ในเหตุการณ์แบบกะทัดรัดนั้น เพื่อให้ agent อ้างอิงพื้นที่จัดเก็บที่
Plugin เป็นเจ้าของได้โดยไม่เห็นเพย์โหลดฟอร์มทั้งหมด

## การอนุมัติแบบเนทีฟใน Slack

Slack สามารถทำหน้าที่เป็นไคลเอนต์อนุมัติแบบเนทีฟด้วยปุ่มและการโต้ตอบแบบโต้ตอบ แทนที่จะถอยกลับไปใช้ Web UI หรือเทอร์มินัล

- การอนุมัติ Exec และ Plugin สามารถแสดงผลเป็นพรอมป์ Slack-native Block Kit ได้
- `channels.slack.execApprovals.*` ยังคงเป็นการเปิดใช้งานไคลเอนต์อนุมัติ exec แบบเนทีฟและคอนฟิกการกำหนดเส้นทาง DM/ช่องทาง
- DM การอนุมัติ Exec ใช้ `channels.slack.execApprovals.approvers` หรือ `commands.ownerAllowFrom`
- การอนุมัติ Plugin ใช้ปุ่ม Slack-native เมื่อ Slack ถูกเปิดใช้งานเป็นไคลเอนต์อนุมัติแบบเนทีฟสำหรับเซสชันต้นทาง หรือเมื่อ `approvals.plugin` กำหนดเส้นทางไปยังเซสชัน Slack ต้นทางหรือเป้าหมาย Slack
- DM การอนุมัติ Plugin ใช้ผู้อนุมัติ Plugin ของ Slack จาก `channels.slack.allowFrom`, `allowFrom` ของบัญชีที่ตั้งชื่อไว้ หรือเส้นทางเริ่มต้นของบัญชี
- การให้สิทธิ์ผู้อนุมัติยังคงถูกบังคับใช้: ผู้อนุมัติแบบ exec-only ไม่สามารถอนุมัติคำขอ Plugin ได้ เว้นแต่จะเป็นผู้อนุมัติ Plugin ด้วย

สิ่งนี้ใช้พื้นผิวปุ่มอนุมัติที่ใช้ร่วมกันเดียวกับช่องทางอื่น เมื่อเปิดใช้งาน `interactivity` ในการตั้งค่าแอป Slack ของคุณ พรอมป์การอนุมัติจะแสดงผลเป็นปุ่ม Block Kit โดยตรงในการสนทนา
เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก; OpenClaw
ควรรวมคำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของเครื่องมือบอกว่าการอนุมัติผ่านแชต
ไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียวเท่านั้น

เส้นทางคอนฟิก:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; ถอยกลับไปใช้ `commands.ownerAllowFrom` เมื่อทำได้)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack จะเปิดใช้งานการอนุมัติ exec แบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และมี
ผู้อนุมัติ exec อย่างน้อยหนึ่งรายที่ resolve ได้ Slack ยังสามารถจัดการการอนุมัติ Plugin แบบเนทีฟผ่านเส้นทาง
native-client นี้เมื่อผู้อนุมัติ Plugin ของ Slack resolve ได้ และคำขอตรงกับตัวกรอง native-client ตั้งค่า
`enabled: false` เพื่อปิดใช้งาน Slack เป็นไคลเอนต์อนุมัติแบบเนทีฟอย่างชัดเจน ตั้งค่า `enabled: true` เพื่อ
บังคับเปิดการอนุมัติแบบเนทีฟเมื่อผู้อนุมัติ resolve ได้ การปิดใช้งานการอนุมัติ exec ของ Slack จะไม่ปิดใช้งาน
การส่งการอนุมัติ Plugin แบบเนทีฟของ Slack ที่เปิดใช้งานผ่าน `approvals.plugin`; การส่งการอนุมัติ Plugin
ใช้ผู้อนุมัติ Plugin ของ Slack แทน

พฤติกรรมเริ่มต้นเมื่อไม่มีคอนฟิกการอนุมัติ exec ของ Slack อย่างชัดเจน:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

จำเป็นต้องใช้คอนฟิก Slack-native อย่างชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ผู้อนุมัติ เพิ่มตัวกรอง หรือ
เลือกใช้การส่งไปยังแชตต้นทาง:

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

การส่งต่อ `approvals.exec` ที่ใช้ร่วมกันเป็นคนละส่วนกัน ใช้เฉพาะเมื่อพรอมป์การอนุมัติ exec ต้อง
กำหนดเส้นทางไปยังแชตอื่นหรือเป้าหมาย out-of-band ที่ระบุอย่างชัดเจนด้วย การส่งต่อ `approvals.plugin` ที่ใช้ร่วมกันก็
เป็นคนละส่วนเช่นกัน; การส่งแบบเนทีฟของ Slack จะระงับ fallback นั้นเฉพาะเมื่อ Slack สามารถจัดการ
คำขออนุมัติ Plugin แบบเนทีฟได้

`/approve` ในแชตเดียวกันยังทำงานได้ในช่องทาง Slack และ DM ที่รองรับคำสั่งอยู่แล้ว ดู [การอนุมัติ Exec](/th/tools/exec-approvals) สำหรับโมเดลการส่งต่อการอนุมัติทั้งหมด

## เหตุการณ์และพฤติกรรมการปฏิบัติงาน

- การแก้ไข/ลบข้อความจะถูกแมปเป็นเหตุการณ์ระบบ
- การออกอากาศเธรด (การตอบกลับเธรดแบบ "Also send to channel") จะถูกประมวลผลเป็นข้อความผู้ใช้ปกติ
- เหตุการณ์เพิ่ม/ลบ reaction จะถูกแมปเป็นเหตุการณ์ระบบ
- เหตุการณ์สมาชิกเข้าร่วม/ออก, สร้าง/เปลี่ยนชื่อช่องทาง และเพิ่ม/ลบ pin จะถูกแมปเป็นเหตุการณ์ระบบ
- `channel_id_changed` สามารถย้ายคีย์คอนฟิกช่องทางเมื่อเปิดใช้งาน `configWrites`
- เมตาดาต้า topic/purpose ของช่องทางถือเป็นบริบทที่ไม่น่าเชื่อถือ และสามารถถูกฉีดเข้าไปในบริบทการกำหนดเส้นทางได้
- การ seed บริบทตัวเริ่มเธรดและประวัติเธรดเริ่มต้นจะถูกกรองด้วย allowlist ผู้ส่งที่กำหนดไว้เมื่อเกี่ยวข้อง
- Block actions, shortcuts และการโต้ตอบ modal จะปล่อยเหตุการณ์ระบบ `Slack interaction: ...` แบบมีโครงสร้างพร้อมฟิลด์เพย์โหลดที่ละเอียด:
  - block actions: ค่าที่เลือก, ป้ายกำกับ, ค่าตัวเลือก และเมตาดาต้า `workflow_*`
  - global shortcuts: เมตาดาต้าคอลแบ็กและผู้กระทำ ถูกกำหนดเส้นทางไปยังเซสชันตรงของผู้กระทำ
  - message shortcuts: บริบทคอลแบ็ก, ผู้กระทำ, ช่องทาง, เธรด และข้อความที่เลือก
  - เหตุการณ์ modal `view_submission` และ `view_closed` พร้อมเมตาดาต้าช่องทางที่กำหนดเส้นทางแล้วและอินพุตฟอร์ม

กำหนด global หรือ message shortcuts ในคอนฟิกแอป Slack ของคุณ และใช้ callback ID ใดก็ได้ที่ไม่ว่าง OpenClaw จะตอบรับเพย์โหลด shortcut ที่ตรงกัน ใช้นโยบายผู้ส่ง DM/ช่องทางเดียวกับการโต้ตอบ Slack อื่น และจัดคิวเหตุการณ์ที่ล้างข้อมูลแล้วสำหรับเซสชัน agent ที่กำหนดเส้นทาง Trigger IDs และ response URLs จะถูกลบออกจากบริบทของ agent

## ข้อมูลอ้างอิงคอนฟิก

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงคอนฟิก - Slack](/th/gateway/config-channels#slack)

<Accordion title="ฟิลด์ Slack สัญญาณสูง">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (ดั้งเดิม: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- ตัวสลับความเข้ากันได้: `dangerouslyAllowNameMatching` (ใช้เมื่อจำเป็นเร่งด่วน; ปิดไว้เว้นแต่จำเป็น)
- การเข้าถึงช่องทาง: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- เธรด/ประวัติ: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่ง: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- unfurls: `unfurlLinks` (ค่าเริ่มต้น: `false`), `unfurlMedia` สำหรับการควบคุมพรีวิวลิงก์/สื่อของ `chat.postMessage`; ตั้งค่า `unfurlLinks: true` เพื่อเลือกกลับมาใช้พรีวิวลิงก์
- การปฏิบัติงาน/ฟีเจอร์: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในช่องทาง">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - allowlist ช่องทาง (`channels.slack.channels`) — **คีย์ต้องเป็น channel IDs** (`C12345678`) ไม่ใช่ชื่อ (`#channel-name`) คีย์ตามชื่อจะล้มเหลวอย่างเงียบ ๆ ภายใต้ `groupPolicy: "allowlist"` เพราะการกำหนดเส้นทางช่องทางเป็นแบบ ID-first โดยค่าเริ่มต้น วิธีหา ID: คลิกขวาที่ช่องทางใน Slack → **Copy link** — ค่า `C...` ที่ท้าย URL คือ channel ID
    - `requireMention`
    - allowlist `users` ต่อช่องทาง
    - `messages.groupChat.visibleReplies`: คำขอกลุ่ม/ช่องทางปกติมีค่าเริ่มต้นเป็น `"automatic"` หากคุณเลือกใช้ `"message_tool"` และบันทึกแสดงข้อความ assistant โดยไม่มีการเรียก `message(action=send)` แสดงว่าโมเดลพลาดเส้นทางเครื่องมือข้อความที่มองเห็นได้ ข้อความสุดท้ายจะยังเป็นส่วนตัวในโหมดนี้; ตรวจสอบบันทึก gateway แบบละเอียดสำหรับเมตาดาต้าเพย์โหลดที่ถูกระงับ หรือเปลี่ยนเป็น `"automatic"` หากคุณต้องการให้ทุกคำตอบสุดท้ายปกติของ assistant ถูกโพสต์ผ่านเส้นทางดั้งเดิม
    - `messages.groupChat.unmentionedInbound`: หากเป็น `"room_event"` การสนทนาในช่องทางที่ได้รับอนุญาตแต่ไม่ได้ mention จะเป็นบริบทแวดล้อมและยังคงเงียบ เว้นแต่ agent จะเรียกเครื่องมือ `message` ดู [เหตุการณ์ห้องแวดล้อม](/th/channels/ambient-room-events)

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

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
    - `channels.slack.dmPolicy` (หรือแบบดั้งเดิม `channels.slack.dm.policy`)
    - การอนุมัติการจับคู่ / รายการ allowlist (`dmPolicy: "open"` ยังต้องมี `channels.slack.allowFrom: ["*"]`)
    - DM กลุ่มใช้การจัดการ MPIM; เปิดใช้งาน `channels.slack.dm.groupEnabled` และหากมีการคอนฟิกไว้ ให้รวม MPIM ไว้ใน `channels.slack.dm.groupChannels`
    - เหตุการณ์ DM ของ Slack Assistant: บันทึกแบบละเอียดที่กล่าวถึง `drop message_changed`
      มักหมายความว่า Slack ส่งเหตุการณ์เธรด Assistant ที่ถูกแก้ไขโดยไม่มี
      ผู้ส่งที่เป็นมนุษย์ซึ่งกู้คืนได้ในเมตาดาต้าข้อความ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="โหมด Socket ไม่เชื่อมต่อ">
    ตรวจสอบความถูกต้องของโทเค็น bot + app และการเปิดใช้งาน Socket Mode ในการตั้งค่าแอป Slack
    App-Level Token ต้องมี `connections:write` และ Bot User OAuth Token
    bot token ต้องเป็นของแอป/เวิร์กสเปซ Slack เดียวกันกับ app token

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` แสดงว่าบัญชี Slack ถูก
    คอนฟิกไว้แล้ว แต่ runtime ปัจจุบันไม่สามารถ resolve ค่า
    ที่อิง `SecretRef` ได้

    บันทึกเช่น `slack socket mode failed to start; retry ...` เป็นความล้มเหลวในการเริ่มต้นที่กู้คืนได้
    ขอบเขตที่ขาดหาย โทเค็นที่ถูกเพิกถอน และการยืนยันตัวตนที่ไม่ถูกต้องจะล้มเหลวทันที
    แทน บันทึก `slack token mismatch ...` หมายความว่าโทเค็นบอทและโทเค็นแอป
    ดูเหมือนจะเป็นของแอป Slack คนละตัว ให้แก้ไขข้อมูลประจำตัวของแอป Slack

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    ตรวจสอบ:

    - signing secret
    - เส้นทาง webhook
    - URL คำขอของ Slack (เหตุการณ์ + การโต้ตอบ + คำสั่ง Slash)
    - `webhookPath` ที่ไม่ซ้ำกันสำหรับแต่ละบัญชี HTTP
    - URL สาธารณะสิ้นสุด TLS และส่งต่อคำขอไปยังเส้นทาง Gateway
    - เส้นทาง `request_url` ของแอป Slack ตรงกับ `channels.slack.webhookPath` ทุกประการ (ค่าเริ่มต้น `/slack/events`)

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏในสแนปชอตบัญชี
    แสดงว่าบัญชี HTTP ถูกกำหนดค่าแล้ว แต่รันไทม์ปัจจุบันไม่สามารถ
    resolve signing secret ที่อิงกับ SecretRef ได้

    บันทึก `slack: webhook path ... already registered` ที่เกิดซ้ำหมายความว่าบัญชี HTTP
    สองบัญชีกำลังใช้ `webhookPath` เดียวกัน ให้กำหนดเส้นทางที่แตกต่างกันให้แต่ละบัญชี

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    ตรวจสอบว่าคุณตั้งใจใช้แบบใด:

    - โหมดคำสั่งเนทีฟ (`channels.slack.commands.native: true`) พร้อมคำสั่ง Slash ที่ตรงกันซึ่งลงทะเบียนไว้ใน Slack
    - หรือโหมดคำสั่ง Slash เดี่ยว (`channels.slack.slashCommand.enabled: true`)

    Slack ไม่สร้างหรือลบคำสั่ง Slash โดยอัตโนมัติ `commands.native: "auto"` ไม่ได้เปิดใช้คำสั่งเนทีฟของ Slack ให้ใช้ `true` และสร้างคำสั่งที่ตรงกันในแอป Slack ในโหมด HTTP คำสั่ง Slash ของ Slack ทุกคำสั่งต้องมี URL ของ Gateway ใน Socket Mode เพย์โหลดคำสั่งจะมาถึงผ่านเว็บซ็อกเก็ต และ Slack จะไม่สนใจ `slash_commands[].url`

    ตรวจสอบ `commands.useAccessGroups`, การอนุญาต DM, รายการอนุญาตของช่อง
    และรายการอนุญาต `users` ต่อช่องด้วย Slack ส่งคืนข้อผิดพลาดแบบ ephemeral สำหรับ
    ผู้ส่งคำสั่ง Slash ที่ถูกบล็อก รวมถึง:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิงวิชันของไฟล์แนบ

Slack สามารถแนบสื่อที่ดาวน์โหลดแล้วเข้ากับเทิร์นของเอเจนต์เมื่อการดาวน์โหลดไฟล์ Slack สำเร็จและขีดจำกัดขนาดอนุญาต ไฟล์รูปภาพสามารถส่งผ่านเส้นทางการเข้าใจสื่อหรือส่งตรงไปยังโมเดลตอบกลับที่รองรับวิชันได้ ส่วนไฟล์อื่นจะถูกเก็บไว้เป็นบริบทไฟล์ที่ดาวน์โหลดได้ แทนที่จะถือเป็นอินพุตรูปภาพ

### ประเภทสื่อที่รองรับ

| ประเภทสื่อ                     | แหล่งที่มา               | พฤติกรรมปัจจุบัน                                                                  | หมายเหตุ                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| รูปภาพ JPEG / PNG / GIF / WebP | URL ไฟล์ Slack       | ดาวน์โหลดและแนบเข้ากับเทิร์นเพื่อให้จัดการด้วยความสามารถด้านวิชัน                   | ขีดจำกัดต่อไฟล์: `channels.slack.mediaMaxMb` (ค่าเริ่มต้น 20 MB)                 |
| ไฟล์ PDF                      | URL ไฟล์ Slack       | ดาวน์โหลดและเปิดเผยเป็นบริบทไฟล์สำหรับเครื่องมือ เช่น `download-file` หรือ `pdf` | ขาเข้าของ Slack ไม่แปลง PDF เป็นอินพุตวิชันรูปภาพโดยอัตโนมัติ |
| ไฟล์อื่น                    | URL ไฟล์ Slack       | ดาวน์โหลดเมื่อเป็นไปได้และเปิดเผยเป็นบริบทไฟล์                              | ไฟล์ไบนารีไม่ถูกถือเป็นอินพุตรูปภาพ                               |
| การตอบกลับในเธรด                 | ไฟล์ของตัวเริ่มเธรด | ไฟล์ของข้อความรากสามารถถูกเติมเป็นบริบทเมื่อการตอบกลับไม่มีสื่อโดยตรง  | ตัวเริ่มที่มีเฉพาะไฟล์ใช้ placeholder ของไฟล์แนบ                          |
| ข้อความหลายรูปภาพ           | ไฟล์ Slack หลายไฟล์ | แต่ละไฟล์ถูกประเมินอย่างอิสระ                                              | การประมวลผลของ Slack จำกัดที่แปดไฟล์ต่อข้อความ                     |

### ไปป์ไลน์ขาเข้า

เมื่อข้อความ Slack ที่มีไฟล์แนบมาถึง:

1. OpenClaw ดาวน์โหลดไฟล์จาก URL ส่วนตัวของ Slack โดยใช้โทเค็นบอท
2. ไฟล์ถูกเขียนไปยังที่เก็บสื่อเมื่อสำเร็จ
3. เส้นทางสื่อที่ดาวน์โหลดแล้วและประเภทเนื้อหาถูกเพิ่มลงในบริบทขาเข้า
4. เส้นทางโมเดล/เครื่องมือที่รองรับรูปภาพสามารถใช้ไฟล์แนบรูปภาพจากบริบทนั้นได้
5. ไฟล์ที่ไม่ใช่รูปภาพยังคงพร้อมใช้งานเป็นเมทาดาทาไฟล์หรือการอ้างอิงสื่อสำหรับเครื่องมือที่จัดการได้

### การสืบทอดไฟล์แนบจากรากเธรด

เมื่อข้อความมาถึงในเธรด (มีพาเรนต์ `thread_ts`):

- หากการตอบกลับเองไม่มีสื่อโดยตรงและข้อความรากที่รวมมามีไฟล์ Slack สามารถเติมไฟล์รากเป็นบริบทตัวเริ่มเธรดได้
- ไฟล์แนบของการตอบกลับโดยตรงมีลำดับความสำคัญเหนือไฟล์แนบของข้อความราก
- ข้อความรากที่มีเฉพาะไฟล์และไม่มีข้อความจะแสดงด้วย placeholder ของไฟล์แนบ เพื่อให้ fallback ยังคงรวมไฟล์ของข้อความนั้นได้

### การจัดการไฟล์แนบหลายรายการ

เมื่อข้อความ Slack เดียวมีไฟล์แนบหลายไฟล์:

- ไฟล์แนบแต่ละรายการถูกประมวลผลอย่างอิสระผ่านไปป์ไลน์สื่อ
- การอ้างอิงสื่อที่ดาวน์โหลดแล้วถูกรวบรวมไว้ในบริบทข้อความ
- ลำดับการประมวลผลเป็นไปตามลำดับไฟล์ของ Slack ในเพย์โหลดเหตุการณ์
- ความล้มเหลวในการดาวน์โหลดไฟล์แนบหนึ่งรายการไม่บล็อกไฟล์อื่น

### ขีดจำกัดขนาด การดาวน์โหลด และโมเดล

- **ขีดจำกัดขนาด**: ค่าเริ่มต้น 20 MB ต่อไฟล์ กำหนดค่าได้ผ่าน `channels.slack.mediaMaxMb`
- **ความล้มเหลวในการดาวน์โหลด**: ไฟล์ที่ Slack ให้บริการไม่ได้, URL หมดอายุ, ไฟล์ที่เข้าถึงไม่ได้, ไฟล์ขนาดเกิน และการตอบกลับ HTML สำหรับ auth/login ของ Slack จะถูกข้าม แทนที่จะถูกรายงานว่าเป็นรูปแบบที่ไม่รองรับ
- **โมเดลวิชัน**: การวิเคราะห์รูปภาพใช้โมเดลตอบกลับที่ใช้งานอยู่เมื่อรองรับวิชัน หรือโมเดลรูปภาพที่กำหนดค่าไว้ที่ `agents.defaults.imageModel`

### ขีดจำกัดที่ทราบ

| สถานการณ์                               | พฤติกรรมปัจจุบัน                                                             | วิธีแก้ปัญหา                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL ไฟล์ Slack หมดอายุ                 | ข้ามไฟล์; ไม่แสดงข้อผิดพลาด                                                 | อัปโหลดไฟล์อีกครั้งใน Slack                                                |
| ไม่ได้กำหนดค่าโมเดลวิชัน            | ไฟล์แนบรูปภาพถูกจัดเก็บเป็นการอ้างอิงสื่อ แต่ไม่ถูกวิเคราะห์เป็นรูปภาพ | กำหนดค่า `agents.defaults.imageModel` หรือใช้โมเดลตอบกลับที่รองรับวิชัน |
| รูปภาพขนาดใหญ่มาก (> 20 MB ตามค่าเริ่มต้น) | ข้ามตามขีดจำกัดขนาด                                                         | เพิ่ม `channels.slack.mediaMaxMb` หาก Slack อนุญาต                       |
| ไฟล์แนบที่ส่งต่อ/แชร์           | ข้อความและสื่อรูปภาพ/ไฟล์ที่โฮสต์โดย Slack เป็นแบบดีที่สุดเท่าที่ทำได้                       | แชร์ใหม่โดยตรงในเธรด OpenClaw                                   |
| ไฟล์แนบ PDF                        | จัดเก็บเป็นบริบทไฟล์/สื่อ ไม่ได้ถูกกำหนดเส้นทางผ่านวิชันรูปภาพโดยอัตโนมัติ  | ใช้ `download-file` สำหรับเมทาดาทาไฟล์หรือเครื่องมือ `pdf` สำหรับการวิเคราะห์ PDF   |

### เอกสารที่เกี่ยวข้อง

- [ไปป์ไลน์การเข้าใจสื่อ](/th/nodes/media-understanding)
- [เครื่องมือ PDF](/th/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — การเปิดใช้วิชันสำหรับไฟล์แนบ Slack
- การทดสอบรีเกรสชัน: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- การตรวจสอบแบบสด: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Slack กับ gateway
  </Card>
  <Card title="Groups" icon="users" href="/th/channels/groups">
    พฤติกรรมช่องและ DM กลุ่ม
  </Card>
  <Card title="Channel routing" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="Security" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเสริมความแข็งแกร่ง
  </Card>
  <Card title="Configuration" icon="sliders" href="/th/gateway/configuration">
    เค้าโครง config และลำดับความสำคัญ
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    แค็ตตาล็อกคำสั่งและพฤติกรรม
  </Card>
</CardGroup>
