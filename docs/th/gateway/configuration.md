---
read_when:
    - การตั้งค่า OpenClaw เป็นครั้งแรก
    - กำลังมองหารูปแบบการกำหนดค่าทั่วไป
    - การนำทางไปยังส่วนการกำหนดค่าเฉพาะ
summary: 'ภาพรวมการกำหนดค่า: งานทั่วไป การตั้งค่าแบบรวดเร็ว และลิงก์ไปยังเอกสารอ้างอิงฉบับเต็ม'
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-05-10T19:37:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023ce17d31ed16e061516a2026ac6c31fd8716548e230d27a7965b9a2d8c59c1
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw อ่านการกำหนดค่า <Tooltip tip="JSON5 รองรับคอมเมนต์และจุลภาคท้ายรายการ">**JSON5**</Tooltip> แบบไม่บังคับจาก `~/.openclaw/openclaw.json`.
พาธการกำหนดค่าที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ เลย์เอาต์ `openclaw.json`
ที่เป็น symlink ไม่รองรับสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ การเขียนแบบอะตอมิกอาจแทนที่
พาธแทนการรักษา symlink ไว้ หากคุณเก็บการกำหนดค่าไว้นอกไดเรกทอรีสถานะ
เริ่มต้น ให้ชี้ `OPENCLAW_CONFIG_PATH` ไปยังไฟล์จริงโดยตรง

หากไม่มีไฟล์ OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัย เหตุผลทั่วไปในการเพิ่มการกำหนดค่า:

- เชื่อมต่อช่องทางและควบคุมว่าใครสามารถส่งข้อความถึงบอทได้
- ตั้งค่าโมเดล เครื่องมือ sandboxing หรือระบบอัตโนมัติ (cron, hooks)
- ปรับแต่งเซสชัน สื่อ เครือข่าย หรือ UI

ดู[เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference)สำหรับทุกฟิลด์ที่มี

เอเจนต์และระบบอัตโนมัติควรใช้ `config.schema.lookup` เพื่อดูเอกสารระดับฟิลด์
ที่แม่นยำก่อนแก้ไขการกำหนดค่า ใช้หน้านี้สำหรับคำแนะนำตามงาน และ
[เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) สำหรับแผนที่
ฟิลด์และค่าเริ่มต้นที่กว้างขึ้น

<Tip>
**เพิ่งเริ่มใช้การกำหนดค่าใช่ไหม** เริ่มด้วย `openclaw onboard` สำหรับการตั้งค่าแบบโต้ตอบ หรือดูคู่มือ [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) สำหรับการกำหนดค่าแบบคัดลอกแล้ววางได้ครบถ้วน
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
  <Tab title="วิซาร์ดแบบโต้ตอบ">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (คำสั่งบรรทัดเดียว)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="UI ควบคุม">
    เปิด [http://127.0.0.1:18789](http://127.0.0.1:18789) แล้วใช้แท็บ **การกำหนดค่า**
    UI ควบคุมจะแสดงฟอร์มจากสคีมาการกำหนดค่าสด รวมถึงเมทาดาทาเอกสาร
    `title` / `description` ของฟิลด์ รวมถึงสคีมาของ Plugin และช่องทางเมื่อ
    มีให้ใช้งาน พร้อมตัวแก้ไข **Raw JSON** เป็นทางออกสำรอง สำหรับ UI แบบเจาะลึก
    และเครื่องมืออื่น Gateway ยังเปิดให้ใช้ `config.schema.lookup` เพื่อ
    ดึงโหนดสคีมาที่จำกัดตามพาธหนึ่งรายการ พร้อมสรุปลูกโดยตรง
  </Tab>
  <Tab title="แก้ไขโดยตรง">
    แก้ไข `~/.openclaw/openclaw.json` โดยตรง Gateway จะเฝ้าดูไฟล์และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ (ดู [hot reload](#config-hot-reload))
  </Tab>
</Tabs>

## การตรวจสอบความถูกต้องแบบเข้มงวด

<Warning>
OpenClaw ยอมรับเฉพาะการกำหนดค่าที่ตรงกับสคีมาอย่างสมบูรณ์เท่านั้น คีย์ที่ไม่รู้จัก ชนิดข้อมูลที่ผิดรูปแบบ หรือค่าที่ไม่ถูกต้องจะทำให้ Gateway **ปฏิเสธการเริ่มทำงาน** ข้อยกเว้นระดับรากเพียงอย่างเดียวคือ `$schema` (สตริง) เพื่อให้ตัวแก้ไขแนบเมทาดาทา JSON Schema ได้
</Warning>

`openclaw config schema` พิมพ์ JSON Schema แบบ canonical ที่ใช้โดย UI ควบคุม
และการตรวจสอบความถูกต้อง `config.schema.lookup` ดึงโหนดเดียวที่จำกัดตามพาธพร้อม
สรุปลูกสำหรับเครื่องมือแบบเจาะลึก เมทาดาทาเอกสาร `title`/`description` ของฟิลด์
จะส่งต่อผ่านอ็อบเจกต์ซ้อน wildcard (`*`), array-item (`[]`) และกิ่ง `anyOf`/
`oneOf`/`allOf` สคีมาของ Runtime Plugin และช่องทางจะถูกผสานเข้ามาเมื่อโหลด
registry ของ manifest แล้ว

เมื่อการตรวจสอบความถูกต้องล้มเหลว:

- Gateway จะไม่บูต
- ใช้ได้เฉพาะคำสั่งวินิจฉัย (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- เรียกใช้ `openclaw doctor` เพื่อดูปัญหาที่แน่นอน
- เรียกใช้ `openclaw doctor --fix` (หรือ `--yes`) เพื่อใช้การซ่อมแซม

Gateway เก็บสำเนาที่เชื่อถือได้ซึ่งใช้งานได้ล่าสุดหลังการเริ่มทำงานสำเร็จแต่ละครั้ง
แต่การเริ่มทำงานและ hot reload จะไม่กู้คืนสำเนานั้นโดยอัตโนมัติ หาก `openclaw.json`
ตรวจสอบความถูกต้องไม่ผ่าน (รวมถึงการตรวจสอบภายใน Plugin) การเริ่มทำงานของ Gateway จะล้มเหลว หรือ
การโหลดซ้ำจะถูกข้ามและ Runtime ปัจจุบันจะคงการกำหนดค่าที่รับไว้ล่าสุดไว้
เรียกใช้ `openclaw doctor --fix` (หรือ `--yes`) เพื่อซ่อมแซมการกำหนดค่าที่มีคำนำหน้าหรือถูกทับ
หรือกู้คืนสำเนาที่ใช้งานได้ล่าสุด การเลื่อนสถานะเป็นสำเนาที่ใช้งานได้ล่าสุดจะถูกข้ามเมื่อ
ตัวเลือกมี placeholder ความลับที่ถูกปกปิด เช่น `***`

## งานทั่วไป

<AccordionGroup>
  <Accordion title="ตั้งค่าช่องทาง (WhatsApp, Telegram, Discord ฯลฯ)">
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

    ทุกช่องทางใช้รูปแบบนโยบาย DM เดียวกัน:

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

  <Accordion title="เลือกและกำหนดค่าโมเดล">
    ตั้งค่าโมเดลหลักและ fallback แบบไม่บังคับ:

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

    - `agents.defaults.models` กำหนดแคตตาล็อกโมเดลและทำหน้าที่เป็น allowlist สำหรับ `/model`; รายการ `provider/*` จะกรอง `/model`, `/models` และตัวเลือกโมเดลให้เหลือ provider ที่เลือกไว้ โดยยังคงใช้การค้นพบโมเดลแบบไดนามิก
    - ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ allowlist โดยไม่ลบโมเดลที่มีอยู่ การแทนที่แบบธรรมดาที่จะลบรายการจะถูกปฏิเสธ เว้นแต่คุณส่ง `--replace`
    - Model refs ใช้รูปแบบ `provider/model` (เช่น `anthropic/claude-opus-4-6`)
    - `agents.defaults.imageMaxDimensionPx` ควบคุมการลดขนาดภาพใน transcript/tool (ค่าเริ่มต้น `1200`); ค่าที่ต่ำกว่ามักลดการใช้ vision-token ในการรันที่มีภาพหน้าจอจำนวนมาก
    - ดู [Models CLI](/th/concepts/models) สำหรับการสลับโมเดลในแชต และ [Model Failover](/th/concepts/model-failover) สำหรับการหมุนเวียน auth และพฤติกรรม fallback
    - สำหรับ provider แบบกำหนดเอง/โฮสต์เอง ดู [provider แบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls) ในเอกสารอ้างอิง

  </Accordion>

  <Accordion title="ควบคุมว่าใครสามารถส่งข้อความถึงบอทได้">
    การเข้าถึง DM ถูกควบคุมต่อช่องทางผ่าน `dmPolicy`:

    - `"pairing"` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing แบบใช้ครั้งเดียวเพื่ออนุมัติ
    - `"allowlist"`: เฉพาะผู้ส่งใน `allowFrom` (หรือ paired allow store)
    - `"open"`: อนุญาต DM ขาเข้าทั้งหมด (ต้องมี `allowFrom: ["*"]`)
    - `"disabled"`: เพิกเฉยต่อ DM ทั้งหมด

    สำหรับกลุ่ม ให้ใช้ `groupPolicy` + `groupAllowFrom` หรือ allowlist เฉพาะช่องทาง

    ดู[เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#dm-and-group-access)สำหรับรายละเอียดรายช่องทาง

  </Accordion>

  <Accordion title="ตั้งค่าการควบคุมการกล่าวถึงในแชตกลุ่ม">
    ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องกล่าวถึง** กำหนดค่ารูปแบบ trigger ต่อเอเจนต์ และให้การตอบกลับในห้องที่มองเห็นได้อยู่บนพาธเครื่องมือข้อความเริ่มต้น เว้นแต่คุณตั้งใจต้องการการตอบกลับสุดท้ายอัตโนมัติแบบเดิม:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // default; use "automatic" for legacy room replies
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

    - **การกล่าวถึงด้วยเมทาดาทา**: @-mentions แบบ native (WhatsApp tap-to-mention, Telegram @bot ฯลฯ)
    - **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `mentionPatterns`
    - **การตอบกลับที่มองเห็นได้**: `messages.visibleReplies` สามารถกำหนดให้ใช้การส่งด้วยเครื่องมือข้อความทั่วทั้งระบบ; `messages.groupChat.visibleReplies` จะแทนที่ค่านั้นสำหรับกลุ่ม/ช่องทาง
    - ดู[เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#group-chat-mention-gating)สำหรับโหมดการตอบกลับที่มองเห็นได้ การแทนที่รายช่องทาง และโหมด self-chat

  </Accordion>

  <Accordion title="จำกัด Skills ต่อเอเจนต์">
    ใช้ `agents.defaults.skills` สำหรับ baseline ที่ใช้ร่วมกัน จากนั้นแทนที่เอเจนต์
    เฉพาะด้วย `agents.list[].skills`:

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

    - ละเว้น `agents.defaults.skills` เพื่อให้ Skills ไม่ถูกจำกัดตามค่าเริ่มต้น
    - ละเว้น `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
    - ตั้งค่า `agents.list[].skills: []` เพื่อไม่ให้มี Skills
    - ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config) และ
      [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agents-defaults-skills)

  </Accordion>

  <Accordion title="ปรับแต่งการเฝ้าติดตามสุขภาพช่องทางของ Gateway">
    ควบคุมว่า Gateway จะรีสตาร์ตช่องทางที่ดูค้างอย่างเข้มงวดแค่ไหน:

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

    - ตั้งค่า `gateway.channelHealthCheckMinutes: 0` เพื่อปิดการรีสตาร์ตโดย health-monitor ทั่วทั้งระบบ
    - `channelStaleEventThresholdMinutes` ควรมากกว่าหรือเท่ากับช่วงเวลาการตรวจสอบ
    - ใช้ `channels.<provider>.healthMonitor.enabled` หรือ `channels.<provider>.accounts.<id>.healthMonitor.enabled` เพื่อปิดการรีสตาร์ตอัตโนมัติสำหรับช่องทางหรือบัญชีหนึ่งรายการโดยไม่ปิดตัวเฝ้าติดตามทั่วทั้งระบบ
    - ดู [Health Checks](/th/gateway/health) สำหรับการดีบักเชิงปฏิบัติการ และ[เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#gateway)สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="ปรับแต่ง timeout การ handshake ของ WebSocket สำหรับ Gateway">
    ให้ไคลเอนต์ local มีเวลามากขึ้นในการทำ pre-auth WebSocket handshake บน
    โฮสต์ที่โหลดสูงหรือมีกำลังประมวลผลต่ำ:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - ค่าเริ่มต้นคือ `15000` มิลลิวินาที
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ยังคงมีลำดับความสำคัญสูงกว่าสำหรับการแทนที่ service หรือ shell แบบครั้งเดียว
    - ควรแก้ปัญหา startup/event-loop stall ก่อน ปุ่มปรับนี้มีไว้สำหรับโฮสต์ที่สุขภาพดีแต่ช้าระหว่าง warmup

  </Accordion>

  <Accordion title="กำหนดค่าเซสชันและการรีเซ็ต">
    เซสชันควบคุมความต่อเนื่องและการแยกกันของบทสนทนา:

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
    - ดู [อ้างอิงฉบับเต็ม](/th/gateway/config-agents#session) สำหรับฟิลด์ทั้งหมด

  </Accordion>

  <Accordion title="Enable sandboxing">
    เรียกใช้เซสชันเอเจนต์ในรันไทม์ sandbox ที่แยกออกจากกัน:

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

    สร้างอิมเมจก่อน - จาก checkout ซอร์สให้เรียกใช้ `scripts/sandbox-setup.sh` หรือจากการติดตั้ง npm ให้ดูคำสั่ง `docker build` แบบ inline ใน [Sandboxing § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup)

    ดู [Sandboxing](/th/gateway/sandboxing) สำหรับคู่มือฉบับเต็ม และ [อ้างอิงฉบับเต็ม](/th/gateway/config-agents#agentsdefaultssandbox) สำหรับตัวเลือกทั้งหมด

  </Accordion>

  <Accordion title="Enable relay-backed push for official iOS builds">
    push ที่มี relay รองรับถูกกำหนดค่าใน `openclaw.json`

    ตั้งค่านี้ในการกำหนดค่า Gateway:

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

    คำสั่ง CLI ที่เทียบเท่า:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    สิ่งที่ค่านี้ทำ:

    - อนุญาตให้ Gateway ส่ง `push.test`, การสะกิดให้ตื่น และการปลุกเพื่อเชื่อมต่อใหม่ผ่าน relay ภายนอก
    - ใช้สิทธิ์อนุญาตส่งที่อยู่ในขอบเขตการลงทะเบียน ซึ่งส่งต่อโดยแอป iOS ที่จับคู่ไว้ Gateway ไม่จำเป็นต้องมีโทเค็น relay ระดับการปรับใช้ทั้งระบบ
    - ผูกการลงทะเบียนแต่ละรายการที่มี relay รองรับกับตัวตน Gateway ที่แอป iOS จับคู่ด้วย เพื่อให้ Gateway อื่นไม่สามารถใช้การลงทะเบียนที่จัดเก็บไว้ซ้ำได้
    - คงบิลด์ iOS แบบ local/manual ไว้บน APNs โดยตรง การส่งที่มี relay รองรับจะใช้เฉพาะกับบิลด์ที่แจกจ่ายอย่างเป็นทางการซึ่งลงทะเบียนผ่าน relay เท่านั้น
    - ต้องตรงกับ URL ฐานของ relay ที่ฝังอยู่ในบิลด์ iOS อย่างเป็นทางการ/TestFlight เพื่อให้ทราฟฟิกการลงทะเบียนและการส่งไปถึงการปรับใช้ relay เดียวกัน

    โฟลว์ตั้งแต่ต้นจนจบ:

    1. ติดตั้งบิลด์ iOS อย่างเป็นทางการ/TestFlight ที่คอมไพล์ด้วย URL ฐานของ relay เดียวกัน
    2. กำหนดค่า `gateway.push.apns.relay.baseUrl` บน Gateway
    3. จับคู่แอป iOS กับ Gateway และให้ทั้งเซสชัน node และ operator เชื่อมต่อ
    4. แอป iOS ดึงตัวตน Gateway, ลงทะเบียนกับ relay โดยใช้ App Attest พร้อมใบเสร็จของแอป แล้วเผยแพร่ payload `push.apns.register` ที่มี relay รองรับไปยัง Gateway ที่จับคู่ไว้
    5. Gateway จัดเก็บ relay handle และสิทธิ์อนุญาตส่ง จากนั้นใช้สำหรับ `push.test`, การสะกิดให้ตื่น และการปลุกเพื่อเชื่อมต่อใหม่

    หมายเหตุด้านการปฏิบัติงาน:

    - หากคุณสลับแอป iOS ไปยัง Gateway อื่น ให้เชื่อมต่อแอปใหม่เพื่อให้แอปเผยแพร่การลงทะเบียน relay ใหม่ที่ผูกกับ Gateway นั้นได้
    - หากคุณส่งบิลด์ iOS ใหม่ที่ชี้ไปยังการปรับใช้ relay อื่น แอปจะรีเฟรชการลงทะเบียน relay ที่แคชไว้แทนการใช้ต้นทาง relay เดิมซ้ำ

    หมายเหตุด้านความเข้ากันได้:

    - `OPENCLAW_APNS_RELAY_BASE_URL` และ `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ยังใช้งานได้เป็นการ override ผ่าน env ชั่วคราว
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` ยังคงเป็นช่องทางหลบสำหรับการพัฒนาแบบ loopback เท่านั้น อย่าบันทึก URL relay แบบ HTTP ไว้ในการกำหนดค่า

    ดู [แอป iOS](/th/platforms/ios#relay-backed-push-for-official-builds) สำหรับโฟลว์ตั้งแต่ต้นจนจบ และ [โฟลว์การยืนยันตัวตนและความไว้วางใจ](/th/platforms/ios#authentication-and-trust-flow) สำหรับโมเดลความปลอดภัยของ relay

  </Accordion>

  <Accordion title="Set up heartbeat (periodic check-ins)">
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

    - `every`: สตริงระยะเวลา (`30m`, `2h`) ตั้งค่าเป็น `0m` เพื่อปิดใช้งาน
    - `target`: `last` | `none` | `<channel-id>` (ตัวอย่างเช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`)
    - `directPolicy`: `allow` (ค่าเริ่มต้น) หรือ `block` สำหรับเป้าหมาย Heartbeat แบบ DM
    - ดู [Heartbeat](/th/gateway/heartbeat) สำหรับคู่มือฉบับเต็ม

  </Accordion>

  <Accordion title="Configure cron jobs">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: ล้างเซสชันการรันแบบแยกที่เสร็จแล้วออกจาก `sessions.json` (ค่าเริ่มต้น `24h`; ตั้งค่าเป็น `false` เพื่อปิดใช้งาน)
    - `runLog`: ล้าง `cron/runs/<jobId>.jsonl` ตามขนาดและจำนวนบรรทัดที่คงไว้
    - ดู [งาน Cron](/th/automation/cron-jobs) สำหรับภาพรวมฟีเจอร์และตัวอย่าง CLI

  </Accordion>

  <Accordion title="Set up webhooks (hooks)">
    เปิดใช้งาน endpoint HTTP Webhook บน Gateway:

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
    - ถือว่าเนื้อหา payload ของ hook/webhook ทั้งหมดเป็นอินพุตที่ไม่น่าเชื่อถือ
    - ใช้ `hooks.token` เฉพาะ อย่านำโทเค็น Gateway ที่ใช้ร่วมกันมาใช้ซ้ำ
    - การยืนยันตัวตนของ hook ใช้เฉพาะ header (`Authorization: Bearer ...` หรือ `x-openclaw-token`); โทเค็นใน query string จะถูกปฏิเสธ
    - `hooks.path` ไม่สามารถเป็น `/` ได้ ให้เก็บทางเข้า webhook ไว้ใน subpath เฉพาะ เช่น `/hooks`
    - ปิดแฟล็กข้ามเนื้อหาที่ไม่ปลอดภัยไว้ (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) เว้นแต่จะดีบักในขอบเขตที่จำกัดอย่างเข้มงวด
    - หากคุณเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วย เพื่อจำกัดคีย์เซสชันที่ผู้เรียกเลือกได้
    - สำหรับเอเจนต์ที่ขับเคลื่อนด้วย hook ให้ใช้ tier โมเดลสมัยใหม่ที่แข็งแรงและนโยบายเครื่องมือที่เข้มงวดเป็นหลัก (เช่น อนุญาตเฉพาะการส่งข้อความ พร้อม sandboxing เมื่อเป็นไปได้)

    ดู [อ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#hooks) สำหรับตัวเลือก mapping ทั้งหมดและการเชื่อมต่อ Gmail

  </Accordion>

  <Accordion title="Configure multi-agent routing">
    เรียกใช้เอเจนต์ที่แยกออกจากกันหลายตัว โดยมี workspace และเซสชันแยกกัน:

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

    ดู [หลายเอเจนต์](/th/concepts/multi-agent) และ [อ้างอิงฉบับเต็ม](/th/gateway/config-agents#multi-agent-routing) สำหรับกฎการผูกและโปรไฟล์การเข้าถึงรายเอเจนต์

  </Accordion>

  <Accordion title="Split config into multiple files ($include)">
    ใช้ `$include` เพื่อจัดระเบียบ config ขนาดใหญ่:

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

    - **ไฟล์เดียว**: แทนที่ object ที่ครอบอยู่
    - **อาร์เรย์ของไฟล์**: deep-merge ตามลำดับ (รายการหลังชนะ)
    - **คีย์ข้างเคียง**: merge หลัง includes (override ค่าที่ include มา)
    - **include ซ้อนกัน**: รองรับได้ลึกสูงสุด 10 ระดับ
    - **พาธสัมพัทธ์**: resolve โดยอิงจากไฟล์ที่ include
    - **การเขียนที่ OpenClaw เป็นเจ้าของ**: เมื่อการเขียนเปลี่ยนเฉพาะส่วน top-level หนึ่งส่วน
      ที่รองรับด้วย single-file include เช่น `plugins: { $include: "./plugins.json5" }`,
      OpenClaw จะอัปเดตไฟล์ที่ include นั้น และปล่อย `openclaw.json` ไว้เหมือนเดิม
    - **write-through ที่ไม่รองรับ**: root includes, include arrays และ includes
      ที่มี sibling overrides จะ fail closed สำหรับการเขียนที่ OpenClaw เป็นเจ้าของ แทนที่จะ
      flatten config
    - **การจำกัดขอบเขต**: พาธ `$include` ต้อง resolve อยู่ภายใต้ไดเรกทอรีที่มี
      `openclaw.json` หากต้องการแชร์ tree ระหว่างเครื่องหรือผู้ใช้ ให้ตั้งค่า
      `OPENCLAW_INCLUDE_ROOTS` เป็น path-list (`:` บน POSIX, `;` บน Windows) ของ
      ไดเรกทอรีเพิ่มเติมที่ includes อาจอ้างอิงได้ Symlink จะถูก resolve
      และตรวจสอบซ้ำ ดังนั้นพาธที่ตามตัวอักษรอยู่ใน config dir แต่ target จริง
      หลุดออกจาก root ที่อนุญาตทั้งหมดจะยังคงถูกปฏิเสธ
    - **การจัดการข้อผิดพลาด**: ข้อผิดพลาดที่ชัดเจนสำหรับไฟล์ที่หายไป ข้อผิดพลาดในการ parse และ circular includes

  </Accordion>
</AccordionGroup>

## Config hot reload

Gateway เฝ้าดู `~/.openclaw/openclaw.json` และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ - การตั้งค่าส่วนใหญ่ไม่ต้อง restart ด้วยตนเอง

การแก้ไขไฟล์โดยตรงจะถือว่าไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบ watcher จะรอ
ให้การเขียนไฟล์ชั่วคราว/การ rename จาก editor สงบลง อ่านไฟล์สุดท้าย และปฏิเสธ
การแก้ไขภายนอกที่ไม่ถูกต้องโดยไม่เขียน `openclaw.json` ใหม่ การเขียน config
ที่ OpenClaw เป็นเจ้าของใช้ schema gate เดียวกันก่อนเขียน; การ clobber แบบทำลาย เช่น
การลบ `gateway.mode` หรือการลดขนาดไฟล์ลงมากกว่าครึ่ง จะถูกปฏิเสธและ
บันทึกเป็น `.rejected.*` เพื่อให้ตรวจสอบ

หากคุณเห็น `config reload skipped (invalid config)` หรือ startup รายงาน `Invalid
config` ให้ตรวจสอบ config, เรียกใช้ `openclaw config validate` จากนั้นเรียกใช้ `openclaw
doctor --fix` เพื่อซ่อมแซม ดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config)
สำหรับ checklist

### โหมดการ reload

| โหมด                   | พฤติกรรม                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (ค่าเริ่มต้น) | hot-apply การเปลี่ยนแปลงที่ปลอดภัยทันที restart อัตโนมัติสำหรับการเปลี่ยนแปลงที่สำคัญ           |
| **`hot`**              | hot-apply เฉพาะการเปลี่ยนแปลงที่ปลอดภัย บันทึกคำเตือนเมื่อจำเป็นต้อง restart - คุณจัดการเอง |
| **`restart`**          | restart Gateway เมื่อ config เปลี่ยนแปลงใด ๆ ไม่ว่าจะปลอดภัยหรือไม่                                 |
| **`off`**              | ปิดการเฝ้าดูไฟล์ การเปลี่ยนแปลงจะมีผลเมื่อ restart ด้วยตนเองครั้งถัดไป                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### สิ่งที่ hot-apply ได้กับสิ่งที่ต้อง restart

ฟิลด์ส่วนใหญ่ hot-apply ได้โดยไม่มี downtime ในโหมด `hybrid` การเปลี่ยนแปลงที่ต้อง restart จะถูกจัดการโดยอัตโนมัติ

| หมวดหมู่            | ฟิลด์                                                            | ต้อง restart หรือไม่ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| ช่องทาง            | `channels.*`, `web` (WhatsApp) - ช่องทาง built-in และ Plugin ทั้งหมด | ไม่              |
| เอเจนต์และโมเดล      | `agent`, `agents`, `models`, `routing`                            | ไม่              |
| Automation          | `hooks`, `cron`, `agent.heartbeat`                                | ไม่              |
| เซสชันและข้อความ | `session`, `messages`                                             | ไม่              |
| เครื่องมือและสื่อ       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | ไม่              |
| UI และอื่น ๆ           | `ui`, `logging`, `identity`, `bindings`                           | ไม่              |
| เซิร์ฟเวอร์ Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **ใช่**         |
| โครงสร้างพื้นฐาน      | `discovery`, `plugins`                                            | **ใช่**         |

<Note>
`gateway.reload` และ `gateway.remote` เป็นข้อยกเว้น - การเปลี่ยนค่าเหล่านี้จะ **ไม่** ทริกเกอร์การรีสตาร์ท
</Note>

### การวางแผนการโหลดซ้ำ

เมื่อคุณแก้ไขไฟล์ซอร์สที่ถูกอ้างอิงผ่าน `$include` OpenClaw จะวางแผน
การโหลดซ้ำจากเลย์เอาต์ที่เขียนไว้ในซอร์ส ไม่ใช่มุมมองในหน่วยความจำที่ถูกทำให้แบนแล้ว
วิธีนี้ทำให้การตัดสินใจโหลดซ้ำแบบทันที (นำไปใช้ทันทีเทียบกับรีสตาร์ท) คาดเดาได้
แม้เมื่อส่วนระดับบนสุดเพียงส่วนเดียวอยู่ในไฟล์ที่ include แยกต่างหาก เช่น
`plugins: { $include: "./plugins.json5" }` การวางแผนการโหลดซ้ำจะล้มเหลวแบบปิดหาก
เลย์เอาต์ซอร์สกำกวม

## RPC การกำหนดค่า (การอัปเดตผ่านโปรแกรม)

สำหรับเครื่องมือที่เขียนการกำหนดค่าผ่าน Gateway API ให้ใช้โฟลว์นี้เป็นหลัก:

- `config.schema.lookup` เพื่อตรวจสอบซับทรีหนึ่งรายการ (โหนดสคีมาแบบตื้น + สรุปลูก)
- `config.get` เพื่อดึงสแนปช็อตปัจจุบันพร้อม `hash`
- `config.patch` สำหรับการอัปเดตบางส่วน (แพตช์ผสาน JSON: ออบเจ็กต์ผสานกัน, `null`
  ลบค่า, อาร์เรย์แทนที่ค่าเดิม)
- `config.apply` เฉพาะเมื่อคุณตั้งใจจะแทนที่การกำหนดค่าทั้งหมด
- `update.run` สำหรับการอัปเดตตัวเองพร้อมรีสตาร์ทแบบชัดเจน; ใส่ `continuationMessage` เมื่อเซสชันหลังรีสตาร์ทควรรันเทิร์นติดตามผลหนึ่งครั้ง
- `update.status` เพื่อตรวจสอบตัวบ่งชี้การรีสตาร์ทของการอัปเดตล่าสุดและยืนยันเวอร์ชันที่กำลังรันหลังรีสตาร์ท

Agents ควรถือว่า `config.schema.lookup` เป็นจุดเริ่มต้นแรกสำหรับเอกสารและข้อจำกัด
ระดับฟิลด์ที่แน่นอน ใช้ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
เมื่อต้องการแผนผังการกำหนดค่าที่กว้างขึ้น ค่าเริ่มต้น หรือลิงก์ไปยังข้อมูลอ้างอิง
ของระบบย่อยเฉพาะ

<Note>
การเขียนใน control plane (`config.apply`, `config.patch`, `update.run`) ถูก
จำกัดอัตราไว้ที่ 3 คำขอต่อ 60 วินาทีต่อ `deviceId+clientIp` คำขอรีสตาร์ท
จะถูกรวมเข้าด้วยกัน แล้วบังคับใช้คูลดาวน์ 30 วินาทีระหว่างรอบการรีสตาร์ท
`update.status` เป็นแบบอ่านอย่างเดียว แต่จำกัดขอบเขตไว้สำหรับผู้ดูแลระบบ เพราะตัวบ่งชี้การรีสตาร์ทสามารถ
รวมสรุปขั้นตอนการอัปเดตและส่วนท้ายของเอาต์พุตคำสั่งได้
</Note>

ตัวอย่างแพตช์บางส่วน:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

ทั้ง `config.apply` และ `config.patch` รับ `raw`, `baseHash`, `sessionKey`,
`note` และ `restartDelayMs` ต้องมี `baseHash` สำหรับทั้งสองเมธอดเมื่อ
มีการกำหนดค่าอยู่แล้ว

## ตัวแปรสภาพแวดล้อม

OpenClaw อ่านตัวแปรสภาพแวดล้อมจากโปรเซสแม่ รวมถึง:

- `.env` จากไดเรกทอรีทำงานปัจจุบัน (ถ้ามี)
- `~/.openclaw/.env` (ค่าทดแทนส่วนกลาง)

ทั้งสองไฟล์จะไม่เขียนทับตัวแปรสภาพแวดล้อมที่มีอยู่ คุณยังตั้งค่าตัวแปรสภาพแวดล้อมแบบอินไลน์ในการกำหนดค่าได้:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="การนำเข้าตัวแปรสภาพแวดล้อมของเชลล์ (ไม่บังคับ)">
  หากเปิดใช้และคีย์ที่คาดไว้ยังไม่ได้ตั้งค่า OpenClaw จะรัน login shell ของคุณและนำเข้าเฉพาะคีย์ที่ขาดอยู่:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

ตัวแปรสภาพแวดล้อมที่เทียบเท่า: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="การแทนที่ตัวแปรสภาพแวดล้อมในค่าการกำหนดค่า">
  อ้างอิงตัวแปรสภาพแวดล้อมในค่าสตริงของการกำหนดค่าใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

กฎ:

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่ขาดหรือว่างจะทำให้เกิดข้อผิดพลาดในเวลาโหลด
- escape ด้วย `$${VAR}` สำหรับเอาต์พุตตามตัวอักษร
- ทำงานภายในไฟล์ `$include`
- การแทนที่แบบอินไลน์: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="การอ้างอิงความลับ (env, file, exec)">
  สำหรับฟิลด์ที่รองรับออบเจ็กต์ SecretRef คุณใช้ได้ดังนี้:

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

รายละเอียด SecretRef (รวมถึง `secrets.providers` สำหรับ `env`/`file`/`exec`) อยู่ใน [การจัดการความลับ](/th/gateway/secrets)
เส้นทางข้อมูลรับรองที่รองรับแสดงอยู่ใน [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
</Accordion>

ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญและแหล่งที่มาแบบเต็ม

## ข้อมูลอ้างอิงฉบับเต็ม

สำหรับข้อมูลอ้างอิงแบบครบถ้วนแยกตามฟิลด์ โปรดดู **[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)**

---

_ที่เกี่ยวข้อง: [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
