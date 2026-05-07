---
read_when:
    - การตั้งค่า OpenClaw เป็นครั้งแรก
    - กำลังค้นหารูปแบบการกำหนดค่าที่พบบ่อย
    - การนำทางไปยังส่วนการกำหนดค่าเฉพาะ
summary: 'ภาพรวมการกำหนดค่า: งานทั่วไป การตั้งค่าอย่างรวดเร็ว และลิงก์ไปยังเอกสารอ้างอิงฉบับเต็ม'
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-05-07T13:17:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b64a49882b8649280fc4f4e39bf025ccc1bdf6a813b7940a6d57ee857aea5a77
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw อ่านการกำหนดค่า <Tooltip tip="JSON5 รองรับคอมเมนต์และเครื่องหมายจุลภาคท้ายรายการ">**JSON5**</Tooltip> แบบไม่บังคับจาก `~/.openclaw/openclaw.json`
พาธการกำหนดค่าที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ เลย์เอาต์ `openclaw.json`
ที่เป็น symlink ไม่รองรับสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ การเขียนแบบ atomic อาจแทนที่
พาธแทนที่จะคง symlink ไว้ หากคุณเก็บการกำหนดค่าไว้นอกไดเรกทอรีสถานะ
เริ่มต้น ให้ชี้ `OPENCLAW_CONFIG_PATH` ไปยังไฟล์จริงโดยตรง

หากไม่มีไฟล์นี้ OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัย เหตุผลทั่วไปในการเพิ่มการกำหนดค่า:

- เชื่อมต่อช่องทางและควบคุมว่าใครส่งข้อความถึงบอตได้
- ตั้งค่าโมเดล เครื่องมือ sandboxing หรือการทำงานอัตโนมัติ (cron, hooks)
- ปรับแต่งเซสชัน สื่อ เครือข่าย หรือ UI

ดู [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference) สำหรับทุกฟิลด์ที่มี

Agent และระบบอัตโนมัติควรใช้ `config.schema.lookup` เพื่อดูเอกสารระดับฟิลด์
ที่แม่นยำก่อนแก้ไขการกำหนดค่า ใช้หน้านี้สำหรับคำแนะนำตามงาน และ
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) สำหรับแผนที่
ฟิลด์และค่าเริ่มต้นที่กว้างขึ้น

<Tip>
**เพิ่งเริ่มใช้การกำหนดค่าใช่ไหม** เริ่มด้วย `openclaw onboard` สำหรับการตั้งค่าแบบโต้ตอบ หรือดูคู่มือ [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) สำหรับการกำหนดค่าแบบคัดลอกไปใช้ได้ครบถ้วน
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
    เปิด [http://127.0.0.1:18789](http://127.0.0.1:18789) แล้วใช้แท็บ **Config**
    UI ควบคุมจะแสดงฟอร์มจาก schema การกำหนดค่าสด รวมถึงเมทาดาทาเอกสาร
    `title` / `description` ของฟิลด์ รวมถึง schema ของ Plugin และช่องทางเมื่อ
    มีให้ใช้งาน พร้อมตัวแก้ไข **Raw JSON** เป็นทางออกสำรอง สำหรับ UI
    แบบเจาะลึกและเครื่องมืออื่น Gateway ยังเปิดให้ใช้ `config.schema.lookup`
    เพื่อดึงโหนด schema ตามขอบเขตพาธหนึ่งรายการพร้อมสรุปลูกโดยตรง
  </Tab>
  <Tab title="แก้ไขโดยตรง">
    แก้ไข `~/.openclaw/openclaw.json` โดยตรง Gateway จะเฝ้าดูไฟล์และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ (ดู [hot reload](#config-hot-reload))
  </Tab>
</Tabs>

## การตรวจสอบอย่างเข้มงวด

<Warning>
OpenClaw ยอมรับเฉพาะการกำหนดค่าที่ตรงกับ schema ทั้งหมดเท่านั้น คีย์ที่ไม่รู้จัก ชนิดที่ผิดรูปแบบ หรือค่าที่ไม่ถูกต้องทำให้ Gateway **ปฏิเสธการเริ่มทำงาน** ข้อยกเว้นระดับรากเพียงอย่างเดียวคือ `$schema` (สตริง) เพื่อให้ตัวแก้ไขสามารถแนบเมทาดาทา JSON Schema ได้
</Warning>

`openclaw config schema` พิมพ์ JSON Schema มาตรฐานที่ Control UI
และการตรวจสอบใช้ `config.schema.lookup` ดึงโหนดเดียวตามขอบเขตพาธพร้อม
สรุปลูกสำหรับเครื่องมือแบบเจาะลึก เมทาดาทาเอกสาร `title`/`description` ของฟิลด์
จะส่งต่อผ่านอ็อบเจกต์ซ้อน wildcard (`*`), array-item (`[]`) และสาขา `anyOf`/
`oneOf`/`allOf` schema ของ Plugin และช่องทางขณะรันไทม์จะถูกรวมเข้ามาเมื่อโหลด
manifest registry แล้ว

เมื่อการตรวจสอบล้มเหลว:

- Gateway จะไม่บูต
- ใช้ได้เฉพาะคำสั่งวินิจฉัย (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- รัน `openclaw doctor` เพื่อดูปัญหาที่แน่นอน
- รัน `openclaw doctor --fix` (หรือ `--yes`) เพื่อใช้การซ่อมแซม

Gateway เก็บสำเนา last-known-good ที่เชื่อถือได้ไว้หลังจากเริ่มทำงานสำเร็จ
แต่ละครั้ง แต่การเริ่มทำงานและ hot reload จะไม่กู้คืนสำเนานั้นโดยอัตโนมัติ หาก `openclaw.json`
ตรวจสอบไม่ผ่าน (รวมถึงการตรวจสอบภายใน Plugin) การเริ่มต้น Gateway จะล้มเหลวหรือ
การ reload จะถูกข้าม และรันไทม์ปัจจุบันจะคงการกำหนดค่าล่าสุดที่ยอมรับไว้
รัน `openclaw doctor --fix` (หรือ `--yes`) เพื่อซ่อมแซมการกำหนดค่าที่ถูกเติม prefix/ถูกเขียนทับ หรือ
กู้คืนสำเนา last-known-good การเลื่อนสถานะเป็น last-known-good จะถูกข้ามเมื่อ
candidate มี placeholder ความลับที่ถูกปกปิด เช่น `***`

## งานทั่วไป

<AccordionGroup>
  <Accordion title="ตั้งค่าช่องทาง (WhatsApp, Telegram, Discord ฯลฯ)">
    แต่ละช่องทางมีส่วนการกำหนดค่าของตัวเองใต้ `channels.<provider>` ดูหน้าช่องทางเฉพาะสำหรับขั้นตอนการตั้งค่า:

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

    - `agents.defaults.models` กำหนดแคตตาล็อกโมเดลและทำหน้าที่เป็น allowlist สำหรับ `/model`
    - ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ allowlist โดยไม่ลบโมเดลที่มีอยู่ การแทนที่แบบธรรมดาที่จะลบรายการจะถูกปฏิเสธ เว้นแต่คุณจะส่ง `--replace`
    - การอ้างอิงโมเดลใช้รูปแบบ `provider/model` (เช่น `anthropic/claude-opus-4-6`)
    - `agents.defaults.imageMaxDimensionPx` ควบคุมการลดขนาดภาพของ transcript/tool (ค่าเริ่มต้น `1200`); ค่าที่ต่ำกว่ามักลดการใช้ vision-token ในการรันที่มีภาพหน้าจอจำนวนมาก
    - ดู [CLI โมเดล](/th/concepts/models) สำหรับการสลับโมเดลในแชต และ [Model Failover](/th/concepts/model-failover) สำหรับการหมุนเวียน auth และพฤติกรรม fallback
    - สำหรับ provider แบบกำหนดเอง/โฮสต์เอง ดู [provider แบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls) ในข้อมูลอ้างอิง

  </Accordion>

  <Accordion title="ควบคุมว่าใครสามารถส่งข้อความถึงบอทได้">
    การเข้าถึง DM ถูกควบคุมแยกตามช่องทางผ่าน `dmPolicy`:

    - `"pairing"` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียวเพื่ออนุมัติ
    - `"allowlist"`: เฉพาะผู้ส่งใน `allowFrom` (หรือที่เก็บรายการอนุญาตที่จับคู่ไว้)
    - `"open"`: อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)
    - `"disabled"`: ละเว้น DM ทั้งหมด

    สำหรับกลุ่ม ให้ใช้ `groupPolicy` + `groupAllowFrom` หรือรายการอนุญาตเฉพาะช่องทาง

    ดูรายละเอียดแยกตามช่องทางใน[เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#dm-and-group-access)

  </Accordion>

  <Accordion title="ตั้งค่าการควบคุมการกล่าวถึงในแชตกลุ่ม">
    ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องกล่าวถึง** กำหนดรูปแบบทริกเกอร์แยกตามเอเจนต์ และคงการตอบกลับในห้องที่มองเห็นได้ไว้บนเส้นทาง message-tool ค่าเริ่มต้น เว้นแต่ว่าคุณตั้งใจต้องการการตอบกลับสุดท้ายอัตโนมัติแบบเดิม:

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

    - **การกล่าวถึงจากเมทาดาทา**: @-mentions แบบเนทีฟ (การแตะเพื่อกล่าวถึงใน WhatsApp, @bot ใน Telegram ฯลฯ)
    - **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `mentionPatterns`
    - **การตอบกลับที่มองเห็นได้**: `messages.visibleReplies` สามารถบังคับให้ต้องส่งผ่าน message-tool แบบทั่วทั้งระบบได้; `messages.groupChat.visibleReplies` จะแทนที่ค่านั้นสำหรับกลุ่ม/ช่องทาง
    - ดูโหมดการตอบกลับที่มองเห็นได้ การแทนที่แยกตามช่องทาง และโหมดแชตกับตนเองใน[เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#group-chat-mention-gating)

  </Accordion>

  <Accordion title="จำกัด Skills แยกตามเอเจนต์">
    ใช้ `agents.defaults.skills` สำหรับค่าพื้นฐานร่วมกัน แล้วแทนที่เอเจนต์เฉพาะด้วย `agents.list[].skills`:

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
    - ตั้งค่า `agents.list[].skills: []` เพื่อไม่มี Skills
    - ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config), และ
      [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agents-defaults-skills)

  </Accordion>

  <Accordion title="ปรับแต่งการติดตามสถานะช่องทางของ Gateway">
    ควบคุมว่า Gateway จะรีสตาร์ตช่องทางที่ดูเหมือนค้างอย่างเข้มงวดเพียงใด:

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

    - ตั้งค่า `gateway.channelHealthCheckMinutes: 0` เพื่อปิดการรีสตาร์ตจากตัวติดตามสถานะทั่วทั้งระบบ
    - `channelStaleEventThresholdMinutes` ควรมากกว่าหรือเท่ากับช่วงเวลาการตรวจสอบ
    - ใช้ `channels.<provider>.healthMonitor.enabled` หรือ `channels.<provider>.accounts.<id>.healthMonitor.enabled` เพื่อปิดการรีสตาร์ตอัตโนมัติสำหรับช่องทางหรือบัญชีหนึ่งรายการโดยไม่ปิดตัวติดตามทั่วทั้งระบบ
    - ดู [การตรวจสอบสถานะ](/th/gateway/health) สำหรับการดีบักเชิงปฏิบัติการ และ[เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#gateway)สำหรับฟิลด์ทั้งหมด

  </Accordion>

  <Accordion title="ปรับแต่งระยะหมดเวลา handshake ของ WebSocket ใน Gateway">
    ให้ไคลเอนต์ภายในเครื่องมีเวลามากขึ้นในการทำ handshake ของ WebSocket ก่อนการยืนยันตัวตนให้เสร็จบนโฮสต์ที่มีโหลดสูงหรือพลังประมวลผลต่ำ:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - ค่าเริ่มต้นคือ `15000` มิลลิวินาที
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ยังคงมีลำดับความสำคัญสูงกว่าสำหรับการแทนที่แบบครั้งเดียวในบริการหรือ shell
    - ควรแก้ปัญหาการเริ่มต้นหรือ event-loop ที่ค้างก่อน; ตัวปรับนี้มีไว้สำหรับโฮสต์ที่ปกติแต่ช้าในช่วง warmup

  </Accordion>

  <Accordion title="กำหนดค่าเซสชันและการรีเซ็ต">
    เซสชันควบคุมความต่อเนื่องและการแยกขอบเขตของการสนทนา:

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
    - `threadBindings`: ค่าเริ่มต้นทั่วทั้งระบบสำหรับการกำหนดเส้นทางเซสชันที่ผูกกับเธรด (Discord รองรับ `/focus`, `/unfocus`, `/agents`, `/session idle`, และ `/session max-age`)
    - ดู [การจัดการเซสชัน](/th/concepts/session) สำหรับขอบเขต ลิงก์ตัวตน และนโยบายการส่ง
    - ดู[เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#session)สำหรับฟิลด์ทั้งหมด

  </Accordion>

  <Accordion title="เปิดใช้ sandboxing">
    เรียกใช้เซสชันเอเจนต์ในรันไทม์ sandbox ที่แยกออกมา:

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

    สร้างอิมเมจก่อน - จากซอร์สเช็กเอาต์ให้รัน `scripts/sandbox-setup.sh` หรือจากการติดตั้ง npm ให้ดูคำสั่ง `docker build` แบบอินไลน์ใน [Sandboxing § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup)

    ดู [Sandboxing](/th/gateway/sandboxing) สำหรับคู่มือฉบับเต็ม และ [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-agents#agentsdefaultssandbox) สำหรับตัวเลือกทั้งหมด

  </Accordion>

  <Accordion title="เปิดใช้ push ที่รองรับด้วยรีเลย์สำหรับบิลด์ iOS ทางการ">
    push ที่รองรับด้วยรีเลย์กำหนดค่าใน `openclaw.json`

    ตั้งค่านี้ในคอนฟิก Gateway:

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

    เทียบเท่าใน CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    สิ่งที่การตั้งค่านี้ทำ:

    - ให้ Gateway ส่ง `push.test`, การสะกิดปลุก และการปลุกเพื่อเชื่อมต่อใหม่ผ่านรีเลย์ภายนอก
    - ใช้สิทธิ์ส่งที่ผูกกับการลงทะเบียน ซึ่งแอป iOS ที่จับคู่แล้วส่งต่อมา Gateway ไม่จำเป็นต้องมีโทเค็นรีเลย์ระดับการปรับใช้ทั้งหมด
    - ผูกการลงทะเบียนที่รองรับด้วยรีเลย์แต่ละรายการกับตัวตน Gateway ที่แอป iOS จับคู่ด้วย เพื่อให้ Gateway อื่นไม่สามารถนำการลงทะเบียนที่จัดเก็บไว้กลับมาใช้ได้
    - ให้บิลด์ iOS แบบโลคัล/แมนนวลยังใช้ APNs โดยตรง การส่งที่รองรับด้วยรีเลย์มีผลเฉพาะกับบิลด์ที่แจกจ่ายอย่างเป็นทางการซึ่งลงทะเบียนผ่านรีเลย์เท่านั้น
    - ต้องตรงกับ URL ฐานของรีเลย์ที่ฝังไว้ในบิลด์ iOS ทางการ/TestFlight เพื่อให้ทราฟฟิกการลงทะเบียนและการส่งไปถึงการปรับใช้รีเลย์เดียวกัน

    โฟลว์ตั้งแต่ต้นจนจบ:

    1. ติดตั้งบิลด์ iOS ทางการ/TestFlight ที่คอมไพล์ด้วย URL ฐานของรีเลย์เดียวกัน
    2. กำหนดค่า `gateway.push.apns.relay.baseUrl` บน Gateway
    3. จับคู่แอป iOS กับ Gateway และให้ทั้งเซสชัน Node และเซสชันผู้ปฏิบัติงานเชื่อมต่อ
    4. แอป iOS ดึงตัวตน Gateway, ลงทะเบียนกับรีเลย์โดยใช้ App Attest พร้อมใบรับแอป แล้วเผยแพร่เพย์โหลด `push.apns.register` ที่รองรับด้วยรีเลย์ไปยัง Gateway ที่จับคู่ไว้
    5. Gateway จัดเก็บแฮนเดิลรีเลย์และสิทธิ์ส่ง แล้วใช้สิ่งเหล่านั้นสำหรับ `push.test`, การสะกิดปลุก และการปลุกเพื่อเชื่อมต่อใหม่

    หมายเหตุด้านการปฏิบัติงาน:

    - หากคุณสลับแอป iOS ไปยัง Gateway อื่น ให้เชื่อมต่อแอปใหม่เพื่อให้แอปเผยแพร่การลงทะเบียนรีเลย์ใหม่ที่ผูกกับ Gateway นั้นได้
    - หากคุณเผยแพร่บิลด์ iOS ใหม่ที่ชี้ไปยังการปรับใช้รีเลย์อื่น แอปจะรีเฟรชการลงทะเบียนรีเลย์ที่แคชไว้แทนการนำต้นทางรีเลย์เดิมกลับมาใช้

    หมายเหตุความเข้ากันได้:

    - `OPENCLAW_APNS_RELAY_BASE_URL` และ `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ยังทำงานเป็นการเขียนทับผ่าน env ชั่วคราวได้
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` ยังคงเป็นทางออกสำหรับการพัฒนาแบบ loopback-only เท่านั้น อย่าคง URL รีเลย์ HTTP ไว้ในคอนฟิก

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

    - `every`: สตริงระยะเวลา (`30m`, `2h`) ตั้งค่าเป็น `0m` เพื่อปิดใช้
    - `target`: `last` | `none` | `<channel-id>` (เช่น `discord`, `matrix`, `telegram`, หรือ `whatsapp`)
    - `directPolicy`: `allow` (ค่าเริ่มต้น) หรือ `block` สำหรับเป้าหมาย Heartbeat แบบ DM
    - ดู [Heartbeat](/th/gateway/heartbeat) สำหรับคู่มือฉบับเต็ม

  </Accordion>

  <Accordion title="กำหนดค่างาน Cron">
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

    - `sessionRetention`: ล้างเซสชันการรันแบบแยกที่เสร็จแล้วออกจาก `sessions.json` (ค่าเริ่มต้น `24h`; ตั้งค่าเป็น `false` เพื่อปิดใช้)
    - `runLog`: ล้าง `cron/runs/<jobId>.jsonl` ตามขนาดและจำนวนบรรทัดที่เก็บไว้
    - ดู [งาน Cron](/th/automation/cron-jobs) สำหรับภาพรวมฟีเจอร์และตัวอย่าง CLI

  </Accordion>

  <Accordion title="ตั้งค่า Webhook (hooks)">
    เปิดใช้เอนด์พอยต์ Webhook HTTP บน Gateway:

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
    - ใช้ `hooks.token` เฉพาะ อย่านำโทเค็น Gateway ที่แชร์มาใช้ซ้ำ
    - การตรวจสอบสิทธิ์ hook ใช้เฉพาะส่วนหัว (`Authorization: Bearer ...` หรือ `x-openclaw-token`); โทเค็นใน query-string จะถูกปฏิเสธ
    - `hooks.path` เป็น `/` ไม่ได้ ให้เก็บทางเข้าของ Webhook ไว้ในซับพาธเฉพาะ เช่น `/hooks`
    - ปิดใช้แฟล็กข้ามเนื้อหาที่ไม่ปลอดภัยไว้ (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) ยกเว้นเมื่อดีบักในขอบเขตที่จำกัดอย่างเข้มงวด
    - หากคุณเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วย เพื่อจำกัดคีย์เซสชันที่ผู้เรียกเลือกได้
    - สำหรับเอเจนต์ที่ขับเคลื่อนด้วย hook ควรใช้ระดับโมเดลสมัยใหม่ที่แข็งแกร่งและนโยบายเครื่องมือที่เข้มงวด (เช่น เฉพาะการส่งข้อความ รวมถึง sandboxing เมื่อทำได้)

    ดู [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#hooks) สำหรับตัวเลือกการแมปทั้งหมดและการผสานรวม Gmail

  </Accordion>

  <Accordion title="กำหนดค่าการกำหนดเส้นทางหลายเอเจนต์">
    เรียกใช้เอเจนต์ที่แยกจากกันหลายตัวพร้อมเวิร์กสเปซและเซสชันแยกกัน:

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

    ดู [หลายเอเจนต์](/th/concepts/multi-agent) และ [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-agents#multi-agent-routing) สำหรับกฎการผูกและโปรไฟล์การเข้าถึงรายเอเจนต์

  </Accordion>

  <Accordion title="แยกคอนฟิกเป็นหลายไฟล์ ($include)">
    ใช้ `$include` เพื่อจัดระเบียบคอนฟิกขนาดใหญ่:

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

    - **ไฟล์เดียว**: แทนที่ออบเจ็กต์ที่ครอบอยู่
    - **อาร์เรย์ของไฟล์**: ผสานแบบลึกตามลำดับ (รายการหลังชนะ)
    - **คีย์ระดับเดียวกัน**: ผสานหลัง include (เขียนทับค่าที่ include มา)
    - **include ซ้อนกัน**: รองรับลึกได้สูงสุด 10 ระดับ
    - **พาธสัมพัทธ์**: แก้พาธโดยอิงจากไฟล์ที่ include
    - **การเขียนที่ OpenClaw เป็นเจ้าของ**: เมื่อการเขียนเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วน
      ที่รองรับด้วย include ไฟล์เดียว เช่น `plugins: { $include: "./plugins.json5" }`
      OpenClaw จะอัปเดตไฟล์ที่ include นั้นและปล่อย `openclaw.json` ไว้เหมือนเดิม
    - **การเขียนทะลุที่ไม่รองรับ**: root include, อาร์เรย์ include และ include
      ที่มีการเขียนทับด้วยคีย์ระดับเดียวกันจะล้มเหลวแบบปิดสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ แทนที่จะ
      ทำให้คอนฟิกแบนลง
    - **การจำกัดขอบเขต**: พาธ `$include` ต้องแก้ได้ภายใต้ไดเรกทอรีที่มี
      `openclaw.json` หากต้องการแชร์ทรีข้ามเครื่องหรือผู้ใช้ ให้ตั้งค่า
      `OPENCLAW_INCLUDE_ROOTS` เป็นรายการพาธ (`:` บน POSIX, `;` บน Windows) ของ
      ไดเรกทอรีเพิ่มเติมที่ include อาจอ้างอิงได้ symlink จะถูกแก้พาธ
      และตรวจซ้ำ ดังนั้นพาธที่ตามตัวอักษรอยู่ในไดเรกทอรีคอนฟิกแต่
      เป้าหมายจริงหลุดออกจากทุก root ที่อนุญาตจะยังถูกปฏิเสธ
    - **การจัดการข้อผิดพลาด**: ข้อผิดพลาดที่ชัดเจนสำหรับไฟล์ที่หายไป ข้อผิดพลาดการแยกวิเคราะห์ และ include แบบวนซ้ำ

  </Accordion>
</AccordionGroup>

## การโหลดคอนฟิกซ้ำแบบ hot

Gateway เฝ้าดู `~/.openclaw/openclaw.json` และใช้การเปลี่ยนแปลงโดยอัตโนมัติ - ไม่ต้องรีสตาร์ตด้วยตนเองสำหรับการตั้งค่าส่วนใหญ่

การแก้ไขไฟล์โดยตรงจะถือว่าไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบ ตัวเฝ้าดูจะรอ
ให้ความเปลี่ยนแปลงจากการเขียนไฟล์ชั่วคราว/การเปลี่ยนชื่อของตัวแก้ไขสงบลง อ่านไฟล์สุดท้าย และปฏิเสธ
การแก้ไขภายนอกที่ไม่ถูกต้องโดยไม่เขียน `openclaw.json` ใหม่ การเขียนคอนฟิกที่ OpenClaw เป็นเจ้าของ
ใช้ด่านสคีมาเดียวกันก่อนเขียน การเขียนทับแบบทำลายข้อมูล เช่น
การลบ `gateway.mode` หรือการลดขนาดไฟล์ลงมากกว่าครึ่งจะถูกปฏิเสธและ
บันทึกเป็น `.rejected.*` เพื่อการตรวจสอบ

หากคุณเห็น `config reload skipped (invalid config)` หรือรายงานตอนเริ่มต้นว่า `Invalid
config` ให้ตรวจสอบคอนฟิก รัน `openclaw config validate` แล้วรัน `openclaw
doctor --fix` เพื่อซ่อมแซม ดู [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config)
สำหรับรายการตรวจสอบ

### โหมดโหลดซ้ำ

| โหมด                   | พฤติกรรม                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (ค่าเริ่มต้น) | ใช้การเปลี่ยนแปลงที่ปลอดภัยแบบ hot ทันที รีสตาร์ตอัตโนมัติสำหรับการเปลี่ยนแปลงสำคัญ           |
| **`hot`**              | ใช้เฉพาะการเปลี่ยนแปลงที่ปลอดภัยแบบ hot บันทึกคำเตือนเมื่อต้องรีสตาร์ต - คุณจัดการเอง |
| **`restart`**          | รีสตาร์ต Gateway เมื่อมีการเปลี่ยนแปลงคอนฟิกใด ๆ ไม่ว่าจะปลอดภัยหรือไม่                                 |
| **`off`**              | ปิดการเฝ้าดูไฟล์ การเปลี่ยนแปลงจะมีผลในการรีสตาร์ตด้วยตนเองครั้งถัดไป                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### สิ่งใดใช้แบบ hot ได้เทียบกับสิ่งใดต้องรีสตาร์ต

ฟิลด์ส่วนใหญ่ใช้แบบ hot ได้โดยไม่มี downtime ในโหมด `hybrid` การเปลี่ยนแปลงที่ต้องรีสตาร์ตจะถูกจัดการโดยอัตโนมัติ

| หมวดหมู่            | ฟิลด์                                                            | ต้องรีสตาร์ตไหม |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| ช่องทาง            | `channels.*`, `web` (WhatsApp) - ช่องทางในตัวและช่องทาง Plugin ทั้งหมด | ไม่              |
| เอเจนต์และโมเดล      | `agent`, `agents`, `models`, `routing`                            | ไม่              |
| ระบบอัตโนมัติ          | `hooks`, `cron`, `agent.heartbeat`                                | ไม่              |
| เซสชันและข้อความ | `session`, `messages`                                             | ไม่              |
| เครื่องมือและสื่อ       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | ไม่              |
| UI และเบ็ดเตล็ด           | `ui`, `logging`, `identity`, `bindings`                           | ไม่              |
| เซิร์ฟเวอร์ Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **ใช่**         |
| โครงสร้างพื้นฐาน      | `discovery`, `plugins`                                            | **ใช่**         |

<Note>
`gateway.reload` และ `gateway.remote` เป็นข้อยกเว้น - การเปลี่ยนค่าเหล่านี้จะ **ไม่** ทริกเกอร์การรีสตาร์ต
</Note>

### การวางแผนการโหลดซ้ำ

เมื่อคุณแก้ไขไฟล์ต้นฉบับที่ถูกอ้างอิงผ่าน `$include` OpenClaw จะวางแผน
การโหลดซ้ำจากเลย์เอาต์ที่เขียนไว้ในต้นฉบับ ไม่ใช่มุมมองในหน่วยความจำที่ถูกทำให้แบนแล้ว
สิ่งนี้ทำให้การตัดสินใจ hot-reload (hot-apply เทียบกับ restart) คาดเดาได้แม้เมื่อ
ส่วนระดับบนสุดส่วนเดียวอยู่ในไฟล์ included ของตัวเอง เช่น
`plugins: { $include: "./plugins.json5" }` การวางแผนโหลดซ้ำจะล้มเหลวแบบปิดหาก
เลย์เอาต์ต้นฉบับคลุมเครือ

## Config RPC (การอัปเดตเชิงโปรแกรม)

สำหรับเครื่องมือที่เขียน config ผ่าน Gateway API ให้ใช้ flow นี้เป็นหลัก:

- `config.schema.lookup` เพื่อตรวจสอบหนึ่ง subtree (schema node แบบตื้น + สรุป child)
- `config.get` เพื่อดึง snapshot ปัจจุบันพร้อม `hash`
- `config.patch` สำหรับการอัปเดตบางส่วน (JSON merge patch: object merge, `null`
  ลบ, array replace)
- `config.apply` เฉพาะเมื่อคุณต้องการแทนที่ config ทั้งหมด
- `update.run` สำหรับ self-update พร้อม restart แบบชัดเจน; ใส่ `continuationMessage` เมื่อ session หลัง restart ควรรัน follow-up turn หนึ่งครั้ง
- `update.status` เพื่อตรวจสอบ update restart sentinel ล่าสุดและยืนยัน version ที่กำลังรันหลัง restart

Agent ควรถือว่า `config.schema.lookup` เป็นจุดเริ่มต้นแรกสำหรับเอกสารและข้อจำกัด
ระดับ field ที่แม่นยำ ใช้ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
เมื่อต้องการแผนผัง config ที่กว้างขึ้น ค่าเริ่มต้น หรือลิงก์ไปยังข้อมูลอ้างอิง
subsystem เฉพาะ

<Note>
การเขียน control-plane (`config.apply`, `config.patch`, `update.run`) ถูก
rate limit ไว้ที่ 3 คำขอต่อ 60 วินาทีต่อ `deviceId+clientIp` คำขอ restart
จะถูกรวมเข้าด้วยกันแล้วบังคับ cooldown 30 วินาทีระหว่างรอบ restart
`update.status` เป็นแบบ read-only แต่จำกัดเฉพาะ admin เพราะ restart sentinel อาจ
มีสรุปขั้นตอนการอัปเดตและส่วนท้ายของ output คำสั่ง
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
`note` และ `restartDelayMs` ต้องใช้ `baseHash` สำหรับทั้งสอง method เมื่อมี
config อยู่แล้ว

## ตัวแปรสภาพแวดล้อม

OpenClaw อ่าน env vars จาก parent process รวมถึง:

- `.env` จากไดเรกทอรีทำงานปัจจุบัน (ถ้ามี)
- `~/.openclaw/.env` (global fallback)

ทั้งสองไฟล์จะไม่ override env vars ที่มีอยู่ คุณยังสามารถตั้ง inline env vars ใน config ได้:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="การนำเข้า shell env (ไม่บังคับ)">
  หากเปิดใช้งานและ key ที่คาดไว้ยังไม่ได้ถูกตั้งค่า OpenClaw จะรัน login shell ของคุณและนำเข้าเฉพาะ key ที่ขาดอยู่:

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
  อ้างอิง env vars ในค่า string ของ config ใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

กฎ:

- ตรงกับชื่อ uppercase เท่านั้น: `[A-Z_][A-Z0-9_]*`
- vars ที่ขาดหาย/ว่างจะ throw error ตอน load
- escape ด้วย `$${VAR}` สำหรับ output แบบ literal
- ทำงานภายในไฟล์ `$include`
- การแทนที่แบบ inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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
credential path ที่รองรับระบุไว้ใน [พื้นผิว Credential ของ SecretRef](/th/reference/secretref-credential-surface)
</Accordion>

ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญและแหล่งที่มาทั้งหมด

## ข้อมูลอ้างอิงฉบับเต็ม

สำหรับข้อมูลอ้างอิงแบบครบถ้วนราย field ดู **[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)**

---

_ที่เกี่ยวข้อง: [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
- [Runbook ของ Gateway](/th/gateway)
