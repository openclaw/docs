---
read_when:
    - การเปลี่ยนพฤติกรรมแชทกลุ่มหรือการควบคุมด้วยการกล่าวถึง
sidebarTitle: Groups
summary: ลักษณะการทำงานของแชตกลุ่มในแต่ละพื้นผิว (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: กลุ่ม
x-i18n:
    generated_at: "2026-05-03T10:10:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fd4fcaa8335f1dc4b4b1a719d6654ab0c10530f74284269ed6205dd5f87c116
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw จัดการแชตกลุ่มอย่างสอดคล้องกันในทุกพื้นผิว: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## บทนำสำหรับผู้เริ่มต้น (2 นาที)

OpenClaw "อยู่" บนบัญชีข้อความของคุณเอง ไม่มีผู้ใช้บอต WhatsApp แยกต่างหาก หาก **คุณ** อยู่ในกลุ่ม OpenClaw จะเห็นกลุ่มนั้นและตอบกลับที่นั่นได้

พฤติกรรมเริ่มต้น:

- กลุ่มถูกจำกัด (`groupPolicy: "allowlist"`)
- การตอบกลับต้องมีการกล่าวถึง เว้นแต่คุณจะปิดการควบคุมด้วยการกล่าวถึงอย่างชัดเจน
- การตอบกลับสุดท้ายปกติในกลุ่ม/ช่องเป็นแบบส่วนตัวโดยค่าเริ่มต้น เอาต์พุตที่มองเห็นได้ในห้องใช้เครื่องมือ `message`

ความหมาย: ผู้ส่งที่อยู่ในรายการอนุญาตสามารถเรียกใช้ OpenClaw ได้โดยกล่าวถึงมัน

<Note>
**สรุปสั้น ๆ**

- **การเข้าถึงแชตส่วนตัว** ควบคุมโดย `*.allowFrom`
- **การเข้าถึงกลุ่ม** ควบคุมโดย `*.groupPolicy` + รายการอนุญาต (`*.groups`, `*.groupAllowFrom`)
- **การเรียกให้ตอบกลับ** ควบคุมโดยการควบคุมด้วยการกล่าวถึง (`requireMention`, `/activation`)

</Note>

ลำดับแบบเร็ว (สิ่งที่เกิดขึ้นกับข้อความในกลุ่ม):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## การตอบกลับที่มองเห็นได้

สำหรับห้องกลุ่ม/ช่อง OpenClaw ใช้ค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`
`openclaw doctor --fix` เขียนค่าเริ่มต้นนี้ลงในการกำหนดค่าช่องที่กำหนดไว้ซึ่งยังไม่ได้ระบุค่าไว้
นั่นหมายความว่า agent ยังประมวลผลรอบสนทนาและอัปเดตสถานะหน่วยความจำ/เซสชันได้ แต่คำตอบสุดท้ายปกติของมันจะไม่ถูกโพสต์กลับเข้าไปในห้องโดยอัตโนมัติ หากต้องการพูดให้มองเห็นได้ agent จะใช้ `message(action=send)`

หากเครื่องมือ message ไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะถอยกลับไปใช้การตอบกลับที่มองเห็นได้แบบอัตโนมัติแทนการกดการตอบสนองไว้เงียบ ๆ
`openclaw doctor` จะเตือนเกี่ยวกับความไม่ตรงกันนี้

สำหรับแชตโดยตรงและรอบสนทนาจากแหล่งอื่น ให้ใช้ `messages.visibleReplies: "message_tool"` เพื่อใช้พฤติกรรมการตอบกลับที่มองเห็นได้แบบผ่านเครื่องมือเท่านั้นในระดับทั่วทั้งระบบ ชุดทดสอบยังสามารถเลือกค่านี้เป็นค่าเริ่มต้นเมื่อยังไม่ได้ตั้งค่าได้ด้วย ชุดทดสอบ Codex ทำเช่นนี้สำหรับแชตโดยตรงในโหมด Codex `messages.groupChat.visibleReplies` ยังคงเป็นการ override ที่เฉพาะเจาะจงกว่าสำหรับห้องกลุ่ม/ช่อง

สิ่งนี้แทนที่รูปแบบเดิมที่บังคับให้โมเดลตอบ `NO_REPLY` สำหรับรอบสนทนาโหมดแอบดูส่วนใหญ่ ในโหมดผ่านเครื่องมือเท่านั้น การไม่ทำอะไรที่มองเห็นได้หมายถึงการไม่เรียกเครื่องมือ message เท่านั้น

ยังคงส่งตัวบ่งชี้การพิมพ์ขณะที่ agent ทำงานในโหมดผ่านเครื่องมือเท่านั้น โหมดการพิมพ์ของกลุ่มเริ่มต้นจะถูกอัปเกรดจาก "message" เป็น "instant" สำหรับรอบสนทนาเหล่านี้ เพราะอาจไม่มีข้อความ assistant ปกติก่อนที่ agent จะตัดสินใจว่าจะเรียกเครื่องมือ message หรือไม่ การกำหนดค่าโหมดการพิมพ์อย่างชัดเจนยังคงมีผลเหนือกว่า

หากต้องการกู้คืนการตอบกลับสุดท้ายอัตโนมัติแบบเดิมสำหรับห้องกลุ่ม/ช่อง:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway จะโหลดการกำหนดค่า `messages` ใหม่แบบ hot reload หลังจากบันทึกไฟล์ รีสตาร์ตเฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลดการกำหนดค่าใหม่ถูกปิดใช้งานในการปรับใช้

หากต้องการบังคับให้เอาต์พุตที่มองเห็นได้ต้องผ่านเครื่องมือ message สำหรับทุกแชตจากแหล่งที่มา:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

คำสั่ง slash แบบ native (Discord, Telegram และพื้นผิวอื่นที่รองรับคำสั่ง native) จะข้าม `visibleReplies: "message_tool"` และตอบกลับแบบมองเห็นได้เสมอ เพื่อให้ UI คำสั่ง native ของช่องได้รับการตอบสนองที่คาดไว้ สิ่งนี้ใช้กับรอบสนทนาคำสั่ง native ที่ผ่านการตรวจสอบแล้วเท่านั้น คำสั่ง `/...` ที่พิมพ์เป็นข้อความและรอบสนทนาแชตทั่วไปยังคงทำตามค่าเริ่มต้นของกลุ่มที่กำหนดไว้

## การมองเห็นบริบทและรายการอนุญาต

มีการควบคุมสองแบบที่เกี่ยวข้องกับความปลอดภัยของกลุ่ม:

- **การอนุญาตการเรียกใช้**: ใครสามารถเรียกใช้ agent ได้ (`groupPolicy`, `groups`, `groupAllowFrom`, รายการอนุญาตเฉพาะช่อง)
- **การมองเห็นบริบท**: บริบทเสริมใดถูกฉีดเข้าโมเดล (ข้อความตอบกลับ คำอ้างอิง ประวัติเธรด เมตาดาต้าที่ส่งต่อ)

โดยค่าเริ่มต้น OpenClaw ให้ความสำคัญกับพฤติกรรมแชตปกติและเก็บบริบทไว้เกือบตามที่ได้รับมา นั่นหมายความว่ารายการอนุญาตจะกำหนดเป็นหลักว่าใครเรียกการทำงานได้ ไม่ใช่ขอบเขตการลบข้อมูลแบบสากลสำหรับทุกส่วนย่อยที่ถูกอ้างอิงหรือมีอยู่ในประวัติ

<AccordionGroup>
  <Accordion title="พฤติกรรมปัจจุบันเฉพาะตามช่อง">
    - บางช่องใช้การกรองตามผู้ส่งสำหรับบริบทเสริมในเส้นทางเฉพาะอยู่แล้ว (เช่น การป้อนข้อมูลเริ่มต้นของเธรด Slack, การค้นหาการตอบกลับ/เธรด Matrix)
    - ช่องอื่นยังคงส่งบริบทคำอ้างอิง/การตอบกลับ/การส่งต่อผ่านไปตามที่ได้รับมา

  </Accordion>
  <Accordion title="ทิศทางการเสริมความแข็งแรง (วางแผนไว้)">
    - `contextVisibility: "all"` (ค่าเริ่มต้น) คงพฤติกรรมปัจจุบันตามที่ได้รับมา
    - `contextVisibility: "allowlist"` กรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่อยู่ในรายการอนุญาต
    - `contextVisibility: "allowlist_quote"` คือ `allowlist` พร้อมข้อยกเว้นคำอ้างอิง/การตอบกลับที่ชัดเจนหนึ่งรายการ

    จนกว่าจะมีการนำโมเดลการเสริมความแข็งแรงนี้ไปใช้ให้สอดคล้องกันในทุกช่อง ให้คาดว่าจะมีความแตกต่างตามพื้นผิว

  </Accordion>
</AccordionGroup>

![ลำดับการไหลของข้อความกลุ่ม](/images/groups-flow.svg)

หากคุณต้องการ...

| เป้าหมาย | สิ่งที่ต้องตั้งค่า |
| -------------------------------------------- | ---------------------------------------------------------- |
| อนุญาตทุกกลุ่ม แต่ตอบกลับเฉพาะเมื่อมี @mentions | `groups: { "*": { requireMention: true } }` |
| ปิดการตอบกลับกลุ่มทั้งหมด | `groupPolicy: "disabled"` |
| เฉพาะบางกลุ่ม | `groups: { "<group-id>": { ... } }` (ไม่มีคีย์ `"*"`) |
| เฉพาะคุณเท่านั้นที่เรียกใช้ในกลุ่มได้ | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| ใช้ชุดผู้ส่งที่เชื่อถือได้หนึ่งชุดซ้ำในหลายช่อง | `groupAllowFrom: ["accessGroup:operators"]` |

สำหรับรายการอนุญาตผู้ส่งที่ใช้ซ้ำได้ โปรดดู [กลุ่มการเข้าถึง](/th/channels/access-groups)

## คีย์เซสชัน

- เซสชันกลุ่มใช้คีย์เซสชัน `agent:<agentId>:<channel>:group:<id>` (ห้อง/ช่องใช้ `agent:<agentId>:<channel>:channel:<id>`)
- หัวข้อฟอรัม Telegram เพิ่ม `:topic:<threadId>` ต่อท้ายรหัสกลุ่มเพื่อให้แต่ละหัวข้อมีเซสชันของตัวเอง
- แชตโดยตรงใช้เซสชันหลัก (หรือแยกตามผู้ส่งหากกำหนดค่าไว้)
- ข้าม Heartbeat สำหรับเซสชันกลุ่ม

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## รูปแบบ: แชตส่วนตัว + กลุ่มสาธารณะ (agent เดียว)

ได้ สิ่งนี้ใช้งานได้ดีหากทราฟฟิก "ส่วนตัว" ของคุณคือ **แชตส่วนตัว** และทราฟฟิก "สาธารณะ" ของคุณคือ **กลุ่ม**

เหตุผล: ในโหมด agent เดียว แชตส่วนตัวมักเข้าสู่คีย์เซสชัน **หลัก** (`agent:main:main`) ในขณะที่กลุ่มจะใช้คีย์เซสชัน **ที่ไม่ใช่หลัก** เสมอ (`agent:main:<channel>:group:<id>`) หากคุณเปิดใช้ sandboxing ด้วย `mode: "non-main"` เซสชันกลุ่มเหล่านั้นจะทำงานในแบ็กเอนด์ sandbox ที่กำหนดไว้ ขณะที่เซสชันแชตส่วนตัวหลักของคุณยังคงอยู่บนโฮสต์ Docker เป็นแบ็กเอนด์เริ่มต้นหากคุณไม่ได้เลือกไว้

สิ่งนี้ให้ "สมอง" agent หนึ่งชุด (พื้นที่ทำงาน + หน่วยความจำที่ใช้ร่วมกัน) แต่มีท่าทางการดำเนินงานสองแบบ:

- **แชตส่วนตัว**: เครื่องมือเต็มรูปแบบ (โฮสต์)
- **กลุ่ม**: sandbox + เครื่องมือที่ถูกจำกัด

<Note>
หากคุณต้องการพื้นที่ทำงาน/บุคลิกที่แยกจากกันจริง ๆ ("ส่วนตัว" และ "สาธารณะ" ต้องไม่ปะปนกันเลย) ให้ใช้ agent ตัวที่สอง + การผูก โปรดดู [การกำหนดเส้นทางหลาย Agent](/th/concepts/multi-agent)
</Note>

<Tabs>
  <Tab title="แชตส่วนตัวบนโฮสต์ กลุ่มอยู่ใน sandbox">
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
    ต้องการให้ "กลุ่มเห็นได้เฉพาะโฟลเดอร์ X" แทน "ไม่มีการเข้าถึงโฮสต์" ใช่ไหม ให้คง `workspaceAccess: "none"` และเมานต์เฉพาะเส้นทางที่อยู่ในรายการอนุญาตเข้าไปใน sandbox:

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
- การดีบักว่าเหตุใดเครื่องมือจึงถูกบล็อก: [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated)
- รายละเอียด bind mounts: [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts)

## ป้ายกำกับการแสดงผล

- ป้ายกำกับ UI ใช้ `displayName` เมื่อมี โดยจัดรูปแบบเป็น `<channel>:<token>`
- `#room` สงวนไว้สำหรับห้อง/ช่อง แชตกลุ่มใช้ `g-<slug>` (ตัวพิมพ์เล็ก, ช่องว่าง -> `-`, คง `#@+._-`)

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

| นโยบาย | พฤติกรรม |
| ------------- | ------------------------------------------------------------ |
| `"open"` | กลุ่มข้ามรายการอนุญาต การควบคุมด้วยการกล่าวถึงยังคงมีผล |
| `"disabled"` | บล็อกข้อความกลุ่มทั้งหมดโดยสมบูรณ์ |
| `"allowlist"` | อนุญาตเฉพาะกลุ่ม/ห้องที่ตรงกับรายการอนุญาตที่กำหนดไว้ |

<AccordionGroup>
  <Accordion title="หมายเหตุต่อช่อง">
    - `groupPolicy` แยกจากการควบคุมด้วยการกล่าวถึง (ซึ่งต้องมี @mentions)
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: ใช้ `groupAllowFrom` (สำรอง: `allowFrom` ที่ระบุชัดเจน)
    - Signal: `groupAllowFrom` สามารถตรงกับรหัสกลุ่ม Signal ขาเข้าหรือหมายเลขโทรศัพท์/UUID ของผู้ส่ง
    - การอนุมัติการจับคู่แชตส่วนตัว (รายการจัดเก็บ `*-allowFrom`) ใช้กับการเข้าถึงแชตส่วนตัวเท่านั้น การอนุญาตผู้ส่งในกลุ่มยังคงต้องระบุชัดเจนในรายการอนุญาตของกลุ่ม
    - Discord: รายการอนุญาตใช้ `channels.discord.guilds.<id>.channels`
    - Slack: รายการอนุญาตใช้ `channels.slack.channels`
    - Matrix: รายการอนุญาตใช้ `channels.matrix.groups` แนะนำให้ใช้รหัสห้องหรือ alias การค้นหาชื่อห้องที่เข้าร่วมแล้วเป็นแบบ best-effort และชื่อที่แก้ไม่ได้จะถูกละเว้นขณะรันไทม์ ใช้ `channels.matrix.groupAllowFrom` เพื่อจำกัดผู้ส่ง รองรับรายการอนุญาต `users` รายห้องด้วย
    - แชตส่วนตัวแบบกลุ่มถูกควบคุมแยกต่างหาก (`channels.discord.dm.*`, `channels.slack.dm.*`)
    - รายการอนุญาต Telegram สามารถตรงกับรหัสผู้ใช้ (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) หรือชื่อผู้ใช้ (`"@alice"` หรือ `"alice"`) prefix ไม่คำนึงถึงตัวพิมพ์ใหญ่เล็ก
    - ค่าเริ่มต้นคือ `groupPolicy: "allowlist"` หากรายการอนุญาตของกลุ่มว่าง ข้อความกลุ่มจะถูกบล็อก
    - ความปลอดภัยขณะรันไทม์: เมื่อไม่มีบล็อก provider เลย (`channels.<provider>` ไม่มีอยู่) นโยบายกลุ่มจะถอยกลับไปใช้โหมดปิดเมื่อไม่แน่ใจ (โดยทั่วไปคือ `allowlist`) แทนการสืบทอด `channels.defaults.groupPolicy`

  </Accordion>
</AccordionGroup>

แบบจำลองทางความคิดแบบย่อ (ลำดับการประเมินสำหรับข้อความกลุ่ม):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (เปิด/ปิดใช้งาน/allowlist)
  </Step>
  <Step title="Group allowlists">
    รายการอนุญาตของกลุ่ม (`*.groups`, `*.groupAllowFrom`, รายการอนุญาตเฉพาะช่องทาง)
  </Step>
  <Step title="Mention gating">
    การกั้นด้วยการกล่าวถึง (`requireMention`, `/activation`)
  </Step>
</Steps>

## การกั้นด้วยการกล่าวถึง (ค่าเริ่มต้น)

ข้อความกลุ่มต้องมีการกล่าวถึง เว้นแต่จะถูกแทนที่เป็นรายกลุ่ม ค่าเริ่มต้นอยู่ต่อระบบย่อยภายใต้ `*.groups."*"`

การตอบกลับข้อความของบอตนับเป็นการกล่าวถึงโดยนัยเมื่อช่องทางรองรับเมทาดาทาการตอบกลับ การอ้างอิงข้อความของบอตยังสามารถนับเป็นการกล่าวถึงโดยนัยในช่องทางที่เปิดเผยเมทาดาทาการอ้างอิงได้ด้วย กรณีที่มีในตัวปัจจุบันรวมถึง Telegram, WhatsApp, Slack, Discord, Microsoft Teams และ ZaloUser

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
  <Accordion title="Mention gating notes">
    - `mentionPatterns` เป็นรูปแบบ regex ที่ปลอดภัยและไม่คำนึงถึงตัวพิมพ์ใหญ่เล็ก รูปแบบที่ไม่ถูกต้องและรูปแบบการทำซ้ำซ้อนที่ไม่ปลอดภัยจะถูกละเว้น
    - พื้นผิวที่ให้การกล่าวถึงแบบชัดเจนยังคงผ่านได้ รูปแบบเหล่านี้เป็นเพียงทางสำรอง
    - การแทนที่ต่อเอเจนต์: `agents.list[].groupChat.mentionPatterns` (มีประโยชน์เมื่อหลายเอเจนต์ใช้กลุ่มร่วมกัน)
    - การกั้นด้วยการกล่าวถึงจะบังคับใช้เฉพาะเมื่อสามารถตรวจจับการกล่าวถึงได้เท่านั้น (มีการกล่าวถึงแบบเนทีฟหรือกำหนดค่า `mentionPatterns` ไว้)
    - การใส่กลุ่มหรือผู้ส่งในรายการอนุญาตไม่ได้ปิดใช้งานการกั้นด้วยการกล่าวถึง ให้ตั้งค่า `requireMention` ของกลุ่มนั้นเป็น `false` เมื่อควรให้ทุกข้อความทริกเกอร์
    - บริบทพรอมป์ของแชตกลุ่มจะส่งคำสั่งตอบกลับแบบเงียบที่แก้แล้วในทุกเทิร์น ไฟล์เวิร์กสเปซไม่ควรทำซ้ำกลไก `NO_REPLY`
    - กลุ่มที่อนุญาตการตอบกลับแบบเงียบจะถือว่าเทิร์นของโมเดลที่ว่างสะอาดหรือมีแต่เหตุผลเป็นแบบเงียบ เทียบเท่ากับ `NO_REPLY` แชตโดยตรงจะทำแบบเดียวกันเฉพาะเมื่ออนุญาตการตอบกลับแบบเงียบโดยตรงไว้อย่างชัดเจน มิฉะนั้นการตอบกลับที่ว่างยังคงเป็นเทิร์นเอเจนต์ที่ล้มเหลว
    - ค่าเริ่มต้นของ Discord อยู่ใน `channels.discord.guilds."*"` (แทนที่ได้ต่อกิลด์/ช่อง)
    - บริบทประวัติกลุ่มถูกครอบในรูปแบบเดียวกันในทุกช่องทางและเป็นแบบ **pending-only** (ข้อความที่ถูกข้ามเนื่องจากการกั้นด้วยการกล่าวถึง) ใช้ `messages.groupChat.historyLimit` สำหรับค่าเริ่มต้นส่วนกลาง และ `channels.<channel>.historyLimit` (หรือ `channels.<channel>.accounts.*.historyLimit`) สำหรับการแทนที่ ตั้งเป็น `0` เพื่อปิดใช้งาน

  </Accordion>
</AccordionGroup>

## ข้อจำกัดเครื่องมือของกลุ่ม/ช่องทาง (ไม่บังคับ)

การกำหนดค่าบางช่องทางรองรับการจำกัดว่าเครื่องมือใดพร้อมใช้งาน **ภายในกลุ่ม/ห้อง/ช่องที่ระบุ**

- `tools`: อนุญาต/ปฏิเสธเครื่องมือสำหรับทั้งกลุ่ม
- `toolsBySender`: การแทนที่ต่อผู้ส่งภายในกลุ่ม ใช้คำนำหน้าคีย์แบบชัดเจน: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` และไวลด์การ์ด `"*"` คีย์แบบเดิมที่ไม่มีคำนำหน้ายังยอมรับอยู่และจับคู่เป็น `id:` เท่านั้น

ลำดับการแก้ค่า (รายการที่เฉพาะเจาะจงที่สุดชนะ):

<Steps>
  <Step title="Group toolsBySender">
    การจับคู่ `toolsBySender` ของกลุ่ม/ช่องทาง
  </Step>
  <Step title="Group tools">
    `tools` ของกลุ่ม/ช่องทาง
  </Step>
  <Step title="Default toolsBySender">
    การจับคู่ `toolsBySender` ค่าเริ่มต้น (`"*"`)
  </Step>
  <Step title="Default tools">
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
ข้อจำกัดเครื่องมือของกลุ่ม/ช่องทางจะถูกนำไปใช้เพิ่มเติมจากนโยบายเครื่องมือส่วนกลาง/เอเจนต์ (การปฏิเสธยังคงชนะ) บางช่องทางใช้การซ้อนคนละแบบสำหรับห้อง/ช่อง (เช่น Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`)
</Note>

## รายการอนุญาตของกลุ่ม

เมื่อกำหนดค่า `channels.whatsapp.groups`, `channels.telegram.groups` หรือ `channels.imessage.groups` คีย์จะทำหน้าที่เป็นรายการอนุญาตของกลุ่ม ใช้ `"*"` เพื่ออนุญาตทุกกลุ่มในขณะที่ยังตั้งค่าพฤติกรรมการกล่าวถึงเริ่มต้นได้

<Warning>
จุดที่มักสับสน: การอนุมัติการจับคู่ DM ไม่เหมือนกับการอนุญาตกลุ่ม สำหรับช่องทางที่รองรับการจับคู่ DM ที่เก็บการจับคู่จะปลดล็อกเฉพาะ DM เท่านั้น คำสั่งกลุ่มยังคงต้องมีการอนุญาตผู้ส่งกลุ่มแบบชัดเจนจากรายการอนุญาตในการกำหนดค่า เช่น `groupAllowFrom` หรือทางสำรองการกำหนดค่าที่บันทึกไว้สำหรับช่องทางนั้น
</Warning>

เจตนาที่พบบ่อย (คัดลอก/วาง):

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

เจ้าของกลุ่มสามารถสลับการเปิดใช้งานต่อกลุ่มได้:

- `/activation mention`
- `/activation always`

เจ้าของถูกกำหนดโดย `channels.whatsapp.allowFrom` (หรือ E.164 ของตัวบอตเองเมื่อไม่ได้ตั้งค่า) ส่งคำสั่งเป็นข้อความเดี่ยว พื้นผิวอื่น ๆ ในปัจจุบันจะละเว้น `/activation`

## ฟิลด์บริบท

เพย์โหลดขาเข้าของกลุ่มตั้งค่า:

- `ChatType=group`
- `GroupSubject` (ถ้าทราบ)
- `GroupMembers` (ถ้าทราบ)
- `WasMentioned` (ผลลัพธ์การกั้นด้วยการกล่าวถึง)
- หัวข้อฟอรัมของ Telegram ยังรวม `MessageThreadId` และ `IsForum` ด้วย

หมายเหตุเฉพาะช่องทาง:

- BlueBubbles สามารถเลือกเพิ่มข้อมูลผู้เข้าร่วมกลุ่ม macOS ที่ไม่มีชื่อจากฐานข้อมูล Contacts ในเครื่องก่อนเติม `GroupMembers` ได้ ฟีเจอร์นี้ปิดอยู่ตามค่าเริ่มต้นและจะทำงานหลังจากการกั้นกลุ่มปกติผ่านแล้วเท่านั้น

พรอมป์ระบบของเอเจนต์มีบทนำกลุ่มในเทิร์นแรกของเซสชันกลุ่มใหม่ โดยเตือนโมเดลให้ตอบเหมือนมนุษย์ หลีกเลี่ยงตาราง Markdown ลดบรรทัดว่างและใช้การเว้นระยะเหมือนแชตปกติ และหลีกเลี่ยงการพิมพ์ลำดับ `\n` แบบตัวอักษร ชื่อกลุ่มและป้ายชื่อผู้เข้าร่วมที่มาจากช่องทางจะแสดงเป็นเมทาดาทาที่ไม่น่าเชื่อถือในบล็อกโค้ด ไม่ใช่คำสั่งระบบแบบอินไลน์

## รายละเอียดเฉพาะของ iMessage

- ควรใช้ `chat_id:<id>` เมื่อกำหนดเส้นทางหรือใส่ในรายการอนุญาต
- แสดงรายการแชต: `imsg chats --limit 20`
- การตอบกลับกลุ่มจะกลับไปยัง `chat_id` เดิมเสมอ

## พรอมป์ระบบของ WhatsApp

ดู [WhatsApp](/th/channels/whatsapp#system-prompts) สำหรับกฎพรอมป์ระบบ WhatsApp ที่เป็นมาตรฐาน รวมถึงการแก้พรอมป์ของกลุ่มและโดยตรง พฤติกรรมไวลด์การ์ด และความหมายของการแทนที่บัญชี

## รายละเอียดเฉพาะของ WhatsApp

ดู [ข้อความกลุ่ม](/th/channels/group-messages) สำหรับพฤติกรรมเฉพาะ WhatsApp (การแทรกประวัติ รายละเอียดการจัดการการกล่าวถึง)

## ที่เกี่ยวข้อง

- [กลุ่มกระจายข้อความ](/th/channels/broadcast-groups)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [ข้อความกลุ่ม](/th/channels/group-messages)
- [การจับคู่](/th/channels/pairing)
