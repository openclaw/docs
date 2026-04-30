---
read_when:
    - การตั้งค่า Slack หรือการดีบักโหมดซ็อกเก็ต/HTTP ของ Slack
summary: การตั้งค่า Slack และพฤติกรรมขณะทำงาน (โหมดซ็อกเก็ต + URL คำขอ HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-30T09:39:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08024bd947ddeb00a1ab3aaa3864cf31817303bbc0523902acdc539fc662e127
    source_path: channels/slack.md
    workflow: 16
---

พร้อมใช้งานระดับโปรดักชันสำหรับ DM และช่องผ่านการผสานรวมแอป Slack โหมดเริ่มต้นคือโหมด Socket; รองรับ URL คำขอ HTTP ด้วยเช่นกัน

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ Slack ใช้โหมดจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องและคู่มือปฏิบัติการซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="โหมด Socket (ค่าเริ่มต้น)">
    <Steps>
      <Step title="สร้างแอป Slack ใหม่">
        ในการตั้งค่าแอป Slack ให้กดปุ่ม **[สร้างแอปใหม่](https://api.slack.com/apps/new)**:

        - เลือก **จากแมนิเฟสต์** และเลือกเวิร์กสเปซสำหรับแอปของคุณ
        - วาง [ตัวอย่างแมนิเฟสต์](#manifest-and-scope-checklist) ด้านล่าง แล้วดำเนินการสร้างต่อ
        - สร้าง **โทเค็นระดับแอป** (`xapp-...`) พร้อม `connections:write`
        - ติดตั้งแอปและคัดลอก **โทเค็นบอท** (`xoxb-...`) ที่แสดงอยู่

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

        ทางเลือกสำรอง Env (เฉพาะบัญชีค่าเริ่มต้น):

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

        - เลือก **จากแมนิเฟสต์** และเลือกเวิร์กสเปซสำหรับแอปของคุณ
        - วาง [ตัวอย่างแมนิเฟสต์](#manifest-and-scope-checklist) และอัปเดต URL ก่อนสร้าง
        - บันทึก **ความลับสำหรับลงนาม** สำหรับการตรวจสอบคำขอ
        - ติดตั้งแอปและคัดลอก **โทเค็นบอท** (`xoxb-...`) ที่แสดงอยู่

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
        ใช้พาธ Webhook ที่ไม่ซ้ำกันสำหรับ HTTP หลายบัญชี

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

OpenClaw ตั้งค่าระยะหมดเวลารอ pong ของไคลเอนต์ Slack SDK เป็น 15 วินาทีโดยค่าเริ่มต้นสำหรับโหมด Socket ให้เขียนทับการตั้งค่าทรานสปอร์ตเฉพาะเมื่อคุณต้องปรับแต่งสำหรับเวิร์กสเปซหรือโฮสต์เฉพาะ:

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

ใช้ตัวเลือกนี้เฉพาะกับเวิร์กสเปซโหมด Socket ที่บันทึกระยะหมดเวลาของ pong/พิงเซิร์ฟเวอร์ของเว็บซ็อกเก็ต Slack หรือทำงานบนโฮสต์ที่ทราบว่าลูปอีเวนต์ขาดช่วง `clientPingTimeout` คือเวลารอ pong หลังจาก SDK ส่งพิงจากไคลเอนต์; `serverPingTimeout` คือเวลารอพิงจากเซิร์ฟเวอร์ Slack ข้อความและอีเวนต์ของแอปยังคงเป็นสถานะแอปพลิเคชัน ไม่ใช่สัญญาณความมีชีวิตของทรานสปอร์ต

## รายการตรวจสอบแมนิเฟสต์และขอบเขตสิทธิ์

แมนิเฟสต์พื้นฐานของแอป Slack เหมือนกันสำหรับโหมด Socket และ URL คำขอ HTTP แตกต่างกันเฉพาะบล็อก `settings` (และ `url` ของคำสั่ง slash)

แมนิเฟสต์พื้นฐาน (โหมด Socket ค่าเริ่มต้น):

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

สำหรับ **โหมด URL คำขอ HTTP** ให้แทนที่ `settings` ด้วยตัวแปร HTTP และเพิ่ม `url` ให้แต่ละคำสั่ง slash ต้องใช้ URL สาธารณะ:

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

เปิดใช้ฟีเจอร์ต่าง ๆ ที่ขยายจากค่าเริ่มต้นด้านบน

<AccordionGroup>
  <Accordion title="คำสั่ง slash แบบเนทีฟที่เลือกได้">

    สามารถใช้ [คำสั่ง slash แบบเนทีฟ](#commands-and-slash-behavior) หลายคำสั่งแทนคำสั่งเดียวที่กำหนดค่าไว้ โดยมีรายละเอียดดังนี้:

    - ใช้ `/agentstatus` แทน `/status` เพราะคำสั่ง `/status` ถูกสงวนไว้
    - เปิดให้ใช้คำสั่ง slash พร้อมกันได้ไม่เกิน 25 คำสั่ง

    แทนที่ส่วน `features.slash_commands` เดิมของคุณด้วยชุดย่อยของ [คำสั่งที่พร้อมใช้งาน](/th/tools/slash-commands#command-list):

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
  <Accordion title="ขอบเขตสิทธิ์ผู้เขียนที่เลือกได้ (การดำเนินการเขียน)">
    เพิ่มขอบเขตสิทธิ์บอท `chat:write.customize` หากคุณต้องการให้ข้อความขาออกใช้อัตลักษณ์ของเอเจนต์ที่ใช้งานอยู่ (ชื่อผู้ใช้และไอคอนที่กำหนดเอง) แทนอัตลักษณ์แอป Slack ค่าเริ่มต้น

    หากคุณใช้ไอคอนอีโมจิ Slack จะคาดหวังไวยากรณ์แบบ `:emoji_name:`

  </Accordion>
  <Accordion title="ขอบเขตสิทธิ์โทเค็นผู้ใช้ที่เลือกได้ (การดำเนินการอ่าน)">
    หากคุณกำหนดค่า `channels.slack.userToken` ขอบเขตสิทธิ์อ่านทั่วไปคือ:

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

- ต้องระบุ `botToken` + `appToken` สำหรับ Socket Mode
- โหมด HTTP ต้องใช้ `botToken` + `signingSecret`
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับได้ทั้งสตริง
  ข้อความธรรมดาหรืออ็อบเจ็กต์ SecretRef
- โทเค็นใน config จะแทนที่ env fallback
- env fallback ของ `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ใช้กับบัญชีเริ่มต้นเท่านั้น
- `userToken` (`xoxp-...`) ใช้ได้เฉพาะใน config เท่านั้น (ไม่มี env fallback) และค่าเริ่มต้นเป็นพฤติกรรมแบบอ่านอย่างเดียว (`userTokenReadOnly: true`)

พฤติกรรมสแนปชอตสถานะ:

- การตรวจสอบบัญชี Slack ติดตามฟิลด์ `*Source` และ `*Status`
  แยกตามข้อมูลรับรอง (`botToken`, `appToken`, `signingSecret`, `userToken`)
- สถานะคือ `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าผ่าน SecretRef
  หรือแหล่ง secret อื่นที่ไม่ใช่แบบ inline แต่พาธคำสั่ง/รันไทม์ปัจจุบัน
  ไม่สามารถ resolve ค่าจริงได้
- ในโหมด HTTP จะรวม `signingSecretStatus`; ใน Socket Mode
  คู่ที่จำเป็นคือ `botTokenStatus` + `appTokenStatus`

<Tip>
สำหรับการกระทำ/การอ่านไดเรกทอรี สามารถเลือกใช้ user token ก่อนเมื่อกำหนดค่าไว้ สำหรับการเขียน ยังคงเลือกใช้ bot token ก่อน; การเขียนด้วย user-token จะอนุญาตเฉพาะเมื่อ `userTokenReadOnly: false` และ bot token ไม่พร้อมใช้งาน
</Tip>

## การกระทำและเกต

การกระทำของ Slack ควบคุมโดย `channels.slack.actions.*`

กลุ่มการกระทำที่พร้อมใช้ในเครื่องมือ Slack ปัจจุบัน:

| กลุ่ม      | ค่าเริ่มต้น |
| ---------- | ------- |
| messages   | เปิดใช้ |
| reactions  | เปิดใช้ |
| pins       | เปิดใช้ |
| memberInfo | เปิดใช้ |
| emojiList  | เปิดใช้ |

การกระทำข้อความ Slack ปัจจุบันประกอบด้วย `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list` `download-file` รับ ID ไฟล์ Slack ที่แสดงใน placeholder ไฟล์ขาเข้า และส่งคืนตัวอย่างภาพสำหรับรูปภาพหรือ metadata ไฟล์ในเครื่องสำหรับไฟล์ประเภทอื่น

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM `channels.slack.allowFrom` คือ allowlist สำหรับ DM ที่เป็นมาตรฐาน

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.slack.allowFrom` รวม `"*"`)
    - `disabled`

    แฟล็ก DM:

    - `dm.enabled` (ค่าเริ่มต้น true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (แบบเดิม)
    - `dm.groupEnabled` (DM แบบกลุ่ม ค่าเริ่มต้น false)
    - `dm.groupChannels` (allowlist MPIM เสริม)

    ลำดับความสำคัญแบบหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่มีชื่อจะสืบทอด `channels.slack.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตัวเอง
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.slack.accounts.default.allowFrom`

    `channels.slack.dm.policy` และ `channels.slack.dm.allowFrom` แบบเดิมยังอ่านเพื่อความเข้ากันได้ `openclaw doctor --fix` จะย้ายค่าเหล่านี้ไปเป็น `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนการเข้าถึง

    การจับคู่ใน DM ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="นโยบายช่อง">
    `channels.slack.groupPolicy` ควบคุมการจัดการช่อง:

    - `open`
    - `allowlist`
    - `disabled`

    allowlist ของช่องอยู่ใต้ `channels.slack.channels` และ **ต้องใช้ ID ช่อง Slack ที่เสถียร** (เช่น `C12345678`) เป็นคีย์ config

    หมายเหตุรันไทม์: หาก `channels.slack` หายไปทั้งหมด (การตั้งค่าแบบ env เท่านั้น) รันไทม์จะ fallback เป็น `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

    การ resolve ชื่อ/ID:

    - รายการ allowlist ของช่องและรายการ allowlist ของ DM จะถูก resolve ตอนเริ่มทำงานเมื่อการเข้าถึงด้วยโทเค็นอนุญาต
    - รายการชื่อช่องที่ resolve ไม่ได้จะคงไว้ตามที่กำหนดค่า แต่จะถูกละเว้นสำหรับการกำหนดเส้นทางโดยค่าเริ่มต้น
    - การอนุญาตขาเข้าและการกำหนดเส้นทางช่องจะใช้ ID เป็นหลักโดยค่าเริ่มต้น; การจับคู่ username/slug โดยตรงต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    คีย์ที่อิงชื่อ (`#channel-name` หรือ `channel-name`) จะ **ไม่** จับคู่ภายใต้ `groupPolicy: "allowlist"` การค้นหาช่องใช้ ID เป็นหลักโดยค่าเริ่มต้น ดังนั้นคีย์ที่อิงชื่อจะไม่มีทางกำหนดเส้นทางสำเร็จ และข้อความทั้งหมดในช่องนั้นจะถูกบล็อกอย่างเงียบ ๆ ซึ่งต่างจาก `groupPolicy: "open"` ที่ไม่ต้องใช้คีย์ช่องสำหรับการกำหนดเส้นทาง และคีย์ที่อิงชื่อจะดูเหมือนใช้งานได้

    ใช้ ID ช่อง Slack เป็นคีย์เสมอ วิธีค้นหา: คลิกขวาที่ช่องใน Slack → **Copy link** — ID (`C...`) จะปรากฏท้าย URL

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

  <Tab title="การกล่าวถึงและผู้ใช้ช่อง">
    ข้อความในช่องต้องผ่านเกตการกล่าวถึงโดยค่าเริ่มต้น

    แหล่งที่มาของการกล่าวถึง:

    - การกล่าวถึงแอปโดยตรง (`<@botId>`)
    - รูปแบบ regex สำหรับการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - พฤติกรรม thread ตอบกลับถึงบอตโดยนัย (ปิดใช้งานเมื่อ `thread.requireExplicitMention` เป็น `true`)

    การควบคุมรายช่อง (`channels.slack.channels.<id>`; ชื่อใช้ได้เฉพาะผ่านการ resolve ตอนเริ่มทำงานหรือ `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ `toolsBySender`: `id:`, `e164:`, `username:`, `name:` หรือ wildcard `"*"`
      (คีย์แบบเดิมที่ไม่มี prefix ยัง map ไปที่ `id:` เท่านั้น)

  </Tab>
</Tabs>

## Thread, เซสชัน และแท็กตอบกลับ

- DM กำหนดเส้นทางเป็น `direct`; ช่องเป็น `channel`; MPIM เป็น `group`
- ด้วยค่าเริ่มต้น `session.dmScope=main` DM ของ Slack จะรวมไปที่เซสชันหลักของ agent
- เซสชันช่อง: `agent:<agentId>:slack:channel:<channelId>`
- การตอบกลับใน thread สามารถสร้าง suffix เซสชัน thread (`:thread:<threadTs>`) เมื่อใช้ได้
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความ thread ที่มีอยู่ซึ่งจะดึงเมื่อเซสชัน thread ใหม่เริ่มต้น (ค่าเริ่มต้น `20`; ตั้งเป็น `0` เพื่อปิดใช้)
- `channels.slack.thread.requireExplicitMention` (ค่าเริ่มต้น `false`): เมื่อเป็น `true` จะระงับการกล่าวถึง thread โดยนัย เพื่อให้บอตตอบกลับเฉพาะการกล่าวถึง `@bot` โดยตรงภายใน thread แม้บอตจะเคยเข้าร่วมใน thread แล้ว หากไม่มีค่านี้ การตอบกลับใน thread ที่บอตเข้าร่วมแล้วจะข้ามเกต `requireMention`

การควบคุม thread ตอบกลับ:

- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: แยกตาม `direct|group|channel`
- fallback แบบเดิมสำหรับแชตโดยตรง: `channels.slack.dm.replyToMode`

รองรับแท็กตอบกลับแบบ manual:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` ปิดใช้ thread ตอบกลับ **ทั้งหมด** ใน Slack รวมถึงแท็ก `[[reply_to_*]]` โดยตรงด้วย ซึ่งต่างจาก Telegram ที่ยังคงเคารพแท็กโดยตรงในโหมด `"off"` thread ของ Slack จะซ่อนข้อความจากช่อง ในขณะที่การตอบกลับของ Telegram ยังคงมองเห็นแบบ inline
</Note>

## รีแอ็กชัน Ack

`ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

ลำดับการ resolve:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback อีโมจิ identity ของ agent (`agents.list[].identity.emoji`, มิฉะนั้น "👀")

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"eyes"`)
- ใช้ `""` เพื่อปิดใช้รีแอ็กชันสำหรับบัญชี Slack หรือแบบ global

## การสตรีมข้อความ

`channels.slack.streaming` ควบคุมพฤติกรรมตัวอย่างแบบสด:

- `off`: ปิดใช้การสตรีมตัวอย่างแบบสด
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความตัวอย่างด้วยผลลัพธ์บางส่วนล่าสุด
- `block`: ต่อท้ายการอัปเดตตัวอย่างแบบแบ่ง chunk
- `progress`: แสดงข้อความสถานะความคืบหน้าขณะสร้าง จากนั้นส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อเปิดใช้งานตัวอย่างแบบร่าง ให้กำหนดเส้นทางการอัปเดต tool/progress เข้าไปในข้อความตัวอย่างที่แก้ไขเดียวกัน (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อเก็บข้อความ tool/progress แยกต่างหาก

`channels.slack.streaming.nativeTransport` ควบคุมการสตรีมข้อความ native ของ Slack เมื่อ `channels.slack.streaming.mode` เป็น `partial` (ค่าเริ่มต้น: `true`)

- ต้องมี thread ตอบกลับสำหรับให้การสตรีมข้อความ native และสถานะ thread ผู้ช่วยของ Slack ปรากฏ การเลือก thread ยังคงตาม `replyToMode`
- root ของช่องและแชตกลุ่มยังใช้ตัวอย่างแบบร่างปกติได้เมื่อ native streaming ไม่พร้อมใช้งาน
- DM ระดับบนสุดของ Slack จะอยู่นอก thread โดยค่าเริ่มต้น ดังนั้นจะไม่แสดงตัวอย่างแบบ thread; ใช้การตอบกลับใน thread หรือ `typingReaction` หากต้องการแสดงความคืบหน้าที่นั่น
- payload สื่อและที่ไม่ใช่ข้อความจะ fallback ไปยังการส่งปกติ
- ผลลัพธ์สุดท้ายแบบสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่รอดำเนินการ; ผลลัพธ์สุดท้ายแบบข้อความ/block ที่เข้าเงื่อนไขจะ flush เฉพาะเมื่อแก้ไขตัวอย่างแบบ in place ได้
- หากการสตรีมล้มเหลวกลางการตอบกลับ OpenClaw จะ fallback ไปยังการส่งปกติสำหรับ payload ที่เหลือ

ใช้ตัวอย่างแบบร่างแทนการสตรีมข้อความ native ของ Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) จะถูกย้ายอัตโนมัติไปยัง `channels.slack.streaming.mode`
- boolean `channels.slack.streaming` จะถูกย้ายอัตโนมัติไปยัง `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport`
- `channels.slack.nativeStreaming` แบบเดิมจะถูกย้ายอัตโนมัติไปยัง `channels.slack.streaming.nativeTransport`

## Fallback รีแอ็กชันการพิมพ์

`typingReaction` เพิ่มรีแอ็กชันชั่วคราวให้กับข้อความ Slack ขาเข้า ขณะที่ OpenClaw กำลังประมวลผลการตอบกลับ แล้วลบออกเมื่อการรันเสร็จสิ้น สิ่งนี้มีประโยชน์มากที่สุดนอกการตอบกลับใน thread ซึ่งใช้ตัวบ่งชี้สถานะเริ่มต้น "กำลังพิมพ์..."

ลำดับการ resolve:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack คาดหวัง shortcode (เช่น `"hourglass_flowing_sand"`)
- รีแอ็กชันเป็นแบบ best-effort และจะพยายามล้างโดยอัตโนมัติหลังจากพาธตอบกลับหรือพาธล้มเหลวเสร็จสิ้น

## สื่อ การแบ่ง chunk และการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบขาเข้า">
    ไฟล์แนบของ Slack จะถูกดาวน์โหลดจาก URL ส่วนตัวที่โฮสต์โดย Slack (โฟลว์คำขอที่รับรองความถูกต้องด้วยโทเค็น) และเขียนไปยัง media store เมื่อดึงข้อมูลสำเร็จและขีดจำกัดขนาดอนุญาต placeholder ไฟล์รวม `fileId` ของ Slack เพื่อให้ agent สามารถดึงไฟล์ต้นฉบับด้วย `download-file`

    การดาวน์โหลดใช้ timeout แบบ idle และรวมที่มีขอบเขต หากการดึงไฟล์ Slack ค้างหรือล้มเหลว OpenClaw จะประมวลผลข้อความต่อและ fallback ไปยัง placeholder ไฟล์

    ค่าเริ่มต้นของขีดจำกัดขนาดขาเข้าระหว่างรันไทม์คือ `20MB` เว้นแต่ถูก override ด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="ข้อความและไฟล์ขาออก">
    - chunk ข้อความใช้ `channels.slack.textChunkLimit` (ค่าเริ่มต้น 4000)
    - `channels.slack.chunkMode="newline"` เปิดใช้การแบ่งโดยยึดย่อหน้าเป็นหลัก
    - การส่งไฟล์ใช้ API อัปโหลดของ Slack และสามารถรวมการตอบกลับใน thread (`thread_ts`)
    - ขีดจำกัดสื่อขาออกจะตาม `channels.slack.mediaMaxMb` เมื่อกำหนดค่าไว้; มิฉะนั้นการส่งผ่านช่องจะใช้ค่าเริ่มต้นตามชนิด MIME จาก media pipeline

  </Accordion>

  <Accordion title="เป้าหมายการส่ง">
    เป้าหมายแบบระบุชัดเจนที่แนะนำ:

    - `user:<id>` สำหรับ DM
    - `channel:<id>` สำหรับช่อง

    DM ของ Slack จะถูกเปิดผ่าน API การสนทนาของ Slack เมื่อส่งไปยังเป้าหมายผู้ใช้

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

คำสั่งแบบเนทีฟต้องใช้ [การตั้งค่า manifest เพิ่มเติม](#additional-manifest-settings) ในแอป Slack ของคุณ และเปิดใช้งานด้วย `channels.slack.commands.native: true` หรือ `commands.native: true` ในการกำหนดค่าส่วนกลางแทน

- โหมดอัตโนมัติของคำสั่งแบบเนทีฟ **ปิดอยู่** สำหรับ Slack ดังนั้น `commands.native: "auto"` จะไม่เปิดใช้งานคำสั่งเนทีฟของ Slack

```txt
/help
```

เมนูอาร์กิวเมนต์แบบเนทีฟใช้กลยุทธ์การเรนเดอร์แบบปรับตัว ซึ่งแสดงโมดัลยืนยันก่อนส่งค่าตัวเลือกที่เลือก:

- สูงสุด 5 ตัวเลือก: บล็อกปุ่ม
- 6-100 ตัวเลือก: เมนูเลือกแบบคงที่
- มากกว่า 100 ตัวเลือก: การเลือกภายนอกพร้อมการกรองตัวเลือกแบบ async เมื่อมีตัวจัดการตัวเลือกการโต้ตอบ
- เกินขีดจำกัดของ Slack: ค่าตัวเลือกที่เข้ารหัสจะถอยกลับไปใช้ปุ่ม

```txt
/think
```

เซสชัน slash ใช้คีย์แยกกัน เช่น `agent:<agentId>:slack:slash:<userId>` และยังคงกำหนดเส้นทางการดำเนินคำสั่งไปยังเซสชันการสนทนาเป้าหมายโดยใช้ `CommandTargetSessionKey`

## การตอบกลับแบบโต้ตอบ

Slack สามารถเรนเดอร์ตัวควบคุมการตอบกลับแบบโต้ตอบที่ agent สร้างได้ แต่ฟีเจอร์นี้ปิดใช้งานเป็นค่าเริ่มต้น

เปิดใช้งานแบบส่วนกลาง:

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

หรือเปิดใช้งานสำหรับบัญชี Slack เดียวเท่านั้น:

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

เมื่อเปิดใช้งาน agent สามารถส่ง directive การตอบกลับเฉพาะ Slack ได้:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

directive เหล่านี้จะคอมไพล์เป็น Slack Block Kit และกำหนดเส้นทางการคลิกหรือการเลือกกลับผ่านเส้นทางเหตุการณ์การโต้ตอบของ Slack ที่มีอยู่

หมายเหตุ:

- นี่คือ UI เฉพาะ Slack ช่องทางอื่นจะไม่แปล directive ของ Slack Block Kit เป็นระบบปุ่มของตัวเอง
- ค่าคอลแบ็กแบบโต้ตอบคือโทเคนทึบแสงที่ OpenClaw สร้างขึ้น ไม่ใช่ค่าดิบที่ agent เขียนเอง
- หากบล็อกแบบโต้ตอบที่สร้างขึ้นจะเกินขีดจำกัดของ Slack Block Kit, OpenClaw จะถอยกลับไปใช้ข้อความตอบกลับเดิมแทนการส่ง payload บล็อกที่ไม่ถูกต้อง

## การอนุมัติการรันคำสั่งใน Slack

Slack สามารถทำหน้าที่เป็นไคลเอนต์อนุมัติแบบเนทีฟพร้อมปุ่มและการโต้ตอบแบบโต้ตอบ แทนการถอยกลับไปใช้ Web UI หรือเทอร์มินัล

- การอนุมัติการรันคำสั่งใช้ `channels.slack.execApprovals.*` สำหรับการกำหนดเส้นทาง DM/ช่องทางแบบเนทีฟ
- การอนุมัติ Plugin ยังสามารถ resolve ผ่านพื้นผิวปุ่มแบบเนทีฟของ Slack เดียวกันได้ เมื่อคำขอเข้าสู่ Slack อยู่แล้วและชนิดรหัสการอนุมัติคือ `plugin:`
- ยังคงบังคับใช้การอนุญาตของผู้อนุมัติ: เฉพาะผู้ใช้ที่ระบุว่าเป็นผู้อนุมัติเท่านั้นที่สามารถอนุมัติหรือปฏิเสธคำขอผ่าน Slack ได้

สิ่งนี้ใช้พื้นผิวปุ่มอนุมัติร่วมเดียวกันกับช่องทางอื่น เมื่อเปิดใช้งาน `interactivity` ในการตั้งค่าแอป Slack ของคุณ พรอมต์อนุมัติจะเรนเดอร์เป็นปุ่ม Block Kit โดยตรงในการสนทนา
เมื่อมีปุ่มเหล่านั้น ปุ่มเหล่านั้นคือ UX การอนุมัติหลัก; OpenClaw
ควรรวมคำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่าการอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียวเท่านั้น

เส้นทางการกำหนดค่า:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; ถอยกลับไปใช้ `commands.ownerAllowFrom` เมื่อเป็นไปได้)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack จะเปิดใช้งานการอนุมัติการรันคำสั่งแบบเนทีฟโดยอัตโนมัติเมื่อ `enabled` ไม่ได้ตั้งค่าไว้หรือเป็น `"auto"` และมี
ผู้อนุมัติอย่างน้อยหนึ่งรายที่ resolve ได้ ตั้งค่า `enabled: false` เพื่อปิดใช้งาน Slack ในฐานะไคลเอนต์อนุมัติแบบเนทีฟอย่างชัดเจน
ตั้งค่า `enabled: true` เพื่อบังคับเปิดการอนุมัติแบบเนทีฟเมื่อผู้อนุมัติ resolve ได้

พฤติกรรมเริ่มต้นเมื่อไม่มีการกำหนดค่าการอนุมัติการรันคำสั่งของ Slack อย่างชัดเจน:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

การกำหนดค่าแบบเนทีฟของ Slack อย่างชัดเจนจำเป็นเฉพาะเมื่อคุณต้องการแทนที่ผู้อนุมัติ เพิ่มตัวกรอง หรือ
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

การส่งต่อ `approvals.exec` แบบร่วมเป็นคนละส่วนกัน ใช้เฉพาะเมื่อพรอมต์อนุมัติการรันคำสั่งต้อง
กำหนดเส้นทางไปยังแชตอื่นหรือเป้าหมายนอกช่องทางที่ระบุชัดเจนด้วย การส่งต่อ `approvals.plugin` แบบร่วมก็
เป็นคนละส่วนเช่นกัน; ปุ่มแบบเนทีฟของ Slack ยังสามารถ resolve การอนุมัติ Plugin ได้เมื่อคำขอเหล่านั้นเข้าสู่
Slack อยู่แล้ว

`/approve` ในแชตเดียวกันยังทำงานในช่องทางและ DM ของ Slack ที่รองรับคำสั่งอยู่แล้ว ดู [การอนุมัติการรันคำสั่ง](/th/tools/exec-approvals) สำหรับโมเดลการส่งต่อการอนุมัติฉบับเต็ม

## เหตุการณ์และพฤติกรรมการปฏิบัติการ

- การแก้ไข/ลบข้อความถูกแมปเป็นเหตุการณ์ระบบ
- การบรอดแคสต์เธรด ("Also send to channel" การตอบกลับเธรด) ถูกประมวลผลเป็นข้อความผู้ใช้ตามปกติ
- เหตุการณ์เพิ่ม/ลบรีแอ็กชันถูกแมปเป็นเหตุการณ์ระบบ
- เหตุการณ์สมาชิกเข้า/ออก, สร้าง/เปลี่ยนชื่อช่องทาง และเพิ่ม/ลบหมุดถูกแมปเป็นเหตุการณ์ระบบ
- `channel_id_changed` สามารถย้ายคีย์การกำหนดค่าช่องทางเมื่อเปิดใช้งาน `configWrites`
- เมตาดาต้า topic/purpose ของช่องทางถือเป็นบริบทที่ไม่น่าเชื่อถือและสามารถถูกแทรกเข้าไปในบริบทการกำหนดเส้นทางได้
- ตัวเริ่มเธรดและการเติมบริบทประวัติเธรดเริ่มต้นจะถูกกรองโดย allowlist ผู้ส่งที่กำหนดค่าไว้เมื่อเกี่ยวข้อง
- Block actions และการโต้ตอบกับโมดัลจะปล่อยเหตุการณ์ระบบ `Slack interaction: ...` ที่มีโครงสร้างพร้อมฟิลด์ payload ที่ละเอียด:
  - block actions: ค่าที่เลือก, ป้ายกำกับ, ค่าตัวเลือก และเมตาดาต้า `workflow_*`
  - เหตุการณ์ `view_submission` และ `view_closed` ของโมดัลพร้อมเมตาดาต้าช่องทางที่ถูกกำหนดเส้นทางและอินพุตฟอร์ม

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Slack](/th/gateway/config-channels#slack)

<Accordion title="ฟิลด์ Slack สัญญาณสูง">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (เดิม: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- ตัวสลับความเข้ากันได้: `dangerouslyAllowNameMatching` (break-glass; ปิดไว้เว้นแต่จำเป็น)
- การเข้าถึงช่องทาง: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- เธรด/ประวัติ: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- การปฏิบัติการ/ฟีเจอร์: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในช่องทาง">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - allowlist ช่องทาง (`channels.slack.channels`) — **คีย์ต้องเป็นรหัสช่องทาง** (`C12345678`) ไม่ใช่ชื่อ (`#channel-name`) คีย์ที่อิงชื่อจะล้มเหลวแบบเงียบภายใต้ `groupPolicy: "allowlist"` เพราะการกำหนดเส้นทางช่องทางใช้รหัสเป็นหลักโดยค่าเริ่มต้น วิธีค้นหารหัส: คลิกขวาช่องทางใน Slack → **Copy link** — ค่า `C...` ที่ท้าย URL คือรหัสช่องทาง
    - `requireMention`
    - allowlist `users` ต่อช่องทาง

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
    - การอนุมัติการจับคู่ / รายการ allowlist
    - เหตุการณ์ DM ของ Slack Assistant: บันทึกแบบละเอียดที่กล่าวถึง `drop message_changed`
      มักหมายความว่า Slack ส่งเหตุการณ์เธรด Assistant ที่ถูกแก้ไขโดยไม่มี
      ผู้ส่งที่เป็นมนุษย์ซึ่งกู้คืนได้ในเมตาดาต้าข้อความ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode ไม่เชื่อมต่อ">
    ตรวจสอบ bot + app token และการเปิดใช้งาน Socket Mode ในการตั้งค่าแอป Slack

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` หมายความว่าบัญชี Slack ได้รับการกำหนดค่าแล้ว
    แต่ runtime ปัจจุบันไม่สามารถ resolve ค่าที่อิง SecretRef ได้

  </Accordion>

  <Accordion title="โหมด HTTP ไม่ได้รับเหตุการณ์">
    ตรวจสอบ:

    - signing secret
    - webhook path
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - `webhookPath` ที่ไม่ซ้ำกันต่อบัญชี HTTP

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏในสแนปช็อตบัญชี
    หมายความว่าบัญชี HTTP ได้รับการกำหนดค่าแล้ว แต่ runtime ปัจจุบันไม่สามารถ
    resolve signing secret ที่อิง SecretRef ได้

  </Accordion>

  <Accordion title="คำสั่งเนทีฟ/slash ไม่ทำงาน">
    ตรวจสอบว่าคุณตั้งใจใช้:

    - โหมดคำสั่งเนทีฟ (`channels.slack.commands.native: true`) พร้อมคำสั่ง slash ที่ตรงกันซึ่งลงทะเบียนใน Slack
    - หรือโหมดคำสั่ง slash เดี่ยว (`channels.slack.slashCommand.enabled: true`)

    ตรวจสอบ `commands.useAccessGroups` และ allowlist ช่องทาง/ผู้ใช้ด้วย

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิงวิชันสำหรับไฟล์แนบ

Slack สามารถแนบสื่อที่ดาวน์โหลดเข้ากับ turn ของ agent ได้เมื่อการดาวน์โหลดไฟล์จาก Slack สำเร็จและขีดจำกัดขนาดอนุญาต ไฟล์รูปภาพสามารถส่งผ่านเส้นทางการเข้าใจสื่อหรือส่งตรงไปยังโมเดลตอบกลับที่รองรับวิชันได้; ไฟล์อื่นจะถูกเก็บไว้เป็นบริบทไฟล์ที่ดาวน์โหลดได้ แทนที่จะถูกถือเป็นอินพุตรูปภาพ

### ประเภทสื่อที่รองรับ

| ประเภทสื่อ                     | แหล่งที่มา               | พฤติกรรมปัจจุบัน                                                                  | หมายเหตุ                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| รูปภาพ JPEG / PNG / GIF / WebP | URL ไฟล์ Slack       | ดาวน์โหลดและแนบเข้ากับ turn เพื่อให้จัดการโดยความสามารถด้านวิชันได้                   | ขีดจำกัดต่อไฟล์: `channels.slack.mediaMaxMb` (ค่าเริ่มต้น 20 MB)                 |
| ไฟล์ PDF                      | URL ไฟล์ Slack       | ดาวน์โหลดและเปิดเผยเป็นบริบทไฟล์สำหรับเครื่องมือ เช่น `download-file` หรือ `pdf` | ขาเข้าของ Slack ไม่แปลง PDF เป็นอินพุตวิชันรูปภาพโดยอัตโนมัติ |
| ไฟล์อื่น                    | URL ไฟล์ Slack       | ดาวน์โหลดเมื่อเป็นไปได้และเปิดเผยเป็นบริบทไฟล์                              | ไฟล์ไบนารีจะไม่ถูกถือเป็นอินพุตรูปภาพ                               |
| การตอบกลับเธรด                 | ไฟล์ของตัวเริ่มเธรด | สามารถเติมไฟล์ของข้อความรากเป็นบริบทได้เมื่อการตอบกลับไม่มีสื่อโดยตรง  | ตัวเริ่มที่มีเฉพาะไฟล์ใช้ placeholder ของไฟล์แนบ                          |
| ข้อความหลายรูปภาพ           | ไฟล์ Slack หลายไฟล์ | แต่ละไฟล์ถูกประเมินอย่างอิสระ                                              | การประมวลผลของ Slack จำกัดไว้ที่แปดไฟล์ต่อข้อความ                     |

### ไปป์ไลน์ขาเข้า

เมื่อข้อความ Slack พร้อมไฟล์แนบมาถึง:

1. OpenClaw ดาวน์โหลดไฟล์จาก URL ส่วนตัวของ Slack โดยใช้ bot token (`xoxb-...`)
2. ไฟล์ถูกเขียนไปยัง media store เมื่อสำเร็จ
3. เส้นทางสื่อที่ดาวน์โหลดและชนิดเนื้อหาถูกเพิ่มลงในบริบทขาเข้า
4. เส้นทางโมเดล/เครื่องมือที่รองรับรูปภาพสามารถใช้ไฟล์แนบรูปภาพจากบริบทนั้นได้
5. ไฟล์ที่ไม่ใช่รูปภาพยังคงพร้อมใช้งานเป็นเมตาดาต้าไฟล์หรือการอ้างอิงสื่อสำหรับเครื่องมือที่จัดการได้

### การสืบทอดไฟล์แนบจากรากเธรด

เมื่อข้อความมาถึงในเธรด (มีพาเรนต์ `thread_ts`):

- หากการตอบกลับเองไม่มีสื่อโดยตรง และข้อความรากที่รวมมามีไฟล์ Slack สามารถเติมไฟล์รากเป็นบริบทตัวเริ่มเธรดได้
- ไฟล์แนบของการตอบกลับโดยตรงมีความสำคัญเหนือไฟล์แนบของข้อความราก
- ข้อความรากที่มีเฉพาะไฟล์และไม่มีข้อความจะแสดงด้วย placeholder ของไฟล์แนบ เพื่อให้ fallback ยังสามารถรวมไฟล์ของข้อความนั้นได้

### การจัดการไฟล์แนบหลายรายการ

เมื่อข้อความ Slack เดียวมีไฟล์แนบหลายไฟล์:

- ไฟล์แนบแต่ละไฟล์จะถูกประมวลผลแยกกันผ่านไปป์ไลน์สื่อ
- การอ้างอิงสื่อที่ดาวน์โหลดแล้วจะถูกรวบรวมเข้าไปในบริบทข้อความ
- ลำดับการประมวลผลเป็นไปตามลำดับไฟล์ของ Slack ในเพย์โหลดเหตุการณ์
- ความล้มเหลวในการดาวน์โหลดของไฟล์แนบหนึ่งรายการจะไม่บล็อกรายการอื่น

### ขนาด การดาวน์โหลด และขีดจำกัดของโมเดล

- **ขีดจำกัดขนาด**: ค่าเริ่มต้น 20 MB ต่อไฟล์ กำหนดค่าได้ผ่าน `channels.slack.mediaMaxMb`
- **ความล้มเหลวในการดาวน์โหลด**: ไฟล์ที่ Slack ไม่สามารถให้บริการได้, URL ที่หมดอายุ, ไฟล์ที่เข้าถึงไม่ได้, ไฟล์ขนาดเกินกำหนด และการตอบกลับ HTML สำหรับการยืนยันตัวตน/เข้าสู่ระบบของ Slack จะถูกข้ามแทนที่จะถูกรายงานว่าเป็นรูปแบบที่ไม่รองรับ
- **โมเดลด้านวิชัน**: การวิเคราะห์รูปภาพใช้โมเดลตอบกลับที่ใช้งานอยู่เมื่อรองรับวิชัน หรือโมเดลรูปภาพที่กำหนดค่าไว้ที่ `agents.defaults.imageModel`

### ขีดจำกัดที่ทราบ

| สถานการณ์                              | พฤติกรรมปัจจุบัน                                                              | วิธีเลี่ยงปัญหา                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL ไฟล์ Slack หมดอายุ                 | ข้ามไฟล์ ไม่มีข้อผิดพลาดแสดง                                                 | อัปโหลดไฟล์ใน Slack อีกครั้ง                                                |
| ไม่ได้กำหนดค่าโมเดลด้านวิชัน           | ไฟล์แนบรูปภาพถูกจัดเก็บเป็นการอ้างอิงสื่อ แต่ไม่ได้วิเคราะห์เป็นรูปภาพ | กำหนดค่า `agents.defaults.imageModel` หรือใช้โมเดลตอบกลับที่รองรับวิชัน |
| รูปภาพขนาดใหญ่มาก (> 20 MB โดยค่าเริ่มต้น) | ข้ามตามขีดจำกัดขนาด                                                         | เพิ่ม `channels.slack.mediaMaxMb` หาก Slack อนุญาต                       |
| ไฟล์แนบที่ส่งต่อ/แชร์มา                | ข้อความและสื่อรูปภาพ/ไฟล์ที่โฮสต์บน Slack เป็นแบบพยายามให้ดีที่สุด        | แชร์โดยตรงอีกครั้งในเธรด OpenClaw                                   |
| ไฟล์แนบ PDF                           | จัดเก็บเป็นบริบทไฟล์/สื่อ ไม่ได้ส่งผ่านวิชันสำหรับรูปภาพโดยอัตโนมัติ  | ใช้ `download-file` สำหรับเมตาดาต้าไฟล์ หรือเครื่องมือ `pdf` สำหรับการวิเคราะห์ PDF   |

### เอกสารที่เกี่ยวข้อง

- [ไปป์ไลน์การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
- [เครื่องมือ PDF](/th/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — การเปิดใช้งานวิชันสำหรับไฟล์แนบ Slack
- การทดสอบถดถอย: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- การยืนยันแบบสด: [#51354](https://github.com/openclaw/openclaw/issues/51354)

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
    เลย์เอาต์การกำหนดค่าและลำดับความสำคัญ
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    แคตตาล็อกคำสั่งและพฤติกรรม
  </Card>
</CardGroup>
