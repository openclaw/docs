---
read_when:
    - การตั้งค่า Slack หรือการแก้ไขข้อบกพร่องของโหมด socket/HTTP ของ Slack
summary: การตั้งค่า Slack และพฤติกรรมขณะรันไทม์ (Socket Mode + HTTP Request URLs)
title: Slack
x-i18n:
    generated_at: "2026-04-23T10:14:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3daf52cd28998bf7d692190468b9d8330f1867f56e49fc69666e7e107d4ba47c
    source_path: channels/slack.md
    workflow: 15
---

# Slack

สถานะ: พร้อมใช้งานจริงสำหรับ DM + ช่องผ่านการผสานรวมแอป Slack โหมดเริ่มต้นคือ Socket Mode และรองรับ HTTP Request URLs ด้วย

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    DM ของ Slack ใช้โหมด pairing เป็นค่าเริ่มต้น
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
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

        - เลือก **from a manifest** และเลือก workspace สำหรับแอปของคุณ
        - วาง [manifest ตัวอย่าง](#manifest-and-scope-checklist) จากด้านล่าง แล้วดำเนินการสร้างต่อ
        - สร้าง **App-Level Token** (`xapp-...`) พร้อมสิทธิ์ `connections:write`
        - ติดตั้งแอปและคัดลอก **Bot Token** (`xoxb-...`) ที่แสดง
      </Step>

      <Step title="Configure OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        ตัวแปรสภาพแวดล้อมสำรอง (เฉพาะบัญชีเริ่มต้น):

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

        - เลือก **from a manifest** และเลือก workspace สำหรับแอปของคุณ
        - วาง [manifest ตัวอย่าง](#manifest-and-scope-checklist) และอัปเดต URL ก่อนสร้าง
        - บันทึก **Signing Secret** สำหรับการตรวจสอบคำขอ
        - ติดตั้งแอปและคัดลอก **Bot Token** (`xoxb-...`) ที่แสดง

      </Step>

      <Step title="Configure OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        ใช้เส้นทาง webhook ที่ไม่ซ้ำกันสำหรับ HTTP หลายบัญชี

        กำหนด `webhookPath` ที่แตกต่างกันให้แต่ละบัญชี (ค่าเริ่มต้นคือ `/slack/events`) เพื่อไม่ให้การลงทะเบียนชนกัน
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

## รายการตรวจสอบ manifest และ scope

<Tabs>
  <Tab title="Socket Mode (default)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
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
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
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

  </Tab>

  <Tab title="HTTP Request URLs">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
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
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
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

  </Tab>
</Tabs>

### การตั้งค่า manifest เพิ่มเติม

แสดงความสามารถเพิ่มเติมที่ขยายจากค่าเริ่มต้นข้างต้น

<AccordionGroup>
  <Accordion title="Native slash commands แบบเลือกใช้">

    สามารถใช้ [native slash commands](#commands-and-slash-behavior) หลายรายการแทนการตั้งค่าคำสั่งเดียว โดยมีรายละเอียดเพิ่มเติมดังนี้:

    - ใช้ `/agentstatus` แทน `/status` เพราะคำสั่ง `/status` ถูกสงวนไว้
    - สามารถเปิดให้ใช้ slash commands ได้พร้อมกันไม่เกิน 25 คำสั่ง

    แทนที่ส่วน `features.slash_commands` เดิมของคุณด้วยชุดย่อยจาก[คำสั่งที่ใช้ได้](/th/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
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
        "description": "List providers/models or add a model",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
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
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "เริ่มเซสชันใหม่",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "รีเซ็ตเซสชันปัจจุบัน",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "ทำ Compaction บริบทของเซสชัน",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "หยุดการรันปัจจุบัน",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "จัดการการหมดอายุของการผูกกับเธรด",
        "usage_hint": "idle <duration|off> หรือ max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "ตั้งค่าระดับการคิด",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "สลับการแสดงผลแบบละเอียด",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "แสดงหรือตั้งค่าโหมด fast",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "สลับการมองเห็น reasoning",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "สลับโหมดยกระดับสิทธิ์",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "แสดงหรือตั้งค่าเริ่มต้นของ exec",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "แสดงหรือตั้งค่าโมเดล",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "แสดงรายการผู้ให้บริการ หรือโมเดลของผู้ให้บริการ",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "แสดงสรุปวิธีใช้แบบย่อ",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "แสดงแค็ตตาล็อกคำสั่งที่สร้างไว้",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "แสดงสิ่งที่เอเจนต์ปัจจุบันสามารถใช้ได้ในตอนนี้",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "แสดงสถานะรันไทม์ รวมถึงการใช้งาน/โควต้าของผู้ให้บริการเมื่อมี",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "แสดงรายการงานเบื้องหลังที่กำลังทำงาน/ล่าสุดสำหรับเซสชันปัจจุบัน",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "อธิบายวิธีประกอบบริบท",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "แสดงตัวตนผู้ส่งของคุณ",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "เรียกใช้ Skills ตามชื่อ",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "ถามคำถามเสริมโดยไม่เปลี่ยนบริบทของเซสชัน",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "ควบคุมส่วนท้ายการใช้งานหรือแสดงสรุปค่าใช้จ่าย",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="ขอบเขตสิทธิ์ผู้ประพันธ์แบบเลือกใช้ (การดำเนินการเขียน)">
    เพิ่ม bot scope `chat:write.customize` หากคุณต้องการให้ข้อความขาออกใช้ตัวตนของเอเจนต์ที่กำลังใช้งานอยู่ (ชื่อผู้ใช้และไอคอนแบบกำหนดเอง) แทนตัวตนเริ่มต้นของแอป Slack

    หากคุณใช้ไอคอนอีโมจิ Slack คาดหวังไวยากรณ์แบบ `:emoji_name:`

  </Accordion>
  <Accordion title="ขอบเขตสิทธิ์ user-token แบบเลือกใช้ (การดำเนินการอ่าน)">
    หากคุณกำหนดค่า `channels.slack.userToken` ขอบเขตสิทธิ์การอ่านที่ใช้โดยทั่วไปคือ:

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

- ต้องใช้ `botToken` + `appToken` สำหรับ Socket Mode
- โหมด HTTP ต้องใช้ `botToken` + `signingSecret`
- `botToken`, `appToken`, `signingSecret` และ `userToken` รองรับทั้งสตริงแบบ plaintext
  หรืออ็อบเจ็กต์ SecretRef
- โทเค็นในคอนฟิกจะมีลำดับความสำคัญเหนือ env fallback
- env fallback ของ `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ใช้ได้เฉพาะบัญชีเริ่มต้นเท่านั้น
- `userToken` (`xoxp-...`) ใช้ได้เฉพาะในคอนฟิก (ไม่มี env fallback) และมีค่าเริ่มต้นเป็นพฤติกรรมอ่านอย่างเดียว (`userTokenReadOnly: true`)

พฤติกรรมของสแนปช็อตสถานะ:

- การตรวจสอบบัญชี Slack ติดตามฟิลด์ `*Source` และ `*Status`
  แยกตามข้อมูลรับรอง (`botToken`, `appToken`, `signingSecret`, `userToken`)
- สถานะมีค่าเป็น `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าผ่าน SecretRef
  หรือแหล่งข้อมูลลับแบบไม่อินไลน์อื่น แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบัน
  ไม่สามารถ resolve ค่าจริงได้
- ในโหมด HTTP จะมี `signingSecretStatus`; ใน Socket Mode
  คู่ที่ต้องใช้คือ `botTokenStatus` + `appTokenStatus`

<Tip>
สำหรับการดำเนินการ/การอ่านไดเรกทอรี อาจเลือกใช้ user token ก่อนหากมีการกำหนดค่าไว้ สำหรับการเขียน ยังคงเลือก bot token ก่อน; การเขียนด้วย user token จะอนุญาตได้ก็ต่อเมื่อ `userTokenReadOnly: false` และ bot token ไม่พร้อมใช้งาน
</Tip>

## Actions และเกต

Actions ของ Slack ถูกควบคุมโดย `channels.slack.actions.*`

กลุ่ม action ที่มีในเครื่องมือ Slack ปัจจุบัน:

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

action ข้อความของ Slack ในปัจจุบันประกอบด้วย `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list`

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM (แบบเดิม: `channels.slack.dm.policy`):

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องมี `"*"` อยู่ใน `channels.slack.allowFrom`; แบบเดิม: `channels.slack.dm.allowFrom`)
    - `disabled`

    แฟล็กของ DM:

    - `dm.enabled` (ค่าเริ่มต้น true)
    - `channels.slack.allowFrom` (แนะนำ)
    - `dm.allowFrom` (แบบเดิม)
    - `dm.groupEnabled` (ค่าเริ่มต้นของกลุ่ม DM คือ false)
    - `dm.groupChannels` (allowlist ของ MPIM แบบเลือกใช้)

    ลำดับความสำคัญแบบหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่มีชื่อจะรับค่า `channels.slack.allowFrom` หากยังไม่ได้ตั้ง `allowFrom` ของตนเอง
    - บัญชีที่มีชื่อจะไม่รับค่า `channels.slack.accounts.default.allowFrom`

    การทำ pairing ใน DM ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="นโยบายช่อง">
    `channels.slack.groupPolicy` ควบคุมการจัดการช่อง:

    - `open`
    - `allowlist`
    - `disabled`

    allowlist ของช่องอยู่ภายใต้ `channels.slack.channels` และควรใช้รหัสช่องที่เสถียร

    หมายเหตุด้านรันไทม์: หากไม่มี `channels.slack` เลยทั้งหมด (ตั้งค่าผ่าน env เท่านั้น) รันไทม์จะ fallback เป็น `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

    การ resolve ชื่อ/รหัส:

    - รายการใน allowlist ของช่องและรายการใน allowlist ของ DM จะถูก resolve ตอนเริ่มต้น หากสิทธิ์โทเค็นอนุญาต
    - รายการชื่อช่องที่ resolve ไม่ได้จะยังคงอยู่ตามที่ตั้งค่า แต่โดยค่าเริ่มต้นจะถูกละเลยสำหรับการกำหนดเส้นทาง
    - การยืนยันสิทธิ์ขาเข้าและการกำหนดเส้นทางช่องใช้รหัสเป็นหลักโดยค่าเริ่มต้น; การจับคู่ชื่อผู้ใช้/slug โดยตรงต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="การกล่าวถึงและผู้ใช้ในช่อง">
    ข้อความในช่องจะถูกจำกัดด้วยการกล่าวถึงเป็นค่าเริ่มต้น

    แหล่งที่มาของการกล่าวถึง:

    - การกล่าวถึงแอปโดยตรง (`<@botId>`)
    - รูปแบบ regex สำหรับการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`, fallback คือ `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับแบบ implicit ในเธรดที่บอตถูกตอบกลับ (ปิดใช้งานเมื่อ `thread.requireExplicitMention` เป็น `true`)

    การควบคุมรายช่อง (`channels.slack.channels.<id>`; ใช้ชื่อได้ผ่านการ resolve ตอนเริ่มต้นหรือ `dangerouslyAllowNameMatching` เท่านั้น):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ของ `toolsBySender`: `id:`, `e164:`, `username:`, `name:` หรือ wildcard `"*"`
      (คีย์แบบเดิมที่ไม่มีคำนำหน้ายังคงแมปเป็น `id:` เท่านั้น)

  </Tab>
</Tabs>

## เธรด เซสชัน และแท็กการตอบกลับ

- DM ถูกกำหนดเส้นทางเป็น `direct`; ช่องเป็น `channel`; MPIM เป็น `group`
- เมื่อใช้ค่าเริ่มต้น `session.dmScope=main`, DM ของ Slack จะถูกรวมเข้าเป็นเซสชันหลักของเอเจนต์
- เซสชันของช่อง: `agent:<agentId>:slack:channel:<channelId>`
- การตอบกลับในเธรดสามารถสร้างส่วนต่อท้ายเซสชันของเธรด (`:thread:<threadTs>`) ได้เมื่อเกี่ยวข้อง
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความในเธรดที่มีอยู่เดิมที่จะถูกดึงเมื่อเริ่มเซสชันเธรดใหม่ (ค่าเริ่มต้น `20`; ตั้งเป็น `0` เพื่อปิดใช้งาน)
- `channels.slack.thread.requireExplicitMention` (ค่าเริ่มต้น `false`): เมื่อเป็น `true` จะระงับการกล่าวถึงเธรดแบบ implicit เพื่อให้บอตตอบเฉพาะการกล่าวถึง `@bot` แบบชัดเจนภายในเธรดเท่านั้น แม้ว่าบอตจะเคยมีส่วนร่วมในเธรดนั้นแล้วก็ตาม หากไม่ตั้งค่านี้ การตอบกลับในเธรดที่บอตมีส่วนร่วมจะข้ามเกต `requireMention`

การควบคุมการตอบกลับในเธรด:

- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: แยกตาม `direct|group|channel`
- fallback แบบเดิมสำหรับแชตโดยตรง: `channels.slack.dm.replyToMode`

รองรับแท็กการตอบกลับแบบกำหนดเอง:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

หมายเหตุ: `replyToMode="off"` จะปิดใช้งาน **การตอบกลับแบบเธรดทั้งหมด** ใน Slack รวมถึงแท็ก `[[reply_to_*]]` แบบชัดเจนด้วย ซึ่งแตกต่างจาก Telegram ที่ยังคงรองรับแท็กแบบชัดเจนในโหมด `"off"` ความแตกต่างนี้สะท้อนโมเดลเธรดของแพลตฟอร์ม: เธรดใน Slack ซ่อนข้อความออกจากช่อง ขณะที่การตอบกลับใน Telegram ยังคงมองเห็นได้ในลำดับแชตหลัก

การตอบกลับแบบเธรดที่โฟกัสใน Slack จะถูกกำหนดเส้นทางผ่านเซสชัน ACP ที่ผูกอยู่เมื่อมีอยู่ แทนที่จะเตรียมการตอบกลับกับ shell เอเจนต์เริ่มต้น ซึ่งช่วยให้การผูก `/focus` และ `/acp spawn ... --bind here` ยังคงใช้งานได้สำหรับข้อความติดตามผลในเธรด

## ปฏิกิริยา Ack

`ackReaction` จะส่งอีโมจิยืนยันขณะ OpenClaw กำลังประมวลผลข้อความขาเข้า

ลำดับการ resolve:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback เป็นอีโมจิจากตัวตนเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้นใช้ "👀")

หมายเหตุ:

- Slack คาดหวัง shortcodes (ตัวอย่างเช่น `"eyes"`)
- ใช้ `""` เพื่อปิดปฏิกิริยาสำหรับบัญชี Slack นั้นหรือปิดแบบส่วนกลาง

## การสตรีมข้อความ

`channels.slack.streaming` ควบคุมพฤติกรรมการแสดงตัวอย่างแบบสด:

- `off`: ปิดการสตรีมตัวอย่างแบบสด
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความตัวอย่างด้วยผลลัพธ์บางส่วนล่าสุด
- `block`: ต่อท้ายการอัปเดตตัวอย่างแบบเป็นชังก์
- `progress`: แสดงข้อความสถานะความคืบหน้าระหว่างสร้าง แล้วจึงส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อการแสดงตัวอย่างฉบับร่างทำงานอยู่ ให้ส่งการอัปเดต tool/progress ไปยังข้อความตัวอย่างเดียวกันที่ถูกแก้ไข (ค่าเริ่มต้น: `true`) ตั้งค่าเป็น `false` เพื่อคงข้อความ tool/progress แยกต่างหากไว้

`channels.slack.streaming.nativeTransport` ควบคุมการสตรีมข้อความแบบเนทีฟของ Slack เมื่อ `channels.slack.streaming.mode` เป็น `partial` (ค่าเริ่มต้น: `true`)

- ต้องมี reply thread จึงจะใช้การสตรีมข้อความแบบเนทีฟและแสดงสถานะเธรดผู้ช่วยของ Slack ได้ การเลือกเธรดยังคงเป็นไปตาม `replyToMode`
- รากของช่องและแชตกลุ่มยังสามารถใช้การแสดงตัวอย่างฉบับร่างแบบปกติได้เมื่อไม่สามารถใช้ native streaming
- DM ระดับบนสุดของ Slack จะอยู่นอกเธรดโดยค่าเริ่มต้น จึงไม่แสดงตัวอย่างแบบเธรด หากต้องการให้มีความคืบหน้าที่มองเห็นได้ในนั้น ให้ใช้การตอบกลับในเธรดหรือ `typingReaction`
- มีเดียและ payload ที่ไม่ใช่ข้อความจะ fallback ไปใช้การส่งแบบปกติ
- ข้อความสุดท้ายแบบมีเดีย/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่โดยไม่ flush ฉบับร่างชั่วคราว ส่วนข้อความสุดท้ายแบบข้อความ/บล็อกที่เข้าเงื่อนไขจะ flush เฉพาะเมื่อสามารถแก้ไขตัวอย่าง ณ ตำแหน่งเดิมได้
- หากการสตรีมล้มเหลวระหว่างการตอบกลับ OpenClaw จะ fallback ไปใช้การส่งแบบปกติสำหรับ payload ที่เหลือ
- ช่อง Slack Connect ที่ปฏิเสธสตรีมก่อนที่ SDK จะ flush บัฟเฟอร์ภายใน จะ fallback ไปใช้การตอบกลับ Slack แบบปกติ เพื่อไม่ให้ข้อความตอบสั้น ๆ ถูกทิ้งเงียบ ๆ หรือถูกรายงานว่าส่งแล้วก่อนที่ Slack จะรับรอง

ใช้การแสดงตัวอย่างฉบับร่างแทนการสตรีมข้อความแบบเนทีฟของ Slack:

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
- ค่า boolean ของ `channels.slack.streaming` จะถูกย้ายโดยอัตโนมัติไปยัง `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport`
- `channels.slack.nativeStreaming` แบบเดิมจะถูกย้ายโดยอัตโนมัติไปยัง `channels.slack.streaming.nativeTransport`

## fallback ของ typing reaction

`typingReaction` จะเพิ่มปฏิกิริยาชั่วคราวให้กับข้อความ Slack ขาเข้าระหว่างที่ OpenClaw กำลังประมวลผลการตอบกลับ จากนั้นจะลบออกเมื่อการรันเสร็จสิ้น สิ่งนี้มีประโยชน์มากที่สุดนอกการตอบกลับในเธรด ซึ่งจะใช้ตัวบ่งชี้สถานะ "is typing..." เป็นค่าเริ่มต้น

ลำดับการ resolve:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack คาดหวัง shortcodes (ตัวอย่างเช่น `"hourglass_flowing_sand"`)
- ปฏิกิริยานี้เป็นแบบ best-effort และจะพยายามล้างออกโดยอัตโนมัติหลังจากเส้นทางการตอบกลับหรือความล้มเหลวเสร็จสิ้น

## มีเดีย การแบ่งชังก์ และการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบขาเข้า">
    ไฟล์แนบจาก Slack จะถูกดาวน์โหลดจาก URL ส่วนตัวที่โฮสต์โดย Slack (ผ่านโฟลว์คำขอที่ยืนยันตัวตนด้วยโทเค็น) และเขียนลง media store เมื่อดึงข้อมูลสำเร็จและอยู่ภายในขีดจำกัดขนาด

    ขีดจำกัดขนาดขาเข้าของรันไทม์มีค่าเริ่มต้นเป็น `20MB` เว้นแต่จะ override ด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="ข้อความและไฟล์ขาออก">
    - ชังก์ข้อความใช้ `channels.slack.textChunkLimit` (ค่าเริ่มต้น 4000)
    - `channels.slack.chunkMode="newline"` เปิดใช้การแยกแบบย่อหน้าก่อน
    - การส่งไฟล์ใช้ API อัปโหลดของ Slack และสามารถรวมการตอบกลับในเธรด (`thread_ts`) ได้
    - ขีดจำกัดมีเดียขาออกเป็นไปตาม `channels.slack.mediaMaxMb` เมื่อมีการกำหนดค่า มิฉะนั้นการส่งผ่านช่องจะใช้ค่าเริ่มต้นตามชนิด MIME จาก media pipeline
  </Accordion>

  <Accordion title="เป้าหมายการส่ง">
    เป้าหมายแบบระบุชัดเจนที่แนะนำ:

    - `user:<id>` สำหรับ DM
    - `channel:<id>` สำหรับช่อง

    DM ของ Slack จะถูกเปิดผ่าน API conversation ของ Slack เมื่อส่งไปยังเป้าหมายผู้ใช้

  </Accordion>
</AccordionGroup>

## คำสั่งและพฤติกรรมของ slash

Slash commands ปรากฏใน Slack ได้ทั้งแบบคำสั่งเดียวที่ตั้งค่าไว้หรือหลายคำสั่งแบบเนทีฟ กำหนดค่า `channels.slack.slashCommand` เพื่อเปลี่ยนค่าเริ่มต้นของคำสั่ง:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Native commands ต้องใช้ [การตั้งค่า manifest เพิ่มเติม](#additional-manifest-settings) ในแอป Slack ของคุณ และเปิดใช้งานด้วย `channels.slack.commands.native: true` หรือ `commands.native: true` ในคอนฟิกส่วนกลางแทน

- โหมดอัตโนมัติของ native command เป็น **ปิด** สำหรับ Slack ดังนั้น `commands.native: "auto"` จะไม่เปิด native commands ของ Slack

```txt
/help
```

เมนูอาร์กิวเมนต์ของ native ใช้กลยุทธ์การเรนเดอร์แบบปรับตัวที่จะแสดง modal ยืนยันก่อนส่งค่าตัวเลือกที่เลือก:

- สูงสุด 5 ตัวเลือก: บล็อกปุ่ม
- 6-100 ตัวเลือก: เมนูเลือกแบบคงที่
- มากกว่า 100 ตัวเลือก: การเลือกภายนอกพร้อมการกรองตัวเลือกแบบ async เมื่อมีตัวจัดการตัวเลือก interactivity
- เกินขีดจำกัดของ Slack: ค่าตัวเลือกที่เข้ารหัสจะ fallback ไปเป็นปุ่ม

```txt
/think
```

Slash sessions ใช้คีย์แยกเฉพาะ เช่น `agent:<agentId>:slack:slash:<userId>` และยังคงกำหนดเส้นทางการรันคำสั่งไปยังเซสชันการสนทนาเป้าหมายโดยใช้ `CommandTargetSessionKey`

## การตอบกลับแบบโต้ตอบ

Slack สามารถเรนเดอร์ตัวควบคุมการตอบกลับแบบโต้ตอบที่สร้างโดยเอเจนต์ได้ แต่ความสามารถนี้ปิดไว้เป็นค่าเริ่มต้น

เปิดใช้แบบส่วนกลาง:

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

หรือเปิดใช้เฉพาะบัญชี Slack เดียว:

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

เมื่อเปิดใช้ เอเจนต์สามารถส่ง directive การตอบกลับเฉพาะของ Slack ได้:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

directive เหล่านี้จะถูกคอมไพล์เป็น Slack Block Kit และกำหนดเส้นทางการคลิกหรือการเลือกกลับผ่านเส้นทาง event interaction ของ Slack ที่มีอยู่แล้ว

หมายเหตุ:

- นี่คือ UI เฉพาะของ Slack ช่องอื่นจะไม่แปล directive ของ Slack Block Kit ไปเป็นระบบปุ่มของตนเอง
- ค่า callback แบบโต้ตอบเป็นโทเค็นแบบทึบที่ OpenClaw สร้างขึ้น ไม่ใช่ค่าดิบที่เอเจนต์เขียนขึ้นเอง
- หากบล็อกแบบโต้ตอบที่สร้างขึ้นเกินขีดจำกัดของ Slack Block Kit, OpenClaw จะ fallback ไปใช้ข้อความตอบกลับเดิมแทนการส่ง payload blocks ที่ไม่ถูกต้อง

## การอนุมัติ exec ใน Slack

Slack สามารถทำหน้าที่เป็นไคลเอนต์อนุมัติแบบเนทีฟด้วยปุ่มแบบโต้ตอบและ interactions แทนการ fallback ไปยัง Web UI หรือเทอร์มินัล

- การอนุมัติ exec ใช้ `channels.slack.execApprovals.*` สำหรับการกำหนดเส้นทาง DM/ช่องแบบเนทีฟ
- การอนุมัติ Plugin ยังสามารถ resolve ผ่านพื้นผิวปุ่มแบบเนทีฟของ Slack เดียวกันได้ เมื่อคำขอมาถึงใน Slack อยู่แล้วและชนิด approval id เป็น `plugin:`
- การยืนยันสิทธิ์ของผู้อนุมัติยังคงถูกบังคับใช้: เฉพาะผู้ใช้ที่ระบุว่าเป็น approvers เท่านั้นที่สามารถอนุมัติหรือปฏิเสธคำขอผ่าน Slack ได้

สิ่งนี้ใช้พื้นผิวปุ่มอนุมัติแบบใช้ร่วมกันเดียวกับช่องอื่น ๆ เมื่อเปิดใช้ `interactivity` ในการตั้งค่าแอป Slack ของคุณ พรอมต์การอนุมัติจะแสดงเป็นปุ่ม Block Kit โดยตรงในการสนทนา
เมื่อมีปุ่มเหล่านั้นอยู่ ปุ่มเหล่านี้จะเป็น UX หลักสำหรับการอนุมัติ; OpenClaw
ควรรวมคำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของ tool ระบุว่า
ไม่สามารถใช้การอนุมัติผ่านแชตได้ หรือการอนุมัติแบบแมนนวลเป็นทางเลือกเดียว

เส้นทางคอนฟิก:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; fallback ไปยัง `commands.ownerAllowFrom` เมื่อเป็นไปได้)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack จะเปิดใช้การอนุมัติ exec แบบเนทีฟอัตโนมัติเมื่อ `enabled` ไม่ได้ตั้งค่า หรือเป็น `"auto"` และสามารถ resolve approver ได้อย่างน้อยหนึ่งราย ตั้งค่า `enabled: false` เพื่อปิด Slack ในฐานะไคลเอนต์อนุมัติแบบเนทีฟอย่างชัดเจน
ตั้งค่า `enabled: true` เพื่อบังคับเปิดการอนุมัติแบบเนทีฟเมื่อ resolve approver ได้

พฤติกรรมเริ่มต้นเมื่อไม่มีคอนฟิกการอนุมัติ exec ของ Slack แบบชัดเจน:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

จำเป็นต้องมีคอนฟิกแบบเนทีฟของ Slack อย่างชัดเจนก็ต่อเมื่อคุณต้องการ override approvers, เพิ่มฟิลเตอร์ หรือ
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

การส่งต่อ `approvals.exec` แบบใช้ร่วมกันเป็นคนละส่วน ใช้เฉพาะเมื่อพรอมต์การอนุมัติ exec ต้องถูกกำหนดเส้นทางไปยัง
แชตอื่นหรือเป้าหมาย out-of-band ที่ระบุชัดเจนด้วย การส่งต่อ `approvals.plugin` แบบใช้ร่วมกันก็
แยกต่างหากเช่นกัน; ปุ่มแบบเนทีฟของ Slack ยังสามารถ resolve การอนุมัติ Plugin ได้เมื่อคำขอเหล่านั้นมาถึง
ใน Slack อยู่แล้ว

`/approve` ในแชตเดียวกันก็ใช้งานได้ในช่องและ DM ของ Slack ที่รองรับคำสั่งอยู่แล้วเช่นกัน ดู [Exec approvals](/th/tools/exec-approvals) สำหรับโมเดลการส่งต่อการอนุมัติทั้งหมด

## เหตุการณ์และพฤติกรรมการปฏิบัติงาน

- การแก้ไข/ลบข้อความ/การกระจายเธรดจะถูกแมปเป็น system events
- เหตุการณ์เพิ่ม/ลบ reaction จะถูกแมปเป็น system events
- เหตุการณ์สมาชิกเข้าร่วม/ออก ช่องถูกสร้าง/เปลี่ยนชื่อ และการเพิ่ม/ลบ pin จะถูกแมปเป็น system events
- `channel_id_changed` สามารถย้ายคีย์คอนฟิกของช่องได้เมื่อเปิด `configWrites`
- เมทาดาทาหัวข้อ/วัตถุประสงค์ของช่องถือเป็นบริบทที่ไม่น่าเชื่อถือและสามารถถูก inject เข้าสู่บริบทการกำหนดเส้นทางได้
- ตัวเริ่มเธรดและการ seed บริบทประวัติเธรดเริ่มต้นจะถูกกรองตาม allowlist ผู้ส่งที่กำหนดไว้เมื่อเกี่ยวข้อง
- block actions และ modal interactions จะส่ง system events แบบมีโครงสร้าง `Slack interaction: ...` พร้อมฟิลด์ payload ที่ครบถ้วน:
  - block actions: ค่าที่เลือก ป้ายกำกับ ค่า picker และเมทาดาทา `workflow_*`
  - เหตุการณ์ modal `view_submission` และ `view_closed` พร้อมเมทาดาทาช่องที่ถูกกำหนดเส้นทางและอินพุตของฟอร์ม

## ตัวชี้ไปยังเอกสารอ้างอิงการตั้งค่า

เอกสารอ้างอิงหลัก:

- [Configuration reference - Slack](/th/gateway/configuration-reference#slack)

  ฟิลด์ Slack ที่สำคัญ:
  - mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (แบบเดิม: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - สวิตช์ความเข้ากันได้: `dangerouslyAllowNameMatching` (ใช้ยามฉุกเฉิน; ปิดไว้เว้นแต่จำเป็น)
  - การเข้าถึงช่อง: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - เธรด/ประวัติ: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - การส่ง: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - การปฏิบัติงาน/ความสามารถ: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในช่อง">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - allowlist ของช่อง (`channels.slack.channels`)
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
    - `channels.slack.dmPolicy` (หรือแบบเดิม `channels.slack.dm.policy`)
    - การอนุมัติ pairing / รายการใน allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode ไม่เชื่อมต่อ">
    ตรวจสอบ bot token + app token และการเปิดใช้ Socket Mode ในการตั้งค่าแอป Slack

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` แสดงว่าบัญชี Slack นั้น
    ถูกกำหนดค่าไว้ แต่รันไทม์ปัจจุบันไม่สามารถ resolve ค่าที่รองรับด้วย SecretRef
    ได้

  </Accordion>

  <Accordion title="HTTP mode ไม่ได้รับ events">
    ตรวจสอบ:

    - signing secret
    - webhook path
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - `webhookPath` ที่ไม่ซ้ำกันสำหรับแต่ละบัญชี HTTP

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏในสแนปช็อต
    ของบัญชี แสดงว่าบัญชี HTTP ถูกกำหนดค่าไว้แล้ว แต่รันไทม์ปัจจุบันไม่สามารถ
    resolve signing secret ที่รองรับด้วย SecretRef ได้

    Request URL webhooks ที่ลงทะเบียนไว้จะถูกส่งผ่านรีจิสทรีตัวจัดการแบบใช้ร่วมกันเดียวกับที่ใช้ในการตั้งค่า Slack monitor ดังนั้น events ของ Slack ในโหมด HTTP จะยังคงถูกกำหนดเส้นทางผ่าน path ที่ลงทะเบียนไว้ แทนที่จะ 404 หลังจากลงทะเบียนเส้นทางสำเร็จ

  </Accordion>

  <Accordion title="การดาวน์โหลดไฟล์ด้วย bot token แบบกำหนดเอง">
    ตัวช่วย `downloadFile` จะ resolve bot token จากคอนฟิกรันไทม์เมื่อผู้เรียกส่ง `cfg` มาโดยไม่มี `token` แบบระบุชัดเจนหรือไคลเอนต์ที่สร้างไว้ล่วงหน้า ทำให้การดาวน์โหลดไฟล์แบบ cfg-only ยังคงทำงานได้นอกเส้นทางรันไทม์ของ action
  </Accordion>

  <Accordion title="Native/slash commands ไม่ทำงาน">
    ตรวจสอบว่าคุณตั้งใจใช้แบบใด:

    - โหมด native command (`channels.slack.commands.native: true`) พร้อม slash commands ที่ลงทะเบียนใน Slack ให้ตรงกัน
    - หรือโหมด single slash command (`channels.slack.slashCommand.enabled: true`)

    ตรวจสอบ `commands.useAccessGroups` และ allowlist ของช่อง/ผู้ใช้ด้วย

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [Pairing](/th/channels/pairing)
- [Groups](/th/channels/groups)
- [Security](/th/gateway/security)
- [Channel routing](/th/channels/channel-routing)
- [Troubleshooting](/th/channels/troubleshooting)
- [Configuration](/th/gateway/configuration)
- [Slash commands](/th/tools/slash-commands)
