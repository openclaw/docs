---
read_when:
    - การเรียกใช้หรือกำหนดค่าการเริ่มต้นใช้งาน CLI
    - การตั้งค่าเครื่องใหม่
sidebarTitle: 'Onboarding: CLI'
summary: 'การเริ่มต้นใช้งาน CLI: การตั้งค่าพร้อมคำแนะนำสำหรับ Gateway, เวิร์กสเปซ, ช่องทาง และ Skills'
title: การเริ่มต้นใช้งาน (CLI)
x-i18n:
    generated_at: "2026-05-06T09:31:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4872c150950a811e5cdb8830fe635886f7c3ed0f1d62352b71be56feda64691
    source_path: start/wizard.md
    workflow: 16
---

การเริ่มต้นใช้งานผ่าน CLI เป็นวิธีที่**แนะนำ**สำหรับการตั้งค่า OpenClaw บน macOS,
Linux หรือ Windows (ผ่าน WSL2; แนะนำอย่างยิ่ง)
กระบวนการนี้จะตั้งค่า Gateway ภายในเครื่องหรือการเชื่อมต่อ Gateway ระยะไกล รวมถึงช่องทาง, Skills,
และค่าเริ่มต้นของ workspace ในโฟลว์แบบมีคำแนะนำเดียว

```bash
openclaw onboard
```

<Info>
แชตแรกที่เร็วที่สุด: เปิด Control UI (ไม่ต้องตั้งค่าช่องทาง) เรียกใช้
`openclaw dashboard` แล้วแชตในเบราว์เซอร์ เอกสาร: [แดชบอร์ด](/th/web/dashboard).
</Info>

หากต้องการตั้งค่าใหม่ภายหลัง:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` ไม่ได้หมายถึงโหมดไม่โต้ตอบ สำหรับสคริปต์ ให้ใช้ `--non-interactive`
</Note>

<Tip>
การเริ่มต้นใช้งานผ่าน CLI มีขั้นตอนค้นหาเว็บที่คุณสามารถเลือกผู้ให้บริการ
เช่น Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG หรือ Tavily ผู้ให้บริการบางรายต้องใช้
API key ขณะที่บางรายไม่ต้องใช้คีย์ คุณยังสามารถตั้งค่านี้ภายหลังได้ด้วย
`openclaw configure --section web` เอกสาร: [เครื่องมือเว็บ](/th/tools/web).
</Tip>

## QuickStart เทียบกับ Advanced

การเริ่มต้นใช้งานเริ่มด้วย **QuickStart** (ค่าเริ่มต้น) เทียบกับ **Advanced** (ควบคุมเต็มรูปแบบ)

<Tabs>
  <Tab title="QuickStart (ค่าเริ่มต้น)">
    - Gateway ภายในเครื่อง (loopback)
    - ค่าเริ่มต้นของ workspace (หรือ workspace ที่มีอยู่)
    - พอร์ต Gateway **18789**
    - การยืนยันตัวตน Gateway แบบ **Token** (สร้างอัตโนมัติ แม้บน loopback)
    - ค่าเริ่มต้นของนโยบายเครื่องมือสำหรับการตั้งค่าภายในเครื่องใหม่: `tools.profile: "coding"` (โปรไฟล์ที่ระบุไว้เดิมจะถูกเก็บไว้)
    - ค่าเริ่มต้นการแยก DM: การเริ่มต้นใช้งานภายในเครื่องจะเขียน `session.dmScope: "per-channel-peer"` เมื่อยังไม่ได้ตั้งค่า รายละเอียด: [ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals)
    - การเปิดเผยผ่าน Tailscale **ปิด**
    - Telegram + WhatsApp DM ตั้งค่าเริ่มต้นเป็น **allowlist** (ระบบจะถามหมายเลขโทรศัพท์ของคุณ)

  </Tab>
  <Tab title="Advanced (ควบคุมเต็มรูปแบบ)">
    - แสดงทุกขั้นตอน (โหมด, workspace, Gateway, ช่องทาง, daemon, Skills)

  </Tab>
</Tabs>

## สิ่งที่การเริ่มต้นใช้งานตั้งค่าให้

**โหมดภายในเครื่อง (ค่าเริ่มต้น)** จะพาคุณผ่านขั้นตอนเหล่านี้:

1. **โมเดล/การยืนยันตัวตน** — เลือกผู้ให้บริการ/โฟลว์การยืนยันตัวตนที่รองรับใดก็ได้ (API key, OAuth หรือการยืนยันตัวตนแบบกำหนดเองเฉพาะผู้ให้บริการ) รวมถึง Custom Provider
   (เข้ากันได้กับ OpenAI, เข้ากันได้กับ Anthropic หรือ Unknown auto-detect) เลือกโมเดลเริ่มต้น
   หมายเหตุด้านความปลอดภัย: หาก agent นี้จะเรียกใช้เครื่องมือหรือประมวลผลเนื้อหา webhook/hooks ให้เลือกโมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่มี และตั้งนโยบายเครื่องมือให้เข้มงวด ระดับที่อ่อนกว่า/เก่ากว่าจะถูก prompt-inject ได้ง่ายกว่า
   สำหรับการรันแบบไม่โต้ตอบ `--secret-input-mode ref` จะเก็บ ref ที่อิง env ไว้ใน auth profiles แทนค่า API key แบบข้อความธรรมดา
   ในโหมด `ref` แบบไม่โต้ตอบ ต้องตั้งค่า env var ของผู้ให้บริการไว้แล้ว; การส่งแฟล็กคีย์แบบ inline โดยไม่มี env var นั้นจะล้มเหลวทันที
   ในการรันแบบโต้ตอบ การเลือกโหมดอ้างอิง secret จะให้คุณชี้ไปยังตัวแปรสภาพแวดล้อมหรือ ref ของผู้ให้บริการที่ตั้งค่าไว้ (`file` หรือ `exec`) พร้อมการตรวจสอบ preflight อย่างรวดเร็วก่อนบันทึก
   สำหรับ Anthropic การเริ่มต้นใช้งาน/ตั้งค่าแบบโต้ตอบจะเสนอ **Anthropic Claude CLI** เป็นเส้นทางภายในเครื่องที่ต้องการ และ **Anthropic API key** เป็นเส้นทางสำหรับ production ที่แนะนำ Anthropic setup-token ยังคงมีให้ใช้เป็นเส้นทาง token-auth ที่รองรับด้วย
2. **Workspace** — ตำแหน่งสำหรับไฟล์ agent (ค่าเริ่มต้น `~/.openclaw/workspace`) เตรียมไฟล์ bootstrap เริ่มต้น
3. **Gateway** — พอร์ต, bind address, โหมดการยืนยันตัวตน, การเปิดเผยผ่าน Tailscale
   ในโหมด token แบบโต้ตอบ ให้เลือกการจัดเก็บ token เป็นข้อความธรรมดาตามค่าเริ่มต้น หรือเลือกใช้ SecretRef
   เส้นทาง SecretRef ของ token แบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
4. **ช่องทาง** — ช่องทางแชตที่มาพร้อมในตัวและที่รวมมาให้ เช่น BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp และอื่น ๆ
5. **Daemon** — ติดตั้ง LaunchAgent (macOS), systemd user unit (Linux/WSL2) หรือ Windows Scheduled Task แบบ native พร้อม fallback เป็น Startup-folder ต่อผู้ใช้
   หากการยืนยันตัวตนด้วย token ต้องใช้ token และ `gateway.auth.token` จัดการด้วย SecretRef การติดตั้ง daemon จะตรวจสอบความถูกต้อง แต่จะไม่เก็บ token ที่ resolve แล้วไว้ใน metadata สภาพแวดล้อมของบริการ supervisor
   หากการยืนยันตัวตนด้วย token ต้องใช้ token และ SecretRef ของ token ที่ตั้งค่าไว้ยัง resolve ไม่ได้ การติดตั้ง daemon จะถูกบล็อกพร้อมคำแนะนำที่ดำเนินการได้
   หากตั้งค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และยังไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้ง daemon จะถูกบล็อกจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
6. **การตรวจสอบสุขภาพ** — เริ่ม Gateway และตรวจสอบว่ากำลังทำงานอยู่
7. **Skills** — ติดตั้ง Skills ที่แนะนำและ dependency แบบไม่บังคับ

<Note>
การรันการเริ่มต้นใช้งานซ้ำจะ**ไม่**ล้างข้อมูลใด ๆ เว้นแต่คุณจะเลือก **Reset** อย่างชัดเจน (หรือส่ง `--reset`)
CLI `--reset` มีค่าเริ่มต้นเป็น config, credentials และ sessions; ใช้ `--reset-scope full` เพื่อรวม workspace
หาก config ไม่ถูกต้องหรือมีคีย์รุ่นเก่า การเริ่มต้นใช้งานจะขอให้คุณรัน `openclaw doctor` ก่อน
</Note>

**โหมดระยะไกล** จะตั้งค่าเฉพาะไคลเอนต์ภายในเครื่องให้เชื่อมต่อกับ Gateway ที่อยู่ที่อื่น
โหมดนี้**จะไม่**ติดตั้งหรือเปลี่ยนแปลงสิ่งใดบนโฮสต์ระยะไกล

## เพิ่ม agent อีกตัว

ใช้ `openclaw agents add <name>` เพื่อสร้าง agent แยกต่างหากที่มี workspace,
sessions และ auth profiles ของตัวเอง การรันโดยไม่มี `--workspace` จะเปิดการเริ่มต้นใช้งาน

สิ่งที่ตั้งค่า:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

หมายเหตุ:

- workspace เริ่มต้นจะเป็นไปตาม `~/.openclaw/workspace-<agentId>`
- เพิ่ม `bindings` เพื่อ route ข้อความขาเข้า (การเริ่มต้นใช้งานทำสิ่งนี้ได้)
- แฟล็กแบบไม่โต้ตอบ: `--model`, `--agent-dir`, `--bind`, `--non-interactive`

## ข้อมูลอ้างอิงฉบับเต็ม

สำหรับรายละเอียดทีละขั้นตอนและผลลัพธ์ config โปรดดู
[ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference).
สำหรับตัวอย่างแบบไม่โต้ตอบ โปรดดู [การทำงานอัตโนมัติของ CLI](/th/start/wizard-cli-automation).
สำหรับข้อมูลอ้างอิงทางเทคนิคเชิงลึก รวมถึงรายละเอียด RPC โปรดดู
[ข้อมูลอ้างอิงการเริ่มต้นใช้งาน](/th/reference/wizard).

## เอกสารที่เกี่ยวข้อง

- ข้อมูลอ้างอิงคำสั่ง CLI: [`openclaw onboard`](/th/cli/onboard)
- ภาพรวมการเริ่มต้นใช้งาน: [ภาพรวมการเริ่มต้นใช้งาน](/th/start/onboarding-overview)
- การเริ่มต้นใช้งานแอป macOS: [การเริ่มต้นใช้งาน](/th/start/onboarding)
- พิธีการรันครั้งแรกของ agent: [การ bootstrap agent](/th/start/bootstrapping)
