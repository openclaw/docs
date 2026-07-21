---
read_when:
    - การรันการทดสอบแบบ Smoke สำหรับเมทริกซ์โมเดลจริง / แบ็กเอนด์ CLI / ACP / ผู้ให้บริการสื่อ
    - การดีบักการแก้ไขข้อมูลรับรองสำหรับการทดสอบแบบสด
    - การเพิ่มการทดสอบแบบสดเฉพาะผู้ให้บริการรายใหม่
sidebarTitle: Live tests
summary: 'การทดสอบแบบ Live (ที่เชื่อมต่อเครือข่าย): เมทริกซ์โมเดล, แบ็กเอนด์ CLI, ACP, ผู้ให้บริการสื่อ, ข้อมูลประจำตัว'
title: 'การทดสอบ: ชุดทดสอบแบบสด'
x-i18n:
    generated_at: "2026-07-21T15:38:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: da7f65c0d5e9467e600f6ef6bc2fb5bc6c6a2fd3555e942b15eaac6e9c01724b
    source_path: help/testing-live.md
    workflow: 16
---

สำหรับการเริ่มต้นอย่างรวดเร็ว ตัวรัน QA ชุดทดสอบหน่วย/การผสานรวม และโฟลว์ Docker โปรดดู
[การทดสอบ](/th/help/testing) หน้านี้ครอบคลุมการทดสอบแบบ **ไลฟ์** (ที่มีการติดต่อเครือข่าย):
เมทริกซ์โมเดล แบ็กเอนด์ CLI, ACP, ผู้ให้บริการสื่อ และการจัดการข้อมูลประจำตัว

## การทดสอบแบบไลฟ์เทียบกับ Gateway จริงของคุณ

ชุดทดสอบแบบไลฟ์และการทดสอบ smoke เฉพาะกิจต้องไม่รบกวน Gateway ที่กำลัง
ให้บริการทราฟฟิกจริงอยู่แล้ว (ของคุณหรือของผู้ดำเนินการรายอื่น):

- ใช้ Gateway ของคุณเอง: ใช้ Gateway ภายในโปรเซส (เลเยอร์ 2 ด้านล่าง) หรือเริ่ม
  อินสแตนซ์สำหรับพัฒนาโดยใช้ไดเรกทอรีสถานะแบบแยก (`OPENCLAW_STATE_DIR=<scratch>`) และ
  พอร์ตที่ว่าง อย่าผูกกับพอร์ต Gateway เริ่มต้น (18789) ขณะที่ Gateway จริง
  กำลังทำงานบนพอร์ตนั้น
- อย่า `openclaw gateway stop`/`restart` (หรือคำสั่งเทียบเท่า `launchctl`/`systemctl`/tmux)
  บริการที่คุณไม่ได้เริ่มในเซสชันนี้ เพราะนั่นคืออินสแตนซ์ไลฟ์
  ของผู้ดำเนินการ ต้องได้รับอนุมัติอย่างชัดเจนก่อน
- ต้องการข้อมูลที่สมจริงหรือไม่ คัดลอกสถานะ/DB ไลฟ์ไปยังไดเรกทอรีสถานะสำหรับพัฒนา แล้วทดสอบ
  กับสำเนานั้น การย้ายข้อมูลสถานะของ Gateway ไลฟ์แบบแทนที่โดยตรงก็ต้อง
  ได้รับอนุมัติอย่างชัดเจนเช่นกัน

## ไลฟ์: คำสั่ง smoke ภายในเครื่อง

ส่งออกคีย์ผู้ให้บริการที่จำเป็นไปยังสภาพแวดล้อมของโปรเซสก่อนดำเนินการตรวจสอบแบบไลฟ์
เฉพาะกิจ

การทดสอบ smoke สำหรับสื่ออย่างปลอดภัย:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "การทดสอบ smoke แบบไลฟ์ของ OpenClaw" \
  --output /tmp/openclaw-live-smoke.mp3
```

การทดสอบ smoke ความพร้อมสำหรับการโทรด้วยเสียงอย่างปลอดภัย:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` เป็นการทดลองรัน เว้นแต่จะระบุ `--yes` ด้วย ให้ใช้ `--yes` เฉพาะ
เมื่อคุณตั้งใจโทรจริงเท่านั้น สำหรับ Twilio, Telnyx และ Plivo การตรวจสอบ
ความพร้อมที่สำเร็จต้องมี URL Webhook สาธารณะ โดย URL ลูปแบ็กภายในเครื่อง/ส่วนตัว
จะถูกปฏิเสธ เนื่องจากผู้ให้บริการเหล่านั้นไม่สามารถเข้าถึง URL ดังกล่าวได้

## ไลฟ์: การตรวจสอบความสามารถของ Node Android

- การทดสอบ: `src/gateway/android-node.capabilities.live.test.ts`
- สคริปต์: `pnpm android:test:integration`
- เป้าหมาย: เรียกใช้ **ทุกคำสั่งที่ Node Android ที่เชื่อมต่ออยู่ประกาศในขณะนี้** และตรวจยืนยันพฤติกรรมตามสัญญาของคำสั่ง
- ขอบเขต:
  - ต้องตั้งเงื่อนไขเบื้องต้น/ตั้งค่าด้วยตนเอง (ชุดทดสอบจะไม่ติดตั้ง/เรียกใช้/จับคู่แอป)
  - การตรวจสอบ `node.invoke` ของ Gateway ทีละคำสั่งสำหรับ Node Android ที่เลือก
- การตั้งค่าล่วงหน้าที่จำเป็น:
  - แอป Android เชื่อมต่อและจับคู่กับ Gateway แล้ว
  - เปิดแอปไว้เบื้องหน้า
  - ให้สิทธิ์/ความยินยอมในการจับข้อมูลสำหรับความสามารถที่คาดว่าจะผ่าน
- การแทนที่เป้าหมายที่เลือกได้:
  - `OPENCLAW_ANDROID_NODE_ID` หรือ `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- รายละเอียดการตั้งค่า Android ทั้งหมด: [แอป Android](/th/platforms/android)

## ไลฟ์: การทดสอบ smoke ของโมเดล (คีย์โปรไฟล์)

การทดสอบโมเดลแบบไลฟ์แบ่งเป็นสองเลเยอร์เพื่อแยกสาเหตุความล้มเหลว:

- "โมเดลโดยตรง" บอกว่าผู้ให้บริการ/โมเดลสามารถตอบสนองด้วยคีย์ที่ระบุได้หรือไม่
- "การทดสอบ smoke ของ Gateway" บอกว่าไปป์ไลน์ Gateway+เอเจนต์ทั้งหมดทำงานกับโมเดลนั้นหรือไม่ (เซสชัน ประวัติ เครื่องมือ นโยบายแซนด์บ็อกซ์ ฯลฯ)

รายการโมเดลที่คัดสรรด้านล่างอยู่ใน `src/agents/live-model-filter.ts` และ
เปลี่ยนแปลงตามเวลา ให้ถือว่าอาร์เรย์ในนั้นเป็นแหล่งข้อมูลจริง ไม่ใช่
หน้านี้

MiniMax M3 ใช้ `minimax/MiniMax-M3` เป็นการอ้างอิงผู้ให้บริการ/โมเดลเริ่มต้น

### เลเยอร์ 1: การสร้างคำตอบจากโมเดลโดยตรง (ไม่มี Gateway)

- การทดสอบ: `src/agents/models.profiles.live.test.ts`
- เป้าหมาย:
  - แจกแจงโมเดลที่ค้นพบ
  - ใช้ `getApiKeyForModel` เพื่อเลือกโมเดลที่คุณมีข้อมูลประจำตัว
  - รันการสร้างคำตอบขนาดเล็กต่อโมเดล (และการทดสอบการถดถอยเฉพาะจุดเมื่อจำเป็น)
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียกใช้ Vitest โดยตรง)
  - ตั้งค่า `OPENCLAW_LIVE_MODELS=modern`, `small` หรือ `all` (นามแฝงของ `modern`) เพื่อรันชุดทดสอบนี้จริง มิฉะนั้นระบบจะข้าม ดังนั้น `pnpm test:live` เพียงอย่างเดียวยังคงเน้นการทดสอบ smoke ของ Gateway
- วิธีเลือกโมเดล:
  - `OPENCLAW_LIVE_MODELS=modern` รันรายการลำดับความสำคัญที่คัดสรรซึ่งให้สัญญาณสูง (ดู [ไลฟ์: เมทริกซ์โมเดล](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` รันรายการลำดับความสำคัญของโมเดลขนาดเล็กที่คัดสรร
  - `OPENCLAW_LIVE_MODELS=all` เป็นนามแฝงของ `modern`
  - หรือ `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (รายการอนุญาตคั่นด้วยจุลภาค)
  - การรันโมเดลขนาดเล็กของ Ollama ภายในเครื่องใช้ `http://127.0.0.1:11434` เป็นค่าเริ่มต้น ให้ตั้งค่า `OPENCLAW_LIVE_OLLAMA_BASE_URL` เฉพาะสำหรับปลายทาง LAN แบบกำหนดเอง หรือ Ollama Cloud
  - การตรวจสอบแบบสมัยใหม่/ทั้งหมดและแบบขนาดเล็กใช้ความยาวของรายการที่คัดสรรเป็นขีดจำกัดเริ่มต้น ให้ตั้งค่า `OPENCLAW_LIVE_MAX_MODELS=0` สำหรับการตรวจสอบโปรไฟล์ที่เลือกอย่างครบถ้วน หรือระบุจำนวนบวกเพื่อใช้ขีดจำกัดที่เล็กลง
  - การตรวจสอบอย่างครบถ้วนใช้ `OPENCLAW_LIVE_TEST_TIMEOUT_MS` เป็นระยะหมดเวลาของการทดสอบโมเดลโดยตรงทั้งหมด ค่าเริ่มต้น: 60 นาที
  - โพรบโมเดลโดยตรงทำงานพร้อมกัน 20 รายการโดยค่าเริ่มต้น ให้ตั้งค่า `OPENCLAW_LIVE_MODEL_CONCURRENCY` เพื่อแทนที่
- วิธีเลือกผู้ให้บริการ:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (รายการอนุญาตคั่นด้วยจุลภาค)
- แหล่งที่มาของคีย์:
  - โดยค่าเริ่มต้น: ที่เก็บโปรไฟล์และค่าทดแทนจากสภาพแวดล้อม
  - ตั้งค่า `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้เฉพาะ **ที่เก็บโปรไฟล์**
- เหตุผลที่มีสิ่งนี้:
  - แยกกรณี "API ของผู้ให้บริการเสีย/คีย์ไม่ถูกต้อง" ออกจาก "ไปป์ไลน์เอเจนต์ของ Gateway เสีย"
  - มีการทดสอบการถดถอยขนาดเล็กที่แยกจากกัน (ตัวอย่าง: การเล่นซ้ำการให้เหตุผลและโฟลว์การเรียกเครื่องมือของ OpenAI Responses/Codex Responses)

### เลเยอร์ 2: การทดสอบ smoke ของ Gateway + เอเจนต์สำหรับพัฒนา (สิ่งที่ "@openclaw" ทำจริง)

- การทดสอบ: `src/gateway/gateway-models.profiles.live.test.ts`
- เป้าหมาย:
  - เริ่ม Gateway ภายในโปรเซส
  - สร้าง/แพตช์เซสชัน `agent:dev:*` (แทนที่โมเดลต่อการรัน)
  - วนผ่านโมเดลที่มีคีย์และตรวจยืนยันว่า:
    - มีการตอบสนองที่ "มีความหมาย" (ไม่ใช้เครื่องมือ)
    - การเรียกใช้เครื่องมือจริงทำงานได้ (โพรบอ่าน)
    - โพรบเครื่องมือเพิ่มเติมที่เลือกได้ (โพรบ exec+อ่าน)
    - เส้นทางการทดสอบการถดถอยของ OpenAI (เฉพาะการเรียกเครื่องมือ -> การติดตามผล) ยังคงทำงาน
- รายละเอียดโพรบ (เพื่อให้คุณอธิบายความล้มเหลวได้อย่างรวดเร็ว):
  - โพรบ `read`: การทดสอบเขียนไฟล์ nonce ในพื้นที่ทำงานและขอให้เอเจนต์ `read` ไฟล์นั้น แล้วส่ง nonce กลับมา
  - โพรบ `exec+read`: การทดสอบขอให้เอเจนต์ใช้ `exec` เขียน nonce ลงในไฟล์ชั่วคราว แล้วใช้ `read` อ่านกลับมา
  - โพรบรูปภาพ: การทดสอบแนบ PNG ที่สร้างขึ้น (แมว + รหัสแบบสุ่ม) และคาดว่าโมเดลจะส่งคืน `cat <CODE>`
  - ข้อมูลอ้างอิงการใช้งาน: `src/gateway/gateway-models.profiles.live.test.ts` และ `test/helpers/live-image-probe.ts`
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียกใช้ Vitest โดยตรง)
- วิธีเลือกโมเดล:
  - ค่าเริ่มต้น: รายการลำดับความสำคัญที่คัดสรรซึ่งให้สัญญาณสูง (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` รันรายการโมเดลขนาดเล็กที่คัดสรรผ่านไปป์ไลน์ Gateway+เอเจนต์ทั้งหมด
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` เป็นนามแฝงของ `modern`
  - หรือตั้งค่า `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (หรือรายการคั่นด้วยจุลภาค) เพื่อจำกัดขอบเขต
  - การตรวจสอบ Gateway แบบสมัยใหม่/ทั้งหมดและแบบขนาดเล็กใช้ความยาวของรายการที่คัดสรรเป็นขีดจำกัดเริ่มต้น ให้ตั้งค่า `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` สำหรับการตรวจสอบรายการที่เลือกอย่างครบถ้วน หรือระบุจำนวนบวกเพื่อใช้ขีดจำกัดที่เล็กลง
- วิธีเลือกผู้ให้บริการ (หลีกเลี่ยง "ทุกอย่างผ่าน OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (รายการอนุญาตคั่นด้วยจุลภาค)
- โพรบเครื่องมือและรูปภาพเปิดใช้งานเสมอในการทดสอบแบบไลฟ์นี้:
  - โพรบ `read` + โพรบ `exec+read` (การทดสอบภาระเครื่องมือ)
  - โพรบรูปภาพทำงานเมื่อโมเดลประกาศว่ารองรับอินพุตรูปภาพ
  - โฟลว์ (ภาพรวม):
    - การทดสอบสร้าง PNG ขนาดเล็กที่มี "CAT" + รหัสสุ่ม (`test/helpers/live-image-probe.ts`)
    - ส่งผ่าน `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway แยกวิเคราะห์ไฟล์แนบเป็น `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - เอเจนต์แบบฝังตัวส่งต่อข้อความผู้ใช้แบบหลายสื่อไปยังโมเดล
    - การตรวจยืนยัน: คำตอบมี `cat` + รหัส (ความคลาดเคลื่อน OCR: อนุญาตข้อผิดพลาดเล็กน้อย)

<Tip>
หากต้องการดูว่าสามารถทดสอบอะไรบนเครื่องของคุณได้บ้าง (รวมถึงรหัส `provider/model` ที่ถูกต้อง) ให้รัน:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## ไลฟ์: การทดสอบ smoke ของแบ็กเอนด์ CLI (Claude, Gemini หรือ CLI ภายในเครื่องอื่นๆ)

- การทดสอบ: `src/gateway/gateway-cli-backend.live.test.ts`
- เป้าหมาย: ตรวจสอบไปป์ไลน์ Gateway + เอเจนต์โดยใช้แบ็กเอนด์ CLI ภายในเครื่อง โดยไม่แตะต้องการกำหนดค่าเริ่มต้นของคุณ
- ค่าเริ่มต้นของการทดสอบ smoke เฉพาะแบ็กเอนด์อยู่กับคำจำกัดความ `cli-backend.ts` ของ Plugin ที่เป็นเจ้าของ
- เปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียกใช้ Vitest โดยตรง)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- ค่าเริ่มต้น:
  - ผู้ให้บริการ/โมเดลเริ่มต้น: `claude-cli/claude-sonnet-4-6`
  - พฤติกรรมของคำสั่ง/อาร์กิวเมนต์/รูปภาพมาจากข้อมูลเมตาของ Plugin แบ็กเอนด์ CLI ที่เป็นเจ้าของ
- การแทนที่ (เลือกได้):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` เพื่อส่งไฟล์แนบรูปภาพจริง (พาธจะถูกแทรกลงในพรอมป์) ปิดโดยค่าเริ่มต้นในสูตร Docker
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` เพื่อส่งพาธไฟล์รูปภาพเป็นอาร์กิวเมนต์ CLI แทนการแทรกลงในพรอมป์
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (หรือ `"list"`) เพื่อควบคุมวิธีส่งอาร์กิวเมนต์รูปภาพเมื่อตั้งค่า `IMAGE_ARG`
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` เพื่อส่งเทิร์นที่สองและตรวจสอบโฟลว์การดำเนินการต่อ
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` เพื่อเลือกใช้โพรบความต่อเนื่องในเซสชันเดียวกัน Claude Sonnet -> Opus เมื่อโมเดลที่เลือกรองรับเป้าหมายสำหรับการสลับ ปิดโดยค่าเริ่มต้น รวมถึงในสูตร Docker
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` เพื่อเลือกใช้โพรบลูปแบ็ก MCP/เครื่องมือ ปิดโดยค่าเริ่มต้นในสูตร Docker

ตัวอย่าง:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

การทดสอบ smoke การกำหนดค่า MCP ของ Gemini ที่ประหยัด:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

การดำเนินการนี้ไม่ได้ขอให้ Gemini สร้างคำตอบ แต่จะเขียนการตั้งค่าระบบเดียวกับที่
OpenClaw มอบให้ Gemini จากนั้นรัน `gemini --debug mcp list` เพื่อพิสูจน์ว่า
เซิร์ฟเวอร์ `transport: "streamable-http"` ที่บันทึกไว้ถูกปรับให้อยู่ในรูปแบบ HTTP MCP
ของ Gemini และสามารถเชื่อมต่อกับเซิร์ฟเวอร์ MCP แบบ HTTP ที่สตรีมได้ภายในเครื่อง

สูตร Docker:

```bash
pnpm test:docker:live-cli-backend
```

สูตร Docker สำหรับผู้ให้บริการรายเดียว:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

หมายเหตุ:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-cli-backend-docker.sh`
- ตัวรันนี้เรียกใช้การทดสอบ smoke ของแบ็กเอนด์ CLI แบบสดภายในอิมเมจ Docker ของรีโปด้วยผู้ใช้ `node` ที่ไม่ใช่ root
- ตัวรันนี้ระบุเมทาดาทาการทดสอบ smoke ของ CLI จาก Plugin ที่เป็นเจ้าของ จากนั้นติดตั้งแพ็กเกจ CLI สำหรับ Linux ที่ตรงกัน (`@anthropic-ai/claude-code` หรือ `@google/gemini-cli`) ลงในคำนำหน้าที่เขียนได้และมีการแคชไว้ที่ `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`)
- `codex-cli` ไม่ใช่แบ็กเอนด์ CLI ที่รวมมาให้แล้วอีกต่อไป ให้ใช้ `openai/*` กับรันไทม์ app-server ของ Codex แทน (ดู [แบบสด: การทดสอบ smoke ของชุดทดสอบ app-server ของ Codex](#live-codex-app-server-harness-smoke))
- `pnpm test:docker:live-cli-backend:claude-subscription` ต้องใช้ OAuth แบบพกพาของการสมัครสมาชิก Claude Code ผ่าน `~/.claude/.credentials.json` ร่วมกับ `claudeAiOauth.subscriptionType` หรือผ่าน `CLAUDE_CODE_OAUTH_TOKEN` จาก `claude setup-token` โดยจะพิสูจน์ `claude -p` โดยตรงใน Docker ก่อน จากนั้นเรียกใช้แบ็กเอนด์ CLI ของ Gateway สองรอบโดยไม่เก็บรักษาตัวแปรสภาพแวดล้อมคีย์ API ของ Anthropic เลนการสมัครสมาชิกนี้ปิดใช้การตรวจสอบ Claude MCP/เครื่องมือและอิมเมจตามค่าเริ่มต้น เนื่องจากใช้โควตาการใช้งานของการสมัครสมาชิกที่ลงชื่อเข้าใช้ไว้ และ Anthropic สามารถเปลี่ยนลักษณะการเรียกเก็บเงินและการจำกัดอัตราของ Claude Agent SDK / `claude -p` ได้โดยไม่ต้องมี OpenClaw รุ่นใหม่
- Claude และ Gemini รองรับชุดการตรวจสอบเดียวกัน (รอบข้อความ การจำแนกอิมเมจ การเรียกเครื่องมือ MCP `cron` และความต่อเนื่องในการสลับโมเดล) ผ่านแฟล็กข้างต้น แต่ไม่มีการตรวจสอบใดทำงานตามค่าเริ่มต้น ให้เลือกเปิดใช้ผ่านแฟล็กแต่ละรายการตามต้องการ

## แบบสด: การเข้าถึงพร็อกซี HTTP/2 ของ APNs

- การทดสอบ: `src/infra/push-apns-http2.live.test.ts`
- เป้าหมาย: สร้างทันเนลผ่านพร็อกซี HTTP CONNECT ภายในเครื่องไปยังปลายทาง APNs ของแซนด์บ็อกซ์ Apple ส่งคำขอตรวจสอบ APNs ผ่าน HTTP/2 และยืนยันว่าได้รับการตอบกลับ `403 InvalidProviderToken` จริงจาก Apple ผ่านเส้นทางพร็อกซี
- เปิดใช้:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- ระยะหมดเวลาที่กำหนดเองได้:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## แบบสด: การทดสอบ smoke ของการผูก ACP (`/acp spawn ... --bind here`)

- การทดสอบ: `src/gateway/gateway-acp-bind.live.test.ts`
- เป้าหมาย: ตรวจสอบขั้นตอนการผูกการสนทนา ACP จริงกับเอเจนต์ ACP แบบสด:
  - ส่ง `/acp spawn <agent> --bind here`
  - ผูกการสนทนาของช่องทางข้อความสังเคราะห์ในตำแหน่งเดิม
  - ส่งข้อความติดตามผลตามปกติในการสนทนาเดียวกันนั้น
  - ตรวจสอบว่าข้อความติดตามผลปรากฏในทรานสคริปต์เซสชัน ACP ที่ผูกไว้
- เปิดใช้:
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
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (หรือ `on`/`true`/`yes`) เพื่อบังคับเปิดการตรวจสอบอิมเมจ ค่าอื่นใดจะบังคับปิด โดยทำงานตามค่าเริ่มต้นสำหรับทุกเอเจนต์ยกเว้น `opencode`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- หมายเหตุ:
  - เลนนี้ใช้พื้นผิว `chat.send` ของ Gateway พร้อมฟิลด์เส้นทางต้นทางสังเคราะห์เฉพาะผู้ดูแลระบบ เพื่อให้การทดสอบแนบบริบทช่องทางข้อความได้โดยไม่แสร้งว่ามีการส่งไปภายนอก
  - เมื่อไม่ได้ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` การทดสอบจะใช้รีจิสทรีเอเจนต์ในตัวของ Plugin `acpx` ที่ฝังไว้สำหรับเอเจนต์ชุดทดสอบ ACP ที่เลือก
  - การสร้าง Cron MCP สำหรับเซสชันที่ผูกไว้จะพยายามให้สำเร็จโดยไม่รับประกันตามค่าเริ่มต้น เนื่องจากชุดทดสอบ ACP ภายนอกอาจยกเลิกการเรียก MCP หลังจากผ่านการพิสูจน์การผูก/อิมเมจแล้ว ให้ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` เพื่อทำให้การตรวจสอบ Cron หลังการผูกนั้นเคร่งครัด

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

หมายเหตุเกี่ยวกับ Docker:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-acp-bind-docker.sh`
- ตามค่าเริ่มต้น ตัวรันจะเรียกใช้การทดสอบ smoke ของการผูก ACP กับเอเจนต์ CLI แบบสดที่รวมกันตามลำดับ: `claude`, `codex` แล้วจึง `gemini`
- ใช้ `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` หรือ `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` เพื่อจำกัดเมทริกซ์ให้แคบลง
- ตัวรันจะจัดเตรียมข้อมูลการตรวจสอบสิทธิ์ CLI ที่ตรงกันไว้ในคอนเทนเนอร์ จากนั้นติดตั้ง CLI แบบสดที่ร้องขอ (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid ผ่าน `https://app.factory.ai/cli`, `@google/gemini-cli` หรือ `opencode-ai`) หากยังไม่มี ส่วนแบ็กเอนด์ ACP คือแพ็กเกจ `acpx/runtime` ที่ฝังไว้จาก Plugin `acpx` อย่างเป็นทางการ
- ตัวแปร Docker ของ Droid จัดเตรียม `~/.factory` สำหรับการตั้งค่า ส่งต่อ `FACTORY_API_KEY` และกำหนดให้ต้องมีคีย์ API ดังกล่าว เนื่องจากการตรวจสอบสิทธิ์ Factory OAuth/พวงกุญแจภายในเครื่องไม่สามารถย้ายเข้าสู่คอนเทนเนอร์ได้ โดยใช้รายการรีจิสทรี `droid exec --output-format acp` ในตัวของ ACPX
- ตัวแปร Docker ของ OpenCode เป็นเลนทดสอบการถดถอยแบบเอเจนต์เดียวที่เคร่งครัด โดยเขียนโมเดลเริ่มต้น `OPENCODE_CONFIG_CONTENT` ชั่วคราวจาก `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (ค่าเริ่มต้น `opencode/kimi-k2.6`)
- การเรียก CLI `acpx` โดยตรงเป็นเพียงเส้นทางแบบทำด้วยตนเอง/ทางเลี่ยงสำหรับเปรียบเทียบพฤติกรรมนอก Gateway เท่านั้น การทดสอบ smoke ของการผูก ACP ใน Docker จะทดสอบแบ็กเอนด์รันไทม์ `acpx` ที่ฝังอยู่ใน OpenClaw

## แบบสด: การทดสอบ smoke ของชุดทดสอบ app-server ของ Codex

- เป้าหมาย: ตรวจสอบชุดทดสอบ Codex ที่ Plugin เป็นเจ้าของผ่านเมธอด `agent` ปกติของ Gateway:
  - โหลด Plugin `codex` ที่รวมมาให้แล้ว
  - เลือกโมเดล OpenAI ผ่าน `/model <ref> --runtime codex`
  - ส่งรอบแรกของเอเจนต์ Gateway ด้วยระดับการคิดที่ร้องขอ
  - ส่งรอบที่สองไปยังเซสชัน OpenClaw เดียวกันและตรวจสอบว่าเธรด app-server กลับมาทำงานต่อได้
  - เรียกใช้ `/codex status` และ `/codex models` ผ่านเส้นทางคำสั่ง Gateway เดียวกัน
  - เลือกเรียกใช้การตรวจสอบเชลล์แบบยกระดับสองรายการที่ Guardian ตรวจทานแล้ว ได้แก่คำสั่งที่ไม่เป็นอันตรายหนึ่งรายการซึ่งควรได้รับการอนุมัติ และการอัปโหลดข้อมูลลับปลอมหนึ่งรายการซึ่งควรถูกปฏิเสธเพื่อให้เอเจนต์สอบถามกลับ
- การทดสอบ: `src/gateway/gateway-codex-harness.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- โมเดลพื้นฐานของชุดทดสอบ: `openai/gpt-5.6-luna`
- ค่าเริ่มต้นสำหรับการเลือกคีย์ API ใหม่ของ OpenAI: `openai/gpt-5.6`
- การคิดเริ่มต้น: `low`
- การแทนที่โมเดล: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- การแทนที่การคิด: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- การยืนยันระดับความพยายามของโมเดลที่ไม่ใช่ค่าเริ่มต้น:
  `OPENCLAW_LIVE_CODEX_HARNESS_EXPECTED_EFFORT=<level>`
- การแทนที่เมทริกซ์: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- โหมดการตรวจสอบสิทธิ์: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (ค่าเริ่มต้น) ใช้ข้อมูลเข้าสู่ระบบ Codex ที่คัดลอกมา ส่วน `api-key` ใช้ `OPENAI_API_KEY` ผ่าน app-server ของ Codex
- การตรวจสอบอิมเมจที่เลือกเปิดได้: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- การตรวจสอบ MCP/เครื่องมือที่เลือกเปิดได้: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- การตรวจสอบ Guardian ที่เลือกเปิดได้: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- การทดสอบความเค้นของการกลับมาทำงานต่อที่เลือกเปิดได้: `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1` เพิ่มรอบประวัติสี่รอบ จากนั้นปิดและเริ่ม Gateway กับ app-server ของ Codex ใหม่สามครั้ง โดยกำหนดให้ใช้ ID เธรดดั้งเดิมและประวัติการสนทนาเดิม สามารถแทนที่จำนวนที่จำกัดไว้ด้วย `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_HISTORY_TURNS` (1-20) และ `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_RESTARTS` (1-10)
- การทดสอบความเค้นแบบกระจายงานที่เลือกเปิดได้: ตั้งค่า `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1` และ `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_COUNT` (1-12) ชุดทดสอบจะเริ่มเอเจนต์ลูกทุกตัวพร้อมกัน รอการทำงานปลายทางทั้งหมด และตรวจสอบคำตอบเฉพาะของเอเจนต์ลูกแต่ละตัวกับอัตลักษณ์เธรดดั้งเดิม
- การทดสอบความเค้นของ Compaction ที่เลือกเปิดได้: `OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS=1` สร้างเอาต์พุตเครื่องมือดั้งเดิมในขอบเขตจำกัด กำหนดให้เกิดเหตุการณ์ Compaction โดยอัตโนมัติ ตรวจสอบจำนวน Compaction ที่คงอยู่และการเรียกคืนเครื่องหมายที่ซ่อนอยู่ เริ่ม Gateway และ app-server จริงของ Codex ใหม่ จากนั้นทำซ้ำระลอกเอาต์พุตและ Compaction ปรับปริมาณงานที่จำกัดไว้ได้ด้วย `OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS_TURNS` (1-8) และ `OPENCLAW_LIVE_CODEX_HARNESS_LARGE_OUTPUT_BYTES` (100000-800000)
- การตรวจสอบการเลือกไม่ใช้รีเลย์ลูปที่เลือกเปิดได้:
  `OPENCLAW_LIVE_CODEX_HARNESS_DISABLE_LOOP_RELAY=1`
- ค่ากำหนดการคิดที่ร้องขออาจจับคู่กับระดับความพยายามที่ใกล้เคียงที่สุดซึ่ง Codex ประกาศสำหรับโมเดลนั้น ตัวอย่างเช่น Luna จับคู่ `minimal` กับ `low`
- โมเดลที่รู้จักในแค็ตตาล็อก Codex จะหาระดับความพยายามดั้งเดิมที่ตรงกันนั้นโดยอัตโนมัติ การแทนที่ด้วยโมเดลที่ไม่รู้จักต้องระบุระดับความพยายามที่คาดว่าจะจับคู่
- การทดสอบ smoke บังคับผู้ให้บริการ/โมเดลเป็น `agentRuntime.id: "codex"` เพื่อไม่ให้ชุดทดสอบ Codex ที่เสียผ่านการทดสอบด้วยการย้อนกลับไปใช้ OpenClaw อย่างเงียบ ๆ
- การตรวจสอบสิทธิ์: การตรวจสอบสิทธิ์ app-server ของ Codex จากข้อมูลเข้าสู่ระบบการสมัครสมาชิก Codex ภายในเครื่อง หรือ `OPENAI_API_KEY` เมื่อ `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key` โดย Docker สามารถคัดลอก `~/.codex/auth.json` และ `~/.codex/config.toml` สำหรับการเรียกใช้ด้วยการสมัครสมาชิก

สูตรภายในเครื่อง:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

สูตร Docker:

```bash
pnpm test:docker:live-codex-harness
```

การทดสอบความเค้นของการเริ่มใหม่และประวัติ:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1 \
pnpm test:docker:live-codex-harness
```

การทดสอบความเค้นแบบกระจายงาน เอาต์พุตขนาดใหญ่ Compaction และการเริ่มใหม่:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_COUNT=8 \
  OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS=1 \
  pnpm test:docker:live-codex-harness
```

เมทริกซ์ Codex ดั้งเดิมของ GPT-5.6:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

ค่าเริ่มต้นของคีย์ API ใหม่ของ OpenAI:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

การพิสูจน์นี้ปล่อยให้ `OPENCLAW_LIVE_GATEWAY_MODELS` ไม่ได้ตั้งค่า ระบุโมเดลผ่านรอยต่อการเลือกการอนุมานสำหรับการเริ่มต้นใช้งานใหม่ ยืนยัน `openai/gpt-5.6` แล้วจึงเรียกใช้รอบ Gateway จริงด้วยโมเดลที่ระบุได้

เมทริกซ์ OpenClaw แบบฝังของ GPT-5.6:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

หมายเหตุเกี่ยวกับ Docker:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-codex-harness-docker.sh`
- ตัวรันนี้ส่งผ่าน `OPENAI_API_KEY` คัดลอกไฟล์การยืนยันตัวตนของ Codex CLI เมื่อมีอยู่ ติดตั้ง
  `@openai/codex` ลงใน prefix ของ npm
  ที่เมานต์และเขียนได้ จัดเตรียมซอร์สทรี จากนั้นรันเฉพาะการทดสอบแบบไลฟ์ของ Codex harness
- Docker เปิดใช้โพรบอิมเมจ, MCP/เครื่องมือ และ Guardian เป็นค่าเริ่มต้น ตั้งค่า
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` เมื่อต้องการรันดีบัก
  ในขอบเขตที่แคบลง
- Docker ใช้การกำหนดค่ารันไทม์ Codex แบบระบุชัดเจนเดียวกัน ดังนั้น alias แบบเดิมหรือ fallback ของ OpenClaw
  จึงไม่สามารถบดบังรีเกรสชันของ Codex harness ได้
- เป้าหมาย Matrix รันตามลำดับในคอนเทนเนอร์เดียว สคริปต์ Docker จะปรับ
  timeout เริ่มต้น 35 นาทีตามจำนวนเป้าหมาย โดย timeout ของเชลล์ภายนอกหรือ CI
  ต้องรองรับเวลารวมเดียวกัน CI มาตรฐานกำหนดให้แต่ละเป้าหมาย GPT-5.6 อยู่ใน shard แยกกัน

### สูตรการรันแบบไลฟ์ที่แนะนำ

allowlist แบบแคบและระบุชัดเจนทำงานเร็วที่สุดและมีความไม่แน่นอนน้อยที่สุด:

- โมเดลเดียว แบบตรง (ไม่มี Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- โปรไฟล์แบบตรงสำหรับโมเดลขนาดเล็ก:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- โปรไฟล์ Gateway สำหรับโมเดลขนาดเล็ก:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การทดสอบ smoke ของ Ollama Cloud API:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- โมเดลเดียว การทดสอบ smoke ผ่าน Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การเรียกใช้เครื่องมือผ่านผู้ให้บริการหลายราย:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การทดสอบ smoke แบบตรงของ Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- เน้น Google (คีย์ Gemini API + Antigravity):
  - Gemini (คีย์ API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การทดสอบ smoke ของการคิดแบบปรับตัวของ Google (`qa manual` จาก CLI QA ส่วนตัว - ต้องมี `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` และซอร์ส checkout โปรดดู [ภาพรวม QA](/th/concepts/qa-e2e-automation)):
  - ค่าเริ่มต้นแบบไดนามิกของ Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - งบประมาณแบบไดนามิกของ Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

หมายเหตุ:

- `google/...` ใช้ Gemini API (คีย์ API)
- `google-antigravity/...` ใช้บริดจ์ OAuth ของ Antigravity (ปลายทางเอเจนต์แบบ Cloud Code Assist)
- `google-gemini-cli/...` ใช้ Gemini CLI ภายในเครื่องของคุณ (มีการยืนยันตัวตนแยกต่างหาก + ลักษณะเฉพาะของเครื่องมือ)
- Gemini API เทียบกับ Gemini CLI:
  - API: OpenClaw เรียก Gemini API ที่โฮสต์โดย Google ผ่าน HTTP (คีย์ API / การยืนยันตัวตนด้วยโปรไฟล์) ซึ่งเป็นสิ่งที่ผู้ใช้ส่วนใหญ่หมายถึงเมื่อกล่าวถึง "Gemini"
  - CLI: OpenClaw เรียกไบนารี `gemini` ภายในเครื่องผ่านเชลล์ โดยมีการยืนยันตัวตนของตนเองและอาจทำงานแตกต่างออกไป (การสตรีม/การรองรับเครื่องมือ/ความคลาดเคลื่อนของเวอร์ชัน)

## แบบไลฟ์: เมทริกซ์โมเดล (ขอบเขตที่ครอบคลุม)

การรันแบบไลฟ์เป็นแบบเลือกใช้ จึงไม่มี "รายการโมเดล CI" ที่ตายตัว `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (รวมถึง alias `all`) จะรันรายการลำดับความสำคัญที่คัดสรรจาก `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` ใน `src/agents/live-model-filter.ts` ตามลำดับความสำคัญดังนี้:

| ผู้ให้บริการ/โมเดล                                | หมายเหตุ      |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k3`                            |            |
| `anthropic/claude-opus-4-6`                   |            |
| `deepseek/deepseek-v4-flash`                  |            |
| `deepseek/deepseek-v4-pro`                    |            |
| `minimax/MiniMax-M3`                          |            |
| `openai/gpt-5.5`                              |            |
| `openrouter/openai/gpt-5.2-chat`              |            |
| `openrouter/minimax/minimax-m2.7`             |            |
| `opencode-go/glm-5`                           |            |
| `openrouter/ai21/jamba-large-1.7`             |            |
| `xai/grok-4.5`                                |            |
| `xai/grok-4.20-0309-reasoning`                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

รายการ **โมเดลขนาดเล็ก** ที่คัดสรร (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`) จาก `SMALL_LIVE_MODEL_PRIORITY`:

| ผู้ให้บริการ/โมเดล               |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

หมายเหตุเกี่ยวกับรายการสมัยใหม่:

- ผู้ให้บริการ `codex` และ `codex-cli` ถูกแยกออกจากการกวาดตรวจสมัยใหม่เริ่มต้น (ครอบคลุมพฤติกรรมของแบ็กเอนด์ CLI/ACP ซึ่งทดสอบแยกไว้ด้านบน) โดยค่าเริ่มต้น `openai/gpt-5.5` จะกำหนดเส้นทางผ่าน Codex app-server harness โปรดดู [แบบไลฟ์: การทดสอบ smoke ของ Codex app-server harness](#live-codex-app-server-harness-smoke)
- `fireworks`, `google`, `openrouter` และ `xai` จะรันเฉพาะ ID โมเดลที่คัดสรรไว้อย่างชัดเจนในการกวาดตรวจสมัยใหม่ (ไม่มีการขยายอัตโนมัติเพื่อรวม "ทุกโมเดลจากผู้ให้บริการนี้")
- ใส่โมเดลที่รองรับรูปภาพอย่างน้อยหนึ่งโมเดล (ตัวแปร vision ของตระกูล Claude/Gemini/OpenAI เป็นต้น) ใน `OPENCLAW_LIVE_GATEWAY_MODELS` เพื่อทดสอบโพรบรูปภาพ

รันการทดสอบ smoke ของ Gateway พร้อมเครื่องมือ + รูปภาพกับชุดผู้ให้บริการข้ามค่ายที่คัดเลือกเอง:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

ความครอบคลุมเพิ่มเติมแบบเลือกได้นอกเหนือจากรายการที่คัดสรร (มีก็ดี โดยเลือกโมเดลที่รองรับ "เครื่องมือ" ซึ่งคุณเปิดใช้งานไว้):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (หากคุณมีสิทธิ์เข้าถึง)
- LM Studio: `lmstudio/...` (ภายในเครื่อง การเรียกใช้เครื่องมือขึ้นอยู่กับโหมด API)

### ตัวรวม / Gateway ทางเลือก

หากเปิดใช้คีย์ไว้ คุณยังสามารถทดสอบผ่าน:

- OpenRouter: `openrouter/...` (หลายร้อยโมเดล ใช้ `openclaw models scan` เพื่อค้นหาตัวเลือกที่รองรับเครื่องมือ+รูปภาพ)
- OpenCode: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go (ยืนยันตัวตนผ่าน `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

ผู้ให้บริการเพิ่มเติมที่สามารถรวมไว้ในเมทริกซ์แบบไลฟ์ได้ (หากมีข้อมูลรับรอง/การกำหนดค่า):

- ในตัว: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- ผ่าน `models.providers` (ปลายทางแบบกำหนดเอง): `minimax` (คลาวด์/API) รวมถึงพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic (LM Studio, vLLM, LiteLLM เป็นต้น)

<Tip>
อย่าฮาร์ดโค้ด "ทุกโมเดล" ในเอกสาร รายการที่เป็นแหล่งอ้างอิงหลักคือสิ่งที่ `discoverModels(...)` ส่งคืนบนเครื่องของคุณ รวมกับคีย์ที่มีอยู่
</Tip>

## ข้อมูลรับรอง (ห้าม commit โดยเด็ดขาด)

การทดสอบแบบไลฟ์ค้นหาข้อมูลรับรองด้วยวิธีเดียวกับ CLI ผลที่มีนัยสำคัญในการใช้งานจริง:

- หาก CLI ทำงาน การทดสอบแบบไลฟ์ควรค้นพบคีย์เดียวกัน
- หากการทดสอบแบบไลฟ์แจ้งว่า "ไม่มีข้อมูลรับรอง" ให้ดีบักด้วยวิธีเดียวกับการดีบัก `openclaw models list` / การเลือกโมเดล

- โปรไฟล์การยืนยันตัวตนต่อเอเจนต์: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (นี่คือความหมายของ "คีย์โปรไฟล์" ในการทดสอบแบบไลฟ์)
- การกำหนดค่า: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรี OAuth แบบเดิม: `~/.openclaw/credentials/` (จะถูกคัดลอกไปยังโฮมไลฟ์ที่จัดเตรียมไว้เมื่อมีอยู่ แต่ไม่ใช่ที่จัดเก็บคีย์โปรไฟล์หลัก)
- การรันแบบไลฟ์ภายในเครื่องจะคัดลอกการกำหนดค่าที่ใช้งานอยู่ (โดยตัดการ override `agents.*.workspace` / `agentDir` ออก) และ `auth-profiles.json` ของแต่ละเอเจนต์ ไม่ใช่ส่วนอื่นในไดเรกทอรีของเอเจนต์นั้น ดังนั้นข้อมูล `workspace/` และ `sandboxes/` จะไม่ไปถึงโฮมที่จัดเตรียมไว้ พร้อมทั้งคัดลอกไดเรกทอรี `credentials/` แบบเดิมและไฟล์/ไดเรกทอรีการยืนยันตัวตนของ CLI ภายนอกที่รองรับ (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) ไปยังโฮมทดสอบชั่วคราว

หากต้องการพึ่งพาคีย์จาก env ให้ export คีย์เหล่านั้นก่อนการทดสอบภายในเครื่อง หรือใช้
ตัวรัน Docker ด้านล่างพร้อม `OPENCLAW_PROFILE_FILE` ที่ระบุชัดเจน

## Deepgram แบบไลฟ์ (การถอดเสียง)

- การทดสอบ: `extensions/deepgram/audio.live.test.ts`
- เปิดใช้: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## แผนการเขียนโค้ด BytePlus แบบไลฟ์

- การทดสอบ: `extensions/byteplus/live.test.ts`
- เปิดใช้: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- การ override โมเดลแบบเลือกได้: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## สื่อเวิร์กโฟลว์ ComfyUI แบบไลฟ์

- การทดสอบ: `extensions/comfy/comfy.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- ขอบเขต:
  - ทดสอบเส้นทางรูปภาพ วิดีโอ และ `music_generate` ของ comfy ที่รวมมาให้
  - ข้ามแต่ละความสามารถ เว้นแต่จะกำหนดค่า `plugins.entries.comfy.config.<capability>` ไว้
  - มีประโยชน์หลังจากเปลี่ยนการส่งเวิร์กโฟลว์ comfy, การ polling, การดาวน์โหลด หรือการลงทะเบียน Plugin

## การสร้างรูปภาพแบบไลฟ์

- การทดสอบ: `test/image-generation.runtime.live.test.ts`
- คำสั่ง: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- ขอบเขต:
  - แจกแจง Plugin ผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้ทั้งหมด
  - ใช้ตัวแปร env ของผู้ให้บริการที่ export ไว้แล้วก่อนทำการโพรบ
  - ใช้คีย์ API แบบไลฟ์/จาก env ก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้เป็นค่าเริ่มต้น เพื่อไม่ให้คีย์ทดสอบที่ล้าสมัยใน `auth-profiles.json` บดบังข้อมูลรับรองจริงของเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - รันผู้ให้บริการแต่ละรายที่กำหนดค่าผ่านรันไทม์สร้างรูปภาพที่ใช้ร่วมกัน:
    - `<provider>:generate`
    - `<provider>:edit` เมื่อผู้ให้บริการประกาศว่ารองรับการแก้ไข
- ผู้ให้บริการที่รวมมาให้และครอบคลุมในปัจจุบัน:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- การจำกัดขอบเขตแบบเลือกได้:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- พฤติกรรมการยืนยันตัวตนแบบเลือกได้:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากที่จัดเก็บโปรไฟล์และเพิกเฉยต่อการ override ที่มาจาก env เท่านั้น

สำหรับเส้นทาง CLI ที่จัดส่ง ให้เพิ่มการทดสอบ smoke ของ `infer` หลังจากการทดสอบแบบไลฟ์ของผู้ให้บริการ/รันไทม์
ผ่านแล้ว:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image \
  --prompt "รูปภาพทดสอบแบบแบนราบเรียบง่าย: สี่เหลี่ยมจัตุรัสสีน้ำเงินหนึ่งรูปบนพื้นหลังสีขาว ไม่มีข้อความ" \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

ส่วนนี้ครอบคลุมการแยกวิเคราะห์อาร์กิวเมนต์ CLI, การแก้ไขการกำหนดค่า/เอเจนต์เริ่มต้น, การเปิดใช้งาน
Plugin ที่รวมมาให้, รันไทม์สร้างรูปภาพที่ใช้ร่วมกัน และคำขอแบบไลฟ์ไปยังผู้ให้บริการ
คาดว่าต้องมี dependency ของ Plugin ก่อนโหลดรันไทม์

## การสร้างเพลงแบบไลฟ์

- การทดสอบ: `extensions/music-generation-providers.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ชุดทดสอบ: `pnpm test:live:media music`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างเพลงแบบรวมที่ใช้ร่วมกัน
  - ปัจจุบันครอบคลุม `fal`, `google`, `minimax` และ `openrouter`
  - ใช้ตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ส่งออกไว้แล้วก่อนตรวจหา
  - โดยค่าเริ่มต้นจะใช้คีย์ API จากระบบจริง/ตัวแปรสภาพแวดล้อมก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้ เพื่อไม่ให้คีย์ทดสอบที่ล้าสมัยใน `auth-profiles.json` บดบังข้อมูลประจำตัวจริงของเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - เรียกใช้โหมดรันไทม์ที่ประกาศไว้ทั้งสองโหมดเมื่อพร้อมใช้งาน:
    - `generate` พร้อมอินพุตที่มีเฉพาะพรอมต์
    - `edit` เมื่อผู้ให้บริการประกาศ `capabilities.edit.enabled`
  - `comfy` มีไฟล์ทดสอบระบบจริงแยกต่างหาก ไม่ได้อยู่ในการทดสอบแบบกวาดร่วมนี้
- การจำกัดขอบเขตเพิ่มเติม:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- ลักษณะการยืนยันตัวตนเพิ่มเติม:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากที่เก็บโปรไฟล์และไม่ใช้การแทนค่าที่มาจากตัวแปรสภาพแวดล้อมเท่านั้น

## การสร้างวิดีโอบนระบบจริง

- การทดสอบ: `extensions/video-generation-providers.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ชุดทดสอบ: `pnpm test:live:media video`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างวิดีโอแบบรวมที่ใช้ร่วมกันใน `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - ใช้เส้นทางทดสอบเบื้องต้นที่ปลอดภัยสำหรับรีลีสเป็นค่าเริ่มต้น ได้แก่ คำขอแปลงข้อความเป็นวิดีโอหนึ่งรายการต่อผู้ให้บริการ พรอมต์ Lobster ความยาวหนึ่งวินาที และขีดจำกัดการดำเนินการต่อผู้ให้บริการจาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (ค่าเริ่มต้นคือ `180000`)
  - ข้าม FAL โดยค่าเริ่มต้น เนื่องจากเวลาแฝงของคิวฝั่งผู้ให้บริการอาจกินเวลารีลีสเป็นส่วนใหญ่ ส่ง `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (หรือล้างรายการข้าม) เพื่อเรียกใช้อย่างชัดเจน
  - ใช้ตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ส่งออกไว้แล้วก่อนตรวจหา
  - โดยค่าเริ่มต้นจะใช้คีย์ API จากระบบจริง/ตัวแปรสภาพแวดล้อมก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้ เพื่อไม่ให้คีย์ทดสอบที่ล้าสมัยใน `auth-profiles.json` บดบังข้อมูลประจำตัวจริงของเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - โดยค่าเริ่มต้นจะเรียกใช้เฉพาะ `generate`
  - ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อเรียกใช้โหมดแปลงที่ประกาศไว้ด้วยเมื่อพร้อมใช้งาน:
    - `imageToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.imageToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตรูปภาพภายในเครื่องที่รองรับด้วยบัฟเฟอร์ในการทดสอบแบบกวาดร่วม
    - `videoToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.videoToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตวิดีโอภายในเครื่องที่รองรับด้วยบัฟเฟอร์ในการทดสอบแบบกวาดร่วม
  - ผู้ให้บริการ `imageToVideo` ที่ประกาศไว้แต่ถูกข้ามในการทดสอบแบบกวาดร่วมในปัจจุบัน:
    - `vydra` (เลนนี้ไม่รองรับอินพุตรูปภาพภายในเครื่องที่รองรับด้วยบัฟเฟอร์)
  - ความครอบคลุมเฉพาะผู้ให้บริการ Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ไฟล์นั้นเรียกใช้ `veo3` สำหรับการแปลงข้อความเป็นวิดีโอ พร้อมเลนแปลงรูปภาพเป็นวิดีโอ `kling` ซึ่งใช้ฟิกซ์เจอร์ URL รูปภาพระยะไกลเป็นค่าเริ่มต้น (`OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` เพื่อแทนค่า)
  - ความครอบคลุมเฉพาะผู้ให้บริการ xAI:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - กรณีคลาสสิกจะสร้างเฟรมแรกเป็น PNG สี่เหลี่ยมจัตุรัสภายในเครื่องก่อน ละเว้นเรขาคณิต ขอคลิปแปลงรูปภาพเป็นวิดีโอความยาวหนึ่งวินาที สำรวจสถานะจนเสร็จสมบูรณ์ และตรวจสอบบัฟเฟอร์ที่ดาวน์โหลด
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - กรณี 1.5 จะสร้างเฟรมแรกเป็น PNG ภายในเครื่อง ขอคลิปแปลงรูปภาพเป็นวิดีโอความยาวหนึ่งวินาทีที่ 1080P สำรวจสถานะจนเสร็จสมบูรณ์ และตรวจสอบบัฟเฟอร์ที่ดาวน์โหลด
  - ความครอบคลุมการทดสอบระบบจริงของ `videoToVideo` ในปัจจุบัน:
    - `runway` เฉพาะเมื่อโมเดลที่เลือกถูกแก้ค่าเป็น `gen4_aleph`
  - ผู้ให้บริการ `videoToVideo` ที่ประกาศไว้แต่ถูกข้ามในการทดสอบแบบกวาดร่วมในปัจจุบัน:
    - `alibaba`, `google`, `openai`, `qwen`, `xai` เนื่องจากปัจจุบันเส้นทางเหล่านั้นต้องใช้ URL อ้างอิง `http(s)` ระยะไกล แทนอินพุตภายในเครื่องที่รองรับด้วยบัฟเฟอร์
- การจำกัดขอบเขตเพิ่มเติม:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` เพื่อรวมผู้ให้บริการทุกรายในชุดทดสอบแบบกวาดเริ่มต้น รวมถึง FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` เพื่อลดขีดจำกัดการดำเนินการของผู้ให้บริการแต่ละรายสำหรับการทดสอบเบื้องต้นแบบเข้มข้น
- ลักษณะการยืนยันตัวตนเพิ่มเติม:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากที่เก็บโปรไฟล์และไม่ใช้การแทนค่าที่มาจากตัวแปรสภาพแวดล้อมเท่านั้น

## ชุดทดสอบสื่อบนระบบจริง

- คำสั่ง: `pnpm test:live:media`
- จุดเริ่มต้น: `test/e2e/qa-lab/media/hosted-media-provider-live.ts` ซึ่งเรียกใช้ `pnpm test:live -- <suite-test-file>` ต่อชุดทดสอบที่เลือก เพื่อให้ลักษณะการทำงานของ Heartbeat และโหมดเงียบสอดคล้องกับการเรียกใช้ `pnpm test:live` อื่นๆ
- วัตถุประสงค์:
  - เรียกใช้ชุดทดสอบรูปภาพ เพลง และวิดีโอบนระบบจริงที่ใช้ร่วมกันผ่านจุดเริ่มต้นเดียวที่เป็นส่วนหนึ่งของรีโพ
  - โหลดตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ขาดหายไปจาก `~/.profile` โดยอัตโนมัติ
  - โดยค่าเริ่มต้นจะจำกัดแต่ละชุดทดสอบให้เหลือเฉพาะผู้ให้บริการที่มีการยืนยันตัวตนที่ใช้งานได้ในปัจจุบันโดยอัตโนมัติ
- แฟล็ก:
  - `--providers <csv>` ตัวกรองผู้ให้บริการส่วนกลาง; `--image-providers` / `--music-providers` / `--video-providers` จำกัดขอบเขตตัวกรองไว้ที่ชุดทดสอบเดียว
  - `--all-providers` ข้ามตัวกรองอัตโนมัติที่อิงการยืนยันตัวตน
  - `--allow-empty` ออกจากโปรแกรมด้วย `0` เมื่อการกรองไม่เหลือผู้ให้บริการที่เรียกใช้ได้
  - ส่งผ่าน `--quiet` / `--no-quiet` ไปยัง `test:live`
- ตัวอย่าง:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing) - ชุดทดสอบหน่วย การผสานรวม QA และ Docker
