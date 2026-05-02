---
read_when:
    - การตั้งค่า OpenClaw เป็นครั้งแรก
    - กำลังมองหารูปแบบการกำหนดค่าทั่วไป
    - การไปยังส่วนการกำหนดค่าเฉพาะ
summary: 'ภาพรวมการกำหนดค่า: งานทั่วไป การตั้งค่าอย่างรวดเร็ว และลิงก์ไปยังคู่มืออ้างอิงฉบับเต็ม'
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-05-02T10:15:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5ad1685170923f26166fb2f74891468d16c6f86af5cc5f5f1da7a6dce65eb98
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw อ่านค่า config **JSON5** ที่ไม่บังคับจาก `~/.openclaw/openclaw.json` โดย <Tooltip tip="JSON5 รองรับคอมเมนต์และเครื่องหมายจุลภาคต่อท้าย"></Tooltip>
เส้นทาง config ที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ เลย์เอาต์ `openclaw.json` แบบ symlink
ไม่รองรับสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ การเขียนแบบ atomic อาจแทนที่
เส้นทางแทนที่จะคง symlink ไว้ หากคุณเก็บ config ไว้นอกไดเรกทอรีสถานะเริ่มต้น
ให้ชี้ `OPENCLAW_CONFIG_PATH` ไปยังไฟล์จริงโดยตรง

หากไม่มีไฟล์ OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัย เหตุผลทั่วไปในการเพิ่ม config:

- เชื่อมต่อช่องทางและควบคุมว่าใครส่งข้อความถึงบอทได้
- ตั้งค่าโมเดล เครื่องมือ sandboxing หรือระบบอัตโนมัติ (cron, hooks)
- ปรับแต่งเซสชัน สื่อ เครือข่าย หรือ UI

ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference) สำหรับทุกฟิลด์ที่มีให้ใช้

เอเจนต์และระบบอัตโนมัติควรใช้ `config.schema.lookup` สำหรับเอกสารระดับฟิลด์
ที่แม่นยำก่อนแก้ไข config ใช้หน้านี้สำหรับคำแนะนำแบบเน้นงาน และ
[เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) สำหรับแผนผังฟิลด์
และค่าเริ่มต้นที่กว้างกว่า

<Tip>
**เพิ่งเริ่มใช้การกำหนดค่าใช่ไหม** เริ่มด้วย `openclaw onboard` สำหรับการตั้งค่าแบบโต้ตอบ หรือดูคู่มือ [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) สำหรับ config แบบคัดลอกไปวางที่ครบถ้วน
</Tip>

## config ขั้นต่ำ

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## การแก้ไข config

<Tabs>
  <Tab title="ตัวช่วยแบบโต้ตอบ">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (คำสั่งสั้น ๆ)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    เปิด [http://127.0.0.1:18789](http://127.0.0.1:18789) และใช้แท็บ **Config**
    Control UI เรนเดอร์ฟอร์มจาก schema config สด รวมถึงเมทาดาทาเอกสาร
    `title` / `description` ของฟิลด์ รวมถึง schema ของ Plugin และช่องทางเมื่อ
    มีให้ใช้ พร้อมตัวแก้ไข **Raw JSON** เป็นทางสำรอง สำหรับ UI แบบเจาะลึก
    และเครื่องมืออื่น ๆ gateway ยังเปิดให้ใช้ `config.schema.lookup` เพื่อ
    ดึง node schema ตามขอบเขตเส้นทางหนึ่งรายการ พร้อมสรุปลูกโดยตรง
  </Tab>
  <Tab title="แก้ไขโดยตรง">
    แก้ไข `~/.openclaw/openclaw.json` โดยตรง Gateway จะเฝ้าดูไฟล์และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ (ดู [hot reload](#config-hot-reload))
  </Tab>
</Tabs>

## การตรวจสอบแบบเข้มงวด

<Warning>
OpenClaw ยอมรับเฉพาะการกำหนดค่าที่ตรงกับ schema อย่างครบถ้วนเท่านั้น คีย์ที่ไม่รู้จัก ชนิดข้อมูลผิดรูปแบบ หรือค่าที่ไม่ถูกต้องจะทำให้ Gateway **ปฏิเสธการเริ่มทำงาน** ข้อยกเว้นระดับรากเพียงอย่างเดียวคือ `$schema` (string) เพื่อให้ตัวแก้ไขแนบเมทาดาทา JSON Schema ได้
</Warning>

`openclaw config schema` พิมพ์ JSON Schema แบบ canonical ที่ Control UI
และการตรวจสอบใช้ `config.schema.lookup` ดึง node ตามขอบเขตเส้นทางหนึ่งรายการพร้อม
สรุปลูกสำหรับเครื่องมือแบบเจาะลึก เมทาดาทาเอกสาร `title`/`description` ของฟิลด์
ส่งผ่านออบเจ็กต์ซ้อน wildcard (`*`), รายการอาร์เรย์ (`[]`) และสาขา `anyOf`/
`oneOf`/`allOf` schema ของ Plugin และช่องทางใน runtime จะรวมเข้ามาเมื่อโหลด
manifest registry แล้ว

เมื่อการตรวจสอบล้มเหลว:

- Gateway จะไม่บูต
- มีเพียงคำสั่งวินิจฉัยที่ทำงานได้ (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- รัน `openclaw doctor` เพื่อดูปัญหาที่แน่นอน
- รัน `openclaw doctor --fix` (หรือ `--yes`) เพื่อใช้การซ่อมแซม

Gateway เก็บสำเนา last-known-good ที่เชื่อถือได้หลังการเริ่มต้นสำเร็จแต่ละครั้ง
หาก `openclaw.json` ภายหลังตรวจสอบไม่ผ่าน (หรือทำ `gateway.mode` หล่น ขนาดลดลง
อย่างมาก หรือมีบรรทัด log แปลกปลอมถูกเติมไว้ด้านหน้า) OpenClaw จะเก็บไฟล์ที่เสียไว้
เป็น `.clobbered.*` กู้คืนสำเนา last-known-good และบันทึกเหตุผลการกู้คืนลง log
เทิร์นเอเจนต์ถัดไปยังได้รับคำเตือน system-event เพื่อให้เอเจนต์หลักไม่เขียนทับ
config ที่กู้คืนโดยไม่ระวัง การเลื่อนเป็น last-known-good จะถูกข้ามเมื่อ candidate
มี placeholder ความลับที่ถูกปิดทับ เช่น `***` เมื่อปัญหาการตรวจสอบทั้งหมดมีขอบเขตอยู่ที่
`plugins.entries.<id>...` OpenClaw จะไม่ทำการกู้คืนทั้งไฟล์ แต่จะคง config ปัจจุบัน
ให้ใช้งานอยู่และแสดงข้อผิดพลาดเฉพาะ Plugin เพื่อไม่ให้ schema ของ Plugin หรือ
ความไม่ตรงกันของเวอร์ชันโฮสต์ย้อนคืนการตั้งค่าผู้ใช้ที่ไม่เกี่ยวข้อง

## งานทั่วไป

<AccordionGroup>
  <Accordion title="ตั้งค่าช่องทาง (WhatsApp, Telegram, Discord ฯลฯ)">
    แต่ละช่องทางมีส่วน config ของตนเองภายใต้ `channels.<provider>` ดูหน้าช่องทางเฉพาะสำหรับขั้นตอนการตั้งค่า:

    - [WhatsApp](/th/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/th/channels/telegram) — `channels.telegram`
    - [Discord](/th/channels/discord) — `channels.discord`
    - [Feishu](/th/channels/feishu) — `channels.feishu`
    - [Google Chat](/th/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/th/channels/msteams) — `channels.msteams`
    - [Slack](/th/channels/slack) — `channels.slack`
    - [Signal](/th/channels/signal) — `channels.signal`
    - [iMessage](/th/channels/imessage) — `channels.imessage`
    - [Mattermost](/th/channels/mattermost) — `channels.mattermost`

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
    ตั้งค่าโมเดลหลักและ fallback ที่ไม่บังคับ:

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

    - `agents.defaults.models` กำหนด catalog ของโมเดลและทำหน้าที่เป็น allowlist สำหรับ `/model`
    - ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ allowlist โดยไม่ลบโมเดลเดิม การแทนที่แบบธรรมดาที่จะลบรายการจะถูกปฏิเสธ เว้นแต่คุณส่ง `--replace`
    - การอ้างอิงโมเดลใช้รูปแบบ `provider/model` (เช่น `anthropic/claude-opus-4-6`)
    - `agents.defaults.imageMaxDimensionPx` ควบคุมการย่อขนาดรูปภาพใน transcript/tool (ค่าเริ่มต้น `1200`); ค่าที่ต่ำกว่ามักลดการใช้ vision-token ในรันที่มีสกรีนช็อตจำนวนมาก
    - ดู [Models CLI](/th/concepts/models) สำหรับการสลับโมเดลในแชต และ [Model Failover](/th/concepts/model-failover) สำหรับการหมุนเวียน auth และพฤติกรรม fallback
    - สำหรับผู้ให้บริการ custom/self-hosted ดู [Custom providers](/th/gateway/config-tools#custom-providers-and-base-urls) ในเอกสารอ้างอิง

  </Accordion>

  <Accordion title="ควบคุมว่าใครส่งข้อความถึงบอทได้">
    การเข้าถึง DM ถูกควบคุมต่อช่องทางผ่าน `dmPolicy`:

    - `"pairing"` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing แบบใช้ครั้งเดียวเพื่ออนุมัติ
    - `"allowlist"`: เฉพาะผู้ส่งใน `allowFrom` (หรือ paired allow store)
    - `"open"`: อนุญาต DM ขาเข้าทั้งหมด (ต้องมี `allowFrom: ["*"]`)
    - `"disabled"`: เพิกเฉย DM ทั้งหมด

    สำหรับกลุ่ม ให้ใช้ `groupPolicy` + `groupAllowFrom` หรือ allowlist เฉพาะช่องทาง

    ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#dm-and-group-access) สำหรับรายละเอียดต่อช่องทาง

  </Accordion>

  <Accordion title="ตั้งค่า group chat mention gating">
    ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมีการกล่าวถึง** กำหนดรูปแบบทริกเกอร์ต่อเอเจนต์ และคงการตอบในห้องที่มองเห็นได้ไว้บนเส้นทาง message-tool เริ่มต้น เว้นแต่คุณตั้งใจต้องการการตอบสุดท้ายอัตโนมัติแบบเดิม:

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

    - **การกล่าวถึงผ่านเมทาดาทา**: @-mentions แบบ native (WhatsApp tap-to-mention, Telegram @bot ฯลฯ)
    - **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `mentionPatterns`
    - **การตอบที่มองเห็นได้**: `messages.visibleReplies` สามารถบังคับให้ส่งผ่าน message-tool ทั่วทั้งระบบ; `messages.groupChat.visibleReplies` แทนที่ค่านั้นสำหรับกลุ่ม/ช่องทาง
    - ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#group-chat-mention-gating) สำหรับโหมดการตอบที่มองเห็นได้ การแทนที่ต่อช่องทาง และโหมด self-chat

  </Accordion>

  <Accordion title="จำกัด Skills ต่อเอเจนต์">
    ใช้ `agents.defaults.skills` เป็น baseline ร่วม แล้วแทนที่เอเจนต์เฉพาะ
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
    - ตั้ง `agents.list[].skills: []` เพื่อไม่มี Skills
    - ดู [Skills](/th/tools/skills), [Skills config](/th/tools/skills-config) และ
      [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agents-defaults-skills)

  </Accordion>

  <Accordion title="ปรับแต่งการตรวจสอบสถานะช่องทางของ Gateway">
    ควบคุมว่า gateway จะรีสตาร์ตช่องทางที่ดูค้างอย่างเข้มงวดแค่ไหน:

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

    - ตั้ง `gateway.channelHealthCheckMinutes: 0` เพื่อปิดการรีสตาร์ตโดย health-monitor ทั่วทั้งระบบ
    - `channelStaleEventThresholdMinutes` ควรมากกว่าหรือเท่ากับช่วงเวลาตรวจสอบ
    - ใช้ `channels.<provider>.healthMonitor.enabled` หรือ `channels.<provider>.accounts.<id>.healthMonitor.enabled` เพื่อปิด auto-restarts สำหรับหนึ่งช่องทางหรือบัญชีโดยไม่ปิด monitor ส่วนกลาง
    - ดู [Health Checks](/th/gateway/health) สำหรับการดีบักด้านปฏิบัติการ และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#gateway) สำหรับฟิลด์ทั้งหมด

  </Accordion>

  <Accordion title="ปรับแต่ง timeout การ handshake ของ Gateway WebSocket">
    ให้ไคลเอนต์ภายในเครื่องมีเวลามากขึ้นในการทำ pre-auth WebSocket handshake
    ให้เสร็จบนโฮสต์ที่โหลดสูงหรือพลังประมวลผลต่ำ:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - ค่าเริ่มต้นคือ `15000` มิลลิวินาที
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ยังคงมีลำดับความสำคัญสูงกว่าสำหรับการ override เฉพาะครั้งใน service หรือ shell
    - ควรแก้ startup/event-loop stalls ก่อนเป็นหลัก; knob นี้มีไว้สำหรับโฮสต์ที่สุขภาพดีแต่ช้าในช่วง warmup

  </Accordion>

  <Accordion title="กำหนดค่าเซสชันและการรีเซ็ต">
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
    - ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#session) สำหรับฟิลด์ทั้งหมด

  </Accordion>

  <Accordion title="เปิดใช้ sandboxing">
    รันเซสชัน agent ในรันไทม์ sandbox ที่แยกออกจากกัน:

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

    สร้างอิมเมจก่อน — จาก source checkout ให้รัน `scripts/sandbox-setup.sh` หรือจากการติดตั้ง npm ให้ดูคำสั่ง `docker build` แบบ inline ใน [Sandboxing § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup)

    ดู [Sandboxing](/th/gateway/sandboxing) สำหรับคู่มือฉบับเต็ม และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#agentsdefaultssandbox) สำหรับตัวเลือกทั้งหมด

  </Accordion>

  <Accordion title="เปิดใช้ push ที่รองรับด้วย relay สำหรับบิลด์ iOS อย่างเป็นทางการ">
    push ที่รองรับด้วย relay ถูกกำหนดค่าใน `openclaw.json`

    ตั้งค่านี้ในการกำหนดค่า gateway:

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

    สิ่งที่การตั้งค่านี้ทำ:

    - ให้ gateway ส่ง `push.test`, wake nudges และ reconnect wakes ผ่าน relay ภายนอกได้
    - ใช้สิทธิ์การส่งที่มีขอบเขตตามการลงทะเบียน ซึ่งส่งต่อโดยแอป iOS ที่จับคู่แล้ว gateway ไม่จำเป็นต้องมีโทเค็น relay ระดับการปรับใช้ทั้งหมด
    - ผูกการลงทะเบียนที่รองรับด้วย relay แต่ละรายการกับตัวตนของ gateway ที่แอป iOS จับคู่ด้วย เพื่อให้ gateway อื่นไม่สามารถนำการลงทะเบียนที่จัดเก็บไว้ไปใช้ซ้ำได้
    - ให้บิลด์ iOS แบบ local/manual ยังคงใช้ APNs โดยตรง การส่งที่รองรับด้วย relay ใช้เฉพาะกับบิลด์ที่แจกจ่ายอย่างเป็นทางการซึ่งลงทะเบียนผ่าน relay เท่านั้น
    - ต้องตรงกับ URL ฐานของ relay ที่ฝังไว้ในบิลด์ iOS อย่างเป็นทางการ/TestFlight เพื่อให้ทราฟฟิกการลงทะเบียนและการส่งไปถึงการปรับใช้ relay เดียวกัน

    โฟลว์ตั้งแต่ต้นจนจบ:

    1. ติดตั้งบิลด์ iOS อย่างเป็นทางการ/TestFlight ที่คอมไพล์ด้วย URL ฐานของ relay เดียวกัน
    2. กำหนดค่า `gateway.push.apns.relay.baseUrl` บน gateway
    3. จับคู่แอป iOS กับ gateway และให้ทั้งเซสชัน node และ operator เชื่อมต่อ
    4. แอป iOS ดึงตัวตนของ gateway ลงทะเบียนกับ relay โดยใช้ App Attest พร้อมใบเสร็จของแอป แล้วเผยแพร่เพย์โหลด `push.apns.register` ที่รองรับด้วย relay ไปยัง gateway ที่จับคู่แล้ว
    5. gateway จัดเก็บ relay handle และสิทธิ์การส่ง จากนั้นใช้สิ่งเหล่านี้สำหรับ `push.test`, wake nudges และ reconnect wakes

    หมายเหตุด้านปฏิบัติการ:

    - หากคุณสลับแอป iOS ไปยัง gateway อื่น ให้เชื่อมต่อแอปใหม่เพื่อให้แอปเผยแพร่การลงทะเบียน relay ใหม่ที่ผูกกับ gateway นั้นได้
    - หากคุณจัดส่งบิลด์ iOS ใหม่ที่ชี้ไปยังการปรับใช้ relay อื่น แอปจะรีเฟรชการลงทะเบียน relay ที่แคชไว้แทนการนำต้นทาง relay เดิมกลับมาใช้ซ้ำ

    หมายเหตุความเข้ากันได้:

    - `OPENCLAW_APNS_RELAY_BASE_URL` และ `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ยังทำงานเป็นการ override env ชั่วคราวได้
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` ยังคงเป็นทางออกสำหรับการพัฒนาแบบ loopback เท่านั้น อย่าบันทึก URL relay แบบ HTTP ไว้ในการกำหนดค่า

    ดู [แอป iOS](/th/platforms/ios#relay-backed-push-for-official-builds) สำหรับโฟลว์ตั้งแต่ต้นจนจบ และ [โฟลว์การตรวจสอบสิทธิ์และความไว้วางใจ](/th/platforms/ios#authentication-and-trust-flow) สำหรับโมเดลความปลอดภัยของ relay

  </Accordion>

  <Accordion title="ตั้งค่า Heartbeat (การเช็กอินตามรอบ)">
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

    - `every`: สตริงระยะเวลา (`30m`, `2h`) ตั้งค่าเป็น `0m` เพื่อปิดใช้
    - `target`: `last` | `none` | `<channel-id>` (เช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`)
    - `directPolicy`: `allow` (ค่าเริ่มต้น) หรือ `block` สำหรับเป้าหมาย Heartbeat แบบ DM
    - ดู [Heartbeat](/th/gateway/heartbeat) สำหรับคู่มือฉบับเต็ม

  </Accordion>

  <Accordion title="กำหนดค่า Cron jobs">
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

    - `sessionRetention`: ตัดเซสชันการรันแบบแยกที่เสร็จสิ้นแล้วออกจาก `sessions.json` (ค่าเริ่มต้น `24h`; ตั้งค่าเป็น `false` เพื่อปิดใช้)
    - `runLog`: ตัด `cron/runs/<jobId>.jsonl` ตามขนาดและจำนวนบรรทัดที่เก็บไว้
    - ดู [Cron jobs](/th/automation/cron-jobs) สำหรับภาพรวมฟีเจอร์และตัวอย่าง CLI

  </Accordion>

  <Accordion title="ตั้งค่า webhooks (hooks)">
    เปิดใช้ HTTP webhook endpoints บน Gateway:

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
    - ใช้ `hooks.token` เฉพาะ อย่านำโทเค็น Gateway ที่ใช้ร่วมกันกลับมาใช้ซ้ำ
    - การตรวจสอบสิทธิ์ hook ใช้เฉพาะ header (`Authorization: Bearer ...` หรือ `x-openclaw-token`); โทเค็นใน query-string จะถูกปฏิเสธ
    - `hooks.path` ต้องไม่เป็น `/`; ให้เก็บ ingress ของ webhook ไว้ใน subpath เฉพาะ เช่น `/hooks`
    - ปิด flags สำหรับข้ามเนื้อหาที่ไม่ปลอดภัยไว้ (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) เว้นแต่กำลังดีบักในขอบเขตที่จำกัดอย่างเข้มงวด
    - หากคุณเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วย เพื่อจำกัด session keys ที่ผู้เรียกเลือกได้
    - สำหรับ agents ที่ขับเคลื่อนด้วย hook ควรใช้ระดับโมเดลสมัยใหม่ที่แข็งแรงและนโยบายเครื่องมือที่เข้มงวด (เช่น เฉพาะการส่งข้อความพร้อม sandboxing เมื่อเป็นไปได้)

    ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#hooks) สำหรับตัวเลือก mapping ทั้งหมดและการผสานรวม Gmail

  </Accordion>

  <Accordion title="กำหนดค่าการกำหนดเส้นทางแบบหลาย agent">
    รัน agents ที่แยกจากกันหลายตัวพร้อม workspace และเซสชันแยกกัน:

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

    ดู [Multi-Agent](/th/concepts/multi-agent) และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#multi-agent-routing) สำหรับกฎ binding และโปรไฟล์การเข้าถึงราย agent

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

    - **ไฟล์เดียว**: แทนที่ object ที่ครอบอยู่
    - **อาร์เรย์ของไฟล์**: deep-merged ตามลำดับ (รายการหลังชนะ)
    - **คีย์ sibling**: รวมหลัง includes (override ค่าที่ include มา)
    - **Nested includes**: รองรับลึกได้สูงสุด 10 ระดับ
    - **พาธสัมพัทธ์**: resolve เทียบกับไฟล์ที่ include
    - **การเขียนที่ OpenClaw เป็นเจ้าของ**: เมื่อการเขียนเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วน
      ที่มี single-file include รองรับ เช่น `plugins: { $include: "./plugins.json5" }`
      OpenClaw จะอัปเดตไฟล์ที่ include นั้นและปล่อย `openclaw.json` ไว้เหมือนเดิม
    - **Write-through ที่ไม่รองรับ**: root includes, include arrays และ includes
      ที่มี sibling overrides จะ fail closed สำหรับการเขียนที่ OpenClaw เป็นเจ้าของ แทนที่จะ
      flatten การกำหนดค่า
    - **การจำกัดขอบเขต**: พาธ `$include` ต้อง resolve อยู่ภายใต้ไดเรกทอรีที่มี
      `openclaw.json` อยู่ หากต้องการแชร์ tree ข้ามเครื่องหรือผู้ใช้ ให้ตั้งค่า
      `OPENCLAW_INCLUDE_ROOTS` เป็น path-list (`:` บน POSIX, `;` บน Windows) ของ
      ไดเรกทอรีเพิ่มเติมที่ includes สามารถอ้างอิงได้ Symlinks จะถูก resolve
      และตรวจสอบซ้ำ ดังนั้นพาธที่ตามตัวอักษรอยู่ใน config dir แต่เป้าหมายจริง
      หลุดออกจาก root ที่อนุญาตทั้งหมด จะยังถูกปฏิเสธ
    - **การจัดการข้อผิดพลาด**: ข้อผิดพลาดที่ชัดเจนสำหรับไฟล์ที่หายไป ข้อผิดพลาดการ parse และ circular includes

  </Accordion>
</AccordionGroup>

## การ reload config แบบ hot

Gateway เฝ้าดู `~/.openclaw/openclaw.json` และใช้การเปลี่ยนแปลงโดยอัตโนมัติ — การตั้งค่าส่วนใหญ่ไม่ต้อง restart ด้วยตนเอง

การแก้ไขไฟล์โดยตรงจะถือว่าไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบ watcher จะรอ
ให้ความผันผวนจาก temp-write/rename ของ editor สงบลง อ่านไฟล์สุดท้าย และปฏิเสธ
การแก้ไขภายนอกที่ไม่ถูกต้องโดยกู้คืน config last-known-good การเขียน config ที่ OpenClaw เป็นเจ้าของ
ใช้ schema gate เดียวกันก่อนเขียน; clobbers ที่ทำลายข้อมูล เช่น
การลบ `gateway.mode` หรือการลดขนาดไฟล์ลงมากกว่าครึ่ง จะถูกปฏิเสธ
และบันทึกเป็น `.rejected.*` เพื่อการตรวจสอบ

ความล้มเหลวในการตรวจสอบแบบ plugin-local เป็นข้อยกเว้น: หากปัญหาทั้งหมดอยู่ภายใต้
`plugins.entries.<id>...` การ reload จะคง config ปัจจุบันไว้และรายงานปัญหาของ plugin
แทนการกู้คืน `.last-good`

หากคุณเห็น `Config auto-restored from last-known-good` หรือ
`config reload restored last-known-good config` ใน logs ให้ตรวจสอบไฟล์
`.clobbered.*` ที่ตรงกันถัดจาก `openclaw.json` แก้ไขเพย์โหลดที่ถูกปฏิเสธ แล้วรัน
`openclaw config validate` ดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-restored-last-known-good-config)
สำหรับ checklist การกู้คืน

### โหมด reload

| โหมด                   | พฤติกรรม                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (ค่าเริ่มต้น) | ใช้การเปลี่ยนแปลงที่ปลอดภัยแบบ hot ทันที restart โดยอัตโนมัติสำหรับการเปลี่ยนแปลงที่สำคัญ           |
| **`hot`**              | ใช้เฉพาะการเปลี่ยนแปลงที่ปลอดภัยแบบ hot บันทึกคำเตือนเมื่อจำเป็นต้อง restart — คุณต้องจัดการเอง |
| **`restart`**          | restart Gateway เมื่อ config เปลี่ยนแปลง ไม่ว่าจะปลอดภัยหรือไม่                                 |
| **`off`**              | ปิดการเฝ้าดูไฟล์ การเปลี่ยนแปลงจะมีผลเมื่อ restart ด้วยตนเองครั้งถัดไป                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### สิ่งใดใช้แบบ hot ได้กับสิ่งใดต้อง restart

ฟิลด์ส่วนใหญ่ใช้แบบ hot ได้โดยไม่มี downtime ในโหมด `hybrid` การเปลี่ยนแปลงที่ต้อง restart จะถูกจัดการโดยอัตโนมัติ

| หมวดหมู่            | ฟิลด์                                                            | ต้องรีสตาร์ตหรือไม่ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| ช่องทาง            | `channels.*`, `web` (WhatsApp) — ช่องทางในตัวและช่องทาง Plugin ทั้งหมด | ไม่              |
| เอเจนต์และโมเดล      | `agent`, `agents`, `models`, `routing`                            | ไม่              |
| ระบบอัตโนมัติ          | `hooks`, `cron`, `agent.heartbeat`                                | ไม่              |
| เซสชันและข้อความ | `session`, `messages`                                             | ไม่              |
| เครื่องมือและสื่อ       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | ไม่              |
| UI และอื่น ๆ           | `ui`, `logging`, `identity`, `bindings`                           | ไม่              |
| เซิร์ฟเวอร์ Gateway      | `gateway.*` (พอร์ต, bind, auth, tailscale, TLS, HTTP)              | **ใช่**         |
| โครงสร้างพื้นฐาน      | `discovery`, `canvasHost`, `plugins`                              | **ใช่**         |

<Note>
`gateway.reload` และ `gateway.remote` เป็นข้อยกเว้น — การเปลี่ยนค่าเหล่านี้จะ **ไม่** ทริกเกอร์การรีสตาร์ต
</Note>

### การวางแผนการโหลดซ้ำ

เมื่อคุณแก้ไขไฟล์ต้นทางที่ถูกอ้างอิงผ่าน `$include` OpenClaw จะวางแผน
การโหลดซ้ำจากเลย์เอาต์ตามที่เขียนในต้นทาง ไม่ใช่มุมมองในหน่วยความจำที่ถูกทำให้แบนแล้ว
สิ่งนี้ทำให้การตัดสินใจ hot-reload (hot-apply เทียบกับรีสตาร์ต) คาดเดาได้ แม้เมื่อ
ส่วนระดับบนสุดเพียงส่วนเดียวอยู่ในไฟล์ที่ include แยกต่างหาก เช่น
`plugins: { $include: "./plugins.json5" }` การวางแผนการโหลดซ้ำจะล้มเหลวแบบปิดหาก
เลย์เอาต์ต้นทางกำกวม

## Config RPC (การอัปเดตผ่านโปรแกรม)

สำหรับเครื่องมือที่เขียน config ผ่าน Gateway API ให้ใช้ลำดับนี้เป็นหลัก:

- `config.schema.lookup` เพื่อตรวจสอบ subtree หนึ่งรายการ (โหนด schema แบบตื้น + สรุป child)
- `config.get` เพื่อดึง snapshot ปัจจุบันพร้อม `hash`
- `config.patch` สำหรับการอัปเดตบางส่วน (JSON merge patch: object merge, `null`
  ลบ, array แทนที่)
- `config.apply` เฉพาะเมื่อคุณตั้งใจจะแทนที่ config ทั้งหมด
- `update.run` สำหรับ self-update แบบชัดเจนพร้อมรีสตาร์ต
- `update.status` เพื่อตรวจสอบ restart sentinel ของการอัปเดตล่าสุดและยืนยันเวอร์ชันที่กำลังรันหลังรีสตาร์ต

Agents ควรใช้ `config.schema.lookup` เป็นจุดเริ่มต้นแรกสำหรับเอกสารและข้อจำกัด
ระดับฟิลด์ที่แม่นยำ ใช้ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
เมื่อต้องการแผนที่ config ที่กว้างขึ้น ค่าเริ่มต้น หรือลิงก์ไปยังข้อมูลอ้างอิง
ของ subsystem เฉพาะ

<Note>
การเขียน control-plane (`config.apply`, `config.patch`, `update.run`) ถูกจำกัดอัตราไว้ที่
3 คำขอต่อ 60 วินาทีต่อ `deviceId+clientIp` คำขอรีสตาร์ตจะถูกรวมกัน แล้วจึงบังคับใช้
cooldown 30 วินาทีระหว่างรอบการรีสตาร์ต
`update.status` เป็นแบบอ่านอย่างเดียวแต่จำกัดในขอบเขต admin เพราะ restart sentinel สามารถ
รวมสรุปขั้นตอนการอัปเดตและส่วนท้ายของผลลัพธ์คำสั่งได้
</Note>

ตัวอย่าง patch บางส่วน:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

ทั้ง `config.apply` และ `config.patch` รองรับ `raw`, `baseHash`, `sessionKey`,
`note` และ `restartDelayMs` จำเป็นต้องมี `baseHash` สำหรับทั้งสองเมธอดเมื่อมี
config อยู่แล้ว

## ตัวแปรสภาพแวดล้อม

OpenClaw อ่าน env vars จาก parent process รวมถึง:

- `.env` จากไดเรกทอรีทำงานปัจจุบัน (ถ้ามี)
- `~/.openclaw/.env` (fallback แบบ global)

ไฟล์ทั้งสองจะไม่แทนที่ env vars ที่มีอยู่ คุณยังสามารถตั้งค่า env vars แบบ inline ใน config ได้:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="การนำเข้า shell env (ไม่บังคับ)">
  หากเปิดใช้และยังไม่ได้ตั้งค่าคีย์ที่คาดไว้ OpenClaw จะรัน login shell ของคุณและนำเข้าเฉพาะคีย์ที่ขาดหายไป:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

env var ที่เทียบเท่า: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="การแทนที่ env var ในค่า config">
  อ้างอิง env vars ในค่าสตริง config ใด ๆ ด้วย `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

กฎ:

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- vars ที่ขาดหายหรือว่างจะทำให้เกิดข้อผิดพลาดขณะโหลด
- escape ด้วย `$${VAR}` สำหรับเอาต์พุตแบบ literal
- ใช้งานได้ภายในไฟล์ `$include`
- การแทนที่แบบ inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="การอ้างอิง secret (env, file, exec)">
  สำหรับฟิลด์ที่รองรับ object แบบ SecretRef คุณสามารถใช้:

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

รายละเอียด SecretRef (รวมถึง `secrets.providers` สำหรับ `env`/`file`/`exec`) อยู่ใน [การจัดการ Secrets](/th/gateway/secrets)
พาธ credential ที่รองรับมีรายการอยู่ใน [พื้นผิว Credential ของ SecretRef](/th/reference/secretref-credential-surface)
</Accordion>

ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญและแหล่งที่มาทั้งหมด

## ข้อมูลอ้างอิงฉบับเต็ม

สำหรับข้อมูลอ้างอิงแบบครบทุกฟิลด์ ดู **[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)**

---

_ที่เกี่ยวข้อง: [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
- [runbook ของ Gateway](/th/gateway)
