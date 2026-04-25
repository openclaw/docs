---
read_when:
    - การตั้งค่า OpenClaw เป็นครั้งแรก
    - กำลังมองหารูปแบบการกำหนดค่าที่ใช้บ่อย
    - การไปยังส่วนการกำหนดค่าที่เจาะจง
summary: 'ภาพรวมการกำหนดค่า: งานที่พบบ่อย การตั้งค่าอย่างรวดเร็ว และลิงก์ไปยังเอกสารอ้างอิงฉบับเต็ม'
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-04-25T13:47:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8ffe1972fc7680d4cfc55a24fd6fc3869af593faf8c1137369dad0dbefde43a
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw จะอ่านการกำหนดค่าแบบ <Tooltip tip="JSON5 รองรับคอมเมนต์และเครื่องหมายจุลภาคต่อท้าย">**JSON5**</Tooltip> ซึ่งเป็นตัวเลือก จาก `~/.openclaw/openclaw.json`
พาธการกำหนดค่าที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ เลย์เอาต์ `openclaw.json` แบบ symlink
ไม่รองรับสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ การเขียนแบบอะตอมมิกอาจแทนที่
พาธนั้นแทนที่จะคง symlink ไว้ หากคุณเก็บการกำหนดค่าไว้นอกไดเรกทอรีสถานะเริ่มต้น
ให้ชี้ `OPENCLAW_CONFIG_PATH` ไปยังไฟล์จริงโดยตรง

หากไม่มีไฟล์ OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัย เหตุผลทั่วไปในการเพิ่มการกำหนดค่า:

- เชื่อมต่อช่องทางและควบคุมว่าใครสามารถส่งข้อความถึงบอทได้
- ตั้งค่าโมเดล เครื่องมือ sandboxing หรือระบบอัตโนมัติ (Cron, hooks)
- ปรับแต่งเซสชัน สื่อ เครือข่าย หรือ UI

ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference) สำหรับทุกฟิลด์ที่ใช้ได้

<Tip>
**เพิ่งเริ่มใช้การกำหนดค่าใช่ไหม?** เริ่มด้วย `openclaw onboard` สำหรับการตั้งค่าแบบโต้ตอบ หรือดูคู่มือ [Configuration Examples](/th/gateway/configuration-examples) สำหรับการกำหนดค่าแบบคัดลอกวางได้ครบชุด
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
    openclaw onboard       # flow การเริ่มต้นใช้งานแบบเต็ม
    openclaw configure     # วิซาร์ดการกำหนดค่า
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
    โดย Control UI จะเรนเดอร์ฟอร์มจาก schema การกำหนดค่าแบบ live รวมถึง metadata เอกสารของฟิลด์
    `title` / `description` ตลอดจน schema ของ Plugin และช่องทางเมื่อ
    พร้อมใช้งาน พร้อมตัวแก้ไข **Raw JSON** เป็นทางหนีทีไล่ สำหรับ
    UI แบบเจาะลึกและเครื่องมืออื่น ๆ gateway ยังเปิดให้ใช้ `config.schema.lookup` เพื่อ
    ดึง schema node ของพาธเดียวพร้อมสรุปลูก immediate
  </Tab>
  <Tab title="แก้ไขโดยตรง">
    แก้ไข `~/.openclaw/openclaw.json` โดยตรง Gateway จะเฝ้าดูไฟล์และใช้การเปลี่ยนแปลงโดยอัตโนมัติ (ดู [hot reload](#config-hot-reload))
  </Tab>
</Tabs>

## การตรวจสอบความถูกต้องแบบเข้มงวด

<Warning>
OpenClaw ยอมรับเฉพาะการกำหนดค่าที่ตรงกับ schema อย่างสมบูรณ์เท่านั้น คีย์ที่ไม่รู้จัก ชนิดข้อมูลที่ผิดรูปแบบ หรือค่าที่ไม่ถูกต้องจะทำให้ Gateway **ปฏิเสธการเริ่มทำงาน** ข้อยกเว้นเพียงอย่างเดียวในระดับรูทคือ `$schema` (สตริง) เพื่อให้ตัวแก้ไขสามารถแนบ metadata ของ JSON Schema ได้
</Warning>

`openclaw config schema` จะพิมพ์ canonical JSON Schema ที่ Control UI
และการตรวจสอบความถูกต้องใช้งาน `config.schema.lookup` จะดึง node แบบมีขอบเขตพาธเดียวพร้อม
สรุปลูกสำหรับเครื่องมือแบบเจาะลึก metadata เอกสารของฟิลด์ `title`/`description`
จะส่งผ่านไปยังอ็อบเจ็กต์ซ้อน, wildcard (`*`), รายการในอาร์เรย์ (`[]`) และแขนง `anyOf`/
`oneOf`/`allOf` schema ของ Plugin และช่องทางขณะรันจะถูกรวมเข้ามาเมื่อ
โหลด manifest registry แล้ว

เมื่อการตรวจสอบความถูกต้องล้มเหลว:

- Gateway จะไม่เริ่มทำงาน
- ใช้ได้เฉพาะคำสั่งวินิจฉัย (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- รัน `openclaw doctor` เพื่อดูปัญหาที่แน่ชัด
- รัน `openclaw doctor --fix` (หรือ `--yes`) เพื่อใช้การซ่อมแซม

Gateway จะเก็บสำเนาที่เชื่อถือได้ของการกำหนดค่าที่ทำงานได้ล่าสุดหลังจากเริ่มทำงานสำเร็จแต่ละครั้ง
หากภายหลัง `openclaw.json` ตรวจสอบความถูกต้องไม่ผ่าน (หรือไม่มี `gateway.mode`, มีขนาด
ลดลงอย่างมาก หรือมีบรรทัด log แปลกปลอมถูกใส่ไว้ด้านหน้า) OpenClaw จะเก็บไฟล์ที่เสียหาย
ไว้เป็น `.clobbered.*`, กู้คืนสำเนาที่ทำงานได้ล่าสุด และบันทึกเหตุผลในการกู้คืน
เทิร์นถัดไปของ Agent จะได้รับคำเตือนแบบ system-event ด้วย เพื่อให้ Agent หลัก
ไม่เขียนทับการกำหนดค่าที่กู้คืนมาแบบมืดบอด การเลื่อนสถานะเป็น last-known-good
จะถูกข้ามเมื่อ candidate มี placeholder ของ secret ที่ถูก redacted เช่น `***`
เมื่อปัญหาการตรวจสอบความถูกต้องทั้งหมดอยู่ภายใต้ขอบเขต `plugins.entries.<id>...`
OpenClaw จะไม่ทำการกู้คืนทั้งไฟล์ มันจะคงการกำหนดค่าปัจจุบันไว้และ
แสดงความล้มเหลวเฉพาะของ Plugin เพื่อไม่ให้ความไม่ตรงกันระหว่าง schema ของ Plugin หรือเวอร์ชันโฮสต์
ทำให้การตั้งค่าผู้ใช้อื่นที่ไม่เกี่ยวข้องถูกย้อนกลับ

## งานที่พบบ่อย

<AccordionGroup>
  <Accordion title="ตั้งค่าช่องทาง (WhatsApp, Telegram, Discord ฯลฯ)">
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
          allowFrom: ["tg:123"], // เฉพาะสำหรับ allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="เลือกและกำหนดค่าโมเดล">
    ตั้งค่าโมเดลหลักและ fallback ที่เป็นตัวเลือก:

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
    - ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ allowlist โดยไม่ลบโมเดลที่มีอยู่ รายการแทนที่แบบปกติที่ทำให้รายการเดิมหายไปจะถูกปฏิเสธ เว้นแต่คุณจะส่ง `--replace`
    - model ref ใช้รูปแบบ `provider/model` (เช่น `anthropic/claude-opus-4-6`)
    - `agents.defaults.imageMaxDimensionPx` ควบคุมการย่อขนาดภาพใน transcript/tool (ค่าเริ่มต้น `1200`) ค่าที่ต่ำกว่ามักช่วยลดการใช้ vision-token ในการรันที่มีภาพหน้าจอจำนวนมาก
    - ดู [Models CLI](/th/concepts/models) สำหรับการสลับโมเดลในแชต และ [Model Failover](/th/concepts/model-failover) สำหรับการหมุนเวียน auth และพฤติกรรม fallback
    - สำหรับผู้ให้บริการแบบกำหนดเอง/โฮสต์เอง ดู [Custom providers](/th/gateway/config-tools#custom-providers-and-base-urls) ในเอกสารอ้างอิง

  </Accordion>

  <Accordion title="ควบคุมว่าใครสามารถส่งข้อความถึงบอทได้">
    การเข้าถึง DM ถูกควบคุมเป็นรายช่องทางผ่าน `dmPolicy`:

    - `"pairing"` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัสการจับคู่แบบใช้ครั้งเดียวเพื่ออนุมัติ
    - `"allowlist"`: เฉพาะผู้ส่งใน `allowFrom` (หรือ paired allow store)
    - `"open"`: อนุญาต DM ขาเข้าทั้งหมด (ต้องมี `allowFrom: ["*"]`)
    - `"disabled"`: ไม่สนใจ DM ทั้งหมด

    สำหรับกลุ่ม ให้ใช้ `groupPolicy` + `groupAllowFrom` หรือ allowlist เฉพาะช่องทาง

    ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#dm-and-group-access) สำหรับรายละเอียดรายช่องทาง

  </Accordion>

  <Accordion title="ตั้งค่า mention gating ของแชตกลุ่ม">
    ข้อความกลุ่มจะใช้ **require mention** เป็นค่าเริ่มต้น กำหนด pattern เป็นราย Agent:

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

    - **Metadata mentions**: การ @-mention แบบเนทีฟ (WhatsApp แตะเพื่อ mention, Telegram @bot เป็นต้น)
    - **Text patterns**: pattern regex ที่ปลอดภัยใน `mentionPatterns`
    - ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#group-chat-mention-gating) สำหรับการเขียนทับรายช่องทางและโหมด self-chat

  </Accordion>

  <Accordion title="จำกัด Skills เป็นราย Agent">
    ใช้ `agents.defaults.skills` สำหรับค่าพื้นฐานที่ใช้ร่วมกัน แล้วเขียนทับ
    Agent เฉพาะด้วย `agents.list[].skills`:

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

    - ละ `agents.defaults.skills` เพื่อให้ Skills ไม่ถูกจำกัดเป็นค่าเริ่มต้น
    - ละ `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
    - ตั้ง `agents.list[].skills: []` เพื่อไม่ให้มี Skills
    - ดู [Skills](/th/tools/skills), [Skills config](/th/tools/skills-config) และ
      [Configuration Reference](/th/gateway/config-agents#agents-defaults-skills)

  </Accordion>

  <Accordion title="ปรับแต่งการตรวจสอบสุขภาพของช่องทางใน gateway">
    ควบคุมว่า gateway จะรีสตาร์ตช่องทางที่ดูเหมือนค้างอย่างจริงจังเพียงใด:

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

    - ตั้ง `gateway.channelHealthCheckMinutes: 0` เพื่อปิดการรีสตาร์ตจาก health-monitor แบบ global
    - `channelStaleEventThresholdMinutes` ควรมากกว่าหรือเท่ากับช่วงเวลาตรวจสอบ
    - ใช้ `channels.<provider>.healthMonitor.enabled` หรือ `channels.<provider>.accounts.<id>.healthMonitor.enabled` เพื่อปิดการรีสตาร์ตอัตโนมัติสำหรับช่องทางหรือบัญชีใดบัญชีหนึ่งโดยไม่ต้องปิดตัวตรวจสอบแบบ global
    - ดู [Health Checks](/th/gateway/health) สำหรับการดีบักเชิงปฏิบัติการ และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#gateway) สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="กำหนดค่าเซสชันและการรีเซ็ต">
    เซสชันควบคุมความต่อเนื่องและการแยกตัวของบทสนทนา:

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
    - `threadBindings`: ค่าเริ่มต้นแบบ global สำหรับการกำหนดเส้นทางเซสชันที่ผูกกับเธรด (Discord รองรับ `/focus`, `/unfocus`, `/agents`, `/session idle` และ `/session max-age`)
    - ดู [Session Management](/th/concepts/session) สำหรับขอบเขต ลิงก์ identity และนโยบายการส่ง
    - ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#session) สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="เปิดใช้ sandboxing">
    รันเซสชันของ Agent ใน runtime sandbox แบบแยก:

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

    ดู [Sandboxing](/th/gateway/sandboxing) สำหรับคู่มือฉบับเต็ม และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#agentsdefaultssandbox) สำหรับตัวเลือกทั้งหมด

  </Accordion>

  <Accordion title="เปิดใช้ push ที่มี relay เป็นแบ็กเอนด์สำหรับบิลด์ iOS อย่างเป็นทางการ">
    push ที่มี relay เป็นแบ็กเอนด์จะถูกกำหนดค่าใน `openclaw.json`

    ตั้งค่านี้ใน config ของ gateway:

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

    เทียบเท่าใน CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    สิ่งที่การตั้งค่านี้ทำ:

    - อนุญาตให้ gateway ส่ง `push.test`, wake nudges และ reconnect wakes ผ่าน relay ภายนอก
    - ใช้สิทธิ์ส่งแบบผูกกับ registration ที่แอป iOS ที่จับคู่ไว้ส่งต่อมาให้ gateway ไม่จำเป็นที่ gateway ต้องมี relay token ระดับ deployment ทั้งระบบ
    - ผูก registration ที่มี relay เป็นแบ็กเอนด์แต่ละรายการเข้ากับ identity ของ gateway ที่แอป iOS จับคู่ไว้ จึงไม่สามารถให้ gateway อื่นนำ registration ที่จัดเก็บไว้ไปใช้ซ้ำได้
    - คงให้บิลด์ iOS ในเครื่อง/แบบ manual ใช้ APNs โดยตรง การส่งผ่าน relay จะใช้เฉพาะกับบิลด์ทางการที่แจกจ่ายแล้วซึ่งลงทะเบียนผ่าน relay เท่านั้น
    - ต้องตรงกับ relay base URL ที่ฝังมากับบิลด์ iOS ทางการ/TestFlight เพื่อให้ทราฟฟิกการลงทะเบียนและการส่งไปถึง deployment ของ relay เดียวกัน

    flow แบบ end-to-end:

    1. ติดตั้งบิลด์ iOS ทางการ/TestFlight ที่คอมไพล์ด้วย relay base URL เดียวกัน
    2. กำหนดค่า `gateway.push.apns.relay.baseUrl` บน gateway
    3. จับคู่แอป iOS กับ gateway และให้ทั้งเซสชัน node และ operator เชื่อมต่อ
    4. แอป iOS จะดึง identity ของ gateway, ลงทะเบียนกับ relay โดยใช้ App Attest ร่วมกับ app receipt จากนั้นเผยแพร่ payload `push.apns.register` ที่มี relay เป็นแบ็กเอนด์ไปยัง gateway ที่จับคู่ไว้
    5. gateway จะจัดเก็บ relay handle และ send grant แล้วใช้ข้อมูลเหล่านี้สำหรับ `push.test`, wake nudges และ reconnect wakes

    หมายเหตุในการปฏิบัติงาน:

    - หากคุณสลับให้แอป iOS ไปใช้ gateway อื่น ให้เชื่อมต่อแอปใหม่เพื่อให้สามารถเผยแพร่ relay registration ใหม่ที่ผูกกับ gateway นั้น
    - หากคุณปล่อยบิลด์ iOS ใหม่ที่ชี้ไปยัง deployment ของ relay อื่น แอปจะรีเฟรช relay registration ที่แคชไว้แทนการใช้ต้นทาง relay เดิมซ้ำ

    หมายเหตุด้านความเข้ากันได้:

    - `OPENCLAW_APNS_RELAY_BASE_URL` และ `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ยังใช้งานได้เป็นการเขียนทับด้วย env ชั่วคราว
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` ยังคงเป็นทางหนีทีไล่สำหรับการพัฒนาแบบ loopback-only; อย่าบันทึก URL relay แบบ HTTP ลงในการกำหนดค่า

    ดู [iOS App](/th/platforms/ios#relay-backed-push-for-official-builds) สำหรับ flow แบบ end-to-end และ [Authentication and trust flow](/th/platforms/ios#authentication-and-trust-flow) สำหรับโมเดลความปลอดภัยของ relay

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

    - `every`: สตริงระยะเวลา (`30m`, `2h`) ตั้งเป็น `0m` เพื่อปิดใช้งาน
    - `target`: `last` | `none` | `<channel-id>` (ตัวอย่างเช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`)
    - `directPolicy`: `allow` (ค่าเริ่มต้น) หรือ `block` สำหรับเป้าหมาย Heartbeat แบบ DM
    - ดู [Heartbeat](/th/gateway/heartbeat) สำหรับคู่มือฉบับเต็ม

  </Accordion>

  <Accordion title="กำหนดค่างาน Cron">
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

    - `sessionRetention`: prune เซสชันการรันแบบ isolated ที่เสร็จแล้วออกจาก `sessions.json` (ค่าเริ่มต้น `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน)
    - `runLog`: prune `cron/runs/<jobId>.jsonl` ตามขนาดและจำนวนบรรทัดที่เก็บไว้
    - ดู [Cron jobs](/th/automation/cron-jobs) สำหรับภาพรวมฟีเจอร์และตัวอย่าง CLI

  </Accordion>

  <Accordion title="ตั้งค่า Webhook (hooks)">
    เปิดใช้งานปลายทาง Webhook แบบ HTTP บน Gateway:

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
    - ถือว่าเนื้อหา payload ของ hook/Webhook ทั้งหมดเป็นอินพุตที่ไม่น่าเชื่อถือ
    - ใช้ `hooks.token` โดยเฉพาะ; อย่านำโทเค็น Gateway ที่ใช้ร่วมกันมาใช้ซ้ำ
    - การยืนยันตัวตนของ hook รองรับเฉพาะ header (`Authorization: Bearer ...` หรือ `x-openclaw-token`); โทเค็นใน query string จะถูกปฏิเสธ
    - `hooks.path` ห้ามเป็น `/`; ให้คงจุดรับเข้า Webhook ไว้ในพาธย่อยเฉพาะ เช่น `/hooks`
    - ให้ปิดแฟล็ก bypass สำหรับเนื้อหาที่ไม่ปลอดภัยไว้ (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) เว้นแต่กำลังดีบักแบบจำกัดขอบเขตอย่างเข้มงวด
    - หากคุณเปิด `hooks.allowRequestSessionKey` ให้ตั้ง `hooks.allowedSessionKeyPrefixes` ด้วยเพื่อจำกัด session key ที่ผู้เรียกเลือกเอง
    - สำหรับ Agents ที่ขับเคลื่อนด้วย hook ให้เลือกใช้ tier ของโมเดลสมัยใหม่ที่แข็งแรงและนโยบายเครื่องมือที่เข้มงวด (ตัวอย่างเช่น อนุญาตเฉพาะการส่งข้อความร่วมกับ sandboxing เมื่อทำได้)

    ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#hooks) สำหรับตัวเลือก mapping ทั้งหมดและการผสานรวม Gmail

  </Accordion>

  <Accordion title="กำหนดค่าการกำหนดเส้นทางแบบหลาย Agents">
    รัน Agents แบบแยกหลายตัวด้วยเวิร์กสเปซและเซสชันแยกกัน:

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

    ดู [Multi-Agent](/th/concepts/multi-agent) และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#multi-agent-routing) สำหรับกฎการผูกและโปรไฟล์การเข้าถึงราย Agent

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

    - **ไฟล์เดียว**: แทนที่อ็อบเจ็กต์ที่ครอบอยู่
    - **อาร์เรย์ของไฟล์**: deep-merge ตามลำดับ (รายการหลังชนะ)
    - **คีย์ข้างเคียง**: merge หลัง include (เขียนทับค่าที่ include มา)
    - **include แบบซ้อน**: รองรับลึกได้สูงสุด 10 ระดับ
    - **พาธสัมพัทธ์**: resolve เทียบกับไฟล์ที่ include
    - **การเขียนที่ OpenClaw เป็นเจ้าของ**: เมื่อการเขียนเปลี่ยนเฉพาะ section ระดับบนสุดหนึ่งรายการ
      ที่รองรับด้วย include แบบไฟล์เดียว เช่น `plugins: { $include: "./plugins.json5" }`,
      OpenClaw จะอัปเดตไฟล์ที่ถูก include นั้นและคง `openclaw.json` ไว้เหมือนเดิม
    - **ไม่รองรับ write-through**: include ที่รูท, include แบบอาร์เรย์ และ include
      ที่มีการเขียนทับจากคีย์ข้างเคียงจะ fail closed สำหรับการเขียนที่ OpenClaw เป็นเจ้าของ แทนที่จะ
      flatten config
    - **การจัดการข้อผิดพลาด**: แสดงข้อผิดพลาดที่ชัดเจนสำหรับไฟล์ที่หายไป ข้อผิดพลาดในการ parse และ include แบบวนลูป

  </Accordion>
</AccordionGroup>

## Config hot reload

Gateway จะเฝ้าดู `~/.openclaw/openclaw.json` และใช้การเปลี่ยนแปลงโดยอัตโนมัติ — สำหรับการตั้งค่าส่วนใหญ่ไม่จำเป็นต้องรีสตาร์ตด้วยตนเอง

การแก้ไขไฟล์โดยตรงจะถูกถือว่าไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบความถูกต้อง ตัวเฝ้าดูจะรอ
ให้การแกว่งจากการเขียนไฟล์ชั่วคราว/การเปลี่ยนชื่อของตัวแก้ไขสงบลง อ่านไฟล์สุดท้าย แล้วปฏิเสธ
การแก้ไขภายนอกที่ไม่ถูกต้องโดยกู้คืนการกำหนดค่าที่ทำงานได้ล่าสุด การเขียน config ที่ OpenClaw เป็นเจ้าของ
จะใช้ schema gate เดียวกันก่อนเขียน; การเขียนทับแบบทำลายล้าง เช่น การทิ้ง `gateway.mode`
หรือทำให้ไฟล์เล็กลงเกินครึ่ง จะถูกปฏิเสธ
และบันทึกเป็น `.rejected.*` เพื่อตรวจสอบ

ความล้มเหลวในการตรวจสอบความถูกต้องเฉพาะของ Plugin เป็นข้อยกเว้น: หากปัญหาทั้งหมดอยู่ใต้
`plugins.entries.<id>...`, การ reload จะคง config ปัจจุบันไว้และรายงานปัญหาของ Plugin
แทนการกู้คืน `.last-good`

หากคุณเห็น `Config auto-restored from last-known-good` หรือ
`config reload restored last-known-good config` ใน log ให้ตรวจสอบไฟล์
`.clobbered.*` ที่ตรงกันข้าง `openclaw.json`, แก้ไข payload ที่ถูกปฏิเสธ แล้วรัน
`openclaw config validate` ดู [Gateway troubleshooting](/th/gateway/troubleshooting#gateway-restored-last-known-good-config)
สำหรับรายการตรวจสอบการกู้คืน

### โหมดการ reload

| โหมด                   | พฤติกรรม                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------- |
| **`hybrid`** (ค่าเริ่มต้น) | ใช้การเปลี่ยนแปลงที่ปลอดภัยแบบ hot ทันที และรีสตาร์ตอัตโนมัติสำหรับรายการสำคัญ       |
| **`hot`**              | ใช้เฉพาะการเปลี่ยนแปลงที่ปลอดภัยแบบ hot และบันทึกคำเตือนเมื่อจำเป็นต้องรีสตาร์ต — คุณจัดการเอง |
| **`restart`**          | รีสตาร์ต Gateway เมื่อมีการเปลี่ยนแปลง config ใด ๆ ไม่ว่าจะปลอดภัยหรือไม่               |
| **`off`**              | ปิดการเฝ้าดูไฟล์ การเปลี่ยนแปลงจะมีผลในการรีสตาร์ตด้วยตนเองครั้งถัดไป                    |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### สิ่งที่ใช้แบบ hot ได้เทียบกับสิ่งที่ต้องรีสตาร์ต

ฟิลด์ส่วนใหญ่ใช้ได้แบบ hot โดยไม่มีช่วงหยุดทำงาน ในโหมด `hybrid` การเปลี่ยนแปลงที่ต้องรีสตาร์ตจะถูกจัดการโดยอัตโนมัติ

| หมวดหมู่            | ฟิลด์                                                            | ต้องรีสตาร์ต? |
| ------------------- | ----------------------------------------------------------------- | ------------- |
| ช่องทาง            | `channels.*`, `web` (WhatsApp) — ทุกช่องทางในตัวและจาก Plugin      | ไม่             |
| Agent และโมเดล      | `agent`, `agents`, `models`, `routing`                            | ไม่             |
| ระบบอัตโนมัติ       | `hooks`, `cron`, `agent.heartbeat`                                | ไม่             |
| เซสชันและข้อความ    | `session`, `messages`                                             | ไม่             |
| เครื่องมือและสื่อ   | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | ไม่             |
| UI และอื่น ๆ         | `ui`, `logging`, `identity`, `bindings`                           | ไม่             |
| เซิร์ฟเวอร์ Gateway | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **ใช่**        |
| โครงสร้างพื้นฐาน    | `discovery`, `canvasHost`, `plugins`                              | **ใช่**        |

<Note>
`gateway.reload` และ `gateway.remote` เป็นข้อยกเว้น — การเปลี่ยนสองรายการนี้จะ **ไม่** ทำให้เกิดการรีสตาร์ต
</Note>

### การวางแผน reload

เมื่อคุณแก้ไขไฟล์ต้นทางที่ถูกอ้างอิงผ่าน `$include`, OpenClaw จะวางแผน
การ reload จากเลย์เอาต์ที่ผู้เขียนต้นทางกำหนด ไม่ใช่มุมมองในหน่วยความจำที่ถูก flatten แล้ว
วิธีนี้ทำให้การตัดสินใจ hot-reload (ใช้แบบ hot หรือรีสตาร์ต) คาดการณ์ได้ แม้เมื่อ
section ระดับบนสุดเพียงรายการเดียวอยู่ในไฟล์ include แยกของตัวเอง เช่น
`plugins: { $include: "./plugins.json5" }` การวางแผน reload จะ fail closed หาก
เลย์เอาต์ต้นทางกำกวม

## Config RPC (การอัปเดตแบบเป็นโปรแกรม)

สำหรับเครื่องมือที่เขียน config ผ่าน gateway API ให้เลือกใช้ flow นี้:

- `config.schema.lookup` เพื่อตรวจสอบ subtree หนึ่งจุด (schema node แบบตื้น + child
  summaries)
- `config.get` เพื่อดึง snapshot ปัจจุบันพร้อม `hash`
- `config.patch` สำหรับการอัปเดตบางส่วน (JSON merge patch: อ็อบเจ็กต์ merge, `null`
  ใช้ลบ, อาร์เรย์ใช้แทนที่)
- `config.apply` เฉพาะเมื่อคุณตั้งใจจะแทนที่ config ทั้งหมด
- `update.run` สำหรับการอัปเดตตัวเองแบบชัดเจนพร้อมรีสตาร์ต

<Note>
การเขียนใน control plane (`config.apply`, `config.patch`, `update.run`) ถูก
จำกัดอัตราไว้ที่ 3 คำขอต่อ 60 วินาทีต่อ `deviceId+clientIp`
คำขอรีสตาร์ตจะถูกรวมเข้าด้วยกัน แล้วบังคับช่วงคูลดาวน์ 30 วินาทีระหว่างรอบการรีสตาร์ต
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
`note` และ `restartDelayMs` ต้องระบุ `baseHash` สำหรับทั้งสองเมธอดเมื่อ
มี config อยู่แล้ว

## ตัวแปรสภาพแวดล้อม

OpenClaw จะอ่านตัวแปร env จากโปรเซสแม่ รวมถึง:

- `.env` จากไดเรกทอรีทำงานปัจจุบัน (ถ้ามี)
- `~/.openclaw/.env` (fallback แบบ global)

ทั้งสองไฟล์จะไม่เขียนทับตัวแปร env ที่มีอยู่แล้ว คุณยังสามารถตั้งค่าตัวแปร env แบบ inline ใน config ได้ด้วย:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="นำเข้า shell env (ไม่บังคับ)">
  หากเปิดใช้งานและยังไม่ได้ตั้งค่าคีย์ที่คาดหวัง OpenClaw จะรัน login shell ของคุณและนำเข้าเฉพาะคีย์ที่ขาดหาย:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

เทียบเท่าด้วย env var: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="การแทนที่ env var ในค่า config">
  อ้างอิง env var ในค่าสตริงของ config ใด ๆ ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

กฎ:

- จับคู่เฉพาะชื่อแบบตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- หากตัวแปรไม่มีอยู่หรือว่าง จะเกิดข้อผิดพลาดตอนโหลด
- escape ด้วย `$${VAR}` เพื่อให้ได้ผลลัพธ์แบบตัวอักษรตามจริง
- ใช้งานได้ภายในไฟล์ `$include`
- การแทนที่แบบ inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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

รายละเอียดของ SecretRef (รวมถึง `secrets.providers` สำหรับ `env`/`file`/`exec`) อยู่ใน [Secrets Management](/th/gateway/secrets)
พาธข้อมูลรับรองที่รองรับแสดงไว้ใน [SecretRef Credential Surface](/th/reference/secretref-credential-surface)
</Accordion>

ดู [Environment](/th/help/environment) สำหรับลำดับความสำคัญและแหล่งที่มาแบบเต็ม

## เอกสารอ้างอิงฉบับเต็ม

สำหรับเอกสารอ้างอิงแบบครบทุกฟิลด์ โปรดดู **[Configuration Reference](/th/gateway/configuration-reference)**

---

_ที่เกี่ยวข้อง: [Configuration Examples](/th/gateway/configuration-examples) · [Configuration Reference](/th/gateway/configuration-reference) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [Configuration reference](/th/gateway/configuration-reference)
- [Configuration examples](/th/gateway/configuration-examples)
- [Gateway runbook](/th/gateway)
