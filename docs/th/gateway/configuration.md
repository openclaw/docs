---
read_when:
    - การตั้งค่า OpenClaw เป็นครั้งแรก
    - กำลังค้นหารูปแบบการกำหนดค่าที่พบบ่อย
    - การนำทางไปยังส่วนการกำหนดค่าเฉพาะ
summary: 'ภาพรวมการกำหนดค่า: งานทั่วไป การตั้งค่าอย่างรวดเร็ว และลิงก์ไปยังข้อมูลอ้างอิงฉบับเต็ม'
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-07-02T09:00:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0044dd771effee8e11d5dfd99e6f14f105089328dcca23f5794ddff4995bca7
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw อ่านการกำหนดค่า <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> ที่เป็นทางเลือกจาก `~/.openclaw/openclaw.json`
พาธการกำหนดค่าที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ เลย์เอาต์ `openclaw.json`
แบบ symlink ไม่รองรับสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ การเขียนแบบ atomic อาจแทนที่
พาธแทนการคง symlink ไว้ หากคุณเก็บการกำหนดค่าไว้นอกไดเรกทอรีสถานะ
เริ่มต้น ให้ชี้ `OPENCLAW_CONFIG_PATH` ไปยังไฟล์จริงโดยตรง

หากไฟล์หายไป OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัย เหตุผลทั่วไปในการเพิ่มการกำหนดค่า:

- เชื่อมต่อช่องทางและควบคุมว่าใครสามารถส่งข้อความถึงบอตได้
- ตั้งค่าโมเดล เครื่องมือ sandboxing หรือ automation (cron, hooks)
- ปรับแต่งเซสชัน สื่อ เครือข่าย หรือ UI

ดู [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference) สำหรับทุกฟิลด์ที่ใช้ได้

เอเจนต์และ automation ควรใช้ `config.schema.lookup` เพื่อดูเอกสาร
ระดับฟิลด์ที่แน่นอนก่อนแก้ไขการกำหนดค่า ใช้หน้านี้สำหรับคำแนะนำตามงาน และ
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) สำหรับแผนผัง
ฟิลด์และค่าเริ่มต้นที่กว้างกว่า

<Tip>
**เพิ่งเริ่มใช้การกำหนดค่าใช่ไหม** เริ่มด้วย `openclaw onboard` สำหรับการตั้งค่าแบบโต้ตอบ หรือดูคู่มือ [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) สำหรับการกำหนดค่าแบบคัดลอกแล้ววางที่ครบถ้วน
</Tip>

## การกำหนดค่าขั้นต่ำ

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## การแก้ไขการกำหนดค่า

<Tabs>
  <Tab title="Interactive wizard">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    เปิด [http://127.0.0.1:18789](http://127.0.0.1:18789) แล้วใช้แท็บ **การกำหนดค่า**
    Control UI แสดงฟอร์มจากสคีมาการกำหนดค่าสด รวมถึงเมตาดาต้าเอกสารของฟิลด์
    `title` / `description` พร้อมสคีมาของ Plugin และช่องทางเมื่อมี
    โดยมีตัวแก้ไข **Raw JSON** เป็นทางออกสำรอง สำหรับ UI แบบเจาะลึก
    และเครื่องมืออื่น Gateway ยังเปิดให้ใช้ `config.schema.lookup` เพื่อ
    ดึงโหนดสคีมาตามพาธหนึ่งรายการพร้อมสรุปลูกโดยตรง
  </Tab>
  <Tab title="Direct edit">
    แก้ไข `~/.openclaw/openclaw.json` โดยตรง Gateway จะเฝ้าดูไฟล์และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ (ดู [hot reload](#config-hot-reload))
  </Tab>
</Tabs>

## การตรวจสอบแบบเข้มงวด

<Warning>
OpenClaw ยอมรับเฉพาะการกำหนดค่าที่ตรงกับสคีมาโดยสมบูรณ์ คีย์ที่ไม่รู้จัก ชนิดข้อมูลผิดรูปแบบ หรือค่าที่ไม่ถูกต้องจะทำให้ Gateway **ปฏิเสธการเริ่มทำงาน** ข้อยกเว้นเดียวในระดับ root คือ `$schema` (string) เพื่อให้ตัวแก้ไขแนบเมตาดาต้า JSON Schema ได้
</Warning>

`openclaw config schema` พิมพ์ JSON Schema มาตรฐานที่ Control UI
และการตรวจสอบใช้ `config.schema.lookup` ดึงโหนดเดียวตามพาธพร้อม
สรุปลูกสำหรับเครื่องมือแบบเจาะลึก เมตาดาต้าเอกสารของฟิลด์ `title`/`description`
ส่งต่อผ่านออบเจ็กต์ซ้อน wildcard (`*`), รายการอาร์เรย์ (`[]`) และกิ่ง `anyOf`/
`oneOf`/`allOf` สคีมา Plugin และช่องทางขณะรันไทม์จะถูกรวมเข้าเมื่อโหลด
manifest registry แล้ว

เมื่อการตรวจสอบล้มเหลว:

- Gateway จะไม่บูต
- ใช้ได้เฉพาะคำสั่งวินิจฉัย (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- เรียกใช้ `openclaw doctor` เพื่อดูปัญหาที่แน่นอน
- เรียกใช้ `openclaw doctor --fix` (หรือ `--yes`) เพื่อใช้การซ่อมแซม

Gateway เก็บสำเนา last-known-good ที่เชื่อถือได้หลังการเริ่มทำงานสำเร็จแต่ละครั้ง
แต่การเริ่มทำงานและ hot reload จะไม่กู้คืนสำเนานั้นโดยอัตโนมัติ หาก `openclaw.json`
ตรวจสอบไม่ผ่าน (รวมถึงการตรวจสอบภายใน Plugin) การเริ่มทำงานของ Gateway จะล้มเหลว หรือ
การโหลดซ้ำจะถูกข้ามและรันไทม์ปัจจุบันจะคงการกำหนดค่าล่าสุดที่ยอมรับไว้
เรียกใช้ `openclaw doctor --fix` (หรือ `--yes`) เพื่อซ่อมแซมการกำหนดค่าที่มีคำนำหน้า/ถูกเขียนทับ หรือ
กู้คืนสำเนา last-known-good การโปรโมตเป็น last-known-good จะถูกข้ามเมื่อ
ตัวเลือกมี placeholder ความลับที่ถูกปกปิด เช่น `***`

## งานทั่วไป

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    แต่ละช่องทางมีส่วนการกำหนดค่าของตัวเองภายใต้ `channels.<provider>` ดูหน้าช่องทางเฉพาะสำหรับขั้นตอนการตั้งค่า:

    - [WhatsApp](/th/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/th/channels/telegram) - `channels.telegram`
    - [Discord](/th/channels/discord) - `channels.discord`
    - [Feishu](/th/channels/feishu) - `channels.feishu`
    - [Google Chat](/th/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/th/channels/msteams) - `channels.msteams`
    - [Slack](/th/channels/slack) - `channels.slack`
    - [Signal](/th/channels/signal) - `channels.signal`
    - [iMessage](/th/channels/imessage) - `channels.imessage`
    - [Mattermost](/th/channels/mattermost) - `channels.mattermost`

    ช่องทางทั้งหมดใช้รูปแบบนโยบาย DM เดียวกัน:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Choose and configure models">
    ตั้งค่าโมเดลหลักและ fallback ที่เป็นทางเลือก:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` กำหนดแค็ตตาล็อกโมเดลและทำหน้าที่เป็น allowlist สำหรับ `/model`; รายการ `provider/*` จะกรอง `/model`, `/models` และตัวเลือกโมเดลให้เหลือ provider ที่เลือก ขณะยังใช้การค้นหาโมเดลแบบไดนามิก
    - ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ allowlist โดยไม่ลบโมเดลที่มีอยู่ การแทนที่แบบธรรมดาที่จะลบรายการจะถูกปฏิเสธ เว้นแต่คุณส่ง `--replace`
    - การอ้างอิงโมเดลใช้รูปแบบ `provider/model` (เช่น `anthropic/claude-opus-4-6`)
    - `agents.defaults.imageMaxDimensionPx` ควบคุมการลดขนาดรูปภาพ transcript/tool (ค่าเริ่มต้น `1200`); ค่าที่ต่ำกว่ามักลดการใช้ vision-token ในการรันที่มีสกรีนช็อตจำนวนมาก
    - ดู [Models CLI](/th/concepts/models) สำหรับการสลับโมเดลในแชต และ [Model Failover](/th/concepts/model-failover) สำหรับการหมุนเวียน auth และพฤติกรรม fallback
    - สำหรับ provider แบบกำหนดเอง/โฮสต์เอง ดู [Custom providers](/th/gateway/config-tools#custom-providers-and-base-urls) ในข้อมูลอ้างอิง

  </Accordion>

  <Accordion title="Control who can message the bot">
    การเข้าถึง DM ถูกควบคุมต่อช่องทางผ่าน `dmPolicy`:

    - `"pairing"` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียวเพื่ออนุมัติ
    - `"allowlist"`: เฉพาะผู้ส่งใน `allowFrom` (หรือที่เก็บการอนุญาตที่จับคู่แล้ว)
    - `"open"`: อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)
    - `"disabled"`: ไม่สนใจ DM ทั้งหมด

    สำหรับกลุ่ม ให้ใช้ `groupPolicy` + `groupAllowFrom` หรือ allowlist เฉพาะช่องทาง

    ดู [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-channels#dm-and-group-access) สำหรับรายละเอียดต่อช่องทาง

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมี mention** กำหนดค่ารูปแบบ trigger ต่อเอเจนต์ การตอบกลับกลุ่ม/ช่องทางปกติจะโพสต์โดยอัตโนมัติ เลือกใช้พาธ message-tool สำหรับห้องที่ใช้ร่วมกันซึ่งเอเจนต์ควรตัดสินใจว่าจะพูดเมื่อใด:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
        },
      },
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Metadata mentions**: @-mentions แบบ native (WhatsApp tap-to-mention, Telegram @bot ฯลฯ)
    - **Text patterns**: รูปแบบ regex ที่ปลอดภัยใน `mentionPatterns`
    - **Visible replies**: `messages.visibleReplies` สามารถบังคับให้ส่งด้วย message-tool ทั่วทั้งระบบ; `messages.groupChat.visibleReplies` แทนที่ค่านั้นสำหรับกลุ่ม/ช่องทาง
    - ดู [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-channels#group-chat-mention-gating) สำหรับโหมด visible reply การแทนที่ต่อช่องทาง และโหมด self-chat

  </Accordion>

  <Accordion title="Restrict skills per agent">
    ใช้ `agents.defaults.skills` เป็น baseline ร่วม จากนั้นแทนที่เอเจนต์เฉพาะ
    ด้วย `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - ละ `agents.defaults.skills` เพื่อให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
    - ละ `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
    - ตั้งค่า `agents.list[].skills: []` เพื่อไม่มี Skills
    - ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config) และ
      [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agents-defaults-skills)

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    ควบคุมว่า gateway จะรีสตาร์ตช่องทางที่ดูค้างอย่างเข้มงวดเพียงใด:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - ตั้งค่า `gateway.channelHealthCheckMinutes: 0` เพื่อปิดการรีสตาร์ตของ health-monitor ทั่วทั้งระบบ
    - `channelStaleEventThresholdMinutes` ควรมากกว่าหรือเท่ากับช่วงเวลาตรวจสอบ
    - ใช้ `channels.<provider>.healthMonitor.enabled` หรือ `channels.<provider>.accounts.<id>.healthMonitor.enabled` เพื่อปิดการรีสตาร์ตอัตโนมัติสำหรับหนึ่งช่องทางหรือบัญชี โดยไม่ปิด monitor ส่วนกลาง
    - ดู [Health Checks](/th/gateway/health) สำหรับการดีบักเชิงปฏิบัติการ และ [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#gateway) สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    ให้ไคลเอนต์ภายในเครื่องมีเวลามากขึ้นในการทำ pre-auth WebSocket handshake บน
    โฮสต์ที่มีโหลดสูงหรือใช้พลังประมวลผลต่ำ:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - ค่าเริ่มต้นคือ `15000` มิลลิวินาที
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ยังคงมีลำดับความสำคัญสูงกว่าสำหรับการ override บริการหรือ shell แบบครั้งเดียว
    - ควรแก้การค้างของ startup/event-loop ก่อน knob นี้มีไว้สำหรับโฮสต์ที่ปกติดีแต่ช้าระหว่าง warmup

  </Accordion>

  <Accordion title="Configure sessions and resets">
    เซสชันควบคุมความต่อเนื่องและการแยกขอบเขตของบทสนทนา:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (ใช้ร่วมกัน) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: ค่าเริ่มต้นส่วนกลางสำหรับการกำหนดเส้นทางเซสชันที่ผูกกับเธรด (Discord รองรับ `/focus`, `/unfocus`, `/agents`, `/session idle` และ `/session max-age`)
    - ดู [การจัดการเซสชัน](/th/concepts/session) สำหรับขอบเขต ลิงก์ตัวตน และนโยบายการส่ง
    - ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#session) สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="เปิดใช้แซนด์บ็อกซ์">
    เรียกใช้เซสชันตัวแทนในรันไทม์แซนด์บ็อกซ์ที่แยกโดดเดี่ยว:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    สร้างอิมเมจก่อน - จากเช็กเอาต์ซอร์สให้เรียกใช้ `scripts/sandbox-setup.sh` หรือจากการติดตั้ง npm ให้ดูคำสั่ง `docker build` แบบอินไลน์ใน [แซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup)

    ดู [แซนด์บ็อกซ์](/th/gateway/sandboxing) สำหรับคู่มือฉบับเต็ม และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#agentsdefaultssandbox) สำหรับตัวเลือกทั้งหมด

  </Accordion>

  <Accordion title="เปิดใช้พุชที่มีรีเลย์รองรับสำหรับบิลด์ iOS ทางการ">
    พุชที่มีรีเลย์รองรับสำหรับบิลด์ App Store สาธารณะใช้รีเลย์ OpenClaw ที่โฮสต์ไว้: `https://ios-push-relay.openclaw.ai`

    การปรับใช้รีเลย์แบบกำหนดเองต้องใช้เส้นทางบิลด์/ปรับใช้ iOS ที่แยกอย่างตั้งใจ ซึ่ง URL รีเลย์ตรงกับ URL รีเลย์ของ Gateway หากคุณใช้บิลด์รีเลย์แบบกำหนดเอง ให้ตั้งค่านี้ในการกำหนดค่า Gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    คำสั่ง CLI เทียบเท่า:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    สิ่งที่การตั้งค่านี้ทำ:

    - ให้ Gateway ส่ง `push.test`, การสะกิดปลุก และการปลุกเพื่อเชื่อมต่อใหม่ผ่านรีเลย์ภายนอกได้
    - ใช้สิทธิ์ส่งที่จำกัดตามการลงทะเบียนซึ่งส่งต่อโดยแอป iOS ที่จับคู่ไว้ Gateway ไม่จำเป็นต้องมีโทเค็นรีเลย์ระดับการปรับใช้ทั้งหมด
    - ผูกการลงทะเบียนที่มีรีเลย์รองรับแต่ละรายการกับตัวตนของ Gateway ที่แอป iOS จับคู่ไว้ เพื่อไม่ให้ Gateway อื่นใช้การลงทะเบียนที่จัดเก็บไว้ซ้ำได้
    - คงบิลด์ iOS แบบ local/แมนนวลไว้บน APNs โดยตรง การส่งที่มีรีเลย์รองรับใช้กับบิลด์ที่แจกจ่ายอย่างเป็นทางการซึ่งลงทะเบียนผ่านรีเลย์เท่านั้น
    - ต้องตรงกับ URL ฐานของรีเลย์ที่ฝังไว้ในบิลด์ iOS เพื่อให้ทราฟฟิกการลงทะเบียนและการส่งไปถึงการปรับใช้รีเลย์เดียวกัน

    โฟลว์ตั้งแต่ต้นจนจบ:

    1. ติดตั้งแอป iOS ทางการ
    2. ไม่บังคับ: กำหนดค่า `gateway.push.apns.relay.baseUrl` บน Gateway เฉพาะเมื่อใช้บิลด์รีเลย์แบบกำหนดเองที่แยกอย่างตั้งใจ
    3. จับคู่แอป iOS กับ Gateway และให้ทั้งเซสชันของ node และผู้ปฏิบัติงานเชื่อมต่อ
    4. แอป iOS ดึงตัวตนของ Gateway ลงทะเบียนกับรีเลย์โดยใช้ App Attest พร้อมใบเสร็จของแอป จากนั้นเผยแพร่เพย์โหลด `push.apns.register` ที่มีรีเลย์รองรับไปยัง Gateway ที่จับคู่ไว้
    5. Gateway จัดเก็บแฮนเดิลรีเลย์และสิทธิ์ส่ง จากนั้นใช้สำหรับ `push.test`, การสะกิดปลุก และการปลุกเพื่อเชื่อมต่อใหม่

    หมายเหตุการปฏิบัติงาน:

    - หากคุณสลับแอป iOS ไปยัง Gateway อื่น ให้เชื่อมต่อแอปใหม่เพื่อให้เผยแพร่การลงทะเบียนรีเลย์ใหม่ที่ผูกกับ Gateway นั้นได้
    - หากคุณส่งบิลด์ iOS ใหม่ที่ชี้ไปยังการปรับใช้รีเลย์อื่น แอปจะรีเฟรชการลงทะเบียนรีเลย์ที่แคชไว้แทนการใช้ต้นทางรีเลย์เดิมซ้ำ

    หมายเหตุความเข้ากันได้:

    - `OPENCLAW_APNS_RELAY_BASE_URL` และ `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ยังใช้งานได้เป็นการแทนที่ผ่าน env ชั่วคราว
    - URL รีเลย์ Gateway แบบกำหนดเองต้องตรงกับ URL ฐานของรีเลย์ที่ฝังไว้ในบิลด์ iOS ช่องทางเผยแพร่ App Store สาธารณะจะปฏิเสธการแทนที่ URL รีเลย์ iOS แบบกำหนดเอง
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` ยังคงเป็นช่องทางเลี่ยงสำหรับการพัฒนาแบบ loopback เท่านั้น อย่าคง URL รีเลย์ HTTP ไว้ในการกำหนดค่า

    ดู [แอป iOS](/th/platforms/ios#relay-backed-push-for-official-builds) สำหรับโฟลว์ตั้งแต่ต้นจนจบ และ [โฟลว์การตรวจสอบสิทธิ์และความเชื่อถือ](/th/platforms/ios#authentication-and-trust-flow) สำหรับโมเดลความปลอดภัยของรีเลย์

  </Accordion>

  <Accordion title="ตั้งค่า Heartbeat (การเช็กอินเป็นระยะ)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: สตริงระยะเวลา (`30m`, `2h`) ตั้งค่า `0m` เพื่อปิดใช้งาน
    - `target`: `last` | `none` | `<channel-id>` (เช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`)
    - `directPolicy`: `allow` (ค่าเริ่มต้น) หรือ `block` สำหรับเป้าหมาย Heartbeat รูปแบบ DM
    - ดู [Heartbeat](/th/gateway/heartbeat) สำหรับคู่มือฉบับเต็ม

  </Accordion>

  <Accordion title="กำหนดค่างาน Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: ตัดเซสชันรันแบบแยกที่เสร็จแล้วออกจาก `sessions.json` (ค่าเริ่มต้น `24h`; ตั้งค่า `false` เพื่อปิดใช้งาน)
    - `runLog`: ตัดแถวประวัติการรัน Cron ที่เก็บไว้ต่อหนึ่งงาน `maxBytes` ยังคงยอมรับสำหรับบันทึกการรันรุ่นเก่าที่มีไฟล์รองรับ
    - ดู [งาน Cron](/th/automation/cron-jobs) สำหรับภาพรวมฟีเจอร์และตัวอย่าง CLI

  </Accordion>

  <Accordion title="ตั้งค่า Webhook (hooks)">
    เปิดใช้เอนด์พอยต์ HTTP Webhook บน Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    หมายเหตุด้านความปลอดภัย:
    - ถือว่าเนื้อหาเพย์โหลด hook/webhook ทั้งหมดเป็นอินพุตที่ไม่น่าเชื่อถือ
    - ใช้ `hooks.token` เฉพาะ อย่าใช้ความลับการตรวจสอบสิทธิ์ Gateway ที่ใช้งานอยู่ซ้ำ (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`)
    - การตรวจสอบสิทธิ์ Hook ใช้เฉพาะส่วนหัว (`Authorization: Bearer ...` หรือ `x-openclaw-token`); โทเค็นใน query string จะถูกปฏิเสธ
    - `hooks.path` เป็น `/` ไม่ได้ ให้คงทางเข้า Webhook ไว้บนพาธย่อยเฉพาะ เช่น `/hooks`
    - ปิดแฟล็กข้ามเนื้อหาที่ไม่ปลอดภัยไว้ (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) เว้นแต่กำลังดีบักในขอบเขตที่จำกัดมาก
    - หากคุณเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วย เพื่อจำกัดคีย์เซสชันที่ผู้เรียกเลือกได้
    - สำหรับตัวแทนที่ขับเคลื่อนด้วย hook ให้เลือกเทียร์โมเดลสมัยใหม่ที่แข็งแกร่งและนโยบายเครื่องมือที่เข้มงวด (เช่น เฉพาะการส่งข้อความบวกกับแซนด์บ็อกซ์เมื่อทำได้)

    ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#hooks) สำหรับตัวเลือกการแมปทั้งหมดและการผสานรวม Gmail

  </Accordion>

  <Accordion title="กำหนดค่าการกำหนดเส้นทางหลายตัวแทน">
    เรียกใช้ตัวแทนหลายตัวที่แยกโดดเดี่ยว โดยมีเวิร์กสเปซและเซสชันแยกกัน:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    ดู [หลายตัวแทน](/th/concepts/multi-agent) และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#multi-agent-routing) สำหรับกฎการผูกและโปรไฟล์การเข้าถึงต่อหนึ่งตัวแทน

  </Accordion>

  <Accordion title="แยกการกำหนดค่าเป็นหลายไฟล์ ($include)">
    ใช้ `$include` เพื่อจัดระเบียบการกำหนดค่าขนาดใหญ่:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **ไฟล์เดียว**: แทนที่อ็อบเจกต์ที่บรรจุอยู่
    - **อาร์เรย์ของไฟล์**: ผสานแบบลึกตามลำดับ (รายการหลังชนะ)
    - **คีย์พี่น้อง**: ผสานหลัง include (เขียนทับค่าที่ include มา)
    - **Include ซ้อนกัน**: รองรับลึกได้ถึง 10 ระดับ
    - **พาธสัมพัทธ์**: แก้พาธโดยอิงกับไฟล์ที่ include
    - **รูปแบบพาธ**: พาธ include ต้องไม่มีไบต์ null และต้องสั้นกว่า 4096 อักขระอย่างเคร่งครัด ทั้งก่อนและหลังการแก้พาธ
    - **การเขียนที่ OpenClaw เป็นเจ้าของ**: เมื่อการเขียนเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วน
      ที่มี include แบบไฟล์เดียวรองรับอยู่ เช่น `plugins: { $include: "./plugins.json5" }`
      OpenClaw จะอัปเดตไฟล์ที่ include นั้นและปล่อย `openclaw.json` ไว้เหมือนเดิม
    - **การเขียนทะลุที่ไม่รองรับ**: include ที่ราก, อาร์เรย์ include และ include
      ที่มีการเขียนทับโดยคีย์พี่น้องจะล้มเหลวแบบปิดสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ แทนที่จะ
      flatten การกำหนดค่า
    - **การจำกัดขอบเขต**: พาธ `$include` ต้องแก้พาธไปอยู่ใต้ไดเรกทอรีที่เก็บ
      `openclaw.json` หากต้องการแชร์ทรีข้ามเครื่องหรือผู้ใช้ ให้ตั้งค่า
      `OPENCLAW_INCLUDE_ROOTS` เป็นรายการพาธ (`:` บน POSIX, `;` บน Windows) ของ
      ไดเรกทอรีเพิ่มเติมที่ include อ้างอิงได้ Symlink จะถูกแก้พาธ
      และตรวจสอบซ้ำ ดังนั้นพาธที่ตามตัวอักษรอยู่ในไดเรกทอรี config แต่เป้าหมายจริง
      หลุดออกจาก root ที่อนุญาตทุกตัวก็ยังถูกปฏิเสธ
    - **การจัดการข้อผิดพลาด**: ข้อผิดพลาดที่ชัดเจนสำหรับไฟล์ที่หายไป ข้อผิดพลาดการพาร์ส include แบบวงกลม รูปแบบพาธไม่ถูกต้อง และความยาวเกินกำหนด

  </Accordion>
</AccordionGroup>

## การโหลดการกำหนดค่าใหม่แบบ hot

Gateway เฝ้าดู `~/.openclaw/openclaw.json` และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ - ไม่จำเป็นต้องรีสตาร์ทด้วยตนเองสำหรับการตั้งค่าส่วนใหญ่

การแก้ไขไฟล์โดยตรงจะถือว่าไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบ watcher จะรอ
ให้การเขียนไฟล์ชั่วคราว/การเปลี่ยนชื่อจากตัวแก้ไขสงบลง อ่านไฟล์สุดท้าย และปฏิเสธ
การแก้ไขภายนอกที่ไม่ถูกต้องโดยไม่เขียน `openclaw.json` ใหม่ การเขียน config
ที่ OpenClaw เป็นเจ้าของใช้ด่าน schema เดียวกันก่อนเขียน การเขียนทับแบบทำลาย เช่น
การลบ `gateway.mode` หรือทำให้ไฟล์เล็กลงมากกว่าครึ่ง จะถูกปฏิเสธและ
บันทึกเป็น `.rejected.*` เพื่อการตรวจสอบ

หากคุณเห็น `config reload skipped (invalid config)` หรือการเริ่มต้นรายงาน `Invalid
config` ให้ตรวจสอบ config เรียกใช้ `openclaw config validate` จากนั้นเรียกใช้ `openclaw
doctor --fix` เพื่อซ่อมแซม ดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config)
สำหรับเช็กลิสต์

### โหมดการโหลดใหม่

| โหมด                   | พฤติกรรม                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (ค่าเริ่มต้น) | นำการเปลี่ยนแปลงที่ปลอดภัยไปใช้แบบ hot ทันที รีสตาร์ทโดยอัตโนมัติสำหรับการเปลี่ยนแปลงที่สำคัญ           |
| **`hot`**              | นำเฉพาะการเปลี่ยนแปลงที่ปลอดภัยไปใช้แบบ hot บันทึกคำเตือนเมื่อต้องรีสตาร์ท - คุณจัดการเอง |
| **`restart`**          | รีสตาร์ท Gateway เมื่อมีการเปลี่ยนแปลง config ไม่ว่าจะปลอดภัยหรือไม่                                 |
| **`off`**              | ปิดการเฝ้าดูไฟล์ การเปลี่ยนแปลงจะมีผลเมื่อรีสตาร์ทด้วยตนเองครั้งถัดไป                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### สิ่งที่นำไปใช้แบบ hot ได้เทียบกับสิ่งที่ต้องรีสตาร์ท

ฟิลด์ส่วนใหญ่สามารถนำไปใช้แบบ hot ได้โดยไม่ต้องหยุดทำงาน ในโหมด `hybrid` การเปลี่ยนแปลงที่ต้องรีสตาร์ทจะได้รับการจัดการโดยอัตโนมัติ

| หมวดหมู่            | ฟิลด์                                                            | ต้องรีสตาร์ทหรือไม่ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| ช่องทาง            | `channels.*`, `web` (WhatsApp) - ช่องทางในตัวและช่องทาง Plugin ทั้งหมด | ไม่              |
| Agent และโมเดล      | `agent`, `agents`, `models`, `routing`                            | ไม่              |
| ระบบอัตโนมัติ          | `hooks`, `cron`, `agent.heartbeat`                                | ไม่              |
| เซสชันและข้อความ | `session`, `messages`                                             | ไม่              |
| เครื่องมือและสื่อ       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | ไม่              |
| UI และเบ็ดเตล็ด           | `ui`, `logging`, `identity`, `bindings`                           | ไม่              |
| เซิร์ฟเวอร์ Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **ใช่**         |
| โครงสร้างพื้นฐาน      | `discovery`, `plugins`                                            | **ใช่**         |

<Note>
`gateway.reload` และ `gateway.remote` เป็นข้อยกเว้น - การเปลี่ยนค่าเหล่านี้จะ**ไม่**ทำให้เกิดการรีสตาร์ท
</Note>

### การวางแผนรีโหลด

เมื่อคุณแก้ไขไฟล์ต้นทางที่ถูกอ้างอิงผ่าน `$include` OpenClaw จะวางแผน
การรีโหลดจากเลย์เอาต์ที่เขียนไว้ในต้นทาง ไม่ใช่มุมมองในหน่วยความจำที่ถูกแผ่ให้แบนแล้ว
วิธีนี้ทำให้การตัดสินใจ hot-reload (hot-apply เทียบกับ restart) คาดการณ์ได้ แม้เมื่อ
ส่วนระดับบนสุดส่วนเดียวอยู่ในไฟล์ included ของตัวเอง เช่น
`plugins: { $include: "./plugins.json5" }` การวางแผนรีโหลดจะล้มเหลวแบบปิดหาก
เลย์เอาต์ต้นทางกำกวม

## Config RPC (การอัปเดตเชิงโปรแกรม)

สำหรับเครื่องมือที่เขียน config ผ่าน Gateway API แนะนำให้ใช้ลำดับนี้:

- `config.schema.lookup` เพื่อตรวจสอบ subtree หนึ่งรายการ (โหนด schema แบบตื้น + สรุป child)
- `config.get` เพื่อดึง snapshot ปัจจุบันพร้อม `hash`
- `config.patch` สำหรับการอัปเดตบางส่วน (JSON merge patch: object จะ merge กัน, `null`
  จะลบ, array จะ replace เมื่อยืนยันอย่างชัดเจนด้วย `replacePaths` หาก
  รายการจะถูกนำออก)
- `config.apply` เฉพาะเมื่อคุณตั้งใจจะแทนที่ config ทั้งหมด
- `update.run` สำหรับการ self-update พร้อม restart อย่างชัดเจน; ใส่ `continuationMessage` เมื่อเซสชันหลังรีสตาร์ทควรรัน follow-up turn หนึ่งครั้ง
- `update.status` เพื่อตรวจสอบ update restart sentinel ล่าสุดและยืนยันเวอร์ชันที่กำลังรันหลังการรีสตาร์ท

Agents ควรถือว่า `config.schema.lookup` เป็นจุดเริ่มต้นสำหรับเอกสารและข้อจำกัด
ระดับฟิลด์ที่แม่นยำ ใช้ [Configuration reference](/th/gateway/configuration-reference)
เมื่อจำเป็นต้องดูแผนผัง config ที่กว้างขึ้น ค่าเริ่มต้น หรือลิงก์ไปยัง reference
ของ subsystem เฉพาะ

<Note>
การเขียน control-plane (`config.apply`, `config.patch`, `update.run`) ถูก
จำกัดอัตราไว้ที่ 3 คำขอต่อ 60 วินาทีต่อ `deviceId+clientIp` คำขอ restart
จะถูกรวมกัน แล้วบังคับใช้ cooldown 30 วินาทีระหว่างรอบการ restart
`update.status` เป็นแบบอ่านอย่างเดียว แต่จำกัดเฉพาะ admin เพราะ restart sentinel สามารถ
มีสรุปขั้นตอนการอัปเดตและส่วนท้ายของ output คำสั่งได้
</Note>

ตัวอย่าง partial patch:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

ทั้ง `config.apply` และ `config.patch` รับ `raw`, `baseHash`, `sessionKey`,
`note` และ `restartDelayMs` ต้องมี `baseHash` สำหรับทั้งสอง method เมื่อมี
config อยู่แล้ว

`config.patch` ยังรับ `replacePaths` ซึ่งเป็น array ของ path ใน config ที่การแทนที่ array
เป็นความตั้งใจ หาก patch จะแทนที่หรือลบ array ที่มีอยู่ด้วยรายการที่น้อยลง
Gateway จะปฏิเสธการเขียน เว้นแต่ path ที่ตรงกันนั้นจะปรากฏใน
`replacePaths`; array ซ้อนภายใต้รายการ array ใช้ `[]` เช่น
`agents.list[].skills` วิธีนี้ป้องกันไม่ให้ snapshot จาก `config.get` ที่ถูกตัดทอน
เขียนทับ array ของ routing หรือ allowlist โดยไม่ตั้งใจ ใช้ `config.apply` เมื่อคุณ
ตั้งใจจะแทนที่ config ทั้งหมด

## ตัวแปรสภาพแวดล้อม

OpenClaw อ่าน env vars จาก parent process รวมถึง:

- `.env` จากไดเรกทอรีทำงานปัจจุบัน (ถ้ามี)
- `~/.openclaw/.env` (global fallback)

ไฟล์ทั้งสองจะไม่ override env vars ที่มีอยู่ คุณยังสามารถตั้งค่า env vars แบบ inline ใน config ได้:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="การนำเข้า shell env (ไม่บังคับ)">
  หากเปิดใช้และ key ที่คาดไว้ยังไม่ได้ตั้งค่า OpenClaw จะรัน login shell ของคุณและนำเข้าเฉพาะ key ที่ขาดอยู่:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env var ที่เทียบเท่า: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="การแทนที่ env var ในค่า config">
  อ้างอิง env vars ในค่า string ใดก็ได้ของ config ด้วย `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

กฎ:

- จับคู่เฉพาะชื่ออักษรตัวใหญ่: `[A-Z_][A-Z0-9_]*`
- vars ที่ขาดหายหรือว่างจะ throw error ตอนโหลด
- Escape ด้วย `$${VAR}` สำหรับ output แบบ literal
- ใช้งานได้ภายในไฟล์ `$include`
- การแทนที่แบบ inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
  สำหรับฟิลด์ที่รองรับ object SecretRef คุณสามารถใช้:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

รายละเอียด SecretRef (รวมถึง `secrets.providers` สำหรับ `env`/`file`/`exec`) อยู่ใน [Secrets Management](/th/gateway/secrets)
path credential ที่รองรับระบุไว้ใน [SecretRef Credential Surface](/th/reference/secretref-credential-surface)
</Accordion>

ดู [Environment](/th/help/environment) สำหรับ precedence และแหล่งที่มาทั้งหมด

## Reference ฉบับเต็ม

สำหรับ reference แบบครบทุกฟิลด์ ดู **[Configuration Reference](/th/gateway/configuration-reference)**

---

_ที่เกี่ยวข้อง: [Configuration Examples](/th/gateway/configuration-examples) · [Configuration Reference](/th/gateway/configuration-reference) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [Configuration reference](/th/gateway/configuration-reference)
- [Configuration examples](/th/gateway/configuration-examples)
- [Gateway runbook](/th/gateway)
