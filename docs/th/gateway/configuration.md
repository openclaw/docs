---
read_when:
    - การตั้งค่า OpenClaw เป็นครั้งแรก
    - กำลังค้นหารูปแบบการกำหนดค่าที่ใช้กันทั่วไป
    - การไปยังส่วนการกำหนดค่าที่ระบุ
summary: 'ภาพรวมการกำหนดค่า: งานทั่วไป การตั้งค่าอย่างรวดเร็ว และลิงก์ไปยังเอกสารอ้างอิงฉบับเต็ม'
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-07-16T19:06:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77f45ec71032ad6f651fcb68f9fb37f6677de90ec5ccca33ee84794056c58f89
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw อ่านการกำหนดค่า <Tooltip tip="JSON5 รองรับความคิดเห็นและเครื่องหมายจุลภาคต่อท้าย">**JSON5**</Tooltip> ที่ไม่บังคับจาก `~/.openclaw/openclaw.json` หากไม่มีไฟล์ดังกล่าว OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัย

พาธการกำหนดค่าที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ การเขียนโดย OpenClaw จะแทนที่ไฟล์แบบอะตอมมิก (เปลี่ยนชื่อทับพาธ) ดังนั้น `openclaw.json` ที่เป็นลิงก์สัญลักษณ์จะทำให้เป้าหมายถูกแทนที่แทนที่จะเขียนผ่านลิงก์ โปรดหลีกเลี่ยงโครงสร้างการกำหนดค่าที่ใช้ลิงก์สัญลักษณ์ หากเก็บการกำหนดค่าไว้นอกไดเรกทอรีสถานะเริ่มต้น ให้ชี้ `OPENCLAW_CONFIG_PATH` ไปยังไฟล์จริงโดยตรง

เหตุผลทั่วไปที่ควรเพิ่มการกำหนดค่า:

- เชื่อมต่อช่องทางและควบคุมว่าใครสามารถส่งข้อความถึงบอตได้
- กำหนดโมเดล เครื่องมือ แซนด์บ็อกซ์ หรือระบบอัตโนมัติ (cron, hooks)
- ปรับแต่งเซสชัน สื่อ เครือข่าย หรือ UI

ดูฟิลด์ทั้งหมดที่มีได้ใน[ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference)

เอเจนต์และระบบอัตโนมัติควรใช้ `config.schema.lookup` เพื่อดูเอกสารระดับฟิลด์อย่างแม่นยำ
ก่อนแก้ไขการกำหนดค่า ใช้หน้านี้สำหรับคำแนะนำที่เน้นงาน และใช้
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) สำหรับแผนผังฟิลด์
และค่าเริ่มต้นในภาพรวม

<Tip>
**เพิ่งเริ่มใช้การกำหนดค่าใช่ไหม** เริ่มด้วย `openclaw onboard` สำหรับการตั้งค่าแบบโต้ตอบ หรือดูคู่มือ[ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) เพื่อใช้การกำหนดค่าแบบสมบูรณ์ที่คัดลอกและวางได้
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
    openclaw onboard       # ขั้นตอนการเริ่มต้นใช้งานแบบเต็ม
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
  <Tab title="UI ควบคุม">
    เปิด [http://127.0.0.1:18789](http://127.0.0.1:18789) และใช้แท็บ **การกำหนดค่า**
    UI ควบคุมจะแสดงฟอร์มจากสคีมาการกำหนดค่าที่ใช้งานอยู่ ซึ่งรวมถึงข้อมูลเมตาของเอกสารฟิลด์
    `title` / `description` รวมถึงสคีมาของ Plugin และช่องทางเมื่อ
    มีให้ใช้งาน พร้อมตัวแก้ไข **JSON ดิบ** เป็นทางเลือกสำรอง สำหรับ UI
    แบบเจาะลึกและเครื่องมืออื่น Gateway ยังเปิดให้ใช้ `config.schema.lookup`
    เพื่อดึงโหนดสคีมาตามขอบเขตพาธหนึ่งรายการ พร้อมสรุปโหนดย่อยระดับถัดไป
  </Tab>
  <Tab title="แก้ไขโดยตรง">
    แก้ไข `~/.openclaw/openclaw.json` โดยตรง Gateway จะเฝ้าดูไฟล์และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ (ดู[การโหลดซ้ำแบบทันที](#config-hot-reload))
  </Tab>
</Tabs>

## การตรวจสอบความถูกต้องแบบเข้มงวด

<Warning>
OpenClaw ยอมรับเฉพาะการกำหนดค่าที่ตรงกับสคีมาอย่างสมบูรณ์เท่านั้น คีย์ที่ไม่รู้จัก ชนิดข้อมูลผิดรูปแบบ หรือค่าที่ไม่ถูกต้องจะทำให้ Gateway **ปฏิเสธการเริ่มทำงาน** ข้อยกเว้นระดับรากเพียงรายการเดียวคือ `$schema` (สตริง) เพื่อให้ตัวแก้ไขแนบข้อมูลเมตา JSON Schema ได้
</Warning>

`openclaw config schema` แสดง JSON Schema มาตรฐานที่ UI ควบคุม
และการตรวจสอบความถูกต้องใช้ ส่วน `config.schema.lookup` ดึงโหนดตามขอบเขตพาธหนึ่งรายการพร้อม
สรุปโหนดย่อยสำหรับเครื่องมือแบบเจาะลึก ข้อมูลเมตาของเอกสารฟิลด์ `title`/`description`
จะส่งต่อผ่านออบเจ็กต์ซ้อน ไวลด์การ์ด (`*`) รายการอาร์เรย์ (`[]`) และแขนง `anyOf`/
`oneOf`/`allOf` สคีมาของ Plugin และช่องทางขณะรันไทม์จะถูกรวมเข้ามาเมื่อโหลด
รีจิสทรีแมนิเฟสต์แล้ว

เมื่อการตรวจสอบความถูกต้องล้มเหลว:

- Gateway จะไม่เริ่มทำงาน
- ใช้งานได้เฉพาะคำสั่งวินิจฉัย (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- เรียกใช้ `openclaw doctor` เพื่อดูปัญหาอย่างละเอียด
- เรียกใช้ `openclaw doctor --fix` (`--repair` เป็นแฟล็กเดียวกัน ส่วน `--yes` จะข้ามข้อความถาม) เพื่อใช้การซ่อมแซม

Gateway จะเก็บสำเนาที่เชื่อถือได้และใช้งานได้ล่าสุดหลังจากเริ่มทำงานสำเร็จแต่ละครั้ง
แต่การเริ่มทำงานและการโหลดซ้ำแบบทันทีจะไม่คืนค่าสำเนานั้นโดยอัตโนมัติ มีเพียง `openclaw doctor --fix`
เท่านั้นที่ทำเช่นนั้น หาก `openclaw.json` ไม่ผ่านการตรวจสอบความถูกต้อง (รวมถึงการตรวจสอบภายใน Plugin) การเริ่มทำงานของ Gateway
จะล้มเหลว หรือข้ามการโหลดซ้ำ และรันไทม์ปัจจุบันจะใช้การกำหนดค่าที่ได้รับการยอมรับล่าสุดต่อไป
การเขียนที่ถูกปฏิเสธจะถูกบันทึกเป็น `<path>.rejected.<timestamp>` เพื่อให้ตรวจสอบด้วย
Gateway จะบล็อกการเขียนที่ดูเหมือนเขียนทับโดยไม่ตั้งใจ เช่น การทิ้ง `gateway.mode`
การสูญเสียบล็อก `meta` หรือการลดขนาดไฟล์ลงมากกว่าครึ่งหนึ่ง เว้นแต่การเขียนนั้น
จะอนุญาตการเปลี่ยนแปลงแบบทำลายข้อมูลอย่างชัดเจน ระบบจะข้ามการเลื่อนสถานะเป็นสำเนาที่ใช้งานได้ล่าสุดเมื่อ
ตัวเลือกมีตัวยึดตำแหน่งข้อมูลลับที่ถูกปกปิด เช่น `***` หรือ `[redacted]`

## งานทั่วไป

<AccordionGroup>
  <Accordion title="ตั้งค่าช่องทาง (WhatsApp, Telegram, Discord เป็นต้น)">
    แต่ละช่องทางมีส่วนการกำหนดค่าของตนเองภายใต้ `channels.<provider>` ดูขั้นตอนการตั้งค่าได้จากหน้าของช่องทางนั้นโดยเฉพาะ:

    - [Discord](/th/channels/discord) - `channels.discord`
    - [Feishu](/th/channels/feishu) - `channels.feishu`
    - [Google Chat](/th/channels/googlechat) - `channels.googlechat`
    - [iMessage](/th/channels/imessage) - `channels.imessage`
    - [Mattermost](/th/channels/mattermost) - `channels.mattermost`
    - [Microsoft Teams](/th/channels/msteams) - `channels.msteams`
    - [Signal](/th/channels/signal) - `channels.signal`
    - [Slack](/th/channels/slack) - `channels.slack`
    - [Telegram](/th/channels/telegram) - `channels.telegram`
    - [WhatsApp](/th/channels/whatsapp) - `channels.whatsapp`

    ทุกช่องทางใช้รูปแบบนโยบาย DM เดียวกัน:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // เฉพาะ allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="เลือกและกำหนดค่าโมเดล">
    กำหนดโมเดลหลักและโมเดลสำรองที่ไม่บังคับ:

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

    - `agents.defaults.models` กำหนดแค็ตตาล็อกโมเดลและทำหน้าที่เป็นรายการอนุญาตสำหรับ `/model`; รายการ `provider/*` จะกรอง `/model`, `/models` และตัวเลือกโมเดลให้เหลือเฉพาะผู้ให้บริการที่เลือก โดยยังคงใช้การค้นหาโมเดลแบบไดนามิก
    - ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการอนุญาตโดยไม่ลบโมเดลที่มีอยู่ การแทนที่แบบธรรมดาที่จะลบรายการจะถูกปฏิเสธ เว้นแต่จะส่ง `--replace`
    - การอ้างอิงโมเดลใช้รูปแบบ `provider/model` (เช่น `anthropic/claude-opus-4-6`)
    - `agents.defaults.imageMaxDimensionPx` ควบคุมการลดขนาดรูปภาพในทรานสคริปต์/เครื่องมือ (ค่าเริ่มต้น `1200`) โดยทั่วไปค่าที่ต่ำกว่าจะลดการใช้โทเค็นการมองเห็นในการทำงานที่มีภาพหน้าจอจำนวนมาก
    - ดู[CLI โมเดล](/th/concepts/models)สำหรับการสลับโมเดลในแชต และ[การสลับโมเดลเมื่อเกิดข้อขัดข้อง](/th/concepts/model-failover)สำหรับการหมุนเวียนการตรวจสอบสิทธิ์และพฤติกรรมสำรอง
    - สำหรับผู้ให้บริการแบบกำหนดเอง/โฮสต์เอง โปรดดู[ผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls)ในข้อมูลอ้างอิง

  </Accordion>

  <Accordion title="ควบคุมว่าใครสามารถส่งข้อความถึงบอตได้">
    การเข้าถึง DM ควบคุมแยกตามช่องทางผ่าน `dmPolicy` (ค่าเริ่มต้น `"pairing"`):

    - `"pairing"`: ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียวเพื่ออนุมัติ
    - `"allowlist"`: อนุญาตเฉพาะผู้ส่งใน `allowFrom` (หรือที่เก็บรายการอนุญาตจากการจับคู่)
    - `"open"`: อนุญาต DM ขาเข้าทั้งหมด (ต้องมี `allowFrom: ["*"]`)
    - `"disabled"`: ละเว้น DM ทั้งหมด

    สำหรับกลุ่ม ให้ใช้ `groupPolicy` (`"allowlist" | "open" | "disabled"`) ร่วมกับ `groupAllowFrom` หรือรายการอนุญาตเฉพาะช่องทาง

    ดูรายละเอียดแยกตามช่องทางใน[ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-channels#dm-and-group-access)

  </Accordion>

  <Accordion title="ตั้งค่าเงื่อนไขการกล่าวถึงในแชตกลุ่ม">
    โดยค่าเริ่มต้น ข้อความกลุ่มจะ **ต้องมีการกล่าวถึง** กำหนดรูปแบบทริกเกอร์แยกตามเอเจนต์ การตอบกลับกลุ่ม/ช่องทางตามปกติจะโพสต์โดยอัตโนมัติ สำหรับห้องที่ใช้ร่วมกันซึ่งเอเจนต์ควรตัดสินใจว่าจะพูดเมื่อใด ให้เลือกใช้เส้นทางเครื่องมือข้อความ:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // ตั้งเป็น "message_tool" เพื่อกำหนดให้ส่งผ่านเครื่องมือข้อความทุกแห่ง
        groupChat: {
          visibleReplies: "message_tool", // เลือกใช้; เอาต์พุตที่มองเห็นได้ต้องใช้ message(action=send)
          unmentionedInbound: "room_event", // การสนทนากลุ่มที่เปิดตลอดและไม่ได้กล่าวถึงจะเป็นบริบทแบบเงียบ
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

    - **การกล่าวถึงผ่านข้อมูลเมตา**: การ @-กล่าวถึงแบบเนทีฟ (แตะเพื่อกล่าวถึงใน WhatsApp, @bot ใน Telegram เป็นต้น)
    - **รูปแบบข้อความ**: รูปแบบนิพจน์ทั่วไปที่ปลอดภัยใน `mentionPatterns`
    - **การตอบกลับที่มองเห็นได้**: `messages.visibleReplies` สามารถกำหนดให้ส่งผ่านเครื่องมือข้อความทั่วทั้งระบบ ส่วน `messages.groupChat.visibleReplies` จะแทนที่ค่านั้นสำหรับกลุ่ม/ช่องทาง
    - ดูโหมดการตอบกลับที่มองเห็นได้ การแทนค่ารายช่องทาง และโหมดแชตกับตนเองใน[ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-channels#group-chat-mention-gating)

  </Accordion>

  <Accordion title="จำกัด Skills แยกตามเอเจนต์">
    ใช้ `agents.defaults.skills` เป็นค่าพื้นฐานร่วม จากนั้นแทนค่าของเอเจนต์
    ที่ต้องการด้วย `agents.list[].skills`:

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

    - ละ `agents.defaults.skills` ไว้เพื่อไม่จำกัด Skills โดยค่าเริ่มต้น
    - ละ `agents.list[].skills` ไว้เพื่อสืบทอดค่าเริ่มต้น
    - ตั้ง `agents.list[].skills: []` เพื่อไม่ใช้ Skills
    - ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config) และ
      [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agents-defaults-skills)

  </Accordion>

  <Accordion title="ปรับแต่งการตรวจติดตามสถานะช่องทางของ Gateway">
    ควบคุมระดับความเข้มงวดที่ Gateway ใช้เริ่มช่องทางใหม่เมื่อช่องทางดูไม่มีการตอบสนอง:

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

    - ค่าที่แสดงเป็นค่าเริ่มต้น ตั้ง `gateway.channelHealthCheckMinutes: 0` เพื่อปิดใช้งานการเริ่มใหม่โดยตัวตรวจติดตามสถานะทั่วทั้งระบบ
    - `channelStaleEventThresholdMinutes` ควรมากกว่าหรือเท่ากับช่วงเวลาการตรวจสอบ
    - ใช้ `channels.<provider>.healthMonitor.enabled` หรือ `channels.<provider>.accounts.<id>.healthMonitor.enabled` เพื่อปิดการเริ่มใหม่อัตโนมัติสำหรับช่องทางหรือบัญชีหนึ่งรายการ โดยไม่ปิดตัวตรวจติดตามส่วนกลาง
    - ดู[การตรวจสอบสถานะ](/th/gateway/health)สำหรับการแก้ไขข้อบกพร่องด้านการปฏิบัติการ และดูฟิลด์ทั้งหมดใน[ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#gateway)

  </Accordion>

  <Accordion title="ปรับแต่งระยะหมดเวลาการจับมือ WebSocket ของ Gateway">
    เพิ่มเวลาให้ไคลเอนต์ภายในเครื่องดำเนินการจับมือ WebSocket ก่อนการตรวจสอบสิทธิ์ให้เสร็จสิ้นบน
    โฮสต์ที่มีภาระงานสูงหรือใช้พลังประมวลผลต่ำ:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - ค่าเริ่มต้นคือ `15000` มิลลิวินาที
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ยังคงมีลำดับความสำคัญเหนือกว่าสำหรับการเขียนทับเฉพาะครั้งของบริการหรือเชลล์
    - ควรแก้ไขการหยุดชะงักของการเริ่มต้นระบบ/ลูปเหตุการณ์ก่อน การตั้งค่านี้มีไว้สำหรับโฮสต์ที่ทำงานปกติแต่ช้าในระหว่างการอุ่นเครื่อง

  </Accordion>

  <Accordion title="กำหนดค่าเซสชันและการรีเซ็ต">
    เซสชันควบคุมความต่อเนื่องและการแยกกันของการสนทนา:

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
    - `threadBindings`: ค่าเริ่มต้นส่วนกลางสำหรับการกำหนดเส้นทางเซสชันที่ผูกกับเธรด `/focus`, `/unfocus`, `/agents`, `/session idle` และ `/session max-age` ใช้ผูก เลิกผูก แสดงรายการ และปรับแต่งค่านี้แยกตามเซสชัน (Discord ผูกเธรด ส่วน Telegram ผูกหัวข้อ/การสนทนา)
    - ดูขอบเขต ลิงก์ข้อมูลประจำตัว และนโยบายการส่งได้ที่ [การจัดการเซสชัน](/th/concepts/session)
    - ดูฟิลด์ทั้งหมดได้ที่ [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-agents#session)

  </Accordion>

  <Accordion title="เปิดใช้แซนด์บ็อกซ์">
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

    สร้างอิมเมจก่อน โดยเรียกใช้ `scripts/sandbox-setup.sh` จากเช็กเอาต์ซอร์ส หรือหากติดตั้งจาก npm ให้ดูคำสั่ง `docker build` ที่อยู่ในเนื้อหาของ [แซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup)

    ดูคู่มือฉบับเต็มได้ที่ [แซนด์บ็อกซ์](/th/gateway/sandboxing) และดูตัวเลือกทั้งหมดได้ที่ [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="เปิดใช้การพุชผ่านรีเลย์สำหรับบิลด์ iOS อย่างเป็นทางการ">
    การพุชผ่านรีเลย์สำหรับบิลด์ App Store สาธารณะใช้รีเลย์ OpenClaw ที่โฮสต์ไว้: `https://ios-push-relay.openclaw.ai`

    การปรับใช้รีเลย์แบบกำหนดเองต้องใช้เส้นทางการบิลด์/ปรับใช้ iOS ที่แยกออกมาโดยตั้งใจ ซึ่ง URL ของรีเลย์ตรงกับ URL รีเลย์ของ Gateway หากใช้บิลด์รีเลย์แบบกำหนดเอง ให้ตั้งค่านี้ในการกำหนดค่า Gateway:

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

    การตั้งค่านี้ทำสิ่งต่อไปนี้:

    - ช่วยให้ Gateway ส่ง `push.test` สัญญาณกระตุ้นให้ปลุก และสัญญาณปลุกให้เชื่อมต่อใหม่ผ่านรีเลย์ภายนอกได้
    - ใช้สิทธิ์อนุญาตการส่งที่จำกัดขอบเขตตามการลงทะเบียน ซึ่งแอป iOS ที่จับคู่ไว้ส่งต่อให้ Gateway จึงไม่จำเป็นต้องมีโทเค็นรีเลย์ที่ใช้ทั่วทั้งการปรับใช้
    - ผูกการลงทะเบียนผ่านรีเลย์แต่ละรายการกับข้อมูลประจำตัวของ Gateway ที่แอป iOS จับคู่ไว้ เพื่อไม่ให้ Gateway อื่นนำการลงทะเบียนที่จัดเก็บไว้ไปใช้ซ้ำได้
    - ทำให้บิลด์ iOS แบบภายในเครื่อง/แบบกำหนดเองยังคงใช้ APNs โดยตรง การส่งผ่านรีเลย์ใช้เฉพาะกับบิลด์ที่เผยแพร่อย่างเป็นทางการและลงทะเบียนผ่านรีเลย์เท่านั้น
    - ต้องตรงกับ URL ฐานของรีเลย์ที่ฝังอยู่ในบิลด์ iOS เพื่อให้ทราฟฟิกการลงทะเบียนและการส่งไปถึงการปรับใช้รีเลย์เดียวกัน

    ลำดับการทำงานตั้งแต่ต้นจนจบ:

    1. ติดตั้งแอป iOS อย่างเป็นทางการ
    2. ไม่บังคับ: กำหนดค่า `gateway.push.apns.relay.baseUrl` บน Gateway เฉพาะเมื่อใช้บิลด์รีเลย์แบบกำหนดเองที่แยกออกมาโดยตั้งใจเท่านั้น
    3. จับคู่แอป iOS กับ Gateway และอนุญาตให้ทั้งเซสชัน Node และเซสชันผู้ดำเนินการเชื่อมต่อ
    4. แอป iOS ดึงข้อมูลประจำตัวของ Gateway ลงทะเบียนกับรีเลย์โดยใช้ App Attest ร่วมกับใบเสร็จของแอป จากนั้นเผยแพร่เพย์โหลด `push.apns.register` ผ่านรีเลย์ไปยัง Gateway ที่จับคู่ไว้
    5. Gateway จัดเก็บแฮนเดิลรีเลย์และสิทธิ์อนุญาตการส่ง แล้วใช้ข้อมูลเหล่านี้สำหรับ `push.test` สัญญาณกระตุ้นให้ปลุก และสัญญาณปลุกให้เชื่อมต่อใหม่

    หมายเหตุด้านการดำเนินงาน:

    - หากสลับแอป iOS ไปยัง Gateway อื่น ให้เชื่อมต่อแอปใหม่เพื่อให้แอปเผยแพร่การลงทะเบียนรีเลย์ใหม่ที่ผูกกับ Gateway นั้นได้
    - หากเผยแพร่บิลด์ iOS ใหม่ที่ชี้ไปยังการปรับใช้รีเลย์อื่น แอปจะรีเฟรชการลงทะเบียนรีเลย์ที่แคชไว้แทนการใช้ต้นทางรีเลย์เดิมซ้ำ

    หมายเหตุด้านความเข้ากันได้:

    - `OPENCLAW_APNS_RELAY_BASE_URL` และ `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ยังคงใช้เป็นการเขียนทับชั่วคราวผ่านตัวแปรสภาพแวดล้อมได้
    - URL รีเลย์แบบกำหนดเองของ Gateway ต้องตรงกับ URL ฐานของรีเลย์ที่ฝังอยู่ในบิลด์ iOS โดยช่องทางเผยแพร่ App Store สาธารณะจะปฏิเสธการเขียนทับ URL รีเลย์ iOS แบบกำหนดเอง
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` ยังคงเป็นทางเลี่ยงสำหรับการพัฒนาที่ใช้ได้เฉพาะลูปแบ็กเท่านั้น ห้ามบันทึก URL รีเลย์ HTTP ไว้ในการกำหนดค่า

    ดูลำดับการทำงานตั้งแต่ต้นจนจบได้ที่ [แอป iOS](/th/platforms/ios#relay-backed-push-for-official-builds) และดูโมเดลความปลอดภัยของรีเลย์ได้ที่ [ลำดับการยืนยันตัวตนและความเชื่อถือ](/th/platforms/ios#authentication-and-trust-flow)

  </Accordion>

  <Accordion title="ตั้งค่า Heartbeat (การรายงานสถานะเป็นระยะ)">
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

    - `every`: สตริงระยะเวลา (`30m`, `2h`) ตั้งค่าเป็น `0m` เพื่อปิดใช้ ค่าเริ่มต้น: `30m`
    - `target`: `last` | `none` | `<channel-id>` (เช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`)
    - `directPolicy`: `allow` (ค่าเริ่มต้น) หรือ `block` สำหรับเป้าหมาย Heartbeat แบบ DM
    - ดูคู่มือฉบับเต็มได้ที่ [Heartbeat](/th/gateway/heartbeat)

  </Accordion>

  <Accordion title="กำหนดค่างาน Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // ค่าเริ่มต้น; การส่งงาน Cron + การดำเนินการรอบเอเจนต์ Cron แบบแยก
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: ล้างเซสชันการเรียกใช้แบบแยกที่เสร็จสิ้นแล้วออกจากแถวเซสชัน SQLite (ค่าเริ่มต้น `24h`; ตั้งค่าเป็น `false` เพื่อปิดใช้)
    - ประวัติการเรียกใช้จะเก็บแถวสถานะสิ้นสุดล่าสุด 2000 แถวต่องานโดยอัตโนมัติ ส่วนแถวที่สูญหายยังคงมีช่วงเวลาล้างข้อมูล 24 ชั่วโมง
    - ดูภาพรวมคุณสมบัติและตัวอย่าง CLI ได้ที่ [งาน Cron](/th/automation/cron-jobs)

  </Accordion>

  <Accordion title="ตั้งค่า Webhook (ฮุก)">
    เปิดใช้ปลายทาง Webhook HTTP บน Gateway:

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
    - ให้ถือว่าเนื้อหาเพย์โหลดของฮุก/Webhook ทั้งหมดเป็นอินพุตที่ไม่น่าเชื่อถือ
    - ใช้ `hooks.token` แยกเฉพาะ ห้ามใช้ข้อมูลลับสำหรับการยืนยันตัวตนของ Gateway ที่กำลังใช้งานอยู่ซ้ำ (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`)
    - การยืนยันตัวตนของฮุกรองรับเฉพาะส่วนหัว (`Authorization: Bearer ...` หรือ `x-openclaw-token`) โดยโทเค็นในสตริงคำค้นหาจะถูกปฏิเสธ
    - `hooks.path` ต้องไม่เป็น `/`; ให้เก็บทางเข้าของ Webhook ไว้ในพาธย่อยเฉพาะ เช่น `/hooks`
    - ปิดใช้แฟล็กข้ามการตรวจสอบเนื้อหาที่ไม่ปลอดภัย (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) เว้นแต่กำลังแก้ไขข้อบกพร่องภายในขอบเขตที่จำกัดอย่างเข้มงวด
    - หากเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วยเพื่อจำกัดขอบเขตคีย์เซสชันที่ผู้เรียกเลือก
    - สำหรับเอเจนต์ที่ขับเคลื่อนด้วยฮุก ควรใช้ระดับโมเดลสมัยใหม่ที่มีประสิทธิภาพสูงและนโยบายเครื่องมือที่เข้มงวด (เช่น อนุญาตเฉพาะการรับส่งข้อความร่วมกับแซนด์บ็อกซ์เมื่อทำได้)

    ดูตัวเลือกการแมปทั้งหมดและการผสานรวม Gmail ได้ที่ [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#hooks)

  </Accordion>

  <Accordion title="กำหนดค่าการกำหนดเส้นทางแบบหลายเอเจนต์">
    เรียกใช้เอเจนต์ที่แยกจากกันหลายตัวพร้อมพื้นที่ทำงานและเซสชันแยกกัน:

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

    ดูกฎการผูกและโปรไฟล์การเข้าถึงแยกตามเอเจนต์ได้ที่ [หลายเอเจนต์](/th/concepts/multi-agent) และ [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-agents#multi-agent-routing)

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

    - **ไฟล์เดียว**: แทนที่ออบเจ็กต์ที่ครอบอยู่
    - **อาร์เรย์ของไฟล์**: ผสานแบบลึกตามลำดับ (รายการหลังมีผลเหนือกว่า) โดยซ้อนได้ลึกสูงสุด 10 ระดับ
    - **คีย์ระดับเดียวกัน**: ผสานหลังการรวมไฟล์ (เขียนทับค่าที่รวมเข้ามา)
    - **พาธสัมพัทธ์**: แก้พาธโดยอ้างอิงจากไฟล์ที่รวม
    - **รูปแบบพาธ**: พาธที่รวมต้องไม่มีไบต์ null และต้องสั้นกว่า 4096 อักขระอย่างเคร่งครัดทั้งก่อนและหลังการแก้พาธ
    - **การเขียนที่ OpenClaw เป็นเจ้าของ**: เมื่อการเขียนเปลี่ยนแปลงเพียงส่วนระดับบนสุดหนึ่งส่วน
      ซึ่งรองรับด้วยการรวมไฟล์เดียว เช่น `plugins: { $include: "./plugins.json5" }`
      OpenClaw จะอัปเดตไฟล์ที่รวมดังกล่าวและคง `openclaw.json` ไว้เหมือนเดิม
    - **การเขียนผ่านที่ไม่รองรับ**: การรวมที่ราก อาร์เรย์การรวม และการรวม
      ที่มีการเขียนทับด้วยคีย์ระดับเดียวกันจะปฏิเสธการเขียนที่ OpenClaw เป็นเจ้าของโดยค่าเริ่มต้น
      แทนการทำให้การกำหนดค่าเป็นไฟล์เดียวแบบแบน
    - **การจำกัดขอบเขต**: พาธ `$include` ต้องแก้พาธให้อยู่ภายใต้ไดเรกทอรีที่เก็บ
      `openclaw.json` หากต้องการใช้โครงสร้างไดเรกทอรีร่วมกันระหว่างเครื่องหรือผู้ใช้ ให้ตั้งค่า
      `OPENCLAW_INCLUDE_ROOTS` เป็นรายการพาธ (`:` บน POSIX, `;` บน Windows) ของ
      ไดเรกทอรีเพิ่มเติมที่การรวมสามารถอ้างอิงได้ ระบบจะแก้ symlink
      และตรวจสอบอีกครั้ง ดังนั้นพาธที่ตามตัวอักษรอยู่ในไดเรกทอรีการกำหนดค่า แต่
      เป้าหมายจริงหลุดออกจากรากที่อนุญาตทั้งหมดจะยังคงถูกปฏิเสธ
    - **การจัดการข้อผิดพลาด**: แสดงข้อผิดพลาดที่ชัดเจนสำหรับไฟล์ที่หายไป ข้อผิดพลาดในการแยกวิเคราะห์ การรวมแบบวนซ้ำ รูปแบบพาธไม่ถูกต้อง และความยาวเกินกำหนด

  </Accordion>
</AccordionGroup>

## การโหลดการกำหนดค่าใหม่แบบทันที

Gateway เฝ้าดู `~/.openclaw/openclaw.json` และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ โดยการตั้งค่าส่วนใหญ่ไม่จำเป็นต้องรีสตาร์ตด้วยตนเอง

การแก้ไขไฟล์โดยตรงจะถือว่าไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบ ตัวเฝ้าดูจะรอ
ให้การเขียนไฟล์ชั่วคราว/การเปลี่ยนชื่อจากโปรแกรมแก้ไขสงบลง อ่านไฟล์ฉบับสุดท้าย และปฏิเสธ
การแก้ไขภายนอกที่ไม่ถูกต้องโดยไม่เขียน `openclaw.json` ใหม่ การเขียนการกำหนดค่า
ที่ OpenClaw เป็นเจ้าของจะใช้เกตสคีมาเดียวกันก่อนเขียน (ดูกฎการเขียนทับ/ย้อนกลับ
ที่ใช้กับทุกการเขียนได้ที่ [การตรวจสอบอย่างเข้มงวด](#strict-validation))

หากพบ `config reload skipped (invalid config)` หรือเมื่อเริ่มต้นระบบมีรายงาน `Invalid
config` ให้ตรวจสอบการกำหนดค่า เรียกใช้ `openclaw config validate` แล้วเรียกใช้ `openclaw
doctor --fix` เพื่อซ่อมแซม ดูรายการตรวจสอบได้ที่ [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config)

### โหมดการโหลดใหม่

| โหมด                   | ลักษณะการทำงาน                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (ค่าเริ่มต้น) | ใช้การเปลี่ยนแปลงที่ปลอดภัยแบบ hot-apply ทันที และรีสตาร์ตโดยอัตโนมัติสำหรับการเปลี่ยนแปลงที่สำคัญ           |
| **`hot`**              | ใช้เฉพาะการเปลี่ยนแปลงที่ปลอดภัยแบบ hot-apply และบันทึกคำเตือนเมื่อต้องรีสตาร์ต โดยคุณต้องดำเนินการเอง |
| **`restart`**          | รีสตาร์ต Gateway เมื่อมีการเปลี่ยนแปลงการกำหนดค่า ไม่ว่าจะปลอดภัยหรือไม่                                 |
| **`off`**              | ปิดใช้งานการเฝ้าดูไฟล์ การเปลี่ยนแปลงจะมีผลเมื่อรีสตาร์ตด้วยตนเองครั้งถัดไป                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### สิ่งที่ใช้แบบ hot-apply ได้เทียบกับสิ่งที่ต้องรีสตาร์ต

ฟิลด์ส่วนใหญ่ใช้แบบ hot-apply ได้โดยไม่มีช่วงหยุดทำงาน ส่วนบางเซ็กชันที่ใช้แบบ hot-apply จะรีสตาร์ตเฉพาะ
ระบบย่อยนั้น (ช่องทาง, cron, heartbeat, ตัวตรวจสอบสถานะ) แทนที่จะรีสตาร์ต Gateway ทั้งหมด ใน
โหมด `hybrid` ระบบจะจัดการการเปลี่ยนแปลงที่ต้องรีสตาร์ต Gateway โดยอัตโนมัติ

| หมวดหมู่            | ฟิลด์                                                                  | ต้องรีสตาร์ต Gateway หรือไม่      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| ช่องทาง            | `channels.*`, `web` (WhatsApp) - ช่องทางในตัวและช่องทาง Plugin ทั้งหมด       | ไม่ (รีสตาร์ตช่องทางนั้น)   |
| เอเจนต์และโมเดล      | `agent`, `agents`, `models`, `routing`                                  | ไม่                           |
| ระบบอัตโนมัติ          | `hooks`, `cron`, `agent.heartbeat`                                      | ไม่ (รีสตาร์ตระบบย่อยนั้น) |
| เซสชันและข้อความ | `session`, `messages`                                                   | ไม่                           |
| เครื่องมือและสื่อ       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | ไม่                           |
| การกำหนดค่า Plugin       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | ไม่ (โหลดรันไทม์ของ Plugin ใหม่)  |
| UI และอื่นๆ           | `ui`, `logging`, `identity`, `bindings`                                 | ไม่                           |
| เซิร์ฟเวอร์ Gateway      | `gateway.*` (พอร์ต, การผูกที่อยู่, การยืนยันตัวตน, tailscale, TLS, HTTP, พุช)              | **ใช่**                      |
| โครงสร้างพื้นฐาน      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **ใช่**                      |

<Note>
`gateway.reload` และ `gateway.remote` เป็นข้อยกเว้นภายใต้ `gateway.*` การเปลี่ยนแปลงรายการเหล่านี้จะ **ไม่** ทำให้เกิดการรีสตาร์ต แต่ละ Plugin ยังสามารถแทนที่ตารางนี้ได้ด้วย โดย Plugin ที่โหลดแล้วอาจประกาศคำนำหน้าการกำหนดค่าที่ทำให้เกิดการรีสตาร์ตของตนเอง (ตัวอย่างเช่น Plugin Canvas ที่รวมมาให้จะรีสตาร์ต Gateway สำหรับ `plugins.enabled`, `plugins.allow` และ `plugins.deny` ไม่ใช่เฉพาะ `plugins.entries.canvas` ของตนเอง) ดังนั้นลักษณะการทำงานจริงจึงขึ้นอยู่กับ Plugin ที่กำลังใช้งาน
</Note>

### การวางแผนโหลดใหม่

เมื่อคุณแก้ไขไฟล์ต้นฉบับที่อ้างอิงผ่าน `$include` OpenClaw จะวางแผน
การโหลดใหม่จากเค้าโครงที่เขียนไว้ในต้นฉบับ ไม่ใช่มุมมองในหน่วยความจำที่ถูกทำให้แบนราบ
วิธีนี้ช่วยให้การตัดสินใจเกี่ยวกับ hot-reload (ใช้แบบ hot-apply หรือรีสตาร์ต) คาดการณ์ได้ แม้ว่า
เซ็กชันระดับบนสุดเพียงเซ็กชันเดียวจะอยู่ในไฟล์ที่รวมแยกต่างหาก เช่น
`plugins: { $include: "./plugins.json5" }` การวางแผนโหลดใหม่จะปฏิเสธการดำเนินการเพื่อความปลอดภัย หาก
เค้าโครงต้นฉบับมีความกำกวม

## RPC สำหรับการกำหนดค่า (การอัปเดตด้วยโปรแกรม)

สำหรับเครื่องมือที่เขียนการกำหนดค่าผ่าน API ของ Gateway ควรใช้ลำดับการทำงานนี้:

- `config.schema.lookup` เพื่อตรวจสอบซับทรีหนึ่งรายการ (โหนดสคีมาแบบตื้นพร้อมข้อมูลสรุป
  ของโหนดย่อย)
- `config.get` เพื่อดึงสแนปช็อตปัจจุบันพร้อม `hash`
- `config.patch` สำหรับการอัปเดตบางส่วน (แพตช์ผสาน JSON: ออบเจ็กต์จะผสานกัน, `null`
  จะลบ, อาร์เรย์จะถูกแทนที่เมื่อยืนยันอย่างชัดเจนด้วย `replacePaths` หาก
  มีรายการที่จะถูกนำออก)
- `config.apply` เฉพาะเมื่อคุณตั้งใจจะแทนที่การกำหนดค่าทั้งหมด
- `update.run` สำหรับการอัปเดตตัวเองพร้อมรีสตาร์ตอย่างชัดเจน ให้ใส่ `continuationMessage` เมื่อเซสชันหลังรีสตาร์ตควรทำงานต่ออีกหนึ่งรอบ
- `update.status` เพื่อตรวจสอบตัวบ่งชี้การรีสตาร์ตจากการอัปเดตล่าสุด และยืนยันเวอร์ชันที่กำลังทำงานหลังรีสตาร์ต

เอเจนต์ควรใช้ `config.schema.lookup` เป็นจุดแรกสำหรับเอกสารและข้อจำกัดที่แม่นยำ
ในระดับฟิลด์ ใช้ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
เมื่อต้องการแผนผังการกำหนดค่าที่กว้างขึ้น ค่าเริ่มต้น หรือลิงก์ไปยังข้อมูลอ้างอิง
ของระบบย่อยโดยเฉพาะ

<Note>
การเขียนผ่านระนาบควบคุม (`config.apply`, `config.patch`, `update.run`)
ถูกจำกัดอัตราไว้ที่ 3 คำขอต่อ 60 วินาทีต่อ `deviceId+clientIp` คำขอ
รีสตาร์ตจะถูกรวมเข้าด้วยกัน จากนั้นบังคับช่วงพัก 30 วินาทีระหว่างรอบการรีสตาร์ต
`update.status` เป็นแบบอ่านอย่างเดียวแต่จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ เนื่องจากตัวบ่งชี้การรีสตาร์ตอาจ
มีข้อมูลสรุปขั้นตอนการอัปเดตและส่วนท้ายของเอาต์พุตคำสั่ง
</Note>

ตัวอย่างแพตช์บางส่วน:

```bash
openclaw gateway call config.get --params '{}'  # เก็บค่า payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

ทั้ง `config.apply` และ `config.patch` รองรับ `raw`, `baseHash`, `sessionKey`,
`note` และ `restartDelayMs` ต้องระบุ `baseHash` สำหรับทั้งสองเมธอดเมื่อมี
ไฟล์การกำหนดค่าอยู่แล้ว (การเขียนครั้งแรกเมื่อยังไม่มีการกำหนดค่าจะข้ามการตรวจสอบนี้)

`config.patch` ยังรองรับ `replacePaths` ซึ่งเป็นอาร์เรย์ของพาธการกำหนดค่าที่ตั้งใจ
ให้แทนที่อาร์เรย์ หากแพตช์จะแทนที่หรือลบอาร์เรย์ที่มีอยู่
ด้วยจำนวนรายการที่น้อยลง Gateway จะปฏิเสธการเขียน เว้นแต่พาธนั้นโดยตรงจะปรากฏ
ใน `replacePaths` ส่วนอาร์เรย์ที่ซ้อนอยู่ภายใต้รายการอาร์เรย์ให้ใช้ `[]` เช่น
`agents.list[].skills` วิธีนี้ป้องกันไม่ให้สแนปช็อต `config.get` ที่ถูกตัดทอน
เขียนทับอาร์เรย์การกำหนดเส้นทางหรือรายการอนุญาตโดยไม่มีการแจ้งเตือน ใช้ `config.apply` เมื่อคุณ
ตั้งใจจะแทนที่การกำหนดค่าทั้งหมด

## ตัวแปรสภาพแวดล้อม

OpenClaw อ่านตัวแปรสภาพแวดล้อมจากโพรเซสแม่ รวมถึง:

- `.env` จากไดเรกทอรีการทำงานปัจจุบัน (หากมี)
- `~/.openclaw/.env` (ตัวสำรองส่วนกลาง)

ทั้งสองไฟล์จะไม่แทนที่ตัวแปรสภาพแวดล้อมที่มีอยู่ คุณยังสามารถกำหนดตัวแปรสภาพแวดล้อมแบบอินไลน์ในการกำหนดค่าได้:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="การนำเข้าสภาพแวดล้อมของเชลล์ (ไม่บังคับ)">
  หากเปิดใช้งานและยังไม่ได้กำหนดคีย์ที่คาดไว้ OpenClaw จะเรียกใช้เชลล์สำหรับเข้าสู่ระบบของคุณและนำเข้าเฉพาะคีย์ที่ขาดหายไป:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

ตัวแปรสภาพแวดล้อมที่เทียบเท่า: `OPENCLAW_LOAD_SHELL_ENV=1` ค่าเริ่มต้น `timeoutMs`: `15000`
</Accordion>

<Accordion title="การแทนค่าตัวแปรสภาพแวดล้อมในค่าการกำหนดค่า">
  อ้างอิงตัวแปรสภาพแวดล้อมในค่าสตริงการกำหนดค่าใดๆ ด้วย `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

กฎ:

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่ไม่มีหรือว่างเปล่าจะทำให้เกิดข้อผิดพลาดขณะโหลด
- เอสเคปด้วย `$${VAR}` เพื่อให้ได้เอาต์พุตตามตัวอักษร
- ใช้งานได้ภายในไฟล์ `$include`
- การแทนค่าแบบอินไลน์: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="การอ้างอิงข้อมูลลับ (ตัวแปรสภาพแวดล้อม, ไฟล์, การเรียกใช้)">
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

รายละเอียดของ SecretRef (รวมถึง `secrets.providers` สำหรับ `env`/`file`/`exec`) อยู่ใน [การจัดการข้อมูลลับ](/th/gateway/secrets)
พาธข้อมูลประจำตัวที่รองรับแสดงอยู่ใน [พื้นผิวข้อมูลประจำตัวของ SecretRef](/th/reference/secretref-credential-surface)
</Accordion>

ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญและแหล่งที่มาทั้งหมด

## ข้อมูลอ้างอิงฉบับเต็ม

สำหรับข้อมูลอ้างอิงที่ครบถ้วนในระดับแต่ละฟิลด์ โปรดดู **[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)**

---

_ที่เกี่ยวข้อง: [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
