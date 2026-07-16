---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'การกำหนดเส้นทางแบบหลายเอเจนต์: ขอบเขตของเอเจนต์ บัญชีช่องทาง และการเชื่อมโยง'
title: การกำหนดเส้นทางแบบหลายเอเจนต์
x-i18n:
    generated_at: "2026-07-16T19:02:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

เรียกใช้เอเจนต์ที่_แยกจากกัน_หลายตัวในกระบวนการ Gateway เดียว โดยแต่ละตัวมีเวิร์กสเปซ ไดเรกทอรีสถานะ (`agentDir`) และประวัติเซสชันที่ใช้ SQLite เป็นแบ็กเอนด์เป็นของตนเอง รวมถึงบัญชีช่องทางหลายบัญชี (เช่น หมายเลข WhatsApp สองหมายเลข) ข้อความขาเข้าจะถูกกำหนดเส้นทางไปยังเอเจนต์ที่ถูกต้องผ่าน **การผูก**

**เอเจนต์** คือขอบเขตทั้งหมดของแต่ละเพอร์โซนา ซึ่งประกอบด้วยไฟล์เวิร์กสเปซ โปรไฟล์การยืนยันตัวตน รีจิสทรีโมเดล และที่เก็บเซสชัน **การผูก** จะแมปบัญชีช่องทาง (เวิร์กสเปซ Slack, หมายเลข WhatsApp เป็นต้น) ไปยังเอเจนต์หนึ่งตัว

## เอเจนต์หนึ่งตัวคืออะไร

เอเจนต์แต่ละตัวมีสิ่งต่อไปนี้เป็นของตนเอง:

- **เวิร์กสเปซ**: ไฟล์, `AGENTS.md`/`SOUL.md`/`USER.md`, บันทึกในเครื่อง, กฎของเพอร์โซนา
- **ไดเรกทอรีสถานะ** (`agentDir`): โปรไฟล์การยืนยันตัวตน รีจิสทรีโมเดล การกำหนดค่ารายเอเจนต์
- **ที่เก็บเซสชัน**: ประวัติการแชตและสถานะการกำหนดเส้นทางใน `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

โปรไฟล์การยืนยันตัวตนแยกตามเอเจนต์และอ่านจาก:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` เป็นวิธีเรียกคืนข้อมูลข้ามเซสชันที่ปลอดภัยกว่า โดยจะส่งคืนมุมมองที่จำกัดขอบเขตและปกปิดข้อมูลแล้ว ไม่ใช่การถ่ายโอนทรานสคริปต์ดิบ ระบบจะตัดลายเซ็นบล็อกการคิด รายละเอียดเพย์โหลดผลลัพธ์จากเครื่องมือ โครงสร้างประกอบ `<relevant-memories>` แท็ก XML สำหรับการเรียกเครื่องมือ (`<tool_call>`, `<function_call>` และรูปพหูพจน์/รูปแบบที่ลดระดับของแท็กเหล่านั้น) รวมถึง XML สำหรับการเรียกเครื่องมือของ MiniMax จากนั้นจึงตัดทอนและจำกัดเอาต์พุตตามขนาดไบต์
</Note>

<Warning>
ห้ามใช้ `agentDir` ซ้ำระหว่างเอเจนต์ เพราะจะทำให้สถานะการยืนยันตัวตน/เซสชันชนกัน เมื่อข้อมูลประจำตัว OAuth ภายในเครื่องของเอเจนต์รองหมดอายุหรือการรีเฟรชล้มเหลว OpenClaw จะอ่านต่อไปยังข้อมูลประจำตัวของเอเจนต์เริ่มต้น/หลักสำหรับรหัสโปรไฟล์เดียวกัน และเลือกใช้โทเค็นที่ใหม่ที่สุด โดยไม่คัดลอกรีเฟรชโทเค็นไปยังที่เก็บของเอเจนต์รอง หากต้องการบัญชี OAuth ที่เป็นอิสระโดยสมบูรณ์ ให้ลงชื่อเข้าใช้จากเอเจนต์นั้น หากคัดลอกข้อมูลประจำตัวด้วยตนเอง ให้คัดลอกเฉพาะโปรไฟล์ `api_key` หรือ `token` แบบคงที่ซึ่งพกพาได้เท่านั้น โดยค่าเริ่มต้นข้อมูลสำหรับรีเฟรช OAuth ไม่สามารถพกพาได้ (`copyToAgents` สามารถเลือกเปิดใช้ให้โปรไฟล์หนึ่งอย่างชัดเจนได้)
</Warning>

Skills จะโหลดจากเวิร์กสเปซของแต่ละเอเจนต์รวมถึงรูทที่ใช้ร่วมกัน เช่น `~/.openclaw/skills` แล้วกรองตามรายการอนุญาต Skills ที่มีผลของเอเจนต์ ใช้ `agents.defaults.skills` สำหรับค่าพื้นฐานที่ใช้ร่วมกัน และ `agents.list[].skills` สำหรับการแทนที่รายเอเจนต์ (รายการที่ระบุอย่างชัดเจนจะแทนที่ค่าเริ่มต้น ไม่ได้นำมารวมกัน) ดู [Skills: รายเอเจนต์เทียบกับใช้ร่วมกัน](/th/tools/skills#per-agent-vs-shared-skills) และ [Skills: รายการอนุญาตของเอเจนต์](/th/tools/skills#agent-allowlists)

พื้นที่จัดเก็บที่ Plugin เป็นเจ้าของจะเป็นไปตามการกำหนดค่าของ Plugin นั้น การเพิ่มเอเจนต์ตัวที่สอง
ไม่ได้แยกที่เก็บส่วนกลางของทุก Plugin โดยอัตโนมัติ ตัวอย่างเช่น ให้กำหนดค่า
[คลัง Memory Wiki รายเอเจนต์](/th/concepts/multi-agent#per-agent-memory-wiki-vaults)
เมื่อเพอร์โซนาไม่ควรใช้ความรู้วิกิที่คอมไพล์แล้วร่วมกัน

<Note>
**หมายเหตุเกี่ยวกับเวิร์กสเปซ:** เวิร์กสเปซของแต่ละเอเจนต์คือ **cwd เริ่มต้น** ไม่ใช่แซนด์บ็อกซ์แบบบังคับ พาธสัมพัทธ์จะถูกตีความภายในเวิร์กสเปซ แต่พาธสัมบูรณ์สามารถเข้าถึงตำแหน่งอื่นบนโฮสต์ได้ เว้นแต่จะเปิดใช้แซนด์บ็อกซ์ ดู [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing)
</Note>

## พาธ

| รายการ                           | ค่าเริ่มต้น                                                                            | การแทนที่                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| การกำหนดค่า                      | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| ไดเรกทอรีสถานะ                   | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| เวิร์กสเปซของเอเจนต์เริ่มต้น     | `~/.openclaw/workspace` (หรือ `workspace-<profile>` เมื่อตั้งค่า `OPENCLAW_PROFILE`)      | `agents.list[].workspace`, จากนั้น `agents.defaults.workspace`, หรือ `OPENCLAW_WORKSPACE_DIR` |
| เวิร์กสเปซของเอเจนต์อื่น         | `<stateDir>/workspace-<agentId>` (หรือ `<agents.defaults.workspace>/<agentId>` เมื่อตั้งค่าไว้) | `agents.list[].workspace`                                                                |
| ไดเรกทอรีเอเจนต์                 | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| เซสชันและทรานสคริปต์             | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
| อาร์ติแฟกต์เซสชันแบบเดิม/ที่เก็บถาวร | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### โหมดเอเจนต์เดียว (ค่าเริ่มต้น)

หากไม่กำหนดค่าใด OpenClaw จะเรียกใช้เอเจนต์หนึ่งตัว:

- `agentId` มีค่าเริ่มต้นเป็น `main`
- คีย์เซสชันเป็น `agent:main:<mainKey>` (`mainKey` เริ่มต้นคือ `main`)
- เวิร์กสเปซมีค่าเริ่มต้นเป็น `~/.openclaw/workspace` (หรือ `workspace-<profile>` เมื่อตั้งค่า `OPENCLAW_PROFILE` เป็นค่าอื่นที่ไม่ใช่ `default`)
- สถานะมีค่าเริ่มต้นเป็น `~/.openclaw/agents/main/agent`

## ตัวช่วยเอเจนต์

เพิ่มเอเจนต์แบบแยกตัวใหม่:

```bash
openclaw agents add work
```

แฟล็ก: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (ใช้ซ้ำได้), `--non-interactive` (ต้องใช้ `--workspace`)

เพิ่ม `bindings` เพื่อกำหนดเส้นทางข้อความขาเข้า (ตัวช่วยสร้างจะเสนอให้ดำเนินการนี้) แล้วตรวจสอบ:

```bash
openclaw agents list --bindings
```

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="สร้างเวิร์กสเปซของแต่ละเอเจนต์">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    แต่ละเอเจนต์จะได้รับเวิร์กสเปซของตนเองพร้อม `SOUL.md`, `AGENTS.md` และ `USER.md` ที่เลือกใช้ได้ รวมถึง `agentDir` เฉพาะและที่เก็บเซสชันภายใต้ `~/.openclaw/agents/<agentId>`

  </Step>
  <Step title="สร้างบัญชีช่องทาง">
    สร้างหนึ่งบัญชีต่อหนึ่งเอเจนต์บนช่องทางที่ต้องการ:

    - Discord: ใช้บอตหนึ่งตัวต่อเอเจนต์ เปิดใช้ Message Content Intent แล้วคัดลอกโทเค็นของแต่ละตัว
    - Telegram: สร้างบอตหนึ่งตัวต่อเอเจนต์ผ่าน BotFather แล้วคัดลอกโทเค็นของแต่ละตัว
    - WhatsApp: เชื่อมโยงหมายเลขโทรศัพท์แต่ละหมายเลขต่อบัญชี

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    ดูคู่มือช่องทาง: [Discord](/th/channels/discord), [Telegram](/th/channels/telegram), [WhatsApp](/th/channels/whatsapp)

  </Step>
  <Step title="เพิ่มเอเจนต์ บัญชี และการผูก">
    เพิ่มเอเจนต์ภายใต้ `agents.list` บัญชีช่องทางภายใต้ `channels.<channel>.accounts` และเชื่อมต่อด้วย `bindings` (ดูตัวอย่างด้านล่าง)
  </Step>
  <Step title="รีสตาร์ตและตรวจสอบ">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## หลายเอเจนต์ หลายเพอร์โซนา

`agentId` แต่ละรายการที่กำหนดค่าไว้เป็นขอบเขตเพอร์โซนาที่แยกจากกันสำหรับสถานะหลักของเอเจนต์:

- บัญชีที่แตกต่างกันในแต่ละช่องทาง (ตาม `accountId`)
- บุคลิกที่แตกต่างกัน (`AGENTS.md`/`SOUL.md` รายเอเจนต์)
- การยืนยันตัวตนและเซสชันแยกจากกัน โดยเปิดใช้การเข้าถึงข้ามเอเจนต์ผ่านฟีเจอร์หรือการกำหนดค่า Plugin ที่ระบุอย่างชัดเจนเท่านั้น

วิธีนี้ทำให้หลายคนใช้ Gateway เดียวร่วมกันได้ โดยยังคงแยกสถานะหลักของเอเจนต์ออกจากกัน

## คลัง Memory Wiki รายเอเจนต์

โดยค่าเริ่มต้น Memory Wiki ใช้คลังส่วนกลางหนึ่งแห่ง หากต้องการแยก
ความรู้ที่คอมไพล์แล้วของเอเจนต์ฝ่ายสนับสนุนออกจากของเอเจนต์ฝ่ายการตลาด ให้ตั้งค่า
`plugins.entries.memory-wiki.config.vault.scope` เป็น `agent`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
        },
      },
    },
  },
}
```

พาธที่กำหนดค่าคือไดเรกทอรีแม่ OpenClaw จะต่อท้ายด้วย
รหัสเอเจนต์ที่ปรับให้เป็นมาตรฐาน ทำให้ได้พาธ เช่น `~/.openclaw/wiki/support` และ
`~/.openclaw/wiki/marketing` การดำเนินการ CLI และ Gateway ที่มีขอบเขตรายเอเจนต์ต้องระบุ
เอเจนต์อย่างชัดเจนเมื่อกำหนดค่าเอเจนต์หลายตัว ดู
[คลัง Memory Wiki รายเอเจนต์](/th/plugins/memory-wiki#per-agent-vaults) สำหรับรายละเอียดเกี่ยวกับการกรองบริดจ์
การย้ายข้อมูล และขอบเขตความเชื่อถือ

## การค้นหาหน่วยความจำ QMD ข้ามเอเจนต์

หากต้องการให้เอเจนต์หนึ่งค้นหาทรานสคริปต์เซสชัน QMD ของเอเจนต์อื่น ให้เพิ่มคอลเลกชันเพิ่มเติมภายใต้ `agents.list[].memorySearch.qmd.extraCollections` ใช้ `agents.defaults.memorySearch.qmd.extraCollections` เมื่อเอเจนต์ทุกตัวควรใช้คอลเลกชันเดียวกันร่วมกัน

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
            extraCollections: [{ path: "notes" }], // ตีความภายในเวิร์กสเปซ -> คอลเลกชันชื่อ "notes-main"
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

พาธของคอลเลกชันเพิ่มเติมสามารถใช้ร่วมกันระหว่างเอเจนต์ได้ แต่ `name` ของพาธนั้นจะยังต้องระบุอย่างชัดเจนเมื่อพาธอยู่นอกเวิร์กสเปซของเอเจนต์ พาธภายในเวิร์กสเปซจะยังมีขอบเขตรายเอเจนต์ เพื่อให้แต่ละเอเจนต์มีชุดการค้นหาทรานสคริปต์ของตนเอง

## หมายเลข WhatsApp หนึ่งหมายเลข หลายคน (แยก DM)

กำหนดเส้นทาง DM ของ WhatsApp จากผู้ส่งแต่ละรายไปยังเอเจนต์ต่างกันบนบัญชี WhatsApp **บัญชีเดียว** โดยจับคู่ E.164 ของผู้ส่ง (`+15551234567`) กับ `peer.kind: "direct"` การตอบกลับยังคงส่งจากหมายเลข WhatsApp เดียวกัน เนื่องจากไม่มีอัตลักษณ์ผู้ส่งแยกตามเอเจนต์

<Note>
โดยค่าเริ่มต้น แชตโดยตรงจะถูกรวมไว้ที่คีย์เซสชันหลักของเอเจนต์ ดังนั้นการแยกอย่างแท้จริงต้องใช้หนึ่งเอเจนต์ต่อหนึ่งคน
</Note>

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

การควบคุมการเข้าถึง DM (การจับคู่/รายการอนุญาต) เป็นแบบส่วนกลางต่อบัญชี WhatsApp ไม่ใช่รายเอเจนต์ สำหรับกลุ่มที่ใช้ร่วมกัน ให้ผูกกลุ่มกับเอเจนต์หนึ่งตัวหรือใช้ [กลุ่มบรอดแคสต์](/th/channels/broadcast-groups)

## กฎการกำหนดเส้นทาง

การผูกให้ผลลัพธ์แบบกำหนดแน่นอน โดยรายการที่เฉพาะเจาะจงที่สุดจะชนะ ดู [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing#routing-rules-how-an-agent-is-chosen) สำหรับลำดับระดับทั้งหมด (เพียร์ตรงกันทุกประการ, เพียร์แม่, ไวลด์การ์ดเพียร์, กิลด์+บทบาท, กิลด์, ทีม, บัญชี, ช่องทาง, เอเจนต์เริ่มต้น) กฎบางข้อที่ควรเน้นมีดังนี้:

- หากการผูกหลายรายการตรงกันภายในระดับเดียวกัน รายการแรกตามลำดับในการกำหนดค่าจะชนะ
- หากการผูกกำหนดฟิลด์จับคู่หลายฟิลด์ (เช่น `peer` + `guildId`) ฟิลด์ทั้งหมดที่ระบุต้องตรงกัน (ความหมายแบบ `AND`)
- การผูกที่ไม่ระบุ `accountId` จะตรงกับบัญชีเริ่มต้นเท่านั้น ไม่ใช่ทุกบัญชี ใช้ `accountId: "*"` สำหรับค่าทดแทนทั้งช่องทาง หรือ `accountId: "<name>"` สำหรับบัญชีหนึ่งบัญชี การเพิ่มการผูกเดิมอีกครั้งพร้อมรหัสบัญชีที่ระบุอย่างชัดเจน จะอัปเกรดการผูกเดิมที่ระบุเฉพาะช่องทางแทนการสร้างรายการซ้ำ

## หลายบัญชี / หลายหมายเลขโทรศัพท์

ช่องทางที่รองรับหลายบัญชี (เช่น WhatsApp) ใช้ `accountId` เพื่อระบุการเข้าสู่ระบบแต่ละครั้ง `accountId` แต่ละรายการจะกำหนดเส้นทางไปยังเอเจนต์ของตนเอง ดังนั้นเซิร์ฟเวอร์หนึ่งเครื่องจึงรองรับหมายเลขโทรศัพท์หลายหมายเลขได้โดยไม่ทำให้เซสชันปะปนกัน

ตั้งค่า `channels.<channel>.defaultAccount` เพื่อเลือกบัญชีที่จะใช้เมื่อไม่ได้ระบุ `accountId` หากไม่ได้ตั้งค่า OpenClaw จะใช้ `default` หากมี มิฉะนั้นจะใช้ id ของบัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)

ช่องทางที่รองรับหลายบัญชี: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `mattermost`, `matrix`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `whatsapp`, `zalo`, `zalouser`

## แนวคิด

- `agentId`: "สมอง" หนึ่งชุด (พื้นที่ทำงาน การยืนยันตัวตนต่อเอเจนต์ และที่เก็บเซสชันต่อเอเจนต์)
- `accountId`: อินสแตนซ์บัญชีช่องทางหนึ่งรายการ (เช่น บัญชี WhatsApp `personal` เทียบกับ `biz`)
- `binding`: กำหนดเส้นทางข้อความขาเข้าไปยัง `agentId` ตาม `(channel, accountId, peer)` และอาจใช้ id ของกิลด์/ทีมด้วย
- แชตโดยตรงจะรวมไปยัง `agent:<agentId>:<mainKey>` ("main" ต่อเอเจนต์; ดู `session.mainKey`)

## ตัวอย่างตามแพลตฟอร์ม

<AccordionGroup>
  <Accordion title="บอต Discord ต่อเอเจนต์">
    บัญชีบอต Discord แต่ละบัญชีจะเชื่อมโยงกับ `accountId` ที่ไม่ซ้ำกัน ผูกแต่ละบัญชีกับเอเจนต์และแยกรายการอนุญาตสำหรับแต่ละบอต

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

    - เชิญบอตแต่ละตัวเข้ากิลด์และเปิดใช้งาน Message Content Intent
    - โทเค็นอยู่ใน `channels.discord.accounts.<id>.token` (บัญชีเริ่มต้นสามารถใช้ `DISCORD_BOT_TOKEN` ได้)

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

    - สร้างบอตหนึ่งตัวต่อเอเจนต์ด้วย BotFather แล้วคัดลอกโทเค็นแต่ละรายการ
    - โทเค็นอยู่ใน `channels.telegram.accounts.<id>.botToken` (บัญชีเริ่มต้นสามารถใช้ `TELEGRAM_BOT_TOKEN` ได้)
    - หากมีบอตหลายตัวในกลุ่ม Telegram เดียวกัน ให้เชิญบอตแต่ละตัวและกล่าวถึงบอตที่ควรตอบ
    - ปิดใช้งาน Privacy Mode ของ BotFather สำหรับบอตแต่ละตัวในกลุ่ม (`/setprivacy` -> Disable) จากนั้นนำบอตออกแล้วเพิ่มกลับเข้าไป เพื่อให้ Telegram นำการตั้งค่าไปใช้
    - อนุญาตกลุ่มด้วย `channels.telegram.groups` หรือใช้ `groupPolicy: "open"` เฉพาะสำหรับการติดตั้งใช้งานในกลุ่มที่เชื่อถือได้
    - ใส่ ID ผู้ใช้ของผู้ส่งใน `groupAllowFrom` ส่วน ID ของกลุ่มและซูเปอร์กรุ๊ปต้องอยู่ใน `channels.telegram.groups` ไม่ใช่ `groupAllowFrom`
    - ผูกตาม `accountId` เพื่อให้บอตแต่ละตัวกำหนดเส้นทางไปยังเอเจนต์ของตนเอง

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

      // การกำหนดเส้นทางแบบแน่นอน: รายการแรกที่ตรงกันจะถูกเลือก (รายการที่เฉพาะเจาะจงที่สุดก่อน)
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // การแทนที่ต่อคู่สนทนาแบบไม่บังคับ (ตัวอย่าง: ส่งกลุ่มที่ระบุไปยังเอเจนต์สำหรับงาน)
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // ปิดเป็นค่าเริ่มต้น: ต้องเปิดใช้งานการส่งข้อความระหว่างเอเจนต์และเพิ่มในรายการอนุญาตอย่างชัดเจน
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

## รูปแบบที่ใช้ทั่วไป

<Tabs>
  <Tab title="WhatsApp สำหรับงานประจำวัน + Telegram สำหรับงานเชิงลึก">
    แยกตามช่องทาง: กำหนดเส้นทาง WhatsApp ไปยังเอเจนต์ที่รวดเร็วสำหรับการใช้งานประจำวัน และ Telegram ไปยังเอเจนต์ Opus

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

    ตัวอย่างเหล่านี้ใช้ `accountId: "*"` เพื่อให้การผูกยังคงทำงานหากเพิ่มบัญชีในภายหลัง หากต้องการกำหนดเส้นทาง DM/กลุ่มรายการเดียวไปยัง Opus โดยให้รายการที่เหลือยังอยู่บนแชต ให้เพิ่มการผูก `match.peer` สำหรับคู่สนทนานั้น — การจับคู่คู่สนทนาจะมีลำดับความสำคัญเหนือกฎระดับช่องทางเสมอ

  </Tab>
  <Tab title="ช่องทางเดียวกัน กำหนดคู่สนทนาหนึ่งรายไปยัง Opus">
    ให้ WhatsApp ยังคงใช้เอเจนต์ที่รวดเร็ว แต่กำหนดเส้นทาง DM หนึ่งรายการไปยัง Opus:

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

    การผูกคู่สนทนาจะมีลำดับความสำคัญเสมอ ดังนั้นให้วางไว้เหนือกฎระดับช่องทาง

  </Tab>
  <Tab title="เอเจนต์ครอบครัวที่ผูกกับกลุ่ม WhatsApp">
    ผูกเอเจนต์เฉพาะสำหรับครอบครัวเข้ากับกลุ่ม WhatsApp หนึ่งกลุ่ม โดยกำหนดให้ต้องกล่าวถึงและใช้นโยบายเครื่องมือที่เข้มงวดยิ่งขึ้น:

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

    รายการอนุญาต/ปฏิเสธเครื่องมือคือ **เครื่องมือ** ไม่ใช่ Skills หาก Skills จำเป็นต้องเรียกใช้ไบนารี ให้ตรวจสอบว่าอนุญาต `exec` และมีไบนารีอยู่ในแซนด์บ็อกซ์ สำหรับการควบคุมที่เข้มงวดยิ่งขึ้น ให้ตั้งค่า `agents.list[].groupChat.mentionPatterns` และเปิดใช้รายการอนุญาตของกลุ่มสำหรับช่องทางไว้

  </Tab>
</Tabs>

## การกำหนดค่าแซนด์บ็อกซ์และเครื่องมือต่อเอเจนต์

แต่ละเอเจนต์สามารถมีข้อจำกัดแซนด์บ็อกซ์และเครื่องมือของตนเองได้:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // ไม่มีแซนด์บ็อกซ์สำหรับเอเจนต์ส่วนตัว
        },
        // ไม่มีข้อจำกัดเครื่องมือ - ใช้งานเครื่องมือทั้งหมดได้
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // ใช้แซนด์บ็อกซ์เสมอ
          scope: "agent",  // หนึ่งคอนเทนเนอร์ต่อเอเจนต์
          docker: {
            // การตั้งค่าครั้งเดียวแบบไม่บังคับหลังสร้างคอนเทนเนอร์
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // เฉพาะเครื่องมืออ่าน
          deny: ["exec", "write", "edit", "apply_patch"],    // ปฏิเสธรายการอื่น
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` อยู่ภายใต้ `sandbox.docker` และทำงานหนึ่งครั้งเมื่อสร้างคอนเทนเนอร์ การแทนที่ `sandbox.docker.*` ต่อเอเจนต์จะถูกละเว้นเมื่อขอบเขตที่ได้คือ `"shared"`
</Note>

สิ่งที่ได้รับ:

- **การแยกเพื่อความปลอดภัย**: จำกัดเครื่องมือสำหรับเอเจนต์ที่ไม่น่าเชื่อถือ
- **การควบคุมทรัพยากร**: ใช้แซนด์บ็อกซ์กับเอเจนต์ที่ระบุโดยให้เอเจนต์อื่นทำงานบนโฮสต์
- **นโยบายที่ยืดหยุ่น**: กำหนดสิทธิ์ที่แตกต่างกันสำหรับแต่ละเอเจนต์

<Note>
`tools.elevated` มีทั้งเกตส่วนกลาง (`tools.elevated.enabled`/`allowFrom`) และเกตต่อเอเจนต์ (`agents.list[].tools.elevated.enabled`/`allowFrom`) เกตต่อเอเจนต์ทำได้เพียงจำกัดเกตส่วนกลางให้เข้มงวดยิ่งขึ้นเท่านั้น — ทั้งสองเกตต้องอนุญาตผู้ส่งจึงจะเรียกใช้คำสั่งที่มีสิทธิ์ระดับสูงได้ สำหรับการกำหนดเป้าหมายในกลุ่ม ให้ใช้ `agents.list[].groupChat.mentionPatterns` เพื่อให้ @mentions จับคู่กับเอเจนต์ที่ต้องการได้อย่างถูกต้อง
</Note>

ดูตัวอย่างโดยละเอียดที่ [แซนด์บ็อกซ์และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)

## เนื้อหาที่เกี่ยวข้อง

- [เอเจนต์ ACP](/th/tools/acp-agents) — การเรียกใช้ชุดเครื่องมือการเขียนโค้ดภายนอก
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — วิธีส่งข้อความไปยังเอเจนต์
- [สถานะการออนไลน์](/th/concepts/presence) — สถานะการออนไลน์และความพร้อมใช้งานของเอเจนต์
- [เซสชัน](/th/concepts/session) — การแยกและการกำหนดเส้นทางเซสชัน
- [เอเจนต์ย่อย](/th/tools/subagents) — การสร้างการทำงานของเอเจนต์ในเบื้องหลัง
