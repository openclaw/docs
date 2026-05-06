---
read_when:
    - การเรียกใช้การทดสอบเบื้องต้นของเมทริกซ์โมเดลแบบสด / แบ็กเอนด์ CLI / ACP / ผู้ให้บริการสื่อ
    - การดีบักการระบุข้อมูลประจำตัวสำหรับการทดสอบจริง
    - การเพิ่มการทดสอบสดเฉพาะผู้ให้บริการใหม่
sidebarTitle: Live tests
summary: 'การทดสอบจริง (ที่แตะเครือข่าย): เมทริกซ์โมเดล, แบ็กเอนด์ CLI, ACP, ผู้ให้บริการสื่อ, ข้อมูลประจำตัว'
title: 'การทดสอบ: ชุดทดสอบแบบใช้งานจริง'
x-i18n:
    generated_at: "2026-05-06T09:17:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: a17a8065fd15c6d86ab782cb1fdb00d0b2558be2d43fb7cab3ca6e511055b82e
    source_path: help/testing-live.md
    workflow: 16
---

สำหรับการเริ่มต้นอย่างรวดเร็ว, ตัวรัน QA, ชุดทดสอบ unit/integration และโฟลว์ Docker โปรดดู
[การทดสอบ](/th/help/testing) หน้านี้ครอบคลุมชุดทดสอบ **แบบสด** (ที่แตะเครือข่าย):
model matrix, แบ็กเอนด์ CLI, ACP และการทดสอบสดของผู้ให้บริการสื่อ รวมถึง
การจัดการข้อมูลรับรอง

## แบบสด: คำสั่ง smoke สำหรับโปรไฟล์ภายในเครื่อง

source `~/.profile` ก่อนตรวจสอบแบบสดเฉพาะกิจ เพื่อให้คีย์ของผู้ให้บริการและพาธเครื่องมือภายในเครื่อง
ตรงกับ shell ของคุณ:

```bash
source ~/.profile
```

smoke สื่อที่ปลอดภัย:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

smoke ความพร้อมสำหรับการโทรเสียงที่ปลอดภัย:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` เป็นการ dry run เว้นแต่จะมี `--yes` ด้วย ใช้ `--yes` เฉพาะ
เมื่อคุณตั้งใจจะวางสายแจ้งเตือนจริง สำหรับ Twilio, Telnyx และ
Plivo การตรวจสอบความพร้อมที่สำเร็จต้องใช้ URL Webhook สาธารณะ; ทางเลือกสำรองแบบ
loopback เฉพาะภายในเครื่อง/ส่วนตัวจะถูกปฏิเสธโดยตั้งใจ

## แบบสด: การ sweep ความสามารถของ Android Node

- การทดสอบ: `src/gateway/android-node.capabilities.live.test.ts`
- สคริปต์: `pnpm android:test:integration`
- เป้าหมาย: เรียกใช้ **ทุกคำสั่งที่กำลังประกาศอยู่ในปัจจุบัน** โดย Android Node ที่เชื่อมต่ออยู่ และยืนยันพฤติกรรมตามสัญญาของคำสั่ง
- ขอบเขต:
  - การตั้งค่าล่วงหน้า/แบบแมนนวล (ชุดทดสอบนี้ไม่ได้ติดตั้ง/รัน/จับคู่แอป)
  - การตรวจสอบ Gateway `node.invoke` แบบทีละคำสั่งสำหรับ Android Node ที่เลือก
- การตั้งค่าล่วงหน้าที่จำเป็น:
  - แอป Android เชื่อมต่อและจับคู่กับ Gateway แล้ว
  - คงแอปไว้ใน foreground
  - ให้สิทธิ์/ความยินยอมในการจับภาพสำหรับความสามารถที่คุณคาดว่าจะผ่าน
- การ override เป้าหมายแบบเลือกได้:
  - `OPENCLAW_ANDROID_NODE_ID` หรือ `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- รายละเอียดการตั้งค่า Android ฉบับเต็ม: [แอป Android](/th/platforms/android)

## แบบสด: model smoke (คีย์โปรไฟล์)

การทดสอบสดแบ่งเป็นสองชั้น เพื่อให้เราแยกความล้มเหลวได้:

- "Direct model" บอกเราว่าผู้ให้บริการ/model สามารถตอบได้จริงด้วยคีย์ที่ให้มา
- "Gateway smoke" บอกเราว่า pipeline gateway+agent เต็มรูปแบบทำงานกับ model นั้นได้ (sessions, history, tools, sandbox policy ฯลฯ)

### ชั้นที่ 1: Direct model completion (ไม่มี Gateway)

- การทดสอบ: `src/agents/models.profiles.live.test.ts`
- เป้าหมาย:
  - แจกแจง models ที่ค้นพบ
  - ใช้ `getApiKeyForModel` เพื่อเลือก models ที่คุณมี credentials
  - รัน completion ขนาดเล็กต่อ model (และ regression แบบเจาะจงเมื่อจำเป็น)
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- ตั้งค่า `OPENCLAW_LIVE_MODELS=modern` (หรือ `all` ซึ่งเป็น alias สำหรับ modern) เพื่อรันชุดทดสอบนี้จริง; ไม่เช่นนั้นจะข้ามเพื่อให้ `pnpm test:live` โฟกัสที่ gateway smoke
- วิธีเลือก models:
  - `OPENCLAW_LIVE_MODELS=modern` เพื่อรัน allowlist สมัยใหม่ (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` เป็น alias สำหรับ allowlist สมัยใหม่
  - หรือ `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (comma allowlist)
  - การ sweep แบบ modern/all มีค่าเริ่มต้นเป็นขีดจำกัดที่คัดสรรให้สัญญาณสูง; ตั้งค่า `OPENCLAW_LIVE_MAX_MODELS=0` สำหรับการ sweep สมัยใหม่แบบครบถ้วน หรือตัวเลขบวกสำหรับขีดจำกัดที่เล็กลง
  - การ sweep แบบครบถ้วนใช้ `OPENCLAW_LIVE_TEST_TIMEOUT_MS` สำหรับ timeout ของการทดสอบ direct-model ทั้งหมด ค่าเริ่มต้น: 60 นาที
  - โพรบ direct-model รันด้วย parallelism 20 ทางโดยค่าเริ่มต้น; ตั้งค่า `OPENCLAW_LIVE_MODEL_CONCURRENCY` เพื่อ override
- วิธีเลือกผู้ให้บริการ:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (comma allowlist)
- คีย์มาจากที่ใด:
  - โดยค่าเริ่มต้น: profile store และ env fallbacks
  - ตั้งค่า `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้เฉพาะ **profile store**
- เหตุผลที่มีสิ่งนี้:
  - แยก "provider API เสีย / คีย์ไม่ถูกต้อง" ออกจาก "gateway agent pipeline เสีย"
  - รวม regression ขนาดเล็กที่แยกขาด (ตัวอย่าง: OpenAI Responses/Codex Responses reasoning replay + โฟลว์ tool-call)

### ชั้นที่ 2: Gateway + dev agent smoke (สิ่งที่ "@openclaw" ทำจริง)

- การทดสอบ: `src/gateway/gateway-models.profiles.live.test.ts`
- เป้าหมาย:
  - เริ่ม Gateway แบบ in-process
  - สร้าง/patch session `agent:dev:*` (override model ต่อการรัน)
  - ไล่ตรวจ models-with-keys และยืนยันว่า:
    - การตอบกลับ "มีความหมาย" (ไม่มี tools)
    - การเรียกใช้ tool จริงทำงานได้ (read probe)
    - โพรบ tool เพิ่มเติมแบบเลือกได้ (exec+read probe)
    - เส้นทาง regression ของ OpenAI (tool-call-only → follow-up) ยังคงทำงาน
- รายละเอียดโพรบ (เพื่อให้คุณอธิบายความล้มเหลวได้เร็ว):
  - โพรบ `read`: การทดสอบเขียนไฟล์ nonce ใน workspace แล้วขอให้ agent `read` และ echo nonce กลับมา
  - โพรบ `exec+read`: การทดสอบขอให้ agent ใช้ `exec` เขียน nonce ลงในไฟล์ temp แล้ว `read` กลับมา
  - โพรบ image: การทดสอบแนบ PNG ที่สร้างขึ้น (cat + โค้ดแบบสุ่ม) และคาดว่า model จะส่งคืน `cat <CODE>`
  - อ้างอิงการใช้งาน: `src/gateway/gateway-models.profiles.live.test.ts` และ `src/gateway/live-image-probe.ts`
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- วิธีเลือก models:
  - ค่าเริ่มต้น: allowlist สมัยใหม่ (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` เป็น alias สำหรับ allowlist สมัยใหม่
  - หรือตั้งค่า `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (หรือรายการคั่นด้วยจุลภาค) เพื่อจำกัดขอบเขต
  - การ sweep gateway แบบ modern/all มีค่าเริ่มต้นเป็นขีดจำกัดที่คัดสรรให้สัญญาณสูง; ตั้งค่า `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` สำหรับการ sweep สมัยใหม่แบบครบถ้วน หรือตัวเลขบวกสำหรับขีดจำกัดที่เล็กลง
- วิธีเลือกผู้ให้บริการ (หลีกเลี่ยง "OpenRouter ทุกอย่าง"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (comma allowlist)
- โพรบ tool + image เปิดอยู่เสมอในการทดสอบสดนี้:
  - โพรบ `read` + โพรบ `exec+read` (ความเครียดของ tool)
  - โพรบ image รันเมื่อ model ประกาศว่ารองรับ image input
  - โฟลว์ (ระดับสูง):
    - การทดสอบสร้าง PNG ขนาดเล็กที่มี "CAT" + โค้ดสุ่ม (`src/gateway/live-image-probe.ts`)
    - ส่งผ่าน `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway แยกวิเคราะห์ attachments เป็น `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent ส่งต่อข้อความผู้ใช้แบบ multimodal ไปยัง model
    - การยืนยัน: คำตอบมี `cat` + โค้ด (ความทนทาน OCR: อนุญาตให้มีข้อผิดพลาดเล็กน้อย)

<Tip>
หากต้องการดูว่าคุณทดสอบอะไรได้บนเครื่องของคุณ (และ id `provider/model` ที่แน่นอน) ให้รัน:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## แบบสด: smoke แบ็กเอนด์ CLI (Claude, Codex, Gemini หรือ CLI ภายในเครื่องอื่น)

- การทดสอบ: `src/gateway/gateway-cli-backend.live.test.ts`
- เป้าหมาย: ตรวจสอบ pipeline Gateway + agent โดยใช้แบ็กเอนด์ CLI ภายในเครื่อง โดยไม่แตะ config เริ่มต้นของคุณ
- ค่าเริ่มต้น smoke เฉพาะแบ็กเอนด์อยู่กับคำนิยาม `cli-backend.ts` ของ extension เจ้าของ
- เปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- ค่าเริ่มต้น:
  - ผู้ให้บริการ/model เริ่มต้น: `claude-cli/claude-sonnet-4-6`
  - พฤติกรรม command/args/image มาจาก metadata ของ Plugin แบ็กเอนด์ CLI เจ้าของ
- Overrides (เลือกได้):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` เพื่อส่ง image attachment จริง (พาธจะถูก inject ลงใน prompt) สูตร Docker ปิดค่านี้โดยค่าเริ่มต้น เว้นแต่จะร้องขอโดยชัดแจ้ง
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` เพื่อส่งพาธไฟล์รูปภาพเป็น CLI args แทนการ inject ใน prompt
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (หรือ `"list"`) เพื่อควบคุมวิธีส่ง image args เมื่อตั้งค่า `IMAGE_ARG`
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` เพื่อส่ง turn ที่สองและตรวจสอบโฟลว์ resume
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` เพื่อเลือกใช้โพรบความต่อเนื่องใน session เดียวกัน Claude Sonnet -> Opus เมื่อ model ที่เลือกสนับสนุน switch target สูตร Docker ปิดค่านี้โดยค่าเริ่มต้นเพื่อความน่าเชื่อถือโดยรวม
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` เพื่อเลือกใช้โพรบ loopback ของ MCP/tool สูตร Docker ปิดค่านี้โดยค่าเริ่มต้น เว้นแต่จะร้องขอโดยชัดแจ้ง

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

สิ่งนี้ไม่ได้ขอให้ Gemini สร้างการตอบกลับ มันเขียนการตั้งค่า system แบบเดียวกับที่
OpenClaw ให้ Gemini แล้วรัน `gemini --debug mcp list` เพื่อพิสูจน์ว่า
เซิร์ฟเวอร์ `transport: "streamable-http"` ที่บันทึกไว้ถูก normalize เป็นรูปแบบ HTTP MCP ของ Gemini
และสามารถเชื่อมต่อกับเซิร์ฟเวอร์ MCP streamable-HTTP ภายในเครื่องได้

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

- ตัวรัน Docker อยู่ที่ `scripts/test-live-cli-backend-docker.sh`
- มันรัน smoke แบ็กเอนด์ CLI สดภายในอิมเมจ Docker ของ repo ในฐานะผู้ใช้ `node` ที่ไม่ใช่ root
- มัน resolve metadata smoke ของ CLI จาก extension เจ้าของ แล้วติดตั้งแพ็กเกจ Linux CLI ที่ตรงกัน (`@anthropic-ai/claude-code`, `@openai/codex` หรือ `@google/gemini-cli`) ลงใน prefix ที่เขียนได้และมี cache ที่ `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`)
- `pnpm test:docker:live-cli-backend:claude-subscription` ต้องใช้ Claude Code subscription OAuth แบบพกพา ผ่าน `~/.claude/.credentials.json` ที่มี `claudeAiOauth.subscriptionType` หรือ `CLAUDE_CODE_OAUTH_TOKEN` จาก `claude setup-token` โดยจะพิสูจน์ `claude -p` โดยตรงใน Docker ก่อน จากนั้นรัน Gateway CLI-backend สอง turn โดยไม่เก็บรักษา env vars ของ Anthropic API-key lane subscription นี้ปิดโพรบ MCP/tool และ image ของ Claude โดยค่าเริ่มต้น เพราะตอนนี้ Claude route การใช้งานแอปของบุคคลที่สามผ่านการคิดค่าบริการ extra-usage แทนขีดจำกัดของแผน subscription ปกติ
- ตอนนี้ smoke แบ็กเอนด์ CLI สดฝึกโฟลว์ end-to-end เดียวกันสำหรับ Claude, Codex และ Gemini: turn ข้อความ, turn การจำแนกรูปภาพ แล้วตามด้วยการเรียก tool MCP `cron` ที่ตรวจสอบผ่าน gateway CLI
- smoke เริ่มต้นของ Claude ยัง patch session จาก Sonnet เป็น Opus และตรวจสอบว่า session ที่ resume แล้วยังจำบันทึกก่อนหน้าได้

## แบบสด: ความสามารถในการเข้าถึง proxy APNs HTTP/2

- การทดสอบ: `src/infra/push-apns-http2.live.test.ts`
- เป้าหมาย: tunnel ผ่าน HTTP CONNECT proxy ภายในเครื่องไปยัง endpoint APNs sandbox ของ Apple, ส่งคำขอตรวจสอบ APNs HTTP/2 และยืนยันว่าการตอบกลับจริง `403 InvalidProviderToken` ของ Apple กลับมาผ่านเส้นทาง proxy
- เปิดใช้:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- timeout แบบเลือกได้:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## แบบสด: ACP bind smoke (`/acp spawn ... --bind here`)

- การทดสอบ: `src/gateway/gateway-acp-bind.live.test.ts`
- เป้าหมาย: ตรวจสอบโฟลว์การผูกการสนทนา ACP จริงกับเอเจนต์ ACP แบบไลฟ์:
  - ส่ง `/acp spawn <agent> --bind here`
  - ผูกการสนทนาช่องทางข้อความสังเคราะห์ไว้ ณ จุดเดิม
  - ส่งข้อความติดตามผลตามปกติในการสนทนาเดียวกันนั้น
  - ตรวจสอบว่าข้อความติดตามผลไปถึงทรานสคริปต์ของเซสชัน ACP ที่ถูกผูกไว้
- เปิดใช้:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- ค่าเริ่มต้น:
  - เอเจนต์ ACP ใน Docker: `claude,codex,gemini`
  - เอเจนต์ ACP สำหรับ `pnpm test:live ...` โดยตรง: `claude`
  - ช่องทางสังเคราะห์: บริบทการสนทนาแบบ Slack DM
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
  - เลนนี้ใช้พื้นผิว `chat.send` ของ Gateway พร้อมฟิลด์เส้นทางต้นทางสังเคราะห์สำหรับผู้ดูแลระบบเท่านั้น เพื่อให้การทดสอบแนบบริบทช่องทางข้อความได้โดยไม่แสร้งว่าส่งออกไปภายนอก
  - เมื่อไม่ได้ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` การทดสอบจะใช้รีจิสทรีเอเจนต์ในตัวของ Plugin `acpx` ที่ฝังไว้สำหรับเอเจนต์ฮาร์เนส ACP ที่เลือก
  - การสร้าง MCP ของ Cron สำหรับเซสชันที่ถูกผูกไว้เป็นแบบพยายามอย่างดีที่สุดโดยค่าเริ่มต้น เพราะฮาร์เนส ACP ภายนอกอาจยกเลิกการเรียก MCP หลังจากหลักฐานการผูก/รูปภาพผ่านแล้ว ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` เพื่อให้โพรบ Cron หลังการผูกเข้มงวด

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

- ตัวรัน Docker อยู่ที่ `scripts/test-live-acp-bind-docker.sh`
- โดยค่าเริ่มต้น จะรันสโมกการผูก ACP กับเอเจนต์ CLI ไลฟ์แบบรวมตามลำดับ: `claude`, `codex` แล้ว `gemini`
- ใช้ `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` หรือ `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` เพื่อจำกัดเมทริกซ์
- ระบบจะโหลดค่า `~/.profile`, เตรียมวัสดุการยืนยันตัวตนของ CLI ที่ตรงกันเข้าไปในคอนเทนเนอร์ แล้วติดตั้ง CLI ไลฟ์ที่ร้องขอ (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid ผ่าน `https://app.factory.ai/cli`, `@google/gemini-cli` หรือ `opencode-ai`) หากยังไม่มี แบ็กเอนด์ ACP เองคือแพ็กเกจ `acpx/runtime` ที่ฝังมาจาก Plugin `acpx` อย่างเป็นทางการ
- ตัวแปร Docker ของ Droid จะเตรียม `~/.factory` สำหรับการตั้งค่า ส่งต่อ `FACTORY_API_KEY` และต้องใช้คีย์ API นั้น เพราะการยืนยันตัวตน Factory OAuth/keyring ภายในเครื่องไม่สามารถย้ายเข้าไปในคอนเทนเนอร์ได้ ระบบใช้รายการรีจิสทรีในตัวของ ACPX คือ `droid exec --output-format acp`
- ตัวแปร Docker ของ OpenCode เป็นเลนรีเกรสชันเอเจนต์เดียวแบบเข้มงวด โดยเขียนโมเดลเริ่มต้น `OPENCODE_CONFIG_CONTENT` ชั่วคราวจาก `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (ค่าเริ่มต้น `opencode/kimi-k2.6`) หลังจากโหลด `~/.profile` และ `pnpm test:docker:live-acp-bind:opencode` ต้องมีทรานสคริปต์ผู้ช่วยที่ถูกผูกไว้ แทนที่จะยอมรับการข้ามหลังการผูกแบบทั่วไป
- การเรียก CLI `acpx` โดยตรงเป็นเพียงเส้นทางแบบแมนนวล/ทางเลี่ยงสำหรับเปรียบเทียบพฤติกรรมนอก Gateway เท่านั้น สโมกการผูก ACP ของ Docker ทดสอบแบ็กเอนด์รันไทม์ `acpx` ที่ฝังไว้ของ OpenClaw

## ไลฟ์: สโมกฮาร์เนส Codex app-server

- เป้าหมาย: ตรวจสอบฮาร์เนส Codex ที่ Plugin เป็นเจ้าของผ่านเมธอด `agent` ของ Gateway ตามปกติ:
  - โหลด Plugin `codex` ที่บันเดิลมา
  - เลือก `OPENCLAW_AGENT_RUNTIME=codex`
  - ส่งเทิร์นเอเจนต์ Gateway แรกไปยัง `openai/gpt-5.5` โดยบังคับใช้ฮาร์เนส Codex
  - ส่งเทิร์นที่สองไปยังเซสชัน OpenClaw เดียวกัน และตรวจสอบว่าเธรด app-server สามารถทำงานต่อได้
  - รัน `/codex status` และ `/codex models` ผ่านเส้นทางคำสั่ง Gateway เดียวกัน
  - เลือกรันโพรบเชลล์ที่ยกระดับสิทธิ์และผ่านการตรวจของ Guardian สองรายการ: คำสั่งที่ไม่เป็นอันตรายซึ่งควรได้รับอนุมัติ และการอัปโหลดความลับปลอมซึ่งควรถูกปฏิเสธเพื่อให้เอเจนต์ถามกลับ
- การทดสอบ: `src/gateway/gateway-codex-harness.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- โมเดลเริ่มต้น: `openai/gpt-5.5`
- โพรบรูปภาพแบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- โพรบ MCP/เครื่องมือแบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- โพรบ Guardian แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- สโมกใช้ `agentRuntime.id: "codex"` ดังนั้นฮาร์เนส Codex ที่เสียจะไม่สามารถผ่านได้ด้วยการถอยกลับไปใช้ PI อย่างเงียบ ๆ
- การยืนยันตัวตน: การยืนยันตัวตน app-server ของ Codex จากการเข้าสู่ระบบการสมัครสมาชิก Codex ในเครื่อง สโมก Docker ยังสามารถระบุ `OPENAI_API_KEY` สำหรับโพรบที่ไม่ใช่ Codex เมื่อเกี่ยวข้อง รวมถึงคัดลอก `~/.codex/auth.json` และ `~/.codex/config.toml` แบบเลือกได้

สูตรภายในเครื่อง:

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

- ตัวรัน Docker อยู่ที่ `scripts/test-live-codex-harness-docker.sh`
- ระบบโหลด `~/.profile` ที่เมานต์ไว้ ส่งผ่าน `OPENAI_API_KEY`, คัดลอกไฟล์ยืนยันตัวตนของ Codex CLI เมื่อมีอยู่, ติดตั้ง `@openai/codex` ลงใน prefix npm ที่เมานต์แบบเขียนได้, เตรียมซอร์สทรี แล้วรันเฉพาะการทดสอบไลฟ์ของฮาร์เนส Codex
- Docker เปิดใช้โพรบรูปภาพ, MCP/เครื่องมือ และ Guardian โดยค่าเริ่มต้น ตั้งค่า `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` หรือ `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` หรือ `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` เมื่อต้องการรันดีบักที่แคบลง
- Docker ใช้การกำหนดค่ารันไทม์ Codex แบบระบุชัดเจนเดียวกัน ดังนั้นนามแฝงเดิมหรือการถอยกลับไปใช้ PI จะไม่สามารถซ่อนรีเกรสชันของฮาร์เนส Codex ได้

### สูตรไลฟ์ที่แนะนำ

รายการอนุญาตที่แคบและระบุชัดเจนเร็วที่สุดและเกิดความไม่เสถียรน้อยที่สุด:

- โมเดลเดียว แบบตรง (ไม่ผ่าน Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- โมเดลเดียว สโมก Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การเรียกเครื่องมือข้ามผู้ให้บริการหลายราย:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- โฟกัส Google (คีย์ Gemini API + Antigravity):
  - Gemini (คีย์ API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- สโมกการคิดแบบปรับตัวของ Google:
  - หากคีย์ในเครื่องอยู่ในโปรไฟล์เชลล์: `source ~/.profile`
  - ค่าเริ่มต้นแบบไดนามิกของ Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - งบประมาณแบบไดนามิกของ Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

หมายเหตุ:

- `google/...` ใช้ Gemini API (คีย์ API)
- `google-antigravity/...` ใช้บริดจ์ Antigravity OAuth (เอนด์พอยต์เอเจนต์แบบ Cloud Code Assist)
- `google-gemini-cli/...` ใช้ Gemini CLI ภายในเครื่องของคุณ (การยืนยันตัวตนแยกต่างหาก + รายละเอียดเฉพาะของเครื่องมือ)
- Gemini API เทียบกับ Gemini CLI:
  - API: OpenClaw เรียก Gemini API ที่ Google โฮสต์ผ่าน HTTP (คีย์ API / การยืนยันตัวตนของโปรไฟล์); นี่คือสิ่งที่ผู้ใช้ส่วนใหญ่หมายถึงเมื่อพูดว่า "Gemini"
  - CLI: OpenClaw เรียกไบนารี `gemini` ภายในเครื่องผ่านเชลล์; มีการยืนยันตัวตนของตัวเองและอาจมีพฤติกรรมต่างกัน (การสตรีม/การรองรับเครื่องมือ/ความเหลื่อมของเวอร์ชัน)

## ไลฟ์: เมทริกซ์โมเดล (สิ่งที่เราครอบคลุม)

ไม่มี "รายการโมเดล CI" แบบตายตัว (ไลฟ์เป็นแบบเลือกเปิดใช้) แต่ต่อไปนี้คือโมเดลที่ **แนะนำ** ให้ครอบคลุมเป็นประจำบนเครื่องพัฒนาที่มีคีย์

### ชุดสโมกสมัยใหม่ (การเรียกเครื่องมือ + รูปภาพ)

นี่คือการรัน "โมเดลทั่วไป" ที่เราคาดว่าจะทำงานต่อไปได้:

- OpenAI (ไม่ใช่ Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` และ `google/gemini-3-flash-preview` (หลีกเลี่ยงโมเดล Gemini 2.x ที่เก่ากว่า)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` และ `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` และ `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

รันสโมก Gateway พร้อมเครื่องมือ + รูปภาพ:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### พื้นฐาน: การเรียกเครื่องมือ (Read + Exec แบบเลือกได้)

เลือกอย่างน้อยหนึ่งรายการต่อกลุ่มผู้ให้บริการ:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (หรือ `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

ความครอบคลุมเพิ่มเติมแบบเลือกได้ (มีไว้ก็ดี):

- xAI: `xai/grok-4.3` (หรือเวอร์ชันล่าสุดที่มี)
- Mistral: `mistral/`… (เลือกโมเดลหนึ่งที่รองรับ "tools" และคุณเปิดใช้ไว้)
- Cerebras: `cerebras/`… (หากคุณมีสิทธิ์เข้าถึง)
- LM Studio: `lmstudio/`… (ภายในเครื่อง; การเรียกเครื่องมือขึ้นอยู่กับโหมด API)

### วิชัน: การส่งรูปภาพ (ไฟล์แนบ → ข้อความมัลติโมดัล)

รวมโมเดลที่รองรับรูปภาพอย่างน้อยหนึ่งรายการใน `OPENCLAW_LIVE_GATEWAY_MODELS` (ตัวแปร Claude/Gemini/OpenAI ที่รองรับวิชัน เป็นต้น) เพื่อทดสอบโพรบรูปภาพ

### ตัวรวบรวม / Gateway ทางเลือก

หากคุณเปิดใช้คีย์ไว้ เรายังรองรับการทดสอบผ่าน:

- OpenRouter: `openrouter/...` (มีหลายร้อยโมเดล; ใช้ `openclaw models scan` เพื่อค้นหาตัวเลือกที่รองรับเครื่องมือ+รูปภาพ)
- OpenCode: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go (ยืนยันตัวตนผ่าน `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

ผู้ให้บริการเพิ่มเติมที่คุณสามารถใส่ในเมทริกซ์ไลฟ์ได้ (หากคุณมีข้อมูลลับ/การกำหนดค่า):

- ในตัว: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- ผ่าน `models.providers` (เอนด์พอยต์กำหนดเอง): `minimax` (คลาวด์/API) รวมถึงพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic ใด ๆ (LM Studio, vLLM, LiteLLM เป็นต้น)

<Tip>
อย่าฮาร์ดโค้ด "โมเดลทั้งหมด" ในเอกสาร รายการที่ถือเป็นแหล่งอ้างอิงคือสิ่งที่ `discoverModels(...)` คืนค่าบนเครื่องของคุณ รวมถึงคีย์ที่มีอยู่
</Tip>

## ข้อมูลลับ (ห้ามคอมมิต)

การทดสอบไลฟ์ค้นหาข้อมูลลับด้วยวิธีเดียวกับที่ CLI ใช้ ผลทางปฏิบัติคือ:

- หาก CLI ใช้งานได้ การทดสอบไลฟ์ควรพบคีย์เดียวกัน
- หากการทดสอบไลฟ์บอกว่า "no creds" ให้ดีบักแบบเดียวกับที่คุณดีบัก `openclaw models list` / การเลือกโมเดล

- โปรไฟล์การยืนยันตัวตนรายเอเจนต์: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (นี่คือความหมายของ "profile keys" ในการทดสอบจริง)
- การกำหนดค่า: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรีสถานะดั้งเดิม: `~/.openclaw/credentials/` (คัดลอกเข้าไปในโฮมสำหรับทดสอบจริงที่จัดเตรียมไว้เมื่อมีอยู่ แต่ไม่ใช่ที่เก็บคีย์โปรไฟล์หลัก)
- การรันจริงในเครื่องจะคัดลอกการกำหนดค่าที่ใช้งานอยู่, ไฟล์ `auth-profiles.json` รายเอเจนต์, `credentials/` ดั้งเดิม และไดเรกทอรีการยืนยันตัวตนของ CLI ภายนอกที่รองรับ เข้าไปในโฮมทดสอบชั่วคราวโดยค่าเริ่มต้น; โฮมสำหรับทดสอบจริงที่จัดเตรียมไว้จะข้าม `workspace/` และ `sandboxes/` และจะตัดการแทนที่พาธ `agents.*.workspace` / `agentDir` ออก เพื่อให้โพรบไม่แตะเวิร์กสเปซจริงบนโฮสต์ของคุณ

หากคุณต้องการพึ่งพาคีย์จากสภาพแวดล้อม (เช่น ส่งออกไว้ใน `~/.profile` ของคุณ) ให้รันการทดสอบในเครื่องหลังจาก `source ~/.profile` หรือใช้ตัวรัน Docker ด้านล่าง (ตัวรันเหล่านี้สามารถเมานต์ `~/.profile` เข้าไปในคอนเทนเนอร์ได้)

## Deepgram แบบใช้งานจริง (การถอดเสียงจากเสียง)

- การทดสอบ: `extensions/deepgram/audio.live.test.ts`
- เปิดใช้: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## แผนการเขียนโค้ด BytePlus แบบใช้งานจริง

- การทดสอบ: `extensions/byteplus/live.test.ts`
- เปิดใช้: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- การแทนที่โมเดลแบบไม่บังคับ: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## สื่อเวิร์กโฟลว์ ComfyUI แบบใช้งานจริง

- การทดสอบ: `extensions/comfy/comfy.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- ขอบเขต:
  - ทดสอบพาธภาพ วิดีโอ และ `music_generate` ของ comfy ที่บันเดิลมา
  - ข้ามแต่ละความสามารถ เว้นแต่มีการกำหนดค่า `plugins.entries.comfy.config.<capability>`
  - มีประโยชน์หลังจากเปลี่ยนการส่งเวิร์กโฟลว์ comfy, การโพล, การดาวน์โหลด หรือการลงทะเบียน Plugin

## การสร้างภาพแบบใช้งานจริง

- การทดสอบ: `test/image-generation.runtime.live.test.ts`
- คำสั่ง: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ชุดทดสอบ: `pnpm test:live:media image`
- ขอบเขต:
  - แจกแจง Plugin ผู้ให้บริการสร้างภาพที่ลงทะเบียนไว้ทุกตัว
  - โหลดตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ขาดหายจากเชลล์ล็อกอินของคุณ (`~/.profile`) ก่อนโพรบ
  - ใช้คีย์ API แบบใช้งานจริง/จากสภาพแวดล้อมก่อนโปรไฟล์การยืนยันตัวตนที่เก็บไว้โดยค่าเริ่มต้น ดังนั้นคีย์ทดสอบเก่าใน `auth-profiles.json` จะไม่บดบังข้อมูลประจำตัวจริงในเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - รันผู้ให้บริการแต่ละรายที่กำหนดค่าไว้ผ่านรันไทม์การสร้างภาพที่ใช้ร่วมกัน:
    - `<provider>:generate`
    - `<provider>:edit` เมื่อผู้ให้บริการประกาศว่ารองรับการแก้ไข
- ผู้ให้บริการที่บันเดิลมาปัจจุบันซึ่งครอบคลุม:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการแทนที่ที่มาจากสภาพแวดล้อมเท่านั้น

สำหรับพาธ CLI ที่จัดส่ง ให้เพิ่มการทดสอบควัน `infer` หลังจากการทดสอบจริงของผู้ให้บริการ/รันไทม์ผ่านแล้ว:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

ส่วนนี้ครอบคลุมการแยกวิเคราะห์อาร์กิวเมนต์ของ CLI, การแปลงค่าการกำหนดค่า/เอเจนต์เริ่มต้น, การเปิดใช้งาน Plugin ที่บันเดิลมา, รันไทม์การสร้างภาพที่ใช้ร่วมกัน และคำขอจริงไปยังผู้ให้บริการ คาดว่าการพึ่งพาของ Plugin จะมีอยู่ก่อนโหลดรันไทม์

## การสร้างเพลงแบบใช้งานจริง

- การทดสอบ: `extensions/music-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ชุดทดสอบ: `pnpm test:live:media music`
- ขอบเขต:
  - ทดสอบพาธผู้ให้บริการสร้างเพลงที่บันเดิลมาและใช้ร่วมกัน
  - ปัจจุบันครอบคลุม Google และ MiniMax
  - โหลดตัวแปรสภาพแวดล้อมของผู้ให้บริการจากเชลล์ล็อกอินของคุณ (`~/.profile`) ก่อนโพรบ
  - ใช้คีย์ API แบบใช้งานจริง/จากสภาพแวดล้อมก่อนโปรไฟล์การยืนยันตัวตนที่เก็บไว้โดยค่าเริ่มต้น ดังนั้นคีย์ทดสอบเก่าใน `auth-profiles.json` จะไม่บดบังข้อมูลประจำตัวจริงในเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - รันโหมดรันไทม์ที่ประกาศไว้ทั้งสองโหมดเมื่อพร้อมใช้งาน:
    - `generate` ด้วยอินพุตที่มีเฉพาะพรอมต์
    - `edit` เมื่อผู้ให้บริการประกาศ `capabilities.edit.enabled`
  - ความครอบคลุมของเลนที่ใช้ร่วมกันปัจจุบัน:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ไฟล์ Comfy แบบใช้งานจริงแยกต่างหาก ไม่ใช่การกวาดแบบใช้ร่วมกันนี้
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- พฤติกรรมการยืนยันตัวตนแบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการแทนที่ที่มาจากสภาพแวดล้อมเท่านั้น

## การสร้างวิดีโอแบบใช้งานจริง

- การทดสอบ: `extensions/video-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ชุดทดสอบ: `pnpm test:live:media video`
- ขอบเขต:
  - ทดสอบพาธผู้ให้บริการสร้างวิดีโอที่บันเดิลมาและใช้ร่วมกัน
  - ค่าเริ่มต้นคือพาธทดสอบควันที่ปลอดภัยสำหรับรีลีส: ผู้ให้บริการที่ไม่ใช่ FAL, คำขอ text-to-video หนึ่งรายการต่อผู้ให้บริการ, พรอมต์กุ้งล็อบสเตอร์หนึ่งวินาที และขีดจำกัดการดำเนินการต่อผู้ให้บริการจาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` โดยค่าเริ่มต้น)
  - ข้าม FAL โดยค่าเริ่มต้นเพราะเวลาแฝงของคิวฝั่งผู้ให้บริการอาจครอบงำเวลารีลีส; ส่ง `--video-providers fal` หรือ `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` เพื่อรันอย่างชัดเจน
  - โหลดตัวแปรสภาพแวดล้อมของผู้ให้บริการจากเชลล์ล็อกอินของคุณ (`~/.profile`) ก่อนโพรบ
  - ใช้คีย์ API แบบใช้งานจริง/จากสภาพแวดล้อมก่อนโปรไฟล์การยืนยันตัวตนที่เก็บไว้โดยค่าเริ่มต้น ดังนั้นคีย์ทดสอบเก่าใน `auth-profiles.json` จะไม่บดบังข้อมูลประจำตัวจริงในเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - รันเฉพาะ `generate` โดยค่าเริ่มต้น
  - ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรันโหมดแปลงที่ประกาศไว้ด้วยเมื่อพร้อมใช้งาน:
    - `imageToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.imageToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตภาพในเครื่องที่หนุนด้วยบัฟเฟอร์ในการกวาดแบบใช้ร่วมกัน
    - `videoToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.videoToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตวิดีโอในเครื่องที่หนุนด้วยบัฟเฟอร์ในการกวาดแบบใช้ร่วมกัน
  - ผู้ให้บริการ `imageToVideo` ที่ประกาศไว้แต่ถูกข้ามในปัจจุบันในการกวาดแบบใช้ร่วมกัน:
    - `vydra` เพราะ `veo3` ที่บันเดิลมาเป็นข้อความอย่างเดียว และ `kling` ที่บันเดิลมาต้องใช้ URL ภาพระยะไกล
  - ความครอบคลุมเฉพาะผู้ให้บริการ Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ไฟล์นั้นรัน text-to-video ของ `veo3` รวมถึงเลน `kling` ที่ใช้ฟิกซ์เจอร์ URL ภาพระยะไกลโดยค่าเริ่มต้น
  - ความครอบคลุม `videoToVideo` แบบใช้งานจริงปัจจุบัน:
    - `runway` เฉพาะเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`
  - ผู้ให้บริการ `videoToVideo` ที่ประกาศไว้แต่ถูกข้ามในปัจจุบันในการกวาดแบบใช้ร่วมกัน:
    - `alibaba`, `qwen`, `xai` เพราะพาธเหล่านั้นปัจจุบันต้องใช้ URL อ้างอิง `http(s)` / MP4 ระยะไกล
    - `google` เพราะเลน Gemini/Veo ที่ใช้ร่วมกันปัจจุบันใช้อินพุตที่หนุนด้วยบัฟเฟอร์ในเครื่อง และพาธนั้นไม่ได้รับการยอมรับในการกวาดแบบใช้ร่วมกัน
    - `openai` เพราะเลนที่ใช้ร่วมกันปัจจุบันไม่มีการรับประกันการเข้าถึงวิดีโอ inpaint/remix เฉพาะองค์กร
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` เพื่อรวมผู้ให้บริการทุกตัวในการกวาดเริ่มต้น รวมถึง FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` เพื่อลดขีดจำกัดการดำเนินการของแต่ละผู้ให้บริการสำหรับการรันทดสอบควันแบบเข้มงวด
- พฤติกรรมการยืนยันตัวตนแบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการแทนที่ที่มาจากสภาพแวดล้อมเท่านั้น

## ชุดทดสอบสื่อแบบใช้งานจริง

- คำสั่ง: `pnpm test:live:media`
- วัตถุประสงค์:
  - รันชุดทดสอบจริงของภาพ เพลง และวิดีโอที่ใช้ร่วมกันผ่านจุดเข้าใช้งานแบบเนทีฟของรีโปเพียงจุดเดียว
  - โหลดตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ขาดหายจาก `~/.profile` โดยอัตโนมัติ
  - จำกัดขอบเขตแต่ละชุดให้เหลือผู้ให้บริการที่ปัจจุบันมีการยืนยันตัวตนที่ใช้งานได้โดยอัตโนมัติตามค่าเริ่มต้น
  - ใช้ `scripts/test-live.mjs` ซ้ำ เพื่อให้พฤติกรรม Heartbeat และโหมดเงียบยังคงสอดคล้องกัน
- ตัวอย่าง:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing) - ชุดทดสอบหน่วย, การผสานรวม, QA และ Docker
