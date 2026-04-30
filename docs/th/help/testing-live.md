---
read_when:
    - การรันชุดทดสอบ smoke ของเมทริกซ์โมเดลแบบสด / แบ็กเอนด์ CLI / ACP / ผู้ให้บริการสื่อ
    - การแก้ไขจุดบกพร่องการระบุข้อมูลประจำตัวสำหรับการทดสอบแบบสด
    - การเพิ่มการทดสอบจริงใหม่สำหรับผู้ให้บริการเฉพาะราย
sidebarTitle: Live tests
summary: 'การทดสอบแบบสด (ที่ต้องติดต่อเครือข่าย): เมทริกซ์โมเดล, แบ็กเอนด์ CLI, ACP, ผู้ให้บริการสื่อ, ข้อมูลประจำตัว'
title: 'การทดสอบ: ชุดทดสอบแบบสด'
x-i18n:
    generated_at: "2026-04-30T09:58:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01684475a08296e08e70c339c6d1a689fad8640bf747e8c72b6854045a70451e
    source_path: help/testing-live.md
    workflow: 16
---

สำหรับเริ่มต้นใช้งานอย่างรวดเร็ว, ตัวรัน QA, ชุดทดสอบหน่วย/บูรณาการ และโฟลว์ Docker โปรดดู
[การทดสอบ](/th/help/testing) หน้านี้ครอบคลุมชุดทดสอบ **แบบใช้งานจริง** (ที่ต้องแตะเครือข่าย):
เมทริกซ์โมเดล, แบ็กเอนด์ CLI, ACP และการทดสอบจริงของผู้ให้บริการสื่อ รวมถึง
การจัดการข้อมูลรับรอง

## แบบใช้งานจริง: คำสั่งตรวจสอบเบื้องต้นของโปรไฟล์ภายในเครื่อง

เรียกใช้ `~/.profile` ก่อนการตรวจสอบจริงแบบเฉพาะกิจ เพื่อให้คีย์ผู้ให้บริการและพาธเครื่องมือภายในเครื่อง
ตรงกับเชลล์ของคุณ:

```bash
source ~/.profile
```

การตรวจสอบสื่ออย่างปลอดภัย:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

การตรวจสอบความพร้อมการโทรด้วยเสียงอย่างปลอดภัย:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` เป็นการทดลองรันแบบไม่ทำงานจริง เว้นแต่จะมี `--yes` อยู่ด้วย ใช้ `--yes` เฉพาะ
เมื่อคุณตั้งใจต้องการโทรแจ้งเตือนจริงเท่านั้น สำหรับ Twilio, Telnyx และ
Plivo การตรวจสอบความพร้อมที่สำเร็จต้องมี URL Webhook สาธารณะ; ทางเลือกสำรองแบบ local loopback/ส่วนตัว
เท่านั้นจะถูกปฏิเสธโดยเจตนา

## แบบใช้งานจริง: การกวาดตรวจความสามารถของ Node Android

- การทดสอบ: `src/gateway/android-node.capabilities.live.test.ts`
- สคริปต์: `pnpm android:test:integration`
- เป้าหมาย: เรียกใช้ **ทุกคำสั่งที่ Node Android ที่เชื่อมต่ออยู่ประกาศไว้ในปัจจุบัน** และยืนยันพฤติกรรมสัญญาของคำสั่ง
- ขอบเขต:
  - การตั้งค่าล่วงหน้า/ด้วยตนเองตามเงื่อนไข (ชุดทดสอบนี้ไม่ติดตั้ง/รัน/จับคู่แอป)
  - การตรวจสอบ Gateway `node.invoke` ทีละคำสั่งสำหรับ Node Android ที่เลือก
- การตั้งค่าล่วงหน้าที่จำเป็น:
  - แอป Android เชื่อมต่อและจับคู่กับ Gateway แล้ว
  - ให้แอปอยู่เบื้องหน้า
  - อนุญาตสิทธิ์/ความยินยอมการจับข้อมูลสำหรับความสามารถที่คุณคาดว่าจะผ่าน
- การแทนที่เป้าหมายแบบเลือกได้:
  - `OPENCLAW_ANDROID_NODE_ID` หรือ `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- รายละเอียดการตั้งค่า Android แบบเต็ม: [แอป Android](/th/platforms/android)

## แบบใช้งานจริง: การตรวจสอบโมเดลเบื้องต้น (คีย์โปรไฟล์)

การทดสอบจริงถูกแบ่งเป็นสองชั้น เพื่อให้เราแยกความล้มเหลวได้:

- “โมเดลโดยตรง” บอกเราว่าผู้ให้บริการ/โมเดลสามารถตอบได้จริงด้วยคีย์ที่ให้มา
- “การตรวจสอบ Gateway เบื้องต้น” บอกเราว่าไปป์ไลน์ gateway+agent ทั้งหมดทำงานกับโมเดลนั้น (เซสชัน, ประวัติ, เครื่องมือ, นโยบายแซนด์บ็อกซ์ ฯลฯ)

### ชั้นที่ 1: การทำให้โมเดลตอบกลับโดยตรง (ไม่มี Gateway)

- การทดสอบ: `src/agents/models.profiles.live.test.ts`
- เป้าหมาย:
  - แจกแจงโมเดลที่ค้นพบ
  - ใช้ `getApiKeyForModel` เพื่อเลือกโมเดลที่คุณมีข้อมูลรับรอง
  - รันการตอบกลับขนาดเล็กต่อโมเดล (และการถดถอยแบบเจาะจงเมื่อจำเป็น)
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียกใช้ Vitest โดยตรง)
- ตั้งค่า `OPENCLAW_LIVE_MODELS=modern` (หรือ `all` ซึ่งเป็นนามแฝงของ modern) เพื่อรันชุดทดสอบนี้จริง; ไม่เช่นนั้นจะข้ามเพื่อให้ `pnpm test:live` โฟกัสที่การตรวจสอบ Gateway เบื้องต้น
- วิธีเลือกโมเดล:
  - `OPENCLAW_LIVE_MODELS=modern` เพื่อรัน allowlist สมัยใหม่ (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` เป็นนามแฝงของ allowlist สมัยใหม่
  - หรือ `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist คั่นด้วยจุลภาค)
  - การกวาดตรวจแบบ Modern/all ใช้เพดานที่คัดสรรให้มีสัญญาณสูงเป็นค่าเริ่มต้น; ตั้งค่า `OPENCLAW_LIVE_MAX_MODELS=0` สำหรับการกวาดตรวจ modern แบบครบถ้วน หรือใช้จำนวนบวกสำหรับเพดานที่เล็กลง
  - การกวาดตรวจแบบครบถ้วนใช้ `OPENCLAW_LIVE_TEST_TIMEOUT_MS` เป็นเวลาหมดเวลาของการทดสอบโมเดลโดยตรงทั้งหมด ค่าเริ่มต้น: 60 นาที
  - โพรบโมเดลโดยตรงรันด้วยการขนาน 20 ทางเป็นค่าเริ่มต้น; ตั้งค่า `OPENCLAW_LIVE_MODEL_CONCURRENCY` เพื่อแทนที่
- วิธีเลือกผู้ให้บริการ:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist คั่นด้วยจุลภาค)
- คีย์มาจากที่ใด:
  - ค่าเริ่มต้น: ที่เก็บโปรไฟล์และตัวสำรองจาก env
  - ตั้งค่า `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้เฉพาะ **ที่เก็บโปรไฟล์** เท่านั้น
- เหตุผลที่มีสิ่งนี้:
  - แยก “API ของผู้ให้บริการเสีย / คีย์ไม่ถูกต้อง” ออกจาก “ไปป์ไลน์ agent ของ Gateway เสีย”
  - รวมการถดถอยขนาดเล็กที่แยกโดดเดี่ยวไว้ (ตัวอย่าง: โฟลว์การเล่นซ้ำเหตุผล + การเรียกใช้เครื่องมือของ OpenAI Responses/Codex Responses)

### ชั้นที่ 2: Gateway + การตรวจสอบ agent พัฒนาเบื้องต้น (สิ่งที่ "@openclaw" ทำจริง)

- การทดสอบ: `src/gateway/gateway-models.profiles.live.test.ts`
- เป้าหมาย:
  - เริ่ม Gateway ภายในโปรเซส
  - สร้าง/แพตช์เซสชัน `agent:dev:*` (แทนที่โมเดลต่อการรัน)
  - วนผ่านโมเดลที่มีคีย์และยืนยันว่า:
    - การตอบกลับ “มีความหมาย” (ไม่มีเครื่องมือ)
    - การเรียกใช้เครื่องมือจริงทำงานได้ (โพรบอ่าน)
    - โพรบเครื่องมือเพิ่มเติมแบบเลือกได้ (โพรบ exec+read)
    - เส้นทางการถดถอยของ OpenAI (เฉพาะการเรียกใช้เครื่องมือ → การติดตามผล) ยังทำงานอยู่
- รายละเอียดโพรบ (เพื่อให้คุณอธิบายความล้มเหลวได้เร็ว):
  - โพรบ `read`: การทดสอบเขียนไฟล์ nonce ในเวิร์กสเปซและขอให้ agent `read` ไฟล์นั้นแล้วสะท้อน nonce กลับมา
  - โพรบ `exec+read`: การทดสอบขอให้ agent ใช้ `exec` เขียน nonce ลงไฟล์ชั่วคราว แล้ว `read` กลับมา
  - โพรบรูปภาพ: การทดสอบแนบ PNG ที่สร้างขึ้น (แมว + โค้ดสุ่ม) และคาดว่าโมเดลจะส่งคืน `cat <CODE>`
  - อ้างอิงการใช้งาน: `src/gateway/gateway-models.profiles.live.test.ts` และ `src/gateway/live-image-probe.ts`
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียกใช้ Vitest โดยตรง)
- วิธีเลือกโมเดล:
  - ค่าเริ่มต้น: allowlist สมัยใหม่ (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` เป็นนามแฝงของ allowlist สมัยใหม่
  - หรือตั้งค่า `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (หรือรายการคั่นด้วยจุลภาค) เพื่อจำกัดให้แคบลง
  - การกวาดตรวจ Gateway แบบ Modern/all ใช้เพดานที่คัดสรรให้มีสัญญาณสูงเป็นค่าเริ่มต้น; ตั้งค่า `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` สำหรับการกวาดตรวจ modern แบบครบถ้วน หรือใช้จำนวนบวกสำหรับเพดานที่เล็กลง
- วิธีเลือกผู้ให้บริการ (หลีกเลี่ยง “ทุกอย่างของ OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist คั่นด้วยจุลภาค)
- โพรบเครื่องมือ + รูปภาพเปิดอยู่เสมอในการทดสอบจริงนี้:
  - โพรบ `read` + โพรบ `exec+read` (การทดสอบแรงกดของเครื่องมือ)
  - โพรบรูปภาพจะรันเมื่อโมเดลประกาศว่ารองรับอินพุตรูปภาพ
  - โฟลว์ (ระดับสูง):
    - การทดสอบสร้าง PNG ขนาดเล็กที่มี “CAT” + โค้ดสุ่ม (`src/gateway/live-image-probe.ts`)
    - ส่งผ่าน `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway แยกวิเคราะห์ไฟล์แนบเป็น `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - agent แบบฝังส่งข้อความผู้ใช้แบบหลายรูปแบบไปยังโมเดล
    - การยืนยัน: คำตอบมี `cat` + โค้ด (ความคลาดเคลื่อน OCR: อนุญาตให้ผิดพลาดเล็กน้อย)

<Tip>
หากต้องการดูว่าคุณทดสอบอะไรได้บ้างบนเครื่องของคุณ (และรหัส `provider/model` ที่แน่นอน) ให้รัน:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## แบบใช้งานจริง: การตรวจสอบเบื้องต้นของแบ็กเอนด์ CLI (Claude, Codex, Gemini หรือ CLI ภายในเครื่องอื่น)

- การทดสอบ: `src/gateway/gateway-cli-backend.live.test.ts`
- เป้าหมาย: ตรวจสอบไปป์ไลน์ Gateway + agent โดยใช้แบ็กเอนด์ CLI ภายในเครื่อง โดยไม่แตะการกำหนดค่าเริ่มต้นของคุณ
- ค่าเริ่มต้นการตรวจสอบเฉพาะแบ็กเอนด์อยู่กับนิยาม `cli-backend.ts` ของ Plugin เจ้าของ
- เปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียกใช้ Vitest โดยตรง)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- ค่าเริ่มต้น:
  - ผู้ให้บริการ/โมเดลเริ่มต้น: `claude-cli/claude-sonnet-4-6`
  - พฤติกรรมคำสั่ง/อาร์กิวเมนต์/รูปภาพมาจากเมทาดาทาของ Plugin แบ็กเอนด์ CLI เจ้าของ
- การแทนที่ (เลือกได้):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` เพื่อส่งไฟล์แนบรูปภาพจริง (พาธจะถูกฉีดเข้าไปในพรอมป์) สูตร Docker ปิดค่านี้เป็นค่าเริ่มต้น เว้นแต่จะร้องขออย่างชัดเจน
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` เพื่อส่งพาธไฟล์รูปภาพเป็นอาร์กิวเมนต์ CLI แทนการฉีดเข้าในพรอมป์
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (หรือ `"list"`) เพื่อควบคุมวิธีส่งอาร์กิวเมนต์รูปภาพเมื่อมีการตั้งค่า `IMAGE_ARG`
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` เพื่อส่งเทิร์นที่สองและตรวจสอบโฟลว์การดำเนินต่อ
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` เพื่อเลือกเข้าร่วมโพรบความต่อเนื่องในเซสชันเดียวกันจาก Claude Sonnet -> Opus เมื่อโมเดลที่เลือกสนับสนุนเป้าหมายการสลับ สูตร Docker ปิดค่านี้เป็นค่าเริ่มต้นเพื่อความน่าเชื่อถือของการรันรวม
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` เพื่อเลือกเข้าร่วมโพรบลูปแบ็ก MCP/เครื่องมือ สูตร Docker ปิดค่านี้เป็นค่าเริ่มต้น เว้นแต่จะร้องขออย่างชัดเจน

ตัวอย่าง:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

การตรวจสอบการกำหนดค่า MCP ของ Gemini แบบประหยัด:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

สิ่งนี้ไม่ได้ขอให้ Gemini สร้างคำตอบ มันเขียนการตั้งค่าระบบเดียวกันกับที่
OpenClaw ให้กับ Gemini จากนั้นรัน `gemini --debug mcp list` เพื่อพิสูจน์ว่าเซิร์ฟเวอร์
`transport: "streamable-http"` ที่บันทึกไว้ถูกทำให้เป็นรูปแบบ HTTP MCP ของ Gemini
และสามารถเชื่อมต่อกับเซิร์ฟเวอร์ MCP แบบ streamable-HTTP ภายในเครื่องได้

สูตร Docker:

```bash
pnpm test:docker:live-cli-backend
```

สูตร Docker สำหรับผู้ให้บริการเดียว:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

หมายเหตุ:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-cli-backend-docker.sh`
- มันรันการตรวจสอบจริงเบื้องต้นของแบ็กเอนด์ CLI ภายในอิมเมจ Docker ของรีโปในฐานะผู้ใช้ `node` ที่ไม่ใช่ root
- มันแก้ข้อมูลเมทาดาทาการตรวจสอบ CLI จาก Plugin เจ้าของ จากนั้นติดตั้งแพ็กเกจ CLI ของ Linux ที่ตรงกัน (`@anthropic-ai/claude-code`, `@openai/codex` หรือ `@google/gemini-cli`) ลงใน prefix แบบเขียนได้ที่แคชไว้ที่ `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`)
- `pnpm test:docker:live-cli-backend:claude-subscription` ต้องมี OAuth สำหรับการสมัครสมาชิก Claude Code ที่พกพาได้ผ่าน `~/.claude/.credentials.json` ที่มี `claudeAiOauth.subscriptionType` หรือ `CLAUDE_CODE_OAUTH_TOKEN` จาก `claude setup-token` มันพิสูจน์ `claude -p` โดยตรงใน Docker ก่อน จากนั้นรัน Gateway CLI-backend สองเทิร์นโดยไม่คงค่า env vars ของคีย์ Anthropic API ไว้ เลนการสมัครสมาชิกนี้ปิดโพรบ MCP/เครื่องมือและรูปภาพของ Claude เป็นค่าเริ่มต้น เพราะปัจจุบัน Claude จัดเส้นทางการใช้งานแอปของบุคคลที่สามผ่านการคิดค่าบริการการใช้งานเพิ่มเติมแทนขีดจำกัดแผนการสมัครสมาชิกปกติ
- ตอนนี้การตรวจสอบจริงเบื้องต้นของแบ็กเอนด์ CLI ทดสอบโฟลว์ตั้งแต่ต้นจนจบเดียวกันสำหรับ Claude, Codex และ Gemini: เทิร์นข้อความ, เทิร์นจำแนกรูปภาพ จากนั้นเรียกเครื่องมือ MCP `cron` ที่ตรวจสอบผ่าน CLI ของ Gateway
- การตรวจสอบเริ่มต้นของ Claude ยังแพตช์เซสชันจาก Sonnet เป็น Opus และตรวจสอบว่าเซสชันที่ดำเนินต่อยังจำบันทึกก่อนหน้าได้

## แบบใช้งานจริง: การตรวจสอบ bind ของ ACP (`/acp spawn ... --bind here`)

- การทดสอบ: `src/gateway/gateway-acp-bind.live.test.ts`
- เป้าหมาย: ตรวจสอบโฟลว์การผูกการสนทนา ACP จริงกับเอเจนต์ ACP แบบ live:
  - ส่ง `/acp spawn <agent> --bind here`
  - ผูกการสนทนาช่องทางข้อความสังเคราะห์ไว้ในตำแหน่งเดิม
  - ส่งการติดตามผลปกติในการสนทนาเดียวกันนั้น
  - ตรวจสอบว่าการติดตามผลไปอยู่ใน transcript ของเซสชัน ACP ที่ผูกไว้
- เปิดใช้งาน:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- ค่าเริ่มต้น:
  - เอเจนต์ ACP ใน Docker: `claude,codex,gemini`
  - เอเจนต์ ACP สำหรับ `pnpm test:live ...` โดยตรง: `claude`
  - ช่องทางสังเคราะห์: บริบทการสนทนาแบบ Slack DM
  - แบ็กเอนด์ ACP: `acpx`
- ค่าที่ใช้แทน:
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
  - เลนนี้ใช้ surface `chat.send` ของ gateway พร้อมฟิลด์เส้นทางต้นทางสังเคราะห์สำหรับผู้ดูแลระบบเท่านั้น เพื่อให้การทดสอบแนบบริบทช่องทางข้อความได้โดยไม่แสร้งว่ามีการส่งออกภายนอก
  - เมื่อไม่ได้ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` การทดสอบจะใช้รีจิสทรีเอเจนต์ในตัวของ Plugin `acpx` แบบฝังสำหรับเอเจนต์ ACP harness ที่เลือกไว้
  - การสร้าง MCP สำหรับ Cron ของเซสชันที่ผูกไว้เป็นแบบพยายามให้ดีที่สุดโดยค่าเริ่มต้น เพราะ ACP harness ภายนอกอาจยกเลิกการเรียก MCP หลังจากหลักฐานการผูก/รูปภาพผ่านแล้ว ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` เพื่อทำให้การตรวจ Cron หลังการผูกนั้นเข้มงวด

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
- โดยค่าเริ่มต้น ระบบจะรัน ACP bind smoke กับเอเจนต์ CLI แบบ live รวมตามลำดับ: `claude`, `codex`, แล้วจึง `gemini`
- ใช้ `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, หรือ `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` เพื่อจำกัดเมทริกซ์
- ระบบจะ source `~/.profile`, จัดเตรียมวัสดุการยืนยันตัวตน CLI ที่ตรงกันเข้าไปในคอนเทนเนอร์ จากนั้นติดตั้ง CLI แบบ live ที่ร้องขอ (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid ผ่าน `https://app.factory.ai/cli`, `@google/gemini-cli`, หรือ `opencode-ai`) หากยังไม่มีอยู่ แบ็กเอนด์ ACP เองคือแพ็กเกจ `acpx/runtime` แบบฝังที่ bundled มาจาก Plugin `acpx`
- ตัวแปร Docker ของ Droid จะจัดเตรียม `~/.factory` สำหรับการตั้งค่า ส่งต่อ `FACTORY_API_KEY` และต้องใช้ API key นั้น เพราะการยืนยันตัวตน Factory OAuth/keyring ภายในเครื่องไม่สามารถพกพาเข้าไปในคอนเทนเนอร์ได้ โดยใช้รายการรีจิสทรี `droid exec --output-format acp` ในตัวของ ACPX
- ตัวแปร Docker ของ OpenCode เป็นเลน regression แบบเอเจนต์เดียวที่เข้มงวด โดยเขียนโมเดลเริ่มต้น `OPENCODE_CONFIG_CONTENT` ชั่วคราวจาก `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (ค่าเริ่มต้น `opencode/kimi-k2.6`) หลังจาก source `~/.profile` และ `pnpm test:docker:live-acp-bind:opencode` ต้องมี transcript ของผู้ช่วยที่ผูกไว้ แทนที่จะยอมรับการข้ามหลังการผูกแบบทั่วไป
- การเรียก CLI `acpx` โดยตรงเป็นเพียงเส้นทางแบบ manual/workaround สำหรับเปรียบเทียบพฤติกรรมนอก Gateway เท่านั้น ACP bind smoke ของ Docker ทดสอบแบ็กเอนด์รันไทม์ `acpx` แบบฝังของ OpenClaw

## Live: smoke ของ Codex app-server harness

- เป้าหมาย: ตรวจสอบ Codex harness ที่ Plugin เป็นเจ้าของผ่านเมธอด `agent` ของ gateway ปกติ:
  - โหลด Plugin `codex` ที่ bundled มา
  - เลือก `OPENCLAW_AGENT_RUNTIME=codex`
  - ส่งเทิร์นเอเจนต์ gateway แรกไปยัง `openai/gpt-5.5` โดยบังคับใช้ Codex harness
  - ส่งเทิร์นที่สองไปยังเซสชัน OpenClaw เดิมและตรวจสอบว่าเธรด app-server สามารถ resume ได้
  - รัน `/codex status` และ `/codex models` ผ่านพาธคำสั่ง gateway เดียวกัน
  - เลือกรันการ probe เชลล์ที่ยกระดับและผ่านการตรวจของ Guardian สองรายการ: คำสั่งที่ไม่เป็นอันตรายซึ่งควรได้รับอนุมัติ และการอัปโหลด fake-secret ที่ควรถูกปฏิเสธเพื่อให้เอเจนต์ถามกลับ
- การทดสอบ: `src/gateway/gateway-codex-harness.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- โมเดลเริ่มต้น: `openai/gpt-5.5`
- การ probe รูปภาพแบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- การ probe MCP/tool แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- การ probe Guardian แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke ตั้งค่า `OPENCLAW_AGENT_HARNESS_FALLBACK=none` เพื่อให้ Codex harness ที่เสียไม่สามารถผ่านได้ด้วยการ fallback ไปยัง PI อย่างเงียบๆ
- การยืนยันตัวตน: การยืนยันตัวตน Codex app-server จากการล็อกอิน subscription ของ Codex ภายในเครื่อง smoke ของ Docker ยังสามารถระบุ `OPENAI_API_KEY` สำหรับ probe ที่ไม่ใช่ Codex เมื่อใช้ได้ รวมถึง `~/.codex/auth.json` และ `~/.codex/config.toml` ที่คัดลอกมาแบบเลือกได้

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

- Docker runner อยู่ที่ `scripts/test-live-codex-harness-docker.sh`
- ระบบจะ source `~/.profile` ที่เมานต์ไว้ ส่งผ่าน `OPENAI_API_KEY` คัดลอกไฟล์ยืนยันตัวตน Codex CLI เมื่อมีอยู่ ติดตั้ง `@openai/codex` ลงใน prefix ของ npm ที่เมานต์และเขียนได้ จัดเตรียมซอร์สทรี จากนั้นรันเฉพาะการทดสอบ live ของ Codex-harness
- Docker เปิดใช้การ probe รูปภาพ, MCP/tool และ Guardian โดยค่าเริ่มต้น ตั้งค่า `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` หรือ `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` หรือ `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` เมื่อคุณต้องการรัน debug ที่แคบลง
- Docker ยัง export `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ให้ตรงกับการตั้งค่าการทดสอบ live เพื่อให้ alias เดิมหรือการ fallback ไปยัง PI ไม่สามารถซ่อน regression ของ Codex harness ได้

### สูตร live ที่แนะนำ

allowlist ที่แคบและชัดเจนเร็วที่สุดและมีโอกาส flaky น้อยที่สุด:

- โมเดลเดียว แบบตรง (ไม่ผ่าน gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- โมเดลเดียว, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การเรียก tool ข้ามหลายผู้ให้บริการ:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- เน้น Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- smoke ของ adaptive thinking ของ Google:
  - หากคีย์ภายในเครื่องอยู่ใน shell profile: `source ~/.profile`
  - ค่าเริ่มต้นแบบ dynamic ของ Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - งบประมาณแบบ dynamic ของ Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

หมายเหตุ:

- `google/...` ใช้ Gemini API (API key)
- `google-antigravity/...` ใช้บริดจ์ Antigravity OAuth (endpoint เอเจนต์สไตล์ Cloud Code Assist)
- `google-gemini-cli/...` ใช้ Gemini CLI ภายในเครื่องของคุณ (การยืนยันตัวตนและลักษณะเฉพาะของ tooling แยกต่างหาก)
- Gemini API เทียบกับ Gemini CLI:
  - API: OpenClaw เรียก Gemini API ที่ Google โฮสต์ผ่าน HTTP (API key / การยืนยันตัวตนแบบโปรไฟล์); นี่คือสิ่งที่ผู้ใช้ส่วนใหญ่หมายถึงเมื่อพูดว่า “Gemini”
  - CLI: OpenClaw เรียก binary `gemini` ภายในเครื่องผ่านเชลล์ ซึ่งมีการยืนยันตัวตนของตัวเองและอาจมีพฤติกรรมต่างออกไป (การรองรับ streaming/tool/ความคลาดเคลื่อนของเวอร์ชัน)

## Live: เมทริกซ์โมเดล (สิ่งที่เราครอบคลุม)

ไม่มี “รายการโมเดล CI” แบบตายตัว (live เป็นแบบ opt-in) แต่นี่คือโมเดลที่ **แนะนำ** ให้ครอบคลุมเป็นประจำบนเครื่องพัฒนาที่มีคีย์

### ชุด smoke สมัยใหม่ (การเรียก tool + รูปภาพ)

นี่คือการรัน “โมเดลทั่วไป” ที่เราคาดว่าจะทำงานต่อไป:

- OpenAI (ไม่ใช่ Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` และ `google/gemini-3-flash-preview` (หลีกเลี่ยงโมเดล Gemini 2.x ที่เก่ากว่า)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` และ `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` และ `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

รัน gateway smoke พร้อม tools + รูปภาพ:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: การเรียก tool (Read + Exec แบบเลือกได้)

เลือกอย่างน้อยหนึ่งรายการต่อกลุ่มผู้ให้บริการ:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (หรือ `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

ความครอบคลุมเพิ่มเติมแบบเลือกได้ (มีไว้ก็ดี):

- xAI: `xai/grok-4` (หรือรุ่นล่าสุดที่มี)
- Mistral: `mistral/`… (เลือกโมเดลหนึ่งที่รองรับ “tools” และคุณเปิดใช้อยู่)
- Cerebras: `cerebras/`… (หากคุณมีสิทธิ์เข้าถึง)
- LM Studio: `lmstudio/`… (ภายในเครื่อง; การเรียก tool ขึ้นอยู่กับโหมด API)

### Vision: การส่งรูปภาพ (ไฟล์แนบ → ข้อความมัลติโมดัล)

รวมโมเดลที่รองรับรูปภาพอย่างน้อยหนึ่งโมเดลใน `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/ตัวแปร OpenAI ที่รองรับ vision เป็นต้น) เพื่อทดสอบ image probe

### Aggregators / gateway ทางเลือก

หากคุณเปิดใช้คีย์ไว้ เรายังรองรับการทดสอบผ่าน:

- OpenRouter: `openrouter/...` (มีหลายร้อยโมเดล; ใช้ `openclaw models scan` เพื่อค้นหาผู้สมัครที่รองรับ tool+image)
- OpenCode: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go (ยืนยันตัวตนผ่าน `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

ผู้ให้บริการเพิ่มเติมที่คุณสามารถรวมในเมทริกซ์ live ได้ (หากคุณมี creds/config):

- ในตัว: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- ผ่าน `models.providers` (endpoint แบบกำหนดเอง): `minimax` (cloud/API) รวมถึง proxy ที่เข้ากันได้กับ OpenAI/Anthropic ใดๆ (LM Studio, vLLM, LiteLLM เป็นต้น)

<Tip>
อย่า hardcode "all models" ในเอกสาร รายการที่เชื่อถือได้คือสิ่งที่ `discoverModels(...)` คืนค่าบนเครื่องของคุณ บวกกับคีย์ที่มีอยู่
</Tip>

## ข้อมูลรับรอง (ห้าม commit)

การทดสอบ live ค้นหาข้อมูลรับรองด้วยวิธีเดียวกับที่ CLI ใช้ ผลที่ตามมาในทางปฏิบัติ:

- หาก CLI ทำงาน การทดสอบแบบใช้งานจริงควรพบคีย์เดียวกัน
- หากการทดสอบแบบใช้งานจริงแจ้งว่า “ไม่มีข้อมูลประจำตัว” ให้ดีบักแบบเดียวกับที่คุณดีบัก `openclaw models list` / การเลือกโมเดล

- โปรไฟล์การยืนยันตัวตนต่อเอเจนต์: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (นี่คือความหมายของ “คีย์โปรไฟล์” ในการทดสอบแบบใช้งานจริง)
- การกำหนดค่า: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรีสถานะเดิม: `~/.openclaw/credentials/` (ถูกคัดลอกเข้าไปในโฮมสำหรับการทดสอบแบบใช้งานจริงที่จัดเตรียมไว้เมื่อมีอยู่ แต่ไม่ใช่ที่เก็บคีย์โปรไฟล์หลัก)
- การรันแบบใช้งานจริงในเครื่องจะคัดลอกการกำหนดค่าที่ใช้งานอยู่, ไฟล์ `auth-profiles.json` ต่อเอเจนต์, `credentials/` เดิม และไดเรกทอรีการยืนยันตัวตนของ CLI ภายนอกที่รองรับ เข้าไปในโฮมทดสอบชั่วคราวโดยค่าเริ่มต้น; โฮมแบบใช้งานจริงที่จัดเตรียมไว้จะข้าม `workspace/` และ `sandboxes/` และจะลบการแทนที่พาธ `agents.*.workspace` / `agentDir` ออก เพื่อให้โพรบไม่แตะ workspace จริงบนโฮสต์ของคุณ

หากคุณต้องการพึ่งพาคีย์จาก env (เช่น export ไว้ใน `~/.profile`) ให้รันการทดสอบในเครื่องหลังจาก `source ~/.profile` หรือใช้ตัวรัน Docker ด้านล่าง (ตัวรันเหล่านี้สามารถเมานต์ `~/.profile` เข้าไปในคอนเทนเนอร์ได้)

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
  - ทดสอบเส้นทางรูปภาพ วิดีโอ และ `music_generate` ของ comfy ที่บันเดิลมา
  - ข้ามแต่ละความสามารถ เว้นแต่จะกำหนดค่า `plugins.entries.comfy.config.<capability>` แล้ว
  - มีประโยชน์หลังจากเปลี่ยนการส่งเวิร์กโฟลว์ comfy, การโพล, การดาวน์โหลด หรือการลงทะเบียน Plugin

## การสร้างรูปภาพแบบใช้งานจริง

- การทดสอบ: `test/image-generation.runtime.live.test.ts`
- คำสั่ง: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ชุดทดสอบ: `pnpm test:live:media image`
- ขอบเขต:
  - แจกแจง Plugin ผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้ทุกตัว
  - โหลด env vars ของผู้ให้บริการที่ขาดหายไปจาก login shell ของคุณ (`~/.profile`) ก่อนโพรบ
  - ใช้คีย์ API แบบใช้งานจริง/env ก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้โดยค่าเริ่มต้น เพื่อไม่ให้คีย์ทดสอบเก่าใน `auth-profiles.json` บดบังข้อมูลประจำตัวจริงจาก shell
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้ได้
  - รันผู้ให้บริการที่กำหนดค่าไว้แต่ละรายผ่านรันไทม์สร้างรูปภาพร่วม:
    - `<provider>:generate`
    - `<provider>:edit` เมื่อผู้ให้บริการประกาศว่ารองรับการแก้ไข
- ผู้ให้บริการที่บันเดิลมาและครอบคลุมอยู่ปัจจุบัน:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการแทนที่ที่มีเฉพาะ env

สำหรับพาธ CLI ที่จัดส่งมา ให้เพิ่ม smoke `infer` หลังจากการทดสอบแบบใช้งานจริงของผู้ให้บริการ/รันไทม์ผ่านแล้ว:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

สิ่งนี้ครอบคลุมการแยกวิเคราะห์อาร์กิวเมนต์ CLI, การแก้ค่าการกำหนดค่า/เอเจนต์เริ่มต้น, การเปิดใช้งาน Plugin ที่บันเดิลมา, การซ่อมแซม dependency รันไทม์ที่บันเดิลมาตามต้องการ, รันไทม์สร้างรูปภาพร่วม และคำขอไปยังผู้ให้บริการแบบใช้งานจริง

## การสร้างเพลงแบบใช้งานจริง

- การทดสอบ: `extensions/music-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ชุดทดสอบ: `pnpm test:live:media music`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างเพลงที่บันเดิลมาร่วมกัน
  - ปัจจุบันครอบคลุม Google และ MiniMax
  - โหลด env vars ของผู้ให้บริการจาก login shell ของคุณ (`~/.profile`) ก่อนโพรบ
  - ใช้คีย์ API แบบใช้งานจริง/env ก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้โดยค่าเริ่มต้น เพื่อไม่ให้คีย์ทดสอบเก่าใน `auth-profiles.json` บดบังข้อมูลประจำตัวจริงจาก shell
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้ได้
  - รันโหมดรันไทม์ที่ประกาศไว้ทั้งสองโหมดเมื่อมี:
    - `generate` ด้วยอินพุตที่มีเฉพาะ prompt
    - `edit` เมื่อผู้ให้บริการประกาศ `capabilities.edit.enabled`
  - ความครอบคลุมของเลนร่วมปัจจุบัน:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ไฟล์ Comfy แบบใช้งานจริงแยกต่างหาก ไม่ใช่การกวาดร่วมนี้
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- พฤติกรรมการยืนยันตัวตนแบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการแทนที่ที่มีเฉพาะ env

## การสร้างวิดีโอแบบใช้งานจริง

- การทดสอบ: `extensions/video-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ชุดทดสอบ: `pnpm test:live:media video`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างวิดีโอที่บันเดิลมาร่วมกัน
  - ค่าเริ่มต้นเป็นเส้นทาง smoke ที่ปลอดภัยสำหรับรีลีส: ผู้ให้บริการที่ไม่ใช่ FAL, หนึ่งคำขอ text-to-video ต่อผู้ให้บริการ, prompt กุ้งล็อบสเตอร์ความยาวหนึ่งวินาที และเพดานการทำงานต่อผู้ให้บริการจาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` โดยค่าเริ่มต้น)
  - ข้าม FAL โดยค่าเริ่มต้นเพราะ latency ของคิวฝั่งผู้ให้บริการอาจกินเวลารีลีสเป็นหลัก; ส่ง `--video-providers fal` หรือ `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` เพื่อรันโดยชัดเจน
  - โหลด env vars ของผู้ให้บริการจาก login shell ของคุณ (`~/.profile`) ก่อนโพรบ
  - ใช้คีย์ API แบบใช้งานจริง/env ก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้โดยค่าเริ่มต้น เพื่อไม่ให้คีย์ทดสอบเก่าใน `auth-profiles.json` บดบังข้อมูลประจำตัวจริงจาก shell
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้ได้
  - รันเฉพาะ `generate` โดยค่าเริ่มต้น
  - ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรันโหมดแปลงที่ประกาศไว้ด้วยเมื่อมี:
    - `imageToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.imageToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตรูปภาพในเครื่องที่รองรับด้วยบัฟเฟอร์ในการกวาดร่วม
    - `videoToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.videoToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตวิดีโอในเครื่องที่รองรับด้วยบัฟเฟอร์ในการกวาดร่วม
  - ผู้ให้บริการ `imageToVideo` ที่ประกาศไว้แต่ถูกข้ามในปัจจุบันในการกวาดร่วม:
    - `vydra` เพราะ `veo3` ที่บันเดิลมาเป็นแบบข้อความเท่านั้น และ `kling` ที่บันเดิลมาต้องใช้ URL รูปภาพระยะไกล
  - ความครอบคลุมเฉพาะผู้ให้บริการ Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ไฟล์นั้นรัน `veo3` text-to-video พร้อมเลน `kling` ที่ใช้ fixture URL รูปภาพระยะไกลโดยค่าเริ่มต้น
  - ความครอบคลุมแบบใช้งานจริงของ `videoToVideo` ปัจจุบัน:
    - เฉพาะ `runway` เมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`
  - ผู้ให้บริการ `videoToVideo` ที่ประกาศไว้แต่ถูกข้ามในปัจจุบันในการกวาดร่วม:
    - `alibaba`, `qwen`, `xai` เพราะพาธเหล่านั้นปัจจุบันต้องใช้ URL อ้างอิง `http(s)` / MP4 ระยะไกล
    - `google` เพราะเลน Gemini/Veo ร่วมปัจจุบันใช้อินพุตในเครื่องที่รองรับด้วยบัฟเฟอร์ และพาธนั้นไม่ได้รับการยอมรับในการกวาดร่วม
    - `openai` เพราะเลนร่วมปัจจุบันยังไม่มีการรับประกันการเข้าถึง video inpaint/remix แบบเฉพาะองค์กร
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` เพื่อรวมผู้ให้บริการทุกตัวในการกวาดเริ่มต้น รวมถึง FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` เพื่อลดเพดานการทำงานของผู้ให้บริการแต่ละรายสำหรับการรัน smoke แบบรวดเร็ว
- พฤติกรรมการยืนยันตัวตนแบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นการแทนที่ที่มีเฉพาะ env

## ชุดทดสอบสื่อแบบใช้งานจริง

- คำสั่ง: `pnpm test:live:media`
- จุดประสงค์:
  - รันชุดทดสอบแบบใช้งานจริงร่วมของรูปภาพ เพลง และวิดีโอผ่าน entrypoint ภายในรีโปตัวเดียว
  - โหลด env vars ของผู้ให้บริการที่ขาดหายไปจาก `~/.profile` โดยอัตโนมัติ
  - จำกัดขอบเขตแต่ละชุดให้เหลือผู้ให้บริการที่ปัจจุบันมีการยืนยันตัวตนที่ใช้ได้โดยอัตโนมัติตามค่าเริ่มต้น
  - ใช้ `scripts/test-live.mjs` ซ้ำ เพื่อให้พฤติกรรม Heartbeat และโหมดเงียบยังคงสอดคล้องกัน
- ตัวอย่าง:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing) — ชุด unit, integration, QA และ Docker
