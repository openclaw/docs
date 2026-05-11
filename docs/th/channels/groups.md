---
read_when:
    - การเปลี่ยนพฤติกรรมแชทกลุ่มหรือการควบคุมด้วยการเมนชัน
sidebarTitle: Groups
summary: พฤติกรรมการแชทกลุ่มในช่องทางต่าง ๆ (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: กลุ่ม
x-i18n:
    generated_at: "2026-05-11T20:20:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19297ef9c3043b00c4785567a7c02266bd08fe5228c8275c3233e87e917dd09f
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw ปฏิบัติต่อแชตกลุ่มอย่างสอดคล้องกันในทุกพื้นผิว: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## บทนำสำหรับผู้เริ่มต้น (2 นาที)

OpenClaw "อยู่" บนบัญชีรับส่งข้อความของคุณเอง ไม่มีผู้ใช้บอต WhatsApp แยกต่างหาก หาก **คุณ** อยู่ในกลุ่ม OpenClaw จะมองเห็นกลุ่มนั้นและตอบกลับที่นั่นได้

พฤติกรรมเริ่มต้น:

- กลุ่มถูกจำกัดไว้ (`groupPolicy: "allowlist"`)
- การตอบกลับต้องมีการกล่าวถึง เว้นแต่คุณจะปิดการกั้นด้วยการกล่าวถึงอย่างชัดเจน
- การตอบกลับสุดท้ายปกติในกลุ่ม/ช่องเป็นแบบส่วนตัวตามค่าเริ่มต้น เอาต์พุตที่มองเห็นได้ในห้องใช้เครื่องมือ `message`

แปลความได้ว่า: ผู้ส่งที่อยู่ใน allowlist สามารถทริกเกอร์ OpenClaw ได้ด้วยการกล่าวถึงมัน

<Note>
**สรุปสั้น ๆ**

- **การเข้าถึง DM** ควบคุมด้วย `*.allowFrom`
- **การเข้าถึงกลุ่ม** ควบคุมด้วย `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`)
- **การทริกเกอร์การตอบกลับ** ควบคุมด้วยการกั้นด้วยการกล่าวถึง (`requireMention`, `/activation`)

</Note>

โฟลว์อย่างเร็ว (สิ่งที่เกิดขึ้นกับข้อความกลุ่ม):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## การตอบกลับที่มองเห็นได้

สำหรับห้องกลุ่ม/ช่อง OpenClaw ตั้งค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`
`openclaw doctor --fix` เขียนค่าเริ่มต้นนี้ลงในการกำหนดค่าช่องที่กำหนดค่าไว้แต่ละช่องที่ยังไม่มีค่านี้
นั่นหมายความว่าเอเจนต์ยังคงประมวลผลรอบสนทนาและอัปเดตสถานะหน่วยความจำ/เซสชันได้ แต่คำตอบสุดท้ายปกติจะไม่ถูกโพสต์กลับเข้าไปในห้องโดยอัตโนมัติ หากต้องการพูดให้มองเห็นได้ เอเจนต์จะใช้ `message(action=send)`

ค่าเริ่มต้นนี้ขึ้นอยู่กับโมเดล/รันไทม์ที่เรียกใช้เครื่องมือได้อย่างเชื่อถือได้ หากล็อกแสดงข้อความผู้ช่วยแต่ `didSendViaMessagingTool: false` แปลว่าโมเดลตอบแบบส่วนตัวแทนที่จะเรียกเครื่องมือ message นั่นไม่ใช่ความล้มเหลวในการส่งของ Discord/Slack/Telegram ให้ใช้โมเดลที่เรียกใช้เครื่องมือได้อย่างเชื่อถือได้สำหรับเซสชันกลุ่ม/ช่อง หรือตั้งค่า `messages.groupChat.visibleReplies: "automatic"` เพื่อกู้คืนการตอบกลับสุดท้ายที่มองเห็นได้แบบเดิม

หากเครื่องมือ message ไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะถอยกลับไปใช้การตอบกลับที่มองเห็นได้แบบอัตโนมัติแทนที่จะระงับการตอบสนองอย่างเงียบ ๆ
`openclaw doctor` จะเตือนเกี่ยวกับความไม่ตรงกันนี้

สำหรับแชตโดยตรงและรอบสนทนาจากแหล่งอื่น ๆ ให้ใช้ `messages.visibleReplies: "message_tool"` เพื่อใช้พฤติกรรมการตอบกลับที่มองเห็นได้แบบผ่านเครื่องมือเท่านั้นเหมือนกันทั่วทั้งระบบ ฮาร์เนสยังเลือกค่านี้เป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งค่าได้ด้วย; ฮาร์เนส Codex ทำเช่นนี้สำหรับแชตโดยตรงในโหมด Codex `messages.groupChat.visibleReplies` ยังคงเป็นการแทนที่ที่เฉพาะเจาะจงกว่าสำหรับห้องกลุ่ม/ช่อง

สิ่งนี้แทนที่รูปแบบเก่าที่บังคับให้โมเดลตอบ `NO_REPLY` สำหรับรอบสนทนาส่วนใหญ่ในโหมดเฝ้าดู ในโหมดผ่านเครื่องมือเท่านั้น การไม่ทำอะไรให้มองเห็นได้หมายถึงการไม่เรียกเครื่องมือ message

ยังคงส่งตัวบ่งชี้การพิมพ์ขณะเอเจนต์ทำงานในโหมดผ่านเครื่องมือเท่านั้น โหมดการพิมพ์เริ่มต้นของกลุ่มถูกอัปเกรดจาก "message" เป็น "instant" สำหรับรอบสนทนาเหล่านี้ เพราะอาจไม่มีข้อความผู้ช่วยปกติก่อนที่เอเจนต์จะตัดสินใจว่าจะเรียกเครื่องมือ message หรือไม่ การกำหนดค่าโหมดการพิมพ์อย่างชัดเจนยังคงมีผลเหนือกว่า

หากต้องการกู้คืนการตอบกลับสุดท้ายแบบอัตโนมัติเดิมสำหรับห้องกลุ่ม/ช่อง:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway จะโหลดการกำหนดค่า `messages` ใหม่แบบ hot-reload หลังจากบันทึกไฟล์ รีสตาร์ทเฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลดการกำหนดค่าใหม่ถูกปิดใช้งานในการปรับใช้

หากต้องการบังคับให้เอาต์พุตที่มองเห็นได้ต้องผ่านเครื่องมือ message สำหรับทุกแชตจากทุกแหล่ง:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

คำสั่งสแลชแบบเนทีฟ (Discord, Telegram และพื้นผิวอื่น ๆ ที่รองรับคำสั่งเนทีฟ) จะข้าม `visibleReplies: "message_tool"` และตอบกลับให้มองเห็นได้เสมอ เพื่อให้ UI คำสั่งเนทีฟของช่องได้รับการตอบสนองตามที่คาดหวัง สิ่งนี้ใช้กับรอบสนทนาคำสั่งเนทีฟที่ผ่านการตรวจสอบแล้วเท่านั้น; คำสั่ง `/...` ที่พิมพ์เป็นข้อความและรอบสนทนาแชตทั่วไปยังคงทำตามค่าเริ่มต้นของกลุ่มที่กำหนดไว้

## การมองเห็นบริบทและ allowlists

มีการควบคุมสองอย่างที่เกี่ยวข้องกับความปลอดภัยของกลุ่ม:

- **การอนุญาตให้ทริกเกอร์**: ใครสามารถทริกเกอร์เอเจนต์ได้ (`groupPolicy`, `groups`, `groupAllowFrom`, allowlists เฉพาะช่อง)
- **การมองเห็นบริบท**: บริบทเสริมใดที่ถูกฉีดเข้าไปในโมเดล (ข้อความตอบกลับ, คำอ้างอิง, ประวัติเธรด, เมทาดาทาที่ส่งต่อ)

ตามค่าเริ่มต้น OpenClaw ให้ความสำคัญกับพฤติกรรมแชตปกติและคงบริบทไว้เกือบตามที่ได้รับมา นั่นหมายความว่า allowlists โดยหลักแล้วใช้ตัดสินว่าใครสามารถทริกเกอร์การดำเนินการได้ ไม่ใช่ขอบเขตการปกปิดข้อมูลแบบสากลสำหรับทุกส่วนข้อความที่ถูกอ้างอิงหรือในประวัติ

<AccordionGroup>
  <Accordion title="Current behavior is channel-specific">
    - บางช่องใช้การกรองตามผู้ส่งกับบริบทเสริมในพาธเฉพาะอยู่แล้ว (เช่น การตั้งต้นเธรด Slack, การค้นหาการตอบกลับ/เธรดของ Matrix)
    - ช่องอื่น ๆ ยังส่งบริบทคำอ้างอิง/การตอบกลับ/การส่งต่อต่อไปตามที่ได้รับมา

  </Accordion>
  <Accordion title="Hardening direction (planned)">
    - `contextVisibility: "all"` (ค่าเริ่มต้น) คงพฤติกรรมปัจจุบันแบบตามที่ได้รับมา
    - `contextVisibility: "allowlist"` กรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่อยู่ใน allowlist
    - `contextVisibility: "allowlist_quote"` คือ `allowlist` พร้อมข้อยกเว้นคำอ้างอิง/การตอบกลับแบบชัดเจนหนึ่งรายการ

    จนกว่าโมเดลการทำให้แข็งแรงนี้จะถูกนำไปใช้ให้สอดคล้องกันทั่วทุกช่อง ให้คาดหมายความแตกต่างตามพื้นผิว

  </Accordion>
</AccordionGroup>

![ผังการไหลของข้อความกลุ่ม](/images/groups-flow.svg)

หากคุณต้องการ...

| เป้าหมาย                                         | สิ่งที่ต้องตั้งค่า                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| อนุญาตทุกกลุ่มแต่ตอบกลับเฉพาะเมื่อ @mentions | `groups: { "*": { requireMention: true } }`                |
| ปิดการตอบกลับกลุ่มทั้งหมด                    | `groupPolicy: "disabled"`                                  |
| เฉพาะกลุ่มที่ระบุ                         | `groups: { "<group-id>": { ... } }` (ไม่มีคีย์ `"*"` )         |
| มีเพียงคุณเท่านั้นที่ทริกเกอร์ในกลุ่มได้               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| ใช้ชุดผู้ส่งที่เชื่อถือได้ชุดเดียวซ้ำข้ามช่อง | `groupAllowFrom: ["accessGroup:operators"]`                |

สำหรับ allowlists ผู้ส่งที่ใช้ซ้ำได้ ดู [กลุ่มการเข้าถึง](/th/channels/access-groups)

## คีย์เซสชัน

- เซสชันกลุ่มใช้คีย์เซสชัน `agent:<agentId>:<channel>:group:<id>` (ห้อง/ช่องใช้ `agent:<agentId>:<channel>:channel:<id>`)
- หัวข้อฟอรัม Telegram เพิ่ม `:topic:<threadId>` ต่อท้ายรหัสกลุ่ม เพื่อให้แต่ละหัวข้อมีเซสชันของตัวเอง
- แชตโดยตรงใช้เซสชันหลัก (หรือแยกตามผู้ส่งหากกำหนดค่าไว้)
- Heartbeats จะถูกข้ามสำหรับเซสชันกลุ่ม

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## รูปแบบ: DM ส่วนตัว + กลุ่มสาธารณะ (เอเจนต์เดียว)

ใช่ — วิธีนี้ใช้ได้ดีหากทราฟฟิก "ส่วนตัว" ของคุณคือ **DM** และทราฟฟิก "สาธารณะ" ของคุณคือ **กลุ่ม**

เหตุผล: ในโหมดเอเจนต์เดียว DM มักเข้าไปยังคีย์เซสชัน **หลัก** (`agent:main:main`) ขณะที่กลุ่มจะใช้คีย์เซสชัน **ที่ไม่ใช่หลัก** เสมอ (`agent:main:<channel>:group:<id>`) หากคุณเปิดใช้แซนด์บ็อกซ์ด้วย `mode: "non-main"` เซสชันกลุ่มเหล่านั้นจะทำงานในแบ็กเอนด์แซนด์บ็อกซ์ที่กำหนดค่าไว้ ขณะที่เซสชัน DM หลักของคุณยังคงอยู่บนโฮสต์ Docker เป็นแบ็กเอนด์เริ่มต้นหากคุณไม่ได้เลือกอย่างอื่น

สิ่งนี้ให้ "สมอง" เอเจนต์หนึ่งชุดแก่คุณ (พื้นที่ทำงาน + หน่วยความจำที่ใช้ร่วมกัน) แต่มีท่าทางการดำเนินงานสองแบบ:

- **DM**: เครื่องมือเต็มรูปแบบ (โฮสต์)
- **กลุ่ม**: แซนด์บ็อกซ์ + เครื่องมือที่ถูกจำกัด

<Note>
หากคุณต้องการพื้นที่ทำงาน/บุคลิกที่แยกจากกันอย่างแท้จริง ("ส่วนตัว" และ "สาธารณะ" ต้องไม่ปะปนกันเลย) ให้ใช้เอเจนต์ตัวที่สอง + การผูก ดู [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
</Note>

<Tabs>
  <Tab title="DMs on host, groups sandboxed">
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
  <Tab title="Groups see only an allowlisted folder">
    ต้องการให้ "กลุ่มเห็นได้เฉพาะโฟลเดอร์ X" แทนที่จะเป็น "ไม่มีการเข้าถึงโฮสต์" ใช่ไหม ให้คง `workspaceAccess: "none"` ไว้และเมานต์เฉพาะพาธที่อยู่ใน allowlist เข้าไปในแซนด์บ็อกซ์:

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
- การดีบักว่าเหตุใดเครื่องมือจึงถูกบล็อก: [แซนด์บ็อกซ์ เทียบกับนโยบายเครื่องมือ เทียบกับการยกระดับ](/th/gateway/sandbox-vs-tool-policy-vs-elevated)
- รายละเอียดการเมานต์แบบ bind: [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing#custom-bind-mounts)

## ป้ายกำกับที่แสดง

- ป้ายกำกับ UI ใช้ `displayName` เมื่อมี โดยจัดรูปแบบเป็น `<channel>:<token>`
- `#room` ถูกสงวนไว้สำหรับห้อง/ช่อง; แชตกลุ่มใช้ `g-<slug>` (ตัวพิมพ์เล็ก, ช่องว่าง -> `-`, คง `#@+._-` ไว้)

## นโยบายกลุ่ม

ควบคุมวิธีจัดการข้อความกลุ่ม/ห้องในแต่ละช่อง:

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

| นโยบาย        | พฤติกรรม                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | กลุ่มข้าม allowlists; การกั้นด้วยการกล่าวถึงยังคงมีผล      |
| `"disabled"`  | บล็อกข้อความกลุ่มทั้งหมดโดยสิ้นเชิง                           |
| `"allowlist"` | อนุญาตเฉพาะกลุ่ม/ห้องที่ตรงกับ allowlist ที่กำหนดค่าไว้ |

<AccordionGroup>
  <Accordion title="หมายเหตุตามช่องทาง">
    - `groupPolicy` แยกจากการควบคุมด้วยการ mention (ซึ่งต้องใช้ @mentions)
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: ใช้ `groupAllowFrom` (สำรอง: `allowFrom` แบบระบุชัดเจน)
    - Signal: `groupAllowFrom` สามารถตรงกับ id กลุ่ม Signal ขาเข้า หรือโทรศัพท์/UUID ของผู้ส่งก็ได้
    - การอนุมัติการจับคู่ DM (รายการใน store `*-allowFrom`) ใช้กับการเข้าถึง DM เท่านั้น; การอนุญาตผู้ส่งในกลุ่มยังคงต้องระบุอย่างชัดเจนใน allowlist ของกลุ่ม
    - Discord: allowlist ใช้ `channels.discord.guilds.<id>.channels`
    - Slack: allowlist ใช้ `channels.slack.channels`
    - Matrix: allowlist ใช้ `channels.matrix.groups` ควรใช้ ID ห้องหรือ alias; การค้นหาชื่อห้องที่เข้าร่วมแล้วเป็นแบบพยายามให้ดีที่สุด และชื่อที่แก้ไม่ได้จะถูกละเว้นตอน runtime ใช้ `channels.matrix.groupAllowFrom` เพื่อจำกัดผู้ส่ง; รองรับ allowlist `users` ต่อห้องด้วย
    - DM แบบกลุ่มถูกควบคุมแยกต่างหาก (`channels.discord.dm.*`, `channels.slack.dm.*`)
    - allowlist ของ Telegram สามารถตรงกับ ID ผู้ใช้ (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) หรือชื่อผู้ใช้ (`"@alice"` หรือ `"alice"`); prefix ไม่แยกตัวพิมพ์เล็กใหญ่
    - ค่าเริ่มต้นคือ `groupPolicy: "allowlist"`; หาก allowlist ของกลุ่มว่าง ข้อความกลุ่มจะถูกบล็อก
    - ความปลอดภัยตอน runtime: เมื่อไม่มีบล็อก provider เลย (`channels.<provider>` ไม่มีอยู่) นโยบายกลุ่มจะ fallback ไปเป็นโหมด fail-closed (โดยทั่วไปคือ `allowlist`) แทนการสืบทอด `channels.defaults.groupPolicy`

  </Accordion>
</AccordionGroup>

โมเดลคิดแบบเร็ว (ลำดับการประเมินสำหรับข้อความกลุ่ม):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist)
  </Step>
  <Step title="allowlist ของกลุ่ม">
    allowlist ของกลุ่ม (`*.groups`, `*.groupAllowFrom`, allowlist เฉพาะช่องทาง)
  </Step>
  <Step title="การควบคุมด้วยการ mention">
    การควบคุมด้วยการ mention (`requireMention`, `/activation`)
  </Step>
</Steps>

## การควบคุมด้วยการ mention (ค่าเริ่มต้น)

ข้อความกลุ่มต้องมีการ mention เว้นแต่จะ override ต่อกลุ่ม ค่าเริ่มต้นอยู่ต่อ subsystem ภายใต้ `*.groups."*"`

การตอบกลับข้อความของบอตนับเป็นการ mention โดยนัยเมื่อช่องทางรองรับ metadata การตอบกลับ การ quote ข้อความของบอตสามารถนับเป็นการ mention โดยนัยได้เช่นกันบนช่องทางที่เปิดเผย metadata การ quote กรณี built-in ปัจจุบันรวมถึง Telegram, WhatsApp, Slack, Discord, Microsoft Teams และ ZaloUser

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
  <Accordion title="หมายเหตุการควบคุมด้วยการ mention">
    - `mentionPatterns` เป็น pattern regex ที่ปลอดภัยและไม่แยกตัวพิมพ์เล็กใหญ่; pattern ที่ไม่ถูกต้องและรูปแบบการทำซ้ำซ้อนที่ไม่ปลอดภัยจะถูกละเว้น
    - พื้นผิวที่ให้การ mention แบบชัดเจนยังคงผ่าน; pattern เป็น fallback
    - override ต่อ agent: `agents.list[].groupChat.mentionPatterns` (มีประโยชน์เมื่อหลาย agent ใช้กลุ่มร่วมกัน)
    - การควบคุมด้วยการ mention จะบังคับใช้เฉพาะเมื่อสามารถตรวจจับ mention ได้ (มี native mentions หรือกำหนดค่า `mentionPatterns`)
    - การเพิ่มกลุ่มหรือผู้ส่งเข้า allowlist ไม่ได้ปิดการควบคุมด้วยการ mention; ตั้งค่า `requireMention` ของกลุ่มนั้นเป็น `false` เมื่อทุกข้อความควรกระตุ้นการทำงาน
    - บริบท prompt ของแชตกลุ่มพกคำสั่ง silent-reply ที่ resolve แล้วไปทุก turn; ไฟล์ workspace ไม่ควรทำซ้ำกลไก `NO_REPLY`
    - กลุ่มที่อนุญาต silent replies จะถือ turn ของโมเดลที่ว่างสะอาดหรือมีแต่ reasoning เป็น silent เทียบเท่ากับ `NO_REPLY` แชตโดยตรงทำแบบเดียวกันเฉพาะเมื่ออนุญาต direct silent replies อย่างชัดเจน; ไม่เช่นนั้น reply ว่างยังคงเป็น turn ของ agent ที่ล้มเหลว
    - ค่าเริ่มต้นของ Discord อยู่ใน `channels.discord.guilds."*"` (override ได้ต่อ guild/channel)
    - บริบทประวัติกลุ่มถูกห่ออย่างสม่ำเสมอในทุกช่องทาง กลุ่มที่ถูกควบคุมด้วยการ mention จะเก็บข้อความที่ข้ามไว้ซึ่งยังค้างอยู่; กลุ่มที่เปิดตลอดเวลาอาจเก็บข้อความห้องล่าสุดที่ประมวลผลแล้วเมื่อช่องทางรองรับด้วย ใช้ `messages.groupChat.historyLimit` สำหรับค่าเริ่มต้นส่วนกลาง และ `channels.<channel>.historyLimit` (หรือ `channels.<channel>.accounts.*.historyLimit`) สำหรับ override ตั้งค่า `0` เพื่อปิดใช้งาน

  </Accordion>
</AccordionGroup>

## ข้อจำกัดเครื่องมือของกลุ่ม/ช่องทาง (ไม่บังคับ)

การกำหนดค่าบางช่องทางรองรับการจำกัดว่าเครื่องมือใดพร้อมใช้งาน **ภายในกลุ่ม/ห้อง/ช่องทางเฉพาะ**

- `tools`: อนุญาต/ปฏิเสธเครื่องมือสำหรับทั้งกลุ่ม
- `toolsBySender`: override ต่อผู้ส่งภายในกลุ่ม ใช้ prefix ของคีย์แบบชัดเจน: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` และ wildcard `"*"` ID ช่องทางใช้ ID ช่องทาง OpenClaw แบบ canonical; alias เช่น `teams` จะ normalize เป็น `msteams` คีย์ legacy ที่ไม่มี prefix ยังยอมรับอยู่และจับคู่เป็น `id:` เท่านั้น

ลำดับการ resolve (ตัวที่เจาะจงที่สุดชนะ):

<Steps>
  <Step title="toolsBySender ของกลุ่ม">
    `toolsBySender` ของกลุ่ม/ช่องทางตรงกัน
  </Step>
  <Step title="tools ของกลุ่ม">
    `tools` ของกลุ่ม/ช่องทาง
  </Step>
  <Step title="toolsBySender เริ่มต้น">
    `toolsBySender` ค่าเริ่มต้น (`"*"`) ตรงกัน
  </Step>
  <Step title="tools เริ่มต้น">
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
ข้อจำกัดเครื่องมือของกลุ่ม/ช่องทางถูกใช้เพิ่มเติมจากนโยบายเครื่องมือระดับ global/agent (deny ยังชนะ) บางช่องทางใช้ nesting ที่ต่างกันสำหรับห้อง/ช่องทาง (เช่น Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`)
</Note>

## allowlist ของกลุ่ม

เมื่อกำหนดค่า `channels.whatsapp.groups`, `channels.telegram.groups` หรือ `channels.imessage.groups` คีย์จะทำหน้าที่เป็น allowlist ของกลุ่ม ใช้ `"*"` เพื่ออนุญาตทุกกลุ่มพร้อมกับยังตั้งค่าพฤติกรรม mention เริ่มต้นได้

<Warning>
ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่เหมือนกับการอนุญาตกลุ่ม สำหรับช่องทางที่รองรับการจับคู่ DM, pairing store จะปลดล็อกเฉพาะ DM คำสั่งกลุ่มยังต้องมีการอนุญาตผู้ส่งกลุ่มอย่างชัดเจนจาก allowlist ใน config เช่น `groupAllowFrom` หรือ config fallback ที่บันทึกไว้สำหรับช่องทางนั้น
</Warning>

เจตนาที่พบบ่อย (คัดลอก/วาง):

<Tabs>
  <Tab title="ปิดการตอบกลับกลุ่มทั้งหมด">
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
  <Tab title="อนุญาตทุกกลุ่มแต่ต้อง mention">
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
  <Tab title="ตัวกระตุ้นเฉพาะเจ้าของ (WhatsApp)">
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

เจ้าของกลุ่มสามารถสลับการเปิดใช้งานต่อกลุ่มได้:

- `/activation mention`
- `/activation always`

เจ้าของถูกกำหนดโดย `channels.whatsapp.allowFrom` (หรือ E.164 ของตัวบอตเองเมื่อไม่ได้ตั้งค่า) ส่งคำสั่งเป็นข้อความเดี่ยว พื้นผิวอื่นในปัจจุบันจะละเว้น `/activation`

## ฟิลด์บริบท

payload ขาเข้าของกลุ่มตั้งค่า:

- `ChatType=group`
- `GroupSubject` (หากทราบ)
- `GroupMembers` (หากทราบ)
- `WasMentioned` (ผลลัพธ์การควบคุมด้วยการ mention)
- หัวข้อฟอรัม Telegram จะรวม `MessageThreadId` และ `IsForum` ด้วย

system prompt ของ agent จะมีบทนำกลุ่มใน turn แรกของ session กลุ่มใหม่ โดยเตือนโมเดลให้ตอบเหมือนมนุษย์ หลีกเลี่ยงตาราง Markdown ลดบรรทัดว่างและทำตามระยะห่างแบบแชตปกติ และหลีกเลี่ยงการพิมพ์ลำดับ `\n` แบบ literal ชื่อกลุ่มและป้ายกำกับผู้เข้าร่วมที่มาจากช่องทางจะแสดงเป็น metadata ที่ไม่น่าเชื่อถือแบบ fenced ไม่ใช่คำสั่ง system แบบ inline

## รายละเอียดเฉพาะของ iMessage

- ควรใช้ `chat_id:<id>` เมื่อ routing หรือเพิ่มเข้า allowlist
- แสดงรายการแชต: `imsg chats --limit 20`
- การตอบกลับกลุ่มจะกลับไปยัง `chat_id` เดิมเสมอ

## system prompts ของ WhatsApp

ดู [WhatsApp](/th/channels/whatsapp#system-prompts) สำหรับกฎ system prompt ของ WhatsApp แบบ canonical รวมถึงการ resolve prompt ของกลุ่มและโดยตรง พฤติกรรม wildcard และ semantics ของ account override

## รายละเอียดเฉพาะของ WhatsApp

ดู [ข้อความกลุ่ม](/th/channels/group-messages) สำหรับพฤติกรรมเฉพาะ WhatsApp (การฉีดประวัติ รายละเอียดการจัดการ mention)

## ที่เกี่ยวข้อง

- [กลุ่ม Broadcast](/th/channels/broadcast-groups)
- [การ routing ช่องทาง](/th/channels/channel-routing)
- [ข้อความกลุ่ม](/th/channels/group-messages)
- [การจับคู่](/th/channels/pairing)
