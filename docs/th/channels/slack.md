---
read_when:
    - การตั้งค่า Slack หรือการแก้ไขปัญหาโหมดซ็อกเก็ต/HTTP ของ Slack
summary: การตั้งค่า Slack และพฤติกรรมขณะทำงาน (โหมด Socket + URL สำหรับคำขอ HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-03T21:27:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: d902fbbad23cee9b3f0ab7d240845b7b229e2d2507c5ea1d1a0fa3baa915d80a
    source_path: channels/slack.md
    workflow: 16
---

พร้อมใช้งานจริงสำหรับ DM และช่องทางต่างๆ ผ่านการผสานรวมแอป Slack โหมดเริ่มต้นคือ Socket Mode; รองรับ HTTP Request URLs ด้วย

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    Slack DM ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและเพลย์บุ๊กการซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="Socket Mode (ค่าเริ่มต้น)">
    <Steps>
      <Step title="สร้างแอป Slack ใหม่">
        ในการตั้งค่าแอป Slack ให้กดปุ่ม **[Create New App](https://api.slack.com/apps/new)**:

        - เลือก **from a manifest** และเลือก workspace สำหรับแอปของคุณ
        - วาง [manifest ตัวอย่าง](#manifest-and-scope-checklist) จากด้านล่าง แล้วดำเนินการสร้างต่อ
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

        Env fallback (บัญชีเริ่มต้นเท่านั้น):

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

        - เลือก **from a manifest** และเลือก workspace สำหรับแอปของคุณ
        - วาง [manifest ตัวอย่าง](#manifest-and-scope-checklist) และอัปเดต URL ก่อนสร้าง
        - บันทึก **Signing Secret** สำหรับการยืนยันคำขอ
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

## การปรับแต่งการขนส่งของ Socket Mode

OpenClaw ตั้งค่าเวลารอ pong ของไคลเอนต์ Slack SDK เป็น 15 วินาทีตามค่าเริ่มต้นสำหรับ Socket Mode ให้ override การตั้งค่าการขนส่งเฉพาะเมื่อคุณต้องปรับแต่งตาม workspace หรือ host เท่านั้น:

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

ใช้สิ่งนี้เฉพาะกับ workspace ของ Socket Mode ที่บันทึก timeout ของ Slack websocket pong/server-ping หรือรันบน host ที่ทราบว่ามี event-loop starvation `clientPingTimeout` คือเวลารอ pong หลังจาก SDK ส่ง client ping; `serverPingTimeout` คือเวลารอ ping จากเซิร์ฟเวอร์ Slack ข้อความและเหตุการณ์ของแอปยังคงเป็นสถานะแอปพลิเคชัน ไม่ใช่สัญญาณความมีชีวิตของการขนส่ง

## เช็กลิสต์ manifest และ scope

manifest พื้นฐานของแอป Slack เหมือนกันสำหรับ Socket Mode และ HTTP Request URLs ต่างกันเฉพาะบล็อก `settings` (และ `url` ของคำสั่ง slash)

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

สำหรับ **โหมด HTTP Request URLs** ให้แทนที่ `settings` ด้วยตัวแปร HTTP และเพิ่ม `url` ให้แต่ละคำสั่ง slash ต้องมี URL สาธารณะ:

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

แสดงฟีเจอร์ต่างๆ ที่ขยายจากค่าเริ่มต้นด้านบน

manifest เริ่มต้นเปิดใช้แท็บ **Home** ของ Slack App Home และสมัครรับ `app_home_opened` เมื่อสมาชิก workspace เปิดแท็บ Home OpenClaw จะเผยแพร่มุมมอง Home เริ่มต้นที่ปลอดภัยด้วย `views.publish`; ไม่มีการรวม payload การสนทนาหรือการกำหนดค่าส่วนตัว แท็บ **Messages** ยังคงเปิดใช้สำหรับ Slack DM

<AccordionGroup>
  <Accordion title="คำสั่ง slash แบบเนทีฟที่เลือกได้">

    สามารถใช้ [คำสั่ง slash แบบเนทีฟ](#commands-and-slash-behavior) หลายคำสั่งแทนคำสั่งเดียวที่กำหนดค่าพร้อมรายละเอียดปลีกย่อยได้:

    - ใช้ `/agentstatus` แทน `/status` เพราะคำสั่ง `/status` ถูกสงวนไว้
    - เปิดใช้คำสั่ง slash ได้พร้อมกันไม่เกิน 25 คำสั่ง

    แทนที่ส่วน `features.slash_commands` ที่มีอยู่ด้วย subset ของ [คำสั่งที่พร้อมใช้งาน](/th/tools/slash-commands#command-list):

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
```

      </Tab>
      <Tab title="HTTP Request URLs">
        ใช้รายการ `slash_commands` เดียวกับ Socket Mode ด้านบน และเพิ่ม `"url": "https://gateway-host.example.com/slack/events"` ให้ทุกรายการ ตัวอย่าง:

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
  <Accordion title="ขอบเขต authorship เพิ่มเติม (การดำเนินการเขียน)">
    เพิ่มขอบเขตบอต `chat:write.customize` หากต้องการให้ข้อความขาออกใช้ตัวตนของเอเจนต์ที่ใช้งานอยู่ (ชื่อผู้ใช้และไอคอนที่กำหนดเอง) แทนตัวตนเริ่มต้นของแอป Slack

    หากคุณใช้ไอคอนอีโมจิ Slack ต้องการไวยากรณ์ `:emoji_name:`

  </Accordion>
  <Accordion title="ขอบเขต user-token เพิ่มเติม (การดำเนินการอ่าน)">
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
- โหมด HTTP ต้องมี `botToken` + `signingSecret`
- `botToken`, `appToken`, `signingSecret` และ `userToken` รองรับสตริงแบบข้อความล้วน
  หรืออ็อบเจกต์ SecretRef
- โทเค็นใน Config จะแทนที่ env fallback
- env fallback ของ `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
- `userToken` (`xoxp-...`) กำหนดค่าได้เฉพาะใน Config (ไม่มี env fallback) และมีค่าเริ่มต้นเป็นพฤติกรรมอ่านอย่างเดียว (`userTokenReadOnly: true`)

พฤติกรรมสแนปช็อตสถานะ:

- การตรวจสอบบัญชี Slack ติดตามฟิลด์ `*Source` และ `*Status`
  ตามข้อมูลประจำตัว (`botToken`, `appToken`, `signingSecret`, `userToken`)
- สถานะคือ `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าผ่าน SecretRef
  หรือแหล่งความลับอื่นที่ไม่ใช่แบบ inline แต่พาธคำสั่ง/รันไทม์ปัจจุบัน
  ไม่สามารถแก้ค่าแท้จริงได้
- ในโหมด HTTP จะรวม `signingSecretStatus`; ใน Socket Mode
  คู่ที่ต้องมีคือ `botTokenStatus` + `appTokenStatus`

<Tip>
สำหรับการดำเนินการ/การอ่านไดเรกทอรี สามารถให้ความสำคัญกับโทเค็นผู้ใช้เมื่อกำหนดค่าไว้ได้ สำหรับการเขียน โทเค็นบอตยังคงเป็นตัวเลือกหลัก; การเขียนด้วยโทเค็นผู้ใช้อนุญาตเฉพาะเมื่อ `userTokenReadOnly: false` และโทเค็นบอตไม่พร้อมใช้งาน
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

การดำเนินการข้อความ Slack ปัจจุบันรวมถึง `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list` `download-file` รองรับ ID ไฟล์ Slack ที่แสดงใน placeholder ไฟล์ขาเข้า และส่งคืนตัวอย่างรูปภาพสำหรับรูปภาพ หรือเมทาดาทาไฟล์ local สำหรับไฟล์ประเภทอื่น

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM `channels.slack.allowFrom` คือรายการอนุญาต DM มาตรฐาน

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.slack.allowFrom` มี `"*"`)
    - `disabled`

    แฟล็ก DM:

    - `dm.enabled` (ค่าเริ่มต้น true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (เดิม)
    - `dm.groupEnabled` (DM แบบกลุ่มมีค่าเริ่มต้น false)
    - `dm.groupChannels` (รายการอนุญาต MPIM แบบไม่บังคับ)

    ลำดับความสำคัญแบบหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่มีชื่อจะสืบทอด `channels.slack.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตัวเอง
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.slack.accounts.default.allowFrom`

    `channels.slack.dm.policy` และ `channels.slack.dm.allowFrom` แบบเดิมยังคงอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    การจับคู่ใน DM ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="นโยบายช่อง">
    `channels.slack.groupPolicy` ควบคุมการจัดการช่อง:

    - `open`
    - `allowlist`
    - `disabled`

    รายการอนุญาตของช่องอยู่ภายใต้ `channels.slack.channels` และ **ต้องใช้ ID ช่อง Slack ที่เสถียร** (เช่น `C12345678`) เป็นคีย์ Config

    หมายเหตุรันไทม์: หากไม่มี `channels.slack` เลย (การตั้งค่าแบบ env-only) รันไทม์จะ fallback ไปที่ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

    การแก้ชื่อ/ID:

    - รายการในรายการอนุญาตของช่องและรายการอนุญาตของ DM จะถูกแก้เมื่อเริ่มทำงานเมื่อการเข้าถึงโทเค็นอนุญาต
    - รายการชื่อช่องที่แก้ไม่ได้จะคงไว้ตามที่กำหนดค่า แต่จะถูกละเว้นในการกำหนดเส้นทางตามค่าเริ่มต้น
    - การอนุญาตขาเข้าและการกำหนดเส้นทางช่องใช้ ID เป็นหลักตามค่าเริ่มต้น; การจับคู่ชื่อผู้ใช้/slug โดยตรงต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    คีย์ตามชื่อ (`#channel-name` หรือ `channel-name`) จะ **ไม่** ตรงกันภายใต้ `groupPolicy: "allowlist"` การค้นหาช่องใช้ ID เป็นหลักตามค่าเริ่มต้น ดังนั้นคีย์ตามชื่อจะไม่มีวันกำหนดเส้นทางสำเร็จ และข้อความทั้งหมดในช่องนั้นจะถูกบล็อกอย่างเงียบๆ ซึ่งต่างจาก `groupPolicy: "open"` ที่ไม่ต้องใช้คีย์ช่องสำหรับการกำหนดเส้นทาง และคีย์ตามชื่อดูเหมือนจะใช้งานได้

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

  <Tab title="การกล่าวถึงและผู้ใช้ช่อง">
    ข้อความช่องต้องผ่านเกตการกล่าวถึงตามค่าเริ่มต้น

    แหล่งที่มาของการกล่าวถึง:

    - การกล่าวถึงแอปอย่างชัดเจน (`<@botId>`)
    - การกล่าวถึงกลุ่มผู้ใช้ Slack (`<!subteam^S...>`) เมื่อผู้ใช้บอตเป็นสมาชิกของกลุ่มผู้ใช้นั้น; ต้องมี `usergroups:read`
    - รูปแบบ regex สำหรับการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรมเธรดตอบกลับบอตโดยนัย (ปิดใช้งานเมื่อ `thread.requireExplicitMention` เป็น `true`)

    การควบคุมต่อช่อง (`channels.slack.channels.<id>`; ชื่อใช้ได้เฉพาะผ่านการแก้ตอนเริ่มทำงานหรือ `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (รายการอนุญาต)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ `toolsBySender`: `id:`, `e164:`, `username:`, `name:` หรือไวลด์การ์ด `"*"`
      (คีย์เดิมที่ไม่มีคำนำหน้ายังคงแมปเป็น `id:` เท่านั้น)

    `allowBots` เป็นแบบอนุรักษ์นิยมสำหรับช่องและช่องส่วนตัว: ข้อความในห้องที่เขียนโดยบอตจะถูกรับเฉพาะเมื่อบอตผู้ส่งถูกระบุไว้อย่างชัดเจนในรายการอนุญาต `users` ของห้องนั้น หรือเมื่อมี ID เจ้าของ Slack ที่ชัดเจนอย่างน้อยหนึ่งรายการจาก `channels.slack.allowFrom` เป็นสมาชิกห้องอยู่ในขณะนั้น ไวลด์การ์ดและรายการเจ้าของแบบชื่อที่แสดงไม่ถือว่ามีเจ้าของอยู่ การตรวจสอบการมีอยู่ของเจ้าของใช้ Slack `conversations.members`; ตรวจให้แน่ใจว่าแอปมีขอบเขตการอ่านที่ตรงกับประเภทห้อง (`channels:read` สำหรับช่องสาธารณะ, `groups:read` สำหรับช่องส่วนตัว) หากการค้นหาสมาชิกล้มเหลว OpenClaw จะทิ้งข้อความในห้องที่เขียนโดยบอต

  </Tab>
</Tabs>

## เธรด เซสชัน และแท็กตอบกลับ

- DM กำหนดเส้นทางเป็น `direct`; ช่องเป็น `channel`; MPIM เป็น `group`
- การผูกเส้นทาง Slack รองรับ ID ของเพียร์แบบดิบ รวมถึงรูปแบบเป้าหมาย Slack เช่น `channel:C12345678`, `user:U12345678` และ `<@U12345678>`
- ด้วยค่าเริ่มต้น `session.dmScope=main` DM ของ Slack จะยุบรวมไปยังเซสชันหลักของเอเจนต์
- เซสชันช่อง: `agent:<agentId>:slack:channel:<channelId>`
- การตอบกลับในเธรดสามารถสร้างส่วนต่อท้ายเซสชันเธรด (`:thread:<threadTs>`) เมื่อใช้ได้
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความเธรดที่มีอยู่ซึ่งจะถูกดึงเมื่อเริ่มเซสชันเธรดใหม่ (ค่าเริ่มต้น `20`; ตั้งเป็น `0` เพื่อปิดใช้งาน)
- `channels.slack.thread.requireExplicitMention` (ค่าเริ่มต้น `false`): เมื่อเป็น `true` จะระงับการกล่าวถึงในเธรดโดยนัย เพื่อให้บอตตอบเฉพาะการกล่าวถึง `@bot` อย่างชัดเจนภายในเธรด แม้บอตจะเคยมีส่วนร่วมในเธรดแล้วก็ตาม หากไม่มีสิ่งนี้ การตอบกลับในเธรดที่บอตเคยมีส่วนร่วมจะข้ามเกต `requireMention`

การควบคุมเธรดตอบกลับ:

- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: ต่อ `direct|group|channel`
- fallback เดิมสำหรับแชทโดยตรง: `channels.slack.dm.replyToMode`

รองรับแท็กตอบกลับแบบกำหนดเอง:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` ปิดใช้งานเธรดตอบกลับ **ทั้งหมด** ใน Slack รวมถึงแท็ก `[[reply_to_*]]` ที่ชัดเจน ซึ่งต่างจาก Telegram ที่แท็กชัดเจนยังคงได้รับการใช้ในโหมด `"off"` เธรดของ Slack จะซ่อนข้อความจากช่อง ในขณะที่การตอบกลับของ Telegram ยังคงมองเห็นแบบ inline
</Note>

## รีแอ็กชันรับทราบ

`ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

ลำดับการแก้ค่า:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback อีโมจิตัวตนของเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้น "👀")

หมายเหตุ:

- Slack ต้องการ shortcode (เช่น `"eyes"`)
- ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับบัญชี Slack หรือทั่วทั้งระบบ

## การสตรีมข้อความ

`channels.slack.streaming` ควบคุมพฤติกรรมตัวอย่างสด:

- `off`: ปิดใช้งานการสตรีมตัวอย่างสด
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความตัวอย่างด้วยเอาต์พุตบางส่วนล่าสุด
- `block`: ต่อท้ายการอัปเดตตัวอย่างแบบแบ่งชิ้น
- `progress`: แสดงข้อความสถานะความคืบหน้าขณะสร้าง แล้วส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อตัวอย่างแบบร่างทำงานอยู่ ให้กำหนดเส้นทางการอัปเดตเครื่องมือ/ความคืบหน้าไปยังข้อความตัวอย่างที่แก้ไขเดียวกัน (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อเก็บข้อความเครื่องมือ/ความคืบหน้าแยกกัน

`channels.slack.streaming.nativeTransport` ควบคุมการสตรีมข้อความเนทีฟของ Slack เมื่อ `channels.slack.streaming.mode` เป็น `partial` (ค่าเริ่มต้น: `true`)

- ต้องมีเธรดตอบกลับเพื่อให้การสตรีมข้อความเนทีฟและสถานะเธรดผู้ช่วยของ Slack ปรากฏ การเลือกเธรดยังคงเป็นไปตาม `replyToMode`
- รูทของช่อง แชทกลุ่ม และ DM ระดับบนสุดยังคงใช้ตัวอย่างแบบร่างปกติได้เมื่อการสตรีมเนทีฟไม่พร้อมใช้งานหรือไม่มีเธรดตอบกลับ
- DM ระดับบนสุดของ Slack อยู่นอกเธรดตามค่าเริ่มต้น จึงไม่แสดงตัวอย่างสตรีม/สถานะแบบเธรดเนทีฟของ Slack; OpenClaw จะโพสต์และแก้ไขตัวอย่างแบบร่างใน DM แทน
- เพย์โหลดสื่อและที่ไม่ใช่ข้อความ fallback ไปยังการส่งตามปกติ
- ผลลัพธ์สุดท้ายของสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่; ผลลัพธ์สุดท้ายของข้อความ/บล็อกที่เข้าเกณฑ์จะ flush เฉพาะเมื่อแก้ไขตัวอย่างในที่เดิมได้
- หากการสตรีมล้มเหลวระหว่างตอบกลับ OpenClaw จะ fallback ไปยังการส่งตามปกติสำหรับเพย์โหลดที่เหลือ

ใช้ตัวอย่างแบบร่างแทนการสตรีมข้อความเนทีฟของ Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) จะถูกย้ายอัตโนมัติไปยัง `channels.slack.streaming.mode`
- บูลีน `channels.slack.streaming` จะถูกย้ายอัตโนมัติไปยัง `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport`
- `channels.slack.nativeStreaming` เดิมจะถูกย้ายอัตโนมัติไปยัง `channels.slack.streaming.nativeTransport`

## fallback รีแอ็กชันการพิมพ์

`typingReaction` เพิ่มรีแอ็กชันชั่วคราวไปยังข้อความ Slack ขาเข้าขณะที่ OpenClaw กำลังประมวลผลการตอบกลับ แล้วลบออกเมื่อการรันเสร็จสิ้น สิ่งนี้มีประโยชน์ที่สุดนอกการตอบกลับในเธรด ซึ่งใช้ตัวบ่งชี้สถานะ "กำลังพิมพ์..." เริ่มต้น

ลำดับการแก้ค่า:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack คาดหวัง shortcodes (ตัวอย่างเช่น `"hourglass_flowing_sand"`)
- reaction เป็นแบบพยายามให้ดีที่สุด และจะพยายามล้างข้อมูลโดยอัตโนมัติหลังจาก reply หรือเส้นทางความล้มเหลวเสร็จสิ้น

## สื่อ การแบ่งชิ้น และการส่งมอบ

<AccordionGroup>
  <Accordion title="Inbound attachments">
    ไฟล์แนบของ Slack จะถูกดาวน์โหลดจาก URL ส่วนตัวที่โฮสต์โดย Slack (โฟลว์คำขอที่ยืนยันตัวตนด้วยโทเค็น) และเขียนไปยัง media store เมื่อ fetch สำเร็จและขีดจำกัดขนาดอนุญาต placeholder ของไฟล์มี Slack `fileId` เพื่อให้เอเจนต์สามารถ fetch ไฟล์ต้นฉบับด้วย `download-file`

    การดาวน์โหลดใช้ timeout สำหรับ idle และเวลารวมแบบมีขอบเขต หากการดึงไฟล์ Slack ค้างหรือล้มเหลว OpenClaw จะประมวลผลข้อความต่อไปและ fallback ไปที่ placeholder ของไฟล์

    ขีดจำกัดขนาด inbound ขณะ runtime มีค่าเริ่มต้นเป็น `20MB` เว้นแต่จะ override ด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="Outbound text and files">
    - ชิ้นข้อความใช้ `channels.slack.textChunkLimit` (ค่าเริ่มต้น 4000)
    - `channels.slack.chunkMode="newline"` เปิดใช้การแบ่งโดยให้ย่อหน้ามาก่อน
    - การส่งไฟล์ใช้ Slack upload APIs และสามารถรวม thread replies (`thread_ts`)
    - ขีดจำกัดสื่อ outbound ใช้ `channels.slack.mediaMaxMb` เมื่อกำหนดค่าไว้ มิฉะนั้นการส่งผ่าน channel จะใช้ค่าเริ่มต้นตามชนิด MIME จาก media pipeline

  </Accordion>

  <Accordion title="Delivery targets">
    เป้าหมายแบบ explicit ที่แนะนำ:

    - `user:<id>` สำหรับ DM
    - `channel:<id>` สำหรับ channels

    Slack DM ที่เป็นข้อความ/บล็อกเท่านั้นสามารถโพสต์ไปยัง user IDs ได้โดยตรง ส่วนการอัปโหลดไฟล์และการส่งแบบ threaded จะเปิด DM ผ่าน Slack conversation APIs ก่อน เพราะเส้นทางเหล่านั้นต้องใช้ conversation ID ที่เป็นรูปธรรม

  </Accordion>
</AccordionGroup>

## คำสั่งและพฤติกรรม slash

Slash commands ปรากฏใน Slack เป็นได้ทั้งคำสั่งที่กำหนดค่าไว้คำสั่งเดียวหรือ native commands หลายรายการ กำหนดค่า `channels.slack.slashCommand` เพื่อเปลี่ยนค่าเริ่มต้นของคำสั่ง:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Native commands ต้องใช้ [การตั้งค่า manifest เพิ่มเติม](#additional-manifest-settings) ในแอป Slack ของคุณ และเปิดใช้ด้วย `channels.slack.commands.native: true` หรือ `commands.native: true` ในการกำหนดค่าทั่วโลกแทน

- auto-mode ของ native command ปิดอยู่สำหรับ Slack ดังนั้น `commands.native: "auto"` จึงไม่เปิดใช้ Slack native commands

```txt
/help
```

เมนูอาร์กิวเมนต์แบบ native ใช้กลยุทธ์การ render แบบปรับตามสถานการณ์ ซึ่งจะแสดง modal ยืนยันก่อน dispatch ค่าตัวเลือกที่เลือก:

- สูงสุด 5 ตัวเลือก: button blocks
- 6-100 ตัวเลือก: static select menu
- มากกว่า 100 ตัวเลือก: external select พร้อมการกรองตัวเลือกแบบ async เมื่อมี interactivity options handlers
- เกินขีดจำกัดของ Slack: ค่าตัวเลือกที่เข้ารหัสจะ fallback เป็น buttons

```txt
/think
```

Slash sessions ใช้ key แบบแยก เช่น `agent:<agentId>:slack:slash:<userId>` และยัง route การเรียกใช้คำสั่งไปยัง session ของบทสนทนาเป้าหมายโดยใช้ `CommandTargetSessionKey`

## Replies แบบโต้ตอบ

Slack สามารถ render ตัวควบคุม reply แบบโต้ตอบที่เอเจนต์เขียนได้ แต่ฟีเจอร์นี้ปิดไว้โดยค่าเริ่มต้น

เปิดใช้ทั่วโลก:

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

เมื่อเปิดใช้ เอเจนต์สามารถ emit directives สำหรับ reply ที่ใช้เฉพาะ Slack ได้:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

directives เหล่านี้จะ compile เป็น Slack Block Kit และ route การคลิกหรือการเลือกกลับผ่านเส้นทาง event ของ Slack interaction ที่มีอยู่

หมายเหตุ:

- นี่คือ UI เฉพาะ Slack channel อื่นจะไม่แปล Slack Block Kit directives เป็นระบบปุ่มของตนเอง
- ค่า callback แบบโต้ตอบเป็น opaque tokens ที่ OpenClaw สร้าง ไม่ใช่ค่าดิบที่เอเจนต์เขียน
- หาก interactive blocks ที่สร้างขึ้นจะเกินขีดจำกัด Slack Block Kit OpenClaw จะ fallback เป็นข้อความ reply ต้นฉบับแทนการส่ง blocks payload ที่ไม่ถูกต้อง

## การอนุมัติ exec ใน Slack

Slack สามารถทำหน้าที่เป็น approval client แบบ native พร้อมปุ่มและ interactions แบบโต้ตอบ แทนการ fallback ไปที่ Web UI หรือ terminal

- การอนุมัติ exec ใช้ `channels.slack.execApprovals.*` สำหรับ routing ของ DM/channel แบบ native
- การอนุมัติ Plugin ยังสามารถ resolve ผ่านพื้นผิวปุ่ม Slack-native เดียวกันได้ เมื่อคำขอนั้นมาถึง Slack อยู่แล้วและชนิด approval id เป็น `plugin:`
- การ authorize ผู้อนุมัติยังถูกบังคับใช้: เฉพาะผู้ใช้ที่ระบุว่าเป็นผู้อนุมัติเท่านั้นที่สามารถอนุมัติหรือปฏิเสธคำขอผ่าน Slack ได้

ส่วนนี้ใช้พื้นผิวปุ่ม approval แบบ shared เดียวกับ channel อื่น เมื่อเปิดใช้ `interactivity` ในการตั้งค่าแอป Slack ของคุณ prompt การอนุมัติจะ render เป็นปุ่ม Block Kit โดยตรงในบทสนทนา
เมื่อปุ่มเหล่านั้นมีอยู่ ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก OpenClaw
ควรรวมคำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของ tool ระบุว่า chat
approvals ใช้ไม่ได้หรือการอนุมัติแบบ manual เป็นเส้นทางเดียวเท่านั้น

พาธ config:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; fallback เป็น `commands.ownerAllowFrom` เมื่อเป็นไปได้)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack จะเปิดใช้ native exec approvals โดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และมี
ผู้อนุมัติอย่างน้อยหนึ่งราย resolve ได้ ตั้งค่า `enabled: false` เพื่อปิดใช้ Slack เป็น native approval client อย่าง explicit
ตั้งค่า `enabled: true` เพื่อบังคับเปิด native approvals เมื่อผู้อนุมัติ resolve ได้

พฤติกรรมเริ่มต้นเมื่อไม่มี config การอนุมัติ exec ของ Slack แบบ explicit:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

จำเป็นต้องใช้ config แบบ Slack-native อย่าง explicit เฉพาะเมื่อคุณต้องการ override ผู้อนุมัติ เพิ่ม filters หรือ
เลือกใช้การส่งมอบผ่าน origin-chat:

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

การ forwarding ของ `approvals.exec` แบบ shared แยกต่างหาก ใช้เฉพาะเมื่อ prompt การอนุมัติ exec ต้อง
route ไปยัง chat อื่นหรือเป้าหมายนอกช่องทางที่ explicit ด้วย การ forwarding ของ `approvals.plugin` แบบ shared ก็
แยกต่างหากเช่นกัน ปุ่ม Slack-native ยังสามารถ resolve การอนุมัติ Plugin ได้เมื่อคำขอเหล่านั้นมาถึง
Slack อยู่แล้ว

Same-chat `/approve` ยังทำงานใน Slack channels และ DM ที่รองรับคำสั่งอยู่แล้ว ดู [การอนุมัติ exec](/th/tools/exec-approvals) สำหรับโมเดลการ forwarding approval ฉบับเต็ม

## Events และพฤติกรรมด้านปฏิบัติการ

- การแก้ไข/ลบข้อความถูก map เป็น system events
- Thread broadcasts (thread replies แบบ "Also send to channel") ถูกประมวลผลเป็นข้อความผู้ใช้ปกติ
- Events การเพิ่ม/ลบ reaction ถูก map เป็น system events
- Events สมาชิกเข้าร่วม/ออก, สร้าง/เปลี่ยนชื่อ channel และเพิ่ม/ลบ pin ถูก map เป็น system events
- `channel_id_changed` สามารถ migrate channel config keys ได้เมื่อเปิดใช้ `configWrites`
- metadata ของ channel topic/purpose ถูกถือเป็น context ที่ไม่น่าเชื่อถือและสามารถ inject เข้าไปใน routing context ได้
- การ seed context ของ thread starter และ initial thread-history จะถูกกรองตาม sender allowlists ที่กำหนดค่าไว้เมื่อใช้ได้
- Block actions และ modal interactions emit system events แบบมีโครงสร้าง `Slack interaction: ...` พร้อมฟิลด์ payload ที่ละเอียด:
  - block actions: selected values, labels, picker values และ metadata `workflow_*`
  - events ของ modal `view_submission` และ `view_closed` พร้อม routed channel metadata และ form inputs

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Slack](/th/gateway/config-channels#slack)

<Accordion title="High-signal Slack fields">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- compatibility toggle: `dangerouslyAllowNameMatching` (break-glass; ปิดไว้เว้นแต่จำเป็น)
- การเข้าถึง channel: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/history: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- ops/features: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="No replies in channels">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - channel allowlist (`channels.slack.channels`) — **keys ต้องเป็น channel IDs** (`C12345678`) ไม่ใช่ชื่อ (`#channel-name`) keys ที่อิงชื่อล้มเหลวแบบเงียบภายใต้ `groupPolicy: "allowlist"` เพราะ channel routing เป็นแบบ ID-first โดยค่าเริ่มต้น วิธีหา ID: คลิกขวาที่ channel ใน Slack → **Copy link** — ค่า `C...` ที่ท้าย URL คือ channel ID
    - `requireMention`
    - allowlist `users` ต่อ channel

    คำสั่งที่เป็นประโยชน์:

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
    - รายการ pairing approvals / allowlist
    - Slack Assistant DM events: logs แบบ verbose ที่กล่าวถึง `drop message_changed`
      มักหมายความว่า Slack ส่ง event ของ Assistant-thread ที่ถูกแก้ไขโดยไม่มี
      human sender ที่กู้คืนได้ใน metadata ของข้อความ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    ตรวจสอบความถูกต้องของ bot + app tokens และการเปิดใช้ Socket Mode ในการตั้งค่าแอป Slack

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` หมายความว่าบัญชี Slack
    ได้รับการกำหนดค่าแล้ว แต่ runtime ปัจจุบันไม่สามารถ resolve ค่า
    ที่อิง SecretRef ได้

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    ตรวจสอบความถูกต้องของ:

    - signing secret
    - webhook path
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - `webhookPath` ที่ไม่ซ้ำกันต่อบัญชี HTTP

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏใน account
    snapshots หมายความว่าบัญชี HTTP ได้รับการกำหนดค่าแล้ว แต่ runtime ปัจจุบันไม่สามารถ
    resolve signing secret ที่อิง SecretRef ได้

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    ตรวจสอบว่าคุณตั้งใจใช้แบบใด:

    - native command mode (`channels.slack.commands.native: true`) พร้อม slash commands ที่ตรงกันซึ่งลงทะเบียนไว้ใน Slack
    - หรือ single slash command mode (`channels.slack.slashCommand.enabled: true`)

    ตรวจสอบ `commands.useAccessGroups` และ channel/user allowlists ด้วย

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิง attachment vision

Slack สามารถแนบสื่อที่ดาวน์โหลดแล้วเข้ากับ turn ของเอเจนต์เมื่อการดาวน์โหลดไฟล์ Slack สำเร็จและขีดจำกัดขนาดอนุญาต ไฟล์รูปภาพสามารถส่งผ่านเส้นทาง media understanding หรือส่งตรงไปยัง reply model ที่รองรับ vision ได้ ไฟล์อื่นจะถูกเก็บไว้เป็น context ของไฟล์ที่ดาวน์โหลดได้ แทนที่จะถูกถือเป็น image input

### ประเภทสื่อที่รองรับ

| ประเภทสื่อ                     | แหล่งที่มา               | ลักษณะการทำงานปัจจุบัน                                                                  | หมายเหตุ                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| รูปภาพ JPEG / PNG / GIF / WebP | URL ไฟล์ Slack       | ดาวน์โหลดและแนบเข้ากับรอบการสนทนาเพื่อการจัดการที่รองรับการมองเห็น                   | ขีดจำกัดต่อไฟล์: `channels.slack.mediaMaxMb` (ค่าเริ่มต้น 20 MB)                 |
| ไฟล์ PDF                      | URL ไฟล์ Slack       | ดาวน์โหลดและเปิดเผยเป็นบริบทไฟล์สำหรับเครื่องมือ เช่น `download-file` หรือ `pdf` | ข้อมูลขาเข้า Slack ไม่แปลง PDF เป็นอินพุตภาพสำหรับการมองเห็นโดยอัตโนมัติ |
| ไฟล์อื่น                    | URL ไฟล์ Slack       | ดาวน์โหลดเมื่อเป็นไปได้และเปิดเผยเป็นบริบทไฟล์                              | ไฟล์ไบนารีจะไม่ถูกจัดการเป็นอินพุตรูปภาพ                               |
| การตอบกลับในเธรด                 | ไฟล์ของข้อความเริ่มเธรด | ไฟล์ของข้อความรากสามารถถูกเติมเป็นบริบทได้เมื่อการตอบกลับไม่มีสื่อโดยตรง  | ข้อความเริ่มเธรดที่มีเฉพาะไฟล์ใช้ตัวยึดตำแหน่งไฟล์แนบ                          |
| ข้อความหลายรูปภาพ           | ไฟล์ Slack หลายไฟล์ | แต่ละไฟล์จะถูกประเมินแยกกัน                                              | การประมวลผล Slack ถูกจำกัดไว้ที่แปดไฟล์ต่อข้อความ                     |

### ไปป์ไลน์ขาเข้า

เมื่อข้อความ Slack ที่มีไฟล์แนบมาถึง:

1. OpenClaw ดาวน์โหลดไฟล์จาก URL ส่วนตัวของ Slack โดยใช้โทเค็นบอต (`xoxb-...`)
2. เมื่อสำเร็จ ไฟล์จะถูกเขียนไปยังที่จัดเก็บสื่อ
3. เส้นทางสื่อที่ดาวน์โหลดแล้วและประเภทเนื้อหาจะถูกเพิ่มลงในบริบทขาเข้า
4. เส้นทางของโมเดล/เครื่องมือที่รองรับรูปภาพสามารถใช้ไฟล์แนบรูปภาพจากบริบทนั้นได้
5. ไฟล์ที่ไม่ใช่รูปภาพยังคงพร้อมใช้งานเป็นเมทาดาทาไฟล์หรือการอ้างอิงสื่อสำหรับเครื่องมือที่จัดการไฟล์เหล่านั้นได้

### การสืบทอดไฟล์แนบจากข้อความรากของเธรด

เมื่อข้อความมาถึงในเธรด (มีพาเรนต์ `thread_ts`):

- หากการตอบกลับเองไม่มีสื่อโดยตรง และข้อความรากที่รวมมามีไฟล์ Slack สามารถเติมไฟล์รากเป็นบริบทของข้อความเริ่มเธรดได้
- ไฟล์แนบของการตอบกลับโดยตรงมีลำดับความสำคัญเหนือไฟล์แนบของข้อความราก
- ข้อความรากที่มีเฉพาะไฟล์และไม่มีข้อความจะแสดงด้วยตัวยึดตำแหน่งไฟล์แนบ เพื่อให้กลไกสำรองยังคงรวมไฟล์ของข้อความนั้นได้

### การจัดการไฟล์แนบหลายรายการ

เมื่อข้อความ Slack เดียวมีไฟล์แนบหลายรายการ:

- ไฟล์แนบแต่ละรายการจะถูกประมวลผลแยกกันผ่านไปป์ไลน์สื่อ
- การอ้างอิงสื่อที่ดาวน์โหลดแล้วจะถูกรวมเข้ากับบริบทข้อความ
- ลำดับการประมวลผลเป็นไปตามลำดับไฟล์ของ Slack ในเพย์โหลดเหตุการณ์
- ความล้มเหลวในการดาวน์โหลดไฟล์แนบหนึ่งรายการไม่บล็อกไฟล์แนบอื่น

### ขนาด การดาวน์โหลด และขีดจำกัดของโมเดล

- **ขีดจำกัดขนาด**: ค่าเริ่มต้น 20 MB ต่อไฟล์ กำหนดค่าได้ผ่าน `channels.slack.mediaMaxMb`
- **ความล้มเหลวในการดาวน์โหลด**: ไฟล์ที่ Slack ให้บริการไม่ได้, URL หมดอายุ, ไฟล์ที่เข้าถึงไม่ได้, ไฟล์เกินขนาด และการตอบกลับ HTML สำหรับการยืนยันตัวตน/เข้าสู่ระบบของ Slack จะถูกข้าม แทนที่จะถูกรายงานว่าเป็นรูปแบบที่ไม่รองรับ
- **โมเดลการมองเห็น**: การวิเคราะห์รูปภาพใช้โมเดลตอบกลับที่ใช้งานอยู่เมื่อโมเดลนั้นรองรับการมองเห็น หรือใช้โมเดลรูปภาพที่กำหนดค่าไว้ที่ `agents.defaults.imageModel`

### ขีดจำกัดที่ทราบ

| สถานการณ์                               | ลักษณะการทำงานปัจจุบัน                                                             | วิธีแก้ปัญหาชั่วคราว                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL ไฟล์ Slack หมดอายุ                 | ข้ามไฟล์ ไม่มีข้อผิดพลาดแสดง                                                 | อัปโหลดไฟล์ใหม่ใน Slack                                                |
| ไม่ได้กำหนดค่าโมเดลการมองเห็น            | ไฟล์แนบรูปภาพถูกจัดเก็บเป็นการอ้างอิงสื่อ แต่ไม่ถูกวิเคราะห์เป็นรูปภาพ | กำหนดค่า `agents.defaults.imageModel` หรือใช้โมเดลตอบกลับที่รองรับการมองเห็น |
| รูปภาพขนาดใหญ่มาก (> 20 MB โดยค่าเริ่มต้น) | ข้ามตามขีดจำกัดขนาด                                                         | เพิ่ม `channels.slack.mediaMaxMb` หาก Slack อนุญาต                       |
| ไฟล์แนบที่ส่งต่อ/แชร์           | ข้อความและสื่อรูปภาพ/ไฟล์ที่โฮสต์บน Slack เป็นแบบพยายามอย่างดีที่สุด                       | แชร์ใหม่โดยตรงในเธรด OpenClaw                                   |
| ไฟล์แนบ PDF                        | จัดเก็บเป็นบริบทไฟล์/สื่อ ไม่ได้กำหนดเส้นทางผ่านการมองเห็นรูปภาพโดยอัตโนมัติ  | ใช้ `download-file` สำหรับเมทาดาทาไฟล์ หรือเครื่องมือ `pdf` สำหรับการวิเคราะห์ PDF   |

### เอกสารที่เกี่ยวข้อง

- [ไปป์ไลน์การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
- [เครื่องมือ PDF](/th/tools/pdf)
- มหากาพย์: [#51349](https://github.com/openclaw/openclaw/issues/51349) — การเปิดใช้งานการมองเห็นสำหรับไฟล์แนบ Slack
- การทดสอบถดถอย: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- การตรวจสอบยืนยันแบบสด: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Slack กับ Gateway
  </Card>
  <Card title="Groups" icon="users" href="/th/channels/groups">
    ลักษณะการทำงานของช่องและ DM กลุ่ม
  </Card>
  <Card title="Channel routing" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="Security" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการเสริมความแข็งแกร่ง
  </Card>
  <Card title="Configuration" icon="sliders" href="/th/gateway/configuration">
    โครงร่างคอนฟิกและลำดับความสำคัญ
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    แค็ตตาล็อกคำสั่งและลักษณะการทำงาน
  </Card>
</CardGroup>
