---
read_when:
    - การค้นหาขั้นตอนการเริ่มต้นใช้งานหรือแฟล็กเฉพาะ
    - ทำให้การเริ่มต้นใช้งานเป็นอัตโนมัติด้วยโหมดไม่โต้ตอบ
    - การดีบักพฤติกรรมการเริ่มต้นใช้งาน
sidebarTitle: Onboarding Reference
summary: 'คู่มืออ้างอิงฉบับสมบูรณ์สำหรับการเริ่มใช้งาน CLI: ทุกขั้นตอน แฟล็ก และฟิลด์การกำหนดค่า'
title: ข้อมูลอ้างอิงการเริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-04-30T10:16:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 412008af223cd14f744a0b553ab82f233eb482ca9991bd418f29b09b33d93de4
    source_path: reference/wizard.md
    workflow: 16
---

นี่คือเอกสารอ้างอิงฉบับเต็มสำหรับ `openclaw onboard`
สำหรับภาพรวมระดับสูง ดู [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)

## รายละเอียด Flow (โหมด local)

<Steps>
  <Step title="การตรวจพบ config ที่มีอยู่">
    - หากมี `~/.openclaw/openclaw.json` ให้เลือก **เก็บไว้ / แก้ไข / รีเซ็ต**
    - การเรียกใช้ onboarding อีกครั้งจะ **ไม่** ลบสิ่งใด เว้นแต่คุณจะเลือก **รีเซ็ต** อย่างชัดเจน
      (หรือส่ง `--reset`)
    - CLI `--reset` มีค่าเริ่มต้นเป็น `config+creds+sessions`; ใช้ `--reset-scope full`
      เพื่อลบ workspace ด้วย
    - หาก config ไม่ถูกต้องหรือมี key แบบ legacy wizard จะหยุดและขอให้
      คุณเรียกใช้ `openclaw doctor` ก่อนดำเนินการต่อ
    - การรีเซ็ตใช้ `trash` (ไม่ใช้ `rm`) และมีขอบเขตให้เลือก:
      - เฉพาะ Config
      - Config + credentials + sessions
      - รีเซ็ตทั้งหมด (ลบ workspace ด้วย)

  </Step>
  <Step title="โมเดล/Auth">
    - **Anthropic API key**: ใช้ `ANTHROPIC_API_KEY` หากมีอยู่ หรือแจ้งให้ป้อน key แล้วบันทึกไว้สำหรับ daemon ใช้งาน
    - **Anthropic API key**: ตัวเลือกผู้ช่วย Anthropic ที่แนะนำใน onboarding/configure
    - **Anthropic setup-token**: ยังใช้ได้ใน onboarding/configure แม้ตอนนี้ OpenClaw จะเลือกใช้ Claude CLI ซ้ำเมื่อพร้อมใช้งาน
    - **OpenAI Code (Codex) subscription (OAuth)**: Flow ผ่านเบราว์เซอร์; วาง `code#state`
      - ตั้งค่า `agents.defaults.model` เป็น `openai-codex/gpt-5.5` เมื่อยังไม่ได้ตั้งค่าโมเดลหรือเป็นตระกูล OpenAI อยู่แล้ว
    - **OpenAI Code (Codex) subscription (device pairing)**: Flow การจับคู่ผ่านเบราว์เซอร์ด้วย device code อายุสั้น
      - ตั้งค่า `agents.defaults.model` เป็น `openai-codex/gpt-5.5` เมื่อยังไม่ได้ตั้งค่าโมเดลหรือเป็นตระกูล OpenAI อยู่แล้ว
    - **OpenAI API key**: ใช้ `OPENAI_API_KEY` หากมีอยู่ หรือแจ้งให้ป้อน key แล้วเก็บไว้ใน auth profiles
      - ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` เมื่อยังไม่ได้ตั้งค่าโมเดล, เป็น `openai/*`, หรือ `openai-codex/*`
    - **xAI (Grok) API key**: แจ้งให้ป้อน `XAI_API_KEY` และกำหนดค่า xAI เป็นผู้ให้บริการโมเดล
    - **OpenCode**: แจ้งให้ป้อน `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`, รับได้ที่ https://opencode.ai/auth) และให้คุณเลือกแค็ตตาล็อก Zen หรือ Go
    - **Ollama**: เสนอ **Cloud + Local**, **Cloud only**, หรือ **Local only** ก่อน `Cloud only` จะแจ้งให้ป้อน `OLLAMA_API_KEY` และใช้ `https://ollama.com`; โหมดที่อิง host จะแจ้งให้ป้อน Ollama base URL, ค้นหาโมเดลที่มีอยู่, และ auto-pull โมเดล local ที่เลือกเมื่อจำเป็น; `Cloud + Local` ยังตรวจสอบด้วยว่า host Ollama นั้นลงชื่อเข้าใช้เพื่อเข้าถึง cloud แล้วหรือไม่
    - รายละเอียดเพิ่มเติม: [Ollama](/th/providers/ollama)
    - **API key**: เก็บ key ให้คุณ
    - **Vercel AI Gateway (พร็อกซีหลายโมเดล)**: แจ้งให้ป้อน `AI_GATEWAY_API_KEY`
    - รายละเอียดเพิ่มเติม: [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: แจ้งให้ป้อน Account ID, Gateway ID, และ `CLOUDFLARE_AI_GATEWAY_API_KEY`
    - รายละเอียดเพิ่มเติม: [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
    - **MiniMax**: config จะถูกเขียนอัตโนมัติ; ค่าเริ่มต้นแบบ hosted คือ `MiniMax-M2.7`
      การตั้งค่า API-key ใช้ `minimax/...` และการตั้งค่า OAuth ใช้
      `minimax-portal/...`
    - รายละเอียดเพิ่มเติม: [MiniMax](/th/providers/minimax)
    - **StepFun**: config จะถูกเขียนอัตโนมัติสำหรับ StepFun standard หรือ Step Plan บน endpoint ของจีนหรือทั่วโลก
    - ปัจจุบัน Standard มี `step-3.5-flash` และ Step Plan มี `step-3.5-flash-2603` ด้วย
    - รายละเอียดเพิ่มเติม: [StepFun](/th/providers/stepfun)
    - **Synthetic (เข้ากันได้กับ Anthropic)**: แจ้งให้ป้อน `SYNTHETIC_API_KEY`
    - รายละเอียดเพิ่มเติม: [Synthetic](/th/providers/synthetic)
    - **Moonshot (Kimi K2)**: config จะถูกเขียนอัตโนมัติ
    - **Kimi Coding**: config จะถูกเขียนอัตโนมัติ
    - รายละเอียดเพิ่มเติม: [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
    - **ข้าม**: ยังไม่ได้กำหนดค่า auth
    - เลือกโมเดลเริ่มต้นจากตัวเลือกที่ตรวจพบ (หรือป้อน provider/model ด้วยตนเอง) เพื่อคุณภาพที่ดีที่สุดและลดความเสี่ยงจาก prompt-injection ให้เลือกโมเดลรุ่นล่าสุดที่ทรงพลังที่สุดในสแต็กผู้ให้บริการของคุณ
    - Onboarding จะเรียกใช้การตรวจสอบโมเดลและเตือนหากโมเดลที่กำหนดค่าไว้ไม่เป็นที่รู้จักหรือไม่มี auth
    - โหมดจัดเก็บ API key มีค่าเริ่มต้นเป็นค่า auth-profile แบบ plaintext ใช้ `--secret-input-mode ref` เพื่อจัดเก็บ ref ที่อิง env แทน (เช่น `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
    - Auth profiles อยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API keys + OAuth) `~/.openclaw/credentials/oauth.json` เป็น legacy สำหรับนำเข้าเท่านั้น
    - รายละเอียดเพิ่มเติม: [/concepts/oauth](/th/concepts/oauth)
    <Note>
    เคล็ดลับสำหรับ headless/server: ทำ OAuth ให้เสร็จบนเครื่องที่มีเบราว์เซอร์ แล้วคัดลอก
    `auth-profiles.json` ของ agent นั้น (เช่น
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, หรือ path
    `$OPENCLAW_STATE_DIR/...` ที่ตรงกัน) ไปยัง host ของ Gateway `credentials/oauth.json`
    เป็นเพียงแหล่งนำเข้าแบบ legacy เท่านั้น
    </Note>
  </Step>
  <Step title="Workspace">
    - ค่าเริ่มต้น `~/.openclaw/workspace` (กำหนดค่าได้)
    - สร้างไฟล์ workspace ที่จำเป็นสำหรับพิธี bootstrap ของ agent
    - แผนผัง workspace แบบเต็ม + คู่มือสำรองข้อมูล: [Agent workspace](/th/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - พอร์ต, bind, โหมด auth, การเปิดเผยผ่าน tailscale
    - คำแนะนำด้าน auth: คง **Token** ไว้แม้สำหรับ loopback เพื่อให้ไคลเอนต์ WS local ต้องยืนยันตัวตน
    - ในโหมด token การตั้งค่าแบบโต้ตอบมีตัวเลือก:
      - **สร้าง/เก็บ token แบบ plaintext** (ค่าเริ่มต้น)
      - **ใช้ SecretRef** (เลือกใช้)
      - Quickstart ใช้ SecretRefs ของ `gateway.auth.token` ที่มีอยู่ซ้ำข้ามผู้ให้บริการ `env`, `file`, และ `exec` สำหรับ onboarding probe/dashboard bootstrap
      - หากกำหนดค่า SecretRef นั้นไว้แต่ resolve ไม่ได้ onboarding จะล้มเหลวตั้งแต่ต้นพร้อมข้อความแก้ไขที่ชัดเจน แทนที่จะลดระดับ runtime auth แบบเงียบ ๆ
    - ในโหมด password การตั้งค่าแบบโต้ตอบรองรับการจัดเก็บแบบ plaintext หรือ SecretRef เช่นกัน
    - path ของ token SecretRef แบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
      - ต้องมี env var ที่ไม่ว่างในสภาพแวดล้อมของกระบวนการ onboarding
      - ใช้ร่วมกับ `--gateway-token` ไม่ได้
    - ปิด auth เฉพาะเมื่อคุณเชื่อถือทุกกระบวนการ local อย่างเต็มที่
    - bind ที่ไม่ใช่ loopback ยังต้องใช้ auth

  </Step>
  <Step title="Channels">
    - [WhatsApp](/th/channels/whatsapp): เข้าสู่ระบบด้วย QR แบบไม่บังคับ
    - [Telegram](/th/channels/telegram): bot token
    - [Discord](/th/channels/discord): bot token
    - [Google Chat](/th/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/th/channels/mattermost) (plugin): bot token + base URL
    - [Signal](/th/channels/signal): ติดตั้ง `signal-cli` แบบไม่บังคับ + config บัญชี
    - [BlueBubbles](/th/channels/bluebubbles): **แนะนำสำหรับ iMessage**; server URL + password + webhook
    - [iMessage](/th/channels/imessage): path ของ CLI `imsg` แบบ legacy + การเข้าถึง DB
    - ความปลอดภัยของ DM: ค่าเริ่มต้นคือการจับคู่ DM แรกจะส่ง code; อนุมัติผ่าน `openclaw pairing approve <channel> <code>` หรือใช้ allowlists

  </Step>
  <Step title="Web search">
    - เลือกผู้ให้บริการที่รองรับ เช่น Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, หรือ Tavily (หรือข้าม)
    - ผู้ให้บริการที่อิง API สามารถใช้ env vars หรือ config ที่มีอยู่เพื่อการตั้งค่าอย่างรวดเร็ว; ผู้ให้บริการที่ไม่ต้องใช้ key ใช้ข้อกำหนดเบื้องต้นเฉพาะของผู้ให้บริการนั้นแทน
    - ข้ามด้วย `--skip-search`
    - กำหนดค่าภายหลัง: `openclaw configure --section web`

  </Step>
  <Step title="การติดตั้ง Daemon">
    - macOS: LaunchAgent
      - ต้องมี session ผู้ใช้ที่ลงชื่อเข้าใช้อยู่; สำหรับ headless ให้ใช้ LaunchDaemon แบบกำหนดเอง (ไม่ได้จัดส่งมา)
    - Linux (และ Windows ผ่าน WSL2): systemd user unit
      - Onboarding พยายามเปิดใช้ lingering ผ่าน `loginctl enable-linger <user>` เพื่อให้ Gateway ทำงานต่อหลังออกจากระบบ
      - อาจแจ้งให้ใช้ sudo (เขียน `/var/lib/systemd/linger`); จะลองโดยไม่ใช้ sudo ก่อน
    - **การเลือก Runtime:** Node (แนะนำ; จำเป็นสำหรับ WhatsApp/Telegram) Bun **ไม่แนะนำ**
    - หาก token auth ต้องใช้ token และ `gateway.auth.token` จัดการด้วย SecretRef การติดตั้ง daemon จะตรวจสอบความถูกต้องแต่จะไม่เก็บค่า token plaintext ที่ resolve แล้วไว้ใน metadata สภาพแวดล้อมของ supervisor service
    - หาก token auth ต้องใช้ token และ token SecretRef ที่กำหนดค่าไว้ resolve ไม่ได้ การติดตั้ง daemon จะถูกบล็อกพร้อมคำแนะนำที่ดำเนินการได้
    - หากทั้ง `gateway.auth.token` และ `gateway.auth.password` ถูกกำหนดค่าไว้ และไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้ง daemon จะถูกบล็อกจนกว่าจะตั้งค่า mode อย่างชัดเจน

  </Step>
  <Step title="Health check">
    - เริ่ม Gateway (หากจำเป็น) และเรียกใช้ `openclaw health`
    - เคล็ดลับ: `openclaw status --deep` เพิ่มการ probe สุขภาพ Gateway แบบ live ลงในผลลัพธ์ status รวมถึง channel probes เมื่อรองรับ (ต้องมี gateway ที่เข้าถึงได้)

  </Step>
  <Step title="Skills (แนะนำ)">
    - อ่าน skills ที่มีอยู่และตรวจสอบข้อกำหนด
    - ให้คุณเลือก node manager: **npm / pnpm** (ไม่แนะนำ bun)
    - ติดตั้ง dependencies แบบไม่บังคับ (บางรายการใช้ Homebrew บน macOS)

  </Step>
  <Step title="เสร็จสิ้น">
    - สรุป + ขั้นตอนถัดไป รวมถึงแอป iOS/Android/macOS สำหรับฟีเจอร์เพิ่มเติม

  </Step>
</Steps>

<Note>
หากตรวจไม่พบ GUI onboarding จะพิมพ์คำแนะนำ SSH port-forward สำหรับ Control UI แทนการเปิดเบราว์เซอร์
หาก assets ของ Control UI หายไป onboarding จะพยายาม build ให้; fallback คือ `pnpm ui:build` (ติดตั้ง UI deps อัตโนมัติ)
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

เพิ่ม `--json` สำหรับสรุปที่เครื่องอ่านได้

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

ตัวอย่างคำสั่งเฉพาะผู้ให้บริการอยู่ใน [CLI Automation](/th/start/wizard-cli-automation#provider-specific-examples)
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

## Wizard RPC ของ Gateway

Gateway เปิดเผย onboarding flow ผ่าน RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`)
ไคลเอนต์ (แอป macOS, Control UI) สามารถ render ขั้นตอนได้โดยไม่ต้อง implement logic ของ onboarding ใหม่

## การตั้งค่า Signal (signal-cli)

Onboarding สามารถติดตั้ง `signal-cli` จาก GitHub releases:

- ดาวน์โหลด release asset ที่เหมาะสม
- เก็บไว้ใต้ `~/.openclaw/tools/signal-cli/<version>/`
- เขียน `channels.signal.cliPath` ลงใน config ของคุณ

หมายเหตุ:

- JVM builds ต้องใช้ **Java 21**
- ใช้ Native builds เมื่อพร้อมใช้งาน
- Windows ใช้ WSL2; การติดตั้ง signal-cli ทำตาม flow ของ Linux ภายใน WSL

## สิ่งที่ wizard เขียน

ฟิลด์ทั่วไปใน `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (หากเลือก Minimax)
- `tools.profile` (การเริ่มต้นใช้งานในเครื่องจะใช้ค่าเริ่มต้นเป็น `"coding"` เมื่อไม่ได้ตั้งค่าไว้; ค่าที่ระบุไว้อย่างชัดเจนเดิมจะถูกคงไว้)
- `gateway.*` (โหมด, การ bind, การยืนยันตัวตน, tailscale)
- `session.dmScope` (รายละเอียดพฤติกรรม: [ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- รายการอนุญาตของช่องทาง (Slack/Discord/Matrix/Microsoft Teams) เมื่อคุณเลือกเข้าร่วมระหว่างพรอมป์ (ชื่อจะถูกแปลงเป็น ID เมื่อเป็นไปได้)
- `skills.install.nodeManager`
  - `setup --node-manager` รับ `npm`, `pnpm` หรือ `bun`
  - การกำหนดค่าด้วยตนเองยังคงใช้ `yarn` ได้โดยตั้งค่า `skills.install.nodeManager` โดยตรง
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` เขียน `agents.list[]` และ `bindings` ที่เป็นตัวเลือก

ข้อมูลประจำตัวของ WhatsApp จะอยู่ภายใต้ `~/.openclaw/credentials/whatsapp/<accountId>/`
เซสชันจะถูกจัดเก็บภายใต้ `~/.openclaw/agents/<agentId>/sessions/`

บางช่องทางถูกส่งมอบเป็น Plugin เมื่อคุณเลือกช่องทางหนึ่งระหว่างการตั้งค่า การเริ่มต้นใช้งาน
จะแจ้งให้ติดตั้งช่องทางนั้น (npm หรือพาธในเครื่อง) ก่อนจึงจะกำหนดค่าได้

## เอกสารที่เกี่ยวข้อง

- ภาพรวมการเริ่มต้นใช้งาน: [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
- การเริ่มต้นใช้งานแอป macOS: [การเริ่มต้นใช้งาน](/th/start/onboarding)
- ข้อมูลอ้างอิงการกำหนดค่า: [การกำหนดค่า Gateway](/th/gateway/configuration)
- ผู้ให้บริการ: [WhatsApp](/th/channels/whatsapp), [Telegram](/th/channels/telegram), [Discord](/th/channels/discord), [Google Chat](/th/channels/googlechat), [Signal](/th/channels/signal), [BlueBubbles](/th/channels/bluebubbles) (iMessage), [iMessage](/th/channels/imessage) (เดิม)
- Skills: [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config)
