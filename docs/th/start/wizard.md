---
read_when:
    - การรันหรือกำหนดค่า Onboarding แบบ CLI
    - การตั้งค่าเครื่องใหม่
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding แบบ CLI: การตั้งค่าแบบมีผู้แนะนำสำหรับ gateway, workspace, ช่องทางส่งข้อความ และ Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-24T09:34:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 919a4ab57f42f663e98e77c967e08e7ad7afbb193bd048ca1dedc884002d3801
    source_path: start/wizard.md
    workflow: 15
---

Onboarding แบบ CLI เป็นวิธี **ที่แนะนำ** ในการตั้งค่า OpenClaw บน macOS,
Linux หรือ Windows (ผ่าน WSL2; แนะนำอย่างยิ่ง)
โดยจะกำหนดค่า local Gateway หรือการเชื่อมต่อ remote Gateway รวมถึง channels, Skills
และค่าเริ่มต้นของ workspace ภายในโฟลว์แบบมีผู้แนะนำเดียว

```bash
openclaw onboard
```

<Info>
วิธีที่เร็วที่สุดสำหรับแชตแรก: เปิด Control UI (ไม่ต้องตั้งค่าช่องทางส่งข้อความ) รัน
`openclaw dashboard` แล้วแชตในเบราว์เซอร์ เอกสาร: [Dashboard](/th/web/dashboard)
</Info>

หากต้องการกำหนดค่าใหม่ภายหลัง:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` ไม่ได้หมายความว่าเป็นโหมดไม่โต้ตอบโดยอัตโนมัติ สำหรับสคริปต์ ให้ใช้ `--non-interactive`
</Note>

<Tip>
Onboarding แบบ CLI มีขั้นตอนสำหรับการค้นหาเว็บซึ่งคุณสามารถเลือกผู้ให้บริการ
เช่น Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG หรือ Tavily ผู้ให้บริการบางรายต้องใช้
API key ขณะที่บางรายไม่ต้องใช้คีย์ คุณสามารถกำหนดค่านี้ภายหลังได้ด้วย
`openclaw configure --section web` เอกสาร: [Web tools](/th/tools/web)
</Tip>

## QuickStart เทียบกับ Advanced

Onboarding จะเริ่มด้วย **QuickStart** (ค่าเริ่มต้น) เทียบกับ **Advanced** (ควบคุมเต็มรูปแบบ)

<Tabs>
  <Tab title="QuickStart (ค่าเริ่มต้น)">
    - local gateway (loopback)
    - workspace ค่าเริ่มต้น (หรือ workspace ที่มีอยู่)
    - พอร์ต Gateway **18789**
    - การยืนยันตัวตนของ Gateway แบบ **Token** (สร้างอัตโนมัติ แม้อยู่บน loopback)
    - นโยบายเครื่องมือเริ่มต้นสำหรับการตั้งค่าในเครื่องใหม่: `tools.profile: "coding"` (หากมีการตั้งค่าโปรไฟล์แบบ explicit อยู่แล้ว จะคงไว้)
    - ค่าเริ่มต้นของ DM isolation: local onboarding จะเขียน `session.dmScope: "per-channel-peer"` เมื่อยังไม่ได้ตั้งค่า รายละเอียด: [CLI Setup Reference](/th/start/wizard-cli-reference#outputs-and-internals)
    - การเปิดเผยผ่าน Tailscale **ปิด**
    - Telegram + WhatsApp DMs จะใช้ค่าเริ่มต้นเป็น **allowlist** (ระบบจะถามหมายเลขโทรศัพท์ของคุณ)

  </Tab>
  <Tab title="Advanced (ควบคุมเต็มรูปแบบ)">
    - แสดงทุกขั้นตอน (mode, workspace, gateway, channels, daemon, Skills)

  </Tab>
</Tabs>

## สิ่งที่ onboarding กำหนดค่า

**Local mode (ค่าเริ่มต้น)** จะพาคุณผ่านขั้นตอนเหล่านี้:

1. **โมเดล/การยืนยันตัวตน** — เลือกผู้ให้บริการ/โฟลว์การยืนยันตัวตนที่รองรับได้ทุกแบบ (API key, OAuth หรือการยืนยันตัวตนแบบกำหนดเองเฉพาะผู้ให้บริการ) รวมถึง Custom Provider
   (เข้ากันได้กับ OpenAI, เข้ากันได้กับ Anthropic หรือ Unknown auto-detect) เลือกโมเดลเริ่มต้น
   หมายเหตุด้านความปลอดภัย: หากเอเจนต์นี้จะรันเครื่องมือหรือประมวลผลเนื้อหาจาก webhook/hooks ให้เลือกโมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดเท่าที่มี และคงนโยบายเครื่องมือให้เข้มงวด ระดับที่อ่อนกว่าหรือเก่ากว่าจะถูก prompt-inject ได้ง่ายกว่า
   สำหรับการรันแบบไม่โต้ตอบ `--secret-input-mode ref` จะจัดเก็บ env-backed refs ใน auth profiles แทนค่า API key แบบข้อความล้วน
   ในโหมด `ref` แบบไม่โต้ตอบ ต้องตั้งค่า env var ของผู้ให้บริการไว้; การส่งแฟลกคีย์แบบ inline โดยไม่มี env var นั้นจะล้มเหลวทันที
   ในการรันแบบโต้ตอบ การเลือกโหมด secret reference ช่วยให้คุณชี้ไปยังได้ทั้ง environment variable หรือ configured provider ref (`file` หรือ `exec`) พร้อมการตรวจสอบ preflight แบบรวดเร็วก่อนบันทึก
   สำหรับ Anthropic นั้น onboarding/configure แบบโต้ตอบจะเสนอ **Anthropic Claude CLI** เป็นเส้นทางในเครื่องที่แนะนำ และ **Anthropic API key** เป็นเส้นทาง production ที่แนะนำ ส่วน Anthropic setup-token ก็ยังคงพร้อมใช้งานเป็นเส้นทาง token-auth ที่รองรับ
2. **Workspace** — ตำแหน่งสำหรับไฟล์ของเอเจนต์ (ค่าเริ่มต้น `~/.openclaw/workspace`) และจะ seed ไฟล์ bootstrap
3. **Gateway** — พอร์ต, bind address, โหมดยืนยันตัวตน, การเปิดเผยผ่าน Tailscale
   ในโหมด token แบบโต้ตอบ ให้เลือกใช้การจัดเก็บ token แบบข้อความล้วนตามค่าเริ่มต้น หรือเลือกใช้ SecretRef
   เส้นทาง SecretRef สำหรับ token แบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
4. **Channels** — ช่องทางแชตแบบ built-in และ bundled เช่น BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp และอื่นๆ
5. **Daemon** — ติดตั้ง LaunchAgent (macOS), systemd user unit (Linux/WSL2) หรือ Windows Scheduled Task แบบเนทีฟ พร้อม fallback เป็น Startup-folder ต่อผู้ใช้
   หาก token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef การติดตั้ง daemon จะตรวจสอบความถูกต้อง แต่จะไม่ persist token ที่ resolve แล้วลงในข้อมูลเมตาสภาพแวดล้อมของ supervisor service
   หาก token auth ต้องใช้ token และ token SecretRef ที่กำหนดไว้ยัง resolve ไม่ได้ การติดตั้ง daemon จะถูกบล็อกพร้อมคำแนะนำที่ดำเนินการต่อได้
   หากมีทั้ง `gateway.auth.token` และ `gateway.auth.password` ถูกตั้งค่าไว้ และ `gateway.auth.mode` ยังไม่ได้ตั้งค่า การติดตั้ง daemon จะถูกบล็อกจนกว่าจะตั้งค่า mode อย่างชัดเจน
6. **Health check** — เริ่ม Gateway และตรวจสอบว่ากำลังทำงานอยู่
7. **Skills** — ติดตั้ง Skills ที่แนะนำและ dependency เสริมแบบไม่บังคับ

<Note>
การรัน onboarding ซ้ำจะ **ไม่** ลบอะไร เว้นแต่คุณจะเลือก **Reset** อย่างชัดเจน (หรือส่ง `--reset`)
CLI `--reset` ใช้ค่าเริ่มต้นเป็น config, credentials และ sessions; ใช้ `--reset-scope full` เพื่อรวม workspace ด้วย
หาก config ไม่ถูกต้องหรือมีคีย์แบบเดิม ระบบจะขอให้คุณรัน `openclaw doctor` ก่อน
</Note>

**Remote mode** จะกำหนดค่าเฉพาะไคลเอนต์ในเครื่องให้เชื่อมต่อไปยัง Gateway ที่อยู่ที่อื่นเท่านั้น
โดย **ไม่** ติดตั้งหรือเปลี่ยนแปลงอะไรบนโฮสต์ระยะไกล

## เพิ่มเอเจนต์อีกตัว

ใช้ `openclaw agents add <name>` เพื่อสร้างเอเจนต์แยกที่มี workspace,
sessions และ auth profiles ของตัวเอง การรันโดยไม่ระบุ `--workspace` จะเปิด onboarding

สิ่งที่มันตั้งค่า:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

หมายเหตุ:

- workspace ค่าเริ่มต้นจะเป็น `~/.openclaw/workspace-<agentId>`
- เพิ่ม `bindings` เพื่อกำหนดเส้นทางข้อความขาเข้า (onboarding ทำสิ่งนี้ได้)
- แฟลกแบบไม่โต้ตอบ: `--model`, `--agent-dir`, `--bind`, `--non-interactive`

## เอกสารอ้างอิงฉบับเต็ม

สำหรับรายละเอียดการแยกขั้นตอนแบบทีละขั้นและผลลัพธ์ config โปรดดู
[CLI Setup Reference](/th/start/wizard-cli-reference)
สำหรับตัวอย่างแบบไม่โต้ตอบ ดู [CLI Automation](/th/start/wizard-cli-automation)
สำหรับเอกสารอ้างอิงเชิงเทคนิคแบบลึก รวมถึงรายละเอียด RPC ดู
[Onboarding Reference](/th/reference/wizard)

## เอกสารที่เกี่ยวข้อง

- เอกสารอ้างอิงคำสั่ง CLI: [`openclaw onboard`](/th/cli/onboard)
- ภาพรวม Onboarding: [Onboarding Overview](/th/start/onboarding-overview)
- Onboarding ของแอป macOS: [Onboarding](/th/start/onboarding)
- พิธีเริ่มต้นครั้งแรกของเอเจนต์: [Agent Bootstrapping](/th/start/bootstrapping)
