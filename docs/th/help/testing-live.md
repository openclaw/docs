---
read_when:
    - การเรียกใช้ smoke test สำหรับเมทริกซ์โมเดลแบบใช้งานจริง / แบ็กเอนด์ CLI / ACP / media-provider
    - การดีบักการระบุข้อมูลประจำตัวสำหรับการทดสอบจริง
    - การเพิ่มการทดสอบแบบสดรายการใหม่เฉพาะผู้ให้บริการ
sidebarTitle: Live tests
summary: 'การทดสอบแบบสด (ที่เข้าถึงเครือข่าย): เมทริกซ์โมเดล, แบ็กเอนด์ CLI, ACP, ผู้ให้บริการสื่อ, ข้อมูลประจำตัว'
title: 'การทดสอบ: ชุดทดสอบแบบสด'
x-i18n:
    generated_at: "2026-05-02T10:19:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2268f20ce5c0bbee8bf610938851fe529f5e21fa31fe08a70400df94e9241cc3
    source_path: help/testing-live.md
    workflow: 16
---

สำหรับการเริ่มต้นอย่างรวดเร็ว, ตัวรัน QA, ชุดทดสอบยูนิต/อินทิเกรชัน และโฟลว์ Docker โปรดดู
[การทดสอบ](/th/help/testing) หน้านี้ครอบคลุมชุดทดสอบ **live** (ที่แตะเครือข่าย):
เมทริกซ์โมเดล, แบ็กเอนด์ CLI, ACP และการทดสอบ live ของผู้ให้บริการสื่อ รวมถึง
การจัดการข้อมูลรับรอง

## Live: คำสั่ง smoke สำหรับโปรไฟล์ในเครื่อง

Source `~/.profile` ก่อนการตรวจสอบ live แบบเฉพาะกิจ เพื่อให้คีย์ผู้ให้บริการและพาธเครื่องมือในเครื่อง
ตรงกับ shell ของคุณ:

```bash
source ~/.profile
```

Smoke สื่อที่ปลอดภัย:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke ความพร้อมของสายเสียงที่ปลอดภัย:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` เป็นการรันแบบ dry run เว้นแต่จะมี `--yes` ด้วย ใช้ `--yes` เฉพาะ
เมื่อคุณตั้งใจจะโทรแจ้งเตือนจริง สำหรับ Twilio, Telnyx และ
Plivo การตรวจสอบความพร้อมที่สำเร็จต้องมี URL webhook สาธารณะ; fallback แบบ loopback/private เฉพาะในเครื่อง
จะถูกปฏิเสธโดยการออกแบบ

## Live: การ sweep ความสามารถของ Node Android

- การทดสอบ: `src/gateway/android-node.capabilities.live.test.ts`
- สคริปต์: `pnpm android:test:integration`
- เป้าหมาย: เรียกใช้ **ทุกคำสั่งที่ถูกประกาศในปัจจุบัน** โดย Node Android ที่เชื่อมต่ออยู่ และยืนยันพฤติกรรมตามสัญญาของคำสั่ง
- ขอบเขต:
  - การตั้งค่าเบื้องต้น/แบบ manual ที่มีเงื่อนไขล่วงหน้า (ชุดทดสอบนี้ไม่ติดตั้ง/รัน/จับคู่แอป)
  - การตรวจสอบ `node.invoke` ของ Gateway ทีละคำสั่งสำหรับ Node Android ที่เลือก
- การตั้งค่าล่วงหน้าที่จำเป็น:
  - แอป Android เชื่อมต่อและจับคู่กับ gateway แล้ว
  - ให้แอปอยู่เบื้องหน้า
  - ให้สิทธิ์/ยินยอมการจับภาพสำหรับความสามารถที่คุณคาดว่าจะผ่าน
- การแทนที่เป้าหมายแบบไม่บังคับ:
  - `OPENCLAW_ANDROID_NODE_ID` หรือ `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- รายละเอียดการตั้งค่า Android แบบเต็ม: [แอป Android](/th/platforms/android)

## Live: smoke โมเดล (คีย์โปรไฟล์)

การทดสอบ live แบ่งเป็นสองชั้นเพื่อให้เราแยกความล้มเหลวได้:

- “โมเดลโดยตรง” บอกเราว่าผู้ให้บริการ/โมเดลสามารถตอบได้เลยด้วยคีย์ที่ให้มา
- “smoke ของ Gateway” บอกเราว่า pipeline แบบ gateway+agent ทั้งหมดทำงานกับโมเดลนั้น (sessions, history, tools, sandbox policy ฯลฯ)

### ชั้นที่ 1: การ completion ของโมเดลโดยตรง (ไม่มี gateway)

- การทดสอบ: `src/agents/models.profiles.live.test.ts`
- เป้าหมาย:
  - แจกแจงโมเดลที่ค้นพบ
  - ใช้ `getApiKeyForModel` เพื่อเลือกโมเดลที่คุณมี creds
  - รัน completion ขนาดเล็กต่อโมเดล (และ regression เฉพาะจุดเมื่อจำเป็น)
- วิธีเปิดใช้งาน:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- ตั้งค่า `OPENCLAW_LIVE_MODELS=modern` (หรือ `all` ซึ่งเป็น alias ของ modern) เพื่อรันชุดทดสอบนี้จริง ๆ; มิฉะนั้นจะข้ามเพื่อให้ `pnpm test:live` มุ่งเน้นที่ gateway smoke
- วิธีเลือกโมเดล:
  - `OPENCLAW_LIVE_MODELS=modern` เพื่อรัน allowlist สมัยใหม่ (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` เป็น alias ของ allowlist สมัยใหม่
  - หรือ `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist แบบคั่นด้วยจุลภาค)
  - การ sweep แบบ modern/all ใช้เพดาน curated ที่ให้สัญญาณสูงเป็นค่าเริ่มต้น; ตั้งค่า `OPENCLAW_LIVE_MAX_MODELS=0` สำหรับการ sweep modern แบบครบถ้วน หรือเลขบวกสำหรับเพดานที่เล็กลง
  - การ sweep แบบครบถ้วนใช้ `OPENCLAW_LIVE_TEST_TIMEOUT_MS` เป็น timeout สำหรับการทดสอบ direct-model ทั้งหมด ค่าเริ่มต้น: 60 นาที
  - probe direct-model รันด้วย parallelism 20 ทางเป็นค่าเริ่มต้น; ตั้งค่า `OPENCLAW_LIVE_MODEL_CONCURRENCY` เพื่อแทนที่
- วิธีเลือกผู้ให้บริการ:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist แบบคั่นด้วยจุลภาค)
- คีย์มาจากที่ใด:
  - ค่าเริ่มต้น: profile store และ fallback จาก env
  - ตั้งค่า `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้เฉพาะ **profile store**
- เหตุผลที่มีสิ่งนี้:
  - แยก “API ของผู้ให้บริการเสีย / คีย์ไม่ถูกต้อง” ออกจาก “pipeline ของ gateway agent เสีย”
  - มี regression ขนาดเล็กและแยกโดดเดี่ยว (ตัวอย่าง: OpenAI Responses/Codex Responses reasoning replay + โฟลว์ tool-call)

### ชั้นที่ 2: Gateway + smoke ของ dev agent (สิ่งที่ "@openclaw" ทำจริง)

- การทดสอบ: `src/gateway/gateway-models.profiles.live.test.ts`
- เป้าหมาย:
  - เริ่ม gateway แบบ in-process
  - สร้าง/patch session `agent:dev:*` (แทนที่โมเดลต่อการรัน)
  - วนผ่าน models-with-keys และยืนยันว่า:
    - response “มีความหมาย” (ไม่มี tools)
    - การเรียกใช้ tool จริงทำงานได้ (read probe)
    - probe tool เพิ่มเติมแบบไม่บังคับ (exec+read probe)
    - เส้นทาง regression ของ OpenAI (tool-call-only → follow-up) ยังทำงานต่อไป
- รายละเอียด probe (เพื่อให้คุณอธิบายความล้มเหลวได้อย่างรวดเร็ว):
  - probe `read`: การทดสอบเขียนไฟล์ nonce ใน workspace และขอให้ agent `read` ไฟล์นั้นแล้ว echo nonce กลับมา
  - probe `exec+read`: การทดสอบขอให้ agent `exec` เพื่อเขียน nonce ลงในไฟล์ temp จากนั้น `read` กลับมา
  - probe ภาพ: การทดสอบแนบ PNG ที่สร้างขึ้น (cat + โค้ดแบบสุ่ม) และคาดหวังให้โมเดลส่งคืน `cat <CODE>`
  - อ้างอิง implementation: `src/gateway/gateway-models.profiles.live.test.ts` และ `src/gateway/live-image-probe.ts`
- วิธีเปิดใช้งาน:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- วิธีเลือกโมเดล:
  - ค่าเริ่มต้น: allowlist สมัยใหม่ (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` เป็น alias ของ allowlist สมัยใหม่
  - หรือตั้งค่า `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (หรือรายการแบบคั่นด้วยจุลภาค) เพื่อจำกัด
  - การ sweep gateway แบบ modern/all ใช้เพดาน curated ที่ให้สัญญาณสูงเป็นค่าเริ่มต้น; ตั้งค่า `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` สำหรับการ sweep modern แบบครบถ้วน หรือเลขบวกสำหรับเพดานที่เล็กลง
- วิธีเลือกผู้ให้บริการ (หลีกเลี่ยง “OpenRouter ทุกอย่าง”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist แบบคั่นด้วยจุลภาค)
- probe tool + ภาพ เปิดอยู่เสมอในการทดสอบ live นี้:
  - probe `read` + probe `exec+read` (tool stress)
  - probe ภาพรันเมื่อโมเดลประกาศว่ารองรับ input ภาพ
  - โฟลว์ (ระดับสูง):
    - การทดสอบสร้าง PNG ขนาดเล็กที่มี “CAT” + โค้ดแบบสุ่ม (`src/gateway/live-image-probe.ts`)
    - ส่งผ่าน `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway แยกวิเคราะห์ attachments เป็น `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent ส่งต่อข้อความผู้ใช้แบบ multimodal ไปยังโมเดล
    - Assertion: reply มี `cat` + โค้ด (ความทนต่อ OCR: อนุญาตความผิดพลาดเล็กน้อย)

<Tip>
หากต้องการดูว่าคุณทดสอบอะไรได้บนเครื่องของคุณ (และ id `provider/model` ที่แน่นอน) ให้รัน:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke แบ็กเอนด์ CLI (Claude, Codex, Gemini หรือ CLI อื่นในเครื่อง)

- การทดสอบ: `src/gateway/gateway-cli-backend.live.test.ts`
- เป้าหมาย: ตรวจสอบ pipeline ของ Gateway + agent โดยใช้แบ็กเอนด์ CLI ในเครื่อง โดยไม่แตะ config เริ่มต้นของคุณ
- ค่าเริ่มต้นของ smoke เฉพาะแบ็กเอนด์อยู่กับ definition `cli-backend.ts` ของ Plugin เจ้าของ
- เปิดใช้งาน:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- ค่าเริ่มต้น:
  - ผู้ให้บริการ/โมเดลเริ่มต้น: `claude-cli/claude-sonnet-4-6`
  - พฤติกรรม command/args/image มาจาก metadata ของ Plugin แบ็กเอนด์ CLI เจ้าของ
- การแทนที่ (ไม่บังคับ):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` เพื่อส่ง image attachment จริง (พาธจะถูก inject เข้า prompt) สูตร Docker ปิดค่านี้เป็นค่าเริ่มต้นเว้นแต่จะร้องขออย่างชัดเจน
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` เพื่อส่งพาธไฟล์ภาพเป็น CLI args แทนการ inject prompt
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (หรือ `"list"`) เพื่อควบคุมวิธีส่ง image args เมื่อตั้งค่า `IMAGE_ARG`
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` เพื่อส่ง turn ที่สองและตรวจสอบโฟลว์ resume
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` เพื่อเลือกใช้ probe ความต่อเนื่องใน session เดียวกัน Claude Sonnet -> Opus เมื่อโมเดลที่เลือกสนับสนุนเป้าหมาย switch สูตร Docker ปิดค่านี้เป็นค่าเริ่มต้นเพื่อความเชื่อถือได้โดยรวม
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` เพื่อเลือกใช้ probe MCP/tool loopback สูตร Docker ปิดค่านี้เป็นค่าเริ่มต้นเว้นแต่จะร้องขออย่างชัดเจน

ตัวอย่าง:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke config MCP ของ Gemini แบบประหยัด:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

สิ่งนี้ไม่ได้ขอให้ Gemini สร้าง response แต่จะเขียน system
settings เดียวกับที่ OpenClaw ให้ Gemini จากนั้นรัน `gemini --debug mcp list` เพื่อพิสูจน์ว่า
server `transport: "streamable-http"` ที่บันทึกไว้ถูก normalize เป็นรูปแบบ HTTP MCP ของ Gemini
และสามารถเชื่อมต่อกับ server MCP streamable-HTTP ในเครื่องได้

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
- มันรัน smoke แบ็กเอนด์ CLI แบบ live ภายในอิมเมจ Docker ของ repo ในฐานะผู้ใช้ `node` ที่ไม่ใช่ root
- มัน resolve metadata ของ CLI smoke จาก extension เจ้าของ จากนั้นติดตั้งแพ็กเกจ Linux CLI ที่ตรงกัน (`@anthropic-ai/claude-code`, `@openai/codex` หรือ `@google/gemini-cli`) ลงใน prefix ที่เขียนได้และมี cache ที่ `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`)
- `pnpm test:docker:live-cli-backend:claude-subscription` ต้องใช้ portable Claude Code subscription OAuth ผ่าน `~/.claude/.credentials.json` ที่มี `claudeAiOauth.subscriptionType` หรือ `CLAUDE_CODE_OAUTH_TOKEN` จาก `claude setup-token` ก่อนอื่นจะพิสูจน์ `claude -p` โดยตรงใน Docker จากนั้นรัน Gateway CLI-backend สอง turn โดยไม่เก็บรักษา env vars ของ Anthropic API-key ช่อง subscription นี้ปิด probe Claude MCP/tool และภาพเป็นค่าเริ่มต้น เพราะปัจจุบัน Claude route การใช้งานแอปของบุคคลที่สามผ่านการคิดค่าบริการ extra-usage แทนขีดจำกัดของแผน subscription ปกติ
- ตอนนี้ smoke แบ็กเอนด์ CLI แบบ live ทดสอบโฟลว์ end-to-end เดียวกันสำหรับ Claude, Codex และ Gemini: turn ข้อความ, turn การจำแนกภาพ จากนั้นเรียก tool MCP `cron` ที่ยืนยันผ่าน gateway CLI
- smoke เริ่มต้นของ Claude ยัง patch session จาก Sonnet เป็น Opus และตรวจสอบว่า session ที่ resume แล้วยังจำ note ก่อนหน้านี้ได้

## Live: smoke การ bind ACP (`/acp spawn ... --bind here`)

- การทดสอบ: `src/gateway/gateway-acp-bind.live.test.ts`
- เป้าหมาย: ตรวจสอบโฟลว์ผูกการสนทนา ACP จริงกับเอเจนต์ ACP แบบสด:
  - ส่ง `/acp spawn <agent> --bind here`
  - ผูกการสนทนาช่องทางข้อความสังเคราะห์ไว้ที่เดิม
  - ส่งข้อความติดตามปกติในการสนทนาเดียวกันนั้น
  - ตรวจสอบว่าข้อความติดตามเข้าไปอยู่ในทรานสคริปต์เซสชัน ACP ที่ผูกไว้
- เปิดใช้งาน:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- ค่าเริ่มต้น:
  - เอเจนต์ ACP ใน Docker: `claude,codex,gemini`
  - เอเจนต์ ACP สำหรับ `pnpm test:live ...` โดยตรง: `claude`
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
  - เลนนี้ใช้พื้นผิว `chat.send` ของ Gateway พร้อมฟิลด์ originating-route สังเคราะห์สำหรับผู้ดูแลเท่านั้น เพื่อให้การทดสอบแนบบริบทช่องทางข้อความได้โดยไม่ต้องแสร้งว่าส่งออกไปภายนอก
  - เมื่อไม่ได้ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` การทดสอบจะใช้รีจิสทรีเอเจนต์ในตัวของ Plugin `acpx` ที่ฝังไว้ สำหรับเอเจนต์ harness ACP ที่เลือก
  - การสร้าง MCP ของ Cron สำหรับเซสชันที่ผูกไว้เป็นแบบพยายามให้ดีที่สุดตามค่าเริ่มต้น เพราะ harness ACP ภายนอกสามารถยกเลิกการเรียก MCP หลังจากหลักฐานการผูก/รูปภาพผ่านแล้วได้; ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` เพื่อทำให้ probe Cron หลังผูกเข้มงวด

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

สูตร Docker สำหรับเอเจนต์เดียว:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

หมายเหตุ Docker:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-acp-bind-docker.sh`.
- โดยค่าเริ่มต้น จะรัน ACP bind smoke กับเอเจนต์ CLI สดแบบรวมตามลำดับ: `claude`, `codex`, จากนั้น `gemini`
- ใช้ `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, หรือ `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` เพื่อจำกัดเมทริกซ์
- จะ source `~/.profile`, จัดเตรียมวัสดุยืนยันตัวตน CLI ที่ตรงกันเข้าไปในคอนเทนเนอร์ จากนั้นติดตั้ง CLI สดที่ร้องขอ (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid ผ่าน `https://app.factory.ai/cli`, `@google/gemini-cli`, หรือ `opencode-ai`) หากยังไม่มี แบ็กเอนด์ ACP เองคือแพ็กเกจ `acpx/runtime` ที่ฝังไว้จาก Plugin `acpx` ทางการ
- ตัวแปร Docker ของ Droid จะจัดเตรียม `~/.factory` สำหรับการตั้งค่า, ส่งต่อ `FACTORY_API_KEY`, และต้องใช้ API key นั้น เพราะการยืนยันตัวตนแบบ OAuth/keyring ของ Factory ในเครื่องไม่สามารถย้ายเข้าไปในคอนเทนเนอร์ได้ ใช้รายการรีจิสทรีในตัวของ ACPX คือ `droid exec --output-format acp`
- ตัวแปร Docker ของ OpenCode เป็นเลนถดถอยสำหรับเอเจนต์เดียวแบบเข้มงวด เขียนโมเดลเริ่มต้น `OPENCODE_CONFIG_CONTENT` ชั่วคราวจาก `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (ค่าเริ่มต้น `opencode/kimi-k2.6`) หลังจาก source `~/.profile`, และ `pnpm test:docker:live-acp-bind:opencode` ต้องมีทรานสคริปต์ผู้ช่วยที่ผูกไว้ แทนที่จะยอมรับการข้ามหลังผูกแบบทั่วไป
- การเรียก CLI `acpx` โดยตรงเป็นเพียงเส้นทางแบบแมนนวล/ทางเลี่ยงสำหรับเปรียบเทียบพฤติกรรมนอก Gateway เท่านั้น ACP bind smoke ใน Docker จะทดสอบแบ็กเอนด์ runtime `acpx` ที่ฝังไว้ของ OpenClaw

## Live: smoke ของ harness app-server ของ Codex

- เป้าหมาย: ตรวจสอบ harness Codex ที่ Plugin เป็นเจ้าของผ่านเมธอด Gateway ปกติ
  `agent`:
  - โหลด Plugin `codex` ที่บันเดิลมา
  - เลือก `OPENCLAW_AGENT_RUNTIME=codex`
  - ส่งเทิร์นเอเจนต์ Gateway แรกไปยัง `openai/gpt-5.5` โดยบังคับใช้ harness Codex
  - ส่งเทิร์นที่สองไปยังเซสชัน OpenClaw เดียวกันและตรวจสอบว่าเธรด app-server
    สามารถกลับมาทำงานต่อได้
  - รัน `/codex status` และ `/codex models` ผ่านเส้นทางคำสั่ง Gateway เดียวกัน
  - เลือกรัน probe เชลล์แบบยกระดับสองรายการที่ Guardian ตรวจสอบแล้ว: คำสั่งที่ไม่เป็นอันตรายหนึ่งรายการ
    ซึ่งควรได้รับอนุมัติ และการอัปโหลดความลับปลอมหนึ่งรายการที่ควรถูกปฏิเสธ
    เพื่อให้เอเจนต์ถามกลับ
- การทดสอบ: `src/gateway/gateway-codex-harness.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- โมเดลเริ่มต้น: `openai/gpt-5.5`
- probe รูปภาพเสริม: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- probe MCP/เครื่องมือเสริม: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- probe Guardian เสริม: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke นี้ตั้งค่า `OPENCLAW_AGENT_HARNESS_FALLBACK=none` เพื่อให้ harness Codex
  ที่เสียไม่สามารถผ่านได้โดย fallback ไปที่ PI อย่างเงียบ ๆ
- การยืนยันตัวตน: การยืนยันตัวตน app-server ของ Codex จากการล็อกอินสมาชิก Codex ในเครื่อง smoke ของ Docker
  ยังสามารถให้ `OPENAI_API_KEY` สำหรับ probe ที่ไม่ใช่ Codex เมื่อเกี่ยวข้องได้
  รวมถึง `~/.codex/auth.json` และ `~/.codex/config.toml` ที่คัดลอกมาแบบเสริม

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

- ตัวรัน Docker อยู่ที่ `scripts/test-live-codex-harness-docker.sh`.
- จะ source `~/.profile` ที่เมานต์ไว้, ส่งผ่าน `OPENAI_API_KEY`, คัดลอกไฟล์ยืนยันตัวตน CLI ของ Codex
  เมื่อมีอยู่, ติดตั้ง `@openai/codex` ลงใน prefix npm ที่เมานต์ไว้และเขียนได้,
  จัดเตรียมซอร์สทรี จากนั้นรันเฉพาะการทดสอบสดของ harness Codex
- Docker เปิดใช้งาน probe รูปภาพ, MCP/เครื่องมือ, และ Guardian ตามค่าเริ่มต้น ตั้งค่า
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` เมื่อคุณต้องการรันดีบัก
  ที่แคบลง
- Docker ยัง export `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ให้ตรงกับคอนฟิกการทดสอบสด
  เพื่อไม่ให้ alias แบบเดิมหรือ PI fallback ซ่อน regression ของ harness Codex ได้

### สูตรสดที่แนะนำ

allowlist ที่แคบและระบุชัดเจนเร็วที่สุดและ flaky น้อยที่สุด:

- โมเดลเดียว, โดยตรง (ไม่มี Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- โมเดลเดียว, Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การเรียกเครื่องมือข้ามผู้ให้บริการหลายราย:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- โฟกัส Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- smoke การคิดแบบปรับตัวของ Google:
  - หากคีย์ในเครื่องอยู่ในโปรไฟล์เชลล์: `source ~/.profile`
  - ค่าเริ่มต้นไดนามิกของ Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - งบประมาณไดนามิกของ Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

หมายเหตุ:

- `google/...` ใช้ Gemini API (API key)
- `google-antigravity/...` ใช้บริดจ์ OAuth ของ Antigravity (endpoint เอเจนต์แบบ Cloud Code Assist)
- `google-gemini-cli/...` ใช้ CLI Gemini ในเครื่องของคุณ (มีการยืนยันตัวตนและรายละเอียดเครื่องมือแยกต่างหาก)
- Gemini API เทียบกับ Gemini CLI:
  - API: OpenClaw เรียก Gemini API ที่ Google โฮสต์ผ่าน HTTP (API key / การยืนยันตัวตนโปรไฟล์); นี่คือสิ่งที่ผู้ใช้ส่วนใหญ่หมายถึงเมื่อพูดว่า “Gemini”
  - CLI: OpenClaw shell out ไปยังไบนารี `gemini` ในเครื่อง; มีการยืนยันตัวตนของตัวเองและอาจทำงานต่างออกไป (การรองรับสตรีมมิง/เครื่องมือ/ความต่างของเวอร์ชัน)

## Live: เมทริกซ์โมเดล (สิ่งที่เราครอบคลุม)

ไม่มี “รายการโมเดล CI” แบบตายตัว (live เป็นแบบเลือกเปิดใช้) แต่นี่คือโมเดลที่ **แนะนำ** ให้ครอบคลุมเป็นประจำบนเครื่องพัฒนาที่มีคีย์

### ชุด smoke สมัยใหม่ (การเรียกเครื่องมือ + รูปภาพ)

นี่คือการรัน “โมเดลทั่วไป” ที่เราคาดว่าจะรักษาให้ทำงานต่อไป:

- OpenAI (ไม่ใช่ Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` และ `google/gemini-3-flash-preview` (หลีกเลี่ยงโมเดล Gemini 2.x ที่เก่ากว่า)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` และ `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` และ `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

รัน Gateway smoke พร้อมเครื่องมือ + รูปภาพ:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ฐาน: การเรียกเครื่องมือ (Read + Exec เสริม)

เลือกอย่างน้อยหนึ่งรายการต่อกลุ่มผู้ให้บริการ:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (หรือ `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

ความครอบคลุมเพิ่มเติมแบบเสริม (มีก็ดี):

- xAI: `xai/grok-4.3` (หรือรุ่นล่าสุดที่มี)
- Mistral: `mistral/`… (เลือกโมเดลที่รองรับ “เครื่องมือ” หนึ่งตัวที่คุณเปิดใช้งานไว้)
- Cerebras: `cerebras/`… (หากคุณมีสิทธิ์เข้าถึง)
- LM Studio: `lmstudio/`… (ในเครื่อง; การเรียกเครื่องมือขึ้นกับโหมด API)

### Vision: ส่งรูปภาพ (ไฟล์แนบ → ข้อความมัลติโหมด)

รวมโมเดลที่รองรับรูปภาพอย่างน้อยหนึ่งตัวไว้ใน `OPENCLAW_LIVE_GATEWAY_MODELS` (ตัวแปรของ Claude/Gemini/OpenAI ที่รองรับ vision เป็นต้น) เพื่อทดสอบ probe รูปภาพ

### Aggregators / Gateway ทางเลือก

หากคุณเปิดใช้งานคีย์ไว้ เรายังรองรับการทดสอบผ่าน:

- OpenRouter: `openrouter/...` (โมเดลหลายร้อยรายการ; ใช้ `openclaw models scan` เพื่อหาผู้สมัครที่รองรับเครื่องมือ+รูปภาพ)
- OpenCode: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go (ยืนยันตัวตนผ่าน `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

ผู้ให้บริการเพิ่มเติมที่คุณสามารถรวมไว้ในเมทริกซ์สด (หากคุณมีข้อมูลรับรอง/คอนฟิก):

- ในตัว: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- ผ่าน `models.providers` (endpoint แบบกำหนดเอง): `minimax` (cloud/API), รวมถึงพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic ใด ๆ (LM Studio, vLLM, LiteLLM เป็นต้น)

<Tip>
อย่า hardcode "all models" ในเอกสาร รายการที่เชื่อถือได้คือสิ่งที่ `discoverModels(...)` ส่งคืนบนเครื่องของคุณ รวมกับคีย์ใดก็ตามที่มีอยู่
</Tip>

## ข้อมูลรับรอง (ห้าม commit)

การทดสอบสดค้นพบข้อมูลรับรองในแบบเดียวกับที่ CLI ทำ ผลกระทบในทางปฏิบัติ:

- หาก CLI ใช้งานได้ การทดสอบจริงควรพบคีย์ชุดเดียวกัน
- หากการทดสอบจริงแจ้งว่า “ไม่มีข้อมูลรับรอง” ให้ดีบักแบบเดียวกับที่คุณดีบัก `openclaw models list` / การเลือกโมเดล

- โปรไฟล์การยืนยันตัวตนรายเอเจนต์: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (นี่คือความหมายของ “คีย์โปรไฟล์” ในการทดสอบจริง)
- การตั้งค่า: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรีสถานะดั้งเดิม: `~/.openclaw/credentials/` (จะถูกคัดลอกเข้าไปในโฮมทดสอบจริงที่จัดเตรียมไว้เมื่อมีอยู่ แต่ไม่ใช่ที่เก็บคีย์โปรไฟล์หลัก)
- การรันจริงในเครื่องจะคัดลอกการตั้งค่าที่ใช้งานอยู่, ไฟล์ `auth-profiles.json` รายเอเจนต์, `credentials/` ดั้งเดิม และไดเรกทอรีการยืนยันตัวตน CLI ภายนอกที่รองรับเข้าไปในโฮมทดสอบชั่วคราวโดยค่าเริ่มต้น; โฮมทดสอบจริงที่จัดเตรียมไว้จะข้าม `workspace/` และ `sandboxes/` และจะตัดการแทนที่พาธ `agents.*.workspace` / `agentDir` ออก เพื่อให้โพรบไม่แตะพื้นที่ทำงานจริงบนโฮสต์ของคุณ

หากคุณต้องการพึ่งพาคีย์จากสภาพแวดล้อม (เช่น ส่งออกไว้ใน `~/.profile`) ให้รันการทดสอบในเครื่องหลังจาก `source ~/.profile` หรือใช้ตัวรัน Docker ด้านล่าง (ซึ่งสามารถเมานต์ `~/.profile` เข้าไปในคอนเทนเนอร์ได้)

## Deepgram แบบใช้บริการจริง (การถอดเสียงจากเสียง)

- การทดสอบ: `extensions/deepgram/audio.live.test.ts`
- เปิดใช้งาน: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## แผนการเขียนโค้ด BytePlus แบบใช้บริการจริง

- การทดสอบ: `extensions/byteplus/live.test.ts`
- เปิดใช้งาน: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- การแทนที่โมเดลแบบไม่บังคับ: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## สื่อเวิร์กโฟลว์ ComfyUI แบบใช้บริการจริง

- การทดสอบ: `extensions/comfy/comfy.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- ขอบเขต:
  - ทดสอบเส้นทางภาพ วิดีโอ และ `music_generate` ของ comfy ที่มาพร้อมชุดเผยแพร่
  - ข้ามแต่ละความสามารถ เว้นแต่จะตั้งค่า `plugins.entries.comfy.config.<capability>` แล้ว
  - มีประโยชน์หลังจากเปลี่ยนการส่งเวิร์กโฟลว์ comfy, การโพล, การดาวน์โหลด หรือการลงทะเบียน Plugin

## การสร้างภาพแบบใช้บริการจริง

- การทดสอบ: `test/image-generation.runtime.live.test.ts`
- คำสั่ง: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ชุดทดสอบ: `pnpm test:live:media image`
- ขอบเขต:
  - ไล่ตรวจทุก Plugin ผู้ให้บริการสร้างภาพที่ลงทะเบียนไว้
  - โหลดตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ขาดจากเชลล์เข้าสู่ระบบของคุณ (`~/.profile`) ก่อนโพรบ
  - ใช้คีย์ API จริง/จากสภาพแวดล้อมก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้โดยค่าเริ่มต้น เพื่อไม่ให้คีย์ทดสอบเก่าใน `auth-profiles.json` บังข้อมูลรับรองจริงจากเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - รันผู้ให้บริการแต่ละรายที่ตั้งค่าไว้ผ่านรันไทม์สร้างภาพร่วม:
    - `<provider>:generate`
    - `<provider>:edit` เมื่อผู้ให้บริการประกาศว่ารองรับการแก้ไข
- ผู้ให้บริการที่มาพร้อมชุดเผยแพร่และครอบคลุมอยู่ในปัจจุบัน:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการแทนที่ที่มีเฉพาะสภาพแวดล้อม

สำหรับเส้นทาง CLI ที่เผยแพร่ ให้เพิ่มสโมก `infer` หลังจากการทดสอบจริงของผู้ให้บริการ/รันไทม์ผ่านแล้ว:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

สิ่งนี้ครอบคลุมการแยกวิเคราะห์อาร์กิวเมนต์ CLI, การแก้ไขการตั้งค่า/เอเจนต์เริ่มต้น, การเปิดใช้งาน Plugin ที่มาพร้อมชุดเผยแพร่, รันไทม์สร้างภาพร่วม และคำขอไปยังผู้ให้บริการจริง คาดว่าการพึ่งพาของ Plugin จะมีอยู่ก่อนโหลดรันไทม์

## การสร้างเพลงแบบใช้บริการจริง

- การทดสอบ: `extensions/music-generation-providers.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ชุดทดสอบ: `pnpm test:live:media music`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างเพลงที่มาพร้อมชุดเผยแพร่ร่วม
  - ปัจจุบันครอบคลุม Google และ MiniMax
  - โหลดตัวแปรสภาพแวดล้อมของผู้ให้บริการจากเชลล์เข้าสู่ระบบของคุณ (`~/.profile`) ก่อนโพรบ
  - ใช้คีย์ API จริง/จากสภาพแวดล้อมก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้โดยค่าเริ่มต้น เพื่อไม่ให้คีย์ทดสอบเก่าใน `auth-profiles.json` บังข้อมูลรับรองจริงจากเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - รันโหมดรันไทม์ที่ประกาศไว้ทั้งสองแบบเมื่อมี:
    - `generate` ด้วยอินพุตที่มีเฉพาะพรอมป์
    - `edit` เมื่อผู้ให้บริการประกาศ `capabilities.edit.enabled`
  - ความครอบคลุมของเลนร่วมในปัจจุบัน:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ไฟล์จริงของ Comfy แยกต่างหาก ไม่ใช่การกวาดตรวจร่วมนี้
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- พฤติกรรมการยืนยันตัวตนแบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการแทนที่ที่มีเฉพาะสภาพแวดล้อม

## การสร้างวิดีโอแบบใช้บริการจริง

- การทดสอบ: `extensions/video-generation-providers.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ชุดทดสอบ: `pnpm test:live:media video`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างวิดีโอที่มาพร้อมชุดเผยแพร่ร่วม
  - ค่าเริ่มต้นเป็นเส้นทางสโมกที่ปลอดภัยสำหรับการเผยแพร่: ผู้ให้บริการที่ไม่ใช่ FAL, คำขอข้อความเป็นวิดีโอหนึ่งรายการต่อผู้ให้บริการ, พรอมป์ล็อบสเตอร์หนึ่งวินาที และเพดานการดำเนินงานต่อผู้ให้บริการจาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` โดยค่าเริ่มต้น)
  - ข้าม FAL โดยค่าเริ่มต้น เพราะเวลาแฝงของคิวฝั่งผู้ให้บริการอาจกินเวลาการเผยแพร่มาก; ส่ง `--video-providers fal` หรือ `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` เพื่อรันอย่างชัดเจน
  - โหลดตัวแปรสภาพแวดล้อมของผู้ให้บริการจากเชลล์เข้าสู่ระบบของคุณ (`~/.profile`) ก่อนโพรบ
  - ใช้คีย์ API จริง/จากสภาพแวดล้อมก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้โดยค่าเริ่มต้น เพื่อไม่ให้คีย์ทดสอบเก่าใน `auth-profiles.json` บังข้อมูลรับรองจริงจากเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - รันเฉพาะ `generate` โดยค่าเริ่มต้น
  - ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรันโหมดแปลงที่ประกาศไว้ด้วยเมื่อมี:
    - `imageToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.imageToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตภาพในเครื่องที่มีบัฟเฟอร์หนุนหลังในการกวาดตรวจร่วม
    - `videoToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.videoToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตวิดีโอในเครื่องที่มีบัฟเฟอร์หนุนหลังในการกวาดตรวจร่วม
  - ผู้ให้บริการ `imageToVideo` ที่ประกาศไว้แต่ถูกข้ามในปัจจุบันในการกวาดตรวจร่วม:
    - `vydra` เพราะ `veo3` ที่มาพร้อมชุดเผยแพร่เป็นแบบข้อความเท่านั้น และ `kling` ที่มาพร้อมชุดเผยแพร่ต้องใช้ URL ภาพระยะไกล
  - ความครอบคลุม Vydra เฉพาะผู้ให้บริการ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ไฟล์นั้นรันข้อความเป็นวิดีโอของ `veo3` พร้อมเลน `kling` ที่ใช้ฟิกซ์เจอร์ URL ภาพระยะไกลโดยค่าเริ่มต้น
  - ความครอบคลุมจริงของ `videoToVideo` ในปัจจุบัน:
    - `runway` เท่านั้นเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`
  - ผู้ให้บริการ `videoToVideo` ที่ประกาศไว้แต่ถูกข้ามในปัจจุบันในการกวาดตรวจร่วม:
    - `alibaba`, `qwen`, `xai` เพราะเส้นทางเหล่านั้นปัจจุบันต้องใช้ URL อ้างอิง `http(s)` / MP4 ระยะไกล
    - `google` เพราะเลน Gemini/Veo ร่วมปัจจุบันใช้อินพุตในเครื่องที่มีบัฟเฟอร์หนุนหลัง และเส้นทางนั้นไม่ได้รับการยอมรับในการกวาดตรวจร่วม
    - `openai` เพราะเลนร่วมปัจจุบันไม่มีหลักประกันการเข้าถึงการอินเพนต์/รีมิกซ์วิดีโอเฉพาะองค์กร
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` เพื่อรวมผู้ให้บริการทุกตัวในการกวาดตรวจเริ่มต้น รวมถึง FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` เพื่อลดเพดานการดำเนินงานของผู้ให้บริการแต่ละรายสำหรับการรันสโมกแบบเข้มข้น
- พฤติกรรมการยืนยันตัวตนแบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการแทนที่ที่มีเฉพาะสภาพแวดล้อม

## ชุดทดสอบสื่อแบบใช้บริการจริง

- คำสั่ง: `pnpm test:live:media`
- วัตถุประสงค์:
  - รันชุดทดสอบจริงของภาพ เพลง และวิดีโอร่วมผ่านจุดเข้าใช้งานแบบเนทีฟของรีโปหนึ่งจุด
  - โหลดตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ขาดโดยอัตโนมัติจาก `~/.profile`
  - จำกัดแต่ละชุดให้เหลือผู้ให้บริการที่ปัจจุบันมีการยืนยันตัวตนที่ใช้งานได้โดยค่าเริ่มต้นโดยอัตโนมัติ
  - ใช้ `scripts/test-live.mjs` ซ้ำ ดังนั้นพฤติกรรม Heartbeat และโหมดเงียบจึงสอดคล้องกัน
- ตัวอย่าง:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing) — ชุดทดสอบหน่วย, การผสานรวม, QA และ Docker
