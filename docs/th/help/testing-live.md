---
read_when:
    - การรันการทดสอบแบบ smoke สำหรับเมทริกซ์โมเดล / แบ็กเอนด์ CLI / ACP / ผู้ให้บริการสื่อ แบบ Live
    - การดีบักการ resolve ข้อมูลรับรองของการทดสอบแบบ Live
    - การเพิ่มการทดสอบแบบ Live เฉพาะผู้ให้บริการใหม่
sidebarTitle: Live tests
summary: 'การทดสอบแบบ Live (แตะเครือข่าย): เมทริกซ์ของโมเดล, แบ็กเอนด์ CLI, ACP, ผู้ให้บริการสื่อ, ข้อมูลรับรอง'
title: 'การทดสอบ: ชุดทดสอบแบบ Live'
x-i18n:
    generated_at: "2026-04-25T13:50:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9b2c2954eddd1b911dde5bb3a834a6f9429c91429f3fb07a509eec80183cc52
    source_path: help/testing-live.md
    workflow: 15
---

สำหรับการเริ่มต้นอย่างรวดเร็ว ตัวรัน QA ชุดทดสอบ unit/integration และ flow ของ Docker โปรดดู
[Testing](/th/help/testing) หน้านี้ครอบคลุมชุดทดสอบแบบ **Live** (แตะเครือข่าย):
เมทริกซ์ของโมเดล, แบ็กเอนด์ CLI, ACP และการทดสอบแบบ Live ของผู้ให้บริการสื่อ รวมถึง
การจัดการข้อมูลรับรอง

## Live: คำสั่ง smoke ของโปรไฟล์ในเครื่อง

ให้ source `~/.profile` ก่อนการตรวจสอบแบบ Live เฉพาะกิจ เพื่อให้คีย์ของผู้ให้บริการและพาธเครื่องมือในเครื่อง
ตรงกับ shell ของคุณ:

```bash
source ~/.profile
```

การทดสอบสื่อแบบ smoke ที่ปลอดภัย:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

การทดสอบความพร้อมสำหรับ voice-call แบบ smoke ที่ปลอดภัย:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` เป็น dry run เว้นแต่จะมี `--yes` ด้วย ใช้ `--yes` เฉพาะ
เมื่อคุณตั้งใจจะโทรแจ้งเตือนจริงเท่านั้น สำหรับ Twilio, Telnyx และ
Plivo การตรวจสอบความพร้อมที่สำเร็จต้องมี URL ของ Webhook แบบสาธารณะ; fallback แบบ local-only
หรือ private loopback จะถูกปฏิเสธโดยการออกแบบ

## Live: การกวาดความสามารถของ Android node

- การทดสอบ: `src/gateway/android-node.capabilities.live.test.ts`
- สคริปต์: `pnpm android:test:integration`
- เป้าหมาย: เรียก **ทุกคำสั่งที่ Android node ที่เชื่อมต่อประกาศอยู่ในปัจจุบัน** และยืนยันพฤติกรรมตามสัญญาของคำสั่ง
- ขอบเขต:
  - การตั้งค่าแบบเตรียมเงื่อนไข/ด้วยตนเองล่วงหน้า (ชุดทดสอบจะไม่ติดตั้ง/รัน/จับคู่แอป)
  - การตรวจสอบ `node.invoke` ของ gateway ทีละคำสั่งสำหรับ Android node ที่เลือก
- การตั้งค่าล่วงหน้าที่จำเป็น:
  - แอป Android เชื่อมต่อและจับคู่กับ gateway แล้ว
  - ให้แอปอยู่ใน foreground
  - อนุญาต permissions/consent สำหรับการ capture ตามความสามารถที่คุณคาดว่าจะผ่าน
- ตัวเลือกการเขียนทับเป้าหมาย:
  - `OPENCLAW_ANDROID_NODE_ID` หรือ `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- รายละเอียดการตั้งค่า Android แบบเต็ม: [Android App](/th/platforms/android)

## Live: การทดสอบโมเดลแบบ smoke (คีย์จากโปรไฟล์)

การทดสอบแบบ Live ถูกแยกเป็นสองชั้นเพื่อให้เราแยกความล้มเหลวได้:

- “Direct model” บอกเราว่าผู้ให้บริการ/โมเดลสามารถตอบได้เลยหรือไม่ด้วยคีย์ที่กำหนด
- “Gateway smoke” บอกเราว่า pipeline แบบเต็มของ gateway+agent ใช้งานได้กับโมเดลนั้นหรือไม่ (sessions, history, tools, sandbox policy เป็นต้น)

### ชั้นที่ 1: การทำ completion กับโมเดลโดยตรง (ไม่มี gateway)

- การทดสอบ: `src/agents/models.profiles.live.test.ts`
- เป้าหมาย:
  - ไล่ดูโมเดลที่ตรวจพบ
  - ใช้ `getApiKeyForModel` เพื่อเลือกโมเดลที่คุณมีข้อมูลรับรอง
  - รัน completion ขนาดเล็กต่อโมเดลหนึ่งตัว (และ regression แบบเจาะจงเมื่อจำเป็น)
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- ตั้งค่า `OPENCLAW_LIVE_MODELS=modern` (หรือ `all` ซึ่งเป็น alias ของ modern) เพื่อให้รัน suite นี้จริง; มิฉะนั้นจะถูกข้ามเพื่อให้ `pnpm test:live` โฟกัสที่ gateway smoke
- วิธีเลือกโมเดล:
  - `OPENCLAW_LIVE_MODELS=modern` เพื่อรัน allowlist แบบ modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` เป็น alias ของ allowlist แบบ modern
  - หรือ `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist แบบคอมมา)
  - การกวาดแบบ modern/all จะตั้งค่าเริ่มต้นเป็น cap แบบ curated ที่ให้สัญญาณสูง; ตั้ง `OPENCLAW_LIVE_MAX_MODELS=0` สำหรับการกวาด modern แบบครบถ้วน หรือเป็นจำนวนบวกสำหรับ cap ที่เล็กลง
  - การกวาดแบบครบถ้วนใช้ `OPENCLAW_LIVE_TEST_TIMEOUT_MS` เป็น timeout ของการทดสอบ direct-model ทั้งหมด ค่าเริ่มต้น: 60 นาที
  - การ probe แบบ direct-model รันด้วย parallelism 20 ทางเป็นค่าเริ่มต้น; ตั้ง `OPENCLAW_LIVE_MODEL_CONCURRENCY` เพื่อเขียนทับ
- วิธีเลือกผู้ให้บริการ:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist แบบคอมมา)
- แหล่งที่มาของคีย์:
  - ค่าเริ่มต้น: profile store และ env fallback
  - ตั้ง `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ **profile store** เท่านั้น
- เหตุผลที่มีชุดนี้:
  - แยกระหว่าง “API ของผู้ให้บริการเสีย / คีย์ไม่ถูกต้อง” กับ “pipeline ของ gateway agent เสีย”
  - ใช้เก็บ regression ขนาดเล็กที่แยกจากกัน (ตัวอย่าง: OpenAI Responses/Codex Responses reasoning replay + flow ของการเรียก tool)

### ชั้นที่ 2: Gateway + dev agent smoke (สิ่งที่ "@openclaw" ทำจริง)

- การทดสอบ: `src/gateway/gateway-models.profiles.live.test.ts`
- เป้าหมาย:
  - สปินอัป gateway ภายในโปรเซส
  - สร้าง/แพตช์เซสชัน `agent:dev:*` (เขียนทับโมเดลต่อการรัน)
  - ไล่ผ่านโมเดลที่มีคีย์และยืนยันว่า:
    - มีการตอบกลับที่ “มีความหมาย” (ไม่มี tools)
    - การเรียก tool จริงใช้งานได้ (read probe)
    - มี probe ของ tool เพิ่มเติมแบบไม่บังคับ (exec+read probe)
    - เส้นทาง regression ของ OpenAI (tool-call-only → follow-up) ยังคงทำงาน
- รายละเอียด probe (เพื่อให้คุณอธิบายความล้มเหลวได้อย่างรวดเร็ว):
  - `read` probe: การทดสอบจะเขียนไฟล์ nonce ลงใน workspace และขอให้ agent `read` มันแล้ว echo nonce กลับมา
  - `exec+read` probe: การทดสอบจะขอให้ agent ใช้ `exec` เขียน nonce ลงในไฟล์ temp แล้ว `read` กลับมา
  - image probe: การทดสอบแนบ PNG ที่สร้างขึ้น (cat + โค้ดสุ่ม) และคาดหวังว่าโมเดลจะส่งกลับ `cat <CODE>`
  - อ้างอิง implementation: `src/gateway/gateway-models.profiles.live.test.ts` และ `src/gateway/live-image-probe.ts`
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- วิธีเลือกโมเดล:
  - ค่าเริ่มต้น: allowlist แบบ modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` เป็น alias ของ allowlist แบบ modern
  - หรือกำหนด `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (หรือรายการแบบคอมมา) เพื่อจำกัดขอบเขต
  - การกวาด gateway แบบ modern/all จะตั้งค่าเริ่มต้นเป็น cap แบบ curated ที่ให้สัญญาณสูง; ตั้ง `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` สำหรับการกวาด modern แบบครบถ้วน หรือเป็นจำนวนบวกสำหรับ cap ที่เล็กลง
- วิธีเลือกผู้ให้บริการ (หลีกเลี่ยง “OpenRouter ทุกอย่าง”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist แบบคอมมา)
- probe ของ tool + image เปิดอยู่เสมอในการทดสอบแบบ Live นี้:
  - `read` probe + `exec+read` probe (stress ของ tool)
  - image probe จะรันเมื่อโมเดลประกาศว่ารองรับ image input
  - flow (ระดับสูง):
    - การทดสอบสร้าง PNG ขนาดเล็กที่มี “CAT” + โค้ดสุ่ม (`src/gateway/live-image-probe.ts`)
    - ส่งผ่าน `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parse attachments เป็น `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - embedded agent ส่งต่อข้อความผู้ใช้แบบหลายสื่อไปยังโมเดล
    - การยืนยัน: คำตอบมี `cat` + โค้ดนั้น (ยอมให้ OCR ผิดเล็กน้อยได้)

เคล็ดลับ: หากต้องการดูว่าคุณสามารถทดสอบอะไรได้บนเครื่องของคุณ (และ `provider/model` id ที่ตรงเป๊ะ) ให้รัน:

```bash
openclaw models list
openclaw models list --json
```

## Live: การทดสอบแบ็กเอนด์ CLI แบบ smoke (Claude, Codex, Gemini หรือ CLI ในเครื่องอื่น ๆ)

- การทดสอบ: `src/gateway/gateway-cli-backend.live.test.ts`
- เป้าหมาย: ตรวจสอบ pipeline ของ Gateway + agent โดยใช้แบ็กเอนด์ CLI ในเครื่อง โดยไม่แตะการกำหนดค่าเริ่มต้นของคุณ
- ค่าเริ่มต้นของ smoke ที่เฉพาะกับแบ็กเอนด์อยู่ในนิยาม `cli-backend.ts` ของ extension เจ้าของ
- เปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- ค่าเริ่มต้น:
  - ผู้ให้บริการ/โมเดลเริ่มต้น: `claude-cli/claude-sonnet-4-6`
  - พฤติกรรมของ command/args/image มาจาก metadata ของ plugin เจ้าของแบ็กเอนด์ CLI
- การเขียนทับ (ไม่บังคับ):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` เพื่อส่ง image attachment จริง (พาธจะถูก inject เข้าไปใน prompt) สูตร Docker จะปิดค่าเริ่มต้นนี้ เว้นแต่ร้องขออย่างชัดเจน
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` เพื่อส่งพาธไฟล์ภาพเป็น CLI args แทนการ inject ใน prompt
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (หรือ `"list"`) เพื่อควบคุมวิธีส่ง image args เมื่อมีการตั้ง `IMAGE_ARG`
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` เพื่อส่งเทิร์นที่สองและตรวจสอบ flow ของ resume
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` เพื่อเลือกใช้ probe ความต่อเนื่องของเซสชันเดียวกันจาก Claude Sonnet -> Opus เมื่อโมเดลที่เลือกมีเป้าหมายสำหรับการสลับ สูตร Docker จะปิดค่าเริ่มต้นนี้เพื่อความเสถียรรวม
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` เพื่อเลือกใช้ MCP/tool loopback probe สูตร Docker จะปิดค่าเริ่มต้นนี้ เว้นแต่ร้องขออย่างชัดเจน

ตัวอย่าง:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

สูตร Docker:

```bash
pnpm test:docker:live-cli-backend
```

สูตร Docker แบบผู้ให้บริการเดียว:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

หมายเหตุ:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-cli-backend-docker.sh`
- มันจะรัน smoke ของแบ็กเอนด์ CLI แบบ Live ภายในอิมเมจ Docker ของ repo ในฐานะผู้ใช้ `node` ที่ไม่ใช่ root
- มัน resolve metadata ของ CLI smoke จาก extension เจ้าของ จากนั้นติดตั้งแพ็กเกจ Linux CLI ที่ตรงกัน (`@anthropic-ai/claude-code`, `@openai/codex` หรือ `@google/gemini-cli`) ลงใน prefix ที่เขียนได้และมีแคชที่ `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`)
- `pnpm test:docker:live-cli-backend:claude-subscription` ต้องใช้ portable Claude Code subscription OAuth ผ่าน `~/.claude/.credentials.json` ที่มี `claudeAiOauth.subscriptionType` หรือ `CLAUDE_CODE_OAUTH_TOKEN` จาก `claude setup-token` มันจะพิสูจน์ `claude -p` โดยตรงใน Docker ก่อน จากนั้นรันสองเทิร์นของ Gateway CLI-backend โดยไม่คง Anthropic API-key env vars ชุด subscription นี้จะปิด Claude MCP/tool และ image probes โดยค่าเริ่มต้น เพราะตอนนี้ Claude route การใช้งานแอปของบุคคลที่สามผ่านการเรียกเก็บเงิน extra-usage แทนขีดจำกัดแผน subscription ปกติ
- ตอนนี้ smoke ของ CLI-backend แบบ Live ใช้ flow แบบ end-to-end เดียวกันสำหรับ Claude, Codex และ Gemini: เทิร์นข้อความ, เทิร์นจำแนกรูปภาพ จากนั้นยืนยันการเรียกใช้ MCP `cron` tool ผ่าน gateway CLI
- smoke เริ่มต้นของ Claude จะยังแพตช์เซสชันจาก Sonnet ไปเป็น Opus และยืนยันว่าเซสชันที่ resume แล้วยังคงจำโน้ตก่อนหน้าได้

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- การทดสอบ: `src/gateway/gateway-acp-bind.live.test.ts`
- เป้าหมาย: ตรวจสอบ flow การผูกบทสนทนา ACP จริงกับ ACP agent แบบ Live:
  - ส่ง `/acp spawn <agent> --bind here`
  - ผูกบทสนทนา synthetic message-channel เข้าที่เดิม
  - ส่ง follow-up ปกติในบทสนทนาเดียวกันนั้น
  - ยืนยันว่า follow-up ไปถึง transcript ของเซสชัน ACP ที่ถูกผูกไว้
- เปิดใช้:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- ค่าเริ่มต้น:
  - ACP agents ใน Docker: `claude,codex,gemini`
  - ACP agent สำหรับ `pnpm test:live ...` โดยตรง: `claude`
  - ช่องทางสังเคราะห์: บริบทบทสนทนาแบบ Slack DM
  - แบ็กเอนด์ ACP: `acpx`
- การเขียนทับ:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- หมายเหตุ:
  - lane นี้ใช้พื้นผิว `chat.send` ของ gateway พร้อม originating-route fields แบบ admin-only เพื่อให้การทดสอบแนบบริบทของ message-channel ได้โดยไม่แสร้งทำว่าเป็นการส่งออกจริง
  - เมื่อไม่ได้ตั้ง `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` การทดสอบจะใช้ registry ของ agent ในตัวจาก plugin `acpx` แบบ embedded สำหรับ ACP harness agent ที่เลือก

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
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

หมายเหตุเกี่ยวกับ Docker:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-acp-bind-docker.sh`
- โดยค่าเริ่มต้น มันจะรัน ACP bind smoke กับ live CLI agents แบบรวมตามลำดับ: `claude`, `codex` แล้ว `gemini`
- ใช้ `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` หรือ `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` เพื่อจำกัดเมทริกซ์
- มันจะ source `~/.profile`, จัดเตรียม auth material ของ CLI ที่ตรงกันเข้าไปใน container จากนั้นติดตั้ง live CLI ที่ร้องขอ (`@anthropic-ai/claude-code`, `@openai/codex`, `@google/gemini-cli` หรือ `opencode-ai`) หากยังไม่มี ส่วนแบ็กเอนด์ ACP เองคือแพ็กเกจ `acpx/runtime` แบบ embedded ที่มาพร้อมระบบจาก plugin `acpx`
- ตัวแปร Docker ของ OpenCode เป็น lane สำหรับ regression แบบ single-agent ที่เข้มงวด มันจะเขียน default model ชั่วคราวลงใน `OPENCODE_CONFIG_CONTENT` จาก `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (ค่าเริ่มต้น `opencode/kimi-k2.6`) หลังจาก source `~/.profile` แล้ว และ `pnpm test:docker:live-acp-bind:opencode` ต้องการ transcript ของ assistant ที่ถูก bind แล้ว แทนที่จะยอมรับการข้ามหลัง bind แบบทั่วไป
- การเรียก `acpx` CLI โดยตรงเป็นเพียงเส้นทางแบบ manual/workaround สำหรับเปรียบเทียบพฤติกรรมนอก Gateway เท่านั้น Docker ACP bind smoke จะทดสอบแบ็กเอนด์ runtime `acpx` แบบ embedded ของ OpenClaw

## Live: Codex app-server harness smoke

- เป้าหมาย: ตรวจสอบ Codex harness ที่เป็นเจ้าของโดย Plugin ผ่านเมธอด `agent`
  ของ gateway ตามปกติ:
  - โหลด plugin `codex` ที่มาพร้อมระบบ
  - เลือก `OPENCLAW_AGENT_RUNTIME=codex`
  - ส่งเทิร์นแรกของ gateway agent ไปยัง `openai/gpt-5.2` โดยบังคับใช้ Codex harness
  - ส่งเทิร์นที่สองไปยังเซสชัน OpenClaw เดียวกัน และยืนยันว่าเธรดของ app-server
    สามารถ resume ได้
  - รัน `/codex status` และ `/codex models` ผ่านเส้นทางคำสั่งของ gateway เดียวกัน
  - เลือกได้ว่าจะรัน shell probe แบบยกระดับสองรายการที่ผ่านการทบทวนโดย Guardian: คำสั่งที่ไม่อันตรายหนึ่งรายการ
    ที่ควรได้รับอนุมัติ และคำสั่งอัปโหลด secret ปลอมหนึ่งรายการที่ควรถูกปฏิเสธ
    เพื่อให้ agent ถามกลับ
- การทดสอบ: `src/gateway/gateway-codex-harness.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- โมเดลเริ่มต้น: `openai/gpt-5.2`
- image probe แบบไม่บังคับ: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- MCP/tool probe แบบไม่บังคับ: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Guardian probe แบบไม่บังคับ: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke จะตั้งค่า `OPENCLAW_AGENT_HARNESS_FALLBACK=none` เพื่อไม่ให้ Codex
  harness ที่เสียสามารถผ่านได้ด้วยการ fallback ไป PI แบบเงียบ ๆ
- Auth: การยืนยันตัวตนของ Codex app-server มาจากการล็อกอิน subscription ของ Codex ในเครื่อง Docker
  smokes ยังสามารถส่ง `OPENAI_API_KEY` สำหรับ probe ที่ไม่ใช่ Codex ได้เมื่อใช้ได้
  รวมถึง `~/.codex/auth.json` และ `~/.codex/config.toml` ที่คัดลอกมาแบบไม่บังคับ

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

หมายเหตุเกี่ยวกับ Docker:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-codex-harness-docker.sh`
- มันจะ source `~/.profile` ที่ถูก mount มา ส่ง `OPENAI_API_KEY`, คัดลอกไฟล์
  auth ของ Codex CLI เมื่อมี ติดตั้ง `@openai/codex` ลงใน npm prefix
  ที่เขียนได้และถูก mount จัดเตรียม source tree แล้วจึงรันเฉพาะการทดสอบ Codex-harness แบบ Live
- Docker จะเปิด image, MCP/tool และ Guardian probes เป็นค่าเริ่มต้น ตั้งค่า
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` เมื่อต้องการรันดีบักที่แคบลง
- Docker ยัง export `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ซึ่งตรงกับ config ของการทดสอบแบบ Live
  เพื่อไม่ให้ alias แบบเดิมหรือการ fallback ไป PI ปิดบัง regression
  ของ Codex harness

### สูตรแบบ Live ที่แนะนำ

allowlist ที่แคบและระบุชัดเจนจะเร็วที่สุดและมีความแกว่งน้อยที่สุด:

- โมเดลเดียว แบบ direct (ไม่มี gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- โมเดลเดียว แบบ gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การเรียก tool ข้ามหลายผู้ให้บริการ:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- โฟกัส Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- smoke สำหรับ adaptive thinking ของ Google:
  - หากคีย์ในเครื่องอยู่ใน shell profile: `source ~/.profile`
  - ค่าเริ่มต้นแบบ dynamic ของ Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - งบประมาณแบบ dynamic ของ Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

หมายเหตุ:

- `google/...` ใช้ Gemini API (API key)
- `google-antigravity/...` ใช้สะพาน OAuth ของ Antigravity (ปลายทาง agent แบบ Cloud Code Assist)
- `google-gemini-cli/...` ใช้ Gemini CLI ในเครื่องของคุณ (มี auth และความแปลกของ tooling แยกต่างหาก)
- Gemini API เทียบกับ Gemini CLI:
  - API: OpenClaw เรียก Gemini API แบบโฮสต์โดย Google ผ่าน HTTP (API key / profile auth); นี่คือสิ่งที่ผู้ใช้ส่วนใหญ่มักหมายถึงเมื่อพูดว่า “Gemini”
  - CLI: OpenClaw shell out ไปยังไบนารี `gemini` ในเครื่อง; มันมี auth ของตัวเองและอาจมีพฤติกรรมต่างกัน (streaming/tool support/version skew)

## Live: เมทริกซ์ของโมเดล (สิ่งที่เราครอบคลุม)

ไม่มี “รายการโมเดลใน CI” ที่ตายตัว (Live เป็นแบบ opt-in) แต่ต่อไปนี้คือโมเดล **ที่แนะนำ** ให้ครอบคลุมเป็นประจำบนเครื่องนักพัฒนาที่มีคีย์

### ชุด smoke แบบ modern (tool calling + image)

นี่คือการรัน “โมเดลทั่วไป” ที่เราคาดหวังว่าจะยังทำงานได้:

- OpenAI (ไม่ใช่ Codex): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` และ `google/gemini-3-flash-preview` (หลีกเลี่ยงโมเดล Gemini 2.x ที่เก่ากว่า)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` และ `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` และ `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

รัน gateway smoke พร้อม tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: การเรียก tool (Read + Exec แบบไม่บังคับ)

เลือกอย่างน้อยหนึ่งตัวต่อหนึ่งตระกูลผู้ให้บริการ:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (หรือ `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

ความครอบคลุมเพิ่มเติมแบบไม่บังคับ (มีไว้ก็ดี):

- xAI: `xai/grok-4` (หรือรุ่นล่าสุดที่มี)
- Mistral: `mistral/`… (เลือกโมเดลที่รองรับ tools ที่คุณเปิดใช้ไว้หนึ่งตัว)
- Cerebras: `cerebras/`… (หากคุณเข้าถึงได้)
- LM Studio: `lmstudio/`… (ในเครื่อง; การเรียก tool ขึ้นกับโหมด API)

### Vision: การส่งภาพ (attachment → ข้อความหลายสื่อ)

ใส่อย่างน้อยหนึ่งโมเดลที่รองรับภาพไว้ใน `OPENCLAW_LIVE_GATEWAY_MODELS` (เช่น รุ่นที่รองรับ vision ของ Claude/Gemini/OpenAI เป็นต้น) เพื่อให้ image probe ได้ทำงาน

### ตัวรวม / Gateway ทางเลือก

หากคุณเปิดใช้คีย์ไว้ เรายังรองรับการทดสอบผ่าน:

- OpenRouter: `openrouter/...` (โมเดลหลายร้อยตัว; ใช้ `openclaw models scan` เพื่อหา candidate ที่รองรับ tool+image)
- OpenCode: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go (auth ผ่าน `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

ผู้ให้บริการเพิ่มเติมที่คุณสามารถรวมในเมทริกซ์แบบ Live ได้ (หากคุณมีข้อมูลรับรอง/การกำหนดค่า):

- ในตัว: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- ผ่าน `models.providers` (ปลายทางแบบกำหนดเอง): `minimax` (cloud/API) รวมถึง proxy ที่เข้ากันได้กับ OpenAI/Anthropic ใด ๆ (LM Studio, vLLM, LiteLLM เป็นต้น)

เคล็ดลับ: อย่าพยายาม hardcode “ทุกโมเดล” ลงในเอกสาร รายการที่เป็นแหล่งอ้างอิงที่ถูกต้องคือสิ่งที่ `discoverModels(...)` ส่งกลับบนเครื่องของคุณ + คีย์ที่มีอยู่จริง

## ข้อมูลรับรอง (ห้าม commit)

การทดสอบแบบ Live จะค้นหาข้อมูลรับรองด้วยวิธีเดียวกับ CLI ผลในทางปฏิบัติคือ:

- หาก CLI ใช้งานได้ การทดสอบแบบ Live ก็ควรหาคีย์เดียวกันเจอ
- หากการทดสอบแบบ Live บอกว่า “ไม่มีข้อมูลรับรอง” ให้ดีบักแบบเดียวกับที่คุณดีบัก `openclaw models list` / การเลือกโมเดล

- auth profile ราย Agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (นี่คือสิ่งที่ “profile keys” หมายถึงในการทดสอบแบบ Live)
- Config: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรีสถานะแบบเดิม: `~/.openclaw/credentials/` (จะถูกคัดลอกเข้า staged live home เมื่อมี แต่ไม่ใช่ที่เก็บ profile-key หลัก)
- การรัน Live ในเครื่องจะคัดลอก config ที่ใช้งานอยู่, ไฟล์ `auth-profiles.json` ราย Agent, `credentials/` แบบเดิม และไดเรกทอรี auth ของ external CLI ที่รองรับ เข้าไปยัง home ชั่วคราวของการทดสอบเป็นค่าเริ่มต้น; staged live homes จะข้าม `workspace/` และ `sandboxes/`, และการเขียนทับพาธ `agents.*.workspace` / `agentDir` จะถูกลบออกเพื่อให้ probe ไม่ไปแตะ workspace จริงบนโฮสต์ของคุณ

หากคุณต้องการพึ่งคีย์จาก env (เช่น export ใน `~/.profile`) ให้รันการทดสอบในเครื่องหลัง `source ~/.profile` หรือใช้ตัวรัน Docker ด้านล่าง (พวกมันสามารถ mount `~/.profile` เข้า container ได้)

## Deepgram แบบ Live (การถอดเสียง)

- การทดสอบ: `extensions/deepgram/audio.live.test.ts`
- เปิดใช้: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan แบบ Live

- การทดสอบ: `extensions/byteplus/live.test.ts`
- เปิดใช้: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- การเขียนทับโมเดลแบบไม่บังคับ: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media แบบ Live

- การทดสอบ: `extensions/comfy/comfy.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- ขอบเขต:
  - ทดสอบเส้นทาง image, video และ `music_generate` ของ comfy ที่มาพร้อมระบบ
  - ข้ามแต่ละความสามารถ เว้นแต่จะมีการกำหนด `plugins.entries.comfy.config.<capability>`
  - มีประโยชน์หลังการเปลี่ยนแปลง workflow submission, polling, downloads หรือการลงทะเบียน plugin ของ comfy

## การสร้างภาพแบบ Live

- การทดสอบ: `test/image-generation.runtime.live.test.ts`
- คำสั่ง: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- ขอบเขต:
  - ไล่ดูทุก Plugin ผู้ให้บริการสร้างภาพที่ลงทะเบียนไว้
  - โหลด env vars ของผู้ให้บริการที่ขาดหายจาก login shell ของคุณ (`~/.profile`) ก่อนทำการ probe
  - ใช้ live/env API keys ก่อน auth profile ที่จัดเก็บไว้เป็นค่าเริ่มต้น เพื่อไม่ให้คีย์ทดสอบเก่าค้างใน `auth-profiles.json` มาบดบังข้อมูลรับรองจริงใน shell
  - ข้ามผู้ให้บริการที่ไม่มี auth/profile/model ที่ใช้งานได้
  - รันผู้ให้บริการที่กำหนดค่าแต่ละรายผ่าน runtime สร้างภาพที่ใช้ร่วมกัน:
    - `<provider>:generate`
    - `<provider>:edit` เมื่อผู้ให้บริการประกาศว่ารองรับการแก้ไข
- ผู้ให้บริการที่มาพร้อมระบบซึ่งครอบคลุมอยู่ในปัจจุบัน:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- พฤติกรรม auth แบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile store และไม่ใช้การเขียนทับจาก env อย่างเดียว

สำหรับเส้นทาง CLI ที่ปล่อยจริง ให้เพิ่ม `infer` smoke หลังจากการทดสอบแบบ Live ของ provider/runtime ผ่านแล้ว:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

สิ่งนี้ครอบคลุมการ parse อาร์กิวเมนต์ของ CLI, การ resolve config/default-agent, การเปิดใช้งาน
Plugin ที่มาพร้อมระบบ, การซ่อมแซม dependency ของ runtime แบบ bundled ตามต้องการ,
runtime สร้างภาพที่ใช้ร่วมกัน และคำขอแบบ Live ไปยังผู้ให้บริการ

## การสร้างเพลงแบบ Live

- การทดสอบ: `extensions/music-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างเพลงแบบ bundled ที่ใช้ร่วมกัน
  - ปัจจุบันครอบคลุม Google และ MiniMax
  - โหลด env vars ของผู้ให้บริการจาก login shell ของคุณ (`~/.profile`) ก่อนทำการ probe
  - ใช้ live/env API keys ก่อน auth profile ที่จัดเก็บไว้เป็นค่าเริ่มต้น เพื่อไม่ให้คีย์ทดสอบเก่าค้างใน `auth-profiles.json` มาบดบังข้อมูลรับรองจริงใน shell
  - ข้ามผู้ให้บริการที่ไม่มี auth/profile/model ที่ใช้งานได้
  - รันทั้งสองโหมด runtime ที่ประกาศไว้เมื่อมี:
    - `generate` ด้วยอินพุตที่มีแต่ prompt
    - `edit` เมื่อผู้ให้บริการประกาศ `capabilities.edit.enabled`
  - ความครอบคลุมปัจจุบันของ lane ที่ใช้ร่วมกัน:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ใช้ไฟล์ Live ของ Comfy แยกต่างหาก ไม่ใช่การกวาดชุดที่ใช้ร่วมกันนี้
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- พฤติกรรม auth แบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile store และไม่ใช้การเขียนทับจาก env อย่างเดียว

## การสร้างวิดีโอแบบ Live

- การทดสอบ: `extensions/video-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างวิดีโอแบบ bundled ที่ใช้ร่วมกัน
  - ค่าเริ่มต้นใช้เส้นทาง smoke ที่ปลอดภัยสำหรับ release: ผู้ให้บริการที่ไม่ใช่ FAL, คำขอ text-to-video หนึ่งครั้งต่อผู้ให้บริการ, prompt lobster ความยาวหนึ่งวินาที และเพดานเวลาต่อการดำเนินการของแต่ละผู้ให้บริการจาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (ค่าเริ่มต้น `180000`)
  - ข้าม FAL เป็นค่าเริ่มต้น เพราะเวลาเข้าคิวฝั่งผู้ให้บริการอาจกินเวลาของ release เป็นหลัก; ส่ง `--video-providers fal` หรือ `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` เพื่อรันอย่างชัดเจน
  - โหลด env vars ของผู้ให้บริการจาก login shell ของคุณ (`~/.profile`) ก่อนทำการ probe
  - ใช้ live/env API keys ก่อน auth profile ที่จัดเก็บไว้เป็นค่าเริ่มต้น เพื่อไม่ให้คีย์ทดสอบเก่าค้างใน `auth-profiles.json` มาบดบังข้อมูลรับรองจริงใน shell
  - ข้ามผู้ให้บริการที่ไม่มี auth/profile/model ที่ใช้งานได้
  - รันเฉพาะ `generate` เป็นค่าเริ่มต้น
  - ตั้ง `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อให้รันโหมด transform ที่ประกาศไว้ด้วยเมื่อมี:
    - `imageToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.imageToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับ local image input แบบ buffer-backed ในการกวาดชุดที่ใช้ร่วมกัน
    - `videoToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.videoToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับ local video input แบบ buffer-backed ในการกวาดชุดที่ใช้ร่วมกัน
  - ผู้ให้บริการ `imageToVideo` ที่ประกาศไว้แต่ถูกข้ามในชุดที่ใช้ร่วมกันปัจจุบัน:
    - `vydra` เพราะ `veo3` ที่มาพร้อมระบบรองรับเฉพาะข้อความ และ `kling` ที่มาพร้อมระบบต้องใช้ remote image URL
  - ความครอบคลุมเฉพาะผู้ให้บริการ Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ไฟล์นั้นจะรัน `veo3` แบบ text-to-video พร้อม lane `kling` ที่ใช้ fixture ของ remote image URL เป็นค่าเริ่มต้น
  - ความครอบคลุม `videoToVideo` แบบ Live ปัจจุบัน:
    - `runway` เท่านั้นเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`
  - ผู้ให้บริการ `videoToVideo` ที่ประกาศไว้แต่ถูกข้ามในชุดที่ใช้ร่วมกันปัจจุบัน:
    - `alibaba`, `qwen`, `xai` เพราะตอนนี้เส้นทางเหล่านั้นต้องใช้ reference URL แบบ `http(s)` / MP4 ระยะไกล
    - `google` เพราะ lane Gemini/Veo ที่ใช้ร่วมกันในปัจจุบันใช้ local input แบบ buffer-backed และเส้นทางนั้นยังไม่ถูกรับในชุดที่ใช้ร่วมกัน
    - `openai` เพราะ lane ที่ใช้ร่วมกันในปัจจุบันยังไม่มีการรับประกันการเข้าถึง video inpaint/remix แบบเฉพาะองค์กร
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` เพื่อรวมทุกผู้ให้บริการในการกวาดค่าเริ่มต้น รวมถึง FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` เพื่อลดเพดานเวลาต่อการดำเนินการของแต่ละผู้ให้บริการสำหรับการรัน smoke แบบเข้ม
- พฤติกรรม auth แบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile store และไม่ใช้การเขียนทับจาก env อย่างเดียว

## Harness สื่อแบบ Live

- คำสั่ง: `pnpm test:live:media`
- วัตถุประสงค์:
  - รันชุดทดสอบ image, music และ video แบบ Live ที่ใช้ร่วมกันผ่าน entrypoint แบบเนทีฟของ repo เพียงจุดเดียว
  - โหลด env vars ของผู้ให้บริการที่ขาดหายจาก `~/.profile` อัตโนมัติ
  - จำกัดแต่ละ suite ให้เหลือเฉพาะผู้ให้บริการที่มี auth ใช้งานได้ในปัจจุบันโดยอัตโนมัติเป็นค่าเริ่มต้น
  - ใช้ `scripts/test-live.mjs` ซ้ำ ดังนั้นพฤติกรรม Heartbeat และ quiet-mode จึงคงที่
- ตัวอย่าง:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ที่เกี่ยวข้อง

- [Testing](/th/help/testing) — ชุดทดสอบ unit, integration, QA และ Docker
