---
read_when:
    - การค้นหาขั้นตอนการเริ่มต้นใช้งานหรือแฟล็กที่เฉพาะเจาะจง
    - ทำให้การเริ่มต้นใช้งานเป็นอัตโนมัติด้วยโหมดไม่โต้ตอบ
    - การดีบักพฤติกรรมการเริ่มต้นใช้งาน
sidebarTitle: Onboarding Reference
summary: 'เอกสารอ้างอิงฉบับเต็มสำหรับการเริ่มใช้งาน CLI: ทุกขั้นตอน แฟล็ก และฟิลด์การกำหนดค่า'
title: ข้อมูลอ้างอิงการเริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-05-10T19:57:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: be3e45f152700f02a212a390cdc02d5432ff531716a089f531de3bb6cc368cc9
    source_path: reference/wizard.md
    workflow: 16
---

นี่คือข้อมูลอ้างอิงฉบับเต็มสำหรับ `openclaw onboard`
สำหรับภาพรวมระดับสูง โปรดดู [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)

## รายละเอียด Flow (โหมด local)

<Steps>
  <Step title="Existing config detection">
    - หากมี `~/.openclaw/openclaw.json` อยู่แล้ว ให้เลือก **คงค่าปัจจุบันไว้**, **ตรวจทานและอัปเดต** หรือ **รีเซ็ตก่อนตั้งค่า**
    - การเรียกใช้ onboarding ซ้ำจะ **ไม่** ล้างข้อมูลใด ๆ เว้นแต่คุณจะเลือก **รีเซ็ต** อย่างชัดเจน
      (หรือส่ง `--reset`)
    - CLI `--reset` มีค่าเริ่มต้นเป็น `config+creds+sessions`; ใช้ `--reset-scope full`
      เพื่อลบ workspace ด้วย
    - หาก config ไม่ถูกต้องหรือมีคีย์ legacy ตัวช่วยสร้างจะหยุดและขอให้
      คุณเรียกใช้ `openclaw doctor` ก่อนดำเนินการต่อ
    - การรีเซ็ตใช้ `trash` (ไม่ใช้ `rm`) และมีขอบเขตให้เลือก:
      - เฉพาะ Config
      - Config + credentials + sessions
      - รีเซ็ตทั้งหมด (ลบ workspace ด้วย)

  </Step>
  <Step title="Model/Auth">
    - **คีย์ Anthropic API**: ใช้ `ANTHROPIC_API_KEY` หากมีอยู่ หรือถามหาคีย์ แล้วบันทึกไว้สำหรับให้ daemon ใช้งาน
    - **คีย์ Anthropic API**: ตัวเลือกผู้ช่วย Anthropic ที่แนะนำใน onboarding/configure
    - **Anthropic setup-token**: ยังใช้งานได้ใน onboarding/configure แม้ตอนนี้ OpenClaw จะแนะนำให้ใช้ Claude CLI ซ้ำเมื่อพร้อมใช้งาน
    - **การสมัครใช้งาน OpenAI Code (Codex) (OAuth)**: Flow ผ่านเบราว์เซอร์; วาง `code#state`
      - ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` ผ่าน Codex runtime เมื่อยังไม่ได้ตั้งค่า model หรือเป็นตระกูล OpenAI อยู่แล้ว
    - **การสมัครใช้งาน OpenAI Code (Codex) (การจับคู่อุปกรณ์)**: Flow การจับคู่ผ่านเบราว์เซอร์ด้วยรหัสอุปกรณ์อายุสั้น
      - ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` ผ่าน Codex runtime เมื่อยังไม่ได้ตั้งค่า model หรือเป็นตระกูล OpenAI อยู่แล้ว
    - **คีย์ OpenAI API**: ใช้ `OPENAI_API_KEY` หากมีอยู่ หรือถามหาคีย์ แล้วจัดเก็บไว้ใน auth profiles
      - ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` เมื่อยังไม่ได้ตั้งค่า model, เป็น `openai/*`, หรือ `openai-codex/*`
    - **คีย์ xAI (Grok) API**: ถามหา `XAI_API_KEY` และกำหนดค่า xAI เป็นผู้ให้บริการ model
    - **OpenCode**: ถามหา `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`, รับได้ที่ https://opencode.ai/auth) และให้คุณเลือกแค็ตตาล็อก Zen หรือ Go
    - **Ollama**: เสนอ **Cloud + Local**, **Cloud only** หรือ **Local only** ก่อน `Cloud only` จะถามหา `OLLAMA_API_KEY` และใช้ `https://ollama.com`; โหมดที่ใช้ host จะถามหา Ollama base URL, ค้นหา model ที่พร้อมใช้งาน และ auto-pull model local ที่เลือกเมื่อจำเป็น; `Cloud + Local` จะตรวจด้วยว่า Ollama host นั้นลงชื่อเข้าใช้เพื่อเข้าถึง cloud แล้วหรือไม่
    - รายละเอียดเพิ่มเติม: [Ollama](/th/providers/ollama)
    - **คีย์ API**: จัดเก็บคีย์ให้คุณ
    - **Vercel AI Gateway (พร็อกซีหลาย model)**: ถามหา `AI_GATEWAY_API_KEY`
    - รายละเอียดเพิ่มเติม: [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: ถามหา Account ID, Gateway ID และ `CLOUDFLARE_AI_GATEWAY_API_KEY`
    - รายละเอียดเพิ่มเติม: [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
    - **MiniMax**: config จะถูกเขียนให้อัตโนมัติ; ค่า hosted เริ่มต้นคือ `MiniMax-M2.7`
      การตั้งค่าด้วยคีย์ API ใช้ `minimax/...` และการตั้งค่าด้วย OAuth ใช้
      `minimax-portal/...`
    - รายละเอียดเพิ่มเติม: [MiniMax](/th/providers/minimax)
    - **StepFun**: config จะถูกเขียนให้อัตโนมัติสำหรับ StepFun มาตรฐานหรือ Step Plan บน endpoint ของจีนหรือทั่วโลก
    - ปัจจุบันแบบมาตรฐานมี `step-3.5-flash` และ Step Plan ยังมี `step-3.5-flash-2603` ด้วย
    - รายละเอียดเพิ่มเติม: [StepFun](/th/providers/stepfun)
    - **Synthetic (เข้ากันได้กับ Anthropic)**: ถามหา `SYNTHETIC_API_KEY`
    - รายละเอียดเพิ่มเติม: [Synthetic](/th/providers/synthetic)
    - **Moonshot (Kimi K2)**: config จะถูกเขียนให้อัตโนมัติ
    - **Kimi Coding**: config จะถูกเขียนให้อัตโนมัติ
    - รายละเอียดเพิ่มเติม: [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
    - **ข้าม**: ยังไม่ได้กำหนดค่า auth
    - เลือก model เริ่มต้นจากตัวเลือกที่ตรวจพบ (หรือป้อน provider/model ด้วยตนเอง) เพื่อคุณภาพที่ดีที่สุดและลดความเสี่ยงจาก prompt injection ให้เลือก model รุ่นล่าสุดที่แข็งแกร่งที่สุดที่พร้อมใช้งานใน provider stack ของคุณ
    - Onboarding จะเรียกใช้การตรวจสอบ model และเตือนหาก model ที่กำหนดค่าไม่รู้จักหรือไม่มี auth
    - โหมดการจัดเก็บคีย์ API มีค่าเริ่มต้นเป็นค่า auth-profile แบบ plaintext ใช้ `--secret-input-mode ref` เพื่อจัดเก็บเป็น refs ที่อิง env แทน (ตัวอย่างเช่น `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
    - Auth profiles อยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (คีย์ API + OAuth) `~/.openclaw/credentials/oauth.json` เป็นแบบ legacy สำหรับนำเข้าเท่านั้น
    - รายละเอียดเพิ่มเติม: [/concepts/oauth](/th/concepts/oauth)
    <Note>
    เคล็ดลับสำหรับ headless/server: ทำ OAuth ให้เสร็จบนเครื่องที่มีเบราว์เซอร์ แล้วคัดลอก
    `auth-profiles.json` ของ agent นั้น (ตัวอย่างเช่น
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` หรือ path
    `$OPENCLAW_STATE_DIR/...` ที่ตรงกัน) ไปยัง host ของ gateway `credentials/oauth.json`
    เป็นเพียงแหล่งนำเข้า legacy เท่านั้น
    </Note>
  </Step>
  <Step title="Workspace">
    - ค่าเริ่มต้น `~/.openclaw/workspace` (กำหนดค่าได้)
    - สร้างไฟล์ workspace ที่จำเป็นสำหรับพิธี bootstrap ของ agent
    - ผัง workspace แบบเต็ม + คู่มือสำรองข้อมูล: [Workspace ของ Agent](/th/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port, bind, โหมด auth, การเปิดเผยผ่าน Tailscale
    - คำแนะนำด้าน auth: คง **Token** ไว้แม้สำหรับ loopback เพื่อให้ client WS แบบ local ต้อง authenticate
    - ในโหมด token การตั้งค่าแบบโต้ตอบจะเสนอ:
      - **สร้าง/จัดเก็บ token แบบ plaintext** (ค่าเริ่มต้น)
      - **ใช้ SecretRef** (เลือกใช้)
      - Quickstart ใช้ SecretRefs ของ `gateway.auth.token` ที่มีอยู่ซ้ำใน provider `env`, `file` และ `exec` สำหรับ onboarding probe/dashboard bootstrap
      - หากกำหนดค่า SecretRef นั้นไว้แต่ resolve ไม่ได้ onboarding จะล้มเหลวตั้งแต่ต้นพร้อมข้อความแก้ไขที่ชัดเจน แทนที่จะลดระดับ runtime auth แบบเงียบ ๆ
    - ในโหมด password การตั้งค่าแบบโต้ตอบยังรองรับการจัดเก็บแบบ plaintext หรือ SecretRef ด้วย
    - path SecretRef ของ token แบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
      - ต้องมี env var ที่ไม่ว่างเปล่าในสภาพแวดล้อมของกระบวนการ onboarding
      - ใช้ร่วมกับ `--gateway-token` ไม่ได้
    - ปิด auth เฉพาะเมื่อคุณเชื่อถือกระบวนการ local ทุกตัวอย่างเต็มที่
    - Bind ที่ไม่ใช่ loopback ยังต้องใช้ auth

  </Step>
  <Step title="Channels">
    - [WhatsApp](/th/channels/whatsapp): การเข้าสู่ระบบด้วย QR แบบไม่บังคับ
    - [Telegram](/th/channels/telegram): bot token
    - [Discord](/th/channels/discord): bot token
    - [Google Chat](/th/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/th/channels/mattermost) (plugin): bot token + base URL
    - [Signal](/th/channels/signal): การติดตั้ง `signal-cli` แบบไม่บังคับ + config บัญชี
    - [iMessage](/th/channels/imessage): path ของ CLI `imsg` + สิทธิ์เข้าถึง Messages DB; ใช้ SSH wrapper เมื่อ Gateway ทำงานนอก Mac
    - ความปลอดภัยของ DM: ค่าเริ่มต้นคือการจับคู่ DM แรกจะส่งรหัส; อนุมัติผ่าน `openclaw pairing approve <channel> <code>` หรือใช้ allowlists

  </Step>
  <Step title="Web search">
    - เลือก provider ที่รองรับ เช่น Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG หรือ Tavily (หรือข้าม)
    - Provider ที่ใช้ API สามารถใช้ env vars หรือ config ที่มีอยู่สำหรับการตั้งค่าแบบรวดเร็ว; provider ที่ไม่ต้องใช้คีย์จะใช้ข้อกำหนดเฉพาะของ provider นั้นแทน
    - ข้ามด้วย `--skip-search`
    - กำหนดค่าภายหลัง: `openclaw configure --section web`

  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - ต้องมี session ผู้ใช้ที่ logged-in; สำหรับ headless ให้ใช้ LaunchDaemon แบบกำหนดเอง (ไม่ได้จัดส่งมาด้วย)
    - Linux (และ Windows ผ่าน WSL2): systemd user unit
      - Onboarding จะพยายามเปิดใช้ lingering ผ่าน `loginctl enable-linger <user>` เพื่อให้ Gateway ยังคงทำงานหลัง logout
      - อาจถามหา sudo (เขียน `/var/lib/systemd/linger`); จะลองโดยไม่ใช้ sudo ก่อน
    - **การเลือก Runtime:** Node (แนะนำ; จำเป็นสำหรับ WhatsApp/Telegram) Bun **ไม่แนะนำ**
    - หาก token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef การติดตั้ง daemon จะตรวจสอบความถูกต้อง แต่จะไม่ persist ค่า token plaintext ที่ resolve แล้วลงใน metadata สภาพแวดล้อมของ supervisor service
    - หาก token auth ต้องใช้ token และ token SecretRef ที่กำหนดค่าไว้ยัง resolve ไม่ได้ การติดตั้ง daemon จะถูกบล็อกพร้อมคำแนะนำที่นำไปปฏิบัติได้
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และยังไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้ง daemon จะถูกบล็อกจนกว่าจะตั้งค่าโหมดอย่างชัดเจน

  </Step>
  <Step title="Health check">
    - เริ่ม Gateway (หากจำเป็น) และเรียกใช้ `openclaw health`
    - เคล็ดลับ: `openclaw status --deep` เพิ่ม live gateway health probe ลงในผลลัพธ์ status รวมถึง channel probes เมื่อรองรับ (ต้องมี gateway ที่เข้าถึงได้)

  </Step>
  <Step title="Skills (recommended)">
    - อ่าน Skills ที่พร้อมใช้งานและตรวจสอบข้อกำหนด
    - ให้คุณเลือก node manager: **npm / pnpm** (ไม่แนะนำ bun)
    - ติดตั้ง dependency แบบไม่บังคับ (บางรายการใช้ Homebrew บน macOS)

  </Step>
  <Step title="Finish">
    - สรุป + ขั้นตอนถัดไป รวมถึง prompt **คุณต้องการ hatch agent ของคุณอย่างไร?** สำหรับ Terminal, Browser หรือทำภายหลัง

  </Step>
</Steps>

<Note>
หากตรวจไม่พบ GUI onboarding จะพิมพ์คำแนะนำ SSH port-forward สำหรับ Control UI แทนการเปิดเบราว์เซอร์
หาก asset ของ Control UI หายไป onboarding จะพยายาม build ให้; fallback คือ `pnpm ui:build` (ติดตั้ง UI deps ให้อัตโนมัติ)
</Note>

## โหมดไม่โต้ตอบ

ใช้ `--non-interactive` เพื่อทำ onboarding แบบอัตโนมัติหรือ script:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

เพิ่ม `--json` เพื่อให้ได้สรุปที่เครื่องอ่านได้

Gateway token SecretRef ในโหมดไม่โต้ตอบ:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` และ `--gateway-token-ref-env` ใช้ร่วมกันไม่ได้

<Note>
`--json` **ไม่ได้** หมายถึงโหมดไม่โต้ตอบ ใช้ `--non-interactive` (และ `--workspace`) สำหรับ scripts
</Note>

ตัวอย่างคำสั่งเฉพาะ provider อยู่ใน [การทำ CLI Automation](/th/start/wizard-cli-automation#provider-specific-examples)
ใช้หน้าอ้างอิงนี้สำหรับความหมายของ flag และลำดับขั้นตอน

### เพิ่ม agent (ไม่โต้ตอบ)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC ของตัวช่วยสร้าง Gateway

Gateway เปิดเผย Flow onboarding ผ่าน RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`)
Clients (แอป macOS, Control UI) สามารถ render ขั้นตอนได้โดยไม่ต้อง implement logic onboarding ใหม่

## การตั้งค่า Signal (`signal-cli`)

Onboarding สามารถติดตั้ง `signal-cli` จาก GitHub releases ได้:

- ดาวน์โหลด release asset ที่เหมาะสม
- จัดเก็บไว้ใต้ `~/.openclaw/tools/signal-cli/<version>/`
- เขียน `channels.signal.cliPath` ลงใน config ของคุณ

หมายเหตุ:

- JVM builds ต้องใช้ **Java 21**
- Native builds จะถูกใช้เมื่อพร้อมใช้งาน
- Windows ใช้ WSL2; การติดตั้ง signal-cli ทำตาม Flow ของ Linux ภายใน WSL

## สิ่งที่ตัวช่วยสร้างเขียน

ฟิลด์ทั่วไปใน `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (หากเลือก Minimax)
- `tools.profile` (การเริ่มต้นใช้งานในเครื่องตั้งค่าเริ่มต้นเป็น `"coding"` เมื่อไม่ได้ตั้งค่าไว้; ค่าที่ระบุไว้อย่างชัดเจนเดิมจะถูกคงไว้)
- `gateway.*` (โหมด, bind, การยืนยันตัวตน, tailscale)
- `session.dmScope` (รายละเอียดพฤติกรรม: [ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- รายการอนุญาตของช่อง (Slack/Discord/Matrix/Microsoft Teams) เมื่อคุณเลือกใช้ในระหว่างพรอมป์ (ชื่อจะถูกแปลงเป็น ID เมื่อทำได้)
- `skills.install.nodeManager`
  - `setup --node-manager` ยอมรับ `npm`, `pnpm` หรือ `bun`
  - การกำหนดค่าด้วยตนเองยังคงใช้ `yarn` ได้โดยตั้งค่า `skills.install.nodeManager` โดยตรง
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` จะเขียน `agents.list[]` และ `bindings` ที่เป็นตัวเลือก

ข้อมูลประจำตัวของ WhatsApp จะอยู่ภายใต้ `~/.openclaw/credentials/whatsapp/<accountId>/`
เซสชันจะถูกเก็บไว้ภายใต้ `~/.openclaw/agents/<agentId>/sessions/`

บางช่องถูกส่งมอบเป็น Plugin เมื่อคุณเลือกช่องหนึ่งระหว่างการตั้งค่า การเริ่มต้นใช้งาน
จะแจ้งให้ติดตั้งช่องนั้น (npm หรือพาธภายในเครื่อง) ก่อนจึงจะกำหนดค่าได้

## เอกสารที่เกี่ยวข้อง

- ภาพรวมการเริ่มต้นใช้งาน: [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
- การเริ่มต้นใช้งานแอป macOS: [การเริ่มต้นใช้งาน](/th/start/onboarding)
- ข้อมูลอ้างอิงการกำหนดค่า: [การกำหนดค่า Gateway](/th/gateway/configuration)
- ผู้ให้บริการ: [WhatsApp](/th/channels/whatsapp), [Telegram](/th/channels/telegram), [Discord](/th/channels/discord), [Google Chat](/th/channels/googlechat), [Signal](/th/channels/signal), [iMessage](/th/channels/imessage)
- Skills: [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config)
