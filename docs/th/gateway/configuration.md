---
read_when:
    - การตั้งค่า OpenClaw เป็นครั้งแรก
    - กำลังมองหารูปแบบการกำหนดค่าทั่วไป
    - การนำทางไปยังส่วนการกำหนดค่าเฉพาะ
summary: 'ภาพรวมการกำหนดค่า: งานทั่วไป การตั้งค่าอย่างรวดเร็ว และลิงก์ไปยังเอกสารอ้างอิงฉบับเต็ม'
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-06-27T17:32:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53ab0299aca69dafd240550bac1407356b0b3f5f35ef0171ea961c36346d3cab
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw อ่านการกำหนดค่า <Tooltip tip="JSON5 รองรับคอมเมนต์และเครื่องหมายจุลภาคท้ายรายการ">**JSON5**</Tooltip> แบบไม่บังคับจาก `~/.openclaw/openclaw.json`.
พาธการกำหนดค่าที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ เลย์เอาต์ `openclaw.json`
ที่เป็น symlink ไม่รองรับสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนแบบ atomic อาจแทนที่
พาธแทนที่จะรักษา symlink ไว้ หากคุณเก็บการกำหนดค่าไว้นอกไดเรกทอรีสถานะ
เริ่มต้น ให้ชี้ `OPENCLAW_CONFIG_PATH` ไปยังไฟล์จริงโดยตรง

หากไฟล์หายไป OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัย เหตุผลทั่วไปในการเพิ่มการกำหนดค่า:

- เชื่อมต่อช่องทางและควบคุมว่าใครสามารถส่งข้อความถึงบอตได้
- ตั้งค่าโมเดล เครื่องมือ sandboxing หรือ automation (cron, hooks)
- ปรับแต่งเซสชัน สื่อ เครือข่าย หรือ UI

ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference) สำหรับทุกฟิลด์ที่มี

Agents และ automation ควรใช้ `config.schema.lookup` สำหรับเอกสารระดับฟิลด์
ที่แม่นยำก่อนแก้ไขการกำหนดค่า ใช้หน้านี้สำหรับคำแนะนำตามงาน และ
[เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) สำหรับแผนผัง
ฟิลด์และค่าเริ่มต้นที่กว้างกว่า

<Tip>
**เพิ่งเริ่มใช้การกำหนดค่า?** เริ่มด้วย `openclaw onboard` สำหรับการตั้งค่าแบบโต้ตอบ หรือดูคู่มือ [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) สำหรับการกำหนดค่าแบบคัดลอกแล้ววางได้ครบถ้วน
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
  <Tab title="Control UI">
    เปิด [http://127.0.0.1:18789](http://127.0.0.1:18789) แล้วใช้แท็บ **การกำหนดค่า**
    Control UI แสดงแบบฟอร์มจาก schema การกำหนดค่าสด รวมถึง metadata เอกสารของฟิลด์
    `title` / `description` พร้อม schema ของ Plugin และช่องทางเมื่อ
    พร้อมใช้งาน โดยมีตัวแก้ไข **Raw JSON** เป็นทางออกสำรอง สำหรับ UI แบบเจาะลึก
    และเครื่องมืออื่น ๆ gateway ยังเปิดให้ใช้ `config.schema.lookup` เพื่อ
    ดึงโหนด schema ตามพาธหนึ่งรายการพร้อมสรุปลูกโดยตรง
  </Tab>
  <Tab title="แก้ไขโดยตรง">
    แก้ไข `~/.openclaw/openclaw.json` โดยตรง Gateway จะเฝ้าดูไฟล์และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ (ดู [hot reload](#config-hot-reload))
  </Tab>
</Tabs>

## การตรวจสอบความถูกต้องแบบเข้มงวด

<Warning>
OpenClaw ยอมรับเฉพาะการกำหนดค่าที่ตรงกับ schema อย่างครบถ้วนเท่านั้น คีย์ที่ไม่รู้จัก ชนิดข้อมูลผิดรูปแบบ หรือค่าที่ไม่ถูกต้องจะทำให้ Gateway **ปฏิเสธการเริ่มทำงาน** ข้อยกเว้นระดับรากเพียงอย่างเดียวคือ `$schema` (string) เพื่อให้เอดิเตอร์แนบ metadata ของ JSON Schema ได้
</Warning>

`openclaw config schema` พิมพ์ JSON Schema มาตรฐานที่ Control UI
และการตรวจสอบความถูกต้องใช้ `config.schema.lookup` ดึงโหนดหนึ่งรายการตามพาธ
พร้อมสรุปลูกสำหรับเครื่องมือแบบเจาะลึก metadata เอกสารของฟิลด์ `title`/`description`
จะส่งต่อผ่านออบเจ็กต์ซ้อน wildcard (`*`), array-item (`[]`) และสาขา `anyOf`/
`oneOf`/`allOf` schema ของ Plugin และช่องทางขณะรันไทม์จะถูกรวมเข้ามาเมื่อ
โหลดรีจิสทรี manifest แล้ว

เมื่อการตรวจสอบความถูกต้องล้มเหลว:

- Gateway จะไม่บูต
- มีเพียงคำสั่งวินิจฉัยที่ทำงานได้ (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- รัน `openclaw doctor` เพื่อดูปัญหาที่แน่ชัด
- รัน `openclaw doctor --fix` (หรือ `--yes`) เพื่อใช้การซ่อมแซม

Gateway เก็บสำเนาที่เชื่อถือได้ซึ่งใช้งานได้ล่าสุดหลังจากเริ่มทำงานสำเร็จแต่ละครั้ง
แต่การเริ่มทำงานและ hot reload จะไม่กู้คืนสำเนานั้นโดยอัตโนมัติ หาก `openclaw.json`
ตรวจสอบความถูกต้องไม่ผ่าน (รวมถึงการตรวจสอบเฉพาะใน Plugin) การเริ่ม Gateway จะล้มเหลว หรือ
การ reload จะถูกข้ามและรันไทม์ปัจจุบันจะคงการกำหนดค่าที่ได้รับการยอมรับล่าสุดไว้
รัน `openclaw doctor --fix` (หรือ `--yes`) เพื่อซ่อมแซมการกำหนดค่าที่มี prefix/ถูกเขียนทับ หรือ
กู้คืนสำเนาที่ใช้งานได้ล่าสุด การโปรโมตเป็นสถานะใช้งานได้ล่าสุดจะถูกข้ามเมื่อ
candidate มี placeholder ความลับที่ถูกปกปิด เช่น `***`

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

    - `agents.defaults.models` กำหนดแค็ตตาล็อกโมเดลและทำหน้าที่เป็น allowlist สำหรับ `/model`; รายการ `provider/*` จะกรอง `/model`, `/models` และตัวเลือกโมเดลให้เหลือ provider ที่เลือกไว้ โดยยังคงใช้การค้นพบโมเดลแบบไดนามิก
    - ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ allowlist โดยไม่ลบโมเดลที่มีอยู่ การแทนที่แบบธรรมดาที่จะลบรายการจะถูกปฏิเสธ เว้นแต่คุณส่ง `--replace`
    - refs ของโมเดลใช้รูปแบบ `provider/model` (เช่น `anthropic/claude-opus-4-6`)
    - `agents.defaults.imageMaxDimensionPx` ควบคุมการย่อขนาดรูปภาพใน transcript/tool (ค่าเริ่มต้น `1200`); ค่าที่ต่ำกว่ามักลดการใช้ vision-token ในการรันที่มี screenshot จำนวนมาก
    - ดู [Models CLI](/th/concepts/models) สำหรับการสลับโมเดลในแชต และ [Model Failover](/th/concepts/model-failover) สำหรับการหมุนเวียน auth และพฤติกรรม fallback
    - สำหรับ provider แบบกำหนดเอง/โฮสต์เอง ดู [Custom providers](/th/gateway/config-tools#custom-providers-and-base-urls) ในเอกสารอ้างอิง

  </Accordion>

  <Accordion title="ควบคุมว่าใครสามารถส่งข้อความถึงบอตได้">
    การเข้าถึง DM ถูกควบคุมต่อช่องทางผ่าน `dmPolicy`:

    - `"pairing"` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing แบบใช้ครั้งเดียวเพื่ออนุมัติ
    - `"allowlist"`: เฉพาะผู้ส่งใน `allowFrom` (หรือที่เก็บ allow ที่ pair แล้ว)
    - `"open"`: อนุญาต DM ขาเข้าทั้งหมด (ต้องมี `allowFrom: ["*"]`)
    - `"disabled"`: เพิกเฉยต่อ DM ทั้งหมด

    สำหรับกลุ่ม ให้ใช้ `groupPolicy` + `groupAllowFrom` หรือ allowlist เฉพาะช่องทาง

    ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#dm-and-group-access) สำหรับรายละเอียดรายช่องทาง

  </Accordion>

  <Accordion title="ตั้งค่า mention gating สำหรับแชตกลุ่ม">
    ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมี mention** กำหนดรูปแบบทริกเกอร์ต่อ agent การตอบกลับกลุ่ม/ช่องทางปกติจะโพสต์โดยอัตโนมัติ; เลือกใช้เส้นทาง message-tool สำหรับห้องที่ใช้ร่วมกันซึ่ง agent ควรตัดสินใจเองว่าเมื่อใดจะพูด:

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

    - **Metadata mentions**: native @-mentions (WhatsApp แตะเพื่อ mention, Telegram @bot ฯลฯ)
    - **Text patterns**: รูปแบบ regex ที่ปลอดภัยใน `mentionPatterns`
    - **Visible replies**: `messages.visibleReplies` สามารถบังคับให้ส่งผ่าน message-tool ทั่วทั้งระบบ; `messages.groupChat.visibleReplies` override ค่านั้นสำหรับกลุ่ม/ช่องทาง
    - ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#group-chat-mention-gating) สำหรับโหมด visible reply, override รายช่องทาง และโหมดแชตกับตัวเอง

  </Accordion>

  <Accordion title="จำกัด Skills ต่อ agent">
    ใช้ `agents.defaults.skills` สำหรับ baseline ร่วม แล้ว override agent เฉพาะ
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

    - ละเว้น `agents.defaults.skills` เพื่อให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
    - ละเว้น `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
    - ตั้งค่า `agents.list[].skills: []` เพื่อไม่ให้มี Skills
    - ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config) และ
      [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agents-defaults-skills)

  </Accordion>

  <Accordion title="ปรับแต่งการตรวจสอบสุขภาพช่องทางของ gateway">
    ควบคุมว่า gateway จะ restart ช่องทางที่ดูเหมือนค้างอย่างเข้มงวดเพียงใด:

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

    - ตั้งค่า `gateway.channelHealthCheckMinutes: 0` เพื่อปิดการ restart โดย health-monitor ทั่วทั้งระบบ
    - `channelStaleEventThresholdMinutes` ควรมากกว่าหรือเท่ากับช่วงเวลาการตรวจสอบ
    - ใช้ `channels.<provider>.healthMonitor.enabled` หรือ `channels.<provider>.accounts.<id>.healthMonitor.enabled` เพื่อปิด auto-restart สำหรับช่องทางหรือบัญชีหนึ่งรายการโดยไม่ปิด monitor ทั่วทั้งระบบ
    - ดู [Health Checks](/th/gateway/health) สำหรับการดีบักเชิงปฏิบัติการ และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#gateway) สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="ปรับแต่ง timeout ของการ handshake WebSocket ของ gateway">
    ให้เวลา client ในเครื่องมากขึ้นในการทำ pre-auth WebSocket handshake ให้เสร็จบน
    โฮสต์ที่มีภาระสูงหรือพลังต่ำ:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - ค่าเริ่มต้นคือ `15000` มิลลิวินาที
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ยังคงมีลำดับความสำคัญสูงกว่าสำหรับการ override แบบเฉพาะครั้งของ service หรือ shell
    - ควรแก้ startup/event-loop stall ก่อน; knob นี้มีไว้สำหรับโฮสต์ที่สุขภาพดีแต่ช้าในช่วง warmup

  </Accordion>

  <Accordion title="กำหนดค่าเซสชันและการรีเซ็ต">
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

    - `dmScope`: `main` (แชร์) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: ค่าเริ่มต้นส่วนกลางสำหรับการกำหนดเส้นทางเซสชันที่ผูกกับเธรด (Discord รองรับ `/focus`, `/unfocus`, `/agents`, `/session idle`, และ `/session max-age`)
    - ดู [การจัดการเซสชัน](/th/concepts/session) สำหรับขอบเขต ลิงก์ข้อมูลประจำตัว และนโยบายการส่ง
    - ดู [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-agents#session) สำหรับฟิลด์ทั้งหมด

  </Accordion>

  <Accordion title="เปิดใช้ sandboxing">
    เรียกใช้เซสชันเอเจนต์ในรันไทม์แซนด์บ็อกซ์ที่แยกออกจากกัน:

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

    สร้างอิมเมจก่อน - จากเช็กเอาต์ซอร์สให้รัน `scripts/sandbox-setup.sh` หรือจากการติดตั้ง npm ให้ดูคำสั่ง `docker build` แบบอินไลน์ใน [Sandboxing § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup)

    ดู [Sandboxing](/th/gateway/sandboxing) สำหรับคู่มือฉบับเต็ม และ [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-agents#agentsdefaultssandbox) สำหรับตัวเลือกทั้งหมด

  </Accordion>

  <Accordion title="เปิดใช้ push ที่รองรับด้วย relay สำหรับบิลด์ iOS อย่างเป็นทางการ">
    push ที่รองรับด้วย relay สำหรับบิลด์สาธารณะ App Store/TestFlight ใช้ relay ที่โฮสต์โดย OpenClaw: `https://ios-push-relay.openclaw.ai`

    การปรับใช้ relay แบบกำหนดเองต้องใช้เส้นทางบิลด์/การปรับใช้ iOS ที่แยกออกโดยตั้งใจ ซึ่ง URL ของ relay ตรงกับ URL ของ gateway relay หากคุณใช้บิลด์ relay แบบกำหนดเอง ให้ตั้งค่านี้ในการกำหนดค่า Gateway:

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

    - อนุญาตให้ Gateway ส่ง `push.test`, การสะกิดเพื่อปลุก และการปลุกเพื่อเชื่อมต่อใหม่ผ่าน relay ภายนอก
    - ใช้สิทธิ์การส่งที่จำกัดตามการลงทะเบียน ซึ่งแอป iOS ที่จับคู่ไว้ส่งต่อมา Gateway ไม่จำเป็นต้องใช้โทเค็น relay ระดับการปรับใช้
    - ผูกการลงทะเบียนที่รองรับด้วย relay แต่ละรายการกับข้อมูลประจำตัวของ Gateway ที่แอป iOS จับคู่ไว้ ดังนั้น Gateway อื่นจึงไม่สามารถใช้การลงทะเบียนที่จัดเก็บไว้ซ้ำได้
    - ให้บิลด์ iOS แบบโลคัล/แมนนวลอยู่บน APNs โดยตรง การส่งที่รองรับด้วย relay ใช้เฉพาะกับบิลด์ที่เผยแพร่อย่างเป็นทางการซึ่งลงทะเบียนผ่าน relay
    - ต้องตรงกับ URL ฐานของ relay ที่ฝังอยู่ในบิลด์ iOS เพื่อให้ทราฟฟิกการลงทะเบียนและการส่งไปถึงการปรับใช้ relay เดียวกัน

    โฟลว์ตั้งแต่ต้นจนจบ:

    1. ติดตั้งบิลด์ iOS อย่างเป็นทางการ/TestFlight
    2. ไม่บังคับ: กำหนดค่า `gateway.push.apns.relay.baseUrl` บน Gateway เฉพาะเมื่อใช้บิลด์ relay แบบกำหนดเองที่แยกออกโดยตั้งใจ
    3. จับคู่แอป iOS กับ Gateway และให้ทั้งเซสชัน node และเซสชันผู้ปฏิบัติการเชื่อมต่อ
    4. แอป iOS ดึงข้อมูลประจำตัวของ Gateway ลงทะเบียนกับ relay โดยใช้ App Attest พร้อมใบเสร็จของแอป แล้วเผยแพร่เพย์โหลด `push.apns.register` ที่รองรับด้วย relay ไปยัง Gateway ที่จับคู่ไว้
    5. Gateway จัดเก็บ handle ของ relay และสิทธิ์การส่ง จากนั้นใช้สำหรับ `push.test`, การสะกิดเพื่อปลุก และการปลุกเพื่อเชื่อมต่อใหม่

    หมายเหตุด้านการปฏิบัติงาน:

    - หากคุณสลับแอป iOS ไปยัง Gateway อื่น ให้เชื่อมต่อแอปใหม่เพื่อให้แอปเผยแพร่การลงทะเบียน relay ใหม่ที่ผูกกับ Gateway นั้น
    - หากคุณส่งบิลด์ iOS ใหม่ที่ชี้ไปยังการปรับใช้ relay อื่น แอปจะรีเฟรชการลงทะเบียน relay ที่แคชไว้แทนการใช้ต้นทาง relay เดิมซ้ำ

    หมายเหตุด้านความเข้ากันได้:

    - `OPENCLAW_APNS_RELAY_BASE_URL` และ `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ยังคงใช้งานได้ในฐานะการเขียนทับ env ชั่วคราว
    - URL relay ของ Gateway แบบกำหนดเองต้องตรงกับ URL ฐานของ relay ที่ฝังอยู่ในบิลด์ iOS ช่องทางเผยแพร่ App Store สาธารณะจะปฏิเสธการเขียนทับ URL relay ของ iOS แบบกำหนดเอง
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` ยังคงเป็นทางออกสำหรับการพัฒนาเฉพาะ loopback เท่านั้น อย่าบันทึก URL relay แบบ HTTP ไว้ในการกำหนดค่า

    ดู [แอป iOS](/th/platforms/ios#relay-backed-push-for-official-builds) สำหรับโฟลว์ตั้งแต่ต้นจนจบ และ [โฟลว์การยืนยันตัวตนและความเชื่อถือ](/th/platforms/ios#authentication-and-trust-flow) สำหรับโมเดลความปลอดภัยของ relay

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

    - `every`: สตริงระยะเวลา (`30m`, `2h`) ตั้งค่า `0m` เพื่อปิดใช้
    - `target`: `last` | `none` | `<channel-id>` (เช่น `discord`, `matrix`, `telegram`, หรือ `whatsapp`)
    - `directPolicy`: `allow` (ค่าเริ่มต้น) หรือ `block` สำหรับเป้าหมาย Heartbeat แบบ DM
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

    - `sessionRetention`: ตัดเซสชันการรันแบบแยกที่เสร็จสมบูรณ์ออกจาก `sessions.json` (ค่าเริ่มต้น `24h`; ตั้งค่า `false` เพื่อปิดใช้)
    - `runLog`: ตัดแถวประวัติการรัน Cron ที่เก็บไว้ต่อหนึ่งงาน `maxBytes` ยังคงรับได้สำหรับบันทึกการรันรุ่นเก่าที่อิงไฟล์
    - ดู [งาน Cron](/th/automation/cron-jobs) สำหรับภาพรวมฟีเจอร์และตัวอย่าง CLI

  </Accordion>

  <Accordion title="ตั้งค่า Webhook (hooks)">
    เปิดใช้ปลายทาง HTTP Webhook บน Gateway:

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
    - ใช้ `hooks.token` เฉพาะ อย่าใช้ข้อมูลลับการยืนยันตัวตนของ Gateway ที่ใช้งานอยู่ซ้ำ (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`)
    - การยืนยันตัวตนของ Hook ใช้เฉพาะส่วนหัว (`Authorization: Bearer ...` หรือ `x-openclaw-token`); โทเค็นในสตริงคำค้นจะถูกปฏิเสธ
    - `hooks.path` ต้องไม่เป็น `/`; ให้คงทางเข้าของ Webhook ไว้บนพาธย่อยเฉพาะ เช่น `/hooks`
    - ปิดแฟล็กข้ามเนื้อหาที่ไม่ปลอดภัยไว้ (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) เว้นแต่กำลังดีบักในขอบเขตที่จำกัดมาก
    - หากคุณเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วย เพื่อจำกัดคีย์เซสชันที่ผู้เรียกเลือกได้
    - สำหรับเอเจนต์ที่ขับเคลื่อนด้วย hook ให้เลือกใช้ระดับโมเดลสมัยใหม่ที่แข็งแกร่งและนโยบายเครื่องมือที่เข้มงวด (เช่น เฉพาะการส่งข้อความพร้อม sandboxing เมื่อเป็นไปได้)

    ดู [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#hooks) สำหรับตัวเลือกการแมปทั้งหมดและการผสานรวม Gmail

  </Accordion>

  <Accordion title="กำหนดค่าการกำหนดเส้นทางหลายเอเจนต์">
    เรียกใช้เอเจนต์ที่แยกออกจากกันหลายตัวโดยมีพื้นที่ทำงานและเซสชันแยกกัน:

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

    ดู [หลายเอเจนต์](/th/concepts/multi-agent) และ [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-agents#multi-agent-routing) สำหรับกฎการผูกและโปรไฟล์การเข้าถึงต่อเอเจนต์

  </Accordion>

  <Accordion title="แยกการกำหนดค่าออกเป็นหลายไฟล์ ($include)">
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

    - **ไฟล์เดียว**: แทนที่อ็อบเจ็กต์ที่บรรจุอยู่
    - **อาร์เรย์ของไฟล์**: ผสานเชิงลึกตามลำดับ (รายการหลังชนะ)
    - **คีย์พี่น้อง**: ผสานหลัง include (เขียนทับค่าที่ include มา)
    - **include ซ้อนกัน**: รองรับลึกได้สูงสุด 10 ระดับ
    - **พาธสัมพัทธ์**: แก้ไขโดยอิงจากไฟล์ที่ทำ include
    - **รูปแบบพาธ**: พาธ include ต้องไม่มีไบต์ null และต้องสั้นกว่า 4096 อักขระอย่างเคร่งครัดทั้งก่อนและหลังการแก้ไข
    - **การเขียนที่ OpenClaw เป็นเจ้าของ**: เมื่อการเขียนเปลี่ยนแปลงเฉพาะส่วนระดับบนสุดหนึ่งส่วน
      ที่รองรับด้วย include แบบไฟล์เดียว เช่น `plugins: { $include: "./plugins.json5" }`
      OpenClaw จะอัปเดตไฟล์ที่ include นั้นและปล่อยให้ `openclaw.json` คงเดิม
    - **การเขียนทะลุผ่านที่ไม่รองรับ**: include ที่รูท, อาร์เรย์ include, และ include
      ที่มีการเขียนทับด้วยคีย์พี่น้องจะล้มเหลวแบบปิดสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ แทนที่จะ
      แผ่การกำหนดค่าให้แบน
    - **การจำกัดขอบเขต**: พาธ `$include` ต้องแก้ไขได้ภายใต้ไดเรกทอรีที่เก็บ
      `openclaw.json` หากต้องการแชร์ทรีข้ามเครื่องหรือผู้ใช้ ให้ตั้งค่า
      `OPENCLAW_INCLUDE_ROOTS` เป็นรายการพาธ (`:` บน POSIX, `;` บน Windows) ของ
      ไดเรกทอรีเพิ่มเติมที่ include สามารถอ้างอิงได้ symlink จะถูกแก้ไข
      และตรวจสอบซ้ำ ดังนั้นพาธที่อยู่ในไดเรกทอรีการกำหนดค่าตามตัวอักษร แต่
      เป้าหมายจริงหลุดออกจากรูทที่อนุญาตทุกตัว จะยังคงถูกปฏิเสธ
    - **การจัดการข้อผิดพลาด**: ข้อผิดพลาดที่ชัดเจนสำหรับไฟล์ที่ขาดหาย ข้อผิดพลาดในการแยกวิเคราะห์ include แบบวนซ้ำ รูปแบบพาธไม่ถูกต้อง และความยาวเกินกำหนด

  </Accordion>
</AccordionGroup>

## การโหลดการกำหนดค่าใหม่แบบ hot

Gateway เฝ้าดู `~/.openclaw/openclaw.json` และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ - ไม่จำเป็นต้องรีสตาร์ทด้วยตนเองสำหรับการตั้งค่าส่วนใหญ่

การแก้ไขไฟล์โดยตรงจะถูกถือว่าไม่น่าเชื่อถือจนกว่าจะตรวจสอบความถูกต้องผ่าน watcher จะรอให้ความปั่นป่วนจากการเขียนไฟล์ชั่วคราว/การเปลี่ยนชื่อของเอดิเตอร์สงบลง
อ่านไฟล์สุดท้าย และปฏิเสธการแก้ไขภายนอกที่ไม่ถูกต้องโดยไม่เขียน `openclaw.json` ใหม่ การเขียนการกำหนดค่า
ที่ OpenClaw เป็นเจ้าของใช้ schema gate เดียวกันก่อนเขียน การเขียนทับแบบทำลายข้อมูล เช่น
การลบ `gateway.mode` หรือการทำให้ไฟล์เล็กลงมากกว่าครึ่ง จะถูกปฏิเสธและ
บันทึกเป็น `.rejected.*` เพื่อการตรวจสอบ

หากคุณเห็น `config reload skipped (invalid config)` หรือเมื่อเริ่มต้นระบบรายงาน `Invalid
config` ให้ตรวจสอบการกำหนดค่า รัน `openclaw config validate` แล้วรัน `openclaw
doctor --fix` เพื่อซ่อมแซม ดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config)
สำหรับเช็กลิสต์

### โหมดการโหลดใหม่

| โหมด                   | ลักษณะการทำงาน                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (ค่าเริ่มต้น) | นำการเปลี่ยนแปลงที่ปลอดภัยไปใช้แบบ hot ทันที รีสตาร์ทโดยอัตโนมัติสำหรับรายการที่สำคัญ           |
| **`hot`**              | นำเฉพาะการเปลี่ยนแปลงที่ปลอดภัยไปใช้แบบ hot บันทึกคำเตือนเมื่อจำเป็นต้องรีสตาร์ท - คุณจัดการเอง |
| **`restart`**          | รีสตาร์ท Gateway เมื่อการกำหนดค่าเปลี่ยนแปลง ไม่ว่าจะปลอดภัยหรือไม่                                 |
| **`off`**              | ปิดใช้การเฝ้าดูไฟล์ การเปลี่ยนแปลงจะมีผลในการรีสตาร์ทด้วยตนเองครั้งถัดไป                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### สิ่งที่นำไปใช้แบบ hot เทียบกับสิ่งที่ต้องรีสตาร์ท

ฟิลด์ส่วนใหญ่สามารถนำไปใช้แบบ hot ได้โดยไม่มี downtime ในโหมด `hybrid` การเปลี่ยนแปลงที่ต้องรีสตาร์ทจะถูกจัดการโดยอัตโนมัติ

| หมวดหมู่            | ฟิลด์                                                            | ต้องรีสตาร์ตหรือไม่ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| ช่องทาง            | `channels.*`, `web` (WhatsApp) - ช่องทางในตัวทั้งหมดและช่องทาง Plugin | ไม่              |
| Agent และโมเดล      | `agent`, `agents`, `models`, `routing`                            | ไม่              |
| ระบบอัตโนมัติ          | `hooks`, `cron`, `agent.heartbeat`                                | ไม่              |
| เซสชันและข้อความ | `session`, `messages`                                             | ไม่              |
| เครื่องมือและสื่อ       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | ไม่              |
| UI และอื่นๆ           | `ui`, `logging`, `identity`, `bindings`                           | ไม่              |
| เซิร์ฟเวอร์ Gateway      | `gateway.*` (พอร์ต, bind, auth, tailscale, TLS, HTTP)              | **ใช่**         |
| โครงสร้างพื้นฐาน      | `discovery`, `plugins`                                            | **ใช่**         |

<Note>
`gateway.reload` และ `gateway.remote` เป็นข้อยกเว้น - การเปลี่ยนค่าเหล่านี้จะ **ไม่** ทำให้เกิดการรีสตาร์ต
</Note>

### การวางแผนการรีโหลด

เมื่อคุณแก้ไขไฟล์ต้นทางที่ถูกอ้างอิงผ่าน `$include` OpenClaw จะวางแผน
การรีโหลดจากเลย์เอาต์ที่เขียนไว้ในต้นทาง ไม่ใช่มุมมองในหน่วยความจำที่ถูกแผ่ให้แบนแล้ว
วิธีนี้ทำให้การตัดสินใจ hot-reload (hot-apply เทียบกับรีสตาร์ต) คาดเดาได้ แม้เมื่อ
ส่วนระดับบนสุดเพียงส่วนเดียวอยู่ในไฟล์ที่ include แยกต่างหาก เช่น
`plugins: { $include: "./plugins.json5" }` การวางแผนการรีโหลดจะล้มเหลวแบบปิดหาก
เลย์เอาต์ต้นทางกำกวม

## Config RPC (การอัปเดตแบบโปรแกรม)

สำหรับเครื่องมือที่เขียนการกำหนดค่าผ่าน API ของ Gateway ให้ใช้ลำดับนี้เป็นหลัก:

- `config.schema.lookup` เพื่อตรวจสอบทรีย่อยหนึ่งส่วน (โหนดสคีมาแบบตื้น + สรุป
  รายการลูก)
- `config.get` เพื่อดึงสแนปช็อตปัจจุบันพร้อม `hash`
- `config.patch` สำหรับการอัปเดตบางส่วน (JSON merge patch: ออบเจ็กต์จะ merge กัน, `null`
  จะลบ, อาร์เรย์จะแทนที่เมื่อยืนยันอย่างชัดเจนด้วย `replacePaths` หาก
  รายการจะถูกลบออก)
- `config.apply` เฉพาะเมื่อคุณตั้งใจจะแทนที่การกำหนดค่าทั้งหมด
- `update.run` สำหรับการอัปเดตตัวเองพร้อมรีสตาร์ตอย่างชัดเจน; ใส่ `continuationMessage` เมื่อเซสชันหลังรีสตาร์ตควรรันเทิร์นติดตามผลหนึ่งครั้ง
- `update.status` เพื่อตรวจสอบ sentinel การรีสตาร์ตของการอัปเดตล่าสุดและยืนยันเวอร์ชันที่กำลังรันหลังรีสตาร์ต

Agents ควรถือว่า `config.schema.lookup` เป็นจุดแรกสำหรับเอกสารและข้อจำกัด
ระดับฟิลด์ที่แม่นยำ ใช้ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
เมื่อจำเป็นต้องใช้แผนที่การกำหนดค่าที่กว้างขึ้น ค่าเริ่มต้น หรือลิงก์ไปยัง
ข้อมูลอ้างอิงของระบบย่อยเฉพาะ

<Note>
การเขียน control-plane (`config.apply`, `config.patch`, `update.run`) ถูก
จำกัดอัตราไว้ที่ 3 คำขอต่อ 60 วินาทีต่อ `deviceId+clientIp` คำขอรีสตาร์ต
จะถูกรวมเข้าด้วยกัน จากนั้นบังคับใช้ช่วงพัก 30 วินาทีระหว่างรอบการรีสตาร์ต
`update.status` เป็นแบบอ่านอย่างเดียวแต่จำกัดเฉพาะผู้ดูแลระบบ เพราะ sentinel การรีสตาร์ตอาจ
รวมสรุปขั้นตอนการอัปเดตและส่วนท้ายของเอาต์พุตคำสั่ง
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
`note` และ `restartDelayMs` ต้องมี `baseHash` สำหรับทั้งสองเมธอดเมื่อมี
การกำหนดค่าอยู่แล้ว

`config.patch` ยังรับ `replacePaths` ซึ่งเป็นอาร์เรย์ของพาธการกำหนดค่าที่ตั้งใจให้มีการ
แทนที่อาร์เรย์ หากแพตช์จะแทนที่หรือลบอาร์เรย์ที่มีอยู่ด้วย
รายการที่น้อยกว่า Gateway จะปฏิเสธการเขียน เว้นแต่พาธนั้นตรงกันทุกประการ
ใน `replacePaths`; อาร์เรย์ซ้อนภายใต้รายการอาร์เรย์ใช้ `[]` เช่น
`agents.list[].skills` วิธีนี้ป้องกันไม่ให้สแนปช็อต `config.get` ที่ถูกตัดทอน
เขียนทับอาร์เรย์ routing หรือ allowlist อย่างเงียบๆ ใช้ `config.apply` เมื่อคุณ
ตั้งใจจะแทนที่การกำหนดค่าแบบเต็ม

## ตัวแปรสภาพแวดล้อม

OpenClaw อ่านตัวแปรสภาพแวดล้อมจากโปรเซสแม่ รวมถึง:

- `.env` จากไดเรกทอรีทำงานปัจจุบัน (ถ้ามี)
- `~/.openclaw/.env` (fallback ระดับโกลบอล)

ไฟล์ทั้งสองจะไม่เขียนทับตัวแปรสภาพแวดล้อมที่มีอยู่ คุณยังสามารถตั้งตัวแปรสภาพแวดล้อมแบบอินไลน์ในการกำหนดค่าได้ด้วย:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env import (optional)">
  หากเปิดใช้และยังไม่ได้ตั้งคีย์ที่คาดไว้ OpenClaw จะรัน login shell ของคุณและนำเข้าเฉพาะคีย์ที่ขาดหาย:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

ตัวแปรสภาพแวดล้อมที่เทียบเท่า: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Env var substitution in config values">
  อ้างอิงตัวแปรสภาพแวดล้อมในค่าสตริงการกำหนดค่าใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

กฎ:

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่หายไปหรือว่างจะทำให้เกิดข้อผิดพลาดขณะโหลด
- escape ด้วย `$${VAR}` สำหรับเอาต์พุตแบบตัวอักษรตรงตัว
- ใช้งานได้ภายในไฟล์ `$include`
- การแทนที่แบบอินไลน์: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
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
พาธข้อมูลรับรองที่รองรับแสดงอยู่ใน [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
</Accordion>

ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญและแหล่งที่มาแบบเต็ม

## ข้อมูลอ้างอิงฉบับเต็ม

สำหรับข้อมูลอ้างอิงแบบครบถ้วนทุกฟิลด์ โปรดดู **[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)**

---

_ที่เกี่ยวข้อง: [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
- [Runbook ของ Gateway](/th/gateway)
