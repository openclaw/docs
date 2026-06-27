---
read_when:
    - ค้นหาขั้นตอนหรือแฟล็กการเริ่มต้นใช้งานที่เฉพาะเจาะจง
    - การทำให้ออนบอร์ดเป็นอัตโนมัติด้วยโหมดแบบไม่โต้ตอบ
    - การดีบักพฤติกรรมการเริ่มต้นใช้งาน
sidebarTitle: Onboarding Reference
summary: 'เอกสารอ้างอิงฉบับเต็มสำหรับการเริ่มต้นใช้งาน CLI: ทุกขั้นตอน แฟล็ก และฟิลด์การกำหนดค่า'
title: ข้อมูลอ้างอิงการเริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-06-27T18:23:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 739048d53983febc32adaeab10225a288ae66752bee70cfea500d1664fd8546b
    source_path: reference/wizard.md
    workflow: 16
---

นี่คือข้อมูลอ้างอิงฉบับเต็มสำหรับ `openclaw onboard`
สำหรับภาพรวมระดับสูง โปรดดู [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)

## รายละเอียด Flow (โหมด local)

<Steps>
  <Step title="Existing config detection">
    - หากมี `~/.openclaw/openclaw.json` อยู่แล้ว ให้เลือก **คงค่าปัจจุบันไว้**, **ตรวจทานและอัปเดต**, หรือ **รีเซ็ตก่อนตั้งค่า**
    - การเรียกใช้การเริ่มต้นใช้งานซ้ำจะ **ไม่** ล้างข้อมูลใด ๆ เว้นแต่คุณจะเลือก **Reset** อย่างชัดเจน
      (หรือส่ง `--reset`)
    - CLI `--reset` มีค่าเริ่มต้นเป็น `config+creds+sessions`; ใช้ `--reset-scope full`
      เพื่อลบ workspace ด้วย
    - หาก config ไม่ถูกต้องหรือมีคีย์ legacy wizard จะหยุดและขอให้
      คุณเรียกใช้ `openclaw doctor` ก่อนดำเนินการต่อ
    - การรีเซ็ตใช้ `trash` (ไม่ใช้ `rm`) และมีขอบเขตให้เลือก:
      - Config เท่านั้น
      - Config + credentials + sessions
      - รีเซ็ตทั้งหมด (ลบ workspace ด้วย)

  </Step>
  <Step title="Model/Auth">
    - **Anthropic API key**: ใช้ `ANTHROPIC_API_KEY` หากมีอยู่ หรือแจ้งให้กรอกคีย์ จากนั้นบันทึกไว้สำหรับ daemon
    - **Anthropic API key**: ตัวเลือกผู้ช่วย Anthropic ที่แนะนำในการเริ่มต้นใช้งาน/configure
    - **Anthropic setup-token**: ยังใช้งานได้ในการเริ่มต้นใช้งาน/configure แม้ตอนนี้ OpenClaw จะแนะนำให้ใช้ Claude CLI ซ้ำเมื่อพร้อมใช้งาน
    - **OpenAI Code (Codex) subscription (OAuth)**: Flow ผ่านเบราว์เซอร์; วาง `code#state`
      - ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` ผ่าน runtime ของ Codex เมื่อยังไม่ได้ตั้งค่า model หรือเป็นตระกูล OpenAI อยู่แล้ว
    - **OpenAI Code (Codex) subscription (device pairing)**: Flow จับคู่อุปกรณ์ผ่านเบราว์เซอร์ด้วยรหัสอุปกรณ์อายุสั้น
      - ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` ผ่าน runtime ของ Codex เมื่อยังไม่ได้ตั้งค่า model หรือเป็นตระกูล OpenAI อยู่แล้ว
    - **OpenAI API key**: ใช้ `OPENAI_API_KEY` หากมีอยู่ หรือแจ้งให้กรอกคีย์ จากนั้นเก็บไว้ใน auth profiles
      - ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` เมื่อยังไม่ได้ตั้งค่า model, เป็น `openai/*`, หรือเป็น refs ของ model Codex แบบ legacy
    - **xAI (Grok) OAuth / API key**: ลงชื่อเข้าใช้ด้วย xAI OAuth เมื่อเลือก หรือแจ้งให้กรอก `XAI_API_KEY` ในเส้นทาง API-key และกำหนดค่า xAI เป็นผู้ให้บริการ model
    - **OpenCode**: แจ้งให้กรอก `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`, รับได้ที่ https://opencode.ai/auth) และให้คุณเลือกแคตตาล็อก Zen หรือ Go
    - **Ollama**: เสนอ **Cloud + Local**, **Cloud only**, หรือ **Local only** ก่อน `Cloud only` จะแจ้งให้กรอก `OLLAMA_API_KEY` และใช้ `https://ollama.com`; โหมดที่มี host รองรับจะแจ้งให้กรอก URL ฐานของ Ollama, ค้นหา model ที่พร้อมใช้งาน, และดึง model local ที่เลือกโดยอัตโนมัติเมื่อจำเป็น; `Cloud + Local` ยังตรวจสอบด้วยว่า host Ollama นั้นลงชื่อเข้าใช้เพื่อเข้าถึง cloud แล้วหรือไม่
    - รายละเอียดเพิ่มเติม: [Ollama](/th/providers/ollama)
    - **API key**: เก็บคีย์ให้คุณ
    - **Vercel AI Gateway (multi-model proxy)**: แจ้งให้กรอก `AI_GATEWAY_API_KEY`
    - รายละเอียดเพิ่มเติม: [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: แจ้งให้กรอก Account ID, Gateway ID, และ `CLOUDFLARE_AI_GATEWAY_API_KEY`
    - รายละเอียดเพิ่มเติม: [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
    - **MiniMax**: เขียน config โดยอัตโนมัติ; ค่าเริ่มต้นแบบ hosted คือ `MiniMax-M3`
      การตั้งค่า API-key ใช้ `minimax/...` และการตั้งค่า OAuth ใช้
      `minimax-portal/...`
    - รายละเอียดเพิ่มเติม: [MiniMax](/th/providers/minimax)
    - **StepFun**: เขียน config โดยอัตโนมัติสำหรับ StepFun standard หรือ Step Plan บน endpoints ของจีนหรือ global
    - ปัจจุบัน Standard มี `step-3.5-flash` และ Step Plan มี `step-3.5-flash-2603` ด้วย
    - รายละเอียดเพิ่มเติม: [StepFun](/th/providers/stepfun)
    - **Synthetic (Anthropic-compatible)**: แจ้งให้กรอก `SYNTHETIC_API_KEY`
    - รายละเอียดเพิ่มเติม: [Synthetic](/th/providers/synthetic)
    - **Moonshot (Kimi K2)**: เขียน config โดยอัตโนมัติ
    - **Kimi Coding**: เขียน config โดยอัตโนมัติ
    - รายละเอียดเพิ่มเติม: [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
    - **ข้าม**: ยังไม่ได้กำหนดค่า auth
    - เลือก model เริ่มต้นจากตัวเลือกที่ตรวจพบ (หรือกรอก provider/model เอง) เพื่อคุณภาพที่ดีที่สุดและลดความเสี่ยง prompt-injection ให้เลือก model รุ่นล่าสุดที่แข็งแกร่งที่สุดซึ่งมีอยู่ใน provider stack ของคุณ
    - การเริ่มต้นใช้งานจะเรียกใช้การตรวจสอบ model และเตือนหาก model ที่กำหนดค่าไว้ไม่รู้จักหรือไม่มี auth
    - โหมดจัดเก็บ API key มีค่าเริ่มต้นเป็นค่า auth-profile แบบ plaintext ใช้ `--secret-input-mode ref` เพื่อเก็บ refs ที่อ้างอิง env แทน (เช่น `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
    - Auth profiles อยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API keys + OAuth) ส่วน `~/.openclaw/credentials/oauth.json` เป็น legacy สำหรับนำเข้าเท่านั้น
    - รายละเอียดเพิ่มเติม: [/concepts/oauth](/th/concepts/oauth)
    <Note>
    เคล็ดลับสำหรับ headless/server: ทำ OAuth ให้เสร็จบนเครื่องที่มีเบราว์เซอร์ จากนั้นคัดลอก
    `auth-profiles.json` ของเอเจนต์นั้น (เช่น
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, หรือ path
    `$OPENCLAW_STATE_DIR/...` ที่ตรงกัน) ไปยัง host ของ Gateway `credentials/oauth.json`
    เป็นเพียงแหล่งนำเข้าแบบ legacy เท่านั้น
    </Note>
  </Step>
  <Step title="Workspace">
    - ค่าเริ่มต้น `~/.openclaw/workspace` (กำหนดค่าได้)
    - สร้างไฟล์ workspace ที่จำเป็นสำหรับพิธี bootstrap ของเอเจนต์
    - ผัง workspace แบบเต็ม + คู่มือสำรองข้อมูล: [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - พอร์ต, bind, โหมด auth, การเปิดเผยผ่าน Tailscale
    - คำแนะนำ auth: คง **Token** ไว้แม้สำหรับ loopback เพื่อให้ไคลเอนต์ WS ภายในเครื่องต้องยืนยันตัวตน
    - ในโหมด token การตั้งค่าแบบโต้ตอบมีตัวเลือก:
      - **สร้าง/เก็บ token แบบ plaintext** (ค่าเริ่มต้น)
      - **ใช้ SecretRef** (เลือกใช้เอง)
      - Quickstart ใช้ SecretRefs ของ `gateway.auth.token` ที่มีอยู่ซ้ำข้าม providers `env`, `file`, และ `exec` สำหรับ onboarding probe/dashboard bootstrap
      - หากกำหนดค่า SecretRef นั้นไว้แต่ resolve ไม่ได้ การเริ่มต้นใช้งานจะล้มเหลวตั้งแต่ต้นพร้อมข้อความแก้ไขที่ชัดเจน แทนที่จะลดระดับ runtime auth แบบเงียบ ๆ
    - ในโหมด password การตั้งค่าแบบโต้ตอบยังรองรับการจัดเก็บแบบ plaintext หรือ SecretRef
    - เส้นทาง token SecretRef แบบ non-interactive: `--gateway-token-ref-env <ENV_VAR>`
      - ต้องมี env var ที่ไม่ว่างในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน
      - ใช้ร่วมกับ `--gateway-token` ไม่ได้
    - ปิด auth เฉพาะเมื่อคุณเชื่อถือทุกกระบวนการในเครื่องอย่างสมบูรณ์
    - การ bind ที่ไม่ใช่ loopback ยังคงต้องใช้ auth

  </Step>
  <Step title="Channels">
    - [WhatsApp](/th/channels/whatsapp): การล็อกอิน QR แบบไม่บังคับ
    - [Telegram](/th/channels/telegram): bot token
    - [Discord](/th/channels/discord): bot token
    - [Google Chat](/th/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/th/channels/mattermost) (plugin): bot token + base URL
    - [Signal](/th/channels/signal): การติดตั้ง `signal-cli` แบบไม่บังคับ + config บัญชี
    - [iMessage](/th/channels/imessage): path ของ `imsg` CLI + การเข้าถึง Messages DB; ใช้ SSH wrapper เมื่อ Gateway ทำงานนอก Mac
    - ความปลอดภัยของ DM: ค่าเริ่มต้นคือการจับคู่ DM แรกจะส่งรหัส; อนุมัติผ่าน `openclaw pairing approve <channel> <code>` หรือใช้ allowlists

  </Step>
  <Step title="Web search">
    - เลือก provider ที่รองรับ เช่น Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, หรือ Tavily (หรือข้าม)
    - Providers ที่มี API รองรับสามารถใช้ env vars หรือ config ที่มีอยู่เพื่อการตั้งค่าอย่างรวดเร็ว; providers ที่ไม่ต้องใช้คีย์จะใช้ข้อกำหนดเบื้องต้นเฉพาะของ provider แทน
    - ข้ามด้วย `--skip-search`
    - กำหนดค่าภายหลัง: `openclaw configure --section web`

  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - ต้องมีเซสชันผู้ใช้ที่ล็อกอินอยู่; สำหรับ headless ให้ใช้ LaunchDaemon แบบกำหนดเอง (ไม่ได้จัดส่งมา)
    - Linux (และ Windows ผ่าน WSL2): systemd user unit
      - การเริ่มต้นใช้งานจะพยายามเปิดใช้ lingering ผ่าน `loginctl enable-linger <user>` เพื่อให้ Gateway ยังคงทำงานหลัง logout
      - อาจแจ้งให้ใช้ sudo (เขียน `/var/lib/systemd/linger`); จะลองโดยไม่ใช้ sudo ก่อน
    - **การเลือก runtime:** Node (แนะนำ; จำเป็นสำหรับ WhatsApp/Telegram) ไม่แนะนำให้ใช้ Bun
    - หาก token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef การติดตั้ง daemon จะตรวจสอบความถูกต้อง แต่จะไม่คงค่า token plaintext ที่ resolve แล้วไว้ใน metadata สภาพแวดล้อมของ supervisor service
    - หาก token auth ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ resolve ไม่ได้ การติดตั้ง daemon จะถูกบล็อกพร้อมคำแนะนำที่ดำเนินการได้
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และยังไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้ง daemon จะถูกบล็อกจนกว่าจะตั้งค่าโหมดอย่างชัดเจน

  </Step>
  <Step title="Health check">
    - เริ่ม Gateway (หากจำเป็น) และเรียกใช้ `openclaw health`
    - เคล็ดลับ: `openclaw status --deep` เพิ่ม live gateway health probe ลงในเอาต์พุต status รวมถึง channel probes เมื่อรองรับ (ต้องมี gateway ที่เข้าถึงได้)

  </Step>
  <Step title="Skills (recommended)">
    - อ่าน Skills ที่พร้อมใช้งานและตรวจสอบข้อกำหนด
    - ให้คุณเลือก node manager: **npm / pnpm** (ไม่แนะนำ bun)
    - ติดตั้ง dependencies แบบไม่บังคับ (บางรายการใช้ Homebrew บน macOS)

  </Step>
  <Step title="Finish">
    - สรุป + ขั้นตอนถัดไป รวมถึง prompt **How do you want to hatch your agent?** สำหรับ Terminal, Browser, หรือภายหลัง

  </Step>
</Steps>

<Note>
หากตรวจไม่พบ GUI การเริ่มต้นใช้งานจะแสดงคำแนะนำ SSH port-forward สำหรับ Control UI แทนการเปิดเบราว์เซอร์
หาก assets ของ Control UI ขาดหาย การเริ่มต้นใช้งานจะพยายาม build ให้; fallback คือ `pnpm ui:build` (ติดตั้ง UI deps โดยอัตโนมัติ)
</Note>

## โหมด Non-interactive

ใช้ `--non-interactive` เพื่อทำให้การเริ่มต้นใช้งานเป็นอัตโนมัติหรือใช้ในสคริปต์:

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

เพิ่ม `--json` เพื่อรับสรุปที่เครื่องอ่านได้

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
`--json` ไม่ได้หมายถึงโหมด non-interactive ใช้ `--non-interactive` (และ `--workspace`) สำหรับสคริปต์
</Note>

ตัวอย่างคำสั่งเฉพาะ provider อยู่ใน [CLI Automation](/th/start/wizard-cli-automation#provider-specific-examples)
ใช้หน้าอ้างอิงนี้สำหรับความหมายของ flags และลำดับขั้นตอน

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

Gateway เปิดเผย Flow การเริ่มต้นใช้งานผ่าน RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`)
ไคลเอนต์ (แอป macOS, Control UI) สามารถเรนเดอร์ขั้นตอนได้โดยไม่ต้องนำตรรกะการเริ่มต้นใช้งานไปสร้างใหม่

## การตั้งค่า Signal (signal-cli)

การเริ่มต้นใช้งานสามารถติดตั้ง `signal-cli` จาก GitHub releases:

- ดาวน์โหลด release asset ที่เหมาะสม
- เก็บไว้ใต้ `~/.openclaw/tools/signal-cli/<version>/`
- เขียน `channels.signal.cliPath` ลงใน config ของคุณ

หมายเหตุ:

- JVM builds ต้องใช้ **Java 21**
- ใช้ native builds เมื่อมีให้ใช้
- Windows ใช้ WSL2; การติดตั้ง signal-cli ทำตาม Flow ของ Linux ภายใน WSL

## สิ่งที่ wizard เขียน

ฟิลด์ทั่วไปใน `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (หากเลือก Minimax)
- `tools.profile` (การเริ่มต้นใช้งานในเครื่องจะใช้ค่าเริ่มต้นเป็น `"coding"` เมื่อไม่ได้ตั้งค่าไว้; ค่าที่ตั้งไว้อย่างชัดเจนเดิมจะถูกเก็บไว้)
- `gateway.*` (โหมด, การ bind, การยืนยันตัวตน, tailscale)
- `session.dmScope` (รายละเอียดพฤติกรรม: [ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- รายการอนุญาตของช่องทาง (Slack/Discord/Matrix/Microsoft Teams) เมื่อคุณเลือกใช้ระหว่างพรอมป์ (ชื่อจะถูกแปลงเป็น ID เมื่อเป็นไปได้)
- `skills.install.nodeManager`
  - `setup --node-manager` รับ `npm`, `pnpm` หรือ `bun`
  - การกำหนดค่าด้วยตนเองยังคงใช้ `yarn` ได้โดยตั้งค่า `skills.install.nodeManager` โดยตรง
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` เขียน `agents.list[]` และ `bindings` ที่เป็นทางเลือก

ข้อมูลประจำตัวของ WhatsApp จะอยู่ใต้ `~/.openclaw/credentials/whatsapp/<accountId>/`
เซสชันจะถูกจัดเก็บใต้ `~/.openclaw/agents/<agentId>/sessions/`

บางช่องทางถูกส่งมอบเป็น Plugin เมื่อคุณเลือกช่องทางหนึ่งระหว่างการตั้งค่า การเริ่มต้นใช้งาน
จะแจ้งให้ติดตั้งช่องทางนั้น (npm หรือพาธในเครื่อง) ก่อนจึงจะกำหนดค่าได้

## เอกสารที่เกี่ยวข้อง

- ภาพรวมการเริ่มต้นใช้งาน: [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
- การเริ่มต้นใช้งานแอป macOS: [การเริ่มต้นใช้งาน](/th/start/onboarding)
- ข้อมูลอ้างอิงการกำหนดค่า: [การกำหนดค่า Gateway](/th/gateway/configuration)
- ผู้ให้บริการ: [WhatsApp](/th/channels/whatsapp), [Telegram](/th/channels/telegram), [Discord](/th/channels/discord), [Google Chat](/th/channels/googlechat), [Signal](/th/channels/signal), [iMessage](/th/channels/imessage)
- Skills: [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config)
