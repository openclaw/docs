---
read_when:
    - การตั้งค่า OpenClaw ครั้งแรก
    - กำลังมองหารูปแบบการกำหนดค่าที่พบบ่อย
    - ไปยังส่วนการกำหนดค่าเฉพาะเจาะจง
summary: 'ภาพรวมการกำหนดค่า: งานที่พบบ่อย การตั้งค่าแบบรวดเร็ว และลิงก์ไปยังข้อมูลอ้างอิงฉบับเต็ม'
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-04-26T11:29:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc1148b93c00d30e34aad0ffb5e1d4dae5438a195a531f5247bbc9a261142350
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw จะอ่าน config แบบไม่บังคับในรูปแบบ <Tooltip tip="JSON5 รองรับคอมเมนต์และเครื่องหมายจุลภาคต่อท้าย">**JSON5**</Tooltip> จาก `~/.openclaw/openclaw.json`
พาธ config ที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ เลย์เอาต์ `openclaw.json` ที่เป็น symlink
ไม่รองรับสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนแบบ atomic อาจแทนที่
พาธนั้นแทนที่จะคง symlink ไว้ หากคุณเก็บ config ไว้นอก state directory เริ่มต้น
ให้ชี้ `OPENCLAW_CONFIG_PATH` ไปที่ไฟล์จริงโดยตรง

หากไม่มีไฟล์ OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัย เหตุผลทั่วไปในการเพิ่ม config มีดังนี้:

- เชื่อมต่อ channels และควบคุมว่าใครสามารถส่งข้อความถึง bot ได้
- ตั้งค่าโมเดล เครื่องมือ sandboxing หรือระบบอัตโนมัติ (Cron, hooks)
- ปรับแต่งเซสชัน สื่อ เครือข่าย หรือ UI

ดู [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference) สำหรับทุกฟิลด์ที่มีให้ใช้

เอเจนต์และระบบอัตโนมัติควรใช้ `config.schema.lookup` เพื่อดูเอกสารระดับฟิลด์ที่แม่นยำ
ก่อนแก้ไข config ใช้หน้านี้สำหรับคำแนะนำที่อิงตามงาน และใช้
[Configuration reference](/th/gateway/configuration-reference) สำหรับแผนที่ฟิลด์และค่าเริ่มต้นในภาพกว้าง

<Tip>
**เพิ่งเริ่มใช้การกำหนดค่าหรือไม่?** เริ่มด้วย `openclaw onboard` สำหรับการตั้งค่าแบบโต้ตอบ หรือดูคู่มือ [Configuration Examples](/th/gateway/configuration-examples) สำหรับ config ตัวอย่างแบบคัดลอกแล้วใช้ได้ทันที
</Tip>

## การกำหนดค่าขั้นต่ำ

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
    openclaw onboard       # ขั้นตอนเริ่มต้นใช้งานแบบเต็ม
    openclaw configure     # ตัวช่วยกำหนดค่า
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
    เปิด [http://127.0.0.1:18789](http://127.0.0.1:18789) แล้วใช้แท็บ **Config**
    Control UI จะเรนเดอร์ฟอร์มจาก live config schema รวมถึง metadata เอกสาร `title` / `description` ของฟิลด์ ตลอดจน schema ของ Plugin และ channel เมื่อมี พร้อมตัวแก้ไข **Raw JSON** สำหรับใช้เป็นทางออกสำรอง สำหรับ UI แบบเจาะลึกและเครื่องมืออื่น ๆ Gateway ยังเปิดให้ใช้ `config.schema.lookup` เพื่อดึง schema node แบบกำหนดขอบเขตด้วยพาธหนึ่งรายการ พร้อมสรุปลูกโดยตรง
  </Tab>
  <Tab title="แก้ไขโดยตรง">
    แก้ไข `~/.openclaw/openclaw.json` โดยตรง Gateway จะเฝ้าดูไฟล์และใช้การเปลี่ยนแปลงโดยอัตโนมัติ (ดู [hot reload](#config-hot-reload))
  </Tab>
</Tabs>

## การตรวจสอบความถูกต้องแบบเข้มงวด

<Warning>
OpenClaw ยอมรับเฉพาะการกำหนดค่าที่ตรงกับ schema อย่างสมบูรณ์เท่านั้น คีย์ที่ไม่รู้จัก ชนิดข้อมูลที่ผิดรูปแบบ หรือค่าที่ไม่ถูกต้อง จะทำให้ Gateway **ปฏิเสธการเริ่มทำงาน** ข้อยกเว้นเดียวที่ระดับรากคือ `$schema` (สตริง) เพื่อให้ตัวแก้ไขสามารถแนบ metadata ของ JSON Schema ได้
</Warning>

`openclaw config schema` จะแสดง canonical JSON Schema ที่ใช้โดย Control UI
และการตรวจสอบความถูกต้อง ส่วน `config.schema.lookup` จะดึง node เดียวที่กำหนดขอบเขตด้วยพาธพร้อมสรุปลูก สำหรับเครื่องมือแบบเจาะลึก metadata เอกสาร `title`/`description` ของฟิลด์
จะถูกส่งต่อผ่าน nested objects, wildcard (`*`), array-item (`[]`) และสาขา `anyOf`/
`oneOf`/`allOf` เมื่อ manifest registry ถูกโหลด schema ของ Plugin และ channel ในรันไทม์จะถูกรวมเข้ามา

เมื่อการตรวจสอบความถูกต้องล้มเหลว:

- Gateway จะไม่บูต
- จะใช้ได้เฉพาะคำสั่งสำหรับการวินิจฉัย (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- รัน `openclaw doctor` เพื่อดูปัญหาที่แน่นอน
- รัน `openclaw doctor --fix` (หรือ `--yes`) เพื่อใช้การซ่อมแซม

Gateway จะเก็บสำเนา trusted last-known-good หลังจากเริ่มทำงานสำเร็จทุกครั้ง
หากภายหลัง `openclaw.json` ตรวจสอบความถูกต้องไม่ผ่าน (หรือไม่มี `gateway.mode`, มีขนาด
เล็กลงมาก หรือมีบรรทัด log แปลกปลอมถูกเติมไว้ด้านหน้า) OpenClaw จะเก็บไฟล์ที่เสียไว้
เป็น `.clobbered.*`, กู้คืนสำเนา last-known-good และบันทึกเหตุผลในการกู้คืนไว้
ใน agent turn ถัดไปจะได้รับคำเตือนแบบ system-event ด้วย เพื่อไม่ให้เอเจนต์หลักเขียนทับ config ที่ถูกกู้คืนแบบไม่ไตร่ตรอง การยกระดับเป็น last-known-good
จะถูกข้ามเมื่อ candidate มี placeholder ของ secret ที่ถูกปกปิด เช่น `***`
เมื่อทุกปัญหาการตรวจสอบความถูกต้องถูกจำกัดอยู่ที่ `plugins.entries.<id>...` OpenClaw
จะไม่ทำการกู้คืนทั้งไฟล์ มันจะคง config ปัจจุบันไว้ใช้งาน และแสดงความล้มเหลวเฉพาะของ Plugin เพื่อไม่ให้ความไม่ตรงกันของ schema ของ Plugin หรือเวอร์ชันโฮสต์ทำให้การตั้งค่าผู้ใช้ส่วนอื่นย้อนกลับ

## งานที่พบบ่อย

<AccordionGroup>
  <Accordion title="ตั้งค่า channel (WhatsApp, Telegram, Discord ฯลฯ)">
    แต่ละ channel มีส่วน config ของตัวเองภายใต้ `channels.<provider>` ดูขั้นตอนการตั้งค่าจากหน้า channel เฉพาะ:

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

    ทุก channel ใช้รูปแบบนโยบาย DM แบบเดียวกัน:

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

  <Accordion title="เลือกและกำหนดค่าโมเดล">
    ตั้งค่าโมเดลหลักและ fallback แบบเลือกได้:

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
    - ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ allowlist โดยไม่ลบโมเดลที่มีอยู่ การแทนที่แบบปกติที่ทำให้รายการหายไปจะถูกปฏิเสธ เว้นแต่คุณจะส่ง `--replace`
    - model refs ใช้รูปแบบ `provider/model` (เช่น `anthropic/claude-opus-4-6`)
    - `agents.defaults.imageMaxDimensionPx` ควบคุมการย่อขนาดภาพสำหรับ transcript/tool (ค่าเริ่มต้น `1200`); ค่าที่ต่ำกว่ามักช่วยลดการใช้ vision-token ในการรันที่มีภาพหน้าจอจำนวนมาก
    - ดู [Models CLI](/th/concepts/models) สำหรับการสลับโมเดลในแชท และ [Model Failover](/th/concepts/model-failover) สำหรับพฤติกรรมการสลับการยืนยันตัวตนและ fallback
    - สำหรับ providers แบบกำหนดเอง/โฮสต์เอง ดู [Custom providers](/th/gateway/config-tools#custom-providers-and-base-urls) ในเอกสารอ้างอิง

  </Accordion>

  <Accordion title="ควบคุมว่าใครสามารถส่งข้อความถึง bot ได้">
    การเข้าถึง DM ถูกควบคุมต่อ channel ผ่าน `dmPolicy`:

    - `"pairing"` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับ pairing code แบบใช้ครั้งเดียวเพื่ออนุมัติ
    - `"allowlist"`: อนุญาตเฉพาะผู้ส่งใน `allowFrom` (หรือ paired allow store)
    - `"open"`: อนุญาต DMs ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)
    - `"disabled"`: ไม่สนใจ DMs ทั้งหมด

    สำหรับกลุ่ม ให้ใช้ `groupPolicy` + `groupAllowFrom` หรือ allowlists เฉพาะ channel

    ดู [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-channels#dm-and-group-access) สำหรับรายละเอียดราย channel

  </Accordion>

  <Accordion title="ตั้งค่าให้แชทกลุ่มต้องมีการกล่าวถึง">
    ข้อความในกลุ่มมีค่าเริ่มต้นเป็น **ต้องมีการกล่าวถึง** กำหนดรูปแบบต่อเอเจนต์ได้ดังนี้:

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

    - **Metadata mentions**: การ @mention แบบเนทีฟ (แตะเพื่อ mention ใน WhatsApp, Telegram @bot เป็นต้น)
    - **Text patterns**: รูปแบบ regex ที่ปลอดภัยใน `mentionPatterns`
    - ดู [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-channels#group-chat-mention-gating) สำหรับการ override ราย channel และโหมด self-chat

  </Accordion>

  <Accordion title="จำกัด Skills ต่อเอเจนต์">
    ใช้ `agents.defaults.skills` สำหรับค่าพื้นฐานที่ใช้ร่วมกัน แล้ว override เอเจนต์บางตัวด้วย
    `agents.list[].skills`:

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

    - ละ `agents.defaults.skills` ไว้ หากต้องการให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
    - ละ `agents.list[].skills` ไว้ เพื่อสืบทอดค่าเริ่มต้น
    - ตั้ง `agents.list[].skills: []` หากไม่ต้องการ Skills
    - ดู [Skills](/th/tools/skills), [Skills config](/th/tools/skills-config) และ
      [Configuration Reference](/th/gateway/config-agents#agents-defaults-skills)

  </Accordion>

  <Accordion title="ปรับแต่งการตรวจสอบสถานะ channel ของ gateway">
    ควบคุมว่า gateway จะรีสตาร์ต channels ที่ดูเหมือนค้างอย่างเข้มงวดเพียงใด:

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

    - ตั้ง `gateway.channelHealthCheckMinutes: 0` เพื่อปิดการรีสตาร์ตจาก health-monitor แบบทั่วระบบ
    - `channelStaleEventThresholdMinutes` ควรมากกว่าหรือเท่ากับช่วงเวลาตรวจสอบ
    - ใช้ `channels.<provider>.healthMonitor.enabled` หรือ `channels.<provider>.accounts.<id>.healthMonitor.enabled` เพื่อปิดการรีสตาร์ตอัตโนมัติสำหรับ channel หรือบัญชีเดียว โดยไม่ต้องปิดตัวตรวจสอบทั่วระบบ
    - ดู [Health Checks](/th/gateway/health) สำหรับการดีบักเชิงปฏิบัติการ และ [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#gateway) สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="กำหนดค่าเซสชันและการรีเซ็ต">
    เซสชันควบคุมความต่อเนื่องและการแยกของการสนทนา:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // แนะนำสำหรับผู้ใช้หลายคน
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
    - `threadBindings`: ค่าเริ่มต้นแบบ global สำหรับการกำหนดเส้นทางเซสชันแบบผูกกับเธรด (Discord รองรับ `/focus`, `/unfocus`, `/agents`, `/session idle` และ `/session max-age`)
    - ดู [Session Management](/th/concepts/session) สำหรับ scoping, ลิงก์ตัวตน และนโยบายการส่ง
    - ดู [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-agents#session) สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="เปิดใช้ sandboxing">
    รันเซสชันของเอเจนต์ในรันไทม์ sandbox แบบแยกส่วน:

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

    build image ก่อน: `scripts/sandbox-setup.sh`

    ดู [Sandboxing](/th/gateway/sandboxing) สำหรับคู่มือฉบับเต็ม และ [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-agents#agentsdefaultssandbox) สำหรับทุกตัวเลือก

  </Accordion>

  <Accordion title="เปิดใช้ push ที่ใช้ relay สำหรับบิลด์ iOS ทางการ">
    การกำหนดค่า push ที่ใช้ relay จะอยู่ใน `openclaw.json`

    ตั้งค่านี้ใน gateway config:

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

    - ทำให้ Gateway สามารถส่ง `push.test`, wake nudges และ reconnect wakes ผ่าน relay ภายนอกได้
    - ใช้ send grant ที่ผูกกับ registration ซึ่งส่งต่อมาจากแอป iOS ที่จับคู่แล้ว โดย Gateway ไม่จำเป็นต้องมี relay token ระดับ deployment
    - ผูกแต่ละ registration ที่ใช้ relay กับตัวตนของ Gateway ที่แอป iOS จับคู่ไว้ ดังนั้น Gateway อื่นจะไม่สามารถนำ registration ที่เก็บไว้นี้ไปใช้ซ้ำได้
    - คงให้บิลด์ iOS แบบ local/manual ใช้ APNs โดยตรง การส่งผ่าน relay จะใช้เฉพาะกับบิลด์ทางการที่แจกจ่ายแล้วซึ่งลงทะเบียนผ่าน relay
    - ต้องตรงกับ relay base URL ที่ฝังอยู่ในบิลด์ iOS ทางการ/TestFlight เพื่อให้ทราฟฟิกการลงทะเบียนและการส่งไปถึง deployment ของ relay เดียวกัน

    ลำดับการทำงานแบบต้นทางถึงปลายทาง:

    1. ติดตั้งบิลด์ iOS ทางการ/TestFlight ที่คอมไพล์ด้วย relay base URL เดียวกัน
    2. กำหนดค่า `gateway.push.apns.relay.baseUrl` บน Gateway
    3. จับคู่แอป iOS กับ Gateway และให้ทั้ง node session และ operator session เชื่อมต่อ
    4. แอป iOS จะดึงตัวตนของ Gateway ลงทะเบียนกับ relay โดยใช้ App Attest ร่วมกับ app receipt แล้วเผยแพร่ payload `push.apns.register` ที่ใช้ relay ไปยัง Gateway ที่จับคู่ไว้
    5. Gateway จะจัดเก็บ relay handle และ send grant จากนั้นใช้ข้อมูลเหล่านี้สำหรับ `push.test`, wake nudges และ reconnect wakes

    หมายเหตุด้านการปฏิบัติงาน:

    - หากคุณสลับแอป iOS ไปใช้ Gateway อื่น ให้เชื่อมต่อแอปใหม่เพื่อให้สามารถเผยแพร่ relay registration ใหม่ที่ผูกกับ Gateway นั้นได้
    - หากคุณออกบิลด์ iOS ใหม่ที่ชี้ไปยัง deployment ของ relay คนละชุด แอปจะรีเฟรช relay registration ที่แคชไว้แทนการใช้ต้นทาง relay เก่าซ้ำ

    หมายเหตุด้านความเข้ากันได้:

    - `OPENCLAW_APNS_RELAY_BASE_URL` และ `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ยังใช้งานได้เป็น env overrides ชั่วคราว
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` ยังคงเป็นช่องทางสำหรับการพัฒนาแบบ local loopback เท่านั้น; อย่าบันทึก relay URL แบบ HTTP ลงใน config

    ดู [แอป iOS](/th/platforms/ios#relay-backed-push-for-official-builds) สำหรับลำดับการทำงานแบบต้นทางถึงปลายทาง และ [ขั้นตอนการยืนยันตัวตนและ trust flow](/th/platforms/ios#authentication-and-trust-flow) สำหรับโมเดลความปลอดภัยของ relay

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

  <Accordion title="กำหนดค่า Cron jobs">
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

    - `sessionRetention`: ลบ completed isolated run sessions ออกจาก `sessions.json` (ค่าเริ่มต้น `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน)
    - `runLog`: ตัดข้อมูล `cron/runs/<jobId>.jsonl` ตามขนาดและจำนวนบรรทัดที่เก็บไว้
    - ดู [Cron jobs](/th/automation/cron-jobs) สำหรับภาพรวมฟีเจอร์และตัวอย่าง CLI

  </Accordion>

  <Accordion title="ตั้งค่า Webhooks (hooks)">
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
    - ให้ถือว่าเนื้อหา payload ของ hook/webhook ทั้งหมดเป็นอินพุตที่ไม่น่าเชื่อถือ
    - ใช้ `hooks.token` โดยเฉพาะ; อย่าใช้ Gateway token ที่ใช้ร่วมกันซ้ำ
    - การยืนยันตัวตนของ hook ใช้ header เท่านั้น (`Authorization: Bearer ...` หรือ `x-openclaw-token`); ระบบจะปฏิเสธ token ที่อยู่ใน query string
    - `hooks.path` ต้องไม่เป็น `/`; ควรแยก webhook ingress ไว้บน subpath โดยเฉพาะ เช่น `/hooks`
    - ควรปิด bypass flags สำหรับเนื้อหาที่ไม่ปลอดภัย (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) ไว้ เว้นแต่จะกำลังดีบักแบบจำกัดขอบเขตอย่างเข้มงวด
    - หากคุณเปิด `hooks.allowRequestSessionKey` ให้ตั้ง `hooks.allowedSessionKeyPrefixes` ด้วย เพื่อจำกัดขอบเขตของ session keys ที่ผู้เรียกเลือกได้
    - สำหรับเอเจนต์ที่ขับเคลื่อนด้วย hook ควรใช้โมเดลระดับสูงที่ทันสมัยและนโยบายเครื่องมือที่เข้มงวด (เช่น อนุญาตเฉพาะการส่งข้อความร่วมกับ sandboxing เมื่อเป็นไปได้)

    ดู [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#hooks) สำหรับตัวเลือก mapping ทั้งหมดและการรวมเข้ากับ Gmail

  </Accordion>

  <Accordion title="กำหนดค่า multi-agent routing">
    รันเอเจนต์หลายตัวแบบแยกขาดจากกันด้วย workspaces และ sessions คนละชุด:

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

    ดู [Multi-Agent](/th/concepts/multi-agent) และ [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-agents#multi-agent-routing) สำหรับกฎของ bindings และโปรไฟล์การเข้าถึงรายเอเจนต์

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

    - **ไฟล์เดียว**: แทนที่อ็อบเจ็กต์ที่ครอบอยู่ทั้งหมด
    - **อาร์เรย์ของไฟล์**: deep-merge ตามลำดับ (ตัวหลังมีความสำคัญกว่า)
    - **คีย์ข้างเคียง**: merge หลัง includes (ใช้ override ค่าที่ include มา)
    - **Nested includes**: รองรับลึกได้สูงสุด 10 ระดับ
    - **พาธแบบ relative**: resolve โดยอิงจากไฟล์ที่ทำการ include
    - **OpenClaw-owned writes**: เมื่อการเขียนเปลี่ยนเฉพาะ top-level section เดียว
      ที่รองรับด้วย single-file include เช่น `plugins: { $include: "./plugins.json5" }`,
      OpenClaw จะอัปเดตไฟล์ที่ include นั้น และปล่อย `openclaw.json` ไว้เหมือนเดิม
    - **Unsupported write-through**: root includes, include arrays และ includes
      ที่มี sibling overrides จะ fail closed สำหรับการเขียนที่ OpenClaw เป็นเจ้าของ แทนที่จะ
      flatten config
    - **การจัดการข้อผิดพลาด**: แสดงข้อผิดพลาดอย่างชัดเจนสำหรับไฟล์ที่หายไป, parse errors และ circular includes

  </Accordion>
</AccordionGroup>

## Config hot reload

Gateway จะเฝ้าดู `~/.openclaw/openclaw.json` และใช้การเปลี่ยนแปลงโดยอัตโนมัติ — โดยส่วนใหญ่ไม่ต้องรีสตาร์ตเอง

การแก้ไขไฟล์โดยตรงจะถูกถือว่าไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบความถูกต้อง watcher จะรอ
ให้การเขียนชั่วคราว/การเปลี่ยนชื่อจากตัวแก้ไขนิ่งก่อน จากนั้นอ่านไฟล์สุดท้าย และปฏิเสธ
การแก้ไขภายนอกที่ไม่ถูกต้องโดยกู้คืน config last-known-good การเขียน config ที่ OpenClaw เป็นเจ้าของ
จะใช้ schema gate เดียวกันก่อนเขียน; การเขียนทับแบบทำลาย เช่น
การทำ `gateway.mode` หายไป หรือทำให้ไฟล์เล็กลงเกินครึ่ง จะถูกปฏิเสธ
และบันทึกเป็น `.rejected.*` ไว้เพื่อตรวจสอบ

ความล้มเหลวในการตรวจสอบความถูกต้องระดับ Plugin เป็นข้อยกเว้น: หากทุกปัญหาอยู่ภายใต้
`plugins.entries.<id>...`, การ reload จะคง config ปัจจุบันไว้และรายงานปัญหาของ Plugin
แทนการกู้คืน `.last-good`

หากคุณเห็น `Config auto-restored from last-known-good` หรือ
`config reload restored last-known-good config` ใน logs ให้ตรวจสอบไฟล์
`.clobbered.*` ที่ตรงกันข้าง ๆ `openclaw.json`, แก้ payload ที่ถูกปฏิเสธ แล้วรัน
`openclaw config validate` ดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-restored-last-known-good-config)
สำหรับรายการตรวจสอบการกู้คืน

### โหมดการ reload

| โหมด                   | พฤติกรรม                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------- |
| **`hybrid`** (ค่าเริ่มต้น) | ใช้การเปลี่ยนแปลงที่ปลอดภัยแบบ hot ทันที และรีสตาร์ตอัตโนมัติเมื่อเป็นการเปลี่ยนแปลงที่สำคัญ |
| **`hot`**              | ใช้เฉพาะการเปลี่ยนแปลงที่ปลอดภัยแบบ hot และบันทึกคำเตือนเมื่อจำเป็นต้องรีสตาร์ต — คุณจัดการเอง |
| **`restart`**          | รีสตาร์ต Gateway เมื่อมีการเปลี่ยน config ใด ๆ ไม่ว่าจะปลอดภัยหรือไม่                         |
| **`off`**              | ปิดการเฝ้าดูไฟล์ การเปลี่ยนแปลงจะมีผลเมื่อรีสตาร์ตเองครั้งถัดไป                              |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### อะไรใช้แบบ hot ได้ และอะไรต้องรีสตาร์ต

ฟิลด์ส่วนใหญ่ใช้แบบ hot ได้โดยไม่มี downtime ในโหมด `hybrid` การเปลี่ยนแปลงที่ต้องรีสตาร์ตจะถูกจัดการให้อัตโนมัติ

| หมวดหมู่            | ฟิลด์                                                             | ต้องรีสตาร์ตหรือไม่ |
| ------------------- | ----------------------------------------------------------------- | ------------------- |
| Channels            | `channels.*`, `web` (WhatsApp) — ทั้ง built-in และ plugin channels | ไม่ต้อง              |
| Agent & models      | `agent`, `agents`, `models`, `routing`                            | ไม่ต้อง              |
| Automation          | `hooks`, `cron`, `agent.heartbeat`                                | ไม่ต้อง              |
| Sessions & messages | `session`, `messages`                                             | ไม่ต้อง              |
| Tools & media       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | ไม่ต้อง              |
| UI & misc           | `ui`, `logging`, `identity`, `bindings`                           | ไม่ต้อง              |
| Gateway server      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **ต้อง**             |
| Infrastructure      | `discovery`, `canvasHost`, `plugins`                              | **ต้อง**             |

<Note>
`gateway.reload` และ `gateway.remote` เป็นข้อยกเว้น — การเปลี่ยนสองค่านี้จะ **ไม่** ทำให้เกิดการรีสตาร์ต
</Note>

### การวางแผนการ reload

เมื่อคุณแก้ไขไฟล์ซอร์สที่ถูกอ้างอิงผ่าน `$include`, OpenClaw จะวางแผน
การ reload จากเลย์เอาต์ที่ผู้เขียนกำหนดไว้ในซอร์ส ไม่ใช่มุมมองในหน่วยความจำที่ flatten แล้ว
ซึ่งช่วยให้การตัดสินใจ hot-reload (ใช้แบบ hot หรือรีสตาร์ต) คาดเดาได้ แม้เมื่อ
top-level section เดียวอยู่ในไฟล์ include ของตัวเอง เช่น
`plugins: { $include: "./plugins.json5" }` การวางแผน reload จะ fail closed หาก
เลย์เอาต์ของซอร์สกำกวม

## Config RPC (การอัปเดตแบบเป็นโปรแกรม)

สำหรับเครื่องมือที่เขียน config ผ่าน Gateway API ให้ใช้ขั้นตอนดังนี้:

- `config.schema.lookup` เพื่อตรวจสอบ subtree เดียว (schema node แบบตื้น + สรุปลูก)
- `config.get` เพื่อดึง snapshot ปัจจุบันพร้อม `hash`
- `config.patch` สำหรับการอัปเดตบางส่วน (JSON merge patch: อ็อบเจ็กต์ merge, `null`
  ใช้ลบ, arrays ใช้แทนที่)
- `config.apply` เฉพาะเมื่อคุณตั้งใจแทนที่ config ทั้งหมด
- `update.run` สำหรับ self-update แบบ explicit พร้อมรีสตาร์ต

เอเจนต์ควรมอง `config.schema.lookup` เป็นจุดเริ่มต้นแรกสำหรับ
เอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำ ใช้ [Configuration reference](/th/gateway/configuration-reference)
เมื่อจำเป็นต้องดูแผนที่ config ในภาพกว้าง ค่าเริ่มต้น หรือ links ไปยังเอกสารอ้างอิงของระบบย่อยที่เกี่ยวข้อง

<Note>
การเขียนใน control plane (`config.apply`, `config.patch`, `update.run`) ถูก
จำกัดอัตราไว้ที่ 3 คำขอต่อ 60 วินาทีต่อ `deviceId+clientIp`
คำขอรีสตาร์ตจะถูกรวมเข้าด้วยกัน จากนั้นบังคับ cooldown 30 วินาทีระหว่างรอบการรีสตาร์ต
</Note>

ตัวอย่าง partial patch:

```bash
openclaw gateway call config.get --params '{}'  # เก็บค่า payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

ทั้ง `config.apply` และ `config.patch` รองรับ `raw`, `baseHash`, `sessionKey`,
`note` และ `restartDelayMs` โดย `baseHash` จำเป็นสำหรับทั้งสองเมธอดเมื่อ
มี config อยู่แล้ว

## ตัวแปรสภาพแวดล้อม

OpenClaw จะอ่าน env vars จาก parent process และจาก:

- `.env` ใน current working directory (หากมี)
- `~/.openclaw/.env` (fallback แบบ global)

ทั้งสองไฟล์จะไม่เขียนทับ env vars ที่มีอยู่แล้ว นอกจากนี้คุณยังสามารถตั้ง inline env vars ใน config ได้:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="การนำเข้า shell env (ไม่บังคับ)">
  หากเปิดใช้และยังไม่ได้ตั้งคีย์ที่คาดหวังไว้ OpenClaw จะรัน login shell ของคุณและนำเข้าเฉพาะคีย์ที่ยังขาดอยู่:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

ค่าตัวแปรสภาพแวดล้อมที่เทียบเท่า: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="การแทนค่าตัวแปรสภาพแวดล้อมในค่าของ config">
  อ้างอิง env vars ในค่าสตริงของ config ใด ๆ ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

กฎมีดังนี้:

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- หากตัวแปรหายไปหรือว่างเปล่า จะเกิดข้อผิดพลาดตอนโหลด
- ใช้ `$${VAR}` เพื่อให้ได้ผลลัพธ์แบบ literal
- ใช้งานได้ภายในไฟล์ `$include`
- การแทนค่าแบบ inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
  สำหรับฟิลด์ที่รองรับอ็อบเจ็กต์ SecretRef คุณสามารถใช้:

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

รายละเอียดของ SecretRef (รวมถึง `secrets.providers` สำหรับ `env`/`file`/`exec`) อยู่ใน [การจัดการ Secrets](/th/gateway/secrets)
เส้นทาง credentials ที่รองรับแสดงไว้ใน [พื้นผิว Credentials ของ SecretRef](/th/reference/secretref-credential-surface)
</Accordion>

ดู [Environment](/th/help/environment) สำหรับลำดับความสำคัญและแหล่งที่มาแบบเต็ม

## ข้อมูลอ้างอิงฉบับเต็ม

สำหรับข้อมูลอ้างอิงแบบครบทุกฟิลด์ ดู **[Configuration Reference](/th/gateway/configuration-reference)**

---

_ที่เกี่ยวข้อง: [Configuration Examples](/th/gateway/configuration-examples) · [Configuration Reference](/th/gateway/configuration-reference) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [Configuration reference](/th/gateway/configuration-reference)
- [Configuration examples](/th/gateway/configuration-examples)
- [Gateway runbook](/th/gateway)
