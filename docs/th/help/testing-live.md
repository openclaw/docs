---
read_when:
    - การรันเมทริกซ์โมเดลแบบสด / แบ็กเอนด์ CLI / ACP / การทดสอบ smoke ของ media-provider
    - การดีบักการแก้ไขข้อมูลรับรองสำหรับการทดสอบสด
    - การเพิ่มการทดสอบสดเฉพาะผู้ให้บริการรายใหม่
sidebarTitle: Live tests
summary: 'การทดสอบแบบ Live (ที่แตะเครือข่าย): เมทริกซ์โมเดล, แบ็กเอนด์ CLI, ACP, ผู้ให้บริการสื่อ, ข้อมูลประจำตัว'
title: 'การทดสอบ: ชุดทดสอบแบบสด'
x-i18n:
    generated_at: "2026-06-28T20:43:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 087ec52b395131889d4ae113f304d71199c58dc9f61a1a5e1e511ae4c5b48c0b
    source_path: help/testing-live.md
    workflow: 16
---

สำหรับการเริ่มต้นอย่างรวดเร็ว, ตัวรัน QA, ชุดทดสอบหน่วย/บูรณาการ และโฟลว์ Docker โปรดดู
[การทดสอบ](/th/help/testing) หน้านี้ครอบคลุมชุดทดสอบ **จริง** (ที่แตะเครือข่าย):
เมทริกซ์โมเดล, แบ็กเอนด์ CLI, ACP และการทดสอบจริงของผู้ให้บริการสื่อ รวมถึง
การจัดการข้อมูลรับรอง

## การทดสอบจริง: คำสั่ง smoke ภายในเครื่อง

ส่งออกคีย์ผู้ให้บริการที่จำเป็นในสภาพแวดล้อมของโปรเซสก่อนการตรวจสอบจริง
แบบเฉพาะกิจ

การตรวจสอบสื่อเบื้องต้นที่ปลอดภัย:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

การตรวจสอบความพร้อมของการโทรด้วยเสียงเบื้องต้นที่ปลอดภัย:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` เป็นการซ้อมรัน เว้นแต่จะมี `--yes` อยู่ด้วย ใช้ `--yes` เฉพาะ
เมื่อคุณตั้งใจให้มีการโทรแจ้งเตือนจริง สำหรับ Twilio, Telnyx และ
Plivo การตรวจสอบความพร้อมที่สำเร็จต้องมี URL Webhook สาธารณะ ทางเลือกสำรองแบบ
ลูปแบ็กภายในเครื่องเท่านั้น/ส่วนตัวถูกปฏิเสธโดยตั้งใจตามการออกแบบ

## การทดสอบจริง: การไล่ตรวจความสามารถของโหนด Android

- การทดสอบ: `src/gateway/android-node.capabilities.live.test.ts`
- สคริปต์: `pnpm android:test:integration`
- เป้าหมาย: เรียกใช้ **ทุกคำสั่งที่ประกาศอยู่ในปัจจุบัน** โดยโหนด Android ที่เชื่อมต่ออยู่ และยืนยันพฤติกรรมตามสัญญาของคำสั่ง
- ขอบเขต:
  - การตั้งค่าล่วงหน้า/ด้วยตนเอง (ชุดทดสอบนี้ไม่ติดตั้ง/รัน/จับคู่แอป)
  - การตรวจสอบ `node.invoke` ของ Gateway แยกตามคำสั่งสำหรับโหนด Android ที่เลือก
- การตั้งค่าล่วงหน้าที่ต้องมี:
  - แอป Android เชื่อมต่อและจับคู่กับ Gateway แล้ว
  - คงแอปไว้ในฉากหน้า
  - ให้สิทธิ์/ยินยอมการจับข้อมูลสำหรับความสามารถที่คุณคาดว่าจะผ่าน
- การแทนที่เป้าหมายแบบไม่บังคับ:
  - `OPENCLAW_ANDROID_NODE_ID` หรือ `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- รายละเอียดการตั้งค่า Android ทั้งหมด: [แอป Android](/th/platforms/android)

## การทดสอบจริง: smoke ของโมเดล (คีย์โปรไฟล์)

การทดสอบจริงถูกแบ่งเป็นสองชั้นเพื่อให้เราแยกความล้มเหลวได้:

- "โมเดลโดยตรง" บอกเราว่าผู้ให้บริการ/โมเดลตอบได้ด้วยคีย์ที่ให้มาหรือไม่
- "smoke ของ Gateway" บอกเราว่าท่อส่งงาน Gateway+เอเจนต์ทั้งหมดทำงานสำหรับโมเดลนั้นหรือไม่ (เซสชัน, ประวัติ, เครื่องมือ, นโยบาย sandbox ฯลฯ)

### ชั้นที่ 1: การเติมเต็มจากโมเดลโดยตรง (ไม่มี Gateway)

- การทดสอบ: `src/agents/models.profiles.live.test.ts`
- เป้าหมาย:
  - แจกแจงโมเดลที่ค้นพบ
  - ใช้ `getApiKeyForModel` เพื่อเลือกโมเดลที่คุณมีข้อมูลรับรอง
  - รันการเติมเต็มขนาดเล็กต่อโมเดล (และการถดถอยแบบเจาะจงเมื่อจำเป็น)
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- ตั้งค่า `OPENCLAW_LIVE_MODELS=modern`, `small` หรือ `all` (นามแฝงของ modern) เพื่อรันชุดทดสอบนี้จริง มิฉะนั้นจะข้ามเพื่อให้ `pnpm test:live` มุ่งเน้นที่ smoke ของ Gateway
- วิธีเลือกโมเดล:
  - `OPENCLAW_LIVE_MODELS=modern` เพื่อรันรายการอนุญาตสมัยใหม่ (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 5.1, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small` เพื่อรันรายการอนุญาตโมเดลขนาดเล็กแบบจำกัด (เส้นทาง Qwen 8B/9B ที่เข้ากันได้กับภายในเครื่อง, Ollama Gemma, OpenRouter Qwen/GLM และ Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` เป็นนามแฝงของรายการอนุญาตสมัยใหม่
  - หรือ `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (รายการอนุญาตคั่นด้วยจุลภาค)
  - การรันโมเดลขนาดเล็กของ Ollama ภายในเครื่องมีค่าเริ่มต้นเป็น `http://127.0.0.1:11434`; ตั้งค่า `OPENCLAW_LIVE_OLLAMA_BASE_URL` เฉพาะสำหรับปลายทาง LAN, กำหนดเอง หรือ Ollama Cloud
  - การไล่ตรวจแบบ modern/all และ small มีค่าเริ่มต้นเป็นเพดานที่คัดสรรไว้ ตั้งค่า `OPENCLAW_LIVE_MAX_MODELS=0` สำหรับการไล่ตรวจโปรไฟล์ที่เลือกแบบครบถ้วน หรือจำนวนบวกสำหรับเพดานที่เล็กลง
  - การไล่ตรวจแบบครบถ้วนใช้ `OPENCLAW_LIVE_TEST_TIMEOUT_MS` เป็นเวลาหมดเวลาของการทดสอบโมเดลโดยตรงทั้งหมด ค่าเริ่มต้น: 60 นาที
  - โพรบโมเดลโดยตรงรันด้วยความขนาน 20 ทางโดยค่าเริ่มต้น ตั้งค่า `OPENCLAW_LIVE_MODEL_CONCURRENCY` เพื่อแทนที่
- วิธีเลือกผู้ให้บริการ:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (รายการอนุญาตคั่นด้วยจุลภาค)
- แหล่งที่มาของคีย์:
  - โดยค่าเริ่มต้น: ที่เก็บโปรไฟล์และทางเลือกสำรองจาก env
  - ตั้งค่า `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้เฉพาะ **ที่เก็บโปรไฟล์**
- เหตุผลที่มีสิ่งนี้:
  - แยก "API ผู้ให้บริการเสีย / คีย์ไม่ถูกต้อง" ออกจาก "ท่อส่งงานเอเจนต์ของ Gateway เสีย"
  - มีการถดถอยขนาดเล็กแบบแยกส่วน (ตัวอย่าง: การเล่นซ้ำเหตุผลของ OpenAI Responses/Codex Responses + โฟลว์การเรียกเครื่องมือ)

### ชั้นที่ 2: Gateway + smoke ของเอเจนต์ dev (สิ่งที่ "@openclaw" ทำจริง)

- การทดสอบ: `src/gateway/gateway-models.profiles.live.test.ts`
- เป้าหมาย:
  - เริ่ม Gateway ในโปรเซส
  - สร้าง/แพตช์เซสชัน `agent:dev:*` (แทนที่โมเดลต่อการรัน)
  - วนผ่านโมเดลที่มีคีย์และยืนยันว่า:
    - การตอบกลับ "มีความหมาย" (ไม่มีเครื่องมือ)
    - การเรียกเครื่องมือจริงทำงาน (โพรบการอ่าน)
    - โพรบเครื่องมือเพิ่มเติมแบบไม่บังคับ (โพรบ exec+read)
    - เส้นทางการถดถอยของ OpenAI (เฉพาะการเรียกเครื่องมือ → ตามต่อ) ยังทำงาน
- รายละเอียดโพรบ (เพื่อให้คุณอธิบายความล้มเหลวได้เร็ว):
  - โพรบ `read`: การทดสอบเขียนไฟล์ nonce ในเวิร์กสเปซและขอให้เอเจนต์ `read` ไฟล์นั้นแล้วสะท้อน nonce กลับมา
  - โพรบ `exec+read`: การทดสอบขอให้เอเจนต์ `exec` เพื่อเขียน nonce ลงไฟล์ชั่วคราว แล้ว `read` กลับมา
  - โพรบรูปภาพ: การทดสอบแนบ PNG ที่สร้างขึ้น (แมว + โค้ดสุ่ม) และคาดว่าโมเดลจะคืนค่า `cat <CODE>`
  - อ้างอิงการใช้งาน: `src/gateway/gateway-models.profiles.live.test.ts` และ `test/helpers/live-image-probe.ts`
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- วิธีเลือกโมเดล:
  - ค่าเริ่มต้น: รายการอนุญาตสมัยใหม่ (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` เพื่อรันรายการอนุญาตโมเดลขนาดเล็กแบบจำกัดเดียวกันผ่านท่อส่งงาน Gateway+เอเจนต์เต็มรูปแบบ
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` เป็นนามแฝงของรายการอนุญาตสมัยใหม่
  - หรือตั้งค่า `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (หรือรายการคั่นด้วยจุลภาค) เพื่อจำกัดขอบเขต
  - การไล่ตรวจ Gateway แบบ modern/all และ small มีค่าเริ่มต้นเป็นเพดานที่คัดสรรไว้ ตั้งค่า `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` สำหรับการไล่ตรวจที่เลือกแบบครบถ้วน หรือจำนวนบวกสำหรับเพดานที่เล็กลง
- วิธีเลือกผู้ให้บริการ (หลีกเลี่ยง "OpenRouter ทุกอย่าง"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (รายการอนุญาตคั่นด้วยจุลภาค)
- โพรบเครื่องมือ + รูปภาพเปิดใช้อยู่เสมอในการทดสอบจริงนี้:
  - โพรบ `read` + โพรบ `exec+read` (ความเครียดของเครื่องมือ)
  - โพรบรูปภาพจะรันเมื่อโมเดลประกาศว่ารองรับอินพุตรูปภาพ
  - โฟลว์ (ระดับสูง):
    - การทดสอบสร้าง PNG ขนาดเล็กที่มี "CAT" + โค้ดสุ่ม (`test/helpers/live-image-probe.ts`)
    - ส่งผ่าน `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway แยกวิเคราะห์ไฟล์แนบเป็น `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - เอเจนต์ที่ฝังอยู่ส่งข้อความผู้ใช้แบบหลายโมดัลไปยังโมเดล
    - การยืนยัน: คำตอบมี `cat` + โค้ด (ความทนทาน OCR: อนุญาตข้อผิดพลาดเล็กน้อย)

<Tip>
หากต้องการดูว่าคุณทดสอบอะไรได้บนเครื่องของคุณ (และรหัส `provider/model` ที่แน่นอน) ให้รัน:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## การทดสอบจริง: smoke ของแบ็กเอนด์ CLI (Claude, Gemini หรือ CLI ภายในเครื่องอื่น)

- การทดสอบ: `src/gateway/gateway-cli-backend.live.test.ts`
- เป้าหมาย: ตรวจสอบท่อส่งงาน Gateway + เอเจนต์โดยใช้แบ็กเอนด์ CLI ภายในเครื่อง โดยไม่แตะการกำหนดค่าเริ่มต้นของคุณ
- ค่าเริ่มต้น smoke เฉพาะแบ็กเอนด์อยู่กับนิยาม `cli-backend.ts` ของส่วนขยายที่เป็นเจ้าของ
- เปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- ค่าเริ่มต้น:
  - ผู้ให้บริการ/โมเดลเริ่มต้น: `claude-cli/claude-sonnet-4-6`
  - พฤติกรรมคำสั่ง/อาร์กิวเมนต์/รูปภาพมาจากเมทาดาทา Plugin แบ็กเอนด์ CLI ที่เป็นเจ้าของ
- การแทนที่ (ไม่บังคับ):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` เพื่อส่งไฟล์แนบรูปภาพจริง (เส้นทางจะถูกฉีดเข้าไปในพรอมป์ต์) สูตร Docker ปิดค่านี้โดยค่าเริ่มต้น เว้นแต่จะร้องขออย่างชัดเจน
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` เพื่อส่งเส้นทางไฟล์รูปภาพเป็นอาร์กิวเมนต์ CLI แทนการฉีดเข้าไปในพรอมป์ต์
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (หรือ `"list"`) เพื่อควบคุมวิธีส่งอาร์กิวเมนต์รูปภาพเมื่อตั้งค่า `IMAGE_ARG`
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` เพื่อส่งเทิร์นที่สองและตรวจสอบโฟลว์การกลับมาทำต่อ
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` เพื่อเลือกเข้าร่วมโพรบความต่อเนื่องในเซสชันเดียวกันจาก Claude Sonnet -> Opus เมื่อโมเดลที่เลือกรองรับเป้าหมายการสลับ สูตร Docker ปิดค่านี้โดยค่าเริ่มต้นเพื่อความเสถียรโดยรวม
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` เพื่อเลือกเข้าร่วมโพรบลูปแบ็ก MCP/เครื่องมือ สูตร Docker ปิดค่านี้โดยค่าเริ่มต้น เว้นแต่จะร้องขออย่างชัดเจน

ตัวอย่าง:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

smoke การกำหนดค่า MCP ของ Gemini แบบประหยัด:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

สิ่งนี้ไม่ได้ขอให้ Gemini สร้างคำตอบ มันเขียนการตั้งค่าระบบเดียวกันกับที่
OpenClaw ให้ Gemini จากนั้นรัน `gemini --debug mcp list` เพื่อพิสูจน์ว่าเซิร์ฟเวอร์
`transport: "streamable-http"` ที่บันทึกไว้ถูกทำให้เป็นรูปแบบ HTTP MCP ของ Gemini
และเชื่อมต่อกับเซิร์ฟเวอร์ MCP แบบ streamable-HTTP ภายในเครื่องได้

สูตร Docker:

```bash
pnpm test:docker:live-cli-backend
```

สูตร Docker แบบผู้ให้บริการเดียว:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

หมายเหตุ:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-cli-backend-docker.sh`
- มันรัน smoke ของแบ็กเอนด์ CLI จริงภายในอิมเมจ Docker ของ repo ในฐานะผู้ใช้ `node` ที่ไม่ใช่ root
- มันแก้ไขเมทาดาทา smoke ของ CLI จากส่วนขยายที่เป็นเจ้าของ จากนั้นติดตั้งแพ็กเกจ CLI ของ Linux ที่ตรงกัน (`@anthropic-ai/claude-code` หรือ `@google/gemini-cli`) ลงใน prefix ที่เขียนได้และมีแคชที่ `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`)
- `pnpm test:docker:live-cli-backend:claude-subscription` ต้องใช้ OAuth การสมัครสมาชิก Claude Code แบบพกพา ผ่าน `~/.claude/.credentials.json` ที่มี `claudeAiOauth.subscriptionType` หรือ `CLAUDE_CODE_OAUTH_TOKEN` จาก `claude setup-token` มันพิสูจน์ `claude -p` โดยตรงใน Docker ก่อน จากนั้นรันแบ็กเอนด์ CLI ของ Gateway สองเทิร์นโดยไม่คง env var คีย์ API ของ Anthropic ไว้ เลนการสมัครสมาชิกนี้ปิดโพรบ MCP/เครื่องมือและรูปภาพของ Claude โดยค่าเริ่มต้น เพราะมันใช้โควตาการใช้งานของการสมัครสมาชิกที่ลงชื่อเข้าใช้ และ Anthropic สามารถเปลี่ยนพฤติกรรมการคิดค่าบริการและการจำกัดอัตราของ Claude Agent SDK / `claude -p` ได้โดยไม่ต้องมีรุ่น OpenClaw
- ตอนนี้ smoke ของแบ็กเอนด์ CLI จริงทดสอบโฟลว์ต้นทางถึงปลายทางเดียวกันสำหรับ Claude และ Gemini: เทิร์นข้อความ, เทิร์นจำแนกรูปภาพ แล้วตามด้วยการเรียกเครื่องมือ MCP `cron` ที่ตรวจสอบผ่าน CLI ของ Gateway
- smoke เริ่มต้นของ Claude ยังแพตช์เซสชันจาก Sonnet เป็น Opus และตรวจสอบว่าเซสชันที่กลับมาทำต่อยังจำบันทึกก่อนหน้าได้

## การทดสอบจริง: ความสามารถในการเข้าถึงพร็อกซี APNs HTTP/2

- การทดสอบ: `src/infra/push-apns-http2.live.test.ts`
- เป้าหมาย: เจาะอุโมงค์ผ่านพร็อกซี HTTP CONNECT ภายในเครื่องไปยังปลายทาง APNs sandbox ของ Apple ส่งคำขอตรวจสอบ APNs HTTP/2 และยืนยันว่าคำตอบ `403 InvalidProviderToken` จริงของ Apple กลับมาผ่านเส้นทางพร็อกซี
- เปิดใช้:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- เวลาหมดเวลาแบบไม่บังคับ:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## การทดสอบจริง: smoke การ bind ของ ACP (`/acp spawn ... --bind here`)

- การทดสอบ: `src/gateway/gateway-acp-bind.live.test.ts`
- เป้าหมาย: ตรวจสอบโฟลว์ bind การสนทนา ACP จริงกับเอเจนต์ ACP แบบ live:
  - ส่ง `/acp spawn <agent> --bind here`
  - bind การสนทนา message-channel สังเคราะห์ไว้ที่เดิม
  - ส่ง follow-up ปกติในบทสนทนาเดียวกันนั้น
  - ตรวจสอบว่า follow-up ไปอยู่ใน transcript ของเซสชัน ACP ที่ bind แล้ว
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
  - เลนนี้ใช้พื้นผิว `chat.send` ของ gateway พร้อมฟิลด์ originating-route สังเคราะห์สำหรับผู้ดูแลเท่านั้น เพื่อให้การทดสอบแนบบริบท message-channel ได้โดยไม่ต้องแสร้งว่าส่งออกไปภายนอก
  - เมื่อไม่ได้ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` การทดสอบจะใช้รีจิสทรีเอเจนต์ในตัวของ Plugin `acpx` ที่ฝังมากับเอเจนต์ harness ACP ที่เลือกไว้
  - การสร้าง MCP ของ cron สำหรับเซสชันที่ bind แล้วเป็นแบบพยายามให้ดีที่สุดโดยค่าเริ่มต้น เพราะ harness ACP ภายนอกอาจยกเลิกการเรียก MCP หลังจาก proof ของ bind/image ผ่านแล้ว; ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` เพื่อทำให้การ probe cron หลัง bind นั้นเข้มงวด

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

- Docker runner อยู่ที่ `scripts/test-live-acp-bind-docker.sh`
- โดยค่าเริ่มต้น จะรัน ACP bind smoke กับเอเจนต์ CLI live แบบรวมตามลำดับ: `claude`, `codex`, แล้ว `gemini`
- ใช้ `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, หรือ `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` เพื่อจำกัดเมทริกซ์
- จะจัดเตรียมวัสดุ auth ของ CLI ที่ตรงกันเข้าไปในคอนเทนเนอร์ จากนั้นติดตั้ง CLI live ที่ร้องขอ (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid ผ่าน `https://app.factory.ai/cli`, `@google/gemini-cli`, หรือ `opencode-ai`) หากยังไม่มี แบ็กเอนด์ ACP เองคือแพ็กเกจ `acpx/runtime` ที่ฝังมาจาก Plugin `acpx` อย่างเป็นทางการ
- ตัวแปร Docker ของ Droid จะจัดเตรียม `~/.factory` สำหรับการตั้งค่า, ส่งต่อ `FACTORY_API_KEY`, และต้องใช้ API key นั้น เพราะ auth แบบ Factory OAuth/keyring ภายในเครื่องไม่สามารถพกพาเข้าไปในคอนเทนเนอร์ได้ โดยใช้รายการรีจิสทรีในตัวของ ACPX คือ `droid exec --output-format acp`
- ตัวแปร Docker ของ OpenCode เป็นเลน regression สำหรับเอเจนต์เดี่ยวแบบเข้มงวด โดยเขียนโมเดลเริ่มต้น `OPENCODE_CONFIG_CONTENT` ชั่วคราวจาก `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (ค่าเริ่มต้น `opencode/kimi-k2.6`) และ `pnpm test:docker:live-acp-bind:opencode` ต้องมี transcript ของ assistant ที่ bind แล้ว แทนที่จะยอมรับการข้ามหลัง bind แบบทั่วไป
- การเรียก CLI `acpx` โดยตรงเป็นเพียงเส้นทาง manual/workaround สำหรับเปรียบเทียบพฤติกรรมภายนอก Gateway เท่านั้น ACP bind smoke ของ Docker ทดสอบแบ็กเอนด์ runtime `acpx` ที่ฝังมากับ OpenClaw

## Live: smoke ของ harness app-server Codex

- เป้าหมาย: ตรวจสอบ harness Codex ที่ Plugin เป็นเจ้าของผ่านเมธอด `agent`
  ของ Gateway ปกติ:
  - โหลด Plugin `codex` ที่ bundled มา
  - เลือก `openai/gpt-5.5` ซึ่งกำหนด route ให้เทิร์นเอเจนต์ OpenAI ผ่าน Codex โดยค่าเริ่มต้น
  - ส่งเทิร์นแรกของเอเจนต์ Gateway ไปที่ `openai/gpt-5.5` โดยเลือก harness Codex
  - ส่งเทิร์นที่สองไปยังเซสชัน OpenClaw เดียวกันและตรวจสอบว่า thread
    app-server resume ได้
  - รัน `/codex status` และ `/codex models` ผ่าน path คำสั่ง Gateway เดียวกัน
  - เลือกรัน probe shell แบบ escalated ที่ Guardian ตรวจทานแล้วสองรายการ: คำสั่งที่ไม่เป็นอันตราย
    ซึ่งควรได้รับอนุมัติ และการอัปโหลด fake-secret ที่ควรถูกปฏิเสธ
    เพื่อให้เอเจนต์ถามกลับ
- การทดสอบ: `src/gateway/gateway-codex-harness.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- โมเดลเริ่มต้น: `openai/gpt-5.5`
- probe รูปภาพแบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- probe MCP/tool แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- probe Guardian แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke บังคับ provider/model `agentRuntime.id: "codex"` เพื่อให้ harness Codex
  ที่เสียไม่สามารถผ่านได้ด้วยการ fallback กลับไปที่ OpenClaw แบบเงียบ ๆ
- Auth: auth ของ app-server Codex จากการเข้าสู่ระบบ subscription Codex ภายในเครื่อง Docker
  smoke ยังสามารถให้ `OPENAI_API_KEY` สำหรับ probe ที่ไม่ใช่ Codex เมื่อใช้ได้
  รวมถึงคัดลอก `~/.codex/auth.json` และ `~/.codex/config.toml` แบบเลือกได้

สูตรภายในเครื่อง:

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

- Docker runner อยู่ที่ `scripts/test-live-codex-harness-docker.sh`
- จะส่งผ่าน `OPENAI_API_KEY`, คัดลอกไฟล์ auth ของ Codex CLI เมื่อมี, ติดตั้ง
  `@openai/codex` ลงใน prefix npm
  ที่ mount แบบเขียนได้, จัดเตรียม source tree, จากนั้นรันเฉพาะการทดสอบ live ของ Codex-harness
- Docker เปิดใช้ probe รูปภาพ, MCP/tool, และ Guardian โดยค่าเริ่มต้น ตั้งค่า
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` เมื่อคุณต้องการการรัน debug
  ที่แคบลง
- Docker ใช้ config runtime Codex แบบชัดเจนเดียวกัน ดังนั้น alias เก่าหรือ OpenClaw
  fallback จึงไม่สามารถซ่อน regression ของ harness Codex ได้

### สูตร live ที่แนะนำ

allowlist ที่แคบและชัดเจนเร็วที่สุดและ flaky น้อยที่สุด:

- โมเดลเดี่ยว, โดยตรง (ไม่ผ่าน Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- profile โดยตรงของ small-model:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- profile Gateway ของ small-model:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- smoke ของ Ollama Cloud API:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- โมเดลเดี่ยว, Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การเรียก tool ข้ามหลาย provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- smoke โดยตรงของ Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- โฟกัส Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- smoke ของ Google adaptive thinking:
  - ค่าเริ่มต้นไดนามิก Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - งบประมาณไดนามิก Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

หมายเหตุ:

- `google/...` ใช้ Gemini API (API key)
- `google-antigravity/...` ใช้ bridge OAuth ของ Antigravity (endpoint เอเจนต์แบบ Cloud Code Assist)
- `google-gemini-cli/...` ใช้ Gemini CLI ภายในเครื่องของคุณ (auth แยกต่างหาก + ความแปลกเฉพาะของ tooling)
- Gemini API เทียบกับ Gemini CLI:
  - API: OpenClaw เรียก Gemini API ที่ Google โฮสต์ผ่าน HTTP (API key / profile auth); นี่คือสิ่งที่ผู้ใช้ส่วนใหญ่หมายถึงเมื่อพูดถึง "Gemini"
  - CLI: OpenClaw shell out ไปยังไบนารี `gemini` ภายในเครื่อง; มี auth ของตัวเองและอาจมีพฤติกรรมต่างกัน (การรองรับ streaming/tool/version skew)

## Live: เมทริกซ์โมเดล (สิ่งที่เราครอบคลุม)

ไม่มี "รายการโมเดล CI" แบบตายตัว (live เป็นแบบ opt-in) แต่นี่คือโมเดลที่ **แนะนำ** ให้ครอบคลุมเป็นประจำบนเครื่อง dev ที่มี key

### ชุด smoke สมัยใหม่ (การเรียก tool + รูปภาพ)

นี่คือการรัน "common models" ที่เราคาดหวังว่าจะยังทำงานได้ต่อไป:

- OpenAI (ไม่ใช่ Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` และ `google/gemini-3-flash-preview` (หลีกเลี่ยงโมเดล Gemini 2.x ที่เก่ากว่า)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` และ `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` และ `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (API ทั่วไป) หรือ `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

รัน Gateway smoke พร้อม tool + รูปภาพ:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### พื้นฐาน: การเรียก tool (Read + Exec แบบเลือกได้)

เลือกอย่างน้อยหนึ่งรายการต่อ provider family:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (หรือ `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (API ทั่วไป) หรือ `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

ความครอบคลุมเพิ่มเติมแบบเลือกได้ (มีไว้ก็ดี):

- xAI: `xai/grok-4.3` (หรือเวอร์ชันล่าสุดที่มี)
- Mistral: `mistral/`… (เลือกโมเดลที่รองรับ "tools" หนึ่งตัวที่คุณเปิดใช้ไว้)
- Cerebras: `cerebras/`… (ถ้าคุณมีสิทธิ์เข้าถึง)
- LM Studio: `lmstudio/`… (ภายในเครื่อง; การเรียก tool ขึ้นอยู่กับโหมด API)

### Vision: การส่งรูปภาพ (ไฟล์แนบ → ข้อความ multimodal)

รวมโมเดลที่รองรับรูปภาพอย่างน้อยหนึ่งตัวใน `OPENCLAW_LIVE_GATEWAY_MODELS` (ตัวแปรที่รองรับ vision ของ Claude/Gemini/OpenAI ฯลฯ) เพื่อทดสอบ probe รูปภาพ

### Aggregators / Gateway ทางเลือก

ถ้าคุณเปิดใช้ key ไว้ เรายังรองรับการทดสอบผ่าน:

- OpenRouter: `openrouter/...` (โมเดลหลายร้อยตัว; ใช้ `openclaw models scan` เพื่อค้นหา candidate ที่รองรับ tool+image)
- OpenCode: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go (auth ผ่าน `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

provider เพิ่มเติมที่คุณรวมในเมทริกซ์ live ได้ (ถ้าคุณมี creds/config):

- ในตัว: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- ผ่าน `models.providers` (ปลายทางแบบกำหนดเอง): `minimax` (คลาวด์/API) รวมถึงพร็อกซีใดๆ ที่เข้ากันได้กับ OpenAI/Anthropic (LM Studio, vLLM, LiteLLM ฯลฯ)

<Tip>
อย่าฮาร์ดโค้ด "โมเดลทั้งหมด" ในเอกสาร รายการที่เชื่อถือได้คือสิ่งที่ `discoverModels(...)` ส่งคืนบนเครื่องของคุณ บวกกับคีย์ใดๆ ที่พร้อมใช้งาน
</Tip>

## ข้อมูลรับรอง (ห้าม commit)

การทดสอบสดค้นหาข้อมูลรับรองด้วยวิธีเดียวกับที่ CLI ใช้ ผลที่ตามมาในทางปฏิบัติ:

- ถ้า CLI ทำงานได้ การทดสอบสดควรพบคีย์เดียวกัน
- ถ้าการทดสอบสดแจ้งว่า "ไม่มีข้อมูลรับรอง" ให้ดีบักแบบเดียวกับที่คุณจะดีบัก `openclaw models list` / การเลือกโมเดล

- โปรไฟล์การตรวจสอบสิทธิ์ต่อเอเจนต์: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (นี่คือความหมายของ "คีย์โปรไฟล์" ในการทดสอบสด)
- การกำหนดค่า: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรีสถานะเดิม: `~/.openclaw/credentials/` (จะถูกคัดลอกไปยังโฮมทดสอบสดที่จัดเตรียมไว้เมื่อมีอยู่ แต่ไม่ใช่ที่เก็บคีย์โปรไฟล์หลัก)
- การรันสดในเครื่องจะคัดลอกการกำหนดค่าที่ใช้งานอยู่ ไฟล์ `auth-profiles.json` ต่อเอเจนต์, `credentials/` เดิม และไดเรกทอรีการตรวจสอบสิทธิ์ CLI ภายนอกที่รองรับไปยังโฮมทดสอบชั่วคราวตามค่าเริ่มต้น โฮมสดที่จัดเตรียมไว้จะข้าม `workspace/` และ `sandboxes/` และลบการแทนที่พาธ `agents.*.workspace` / `agentDir` เพื่อให้โพรบไม่แตะพื้นที่ทำงานจริงบนโฮสต์ของคุณ

ถ้าคุณต้องการพึ่งพาคีย์จาก env ให้ export ก่อนการทดสอบในเครื่อง หรือใช้
ตัวรัน Docker ด้านล่างพร้อม `OPENCLAW_PROFILE_FILE` ที่ระบุอย่างชัดเจน

## Deepgram สด (การถอดเสียงเสียง)

- การทดสอบ: `extensions/deepgram/audio.live.test.ts`
- เปิดใช้: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## แผนการเขียนโค้ด BytePlus สด

- การทดสอบ: `extensions/byteplus/live.test.ts`
- เปิดใช้: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- การแทนที่โมเดลเพิ่มเติม: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## สื่อเวิร์กโฟลว์ ComfyUI สด

- การทดสอบ: `extensions/comfy/comfy.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- ขอบเขต:
  - ทดสอบเส้นทางภาพ วิดีโอ และ `music_generate` ของ comfy ที่ bundled มา
  - ข้ามแต่ละความสามารถ เว้นแต่ว่า `plugins.entries.comfy.config.<capability>` ถูกกำหนดค่าไว้
  - มีประโยชน์หลังจากเปลี่ยนการส่งเวิร์กโฟลว์ comfy, polling, การดาวน์โหลด หรือการลงทะเบียน Plugin

## การสร้างภาพสด

- การทดสอบ: `test/image-generation.runtime.live.test.ts`
- คำสั่ง: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- ขอบเขต:
  - ไล่ตรวจทุก Plugin ผู้ให้บริการสร้างภาพที่ลงทะเบียนไว้
  - ใช้ตัวแปร env ของผู้ให้บริการที่ export ไว้แล้วก่อนทำโพรบ
  - ใช้คีย์ API สด/env ก่อนโปรไฟล์การตรวจสอบสิทธิ์ที่จัดเก็บไว้ตามค่าเริ่มต้น เพื่อให้คีย์ทดสอบที่ค้างอยู่ใน `auth-profiles.json` ไม่บดบังข้อมูลรับรอง shell จริง
  - ข้ามผู้ให้บริการที่ไม่มีการตรวจสอบสิทธิ์/โปรไฟล์/โมเดลที่ใช้งานได้
  - รันผู้ให้บริการแต่ละรายที่กำหนดค่าไว้ผ่านรันไทม์การสร้างภาพร่วม:
    - `<provider>:generate`
    - `<provider>:edit` เมื่อผู้ให้บริการประกาศว่ารองรับการแก้ไข
- ผู้ให้บริการ bundled ปัจจุบันที่ครอบคลุม:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- การจำกัดขอบเขตเพิ่มเติม:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- พฤติกรรมการตรวจสอบสิทธิ์เพิ่มเติม:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การตรวจสอบสิทธิ์จากที่เก็บโปรไฟล์และละเว้นการแทนที่ที่มีเฉพาะ env

สำหรับเส้นทาง CLI ที่จัดส่ง ให้เพิ่ม smoke `infer` หลังจากการทดสอบสดของผู้ให้บริการ/รันไทม์
ผ่านแล้ว:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

ส่วนนี้ครอบคลุมการแยกวิเคราะห์อาร์กิวเมนต์ CLI, การแก้ไขการกำหนดค่า/เอเจนต์เริ่มต้น, การเปิดใช้งาน
Plugin bundled, รันไทม์การสร้างภาพร่วม และคำขอผู้ให้บริการสด
คาดว่า dependency ของ Plugin จะมีอยู่ก่อนโหลดรันไทม์

## การสร้างเพลงสด

- การทดสอบ: `extensions/music-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างเพลง bundled ร่วม
  - ปัจจุบันครอบคลุม Google และ MiniMax
  - ใช้ตัวแปร env ของผู้ให้บริการที่ export ไว้แล้วก่อนทำโพรบ
  - ใช้คีย์ API สด/env ก่อนโปรไฟล์การตรวจสอบสิทธิ์ที่จัดเก็บไว้ตามค่าเริ่มต้น เพื่อให้คีย์ทดสอบที่ค้างอยู่ใน `auth-profiles.json` ไม่บดบังข้อมูลรับรอง shell จริง
  - ข้ามผู้ให้บริการที่ไม่มีการตรวจสอบสิทธิ์/โปรไฟล์/โมเดลที่ใช้งานได้
  - รันโหมดรันไทม์ทั้งสองที่ประกาศไว้เมื่อพร้อมใช้งาน:
    - `generate` พร้อมอินพุตเฉพาะพรอมป์
    - `edit` เมื่อผู้ให้บริการประกาศ `capabilities.edit.enabled`
  - ความครอบคลุมของเลนร่วมปัจจุบัน:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ไฟล์สด Comfy แยกต่างหาก ไม่ใช่ sweep ร่วมนี้
- การจำกัดขอบเขตเพิ่มเติม:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- พฤติกรรมการตรวจสอบสิทธิ์เพิ่มเติม:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การตรวจสอบสิทธิ์จากที่เก็บโปรไฟล์และละเว้นการแทนที่ที่มีเฉพาะ env

## การสร้างวิดีโอสด

- การทดสอบ: `extensions/video-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างวิดีโอ bundled ร่วม
  - ใช้ค่าเริ่มต้นเป็นเส้นทาง smoke ที่ปลอดภัยสำหรับรีลีส: ผู้ให้บริการที่ไม่ใช่ FAL, คำขอ text-to-video หนึ่งรายการต่อผู้ให้บริการ, พรอมป์กุ้งล็อบสเตอร์หนึ่งวินาที และเพดานการดำเนินการต่อผู้ให้บริการจาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` ตามค่าเริ่มต้น)
  - ข้าม FAL ตามค่าเริ่มต้นเพราะเวลาแฝงของคิวฝั่งผู้ให้บริการอาจกินเวลาของรีลีสเป็นหลัก ส่ง `--video-providers fal` หรือ `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` เพื่อรันโดยชัดเจน
  - ใช้ตัวแปร env ของผู้ให้บริการที่ export ไว้แล้วก่อนทำโพรบ
  - ใช้คีย์ API สด/env ก่อนโปรไฟล์การตรวจสอบสิทธิ์ที่จัดเก็บไว้ตามค่าเริ่มต้น เพื่อให้คีย์ทดสอบที่ค้างอยู่ใน `auth-profiles.json` ไม่บดบังข้อมูลรับรอง shell จริง
  - ข้ามผู้ให้บริการที่ไม่มีการตรวจสอบสิทธิ์/โปรไฟล์/โมเดลที่ใช้งานได้
  - รันเฉพาะ `generate` ตามค่าเริ่มต้น
  - ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรันโหมด transform ที่ประกาศไว้ด้วยเมื่อพร้อมใช้งาน:
    - `imageToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.imageToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตภาพในเครื่องที่มี buffer รองรับใน sweep ร่วม
    - `videoToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.videoToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตวิดีโอในเครื่องที่มี buffer รองรับใน sweep ร่วม
  - ผู้ให้บริการ `imageToVideo` ที่ประกาศไว้แต่ถูกข้ามในปัจจุบันใน sweep ร่วม:
    - `vydra` เพราะ `veo3` ที่ bundled มาเป็นแบบ text-only และ `kling` ที่ bundled มาต้องใช้ URL ภาพระยะไกล
  - ความครอบคลุมเฉพาะผู้ให้บริการของ Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ไฟล์นั้นรัน text-to-video ของ `veo3` พร้อมเลน `kling` ที่ใช้ fixture URL ภาพระยะไกลตามค่าเริ่มต้น
  - ความครอบคลุมสดของ `videoToVideo` ปัจจุบัน:
    - `runway` เฉพาะเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`
  - ผู้ให้บริการ `videoToVideo` ที่ประกาศไว้แต่ถูกข้ามในปัจจุบันใน sweep ร่วม:
    - `alibaba`, `qwen`, `xai` เพราะเส้นทางเหล่านั้นปัจจุบันต้องใช้ URL อ้างอิง `http(s)` / MP4 ระยะไกล
    - `google` เพราะเลน Gemini/Veo ร่วมปัจจุบันใช้อินพุตในเครื่องที่มี buffer รองรับ และเส้นทางนั้นไม่ได้รับการยอมรับใน sweep ร่วม
    - `openai` เพราะเลนร่วมปัจจุบันไม่มีการรับประกันสิทธิ์เข้าถึงการแก้ไขวิดีโอเฉพาะองค์กร
- การจำกัดขอบเขตเพิ่มเติม:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` เพื่อรวมผู้ให้บริการทุกตัวใน sweep เริ่มต้น รวมถึง FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` เพื่อลดเพดานการดำเนินการของผู้ให้บริการแต่ละรายสำหรับ smoke run แบบเข้มงวด
- พฤติกรรมการตรวจสอบสิทธิ์เพิ่มเติม:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การตรวจสอบสิทธิ์จากที่เก็บโปรไฟล์และละเว้นการแทนที่ที่มีเฉพาะ env

## Harness สื่อสด

- คำสั่ง: `pnpm test:live:media`
- วัตถุประสงค์:
  - รันชุดทดสอบสดของภาพ เพลง และวิดีโอร่วมผ่าน entrypoint ดั้งเดิมของ repo เพียงจุดเดียว
  - ใช้ตัวแปร env ของผู้ให้บริการที่ export ไว้แล้ว
  - จำกัดแต่ละชุดให้เหลือผู้ให้บริการที่มีการตรวจสอบสิทธิ์ที่ใช้งานได้ในปัจจุบันโดยอัตโนมัติตามค่าเริ่มต้น
  - ใช้ `scripts/test-live.mjs` ซ้ำ ดังนั้นพฤติกรรม Heartbeat และโหมดเงียบจึงยังคงสอดคล้องกัน
- ตัวอย่าง:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing) - ชุดทดสอบ unit, integration, QA และ Docker
