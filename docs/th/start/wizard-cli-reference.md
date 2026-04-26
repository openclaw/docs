---
read_when:
    - คุณต้องการรายละเอียดพฤติกรรมของ `openclaw onboard`
    - คุณกำลังดีบักผลลัพธ์ของ onboarding หรือกำลังผสานรวมไคลเอนต์ onboarding
sidebarTitle: CLI reference
summary: ข้อมูลอ้างอิงฉบับสมบูรณ์สำหรับโฟลว์การตั้งค่า CLI, การตั้งค่า auth/model, เอาต์พุต และรายละเอียดภายใน
title: ข้อมูลอ้างอิงการตั้งค่า CLI
x-i18n:
    generated_at: "2026-04-26T11:42:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967fd6734d8facaa732b40567c33e48434208bf861d102adc8a4ee042f13041
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

หน้านี้เป็นข้อมูลอ้างอิงฉบับสมบูรณ์สำหรับ `openclaw onboard`
สำหรับคู่มือแบบสั้น ดู [Onboarding (CLI)](/th/start/wizard)

## วิซาร์ดนี้ทำอะไรบ้าง

โหมด local (ค่าเริ่มต้น) จะพาคุณทำทีละขั้นตอน:

- การตั้งค่าโมเดลและ auth (OpenAI Code subscription OAuth, Anthropic Claude CLI หรือ API key รวมถึงตัวเลือก MiniMax, GLM, Ollama, Moonshot, StepFun และ AI Gateway)
- ตำแหน่ง workspace และไฟล์ bootstrap
- การตั้งค่า Gateway (port, bind, auth, tailscale)
- Channels และ providers (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles และ bundled channel plugins อื่น ๆ)
- การติดตั้ง daemon (LaunchAgent, systemd user unit หรือ Windows Scheduled Task แบบ native พร้อม Startup-folder fallback)
- การตรวจสอบสถานะสุขภาพ
- การตั้งค่า Skills

โหมด remote จะกำหนดค่าเครื่องนี้ให้เชื่อมต่อกับ Gateway ที่อยู่ที่อื่น
โดยจะไม่ติดตั้งหรือแก้ไขอะไรบนโฮสต์ระยะไกล

## รายละเอียดโฟลว์แบบ local

<Steps>
  <Step title="การตรวจจับ config ที่มีอยู่">
    - หากมี `~/.openclaw/openclaw.json` อยู่แล้ว ให้เลือก Keep, Modify หรือ Reset
    - การรันวิซาร์ดซ้ำจะไม่ลบอะไร เว้นแต่คุณจะเลือก Reset อย่างชัดเจน (หรือส่ง `--reset`)
    - CLI `--reset` ใช้ค่าเริ่มต้นเป็น `config+creds+sessions`; ใช้ `--reset-scope full` เพื่อลบ workspace ด้วย
    - หาก config ไม่ถูกต้องหรือมี legacy keys วิซาร์ดจะหยุดและขอให้คุณรัน `openclaw doctor` ก่อนดำเนินการต่อ
    - Reset ใช้ `trash` และมีขอบเขตให้เลือก:
      - เฉพาะ config
      - Config + credentials + sessions
      - รีเซ็ตทั้งหมด (ลบ workspace ด้วย)
  </Step>
  <Step title="โมเดลและ auth">
    - ตัวเลือกทั้งหมดอยู่ใน [Auth and model options](#auth-and-model-options)
  </Step>
  <Step title="Workspace">
    - ค่าเริ่มต้นคือ `~/.openclaw/workspace` (กำหนดค่าได้)
    - สร้างไฟล์ workspace ที่จำเป็นสำหรับ first-run bootstrap ritual
    - เลย์เอาต์ของ workspace: [Agent workspace](/th/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - จะถามหา port, bind, auth mode และการเปิดเผยผ่าน tailscale
    - คำแนะนำ: ควรเปิดใช้ token auth ไว้แม้สำหรับ loopback เพื่อให้ WS clients ในเครื่องต้องยืนยันตัวตน
    - ในโหมด token การตั้งค่าแบบ interactive มีตัวเลือก:
      - **Generate/store plaintext token** (ค่าเริ่มต้น)
      - **Use SecretRef** (เลือกใช้ได้)
    - ในโหมด password การตั้งค่าแบบ interactive ก็รองรับการเก็บแบบ plaintext หรือ SecretRef เช่นกัน
    - พาธ SecretRef แบบ non-interactive สำหรับ token: `--gateway-token-ref-env <ENV_VAR>`
      - ต้องมี env var ที่ไม่ว่างอยู่ใน environment ของกระบวนการ onboarding
      - ใช้ร่วมกับ `--gateway-token` ไม่ได้
    - ปิด auth เฉพาะเมื่อคุณเชื่อถือทุก process ในเครื่องอย่างสมบูรณ์
    - bind แบบ non-loopback ยังคงต้องใช้ auth
  </Step>
  <Step title="Channels">
    - [WhatsApp](/th/channels/whatsapp): การเข้าสู่ระบบด้วย QR แบบเลือกใช้
    - [Telegram](/th/channels/telegram): bot token
    - [Discord](/th/channels/discord): bot token
    - [Google Chat](/th/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/th/channels/mattermost): bot token + base URL
    - [Signal](/th/channels/signal): ติดตั้ง `signal-cli` แบบเลือกใช้ + config บัญชี
    - [BlueBubbles](/th/channels/bluebubbles): แนะนำสำหรับ iMessage; server URL + password + webhook
    - [iMessage](/th/channels/imessage): พาธ CLI `imsg` แบบ legacy + การเข้าถึง DB
    - ความปลอดภัยของ DM: ค่าเริ่มต้นคือการจับคู่ DM แรกจะส่งโค้ด ให้อนุมัติผ่าน
      `openclaw pairing approve <channel> <code>` หรือใช้ allowlists
  </Step>
  <Step title="การติดตั้ง daemon">
    - macOS: LaunchAgent
      - ต้องใช้เซสชันผู้ใช้ที่ล็อกอินอยู่; หากเป็นแบบ headless ให้ใช้ LaunchDaemon แบบกำหนดเอง (ไม่ได้จัดส่งมาให้)
    - Linux และ Windows ผ่าน WSL2: systemd user unit
      - วิซาร์ดจะพยายามรัน `loginctl enable-linger <user>` เพื่อให้ Gateway ทำงานต่อหลัง logout
      - อาจขอ sudo (เขียนไปที่ `/var/lib/systemd/linger`); จะลองโดยไม่ใช้ sudo ก่อน
    - Windows แบบ native: Scheduled Task ก่อน
      - หากการสร้าง task ถูกปฏิเสธ OpenClaw จะ fallback ไปใช้ login item ใน Startup folder แบบต่อผู้ใช้ และเริ่ม Gateway ทันที
      - Scheduled Tasks ยังเป็นตัวเลือกที่แนะนำกว่า เพราะให้สถานะ supervisor ที่ดีกว่า
    - การเลือก runtime: Node (แนะนำ; จำเป็นสำหรับ WhatsApp และ Telegram) ไม่แนะนำให้ใช้ Bun
  </Step>
  <Step title="การตรวจสอบสถานะสุขภาพ">
    - เริ่ม Gateway (หากจำเป็น) และรัน `openclaw health`
    - `openclaw status --deep` จะเพิ่ม live gateway health probe ลงในผลลัพธ์สถานะ รวมถึง channel probes เมื่อรองรับ
  </Step>
  <Step title="Skills">
    - อ่าน Skills ที่มีอยู่และตรวจสอบข้อกำหนด
    - ให้คุณเลือก node manager: npm, pnpm หรือ bun
    - ติดตั้ง dependencies แบบ optional (บางรายการใช้ Homebrew บน macOS)
  </Step>
  <Step title="เสร็จสิ้น">
    - สรุปและขั้นตอนถัดไป รวมถึงตัวเลือกแอป iOS, Android และ macOS
  </Step>
</Steps>

<Note>
หากไม่พบ GUI วิซาร์ดจะแสดงคำแนะนำ SSH port-forward สำหรับ Control UI แทนการเปิดเบราว์เซอร์
หากไม่มี assets ของ Control UI วิซาร์ดจะพยายาม build ให้; fallback คือ `pnpm ui:build` (ติดตั้ง UI deps อัตโนมัติ)
</Note>

## รายละเอียดโหมด remote

โหมด remote จะกำหนดค่าเครื่องนี้ให้เชื่อมต่อกับ Gateway ที่อยู่ที่อื่น

<Info>
โหมด remote จะไม่ติดตั้งหรือแก้ไขอะไรบนโฮสต์ระยะไกล
</Info>

สิ่งที่คุณต้องตั้งค่า:

- URL ของ Gateway ระยะไกล (`ws://...`)
- Token หาก Gateway ระยะไกลต้องใช้ auth (แนะนำ)

<Note>
- หาก Gateway เปิดให้ใช้ได้เฉพาะ loopback ให้ใช้ SSH tunneling หรือ tailnet
- คำใบ้สำหรับการค้นหา:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## ตัวเลือก auth และโมเดล

<AccordionGroup>
  <Accordion title="Anthropic API key">
    ใช้ `ANTHROPIC_API_KEY` หากมีอยู่ หรือถามหา key แล้วบันทึกไว้เพื่อใช้กับ daemon
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    โฟลว์ผ่านเบราว์เซอร์; วาง `code#state`

    ตั้งค่า `agents.defaults.model` เป็น `openai-codex/gpt-5.5` เมื่อยังไม่ได้ตั้งค่า model หรือเป็นตระกูล OpenAI อยู่แล้ว

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    โฟลว์จับคู่ผ่านเบราว์เซอร์ด้วย device code ที่มีอายุสั้น

    ตั้งค่า `agents.defaults.model` เป็น `openai-codex/gpt-5.5` เมื่อยังไม่ได้ตั้งค่า model หรือเป็นตระกูล OpenAI อยู่แล้ว

  </Accordion>
  <Accordion title="OpenAI API key">
    ใช้ `OPENAI_API_KEY` หากมีอยู่ หรือถามหา key จากนั้นจัดเก็บ credential ไว้ใน auth profiles

    ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` เมื่อ model ยังไม่ได้ตั้งค่า เป็น `openai/*` หรือ `openai-codex/*`

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    จะถามหา `XAI_API_KEY` และกำหนดค่า xAI เป็น model provider
  </Accordion>
  <Accordion title="OpenCode">
    จะถามหา `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) และให้คุณเลือก Zen หรือ Go catalog
    URL สำหรับการตั้งค่า: [opencode.ai/auth](https://opencode.ai/auth)
  </Accordion>
  <Accordion title="API key (generic)">
    จัดเก็บ key ให้คุณ
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
    เขียน config ให้อัตโนมัติ ค่าเริ่มต้นแบบ hosted คือ `MiniMax-M2.7`; การตั้งค่าด้วย API key ใช้
    `minimax/...` และการตั้งค่าด้วย OAuth ใช้ `minimax-portal/...`
    รายละเอียดเพิ่มเติม: [MiniMax](/th/providers/minimax)
  </Accordion>
  <Accordion title="StepFun">
    เขียน config ให้อัตโนมัติสำหรับ StepFun standard หรือ Step Plan บน endpoints ของจีนหรือ global
    ปัจจุบัน Standard มี `step-3.5-flash` และ Step Plan ก็มี `step-3.5-flash-2603` ด้วย
    รายละเอียดเพิ่มเติม: [StepFun](/th/providers/stepfun)
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    จะถามหา `SYNTHETIC_API_KEY`
    รายละเอียดเพิ่มเติม: [Synthetic](/th/providers/synthetic)
  </Accordion>
  <Accordion title="Ollama (Cloud and local open models)">
    จะถาม `Cloud + Local`, `Cloud only` หรือ `Local only` ก่อน
    `Cloud only` ใช้ `OLLAMA_API_KEY` กับ `https://ollama.com`
    โหมดที่มี host backing จะถามหา base URL (ค่าเริ่มต้น `http://127.0.0.1:11434`), ค้นหาโมเดลที่มี และแนะนำค่าเริ่มต้น
    `Cloud + Local` จะตรวจสอบด้วยว่า Ollama host นั้นลงชื่อเข้าใช้สำหรับ cloud access แล้วหรือไม่
    รายละเอียดเพิ่มเติม: [Ollama](/th/providers/ollama)
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    จะเขียน configs ของ Moonshot (Kimi K2) และ Kimi Coding ให้อัตโนมัติ
    รายละเอียดเพิ่มเติม: [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
  </Accordion>
  <Accordion title="Custom provider">
    ใช้งานได้กับ endpoints แบบ OpenAI-compatible และ Anthropic-compatible

    onboarding แบบ interactive รองรับตัวเลือกการจัดเก็บ API key แบบเดียวกับโฟลว์ API key ของ provider อื่น:
    - **Paste API key now** (plaintext)
    - **Use secret reference** (env ref หรือ provider ref ที่กำหนดค่าไว้ พร้อมการตรวจสอบล่วงหน้า)

    flags แบบ non-interactive:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (ไม่บังคับ; fallback ไปที่ `CUSTOM_API_KEY`)
    - `--custom-provider-id` (ไม่บังคับ)
    - `--custom-compatibility <openai|anthropic>` (ไม่บังคับ; ค่าเริ่มต้น `openai`)

  </Accordion>
  <Accordion title="Skip">
    ปล่อยให้ auth ไม่มีการกำหนดค่า
  </Accordion>
</AccordionGroup>

พฤติกรรมของโมเดล:

- เลือกโมเดลเริ่มต้นจากตัวเลือกที่ตรวจพบ หรือป้อน provider และ model ด้วยตนเอง
- เมื่อ onboarding เริ่มจากตัวเลือก auth ของ provider ตัวเลือก model จะให้ความสำคัญกับ
  provider นั้นโดยอัตโนมัติ สำหรับ Volcengine และ BytePlus การตั้งค่าความสำคัญแบบเดียวกัน
  จะจับคู่กับตัวแปร coding-plan ของทั้งคู่ด้วย (`volcengine-plan/*`,
  `byteplus-plan/*`)
- หากตัวกรอง preferred-provider นั้นจะว่าง ตัวเลือกจะ fallback ไปยัง
  แคตตาล็อกทั้งหมดแทนที่จะไม่แสดงโมเดลเลย
- วิซาร์ดจะรัน model check และเตือนหาก model ที่กำหนดค่าไว้ไม่รู้จักหรือไม่มี auth

พาธของ credentials และ profiles:

- Auth profiles (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- การนำเข้า OAuth แบบ legacy: `~/.openclaw/credentials/oauth.json`

โหมดการจัดเก็บ credential:

- พฤติกรรม onboarding ค่าเริ่มต้นจะเก็บ API keys เป็นค่า plaintext ใน auth profiles
- `--secret-input-mode ref` จะเปิดโหมดอ้างอิงแทนการเก็บ key แบบ plaintext
  ในการตั้งค่าแบบ interactive คุณสามารถเลือกได้อย่างใดอย่างหนึ่ง:
  - environment variable ref (ตัวอย่างเช่น `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - configured provider ref (`file` หรือ `exec`) พร้อม provider alias + id
- โหมดอ้างอิงแบบ interactive จะรันการตรวจสอบล่วงหน้าแบบเร็วก่อนบันทึก
  - Env refs: ตรวจสอบชื่อตัวแปร + ค่าที่ไม่ว่างใน onboarding environment ปัจจุบัน
  - Provider refs: ตรวจสอบ provider config และ resolve id ที่ร้องขอ
  - หากการตรวจสอบล่วงหน้าล้มเหลว onboarding จะแสดงข้อผิดพลาดและให้คุณลองใหม่
- ในโหมด non-interactive, `--secret-input-mode ref` รองรับเฉพาะแบบอิง env
  - ตั้งค่า provider env var ใน onboarding process environment
  - inline key flags (ตัวอย่างเช่น `--openai-api-key`) ต้องมี env var นั้นตั้งไว้; มิฉะนั้น onboarding จะล้มเหลวทันที
  - สำหรับ custom providers, โหมด `ref` แบบ non-interactive จะเก็บ `models.providers.<id>.apiKey` เป็น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`
  - ในกรณี custom-provider นี้ `--custom-api-key` ต้องมีการตั้งค่า `CUSTOM_API_KEY` ไว้; มิฉะนั้น onboarding จะล้มเหลวทันที
- Gateway auth credentials รองรับทั้งตัวเลือก plaintext และ SecretRef ในการตั้งค่าแบบ interactive:
  - โหมด token: **Generate/store plaintext token** (ค่าเริ่มต้น) หรือ **Use SecretRef**
  - โหมด password: plaintext หรือ SecretRef
- พาธ SecretRef ของ token แบบ non-interactive: `--gateway-token-ref-env <ENV_VAR>`
- การตั้งค่า plaintext ที่มีอยู่ยังคงทำงานได้ต่อไปโดยไม่เปลี่ยนแปลง

<Note>
คำแนะนำสำหรับระบบ headless และเซิร์ฟเวอร์: ทำ OAuth ให้เสร็จบนเครื่องที่มีเบราว์เซอร์ แล้วคัดลอก
`auth-profiles.json` ของ agent นั้น (ตัวอย่างเช่น
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` หรือพาธ
`$OPENCLAW_STATE_DIR/...` ที่ตรงกัน) ไปยังโฮสต์ Gateway `credentials/oauth.json`
เป็นเพียงแหล่งนำเข้าแบบ legacy เท่านั้น
</Note>

## เอาต์พุตและรายละเอียดภายใน

ฟิลด์ทั่วไปใน `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` เมื่อส่ง `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (หากเลือก Minimax)
- `tools.profile` (onboarding แบบ local จะตั้งค่าเริ่มต้นเป็น `"coding"` เมื่อยังไม่ได้ตั้งค่า; ค่าที่ตั้งไว้อย่างชัดเจนอยู่แล้วจะยังคงเดิม)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (onboarding แบบ local จะตั้งค่านี้เป็น `per-channel-peer` เมื่อยังไม่ได้ตั้งค่า; ค่าที่ตั้งไว้อย่างชัดเจนอยู่แล้วจะยังคงเดิม)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- allowlists ของ channel (Slack, Discord, Matrix, Microsoft Teams) เมื่อคุณเลือกใช้ระหว่าง prompts (ชื่อจะถูก resolve เป็น IDs เมื่อทำได้)
- `skills.install.nodeManager`
  - flag `setup --node-manager` รองรับ `npm`, `pnpm` หรือ `bun`
  - การกำหนดค่าด้วยตนเองยังคงตั้ง `skills.install.nodeManager: "yarn"` ได้ในภายหลัง
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` จะเขียน `agents.list[]` และ `bindings` แบบ optional

credentials ของ WhatsApp จะอยู่ใต้ `~/.openclaw/credentials/whatsapp/<accountId>/`
sessions จะถูกเก็บไว้ใต้ `~/.openclaw/agents/<agentId>/sessions/`

<Note>
บาง channels ถูกจัดส่งมาในรูปแบบ Plugins เมื่อถูกเลือกในระหว่างการตั้งค่า วิซาร์ด
จะถามให้ติดตั้ง Plugin (npm หรือ local path) ก่อนการกำหนดค่า channel
</Note>

Gateway wizard RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

ไคลเอนต์ (แอป macOS และ Control UI) สามารถแสดงผลขั้นตอนต่าง ๆ ได้โดยไม่ต้องนำตรรกะ onboarding ไปเขียนใหม่

พฤติกรรมการตั้งค่า Signal:

- ดาวน์โหลด release asset ที่เหมาะสม
- จัดเก็บไว้ใต้ `~/.openclaw/tools/signal-cli/<version>/`
- เขียน `channels.signal.cliPath` ลงใน config
- บิลด์ JVM ต้องใช้ Java 21
- ใช้บิลด์แบบ native เมื่อมีให้ใช้
- Windows ใช้ WSL2 และทำตามโฟลว์ signal-cli ของ Linux ภายใน WSL

## เอกสารที่เกี่ยวข้อง

- ศูนย์รวม onboarding: [Onboarding (CLI)](/th/start/wizard)
- ระบบอัตโนมัติและสคริปต์: [CLI Automation](/th/start/wizard-cli-automation)
- ข้อมูลอ้างอิงคำสั่ง: [`openclaw onboard`](/th/cli/onboard)
