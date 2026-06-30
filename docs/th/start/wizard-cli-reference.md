---
read_when:
    - คุณต้องการรายละเอียดพฤติกรรมสำหรับ openclaw onboard
    - คุณกำลังดีบักผลลัพธ์การเริ่มต้นใช้งานหรือผสานรวมไคลเอนต์การเริ่มต้นใช้งาน
sidebarTitle: CLI reference
summary: ข้อมูลอ้างอิงฉบับสมบูรณ์สำหรับขั้นตอนการตั้งค่า CLI, การตั้งค่าการยืนยันตัวตน/โมเดล, เอาต์พุต และกลไกภายใน
title: ข้อมูลอ้างอิงการตั้งค่า CLI
x-i18n:
    generated_at: "2026-06-30T22:40:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be3e95a300707eade19f5c7fdf6f3a330ffe7e1e83866b36fb9bd1f742256ef
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

หน้านี้เป็นเอกสารอ้างอิงฉบับเต็มสำหรับ `openclaw onboard`
สำหรับคู่มือแบบสั้น โปรดดู [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)

## วิซาร์ดทำอะไรบ้าง

โหมดภายในเครื่อง (ค่าเริ่มต้น) จะแนะนำคุณผ่านขั้นตอนต่อไปนี้:

- การตั้งค่าโมเดลและ auth (OpenAI Code subscription OAuth, Anthropic Claude CLI หรือ API key รวมถึงตัวเลือก MiniMax, GLM, Ollama, Moonshot, StepFun และ AI Gateway)
- ตำแหน่งเวิร์กสเปซและไฟล์บูตสแตรป
- การตั้งค่า Gateway (พอร์ต, bind, auth, Tailscale)
- ช่องทางและผู้ให้บริการ (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage และ Plugin ช่องทางแบบบันเดิลอื่น ๆ)
- การติดตั้ง daemon (LaunchAgent, systemd user unit หรือ Windows Scheduled Task แบบเนทีฟพร้อม fallback เป็นโฟลเดอร์ Startup)
- การตรวจสอบสถานะ
- การตั้งค่า Skills

โหมดรีโมตกำหนดค่าเครื่องนี้ให้เชื่อมต่อกับ gateway ที่อื่น
โหมดนี้จะไม่ติดตั้งหรือแก้ไขสิ่งใดบนโฮสต์รีโมต

## รายละเอียดโฟลว์ภายในเครื่อง

<Steps>
  <Step title="Existing config detection">
    - หากมี `~/.openclaw/openclaw.json` อยู่แล้ว ให้เลือก Keep, Modify หรือ Reset
    - การเรียกใช้วิซาร์ดซ้ำจะไม่ลบสิ่งใด เว้นแต่คุณจะเลือก Reset อย่างชัดเจน (หรือส่ง `--reset`)
    - CLI `--reset` มีค่าเริ่มต้นเป็น `config+creds+sessions`; ใช้ `--reset-scope full` เพื่อลบเวิร์กสเปซด้วย
    - หาก config ไม่ถูกต้องหรือมีคีย์รุ่นเก่า วิซาร์ดจะหยุดและขอให้คุณเรียกใช้ `openclaw doctor` ก่อนดำเนินการต่อ
    - Reset ใช้ `trash` และเสนอสโคปดังนี้:
      - เฉพาะ config
      - Config + ข้อมูลรับรอง + เซสชัน
      - รีเซ็ตทั้งหมด (ลบเวิร์กสเปซด้วย)

  </Step>
  <Step title="Model and auth">
    - เมทริกซ์ตัวเลือกทั้งหมดอยู่ใน [ตัวเลือก auth และโมเดล](#auth-and-model-options)

  </Step>
  <Step title="Workspace">
    - ค่าเริ่มต้น `~/.openclaw/workspace` (กำหนดค่าได้)
    - เตรียมไฟล์เวิร์กสเปซที่จำเป็นสำหรับพิธีบูตสแตรปเมื่อเรียกใช้ครั้งแรก
    - โครงสร้างเวิร์กสเปซ: [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - ถามค่าพอร์ต, bind, โหมด auth และการเปิดผ่าน Tailscale
    - แนะนำ: เปิด token auth ไว้แม้ใช้กับ loopback เพื่อให้ไคลเอนต์ WS ภายในเครื่องต้องยืนยันตัวตน
    - ในโหมด token การตั้งค่าแบบโต้ตอบมีตัวเลือก:
      - **สร้าง/จัดเก็บ token เป็น plaintext** (ค่าเริ่มต้น)
      - **ใช้ SecretRef** (เลือกใช้เอง)
    - ในโหมด password การตั้งค่าแบบโต้ตอบรองรับการจัดเก็บแบบ plaintext หรือ SecretRef ด้วย
    - เส้นทาง SecretRef ของ token แบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
      - ต้องมีตัวแปรสภาพแวดล้อมที่ไม่ว่างในสภาพแวดล้อมของกระบวนการ onboarding
      - ใช้ร่วมกับ `--gateway-token` ไม่ได้
    - ปิด auth เฉพาะเมื่อคุณเชื่อถือทุกกระบวนการภายในเครื่องอย่างสมบูรณ์
    - การ bind ที่ไม่ใช่ loopback ยังต้องใช้ auth

  </Step>
  <Step title="Channels">
    - [WhatsApp](/th/channels/whatsapp): เข้าสู่ระบบด้วย QR แบบไม่บังคับ
    - [Telegram](/th/channels/telegram): bot token
    - [Discord](/th/channels/discord): bot token
    - [Google Chat](/th/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/th/channels/mattermost): bot token + base URL
    - [Signal](/th/channels/signal): ติดตั้ง `signal-cli` แบบไม่บังคับ + config บัญชี
    - [iMessage](/th/channels/imessage): พาธ CLI `imsg` + การเข้าถึง Messages DB; ใช้ SSH wrapper เมื่อ Gateway ทำงานอยู่นอกเครื่อง Mac
    - ความปลอดภัยของ DM: ค่าเริ่มต้นคือการจับคู่ DM แรกจะส่งรหัส อนุมัติผ่าน
      `openclaw pairing approve <channel> <code>` หรือใช้ allowlists
  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - ต้องมีเซสชันผู้ใช้ที่ล็อกอินอยู่; สำหรับ headless ให้ใช้ LaunchDaemon แบบกำหนดเอง (ไม่ได้จัดส่งมาด้วย)
    - Linux และ Windows ผ่าน WSL2: systemd user unit
      - วิซาร์ดจะพยายามเรียก `loginctl enable-linger <user>` เพื่อให้ gateway ยังทำงานต่อหลังออกจากระบบ
      - อาจขอ sudo (เขียนไปที่ `/var/lib/systemd/linger`); จะลองโดยไม่ใช้ sudo ก่อน
    - Windows แบบเนทีฟ: ใช้ Scheduled Task ก่อน
      - หากการสร้าง task ถูกปฏิเสธ OpenClaw จะ fallback ไปเป็นรายการล็อกอินในโฟลเดอร์ Startup รายผู้ใช้และเริ่ม gateway ทันที
      - Scheduled Tasks ยังเป็นตัวเลือกที่แนะนำ เพราะให้สถานะตัวควบคุมการทำงานที่ดีกว่า
    - การเลือกรันไทม์: Node (แนะนำ; จำเป็นสำหรับ WhatsApp และ Telegram) ไม่แนะนำให้ใช้ Bun

  </Step>
  <Step title="Health check">
    - เริ่ม gateway (หากจำเป็น) และเรียกใช้ `openclaw health`
    - `openclaw status --deep` เพิ่มการตรวจสุขภาพ live gateway ลงในเอาต์พุตสถานะ รวมถึงการ probe ช่องทางเมื่อรองรับ

  </Step>
  <Step title="Skills">
    - อ่าน skills ที่มีอยู่และตรวจสอบข้อกำหนด
    - ให้คุณเลือกตัวจัดการ node: npm, pnpm หรือ bun
    - ติดตั้ง dependency แบบไม่บังคับ (บางรายการใช้ Homebrew บน macOS)

  </Step>
  <Step title="Finish">
    - สรุปและขั้นตอนถัดไป รวมถึงตัวเลือกแอป iOS, Android และ macOS

  </Step>
</Steps>

<Note>
หากตรวจไม่พบ GUI วิซาร์ดจะพิมพ์คำแนะนำ SSH port-forward สำหรับ Control UI แทนการเปิดเบราว์เซอร์
หากไม่มี asset ของ Control UI วิซาร์ดจะพยายาม build asset เหล่านั้น; fallback คือ `pnpm ui:build` (ติดตั้ง dependency ของ UI อัตโนมัติ)
</Note>

## รายละเอียดโหมดรีโมต

โหมดรีโมตกำหนดค่าเครื่องนี้ให้เชื่อมต่อกับ gateway ที่อื่น

<Info>
โหมดรีโมตจะไม่ติดตั้งหรือแก้ไขสิ่งใดบนโฮสต์รีโมต
</Info>

สิ่งที่คุณตั้งค่า:

- URL ของ remote gateway (`ws://...`)
- Token หาก remote gateway ต้องใช้ auth (แนะนำ)

<Note>
- หาก gateway เป็นแบบ loopback-only ให้ใช้ SSH tunneling หรือ tailnet
- คำใบ้สำหรับการค้นหา:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## ตัวเลือก auth และโมเดล

<AccordionGroup>
  <Accordion title="Anthropic API key">
    ใช้ `ANTHROPIC_API_KEY` หากมีอยู่ หรือถาม key จากนั้นบันทึกไว้สำหรับการใช้งาน daemon
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    โฟลว์ผ่านเบราว์เซอร์; วาง `code#state`

    ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` ผ่านรันไทม์ Codex เมื่อยังไม่ได้ตั้งโมเดลหรือเป็นตระกูล OpenAI อยู่แล้ว

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    โฟลว์จับคู่ผ่านเบราว์เซอร์ด้วย device code อายุสั้น

    ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` ผ่านรันไทม์ Codex เมื่อยังไม่ได้ตั้งโมเดลหรือเป็นตระกูล OpenAI อยู่แล้ว

  </Accordion>
  <Accordion title="OpenAI API key">
    ใช้ `OPENAI_API_KEY` หากมีอยู่ หรือถาม key จากนั้นจัดเก็บข้อมูลรับรองใน auth profiles

    ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` เมื่อยังไม่ได้ตั้งโมเดล, เป็น `openai/*` หรือเป็น legacy Codex model refs

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    การลงชื่อเข้าใช้ผ่านเบราว์เซอร์สำหรับบัญชี SuperGrok หรือ X Premium ที่มีสิทธิ์ นี่คือ
    เส้นทาง xAI ที่แนะนำสำหรับผู้ใช้ส่วนใหญ่ OpenClaw จะจัดเก็บ auth
    profile ที่ได้สำหรับโมเดล Grok, Grok `web_search`, `x_search` และ `code_execution`
  </Accordion>
  <Accordion title="xAI (Grok) device code">
    การลงชื่อเข้าใช้ผ่านเบราว์เซอร์ที่เหมาะกับรีโมต โดยใช้รหัสสั้นแทน localhost
    callback ใช้ตัวเลือกนี้จากโฮสต์ SSH, Docker หรือ VPS
  </Accordion>
  <Accordion title="xAI (Grok) API key">
    ถามค่า `XAI_API_KEY` และกำหนดค่า xAI เป็นผู้ให้บริการโมเดล ใช้ตัวเลือกนี้
    เมื่อคุณต้องการ xAI Console API key แทน subscription OAuth
  </Accordion>
  <Accordion title="OpenCode">
    ถามค่า `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) และให้คุณเลือกแคตตาล็อก Zen หรือ Go
    URL การตั้งค่า: [opencode.ai/auth](https://opencode.ai/auth)
  </Accordion>
  <Accordion title="API key (generic)">
    จัดเก็บ key ให้คุณ
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    ถามค่า `AI_GATEWAY_API_KEY`
    รายละเอียดเพิ่มเติม: [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    ถามค่า account ID, gateway ID และ `CLOUDFLARE_AI_GATEWAY_API_KEY`
    รายละเอียดเพิ่มเติม: [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
  </Accordion>
  <Accordion title="MiniMax">
    Config จะถูกเขียนให้อัตโนมัติ ค่าเริ่มต้นแบบ hosted คือ `MiniMax-M3`; การตั้งค่าด้วย API-key ใช้
    `minimax/...` และการตั้งค่าด้วย OAuth ใช้ `minimax-portal/...`
    รายละเอียดเพิ่มเติม: [MiniMax](/th/providers/minimax)
  </Accordion>
  <Accordion title="StepFun">
    Config จะถูกเขียนให้อัตโนมัติสำหรับ StepFun standard หรือ Step Plan บน endpoint ของจีนหรือทั่วโลก
    Standard ปัจจุบันมี `step-3.5-flash` และ Step Plan ยังมี `step-3.5-flash-2603`
    รายละเอียดเพิ่มเติม: [StepFun](/th/providers/stepfun)
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    ถามค่า `SYNTHETIC_API_KEY`
    รายละเอียดเพิ่มเติม: [Synthetic](/th/providers/synthetic)
  </Accordion>
  <Accordion title="Ollama (Cloud and local open models)">
    ถามให้เลือก `Cloud + Local`, `Cloud only` หรือ `Local only` ก่อน
    `Cloud only` ใช้ `OLLAMA_API_KEY` กับ `https://ollama.com`
    โหมดที่มีโฮสต์รองรับจะถาม base URL (ค่าเริ่มต้น `http://127.0.0.1:11434`), ค้นหาโมเดลที่มีอยู่ และแนะนำค่าเริ่มต้น
    `Cloud + Local` ยังตรวจสอบด้วยว่าโฮสต์ Ollama นั้นได้ลงชื่อเข้าใช้เพื่อเข้าถึง cloud แล้วหรือไม่
    รายละเอียดเพิ่มเติม: [Ollama](/th/providers/ollama)
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    Config ของ Moonshot (Kimi K2) และ Kimi Coding จะถูกเขียนให้อัตโนมัติ
    รายละเอียดเพิ่มเติม: [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
  </Accordion>
  <Accordion title="Custom provider">
    ทำงานกับ endpoint ที่เข้ากันได้กับ OpenAI และ Anthropic

    Onboarding แบบโต้ตอบรองรับตัวเลือกการจัดเก็บ API key เหมือนกับโฟลว์ API key ของผู้ให้บริการอื่น:
    - **วาง API key ตอนนี้** (plaintext)
    - **ใช้การอ้างอิง secret** (env ref หรือ provider ref ที่กำหนดค่าไว้ พร้อมการตรวจสอบ preflight)

    แฟล็กแบบไม่โต้ตอบ:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (ไม่บังคับ; fallback เป็น `CUSTOM_API_KEY`)
    - `--custom-provider-id` (ไม่บังคับ)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (ไม่บังคับ; ค่าเริ่มต้น `openai`)
    - `--custom-image-input` / `--custom-text-input` (ไม่บังคับ; override ความสามารถอินพุตของโมเดลที่อนุมานได้)

  </Accordion>
  <Accordion title="Skip">
    ปล่อยให้ auth ยังไม่ได้กำหนดค่า
  </Accordion>
</AccordionGroup>

พฤติกรรมของโมเดล:

- เลือกโมเดลเริ่มต้นจากตัวเลือกที่ตรวจพบ หรือป้อนผู้ให้บริการและโมเดลด้วยตนเอง
- Onboarding ของ custom-provider จะอนุมานการรองรับรูปภาพสำหรับ model ID ทั่วไป และถามเฉพาะเมื่อไม่รู้จักชื่อโมเดล
- เมื่อ onboarding เริ่มจากตัวเลือก auth ของผู้ให้บริการ ตัวเลือกโมเดลจะให้ความสำคัญกับ
  ผู้ให้บริการนั้นโดยอัตโนมัติ สำหรับ Volcengine และ BytePlus ความต้องการเดียวกัน
  จะจับคู่กับ variant ของ coding-plan ด้วย (`volcengine-plan/*`,
  `byteplus-plan/*`)
- หากตัวกรอง preferred-provider นั้นไม่มีผลลัพธ์ ตัวเลือกจะ fallback ไปยัง
  แคตตาล็อกทั้งหมดแทนการไม่แสดงโมเดลใด ๆ
- วิซาร์ดเรียกใช้การตรวจสอบโมเดลและเตือนหากโมเดลที่กำหนดค่าไว้ไม่รู้จักหรือไม่มี auth

พาธข้อมูลรับรองและ profile:

- Auth profiles (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- การนำเข้า legacy OAuth: `~/.openclaw/credentials/oauth.json`

โหมดจัดเก็บข้อมูลรับรอง:

- พฤติกรรมการเริ่มต้นใช้งานเริ่มต้นจะบันทึก API keys เป็นค่าข้อความธรรมดาในโปรไฟล์การยืนยันตัวตน
- `--secret-input-mode ref` เปิดใช้โหมดอ้างอิงแทนการจัดเก็บคีย์แบบข้อความธรรมดา
  ในการตั้งค่าแบบโต้ตอบ คุณสามารถเลือกอย่างใดอย่างหนึ่งได้:
  - การอ้างอิงตัวแปรสภาพแวดล้อม (เช่น `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - การอ้างอิงผู้ให้บริการที่กำหนดค่าไว้ (`file` หรือ `exec`) พร้อมนามแฝงผู้ให้บริการ + id
- โหมดอ้างอิงแบบโต้ตอบจะเรียกใช้การตรวจสอบ preflight อย่างรวดเร็วก่อนบันทึก
  - การอ้างอิง Env: ตรวจสอบชื่อตัวแปร + ค่าที่ไม่ว่างในสภาพแวดล้อมการเริ่มต้นใช้งานปัจจุบัน
  - การอ้างอิงผู้ให้บริการ: ตรวจสอบการกำหนดค่าผู้ให้บริการและแปลง id ที่ร้องขอ
  - หาก preflight ล้มเหลว การเริ่มต้นใช้งานจะแสดงข้อผิดพลาดและให้คุณลองใหม่
- ในโหมดไม่โต้ตอบ `--secret-input-mode ref` รองรับด้วย env เท่านั้น
  - ตั้งค่า env var ของผู้ให้บริการในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน
  - แฟล็กคีย์แบบอินไลน์ (เช่น `--openai-api-key`) ต้องมีการตั้งค่า env var นั้น มิฉะนั้นการเริ่มต้นใช้งานจะล้มเหลวทันที
  - สำหรับผู้ให้บริการแบบกำหนดเอง โหมด `ref` แบบไม่โต้ตอบจะจัดเก็บ `models.providers.<id>.apiKey` เป็น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`
  - ในกรณีผู้ให้บริการแบบกำหนดเองนั้น `--custom-api-key` ต้องมีการตั้งค่า `CUSTOM_API_KEY` มิฉะนั้นการเริ่มต้นใช้งานจะล้มเหลวทันที
- ข้อมูลประจำตัวการยืนยันตัวตนของ Gateway รองรับตัวเลือกข้อความธรรมดาและ SecretRef ในการตั้งค่าแบบโต้ตอบ:
  - โหมดโทเค็น: **สร้าง/จัดเก็บโทเค็นข้อความธรรมดา** (ค่าเริ่มต้น) หรือ **ใช้ SecretRef**
  - โหมดรหัสผ่าน: ข้อความธรรมดาหรือ SecretRef
- เส้นทาง SecretRef ของโทเค็นแบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
- การตั้งค่าข้อความธรรมดาที่มีอยู่ยังคงทำงานได้โดยไม่เปลี่ยนแปลง

<Note>
เคล็ดลับสำหรับ headless และเซิร์ฟเวอร์: ทำ OAuth ให้เสร็จบนเครื่องที่มีเบราว์เซอร์ แล้วคัดลอก
`auth-profiles.json` ของ agent นั้น (เช่น
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` หรือเส้นทางที่ตรงกัน
ของ `$OPENCLAW_STATE_DIR/...`) ไปยังโฮสต์ Gateway `credentials/oauth.json`
เป็นเพียงแหล่งนำเข้าแบบเดิมเท่านั้น
</Note>

## เอาต์พุตและภายในระบบ

ฟิลด์ทั่วไปใน `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` เมื่อส่ง `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (หากเลือก Minimax)
- `tools.profile` (การเริ่มต้นใช้งานภายในเครื่องจะใช้ค่าเริ่มต้นเป็น `"coding"` เมื่อยังไม่ได้ตั้งค่า; ค่าที่กำหนดไว้อย่างชัดเจนอยู่แล้วจะถูกเก็บไว้)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (การเริ่มต้นใช้งานภายในเครื่องจะใช้ค่าเริ่มต้นเป็น `per-channel-peer` เมื่อยังไม่ได้ตั้งค่า; ค่าที่กำหนดไว้อย่างชัดเจนอยู่แล้วจะถูกเก็บไว้)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- allowlist ของช่องทาง (Slack, Discord, Matrix, Microsoft Teams) เมื่อคุณเลือกใช้ระหว่างพรอมป์ (ชื่อจะถูกแปลงเป็น ID เมื่อทำได้)
- `skills.install.nodeManager`
  - แฟล็ก `setup --node-manager` รับ `npm`, `pnpm` หรือ `bun`
  - การกำหนดค่าด้วยตนเองยังสามารถตั้งค่า `skills.install.nodeManager: "yarn"` ได้ในภายหลัง
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` เขียน `agents.list[]` และ `bindings` ที่เป็นทางเลือก

ข้อมูลประจำตัวของ WhatsApp จะอยู่ใต้ `~/.openclaw/credentials/whatsapp/<accountId>/`
เซสชันจะถูกจัดเก็บใต้ `~/.openclaw/agents/<agentId>/sessions/`

<Note>
บางช่องทางถูกส่งมอบเป็น plugins เมื่อเลือกระหว่างการตั้งค่า วิซาร์ด
จะพรอมป์ให้ติดตั้ง plugin (npm หรือเส้นทางภายในเครื่อง) ก่อนการกำหนดค่าช่องทาง
</Note>

RPC ของวิซาร์ด Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

ไคลเอนต์ (แอป macOS และ Control UI) สามารถแสดงผลขั้นตอนได้โดยไม่ต้องนำตรรกะการเริ่มต้นใช้งานไปสร้างใหม่

พฤติกรรมการตั้งค่า Signal:

- ดาวน์โหลด release asset ที่เหมาะสม
- จัดเก็บไว้ใต้ `~/.openclaw/tools/signal-cli/<version>/`
- เขียน `channels.signal.cliPath` ใน config
- บิลด์ JVM ต้องใช้ Java 21
- ใช้บิลด์ Native เมื่อมีให้ใช้งาน
- Windows ใช้ WSL2 และทำตามโฟลว์ signal-cli ของ Linux ภายใน WSL

## เอกสารที่เกี่ยวข้อง

- ศูนย์กลางการเริ่มต้นใช้งาน: [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
- ระบบอัตโนมัติและสคริปต์: [ระบบอัตโนมัติของ CLI](/th/start/wizard-cli-automation)
- อ้างอิงคำสั่ง: [`openclaw onboard`](/th/cli/onboard)
