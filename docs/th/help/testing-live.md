---
read_when:
    - การรันการทดสอบเบื้องต้นสำหรับเมทริกซ์โมเดลสด / แบ็กเอนด์ CLI / ACP / media-provider
    - การดีบักการระบุข้อมูลรับรองสำหรับการทดสอบสด
    - การเพิ่มการทดสอบสดเฉพาะผู้ให้บริการใหม่
sidebarTitle: Live tests
summary: 'การทดสอบแบบใช้งานจริง (ที่มีการติดต่อเครือข่าย): เมทริกซ์โมเดล, แบ็กเอนด์ CLI, ACP, ผู้ให้บริการสื่อ, ข้อมูลประจำตัว'
title: 'การทดสอบ: ชุดทดสอบแบบใช้งานจริง'
x-i18n:
    generated_at: "2026-05-04T18:24:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03b8ca6348137a55c8d5f67c9c166a130a75a744f6a433cb00496756b29d7016
    source_path: help/testing-live.md
    workflow: 16
---

สำหรับ quick start, ตัวรัน QA, ชุดทดสอบ unit/integration และโฟลว์ Docker โปรดดู
[การทดสอบ](/th/help/testing) หน้านี้ครอบคลุมชุดทดสอบ **live** (ที่แตะเครือข่าย):
เมทริกซ์โมเดล, แบ็กเอนด์ CLI, ACP และการทดสอบ live ของ media-provider รวมถึง
การจัดการข้อมูลรับรอง

## Live: คำสั่ง smoke สำหรับโปรไฟล์ภายในเครื่อง

Source `~/.profile` ก่อนการตรวจ live แบบ ad hoc เพื่อให้คีย์ผู้ให้บริการและพาธเครื่องมือภายในเครื่อง
ตรงกับเชลล์ของคุณ:

```bash
source ~/.profile
```

Smoke สื่อที่ปลอดภัย:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke ความพร้อมของสายสนทนาด้วยเสียงที่ปลอดภัย:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` เป็นการ dry run เว้นแต่จะมี `--yes` อยู่ด้วย ใช้ `--yes` เฉพาะ
เมื่อคุณตั้งใจจะโทรแจ้งเตือนจริงเท่านั้น สำหรับ Twilio, Telnyx และ
Plivo การตรวจความพร้อมที่สำเร็จต้องใช้ Webhook URL สาธารณะ; fallback แบบ local-only
loopback/private จะถูกปฏิเสธโดยตั้งใจ

## Live: การกวาดความสามารถของ Android Node

- การทดสอบ: `src/gateway/android-node.capabilities.live.test.ts`
- สคริปต์: `pnpm android:test:integration`
- เป้าหมาย: เรียกใช้ **ทุกคำสั่งที่ประกาศไว้ในปัจจุบัน** โดย Android Node ที่เชื่อมต่ออยู่ และยืนยันพฤติกรรมตามสัญญาของคำสั่ง
- ขอบเขต:
  - การตั้งค่าล่วงหน้า/แบบแมนนวล (ชุดทดสอบนี้ไม่ติดตั้ง/รัน/จับคู่แอป)
  - การตรวจสอบ gateway `node.invoke` แบบทีละคำสั่งสำหรับ Android Node ที่เลือก
- การตั้งค่าล่วงหน้าที่จำเป็น:
  - แอป Android เชื่อมต่อและจับคู่กับ gateway แล้ว
  - เปิดแอปไว้ใน foreground
  - ให้สิทธิ์/ยินยอมการจับภาพแล้วสำหรับความสามารถที่คุณคาดว่าจะผ่าน
- การ override เป้าหมายแบบไม่บังคับ:
  - `OPENCLAW_ANDROID_NODE_ID` หรือ `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- รายละเอียดการตั้งค่า Android ทั้งหมด: [แอป Android](/th/platforms/android)

## Live: smoke โมเดล (คีย์โปรไฟล์)

การทดสอบ Live แบ่งเป็นสองชั้นเพื่อให้เราแยกความล้มเหลวได้:

- “Direct model” บอกเราว่าผู้ให้บริการ/โมเดลสามารถตอบได้จริงด้วยคีย์ที่ให้มา
- “Gateway smoke” บอกเราว่า pipeline gateway+agent แบบเต็มทำงานสำหรับโมเดลนั้น (sessions, history, tools, sandbox policy ฯลฯ)

### ชั้นที่ 1: Direct model completion (ไม่มี gateway)

- การทดสอบ: `src/agents/models.profiles.live.test.ts`
- เป้าหมาย:
  - แจกแจงโมเดลที่ค้นพบ
  - ใช้ `getApiKeyForModel` เพื่อเลือกโมเดลที่คุณมีข้อมูลรับรอง
  - รัน completion ขนาดเล็กต่อโมเดล (และ regression เฉพาะจุดเมื่อจำเป็น)
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- ตั้งค่า `OPENCLAW_LIVE_MODELS=modern` (หรือ `all` ซึ่งเป็น alias สำหรับ modern) เพื่อรันชุดทดสอบนี้จริง มิฉะนั้นจะข้ามเพื่อให้ `pnpm test:live` โฟกัสที่ gateway smoke
- วิธีเลือกโมเดล:
  - `OPENCLAW_LIVE_MODELS=modern` เพื่อรัน allowlist สมัยใหม่ (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` เป็น alias สำหรับ allowlist สมัยใหม่
  - หรือ `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (comma allowlist)
  - การกวาดแบบ modern/all มีค่าเริ่มต้นเป็นเพดาน curated ที่ให้สัญญาณสูง; ตั้งค่า `OPENCLAW_LIVE_MAX_MODELS=0` สำหรับการกวาด modern แบบครอบคลุมทั้งหมด หรือใช้จำนวนบวกสำหรับเพดานที่เล็กลง
  - การกวาดแบบครอบคลุมทั้งหมดใช้ `OPENCLAW_LIVE_TEST_TIMEOUT_MS` เป็น timeout ของการทดสอบ direct-model ทั้งหมด ค่าเริ่มต้น: 60 นาที
  - probe แบบ direct-model รันด้วย parallelism 20 ทางเป็นค่าเริ่มต้น; ตั้งค่า `OPENCLAW_LIVE_MODEL_CONCURRENCY` เพื่อ override
- วิธีเลือกผู้ให้บริการ:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (comma allowlist)
- คีย์มาจากที่ใด:
  - ค่าเริ่มต้น: profile store และ env fallback
  - ตั้งค่า `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้เฉพาะ **profile store**
- เหตุผลที่มีสิ่งนี้:
  - แยก “provider API เสีย / คีย์ไม่ถูกต้อง” ออกจาก “gateway agent pipeline เสีย”
  - มี regression ขนาดเล็กและแยกส่วน (ตัวอย่าง: OpenAI Responses/Codex Responses reasoning replay + โฟลว์ tool-call)

### ชั้นที่ 2: Gateway + dev agent smoke (สิ่งที่ "@openclaw" ทำจริง)

- การทดสอบ: `src/gateway/gateway-models.profiles.live.test.ts`
- เป้าหมาย:
  - เปิด gateway แบบ in-process
  - สร้าง/patch session `agent:dev:*` (override โมเดลต่อการรัน)
  - วนผ่าน models-with-keys และยืนยันว่า:
    - การตอบสนอง “มีความหมาย” (ไม่มี tools)
    - การเรียก tool จริงทำงาน (read probe)
    - probe tool เพิ่มเติมแบบไม่บังคับ (exec+read probe)
    - พาธ regression ของ OpenAI (tool-call-only → follow-up) ยังทำงาน
- รายละเอียด probe (เพื่อให้คุณอธิบายความล้มเหลวได้เร็ว):
  - `read` probe: การทดสอบเขียนไฟล์ nonce ใน workspace และขอให้ agent `read` ไฟล์นั้นและ echo nonce กลับมา
  - `exec+read` probe: การทดสอบขอให้ agent ใช้ `exec` เขียน nonce ลงในไฟล์ชั่วคราว แล้ว `read` กลับมา
  - image probe: การทดสอบแนบ PNG ที่สร้างขึ้น (cat + โค้ดสุ่ม) และคาดว่าโมเดลจะคืนค่า `cat <CODE>`
  - อ้างอิงการใช้งาน: `src/gateway/gateway-models.profiles.live.test.ts` และ `src/gateway/live-image-probe.ts`
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- วิธีเลือกโมเดล:
  - ค่าเริ่มต้น: allowlist สมัยใหม่ (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` เป็น alias สำหรับ allowlist สมัยใหม่
  - หรือตั้งค่า `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (หรือรายการคั่นด้วยจุลภาค) เพื่อจำกัดขอบเขต
  - การกวาด gateway แบบ modern/all มีค่าเริ่มต้นเป็นเพดาน curated ที่ให้สัญญาณสูง; ตั้งค่า `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` สำหรับการกวาด modern แบบครอบคลุมทั้งหมด หรือใช้จำนวนบวกสำหรับเพดานที่เล็กลง
- วิธีเลือกผู้ให้บริการ (หลีกเลี่ยง “OpenRouter everything”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (comma allowlist)
- Tool + image probes เปิดอยู่เสมอในการทดสอบ live นี้:
  - `read` probe + `exec+read` probe (tool stress)
  - image probe จะรันเมื่อโมเดลประกาศว่ารองรับอินพุตรูปภาพ
  - โฟลว์ (ระดับสูง):
    - การทดสอบสร้าง PNG ขนาดเล็กที่มี “CAT” + โค้ดสุ่ม (`src/gateway/live-image-probe.ts`)
    - ส่งผ่าน `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway แยกวิเคราะห์ attachments เป็น `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent ส่งต่อข้อความผู้ใช้แบบ multimodal ไปยังโมเดล
    - Assertion: คำตอบมี `cat` + โค้ด (ความทนทาน OCR: อนุญาตข้อผิดพลาดเล็กน้อย)

<Tip>
หากต้องการดูว่าคุณทดสอบอะไรได้บนเครื่องของคุณ (และ id `provider/model` ที่แน่นอน) ให้รัน:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke แบ็กเอนด์ CLI (Claude, Codex, Gemini หรือ CLI ภายในเครื่องอื่น)

- การทดสอบ: `src/gateway/gateway-cli-backend.live.test.ts`
- เป้าหมาย: ตรวจสอบ pipeline Gateway + agent โดยใช้แบ็กเอนด์ CLI ภายในเครื่อง โดยไม่แตะ config เริ่มต้นของคุณ
- ค่าเริ่มต้นของ smoke เฉพาะแบ็กเอนด์อยู่กับ definition `cli-backend.ts` ของ Plugin เจ้าของ
- เปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- ค่าเริ่มต้น:
  - ผู้ให้บริการ/โมเดลเริ่มต้น: `claude-cli/claude-sonnet-4-6`
  - พฤติกรรม command/args/image มาจาก metadata ของ Plugin แบ็กเอนด์ CLI เจ้าของ
- Override (ไม่บังคับ):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` เพื่อส่ง attachment รูปภาพจริง (พาธจะถูก inject เข้าไปใน prompt) สูตร Docker ปิดค่านี้เป็นค่าเริ่มต้นเว้นแต่จะร้องขออย่างชัดเจน
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` เพื่อส่งพาธไฟล์รูปภาพเป็น CLI args แทนการ inject ใน prompt
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (หรือ `"list"`) เพื่อควบคุมวิธีส่ง image args เมื่อมีการตั้งค่า `IMAGE_ARG`
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` เพื่อส่ง turn ที่สองและตรวจสอบโฟลว์ resume
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` เพื่อเลือกใช้ probe ความต่อเนื่องใน session เดียวกัน Claude Sonnet -> Opus เมื่อโมเดลที่เลือก รองรับเป้าหมายการสลับ สูตร Docker ปิดค่านี้เป็นค่าเริ่มต้นเพื่อความเสถียรโดยรวม
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` เพื่อเลือกใช้ probe MCP/tool loopback สูตร Docker ปิดค่านี้เป็นค่าเริ่มต้นเว้นแต่จะร้องขออย่างชัดเจน

ตัวอย่าง:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke config Gemini MCP ราคาถูก:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

สิ่งนี้ไม่ได้ขอให้ Gemini สร้างคำตอบ แต่เขียนการตั้งค่า system เดียวกับที่
OpenClaw ให้ Gemini จากนั้นรัน `gemini --debug mcp list` เพื่อพิสูจน์ว่า
server `transport: "streamable-http"` ที่บันทึกไว้ถูก normalize เป็นรูปแบบ HTTP MCP
ของ Gemini และเชื่อมต่อกับ server MCP แบบ streamable-HTTP ภายในเครื่องได้

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
- `pnpm test:docker:live-cli-backend:claude-subscription` ต้องใช้ OAuth สำหรับ subscription Claude Code แบบพกพาผ่าน `~/.claude/.credentials.json` ที่มี `claudeAiOauth.subscriptionType` หรือ `CLAUDE_CODE_OAUTH_TOKEN` จาก `claude setup-token` โดยจะพิสูจน์ `claude -p` โดยตรงใน Docker ก่อน จากนั้นรันสอง turn ของแบ็กเอนด์ CLI ของ Gateway โดยไม่เก็บ env vars ของ Anthropic API-key โหมด subscription นี้ปิด probe Claude MCP/tool และ image เป็นค่าเริ่มต้น เพราะปัจจุบัน Claude route การใช้งานแอป third-party ผ่านการคิดค่าใช้งานเพิ่มเติม แทนขีดจำกัดแพ็กเกจ subscription ปกติ
- ตอนนี้ smoke แบ็กเอนด์ CLI แบบ live ใช้โฟลว์ end-to-end เดียวกันสำหรับ Claude, Codex และ Gemini: text turn, image classification turn แล้วจึงเรียก tool MCP `cron` ที่ตรวจสอบผ่าน gateway CLI
- smoke เริ่มต้นของ Claude ยัง patch session จาก Sonnet เป็น Opus และตรวจสอบว่า session ที่ resume แล้วยังจำ note ก่อนหน้าได้

## Live: ความสามารถในการเข้าถึงพร็อกซี APNs HTTP/2

- การทดสอบ: `src/infra/push-apns-http2.live.test.ts`
- เป้าหมาย: tunnel ผ่านพร็อกซี HTTP CONNECT ภายในเครื่องไปยัง endpoint APNs sandbox ของ Apple, ส่งคำขอตรวจสอบ APNs HTTP/2 และยืนยันว่าการตอบกลับจริง `403 InvalidProviderToken` ของ Apple กลับมาผ่านพาธพร็อกซี
- เปิดใช้:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Timeout แบบไม่บังคับ:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: smoke การ bind ACP (`/acp spawn ... --bind here`)

- การทดสอบ: `src/gateway/gateway-acp-bind.live.test.ts`
- เป้าหมาย: ตรวจสอบโฟลว์ bind บทสนทนา ACP จริงกับเอเจนต์ ACP แบบ live:
  - ส่ง `/acp spawn <agent> --bind here`
  - bind บทสนทนาช่องทางข้อความสังเคราะห์ไว้ที่เดิม
  - ส่งการติดตามผลปกติในบทสนทนาเดียวกันนั้น
  - ตรวจสอบว่าการติดตามผลเข้าไปอยู่ในทรานสคริปต์ของเซสชัน ACP ที่ถูก bind แล้ว
- เปิดใช้งาน:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- ค่าเริ่มต้น:
  - เอเจนต์ ACP ใน Docker: `claude,codex,gemini`
  - เอเจนต์ ACP สำหรับ `pnpm test:live ...` โดยตรง: `claude`
  - ช่องทางสังเคราะห์: บริบทบทสนทนาแบบ Slack DM
  - แบ็กเอนด์ ACP: `acpx`
- การ override:
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
  - เลนนี้ใช้พื้นผิว `chat.send` ของ gateway พร้อมฟิลด์ originating-route สังเคราะห์แบบ admin-only เพื่อให้การทดสอบแนบบริบทช่องทางข้อความได้โดยไม่ต้องแสร้งว่าส่งออกไปภายนอกจริง
  - เมื่อไม่ได้ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` การทดสอบจะใช้รีจิสทรีเอเจนต์ในตัวของ Plugin `acpx` แบบฝังตัวสำหรับเอเจนต์ harness ACP ที่เลือกไว้
  - การสร้าง MCP ของ Cron เซสชันที่ถูก bind เป็นแบบพยายามให้ดีที่สุดโดยค่าเริ่มต้น เพราะ harness ACP ภายนอกอาจยกเลิกการเรียก MCP หลังจาก proof ของการ bind/ภาพผ่านแล้ว ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` เพื่อทำให้ probe Cron หลัง bind นั้นเข้มงวด

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

- Docker runner อยู่ที่ `scripts/test-live-acp-bind-docker.sh`
- โดยค่าเริ่มต้น จะรัน ACP bind smoke กับเอเจนต์ CLI แบบ live รวมตามลำดับ: `claude`, `codex` แล้วจึง `gemini`
- ใช้ `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` หรือ `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` เพื่อจำกัดเมทริกซ์ให้แคบลง
- จะ source `~/.profile`, เตรียม auth material ของ CLI ที่ตรงกันลงในคอนเทนเนอร์ แล้วติดตั้ง CLI แบบ live ที่ร้องขอ (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid ผ่าน `https://app.factory.ai/cli`, `@google/gemini-cli` หรือ `opencode-ai`) หากยังไม่มี แบ็กเอนด์ ACP เองคือแพ็กเกจ `acpx/runtime` แบบฝังตัวจาก Plugin `acpx` อย่างเป็นทางการ
- ตัวแปร Docker ของ Droid จะเตรียม `~/.factory` สำหรับการตั้งค่า, ส่งต่อ `FACTORY_API_KEY` และต้องมี API key นั้น เพราะ auth แบบ Factory OAuth/keyring ในเครื่องไม่สามารถพกพาเข้าไปในคอนเทนเนอร์ได้ โดยใช้รายการรีจิสทรีในตัวของ ACPX คือ `droid exec --output-format acp`
- ตัวแปร Docker ของ OpenCode เป็นเลน regression เอเจนต์เดียวแบบเข้มงวด โดยจะเขียนโมเดลเริ่มต้นชั่วคราว `OPENCODE_CONFIG_CONTENT` จาก `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (ค่าเริ่มต้น `opencode/kimi-k2.6`) หลังจาก source `~/.profile` และ `pnpm test:docker:live-acp-bind:opencode` ต้องมีทรานสคริปต์ผู้ช่วยที่ถูก bind แทนการยอมรับการข้ามหลัง bind แบบทั่วไป
- การเรียก CLI `acpx` โดยตรงเป็นเพียงเส้นทาง manual/workaround สำหรับเปรียบเทียบพฤติกรรมนอก Gateway เท่านั้น ACP bind smoke ของ Docker ทดสอบแบ็กเอนด์ runtime `acpx` แบบฝังตัวของ OpenClaw

## Live: Codex app-server harness smoke

- เป้าหมาย: ตรวจสอบ harness Codex ที่ Plugin เป็นเจ้าของผ่านเมธอด `agent` ของ gateway ปกติ:
  - โหลด Plugin `codex` ที่ bundled มา
  - เลือก `OPENCLAW_AGENT_RUNTIME=codex`
  - ส่งเทิร์นแรกของเอเจนต์ gateway ไปยัง `openai/gpt-5.5` โดยบังคับใช้ harness Codex
  - ส่งเทิร์นที่สองไปยังเซสชัน OpenClaw เดิมและตรวจสอบว่า thread ของ app-server สามารถ resume ได้
  - รัน `/codex status` และ `/codex models` ผ่านเส้นทางคำสั่ง gateway เดียวกัน
  - เลือกรัน probe shell แบบ escalated ที่ผ่านการตรวจสอบโดย Guardian สองรายการ: คำสั่งที่ไม่เป็นอันตรายซึ่งควรถูกอนุมัติ และการอัปโหลด fake-secret ที่ควรถูกปฏิเสธเพื่อให้เอเจนต์ถามกลับ
- การทดสอบ: `src/gateway/gateway-codex-harness.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- โมเดลเริ่มต้น: `openai/gpt-5.5`
- probe รูปภาพแบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- probe MCP/tool แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- probe Guardian แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke ใช้ `agentRuntime.id: "codex"` เพื่อให้ harness Codex ที่เสียไม่สามารถผ่านได้โดยเงียบ ๆ ด้วยการ fallback ไปยัง PI
- Auth: auth ของ Codex app-server จากการเข้าสู่ระบบ subscription ของ Codex ในเครื่อง Docker smokes ยังสามารถให้ `OPENAI_API_KEY` สำหรับ probe ที่ไม่ใช่ Codex เมื่อเกี่ยวข้อง รวมถึงคัดลอก `~/.codex/auth.json` และ `~/.codex/config.toml` แบบเลือกได้

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
- จะ source `~/.profile` ที่ mount ไว้, ส่งผ่าน `OPENAI_API_KEY`, คัดลอกไฟล์ auth ของ Codex CLI เมื่อมี, ติดตั้ง `@openai/codex` ลงใน npm prefix ที่ mount แบบเขียนได้, เตรียม source tree แล้วรันเฉพาะการทดสอบ live ของ Codex-harness
- Docker เปิดใช้ probe รูปภาพ, MCP/tool และ Guardian โดยค่าเริ่มต้น ตั้งค่า `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` หรือ `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` หรือ `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` เมื่อคุณต้องการรัน debug ที่แคบลง
- Docker ใช้การตั้งค่า runtime Codex แบบชัดเจนเดียวกัน ดังนั้น alias เก่าหรือการ fallback ไปยัง PI จึงไม่สามารถซ่อน regression ของ harness Codex ได้

### สูตร live ที่แนะนำ

allowlist ที่แคบและชัดเจนเร็วที่สุดและ flaky น้อยที่สุด:

- โมเดลเดียว, โดยตรง (ไม่มี gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- โมเดลเดียว, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การเรียก tool ข้ามหลาย provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- โฟกัส Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke:
  - หากคีย์ในเครื่องอยู่ใน shell profile: `source ~/.profile`
  - ค่าเริ่มต้น dynamic ของ Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - budget dynamic ของ Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

หมายเหตุ:

- `google/...` ใช้ Gemini API (API key)
- `google-antigravity/...` ใช้ bridge Antigravity OAuth (endpoint เอเจนต์แบบ Cloud Code Assist)
- `google-gemini-cli/...` ใช้ Gemini CLI ในเครื่องของคุณ (มี auth และข้อเฉพาะของ tooling แยกต่างหาก)
- Gemini API เทียบกับ Gemini CLI:
  - API: OpenClaw เรียก Gemini API ที่ Google โฮสต์ผ่าน HTTP (API key / profile auth); นี่คือสิ่งที่ผู้ใช้ส่วนใหญ่หมายถึงเมื่อพูดว่า “Gemini”
  - CLI: OpenClaw shell out ไปยังไบนารี `gemini` ในเครื่อง; มี auth ของตัวเองและอาจมีพฤติกรรมต่างกัน (streaming/การรองรับ tool/version skew)

## Live: เมทริกซ์โมเดล (สิ่งที่เราครอบคลุม)

ไม่มี “รายการโมเดล CI” แบบตายตัว (live เป็นแบบ opt-in) แต่นี่คือโมเดล **ที่แนะนำ** ให้ครอบคลุมเป็นประจำบนเครื่องพัฒนาที่มีคีย์

### ชุด smoke สมัยใหม่ (การเรียก tool + รูปภาพ)

นี่คือการรัน “โมเดลทั่วไป” ที่เราคาดว่าจะรักษาให้ทำงานต่อไปได้:

- OpenAI (ไม่ใช่ Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` และ `google/gemini-3-flash-preview` (หลีกเลี่ยงโมเดล Gemini 2.x ที่เก่ากว่า)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` และ `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` และ `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

รัน gateway smoke พร้อม tool + รูปภาพ:
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
- Mistral: `mistral/`… (เลือกโมเดลที่รองรับ “tools” หนึ่งรายการที่คุณเปิดใช้ไว้)
- Cerebras: `cerebras/`… (หากคุณมีสิทธิ์เข้าถึง)
- LM Studio: `lmstudio/`… (ในเครื่อง; การเรียก tool ขึ้นกับโหมด API)

### Vision: การส่งรูปภาพ (attachment → ข้อความ multimodal)

รวมโมเดลที่รองรับรูปภาพอย่างน้อยหนึ่งรายการใน `OPENCLAW_LIVE_GATEWAY_MODELS` (เช่น ตัวแปร Claude/Gemini/OpenAI ที่รองรับ vision) เพื่อทดสอบ image probe

### Aggregators / gateway ทางเลือก

หากคุณเปิดใช้คีย์ไว้ เรายังรองรับการทดสอบผ่าน:

- OpenRouter: `openrouter/...` (โมเดลหลายร้อยรายการ; ใช้ `openclaw models scan` เพื่อค้นหาผู้สมัครที่รองรับ tool+image)
- OpenCode: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go (auth ผ่าน `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

provider เพิ่มเติมที่คุณสามารถรวมในเมทริกซ์ live (หากคุณมี creds/config):

- ในตัว: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- ผ่าน `models.providers` (endpoint แบบกำหนดเอง): `minimax` (cloud/API) รวมถึง proxy ที่เข้ากันได้กับ OpenAI/Anthropic ใด ๆ (LM Studio, vLLM, LiteLLM ฯลฯ)

<Tip>
อย่า hardcode "all models" ในเอกสาร รายการที่ authoritative คือสิ่งที่ `discoverModels(...)` คืนค่าบนเครื่องของคุณบวกกับคีย์ที่มีอยู่
</Tip>

## ข้อมูลประจำตัว (ห้าม commit)

การทดสอบ live ค้นพบข้อมูลประจำตัวในแบบเดียวกับที่ CLI ทำ ผลกระทบเชิงปฏิบัติคือ:

- หาก CLI ใช้งานได้ การทดสอบแบบ live ควรพบคีย์เดียวกัน
- หากการทดสอบแบบ live แจ้งว่า “ไม่มี creds” ให้ดีบักแบบเดียวกับที่คุณดีบัก `openclaw models list` / การเลือกโมเดล

- โปรไฟล์ auth ราย agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (นี่คือความหมายของ “profile keys” ในการทดสอบแบบ live)
- การกำหนดค่า: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรีสถานะเดิม: `~/.openclaw/credentials/` (ถูกคัดลอกเข้าไปใน live home ที่จัดเตรียมไว้เมื่อมีอยู่ แต่ไม่ใช่ที่เก็บ profile-key หลัก)
- การรันแบบ live ในเครื่องจะคัดลอกการกำหนดค่าที่ใช้งานอยู่, ไฟล์ `auth-profiles.json` ราย agent, `credentials/` เดิม, และไดเรกทอรี auth ของ CLI ภายนอกที่รองรับไปยัง test home ชั่วคราวโดยค่าเริ่มต้น; live home ที่จัดเตรียมไว้จะข้าม `workspace/` และ `sandboxes/`, และจะลบการ override พาธ `agents.*.workspace` / `agentDir` เพื่อให้ probe ไม่แตะ workspace จริงบน host ของคุณ

หากคุณต้องการพึ่งพา env keys (เช่น export ไว้ใน `~/.profile` ของคุณ) ให้รันการทดสอบในเครื่องหลังจาก `source ~/.profile` หรือใช้ Docker runners ด้านล่าง (ซึ่งสามารถ mount `~/.profile` เข้าไปใน container ได้)

## Deepgram live (การถอดเสียงจาก audio)

- การทดสอบ: `extensions/deepgram/audio.live.test.ts`
- เปิดใช้: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## แผนการเขียนโค้ด BytePlus live

- การทดสอบ: `extensions/byteplus/live.test.ts`
- เปิดใช้: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- การ override โมเดลแบบไม่บังคับ: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## สื่อ workflow ComfyUI live

- การทดสอบ: `extensions/comfy/comfy.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- ขอบเขต:
  - ทดสอบพาธ comfy image, video และ `music_generate` ที่ bundled มา
  - ข้ามแต่ละ capability เว้นแต่จะกำหนดค่า `plugins.entries.comfy.config.<capability>` ไว้
  - มีประโยชน์หลังจากเปลี่ยนการส่ง workflow ของ comfy, polling, downloads หรือการลงทะเบียน Plugin

## Image generation live

- การทดสอบ: `test/image-generation.runtime.live.test.ts`
- คำสั่ง: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- ขอบเขต:
  - แจกแจงทุก Plugin ผู้ให้บริการ image-generation ที่ลงทะเบียนไว้
  - โหลด provider env vars ที่ขาดหายจาก login shell ของคุณ (`~/.profile`) ก่อน probe
  - ใช้ API keys จาก live/env ก่อน auth profiles ที่จัดเก็บไว้โดยค่าเริ่มต้น ดังนั้น test keys ที่เก่าใน `auth-profiles.json` จะไม่บดบัง credentials จริงจาก shell
  - ข้าม providers ที่ไม่มี auth/profile/model ที่ใช้งานได้
  - รัน provider ที่กำหนดค่าไว้แต่ละตัวผ่าน runtime image-generation ที่ใช้ร่วมกัน:
    - `<provider>:generate`
    - `<provider>:edit` เมื่อ provider ประกาศว่ารองรับ edit
- Providers ที่ bundled อยู่ในปัจจุบันซึ่งครอบคลุม:
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
- พฤติกรรม auth แบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile-store และละเว้นการ override แบบ env-only

สำหรับพาธ CLI ที่จัดส่ง ให้เพิ่ม smoke `infer` หลังจากการทดสอบแบบ live ของ provider/runtime ผ่านแล้ว:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

สิ่งนี้ครอบคลุมการ parse อาร์กิวเมนต์ของ CLI, การ resolve config/default-agent, การเปิดใช้งาน Plugin ที่ bundled, runtime image-generation ที่ใช้ร่วมกัน และคำขอ provider แบบ live คาดว่า dependencies ของ Plugin จะต้องมีอยู่ก่อนโหลด runtime

## Music generation live

- การทดสอบ: `extensions/music-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- ขอบเขต:
  - ทดสอบพาธ provider music-generation แบบ bundled ที่ใช้ร่วมกัน
  - ปัจจุบันครอบคลุม Google และ MiniMax
  - โหลด provider env vars จาก login shell ของคุณ (`~/.profile`) ก่อน probe
  - ใช้ API keys จาก live/env ก่อน auth profiles ที่จัดเก็บไว้โดยค่าเริ่มต้น ดังนั้น test keys ที่เก่าใน `auth-profiles.json` จะไม่บดบัง credentials จริงจาก shell
  - ข้าม providers ที่ไม่มี auth/profile/model ที่ใช้งานได้
  - รัน runtime modes ที่ประกาศไว้ทั้งสองแบบเมื่อมี:
    - `generate` ด้วย input ที่มีเฉพาะ prompt
    - `edit` เมื่อ provider ประกาศ `capabilities.edit.enabled`
  - ความครอบคลุม shared-lane ปัจจุบัน:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ไฟล์ Comfy live แยกต่างหาก ไม่ใช่ sweep ที่ใช้ร่วมกันนี้
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- พฤติกรรม auth แบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile-store และละเว้นการ override แบบ env-only

## Video generation live

- การทดสอบ: `extensions/video-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- ขอบเขต:
  - ทดสอบพาธ provider video-generation แบบ bundled ที่ใช้ร่วมกัน
  - ค่าเริ่มต้นคือพาธ smoke ที่ปลอดภัยสำหรับ release: providers ที่ไม่ใช่ FAL, คำขอ text-to-video หนึ่งรายการต่อ provider, prompt รูป lobster ความยาวหนึ่งวินาที และขีดจำกัด operation ราย provider จาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` โดยค่าเริ่มต้น)
  - ข้าม FAL โดยค่าเริ่มต้นเพราะ latency ของ queue ฝั่ง provider อาจครอบงำเวลา release; ส่ง `--video-providers fal` หรือ `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` เพื่อรันอย่างชัดเจน
  - โหลด provider env vars จาก login shell ของคุณ (`~/.profile`) ก่อน probe
  - ใช้ API keys จาก live/env ก่อน auth profiles ที่จัดเก็บไว้โดยค่าเริ่มต้น ดังนั้น test keys ที่เก่าใน `auth-profiles.json` จะไม่บดบัง credentials จริงจาก shell
  - ข้าม providers ที่ไม่มี auth/profile/model ที่ใช้งานได้
  - รันเฉพาะ `generate` โดยค่าเริ่มต้น
  - ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรัน transform modes ที่ประกาศไว้ด้วยเมื่อมี:
    - `imageToVideo` เมื่อ provider ประกาศ `capabilities.imageToVideo.enabled` และ provider/model ที่เลือกยอมรับ input รูปภาพในเครื่องแบบ buffer-backed ใน shared sweep
    - `videoToVideo` เมื่อ provider ประกาศ `capabilities.videoToVideo.enabled` และ provider/model ที่เลือกยอมรับ input วิดีโอในเครื่องแบบ buffer-backed ใน shared sweep
  - Providers `imageToVideo` ที่ประกาศไว้แต่ถูกข้ามในปัจจุบันใน shared sweep:
    - `vydra` เพราะ `veo3` ที่ bundled เป็น text-only และ `kling` ที่ bundled ต้องใช้ URL รูปภาพระยะไกล
  - ความครอบคลุมเฉพาะ provider ของ Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ไฟล์นั้นรัน text-to-video ของ `veo3` พร้อม lane ของ `kling` ที่ใช้ fixture URL รูปภาพระยะไกลโดยค่าเริ่มต้น
  - ความครอบคลุม live ของ `videoToVideo` ปัจจุบัน:
    - `runway` เฉพาะเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`
  - Providers `videoToVideo` ที่ประกาศไว้แต่ถูกข้ามในปัจจุบันใน shared sweep:
    - `alibaba`, `qwen`, `xai` เพราะพาธเหล่านั้นปัจจุบันต้องใช้ URL อ้างอิง `http(s)` / MP4 ระยะไกล
    - `google` เพราะ lane Gemini/Veo ที่ใช้ร่วมกันในปัจจุบันใช้ input ในเครื่องแบบ buffer-backed และพาธนั้นไม่ถูกรับใน shared sweep
    - `openai` เพราะ shared lane ปัจจุบันไม่มีการรับประกันสิทธิ์เข้าถึง video inpaint/remix เฉพาะ org
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` เพื่อรวมทุก provider ใน sweep ค่าเริ่มต้น รวมถึง FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` เพื่อลดขีดจำกัด operation ของแต่ละ provider สำหรับการรัน smoke แบบเร่งรัด
- พฤติกรรม auth แบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile-store และละเว้นการ override แบบ env-only

## Media live harness

- คำสั่ง: `pnpm test:live:media`
- วัตถุประสงค์:
  - รันชุดทดสอบ live ของ image, music และ video ที่ใช้ร่วมกันผ่าน entrypoint แบบ repo-native เดียว
  - โหลด provider env vars ที่ขาดหายจาก `~/.profile` อัตโนมัติ
  - จำกัดแต่ละชุดโดยอัตโนมัติให้เหลือ providers ที่มี auth ใช้งานได้ในปัจจุบันโดยค่าเริ่มต้น
  - ใช้ `scripts/test-live.mjs` ซ้ำ ดังนั้นพฤติกรรม Heartbeat และ quiet-mode จึงสอดคล้องกัน
- ตัวอย่าง:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing) — ชุดทดสอบ unit, integration, QA และ Docker
