---
read_when:
    - กำลังเรียกใช้การทดสอบ smoke ของเมทริกซ์โมเดลจริง / แบ็กเอนด์ CLI / ACP / media-provider
    - การดีบักการค้นหาข้อมูลรับรองสำหรับการทดสอบจริง
    - การเพิ่มการทดสอบแบบสดเฉพาะผู้ให้บริการใหม่
sidebarTitle: Live tests
summary: 'การทดสอบแบบสด (ที่แตะเครือข่าย): เมทริกซ์โมเดล, แบ็กเอนด์ CLI, ACP, ผู้ให้บริการสื่อ, ข้อมูลรับรอง'
title: 'การทดสอบ: ชุดทดสอบแบบใช้งานจริง'
x-i18n:
    generated_at: "2026-05-03T10:12:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4057d8875fa3404108e89e4381c1dd14e96abbc2af13c4934fc6c0dbf878fc00
    source_path: help/testing-live.md
    workflow: 16
---

สำหรับการเริ่มต้นอย่างรวดเร็ว, QA runner, ชุดทดสอบ unit/integration และ Docker flow โปรดดู
[การทดสอบ](/th/help/testing) หน้านี้ครอบคลุมชุดทดสอบ **live** (ที่แตะเครือข่าย):
เมทริกซ์โมเดล, CLI backend, ACP และการทดสอบ live ของผู้ให้บริการสื่อ รวมถึง
การจัดการข้อมูลประจำตัว

## Live: คำสั่ง smoke ของโปรไฟล์ local

ให้ source `~/.profile` ก่อนตรวจสอบ live แบบเฉพาะกิจ เพื่อให้คีย์ของผู้ให้บริการและ path ของเครื่องมือ local
ตรงกับ shell ของคุณ:

```bash
source ~/.profile
```

media smoke ที่ปลอดภัย:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

smoke ตรวจความพร้อมของ voice-call ที่ปลอดภัย:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` เป็นการ dry run เว้นแต่จะมี `--yes` อยู่ด้วย ใช้ `--yes` เฉพาะเมื่อ
คุณตั้งใจจะโทรแจ้งเตือนจริง สำหรับ Twilio, Telnyx และ
Plivo การตรวจความพร้อมที่สำเร็จต้องมี URL ของ Webhook สาธารณะ fallback แบบ
local loopback/ส่วนตัวเท่านั้นจะถูกปฏิเสธตามการออกแบบ

## Live: การ sweep ความสามารถของ Node Android

- การทดสอบ: `src/gateway/android-node.capabilities.live.test.ts`
- สคริปต์: `pnpm android:test:integration`
- เป้าหมาย: เรียก **ทุกคำสั่งที่ประกาศอยู่ในปัจจุบัน** โดย Node Android ที่เชื่อมต่ออยู่ และยืนยันพฤติกรรมตามสัญญาของคำสั่ง
- ขอบเขต:
  - การตั้งค่าล่วงหน้า/ด้วยตนเอง (ชุดทดสอบนี้ไม่ติดตั้ง/รัน/จับคู่แอป)
  - การตรวจสอบ `node.invoke` ของ Gateway ทีละคำสั่งสำหรับ Node Android ที่เลือก
- การตั้งค่าล่วงหน้าที่จำเป็น:
  - แอป Android เชื่อมต่อและจับคู่กับ Gateway แล้ว
  - คงแอปไว้ใน foreground
  - ให้สิทธิ์/ยินยอมการจับภาพสำหรับความสามารถที่คุณคาดว่าจะผ่านแล้ว
- การ override เป้าหมายแบบไม่บังคับ:
  - `OPENCLAW_ANDROID_NODE_ID` หรือ `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- รายละเอียดการตั้งค่า Android แบบเต็ม: [แอป Android](/th/platforms/android)

## Live: model smoke (คีย์โปรไฟล์)

การทดสอบ live แบ่งเป็นสองชั้นเพื่อให้เราแยกความล้มเหลวได้:

- “โมเดลโดยตรง” บอกเราว่าผู้ให้บริการ/โมเดลสามารถตอบได้จริงด้วยคีย์ที่ให้มา
- “Gateway smoke” บอกเราว่า pipeline gateway+agent แบบเต็มทำงานสำหรับโมเดลนั้น (session, ประวัติ, เครื่องมือ, นโยบาย sandbox ฯลฯ)

### ชั้นที่ 1: การ completion ของโมเดลโดยตรง (ไม่มี gateway)

- การทดสอบ: `src/agents/models.profiles.live.test.ts`
- เป้าหมาย:
  - แจกแจงโมเดลที่ค้นพบ
  - ใช้ `getApiKeyForModel` เพื่อเลือกโมเดลที่คุณมีข้อมูลประจำตัว
  - รัน completion ขนาดเล็กต่อโมเดล (และ regression แบบเจาะจงเมื่อจำเป็น)
- วิธีเปิดใช้งาน:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียกใช้ Vitest โดยตรง)
- ตั้ง `OPENCLAW_LIVE_MODELS=modern` (หรือ `all` ซึ่งเป็น alias สำหรับ modern) เพื่อรันชุดทดสอบนี้จริง มิฉะนั้นจะข้ามเพื่อให้ `pnpm test:live` โฟกัสที่ gateway smoke
- วิธีเลือกโมเดล:
  - `OPENCLAW_LIVE_MODELS=modern` เพื่อรัน allowlist สมัยใหม่ (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` เป็น alias สำหรับ allowlist สมัยใหม่
  - หรือ `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist คั่นด้วยจุลภาค)
  - การ sweep แบบ modern/all ใช้ขีดจำกัด high-signal ที่คัดสรรไว้เป็นค่าเริ่มต้น ตั้ง `OPENCLAW_LIVE_MAX_MODELS=0` สำหรับการ sweep modern แบบครบถ้วน หรือจำนวนบวกสำหรับขีดจำกัดที่เล็กลง
  - การ sweep แบบครบถ้วนใช้ `OPENCLAW_LIVE_TEST_TIMEOUT_MS` สำหรับ timeout ของการทดสอบ direct-model ทั้งหมด ค่าเริ่มต้น: 60 นาที
  - probe แบบ direct-model รันด้วย parallelism 20 ทางเป็นค่าเริ่มต้น ตั้ง `OPENCLAW_LIVE_MODEL_CONCURRENCY` เพื่อ override
- วิธีเลือกผู้ให้บริการ:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist คั่นด้วยจุลภาค)
- คีย์มาจากที่ใด:
  - โดยค่าเริ่มต้น: profile store และ fallback จาก env
  - ตั้ง `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้เฉพาะ **profile store**
- เหตุผลที่สิ่งนี้มีอยู่:
  - แยก “API ของผู้ให้บริการเสีย / คีย์ไม่ถูกต้อง” ออกจาก “pipeline ของ gateway agent เสีย”
  - มี regression ขนาดเล็กแบบแยกส่วน (ตัวอย่าง: OpenAI Responses/Codex Responses reasoning replay + flow ของ tool-call)

### ชั้นที่ 2: Gateway + dev agent smoke (สิ่งที่ "@openclaw" ทำจริง)

- การทดสอบ: `src/gateway/gateway-models.profiles.live.test.ts`
- เป้าหมาย:
  - เริ่ม gateway ภายใน process
  - สร้าง/patch session `agent:dev:*` (override โมเดลต่อการรัน)
  - วนผ่านโมเดลที่มีคีย์และยืนยันว่า:
    - การตอบกลับ “มีความหมาย” (ไม่มีเครื่องมือ)
    - การเรียกใช้เครื่องมือจริงทำงานได้ (read probe)
    - probe เครื่องมือเพิ่มเติมแบบไม่บังคับ (exec+read probe)
    - path regression ของ OpenAI (tool-call-only → follow-up) ยังทำงาน
- รายละเอียด probe (เพื่อให้คุณอธิบายความล้มเหลวได้เร็ว):
  - `read` probe: การทดสอบเขียนไฟล์ nonce ใน workspace และขอให้ agent `read` ไฟล์นั้น แล้ว echo nonce กลับมา
  - `exec+read` probe: การทดสอบขอให้ agent ใช้ `exec` เขียน nonce ลงในไฟล์ temp แล้ว `read` กลับมา
  - image probe: การทดสอบแนบ PNG ที่สร้างขึ้น (แมว + โค้ดสุ่ม) และคาดว่าโมเดลจะคืนค่า `cat <CODE>`
  - อ้างอิง implementation: `src/gateway/gateway-models.profiles.live.test.ts` และ `src/gateway/live-image-probe.ts`
- วิธีเปิดใช้งาน:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียกใช้ Vitest โดยตรง)
- วิธีเลือกโมเดล:
  - ค่าเริ่มต้น: allowlist สมัยใหม่ (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` เป็น alias สำหรับ allowlist สมัยใหม่
  - หรือตั้ง `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (หรือรายการคั่นด้วยจุลภาค) เพื่อจำกัดขอบเขต
  - การ sweep gateway แบบ modern/all ใช้ขีดจำกัด high-signal ที่คัดสรรไว้เป็นค่าเริ่มต้น ตั้ง `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` สำหรับการ sweep modern แบบครบถ้วน หรือจำนวนบวกสำหรับขีดจำกัดที่เล็กลง
- วิธีเลือกผู้ให้บริการ (หลีกเลี่ยง “OpenRouter ทั้งหมด”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist คั่นด้วยจุลภาค)
- probe เครื่องมือ + รูปภาพเปิดอยู่เสมอในการทดสอบ live นี้:
  - `read` probe + `exec+read` probe (tool stress)
  - image probe รันเมื่อโมเดลประกาศว่ารองรับอินพุตรูปภาพ
  - Flow (ระดับสูง):
    - การทดสอบสร้าง PNG ขนาดเล็กที่มี “CAT” + โค้ดสุ่ม (`src/gateway/live-image-probe.ts`)
    - ส่งผ่าน `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway แยกวิเคราะห์ attachments เป็น `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - agent ที่ฝังอยู่ส่งข้อความผู้ใช้แบบ multimodal ไปยังโมเดล
    - Assertion: คำตอบมี `cat` + โค้ด (ความทนทาน OCR: อนุญาตให้ผิดพลาดเล็กน้อย)

<Tip>
หากต้องการดูว่าคุณทดสอบอะไรได้บนเครื่องของคุณ (และ id `provider/model` ที่แน่นอน) ให้รัน:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: CLI backend smoke (Claude, Codex, Gemini หรือ CLI local อื่น ๆ)

- การทดสอบ: `src/gateway/gateway-cli-backend.live.test.ts`
- เป้าหมาย: ตรวจสอบ pipeline Gateway + agent โดยใช้ CLI backend แบบ local โดยไม่แตะ config เริ่มต้นของคุณ
- ค่าเริ่มต้นของ smoke เฉพาะ backend อยู่กับ definition `cli-backend.ts` ของ Plugin เจ้าของ
- เปิดใช้งาน:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียกใช้ Vitest โดยตรง)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- ค่าเริ่มต้น:
  - ผู้ให้บริการ/โมเดลเริ่มต้น: `claude-cli/claude-sonnet-4-6`
  - พฤติกรรม command/args/image มาจาก metadata ของ CLI backend Plugin เจ้าของ
- Override (ไม่บังคับ):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` เพื่อส่ง attachment รูปภาพจริง (path จะถูกใส่เข้าไปใน prompt) สูตร Docker ปิดค่านี้เป็นค่าเริ่มต้น เว้นแต่จะร้องขออย่างชัดเจน
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` เพื่อส่ง path ไฟล์รูปภาพเป็น CLI args แทนการฉีดเข้า prompt
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (หรือ `"list"`) เพื่อควบคุมวิธีส่ง image args เมื่อตั้ง `IMAGE_ARG`
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` เพื่อส่ง turn ที่สองและตรวจสอบ flow การ resume
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` เพื่อเลือกใช้ probe ความต่อเนื่องใน session เดียวกันจาก Claude Sonnet -> Opus เมื่อโมเดลที่เลือกสนับสนุนเป้าหมายการ switch สูตร Docker ปิดค่านี้เป็นค่าเริ่มต้นเพื่อความน่าเชื่อถือโดยรวม
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` เพื่อเลือกใช้ probe MCP/tool loopback สูตร Docker ปิดค่านี้เป็นค่าเริ่มต้น เว้นแต่จะร้องขออย่างชัดเจน

ตัวอย่าง:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

smoke config Gemini MCP ราคาถูก:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

สิ่งนี้ไม่ได้ขอให้ Gemini สร้างคำตอบ แต่จะเขียน system
settings เดียวกับที่ OpenClaw ส่งให้ Gemini จากนั้นรัน `gemini --debug mcp list` เพื่อพิสูจน์ว่า server
ที่บันทึกไว้เป็น `transport: "streamable-http"` ถูก normalize เป็น shape HTTP MCP ของ Gemini
และสามารถเชื่อมต่อกับ server MCP แบบ streamable-HTTP local ได้

สูตร Docker:

```bash
pnpm test:docker:live-cli-backend
```

สูตร Docker สำหรับผู้ให้บริการรายเดียว:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

หมายเหตุ:

- Docker runner อยู่ที่ `scripts/test-live-cli-backend-docker.sh`
- มันรัน live CLI-backend smoke ภายใน image Docker ของ repo ในฐานะผู้ใช้ `node` ที่ไม่ใช่ root
- มัน resolve metadata ของ CLI smoke จากส่วนขยายเจ้าของ จากนั้นติดตั้งแพ็กเกจ Linux CLI ที่ตรงกัน (`@anthropic-ai/claude-code`, `@openai/codex` หรือ `@google/gemini-cli`) ลงใน prefix ที่เขียนได้และมี cache ที่ `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`)
- `pnpm test:docker:live-cli-backend:claude-subscription` ต้องใช้ portable Claude Code subscription OAuth ผ่าน `~/.claude/.credentials.json` ที่มี `claudeAiOauth.subscriptionType` หรือ `CLAUDE_CODE_OAUTH_TOKEN` จาก `claude setup-token` โดยจะพิสูจน์ direct `claude -p` ใน Docker ก่อน จากนั้นรัน Gateway CLI-backend สอง turn โดยไม่เก็บ env var ของ Anthropic API-key lane subscription นี้ปิด probe Claude MCP/tool และรูปภาพเป็นค่าเริ่มต้น เพราะปัจจุบัน Claude route การใช้งานแอปของบุคคลที่สามผ่านการคิดค่าบริการการใช้งานเพิ่มเติมแทนขีดจำกัดปกติของแผน subscription
- live CLI-backend smoke ตอนนี้ทดสอบ flow end-to-end เดียวกันสำหรับ Claude, Codex และ Gemini: turn ข้อความ, turn จำแนกรูปภาพ จากนั้นเรียก tool MCP `cron` ที่ตรวจสอบผ่าน gateway CLI
- smoke เริ่มต้นของ Claude ยัง patch session จาก Sonnet เป็น Opus และตรวจสอบว่า session ที่ resume แล้วยังจำ note ก่อนหน้าได้

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- ทดสอบ: `src/gateway/gateway-acp-bind.live.test.ts`
- เป้าหมาย: ตรวจสอบโฟลว์ bind การสนทนา ACP จริงกับ ACP agent แบบ live:
  - ส่ง `/acp spawn <agent> --bind here`
  - bind การสนทนาช่องทางข้อความสังเคราะห์ในตำแหน่งเดิม
  - ส่งการติดตามผลปกติในการสนทนาเดียวกันนั้น
  - ตรวจสอบว่าการติดตามผลไปอยู่ใน transcript ของเซสชัน ACP ที่ถูก bind แล้ว
- เปิดใช้:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- ค่าเริ่มต้น:
  - ACP agents ใน Docker: `claude,codex,gemini`
  - ACP agent สำหรับ `pnpm test:live ...` โดยตรง: `claude`
  - ช่องทางสังเคราะห์: บริบทการสนทนาแบบ DM ของ Slack
  - แบ็กเอนด์ ACP: `acpx`
- การแทนที่:
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
  - เลนนี้ใช้พื้นผิว `chat.send` ของ gateway พร้อมฟิลด์ originating-route สังเคราะห์สำหรับผู้ดูแลเท่านั้น เพื่อให้การทดสอบสามารถแนบบริบทช่องทางข้อความได้โดยไม่แสร้งว่าส่งออกไปภายนอก
  - เมื่อไม่ได้ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` การทดสอบจะใช้ registry agent ในตัวของ Plugin `acpx` ที่ฝังไว้สำหรับ ACP harness agent ที่เลือก
  - การสร้าง MCP สำหรับ Cron ของเซสชันที่ถูก bind เป็นแบบพยายามให้ดีที่สุดโดยค่าเริ่มต้น เพราะ ACP harness ภายนอกอาจยกเลิกการเรียก MCP หลังจากหลักฐาน bind/image ผ่านแล้ว ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` เพื่อทำให้การ probe Cron หลัง bind นั้นเข้มงวด

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

สูตร Docker สำหรับ agent เดียว:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

หมายเหตุ Docker:

- Docker runner อยู่ที่ `scripts/test-live-acp-bind-docker.sh`
- โดยค่าเริ่มต้น จะรัน ACP bind smoke กับ live CLI agents แบบรวมตามลำดับ: `claude`, `codex`, แล้วจึง `gemini`
- ใช้ `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` หรือ `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` เพื่อจำกัดเมทริกซ์
- สคริปต์จะ source `~/.profile`, จัดเตรียมวัสดุ auth ของ CLI ที่ตรงกันเข้าไปในคอนเทนเนอร์ แล้วติดตั้ง live CLI ที่ร้องขอ (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid ผ่าน `https://app.factory.ai/cli`, `@google/gemini-cli` หรือ `opencode-ai`) หากยังไม่มี แบ็กเอนด์ ACP เองคือแพ็กเกจ `acpx/runtime` ที่ฝังไว้จาก Plugin `acpx` อย่างเป็นทางการ
- ตัวแปร Docker สำหรับ Droid จะจัดเตรียม `~/.factory` สำหรับการตั้งค่า ส่งต่อ `FACTORY_API_KEY` และต้องใช้ API key นั้น เพราะการ auth แบบ Factory OAuth/keyring ในเครื่องไม่สามารถพกพาเข้าไปในคอนเทนเนอร์ได้ โดยใช้รายการ registry ในตัวของ ACPX คือ `droid exec --output-format acp`
- ตัวแปร Docker สำหรับ OpenCode เป็นเลน regression สำหรับ agent เดียวแบบเข้มงวด โดยเขียนโมเดลเริ่มต้น `OPENCODE_CONFIG_CONTENT` ชั่วคราวจาก `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (ค่าเริ่มต้น `opencode/kimi-k2.6`) หลังจาก source `~/.profile` และ `pnpm test:docker:live-acp-bind:opencode` ต้องมี transcript ของผู้ช่วยที่ถูก bind แทนที่จะยอมรับการข้ามหลัง bind แบบทั่วไป
- การเรียก CLI `acpx` โดยตรงเป็นเพียงเส้นทางแบบ manual/workaround สำหรับเปรียบเทียบพฤติกรรมภายนอก Gateway เท่านั้น ACP bind smoke บน Docker ทดสอบแบ็กเอนด์ runtime `acpx` ที่ฝังไว้ของ OpenClaw

## Live: Codex app-server harness smoke

- เป้าหมาย: ตรวจสอบ Codex harness ที่ Plugin เป็นเจ้าของผ่านเมธอด gateway
  `agent` ปกติ:
  - โหลด Plugin `codex` ที่ bundle มา
  - เลือก `OPENCLAW_AGENT_RUNTIME=codex`
  - ส่ง turn แรกของ gateway agent ไปที่ `openai/gpt-5.5` พร้อมบังคับใช้ Codex harness
  - ส่ง turn ที่สองไปยังเซสชัน OpenClaw เดียวกัน และตรวจสอบว่า thread ของ app-server
    สามารถ resume ได้
  - รัน `/codex status` และ `/codex models` ผ่านเส้นทางคำสั่ง gateway เดียวกัน
  - เลือกรัน shell probes แบบสิทธิ์ยกระดับที่ Guardian ตรวจทานแล้วสองรายการ: คำสั่งที่ไม่เป็นอันตรายหนึ่งคำสั่งซึ่งควรได้รับการอนุมัติ และการอัปโหลด fake-secret หนึ่งรายการซึ่งควรถูกปฏิเสธเพื่อให้ agent ถามกลับ
- ทดสอบ: `src/gateway/gateway-codex-harness.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- โมเดลเริ่มต้น: `openai/gpt-5.5`
- image probe แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- MCP/tool probe แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Guardian probe แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke ใช้ `agentRuntime.id: "codex"` เพื่อให้ Codex harness ที่เสียไม่สามารถ
  ผ่านได้ด้วยการ fallback ไปที่ PI อย่างเงียบ ๆ
- Auth: auth ของ Codex app-server จากการล็อกอิน subscription ของ Codex ในเครื่อง Docker
  smokes ยังสามารถให้ `OPENAI_API_KEY` สำหรับ probes ที่ไม่ใช่ Codex เมื่อเกี่ยวข้อง
  รวมถึงคัดลอก `~/.codex/auth.json` และ `~/.codex/config.toml` แบบเลือกได้

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
- สคริปต์จะ source `~/.profile` ที่ mount ไว้ ส่งผ่าน `OPENAI_API_KEY` คัดลอกไฟล์ auth ของ Codex CLI
  เมื่อมี ติดตั้ง `@openai/codex` ลงใน npm
  prefix ที่ mount ไว้และเขียนได้ จัดเตรียม source tree แล้วรันเฉพาะการทดสอบ live ของ Codex-harness
- Docker เปิดใช้ image, MCP/tool และ Guardian probes โดยค่าเริ่มต้น ตั้งค่า
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` เมื่อคุณต้องการรัน debug
  ที่แคบลง
- Docker ใช้การกำหนดค่า runtime ของ Codex ที่ชัดเจนเหมือนกัน ดังนั้น aliases เดิมหรือการ fallback ของ PI
  จึงไม่สามารถซ่อน regression ของ Codex harness ได้

### สูตร live ที่แนะนำ

allowlists ที่แคบและชัดเจนเร็วที่สุดและมีความ flaky น้อยที่สุด:

- โมเดลเดียว โดยตรง (ไม่มี gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- โมเดลเดียว gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การเรียก tool ข้ามหลาย providers:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- เน้น Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke:
  - หาก keys ในเครื่องอยู่ใน shell profile: `source ~/.profile`
  - ค่าเริ่มต้น dynamic ของ Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - budget แบบ dynamic ของ Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

หมายเหตุ:

- `google/...` ใช้ Gemini API (API key)
- `google-antigravity/...` ใช้ bridge ของ Antigravity OAuth (endpoint ของ agent แบบ Cloud Code Assist)
- `google-gemini-cli/...` ใช้ Gemini CLI ในเครื่องของคุณ (มี auth แยกต่างหากและรายละเอียดเครื่องมือเฉพาะตัว)
- Gemini API เทียบกับ Gemini CLI:
  - API: OpenClaw เรียก Gemini API ที่ Google โฮสต์ผ่าน HTTP (API key / profile auth); นี่คือสิ่งที่ผู้ใช้ส่วนใหญ่หมายถึงเมื่อพูดถึง “Gemini”
  - CLI: OpenClaw shell out ไปยังไบนารี `gemini` ในเครื่อง; มี auth ของตัวเองและอาจทำงานต่างกัน (การรองรับ streaming/tool/version skew)

## Live: เมทริกซ์โมเดล (สิ่งที่เราครอบคลุม)

ไม่มี “รายการโมเดล CI” แบบตายตัว (live เป็น opt-in) แต่โมเดลเหล่านี้คือโมเดลที่ **แนะนำ** ให้ครอบคลุมเป็นประจำบนเครื่อง dev ที่มี keys

### ชุด smoke สมัยใหม่ (การเรียก tool + image)

นี่คือการรัน “common models” ที่เราคาดว่าจะรักษาให้ทำงานต่อไป:

- OpenAI (ไม่ใช่ Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` และ `google/gemini-3-flash-preview` (หลีกเลี่ยงโมเดล Gemini 2.x รุ่นเก่า)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` และ `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` และ `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

รัน gateway smoke พร้อม tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: การเรียก tool (Read + Exec แบบเลือกได้)

เลือกอย่างน้อยหนึ่งรายการต่อ provider family:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (หรือ `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

ความครอบคลุมเพิ่มเติมแบบเลือกได้ (มีไว้ก็ดี):

- xAI: `xai/grok-4.3` (หรือรุ่นล่าสุดที่มี)
- Mistral: `mistral/`… (เลือกโมเดลที่รองรับ “tools” หนึ่งตัวที่คุณเปิดใช้ไว้)
- Cerebras: `cerebras/`… (หากคุณมีสิทธิ์เข้าถึง)
- LM Studio: `lmstudio/`… (ในเครื่อง; การเรียก tool ขึ้นกับโหมด API)

### Vision: การส่ง image (attachment → multimodal message)

รวมโมเดลที่รองรับ image อย่างน้อยหนึ่งตัวไว้ใน `OPENCLAW_LIVE_GATEWAY_MODELS` (ตัวแปรที่รองรับ vision ของ Claude/Gemini/OpenAI เป็นต้น) เพื่อทดสอบ image probe

### Aggregators / gateways ทางเลือก

หากคุณเปิดใช้ keys ไว้ เรายังรองรับการทดสอบผ่าน:

- OpenRouter: `openrouter/...` (หลายร้อยโมเดล; ใช้ `openclaw models scan` เพื่อค้นหาตัวเลือกที่รองรับ tool+image)
- OpenCode: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go (auth ผ่าน `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

providers เพิ่มเติมที่คุณสามารถรวมไว้ในเมทริกซ์ live (หากคุณมี creds/config):

- ในตัว: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- ผ่าน `models.providers` (endpoints แบบกำหนดเอง): `minimax` (cloud/API) รวมถึง proxy ที่เข้ากันได้กับ OpenAI/Anthropic ใด ๆ (LM Studio, vLLM, LiteLLM เป็นต้น)

<Tip>
อย่า hardcode "all models" ใน docs รายการที่ authoritative คือสิ่งที่ `discoverModels(...)` คืนค่าบนเครื่องของคุณ บวกกับ keys ที่มีอยู่
</Tip>

## ข้อมูลประจำตัว (ห้าม commit)

การทดสอบ live ค้นหาข้อมูลประจำตัวในวิธีเดียวกับที่ CLI ใช้ ผลในทางปฏิบัติ:

- หาก CLI ใช้งานได้ การทดสอบแบบสดควรพบคีย์เดียวกัน
- หากการทดสอบแบบสดแจ้งว่า “ไม่มีข้อมูลรับรอง” ให้ดีบักด้วยวิธีเดียวกับที่คุณใช้ดีบัก `openclaw models list` / การเลือกโมเดล

- โปรไฟล์การยืนยันตัวตนต่อเอเจนต์: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (นี่คือความหมายของ “คีย์โปรไฟล์” ในการทดสอบแบบสด)
- การกำหนดค่า: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรีสถานะเดิม: `~/.openclaw/credentials/` (ถูกคัดลอกเข้าไปในโฮมทดสอบแบบสดที่จัดเตรียมไว้เมื่อมีอยู่ แต่ไม่ใช่ที่เก็บคีย์โปรไฟล์หลัก)
- การรันแบบสดภายในเครื่องจะคัดลอกการกำหนดค่าที่ใช้งานอยู่, ไฟล์ `auth-profiles.json` ต่อเอเจนต์, `credentials/` เดิม และไดเรกทอรีการยืนยันตัวตน CLI ภายนอกที่รองรับ เข้าไปในโฮมทดสอบชั่วคราวโดยค่าเริ่มต้น; โฮมสดที่จัดเตรียมไว้จะข้าม `workspace/` และ `sandboxes/` และการแทนที่พาธ `agents.*.workspace` / `agentDir` จะถูกตัดออก เพื่อให้โพรบไม่แตะ workspace จริงบนโฮสต์ของคุณ

หากคุณต้องการพึ่งพาคีย์ env (เช่น export ไว้ใน `~/.profile` ของคุณ) ให้รันการทดสอบภายในเครื่องหลังจาก `source ~/.profile` หรือใช้ Docker runners ด้านล่าง (สามารถ mount `~/.profile` เข้าไปในคอนเทนเนอร์ได้)

## Deepgram live (การถอดเสียงจากเสียง)

- การทดสอบ: `extensions/deepgram/audio.live.test.ts`
- เปิดใช้: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- การทดสอบ: `extensions/byteplus/live.test.ts`
- เปิดใช้: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- การแทนที่โมเดลแบบไม่บังคับ: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- การทดสอบ: `extensions/comfy/comfy.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- ขอบเขต:
  - ทดสอบพาธรูปภาพ วิดีโอ และ `music_generate` ของ comfy ที่รวมมา
  - ข้ามแต่ละความสามารถ เว้นแต่จะกำหนดค่า `plugins.entries.comfy.config.<capability>` ไว้
  - มีประโยชน์หลังจากเปลี่ยนการส่ง workflow ของ comfy, การ polling, การดาวน์โหลด หรือการลงทะเบียน plugin

## Image generation live

- การทดสอบ: `test/image-generation.runtime.live.test.ts`
- คำสั่ง: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- ขอบเขต:
  - แจกแจง plugin ผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้ทุกตัว
  - โหลด env vars ของผู้ให้บริการที่ขาดจาก login shell ของคุณ (`~/.profile`) ก่อนโพรบ
  - ใช้คีย์ API แบบสด/env ก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้โดยค่าเริ่มต้น เพื่อไม่ให้คีย์ทดสอบเก่าใน `auth-profiles.json` บดบังข้อมูลรับรองจริงจาก shell
  - ข้ามผู้ให้บริการที่ไม่มี auth/profile/model ที่ใช้งานได้
  - รันผู้ให้บริการแต่ละรายที่กำหนดค่าไว้ผ่าน runtime การสร้างรูปภาพร่วม:
    - `<provider>:generate`
    - `<provider>:edit` เมื่อผู้ให้บริการประกาศว่ารองรับการแก้ไข
- ผู้ให้บริการที่รวมมาในปัจจุบันซึ่งครอบคลุม:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับการยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการแทนที่แบบ env-only

สำหรับพาธ CLI ที่เผยแพร่ ให้เพิ่ม smoke `infer` หลังจากการทดสอบแบบสดของผู้ให้บริการ/runtime ผ่านแล้ว:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

สิ่งนี้ครอบคลุมการแยกวิเคราะห์อาร์กิวเมนต์ CLI, การแก้ค่าการกำหนดค่า/เอเจนต์เริ่มต้น, การเปิดใช้งาน plugin ที่รวมมา, runtime การสร้างรูปภาพร่วม และคำขอผู้ให้บริการแบบสด คาดว่าการพึ่งพาของ Plugin จะพร้อมก่อนโหลด runtime

## Music generation live

- การทดสอบ: `extensions/music-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- ขอบเขต:
  - ทดสอบพาธผู้ให้บริการสร้างเพลงร่วมที่รวมมา
  - ปัจจุบันครอบคลุม Google และ MiniMax
  - โหลด env vars ของผู้ให้บริการจาก login shell ของคุณ (`~/.profile`) ก่อนโพรบ
  - ใช้คีย์ API แบบสด/env ก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้โดยค่าเริ่มต้น เพื่อไม่ให้คีย์ทดสอบเก่าใน `auth-profiles.json` บดบังข้อมูลรับรองจริงจาก shell
  - ข้ามผู้ให้บริการที่ไม่มี auth/profile/model ที่ใช้งานได้
  - รันทั้งสองโหมด runtime ที่ประกาศไว้เมื่อพร้อมใช้งาน:
    - `generate` ด้วยอินพุตที่มีเฉพาะ prompt
    - `edit` เมื่อผู้ให้บริการประกาศ `capabilities.edit.enabled`
  - ความครอบคลุมของ shared-lane ปัจจุบัน:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ไฟล์ Comfy live แยกต่างหาก ไม่ใช่ sweep ร่วมนี้
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- พฤติกรรมการยืนยันตัวตนแบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับการยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการแทนที่แบบ env-only

## Video generation live

- การทดสอบ: `extensions/video-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- ขอบเขต:
  - ทดสอบพาธผู้ให้บริการสร้างวิดีโอร่วมที่รวมมา
  - ใช้ค่าเริ่มต้นเป็นพาธ smoke ที่ปลอดภัยสำหรับ release: ผู้ให้บริการที่ไม่ใช่ FAL, คำขอ text-to-video หนึ่งรายการต่อผู้ให้บริการ, prompt กุ้งล็อบสเตอร์ความยาวหนึ่งวินาที และเพดานการทำงานต่อผู้ให้บริการจาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` โดยค่าเริ่มต้น)
  - ข้าม FAL โดยค่าเริ่มต้น เพราะ latency ของคิวฝั่งผู้ให้บริการอาจกินเวลา release มากเกินไป; ส่ง `--video-providers fal` หรือ `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` เพื่อรันอย่างชัดเจน
  - โหลด env vars ของผู้ให้บริการจาก login shell ของคุณ (`~/.profile`) ก่อนโพรบ
  - ใช้คีย์ API แบบสด/env ก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้โดยค่าเริ่มต้น เพื่อไม่ให้คีย์ทดสอบเก่าใน `auth-profiles.json` บดบังข้อมูลรับรองจริงจาก shell
  - ข้ามผู้ให้บริการที่ไม่มี auth/profile/model ที่ใช้งานได้
  - รันเฉพาะ `generate` โดยค่าเริ่มต้น
  - ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรันโหมด transform ที่ประกาศไว้ด้วยเมื่อพร้อมใช้งาน:
    - `imageToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.imageToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตรูปภาพภายในเครื่องที่มี buffer รองรับใน sweep ร่วม
    - `videoToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.videoToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตวิดีโอภายในเครื่องที่มี buffer รองรับใน sweep ร่วม
  - ผู้ให้บริการ `imageToVideo` ที่ประกาศแล้วแต่ถูกข้ามในปัจจุบันใน sweep ร่วม:
    - `vydra` เพราะ `veo3` ที่รวมมาเป็น text-only และ `kling` ที่รวมมาต้องใช้ URL รูปภาพระยะไกล
  - ความครอบคลุมเฉพาะผู้ให้บริการ Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ไฟล์นั้นรัน text-to-video ของ `veo3` พร้อม lane ของ `kling` ที่ใช้ fixture URL รูปภาพระยะไกลโดยค่าเริ่มต้น
  - ความครอบคลุม `videoToVideo` แบบสดในปัจจุบัน:
    - `runway` เฉพาะเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`
  - ผู้ให้บริการ `videoToVideo` ที่ประกาศแล้วแต่ถูกข้ามในปัจจุบันใน sweep ร่วม:
    - `alibaba`, `qwen`, `xai` เพราะพาธเหล่านั้นในปัจจุบันต้องใช้ URL อ้างอิง `http(s)` / MP4 ระยะไกล
    - `google` เพราะ lane Gemini/Veo ร่วมปัจจุบันใช้อินพุตภายในเครื่องที่มี buffer รองรับ และพาธนั้นไม่ถูกยอมรับใน sweep ร่วม
    - `openai` เพราะ lane ร่วมปัจจุบันไม่มีการรับประกันการเข้าถึง video inpaint/remix เฉพาะ org
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` เพื่อรวมผู้ให้บริการทุกตัวใน sweep เริ่มต้น รวมถึง FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` เพื่อลดเพดานการทำงานของผู้ให้บริการแต่ละรายสำหรับการรัน smoke แบบเร่งรัด
- พฤติกรรมการยืนยันตัวตนแบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับการยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการแทนที่แบบ env-only

## Media live harness

- คำสั่ง: `pnpm test:live:media`
- วัตถุประสงค์:
  - รันชุดทดสอบสดของรูปภาพ เพลง และวิดีโอร่วมผ่าน entrypoint แบบ repo-native เดียว
  - โหลด env vars ของผู้ให้บริการที่ขาดจาก `~/.profile` โดยอัตโนมัติ
  - จำกัดขอบเขตแต่ละชุดทดสอบให้เหลือเฉพาะผู้ให้บริการที่ปัจจุบันมี auth ที่ใช้งานได้โดยค่าเริ่มต้นโดยอัตโนมัติ
  - ใช้ `scripts/test-live.mjs` ซ้ำ เพื่อให้พฤติกรรม Heartbeat และโหมดเงียบสอดคล้องกัน
- ตัวอย่าง:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing) — ชุดทดสอบ unit, integration, QA และ Docker
