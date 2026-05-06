---
read_when:
    - การตั้งค่า OpenClaw เป็นครั้งแรก
    - กำลังค้นหารูปแบบการกำหนดค่าทั่วไป
    - การนำทางไปยังส่วนการกำหนดค่าเฉพาะ
summary: 'ภาพรวมการกำหนดค่า: งานทั่วไป การตั้งค่าแบบรวดเร็ว และลิงก์ไปยังข้อมูลอ้างอิงฉบับเต็ม'
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-05-06T09:12:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 42de21fc7e113feffe38fe1a748430f7e59e7abaf2c18ef6f388533b1aca5c0e
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw อ่านค่าคอนฟิก <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> ที่เป็นทางเลือกจาก `~/.openclaw/openclaw.json`
พาธคอนฟิกที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ เลย์เอาต์ `openclaw.json`
แบบ symlink ไม่รองรับสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ การเขียนแบบ atomic อาจแทนที่
พาธแทนที่จะคง symlink ไว้ หากคุณเก็บคอนฟิกไว้นอกไดเรกทอรีสถานะ
เริ่มต้น ให้ชี้ `OPENCLAW_CONFIG_PATH` ไปยังไฟล์จริงโดยตรง

หากไฟล์หายไป OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัย เหตุผลทั่วไปในการเพิ่มคอนฟิก:

- เชื่อมต่อช่องทางและควบคุมว่าใครส่งข้อความถึงบอตได้
- ตั้งค่าโมเดล เครื่องมือ sandboxing หรือการทำงานอัตโนมัติ (cron, hooks)
- ปรับแต่งเซสชัน สื่อ เครือข่าย หรือ UI

ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference) สำหรับทุกฟิลด์ที่มี

Agent และระบบอัตโนมัติควรใช้ `config.schema.lookup` เพื่อดูเอกสารระดับฟิลด์
ที่แม่นยำก่อนแก้ไขคอนฟิก ใช้หน้านี้สำหรับคำแนะนำตามงาน และใช้
[เอกสารอ้างอิงคอนฟิก](/th/gateway/configuration-reference) สำหรับแผนผัง
ฟิลด์และค่าเริ่มต้นที่กว้างกว่า

<Tip>
**เพิ่งเริ่มใช้คอนฟิกใช่ไหม?** เริ่มด้วย `openclaw onboard` สำหรับการตั้งค่าแบบโต้ตอบ หรือดูคู่มือ [ตัวอย่างคอนฟิก](/th/gateway/configuration-examples) สำหรับคอนฟิกฉบับสมบูรณ์ที่คัดลอกไปใช้ได้ทันที
</Tip>

## คอนฟิกขั้นต่ำ

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## การแก้ไขคอนฟิก

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
    เปิด [http://127.0.0.1:18789](http://127.0.0.1:18789) แล้วใช้แท็บ **Config**
    Control UI แสดงฟอร์มจากสคีมาคอนฟิกสด รวมถึงเมทาดาทาเอกสารของฟิลด์
    `title` / `description` พร้อมสคีมาของ plugin และช่องทางเมื่อมีให้ใช้
    โดยมีตัวแก้ไข **Raw JSON** เป็นทางออกสำรอง สำหรับ UI แบบเจาะลึก
    และเครื่องมืออื่น ๆ gateway ยังเปิดให้ใช้ `config.schema.lookup` เพื่อ
    ดึงโหนดสคีมาแบบจำกัดตามพาธหนึ่งรายการ พร้อมสรุปลูกโดยตรง
  </Tab>
  <Tab title="Direct edit">
    แก้ไข `~/.openclaw/openclaw.json` โดยตรง Gateway จะเฝ้าดูไฟล์และใช้การเปลี่ยนแปลงโดยอัตโนมัติ (ดู [hot reload](#config-hot-reload))
  </Tab>
</Tabs>

## การตรวจสอบแบบเข้มงวด

<Warning>
OpenClaw รับเฉพาะคอนฟิกที่ตรงกับสคีมาอย่างสมบูรณ์เท่านั้น คีย์ที่ไม่รู้จัก ชนิดข้อมูลผิดรูปแบบ หรือค่าที่ไม่ถูกต้องจะทำให้ Gateway **ปฏิเสธการเริ่มทำงาน** ข้อยกเว้นระดับ root มีเพียง `$schema` (สตริง) เพื่อให้ตัวแก้ไขแนบเมทาดาทา JSON Schema ได้
</Warning>

`openclaw config schema` พิมพ์ JSON Schema มาตรฐานที่ Control UI
และการตรวจสอบใช้ `config.schema.lookup` ดึงโหนดเดียวที่จำกัดตามพาธ พร้อม
สรุปลูกสำหรับเครื่องมือแบบเจาะลึก เมทาดาทาเอกสารของฟิลด์ `title`/`description`
จะส่งต่อผ่านออบเจ็กต์ซ้อน wildcard (`*`), รายการอาร์เรย์ (`[]`) และแขนง `anyOf`/
`oneOf`/`allOf` สคีมาของ runtime plugin และช่องทางจะถูกรวมเข้ามาเมื่อโหลด
manifest registry แล้ว

เมื่อการตรวจสอบล้มเหลว:

- Gateway จะไม่บูต
- มีเพียงคำสั่งวินิจฉัยที่ทำงานได้ (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- รัน `openclaw doctor` เพื่อดูปัญหาที่แน่นอน
- รัน `openclaw doctor --fix` (หรือ `--yes`) เพื่อซ่อมแซม

Gateway เก็บสำเนาที่เชื่อถือได้ล่าสุดหลังจากการเริ่มทำงานสำเร็จทุกครั้ง
แต่การเริ่มทำงานและ hot reload จะไม่กู้คืนสำเนานั้นโดยอัตโนมัติ หาก `openclaw.json`
ไม่ผ่านการตรวจสอบ (รวมถึงการตรวจสอบภายใน plugin) การเริ่มทำงานของ Gateway จะล้มเหลว หรือ
การโหลดซ้ำจะถูกข้ามและ runtime ปัจจุบันจะคงคอนฟิกที่ยอมรับล่าสุดไว้
รัน `openclaw doctor --fix` (หรือ `--yes`) เพื่อซ่อมคอนฟิกที่มี prefix/ถูกเขียนทับ หรือ
กู้คืนสำเนาที่เชื่อถือได้ล่าสุด การเลื่อนขั้นเป็นสำเนาที่เชื่อถือได้ล่าสุดจะถูกข้ามเมื่อ
ตัวเลือกมีตัวยึดตำแหน่งความลับที่ถูกปกปิด เช่น `***`

## งานทั่วไป

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    แต่ละช่องทางมีส่วนคอนฟิกของตัวเองภายใต้ `channels.<provider>` ดูหน้าช่องทางเฉพาะสำหรับขั้นตอนการตั้งค่า:

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

    - `agents.defaults.models` กำหนดแคตตาล็อกโมเดลและทำหน้าที่เป็น allowlist สำหรับ `/model`
    - ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ allowlist โดยไม่ลบโมเดลที่มีอยู่ การแทนที่แบบธรรมดาที่จะลบรายการจะถูกปฏิเสธ เว้นแต่คุณส่ง `--replace`
    - การอ้างอิงโมเดลใช้รูปแบบ `provider/model` (เช่น `anthropic/claude-opus-4-6`)
    - `agents.defaults.imageMaxDimensionPx` ควบคุมการลดขนาดรูปภาพ transcript/tool (ค่าเริ่มต้น `1200`); ค่าที่ต่ำกว่ามักลดการใช้ vision-token ในการรันที่มีภาพหน้าจอจำนวนมาก
    - ดู [Models CLI](/th/concepts/models) สำหรับการสลับโมเดลในแชต และ [Model Failover](/th/concepts/model-failover) สำหรับการหมุนเวียนการยืนยันตัวตนและพฤติกรรม fallback
    - สำหรับผู้ให้บริการแบบกำหนดเอง/โฮสต์เอง ดู [ผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls) ในเอกสารอ้างอิง

  </Accordion>

  <Accordion title="Control who can message the bot">
    การเข้าถึง DM ถูกควบคุมแยกตามช่องทางผ่าน `dmPolicy`:

    - `"pairing"` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียวเพื่ออนุมัติ
    - `"allowlist"`: เฉพาะผู้ส่งใน `allowFrom` (หรือในที่เก็บอนุญาตที่จับคู่แล้ว)
    - `"open"`: อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)
    - `"disabled"`: ไม่สนใจ DM ทั้งหมด

    สำหรับกลุ่ม ให้ใช้ `groupPolicy` + `groupAllowFrom` หรือ allowlist เฉพาะช่องทาง

    ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#dm-and-group-access) สำหรับรายละเอียดแยกตามช่องทาง

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมีการ mention** กำหนดรูปแบบ trigger แยกตาม agent และคงการตอบกลับห้องที่มองเห็นได้ไว้บนพาธ message-tool เริ่มต้น เว้นแต่คุณตั้งใจต้องการการตอบกลับสุดท้ายอัตโนมัติแบบ legacy:

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

    - **Metadata mentions**: @-mentions แบบ native (แตะเพื่อ mention ใน WhatsApp, @bot ใน Telegram ฯลฯ)
    - **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `mentionPatterns`
    - **การตอบกลับที่มองเห็นได้**: `messages.visibleReplies` สามารถบังคับให้ส่งผ่าน message-tool ได้ทั่วทั้งระบบ; `messages.groupChat.visibleReplies` จะแทนที่ค่านั้นสำหรับกลุ่ม/ช่องทาง
    - ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#group-chat-mention-gating) สำหรับโหมดการตอบกลับที่มองเห็นได้ การแทนที่แยกตามช่องทาง และโหมดแชตกับตัวเอง

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

    - ละ `agents.defaults.skills` เพื่อให้ใช้ Skills ได้ไม่จำกัดโดยค่าเริ่มต้น
    - ละ `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
    - ตั้งค่า `agents.list[].skills: []` เพื่อไม่ให้มี Skills
    - ดู [Skills](/th/tools/skills), [คอนฟิก Skills](/th/tools/skills-config), และ
      [เอกสารอ้างอิงคอนฟิก](/th/gateway/config-agents#agents-defaults-skills)

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    ควบคุมว่า gateway จะรีสตาร์ตช่องทางที่ดูเหมือนค้างอย่างเข้มงวดแค่ไหน:

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

    - ตั้งค่า `gateway.channelHealthCheckMinutes: 0` เพื่อปิดใช้งานการรีสตาร์ตโดย health-monitor ทั้งระบบ
    - `channelStaleEventThresholdMinutes` ควรมากกว่าหรือเท่ากับช่วงเวลาตรวจสอบ
    - ใช้ `channels.<provider>.healthMonitor.enabled` หรือ `channels.<provider>.accounts.<id>.healthMonitor.enabled` เพื่อปิด auto-restarts สำหรับช่องทางหรือบัญชีหนึ่งรายการโดยไม่ปิดตัวตรวจสอบส่วนกลาง
    - ดู [Health Checks](/th/gateway/health) สำหรับการดีบักงานปฏิบัติการ และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#gateway) สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    ให้เวลาไคลเอนต์ภายในเครื่องมากขึ้นเพื่อทำ pre-auth WebSocket handshake ให้เสร็จบน
    โฮสต์ที่มีโหลดสูงหรือพลังประมวลผลต่ำ:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - ค่าเริ่มต้นคือ `15000` มิลลิวินาที
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ยังมีลำดับความสำคัญสูงกว่าสำหรับการแทนที่บริการหรือ shell แบบครั้งเดียว
    - ควรแก้ปัญหา startup/event-loop stalls ก่อน ปุ่มปรับนี้มีไว้สำหรับโฮสต์ที่สุขภาพดีแต่ช้าในช่วง warmup

  </Accordion>

  <Accordion title="Configure sessions and resets">
    เซสชันควบคุมความต่อเนื่องและการแยกบริบทของการสนทนา:

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
    - `threadBindings`: ค่าเริ่มต้นส่วนกลางสำหรับการกำหนดเส้นทางเซสชันแบบผูกกับเธรด (Discord รองรับ `/focus`, `/unfocus`, `/agents`, `/session idle`, และ `/session max-age`)
    - ดู [การจัดการเซสชัน](/th/concepts/session) สำหรับขอบเขต ลิงก์อัตลักษณ์ และนโยบายการส่ง
    - ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#session) สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="เปิดใช้ sandboxing">
    เรียกใช้เซสชัน agent ในรันไทม์ sandbox ที่แยกอยู่ต่างหาก:

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

    สร้างอิมเมจก่อน - จากซอร์สเช็กเอาต์ให้รัน `scripts/sandbox-setup.sh` หรือจากการติดตั้ง npm ดูคำสั่ง `docker build` แบบอินไลน์ใน [Sandboxing § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup)

    ดูคู่มือฉบับเต็มที่ [Sandboxing](/th/gateway/sandboxing) และ [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-agents#agentsdefaultssandbox) สำหรับตัวเลือกทั้งหมด

  </Accordion>

  <Accordion title="เปิดใช้การพุชที่ใช้ relay สำหรับบิลด์ iOS ทางการ">
    การพุชที่ใช้ relay กำหนดค่าใน `openclaw.json`

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

    - ให้ Gateway ส่ง `push.test`, การปลุกแบบสะกิด และการปลุกเพื่อเชื่อมต่อใหม่ผ่าน relay ภายนอก
    - ใช้สิทธิ์การส่งที่จำกัดตามการลงทะเบียน ซึ่งส่งต่อโดยแอป iOS ที่จับคู่แล้ว Gateway ไม่ต้องใช้โทเค็น relay ระดับการปรับใช้ทั้งหมด
    - ผูกการลงทะเบียนที่ใช้ relay แต่ละรายการกับตัวตนของ Gateway ที่แอป iOS จับคู่ด้วย ดังนั้น Gateway อื่นจึงนำการลงทะเบียนที่จัดเก็บไว้กลับมาใช้ไม่ได้
    - ให้บิลด์ iOS แบบ local/manual ใช้ APNs โดยตรงต่อไป การส่งที่ใช้ relay มีผลเฉพาะกับบิลด์ที่เผยแพร่อย่างเป็นทางการซึ่งลงทะเบียนผ่าน relay เท่านั้น
    - ต้องตรงกับ URL ฐานของ relay ที่ฝังไว้ในบิลด์ iOS ทางการ/TestFlight เพื่อให้ทราฟฟิกการลงทะเบียนและการส่งไปถึงการปรับใช้ relay เดียวกัน

    โฟลว์ตั้งแต่ต้นจนจบ:

    1. ติดตั้งบิลด์ iOS ทางการ/TestFlight ที่คอมไพล์ด้วย URL ฐานของ relay เดียวกัน
    2. กำหนดค่า `gateway.push.apns.relay.baseUrl` บน Gateway
    3. จับคู่แอป iOS กับ Gateway และให้ทั้งเซสชัน node และ operator เชื่อมต่อ
    4. แอป iOS ดึงตัวตนของ Gateway, ลงทะเบียนกับ relay โดยใช้ App Attest พร้อมใบเสร็จของแอป แล้วเผยแพร่ payload `push.apns.register` ที่ใช้ relay ไปยัง Gateway ที่จับคู่แล้ว
    5. Gateway จัดเก็บแฮนเดิล relay และสิทธิ์การส่ง จากนั้นใช้สำหรับ `push.test`, การปลุกแบบสะกิด และการปลุกเพื่อเชื่อมต่อใหม่

    หมายเหตุด้านการปฏิบัติการ:

    - หากคุณสลับแอป iOS ไปยัง Gateway อื่น ให้เชื่อมต่อแอปใหม่เพื่อให้แอปเผยแพร่การลงทะเบียน relay ใหม่ที่ผูกกับ Gateway นั้นได้
    - หากคุณเผยแพร่บิลด์ iOS ใหม่ที่ชี้ไปยังการปรับใช้ relay อื่น แอปจะรีเฟรชการลงทะเบียน relay ที่แคชไว้แทนการใช้ต้นทาง relay เดิมซ้ำ

    หมายเหตุด้านความเข้ากันได้:

    - `OPENCLAW_APNS_RELAY_BASE_URL` และ `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ยังคงใช้เป็นการ override ผ่าน env แบบชั่วคราวได้
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` ยังคงเป็นทางออกสำหรับการพัฒนาแบบ loopback-only เท่านั้น อย่าบันทึก URL relay แบบ HTTP ไว้ในการกำหนดค่า

    ดูโฟลว์ตั้งแต่ต้นจนจบที่ [แอป iOS](/th/platforms/ios#relay-backed-push-for-official-builds) และดูโมเดลความปลอดภัยของ relay ที่ [โฟลว์การยืนยันตัวตนและความเชื่อถือ](/th/platforms/ios#authentication-and-trust-flow)

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
    - `target`: `last` | `none` | `<channel-id>` (เช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`)
    - `directPolicy`: `allow` (ค่าเริ่มต้น) หรือ `block` สำหรับเป้าหมาย Heartbeat แบบ DM
    - ดูคู่มือฉบับเต็มที่ [Heartbeat](/th/gateway/heartbeat)

  </Accordion>

  <Accordion title="กำหนดค่างาน cron">
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
    - ดูภาพรวมฟีเจอร์และตัวอย่าง CLI ที่ [งาน Cron](/th/automation/cron-jobs)

  </Accordion>

  <Accordion title="ตั้งค่า webhooks (hooks)">
    เปิดใช้ endpoint Webhook แบบ HTTP บน Gateway:

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
    - การยืนยันตัวตน hook ใช้เฉพาะ header เท่านั้น (`Authorization: Bearer ...` หรือ `x-openclaw-token`); โทเค็นใน query-string จะถูกปฏิเสธ
    - `hooks.path` เป็น `/` ไม่ได้ ให้คงทางเข้า webhook ไว้บน subpath เฉพาะ เช่น `/hooks`
    - ปิดใช้แฟล็กข้ามเนื้อหาที่ไม่ปลอดภัย (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) เว้นแต่กำลังดีบักในขอบเขตที่จำกัดมาก
    - หากคุณเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วย เพื่อจำกัดคีย์เซสชันที่ผู้เรียกเลือกได้
    - สำหรับ agent ที่ขับเคลื่อนด้วย hook ควรใช้ระดับโมเดลสมัยใหม่ที่แข็งแกร่งและนโยบายเครื่องมือที่เข้มงวด (เช่น เฉพาะการส่งข้อความ พร้อม sandboxing เมื่อทำได้)

    ดูตัวเลือกการแมปทั้งหมดและการผสานรวม Gmail ที่ [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#hooks)

  </Accordion>

  <Accordion title="กำหนดค่าการกำหนดเส้นทางหลาย agent">
    เรียกใช้ agent ที่แยกอยู่ต่างหากหลายตัวพร้อม workspace และเซสชันแยกกัน:

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

    ดูกฎการ binding และโปรไฟล์การเข้าถึงราย agent ที่ [Multi-Agent](/th/concepts/multi-agent) และ [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-agents#multi-agent-routing)

  </Accordion>

  <Accordion title="แยก config ออกเป็นหลายไฟล์ ($include)">
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

    - **ไฟล์เดียว**: แทนที่ออบเจ็กต์ที่ครอบอยู่
    - **อาร์เรย์ของไฟล์**: deep-merge ตามลำดับ (รายการหลังชนะ)
    - **คีย์ระดับเดียวกัน**: รวมหลัง includes (override ค่าที่ include มา)
    - **includes แบบซ้อน**: รองรับลึกได้สูงสุด 10 ระดับ
    - **พาธแบบสัมพัทธ์**: resolve โดยอิงจากไฟล์ที่ include
    - **การเขียนที่ OpenClaw เป็นเจ้าของ**: เมื่อการเขียนเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วน
      ที่มี single-file include รองรับ เช่น `plugins: { $include: "./plugins.json5" }`,
      OpenClaw จะอัปเดตไฟล์ที่ include นั้นและปล่อย `openclaw.json` ไว้เหมือนเดิม
    - **write-through ที่ไม่รองรับ**: root includes, อาร์เรย์ include และ includes
      ที่มี sibling overrides จะล้มเหลวแบบปิดสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ แทนที่จะ
      flatten config
    - **การจำกัดขอบเขต**: พาธ `$include` ต้อง resolve อยู่ภายใต้ไดเรกทอรีที่เก็บ
      `openclaw.json` หากต้องการแชร์ tree ข้ามเครื่องหรือผู้ใช้ ให้ตั้งค่า
      `OPENCLAW_INCLUDE_ROOTS` เป็นรายการพาธ (`:` บน POSIX, `;` บน Windows) ของ
      ไดเรกทอรีเพิ่มเติมที่ includes อ้างอิงได้ symlink จะถูก resolve
      และตรวจซ้ำ ดังนั้นพาธที่ตามตัวอักษรอยู่ในไดเรกทอรี config แต่เป้าหมายจริง
      หลุดออกจาก root ที่อนุญาตทั้งหมดจะยังถูกปฏิเสธ
    - **การจัดการข้อผิดพลาด**: ข้อผิดพลาดที่ชัดเจนสำหรับไฟล์ที่หายไป, parse errors และ circular includes

  </Accordion>
</AccordionGroup>

## การ reload config แบบ hot

Gateway เฝ้าดู `~/.openclaw/openclaw.json` และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ - การตั้งค่าส่วนใหญ่ไม่ต้องรีสตาร์ทเอง

การแก้ไขไฟล์โดยตรงจะถือว่าไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบความถูกต้อง watcher จะรอ
ให้การเขียนไฟล์ชั่วคราว/การเปลี่ยนชื่อของ editor นิ่งลง อ่านไฟล์สุดท้าย แล้วปฏิเสธ
การแก้ไขภายนอกที่ไม่ถูกต้องโดยไม่เขียน `openclaw.json` ใหม่ การเขียน config
ที่ OpenClaw เป็นเจ้าของใช้ schema gate เดียวกันก่อนเขียน การ clobber แบบทำลาย เช่น
การลบ `gateway.mode` หรือการทำให้ไฟล์เล็กลงมากกว่าครึ่งจะถูกปฏิเสธและ
บันทึกเป็น `.rejected.*` สำหรับตรวจสอบ

หากคุณเห็น `config reload skipped (invalid config)` หรือ startup รายงาน `Invalid
config` ให้ตรวจสอบ config, รัน `openclaw config validate`, แล้วรัน `openclaw
doctor --fix` เพื่อซ่อมแซม ดู checklist ที่ [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config)

### โหมดการ reload

| โหมด                   | ลักษณะการทำงาน                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (ค่าเริ่มต้น) | นำการเปลี่ยนแปลงที่ปลอดภัยไปใช้แบบ hot ทันที รีสตาร์ทโดยอัตโนมัติสำหรับการเปลี่ยนแปลงที่สำคัญ           |
| **`hot`**              | นำเฉพาะการเปลี่ยนแปลงที่ปลอดภัยไปใช้แบบ hot บันทึกคำเตือนเมื่อจำเป็นต้องรีสตาร์ท - คุณจัดการเอง |
| **`restart`**          | รีสตาร์ท Gateway เมื่อมีการเปลี่ยนแปลง config ใด ๆ ไม่ว่าจะปลอดภัยหรือไม่                                 |
| **`off`**              | ปิดการเฝ้าดูไฟล์ การเปลี่ยนแปลงจะมีผลเมื่อรีสตาร์ทเองครั้งถัดไป                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### สิ่งที่นำไปใช้แบบ hot ได้เทียบกับสิ่งที่ต้องรีสตาร์ท

ฟิลด์ส่วนใหญ่นำไปใช้แบบ hot ได้โดยไม่มี downtime ในโหมด `hybrid` การเปลี่ยนแปลงที่ต้องรีสตาร์ทจะถูกจัดการโดยอัตโนมัติ

| หมวดหมู่            | ฟิลด์                                                            | ต้องรีสตาร์ทหรือไม่ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Channels            | `channels.*`, `web` (WhatsApp) - channel ในตัวและ channel ของ Plugin ทั้งหมด | ไม่              |
| Agent และโมเดล      | `agent`, `agents`, `models`, `routing`                            | ไม่              |
| Automation          | `hooks`, `cron`, `agent.heartbeat`                                | ไม่              |
| เซสชันและข้อความ | `session`, `messages`                                             | ไม่              |
| เครื่องมือและสื่อ       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | ไม่              |
| UI และอื่น ๆ           | `ui`, `logging`, `identity`, `bindings`                           | ไม่              |
| เซิร์ฟเวอร์ Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **ใช่**         |
| Infrastructure      | `discovery`, `canvasHost`, `plugins`                              | **ใช่**         |

<Note>
`gateway.reload` และ `gateway.remote` เป็นข้อยกเว้น - การเปลี่ยนค่าเหล่านี้จะ **ไม่** trigger การรีสตาร์ท
</Note>

### การวางแผนการ reload

เมื่อคุณแก้ไขไฟล์ต้นทางที่อ้างอิงผ่าน `$include` OpenClaw จะวางแผน
การโหลดใหม่จากเลย์เอาต์ที่เขียนไว้ในต้นทาง ไม่ใช่มุมมองในหน่วยความจำที่ถูกทำให้แบนแล้ว
ซึ่งทำให้การตัดสินใจ hot-reload (hot-apply เทียบกับ restart) คาดเดาได้แม้เมื่อ
ส่วนระดับบนสุดเพียงส่วนเดียวอยู่ในไฟล์ที่ include แยกไว้ เช่น
`plugins: { $include: "./plugins.json5" }` การวางแผนโหลดใหม่จะล้มเหลวแบบปิดหาก
เลย์เอาต์ต้นทางกำกวม

## RPC การกำหนดค่า (การอัปเดตด้วยโปรแกรม)

สำหรับเครื่องมือที่เขียนการกำหนดค่าผ่าน Gateway API ให้ใช้ลำดับนี้เป็นหลัก:

- `config.schema.lookup` เพื่อตรวจสอบ subtree หนึ่งรายการ (โหนด schema แบบตื้น + สรุปลูก)
- `config.get` เพื่อดึง snapshot ปัจจุบันพร้อม `hash`
- `config.patch` สำหรับการอัปเดตบางส่วน (JSON merge patch: อ็อบเจกต์ merge, `null`
  ลบ, อาร์เรย์แทนที่)
- `config.apply` เฉพาะเมื่อคุณตั้งใจแทนที่การกำหนดค่าทั้งหมด
- `update.run` สำหรับ self-update แบบชัดเจนพร้อม restart; ใส่ `continuationMessage` เมื่อ session หลัง restart ควรรันเทิร์นติดตามผลหนึ่งครั้ง
- `update.status` เพื่อตรวจสอบ sentinel การ restart จากการอัปเดตล่าสุดและยืนยันเวอร์ชันที่กำลังรันหลัง restart

Agents ควรถือว่า `config.schema.lookup` เป็นจุดเริ่มต้นแรกสำหรับเอกสารและข้อจำกัด
ระดับ field ที่แม่นยำ ใช้ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
เมื่อจำเป็นต้องใช้แผนที่การกำหนดค่าที่กว้างขึ้น ค่าเริ่มต้น หรือลิงก์ไปยังข้อมูลอ้างอิงเฉพาะของ
subsystem

<Note>
การเขียน control-plane (`config.apply`, `config.patch`, `update.run`) ถูก
จำกัดอัตราที่ 3 คำขอต่อ 60 วินาทีต่อ `deviceId+clientIp` คำขอ restart
จะถูกรวมเข้าด้วยกันแล้วบังคับใช้ cooldown 30 วินาทีระหว่างรอบ restart
`update.status` เป็นแบบอ่านอย่างเดียวแต่จำกัดเฉพาะ admin เพราะ sentinel การ restart อาจ
รวมสรุปขั้นตอนการอัปเดตและส่วนท้ายของเอาต์พุตคำสั่ง
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
`note` และ `restartDelayMs` ต้องมี `baseHash` สำหรับทั้งสองเมธอดเมื่อมี
การกำหนดค่าอยู่แล้ว

## ตัวแปรสภาพแวดล้อม

OpenClaw อ่าน env vars จาก parent process รวมถึง:

- `.env` จากไดเรกทอรีทำงานปัจจุบัน (ถ้ามี)
- `~/.openclaw/.env` (fallback ส่วนกลาง)

ไฟล์ทั้งสองจะไม่ override env vars ที่มีอยู่ คุณยังตั้งค่า inline env vars ในการกำหนดค่าได้ด้วย:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="นำเข้า env ของ Shell (ไม่บังคับ)">
  หากเปิดใช้งานและคีย์ที่คาดไว้ไม่ได้ถูกตั้งค่า OpenClaw จะรัน login shell ของคุณและนำเข้าเฉพาะคีย์ที่ขาดหายไป:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env var ที่เทียบเท่า: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="การแทนที่ env var ในค่าการกำหนดค่า">
  อ้างอิง env vars ในค่าสตริงการกำหนดค่าใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

กฎ:

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- vars ที่หายไป/ว่างจะโยนข้อผิดพลาดขณะโหลด
- escape ด้วย `$${VAR}` สำหรับเอาต์พุตแบบ literal
- ใช้งานได้ภายในไฟล์ `$include`
- การแทนที่ inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="การอ้างอิงความลับ (env, file, exec)">
  สำหรับ field ที่รองรับอ็อบเจกต์ SecretRef คุณใช้ได้ดังนี้:

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
เส้นทางข้อมูลรับรองที่รองรับแสดงไว้ใน [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
</Accordion>

ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญและแหล่งที่มาทั้งหมด

## ข้อมูลอ้างอิงฉบับเต็ม

สำหรับข้อมูลอ้างอิงครบถ้วนแบบ field-by-field ดู **[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)**

---

_ที่เกี่ยวข้อง: [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
- [runbook ของ Gateway](/th/gateway)
