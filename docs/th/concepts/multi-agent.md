---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'การกำหนดเส้นทางแบบหลายเอเจนต์: เอเจนต์ที่แยกจากกัน, บัญชีช่องทาง, และการผูก'
title: การกำหนดเส้นทางแบบหลายเอเจนต์
x-i18n:
    generated_at: "2026-04-30T09:47:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67adea74d5f97feff3f816cc4c34c9429e7659289013e5a7c7623bd185a50a31
    source_path: concepts/multi-agent.md
    workflow: 16
---

เรียกใช้เอเจนต์แบบ_แยกอิสระ_หลายตัว โดยแต่ละตัวมีพื้นที่ทำงาน ไดเรกทอรีสถานะ (`agentDir`) และประวัติเซสชันของตัวเอง พร้อมกับบัญชีช่องทางหลายบัญชี (เช่น WhatsApp สองบัญชี) ใน Gateway ที่กำลังทำงานหนึ่งตัว ข้อความขาเข้าจะถูกกำหนดเส้นทางไปยังเอเจนต์ที่ถูกต้องผ่านการผูก

**เอเจนต์** ในที่นี้คือขอบเขตแบบเต็มต่อหนึ่งบุคลิก: ไฟล์พื้นที่ทำงาน โปรไฟล์การยืนยันตัวตน รีจิสทรีโมเดล และที่เก็บเซสชัน `agentDir` คือไดเรกทอรีสถานะบนดิสก์ที่เก็บการกำหนดค่าต่อเอเจนต์นี้ไว้ที่ `~/.openclaw/agents/<agentId>/` **การผูก** จะจับคู่บัญชีช่องทาง (เช่น พื้นที่ทำงาน Slack หรือหมายเลข WhatsApp) กับเอเจนต์หนึ่งในเหล่านั้น

## "เอเจนต์หนึ่งตัว" คืออะไร?

**เอเจนต์** คือสมองที่มีขอบเขตครบถ้วนพร้อมสิ่งเหล่านี้ของตัวเอง:

- **พื้นที่ทำงาน** (ไฟล์, AGENTS.md/SOUL.md/USER.md, โน้ตในเครื่อง, กฎบุคลิก)
- **ไดเรกทอรีสถานะ** (`agentDir`) สำหรับโปรไฟล์การยืนยันตัวตน รีจิสทรีโมเดล และการกำหนดค่าต่อเอเจนต์
- **ที่เก็บเซสชัน** (ประวัติแชต + สถานะการกำหนดเส้นทาง) ภายใต้ `~/.openclaw/agents/<agentId>/sessions`

โปรไฟล์การยืนยันตัวตนเป็นแบบ**ต่อเอเจนต์** แต่ละเอเจนต์อ่านจากของตัวเอง:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` เป็นเส้นทางการเรียกคืนข้ามเซสชันที่ปลอดภัยกว่าที่นี่เช่นกัน: มันส่งคืนมุมมองที่มีขอบเขตและผ่านการทำให้ปลอดภัยแล้ว ไม่ใช่การดัมป์ทรานสคริปต์ดิบ การเรียกคืนของผู้ช่วยจะลบแท็กการคิด โครง scaffolding ของ `<relevant-memories>` เพย์โหลด XML การเรียกเครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน) โครง scaffolding การเรียกเครื่องมือที่ถูกลดระดับ โทเค็นควบคุมโมเดลแบบ ASCII/เต็มความกว้างที่รั่วไหล และ XML การเรียกเครื่องมือ MiniMax ที่ผิดรูปแบบ ก่อนการปกปิด/ตัดทอน
</Note>

<Warning>
ห้ามใช้ `agentDir` ซ้ำข้ามเอเจนต์ (ทำให้เกิดการชนกันของการยืนยันตัวตน/เซสชัน) เอเจนต์
สามารถอ่านทะลุไปยังโปรไฟล์การยืนยันตัวตนของเอเจนต์เริ่มต้น/หลักได้เมื่อไม่มี
โปรไฟล์ในเครื่อง แต่ OpenClaw จะไม่โคลนโทเค็นรีเฟรช OAuth ไปยัง
ที่เก็บเอเจนต์รอง หากคุณต้องการบัญชี OAuth อิสระ ให้ลงชื่อเข้าจาก
เอเจนต์นั้น หากคุณคัดลอกข้อมูลรับรองด้วยตนเอง ให้คัดลอกเฉพาะโปรไฟล์ `api_key` หรือ `token`
แบบคงที่ที่ย้ายได้เท่านั้น
</Warning>

Skills จะถูกโหลดจากพื้นที่ทำงานของแต่ละเอเจนต์ รวมถึงรากที่ใช้ร่วมกัน เช่น `~/.openclaw/skills` จากนั้นจะถูกกรองด้วยรายการอนุญาต Skills ของเอเจนต์ที่มีผลเมื่อกำหนดค่าไว้ ใช้ `agents.defaults.skills` สำหรับฐานร่วม และ `agents.list[].skills` สำหรับการแทนที่ต่อเอเจนต์ ดู [Skills: ต่อเอเจนต์เทียบกับแบบใช้ร่วมกัน](/th/tools/skills#per-agent-vs-shared-skills) และ [Skills: รายการอนุญาต Skills ของเอเจนต์](/th/tools/skills#agent-skill-allowlists)

Gateway สามารถโฮสต์**เอเจนต์หนึ่งตัว** (ค่าเริ่มต้น) หรือ**เอเจนต์หลายตัว** เคียงข้างกันได้

<Note>
**หมายเหตุพื้นที่ทำงาน:** พื้นที่ทำงานของแต่ละเอเจนต์คือ **cwd เริ่มต้น** ไม่ใช่ sandbox แบบแข็ง พาธสัมพัทธ์จะ resolve ภายในพื้นที่ทำงาน แต่พาธสัมบูรณ์สามารถเข้าถึงตำแหน่งอื่นบนโฮสต์ได้ เว้นแต่จะเปิดใช้ sandboxing ดู [Sandboxing](/th/gateway/sandboxing)
</Note>

## พาธ (แผนที่แบบเร็ว)

- การกำหนดค่า: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรีสถานะ: `~/.openclaw` (หรือ `OPENCLAW_STATE_DIR`)
- พื้นที่ทำงาน: `~/.openclaw/workspace` (หรือ `~/.openclaw/workspace-<agentId>`)
- ไดเรกทอรีเอเจนต์: `~/.openclaw/agents/<agentId>/agent` (หรือ `agents.list[].agentDir`)
- เซสชัน: `~/.openclaw/agents/<agentId>/sessions`

### โหมดเอเจนต์เดียว (ค่าเริ่มต้น)

หากคุณไม่ทำอะไร OpenClaw จะเรียกใช้เอเจนต์หนึ่งตัว:

- `agentId` มีค่าเริ่มต้นเป็น **`main`**
- เซสชันจะถูก key เป็น `agent:main:<mainKey>`
- พื้นที่ทำงานมีค่าเริ่มต้นเป็น `~/.openclaw/workspace` (หรือ `~/.openclaw/workspace-<profile>` เมื่อตั้งค่า `OPENCLAW_PROFILE`)
- สถานะมีค่าเริ่มต้นเป็น `~/.openclaw/agents/main/agent`

## ตัวช่วยเอเจนต์

ใช้วิซาร์ดเอเจนต์เพื่อเพิ่มเอเจนต์แบบแยกอิสระใหม่:

```bash
openclaw agents add work
```

จากนั้นเพิ่ม `bindings` (หรือให้วิซาร์ดทำให้) เพื่อกำหนดเส้นทางข้อความขาเข้า

ตรวจสอบด้วย:

```bash
openclaw agents list --bindings
```

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="สร้างพื้นที่ทำงานของแต่ละเอเจนต์">
    ใช้วิซาร์ดหรือสร้างพื้นที่ทำงานด้วยตนเอง:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    แต่ละเอเจนต์จะได้พื้นที่ทำงานของตัวเองพร้อม `SOUL.md`, `AGENTS.md` และ `USER.md` ที่ไม่บังคับ รวมถึง `agentDir` เฉพาะและที่เก็บเซสชันภายใต้ `~/.openclaw/agents/<agentId>`

  </Step>
  <Step title="สร้างบัญชีช่องทาง">
    สร้างหนึ่งบัญชีต่อเอเจนต์บนช่องทางที่คุณต้องการ:

    - Discord: หนึ่งบอตต่อเอเจนต์ เปิดใช้ Message Content Intent แล้วคัดลอกแต่ละโทเค็น
    - Telegram: หนึ่งบอตต่อเอเจนต์ผ่าน BotFather แล้วคัดลอกแต่ละโทเค็น
    - WhatsApp: เชื่อมโยงแต่ละหมายเลขโทรศัพท์ต่อบัญชี

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    ดูคู่มือช่องทาง: [Discord](/th/channels/discord), [Telegram](/th/channels/telegram), [WhatsApp](/th/channels/whatsapp)

  </Step>
  <Step title="เพิ่มเอเจนต์ บัญชี และการผูก">
    เพิ่มเอเจนต์ภายใต้ `agents.list` บัญชีช่องทางภายใต้ `channels.<channel>.accounts` และเชื่อมต่อด้วย `bindings` (ตัวอย่างด้านล่าง)
  </Step>
  <Step title="รีสตาร์ทและตรวจสอบ">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## เอเจนต์หลายตัว = หลายคน หลายบุคลิก

ด้วย**เอเจนต์หลายตัว** แต่ละ `agentId` จะกลายเป็น**บุคลิกที่แยกอิสระเต็มรูปแบบ**:

- **หมายเลขโทรศัพท์/บัญชีที่แตกต่างกัน** (`accountId` ต่อช่องทาง)
- **บุคลิกที่แตกต่างกัน** (ไฟล์พื้นที่ทำงานต่อเอเจนต์ เช่น `AGENTS.md` และ `SOUL.md`)
- **การยืนยันตัวตน + เซสชันแยกกัน** (ไม่มีการคุยข้าม เว้นแต่จะเปิดใช้โดยชัดเจน)

สิ่งนี้ทำให้**หลายคน**ใช้เซิร์ฟเวอร์ Gateway เดียวร่วมกันได้ โดยยังแยก "สมอง" AI และข้อมูลของแต่ละคนออกจากกัน

## การค้นหาหน่วยความจำ QMD ข้ามเอเจนต์

หากเอเจนต์หนึ่งควรค้นหาทรานสคริปต์เซสชัน QMD ของเอเจนต์อื่น ให้เพิ่มคอลเลกชันเพิ่มเติมภายใต้ `agents.list[].memorySearch.qmd.extraCollections` ใช้ `agents.defaults.memorySearch.qmd.extraCollections` เฉพาะเมื่อทุกเอเจนต์ควรสืบทอดคอลเลกชันทรานสคริปต์ที่ใช้ร่วมกันชุดเดียวกัน

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

พาธคอลเลกชันเพิ่มเติมสามารถใช้ร่วมกันข้ามเอเจนต์ได้ แต่ชื่อคอลเลกชันจะยังคงระบุชัดเจนเมื่อพาธอยู่นอกพื้นที่ทำงานของเอเจนต์ พาธภายในพื้นที่ทำงานยังคงอยู่ในขอบเขตเอเจนต์ เพื่อให้แต่ละเอเจนต์เก็บชุดการค้นหาทรานสคริปต์ของตัวเอง

## หมายเลข WhatsApp หนึ่งหมายเลข หลายคน (แยก DM)

คุณสามารถกำหนดเส้นทาง**ข้อความส่วนตัว WhatsApp ที่ต่างกัน**ไปยังเอเจนต์ต่างกันได้ ขณะยังคงใช้**บัญชี WhatsApp เดียว** จับคู่ตามผู้ส่ง E.164 (เช่น `+15551234567`) ด้วย `peer.kind: "direct"` การตอบกลับยังมาจากหมายเลข WhatsApp เดิม (ไม่มีตัวตนผู้ส่งแยกตามเอเจนต์)

<Note>
แชตโดยตรงจะยุบไปยัง**คีย์เซสชันหลัก**ของเอเจนต์ ดังนั้นการแยกอิสระจริงต้องใช้**หนึ่งเอเจนต์ต่อหนึ่งคน**
</Note>

ตัวอย่าง:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

หมายเหตุ:

- การควบคุมการเข้าถึง DM เป็นแบบ**ทั่วทั้งบัญชี WhatsApp** (การจับคู่/รายการอนุญาต) ไม่ใช่ต่อเอเจนต์
- สำหรับกลุ่มที่ใช้ร่วมกัน ให้ผูกกลุ่มกับเอเจนต์หนึ่งตัว หรือใช้ [กลุ่มกระจายข้อความ](/th/channels/broadcast-groups)

## กฎการกำหนดเส้นทาง (ข้อความเลือกเอเจนต์อย่างไร)

การผูกเป็นแบบ**กำหนดแน่นอน** และ**รายการที่เฉพาะเจาะจงที่สุดชนะ**:

<Steps>
  <Step title="จับคู่ peer">
    ID ของ DM/กลุ่ม/ช่องทางแบบตรงกันเป๊ะ
  </Step>
  <Step title="จับคู่ parentPeer">
    การสืบทอดเธรด
  </Step>
  <Step title="guildId + roles">
    การกำหนดเส้นทางตามบทบาท Discord
  </Step>
  <Step title="guildId">
    Discord
  </Step>
  <Step title="teamId">
    Slack
  </Step>
  <Step title="จับคู่ accountId สำหรับช่องทาง">
    fallback ต่อบัญชี
  </Step>
  <Step title="จับคู่ระดับช่องทาง">
    `accountId: "*"`
  </Step>
  <Step title="เอเจนต์เริ่มต้น">
    fallback ไปยัง `agents.list[].default` มิฉะนั้นใช้ รายการแรก ค่าเริ่มต้น: `main`
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="การตัดสินกรณีเสมอและความหมายแบบ AND">
    - หากมีหลายการผูกที่ตรงกันในลำดับชั้นเดียวกัน รายการแรกตามลำดับใน config จะชนะ
    - หากการผูกตั้งค่าฟิลด์การจับคู่หลายฟิลด์ (เช่น `peer` + `guildId`) ฟิลด์ที่ระบุทั้งหมดจำเป็นต้องตรงกัน (ความหมายแบบ `AND`)

  </Accordion>
  <Accordion title="รายละเอียดขอบเขตบัญชี">
    - การผูกที่ละ `accountId` จะจับคู่เฉพาะบัญชีเริ่มต้นเท่านั้น
    - ใช้ `accountId: "*"` สำหรับ fallback ครอบคลุมทั้งช่องทางในทุกบัญชี
    - หากภายหลังคุณเพิ่มการผูกเดียวกันสำหรับเอเจนต์เดียวกันพร้อม ID บัญชีแบบชัดเจน OpenClaw จะอัปเกรดการผูกเฉพาะช่องทางที่มีอยู่ให้เป็นแบบมีขอบเขตบัญชีแทนที่จะทำซ้ำ

  </Accordion>
</AccordionGroup>

## หลายบัญชี / หมายเลขโทรศัพท์

ช่องทางที่รองรับ**หลายบัญชี** (เช่น WhatsApp) ใช้ `accountId` เพื่อระบุการเข้าสู่ระบบแต่ละครั้ง แต่ละ `accountId` สามารถกำหนดเส้นทางไปยังเอเจนต์คนละตัวได้ ดังนั้นเซิร์ฟเวอร์หนึ่งตัวจึงโฮสต์หมายเลขโทรศัพท์หลายหมายเลขได้โดยไม่ผสมเซสชันกัน

หากคุณต้องการบัญชีเริ่มต้นทั้งช่องทางเมื่อไม่ได้ระบุ `accountId` ให้ตั้งค่า `channels.<channel>.defaultAccount` (ไม่บังคับ) เมื่อไม่ได้ตั้งค่า OpenClaw จะ fallback ไปยัง `default` หากมี มิฉะนั้นใช้ ID บัญชีที่กำหนดค่าไว้รายการแรก (เรียงลำดับแล้ว)

ช่องทางทั่วไปที่รองรับรูปแบบนี้ ได้แก่:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## แนวคิด

- `agentId`: "สมอง" หนึ่งชุด (พื้นที่ทำงาน, การยืนยันตัวตนต่อเอเจนต์, ที่เก็บเซสชันต่อเอเจนต์)
- `accountId`: อินสแตนซ์บัญชีช่องทางหนึ่งชุด (เช่น บัญชี WhatsApp `"personal"` เทียบกับ `"biz"`)
- `binding`: กำหนดเส้นทางข้อความขาเข้าไปยัง `agentId` ตาม `(channel, accountId, peer)` และ ID ของ guild/team ที่ไม่บังคับ
- แชตโดยตรงจะยุบเป็น `agent:<agentId>:<mainKey>` ("หลัก" ต่อเอเจนต์; `session.mainKey`)

## ตัวอย่างแพลตฟอร์ม

<AccordionGroup>
  <Accordion title="บอต Discord ต่อเอเจนต์">
    แต่ละบัญชีบอต Discord จะจับคู่กับ `accountId` ที่ไม่ซ้ำกัน ผูกแต่ละบัญชีกับเอเจนต์ และเก็บรายการอนุญาตแยกตามบอต

    ```json5
    {
      agents: {
        list: [
          { id: "main", workspace: "~/.openclaw/workspace-main" },
          { id: "coding", workspace: "~/.openclaw/workspace-coding" },
        ],
      },
      bindings: [
        { agentId: "main", match: { channel: "discord", accountId: "default" } },
        { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
      ],
      channels: {
        discord: {
          groupPolicy: "allowlist",
          accounts: {
            default: {
              token: "DISCORD_BOT_TOKEN_MAIN",
              guilds: {
                "123456789012345678": {
                  channels: {
                    "222222222222222222": { allow: true, requireMention: false },
                  },
                },
              },
            },
            coding: {
              token: "DISCORD_BOT_TOKEN_CODING",
              guilds: {
                "123456789012345678": {
                  channels: {
                    "333333333333333333": { allow: true, requireMention: false },
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    - เชิญบอทแต่ละตัวเข้ากิลด์และเปิดใช้งาน Message Content Intent
    - โทเค็นอยู่ใน `channels.discord.accounts.<id>.token` (บัญชีเริ่มต้นสามารถใช้ `DISCORD_BOT_TOKEN` ได้)

  </Accordion>
  <Accordion title="บอท Telegram ต่อ agent">
    ```json5
    {
      agents: {
        list: [
          { id: "main", workspace: "~/.openclaw/workspace-main" },
          { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
        ],
      },
      bindings: [
        { agentId: "main", match: { channel: "telegram", accountId: "default" } },
        { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
      ],
      channels: {
        telegram: {
          accounts: {
            default: {
              botToken: "123456:ABC...",
              dmPolicy: "pairing",
            },
            alerts: {
              botToken: "987654:XYZ...",
              dmPolicy: "allowlist",
              allowFrom: ["tg:123456789"],
            },
          },
        },
      },
    }
    ```

    - สร้างบอทหนึ่งตัวต่อ agent ด้วย BotFather แล้วคัดลอกแต่ละโทเค็น
    - โทเค็นอยู่ใน `channels.telegram.accounts.<id>.botToken` (บัญชีเริ่มต้นสามารถใช้ `TELEGRAM_BOT_TOKEN` ได้)

  </Accordion>
  <Accordion title="หมายเลข WhatsApp ต่อ agent">
    เชื่อมโยงแต่ละบัญชีก่อนเริ่ม Gateway:

    ```bash
    openclaw channels login --channel whatsapp --account personal
    openclaw channels login --channel whatsapp --account biz
    ```

    `~/.openclaw/openclaw.json` (JSON5):

    ```js
    {
      agents: {
        list: [
          {
            id: "home",
            default: true,
            name: "Home",
            workspace: "~/.openclaw/workspace-home",
            agentDir: "~/.openclaw/agents/home/agent",
          },
          {
            id: "work",
            name: "Work",
            workspace: "~/.openclaw/workspace-work",
            agentDir: "~/.openclaw/agents/work/agent",
          },
        ],
      },

      // Deterministic routing: first match wins (most-specific first).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Optional per-peer override (example: send a specific group to work agent).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
      tools: {
        agentToAgent: {
          enabled: false,
          allow: ["home", "work"],
        },
      },

      channels: {
        whatsapp: {
          accounts: {
            personal: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## รูปแบบทั่วไป

<Tabs>
  <Tab title="WhatsApp รายวัน + งานเชิงลึกบน Telegram">
    แยกตามช่องทาง: ส่ง WhatsApp ไปยัง agent สำหรับการใช้งานประจำวันที่รวดเร็ว และส่ง Telegram ไปยัง agent Opus

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Deep Work",
            workspace: "~/.openclaw/workspace-opus",
            model: "anthropic/claude-opus-4-6",
          },
        ],
      },
      bindings: [
        { agentId: "chat", match: { channel: "whatsapp" } },
        { agentId: "opus", match: { channel: "telegram" } },
      ],
    }
    ```

    หมายเหตุ:

    - หากคุณมีหลายบัญชีสำหรับช่องทางหนึ่ง ให้เพิ่ม `accountId` ใน binding (เช่น `{ channel: "whatsapp", accountId: "personal" }`)
    - หากต้องการส่ง DM/กลุ่มเดียวไปยัง Opus โดยให้ที่เหลือยังอยู่บน chat ให้เพิ่ม binding `match.peer` สำหรับ peer นั้น การจับคู่ peer จะชนะกฎทั้งช่องทางเสมอ

  </Tab>
  <Tab title="ช่องทางเดียวกัน ส่งหนึ่ง peer ไปยัง Opus">
    ให้ WhatsApp อยู่บน agent ที่รวดเร็ว แต่ส่งหนึ่ง DM ไปยัง Opus:

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Deep Work",
            workspace: "~/.openclaw/workspace-opus",
            model: "anthropic/claude-opus-4-6",
          },
        ],
      },
      bindings: [
        {
          agentId: "opus",
          match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp" } },
      ],
    }
    ```

    binding ของ peer จะชนะเสมอ ดังนั้นให้วางไว้เหนือกฎทั้งช่องทาง

  </Tab>
  <Tab title="agent ครอบครัวที่ผูกกับกลุ่ม WhatsApp">
    ผูก agent สำหรับครอบครัวโดยเฉพาะกับกลุ่ม WhatsApp กลุ่มเดียว พร้อมการกั้นด้วยการกล่าวถึงและนโยบายเครื่องมือที่เข้มงวดยิ่งขึ้น:

    ```json5
    {
      agents: {
        list: [
          {
            id: "family",
            name: "Family",
            workspace: "~/.openclaw/workspace-family",
            identity: { name: "Family Bot" },
            groupChat: {
              mentionPatterns: ["@family", "@familybot", "@Family Bot"],
            },
            sandbox: {
              mode: "all",
              scope: "agent",
            },
            tools: {
              allow: [
                "exec",
                "read",
                "sessions_list",
                "sessions_history",
                "sessions_send",
                "sessions_spawn",
                "session_status",
              ],
              deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
            },
          },
        ],
      },
      bindings: [
        {
          agentId: "family",
          match: {
            channel: "whatsapp",
            peer: { kind: "group", id: "120363999999999999@g.us" },
          },
        },
      ],
    }
    ```

    หมายเหตุ:

    - รายการอนุญาต/ปฏิเสธเครื่องมือคือ **เครื่องมือ** ไม่ใช่ Skills หาก skill ต้องเรียกใช้ไบนารี ให้ตรวจสอบว่าอนุญาต `exec` และไบนารีนั้นมีอยู่ใน sandbox
    - สำหรับการกั้นที่เข้มงวดยิ่งขึ้น ให้ตั้งค่า `agents.list[].groupChat.mentionPatterns` และเปิดใช้งาน allowlist ของกลุ่มสำหรับช่องทางไว้

  </Tab>
</Tabs>

## การกำหนดค่า sandbox และเครื่องมือต่อ agent

agent แต่ละตัวสามารถมี sandbox และข้อจำกัดเครื่องมือของตนเองได้:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` อยู่ใต้ `sandbox.docker` และรันหนึ่งครั้งเมื่อสร้างคอนเทนเนอร์ การแทนที่ `sandbox.docker.*` ต่อ agent จะถูกละเว้นเมื่อ scope ที่ resolve ได้คือ `"shared"`
</Note>

**ประโยชน์:**

- **การแยกด้านความปลอดภัย**: จำกัดเครื่องมือสำหรับ agent ที่ไม่น่าเชื่อถือ
- **การควบคุมทรัพยากร**: sandbox เฉพาะ agent บางตัว ขณะที่ให้ตัวอื่นอยู่บนโฮสต์
- **นโยบายที่ยืดหยุ่น**: สิทธิ์แตกต่างกันตาม agent

<Note>
`tools.elevated` เป็นแบบ **global** และอิงตามผู้ส่ง ไม่สามารถกำหนดค่าต่อ agent ได้ หากคุณต้องการขอบเขตต่อ agent ให้ใช้ `agents.list[].tools` เพื่อปฏิเสธ `exec` สำหรับการกำหนดเป้าหมายกลุ่ม ให้ใช้ `agents.list[].groupChat.mentionPatterns` เพื่อให้ @mentions map ไปยัง agent ที่ต้องการได้อย่างชัดเจน
</Note>

ดู [sandbox และเครื่องมือแบบหลาย agent](/th/tools/multi-agent-sandbox-tools) สำหรับตัวอย่างโดยละเอียด

## ที่เกี่ยวข้อง

- [agent ACP](/th/tools/acp-agents) — การรันชุดเครื่องมือเขียนโค้ดภายนอก
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — วิธีที่ข้อความถูกกำหนดเส้นทางไปยัง agent
- [Presence](/th/concepts/presence) — presence และความพร้อมใช้งานของ agent
- [Session](/th/concepts/session) — การแยก session และการกำหนดเส้นทาง
- [Sub-agents](/th/tools/subagents) — การ spawn การรัน agent เบื้องหลัง
