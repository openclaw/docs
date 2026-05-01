---
read_when:
    - การเปลี่ยนพฤติกรรมแชตกลุ่มหรือการควบคุมด้วยการกล่าวถึง
sidebarTitle: Groups
summary: ลักษณะการทำงานของแชตกลุ่มในแต่ละช่องทาง (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: กลุ่ม
x-i18n:
    generated_at: "2026-05-01T10:13:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8580f98ab03c89770688102da776627d8ce18b7bd34c4a687009fd4aabb6213
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw จัดการแชทกลุ่มอย่างสอดคล้องกันในทุกพื้นผิว: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## บทนำสำหรับผู้เริ่มต้น (2 นาที)

OpenClaw "อาศัยอยู่" บนบัญชีรับส่งข้อความของคุณเอง ไม่มีผู้ใช้บอต WhatsApp แยกต่างหาก หาก **คุณ** อยู่ในกลุ่ม OpenClaw จะมองเห็นกลุ่มนั้นและตอบกลับที่นั่นได้

พฤติกรรมเริ่มต้น:

- กลุ่มถูกจำกัดไว้ (`groupPolicy: "allowlist"`)
- การตอบกลับต้องมีการกล่าวถึง เว้นแต่คุณจะปิดการกั้นด้วยการกล่าวถึงอย่างชัดเจน
- การตอบกลับสุดท้ายตามปกติในกลุ่ม/ช่องทางจะเป็นส่วนตัวตามค่าเริ่มต้น เอาต์พุตที่มองเห็นได้ในห้องใช้เครื่องมือ `message`

แปลว่า: ผู้ส่งที่อยู่ใน allowlist สามารถทริกเกอร์ OpenClaw ได้โดยกล่าวถึง OpenClaw

<Note>
**สรุปสั้น ๆ**

- **การเข้าถึง DM** ถูกควบคุมโดย `*.allowFrom`
- **การเข้าถึงกลุ่ม** ถูกควบคุมโดย `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`)
- **การทริกเกอร์การตอบกลับ** ถูกควบคุมโดยการกั้นด้วยการกล่าวถึง (`requireMention`, `/activation`)

</Note>

ลำดับอย่างรวดเร็ว (เกิดอะไรขึ้นกับข้อความในกลุ่ม):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## การตอบกลับที่มองเห็นได้

สำหรับห้องแบบกลุ่ม/ช่องทาง OpenClaw ตั้งค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`
นั่นหมายความว่าเอเจนต์ยังคงประมวลผลเทิร์นและสามารถอัปเดตหน่วยความจำ/สถานะเซสชันได้ แต่คำตอบสุดท้ายตามปกติจะไม่ถูกโพสต์กลับเข้าไปในห้องโดยอัตโนมัติ หากต้องการพูดให้มองเห็นได้ เอเจนต์จะใช้ `message(action=send)`

หากเครื่องมือ message ไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะถอยกลับไปใช้การตอบกลับที่มองเห็นได้โดยอัตโนมัติแทนการระงับการตอบกลับแบบเงียบ ๆ
`openclaw doctor` จะเตือนเกี่ยวกับความไม่ตรงกันนี้

สำหรับแชทโดยตรงและเทิร์นจากแหล่งอื่น ๆ ให้ใช้ `messages.visibleReplies: "message_tool"` เพื่อใช้พฤติกรรมการตอบกลับที่มองเห็นได้แบบผ่านเครื่องมือเท่านั้นในระดับโกลบอล `messages.groupChat.visibleReplies` ยังคงเป็นโอเวอร์ไรด์ที่เฉพาะเจาะจงกว่าสำหรับห้องแบบกลุ่ม/ช่องทาง

สิ่งนี้แทนที่รูปแบบเดิมที่บังคับให้โมเดลตอบ `NO_REPLY` สำหรับเทิร์นในโหมดเฝ้าดูส่วนใหญ่ ในโหมดผ่านเครื่องมือเท่านั้น การไม่ทำอะไรให้มองเห็นได้หมายถึงการไม่เรียกเครื่องมือ message เท่านั้น

ยังคงส่งตัวบ่งชี้การพิมพ์ในขณะที่เอเจนต์ทำงานในโหมดผ่านเครื่องมือเท่านั้น โหมดการพิมพ์เริ่มต้นของกลุ่มจะถูกอัปเกรดจาก "message" เป็น "instant" สำหรับเทิร์นเหล่านี้ เพราะอาจไม่มีข้อความผู้ช่วยตามปกติก่อนที่เอเจนต์จะตัดสินใจว่าจะเรียกเครื่องมือ message หรือไม่ การตั้งค่าโหมดการพิมพ์อย่างชัดเจนยังคงมีผลเหนือกว่า

หากต้องการคืนค่าการตอบกลับสุดท้ายอัตโนมัติแบบเดิมสำหรับห้องแบบกลุ่ม/ช่องทาง:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway จะโหลดการตั้งค่า `messages` ใหม่แบบ hot-reload หลังจากบันทึกไฟล์ รีสตาร์ตเฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลดการตั้งค่าใหม่ถูกปิดใช้งานในการปรับใช้

หากต้องการกำหนดให้เอาต์พุตที่มองเห็นได้ต้องผ่านเครื่องมือ message สำหรับทุกแชทต้นทาง:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

คำสั่ง slash แบบเนทีฟ (Discord, Telegram และพื้นผิวอื่น ๆ ที่รองรับคำสั่งเนทีฟ) จะข้าม `visibleReplies: "message_tool"` และตอบกลับให้มองเห็นได้เสมอ เพื่อให้ UI คำสั่งแบบเนทีฟของช่องทางได้รับการตอบกลับตามที่คาดไว้ สิ่งนี้ใช้กับเทิร์นคำสั่งเนทีฟที่ผ่านการตรวจสอบแล้วเท่านั้น; คำสั่ง `/...` ที่พิมพ์เป็นข้อความและเทิร์นแชททั่วไปยังคงทำตามค่าเริ่มต้นของกลุ่มที่กำหนดไว้

## การมองเห็นบริบทและ allowlists

มีการควบคุมสองแบบที่เกี่ยวข้องกับความปลอดภัยของกลุ่ม:

- **การอนุญาตการทริกเกอร์**: ใครสามารถทริกเกอร์เอเจนต์ได้ (`groupPolicy`, `groups`, `groupAllowFrom`, allowlists เฉพาะช่องทาง)
- **การมองเห็นบริบท**: บริบทเสริมใดที่ถูกฉีดเข้าไปในโมเดล (ข้อความตอบกลับ, คำอ้างอิง, ประวัติเธรด, เมทาดาทาที่ส่งต่อ)

ตามค่าเริ่มต้น OpenClaw ให้ความสำคัญกับพฤติกรรมแชทปกติและเก็บบริบทไว้ใกล้เคียงกับที่ได้รับมา ซึ่งหมายความว่า allowlists โดยหลักแล้วจะตัดสินว่าใครสามารถทริกเกอร์การกระทำได้ ไม่ใช่ขอบเขตการปกปิดสากลสำหรับทุกส่วนข้อความที่ถูกอ้างอิงหรือจากประวัติ

<AccordionGroup>
  <Accordion title="พฤติกรรมปัจจุบันเฉพาะเจาะจงตามช่องทาง">
    - บางช่องทางใช้การกรองตามผู้ส่งสำหรับบริบทเสริมในเส้นทางเฉพาะอยู่แล้ว (เช่น การตั้งต้นเธรดของ Slack, การค้นหาการตอบกลับ/เธรดของ Matrix)
    - ช่องทางอื่น ๆ ยังคงส่งบริบทคำอ้างอิง/การตอบกลับ/การส่งต่อผ่านไปตามที่ได้รับมา

  </Accordion>
  <Accordion title="ทิศทางการเพิ่มความแข็งแรง (วางแผนไว้)">
    - `contextVisibility: "all"` (ค่าเริ่มต้น) รักษาพฤติกรรมปัจจุบันตามที่ได้รับมา
    - `contextVisibility: "allowlist"` กรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่อยู่ใน allowlist
    - `contextVisibility: "allowlist_quote"` คือ `allowlist` บวกข้อยกเว้นคำอ้างอิง/การตอบกลับหนึ่งรายการอย่างชัดเจน

    จนกว่าโมเดลการเพิ่มความแข็งแรงนี้จะถูกนำไปใช้ให้สอดคล้องกันทุกช่องทาง ให้คาดว่าจะมีความแตกต่างตามพื้นผิว

  </Accordion>
</AccordionGroup>

![โฟลว์ข้อความกลุ่ม](/images/groups-flow.svg)

หากคุณต้องการ...

| เป้าหมาย                                      | สิ่งที่ต้องตั้งค่า                                           |
| -------------------------------------------- | ---------------------------------------------------------- |
| อนุญาตทุกกลุ่มแต่ตอบกลับเฉพาะเมื่อมี @mentions | `groups: { "*": { requireMention: true } }`                |
| ปิดการตอบกลับกลุ่มทั้งหมด                    | `groupPolicy: "disabled"`                                  |
| เฉพาะกลุ่มที่ระบุ                            | `groups: { "<group-id>": { ... } }` (ไม่มีคีย์ `"*"` )     |
| มีเพียงคุณที่ทริกเกอร์ในกลุ่มได้             | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## คีย์เซสชัน

- เซสชันกลุ่มใช้คีย์เซสชัน `agent:<agentId>:<channel>:group:<id>` (ห้อง/ช่องทางใช้ `agent:<agentId>:<channel>:channel:<id>`)
- หัวข้อฟอรัม Telegram เพิ่ม `:topic:<threadId>` ต่อท้าย ID กลุ่ม เพื่อให้แต่ละหัวข้อมีเซสชันของตัวเอง
- แชทโดยตรงใช้เซสชันหลัก (หรือแยกตามผู้ส่งหากกำหนดค่าไว้)
- Heartbeats จะถูกข้ามสำหรับเซสชันกลุ่ม

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## รูปแบบ: DM ส่วนตัว + กลุ่มสาธารณะ (เอเจนต์เดียว)

ใช่ — วิธีนี้ทำงานได้ดีหากทราฟฟิก "ส่วนตัว" ของคุณคือ **DMs** และทราฟฟิก "สาธารณะ" ของคุณคือ **กลุ่ม**

เหตุผล: ในโหมดเอเจนต์เดียว DMs มักจะไปอยู่ในคีย์เซสชัน **main** (`agent:main:main`) ในขณะที่กลุ่มจะใช้คีย์เซสชันที่ **ไม่ใช่ main** เสมอ (`agent:main:<channel>:group:<id>`) หากคุณเปิดใช้ sandboxing ด้วย `mode: "non-main"` เซสชันกลุ่มเหล่านั้นจะทำงานในแบ็กเอนด์ sandbox ที่กำหนดไว้ ในขณะที่เซสชัน DM หลักของคุณยังคงอยู่บนโฮสต์ Docker เป็นแบ็กเอนด์เริ่มต้นหากคุณไม่ได้เลือกอย่างอื่น

สิ่งนี้ให้ "สมอง" เอเจนต์หนึ่งเดียวแก่คุณ (พื้นที่ทำงาน + หน่วยความจำที่ใช้ร่วมกัน) แต่มีท่าทางการประมวลผลสองแบบ:

- **DMs**: เครื่องมือเต็มรูปแบบ (โฮสต์)
- **กลุ่ม**: sandbox + เครื่องมือที่ถูกจำกัด

<Note>
หากคุณต้องการพื้นที่ทำงาน/ตัวตนที่แยกจากกันจริง ๆ ("ส่วนตัว" และ "สาธารณะ" ต้องไม่ปะปนกันเลย) ให้ใช้เอเจนต์ที่สอง + bindings ดู [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
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
  <Tab title="กลุ่มเห็นเฉพาะโฟลเดอร์ที่อยู่ใน allowlist">
    ต้องการให้ "กลุ่มเห็นได้เฉพาะโฟลเดอร์ X" แทน "ไม่มีการเข้าถึงโฮสต์" ใช่ไหม ให้คง `workspaceAccess: "none"` ไว้และเมานต์เฉพาะพาธที่อยู่ใน allowlist เข้าไปใน sandbox:

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

- คีย์การตั้งค่าและค่าเริ่มต้น: [การตั้งค่า Gateway](/th/gateway/config-agents#agentsdefaultssandbox)
- การดีบักสาเหตุที่เครื่องมือถูกบล็อก: [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated)
- รายละเอียด bind mounts: [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts)

## ป้ายกำกับการแสดงผล

- ป้ายกำกับ UI ใช้ `displayName` เมื่อมี โดยจัดรูปแบบเป็น `<channel>:<token>`
- `#room` ถูกสงวนไว้สำหรับห้อง/ช่องทาง; แชทกลุ่มใช้ `g-<slug>` (ตัวพิมพ์เล็ก, เว้นวรรค -> `-`, เก็บ `#@+._-` ไว้)

## นโยบายกลุ่ม

ควบคุมวิธีจัดการข้อความกลุ่ม/ห้องต่อช่องทาง:

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

| นโยบาย       | พฤติกรรม                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | กลุ่มข้าม allowlists; การกั้นด้วยการกล่าวถึงยังคงมีผล       |
| `"disabled"`  | บล็อกข้อความกลุ่มทั้งหมดโดยสิ้นเชิง                         |
| `"allowlist"` | อนุญาตเฉพาะกลุ่ม/ห้องที่ตรงกับ allowlist ที่กำหนดไว้        |

<AccordionGroup>
  <Accordion title="หมายเหตุรายช่องทาง">
    - `groupPolicy` แยกจากการกั้นด้วยการกล่าวถึง (ซึ่งต้องใช้ @mentions)
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: ใช้ `groupAllowFrom` (สำรอง: `allowFrom` ที่ระบุชัดเจน)
    - Signal: `groupAllowFrom` สามารถตรงกับ ID กลุ่ม Signal ขาเข้าหรือโทรศัพท์/UUID ของผู้ส่งก็ได้
    - การอนุมัติการจับคู่ DM (รายการในที่เก็บ `*-allowFrom`) ใช้กับการเข้าถึง DM เท่านั้น; การอนุญาตผู้ส่งในกลุ่มยังคงต้องระบุอย่างชัดเจนใน allowlists ของกลุ่ม
    - Discord: allowlist ใช้ `channels.discord.guilds.<id>.channels`
    - Slack: allowlist ใช้ `channels.slack.channels`
    - Matrix: allowlist ใช้ `channels.matrix.groups` ควรใช้ ID ห้องหรือ aliases; การค้นหาชื่อห้องที่เข้าร่วมแล้วเป็นแบบ best-effort และชื่อที่แก้ไม่ได้จะถูกละเว้นขณะรันไทม์ ใช้ `channels.matrix.groupAllowFrom` เพื่อจำกัดผู้ส่ง; รองรับ allowlists `users` ต่อห้องด้วย
    - DM แบบกลุ่มถูกควบคุมแยกต่างหาก (`channels.discord.dm.*`, `channels.slack.dm.*`)
    - Telegram allowlist สามารถตรงกับ ID ผู้ใช้ (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) หรือชื่อผู้ใช้ (`"@alice"` หรือ `"alice"`); prefixes ไม่แยกตัวพิมพ์ใหญ่เล็ก
    - ค่าเริ่มต้นคือ `groupPolicy: "allowlist"`; หาก allowlist ของกลุ่มว่าง ข้อความกลุ่มจะถูกบล็อก
    - ความปลอดภัยขณะรันไทม์: เมื่อบล็อกผู้ให้บริการขาดหายไปทั้งหมด (`channels.<provider>` ไม่มีอยู่) นโยบายกลุ่มจะถอยกลับไปใช้โหมด fail-closed (โดยทั่วไปคือ `allowlist`) แทนการสืบทอด `channels.defaults.groupPolicy`

  </Accordion>
</AccordionGroup>

โมเดลคิดอย่างรวดเร็ว (ลำดับการประเมินสำหรับข้อความกลุ่ม):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist)
  </Step>
  <Step title="รายการอนุญาตของกลุ่ม">
    รายการอนุญาตของกลุ่ม (`*.groups`, `*.groupAllowFrom`, รายการอนุญาตเฉพาะช่องทาง)
  </Step>
  <Step title="การกั้นด้วยการกล่าวถึง">
    การกั้นด้วยการกล่าวถึง (`requireMention`, `/activation`)
  </Step>
</Steps>

## การกั้นด้วยการกล่าวถึง (ค่าเริ่มต้น)

ข้อความกลุ่มต้องมีการกล่าวถึง เว้นแต่จะถูกกำหนดทับในแต่ละกลุ่ม ค่าเริ่มต้นอยู่ต่อระบบย่อยภายใต้ `*.groups."*"`

การตอบกลับข้อความของบอตจะนับเป็นการกล่าวถึงโดยนัยเมื่อช่องทางรองรับเมตาดาต้าการตอบกลับ การอ้างอิงข้อความของบอตอาจนับเป็นการกล่าวถึงโดยนัยได้เช่นกันในช่องทางที่เปิดเผยเมตาดาต้าการอ้างอิง กรณีในตัวปัจจุบันรวมถึง Telegram, WhatsApp, Slack, Discord, Microsoft Teams และ ZaloUser

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
    - `mentionPatterns` เป็นรูปแบบ regex ที่ปลอดภัยและไม่สนตัวพิมพ์เล็กใหญ่ รูปแบบที่ไม่ถูกต้องและรูปแบบการทำซ้ำซ้อนที่ไม่ปลอดภัยจะถูกละเว้น
    - พื้นผิวที่ให้การกล่าวถึงอย่างชัดเจนยังคงผ่าน รูปแบบเป็นตัวสำรอง
    - การกำหนดทับรายเอเจนต์: `agents.list[].groupChat.mentionPatterns` (มีประโยชน์เมื่อเอเจนต์หลายตัวใช้กลุ่มร่วมกัน)
    - การกั้นด้วยการกล่าวถึงจะบังคับใช้เฉพาะเมื่อสามารถตรวจจับการกล่าวถึงได้เท่านั้น (มีการกำหนดการกล่าวถึงแบบเนทีฟหรือ `mentionPatterns`)
    - การใส่กลุ่มหรือผู้ส่งในรายการอนุญาตไม่ได้ปิดการกั้นด้วยการกล่าวถึง ตั้งค่า `requireMention` ของกลุ่มนั้นเป็น `false` เมื่อทุกข้อความควรกระตุ้นการทำงาน
    - บริบทพรอมป์ของแชตกลุ่มจะส่งคำสั่งตอบกลับแบบเงียบที่แก้ไขแล้วในทุกเทิร์น ไฟล์เวิร์กสเปซไม่ควรทำซ้ำกลไก `NO_REPLY`
    - กลุ่มที่อนุญาตการตอบกลับแบบเงียบจะถือว่าเทิร์นของโมเดลที่ว่างเปล่าอย่างสะอาดหรือมีเฉพาะการให้เหตุผลเป็นแบบเงียบ เทียบเท่ากับ `NO_REPLY` แชตโดยตรงทำแบบเดียวกันเฉพาะเมื่ออนุญาตการตอบกลับแบบเงียบโดยตรงอย่างชัดเจน มิฉะนั้นการตอบกลับว่างจะยังถือเป็นเทิร์นเอเจนต์ที่ล้มเหลว
    - ค่าเริ่มต้นของ Discord อยู่ใน `channels.discord.guilds."*"` (กำหนดทับต่อกิลด์/ช่องทางได้)
    - บริบทประวัติกลุ่มถูกห่ออย่างสม่ำเสมอข้ามช่องทางและเป็น **pending-only** (ข้อความที่ถูกข้ามเนื่องจากการกั้นด้วยการกล่าวถึง) ใช้ `messages.groupChat.historyLimit` สำหรับค่าเริ่มต้นส่วนกลาง และ `channels.<channel>.historyLimit` (หรือ `channels.<channel>.accounts.*.historyLimit`) สำหรับการกำหนดทับ ตั้งค่า `0` เพื่อปิดใช้

  </Accordion>
</AccordionGroup>

## ข้อจำกัดเครื่องมือของกลุ่ม/ช่องทาง (ไม่บังคับ)

การกำหนดค่าช่องทางบางรายการรองรับการจำกัดว่าเครื่องมือใดพร้อมใช้งาน **ภายในกลุ่ม/ห้อง/ช่องทางเฉพาะ**

- `tools`: อนุญาต/ปฏิเสธเครื่องมือสำหรับทั้งกลุ่ม
- `toolsBySender`: การกำหนดทับรายผู้ส่งภายในกลุ่ม ใช้คำนำหน้าคีย์ที่ชัดเจน: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` และไวลด์การ์ด `"*"` คีย์เดิมที่ไม่มีคำนำหน้ายังรับอยู่และจับคู่เป็น `id:` เท่านั้น

ลำดับการแก้ไข (รายการที่เฉพาะที่สุดชนะ):

<Steps>
  <Step title="Group toolsBySender">
    การจับคู่ `toolsBySender` ของกลุ่ม/ช่องทาง
  </Step>
  <Step title="เครื่องมือของกลุ่ม">
    `tools` ของกลุ่ม/ช่องทาง
  </Step>
  <Step title="Default toolsBySender">
    การจับคู่ `toolsBySender` ค่าเริ่มต้น (`"*"`)
  </Step>
  <Step title="เครื่องมือเริ่มต้น">
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
ข้อจำกัดเครื่องมือของกลุ่ม/ช่องทางจะถูกใช้เพิ่มเติมจากนโยบายเครื่องมือส่วนกลาง/เอเจนต์ (การปฏิเสธยังคงชนะ) ช่องทางบางรายการใช้การซ้อนที่แตกต่างกันสำหรับห้อง/ช่องทาง (เช่น Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`)
</Note>

## รายการอนุญาตของกลุ่ม

เมื่อกำหนดค่า `channels.whatsapp.groups`, `channels.telegram.groups` หรือ `channels.imessage.groups` แล้ว คีย์จะทำหน้าที่เป็นรายการอนุญาตของกลุ่ม ใช้ `"*"` เพื่ออนุญาตทุกกลุ่มในขณะที่ยังตั้งค่าพฤติกรรมการกล่าวถึงเริ่มต้น

<Warning>
ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่เหมือนกับการอนุญาตกลุ่ม สำหรับช่องทางที่รองรับการจับคู่ DM ที่จัดเก็บการจับคู่จะปลดล็อกเฉพาะ DM เท่านั้น คำสั่งกลุ่มยังต้องมีการอนุญาตผู้ส่งกลุ่มอย่างชัดเจนจากรายการอนุญาตการกำหนดค่า เช่น `groupAllowFrom` หรือค่าทดแทนการกำหนดค่าที่จัดทำเอกสารไว้สำหรับช่องทางนั้น
</Warning>

เจตนาทั่วไป (คัดลอก/วาง):

<Tabs>
  <Tab title="ปิดใช้การตอบกลับกลุ่มทั้งหมด">
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

เจ้าของกำหนดจาก `channels.whatsapp.allowFrom` (หรือ E.164 ของตัวบอตเองเมื่อไม่ได้ตั้งค่า) ส่งคำสั่งเป็นข้อความเดี่ยว พื้นผิวอื่นในปัจจุบันจะละเว้น `/activation`

## ฟิลด์บริบท

เพย์โหลดขาเข้าของกลุ่มตั้งค่า:

- `ChatType=group`
- `GroupSubject` (หากทราบ)
- `GroupMembers` (หากทราบ)
- `WasMentioned` (ผลลัพธ์การกั้นด้วยการกล่าวถึง)
- หัวข้อฟอรัมของ Telegram จะรวม `MessageThreadId` และ `IsForum` ด้วย

หมายเหตุเฉพาะช่องทาง:

- BlueBubbles สามารถเพิ่มข้อมูลผู้เข้าร่วมกลุ่ม macOS ที่ไม่มีชื่อจากฐานข้อมูล Contacts ในเครื่องก่อนเติม `GroupMembers` ได้ตามตัวเลือก การทำงานนี้ปิดโดยค่าเริ่มต้นและทำงานหลังจากการกั้นกลุ่มปกติผ่านแล้วเท่านั้น

พรอมป์ระบบของเอเจนต์จะรวมบทนำกลุ่มในเทิร์นแรกของเซสชันกลุ่มใหม่ โดยเตือนโมเดลให้ตอบเหมือนมนุษย์ หลีกเลี่ยงตาราง Markdown ลดบรรทัดว่างและใช้การเว้นระยะตามแชตปกติ และหลีกเลี่ยงการพิมพ์ลำดับ `\n` แบบตัวอักษร ชื่อกลุ่มและป้ายกำกับผู้เข้าร่วมที่มาจากช่องทางจะแสดงเป็นเมตาดาต้าที่ไม่น่าเชื่อถือแบบ fenced ไม่ใช่คำสั่งระบบแบบ inline

## รายละเอียดเฉพาะของ iMessage

- ใช้ `chat_id:<id>` เป็นหลักเมื่อกำหนดเส้นทางหรือใส่ในรายการอนุญาต
- แสดงรายการแชต: `imsg chats --limit 20`
- การตอบกลับกลุ่มจะกลับไปยัง `chat_id` เดิมเสมอ

## พรอมป์ระบบของ WhatsApp

ดู [WhatsApp](/th/channels/whatsapp#system-prompts) สำหรับกฎพรอมป์ระบบ WhatsApp ที่เป็นมาตรฐาน รวมถึงการแก้ไขพรอมป์กลุ่มและโดยตรง พฤติกรรมไวลด์การ์ด และความหมายของการกำหนดทับบัญชี

## รายละเอียดเฉพาะของ WhatsApp

ดู [ข้อความกลุ่ม](/th/channels/group-messages) สำหรับพฤติกรรมเฉพาะ WhatsApp (การฉีดประวัติ รายละเอียดการจัดการการกล่าวถึง)

## ที่เกี่ยวข้อง

- [กลุ่มออกอากาศ](/th/channels/broadcast-groups)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [ข้อความกลุ่ม](/th/channels/group-messages)
- [การจับคู่](/th/channels/pairing)
