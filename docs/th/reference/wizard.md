---
read_when:
    - การค้นหาขั้นตอนหรือแฟล็กเฉพาะในการเริ่มต้นใช้งาน
    - การทำ onboarding แบบอัตโนมัติด้วยโหมดไม่โต้ตอบ
    - การดีบักพฤติกรรมของ onboarding
sidebarTitle: Onboarding Reference
summary: 'ข้อมูลอ้างอิงฉบับเต็มสำหรับการเริ่มต้นใช้งานผ่าน CLI: ทุกขั้นตอน ทุกแฟล็ก และทุกฟิลด์คอนฟิก'
title: ข้อมูลอ้างอิงการเริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-04-26T11:41:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 729a12bac6b67b32ba4b2b2068a30240d2118f5afe3812c701ee65d7b7e13018
    source_path: reference/wizard.md
    workflow: 15
---

นี่คือข้อมูลอ้างอิงฉบับเต็มสำหรับ `openclaw onboard`
สำหรับภาพรวมระดับสูง ดู [Onboarding (CLI)](/th/start/wizard)

## รายละเอียดของโฟลว์ (โหมด local)

<Steps>
  <Step title="การตรวจพบคอนฟิกที่มีอยู่">
    - หากมี `~/.openclaw/openclaw.json` อยู่แล้ว ให้เลือก **Keep / Modify / Reset**
    - การรัน onboarding ซ้ำจะ **ไม่** ล้างอะไร เว้นแต่คุณจะเลือก **Reset** อย่างชัดเจน
      (หรือส่ง `--reset`)
    - `--reset` ของ CLI จะใช้ค่าเริ่มต้นเป็น `config+creds+sessions`; ใช้ `--reset-scope full`
      เพื่อลบ workspace ด้วย
    - หากคอนฟิกไม่ถูกต้องหรือมีคีย์แบบเก่า วิซาร์ดจะหยุดและขอ
      ให้คุณรัน `openclaw doctor` ก่อนจึงจะดำเนินการต่อได้
    - การรีเซ็ตใช้ `trash` (ไม่ใช้ `rm`) และมีขอบเขตให้เลือก:
      - เฉพาะคอนฟิก
      - คอนฟิก + ข้อมูลรับรอง + เซสชัน
      - รีเซ็ตทั้งหมด (ลบ workspace ด้วย)

  </Step>
  <Step title="โมเดล/Auth">
    - **Anthropic API key**: ใช้ `ANTHROPIC_API_KEY` หากมีอยู่ หรือถามหา key จากนั้นบันทึกไว้สำหรับใช้งานกับ daemon
    - **Anthropic API key**: เป็นตัวเลือก assistant ของ Anthropic ที่แนะนำใน onboarding/configure
    - **Anthropic setup-token**: ยังคงมีให้เลือกใน onboarding/configure แม้ตอนนี้ OpenClaw จะเลือกใช้ Claude CLI ที่มีอยู่แล้วก่อนเมื่อทำได้
    - **OpenAI Code (Codex) subscription (OAuth)**: โฟลว์ผ่านเบราว์เซอร์; วาง `code#state`
      - ตั้งค่า `agents.defaults.model` เป็น `openai-codex/gpt-5.5` เมื่อยังไม่ได้ตั้งโมเดล หรือโมเดลเดิมอยู่ในตระกูล OpenAI
    - **OpenAI Code (Codex) subscription (device pairing)**: โฟลว์จับคู่ผ่านเบราว์เซอร์ด้วย device code อายุสั้น
      - ตั้งค่า `agents.defaults.model` เป็น `openai-codex/gpt-5.5` เมื่อยังไม่ได้ตั้งโมเดล หรือโมเดลเดิมอยู่ในตระกูล OpenAI
    - **OpenAI API key**: ใช้ `OPENAI_API_KEY` หากมีอยู่ หรือถามหา key จากนั้นเก็บไว้ใน auth profile
      - ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` เมื่อยังไม่ได้ตั้งโมเดล, เป็น `openai/*` หรือ `openai-codex/*`
    - **xAI (Grok) API key**: ถามหา `XAI_API_KEY` และกำหนดค่า xAI ให้เป็น provider ของโมเดล
    - **OpenCode**: ถามหา `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`, ขอได้ที่ https://opencode.ai/auth) และให้คุณเลือกแค็ตตาล็อก Zen หรือ Go
    - **Ollama**: ให้เลือก **Cloud + Local**, **Cloud only** หรือ **Local only** ก่อน `Cloud only` จะถามหา `OLLAMA_API_KEY` และใช้ `https://ollama.com`; โหมดที่มี host จะถามหา base URL ของ Ollama, ค้นหาโมเดลที่มีอยู่ และดึง local model ที่เลือกให้อัตโนมัติเมื่อจำเป็น; `Cloud + Local` จะตรวจสอบด้วยว่า Ollama host นั้นลงชื่อเข้าใช้สำหรับ cloud access อยู่หรือไม่
    - รายละเอียดเพิ่มเติม: [Ollama](/th/providers/ollama)
    - **API key**: จัดเก็บ key ให้คุณ
    - **Vercel AI Gateway (multi-model proxy)**: ถามหา `AI_GATEWAY_API_KEY`
    - รายละเอียดเพิ่มเติม: [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: ถามหา Account ID, Gateway ID และ `CLOUDFLARE_AI_GATEWAY_API_KEY`
    - รายละเอียดเพิ่มเติม: [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
    - **MiniMax**: ระบบจะเขียนคอนฟิกให้อัตโนมัติ; ค่าเริ่มต้นของบริการโฮสต์คือ `MiniMax-M2.7`
      การตั้งค่าด้วย API key ใช้ `minimax/...` และการตั้งค่าด้วย OAuth ใช้
      `minimax-portal/...`
    - รายละเอียดเพิ่มเติม: [MiniMax](/th/providers/minimax)
    - **StepFun**: ระบบจะเขียนคอนฟิกให้อัตโนมัติสำหรับ StepFun standard หรือ Step Plan บน endpoint ของจีนหรือ global
    - ปัจจุบัน Standard มี `step-3.5-flash` และ Step Plan มี `step-3.5-flash-2603` ด้วย
    - รายละเอียดเพิ่มเติม: [StepFun](/th/providers/stepfun)
    - **Synthetic (Anthropic-compatible)**: ถามหา `SYNTHETIC_API_KEY`
    - รายละเอียดเพิ่มเติม: [Synthetic](/th/providers/synthetic)
    - **Moonshot (Kimi K2)**: ระบบจะเขียนคอนฟิกให้อัตโนมัติ
    - **Kimi Coding**: ระบบจะเขียนคอนฟิกให้อัตโนมัติ
    - รายละเอียดเพิ่มเติม: [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
    - **Skip**: ยังไม่ตั้งค่า auth
    - เลือกโมเดลค่าเริ่มต้นจากตัวเลือกที่ตรวจพบ (หรือป้อน provider/model เองด้วยตนเอง) เพื่อคุณภาพที่ดีที่สุดและลดความเสี่ยงจาก prompt injection ให้เลือกโมเดลรุ่นใหม่ล่าสุดที่แข็งแกร่งที่สุดเท่าที่มีในชุด provider ของคุณ
    - Onboarding จะรันการตรวจสอบโมเดลและเตือนหากโมเดลที่ตั้งค่าไว้ไม่เป็นที่รู้จักหรือไม่มี auth
    - โหมดการจัดเก็บ API key ใช้ค่าเริ่มต้นเป็นค่า plaintext ใน auth profile ใช้ `--secret-input-mode ref` เพื่อเก็บเป็น env-backed ref แทน (เช่น `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
    - Auth profile อยู่ที่ `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API key + OAuth) ส่วน `~/.openclaw/credentials/oauth.json` เป็นแหล่งนำเข้าแบบเก่าเท่านั้น
    - รายละเอียดเพิ่มเติม: [/concepts/oauth](/th/concepts/oauth)
    <Note>
    เคล็ดลับสำหรับ headless/server: ทำ OAuth บนเครื่องที่มีเบราว์เซอร์ให้เสร็จก่อน แล้วคัดลอก
    `auth-profiles.json` ของเอเจนต์นั้น (เช่น
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` หรือ path
    ที่ตรงกันภายใต้ `$OPENCLAW_STATE_DIR/...`) ไปยังโฮสต์ gateway `credentials/oauth.json`
    ใช้เป็นแหล่งนำเข้าแบบเก่าเท่านั้น
    </Note>
  </Step>
  <Step title="Workspace">
    - ค่าเริ่มต้นคือ `~/.openclaw/workspace` (กำหนดเองได้)
    - สร้างไฟล์ workspace ที่จำเป็นสำหรับกระบวนการ bootstrap ของเอเจนต์
    - โครงสร้าง workspace แบบเต็ม + คู่มือสำรองข้อมูล: [Agent workspace](/th/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - พอร์ต, bind, โหมด auth, การเปิดเผยผ่าน tailscale
    - คำแนะนำด้าน auth: ควรเก็บ **Token** ไว้แม้สำหรับ loopback เพื่อให้ local WS client ต้องยืนยันตัวตน
    - ในโหมด token การตั้งค่าแบบโต้ตอบจะมีตัวเลือก:
      - **Generate/store plaintext token** (ค่าเริ่มต้น)
      - **Use SecretRef** (เลือกใช้เอง)
      - Quickstart จะนำ SecretRef ที่มีอยู่ใน `gateway.auth.token` กลับมาใช้ซ้ำสำหรับ provider แบบ `env`, `file` และ `exec` เพื่อใช้กับ onboarding probe/dashboard bootstrap
      - หาก SecretRef นั้นถูกตั้งค่าไว้แต่ไม่สามารถ resolve ได้ onboarding จะล้มเหลวตั้งแต่ต้นพร้อมข้อความวิธีแก้ที่ชัดเจน แทนที่จะลดระดับ auth ของ runtime แบบเงียบ ๆ
    - ในโหมด password การตั้งค่าแบบโต้ตอบก็รองรับการเก็บแบบ plaintext หรือ SecretRef เช่นกัน
    - เส้นทาง SecretRef ของ token แบบ non-interactive: `--gateway-token-ref-env <ENV_VAR>`
      - ต้องมี env var ที่ไม่ว่างในสภาพแวดล้อมของโพรเซส onboarding
      - ใช้ร่วมกับ `--gateway-token` ไม่ได้
    - ปิด auth เฉพาะเมื่อคุณเชื่อถือทุกโพรเซสในเครื่องอย่างสมบูรณ์
    - bind ที่ไม่ใช่ loopback ยังคงต้องใช้ auth

  </Step>
  <Step title="Channels">
    - [WhatsApp](/th/channels/whatsapp): login ด้วย QR แบบเลือกได้
    - [Telegram](/th/channels/telegram): bot token
    - [Discord](/th/channels/discord): bot token
    - [Google Chat](/th/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/th/channels/mattermost) (Plugin): bot token + base URL
    - [Signal](/th/channels/signal): ติดตั้ง `signal-cli` และตั้งค่าบัญชีแบบเลือกได้
    - [BlueBubbles](/th/channels/bluebubbles): **แนะนำสำหรับ iMessage**; server URL + password + webhook
    - [iMessage](/th/channels/imessage): path ของ `imsg` CLI แบบเก่า + การเข้าถึงฐานข้อมูล
    - ความปลอดภัยของ DM: ค่าเริ่มต้นคือการจับคู่ DM แรกจะส่งโค้ดมา; อนุมัติผ่าน `openclaw pairing approve <channel> <code>` หรือใช้ allowlist

  </Step>
  <Step title="Web search">
    - เลือก provider ที่รองรับ เช่น Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG หรือ Tavily (หรือข้าม)
    - provider ที่ใช้ API สามารถใช้ env var หรือคอนฟิกที่มีอยู่เพื่อการตั้งค่าอย่างรวดเร็ว; provider ที่ไม่ต้องใช้ key จะใช้ข้อกำหนดเบื้องต้นเฉพาะของ provider นั้นแทน
    - ข้ามด้วย `--skip-search`
    - ตั้งค่าภายหลัง: `openclaw configure --section web`

  </Step>
  <Step title="การติดตั้ง Daemon">
    - macOS: LaunchAgent
      - ต้องมีเซสชันผู้ใช้ที่ล็อกอินอยู่; สำหรับโหมด headless ให้ใช้ LaunchDaemon แบบกำหนดเอง (ไม่มีให้ในชุด)
    - Linux (และ Windows ผ่าน WSL2): systemd user unit
      - Onboarding จะพยายามเปิด lingering ผ่าน `loginctl enable-linger <user>` เพื่อให้ Gateway ทำงานต่อหลัง logout
      - อาจถามหา sudo (เขียนไปที่ `/var/lib/systemd/linger`); ระบบจะลองแบบไม่ใช้ sudo ก่อน
    - **การเลือก runtime:** Node (แนะนำ; จำเป็นสำหรับ WhatsApp/Telegram) ส่วน Bun **ไม่แนะนำ**
    - หาก token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef การติดตั้ง daemon จะตรวจสอบความถูกต้อง แต่จะไม่เก็บค่า plaintext token ที่ resolve แล้วลงใน metadata ของสภาพแวดล้อม service ของ supervisor
    - หาก token auth ต้องใช้ token และ token SecretRef ที่ตั้งค่าไว้ไม่สามารถ resolve ได้ การติดตั้ง daemon จะถูกบล็อกพร้อมคำแนะนำที่ทำตามได้จริง
    - หากมีทั้ง `gateway.auth.token` และ `gateway.auth.password` ถูกตั้งค่า และ `gateway.auth.mode` ยังไม่ถูกตั้ง การติดตั้ง daemon จะถูกบล็อกจนกว่าจะตั้งค่า mode อย่างชัดเจน

  </Step>
  <Step title="การตรวจสอบสุขภาพระบบ">
    - เริ่ม Gateway (หากจำเป็น) และรัน `openclaw health`
    - เคล็ดลับ: `openclaw status --deep` จะเพิ่ม live gateway health probe ลงในเอาต์พุตสถานะ รวมถึง channel probe เมื่อรองรับ (ต้องเข้าถึง gateway ได้)

  </Step>
  <Step title="Skills (แนะนำ)">
    - อ่าน Skills ที่มีอยู่และตรวจสอบข้อกำหนด
    - ให้คุณเลือก node manager: **npm / pnpm** (bun ไม่แนะนำ)
    - ติดตั้ง dependency แบบเลือกได้ (บางรายการใช้ Homebrew บน macOS)

  </Step>
  <Step title="เสร็จสิ้น">
    - สรุป + ขั้นตอนถัดไป รวมถึงแอป iOS/Android/macOS สำหรับฟีเจอร์เพิ่มเติม

  </Step>
</Steps>

<Note>
หากไม่พบ GUI, onboarding จะพิมพ์คำแนะนำสำหรับ SSH port-forward ของ Control UI แทนการเปิดเบราว์เซอร์
หากไม่มี asset ของ Control UI, onboarding จะพยายาม build ให้; fallback คือ `pnpm ui:build` (ติดตั้ง UI deps อัตโนมัติ)
</Note>

## โหมดไม่โต้ตอบ

ใช้ `--non-interactive` เพื่อทำ onboarding แบบอัตโนมัติหรือผ่านสคริปต์:

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

เพิ่ม `--json` เพื่อรับสรุปแบบ machine-readable

Gateway token SecretRef ในโหมด non-interactive:

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
`--json` **ไม่ได้** หมายถึงโหมด non-interactive โดยอัตโนมัติ ให้ใช้ `--non-interactive` (และ `--workspace`) สำหรับสคริปต์
</Note>

ตัวอย่างคำสั่งเฉพาะ provider อยู่ใน [CLI Automation](/th/start/wizard-cli-automation#provider-specific-examples)
ใช้หน้าข้อมูลอ้างอิงนี้สำหรับความหมายของแฟล็กและลำดับขั้นตอน

### เพิ่มเอเจนต์ (non-interactive)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway wizard RPC

Gateway เปิดเผยโฟลว์ onboarding ผ่าน RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`)
ไคลเอนต์ (แอป macOS, Control UI) สามารถเรนเดอร์ขั้นตอนได้โดยไม่ต้องนำตรรกะ onboarding ไปเขียนใหม่

## การตั้งค่า Signal (`signal-cli`)

Onboarding สามารถติดตั้ง `signal-cli` จาก GitHub releases ได้:

- ดาวน์โหลด release asset ที่เหมาะสม
- เก็บไว้ภายใต้ `~/.openclaw/tools/signal-cli/<version>/`
- เขียน `channels.signal.cliPath` ลงในคอนฟิกของคุณ

หมายเหตุ:

- build แบบ JVM ต้องใช้ **Java 21**
- จะใช้ build แบบ native เมื่อมีให้ใช้
- บน Windows จะใช้ WSL2; การติดตั้ง signal-cli จะตามโฟลว์ของ Linux ภายใน WSL

## สิ่งที่วิซาร์ดเขียน

ฟิลด์ที่มักพบใน `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (หากเลือก Minimax)
- `tools.profile` (การทำ onboarding แบบ local จะใช้ค่าเริ่มต้นเป็น `"coding"` เมื่อยังไม่ได้ตั้งค่า; ค่าที่ตั้งไว้อย่างชัดเจนอยู่แล้วจะถูกคงไว้)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (รายละเอียดพฤติกรรม: [ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- allowlist ของ channel (Slack/Discord/Matrix/Microsoft Teams) เมื่อคุณเลือกใช้ระหว่างพรอมป์ (ชื่อจะถูก resolve เป็น ID เมื่อทำได้)
- `skills.install.nodeManager`
  - `setup --node-manager` รองรับ `npm`, `pnpm` หรือ `bun`
  - คอนฟิกแบบ manual ยังใช้ `yarn` ได้โดยตั้ง `skills.install.nodeManager` โดยตรง
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` จะเขียน `agents.list[]` และ `bindings` แบบเลือกได้

ข้อมูลรับรองของ WhatsApp จะอยู่ภายใต้ `~/.openclaw/credentials/whatsapp/<accountId>/`
ส่วนเซสชันจะถูกเก็บไว้ภายใต้ `~/.openclaw/agents/<agentId>/sessions/`

บาง channel ถูกส่งมอบในรูปแบบ Plugin เมื่อคุณเลือก channel ดังกล่าวระหว่างการตั้งค่า onboarding
จะถามให้ติดตั้งมันก่อน (ผ่าน npm หรือ path ในเครื่อง) จึงจะกำหนดค่าได้

## เอกสารที่เกี่ยวข้อง

- ภาพรวม Onboarding: [Onboarding (CLI)](/th/start/wizard)
- Onboarding ของแอป macOS: [Onboarding](/th/start/onboarding)
- ข้อมูลอ้างอิงคอนฟิก: [การตั้งค่า Gateway](/th/gateway/configuration)
- Providers: [WhatsApp](/th/channels/whatsapp), [Telegram](/th/channels/telegram), [Discord](/th/channels/discord), [Google Chat](/th/channels/googlechat), [Signal](/th/channels/signal), [BlueBubbles](/th/channels/bluebubbles) (iMessage), [iMessage](/th/channels/imessage) (legacy)
- Skills: [Skills](/th/tools/skills), [คอนฟิก Skills](/th/tools/skills-config)
