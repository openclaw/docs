---
read_when:
    - การเปลี่ยนลักษณะการทำงานของแชตกลุ่มหรือการกำหนดเงื่อนไขด้วยการกล่าวถึง
sidebarTitle: Groups
summary: ลักษณะการทำงานของแชตกลุ่มบนพื้นผิวต่าง ๆ (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: กลุ่ม
x-i18n:
    generated_at: "2026-05-02T10:07:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cc33dbbcf5504cae5caa003b7427d99f5c1a2d7c850dedd5d1f58a2fe44fa04
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw จัดการแชตกลุ่มอย่างสม่ำเสมอในทุกพื้นผิว: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## บทนำสำหรับผู้เริ่มต้น (2 นาที)

OpenClaw "อยู่" ในบัญชีรับส่งข้อความของคุณเอง ไม่มีผู้ใช้บอต WhatsApp แยกต่างหาก หาก **คุณ** อยู่ในกลุ่ม OpenClaw จะมองเห็นกลุ่มนั้นและตอบกลับในกลุ่มได้

พฤติกรรมเริ่มต้น:

- กลุ่มถูกจำกัด (`groupPolicy: "allowlist"`)
- การตอบกลับต้องมีการกล่าวถึง เว้นแต่คุณจะปิดการกำหนดให้กล่าวถึงอย่างชัดเจน
- การตอบกลับสุดท้ายตามปกติในกลุ่ม/ช่องเป็นแบบส่วนตัวโดยค่าเริ่มต้น เอาต์พุตที่มองเห็นได้ในห้องใช้เครื่องมือ `message`

แปลความหมาย: ผู้ส่งที่อยู่ในรายการอนุญาตสามารถทริกเกอร์ OpenClaw ได้ด้วยการกล่าวถึง OpenClaw

<Note>
**สรุปย่อ**

- **การเข้าถึง DM** ควบคุมโดย `*.allowFrom`
- **การเข้าถึงกลุ่ม** ควบคุมโดย `*.groupPolicy` + รายการอนุญาต (`*.groups`, `*.groupAllowFrom`)
- **การทริกเกอร์การตอบกลับ** ควบคุมโดยการกำหนดให้กล่าวถึง (`requireMention`, `/activation`)

</Note>

โฟลว์แบบเร็ว (สิ่งที่เกิดขึ้นกับข้อความกลุ่ม):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## การตอบกลับที่มองเห็นได้

สำหรับห้องกลุ่ม/ช่อง OpenClaw ตั้งค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`
หมายความว่า agent ยังคงประมวลผลรอบนั้นและอัปเดตสถานะหน่วยความจำ/เซสชันได้ แต่คำตอบสุดท้ายตามปกติจะไม่ถูกโพสต์กลับเข้าไปในห้องโดยอัตโนมัติ หากต้องการพูดให้มองเห็นได้ agent จะใช้ `message(action=send)`

หากเครื่องมือ message ไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะถอยกลับไปใช้การตอบกลับที่มองเห็นได้แบบอัตโนมัติแทนการกดการตอบสนองไว้เงียบ ๆ
`openclaw doctor` จะเตือนเกี่ยวกับความไม่ตรงกันนี้

สำหรับแชตโดยตรงและรอบจากแหล่งอื่น ๆ ให้ใช้ `messages.visibleReplies: "message_tool"` เพื่อใช้พฤติกรรมการตอบกลับที่มองเห็นได้แบบผ่านเครื่องมือเท่านั้นในระดับทั่วทั้งระบบ Harness ยังสามารถเลือกค่านี้เป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งค่าได้ด้วย; Codex harness ทำเช่นนี้สำหรับแชตโดยตรงในโหมด Codex `messages.groupChat.visibleReplies` ยังคงเป็นการ override ที่เฉพาะเจาะจงกว่าสำหรับห้องกลุ่ม/ช่อง

สิ่งนี้แทนที่รูปแบบเก่าที่บังคับให้โมเดลตอบ `NO_REPLY` สำหรับรอบส่วนใหญ่ในโหมดแอบดู ในโหมดผ่านเครื่องมือเท่านั้น การไม่ทำอะไรให้มองเห็นได้หมายถึงการไม่เรียกใช้เครื่องมือ message เท่านั้น

ยังคงส่งตัวบ่งชี้การพิมพ์ขณะที่ agent ทำงานในโหมดผ่านเครื่องมือเท่านั้น โหมดการพิมพ์ของกลุ่มเริ่มต้นถูกยกระดับจาก "message" เป็น "instant" สำหรับรอบเหล่านี้ เพราะอาจไม่มีข้อความ assistant ปกติก่อนที่ agent จะตัดสินใจว่าจะเรียกใช้เครื่องมือ message หรือไม่ การกำหนดค่าโหมดการพิมพ์ที่ตั้งไว้อย่างชัดเจนยังคงมีผลเหนือกว่า

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

Gateway จะ hot-reload การกำหนดค่า `messages` หลังจากบันทึกไฟล์ รีสตาร์ตเฉพาะเมื่อการเฝ้าดูไฟล์หรือการ reload การกำหนดค่าถูกปิดใช้งานในการปรับใช้เท่านั้น

หากต้องการกำหนดให้เอาต์พุตที่มองเห็นได้ต้องผ่านเครื่องมือ message สำหรับแชตจากทุกแหล่ง:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

คำสั่ง slash แบบเนทีฟ (Discord, Telegram และพื้นผิวอื่น ๆ ที่รองรับคำสั่งเนทีฟ) จะข้าม `visibleReplies: "message_tool"` และตอบกลับให้มองเห็นได้เสมอ เพื่อให้ UI คำสั่งเนทีฟของช่องได้รับการตอบสนองตามที่คาดไว้ สิ่งนี้ใช้กับรอบคำสั่งเนทีฟที่ผ่านการตรวจสอบแล้วเท่านั้น; คำสั่ง `/...` ที่พิมพ์เป็นข้อความและรอบแชตปกติยังคงทำตามค่าเริ่มต้นของกลุ่มที่กำหนดไว้

## การมองเห็นบริบทและรายการอนุญาต

มีการควบคุมสองอย่างที่เกี่ยวข้องกับความปลอดภัยของกลุ่ม:

- **การอนุญาตให้ทริกเกอร์**: ใครสามารถทริกเกอร์ agent ได้ (`groupPolicy`, `groups`, `groupAllowFrom`, รายการอนุญาตเฉพาะช่อง)
- **การมองเห็นบริบท**: บริบทเสริมใดถูกแทรกเข้าไปในโมเดล (ข้อความตอบกลับ, คำอ้างอิง, ประวัติเธรด, metadata ที่ส่งต่อ)

โดยค่าเริ่มต้น OpenClaw ให้ความสำคัญกับพฤติกรรมแชตปกติและเก็บบริบทไว้ใกล้เคียงกับที่ได้รับเป็นหลัก หมายความว่ารายการอนุญาตจะตัดสินเป็นหลักว่าใครสามารถทริกเกอร์การกระทำได้ ไม่ใช่ขอบเขตการปกปิดสากลสำหรับทุกส่วนย่อยที่ถูกอ้างอิงหรือมาจากประวัติ

<AccordionGroup>
  <Accordion title="พฤติกรรมปัจจุบันเฉพาะตามช่อง">
    - บางช่องใช้การกรองตามผู้ส่งสำหรับบริบทเสริมในเส้นทางเฉพาะอยู่แล้ว (เช่น การตั้งต้นเธรด Slack, การค้นหาการตอบกลับ/เธรดของ Matrix)
    - ช่องอื่น ๆ ยังคงส่งผ่านบริบทคำอ้างอิง/การตอบกลับ/การส่งต่อเข้ามาตามที่ได้รับ

  </Accordion>
  <Accordion title="ทิศทางการเสริมความแข็งแกร่ง (วางแผนไว้)">
    - `contextVisibility: "all"` (ค่าเริ่มต้น) คงพฤติกรรมปัจจุบันแบบตามที่ได้รับ
    - `contextVisibility: "allowlist"` กรองบริบทเสริมให้เหลือผู้ส่งที่อยู่ในรายการอนุญาต
    - `contextVisibility: "allowlist_quote"` คือ `allowlist` พร้อมข้อยกเว้นคำอ้างอิง/การตอบกลับแบบชัดเจนหนึ่งรายการ

    จนกว่าโมเดลการเสริมความแข็งแกร่งนี้จะถูกนำไปใช้ให้สม่ำเสมอในทุกช่อง ให้คาดว่าจะมีความแตกต่างตามพื้นผิว

  </Accordion>
</AccordionGroup>

![โฟลว์ข้อความกลุ่ม](/images/groups-flow.svg)

หากคุณต้องการ...

| เป้าหมาย                                         | สิ่งที่ต้องตั้งค่า                                           |
| -------------------------------------------- | ---------------------------------------------------------- |
| อนุญาตทุกกลุ่มแต่ตอบกลับเฉพาะเมื่อมี @mentions | `groups: { "*": { requireMention: true } }`                |
| ปิดการตอบกลับกลุ่มทั้งหมด                    | `groupPolicy: "disabled"`                                  |
| เฉพาะบางกลุ่ม                                | `groups: { "<group-id>": { ... } }` (ไม่มีคีย์ `"*"`)      |
| มีเพียงคุณที่ทริกเกอร์ในกลุ่มได้              | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| ใช้ชุดผู้ส่งที่เชื่อถือได้ชุดเดียวซ้ำในหลายช่อง | `groupAllowFrom: ["accessGroup:operators"]`                |

สำหรับรายการอนุญาตผู้ส่งที่นำกลับมาใช้ซ้ำได้ ดู [กลุ่มการเข้าถึง](/th/channels/access-groups)

## คีย์เซสชัน

- เซสชันกลุ่มใช้คีย์เซสชัน `agent:<agentId>:<channel>:group:<id>` (ห้อง/ช่องใช้ `agent:<agentId>:<channel>:channel:<id>`)
- หัวข้อฟอรัม Telegram เพิ่ม `:topic:<threadId>` ต่อท้ายรหัสกลุ่ม เพื่อให้แต่ละหัวข้อมีเซสชันของตนเอง
- แชตโดยตรงใช้เซสชันหลัก (หรือแยกตามผู้ส่งหากกำหนดค่าไว้)
- ข้าม Heartbeat สำหรับเซสชันกลุ่ม

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## รูปแบบ: DM ส่วนตัว + กลุ่มสาธารณะ (agent เดียว)

ใช่ — วิธีนี้ทำงานได้ดีหากทราฟฟิก "ส่วนตัว" ของคุณคือ **DM** และทราฟฟิก "สาธารณะ" ของคุณคือ **กลุ่ม**

เหตุผล: ในโหมด agent เดียว DM มักจะลงในคีย์เซสชัน **หลัก** (`agent:main:main`) ในขณะที่กลุ่มจะใช้คีย์เซสชันที่ **ไม่ใช่หลัก** เสมอ (`agent:main:<channel>:group:<id>`) หากคุณเปิด sandboxing ด้วย `mode: "non-main"` เซสชันกลุ่มเหล่านั้นจะทำงานใน backend sandbox ที่กำหนดค่าไว้ ขณะที่เซสชัน DM หลักของคุณยังคงอยู่บนโฮสต์ Docker คือ backend เริ่มต้นหากคุณไม่ได้เลือกอย่างอื่น

สิ่งนี้ทำให้คุณมี "สมอง" agent หนึ่งตัว (workspace + หน่วยความจำร่วมกัน) แต่มีท่าทางการดำเนินงานสองแบบ:

- **DM**: เครื่องมือเต็มรูปแบบ (โฮสต์)
- **กลุ่ม**: sandbox + เครื่องมือที่ถูกจำกัด

<Note>
หากคุณต้องการ workspace/persona ที่แยกจากกันอย่างแท้จริง ("ส่วนตัว" และ "สาธารณะ" ต้องไม่ปะปนกันเลย) ให้ใช้ agent ตัวที่สอง + bindings ดู [การกำหนดเส้นทางหลาย Agent](/th/concepts/multi-agent)
</Note>

<Tabs>
  <Tab title="DM บนโฮสต์, กลุ่มอยู่ใน sandbox">
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
    ต้องการให้ "กลุ่มเห็นได้เฉพาะโฟลเดอร์ X" แทน "ไม่มีการเข้าถึงโฮสต์" หรือไม่? คง `workspaceAccess: "none"` ไว้และ mount เฉพาะ path ที่อยู่ในรายการอนุญาตเข้าไปใน sandbox:

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
- รายละเอียด bind mount: [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts)

## ป้ายกำกับการแสดงผล

- ป้ายกำกับ UI ใช้ `displayName` เมื่อมี โดยจัดรูปแบบเป็น `<channel>:<token>`
- `#room` สงวนไว้สำหรับห้อง/ช่อง; แชตกลุ่มใช้ `g-<slug>` (ตัวพิมพ์เล็ก, เว้นวรรค -> `-`, คง `#@+._-`)

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
| `"open"`      | กลุ่มข้ามรายการอนุญาต; การกำหนดให้กล่าวถึงยังคงมีผล         |
| `"disabled"`  | บล็อกข้อความกลุ่มทั้งหมดโดยสิ้นเชิง                         |
| `"allowlist"` | อนุญาตเฉพาะกลุ่ม/ห้องที่ตรงกับรายการอนุญาตที่กำหนดค่าไว้   |

<AccordionGroup>
  <Accordion title="หมายเหตุต่อช่อง">
    - `groupPolicy` แยกจากการกำหนดให้กล่าวถึง (ซึ่งต้องมี @mentions)
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: ใช้ `groupAllowFrom` (fallback: `allowFrom` ที่ระบุชัดเจน)
    - Signal: `groupAllowFrom` สามารถจับคู่ได้ทั้งรหัสกลุ่ม Signal ขาเข้าหรือโทรศัพท์/UUID ของผู้ส่ง
    - การอนุมัติการจับคู่ DM (รายการใน store `*-allowFrom`) ใช้กับการเข้าถึง DM เท่านั้น; การอนุญาตผู้ส่งในกลุ่มยังคงต้องระบุชัดเจนในรายการอนุญาตของกลุ่ม
    - Discord: รายการอนุญาตใช้ `channels.discord.guilds.<id>.channels`
    - Slack: รายการอนุญาตใช้ `channels.slack.channels`
    - Matrix: รายการอนุญาตใช้ `channels.matrix.groups` แนะนำให้ใช้รหัสห้องหรือ alias; การค้นหาชื่อห้องที่เข้าร่วมเป็นแบบพยายามให้ดีที่สุด และชื่อที่ resolve ไม่ได้จะถูกละเว้นขณะรันไทม์ ใช้ `channels.matrix.groupAllowFrom` เพื่อจำกัดผู้ส่ง; รองรับรายการอนุญาต `users` รายห้องด้วย
    - DM แบบกลุ่มถูกควบคุมแยกต่างหาก (`channels.discord.dm.*`, `channels.slack.dm.*`)
    - รายการอนุญาตของ Telegram สามารถจับคู่ user ID (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) หรือ username (`"@alice"` หรือ `"alice"`); prefix ไม่คำนึงถึงตัวพิมพ์เล็กใหญ่
    - ค่าเริ่มต้นคือ `groupPolicy: "allowlist"`; หากรายการอนุญาตของกลุ่มว่างเปล่า ข้อความกลุ่มจะถูกบล็อก
    - ความปลอดภัยขณะรันไทม์: เมื่อไม่มี provider block เลย (`channels.<provider>` ไม่ปรากฏ) นโยบายกลุ่มจะถอยกลับไปยังโหมด fail-closed (โดยทั่วไปคือ `allowlist`) แทนการสืบทอด `channels.defaults.groupPolicy`

  </Accordion>
</AccordionGroup>

โมเดลจำง่ายแบบเร็ว (ลำดับการประเมินสำหรับข้อความกลุ่ม):

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

ข้อความกลุ่มต้องมีการกล่าวถึง เว้นแต่จะถูกแทนที่เป็นรายกลุ่ม ค่าเริ่มต้นอยู่ต่อระบบย่อยภายใต้ `*.groups."*"`

การตอบกลับข้อความของบอตนับเป็นการกล่าวถึงโดยนัยเมื่อช่องทางรองรับเมทาดาทาการตอบกลับ การอ้างอิงข้อความของบอตก็สามารถนับเป็นการกล่าวถึงโดยนัยได้เช่นกันในช่องทางที่เปิดเผยเมทาดาทาการอ้างอิง กรณีในตัวปัจจุบันรวมถึง Telegram, WhatsApp, Slack, Discord, Microsoft Teams และ ZaloUser

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
    - `mentionPatterns` เป็นรูปแบบ regex ที่ปลอดภัยและไม่สนใจตัวพิมพ์เล็กใหญ่ รูปแบบที่ไม่ถูกต้องและรูปแบบการทำซ้ำซ้อนที่ไม่ปลอดภัยจะถูกละเว้น
    - พื้นผิวที่ให้การกล่าวถึงอย่างชัดเจนยังคงผ่าน รูปแบบเป็นทางเลือกสำรอง
    - การแทนที่ต่อ agent: `agents.list[].groupChat.mentionPatterns` (มีประโยชน์เมื่อหลาย agent ใช้กลุ่มร่วมกัน)
    - การควบคุมด้วยการกล่าวถึงจะบังคับใช้เฉพาะเมื่อสามารถตรวจจับการกล่าวถึงได้ (มีการกล่าวถึงแบบเนทีฟหรือกำหนดค่า `mentionPatterns`)
    - การใส่กลุ่มหรือผู้ส่งไว้ในรายการอนุญาตไม่ได้ปิดการควบคุมด้วยการกล่าวถึง ตั้งค่า `requireMention` ของกลุ่มนั้นเป็น `false` เมื่อข้อความทั้งหมดควรกระตุ้นการทำงาน
    - บริบทพรอมป์ของแชตกลุ่มนำคำสั่งตอบกลับแบบเงียบที่ resolve แล้วไปทุก turn ไฟล์ workspace ไม่ควรทำซ้ำกลไก `NO_REPLY`
    - กลุ่มที่อนุญาตการตอบกลับแบบเงียบจะถือว่า turn ของโมเดลที่ว่างเปล่าอย่างสมบูรณ์หรือมีเฉพาะการให้เหตุผลเป็นแบบเงียบ เทียบเท่ากับ `NO_REPLY` แชตตรงจะทำแบบเดียวกันเฉพาะเมื่ออนุญาตการตอบกลับแบบเงียบโดยตรงอย่างชัดเจน มิฉะนั้นการตอบกลับว่างเปล่ายังคงเป็น turn ของ agent ที่ล้มเหลว
    - ค่าเริ่มต้นของ Discord อยู่ใน `channels.discord.guilds."*"` (แทนที่ได้ต่อ guild/channel)
    - บริบทประวัติกลุ่มถูกห่ออย่างสม่ำเสมอในทุกช่องทางและเป็น **pending-only** (ข้อความที่ถูกข้ามเพราะการควบคุมด้วยการกล่าวถึง) ใช้ `messages.groupChat.historyLimit` สำหรับค่าเริ่มต้นส่วนกลาง และ `channels.<channel>.historyLimit` (หรือ `channels.<channel>.accounts.*.historyLimit`) สำหรับการแทนที่ ตั้งค่าเป็น `0` เพื่อปิดใช้งาน

  </Accordion>
</AccordionGroup>

## ข้อจำกัดเครื่องมือของกลุ่ม/ช่องทาง (ไม่บังคับ)

การกำหนดค่าบางช่องทางรองรับการจำกัดว่าเครื่องมือใดพร้อมใช้งาน **ภายในกลุ่ม/ห้อง/ช่องทางเฉพาะ**

- `tools`: อนุญาต/ปฏิเสธเครื่องมือสำหรับทั้งกลุ่ม
- `toolsBySender`: การแทนที่ต่อผู้ส่งภายในกลุ่ม ใช้คำนำหน้าคีย์อย่างชัดเจน: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` และ wildcard `"*"` คีย์ legacy ที่ไม่มีคำนำหน้ายังคงยอมรับและจับคู่เป็น `id:` เท่านั้น

ลำดับการ resolve (เฉพาะที่สุดชนะ):

<Steps>
  <Step title="Group toolsBySender">
    การจับคู่ `toolsBySender` ของกลุ่ม/ช่องทาง
  </Step>
  <Step title="เครื่องมือของกลุ่ม">
    `tools` ของกลุ่ม/ช่องทาง
  </Step>
  <Step title="Default toolsBySender">
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
ข้อจำกัดเครื่องมือของกลุ่ม/ช่องทางถูกใช้เพิ่มเติมจากนโยบายเครื่องมือส่วนกลาง/agent (การปฏิเสธยังคงชนะ) บางช่องทางใช้การซ้อนสำหรับห้อง/ช่องทางที่แตกต่างกัน (เช่น Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`)
</Note>

## รายการอนุญาตของกลุ่ม

เมื่อกำหนดค่า `channels.whatsapp.groups`, `channels.telegram.groups` หรือ `channels.imessage.groups` คีย์จะทำหน้าที่เป็นรายการอนุญาตของกลุ่ม ใช้ `"*"` เพื่ออนุญาตทุกกลุ่มในขณะที่ยังตั้งค่าพฤติกรรมการกล่าวถึงเริ่มต้น

<Warning>
ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่เหมือนกับการให้สิทธิ์กลุ่ม สำหรับช่องทางที่รองรับการจับคู่ DM ที่เก็บการจับคู่จะปลดล็อกเฉพาะ DM เท่านั้น คำสั่งกลุ่มยังคงต้องมีการให้สิทธิ์ผู้ส่งกลุ่มอย่างชัดเจนจากรายการอนุญาตในการกำหนดค่า เช่น `groupAllowFrom` หรือ fallback การกำหนดค่าที่จัดทำเอกสารไว้สำหรับช่องทางนั้น
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

เจ้าของกลุ่มสามารถสลับการเปิดใช้งานต่อกลุ่มได้:

- `/activation mention`
- `/activation always`

เจ้าของถูกกำหนดโดย `channels.whatsapp.allowFrom` (หรือ E.164 ของบอตเองเมื่อไม่ได้ตั้งค่า) ส่งคำสั่งเป็นข้อความเดี่ยว พื้นผิวอื่นในปัจจุบันละเว้น `/activation`

## ฟิลด์บริบท

payload ขาเข้าของกลุ่มตั้งค่า:

- `ChatType=group`
- `GroupSubject` (ถ้าทราบ)
- `GroupMembers` (ถ้าทราบ)
- `WasMentioned` (ผลลัพธ์การควบคุมด้วยการกล่าวถึง)
- หัวข้อฟอรัม Telegram รวม `MessageThreadId` และ `IsForum` ด้วย

หมายเหตุเฉพาะช่องทาง:

- BlueBubbles สามารถเพิ่มข้อมูลผู้เข้าร่วมกลุ่ม macOS ที่ไม่มีชื่อจากฐานข้อมูล Contacts ในเครื่องก่อนเติม `GroupMembers` ได้ตามตัวเลือก ค่าเริ่มต้นคือปิด และจะทำงานเฉพาะหลังจากการควบคุมกลุ่มปกติผ่านแล้วเท่านั้น

พรอมป์ระบบของ agent รวมบทนำกลุ่มใน turn แรกของเซสชันกลุ่มใหม่ โดยเตือนโมเดลให้ตอบเหมือนมนุษย์ หลีกเลี่ยงตาราง Markdown ลดบรรทัดว่างและทำตามระยะห่างของแชตปกติ และหลีกเลี่ยงการพิมพ์ลำดับ `\n` แบบตัวอักษร ชื่อกลุ่มและป้ายชื่อผู้เข้าร่วมที่มาจากช่องทางจะแสดงเป็นเมทาดาทาที่ไม่น่าเชื่อถือในรั้วโค้ด ไม่ใช่คำสั่งระบบแบบ inline

## รายละเอียดเฉพาะของ iMessage

- ควรใช้ `chat_id:<id>` เมื่อ routing หรือใส่รายการอนุญาต
- แสดงรายการแชต: `imsg chats --limit 20`
- การตอบกลับกลุ่มจะกลับไปยัง `chat_id` เดิมเสมอ

## พรอมป์ระบบของ WhatsApp

ดู [WhatsApp](/th/channels/whatsapp#system-prompts) สำหรับกฎพรอมป์ระบบของ WhatsApp ที่เป็น canonical รวมถึงการ resolve พรอมป์กลุ่มและตรง พฤติกรรม wildcard และความหมายของการแทนที่ account

## รายละเอียดเฉพาะของ WhatsApp

ดู [ข้อความกลุ่ม](/th/channels/group-messages) สำหรับพฤติกรรมเฉพาะ WhatsApp (การฉีดประวัติ รายละเอียดการจัดการการกล่าวถึง)

## ที่เกี่ยวข้อง

- [กลุ่ม broadcast](/th/channels/broadcast-groups)
- [การ routing ช่องทาง](/th/channels/channel-routing)
- [ข้อความกลุ่ม](/th/channels/group-messages)
- [การจับคู่](/th/channels/pairing)
