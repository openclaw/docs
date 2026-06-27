---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'การกำหนดเส้นทางหลายเอเจนต์: เอเจนต์ที่แยกจากกัน บัญชีช่องทาง และการผูกโยง'
title: การกำหนดเส้นทางแบบหลายเอเจนต์
x-i18n:
    generated_at: "2026-06-27T17:28:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c1c55188cd27ea786cf65dcabd356a602e1e6da5f842532b189df59195274db
    source_path: concepts/multi-agent.md
    workflow: 16
---

เรียกใช้เอเจนต์ _ที่แยกจากกัน_ หลายตัว โดยแต่ละตัวมี workspace, ไดเรกทอรีสถานะ (`agentDir`) และประวัติเซสชันของตัวเอง พร้อมกับบัญชีช่องทางหลายบัญชี (เช่น WhatsApp สองบัญชี) ใน Gateway ที่กำลังทำงานอยู่ตัวเดียว ข้อความขาเข้าจะถูกกำหนดเส้นทางไปยังเอเจนต์ที่ถูกต้องผ่านการผูก

**เอเจนต์** ในที่นี้คือขอบเขตเต็มรูปแบบต่อ persona: ไฟล์ workspace, โปรไฟล์การยืนยันตัวตน, รีจิสทรีโมเดล และที่เก็บเซสชัน `agentDir` คือไดเรกทอรีสถานะบนดิสก์ที่เก็บการกำหนดค่าต่อเอเจนต์นี้ไว้ที่ `~/.openclaw/agents/<agentId>/` **การผูก** จะจับคู่บัญชีช่องทาง (เช่น workspace ของ Slack หรือหมายเลข WhatsApp) เข้ากับเอเจนต์หนึ่งในเหล่านั้น

## "เอเจนต์หนึ่งตัว" คืออะไร?

**เอเจนต์** คือสมองที่มีขอบเขตครบถ้วน โดยมีของตัวเองดังนี้:

- **Workspace** (ไฟล์, AGENTS.md/SOUL.md/USER.md, โน้ตในเครื่อง, กฎ persona)
- **ไดเรกทอรีสถานะ** (`agentDir`) สำหรับโปรไฟล์การยืนยันตัวตน, รีจิสทรีโมเดล และการกำหนดค่าต่อเอเจนต์
- **ที่เก็บเซสชัน** (ประวัติแชต + สถานะการกำหนดเส้นทาง) ภายใต้ `~/.openclaw/agents/<agentId>/sessions`

โปรไฟล์การยืนยันตัวตนเป็นแบบ **ต่อเอเจนต์** เอเจนต์แต่ละตัวอ่านจากไฟล์ของตัวเอง:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` เป็นเส้นทางการเรียกคืนข้ามเซสชันที่ปลอดภัยกว่าที่นี่เช่นกัน: มันคืนค่ามุมมองที่มีขอบเขตและผ่านการทำให้ปลอดภัยแล้ว ไม่ใช่การเททรานสคริปต์ดิบ การเรียกคืนของ Assistant จะลบแท็กความคิด, โครง `<relevant-memories>`, เพย์โหลด XML การเรียกเครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน), โครงการเรียกเครื่องมือที่ถูกลดระดับ, โทเค็นควบคุมโมเดลแบบ ASCII/เต็มความกว้างที่รั่วไหล และ XML การเรียกเครื่องมือ MiniMax ที่ผิดรูปแบบ ก่อนทำการปกปิด/ตัดทอน
</Note>

<Warning>
ห้ามใช้ `agentDir` ซ้ำระหว่างเอเจนต์ (จะทำให้การยืนยันตัวตน/เซสชันชนกัน) เอเจนต์
สามารถอ่านผ่านไปยังโปรไฟล์การยืนยันตัวตนของเอเจนต์หลัก/ค่าเริ่มต้นได้เมื่อไม่มี
โปรไฟล์ในเครื่อง แต่ OpenClaw จะไม่โคลนโทเค็นรีเฟรช OAuth เข้าไปใน
ที่เก็บเอเจนต์รอง หากคุณต้องการบัญชี OAuth อิสระ ให้ลงชื่อเข้าใช้จาก
เอเจนต์นั้น หากคุณคัดลอกข้อมูลรับรองเอง ให้คัดลอกเฉพาะโปรไฟล์
`api_key` หรือ `token` แบบคงที่ที่พกพาได้เท่านั้น
</Warning>

Skills จะถูกโหลดจาก workspace ของเอเจนต์แต่ละตัว รวมถึงรากที่ใช้ร่วมกัน เช่น `~/.openclaw/skills` จากนั้นจะถูกกรองด้วยรายการอนุญาต Skills ของเอเจนต์ที่มีผลเมื่อมีการกำหนดค่าไว้ ใช้ `agents.defaults.skills` สำหรับค่าพื้นฐานที่ใช้ร่วมกัน และ `agents.list[].skills` สำหรับการแทนที่ต่อเอเจนต์ ดู [Skills: ต่อเอเจนต์เทียบกับแบบใช้ร่วมกัน](/th/tools/skills#per-agent-vs-shared-skills) และ [Skills: รายการอนุญาต Skills ของเอเจนต์](/th/tools/skills#agent-allowlists)

Gateway สามารถโฮสต์ **เอเจนต์หนึ่งตัว** (ค่าเริ่มต้น) หรือ **เอเจนต์หลายตัว** เคียงข้างกันได้

<Note>
**หมายเหตุเกี่ยวกับ Workspace:** workspace ของเอเจนต์แต่ละตัวคือ **cwd ค่าเริ่มต้น** ไม่ใช่ sandbox แบบแข็ง เส้นทางสัมพัทธ์จะ resolve ภายใน workspace แต่เส้นทางสัมบูรณ์สามารถเข้าถึงตำแหน่งอื่นบนโฮสต์ได้ เว้นแต่จะเปิดใช้ sandboxing ดู [Sandboxing](/th/gateway/sandboxing)
</Note>

## เส้นทาง (แผนที่แบบเร็ว)

- การกำหนดค่า: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรีสถานะ: `~/.openclaw` (หรือ `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (หรือ `~/.openclaw/workspace-<agentId>`)
- ไดเรกทอรีเอเจนต์: `~/.openclaw/agents/<agentId>/agent` (หรือ `agents.list[].agentDir`)
- เซสชัน: `~/.openclaw/agents/<agentId>/sessions`

### โหมดเอเจนต์เดียว (ค่าเริ่มต้น)

หากคุณไม่ทำอะไร OpenClaw จะเรียกใช้เอเจนต์เดียว:

- `agentId` มีค่าเริ่มต้นเป็น **`main`**
- เซสชันมีคีย์เป็น `agent:main:<mainKey>`
- Workspace มีค่าเริ่มต้นเป็น `~/.openclaw/workspace` (หรือ `~/.openclaw/workspace-<profile>` เมื่อตั้งค่า `OPENCLAW_PROFILE`)
- สถานะมีค่าเริ่มต้นเป็น `~/.openclaw/agents/main/agent`

## ตัวช่วยเอเจนต์

ใช้วิซาร์ดเอเจนต์เพื่อเพิ่มเอเจนต์ใหม่ที่แยกจากกัน:

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
  <Step title="สร้าง workspace ของเอเจนต์แต่ละตัว">
    ใช้วิซาร์ดหรือสร้าง workspace ด้วยตนเอง:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    เอเจนต์แต่ละตัวจะได้ workspace ของตัวเองพร้อม `SOUL.md`, `AGENTS.md` และ `USER.md` ที่เป็นทางเลือก รวมถึง `agentDir` และที่เก็บเซสชันเฉพาะภายใต้ `~/.openclaw/agents/<agentId>`

  </Step>
  <Step title="สร้างบัญชีช่องทาง">
    สร้างหนึ่งบัญชีต่อเอเจนต์บนช่องทางที่คุณต้องการ:

    - Discord: หนึ่งบอตต่อเอเจนต์ เปิดใช้ Message Content Intent แล้วคัดลอกโทเค็นแต่ละรายการ
    - Telegram: หนึ่งบอตต่อเอเจนต์ผ่าน BotFather แล้วคัดลอกโทเค็นแต่ละรายการ
    - WhatsApp: ลิงก์หมายเลขโทรศัพท์แต่ละหมายเลขต่อบัญชี

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    ดูคู่มือช่องทาง: [Discord](/th/channels/discord), [Telegram](/th/channels/telegram), [WhatsApp](/th/channels/whatsapp)

  </Step>
  <Step title="เพิ่มเอเจนต์ บัญชี และการผูก">
    เพิ่มเอเจนต์ภายใต้ `agents.list`, บัญชีช่องทางภายใต้ `channels.<channel>.accounts` และเชื่อมต่อด้วย `bindings` (ตัวอย่างอยู่ด้านล่าง)
  </Step>
  <Step title="รีสตาร์ตและตรวจสอบ">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## เอเจนต์หลายตัว = หลายคน หลายบุคลิก

เมื่อมี **เอเจนต์หลายตัว** แต่ละ `agentId` จะกลายเป็น **persona ที่แยกจากกันโดยสมบูรณ์**:

- **หมายเลขโทรศัพท์/บัญชีต่างกัน** (`accountId` ต่อช่องทาง)
- **บุคลิกต่างกัน** (ไฟล์ workspace ต่อเอเจนต์ เช่น `AGENTS.md` และ `SOUL.md`)
- **การยืนยันตัวตน + เซสชันแยกกัน** (ไม่มีการปะปน เว้นแต่เปิดใช้อย่างชัดเจน)

สิ่งนี้ทำให้ **หลายคน** ใช้เซิร์ฟเวอร์ Gateway เดียวร่วมกันได้ พร้อมคงการแยก "สมอง" AI และข้อมูลของตนเอง

## การค้นหาหน่วยความจำ QMD ข้ามเอเจนต์

หากเอเจนต์หนึ่งควรค้นหาทรานสคริปต์เซสชัน QMD ของเอเจนต์อื่น ให้เพิ่มคอลเลกชันเพิ่มเติมภายใต้ `agents.list[].memorySearch.qmd.extraCollections` ใช้ `agents.defaults.memorySearch.qmd.extraCollections` เฉพาะเมื่อทุกเอเจนต์ควรสืบทอดคอลเลกชันทรานสคริปต์ที่ใช้ร่วมกันชุดเดียวกันเท่านั้น

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

เส้นทางคอลเลกชันเพิ่มเติมสามารถใช้ร่วมกันระหว่างเอเจนต์ได้ แต่ชื่อคอลเลกชันจะยังคงต้องระบุชัดเจนเมื่อเส้นทางอยู่นอก workspace ของเอเจนต์ เส้นทางภายใน workspace จะยังคงอยู่ในขอบเขตของเอเจนต์ เพื่อให้เอเจนต์แต่ละตัวเก็บชุดค้นหาทรานสคริปต์ของตัวเอง

## หมายเลข WhatsApp หนึ่งหมายเลข หลายคน (แยกข้อความส่วนตัว)

คุณสามารถกำหนดเส้นทาง **ข้อความส่วนตัวของ WhatsApp ที่ต่างกัน** ไปยังเอเจนต์ต่างกันได้ ขณะยังอยู่บน **บัญชี WhatsApp บัญชีเดียว** จับคู่ตามผู้ส่ง E.164 (เช่น `+15551234567`) ด้วย `peer.kind: "direct"` การตอบกลับยังคงมาจากหมายเลข WhatsApp เดิม (ไม่มีตัวตนผู้ส่งแยกตามเอเจนต์)

<Note>
แชตโดยตรงจะถูกรวมไปยัง **คีย์เซสชันหลัก** ของเอเจนต์ ดังนั้นการแยกจริงต้องใช้ **หนึ่งเอเจนต์ต่อคน**
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

- การควบคุมการเข้าถึงข้อความส่วนตัวเป็นแบบ **ทั่วทั้งบัญชี WhatsApp** (การจับคู่/รายการอนุญาต) ไม่ใช่ต่อเอเจนต์
- สำหรับกลุ่มที่ใช้ร่วมกัน ให้ผูกกลุ่มกับเอเจนต์หนึ่งตัว หรือใช้ [กลุ่มบรอดแคสต์](/th/channels/broadcast-groups)

## กฎการกำหนดเส้นทาง (ข้อความเลือกเอเจนต์อย่างไร)

การผูกเป็นแบบ **กำหนดได้แน่นอน** และ **รายการที่เฉพาะเจาะจงที่สุดชนะ**:

<Steps>
  <Step title="จับคู่ peer">
    ID ข้อความส่วนตัว/กลุ่ม/ช่องทางที่ตรงกันพอดี
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
  <Step title="การจับคู่ระดับช่องทาง">
    `accountId: "*"`
  </Step>
  <Step title="เอเจนต์ค่าเริ่มต้น">
    fallback ไปยัง `agents.list[].default` ไม่เช่นนั้นใช้รายการแรกในลิสต์ ค่าเริ่มต้น: `main`
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="การตัดสินเมื่อเสมอกันและ semantics แบบ AND">
    - หากการผูกหลายรายการตรงกันในระดับเดียวกัน รายการแรกตามลำดับการกำหนดค่าจะชนะ
    - หากการผูกตั้งค่าฟิลด์การจับคู่หลายฟิลด์ (เช่น `peer` + `guildId`) ฟิลด์ที่ระบุทั้งหมดจะต้องตรงกัน (semantics แบบ `AND`)

  </Accordion>
  <Accordion title="รายละเอียดขอบเขตบัญชี">
    - การผูกที่ละ `accountId` จะจับคู่เฉพาะบัญชีค่าเริ่มต้นเท่านั้น ไม่ได้จับคู่ทุกบัญชี
    - ใช้ `accountId: "*"` สำหรับ fallback ทั่วทั้งช่องทางข้ามทุกบัญชี
    - ใช้ `accountId: "<name>"` เพื่อจับคู่บัญชีเดียว
    - หากภายหลังคุณเพิ่มการผูกเดียวกันสำหรับเอเจนต์เดียวกันพร้อม ID บัญชีที่ระบุชัดเจน OpenClaw จะอัปเกรดการผูกเฉพาะช่องทางที่มีอยู่ให้เป็นแบบมีขอบเขตบัญชีแทนการทำซ้ำ

  </Accordion>
</AccordionGroup>

## หลายบัญชี / หลายหมายเลขโทรศัพท์

ช่องทางที่รองรับ **หลายบัญชี** (เช่น WhatsApp) ใช้ `accountId` เพื่อระบุการเข้าสู่ระบบแต่ละครั้ง แต่ละ `accountId` สามารถกำหนดเส้นทางไปยังเอเจนต์ต่างกันได้ ดังนั้นเซิร์ฟเวอร์หนึ่งตัวจึงโฮสต์หมายเลขโทรศัพท์หลายหมายเลขได้โดยไม่ปะปนเซสชัน

หากคุณต้องการบัญชีค่าเริ่มต้นทั่วทั้งช่องทางเมื่อไม่ได้ระบุ `accountId` ให้ตั้งค่า `channels.<channel>.defaultAccount` (ทางเลือก) เมื่อไม่ได้ตั้งค่า OpenClaw จะ fallback ไปยัง `default` หากมี ไม่เช่นนั้นจะใช้ ID บัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)

ช่องทางทั่วไปที่รองรับรูปแบบนี้ ได้แก่:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## แนวคิด

- `agentId`: "สมอง" หนึ่งชุด (workspace, การยืนยันตัวตนต่อเอเจนต์, ที่เก็บเซสชันต่อเอเจนต์)
- `accountId`: อินสแตนซ์บัญชีช่องทางหนึ่งบัญชี (เช่น บัญชี WhatsApp `"personal"` เทียบกับ `"biz"`)
- `binding`: กำหนดเส้นทางข้อความขาเข้าไปยัง `agentId` ด้วย `(channel, accountId, peer)` และ ID guild/team ที่เป็นทางเลือก
- แชตโดยตรงจะถูกรวมไปยัง `agent:<agentId>:<mainKey>` ("main" ต่อเอเจนต์; `session.mainKey`)

## ตัวอย่างแพลตฟอร์ม

<AccordionGroup>
  <Accordion title="บอต Discord ต่อเอเจนต์">
    บัญชีบอต Discord แต่ละบัญชีจับคู่กับ `accountId` ที่ไม่ซ้ำกัน ผูกแต่ละบัญชีกับเอเจนต์และเก็บรายการอนุญาตแยกต่อบอต

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

    - เชิญบอตแต่ละตัวเข้ากิลด์และเปิดใช้งาน Message Content Intent.
    - โทเค็นอยู่ใน `channels.discord.accounts.<id>.token` (บัญชีเริ่มต้นสามารถใช้ `DISCORD_BOT_TOKEN` ได้).

  </Accordion>
  <Accordion title="บอต Telegram ต่อเอเจนต์">
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

    - สร้างบอตหนึ่งตัวต่อเอเจนต์ด้วย BotFather แล้วคัดลอกโทเค็นแต่ละรายการ.
    - โทเค็นอยู่ใน `channels.telegram.accounts.<id>.botToken` (บัญชีเริ่มต้นสามารถใช้ `TELEGRAM_BOT_TOKEN` ได้).
    - สำหรับบอตหลายตัวในกลุ่ม Telegram เดียวกัน ให้เชิญบอตแต่ละตัวและกล่าวถึงบอตที่ควรตอบ.
    - ปิดใช้งาน Privacy Mode ของ BotFather สำหรับบอตกลุ่มแต่ละตัว จากนั้นเพิ่มบอตกลับเข้าไปใหม่เพื่อให้ Telegram ใช้การตั้งค่านั้น.
    - อนุญาตกลุ่มด้วย `channels.telegram.groups` หรือใช้ `groupPolicy: "open"` เฉพาะสำหรับการปรับใช้กลุ่มที่เชื่อถือได้เท่านั้น.
    - ใส่ ID ผู้ใช้ของผู้ส่งใน `groupAllowFrom`. ID ของกลุ่มและซูเปอร์กรุ๊ปต้องอยู่ใน `channels.telegram.groups` ไม่ใช่ `groupAllowFrom`.
    - ผูกด้วย `accountId` เพื่อให้บอตแต่ละตัวส่งต่อไปยังเอเจนต์ของตัวเอง.

  </Accordion>
  <Accordion title="หมายเลข WhatsApp ต่อเอเจนต์">
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
  <Tab title="WhatsApp รายวัน + งานเชิงลึกใน Telegram">
    แยกตามช่องทาง: ส่ง WhatsApp ไปยังเอเจนต์ทั่วไปที่รวดเร็ว และส่ง Telegram ไปยังเอเจนต์ Opus.

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
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
        { agentId: "opus", match: { channel: "telegram", accountId: "*" } },
      ],
    }
    ```

    หมายเหตุ:

    - ตัวอย่างเหล่านี้ใช้ `accountId: "*"` เพื่อให้การผูกยังทำงานต่อไปได้หากคุณเพิ่มบัญชีในภายหลัง.
    - หากต้องการส่ง DM/กลุ่มเดียวไปยัง Opus โดยให้รายการที่เหลืออยู่บน chat ให้เพิ่มการผูก `match.peer` สำหรับ peer นั้น; การจับคู่ peer จะชนะกฎระดับช่องทางเสมอ.

  </Tab>
  <Tab title="ช่องทางเดียวกัน ส่งหนึ่ง peer ไปยัง Opus">
    ให้ WhatsApp อยู่บนเอเจนต์ที่รวดเร็ว แต่ส่ง DM หนึ่งรายการไปยัง Opus:

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
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    การผูก peer จะชนะเสมอ ดังนั้นให้วางไว้เหนือกฎระดับช่องทาง.

  </Tab>
  <Tab title="เอเจนต์ครอบครัวที่ผูกกับกลุ่ม WhatsApp">
    ผูกเอเจนต์ครอบครัวเฉพาะกับกลุ่ม WhatsApp เดียว โดยมีการคัดกรองด้วยการกล่าวถึงและนโยบายเครื่องมือที่เข้มงวดขึ้น:

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

    - รายการ allow/deny ของเครื่องมือคือ **เครื่องมือ** ไม่ใช่ Skills. หาก Skills ต้องเรียกใช้ไบนารี ให้ตรวจสอบว่าอนุญาต `exec` และไบนารีมีอยู่ในแซนด์บ็อกซ์.
    - สำหรับการคัดกรองที่เข้มงวดยิ่งขึ้น ให้ตั้งค่า `agents.list[].groupChat.mentionPatterns` และเปิดใช้ allowlist ของกลุ่มสำหรับช่องทางต่อไป.

  </Tab>
</Tabs>

## แซนด์บ็อกซ์และการกำหนดค่าเครื่องมือต่อเอเจนต์

แต่ละเอเจนต์สามารถมีแซนด์บ็อกซ์และข้อจำกัดเครื่องมือของตัวเองได้:

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
`setupCommand` อยู่ภายใต้ `sandbox.docker` และทำงานหนึ่งครั้งเมื่อสร้างคอนเทนเนอร์. การ override `sandbox.docker.*` ต่อเอเจนต์จะถูกละเว้นเมื่อ scope ที่ resolve ได้คือ `"shared"`.
</Note>

**ประโยชน์:**

- **การแยกด้านความปลอดภัย**: จำกัดเครื่องมือสำหรับเอเจนต์ที่ไม่น่าเชื่อถือ.
- **การควบคุมทรัพยากร**: ใช้แซนด์บ็อกซ์กับเอเจนต์บางตัวโดยให้ตัวอื่นยังอยู่บนโฮสต์.
- **นโยบายที่ยืดหยุ่น**: สิทธิ์ต่างกันต่อเอเจนต์.

<Note>
`tools.elevated` เป็นแบบ **global** และอิงตามผู้ส่ง; ไม่สามารถกำหนดค่าต่อเอเจนต์ได้. หากคุณต้องการขอบเขตต่อเอเจนต์ ให้ใช้ `agents.list[].tools` เพื่อปฏิเสธ `exec`. สำหรับการกำหนดเป้าหมายกลุ่ม ให้ใช้ `agents.list[].groupChat.mentionPatterns` เพื่อให้ @mentions map ไปยังเอเจนต์ที่ตั้งใจไว้ได้อย่างชัดเจน.
</Note>

ดู [แซนด์บ็อกซ์และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) สำหรับตัวอย่างโดยละเอียด.

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP](/th/tools/acp-agents) — การรัน harness เขียนโค้ดภายนอก
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — วิธีที่ข้อความถูกส่งไปยังเอเจนต์
- [Presence](/th/concepts/presence) — Presence และความพร้อมใช้งานของเอเจนต์
- [Session](/th/concepts/session) — การแยก Session และการกำหนดเส้นทาง
- [เอเจนต์ย่อย](/th/tools/subagents) — การสร้างการรันเอเจนต์เบื้องหลัง
