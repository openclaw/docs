---
read_when:
    - การตั้งค่า OpenClaw เป็นครั้งแรก
    - กำลังมองหารูปแบบการกำหนดค่าทั่วไป
    - การนำทางไปยังส่วนการกำหนดค่าเฉพาะ
summary: 'ภาพรวมการกำหนดค่า: งานทั่วไป การตั้งค่าอย่างรวดเร็ว และลิงก์ไปยังเอกสารอ้างอิงฉบับเต็ม'
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-04-30T09:51:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eaad06dff8ec777adc881edbabc45048a376078d2814f2d3f7e7035abb2e8d
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw อ่านการกำหนดค่า <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> ที่ไม่บังคับจาก `~/.openclaw/openclaw.json`
พาธการกำหนดค่าที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ เลย์เอาต์ `openclaw.json`
แบบ symlink ไม่รองรับสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ การเขียนแบบ atomic อาจแทนที่
พาธแทนที่จะรักษา symlink ไว้ หากคุณเก็บการกำหนดค่าไว้นอกไดเรกทอรีสถานะ
เริ่มต้น ให้ชี้ `OPENCLAW_CONFIG_PATH` ไปยังไฟล์จริงโดยตรง

หากไม่มีไฟล์ OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัย เหตุผลทั่วไปในการเพิ่มการกำหนดค่า:

- เชื่อมต่อช่องทางและควบคุมว่าใครส่งข้อความถึงบอตได้
- ตั้งค่าโมเดล เครื่องมือ sandboxing หรือการทำงานอัตโนมัติ (cron, hooks)
- ปรับแต่งเซสชัน สื่อ เครือข่าย หรือ UI

ดู[เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference)สำหรับฟิลด์ทั้งหมดที่มี

Agent และระบบอัตโนมัติควรใช้ `config.schema.lookup` เพื่อดูเอกสารระดับฟิลด์
ที่แม่นยำก่อนแก้ไขการกำหนดค่า ใช้หน้านี้สำหรับคำแนะนำตามงาน และใช้
[เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) สำหรับแผนผัง
ฟิลด์และค่าเริ่มต้นที่กว้างขึ้น

<Tip>
**เพิ่งเริ่มใช้การกำหนดค่าใช่ไหม** เริ่มด้วย `openclaw onboard` สำหรับการตั้งค่าแบบโต้ตอบ หรือดูคู่มือ[ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)สำหรับการกำหนดค่าฉบับสมบูรณ์ที่คัดลอกไปวางได้
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
    UI ควบคุมจะแสดงแบบฟอร์มจาก schema การกำหนดค่าสด รวมถึง metadata เอกสาร
    `title` / `description` ของฟิลด์ รวมทั้ง schema ของ plugin และช่องทางเมื่อ
    มีให้ใช้งาน พร้อมตัวแก้ไข **Raw JSON** เป็นทางเลือกสำรอง สำหรับ UI แบบเจาะลึก
    และเครื่องมืออื่น Gateway ยังเปิดให้ใช้ `config.schema.lookup` เพื่อ
    ดึงโหนด schema ตามพาธหนึ่งรายการพร้อมสรุปของลูกโดยตรง
  </Tab>
  <Tab title="Direct edit">
    แก้ไข `~/.openclaw/openclaw.json` โดยตรง Gateway จะเฝ้าดูไฟล์และใช้การเปลี่ยนแปลงโดยอัตโนมัติ (ดู [hot reload](#config-hot-reload))
  </Tab>
</Tabs>

## การตรวจสอบความถูกต้องแบบเข้มงวด

<Warning>
OpenClaw ยอมรับเฉพาะการกำหนดค่าที่ตรงกับ schema อย่างครบถ้วนเท่านั้น คีย์ที่ไม่รู้จัก ชนิดข้อมูลผิดรูปแบบ หรือค่าที่ไม่ถูกต้องจะทำให้ Gateway **ปฏิเสธการเริ่มทำงาน** ข้อยกเว้นระดับรูทมีเพียง `$schema` (string) เพื่อให้ตัวแก้ไขแนบ metadata ของ JSON Schema ได้
</Warning>

`openclaw config schema` พิมพ์ JSON Schema มาตรฐานที่ UI ควบคุม
และการตรวจสอบความถูกต้องใช้ `config.schema.lookup` ดึงโหนดเดียวตามพาธพร้อม
สรุปลูกสำหรับเครื่องมือแบบเจาะลึก metadata เอกสารของฟิลด์ `title`/`description`
จะส่งต่อผ่านออบเจ็กต์ซ้อน wildcard (`*`), array-item (`[]`) และสาขา `anyOf`/
`oneOf`/`allOf` schema ของ plugin และช่องทางขณะรันไทม์จะถูกรวมเข้ามาเมื่อ
โหลด registry ของ manifest แล้ว

เมื่อการตรวจสอบความถูกต้องล้มเหลว:

- Gateway จะไม่บูต
- ใช้ได้เฉพาะคำสั่งวินิจฉัย (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- รัน `openclaw doctor` เพื่อดูปัญหาที่แน่ชัด
- รัน `openclaw doctor --fix` (หรือ `--yes`) เพื่อใช้การซ่อมแซม

Gateway เก็บสำเนาที่เชื่อถือได้ล่าสุดหลังจากการเริ่มทำงานสำเร็จแต่ละครั้ง
หาก `openclaw.json` ตรวจสอบไม่ผ่านในภายหลัง (หรือทิ้ง `gateway.mode` ทำให้ไฟล์
เล็กลงอย่างมาก หรือมีบรรทัด log แปลกปลอมถูกเติมไว้ด้านหน้า) OpenClaw จะเก็บไฟล์ที่เสีย
เป็น `.clobbered.*` กู้คืนสำเนาที่เชื่อถือได้ล่าสุด และบันทึกเหตุผลการกู้คืน
เทิร์นถัดไปของ agent จะได้รับคำเตือน system-event ด้วย เพื่อให้ agent หลัก
ไม่เขียนทับการกำหนดค่าที่กู้คืนมาโดยไม่ระวัง การเลื่อนสถานะเป็นสำเนาที่เชื่อถือได้ล่าสุด
จะถูกข้ามเมื่อ candidate มี placeholder ของ secret ที่ถูก redacted เช่น `***`
เมื่อปัญหาการตรวจสอบความถูกต้องทั้งหมดอยู่ในขอบเขต `plugins.entries.<id>...` OpenClaw
จะไม่ทำการกู้คืนทั้งไฟล์ แต่จะคงการกำหนดค่าปัจจุบันให้ใช้งานต่อ และ
แสดงความล้มเหลวเฉพาะ plugin เพื่อไม่ให้ schema ของ plugin หรือความไม่ตรงกันของ host-version
ย้อนกลับการตั้งค่าของผู้ใช้ที่ไม่เกี่ยวข้อง

## งานทั่วไป

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    แต่ละช่องทางมีส่วนการกำหนดค่าของตัวเองใต้ `channels.<provider>` ดูหน้าช่องทางเฉพาะสำหรับขั้นตอนการตั้งค่า:

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

  <Accordion title="Choose and configure models">
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
    - ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ allowlist โดยไม่ลบโมเดลที่มีอยู่ การแทนที่แบบธรรมดาที่จะลบรายการจะถูกปฏิเสธ เว้นแต่คุณส่ง `--replace`
    - การอ้างอิงโมเดลใช้รูปแบบ `provider/model` (เช่น `anthropic/claude-opus-4-6`)
    - `agents.defaults.imageMaxDimensionPx` ควบคุมการลดขนาดรูปภาพของ transcript/tool (ค่าเริ่มต้น `1200`); ค่าที่ต่ำลงมักลดการใช้ vision-token ในการรันที่มี screenshot จำนวนมาก
    - ดู [CLI สำหรับโมเดล](/th/concepts/models) สำหรับการสลับโมเดลในแชต และ[การสลับโมเดลสำรอง](/th/concepts/model-failover) สำหรับการหมุนเวียน auth และพฤติกรรม fallback
    - สำหรับ provider แบบกำหนดเอง/โฮสต์เอง ดู [provider แบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls) ในเอกสารอ้างอิง

  </Accordion>

  <Accordion title="Control who can message the bot">
    การเข้าถึง DM ถูกควบคุมเป็นรายช่องทางผ่าน `dmPolicy`:

    - `"pairing"` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing แบบใช้ครั้งเดียวเพื่ออนุมัติ
    - `"allowlist"`: อนุญาตเฉพาะผู้ส่งใน `allowFrom` (หรือ paired allow store)
    - `"open"`: อนุญาต DM ขาเข้าทั้งหมด (ต้องมี `allowFrom: ["*"]`)
    - `"disabled"`: เพิกเฉยต่อ DM ทั้งหมด

    สำหรับกลุ่ม ให้ใช้ `groupPolicy` + `groupAllowFrom` หรือ allowlist เฉพาะช่องทาง

    ดู[เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#dm-and-group-access)สำหรับรายละเอียดรายช่องทาง

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมีการ mention** กำหนดรูปแบบ trigger ต่อ agent และคงการตอบกลับห้องที่มองเห็นได้ไว้บนพาธ message-tool เริ่มต้น เว้นแต่คุณต้องการการตอบกลับสุดท้ายอัตโนมัติแบบเดิมโดยตั้งใจ:

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

    - **Metadata mentions**: @-mentions แบบ native (WhatsApp tap-to-mention, Telegram @bot ฯลฯ)
    - **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `mentionPatterns`
    - **การตอบกลับที่มองเห็นได้**: `messages.visibleReplies` สามารถบังคับให้ส่งผ่าน message-tool ทั่วทั้งระบบ; `messages.groupChat.visibleReplies` จะแทนที่ค่านั้นสำหรับกลุ่ม/ช่องทาง
    - ดู[เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#group-chat-mention-gating)สำหรับโหมดการตอบกลับที่มองเห็นได้ การแทนที่รายช่องทาง และโหมด self-chat

  </Accordion>

  <Accordion title="Restrict skills per agent">
    ใช้ `agents.defaults.skills` เป็น baseline ร่วม แล้วแทนที่ agent เฉพาะ
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

    - ละ `agents.defaults.skills` ไว้เพื่อให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
    - ละ `agents.list[].skills` ไว้เพื่อสืบทอดค่าเริ่มต้น
    - ตั้ง `agents.list[].skills: []` เพื่อไม่มี Skills
    - ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config), และ
      [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agents-defaults-skills)

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    ควบคุมว่า gateway จะรีสตาร์ตช่องทางที่ดูเหมือน stale อย่างเข้มงวดเพียงใด:

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
    - ใช้ `channels.<provider>.healthMonitor.enabled` หรือ `channels.<provider>.accounts.<id>.healthMonitor.enabled` เพื่อปิด auto-restart สำหรับช่องทางหรือบัญชีหนึ่งรายการโดยไม่ปิด monitor ทั่วทั้งระบบ
    - ดู [Health Checks](/th/gateway/health) สำหรับการดีบักเชิงปฏิบัติการ และ[เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#gateway)สำหรับฟิลด์ทั้งหมด

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    ให้ client ภายในเครื่องมีเวลามากขึ้นเพื่อทำ pre-auth WebSocket handshake ให้เสร็จบน
    โฮสต์ที่มีโหลดสูงหรือพลังประมวลผลต่ำ:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - ค่าเริ่มต้นคือ `15000` มิลลิวินาที
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ยังคงมีลำดับความสำคัญสูงกว่าสำหรับการ override service หรือ shell แบบครั้งเดียว
    - ควรแก้ปัญหา startup/event-loop stalls ก่อน; knob นี้มีไว้สำหรับโฮสต์ที่สุขภาพดีแต่ช้าในช่วง warmup

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
    - ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#session) สำหรับฟิลด์ทั้งหมด

  </Accordion>

  <Accordion title="Enable sandboxing">
    เรียกใช้เซสชันของเอเจนต์ในรันไทม์แซนด์บ็อกซ์ที่แยกออกจากกัน:

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

    สร้างอิมเมจก่อน: `scripts/sandbox-setup.sh`

    ดู [แซนด์บ็อกซ์](/th/gateway/sandboxing) สำหรับคู่มือฉบับเต็ม และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#agentsdefaultssandbox) สำหรับตัวเลือกทั้งหมด

  </Accordion>

  <Accordion title="Enable relay-backed push for official iOS builds">
    การ push ที่รองรับด้วยรีเลย์กำหนดค่าใน `openclaw.json`

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

    สิ่งที่การตั้งค่านี้ทำ:

    - อนุญาตให้ Gateway ส่ง `push.test`, การสะกิดเพื่อปลุก และการปลุกเพื่อเชื่อมต่อใหม่ผ่านรีเลย์ภายนอก
    - ใช้สิทธิ์อนุญาตส่งที่ผูกกับการลงทะเบียน ซึ่งส่งต่อโดยแอป iOS ที่จับคู่ไว้ Gateway ไม่จำเป็นต้องมีโทเค็นรีเลย์ที่ใช้ทั้งดีพลอยเมนต์
    - ผูกการลงทะเบียนที่รองรับด้วยรีเลย์แต่ละรายการกับตัวตน Gateway ที่แอป iOS จับคู่ด้วย เพื่อไม่ให้ Gateway อื่นนำการลงทะเบียนที่จัดเก็บไว้ไปใช้ซ้ำได้
    - ให้บิลด์ iOS แบบ local/ด้วยตนเองยังใช้ APNs โดยตรง การส่งที่รองรับด้วยรีเลย์มีผลเฉพาะกับบิลด์ทางการที่แจกจ่ายและลงทะเบียนผ่านรีเลย์เท่านั้น
    - ต้องตรงกับ URL ฐานของรีเลย์ที่ฝังไว้ในบิลด์ iOS ทางการ/TestFlight เพื่อให้ทราฟฟิกการลงทะเบียนและการส่งไปถึงดีพลอยเมนต์รีเลย์เดียวกัน

    โฟลว์ตั้งแต่ต้นจนจบ:

    1. ติดตั้งบิลด์ iOS ทางการ/TestFlight ที่คอมไพล์ด้วย URL ฐานของรีเลย์เดียวกัน
    2. กำหนดค่า `gateway.push.apns.relay.baseUrl` บน Gateway
    3. จับคู่แอป iOS กับ Gateway แล้วให้ทั้งเซสชัน Node และผู้ปฏิบัติงานเชื่อมต่อ
    4. แอป iOS ดึงตัวตน Gateway, ลงทะเบียนกับรีเลย์โดยใช้ App Attest พร้อมใบเสร็จของแอป แล้วเผยแพร่เพย์โหลด `push.apns.register` ที่รองรับด้วยรีเลย์ไปยัง Gateway ที่จับคู่ไว้
    5. Gateway จัดเก็บแฮนเดิลรีเลย์และสิทธิ์อนุญาตส่ง จากนั้นใช้สำหรับ `push.test`, การสะกิดเพื่อปลุก และการปลุกเพื่อเชื่อมต่อใหม่

    หมายเหตุด้านการปฏิบัติงาน:

    - หากคุณสลับแอป iOS ไปยัง Gateway อื่น ให้เชื่อมต่อแอปใหม่เพื่อให้แอปเผยแพร่การลงทะเบียนรีเลย์ใหม่ที่ผูกกับ Gateway นั้นได้
    - หากคุณเผยแพร่บิลด์ iOS ใหม่ที่ชี้ไปยังดีพลอยเมนต์รีเลย์อื่น แอปจะรีเฟรชการลงทะเบียนรีเลย์ที่แคชไว้แทนการใช้ต้นทางรีเลย์เดิมซ้ำ

    หมายเหตุความเข้ากันได้:

    - `OPENCLAW_APNS_RELAY_BASE_URL` และ `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ยังใช้งานได้ในฐานะ env override ชั่วคราว
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` ยังคงเป็นช่องทางสำรองสำหรับการพัฒนาเฉพาะ loopback เท่านั้น อย่าคง URL รีเลย์ HTTP ไว้ในการกำหนดค่า

    ดู [แอป iOS](/th/platforms/ios#relay-backed-push-for-official-builds) สำหรับโฟลว์ตั้งแต่ต้นจนจบ และ [โฟลว์การยืนยันตัวตนและความเชื่อถือ](/th/platforms/ios#authentication-and-trust-flow) สำหรับโมเดลความปลอดภัยของรีเลย์

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

    - `every`: สตริงระยะเวลา (`30m`, `2h`) ตั้งค่า `0m` เพื่อปิดใช้งาน
    - `target`: `last` | `none` | `<channel-id>` (เช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`)
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

    - `sessionRetention`: ตัดเซสชันการรันแบบแยกที่เสร็จแล้วออกจาก `sessions.json` (ค่าเริ่มต้น `24h`; ตั้งค่า `false` เพื่อปิดใช้งาน)
    - `runLog`: ตัด `cron/runs/<jobId>.jsonl` ตามขนาดและจำนวนบรรทัดที่เก็บไว้
    - ดู [งาน Cron](/th/automation/cron-jobs) สำหรับภาพรวมฟีเจอร์และตัวอย่าง CLI

  </Accordion>

  <Accordion title="Set up webhooks (hooks)">
    เปิดใช้งานปลายทาง Webhook HTTP บน Gateway:

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
    - ใช้ `hooks.token` แยกต่างหาก อย่าใช้โทเค็น Gateway ที่ใช้ร่วมกันซ้ำ
    - การยืนยันตัวตนของ hook ใช้เฉพาะส่วนหัว (`Authorization: Bearer ...` หรือ `x-openclaw-token`); โทเค็นใน query string จะถูกปฏิเสธ
    - `hooks.path` ไม่สามารถเป็น `/`; ให้ ingress ของ webhook อยู่บน subpath เฉพาะ เช่น `/hooks`
    - ปิดแฟล็กข้ามเนื้อหาที่ไม่ปลอดภัยไว้ (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) เว้นแต่กำลังดีบักในขอบเขตที่จำกัดอย่างเข้มงวด
    - หากคุณเปิดใช้งาน `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วยเพื่อจำกัดคีย์เซสชันที่ผู้เรียกเลือกได้
    - สำหรับเอเจนต์ที่ขับเคลื่อนด้วย hook ให้เลือก tier ของโมเดลสมัยใหม่ที่แข็งแรงและนโยบายเครื่องมือที่เข้มงวด (เช่น เฉพาะการส่งข้อความพร้อมแซนด์บ็อกซ์เมื่อทำได้)

    ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#hooks) สำหรับตัวเลือกการแมปทั้งหมดและการผสานรวม Gmail

  </Accordion>

  <Accordion title="Configure multi-agent routing">
    เรียกใช้เอเจนต์ที่แยกหลายตัวพร้อมพื้นที่ทำงานและเซสชันแยกกัน:

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

    ดู [หลายเอเจนต์](/th/concepts/multi-agent) และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#multi-agent-routing) สำหรับกฎการผูกและโปรไฟล์การเข้าถึงรายเอเจนต์

  </Accordion>

  <Accordion title="Split config into multiple files ($include)">
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

    - **ไฟล์เดียว**: แทนที่อ็อบเจกต์ที่ครอบอยู่
    - **อาร์เรย์ของไฟล์**: รวมแบบ deep merge ตามลำดับ (รายการหลังชนะ)
    - **คีย์ข้างเคียง**: รวมหลัง include (แทนที่ค่าที่ include มา)
    - **include ซ้อน**: รองรับลึกได้สูงสุด 10 ระดับ
    - **พาธสัมพัทธ์**: resolve โดยอิงจากไฟล์ที่ include
    - **การเขียนที่ OpenClaw เป็นเจ้าของ**: เมื่อการเขียนเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วน
      ที่รองรับด้วย include ไฟล์เดียว เช่น `plugins: { $include: "./plugins.json5" }`,
      OpenClaw จะอัปเดตไฟล์ที่ include นั้นและปล่อย `openclaw.json` ไว้เหมือนเดิม
    - **write-through ที่ไม่รองรับ**: root include, อาร์เรย์ include และ include
      ที่มี sibling override จะ fail closed สำหรับการเขียนที่ OpenClaw เป็นเจ้าของแทนการ
      flatten การกำหนดค่า
    - **การจัดการข้อผิดพลาด**: ข้อผิดพลาดที่ชัดเจนสำหรับไฟล์ที่หายไป ข้อผิดพลาดการ parse และ include แบบวนรอบ

  </Accordion>
</AccordionGroup>

## การโหลดการกำหนดค่าใหม่แบบ hot reload

Gateway เฝ้าดู `~/.openclaw/openclaw.json` และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ — ไม่ต้องรีสตาร์ตด้วยตนเองสำหรับการตั้งค่าส่วนใหญ่

การแก้ไขไฟล์โดยตรงจะถือว่าไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบความถูกต้อง watcher จะรอ
ให้การเขียนไฟล์ชั่วคราว/การเปลี่ยนชื่อจาก editor สงบลง อ่านไฟล์สุดท้าย แล้วปฏิเสธ
การแก้ไขภายนอกที่ไม่ถูกต้องโดยคืนค่าการกำหนดค่าดีล่าสุดที่รู้จัก การเขียนการกำหนดค่า
ที่ OpenClaw เป็นเจ้าของใช้ gate ของ schema เดียวกันก่อนเขียน; การเขียนทับแบบทำลายล้าง
เช่น การลบ `gateway.mode` หรือการลดขนาดไฟล์ลงมากกว่าครึ่งจะถูกปฏิเสธ
และบันทึกเป็น `.rejected.*` เพื่อให้ตรวจสอบ

ความล้มเหลวในการตรวจสอบภายใน Plugin เป็นข้อยกเว้น: หากปัญหาทั้งหมดอยู่ภายใต้
`plugins.entries.<id>...` การโหลดใหม่จะคงการกำหนดค่าปัจจุบันไว้และรายงานปัญหาของ Plugin
แทนการคืนค่า `.last-good`

หากคุณเห็น `Config auto-restored from last-known-good` หรือ
`config reload restored last-known-good config` ใน log ให้ตรวจสอบไฟล์
`.clobbered.*` ที่ตรงกันถัดจาก `openclaw.json` แก้ไขเพย์โหลดที่ถูกปฏิเสธ แล้วเรียกใช้
`openclaw config validate` ดู [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#gateway-restored-last-known-good-config)
สำหรับ checklist การกู้คืน

### โหมดการโหลดใหม่

| โหมด                   | ลักษณะการทำงาน                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (ค่าเริ่มต้น) | นำการเปลี่ยนแปลงที่ปลอดภัยไปใช้แบบ hot ทันที รีสตาร์ตโดยอัตโนมัติสำหรับการเปลี่ยนแปลงสำคัญ           |
| **`hot`**              | นำเฉพาะการเปลี่ยนแปลงที่ปลอดภัยไปใช้แบบ hot เท่านั้น บันทึกคำเตือนเมื่อจำเป็นต้องรีสตาร์ต — คุณต้องจัดการเอง |
| **`restart`**          | รีสตาร์ต Gateway เมื่อมีการเปลี่ยนแปลงการกำหนดค่าใด ๆ ไม่ว่าจะปลอดภัยหรือไม่                                 |
| **`off`**              | ปิดการเฝ้าดูไฟล์ การเปลี่ยนแปลงจะมีผลเมื่อรีสตาร์ตด้วยตนเองครั้งถัดไป                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### สิ่งที่นำไปใช้แบบ hot ได้เทียบกับสิ่งที่ต้องรีสตาร์ต

ฟิลด์ส่วนใหญ่ใช้แบบ hot ได้โดยไม่มี downtime ในโหมด `hybrid` การเปลี่ยนแปลงที่ต้องรีสตาร์ตจะถูกจัดการโดยอัตโนมัติ

| หมวดหมู่            | ฟิลด์                                                            | ต้องรีสตาร์ตหรือไม่ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| ช่องทาง            | `channels.*`, `web` (WhatsApp) — ช่องทาง built-in และ Plugin ทั้งหมด | ไม่              |
| เอเจนต์และโมเดล      | `agent`, `agents`, `models`, `routing`                            | ไม่              |
| ระบบอัตโนมัติ          | `hooks`, `cron`, `agent.heartbeat`                                | ไม่              |
| เซสชันและข้อความ | `session`, `messages`                                             | ไม่              |
| เครื่องมือและสื่อ       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | ไม่              |
| UI และอื่น ๆ           | `ui`, `logging`, `identity`, `bindings`                           | ไม่              |
| เซิร์ฟเวอร์ Gateway      | `gateway.*` (พอร์ต, bind, auth, tailscale, TLS, HTTP)              | **ใช่**         |
| โครงสร้างพื้นฐาน      | `discovery`, `canvasHost`, `plugins`                              | **ใช่**         |

<Note>
`gateway.reload` และ `gateway.remote` เป็นข้อยกเว้น — การเปลี่ยนค่าเหล่านี้จะ **ไม่** ทำให้รีสตาร์ต
</Note>

### การวางแผนการโหลดใหม่

เมื่อคุณแก้ไขไฟล์ต้นทางที่อ้างอิงผ่าน `$include` OpenClaw จะวางแผนการโหลดซ้ำจากเลย์เอาต์ที่เขียนไว้ในต้นทาง ไม่ใช่มุมมองในหน่วยความจำที่ถูกทำให้แบนราบ ซึ่งช่วยให้การตัดสินใจเกี่ยวกับการโหลดซ้ำแบบร้อน (ปรับใช้แบบร้อนเทียบกับการรีสตาร์ต) คาดการณ์ได้ แม้เมื่อส่วนระดับบนสุดเพียงส่วนเดียวอยู่ในไฟล์ที่รวมเข้ามาแยกต่างหาก เช่น `plugins: { $include: "./plugins.json5" }` การวางแผนการโหลดซ้ำจะล้มเหลวแบบปิดหากเลย์เอาต์ต้นทางกำกวม

## RPC การกำหนดค่า (การอัปเดตด้วยโปรแกรม)

สำหรับเครื่องมือที่เขียนการกำหนดค่าผ่าน API ของ Gateway ให้ใช้โฟลว์นี้เป็นหลัก:

- `config.schema.lookup` เพื่อตรวจสอบซับทรีย่อยหนึ่งรายการ (โหนดสคีมาแบบตื้น + สรุปของลูก)
- `config.get` เพื่อดึงสแนปช็อตปัจจุบันพร้อม `hash`
- `config.patch` สำหรับการอัปเดตบางส่วน (แพตช์ผสาน JSON: ออบเจ็กต์ผสานกัน, `null` ลบค่า, อาร์เรย์แทนที่ค่าเดิม)
- `config.apply` เฉพาะเมื่อคุณตั้งใจจะแทนที่การกำหนดค่าทั้งหมด
- `update.run` สำหรับการอัปเดตตัวเองแบบชัดเจนพร้อมรีสตาร์ต
- `update.status` เพื่อตรวจสอบ sentinel การรีสตาร์ตของการอัปเดตล่าสุด และยืนยันเวอร์ชันที่กำลังทำงานหลังรีสตาร์ต

Agent ควรถือว่า `config.schema.lookup` เป็นจุดเริ่มต้นสำหรับเอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำ ใช้ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) เมื่อจำเป็นต้องใช้แผนที่การกำหนดค่าที่กว้างขึ้น ค่าเริ่มต้น หรือลิงก์ไปยังข้อมูลอ้างอิงของระบบย่อยเฉพาะ

<Note>
การเขียนใน control plane (`config.apply`, `config.patch`, `update.run`) ถูกจำกัดอัตราไว้ที่ 3 คำขอต่อ 60 วินาทีต่อ `deviceId+clientIp` คำขอรีสตาร์ตจะถูกรวมเข้าด้วยกัน แล้วบังคับใช้ช่วงพัก 30 วินาทีระหว่างรอบการรีสตาร์ต `update.status` เป็นแบบอ่านอย่างเดียว แต่จำกัดอยู่ในขอบเขตผู้ดูแลระบบ เพราะ sentinel การรีสตาร์ตอาจรวมสรุปขั้นตอนการอัปเดตและส่วนท้ายของผลลัพธ์คำสั่ง
</Note>

ตัวอย่างแพตช์บางส่วน:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

ทั้ง `config.apply` และ `config.patch` รับ `raw`, `baseHash`, `sessionKey`, `note` และ `restartDelayMs` จำเป็นต้องมี `baseHash` สำหรับทั้งสองเมธอดเมื่อมีการกำหนดค่าอยู่แล้ว

## ตัวแปรสภาพแวดล้อม

OpenClaw อ่านตัวแปรสภาพแวดล้อมจากโปรเซสแม่ รวมถึง:

- `.env` จากไดเรกทอรีทำงานปัจจุบัน (ถ้ามี)
- `~/.openclaw/.env` (ตัวสำรองส่วนกลาง)

ทั้งสองไฟล์จะไม่เขียนทับตัวแปรสภาพแวดล้อมที่มีอยู่ คุณยังสามารถตั้งค่าตัวแปรสภาพแวดล้อมแบบอินไลน์ในการกำหนดค่าได้ด้วย:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="การนำเข้าสภาพแวดล้อมของ Shell (ไม่บังคับ)">
  หากเปิดใช้งานและไม่ได้ตั้งค่าคีย์ที่คาดไว้ OpenClaw จะเรียกใช้ login shell ของคุณและนำเข้าเฉพาะคีย์ที่ขาดอยู่:

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
- ตัวแปรที่ขาดหายหรือว่างจะทำให้เกิดข้อผิดพลาดขณะโหลด
- Escape ด้วย `$${VAR}` เพื่อให้ได้ผลลัพธ์แบบลิเทอรัล
- ทำงานภายในไฟล์ `$include`
- การแทนที่แบบอินไลน์: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="การอ้างอิงความลับ (env, file, exec)">
  สำหรับฟิลด์ที่รองรับออบเจ็กต์ SecretRef คุณสามารถใช้:

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
เส้นทางข้อมูลประจำตัวที่รองรับระบุไว้ใน [พื้นผิวข้อมูลประจำตัวของ SecretRef](/th/reference/secretref-credential-surface)
</Accordion>

ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญและแหล่งที่มาทั้งหมด

## ข้อมูลอ้างอิงฉบับเต็ม

สำหรับข้อมูลอ้างอิงแบบครบถ้วนทีละฟิลด์ ดู **[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)**

---

_ที่เกี่ยวข้อง: [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
- [รันบุ๊ก Gateway](/th/gateway)
