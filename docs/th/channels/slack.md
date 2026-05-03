---
read_when:
    - การตั้งค่า Slack หรือการดีบักโหมดซ็อกเก็ต/HTTP ของ Slack
summary: การตั้งค่า Slack และลักษณะการทำงานขณะรัน (โหมดซ็อกเก็ต + URL คำขอ HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-03T10:10:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85473159dcbd395144e5c37da140164023ac117406ba517d557fcf0989042448
    source_path: channels/slack.md
    workflow: 16
---

พร้อมใช้งานระดับโปรดักชันสำหรับ DM และช่องผ่านการผสานรวมแอป Slack โหมดเริ่มต้นคือโหมด Socket; รองรับ URL คำขอ HTTP ด้วย

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ Slack ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องและคู่มือการซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="โหมด Socket (ค่าเริ่มต้น)">
    <Steps>
      <Step title="สร้างแอป Slack ใหม่">
        ในการตั้งค่าแอป Slack ให้กดปุ่ม **[สร้างแอปใหม่](https://api.slack.com/apps/new)**:

        - เลือก **จาก manifest** และเลือก workspace สำหรับแอปของคุณ
        - วาง [manifest ตัวอย่าง](#manifest-and-scope-checklist) จากด้านล่างแล้วดำเนินการสร้างต่อ
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

        ทางเลือกสำรองผ่าน env (เฉพาะบัญชีเริ่มต้น):

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
        ในการตั้งค่าแอป Slack ให้กดปุ่ม **[สร้างแอปใหม่](https://api.slack.com/apps/new)**:

        - เลือก **จาก manifest** และเลือก workspace สำหรับแอปของคุณ
        - วาง [manifest ตัวอย่าง](#manifest-and-scope-checklist) และอัปเดต URL ก่อนสร้าง
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
        ใช้เส้นทาง webhook ที่ไม่ซ้ำกันสำหรับ HTTP หลายบัญชี

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

## การปรับแต่งทรานสปอร์ตของโหมด Socket

OpenClaw ตั้งค่า timeout ของ pong สำหรับไคลเอนต์ Slack SDK เป็น 15 วินาทีโดยค่าเริ่มต้นสำหรับโหมด Socket ให้แทนที่การตั้งค่าทรานสปอร์ตเฉพาะเมื่อคุณต้องปรับแต่งให้เหมาะกับ workspace หรือโฮสต์เฉพาะ:

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

ใช้ตัวเลือกนี้เฉพาะกับ workspace โหมด Socket ที่บันทึก timeout ของ Slack websocket pong/server-ping หรือทำงานบนโฮสต์ที่ทราบว่ามี event loop starvation `clientPingTimeout` คือเวลารอ pong หลังจาก SDK ส่ง client ping; `serverPingTimeout` คือเวลารอ ping จากเซิร์ฟเวอร์ Slack ข้อความและเหตุการณ์ของแอปยังคงเป็นสถานะแอปพลิเคชัน ไม่ใช่สัญญาณความพร้อมใช้งานของทรานสปอร์ต

## รายการตรวจสอบ manifest และ scope

manifest พื้นฐานของแอป Slack เหมือนกันสำหรับโหมด Socket และ URL คำขอ HTTP ต่างกันเฉพาะบล็อก `settings` (และ `url` ของคำสั่ง slash)

manifest พื้นฐาน (ค่าเริ่มต้นของโหมด Socket):

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

สำหรับ **โหมด URL คำขอ HTTP** ให้แทนที่ `settings` ด้วยตัวแปร HTTP และเพิ่ม `url` ให้แต่ละคำสั่ง slash ต้องมี URL สาธารณะ:

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

แสดงฟีเจอร์ต่าง ๆ ที่ขยายค่าเริ่มต้นด้านบน

manifest เริ่มต้นเปิดใช้แท็บ **Home** ของ Slack App Home และสมัครรับ `app_home_opened` เมื่อสมาชิก workspace เปิดแท็บ Home OpenClaw จะเผยแพร่มุมมอง Home เริ่มต้นที่ปลอดภัยด้วย `views.publish`; ไม่มี payload การสนทนาหรือการกำหนดค่าส่วนตัวรวมอยู่ด้วย แท็บ **Messages** ยังคงเปิดใช้งานสำหรับ DM ของ Slack

<AccordionGroup>
  <Accordion title="คำสั่ง slash แบบเนทีฟเพิ่มเติม">

    สามารถใช้ [คำสั่ง slash แบบเนทีฟ](#commands-and-slash-behavior) หลายรายการแทนคำสั่งที่กำหนดค่าไว้เพียงรายการเดียว พร้อมรายละเอียดปลีกย่อยดังนี้:

    - ใช้ `/agentstatus` แทน `/status` เพราะคำสั่ง `/status` ถูกสงวนไว้
    - สามารถเปิดให้ใช้คำสั่ง slash ได้พร้อมกันไม่เกิน 25 รายการ

    แทนที่ส่วน `features.slash_commands` ที่มีอยู่ด้วยชุดย่อยของ [คำสั่งที่มีให้ใช้](/th/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="โหมด Socket (ค่าเริ่มต้น)">

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
      <Tab title="URL คำขอ HTTP">
        ใช้รายการ `slash_commands` เดียวกับโหมด Socket ด้านบน และเพิ่ม `"url": "https://gateway-host.example.com/slack/events"` ให้ทุกรายการ ตัวอย่าง:

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
    เพิ่ม scope ของบอต `chat:write.customize` หากคุณต้องการให้ข้อความขาออกใช้ตัวตนของเอเจนต์ที่ใช้งานอยู่ (ชื่อผู้ใช้และไอคอนแบบกำหนดเอง) แทนตัวตนเริ่มต้นของแอป Slack

    หากคุณใช้ไอคอนอีโมจิ Slack ต้องการไวยากรณ์แบบ `:emoji_name:`

  </Accordion>
  <Accordion title="ขอบเขตโทเค็นผู้ใช้เพิ่มเติม (การดำเนินการอ่าน)">
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
- โหมด HTTP ต้องใช้ `botToken` + `signingSecret`
- `botToken`, `appToken`, `signingSecret` และ `userToken` รองรับสตริงข้อความธรรมดา
  หรือออบเจ็กต์ SecretRef
- โทเค็นใน config จะแทนที่ env fallback
- env fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
- `userToken` (`xoxp-...`) กำหนดได้เฉพาะใน config (ไม่มี env fallback) และค่าเริ่มต้นเป็นพฤติกรรมแบบอ่านอย่างเดียว (`userTokenReadOnly: true`)

พฤติกรรมสแนปช็อตสถานะ:

- การตรวจสอบบัญชี Slack ติดตามฟิลด์ `*Source` และ `*Status`
  ต่อข้อมูลรับรอง (`botToken`, `appToken`, `signingSecret`, `userToken`)
- สถานะคือ `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าผ่าน SecretRef
  หรือแหล่ง secret อื่นที่ไม่ใช่แบบ inline แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบัน
  ไม่สามารถแปลงค่าเป็นค่าจริงได้
- ในโหมด HTTP จะมี `signingSecretStatus`; ใน Socket Mode
  คู่ที่ต้องมีคือ `botTokenStatus` + `appTokenStatus`

<Tip>
สำหรับการดำเนินการ/การอ่านไดเรกทอรี โทเค็นผู้ใช้จะถูกเลือกใช้ก่อนเมื่อกำหนดค่าไว้ สำหรับการเขียน โทเค็นบ็อตยังคงถูกเลือกใช้ก่อน; การเขียนด้วยโทเค็นผู้ใช้อนุญาตเฉพาะเมื่อ `userTokenReadOnly: false` และโทเค็นบ็อตไม่พร้อมใช้งาน
</Tip>

## การดำเนินการและเกต

การดำเนินการของ Slack ถูกควบคุมโดย `channels.slack.actions.*`

กลุ่มการดำเนินการที่พร้อมใช้งานในเครื่องมือ Slack ปัจจุบัน:

| กลุ่ม      | ค่าเริ่มต้น |
| ---------- | ------- |
| messages   | เปิดใช้ |
| reactions  | เปิดใช้ |
| pins       | เปิดใช้ |
| memberInfo | เปิดใช้ |
| emojiList  | เปิดใช้ |

การดำเนินการข้อความ Slack ปัจจุบันประกอบด้วย `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list` `download-file` รองรับ ID ไฟล์ Slack ที่แสดงใน placeholder ไฟล์ขาเข้า และคืนค่าตัวอย่างรูปภาพสำหรับรูปภาพ หรือ metadata ของไฟล์ในเครื่องสำหรับไฟล์ชนิดอื่น

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM `channels.slack.allowFrom` คือ allowlist สำหรับ DM แบบมาตรฐาน

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.slack.allowFrom` มี `"*"`)
    - `disabled`

    แฟล็ก DM:

    - `dm.enabled` (ค่าเริ่มต้น true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (DM แบบกลุ่มมีค่าเริ่มต้นเป็น false)
    - `dm.groupChannels` (allowlist MPIM เพิ่มเติม)

    ลำดับความสำคัญของหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่มีชื่อจะสืบทอด `channels.slack.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตัวเอง
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.slack.accounts.default.allowFrom`

    `channels.slack.dm.policy` และ `channels.slack.dm.allowFrom` แบบ legacy ยังคงอ่านได้เพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    การ pairing ใน DM ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="นโยบายช่อง">
    `channels.slack.groupPolicy` ควบคุมการจัดการช่อง:

    - `open`
    - `allowlist`
    - `disabled`

    allowlist ของช่องอยู่ภายใต้ `channels.slack.channels` และ **ต้องใช้ ID ช่อง Slack ที่เสถียร** (เช่น `C12345678`) เป็นคีย์ config

    หมายเหตุรันไทม์: หาก `channels.slack` หายไปทั้งหมด (ตั้งค่าผ่าน env เท่านั้น) รันไทม์จะ fallback ไปที่ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` แล้วก็ตาม)

    การแปลงชื่อ/ID:

    - รายการ allowlist ของช่องและรายการ allowlist ของ DM จะถูกแปลงเมื่อเริ่มต้นเมื่อการเข้าถึงด้วยโทเค็นอนุญาต
    - รายการชื่อช่องที่แปลงไม่ได้จะคงไว้ตามที่กำหนดค่า แต่จะถูกละเว้นสำหรับการกำหนดเส้นทางตามค่าเริ่มต้น
    - การอนุญาตขาเข้าและการกำหนดเส้นทางช่องใช้ ID เป็นหลักตามค่าเริ่มต้น; การจับคู่ชื่อผู้ใช้/slug โดยตรงต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    คีย์ที่อิงตามชื่อ (`#channel-name` หรือ `channel-name`) จะ **ไม่** จับคู่ภายใต้ `groupPolicy: "allowlist"` การค้นหาช่องใช้ ID เป็นหลักตามค่าเริ่มต้น ดังนั้นคีย์ที่อิงตามชื่อจะไม่มีวันกำหนดเส้นทางสำเร็จ และข้อความทั้งหมดในช่องนั้นจะถูกบล็อกแบบเงียบ พฤติกรรมนี้ต่างจาก `groupPolicy: "open"` ซึ่งไม่ต้องใช้คีย์ช่องสำหรับการกำหนดเส้นทาง และคีย์ที่อิงตามชื่อจะดูเหมือนใช้งานได้

    ใช้ ID ช่อง Slack เป็นคีย์เสมอ วิธีหา ID: คลิกขวาที่ช่องใน Slack → **คัดลอกลิงก์** — ID (`C...`) จะปรากฏที่ท้าย URL

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
    ข้อความในช่องถูกเกตด้วยการกล่าวถึงตามค่าเริ่มต้น

    แหล่งที่มาของการกล่าวถึง:

    - การกล่าวถึงแอปอย่างชัดเจน (`<@botId>`)
    - การกล่าวถึงกลุ่มผู้ใช้ Slack (`<!subteam^S...>`) เมื่อผู้ใช้บ็อตเป็นสมาชิกของกลุ่มผู้ใช้นั้น; ต้องใช้ `usergroups:read`
    - รูปแบบ regex สำหรับการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรม thread ตอบกลับบ็อตโดยนัย (ปิดใช้เมื่อ `thread.requireExplicitMention` เป็น `true`)

    การควบคุมต่อช่อง (`channels.slack.channels.<id>`; ชื่อใช้ได้ผ่านการแปลงตอนเริ่มต้นหรือ `dangerouslyAllowNameMatching` เท่านั้น):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ `toolsBySender`: `id:`, `e164:`, `username:`, `name:` หรือ wildcard `"*"`
      (คีย์ legacy ที่ไม่มี prefix ยังคงแมปไปยัง `id:` เท่านั้น)

    `allowBots` มีแนวทางแบบระมัดระวังสำหรับช่องและช่องส่วนตัว: ข้อความในห้องที่เขียนโดยบ็อตจะถูกรับเฉพาะเมื่อบ็อตผู้ส่งถูกระบุอย่างชัดเจนใน allowlist `users` ของห้องนั้น หรือเมื่อมี ID เจ้าของ Slack อย่างชัดเจนอย่างน้อยหนึ่งรายการจาก `channels.slack.allowFrom` เป็นสมาชิกห้องอยู่ในขณะนั้น wildcard และรายการเจ้าของแบบชื่อที่แสดงไม่ถือว่าเป็นการมีอยู่ของเจ้าของ การมีอยู่ของเจ้าของใช้ Slack `conversations.members`; ตรวจสอบให้แน่ใจว่าแอปมีขอบเขตการอ่านที่ตรงกับชนิดห้อง (`channels:read` สำหรับช่องสาธารณะ, `groups:read` สำหรับช่องส่วนตัว) หากการค้นหาสมาชิกล้มเหลว OpenClaw จะทิ้งข้อความในห้องที่เขียนโดยบ็อต

  </Tab>
</Tabs>

## Threading, เซสชัน และแท็กตอบกลับ

- DM กำหนดเส้นทางเป็น `direct`; ช่องเป็น `channel`; MPIM เป็น `group`
- การผูกเส้นทาง Slack รองรับ ID เพียร์ดิบและรูปแบบเป้าหมาย Slack เช่น `channel:C12345678`, `user:U12345678` และ `<@U12345678>`
- เมื่อใช้ค่าเริ่มต้น `session.dmScope=main` DM ของ Slack จะถูกรวมเข้ากับเซสชันหลักของเอเจนต์
- เซสชันช่อง: `agent:<agentId>:slack:channel:<channelId>`
- การตอบกลับใน thread สามารถสร้าง suffix เซสชัน thread (`:thread:<threadTs>`) เมื่อใช้ได้
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความ thread ที่มีอยู่ซึ่งจะถูกดึงเมื่อเซสชัน thread ใหม่เริ่มต้น (ค่าเริ่มต้น `20`; ตั้ง `0` เพื่อปิดใช้)
- `channels.slack.thread.requireExplicitMention` (ค่าเริ่มต้น `false`): เมื่อเป็น `true` จะระงับการกล่าวถึง thread โดยนัย เพื่อให้บ็อตตอบสนองเฉพาะการกล่าวถึง `@bot` อย่างชัดเจนภายใน thread แม้บ็อตเคยเข้าร่วมใน thread นั้นแล้ว หากไม่มีค่านี้ การตอบกลับใน thread ที่บ็อตเคยเข้าร่วมจะข้ามเกต `requireMention`

การควบคุม Threading การตอบกลับ:

- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: ต่อ `direct|group|channel`
- fallback แบบ legacy สำหรับแชทโดยตรง: `channels.slack.dm.replyToMode`

รองรับแท็กตอบกลับด้วยตนเอง:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` ปิดใช้ Threading การตอบกลับ **ทั้งหมด** ใน Slack รวมถึงแท็ก `[[reply_to_*]]` ที่ระบุอย่างชัดเจน พฤติกรรมนี้ต่างจาก Telegram ซึ่งยังคงเคารพแท็กที่ระบุอย่างชัดเจนในโหมด `"off"` thread ของ Slack ซ่อนข้อความจากช่อง ส่วนการตอบกลับของ Telegram ยังแสดงแบบ inline
</Note>

## รีแอ็กชัน Ack

`ackReaction` ส่งอีโมจิยืนยันการรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

ลำดับการแปลงค่า:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- emoji fallback จากตัวตนเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้น "👀")

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"eyes"`)
- ใช้ `""` เพื่อปิดใช้รีแอ็กชันสำหรับบัญชี Slack หรือแบบทั่วโลก

## การสตรีมข้อความ

`channels.slack.streaming` ควบคุมพฤติกรรมตัวอย่างสด:

- `off`: ปิดใช้การสตรีมตัวอย่างสด
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความตัวอย่างด้วยผลลัพธ์บางส่วนล่าสุด
- `block`: เพิ่มการอัปเดตตัวอย่างเป็น chunk
- `progress`: แสดงข้อความสถานะความคืบหน้าระหว่างสร้าง แล้วส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อตัวอย่างฉบับร่างทำงานอยู่ ให้กำหนดเส้นทางการอัปเดตเครื่องมือ/ความคืบหน้าเข้าไปในข้อความตัวอย่างที่แก้ไขเดียวกัน (ค่าเริ่มต้น: `true`) ตั้ง `false` เพื่อเก็บข้อความเครื่องมือ/ความคืบหน้าแยกกัน

`channels.slack.streaming.nativeTransport` ควบคุมการสตรีมข้อความ native ของ Slack เมื่อ `channels.slack.streaming.mode` เป็น `partial` (ค่าเริ่มต้น: `true`)

- ต้องมี thread ตอบกลับสำหรับการสตรีมข้อความ native และสถานะ thread ของ Slack assistant จึงจะปรากฏ การเลือก thread ยังคงทำตาม `replyToMode`
- ช่อง, แชทกลุ่ม และราก DM ระดับบนสุดยังใช้ตัวอย่างฉบับร่างปกติได้เมื่อการสตรีม native ไม่พร้อมใช้งานหรือไม่มี thread ตอบกลับ
- DM ระดับบนสุดของ Slack จะอยู่นอก thread ตามค่าเริ่มต้น ดังนั้นจึงไม่แสดงตัวอย่างสตรีม/สถานะแบบ native สไตล์ thread ของ Slack; OpenClaw จะโพสต์และแก้ไขตัวอย่างฉบับร่างใน DM แทน
- Payload สื่อและที่ไม่ใช่ข้อความจะ fallback ไปยังการส่งปกติ
- ผลลัพธ์สุดท้ายของสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่; ผลลัพธ์สุดท้ายแบบข้อความ/บล็อกที่เข้าเงื่อนไขจะ flush เฉพาะเมื่อสามารถแก้ไขตัวอย่างในตำแหน่งเดิมได้
- หากการสตรีมล้มเหลวกลางคันของการตอบกลับ OpenClaw จะ fallback ไปยังการส่งปกติสำหรับ payload ที่เหลือ

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

คีย์ legacy:

- `channels.slack.streamMode` (`replace | status_final | append`) จะถูกย้ายอัตโนมัติไปยัง `channels.slack.streaming.mode`
- boolean `channels.slack.streaming` จะถูกย้ายอัตโนมัติไปยัง `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport`
- `channels.slack.nativeStreaming` แบบ legacy จะถูกย้ายอัตโนมัติไปยัง `channels.slack.streaming.nativeTransport`

## Fallback รีแอ็กชันการพิมพ์

`typingReaction` เพิ่มรีแอ็กชันชั่วคราวให้กับข้อความ Slack ขาเข้าขณะที่ OpenClaw กำลังประมวลผลการตอบกลับ แล้วลบออกเมื่อการรันเสร็จสิ้น สิ่งนี้มีประโยชน์มากที่สุดนอกการตอบกลับใน thread ซึ่งใช้ตัวบ่งชี้สถานะเริ่มต้น "กำลังพิมพ์..."

ลำดับการแปลงค่า:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"hourglass_flowing_sand"`)
- รีแอ็กชันเป็นแบบ best-effort และจะพยายามล้างโดยอัตโนมัติหลังจากการตอบกลับหรือเส้นทางความล้มเหลวเสร็จสมบูรณ์

## สื่อ, การแบ่ง chunk และการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบขาเข้า">
    ไฟล์แนบของ Slack จะถูกดาวน์โหลดจาก URL ส่วนตัวที่โฮสต์โดย Slack (โฟลว์คำขอที่ยืนยันตัวตนด้วยโทเค็น) และเขียนลงในคลังสื่อเมื่อดึงข้อมูลสำเร็จและขีดจำกัดขนาดอนุญาต ตัวยึดไฟล์มี Slack `fileId` เพื่อให้เอเจนต์ดึงไฟล์ต้นฉบับด้วย `download-file` ได้

    การดาวน์โหลดใช้ timeout สำหรับช่วงว่างและเวลารวมแบบมีขอบเขต หากการดึงไฟล์ Slack ค้างหรือล้มเหลว OpenClaw จะประมวลผลข้อความต่อไปและ fallback ไปใช้ตัวยึดไฟล์

    เพดานขนาดขาเข้าขณะรันไทม์มีค่าเริ่มต้นเป็น `20MB` เว้นแต่จะถูกแทนที่ด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="ข้อความและไฟล์ขาออก">
    - ชิ้นข้อความใช้ `channels.slack.textChunkLimit` (ค่าเริ่มต้น 4000)
    - `channels.slack.chunkMode="newline"` เปิดใช้การแบ่งโดยให้ย่อหน้ามาก่อน
    - การส่งไฟล์ใช้ API อัปโหลดของ Slack และรวมการตอบกลับในเธรด (`thread_ts`) ได้
    - เพดานสื่อขาออกจะใช้ `channels.slack.mediaMaxMb` เมื่อกำหนดค่าไว้ มิฉะนั้นการส่งผ่านช่องทางจะใช้ค่าเริ่มต้นตามชนิด MIME จาก media pipeline

  </Accordion>

  <Accordion title="เป้าหมายการส่ง">
    เป้าหมายแบบชัดเจนที่แนะนำ:

    - `user:<id>` สำหรับ DM
    - `channel:<id>` สำหรับช่องทาง

    Slack DM แบบข้อความหรือบล็อกเท่านั้นสามารถโพสต์ตรงไปยัง ID ผู้ใช้ได้ การอัปโหลดไฟล์และการส่งในเธรดจะเปิด DM ผ่าน Slack conversation API ก่อน เพราะพาธเหล่านั้นต้องใช้ ID บทสนทนาที่เป็นรูปธรรม

  </Accordion>
</AccordionGroup>

## คำสั่งและพฤติกรรม slash

คำสั่ง slash จะปรากฏใน Slack เป็นคำสั่งที่กำหนดค่าไว้คำสั่งเดียวหรือหลายคำสั่ง native กำหนดค่า `channels.slack.slashCommand` เพื่อเปลี่ยนค่าเริ่มต้นของคำสั่ง:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

คำสั่ง native ต้องใช้ [การตั้งค่า manifest เพิ่มเติม](#additional-manifest-settings) ในแอป Slack ของคุณ และเปิดใช้ด้วย `channels.slack.commands.native: true` หรือใช้ `commands.native: true` ในการกำหนดค่าระดับ global แทน

- โหมดอัตโนมัติของคำสั่ง native จะ **ปิด** สำหรับ Slack ดังนั้น `commands.native: "auto"` จะไม่เปิดใช้คำสั่ง native ของ Slack

```txt
/help
```

เมนูอาร์กิวเมนต์ native ใช้กลยุทธ์การเรนเดอร์แบบปรับได้ที่แสดงโมดัลยืนยันก่อน dispatch ค่าตัวเลือกที่เลือก:

- สูงสุด 5 ตัวเลือก: บล็อกปุ่ม
- 6-100 ตัวเลือก: เมนู static select
- มากกว่า 100 ตัวเลือก: external select พร้อมการกรองตัวเลือกแบบ async เมื่อมีตัวจัดการตัวเลือก interactivity
- เกินขีดจำกัดของ Slack: ค่าตัวเลือกที่เข้ารหัสจะ fallback ไปเป็นปุ่ม

```txt
/think
```

เซสชัน slash ใช้คีย์แบบแยก เช่น `agent:<agentId>:slack:slash:<userId>` และยังคง route การเรียกใช้คำสั่งไปยังเซสชันบทสนทนาเป้าหมายโดยใช้ `CommandTargetSessionKey`

## การตอบกลับแบบโต้ตอบ

Slack สามารถเรนเดอร์ตัวควบคุมการตอบกลับแบบโต้ตอบที่เอเจนต์เขียนได้ แต่ฟีเจอร์นี้ปิดไว้โดยค่าเริ่มต้น

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

เมื่อเปิดใช้แล้ว เอเจนต์สามารถปล่อย directive การตอบกลับเฉพาะ Slack ได้:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

directive เหล่านี้จะคอมไพล์เป็น Slack Block Kit และ route การคลิกหรือการเลือกกลับผ่านพาธอีเวนต์ interaction ของ Slack ที่มีอยู่

หมายเหตุ:

- นี่คือ UI เฉพาะ Slack ช่องทางอื่นจะไม่แปล directive ของ Slack Block Kit เป็นระบบปุ่มของตนเอง
- ค่า callback แบบโต้ตอบเป็นโทเค็นทึบที่ OpenClaw สร้าง ไม่ใช่ค่าดิบที่เอเจนต์เขียน
- หากบล็อกแบบโต้ตอบที่สร้างขึ้นจะเกินขีดจำกัดของ Slack Block Kit, OpenClaw จะ fallback ไปยังข้อความตอบกลับเดิมแทนการส่ง blocks payload ที่ไม่ถูกต้อง

## การอนุมัติ Exec ใน Slack

Slack สามารถทำหน้าที่เป็นไคลเอนต์อนุมัติ native ด้วยปุ่มและ interaction แบบโต้ตอบ แทนที่จะ fallback ไปยัง Web UI หรือเทอร์มินัล

- การอนุมัติ Exec ใช้ `channels.slack.execApprovals.*` สำหรับการ route ไปยัง DM/ช่องทางแบบ native
- การอนุมัติ Plugin ยังสามารถ resolve ผ่านพื้นผิวปุ่ม Slack-native เดียวกันได้ เมื่อคำขอเข้ามาใน Slack อยู่แล้วและชนิด id การอนุมัติเป็น `plugin:`
- การอนุญาตผู้อนุมัติยังคงถูกบังคับใช้: เฉพาะผู้ใช้ที่ระบุว่าเป็นผู้อนุมัติเท่านั้นที่สามารถอนุมัติหรือปฏิเสธคำขอผ่าน Slack ได้

สิ่งนี้ใช้พื้นผิวปุ่มอนุมัติร่วมเดียวกับช่องทางอื่น เมื่อเปิดใช้ `interactivity` ในการตั้งค่าแอป Slack ของคุณ prompt การอนุมัติจะเรนเดอร์เป็นปุ่ม Block Kit โดยตรงในบทสนทนา
เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นจะเป็น UX การอนุมัติหลัก OpenClaw
ควรรวมคำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือบอกว่า
การอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบ manual เป็นพาธเดียวเท่านั้น

พาธการกำหนดค่า:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; fallback ไปยัง `commands.ownerAllowFrom` เมื่อเป็นไปได้)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack จะเปิดใช้การอนุมัติ exec native โดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และ resolve
ผู้อนุมัติได้อย่างน้อยหนึ่งราย ตั้งค่า `enabled: false` เพื่อปิดใช้ Slack เป็นไคลเอนต์อนุมัติ native อย่างชัดเจน
ตั้งค่า `enabled: true` เพื่อบังคับเปิดการอนุมัติ native เมื่อ resolve ผู้อนุมัติได้

พฤติกรรมเริ่มต้นเมื่อไม่มีการกำหนดค่าการอนุมัติ exec ของ Slack อย่างชัดเจน:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

ต้องใช้การกำหนดค่า Slack-native แบบชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ผู้อนุมัติ เพิ่มตัวกรอง หรือ
เลือกใช้การส่งไปยัง origin-chat:

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

การ forward `approvals.exec` แบบ shared แยกต่างหาก ใช้เฉพาะเมื่อ prompt การอนุมัติ exec ต้อง
route ไปยังแชตอื่นหรือเป้าหมายนอกช่องทางแบบชัดเจนด้วย การ forward `approvals.plugin` แบบ shared ก็
แยกต่างหากเช่นกัน ปุ่ม Slack-native ยังสามารถ resolve การอนุมัติ Plugin ได้เมื่อคำขอเหล่านั้นเข้ามา
ใน Slack อยู่แล้ว

`/approve` ในแชตเดียวกันยังใช้ได้ในช่องทาง Slack และ DM ที่รองรับคำสั่งอยู่แล้ว ดู [การอนุมัติ Exec](/th/tools/exec-approvals) สำหรับโมเดลการ forward การอนุมัติแบบเต็ม

## อีเวนต์และพฤติกรรมการปฏิบัติงาน

- การแก้ไข/ลบข้อความถูกแมปเป็นอีเวนต์ระบบ
- Thread broadcast (การตอบกลับในเธรดแบบ "Also send to channel") ถูกประมวลผลเป็นข้อความผู้ใช้ปกติ
- อีเวนต์เพิ่ม/ลบ reaction ถูกแมปเป็นอีเวนต์ระบบ
- อีเวนต์สมาชิกเข้าร่วม/ออกจากช่องทาง, สร้าง/เปลี่ยนชื่อช่องทาง และเพิ่ม/ลบ pin ถูกแมปเป็นอีเวนต์ระบบ
- `channel_id_changed` สามารถย้ายคีย์การกำหนดค่าช่องทางเมื่อเปิดใช้ `configWrites`
- เมตาดาทา topic/purpose ของช่องทางถูกมองเป็นบริบทที่ไม่น่าเชื่อถือ และสามารถถูก inject เข้าในบริบทการ route ได้
- ตัวเริ่มเธรดและการ seed บริบทประวัติเธรดเริ่มต้นจะถูกกรองตาม allowlist ผู้ส่งที่กำหนดค่าไว้เมื่อเกี่ยวข้อง
- Block action และ modal interaction ปล่อยอีเวนต์ระบบ `Slack interaction: ...` แบบมีโครงสร้างพร้อมฟิลด์ payload ที่สมบูรณ์:
  - block action: ค่าที่เลือก, label, ค่า picker และเมตาดาทา `workflow_*`
  - อีเวนต์ modal `view_submission` และ `view_closed` พร้อมเมตาดาทาช่องทางที่ถูก route และอินพุตฟอร์ม

## อ้างอิงการกำหนดค่า

อ้างอิงหลัก: [อ้างอิงการกำหนดค่า - Slack](/th/gateway/config-channels#slack)

<Accordion title="ฟิลด์ Slack ที่ควรสนใจ">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- toggle ความเข้ากันได้: `dangerouslyAllowNameMatching` (break-glass; ปิดไว้ เว้นแต่จำเป็น)
- การเข้าถึงช่องทาง: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- เธรด/ประวัติ: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่ง: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- ops/features: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในช่องทาง">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - allowlist ช่องทาง (`channels.slack.channels`) — **คีย์ต้องเป็น ID ช่องทาง** (`C12345678`) ไม่ใช่ชื่อ (`#channel-name`) คีย์ตามชื่อจะล้มเหลวแบบเงียบภายใต้ `groupPolicy: "allowlist"` เพราะการ route ช่องทางใช้ ID เป็นหลักโดยค่าเริ่มต้น วิธีหา ID: คลิกขวาที่ช่องทางใน Slack → **Copy link** — ค่า `C...` ที่ท้าย URL คือ ID ช่องทาง
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
    - รายการอนุมัติการจับคู่ / รายการ allowlist
    - อีเวนต์ Slack Assistant DM: log แบบละเอียดที่กล่าวถึง `drop message_changed`
      มักหมายถึง Slack ส่งอีเวนต์ Assistant-thread ที่ถูกแก้ไขโดยไม่มี
      ผู้ส่งที่เป็นมนุษย์ซึ่งกู้คืนได้ในเมตาดาทาข้อความ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode ไม่เชื่อมต่อ">
    ตรวจสอบ bot + app token และการเปิดใช้ Socket Mode ในการตั้งค่าแอป Slack

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` แปลว่าบัญชี Slack ถูก
    กำหนดค่าไว้แล้ว แต่รันไทม์ปัจจุบันไม่สามารถ resolve
    ค่าที่รองรับด้วย SecretRef ได้

  </Accordion>

  <Accordion title="HTTP mode ไม่ได้รับอีเวนต์">
    ตรวจสอบ:

    - signing secret
    - พาธ Webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - `webhookPath` ที่ไม่ซ้ำกันต่อบัญชี HTTP

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏใน snapshot
    บัญชี แปลว่าบัญชี HTTP ถูกกำหนดค่าไว้แล้ว แต่รันไทม์ปัจจุบันไม่สามารถ
    resolve signing secret ที่รองรับด้วย SecretRef ได้

  </Accordion>

  <Accordion title="คำสั่ง native/slash ไม่ทำงาน">
    ตรวจสอบว่าคุณตั้งใจใช้แบบใด:

    - โหมดคำสั่ง native (`channels.slack.commands.native: true`) พร้อมคำสั่ง slash ที่ลงทะเบียนใน Slack ตรงกัน
    - หรือโหมดคำสั่ง slash เดียว (`channels.slack.slashCommand.enabled: true`)

    ตรวจสอบ `commands.useAccessGroups` และ allowlist ช่องทาง/ผู้ใช้ด้วย

  </Accordion>
</AccordionGroup>

## อ้างอิง vision ของไฟล์แนบ

Slack สามารถแนบสื่อที่ดาวน์โหลดมาเข้ากับ turn ของเอเจนต์เมื่อการดาวน์โหลดไฟล์ Slack สำเร็จและขีดจำกัดขนาดอนุญาต ไฟล์ภาพสามารถส่งผ่านพาธ media understanding หรือส่งตรงไปยังโมเดลตอบกลับที่รองรับ vision ได้ ส่วนไฟล์อื่นจะถูกเก็บเป็นบริบทไฟล์ที่ดาวน์โหลดได้ แทนที่จะถูก扱เป็นอินพุตภาพ

### ชนิดสื่อที่รองรับ

| ประเภทสื่อ | แหล่งที่มา | พฤติกรรมปัจจุบัน | หมายเหตุ |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| รูปภาพ JPEG / PNG / GIF / WebP | URL ไฟล์ Slack | ดาวน์โหลดและแนบกับเทิร์นเพื่อการจัดการที่รองรับการมองเห็น | ขีดจำกัดต่อไฟล์: `channels.slack.mediaMaxMb` (ค่าเริ่มต้น 20 MB) |
| ไฟล์ PDF | URL ไฟล์ Slack | ดาวน์โหลดและแสดงเป็นบริบทไฟล์สำหรับเครื่องมือต่างๆ เช่น `download-file` หรือ `pdf` | อินบาวด์ของ Slack จะไม่แปลง PDF เป็นอินพุตการมองเห็นภาพโดยอัตโนมัติ |
| ไฟล์อื่นๆ | URL ไฟล์ Slack | ดาวน์โหลดเมื่อเป็นไปได้และแสดงเป็นบริบทไฟล์ | ไฟล์ไบนารีจะไม่ถูกปฏิบัติเป็นอินพุตรูปภาพ |
| การตอบกลับในเธรด | ไฟล์ของข้อความเริ่มเธรด | ไฟล์ของข้อความรากสามารถเติมเป็นบริบทได้เมื่อการตอบกลับไม่มีสื่อโดยตรง | ข้อความเริ่มต้นที่มีแต่ไฟล์ใช้ตัวยึดตำแหน่งไฟล์แนบ |
| ข้อความหลายรูปภาพ | ไฟล์ Slack หลายไฟล์ | แต่ละไฟล์จะถูกประเมินแยกกัน | การประมวลผล Slack จำกัดไว้ที่แปดไฟล์ต่อข้อความ |

### ไปป์ไลน์อินบาวด์

เมื่อข้อความ Slack ที่มีไฟล์แนบมาถึง:

1. OpenClaw ดาวน์โหลดไฟล์จาก URL ส่วนตัวของ Slack โดยใช้โทเค็นของบอต (`xoxb-...`)
2. ไฟล์จะถูกเขียนไปยังที่เก็บสื่อเมื่อสำเร็จ
3. เส้นทางสื่อที่ดาวน์โหลดและชนิดเนื้อหาจะถูกเพิ่มลงในบริบทอินบาวด์
4. เส้นทางของโมเดล/เครื่องมือที่รองรับรูปภาพสามารถใช้ไฟล์แนบรูปภาพจากบริบทนั้นได้
5. ไฟล์ที่ไม่ใช่รูปภาพยังคงพร้อมใช้งานเป็นเมทาดาทาไฟล์หรือการอ้างอิงสื่อสำหรับเครื่องมือที่จัดการได้

### การสืบทอดไฟล์แนบจากรากเธรด

เมื่อข้อความมาถึงในเธรด (มีพาเรนต์ `thread_ts`):

- หากการตอบกลับเองไม่มีสื่อโดยตรง และข้อความรากที่รวมมามีไฟล์ Slack สามารถเติมไฟล์รากเป็นบริบทของข้อความเริ่มเธรดได้
- ไฟล์แนบของการตอบกลับโดยตรงจะมีลำดับความสำคัญเหนือไฟล์แนบของข้อความราก
- ข้อความรากที่มีเฉพาะไฟล์และไม่มีข้อความจะแสดงด้วยตัวยึดตำแหน่งไฟล์แนบ เพื่อให้กลไกสำรองยังคงรวมไฟล์ของข้อความนั้นได้

### การจัดการไฟล์แนบหลายรายการ

เมื่อข้อความ Slack เดียวมีไฟล์แนบหลายรายการ:

- ไฟล์แนบแต่ละรายการจะถูกประมวลผลแยกกันผ่านไปป์ไลน์สื่อ
- การอ้างอิงสื่อที่ดาวน์โหลดจะถูกรวมเข้าในบริบทข้อความ
- ลำดับการประมวลผลเป็นไปตามลำดับไฟล์ของ Slack ในเพย์โหลดเหตุการณ์
- ความล้มเหลวในการดาวน์โหลดไฟล์แนบรายการหนึ่งจะไม่บล็อกรายการอื่น

### ขนาด การดาวน์โหลด และขีดจำกัดของโมเดล

- **ขีดจำกัดขนาด**: ค่าเริ่มต้น 20 MB ต่อไฟล์ กำหนดค่าได้ผ่าน `channels.slack.mediaMaxMb`
- **ความล้มเหลวในการดาวน์โหลด**: ไฟล์ที่ Slack ให้บริการไม่ได้, URL หมดอายุ, ไฟล์ที่เข้าถึงไม่ได้, ไฟล์ขนาดเกินกำหนด และการตอบกลับ HTML สำหรับการยืนยันตัวตน/เข้าสู่ระบบของ Slack จะถูกข้ามแทนที่จะรายงานเป็นรูปแบบที่ไม่รองรับ
- **โมเดลการมองเห็น**: การวิเคราะห์รูปภาพใช้โมเดลตอบกลับที่ใช้งานอยู่เมื่อรองรับการมองเห็น หรือใช้โมเดลรูปภาพที่กำหนดค่าไว้ที่ `agents.defaults.imageModel`

### ขีดจำกัดที่ทราบ

| สถานการณ์ | พฤติกรรมปัจจุบัน | วิธีแก้ไขชั่วคราว |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL ไฟล์ Slack หมดอายุ | ข้ามไฟล์ ไม่มีข้อผิดพลาดแสดง | อัปโหลดไฟล์ใหม่ใน Slack |
| ยังไม่ได้กำหนดค่าโมเดลการมองเห็น | ไฟล์แนบรูปภาพถูกจัดเก็บเป็นการอ้างอิงสื่อ แต่ไม่ถูกวิเคราะห์เป็นรูปภาพ | กำหนดค่า `agents.defaults.imageModel` หรือใช้โมเดลตอบกลับที่รองรับการมองเห็น |
| รูปภาพขนาดใหญ่มาก (> 20 MB ตามค่าเริ่มต้น) | ข้ามตามขีดจำกัดขนาด | เพิ่ม `channels.slack.mediaMaxMb` หาก Slack อนุญาต |
| ไฟล์แนบที่ส่งต่อ/แชร์ | ข้อความและสื่อรูปภาพ/ไฟล์ที่โฮสต์บน Slack ใช้แบบพยายามให้ดีที่สุด | แชร์ใหม่โดยตรงในเธรด OpenClaw |
| ไฟล์แนบ PDF | จัดเก็บเป็นบริบทไฟล์/สื่อ ไม่ได้กำหนดเส้นทางผ่านการมองเห็นภาพโดยอัตโนมัติ | ใช้ `download-file` สำหรับเมทาดาทาไฟล์ หรือเครื่องมือ `pdf` สำหรับการวิเคราะห์ PDF |

### เอกสารที่เกี่ยวข้อง

- [ไปป์ไลน์การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
- [เครื่องมือ PDF](/th/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — การเปิดใช้งานการมองเห็นสำหรับไฟล์แนบ Slack
- การทดสอบรีเกรสชัน: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- การยืนยันสด: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Slack กับ Gateway
  </Card>
  <Card title="Groups" icon="users" href="/th/channels/groups">
    พฤติกรรมของช่องและกลุ่ม DM
  </Card>
  <Card title="Channel routing" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความอินบาวด์ไปยังเอเจนต์
  </Card>
  <Card title="Security" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเพิ่มความแข็งแกร่ง
  </Card>
  <Card title="Configuration" icon="sliders" href="/th/gateway/configuration">
    โครงร่างการกำหนดค่าและลำดับความสำคัญ
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    แค็ตตาล็อกคำสั่งและพฤติกรรม
  </Card>
</CardGroup>
