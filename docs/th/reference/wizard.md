---
read_when:
    - ค้นหาขั้นตอนการเริ่มต้นใช้งานหรือแฟล็กที่เฉพาะเจาะจง
    - ทำให้การเริ่มต้นใช้งานเป็นอัตโนมัติด้วยโหมดแบบไม่โต้ตอบ
    - การดีบักลักษณะการทำงานของการเริ่มต้นใช้งาน
sidebarTitle: Onboarding Reference
summary: 'ข้อมูลอ้างอิงฉบับสมบูรณ์สำหรับการเริ่มต้นใช้งาน CLI: ทุกขั้นตอน แฟล็ก และฟิลด์การกำหนดค่า'
title: ข้อมูลอ้างอิงการเริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-05-06T09:30:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce0ddb07600ef4f84c44734176e42eb6beaa00fede0be156f3bdd2ec1c0111bb
    source_path: reference/wizard.md
    workflow: 16
---

นี่คือเอกสารอ้างอิงฉบับเต็มสำหรับ `openclaw onboard`
สำหรับภาพรวมระดับสูง ดู [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)

## รายละเอียดโฟลว์ (โหมด local)

<Steps>
  <Step title="การตรวจจับการกำหนดค่าที่มีอยู่">
    - หาก `~/.openclaw/openclaw.json` มีอยู่ ให้เลือก **เก็บไว้ / แก้ไข / รีเซ็ต**
    - การเรียก onboarding ซ้ำจะ **ไม่** ลบอะไร เว้นแต่คุณจะเลือก **รีเซ็ต** อย่างชัดเจน
      (หรือส่ง `--reset`)
    - CLI `--reset` มีค่าเริ่มต้นเป็น `config+creds+sessions`; ใช้ `--reset-scope full`
      เพื่อลบ workspace ด้วย
    - หากการกำหนดค่าไม่ถูกต้องหรือมีคีย์รุ่นเก่า wizard จะหยุดและขอให้
      คุณเรียกใช้ `openclaw doctor` ก่อนดำเนินการต่อ
    - การรีเซ็ตใช้ `trash` (ไม่ใช้ `rm`) และมีขอบเขตให้เลือก:
      - เฉพาะการกำหนดค่า
      - การกำหนดค่า + credentials + sessions
      - รีเซ็ตทั้งหมด (ลบ workspace ด้วย)

  </Step>
  <Step title="โมเดล/การยืนยันตัวตน">
    - **คีย์ Anthropic API**: ใช้ `ANTHROPIC_API_KEY` หากมีอยู่ หรือแจ้งให้ป้อนคีย์ จากนั้นบันทึกไว้ให้ daemon ใช้งาน
    - **คีย์ Anthropic API**: ตัวเลือก Anthropic assistant ที่แนะนำในการ onboarding/configure
    - **Anthropic setup-token**: ยังพร้อมใช้งานในการ onboarding/configure แม้ตอนนี้ OpenClaw จะแนะนำให้ใช้ Claude CLI ซ้ำเมื่อพร้อมใช้งาน
    - **การสมัครใช้งาน OpenAI Code (Codex) (OAuth)**: โฟลว์ผ่านเบราว์เซอร์; วาง `code#state`
      - ตั้งค่า `agents.defaults.model` เป็น `openai-codex/gpt-5.5` เมื่อยังไม่ได้ตั้งค่าโมเดล หรือเป็นตระกูล OpenAI อยู่แล้ว
    - **การสมัครใช้งาน OpenAI Code (Codex) (การจับคู่อุปกรณ์)**: โฟลว์จับคู่ผ่านเบราว์เซอร์พร้อมรหัสอุปกรณ์อายุสั้น
      - ตั้งค่า `agents.defaults.model` เป็น `openai-codex/gpt-5.5` เมื่อยังไม่ได้ตั้งค่าโมเดล หรือเป็นตระกูล OpenAI อยู่แล้ว
    - **คีย์ OpenAI API**: ใช้ `OPENAI_API_KEY` หากมีอยู่ หรือแจ้งให้ป้อนคีย์ จากนั้นจัดเก็บไว้ในโปรไฟล์การยืนยันตัวตน
      - ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.5` เมื่อยังไม่ได้ตั้งค่าโมเดล, `openai/*`, หรือ `openai-codex/*`
    - **คีย์ xAI (Grok) API**: แจ้งให้ป้อน `XAI_API_KEY` และกำหนดค่า xAI เป็นผู้ให้บริการโมเดล
    - **OpenCode**: แจ้งให้ป้อน `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`, รับได้ที่ https://opencode.ai/auth) และให้คุณเลือกแค็ตตาล็อก Zen หรือ Go
    - **Ollama**: เสนอ **Cloud + Local**, **Cloud only**, หรือ **Local only** ก่อน `Cloud only` จะแจ้งให้ป้อน `OLLAMA_API_KEY` และใช้ `https://ollama.com`; โหมดที่อิงโฮสต์จะแจ้งให้ป้อน URL ฐานของ Ollama, ค้นหาโมเดลที่พร้อมใช้งาน และดึงโมเดล local ที่เลือกโดยอัตโนมัติเมื่อจำเป็น; `Cloud + Local` ยังตรวจสอบด้วยว่าโฮสต์ Ollama นั้นลงชื่อเข้าใช้เพื่อเข้าถึง cloud แล้วหรือไม่
    - รายละเอียดเพิ่มเติม: [Ollama](/th/providers/ollama)
    - **คีย์ API**: จัดเก็บคีย์ให้คุณ
    - **Vercel AI Gateway (พร็อกซีหลายโมเดล)**: แจ้งให้ป้อน `AI_GATEWAY_API_KEY`
    - รายละเอียดเพิ่มเติม: [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: แจ้งให้ป้อน Account ID, Gateway ID และ `CLOUDFLARE_AI_GATEWAY_API_KEY`
    - รายละเอียดเพิ่มเติม: [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
    - **MiniMax**: การกำหนดค่าจะถูกเขียนโดยอัตโนมัติ; ค่าเริ่มต้นแบบ hosted คือ `MiniMax-M2.7`
      การตั้งค่าคีย์ API ใช้ `minimax/...` และการตั้งค่า OAuth ใช้
      `minimax-portal/...`
    - รายละเอียดเพิ่มเติม: [MiniMax](/th/providers/minimax)
    - **StepFun**: การกำหนดค่าจะถูกเขียนโดยอัตโนมัติสำหรับ StepFun standard หรือ Step Plan บน endpoint ของจีนหรือทั่วโลก
    - ปัจจุบัน Standard มี `step-3.5-flash` และ Step Plan ยังมี `step-3.5-flash-2603`
    - รายละเอียดเพิ่มเติม: [StepFun](/th/providers/stepfun)
    - **Synthetic (เข้ากันได้กับ Anthropic)**: แจ้งให้ป้อน `SYNTHETIC_API_KEY`
    - รายละเอียดเพิ่มเติม: [Synthetic](/th/providers/synthetic)
    - **Moonshot (Kimi K2)**: การกำหนดค่าจะถูกเขียนโดยอัตโนมัติ
    - **Kimi Coding**: การกำหนดค่าจะถูกเขียนโดยอัตโนมัติ
    - รายละเอียดเพิ่มเติม: [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
    - **ข้าม**: ยังไม่ได้กำหนดค่าการยืนยันตัวตน
    - เลือกโมเดลเริ่มต้นจากตัวเลือกที่ตรวจพบ (หรือป้อนผู้ให้บริการ/โมเดลด้วยตนเอง) เพื่อคุณภาพที่ดีที่สุดและลดความเสี่ยงจาก prompt-injection ให้เลือกโมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดในชุดผู้ให้บริการของคุณ
    - Onboarding จะเรียกใช้การตรวจสอบโมเดลและเตือนหากโมเดลที่กำหนดค่าไว้ไม่รู้จักหรือไม่มีการยืนยันตัวตน
    - โหมดจัดเก็บคีย์ API มีค่าเริ่มต้นเป็นค่า auth-profile แบบ plaintext ใช้ `--secret-input-mode ref` เพื่อจัดเก็บ refs ที่อิง env แทน (เช่น `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
    - โปรไฟล์การยืนยันตัวตนอยู่ที่ `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (คีย์ API + OAuth) `~/.openclaw/credentials/oauth.json` เป็นแหล่งนำเข้า legacy เท่านั้น
    - รายละเอียดเพิ่มเติม: [/concepts/oauth](/th/concepts/oauth)
    <Note>
    เคล็ดลับสำหรับ headless/server: ทำ OAuth ให้เสร็จบนเครื่องที่มีเบราว์เซอร์ จากนั้นคัดลอก
    `auth-profiles.json` ของ agent นั้น (เช่น
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` หรือเส้นทาง
    `$OPENCLAW_STATE_DIR/...` ที่ตรงกัน) ไปยังโฮสต์ Gateway `credentials/oauth.json`
    เป็นเพียงแหล่งนำเข้า legacy เท่านั้น
    </Note>
  </Step>
  <Step title="Workspace">
    - ค่าเริ่มต้น `~/.openclaw/workspace` (กำหนดค่าได้)
    - สร้างไฟล์ workspace ที่จำเป็นสำหรับพิธี bootstrap ของ agent
    - โครงสร้าง workspace ทั้งหมด + คู่มือสำรองข้อมูล: [workspace ของ Agent](/th/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - พอร์ต, bind, โหมดการยืนยันตัวตน, การเปิดให้เข้าถึงผ่าน Tailscale
    - คำแนะนำด้านการยืนยันตัวตน: คง **Token** ไว้แม้สำหรับ loopback เพื่อให้ไคลเอนต์ WS local ต้องยืนยันตัวตน
    - ในโหมด token การตั้งค่าแบบ interactive มีตัวเลือก:
      - **สร้าง/จัดเก็บ token แบบ plaintext** (ค่าเริ่มต้น)
      - **ใช้ SecretRef** (เลือกใช้เอง)
      - Quickstart ใช้ SecretRefs ของ `gateway.auth.token` ที่มีอยู่ซ้ำในผู้ให้บริการ `env`, `file` และ `exec` สำหรับการ probe ใน onboarding/การ bootstrap dashboard
      - หาก SecretRef นั้นถูกกำหนดค่าไว้แต่ resolve ไม่ได้ onboarding จะล้มเหลวตั้งแต่ต้นพร้อมข้อความแก้ไขที่ชัดเจน แทนที่จะลดระดับความปลอดภัยของการยืนยันตัวตน runtime อย่างเงียบ ๆ
    - ในโหมด password การตั้งค่าแบบ interactive ยังรองรับการจัดเก็บแบบ plaintext หรือ SecretRef
    - เส้นทาง SecretRef ของ token แบบ non-interactive: `--gateway-token-ref-env <ENV_VAR>`
      - ต้องมี env var ที่ไม่ว่างในสภาพแวดล้อมของกระบวนการ onboarding
      - ไม่สามารถใช้ร่วมกับ `--gateway-token`
    - ปิดการยืนยันตัวตนเฉพาะเมื่อคุณเชื่อถือทุกกระบวนการ local อย่างเต็มที่เท่านั้น
    - การ bind ที่ไม่ใช่ loopback ยังคงต้องใช้การยืนยันตัวตน

  </Step>
  <Step title="Channels">
    - [WhatsApp](/th/channels/whatsapp): การเข้าสู่ระบบด้วย QR แบบเลือกได้
    - [Telegram](/th/channels/telegram): bot token
    - [Discord](/th/channels/discord): bot token
    - [Google Chat](/th/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/th/channels/mattermost) (Plugin): bot token + base URL
    - [Signal](/th/channels/signal): การติดตั้ง `signal-cli` แบบเลือกได้ + การกำหนดค่าบัญชี
    - [BlueBubbles](/th/channels/bluebubbles): **แนะนำสำหรับ iMessage**; server URL + password + webhook
    - [iMessage](/th/channels/imessage): เส้นทาง CLI `imsg` แบบ legacy + การเข้าถึง DB
    - ความปลอดภัยของ DM: ค่าเริ่มต้นคือการจับคู่ DM แรกจะส่งรหัส; อนุมัติผ่าน `openclaw pairing approve <channel> <code>` หรือใช้ allowlists

  </Step>
  <Step title="การค้นหาเว็บ">
    - เลือกผู้ให้บริการที่รองรับ เช่น Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG หรือ Tavily (หรือข้าม)
    - ผู้ให้บริการที่อิง API สามารถใช้ env vars หรือการกำหนดค่าที่มีอยู่เพื่อการตั้งค่าอย่างรวดเร็ว; ผู้ให้บริการที่ไม่ต้องใช้คีย์จะใช้ข้อกำหนดเบื้องต้นเฉพาะผู้ให้บริการแทน
    - ข้ามด้วย `--skip-search`
    - กำหนดค่าภายหลัง: `openclaw configure --section web`

  </Step>
  <Step title="การติดตั้ง Daemon">
    - macOS: LaunchAgent
      - ต้องมี session ของผู้ใช้ที่ลงชื่อเข้าใช้อยู่; สำหรับ headless ให้ใช้ LaunchDaemon แบบกำหนดเอง (ไม่ได้จัดส่งมาให้)
    - Linux (และ Windows ผ่าน WSL2): systemd user unit
      - Onboarding พยายามเปิดใช้ lingering ผ่าน `loginctl enable-linger <user>` เพื่อให้ Gateway ยังคงทำงานหลัง logout
      - อาจแจ้งให้ใช้ sudo (เขียน `/var/lib/systemd/linger`); จะลองโดยไม่ใช้ sudo ก่อน
    - **การเลือกรันไทม์:** Node (แนะนำ; จำเป็นสำหรับ WhatsApp/Telegram) Bun **ไม่แนะนำ**
    - หากการยืนยันตัวตนด้วย token ต้องใช้ token และ `gateway.auth.token` จัดการด้วย SecretRef การติดตั้ง daemon จะตรวจสอบความถูกต้อง แต่จะไม่บันทึกค่า token plaintext ที่ resolve แล้วลงใน metadata ของสภาพแวดล้อมบริการ supervisor
    - หากการยืนยันตัวตนด้วย token ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยัง resolve ไม่ได้ การติดตั้ง daemon จะถูกบล็อกพร้อมคำแนะนำที่นำไปทำได้
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และยังไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้ง daemon จะถูกบล็อกจนกว่าจะตั้งค่าโหมดอย่างชัดเจน

  </Step>
  <Step title="การตรวจสุขภาพ">
    - เริ่ม Gateway (หากจำเป็น) และเรียกใช้ `openclaw health`
    - เคล็ดลับ: `openclaw status --deep` เพิ่ม live gateway health probe ไปยังเอาต์พุตสถานะ รวมถึง channel probes เมื่อรองรับ (ต้องมี gateway ที่เข้าถึงได้)

  </Step>
  <Step title="Skills (แนะนำ)">
    - อ่าน Skills ที่พร้อมใช้งานและตรวจสอบข้อกำหนด
    - ให้คุณเลือกตัวจัดการ node: **npm / pnpm** (ไม่แนะนำ bun)
    - ติดตั้ง dependencies แบบเลือกได้ (บางรายการใช้ Homebrew บน macOS)

  </Step>
  <Step title="เสร็จสิ้น">
    - สรุป + ขั้นตอนถัดไป รวมถึงแอป iOS/Android/macOS สำหรับฟีเจอร์เพิ่มเติม

  </Step>
</Steps>

<Note>
หากตรวจไม่พบ GUI onboarding จะพิมพ์คำแนะนำการทำ SSH port-forward สำหรับ Control UI แทนการเปิดเบราว์เซอร์
หากไม่มี assets ของ Control UI onboarding จะพยายาม build ให้; fallback คือ `pnpm ui:build` (ติดตั้ง UI deps โดยอัตโนมัติ)
</Note>

## โหมด Non-interactive

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
`--json` **ไม่ได้** หมายถึงโหมด non-interactive ใช้ `--non-interactive` (และ `--workspace`) สำหรับสคริปต์
</Note>

ตัวอย่างคำสั่งเฉพาะผู้ให้บริการอยู่ใน [CLI Automation](/th/start/wizard-cli-automation#provider-specific-examples)
ใช้หน้าอ้างอิงนี้สำหรับความหมายของ flag และลำดับขั้นตอน

### เพิ่ม agent (non-interactive)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC ของ Gateway wizard

Gateway เปิดเผยโฟลว์ onboarding ผ่าน RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`)
ไคลเอนต์ (แอป macOS, Control UI) สามารถเรนเดอร์ขั้นตอนได้โดยไม่ต้องนำตรรกะ onboarding ไป implement ซ้ำ

## การตั้งค่า Signal (signal-cli)

Onboarding สามารถติดตั้ง `signal-cli` จาก GitHub releases:

- ดาวน์โหลด release asset ที่เหมาะสม
- จัดเก็บไว้ภายใต้ `~/.openclaw/tools/signal-cli/<version>/`
- เขียน `channels.signal.cliPath` ลงในการกำหนดค่าของคุณ

หมายเหตุ:

- JVM builds ต้องใช้ **Java 21**
- ใช้ native builds เมื่อพร้อมใช้งาน
- Windows ใช้ WSL2; การติดตั้ง signal-cli จะทำตามโฟลว์ Linux ภายใน WSL

## สิ่งที่ wizard เขียน

ฟิลด์ทั่วไปใน `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (หากเลือก Minimax)
- `tools.profile` (ค่าเริ่มต้นของการเริ่มต้นใช้งานบนเครื่องจะเป็น `"coding"` เมื่อไม่ได้ตั้งค่าไว้; ค่าที่ระบุไว้อย่างชัดเจนเดิมจะถูกเก็บไว้)
- `gateway.*` (โหมด, การผูก, การยืนยันตัวตน, tailscale)
- `session.dmScope` (รายละเอียดพฤติกรรม: [ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- รายการอนุญาตของช่องทาง (Slack/Discord/Matrix/Microsoft Teams) เมื่อคุณเลือกใช้ระหว่างพรอมป์ (ชื่อจะถูกแปลงเป็น ID เมื่อเป็นไปได้)
- `skills.install.nodeManager`
  - `setup --node-manager` รับค่า `npm`, `pnpm` หรือ `bun`
  - การกำหนดค่าด้วยตนเองยังคงใช้ `yarn` ได้โดยตั้งค่า `skills.install.nodeManager` โดยตรง
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` เขียน `agents.list[]` และ `bindings` ที่เป็นตัวเลือก

ข้อมูลรับรอง WhatsApp จะอยู่ภายใต้ `~/.openclaw/credentials/whatsapp/<accountId>/`
เซสชันจะถูกจัดเก็บภายใต้ `~/.openclaw/agents/<agentId>/sessions/`

บางช่องทางถูกส่งมอบเป็น plugins เมื่อคุณเลือกช่องทางหนึ่งระหว่างการตั้งค่า การเริ่มต้นใช้งาน
จะพรอมป์ให้ติดตั้งช่องทางนั้น (npm หรือเส้นทางในเครื่อง) ก่อนจึงจะกำหนดค่าได้

## เอกสารที่เกี่ยวข้อง

- ภาพรวมการเริ่มต้นใช้งาน: [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
- การเริ่มต้นใช้งานแอป macOS: [การเริ่มต้นใช้งาน](/th/start/onboarding)
- ข้อมูลอ้างอิงการกำหนดค่า: [การกำหนดค่า Gateway](/th/gateway/configuration)
- ผู้ให้บริการ: [WhatsApp](/th/channels/whatsapp), [Telegram](/th/channels/telegram), [Discord](/th/channels/discord), [Google Chat](/th/channels/googlechat), [Signal](/th/channels/signal), [BlueBubbles](/th/channels/bluebubbles) (iMessage), [iMessage](/th/channels/imessage) (รุ่นเดิม)
- Skills: [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config)
