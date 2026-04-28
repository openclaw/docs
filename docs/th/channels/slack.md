---
read_when:
    - การตั้งค่า Slack หรือการแก้ไขปัญหาโหมด socket/HTTP ของ Slack
summary: การตั้งค่า Slack และพฤติกรรมขณะรัน (Socket Mode + URL คำขอ HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-25T13:42:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8d177cad1e795ecccf31cff486b9c8036bf91b22d122e8afbd9cfaf7635e4ea
    source_path: channels/slack.md
    workflow: 15
---

พร้อมใช้งานระดับ production สำหรับ DM และช่องทางต่าง ๆ ผ่านการผสานรวมแอป Slack โหมดค่าเริ่มต้นคือ Socket Mode และรองรับ URL คำขอ HTTP ด้วย

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ Slack จะใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและคู่มือการซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="Socket Mode (ค่าเริ่มต้น)">
    <Steps>
      <Step title="สร้างแอป Slack ใหม่">
        ในการตั้งค่าแอป Slack ให้กดปุ่ม **[Create New App](https://api.slack.com/apps/new)**:

        - เลือก **from a manifest** และเลือก workspace สำหรับแอปของคุณ
        - วาง [manifest ตัวอย่าง](#manifest-and-scope-checklist) จากด้านล่างและดำเนินการสร้างต่อ
        - สร้าง **App-Level Token** (`xapp-...`) พร้อมสิทธิ์ `connections:write`
        - ติดตั้งแอปและคัดลอก **Bot Token** (`xoxb-...`) ที่แสดง

      </Step>

      <Step title="กำหนดค่า OpenClaw">

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

        env fallback (เฉพาะบัญชีค่าเริ่มต้น):

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

  <Tab title="URL คำขอ HTTP">
    <Steps>
      <Step title="สร้างแอป Slack ใหม่">
        ในการตั้งค่าแอป Slack ให้กดปุ่ม **[Create New App](https://api.slack.com/apps/new)**:

        - เลือก **from a manifest** และเลือก workspace สำหรับแอปของคุณ
        - วาง [manifest ตัวอย่าง](#manifest-and-scope-checklist) และอัปเดต URL ก่อนสร้าง
        - บันทึก **Signing Secret** ไว้สำหรับการตรวจสอบคำขอ
        - ติดตั้งแอปและคัดลอก **Bot Token** (`xoxb-...`) ที่แสดง

      </Step>

      <Step title="กำหนดค่า OpenClaw">

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

        กำหนด `webhookPath` ที่ต่างกันให้แต่ละบัญชี (ค่าเริ่มต้น `/slack/events`) เพื่อไม่ให้การลงทะเบียนชนกัน
        </Note>

      </Step>

      <Step title="เริ่ม gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## รายการตรวจสอบ manifest และ scope

manifest พื้นฐานของแอป Slack ใช้เหมือนกันทั้งสำหรับ Socket Mode และ URL คำขอ HTTP สิ่งที่แตกต่างมีเพียงบล็อก `settings` (และ `url` ของ slash command)

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

สำหรับโหมด **URL คำขอ HTTP** ให้แทนที่ `settings` ด้วยรูปแบบ HTTP และเพิ่ม `url` ให้กับ slash command แต่ละรายการ ต้องใช้ URL สาธารณะ:

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
        /* เหมือน Socket Mode */
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

แสดงความสามารถที่แตกต่างกันซึ่งขยายจากค่าเริ่มต้นข้างต้น

<AccordionGroup>
  <Accordion title="คำสั่ง slash แบบเนทีฟเพิ่มเติม">

    สามารถใช้ [คำสั่ง slash แบบเนทีฟ](#commands-and-slash-behavior) ได้หลายคำสั่งแทนการกำหนดคำสั่งเดียว โดยมีรายละเอียดเพิ่มเติมดังนี้:

    - ใช้ `/agentstatus` แทน `/status` เพราะคำสั่ง `/status` ถูกสงวนไว้
    - ไม่สามารถเปิดใช้ slash command ได้มากกว่า 25 คำสั่งพร้อมกัน

    แทนที่ส่วน `features.slash_commands` เดิมของคุณด้วยชุดย่อยของ[คำสั่งที่ใช้ได้](/th/tools/slash-commands#command-list):

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
      <Tab title="URL คำขอ HTTP">
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
      // ...ทำซ้ำสำหรับทุกคำสั่งโดยใช้ค่า `url` เดียวกัน
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="scope สำหรับ authorship เพิ่มเติม (การเขียน)">
    เพิ่ม bot scope `chat:write.customize` หากคุณต้องการให้ข้อความขาออกใช้ตัวตนของเอเจนต์ที่กำลังทำงานอยู่ (ชื่อผู้ใช้และไอคอนแบบกำหนดเอง) แทนตัวตนค่าเริ่มต้นของแอป Slack

    หากคุณใช้ไอคอนอีโมจิ Slack คาดว่าจะใช้รูปแบบ `:emoji_name:`

  </Accordion>
  <Accordion title="scope ของ user token เพิ่มเติม (การอ่าน)">
    หากคุณกำหนดค่า `channels.slack.userToken` scope สำหรับการอ่านที่ใช้กันโดยทั่วไปคือ:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (หากคุณพึ่งพาการอ่านผ่านการค้นหาของ Slack)

  </Accordion>
</AccordionGroup>

## โมเดล token

- `botToken` + `appToken` จำเป็นสำหรับ Socket Mode
- โหมด HTTP ต้องใช้ `botToken` + `signingSecret`
- `botToken`, `appToken`, `signingSecret` และ `userToken` รองรับทั้งสตริงข้อความล้วนหรือออบเจ็กต์ SecretRef
- token ในคอนฟิกมีลำดับความสำคัญสูงกว่า env fallback
- env fallback ของ `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ใช้ได้เฉพาะกับบัญชีค่าเริ่มต้น
- `userToken` (`xoxp-...`) กำหนดได้เฉพาะในคอนฟิกเท่านั้น (ไม่มี env fallback) และมีพฤติกรรมเริ่มต้นเป็นแบบอ่านอย่างเดียว (`userTokenReadOnly: true`)

พฤติกรรมของ status snapshot:

- การตรวจสอบบัญชี Slack จะติดตามฟิลด์ `*Source` และ `*Status` แยกตามข้อมูลรับรอง (`botToken`, `appToken`, `signingSecret`, `userToken`)
- status อาจเป็น `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าผ่าน SecretRef หรือแหล่งข้อมูลลับแบบไม่ inline อื่น ๆ แต่เส้นทางคำสั่ง/runtime ปัจจุบันไม่สามารถ resolve ค่าจริงได้
- ในโหมด HTTP จะมี `signingSecretStatus`; ใน Socket Mode คู่ที่จำเป็นคือ `botTokenStatus` + `appTokenStatus`

<Tip>
สำหรับการกระทำ/การอ่านไดเรกทอรี อาจเลือกใช้ user token ก่อนหากมีการกำหนดค่าไว้ สำหรับการเขียน bot token ยังคงเป็นตัวเลือกหลัก; การเขียนด้วย user token จะอนุญาตเฉพาะเมื่อ `userTokenReadOnly: false` และ bot token ใช้งานไม่ได้
</Tip>

## การกระทำและเกต

การกระทำของ Slack ถูกควบคุมด้วย `channels.slack.actions.*`

กลุ่มการกระทำที่มีให้ในเครื่องมือ Slack ปัจจุบัน:

| กลุ่ม      | ค่าเริ่มต้น |
| ---------- | ----------- |
| messages   | เปิดใช้งาน |
| reactions  | เปิดใช้งาน |
| pins       | เปิดใช้งาน |
| memberInfo | เปิดใช้งาน |
| emojiList  | เปิดใช้งาน |

การกระทำข้อความของ Slack ที่รองรับในปัจจุบันได้แก่ `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list` โดย `download-file` รับ Slack file ID ที่แสดงใน placeholder ของไฟล์ขาเข้า และส่งคืนตัวอย่างภาพสำหรับไฟล์รูปภาพหรือเมทาดาทาไฟล์ในเครื่องสำหรับไฟล์ประเภทอื่น

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM (แบบเดิม: `channels.slack.dm.policy`):

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.slack.allowFrom` มี `"*"` รวมอยู่ด้วย; แบบเดิม: `channels.slack.dm.allowFrom`)
    - `disabled`

    แฟล็กของ DM:

    - `dm.enabled` (ค่าเริ่มต้น true)
    - `channels.slack.allowFrom` (แนะนำ)
    - `dm.allowFrom` (แบบเดิม)
    - `dm.groupEnabled` (ค่าเริ่มต้นของกลุ่ม DM คือ false)
    - `dm.groupChannels` (allowlist สำหรับ MPIM แบบไม่บังคับ)

    ลำดับความสำคัญสำหรับหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` มีผลเฉพาะกับบัญชี `default`
    - บัญชีที่มีชื่อจะสืบทอด `channels.slack.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตนเอง
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.slack.accounts.default.allowFrom`

    การจับคู่ใน DM ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="นโยบายช่องทาง">
    `channels.slack.groupPolicy` ควบคุมการจัดการช่องทาง:

    - `open`
    - `allowlist`
    - `disabled`

    allowlist ของช่องทางอยู่ภายใต้ `channels.slack.channels` และควรใช้ channel ID ที่คงที่

    หมายเหตุด้าน runtime: หากไม่มี `channels.slack` เลยทั้งหมด (ตั้งค่าผ่าน env เท่านั้น) runtime จะ fallback ไปใช้ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

    การ resolve ชื่อ/ID:

    - รายการ allowlist ของช่องทางและ allowlist ของ DM จะถูก resolve ตอนเริ่มต้นเมื่อการเข้าถึง token อนุญาต
    - รายการชื่อช่องทางที่ resolve ไม่ได้จะคงไว้ตามที่กำหนดค่า แต่จะถูกละเว้นจากการกำหนดเส้นทางเป็นค่าเริ่มต้น
    - การตรวจสิทธิ์ขาเข้าและการกำหนดเส้นทางช่องทางจะยึด ID เป็นหลักโดยค่าเริ่มต้น; การจับคู่ username/slug โดยตรงต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="การกล่าวถึงและผู้ใช้ในช่องทาง">
    ข้อความในช่องทางจะถูกควบคุมด้วยการกล่าวถึงเป็นค่าเริ่มต้น

    แหล่งที่มาของการกล่าวถึง:

    - การกล่าวถึงแอปโดยตรง (`<@botId>`)
    - รูปแบบ regex สำหรับการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`, fallback ไปที่ `messages.groupChat.mentionPatterns`)
    - พฤติกรรม implicit reply-to-bot ในเธรด (จะปิดเมื่อ `thread.requireExplicitMention` เป็น `true`)

    ตัวควบคุมรายช่องทาง (`channels.slack.channels.<id>`; ใช้ชื่อได้เฉพาะผ่านการ resolve ตอนเริ่มต้นหรือ `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ของ `toolsBySender`: `id:`, `e164:`, `username:`, `name:` หรือ wildcard `"*"`
      (คีย์แบบเดิมที่ไม่มี prefix จะยังแมปไปที่ `id:` เท่านั้น)

  </Tab>
</Tabs>

## เธรด เซสชัน และแท็กการตอบกลับ

- DM จะถูกกำหนดเส้นทางเป็น `direct`; ช่องทางเป็น `channel`; MPIM เป็น `group`
- เมื่อใช้ค่าเริ่มต้น `session.dmScope=main`, DM ของ Slack จะถูกรวมเข้ากับเซสชันหลักของเอเจนต์
- เซสชันของช่องทาง: `agent:<agentId>:slack:channel:<channelId>`
- การตอบกลับในเธรดสามารถสร้าง suffix ของ thread session (`:thread:<threadTs>`) ได้เมื่อเกี่ยวข้อง
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความเดิมในเธรดที่ดึงมาเมื่อเริ่ม thread session ใหม่ (ค่าเริ่มต้น `20`; ตั้งค่า `0` เพื่อปิดใช้งาน)
- `channels.slack.thread.requireExplicitMention` (ค่าเริ่มต้น `false`): เมื่อเป็น `true` จะระงับการกล่าวถึงแบบ implicit ในเธรด เพื่อให้บอตตอบกลับเฉพาะการกล่าวถึง `@bot` แบบชัดเจนภายในเธรดเท่านั้น แม้ว่าบอตจะเคยเข้าร่วมในเธรดนั้นแล้วก็ตาม หากไม่ตั้งค่านี้ การตอบกลับในเธรดที่บอตเคยเข้าร่วมจะข้ามการควบคุม `requireMention`

ตัวควบคุมการตอบกลับแบบเธรด:

- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: แยกตาม `direct|group|channel`
- fallback แบบเดิมสำหรับแชตโดยตรง: `channels.slack.dm.replyToMode`

รองรับแท็กตอบกลับแบบกำหนดเอง:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

หมายเหตุ: `replyToMode="off"` จะปิด **การตอบกลับแบบเธรดทั้งหมด** ใน Slack รวมถึงแท็ก `[[reply_to_*]]` แบบชัดเจนด้วย ซึ่งต่างจาก Telegram ที่ยังคงให้เกียรติแท็กแบบชัดเจนแม้อยู่ในโหมด `"off"` — เธรดของ Slack จะซ่อนข้อความจากช่องทาง ขณะที่การตอบกลับของ Telegram ยังมองเห็นได้แบบ inline

## Ack reactions

`ackReaction` จะส่งอีโมจิยืนยันระหว่างที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

ลำดับการ resolve:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback ไปที่อีโมจิตัวตนของเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้นใช้ "👀")

หมายเหตุ:

- Slack คาดว่าจะใช้ shortcode (เช่น `"eyes"`)
- ใช้ `""` เพื่อปิด reaction สำหรับบัญชี Slack นั้นหรือปิดทั้งระบบ

## การสตรีมข้อความ

`channels.slack.streaming` ควบคุมพฤติกรรมพรีวิวแบบสด:

- `off`: ปิดการสตรีมพรีวิวแบบสด
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความพรีวิวด้วยผลลัพธ์บางส่วนล่าสุด
- `block`: ต่อท้ายการอัปเดตพรีวิวแบบแบ่งเป็นช่วง
- `progress`: แสดงข้อความสถานะความคืบหน้าระหว่างการสร้าง จากนั้นส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อพรีวิวแบบร่างทำงานอยู่ ให้กำหนดเส้นทางการอัปเดต tool/progress ไปยังข้อความพรีวิวเดียวกันที่ถูกแก้ไข (ค่าเริ่มต้น: `true`) ตั้งค่าเป็น `false` หากต้องการคงข้อความ tool/progress แยกต่างหาก

`channels.slack.streaming.nativeTransport` ควบคุมการสตรีมข้อความแบบเนทีฟของ Slack เมื่อ `channels.slack.streaming.mode` เป็น `partial` (ค่าเริ่มต้น: `true`)

- ต้องมี reply thread เพื่อให้การสตรีมข้อความแบบเนทีฟและสถานะเธรดผู้ช่วยของ Slack ปรากฏขึ้น การเลือกเธรดยังคงเป็นไปตาม `replyToMode`
- รูทของแชตแบบช่องทางและกลุ่มยังคงใช้พรีวิวแบบร่างปกติได้เมื่อไม่สามารถใช้การสตรีมแบบเนทีฟ
- DM ระดับบนสุดของ Slack จะอยู่นอกเธรดเป็นค่าเริ่มต้น จึงไม่แสดงพรีวิวแบบเธรด; ใช้การตอบกลับในเธรดหรือ `typingReaction` หากคุณต้องการให้เห็นความคืบหน้าในกรณีนั้น
- สื่อและ payload ที่ไม่ใช่ข้อความจะ fallback ไปใช้การส่งแบบปกติ
- ผลลัพธ์สุดท้ายประเภทสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขพรีวิวที่ค้างอยู่; ผลลัพธ์สุดท้ายแบบข้อความ/บล็อกที่เข้าเกณฑ์จะ flush เฉพาะเมื่อสามารถแก้ไขพรีวิวเดิมได้
- หากการสตรีมล้มเหลวระหว่างการตอบกลับ OpenClaw จะ fallback ไปใช้การส่งปกติสำหรับ payload ที่เหลือ

ใช้พรีวิวแบบร่างแทนการสตรีมข้อความแบบเนทีฟของ Slack:

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
- ค่า boolean ของ `channels.slack.streaming` จะถูกย้ายอัตโนมัติไปยัง `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport`
- `channels.slack.nativeStreaming` แบบเดิมจะถูกย้ายอัตโนมัติไปยัง `channels.slack.streaming.nativeTransport`

## fallback ของ typing reaction

`typingReaction` จะเพิ่ม reaction ชั่วคราวให้กับข้อความ Slack ขาเข้าระหว่างที่ OpenClaw กำลังประมวลผลการตอบกลับ จากนั้นจะลบออกเมื่อการรันเสร็จสิ้น ฟีเจอร์นี้มีประโยชน์มากที่สุดนอกเธรดตอบกลับ ซึ่งปกติจะใช้ตัวบ่งชี้สถานะ "is typing..." อยู่แล้ว

ลำดับการ resolve:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack คาดว่าจะใช้ shortcode (เช่น `"hourglass_flowing_sand"`)
- reaction นี้เป็นแบบพยายามเต็มที่ และระบบจะพยายามล้างให้อัตโนมัติหลังการตอบกลับหรือหลังเส้นทางความล้มเหลวเสร็จสิ้น

## สื่อ การแบ่งข้อความ และการส่งต่อ

<AccordionGroup>
  <Accordion title="ไฟล์แนบขาเข้า">
    ไฟล์แนบของ Slack จะถูกดาวน์โหลดจาก URL ส่วนตัวที่โฮสต์โดย Slack (ผ่านโฟลว์คำขอที่ยืนยันตัวตนด้วย token) และเขียนลงใน media store เมื่อดึงสำเร็จและไม่เกินขีดจำกัดขนาด placeholder ของไฟล์จะรวม `fileId` ของ Slack ไว้ เพื่อให้เอเจนต์สามารถดึงไฟล์ต้นฉบับได้ด้วย `download-file`

    ขีดจำกัดขนาดขาเข้าของ runtime มีค่าเริ่มต้นเป็น `20MB` เว้นแต่จะ override ด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="ข้อความและไฟล์ขาออก">
    - การแบ่งข้อความใช้ `channels.slack.textChunkLimit` (ค่าเริ่มต้น 4000)
    - `channels.slack.chunkMode="newline"` เปิดใช้การแยกโดยยึดตามย่อหน้าก่อน
    - การส่งไฟล์ใช้ API อัปโหลดของ Slack และสามารถรวมการตอบกลับในเธรด (`thread_ts`) ได้
    - ขีดจำกัดสื่อขาออกจะอิงตาม `channels.slack.mediaMaxMb` หากกำหนดไว้; มิฉะนั้นการส่งผ่านช่องทางจะใช้ค่าเริ่มต้นตามชนิด MIME จาก media pipeline

  </Accordion>

  <Accordion title="เป้าหมายการส่ง">
    เป้าหมายแบบชัดเจนที่แนะนำ:

    - `user:<id>` สำหรับ DM
    - `channel:<id>` สำหรับช่องทาง

    DM ของ Slack จะถูกเปิดผ่าน API การสนทนาของ Slack เมื่อส่งไปยังเป้าหมายผู้ใช้

  </Accordion>
</AccordionGroup>

## คำสั่งและพฤติกรรมของ slash

คำสั่ง slash จะแสดงใน Slack ได้ทั้งแบบคำสั่งที่กำหนดค่าไว้เพียงคำสั่งเดียว หรือหลายคำสั่งแบบเนทีฟ กำหนดค่า `channels.slack.slashCommand` เพื่อเปลี่ยนค่าเริ่มต้นของคำสั่ง:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

คำสั่งแบบเนทีฟต้องใช้[การตั้งค่า manifest เพิ่มเติม](#additional-manifest-settings) ในแอป Slack ของคุณ และเปิดใช้งานด้วย `channels.slack.commands.native: true` หรือ `commands.native: true` ในคอนฟิกส่วนกลางแทน

- โหมดอัตโนมัติของคำสั่งแบบเนทีฟเป็น **ปิด** สำหรับ Slack ดังนั้น `commands.native: "auto"` จะไม่เปิดใช้คำสั่งแบบเนทีฟของ Slack

```txt
/help
```

เมนูอาร์กิวเมนต์ของคำสั่งแบบเนทีฟใช้กลยุทธ์การแสดงผลแบบปรับตัว ซึ่งจะแสดง modal ยืนยันก่อนส่งค่าตัวเลือกที่เลือก:

- ไม่เกิน 5 ตัวเลือก: บล็อกปุ่ม
- 6-100 ตัวเลือก: เมนูเลือกแบบคงที่
- มากกว่า 100 ตัวเลือก: external select พร้อมการกรองตัวเลือกแบบ async เมื่อมี handler ของตัวเลือก interactivity พร้อมใช้งาน
- เกินขีดจำกัดของ Slack: ค่าตัวเลือกที่เข้ารหัสจะ fallback ไปใช้ปุ่ม

```txt
/think
```

เซสชันของ slash ใช้คีย์แบบ isolated เช่น `agent:<agentId>:slack:slash:<userId>` และยังคงกำหนดเส้นทางการทำงานของคำสั่งไปยังเซสชันการสนทนาเป้าหมายโดยใช้ `CommandTargetSessionKey`

## การตอบกลับแบบโต้ตอบ

Slack สามารถแสดงตัวควบคุมการตอบกลับแบบโต้ตอบที่เอเจนต์สร้างขึ้นได้ แต่ฟีเจอร์นี้ถูกปิดไว้เป็นค่าเริ่มต้น

เปิดใช้งานทั้งระบบ:

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

เมื่อเปิดใช้งานแล้ว เอเจนต์สามารถส่ง directive สำหรับการตอบกลับที่ใช้ได้เฉพาะกับ Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

directive เหล่านี้จะถูกคอมไพล์เป็น Slack Block Kit และกำหนดเส้นทางการคลิกหรือการเลือกกลับผ่านเส้นทางอีเวนต์ interaction ของ Slack ที่มีอยู่เดิม

หมายเหตุ:

- นี่คือ UI ที่เฉพาะกับ Slack ช่องทางอื่นจะไม่แปลง directive ของ Slack Block Kit ไปเป็นระบบปุ่มของตนเอง
- ค่า callback แบบโต้ตอบเป็น token แบบ opaque ที่ OpenClaw สร้างขึ้น ไม่ใช่ค่าดิบที่เอเจนต์เขียนโดยตรง
- หากบล็อกแบบโต้ตอบที่สร้างขึ้นเกินขีดจำกัดของ Slack Block Kit OpenClaw จะ fallback ไปใช้ข้อความตอบกลับเดิมแทนการส่ง payload blocks ที่ไม่ถูกต้อง

## การอนุมัติ Exec ใน Slack

Slack สามารถทำหน้าที่เป็นไคลเอนต์อนุมัติแบบเนทีฟได้ด้วยปุ่มและ interaction แบบโต้ตอบ แทนการ fallback ไปใช้ Web UI หรือเทอร์มินัล

- การอนุมัติ Exec ใช้ `channels.slack.execApprovals.*` สำหรับการกำหนดเส้นทาง DM/ช่องทางแบบเนทีฟ
- การอนุมัติ Plugin ยังสามารถ resolve ผ่านพื้นผิวปุ่มแบบเนทีฟของ Slack เดียวกันได้ เมื่อคำขอนั้นมาถึงใน Slack อยู่แล้ว และชนิด approval id เป็น `plugin:`
- การตรวจสิทธิ์ผู้อนุมัติยังคงถูกบังคับใช้: เฉพาะผู้ใช้ที่ถูกระบุว่าเป็นผู้อนุมัติเท่านั้นที่สามารถอนุมัติหรือปฏิเสธคำขอผ่าน Slack ได้

ระบบนี้ใช้พื้นผิวปุ่มอนุมัติแบบใช้ร่วมกันเดียวกับช่องทางอื่น ๆ เมื่อเปิดใช้ `interactivity` ในการตั้งค่าแอป Slack ของคุณ พรอมป์การอนุมัติจะแสดงเป็นปุ่ม Block Kit โดยตรงภายในการสนทนา
เมื่อมีปุ่มเหล่านี้อยู่ ปุ่มเหล่านี้จะเป็น UX หลักสำหรับการอนุมัติ; OpenClaw ควรใส่คำสั่ง `/approve` แบบกำหนดเองเฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่าการอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติด้วยตนเองเป็นเส้นทางเดียวเท่านั้น

เส้นทางคอนฟิก:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; fallback ไปใช้ `commands.ownerAllowFrom` เมื่อเป็นไปได้)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack จะเปิดใช้การอนุมัติ Exec แบบเนทีฟโดยอัตโนมัติเมื่อ `enabled` ไม่ได้ตั้งค่าไว้หรือเป็น `"auto"` และมีการ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งราย ตั้งค่า `enabled: false` เพื่อปิด Slack ในฐานะไคลเอนต์อนุมัติแบบเนทีฟอย่างชัดเจน
ตั้งค่า `enabled: true` เพื่อบังคับเปิดการอนุมัติแบบเนทีฟเมื่อสามารถ resolve ผู้อนุมัติได้

พฤติกรรมเริ่มต้นเมื่อไม่มีคอนฟิกการอนุมัติ Exec ของ Slack แบบชัดเจน:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

จำเป็นต้องมีคอนฟิกแบบเนทีฟของ Slack แบบชัดเจนก็ต่อเมื่อคุณต้องการ override ผู้อนุมัติ เพิ่มตัวกรอง หรือเลือกใช้การส่งไปยังแชตต้นทาง:

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

การส่งต่อ `approvals.exec` แบบใช้ร่วมกันเป็นคนละส่วนกัน ใช้เฉพาะเมื่อพรอมป์การอนุมัติ Exec ต้องถูกกำหนดเส้นทางไปยังแชตอื่นด้วย หรือไปยังเป้าหมายนอกแบนด์ที่ระบุชัดเจน การส่งต่อ `approvals.plugin` แบบใช้ร่วมกันก็แยกต่างหากเช่นกัน; ปุ่มแบบเนทีฟของ Slack ยังคง resolve การอนุมัติ Plugin ได้เมื่อคำขอเหล่านั้นมาถึงใน Slack อยู่แล้ว

`/approve` ในแชตเดียวกันก็ใช้งานได้ในช่องทางและ DM ของ Slack ที่รองรับคำสั่งอยู่แล้ว ดู [Exec approvals](/th/tools/exec-approvals) สำหรับโมเดลการส่งต่อการอนุมัติทั้งหมด

## อีเวนต์และพฤติกรรมการทำงาน

- การแก้ไข/ลบข้อความจะถูกแมปเป็น system event
- การกระจายเธรด ("Also send to channel" สำหรับการตอบกลับในเธรด) จะถูกประมวลผลเป็นข้อความผู้ใช้ปกติ
- อีเวนต์การเพิ่ม/ลบ reaction จะถูกแมปเป็น system event
- อีเวนต์สมาชิกเข้า/ออก การสร้าง/เปลี่ยนชื่อช่องทาง และการเพิ่ม/ลบ pin จะถูกแมปเป็น system event
- `channel_id_changed` สามารถย้ายคีย์คอนฟิกของช่องทางได้เมื่อเปิดใช้ `configWrites`
- เมทาดาทาหัวข้อ/วัตถุประสงค์ของช่องทางจะถือเป็นบริบทที่ไม่น่าเชื่อถือ และอาจถูกฉีดเข้าไปในบริบทการกำหนดเส้นทาง
- ตัวเริ่มเธรดและการเติมบริบทจากประวัติเธรดเริ่มต้นจะถูกกรองตาม allowlist ของผู้ส่งที่กำหนดค่าไว้เมื่อเกี่ยวข้อง
- block action และ modal interaction จะปล่อย system event แบบมีโครงสร้าง `Slack interaction: ...` พร้อมฟิลด์ payload แบบละเอียด:
  - block action: ค่าที่เลือก ป้ายกำกับ ค่า picker และเมทาดาทา `workflow_*`
  - อีเวนต์ modal `view_submission` และ `view_closed` พร้อมเมทาดาทาของช่องทางที่ถูกกำหนดเส้นทางและอินพุตแบบฟอร์ม

## เอกสารอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [Configuration reference - Slack](/th/gateway/config-channels#slack)

<Accordion title="ฟิลด์ Slack ที่มีสัญญาณสูง">

- โหมด/การยืนยันตัวตน: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (แบบเดิม: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- สวิตช์ความเข้ากันได้: `dangerouslyAllowNameMatching` (ใช้เมื่อจำเป็นจริง ๆ; ควรปิดไว้หากไม่จำเป็น)
- การเข้าถึงช่องทาง: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- เธรด/ประวัติ: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่งต่อ: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- การปฏิบัติการ/ฟีเจอร์: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในช่องทาง">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - allowlist ของช่องทาง (`channels.slack.channels`)
    - `requireMention`
    - allowlist `users` รายช่องทาง

    คำสั่งที่มีประโยชน์:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="ข้อความ DM ถูกละเลย">
    ตรวจสอบ:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (หรือแบบเดิม `channels.slack.dm.policy`)
    - การอนุมัติการจับคู่ / รายการ allowlist
    - อีเวนต์ DM ของ Slack Assistant: บันทึกแบบละเอียดที่ระบุ `drop message_changed`
      มักหมายความว่า Slack ส่งอีเวนต์ Assistant-thread ที่ถูกแก้ไขมาโดยไม่มี
      ผู้ส่งที่เป็นมนุษย์ซึ่งสามารถกู้คืนได้ในเมทาดาทาของข้อความ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode ไม่เชื่อมต่อ">
    ตรวจสอบความถูกต้องของ bot token + app token และการเปิดใช้ Socket Mode ในการตั้งค่าแอป Slack

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` แปลว่าบัญชี Slack
    ถูกกำหนดค่าไว้แล้ว แต่ runtime ปัจจุบันไม่สามารถ resolve
    ค่าที่รองรับด้วย SecretRef ได้

  </Accordion>

  <Accordion title="HTTP mode ไม่ได้รับอีเวนต์">
    ตรวจสอบความถูกต้องของ:

    - signing secret
    - webhook path
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - `webhookPath` ที่ไม่ซ้ำกันสำหรับแต่ละบัญชี HTTP

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏใน snapshot
    ของบัญชี แปลว่าบัญชี HTTP ถูกกำหนดค่าไว้แล้ว แต่ runtime ปัจจุบันไม่สามารถ
    resolve signing secret ที่รองรับด้วย SecretRef ได้

  </Accordion>

  <Accordion title="คำสั่งแบบเนทีฟ/slash ไม่ทำงาน">
    ตรวจสอบว่าคุณตั้งใจใช้แบบใด:

    - โหมดคำสั่งแบบเนทีฟ (`channels.slack.commands.native: true`) พร้อม slash command ที่ลงทะเบียนตรงกันใน Slack
    - หรือโหมดคำสั่ง slash เดี่ยว (`channels.slack.slashCommand.enabled: true`)

    และตรวจสอบ `commands.useAccessGroups` กับ allowlist ของช่องทาง/ผู้ใช้ด้วย

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Slack เข้ากับ gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรมของช่องทางและกลุ่ม DM
  </Card>
  <Card title="การกำหนดเส้นทางช่องทาง" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการทำให้แข็งแรงขึ้น
  </Card>
  <Card title="การกำหนดค่า" icon="sliders" href="/th/gateway/configuration">
    เค้าโครงคอนฟิกและลำดับความสำคัญ
  </Card>
  <Card title="คำสั่ง slash" icon="terminal" href="/th/tools/slash-commands">
    แค็ตตาล็อกคำสั่งและพฤติกรรม
  </Card>
</CardGroup>
