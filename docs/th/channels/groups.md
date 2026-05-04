---
read_when:
    - การเปลี่ยนลักษณะการทำงานของแชตกลุ่มหรือการกำหนดเงื่อนไขการกล่าวถึง
sidebarTitle: Groups
summary: พฤติกรรมของแชทกลุ่มในพื้นผิวต่าง ๆ (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: กลุ่ม
x-i18n:
    generated_at: "2026-05-04T02:21:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: dea506c011a5d8f6155b2f56aacb236482cb8c5b7457001cb2171fd45932443d
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw ปฏิบัติต่อแชตกลุ่มอย่างสม่ำเสมอในทุกพื้นผิว: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## แนะนำสำหรับผู้เริ่มต้น (2 นาที)

OpenClaw "อยู่" ในบัญชีรับส่งข้อความของคุณเอง ไม่มีผู้ใช้บอต WhatsApp แยกต่างหาก หาก **คุณ** อยู่ในกลุ่ม OpenClaw จะมองเห็นกลุ่มนั้นและตอบกลับในนั้นได้

พฤติกรรมเริ่มต้น:

- กลุ่มถูกจำกัด (`groupPolicy: "allowlist"`)
- การตอบกลับต้องมีการกล่าวถึง เว้นแต่คุณจะปิดการกั้นด้วยการกล่าวถึงอย่างชัดเจน
- การตอบกลับสุดท้ายตามปกติในกลุ่ม/ช่องเป็นแบบส่วนตัวโดยค่าเริ่มต้น เอาต์พุตที่มองเห็นได้ในห้องใช้เครื่องมือ `message`

กล่าวคือ: ผู้ส่งที่อยู่ในรายการอนุญาตสามารถเรียก OpenClaw ได้ด้วยการกล่าวถึง

<Note>
**สรุปสั้นๆ**

- **การเข้าถึง DM** ควบคุมโดย `*.allowFrom`
- **การเข้าถึงกลุ่ม** ควบคุมโดย `*.groupPolicy` + รายการอนุญาต (`*.groups`, `*.groupAllowFrom`)
- **การเรียกให้ตอบกลับ** ควบคุมโดยการกั้นด้วยการกล่าวถึง (`requireMention`, `/activation`)

</Note>

ลำดับอย่างย่อ (สิ่งที่เกิดขึ้นกับข้อความกลุ่ม):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## การตอบกลับที่มองเห็นได้

สำหรับห้องกลุ่ม/ช่อง OpenClaw ตั้งค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`
`openclaw doctor --fix` จะเขียนค่าเริ่มต้นนี้ลงในการกำหนดค่าช่องที่ตั้งค่าไว้ซึ่งยังไม่ได้ระบุค่านี้
นั่นหมายความว่า agent ยังคงประมวลผลรอบนั้นและอัปเดตสถานะ memory/session ได้ แต่คำตอบสุดท้ายตามปกติจะไม่ถูกโพสต์กลับเข้าไปในห้องโดยอัตโนมัติ หากต้องการพูดให้มองเห็นได้ agent จะใช้ `message(action=send)`

ค่าเริ่มต้นนี้ขึ้นอยู่กับ model/runtime ที่เรียกใช้เครื่องมือได้อย่างเชื่อถือได้ หากล็อกแสดงข้อความ assistant แต่ `didSendViaMessagingTool: false` แสดงว่า model ตอบแบบส่วนตัวแทนที่จะเรียกเครื่องมือ message นั่นไม่ใช่ความล้มเหลวในการส่งของ Discord/Slack/Telegram ให้ใช้ model ที่เรียกเครื่องมือได้เชื่อถือได้สำหรับ session กลุ่ม/ช่อง หรือตั้งค่า `messages.groupChat.visibleReplies: "automatic"` เพื่อกู้คืนการตอบกลับสุดท้ายแบบมองเห็นได้ตามพฤติกรรมเดิม

หากเครื่องมือ message ไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะ fallback ไปใช้การตอบกลับที่มองเห็นได้แบบอัตโนมัติแทนที่จะระงับการตอบสนองอย่างเงียบๆ `openclaw doctor` จะเตือนเกี่ยวกับความไม่ตรงกันนี้

สำหรับแชตโดยตรงและรอบจากแหล่งอื่นใด ให้ใช้ `messages.visibleReplies: "message_tool"` เพื่อใช้พฤติกรรมการตอบกลับแบบมองเห็นได้ผ่านเครื่องมือเท่านั้นในระดับ global Harness ยังสามารถเลือกค่านี้เป็นค่าเริ่มต้นเมื่อยังไม่ได้ตั้งค่าได้ด้วย; Codex harness ทำเช่นนี้สำหรับแชตโดยตรงในโหมด Codex `messages.groupChat.visibleReplies` ยังคงเป็น override ที่เฉพาะเจาะจงกว่าสำหรับห้องกลุ่ม/ช่อง

สิ่งนี้แทนที่รูปแบบเดิมที่บังคับให้ model ตอบ `NO_REPLY` สำหรับรอบส่วนใหญ่ในโหมดเฝ้าดู ในโหมดใช้เครื่องมือเท่านั้น การไม่แสดงสิ่งใดให้มองเห็นได้หมายถึงการไม่เรียกเครื่องมือ message

ตัวบ่งชี้การพิมพ์ยังคงถูกส่งขณะที่ agent ทำงานในโหมดใช้เครื่องมือเท่านั้น โหมดการพิมพ์เริ่มต้นของกลุ่มจะถูกอัปเกรดจาก "message" เป็น "instant" สำหรับรอบเหล่านี้ เพราะอาจไม่มีข้อความ assistant ตามปกติก่อนที่ agent จะตัดสินใจว่าจะเรียกเครื่องมือ message หรือไม่ การกำหนดค่าโหมดการพิมพ์อย่างชัดเจนยังคงมีผลเหนือกว่า

เพื่อกู้คืนการตอบกลับสุดท้ายแบบอัตโนมัติตามพฤติกรรมเดิมสำหรับห้องกลุ่ม/ช่อง:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway จะ hot-reload การกำหนดค่า `messages` หลังจากบันทึกไฟล์ ให้รีสตาร์ทเฉพาะเมื่อการเฝ้าดูไฟล์หรือการ reload การกำหนดค่าถูกปิดใช้งานในการติดตั้งใช้งาน

เพื่อบังคับให้เอาต์พุตที่มองเห็นได้ต้องผ่านเครื่องมือ message สำหรับแชตทุกแหล่ง:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

คำสั่ง slash แบบเนทีฟ (Discord, Telegram และพื้นผิวอื่นๆ ที่รองรับคำสั่งเนทีฟ) จะข้าม `visibleReplies: "message_tool"` และตอบกลับแบบมองเห็นได้เสมอ เพื่อให้ UI คำสั่งเนทีฟของช่องได้รับการตอบสนองตามที่คาดไว้ สิ่งนี้ใช้กับรอบคำสั่งเนทีฟที่ผ่านการตรวจสอบแล้วเท่านั้น; คำสั่ง `/...` ที่พิมพ์เป็นข้อความและรอบแชตทั่วไปยังคงทำตามค่าเริ่มต้นของกลุ่มที่กำหนดไว้

## การมองเห็นบริบทและรายการอนุญาต

การควบคุมสองอย่างที่เกี่ยวข้องกับความปลอดภัยของกลุ่ม:

- **การอนุญาตให้เรียกใช้งาน**: ใครสามารถเรียก agent ได้ (`groupPolicy`, `groups`, `groupAllowFrom`, รายการอนุญาตเฉพาะช่อง)
- **การมองเห็นบริบท**: บริบทเสริมใดถูกฉีดเข้าไปใน model (ข้อความตอบกลับ, คำอ้างอิง, ประวัติเธรด, metadata ที่ส่งต่อ)

โดยค่าเริ่มต้น OpenClaw ให้ความสำคัญกับพฤติกรรมแชตปกติและเก็บบริบทไว้ใกล้เคียงกับที่ได้รับมาเป็นส่วนใหญ่ ซึ่งหมายความว่ารายการอนุญาตมีหน้าที่หลักในการตัดสินว่าใครสามารถเรียกการดำเนินการได้ ไม่ใช่ขอบเขตการปกปิดข้อมูลแบบครอบจักรวาลสำหรับทุกส่วนย่อยที่ถูกอ้างอิงหรืออยู่ในประวัติ

<AccordionGroup>
  <Accordion title="พฤติกรรมปัจจุบันเป็นแบบเฉพาะช่อง">
    - บางช่องใช้การกรองตามผู้ส่งสำหรับบริบทเสริมในเส้นทางเฉพาะอยู่แล้ว (เช่น การ seeding เธรด Slack, การ lookup การตอบกลับ/เธรดของ Matrix)
    - ช่องอื่นๆ ยังคงส่งผ่านบริบท quote/reply/forward ตามที่ได้รับมา

  </Accordion>
  <Accordion title="ทิศทางการทำให้เข้มงวดขึ้น (วางแผนไว้)">
    - `contextVisibility: "all"` (ค่าเริ่มต้น) คงพฤติกรรมปัจจุบันตามที่ได้รับมา
    - `contextVisibility: "allowlist"` กรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่อยู่ในรายการอนุญาต
    - `contextVisibility: "allowlist_quote"` คือ `allowlist` พร้อมข้อยกเว้น quote/reply แบบชัดเจนหนึ่งรายการ

    จนกว่าจะมีการนำโมเดลการทำให้เข้มงวดนี้ไปใช้อย่างสม่ำเสมอในทุกช่อง ให้คาดว่าจะมีความแตกต่างกันตามพื้นผิว

  </Accordion>
</AccordionGroup>

![ลำดับข้อความกลุ่ม](/images/groups-flow.svg)

หากคุณต้องการ...

| เป้าหมาย | สิ่งที่ต้องตั้งค่า |
| -------------------------------------------- | ---------------------------------------------------------- |
| อนุญาตทุกกลุ่มแต่ตอบกลับเฉพาะเมื่อมี @mentions | `groups: { "*": { requireMention: true } }` |
| ปิดการตอบกลับกลุ่มทั้งหมด | `groupPolicy: "disabled"` |
| เฉพาะกลุ่มที่ระบุ | `groups: { "<group-id>": { ... } }` (ไม่มีคีย์ `"*"`) |
| เฉพาะคุณที่เรียกในกลุ่มได้ | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| ใช้ชุดผู้ส่งที่เชื่อถือได้ชุดเดียวซ้ำในหลายช่อง | `groupAllowFrom: ["accessGroup:operators"]` |

สำหรับรายการอนุญาตผู้ส่งที่ใช้ซ้ำได้ ดู [กลุ่มการเข้าถึง](/th/channels/access-groups)

## คีย์ session

- session กลุ่มใช้คีย์ session แบบ `agent:<agentId>:<channel>:group:<id>` (ห้อง/ช่องใช้ `agent:<agentId>:<channel>:channel:<id>`)
- หัวข้อ forum ของ Telegram เพิ่ม `:topic:<threadId>` ต่อท้าย group id เพื่อให้แต่ละหัวข้อมี session ของตัวเอง
- แชตโดยตรงใช้ session หลัก (หรือแยกตามผู้ส่งหากกำหนดค่าไว้)
- Heartbeats จะถูกข้ามสำหรับ session กลุ่ม

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## รูปแบบ: DM ส่วนตัว + กลุ่มสาธารณะ (agent เดียว)

ใช่ — วิธีนี้ทำงานได้ดีหากทราฟฟิก "ส่วนตัว" ของคุณคือ **DMs** และทราฟฟิก "สาธารณะ" ของคุณคือ **groups**

เหตุผล: ในโหมด agent เดียว โดยทั่วไป DMs จะเข้าสู่คีย์ session **หลัก** (`agent:main:main`) ขณะที่กลุ่มใช้คีย์ session **ที่ไม่ใช่หลัก** เสมอ (`agent:main:<channel>:group:<id>`) หากคุณเปิด sandboxing ด้วย `mode: "non-main"` session กลุ่มเหล่านั้นจะทำงานใน backend sandbox ที่กำหนดค่าไว้ ขณะที่ session DM หลักของคุณยังคงอยู่บน host Docker เป็น backend เริ่มต้นหากคุณไม่ได้เลือกอย่างอื่น

สิ่งนี้ทำให้คุณมี "สมอง" agent หนึ่งตัว (workspace + memory ที่ใช้ร่วมกัน) แต่มีท่าทางการดำเนินการสองแบบ:

- **DMs**: เครื่องมือเต็มรูปแบบ (host)
- **Groups**: sandbox + เครื่องมือที่ถูกจำกัด

<Note>
หากคุณต้องการ workspace/persona ที่แยกจากกันจริงๆ ("personal" และ "public" ต้องไม่ปะปนกันเลย) ให้ใช้ agent ตัวที่สอง + bindings ดู [การกำหนดเส้นทางหลาย Agent](/th/concepts/multi-agent)
</Note>

<Tabs>
  <Tab title="DMs บน host, กลุ่มอยู่ใน sandbox">
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
    ต้องการให้ "กลุ่มเห็นได้เฉพาะโฟลเดอร์ X" แทนที่จะเป็น "ไม่มีการเข้าถึง host" ใช่ไหม ให้คง `workspaceAccess: "none"` ไว้และ mount เฉพาะ path ที่อยู่ในรายการอนุญาตเข้าไปใน sandbox:

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

เกี่ยวข้อง:

- คีย์การกำหนดค่าและค่าเริ่มต้น: [การกำหนดค่า Gateway](/th/gateway/config-agents#agentsdefaultssandbox)
- การดีบักว่าทำไมเครื่องมือจึงถูกบล็อก: [Sandbox เทียบกับ Tool Policy เทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated)
- รายละเอียด bind mounts: [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts)

## ป้ายแสดงผล

- ป้าย UI ใช้ `displayName` เมื่อมี โดยจัดรูปแบบเป็น `<channel>:<token>`
- `#room` สงวนไว้สำหรับห้อง/ช่อง; แชตกลุ่มใช้ `g-<slug>` (ตัวพิมพ์เล็ก, ช่องว่าง -> `-`, เก็บ `#@+._-` ไว้)

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

| นโยบาย | พฤติกรรม |
| ------------- | ------------------------------------------------------------ |
| `"open"` | กลุ่มข้ามรายการอนุญาต; การกั้นด้วยการกล่าวถึงยังคงมีผล |
| `"disabled"` | บล็อกข้อความกลุ่มทั้งหมดโดยสิ้นเชิง |
| `"allowlist"` | อนุญาตเฉพาะกลุ่ม/ห้องที่ตรงกับรายการอนุญาตที่กำหนดค่าไว้ |

<AccordionGroup>
  <Accordion title="หมายเหตุรายช่องทาง">
    - `groupPolicy` แยกจากการควบคุมด้วยการกล่าวถึง (ซึ่งต้องใช้ @mentions)
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: ใช้ `groupAllowFrom` (สำรอง: `allowFrom` แบบระบุชัดเจน)
    - Signal: `groupAllowFrom` สามารถตรงกับ id กลุ่ม Signal ขาเข้าหรือโทรศัพท์/UUID ของผู้ส่งได้
    - การอนุมัติการจับคู่ DM (รายการจัดเก็บ `*-allowFrom`) ใช้กับการเข้าถึง DM เท่านั้น; การอนุญาตผู้ส่งในกลุ่มยังคงต้องระบุอย่างชัดเจนในรายการอนุญาตของกลุ่ม
    - Discord: รายการอนุญาตใช้ `channels.discord.guilds.<id>.channels`
    - Slack: รายการอนุญาตใช้ `channels.slack.channels`
    - Matrix: รายการอนุญาตใช้ `channels.matrix.groups` ควรใช้ ID ห้องหรือนามแฝง; การค้นหาชื่อห้องที่เข้าร่วมแล้วเป็นแบบพยายามให้ดีที่สุด และชื่อที่แก้ไขไม่ได้จะถูกละเว้นขณะรันไทม์ ใช้ `channels.matrix.groupAllowFrom` เพื่อจำกัดผู้ส่ง; รองรับรายการอนุญาต `users` ต่อห้องด้วย
    - DM กลุ่มถูกควบคุมแยกต่างหาก (`channels.discord.dm.*`, `channels.slack.dm.*`)
    - รายการอนุญาตของ Telegram สามารถตรงกับ ID ผู้ใช้ (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) หรือชื่อผู้ใช้ (`"@alice"` หรือ `"alice"`); prefix ไม่คำนึงถึงตัวพิมพ์ใหญ่เล็ก
    - ค่าเริ่มต้นคือ `groupPolicy: "allowlist"`; หากรายการอนุญาตของกลุ่มว่าง ข้อความกลุ่มจะถูกบล็อก
    - ความปลอดภัยขณะรันไทม์: เมื่อไม่มีบล็อกผู้ให้บริการเลย (`channels.<provider>` ไม่มีอยู่) นโยบายกลุ่มจะถอยกลับไปใช้โหมดปิดเมื่อผิดพลาด (โดยทั่วไปคือ `allowlist`) แทนที่จะสืบทอด `channels.defaults.groupPolicy`

  </Accordion>
</AccordionGroup>

โมเดลคิดแบบเร็ว (ลำดับการประเมินสำหรับข้อความกลุ่ม):

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

ข้อความกลุ่มต้องมีการกล่าวถึง เว้นแต่จะถูกแทนที่ต่อกลุ่ม ค่าเริ่มต้นอยู่ต่อระบบย่อยภายใต้ `*.groups."*"`

การตอบกลับข้อความของบอทนับเป็นการกล่าวถึงโดยนัยเมื่อช่องทางรองรับ metadata ของการตอบกลับ การอ้างข้อความของบอทสามารถนับเป็นการกล่าวถึงโดยนัยได้เช่นกันในช่องทางที่เปิดเผย metadata ของการอ้าง กรณี built-in ปัจจุบันรวมถึง Telegram, WhatsApp, Slack, Discord, Microsoft Teams, และ ZaloUser

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
  <Accordion title="หมายเหตุการควบคุมด้วยการกล่าวถึง">
    - `mentionPatterns` เป็นรูปแบบ regex ที่ปลอดภัยและไม่คำนึงถึงตัวพิมพ์ใหญ่เล็ก; รูปแบบที่ไม่ถูกต้องและรูปแบบการทำซ้ำซ้อนที่ไม่ปลอดภัยจะถูกละเว้น
    - พื้นผิวที่ให้การกล่าวถึงแบบชัดเจนยังคงผ่าน; รูปแบบเป็นตัวสำรอง
    - การแทนที่ต่อเอเจนต์: `agents.list[].groupChat.mentionPatterns` (มีประโยชน์เมื่อหลายเอเจนต์ใช้กลุ่มร่วมกัน)
    - การควบคุมด้วยการกล่าวถึงจะถูกบังคับใช้เฉพาะเมื่อสามารถตรวจจับการกล่าวถึงได้เท่านั้น (มีการกำหนดการกล่าวถึงแบบเนทีฟหรือ `mentionPatterns`)
    - การอนุญาตกลุ่มหรือผู้ส่งไม่ได้ปิดการควบคุมด้วยการกล่าวถึง; ตั้งค่า `requireMention` ของกลุ่มนั้นเป็น `false` เมื่อข้อความทั้งหมดควรกระตุ้นการทำงาน
    - บริบทพรอมป์แชตกลุ่มจะพาคำสั่งการตอบแบบเงียบที่แก้ไขแล้วไปทุกเทิร์น; ไฟล์พื้นที่ทำงานไม่ควรทำซ้ำกลไก `NO_REPLY`
    - กลุ่มที่อนุญาตการตอบแบบเงียบจะถือว่าเทิร์นโมเดลที่ว่างเปล่าสะอาดหรือมีแต่เหตุผลเป็นแบบเงียบ เทียบเท่ากับ `NO_REPLY` แชตโดยตรงทำแบบเดียวกันเฉพาะเมื่ออนุญาตการตอบแบบเงียบโดยตรงอย่างชัดเจนเท่านั้น; ไม่เช่นนั้นการตอบว่างยังคงเป็นเทิร์นเอเจนต์ที่ล้มเหลว
    - ค่าเริ่มต้นของ Discord อยู่ใน `channels.discord.guilds."*"` (แทนที่ได้ต่อ guild/channel)
    - บริบทประวัติกลุ่มถูกห่ออย่างสม่ำเสมอข้ามช่องทางและเป็น **pending-only** (ข้อความที่ถูกข้ามเนื่องจากการควบคุมด้วยการกล่าวถึง); ใช้ `messages.groupChat.historyLimit` สำหรับค่าเริ่มต้นส่วนกลาง และ `channels.<channel>.historyLimit` (หรือ `channels.<channel>.accounts.*.historyLimit`) สำหรับการแทนที่ ตั้งค่าเป็น `0` เพื่อปิดใช้

  </Accordion>
</AccordionGroup>

## ข้อจำกัดเครื่องมือของกลุ่ม/ช่องทาง (ไม่บังคับ)

คอนฟิกบางช่องทางรองรับการจำกัดว่าเครื่องมือใดพร้อมใช้ **ภายในกลุ่ม/ห้อง/ช่องทางเฉพาะ**

- `tools`: อนุญาต/ปฏิเสธเครื่องมือสำหรับทั้งกลุ่ม
- `toolsBySender`: การแทนที่ต่อผู้ส่งภายในกลุ่ม ใช้ prefix คีย์แบบชัดเจน: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, และ wildcard `"*"` คีย์เดิมที่ไม่มี prefix ยังยอมรับอยู่และจับคู่เป็น `id:` เท่านั้น

ลำดับการแก้ไข (รายการที่เฉพาะเจาะจงที่สุดชนะ):

<Steps>
  <Step title="toolsBySender ของกลุ่ม">
    การจับคู่ `toolsBySender` ของกลุ่ม/ช่องทาง
  </Step>
  <Step title="เครื่องมือของกลุ่ม">
    `tools` ของกลุ่ม/ช่องทาง
  </Step>
  <Step title="toolsBySender เริ่มต้น">
    การจับคู่ `toolsBySender` เริ่มต้น (`"*"`)
  </Step>
  <Step title="เครื่องมือเริ่มต้น">
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
ข้อจำกัดเครื่องมือของกลุ่ม/ช่องทางจะถูกใช้เพิ่มเติมจากนโยบายเครื่องมือส่วนกลาง/ของเอเจนต์ (deny ยังคงชนะ) บางช่องทางใช้การซ้อนที่แตกต่างกันสำหรับห้อง/ช่องทาง (เช่น Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`)
</Note>

## รายการอนุญาตของกลุ่ม

เมื่อกำหนดค่า `channels.whatsapp.groups`, `channels.telegram.groups`, หรือ `channels.imessage.groups` คีย์จะทำหน้าที่เป็นรายการอนุญาตของกลุ่ม ใช้ `"*"` เพื่ออนุญาตทุกกลุ่มในขณะที่ยังตั้งค่าพฤติกรรมการกล่าวถึงเริ่มต้น

<Warning>
ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่เหมือนกับการอนุญาตกลุ่ม สำหรับช่องทางที่รองรับการจับคู่ DM ที่จัดเก็บการจับคู่จะปลดล็อกเฉพาะ DM เท่านั้น คำสั่งกลุ่มยังคงต้องมีการอนุญาตผู้ส่งกลุ่มแบบชัดเจนจากรายการอนุญาตในคอนฟิก เช่น `groupAllowFrom` หรือคอนฟิกสำรองที่จัดทำเอกสารไว้สำหรับช่องทางนั้น
</Warning>

เจตนาทั่วไป (คัดลอก/วาง):

<Tabs>
  <Tab title="ปิดการตอบกลุ่มทั้งหมด">
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

เจ้าของกลุ่มสามารถสลับการเปิดใช้งานต่อกลุ่มได้:

- `/activation mention`
- `/activation always`

เจ้าของถูกกำหนดโดย `channels.whatsapp.allowFrom` (หรือ E.164 ของตัวบอทเองเมื่อไม่ได้ตั้งค่า) ส่งคำสั่งเป็นข้อความเดี่ยว พื้นผิวอื่นในปัจจุบันละเว้น `/activation`

## ฟิลด์บริบท

payload ขาเข้าของกลุ่มตั้งค่า:

- `ChatType=group`
- `GroupSubject` (หากทราบ)
- `GroupMembers` (หากทราบ)
- `WasMentioned` (ผลลัพธ์การควบคุมด้วยการกล่าวถึง)
- หัวข้อฟอรัม Telegram ยังรวม `MessageThreadId` และ `IsForum` ด้วย

หมายเหตุเฉพาะช่องทาง:

- BlueBubbles สามารถเพิ่มข้อมูลผู้เข้าร่วมกลุ่ม macOS ที่ไม่มีชื่อจากฐานข้อมูล Contacts ในเครื่องก่อนเติม `GroupMembers` ได้ตามตัวเลือก สิ่งนี้ปิดโดยค่าเริ่มต้นและทำงานหลังจากการควบคุมกลุ่มปกติผ่านแล้วเท่านั้น

พรอมป์ระบบของเอเจนต์รวมบทนำกลุ่มในเทิร์นแรกของเซสชันกลุ่มใหม่ มันเตือนโมเดลให้ตอบเหมือนมนุษย์ หลีกเลี่ยงตาราง Markdown ลดบรรทัดว่างและเว้นระยะเหมือนแชตปกติ และหลีกเลี่ยงการพิมพ์ลำดับ `\n` แบบ literal ชื่อกลุ่มและป้ายกำกับผู้เข้าร่วมที่มาจากช่องทางจะแสดงเป็น metadata ที่ไม่น่าเชื่อถือใน fenced block ไม่ใช่คำสั่งระบบแบบ inline

## รายละเอียดเฉพาะของ iMessage

- ควรใช้ `chat_id:<id>` เมื่อกำหนดเส้นทางหรือเพิ่มในรายการอนุญาต
- แสดงรายการแชต: `imsg chats --limit 20`
- การตอบกลับกลุ่มจะกลับไปยัง `chat_id` เดิมเสมอ

## พรอมป์ระบบ WhatsApp

ดู [WhatsApp](/th/channels/whatsapp#system-prompts) สำหรับกฎพรอมป์ระบบ WhatsApp ที่เป็นมาตรฐาน รวมถึงการแก้ไขพรอมป์ของกลุ่มและโดยตรง พฤติกรรม wildcard และความหมายของการแทนที่บัญชี

## รายละเอียดเฉพาะของ WhatsApp

ดู [ข้อความกลุ่ม](/th/channels/group-messages) สำหรับพฤติกรรมเฉพาะ WhatsApp (การฉีดประวัติ รายละเอียดการจัดการการกล่าวถึง)

## ที่เกี่ยวข้อง

- [กลุ่มบรอดแคสต์](/th/channels/broadcast-groups)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [ข้อความกลุ่ม](/th/channels/group-messages)
- [การจับคู่](/th/channels/pairing)
