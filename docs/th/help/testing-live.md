---
read_when:
    - การรัน smoke test แบบ live สำหรับเมทริกซ์โมเดล / แบ็กเอนด์ของ CLI / ACP / ผู้ให้บริการสื่อ
    - การดีบักการ resolve ข้อมูลรับรองของการทดสอบแบบ live
    - การเพิ่มการทดสอบแบบ live เฉพาะผู้ให้บริการรายการใหม่
sidebarTitle: Live tests
summary: 'การทดสอบแบบ Live (มีการเข้าถึงเครือข่าย): เมทริกซ์โมเดล, แบ็กเอนด์ของ CLI, ACP, ผู้ให้บริการสื่อ, ข้อมูลรับรอง'
title: 'การทดสอบ: ชุดทดสอบแบบ live'
x-i18n:
    generated_at: "2026-04-26T11:33:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 669d68dc80d0bf86942635c792f64f1edc7a23684c880cb66799401dee3d127f
    source_path: help/testing-live.md
    workflow: 15
---

สำหรับการเริ่มต้นอย่างรวดเร็ว, QA runner, ชุดทดสอบ unit/integration และโฟลว์ Docker โปรดดู
[Testing](/th/help/testing) หน้านี้ครอบคลุมชุดทดสอบแบบ **live**
(มีการเข้าถึงเครือข่าย): เมทริกซ์โมเดล, แบ็กเอนด์ของ CLI, ACP และการทดสอบผู้ให้บริการสื่อแบบ live รวมถึง
การจัดการข้อมูลรับรอง

## Live: คำสั่ง smoke สำหรับโปรไฟล์ในเครื่อง

ให้ source `~/.profile` ก่อนการตรวจสอบ live แบบเฉพาะกิจ เพื่อให้ provider key และพาธของเครื่องมือในเครื่อง
ตรงกับ shell ของคุณ:

```bash
source ~/.profile
```

safe media smoke:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

safe voice-call readiness smoke:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` เป็น dry run เว้นแต่จะมี `--yes` ด้วย ใช้ `--yes` เฉพาะ
เมื่อคุณตั้งใจจะโทรแจ้งเตือนจริง สำหรับ Twilio, Telnyx และ
Plivo การตรวจสอบความพร้อมที่สำเร็จต้องใช้ URL Webhook แบบสาธารณะ; fallback แบบ local-only
loopback/private จะถูกปฏิเสธโดยการออกแบบ

## Live: การกวาดความสามารถของ Android node

- ทดสอบ: `src/gateway/android-node.capabilities.live.test.ts`
- สคริปต์: `pnpm android:test:integration`
- เป้าหมาย: เรียกใช้**ทุกคำสั่งที่มีการประกาศอยู่ในปัจจุบัน**โดย Android node ที่เชื่อมต่ออยู่ และยืนยันพฤติกรรมตามสัญญาของคำสั่ง
- ขอบเขต:
  - การตั้งค่าเบื้องต้น/แบบทำด้วยตนเอง (ชุดทดสอบจะไม่ติดตั้ง/รัน/จับคู่แอป)
  - การตรวจสอบ `node.invoke` ของ gateway ทีละคำสั่งสำหรับ Android node ที่เลือก
- การตั้งค่าที่ต้องมีล่วงหน้า:
  - แอป Android เชื่อมต่อและจับคู่กับ gateway แล้ว
  - ให้แอปอยู่เบื้องหน้า
  - อนุญาต permissions/consent สำหรับการจับภาพในความสามารถที่คุณคาดว่าจะผ่าน
- ตัวเลือก override เป้าหมาย:
  - `OPENCLAW_ANDROID_NODE_ID` หรือ `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- รายละเอียดการตั้งค่า Android แบบเต็ม: [Android App](/th/platforms/android)

## Live: model smoke (คีย์ของโปรไฟล์)

การทดสอบแบบ live ถูกแบ่งเป็น 2 ชั้น เพื่อให้เราแยกปัญหาได้:

- “Direct model” บอกเราว่า provider/model สามารถตอบได้จริงด้วยคีย์ที่กำหนดหรือไม่
- “Gateway smoke” บอกเราว่า pipeline แบบเต็มของ gateway+agent ใช้งานได้กับโมเดลนั้นหรือไม่ (sessions, history, tools, นโยบาย sandbox เป็นต้น)

### ชั้นที่ 1: Direct model completion (ไม่มี gateway)

- ทดสอบ: `src/agents/models.profiles.live.test.ts`
- เป้าหมาย:
  - ไล่ดูโมเดลที่ค้นพบได้
  - ใช้ `getApiKeyForModel` เพื่อเลือกโมเดลที่คุณมีข้อมูลรับรอง
  - รัน completion ขนาดเล็กรายโมเดล (และ regression แบบเจาะจงเมื่อจำเป็น)
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- ตั้ง `OPENCLAW_LIVE_MODELS=modern` (หรือ `all`, alias ของ modern) เพื่อรันชุดทดสอบนี้จริง มิฉะนั้นจะถูกข้ามเพื่อให้ `pnpm test:live` โฟกัสที่ gateway smoke
- วิธีเลือกโมเดล:
  - `OPENCLAW_LIVE_MODELS=modern` เพื่อรัน modern allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` เป็น alias ของ modern allowlist
  - หรือ `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (comma allowlist)
  - การกวาดแบบ modern/all จะใช้เพดาน high-signal ที่คัดสรรไว้โดยค่าเริ่มต้น; ตั้ง `OPENCLAW_LIVE_MAX_MODELS=0` เพื่อกวาด modern แบบครบถ้วน หรือกำหนดเลขบวกสำหรับเพดานที่เล็กลง
  - การกวาดแบบครบถ้วนใช้ `OPENCLAW_LIVE_TEST_TIMEOUT_MS` เป็น timeout ของการทดสอบ direct-model ทั้งหมด ค่าเริ่มต้น: 60 นาที
  - probe ของ direct-model รันแบบขนาน 20 งานโดยค่าเริ่มต้น; ตั้ง `OPENCLAW_LIVE_MODEL_CONCURRENCY` เพื่อ override
- วิธีเลือก provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (comma allowlist)
- แหล่งที่มาของคีย์:
  - โดยค่าเริ่มต้น: profile store และ env fallback
  - ตั้ง `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้เฉพาะ **profile store**
- เหตุผลที่มีสิ่งนี้:
  - แยก “provider API พัง / คีย์ไม่ถูกต้อง” ออกจาก “pipeline ของ gateway agent พัง”
  - รองรับ regression ขนาดเล็กและแยกส่วน (ตัวอย่าง: OpenAI Responses/Codex Responses reasoning replay + โฟลว์ tool-call)

### ชั้นที่ 2: Gateway + dev agent smoke (สิ่งที่ "@openclaw" ทำจริง)

- ทดสอบ: `src/gateway/gateway-models.profiles.live.test.ts`
- เป้าหมาย:
  - หมุน gateway ในโปรเซสเดียวกัน
  - สร้าง/แพตช์เซสชัน `agent:dev:*` (override โมเดลต่อการรัน)
  - วนทดสอบโมเดลที่มีคีย์และยืนยันว่า:
    - ได้การตอบกลับที่ “มีความหมาย” (ไม่มี tools)
    - การเรียกใช้เครื่องมือจริงทำงานได้ (read probe)
    - probe เครื่องมือเสริมที่เป็นตัวเลือกทำงานได้ (`exec+read` probe)
    - เส้นทาง regression ของ OpenAI (tool-call-only → follow-up) ยังคงทำงาน
- รายละเอียด probe (เพื่อให้คุณอธิบายความล้มเหลวได้อย่างรวดเร็ว):
  - `read` probe: ชุดทดสอบจะเขียนไฟล์ nonce ใน workspace แล้วขอให้เอเจนต์ `read` ไฟล์นั้นและ echo nonce กลับมา
  - `exec+read` probe: ชุดทดสอบจะขอให้เอเจนต์ใช้ `exec` เขียน nonce ลงในไฟล์ชั่วคราว แล้ว `read` กลับมา
  - image probe: ชุดทดสอบจะแนบ PNG ที่สร้างขึ้น (แมว + โค้ดสุ่ม) และคาดว่าโมเดลจะตอบ `cat <CODE>`
  - อ้างอิงการติดตั้ง: `src/gateway/gateway-models.profiles.live.test.ts` และ `src/gateway/live-image-probe.ts`
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- วิธีเลือกโมเดล:
  - ค่าเริ่มต้น: modern allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` เป็น alias ของ modern allowlist
  - หรือกำหนด `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (หรือ comma list) เพื่อจำกัดให้แคบลง
  - การกวาด gateway แบบ modern/all จะใช้เพดาน high-signal ที่คัดสรรไว้โดยค่าเริ่มต้น; ตั้ง `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` เพื่อกวาด modern แบบครบถ้วน หรือกำหนดเลขบวกสำหรับเพดานที่เล็กลง
- วิธีเลือก provider (หลีกเลี่ยง “OpenRouter ทุกอย่าง”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (comma allowlist)
- tool + image probe เปิดเสมอในชุดทดสอบ live นี้:
  - `read` probe + `exec+read` probe (stress ของเครื่องมือ)
  - image probe จะรันเมื่อโมเดลประกาศว่ารองรับ image input
  - โฟลว์ (ระดับสูง):
    - ชุดทดสอบสร้าง PNG ขนาดเล็กที่มี “CAT” + โค้ดสุ่ม (`src/gateway/live-image-probe.ts`)
    - ส่งผ่าน `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway แยก attachments เข้าเป็น `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - เอเจนต์แบบ embedded ส่งต่อข้อความผู้ใช้แบบมัลติโหมดไปยังโมเดล
    - การยืนยัน: คำตอบมี `cat` + โค้ดนั้น (มีความยืดหยุ่นกับ OCR: ผิดพลาดเล็กน้อยได้)

เคล็ดลับ: หากต้องการดูว่าสามารถทดสอบอะไรได้บนเครื่องของคุณ (รวมถึง `provider/model` id ที่ตรงตัว) ให้รัน:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI backend smoke (Claude, Codex, Gemini หรือ CLI ในเครื่องอื่น ๆ)

- ทดสอบ: `src/gateway/gateway-cli-backend.live.test.ts`
- เป้าหมาย: ตรวจสอบ pipeline ของ Gateway + agent โดยใช้แบ็กเอนด์ CLI ในเครื่อง โดยไม่แตะคอนฟิกเริ่มต้นของคุณ
- ค่าเริ่มต้นของ smoke เฉพาะแบ็กเอนด์อยู่ในนิยาม `cli-backend.ts` ของส่วนขยายเจ้าของนั้น
- เปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- ค่าเริ่มต้น:
  - provider/model เริ่มต้น: `claude-cli/claude-sonnet-4-6`
  - พฤติกรรมของ command/args/image มาจากเมทาดาทา Plugin ของ CLI backend ที่เป็นเจ้าของ
- Override (ทางเลือก):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` เพื่อส่ง image attachment จริง (พาธจะถูก inject เข้าในพรอมป์) สูตร Docker จะปิดค่านี้โดยค่าเริ่มต้น เว้นแต่มีการร้องขออย่างชัดเจน
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` เพื่อส่งพาธไฟล์ภาพเป็น CLI args แทนการ inject ในพรอมป์
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (หรือ `"list"`) เพื่อควบคุมวิธีส่ง image args เมื่อมีการตั้ง `IMAGE_ARG`
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` เพื่อส่ง turn ที่สองและตรวจสอบโฟลว์ resume
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` เพื่อเลือกใช้ probe ความต่อเนื่องในเซสชันเดียวกันจาก Claude Sonnet -> Opus เมื่อโมเดลที่เลือกมีเป้าหมายให้สลับได้ สูตร Docker จะปิดค่านี้โดยค่าเริ่มต้นเพื่อความเชื่อถือได้โดยรวม
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` เพื่อเลือกใช้ probe MCP/tool loopback สูตร Docker จะปิดค่านี้โดยค่าเริ่มต้น เว้นแต่มีการร้องขออย่างชัดเจน

ตัวอย่าง:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Gemini MCP config smoke แบบต้นทุนต่ำ:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

สิ่งนี้ไม่ได้ให้ Gemini สร้างคำตอบ มันจะเขียน system
settings เดียวกับที่ OpenClaw ให้ Gemini จากนั้นรัน `gemini --debug mcp list` เพื่อพิสูจน์ว่า
เซิร์ฟเวอร์ `transport: "streamable-http"` ที่บันทึกไว้ถูก normalize เป็นรูปแบบ HTTP MCP ของ Gemini
และสามารถเชื่อมต่อกับเซิร์ฟเวอร์ MCP แบบ streamable-HTTP ในเครื่องได้

สูตร Docker:

```bash
pnpm test:docker:live-cli-backend
```

สูตร Docker แบบผู้ให้บริการเดี่ยว:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

หมายเหตุ:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-cli-backend-docker.sh`
- มันจะรัน smoke ของ live CLI-backend ภายในอิมเมจ Docker ของ repo ในฐานะผู้ใช้ `node` ที่ไม่ใช่ root
- มันจะ resolve เมทาดาทา CLI smoke จากส่วนขยายเจ้าของ จากนั้นติดตั้งแพ็กเกจ Linux CLI ที่ตรงกัน (`@anthropic-ai/claude-code`, `@openai/codex` หรือ `@google/gemini-cli`) ลงใน prefix ที่เขียนได้และมีแคชไว้ที่ `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`)
- `pnpm test:docker:live-cli-backend:claude-subscription` ต้องใช้ portable Claude Code subscription OAuth ผ่านทาง `~/.claude/.credentials.json` ที่มี `claudeAiOauth.subscriptionType` หรือ `CLAUDE_CODE_OAUTH_TOKEN` จาก `claude setup-token` ก่อนอื่นจะพิสูจน์ `claude -p` โดยตรงใน Docker จากนั้นจึงรัน Gateway CLI-backend สอง turn โดยไม่เก็บ Anthropic API-key env vars ไว้ lane ของ subscription นี้จะปิด probe ของ Claude MCP/tool และ image โดยค่าเริ่มต้น เพราะขณะนี้ Claude กำหนดเส้นทางการใช้งานแอปของบุคคลที่สามผ่าน extra-usage billing แทนข้อจำกัดปกติของแผน subscription
- ตอนนี้ smoke ของ live CLI-backend ใช้โฟลว์ end-to-end เดียวกันสำหรับ Claude, Codex และ Gemini: text turn, image classification turn จากนั้นเป็นการเรียกเครื่องมือ `cron` ของ MCP ที่ตรวจสอบผ่าน gateway CLI
- smoke เริ่มต้นของ Claude ยังแพตช์เซสชันจาก Sonnet ไป Opus และตรวจสอบว่าเซสชันที่ resume แล้ว ยังจำบันทึกก่อนหน้านี้ได้

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- ทดสอบ: `src/gateway/gateway-acp-bind.live.test.ts`
- เป้าหมาย: ตรวจสอบโฟลว์ bind การสนทนา ACP จริงกับ ACP agent แบบ live:
  - ส่ง `/acp spawn <agent> --bind here`
  - bind การสนทนาแบบ message-channel สังเคราะห์ในตำแหน่งเดิม
  - ส่งข้อความติดตามผลปกติในการสนทนาเดียวกันนั้น
  - ตรวจสอบว่าข้อความติดตามผลถูกบันทึกลงในทรานสคริปต์ของเซสชัน ACP ที่ bind ไว้
- เปิดใช้:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- ค่าเริ่มต้น:
  - ACP agents ใน Docker: `claude,codex,gemini`
  - ACP agent สำหรับ `pnpm test:live ...` โดยตรง: `claude`
  - แชนเนลสังเคราะห์: บริบทการสนทนาแบบ Slack DM
  - ACP backend: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- หมายเหตุ:
  - lane นี้ใช้พื้นผิว `chat.send` ของ gateway พร้อมฟิลด์ originating-route แบบสังเคราะห์ที่ใช้ได้เฉพาะผู้ดูแลระบบ เพื่อให้การทดสอบแนบบริบทของ message-channel ได้โดยไม่ต้องแสร้งส่งออกไปภายนอกจริง
  - เมื่อไม่ได้ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ชุดทดสอบจะใช้รีจิสทรี agent ในตัวของ Plugin `acpx` แบบ embedded สำหรับ ACP harness agent ที่เลือก

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

สูตร Docker แบบ agent เดี่ยว:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

หมายเหตุสำหรับ Docker:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-acp-bind-docker.sh`
- โดยค่าเริ่มต้น มันจะรัน ACP bind smoke กับ live CLI agents แบบรวมตามลำดับ: `claude`, `codex`, จากนั้น `gemini`
- ใช้ `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` หรือ `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` เพื่อจำกัดเมทริกซ์ให้แคบลง
- มันจะ source `~/.profile`, จัดเตรียมข้อมูล auth ของ CLI ที่ตรงกันเข้าในคอนเทนเนอร์ จากนั้นติดตั้ง live CLI ที่ร้องขอ (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid ผ่าน `https://app.factory.ai/cli`, `@google/gemini-cli` หรือ `opencode-ai`) หากยังไม่มี ส่วน ACP backend เองใช้แพ็กเกจ `acpx/runtime` แบบ embedded ที่มาพร้อมกับ Plugin `acpx`
- ตัวแปร Docker ของ Droid จะจัดเตรียม `~/.factory` สำหรับการตั้งค่า, ส่งต่อ `FACTORY_API_KEY` และต้องใช้ API key ดังกล่าว เพราะ auth แบบ Factory OAuth/keyring ในเครื่องไม่สามารถพกพาเข้าไปในคอนเทนเนอร์ได้ มันใช้ entry ในตัวของ ACPX คือ `droid exec --output-format acp`
- ตัวแปร Docker ของ OpenCode เป็น lane regression แบบ single-agent ที่เข้มงวด มันจะเขียน `OPENCODE_CONFIG_CONTENT` ชั่วคราวสำหรับโมเดลเริ่มต้นจาก `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (ค่าเริ่มต้น `opencode/kimi-k2.6`) หลังจาก source `~/.profile` แล้ว และ `pnpm test:docker:live-acp-bind:opencode` ต้องการทรานสคริปต์ assistant ที่ bind แล้ว แทนการยอมรับการข้ามหลัง bind แบบทั่วไป
- การเรียก CLI `acpx` โดยตรงเป็นเพียงเส้นทางแบบแมนนวล/ทางแก้ชั่วคราวสำหรับเปรียบเทียบพฤติกรรมนอก Gateway เท่านั้น ส่วน Docker ACP bind smoke จะทดสอบแบ็กเอนด์รันไทม์ `acpx` แบบ embedded ของ OpenClaw

## Live: Codex app-server harness smoke

- เป้าหมาย: ตรวจสอบ Codex harness ที่ Plugin เป็นเจ้าของผ่านเมธอด `agent` ของ gateway
  ตามปกติ:
  - โหลด Plugin `codex` ที่มาพร้อมกัน
  - เลือก `OPENCLAW_AGENT_RUNTIME=codex`
  - ส่ง gateway agent turn แรกไปยัง `openai/gpt-5.2` โดยบังคับใช้ Codex harness
  - ส่ง turn ที่สองไปยังเซสชัน OpenClaw เดียวกัน และตรวจสอบว่า app-server
    thread สามารถ resume ได้
  - รัน `/codex status` และ `/codex models` ผ่านเส้นทางคำสั่ง gateway เดียวกัน
  - เลือกได้ว่าจะรัน shell probe แบบ escalated ที่ผ่านการตรวจทานโดย Guardian สองรายการ: คำสั่ง benign
    หนึ่งรายการที่ควรได้รับการอนุมัติ และการอัปโหลด secret ปลอมหนึ่งรายการที่ควรถูกปฏิเสธ
    เพื่อให้เอเจนต์ถามกลับ
- ทดสอบ: `src/gateway/gateway-codex-harness.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- โมเดลเริ่มต้น: `openai/gpt-5.2`
- image probe แบบทางเลือก: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- MCP/tool probe แบบทางเลือก: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Guardian probe แบบทางเลือก: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke นี้ตั้ง `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ดังนั้น Codex
  harness ที่เสียจะไม่สามารถผ่านด้วยการ fallback ไป PI แบบเงียบ ๆ ได้
- Auth: auth ของ Codex app-server จากการล็อกอิน subscription ของ Codex ในเครื่อง Docker
  smokes ยังสามารถให้ `OPENAI_API_KEY` สำหรับ probe ที่ไม่ใช่ Codex เมื่อเกี่ยวข้องได้
  รวมถึงอาจคัดลอก `~/.codex/auth.json` และ `~/.codex/config.toml` ได้ด้วย

สูตรในเครื่อง:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

สูตร Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

หมายเหตุสำหรับ Docker:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-codex-harness-docker.sh`
- มันจะ source `~/.profile` ที่เมานต์ไว้, ส่งผ่าน `OPENAI_API_KEY`, คัดลอกไฟล์
  auth ของ Codex CLI เมื่อมี, ติดตั้ง `@openai/codex` ลงใน prefix npm ที่เมานต์และเขียนได้,
  จัดเตรียม source tree จากนั้นรันเฉพาะการทดสอบ live ของ Codex-harness
- Docker เปิด image, MCP/tool และ Guardian probe โดยค่าเริ่มต้น ให้ตั้ง
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` เมื่อคุณต้องการการรันดีบักที่แคบลง
- Docker ยัง export `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ให้ตรงกับคอนฟิกของการทดสอบ live
  ดังนั้น alias แบบเดิมหรือ PI fallback จะไม่สามารถซ่อน regression ของ Codex harness
  ได้

### สูตร live ที่แนะนำ

allowlist ที่แคบและชัดเจนจะเร็วที่สุดและมีโอกาสล้มเหลวน้อยที่สุด:

- โมเดลเดี่ยว, direct (ไม่มี gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- โมเดลเดี่ยว, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การเรียกใช้เครื่องมือข้ามหลาย provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- เน้น Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke:
  - หากคีย์ในเครื่องอยู่ใน shell profile: `source ~/.profile`
  - Gemini 3 dynamic default: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamic budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

หมายเหตุ:

- `google/...` ใช้ Gemini API (API key)
- `google-antigravity/...` ใช้ Antigravity OAuth bridge (ปลายทาง agent แบบ Cloud Code Assist)
- `google-gemini-cli/...` ใช้ Gemini CLI ในเครื่องของคุณ (auth แยกต่างหาก + พฤติกรรมของ tooling ที่ต่างออกไป)
- Gemini API เทียบกับ Gemini CLI:
  - API: OpenClaw เรียก Gemini API ที่โฮสต์โดย Google ผ่าน HTTP (auth แบบ API key / profile); นี่คือสิ่งที่ผู้ใช้ส่วนใหญ่หมายถึงเมื่อพูดว่า “Gemini”
  - CLI: OpenClaw shell ออกไปยังไบนารี `gemini` ในเครื่อง; มันมี auth ของตัวเองและอาจมีพฤติกรรมต่างกัน (streaming/tool support/version skew)

## Live: model matrix (สิ่งที่เราครอบคลุม)

ไม่มี “รายการโมเดลของ CI” แบบตายตัว (live เป็นแบบเลือกใช้) แต่นี่คือโมเดลที่**แนะนำ**ให้ครอบคลุมเป็นประจำบนเครื่องนักพัฒนาที่มีคีย์

### ชุด smoke สมัยใหม่ (tool calling + image)

นี่คือการรัน “โมเดลทั่วไป” ที่เราคาดว่าจะต้องใช้งานได้ต่อเนื่อง:

- OpenAI (ที่ไม่ใช่ Codex): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` และ `google/gemini-3-flash-preview` (หลีกเลี่ยง Gemini 2.x รุ่นเก่า)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` และ `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` และ `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

รัน gateway smoke พร้อม tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### พื้นฐาน: tool calling (Read + Exec แบบทางเลือก)

เลือกอย่างน้อยหนึ่งโมเดลต่อหนึ่งตระกูล provider:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (หรือ `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

ความครอบคลุมเพิ่มเติมแบบทางเลือก (มีไว้ก็ดี):

- xAI: `xai/grok-4` (หรือรุ่นล่าสุดที่มี)
- Mistral: `mistral/`… (เลือกโมเดลที่รองรับ “tools” สักหนึ่งรุ่นที่คุณเปิดใช้ไว้)
- Cerebras: `cerebras/`… (หากคุณมีสิทธิ์เข้าถึง)
- LM Studio: `lmstudio/`… (local; การเรียกใช้เครื่องมือขึ้นอยู่กับโหมด API)

### Vision: การส่งภาพ (ไฟล์แนบ → ข้อความมัลติโหมด)

ใส่อย่างน้อยหนึ่งโมเดลที่รองรับภาพไว้ใน `OPENCLAW_LIVE_GATEWAY_MODELS` (เช่น Claude/Gemini/OpenAI รุ่นที่รองรับ vision เป็นต้น) เพื่อทดสอบ image probe

### Aggregators / alternate gateways

หากคุณเปิดใช้คีย์ไว้ เรายังรองรับการทดสอบผ่าน:

- OpenRouter: `openrouter/...` (หลายร้อยโมเดล; ใช้ `openclaw models scan` เพื่อหา candidate ที่รองรับ tool+image)
- OpenCode: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go (auth ผ่าน `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

provider เพิ่มเติมที่คุณสามารถรวมไว้ใน live matrix ได้ (หากคุณมี creds/config):

- ในตัว: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- ผ่าน `models.providers` (ปลายทางแบบกำหนดเอง): `minimax` (cloud/API) รวมถึง proxy ที่เข้ากันได้กับ OpenAI/Anthropic ใด ๆ (LM Studio, vLLM, LiteLLM เป็นต้น)

เคล็ดลับ: อย่าพยายาม hardcode “ทุกโมเดล” ลงในเอกสาร รายการที่เชื่อถือได้จริงคือสิ่งที่ `discoverModels(...)` ส่งคืนบนเครื่องของคุณ + คีย์ที่มีอยู่

## ข้อมูลรับรอง (ห้าม commit)

การทดสอบแบบ live จะค้นหาข้อมูลรับรองแบบเดียวกับที่ CLI ใช้ ผลกระทบในทางปฏิบัติคือ:

- หาก CLI ทำงานได้ การทดสอบ live ก็ควรพบคีย์เดียวกัน
- หากการทดสอบ live บอกว่า “ไม่มีข้อมูลรับรอง” ให้ดีบักแบบเดียวกับที่คุณดีบัก `openclaw models list` / การเลือกโมเดล

- โปรไฟล์ auth ราย agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (นี่คือความหมายของ “profile keys” ในการทดสอบแบบ live)
- คอนฟิก: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- state dir แบบเดิม: `~/.openclaw/credentials/` (จะถูกคัดลอกเข้า staged live home เมื่อมีอยู่ แต่ไม่ใช่ที่เก็บ profile-key หลัก)
- การรัน live ในเครื่องจะคัดลอกคอนฟิกที่ใช้งานอยู่, ไฟล์ `auth-profiles.json` ราย agent, `credentials/` แบบเดิม และไดเรกทอรี auth ของ CLI ภายนอกที่รองรับ ไปยัง test home ชั่วคราวโดยค่าเริ่มต้น; staged live home จะข้าม `workspace/` และ `sandboxes/` และจะตัดการ override พาธ `agents.*.workspace` / `agentDir` ออก เพื่อให้ probe ไม่แตะ workspace จริงบนโฮสต์ของคุณ

หากคุณต้องการพึ่งพาคีย์จาก env (เช่น export ไว้ใน `~/.profile`) ให้รันการทดสอบในเครื่องหลัง `source ~/.profile` หรือใช้ Docker runners ด้านล่าง (สามารถเมานต์ `~/.profile` เข้าไปในคอนเทนเนอร์ได้)

## Deepgram live (การถอดเสียง)

- ทดสอบ: `extensions/deepgram/audio.live.test.ts`
- เปิดใช้: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- ทดสอบ: `extensions/byteplus/live.test.ts`
- เปิดใช้: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- การ override โมเดลแบบทางเลือก: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- ทดสอบ: `extensions/comfy/comfy.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- ขอบเขต:
  - ทดสอบเส้นทางภาพ วิดีโอ และ `music_generate` ของ comfy ที่มาพร้อมกัน
  - ข้ามความสามารถแต่ละอย่าง เว้นแต่จะกำหนดค่า `plugins.entries.comfy.config.<capability>`
  - มีประโยชน์หลังจากเปลี่ยน workflow submission, polling, downloads หรือการลงทะเบียน Plugin ของ comfy

## Image generation live

- ทดสอบ: `test/image-generation.runtime.live.test.ts`
- คำสั่ง: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ฮาร์เนส: `pnpm test:live:media image`
- ขอบเขต:
  - ไล่ดู Plugin ผู้ให้บริการ image-generation ที่ลงทะเบียนไว้ทุกตัว
  - โหลด env vars ของ provider ที่ขาดหายจาก login shell (`~/.profile`) ก่อน probe
  - ใช้ API key จาก live/env ก่อน auth profile ที่เก็บไว้โดยค่าเริ่มต้น เพื่อไม่ให้ test key เก่าที่ค้างใน `auth-profiles.json` มาบดบังข้อมูลรับรองจริงจาก shell
  - ข้าม provider ที่ไม่มี auth/profile/model ที่ใช้ได้
  - รันแต่ละ provider ที่กำหนดค่าไว้ผ่านรันไทม์ image-generation แบบใช้ร่วมกัน:
    - `<provider>:generate`
    - `<provider>:edit` เมื่อ provider ประกาศว่ารองรับ edit
- ผู้ให้บริการแบบ bundled ที่ครอบคลุมในปัจจุบัน:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- การจำกัดขอบเขตแบบทางเลือก:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- พฤติกรรมด้าน auth แบบทางเลือก:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile-store และไม่สนใจ override ที่มาจาก env อย่างเดียว

สำหรับเส้นทาง CLI ที่จัดส่งจริง ให้เพิ่ม `infer` smoke หลังจากการทดสอบ live ของ provider/runtime ผ่านแล้ว:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

สิ่งนี้ครอบคลุมการแยกวิเคราะห์อาร์กิวเมนต์ของ CLI, การ resolve คอนฟิก/agent เริ่มต้น, การเปิดใช้งาน
bundled Plugin, การซ่อมแซม dependency รันไทม์ของ bundled แบบตามต้องการ, รันไทม์
image-generation แบบใช้ร่วมกัน และคำขอแบบ live ไปยัง provider

## Music generation live

- ทดสอบ: `extensions/music-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ฮาร์เนส: `pnpm test:live:media music`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการ music-generation แบบ bundled ที่ใช้ร่วมกัน
  - ปัจจุบันครอบคลุม Google และ MiniMax
  - โหลด env vars ของ provider จาก login shell (`~/.profile`) ก่อน probe
  - ใช้ API key จาก live/env ก่อน auth profile ที่เก็บไว้โดยค่าเริ่มต้น เพื่อไม่ให้ test key เก่าที่ค้างใน `auth-profiles.json` มาบดบังข้อมูลรับรองจริงจาก shell
  - ข้าม provider ที่ไม่มี auth/profile/model ที่ใช้ได้
  - รันทั้งสองโหมดรันไทม์ที่ประกาศไว้เมื่อมี:
    - `generate` ด้วยอินพุตแบบ prompt-only
    - `edit` เมื่อ provider ประกาศ `capabilities.edit.enabled`
  - ความครอบคลุมของ shared-lane ในปัจจุบัน:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ใช้ไฟล์ live ของ Comfy แยกต่างหาก ไม่ใช่ shared sweep นี้
- การจำกัดขอบเขตแบบทางเลือก:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- พฤติกรรมด้าน auth แบบทางเลือก:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile-store และไม่สนใจ override ที่มาจาก env อย่างเดียว

## Video generation live

- ทดสอบ: `extensions/video-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ฮาร์เนส: `pnpm test:live:media video`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการ video-generation แบบ bundled ที่ใช้ร่วมกัน
  - ใช้เส้นทาง smoke ที่ปลอดภัยต่อรีลีสโดยค่าเริ่มต้น: ผู้ให้บริการที่ไม่ใช่ FAL, คำขอ text-to-video หนึ่งครั้งต่อ provider, prompt กุ้งล็อบสเตอร์หนึ่งวินาที และเพดานเวลาการทำงานต่อ provider จาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` โดยค่าเริ่มต้น)
  - ข้าม FAL โดยค่าเริ่มต้น เพราะความหน่วงคิวฝั่ง provider อาจกินเวลาของรีลีสได้มาก; ส่ง `--video-providers fal` หรือ `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` เพื่อรันมันโดยชัดเจน
  - โหลด env vars ของ provider จาก login shell (`~/.profile`) ก่อน probe
  - ใช้ API key จาก live/env ก่อน auth profile ที่เก็บไว้โดยค่าเริ่มต้น เพื่อไม่ให้ test key เก่าที่ค้างใน `auth-profiles.json` มาบดบังข้อมูลรับรองจริงจาก shell
  - ข้าม provider ที่ไม่มี auth/profile/model ที่ใช้ได้
  - รันเฉพาะ `generate` โดยค่าเริ่มต้น
  - ตั้ง `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรัน transform mode ที่ประกาศไว้ด้วยเมื่อมี:
    - `imageToVideo` เมื่อ provider ประกาศ `capabilities.imageToVideo.enabled` และ provider/model ที่เลือกยอมรับอินพุตภาพในเครื่องแบบ buffer-backed ใน shared sweep
    - `videoToVideo` เมื่อ provider ประกาศ `capabilities.videoToVideo.enabled` และ provider/model ที่เลือกยอมรับอินพุตวิดีโอในเครื่องแบบ buffer-backed ใน shared sweep
  - ผู้ให้บริการ `imageToVideo` ที่ประกาศไว้แต่ถูกข้ามใน shared sweep ปัจจุบัน:
    - `vydra` เพราะ `veo3` ที่มาพร้อมกันรองรับเฉพาะ text และ `kling` ที่มาพร้อมกันต้องใช้ URL ภาพระยะไกล
  - ความครอบคลุมเฉพาะ provider ของ Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ไฟล์นั้นจะรัน `veo3` แบบ text-to-video พร้อม lane `kling` ที่ใช้ fixture URL ภาพระยะไกลโดยค่าเริ่มต้น
  - ความครอบคลุม `videoToVideo` แบบ live ปัจจุบัน:
    - `runway` เท่านั้น เมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`
  - ผู้ให้บริการ `videoToVideo` ที่ประกาศไว้แต่ถูกข้ามใน shared sweep ปัจจุบัน:
    - `alibaba`, `qwen`, `xai` เพราะเส้นทางเหล่านั้นปัจจุบันต้องใช้ URL อ้างอิงระยะไกลแบบ `http(s)` / MP4
    - `google` เพราะ lane Gemini/Veo แบบใช้ร่วมกันปัจจุบันใช้อินพุตในเครื่องแบบ buffer-backed และเส้นทางนั้นไม่ถูกรับใน shared sweep
    - `openai` เพราะ shared lane ปัจจุบันไม่มีการรับประกันการเข้าถึง video inpaint/remix เฉพาะองค์กร
- การจำกัดขอบเขตแบบทางเลือก:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` เพื่อรวมทุก provider ใน default sweep รวมถึง FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` เพื่อลดเพดานเวลาต่อการทำงานของแต่ละ provider สำหรับ smoke run แบบเข้มข้น
- พฤติกรรมด้าน auth แบบทางเลือก:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile-store และไม่สนใจ override ที่มาจาก env อย่างเดียว

## Media live harness

- คำสั่ง: `pnpm test:live:media`
- วัตถุประสงค์:
  - รันชุดทดสอบ image, music และ video แบบ live ที่ใช้ร่วมกันผ่าน entrypoint แบบ native ของ repo เพียงจุดเดียว
  - โหลด env vars ของ provider ที่ขาดหายจาก `~/.profile` อัตโนมัติ
  - จำกัดแต่ละชุดทดสอบอัตโนมัติไปยัง provider ที่มี auth ใช้งานได้ในปัจจุบันโดยค่าเริ่มต้น
  - ใช้ `scripts/test-live.mjs` ซ้ำ ดังนั้นพฤติกรรมของ heartbeat และ quiet-mode จึงสอดคล้องกัน
- ตัวอย่าง:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ที่เกี่ยวข้อง

- [Testing](/th/help/testing) — ชุดทดสอบ unit, integration, QA และ Docker
