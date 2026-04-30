---
read_when:
    - การตั้งค่า Slack หรือการดีบักโหมดซ็อกเก็ต/HTTP ของ Slack
summary: การตั้งค่า Slack และลักษณะการทำงานขณะรันไทม์ (โหมด Socket + URL สำหรับคำขอ HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-30T16:27:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55beddb43a6b91c6853dcf053eab713322de4da5beced7c107d73e1c066fded6
    source_path: channels/slack.md
    workflow: 16
---

พร้อมใช้งานจริงสำหรับ DM และช่องทางผ่านการผสานรวมแอป Slack โหมดเริ่มต้นคือ Socket Mode และยังรองรับ HTTP Request URLs ด้วย

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    Slack DM ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและคู่มือการซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าแบบรวดเร็ว

<Tabs>
  <Tab title="Socket Mode (ค่าเริ่มต้น)">
    <Steps>
      <Step title="สร้างแอป Slack ใหม่">
        ในการตั้งค่าแอป Slack ให้กดปุ่ม **[Create New App](https://api.slack.com/apps/new)**:

        - เลือก **from a manifest** และเลือกเวิร์กสเปซสำหรับแอปของคุณ
        - วาง [ตัวอย่าง manifest](#manifest-and-scope-checklist) ด้านล่าง แล้วดำเนินการสร้างต่อ
        - สร้าง **App-Level Token** (`xapp-...`) พร้อม `connections:write`
        - ติดตั้งแอปและคัดลอก **Bot Token** (`xoxb-...`) ที่แสดงอยู่

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

        ทางเลือกสำรองด้วย env (เฉพาะบัญชีเริ่มต้นเท่านั้น):

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
        ในการตั้งค่าแอป Slack ให้กดปุ่ม **[Create New App](https://api.slack.com/apps/new)**:

        - เลือก **from a manifest** และเลือกเวิร์กสเปซสำหรับแอปของคุณ
        - วาง [ตัวอย่าง manifest](#manifest-and-scope-checklist) และอัปเดต URL ก่อนสร้าง
        - บันทึก **Signing Secret** สำหรับการตรวจสอบคำขอ
        - ติดตั้งแอปและคัดลอก **Bot Token** (`xoxb-...`) ที่แสดงอยู่

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
        ใช้เส้นทาง Webhook ที่ไม่ซ้ำกันสำหรับ HTTP หลายบัญชี

        กำหนด `webhookPath` ที่แตกต่างกันให้แต่ละบัญชี (ค่าเริ่มต้น `/slack/events`) เพื่อให้การลงทะเบียนไม่ชนกัน
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

## การปรับแต่งทรานสปอร์ต Socket Mode

OpenClaw ตั้งค่า pong timeout ของไคลเอนต์ Slack SDK เป็น 15 วินาทีโดยค่าเริ่มต้นสำหรับ Socket Mode แทนที่การตั้งค่าทรานสปอร์ตเฉพาะเมื่อคุณต้องปรับแต่งให้เหมาะกับเวิร์กสเปซหรือโฮสต์เฉพาะ:

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

ใช้สิ่งนี้เฉพาะกับเวิร์กสเปซ Socket Mode ที่บันทึก timeout ของ Slack websocket pong/server-ping หรือทำงานบนโฮสต์ที่ทราบว่ามีปัญหา event-loop starvation `clientPingTimeout` คือเวลารอ pong หลังจาก SDK ส่ง client ping ส่วน `serverPingTimeout` คือเวลารอ ping จากเซิร์ฟเวอร์ Slack ข้อความและอีเวนต์ของแอปยังคงเป็นสถานะของแอปพลิเคชัน ไม่ใช่สัญญาณความมีชีวิตของทรานสปอร์ต

## เช็กลิสต์ manifest และ scope

manifest พื้นฐานของแอป Slack เหมือนกันสำหรับ Socket Mode และ HTTP Request URLs แตกต่างกันเฉพาะบล็อก `settings` (และ `url` ของคำสั่ง slash)

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

สำหรับ **โหมด HTTP Request URLs** ให้แทนที่ `settings` ด้วยตัวแปร HTTP และเพิ่ม `url` ให้กับคำสั่ง slash แต่ละรายการ ต้องมี URL สาธารณะ:

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
        /* same as Socket Mode */
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

<AccordionGroup>
  <Accordion title="คำสั่ง slash แบบเนทีฟเพิ่มเติม">

    สามารถใช้ [คำสั่ง slash แบบเนทีฟ](#commands-and-slash-behavior) หลายรายการแทนคำสั่งที่กำหนดค่าไว้รายการเดียวได้ โดยมีรายละเอียดปลีกย่อยดังนี้:

    - ใช้ `/agentstatus` แทน `/status` เพราะคำสั่ง `/status` ถูกสงวนไว้
    - ไม่สามารถเปิดใช้คำสั่ง slash พร้อมกันได้มากกว่า 25 รายการ

    แทนที่ส่วน `features.slash_commands` ที่มีอยู่ด้วยชุดย่อยของ [คำสั่งที่มีให้ใช้งาน](/th/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (ค่าเริ่มต้น)">

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
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">
        ใช้รายการ `slash_commands` เดียวกับ Socket Mode ด้านบน และเพิ่ม `"url": "https://gateway-host.example.com/slack/events"` ให้กับทุกรายการ ตัวอย่าง:

```json
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
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="scope การระบุผู้เขียนเพิ่มเติม (การดำเนินการเขียน)">
    เพิ่ม scope บอต `chat:write.customize` หากคุณต้องการให้ข้อความขาออกใช้อัตลักษณ์ของเอเจนต์ที่ใช้งานอยู่ (ชื่อผู้ใช้และไอคอนแบบกำหนดเอง) แทนอัตลักษณ์แอป Slack เริ่มต้น

    หากคุณใช้ไอคอนอีโมจิ Slack คาดหวังไวยากรณ์แบบ `:emoji_name:`

  </Accordion>
  <Accordion title="scope โทเค็นผู้ใช้เพิ่มเติม (การดำเนินการอ่าน)">
    หากคุณกำหนดค่า `channels.slack.userToken` scope สำหรับการอ่านโดยทั่วไปคือ:

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
- โหมด HTTP ต้องมี `botToken` + `signingSecret`
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับสตริงข้อความธรรมดา
  หรือออบเจ็กต์ SecretRef ได้
- โทเค็นใน config จะแทนที่ env fallback
- env fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ใช้กับบัญชี default เท่านั้น
- `userToken` (`xoxp-...`) ใช้ได้เฉพาะใน config (ไม่มี env fallback) และค่าเริ่มต้นเป็นพฤติกรรมแบบอ่านอย่างเดียว (`userTokenReadOnly: true`)

พฤติกรรมสแนปช็อตสถานะ:

- การตรวจสอบบัญชี Slack ติดตามฟิลด์ `*Source` และ `*Status`
  ต่อข้อมูลรับรอง (`botToken`, `appToken`, `signingSecret`, `userToken`)
- สถานะคือ `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าผ่าน SecretRef
  หรือแหล่ง secret แบบไม่ฝังในบรรทัดแหล่งอื่น แต่ command/runtime path ปัจจุบัน
  ไม่สามารถ resolve ค่าจริงได้
- ในโหมด HTTP จะรวม `signingSecretStatus`; ใน Socket Mode
  คู่ที่จำเป็นคือ `botTokenStatus` + `appTokenStatus`

<Tip>
สำหรับการดำเนินการ/การอ่านไดเรกทอรี สามารถเลือกใช้ user token ก่อนเมื่อกำหนดค่าไว้ สำหรับการเขียน จะยังเลือกใช้ bot token ก่อน; การเขียนด้วย user-token จะอนุญาตเฉพาะเมื่อ `userTokenReadOnly: false` และไม่มี bot token ให้ใช้
</Tip>

## การดำเนินการและเกต

การดำเนินการของ Slack ควบคุมโดย `channels.slack.actions.*`

กลุ่มการดำเนินการที่มีในเครื่องมือ Slack ปัจจุบัน:

| กลุ่ม      | ค่าเริ่มต้น |
| ---------- | ------- |
| messages   | เปิดใช้ |
| reactions  | เปิดใช้ |
| pins       | เปิดใช้ |
| memberInfo | เปิดใช้ |
| emojiList  | เปิดใช้ |

การดำเนินการข้อความ Slack ปัจจุบันประกอบด้วย `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list` `download-file` รับ ID ไฟล์ Slack ที่แสดงใน placeholder ไฟล์ขาเข้า และส่งคืนตัวอย่างรูปภาพสำหรับรูปภาพ หรือเมทาดาทาไฟล์ในเครื่องสำหรับไฟล์ประเภทอื่น

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM `channels.slack.allowFrom` คือ allowlist DM แบบ canonical

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.slack.allowFrom` รวม `"*"`)
    - `disabled`

    แฟล็ก DM:

    - `dm.enabled` (ค่าเริ่มต้น true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (DM แบบกลุ่มมีค่าเริ่มต้น false)
    - `dm.groupChannels` (allowlist MPIM ทางเลือก)

    ลำดับความสำคัญของหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่มีชื่อจะสืบทอด `channels.slack.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตัวเอง
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.slack.accounts.default.allowFrom`

    `channels.slack.dm.policy` และ `channels.slack.dm.allowFrom` แบบ legacy ยังอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    การจับคู่ใน DM ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="นโยบายช่อง">
    `channels.slack.groupPolicy` ควบคุมการจัดการช่อง:

    - `open`
    - `allowlist`
    - `disabled`

    allowlist ของช่องอยู่ใต้ `channels.slack.channels` และ **ต้องใช้ ID ช่อง Slack ที่เสถียร** (เช่น `C12345678`) เป็นคีย์ config

    หมายเหตุ runtime: หากไม่มี `channels.slack` เลย (การตั้งค่าแบบ env-only) runtime จะ fallback ไปที่ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` แล้วก็ตาม)

    การ resolve ชื่อ/ID:

    - รายการ allowlist ของช่องและรายการ allowlist ของ DM จะถูก resolve ตอนเริ่มต้นเมื่อการเข้าถึงด้วยโทเค็นอนุญาต
    - รายการชื่อช่องที่ resolve ไม่ได้จะถูกเก็บไว้ตามที่กำหนดค่า แต่ค่าเริ่มต้นจะถูกละเว้นสำหรับการกำหนดเส้นทาง
    - การให้สิทธิ์ขาเข้าและการกำหนดเส้นทางช่องใช้ ID ก่อนโดยค่าเริ่มต้น; การจับคู่ username/slug โดยตรงต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    คีย์ตามชื่อ (`#channel-name` หรือ `channel-name`) จะ **ไม่** ตรงกันภายใต้ `groupPolicy: "allowlist"` การค้นหาช่องใช้ ID ก่อนโดยค่าเริ่มต้น ดังนั้นคีย์ตามชื่อจะไม่มีทางกำหนดเส้นทางสำเร็จ และข้อความทั้งหมดในช่องนั้นจะถูกบล็อกอย่างเงียบๆ ซึ่งต่างจาก `groupPolicy: "open"` ที่ไม่จำเป็นต้องมีคีย์ช่องสำหรับการกำหนดเส้นทาง และคีย์ตามชื่อจะดูเหมือนใช้งานได้

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

    ไม่ถูกต้อง (ถูกบล็อกอย่างเงียบๆ ภายใต้ `groupPolicy: "allowlist"`):

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

  <Tab title="การ mention และผู้ใช้ช่อง">
    ข้อความในช่องต้องผ่านเกตการ mention โดยค่าเริ่มต้น

    แหล่งที่มาของ mention:

    - การ mention แอปอย่างชัดเจน (`<@botId>`)
    - รูปแบบ regex สำหรับ mention (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรม thread ที่ตอบกลับ bot โดยนัย (ปิดใช้เมื่อ `thread.requireExplicitMention` เป็น `true`)

    การควบคุมต่อช่อง (`channels.slack.channels.<id>`; ชื่อใช้ได้เฉพาะผ่านการ resolve ตอนเริ่มต้นหรือ `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ `toolsBySender`: `id:`, `e164:`, `username:`, `name:` หรือ wildcard `"*"`
      (คีย์ legacy ที่ไม่มี prefix ยังแมปไปยัง `id:` เท่านั้น)

    `allowBots` มีความระมัดระวังสำหรับช่องและช่องส่วนตัว: ข้อความห้องที่เขียนโดย bot จะยอมรับเฉพาะเมื่อ bot ผู้ส่งถูกระบุอย่างชัดเจนใน allowlist `users` ของห้องนั้น หรือเมื่อมี ID เจ้าของ Slack ที่ชัดเจนอย่างน้อยหนึ่งรายการจาก `channels.slack.allowFrom` เป็นสมาชิกห้องอยู่ในขณะนั้น Wildcard และรายการเจ้าของที่เป็น display-name ไม่ถือว่าตอบสนองเงื่อนไขการมีอยู่ของเจ้าของ การมีอยู่ของเจ้าของใช้ Slack `conversations.members`; ตรวจสอบให้แน่ใจว่าแอปมี read scope ที่ตรงกับประเภทห้อง (`channels:read` สำหรับช่องสาธารณะ, `groups:read` สำหรับช่องส่วนตัว) หากการค้นหาสมาชิกล้มเหลว OpenClaw จะทิ้งข้อความห้องที่เขียนโดย bot

  </Tab>
</Tabs>

## Threading, session และแท็กตอบกลับ

- DM กำหนดเส้นทางเป็น `direct`; ช่องเป็น `channel`; MPIM เป็น `group`
- ด้วยค่าเริ่มต้น `session.dmScope=main` DM ของ Slack จะรวมเป็น session หลักของ agent
- Session ของช่อง: `agent:<agentId>:slack:channel:<channelId>`
- การตอบกลับใน thread สามารถสร้าง suffix session ของ thread (`:thread:<threadTs>`) เมื่อใช้ได้
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความ thread ที่มีอยู่ซึ่งจะถูกดึงเมื่อ session thread ใหม่เริ่มต้น (ค่าเริ่มต้น `20`; ตั้งเป็น `0` เพื่อปิดใช้)
- `channels.slack.thread.requireExplicitMention` (ค่าเริ่มต้น `false`): เมื่อเป็น `true` จะระงับการ mention ใน thread โดยนัย เพื่อให้ bot ตอบกลับเฉพาะการ mention `@bot` อย่างชัดเจนภายใน thread แม้ bot จะเคยเข้าร่วมใน thread แล้วก็ตาม หากไม่มีค่านี้ การตอบกลับใน thread ที่ bot เข้าร่วมแล้วจะข้ามเกต `requireMention`

การควบคุม reply threading:

- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: ต่อ `direct|group|channel`
- fallback legacy สำหรับแชทโดยตรง: `channels.slack.dm.replyToMode`

รองรับแท็กตอบกลับแบบ manual:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` ปิดใช้ reply threading **ทั้งหมด** ใน Slack รวมถึงแท็ก `[[reply_to_*]]` ที่ชัดเจน ซึ่งต่างจาก Telegram ที่ยังเคารพแท็กที่ชัดเจนในโหมด `"off"` thread ของ Slack ซ่อนข้อความจากช่อง ขณะที่การตอบกลับของ Telegram ยังมองเห็นแบบ inline
</Note>

## รีแอ็กชัน Ack

`ackReaction` ส่ง emoji รับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

ลำดับการ resolve:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- emoji fallback ของตัวตน agent (`agents.list[].identity.emoji`, ไม่เช่นนั้น "👀")

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"eyes"`)
- ใช้ `""` เพื่อปิดใช้รีแอ็กชันสำหรับบัญชี Slack หรือทั้งระบบ

## การสตรีมข้อความ

`channels.slack.streaming` ควบคุมพฤติกรรม live preview:

- `off`: ปิดใช้การสตรีม live preview
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความ preview ด้วย output บางส่วนล่าสุด
- `block`: ต่อท้ายการอัปเดต preview แบบแบ่ง chunk
- `progress`: แสดงข้อความสถานะความคืบหน้าขณะสร้าง แล้วส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อ draft preview ทำงานอยู่ ให้กำหนดเส้นทางการอัปเดต tool/progress เข้าไปในข้อความ preview ที่แก้ไขเดียวกัน (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อแยกข้อความ tool/progress ต่างหาก

`channels.slack.streaming.nativeTransport` ควบคุมการสตรีมข้อความ native ของ Slack เมื่อ `channels.slack.streaming.mode` เป็น `partial` (ค่าเริ่มต้น: `true`)

- ต้องมี reply thread เพื่อให้การสตรีมข้อความ native และสถานะ thread ของ Slack assistant ปรากฏได้ การเลือก thread ยังคงเป็นไปตาม `replyToMode`
- รากของช่องและ group-chat ยังใช้ draft preview ปกติได้เมื่อ native streaming ใช้ไม่ได้
- DM ระดับบนสุดของ Slack จะอยู่นอก thread โดยค่าเริ่มต้น ดังนั้นจึงไม่แสดง preview แบบ thread; ใช้การตอบกลับใน thread หรือ `typingReaction` หากต้องการความคืบหน้าที่มองเห็นได้ในจุดนั้น
- payload สื่อและ payload ที่ไม่ใช่ข้อความ fallback ไปยังการส่งปกติ
- final ของสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไข preview ที่ค้างอยู่; final ของข้อความ/block ที่เข้าเกณฑ์จะ flush เฉพาะเมื่อสามารถแก้ไข preview ในตำแหน่งเดิมได้
- หากการสตรีมล้มเหลวกลางการตอบกลับ OpenClaw จะ fallback ไปยังการส่งปกติสำหรับ payload ที่เหลือ

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

- `channels.slack.streamMode` (`replace | status_final | append`) จะถูกย้ายอัตโนมัติไปยัง `channels.slack.streaming.mode`
- boolean `channels.slack.streaming` จะถูกย้ายอัตโนมัติไปยัง `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport`
- `channels.slack.nativeStreaming` แบบ legacy จะถูกย้ายอัตโนมัติไปยัง `channels.slack.streaming.nativeTransport`

## Fallback รีแอ็กชันการพิมพ์

`typingReaction` เพิ่มรีแอ็กชันชั่วคราวไปยังข้อความ Slack ขาเข้า ขณะที่ OpenClaw กำลังประมวลผลการตอบกลับ แล้วลบออกเมื่อ run เสร็จ สิ่งนี้มีประโยชน์ที่สุดนอกการตอบกลับใน thread ซึ่งใช้ตัวบ่งชี้สถานะ "is typing..." เริ่มต้น

ลำดับการ resolve:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"hourglass_flowing_sand"`)
- รีแอ็กชันเป็นแบบ best-effort และจะพยายามล้างอัตโนมัติหลังการตอบกลับหรือเส้นทางความล้มเหลวเสร็จสิ้น

## สื่อ การแบ่ง chunk และการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบขาเข้า">
    ไฟล์แนบ Slack จะถูกดาวน์โหลดจาก URL ส่วนตัวที่โฮสต์โดย Slack (โฟลว์คำขอที่ยืนยันตัวตนด้วยโทเค็น) และเขียนลง media store เมื่อ fetch สำเร็จและขีดจำกัดขนาดอนุญาต Placeholder ไฟล์จะรวม `fileId` ของ Slack เพื่อให้ agent สามารถดึงไฟล์ต้นฉบับด้วย `download-file`

    การดาวน์โหลดใช้ timeout แบบ idle และ total ที่มีขอบเขต หากการดึงไฟล์ Slack ค้างหรือล้มเหลว OpenClaw จะยังประมวลผลข้อความต่อและ fallback ไปยัง placeholder ไฟล์

    ค่าเริ่มต้นของขีดจำกัดขนาดขาเข้าใน runtime คือ `20MB` เว้นแต่จะถูกแทนที่ด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="ข้อความและไฟล์ขาออก">
    - ชิ้นข้อความใช้ `channels.slack.textChunkLimit` (ค่าเริ่มต้น 4000)
    - `channels.slack.chunkMode="newline"` เปิดใช้การแบ่งโดยยึดย่อหน้าก่อน
    - การส่งไฟล์ใช้ API อัปโหลดของ Slack และสามารถรวมการตอบกลับในเธรด (`thread_ts`) ได้
    - ขีดจำกัดสื่อขาออกใช้ `channels.slack.mediaMaxMb` เมื่อกำหนดค่าไว้ มิฉะนั้นการส่งในช่องทางจะใช้ค่าเริ่มต้นตามชนิด MIME จาก pipeline สื่อ

  </Accordion>

  <Accordion title="เป้าหมายการส่ง">
    เป้าหมายแบบระบุชัดที่แนะนำ:

    - `user:<id>` สำหรับ DM
    - `channel:<id>` สำหรับช่องทาง

    Slack DM จะถูกเปิดผ่าน API การสนทนาของ Slack เมื่อส่งไปยังเป้าหมายผู้ใช้

  </Accordion>
</AccordionGroup>

## คำสั่งและพฤติกรรม slash

คำสั่ง slash จะแสดงใน Slack เป็นคำสั่งเดียวที่กำหนดค่าไว้ หรือเป็นคำสั่ง native หลายคำสั่ง กำหนดค่า `channels.slack.slashCommand` เพื่อเปลี่ยนค่าเริ่มต้นของคำสั่ง:

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

เมนูอาร์กิวเมนต์ native ใช้กลยุทธ์การแสดงผลแบบปรับตัว ซึ่งแสดง modal ยืนยันก่อนส่งค่าตัวเลือกที่เลือก:

- ไม่เกิน 5 ตัวเลือก: บล็อกปุ่ม
- 6-100 ตัวเลือก: เมนูเลือกแบบคงที่
- มากกว่า 100 ตัวเลือก: การเลือกภายนอกพร้อมการกรองตัวเลือกแบบ async เมื่อมี handler สำหรับตัวเลือก interactivity
- เกินขีดจำกัดของ Slack: ค่าตัวเลือกที่เข้ารหัสจะ fallback กลับไปใช้ปุ่ม

```txt
/think
```

เซสชัน slash ใช้คีย์แยกเฉพาะ เช่น `agent:<agentId>:slack:slash:<userId>` และยังคง route การทำงานของคำสั่งไปยังเซสชันการสนทนาเป้าหมายโดยใช้ `CommandTargetSessionKey`

## การตอบกลับแบบ interactive

Slack สามารถแสดงตัวควบคุมการตอบกลับแบบ interactive ที่ agent สร้างได้ แต่ฟีเจอร์นี้ถูกปิดไว้โดยค่าเริ่มต้น

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

เมื่อเปิดใช้แล้ว agent สามารถส่งคำสั่งการตอบกลับสำหรับ Slack เท่านั้น:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

คำสั่งเหล่านี้จะคอมไพล์เป็น Slack Block Kit และ route การคลิกหรือการเลือกกลับผ่านเส้นทางเหตุการณ์ interaction ของ Slack ที่มีอยู่

หมายเหตุ:

- นี่คือ UI เฉพาะ Slack ช่องทางอื่นจะไม่แปลคำสั่ง Slack Block Kit เป็นระบบปุ่มของตนเอง
- ค่าของ callback แบบ interactive เป็น token ทึบที่ OpenClaw สร้างขึ้น ไม่ใช่ค่าดิบที่ agent สร้าง
- หากบล็อก interactive ที่สร้างขึ้นจะเกินขีดจำกัดของ Slack Block Kit, OpenClaw จะ fallback กลับไปใช้ข้อความตอบกลับเดิมแทนการส่ง payload บล็อกที่ไม่ถูกต้อง

## การอนุมัติ exec ใน Slack

Slack สามารถทำหน้าที่เป็นไคลเอนต์การอนุมัติ native พร้อมปุ่มและ interaction แบบ interactive แทนการ fallback ไปยัง Web UI หรือ terminal

- การอนุมัติ exec ใช้ `channels.slack.execApprovals.*` สำหรับการ route แบบ native ไปยัง DM/ช่องทาง
- การอนุมัติ Plugin ยังสามารถ resolve ผ่านพื้นผิวปุ่ม Slack-native เดียวกันได้ เมื่อคำขอนั้นมาถึง Slack อยู่แล้วและชนิด id การอนุมัติคือ `plugin:`
- การอนุญาตผู้อนุมัติยังคงถูกบังคับใช้: เฉพาะผู้ใช้ที่ระบุว่าเป็นผู้อนุมัติเท่านั้นที่สามารถอนุมัติหรือปฏิเสธคำขอผ่าน Slack ได้

สิ่งนี้ใช้พื้นผิวปุ่มอนุมัติที่ใช้ร่วมกันแบบเดียวกับช่องทางอื่น เมื่อเปิดใช้ `interactivity` ในการตั้งค่าแอป Slack ของคุณ prompt การอนุมัติจะแสดงเป็นปุ่ม Block Kit โดยตรงในการสนทนา
เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก; OpenClaw
ควรรวมคำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่าการอนุมัติผ่านแชต
ไม่พร้อมใช้งาน หรือการอนุมัติแบบ manual เป็นเส้นทางเดียวเท่านั้น

เส้นทางการกำหนดค่า:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; fallback ไปยัง `commands.ownerAllowFrom` เมื่อทำได้)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack จะเปิดใช้การอนุมัติ exec native โดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และ resolve
ผู้อนุมัติได้อย่างน้อยหนึ่งคน ตั้งค่า `enabled: false` เพื่อปิดใช้ Slack เป็นไคลเอนต์การอนุมัติ native อย่างชัดเจน
ตั้งค่า `enabled: true` เพื่อบังคับเปิดการอนุมัติ native เมื่อ resolve ผู้อนุมัติได้

พฤติกรรมเริ่มต้นเมื่อไม่มีการกำหนดค่าการอนุมัติ exec ของ Slack อย่างชัดเจน:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

จำเป็นต้องใช้การกำหนดค่า Slack-native แบบชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ผู้อนุมัติ เพิ่มตัวกรอง หรือ
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

การ forwarding ของ `approvals.exec` ที่ใช้ร่วมกันเป็นคนละส่วนกัน ใช้เฉพาะเมื่อ prompt การอนุมัติ exec ต้อง
route ไปยังแชตอื่นหรือเป้าหมายนอกช่องทางที่ระบุชัดด้วย การ forwarding ของ `approvals.plugin` ที่ใช้ร่วมกันก็
เป็นคนละส่วนเช่นกัน; ปุ่ม Slack-native ยังสามารถ resolve การอนุมัติ Plugin ได้เมื่อคำขอเหล่านั้นมาถึง
Slack อยู่แล้ว

`/approve` ในแชตเดียวกันยังทำงานได้ในช่องทางและ DM ของ Slack ที่รองรับคำสั่งอยู่แล้ว ดู [การอนุมัติ Exec](/th/tools/exec-approvals) สำหรับโมเดลการ forwarding การอนุมัติแบบเต็ม

## เหตุการณ์และพฤติกรรมการทำงาน

- การแก้ไข/ลบข้อความจะถูก map เป็นเหตุการณ์ระบบ
- การ broadcast เธรด (การตอบกลับเธรด "Also send to channel") จะถูกประมวลผลเป็นข้อความผู้ใช้ตามปกติ
- เหตุการณ์เพิ่ม/ลบ reaction จะถูก map เป็นเหตุการณ์ระบบ
- เหตุการณ์สมาชิกเข้าร่วม/ออก, สร้าง/เปลี่ยนชื่อช่องทาง และเพิ่ม/ลบ pin จะถูก map เป็นเหตุการณ์ระบบ
- `channel_id_changed` สามารถ migrate คีย์การกำหนดค่าช่องทางได้เมื่อเปิดใช้ `configWrites`
- metadata หัวข้อ/วัตถุประสงค์ของช่องทางถือเป็นบริบทที่ไม่น่าเชื่อถือและสามารถถูก inject เข้าไปในบริบทการ route ได้
- ตัวเริ่มเธรดและการ seed บริบทประวัติเธรดเริ่มต้นจะถูกกรองตาม allowlist ผู้ส่งที่กำหนดค่าไว้เมื่อใช้ได้
- การกระทำบล็อกและ interaction ของ modal จะ emit เหตุการณ์ระบบ `Slack interaction: ...` แบบมีโครงสร้างพร้อมฟิลด์ payload ที่ละเอียด:
  - การกระทำบล็อก: ค่าที่เลือก, ป้ายกำกับ, ค่าตัวเลือก และ metadata `workflow_*`
  - เหตุการณ์ modal `view_submission` และ `view_closed` พร้อม metadata ช่องทางที่ route แล้วและอินพุตฟอร์ม

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Slack](/th/gateway/config-channels#slack)

<Accordion title="ฟิลด์ Slack ที่ให้สัญญาณสูง">

- โหมด/การยืนยันตัวตน: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- toggle ความเข้ากันได้: `dangerouslyAllowNameMatching` (break-glass; ปิดไว้เว้นแต่จำเป็น)
- การเข้าถึงช่องทาง: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/ประวัติ: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่ง: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- ops/ฟีเจอร์: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในช่องทาง">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - allowlist ช่องทาง (`channels.slack.channels`) — **คีย์ต้องเป็น channel ID** (`C12345678`) ไม่ใช่ชื่อ (`#channel-name`) คีย์ที่อิงชื่อล้มเหลวแบบเงียบภายใต้ `groupPolicy: "allowlist"` เพราะการ route ช่องทางยึด ID เป็นหลักโดยค่าเริ่มต้น หากต้องการหา ID: คลิกขวาที่ช่องทางใน Slack → **Copy link** — ค่า `C...` ที่ท้าย URL คือ channel ID
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
    - การอนุมัติ pairing / รายการ allowlist
    - เหตุการณ์ DM ของ Slack Assistant: log แบบ verbose ที่กล่าวถึง `drop message_changed`
      มักหมายความว่า Slack ส่งเหตุการณ์เธรด Assistant ที่ถูกแก้ไขโดยไม่มี
      ผู้ส่งที่เป็นมนุษย์ที่กู้คืนได้ใน metadata ข้อความ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode ไม่เชื่อมต่อ">
    ตรวจสอบ bot + app token และการเปิดใช้ Socket Mode ในการตั้งค่าแอป Slack

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` แสดงว่าบัญชี Slack ถูก
    กำหนดค่าแล้ว แต่ runtime ปัจจุบันไม่สามารถ resolve ค่า
    ที่อิง SecretRef ได้

  </Accordion>

  <Accordion title="HTTP mode ไม่ได้รับเหตุการณ์">
    ตรวจสอบ:

    - signing secret
    - webhook path
    - URL คำขอของ Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` ที่ไม่ซ้ำกันต่อบัญชี HTTP

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏใน snapshot
    บัญชี แสดงว่าบัญชี HTTP ถูกกำหนดค่าแล้ว แต่ runtime ปัจจุบันไม่สามารถ
    resolve signing secret ที่อิง SecretRef ได้

  </Accordion>

  <Accordion title="คำสั่ง native/slash ไม่ทำงาน">
    ตรวจสอบว่าคุณตั้งใจใช้แบบใด:

    - โหมดคำสั่ง native (`channels.slack.commands.native: true`) พร้อมคำสั่ง slash ที่ตรงกันซึ่งลงทะเบียนไว้ใน Slack
    - หรือโหมดคำสั่ง slash เดียว (`channels.slack.slashCommand.enabled: true`)

    ตรวจสอบ `commands.useAccessGroups` และ allowlist ช่องทาง/ผู้ใช้ด้วย

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิง vision ของไฟล์แนบ

Slack สามารถแนบสื่อที่ดาวน์โหลดมาเข้ากับ turn ของ agent ได้เมื่อการดาวน์โหลดไฟล์ Slack สำเร็จและขีดจำกัดขนาดอนุญาต ไฟล์รูปภาพสามารถส่งผ่านเส้นทางทำความเข้าใจสื่อ หรือส่งโดยตรงไปยังโมเดลตอบกลับที่รองรับ vision; ไฟล์อื่นจะถูกเก็บไว้เป็นบริบทไฟล์ที่ดาวน์โหลดได้ แทนที่จะถือว่าเป็นอินพุตรูปภาพ

### ประเภทสื่อที่รองรับ

| ประเภทสื่อ                     | แหล่งที่มา               | พฤติกรรมปัจจุบัน                                                                  | หมายเหตุ                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| รูปภาพ JPEG / PNG / GIF / WebP | URL ไฟล์ Slack       | ดาวน์โหลดและแนบเข้ากับ turn สำหรับการจัดการที่รองรับ vision                   | ขีดจำกัดต่อไฟล์: `channels.slack.mediaMaxMb` (ค่าเริ่มต้น 20 MB)                 |
| ไฟล์ PDF                      | URL ไฟล์ Slack       | ดาวน์โหลดและเปิดเผยเป็นบริบทไฟล์สำหรับเครื่องมือ เช่น `download-file` หรือ `pdf` | ขาเข้า Slack ไม่แปลง PDF เป็นอินพุต image-vision โดยอัตโนมัติ |
| ไฟล์อื่น                    | URL ไฟล์ Slack       | ดาวน์โหลดเมื่อทำได้และเปิดเผยเป็นบริบทไฟล์                              | ไฟล์ไบนารีไม่ถูกถือว่าเป็นอินพุตรูปภาพ                               |
| การตอบกลับเธรด                 | ไฟล์ตัวเริ่มเธรด | ไฟล์ข้อความ root สามารถ hydrate เป็นบริบทได้เมื่อการตอบกลับไม่มีสื่อโดยตรง  | ตัวเริ่มที่มีแต่ไฟล์ใช้ placeholder ไฟล์แนบ                          |
| ข้อความหลายรูป           | ไฟล์ Slack หลายไฟล์ | แต่ละไฟล์ถูกประเมินอย่างอิสระ                                              | การประมวลผล Slack ถูกจำกัดไว้ที่แปดไฟล์ต่อข้อความ                     |

### Pipeline ขาเข้า

เมื่อข้อความ Slack ที่มีไฟล์แนบมาถึง:

1. OpenClaw ดาวน์โหลดไฟล์จาก URL ส่วนตัวของ Slack โดยใช้โทเค็นบอต (`xoxb-...`)
2. ไฟล์จะถูกเขียนลงในที่เก็บสื่อเมื่อสำเร็จ
3. พาธสื่อที่ดาวน์โหลดแล้วและชนิดเนื้อหาจะถูกเพิ่มลงในบริบทขาเข้า
4. พาธของโมเดล/เครื่องมือที่รองรับรูปภาพสามารถใช้ไฟล์แนบรูปภาพจากบริบทนั้นได้
5. ไฟล์ที่ไม่ใช่รูปภาพยังคงพร้อมใช้งานเป็นเมทาดาทาของไฟล์หรือการอ้างอิงสื่อสำหรับเครื่องมือที่รองรับ

### การสืบทอดไฟล์แนบจากรูทของเธรด

เมื่อมีข้อความเข้ามาในเธรด (มีพาเรนต์ `thread_ts`):

- หากข้อความตอบกลับเองไม่มีสื่อโดยตรง และข้อความรูทที่รวมมามีไฟล์ Slack สามารถเติมไฟล์ของรูทให้เป็นบริบทของตัวเริ่มเธรดได้
- ไฟล์แนบโดยตรงในข้อความตอบกลับมีลำดับความสำคัญเหนือไฟล์แนบของข้อความรูท
- ข้อความรูทที่มีเฉพาะไฟล์และไม่มีข้อความจะแสดงด้วยตัวแทนไฟล์แนบ เพื่อให้กลไกสำรองยังคงรวมไฟล์ของข้อความนั้นได้

### การจัดการไฟล์แนบหลายรายการ

เมื่อข้อความ Slack เดียวมีไฟล์แนบหลายไฟล์:

- ไฟล์แนบแต่ละรายการจะถูกประมวลผลแยกกันผ่านไปป์ไลน์สื่อ
- การอ้างอิงสื่อที่ดาวน์โหลดแล้วจะถูกรวบรวมไว้ในบริบทของข้อความ
- ลำดับการประมวลผลเป็นไปตามลำดับไฟล์ของ Slack ในเพย์โหลดอีเวนต์
- ความล้มเหลวในการดาวน์โหลดไฟล์แนบหนึ่งรายการจะไม่บล็อกรายการอื่น

### ขนาด การดาวน์โหลด และขีดจำกัดของโมเดล

- **ขีดจำกัดขนาด**: ค่าเริ่มต้น 20 MB ต่อไฟล์ กำหนดค่าได้ผ่าน `channels.slack.mediaMaxMb`
- **ความล้มเหลวในการดาวน์โหลด**: ไฟล์ที่ Slack ไม่สามารถให้บริการได้, URL หมดอายุ, ไฟล์ที่เข้าถึงไม่ได้, ไฟล์เกินขนาด และการตอบกลับ HTML สำหรับการยืนยันตัวตน/เข้าสู่ระบบของ Slack จะถูกข้าม แทนที่จะถูกรายงานว่าเป็นรูปแบบที่ไม่รองรับ
- **โมเดลวิชัน**: การวิเคราะห์รูปภาพใช้โมเดลตอบกลับที่ใช้งานอยู่เมื่อโมเดลนั้นรองรับวิชัน หรือใช้โมเดลรูปภาพที่กำหนดค่าไว้ที่ `agents.defaults.imageModel`

### ขีดจำกัดที่ทราบ

| สถานการณ์                               | พฤติกรรมปัจจุบัน                                                             | วิธีแก้ไข                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL ไฟล์ Slack หมดอายุ                 | ไฟล์ถูกข้าม; ไม่แสดงข้อผิดพลาด                                                 | อัปโหลดไฟล์ใหม่ใน Slack                                                |
| ไม่ได้กำหนดค่าโมเดลวิชัน            | ไฟล์แนบรูปภาพถูกจัดเก็บเป็นการอ้างอิงสื่อ แต่ไม่ได้วิเคราะห์เป็นรูปภาพ | กำหนดค่า `agents.defaults.imageModel` หรือใช้โมเดลตอบกลับที่รองรับวิชัน |
| รูปภาพขนาดใหญ่มาก (> 20 MB โดยค่าเริ่มต้น) | ถูกข้ามตามขีดจำกัดขนาด                                                         | เพิ่ม `channels.slack.mediaMaxMb` หาก Slack อนุญาต                       |
| ไฟล์แนบที่ส่งต่อ/แชร์มา           | ข้อความและสื่อรูปภาพ/ไฟล์ที่โฮสต์บน Slack เป็นแบบพยายามให้ดีที่สุด                       | แชร์โดยตรงอีกครั้งในเธรด OpenClaw                                   |
| ไฟล์แนบ PDF                        | จัดเก็บเป็นบริบทไฟล์/สื่อ ไม่ได้ส่งผ่านวิชันรูปภาพโดยอัตโนมัติ  | ใช้ `download-file` สำหรับเมทาดาทาของไฟล์ หรือเครื่องมือ `pdf` สำหรับการวิเคราะห์ PDF   |

### เอกสารที่เกี่ยวข้อง

- [ไปป์ไลน์การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
- [เครื่องมือ PDF](/th/tools/pdf)
- มหากาพย์: [#51349](https://github.com/openclaw/openclaw/issues/51349) — การเปิดใช้วิชันสำหรับไฟล์แนบ Slack
- การทดสอบการถดถอย: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- การยืนยันแบบสด: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Slack กับ Gateway
  </Card>
  <Card title="Groups" icon="users" href="/th/channels/groups">
    พฤติกรรมของแชนเนลและ DM กลุ่ม
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
