---
read_when:
    - การเปลี่ยนพฤติกรรมแชตกลุ่มหรือการจำกัดด้วยการเมนชัน
sidebarTitle: Groups
summary: พฤติกรรมการแชทกลุ่มบนพื้นผิวการใช้งานต่าง ๆ (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: กลุ่ม
x-i18n:
    generated_at: "2026-05-10T19:21:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a040df975829cd35f45577522ea2813fd98fd8babbb42663e502cedde088d89
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw จัดการแชตกลุ่มอย่างสอดคล้องกันในทุกพื้นผิว: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## บทนำสำหรับผู้เริ่มต้น (2 นาที)

OpenClaw “อยู่” บนบัญชีรับส่งข้อความของคุณเอง ไม่มีผู้ใช้บอต WhatsApp แยกต่างหาก หาก **คุณ** อยู่ในกลุ่ม OpenClaw จะเห็นกลุ่มนั้นและตอบกลับในกลุ่มนั้นได้

พฤติกรรมเริ่มต้น:

- กลุ่มถูกจำกัดไว้ (`groupPolicy: "allowlist"`)
- การตอบกลับต้องมีการกล่าวถึง เว้นแต่คุณจะปิดการกั้นด้วยการกล่าวถึงอย่างชัดเจน
- การตอบกลับสุดท้ายตามปกติในกลุ่ม/ช่องเป็นส่วนตัวโดยค่าเริ่มต้น เอาต์พุตที่มองเห็นได้ในห้องใช้เครื่องมือ `message`

ความหมาย: ผู้ส่งที่อยู่ในรายการอนุญาตสามารถเรียก OpenClaw ได้ด้วยการกล่าวถึง

<Note>
**สรุปสั้น**

- **การเข้าถึง DM** ควบคุมด้วย `*.allowFrom`
- **การเข้าถึงกลุ่ม** ควบคุมด้วย `*.groupPolicy` + รายการอนุญาต (`*.groups`, `*.groupAllowFrom`)
- **การเรียกให้ตอบกลับ** ควบคุมด้วยการกั้นด้วยการกล่าวถึง (`requireMention`, `/activation`)

</Note>

ลำดับแบบรวดเร็ว (เกิดอะไรขึ้นกับข้อความกลุ่ม):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## การตอบกลับที่มองเห็นได้

สำหรับห้องแบบกลุ่ม/ช่อง OpenClaw ใช้ค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`
`openclaw doctor --fix` จะเขียนค่าเริ่มต้นนี้ลงในการกำหนดค่าช่องที่กำหนดไว้ซึ่งยังไม่มีค่านี้
นั่นหมายความว่าเอเจนต์ยังคงประมวลผลเทิร์นและอัปเดตสถานะหน่วยความจำ/เซสชันได้ แต่คำตอบสุดท้ายตามปกติจะไม่ถูกโพสต์กลับเข้าไปในห้องโดยอัตโนมัติ หากต้องการพูดให้มองเห็นได้ เอเจนต์จะใช้ `message(action=send)`

ค่าเริ่มต้นนี้ขึ้นอยู่กับโมเดล/รันไทม์ที่เรียกเครื่องมือได้อย่างน่าเชื่อถือ หากบันทึกแสดงข้อความของผู้ช่วยแต่ `didSendViaMessagingTool: false` แปลว่าโมเดลตอบแบบส่วนตัวแทนที่จะเรียกเครื่องมือ message นั่นไม่ใช่ความล้มเหลวในการส่งของ Discord/Slack/Telegram ให้ใช้โมเดลที่เรียกเครื่องมือได้อย่างน่าเชื่อถือสำหรับเซสชันกลุ่ม/ช่อง หรือตั้งค่า `messages.groupChat.visibleReplies: "automatic"` เพื่อคืนค่าการตอบกลับสุดท้ายที่มองเห็นได้แบบเดิม

หากเครื่องมือ message ไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะย้อนกลับไปใช้การตอบกลับที่มองเห็นได้อัตโนมัติแทนการระงับการตอบสนองแบบเงียบ ๆ
`openclaw doctor` จะเตือนเกี่ยวกับความไม่ตรงกันนี้

สำหรับแชตโดยตรงและเทิร์นจากแหล่งอื่น ๆ ให้ใช้ `messages.visibleReplies: "message_tool"` เพื่อใช้พฤติกรรมการตอบกลับที่มองเห็นได้แบบผ่านเครื่องมือเท่านั้นทั่วทั้งระบบ Harness ยังสามารถเลือกค่านี้เป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งค่าได้เช่นกัน; Codex harness ทำเช่นนี้สำหรับแชตโดยตรงในโหมด Codex `messages.groupChat.visibleReplies` ยังคงเป็นการแทนที่ที่เฉพาะเจาะจงกว่าสำหรับห้องแบบกลุ่ม/ช่อง

สิ่งนี้แทนที่รูปแบบเดิมที่บังคับให้โมเดลตอบ `NO_REPLY` สำหรับเทิร์นส่วนใหญ่ในโหมดแอบสังเกต ในโหมดผ่านเครื่องมือเท่านั้น การไม่ทำสิ่งใดให้มองเห็นได้หมายถึงการไม่เรียกเครื่องมือ message เท่านั้น

ยังคงส่งตัวบ่งชี้การพิมพ์ขณะเอเจนต์ทำงานในโหมดผ่านเครื่องมือเท่านั้น โหมดการพิมพ์ของกลุ่มเริ่มต้นจะถูกอัปเกรดจาก "message" เป็น "instant" สำหรับเทิร์นเหล่านี้ เพราะอาจไม่มีข้อความผู้ช่วยตามปกติก่อนที่เอเจนต์จะตัดสินใจว่าจะเรียกเครื่องมือ message หรือไม่ การกำหนดค่าโหมดการพิมพ์อย่างชัดเจนยังคงมีผลเหนือกว่า

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

Gateway จะโหลดการกำหนดค่า `messages` ใหม่แบบ hot-reload หลังจากบันทึกไฟล์ รีสตาร์ตเฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลดการกำหนดค่าใหม่ถูกปิดใช้งานในการปรับใช้เท่านั้น

หากต้องการบังคับให้เอาต์พุตที่มองเห็นได้ของแชตจากทุกแหล่งต้องผ่านเครื่องมือ message:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

คำสั่ง slash แบบเนทีฟ (Discord, Telegram และพื้นผิวอื่น ๆ ที่รองรับคำสั่งเนทีฟ) จะข้าม `visibleReplies: "message_tool"` และตอบกลับให้มองเห็นได้เสมอ เพื่อให้ UI คำสั่งเนทีฟของช่องได้รับการตอบสนองตามที่คาดไว้ สิ่งนี้ใช้กับเทิร์นคำสั่งเนทีฟที่ผ่านการตรวจสอบแล้วเท่านั้น; คำสั่ง `/...` ที่พิมพ์เป็นข้อความและเทิร์นแชตทั่วไปยังคงทำตามค่าเริ่มต้นของกลุ่มที่กำหนดไว้

## การมองเห็นบริบทและรายการอนุญาต

มีการควบคุมสองแบบที่เกี่ยวข้องกับความปลอดภัยของกลุ่ม:

- **การอนุญาตให้เรียกทำงาน**: ใครสามารถเรียกเอเจนต์ได้ (`groupPolicy`, `groups`, `groupAllowFrom`, รายการอนุญาตเฉพาะช่อง)
- **การมองเห็นบริบท**: บริบทเสริมใดถูกฉีดเข้าไปในโมเดล (ข้อความตอบกลับ, คำอ้างอิง, ประวัติเธรด, เมทาดาทาที่ส่งต่อ)

โดยค่าเริ่มต้น OpenClaw ให้ความสำคัญกับพฤติกรรมแชตปกติและเก็บบริบทไว้เกือบตามที่ได้รับมา ซึ่งหมายความว่ารายการอนุญาตมีหน้าที่หลักในการตัดสินว่าใครสามารถเรียกการทำงานได้ ไม่ใช่ขอบเขตการปกปิดสากลสำหรับทุกข้อความอ้างอิงหรือส่วนย่อยจากประวัติ

<AccordionGroup>
  <Accordion title="พฤติกรรมปัจจุบันขึ้นอยู่กับช่อง">
    - บางช่องใช้การกรองตามผู้ส่งกับบริบทเสริมในเส้นทางเฉพาะอยู่แล้ว (เช่น การตั้งต้นเธรดของ Slack, การค้นหาการตอบกลับ/เธรดของ Matrix)
    - ช่องอื่น ๆ ยังส่งบริบทคำอ้างอิง/การตอบกลับ/การส่งต่อผ่านไปตามที่ได้รับมา

  </Accordion>
  <Accordion title="ทิศทางการเสริมความแข็งแรง (วางแผนไว้)">
    - `contextVisibility: "all"` (ค่าเริ่มต้น) คงพฤติกรรมปัจจุบันตามที่ได้รับมา
    - `contextVisibility: "allowlist"` กรองบริบทเสริมให้เหลือเฉพาะผู้ส่งในรายการอนุญาต
    - `contextVisibility: "allowlist_quote"` คือ `allowlist` พร้อมข้อยกเว้นคำอ้างอิง/การตอบกลับแบบชัดเจนหนึ่งรายการ

    จนกว่าจะนำโมเดลการเสริมความแข็งแรงนี้ไปใช้ให้สอดคล้องกันในทุกช่อง ให้คาดว่าจะมีความแตกต่างตามพื้นผิว

  </Accordion>
</AccordionGroup>

![โฟลว์ข้อความกลุ่ม](/images/groups-flow.svg)

หากคุณต้องการ...

| เป้าหมาย                                         | สิ่งที่ต้องตั้งค่า                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| อนุญาตทุกกลุ่มแต่ตอบกลับเฉพาะเมื่อมี @mentions | `groups: { "*": { requireMention: true } }`                |
| ปิดการตอบกลับของกลุ่มทั้งหมด                    | `groupPolicy: "disabled"`                                  |
| เฉพาะบางกลุ่ม                         | `groups: { "<group-id>": { ... } }` (ไม่มีคีย์ `"*"`)         |
| เฉพาะคุณเท่านั้นที่เรียกในกลุ่มได้               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| ใช้ชุดผู้ส่งที่เชื่อถือได้ชุดเดียวซ้ำในหลายช่อง | `groupAllowFrom: ["accessGroup:operators"]`                |

สำหรับรายการอนุญาตผู้ส่งที่ใช้ซ้ำได้ ดู [กลุ่มการเข้าถึง](/th/channels/access-groups)

## คีย์เซสชัน

- เซสชันกลุ่มใช้คีย์เซสชัน `agent:<agentId>:<channel>:group:<id>` (ห้อง/ช่องใช้ `agent:<agentId>:<channel>:channel:<id>`)
- หัวข้อฟอรัมของ Telegram เพิ่ม `:topic:<threadId>` ต่อท้าย id ของกลุ่ม เพื่อให้แต่ละหัวข้อมีเซสชันของตัวเอง
- แชตโดยตรงใช้เซสชันหลัก (หรือแยกตามผู้ส่งหากกำหนดค่าไว้)
- Heartbeats จะถูกข้ามสำหรับเซสชันกลุ่ม

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## รูปแบบ: DM ส่วนตัว + กลุ่มสาธารณะ (เอเจนต์เดียว)

ใช่ — วิธีนี้ทำงานได้ดีหากทราฟฟิก “ส่วนตัว” ของคุณคือ **DMs** และทราฟฟิก “สาธารณะ” ของคุณคือ **groups**

เหตุผล: ในโหมดเอเจนต์เดียว DMs มักจะไปอยู่ในคีย์เซสชัน **main** (`agent:main:main`) ขณะที่กลุ่มใช้คีย์เซสชัน **non-main** เสมอ (`agent:main:<channel>:group:<id>`) หากคุณเปิดใช้ sandboxing ด้วย `mode: "non-main"` เซสชันกลุ่มเหล่านั้นจะทำงานในแบ็กเอนด์ sandbox ที่กำหนดค่าไว้ ขณะที่เซสชัน DM หลักของคุณยังคงอยู่บนโฮสต์ Docker เป็นแบ็กเอนด์เริ่มต้นหากคุณไม่ได้เลือกอย่างอื่น

สิ่งนี้ให้ “สมอง” เอเจนต์หนึ่งชุดแก่คุณ (พื้นที่ทำงาน + หน่วยความจำที่ใช้ร่วมกัน) แต่มีท่าทีการดำเนินการสองแบบ:

- **DMs**: เครื่องมือครบถ้วน (โฮสต์)
- **Groups**: sandbox + เครื่องมือที่จำกัด

<Note>
หากคุณต้องการพื้นที่ทำงาน/บุคลิกที่แยกจากกันจริง ๆ (“personal” และ “public” ต้องไม่ปะปนกันเลย) ให้ใช้เอเจนต์ตัวที่สอง + การผูก ดู [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
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
  <Tab title="กลุ่มเห็นเฉพาะโฟลเดอร์ในรายการอนุญาต">
    ต้องการให้ “กลุ่มเห็นได้เฉพาะโฟลเดอร์ X” แทน “ไม่มีสิทธิ์เข้าถึงโฮสต์” ใช่ไหม ให้คง `workspaceAccess: "none"` ไว้ แล้ว mount เฉพาะพาธในรายการอนุญาตเข้าไปใน sandbox:

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

## ป้ายกำกับที่แสดง

- ป้ายกำกับ UI ใช้ `displayName` เมื่อมี โดยจัดรูปแบบเป็น `<channel>:<token>`
- `#room` สงวนไว้สำหรับห้อง/ช่อง; แชตกลุ่มใช้ `g-<slug>` (ตัวพิมพ์เล็ก, ช่องว่าง -> `-`, คง `#@+._-` ไว้)

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
| `"open"`      | กลุ่มข้ามรายการอนุญาต; การกั้นด้วยการกล่าวถึงยังคงมีผล      |
| `"disabled"`  | บล็อกข้อความกลุ่มทั้งหมดอย่างสิ้นเชิง                           |
| `"allowlist"` | อนุญาตเฉพาะกลุ่ม/ห้องที่ตรงกับรายการอนุญาตที่กำหนดค่าไว้ |

<AccordionGroup>
  <Accordion title="หมายเหตุรายช่องทาง">
    - `groupPolicy` แยกจากการกั้นด้วยการกล่าวถึง (ซึ่งต้องใช้ @mentions)
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: ใช้ `groupAllowFrom` (สำรอง: `allowFrom` แบบระบุชัดเจน)
    - Signal: `groupAllowFrom` สามารถจับคู่ได้ทั้ง id กลุ่ม Signal ขาเข้าหรือเบอร์โทร/UUID ของผู้ส่ง
    - การอนุมัติการจับคู่ DM (รายการจัดเก็บ `*-allowFrom`) ใช้กับการเข้าถึง DM เท่านั้น; การอนุญาตผู้ส่งในกลุ่มยังต้องระบุอย่างชัดเจนในรายการอนุญาตของกลุ่ม
    - Discord: รายการอนุญาตใช้ `channels.discord.guilds.<id>.channels`
    - Slack: รายการอนุญาตใช้ `channels.slack.channels`
    - Matrix: รายการอนุญาตใช้ `channels.matrix.groups` ควรใช้ ID ห้องหรือ alias; การค้นหาชื่อห้องที่เข้าร่วมแล้วเป็นแบบพยายามเท่าที่ทำได้ และชื่อที่แก้ไม่ได้จะถูกละเว้นขณะรันไทม์ ใช้ `channels.matrix.groupAllowFrom` เพื่อจำกัดผู้ส่ง; รองรับรายการอนุญาต `users` รายห้องด้วย
    - Group DM ถูกควบคุมแยกต่างหาก (`channels.discord.dm.*`, `channels.slack.dm.*`)
    - รายการอนุญาตของ Telegram สามารถจับคู่กับ ID ผู้ใช้ (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) หรือชื่อผู้ใช้ (`"@alice"` หรือ `"alice"`); prefix ไม่คำนึงถึงตัวพิมพ์เล็กใหญ่
    - ค่าเริ่มต้นคือ `groupPolicy: "allowlist"`; หากรายการอนุญาตของกลุ่มว่าง ข้อความกลุ่มจะถูกบล็อก
    - ความปลอดภัยขณะรันไทม์: เมื่อบล็อกผู้ให้บริการหายไปทั้งหมด (`channels.<provider>` ไม่มีอยู่) นโยบายกลุ่มจะ fallback เป็นโหมดปิดเมื่อไม่ผ่าน (โดยทั่วไปคือ `allowlist`) แทนที่จะสืบทอด `channels.defaults.groupPolicy`

  </Accordion>
</AccordionGroup>

โมเดลความเข้าใจแบบย่อ (ลำดับการประเมินสำหรับข้อความกลุ่ม):

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

ข้อความกลุ่มต้องมีการกล่าวถึง เว้นแต่จะ override รายกลุ่ม ค่าเริ่มต้นอยู่รายระบบย่อยใต้ `*.groups."*"`

การตอบกลับข้อความของบอตนับเป็นการกล่าวถึงโดยนัยเมื่อช่องทางรองรับ metadata ของการตอบกลับ การอ้างอิงข้อความของบอตก็สามารถนับเป็นการกล่าวถึงโดยนัยได้เช่นกันในช่องทางที่เปิดเผย metadata ของการอ้างอิง กรณี built-in ปัจจุบันรวมถึง Telegram, WhatsApp, Slack, Discord, Microsoft Teams และ ZaloUser

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
    - `mentionPatterns` เป็นรูปแบบ regex ที่ปลอดภัยและไม่คำนึงถึงตัวพิมพ์เล็กใหญ่; รูปแบบที่ไม่ถูกต้องและรูปแบบการทำซ้ำซ้อนที่ไม่ปลอดภัยจะถูกละเว้น
    - พื้นผิวที่ให้การกล่าวถึงแบบชัดเจนยังคงผ่าน; pattern เป็น fallback
    - การ override ราย agent: `agents.list[].groupChat.mentionPatterns` (มีประโยชน์เมื่อหลาย agent ใช้กลุ่มร่วมกัน)
    - การกั้นด้วยการกล่าวถึงจะถูกบังคับใช้เฉพาะเมื่อสามารถตรวจจับการกล่าวถึงได้ (มีการตั้งค่า native mentions หรือ `mentionPatterns`)
    - การเพิ่มกลุ่มหรือผู้ส่งลงรายการอนุญาตไม่ได้ปิดการกั้นด้วยการกล่าวถึง; ตั้งค่า `requireMention` ของกลุ่มนั้นเป็น `false` เมื่อทุกข้อความควรกระตุ้นการทำงาน
    - บริบทพรอมป์แชตกลุ่มจะพกคำสั่งตอบกลับเงียบที่ resolve แล้วในทุก turn; ไฟล์ workspace ไม่ควรทำซ้ำกลไก `NO_REPLY`
    - กลุ่มที่อนุญาตการตอบกลับเงียบจะถือว่า turn ของโมเดลที่ว่างเปล่าอย่างสะอาดหรือมีเฉพาะ reasoning เป็นการเงียบ ซึ่งเทียบเท่ากับ `NO_REPLY` แชตโดยตรงทำเช่นเดียวกันเฉพาะเมื่อมีการอนุญาตการตอบกลับเงียบโดยตรงอย่างชัดเจน; มิฉะนั้นการตอบกลับว่างยังคงเป็น turn ของ agent ที่ล้มเหลว
    - ค่าเริ่มต้นของ Discord อยู่ใน `channels.discord.guilds."*"` (override ได้ราย guild/channel)
    - บริบทประวัติกลุ่มถูกห่อหุ้มอย่างสม่ำเสมอทุกช่องทาง กลุ่มที่ถูกกั้นด้วยการกล่าวถึงจะเก็บข้อความที่ข้ามไว้ซึ่งยังค้างอยู่; กลุ่มที่เปิดตลอดเวลาอาจเก็บข้อความห้องล่าสุดที่ประมวลผลแล้วไว้ด้วยเมื่อช่องทางรองรับ ใช้ `messages.groupChat.historyLimit` สำหรับค่าเริ่มต้นส่วนกลาง และ `channels.<channel>.historyLimit` (หรือ `channels.<channel>.accounts.*.historyLimit`) สำหรับ override ตั้งค่า `0` เพื่อปิดใช้งาน

  </Accordion>
</AccordionGroup>

## ข้อจำกัดเครื่องมือของกลุ่ม/ช่องทาง (ไม่บังคับ)

การตั้งค่าบางช่องทางรองรับการจำกัดว่าเครื่องมือใดพร้อมใช้งาน **ภายในกลุ่ม/ห้อง/ช่องทางเฉพาะ**

- `tools`: อนุญาต/ปฏิเสธเครื่องมือสำหรับทั้งกลุ่ม
- `toolsBySender`: override รายผู้ส่งภายในกลุ่ม ใช้ prefix ของ key แบบชัดเจน: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` และ wildcard `"*"` key แบบเดิมที่ไม่มี prefix ยังยอมรับอยู่และจับคู่เป็น `id:` เท่านั้น

ลำดับการ resolve (รายการที่เฉพาะเจาะจงที่สุดชนะ):

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
ข้อจำกัดเครื่องมือของกลุ่ม/ช่องทางถูกใช้เพิ่มเติมจากนโยบายเครื่องมือส่วนกลาง/agent (deny ยังคงชนะ) บางช่องทางใช้การซ้อนที่แตกต่างกันสำหรับห้อง/ช่องทาง (เช่น Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`)
</Note>

## รายการอนุญาตของกลุ่ม

เมื่อกำหนดค่า `channels.whatsapp.groups`, `channels.telegram.groups` หรือ `channels.imessage.groups` key จะทำหน้าที่เป็นรายการอนุญาตของกลุ่ม ใช้ `"*"` เพื่ออนุญาตทุกกลุ่มในขณะที่ยังตั้งค่าพฤติกรรมการกล่าวถึงเริ่มต้นได้

<Warning>
ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่เหมือนกับการอนุญาตกลุ่ม สำหรับช่องทางที่รองรับการจับคู่ DM ที่จัดเก็บการจับคู่จะปลดล็อกเฉพาะ DM เท่านั้น คำสั่งกลุ่มยังต้องมีการอนุญาตผู้ส่งในกลุ่มอย่างชัดเจนจากรายการอนุญาตใน config เช่น `groupAllowFrom` หรือ fallback ของ config ที่มีเอกสารกำกับสำหรับช่องทางนั้น
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
  <Tab title="ทริกเกอร์เฉพาะ owner (WhatsApp)">
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

## การเปิดใช้งาน (เฉพาะ owner)

owner ของกลุ่มสามารถสลับการเปิดใช้งานรายกลุ่มได้:

- `/activation mention`
- `/activation always`

owner ถูกกำหนดโดย `channels.whatsapp.allowFrom` (หรือ E.164 ของตัวบอตเองเมื่อไม่ได้ตั้งค่า) ส่งคำสั่งเป็นข้อความเดี่ยว พื้นผิวอื่นในปัจจุบันจะละเว้น `/activation`

## ฟิลด์บริบท

payload ขาเข้าของกลุ่มจะตั้งค่า:

- `ChatType=group`
- `GroupSubject` (ถ้าทราบ)
- `GroupMembers` (ถ้าทราบ)
- `WasMentioned` (ผลลัพธ์การกั้นด้วยการกล่าวถึง)
- หัวข้อ forum ของ Telegram ยังรวม `MessageThreadId` และ `IsForum` ด้วย

พรอมป์ระบบของ agent รวมบทนำกลุ่มใน turn แรกของเซสชันกลุ่มใหม่ โดยเตือนโมเดลให้ตอบเหมือนมนุษย์ หลีกเลี่ยงตาราง Markdown ลดบรรทัดว่างและทำตามระยะห่างของแชตปกติ และหลีกเลี่ยงการพิมพ์ลำดับ `\n` แบบ literal ชื่อกลุ่มและป้ายชื่อผู้เข้าร่วมที่มาจากช่องทางจะแสดงเป็น metadata ที่ไม่น่าเชื่อถือใน fenced block ไม่ใช่คำสั่งระบบแบบ inline

## รายละเอียดเฉพาะ iMessage

- ควรใช้ `chat_id:<id>` เมื่อ routing หรือเพิ่มลงรายการอนุญาต
- แสดงรายการแชต: `imsg chats --limit 20`
- การตอบกลับกลุ่มจะกลับไปยัง `chat_id` เดิมเสมอ

## พรอมป์ระบบของ WhatsApp

ดู [WhatsApp](/th/channels/whatsapp#system-prompts) สำหรับกฎพรอมป์ระบบ WhatsApp ที่เป็น canonical รวมถึงการ resolve พรอมป์สำหรับกลุ่มและโดยตรง พฤติกรรม wildcard และความหมายของการ override บัญชี

## รายละเอียดเฉพาะ WhatsApp

ดู [ข้อความกลุ่ม](/th/channels/group-messages) สำหรับพฤติกรรมเฉพาะ WhatsApp (การฉีดประวัติ รายละเอียดการจัดการการกล่าวถึง)

## ที่เกี่ยวข้อง

- [กลุ่ม broadcast](/th/channels/broadcast-groups)
- [การ routing ช่องทาง](/th/channels/channel-routing)
- [ข้อความกลุ่ม](/th/channels/group-messages)
- [การจับคู่](/th/channels/pairing)
