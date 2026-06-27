---
read_when:
    - คุณต้องการรายละเอียดพฤติกรรมสำหรับ openclaw onboard
    - คุณกำลังดีบักผลลัพธ์การเริ่มต้นใช้งานหรือผสานรวมไคลเอนต์การเริ่มต้นใช้งาน
sidebarTitle: CLI reference
summary: เอกสารอ้างอิงฉบับสมบูรณ์สำหรับโฟลว์การตั้งค่า CLI, การตั้งค่าการยืนยันตัวตน/โมเดล, เอาต์พุต และกลไกภายใน
title: ข้อมูลอ้างอิงการตั้งค่า CLI
x-i18n:
    generated_at: "2026-06-27T18:24:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6e46c81dd51ee9f1ce492dedc2911d449f507a136bd8805bc157915684a1941
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

หน้านี้เป็นเอกสารอ้างอิงฉบับเต็มสำหรับ `openclaw onboard`.
สำหรับคู่มือฉบับย่อ โปรดดู [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard).

## วิซาร์ดทำอะไร

โหมดภายในเครื่อง (ค่าเริ่มต้น) จะพาคุณตั้งค่า:

- การตั้งค่าโมเดลและการยืนยันตัวตน (OAuth สำหรับการสมัครใช้งาน OpenAI Code, Anthropic Claude CLI หรือคีย์ API รวมถึงตัวเลือก MiniMax, GLM, Ollama, Moonshot, StepFun และ AI Gateway)
- ตำแหน่งเวิร์กสเปซและไฟล์บูตสแตรป
- การตั้งค่า Gateway (พอร์ต, bind, การยืนยันตัวตน, Tailscale)
- ช่องทางและผู้ให้บริการ (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage และ Plugin ช่องทางที่มาพร้อมชุดอื่น ๆ)
- การติดตั้ง daemon (LaunchAgent, systemd user unit หรือ Windows Scheduled Task แบบเนทีฟพร้อมทางเลือกสำรอง Startup-folder)
- การตรวจสุขภาพ
- การตั้งค่า Skills

โหมดระยะไกลจะกำหนดค่าเครื่องนี้ให้เชื่อมต่อกับ Gateway ที่อยู่ที่อื่น
โหมดนี้จะไม่ติดตั้งหรือแก้ไขสิ่งใดบนโฮสต์ระยะไกล

## รายละเอียดโฟลว์ภายในเครื่อง

<Steps>
  <Step title="การตรวจพบคอนฟิกที่มีอยู่">
    - หากมี `~/.openclaw/openclaw.json` ให้เลือก Keep, Modify หรือ Reset
    - การรันวิซาร์ดซ้ำจะไม่ล้างสิ่งใด เว้นแต่คุณจะเลือก Reset อย่างชัดเจน (หรือส่ง `--reset`)
    - CLI `--reset` มีค่าเริ่มต้นเป็น `config+creds+sessions`; ใช้ `--reset-scope full` เพื่อลบเวิร์กสเปซด้วย
    - หากคอนฟิกไม่ถูกต้องหรือมีคีย์แบบเดิม วิซาร์ดจะหยุดและขอให้คุณรัน `openclaw doctor` ก่อนดำเนินการต่อ
    - Reset ใช้ `trash` และมีขอบเขตให้เลือก:
      - เฉพาะคอนฟิก
      - คอนฟิก + ข้อมูลรับรอง + เซสชัน
      - รีเซ็ตทั้งหมด (ลบเวิร์กสเปซด้วย)

  </Step>
  <Step title="โมเดลและการยืนยันตัวตน">
    - ตารางตัวเลือกทั้งหมดอยู่ใน [ตัวเลือกการยืนยันตัวตนและโมเดล](#auth-and-model-options)

  </Step>
  <Step title="เวิร์กสเปซ">
    - ค่าเริ่มต้น `~/.openclaw/workspace` (กำหนดค่าได้)
    - เติมไฟล์เวิร์กสเปซที่จำเป็นสำหรับพิธีบูตสแตรปในการรันครั้งแรก
    - โครงร่างเวิร์กสเปซ: [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - ถามพอร์ต, bind, โหมดการยืนยันตัวตน และการเปิดเผยผ่าน Tailscale
    - แนะนำ: เปิดใช้การยืนยันตัวตนด้วยโทเค็นไว้ แม้สำหรับ loopback เพื่อให้ไคลเอนต์ WS ภายในเครื่องต้องยืนยันตัวตน
    - ในโหมดโทเค็น การตั้งค่าแบบโต้ตอบมีตัวเลือก:
      - **สร้าง/จัดเก็บโทเค็นเป็นข้อความล้วน** (ค่าเริ่มต้น)
      - **ใช้ SecretRef** (เลือกใช้)
    - ในโหมดรหัสผ่าน การตั้งค่าแบบโต้ตอบยังรองรับการจัดเก็บแบบข้อความล้วนหรือ SecretRef
    - เส้นทาง SecretRef ของโทเค็นแบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
      - ต้องมีตัวแปรสภาพแวดล้อมที่ไม่ว่างในสภาพแวดล้อมของกระบวนการ onboarding
      - ใช้ร่วมกับ `--gateway-token` ไม่ได้
    - ปิดการยืนยันตัวตนเฉพาะเมื่อคุณไว้วางใจกระบวนการภายในเครื่องทั้งหมดอย่างเต็มที่
    - bind ที่ไม่ใช่ loopback ยังคงต้องใช้การยืนยันตัวตน

  </Step>
  <Step title="ช่องทาง">
    - [WhatsApp](/th/channels/whatsapp): การเข้าสู่ระบบด้วย QR ที่เลือกได้
    - [Telegram](/th/channels/telegram): โทเค็นบอต
    - [Discord](/th/channels/discord): โทเค็นบอต
    - [Google Chat](/th/channels/googlechat): JSON ของบัญชีบริการ + กลุ่มเป้าหมาย Webhook
    - [Mattermost](/th/channels/mattermost): โทเค็นบอต + URL ฐาน
    - [Signal](/th/channels/signal): การติดตั้ง `signal-cli` ที่เลือกได้ + คอนฟิกบัญชี
    - [iMessage](/th/channels/imessage): เส้นทาง CLI `imsg` + การเข้าถึง Messages DB; ใช้ตัวห่อ SSH เมื่อ Gateway รันนอก Mac
    - ความปลอดภัยของ DM: ค่าเริ่มต้นคือการจับคู่ DM แรกจะส่งรหัส อนุมัติผ่าน
      `openclaw pairing approve <channel> <code>` หรือใช้ allowlists
  </Step>
  <Step title="การติดตั้ง daemon">
    - macOS: LaunchAgent
      - ต้องมีเซสชันผู้ใช้ที่ล็อกอินอยู่; สำหรับ headless ให้ใช้ LaunchDaemon แบบกำหนดเอง (ไม่ได้จัดส่งมาด้วย)
    - Linux และ Windows ผ่าน WSL2: systemd user unit
      - วิซาร์ดจะพยายามรัน `loginctl enable-linger <user>` เพื่อให้ Gateway ยังทำงานหลังออกจากระบบ
      - อาจถาม sudo (เขียน `/var/lib/systemd/linger`); จะลองโดยไม่ใช้ sudo ก่อน
    - Windows แบบเนทีฟ: ใช้ Scheduled Task ก่อน
      - หากการสร้างงานถูกปฏิเสธ OpenClaw จะถอยกลับไปใช้รายการล็อกอิน Startup-folder ต่อผู้ใช้และเริ่ม Gateway ทันที
      - Scheduled Tasks ยังเป็นตัวเลือกที่แนะนำ เพราะให้สถานะ supervisor ที่ดีกว่า
    - การเลือกรันไทม์: Node (แนะนำ; จำเป็นสำหรับ WhatsApp และ Telegram) ไม่แนะนำ Bun

  </Step>
  <Step title="การตรวจสุขภาพ">
    - เริ่ม Gateway (หากจำเป็น) และรัน `openclaw health`
    - `openclaw status --deep` เพิ่มการตรวจสุขภาพ Gateway แบบสดลงในผลลัพธ์สถานะ รวมถึงการตรวจช่องทางเมื่อรองรับ

  </Step>
  <Step title="Skills">
    - อ่าน Skills ที่พร้อมใช้งานและตรวจข้อกำหนด
    - ให้คุณเลือกตัวจัดการ Node: npm, pnpm หรือ bun
    - ติดตั้ง dependency ที่เลือกได้ (บางรายการใช้ Homebrew บน macOS)

  </Step>
  <Step title="เสร็จสิ้น">
    - สรุปและขั้นตอนถัดไป รวมถึงตัวเลือกแอป iOS, Android และ macOS

  </Step>
</Steps>

<Note>
หากตรวจไม่พบ GUI วิซาร์ดจะพิมพ์คำแนะนำ SSH port-forward สำหรับ Control UI แทนการเปิดเบราว์เซอร์
หากไม่มี asset ของ Control UI วิซาร์ดจะพยายาม build ให้; ทางเลือกสำรองคือ `pnpm ui:build` (ติดตั้ง dependency ของ UI ให้อัตโนมัติ)
</Note>

## รายละเอียดโหมดระยะไกล

โหมดระยะไกลจะกำหนดค่าเครื่องนี้ให้เชื่อมต่อกับ Gateway ที่อยู่ที่อื่น

<Info>
โหมดระยะไกลจะไม่ติดตั้งหรือแก้ไขสิ่งใดบนโฮสต์ระยะไกล
</Info>

สิ่งที่คุณตั้งค่า:

- URL ของ Gateway ระยะไกล (`ws://...`)
- โทเค็นหาก Gateway ระยะไกลต้องใช้การยืนยันตัวตน (แนะนำ)

<Note>
- หาก Gateway เป็นแบบ loopback เท่านั้น ให้ใช้ SSH tunneling หรือ tailnet
- คำใบ้สำหรับการค้นหา:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## ตัวเลือกการยืนยันตัวตนและโมเดล

<AccordionGroup>
  <Accordion title="คีย์ API ของ Anthropic">
    ใช้ `ANTHROPIC_API_KEY` หากมีอยู่ หรือถามคีย์ แล้วบันทึกไว้สำหรับการใช้งาน daemon
  </Accordion>
  <Accordion title="การสมัครใช้งาน OpenAI Code (OAuth)">
    โฟลว์ผ่านเบราว์เซอร์; วาง `code#state`

    ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` ผ่านรันไทม์ Codex เมื่อยังไม่ได้ตั้งค่าโมเดลหรือเป็นตระกูล OpenAI อยู่แล้ว

  </Accordion>
  <Accordion title="การสมัครใช้งาน OpenAI Code (การจับคู่อุปกรณ์)">
    โฟลว์จับคู่ผ่านเบราว์เซอร์ด้วยรหัสอุปกรณ์อายุสั้น

    ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` ผ่านรันไทม์ Codex เมื่อยังไม่ได้ตั้งค่าโมเดลหรือเป็นตระกูล OpenAI อยู่แล้ว

  </Accordion>
  <Accordion title="คีย์ API ของ OpenAI">
    ใช้ `OPENAI_API_KEY` หากมีอยู่ หรือถามคีย์ แล้วจัดเก็บข้อมูลรับรองไว้ในโปรไฟล์การยืนยันตัวตน

    ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` เมื่อยังไม่ได้ตั้งค่าโมเดล, เป็น `openai/*` หรือเป็นการอ้างอิงโมเดล Codex แบบเดิม

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    เข้าสู่ระบบผ่านเบราว์เซอร์สำหรับบัญชี SuperGrok หรือ X Premium ที่มีสิทธิ์ เส้นทางนี้เป็น
    เส้นทาง xAI ที่แนะนำสำหรับผู้ใช้ส่วนใหญ่ OpenClaw จะจัดเก็บโปรไฟล์การยืนยันตัวตน
    ที่ได้สำหรับโมเดล Grok, Grok `web_search`, `x_search` และ `code_execution`
  </Accordion>
  <Accordion title="รหัสอุปกรณ์ xAI (Grok)">
    การเข้าสู่ระบบผ่านเบราว์เซอร์ที่เป็นมิตรกับระยะไกล โดยใช้รหัสสั้นแทน callback
    localhost ใช้จากโฮสต์ SSH, Docker หรือ VPS
  </Accordion>
  <Accordion title="คีย์ API ของ xAI (Grok)">
    ถาม `XAI_API_KEY` และกำหนดค่า xAI เป็นผู้ให้บริการโมเดล ใช้ตัวเลือกนี้
    เมื่อคุณต้องการคีย์ API ของ xAI Console แทน OAuth ของการสมัครใช้งาน
  </Accordion>
  <Accordion title="OpenCode">
    ถาม `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) และให้คุณเลือกแค็ตตาล็อก Zen หรือ Go
    URL การตั้งค่า: [opencode.ai/auth](https://opencode.ai/auth)
  </Accordion>
  <Accordion title="คีย์ API (ทั่วไป)">
    จัดเก็บคีย์ให้คุณ
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    ถาม `AI_GATEWAY_API_KEY`
    รายละเอียดเพิ่มเติม: [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    ถาม ID บัญชี, ID Gateway และ `CLOUDFLARE_AI_GATEWAY_API_KEY`
    รายละเอียดเพิ่มเติม: [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
  </Accordion>
  <Accordion title="MiniMax">
    คอนฟิกจะถูกเขียนให้อัตโนมัติ ค่าเริ่มต้นแบบโฮสต์คือ `MiniMax-M3`; การตั้งค่าด้วยคีย์ API ใช้
    `minimax/...` และการตั้งค่าด้วย OAuth ใช้ `minimax-portal/...`
    รายละเอียดเพิ่มเติม: [MiniMax](/th/providers/minimax)
  </Accordion>
  <Accordion title="StepFun">
    คอนฟิกจะถูกเขียนให้อัตโนมัติสำหรับ StepFun standard หรือ Step Plan บน endpoint จีนหรือทั่วโลก
    ปัจจุบัน Standard รวม `step-3.5-flash` และ Step Plan ยังรวม `step-3.5-flash-2603`
    รายละเอียดเพิ่มเติม: [StepFun](/th/providers/stepfun)
  </Accordion>
  <Accordion title="Synthetic (เข้ากันได้กับ Anthropic)">
    ถาม `SYNTHETIC_API_KEY`
    รายละเอียดเพิ่มเติม: [Synthetic](/th/providers/synthetic)
  </Accordion>
  <Accordion title="Ollama (โมเดลเปิดบนคลาวด์และภายในเครื่อง)">
    ถาม `Cloud + Local`, `Cloud only` หรือ `Local only` ก่อน
    `Cloud only` ใช้ `OLLAMA_API_KEY` กับ `https://ollama.com`
    โหมดที่มีโฮสต์รองรับจะถาม URL ฐาน (ค่าเริ่มต้น `http://127.0.0.1:11434`) ค้นหาโมเดลที่พร้อมใช้งาน และแนะนำค่าเริ่มต้น
    `Cloud + Local` ยังตรวจด้วยว่าโฮสต์ Ollama นั้นได้เข้าสู่ระบบสำหรับการเข้าถึงคลาวด์หรือไม่
    รายละเอียดเพิ่มเติม: [Ollama](/th/providers/ollama)
  </Accordion>
  <Accordion title="Moonshot และ Kimi Coding">
    คอนฟิก Moonshot (Kimi K2) และ Kimi Coding จะถูกเขียนให้อัตโนมัติ
    รายละเอียดเพิ่มเติม: [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
  </Accordion>
  <Accordion title="ผู้ให้บริการแบบกำหนดเอง">
    ทำงานกับ endpoint ที่เข้ากันได้กับ OpenAI และเข้ากันได้กับ Anthropic

    การเริ่มต้นใช้งานแบบโต้ตอบรองรับตัวเลือกการจัดเก็บคีย์ API แบบเดียวกับโฟลว์คีย์ API ของผู้ให้บริการอื่น:
    - **วางคีย์ API ตอนนี้** (ข้อความล้วน)
    - **ใช้การอ้างอิง secret** (env ref หรือ provider ref ที่กำหนดค่าไว้ พร้อมการตรวจสอบ preflight)

    แฟล็กแบบไม่โต้ตอบ:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (เลือกได้; ถอยกลับไปใช้ `CUSTOM_API_KEY`)
    - `--custom-provider-id` (เลือกได้)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (เลือกได้; ค่าเริ่มต้น `openai`)
    - `--custom-image-input` / `--custom-text-input` (เลือกได้; แทนที่ความสามารถอินพุตของโมเดลที่อนุมานได้)

  </Accordion>
  <Accordion title="ข้าม">
    ปล่อยให้การยืนยันตัวตนยังไม่ถูกกำหนดค่า
  </Accordion>
</AccordionGroup>

พฤติกรรมของโมเดล:

- เลือกโมเดลเริ่มต้นจากตัวเลือกที่ตรวจพบ หรือป้อนผู้ให้บริการและโมเดลเอง
- การเริ่มต้นใช้งานผู้ให้บริการแบบกำหนดเองจะอนุมานการรองรับรูปภาพสำหรับ ID โมเดลทั่วไป และจะถามเฉพาะเมื่อไม่รู้จักชื่อโมเดล
- เมื่อการเริ่มต้นใช้งานเริ่มจากตัวเลือกการยืนยันตัวตนของผู้ให้บริการ ตัวเลือกโมเดลจะให้ความสำคัญกับ
  ผู้ให้บริการนั้นโดยอัตโนมัติ สำหรับ Volcengine และ BytePlus ความชอบเดียวกันนี้
  ยังจับคู่กับตัวแปร coding-plan ของพวกเขาด้วย (`volcengine-plan/*`,
  `byteplus-plan/*`)
- หากตัวกรองผู้ให้บริการที่ให้ความสำคัญนั้นจะว่างเปล่า ตัวเลือกจะถอยกลับไปใช้
  แค็ตตาล็อกทั้งหมดแทนการไม่แสดงโมเดล
- วิซาร์ดจะรันการตรวจโมเดลและเตือนหากโมเดลที่กำหนดค่าไว้ไม่รู้จักหรือขาดการยืนยันตัวตน

เส้นทางข้อมูลรับรองและโปรไฟล์:

- โปรไฟล์การยืนยันตัวตน (คีย์ API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- การนำเข้า OAuth แบบเดิม: `~/.openclaw/credentials/oauth.json`

โหมดการจัดเก็บข้อมูลรับรอง:

- ลักษณะการทำงานเริ่มต้นของการเริ่มต้นใช้งานจะบันทึก API keys เป็นค่าข้อความธรรมดาในโปรไฟล์ auth
- `--secret-input-mode ref` เปิดใช้โหมดอ้างอิงแทนการจัดเก็บคีย์แบบข้อความธรรมดา
  ในการตั้งค่าแบบโต้ตอบ คุณสามารถเลือกอย่างใดอย่างหนึ่ง:
  - การอ้างอิงตัวแปรสภาพแวดล้อม (เช่น `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - การอ้างอิง provider ที่กำหนดค่าไว้ (`file` หรือ `exec`) พร้อม alias ของ provider + id
- โหมดอ้างอิงแบบโต้ตอบจะรันการตรวจสอบ preflight อย่างรวดเร็วก่อนบันทึก
  - Env refs: ตรวจสอบชื่อตัวแปร + ค่าที่ไม่ว่างในสภาพแวดล้อมการเริ่มต้นใช้งานปัจจุบัน
  - Provider refs: ตรวจสอบ config ของ provider และ resolve id ที่ร้องขอ
  - หาก preflight ล้มเหลว การเริ่มต้นใช้งานจะแสดงข้อผิดพลาดและให้คุณลองใหม่
- ในโหมดไม่โต้ตอบ `--secret-input-mode ref` รองรับเฉพาะ env
  - ตั้งค่า env var ของ provider ในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน
  - แฟล็กคีย์แบบ inline (เช่น `--openai-api-key`) ต้องมีการตั้งค่า env var นั้น มิฉะนั้นการเริ่มต้นใช้งานจะล้มเหลวทันที
  - สำหรับ provider แบบกำหนดเอง โหมด `ref` แบบไม่โต้ตอบจะจัดเก็บ `models.providers.<id>.apiKey` เป็น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`
  - ในกรณี provider แบบกำหนดเองนั้น `--custom-api-key` ต้องมีการตั้งค่า `CUSTOM_API_KEY` มิฉะนั้นการเริ่มต้นใช้งานจะล้มเหลวทันที
- ข้อมูลรับรอง auth ของ Gateway รองรับตัวเลือกข้อความธรรมดาและ SecretRef ในการตั้งค่าแบบโต้ตอบ:
  - โหมด Token: **สร้าง/จัดเก็บ token แบบข้อความธรรมดา** (ค่าเริ่มต้น) หรือ **ใช้ SecretRef**
  - โหมด Password: ข้อความธรรมดาหรือ SecretRef
- เส้นทาง token SecretRef แบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
- การตั้งค่าแบบข้อความธรรมดาที่มีอยู่ยังคงใช้งานได้เหมือนเดิมโดยไม่เปลี่ยนแปลง

<Note>
เคล็ดลับสำหรับ headless และเซิร์ฟเวอร์: ทำ OAuth ให้เสร็จบนเครื่องที่มีเบราว์เซอร์ จากนั้นคัดลอก
`auth-profiles.json` ของ agent นั้น (เช่น
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` หรือ path ที่ตรงกัน
`$OPENCLAW_STATE_DIR/...`) ไปยังโฮสต์ Gateway `credentials/oauth.json`
เป็นเพียงแหล่งนำเข้า legacy เท่านั้น
</Note>

## เอาต์พุตและภายในระบบ

ฟิลด์ทั่วไปใน `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` เมื่อส่ง `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (หากเลือก Minimax)
- `tools.profile` (การเริ่มต้นใช้งานภายในเครื่องมีค่าเริ่มต้นเป็น `"coding"` เมื่อไม่ได้ตั้งค่าไว้; ค่าที่ตั้งไว้อย่างชัดเจนเดิมจะถูกคงไว้)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (การเริ่มต้นใช้งานภายในเครื่องมีค่าเริ่มต้นเป็น `per-channel-peer` เมื่อไม่ได้ตั้งค่าไว้; ค่าที่ตั้งไว้อย่างชัดเจนเดิมจะถูกคงไว้)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- allowlist ของช่องทาง (Slack, Discord, Matrix, Microsoft Teams) เมื่อคุณเลือกใช้ระหว่าง prompt (ชื่อจะ resolve เป็น ID เมื่อเป็นไปได้)
- `skills.install.nodeManager`
  - แฟล็ก `setup --node-manager` รับค่า `npm`, `pnpm` หรือ `bun`
  - config แบบ manual ยังสามารถตั้งค่า `skills.install.nodeManager: "yarn"` ภายหลังได้
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` เขียน `agents.list[]` และ `bindings` ที่เป็นตัวเลือก

ข้อมูลรับรอง WhatsApp จะอยู่ภายใต้ `~/.openclaw/credentials/whatsapp/<accountId>/`
Sessions จะถูกจัดเก็บภายใต้ `~/.openclaw/agents/<agentId>/sessions/`

<Note>
บางช่องทางถูกส่งมอบเป็น Plugin เมื่อเลือกระหว่างการตั้งค่า wizard
จะแจ้งให้ติดตั้ง Plugin (npm หรือ path ภายในเครื่อง) ก่อนการกำหนดค่าช่องทาง
</Note>

RPC ของ wizard Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

ไคลเอนต์ (แอป macOS และ Control UI) สามารถเรนเดอร์ขั้นตอนได้โดยไม่ต้องนำตรรกะการเริ่มต้นใช้งานไปสร้างใหม่

ลักษณะการทำงานของการตั้งค่า Signal:

- ดาวน์โหลด release asset ที่เหมาะสม
- จัดเก็บไว้ภายใต้ `~/.openclaw/tools/signal-cli/<version>/`
- เขียน `channels.signal.cliPath` ใน config
- บิลด์ JVM ต้องใช้ Java 21
- ใช้บิลด์ native เมื่อมีให้ใช้
- Windows ใช้ WSL2 และทำตาม flow ของ Linux signal-cli ภายใน WSL

## เอกสารที่เกี่ยวข้อง

- ศูนย์รวมการเริ่มต้นใช้งาน: [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
- การทำ automation และสคริปต์: [CLI Automation](/th/start/wizard-cli-automation)
- อ้างอิงคำสั่ง: [`openclaw onboard`](/th/cli/onboard)
