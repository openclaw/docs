---
read_when:
    - การเปลี่ยนพฤติกรรมแชตกลุ่มหรือการควบคุมการทำงานด้วยการกล่าวถึง
    - การจำกัดขอบเขต mentionPatterns ให้ใช้กับการสนทนากลุ่มที่ระบุ
sidebarTitle: Groups
summary: ลักษณะการทำงานของแชทกลุ่มบนพื้นผิวต่าง ๆ (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: กลุ่ม
x-i18n:
    generated_at: "2026-06-27T17:10:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48660e36ac642956842d453fd4caf2cbd7f4193efee9ac864fd7cf700c3c43b6
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw ปฏิบัติต่อแชตกลุ่มอย่างสอดคล้องกันในทุกพื้นผิว: Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo.

สำหรับห้องที่เปิดตลอดเวลาซึ่งควรให้บริบทแบบเงียบ เว้นแต่เอเจนต์จะส่งข้อความที่มองเห็นได้อย่างชัดเจน โปรดดู [เหตุการณ์ห้องแบบ Ambient](/th/channels/ambient-room-events)

## บทนำสำหรับผู้เริ่มต้น (2 นาที)

OpenClaw "อยู่" บนบัญชีรับส่งข้อความของคุณเอง ไม่มีผู้ใช้บอท WhatsApp แยกต่างหาก หาก **คุณ** อยู่ในกลุ่ม OpenClaw จะเห็นกลุ่มนั้นและตอบกลับที่นั่นได้

พฤติกรรมเริ่มต้น:

- กลุ่มถูกจำกัด (`groupPolicy: "allowlist"`)
- การตอบกลับต้องมีการกล่าวถึง เว้นแต่คุณจะปิดการกั้นด้วยการกล่าวถึงอย่างชัดเจน
- การตอบกลับที่มองเห็นได้ในกลุ่ม/ช่องใช้เครื่องมือ `message` เป็นค่าเริ่มต้น

ความหมาย: ผู้ส่งที่อยู่ใน allowlist สามารถเรียกใช้ OpenClaw ได้โดยการกล่าวถึง OpenClaw

<Note>
**สรุปสั้น ๆ**

- **การเข้าถึง DM** ถูกควบคุมโดย `*.allowFrom`
- **การเข้าถึงกลุ่ม** ถูกควบคุมโดย `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`)
- **การทริกเกอร์การตอบกลับ** ถูกควบคุมโดยการกั้นด้วยการกล่าวถึง (`requireMention`, `/activation`)

</Note>

ลำดับอย่างรวดเร็ว (สิ่งที่เกิดขึ้นกับข้อความกลุ่ม):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## การตอบกลับที่มองเห็นได้

สำหรับคำขอกลุ่ม/ช่องปกติ OpenClaw ใช้ค่าเริ่มต้น `messages.groupChat.visibleReplies: "automatic"` ข้อความสุดท้ายของผู้ช่วยจะโพสต์ผ่านเส้นทางการตอบกลับที่มองเห็นได้แบบเดิม เว้นแต่คุณจะเลือกให้ห้องใช้เอาต์พุตผ่านเครื่องมือข้อความเท่านั้น

ใช้ `messages.groupChat.visibleReplies: "message_tool"` เมื่อห้องที่ใช้ร่วมกันควรให้เอเจนต์ตัดสินใจเองว่าจะพูดเมื่อใดโดยเรียก `message(action=send)` วิธีนี้ทำงานได้ดีที่สุดกับห้องกลุ่มที่รองรับโดยโมเดลรุ่นล่าสุดที่เชื่อถือการใช้เครื่องมือได้ เช่น GPT 5.5 หากโมเดลพลาดเครื่องมือนั้นและส่งคืนข้อความสุดท้ายที่มีเนื้อหาสาระ OpenClaw จะเก็บข้อความสุดท้ายนั้นไว้เป็นส่วนตัวแทนที่จะโพสต์ไปยังห้อง

ใช้ `"automatic"` สำหรับโมเดลหรือรันไทม์ที่อ่อนกว่า ซึ่งไม่เข้าใจการส่งผ่านเครื่องมือเท่านั้นได้อย่างเชื่อถือได้ ในโหมด automatic ข้อความผู้ช่วยสุดท้ายของเอเจนต์คือเส้นทางตอบกลับต้นทางที่มองเห็นได้ ดังนั้นโมเดลที่เรียก `message(action=send)` ได้ไม่สม่ำเสมอยังสามารถตอบได้ตามปกติ

ในโหมด automatic การตอบกลับสุดท้ายแบบข้อความปกติจะถูกโพสต์ไปยังห้องโดยตรง หากการตอบกลับที่มองเห็นได้ต้องมีไฟล์ รูปภาพ หรือไฟล์แนบอื่น ๆ เอเจนต์ยังอาจใช้ `message(action=send)` สำหรับไฟล์แนบนั้น แทนที่จะพยายามบังคับส่งผ่านการตอบกลับข้อความสุดท้าย

หากเครื่องมือ message ไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะย้อนกลับไปใช้การตอบกลับที่มองเห็นได้แบบ automatic แทนที่จะกดการตอบกลับไว้เงียบ ๆ `openclaw doctor` จะเตือนเกี่ยวกับความไม่สอดคล้องนี้

สำหรับแชตโดยตรงและเหตุการณ์ต้นทางอื่น ๆ ให้ใช้ `messages.visibleReplies: "message_tool"` เพื่อใช้พฤติกรรมการตอบกลับที่มองเห็นได้แบบใช้เครื่องมือเท่านั้นเหมือนกันทั่วทั้งระบบ เทิร์นโดยตรงของ WebChat ภายในใช้การส่งการตอบกลับสุดท้ายแบบ automatic เป็นค่าเริ่มต้น เพื่อให้ Pi และ Codex ได้รับสัญญาการตอบกลับที่มองเห็นได้เดียวกัน ตั้งค่า `messages.visibleReplies: "message_tool"` เพื่อบังคับใช้ `message(action=send)` สำหรับเอาต์พุตที่มองเห็นได้โดยตั้งใจ `messages.groupChat.visibleReplies` ยังคงเป็นการแทนที่ที่เฉพาะเจาะจงกว่าสำหรับห้องกลุ่ม/ช่อง

สิ่งนี้แทนที่รูปแบบเดิมของการบังคับให้โมเดลตอบ `NO_REPLY` สำหรับเทิร์นส่วนใหญ่ในโหมดแอบอ่าน ในโหมดใช้เครื่องมือเท่านั้น พรอมป์จะไม่กำหนดสัญญา `NO_REPLY` การไม่ทำอะไรที่มองเห็นได้หมายถึงการไม่เรียกเครื่องมือ message เท่านั้น

การผูกการสนทนาที่ Plugin เป็นเจ้าของเป็นข้อยกเว้น เมื่อ Plugin ผูกเธรดและอ้างสิทธิ์เทิร์นขาเข้าแล้ว การตอบกลับที่ Plugin ส่งคืนคือการตอบสนองการผูกที่มองเห็นได้ โดยไม่จำเป็นต้องใช้ `message(action=send)` การตอบกลับนั้นเป็นเอาต์พุตของรันไทม์ Plugin ไม่ใช่ข้อความสุดท้ายส่วนตัวของโมเดล

ตัวบ่งชี้การพิมพ์ยังคงถูกส่งสำหรับคำขอกลุ่มโดยตรง เหตุการณ์ห้องแบบ Ambient ที่เปิดตลอดเวลา เมื่อเปิดใช้ จะยังคงเข้มงวดและเงียบ เว้นแต่เอเจนต์จะเรียกเครื่องมือ message

เซสชันจะกดสรุปเครื่องมือ/ความคืบหน้าแบบละเอียดไว้เป็นค่าเริ่มต้น ใช้ `/verbose on` เพื่อแสดงสรุปเหล่านั้นสำหรับเซสชันปัจจุบันระหว่างดีบัก และใช้ `/verbose off` เพื่อกลับไปใช้พฤติกรรมเฉพาะการตอบกลับสุดท้าย สถานะ verbose เดียวกันจะใช้กับแชตโดยตรง กลุ่ม ช่อง และหัวข้อฟอรัมทั้งหมด

หากต้องการส่งข้อความพูดคุยในกลุ่มที่เปิดตลอดเวลาและไม่ได้กล่าวถึงเป็นบริบทห้องแบบเงียบแทนคำขอของผู้ใช้ ให้ใช้ [เหตุการณ์ห้องแบบ Ambient](/th/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

ค่าเริ่มต้นคือ `unmentionedInbound: "user_request"`

ข้อความที่มีการกล่าวถึง คำสั่ง คำขอยกเลิก และ DM ยังคงเป็นคำขอของผู้ใช้

หากต้องการบังคับให้เอาต์พุตที่มองเห็นได้ผ่านเครื่องมือ message สำหรับคำขอกลุ่ม/ช่อง:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Gateway จะโหลดคอนฟิก `messages` ใหม่แบบ hot-reload หลังจากบันทึกไฟล์ รีสตาร์ทเฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลดคอนฟิกใหม่ถูกปิดในการปรับใช้งาน

หากต้องการบังคับให้เอาต์พุตที่มองเห็นได้ผ่านเครื่องมือ message สำหรับแชตต้นทางทุกประเภท:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

คำสั่ง slash แบบเนทีฟ (Discord, Telegram และพื้นผิวอื่น ๆ ที่รองรับคำสั่งเนทีฟ) จะข้าม `visibleReplies: "message_tool"` และตอบกลับแบบมองเห็นได้เสมอ เพื่อให้ UI คำสั่งเนทีฟของช่องได้รับการตอบสนองที่คาดไว้ สิ่งนี้ใช้กับเทิร์นคำสั่งเนทีฟที่ตรวจสอบแล้วเท่านั้น คำสั่ง `/...` ที่พิมพ์เป็นข้อความและเทิร์นแชตทั่วไปยังคงปฏิบัติตามค่าเริ่มต้นของกลุ่มที่กำหนดไว้

## การมองเห็นบริบทและ allowlist

มีการควบคุมสองแบบที่เกี่ยวข้องกับความปลอดภัยของกลุ่ม:

- **การอนุญาตให้ทริกเกอร์**: ใครสามารถทริกเกอร์เอเจนต์ได้ (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist เฉพาะช่อง)
- **การมองเห็นบริบท**: บริบทเสริมใดที่ถูกฉีดเข้าสู่โมเดล (ข้อความตอบกลับ คำอ้างอิง ประวัติเธรด เมตาดาตาที่ส่งต่อ)

โดยค่าเริ่มต้น OpenClaw ให้ความสำคัญกับพฤติกรรมแชตปกติและเก็บบริบทไว้เกือบเหมือนที่ได้รับมา ซึ่งหมายความว่า allowlist จะตัดสินเป็นหลักว่าใครสามารถทริกเกอร์การกระทำได้ ไม่ใช่ขอบเขตการปกปิดข้อมูลแบบสากลสำหรับทุกข้อความอ้างอิงหรือส่วนย่อยในประวัติ

<AccordionGroup>
  <Accordion title="พฤติกรรมปัจจุบันแตกต่างกันตามช่อง">
    - บางช่องใช้การกรองตามผู้ส่งสำหรับบริบทเสริมในเส้นทางเฉพาะอยู่แล้ว (เช่น การตั้งต้นเธรด Slack, การค้นหาการตอบกลับ/เธรดของ Matrix)
    - ช่องอื่น ๆ ยังส่งผ่านบริบทคำอ้างอิง/การตอบกลับ/การส่งต่อเหมือนที่ได้รับมา

  </Accordion>
  <Accordion title="ทิศทางการเพิ่มความแข็งแกร่ง (วางแผนไว้)">
    - `contextVisibility: "all"` (ค่าเริ่มต้น) คงพฤติกรรมปัจจุบันแบบตามที่ได้รับมา
    - `contextVisibility: "allowlist"` กรองบริบทเสริมให้เหลือผู้ส่งที่อยู่ใน allowlist
    - `contextVisibility: "allowlist_quote"` คือ `allowlist` พร้อมข้อยกเว้นการอ้างอิง/ตอบกลับแบบชัดเจนหนึ่งรายการ

    จนกว่าโมเดลการเพิ่มความแข็งแกร่งนี้จะถูกนำไปใช้ให้สอดคล้องกันทุกช่อง คาดว่าจะมีความแตกต่างตามพื้นผิว

  </Accordion>
</AccordionGroup>

![ลำดับข้อความกลุ่ม](/images/groups-flow.svg)

หากคุณต้องการ...

| เป้าหมาย                                         | สิ่งที่ต้องตั้งค่า                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| อนุญาตทุกกลุ่ม แต่ตอบเฉพาะเมื่อมี @mentions | `groups: { "*": { requireMention: true } }`                |
| ปิดการตอบกลับกลุ่มทั้งหมด                    | `groupPolicy: "disabled"`                                  |
| เฉพาะบางกลุ่ม                         | `groups: { "<group-id>": { ... } }` (ไม่มีคีย์ `"*"` )         |
| เฉพาะคุณเท่านั้นที่ทริกเกอร์ในกลุ่มได้               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| ใช้ชุดผู้ส่งที่เชื่อถือได้ชุดเดียวซ้ำข้ามช่อง | `groupAllowFrom: ["accessGroup:operators"]`                |

สำหรับ allowlist ผู้ส่งที่ใช้ซ้ำได้ โปรดดู [กลุ่มการเข้าถึง](/th/channels/access-groups)

## คีย์เซสชัน

- เซสชันกลุ่มใช้คีย์เซสชัน `agent:<agentId>:<channel>:group:<id>` (ห้อง/ช่องใช้ `agent:<agentId>:<channel>:channel:<id>`)
- หัวข้อฟอรัม Telegram เพิ่ม `:topic:<threadId>` ต่อท้าย id กลุ่ม เพื่อให้แต่ละหัวข้อมีเซสชันของตัวเอง
- แชตโดยตรงใช้เซสชันหลัก (หรือแยกตามผู้ส่ง หากกำหนดค่าไว้)
- Heartbeat ถูกข้ามสำหรับเซสชันกลุ่ม

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## รูปแบบ: DM ส่วนตัว + กลุ่มสาธารณะ (เอเจนต์เดียว)

ใช่ — วิธีนี้ทำงานได้ดีหากทราฟฟิก "ส่วนตัว" ของคุณคือ **DM** และทราฟฟิก "สาธารณะ" ของคุณคือ **กลุ่ม**

เหตุผล: ในโหมดเอเจนต์เดียว DM มักจะไปอยู่ในคีย์เซสชัน **main** (`agent:main:main`) ขณะที่กลุ่มจะใช้คีย์เซสชัน **ที่ไม่ใช่ main** เสมอ (`agent:main:<channel>:group:<id>`) หากคุณเปิดใช้ sandboxing ด้วย `mode: "non-main"` เซสชันกลุ่มเหล่านั้นจะทำงานในแบ็กเอนด์ sandbox ที่กำหนดค่าไว้ ขณะที่เซสชัน DM หลักของคุณยังอยู่บนโฮสต์ Docker เป็นแบ็กเอนด์เริ่มต้นหากคุณไม่ได้เลือกอย่างอื่น

สิ่งนี้ให้ "สมอง" เอเจนต์เดียวแก่คุณ (พื้นที่ทำงาน + หน่วยความจำที่ใช้ร่วมกัน) แต่มีท่าทางการทำงานสองแบบ:

- **DM**: เครื่องมือครบถ้วน (โฮสต์)
- **กลุ่ม**: sandbox + เครื่องมือที่จำกัด

<Note>
หากคุณต้องการพื้นที่ทำงาน/บุคลิกที่แยกกันอย่างแท้จริง ("ส่วนตัว" และ "สาธารณะ" ต้องไม่ปะปนกันเลย) ให้ใช้เอเจนต์ตัวที่สอง + การผูก ดู [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
</Note>

<Tabs>
  <Tab title="DM บนโฮสต์ กลุ่มอยู่ใน sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // groups/channels are non-main -> sandboxed
            scope: "session", // strongest isolation (one container per group/channel)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // If allow is non-empty, everything else is blocked (deny still wins).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="กลุ่มเห็นเฉพาะโฟลเดอร์ที่อยู่ใน allowlist">
    ต้องการให้ "กลุ่มเห็นได้เฉพาะโฟลเดอร์ X" แทน "ไม่มีการเข้าถึงโฮสต์" ใช่ไหม คง `workspaceAccess: "none"` ไว้ แล้วเมานต์เฉพาะเส้นทางที่อยู่ใน allowlist เข้าไปใน sandbox:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",
            scope: "session",
            workspaceAccess: "none",
            docker: {
              binds: [
                // hostPath:containerPath:mode
                "/home/user/FriendsShared:/data:ro",
              ],
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

ที่เกี่ยวข้อง:

- คีย์คอนฟิกและค่าเริ่มต้น: [การกำหนดค่า Gateway](/th/gateway/config-agents#agentsdefaultssandbox)
- การดีบักว่าทำไมเครื่องมือจึงถูกบล็อก: [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated)
- รายละเอียด bind mount: [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts)

## ป้ายชื่อที่แสดง

- ป้ายชื่อ UI ใช้ `displayName` เมื่อมี โดยจัดรูปแบบเป็น `<channel>:<token>`
- `#room` สงวนไว้สำหรับห้อง/ช่อง แชตกลุ่มใช้ `g-<slug>` (ตัวพิมพ์เล็ก, ช่องว่าง -> `-`, คง `#@+._-` ไว้)

## นโยบายกลุ่ม

ควบคุมวิธีจัดการข้อความกลุ่ม/ห้องต่อช่อง:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| นโยบาย        | ลักษณะการทำงาน                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | กลุ่มข้ามรายการอนุญาตได้ การควบคุมด้วยการกล่าวถึงยังคงมีผล      |
| `"disabled"`  | บล็อกข้อความกลุ่มทั้งหมดโดยสิ้นเชิง                           |
| `"allowlist"` | อนุญาตเฉพาะกลุ่ม/ห้องที่ตรงกับรายการอนุญาตที่กำหนดค่าไว้ |

<AccordionGroup>
  <Accordion title="หมายเหตุรายช่องทาง">
    - `groupPolicy` แยกจากการควบคุมด้วยการกล่าวถึง (ซึ่งต้องใช้ @mentions)
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: ใช้ `groupAllowFrom` (ทางเลือกสำรอง: `allowFrom` แบบระบุชัดเจน)
    - Signal: `groupAllowFrom` สามารถตรงกับ ID กลุ่ม Signal ขาเข้า หรือโทรศัพท์/UUID ของผู้ส่งก็ได้
    - การอนุมัติการจับคู่ DM (รายการที่เก็บ `*-allowFrom`) ใช้กับการเข้าถึง DM เท่านั้น การอนุญาตผู้ส่งในกลุ่มยังคงต้องระบุชัดเจนในรายการอนุญาตของกลุ่ม
    - Discord: รายการอนุญาตใช้ `channels.discord.guilds.<id>.channels`
    - Slack: รายการอนุญาตใช้ `channels.slack.channels`
    - Matrix: รายการอนุญาตใช้ `channels.matrix.groups` ควรใช้ ID ห้องหรือนามแฝง การค้นหาชื่อห้องที่เข้าร่วมแล้วเป็นแบบพยายามอย่างดีที่สุด และชื่อที่แก้ไม่ได้จะถูกละเว้นขณะรันไทม์ ใช้ `channels.matrix.groupAllowFrom` เพื่อจำกัดผู้ส่ง และยังรองรับรายการอนุญาต `users` รายห้องด้วย
    - DM แบบกลุ่มถูกควบคุมแยกต่างหาก (`channels.discord.dm.*`, `channels.slack.dm.*`)
    - รายการอนุญาตของ Telegram สามารถตรงกับ ID ผู้ใช้ (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) หรือชื่อผู้ใช้ (`"@alice"` หรือ `"alice"`); คำนำหน้าไม่แยกตัวพิมพ์ใหญ่เล็ก
    - ค่าเริ่มต้นคือ `groupPolicy: "allowlist"`; หากรายการอนุญาตของกลุ่มว่าง ข้อความกลุ่มจะถูกบล็อก
    - ความปลอดภัยขณะรันไทม์: เมื่อบล็อกผู้ให้บริการหายไปทั้งหมด (`channels.<provider>` ไม่มีอยู่) นโยบายกลุ่มจะถอยกลับไปยังโหมดปิดเมื่อไม่ผ่านเงื่อนไข (โดยทั่วไปคือ `allowlist`) แทนการสืบทอด `channels.defaults.groupPolicy`

  </Accordion>
</AccordionGroup>

แบบจำลองทางความคิดอย่างรวดเร็ว (ลำดับการประเมินสำหรับข้อความกลุ่ม):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist)
  </Step>
  <Step title="รายการอนุญาตของกลุ่ม">
    รายการอนุญาตของกลุ่ม (`*.groups`, `*.groupAllowFrom`, รายการอนุญาตเฉพาะช่องทาง)
  </Step>
  <Step title="การควบคุมด้วยการกล่าวถึง">
    การควบคุมด้วยการกล่าวถึง (`requireMention`, `/activation`)
  </Step>
</Steps>

## การควบคุมด้วยการกล่าวถึง (ค่าเริ่มต้น)

ข้อความกลุ่มต้องมีการกล่าวถึง เว้นแต่จะถูกแทนที่เป็นรายกลุ่ม ค่าเริ่มต้นอยู่เป็นรายระบบย่อยภายใต้ `*.groups."*"`

การตอบกลับข้อความของบอตนับเป็นการกล่าวถึงโดยนัยเมื่อช่องทางรองรับเมทาดาทาการตอบกลับ การอ้างอิงข้อความของบอตก็สามารถนับเป็นการกล่าวถึงโดยนัยได้เช่นกันบนช่องทางที่เปิดเผยเมทาดาทาการอ้างอิง กรณีที่มีในตัวปัจจุบันรวมถึง Telegram, WhatsApp, Slack, Discord, Microsoft Teams และ ZaloUser

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

## กำหนดขอบเขตรูปแบบการกล่าวถึงที่ตั้งค่าไว้

`mentionPatterns` ที่ตั้งค่าไว้เป็นตัวกระตุ้นสำรองแบบ regex ใช้เมื่อ
แพลตฟอร์มไม่เปิดเผยการกล่าวถึงบอตแบบเนทีฟ หรือเมื่อคุณต้องการให้ข้อความธรรมดา
เช่น `openclaw:` นับเป็นการกล่าวถึง การกล่าวถึงแบบเนทีฟของแพลตฟอร์มจะแยกต่างหาก:
เมื่อ Discord, Slack, Telegram, Matrix หรือช่องทางอื่นสามารถพิสูจน์ได้ว่าข้อความ
กล่าวถึงบอตอย่างชัดเจน การกล่าวถึงแบบเนทีฟนั้นยังคงกระตุ้น แม้ว่า
รูปแบบ regex ที่กำหนดค่าไว้จะถูกปฏิเสธก็ตาม

โดยค่าเริ่มต้น รูปแบบการกล่าวถึงที่กำหนดค่าไว้จะใช้ทุกที่ที่ช่องทางนั้นส่ง
ข้อเท็จจริงของผู้ให้บริการและบทสนทนาเข้าสู่การตรวจจับการกล่าวถึง เพื่อป้องกันไม่ให้รูปแบบกว้าง ๆ
ปลุกเอเจนต์ในทุกกลุ่ม ให้กำหนดขอบเขตเป็นรายช่องทางด้วย
`channels.<channel>.mentionPatterns`

ใช้ `mode: "deny"` เมื่อรูปแบบการกล่าวถึง regex ควรปิดเป็นค่าเริ่มต้นสำหรับ
ช่องทางหนึ่ง จากนั้นเปิดใช้เฉพาะห้องด้วย `allowIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

ใช้ค่าเริ่มต้น `mode: "allow"` (หรือละ `mode`) เมื่อรูปแบบการกล่าวถึง regex
ควรใช้ได้กว้าง ๆ จากนั้นปิดในห้องที่มีเสียงรบกวนมากด้วย `denyIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

การแก้นโยบาย:

| ฟิลด์           | ผลลัพธ์                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | รูปแบบการกล่าวถึง regex จะเปิดใช้ เว้นแต่ ID บทสนทนาอยู่ใน `denyIn` นี่คือค่าเริ่มต้น                    |
| `mode: "deny"`  | รูปแบบการกล่าวถึง regex จะปิดใช้ เว้นแต่ ID บทสนทนาอยู่ใน `allowIn`                                       |
| `allowIn`       | ID บทสนทนาที่รูปแบบการกล่าวถึง regex เปิดใช้ในโหมดปฏิเสธ                                               |
| `denyIn`        | ID บทสนทนาที่รูปแบบการกล่าวถึง regex ปิดใช้ `denyIn` มีผลเหนือ `allowIn` หากทั้งสองมี ID เดียวกัน |

นโยบาย regex แบบกำหนดขอบเขตที่รองรับในวันนี้:

| ช่องทาง  | ID ที่ใช้ใน `allowIn` / `denyIn`                             |
| -------- | ------------------------------------------------------------ |
| Discord  | ID ช่อง Discord                                         |
| Matrix   | ID ห้อง Matrix                                             |
| Slack    | ID ช่อง Slack                                           |
| Telegram | ID แชตกลุ่ม หรือ `chatId:topic:threadId` สำหรับหัวข้อฟอรัม |
| WhatsApp | ID บทสนทนา WhatsApp เช่น `123@g.us`                |

การกำหนดค่าช่องทางระดับบัญชีสามารถตั้งค่านโยบายเดียวกันภายใต้
`channels.<channel>.accounts.<accountId>.mentionPatterns` เมื่อช่องทางนั้น
รองรับหลายบัญชี นโยบายบัญชีมีลำดับความสำคัญเหนือกว่านโยบายช่องทางระดับบนสุด
สำหรับบัญชีนั้น

<AccordionGroup>
  <Accordion title="หมายเหตุการควบคุมด้วยการกล่าวถึง">
    - `mentionPatterns` เป็นรูปแบบ regex ที่ปลอดภัยและไม่แยกตัวพิมพ์ใหญ่เล็ก รูปแบบที่ไม่ถูกต้องและรูปแบบการทำซ้ำซ้อนที่ไม่ปลอดภัยจะถูกละเว้น
    - พื้นผิวที่ให้การกล่าวถึงอย่างชัดเจนยังคงผ่าน รูปแบบ regex ที่กำหนดค่าไว้เป็นทางเลือกสำรอง
    - `channels.<channel>.mentionPatterns.mode: "deny"` ปิดใช้รูปแบบการกล่าวถึงที่กำหนดค่าไว้เป็นค่าเริ่มต้นสำหรับช่องทางนั้น เปิดบทสนทนาที่เลือกกลับเข้ามาด้วย `allowIn`
    - `channels.<channel>.mentionPatterns.denyIn` ปิดใช้รูปแบบการกล่าวถึงที่กำหนดค่าไว้สำหรับ ID บทสนทนาเฉพาะ ขณะที่ @mentions แบบเนทีฟของแพลตฟอร์มยังคงผ่าน
    - การแทนที่รายเอเจนต์: `agents.list[].groupChat.mentionPatterns` (มีประโยชน์เมื่อเอเจนต์หลายตัวใช้กลุ่มร่วมกัน)
    - การควบคุมด้วยการกล่าวถึงจะบังคับใช้เฉพาะเมื่อสามารถตรวจจับการกล่าวถึงได้ (มีการกล่าวถึงแบบเนทีฟหรือมีการกำหนดค่า `mentionPatterns`)
    - การใส่กลุ่มหรือผู้ส่งไว้ในรายการอนุญาตไม่ได้ปิดใช้การควบคุมด้วยการกล่าวถึง ให้ตั้งค่า `requireMention` ของกลุ่มนั้นเป็น `false` เมื่อข้อความทั้งหมดควรกระตุ้น
    - บริบทพรอมป์แชตกลุ่มอัตโนมัติจะนำคำสั่งตอบกลับแบบเงียบที่แก้แล้วไปด้วยทุกเทิร์น ไฟล์เวิร์กสเปซไม่ควรทำซ้ำกลไก `NO_REPLY`
    - กลุ่มที่อนุญาตให้ตอบกลับแบบเงียบอัตโนมัติจะถือว่าเทิร์นโมเดลที่ว่างสะอาดหรือมีเฉพาะการให้เหตุผลเป็นแบบเงียบ เทียบเท่า `NO_REPLY` แชตโดยตรงจะไม่ได้รับคำแนะนำ `NO_REPLY` และการตอบกลับกลุ่มที่ใช้เฉพาะเครื่องมือข้อความจะยังคงเงียบโดยไม่เรียก `message(action=send)`
    - การสนทนากลุ่มที่เปิดรับอยู่เสมอในพื้นหลังใช้ความหมายแบบคำขอของผู้ใช้เป็นค่าเริ่มต้น ตั้งค่า `messages.groupChat.unmentionedInbound: "room_event"` เพื่อส่งเป็นบริบทเงียบแทน ดู [เหตุการณ์ห้องในพื้นหลัง](/th/channels/ambient-room-events) สำหรับตัวอย่างการตั้งค่า
    - เหตุการณ์ห้องจะไม่ถูกจัดเก็บเป็นคำขอผู้ใช้ปลอม และข้อความผู้ช่วยส่วนตัวจากเหตุการณ์ห้องที่ไม่มีเครื่องมือข้อความจะไม่ถูกเล่นซ้ำเป็นประวัติแชต
    - ค่าเริ่มต้นของ Discord อยู่ใน `channels.discord.guilds."*"` (แทนที่ได้รายกิลด์/ช่อง)
    - บริบทประวัติกลุ่มถูกห่ออย่างสม่ำเสมอในทุกช่องทาง กลุ่มที่ควบคุมด้วยการกล่าวถึงจะเก็บข้อความที่ข้ามไว้ซึ่งยังค้างอยู่ กลุ่มที่เปิดอยู่เสมออาจเก็บข้อความห้องล่าสุดที่ประมวลผลแล้วไว้ด้วยเมื่อช่องทางรองรับ ใช้ `messages.groupChat.historyLimit` สำหรับค่าเริ่มต้นส่วนกลาง และ `channels.<channel>.historyLimit` (หรือ `channels.<channel>.accounts.*.historyLimit`) สำหรับการแทนที่ ตั้งค่า `0` เพื่อปิดใช้

  </Accordion>
</AccordionGroup>

## ข้อจำกัดเครื่องมือสำหรับกลุ่ม/ช่องทาง (ไม่บังคับ)

การกำหนดค่าช่องทางบางรายการรองรับการจำกัดว่าเครื่องมือใดพร้อมใช้งาน **ภายในกลุ่ม/ห้อง/ช่องเฉพาะ**

- `tools`: อนุญาต/ปฏิเสธเครื่องมือสำหรับทั้งกลุ่ม
- `toolsBySender`: การแทนที่รายผู้ส่งภายในกลุ่ม ใช้คำนำหน้าคีย์ที่ชัดเจน: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` และไวลด์การ์ด `"*"` ID ช่องใช้ ID ช่อง OpenClaw แบบบัญญัติ นามแฝงเช่น `teams` จะถูกทำให้เป็น `msteams` คีย์แบบเดิมที่ไม่มีคำนำหน้ายังคงยอมรับได้และจับคู่เป็น `id:` เท่านั้น

ลำดับการแก้ค่า (เฉพาะเจาะจงที่สุดชนะ):

<Steps>
  <Step title="toolsBySender ของกลุ่ม">
    การจับคู่ `toolsBySender` ของกลุ่ม/ช่อง
  </Step>
  <Step title="เครื่องมือของกลุ่ม">
    `tools` ของกลุ่ม/ช่อง
  </Step>
  <Step title="toolsBySender ค่าเริ่มต้น">
    การจับคู่ `toolsBySender` ค่าเริ่มต้น (`"*"`)
  </Step>
  <Step title="เครื่องมือค่าเริ่มต้น">
    `tools` ค่าเริ่มต้น (`"*"`)
  </Step>
</Steps>

ตัวอย่าง (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

<Note>
ข้อจำกัดเครื่องมือสำหรับกลุ่ม/ช่องทางจะถูกใช้เพิ่มเติมจากนโยบายเครื่องมือส่วนกลาง/เอเจนต์ (การปฏิเสธยังคงชนะ) บางช่องทางใช้การซ้อนที่แตกต่างกันสำหรับห้อง/ช่อง (เช่น Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`)
</Note>

## รายการอนุญาตของกลุ่ม

เมื่อกำหนดค่า `channels.whatsapp.groups`, `channels.telegram.groups` หรือ `channels.imessage.groups` คีย์จะทำหน้าที่เป็นรายการอนุญาตของกลุ่ม ใช้ `"*"` เพื่ออนุญาตทุกกลุ่มขณะที่ยังคงตั้งค่าลักษณะการกล่าวถึงเริ่มต้นไว้

<Warning>
ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่เหมือนกับการอนุญาตกลุ่ม สำหรับช่องทางที่รองรับการจับคู่ DM ที่เก็บข้อมูลการจับคู่จะปลดล็อกเฉพาะ DM เท่านั้น คำสั่งกลุ่มยังต้องมีการอนุญาตผู้ส่งในกลุ่มอย่างชัดเจนจาก allowlist ใน config เช่น `groupAllowFrom` หรือ config fallback ที่บันทึกไว้ในเอกสารสำหรับช่องทางนั้น
</Warning>

ความต้องการทั่วไป (คัดลอก/วาง):

<Tabs>
  <Tab title="Disable all group replies">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Allow only specific groups (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: {
            "123@g.us": { requireMention: true },
            "456@g.us": { requireMention: false },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Allow all groups but require mention">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Owner-only triggers (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## การเปิดใช้งาน (เฉพาะเจ้าของ)

เจ้าของกลุ่มสามารถสลับการเปิดใช้งานรายกลุ่มได้:

- `/activation mention`
- `/activation always`

เจ้าของจะถูกกำหนดโดย `channels.whatsapp.allowFrom` (หรือ E.164 ของตัวบอตเองเมื่อไม่ได้ตั้งค่า) ส่งคำสั่งเป็นข้อความเดี่ยว พื้นผิวอื่น ๆ จะเพิกเฉยต่อ `/activation` ในตอนนี้

## ฟิลด์บริบท

เพย์โหลดขาเข้าของกลุ่มตั้งค่า:

- `ChatType=group`
- `GroupSubject` (หากทราบ)
- `GroupMembers` (หากทราบ)
- `WasMentioned` (ผลลัพธ์ของ mention gating)
- หัวข้อฟอรัมของ Telegram จะรวม `MessageThreadId` และ `IsForum` ด้วย

พรอมป์ระบบของเอเจนต์จะรวมบทนำของกลุ่มในเทิร์นแรกของเซสชันกลุ่มใหม่ ซึ่งเตือนโมเดลให้ตอบเหมือนมนุษย์ ลดบรรทัดว่าง และเว้นระยะข้อความตามแชตปกติ รวมถึงหลีกเลี่ยงการพิมพ์ลำดับ `\n` แบบตรงตัว กลุ่มที่ไม่ใช่ Telegram ยังไม่สนับสนุนตาราง Markdown ด้วย ส่วนคำแนะนำ rich-text ของ Telegram มาจากพรอมป์ช่องทาง Telegram ชื่อกลุ่มและป้ายชื่อผู้เข้าร่วมที่มาจากช่องทางจะแสดงเป็นเมทาดาทาที่ไม่น่าเชื่อถือแบบ fenced ไม่ใช่คำสั่งระบบแบบ inline

## รายละเอียดเฉพาะของ iMessage

- แนะนำให้ใช้ `chat_id:<id>` เมื่อ routing หรือ allowlisting
- แสดงรายการแชต: `imsg chats --limit 20`
- การตอบกลับกลุ่มจะกลับไปยัง `chat_id` เดิมเสมอ

## พรอมป์ระบบของ WhatsApp

ดู [WhatsApp](/th/channels/whatsapp#system-prompts) สำหรับกฎพรอมป์ระบบ WhatsApp ที่เป็น canonical รวมถึงการแก้ไขพรอมป์ของกลุ่มและแบบ direct, พฤติกรรม wildcard และ semantics ของ account override

## รายละเอียดเฉพาะของ WhatsApp

ดู [ข้อความกลุ่ม](/th/channels/group-messages) สำหรับพฤติกรรมเฉพาะของ WhatsApp (การฉีดประวัติ, รายละเอียดการจัดการการ mention)

## ที่เกี่ยวข้อง

- [กลุ่ม Broadcast](/th/channels/broadcast-groups)
- [การ routing ช่องทาง](/th/channels/channel-routing)
- [ข้อความกลุ่ม](/th/channels/group-messages)
- [การจับคู่](/th/channels/pairing)
