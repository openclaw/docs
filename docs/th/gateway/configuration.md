---
read_when:
    - การตั้งค่า OpenClaw เป็นครั้งแรก
    - กำลังค้นหารูปแบบการกำหนดค่าทั่วไป
    - การนำทางไปยังส่วนการกำหนดค่าเฉพาะ
summary: 'ภาพรวมการกำหนดค่า: งานทั่วไป การตั้งค่าอย่างรวดเร็ว และลิงก์ไปยังเอกสารอ้างอิงฉบับเต็ม'
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-05-03T21:32:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: e27ef442d6375d8c22715f20194fb9ce50130204377c9ba4652c2949de28967c
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw อ่านการกำหนดค่า <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> แบบไม่บังคับจาก `~/.openclaw/openclaw.json`
เส้นทางการกำหนดค่าที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ ไม่รองรับเลย์เอาต์ `openclaw.json`
ที่เป็น symlink สำหรับการเขียนที่ OpenClaw เป็นเจ้าของ การเขียนแบบ atomic อาจแทนที่
เส้นทางแทนการคง symlink ไว้ หากคุณเก็บการกำหนดค่าไว้นอกไดเรกทอรีสถานะ
เริ่มต้น ให้ชี้ `OPENCLAW_CONFIG_PATH` ไปที่ไฟล์จริงโดยตรง

หากไม่มีไฟล์ OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัย เหตุผลทั่วไปในการเพิ่มการกำหนดค่า:

- เชื่อมต่อช่องทางและควบคุมว่าใครส่งข้อความถึงบอตได้
- ตั้งค่าโมเดล เครื่องมือ sandboxing หรือระบบอัตโนมัติ (cron, hooks)
- ปรับแต่งเซสชัน สื่อ เครือข่าย หรือ UI

ดู[ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference)สำหรับทุกฟิลด์ที่มีให้ใช้

Agent และระบบอัตโนมัติควรใช้ `config.schema.lookup` สำหรับเอกสารระดับฟิลด์
ที่แม่นยำก่อนแก้ไขการกำหนดค่า ใช้หน้านี้สำหรับคำแนะนำตามงาน และ
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) สำหรับแผนผัง
ฟิลด์และค่าเริ่มต้นที่ครอบคลุมกว่า

<Tip>
**เพิ่งเริ่มใช้การกำหนดค่าใช่ไหม** เริ่มด้วย `openclaw onboard` สำหรับการตั้งค่าแบบโต้ตอบ หรือดูคู่มือ [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) สำหรับการกำหนดค่าแบบคัดลอกวางครบชุด
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
  <Tab title="ตัวช่วยแบบโต้ตอบ">
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
    UI ควบคุมจะแสดงฟอร์มจากสคีมาการกำหนดค่าสด รวมถึงเมตาดาต้าเอกสารของฟิลด์
    `title` / `description` พร้อมสคีมาของ Plugin และช่องทางเมื่อมีให้ใช้
    โดยมีตัวแก้ไข **JSON ดิบ** เป็นทางออกสำรอง สำหรับ UI แบบเจาะลึก
    และเครื่องมืออื่น Gateway ยังเปิดให้ใช้ `config.schema.lookup` เพื่อ
    ดึงโหนดสคีมาที่จำกัดตามเส้นทางหนึ่งรายการ พร้อมสรุปลูกโดยตรง
  </Tab>
  <Tab title="แก้ไขโดยตรง">
    แก้ไข `~/.openclaw/openclaw.json` โดยตรง Gateway จะเฝ้าดูไฟล์และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ (ดู [hot reload](#config-hot-reload))
  </Tab>
</Tabs>

## การตรวจสอบอย่างเข้มงวด

<Warning>
OpenClaw ยอมรับเฉพาะการกำหนดค่าที่ตรงกับสคีมาอย่างสมบูรณ์ คีย์ที่ไม่รู้จัก ชนิดที่ผิดรูปแบบ หรือค่าที่ไม่ถูกต้องจะทำให้ Gateway **ปฏิเสธการเริ่มทำงาน** ข้อยกเว้นระดับรากเพียงอย่างเดียวคือ `$schema` (สตริง) เพื่อให้ตัวแก้ไขแนบเมตาดาต้า JSON Schema ได้
</Warning>

`openclaw config schema` พิมพ์ JSON Schema มาตรฐานที่ใช้โดย UI ควบคุม
และการตรวจสอบ `config.schema.lookup` ดึงโหนดเดียวที่จำกัดตามเส้นทาง พร้อม
สรุปลูกสำหรับเครื่องมือแบบเจาะลึก เมตาดาต้าเอกสารของฟิลด์ `title`/`description`
จะส่งต่อผ่านอ็อบเจกต์ซ้อน wildcard (`*`), รายการอาร์เรย์ (`[]`) และแขนง `anyOf`/
`oneOf`/`allOf` สคีมาของ Plugin และช่องทางขณะรันไทม์จะถูกรวมเข้ามาเมื่อโหลด
รีจิสทรี manifest แล้ว

เมื่อการตรวจสอบล้มเหลว:

- Gateway จะไม่บูต
- ใช้งานได้เฉพาะคำสั่งวินิจฉัย (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- รัน `openclaw doctor` เพื่อดูปัญหาที่แน่ชัด
- รัน `openclaw doctor --fix` (หรือ `--yes`) เพื่อใช้การซ่อมแซม

Gateway จะเก็บสำเนาที่เชื่อถือได้ล่าสุดหลังจากเริ่มทำงานสำเร็จแต่ละครั้ง
แต่การเริ่มทำงานและ hot reload จะไม่กู้คืนสำเนานั้นโดยอัตโนมัติ หาก `openclaw.json`
ไม่ผ่านการตรวจสอบ (รวมถึงการตรวจสอบภายใน Plugin) การเริ่มทำงานของ Gateway
จะล้มเหลว หรือการโหลดซ้ำจะถูกข้าม และรันไทม์ปัจจุบันจะคงการกำหนดค่าล่าสุดที่ยอมรับไว้
รัน `openclaw doctor --fix` (หรือ `--yes`) เพื่อซ่อมแซมการกำหนดค่าที่มี prefix/
ถูกเขียนทับ หรือกู้คืนสำเนาที่ดีล่าสุด การเลื่อนสถานะเป็นสำเนาที่ดีล่าสุดจะถูกข้ามเมื่อ
ตัวเลือกมีตัวยึดข้อมูลลับที่ถูกปิดบัง เช่น `***`

## งานทั่วไป

<AccordionGroup>
  <Accordion title="ตั้งค่าช่องทาง (WhatsApp, Telegram, Discord และอื่นๆ)">
    แต่ละช่องทางมีส่วนการกำหนดค่าของตัวเองภายใต้ `channels.<provider>` ดูหน้าช่องทางเฉพาะสำหรับขั้นตอนการตั้งค่า:

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

    - `agents.defaults.models` กำหนดแค็ตตาล็อกโมเดลและทำหน้าที่เป็น allowlist สำหรับ `/model`
    - ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ allowlist โดยไม่ลบโมเดลที่มีอยู่ การแทนที่แบบธรรมดาที่จะลบรายการจะถูกปฏิเสธ เว้นแต่คุณส่ง `--replace`
    - การอ้างอิงโมเดลใช้รูปแบบ `provider/model` (เช่น `anthropic/claude-opus-4-6`)
    - `agents.defaults.imageMaxDimensionPx` ควบคุมการย่อขนาดภาพของ transcript/tool (ค่าเริ่มต้น `1200`); ค่าที่ต่ำกว่ามักลดการใช้ vision-token ในการรันที่มีภาพหน้าจอจำนวนมาก
    - ดู [CLI โมเดล](/th/concepts/models) สำหรับการสลับโมเดลในแชท และ [Model Failover](/th/concepts/model-failover) สำหรับการหมุนเวียนการยืนยันตัวตนและพฤติกรรม fallback
    - สำหรับผู้ให้บริการแบบกำหนดเอง/โฮสต์เอง ดู [ผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls) ในข้อมูลอ้างอิง

  </Accordion>

  <Accordion title="ควบคุมว่าใครส่งข้อความถึงบอตได้">
    การเข้าถึง DM ถูกควบคุมต่อช่องทางผ่าน `dmPolicy`:

    - `"pairing"` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียวเพื่ออนุมัติ
    - `"allowlist"`: เฉพาะผู้ส่งใน `allowFrom` (หรือที่เก็บอนุญาตที่จับคู่แล้ว)
    - `"open"`: อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)
    - `"disabled"`: เพิกเฉยต่อ DM ทั้งหมด

    สำหรับกลุ่ม ให้ใช้ `groupPolicy` + `groupAllowFrom` หรือ allowlist เฉพาะช่องทาง

    ดู[ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-channels#dm-and-group-access)สำหรับรายละเอียดรายช่องทาง

  </Accordion>

  <Accordion title="ตั้งค่าการกั้นด้วยการกล่าวถึงในแชทกลุ่ม">
    ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมีการกล่าวถึง** กำหนดรูปแบบทริกเกอร์ต่อ agent และคงการตอบกลับห้องที่มองเห็นได้ไว้บนเส้นทางเครื่องมือข้อความเริ่มต้น เว้นแต่คุณตั้งใจต้องการการตอบกลับสุดท้ายอัตโนมัติแบบเดิม:

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

    - **การกล่าวถึงจากเมตาดาต้า**: @-mentions แบบ native (WhatsApp tap-to-mention, Telegram @bot และอื่นๆ)
    - **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `mentionPatterns`
    - **การตอบกลับที่มองเห็นได้**: `messages.visibleReplies` สามารถบังคับให้ส่งผ่านเครื่องมือข้อความทั่วทั้งระบบ; `messages.groupChat.visibleReplies` จะแทนที่ค่านั้นสำหรับกลุ่ม/ช่องทาง
    - ดู[ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-channels#group-chat-mention-gating)สำหรับโหมดการตอบกลับที่มองเห็นได้ การแทนที่รายช่องทาง และโหมดแชทกับตัวเอง

  </Accordion>

  <Accordion title="จำกัด Skills ต่อ agent">
    ใช้ `agents.defaults.skills` สำหรับ baseline ที่ใช้ร่วมกัน แล้วแทนที่ agent
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

    - ละเว้น `agents.defaults.skills` เพื่อให้ Skills ไม่ถูกจำกัดเป็นค่าเริ่มต้น
    - ละเว้น `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
    - ตั้งค่า `agents.list[].skills: []` เพื่อไม่ใช้ Skills
    - ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config) และ
      [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agents-defaults-skills)

  </Accordion>

  <Accordion title="ปรับแต่งการติดตามสุขภาพช่องทางของ Gateway">
    ควบคุมว่า Gateway จะรีสตาร์ตช่องทางที่ดูค้างอย่างเข้มงวดเพียงใด:

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

    - ตั้งค่า `gateway.channelHealthCheckMinutes: 0` เพื่อปิดใช้งานการรีสตาร์ตโดยตัวติดตามสุขภาพทั่วทั้งระบบ
    - `channelStaleEventThresholdMinutes` ควรมากกว่าหรือเท่ากับช่วงเวลาตรวจสอบ
    - ใช้ `channels.<provider>.healthMonitor.enabled` หรือ `channels.<provider>.accounts.<id>.healthMonitor.enabled` เพื่อปิดใช้งานการรีสตาร์ตอัตโนมัติสำหรับช่องทางหรือบัญชีหนึ่งรายการโดยไม่ปิดตัวติดตามส่วนกลาง
    - ดู [Health Checks](/th/gateway/health) สำหรับการดีบักด้านปฏิบัติการ และ[ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#gateway)สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="ปรับแต่งระยะหมดเวลาการจับมือ WebSocket ของ Gateway">
    ให้ไคลเอนต์ในเครื่องมีเวลามากขึ้นในการจับมือ WebSocket ก่อนยืนยันตัวตนให้เสร็จ
    บนโฮสต์ที่มีโหลดสูงหรือพลังประมวลผลต่ำ:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - ค่าเริ่มต้นคือ `15000` มิลลิวินาที
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ยังคงมีลำดับความสำคัญสูงกว่าสำหรับการแทนที่แบบครั้งเดียวในบริการหรือเชลล์
    - ควรแก้ปัญหา startup/event-loop stalls ก่อน; ปุ่มปรับนี้มีไว้สำหรับโฮสต์ที่สุขภาพดีแต่ช้าในช่วง warmup

  </Accordion>

  <Accordion title="กำหนดค่าเซสชันและการรีเซ็ต">
    เซสชันควบคุมความต่อเนื่องและการแยกของการสนทนา:

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
    - ดู[ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-agents#session)สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="Enable sandboxing">
    เรียกใช้เซสชันเอเจนต์ในรันไทม์แซนด์บ็อกซ์แบบแยกส่วน:

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

    สร้างอิมเมจก่อน — จากซอร์สเช็กเอาต์ให้รัน `scripts/sandbox-setup.sh` หรือจากการติดตั้งผ่าน npm ให้ดูคำสั่ง `docker build` แบบอินไลน์ใน [แซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup)

    ดูคู่มือฉบับเต็มที่ [แซนด์บ็อกซ์](/th/gateway/sandboxing) และดูตัวเลือกทั้งหมดที่ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Enable relay-backed push for official iOS builds">
    การพุชที่รองรับด้วยรีเลย์กำหนดค่าใน `openclaw.json`

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

    - ช่วยให้ Gateway ส่ง `push.test`, การกระตุ้นปลุก และการปลุกเพื่อเชื่อมต่อใหม่ผ่านรีเลย์ภายนอกได้
    - ใช้สิทธิ์การส่งที่มีขอบเขตตามการลงทะเบียน ซึ่งส่งต่อโดยแอป iOS ที่จับคู่แล้ว Gateway ไม่จำเป็นต้องมีโทเค็นรีเลย์ระดับทั้งดีพลอยเมนต์
    - ผูกการลงทะเบียนที่รองรับด้วยรีเลย์แต่ละรายการเข้ากับตัวตนของ Gateway ที่แอป iOS จับคู่ด้วย เพื่อให้ Gateway อื่นนำการลงทะเบียนที่จัดเก็บไว้ไปใช้ซ้ำไม่ได้
    - ให้บิลด์ iOS แบบโลคัล/แมนนวลยังใช้ APNs โดยตรง การส่งที่รองรับด้วยรีเลย์ใช้กับบิลด์ที่เผยแพร่อย่างเป็นทางการซึ่งลงทะเบียนผ่านรีเลย์เท่านั้น
    - ต้องตรงกับ URL ฐานของรีเลย์ที่ฝังไว้ในบิลด์ iOS อย่างเป็นทางการ/TestFlight เพื่อให้ทราฟฟิกการลงทะเบียนและการส่งไปถึงดีพลอยเมนต์รีเลย์เดียวกัน

    โฟลว์แบบครบวงจร:

    1. ติดตั้งบิลด์ iOS อย่างเป็นทางการ/TestFlight ที่คอมไพล์ด้วย URL ฐานของรีเลย์เดียวกัน
    2. กำหนดค่า `gateway.push.apns.relay.baseUrl` บน Gateway
    3. จับคู่แอป iOS กับ Gateway และปล่อยให้ทั้งเซสชัน Node และโอเปอเรเตอร์เชื่อมต่อ
    4. แอป iOS ดึงตัวตนของ Gateway, ลงทะเบียนกับรีเลย์โดยใช้ App Attest พร้อมใบรับของแอป แล้วเผยแพร่เพย์โหลด `push.apns.register` ที่รองรับด้วยรีเลย์ไปยัง Gateway ที่จับคู่แล้ว
    5. Gateway จัดเก็บแฮนเดิลรีเลย์และสิทธิ์การส่ง แล้วใช้สิ่งเหล่านั้นสำหรับ `push.test`, การกระตุ้นปลุก และการปลุกเพื่อเชื่อมต่อใหม่

    หมายเหตุด้านการปฏิบัติงาน:

    - หากคุณสลับแอป iOS ไปยัง Gateway อื่น ให้เชื่อมต่อแอปใหม่เพื่อให้แอปเผยแพร่การลงทะเบียนรีเลย์ใหม่ที่ผูกกับ Gateway นั้นได้
    - หากคุณเผยแพร่บิลด์ iOS ใหม่ที่ชี้ไปยังดีพลอยเมนต์รีเลย์อื่น แอปจะรีเฟรชการลงทะเบียนรีเลย์ที่แคชไว้แทนการใช้ต้นทางรีเลย์เดิมซ้ำ

    หมายเหตุความเข้ากันได้:

    - `OPENCLAW_APNS_RELAY_BASE_URL` และ `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ยังใช้งานได้ในฐานะการแทนที่ผ่าน env ชั่วคราว
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` ยังคงเป็นทางออกสำหรับการพัฒนาแบบ loopback เท่านั้น อย่าบันทึก URL รีเลย์ HTTP ไว้ในการกำหนดค่า

    ดูโฟลว์แบบครบวงจรที่ [แอป iOS](/th/platforms/ios#relay-backed-push-for-official-builds) และดูโมเดลความปลอดภัยของรีเลย์ที่ [โฟลว์การยืนยันตัวตนและความเชื่อถือ](/th/platforms/ios#authentication-and-trust-flow)

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

    - `every`: สตริงระยะเวลา (`30m`, `2h`) ตั้งเป็น `0m` เพื่อปิดใช้งาน
    - `target`: `last` | `none` | `<channel-id>` (ตัวอย่างเช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`)
    - `directPolicy`: `allow` (ค่าเริ่มต้น) หรือ `block` สำหรับเป้าหมาย Heartbeat แบบ DM
    - ดูคู่มือฉบับเต็มที่ [Heartbeat](/th/gateway/heartbeat)

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

    - `sessionRetention`: ลบเซสชันการรันแบบแยกส่วนที่เสร็จแล้วออกจาก `sessions.json` (ค่าเริ่มต้น `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน)
    - `runLog`: ลบ `cron/runs/<jobId>.jsonl` ตามขนาดและจำนวนบรรทัดที่เก็บไว้
    - ดูภาพรวมฟีเจอร์และตัวอย่าง CLI ที่ [งาน Cron](/th/automation/cron-jobs)

  </Accordion>

  <Accordion title="Set up webhooks (hooks)">
    เปิดใช้งานเอนด์พอยต์ HTTP Webhook บน Gateway:

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
    - ถือว่าเนื้อหาเพย์โหลดของ hook/webhook ทั้งหมดเป็นอินพุตที่ไม่น่าเชื่อถือ
    - ใช้ `hooks.token` เฉพาะ อย่านำโทเค็น Gateway ที่ใช้ร่วมกันมาใช้ซ้ำ
    - การยืนยันตัวตนของ Hook ใช้เฉพาะส่วนหัว (`Authorization: Bearer ...` หรือ `x-openclaw-token`); โทเค็นในสตริงคำค้นจะถูกปฏิเสธ
    - `hooks.path` เป็น `/` ไม่ได้ ให้ใช้อินเกรส Webhook บนพาธย่อยเฉพาะ เช่น `/hooks`
    - ปิดใช้งานแฟล็กข้ามเนื้อหาที่ไม่ปลอดภัยไว้ (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) เว้นแต่กำลังดีบักในขอบเขตที่จำกัดอย่างเข้มงวด
    - หากคุณเปิดใช้งาน `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วยเพื่อจำกัดคีย์เซสชันที่ผู้เรียกเลือกได้
    - สำหรับเอเจนต์ที่ขับเคลื่อนด้วย hook ควรใช้ระดับโมเดลสมัยใหม่ที่แข็งแกร่งและนโยบายเครื่องมือที่เข้มงวด (เช่น เฉพาะการส่งข้อความ รวมกับแซนด์บ็อกซ์เมื่อทำได้)

    ดูตัวเลือกการแมปทั้งหมดและการผสานรวม Gmail ที่ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#hooks)

  </Accordion>

  <Accordion title="Configure multi-agent routing">
    เรียกใช้เอเจนต์แบบแยกส่วนหลายตัวพร้อมพื้นที่ทำงานและเซสชันแยกกัน:

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

    ดูกฎการผูกและโปรไฟล์การเข้าถึงต่อเอเจนต์ที่ [หลายเอเจนต์](/th/concepts/multi-agent) และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#multi-agent-routing)

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

    - **ไฟล์เดียว**: แทนที่อ็อบเจ็กต์ที่ครอบอยู่
    - **อาร์เรย์ของไฟล์**: ผสานเชิงลึกตามลำดับ (รายการหลังชนะ)
    - **คีย์พี่น้อง**: ผสานหลัง includes (แทนที่ค่าที่รวมเข้ามา)
    - **includes ซ้อนกัน**: รองรับลึกสูงสุด 10 ระดับ
    - **พาธสัมพัทธ์**: แก้พาธโดยอิงจากไฟล์ที่รวม
    - **การเขียนที่ OpenClaw เป็นเจ้าของ**: เมื่อการเขียนเปลี่ยนเฉพาะส่วนระดับบนสุดเดียว
      ที่มี single-file include รองรับ เช่น `plugins: { $include: "./plugins.json5" }`,
      OpenClaw จะอัปเดตไฟล์ที่รวมไว้นั้นและปล่อย `openclaw.json` ไว้เหมือนเดิม
    - **write-through ที่ไม่รองรับ**: root includes, อาร์เรย์ include และ includes
      ที่มีการแทนที่โดยคีย์พี่น้องจะล้มเหลวแบบปิดสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ แทนการ
      ทำให้การกำหนดค่าแบนราบ
    - **การกักขอบเขต**: พาธ `$include` ต้องแก้ได้ภายใต้ไดเรกทอรีที่เก็บ
      `openclaw.json` หากต้องการแชร์ทรีข้ามเครื่องหรือผู้ใช้ ให้ตั้งค่า
      `OPENCLAW_INCLUDE_ROOTS` เป็น path-list (`:` บน POSIX, `;` บน Windows) ของ
      ไดเรกทอรีเพิ่มเติมที่ includes อาจอ้างอิงได้ Symlink จะถูกแก้พาธ
      และตรวจสอบซ้ำ ดังนั้นพาธที่ตามตัวอักษรอยู่ในไดเรกทอรีการกำหนดค่าแต่เป้าหมายจริง
      หลุดออกจากรากที่อนุญาตทั้งหมดจะยังถูกปฏิเสธ
    - **การจัดการข้อผิดพลาด**: ข้อผิดพลาดที่ชัดเจนสำหรับไฟล์ที่ขาดหาย ข้อผิดพลาดการแยกวิเคราะห์ และ includes แบบวนรอบ

  </Accordion>
</AccordionGroup>

## การรีโหลดการกำหนดค่าแบบ hot

Gateway เฝ้าดู `~/.openclaw/openclaw.json` และใช้การเปลี่ยนแปลงโดยอัตโนมัติ — สำหรับการตั้งค่าส่วนใหญ่ไม่ต้องรีสตาร์ตด้วยตนเอง

การแก้ไขไฟล์โดยตรงจะถือว่าไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบ ตัวเฝ้าดูจะรอ
ให้การเขียนไฟล์ชั่วคราว/การเปลี่ยนชื่อจากเอดิเตอร์นิ่งลง อ่านไฟล์สุดท้าย และปฏิเสธ
การแก้ไขภายนอกที่ไม่ถูกต้องโดยไม่เขียน `openclaw.json` ใหม่ การเขียนการกำหนดค่า
ที่ OpenClaw เป็นเจ้าของใช้เกตสคีมาเดียวกันก่อนเขียน การเขียนทับที่ทำลายข้อมูล เช่น
การลบ `gateway.mode` หรือการทำให้ไฟล์เล็กลงมากกว่าครึ่ง จะถูกปฏิเสธและ
บันทึกเป็น `.rejected.*` เพื่อตรวจสอบ

หากคุณเห็น `config reload skipped (invalid config)` หรือรายงานเริ่มต้นว่า `Invalid
config` ให้ตรวจสอบการกำหนดค่า รัน `openclaw config validate` แล้วรัน `openclaw
doctor --fix` เพื่อซ่อมแซม ดูเช็กลิสต์ที่ [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config)

### โหมดการรีโหลด

| โหมด                   | พฤติกรรม                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (ค่าเริ่มต้น) | ใช้การเปลี่ยนแปลงที่ปลอดภัยแบบ hot ทันที รีสตาร์ตโดยอัตโนมัติสำหรับรายการสำคัญ           |
| **`hot`**              | ใช้เฉพาะการเปลี่ยนแปลงที่ปลอดภัยแบบ hot บันทึกคำเตือนเมื่อจำเป็นต้องรีสตาร์ต — คุณจัดการเอง |
| **`restart`**          | รีสตาร์ต Gateway เมื่อมีการเปลี่ยนแปลงการกำหนดค่าใด ๆ ไม่ว่าจะปลอดภัยหรือไม่                                 |
| **`off`**              | ปิดการเฝ้าดูไฟล์ การเปลี่ยนแปลงจะมีผลเมื่อรีสตาร์ตด้วยตนเองครั้งถัดไป                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### สิ่งที่ใช้แบบ hot ได้เทียบกับสิ่งที่ต้องรีสตาร์ต

ฟิลด์ส่วนใหญ่ใช้แบบ hot ได้โดยไม่มีช่วงหยุดทำงาน ในโหมด `hybrid` การเปลี่ยนแปลงที่ต้องรีสตาร์ตจะถูกจัดการโดยอัตโนมัติ

| หมวดหมู่            | ฟิลด์                                                            | ต้องรีสตาร์ตหรือไม่ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| ช่องทาง            | `channels.*`, `web` (WhatsApp) — ช่องทางในตัวและช่องทาง Plugin ทั้งหมด | ไม่              |
| เอเจนต์และโมเดล      | `agent`, `agents`, `models`, `routing`                            | ไม่              |
| ระบบอัตโนมัติ          | `hooks`, `cron`, `agent.heartbeat`                                | ไม่              |
| เซสชันและข้อความ | `session`, `messages`                                             | ไม่              |
| เครื่องมือและสื่อ       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | ไม่              |
| UI และเบ็ดเตล็ด           | `ui`, `logging`, `identity`, `bindings`                           | ไม่              |
| เซิร์ฟเวอร์ Gateway      | `gateway.*` (พอร์ต, bind, auth, tailscale, TLS, HTTP)              | **ใช่**         |
| โครงสร้างพื้นฐาน      | `discovery`, `canvasHost`, `plugins`                              | **ใช่**         |

<Note>
`gateway.reload` และ `gateway.remote` เป็นข้อยกเว้น — การเปลี่ยนแปลงค่าเหล่านี้จะ **ไม่** ทริกเกอร์การรีสตาร์ต
</Note>

### การวางแผนการรีโหลด

เมื่อคุณแก้ไขไฟล์ต้นทางที่อ้างอิงผ่าน `$include` OpenClaw จะวางแผน
การโหลดใหม่จากเลย์เอาต์ที่เขียนไว้ในต้นทาง ไม่ใช่มุมมองในหน่วยความจำที่ถูกทำให้แบนแล้ว
วิธีนี้ทำให้การตัดสินใจ hot-reload (hot-apply เทียบกับ restart) คาดเดาได้ แม้เมื่อ
ส่วนระดับบนสุดส่วนเดียวอยู่ในไฟล์ include ของตัวเอง เช่น
`plugins: { $include: "./plugins.json5" }` การวางแผนโหลดใหม่จะล้มเหลวแบบปิดหาก
เลย์เอาต์ต้นทางกำกวม

## RPC การกำหนดค่า (การอัปเดตผ่านโปรแกรม)

สำหรับเครื่องมือที่เขียนการกำหนดค่าผ่าน API ของ Gateway แนะนำให้ใช้โฟลว์นี้:

- `config.schema.lookup` เพื่อตรวจสอบ subtree หนึ่งรายการ (โหนด schema แบบตื้น + สรุป child)
- `config.get` เพื่อดึง snapshot ปัจจุบันพร้อม `hash`
- `config.patch` สำหรับการอัปเดตบางส่วน (JSON merge patch: object จะ merge กัน, `null`
  จะลบ, array จะแทนที่)
- `config.apply` เฉพาะเมื่อคุณตั้งใจจะแทนที่การกำหนดค่าทั้งหมด
- `update.run` สำหรับการอัปเดตตัวเองพร้อม restart อย่างชัดเจน; ใส่ `continuationMessage` เมื่อ session หลัง restart ควรรัน follow-up turn หนึ่งครั้ง
- `update.status` เพื่อตรวจสอบ restart sentinel ของการอัปเดตล่าสุด และยืนยันเวอร์ชันที่กำลังรันหลังจาก restart

Agent ควรถือว่า `config.schema.lookup` เป็นจุดแรกสำหรับเอกสารและข้อจำกัด
ระดับ field ที่ถูกต้อง ใช้ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
เมื่อจำเป็นต้องดูแผนผังการกำหนดค่าที่กว้างขึ้น ค่าเริ่มต้น หรือลิงก์ไปยัง
ข้อมูลอ้างอิงเฉพาะของ subsystem

<Note>
การเขียน control-plane (`config.apply`, `config.patch`, `update.run`) ถูกจำกัดอัตราไว้ที่
3 คำขอต่อ 60 วินาทีต่อ `deviceId+clientIp` คำขอ restart จะถูกรวมเข้าด้วยกัน
จากนั้นบังคับ cooldown 30 วินาทีระหว่างรอบ restart `update.status` เป็นแบบอ่านอย่างเดียว
แต่อยู่ใน scope ของ admin เพราะ restart sentinel อาจมีสรุปขั้นตอนการอัปเดต
และส่วนท้ายของ output คำสั่ง
</Note>

ตัวอย่าง patch บางส่วน:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

ทั้ง `config.apply` และ `config.patch` รับ `raw`, `baseHash`, `sessionKey`,
`note` และ `restartDelayMs` ต้องมี `baseHash` สำหรับทั้งสอง method เมื่อมี
การกำหนดค่าอยู่แล้ว

## ตัวแปรสภาพแวดล้อม

OpenClaw อ่าน env var จาก process แม่ รวมถึง:

- `.env` จากไดเรกทอรีทำงานปัจจุบัน (ถ้ามี)
- `~/.openclaw/.env` (fallback ส่วนกลาง)

ทั้งสองไฟล์จะไม่ override env var ที่มีอยู่ คุณยังสามารถตั้งค่า env var แบบ inline ใน config ได้ด้วย:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env import (optional)">
  หากเปิดใช้งานและ key ที่คาดไว้ไม่ได้ถูกตั้งค่า OpenClaw จะรัน login shell ของคุณและ import เฉพาะ key ที่ขาดหายไป:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

env var ที่เทียบเท่า: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Env var substitution in config values">
  อ้างอิง env var ในค่า string ของ config ใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

กฎ:

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- var ที่ขาดหายหรือว่างจะทำให้เกิดข้อผิดพลาดตอนโหลด
- escape ด้วย `$${VAR}` สำหรับ output แบบ literal
- ใช้ได้ภายในไฟล์ `$include`
- การแทนค่าแบบ inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
  สำหรับ field ที่รองรับ object SecretRef คุณสามารถใช้:

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
เส้นทาง credential ที่รองรับแสดงไว้ใน [พื้นผิว credential ของ SecretRef](/th/reference/secretref-credential-surface)
</Accordion>

ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญและแหล่งที่มาทั้งหมด

## ข้อมูลอ้างอิงฉบับเต็ม

สำหรับข้อมูลอ้างอิงแบบครบถ้วนทีละ field ดู **[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)**

---

_ที่เกี่ยวข้อง: [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) · [การตรวจวินิจฉัย](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
- [runbook ของ Gateway](/th/gateway)
