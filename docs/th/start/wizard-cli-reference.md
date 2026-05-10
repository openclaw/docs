---
read_when:
    - คุณต้องมีรายละเอียดพฤติกรรมสำหรับ openclaw onboard
    - คุณกำลังดีบักผลลัพธ์ของการเริ่มต้นใช้งานหรือผสานรวมไคลเอนต์การเริ่มต้นใช้งาน
sidebarTitle: CLI reference
summary: เอกสารอ้างอิงฉบับสมบูรณ์สำหรับขั้นตอนการตั้งค่า CLI, การตั้งค่าการยืนยันตัวตน/โมเดล, ผลลัพธ์ และกลไกภายใน
title: ข้อมูลอ้างอิงการตั้งค่า CLI
x-i18n:
    generated_at: "2026-05-10T19:58:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9166e8763c1ee1884817a9625a035b7efa1a97a1d4d4e4dffc1926675b1d3214
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

หน้านี้เป็นเอกสารอ้างอิงฉบับเต็มสำหรับ `openclaw onboard`
สำหรับคู่มือแบบสั้น โปรดดู [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)

## วิซาร์ดทำอะไร

โหมดภายในเครื่อง (ค่าเริ่มต้น) จะพาคุณดำเนินการผ่าน:

- การตั้งค่าโมเดลและการยืนยันตัวตน (OAuth สำหรับการสมัครสมาชิก OpenAI Code, Anthropic Claude CLI หรือ API key รวมถึงตัวเลือก MiniMax, GLM, Ollama, Moonshot, StepFun และ AI Gateway)
- ตำแหน่งเวิร์กสเปซและไฟล์บูตสแตรป
- การตั้งค่า Gateway (พอร์ต, bind, การยืนยันตัวตน, Tailscale)
- ช่องทางและผู้ให้บริการ (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage และ Plugin ช่องทางที่รวมมาให้อื่น ๆ)
- การติดตั้งดีมอน (LaunchAgent, systemd user unit หรือ Windows Scheduled Task แบบเนทีฟพร้อม fallback เป็นโฟลเดอร์ Startup)
- การตรวจสุขภาพ
- การตั้งค่า Skills

โหมดระยะไกลจะกำหนดค่าเครื่องนี้ให้เชื่อมต่อกับ Gateway ที่อื่น
โหมดนี้จะไม่ติดตั้งหรือแก้ไขสิ่งใดบนโฮสต์ระยะไกล

## รายละเอียดโฟลว์ภายในเครื่อง

<Steps>
  <Step title="Existing config detection">
    - หากมี `~/.openclaw/openclaw.json` อยู่ ให้เลือก Keep, Modify หรือ Reset
    - การรันวิซาร์ดซ้ำจะไม่ล้างสิ่งใด เว้นแต่คุณจะเลือก Reset อย่างชัดเจน (หรือส่ง `--reset`)
    - CLI `--reset` มีค่าเริ่มต้นเป็น `config+creds+sessions`; ใช้ `--reset-scope full` เพื่อลบเวิร์กสเปซด้วย
    - หากคอนฟิกไม่ถูกต้องหรือมีคีย์แบบเก่า วิซาร์ดจะหยุดและขอให้คุณรัน `openclaw doctor` ก่อนดำเนินการต่อ
    - Reset ใช้ `trash` และเสนอสโคปดังนี้:
      - คอนฟิกเท่านั้น
      - คอนฟิก + ข้อมูลรับรอง + เซสชัน
      - รีเซ็ตทั้งหมด (ลบเวิร์กสเปซด้วย)

  </Step>
  <Step title="Model and auth">
    - ตารางตัวเลือกทั้งหมดอยู่ใน [ตัวเลือกการยืนยันตัวตนและโมเดล](#auth-and-model-options)

  </Step>
  <Step title="Workspace">
    - ค่าเริ่มต้น `~/.openclaw/workspace` (กำหนดค่าได้)
    - สร้างไฟล์เริ่มต้นในเวิร์กสเปซที่จำเป็นสำหรับพิธีบูตสแตรปในการรันครั้งแรก
    - โครงสร้างเวิร์กสเปซ: [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - ถามพอร์ต, bind, โหมดการยืนยันตัวตน และการเปิดเผยผ่าน Tailscale
    - แนะนำ: เปิดใช้การยืนยันตัวตนด้วยโทเค็นไว้ แม้สำหรับ loopback เพื่อให้ไคลเอนต์ WS ภายในเครื่องต้องยืนยันตัวตน
    - ในโหมดโทเค็น การตั้งค่าแบบอินเทอร์แอคทีฟเสนอตัวเลือก:
      - **สร้าง/จัดเก็บโทเค็นแบบข้อความธรรมดา** (ค่าเริ่มต้น)
      - **ใช้ SecretRef** (เลือกใช้)
    - ในโหมดรหัสผ่าน การตั้งค่าแบบอินเทอร์แอคทีฟยังรองรับการจัดเก็บแบบข้อความธรรมดาหรือ SecretRef
    - เส้นทาง SecretRef ของโทเค็นแบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
      - ต้องมีตัวแปรสภาพแวดล้อมที่ไม่ว่างในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน
      - ใช้ร่วมกับ `--gateway-token` ไม่ได้
    - ปิดการยืนยันตัวตนเฉพาะเมื่อคุณเชื่อถือทุกกระบวนการภายในเครื่องอย่างเต็มที่
    - การ bind ที่ไม่ใช่ loopback ยังคงต้องใช้การยืนยันตัวตน

  </Step>
  <Step title="Channels">
    - [WhatsApp](/th/channels/whatsapp): การเข้าสู่ระบบด้วย QR ที่เลือกใช้ได้
    - [Telegram](/th/channels/telegram): โทเค็นบอท
    - [Discord](/th/channels/discord): โทเค็นบอท
    - [Google Chat](/th/channels/googlechat): JSON ของ service account + กลุ่มเป้าหมาย Webhook
    - [Mattermost](/th/channels/mattermost): โทเค็นบอท + URL ฐาน
    - [Signal](/th/channels/signal): การติดตั้ง `signal-cli` ที่เลือกใช้ได้ + คอนฟิกบัญชี
    - [iMessage](/th/channels/imessage): พาธ CLI ของ `imsg` + สิทธิ์เข้าถึง Messages DB; ใช้ SSH wrapper เมื่อ Gateway ทำงานนอก Mac
    - ความปลอดภัยของ DM: ค่าเริ่มต้นคือการจับคู่ DM แรกจะส่งโค้ด อนุมัติผ่าน
      `openclaw pairing approve <channel> <code>` หรือใช้ allowlists
  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - ต้องมีเซสชันผู้ใช้ที่ล็อกอินอยู่; สำหรับ headless ให้ใช้ LaunchDaemon แบบกำหนดเอง (ไม่ได้จัดส่งมาให้)
    - Linux และ Windows ผ่าน WSL2: systemd user unit
      - วิซาร์ดพยายามรัน `loginctl enable-linger <user>` เพื่อให้ Gateway ยังคงทำงานหลังออกจากระบบ
      - อาจถาม sudo (เขียน `/var/lib/systemd/linger`); จะลองโดยไม่ใช้ sudo ก่อน
    - Windows แบบเนทีฟ: Scheduled Task ก่อน
      - หากการสร้างงานถูกปฏิเสธ OpenClaw จะ fallback เป็นรายการล็อกอินในโฟลเดอร์ Startup ต่อผู้ใช้และเริ่ม Gateway ทันที
      - Scheduled Tasks ยังคงเป็นตัวเลือกที่แนะนำ เพราะให้สถานะ supervisor ที่ดีกว่า
    - การเลือกรันไทม์: Node (แนะนำ; จำเป็นสำหรับ WhatsApp และ Telegram) ไม่แนะนำให้ใช้ Bun

  </Step>
  <Step title="Health check">
    - เริ่ม Gateway (หากจำเป็น) และรัน `openclaw health`
    - `openclaw status --deep` เพิ่มการตรวจสุขภาพ Gateway แบบสดลงในผลลัพธ์สถานะ รวมถึงการตรวจช่องทางเมื่อรองรับ

  </Step>
  <Step title="Skills">
    - อ่าน Skills ที่มีและตรวจข้อกำหนด
    - ให้คุณเลือกตัวจัดการ Node: npm, pnpm หรือ bun
    - ติดตั้ง dependency ที่เลือกใช้ได้ (บางรายการใช้ Homebrew บน macOS)

  </Step>
  <Step title="Finish">
    - สรุปและขั้นตอนถัดไป รวมถึงตัวเลือกแอป iOS, Android และ macOS

  </Step>
</Steps>

<Note>
หากตรวจไม่พบ GUI วิซาร์ดจะพิมพ์คำแนะนำการทำ SSH port-forward สำหรับ Control UI แทนการเปิดเบราว์เซอร์
หากไม่มี asset ของ Control UI วิซาร์ดจะพยายามสร้างให้; fallback คือ `pnpm ui:build` (ติดตั้ง dependency ของ UI อัตโนมัติ)
</Note>

## รายละเอียดโหมดระยะไกล

โหมดระยะไกลจะกำหนดค่าเครื่องนี้ให้เชื่อมต่อกับ Gateway ที่อื่น

<Info>
โหมดระยะไกลจะไม่ติดตั้งหรือแก้ไขสิ่งใดบนโฮสต์ระยะไกล
</Info>

สิ่งที่คุณตั้งค่า:

- URL ของ Gateway ระยะไกล (`ws://...`)
- โทเค็นหาก Gateway ระยะไกลต้องใช้การยืนยันตัวตน (แนะนำ)

<Note>
- หาก Gateway เป็นแบบ loopback-only ให้ใช้ SSH tunneling หรือ tailnet
- คำแนะนำสำหรับการค้นหา:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## ตัวเลือกการยืนยันตัวตนและโมเดล

<AccordionGroup>
  <Accordion title="Anthropic API key">
    ใช้ `ANTHROPIC_API_KEY` หากมีอยู่ หรือถามคีย์ จากนั้นบันทึกไว้สำหรับการใช้งานโดยดีมอน
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    โฟลว์ผ่านเบราว์เซอร์; วาง `code#state`

    ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` ผ่านรันไทม์ Codex เมื่อยังไม่ได้ตั้งค่าโมเดลหรือเป็นตระกูล OpenAI อยู่แล้ว

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    โฟลว์จับคู่ผ่านเบราว์เซอร์ด้วยรหัสอุปกรณ์อายุสั้น

    ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` ผ่านรันไทม์ Codex เมื่อยังไม่ได้ตั้งค่าโมเดลหรือเป็นตระกูล OpenAI อยู่แล้ว

  </Accordion>
  <Accordion title="OpenAI API key">
    ใช้ `OPENAI_API_KEY` หากมีอยู่ หรือถามคีย์ จากนั้นจัดเก็บข้อมูลรับรองไว้ในโปรไฟล์การยืนยันตัวตน

    ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` เมื่อยังไม่ได้ตั้งค่าโมเดล, เป็น `openai/*` หรือเป็น `openai-codex/*`

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    ถาม `XAI_API_KEY` และกำหนดค่า xAI เป็นผู้ให้บริการโมเดล
  </Accordion>
  <Accordion title="OpenCode">
    ถาม `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) และให้คุณเลือกแค็ตตาล็อก Zen หรือ Go
    URL การตั้งค่า: [opencode.ai/auth](https://opencode.ai/auth)
  </Accordion>
  <Accordion title="API key (generic)">
    จัดเก็บคีย์ให้คุณ
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    ถาม `AI_GATEWAY_API_KEY`
    รายละเอียดเพิ่มเติม: [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    ถาม ID บัญชี, ID ของ Gateway และ `CLOUDFLARE_AI_GATEWAY_API_KEY`
    รายละเอียดเพิ่มเติม: [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
  </Accordion>
  <Accordion title="MiniMax">
    คอนฟิกจะถูกเขียนให้อัตโนมัติ ค่าเริ่มต้นแบบโฮสต์คือ `MiniMax-M2.7`; การตั้งค่าด้วย API-key ใช้
    `minimax/...` และการตั้งค่าด้วย OAuth ใช้ `minimax-portal/...`
    รายละเอียดเพิ่มเติม: [MiniMax](/th/providers/minimax)
  </Accordion>
  <Accordion title="StepFun">
    คอนฟิกจะถูกเขียนให้อัตโนมัติสำหรับ StepFun มาตรฐานหรือ Step Plan บน endpoint ของจีนหรือทั่วโลก
    มาตรฐานในปัจจุบันมี `step-3.5-flash` และ Step Plan ยังมี `step-3.5-flash-2603`
    รายละเอียดเพิ่มเติม: [StepFun](/th/providers/stepfun)
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    ถาม `SYNTHETIC_API_KEY`
    รายละเอียดเพิ่มเติม: [Synthetic](/th/providers/synthetic)
  </Accordion>
  <Accordion title="Ollama (Cloud and local open models)">
    ถาม `Cloud + Local`, `Cloud only` หรือ `Local only` ก่อน
    `Cloud only` ใช้ `OLLAMA_API_KEY` กับ `https://ollama.com`
    โหมดที่อิงโฮสต์จะถาม URL ฐาน (ค่าเริ่มต้น `http://127.0.0.1:11434`), ค้นหาโมเดลที่มี และแนะนำค่าเริ่มต้น
    `Cloud + Local` ยังตรวจด้วยว่าโฮสต์ Ollama นั้นลงชื่อเข้าใช้เพื่อเข้าถึงคลาวด์หรือไม่
    รายละเอียดเพิ่มเติม: [Ollama](/th/providers/ollama)
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    คอนฟิก Moonshot (Kimi K2) และ Kimi Coding จะถูกเขียนให้อัตโนมัติ
    รายละเอียดเพิ่มเติม: [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
  </Accordion>
  <Accordion title="Custom provider">
    ใช้งานได้กับ endpoint ที่เข้ากันได้กับ OpenAI และ Anthropic

    การเริ่มต้นใช้งานแบบอินเทอร์แอคทีฟรองรับตัวเลือกการจัดเก็บ API key แบบเดียวกับโฟลว์ API key ของผู้ให้บริการอื่น:
    - **วาง API key ตอนนี้** (ข้อความธรรมดา)
    - **ใช้การอ้างอิงความลับ** (env ref หรือ provider ref ที่กำหนดค่าไว้ พร้อมการตรวจสอบ preflight)

    แฟล็กแบบไม่โต้ตอบ:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (เลือกใช้ได้; fallback เป็น `CUSTOM_API_KEY`)
    - `--custom-provider-id` (เลือกใช้ได้)
    - `--custom-compatibility <openai|anthropic>` (เลือกใช้ได้; ค่าเริ่มต้น `openai`)
    - `--custom-image-input` / `--custom-text-input` (เลือกใช้ได้; แทนที่ความสามารถอินพุตของโมเดลที่อนุมานได้)

  </Accordion>
  <Accordion title="Skip">
    ปล่อยให้การยืนยันตัวตนยังไม่ได้กำหนดค่า
  </Accordion>
</AccordionGroup>

พฤติกรรมของโมเดล:

- เลือกโมเดลเริ่มต้นจากตัวเลือกที่ตรวจพบ หรือป้อนผู้ให้บริการและโมเดลด้วยตนเอง
- การเริ่มต้นใช้งานผู้ให้บริการแบบกำหนดเองจะอนุมานการรองรับรูปภาพสำหรับ ID โมเดลทั่วไป และถามเฉพาะเมื่อไม่รู้จักชื่อโมเดล
- เมื่อการเริ่มต้นใช้งานเริ่มจากตัวเลือกการยืนยันตัวตนของผู้ให้บริการ ตัวเลือกโมเดลจะให้ความสำคัญกับ
  ผู้ให้บริการนั้นโดยอัตโนมัติ สำหรับ Volcengine และ BytePlus ความสำคัญเดียวกัน
  จะจับคู่กับตัวแปร coding-plan ด้วย (`volcengine-plan/*`,
  `byteplus-plan/*`)
- หากตัวกรองผู้ให้บริการที่ให้ความสำคัญนั้นจะว่างเปล่า ตัวเลือกจะ fallback เป็น
  แค็ตตาล็อกทั้งหมดแทนการไม่แสดงโมเดลใดเลย
- วิซาร์ดรันการตรวจโมเดลและเตือนหากโมเดลที่กำหนดค่าไม่รู้จักหรือไม่มีการยืนยันตัวตน

พาธข้อมูลรับรองและโปรไฟล์:

- โปรไฟล์การยืนยันตัวตน (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- การนำเข้า OAuth แบบเก่า: `~/.openclaw/credentials/oauth.json`

โหมดการจัดเก็บข้อมูลรับรอง:

- พฤติกรรมการเริ่มต้นใช้งานค่าเริ่มต้นจะคง API keys เป็นค่าข้อความธรรมดาในโปรไฟล์การยืนยันตัวตน
- `--secret-input-mode ref` เปิดใช้โหมดอ้างอิงแทนการจัดเก็บคีย์แบบข้อความธรรมดา
  ในการตั้งค่าแบบอินเทอร์แอคทีฟ คุณเลือกได้อย่างใดอย่างหนึ่ง:
  - การอ้างอิงตัวแปรสภาพแวดล้อม (เช่น `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - การอ้างอิงผู้ให้บริการที่กำหนดค่าไว้ (`file` หรือ `exec`) พร้อม alias ของผู้ให้บริการ + id
- โหมดอ้างอิงแบบอินเทอร์แอคทีฟจะรันการตรวจสอบ preflight อย่างรวดเร็วก่อนบันทึก
  - Env refs: ตรวจสอบชื่อตัวแปร + ค่าที่ไม่ว่างในสภาพแวดล้อมการเริ่มต้นใช้งานปัจจุบัน
  - Provider refs: ตรวจสอบคอนฟิกผู้ให้บริการและ resolve id ที่ขอ
  - หาก preflight ล้มเหลว การเริ่มต้นใช้งานจะแสดงข้อผิดพลาดและให้คุณลองใหม่
- ในโหมดไม่โต้ตอบ `--secret-input-mode ref` รองรับด้วย env เท่านั้น
  - ตั้งค่าตัวแปรสภาพแวดล้อมของผู้ให้บริการในสภาพแวดล้อมกระบวนการเริ่มต้นใช้งาน
  - แฟล็กคีย์แบบ inline (เช่น `--openai-api-key`) ต้องมีการตั้งค่าตัวแปรสภาพแวดล้อมนั้น มิฉะนั้นการเริ่มต้นใช้งานจะล้มเหลวทันที
  - สำหรับผู้ให้บริการแบบกำหนดเอง โหมด `ref` แบบไม่โต้ตอบจะจัดเก็บ `models.providers.<id>.apiKey` เป็น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`
  - ในกรณีผู้ให้บริการแบบกำหนดเองนั้น `--custom-api-key` ต้องมีการตั้งค่า `CUSTOM_API_KEY` มิฉะนั้นการเริ่มต้นใช้งานจะล้มเหลวทันที
- ข้อมูลรับรองการยืนยันตัวตนของ Gateway รองรับตัวเลือกข้อความธรรมดาและ SecretRef ในการตั้งค่าแบบอินเทอร์แอคทีฟ:
  - โหมดโทเค็น: **สร้าง/จัดเก็บโทเค็นแบบข้อความธรรมดา** (ค่าเริ่มต้น) หรือ **ใช้ SecretRef**
  - โหมดรหัสผ่าน: ข้อความธรรมดาหรือ SecretRef
- เส้นทาง SecretRef ของโทเค็นแบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
- การตั้งค่าแบบข้อความธรรมดาที่มีอยู่ยังคงทำงานได้โดยไม่เปลี่ยนแปลง

<Note>
เคล็ดลับสำหรับโหมดไม่มีหน้าจอและเซิร์ฟเวอร์: ทำ OAuth ให้เสร็จบนเครื่องที่มีเบราว์เซอร์ จากนั้นคัดลอก
`auth-profiles.json` ของเอเจนต์นั้น (เช่น
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` หรือพาธ
`$OPENCLAW_STATE_DIR/...` ที่ตรงกัน) ไปยังโฮสต์ Gateway `credentials/oauth.json`
เป็นเพียงแหล่งนำเข้าแบบเดิมเท่านั้น
</Note>

## เอาต์พุตและภายในระบบ

ฟิลด์ทั่วไปใน `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` เมื่อส่ง `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (ถ้าเลือก Minimax)
- `tools.profile` (การเริ่มต้นใช้งานแบบโลคัลจะตั้งค่าเริ่มต้นเป็น `"coding"` เมื่อยังไม่ได้ตั้งค่าไว้ ส่วนค่าที่ระบุไว้อย่างชัดเจนแล้วจะถูกคงไว้)
- `gateway.*` (โหมด, การ bind, auth, tailscale)
- `session.dmScope` (การเริ่มต้นใช้งานแบบโลคัลจะตั้งค่าเริ่มต้นเป็น `per-channel-peer` เมื่อยังไม่ได้ตั้งค่าไว้ ส่วนค่าที่ระบุไว้อย่างชัดเจนแล้วจะถูกคงไว้)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- รายการอนุญาตของช่องทาง (Slack, Discord, Matrix, Microsoft Teams) เมื่อคุณเลือกใช้ระหว่างพรอมป์ (ชื่อจะถูกแปลงเป็น ID เมื่อทำได้)
- `skills.install.nodeManager`
  - แฟล็ก `setup --node-manager` รับ `npm`, `pnpm` หรือ `bun`
  - การกำหนดค่าด้วยตนเองยังสามารถตั้งค่า `skills.install.nodeManager: "yarn"` ในภายหลังได้
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` จะเขียน `agents.list[]` และ `bindings` ที่เป็นทางเลือก

ข้อมูลประจำตัว WhatsApp จะอยู่ใต้ `~/.openclaw/credentials/whatsapp/<accountId>/`
เซสชันจะถูกจัดเก็บไว้ใต้ `~/.openclaw/agents/<agentId>/sessions/`

<Note>
บางช่องทางถูกส่งมอบเป็น plugins เมื่อเลือกระหว่างการตั้งค่า ตัวช่วยสร้าง
จะพรอมป์ให้ติดตั้ง plugin (npm หรือพาธโลคัล) ก่อนกำหนดค่าช่องทาง
</Note>

RPC ของตัวช่วยสร้าง Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

ไคลเอนต์ (แอป macOS และ Control UI) สามารถเรนเดอร์ขั้นตอนได้โดยไม่ต้องนำตรรกะการเริ่มต้นใช้งานไปสร้างใหม่

พฤติกรรมการตั้งค่า Signal:

- ดาวน์โหลด release asset ที่เหมาะสม
- จัดเก็บไว้ใต้ `~/.openclaw/tools/signal-cli/<version>/`
- เขียน `channels.signal.cliPath` ในการกำหนดค่า
- บิลด์ JVM ต้องใช้ Java 21
- ใช้บิลด์เนทีฟเมื่อมีให้ใช้
- Windows ใช้ WSL2 และทำตาม flow ของ signal-cli สำหรับ Linux ภายใน WSL

## เอกสารที่เกี่ยวข้อง

- ศูนย์กลางการเริ่มต้นใช้งาน: [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
- ระบบอัตโนมัติและสคริปต์: [ระบบอัตโนมัติของ CLI](/th/start/wizard-cli-automation)
- เอกสารอ้างอิงคำสั่ง: [`openclaw onboard`](/th/cli/onboard)
