---
read_when:
    - การตั้งค่า OpenClaw เป็นครั้งแรก
    - กำลังค้นหารูปแบบการกำหนดค่าที่ใช้กันทั่วไป
    - การไปยังส่วนการกำหนดค่าที่ระบุ
summary: 'ภาพรวมการกำหนดค่า: งานทั่วไป การตั้งค่าอย่างรวดเร็ว และลิงก์ไปยังเอกสารอ้างอิงฉบับเต็ม'
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-07-20T05:56:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d48a4ebb9a8ca212917ce4fe12a0670a44bf1030657bd1334343a91eef8ff742
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw อ่านการกำหนดค่า <Tooltip tip="JSON5 รองรับความคิดเห็นและเครื่องหมายจุลภาคท้ายรายการ">**JSON5**</Tooltip> ที่เป็นทางเลือกจาก `~/.openclaw/openclaw.json` หากไม่มีไฟล์ OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัย

เส้นทางการกำหนดค่าที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ การเขียนที่ OpenClaw เป็นเจ้าของจะแทนที่ไฟล์แบบอะตอมมิก (เปลี่ยนชื่อไปยังเส้นทางนั้น) ดังนั้น `openclaw.json` ที่เป็น symlink จะทำให้เป้าหมายถูกแทนที่แทนที่จะเขียนผ่าน symlink โปรดหลีกเลี่ยงโครงสร้างการกำหนดค่าแบบ symlink หากเก็บการกำหนดค่าไว้นอกไดเรกทอรีสถานะเริ่มต้น ให้ชี้ `OPENCLAW_CONFIG_PATH` ไปยังไฟล์จริงโดยตรง

เหตุผลทั่วไปในการเพิ่มการกำหนดค่า:

- เชื่อมต่อช่องทางและควบคุมว่าใครส่งข้อความถึงบอตได้
- ตั้งค่าโมเดล เครื่องมือ sandboxing หรือระบบอัตโนมัติ (cron, hooks)
- ปรับแต่งเซสชัน สื่อ เครือข่าย หรือ UI

ดูทุกฟิลด์ที่พร้อมใช้งานได้ใน[เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference)

เอเจนต์และระบบอัตโนมัติควรใช้ `config.schema.lookup` เพื่อดูเอกสารระดับฟิลด์ที่แม่นยำ
ก่อนแก้ไขการกำหนดค่า ใช้หน้านี้สำหรับคำแนะนำตามงาน และใช้
[เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) สำหรับภาพรวม
ของฟิลด์และค่าเริ่มต้น

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
  <Tab title="Control UI">
    เปิด [http://127.0.0.1:18789](http://127.0.0.1:18789) และใช้แท็บ **Config**
    Control UI แสดงผลฟอร์มจากสคีมาการกำหนดค่าที่ใช้งานอยู่ รวมถึงเมทาดาทาเอกสารของฟิลด์
    `title` / `description` ตลอดจนสคีมาของ Plugin และช่องทางเมื่อ
    พร้อมใช้งาน พร้อมเครื่องมือแก้ไข **Raw JSON** เป็นทางเลือกสำรอง สำหรับ UI
    แบบเจาะลึกและเครื่องมืออื่น Gateway ยังเปิดให้ใช้ `config.schema.lookup` เพื่อ
    ดึงโหนดสคีมาหนึ่งโหนดตามขอบเขตเส้นทาง พร้อมข้อมูลสรุปของโหนดย่อยโดยตรง
  </Tab>
  <Tab title="แก้ไขโดยตรง">
    แก้ไข `~/.openclaw/openclaw.json` โดยตรง Gateway จะเฝ้าดูไฟล์และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ (ดู[การโหลดซ้ำแบบทันที](#config-hot-reload))
  </Tab>
</Tabs>

## การตรวจสอบความถูกต้องแบบเข้มงวด

<Warning>
OpenClaw ยอมรับเฉพาะการกำหนดค่าที่ตรงกับสคีมาอย่างสมบูรณ์เท่านั้น คีย์ที่ไม่รู้จัก ชนิดข้อมูลผิดรูปแบบ หรือค่าที่ไม่ถูกต้องจะทำให้ Gateway **ปฏิเสธการเริ่มทำงาน** ข้อยกเว้นระดับรากเพียงรายการเดียวคือ `$schema` (string) เพื่อให้เครื่องมือแก้ไขแนบเมทาดาทา JSON Schema ได้
</Warning>

`openclaw config schema` พิมพ์ JSON Schema มาตรฐานที่ Control UI
และการตรวจสอบความถูกต้องใช้ `config.schema.lookup` ดึงโหนดหนึ่งโหนดตามขอบเขตเส้นทางพร้อม
ข้อมูลสรุปโหนดย่อยสำหรับเครื่องมือแบบเจาะลึก เมทาดาทาเอกสารของฟิลด์ `title`/`description`
ส่งต่อผ่านออบเจ็กต์ซ้อน wildcard (`*`) รายการอาร์เรย์ (`[]`) และสาขา `anyOf`/
`oneOf`/`allOf` สคีมา Plugin และช่องทางขณะรันไทม์จะถูกรวมเข้ามาเมื่อ
โหลดรีจิสทรี manifest แล้ว

เมื่อการตรวจสอบความถูกต้องล้มเหลว:

- Gateway ไม่เริ่มทำงาน
- มีเพียงคำสั่งวินิจฉัยที่ใช้งานได้ (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- เรียกใช้ `openclaw doctor` เพื่อดูปัญหาที่แน่นอน
- เรียกใช้ `openclaw doctor --fix` (`--repair` เป็นแฟล็กเดียวกัน และ `--yes` ข้ามข้อความถามยืนยัน) เพื่อใช้การซ่อมแซม

Gateway เก็บสำเนาล่าสุดที่ทราบว่าใช้งานได้และเชื่อถือได้หลังการเริ่มทำงานสำเร็จแต่ละครั้ง
แต่การเริ่มทำงานและการโหลดซ้ำแบบทันทีจะไม่คืนค่าสำเนานั้นโดยอัตโนมัติ มีเพียง `openclaw doctor --fix`
เท่านั้นที่ทำเช่นนั้น หาก `openclaw.json` ไม่ผ่านการตรวจสอบความถูกต้อง (รวมถึงการตรวจสอบภายใน Plugin) การเริ่มทำงานของ Gateway
จะล้มเหลว หรือการโหลดซ้ำจะถูกข้าม และรันไทม์ปัจจุบันจะใช้การกำหนดค่าล่าสุดที่ยอมรับต่อไป
การเขียนที่ถูกปฏิเสธจะถูกบันทึกเป็น `<path>.rejected.<timestamp>` เพื่อการตรวจสอบด้วย
Gateway บล็อกการเขียนที่ดูเหมือนเป็นการเขียนทับโดยไม่ตั้งใจ ได้แก่ การลบ `gateway.mode`
การสูญหายของบล็อก `meta` หรือการลดขนาดไฟล์ลงมากกว่าครึ่งหนึ่ง เว้นแต่การเขียนนั้น
จะอนุญาตการเปลี่ยนแปลงแบบทำลายข้อมูลอย่างชัดเจน ระบบจะข้ามการเลื่อนสถานะเป็นสำเนาล่าสุดที่ทราบว่าใช้งานได้เมื่อ
ข้อมูลที่เสนอมีตัวยึดตำแหน่งข้อมูลลับที่ปกปิดแล้ว เช่น `***` หรือ `[redacted]`

## งานทั่วไป

<AccordionGroup>
  <Accordion title="ตั้งค่าช่องทาง (WhatsApp, Telegram, Discord เป็นต้น)">
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
          dmPolicy: "pairing",   // การจับคู่ | รายการอนุญาต | เปิด | ปิดใช้งาน
          allowFrom: ["tg:123"], // สำหรับรายการอนุญาต/เปิดเท่านั้น
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="เลือกและกำหนดค่าโมเดล">
    ตั้งค่าโมเดลหลักและโมเดลสำรองที่เป็นทางเลือก:

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

    - `agents.defaults.models` เก็บนามแฝงและการตั้งค่าแต่ละโมเดล การเพิ่มรายการจะไม่จำกัดการแทนที่ `/model` หรือ `--model`
    - `agents.defaults.modelPolicy.allow` คือรายการอนุญาตอย่างชัดเจนสำหรับการแทนที่และตัวเลือกโมเดล โดยรับการอ้างอิงแบบตรงทั้งหมดและ wildcard `provider/*` หากไม่ระบุหรือใช้ `[]` จะอนุญาตทุกโมเดล
    - การอ้างอิงโมเดลใช้รูปแบบ `provider/model` (เช่น `anthropic/claude-opus-4-6`)
    - `agents.defaults.imageMaxDimensionPx` ควบคุมการลดขนาดรูปภาพในบทถอดความ/เครื่องมือ (ค่าเริ่มต้น `1200`) โดยทั่วไปค่าที่ต่ำกว่าจะลดการใช้โทเค็นภาพในการทำงานที่มีภาพหน้าจอจำนวนมาก
    - ดู [CLI สำหรับโมเดล](/th/concepts/models) สำหรับการสลับโมเดลในแชต และ[การสลับใช้โมเดลเมื่อขัดข้อง](/th/concepts/model-failover) สำหรับการหมุนเวียนข้อมูลรับรองการยืนยันตัวตนและพฤติกรรมการสำรอง
    - สำหรับผู้ให้บริการแบบกำหนดเอง/โฮสต์เอง ดู[ผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls) ในเอกสารอ้างอิง

  </Accordion>

  <Accordion title="ควบคุมว่าใครส่งข้อความถึงบอตได้">
    การเข้าถึง DM ถูกควบคุมแยกตามช่องทางผ่าน `dmPolicy` (ค่าเริ่มต้น `"pairing"`):

    - `"pairing"`: ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียวเพื่ออนุมัติ
    - `"allowlist"`: เฉพาะผู้ส่งใน `allowFrom` (หรือคลังรายการอนุญาตที่จับคู่แล้ว)
    - `"open"`: อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)
    - `"disabled"`: ไม่สนใจ DM ทั้งหมด

    สำหรับกลุ่ม ให้ใช้ `groupPolicy` (`"allowlist" | "open" | "disabled"`) ร่วมกับ `groupAllowFrom` หรือรายการอนุญาตเฉพาะช่องทาง

    ดูรายละเอียดแยกตามช่องทางใน[เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#dm-and-group-access)

  </Accordion>

  <Accordion title="ตั้งค่าการควบคุมด้วยการกล่าวถึงในแชตกลุ่ม">
    โดยค่าเริ่มต้น ข้อความกลุ่มจะ **ต้องมีการกล่าวถึง** กำหนดค่ารูปแบบทริกเกอร์แยกตามเอเจนต์ การตอบกลับปกติในกลุ่ม/ช่องทางจะโพสต์โดยอัตโนมัติ สำหรับห้องที่ใช้ร่วมกันซึ่งเอเจนต์ควรตัดสินใจว่าจะพูดเมื่อใด ให้เลือกใช้เส้นทางเครื่องมือส่งข้อความ:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // ตั้งเป็น "message_tool" เพื่อบังคับให้ส่งผ่านเครื่องมือส่งข้อความทุกที่
        groupChat: {
          visibleReplies: "message_tool", // เลือกใช้; เอาต์พุตที่มองเห็นได้ต้องใช้ message(action=send)
          unmentionedInbound: "room_event", // บทสนทนากลุ่มที่เปิดตลอดและไม่กล่าวถึงจะเป็นบริบทแบบเงียบ
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

    - **การกล่าวถึงผ่านเมทาดาทา**: @-mention แบบเนทีฟ (แตะเพื่อกล่าวถึงใน WhatsApp, @bot ใน Telegram เป็นต้น)
    - **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `mentionPatterns`
    - **การตอบกลับที่มองเห็นได้**: `messages.visibleReplies` สามารถบังคับให้ส่งผ่านเครื่องมือส่งข้อความทั่วทั้งระบบ และ `messages.groupChat.visibleReplies` จะแทนที่ค่านี้สำหรับกลุ่ม/ช่องทาง
    - ดู[เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#group-chat-mention-gating) สำหรับโหมดการตอบกลับที่มองเห็นได้ การแทนค่าตามช่องทาง และโหมดแชตกับตนเอง

  </Accordion>

  <Accordion title="จำกัด Skills แยกตามเอเจนต์">
    ใช้ `agents.defaults.skills` เป็นค่าพื้นฐานที่ใช้ร่วมกัน แล้วแทนค่าสำหรับ
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

    - ไม่ต้องระบุ `agents.defaults.skills` หากต้องการให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
    - ไม่ต้องระบุ `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
    - ตั้งค่า `agents.list[].skills: []` หากไม่ต้องการ Skills
    - ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config) และ
      [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agents-defaults-skills)

  </Accordion>

  <Accordion title="กำหนดค่าการตรวจสอบสถานะแยกตามช่องทาง">
    ปิดหรือเปิดการรีสตาร์ตสถานะอัตโนมัติสำหรับช่องทางหรือบัญชี:

    ```json5
    {
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

    - ใช้ `channels.<provider>.healthMonitor.enabled` หรือ `channels.<provider>.accounts.<id>.healthMonitor.enabled` เพื่อควบคุมการรีสตาร์ตอัตโนมัติสำหรับช่องทางหรือบัญชีหนึ่งรายการ
    - ดู [การตรวจสอบสถานะ](/th/gateway/health) สำหรับการแก้ไขข้อบกพร่องด้านการปฏิบัติงาน และ[เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#gateway) สำหรับฟิลด์ทั้งหมด

  </Accordion>

  <Accordion title="กำหนดค่าเซสชันและการรีเซ็ต">
    เซสชันควบคุมความต่อเนื่องและการแยกบทสนทนา:

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
            mode: "non-main",  // ปิด | ไม่ใช่เซสชันหลัก | ทั้งหมด
            scope: "agent",    // เซสชัน | เอเจนต์ | ใช้ร่วมกัน
          },
        },
      },
    }
    ```

    สร้างอิมเมจก่อน โดยหากใช้ซอร์สเช็กเอาต์ให้เรียกใช้ `scripts/sandbox-setup.sh` หรือหากติดตั้งจาก npm ให้ดูคำสั่ง `docker build` แบบอินไลน์ใน [แซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup)

    ดูคู่มือฉบับเต็มได้ที่ [แซนด์บ็อกซ์](/th/gateway/sandboxing) และดูตัวเลือกทั้งหมดได้ที่ [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="เปิดใช้พุชที่มีรีเลย์รองรับสำหรับบิลด์ iOS อย่างเป็นทางการ">
    พุชที่มีรีเลย์รองรับสำหรับบิลด์ App Store สาธารณะใช้รีเลย์ OpenClaw ที่โฮสต์ไว้: `https://ios-push-relay.openclaw.ai`

    การติดตั้งใช้งานรีเลย์แบบกำหนดเองต้องมีเส้นทางการบิลด์/ติดตั้งใช้งาน iOS ที่จงใจแยกออกมาต่างหาก โดย URL ของรีเลย์ต้องตรงกับ URL รีเลย์ของ Gateway หากใช้บิลด์รีเลย์แบบกำหนดเอง ให้ตั้งค่านี้ในการกำหนดค่า Gateway:

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

    การทำงานของการตั้งค่านี้:

    - ทำให้ Gateway ส่ง `push.test` การกระตุ้นให้ตื่น และการปลุกเพื่อเชื่อมต่อใหม่ผ่านรีเลย์ภายนอกได้
    - ใช้สิทธิ์อนุญาตการส่งที่จำกัดขอบเขตตามการลงทะเบียน ซึ่งส่งต่อโดยแอป iOS ที่จับคู่แล้ว Gateway ไม่จำเป็นต้องใช้โทเค็นรีเลย์ที่ครอบคลุมทั้งการติดตั้งใช้งาน
    - ผูกการลงทะเบียนที่มีรีเลย์รองรับแต่ละรายการเข้ากับข้อมูลประจำตัวของ Gateway ที่แอป iOS จับคู่ไว้ เพื่อไม่ให้ Gateway อื่นนำการลงทะเบียนที่จัดเก็บไว้ไปใช้ซ้ำได้
    - ทำให้บิลด์ iOS แบบภายในเครื่อง/ด้วยตนเองยังคงใช้ APNs โดยตรง การส่งที่มีรีเลย์รองรับจะใช้เฉพาะกับบิลด์ที่เผยแพร่อย่างเป็นทางการและลงทะเบียนผ่านรีเลย์เท่านั้น
    - ต้องตรงกับ URL ฐานของรีเลย์ที่ฝังอยู่ในบิลด์ iOS เพื่อให้ทราฟฟิกการลงทะเบียนและการส่งไปถึงการติดตั้งใช้งานรีเลย์เดียวกัน

    ขั้นตอนการทำงานตั้งแต่ต้นจนจบ:

    1. ติดตั้งแอป iOS อย่างเป็นทางการ
    2. ไม่บังคับ: กำหนดค่า `gateway.push.apns.relay.baseUrl` บน Gateway เฉพาะเมื่อใช้บิลด์รีเลย์แบบกำหนดเองที่จงใจแยกออกมาต่างหาก
    3. จับคู่แอป iOS กับ Gateway และอนุญาตให้ทั้งเซสชัน Node และเซสชันผู้ดำเนินการเชื่อมต่อ
    4. แอป iOS ดึงข้อมูลประจำตัวของ Gateway ลงทะเบียนกับรีเลย์โดยใช้ App Attest ร่วมกับใบเสร็จของแอป แล้วเผยแพร่เพย์โหลด `push.apns.register` ที่มีรีเลย์รองรับไปยัง Gateway ที่จับคู่ไว้
    5. Gateway จัดเก็บแฮนเดิลรีเลย์และสิทธิ์อนุญาตการส่ง แล้วใช้ข้อมูลเหล่านี้สำหรับ `push.test` การกระตุ้นให้ตื่น และการปลุกเพื่อเชื่อมต่อใหม่

    หมายเหตุด้านการปฏิบัติงาน:

    - หากเปลี่ยนให้แอป iOS ใช้ Gateway อื่น ให้เชื่อมต่อแอปใหม่เพื่อให้เผยแพร่การลงทะเบียนรีเลย์ใหม่ที่ผูกกับ Gateway นั้นได้
    - หากเผยแพร่บิลด์ iOS ใหม่ที่ชี้ไปยังการติดตั้งใช้งานรีเลย์อื่น แอปจะรีเฟรชการลงทะเบียนรีเลย์ที่แคชไว้แทนการใช้ต้นทางรีเลย์เดิมซ้ำ

    หมายเหตุด้านความเข้ากันได้:

    - `OPENCLAW_APNS_RELAY_BASE_URL` และ `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ยังคงใช้เป็นการแทนที่ชั่วคราวผ่านตัวแปรสภาพแวดล้อมได้
    - URL รีเลย์แบบกำหนดเองของ Gateway ต้องตรงกับ URL ฐานของรีเลย์ที่ฝังอยู่ในบิลด์ iOS โดยช่องทางเผยแพร่ App Store สาธารณะจะปฏิเสธการแทนที่ URL รีเลย์ iOS แบบกำหนดเอง
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` ยังคงเป็นช่องทางหลีกเลี่ยงสำหรับการพัฒนาที่ใช้ได้เฉพาะลูปแบ็กเท่านั้น ห้ามบันทึก URL รีเลย์แบบ HTTP ไว้ในการกำหนดค่า

    ดูขั้นตอนการทำงานตั้งแต่ต้นจนจบได้ที่ [แอป iOS](/th/platforms/ios#relay-backed-push-for-official-builds) และดูโมเดลความปลอดภัยของรีเลย์ได้ที่ [ขั้นตอนการยืนยันตัวตนและความเชื่อถือ](/th/platforms/ios#authentication-and-trust-flow)

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

    - `every`: สตริงระยะเวลา (`30m`, `2h`) ตั้งค่า `0m` เพื่อปิดใช้ ค่าเริ่มต้น: `30m`
    - `target`: `last` | `none` | `<channel-id>` (ตัวอย่างเช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`)
    - `directPolicy`: `allow` (ค่าเริ่มต้น) หรือ `block` สำหรับเป้าหมาย Heartbeat แบบ DM
    - ดูคู่มือฉบับเต็มได้ที่ [Heartbeat](/th/gateway/heartbeat)

  </Accordion>

  <Accordion title="กำหนดค่างาน Cron">
    ```json5
    {
      cron: {
        enabled: true,
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: ล้างเซสชันการเรียกใช้แบบแยกที่เสร็จสมบูรณ์แล้วออกจากแถวเซสชัน SQLite (ค่าเริ่มต้น `24h`; ตั้งค่า `false` เพื่อปิดใช้)
    - ประวัติการเรียกใช้จะเก็บแถวเทอร์มินัลใหม่ล่าสุด 2000 แถวต่องานโดยอัตโนมัติ ส่วนแถวที่สูญหายยังคงมีกรอบเวลาล้างข้อมูล 24 ชั่วโมง
    - ดูภาพรวมฟีเจอร์และตัวอย่าง CLI ได้ที่ [งาน Cron](/th/automation/cron-jobs)

  </Accordion>

  <Accordion title="ตั้งค่า Webhook (ฮุก)">
    เปิดใช้ปลายทาง Webhook แบบ HTTP บน Gateway:

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
    - ถือว่าเนื้อหาเพย์โหลดของฮุก/Webhook ทั้งหมดเป็นอินพุตที่ไม่น่าเชื่อถือ
    - ใช้ `hooks.token` โดยเฉพาะ ห้ามนำข้อมูลลับสำหรับยืนยันตัวตนของ Gateway ที่ใช้งานอยู่กลับมาใช้ซ้ำ (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`)
    - การยืนยันตัวตนของฮุกรองรับเฉพาะส่วนหัว (`Authorization: Bearer ...` หรือ `x-openclaw-token`) และจะปฏิเสธโทเค็นในสตริงการค้นหา
    - `hooks.path` ต้องไม่เป็น `/`; ให้เก็บขาเข้า Webhook ไว้ในพาธย่อยเฉพาะ เช่น `/hooks`
    - ปิดแฟล็กข้ามการตรวจสอบเนื้อหาที่ไม่ปลอดภัยไว้ (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) เว้นแต่กำลังดีบักภายใต้ขอบเขตที่จำกัดอย่างเคร่งครัด
    - หากเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วยเพื่อจำกัดขอบเขตคีย์เซสชันที่ผู้เรียกเลือก
    - สำหรับเอเจนต์ที่ขับเคลื่อนด้วยฮุก ควรใช้โมเดลระดับสูงสมัยใหม่ที่มีประสิทธิภาพและนโยบายเครื่องมือที่เข้มงวด (ตัวอย่างเช่น อนุญาตเฉพาะการรับส่งข้อความร่วมกับแซนด์บ็อกซ์เมื่อทำได้)

    ดูตัวเลือกการแมปทั้งหมดและการผสานรวม Gmail ได้ที่ [ข้อมูลอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#hooks)

  </Accordion>

  <Accordion title="กำหนดค่าการกำหนดเส้นทางหลายเอเจนต์">
    เรียกใช้เอเจนต์ที่แยกออกจากกันหลายตัว โดยแต่ละตัวมีเวิร์กสเปซและเซสชันของตนเอง:

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
    - **อาร์เรย์ของไฟล์**: ผสานแบบลึกตามลำดับ (รายการหลังมีผลเหนือกว่า) ซ้อนได้ลึกสูงสุด 10 ระดับ
    - **คีย์ระดับเดียวกัน**: ผสานหลังการรวมไฟล์ (แทนที่ค่าจากไฟล์ที่รวม)
    - **พาธสัมพัทธ์**: แก้พาธโดยอ้างอิงจากไฟล์ที่ทำการรวม
    - **รูปแบบพาธ**: พาธที่รวมต้องไม่มีไบต์ null และต้องสั้นกว่า 4096 อักขระอย่างเคร่งครัด ทั้งก่อนและหลังการแก้พาธ
    - **การเขียนที่ OpenClaw เป็นเจ้าของ**: เมื่อการเขียนเปลี่ยนแปลงเฉพาะส่วนระดับบนสุดเพียงส่วนเดียว
      ซึ่งมีไฟล์ที่รวมแบบไฟล์เดียวรองรับ เช่น `plugins: { $include: "./plugins.json5" }`
      OpenClaw จะอัปเดตไฟล์ที่รวมดังกล่าวและคง `openclaw.json` ไว้ดังเดิม
    - **ไม่รองรับการเขียนส่งผ่าน**: การรวมที่ระดับราก อาร์เรย์ของไฟล์ที่รวม และการรวม
      ที่มีการแทนที่ด้วยคีย์ระดับเดียวกัน จะปฏิเสธการเขียนที่ OpenClaw เป็นเจ้าของอย่างปลอดภัย
      แทนการแผ่การกำหนดค่าให้อยู่ในไฟล์เดียว
    - **การจำกัดขอบเขต**: พาธ `$include` ต้องแก้ไปยังตำแหน่งภายใต้ไดเรกทอรีที่เก็บ
      `openclaw.json` หากต้องการใช้โครงสร้างไดเรกทอรีร่วมกันระหว่างเครื่องหรือผู้ใช้ ให้ตั้งค่า
      `OPENCLAW_INCLUDE_ROOTS` เป็นรายการพาธ (`:` บน POSIX, `;` บน Windows) ของ
      ไดเรกทอรีเพิ่มเติมที่ไฟล์รวมสามารถอ้างอิงได้ ระบบจะแก้ symlink
      และตรวจสอบอีกครั้ง ดังนั้นพาธที่ในเชิงข้อความอยู่ภายในไดเรกทอรีการกำหนดค่า แต่มี
      เป้าหมายจริงอยู่นอกรากที่อนุญาตทั้งหมดจะยังคงถูกปฏิเสธ
    - **การจัดการข้อผิดพลาด**: แสดงข้อผิดพลาดอย่างชัดเจนเมื่อไฟล์หาย การแยกวิเคราะห์ผิดพลาด การรวมเป็นวงกลม รูปแบบพาธไม่ถูกต้อง และความยาวเกินกำหนด

  </Accordion>
</AccordionGroup>

## การโหลดการกำหนดค่าใหม่แบบทันที

Gateway เฝ้าดู `~/.openclaw/openclaw.json` และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ โดยการตั้งค่าส่วนใหญ่ไม่จำเป็นต้องรีสตาร์ตด้วยตนเอง

การแก้ไขไฟล์โดยตรงจะถือว่าไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบ Watcher จะรอ
ให้การเขียนไฟล์ชั่วคราว/การเปลี่ยนชื่อโดยโปรแกรมแก้ไขเสร็จสิ้น อ่านไฟล์สุดท้าย และปฏิเสธ
การแก้ไขจากภายนอกที่ไม่ถูกต้องโดยไม่เขียนทับ `openclaw.json` การเขียนการกำหนดค่า
ที่ OpenClaw เป็นเจ้าของจะผ่านเกตสคีมาเดียวกันก่อนเขียน (ดูกฎการเขียนทับ/ย้อนกลับ
ที่ใช้กับการเขียนทุกครั้งได้ที่ [การตรวจสอบอย่างเข้มงวด](#strict-validation))

หากพบ `config reload skipped (invalid config)` หรือรายงานการเริ่มต้นแสดง `Invalid
config` ให้ตรวจสอบการกำหนดค่า เรียกใช้ `openclaw config validate` แล้วเรียกใช้ `openclaw
doctor --fix` เพื่อซ่อมแซม ดูรายการตรวจสอบได้ที่ [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config)

### โหมดการโหลดใหม่

| โหมด                   | ลักษณะการทำงาน                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (ค่าเริ่มต้น) | นำการเปลี่ยนแปลงที่ปลอดภัยไปใช้ทันทีโดยไม่รีสตาร์ต และรีสตาร์ตโดยอัตโนมัติสำหรับการเปลี่ยนแปลงที่สำคัญ           |
| **`hot`**              | นำเฉพาะการเปลี่ยนแปลงที่ปลอดภัยไปใช้โดยไม่รีสตาร์ต บันทึกคำเตือนเมื่อต้องรีสตาร์ต โดยต้องดำเนินการเอง |
| **`restart`**          | รีสตาร์ต Gateway เมื่อการกำหนดค่าเปลี่ยนแปลง ไม่ว่าจะปลอดภัยหรือไม่                                 |
| **`off`**              | ปิดการเฝ้าดูไฟล์ การเปลี่ยนแปลงจะมีผลเมื่อรีสตาร์ตด้วยตนเองครั้งถัดไป                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### สิ่งที่นำไปใช้ได้ทันทีเทียบกับสิ่งที่ต้องรีสตาร์ต

ฟิลด์ส่วนใหญ่ใช้การเปลี่ยนแปลงได้ทันทีโดยไม่มีช่วงหยุดให้บริการ ส่วนบางหัวข้อที่ใช้การเปลี่ยนแปลงทันทีจะรีสตาร์ทเฉพาะ
ระบบย่อยนั้น (ช่องทาง, cron, heartbeat, ตัวตรวจสอบสถานะ) แทนที่จะรีสตาร์ท Gateway ทั้งหมด ใน
โหมด `hybrid` การเปลี่ยนแปลงที่ต้องรีสตาร์ท Gateway จะได้รับการจัดการโดยอัตโนมัติ

| หมวดหมู่            | ฟิลด์                                                                  | ต้องรีสตาร์ท Gateway หรือไม่?      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| ช่องทาง            | `channels.*`, `web` (WhatsApp) - ช่องทางแบบในตัวและช่องทางจาก Plugin ทั้งหมด       | ไม่ (รีสตาร์ทช่องทางนั้น)   |
| เอเจนต์และโมเดล      | `agent`, `agents`, `models`, `routing`                                  | ไม่                           |
| การทำงานอัตโนมัติ          | `hooks`, `cron`, `agent.heartbeat`                                      | ไม่ (รีสตาร์ทระบบย่อยนั้น) |
| เซสชันและข้อความ | `session`, `messages`                                                   | ไม่                           |
| เครื่องมือและสื่อ       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | ไม่                           |
| การกำหนดค่า Plugin       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | ไม่ (โหลดรันไทม์ของ Plugin ใหม่)  |
| UI และอื่น ๆ           | `ui`, `logging`, `identity`, `bindings`                                 | ไม่                           |
| เซิร์ฟเวอร์ Gateway      | `gateway.*` (พอร์ต, การผูก, การยืนยันตัวตน, tailscale, TLS, HTTP, push)              | **ใช่**                      |
| โครงสร้างพื้นฐาน      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **ใช่**                      |

<Note>
`gateway.reload` และ `gateway.remote` เป็นข้อยกเว้นภายใต้ `gateway.*` การเปลี่ยนค่าเหล่านี้จะ **ไม่** ทำให้เกิดการรีสตาร์ท Plugin แต่ละรายการยังสามารถแทนที่ตารางนี้ได้ด้วย โดย Plugin ที่โหลดแล้วอาจประกาศคำนำหน้าการกำหนดค่าที่ทำให้ต้องรีสตาร์ทเอง (ตัวอย่างเช่น Canvas Plugin ที่รวมมาให้จะรีสตาร์ท Gateway สำหรับ `plugins.enabled`, `plugins.allow` และ `plugins.deny` ไม่ใช่เฉพาะ `plugins.entries.canvas` ของตนเอง) ดังนั้นลักษณะการทำงานจริงจึงขึ้นอยู่กับ Plugin ที่กำลังทำงานอยู่
</Note>

### การวางแผนโหลดใหม่

เมื่อแก้ไขไฟล์ต้นฉบับที่อ้างอิงผ่าน `$include` OpenClaw จะวางแผน
การโหลดใหม่จากเค้าโครงที่เขียนไว้ในต้นฉบับ ไม่ใช่มุมมองในหน่วยความจำที่ถูกทำให้แบน
ซึ่งช่วยให้การตัดสินใจโหลดใหม่ทันที (ใช้การเปลี่ยนแปลงทันทีเทียบกับรีสตาร์ท) คาดการณ์ได้ แม้ว่า
หัวข้อระดับบนสุดหนึ่งหัวข้อจะอยู่ในไฟล์ที่รวมแยกต่างหาก เช่น
`plugins: { $include: "./plugins.json5" }` การวางแผนโหลดใหม่จะล้มเหลวแบบปิดกั้นหาก
เค้าโครงต้นฉบับมีความกำกวม

## Config RPC (การอัปเดตโดยใช้โปรแกรม)

สำหรับเครื่องมือที่เขียนการกำหนดค่าผ่าน API ของ Gateway ให้ใช้ขั้นตอนนี้เป็นหลัก:

- `config.schema.lookup` เพื่อตรวจสอบแผนผังย่อยหนึ่งรายการ (โหนดสคีมาแบบตื้น + ข้อมูลสรุป
  ของโหนดลูก)
- `config.get` เพื่อดึงสแนปช็อตปัจจุบันพร้อม `hash`
- `config.patch` สำหรับการอัปเดตบางส่วน (JSON merge patch: ออบเจ็กต์จะผสานกัน, `null`
  จะลบ, อาร์เรย์จะถูกแทนที่เมื่อตั้งใจยืนยันด้วย `replacePaths` หาก
  จะมีการลบรายการ)
- `config.apply` เฉพาะเมื่อต้องการแทนที่การกำหนดค่าทั้งหมด
- `update.run` สำหรับการอัปเดตตัวเองพร้อมรีสตาร์ทอย่างชัดเจน ให้ใส่ `continuationMessage` เมื่อเซสชันหลังรีสตาร์ทควรทำงานต่ออีกหนึ่งรอบ
- `update.status` เพื่อตรวจสอบตัวบ่งชี้การรีสตาร์ทจากการอัปเดตล่าสุด และยืนยันเวอร์ชันที่กำลังทำงานหลังการรีสตาร์ท

เอเจนต์ควรใช้ `config.schema.lookup` เป็นจุดแรกสำหรับเอกสารและข้อจำกัด
ระดับฟิลด์ที่แม่นยำ ใช้ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
เมื่อต้องการแผนผังการกำหนดค่าที่กว้างขึ้น ค่าเริ่มต้น หรือลิงก์ไปยังข้อมูลอ้างอิง
ของระบบย่อยโดยเฉพาะ

<Note>
การเขียนในระนาบควบคุม (`config.apply`, `config.patch`, `update.run`)
ถูกจำกัดอัตราไว้ที่ 30 คำขอต่อ 60 วินาที ต่อเมธอด ต่อ
`deviceId+clientIp` โปรดดู [การจำกัดอัตรา](/th/gateway/security/rate-limiting) คำขอรีสตาร์ท
จะถูกรวมเข้าด้วยกัน จากนั้นบังคับใช้ช่วงพัก 30 วินาทีระหว่างรอบการรีสตาร์ท
`update.status` เป็นแบบอ่านอย่างเดียวแต่จำกัดเฉพาะผู้ดูแลระบบ เนื่องจากตัวบ่งชี้การรีสตาร์ทอาจ
มีข้อมูลสรุปขั้นตอนการอัปเดตและส่วนท้ายของเอาต์พุตคำสั่ง
</Note>

ตัวอย่างแพตช์บางส่วน:

```bash
openclaw gateway call config.get --params '{}'  # บันทึก payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

ทั้ง `config.apply` และ `config.patch` ยอมรับ `raw`, `baseHash`, `sessionKey`,
`note` และ `restartDelayMs` โดยทั้งสองเมธอดต้องใช้ `baseHash` เมื่อมี
ไฟล์การกำหนดค่าอยู่แล้ว (การเขียนครั้งแรกที่ยังไม่มีการกำหนดค่าจะข้ามการตรวจสอบนี้)

`config.patch` ยังยอมรับ `replacePaths` ซึ่งเป็นอาร์เรย์ของพาธการกำหนดค่าที่ตั้งใจ
ให้แทนที่อาร์เรย์ หากแพตช์จะแทนที่หรือลบอาร์เรย์ที่มีอยู่
ด้วยจำนวนรายการที่น้อยลง Gateway จะปฏิเสธการเขียน เว้นแต่พาธนั้นจะปรากฏ
ใน `replacePaths` โดยอาร์เรย์ซ้อนภายใต้รายการอาร์เรย์จะใช้ `[]` เช่น
`agents.list[].skills` วิธีนี้ช่วยป้องกันไม่ให้สแนปช็อต `config.get` ที่ถูกตัดทอน
เขียนทับอาร์เรย์การกำหนดเส้นทางหรือรายการอนุญาตโดยไม่มีการแจ้งเตือน ใช้ `config.apply` เมื่อ
ตั้งใจแทนที่การกำหนดค่าทั้งหมด

## ตัวแปรสภาพแวดล้อม

OpenClaw อ่านตัวแปรสภาพแวดล้อมจากโปรเซสแม่ รวมทั้ง:

- `.env` จากไดเรกทอรีการทำงานปัจจุบัน (ถ้ามี)
- `~/.openclaw/.env` (ตัวสำรองส่วนกลาง)

ทั้งสองไฟล์จะไม่แทนที่ตัวแปรสภาพแวดล้อมที่มีอยู่ นอกจากนี้ยังสามารถตั้งค่าตัวแปรสภาพแวดล้อมแบบอินไลน์ในการกำหนดค่าได้:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="การนำเข้าตัวแปรสภาพแวดล้อมจากเชลล์ (ไม่บังคับ)">
  หากเปิดใช้งานและไม่ได้ตั้งค่าคีย์ที่คาดไว้ OpenClaw จะเรียกใช้ล็อกอินเชลล์และนำเข้าเฉพาะคีย์ที่ขาดหายไป:

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
  อ้างอิงตัวแปรสภาพแวดล้อมในค่าสตริงการกำหนดค่าใด ๆ ด้วย `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

กฎ:

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่ไม่มีอยู่หรือว่างเปล่าจะทำให้เกิดข้อผิดพลาดขณะโหลด
- ใช้อักขระหลีก `$${VAR}` สำหรับเอาต์พุตตามตัวอักษร
- ใช้ได้ภายในไฟล์ `$include`
- การแทนค่าแบบอินไลน์: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="การอ้างอิงข้อมูลลับ (env, file, exec)">
  สำหรับฟิลด์ที่รองรับออบเจ็กต์ SecretRef สามารถใช้:

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

ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญและแหล่งที่มาทั้งหมด

## ข้อมูลอ้างอิงฉบับเต็ม

สำหรับข้อมูลอ้างอิงที่ครบถ้วนแบบรายฟิลด์ โปรดดู **[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)**

---

_ที่เกี่ยวข้อง: [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
