---
read_when:
    - การเปลี่ยนพฤติกรรมของแชตกลุ่มหรือการควบคุมด้วยการกล่าวถึง
sidebarTitle: Groups
summary: พฤติกรรมของแชตกลุ่มในแต่ละพื้นผิวการใช้งาน (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: กลุ่ม
x-i18n:
    generated_at: "2026-04-26T11:23:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 837055b3cd044ebe3ef9aefe29e36f6471f48025d32169c43b9c5b04a8ac639c
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw จัดการแชตกลุ่มอย่างสม่ำเสมอในแต่ละพื้นผิวการใช้งาน: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo

## เกริ่นนำสำหรับผู้เริ่มต้น (2 นาที)

OpenClaw "ทำงานอยู่" บนบัญชีแชตของคุณเอง ไม่มีผู้ใช้บอต WhatsApp แยกต่างหาก หาก **คุณ** อยู่ในกลุ่ม OpenClaw ก็จะมองเห็นกลุ่มนั้นและตอบกลับที่นั่นได้

พฤติกรรมค่าเริ่มต้น:

- กลุ่มจะถูกจำกัด (`groupPolicy: "allowlist"`).
- การตอบกลับต้องมีการกล่าวถึง เว้นแต่คุณจะปิดการควบคุมด้วยการกล่าวถึงเองอย่างชัดเจน

แปลแบบสั้น ๆ: ผู้ส่งที่อยู่ใน allowlist สามารถเรียกใช้ OpenClaw ได้ด้วยการกล่าวถึงมัน

<Note>
**สรุปสั้น ๆ**

- **การเข้าถึง DM** ควบคุมด้วย `*.allowFrom`
- **การเข้าถึงกลุ่ม** ควบคุมด้วย `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`)
- **การทริกเกอร์การตอบกลับ** ควบคุมด้วยการควบคุมด้วยการกล่าวถึง (`requireMention`, `/activation`)
</Note>

ลำดับอย่างย่อ (สิ่งที่เกิดขึ้นกับข้อความในกลุ่ม):

```
groupPolicy? disabled -> ทิ้ง
groupPolicy? allowlist -> อนุญาตกลุ่มหรือไม่? no -> ทิ้ง
requireMention? yes -> ถูกกล่าวถึงหรือไม่? no -> เก็บไว้เป็นบริบทเท่านั้น
otherwise -> ตอบกลับ
```

## การมองเห็นบริบทและ allowlists

มีตัวควบคุมที่แตกต่างกันสองแบบที่เกี่ยวข้องกับความปลอดภัยของกลุ่ม:

- **การอนุญาตให้ทริกเกอร์**: ใครสามารถทริกเกอร์เอเจนต์ได้ (`groupPolicy`, `groups`, `groupAllowFrom`, allowlists เฉพาะช่องทาง)
- **การมองเห็นบริบท**: บริบทเสริมใดบ้างที่จะถูกแทรกเข้าไปในโมเดล (ข้อความตอบกลับ, ข้อความอ้างอิง, ประวัติเธรด, เมทาดาทาการส่งต่อ)

ตามค่าเริ่มต้น OpenClaw ให้ความสำคัญกับพฤติกรรมแชตตามปกติ และเก็บบริบทไว้ใกล้เคียงกับที่ได้รับมาเป็นหลัก ซึ่งหมายความว่า allowlists จะใช้ตัดสินใจเป็นหลักว่าใครสามารถทริกเกอร์การกระทำได้ ไม่ใช่ขอบเขตการปกปิดข้อมูลสากลสำหรับทุกข้อความอ้างอิงหรือข้อความย้อนหลัง

<AccordionGroup>
  <Accordion title="พฤติกรรมปัจจุบันแตกต่างกันไปตามแต่ละช่องทาง">
    - บางช่องทางมีการกรองบริบทเสริมตามผู้ส่งอยู่แล้วในบางเส้นทางเฉพาะ (เช่น การเริ่มต้นเธรดของ Slack, การค้นหาการตอบกลับ/เธรดของ Matrix)
    - ช่องทางอื่น ๆ ยังคงส่งบริบท quote/reply/forward ผ่านไปตามที่ได้รับมา
  </Accordion>
  <Accordion title="ทิศทางการเสริมความแข็งแกร่ง (วางแผนไว้)">
    - `contextVisibility: "all"` (ค่าเริ่มต้น) คงพฤติกรรมปัจจุบันแบบตามที่ได้รับมา
    - `contextVisibility: "allowlist"` กรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่อยู่ใน allowlist
    - `contextVisibility: "allowlist_quote"` คือ `allowlist` พร้อมข้อยกเว้นแบบชัดเจนหนึ่งรายการสำหรับ quote/reply

    จนกว่าโมเดลการเสริมความแข็งแกร่งนี้จะถูกทำให้สอดคล้องกันในทุกช่องทาง ให้คาดหวังความแตกต่างในแต่ละพื้นผิวการใช้งาน

  </Accordion>
</AccordionGroup>

![ลำดับการทำงานของข้อความกลุ่ม](/images/groups-flow.svg)

หากคุณต้องการ...

| เป้าหมาย                                     | สิ่งที่ต้องตั้งค่า                                           |
| -------------------------------------------- | ------------------------------------------------------------- |
| อนุญาตทุกกลุ่ม แต่ตอบกลับเฉพาะเมื่อมี @mention | `groups: { "*": { requireMention: true } }`                   |
| ปิดการตอบกลับในกลุ่มทั้งหมด                  | `groupPolicy: "disabled"`                                     |
| เฉพาะบางกลุ่มเท่านั้น                        | `groups: { "<group-id>": { ... } }` (ไม่มีคีย์ `"*"` )       |
| มีแค่คุณเท่านั้นที่ทริกเกอร์ได้ในกลุ่ม        | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]`    |

## คีย์เซสชัน

- เซสชันกลุ่มใช้คีย์เซสชันรูปแบบ `agent:<agentId>:<channel>:group:<id>` (ห้อง/ช่องทางใช้ `agent:<agentId>:<channel>:channel:<id>`)
- หัวข้อ forum ของ Telegram จะเพิ่ม `:topic:<threadId>` ต่อท้าย id ของกลุ่ม เพื่อให้แต่ละหัวข้อมีเซสชันของตัวเอง
- แชตโดยตรงใช้เซสชันหลัก (หรือแยกตามผู้ส่ง หากตั้งค่าไว้)
- Heartbeat จะถูกข้ามสำหรับเซสชันกลุ่ม

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## รูปแบบ: DM ส่วนตัว + กลุ่มสาธารณะ (เอเจนต์เดียว)

ได้ — วิธีนี้ใช้ได้ดีหากทราฟฟิกแบบ "ส่วนตัว" ของคุณเป็น **DM** และทราฟฟิกแบบ "สาธารณะ" เป็น **กลุ่ม**

เหตุผล: ในโหมดเอเจนต์เดียว โดยทั่วไป DM จะไปอยู่ที่คีย์เซสชัน **หลัก** (`agent:main:main`) ขณะที่กลุ่มจะใช้คีย์เซสชัน **ที่ไม่ใช่หลัก** เสมอ (`agent:main:<channel>:group:<id>`) หากคุณเปิดใช้ sandboxing ด้วย `mode: "non-main"` เซสชันกลุ่มเหล่านั้นจะทำงานใน backend ของ sandbox ที่ตั้งค่าไว้ ขณะที่เซสชัน DM หลักของคุณยังคงทำงานบนโฮสต์ Docker คือ backend ค่าเริ่มต้นหากคุณไม่ได้เลือกตัวอื่น

สิ่งนี้ทำให้คุณมี "สมอง" ของเอเจนต์ตัวเดียว (workspace + memory ที่ใช้ร่วมกัน) แต่มีลักษณะการทำงานสองแบบ:

- **DM**: tools เต็มรูปแบบ (โฮสต์)
- **กลุ่ม**: sandbox + tools แบบจำกัด

<Note>
หากคุณต้องการ workspace/persona ที่แยกจากกันอย่างแท้จริง ("ส่วนตัว" และ "สาธารณะ" ต้องไม่ปะปนกันเลย) ให้ใช้เอเจนต์ตัวที่สอง + bindings ดู [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent)
</Note>

<Tabs>
  <Tab title="DM ทำงานบนโฮสต์ กลุ่มถูก sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // groups/channels เป็น non-main -> ถูก sandbox
            scope: "session", // การแยกที่เข้มที่สุด (หนึ่งคอนเทนเนอร์ต่อกลุ่ม/ช่องทาง)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // หาก allow ไม่ว่าง ทุกอย่างที่เหลือจะถูกบล็อก (deny ยังมีผลสูงกว่า)
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="กลุ่มมองเห็นได้เฉพาะโฟลเดอร์ที่อยู่ใน allowlist">
    ต้องการให้ "กลุ่มมองเห็นได้เฉพาะโฟลเดอร์ X" แทน "ไม่มีสิทธิ์เข้าถึงโฮสต์" ใช่ไหม ให้คง `workspaceAccess: "none"` ไว้ แล้ว mount เฉพาะ path ที่อยู่ใน allowlist เข้าไปใน sandbox:

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
- ดีบักว่าทำไม tool จึงถูกบล็อก: [Sandbox เทียบกับ Tool Policy เทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated)
- รายละเอียด bind mounts: [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts)

## ป้ายชื่อที่ใช้แสดงผล

- ป้ายใน UI ใช้ `displayName` เมื่อมี โดยจัดรูปแบบเป็น `<channel>:<token>`
- `#room` สงวนไว้สำหรับห้อง/ช่องทาง; แชตกลุ่มใช้ `g-<slug>` (ตัวพิมพ์เล็ก, เว้นวรรค -> `-`, คง `#@+._-` ไว้)

## นโยบายกลุ่ม

ควบคุมวิธีจัดการข้อความในกลุ่ม/ห้อง แยกตามแต่ละช่องทาง:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // Telegram user id แบบตัวเลข (wizard สามารถ resolve @username ได้)
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

| นโยบาย        | พฤติกรรม                                                        |
| ------------- | ---------------------------------------------------------------- |
| `"open"`      | กลุ่มจะข้าม allowlists; แต่การควบคุมด้วยการกล่าวถึงยังคงมีผล |
| `"disabled"`  | บล็อกข้อความกลุ่มทั้งหมดโดยสิ้นเชิง                           |
| `"allowlist"` | อนุญาตเฉพาะกลุ่ม/ห้องที่ตรงกับ allowlist ที่กำหนดไว้          |

<AccordionGroup>
  <Accordion title="หมายเหตุแยกตามแต่ละช่องทาง">
    - `groupPolicy` แยกจากการควบคุมด้วยการกล่าวถึง (ซึ่งต้องใช้ @mentions)
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: ใช้ `groupAllowFrom` (fallback: `allowFrom` แบบระบุชัดเจน)
    - การอนุมัติการจับคู่ DM (`*-allowFrom` store entries) ใช้กับการเข้าถึง DM เท่านั้น; การอนุญาตผู้ส่งในกลุ่มยังคงต้องระบุชัดเจนผ่าน group allowlists
    - Discord: allowlist ใช้ `channels.discord.guilds.<id>.channels`
    - Slack: allowlist ใช้ `channels.slack.channels`
    - Matrix: allowlist ใช้ `channels.matrix.groups` แนะนำให้ใช้ room IDs หรือ aliases; การค้นหาชื่อห้องที่เข้าร่วมแล้วเป็นแบบ best-effort และชื่อที่ resolve ไม่ได้จะถูกละเลยระหว่างรันไทม์ ใช้ `channels.matrix.groupAllowFrom` เพื่อจำกัดผู้ส่ง; รองรับ allowlists แบบ `users` รายห้องด้วยเช่นกัน
    - Group DMs ถูกควบคุมแยกต่างหาก (`channels.discord.dm.*`, `channels.slack.dm.*`)
    - Telegram allowlist สามารถจับคู่กับ user IDs (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) หรือ usernames (`"@alice"` หรือ `"alice"`) โดย prefixes ไม่แยกตัวพิมพ์เล็กใหญ่
    - ค่าเริ่มต้นคือ `groupPolicy: "allowlist"`; หาก group allowlist ของคุณว่างอยู่ ข้อความในกลุ่มจะถูกบล็อก
    - ความปลอดภัยขณะรันไทม์: เมื่อไม่มีบล็อกของ provider อยู่เลย (`channels.<provider>` ไม่มีอยู่) นโยบายกลุ่มจะ fallback ไปยังโหมด fail-closed (โดยทั่วไปคือ `allowlist`) แทนที่จะสืบทอด `channels.defaults.groupPolicy`
  </Accordion>
</AccordionGroup>

โมเดลความเข้าใจแบบสั้น ๆ (ลำดับการประเมินสำหรับข้อความกลุ่ม):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist)
  </Step>
  <Step title="Group allowlists">
    Group allowlists (`*.groups`, `*.groupAllowFrom`, allowlist เฉพาะช่องทาง)
  </Step>
  <Step title="Mention gating">
    การควบคุมด้วยการกล่าวถึง (`requireMention`, `/activation`)
  </Step>
</Steps>

## การควบคุมด้วยการกล่าวถึง (ค่าเริ่มต้น)

ข้อความกลุ่มต้องมีการกล่าวถึง เว้นแต่จะมีการ override รายกลุ่ม ค่าเริ่มต้นอยู่แยกตามแต่ละ subsystem ภายใต้ `*.groups."*"`.

การตอบกลับข้อความของบอตจะนับเป็นการกล่าวถึงโดยนัย เมื่อช่องทางนั้นรองรับเมทาดาทาการตอบกลับ การอ้างอิงข้อความของบอตก็อาจนับเป็นการกล่าวถึงโดยนัยได้เช่นกันในช่องทางที่เปิดเผยเมทาดาทาการอ้างอิง ปัจจุบันกรณีที่มีมาในตัวได้แก่ Telegram, WhatsApp, Slack, Discord, Microsoft Teams และ ZaloUser

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
    - `mentionPatterns` คือรูปแบบ regex ที่ปลอดภัยและไม่แยกตัวพิมพ์เล็กใหญ่; รูปแบบที่ไม่ถูกต้องและรูปแบบ nested-repetition ที่ไม่ปลอดภัยจะถูกละเลย
    - พื้นผิวการใช้งานที่มี explicit mentions จะยังผ่านได้; patterns เป็นเพียง fallback
    - การ override รายเอเจนต์: `agents.list[].groupChat.mentionPatterns` (มีประโยชน์เมื่อหลายเอเจนต์ใช้กลุ่มเดียวกัน)
    - การควบคุมด้วยการกล่าวถึงจะถูกบังคับใช้เฉพาะเมื่อสามารถตรวจจับการกล่าวถึงได้เท่านั้น (native mentions หรือมีการตั้งค่า `mentionPatterns`)
    - กลุ่มที่อนุญาตให้ตอบแบบเงียบ จะถือว่าเทิร์นของโมเดลที่ว่างแบบสะอาดหรือมีแต่ reasoning เป็นการตอบแบบเงียบ เทียบเท่ากับ `NO_REPLY` ส่วนแชตโดยตรงยังคงถือว่าการตอบว่างเป็นเทิร์นของเอเจนต์ที่ล้มเหลว
    - ค่าเริ่มต้นของ Discord อยู่ใน `channels.discord.guilds."*"` (override ได้ราย guild/channel)
    - บริบทประวัติกลุ่มถูกห่อในรูปแบบเดียวกันในทุกช่องทาง และเป็นแบบ **pending-only** (ข้อความที่ถูกข้ามเพราะการควบคุมด้วยการกล่าวถึง); ใช้ `messages.groupChat.historyLimit` สำหรับค่าเริ่มต้นแบบ global และ `channels.<channel>.historyLimit` (หรือ `channels.<channel>.accounts.*.historyLimit`) สำหรับการ override ตั้งค่าเป็น `0` เพื่อปิดใช้งาน
  </Accordion>
</AccordionGroup>

## ข้อจำกัดของ tool สำหรับกลุ่ม/ช่องทาง (ไม่บังคับ)

การกำหนดค่าบางช่องทางรองรับการจำกัดว่า tools ใดบ้างที่สามารถใช้ได้ **ภายในกลุ่ม/ห้อง/ช่องทางที่ระบุ**

- `tools`: allow/deny tools สำหรับทั้งกลุ่ม
- `toolsBySender`: การ override รายผู้ส่งภายในกลุ่ม ใช้คีย์แบบมี prefix ชัดเจน: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, และ wildcard `"*"` คีย์แบบเดิมที่ไม่มี prefix ยังใช้ได้ และจะจับคู่แบบ `id:` เท่านั้น

ลำดับการ resolve (แบบที่เฉพาะเจาะจงที่สุดชนะ):

<Steps>
  <Step title="Group toolsBySender">
    จับคู่ `toolsBySender` ของกลุ่ม/ช่องทาง
  </Step>
  <Step title="Group tools">
    `tools` ของกลุ่ม/ช่องทาง
  </Step>
  <Step title="Default toolsBySender">
    จับคู่ `toolsBySender` ค่าเริ่มต้น (`"*"` )
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
ข้อจำกัดของ tool สำหรับกลุ่ม/ช่องทางจะถูกใช้เพิ่มเติมจากนโยบาย tool ระดับ global/agent (deny ยังมีผลสูงกว่าเสมอ) บางช่องทางใช้โครงสร้างซ้อนที่ต่างกันสำหรับห้อง/ช่องทาง (เช่น Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`)
</Note>

## Group allowlists

เมื่อมีการตั้งค่า `channels.whatsapp.groups`, `channels.telegram.groups` หรือ `channels.imessage.groups` คีย์เหล่านั้นจะทำหน้าที่เป็น group allowlist ใช้ `"*"` เพื่ออนุญาตทุกกลุ่ม ขณะเดียวกันยังตั้งค่าพฤติกรรมการกล่าวถึงเริ่มต้นได้

<Warning>
ความสับสนที่พบบ่อย: การอนุมัติการจับคู่ DM ไม่ใช่สิ่งเดียวกับการอนุญาตกลุ่ม สำหรับช่องทางที่รองรับการจับคู่ DM ที่เก็บข้อมูลการจับคู่จะปลดล็อกเฉพาะ DM เท่านั้น คำสั่งในกลุ่มยังคงต้องใช้การอนุญาตผู้ส่งในกลุ่มแบบระบุชัดเจนจาก config allowlists เช่น `groupAllowFrom` หรือ fallback ของ config สำหรับช่องทางนั้นตามที่เอกสารระบุ
</Warning>

เจตนาการใช้งานที่พบบ่อย (คัดลอก/วางได้):

<Tabs>
  <Tab title="ปิดการตอบกลับในกลุ่มทั้งหมด">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="อนุญาตเฉพาะบางกลุ่ม (WhatsApp)">
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
  <Tab title="ทริกเกอร์ได้เฉพาะเจ้าของ (WhatsApp)">
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

## Activation (เฉพาะเจ้าของ)

เจ้าของกลุ่มสามารถสลับ activation รายกลุ่มได้:

- `/activation mention`
- `/activation always`

เจ้าของจะถูกกำหนดโดย `channels.whatsapp.allowFrom` (หรือ E.164 ของตัวบอตเองหากไม่ได้ตั้งค่าไว้) ให้ส่งคำสั่งเป็นข้อความเดี่ยว ๆ ปัจจุบันพื้นผิวการใช้งานอื่นจะเพิกเฉยต่อ `/activation`

## ฟิลด์บริบท

payload ขาเข้าของกลุ่มจะกำหนดค่า:

- `ChatType=group`
- `GroupSubject` (ถ้าทราบ)
- `GroupMembers` (ถ้าทราบ)
- `WasMentioned` (ผลลัพธ์ของการควบคุมด้วยการกล่าวถึง)
- หัวข้อ forum ของ Telegram จะรวม `MessageThreadId` และ `IsForum` ด้วย

หมายเหตุเฉพาะช่องทาง:

- BlueBubbles สามารถเพิ่มข้อมูลผู้เข้าร่วมกลุ่มบน macOS ที่ไม่มีชื่อจากฐานข้อมูล Contacts ในเครื่องก่อนเติม `GroupMembers` ได้แบบเลือกเปิด ฟีเจอร์นี้ปิดไว้เป็นค่าเริ่มต้น และจะทำงานหลังจากผ่านการควบคุมกลุ่มตามปกติแล้วเท่านั้น

system prompt ของเอเจนต์จะมีบทนำสำหรับกลุ่มในเทิร์นแรกของเซสชันกลุ่มใหม่ โดยจะเตือนโมเดลให้ตอบเหมือนมนุษย์ หลีกเลี่ยงตาราง Markdown ลดบรรทัดว่างให้เหลือน้อยที่สุด ใช้ระยะห่างแบบแชตปกติ และหลีกเลี่ยงการพิมพ์ลำดับอักขระ `\n` แบบตรงตัว ชื่อกลุ่มและป้ายชื่อผู้เข้าร่วมที่มาจากช่องทางจะถูกแสดงเป็นเมทาดาทาที่ไม่เชื่อถือได้ภายใน fenced block ไม่ใช่เป็นคำสั่งระบบแบบ inline

## รายละเอียดเฉพาะของ iMessage

- แนะนำให้ใช้ `chat_id:<id>` เมื่อต้องการ route หรือใส่ใน allowlist
- แสดงรายการแชต: `imsg chats --limit 20`
- การตอบกลับในกลุ่มจะถูกส่งกลับไปยัง `chat_id` เดิมเสมอ

## system prompt ของ WhatsApp

ดู [WhatsApp](/th/channels/whatsapp#system-prompts) สำหรับกฎ system prompt ของ WhatsApp ที่เป็นมาตรฐาน รวมถึงการ resolve prompt สำหรับกลุ่มและแชตโดยตรง พฤติกรรม wildcard และความหมายของ account override

## รายละเอียดเฉพาะของ WhatsApp

ดู [ข้อความกลุ่ม](/th/channels/group-messages) สำหรับพฤติกรรมเฉพาะของ WhatsApp (การแทรกประวัติ รายละเอียดการจัดการการกล่าวถึง)

## ที่เกี่ยวข้อง

- [Broadcast groups](/th/channels/broadcast-groups)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [ข้อความกลุ่ม](/th/channels/group-messages)
- [การจับคู่](/th/channels/pairing)
