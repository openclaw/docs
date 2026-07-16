---
read_when:
    - ค้นหาขั้นตอนหรือแฟล็กเฉพาะสำหรับการเริ่มต้นใช้งาน
    - ทำให้การเริ่มต้นใช้งานเป็นอัตโนมัติด้วยโหมดไม่โต้ตอบ
    - การดีบักพฤติกรรมการเริ่มต้นใช้งาน
sidebarTitle: Onboarding Reference
summary: 'ข้อมูลอ้างอิงฉบับเต็มสำหรับการเริ่มต้นใช้งานผ่าน CLI: ทุกขั้นตอน แฟล็ก และฟิลด์การกำหนดค่า'
title: เอกสารอ้างอิงการเริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-07-16T19:45:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6c345887da0102c73f72623105d052ea9262006206dd70bae8f94aad1349423d
    source_path: reference/wizard.md
    workflow: 16
---

นี่คือเอกสารอ้างอิงฉบับเต็มสำหรับ `openclaw onboard`
สำหรับภาพรวมระดับสูง โปรดดู [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard) สำหรับลักษณะการทำงานและผลลัพธ์
แบบทีละขั้นตอน โปรดดู [เอกสารอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference)

## รายละเอียดโฟลว์ (โหมดภายในเครื่อง)

<Steps>
  <Step title="รีเซ็ต (ไม่บังคับ)">
    - `--reset` รีเซ็ตสถานะก่อนเริ่มการตั้งค่า หากไม่ใช้ตัวเลือกนี้ การเรียกใช้การเริ่มต้นใช้งานซ้ำ
      จะเก็บการกำหนดค่าที่มีอยู่และนำกลับมาใช้เป็นค่าเริ่มต้น
    - `--reset-scope` ควบคุมสิ่งที่ `--reset` ลบ ได้แก่ `config` (เฉพาะไฟล์การกำหนดค่า),
      `config+creds+sessions` (ค่าเริ่มต้น) หรือ `full` (ลบเวิร์กสเปซด้วย)
    - หากไฟล์การกำหนดค่าไม่ถูกต้อง การเริ่มต้นใช้งานจะหยุดและแจ้งให้เรียกใช้
      `openclaw doctor` ก่อน แล้วจึงเรียกใช้การตั้งค่าอีกครั้ง
    - การรีเซ็ตจะย้ายสถานะไปยังถังขยะ (ไม่ลบโดยตรง)

  </Step>
  <Step title="การยอมรับความเสี่ยง">
    - การเรียกใช้ครั้งแรก (หรือการเรียกใช้ใดๆ ก่อนตั้งค่า `wizard.securityAcknowledgedAt`)
      จะขอให้ยืนยันว่าเข้าใจว่าเอเจนต์มีความสามารถสูง และการให้สิทธิ์เข้าถึง
      ระบบทั้งหมดมีความเสี่ยง
    - `--non-interactive` กำหนดให้ระบุ `--accept-risk` อย่างชัดเจน หากไม่ระบุ
      การเริ่มต้นใช้งานจะออกพร้อมข้อผิดพลาดแทนการแสดงพรอมต์
    - การเรียกใช้แบบโต้ตอบจะแสดงพรอมต์ยืนยันแทนการใช้แฟล็ก หากปฏิเสธ
      การตั้งค่าจะถูกยกเลิก

  </Step>
  <Step title="โมเดล/การยืนยันตัวตน">
    - **คีย์ API ของ Anthropic**: ใช้ `ANTHROPIC_API_KEY` หากมีอยู่ หรือขอให้ป้อนคีย์ จากนั้นบันทึกไว้เพื่อให้ดีมอนใช้งาน
    - **Anthropic Claude CLI**: เป็นวิธีภายในเครื่องที่แนะนำเมื่อมีการลงชื่อเข้าใช้ Claude CLI อยู่แล้ว OpenClaw ยังรองรับการยืนยันตัวตนด้วยโทเค็นการตั้งค่าของ Anthropic เป็นทางเลือก
    - **การสมัครสมาชิก OpenAI Code (Codex) (OAuth)**: ใช้โฟลว์ผ่านเบราว์เซอร์ ให้วาง `code#state`
      - ในการตั้งค่าใหม่ที่ยังไม่มีโมเดลหลัก จะตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.6-sol` ผ่านรันไทม์ Codex
    - **การสมัครสมาชิก OpenAI Code (Codex) (การจับคู่อุปกรณ์)**: ใช้โฟลว์จับคู่ผ่านเบราว์เซอร์ด้วยรหัสอุปกรณ์ที่มีอายุสั้น
      - ในการตั้งค่าใหม่ที่ยังไม่มีโมเดลหลัก จะตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.6-sol` ผ่านรันไทม์ Codex
    - **คีย์ API ของ OpenAI**: ใช้ `OPENAI_API_KEY` หากมีอยู่ หรือขอให้ป้อนคีย์ จากนั้นจัดเก็บไว้ในโปรไฟล์การยืนยันตัวตน
      - ในการตั้งค่าใหม่ที่ยังไม่มีโมเดลหลัก จะตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.6` โดยรหัสโมเดล Direct API แบบไม่มีส่วนขยายจะถูกแปลงเป็นระดับ Sol
    - การเพิ่มหรือยืนยันตัวตน OpenAI ใหม่จะคงโมเดลหลักที่กำหนดไว้อย่างชัดเจนอยู่แล้ว รวมถึง `openai/gpt-5.5` หากบัญชีไม่เปิดให้ใช้ GPT-5.6 ให้เลือก `openai/gpt-5.5` อย่างชัดเจน OpenClaw จะไม่ลดระดับโมเดลโดยอัตโนมัติ
    - **xAI OAuth**: ลงชื่อเข้าใช้ผ่านเบราว์เซอร์ด้วยรหัสอุปกรณ์โดยไม่ต้องมี Callback ที่ localhost จึงใช้งานผ่าน SSH/Docker/VPS ได้เช่นกัน (`--auth-choice xai-oauth`)
    - **คีย์ API ของ xAI**: ขอให้ป้อน `XAI_API_KEY` (`--auth-choice xai-api-key`)
    - `--auth-choice xai-device-code` ยังคงใช้เป็นนามแฝงเพื่อความเข้ากันได้แบบระบุด้วยตนเองเท่านั้นสำหรับโฟลว์ OAuth ด้วยรหัสอุปกรณ์ของ xAI เดียวกัน ใช้ `xai-oauth` สำหรับสคริปต์ใหม่
    - **OpenCode**: ขอให้ป้อน `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY` รับได้ที่ https://opencode.ai/auth) และให้เลือกแค็ตตาล็อก Zen หรือ Go
    - **Ollama**: เริ่มต้นด้วยตัวเลือก **Cloud + Local**, **Cloud only** หรือ **Local only** โดย `Cloud only` จะขอ `OLLAMA_API_KEY` และใช้ `https://ollama.com` ส่วนโหมดที่ใช้โฮสต์จะขอ URL ฐานของ Ollama (ค่าเริ่มต้นคือ `http://127.0.0.1:11434`) ค้นหาโมเดลที่พร้อมใช้งาน และดึงโมเดลภายในเครื่องที่เลือกโดยอัตโนมัติเมื่อจำเป็น นอกจากนี้ `Cloud + Local` ยังตรวจสอบว่าโฮสต์ Ollama นั้นลงชื่อเข้าใช้เพื่อเข้าถึงคลาวด์แล้วหรือไม่
    - รายละเอียดเพิ่มเติม: [Ollama](/th/providers/ollama)
    - **คีย์ API**: จัดเก็บคีย์ให้
    - **Vercel AI Gateway (พร็อกซีหลายโมเดล)**: ขอให้ป้อน `AI_GATEWAY_API_KEY`
    - รายละเอียดเพิ่มเติม: [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: ขอ Account ID, Gateway ID และ `CLOUDFLARE_AI_GATEWAY_API_KEY`
    - รายละเอียดเพิ่มเติม: [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
    - **MiniMax**: ระบบจะเขียนการกำหนดค่าโดยอัตโนมัติ ค่าเริ่มต้นสำหรับบริการแบบโฮสต์คือ `MiniMax-M3`
      การตั้งค่าด้วยคีย์ API ใช้ `minimax/...` และการตั้งค่าด้วย OAuth ใช้
      `minimax-portal/...`
    - รายละเอียดเพิ่มเติม: [MiniMax](/th/providers/minimax)
    - **StepFun**: ระบบจะเขียนการกำหนดค่าโดยอัตโนมัติสำหรับ StepFun แบบมาตรฐานหรือ Step Plan บน Endpoint ของจีนหรือทั่วโลก
    - ปัจจุบันแบบมาตรฐานใช้ค่าเริ่มต้นเป็น `step-3.5-flash` ส่วน Step Plan มี `step-3.5-flash-2603` รวมอยู่ด้วย
    - รายละเอียดเพิ่มเติม: [StepFun](/th/providers/stepfun)
    - **Synthetic (เข้ากันได้กับ Anthropic)**: ขอให้ป้อน `SYNTHETIC_API_KEY`
    - รายละเอียดเพิ่มเติม: [Synthetic](/th/providers/synthetic)
    - **Moonshot (Kimi K2)**: ระบบจะเขียนการกำหนดค่าโดยอัตโนมัติ
    - **Kimi Coding**: ระบบจะเขียนการกำหนดค่าโดยอัตโนมัติ
    - รายละเอียดเพิ่มเติม: [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
    - **ผู้ให้บริการแบบกำหนดเอง**: ใช้งานได้กับ Endpoint ที่เข้ากันได้กับ OpenAI, OpenAI Responses หรือ Anthropic แฟล็กสำหรับโหมดไม่โต้ตอบ ได้แก่ `--auth-choice custom-api-key`, `--custom-base-url`, `--custom-model-id`, `--custom-api-key` (ไม่บังคับ โดยจะใช้ `CUSTOM_API_KEY` หากไม่ได้กำหนด), `--custom-provider-id` (ไม่บังคับ โดยอนุมานอัตโนมัติจาก URL ฐาน), `--custom-compatibility openai|openai-responses|anthropic` (ค่าเริ่มต้นคือ `openai`), `--custom-image-input` / `--custom-text-input` (แทนที่การตรวจหาโมเดลภาพที่อนุมานไว้)
    - **ข้าม**: ยังไม่กำหนดค่าการยืนยันตัวตน
    - เลือกโมเดลเริ่มต้นจากตัวเลือกที่ตรวจพบ (หรือป้อนผู้ให้บริการ/โมเดลด้วยตนเอง) เพื่อคุณภาพสูงสุดและลดความเสี่ยงจากการแทรกคำสั่งในพรอมต์ ให้เลือกโมเดลรุ่นล่าสุดที่มีความสามารถสูงสุดในชุดผู้ให้บริการที่ใช้งาน
    - การเริ่มต้นใช้งานจะตรวจสอบโมเดลและเตือนหากไม่รู้จักโมเดลที่กำหนดค่าไว้หรือไม่มีการยืนยันตัวตน
    - โหมดจัดเก็บคีย์ API มีค่าเริ่มต้นเป็นค่าข้อความธรรมดาในโปรไฟล์การยืนยันตัวตน ใช้ `--secret-input-mode ref` เพื่อจัดเก็บการอ้างอิงที่ใช้ตัวแปรสภาพแวดล้อมแทน (ตัวอย่างเช่น `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`) โดยต้องตั้งค่าตัวแปรสภาพแวดล้อมที่อ้างอิงไว้แล้ว มิฉะนั้นการเริ่มต้นใช้งานจะล้มเหลวทันที
    - โปรไฟล์การยืนยันตัวตนอยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (คีย์ API + OAuth) ส่วน `~/.openclaw/credentials/oauth.json` ใช้สำหรับนำเข้ารูปแบบเดิมเท่านั้น
    - รายละเอียดเพิ่มเติม: [OAuth](/th/concepts/oauth)
    <Note>
    เคล็ดลับสำหรับเซิร์ฟเวอร์/ระบบที่ไม่มีส่วนติดต่อผู้ใช้: ดำเนินการ OAuth บนเครื่องที่มีเบราว์เซอร์ให้เสร็จสิ้น แล้วคัดลอก
    `auth-profiles.json` ของเอเจนต์นั้น (ตัวอย่างเช่น
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` หรือพาธ
    `$OPENCLAW_STATE_DIR/...` ที่ตรงกัน) ไปยังโฮสต์ Gateway โดย `credentials/oauth.json`
    เป็นเพียงแหล่งนำเข้ารูปแบบเดิมเท่านั้น
    </Note>
  </Step>
  <Step title="เวิร์กสเปซ">
    - ค่าเริ่มต้นคือ `~/.openclaw/workspace` (กำหนดค่าได้)
    - สร้างไฟล์เริ่มต้นในเวิร์กสเปซที่จำเป็นสำหรับกระบวนการบูตสแตรปเอเจนต์
    - โครงสร้างเวิร์กสเปซฉบับเต็มและคู่มือการสำรองข้อมูล: [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - พอร์ต (ค่าเริ่มต้น **18789**), การ Bind, โหมดการยืนยันตัวตน และการเปิดผ่าน Tailscale
    - คำแนะนำด้านการยืนยันตัวตน: ใช้ **โทเค็น** ต่อไปแม้จะเป็น Loopback เพื่อให้ไคลเอนต์ WS ภายในเครื่องต้องยืนยันตัวตน
    - ในโหมดโทเค็น การตั้งค่าแบบโต้ตอบมีตัวเลือก:
      - **สร้าง/จัดเก็บโทเค็นแบบข้อความธรรมดา** (ค่าเริ่มต้น)
      - **ใช้ SecretRef** (เลือกใช้)
      - Quickstart นำ SecretRef ของ `gateway.auth.token` ที่มีอยู่กลับมาใช้กับผู้ให้บริการ `env`, `file` และ `exec` สำหรับการตรวจสอบระหว่างเริ่มต้นใช้งาน/การบูตสแตรปแดชบอร์ด
      - หากกำหนดค่า SecretRef นั้นไว้แต่ไม่สามารถแก้ไขค่าได้ การเริ่มต้นใช้งานจะล้มเหลวตั้งแต่ต้นพร้อมข้อความวิธีแก้ไขที่ชัดเจน แทนที่จะลดระดับการยืนยันตัวตนของรันไทม์โดยไม่แจ้ง
    - ในโหมดรหัสผ่าน การตั้งค่าแบบโต้ตอบรองรับการจัดเก็บแบบข้อความธรรมดาหรือ SecretRef เช่นกัน
    - พาธ SecretRef ของโทเค็นสำหรับโหมดไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
      - ต้องมีตัวแปรสภาพแวดล้อมที่ไม่ว่างในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน
      - ใช้ร่วมกับ `--gateway-token` ไม่ได้
    - ปิดใช้งานการยืนยันตัวตนเฉพาะเมื่อเชื่อถือทุกกระบวนการภายในเครื่องอย่างสมบูรณ์
    - การ Bind ที่ไม่ใช่ Loopback ยังคงต้องใช้การยืนยันตัวตน

  </Step>
  <Step title="ช่องทาง">
    - [WhatsApp](/th/channels/whatsapp): การเข้าสู่ระบบด้วย QR ซึ่งไม่บังคับ
    - [Telegram](/th/channels/telegram): โทเค็นบอต
    - [Discord](/th/channels/discord): โทเค็นบอต
    - [Google Chat](/th/channels/googlechat): JSON ของบัญชีบริการ + กลุ่มเป้าหมายของ Webhook
    - [Mattermost](/th/channels/mattermost) (Plugin): โทเค็นบอต + URL ฐาน
    - [Signal](/th/channels/signal) (Plugin): การติดตั้ง `signal-cli` ซึ่งไม่บังคับ + การกำหนดค่าบัญชี
    - [iMessage](/th/channels/imessage): พาธ CLI ของ `imsg` + สิทธิ์เข้าถึงฐานข้อมูล Messages ใช้ Wrapper SSH เมื่อ Gateway ทำงานนอก Mac
    - Discord, Feishu, Microsoft Teams, QQ Bot, Slack และช่องทางอื่นๆ จัดส่งมาในรูปแบบ
      Plugin ที่การเริ่มต้นใช้งานสามารถติดตั้งให้ได้ แค็ตตาล็อกฉบับเต็ม: [ช่องทาง](/th/channels)
    - ความปลอดภัยของ DM: ค่าเริ่มต้นคือการจับคู่ DM แรกจะส่งรหัสมา ให้อนุมัติผ่าน `openclaw pairing approve <channel> <code>` หรือใช้รายการอนุญาต

  </Step>
  <Step title="การค้นหาเว็บ">
    - เลือกผู้ให้บริการที่รองรับ เช่น Brave, Codex (Hosted Search), DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Parallel, Perplexity, SearXNG หรือ Tavily (หรือข้าม)
    - ผู้ให้บริการที่ใช้ API สามารถใช้ตัวแปรสภาพแวดล้อมหรือการกำหนดค่าที่มีอยู่เพื่อการตั้งค่าอย่างรวดเร็ว ส่วนผู้ให้บริการที่ไม่ต้องใช้คีย์จะใช้ข้อกำหนดเบื้องต้นเฉพาะของผู้ให้บริการนั้นแทน
    - ข้ามด้วย `--skip-search`
    - กำหนดค่าภายหลัง: `openclaw configure --section web`

  </Step>
  <Step title="การติดตั้งดีมอน">
    - macOS: LaunchAgent
      - ต้องมีเซสชันผู้ใช้ที่เข้าสู่ระบบอยู่ สำหรับระบบที่ไม่มีส่วนติดต่อผู้ใช้ ให้ใช้ LaunchDaemon แบบกำหนดเอง (ไม่ได้จัดส่งมาให้)
    - Linux (และ Windows ผ่าน WSL2): ยูนิตผู้ใช้ systemd
      - การเริ่มต้นใช้งานจะพยายามเปิดใช้งาน Lingering ผ่าน `loginctl enable-linger <user>` เพื่อให้ Gateway ทำงานต่อหลังออกจากระบบ
      - อาจขอ sudo (เขียน `/var/lib/systemd/linger`) โดยจะลองดำเนินการโดยไม่ใช้ sudo ก่อน
    - Windows แบบเนทีฟ: ใช้ Scheduled Task ก่อน หากไม่ได้รับอนุญาตให้สร้างงาน OpenClaw จะเปลี่ยนไปใช้รายการเข้าสู่ระบบในโฟลเดอร์ Startup ของผู้ใช้แต่ละราย และเริ่ม Gateway ทันที
    - **การเลือกรันไทม์:** ต้องใช้ Node เนื่องจากที่จัดเก็บสถานะรันไทม์มาตรฐานใช้ `node:sqlite` บริการ Bun รูปแบบเดิมจะถูกย้ายไปยัง Node ระหว่างการซ่อมแซม
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ `gateway.auth.token` อยู่ภายใต้การจัดการของ SecretRef การติดตั้งดีมอนจะตรวจสอบค่า แต่จะไม่บันทึกค่าโทเค็นข้อความธรรมดาที่แก้ไขแล้วลงในข้อมูลเมตาสภาพแวดล้อมบริการของ Supervisor
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็น แต่ไม่สามารถแก้ไข SecretRef ของโทเค็นที่กำหนดค่าไว้ได้ การติดตั้งดีมอนจะถูกบล็อกพร้อมคำแนะนำที่นำไปปฏิบัติได้
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` แต่ยังไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้งดีมอนจะถูกบล็อกจนกว่าจะกำหนดโหมดอย่างชัดเจน

  </Step>
  <Step title="การตรวจสอบสถานะ">
    - เริ่ม Gateway (หากจำเป็น) และเรียกใช้ `openclaw health`
    - เคล็ดลับ: `openclaw status --deep` เพิ่มการตรวจสอบสถานะ Gateway แบบสดในผลลัพธ์สถานะ รวมถึงการตรวจสอบช่องทางเมื่อรองรับ (ต้องเข้าถึง Gateway ได้)

  </Step>
  <Step title="Skills (แนะนำ)">
    - อ่าน Skills ที่พร้อมใช้งานและตรวจสอบข้อกำหนด
    - ให้เลือกตัวจัดการ Node: **npm / pnpm / bun**
    - ติดตั้ง Dependency ที่ไม่บังคับโดยอัตโนมัติสำหรับ Skills แบบรวมที่เชื่อถือได้ (บางรายการใช้ Homebrew บน macOS)
    - ข้าม Skills ที่ไม่มีข้อกำหนดเบื้องต้นของตัวติดตั้ง Homebrew, uv หรือ Go จัดกลุ่มรายการเหล่านั้นพร้อมคำแนะนำการตั้งค่าด้วยตนเอง และแนะนำให้ใช้ `openclaw doctor` เมื่อติดตั้งข้อกำหนดเบื้องต้นแล้ว

  </Step>
  <Step title="เสร็จสิ้น">
    - ข้อมูลสรุป + ขั้นตอนถัดไป รวมถึงพรอมต์ **ต้องการฟักเอเจนต์ด้วยวิธีใด** สำหรับ Terminal, Browser หรือดำเนินการภายหลัง

  </Step>
</Steps>

<Note>
หากตรวจไม่พบ GUI การเริ่มต้นใช้งานจะแสดงคำแนะนำการส่งต่อพอร์ต SSH สำหรับ Control UI แทนการเปิดเบราว์เซอร์
หากไม่มีแอสเซ็ตของ Control UI การเริ่มต้นใช้งานจะพยายามสร้างแอสเซ็ตเหล่านั้น โดยมีตัวเลือกสำรองเป็น `pnpm ui:build` (ติดตั้งการขึ้นต่อกันของ UI โดยอัตโนมัติ)
</Note>

## โหมดไม่โต้ตอบ

ใช้ `--non-interactive --accept-risk` เพื่อทำให้การเริ่มต้นใช้งานเป็นแบบอัตโนมัติหรือใช้ในสคริปต์ (
แฟล็กนี้เป็นการยอมรับความเสี่ยงที่จำเป็น หากไม่มีแฟล็กนี้ การเริ่มต้นใช้งาน
จะออกพร้อมข้อผิดพลาด):

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

เพิ่ม `--json` เพื่อรับข้อมูลสรุปที่เครื่องอ่านได้

SecretRef ของโทเค็น Gateway ในโหมดไม่โต้ตอบ:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` และ `--gateway-token-ref-env` ไม่สามารถใช้ร่วมกันได้

<Note>
`--json` **ไม่ได้** หมายถึงโหมดไม่โต้ตอบ ใช้ `--non-interactive --accept-risk` (และ `--workspace`) สำหรับสคริปต์
</Note>

ตัวอย่างคำสั่งเฉพาะผู้ให้บริการอยู่ใน [การทำงานอัตโนมัติด้วย CLI](/th/start/wizard-cli-automation#provider-specific-examples)
ใช้หน้าอ้างอิงนี้สำหรับความหมายของแฟล็กและลำดับขั้นตอน

### เพิ่มเอเจนต์ (ไม่โต้ตอบ)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` เป็น ID เอเจนต์ที่สงวนไว้และไม่สามารถใช้กับ `openclaw agents add` ได้

## RPC ของวิซาร์ด Gateway

Gateway เปิดให้ใช้งานโฟลว์การเริ่มต้นใช้งานผ่าน RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`)
ไคลเอนต์ (แอป macOS, Control UI) สามารถแสดงผลขั้นตอนต่างๆ ได้โดยไม่ต้องนำตรรกะการเริ่มต้นใช้งานไปสร้างใหม่

## การตั้งค่า Signal (signal-cli)

การเริ่มต้นใช้งานจะตรวจสอบว่า `signal-cli` อยู่ใน `PATH` หรือไม่ และหากไม่พบ จะเสนอให้ติดตั้ง:

- Linux x86-64: ดาวน์โหลดบิลด์ GraalVM แบบเนทีฟอย่างเป็นทางการจากรีลีส GitHub ของ `signal-cli` และจัดเก็บไว้ภายใต้ `~/.openclaw/tools/signal-cli/<version>/`
- macOS และสถาปัตยกรรมอื่นๆ: ติดตั้งผ่าน Homebrew แทน
- Windows แบบเนทีฟ: ยังไม่รองรับ ให้เรียกใช้การเริ่มต้นใช้งานภายใน WSL2 เพื่อใช้เส้นทางการติดตั้งสำหรับ Linux
- ไม่ว่าในกรณีใด จะเขียน `channels.signal.cliPath` ลงในการกำหนดค่าของคุณ

## สิ่งที่วิซาร์ดเขียน

ฟิลด์ทั่วไปใน `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` เมื่อส่ง `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (หากเลือก Minimax)
- `tools.profile` (การเริ่มต้นใช้งานภายในเครื่องใช้ค่าเริ่มต้นเป็น `"coding"` เมื่อยังไม่ได้ตั้งค่า โดยจะคงค่าที่กำหนดไว้อย่างชัดเจนอยู่แล้ว)
- `gateway.*` (โหมด, การผูก, การยืนยันตัวตน, tailscale)
- `session.dmScope` (การเริ่มต้นใช้งานภายในเครื่องใช้ค่าเริ่มต้นเป็น `"per-channel-peer"` เมื่อยังไม่ได้ตั้งค่า โดยจะคงค่าที่กำหนดไว้อย่างชัดเจนอยู่แล้ว รายละเอียด: [ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- รายการอนุญาต DM ของช่องทางเมื่อคุณเลือกใช้ระหว่างพรอมต์ของช่องทาง Discord, Matrix, Microsoft Teams และ Slack จะแปลงชื่อเป็น ID เมื่อเป็นไปได้ ส่วนช่องทางอื่นจะรับ ID โดยตรง (เช่น ID ผู้ส่ง Telegram แบบตัวเลขหรือหมายเลขโทรศัพท์ WhatsApp)
- `skills.install.nodeManager`
  - `setup --node-manager` ยอมรับ `npm`, `pnpm` หรือ `bun`
  - การกำหนดค่าด้วยตนเองยังคงใช้ `yarn` ได้โดยตั้งค่า `skills.install.nodeManager` โดยตรง
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` เขียน `agents.list[]` และ `bindings` ที่เป็นทางเลือก

ข้อมูลประจำตัวของ WhatsApp จะอยู่ภายใต้ `~/.openclaw/credentials/whatsapp/<accountId>/`
เซสชันที่ใช้งานอยู่และบทถอดเสียงจะจัดเก็บไว้ใน
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` ไดเรกทอรี
`~/.openclaw/agents/<agentId>/sessions/` ใช้สำหรับอินพุตการย้ายข้อมูลแบบเดิม
และอาร์ติแฟกต์สำหรับการเก็บถาวร/การสนับสนุน

ช่องทางบางรายการให้บริการในรูปแบบ Plugin เมื่อเลือกช่องทางดังกล่าวระหว่างการตั้งค่า การเริ่มต้นใช้งาน
จะแจ้งให้ติดตั้งช่องทางนั้น (ผ่าน npm หรือพาธภายในเครื่อง) ก่อนจึงจะสามารถกำหนดค่าได้

## เอกสารที่เกี่ยวข้อง

- ภาพรวมการเริ่มต้นใช้งาน: [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
- ข้อมูลอ้างอิงการตั้งค่า CLI: [ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference)
- การเริ่มต้นใช้งานแอป macOS: [การเริ่มต้นใช้งาน](/th/start/onboarding)
- ข้อมูลอ้างอิงการกำหนดค่า: [การกำหนดค่า Gateway](/th/gateway/configuration)
- ผู้ให้บริการ: [WhatsApp](/th/channels/whatsapp), [Telegram](/th/channels/telegram), [Discord](/th/channels/discord), [Google Chat](/th/channels/googlechat), [Signal](/th/channels/signal), [iMessage](/th/channels/imessage)
- Skills: [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config)
