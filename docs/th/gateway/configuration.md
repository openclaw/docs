---
read_when:
    - การตั้งค่า OpenClaw เป็นครั้งแรก
    - กำลังมองหารูปแบบการตั้งค่าที่ใช้บ่อย
    - การไปยังส่วนการตั้งค่าที่เฉพาะเจาะจง
summary: 'ภาพรวมการตั้งค่า: งานทั่วไป การตั้งค่าอย่างรวดเร็ว และลิงก์ไปยังเอกสารอ้างอิงฉบับเต็ม'
title: การตั้งค่า
x-i18n:
    generated_at: "2026-04-23T10:17:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: d76b40c25f98de791e0d8012b2bc5b80e3e38dde99bb9105539e800ddac3f362
    source_path: gateway/configuration.md
    workflow: 15
---

# การตั้งค่า

OpenClaw จะอ่านคอนฟิก <Tooltip tip="JSON5 รองรับคอมเมนต์และเครื่องหมายจุลภาคต่อท้าย">**JSON5**</Tooltip> แบบไม่บังคับจาก `~/.openclaw/openclaw.json`
พาธคอนฟิกที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ โครงสร้าง `openclaw.json`
ที่เป็น symlink ไม่รองรับสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนแบบ atomic อาจแทนที่
พาธนั้นแทนที่จะคง symlink ไว้ หากคุณเก็บคอนฟิกไว้นอกไดเรกทอรีสถานะเริ่มต้น
ให้ชี้ `OPENCLAW_CONFIG_PATH` ไปยังไฟล์จริงโดยตรง

หากไม่มีไฟล์ OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัย เหตุผลทั่วไปที่ควรเพิ่มคอนฟิกมีดังนี้:

- เชื่อมต่อช่องทางและควบคุมว่าใครสามารถส่งข้อความถึงบอตได้
- ตั้งค่าโมเดล เครื่องมือ sandboxing หรือระบบอัตโนมัติ (cron, hooks)
- ปรับแต่งเซสชัน สื่อ เครือข่าย หรือ UI

ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference) สำหรับทุกฟิลด์ที่มีให้ใช้

<Tip>
**เพิ่งเริ่มใช้การตั้งค่าหรือไม่?** เริ่มด้วย `openclaw onboard` สำหรับการตั้งค่าแบบโต้ตอบ หรือดูคู่มือ [ตัวอย่างการตั้งค่า](/th/gateway/configuration-examples) สำหรับคอนฟิกตัวอย่างแบบคัดลอกไปใช้ได้ทันที
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
  <Tab title="วิซาร์ดแบบโต้ตอบ">
    ```bash
    openclaw onboard       # ขั้นตอน onboarding แบบเต็ม
    openclaw configure     # วิซาร์ดการตั้งค่า
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
    เปิด [http://127.0.0.1:18789](http://127.0.0.1:18789) และใช้แท็บ **Config**
    Control UI จะแสดงฟอร์มจาก schema ของคอนฟิกที่ใช้งานอยู่ รวมถึง metadata เอกสารของฟิลด์ `title` / `description` ตลอดจน schema ของ Plugin และช่องทางเมื่อมี พร้อมตัวแก้ไข **Raw JSON** สำหรับใช้เป็นทางออกเมื่อจำเป็น สำหรับ UI แบบเจาะลึกและเครื่องมืออื่น ๆ gateway ยังเปิดเผย `config.schema.lookup` เพื่อดึง schema node ของพาธเดียวพร้อมสรุปลูกโดยตรง
  </Tab>
  <Tab title="แก้ไขโดยตรง">
    แก้ไข `~/.openclaw/openclaw.json` โดยตรง Gateway จะเฝ้าดูไฟล์และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ (ดู [การโหลดซ้ำแบบ hot reload](#config-hot-reload))
  </Tab>
</Tabs>

## การตรวจสอบความถูกต้องแบบเข้มงวด

<Warning>
OpenClaw ยอมรับเฉพาะคอนฟิกที่ตรงกับ schema อย่างสมบูรณ์เท่านั้น คีย์ที่ไม่รู้จัก ชนิดข้อมูลที่ผิดรูปแบบ หรือค่าที่ไม่ถูกต้อง จะทำให้ Gateway **ปฏิเสธการเริ่มต้น** ข้อยกเว้นเพียงอย่างเดียวในระดับรากคือ `$schema` (string) เพื่อให้ตัวแก้ไขสามารถแนบ metadata ของ JSON Schema ได้
</Warning>

`openclaw config schema` จะแสดง JSON Schema มาตรฐานที่ Control UI
และระบบตรวจสอบความถูกต้องใช้งาน `config.schema.lookup` จะดึง node ที่มีขอบเขตตามพาธเดียวพร้อม
สรุปลูกสำหรับเครื่องมือแบบเจาะลึก metadata เอกสารของฟิลด์ `title`/`description`
จะส่งต่อไปยังออบเจ็กต์ที่ซ้อนกัน wildcard (`*`), รายการอาร์เรย์ (`[]`) และแขนง `anyOf`/
`oneOf`/`allOf` โดย schema ของ Plugin และช่องทางในรันไทม์จะถูกรวมเข้ามาเมื่อโหลด
manifest registry แล้ว

เมื่อการตรวจสอบความถูกต้องล้มเหลว:

- Gateway จะไม่เริ่มทำงาน
- ใช้ได้เฉพาะคำสั่งวินิจฉัย (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- รัน `openclaw doctor` เพื่อดูปัญหาอย่างละเอียด
- รัน `openclaw doctor --fix` (หรือ `--yes`) เพื่อซ่อมแซม

Gateway จะเก็บสำเนาที่เชื่อถือได้ซึ่งใช้งานได้ล่าสุดไว้หลังจากเริ่มต้นสำเร็จแต่ละครั้ง
หากภายหลัง `openclaw.json` ตรวจสอบไม่ผ่าน (หรือไม่มี `gateway.mode`,
มีขนาดลดลงอย่างมาก หรือมีบรรทัด log แปลกปลอมถูกเติมไว้ด้านหน้า) OpenClaw จะเก็บไฟล์ที่เสียไว้
เป็น `.clobbered.*` กู้คืนสำเนาที่เชื่อถือได้ล่าสุด และบันทึกเหตุผลของการกู้คืน
ในเทิร์นถัดไปของเอเจนต์จะได้รับคำเตือนแบบ system event ด้วย เพื่อไม่ให้เอเจนต์หลัก
เขียนทับคอนฟิกที่กู้คืนมาโดยไม่ตรวจสอบ การเลื่อนสำเนาขึ้นเป็น last-known-good
จะถูกข้ามหากตัวเลือกนั้นมี placeholder ความลับที่ถูกปกปิด เช่น `***`

## งานทั่วไป

<AccordionGroup>
  <Accordion title="ตั้งค่าช่องทาง (WhatsApp, Telegram, Discord ฯลฯ)">
    แต่ละช่องทางมีส่วนคอนฟิกของตัวเองภายใต้ `channels.<provider>` ดูหน้าช่องทางเฉพาะสำหรับขั้นตอนการตั้งค่า:

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

    ทุกช่องทางใช้รูปแบบนโยบาย DM ร่วมกัน:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // เฉพาะสำหรับ allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="เลือกและตั้งค่าโมเดล">
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

    - `agents.defaults.models` กำหนดแค็ตตาล็อกโมเดลและทำหน้าที่เป็น allowlist สำหรับ `/model`
    - ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ allowlist โดยไม่ลบโมเดลที่มีอยู่ การแทนที่แบบธรรมดาที่จะลบรายการเดิมจะถูกปฏิเสธ เว้นแต่คุณจะส่ง `--replace`
    - การอ้างอิงโมเดลใช้รูปแบบ `provider/model` (เช่น `anthropic/claude-opus-4-6`)
    - `agents.defaults.imageMaxDimensionPx` ควบคุมการย่อขนาดรูปภาพใน transcript/tool (ค่าเริ่มต้น `1200`); ค่าที่ต่ำลงมักลดการใช้ vision token ในการรันที่มีภาพหน้าจอจำนวนมาก
    - ดู [Models CLI](/th/concepts/models) สำหรับการสลับโมเดลในแชต และ [Model Failover](/th/concepts/model-failover) สำหรับพฤติกรรมการหมุน auth และ fallback
    - สำหรับ provider แบบกำหนดเอง/โฮสต์เอง ดู [Custom providers](/th/gateway/configuration-reference#custom-providers-and-base-urls) ในเอกสารอ้างอิง

  </Accordion>

  <Accordion title="ควบคุมว่าใครสามารถส่งข้อความถึงบอตได้">
    การเข้าถึง DM ถูกควบคุมรายช่องทางผ่าน `dmPolicy`:

    - `"pairing"` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบครั้งเดียวเพื่อนำไปอนุมัติ
    - `"allowlist"`: เฉพาะผู้ส่งใน `allowFrom` (หรือ paired allow store)
    - `"open"`: อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)
    - `"disabled"`: เพิกเฉยต่อ DM ทั้งหมด

    สำหรับกลุ่ม ให้ใช้ `groupPolicy` + `groupAllowFrom` หรือ allowlist เฉพาะช่องทาง

    ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#dm-and-group-access) สำหรับรายละเอียดรายช่องทาง

  </Accordion>

  <Accordion title="ตั้งค่าการบังคับ mention ในแชตกลุ่ม">
    โดยค่าเริ่มต้น ข้อความในกลุ่มจะ **ต้องมีการ mention** กำหนดรูปแบบรายเอเจนต์ได้ดังนี้:

    ```json5
    {
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

    - **การ mention จาก metadata**: การ mention แบบ native @ (แตะเพื่อ mention ใน WhatsApp, @bot ใน Telegram ฯลฯ)
    - **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `mentionPatterns`
    - ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#group-chat-mention-gating) สำหรับการ override รายช่องทางและโหมด self-chat

  </Accordion>

  <Accordion title="จำกัด Skills ต่อเอเจนต์">
    ใช้ `agents.defaults.skills` สำหรับค่าพื้นฐานที่ใช้ร่วมกัน จากนั้น override เอเจนต์เฉพาะด้วย `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // สืบทอด github, weather
          { id: "docs", skills: ["docs-search"] }, // แทนที่ค่าเริ่มต้น
          { id: "locked-down", skills: [] }, // ไม่มี Skills
        ],
      },
    }
    ```

    - ไม่ใส่ `agents.defaults.skills` หากต้องการให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
    - ไม่ใส่ `agents.list[].skills` หากต้องการสืบทอดค่าเริ่มต้น
    - ตั้ง `agents.list[].skills: []` หากไม่ต้องการ Skills
    - ดู [Skills](/th/tools/skills), [คอนฟิก Skills](/th/tools/skills-config) และ
      [เอกสารอ้างอิงการตั้งค่า](/th/gateway/configuration-reference#agents-defaults-skills)

  </Accordion>

  <Accordion title="ปรับแต่งการตรวจสอบสุขภาพช่องทางของ gateway">
    ควบคุมความเข้มงวดที่ gateway ใช้รีสตาร์ตช่องทางที่ดูเหมือนค้าง:

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

    - ตั้ง `gateway.channelHealthCheckMinutes: 0` เพื่อปิดการรีสตาร์ตจาก health monitor ทั่วทั้งระบบ
    - `channelStaleEventThresholdMinutes` ควรมากกว่าหรือเท่ากับช่วงเวลาในการตรวจสอบ
    - ใช้ `channels.<provider>.healthMonitor.enabled` หรือ `channels.<provider>.accounts.<id>.healthMonitor.enabled` เพื่อปิดการรีสตาร์ตอัตโนมัติสำหรับช่องทางหรือบัญชีเดียว โดยไม่ต้องปิดตัวตรวจสอบส่วนกลาง
    - ดู [Health Checks](/th/gateway/health) สำหรับการดีบักเชิงปฏิบัติการ และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#gateway) สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="ตั้งค่าเซสชันและการรีเซ็ต">
    เซสชันควบคุมความต่อเนื่องและการแยกของบทสนทนา:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // แนะนำสำหรับหลายผู้ใช้
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
    - ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#session) สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="เปิดใช้ sandboxing">
    รันเซสชันของเอเจนต์ในรันไทม์ sandbox แบบแยก:

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

    สร้าง image ก่อน: `scripts/sandbox-setup.sh`

    ดู [Sandboxing](/th/gateway/sandboxing) สำหรับคู่มือฉบับเต็ม และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#agentsdefaultssandbox) สำหรับตัวเลือกทั้งหมด

  </Accordion>

  <Accordion title="เปิดใช้ push ผ่าน relay สำหรับ iOS build อย่างเป็นทางการ">
    push ผ่าน relay ถูกตั้งค่าใน `openclaw.json`

    ตั้งค่าในคอนฟิก gateway ดังนี้:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // ไม่บังคับ ค่าเริ่มต้น: 10000
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

    - ทำให้ gateway สามารถส่ง `push.test`, การปลุกเตือน และการปลุกเพื่อเชื่อมต่อใหม่ผ่าน relay ภายนอกได้
    - ใช้สิทธิ์การส่งแบบผูกกับ registration ที่แอป iOS ซึ่งจับคู่แล้วส่งต่อมาให้ gateway โดย gateway ไม่จำเป็นต้องมี relay token ระดับทั้ง deployment
    - ผูกแต่ละ registration ที่รองรับ relay เข้ากับ identity ของ gateway ที่แอป iOS จับคู่ไว้ เพื่อไม่ให้ gateway อื่นนำ registration ที่เก็บไว้นั้นไปใช้ซ้ำได้
    - คงให้ iOS build ภายในเครื่อง/แบบ manual ใช้ APNs โดยตรง การส่งผ่าน relay จะใช้เฉพาะกับ build ทางการที่แจกจ่ายและลงทะเบียนผ่าน relay เท่านั้น
    - ต้องตรงกับ relay base URL ที่ฝังอยู่ใน iOS build แบบทางการ/TestFlight เพื่อให้ทราฟฟิกการลงทะเบียนและการส่งไปถึง deployment ของ relay เดียวกัน

    ขั้นตอนแบบ end-to-end:

    1. ติดตั้ง iOS build แบบทางการ/TestFlight ที่คอมไพล์ด้วย relay base URL เดียวกัน
    2. ตั้งค่า `gateway.push.apns.relay.baseUrl` บน gateway
    3. จับคู่แอป iOS กับ gateway และปล่อยให้ทั้งเซสชัน node และ operator เชื่อมต่อ
    4. แอป iOS จะดึง identity ของ gateway, ลงทะเบียนกับ relay โดยใช้ App Attest พร้อม app receipt แล้วเผยแพร่ payload `push.apns.register` ที่รองรับ relay ไปยัง gateway ที่จับคู่ไว้
    5. gateway จะเก็บ relay handle และ send grant แล้วใช้ข้อมูลเหล่านั้นสำหรับ `push.test`, การปลุกเตือน และการปลุกเพื่อเชื่อมต่อใหม่

    หมายเหตุด้านปฏิบัติการ:

    - หากคุณสลับแอป iOS ไปยัง gateway อื่น ให้เชื่อมต่อแอปใหม่เพื่อให้สามารถเผยแพร่ relay registration ใหม่ที่ผูกกับ gateway นั้นได้
    - หากคุณออก iOS build ใหม่ที่ชี้ไปยัง deployment ของ relay อื่น แอปจะรีเฟรช relay registration ที่แคชไว้แทนการนำ relay origin เดิมกลับมาใช้

    หมายเหตุด้านความเข้ากันได้:

    - `OPENCLAW_APNS_RELAY_BASE_URL` และ `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ยังใช้งานได้เป็นการ override ผ่าน env ชั่วคราว
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` ยังคงเป็นช่องทางพัฒนาเฉพาะ loopback เท่านั้น; อย่าบันทึก URL ของ relay แบบ HTTP ไว้ในคอนฟิก

    ดู [แอป iOS](/th/platforms/ios#relay-backed-push-for-official-builds) สำหรับลำดับขั้น end-to-end และ [ขั้นตอนการยืนยันตัวตนและความเชื่อถือ](/th/platforms/ios#authentication-and-trust-flow) สำหรับโมเดลความปลอดภัยของ relay

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
    - `directPolicy`: `allow` (ค่าเริ่มต้น) หรือ `block` สำหรับเป้าหมาย Heartbeat แบบ DM
    - ดู [Heartbeat](/th/gateway/heartbeat) สำหรับคู่มือฉบับเต็ม

  </Accordion>

  <Accordion title="ตั้งค่างาน Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: ลบเซสชันการรันแบบ isolated ที่เสร็จแล้วออกจาก `sessions.json` (ค่าเริ่มต้น `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน)
    - `runLog`: ตัด `cron/runs/<jobId>.jsonl` ตามขนาดและจำนวนบรรทัดที่เก็บไว้
    - ดู [งาน Cron](/th/automation/cron-jobs) สำหรับภาพรวมฟีเจอร์และตัวอย่าง CLI

  </Accordion>

  <Accordion title="ตั้งค่า Webhook (hooks)">
    เปิดใช้งานปลายทาง HTTP Webhook บน Gateway:

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
    - ให้ถือว่าเนื้อหา payload ของ hook/Webhook ทั้งหมดเป็นอินพุตที่ไม่น่าเชื่อถือ
    - ใช้ `hooks.token` เฉพาะกิจ; อย่านำ token กลางของ Gateway มาใช้ซ้ำ
    - การยืนยันตัวตนของ hook ใช้ผ่าน header เท่านั้น (`Authorization: Bearer ...` หรือ `x-openclaw-token`); token ใน query string จะถูกปฏิเสธ
    - `hooks.path` ต้องไม่เป็น `/`; ควรเก็บ ingress ของ Webhook ไว้บน subpath เฉพาะ เช่น `/hooks`
    - ให้ปิดแฟล็ก bypass สำหรับเนื้อหาไม่ปลอดภัยไว้ (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) เว้นแต่กำลังดีบักแบบจำกัดขอบเขตอย่างมาก
    - หากคุณเปิด `hooks.allowRequestSessionKey` ให้ตั้ง `hooks.allowedSessionKeyPrefixes` เพิ่มเติมเพื่อจำกัด session key ที่ผู้เรียกเลือกเอง
    - สำหรับเอเจนต์ที่ขับเคลื่อนด้วย hook ควรใช้ระดับโมเดลสมัยใหม่ที่แข็งแรงและนโยบายเครื่องมือที่เข้มงวด (เช่น อนุญาตเฉพาะการส่งข้อความร่วมกับ sandboxing เมื่อเป็นไปได้)

    ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#hooks) สำหรับตัวเลือก mapping ทั้งหมดและการผสานรวมกับ Gmail

  </Accordion>

  <Accordion title="ตั้งค่าการกำหนดเส้นทางหลายเอเจนต์">
    รันเอเจนต์หลายตัวแบบแยกจากกัน พร้อม workspace และเซสชันแยกคนละชุด:

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

    ดู [หลายเอเจนต์](/th/concepts/multi-agent) และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#multi-agent-routing) สำหรับกฎของ binding และโปรไฟล์การเข้าถึงรายเอเจนต์

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
    - **อาร์เรย์ของไฟล์**: deep-merge ตามลำดับ (รายการหลังมีความสำคัญกว่า)
    - **คีย์ข้างเคียง**: จะถูก merge หลัง include (override ค่าที่ include มา)
    - **include แบบซ้อน**: รองรับลึกได้สูงสุด 10 ระดับ
    - **พาธสัมพัทธ์**: resolve โดยอิงจากไฟล์ที่ include
    - **การเขียนที่ OpenClaw เป็นเจ้าของ**: เมื่อการเขียนเปลี่ยนแปลงเฉพาะส่วนระดับบนสุดส่วนเดียวที่รองรับด้วย include แบบไฟล์เดียว เช่น `plugins: { $include: "./plugins.json5" }`, OpenClaw จะอัปเดตไฟล์ที่ include นั้นและคง `openclaw.json` เดิมไว้
    - **write-through ที่ไม่รองรับ**: include ระดับราก, include แบบอาร์เรย์ และ include ที่มีการ override จากคีย์ข้างเคียง จะล้มเหลวแบบ fail-closed สำหรับการเขียนที่ OpenClaw เป็นเจ้าของ แทนที่จะ flatten คอนฟิก
    - **การจัดการข้อผิดพลาด**: มีข้อความผิดพลาดที่ชัดเจนสำหรับไฟล์หาย, parse error และ include แบบวนลูป

  </Accordion>
</AccordionGroup>

## การโหลดคอนฟิกซ้ำแบบ hot reload

Gateway จะเฝ้าดู `~/.openclaw/openclaw.json` และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ — สำหรับการตั้งค่าส่วนใหญ่ไม่ต้องรีสตาร์ตเอง

การแก้ไขไฟล์โดยตรงจะถือว่าไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบความถูกต้อง ตัวเฝ้าดูจะรอ
ให้ความเปลี่ยนแปลงชั่วคราวจากการเขียน/เปลี่ยนชื่อของตัวแก้ไขนิ่งก่อน แล้วจึงอ่านไฟล์สุดท้าย และปฏิเสธ
การแก้ไขภายนอกที่ไม่ถูกต้องโดยกู้คืนคอนฟิกที่ใช้งานได้ล่าสุด การเขียนคอนฟิกที่ OpenClaw เป็นเจ้าของ
จะใช้เกต schema เดียวกันก่อนเขียน; การเขียนทับแบบทำลายข้อมูล เช่น ตัด `gateway.mode` ออก
หรือทำให้ไฟล์เล็กลงเกินครึ่ง จะถูกปฏิเสธและบันทึกเป็น `.rejected.*` ไว้ให้ตรวจสอบ

หากคุณเห็น `Config auto-restored from last-known-good` หรือ
`config reload restored last-known-good config` ใน log ให้ตรวจสอบไฟล์
`.clobbered.*` ที่ตรงกันถัดจาก `openclaw.json`, แก้ไข payload ที่ถูกปฏิเสธ แล้วรัน
`openclaw config validate` ดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-restored-last-known-good-config)
สำหรับเช็กลิสต์การกู้คืน

### โหมดการโหลดซ้ำ

| โหมด                   | พฤติกรรม                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (ค่าเริ่มต้น) | นำการเปลี่ยนแปลงที่ปลอดภัยไปใช้ทันทีแบบ hot และรีสตาร์ตอัตโนมัติสำหรับรายการสำคัญ |
| **`hot`**              | นำไปใช้แบบ hot เฉพาะการเปลี่ยนแปลงที่ปลอดภัยเท่านั้น หากต้องรีสตาร์ตจะบันทึกคำเตือน — คุณเป็นผู้จัดการเอง |
| **`restart`**          | รีสตาร์ต Gateway ทุกครั้งที่คอนฟิกเปลี่ยน ไม่ว่าจะปลอดภัยหรือไม่                   |
| **`off`**              | ปิดการเฝ้าดูไฟล์ การเปลี่ยนแปลงจะมีผลในการรีสตาร์ตด้วยตนเองครั้งถัดไป              |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### สิ่งใดใช้แบบ hot ได้ และสิ่งใดต้องรีสตาร์ต

ฟิลด์ส่วนใหญ่สามารถนำไปใช้แบบ hot ได้โดยไม่เกิด downtime ในโหมด `hybrid` การเปลี่ยนแปลงที่ต้องรีสตาร์ตจะถูกจัดการให้อัตโนมัติ

| หมวดหมู่            | ฟิลด์                                                             | ต้องรีสตาร์ตหรือไม่ |
| ------------------- | ----------------------------------------------------------------- | ------------------- |
| ช่องทาง             | `channels.*`, `web` (WhatsApp) — ทุกช่องทางแบบ built-in และ Plugin | ไม่                 |
| เอเจนต์และโมเดล     | `agent`, `agents`, `models`, `routing`                            | ไม่                 |
| ระบบอัตโนมัติ       | `hooks`, `cron`, `agent.heartbeat`                                | ไม่                 |
| เซสชันและข้อความ    | `session`, `messages`                                             | ไม่                 |
| เครื่องมือและสื่อ   | `tools`, `browser`, `skills`, `audio`, `talk`                     | ไม่                 |
| UI และอื่น ๆ        | `ui`, `logging`, `identity`, `bindings`                           | ไม่                 |
| เซิร์ฟเวอร์ Gateway | `gateway.*` (port, bind, auth, Tailscale, TLS, HTTP)              | **ใช่**             |
| โครงสร้างพื้นฐาน    | `discovery`, `canvasHost`, `plugins`                              | **ใช่**             |

<Note>
`gateway.reload` และ `gateway.remote` เป็นข้อยกเว้น — การเปลี่ยนแปลงสองค่านี้จะ **ไม่** ทำให้เกิดการรีสตาร์ต
</Note>

### การวางแผนการโหลดซ้ำ

เมื่อคุณแก้ไขไฟล์ต้นทางที่ถูกอ้างอิงผ่าน `$include`, OpenClaw จะวางแผน
การโหลดซ้ำจากโครงสร้างที่ผู้เขียนต้นทางกำหนดไว้ ไม่ใช่มุมมองในหน่วยความจำที่ถูก flatten แล้ว
ซึ่งทำให้การตัดสินใจสำหรับ hot reload (ใช้แบบ hot หรือรีสตาร์ต) คาดเดาได้แม้
ส่วนระดับบนสุดเพียงส่วนเดียวจะอยู่ในไฟล์ include ของตัวเอง เช่น
`plugins: { $include: "./plugins.json5" }` การวางแผนการโหลดซ้ำจะล้มเหลวแบบ fail-closed หาก
โครงสร้างต้นทางคลุมเครือ

## Config RPC (การอัปเดตแบบเป็นโปรแกรม)

สำหรับเครื่องมือที่เขียนคอนฟิกผ่าน API ของ gateway ให้ใช้ flow นี้เป็นหลัก:

- `config.schema.lookup` เพื่อตรวจสอบ subtree เดียว (schema node แบบตื้น + สรุปลูก)
- `config.get` เพื่อดึง snapshot ปัจจุบันพร้อม `hash`
- `config.patch` สำหรับการอัปเดตบางส่วน (JSON merge patch: ออบเจ็กต์จะ merge, `null` ใช้ลบ, อาร์เรย์จะแทนที่ทั้งชุด)
- ใช้ `config.apply` เฉพาะเมื่อคุณตั้งใจแทนที่คอนฟิกทั้งหมด
- `update.run` สำหรับการอัปเดตตัวเองแบบ explicit พร้อมรีสตาร์ต

<Note>
การเขียนฝั่ง control-plane (`config.apply`, `config.patch`, `update.run`) ถูกจำกัดอัตราไว้ที่ 3 คำขอต่อ 60 วินาทีต่อ `deviceId+clientIp` คำขอรีสตาร์ตจะถูกรวมเข้าด้วยกัน และจากนั้นจะบังคับคูลดาวน์ 30 วินาทีระหว่างรอบการรีสตาร์ต
</Note>

ตัวอย่าง partial patch:

```bash
openclaw gateway call config.get --params '{}'  # เก็บ payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

ทั้ง `config.apply` และ `config.patch` รองรับ `raw`, `baseHash`, `sessionKey`,
`note` และ `restartDelayMs` โดย `baseHash` จำเป็นสำหรับทั้งสองเมธอดเมื่อ
มีคอนฟิกอยู่แล้ว

## ตัวแปรแวดล้อม

OpenClaw จะอ่าน env var จาก parent process รวมถึง:

- `.env` จากไดเรกทอรีทำงานปัจจุบัน (หากมี)
- `~/.openclaw/.env` (fallback แบบ global)

ทั้งสองไฟล์จะไม่ override env var ที่มีอยู่แล้ว คุณยังสามารถตั้งค่า env var แบบ inline ในคอนฟิกได้:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="การนำเข้า shell env (ไม่บังคับ)">
  หากเปิดใช้งานและยังไม่ได้ตั้งค่าคีย์ที่คาดหวัง OpenClaw จะรัน login shell ของคุณและนำเข้าเฉพาะคีย์ที่ยังขาดอยู่:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env var ที่เทียบเท่า: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="การแทนค่าด้วย env var ในค่าคอนฟิก">
  อ้างอิง env var ในค่าสตริงของคอนฟิกใด ๆ ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

กฎ:

- จับคู่เฉพาะชื่อแบบตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่ขาดหาย/ว่างจะทำให้เกิดข้อผิดพลาดตอนโหลด
- ใช้ `$${VAR}` เพื่อให้ได้ผลลัพธ์เป็นข้อความตามตัวอักษร
- ใช้งานได้ภายในไฟล์ `$include`
- การแทนค่าแบบ inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef (env, file, exec)">
  สำหรับฟิลด์ที่รองรับออบเจ็กต์ SecretRef คุณสามารถใช้ได้ดังนี้:

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

รายละเอียดของ SecretRef (รวมถึง `secrets.providers` สำหรับ `env`/`file`/`exec`) อยู่ใน [การจัดการความลับ](/th/gateway/secrets)
รายการพาธข้อมูลรับรองที่รองรับอยู่ใน [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
</Accordion>

ดู [Environment](/th/help/environment) สำหรับลำดับความสำคัญและแหล่งที่มาทั้งหมด

## เอกสารอ้างอิงฉบับเต็ม

สำหรับเอกสารอ้างอิงแบบครบถ้วนรายฟิลด์ โปรดดู **[เอกสารอ้างอิงการตั้งค่า](/th/gateway/configuration-reference)**

---

_ที่เกี่ยวข้อง: [ตัวอย่างการตั้งค่า](/th/gateway/configuration-examples) · [เอกสารอ้างอิงการตั้งค่า](/th/gateway/configuration-reference) · [Doctor](/th/gateway/doctor)_
