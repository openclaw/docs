---
read_when:
    - การเปลี่ยนพฤติกรรมของแชทกลุ่มหรือการกำหนดเงื่อนไขการกล่าวถึง
sidebarTitle: Groups
summary: ลักษณะการทำงานของแชทกลุ่มในพื้นผิวต่าง ๆ (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: กลุ่ม
x-i18n:
    generated_at: "2026-04-30T09:36:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 743dc1ce1a0e5dc5c6d66091854cdcbb8d2b8f7e06b5c1d13c272142265fc998
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw ปฏิบัติต่อแชตกลุ่มอย่างสอดคล้องกันในทุกพื้นผิว: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## บทนำสำหรับผู้เริ่มต้น (2 นาที)

OpenClaw "อาศัยอยู่" บนบัญชีรับส่งข้อความของคุณเอง ไม่มีผู้ใช้บอต WhatsApp แยกต่างหาก หาก **คุณ** อยู่ในกลุ่ม OpenClaw จะเห็นกลุ่มนั้นและตอบกลับที่นั่นได้

พฤติกรรมเริ่มต้น:

- กลุ่มถูกจำกัด (`groupPolicy: "allowlist"`)
- การตอบกลับต้องมีการกล่าวถึง เว้นแต่คุณจะปิดการกำหนดให้ต้องกล่าวถึงอย่างชัดเจน
- การตอบกลับสุดท้ายตามปกติในกลุ่ม/ช่องเป็นแบบส่วนตัวโดยค่าเริ่มต้น เอาต์พุตที่มองเห็นได้ในห้องใช้เครื่องมือ `message`

แปลความได้ว่า: ผู้ส่งที่อยู่ในรายการอนุญาตสามารถกระตุ้น OpenClaw ได้โดยกล่าวถึง OpenClaw

<Note>
**สรุปสั้น**

- **การเข้าถึง DM** ควบคุมโดย `*.allowFrom`
- **การเข้าถึงกลุ่ม** ควบคุมโดย `*.groupPolicy` + รายการอนุญาต (`*.groups`, `*.groupAllowFrom`)
- **การกระตุ้นการตอบกลับ** ควบคุมโดยการกำหนดให้ต้องกล่าวถึง (`requireMention`, `/activation`)

</Note>

โฟลว์แบบเร็ว (สิ่งที่เกิดขึ้นกับข้อความกลุ่ม):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## การตอบกลับที่มองเห็นได้

สำหรับห้องกลุ่ม/ช่อง OpenClaw มีค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`
นั่นหมายความว่า agent ยังคงประมวลผลรอบนั้นและสามารถอัปเดตสถานะหน่วยความจำ/เซสชันได้ แต่คำตอบสุดท้ายตามปกติของ agent จะไม่ถูกโพสต์กลับเข้าไปในห้องโดยอัตโนมัติ หากต้องการพูดให้มองเห็นได้ agent จะใช้ `message(action=send)`

สำหรับแชตโดยตรงและรอบจากแหล่งอื่นใด ให้ใช้ `messages.visibleReplies: "message_tool"` เพื่อใช้พฤติกรรมการตอบกลับที่มองเห็นได้แบบผ่านเครื่องมือเท่านั้นแบบเดียวกันทั่วระบบ `messages.groupChat.visibleReplies` ยังคงเป็นการแทนที่ที่เฉพาะเจาะจงกว่าสำหรับห้องกลุ่ม/ช่อง

สิ่งนี้แทนที่รูปแบบเก่าที่บังคับให้โมเดลตอบ `NO_REPLY` สำหรับรอบส่วนใหญ่ในโหมดเฝ้าดู ในโหมดผ่านเครื่องมือเท่านั้น การไม่ทำสิ่งใดที่มองเห็นได้หมายถึงการไม่เรียกใช้เครื่องมือ message

ตัวบ่งชี้การพิมพ์ยังคงถูกส่งขณะที่ agent ทำงานในโหมดผ่านเครื่องมือเท่านั้น โหมดการพิมพ์เริ่มต้นของกลุ่มถูกยกระดับจาก "message" เป็น "instant" สำหรับรอบเหล่านี้ เพราะอาจไม่มีข้อความผู้ช่วยตามปกติก่อนที่ agent จะตัดสินใจว่าจะเรียกใช้เครื่องมือ message หรือไม่ การตั้งค่าโหมดการพิมพ์อย่างชัดเจนยังคงมีผลเหนือกว่า

หากต้องการคืนค่าการตอบกลับสุดท้ายอัตโนมัติแบบเดิมสำหรับห้องกลุ่ม/ช่อง:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

หากต้องการกำหนดให้เอาต์พุตที่มองเห็นได้ต้องผ่านเครื่องมือ message สำหรับแชตต้นทางทุกแชต:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

คำสั่ง slash แบบเนทีฟ (Discord, Telegram และพื้นผิวอื่นที่รองรับคำสั่งเนทีฟ) จะข้าม `visibleReplies: "message_tool"` และตอบกลับแบบมองเห็นได้เสมอ เพื่อให้ UI คำสั่งเฉพาะช่องได้รับการตอบสนองตามที่คาดไว้ สิ่งนี้ใช้กับรอบคำสั่งเนทีฟที่ผ่านการตรวจสอบแล้วเท่านั้น คำสั่ง `/...` ที่พิมพ์เป็นข้อความและรอบแชตทั่วไปยังคงทำตามค่าเริ่มต้นของกลุ่มที่กำหนดไว้

## การมองเห็นบริบทและรายการอนุญาต

มีการควบคุมสองอย่างที่เกี่ยวข้องกับความปลอดภัยของกลุ่ม:

- **การอนุญาตให้กระตุ้น**: ใครสามารถกระตุ้น agent ได้ (`groupPolicy`, `groups`, `groupAllowFrom`, รายการอนุญาตเฉพาะช่อง)
- **การมองเห็นบริบท**: บริบทเสริมใดถูกแทรกเข้าไปในโมเดล (ข้อความตอบกลับ, คำพูดอ้างอิง, ประวัติเธรด, เมตาดาตาที่ส่งต่อ)

โดยค่าเริ่มต้น OpenClaw ให้ความสำคัญกับพฤติกรรมแชตตามปกติและคงบริบทส่วนใหญ่ไว้ตามที่ได้รับมา ซึ่งหมายความว่ารายการอนุญาตส่วนใหญ่ใช้ตัดสินว่าใครสามารถกระตุ้นการดำเนินการได้ ไม่ใช่ขอบเขตการปกปิดข้อมูลแบบสากลสำหรับทุกส่วนข้อความที่ถูกอ้างอิงหรือในประวัติ

<AccordionGroup>
  <Accordion title="พฤติกรรมปัจจุบันขึ้นกับแต่ละช่อง">
    - บางช่องใช้การกรองตามผู้ส่งกับบริบทเสริมในเส้นทางเฉพาะอยู่แล้ว (เช่น การตั้งต้นเธรดของ Slack, การค้นหาการตอบกลับ/เธรดของ Matrix)
    - ช่องอื่นยังส่งผ่านบริบทคำพูดอ้างอิง/การตอบกลับ/การส่งต่อตามที่ได้รับมา

  </Accordion>
  <Accordion title="ทิศทางการเสริมความแข็งแกร่ง (วางแผนไว้)">
    - `contextVisibility: "all"` (ค่าเริ่มต้น) คงพฤติกรรมปัจจุบันแบบตามที่ได้รับมา
    - `contextVisibility: "allowlist"` กรองบริบทเสริมให้เหลือผู้ส่งที่อยู่ในรายการอนุญาต
    - `contextVisibility: "allowlist_quote"` คือ `allowlist` พร้อมข้อยกเว้นคำพูดอ้างอิง/การตอบกลับอย่างชัดเจนหนึ่งรายการ

    จนกว่าโมเดลการเสริมความแข็งแกร่งนี้จะถูกใช้อย่างสอดคล้องกันในทุกช่อง ให้คาดหวังความแตกต่างตามพื้นผิว

  </Accordion>
</AccordionGroup>

![โฟลว์ข้อความกลุ่ม](/images/groups-flow.svg)

หากคุณต้องการ...

| เป้าหมาย | สิ่งที่ต้องตั้งค่า |
| -------------------------------------------- | ---------------------------------------------------------- |
| อนุญาตทุกกลุ่มแต่ตอบกลับเฉพาะเมื่อมี @mentions | `groups: { "*": { requireMention: true } }` |
| ปิดการตอบกลับกลุ่มทั้งหมด | `groupPolicy: "disabled"` |
| เฉพาะกลุ่มที่ระบุ | `groups: { "<group-id>": { ... } }` (ไม่มีคีย์ `"*"`) |
| มีเพียงคุณที่กระตุ้นในกลุ่มได้ | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## คีย์เซสชัน

- เซสชันกลุ่มใช้คีย์เซสชัน `agent:<agentId>:<channel>:group:<id>` (ห้อง/ช่องใช้ `agent:<agentId>:<channel>:channel:<id>`)
- หัวข้อฟอรัม Telegram เพิ่ม `:topic:<threadId>` ต่อท้าย ID กลุ่มเพื่อให้แต่ละหัวข้อมีเซสชันของตัวเอง
- แชตโดยตรงใช้เซสชันหลัก (หรือแยกตามผู้ส่งหากกำหนดไว้)
- Heartbeats จะถูกข้ามสำหรับเซสชันกลุ่ม

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## รูปแบบ: DM ส่วนตัว + กลุ่มสาธารณะ (agent เดียว)

ใช่ วิธีนี้ทำงานได้ดีหากทราฟฟิก "ส่วนตัว" ของคุณคือ **DMs** และทราฟฟิก "สาธารณะ" ของคุณคือ **กลุ่ม**

เหตุผล: ในโหมด agent เดียว DMs มักเข้าไปอยู่ในคีย์เซสชัน **หลัก** (`agent:main:main`) ขณะที่กลุ่มใช้คีย์เซสชัน **ที่ไม่ใช่หลัก** เสมอ (`agent:main:<channel>:group:<id>`) หากคุณเปิดใช้ sandboxing ด้วย `mode: "non-main"` เซสชันกลุ่มเหล่านั้นจะรันในแบ็กเอนด์ sandbox ที่กำหนดไว้ ขณะที่เซสชัน DM หลักของคุณยังคงอยู่บนโฮสต์ Docker เป็นแบ็กเอนด์เริ่มต้นหากคุณไม่ได้เลือกอย่างอื่น

สิ่งนี้ให้ "สมอง" agent หนึ่งชุด (พื้นที่ทำงาน + หน่วยความจำร่วมกัน) แต่มีท่าทางการดำเนินการสองแบบ:

- **DMs**: เครื่องมือเต็มรูปแบบ (โฮสต์)
- **กลุ่ม**: sandbox + เครื่องมือที่ถูกจำกัด

<Note>
หากคุณต้องการพื้นที่ทำงาน/บุคลิกที่แยกจากกันจริง ๆ ("ส่วนตัว" และ "สาธารณะ" ต้องไม่ปะปนกันเลย) ให้ใช้ agent ตัวที่สอง + การผูก ดู [การกำหนดเส้นทางหลาย Agent](/th/concepts/multi-agent)
</Note>

<Tabs>
  <Tab title="DMs บนโฮสต์, กลุ่มอยู่ใน sandbox">
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
  <Tab title="กลุ่มเห็นเฉพาะโฟลเดอร์ที่อยู่ในรายการอนุญาต">
    ต้องการให้ "กลุ่มเห็นได้เฉพาะโฟลเดอร์ X" แทน "ไม่มีการเข้าถึงโฮสต์" หรือไม่ ให้คง `workspaceAccess: "none"` และเมาต์เฉพาะพาธที่อยู่ในรายการอนุญาตเข้าไปใน sandbox:

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

- คีย์การกำหนดค่าและค่าเริ่มต้น: [การกำหนดค่า Gateway](/th/gateway/config-agents#agentsdefaultssandbox)
- การดีบักว่าเหตุใดเครื่องมือจึงถูกบล็อก: [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated)
- รายละเอียด bind mounts: [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts)

## ป้ายชื่อที่แสดง

- ป้ายชื่อ UI ใช้ `displayName` เมื่อมี โดยจัดรูปแบบเป็น `<channel>:<token>`
- `#room` สงวนไว้สำหรับห้อง/ช่อง แชตกลุ่มใช้ `g-<slug>` (ตัวพิมพ์เล็ก, ช่องว่าง -> `-`, คง `#@+._-` ไว้)

## นโยบายกลุ่ม

ควบคุมวิธีจัดการข้อความกลุ่ม/ห้องต่อแต่ละช่อง:

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

| นโยบาย | พฤติกรรม |
| ------------- | ------------------------------------------------------------ |
| `"open"` | กลุ่มข้ามรายการอนุญาต; การกำหนดให้ต้องกล่าวถึงยังคงมีผล |
| `"disabled"` | บล็อกข้อความกลุ่มทั้งหมดโดยสมบูรณ์ |
| `"allowlist"` | อนุญาตเฉพาะกลุ่ม/ห้องที่ตรงกับรายการอนุญาตที่กำหนดไว้ |

<AccordionGroup>
  <Accordion title="หมายเหตุต่อแต่ละช่อง">
    - `groupPolicy` แยกจากการกำหนดให้ต้องกล่าวถึง (ซึ่งต้องใช้ @mentions)
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: ใช้ `groupAllowFrom` (ทางสำรอง: `allowFrom` ที่ระบุอย่างชัดเจน)
    - การอนุมัติการจับคู่ DM (รายการใน store `*-allowFrom`) ใช้กับการเข้าถึง DM เท่านั้น การอนุญาตผู้ส่งในกลุ่มยังคงต้องระบุอย่างชัดเจนในรายการอนุญาตของกลุ่ม
    - Discord: รายการอนุญาตใช้ `channels.discord.guilds.<id>.channels`
    - Slack: รายการอนุญาตใช้ `channels.slack.channels`
    - Matrix: รายการอนุญาตใช้ `channels.matrix.groups` ควรใช้ ID ห้องหรือ alias การค้นหาชื่อห้องที่เข้าร่วมเป็นแบบพยายามอย่างดีที่สุด และชื่อที่แก้ไม่สำเร็จจะถูกละเว้นตอนรันไทม์ ใช้ `channels.matrix.groupAllowFrom` เพื่อจำกัดผู้ส่ง รองรับรายการอนุญาต `users` ต่อห้องด้วย
    - กลุ่ม DM ถูกควบคุมแยกต่างหาก (`channels.discord.dm.*`, `channels.slack.dm.*`)
    - รายการอนุญาต Telegram สามารถจับคู่ ID ผู้ใช้ (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) หรือชื่อผู้ใช้ (`"@alice"` หรือ `"alice"`) ได้ prefix ไม่คำนึงถึงตัวพิมพ์เล็กใหญ่
    - ค่าเริ่มต้นคือ `groupPolicy: "allowlist"` หากรายการอนุญาตของกลุ่มว่าง ข้อความกลุ่มจะถูกบล็อก
    - ความปลอดภัยตอนรันไทม์: เมื่อบล็อก provider หายไปทั้งบล็อก (`channels.<provider>` ไม่มีอยู่) นโยบายกลุ่มจะย้อนกลับไปใช้โหมดปิดเมื่อไม่แน่ใจ (โดยทั่วไปคือ `allowlist`) แทนที่จะสืบทอด `channels.defaults.groupPolicy`

  </Accordion>
</AccordionGroup>

โมเดลคิดแบบเร็ว (ลำดับการประเมินสำหรับข้อความกลุ่ม):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist)
  </Step>
  <Step title="รายการอนุญาตกลุ่ม">
    รายการอนุญาตกลุ่ม (`*.groups`, `*.groupAllowFrom`, รายการอนุญาตเฉพาะช่อง)
  </Step>
  <Step title="การกำหนดให้ต้องกล่าวถึง">
    การกำหนดให้ต้องกล่าวถึง (`requireMention`, `/activation`)
  </Step>
</Steps>

## การกำหนดให้ต้องกล่าวถึง (ค่าเริ่มต้น)

ข้อความกลุ่มต้องมีการกล่าวถึง เว้นแต่จะถูกแทนที่ต่อกลุ่ม ค่าเริ่มต้นอยู่ต่อแต่ละระบบย่อยภายใต้ `*.groups."*"`.

การตอบกลับข้อความของบอทนับเป็นการกล่าวถึงโดยนัยเมื่อช่องทางรองรับเมทาดาต้าการตอบกลับ การอ้างอิงข้อความของบอทก็สามารถนับเป็นการกล่าวถึงโดยนัยบนช่องทางที่เปิดเผยเมทาดาต้าการอ้างอิงได้เช่นกัน กรณีในตัวปัจจุบันรวมถึง Telegram, WhatsApp, Slack, Discord, Microsoft Teams และ ZaloUser

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

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับการควบคุมด้วยการกล่าวถึง">
    - `mentionPatterns` เป็นรูปแบบ regex ที่ปลอดภัยและไม่สนตัวพิมพ์เล็กใหญ่ รูปแบบที่ไม่ถูกต้องและรูปแบบการทำซ้ำซ้อนที่ไม่ปลอดภัยจะถูกละเว้น
    - พื้นผิวที่ให้การกล่าวถึงแบบชัดเจนยังคงผ่านได้ รูปแบบเป็นตัวสำรอง
    - การแทนที่รายเอเจนต์: `agents.list[].groupChat.mentionPatterns` (มีประโยชน์เมื่อหลายเอเจนต์แชร์กลุ่มเดียวกัน)
    - การควบคุมด้วยการกล่าวถึงจะบังคับใช้เฉพาะเมื่อสามารถตรวจจับการกล่าวถึงได้ (มีการกำหนดค่าการกล่าวถึงแบบเนทีฟหรือ `mentionPatterns`)
    - บริบทพรอมป์แชตกลุ่มจะพกคำสั่งตอบกลับแบบเงียบที่แก้ไขแล้วในทุกเทิร์น ไฟล์เวิร์กสเปซไม่ควรทำกลไก `NO_REPLY` ซ้ำ
    - กลุ่มที่อนุญาตการตอบกลับแบบเงียบจะถือว่าเทิร์นของโมเดลที่ว่างเปล่าสะอาดหรือมีเฉพาะเหตุผลเป็นแบบเงียบ เทียบเท่ากับ `NO_REPLY` แชตโดยตรงทำแบบเดียวกันเฉพาะเมื่ออนุญาตการตอบกลับแบบเงียบโดยตรงอย่างชัดเจน มิฉะนั้นการตอบกลับว่างเปล่ายังคงเป็นเทิร์นเอเจนต์ที่ล้มเหลว
    - ค่าเริ่มต้นของ Discord อยู่ใน `channels.discord.guilds."*"` (แทนที่ได้ต่อกิลด์/ช่อง)
    - บริบทประวัติกลุ่มถูกห่ออย่างสม่ำเสมอข้ามช่องทางและเป็นแบบ **pending-only** (ข้อความที่ข้ามไปเพราะการควบคุมด้วยการกล่าวถึง); ใช้ `messages.groupChat.historyLimit` สำหรับค่าเริ่มต้นส่วนกลาง และ `channels.<channel>.historyLimit` (หรือ `channels.<channel>.accounts.*.historyLimit`) สำหรับการแทนที่ ตั้งค่า `0` เพื่อปิดใช้งาน

  </Accordion>
</AccordionGroup>

## ข้อจำกัดเครื่องมือของกลุ่ม/ช่องทาง (ไม่บังคับ)

การกำหนดค่าบางช่องทางรองรับการจำกัดว่าเครื่องมือใดพร้อมใช้งาน **ภายในกลุ่ม/ห้อง/ช่องทางที่ระบุ**

- `tools`: อนุญาต/ปฏิเสธเครื่องมือสำหรับทั้งกลุ่ม
- `toolsBySender`: การแทนที่ต่อผู้ส่งภายในกลุ่ม ใช้คำนำหน้าคีย์แบบชัดเจน: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` และ wildcard `"*"` คีย์แบบเก่าที่ไม่มีคำนำหน้ายังคงยอมรับและจับคู่เป็น `id:` เท่านั้น

ลำดับการตัดสินผล (ตัวที่เฉพาะเจาะจงที่สุดชนะ):

<Steps>
  <Step title="Group toolsBySender">
    จับคู่ `toolsBySender` ของกลุ่ม/ช่องทาง
  </Step>
  <Step title="Group tools">
    `tools` ของกลุ่ม/ช่องทาง
  </Step>
  <Step title="Default toolsBySender">
    จับคู่ `toolsBySender` เริ่มต้น (`"*"`)
  </Step>
  <Step title="Default tools">
    `tools` เริ่มต้น (`"*"`)
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
ข้อจำกัดเครื่องมือของกลุ่ม/ช่องทางจะถูกนำไปใช้เพิ่มเติมจากนโยบายเครื่องมือส่วนกลาง/เอเจนต์ (การปฏิเสธยังคงชนะ) บางช่องทางใช้การซ้อนสำหรับห้อง/ช่องทางต่างกัน (เช่น Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`)
</Note>

## allowlist ของกลุ่ม

เมื่อกำหนดค่า `channels.whatsapp.groups`, `channels.telegram.groups` หรือ `channels.imessage.groups` คีย์จะทำหน้าที่เป็น allowlist ของกลุ่ม ใช้ `"*"` เพื่ออนุญาตทุกกลุ่มในขณะที่ยังตั้งค่าพฤติกรรมการกล่าวถึงเริ่มต้นได้

<Warning>
ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่เหมือนกับการอนุญาตกลุ่ม สำหรับช่องทางที่รองรับการจับคู่ DM ที่เก็บการจับคู่จะปลดล็อกเฉพาะ DM เท่านั้น คำสั่งกลุ่มยังต้องมีการอนุญาตผู้ส่งกลุ่มอย่างชัดเจนจาก allowlist ในการกำหนดค่า เช่น `groupAllowFrom` หรือ fallback การกำหนดค่าที่บันทึกไว้สำหรับช่องทางนั้น
</Warning>

เจตนาที่พบบ่อย (คัดลอก/วาง):

<Tabs>
  <Tab title="ปิดใช้งานการตอบกลับกลุ่มทั้งหมด">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="อนุญาตเฉพาะกลุ่มที่ระบุ (WhatsApp)">
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
  <Tab title="อนุญาตทุกกลุ่มแต่ต้องกล่าวถึง">
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
  <Tab title="ทริกเกอร์เฉพาะเจ้าของ (WhatsApp)">
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

เจ้าของถูกกำหนดโดย `channels.whatsapp.allowFrom` (หรือ E.164 ของบอทเองเมื่อไม่ได้ตั้งค่า) ส่งคำสั่งเป็นข้อความเดี่ยว พื้นผิวอื่นในปัจจุบันจะละเว้น `/activation`

## ฟิลด์บริบท

เพย์โหลดขาเข้าของกลุ่มตั้งค่า:

- `ChatType=group`
- `GroupSubject` (ถ้าทราบ)
- `GroupMembers` (ถ้าทราบ)
- `WasMentioned` (ผลการควบคุมด้วยการกล่าวถึง)
- หัวข้อฟอรัมของ Telegram ยังรวม `MessageThreadId` และ `IsForum` ด้วย

หมายเหตุเฉพาะช่องทาง:

- BlueBubbles สามารถเสริมข้อมูลผู้เข้าร่วมกลุ่ม macOS ที่ไม่มีชื่อจากฐานข้อมูลรายชื่อติดต่อในเครื่องก่อนเติม `GroupMembers` ได้ตามตัวเลือก ค่านี้ปิดอยู่โดยค่าเริ่มต้นและจะทำงานหลังจากการควบคุมกลุ่มตามปกติผ่านแล้วเท่านั้น

พรอมป์ระบบของเอเจนต์รวมบทนำกลุ่มในเทิร์นแรกของเซสชันกลุ่มใหม่ โดยเตือนโมเดลให้ตอบเหมือนมนุษย์ หลีกเลี่ยงตาราง Markdown ลดบรรทัดว่างและใช้ระยะห่างแชตตามปกติ และหลีกเลี่ยงการพิมพ์ลำดับ `\n` แบบตัวอักษร ชื่อกลุ่มและป้ายชื่อผู้เข้าร่วมที่มาจากช่องทางจะแสดงเป็นเมทาดาต้าที่ไม่น่าเชื่อถือในกรอบโค้ด ไม่ใช่คำสั่งระบบแบบอินไลน์

## รายละเอียดเฉพาะของ iMessage

- ควรใช้ `chat_id:<id>` เมื่อกำหนดเส้นทางหรือเพิ่มใน allowlist
- แสดงรายการแชต: `imsg chats --limit 20`
- การตอบกลับกลุ่มจะกลับไปยัง `chat_id` เดิมเสมอ

## พรอมป์ระบบของ WhatsApp

ดู [WhatsApp](/th/channels/whatsapp#system-prompts) สำหรับกฎพรอมป์ระบบ WhatsApp มาตรฐาน รวมถึงการแก้ไขพรอมป์สำหรับกลุ่มและโดยตรง พฤติกรรม wildcard และความหมายของการแทนที่บัญชี

## รายละเอียดเฉพาะของ WhatsApp

ดู [ข้อความกลุ่ม](/th/channels/group-messages) สำหรับพฤติกรรมเฉพาะ WhatsApp (การฉีดประวัติ รายละเอียดการจัดการการกล่าวถึง)

## ที่เกี่ยวข้อง

- [กลุ่มกระจายข้อความ](/th/channels/broadcast-groups)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [ข้อความกลุ่ม](/th/channels/group-messages)
- [การจับคู่](/th/channels/pairing)
