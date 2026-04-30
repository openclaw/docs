---
read_when:
    - การเปลี่ยนลักษณะการทำงานของแชทกลุ่มหรือการกำหนดเงื่อนไขด้วยการกล่าวถึง
sidebarTitle: Groups
summary: ลักษณะการทำงานของแชตกลุ่มในแต่ละช่องทาง (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: กลุ่ม
x-i18n:
    generated_at: "2026-04-30T16:27:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed9cba03cf4546a20d473e8095a54858530869b27f8934f2680e8dbe987dbf5e
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw จัดการแชทกลุ่มอย่างสอดคล้องกันในทุกพื้นผิว: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## บทนำสำหรับผู้เริ่มต้น (2 นาที)

OpenClaw "อยู่" บนบัญชีส่งข้อความของคุณเอง ไม่มีผู้ใช้บอต WhatsApp แยกต่างหาก หาก **คุณ** อยู่ในกลุ่ม OpenClaw จะเห็นกลุ่มนั้นและตอบกลับที่นั่นได้

พฤติกรรมเริ่มต้น:

- กลุ่มถูกจำกัด (`groupPolicy: "allowlist"`)
- การตอบกลับต้องมีการกล่าวถึง เว้นแต่คุณจะปิด mention gating อย่างชัดเจน
- คำตอบสุดท้ายปกติในกลุ่ม/ช่องเป็นแบบส่วนตัวโดยค่าเริ่มต้น เอาต์พุตที่มองเห็นได้ในห้องใช้เครื่องมือ `message`

แปลว่า: ผู้ส่งที่อยู่ใน allowlist สามารถทริกเกอร์ OpenClaw ได้โดยกล่าวถึง OpenClaw

<Note>
**สรุปสั้น**

- **การเข้าถึง DM** ควบคุมโดย `*.allowFrom`
- **การเข้าถึงกลุ่ม** ควบคุมโดย `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`)
- **การทริกเกอร์คำตอบ** ควบคุมโดย mention gating (`requireMention`, `/activation`)

</Note>

โฟลว์อย่างเร็ว (สิ่งที่เกิดขึ้นกับข้อความกลุ่ม):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## คำตอบที่มองเห็นได้

สำหรับห้องแบบกลุ่ม/ช่อง OpenClaw ตั้งค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`
นั่นหมายความว่า agent ยังคงประมวลผลรอบสนทนาและอัปเดตสถานะ memory/session ได้ แต่คำตอบสุดท้ายปกติของมันจะไม่ถูกโพสต์กลับเข้าไปในห้องโดยอัตโนมัติ หากต้องการพูดให้มองเห็นได้ agent จะใช้ `message(action=send)`

สำหรับแชทตรงและรอบสนทนาจากแหล่งอื่น ใช้ `messages.visibleReplies: "message_tool"` เพื่อใช้พฤติกรรมการตอบกลับที่มองเห็นได้แบบผ่านเครื่องมือเท่านั้นนี้ในระดับสากล `messages.groupChat.visibleReplies` ยังคงเป็น override ที่เฉพาะเจาะจงกว่าสำหรับห้องแบบกลุ่ม/ช่อง

สิ่งนี้แทนที่รูปแบบเก่าที่บังคับให้โมเดลตอบ `NO_REPLY` สำหรับรอบสนทนาส่วนใหญ่ในโหมดเฝ้าดู ในโหมดผ่านเครื่องมือเท่านั้น การไม่ทำอะไรให้มองเห็นได้หมายถึงไม่เรียกเครื่องมือ message

ยังคงส่งตัวบ่งชี้การพิมพ์ขณะที่ agent ทำงานในโหมดผ่านเครื่องมือเท่านั้น โหมดการพิมพ์เริ่มต้นของกลุ่มจะอัปเกรดจาก "message" เป็น "instant" สำหรับรอบสนทนาเหล่านี้ เพราะอาจไม่มีข้อความผู้ช่วยปกติก่อนที่ agent จะตัดสินใจว่าจะเรียกเครื่องมือ message หรือไม่ การกำหนดค่าโหมดการพิมพ์อย่างชัดเจนยังคงมีผลเหนือกว่า

หากต้องการคืนค่าการตอบกลับสุดท้ายอัตโนมัติแบบเดิมสำหรับห้องแบบกลุ่ม/ช่อง:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway โหลดการกำหนดค่า `messages` ซ้ำแบบ hot-reload หลังจากบันทึกไฟล์ รีสตาร์ทเฉพาะ
เมื่อการเฝ้าดูไฟล์หรือการโหลด config ซ้ำถูกปิดใช้งานในการปรับใช้

หากต้องการบังคับให้เอาต์พุตที่มองเห็นได้ของทุกแชทต้นทางต้องผ่านเครื่องมือ message:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

คำสั่ง slash แบบเนทีฟ (Discord, Telegram และพื้นผิวอื่นที่รองรับคำสั่งเนทีฟ) จะข้าม `visibleReplies: "message_tool"` และตอบกลับให้มองเห็นได้เสมอ เพื่อให้ UI คำสั่งของช่องนั้นได้รับคำตอบที่คาดไว้ สิ่งนี้ใช้กับรอบสนทนาคำสั่งเนทีฟที่ผ่านการตรวจสอบแล้วเท่านั้น คำสั่ง `/...` ที่พิมพ์เป็นข้อความและรอบสนทนาแชททั่วไปยังคงทำตามค่าเริ่มต้นของกลุ่มที่กำหนดไว้

## การมองเห็นบริบทและ allowlist

มีการควบคุมสองแบบที่เกี่ยวข้องกับความปลอดภัยของกลุ่ม:

- **การอนุญาตทริกเกอร์**: ใครสามารถทริกเกอร์ agent (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist เฉพาะช่อง)
- **การมองเห็นบริบท**: บริบทเสริมใดถูกฉีดเข้าโมเดล (ข้อความตอบกลับ, คำอ้างอิง, ประวัติ thread, metadata ที่ส่งต่อ)

โดยค่าเริ่มต้น OpenClaw ให้ความสำคัญกับพฤติกรรมแชทปกติและคงบริบทไว้ใกล้เคียงกับที่ได้รับมา ซึ่งหมายความว่า allowlist เป็นตัวตัดสินหลักว่าใครสามารถทริกเกอร์การกระทำได้ ไม่ใช่ขอบเขตการปกปิดสากลสำหรับทุกส่วนอ้างอิงหรือส่วนประวัติ

<AccordionGroup>
  <Accordion title="Current behavior is channel-specific">
    - บางช่องใช้การกรองตามผู้ส่งกับบริบทเสริมในเส้นทางเฉพาะแล้ว (เช่น การตั้งต้น thread ของ Slack, การค้นหา reply/thread ของ Matrix)
    - ช่องอื่นยังคงส่งผ่านบริบท quote/reply/forward ตามที่ได้รับมา

  </Accordion>
  <Accordion title="Hardening direction (planned)">
    - `contextVisibility: "all"` (ค่าเริ่มต้น) คงพฤติกรรมปัจจุบันตามที่ได้รับมา
    - `contextVisibility: "allowlist"` กรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่อยู่ใน allowlist
    - `contextVisibility: "allowlist_quote"` คือ `allowlist` พร้อมข้อยกเว้น quote/reply ที่ชัดเจนหนึ่งรายการ

    จนกว่าโมเดลการเสริมความแข็งแกร่งนี้จะถูกนำไปใช้ให้สอดคล้องกันข้ามช่อง ให้คาดว่าจะมีความแตกต่างตามพื้นผิว

  </Accordion>
</AccordionGroup>

![โฟลว์ข้อความกลุ่ม](/images/groups-flow.svg)

หากคุณต้องการ...

| เป้าหมาย                                         | สิ่งที่ต้องตั้งค่า                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| อนุญาตทุกกลุ่มแต่ตอบเฉพาะเมื่อ @mentions | `groups: { "*": { requireMention: true } }`                |
| ปิดการตอบกลับในกลุ่มทั้งหมด                    | `groupPolicy: "disabled"`                                  |
| เฉพาะกลุ่มที่ระบุ                         | `groups: { "<group-id>": { ... } }` (ไม่มีคีย์ `"*"` )         |
| มีเพียงคุณที่ทริกเกอร์ในกลุ่มได้               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## คีย์ session

- session กลุ่มใช้คีย์ session แบบ `agent:<agentId>:<channel>:group:<id>` (ห้อง/ช่องใช้ `agent:<agentId>:<channel>:channel:<id>`)
- หัวข้อฟอรัม Telegram เพิ่ม `:topic:<threadId>` ต่อท้าย id กลุ่ม เพื่อให้แต่ละหัวข้อมี session ของตัวเอง
- แชทตรงใช้ session หลัก (หรือแยกตามผู้ส่งหากกำหนดค่าไว้)
- Heartbeat จะถูกข้ามสำหรับ session กลุ่ม

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## รูปแบบ: DM ส่วนตัว + กลุ่มสาธารณะ (agent เดียว)

ใช่ สิ่งนี้ทำงานได้ดีหากทราฟฟิก "ส่วนตัว" ของคุณคือ **DM** และทราฟฟิก "สาธารณะ" ของคุณคือ **กลุ่ม**

เหตุผล: ในโหมด agent เดียว โดยทั่วไป DM จะไปอยู่ในคีย์ session **หลัก** (`agent:main:main`) ขณะที่กลุ่มใช้คีย์ session **ที่ไม่ใช่หลัก** เสมอ (`agent:main:<channel>:group:<id>`) หากคุณเปิดใช้ sandboxing ด้วย `mode: "non-main"` session กลุ่มเหล่านั้นจะรันใน backend sandbox ที่กำหนดค่าไว้ ขณะที่ session DM หลักของคุณยังอยู่บนโฮสต์ Docker เป็น backend เริ่มต้นหากคุณไม่เลือกอย่างอื่น

สิ่งนี้ให้ "สมอง" agent หนึ่งตัว (workspace + memory ร่วมกัน) แต่มีรูปแบบการดำเนินการสองแบบ:

- **DM**: เครื่องมือเต็มรูปแบบ (โฮสต์)
- **กลุ่ม**: sandbox + เครื่องมือที่ถูกจำกัด

<Note>
หากคุณต้องการ workspace/persona ที่แยกกันจริง ๆ ("ส่วนตัว" และ "สาธารณะ" ต้องไม่ปะปนกันเลย) ให้ใช้ agent ตัวที่สอง + bindings ดู [การกำหนดเส้นทางหลาย Agent](/th/concepts/multi-agent)
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
    ต้องการให้ "กลุ่มเห็นได้เฉพาะโฟลเดอร์ X" แทน "ไม่มีการเข้าถึงโฮสต์" ใช่ไหม ให้คง `workspaceAccess: "none"` และ mount เฉพาะ path ที่อยู่ใน allowlist เข้าไปใน sandbox:

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
- การดีบักสาเหตุที่เครื่องมือถูกบล็อก: [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated)
- รายละเอียด bind mount: [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts)

## ป้ายชื่อที่แสดง

- ป้ายชื่อ UI ใช้ `displayName` เมื่อมี โดยจัดรูปแบบเป็น `<channel>:<token>`
- `#room` สงวนไว้สำหรับห้อง/ช่อง แชทกลุ่มใช้ `g-<slug>` (ตัวพิมพ์เล็ก, ช่องว่าง -> `-`, เก็บ `#@+._-` ไว้)

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

| นโยบาย        | พฤติกรรม                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | กลุ่มข้าม allowlist; mention-gating ยังคงมีผล      |
| `"disabled"`  | บล็อกข้อความกลุ่มทั้งหมดโดยสมบูรณ์                           |
| `"allowlist"` | อนุญาตเฉพาะกลุ่ม/ห้องที่ตรงกับ allowlist ที่กำหนดไว้ |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` แยกจาก mention-gating (ซึ่งต้องมี @mentions)
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: ใช้ `groupAllowFrom` (fallback: `allowFrom` ที่ระบุชัดเจน)
    - Signal: `groupAllowFrom` สามารถตรงกับ id กลุ่ม Signal ขาเข้าหรือโทรศัพท์/UUID ของผู้ส่งก็ได้
    - การอนุมัติการจับคู่ DM (รายการจัดเก็บ `*-allowFrom`) ใช้กับการเข้าถึง DM เท่านั้น การอนุญาตผู้ส่งในกลุ่มยังคงต้องระบุชัดเจนใน allowlist ของกลุ่ม
    - Discord: allowlist ใช้ `channels.discord.guilds.<id>.channels`
    - Slack: allowlist ใช้ `channels.slack.channels`
    - Matrix: allowlist ใช้ `channels.matrix.groups` ควรใช้ room ID หรือ alias เป็นหลัก การค้นหาชื่อห้องที่เข้าร่วมแล้วเป็นแบบพยายามอย่างดีที่สุด และชื่อที่ resolve ไม่ได้จะถูกละเว้นขณะรันไทม์ ใช้ `channels.matrix.groupAllowFrom` เพื่อจำกัดผู้ส่ง; ยังรองรับ allowlist ของ `users` ต่อห้องด้วย
    - Group DM ถูกควบคุมแยกต่างหาก (`channels.discord.dm.*`, `channels.slack.dm.*`)
    - allowlist ของ Telegram สามารถตรงกับ user ID (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) หรือ username (`"@alice"` หรือ `"alice"`); prefix ไม่คำนึงถึงตัวพิมพ์เล็กใหญ่
    - ค่าเริ่มต้นคือ `groupPolicy: "allowlist"`; หาก allowlist ของกลุ่มว่างเปล่า ข้อความกลุ่มจะถูกบล็อก
    - ความปลอดภัยขณะรันไทม์: เมื่อไม่มีบล็อก provider เลย (`channels.<provider>` ไม่อยู่) นโยบายกลุ่มจะ fallback ไปยังโหมด fail-closed (โดยทั่วไปคือ `allowlist`) แทนที่จะสืบทอด `channels.defaults.groupPolicy`

  </Accordion>
</AccordionGroup>

แบบจำลองความคิดอย่างเร็ว (ลำดับการประเมินสำหรับข้อความกลุ่ม):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist)
  </Step>
  <Step title="Group allowlists">
    allowlist ของกลุ่ม (`*.groups`, `*.groupAllowFrom`, allowlist เฉพาะช่อง)
  </Step>
  <Step title="Mention gating">
    Mention gating (`requireMention`, `/activation`)
  </Step>
</Steps>

## Mention gating (ค่าเริ่มต้น)

ข้อความกลุ่มต้องมีการกล่าวถึง เว้นแต่จะ override ต่อกลุ่ม ค่าเริ่มต้นอยู่ต่อ subsystem ใต้ `*.groups."*"`

การตอบกลับข้อความของบอทนับเป็นการกล่าวถึงโดยนัยเมื่อช่องทางรองรับเมทาดาทาการตอบกลับ การอ้างอิงข้อความของบอทก็สามารถนับเป็นการกล่าวถึงโดยนัยได้เช่นกันบนช่องทางที่เปิดเผยเมทาดาทาการอ้างอิง กรณีในตัวปัจจุบันรวมถึง Telegram, WhatsApp, Slack, Discord, Microsoft Teams และ ZaloUser

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
  <Accordion title="หมายเหตุการกั้นด้วยการกล่าวถึง">
    - `mentionPatterns` เป็นรูปแบบ regex ที่ปลอดภัยและไม่คำนึงถึงตัวพิมพ์เล็กใหญ่ รูปแบบที่ไม่ถูกต้องและรูปแบบการทำซ้ำแบบซ้อนที่ไม่ปลอดภัยจะถูกละเว้น
    - พื้นผิวที่ให้การกล่าวถึงแบบชัดเจนยังคงผ่านอยู่ รูปแบบเป็นกลไกสำรอง
    - การแทนที่รายเอเจนต์: `agents.list[].groupChat.mentionPatterns` (มีประโยชน์เมื่อเอเจนต์หลายตัวแชร์กลุ่มเดียวกัน)
    - การกั้นด้วยการกล่าวถึงจะบังคับใช้เฉพาะเมื่อสามารถตรวจจับการกล่าวถึงได้เท่านั้น (มีการกำหนดค่าการกล่าวถึงแบบเนทีฟหรือ `mentionPatterns`)
    - การเพิ่มกลุ่มหรือผู้ส่งในรายการอนุญาตไม่ได้ปิดใช้งานการกั้นด้วยการกล่าวถึง ตั้งค่า `requireMention` ของกลุ่มนั้นเป็น `false` เมื่อทุกข้อความควรกระตุ้นการทำงาน
    - บริบทพรอมป์ของแชตกลุ่มจะพกคำสั่งตอบกลับเงียบที่แก้ไขแล้วในทุกเทิร์น ไฟล์เวิร์กสเปซไม่ควรทำซ้ำกลไก `NO_REPLY`
    - กลุ่มที่อนุญาตการตอบกลับเงียบจะถือว่าเทิร์นของโมเดลที่ว่างเปล่าสะอาดหรือมีเฉพาะเหตุผลเป็นการเงียบ เทียบเท่ากับ `NO_REPLY` แชตโดยตรงทำแบบเดียวกันเฉพาะเมื่ออนุญาตการตอบกลับเงียบโดยตรงอย่างชัดเจน มิฉะนั้นการตอบกลับว่างเปล่ายังคงเป็นเทิร์นเอเจนต์ที่ล้มเหลว
    - ค่าเริ่มต้นของ Discord อยู่ใน `channels.discord.guilds."*"` (แทนที่ได้รายกิลด์/ช่อง)
    - บริบทประวัติกลุ่มถูกครอบอย่างสม่ำเสมอในทุกช่องทางและเป็นแบบ **รอดำเนินการเท่านั้น** (ข้อความที่ถูกข้ามเนื่องจากการกั้นด้วยการกล่าวถึง); ใช้ `messages.groupChat.historyLimit` สำหรับค่าเริ่มต้นส่วนกลาง และ `channels.<channel>.historyLimit` (หรือ `channels.<channel>.accounts.*.historyLimit`) สำหรับการแทนที่ ตั้งค่า `0` เพื่อปิดใช้งาน

  </Accordion>
</AccordionGroup>

## ข้อจำกัดเครื่องมือสำหรับกลุ่ม/ช่องทาง (ไม่บังคับ)

การกำหนดค่าบางช่องทางรองรับการจำกัดเครื่องมือที่พร้อมใช้งาน **ภายในกลุ่ม/ห้อง/ช่องที่ระบุ**

- `tools`: อนุญาต/ปฏิเสธเครื่องมือสำหรับทั้งกลุ่ม
- `toolsBySender`: การแทนที่รายผู้ส่งภายในกลุ่ม ใช้คำนำหน้าคีย์แบบชัดเจน: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` และไวลด์การ์ด `"*"` คีย์เดิมที่ไม่มีคำนำหน้ายังคงยอมรับและจับคู่เป็น `id:` เท่านั้น

ลำดับการแก้ไข (รายการที่เฉพาะเจาะจงที่สุดชนะ):

<Steps>
  <Step title="Group toolsBySender">
    `toolsBySender` ของกลุ่ม/ช่องทางตรงกัน
  </Step>
  <Step title="Group tools">
    `tools` ของกลุ่ม/ช่องทาง
  </Step>
  <Step title="Default toolsBySender">
    `toolsBySender` ค่าเริ่มต้น (`"*"` ) ตรงกัน
  </Step>
  <Step title="Default tools">
    `tools` ค่าเริ่มต้น (`"*"` )
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
ข้อจำกัดเครื่องมือสำหรับกลุ่ม/ช่องทางจะถูกนำไปใช้เพิ่มเติมจากนโยบายเครื่องมือส่วนกลาง/เอเจนต์ (การปฏิเสธยังคงชนะ) บางช่องทางใช้การซ้อนที่แตกต่างกันสำหรับห้อง/ช่อง (เช่น Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`)
</Note>

## รายการอนุญาตของกลุ่ม

เมื่อกำหนดค่า `channels.whatsapp.groups`, `channels.telegram.groups` หรือ `channels.imessage.groups` คีย์จะทำหน้าที่เป็นรายการอนุญาตของกลุ่ม ใช้ `"*"` เพื่ออนุญาตทุกกลุ่มขณะที่ยังตั้งค่าพฤติกรรมการกล่าวถึงเริ่มต้นได้

<Warning>
ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่เหมือนกับการอนุญาตกลุ่ม สำหรับช่องทางที่รองรับการจับคู่ DM คลังการจับคู่จะปลดล็อกเฉพาะ DM เท่านั้น คำสั่งในกลุ่มยังคงต้องมีการอนุญาตผู้ส่งในกลุ่มอย่างชัดเจนจากรายการอนุญาตในการกำหนดค่า เช่น `groupAllowFrom` หรือกลไกสำรองของการกำหนดค่าที่จัดทำเอกสารไว้สำหรับช่องทางนั้น
</Warning>

เจตนาทั่วไป (คัดลอก/วาง):

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
  <Tab title="อนุญาตทุกกลุ่มแต่ต้องมีการกล่าวถึง">
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

เจ้าของถูกกำหนดโดย `channels.whatsapp.allowFrom` (หรือ E.164 ของตัวบอทเองเมื่อไม่ได้ตั้งค่า) ส่งคำสั่งเป็นข้อความเดี่ยว พื้นผิวอื่นในปัจจุบันจะละเว้น `/activation`

## ฟิลด์บริบท

เพย์โหลดขาเข้าของกลุ่มตั้งค่า:

- `ChatType=group`
- `GroupSubject` (หากทราบ)
- `GroupMembers` (หากทราบ)
- `WasMentioned` (ผลลัพธ์การกั้นด้วยการกล่าวถึง)
- หัวข้อฟอรัม Telegram ยังรวม `MessageThreadId` และ `IsForum` ด้วย

หมายเหตุเฉพาะช่องทาง:

- BlueBubbles สามารถเพิ่มข้อมูลผู้เข้าร่วมกลุ่ม macOS ที่ไม่มีชื่อจากฐานข้อมูล Contacts ในเครื่องก่อนเติม `GroupMembers` ได้ตามตัวเลือก ค่านี้ปิดไว้โดยค่าเริ่มต้น และจะทำงานหลังจากการกั้นกลุ่มปกติผ่านแล้วเท่านั้น

พรอมป์ระบบเอเจนต์รวมบทนำกลุ่มในเทิร์นแรกของเซสชันกลุ่มใหม่ โดยเตือนโมเดลให้ตอบเหมือนมนุษย์ หลีกเลี่ยงตาราง Markdown ลดบรรทัดว่างและใช้ระยะห่างแบบแชตปกติ และหลีกเลี่ยงการพิมพ์ลำดับ `\n` แบบตามตัวอักษร ชื่อกลุ่มและป้ายชื่อผู้เข้าร่วมที่มาจากช่องทางจะแสดงเป็นเมทาดาทาที่ไม่น่าเชื่อถือในกรอบโค้ด ไม่ใช่คำสั่งระบบแบบอินไลน์

## รายละเอียดเฉพาะของ iMessage

- แนะนำให้ใช้ `chat_id:<id>` เมื่อกำหนดเส้นทางหรือเพิ่มในรายการอนุญาต
- แสดงรายการแชต: `imsg chats --limit 20`
- การตอบกลับกลุ่มจะกลับไปยัง `chat_id` เดิมเสมอ

## พรอมป์ระบบ WhatsApp

ดู [WhatsApp](/th/channels/whatsapp#system-prompts) สำหรับกฎพรอมป์ระบบ WhatsApp ที่เป็นหลัก รวมถึงการแก้ไขพรอมป์สำหรับกลุ่มและโดยตรง พฤติกรรมไวลด์การ์ด และความหมายของการแทนที่บัญชี

## รายละเอียดเฉพาะของ WhatsApp

ดู [ข้อความกลุ่ม](/th/channels/group-messages) สำหรับพฤติกรรมเฉพาะ WhatsApp (การฉีดประวัติ รายละเอียดการจัดการการกล่าวถึง)

## ที่เกี่ยวข้อง

- [กลุ่มบรอดแคสต์](/th/channels/broadcast-groups)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [ข้อความกลุ่ม](/th/channels/group-messages)
- [การจับคู่](/th/channels/pairing)
