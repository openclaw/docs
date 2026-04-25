---
read_when:
    - คุณต้องการรายละเอียดพฤติกรรมของ `openclaw onboard`
    - คุณกำลังดีบักผลลัพธ์ของ onboarding หรือกำลังผสานไคลเอนต์ onboarding เข้าด้วยกัน
sidebarTitle: CLI reference
summary: ข้อมูลอ้างอิงฉบับสมบูรณ์สำหรับ flow การตั้งค่า CLI, การตั้งค่า auth/โมเดล, เอาต์พุต และรายละเอียดภายใน
title: ข้อมูลอ้างอิงการตั้งค่า CLI
x-i18n:
    generated_at: "2026-04-25T13:59:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 951b8f0b0b6b70faaa6faafad998e74183f79aa8c4c50f622b24df786f1feea7
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

หน้านี้คือข้อมูลอ้างอิงฉบับสมบูรณ์สำหรับ `openclaw onboard`
สำหรับคู่มือแบบย่อ ดู [Onboarding (CLI)](/th/start/wizard)

## ตัวช่วยตั้งค่าทำอะไรบ้าง

โหมด local (ค่าเริ่มต้น) จะพาคุณทำขั้นตอนต่อไปนี้:

- การตั้งค่าโมเดลและ auth (OpenAI Code subscription OAuth, Anthropic Claude CLI หรือ API key รวมถึงตัวเลือก MiniMax, GLM, Ollama, Moonshot, StepFun และ AI Gateway)
- ตำแหน่ง workspace และไฟล์ bootstrap
- การตั้งค่า Gateway (port, bind, auth, tailscale)
- Channels และ providers (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles และ plugin ช่องทางอื่น ๆ ที่มีมาในตัว)
- การติดตั้ง daemon (LaunchAgent, systemd user unit หรือ Windows Scheduled Task แบบเนทีฟพร้อม fallback ไปยัง Startup folder)
- การตรวจสอบสุขภาพระบบ
- การตั้งค่า Skills

โหมด remote จะกำหนดค่าเครื่องนี้ให้เชื่อมต่อกับ gateway ที่อยู่ที่อื่น
โดยจะไม่ติดตั้งหรือแก้ไขสิ่งใดบนโฮสต์ระยะไกล

## รายละเอียด flow แบบ local

<Steps>
  <Step title="การตรวจจับ config ที่มีอยู่">
    - หากมี `~/.openclaw/openclaw.json` อยู่แล้ว ให้เลือก Keep, Modify หรือ Reset
    - การรันตัวช่วยตั้งค่าซ้ำจะไม่ล้างอะไร เว้นแต่คุณจะเลือก Reset อย่างชัดเจน (หรือส่ง `--reset`)
    - CLI `--reset` จะใช้ค่าเริ่มต้นเป็น `config+creds+sessions`; ใช้ `--reset-scope full` หากต้องการลบ workspace ด้วย
    - หาก config ไม่ถูกต้องหรือมีคีย์แบบเดิม ตัวช่วยตั้งค่าจะหยุดและขอให้คุณรัน `openclaw doctor` ก่อนดำเนินการต่อ
    - การรีเซ็ตใช้ `trash` และมีขอบเขตให้เลือก:
      - เฉพาะ Config
      - Config + credentials + sessions
      - รีเซ็ตทั้งหมด (รวมถึงลบ workspace)
  </Step>
  <Step title="โมเดลและ auth">
    - ตารางตัวเลือกทั้งหมดอยู่ใน [ตัวเลือก auth และโมเดล](#auth-and-model-options)
  </Step>
  <Step title="Workspace">
    - ค่าเริ่มต้นคือ `~/.openclaw/workspace` (กำหนดค่าได้)
    - วางไฟล์ workspace ที่จำเป็นสำหรับ bootstrap ritual ครั้งแรก
    - โครงสร้าง workspace: [Agent workspace](/th/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - จะถามถึง port, bind, โหมด auth และการเปิดใช้งาน tailscale
    - คำแนะนำ: ควรเปิดใช้ token auth ไว้แม้สำหรับ loopback เพื่อให้ไคลเอนต์ WS ในเครื่องต้องยืนยันตัวตน
    - ในโหมด token การตั้งค่าแบบโต้ตอบจะมีตัวเลือก:
      - **Generate/store plaintext token** (ค่าเริ่มต้น)
      - **Use SecretRef** (ต้องเลือกเปิดเอง)
    - ในโหมด password การตั้งค่าแบบโต้ตอบก็รองรับทั้งการเก็บแบบ plaintext หรือ SecretRef
    - เส้นทาง SecretRef สำหรับ token แบบ non-interactive: `--gateway-token-ref-env <ENV_VAR>`
      - ต้องมีตัวแปร env ที่ไม่ว่างใน environment ของกระบวนการ onboarding
      - ใช้ร่วมกับ `--gateway-token` ไม่ได้
    - ปิด auth เฉพาะเมื่อคุณเชื่อถือทุก process ในเครื่องอย่างสมบูรณ์
    - bind ที่ไม่ใช่ loopback ยังคงต้องใช้ auth
  </Step>
  <Step title="Channels">
    - [WhatsApp](/th/channels/whatsapp): การล็อกอินด้วย QR แบบไม่บังคับ
    - [Telegram](/th/channels/telegram): bot token
    - [Discord](/th/channels/discord): bot token
    - [Google Chat](/th/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/th/channels/mattermost): bot token + base URL
    - [Signal](/th/channels/signal): การติดตั้ง `signal-cli` แบบไม่บังคับ + config บัญชี
    - [BlueBubbles](/th/channels/bluebubbles): แนะนำสำหรับ iMessage; server URL + password + webhook
    - [iMessage](/th/channels/imessage): เส้นทาง CLI `imsg` แบบเดิม + การเข้าถึงฐานข้อมูล
    - ความปลอดภัยของ DM: ค่าเริ่มต้นคือการจับคู่ การส่ง DM ครั้งแรกจะส่งโค้ดมา; อนุมัติผ่าน
      `openclaw pairing approve <channel> <code>` หรือใช้ allowlist
  </Step>
  <Step title="การติดตั้ง daemon">
    - macOS: LaunchAgent
      - ต้องมี user session ที่ล็อกอินอยู่; หากเป็น headless ให้ใช้ LaunchDaemon แบบกำหนดเอง (ไม่มีมาให้)
    - Linux และ Windows ผ่าน WSL2: systemd user unit
      - ตัวช่วยตั้งค่าจะพยายามรัน `loginctl enable-linger <user>` เพื่อให้ gateway ทำงานต่อหลังออกจากระบบ
      - อาจขอ sudo (เขียนที่ `/var/lib/systemd/linger`); จะลองโดยไม่ใช้ sudo ก่อน
    - Windows แบบเนทีฟ: ใช้ Scheduled Task ก่อน
      - หากการสร้าง task ถูกปฏิเสธ OpenClaw จะ fallback ไปใช้ login item ใน Startup folder ของผู้ใช้ และเริ่ม gateway ทันที
      - Scheduled Task ยังคงเป็นตัวเลือกที่แนะนำเพราะให้สถานะ supervisor ที่ดีกว่า
    - การเลือก runtime: Node (แนะนำ; จำเป็นสำหรับ WhatsApp และ Telegram) ไม่แนะนำ Bun
  </Step>
  <Step title="การตรวจสอบสุขภาพระบบ">
    - เริ่ม gateway (หากจำเป็น) และรัน `openclaw health`
    - `openclaw status --deep` จะเพิ่ม live gateway health probe ลงในเอาต์พุตสถานะ รวมถึง channel probe เมื่อรองรับ
  </Step>
  <Step title="Skills">
    - อ่าน Skills ที่มีอยู่และตรวจสอบข้อกำหนด
    - ให้คุณเลือก node manager: npm, pnpm หรือ bun
    - ติดตั้ง dependency แบบไม่บังคับ (บางตัวใช้ Homebrew บน macOS)
  </Step>
  <Step title="เสร็จสิ้น">
    - สรุปและขั้นตอนถัดไป รวมถึงตัวเลือกแอป iOS, Android และ macOS
  </Step>
</Steps>

<Note>
หากไม่พบ GUI ตัวช่วยตั้งค่าจะพิมพ์คำสั่ง SSH port-forward สำหรับ Control UI แทนการเปิดเบราว์เซอร์
หากไม่มี asset ของ Control UI ตัวช่วยตั้งค่าจะพยายาม build ให้; fallback คือ `pnpm ui:build` (ติดตั้ง dependency ของ UI ให้อัตโนมัติ)
</Note>

## รายละเอียดโหมด remote

โหมด remote จะกำหนดค่าเครื่องนี้ให้เชื่อมต่อกับ gateway ที่อยู่ที่อื่น

<Info>
โหมด remote จะไม่ติดตั้งหรือแก้ไขสิ่งใดบนโฮสต์ระยะไกล
</Info>

สิ่งที่คุณตั้งค่า:

- URL ของ remote gateway (`ws://...`)
- token หาก remote gateway ต้องใช้ auth (แนะนำ)

<Note>
- หาก gateway จำกัดไว้เฉพาะ loopback ให้ใช้ SSH tunneling หรือ tailnet
- คำใบ้ในการค้นหา:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## ตัวเลือก auth และโมเดล

<AccordionGroup>
  <Accordion title="Anthropic API key">
    ใช้ `ANTHROPIC_API_KEY` หากมีอยู่ หรือจะถามหา key แล้วบันทึกไว้ให้ daemon ใช้งาน
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    flow ผ่านเบราว์เซอร์; วาง `code#state`

    ตั้งค่า `agents.defaults.model` เป็น `openai-codex/gpt-5.5` เมื่อยังไม่ได้ตั้งโมเดล หรือเป็นตระกูล OpenAI อยู่แล้ว

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    flow การจับคู่ผ่านเบราว์เซอร์ด้วย device code แบบชั่วคราว

    ตั้งค่า `agents.defaults.model` เป็น `openai-codex/gpt-5.5` เมื่อยังไม่ได้ตั้งโมเดล หรือเป็นตระกูล OpenAI อยู่แล้ว

  </Accordion>
  <Accordion title="OpenAI API key">
    ใช้ `OPENAI_API_KEY` หากมีอยู่ หรือจะถามหา key แล้วเก็บ credential ไว้ใน auth profiles

    ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.4` เมื่อโมเดลยังไม่ถูกตั้งค่า เป็น `openai/*` หรือ `openai-codex/*`

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    จะถามหา `XAI_API_KEY` และกำหนดค่า xAI เป็น provider ของโมเดล
  </Accordion>
  <Accordion title="OpenCode">
    จะถามหา `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) และให้คุณเลือก catalog แบบ Zen หรือ Go
    URL สำหรับการตั้งค่า: [opencode.ai/auth](https://opencode.ai/auth)
  </Accordion>
  <Accordion title="API key (generic)">
    จะเก็บ key ให้คุณ
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    จะถามหา `AI_GATEWAY_API_KEY`
    รายละเอียดเพิ่มเติม: [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    จะถามหา account ID, gateway ID และ `CLOUDFLARE_AI_GATEWAY_API_KEY`
    รายละเอียดเพิ่มเติม: [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
  </Accordion>
  <Accordion title="MiniMax">
    ระบบจะเขียน config ให้อัตโนมัติ ค่าเริ่มต้นแบบ hosted คือ `MiniMax-M2.7`; การตั้งค่าด้วย API key ใช้
    `minimax/...` และการตั้งค่าด้วย OAuth ใช้ `minimax-portal/...`
    รายละเอียดเพิ่มเติม: [MiniMax](/th/providers/minimax)
  </Accordion>
  <Accordion title="StepFun">
    ระบบจะเขียน config ให้อัตโนมัติสำหรับ StepFun standard หรือ Step Plan บน endpoint จีนหรือ global
    ปัจจุบัน Standard มี `step-3.5-flash` และ Step Plan มี `step-3.5-flash-2603` ด้วย
    รายละเอียดเพิ่มเติม: [StepFun](/th/providers/stepfun)
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    จะถามหา `SYNTHETIC_API_KEY`
    รายละเอียดเพิ่มเติม: [Synthetic](/th/providers/synthetic)
  </Accordion>
  <Accordion title="Ollama (Cloud and local open models)">
    จะถามก่อนว่าจะใช้ `Cloud + Local`, `Cloud only` หรือ `Local only`
    `Cloud only` ใช้ `OLLAMA_API_KEY` กับ `https://ollama.com`
    โหมดที่ใช้โฮสต์จะถามหา base URL (ค่าเริ่มต้น `http://127.0.0.1:11434`), ค้นหาโมเดลที่ใช้ได้ และแนะนำค่าเริ่มต้น
    `Cloud + Local` จะตรวจด้วยว่า Ollama host นั้นลงชื่อเข้าใช้เพื่อเข้าถึง cloud แล้วหรือยัง
    รายละเอียดเพิ่มเติม: [Ollama](/th/providers/ollama)
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    ระบบจะเขียน config ของ Moonshot (Kimi K2) และ Kimi Coding ให้อัตโนมัติ
    รายละเอียดเพิ่มเติม: [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
  </Accordion>
  <Accordion title="Custom provider">
    ใช้งานได้กับ endpoint ที่เข้ากันได้กับ OpenAI และ Anthropic

    onboarding แบบโต้ตอบรองรับตัวเลือกการเก็บ API key แบบเดียวกับ flow API key ของ provider อื่น ๆ:
    - **Paste API key now** (plaintext)
    - **Use secret reference** (env ref หรือ configured provider ref พร้อม preflight validation)

    แฟล็กแบบ non-interactive:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (ไม่บังคับ; ใช้ `CUSTOM_API_KEY` เป็น fallback)
    - `--custom-provider-id` (ไม่บังคับ)
    - `--custom-compatibility <openai|anthropic>` (ไม่บังคับ; ค่าเริ่มต้น `openai`)

  </Accordion>
  <Accordion title="Skip">
    ปล่อยให้ auth ยังไม่ได้กำหนดค่า
  </Accordion>
</AccordionGroup>

พฤติกรรมของโมเดล:

- เลือกโมเดลเริ่มต้นจากตัวเลือกที่ตรวจพบ หรือป้อน provider และโมเดลเอง
- เมื่อ onboarding เริ่มจากตัวเลือก auth ของ provider ตัวเลือกโมเดลจะให้ความสำคัญกับ
  provider นั้นโดยอัตโนมัติ สำหรับ Volcengine และ BytePlus การให้ความสำคัญแบบเดียวกันนี้
  ยังจับคู่กับตัวแปร coding-plan ของทั้งคู่ด้วย (`volcengine-plan/*`,
  `byteplus-plan/*`)
- หากการกรองตาม preferred provider นั้นไม่มีผลลัพธ์ ตัวเลือกโมเดลจะ fallback ไปยัง catalog ทั้งหมดแทนการแสดงว่าไม่มีโมเดล
- ตัวช่วยตั้งค่าจะรันการตรวจสอบโมเดลและเตือนหากโมเดลที่กำหนดค่าไว้ไม่รู้จักหรือไม่มี auth

เส้นทาง credential และ profile:

- Auth profiles (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- การ import OAuth แบบเดิม: `~/.openclaw/credentials/oauth.json`

โหมดการจัดเก็บ credential:

- พฤติกรรม onboarding เริ่มต้นจะบันทึก API key เป็นค่า plaintext ใน auth profiles
- `--secret-input-mode ref` เปิดใช้โหมดอ้างอิงแทนการเก็บ key แบบ plaintext
  ในการตั้งค่าแบบโต้ตอบ คุณสามารถเลือกได้ทั้ง:
  - การอ้างอิงตัวแปร environment (เช่น `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - การอ้างอิง provider ที่กำหนดค่าไว้ (`file` หรือ `exec`) พร้อม alias + id ของ provider
- โหมดอ้างอิงแบบโต้ตอบจะรันการตรวจสอบ preflight แบบรวดเร็วก่อนบันทึก
  - Env refs: ตรวจสอบชื่อตัวแปรและค่าที่ไม่ว่างใน environment ของ onboarding ปัจจุบัน
  - Provider refs: ตรวจสอบ config ของ provider และ resolve id ที่ร้องขอ
  - หาก preflight ล้มเหลว onboarding จะแสดงข้อผิดพลาดและให้คุณลองใหม่
- ในโหมด non-interactive, `--secret-input-mode ref` รองรับเฉพาะแบบอิง env
  - ตั้งค่าตัวแปร env ของ provider ใน environment ของกระบวนการ onboarding
  - แฟล็ก key แบบ inline (เช่น `--openai-api-key`) ต้องมีการตั้งค่าตัวแปร env นั้น มิฉะนั้น onboarding จะล้มเหลวทันที
  - สำหรับ custom provider โหมด `ref` แบบ non-interactive จะเก็บ `models.providers.<id>.apiKey` เป็น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`
  - ในกรณี custom provider นี้ `--custom-api-key` ต้องมีการตั้งค่า `CUSTOM_API_KEY` มิฉะนั้น onboarding จะล้มเหลวทันที
- credential สำหรับ Gateway auth รองรับทั้งแบบ plaintext และ SecretRef ในการตั้งค่าแบบโต้ตอบ:
  - โหมด token: **Generate/store plaintext token** (ค่าเริ่มต้น) หรือ **Use SecretRef**
  - โหมด password: plaintext หรือ SecretRef
- เส้นทาง SecretRef สำหรับ token แบบ non-interactive: `--gateway-token-ref-env <ENV_VAR>`
- การตั้งค่าแบบ plaintext ที่มีอยู่เดิมยังคงใช้งานได้ตามเดิม

<Note>
คำแนะนำสำหรับระบบ headless และเซิร์ฟเวอร์: ทำ OAuth ให้เสร็จบนเครื่องที่มีเบราว์เซอร์ แล้วคัดลอก
`auth-profiles.json` ของ agent นั้น (เช่น
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` หรือพาธ
`$OPENCLAW_STATE_DIR/...` ที่ตรงกัน) ไปยังโฮสต์ gateway `credentials/oauth.json`
เป็นเพียงแหล่ง import แบบเดิมเท่านั้น
</Note>

## เอาต์พุตและรายละเอียดภายใน

ฟิลด์ทั่วไปใน `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` เมื่อส่ง `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (หากเลือก Minimax)
- `tools.profile` (onboarding แบบ local จะตั้งค่าเริ่มต้นเป็น `"coding"` เมื่อยังไม่ได้ตั้งค่าไว้; ค่าที่กำหนดไว้อย่างชัดเจนอยู่แล้วจะถูกรักษาไว้)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (onboarding แบบ local จะตั้งค่าเริ่มต้นนี้เป็น `per-channel-peer` เมื่อยังไม่ได้ตั้งค่าไว้; ค่าที่กำหนดไว้อย่างชัดเจนอยู่แล้วจะถูกรักษาไว้)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- allowlist ของ channel (Slack, Discord, Matrix, Microsoft Teams) เมื่อคุณเลือกเปิดใช้ระหว่าง prompt (ชื่อจะถูก resolve เป็น ID เมื่อทำได้)
- `skills.install.nodeManager`
  - แฟล็ก `setup --node-manager` รองรับ `npm`, `pnpm` หรือ `bun`
  - config แบบกำหนดเองยังสามารถตั้งค่า `skills.install.nodeManager: "yarn"` ภายหลังได้
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` จะเขียนไปที่ `agents.list[]` และ `bindings` แบบไม่บังคับ

credentials ของ WhatsApp จะอยู่ภายใต้ `~/.openclaw/credentials/whatsapp/<accountId>/`
sessions จะถูกเก็บไว้ภายใต้ `~/.openclaw/agents/<agentId>/sessions/`

<Note>
บาง channel ถูกจัดส่งมาในรูปแบบ Plugin เมื่อถูกเลือกในระหว่างการตั้งค่า ตัวช่วยตั้งค่า
จะถามให้ติดตั้ง Plugin (npm หรือ local path) ก่อนกำหนดค่า channel
</Note>

Gateway wizard RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

ไคลเอนต์ (แอป macOS และ Control UI) สามารถเรนเดอร์ขั้นตอนได้โดยไม่ต้องนำตรรกะ onboarding ไปเขียนใหม่

พฤติกรรมการตั้งค่า Signal:

- ดาวน์โหลด release asset ที่เหมาะสม
- จัดเก็บไว้ภายใต้ `~/.openclaw/tools/signal-cli/<version>/`
- เขียน `channels.signal.cliPath` ลงใน config
- build แบบ JVM ต้องใช้ Java 21
- จะใช้ build แบบเนทีฟเมื่อมีให้ใช้งาน
- Windows ใช้ WSL2 และทำตาม flow ของ signal-cli บน Linux ภายใน WSL

## เอกสารที่เกี่ยวข้อง

- ศูนย์รวม onboarding: [Onboarding (CLI)](/th/start/wizard)
- ระบบอัตโนมัติและสคริปต์: [CLI Automation](/th/start/wizard-cli-automation)
- ข้อมูลอ้างอิงคำสั่ง: [`openclaw onboard`](/th/cli/onboard)
