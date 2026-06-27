---
read_when:
    - การเรียกใช้หรือกำหนดค่าการเริ่มต้นใช้งาน CLI
    - การตั้งค่าเครื่องใหม่
sidebarTitle: 'Onboarding: CLI'
summary: 'การเริ่มต้นใช้งาน CLI: การตั้งค่าแบบมีคำแนะนำสำหรับ Gateway, พื้นที่ทำงาน, ช่องทาง และ Skills'
title: การเริ่มต้นใช้งาน (CLI)
x-i18n:
    generated_at: "2026-06-27T18:24:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77bbf3d1f953ea2fca148090377f9537b00b657b2d7201c21aea902800815fd2
    source_path: start/wizard.md
    workflow: 16
---

การเริ่มต้นใช้งานผ่าน CLI เป็นเส้นทางตั้งค่าเทอร์มินัลที่ **แนะนำ** สำหรับ OpenClaw บน
macOS, Linux หรือ Windows ผู้ใช้เดสก์ท็อป Windows สามารถเริ่มต้นด้วย
[Windows Hub](/th/platforms/windows) ได้เช่นกัน
ขั้นตอนนี้จะตั้งค่า Gateway ภายในเครื่องหรือการเชื่อมต่อ Gateway ระยะไกล รวมถึงช่องทาง, Skills,
และค่าเริ่มต้นของเวิร์กสเปซในโฟลว์แนะนำเดียว

```bash
openclaw onboard
```

## ภาษาและภูมิภาค

วิซาร์ด CLI แปลข้อความเริ่มต้นใช้งานแบบคงที่ โดยระบุภาษาและภูมิภาคจาก
`OPENCLAW_LOCALE` จากนั้น `LC_ALL` จากนั้น `LC_MESSAGES` จากนั้น `LANG` และถอยกลับ
เป็นภาษาอังกฤษ ภาษาและภูมิภาคของวิซาร์ดที่รองรับคือ `en`, `zh-CN` และ `zh-TW`

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

ชื่อและตัวระบุที่คงที่ยังคงเป็นข้อความเดิม: `OpenClaw`, `Gateway`, `Tailscale`,
คำสั่ง, คีย์การกำหนดค่า, URL, ID ผู้ให้บริการ, ID โมเดล และป้ายกำกับ Plugin/ช่องทาง
จะไม่ถูกแปล

<Info>
แชตแรกที่เร็วที่สุด: เปิด Control UI (ไม่ต้องตั้งค่าช่องทาง) รัน
`openclaw dashboard` แล้วแชตในเบราว์เซอร์ เอกสาร: [แดชบอร์ด](/th/web/dashboard)
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
การเริ่มต้นใช้งานผ่าน CLI มีขั้นตอนค้นเว็บที่คุณสามารถเลือกผู้ให้บริการ
เช่น Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG หรือ Tavily ได้ ผู้ให้บริการบางรายต้องใช้
API key ขณะที่บางรายไม่ต้องใช้คีย์ คุณยังสามารถกำหนดค่าส่วนนี้ภายหลังได้ด้วย
`openclaw configure --section web` เอกสาร: [เครื่องมือเว็บ](/th/tools/web)
</Tip>

## QuickStart เทียบกับขั้นสูง

การเริ่มต้นใช้งานเริ่มจาก **QuickStart** (ค่าเริ่มต้น) เทียบกับ **ขั้นสูง** (ควบคุมเต็มรูปแบบ)

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Gateway ภายในเครื่อง (loopback)
    - ค่าเริ่มต้นของเวิร์กสเปซ (หรือเวิร์กสเปซที่มีอยู่)
    - พอร์ต Gateway **18789**
    - การยืนยันตัวตนของ Gateway แบบ **Token** (สร้างอัตโนมัติ แม้บน loopback)
    - ค่าเริ่มต้นของนโยบายเครื่องมือสำหรับการตั้งค่าภายในเครื่องใหม่: `tools.profile: "coding"` (โปรไฟล์ที่ระบุไว้แล้วจะถูกเก็บไว้)
    - ค่าเริ่มต้นการแยก DM: การเริ่มต้นใช้งานภายในเครื่องจะเขียน `session.dmScope: "per-channel-peer"` เมื่อยังไม่ได้ตั้งค่า รายละเอียด: [ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals)
    - การเปิดเผยผ่าน Tailscale **ปิด**
    - DM ของ Telegram + WhatsApp ตั้งต้นเป็น **allowlist** (คุณจะถูกถามหมายเลขโทรศัพท์)

  </Tab>
  <Tab title="Advanced (full control)">
    - แสดงทุกขั้นตอน (โหมด, เวิร์กสเปซ, Gateway, ช่องทาง, daemon, Skills)

  </Tab>
</Tabs>

## สิ่งที่การเริ่มต้นใช้งานกำหนดค่า

**โหมดภายในเครื่อง (ค่าเริ่มต้น)** จะแนะนำคุณผ่านขั้นตอนเหล่านี้:

1. **โมเดล/การยืนยันตัวตน** — เลือกผู้ให้บริการ/โฟลว์การยืนยันตัวตนที่รองรับใดก็ได้ (API key, OAuth หรือการยืนยันตัวตนแบบแมนนวลเฉพาะผู้ให้บริการ) รวมถึง Custom Provider
   (เข้ากันได้กับ OpenAI, เข้ากันได้กับ Anthropic หรือ Unknown auto-detect) เลือกโมเดลเริ่มต้น
   หมายเหตุด้านความปลอดภัย: หาก agent นี้จะรันเครื่องมือหรือประมวลผลเนื้อหา webhook/hooks ให้เลือกโมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดเท่าที่มี และตั้งนโยบายเครื่องมือให้เข้มงวด ระดับที่อ่อนกว่า/เก่ากว่าจะถูก prompt-inject ได้ง่ายกว่า
   สำหรับการรันแบบไม่โต้ตอบ `--secret-input-mode ref` จะเก็บ ref ที่อิง env ในโปรไฟล์การยืนยันตัวตนแทนค่าข้อความธรรมดาของ API key
   ในโหมด `ref` แบบไม่โต้ตอบ ต้องตั้งค่าตัวแปร env ของผู้ให้บริการไว้ การส่งแฟล็กคีย์แบบ inline โดยไม่มีตัวแปร env นั้นจะล้มเหลวทันที
   ในการรันแบบโต้ตอบ การเลือกโหมดอ้างอิงความลับจะให้คุณชี้ไปที่ตัวแปรสภาพแวดล้อมหรือ ref ผู้ให้บริการที่กำหนดค่าไว้ (`file` หรือ `exec`) พร้อมการตรวจสอบล่วงหน้าอย่างรวดเร็วก่อนบันทึก
   สำหรับ Anthropic การเริ่มต้นใช้งาน/กำหนดค่าแบบโต้ตอบจะเสนอ **Anthropic Claude CLI** เป็นเส้นทางภายในเครื่องที่แนะนำ และ **Anthropic API key** เป็นเส้นทางสำหรับโปรดักชันที่แนะนำ Anthropic setup-token ยังคงพร้อมใช้งานเป็นเส้นทาง token-auth ที่รองรับเช่นกัน
2. **เวิร์กสเปซ** — ตำแหน่งสำหรับไฟล์ agent (ค่าเริ่มต้น `~/.openclaw/workspace`) เติมไฟล์ bootstrap เริ่มต้น
3. **Gateway** — พอร์ต, ที่อยู่ bind, โหมดการยืนยันตัวตน, การเปิดเผยผ่าน Tailscale
   ในโหมด token แบบโต้ตอบ ให้เลือกการจัดเก็บ token เป็นข้อความธรรมดาตามค่าเริ่มต้น หรือเลือกใช้ SecretRef
   เส้นทาง token SecretRef แบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
4. **ช่องทาง** — ช่องทางแชตในตัวและ Plugin ทางการ เช่น iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp และอื่น ๆ
5. **Daemon** — ติดตั้ง LaunchAgent (macOS), systemd user unit (Linux/WSL2) หรือ Windows Scheduled Task แบบ native พร้อม fallback โฟลเดอร์ Startup รายผู้ใช้
   หากการยืนยันตัวตนด้วย token ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef การติดตั้ง daemon จะตรวจสอบความถูกต้อง แต่จะไม่คงค่า token ที่ resolve แล้วไว้ในเมทาดาทาสภาพแวดล้อมของบริการ supervisor
   หากการยืนยันตัวตนด้วย token ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยัง resolve ไม่ได้ การติดตั้ง daemon จะถูกบล็อกพร้อมคำแนะนำที่นำไปปฏิบัติได้
   หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้ง daemon จะถูกบล็อกจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
6. **ตรวจสุขภาพ** — เริ่ม Gateway และตรวจสอบว่ากำลังทำงานอยู่
7. **Skills** — ติดตั้ง Skills ที่แนะนำและ dependency เสริม

<Note>
การรันการเริ่มต้นใช้งานซ้ำจะ **ไม่** ล้างข้อมูลใด ๆ เว้นแต่คุณจะเลือก **รีเซ็ต** อย่างชัดเจน (หรือส่ง `--reset`)
CLI `--reset` มีค่าเริ่มต้นเป็นการกำหนดค่า, ข้อมูลรับรอง และเซสชัน ใช้ `--reset-scope full` เพื่อรวมเวิร์กสเปซด้วย
หากการกำหนดค่าไม่ถูกต้องหรือมีคีย์ legacy การเริ่มต้นใช้งานจะขอให้คุณรัน `openclaw doctor` ก่อน
</Note>

**โหมดระยะไกล** จะกำหนดค่าเฉพาะไคลเอนต์ภายในเครื่องเพื่อเชื่อมต่อกับ Gateway ที่อื่น
โดยจะ **ไม่** ติดตั้งหรือเปลี่ยนแปลงสิ่งใดบนโฮสต์ระยะไกล

## เพิ่ม agent อีกตัว

ใช้ `openclaw agents add <name>` เพื่อสร้าง agent แยกต่างหากที่มีเวิร์กสเปซ,
เซสชัน และโปรไฟล์การยืนยันตัวตนของตนเอง การรันโดยไม่มี `--workspace` จะเปิดการเริ่มต้นใช้งาน

สิ่งที่ตั้งค่า:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

หมายเหตุ:

- เวิร์กสเปซเริ่มต้นใช้รูปแบบ `~/.openclaw/workspace-<agentId>`
- เพิ่ม `bindings` เพื่อกำหนดเส้นทางข้อความขาเข้า (การเริ่มต้นใช้งานทำสิ่งนี้ได้)
- แฟล็กแบบไม่โต้ตอบ: `--model`, `--agent-dir`, `--bind`, `--non-interactive`

## ข้อมูลอ้างอิงฉบับเต็ม

สำหรับรายละเอียดแบบทีละขั้นตอนและผลลัพธ์การกำหนดค่า โปรดดู
[ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference)
สำหรับตัวอย่างแบบไม่โต้ตอบ โปรดดู [การทำงานอัตโนมัติด้วย CLI](/th/start/wizard-cli-automation)
สำหรับข้อมูลอ้างอิงทางเทคนิคที่ลึกขึ้น รวมถึงรายละเอียด RPC โปรดดู
[ข้อมูลอ้างอิงการเริ่มต้นใช้งาน](/th/reference/wizard)

## เอกสารที่เกี่ยวข้อง

- ข้อมูลอ้างอิงคำสั่ง CLI: [`openclaw onboard`](/th/cli/onboard)
- ภาพรวมการเริ่มต้นใช้งาน: [ภาพรวมการเริ่มต้นใช้งาน](/th/start/onboarding-overview)
- การเริ่มต้นใช้งานแอป macOS: [การเริ่มต้นใช้งาน](/th/start/onboarding)
- พิธีเริ่มรันครั้งแรกของ Agent: [การเตรียม Agent เริ่มต้น](/th/start/bootstrapping)
