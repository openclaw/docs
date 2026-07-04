---
read_when:
    - คุณต้องมีรายละเอียดพฤติกรรมสำหรับ openclaw onboard
    - คุณกำลังดีบักผลลัพธ์การเริ่มต้นใช้งานหรือผสานรวมไคลเอนต์การเริ่มต้นใช้งาน
sidebarTitle: CLI reference
summary: ข้อมูลอ้างอิงฉบับสมบูรณ์สำหรับโฟลว์การตั้งค่า CLI, การตั้งค่าการยืนยันตัวตน/โมเดล, เอาต์พุต และรายละเอียดภายใน
title: ข้อมูลอ้างอิงการตั้งค่า CLI
x-i18n:
    generated_at: "2026-07-04T06:57:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 016ea0c85cefd5cc70d0988e82f2cbb5898c0ae3134f68df645dddb58c2dfe9a
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

หน้านี้คือเอกสารอ้างอิงฉบับเต็มสำหรับ `openclaw onboard`
สำหรับคู่มือฉบับย่อ โปรดดู [การเริ่มใช้งาน (CLI)](/th/start/wizard)

## วิซาร์ดทำอะไร

โหมดภายในเครื่อง (ค่าเริ่มต้น) จะพาคุณตั้งค่า:

- การตั้งค่าโมเดลและการยืนยันตัวตน (OAuth ของการสมัครใช้งาน OpenAI Code, Anthropic Claude CLI หรือ API key รวมถึงตัวเลือก MiniMax, GLM, Ollama, Moonshot, StepFun และ AI Gateway)
- ตำแหน่งเวิร์กสเปซและไฟล์บูตสแตรป
- การตั้งค่า Gateway (พอร์ต, bind, auth, tailscale)
- Channels และ providers (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage และ Plugin ช่องทางที่รวมมาอื่น ๆ)
- การติดตั้ง daemon (LaunchAgent, systemd user unit หรือ Windows Scheduled Task แบบเนทีฟพร้อม fallback ไปยังโฟลเดอร์ Startup)
- การตรวจสุขภาพ
- การตั้งค่า Skills

โหมดระยะไกลจะกำหนดค่าเครื่องนี้ให้เชื่อมต่อกับ gateway ที่อื่น
โหมดนี้จะไม่ติดตั้งหรือแก้ไขสิ่งใดบนโฮสต์ระยะไกล

## รายละเอียดโฟลว์ภายในเครื่อง

<Steps>
  <Step title="การตรวจพบคอนฟิกที่มีอยู่">
    - หาก `~/.openclaw/openclaw.json` มีอยู่ ให้เลือก Keep, Modify หรือ Reset
    - การรันวิซาร์ดซ้ำจะไม่ลบสิ่งใด เว้นแต่คุณจะเลือก Reset อย่างชัดเจน (หรือส่ง `--reset`)
    - CLI `--reset` มีค่าเริ่มต้นเป็น `config+creds+sessions`; ใช้ `--reset-scope full` เพื่อลบเวิร์กสเปซด้วย
    - หากคอนฟิกไม่ถูกต้องหรือมีคีย์เก่า วิซาร์ดจะหยุดและขอให้คุณรัน `openclaw doctor` ก่อนดำเนินการต่อ
    - Reset ใช้ `trash` และเสนอสโคป:
      - เฉพาะคอนฟิก
      - คอนฟิก + ข้อมูลประจำตัว + เซสชัน
      - รีเซ็ตทั้งหมด (ลบเวิร์กสเปซด้วย)

  </Step>
  <Step title="โมเดลและการยืนยันตัวตน">
    - เมทริกซ์ตัวเลือกฉบับเต็มอยู่ใน [ตัวเลือกการยืนยันตัวตนและโมเดล](#auth-and-model-options)

  </Step>
  <Step title="เวิร์กสเปซ">
    - ค่าเริ่มต้น `~/.openclaw/workspace` (กำหนดค่าได้)
    - เติมไฟล์เวิร์กสเปซที่จำเป็นสำหรับพิธีบูตสแตรปเมื่อรันครั้งแรก
    - โครงร่างเวิร์กสเปซ: [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - ถามพอร์ต, bind, โหมด auth และการเปิดเผยผ่าน tailscale
    - แนะนำ: เปิดใช้งาน token auth ไว้แม้สำหรับ loopback เพื่อให้ไคลเอนต์ WS ภายในเครื่องต้องยืนยันตัวตน
    - ในโหมดโทเค็น การตั้งค่าแบบโต้ตอบมีตัวเลือก:
      - **สร้าง/จัดเก็บโทเค็นเป็นข้อความธรรมดา** (ค่าเริ่มต้น)
      - **ใช้ SecretRef** (เลือกใช้)
    - ในโหมดรหัสผ่าน การตั้งค่าแบบโต้ตอบยังรองรับการจัดเก็บเป็นข้อความธรรมดาหรือ SecretRef
    - เส้นทาง SecretRef ของโทเค็นแบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
      - ต้องมี env var ที่ไม่ว่างในสภาพแวดล้อมของกระบวนการเริ่มใช้งาน
      - ใช้ร่วมกับ `--gateway-token` ไม่ได้
    - ปิดใช้งาน auth เฉพาะเมื่อคุณไว้วางใจทุกกระบวนการภายในเครื่องอย่างเต็มที่
    - bind ที่ไม่ใช่ loopback ยังคงต้องใช้ auth

  </Step>
  <Step title="Channels">
    - [WhatsApp](/th/channels/whatsapp): เข้าสู่ระบบด้วย QR ที่เลือกได้
    - [Telegram](/th/channels/telegram): โทเค็นบอต
    - [Discord](/th/channels/discord): โทเค็นบอต
    - [Google Chat](/th/channels/googlechat): JSON ของ service account + webhook audience
    - [Mattermost](/th/channels/mattermost): โทเค็นบอต + URL ฐาน
    - [Signal](/th/channels/signal): ติดตั้ง `signal-cli` ที่เลือกได้ + คอนฟิกบัญชี
    - [iMessage](/th/channels/imessage): เส้นทาง CLI `imsg` + การเข้าถึง Messages DB; ใช้ SSH wrapper เมื่อ Gateway รันนอก Mac
    - ความปลอดภัยของ DM: ค่าเริ่มต้นคือการจับคู่ DM แรกจะส่งรหัส อนุมัติผ่าน
      `openclaw pairing approve <channel> <code>` หรือใช้ allowlists
  </Step>
  <Step title="การติดตั้ง daemon">
    - macOS: LaunchAgent
      - ต้องมีเซสชันผู้ใช้ที่ล็อกอินอยู่; สำหรับแบบ headless ให้ใช้ LaunchDaemon แบบกำหนดเอง (ไม่ได้จัดส่งมา)
    - Linux และ Windows ผ่าน WSL2: systemd user unit
      - วิซาร์ดพยายาม `loginctl enable-linger <user>` เพื่อให้ gateway ยังคงทำงานหลังออกจากระบบ
      - อาจถาม sudo (เขียน `/var/lib/systemd/linger`); จะลองโดยไม่มี sudo ก่อน
    - Windows แบบเนทีฟ: Scheduled Task ก่อน
      - หากการสร้าง task ถูกปฏิเสธ OpenClaw จะ fallback ไปยังรายการล็อกอินในโฟลเดอร์ Startup ต่อผู้ใช้และเริ่ม gateway ทันที
      - Scheduled Tasks ยังคงเป็นตัวเลือกที่แนะนำเพราะให้สถานะ supervisor ที่ดีกว่า
    - การเลือกรันไทม์: Node (แนะนำ; จำเป็นสำหรับ WhatsApp และ Telegram) ไม่แนะนำให้ใช้ Bun

  </Step>
  <Step title="การตรวจสุขภาพ">
    - เริ่ม gateway (หากจำเป็น) และรัน `openclaw health`
    - `openclaw status --deep` เพิ่มการตรวจสอบสุขภาพ gateway แบบสดลงในเอาต์พุตสถานะ รวมถึงการตรวจสอบช่องทางเมื่อรองรับ

  </Step>
  <Step title="Skills">
    - อ่าน skills ที่พร้อมใช้งานและตรวจสอบข้อกำหนด
    - ให้คุณเลือกตัวจัดการ node: npm, pnpm หรือ bun
    - ติดตั้ง dependency ที่เลือกได้สำหรับ skills แบบ bundled ที่เชื่อถือได้เมื่อมี
      ตัวติดตั้งที่จำเป็น
    - ข้ามตัวติดตั้ง Homebrew, uv และ Go ที่ไม่พร้อมใช้งาน แล้วจัดกลุ่ม skills ที่ได้รับผลกระทบ
      พร้อมคำแนะนำการตั้งค่าด้วยตนเอง รัน `openclaw doctor` หลังติดตั้ง
      ข้อกำหนดเบื้องต้นที่ขาดหาย

  </Step>
  <Step title="เสร็จสิ้น">
    - สรุปและขั้นตอนถัดไป รวมถึงตัวเลือกแอป iOS, Android และ macOS

  </Step>
</Steps>

<Note>
หากตรวจไม่พบ GUI วิซาร์ดจะพิมพ์คำแนะนำการทำ SSH port-forward สำหรับ Control UI แทนการเปิดเบราว์เซอร์
หาก asset ของ Control UI หายไป วิซาร์ดจะพยายาม build; fallback คือ `pnpm ui:build` (ติดตั้ง UI deps อัตโนมัติ)
</Note>

## รายละเอียดโหมดระยะไกล

โหมดระยะไกลจะกำหนดค่าเครื่องนี้ให้เชื่อมต่อกับ gateway ที่อื่น

<Info>
โหมดระยะไกลจะไม่ติดตั้งหรือแก้ไขสิ่งใดบนโฮสต์ระยะไกล
</Info>

สิ่งที่คุณตั้งค่า:

- URL ของ gateway ระยะไกล (`ws://...`)
- โทเค็นหาก gateway ระยะไกลต้องใช้ auth (แนะนำ)

<Note>
- หาก gateway เป็นแบบ loopback-only ให้ใช้ SSH tunneling หรือ tailnet
- คำใบ้การค้นพบ:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## ตัวเลือกการยืนยันตัวตนและโมเดล

<AccordionGroup>
  <Accordion title="Anthropic API key">
    ใช้ `ANTHROPIC_API_KEY` หากมีอยู่ หรือถามคีย์ จากนั้นบันทึกไว้ให้ daemon ใช้
  </Accordion>
  <Accordion title="การสมัครใช้งาน OpenAI Code (OAuth)">
    โฟลว์เบราว์เซอร์; วาง `code#state`

    ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` ผ่านรันไทม์ Codex เมื่อยังไม่ได้ตั้งค่าโมเดลหรือเป็นตระกูล OpenAI อยู่แล้ว

  </Accordion>
  <Accordion title="การสมัครใช้งาน OpenAI Code (การจับคู่อุปกรณ์)">
    โฟลว์จับคู่ผ่านเบราว์เซอร์ด้วยรหัสอุปกรณ์อายุสั้น

    ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` ผ่านรันไทม์ Codex เมื่อยังไม่ได้ตั้งค่าโมเดลหรือเป็นตระกูล OpenAI อยู่แล้ว

  </Accordion>
  <Accordion title="OpenAI API key">
    ใช้ `OPENAI_API_KEY` หากมีอยู่ หรือถามคีย์ จากนั้นจัดเก็บข้อมูลประจำตัวไว้ในโปรไฟล์ auth

    ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` เมื่อยังไม่ได้ตั้งค่าโมเดล, `openai/*` หรือ refs โมเดล Codex รุ่นเก่า

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    การลงชื่อเข้าใช้ผ่านเบราว์เซอร์สำหรับบัญชี SuperGrok หรือ X Premium ที่มีสิทธิ์ นี่คือ
    เส้นทาง xAI ที่แนะนำสำหรับผู้ใช้ส่วนใหญ่ OpenClaw จัดเก็บโปรไฟล์ auth
    ที่ได้สำหรับโมเดล Grok, Grok `web_search`, `x_search` และ `code_execution`
  </Accordion>
  <Accordion title="xAI (Grok) device code">
    การลงชื่อเข้าใช้ผ่านเบราว์เซอร์ที่เหมาะกับระยะไกลด้วยรหัสสั้นแทน callback ของ localhost
    ใช้สิ่งนี้จากโฮสต์ SSH, Docker หรือ VPS
  </Accordion>
  <Accordion title="xAI (Grok) API key">
    ถาม `XAI_API_KEY` และกำหนดค่า xAI เป็น model provider ใช้สิ่งนี้
    เมื่อต้องการ API key ของ xAI Console แทน OAuth แบบสมัครใช้งาน
  </Accordion>
  <Accordion title="OpenCode">
    ถาม `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) และให้คุณเลือกแคตตาล็อก Zen หรือ Go
    URL การตั้งค่า: [opencode.ai/auth](https://opencode.ai/auth)
  </Accordion>
  <Accordion title="API key (ทั่วไป)">
    จัดเก็บคีย์ให้คุณ
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    ถาม `AI_GATEWAY_API_KEY`
    รายละเอียดเพิ่มเติม: [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    ถาม ID บัญชี, ID gateway และ `CLOUDFLARE_AI_GATEWAY_API_KEY`
    รายละเอียดเพิ่มเติม: [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
  </Accordion>
  <Accordion title="MiniMax">
    คอนฟิกจะถูกเขียนอัตโนมัติ ค่าเริ่มต้นแบบโฮสต์คือ `MiniMax-M3`; การตั้งค่า API-key ใช้
    `minimax/...` และการตั้งค่า OAuth ใช้ `minimax-portal/...`
    รายละเอียดเพิ่มเติม: [MiniMax](/th/providers/minimax)
  </Accordion>
  <Accordion title="StepFun">
    คอนฟิกจะถูกเขียนอัตโนมัติสำหรับ StepFun standard หรือ Step Plan บน endpoint จีนหรือทั่วโลก
    ปัจจุบัน Standard มี `step-3.5-flash` และ Step Plan มี `step-3.5-flash-2603` ด้วย
    รายละเอียดเพิ่มเติม: [StepFun](/th/providers/stepfun)
  </Accordion>
  <Accordion title="Synthetic (เข้ากันได้กับ Anthropic)">
    ถาม `SYNTHETIC_API_KEY`
    รายละเอียดเพิ่มเติม: [Synthetic](/th/providers/synthetic)
  </Accordion>
  <Accordion title="Ollama (Cloud และโมเดลเปิดภายในเครื่อง)">
    ถาม `Cloud + Local`, `Cloud only` หรือ `Local only` ก่อน
    `Cloud only` ใช้ `OLLAMA_API_KEY` กับ `https://ollama.com`
    โหมดที่มี host-backed จะถาม URL ฐาน (ค่าเริ่มต้น `http://127.0.0.1:11434`) ค้นหาโมเดลที่พร้อมใช้งาน และแนะนำค่าเริ่มต้น
    `Cloud + Local` ยังตรวจสอบด้วยว่าโฮสต์ Ollama นั้นลงชื่อเข้าใช้สำหรับการเข้าถึง cloud หรือไม่
    รายละเอียดเพิ่มเติม: [Ollama](/th/providers/ollama)
  </Accordion>
  <Accordion title="Moonshot และ Kimi Coding">
    คอนฟิก Moonshot (Kimi K2) และ Kimi Coding จะถูกเขียนอัตโนมัติ
    รายละเอียดเพิ่มเติม: [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
  </Accordion>
  <Accordion title="Custom provider">
    ทำงานกับ endpoint ที่เข้ากันได้กับ OpenAI และเข้ากันได้กับ Anthropic

    การเริ่มใช้งานแบบโต้ตอบรองรับตัวเลือกการจัดเก็บ API key แบบเดียวกับโฟลว์ API key ของ provider อื่น:
    - **วาง API key ตอนนี้** (ข้อความธรรมดา)
    - **ใช้ secret reference** (env ref หรือ provider ref ที่กำหนดค่าไว้ พร้อมการตรวจสอบ preflight)

    แฟล็กแบบไม่โต้ตอบ:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (เลือกได้; fallback ไปที่ `CUSTOM_API_KEY`)
    - `--custom-provider-id` (เลือกได้)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (เลือกได้; ค่าเริ่มต้น `openai`)
    - `--custom-image-input` / `--custom-text-input` (เลือกได้; override ความสามารถอินพุตของโมเดลที่อนุมานได้)

  </Accordion>
  <Accordion title="ข้าม">
    ปล่อยให้ auth ยังไม่ได้กำหนดค่า
  </Accordion>
</AccordionGroup>

พฤติกรรมของโมเดล:

- เลือกโมเดลเริ่มต้นจากตัวเลือกที่ตรวจพบ หรือป้อน provider และโมเดลด้วยตนเอง
- การเริ่มใช้งาน custom-provider จะอนุมานการรองรับรูปภาพสำหรับ ID โมเดลทั่วไป และถามเฉพาะเมื่อไม่รู้จักชื่อโมเดล
- เมื่อการเริ่มใช้งานเริ่มจากตัวเลือก auth ของ provider ตัวเลือกโมเดลจะชอบ
  provider นั้นโดยอัตโนมัติ สำหรับ Volcengine และ BytePlus ค่าชอบเดียวกัน
  ยังจับคู่กับ variant coding-plan ของพวกเขาด้วย (`volcengine-plan/*`,
  `byteplus-plan/*`)
- หากตัวกรอง provider ที่ชอบนั้นว่างเปล่า ตัวเลือกจะ fallback ไปยัง
  แคตตาล็อกเต็มแทนการไม่แสดงโมเดลใด ๆ
- วิซาร์ดรันการตรวจโมเดลและเตือนหากโมเดลที่กำหนดค่าไว้ไม่รู้จักหรือไม่มี auth

เส้นทางข้อมูลประจำตัวและโปรไฟล์:

- โปรไฟล์ Auth (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- การนำเข้า OAuth รุ่นเก่า: `~/.openclaw/credentials/oauth.json`

โหมดการจัดเก็บข้อมูลประจำตัว:

- พฤติกรรมการเริ่มต้นใช้งานเริ่มต้นจะบันทึก API keys เป็นค่าข้อความธรรมดาในโปรไฟล์การยืนยันตัวตน
- `--secret-input-mode ref` เปิดใช้โหมดอ้างอิงแทนการจัดเก็บคีย์แบบข้อความธรรมดา
  ในการตั้งค่าแบบโต้ตอบ คุณสามารถเลือกอย่างใดอย่างหนึ่ง:
  - การอ้างอิงตัวแปรสภาพแวดล้อม (เช่น `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - การอ้างอิง provider ที่กำหนดค่าไว้ (`file` หรือ `exec`) พร้อมนามแฝง provider + id
- โหมดอ้างอิงแบบโต้ตอบจะรันการตรวจสอบ preflight อย่างรวดเร็วก่อนบันทึก
  - การอ้างอิง Env: ตรวจสอบชื่อตัวแปร + ค่าที่ไม่ว่างในสภาพแวดล้อมการเริ่มต้นใช้งานปัจจุบัน
  - การอ้างอิง Provider: ตรวจสอบการกำหนดค่า provider และแก้ไข id ที่ร้องขอ
  - หาก preflight ล้มเหลว การเริ่มต้นใช้งานจะแสดงข้อผิดพลาดและให้คุณลองใหม่
- ในโหมดไม่โต้ตอบ `--secret-input-mode ref` จะรองรับด้วย env เท่านั้น
  - ตั้งค่า env var ของ provider ในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน
  - แฟล็กคีย์แบบอินไลน์ (เช่น `--openai-api-key`) ต้องมี env var นั้นตั้งค่าไว้ มิฉะนั้นการเริ่มต้นใช้งานจะล้มเหลวทันที
  - สำหรับ provider แบบกำหนดเอง โหมด `ref` แบบไม่โต้ตอบจะจัดเก็บ `models.providers.<id>.apiKey` เป็น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`
  - ในกรณี provider แบบกำหนดเองนั้น `--custom-api-key` ต้องมี `CUSTOM_API_KEY` ตั้งค่าไว้ มิฉะนั้นการเริ่มต้นใช้งานจะล้มเหลวทันที
- ข้อมูลรับรองการยืนยันตัวตนของ Gateway รองรับตัวเลือกข้อความธรรมดาและ SecretRef ในการตั้งค่าแบบโต้ตอบ:
  - โหมดโทเค็น: **สร้าง/จัดเก็บโทเค็นข้อความธรรมดา** (ค่าเริ่มต้น) หรือ **ใช้ SecretRef**
  - โหมดรหัสผ่าน: ข้อความธรรมดาหรือ SecretRef
- เส้นทาง Token SecretRef แบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
- การตั้งค่าแบบข้อความธรรมดาที่มีอยู่ยังคงทำงานต่อไปโดยไม่เปลี่ยนแปลง

<Note>
เคล็ดลับสำหรับ headless และเซิร์ฟเวอร์: ทำ OAuth ให้เสร็จบนเครื่องที่มีเบราว์เซอร์ จากนั้นคัดลอก
`auth-profiles.json` ของ agent นั้น (เช่น
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` หรือเส้นทาง
`$OPENCLAW_STATE_DIR/...` ที่ตรงกัน) ไปยังโฮสต์ Gateway `credentials/oauth.json`
เป็นเพียงแหล่งนำเข้าแบบเก่าเท่านั้น
</Note>

## เอาต์พุตและส่วนภายใน

ฟิลด์ทั่วไปใน `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` เมื่อส่ง `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (หากเลือก Minimax)
- `tools.profile` (การเริ่มต้นใช้งานในเครื่องมีค่าเริ่มต้นเป็น `"coding"` เมื่อไม่ได้ตั้งค่าไว้ ค่าที่ระบุชัดเจนที่มีอยู่จะถูกคงไว้)
- `gateway.*` (โหมด, bind, auth, tailscale)
- `session.dmScope` (การเริ่มต้นใช้งานในเครื่องตั้งค่านี้เป็นค่าเริ่มต้น `per-channel-peer` เมื่อไม่ได้ตั้งค่าไว้ ค่าที่ระบุชัดเจนที่มีอยู่จะถูกคงไว้)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- รายการอนุญาตของช่องทาง (Slack, Discord, Matrix, Microsoft Teams) เมื่อคุณเลือกใช้ระหว่างพรอมป์ (ชื่อจะถูกแปลงเป็น IDs เมื่อเป็นไปได้)
- `skills.install.nodeManager`
  - แฟล็ก `setup --node-manager` รับค่า `npm`, `pnpm` หรือ `bun`
  - การกำหนดค่าด้วยตนเองยังสามารถตั้งค่า `skills.install.nodeManager: "yarn"` ภายหลังได้
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` เขียน `agents.list[]` และ `bindings` ที่เป็นตัวเลือก

ข้อมูลรับรอง WhatsApp จะอยู่ใต้ `~/.openclaw/credentials/whatsapp/<accountId>/`
เซสชันจะถูกจัดเก็บใต้ `~/.openclaw/agents/<agentId>/sessions/`

<Note>
บางช่องทางถูกส่งมอบเป็น plugins เมื่อเลือกในระหว่างการตั้งค่า wizard
จะแจ้งให้ติดตั้ง plugin (npm หรือเส้นทางในเครื่อง) ก่อนการกำหนดค่าช่องทาง
</Note>

RPC ของ Gateway wizard:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

ไคลเอนต์ (แอป macOS และ Control UI) สามารถแสดงขั้นตอนได้โดยไม่ต้องนำตรรกะการเริ่มต้นใช้งานไปพัฒนาใหม่

พฤติกรรมการตั้งค่า Signal:

- ดาวน์โหลด release asset ที่เหมาะสม
- จัดเก็บไว้ใต้ `~/.openclaw/tools/signal-cli/<version>/`
- เขียน `channels.signal.cliPath` ในการกำหนดค่า
- บิลด์ JVM ต้องใช้ Java 21
- ใช้บิลด์ native เมื่อมีให้ใช้งาน
- Windows ใช้ WSL2 และทำตามขั้นตอนของ signal-cli แบบ Linux ภายใน WSL

## เอกสารที่เกี่ยวข้อง

- ศูนย์กลางการเริ่มต้นใช้งาน: [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
- การทำงานอัตโนมัติและสคริปต์: [การทำงานอัตโนมัติของ CLI](/th/start/wizard-cli-automation)
- อ้างอิงคำสั่ง: [`openclaw onboard`](/th/cli/onboard)
