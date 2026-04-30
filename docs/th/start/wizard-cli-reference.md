---
read_when:
    - คุณต้องการรายละเอียดพฤติกรรมของ openclaw onboard
    - คุณกำลังดีบักผลลัพธ์การเริ่มต้นใช้งานหรือผสานรวมไคลเอนต์การเริ่มต้นใช้งาน
sidebarTitle: CLI reference
summary: เอกสารอ้างอิงฉบับสมบูรณ์สำหรับขั้นตอนการตั้งค่า CLI, การตั้งค่าการยืนยันตัวตน/โมเดล, เอาต์พุต และรายละเอียดภายใน
title: ข้อมูลอ้างอิงการตั้งค่า CLI
x-i18n:
    generated_at: "2026-04-30T10:17:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d40a63ff27d6aaf4cda167ad0cdf3ad7c4f61ecf92d1cf51b5a0237b24917a7
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

หน้านี้เป็นเอกสารอ้างอิงฉบับเต็มสำหรับ `openclaw onboard`
สำหรับคู่มือแบบสั้น โปรดดู [การเริ่มใช้งาน (CLI)](/th/start/wizard)

## วิซาร์ดทำอะไร

โหมดภายในเครื่อง (ค่าเริ่มต้น) จะแนะนำคุณผ่าน:

- การตั้งค่าโมเดลและการรับรองความถูกต้อง (OAuth สำหรับการสมัครใช้งาน OpenAI Code, Anthropic Claude CLI หรือ API key รวมถึงตัวเลือก MiniMax, GLM, Ollama, Moonshot, StepFun และ AI Gateway)
- ตำแหน่งเวิร์กสเปซและไฟล์บูตสแตรป
- การตั้งค่า Gateway (พอร์ต, การ bind, การรับรองความถูกต้อง, Tailscale)
- ช่องทางและผู้ให้บริการ (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles และ Plugin ช่องทางที่บันเดิลมาอื่นๆ)
- การติดตั้ง daemon (LaunchAgent, systemd user unit หรือ Windows Scheduled Task แบบเนทีฟพร้อมทางเลือกสำรองเป็น Startup-folder)
- การตรวจสุขภาพ
- การตั้งค่า Skills

โหมดระยะไกลจะกำหนดค่าเครื่องนี้ให้เชื่อมต่อกับ Gateway ที่อยู่ที่อื่น
โหมดนี้จะไม่ติดตั้งหรือแก้ไขสิ่งใดบนโฮสต์ระยะไกล

## รายละเอียดโฟลว์ภายในเครื่อง

<Steps>
  <Step title="การตรวจหาคอนฟิกที่มีอยู่">
    - หากมี `~/.openclaw/openclaw.json` ให้เลือก Keep, Modify หรือ Reset
    - การเรียกใช้วิซาร์ดซ้ำจะไม่ลบสิ่งใด เว้นแต่คุณจะเลือก Reset อย่างชัดเจน (หรือส่ง `--reset`)
    - CLI `--reset` มีค่าเริ่มต้นเป็น `config+creds+sessions`; ใช้ `--reset-scope full` เพื่อเอาเวิร์กสเปซออกด้วย
    - หากคอนฟิกไม่ถูกต้องหรือมีคีย์เก่า วิซาร์ดจะหยุดและขอให้คุณเรียกใช้ `openclaw doctor` ก่อนดำเนินการต่อ
    - Reset ใช้ `trash` และเสนอสโคป:
      - เฉพาะคอนฟิก
      - คอนฟิก + ข้อมูลรับรอง + เซสชัน
      - รีเซ็ตทั้งหมด (เอาเวิร์กสเปซออกด้วย)

  </Step>
  <Step title="โมเดลและการรับรองความถูกต้อง">
    - ตารางตัวเลือกทั้งหมดอยู่ใน [ตัวเลือกการรับรองความถูกต้องและโมเดล](#auth-and-model-options)

  </Step>
  <Step title="เวิร์กสเปซ">
    - ค่าเริ่มต้น `~/.openclaw/workspace` (กำหนดค่าได้)
    - สร้างไฟล์เริ่มต้นในเวิร์กสเปซที่จำเป็นสำหรับพิธีกรรมบูตสแตรปในการเรียกใช้ครั้งแรก
    - โครงร่างเวิร์กสเปซ: [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - ถามพอร์ต, การ bind, โหมดการรับรองความถูกต้อง และการเปิดเผยผ่าน Tailscale
    - แนะนำ: เปิดใช้การรับรองความถูกต้องด้วยโทเค็นไว้ แม้สำหรับ loopback เพื่อให้ไคลเอนต์ WS ภายในเครื่องต้องยืนยันตัวตน
    - ในโหมดโทเค็น การตั้งค่าแบบโต้ตอบมีตัวเลือก:
      - **สร้าง/จัดเก็บโทเค็นแบบข้อความธรรมดา** (ค่าเริ่มต้น)
      - **ใช้ SecretRef** (เลือกใช้)
    - ในโหมดรหัสผ่าน การตั้งค่าแบบโต้ตอบรองรับการจัดเก็บแบบข้อความธรรมดาหรือ SecretRef เช่นกัน
    - เส้นทาง SecretRef ของโทเค็นแบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
      - ต้องมีตัวแปรสภาพแวดล้อมที่ไม่ว่างในสภาพแวดล้อมของกระบวนการเริ่มใช้งาน
      - ใช้ร่วมกับ `--gateway-token` ไม่ได้
    - ปิดการรับรองความถูกต้องเฉพาะเมื่อคุณไว้วางใจกระบวนการภายในเครื่องทุกกระบวนการอย่างเต็มที่
    - การ bind ที่ไม่ใช่ loopback ยังคงต้องมีการรับรองความถูกต้อง

  </Step>
  <Step title="ช่องทาง">
    - [WhatsApp](/th/channels/whatsapp): การเข้าสู่ระบบด้วย QR ที่เลือกได้
    - [Telegram](/th/channels/telegram): โทเค็นบอท
    - [Discord](/th/channels/discord): โทเค็นบอท
    - [Google Chat](/th/channels/googlechat): JSON ของ service account + กลุ่มเป้าหมาย Webhook
    - [Mattermost](/th/channels/mattermost): โทเค็นบอท + URL ฐาน
    - [Signal](/th/channels/signal): การติดตั้ง `signal-cli` ที่เลือกได้ + คอนฟิกบัญชี
    - [BlueBubbles](/th/channels/bluebubbles): แนะนำสำหรับ iMessage; URL เซิร์ฟเวอร์ + รหัสผ่าน + Webhook
    - [iMessage](/th/channels/imessage): เส้นทาง CLI `imsg` แบบเดิม + การเข้าถึง DB
    - ความปลอดภัยของ DM: ค่าเริ่มต้นคือการจับคู่ DM แรกจะส่งรหัส; อนุมัติผ่าน
      `openclaw pairing approve <channel> <code>` หรือใช้ allowlist
  </Step>
  <Step title="การติดตั้ง daemon">
    - macOS: LaunchAgent
      - ต้องมีเซสชันผู้ใช้ที่เข้าสู่ระบบอยู่; สำหรับแบบ headless ให้ใช้ LaunchDaemon แบบกำหนดเอง (ไม่ได้จัดส่งมาด้วย)
    - Linux และ Windows ผ่าน WSL2: systemd user unit
      - วิซาร์ดพยายามเรียกใช้ `loginctl enable-linger <user>` เพื่อให้ Gateway ยังคงทำงานหลังออกจากระบบ
      - อาจถาม sudo (เขียน `/var/lib/systemd/linger`); จะลองโดยไม่มี sudo ก่อน
    - Windows แบบเนทีฟ: Scheduled Task ก่อน
      - หากการสร้างงานถูกปฏิเสธ OpenClaw จะถอยกลับไปใช้รายการเข้าสู่ระบบใน Startup-folder ต่อผู้ใช้ และเริ่ม Gateway ทันที
      - Scheduled Tasks ยังคงเป็นตัวเลือกที่แนะนำ เพราะให้สถานะตัวควบคุมที่ดีกว่า
    - การเลือกรันไทม์: Node (แนะนำ; จำเป็นสำหรับ WhatsApp และ Telegram) ไม่แนะนำ Bun

  </Step>
  <Step title="การตรวจสุขภาพ">
    - เริ่ม Gateway (หากจำเป็น) และเรียกใช้ `openclaw health`
    - `openclaw status --deep` เพิ่มการ probe สุขภาพ Gateway แบบสดลงในผลลัพธ์สถานะ รวมถึงการ probe ช่องทางเมื่อรองรับ

  </Step>
  <Step title="Skills">
    - อ่าน Skills ที่มีและตรวจสอบข้อกำหนด
    - ให้คุณเลือกตัวจัดการ Node: npm, pnpm หรือ bun
    - ติดตั้ง dependency ทางเลือก (บางรายการใช้ Homebrew บน macOS)

  </Step>
  <Step title="เสร็จสิ้น">
    - สรุปและขั้นตอนถัดไป รวมถึงตัวเลือกแอป iOS, Android และ macOS

  </Step>
</Steps>

<Note>
หากตรวจไม่พบ GUI วิซาร์ดจะพิมพ์คำแนะนำ SSH port-forward สำหรับ Control UI แทนการเปิดเบราว์เซอร์
หากขาดแอสเซ็ตของ Control UI วิซาร์ดจะพยายาม build แอสเซ็ตเหล่านั้น; ทางเลือกสำรองคือ `pnpm ui:build` (ติดตั้ง dependency ของ UI อัตโนมัติ)
</Note>

## รายละเอียดโหมดระยะไกล

โหมดระยะไกลจะกำหนดค่าเครื่องนี้ให้เชื่อมต่อกับ Gateway ที่อยู่ที่อื่น

<Info>
โหมดระยะไกลจะไม่ติดตั้งหรือแก้ไขสิ่งใดบนโฮสต์ระยะไกล
</Info>

สิ่งที่คุณตั้งค่า:

- URL ของ Gateway ระยะไกล (`ws://...`)
- โทเค็นหาก Gateway ระยะไกลต้องมีการรับรองความถูกต้อง (แนะนำ)

<Note>
- หาก Gateway เป็น loopback-only ให้ใช้ SSH tunneling หรือ tailnet
- คำใบ้การค้นหา:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## ตัวเลือกการรับรองความถูกต้องและโมเดล

<AccordionGroup>
  <Accordion title="Anthropic API key">
    ใช้ `ANTHROPIC_API_KEY` หากมีอยู่ หรือถามคีย์ แล้วบันทึกไว้สำหรับการใช้งาน daemon
  </Accordion>
  <Accordion title="การสมัครใช้งาน OpenAI Code (OAuth)">
    โฟลว์เบราว์เซอร์; วาง `code#state`

    ตั้งค่า `agents.defaults.model` เป็น `openai-codex/gpt-5.5` เมื่อยังไม่ได้ตั้งค่าโมเดลหรือเป็นตระกูล OpenAI อยู่แล้ว

  </Accordion>
  <Accordion title="การสมัครใช้งาน OpenAI Code (การจับคู่อุปกรณ์)">
    โฟลว์จับคู่ผ่านเบราว์เซอร์ด้วยรหัสอุปกรณ์อายุสั้น

    ตั้งค่า `agents.defaults.model` เป็น `openai-codex/gpt-5.5` เมื่อยังไม่ได้ตั้งค่าโมเดลหรือเป็นตระกูล OpenAI อยู่แล้ว

  </Accordion>
  <Accordion title="OpenAI API key">
    ใช้ `OPENAI_API_KEY` หากมีอยู่ หรือถามคีย์ แล้วจัดเก็บข้อมูลรับรองในโปรไฟล์การรับรองความถูกต้อง

    ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` เมื่อยังไม่ได้ตั้งค่าโมเดล, `openai/*` หรือ `openai-codex/*`

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    ถาม `XAI_API_KEY` และกำหนดค่า xAI เป็นผู้ให้บริการโมเดล
  </Accordion>
  <Accordion title="OpenCode">
    ถาม `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) และให้คุณเลือกแค็ตตาล็อก Zen หรือ Go
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
    ถาม ID บัญชี, ID ของ Gateway และ `CLOUDFLARE_AI_GATEWAY_API_KEY`
    รายละเอียดเพิ่มเติม: [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
  </Accordion>
  <Accordion title="MiniMax">
    คอนฟิกจะถูกเขียนให้อัตโนมัติ ค่าเริ่มต้นแบบโฮสต์คือ `MiniMax-M2.7`; การตั้งค่าด้วย API key ใช้
    `minimax/...` และการตั้งค่าด้วย OAuth ใช้ `minimax-portal/...`
    รายละเอียดเพิ่มเติม: [MiniMax](/th/providers/minimax)
  </Accordion>
  <Accordion title="StepFun">
    คอนฟิกจะถูกเขียนให้อัตโนมัติสำหรับ StepFun standard หรือ Step Plan บน endpoint ของจีนหรือทั่วโลก
    Standard ปัจจุบันมี `step-3.5-flash` และ Step Plan ยังมี `step-3.5-flash-2603`
    รายละเอียดเพิ่มเติม: [StepFun](/th/providers/stepfun)
  </Accordion>
  <Accordion title="Synthetic (เข้ากันได้กับ Anthropic)">
    ถาม `SYNTHETIC_API_KEY`
    รายละเอียดเพิ่มเติม: [Synthetic](/th/providers/synthetic)
  </Accordion>
  <Accordion title="Ollama (โมเดลเปิดบน Cloud และในเครื่อง)">
    ถาม `Cloud + Local`, `Cloud only` หรือ `Local only` ก่อน
    `Cloud only` ใช้ `OLLAMA_API_KEY` กับ `https://ollama.com`
    โหมดที่มีโฮสต์รองรับจะถาม URL ฐาน (ค่าเริ่มต้น `http://127.0.0.1:11434`), ค้นหาโมเดลที่มี และแนะนำค่าเริ่มต้น
    `Cloud + Local` ยังตรวจด้วยว่าโฮสต์ Ollama นั้นได้เข้าสู่ระบบเพื่อเข้าถึง cloud หรือไม่
    รายละเอียดเพิ่มเติม: [Ollama](/th/providers/ollama)
  </Accordion>
  <Accordion title="Moonshot และ Kimi Coding">
    คอนฟิก Moonshot (Kimi K2) และ Kimi Coding จะถูกเขียนให้อัตโนมัติ
    รายละเอียดเพิ่มเติม: [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
  </Accordion>
  <Accordion title="ผู้ให้บริการแบบกำหนดเอง">
    ใช้งานได้กับ endpoint ที่เข้ากันได้กับ OpenAI และ Anthropic

    การเริ่มใช้งานแบบโต้ตอบรองรับตัวเลือกการจัดเก็บ API key แบบเดียวกับโฟลว์ API key ของผู้ให้บริการอื่น:
    - **วาง API key ตอนนี้** (ข้อความธรรมดา)
    - **ใช้การอ้างอิงลับ** (env ref หรือ provider ref ที่กำหนดค่าไว้ พร้อมการตรวจสอบ preflight)

    แฟล็กแบบไม่โต้ตอบ:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (เลือกได้; ถอยกลับไปใช้ `CUSTOM_API_KEY`)
    - `--custom-provider-id` (เลือกได้)
    - `--custom-compatibility <openai|anthropic>` (เลือกได้; ค่าเริ่มต้น `openai`)
    - `--custom-image-input` / `--custom-text-input` (เลือกได้; แทนที่ความสามารถอินพุตของโมเดลที่อนุมานได้)

  </Accordion>
  <Accordion title="ข้าม">
    ปล่อยให้การรับรองความถูกต้องยังไม่ได้กำหนดค่า
  </Accordion>
</AccordionGroup>

พฤติกรรมของโมเดล:

- เลือกโมเดลเริ่มต้นจากตัวเลือกที่ตรวจพบ หรือป้อนผู้ให้บริการและโมเดลด้วยตนเอง
- การเริ่มใช้งานผู้ให้บริการแบบกำหนดเองจะอนุมานการรองรับรูปภาพสำหรับ ID โมเดลทั่วไป และถามเฉพาะเมื่อไม่รู้จักชื่อโมเดล
- เมื่อการเริ่มใช้งานเริ่มจากตัวเลือกการรับรองความถูกต้องของผู้ให้บริการ ตัวเลือกโมเดลจะให้ความสำคัญกับ
  ผู้ให้บริการนั้นโดยอัตโนมัติ สำหรับ Volcengine และ BytePlus ความชอบเดียวกัน
  ยังจับคู่กับตัวแปร coding-plan ของพวกเขาด้วย (`volcengine-plan/*`,
  `byteplus-plan/*`)
- หากตัวกรองผู้ให้บริการที่ต้องการนั้นจะว่าง ตัวเลือกจะถอยกลับไปใช้
  แค็ตตาล็อกเต็มแทนการแสดงว่าไม่มีโมเดล
- วิซาร์ดจะรันการตรวจสอบโมเดลและเตือนหากโมเดลที่กำหนดค่าไว้ไม่รู้จักหรือไม่มีการรับรองความถูกต้อง

เส้นทางข้อมูลรับรองและโปรไฟล์:

- โปรไฟล์การรับรองความถูกต้อง (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- การนำเข้า OAuth แบบเดิม: `~/.openclaw/credentials/oauth.json`

โหมดการจัดเก็บข้อมูลรับรอง:

- พฤติกรรมเริ่มต้นของการเริ่มใช้งานจะคง API keys เป็นค่าข้อความธรรมดาในโปรไฟล์การรับรองความถูกต้อง
- `--secret-input-mode ref` เปิดใช้โหมดอ้างอิงแทนการจัดเก็บคีย์แบบข้อความธรรมดา
  ในการตั้งค่าแบบโต้ตอบ คุณสามารถเลือกอย่างใดอย่างหนึ่ง:
  - env ref ของตัวแปรสภาพแวดล้อม (เช่น `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - provider ref ที่กำหนดค่าไว้ (`file` หรือ `exec`) พร้อม alias ของผู้ให้บริการ + id
- โหมดอ้างอิงแบบโต้ตอบจะรันการตรวจสอบ preflight อย่างรวดเร็วก่อนบันทึก
  - Env refs: ตรวจสอบชื่อตัวแปร + ค่าที่ไม่ว่างในสภาพแวดล้อมการเริ่มใช้งานปัจจุบัน
  - Provider refs: ตรวจสอบคอนฟิกผู้ให้บริการและ resolve id ที่ร้องขอ
  - หาก preflight ล้มเหลว การเริ่มใช้งานจะแสดงข้อผิดพลาดและให้คุณลองอีกครั้ง
- ในโหมดไม่โต้ตอบ `--secret-input-mode ref` รองรับด้วย env เท่านั้น
  - ตั้งค่าตัวแปรสภาพแวดล้อมของผู้ให้บริการในสภาพแวดล้อมกระบวนการเริ่มใช้งาน
  - แฟล็กคีย์แบบ inline (เช่น `--openai-api-key`) กำหนดให้ต้องตั้งค่าตัวแปรสภาพแวดล้อมนั้น ไม่เช่นนั้นการเริ่มใช้งานจะล้มเหลวทันที
  - สำหรับผู้ให้บริการแบบกำหนดเอง โหมด `ref` แบบไม่โต้ตอบจะจัดเก็บ `models.providers.<id>.apiKey` เป็น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`
  - ในกรณีผู้ให้บริการแบบกำหนดเองนั้น `--custom-api-key` กำหนดให้ต้องตั้งค่า `CUSTOM_API_KEY` ไม่เช่นนั้นการเริ่มใช้งานจะล้มเหลวทันที
- ข้อมูลรับรองการรับรองความถูกต้องของ Gateway รองรับตัวเลือกข้อความธรรมดาและ SecretRef ในการตั้งค่าแบบโต้ตอบ:
  - โหมดโทเค็น: **สร้าง/จัดเก็บโทเค็นแบบข้อความธรรมดา** (ค่าเริ่มต้น) หรือ **ใช้ SecretRef**
  - โหมดรหัสผ่าน: ข้อความธรรมดาหรือ SecretRef
- เส้นทาง SecretRef ของโทเค็นแบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
- การตั้งค่าแบบข้อความธรรมดาที่มีอยู่จะยังคงทำงานเหมือนเดิม

<Note>
เคล็ดลับสำหรับโหมด headless และเซิร์ฟเวอร์: ทำ OAuth ให้เสร็จบนเครื่องที่มีเบราว์เซอร์ จากนั้นคัดลอก
`auth-profiles.json` ของเอเจนต์นั้น (เช่น
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, หรือพาธ
`$OPENCLAW_STATE_DIR/...` ที่ตรงกัน) ไปยังโฮสต์ Gateway `credentials/oauth.json`
เป็นเพียงแหล่งนำเข้าแบบเก่าเท่านั้น
</Note>

## เอาต์พุตและรายละเอียดภายใน

ฟิลด์ทั่วไปใน `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` เมื่อส่ง `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (หากเลือก Minimax)
- `tools.profile` (การเริ่มต้นใช้งานภายในเครื่องมีค่าเริ่มต้นเป็น `"coding"` เมื่อยังไม่ได้ตั้งค่า; ค่าที่ระบุไว้แล้วจะถูกเก็บไว้)
- `gateway.*` (โหมด, bind, auth, tailscale)
- `session.dmScope` (การเริ่มต้นใช้งานภายในเครื่องมีค่าเริ่มต้นเป็น `per-channel-peer` เมื่อยังไม่ได้ตั้งค่า; ค่าที่ระบุไว้แล้วจะถูกเก็บไว้)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- รายการอนุญาตของช่องทาง (Slack, Discord, Matrix, Microsoft Teams) เมื่อคุณเลือกเปิดใช้ระหว่างพรอมป์ (ชื่อจะถูกแปลงเป็น ID เมื่อเป็นไปได้)
- `skills.install.nodeManager`
  - แฟล็ก `setup --node-manager` รับค่า `npm`, `pnpm`, หรือ `bun`
  - การกำหนดค่าด้วยตนเองยังคงตั้งค่า `skills.install.nodeManager: "yarn"` ภายหลังได้
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` เขียน `agents.list[]` และ `bindings` ที่เป็นตัวเลือก

ข้อมูลรับรอง WhatsApp จะอยู่ใต้ `~/.openclaw/credentials/whatsapp/<accountId>/`
เซสชันจะถูกจัดเก็บใต้ `~/.openclaw/agents/<agentId>/sessions/`

<Note>
บางช่องทางถูกส่งมอบเป็น Plugin เมื่อเลือกระหว่างการตั้งค่า ตัวช่วยสร้างจะ
แจ้งให้ติดตั้ง Plugin (npm หรือพาธภายในเครื่อง) ก่อนกำหนดค่าช่องทาง
</Note>

RPC ของตัวช่วยสร้าง Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

ไคลเอนต์ (แอป macOS และ Control UI) สามารถเรนเดอร์ขั้นตอนต่าง ๆ ได้โดยไม่ต้องนำตรรกะการเริ่มต้นใช้งานไปสร้างใหม่

พฤติกรรมการตั้งค่า Signal:

- ดาวน์โหลด release asset ที่เหมาะสม
- จัดเก็บไว้ใต้ `~/.openclaw/tools/signal-cli/<version>/`
- เขียน `channels.signal.cliPath` ในการกำหนดค่า
- บิลด์ JVM ต้องใช้ Java 21
- ใช้บิลด์เนทีฟเมื่อมีให้ใช้งาน
- Windows ใช้ WSL2 และทำตามโฟลว์ signal-cli ของ Linux ภายใน WSL

## เอกสารที่เกี่ยวข้อง

- ศูนย์กลางการเริ่มต้นใช้งาน: [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
- ระบบอัตโนมัติและสคริปต์: [ระบบอัตโนมัติของ CLI](/th/start/wizard-cli-automation)
- ข้อมูลอ้างอิงคำสั่ง: [`openclaw onboard`](/th/cli/onboard)
