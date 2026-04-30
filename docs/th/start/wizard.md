---
read_when:
    - การเรียกใช้หรือกำหนดค่าการเริ่มต้นใช้งาน CLI
    - การตั้งค่าเครื่องใหม่
sidebarTitle: 'Onboarding: CLI'
summary: 'การเริ่มต้นใช้งาน CLI: การตั้งค่าแบบมีคำแนะนำสำหรับ Gateway, พื้นที่ทำงาน, ช่องทาง และ Skills'
title: การเริ่มต้นใช้งาน (CLI)
x-i18n:
    generated_at: "2026-04-30T10:17:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9e9ee3af82ab9f4a1af5d20e3680eb932a9428cb914bbc08c9a2bf83c94ec158
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding เป็นวิธีที่**แนะนำ**สำหรับตั้งค่า OpenClaw บน macOS,
Linux หรือ Windows (ผ่าน WSL2; แนะนำอย่างยิ่ง)
โดยจะกำหนดค่า Gateway ภายในเครื่องหรือการเชื่อมต่อ Gateway ระยะไกล รวมถึงช่องทาง, skills,
และค่าเริ่มต้นของพื้นที่ทำงานในโฟลว์แบบมีคำแนะนำเดียว

```bash
openclaw onboard
```

<Info>
แชตครั้งแรกที่เร็วที่สุด: เปิด Control UI (ไม่ต้องตั้งค่าช่องทาง) รัน
`openclaw dashboard` แล้วแชตในเบราว์เซอร์ เอกสาร: [Dashboard](/th/web/dashboard)
</Info>

หากต้องการกำหนดค่าใหม่ภายหลัง:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` ไม่ได้หมายถึงโหมดไม่โต้ตอบ สำหรับสคริปต์ ให้ใช้ `--non-interactive`
</Note>

<Tip>
CLI onboarding มีขั้นตอนค้นหาเว็บที่คุณสามารถเลือกผู้ให้บริการ
เช่น Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG หรือ Tavily ได้ ผู้ให้บริการบางรายต้องใช้
API key ขณะที่บางรายไม่ต้องใช้ key คุณยังสามารถกำหนดค่านี้ภายหลังด้วย
`openclaw configure --section web` เอกสาร: [เครื่องมือเว็บ](/th/tools/web)
</Tip>

## เริ่มต้นเร็วเทียบกับขั้นสูง

Onboarding เริ่มต้นด้วย **เริ่มต้นเร็ว** (ค่าเริ่มต้น) เทียบกับ **ขั้นสูง** (ควบคุมทั้งหมด)

<Tabs>
  <Tab title="เริ่มต้นเร็ว (ค่าเริ่มต้น)">
    - Gateway ภายในเครื่อง (loopback)
    - ค่าเริ่มต้นของพื้นที่ทำงาน (หรือพื้นที่ทำงานที่มีอยู่)
    - พอร์ต Gateway **18789**
    - การยืนยันตัวตน Gateway **Token** (สร้างอัตโนมัติ แม้บน loopback)
    - ค่าเริ่มต้นของนโยบายเครื่องมือสำหรับการตั้งค่าภายในเครื่องใหม่: `tools.profile: "coding"` (โปรไฟล์ที่ระบุไว้เดิมจะถูกเก็บไว้)
    - ค่าเริ่มต้นการแยก DM: local onboarding เขียน `session.dmScope: "per-channel-peer"` เมื่อยังไม่ได้ตั้งค่า รายละเอียด: [ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals)
    - การเปิดให้เข้าถึงผ่าน Tailscale **ปิด**
    - DM ของ Telegram + WhatsApp ตั้งค่าเริ่มต้นเป็น **allowlist** (ระบบจะถามหมายเลขโทรศัพท์ของคุณ)

  </Tab>
  <Tab title="ขั้นสูง (ควบคุมทั้งหมด)">
    - แสดงทุกขั้นตอน (โหมด, พื้นที่ทำงาน, Gateway, ช่องทาง, daemon, skills)

  </Tab>
</Tabs>

## Onboarding กำหนดค่าอะไรบ้าง

**โหมดภายในเครื่อง (ค่าเริ่มต้น)** จะพาคุณผ่านขั้นตอนเหล่านี้:

1. **โมเดล/การยืนยันตัวตน** — เลือกผู้ให้บริการ/โฟลว์การยืนยันตัวตนที่รองรับใดก็ได้ (API key, OAuth หรือการยืนยันตัวตนด้วยตนเองเฉพาะผู้ให้บริการ) รวมถึง Custom Provider
   (เข้ากันได้กับ OpenAI, เข้ากันได้กับ Anthropic หรือ Unknown auto-detect) เลือกโมเดลเริ่มต้น
   หมายเหตุด้านความปลอดภัย: หาก agent นี้จะรันเครื่องมือหรือประมวลผลเนื้อหา webhook/hooks ให้เลือกโมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่มี และตั้งนโยบายเครื่องมือให้เข้มงวด ระดับที่อ่อนกว่าหรือเก่ากว่าจะถูก prompt-inject ได้ง่ายกว่า
   สำหรับการรันแบบไม่โต้ตอบ `--secret-input-mode ref` จะจัดเก็บ refs ที่อิง env ใน auth profiles แทนค่าข้อความล้วนของ API key
   ในโหมด `ref` แบบไม่โต้ตอบ ต้องตั้งค่า env var ของผู้ให้บริการไว้แล้ว; การส่งแฟล็ก key แบบ inline โดยไม่มี env var นั้นจะล้มเหลวทันที
   ในการรันแบบโต้ตอบ การเลือกโหมดอ้างอิงความลับช่วยให้คุณชี้ไปยังตัวแปรสภาพแวดล้อมหรือ provider ref ที่กำหนดค่าไว้ (`file` หรือ `exec`) พร้อมการตรวจสอบ preflight อย่างรวดเร็วก่อนบันทึก
   สำหรับ Anthropic onboarding/configure แบบโต้ตอบจะเสนอ **Anthropic Claude CLI** เป็นเส้นทางภายในเครื่องที่แนะนำ และ **Anthropic API key** เป็นเส้นทาง production ที่แนะนำ Anthropic setup-token ยังคงพร้อมใช้งานในฐานะเส้นทาง token-auth ที่รองรับด้วย
2. **พื้นที่ทำงาน** — ตำแหน่งสำหรับไฟล์ agent (ค่าเริ่มต้น `~/.openclaw/workspace`) สร้างไฟล์ bootstrap เริ่มต้นให้
3. **Gateway** — พอร์ต, bind address, โหมดการยืนยันตัวตน, การเปิดให้เข้าถึงผ่าน Tailscale
   ในโหมด token แบบโต้ตอบ ให้เลือกการจัดเก็บ token แบบข้อความล้วนเป็นค่าเริ่มต้น หรือเลือกใช้ SecretRef
   เส้นทาง SecretRef ของ token แบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
4. **ช่องทาง** — ช่องทางแชตในตัวและที่รวมมา เช่น BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp และอื่นๆ
5. **Daemon** — ติดตั้ง LaunchAgent (macOS), systemd user unit (Linux/WSL2) หรือ Windows Scheduled Task แบบ native พร้อม fallback ไปยังโฟลเดอร์ Startup ต่อผู้ใช้
   หากการยืนยันตัวตนด้วย token ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef การติดตั้ง daemon จะตรวจสอบความถูกต้อง แต่จะไม่เก็บ token ที่ resolve แล้วลงใน metadata สภาพแวดล้อมของ supervisor service
   หากการยืนยันตัวตนด้วย token ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยัง resolve ไม่ได้ การติดตั้ง daemon จะถูกบล็อกพร้อมคำแนะนำที่นำไปปฏิบัติได้
   หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และยังไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้ง daemon จะถูกบล็อกจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
6. **การตรวจสอบสุขภาพ** — เริ่ม Gateway และตรวจสอบว่ากำลังทำงานอยู่
7. **Skills** — ติดตั้ง skills ที่แนะนำและ dependency ทางเลือก

<Note>
การรัน onboarding ซ้ำจะ**ไม่**ล้างข้อมูลใดๆ เว้นแต่คุณจะเลือก **รีเซ็ต** อย่างชัดเจน (หรือส่ง `--reset`)
CLI `--reset` มีค่าเริ่มต้นเป็น config, credentials และ sessions; ใช้ `--reset-scope full` เพื่อรวมพื้นที่ทำงานด้วย
หาก config ไม่ถูกต้องหรือมี key แบบ legacy onboarding จะขอให้คุณรัน `openclaw doctor` ก่อน
</Note>

**โหมดระยะไกล** จะกำหนดค่าเฉพาะ client ภายในเครื่องให้เชื่อมต่อกับ Gateway ที่อยู่ที่อื่น
โดยจะ**ไม่**ติดตั้งหรือเปลี่ยนแปลงสิ่งใดบนโฮสต์ระยะไกล

## เพิ่ม agent อื่น

ใช้ `openclaw agents add <name>` เพื่อสร้าง agent แยกต่างหากพร้อมพื้นที่ทำงาน,
sessions และ auth profiles ของตัวเอง การรันโดยไม่มี `--workspace` จะเปิด onboarding

สิ่งที่ตั้งค่า:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

หมายเหตุ:

- พื้นที่ทำงานเริ่มต้นจะใช้รูปแบบ `~/.openclaw/workspace-<agentId>`
- เพิ่ม `bindings` เพื่อกำหนดเส้นทางข้อความขาเข้า (onboarding ทำสิ่งนี้ได้)
- แฟล็กแบบไม่โต้ตอบ: `--model`, `--agent-dir`, `--bind`, `--non-interactive`

## ข้อมูลอ้างอิงฉบับเต็ม

สำหรับรายละเอียดทีละขั้นตอนและผลลัพธ์ config โปรดดู
[ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference)
สำหรับตัวอย่างแบบไม่โต้ตอบ โปรดดู [การทำงานอัตโนมัติด้วย CLI](/th/start/wizard-cli-automation)
สำหรับข้อมูลอ้างอิงทางเทคนิคเชิงลึก รวมถึงรายละเอียด RPC โปรดดู
[ข้อมูลอ้างอิง Onboarding](/th/reference/wizard)

## เอกสารที่เกี่ยวข้อง

- ข้อมูลอ้างอิงคำสั่ง CLI: [`openclaw onboard`](/th/cli/onboard)
- ภาพรวม onboarding: [ภาพรวม Onboarding](/th/start/onboarding-overview)
- onboarding ของแอป macOS: [Onboarding](/th/start/onboarding)
- พิธีเริ่มใช้งานครั้งแรกของ agent: [การ Bootstrap Agent](/th/start/bootstrapping)
