---
read_when:
    - การเรียกใช้เมทริกซ์โมเดลแบบไลฟ์ / แบ็กเอนด์ CLI / ACP / การทดสอบ smoke ของ media-provider
    - การดีบักการแก้ไขข้อมูลประจำตัวสำหรับการทดสอบสด
    - การเพิ่มการทดสอบสดเฉพาะผู้ให้บริการรายใหม่
sidebarTitle: Live tests
summary: 'การทดสอบแบบไลฟ์ (ที่แตะเครือข่าย): เมทริกซ์โมเดล, แบ็กเอนด์ CLI, ACP, ผู้ให้บริการสื่อ, ข้อมูลประจำตัว'
title: 'การทดสอบ: ชุดทดสอบแบบสด'
x-i18n:
    generated_at: "2026-06-27T17:41:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe2bc8d775450803781caaf22079d5a4634537eb3a15c29e91be5b328d6b32b1
    source_path: help/testing-live.md
    workflow: 16
---

สำหรับการเริ่มต้นอย่างรวดเร็ว, ตัวรัน QA, ชุดทดสอบยูนิต/อินทิเกรชัน และโฟลว์ Docker โปรดดู
[การทดสอบ](/th/help/testing) หน้านี้ครอบคลุมชุดทดสอบ **live** (ที่แตะเครือข่าย):
เมทริกซ์โมเดล, แบ็กเอนด์ CLI, ACP และการทดสอบ live ของผู้ให้บริการสื่อ รวมถึง
การจัดการข้อมูลประจำตัว

## Live: คำสั่ง smoke ภายในเครื่อง

ส่งออกคีย์ผู้ให้บริการที่ต้องใช้ในสภาพแวดล้อมของโปรเซสก่อนตรวจสอบ live
แบบเฉพาะกิจ

Smoke สื่อแบบปลอดภัย:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke ความพร้อมของการโทรเสียงแบบปลอดภัย:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` เป็นการซ้อมรัน เว้นแต่จะมี `--yes` อยู่ด้วย ใช้ `--yes` เฉพาะ
เมื่อคุณตั้งใจต้องการโทรแจ้งเตือนจริง สำหรับ Twilio, Telnyx และ
Plivo การตรวจสอบความพร้อมที่สำเร็จต้องมี URL webhook สาธารณะ; fallback แบบ loopback/ส่วนตัวเฉพาะเครื่อง
จะถูกปฏิเสธโดยตั้งใจตามการออกแบบ

## Live: การกวาดตรวจความสามารถของโหนด Android

- การทดสอบ: `src/gateway/android-node.capabilities.live.test.ts`
- สคริปต์: `pnpm android:test:integration`
- เป้าหมาย: เรียกใช้ **ทุกคำสั่งที่ประกาศอยู่ในปัจจุบัน** โดยโหนด Android ที่เชื่อมต่ออยู่ และยืนยันพฤติกรรมตามสัญญาของคำสั่ง
- ขอบเขต:
  - การตั้งค่าล่วงหน้า/ด้วยมือ (ชุดทดสอบไม่ได้ติดตั้ง/รัน/จับคู่แอป)
  - การตรวจสอบ gateway `node.invoke` ทีละคำสั่งสำหรับโหนด Android ที่เลือก
- การตั้งค่าล่วงหน้าที่จำเป็น:
  - แอป Android เชื่อมต่อและจับคู่กับ gateway แล้ว
  - คงแอปไว้ในพื้นหน้า
  - อนุญาตสิทธิ์/ยินยอมให้จับข้อมูลสำหรับความสามารถที่คุณคาดว่าจะผ่าน
- การ override เป้าหมายแบบไม่บังคับ:
  - `OPENCLAW_ANDROID_NODE_ID` หรือ `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- รายละเอียดการตั้งค่า Android ทั้งหมด: [แอป Android](/th/platforms/android)

## Live: smoke โมเดล (คีย์โปรไฟล์)

การทดสอบ live ถูกแบ่งเป็นสองเลเยอร์เพื่อให้เราแยกความล้มเหลวได้:

- "โมเดลโดยตรง" บอกเราว่าผู้ให้บริการ/โมเดลสามารถตอบได้หรือไม่ด้วยคีย์ที่กำหนด
- "Gateway smoke" บอกเราว่าไปป์ไลน์ gateway+agent ทั้งหมดทำงานกับโมเดลนั้นหรือไม่ (เซสชัน, ประวัติ, เครื่องมือ, นโยบาย sandbox ฯลฯ)

### เลเยอร์ 1: การเติมเต็มจากโมเดลโดยตรง (ไม่มี gateway)

- การทดสอบ: `src/agents/models.profiles.live.test.ts`
- เป้าหมาย:
  - แจกแจงโมเดลที่ค้นพบ
  - ใช้ `getApiKeyForModel` เพื่อเลือกโมเดลที่คุณมีข้อมูลประจำตัว
  - รันการเติมเต็มขนาดเล็กต่อโมเดล (และ regression แบบเจาะจงเมื่อจำเป็น)
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- ตั้งค่า `OPENCLAW_LIVE_MODELS=modern`, `small` หรือ `all` (alias สำหรับ modern) เพื่อรันชุดทดสอบนี้จริง; มิฉะนั้นจะข้ามเพื่อให้ `pnpm test:live` โฟกัสที่ gateway smoke
- วิธีเลือกโมเดล:
  - `OPENCLAW_LIVE_MODELS=modern` เพื่อรัน allowlist สมัยใหม่ (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 5.1, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small` เพื่อรัน allowlist ของโมเดลขนาดเล็กแบบจำกัด (เส้นทาง Qwen 8B/9B ที่เข้ากันได้กับเครื่อง local, Ollama Gemma, OpenRouter Qwen/GLM และ Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` เป็น alias สำหรับ allowlist สมัยใหม่
  - หรือ `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist คั่นด้วยจุลภาค)
  - การรันโมเดลขนาดเล็กของ Ollama ภายในเครื่องมีค่าเริ่มต้นเป็น `http://127.0.0.1:11434`; ตั้งค่า `OPENCLAW_LIVE_OLLAMA_BASE_URL` เฉพาะสำหรับ endpoint แบบ LAN, แบบกำหนดเอง หรือ Ollama Cloud
  - การกวาดตรวจ modern/all และ small มีค่าเริ่มต้นเป็นขีดจำกัดที่คัดสรรไว้; ตั้งค่า `OPENCLAW_LIVE_MAX_MODELS=0` สำหรับการกวาดตรวจโปรไฟล์ที่เลือกแบบครบถ้วน หรือเป็นจำนวนบวกสำหรับขีดจำกัดที่เล็กลง
  - การกวาดตรวจแบบครบถ้วนใช้ `OPENCLAW_LIVE_TEST_TIMEOUT_MS` สำหรับ timeout ของการทดสอบโมเดลโดยตรงทั้งหมด ค่าเริ่มต้น: 60 นาที
  - โดยค่าเริ่มต้น probe โมเดลโดยตรงจะรันแบบขนาน 20 ทาง; ตั้งค่า `OPENCLAW_LIVE_MODEL_CONCURRENCY` เพื่อ override
- วิธีเลือกผู้ให้บริการ:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist คั่นด้วยจุลภาค)
- คีย์มาจากที่ใด:
  - โดยค่าเริ่มต้น: ที่เก็บโปรไฟล์และ fallback จาก env
  - ตั้งค่า `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้เฉพาะ **ที่เก็บโปรไฟล์**
- เหตุผลที่มีสิ่งนี้:
  - แยก "API ผู้ให้บริการเสีย / คีย์ไม่ถูกต้อง" ออกจาก "ไปป์ไลน์ agent ของ gateway เสีย"
  - มี regression ขนาดเล็กแบบแยกส่วน (ตัวอย่าง: การ replay reasoning ของ OpenAI Responses/Codex Responses + โฟลว์ tool-call)

### เลเยอร์ 2: Gateway + smoke ของ dev agent (สิ่งที่ "@openclaw" ทำจริง)

- การทดสอบ: `src/gateway/gateway-models.profiles.live.test.ts`
- เป้าหมาย:
  - เริ่ม gateway ในโปรเซส
  - สร้าง/แพตช์เซสชัน `agent:dev:*` (override โมเดลต่อการรัน)
  - วนผ่านโมเดลที่มีคีย์และยืนยัน:
    - การตอบกลับที่ "มีความหมาย" (ไม่มีเครื่องมือ)
    - การเรียกใช้เครื่องมือจริงทำงานได้ (probe อ่าน)
    - probe เครื่องมือเพิ่มเติมแบบไม่บังคับ (probe exec+read)
    - เส้นทาง regression ของ OpenAI (tool-call-only → follow-up) ยังคงทำงาน
- รายละเอียด probe (เพื่อให้คุณอธิบายความล้มเหลวได้รวดเร็ว):
  - probe `read`: การทดสอบเขียนไฟล์ nonce ใน workspace และขอให้ agent `read` ไฟล์นั้นแล้วสะท้อน nonce กลับมา
  - probe `exec+read`: การทดสอบขอให้ agent `exec` เพื่อเขียน nonce ลงในไฟล์ temp แล้ว `read` กลับมา
  - probe รูปภาพ: การทดสอบแนบ PNG ที่สร้างขึ้น (cat + โค้ดสุ่ม) และคาดหวังให้โมเดลส่งกลับ `cat <CODE>`
  - อ้างอิงการใช้งาน: `src/gateway/gateway-models.profiles.live.test.ts` และ `test/helpers/live-image-probe.ts`
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- วิธีเลือกโมเดล:
  - ค่าเริ่มต้น: allowlist สมัยใหม่ (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` เพื่อรัน allowlist ของโมเดลขนาดเล็กแบบจำกัดเดียวกันผ่านไปป์ไลน์ gateway+agent ทั้งหมด
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` เป็น alias สำหรับ allowlist สมัยใหม่
  - หรือตั้งค่า `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (หรือรายการคั่นด้วยจุลภาค) เพื่อจำกัดขอบเขต
  - การกวาดตรวจ gateway แบบ modern/all และ small มีค่าเริ่มต้นเป็นขีดจำกัดที่คัดสรรไว้; ตั้งค่า `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` สำหรับการกวาดตรวจที่เลือกแบบครบถ้วน หรือเป็นจำนวนบวกสำหรับขีดจำกัดที่เล็กลง
- วิธีเลือกผู้ให้บริการ (หลีกเลี่ยง "ทุกอย่างผ่าน OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist คั่นด้วยจุลภาค)
- probe เครื่องมือ + รูปภาพเปิดอยู่เสมอในการทดสอบ live นี้:
  - probe `read` + probe `exec+read` (stress เครื่องมือ)
  - probe รูปภาพจะรันเมื่อโมเดลประกาศว่ารองรับอินพุตรูปภาพ
  - โฟลว์ (ระดับสูง):
    - การทดสอบสร้าง PNG ขนาดเล็กที่มี "CAT" + โค้ดสุ่ม (`test/helpers/live-image-probe.ts`)
    - ส่งผ่าน `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway แยกวิเคราะห์ไฟล์แนบเป็น `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - agent แบบฝังส่งข้อความผู้ใช้หลายสื่อไปยังโมเดล
    - Assertion: คำตอบมี `cat` + โค้ด (ความทนทานของ OCR: อนุญาตข้อผิดพลาดเล็กน้อย)

<Tip>
หากต้องการดูว่าคุณทดสอบอะไรได้บนเครื่องของคุณ (และ id `provider/model` ที่แน่นอน) ให้รัน:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke แบ็กเอนด์ CLI (Claude, Gemini หรือ CLI ภายในเครื่องอื่น)

- การทดสอบ: `src/gateway/gateway-cli-backend.live.test.ts`
- เป้าหมาย: ตรวจสอบไปป์ไลน์ Gateway + agent โดยใช้แบ็กเอนด์ CLI ภายในเครื่อง โดยไม่แตะ config เริ่มต้นของคุณ
- ค่าเริ่มต้นของ smoke เฉพาะแบ็กเอนด์อยู่กับนิยาม `cli-backend.ts` ของ extension เจ้าของ
- เปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- ค่าเริ่มต้น:
  - ผู้ให้บริการ/โมเดลเริ่มต้น: `claude-cli/claude-sonnet-4-6`
  - พฤติกรรมคำสั่ง/args/รูปภาพมาจากเมทาดาทาของ Plugin แบ็กเอนด์ CLI เจ้าของ
- การ override (ไม่บังคับ):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` เพื่อส่งไฟล์แนบรูปภาพจริง (path จะถูกฉีดเข้าใน prompt) สูตร Docker ปิดค่านี้เป็นค่าเริ่มต้น เว้นแต่จะร้องขออย่างชัดเจน
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` เพื่อส่ง path ไฟล์รูปภาพเป็น CLI args แทนการฉีดเข้า prompt
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (หรือ `"list"`) เพื่อควบคุมวิธีส่ง args รูปภาพเมื่อมีการตั้งค่า `IMAGE_ARG`
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` เพื่อส่ง turn ที่สองและตรวจสอบโฟลว์ resume
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` เพื่อเลือกใช้ probe ความต่อเนื่องในเซสชันเดียวกัน Claude Sonnet -> Opus เมื่อโมเดลที่เลือกสนับสนุนเป้าหมายสำหรับการสลับ สูตร Docker ปิดค่านี้เป็นค่าเริ่มต้นเพื่อความเสถียรโดยรวม
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` เพื่อเลือกใช้ probe loopback ของ MCP/เครื่องมือ สูตร Docker ปิดค่านี้เป็นค่าเริ่มต้น เว้นแต่จะร้องขออย่างชัดเจน

ตัวอย่าง:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke config MCP ของ Gemini แบบประหยัด:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

สิ่งนี้ไม่ได้ขอให้ Gemini สร้างคำตอบ แต่จะเขียนการตั้งค่าระบบเดียวกันกับที่
OpenClaw ให้กับ Gemini แล้วรัน `gemini --debug mcp list` เพื่อพิสูจน์ว่าเซิร์ฟเวอร์
`transport: "streamable-http"` ที่บันทึกไว้ถูก normalize เป็นรูปแบบ HTTP MCP ของ Gemini
และสามารถเชื่อมต่อกับเซิร์ฟเวอร์ MCP แบบ streamable-HTTP ภายในเครื่องได้

สูตร Docker:

```bash
pnpm test:docker:live-cli-backend
```

สูตร Docker สำหรับผู้ให้บริการเดียว:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

หมายเหตุ:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-cli-backend-docker.sh`
- รัน smoke แบ็กเอนด์ CLI แบบ live ภายในอิมเมจ Docker ของ repo ในฐานะผู้ใช้ `node` ที่ไม่ใช่ root
- แก้ไขเมทาดาทา smoke ของ CLI จาก extension เจ้าของ แล้วติดตั้งแพ็กเกจ CLI สำหรับ Linux ที่ตรงกัน (`@anthropic-ai/claude-code` หรือ `@google/gemini-cli`) ลงใน prefix แบบเขียนได้ที่แคชไว้ที่ `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`)
- `pnpm test:docker:live-cli-backend:claude-subscription` ต้องใช้ OAuth การสมัครใช้งาน Claude Code แบบพกพาผ่าน `~/.claude/.credentials.json` ที่มี `claudeAiOauth.subscriptionType` หรือ `CLAUDE_CODE_OAUTH_TOKEN` จาก `claude setup-token` ก่อนอื่นจะพิสูจน์ `claude -p` โดยตรงใน Docker จากนั้นรันสอง turn ของแบ็กเอนด์ CLI ของ Gateway โดยไม่เก็บรักษา env vars ของคีย์ Anthropic API lane การสมัครใช้งานนี้ปิด probe MCP/เครื่องมือและรูปภาพของ Claude เป็นค่าเริ่มต้น เพราะปัจจุบัน Claude route การใช้งานแอปของบุคคลที่สามผ่านการเรียกเก็บเงินการใช้งานเพิ่มเติมแทนขีดจำกัดของแผนการสมัครใช้งานปกติ
- smoke แบ็กเอนด์ CLI แบบ live ตอนนี้ทดสอบโฟลว์ end-to-end เดียวกันสำหรับ Claude และ Gemini: turn ข้อความ, turn การจัดประเภทรูปภาพ, แล้วจึงเป็นการเรียกเครื่องมือ MCP `cron` ที่ตรวจสอบผ่าน CLI ของ gateway
- smoke เริ่มต้นของ Claude ยังแพตช์เซสชันจาก Sonnet เป็น Opus และตรวจสอบว่าเซสชันที่ resume แล้วยังจำโน้ตก่อนหน้าได้

## Live: ความสามารถในการเข้าถึงพร็อกซี APNs HTTP/2

- การทดสอบ: `src/infra/push-apns-http2.live.test.ts`
- เป้าหมาย: tunnel ผ่านพร็อกซี HTTP CONNECT ภายในเครื่องไปยัง endpoint APNs sandbox ของ Apple, ส่งคำขอตรวจสอบ APNs HTTP/2 และยืนยันว่าคำตอบ `403 InvalidProviderToken` จริงของ Apple กลับมาผ่านเส้นทางพร็อกซี
- เปิดใช้:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- timeout แบบไม่บังคับ:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- การทดสอบ: `src/gateway/gateway-acp-bind.live.test.ts`
- เป้าหมาย: ตรวจสอบโฟลว์ bind การสนทนา ACP จริงกับเอเจนต์ ACP แบบ live:
  - ส่ง `/acp spawn <agent> --bind here`
  - bind การสนทนา message-channel สังเคราะห์ไว้ ณ จุดเดิม
  - ส่ง follow-up ปกติบนการสนทนาเดียวกันนั้น
  - ตรวจสอบว่า follow-up เข้าไปอยู่ใน transcript ของเซสชัน ACP ที่ถูก bind
- เปิดใช้งาน:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- ค่าเริ่มต้น:
  - เอเจนต์ ACP ใน Docker: `claude,codex,gemini`
  - เอเจนต์ ACP สำหรับ `pnpm test:live ...` โดยตรง: `claude`
  - ช่องทางสังเคราะห์: บริบทการสนทนาแบบ Slack DM
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
  - lane นี้ใช้พื้นผิว `chat.send` ของ gateway พร้อมฟิลด์ originating-route สังเคราะห์ที่ใช้ได้เฉพาะแอดมิน เพื่อให้การทดสอบแนบบริบท message-channel ได้โดยไม่ต้องแสร้งว่าส่งมอบออกไปภายนอก
  - เมื่อไม่ได้ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` การทดสอบจะใช้รีจิสทรีเอเจนต์ในตัวของ Plugin `acpx` ที่ฝังไว้สำหรับเอเจนต์ harness ACP ที่เลือก
  - การสร้าง MCP ของ Cron สำหรับเซสชันที่ถูก bind เป็น best-effort ตามค่าเริ่มต้น เพราะ harness ACP ภายนอกอาจยกเลิกการเรียก MCP หลังจาก proof ของ bind/image ผ่านแล้ว ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` เพื่อให้ probe Cron หลัง bind นั้นเข้มงวด

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

สูตร Docker สำหรับเอเจนต์เดี่ยว:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

หมายเหตุ Docker:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-acp-bind-docker.sh`
- ตามค่าเริ่มต้น จะรัน ACP bind smoke กับเอเจนต์ CLI แบบ live รวมตามลำดับ: `claude`, `codex` แล้วตามด้วย `gemini`
- ใช้ `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` หรือ `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` เพื่อจำกัดเมทริกซ์
- จะ stage วัสดุการยืนยันตัวตน CLI ที่ตรงกันเข้าไปในคอนเทนเนอร์ จากนั้นติดตั้ง live CLI ที่ร้องขอ (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid ผ่าน `https://app.factory.ai/cli`, `@google/gemini-cli` หรือ `opencode-ai`) หากยังไม่มีอยู่ แบ็กเอนด์ ACP เองคือแพ็กเกจ `acpx/runtime` ที่ฝังไว้จาก Plugin `acpx` อย่างเป็นทางการ
- ตัวแปร Docker ของ Droid จะ stage `~/.factory` สำหรับการตั้งค่า ส่งต่อ `FACTORY_API_KEY` และต้องมี API key นั้น เพราะการยืนยันตัวตน Factory OAuth/keyring แบบ local ไม่สามารถพกพาเข้าไปในคอนเทนเนอร์ได้ ใช้รายการรีจิสทรีในตัวของ ACPX คือ `droid exec --output-format acp`
- ตัวแปร Docker ของ OpenCode เป็น lane regression แบบเอเจนต์เดี่ยวที่เข้มงวด จะเขียนโมเดลเริ่มต้น `OPENCODE_CONFIG_CONTENT` ชั่วคราวจาก `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (ค่าเริ่มต้น `opencode/kimi-k2.6`) และ `pnpm test:docker:live-acp-bind:opencode` ต้องมี transcript ของ assistant ที่ถูก bind แทนที่จะยอมรับการข้ามหลัง bind แบบทั่วไป
- การเรียก CLI `acpx` โดยตรงเป็นเพียงเส้นทาง manual/workaround สำหรับเปรียบเทียบพฤติกรรมนอก Gateway เท่านั้น Docker ACP bind smoke จะทดสอบแบ็กเอนด์ runtime `acpx` ที่ฝังใน OpenClaw

## Live: Codex app-server harness smoke

- เป้าหมาย: ตรวจสอบ harness Codex ที่ Plugin เป็นเจ้าของผ่าน gateway ปกติ
  เมธอด `agent`:
  - โหลด Plugin `codex` ที่ bundled มา
  - เลือก `openai/gpt-5.5` ซึ่ง route agent turn ของ OpenAI ผ่าน Codex ตามค่าเริ่มต้น
  - ส่ง gateway agent turn แรกไปยัง `openai/gpt-5.5` โดยเลือก harness Codex
  - ส่ง turn ที่สองไปยังเซสชัน OpenClaw เดียวกัน และตรวจสอบว่า thread ของ app-server
    resume ได้
  - รัน `/codex status` และ `/codex models` ผ่านเส้นทางคำสั่ง gateway เดียวกัน
  - เลือกรัน probe shell แบบ escalated ที่ผ่านการ review โดย Guardian สองรายการ: คำสั่งที่ไม่เป็นอันตราย
    ซึ่งควรถูกอนุมัติ และการอัปโหลด fake-secret ที่ควรถูก
    ปฏิเสธเพื่อให้เอเจนต์ถามกลับ
- การทดสอบ: `src/gateway/gateway-codex-harness.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- โมเดลเริ่มต้น: `openai/gpt-5.5`
- probe รูปภาพแบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- probe MCP/tool แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- probe Guardian แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke บังคับ provider/model `agentRuntime.id: "codex"` ดังนั้น harness Codex
  ที่เสียจะผ่านไม่ได้ด้วยการ fallback กลับไป OpenClaw แบบเงียบ ๆ
- การยืนยันตัวตน: การยืนยันตัวตน Codex app-server จากการเข้าสู่ระบบ subscription ของ Codex ในเครื่อง local Docker
  smokes ยังสามารถระบุ `OPENAI_API_KEY` สำหรับ probe ที่ไม่ใช่ Codex เมื่อใช้ได้
  รวมถึงเลือกคัดลอก `~/.codex/auth.json` และ `~/.codex/config.toml`

สูตร local:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

สูตร Docker:

```bash
pnpm test:docker:live-codex-harness
```

หมายเหตุ Docker:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-codex-harness-docker.sh`
- ส่งผ่าน `OPENAI_API_KEY`, คัดลอกไฟล์ยืนยันตัวตน Codex CLI เมื่อมีอยู่, ติดตั้ง
  `@openai/codex` ลงใน npm prefix ที่ mount และเขียนได้,
  stage source tree แล้วรันเฉพาะการทดสอบ live ของ Codex-harness
- Docker เปิดใช้งาน probe รูปภาพ, MCP/tool และ Guardian ตามค่าเริ่มต้น ตั้งค่า
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` เมื่อคุณต้องการการรัน debug
  ที่แคบกว่า
- Docker ใช้ config runtime Codex แบบชัดเจนเดียวกัน ดังนั้น alias แบบเก่าหรือ fallback ของ OpenClaw
  จะซ่อน regression ของ harness Codex ไม่ได้

### สูตร live ที่แนะนำ

allowlist ที่แคบและชัดเจนเร็วที่สุดและมีความ flaky น้อยที่สุด:

- โมเดลเดี่ยว แบบตรง (ไม่มี gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- โปรไฟล์ direct สำหรับโมเดลขนาดเล็ก:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- โปรไฟล์ gateway สำหรับโมเดลขนาดเล็ก:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API smoke:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- โมเดลเดี่ยว, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การเรียก tool ข้ามหลาย provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 direct smoke:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- โฟกัส Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke:
  - ค่าเริ่มต้น dynamic ของ Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - budget dynamic ของ Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

หมายเหตุ:

- `google/...` ใช้ Gemini API (API key)
- `google-antigravity/...` ใช้ bridge Antigravity OAuth (endpoint เอเจนต์สไตล์ Cloud Code Assist)
- `google-gemini-cli/...` ใช้ Gemini CLI แบบ local บนเครื่องของคุณ (การยืนยันตัวตนแยกต่างหาก + ความเฉพาะของ tooling)
- Gemini API เทียบกับ Gemini CLI:
  - API: OpenClaw เรียก Gemini API ที่ Google host ไว้ผ่าน HTTP (API key / การยืนยันตัวตนโปรไฟล์); นี่คือสิ่งที่ผู้ใช้ส่วนใหญ่หมายถึงเมื่อพูดว่า "Gemini"
  - CLI: OpenClaw shell out ไปยังไบนารี `gemini` แบบ local; มีการยืนยันตัวตนของตัวเองและอาจทำงานต่างออกไป (streaming/tool support/version skew)

## Live: เมทริกซ์โมเดล (สิ่งที่เราครอบคลุม)

ไม่มี "รายการโมเดล CI" ที่ตายตัว (live เป็น opt-in) แต่ต่อไปนี้คือโมเดลที่ **แนะนำ** ให้ครอบคลุมเป็นประจำบนเครื่อง dev ที่มี key

### ชุด smoke สมัยใหม่ (การเรียก tool + รูปภาพ)

นี่คือการรัน "โมเดลทั่วไป" ที่เราคาดว่าจะคงให้ทำงานได้:

- OpenAI (ไม่ใช่ Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` และ `google/gemini-3-flash-preview` (หลีกเลี่ยงโมเดล Gemini 2.x ที่เก่ากว่า)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` และ `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` และ `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (API ทั่วไป) หรือ `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

รัน gateway smoke พร้อม tools + รูปภาพ:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: การเรียก tool (Read + Exec แบบเลือกได้)

เลือกอย่างน้อยหนึ่งรายการต่อ provider family:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (หรือ `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (API ทั่วไป) หรือ `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

ความครอบคลุมเพิ่มเติมแบบเลือกได้ (มีไว้ก็ดี):

- xAI: `xai/grok-4.3` (หรือเวอร์ชันล่าสุดที่มี)
- Mistral: `mistral/`… (เลือกโมเดลที่รองรับ "tools" หนึ่งตัวซึ่งคุณเปิดใช้งานไว้)
- Cerebras: `cerebras/`… (หากคุณมีสิทธิ์เข้าถึง)
- LM Studio: `lmstudio/`… (local; การเรียก tool ขึ้นอยู่กับโหมด API)

### Vision: ส่งรูปภาพ (attachment → ข้อความ multimodal)

รวมโมเดลที่รองรับรูปภาพอย่างน้อยหนึ่งตัวไว้ใน `OPENCLAW_LIVE_GATEWAY_MODELS` (variant ที่รองรับ vision ของ Claude/Gemini/OpenAI ฯลฯ) เพื่อทดสอบ probe รูปภาพ

### Aggregators / gateway ทางเลือก

หากคุณเปิดใช้ key ไว้ เรายังรองรับการทดสอบผ่าน:

- OpenRouter: `openrouter/...` (โมเดลหลายร้อยตัว; ใช้ `openclaw models scan` เพื่อค้นหาผู้สมัครที่รองรับ tool+image)
- OpenCode: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go (ยืนยันตัวตนผ่าน `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

provider เพิ่มเติมที่คุณสามารถใส่ในเมทริกซ์ live ได้ (หากคุณมี creds/config):

- ในตัว: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- ผ่าน `models.providers` (ปลายทางกำหนดเอง): `minimax` (คลาวด์/API) รวมถึงพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic ใดๆ (LM Studio, vLLM, LiteLLM ฯลฯ)

<Tip>
อย่าฮาร์ดโค้ด "โมเดลทั้งหมด" ในเอกสาร รายการที่เชื่อถือได้คือสิ่งที่ `discoverModels(...)` ส่งคืนบนเครื่องของคุณ รวมถึงคีย์ใดๆ ที่พร้อมใช้งาน
</Tip>

## ข้อมูลรับรอง (ห้ามคอมมิต)

การทดสอบแบบสดค้นหาข้อมูลรับรองด้วยวิธีเดียวกับที่ CLI ใช้ ผลเชิงปฏิบัติ:

- ถ้า CLI ใช้งานได้ การทดสอบแบบสดควรพบคีย์เดียวกัน
- ถ้าการทดสอบแบบสดแจ้งว่า "ไม่มีข้อมูลรับรอง" ให้ดีบักแบบเดียวกับที่คุณจะดีบัก `openclaw models list` / การเลือกโมเดล

- โปรไฟล์การยืนยันตัวตนต่อเอเจนต์: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (นี่คือความหมายของ "คีย์โปรไฟล์" ในการทดสอบแบบสด)
- การกำหนดค่า: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรีสถานะเดิม: `~/.openclaw/credentials/` (คัดลอกไปยังโฮมทดสอบแบบสดที่จัดเตรียมไว้เมื่อมีอยู่ แต่ไม่ใช่ที่เก็บคีย์โปรไฟล์หลัก)
- การรันแบบสดในเครื่องจะคัดลอกการกำหนดค่าที่ใช้งานอยู่ ไฟล์ `auth-profiles.json` ต่อเอเจนต์ `credentials/` เดิม และไดเรกทอรีการยืนยันตัวตน CLI ภายนอกที่รองรับไปยังโฮมทดสอบชั่วคราวตามค่าเริ่มต้น; โฮมแบบสดที่จัดเตรียมไว้จะข้าม `workspace/` และ `sandboxes/` และการเขียนทับพาธ `agents.*.workspace` / `agentDir` จะถูกตัดออก เพื่อให้โพรบไม่แตะพื้นที่ทำงานจริงบนโฮสต์ของคุณ

ถ้าคุณต้องการพึ่งพาคีย์ env ให้ export คีย์เหล่านั้นก่อนการทดสอบในเครื่อง หรือใช้
ตัวรัน Docker ด้านล่างพร้อม `OPENCLAW_PROFILE_FILE` ที่ระบุชัดเจน

## Deepgram แบบสด (การถอดเสียงจากเสียง)

- การทดสอบ: `extensions/deepgram/audio.live.test.ts`
- เปิดใช้งาน: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## แผนการเขียนโค้ด BytePlus แบบสด

- การทดสอบ: `extensions/byteplus/live.test.ts`
- เปิดใช้งาน: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- การเขียนทับโมเดลแบบไม่บังคับ: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## สื่อเวิร์กโฟลว์ ComfyUI แบบสด

- การทดสอบ: `extensions/comfy/comfy.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- ขอบเขต:
  - ทดสอบพาธรูปภาพ วิดีโอ และ `music_generate` ของ comfy ที่บันเดิลมา
  - ข้ามแต่ละความสามารถ เว้นแต่จะกำหนดค่า `plugins.entries.comfy.config.<capability>` แล้ว
  - มีประโยชน์หลังจากเปลี่ยนการส่งเวิร์กโฟลว์ comfy การโพล ดาวน์โหลด หรือการลงทะเบียน Plugin

## การสร้างรูปภาพแบบสด

- การทดสอบ: `test/image-generation.runtime.live.test.ts`
- คำสั่ง: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- ขอบเขต:
  - แจกแจง Plugin ผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้ทั้งหมด
  - ใช้ env var ของผู้ให้บริการที่ export ไว้แล้วก่อนโพรบ
  - ใช้คีย์ API แบบสด/env ก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้ตามค่าเริ่มต้น ดังนั้นคีย์ทดสอบที่ล้าสมัยใน `auth-profiles.json` จะไม่บดบังข้อมูลรับรองจริงของเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - รันผู้ให้บริการที่กำหนดค่าไว้แต่ละรายผ่านรันไทม์การสร้างรูปภาพร่วม:
    - `<provider>:generate`
    - `<provider>:edit` เมื่อผู้ให้บริการประกาศว่ารองรับการแก้ไข
- ผู้ให้บริการที่บันเดิลในปัจจุบันซึ่งครอบคลุม:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับการยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการเขียนทับที่มีเฉพาะ env

สำหรับพาธ CLI ที่จัดส่ง ให้เพิ่ม smoke `infer` หลังจากการทดสอบแบบสดของ
ผู้ให้บริการ/รันไทม์ผ่านแล้ว:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

สิ่งนี้ครอบคลุมการแยกวิเคราะห์อาร์กิวเมนต์ CLI, การแก้การกำหนดค่า/เอเจนต์เริ่มต้น, การเปิดใช้งาน
Plugin ที่บันเดิล, รันไทม์การสร้างรูปภาพร่วม และคำขอผู้ให้บริการแบบสด
คาดว่า dependency ของ Plugin จะมีอยู่ก่อนการโหลดรันไทม์

## การสร้างเพลงแบบสด

- การทดสอบ: `extensions/music-generation-providers.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- ขอบเขต:
  - ทดสอบพาธผู้ให้บริการสร้างเพลงร่วมที่บันเดิลมา
  - ปัจจุบันครอบคลุม Google และ MiniMax
  - ใช้ env var ของผู้ให้บริการที่ export ไว้แล้วก่อนโพรบ
  - ใช้คีย์ API แบบสด/env ก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้ตามค่าเริ่มต้น ดังนั้นคีย์ทดสอบที่ล้าสมัยใน `auth-profiles.json` จะไม่บดบังข้อมูลรับรองจริงของเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - รันโหมดรันไทม์ที่ประกาศไว้ทั้งสองแบบเมื่อพร้อมใช้งาน:
    - `generate` พร้อมอินพุตเฉพาะพรอมป์
    - `edit` เมื่อผู้ให้บริการประกาศ `capabilities.edit.enabled`
  - ความครอบคลุมของเลนร่วมในปัจจุบัน:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ไฟล์ Comfy แบบสดแยกต่างหาก ไม่ใช่การกวาดร่วมนี้
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- พฤติกรรมการยืนยันตัวตนแบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับการยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการเขียนทับที่มีเฉพาะ env

## การสร้างวิดีโอแบบสด

- การทดสอบ: `extensions/video-generation-providers.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- ขอบเขต:
  - ทดสอบพาธผู้ให้บริการสร้างวิดีโอร่วมที่บันเดิลมา
  - ค่าเริ่มต้นเป็นพาธ smoke ที่ปลอดภัยสำหรับรีลีส: ผู้ให้บริการที่ไม่ใช่ FAL, หนึ่งคำขอ text-to-video ต่อผู้ให้บริการ, พรอมป์ล็อบสเตอร์หนึ่งวินาที และขีดจำกัดการดำเนินการต่อผู้ให้บริการจาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` ตามค่าเริ่มต้น)
  - ข้าม FAL ตามค่าเริ่มต้นเพราะเวลาแฝงของคิวฝั่งผู้ให้บริการอาจครอบงำเวลารีลีส; ส่ง `--video-providers fal` หรือ `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` เพื่อรันอย่างชัดเจน
  - ใช้ env var ของผู้ให้บริการที่ export ไว้แล้วก่อนโพรบ
  - ใช้คีย์ API แบบสด/env ก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้ตามค่าเริ่มต้น ดังนั้นคีย์ทดสอบที่ล้าสมัยใน `auth-profiles.json` จะไม่บดบังข้อมูลรับรองจริงของเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - รันเฉพาะ `generate` ตามค่าเริ่มต้น
  - ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรันโหมด transform ที่ประกาศไว้ด้วยเมื่อพร้อมใช้งาน:
    - `imageToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.imageToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตรูปภาพในเครื่องที่รองรับด้วยบัฟเฟอร์ในการกวาดร่วม
    - `videoToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.videoToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตวิดีโอในเครื่องที่รองรับด้วยบัฟเฟอร์ในการกวาดร่วม
  - ผู้ให้บริการ `imageToVideo` ที่ประกาศไว้แต่ถูกข้ามในปัจจุบันในการกวาดร่วม:
    - `vydra` เพราะ `veo3` ที่บันเดิลเป็นแบบ text-only และ `kling` ที่บันเดิลต้องใช้ URL รูปภาพระยะไกล
  - ความครอบคลุมเฉพาะผู้ให้บริการ Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ไฟล์นั้นรัน `veo3` text-to-video รวมถึงเลน `kling` ที่ใช้ fixture URL รูปภาพระยะไกลตามค่าเริ่มต้น
  - ความครอบคลุมแบบสดของ `videoToVideo` ในปัจจุบัน:
    - `runway` เฉพาะเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`
  - ผู้ให้บริการ `videoToVideo` ที่ประกาศไว้แต่ถูกข้ามในปัจจุบันในการกวาดร่วม:
    - `alibaba`, `qwen`, `xai` เพราะพาธเหล่านั้นปัจจุบันต้องใช้ URL อ้างอิง `http(s)` / MP4 ระยะไกล
    - `google` เพราะเลน Gemini/Veo ร่วมปัจจุบันใช้อินพุตในเครื่องที่รองรับด้วยบัฟเฟอร์ และพาธนั้นไม่ถูกยอมรับในการกวาดร่วม
    - `openai` เพราะเลนร่วมปัจจุบันไม่มีการรับประกันการเข้าถึงการแก้ไขวิดีโอเฉพาะองค์กร
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` เพื่อรวมผู้ให้บริการทุกตัวในการกวาดค่าเริ่มต้น รวมถึง FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` เพื่อลดขีดจำกัดการดำเนินการของผู้ให้บริการแต่ละรายสำหรับการรัน smoke ที่เข้มงวด
- พฤติกรรมการยืนยันตัวตนแบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับการยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการเขียนทับที่มีเฉพาะ env

## Harness สื่อแบบสด

- คำสั่ง: `pnpm test:live:media`
- วัตถุประสงค์:
  - รันชุดทดสอบแบบสดของรูปภาพ เพลง และวิดีโอร่วมผ่าน entrypoint เดียวแบบเนทีฟของรีโป
  - ใช้ env var ของผู้ให้บริการที่ export ไว้แล้ว
  - จำกัดแต่ละชุดให้เหลือเฉพาะผู้ให้บริการที่ปัจจุบันมีการยืนยันตัวตนที่ใช้งานได้โดยอัตโนมัติตามค่าเริ่มต้น
  - ใช้ `scripts/test-live.mjs` ซ้ำ ดังนั้นพฤติกรรม Heartbeat และโหมดเงียบจึงคงความสอดคล้อง
- ตัวอย่าง:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing) - ชุดทดสอบ unit, integration, QA และ Docker
