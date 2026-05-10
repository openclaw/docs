---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'การกำหนดเส้นทางแบบหลายเอเจนต์: เอเจนต์ที่แยกจากกัน บัญชีช่องทาง และการเชื่อมโยง'
title: การกำหนดเส้นทางแบบหลายเอเจนต์
x-i18n:
    generated_at: "2026-05-10T19:33:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fd194cbe0938cc6ef6dd9b9803d2b1fe6f3e0777f4df7c407c692fd9f743c59
    source_path: concepts/multi-agent.md
    workflow: 16
---

เรียกใช้เอเจนต์ _ที่แยกจากกัน_ หลายตัว โดยแต่ละตัวมีพื้นที่ทำงาน ไดเรกทอรีสถานะ (`agentDir`) และประวัติเซสชันของตนเอง พร้อมกับบัญชีช่องทางหลายบัญชี (เช่น WhatsApp สองบัญชี) ใน Gateway ที่กำลังทำงานหนึ่งตัว ข้อความขาเข้าจะถูกส่งไปยังเอเจนต์ที่ถูกต้องผ่านการผูก

**เอเจนต์** ในที่นี้คือขอบเขตเต็มรูปแบบต่อหนึ่ง persona: ไฟล์พื้นที่ทำงาน โปรไฟล์การยืนยันตัวตน รีจิสทรีโมเดล และที่เก็บเซสชัน `agentDir` คือไดเรกทอรีสถานะบนดิสก์ที่เก็บการกำหนดค่าแยกตามเอเจนต์นี้ไว้ที่ `~/.openclaw/agents/<agentId>/` **การผูก** จับคู่บัญชีช่องทาง (เช่น พื้นที่ทำงาน Slack หรือหมายเลข WhatsApp) กับเอเจนต์หนึ่งในนั้น

## “เอเจนต์หนึ่งตัว” คืออะไร?

**เอเจนต์** คือสมองที่มีขอบเขตครบถ้วนพร้อมสิ่งเหล่านี้ของตนเอง:

- **พื้นที่ทำงาน** (ไฟล์, AGENTS.md/SOUL.md/USER.md, บันทึกภายในเครื่อง, กฎ persona)
- **ไดเรกทอรีสถานะ** (`agentDir`) สำหรับโปรไฟล์การยืนยันตัวตน รีจิสทรีโมเดล และการกำหนดค่าแยกตามเอเจนต์
- **ที่เก็บเซสชัน** (ประวัติแชต + สถานะการกำหนดเส้นทาง) ภายใต้ `~/.openclaw/agents/<agentId>/sessions`

โปรไฟล์การยืนยันตัวตนเป็นแบบ **ต่อเอเจนต์** แต่ละเอเจนต์อ่านจากของตนเอง:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` เป็นเส้นทางการเรียกคืนข้ามเซสชันที่ปลอดภัยกว่าที่นี่เช่นกัน: มันคืนค่ามุมมองที่จำกัดขอบเขตและผ่านการล้างข้อมูลแล้ว ไม่ใช่การ dump transcript ดิบ การเรียกคืนของ Assistant จะตัด thinking tags, โครง `<relevant-memories>`, เพย์โหลด XML การเรียกเครื่องมือแบบข้อความธรรมดา (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน), โครงการเรียกเครื่องมือที่ถูกลดระดับ, โทเคนควบคุมโมเดลแบบ ASCII/เต็มความกว้างที่รั่วไหล และ XML การเรียกเครื่องมือ MiniMax ที่ผิดรูป ก่อนการปกปิด/ตัดทอน
</Note>

<Warning>
ห้ามใช้ `agentDir` ซ้ำข้ามเอเจนต์เด็ดขาด (จะทำให้การยืนยันตัวตน/เซสชันชนกัน) เอเจนต์สามารถอ่านทะลุไปยังโปรไฟล์การยืนยันตัวตนของเอเจนต์ default/main ได้เมื่อไม่มีโปรไฟล์ภายในเครื่อง แต่ OpenClaw จะไม่โคลน OAuth refresh token เข้าไปในที่เก็บของเอเจนต์รอง หากคุณต้องการบัญชี OAuth อิสระ ให้ลงชื่อเข้าจากเอเจนต์นั้น หากคุณคัดลอกข้อมูลประจำตัวด้วยตนเอง ให้คัดลอกเฉพาะโปรไฟล์ `api_key` หรือ `token` แบบคงที่ที่พกพาได้เท่านั้น
</Warning>

Skills จะถูกโหลดจากพื้นที่ทำงานของแต่ละเอเจนต์พร้อมกับรากที่แชร์ เช่น `~/.openclaw/skills` จากนั้นกรองด้วยรายการอนุญาต Skills ของเอเจนต์ที่มีผลเมื่อมีการกำหนดค่า ใช้ `agents.defaults.skills` สำหรับ baseline ที่แชร์ และ `agents.list[].skills` สำหรับการแทนที่แบบต่อเอเจนต์ ดู [Skills: แบบต่อเอเจนต์เทียบกับแบบแชร์](/th/tools/skills#per-agent-vs-shared-skills) และ [Skills: รายการอนุญาต Skills ของเอเจนต์](/th/tools/skills#agent-skill-allowlists)

Gateway สามารถโฮสต์ **เอเจนต์หนึ่งตัว** (ค่าเริ่มต้น) หรือ **เอเจนต์หลายตัว** เคียงข้างกัน

<Note>
**หมายเหตุเรื่องพื้นที่ทำงาน:** พื้นที่ทำงานของแต่ละเอเจนต์คือ **default cwd** ไม่ใช่ sandbox แบบแข็ง เส้นทางสัมพัทธ์จะ resolve ภายในพื้นที่ทำงาน แต่เส้นทางสัมบูรณ์สามารถเข้าถึงตำแหน่งอื่นบนโฮสต์ได้ เว้นแต่จะเปิดใช้ sandboxing ดู [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing)
</Note>

## เส้นทาง (แผนที่ย่อ)

- การกำหนดค่า: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรีสถานะ: `~/.openclaw` (หรือ `OPENCLAW_STATE_DIR`)
- พื้นที่ทำงาน: `~/.openclaw/workspace` (หรือ `~/.openclaw/workspace-<agentId>`)
- ไดเรกทอรีเอเจนต์: `~/.openclaw/agents/<agentId>/agent` (หรือ `agents.list[].agentDir`)
- เซสชัน: `~/.openclaw/agents/<agentId>/sessions`

### โหมดเอเจนต์เดียว (ค่าเริ่มต้น)

หากคุณไม่ทำอะไร OpenClaw จะเรียกใช้เอเจนต์ตัวเดียว:

- `agentId` มีค่าเริ่มต้นเป็น **`main`**
- เซสชันจะถูกใช้เป็นคีย์ในรูปแบบ `agent:main:<mainKey>`
- พื้นที่ทำงานมีค่าเริ่มต้นเป็น `~/.openclaw/workspace` (หรือ `~/.openclaw/workspace-<profile>` เมื่อตั้งค่า `OPENCLAW_PROFILE`)
- สถานะมีค่าเริ่มต้นเป็น `~/.openclaw/agents/main/agent`

## ตัวช่วยเอเจนต์

ใช้ตัวช่วยสร้างเอเจนต์เพื่อเพิ่มเอเจนต์ใหม่ที่แยกจากกัน:

```bash
openclaw agents add work
```

จากนั้นเพิ่ม `bindings` (หรือให้ตัวช่วยสร้างทำให้) เพื่อกำหนดเส้นทางข้อความขาเข้า

ตรวจสอบด้วย:

```bash
openclaw agents list --bindings
```

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="สร้างพื้นที่ทำงานของแต่ละเอเจนต์">
    ใช้ตัวช่วยสร้างหรือสร้างพื้นที่ทำงานด้วยตนเอง:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    แต่ละเอเจนต์จะได้พื้นที่ทำงานของตนเองพร้อม `SOUL.md`, `AGENTS.md` และ `USER.md` แบบไม่บังคับ พร้อม `agentDir` เฉพาะและที่เก็บเซสชันภายใต้ `~/.openclaw/agents/<agentId>`

  </Step>
  <Step title="สร้างบัญชีช่องทาง">
    สร้างหนึ่งบัญชีต่อเอเจนต์บนช่องทางที่คุณต้องการ:

    - Discord: หนึ่งบอตต่อเอเจนต์ เปิดใช้ Message Content Intent แล้วคัดลอกโทเคนแต่ละรายการ
    - Telegram: หนึ่งบอตต่อเอเจนต์ผ่าน BotFather แล้วคัดลอกโทเคนแต่ละรายการ
    - WhatsApp: เชื่อมโยงหมายเลขโทรศัพท์แต่ละหมายเลขต่อบัญชี

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    ดูคู่มือช่องทาง: [Discord](/th/channels/discord), [Telegram](/th/channels/telegram), [WhatsApp](/th/channels/whatsapp)

  </Step>
  <Step title="เพิ่มเอเจนต์ บัญชี และการผูก">
    เพิ่มเอเจนต์ภายใต้ `agents.list`, บัญชีช่องทางภายใต้ `channels.<channel>.accounts` และเชื่อมต่อกันด้วย `bindings` (ตัวอย่างด้านล่าง)
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

ด้วย **เอเจนต์หลายตัว** แต่ละ `agentId` จะกลายเป็น **persona ที่แยกจากกันอย่างสมบูรณ์**:

- **หมายเลขโทรศัพท์/บัญชีที่แตกต่างกัน** (`accountId` ต่อช่องทาง)
- **บุคลิกที่แตกต่างกัน** (ไฟล์พื้นที่ทำงานแยกตามเอเจนต์ เช่น `AGENTS.md` และ `SOUL.md`)
- **การยืนยันตัวตน + เซสชันที่แยกกัน** (ไม่มีการปะปน เว้นแต่เปิดใช้โดยชัดเจน)

สิ่งนี้ทำให้ **หลายคน** แชร์เซิร์ฟเวอร์ Gateway หนึ่งตัวได้ ในขณะที่ยังคงแยก “สมอง” AI และข้อมูลของตนออกจากกัน

## การค้นหาหน่วยความจำ QMD ข้ามเอเจนต์

หากเอเจนต์หนึ่งควรค้นหา transcript เซสชัน QMD ของเอเจนต์อื่น ให้เพิ่มคอลเลกชันเพิ่มเติมภายใต้ `agents.list[].memorySearch.qmd.extraCollections` ใช้ `agents.defaults.memorySearch.qmd.extraCollections` เฉพาะเมื่อเอเจนต์ทุกตัวควรสืบทอดคอลเลกชัน transcript ที่แชร์ชุดเดียวกัน

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

เส้นทางคอลเลกชันเพิ่มเติมสามารถแชร์ข้ามเอเจนต์ได้ แต่ชื่อคอลเลกชันยังคงระบุอย่างชัดเจนเมื่อเส้นทางอยู่นอกพื้นที่ทำงานของเอเจนต์ เส้นทางภายในพื้นที่ทำงานยังคงมีขอบเขตตามเอเจนต์ เพื่อให้แต่ละเอเจนต์เก็บชุดการค้นหา transcript ของตนเองไว้

## หมายเลข WhatsApp หนึ่งหมายเลข หลายคน (แยก DM)

คุณสามารถกำหนดเส้นทาง **DM ของ WhatsApp ที่แตกต่างกัน** ไปยังเอเจนต์ต่างกันได้ ขณะที่ยังใช้ **บัญชี WhatsApp เดียว** จับคู่ตามผู้ส่ง E.164 (เช่น `+15551234567`) ด้วย `peer.kind: "direct"` การตอบกลับยังคงมาจากหมายเลข WhatsApp เดียวกัน (ไม่มีตัวตนผู้ส่งแยกตามเอเจนต์)

<Note>
แชตโดยตรงจะยุบไปยัง **คีย์เซสชันหลัก** ของเอเจนต์ ดังนั้นการแยกอย่างแท้จริงจำเป็นต้องมี **หนึ่งเอเจนต์ต่อหนึ่งคน**
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

- การควบคุมการเข้าถึง DM เป็นแบบ **สากลต่อบัญชี WhatsApp** (การจับคู่/รายการอนุญาต) ไม่ใช่ต่อเอเจนต์
- สำหรับกลุ่มที่แชร์ ให้ผูกกลุ่มกับเอเจนต์หนึ่งตัวหรือใช้ [กลุ่มออกอากาศ](/th/channels/broadcast-groups)

## กฎการกำหนดเส้นทาง (ข้อความเลือกเอเจนต์อย่างไร)

การผูกมีลักษณะ **กำหนดแน่นอน** และ **รายการที่เฉพาะเจาะจงที่สุดชนะ**:

<Steps>
  <Step title="การจับคู่ peer">
    DM/group/channel id ที่ตรงกันทุกประการ
  </Step>
  <Step title="การจับคู่ parentPeer">
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
  <Step title="การจับคู่ accountId สำหรับช่องทาง">
    fallback ต่อบัญชี
  </Step>
  <Step title="การจับคู่ระดับช่องทาง">
    `accountId: "*"`
  </Step>
  <Step title="เอเจนต์เริ่มต้น">
    fallback ไปที่ `agents.list[].default` มิฉะนั้นใช้ข้อมูลรายการแรก ค่าเริ่มต้น: `main`
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="การตัดสินเมื่อเสมอกันและความหมายแบบ AND">
    - หากมีการผูกหลายรายการที่ตรงกันใน tier เดียวกัน รายการแรกตามลำดับการกำหนดค่าจะชนะ
    - หากการผูกตั้งค่าฟิลด์การจับคู่หลายฟิลด์ (เช่น `peer` + `guildId`) ต้องมีฟิลด์ที่ระบุทั้งหมด (`AND` semantics)

  </Accordion>
  <Accordion title="รายละเอียดขอบเขตบัญชี">
    - การผูกที่ละ `accountId` จะจับคู่เฉพาะบัญชีเริ่มต้นเท่านั้น
    - ใช้ `accountId: "*"` สำหรับ fallback ทั่วทั้งช่องทางข้ามทุกบัญชี
    - หากภายหลังคุณเพิ่มการผูกเดียวกันสำหรับเอเจนต์เดียวกันพร้อม id บัญชีที่ระบุชัดเจน OpenClaw จะอัปเกรดการผูกเฉพาะช่องทางที่มีอยู่ให้เป็นแบบมีขอบเขตบัญชีแทนการทำซ้ำ

  </Accordion>
</AccordionGroup>

## หลายบัญชี / หมายเลขโทรศัพท์

ช่องทางที่รองรับ **หลายบัญชี** (เช่น WhatsApp) ใช้ `accountId` เพื่อระบุการเข้าสู่ระบบแต่ละรายการ แต่ละ `accountId` สามารถกำหนดเส้นทางไปยังเอเจนต์ที่แตกต่างกันได้ ดังนั้นเซิร์ฟเวอร์หนึ่งตัวจึงสามารถโฮสต์หมายเลขโทรศัพท์หลายหมายเลขได้โดยไม่ผสมเซสชัน

หากคุณต้องการบัญชีเริ่มต้นทั่วทั้งช่องทางเมื่อไม่ได้ระบุ `accountId` ให้ตั้งค่า `channels.<channel>.defaultAccount` (ไม่บังคับ) เมื่อไม่ได้ตั้งค่า OpenClaw จะ fallback ไปยัง `default` หากมีอยู่ มิฉะนั้นจะใช้ id บัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)

ช่องทางทั่วไปที่รองรับรูปแบบนี้ได้แก่:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## แนวคิด

- `agentId`: “สมอง” หนึ่งตัว (พื้นที่ทำงาน, การยืนยันตัวตนต่อเอเจนต์, ที่เก็บเซสชันต่อเอเจนต์)
- `accountId`: อินสแตนซ์บัญชีช่องทางหนึ่งรายการ (เช่น บัญชี WhatsApp `"personal"` เทียบกับ `"biz"`)
- `binding`: กำหนดเส้นทางข้อความขาเข้าไปยัง `agentId` โดยใช้ `(channel, accountId, peer)` และเลือกใช้ guild/team ids ได้
- แชตโดยตรงจะยุบไปยัง `agent:<agentId>:<mainKey>` (“main” ต่อเอเจนต์; `session.mainKey`)

## ตัวอย่างแพลตฟอร์ม

<AccordionGroup>
  <Accordion title="บอต Discord ต่อเอเจนต์">
    บัญชีบอต Discord แต่ละบัญชีจับคู่กับ `accountId` ที่ไม่ซ้ำกัน ผูกแต่ละบัญชีกับเอเจนต์และเก็บรายการอนุญาตแยกตามบอต

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

    - เชิญบอตแต่ละตัวเข้ากิลด์และเปิดใช้ Message Content Intent
    - โทเค็นอยู่ใน `channels.discord.accounts.<id>.token` (บัญชีเริ่มต้นสามารถใช้ `DISCORD_BOT_TOKEN` ได้)

  </Accordion>
  <Accordion title="Telegram bots per agent">
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

    - สร้างบอตหนึ่งตัวต่อเอเจนต์ด้วย BotFather แล้วคัดลอกโทเค็นแต่ละรายการ
    - โทเค็นอยู่ใน `channels.telegram.accounts.<id>.botToken` (บัญชีเริ่มต้นสามารถใช้ `TELEGRAM_BOT_TOKEN` ได้)

  </Accordion>
  <Accordion title="WhatsApp numbers per agent">
    ลิงก์แต่ละบัญชีก่อนเริ่ม Gateway:

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
  <Tab title="WhatsApp daily + Telegram deep work">
    แยกตามช่องทาง: ส่ง WhatsApp ไปยังเอเจนต์ประจำวันแบบเร็ว และส่ง Telegram ไปยังเอเจนต์ Opus

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

    - หากคุณมีหลายบัญชีสำหรับช่องทางหนึ่ง ให้เพิ่ม `accountId` ลงในการผูก (เช่น `{ channel: "whatsapp", accountId: "personal" }`)
    - หากต้องการส่ง DM/กลุ่มเดียวไปยัง Opus โดยให้ที่เหลืออยู่บน chat ให้เพิ่มการผูก `match.peer` สำหรับเพียร์นั้น การจับคู่เพียร์จะชนะกฎทั้งช่องทางเสมอ

  </Tab>
  <Tab title="Same channel, one peer to Opus">
    ให้ WhatsApp อยู่บนเอเจนต์แบบเร็ว แต่ส่ง DM หนึ่งรายการไปยัง Opus:

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

    การผูกเพียร์จะชนะเสมอ ดังนั้นให้วางไว้เหนือกฎทั้งช่องทาง

  </Tab>
  <Tab title="Family agent bound to a WhatsApp group">
    ผูกเอเจนต์ครอบครัวเฉพาะเข้ากับกลุ่ม WhatsApp กลุ่มเดียว พร้อมการกั้นด้วยการกล่าวถึงและนโยบายเครื่องมือที่เข้มงวดขึ้น:

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

    - รายการอนุญาต/ปฏิเสธเครื่องมือคือ **tools** ไม่ใช่ Skills หาก Skills ต้องเรียกใช้ไบนารี ให้ตรวจสอบว่าอนุญาต `exec` แล้วและไบนารีมีอยู่ในแซนด์บ็อกซ์
    - สำหรับการกั้นที่เข้มงวดขึ้น ให้ตั้งค่า `agents.list[].groupChat.mentionPatterns` และเปิดใช้รายการอนุญาตของกลุ่มสำหรับช่องทางไว้

  </Tab>
</Tabs>

## การกำหนดค่าแซนด์บ็อกซ์และเครื่องมือต่อเอเจนต์

แต่ละเอเจนต์สามารถมีข้อจำกัดแซนด์บ็อกซ์และเครื่องมือของตัวเองได้:

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
`setupCommand` อยู่ภายใต้ `sandbox.docker` และทำงานหนึ่งครั้งเมื่อสร้างคอนเทนเนอร์ การเขียนทับ `sandbox.docker.*` ต่อเอเจนต์จะถูกละเว้นเมื่อ scope ที่แก้แล้วเป็น `"shared"`
</Note>

**ประโยชน์:**

- **การแยกความปลอดภัย**: จำกัดเครื่องมือสำหรับเอเจนต์ที่ไม่น่าเชื่อถือ
- **การควบคุมทรัพยากร**: แซนด์บ็อกซ์เอเจนต์เฉพาะบางตัว ขณะที่ให้ตัวอื่นอยู่บนโฮสต์
- **นโยบายที่ยืดหยุ่น**: สิทธิ์แตกต่างกันต่อเอเจนต์

<Note>
`tools.elevated` เป็นแบบ **global** และอิงตามผู้ส่ง ไม่สามารถกำหนดค่าต่อเอเจนต์ได้ หากคุณต้องการขอบเขตต่อเอเจนต์ ให้ใช้ `agents.list[].tools` เพื่อปฏิเสธ `exec` สำหรับการกำหนดเป้าหมายกลุ่ม ให้ใช้ `agents.list[].groupChat.mentionPatterns` เพื่อให้ @mentions แมปไปยังเอเจนต์ที่ต้องการได้ชัดเจน
</Note>

ดู [แซนด์บ็อกซ์และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) สำหรับตัวอย่างโดยละเอียด

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP](/th/tools/acp-agents) — การเรียกใช้ฮาร์เนสเขียนโค้ดภายนอก
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — วิธีที่ข้อความถูกส่งไปยังเอเจนต์
- [Presence](/th/concepts/presence) — Presence และความพร้อมใช้งานของเอเจนต์
- [Session](/th/concepts/session) — การแยก Session และการกำหนดเส้นทาง
- [เอเจนต์ย่อย](/th/tools/subagents) — การเริ่มการรันเอเจนต์เบื้องหลัง
