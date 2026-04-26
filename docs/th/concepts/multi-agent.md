---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'การกำหนดเส้นทางหลายเอเจนต์: เอเจนต์แบบแยกขาด บัญชีช่องทาง และการผูก'
title: การกำหนดเส้นทางหลายเอเจนต์
x-i18n:
    generated_at: "2026-04-26T11:28:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 845149ac1076d4746cc5038bd4444c2fc6117710f724b8cabdc31dc9ef6abbe8
    source_path: concepts/multi-agent.md
    workflow: 15
---

รันเอเจนต์แบบ _isolated_ หลายตัว — แต่ละตัวมี workspace, ไดเรกทอรีสถานะ (`agentDir`) และประวัติเซสชันของตัวเอง — พร้อมกับบัญชีช่องทางหลายบัญชี (เช่น WhatsApp สองบัญชี) ภายใน Gateway ที่กำลังรันอยู่หนึ่งตัว ข้อความขาเข้าจะถูกกำหนดเส้นทางไปยังเอเจนต์ที่ถูกต้องผ่าน bindings

**เอเจนต์** ในที่นี้หมายถึงขอบเขต persona เต็มรูปแบบ: ไฟล์ workspace, auth profile, model registry และ session store `agentDir` คือไดเรกทอรีสถานะบนดิสก์ที่เก็บ config ต่อเอเจนต์นี้ไว้ที่ `~/.openclaw/agents/<agentId>/` ส่วน **binding** จะจับคู่บัญชีช่องทาง (เช่น workspace ของ Slack หรือหมายเลข WhatsApp) ไปยังเอเจนต์ตัวใดตัวหนึ่งเหล่านั้น

## "หนึ่งเอเจนต์" คืออะไร

**เอเจนต์** คือสมองที่มีขอบเขตครบถ้วนและมีของตัวเองดังนี้:

- **Workspace** (ไฟล์, AGENTS.md/SOUL.md/USER.md, บันทึกภายในเครื่อง, กฎ persona)
- **ไดเรกทอรีสถานะ** (`agentDir`) สำหรับ auth profile, model registry และ config ต่อเอเจนต์
- **Session store** (ประวัติแชต + สถานะการกำหนดเส้นทาง) ภายใต้ `~/.openclaw/agents/<agentId>/sessions`

Auth profile เป็นแบบ **ต่อเอเจนต์** แต่ละเอเจนต์จะอ่านจากไฟล์ของตัวเองที่:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` เป็นเส้นทางเรียกคืนข้ามเซสชันที่ปลอดภัยกว่าที่นี่เช่นกัน: มันจะคืนมุมมองที่ถูกจำกัดและผ่านการ sanitize แล้ว ไม่ใช่การดัมป์ transcript ดิบ การเรียกคืนฝั่ง assistant จะลบแท็ก thinking, โครง `<relevant-memories>`, payload XML ของ tool-call แบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัดทอน), โครง tool-call ที่ถูกลดระดับ, model control token แบบ ASCII/ฟูลวิธที่รั่วออกมา และ XML tool-call ของ MiniMax ที่ผิดรูปแบบ ออกก่อนขั้นตอน redaction/truncation
</Note>

<Warning>
ข้อมูลรับรองของเอเจนต์หลักจะ **ไม่** ถูกแชร์โดยอัตโนมัติ อย่านำ `agentDir` เดียวกันมาใช้ซ้ำข้ามเอเจนต์ (จะทำให้ auth/session ชนกัน) หากคุณต้องการแชร์ข้อมูลรับรอง ให้คัดลอก `auth-profiles.json` ไปยัง `agentDir` ของเอเจนต์อีกตัว
</Warning>

Skills จะถูกโหลดจาก workspace ของแต่ละเอเจนต์รวมถึงรากที่แชร์ร่วมกัน เช่น `~/.openclaw/skills` จากนั้นจะถูกกรองตาม allowlist ของ Skills ที่มีผลจริงของเอเจนต์เมื่อมีการกำหนดค่าไว้ ใช้ `agents.defaults.skills` สำหรับค่าเริ่มต้นร่วมกัน และ `agents.list[].skills` สำหรับการแทนที่รายเอเจนต์ ดู [Skills: per-agent vs shared](/th/tools/skills#per-agent-vs-shared-skills) และ [Skills: agent skill allowlists](/th/tools/skills#agent-skill-allowlists)

Gateway สามารถโฮสต์ได้ทั้ง **หนึ่งเอเจนต์** (ค่าเริ่มต้น) หรือ **หลายเอเจนต์** แบบเคียงข้างกัน

<Note>
**หมายเหตุเรื่อง Workspace:** workspace ของแต่ละเอเจนต์คือ **cwd เริ่มต้น** ไม่ใช่ sandbox แบบเข้มงวด พาธแบบ relative จะ resolve ภายใน workspace แต่พาธแบบ absolute ยังสามารถเข้าถึงตำแหน่งอื่นบนโฮสต์ได้ เว้นแต่จะเปิดใช้ sandboxing ดู [Sandboxing](/th/gateway/sandboxing)
</Note>

## พาธ (แผนที่อย่างย่อ)

- Config: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรีสถานะ: `~/.openclaw` (หรือ `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (หรือ `~/.openclaw/workspace-<agentId>`)
- Agent dir: `~/.openclaw/agents/<agentId>/agent` (หรือ `agents.list[].agentDir`)
- Sessions: `~/.openclaw/agents/<agentId>/sessions`

### โหมดเอเจนต์เดียว (ค่าเริ่มต้น)

หากคุณไม่ทำอะไร OpenClaw จะรันเอเจนต์เดียว:

- `agentId` มีค่าเริ่มต้นเป็น **`main`**
- Sessions จะใช้คีย์เป็น `agent:main:<mainKey>`
- Workspace มีค่าเริ่มต้นเป็น `~/.openclaw/workspace` (หรือ `~/.openclaw/workspace-<profile>` เมื่อมีการตั้ง `OPENCLAW_PROFILE`)
- สถานะมีค่าเริ่มต้นเป็น `~/.openclaw/agents/main/agent`

## ตัวช่วยเอเจนต์

ใช้วิซาร์ดเอเจนต์เพื่อเพิ่มเอเจนต์แบบ isolated ใหม่:

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
  <Step title="สร้าง workspace ของแต่ละเอเจนต์">
    ใช้วิซาร์ดหรือสร้าง workspace เองด้วยตนเอง:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    แต่ละเอเจนต์จะมี workspace ของตัวเองพร้อม `SOUL.md`, `AGENTS.md` และ `USER.md` แบบไม่บังคับ รวมถึง `agentDir` และ session store เฉพาะภายใต้ `~/.openclaw/agents/<agentId>`

  </Step>
  <Step title="สร้างบัญชีช่องทาง">
    สร้างหนึ่งบัญชีต่อหนึ่งเอเจนต์บนช่องทางที่คุณต้องการ:

    - Discord: หนึ่งบอตต่อหนึ่งเอเจนต์ เปิด Message Content Intent แล้วคัดลอกโทเค็นของแต่ละตัว
    - Telegram: หนึ่งบอตต่อหนึ่งเอเจนต์ผ่าน BotFather แล้วคัดลอกโทเค็นของแต่ละตัว
    - WhatsApp: ลิงก์หมายเลขโทรศัพท์แต่ละหมายเลขตามบัญชี

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    ดูคู่มือของแต่ละช่องทาง: [Discord](/th/channels/discord), [Telegram](/th/channels/telegram), [WhatsApp](/th/channels/whatsapp)

  </Step>
  <Step title="เพิ่มเอเจนต์ บัญชี และ bindings">
    เพิ่มเอเจนต์ภายใต้ `agents.list`, เพิ่มบัญชีช่องทางภายใต้ `channels.<channel>.accounts` และเชื่อมกันด้วย `bindings` (ดูตัวอย่างด้านล่าง)
  </Step>
  <Step title="รีสตาร์ตและตรวจสอบ">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## หลายเอเจนต์ = หลายคน หลายบุคลิก

เมื่อมี **หลายเอเจนต์** แต่ละ `agentId` จะกลายเป็น **persona ที่แยกขาดอย่างสมบูรณ์**:

- **หมายเลขโทรศัพท์/บัญชีที่ต่างกัน** (ตาม `accountId` ของแต่ละช่องทาง)
- **บุคลิกที่ต่างกัน** (ตามไฟล์ workspace ของเอเจนต์ เช่น `AGENTS.md` และ `SOUL.md`)
- **auth + sessions แยกกัน** (ไม่มีการปะปนกัน เว้นแต่จะเปิดใช้งานโดยชัดเจน)

สิ่งนี้ทำให้ **หลายคน** สามารถใช้ Gateway เซิร์ฟเวอร์ตัวเดียวร่วมกันได้ โดยที่ "สมอง" AI และข้อมูลของแต่ละคนยังแยกออกจากกัน

## การค้นหา QMD memory ข้ามเอเจนต์

หากเอเจนต์หนึ่งควรค้น transcript ของเซสชัน QMD ของอีกเอเจนต์ ให้เพิ่ม collection เพิ่มเติมไว้ภายใต้ `agents.list[].memorySearch.qmd.extraCollections` ใช้ `agents.defaults.memorySearch.qmd.extraCollections` เฉพาะเมื่อคุณต้องการให้ทุกเอเจนต์สืบทอด collection transcript ที่แชร์ร่วมกันเหมือนกัน

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
            extraCollections: [{ path: "notes" }], // resolve ภายใน workspace -> collection ชื่อ "notes-main"
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

พาธของ collection เพิ่มเติมสามารถแชร์ข้ามเอเจนต์ได้ แต่ชื่อ collection จะยังคงชัดเจนเมื่อพาธอยู่นอก workspace ของเอเจนต์ พาธที่อยู่ภายใน workspace จะยังคงอยู่ในขอบเขตของเอเจนต์ จึงทำให้แต่ละเอเจนต์มีชุดการค้นหา transcript ของตัวเอง

## หนึ่งหมายเลข WhatsApp หลายคน (แยก DM)

คุณสามารถกำหนดเส้นทาง **DM ของ WhatsApp ที่ต่างกัน** ไปยังเอเจนต์ต่างกันได้ ขณะที่ยังใช้ **บัญชี WhatsApp เดียว** โดยจับคู่จาก E.164 ของผู้ส่ง (เช่น `+15551234567`) ด้วย `peer.kind: "direct"` การตอบกลับจะยังออกมาจากหมายเลข WhatsApp เดิม (ไม่มีตัวตนผู้ส่งแยกรายเอเจนต์)

<Note>
แชตแบบ direct จะถูกรวมเป็น **main session key** ของเอเจนต์ ดังนั้นการแยกขาดอย่างแท้จริงจึงต้องใช้ **หนึ่งเอเจนต์ต่อหนึ่งคน**
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

- การควบคุมการเข้าถึง DM เป็นแบบ **ส่วนกลางต่อบัญชี WhatsApp** (pairing/allowlist) ไม่ใช่ต่อเอเจนต์
- สำหรับกลุ่มที่แชร์ร่วมกัน ให้ผูกกลุ่มนั้นเข้ากับเอเจนต์หนึ่งตัว หรือใช้ [Broadcast groups](/th/channels/broadcast-groups)

## กฎการกำหนดเส้นทาง (ข้อความเลือกเอเจนต์อย่างไร)

Bindings เป็นแบบ **กำหนดแน่นอน** และ **เฉพาะเจาะจงที่สุดชนะ**:

<Steps>
  <Step title="peer match">
    DM/group/channel id ที่ตรงกันแบบเป๊ะ
  </Step>
  <Step title="parentPeer match">
    การสืบทอดของเธรด
  </Step>
  <Step title="guildId + roles">
    การกำหนดเส้นทางตาม role ของ Discord
  </Step>
  <Step title="guildId">
    Discord
  </Step>
  <Step title="teamId">
    Slack
  </Step>
  <Step title="accountId match for a channel">
    fallback รายบัญชี
  </Step>
  <Step title="Channel-level match">
    `accountId: "*"`
  </Step>
  <Step title="Default agent">
    fallback ไปที่ `agents.list[].default` มิฉะนั้นใช้รายการแรกในลิสต์ ค่าเริ่มต้น: `main`
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="กติกาตัดสินเมื่อเสมอและความหมายแบบ AND">
    - หากมีหลาย binding ตรงกันใน tier เดียวกัน ตัวแรกตามลำดับใน config จะชนะ
    - หาก binding หนึ่งกำหนดหลายฟิลด์สำหรับ match (เช่น `peer` + `guildId`) ทุกฟิลด์ที่ระบุจะต้องตรงกันทั้งหมด (ความหมายแบบ `AND`)
  </Accordion>
  <Accordion title="รายละเอียดขอบเขตบัญชี">
    - binding ที่ละ `accountId` จะจับคู่เฉพาะบัญชีเริ่มต้นเท่านั้น
    - ใช้ `accountId: "*"` สำหรับ fallback ระดับช่องทางข้ามทุกบัญชี
    - หากภายหลังคุณเพิ่ม binding เดียวกันสำหรับเอเจนต์เดิมโดยใช้ account id แบบ explicit, OpenClaw จะอัปเกรด binding เดิมที่เป็นระดับช่องทางให้เป็นแบบมีขอบเขตบัญชี แทนที่จะสร้างรายการซ้ำ
  </Accordion>
</AccordionGroup>

## หลายบัญชี / หลายหมายเลขโทรศัพท์

ช่องทางที่รองรับ **หลายบัญชี** (เช่น WhatsApp) ใช้ `accountId` เพื่อระบุแต่ละการล็อกอิน แต่ละ `accountId` สามารถกำหนดเส้นทางไปยังเอเจนต์คนละตัวได้ จึงทำให้เซิร์ฟเวอร์หนึ่งเครื่องโฮสต์หมายเลขโทรศัพท์หลายหมายเลขได้โดยไม่ทำให้เซสชันปะปนกัน

หากคุณต้องการบัญชีเริ่มต้นระดับช่องทางเมื่อไม่มีการระบุ `accountId` ให้ตั้ง `channels.<channel>.defaultAccount` (ไม่บังคับ) หากไม่ตั้ง OpenClaw จะ fallback ไปใช้ `default` หากมี มิฉะนั้นจะใช้ account id ตัวแรกที่กำหนดไว้ (ตามลำดับที่จัดเรียง)

ช่องทางทั่วไปที่รองรับรูปแบบนี้ ได้แก่:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## แนวคิด

- `agentId`: หนึ่ง "สมอง" (workspace, auth ต่อเอเจนต์, session store ต่อเอเจนต์)
- `accountId`: อินสแตนซ์บัญชีช่องทางหนึ่งตัว (เช่น บัญชี WhatsApp `"personal"` เทียบกับ `"biz"`)
- `binding`: กำหนดเส้นทางข้อความขาเข้าไปยัง `agentId` โดยใช้ `(channel, accountId, peer)` และอาจรวม guild/team id ด้วย
- แชตแบบ direct จะถูกรวมเป็น `agent:<agentId>:<mainKey>` (ค่า "main" ต่อเอเจนต์; `session.mainKey`)

## ตัวอย่างตามแพลตฟอร์ม

<AccordionGroup>
  <Accordion title="บอต Discord แยกต่อเอเจนต์">
    บัญชีบอต Discord แต่ละตัวจะจับคู่กับ `accountId` ที่ไม่ซ้ำกัน ผูกแต่ละบัญชีเข้ากับเอเจนต์หนึ่งตัว และคง allowlist แยกตามบอต

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

    - เชิญแต่ละบอตเข้าสู่ guild และเปิด Message Content Intent
    - โทเค็นอยู่ใน `channels.discord.accounts.<id>.token` (บัญชีเริ่มต้นสามารถใช้ `DISCORD_BOT_TOKEN`)

  </Accordion>
  <Accordion title="บอต Telegram แยกต่อเอเจนต์">
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

    - สร้างหนึ่งบอตต่อหนึ่งเอเจนต์ด้วย BotFather แล้วคัดลอกโทเค็นของแต่ละตัว
    - โทเค็นอยู่ใน `channels.telegram.accounts.<id>.botToken` (บัญชีเริ่มต้นสามารถใช้ `TELEGRAM_BOT_TOKEN`)

  </Accordion>
  <Accordion title="หมายเลข WhatsApp แยกต่อเอเจนต์">
    ลิงก์แต่ละบัญชีก่อนเริ่ม gateway:

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

      // การกำหนดเส้นทางแบบกำหนดแน่นอน: รายการที่ตรงก่อนชนะ (เรียงจากเฉพาะเจาะจงที่สุดก่อน)
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // การแทนที่ราย peer แบบไม่บังคับ (ตัวอย่าง: ส่งกลุ่มหนึ่งไปยังเอเจนต์ work)
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // ปิดไว้ตามค่าเริ่มต้น: การส่งข้อความระหว่างเอเจนต์ต้องเปิดใช้งานและใส่ allowlist อย่างชัดเจน
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
              // การแทนที่แบบไม่บังคับ ค่าเริ่มต้น: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // การแทนที่แบบไม่บังคับ ค่าเริ่มต้น: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## รูปแบบที่พบบ่อย

<Tabs>
  <Tab title="WhatsApp รายวัน + Telegram สำหรับงานเชิงลึก">
    แยกตามช่องทาง: กำหนดเส้นทาง WhatsApp ไปยังเอเจนต์ที่เร็วสำหรับใช้งานประจำวัน และ Telegram ไปยังเอเจนต์ Opus

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

    - หากคุณมีหลายบัญชีสำหรับช่องทางเดียวกัน ให้เพิ่ม `accountId` เข้าไปใน binding (เช่น `{ channel: "whatsapp", accountId: "personal" }`)
    - หากต้องการกำหนดเส้นทาง DM/กลุ่มเดียวไปยัง Opus โดยให้ที่เหลือยังอยู่กับ chat ให้เพิ่ม binding แบบ `match.peer` สำหรับ peer นั้น; peer match จะชนะกฎระดับช่องทางเสมอ

  </Tab>
  <Tab title="ช่องทางเดียวกัน แต่มี peer หนึ่งตัวไปที่ Opus">
    ให้ WhatsApp อยู่กับเอเจนต์ที่เร็ว แต่กำหนดเส้นทาง DM หนึ่งรายการไปยัง Opus:

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

    peer binding จะชนะเสมอ ดังนั้นให้วางไว้เหนือกฎระดับช่องทาง

  </Tab>
  <Tab title="เอเจนต์ครอบครัวที่ผูกกับกลุ่ม WhatsApp">
    ผูกเอเจนต์ครอบครัวโดยเฉพาะเข้ากับกลุ่ม WhatsApp กลุ่มเดียว พร้อม mention gating และนโยบายเครื่องมือที่เข้มขึ้น:

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

    - รายการ allow/deny ของเครื่องมือคือ **tools** ไม่ใช่ Skills หาก Skill ต้องรันไบนารี ให้ตรวจสอบว่าอนุญาต `exec` และมีไบนารีนั้นอยู่ใน sandbox
    - หากต้องการ gating ที่เข้มงวดยิ่งขึ้น ให้ตั้ง `agents.list[].groupChat.mentionPatterns` และคงการเปิดใช้ allowlist ของกลุ่มไว้สำหรับช่องทางนั้น

  </Tab>
</Tabs>

## การกำหนดค่า sandbox และเครื่องมือรายเอเจนต์

แต่ละเอเจนต์สามารถมีข้อจำกัด sandbox และเครื่องมือของตัวเองได้:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // ไม่มี sandbox สำหรับเอเจนต์ส่วนตัว
        },
        // ไม่มีข้อจำกัดเครื่องมือ - ใช้ได้ทุกเครื่องมือ
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // อยู่ใน sandbox เสมอ
          scope: "agent",  // หนึ่งคอนเทนเนอร์ต่อหนึ่งเอเจนต์
          docker: {
            // การตั้งค่าแบบครั้งเดียวหลังสร้างคอนเทนเนอร์
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // อนุญาตเฉพาะเครื่องมือ read
          deny: ["exec", "write", "edit", "apply_patch"],    // ปฏิเสธเครื่องมืออื่น
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` อยู่ภายใต้ `sandbox.docker` และจะรันหนึ่งครั้งตอนสร้างคอนเทนเนอร์ การแทนที่ `sandbox.docker.*` รายเอเจนต์จะถูกละเลยเมื่อ scope ที่ resolve แล้วเป็น `"shared"`
</Note>

**ประโยชน์:**

- **การแยกด้านความปลอดภัย**: จำกัดเครื่องมือสำหรับเอเจนต์ที่ไม่น่าเชื่อถือ
- **การควบคุมทรัพยากร**: ทำ sandbox เฉพาะบางเอเจนต์ ขณะที่เอเจนต์อื่นยังทำงานบนโฮสต์
- **นโยบายที่ยืดหยุ่น**: สิทธิ์ต่างกันได้ในแต่ละเอเจนต์

<Note>
`tools.elevated` เป็นแบบ **ส่วนกลาง** และอิงตามผู้ส่ง; ไม่สามารถกำหนดค่ารายเอเจนต์ได้ หากคุณต้องการขอบเขตรายเอเจนต์ ให้ใช้ `agents.list[].tools` เพื่อปฏิเสธ `exec` สำหรับการกำหนดเป้าหมายในกลุ่ม ให้ใช้ `agents.list[].groupChat.mentionPatterns` เพื่อให้ @mention แมปไปยังเอเจนต์ที่ตั้งใจไว้ได้อย่างชัดเจน
</Note>

ดู [sandbox และเครื่องมือหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) สำหรับตัวอย่างแบบละเอียด

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP](/th/tools/acp-agents) — การรัน coding harness ภายนอก
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — วิธีที่ข้อความถูกกำหนดเส้นทางไปยังเอเจนต์
- [Presence](/th/concepts/presence) — presence และความพร้อมใช้งานของเอเจนต์
- [เซสชัน](/th/concepts/session) — การแยกเซสชันและการกำหนดเส้นทาง
- [Sub-agents](/th/tools/subagents) — การสร้างการรันเอเจนต์เบื้องหลัง
