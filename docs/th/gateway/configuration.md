---
read_when:
    - การตั้งค่า OpenClaw เป็นครั้งแรก
    - กำลังมองหารูปแบบการกำหนดค่าที่ใช้กันทั่วไป
    - การไปยังส่วนการกำหนดค่าที่ระบุ
summary: 'ภาพรวมการกำหนดค่า: งานทั่วไป การตั้งค่าอย่างรวดเร็ว และลิงก์ไปยังเอกสารอ้างอิงฉบับเต็ม'
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-07-19T07:11:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0fa0f0cd54052ebb3a2aa4cd5600d7bdcb65a0a499a07d7e62496ee23464afdd
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw อ่านการกำหนดค่า <Tooltip tip="JSON5 รองรับความคิดเห็นและเครื่องหมายจุลภาคท้ายรายการ">**JSON5**</Tooltip> แบบไม่บังคับจาก `~/.openclaw/openclaw.json` หากไม่มีไฟล์ดังกล่าว OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัย

พาธการกำหนดค่าที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ การเขียนที่ OpenClaw เป็นเจ้าของจะแทนที่ไฟล์แบบอะตอมมิก (เปลี่ยนชื่อไปยังพาธนั้น) ดังนั้น `openclaw.json` ที่เป็นลิงก์สัญลักษณ์จะทำให้เป้าหมายถูกแทนที่แทนที่จะเขียนผ่านลิงก์ จึงควรหลีกเลี่ยงโครงสร้างการกำหนดค่าที่ใช้ลิงก์สัญลักษณ์ หากเก็บการกำหนดค่าไว้นอกไดเรกทอรีสถานะเริ่มต้น ให้ตั้ง `OPENCLAW_CONFIG_PATH` ให้ชี้ไปยังไฟล์จริงโดยตรง

เหตุผลทั่วไปที่ควรเพิ่มการกำหนดค่า:

- เชื่อมต่อช่องทางและควบคุมว่าใครสามารถส่งข้อความถึงบอตได้
- ตั้งค่าโมเดล เครื่องมือ แซนด์บ็อกซ์ หรือระบบอัตโนมัติ (cron, hooks)
- ปรับแต่งเซสชัน สื่อ เครือข่าย หรือ UI

ดูฟิลด์ที่ใช้ได้ทั้งหมดใน[ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference)

เอเจนต์และระบบอัตโนมัติควรใช้ `config.schema.lookup` เพื่อดูเอกสารระดับฟิลด์ที่แม่นยำ
ก่อนแก้ไขการกำหนดค่า ใช้หน้านี้สำหรับคำแนะนำตามงาน และดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) สำหรับแผนผังฟิลด์และ
ค่าเริ่มต้นในภาพรวม

<Tip>
**เพิ่งเริ่มใช้การกำหนดค่าใช่หรือไม่** เริ่มด้วย `openclaw onboard` สำหรับการตั้งค่าแบบโต้ตอบ หรือดูคู่มือ[ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) สำหรับการกำหนดค่าฉบับสมบูรณ์ที่คัดลอกและวางได้
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
    openclaw onboard       # ขั้นตอนการเริ่มต้นใช้งานทั้งหมด
    openclaw configure     # ตัวช่วยการกำหนดค่า
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
    UI ควบคุมจะแสดงผลแบบฟอร์มจากสคีมาการกำหนดค่าที่ใช้งานอยู่ รวมถึงข้อมูลเมตาเอกสาร
    `title` / `description` ของฟิลด์ ตลอดจนสคีมาของ Plugin และช่องทางเมื่อ
    พร้อมใช้งาน โดยมีตัวแก้ไข **JSON ดิบ** เป็นทางเลือกสำรอง สำหรับ UI
    แบบเจาะลึกและเครื่องมืออื่น Gateway ยังเปิดให้ใช้ `config.schema.lookup` เพื่อ
    ดึงโหนดสคีมาหนึ่งรายการตามขอบเขตพาธ พร้อมข้อมูลสรุปของโหนดย่อยระดับถัดไป
  </Tab>
  <Tab title="แก้ไขโดยตรง">
    แก้ไข `~/.openclaw/openclaw.json` โดยตรง Gateway จะเฝ้าดูไฟล์และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ (ดู[การโหลดซ้ำแบบทันที](#config-hot-reload))
  </Tab>
</Tabs>

## การตรวจสอบความถูกต้องอย่างเข้มงวด

<Warning>
OpenClaw ยอมรับเฉพาะการกำหนดค่าที่ตรงกับสคีมาอย่างสมบูรณ์เท่านั้น คีย์ที่ไม่รู้จัก ชนิดข้อมูลที่ผิดรูปแบบ หรือค่าที่ไม่ถูกต้องจะทำให้ Gateway **ปฏิเสธการเริ่มทำงาน** ข้อยกเว้นเดียวในระดับรากคือ `$schema` (สตริง) เพื่อให้ตัวแก้ไขสามารถแนบข้อมูลเมตา JSON Schema ได้
</Warning>

`openclaw config schema` แสดง JSON Schema มาตรฐานที่ UI ควบคุม
และการตรวจสอบความถูกต้องใช้ ส่วน `config.schema.lookup` จะดึงโหนดหนึ่งรายการตามขอบเขตพาธพร้อม
ข้อมูลสรุปของโหนดย่อยสำหรับเครื่องมือแบบเจาะลึก ข้อมูลเมตาเอกสาร `title`/`description` ของฟิลด์
จะถูกส่งต่อผ่านออบเจ็กต์ซ้อน อักขระตัวแทน (`*`) รายการอาร์เรย์ (`[]`) และสาขา `anyOf`/
`oneOf`/`allOf` สคีมาของ Plugin และช่องทางขณะรันไทม์จะถูกรวมเข้ามาเมื่อ
โหลดรีจิสทรีแมนิเฟสต์แล้ว

เมื่อการตรวจสอบความถูกต้องล้มเหลว:

- Gateway จะไม่เริ่มทำงาน
- มีเพียงคำสั่งวินิจฉัยเท่านั้นที่ใช้งานได้ (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- เรียกใช้ `openclaw doctor` เพื่อดูปัญหาที่แน่นอน
- เรียกใช้ `openclaw doctor --fix` (`--repair` เป็นแฟล็กเดียวกัน ส่วน `--yes` จะข้ามข้อความแจ้ง) เพื่อใช้การซ่อมแซม

Gateway จะเก็บสำเนาที่เชื่อถือได้ซึ่งทำงานได้ดีครั้งล่าสุดไว้หลังจากเริ่มทำงานสำเร็จแต่ละครั้ง
แต่การเริ่มทำงานและการโหลดซ้ำแบบทันทีจะไม่คืนค่าสำเนานี้โดยอัตโนมัติ มีเพียง `openclaw doctor --fix`
เท่านั้นที่ทำเช่นนั้น หาก `openclaw.json` ไม่ผ่านการตรวจสอบความถูกต้อง (รวมถึงการตรวจสอบภายใน Plugin) การเริ่มทำงานของ Gateway
จะล้มเหลว หรือการโหลดซ้ำจะถูกข้าม และรันไทม์ปัจจุบันจะใช้การกำหนดค่าล่าสุดที่ยอมรับต่อไป
การเขียนที่ถูกปฏิเสธจะถูกบันทึกเป็น `<path>.rejected.<timestamp>` เพื่อตรวจสอบด้วย
Gateway จะบล็อกการเขียนที่ดูเหมือนการเขียนทับโดยไม่ตั้งใจ เช่น การลบ `gateway.mode`
การทำบล็อก `meta` สูญหาย หรือการลดขนาดไฟล์ลงมากกว่าครึ่งหนึ่ง เว้นแต่การเขียนนั้น
จะอนุญาตการเปลี่ยนแปลงแบบทำลายข้อมูลไว้อย่างชัดเจน ระบบจะข้ามการเลื่อนเป็นสำเนาที่ทำงานได้ดีครั้งล่าสุดเมื่อ
รายการที่เสนอมีตัวยึดตำแหน่งข้อมูลลับที่ปกปิดแล้ว เช่น `***` หรือ `[redacted]`

## งานทั่วไป

<AccordionGroup>
  <Accordion title="ตั้งค่าช่องทาง (WhatsApp, Telegram, Discord ฯลฯ)">
    แต่ละช่องทางมีส่วนการกำหนดค่าของตนเองภายใต้ `channels.<provider>` ดูขั้นตอนการตั้งค่าในหน้าของช่องทางนั้นโดยเฉพาะ:

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
          allowFrom: ["tg:123"], // สำหรับ allowlist/open เท่านั้น
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="เลือกและกำหนดค่าโมเดล">
    ตั้งค่าโมเดลหลักและโมเดลสำรองที่ไม่บังคับ:

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

    - `agents.defaults.models` จัดเก็บนามแฝงและการตั้งค่ารายโมเดล การเพิ่มรายการจะไม่จำกัดการแทนที่ `/model` หรือ `--model`
    - `agents.defaults.modelPolicy.allow` คือรายการอนุญาตแบบชัดเจนสำหรับการแทนที่และตัวเลือกโมเดล โดยยอมรับการอ้างอิงที่ตรงทั้งหมดและอักขระตัวแทน `provider/*` ให้ละเว้นหรือใช้ `[]` เพื่ออนุญาตทุกโมเดล
    - การอ้างอิงโมเดลใช้รูปแบบ `provider/model` (เช่น `anthropic/claude-opus-4-6`)
    - `agents.defaults.imageMaxDimensionPx` ควบคุมการลดขนาดรูปภาพในทรานสคริปต์/เครื่องมือ (ค่าเริ่มต้น `1200`) โดยทั่วไปค่าที่ต่ำกว่าจะลดการใช้โทเค็นภาพในการทำงานที่มีภาพหน้าจอจำนวนมาก
    - ดู [CLI โมเดล](/th/concepts/models) สำหรับการสลับโมเดลในแชต และ[การสลับโมเดลเมื่อขัดข้อง](/th/concepts/model-failover) สำหรับการหมุนเวียนการยืนยันตัวตนและพฤติกรรมการใช้โมเดลสำรอง
    - สำหรับผู้ให้บริการแบบกำหนดเอง/โฮสต์เอง โปรดดู[ผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls) ในข้อมูลอ้างอิง

  </Accordion>

  <Accordion title="ควบคุมว่าใครสามารถส่งข้อความถึงบอตได้">
    การเข้าถึง DM ถูกควบคุมแยกตามช่องทางผ่าน `dmPolicy` (ค่าเริ่มต้น `"pairing"`):

    - `"pairing"`: ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียวเพื่ออนุมัติ
    - `"allowlist"`: เฉพาะผู้ส่งใน `allowFrom` (หรือพื้นที่จัดเก็บรายการอนุญาตที่จับคู่แล้ว)
    - `"open"`: อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)
    - `"disabled"`: ไม่สนใจ DM ทั้งหมด

    สำหรับกลุ่ม ให้ใช้ `groupPolicy` (`"allowlist" | "open" | "disabled"`) ร่วมกับ `groupAllowFrom` หรือรายการอนุญาตเฉพาะช่องทาง

    ดูรายละเอียดแยกตามช่องทางใน[ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-channels#dm-and-group-access)

  </Accordion>

  <Accordion title="ตั้งค่าการบังคับใช้การกล่าวถึงในแชตกลุ่ม">
    โดยค่าเริ่มต้น ข้อความกลุ่มจะ **ต้องมีการกล่าวถึง** กำหนดค่ารูปแบบทริกเกอร์แยกตามเอเจนต์ การตอบกลับในกลุ่ม/ช่องทางตามปกติจะถูกโพสต์โดยอัตโนมัติ สำหรับห้องที่ใช้ร่วมกันซึ่งเอเจนต์ควรตัดสินใจว่าจะพูดเมื่อใด ให้เลือกใช้เส้นทางเครื่องมือส่งข้อความ:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // ตั้งเป็น "message_tool" เพื่อบังคับให้ส่งผ่านเครื่องมือส่งข้อความทุกแห่ง
        groupChat: {
          visibleReplies: "message_tool", // เลือกใช้; เอาต์พุตที่มองเห็นได้ต้องใช้ message(action=send)
          unmentionedInbound: "room_event", // การสนทนากลุ่มที่เปิดตลอดเวลาและไม่ได้กล่าวถึงจะเป็นบริบทแบบเงียบ
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

    - **การกล่าวถึงผ่านข้อมูลเมตา**: การกล่าวถึงแบบ @ ดั้งเดิม (การแตะเพื่อกล่าวถึงใน WhatsApp, @bot ใน Telegram ฯลฯ)
    - **รูปแบบข้อความ**: รูปแบบนิพจน์ทั่วไปที่ปลอดภัยใน `mentionPatterns`
    - **การตอบกลับที่มองเห็นได้**: `messages.visibleReplies` สามารถบังคับให้ส่งผ่านเครื่องมือส่งข้อความทั่วทั้งระบบ ส่วน `messages.groupChat.visibleReplies` จะแทนที่ค่านั้นสำหรับกลุ่ม/ช่องทาง
    - ดู[ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-channels#group-chat-mention-gating) สำหรับโหมดการตอบกลับที่มองเห็นได้ การแทนที่แยกตามช่องทาง และโหมดแชตกับตนเอง

  </Accordion>

  <Accordion title="จำกัด Skills แยกตามเอเจนต์">
    ใช้ `agents.defaults.skills` เป็นค่าพื้นฐานที่ใช้ร่วมกัน แล้วแทนที่สำหรับ
    เอเจนต์เฉพาะด้วย `agents.list[].skills`:

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

    - ละเว้น `agents.defaults.skills` เพื่อไม่จำกัด Skills โดยค่าเริ่มต้น
    - ละเว้น `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
    - ตั้งค่า `agents.list[].skills: []` เพื่อไม่ใช้ Skills
    - ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config) และ
      [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agents-defaults-skills)

  </Accordion>

  <Accordion title="ปรับแต่งการตรวจสอบสถานะช่องทางของ Gateway">
    ควบคุมระดับความเข้มงวดที่ Gateway ใช้เริ่มช่องทางใหม่เมื่อดูเหมือนว่าไม่มีความเคลื่อนไหว:

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

    - ค่าที่แสดงคือค่าเริ่มต้น ตั้งค่า `gateway.channelHealthCheckMinutes: 0` เพื่อปิดใช้งานการเริ่มใหม่โดยตัวตรวจสอบสถานะทั่วทั้งระบบ
    - `channelStaleEventThresholdMinutes` ควรมากกว่าหรือเท่ากับช่วงเวลาการตรวจสอบ
    - ใช้ `channels.<provider>.healthMonitor.enabled` หรือ `channels.<provider>.accounts.<id>.healthMonitor.enabled` เพื่อปิดใช้งานการเริ่มใหม่อัตโนมัติสำหรับช่องทางหรือบัญชีหนึ่งรายการ โดยไม่ปิดใช้งานตัวตรวจสอบทั่วทั้งระบบ
    - ดู [การตรวจสอบสถานะ](/th/gateway/health) สำหรับการแก้ไขข้อบกพร่องด้านการปฏิบัติงาน และ[ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#gateway) สำหรับฟิลด์ทั้งหมด

  </Accordion>

  <Accordion title="ปรับแต่งระยะหมดเวลาการจับมือ WebSocket ของ Gateway">
    ให้เวลาไคลเอนต์ภายในเครื่องมากขึ้นเพื่อทำการจับมือ WebSocket ก่อนการยืนยันตัวตนให้เสร็จสมบูรณ์บน
    โฮสต์ที่มีภาระงานสูงหรือกำลังประมวลผลต่ำ:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - ค่าเริ่มต้นคือ `15000` มิลลิวินาที
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ยังคงมีลำดับความสำคัญเหนือกว่าสำหรับการแทนที่เฉพาะครั้งของบริการหรือเชลล์
    - ควรแก้ไขการค้างระหว่างเริ่มต้นหรือในลูปเหตุการณ์ก่อน การตั้งค่านี้มีไว้สำหรับโฮสต์ที่ทำงานเป็นปกติแต่ช้าในช่วงวอร์มอัป

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
    - `threadBindings`: ค่าเริ่มต้นส่วนกลางสำหรับการกำหนดเส้นทางเซสชันที่ผูกกับเธรด `/focus`, `/unfocus`, `/agents`, `/session idle` และ `/session max-age` ใช้ผูก ยกเลิกการผูก แสดงรายการ และปรับแต่งค่าต่อเซสชัน (Discord ผูกเธรด ส่วน Telegram ผูกหัวข้อ/การสนทนา)
    - ดู [การจัดการเซสชัน](/th/concepts/session) สำหรับขอบเขต ลิงก์ข้อมูลประจำตัว และนโยบายการส่ง
    - ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#session) สำหรับฟิลด์ทั้งหมด

  </Accordion>

  <Accordion title="เปิดใช้แซนด์บ็อกซ์">
    เรียกใช้เซสชันเอเจนต์ในรันไทม์แซนด์บ็อกซ์ที่แยกจากกัน:

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

    สร้างอิมเมจก่อน โดยเรียกใช้ `scripts/sandbox-setup.sh` จากซอร์สเช็กเอาต์ หรือหากติดตั้งจาก npm ให้ดูคำสั่ง `docker build` แบบอินไลน์ใน [แซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup)

    ดูคู่มือฉบับเต็มที่ [แซนด์บ็อกซ์](/th/gateway/sandboxing) และตัวเลือกทั้งหมดที่ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="เปิดใช้การพุชผ่านรีเลย์สำหรับบิลด์ iOS อย่างเป็นทางการ">
    การพุชผ่านรีเลย์สำหรับบิลด์ App Store สาธารณะใช้รีเลย์ OpenClaw ที่โฮสต์ไว้: `https://ios-push-relay.openclaw.ai`

    การติดตั้งใช้งานรีเลย์แบบกำหนดเองต้องใช้เส้นทางการบิลด์/ติดตั้งใช้งาน iOS ที่แยกไว้อย่างชัดเจน โดย URL ของรีเลย์ต้องตรงกับ URL รีเลย์ของ Gateway หากกำลังใช้บิลด์รีเลย์แบบกำหนดเอง ให้ตั้งค่านี้ในการกำหนดค่า Gateway:

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

    การตั้งค่านี้ทำให้:

    - Gateway สามารถส่ง `push.test` การสะกิดให้ตื่น และการปลุกเพื่อเชื่อมต่อใหม่ผ่านรีเลย์ภายนอก
    - ใช้สิทธิ์อนุญาตส่งที่มีขอบเขตตามการลงทะเบียน ซึ่งแอป iOS ที่จับคู่ไว้ส่งต่อมา Gateway ไม่จำเป็นต้องใช้โทเค็นรีเลย์ที่ใช้ร่วมกันทั้งการติดตั้งใช้งาน
    - ผูกการลงทะเบียนผ่านรีเลย์แต่ละรายการกับข้อมูลประจำตัวของ Gateway ที่แอป iOS จับคู่ไว้ เพื่อไม่ให้ Gateway อื่นนำการลงทะเบียนที่จัดเก็บไว้ไปใช้ซ้ำ
    - ให้บิลด์ iOS ภายในเครื่อง/แบบดำเนินการเองใช้ APNs โดยตรงต่อไป การส่งผ่านรีเลย์ใช้เฉพาะกับบิลด์ที่เผยแพร่อย่างเป็นทางการและลงทะเบียนผ่านรีเลย์เท่านั้น
    - ต้องตรงกับ URL ฐานของรีเลย์ที่ฝังอยู่ในบิลด์ iOS เพื่อให้ทราฟฟิกการลงทะเบียนและการส่งไปถึงการติดตั้งใช้งานรีเลย์เดียวกัน

    ลำดับการทำงานตั้งแต่ต้นจนจบ:

    1. ติดตั้งแอป iOS อย่างเป็นทางการ
    2. ไม่บังคับ: กำหนดค่า `gateway.push.apns.relay.baseUrl` บน Gateway เฉพาะเมื่อใช้บิลด์รีเลย์แบบกำหนดเองที่แยกไว้อย่างชัดเจน
    3. จับคู่แอป iOS กับ Gateway และอนุญาตให้ทั้งเซสชัน Node และเซสชันผู้ดำเนินการเชื่อมต่อ
    4. แอป iOS ดึงข้อมูลประจำตัวของ Gateway ลงทะเบียนกับรีเลย์โดยใช้ App Attest พร้อมใบเสร็จของแอป จากนั้นเผยแพร่เพย์โหลด `push.apns.register` ที่ทำงานผ่านรีเลย์ไปยัง Gateway ที่จับคู่ไว้
    5. Gateway จัดเก็บแฮนเดิลรีเลย์และสิทธิ์อนุญาตส่ง จากนั้นใช้รายการเหล่านี้สำหรับ `push.test` การสะกิดให้ตื่น และการปลุกเพื่อเชื่อมต่อใหม่

    หมายเหตุด้านการปฏิบัติงาน:

    - หากเปลี่ยนแอป iOS ไปใช้ Gateway อื่น ให้เชื่อมต่อแอปใหม่เพื่อให้เผยแพร่การลงทะเบียนรีเลย์รายการใหม่ที่ผูกกับ Gateway นั้น
    - หากเผยแพร่บิลด์ iOS ใหม่ที่ชี้ไปยังการติดตั้งใช้งานรีเลย์อื่น แอปจะรีเฟรชการลงทะเบียนรีเลย์ที่แคชไว้แทนการใช้ต้นทางรีเลย์เดิมซ้ำ

    หมายเหตุด้านความเข้ากันได้:

    - `OPENCLAW_APNS_RELAY_BASE_URL` และ `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ยังคงใช้เป็นการแทนที่ชั่วคราวผ่านตัวแปรสภาพแวดล้อมได้
    - URL รีเลย์ของ Gateway แบบกำหนดเองต้องตรงกับ URL ฐานของรีเลย์ที่ฝังอยู่ในบิลด์ iOS ส่วนช่องทางเผยแพร่ App Store สาธารณะจะปฏิเสธการแทนที่ URL รีเลย์ iOS แบบกำหนดเอง
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` ยังคงเป็นทางเลี่ยงสำหรับการพัฒนาที่จำกัดเฉพาะลูปแบ็ก ห้ามบันทึก URL รีเลย์ HTTP ไว้ในการกำหนดค่า

    ดูลำดับการทำงานตั้งแต่ต้นจนจบที่ [แอป iOS](/th/platforms/ios#relay-backed-push-for-official-builds) และโมเดลความปลอดภัยของรีเลย์ที่ [ลำดับการยืนยันตัวตนและความเชื่อถือ](/th/platforms/ios#authentication-and-trust-flow)

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

    - `every`: สตริงระยะเวลา (`30m`, `2h`) ตั้งค่าเป็น `0m` เพื่อปิดใช้ ค่าเริ่มต้น: `30m`
    - `target`: `last` | `none` | `<channel-id>` (ตัวอย่างเช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`)
    - `directPolicy`: `allow` (ค่าเริ่มต้น) หรือ `block` สำหรับเป้าหมาย Heartbeat แบบ DM
    - ดูคู่มือฉบับเต็มที่ [Heartbeat](/th/gateway/heartbeat)

  </Accordion>

  <Accordion title="กำหนดค่างาน Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // ค่าเริ่มต้น การส่งงาน Cron + การดำเนินการรอบเอเจนต์ Cron แบบแยก
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: ล้างเซสชันการเรียกใช้แบบแยกที่เสร็จสิ้นแล้วออกจากแถวเซสชัน SQLite (ค่าเริ่มต้น `24h`; ตั้งค่าเป็น `false` เพื่อปิดใช้)
    - ประวัติการเรียกใช้จะเก็บแถวปลายทางล่าสุด 2000 แถวต่องานโดยอัตโนมัติ ส่วนแถวที่สูญหายยังคงใช้ช่วงเวลาล้างข้อมูล 24 ชั่วโมง
    - ดูภาพรวมฟีเจอร์และตัวอย่าง CLI ที่ [งาน Cron](/th/automation/cron-jobs)

  </Accordion>

  <Accordion title="ตั้งค่า Webhook (ฮุก)">
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
    - ให้ถือว่าเนื้อหาเพย์โหลดของฮุก/Webhook ทั้งหมดเป็นอินพุตที่ไม่น่าเชื่อถือ
    - ใช้ `hooks.token` เฉพาะ ห้ามใช้ข้อมูลลับสำหรับการยืนยันตัวตนของ Gateway ที่ใช้งานอยู่ซ้ำ (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`)
    - การยืนยันตัวตนของฮุกรองรับเฉพาะส่วนหัว (`Authorization: Bearer ...` หรือ `x-openclaw-token`) โดยโทเค็นในสตริงคิวรีจะถูกปฏิเสธ
    - `hooks.path` ต้องไม่เป็น `/` ให้คงจุดรับ Webhook ไว้ที่พาธย่อยเฉพาะ เช่น `/hooks`
    - ปิดแฟล็กข้ามการตรวจสอบเนื้อหาที่ไม่ปลอดภัยไว้ (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) เว้นแต่กำลังดีบักในขอบเขตที่จำกัดอย่างเคร่งครัด
    - หากเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วยเพื่อจำกัดขอบเขตคีย์เซสชันที่ผู้เรียกเลือก
    - สำหรับเอเจนต์ที่ขับเคลื่อนด้วยฮุก ควรใช้ระดับโมเดลสมัยใหม่ที่มีประสิทธิภาพสูงและนโยบายเครื่องมือที่เข้มงวด (ตัวอย่างเช่น จำกัดเฉพาะการรับส่งข้อความร่วมกับแซนด์บ็อกซ์เมื่อทำได้)

    ดูตัวเลือกการแมปทั้งหมดและการผสานรวม Gmail ที่ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#hooks)

  </Accordion>

  <Accordion title="กำหนดค่าการกำหนดเส้นทางหลายเอเจนต์">
    เรียกใช้เอเจนต์ที่แยกจากกันหลายตัวโดยมีพื้นที่ทำงานและเซสชันแยกกัน:

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

  <Accordion title="แบ่งการกำหนดค่าเป็นหลายไฟล์ ($include)">
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
    - **อาร์เรย์ของไฟล์**: ผสานแบบลึกตามลำดับ (รายการหลังมีผลเหนือกว่า) ซ้อนได้ลึกสูงสุด 10 ระดับ
    - **คีย์ระดับเดียวกัน**: ผสานหลังการรวมไฟล์ (แทนที่ค่าที่รวมเข้ามา)
    - **พาธสัมพัทธ์**: แก้พาธโดยอ้างอิงจากไฟล์ที่รวมไฟล์อื่น
    - **รูปแบบพาธ**: พาธสำหรับรวมไฟล์ต้องไม่มีไบต์ null และต้องสั้นกว่า 4096 อักขระอย่างเคร่งครัดทั้งก่อนและหลังการแก้พาธ
    - **การเขียนที่ OpenClaw เป็นเจ้าของ**: เมื่อการเขียนเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วน
      ซึ่งรองรับด้วยการรวมไฟล์เดียว เช่น `plugins: { $include: "./plugins.json5" }`
      OpenClaw จะอัปเดตไฟล์ที่รวมเข้ามานั้นและคง `openclaw.json` ไว้โดยไม่เปลี่ยนแปลง
    - **ไม่รองรับการเขียนทะลุ**: การรวมไฟล์ที่ราก อาร์เรย์การรวมไฟล์ และการรวมไฟล์
      ที่มีค่าระดับเดียวกันแทนที่ จะปฏิเสธการเขียนที่ OpenClaw เป็นเจ้าของอย่างปลอดภัย
      แทนการทำให้การกำหนดค่าแบนราบ
    - **การจำกัดขอบเขต**: พาธ `$include` ต้องแก้แล้วอยู่ภายใต้ไดเรกทอรีที่มี
      `openclaw.json` หากต้องการใช้โครงสร้างไดเรกทอรีร่วมกันระหว่างเครื่องหรือผู้ใช้ ให้ตั้งค่า
      `OPENCLAW_INCLUDE_ROOTS` เป็นรายการพาธ (`:` บน POSIX, `;` บน Windows) ของ
      ไดเรกทอรีเพิ่มเติมที่การรวมไฟล์สามารถอ้างอิงได้ ระบบจะแก้และตรวจสอบซิมลิงก์อีกครั้ง
      ดังนั้นพาธที่ตามข้อความดูเหมือนอยู่ในไดเรกทอรีการกำหนดค่า แต่เป้าหมายจริง
      หลุดออกจากรากที่อนุญาตทั้งหมดจะยังคงถูกปฏิเสธ
    - **การจัดการข้อผิดพลาด**: แสดงข้อผิดพลาดที่ชัดเจนสำหรับไฟล์ที่หายไป ข้อผิดพลาดในการแยกวิเคราะห์ การรวมไฟล์แบบวนซ้ำ รูปแบบพาธไม่ถูกต้อง และความยาวเกินกำหนด

  </Accordion>
</AccordionGroup>

## การโหลดการกำหนดค่าใหม่แบบทันที

Gateway เฝ้าดู `~/.openclaw/openclaw.json` และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ โดยการตั้งค่าส่วนใหญ่ไม่จำเป็นต้องรีสตาร์ตด้วยตนเอง

การแก้ไขไฟล์โดยตรงจะถือว่าไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบความถูกต้อง ตัวเฝ้าดูจะรอ
ให้ความเปลี่ยนแปลงจากการเขียนไฟล์ชั่วคราว/เปลี่ยนชื่อของตัวแก้ไขสงบลง อ่านไฟล์สุดท้าย และปฏิเสธ
การแก้ไขภายนอกที่ไม่ถูกต้องโดยไม่เขียน `openclaw.json` ใหม่ การเขียนการกำหนดค่าที่
OpenClaw เป็นเจ้าของใช้เกตสคีมาเดียวกันก่อนเขียน (ดูกฎการเขียนทับ/ย้อนกลับที่ใช้กับทุกการเขียน
ใน [การตรวจสอบความถูกต้องอย่างเข้มงวด](#strict-validation))

หากพบ `config reload skipped (invalid config)` หรือการเริ่มต้นระบบรายงาน `Invalid
config` ให้ตรวจสอบการกำหนดค่า เรียกใช้ `openclaw config validate` แล้วเรียกใช้ `openclaw
doctor --fix` เพื่อซ่อมแซม ดูรายการตรวจสอบที่ [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config)

### โหมดการโหลดใหม่

| โหมด                   | ลักษณะการทำงาน                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (ค่าเริ่มต้น) | ใช้การเปลี่ยนแปลงที่ปลอดภัยแบบ hot-apply ทันที และรีสตาร์ตโดยอัตโนมัติสำหรับการเปลี่ยนแปลงที่สำคัญ           |
| **`hot`**              | ใช้เฉพาะการเปลี่ยนแปลงที่ปลอดภัยแบบ hot-apply และบันทึกคำเตือนเมื่อต้องรีสตาร์ต โดยต้องดำเนินการเอง |
| **`restart`**          | รีสตาร์ต Gateway เมื่อมีการเปลี่ยนแปลงการกำหนดค่าใดๆ ไม่ว่าจะปลอดภัยหรือไม่                                 |
| **`off`**              | ปิดการเฝ้าดูไฟล์ การเปลี่ยนแปลงจะมีผลเมื่อรีสตาร์ตด้วยตนเองครั้งถัดไป                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### สิ่งที่ใช้แบบ hot-apply ได้เทียบกับสิ่งที่ต้องรีสตาร์ต

ฟิลด์ส่วนใหญ่ใช้แบบ hot-apply ได้โดยไม่มีช่วงหยุดทำงาน ส่วนบางเซกชันที่ใช้แบบ hot-apply จะรีสตาร์ตเฉพาะ
ระบบย่อยนั้น (ช่องทาง, cron, heartbeat, ตัวตรวจสอบสถานะ) แทนที่จะรีสตาร์ต Gateway ทั้งหมด ใน
โหมด `hybrid` ระบบจะจัดการการเปลี่ยนแปลงที่ต้องรีสตาร์ต Gateway โดยอัตโนมัติ

| หมวดหมู่            | ฟิลด์                                                                  | ต้องรีสตาร์ต Gateway หรือไม่      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| ช่องทาง            | `channels.*`, `web` (WhatsApp) - ช่องทางในตัวและช่องทางจาก plugin ทั้งหมด       | ไม่ (รีสตาร์ตช่องทางนั้น)   |
| เอเจนต์และโมเดล      | `agent`, `agents`, `models`, `routing`                                  | ไม่                           |
| ระบบอัตโนมัติ          | `hooks`, `cron`, `agent.heartbeat`                                      | ไม่ (รีสตาร์ตระบบย่อยนั้น) |
| เซสชันและข้อความ | `session`, `messages`                                                   | ไม่                           |
| เครื่องมือและสื่อ       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | ไม่                           |
| การกำหนดค่า Plugin       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | ไม่ (โหลดรันไทม์ของ plugin ใหม่)  |
| UI และเบ็ดเตล็ด           | `ui`, `logging`, `identity`, `bindings`                                 | ไม่                           |
| เซิร์ฟเวอร์ Gateway      | `gateway.*` (พอร์ต, การผูก, การยืนยันตัวตน, tailscale, TLS, HTTP, push)              | **ใช่**                      |
| โครงสร้างพื้นฐาน      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **ใช่**                      |

<Note>
`gateway.reload` และ `gateway.remote` เป็นข้อยกเว้นภายใต้ `gateway.*` โดยการเปลี่ยนแปลงฟิลด์เหล่านี้จะ **ไม่** ทำให้เกิดการรีสตาร์ต แต่ละ plugin ยังสามารถแทนที่ตารางนี้ได้ด้วย โดย plugin ที่โหลดอยู่สามารถประกาศคำนำหน้าการกำหนดค่าที่ทำให้ต้องรีสตาร์ตของตนเองได้ (ตัวอย่างเช่น Canvas plugin ที่ให้มาพร้อมระบบจะรีสตาร์ต Gateway สำหรับ `plugins.enabled`, `plugins.allow` และ `plugins.deny` ไม่ใช่เฉพาะ `plugins.entries.canvas` ของตนเอง) ดังนั้นลักษณะการทำงานจริงจึงขึ้นอยู่กับ plugin ที่กำลังใช้งาน
</Note>

### การวางแผนโหลดใหม่

เมื่อแก้ไขไฟล์ต้นฉบับที่อ้างอิงผ่าน `$include` OpenClaw จะวางแผน
การโหลดใหม่จากเลย์เอาต์ที่เขียนไว้ในต้นฉบับ ไม่ใช่มุมมองในหน่วยความจำที่ถูกทำให้แบน
วิธีนี้ทำให้การตัดสินใจโหลดใหม่แบบ hot (ใช้แบบ hot-apply เทียบกับรีสตาร์ต) คาดการณ์ได้ แม้ว่า
เซกชันระดับบนสุดหนึ่งเซกชันจะอยู่ในไฟล์ที่รวมเข้ามาแยกต่างหาก เช่น
`plugins: { $include: "./plugins.json5" }` การวางแผนโหลดใหม่จะล้มเหลวแบบปิดเพื่อความปลอดภัย หาก
เลย์เอาต์ต้นฉบับมีความกำกวม

## RPC การกำหนดค่า (การอัปเดตด้วยโปรแกรม)

สำหรับเครื่องมือที่เขียนการกำหนดค่าผ่าน API ของ Gateway ให้ใช้ขั้นตอนนี้เป็นหลัก:

- `config.schema.lookup` เพื่อตรวจสอบซับทรีหนึ่งรายการ (โหนดสคีมาแบบตื้น + ข้อมูลสรุป
  ของโหนดย่อย)
- `config.get` เพื่อดึงสแนปช็อตปัจจุบันพร้อม `hash`
- `config.patch` สำหรับการอัปเดตบางส่วน (แพตช์แบบผสาน JSON: ออบเจ็กต์จะผสานกัน, `null`
  จะลบ, อาร์เรย์จะถูกแทนที่เมื่อยืนยันอย่างชัดเจนด้วย `replacePaths` หาก
  จะมีรายการถูกนำออก)
- `config.apply` เฉพาะเมื่อตั้งใจแทนที่การกำหนดค่าทั้งหมด
- `update.run` สำหรับการอัปเดตตัวเองพร้อมรีสตาร์ตอย่างชัดเจน โดยใส่ `continuationMessage` เมื่อเซสชันหลังรีสตาร์ตควรดำเนินการต่ออีกหนึ่งรอบ
- `update.status` เพื่อตรวจสอบตัวบ่งชี้การรีสตาร์ตจากการอัปเดตล่าสุด และยืนยันเวอร์ชันที่กำลังทำงานหลังรีสตาร์ต

เอเจนต์ควรใช้ `config.schema.lookup` เป็นจุดแรกสำหรับเอกสารและข้อจำกัด
ระดับฟิลด์ที่แม่นยำ ใช้ [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
เมื่อต้องการแผนผังการกำหนดค่าที่กว้างขึ้น ค่าเริ่มต้น หรือลิงก์ไปยังเอกสารอ้างอิง
ของระบบย่อยโดยเฉพาะ

<Note>
การเขียนผ่านระนาบควบคุม (`config.apply`, `config.patch`, `update.run`) ถูก
จำกัดอัตราไว้ที่ 30 คำขอต่อ 60 วินาที ต่อเมธอด ต่อ
`deviceId+clientIp`; ดู[การจำกัดอัตรา](/gateway/security/rate-limiting) คำขอรีสตาร์ต
จะถูกรวมเข้าด้วยกัน จากนั้นบังคับใช้ช่วงพัก 30 วินาทีระหว่างรอบการรีสตาร์ต
`update.status` เป็นแบบอ่านอย่างเดียวแต่จำกัดขอบเขตไว้สำหรับผู้ดูแลระบบ เนื่องจากตัวบ่งชี้การรีสตาร์ตสามารถ
มีข้อมูลสรุปขั้นตอนการอัปเดตและส่วนท้ายของเอาต์พุตคำสั่ง
</Note>

ตัวอย่างแพตช์บางส่วน:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

ทั้ง `config.apply` และ `config.patch` รองรับ `raw`, `baseHash`, `sessionKey`,
`note` และ `restartDelayMs` ทั้งสองเมธอดต้องมี `baseHash` เมื่อมี
ไฟล์การกำหนดค่าอยู่แล้ว (การเขียนครั้งแรกโดยยังไม่มีการกำหนดค่าจะข้ามการตรวจสอบนี้)

`config.patch` ยังรองรับ `replacePaths` ซึ่งเป็นอาร์เรย์ของพาธการกำหนดค่าที่ตั้งใจ
ให้มีการแทนที่อาร์เรย์ หากแพตช์จะแทนที่หรือลบอาร์เรย์เดิม
ให้มีรายการน้อยลง Gateway จะปฏิเสธการเขียน เว้นแต่พาธนั้นจะปรากฏ
ใน `replacePaths` โดยตรง อาร์เรย์ซ้อนภายใต้รายการอาร์เรย์ใช้ `[]` เช่น
`agents.list[].skills` วิธีนี้ป้องกันไม่ให้สแนปช็อต `config.get` ที่ถูกตัดทอน
เขียนทับอาร์เรย์การกำหนดเส้นทางหรือรายการอนุญาตโดยไม่มีการแจ้งเตือน ใช้ `config.apply` เมื่อ
ตั้งใจแทนที่การกำหนดค่าทั้งหมด

## ตัวแปรสภาพแวดล้อม

OpenClaw อ่านตัวแปรสภาพแวดล้อมจากโพรเซสแม่ รวมถึง:

- `.env` จากไดเรกทอรีทำงานปัจจุบัน (หากมี)
- `~/.openclaw/.env` (ทางเลือกสำรองส่วนกลาง)

ไฟล์ทั้งสองจะไม่แทนที่ตัวแปรสภาพแวดล้อมที่มีอยู่ นอกจากนี้ยังสามารถกำหนดตัวแปรสภาพแวดล้อมแบบอินไลน์ในการกำหนดค่าได้:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="การนำเข้าสภาพแวดล้อมของเชลล์ (ไม่บังคับ)">
  หากเปิดใช้งานและยังไม่ได้กำหนดคีย์ที่คาดไว้ OpenClaw จะเรียกใช้ล็อกอินเชลล์และนำเข้าเฉพาะคีย์ที่ขาดหายไป:

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
- ใช้อักขระหลีก `$${VAR}` เพื่อให้ได้เอาต์พุตตามตัวอักษร
- ทำงานภายในไฟล์ `$include`
- การแทนค่าแบบอินไลน์: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="การอ้างอิงข้อมูลลับ (สภาพแวดล้อม, ไฟล์, การเรียกใช้)">
  สำหรับฟิลด์ที่รองรับออบเจ็กต์ SecretRef สามารถใช้รูปแบบต่อไปนี้:

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

รายละเอียด SecretRef (รวมถึง `secrets.providers` สำหรับ `env`/`file`/`exec`) อยู่ใน [การจัดการข้อมูลลับ](/th/gateway/secrets)
พาธข้อมูลประจำตัวที่รองรับแสดงอยู่ใน [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface)
</Accordion>

ดู[สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญและแหล่งที่มาทั้งหมด

## เอกสารอ้างอิงฉบับเต็ม

สำหรับเอกสารอ้างอิงแบบครบถ้วนทีละฟิลด์ โปรดดู **[เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)**

---

_ที่เกี่ยวข้อง: [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
- [คู่มือปฏิบัติงาน Gateway](/th/gateway)
