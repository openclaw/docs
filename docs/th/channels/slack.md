---
read_when:
    - การตั้งค่า Slack หรือการดีบักโหมดซ็อกเก็ต/HTTP ของ Slack
summary: การตั้งค่า Slack และพฤติกรรมขณะรันไทม์ (โหมดซ็อกเก็ต + URL ของคำขอ HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-02T10:08:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60e06b138e1579156ccd07bb6db1a25009be970d072ba500b61810c5b78fd01d
    source_path: channels/slack.md
    workflow: 16
---

พร้อมใช้งานจริงสำหรับ DM และช่องทางต่าง ๆ ผ่านการผสานรวมแอป Slack โหมดเริ่มต้นคือโหมด Socket และยังรองรับ URL คำขอ HTTP ด้วย

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ Slack ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่งสแลช" icon="terminal" href="/th/tools/slash-commands">
    ลักษณะการทำงานของคำสั่งแบบเนทีฟและแคตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและคู่มือการซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="โหมด Socket (ค่าเริ่มต้น)">
    <Steps>
      <Step title="สร้างแอป Slack ใหม่">
        ในการตั้งค่าแอป Slack ให้กดปุ่ม **[Create New App](https://api.slack.com/apps/new)**:

        - เลือก **from a manifest** และเลือกเวิร์กสเปซสำหรับแอปของคุณ
        - วาง [แมนิเฟสต์ตัวอย่าง](#manifest-and-scope-checklist) จากด้านล่าง แล้วดำเนินการต่อเพื่อสร้าง
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

        Env สำรอง (เฉพาะบัญชีเริ่มต้น):

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
        ในการตั้งค่าแอป Slack ให้กดปุ่ม **[Create New App](https://api.slack.com/apps/new)**:

        - เลือก **from a manifest** และเลือกเวิร์กสเปซสำหรับแอปของคุณ
        - วาง [แมนิเฟสต์ตัวอย่าง](#manifest-and-scope-checklist) และอัปเดต URL ก่อนสร้าง
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

OpenClaw ตั้งค่าไทม์เอาต์ pong ของไคลเอนต์ Slack SDK เป็น 15 วินาทีโดยค่าเริ่มต้นสำหรับโหมด Socket ให้แทนที่การตั้งค่าทรานสปอร์ตเฉพาะเมื่อคุณต้องปรับแต่งตามเวิร์กสเปซหรือโฮสต์เท่านั้น:

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

ใช้ค่านี้เฉพาะสำหรับเวิร์กสเปซโหมด Socket ที่บันทึกไทม์เอาต์ Slack websocket pong/server-ping หรือทำงานบนโฮสต์ที่ทราบว่ามีภาวะ event loop ขาดทรัพยากร `clientPingTimeout` คือเวลารอ pong หลังจาก SDK ส่ง client ping; `serverPingTimeout` คือเวลารอ server ping จาก Slack ข้อความและเหตุการณ์ของแอปยังคงเป็นสถานะแอปพลิเคชัน ไม่ใช่สัญญาณความพร้อมของทรานสปอร์ต

## รายการตรวจสอบแมนิเฟสต์และขอบเขต

แมนิเฟสต์แอป Slack พื้นฐานเหมือนกันสำหรับโหมด Socket และ URL คำขอ HTTP แตกต่างกันเฉพาะบล็อก `settings` (และ `url` ของคำสั่งสแลช)

แมนิเฟสต์พื้นฐาน (ค่าเริ่มต้นของโหมด Socket):

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

สำหรับ **โหมด URL คำขอ HTTP** ให้แทนที่ `settings` ด้วยรูปแบบ HTTP และเพิ่ม `url` ให้คำสั่งสแลชแต่ละรายการ ต้องมี URL สาธารณะ:

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

### การตั้งค่าแมนิเฟสต์เพิ่มเติม

เปิดใช้ฟีเจอร์ต่าง ๆ ที่ขยายค่าเริ่มต้นข้างต้น

แมนิเฟสต์เริ่มต้นเปิดใช้แท็บ Slack App Home **Home** และสมัครรับ `app_home_opened` เมื่อสมาชิกเวิร์กสเปซเปิดแท็บ Home, OpenClaw จะเผยแพร่มุมมอง Home เริ่มต้นที่ปลอดภัยด้วย `views.publish`; ไม่มีเพย์โหลดการสนทนาหรือการกำหนดค่าส่วนตัวรวมอยู่ด้วย แท็บ **Messages** ยังคงเปิดใช้สำหรับ DM ของ Slack

<AccordionGroup>
  <Accordion title="คำสั่งสแลชแบบเนทีฟที่เลือกได้">

    สามารถใช้ [คำสั่งสแลชแบบเนทีฟ](#commands-and-slash-behavior) หลายรายการแทนคำสั่งเดียวที่กำหนดค่าไว้ โดยมีรายละเอียดดังนี้:

    - ใช้ `/agentstatus` แทน `/status` เพราะคำสั่ง `/status` ถูกสงวนไว้
    - สามารถเปิดให้ใช้คำสั่งสแลชได้พร้อมกันไม่เกิน 25 รายการ

    แทนที่ส่วน `features.slash_commands` ที่มีอยู่ของคุณด้วยชุดย่อยของ [คำสั่งที่พร้อมใช้งาน](/th/tools/slash-commands#command-list):

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
        ใช้รายการ `slash_commands` เดียวกับโหมด Socket ด้านบน และเพิ่ม `"url": "https://gateway-host.example.com/slack/events"` ให้ทุกเอนทรี ตัวอย่าง:

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
  <Accordion title="ขอบเขตการระบุผู้เขียนที่เลือกได้ (การดำเนินการเขียน)">
    เพิ่มขอบเขตบอต `chat:write.customize` หากคุณต้องการให้ข้อความขาออกใช้ตัวตนของเอเจนต์ที่ใช้งานอยู่ (ชื่อผู้ใช้และไอคอนแบบกำหนดเอง) แทนตัวตนแอป Slack เริ่มต้น

    หากคุณใช้ไอคอนอีโมจิ Slack จะคาดหวังไวยากรณ์ `:emoji_name:`

  </Accordion>
  <Accordion title="ขอบเขตโทเค็นผู้ใช้แบบไม่บังคับ (การดำเนินการอ่าน)">
    หากคุณกำหนดค่า `channels.slack.userToken` ขอบเขตการอ่านทั่วไปคือ:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (หากคุณต้องพึ่งพาการอ่านจากการค้นหาของ Slack)

  </Accordion>
</AccordionGroup>

## โมเดลโทเค็น

- ต้องมี `botToken` + `appToken` สำหรับโหมด Socket
- โหมด HTTP ต้องมี `botToken` + `signingSecret`
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับค่าสตริงข้อความธรรมดา
  หรือออบเจ็กต์ SecretRef
- โทเค็นใน config จะแทนที่ fallback จาก env
- fallback จาก env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
- `userToken` (`xoxp-...`) ใช้ได้เฉพาะใน config (ไม่มี fallback จาก env) และมีค่าเริ่มต้นเป็นพฤติกรรมอ่านอย่างเดียว (`userTokenReadOnly: true`)

พฤติกรรมภาพรวมสถานะ:

- การตรวจสอบบัญชี Slack ติดตามฟิลด์ `*Source` และ `*Status`
  ต่อข้อมูลรับรอง (`botToken`, `appToken`, `signingSecret`, `userToken`)
- สถานะคือ `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าผ่าน SecretRef
  หรือแหล่งความลับแบบไม่ฝังในบรรทัดอื่น แต่พาธคำสั่ง/รันไทม์ปัจจุบัน
  ไม่สามารถ resolve ค่าจริงได้
- ในโหมด HTTP จะรวม `signingSecretStatus`; ในโหมด Socket
  คู่ที่จำเป็นคือ `botTokenStatus` + `appTokenStatus`

<Tip>
สำหรับการอ่าน actions/directory โทเค็นผู้ใช้อาจถูกเลือกใช้ก่อนเมื่อกำหนดค่าไว้ สำหรับการเขียน โทเค็นบอทยังคงถูกเลือกใช้ก่อน การเขียนด้วยโทเค็นผู้ใช้อนุญาตเฉพาะเมื่อ `userTokenReadOnly: false` และโทเค็นบอทไม่พร้อมใช้งานเท่านั้น
</Tip>

## การดำเนินการและ gate

การดำเนินการของ Slack ถูกควบคุมโดย `channels.slack.actions.*`

กลุ่มการดำเนินการที่มีในเครื่องมือ Slack ปัจจุบัน:

| กลุ่ม      | ค่าเริ่มต้น |
| ---------- | ------- |
| messages   | เปิดใช้งาน |
| reactions  | เปิดใช้งาน |
| pins       | เปิดใช้งาน |
| memberInfo | เปิดใช้งาน |
| emojiList  | เปิดใช้งาน |

การดำเนินการข้อความ Slack ปัจจุบันประกอบด้วย `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list` `download-file` รับ ID ไฟล์ Slack ที่แสดงใน placeholder ไฟล์ขาเข้า และคืนค่าพรีวิวรูปภาพสำหรับรูปภาพ หรือ metadata ไฟล์ในเครื่องสำหรับไฟล์ประเภทอื่น

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM `channels.slack.allowFrom` คือ allowlist ของ DM ตาม canonical

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องมี `channels.slack.allowFrom` ที่รวม `"*"`)
    - `disabled`

    แฟล็ก DM:

    - `dm.enabled` (ค่าเริ่มต้น true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (แบบเดิม)
    - `dm.groupEnabled` (DM แบบกลุ่มมีค่าเริ่มต้น false)
    - `dm.groupChannels` (allowlist MPIM แบบไม่บังคับ)

    ลำดับความสำคัญแบบหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่มีชื่อจะสืบทอด `channels.slack.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตัวเอง
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.slack.accounts.default.allowFrom`

    `channels.slack.dm.policy` และ `channels.slack.dm.allowFrom` แบบเดิมยังคงถูกอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะ migrate ค่าเหล่านี้ไปเป็น `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    การจับคู่ใน DM ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="นโยบายช่อง">
    `channels.slack.groupPolicy` ควบคุมการจัดการช่อง:

    - `open`
    - `allowlist`
    - `disabled`

    allowlist ของช่องอยู่ใต้ `channels.slack.channels` และ **ต้องใช้ ID ช่อง Slack ที่เสถียร** (เช่น `C12345678`) เป็นคีย์ config

    หมายเหตุรันไทม์: หาก `channels.slack` ขาดหายไปทั้งหมด (การตั้งค่าแบบ env-only) รันไทม์จะ fallback ไปที่ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้ตั้งค่า `channels.defaults.groupPolicy` แล้วก็ตาม)

    การ resolve ชื่อ/ID:

    - รายการ allowlist ของช่องและรายการ allowlist ของ DM จะถูก resolve ตอนเริ่มต้นเมื่อการเข้าถึงโทเค็นอนุญาต
    - รายการชื่อช่องที่ resolve ไม่ได้จะถูกเก็บไว้ตามที่กำหนดค่า แต่จะถูกละเว้นสำหรับการกำหนดเส้นทางตามค่าเริ่มต้น
    - การอนุญาตขาเข้าและการกำหนดเส้นทางช่องเป็นแบบ ID-first ตามค่าเริ่มต้น การจับคู่ชื่อผู้ใช้/slug โดยตรงต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    คีย์แบบอิงชื่อ (`#channel-name` หรือ `channel-name`) จะ **ไม่** ตรงกันภายใต้ `groupPolicy: "allowlist"` การค้นหาช่องเป็นแบบ ID-first ตามค่าเริ่มต้น ดังนั้นคีย์แบบอิงชื่อจะกำหนดเส้นทางไม่สำเร็จเลย และข้อความทั้งหมดในช่องนั้นจะถูกบล็อกอย่างเงียบ ๆ ซึ่งต่างจาก `groupPolicy: "open"` ที่ไม่จำเป็นต้องใช้คีย์ช่องสำหรับการกำหนดเส้นทาง และคีย์แบบอิงชื่อดูเหมือนจะใช้งานได้

    ใช้ ID ช่อง Slack เป็นคีย์เสมอ วิธีค้นหา: คลิกขวาช่องใน Slack → **Copy link** — ID (`C...`) จะปรากฏที่ท้าย URL

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

  <Tab title="การ mention และผู้ใช้ช่อง">
    ข้อความในช่องถูก gate ด้วย mention ตามค่าเริ่มต้น

    แหล่งที่มาของ mention:

    - mention แอปอย่างชัดเจน (`<@botId>`)
    - mention กลุ่มผู้ใช้ Slack (`<!subteam^S...>`) เมื่อผู้ใช้บอทเป็นสมาชิกของกลุ่มผู้ใช้นั้น ต้องมี `usergroups:read`
    - รูปแบบ mention regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรมเธรดแบบตอบกลับบอทโดยนัย (ปิดใช้งานเมื่อ `thread.requireExplicitMention` เป็น `true`)

    การควบคุมรายช่อง (`channels.slack.channels.<id>`; ชื่อใช้ได้ผ่านการ resolve ตอนเริ่มต้นหรือ `dangerouslyAllowNameMatching` เท่านั้น):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ `toolsBySender`: `id:`, `e164:`, `username:`, `name:` หรือ wildcard `"*"`
      (คีย์แบบเดิมที่ไม่มี prefix ยัง map ไปที่ `id:` เท่านั้น)

    `allowBots` เป็นแบบระมัดระวังสำหรับช่องและช่องส่วนตัว: ข้อความห้องที่เขียนโดยบอทจะถูกรับเฉพาะเมื่อบอทผู้ส่งถูกระบุไว้อย่างชัดเจนใน allowlist `users` ของห้องนั้น หรือเมื่อ ID เจ้าของ Slack ที่ชัดเจนอย่างน้อยหนึ่งรายการจาก `channels.slack.allowFrom` เป็นสมาชิกห้องอยู่ในขณะนั้น wildcard และรายการเจ้าของแบบชื่อที่แสดงไม่ถือว่าเป็นการมีอยู่ของเจ้าของ การมีอยู่ของเจ้าของใช้ Slack `conversations.members`; ตรวจสอบให้แน่ใจว่าแอปมีขอบเขตการอ่านที่ตรงกับประเภทห้อง (`channels:read` สำหรับช่องสาธารณะ, `groups:read` สำหรับช่องส่วนตัว) หากการค้นหาสมาชิกล้มเหลว OpenClaw จะทิ้งข้อความห้องที่เขียนโดยบอท

  </Tab>
</Tabs>

## เธรด เซสชัน และแท็กตอบกลับ

- DM กำหนดเส้นทางเป็น `direct`; ช่องเป็น `channel`; MPIM เป็น `group`
- การผูกเส้นทาง Slack รับ ID peer ดิบ รวมถึงรูปแบบเป้าหมาย Slack เช่น `channel:C12345678`, `user:U12345678` และ `<@U12345678>`
- ด้วยค่าเริ่มต้น `session.dmScope=main` DM ของ Slack จะถูกรวมเข้ากับเซสชันหลักของ agent
- เซสชันช่อง: `agent:<agentId>:slack:channel:<channelId>`
- การตอบกลับเธรดสามารถสร้าง suffix เซสชันเธรด (`:thread:<threadTs>`) เมื่อใช้ได้
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความเธรดที่มีอยู่ซึ่งจะถูกดึงเมื่อเซสชันเธรดใหม่เริ่มต้น (ค่าเริ่มต้น `20`; ตั้งเป็น `0` เพื่อปิดใช้งาน)
- `channels.slack.thread.requireExplicitMention` (ค่าเริ่มต้น `false`): เมื่อเป็น `true` จะระงับ mention เธรดโดยนัย เพื่อให้บอทตอบกลับเฉพาะ mention `@bot` อย่างชัดเจนภายในเธรด แม้บอทเคยมีส่วนร่วมในเธรดแล้วก็ตาม หากไม่มีค่านี้ การตอบกลับในเธรดที่บอทเคยมีส่วนร่วมจะข้าม gate `requireMention`

การควบคุมเธรดตอบกลับ:

- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: ต่อ `direct|group|channel`
- fallback แบบเดิมสำหรับแชทโดยตรง: `channels.slack.dm.replyToMode`

รองรับแท็กตอบกลับแบบ manual:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` ปิดใช้งานเธรดตอบกลับ **ทั้งหมด** ใน Slack รวมถึงแท็ก `[[reply_to_*]]` ที่ระบุชัดเจน ซึ่งต่างจาก Telegram ที่แท็กชัดเจนยังคงถูกใช้งานในโหมด `"off"` เธรด Slack ซ่อนข้อความจากช่อง ขณะที่การตอบกลับใน Telegram ยังมองเห็นอยู่ในบรรทัด
</Note>

## รีแอ็กชัน ack

`ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

ลำดับการ resolve:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback อีโมจิตัวตน agent (`agents.list[].identity.emoji`, มิฉะนั้น "👀")

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"eyes"`)
- ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับบัญชี Slack หรือทั่วทั้งระบบ

## การสตรีมข้อความ

`channels.slack.streaming` ควบคุมพฤติกรรมพรีวิวสด:

- `off`: ปิดใช้งานการสตรีมพรีวิวสด
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความพรีวิวด้วยผลลัพธ์บางส่วนล่าสุด
- `block`: ต่อท้ายอัปเดตพรีวิวแบบ chunk
- `progress`: แสดงข้อความสถานะความคืบหน้าขณะสร้าง แล้วส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อพรีวิวฉบับร่างเปิดใช้งาน ให้กำหนดเส้นทางอัปเดตเครื่องมือ/ความคืบหน้าไปยังข้อความพรีวิวที่แก้ไขเดียวกัน (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อเก็บข้อความเครื่องมือ/ความคืบหน้าแยกกัน

`channels.slack.streaming.nativeTransport` ควบคุมการสตรีมข้อความ native ของ Slack เมื่อ `channels.slack.streaming.mode` เป็น `partial` (ค่าเริ่มต้น: `true`)

- ต้องมีเธรดตอบกลับเพื่อให้การสตรีมข้อความ native และสถานะเธรดผู้ช่วยของ Slack ปรากฏ การเลือกเธรดยังคงเป็นไปตาม `replyToMode`
- root ของช่องและแชทกลุ่มยังสามารถใช้พรีวิวฉบับร่างปกติได้เมื่อ native streaming ไม่พร้อมใช้งาน
- DM ของ Slack ระดับบนสุดยังคงอยู่นอกเธรดตามค่าเริ่มต้น จึงไม่แสดงพรีวิวแบบเธรด ใช้การตอบกลับในเธรดหรือ `typingReaction` หากคุณต้องการให้เห็นความคืบหน้าที่นั่น
- payload สื่อและ non-text จะ fallback ไปใช้การส่งมอบปกติ
- ผลลัพธ์สุดท้ายของสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขพรีวิวที่ค้างอยู่ ผลลัพธ์สุดท้ายของ text/block ที่เข้าเงื่อนไขจะ flush เฉพาะเมื่อแก้ไขพรีวิวเดิมได้
- หากการสตรีมล้มเหลวกลางการตอบกลับ OpenClaw จะ fallback ไปใช้การส่งมอบปกติสำหรับ payload ที่เหลือ

ใช้พรีวิวฉบับร่างแทนการสตรีมข้อความ native ของ Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) จะถูก auto-migrated ไปเป็น `channels.slack.streaming.mode`
- boolean `channels.slack.streaming` จะถูก auto-migrated ไปเป็น `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport`
- `channels.slack.nativeStreaming` แบบเดิมจะถูก auto-migrated ไปเป็น `channels.slack.streaming.nativeTransport`

## fallback รีแอ็กชันกำลังพิมพ์

`typingReaction` เพิ่มรีแอ็กชันชั่วคราวไปยังข้อความ Slack ขาเข้าขณะที่ OpenClaw กำลังประมวลผลการตอบกลับ แล้วลบออกเมื่อการรันเสร็จสิ้น สิ่งนี้มีประโยชน์ที่สุดนอกการตอบกลับในเธรด ซึ่งใช้ตัวบ่งชี้สถานะ "is typing..." ตามค่าเริ่มต้น

ลำดับการ resolve:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"hourglass_flowing_sand"`)
- รีแอ็กชันเป็นแบบ best-effort และจะพยายาม cleanup โดยอัตโนมัติหลังจากพาธการตอบกลับหรือความล้มเหลวเสร็จสมบูรณ์

## สื่อ การแบ่ง chunk และการส่งมอบ

<AccordionGroup>
  <Accordion title="ไฟล์แนบขาเข้า">
    ไฟล์แนบของ Slack จะถูกดาวน์โหลดจาก URL ส่วนตัวที่โฮสต์โดย Slack (กระบวนการคำขอที่ยืนยันตัวตนด้วยโทเค็น) และเขียนลงในที่เก็บสื่อเมื่อดึงข้อมูลสำเร็จและขีดจำกัดขนาดอนุญาต ตัวยึดตำแหน่งไฟล์จะรวม `fileId` ของ Slack เพื่อให้เอเจนต์ดึงไฟล์ต้นฉบับด้วย `download-file` ได้

    การดาวน์โหลดใช้ค่าหมดเวลาขณะไม่ได้ใช้งานและเวลารวมที่มีขอบเขตจำกัด หากการดึงไฟล์จาก Slack หยุดค้างหรือล้มเหลว OpenClaw จะประมวลผลข้อความต่อไปและย้อนกลับไปใช้ตัวยึดตำแหน่งไฟล์

    ขีดจำกัดขนาดขาเข้าขณะรันมีค่าเริ่มต้นเป็น `20MB` เว้นแต่จะถูกแทนที่ด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="ข้อความและไฟล์ขาออก">
    - ส่วนข้อความใช้ `channels.slack.textChunkLimit` (ค่าเริ่มต้น 4000)
    - `channels.slack.chunkMode="newline"` เปิดใช้การแบ่งโดยให้ย่อหน้ามาก่อน
    - การส่งไฟล์ใช้ API อัปโหลดของ Slack และสามารถรวมการตอบกลับในเธรด (`thread_ts`) ได้
    - ขีดจำกัดสื่อขาออกจะอิงตาม `channels.slack.mediaMaxMb` เมื่อกำหนดค่าไว้ มิฉะนั้นการส่งผ่านแชนแนลจะใช้ค่าเริ่มต้นตามชนิด MIME จากไปป์ไลน์สื่อ

  </Accordion>

  <Accordion title="เป้าหมายการส่ง">
    เป้าหมายแบบระบุชัดเจนที่แนะนำ:

    - `user:<id>` สำหรับ DM
    - `channel:<id>` สำหรับแชนแนล

    DM ของ Slack ที่เป็นข้อความ/บล็อกเท่านั้นสามารถโพสต์ไปยังรหัสผู้ใช้ได้โดยตรง ส่วนการอัปโหลดไฟล์และการส่งแบบมีเธรดจะเปิด DM ผ่าน API การสนทนาของ Slack ก่อน เพราะเส้นทางเหล่านั้นต้องใช้รหัสการสนทนาที่เป็นรูปธรรม

  </Accordion>
</AccordionGroup>

## คำสั่งและพฤติกรรมเครื่องหมายทับ

คำสั่งเครื่องหมายทับจะแสดงใน Slack เป็นคำสั่งเดียวที่กำหนดค่าไว้หรือเป็นคำสั่งเนทีฟหลายคำสั่ง กำหนดค่า `channels.slack.slashCommand` เพื่อเปลี่ยนค่าเริ่มต้นของคำสั่ง:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

คำสั่งเนทีฟต้องใช้ [การตั้งค่าแมนิเฟสต์เพิ่มเติม](#additional-manifest-settings) ในแอป Slack ของคุณ และเปิดใช้ด้วย `channels.slack.commands.native: true` หรือ `commands.native: true` ในการกำหนดค่าส่วนกลางแทน

- โหมดอัตโนมัติของคำสั่งเนทีฟถูก **ปิด** สำหรับ Slack ดังนั้น `commands.native: "auto"` จึงไม่เปิดใช้คำสั่งเนทีฟของ Slack

```txt
/help
```

เมนูอาร์กิวเมนต์เนทีฟใช้กลยุทธ์การแสดงผลแบบปรับตัวได้ที่แสดงโมดัลยืนยันก่อนส่งค่าตัวเลือกที่เลือก:

- สูงสุด 5 ตัวเลือก: บล็อกปุ่ม
- 6-100 ตัวเลือก: เมนูเลือกแบบคงที่
- มากกว่า 100 ตัวเลือก: การเลือกภายนอกพร้อมการกรองตัวเลือกแบบอะซิงโครนัสเมื่อมีตัวจัดการตัวเลือกการโต้ตอบพร้อมใช้งาน
- เกินขีดจำกัดของ Slack: ค่าตัวเลือกที่เข้ารหัสจะย้อนกลับไปใช้ปุ่ม

```txt
/think
```

เซสชันเครื่องหมายทับใช้คีย์แบบแยก เช่น `agent:<agentId>:slack:slash:<userId>` และยังคงกำหนดเส้นทางการเรียกใช้คำสั่งไปยังเซสชันการสนทนาเป้าหมายโดยใช้ `CommandTargetSessionKey`

## การตอบกลับแบบโต้ตอบ

Slack สามารถแสดงตัวควบคุมการตอบกลับแบบโต้ตอบที่เอเจนต์เขียนได้ แต่ฟีเจอร์นี้ถูกปิดใช้งานตามค่าเริ่มต้น

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

เมื่อเปิดใช้ เอเจนต์สามารถส่งคำสั่งการตอบกลับเฉพาะ Slack ได้:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

คำสั่งเหล่านี้จะคอมไพล์เป็น Slack Block Kit และกำหนดเส้นทางการคลิกหรือการเลือกกลับผ่านเส้นทางเหตุการณ์การโต้ตอบของ Slack ที่มีอยู่

หมายเหตุ:

- นี่คือ UI เฉพาะของ Slack แชนแนลอื่นจะไม่แปลคำสั่ง Slack Block Kit เป็นระบบปุ่มของตนเอง
- ค่าคอลแบ็กแบบโต้ตอบเป็นโทเค็นทึบที่ OpenClaw สร้างขึ้น ไม่ใช่ค่าดิบที่เอเจนต์เขียน
- หากบล็อกแบบโต้ตอบที่สร้างขึ้นจะเกินขีดจำกัดของ Slack Block Kit OpenClaw จะย้อนกลับไปใช้ข้อความตอบกลับต้นฉบับแทนการส่งเพย์โหลดบล็อกที่ไม่ถูกต้อง

## การอนุมัติการเรียกใช้งานใน Slack

Slack สามารถทำหน้าที่เป็นไคลเอนต์อนุมัติเนทีฟด้วยปุ่มและการโต้ตอบแบบโต้ตอบ แทนการย้อนกลับไปใช้ Web UI หรือเทอร์มินัล

- การอนุมัติการเรียกใช้งานใช้ `channels.slack.execApprovals.*` สำหรับการกำหนดเส้นทาง DM/แชนแนลแบบเนทีฟ
- การอนุมัติ Plugin ยังสามารถแก้ไขผ่านพื้นผิวปุ่มเนทีฟของ Slack เดียวกันได้เมื่อคำขอมาถึง Slack แล้วและชนิดรหัสการอนุมัติคือ `plugin:`
- การอนุญาตผู้อนุมัติยังคงถูกบังคับใช้: เฉพาะผู้ใช้ที่ระบุว่าเป็นผู้อนุมัติเท่านั้นที่สามารถอนุมัติหรือปฏิเสธคำขอผ่าน Slack ได้

สิ่งนี้ใช้พื้นผิวปุ่มอนุมัติที่ใช้ร่วมกันเดียวกับแชนแนลอื่น เมื่อเปิดใช้ `interactivity` ในการตั้งค่าแอป Slack ของคุณ พรอมป์การอนุมัติจะแสดงเป็นปุ่ม Block Kit โดยตรงในการสนทนา
เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นคือประสบการณ์ผู้ใช้การอนุมัติหลัก OpenClaw
ควรรวมคำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์เครื่องมือระบุว่าการอนุมัติผ่านแชตไม่พร้อมใช้งาน
หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียว

เส้นทางการกำหนดค่า:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; ย้อนกลับไปใช้ `commands.ownerAllowFrom` เมื่อเป็นไปได้)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack จะเปิดใช้การอนุมัติการเรียกใช้งานเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และมีผู้อนุมัติอย่างน้อยหนึ่งรายที่แก้ไขได้ ตั้งค่า `enabled: false` เพื่อปิดใช้ Slack เป็นไคลเอนต์อนุมัติเนทีฟอย่างชัดเจน
ตั้งค่า `enabled: true` เพื่อบังคับเปิดการอนุมัติเนทีฟเมื่อแก้ไขผู้อนุมัติได้

พฤติกรรมเริ่มต้นเมื่อไม่มีการกำหนดค่าการอนุมัติการเรียกใช้งานของ Slack อย่างชัดเจน:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

จำเป็นต้องใช้การกำหนดค่าเนทีฟของ Slack อย่างชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ผู้อนุมัติ เพิ่มตัวกรอง หรือ
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

การส่งต่อ `approvals.exec` ที่ใช้ร่วมกันเป็นคนละส่วนกัน ใช้เฉพาะเมื่อพรอมป์การอนุมัติการเรียกใช้งานต้อง
กำหนดเส้นทางไปยังแชตอื่นหรือเป้าหมายนอกแบนด์ที่ระบุชัดเจนด้วย การส่งต่อ `approvals.plugin` ที่ใช้ร่วมกันก็
เป็นคนละส่วนเช่นกัน ปุ่มเนทีฟของ Slack ยังคงแก้ไขการอนุมัติ Plugin ได้เมื่อคำขอเหล่านั้นมาถึง
Slack แล้ว

`/approve` ในแชตเดียวกันยังใช้งานได้ในแชนแนลและ DM ของ Slack ที่รองรับคำสั่งอยู่แล้ว ดู [การอนุมัติการเรียกใช้งาน](/th/tools/exec-approvals) สำหรับโมเดลการส่งต่อการอนุมัติฉบับเต็ม

## เหตุการณ์และพฤติกรรมการปฏิบัติการ

- การแก้ไข/ลบข้อความถูกแมปเป็นเหตุการณ์ระบบ
- การออกอากาศเธรด (การตอบกลับเธรดแบบ "ส่งไปยังแชนแนลด้วย") ถูกประมวลผลเป็นข้อความผู้ใช้ปกติ
- เหตุการณ์เพิ่ม/ลบรีแอ็กชันถูกแมปเป็นเหตุการณ์ระบบ
- เหตุการณ์สมาชิกเข้าร่วม/ออก แชนแนลถูกสร้าง/เปลี่ยนชื่อ และเพิ่ม/ลบปักหมุดถูกแมปเป็นเหตุการณ์ระบบ
- `channel_id_changed` สามารถย้ายคีย์การกำหนดค่าแชนแนลเมื่อเปิดใช้ `configWrites`
- เมตาดาต้าหัวข้อ/วัตถุประสงค์ของแชนแนลถือเป็นบริบทที่ไม่น่าเชื่อถือและสามารถถูกฉีดเข้าไปในบริบทการกำหนดเส้นทางได้
- ผู้เริ่มเธรดและการเติมบริบทประวัติเธรดเริ่มต้นจะถูกกรองโดยรายการอนุญาตผู้ส่งที่กำหนดค่าไว้เมื่อเกี่ยวข้อง
- การกระทำของบล็อกและการโต้ตอบโมดัลจะส่งเหตุการณ์ระบบ `Slack interaction: ...` แบบมีโครงสร้างพร้อมฟิลด์เพย์โหลดที่ละเอียด:
  - การกระทำของบล็อก: ค่าที่เลือก ป้ายกำกับ ค่าตัวเลือก และเมตาดาต้า `workflow_*`
  - เหตุการณ์โมดัล `view_submission` และ `view_closed` พร้อมเมตาดาต้าแชนแนลที่กำหนดเส้นทางแล้วและอินพุตฟอร์ม

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Slack](/th/gateway/config-channels#slack)

<Accordion title="ฟิลด์ Slack ที่มีสัญญาณสูง">

- โหมด/การยืนยันตัวตน: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (แบบเดิม: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- สวิตช์ความเข้ากันได้: `dangerouslyAllowNameMatching` (ทางเลือกฉุกเฉิน; ปิดไว้เว้นแต่จำเป็น)
- การเข้าถึงแชนแนล: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- เธรด/ประวัติ: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่ง: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- การปฏิบัติการ/ฟีเจอร์: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในแชนแนล">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - รายการอนุญาตแชนแนล (`channels.slack.channels`) — **คีย์ต้องเป็นรหัสแชนแนล** (`C12345678`) ไม่ใช่ชื่อ (`#channel-name`) คีย์ตามชื่อจะล้มเหลวเงียบ ๆ ภายใต้ `groupPolicy: "allowlist"` เพราะการกำหนดเส้นทางแชนแนลอิงรหัสก่อนตามค่าเริ่มต้น วิธีหารหัส: คลิกขวาที่แชนแนลใน Slack → **คัดลอกลิงก์** — ค่า `C...` ที่ท้าย URL คือรหัสแชนแนล
    - `requireMention`
    - รายการอนุญาต `users` รายแชนแนล

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
    - `channels.slack.dmPolicy` (หรือแบบเดิม `channels.slack.dm.policy`)
    - การอนุมัติการจับคู่ / รายการในรายการอนุญาต
    - เหตุการณ์ DM ของ Slack Assistant: บันทึกแบบละเอียดที่กล่าวถึง `drop message_changed`
      มักหมายความว่า Slack ส่งเหตุการณ์เธรด Assistant ที่ถูกแก้ไขโดยไม่มี
      ผู้ส่งที่เป็นมนุษย์ซึ่งกู้คืนได้ในเมตาดาต้าข้อความ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="โหมดซ็อกเก็ตไม่เชื่อมต่อ">
    ตรวจสอบความถูกต้องของโทเค็นบอตและแอป รวมถึงการเปิดใช้โหมดซ็อกเก็ตในการตั้งค่าแอป Slack

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` แสดงว่าบัญชี Slack ถูก
    กำหนดค่าแล้ว แต่รันไทม์ปัจจุบันไม่สามารถแก้ไขค่าที่มี SecretRef รองรับได้

  </Accordion>

  <Accordion title="โหมด HTTP ไม่ได้รับเหตุการณ์">
    ตรวจสอบความถูกต้อง:

    - ความลับสำหรับลงนาม
    - เส้นทาง Webhook
    - URL คำขอของ Slack (เหตุการณ์ + การโต้ตอบ + คำสั่งเครื่องหมายทับ)
    - `webhookPath` ที่ไม่ซ้ำกันต่อบัญชี HTTP

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏในสแนปช็อตบัญชี
    แสดงว่าบัญชี HTTP ถูกกำหนดค่าแล้ว แต่รันไทม์ปัจจุบันไม่สามารถ
    แก้ไขความลับสำหรับลงนามที่มี SecretRef รองรับได้

  </Accordion>

  <Accordion title="คำสั่งเนทีฟ/เครื่องหมายทับไม่ทำงาน">
    ตรวจสอบว่าคุณตั้งใจใช้สิ่งใด:

    - โหมดคำสั่งเนทีฟ (`channels.slack.commands.native: true`) พร้อมคำสั่งเครื่องหมายทับที่ตรงกันซึ่งลงทะเบียนใน Slack
    - หรือโหมดคำสั่งเครื่องหมายทับเดียว (`channels.slack.slashCommand.enabled: true`)

    ตรวจสอบ `commands.useAccessGroups` และรายการอนุญาตแชนแนล/ผู้ใช้ด้วย

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิงการมองเห็นไฟล์แนบ

Slack สามารถแนบสื่อที่ดาวน์โหลดแล้วเข้ากับรอบการทำงานของเอเจนต์เมื่อการดาวน์โหลดไฟล์ Slack สำเร็จและขีดจำกัดขนาดอนุญาต ไฟล์รูปภาพสามารถถูกส่งผ่านเส้นทางการทำความเข้าใจสื่อหรือส่งตรงไปยังโมเดลตอบกลับที่รองรับการมองเห็น ส่วนไฟล์อื่นจะถูกเก็บไว้เป็นบริบทไฟล์ที่ดาวน์โหลดได้ แทนการถือว่าเป็นอินพุตรูปภาพ

### ประเภทสื่อที่รองรับ

| ประเภทสื่อ                     | แหล่งที่มา               | พฤติกรรมปัจจุบัน                                                                  | หมายเหตุ                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| รูปภาพ JPEG / PNG / GIF / WebP | URL ไฟล์ของ Slack       | ดาวน์โหลดและแนบกับเทิร์นสำหรับการจัดการที่รองรับการมองเห็น                   | ขีดจำกัดต่อไฟล์: `channels.slack.mediaMaxMb` (ค่าเริ่มต้น 20 MB)                 |
| ไฟล์ PDF                      | URL ไฟล์ของ Slack       | ดาวน์โหลดและเปิดเผยเป็นบริบทไฟล์สำหรับเครื่องมือ เช่น `download-file` หรือ `pdf` | ขาเข้าของ Slack ไม่แปลง PDF เป็นอินพุตการมองเห็นภาพโดยอัตโนมัติ |
| ไฟล์อื่น ๆ                    | URL ไฟล์ของ Slack       | ดาวน์โหลดเมื่อทำได้และเปิดเผยเป็นบริบทไฟล์                              | ไฟล์ไบนารีจะไม่ถูกจัดเป็นอินพุตรูปภาพ                               |
| การตอบกลับในเธรด                 | ไฟล์ของข้อความเริ่มเธรด | ไฟล์ในข้อความรากสามารถถูกเติมเป็นบริบทได้เมื่อการตอบกลับไม่มีสื่อโดยตรง  | ข้อความเริ่มเธรดที่มีแต่ไฟล์ใช้ตัวแทนไฟล์แนบ                          |
| ข้อความหลายรูปภาพ           | ไฟล์ Slack หลายไฟล์ | ประเมินแต่ละไฟล์แยกกัน                                              | การประมวลผลของ Slack จำกัดไว้ที่แปดไฟล์ต่อข้อความ                     |

### ไปป์ไลน์ขาเข้า

เมื่อข้อความ Slack ที่มีไฟล์แนบมาถึง:

1. OpenClaw ดาวน์โหลดไฟล์จาก URL ส่วนตัวของ Slack โดยใช้โทเค็นบอต (`xoxb-...`)
2. ไฟล์จะถูกเขียนไปยังที่เก็บสื่อเมื่อสำเร็จ
3. พาธสื่อที่ดาวน์โหลดและชนิดเนื้อหาจะถูกเพิ่มไปยังบริบทขาเข้า
4. พาธของโมเดล/เครื่องมือที่รองรับรูปภาพสามารถใช้ไฟล์แนบรูปภาพจากบริบทนั้นได้
5. ไฟล์ที่ไม่ใช่รูปภาพยังคงพร้อมใช้งานเป็นเมทาดาทาไฟล์หรือการอ้างอิงสื่อสำหรับเครื่องมือที่จัดการไฟล์เหล่านั้นได้

### การสืบทอดไฟล์แนบจากรากเธรด

เมื่อข้อความมาถึงในเธรด (มีพาเรนต์ `thread_ts`):

- หากการตอบกลับเองไม่มีสื่อโดยตรงและข้อความรากที่รวมมาด้วยมีไฟล์ Slack สามารถเติมไฟล์รากเป็นบริบทเริ่มเธรดได้
- ไฟล์แนบของการตอบกลับโดยตรงมีลำดับความสำคัญเหนือไฟล์แนบของข้อความราก
- ข้อความรากที่มีเฉพาะไฟล์และไม่มีข้อความจะแสดงด้วยตัวแทนไฟล์แนบ เพื่อให้กลไกสำรองยังรวมไฟล์ของข้อความนั้นได้

### การจัดการไฟล์แนบหลายรายการ

เมื่อข้อความ Slack เดียวมีไฟล์แนบหลายรายการ:

- ไฟล์แนบแต่ละรายการถูกประมวลผลแยกกันผ่านไปป์ไลน์สื่อ
- การอ้างอิงสื่อที่ดาวน์โหลดจะถูกรวมเข้าในบริบทข้อความ
- ลำดับการประมวลผลเป็นไปตามลำดับไฟล์ของ Slack ในเพย์โหลดเหตุการณ์
- ความล้มเหลวในการดาวน์โหลดไฟล์แนบหนึ่งรายการจะไม่ขัดขวางรายการอื่น

### ขนาด การดาวน์โหลด และขีดจำกัดของโมเดล

- **ขีดจำกัดขนาด**: ค่าเริ่มต้น 20 MB ต่อไฟล์ กำหนดค่าได้ผ่าน `channels.slack.mediaMaxMb`
- **ความล้มเหลวในการดาวน์โหลด**: ไฟล์ที่ Slack ไม่สามารถให้บริการได้, URL หมดอายุ, ไฟล์ที่เข้าถึงไม่ได้, ไฟล์เกินขนาด และการตอบกลับ HTML สำหรับการยืนยันตัวตน/เข้าสู่ระบบของ Slack จะถูกข้ามแทนที่จะถูกรายงานว่าเป็นรูปแบบที่ไม่รองรับ
- **โมเดลการมองเห็น**: การวิเคราะห์รูปภาพใช้โมเดลตอบกลับที่ใช้งานอยู่เมื่อรองรับการมองเห็น หรือใช้โมเดลรูปภาพที่กำหนดไว้ที่ `agents.defaults.imageModel`

### ขีดจำกัดที่ทราบ

| สถานการณ์                               | พฤติกรรมปัจจุบัน                                                             | วิธีแก้ไข                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL ไฟล์ Slack หมดอายุ                 | ข้ามไฟล์ ไม่มีข้อผิดพลาดแสดง                                                 | อัปโหลดไฟล์ซ้ำใน Slack                                                |
| ไม่ได้กำหนดค่าโมเดลการมองเห็น            | ไฟล์แนบรูปภาพถูกจัดเก็บเป็นการอ้างอิงสื่อ แต่ไม่ถูกวิเคราะห์เป็นรูปภาพ | กำหนดค่า `agents.defaults.imageModel` หรือใช้โมเดลตอบกลับที่รองรับการมองเห็น |
| รูปภาพขนาดใหญ่มาก (> 20 MB ตามค่าเริ่มต้น) | ข้ามตามขีดจำกัดขนาด                                                         | เพิ่ม `channels.slack.mediaMaxMb` หาก Slack อนุญาต                       |
| ไฟล์แนบที่ส่งต่อ/แชร์           | ข้อความและสื่อรูปภาพ/ไฟล์ที่โฮสต์บน Slack เป็นแบบพยายามให้ดีที่สุด                       | แชร์ซ้ำโดยตรงในเธรด OpenClaw                                   |
| ไฟล์แนบ PDF                        | จัดเก็บเป็นบริบทไฟล์/สื่อ ไม่ได้ถูกส่งผ่านการมองเห็นภาพโดยอัตโนมัติ  | ใช้ `download-file` สำหรับเมทาดาทาไฟล์ หรือเครื่องมือ `pdf` สำหรับการวิเคราะห์ PDF   |

### เอกสารที่เกี่ยวข้อง

- [ไปป์ไลน์การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
- [เครื่องมือ PDF](/th/tools/pdf)
- อีพิก: [#51349](https://github.com/openclaw/openclaw/issues/51349) — การเปิดใช้งานการมองเห็นสำหรับไฟล์แนบ Slack
- การทดสอบการถดถอย: [#51353](https://github.com/openclaw/openclaw/issues/51353)
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
    โครงสร้างคอนฟิกและลำดับความสำคัญ
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    แค็ตตาล็อกคำสั่งและพฤติกรรม
  </Card>
</CardGroup>
