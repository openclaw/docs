---
read_when:
    - การรันการทดสอบเบื้องต้นแบบสดสำหรับเมทริกซ์โมเดล / แบ็กเอนด์ CLI / ACP / media-provider
    - การดีบักการค้นหาข้อมูลประจำตัวสำหรับการทดสอบสด
    - การเพิ่มการทดสอบแบบสดเฉพาะผู้ให้บริการใหม่
sidebarTitle: Live tests
summary: 'การทดสอบแบบสด (ที่มีการเข้าถึงเครือข่าย): เมทริกซ์โมเดล, แบ็กเอนด์ CLI, ACP, ผู้ให้บริการสื่อ, ข้อมูลประจำตัว'
title: 'การทดสอบ: ชุดทดสอบแบบสด'
x-i18n:
    generated_at: "2026-05-10T19:42:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb020672cd71d03b2cfc78b135c7c39862823c421c0f2f31bae69a42f9c3437f
    source_path: help/testing-live.md
    workflow: 16
---

สำหรับการเริ่มต้นอย่างรวดเร็ว, ตัวรัน QA, ชุดทดสอบ unit/integration และโฟลว์ Docker โปรดดู
[การทดสอบ](/th/help/testing) หน้านี้ครอบคลุมชุดทดสอบ **live** (ที่แตะเครือข่าย):
เมทริกซ์โมเดล, แบ็กเอนด์ CLI, ACP และการทดสอบ live ของ media-provider รวมถึง
การจัดการ credential

## Live: คำสั่ง smoke สำหรับ local profile

Source `~/.profile` ก่อนการตรวจสอบ live แบบ ad hoc เพื่อให้คีย์ provider และพาธเครื่องมือ local
ตรงกับ shell ของคุณ:

```bash
source ~/.profile
```

Safe media smoke:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Safe voice-call readiness smoke:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` เป็น dry run เว้นแต่จะมี `--yes` ด้วย ใช้ `--yes` เฉพาะ
เมื่อคุณตั้งใจจะโทรแจ้งเตือนจริง สำหรับ Twilio, Telnyx และ
Plivo การตรวจสอบความพร้อมที่สำเร็จต้องมี public webhook URL; ทางเลือก fallback แบบ local-only
loopback/private จะถูกปฏิเสธโดยเจตนา

## Live: การ sweep ความสามารถของ Android node

- การทดสอบ: `src/gateway/android-node.capabilities.live.test.ts`
- สคริปต์: `pnpm android:test:integration`
- เป้าหมาย: เรียกใช้ **ทุกคำสั่งที่ประกาศอยู่ในปัจจุบัน** โดย Android node ที่เชื่อมต่ออยู่ และยืนยันพฤติกรรมตาม contract ของคำสั่ง
- ขอบเขต:
  - การตั้งค่าล่วงหน้า/ด้วยตนเอง (ชุดทดสอบนี้ไม่ติดตั้ง/รัน/จับคู่แอป)
  - การตรวจสอบ Gateway `node.invoke` ทีละคำสั่งสำหรับ Android node ที่เลือก
- การตั้งค่าล่วงหน้าที่จำเป็น:
  - แอป Android เชื่อมต่อและจับคู่กับ Gateway แล้ว
  - ให้แอปอยู่ foreground
  - อนุญาต permissions/capture consent สำหรับความสามารถที่คุณคาดว่าจะผ่าน
- การ override target แบบ optional:
  - `OPENCLAW_ANDROID_NODE_ID` หรือ `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- รายละเอียดการตั้งค่า Android แบบครบถ้วน: [แอป Android](/th/platforms/android)

## Live: model smoke (คีย์ profile)

การทดสอบ live แบ่งเป็นสองชั้นเพื่อให้เราแยก failure ได้:

- "Direct model" บอกเราว่า provider/model สามารถตอบได้จริงด้วยคีย์ที่ให้มา
- "Gateway smoke" บอกเราว่า pipeline gateway+agent แบบเต็มทำงานสำหรับโมเดลนั้น (sessions, history, tools, sandbox policy ฯลฯ)

### ชั้นที่ 1: Direct model completion (ไม่มี gateway)

- การทดสอบ: `src/agents/models.profiles.live.test.ts`
- เป้าหมาย:
  - Enumerate โมเดลที่ค้นพบ
  - ใช้ `getApiKeyForModel` เพื่อเลือกโมเดลที่คุณมี creds
  - รัน completion ขนาดเล็กต่อโมเดล (และ regressions แบบ targeted เมื่อจำเป็น)
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- ตั้ง `OPENCLAW_LIVE_MODELS=modern` (หรือ `all`, alias สำหรับ modern) เพื่อรันชุดทดสอบนี้จริง; มิฉะนั้นจะข้ามเพื่อให้ `pnpm test:live` โฟกัสที่ gateway smoke
- วิธีเลือกโมเดล:
  - `OPENCLAW_LIVE_MODELS=modern` เพื่อรัน allowlist สมัยใหม่ (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` เป็น alias สำหรับ allowlist สมัยใหม่
  - หรือ `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (comma allowlist)
  - การ sweep แบบ Modern/all มีค่าเริ่มต้นเป็น cap ที่คัด curated high-signal ไว้; ตั้ง `OPENCLAW_LIVE_MAX_MODELS=0` สำหรับการ sweep modern แบบ exhaustive หรือจำนวนบวกสำหรับ cap ที่เล็กกว่า
  - การ sweep แบบ exhaustive ใช้ `OPENCLAW_LIVE_TEST_TIMEOUT_MS` สำหรับ timeout ของ direct-model test ทั้งหมด ค่าเริ่มต้น: 60 นาที
  - direct-model probes รันด้วย parallelism 20 ทางโดยค่าเริ่มต้น; ตั้ง `OPENCLAW_LIVE_MODEL_CONCURRENCY` เพื่อ override
- วิธีเลือก providers:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (comma allowlist)
- คีย์มาจากที่ใด:
  - ค่าเริ่มต้น: profile store และ env fallbacks
  - ตั้ง `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้เฉพาะ **profile store**
- เหตุผลที่มีสิ่งนี้:
  - แยก "provider API เสีย / คีย์ไม่ถูกต้อง" ออกจาก "gateway agent pipeline เสีย"
  - มี regressions ขนาดเล็กที่แยกเฉพาะส่วน (ตัวอย่าง: OpenAI Responses/Codex Responses reasoning replay + tool-call flows)

### ชั้นที่ 2: Gateway + dev agent smoke (สิ่งที่ "@openclaw" ทำจริง)

- การทดสอบ: `src/gateway/gateway-models.profiles.live.test.ts`
- เป้าหมาย:
  - เปิด gateway แบบ in-process
  - สร้าง/patch session `agent:dev:*` (override โมเดลต่อรอบ)
  - วนผ่าน models-with-keys และยืนยันว่า:
    - response "มีความหมาย" (ไม่มี tools)
    - การเรียก tool จริงทำงาน (read probe)
    - probes ของ tool เพิ่มเติมแบบ optional (exec+read probe)
    - เส้นทาง regression ของ OpenAI (tool-call-only → follow-up) ยังทำงานต่อไป
- รายละเอียด probe (เพื่อให้คุณอธิบาย failure ได้เร็ว):
  - `read` probe: การทดสอบเขียนไฟล์ nonce ใน workspace และขอให้ agent `read` ไฟล์นั้น แล้ว echo nonce กลับมา
  - `exec+read` probe: การทดสอบขอให้ agent ใช้ `exec` เขียน nonce ลงใน temp file แล้ว `read` กลับมา
  - image probe: การทดสอบแนบ PNG ที่สร้างขึ้น (cat + randomized code) และคาดว่าโมเดลจะตอบกลับเป็น `cat <CODE>`
  - อ้างอิง implementation: `src/gateway/gateway-models.profiles.live.test.ts` และ `src/gateway/live-image-probe.ts`
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- วิธีเลือกโมเดล:
  - ค่าเริ่มต้น: allowlist สมัยใหม่ (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` เป็น alias สำหรับ allowlist สมัยใหม่
  - หรือตั้ง `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (หรือ comma list) เพื่อจำกัดให้แคบลง
  - การ sweep gateway แบบ Modern/all มีค่าเริ่มต้นเป็น cap ที่คัด curated high-signal ไว้; ตั้ง `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` สำหรับการ sweep modern แบบ exhaustive หรือจำนวนบวกสำหรับ cap ที่เล็กกว่า
- วิธีเลือก providers (หลีกเลี่ยง "OpenRouter everything"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (comma allowlist)
- Tool + image probes เปิดเสมอในการทดสอบ live นี้:
  - `read` probe + `exec+read` probe (tool stress)
  - image probe รันเมื่อโมเดลประกาศว่ารองรับ image input
  - โฟลว์ (ระดับสูง):
    - การทดสอบสร้าง PNG ขนาดเล็กที่มี "CAT" + random code (`src/gateway/live-image-probe.ts`)
    - ส่งผ่าน `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parse attachments เป็น `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - embedded agent ส่ง multimodal user message ต่อไปยังโมเดล
    - Assertion: reply มี `cat` + code (OCR tolerance: อนุญาตข้อผิดพลาดเล็กน้อย)

<Tip>
หากต้องการดูว่าคุณทดสอบอะไรบนเครื่องของคุณได้บ้าง (และ id `provider/model` ที่แน่นอน) ให้รัน:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: CLI backend smoke (Claude, Codex, Gemini หรือ local CLI อื่น)

- การทดสอบ: `src/gateway/gateway-cli-backend.live.test.ts`
- เป้าหมาย: ตรวจสอบ pipeline Gateway + agent โดยใช้ local CLI backend โดยไม่แตะ config เริ่มต้นของคุณ
- ค่า smoke เริ่มต้นเฉพาะ backend อยู่กับ definition `cli-backend.ts` ของ Plugin ที่เป็นเจ้าของ
- เปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- ค่าเริ่มต้น:
  - provider/model เริ่มต้น: `claude-cli/claude-sonnet-4-6`
  - พฤติกรรม command/args/image มาจาก metadata ของ CLI backend plugin ที่เป็นเจ้าของ
- Overrides (optional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` เพื่อส่ง image attachment จริง (paths ถูก inject เข้าไปใน prompt) Docker recipes ปิดค่านี้โดยค่าเริ่มต้น เว้นแต่จะร้องขออย่างชัดเจน
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` เพื่อส่ง image file paths เป็น CLI args แทน prompt injection
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (หรือ `"list"`) เพื่อควบคุมวิธีส่ง image args เมื่อตั้ง `IMAGE_ARG`
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` เพื่อส่ง turn ที่สองและตรวจสอบ resume flow
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` เพื่อ opt into probe ความต่อเนื่องใน session เดียวกันจาก Claude Sonnet -> Opus เมื่อโมเดลที่เลือก support switch target Docker recipes ปิดค่านี้โดยค่าเริ่มต้นเพื่อความน่าเชื่อถือแบบ aggregate
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` เพื่อ opt into MCP/tool loopback probe Docker recipes ปิดค่านี้โดยค่าเริ่มต้น เว้นแต่จะร้องขออย่างชัดเจน

ตัวอย่าง:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Cheap Gemini MCP config smoke:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

สิ่งนี้ไม่ได้ขอให้ Gemini generate response แต่เขียน system
settings เดียวกับที่ OpenClaw มอบให้ Gemini แล้วรัน `gemini --debug mcp list` เพื่อพิสูจน์ว่า
server `transport: "streamable-http"` ที่บันทึกไว้ถูก normalize เป็น shape HTTP MCP ของ Gemini
และเชื่อมต่อกับ local streamable-HTTP MCP server ได้

Docker recipe:

```bash
pnpm test:docker:live-cli-backend
```

Single-provider Docker recipes:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

หมายเหตุ:

- Docker runner อยู่ที่ `scripts/test-live-cli-backend-docker.sh`
- มันรัน live CLI-backend smoke ภายใน repo Docker image ในฐานะผู้ใช้ `node` ที่ไม่ใช่ root
- มัน resolve metadata ของ CLI smoke จาก extension ที่เป็นเจ้าของ แล้วติดตั้งแพ็กเกจ Linux CLI ที่ตรงกัน (`@anthropic-ai/claude-code`, `@openai/codex` หรือ `@google/gemini-cli`) ลงใน prefix ที่เขียนได้และมี cache ที่ `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`)
- `pnpm test:docker:live-cli-backend:claude-subscription` ต้องใช้ portable Claude Code subscription OAuth ผ่าน `~/.claude/.credentials.json` ที่มี `claudeAiOauth.subscriptionType` หรือ `CLAUDE_CODE_OAUTH_TOKEN` จาก `claude setup-token` ก่อนอื่นมันพิสูจน์ direct `claude -p` ใน Docker แล้วจึงรัน Gateway CLI-backend สอง turns โดยไม่ preserve env vars ของ Anthropic API-key lane subscription นี้ปิด Claude MCP/tool และ image probes โดยค่าเริ่มต้น เพราะปัจจุบัน Claude route การใช้งาน third-party app ผ่าน extra-usage billing แทนขีดจำกัดแผน subscription ปกติ
- live CLI-backend smoke ตอนนี้ทดสอบโฟลว์ end-to-end เดียวกันสำหรับ Claude, Codex และ Gemini: text turn, image classification turn แล้วจึงเป็น MCP `cron` tool call ที่ตรวจสอบผ่าน gateway CLI
- smoke เริ่มต้นของ Claude ยัง patch session จาก Sonnet เป็น Opus และตรวจสอบว่า resumed session ยังจำ note ก่อนหน้าได้

## Live: ความสามารถในการเข้าถึง APNs HTTP/2 proxy

- การทดสอบ: `src/infra/push-apns-http2.live.test.ts`
- เป้าหมาย: tunnel ผ่าน local HTTP CONNECT proxy ไปยัง endpoint APNs sandbox ของ Apple, ส่ง APNs HTTP/2 validation request และยืนยันว่า response `403 InvalidProviderToken` จริงของ Apple กลับมาผ่าน proxy path
- เปิดใช้:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Timeout แบบ optional:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- ทดสอบ: `src/gateway/gateway-acp-bind.live.test.ts`
- เป้าหมาย: ตรวจสอบ flow การ bind conversation ของ ACP จริงกับ ACP agent แบบ live:
  - ส่ง `/acp spawn <agent> --bind here`
  - bind conversation ของ message-channel สังเคราะห์ไว้ที่เดิม
  - ส่ง follow-up ปกติใน conversation เดียวกันนั้น
  - ตรวจสอบว่า follow-up เข้าไปอยู่ใน transcript ของ ACP session ที่ bind แล้ว
- เปิดใช้:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- ค่าเริ่มต้น:
  - ACP agents ใน Docker: `claude,codex,gemini`
  - ACP agent สำหรับ `pnpm test:live ...` โดยตรง: `claude`
  - Synthetic channel: context ของ conversation แบบ Slack DM
  - ACP backend: `acpx`
- Overrides:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- หมายเหตุ:
  - lane นี้ใช้ surface `chat.send` ของ Gateway พร้อมฟิลด์ originating-route สังเคราะห์แบบ admin-only เพื่อให้การทดสอบแนบ context ของ message-channel ได้โดยไม่ต้องแกล้งทำว่า deliver ออกไปภายนอก
  - เมื่อไม่ได้ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` การทดสอบจะใช้ agent registry ในตัวของ Plugin `acpx` ที่ฝังมา สำหรับ ACP harness agent ที่เลือกไว้
  - การสร้าง MCP สำหรับ cron ของ bound-session เป็นแบบ best-effort โดยค่าเริ่มต้น เพราะ ACP harness ภายนอกอาจยกเลิก MCP calls หลังจาก proof ของ bind/image ผ่านแล้ว ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` เพื่อให้ probe ของ cron หลัง bind นั้นเข้มงวด

ตัวอย่าง:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

สูตร Docker:

```bash
pnpm test:docker:live-acp-bind
```

สูตร Docker แบบ agent เดียว:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

หมายเหตุ Docker:

- Docker runner อยู่ที่ `scripts/test-live-acp-bind-docker.sh`
- โดยค่าเริ่มต้น มันรัน ACP bind smoke กับ aggregate live CLI agents ตามลำดับ: `claude`, `codex`, แล้ว `gemini`
- ใช้ `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, หรือ `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` เพื่อจำกัด matrix ให้แคบลง
- มัน source `~/.profile`, stage วัสดุ CLI auth ที่ตรงกันเข้า container จากนั้นติดตั้ง live CLI ที่ร้องขอ (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid ผ่าน `https://app.factory.ai/cli`, `@google/gemini-cli`, หรือ `opencode-ai`) หากยังไม่มี ACP backend เองคือ package `acpx/runtime` ที่ฝังมาจาก Plugin `acpx` อย่างเป็นทางการ
- ตัวแปร Docker ของ Droid stage `~/.factory` สำหรับ settings, forward `FACTORY_API_KEY`, และต้องใช้ API key นั้น เพราะ auth แบบ Factory OAuth/keyring ภายในเครื่องไม่สามารถพกพาเข้า container ได้ มันใช้ registry entry `droid exec --output-format acp` ในตัวของ ACPX
- ตัวแปร Docker ของ OpenCode เป็น regression lane แบบ agent เดียวที่เข้มงวด มันเขียน default model ชั่วคราวของ `OPENCODE_CONFIG_CONTENT` จาก `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (ค่าเริ่มต้น `opencode/kimi-k2.6`) หลังจาก source `~/.profile` และ `pnpm test:docker:live-acp-bind:opencode` ต้องมี bound assistant transcript แทนที่จะยอมรับ generic post-bind skip
- การเรียก `acpx` CLI โดยตรงเป็นเพียง path สำหรับ manual/workaround เพื่อเปรียบเทียบ behavior นอก Gateway เท่านั้น Docker ACP bind smoke ทดสอบ runtime backend `acpx` ที่ฝังอยู่ใน OpenClaw

## Live: smoke ของ Codex app-server harness

- เป้าหมาย: ตรวจสอบ Codex harness ที่ Plugin เป็นเจ้าของผ่าน Gateway ปกติ
  ด้วย method `agent`:
  - โหลด Plugin `codex` ที่ bundle มา
  - เลือก `openai/gpt-5.5` ซึ่ง route agent turns ของ OpenAI ผ่าน Codex โดยค่าเริ่มต้น
  - ส่ง Gateway agent turn แรกไปยัง `openai/gpt-5.5` โดยเลือก Codex harness
  - ส่ง turn ที่สองไปยัง OpenClaw session เดิม และตรวจสอบว่า thread ของ app-server
    resume ได้
  - รัน `/codex status` และ `/codex models` ผ่าน path ของ Gateway command เดียวกัน
  - เลือกรัน escalated shell probes สองรายการที่ Guardian-reviewed: command
    ที่ไม่เป็นอันตรายหนึ่งรายการซึ่งควรได้รับอนุมัติ และการอัปโหลด fake-secret หนึ่งรายการที่ควรถูก
    ปฏิเสธเพื่อให้ agent ถามกลับ
- ทดสอบ: `src/gateway/gateway-codex-harness.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- โมเดลเริ่มต้น: `openai/gpt-5.5`
- image probe แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- MCP/tool probe แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Guardian probe แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke บังคับ provider/model `agentRuntime.id: "codex"` เพื่อให้ Codex
  harness ที่เสียไม่สามารถผ่านได้โดย fallback ไปที่ PI แบบเงียบๆ
- Auth: auth ของ Codex app-server จากการ login subscription ของ Codex ในเครื่อง Docker
  smokes ยังสามารถให้ `OPENAI_API_KEY` สำหรับ probes ที่ไม่ใช่ Codex เมื่อใช้ได้
  พร้อมกับ `~/.codex/auth.json` และ `~/.codex/config.toml` ที่คัดลอกมาแบบเลือกได้

สูตรในเครื่อง:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

สูตร Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

หมายเหตุ Docker:

- Docker runner อยู่ที่ `scripts/test-live-codex-harness-docker.sh`
- มัน source `~/.profile` ที่ mount ไว้, ส่งผ่าน `OPENAI_API_KEY`, คัดลอกไฟล์ auth ของ Codex CLI
  เมื่อมีอยู่, ติดตั้ง `@openai/codex` ลงใน npm prefix ที่เขียนได้และ mount ไว้,
  stage source tree จากนั้นรันเฉพาะ live test ของ Codex-harness
- Docker เปิดใช้ image, MCP/tool, และ Guardian probes โดยค่าเริ่มต้น ตั้งค่า
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` เมื่อคุณต้องการ debug
  run ที่แคบลง
- Docker ใช้ config runtime ของ Codex ที่ชัดเจนแบบเดียวกัน ดังนั้น aliases เดิมหรือการ
  fallback ไปที่ PI จึงไม่สามารถซ่อน regression ของ Codex harness ได้

### สูตร live ที่แนะนำ

allowlist ที่แคบและชัดเจนเร็วที่สุดและ flaky น้อยที่สุด:

- โมเดลเดียว แบบ direct (ไม่ผ่าน Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- โมเดลเดียว Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling ข้ามหลาย providers:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- โฟกัส Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke:
  - หาก local keys อยู่ใน shell profile: `source ~/.profile`
  - ค่าเริ่มต้นแบบ dynamic ของ Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - budget แบบ dynamic ของ Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

หมายเหตุ:

- `google/...` ใช้ Gemini API (API key)
- `google-antigravity/...` ใช้ Antigravity OAuth bridge (agent endpoint แบบ Cloud Code Assist)
- `google-gemini-cli/...` ใช้ Gemini CLI ในเครื่องของคุณ (auth แยกต่างหาก + tooling quirks)
- Gemini API เทียบกับ Gemini CLI:
  - API: OpenClaw เรียก Gemini API ที่ Google host ผ่าน HTTP (API key / profile auth); นี่คือสิ่งที่ผู้ใช้ส่วนใหญ่หมายถึงเมื่อพูดว่า "Gemini"
  - CLI: OpenClaw shell out ไปยัง binary `gemini` ในเครื่อง; มันมี auth ของตัวเองและอาจทำงานต่างกัน (streaming/tool support/version skew)

## Live: model matrix (สิ่งที่เราครอบคลุม)

ไม่มี "รายการโมเดล CI" ที่ตายตัว (live เป็น opt-in) แต่นี่คือโมเดลที่ **แนะนำ** ให้ครอบคลุมเป็นประจำบนเครื่อง dev ที่มี keys

### ชุด smoke สมัยใหม่ (tool calling + image)

นี่คือ run ของ "common models" ที่เราคาดว่าจะรักษาให้ใช้งานได้:

- OpenAI (ไม่ใช่ Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` และ `google/gemini-3-flash-preview` (หลีกเลี่ยงโมเดล Gemini 2.x ที่เก่ากว่า)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` และ `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` และ `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

รัน Gateway smoke พร้อม tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + Exec แบบเลือกได้)

เลือกอย่างน้อยหนึ่งรายการต่อ provider family:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (หรือ `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

ความครอบคลุมเพิ่มเติมแบบเลือกได้ (มีไว้ก็ดี):

- xAI: `xai/grok-4.3` (หรือเวอร์ชันล่าสุดที่มี)
- Mistral: `mistral/`… (เลือกโมเดลที่รองรับ "tools" หนึ่งรายการที่คุณเปิดใช้อยู่)
- Cerebras: `cerebras/`… (หากคุณมีสิทธิ์เข้าถึง)
- LM Studio: `lmstudio/`… (local; tool calling ขึ้นอยู่กับ API mode)

### Vision: การส่ง image (attachment → multimodal message)

ใส่โมเดลที่รองรับ image อย่างน้อยหนึ่งรายการใน `OPENCLAW_LIVE_GATEWAY_MODELS` (variants ที่รองรับ vision ของ Claude/Gemini/OpenAI ฯลฯ) เพื่อทดสอบ image probe

### Aggregators / alternate gateways

หากคุณเปิดใช้ keys ไว้ เรายังรองรับการทดสอบผ่าน:

- OpenRouter: `openrouter/...` (โมเดลหลายร้อยรายการ; ใช้ `openclaw models scan` เพื่อค้นหา candidates ที่รองรับ tool+image)
- OpenCode: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go (auth ผ่าน `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

providers เพิ่มเติมที่คุณสามารถใส่ใน live matrix ได้ (หากคุณมี creds/config):

- ในตัว: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- ผ่าน `models.providers` (custom endpoints): `minimax` (cloud/API), รวมถึง proxy ที่เข้ากันได้กับ OpenAI/Anthropic ใดๆ (LM Studio, vLLM, LiteLLM ฯลฯ)

<Tip>
อย่า hardcode "all models" ใน docs รายการที่ authoritative คือสิ่งที่ `discoverModels(...)` return บนเครื่องของคุณ บวกกับ keys ที่มีอยู่
</Tip>

## Credentials (ห้าม commit)

Live tests ค้นหา credentials แบบเดียวกับที่ CLI ทำ ผลที่ตามมาในทางปฏิบัติ:

- หาก CLI ทำงานได้ การทดสอบแบบใช้งานจริงควรพบคีย์เดียวกัน
- หากการทดสอบแบบใช้งานจริงแจ้งว่า "no creds" ให้ดีบักด้วยวิธีเดียวกับที่คุณใช้ดีบัก `openclaw models list` / การเลือกโมเดล

- โปรไฟล์การยืนยันตัวตนต่อเอเจนต์: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (นี่คือความหมายของ "profile keys" ในการทดสอบแบบใช้งานจริง)
- การกำหนดค่า: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรีสถานะดั้งเดิม: `~/.openclaw/credentials/` (จะถูกคัดลอกเข้าไปในโฮมแบบใช้งานจริงที่จัดเตรียมไว้เมื่อมีอยู่ แต่ไม่ใช่ที่เก็บคีย์โปรไฟล์หลัก)
- การรันแบบใช้งานจริงในเครื่องจะคัดลอกการกำหนดค่าที่ใช้งานอยู่, ไฟล์ `auth-profiles.json` ต่อเอเจนต์, `credentials/` ดั้งเดิม และไดเรกทอรีการยืนยันตัวตน CLI ภายนอกที่รองรับ เข้าไปยังโฮมทดสอบชั่วคราวโดยค่าเริ่มต้น โฮมแบบใช้งานจริงที่จัดเตรียมไว้จะข้าม `workspace/` และ `sandboxes/` และการเขียนทับพาธ `agents.*.workspace` / `agentDir` จะถูกตัดออกเพื่อให้การตรวจสอบไม่แตะ workspace จริงบนโฮสต์ของคุณ

หากคุณต้องการพึ่งพาคีย์จาก env (เช่น ส่งออกไว้ใน `~/.profile`) ให้รันการทดสอบในเครื่องหลังจาก `source ~/.profile` หรือใช้ตัวรัน Docker ด้านล่าง (ซึ่งสามารถเมานต์ `~/.profile` เข้าไปในคอนเทนเนอร์ได้)

## Deepgram แบบใช้งานจริง (การถอดเสียง)

- การทดสอบ: `extensions/deepgram/audio.live.test.ts`
- เปิดใช้งาน: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan แบบใช้งานจริง

- การทดสอบ: `extensions/byteplus/live.test.ts`
- เปิดใช้งาน: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- การเขียนทับโมเดลแบบไม่บังคับ: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## สื่อ workflow ของ ComfyUI แบบใช้งานจริง

- การทดสอบ: `extensions/comfy/comfy.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- ขอบเขต:
  - ทดสอบเส้นทางภาพ วิดีโอ และ `music_generate` ของ comfy ที่รวมมาให้
  - ข้ามแต่ละความสามารถ เว้นแต่จะกำหนดค่า `plugins.entries.comfy.config.<capability>` ไว้
  - มีประโยชน์หลังจากเปลี่ยนการส่ง workflow ของ comfy, การ polling, การดาวน์โหลด หรือการลงทะเบียน Plugin

## การสร้างภาพแบบใช้งานจริง

- การทดสอบ: `test/image-generation.runtime.live.test.ts`
- คำสั่ง: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ชุดทดสอบ: `pnpm test:live:media image`
- ขอบเขต:
  - แจกแจง Plugin ผู้ให้บริการสร้างภาพที่ลงทะเบียนไว้ทั้งหมด
  - โหลด env vars ของผู้ให้บริการที่ขาดหายจากเชลล์ล็อกอินของคุณ (`~/.profile`) ก่อนตรวจสอบ
  - ใช้คีย์ API จากแบบใช้งานจริง/env ก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้โดยค่าเริ่มต้น ดังนั้นคีย์ทดสอบที่ล้าสมัยใน `auth-profiles.json` จะไม่บดบังข้อมูลรับรองจริงจากเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - รันผู้ให้บริการที่กำหนดค่าไว้แต่ละรายผ่าน runtime การสร้างภาพที่ใช้ร่วมกัน:
    - `<provider>:generate`
    - `<provider>:edit` เมื่อผู้ให้บริการประกาศการรองรับการแก้ไข
- ผู้ให้บริการที่รวมมาให้ในปัจจุบันที่ครอบคลุม:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- พฤติกรรมการยืนยันตัวตนแบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการเขียนทับที่มีเฉพาะ env

สำหรับเส้นทาง CLI ที่จัดส่ง ให้เพิ่ม smoke `infer` หลังจากการทดสอบแบบใช้งานจริงของผู้ให้บริการ/runtime ผ่านแล้ว:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

ส่วนนี้ครอบคลุมการแยกวิเคราะห์อาร์กิวเมนต์ CLI, การแก้ค่าการกำหนดค่า/default-agent, การเปิดใช้งาน
Plugin ที่รวมมาให้, runtime การสร้างภาพที่ใช้ร่วมกัน และคำขอแบบใช้งานจริงไปยังผู้ให้บริการ
คาดว่า dependencies ของ Plugin ต้องมีอยู่ก่อนโหลด runtime

## การสร้างเพลงแบบใช้งานจริง

- การทดสอบ: `extensions/music-generation-providers.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ชุดทดสอบ: `pnpm test:live:media music`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างเพลงที่รวมมาให้และใช้ร่วมกัน
  - ปัจจุบันครอบคลุม Google และ MiniMax
  - โหลด env vars ของผู้ให้บริการจากเชลล์ล็อกอินของคุณ (`~/.profile`) ก่อนตรวจสอบ
  - ใช้คีย์ API จากแบบใช้งานจริง/env ก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้โดยค่าเริ่มต้น ดังนั้นคีย์ทดสอบที่ล้าสมัยใน `auth-profiles.json` จะไม่บดบังข้อมูลรับรองจริงจากเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - รันโหมด runtime ที่ประกาศไว้ทั้งสองโหมดเมื่อพร้อมใช้งาน:
    - `generate` พร้อมอินพุตที่มีเฉพาะ prompt
    - `edit` เมื่อผู้ให้บริการประกาศ `capabilities.edit.enabled`
  - ความครอบคลุมของเลนที่ใช้ร่วมกันในปัจจุบัน:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ไฟล์ Comfy แบบใช้งานจริงแยกต่างหาก ไม่ใช่การ sweep ที่ใช้ร่วมกันนี้
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- พฤติกรรมการยืนยันตัวตนแบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการเขียนทับที่มีเฉพาะ env

## การสร้างวิดีโอแบบใช้งานจริง

- การทดสอบ: `extensions/video-generation-providers.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ชุดทดสอบ: `pnpm test:live:media video`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างวิดีโอที่รวมมาให้และใช้ร่วมกัน
  - ค่าเริ่มต้นเป็นเส้นทาง smoke ที่ปลอดภัยสำหรับ release: ผู้ให้บริการที่ไม่ใช่ FAL, คำขอ text-to-video หนึ่งรายการต่อผู้ให้บริการ, prompt กุ้งล็อบสเตอร์หนึ่งวินาที และเพดานเวลาปฏิบัติการต่อผู้ให้บริการจาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` โดยค่าเริ่มต้น)
  - ข้าม FAL โดยค่าเริ่มต้นเพราะเวลาแฝงของคิวฝั่งผู้ให้บริการอาจกินเวลา release เป็นหลัก ให้ส่ง `--video-providers fal` หรือ `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` เพื่อรันอย่างชัดเจน
  - โหลด env vars ของผู้ให้บริการจากเชลล์ล็อกอินของคุณ (`~/.profile`) ก่อนตรวจสอบ
  - ใช้คีย์ API จากแบบใช้งานจริง/env ก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้โดยค่าเริ่มต้น ดังนั้นคีย์ทดสอบที่ล้าสมัยใน `auth-profiles.json` จะไม่บดบังข้อมูลรับรองจริงจากเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - รันเฉพาะ `generate` โดยค่าเริ่มต้น
  - ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรันโหมด transform ที่ประกาศไว้ด้วยเมื่อพร้อมใช้งาน:
    - `imageToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.imageToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตภาพในเครื่องที่หนุนด้วย buffer ในการ sweep ที่ใช้ร่วมกัน
    - `videoToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.videoToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตวิดีโอในเครื่องที่หนุนด้วย buffer ในการ sweep ที่ใช้ร่วมกัน
  - ผู้ให้บริการ `imageToVideo` ที่ประกาศไว้แต่ถูกข้ามในปัจจุบันในการ sweep ที่ใช้ร่วมกัน:
    - `vydra` เพราะ `veo3` ที่รวมมาให้รองรับเฉพาะข้อความ และ `kling` ที่รวมมาให้ต้องใช้ URL ภาพระยะไกล
  - ความครอบคลุมเฉพาะผู้ให้บริการของ Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ไฟล์นั้นรัน text-to-video ของ `veo3` พร้อมกับเลน `kling` ที่ใช้ fixture URL ภาพระยะไกลโดยค่าเริ่มต้น
  - ความครอบคลุมแบบใช้งานจริงของ `videoToVideo` ในปัจจุบัน:
    - `runway` เฉพาะเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`
  - ผู้ให้บริการ `videoToVideo` ที่ประกาศไว้แต่ถูกข้ามในปัจจุบันในการ sweep ที่ใช้ร่วมกัน:
    - `alibaba`, `qwen`, `xai` เพราะเส้นทางเหล่านั้นปัจจุบันต้องใช้ URL อ้างอิง `http(s)` / MP4 ระยะไกล
    - `google` เพราะเลน Gemini/Veo ที่ใช้ร่วมกันในปัจจุบันใช้อินพุตในเครื่องที่หนุนด้วย buffer และเส้นทางนั้นไม่ได้รับการยอมรับในการ sweep ที่ใช้ร่วมกัน
    - `openai` เพราะเลนที่ใช้ร่วมกันในปัจจุบันยังไม่มีการรับประกันสิทธิ์เข้าถึง video inpaint/remix เฉพาะองค์กร
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` เพื่อรวมผู้ให้บริการทุกแห่งในการ sweep เริ่มต้น รวมถึง FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` เพื่อลดเพดานเวลาปฏิบัติการของผู้ให้บริการแต่ละรายสำหรับการรัน smoke แบบเข้มข้น
- พฤติกรรมการยืนยันตัวตนแบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการเขียนทับที่มีเฉพาะ env

## ชุดทดสอบสื่อแบบใช้งานจริง

- คำสั่ง: `pnpm test:live:media`
- วัตถุประสงค์:
  - รันชุดทดสอบแบบใช้งานจริงของภาพ เพลง และวิดีโอที่ใช้ร่วมกันผ่าน entrypoint ภายใน repo เดียว
  - โหลด env vars ของผู้ให้บริการที่ขาดหายจาก `~/.profile` โดยอัตโนมัติ
  - จำกัดขอบเขตแต่ละชุดทดสอบโดยอัตโนมัติให้เหลือผู้ให้บริการที่ปัจจุบันมีการยืนยันตัวตนที่ใช้งานได้โดยค่าเริ่มต้น
  - ใช้ `scripts/test-live.mjs` ซ้ำ ดังนั้นพฤติกรรม Heartbeat และโหมดเงียบจึงสอดคล้องกัน
- ตัวอย่าง:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing) - ชุดทดสอบหน่วย, การผสานรวม, QA และ Docker
