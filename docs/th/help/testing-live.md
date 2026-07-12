---
read_when:
    - การรันทดสอบเบื้องต้นแบบสดสำหรับเมทริกซ์โมเดล / แบ็กเอนด์ CLI / ACP / ผู้ให้บริการสื่อ
    - การแก้ไขข้อบกพร่องในการระบุข้อมูลรับรองสำหรับการทดสอบแบบใช้งานจริง
    - การเพิ่มการทดสอบแบบไลฟ์เฉพาะสำหรับผู้ให้บริการรายใหม่
sidebarTitle: Live tests
summary: 'การทดสอบแบบใช้งานจริง (ที่เชื่อมต่อเครือข่าย): เมทริกซ์โมเดล, แบ็กเอนด์ CLI, ACP, ผู้ให้บริการสื่อ, ข้อมูลประจำตัว'
title: 'การทดสอบ: ชุดทดสอบแบบสด'
x-i18n:
    generated_at: "2026-07-12T16:14:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

สำหรับการเริ่มต้นอย่างรวดเร็ว ตัวรัน QA ชุดทดสอบหน่วย/การผสานรวม และโฟลว์ Docker โปรดดู
[การทดสอบ](/th/help/testing) หน้านี้ครอบคลุมการทดสอบ **แบบไลฟ์** (ที่ติดต่อเครือข่าย):
เมทริกซ์โมเดล แบ็กเอนด์ CLI, ACP, ผู้ให้บริการสื่อ และการจัดการข้อมูลประจำตัว

## แบบไลฟ์: คำสั่งตรวจสอบเบื้องต้นภายในเครื่อง

ส่งออกคีย์ของผู้ให้บริการที่จำเป็นไปยังสภาพแวดล้อมของโพรเซสก่อนดำเนินการ
ตรวจสอบแบบไลฟ์เฉพาะกิจ

การตรวจสอบสื่อเบื้องต้นอย่างปลอดภัย:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

การตรวจสอบความพร้อมสำหรับการโทรด้วยเสียงอย่างปลอดภัย:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` เป็นการทดลองรัน เว้นแต่จะระบุ `--yes` ด้วย ให้ใช้ `--yes` เฉพาะ
เมื่อคุณตั้งใจโทรจริงเท่านั้น สำหรับ Twilio, Telnyx และ Plivo การตรวจสอบ
ความพร้อมที่สำเร็จต้องใช้ URL ของ Webhook สาธารณะ ระบบจะปฏิเสธ URL แบบ local loopback/ส่วนตัว
เนื่องจากผู้ให้บริการเหล่านั้นไม่สามารถเข้าถึง URL ดังกล่าวได้

## แบบไลฟ์: การกวาดตรวจความสามารถของ Node Android

- การทดสอบ: `src/gateway/android-node.capabilities.live.test.ts`
- สคริปต์: `pnpm android:test:integration`
- เป้าหมาย: เรียกใช้ **ทุกคำสั่งที่ประกาศใช้อยู่ในขณะนี้** โดย Node Android ที่เชื่อมต่อ และยืนยันพฤติกรรมตามสัญญาของคำสั่ง
- ขอบเขต:
  - ต้องตั้งค่าเงื่อนไขล่วงหน้า/ด้วยตนเอง (ชุดทดสอบจะไม่ติดตั้ง/เรียกใช้/จับคู่แอป)
  - ตรวจสอบ `node.invoke` ของ Gateway ทีละคำสั่งสำหรับ Node Android ที่เลือก
- การตั้งค่าล่วงหน้าที่จำเป็น:
  - แอป Android เชื่อมต่อและจับคู่กับ Gateway แล้ว
  - เปิดแอปไว้เบื้องหน้า
  - ให้สิทธิ์/ความยินยอมในการจับข้อมูลสำหรับความสามารถที่คุณคาดว่าจะให้ผ่าน
- การเขียนทับเป้าหมายที่เลือกได้:
  - `OPENCLAW_ANDROID_NODE_ID` หรือ `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- รายละเอียดการตั้งค่า Android ทั้งหมด: [แอป Android](/th/platforms/android)

## แบบไลฟ์: การตรวจสอบโมเดลเบื้องต้น (คีย์โปรไฟล์)

การทดสอบโมเดลแบบไลฟ์แบ่งออกเป็นสองชั้นเพื่อแยกความล้มเหลวออกจากกัน:

- "โมเดลโดยตรง" บอกว่าผู้ให้บริการ/โมเดลสามารถตอบด้วยคีย์ที่กำหนดได้หรือไม่
- "การตรวจสอบ Gateway เบื้องต้น" บอกว่าไปป์ไลน์ Gateway+เอเจนต์ทั้งหมดทำงานกับโมเดลนั้นหรือไม่ (เซสชัน ประวัติ เครื่องมือ นโยบายแซนด์บ็อกซ์ ฯลฯ)

รายการโมเดลที่คัดสรรด้านล่างอยู่ใน `src/agents/live-model-filter.ts` และ
เปลี่ยนแปลงตามเวลา ให้ถือว่าอาร์เรย์ในไฟล์นั้นเป็นแหล่งข้อมูลจริง ไม่ใช่
หน้านี้

MiniMax M3 ใช้ `minimax/MiniMax-M3` เป็นการอ้างอิงผู้ให้บริการ/โมเดลเริ่มต้น

### ชั้นที่ 1: การสร้างคำตอบจากโมเดลโดยตรง (ไม่มี Gateway)

- การทดสอบ: `src/agents/models.profiles.live.test.ts`
- เป้าหมาย:
  - แจกแจงโมเดลที่ค้นพบ
  - ใช้ `getApiKeyForModel` เพื่อเลือกโมเดลที่คุณมีข้อมูลประจำตัว
  - เรียกใช้การสร้างคำตอบขนาดเล็กต่อโมเดล (และการทดสอบการถดถอยแบบเจาะจงเมื่อจำเป็น)
- วิธีเปิดใช้งาน:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
  - ตั้งค่า `OPENCLAW_LIVE_MODELS=modern`, `small` หรือ `all` (นามแฝงของ `modern`) เพื่อเรียกใช้ชุดทดสอบนี้จริง มิฉะนั้นระบบจะข้าม ดังนั้น `pnpm test:live` เพียงอย่างเดียวจึงยังคงมุ่งเน้นการตรวจสอบ Gateway เบื้องต้น
- วิธีเลือกโมเดล:
  - `OPENCLAW_LIVE_MODELS=modern` เรียกใช้รายการลำดับความสำคัญที่คัดสรรและให้สัญญาณสูง (ดู [แบบไลฟ์: เมทริกซ์โมเดล](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` เรียกใช้รายการลำดับความสำคัญของโมเดลขนาดเล็กที่คัดสรร
  - `OPENCLAW_LIVE_MODELS=all` เป็นนามแฝงของ `modern`
  - หรือ `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (รายการอนุญาตที่คั่นด้วยจุลภาค)
  - การเรียกใช้โมเดลขนาดเล็กของ Ollama ภายในเครื่องใช้ `http://127.0.0.1:11434` เป็นค่าเริ่มต้น ให้ตั้งค่า `OPENCLAW_LIVE_OLLAMA_BASE_URL` เฉพาะสำหรับปลายทาง LAN, แบบกำหนดเอง หรือ Ollama Cloud
  - การกวาดตรวจแบบ modern/all และ small ใช้ความยาวของรายการที่คัดสรรเป็นขีดจำกัดโดยค่าเริ่มต้น ให้ตั้งค่า `OPENCLAW_LIVE_MAX_MODELS=0` สำหรับการกวาดตรวจโปรไฟล์ที่เลือกทั้งหมด หรือใช้จำนวนบวกเพื่อกำหนดขีดจำกัดที่เล็กลง
  - การกวาดตรวจทั้งหมดใช้ `OPENCLAW_LIVE_TEST_TIMEOUT_MS` เป็นระยะหมดเวลาสำหรับการทดสอบโมเดลโดยตรงทั้งหมด ค่าเริ่มต้น: 60 นาที
  - โพรบโมเดลโดยตรงทำงานพร้อมกัน 20 งานโดยค่าเริ่มต้น ให้ตั้งค่า `OPENCLAW_LIVE_MODEL_CONCURRENCY` เพื่อเขียนทับ
- วิธีเลือกผู้ให้บริการ:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (รายการอนุญาตที่คั่นด้วยจุลภาค)
- แหล่งที่มาของคีย์:
  - โดยค่าเริ่มต้น: ที่เก็บโปรไฟล์และค่าทดแทนจากสภาพแวดล้อม
  - ตั้งค่า `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับให้ใช้เฉพาะ **ที่เก็บโปรไฟล์**
- เหตุผลที่มีการทดสอบนี้:
  - แยกกรณี "API ของผู้ให้บริการเสีย/คีย์ไม่ถูกต้อง" ออกจาก "ไปป์ไลน์เอเจนต์ของ Gateway เสีย"
  - ครอบคลุมการทดสอบการถดถอยขนาดเล็กที่แยกออกจากกัน (ตัวอย่าง: การเล่นซ้ำการให้เหตุผลของ OpenAI Responses/Codex Responses + โฟลว์การเรียกใช้เครื่องมือ)

### ชั้นที่ 2: การตรวจสอบ Gateway + เอเจนต์สำหรับการพัฒนาเบื้องต้น (สิ่งที่ "@openclaw" ทำจริง)

- การทดสอบ: `src/gateway/gateway-models.profiles.live.test.ts`
- เป้าหมาย:
  - เริ่ม Gateway ภายในโพรเซส
  - สร้าง/แก้ไขเซสชัน `agent:dev:*` (เขียนทับโมเดลต่อการเรียกใช้)
  - วนผ่านโมเดลที่มีคีย์และยืนยันว่า:
    - ได้คำตอบที่ "มีความหมาย" (ไม่ใช้เครื่องมือ)
    - การเรียกใช้เครื่องมือจริงทำงานได้ (โพรบการอ่าน)
    - โพรบเครื่องมือเพิ่มเติมที่เลือกได้ (โพรบการดำเนินการ+การอ่าน)
    - เส้นทางการทดสอบการถดถอยของ OpenAI (เฉพาะการเรียกใช้เครื่องมือ -> การติดตามผล) ยังคงทำงาน
- รายละเอียดโพรบ (เพื่อให้คุณอธิบายความล้มเหลวได้อย่างรวดเร็ว):
  - โพรบ `read`: การทดสอบเขียนไฟล์ nonce ในพื้นที่ทำงาน และขอให้เอเจนต์ `read` ไฟล์นั้นแล้วส่ง nonce กลับมา
  - โพรบ `exec+read`: การทดสอบขอให้เอเจนต์ใช้ `exec` เขียน nonce ลงในไฟล์ชั่วคราว แล้วใช้ `read` อ่านกลับมา
  - โพรบรูปภาพ: การทดสอบแนบ PNG ที่สร้างขึ้น (แมว + รหัสแบบสุ่ม) และคาดว่าโมเดลจะส่งคืน `cat <CODE>`
  - ข้อมูลอ้างอิงการนำไปใช้: `src/gateway/gateway-models.profiles.live.test.ts` และ `test/helpers/live-image-probe.ts`
- วิธีเปิดใช้งาน:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- วิธีเลือกโมเดล:
  - ค่าเริ่มต้น: รายการลำดับความสำคัญที่คัดสรรและให้สัญญาณสูง (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` เรียกใช้รายการโมเดลขนาดเล็กที่คัดสรรผ่านไปป์ไลน์ Gateway+เอเจนต์ทั้งหมด
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` เป็นนามแฝงของ `modern`
  - หรือตั้งค่า `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (หรือรายการที่คั่นด้วยจุลภาค) เพื่อจำกัดขอบเขต
  - การกวาดตรวจ Gateway แบบ modern/all และ small ใช้ความยาวของรายการที่คัดสรรเป็นขีดจำกัดโดยค่าเริ่มต้น ให้ตั้งค่า `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` สำหรับการกวาดตรวจที่เลือกทั้งหมด หรือใช้จำนวนบวกเพื่อกำหนดขีดจำกัดที่เล็กลง
- วิธีเลือกผู้ให้บริการ (หลีกเลี่ยง "ทุกอย่างผ่าน OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (รายการอนุญาตที่คั่นด้วยจุลภาค)
- โพรบเครื่องมือและรูปภาพจะเปิดอยู่เสมอในการทดสอบแบบไลฟ์นี้:
  - โพรบ `read` + โพรบ `exec+read` (การทดสอบภาระของเครื่องมือ)
  - โพรบรูปภาพทำงานเมื่อโมเดลประกาศว่ารองรับอินพุตรูปภาพ
  - โฟลว์ (ภาพรวม):
    - การทดสอบสร้าง PNG ขนาดเล็กที่มี "CAT" + รหัสแบบสุ่ม (`test/helpers/live-image-probe.ts`)
    - ส่งผ่าน `agent` โดยใช้ `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway แยกวิเคราะห์ไฟล์แนบเป็น `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - เอเจนต์แบบฝังส่งต่อข้อความผู้ใช้แบบหลายรูปแบบไปยังโมเดล
    - การยืนยัน: คำตอบมี `cat` + รหัส (ความคลาดเคลื่อนของ OCR: อนุญาตข้อผิดพลาดเล็กน้อย)

<Tip>
หากต้องการดูว่าคุณสามารถทดสอบอะไรได้บ้างในเครื่องของคุณ (รวมถึง ID `provider/model` ที่แน่นอน) ให้เรียกใช้:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## แบบไลฟ์: การตรวจสอบแบ็กเอนด์ CLI เบื้องต้น (Claude, Gemini หรือ CLI ภายในเครื่องอื่นๆ)

- การทดสอบ: `src/gateway/gateway-cli-backend.live.test.ts`
- เป้าหมาย: ตรวจสอบไปป์ไลน์ Gateway + เอเจนต์โดยใช้แบ็กเอนด์ CLI ภายในเครื่อง โดยไม่แตะต้องการกำหนดค่าเริ่มต้นของคุณ
- ค่าเริ่มต้นสำหรับการตรวจสอบเบื้องต้นเฉพาะแบ็กเอนด์อยู่ในคำจำกัดความ `cli-backend.ts` ของ Plugin เจ้าของ
- เปิดใช้งาน:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- ค่าเริ่มต้น:
  - ผู้ให้บริการ/โมเดลเริ่มต้น: `claude-cli/claude-sonnet-4-6`
  - พฤติกรรมของคำสั่ง/อาร์กิวเมนต์/รูปภาพมาจากข้อมูลเมตาของ Plugin แบ็กเอนด์ CLI เจ้าของ
- การเขียนทับ (เลือกได้):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` เพื่อส่งไฟล์แนบรูปภาพจริง (ระบบแทรกพาธลงในพรอมต์) ปิดโดยค่าเริ่มต้นในสูตร Docker
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` เพื่อส่งพาธไฟล์รูปภาพเป็นอาร์กิวเมนต์ CLI แทนการแทรกลงในพรอมต์
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (หรือ `"list"`) เพื่อควบคุมวิธีส่งอาร์กิวเมนต์รูปภาพเมื่อตั้งค่า `IMAGE_ARG`
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` เพื่อส่งรอบสนทนาที่สองและตรวจสอบโฟลว์การดำเนินการต่อ
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` เพื่อเลือกใช้โพรบความต่อเนื่องในเซสชันเดียวกันจาก Claude Sonnet -> Opus เมื่อโมเดลที่เลือกรองรับเป้าหมายการสลับ ปิดโดยค่าเริ่มต้น รวมถึงในสูตร Docker
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` เพื่อเลือกใช้โพรบ MCP/ลูปแบ็กของเครื่องมือ ปิดโดยค่าเริ่มต้นในสูตร Docker

ตัวอย่าง:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

การตรวจสอบการกำหนดค่า Gemini MCP เบื้องต้นที่ประหยัด:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

การทดสอบนี้ไม่ได้ขอให้ Gemini สร้างคำตอบ แต่จะเขียนการตั้งค่าระบบแบบเดียวกับที่
OpenClaw มอบให้ Gemini จากนั้นเรียกใช้ `gemini --debug mcp list` เพื่อพิสูจน์ว่า
เซิร์ฟเวอร์ `transport: "streamable-http"` ที่บันทึกไว้ถูกปรับให้อยู่ในรูปแบบ HTTP MCP
ของ Gemini และสามารถเชื่อมต่อกับเซิร์ฟเวอร์ MCP แบบ HTTP สตรีมได้ภายในเครื่อง

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
- ตัวรันจะเรียกใช้การตรวจสอบแบ็กเอนด์ CLI แบบไลฟ์ภายในอิมเมจ Docker ของที่เก็บในฐานะผู้ใช้ `node` ที่ไม่ใช่รูท
- ตัวรันจะแก้ไขข้อมูลเมตาการตรวจสอบ CLI จาก Plugin เจ้าของ จากนั้นติดตั้งแพ็กเกจ CLI สำหรับ Linux ที่ตรงกัน (`@anthropic-ai/claude-code` หรือ `@google/gemini-cli`) ลงในคำนำหน้าที่เขียนได้และแคชไว้ที่ `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`)
- `codex-cli` ไม่ใช่แบ็กเอนด์ CLI ที่รวมมาให้อีกต่อไป ให้ใช้ `openai/*` ร่วมกับรันไทม์เซิร์ฟเวอร์แอป Codex แทน (ดู [แบบไลฟ์: การตรวจสอบฮาร์เนสเซิร์ฟเวอร์แอป Codex เบื้องต้น](#live-codex-app-server-harness-smoke))
- `pnpm test:docker:live-cli-backend:claude-subscription` ต้องใช้ OAuth ของการสมัครสมาชิก Claude Code แบบพกพา ผ่าน `~/.claude/.credentials.json` ที่มี `claudeAiOauth.subscriptionType` หรือ `CLAUDE_CODE_OAUTH_TOKEN` จาก `claude setup-token` ก่อนอื่นจะพิสูจน์การทำงานของ `claude -p` โดยตรงใน Docker จากนั้นเรียกใช้แบ็กเอนด์ CLI ของ Gateway สองรอบโดยไม่เก็บตัวแปรสภาพแวดล้อมคีย์ API ของ Anthropic ไว้ เลนการสมัครสมาชิกนี้ปิดใช้โพรบ MCP/เครื่องมือและรูปภาพของ Claude โดยค่าเริ่มต้น เนื่องจากใช้โควตาของการสมัครสมาชิกที่ลงชื่อเข้าใช้ และ Anthropic สามารถเปลี่ยนพฤติกรรมการเรียกเก็บเงินและการจำกัดอัตราของ Claude Agent SDK / `claude -p` ได้โดยไม่ต้องมีรุ่น OpenClaw ใหม่
- Claude และ Gemini รองรับชุดโพรบเดียวกัน (รอบข้อความ การจำแนกรูปภาพ การเรียกใช้เครื่องมือ `cron` ของ MCP ความต่อเนื่องในการสลับโมเดล) ผ่านแฟล็กข้างต้น แต่ไม่มีโพรบใดทำงานโดยค่าเริ่มต้น ให้เลือกใช้แต่ละแฟล็กตามความจำเป็น

## แบบไลฟ์: การเข้าถึงพร็อกซี APNs HTTP/2

- การทดสอบ: `src/infra/push-apns-http2.live.test.ts`
- เป้าหมาย: สร้างอุโมงค์ผ่านพร็อกซี HTTP CONNECT ภายในเครื่องไปยังปลายทาง APNs แซนด์บ็อกซ์ของ Apple ส่งคำขอตรวจสอบ APNs HTTP/2 และยืนยันว่าการตอบกลับจริง `403 InvalidProviderToken` ของ Apple กลับมาผ่านเส้นทางพร็อกซี
- เปิดใช้งาน:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- ระยะหมดเวลาที่เลือกได้:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## แบบไลฟ์: การตรวจสอบการผูก ACP เบื้องต้น (`/acp spawn ... --bind here`)

- การทดสอบ: `src/gateway/gateway-acp-bind.live.test.ts`
- เป้าหมาย: ตรวจสอบโฟลว์การผูกการสนทนา ACP จริงกับเอเจนต์ ACP แบบสด:
  - ส่ง `/acp spawn <agent> --bind here`
  - ผูกการสนทนาจำลองของช่องทางข้อความไว้ ณ ตำแหน่งเดิม
  - ส่งข้อความติดตามผลปกติในการสนทนาเดียวกัน
  - ตรวจสอบว่าข้อความติดตามผลถูกบันทึกในทรานสคริปต์ของเซสชัน ACP ที่ผูกไว้
- การเปิดใช้:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- ค่าเริ่มต้น:
  - เอเจนต์ ACP ใน Docker: `claude,codex,gemini`
  - เอเจนต์ ACP สำหรับการเรียก `pnpm test:live ...` โดยตรง: `claude`
  - ช่องทางจำลอง: บริบทการสนทนาแบบข้อความส่วนตัวของ Slack
  - แบ็กเอนด์ ACP: `acpx`
- การกำหนดค่าทับ:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (หรือ `on`/`true`/`yes`) เพื่อบังคับเปิดโพรบรูปภาพ ค่าอื่นใดจะบังคับปิด โดยค่าเริ่มต้นจะทำงานกับเอเจนต์ทุกตัว ยกเว้น `opencode`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- หมายเหตุ:
  - เลนนี้ใช้พื้นผิว `chat.send` ของ Gateway พร้อมฟิลด์เส้นทางต้นทางจำลองสำหรับผู้ดูแลระบบเท่านั้น เพื่อให้การทดสอบแนบบริบทช่องทางข้อความได้โดยไม่แสร้งว่ามีการส่งออกไปภายนอก
  - เมื่อไม่ได้ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` การทดสอบจะใช้รีจิสทรีเอเจนต์ในตัวของ Plugin `acpx` แบบฝังสำหรับเอเจนต์ชุดทดสอบ ACP ที่เลือก
  - การสร้าง Cron MCP ของเซสชันที่ผูกไว้จะดำเนินการแบบพยายามให้ดีที่สุดโดยค่าเริ่มต้น เนื่องจากชุดทดสอบ ACP ภายนอกอาจยกเลิกการเรียก MCP หลังจากหลักฐานการผูก/รูปภาพผ่านแล้ว ให้ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` เพื่อให้โพรบ Cron หลังการผูกนี้เป็นแบบเคร่งครัด

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
- โดยค่าเริ่มต้น ตัวรันจะเรียกการทดสอบควันการผูก ACP กับเอเจนต์ CLI แบบสดที่รวมไว้ตามลำดับ: `claude`, `codex` และ `gemini`
- ใช้ `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` หรือ `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` เพื่อจำกัดเมทริกซ์
- ตัวรันจะจัดเตรียมข้อมูลการยืนยันตัวตน CLI ที่ตรงกันไว้ในคอนเทนเนอร์ จากนั้นติดตั้ง CLI แบบสดที่ร้องขอ (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid ผ่าน `https://app.factory.ai/cli`, `@google/gemini-cli` หรือ `opencode-ai`) หากยังไม่มี ส่วนแบ็กเอนด์ ACP คือแพ็กเกจ `acpx/runtime` แบบฝังจาก Plugin `acpx` อย่างเป็นทางการ
- ตัวแปร Docker สำหรับ Droid จะจัดเตรียม `~/.factory` สำหรับการตั้งค่า ส่งต่อ `FACTORY_API_KEY` และกำหนดให้ต้องมีคีย์ API นี้ เนื่องจากการยืนยันตัวตน Factory ด้วย OAuth/พวงกุญแจภายในเครื่องไม่สามารถย้ายเข้าไปในคอนเทนเนอร์ได้ โดยใช้รายการรีจิสทรี `droid exec --output-format acp` ในตัวของ ACPX
- ตัวแปร Docker สำหรับ OpenCode เป็นเลนการถดถอยแบบเอเจนต์เดียวที่เคร่งครัด โดยจะเขียนโมเดลเริ่มต้นชั่วคราวใน `OPENCODE_CONFIG_CONTENT` จาก `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (ค่าเริ่มต้น `opencode/kimi-k2.6`)
- การเรียก CLI `acpx` โดยตรงเป็นเพียงเส้นทางแบบดำเนินการเอง/ทางแก้ชั่วคราวสำหรับเปรียบเทียบพฤติกรรมนอก Gateway การทดสอบควันการผูก ACP ใน Docker จะทดสอบแบ็กเอนด์รันไทม์ `acpx` แบบฝังของ OpenClaw

## แบบสด: การทดสอบควันชุดทดสอบ Codex app-server

- เป้าหมาย: ตรวจสอบชุดทดสอบ Codex ที่ Plugin เป็นเจ้าของผ่านเมธอด `agent` ปกติของ Gateway:
  - โหลด Plugin `codex` ที่รวมไว้
  - เลือกโมเดล OpenAI ผ่าน `/model <ref> --runtime codex`
  - ส่งรอบการทำงานแรกของเอเจนต์ Gateway ด้วยระดับการคิดที่ร้องขอ
  - ส่งรอบการทำงานที่สองไปยังเซสชัน OpenClaw เดิม และตรวจสอบว่าเธรด app-server สามารถทำงานต่อได้
  - เรียก `/codex status` และ `/codex models` ผ่านเส้นทางคำสั่ง Gateway เดียวกัน
  - เลือกเรียกโพรบเชลล์แบบยกระดับสิทธิ์สองรายการที่ Guardian ตรวจสอบ: คำสั่งที่ไม่เป็นอันตรายหนึ่งรายการซึ่งควรได้รับอนุมัติ และการอัปโหลดความลับปลอมหนึ่งรายการซึ่งควรถูกปฏิเสธเพื่อให้เอเจนต์ถามกลับ
- การทดสอบ: `src/gateway/gateway-codex-harness.live.test.ts`
- การเปิดใช้: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- โมเดลพื้นฐานของชุดทดสอบ: `openai/gpt-5.6-luna`
- ค่าเริ่มต้นสำหรับการเลือกด้วยคีย์ API ใหม่ของ OpenAI: `openai/gpt-5.6`
- ระดับการคิดเริ่มต้น: `low`
- การกำหนดโมเดลทับ: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- การกำหนดระดับการคิดทับ: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- การกำหนดเมทริกซ์ทับ: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- โหมดการยืนยันตัวตน: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (ค่าเริ่มต้น) ใช้ข้อมูลเข้าสู่ระบบ Codex ที่คัดลอกมา ส่วน `api-key` ใช้ `OPENAI_API_KEY` ผ่าน Codex app-server
- โพรบรูปภาพแบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- โพรบ MCP/เครื่องมือแบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- โพรบ Guardian แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- การทดสอบควันบังคับให้ผู้ให้บริการ/โมเดลใช้ `agentRuntime.id: "codex"` เพื่อป้องกันไม่ให้ชุดทดสอบ Codex ที่เสียผ่านการทดสอบด้วยการย้อนกลับไปใช้ OpenClaw โดยไม่แจ้ง
- การยืนยันตัวตน: การยืนยันตัวตนของ Codex app-server จากการเข้าสู่ระบบการสมัครสมาชิก Codex ภายในเครื่อง หรือ `OPENAI_API_KEY` เมื่อ `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key` โดย Docker สามารถคัดลอก `~/.codex/auth.json` และ `~/.codex/config.toml` สำหรับการเรียกด้วยการสมัครสมาชิก

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

เมทริกซ์ Codex แบบเนทีฟของ GPT-5.6:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

ค่าเริ่มต้นใหม่สำหรับคีย์ API ของ OpenAI:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

หลักฐานนี้จะไม่ตั้งค่า `OPENCLAW_LIVE_GATEWAY_MODELS` แก้ค่าโมเดลผ่านรอยต่อการเลือกจากการอนุมานในการเริ่มต้นใช้งานใหม่ ยืนยันค่า `openai/gpt-5.6` จากนั้นเรียกรอบการทำงานจริงของ Gateway ด้วยโมเดลที่แก้ค่าแล้ว

เมทริกซ์ OpenClaw แบบฝังของ GPT-5.6:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

หมายเหตุเกี่ยวกับ Docker:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-codex-harness-docker.sh`
- ตัวรันจะส่งผ่าน `OPENAI_API_KEY` คัดลอกไฟล์ยืนยันตัวตนของ Codex CLI เมื่อมี ติดตั้ง `@openai/codex` ลงในคำนำหน้า npm ที่เมานต์และเขียนได้ จัดเตรียมซอร์สทรี จากนั้นเรียกเฉพาะการทดสอบแบบสดของชุดทดสอบ Codex
- Docker เปิดใช้โพรบรูปภาพ, MCP/เครื่องมือ และ Guardian โดยค่าเริ่มต้น ให้ตั้งค่า `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` หรือ `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` หรือ `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` เมื่อต้องการเรียกการดีบักที่มีขอบเขตแคบลง
- Docker ใช้การกำหนดค่ารันไทม์ Codex แบบชัดเจนเดียวกัน ดังนั้นนามแฝงแบบเก่าหรือการย้อนกลับไปใช้ OpenClaw จึงไม่สามารถซ่อนการถดถอยของชุดทดสอบ Codex ได้
- เป้าหมายในเมทริกซ์จะทำงานตามลำดับในคอนเทนเนอร์เดียว สคริปต์ Docker จะปรับระยะหมดเวลาเริ่มต้น 35 นาทีตามจำนวนเป้าหมาย ระยะหมดเวลาของเชลล์ภายนอกหรือ CI ต้องรองรับเวลารวมเดียวกัน CI มาตรฐานจะเก็บแต่ละเป้าหมาย GPT-5.6 ไว้ในชาร์ดแยกกัน

### สูตรแบบสดที่แนะนำ

รายการอนุญาตที่แคบและชัดเจนทำงานได้เร็วที่สุดและไม่เสถียรน้อยที่สุด:

- โมเดลเดียว แบบโดยตรง (ไม่ผ่าน Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- โปรไฟล์โมเดลขนาดเล็กแบบโดยตรง:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- โปรไฟล์ Gateway สำหรับโมเดลขนาดเล็ก:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การทดสอบควัน API ของ Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- โมเดลเดียว การทดสอบควันผ่าน Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การเรียกใช้เครื่องมือผ่านผู้ให้บริการหลายราย:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การทดสอบควัน Z.AI Coding Plan GLM-5.2 แบบโดยตรง:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- เน้น Google (คีย์ API ของ Gemini + Antigravity):
  - Gemini (คีย์ API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การทดสอบควันการคิดแบบปรับตัวของ Google (`qa manual` จาก QA CLI ส่วนตัว ซึ่งต้องใช้ `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` และเช็กเอาต์ซอร์ส โปรดดู [ภาพรวม QA](/th/concepts/qa-e2e-automation)):
  - ค่าเริ่มต้นแบบไดนามิกของ Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - งบประมาณแบบไดนามิกของ Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

หมายเหตุ:

- `google/...` ใช้ Gemini API (คีย์ API)
- `google-antigravity/...` ใช้บริดจ์ OAuth ของ Antigravity (ปลายทางเอเจนต์แบบ Cloud Code Assist)
- `google-gemini-cli/...` ใช้ Gemini CLI ภายในเครื่องของคุณ (มีลักษณะเฉพาะด้านการยืนยันตัวตนและเครื่องมือแยกต่างหาก)
- Gemini API เทียบกับ Gemini CLI:
  - API: OpenClaw เรียก Gemini API ที่ Google ให้บริการผ่าน HTTP (คีย์ API / การยืนยันตัวตนด้วยโปรไฟล์) ซึ่งเป็นสิ่งที่ผู้ใช้ส่วนใหญ่หมายถึงเมื่อกล่าวถึง "Gemini"
  - CLI: OpenClaw เรียกใช้ไบนารี `gemini` ภายในเครื่องผ่านเชลล์ โดยมีการยืนยันตัวตนของตนเองและอาจทำงานต่างออกไป (การสตรีม/การรองรับเครื่องมือ/ความคลาดเคลื่อนระหว่างเวอร์ชัน)

## แบบสด: เมทริกซ์โมเดล (สิ่งที่เราครอบคลุม)

การทดสอบแบบสดเป็นแบบเลือกเข้าร่วม จึงไม่มี "รายการโมเดล CI" แบบตายตัว `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (และนามแฝง `all` ของทั้งสองค่า) จะเรียกรายการลำดับความสำคัญที่คัดสรรจาก `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` ใน `src/agents/live-model-filter.ts` ตามลำดับความสำคัญต่อไปนี้:

| ผู้ให้บริการ/โมเดล                           | หมายเหตุ   |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k2.7-code`                     |            |
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

รายการ **โมเดลขนาดเล็ก** ที่คัดสรรไว้ (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`) จาก `SMALL_LIVE_MODEL_PRIORITY`:

| ผู้ให้บริการ/โมเดล          |
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

- ผู้ให้บริการ `codex` และ `codex-cli` ไม่รวมอยู่ในการทดสอบกวาดรายการสมัยใหม่ตามค่าเริ่มต้น (ครอบคลุมพฤติกรรมของแบ็กเอนด์ CLI/ACP ซึ่งทดสอบแยกต่างหากด้านบน) ตัว `openai/gpt-5.5` จะกำหนดเส้นทางผ่านชุดทดสอบเซิร์ฟเวอร์แอป Codex ตามค่าเริ่มต้น โปรดดู [การทดสอบสด: การทดสอบเบื้องต้นของชุดทดสอบเซิร์ฟเวอร์แอป Codex](#live-codex-app-server-harness-smoke)
- `fireworks`, `google`, `openrouter` และ `xai` จะเรียกใช้เฉพาะรหัสโมเดลที่คัดสรรไว้อย่างชัดเจนในการทดสอบกวาดรายการสมัยใหม่เท่านั้น (ไม่มีการขยายเป็น "ทุกโมเดลจากผู้ให้บริการนี้" โดยอัตโนมัติ)
- ใส่โมเดลที่รองรับรูปภาพอย่างน้อยหนึ่งโมเดล (โมเดลด้านการมองเห็นในตระกูล Claude/Gemini/OpenAI เป็นต้น) ใน `OPENCLAW_LIVE_GATEWAY_MODELS` เพื่อเรียกใช้การตรวจสอบรูปภาพ

เรียกใช้การทดสอบเบื้องต้นของ Gateway พร้อมเครื่องมือและรูปภาพกับชุดโมเดลข้ามผู้ให้บริการที่เลือกด้วยตนเอง:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

ความครอบคลุมเพิ่มเติมที่เลือกทำได้นอกเหนือจากรายการที่คัดสรรไว้ (ควรมีหากทำได้ โดยเลือกโมเดลที่รองรับ "เครื่องมือ" และคุณเปิดใช้งานไว้):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (หากคุณมีสิทธิ์เข้าถึง)
- LM Studio: `lmstudio/...` (ภายในเครื่อง การเรียกใช้เครื่องมือขึ้นอยู่กับโหมด API)

### ตัวรวบรวม / Gateway ทางเลือก

หากคุณเปิดใช้งานคีย์ไว้ คุณยังสามารถทดสอบผ่านรายการต่อไปนี้ได้:

- OpenRouter: `openrouter/...` (โมเดลหลายร้อยรายการ ใช้ `openclaw models scan` เพื่อค้นหาโมเดลที่รองรับเครื่องมือและรูปภาพ)
- OpenCode: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go (ยืนยันตัวตนผ่าน `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

ผู้ให้บริการเพิ่มเติมที่คุณสามารถใส่ในเมทริกซ์การทดสอบสด (หากคุณมีข้อมูลประจำตัว/การกำหนดค่า):

- มีมาให้ในตัว: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- ผ่าน `models.providers` (ปลายทางที่กำหนดเอง): `minimax` (คลาวด์/API) รวมถึงพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic (LM Studio, vLLM, LiteLLM เป็นต้น)

<Tip>
อย่าฮาร์ดโค้ด "โมเดลทั้งหมด" ในเอกสาร รายการที่เป็นแหล่งข้อมูลหลักคือรายการที่ `discoverModels(...)` ส่งคืนบนเครื่องของคุณ รวมกับคีย์ที่พร้อมใช้งาน
</Tip>

## ข้อมูลประจำตัว (ห้ามคอมมิตเด็ดขาด)

การทดสอบสดจะค้นหาข้อมูลประจำตัวด้วยวิธีเดียวกับ CLI ผลในทางปฏิบัติมีดังนี้:

- หาก CLI ทำงานได้ การทดสอบสดควรค้นพบคีย์ชุดเดียวกัน
- หากการทดสอบสดแจ้งว่า "ไม่มีข้อมูลประจำตัว" ให้แก้ไขข้อบกพร่องด้วยวิธีเดียวกับที่คุณใช้แก้ไข `openclaw models list` / การเลือกโมเดล

- โปรไฟล์การยืนยันตัวตนต่อเอเจนต์: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (นี่คือความหมายของ "คีย์โปรไฟล์" ในการทดสอบสด)
- การกำหนดค่า: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรี OAuth แบบเก่า: `~/.openclaw/credentials/` (จะคัดลอกไปยังโฮมทดสอบสดที่จัดเตรียมไว้เมื่อมีอยู่ แต่ไม่ใช่ที่เก็บคีย์โปรไฟล์หลัก)
- การเรียกใช้การทดสอบสดภายในเครื่องจะคัดลอกการกำหนดค่าที่ใช้งานอยู่ (โดยตัดค่าการแทนที่ `agents.*.workspace` / `agentDir` ออก) และ `auth-profiles.json` ของแต่ละเอเจนต์ แต่ไม่คัดลอกส่วนที่เหลือของไดเรกทอรีเอเจนต์นั้น ดังนั้นข้อมูลใน `workspace/` และ `sandboxes/` จะไม่ถูกส่งไปยังโฮมที่จัดเตรียมไว้ รวมทั้งคัดลอกไดเรกทอรี `credentials/` แบบเก่าและไฟล์/ไดเรกทอรีการยืนยันตัวตนของ CLI ภายนอกที่รองรับ (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) ไปยังโฮมทดสอบชั่วคราว

หากต้องการใช้คีย์จากตัวแปรสภาพแวดล้อม ให้ส่งออกตัวแปรเหล่านั้นก่อนการทดสอบภายในเครื่อง หรือใช้
ตัวรัน Docker ด้านล่างพร้อมระบุ `OPENCLAW_PROFILE_FILE` อย่างชัดเจน

## การทดสอบสดของ Deepgram (การถอดเสียง)

- การทดสอบ: `extensions/deepgram/audio.live.test.ts`
- เปิดใช้งาน: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## การทดสอบสดของแผนการเขียนโค้ด BytePlus

- การทดสอบ: `extensions/byteplus/live.test.ts`
- เปิดใช้งาน: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- การแทนที่โมเดลที่เลือกทำได้: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## การทดสอบสดของสื่อจากเวิร์กโฟลว์ ComfyUI

- การทดสอบ: `extensions/comfy/comfy.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- ขอบเขต:
  - ทดสอบเส้นทางรูปภาพ วิดีโอ และ `music_generate` ของ comfy ที่รวมมาให้
  - ข้ามความสามารถแต่ละรายการ เว้นแต่จะกำหนดค่า `plugins.entries.comfy.config.<capability>` ไว้
  - มีประโยชน์หลังจากเปลี่ยนแปลงการส่งเวิร์กโฟลว์ comfy การสำรวจสถานะ การดาวน์โหลด หรือการลงทะเบียน Plugin

## การทดสอบสดของการสร้างรูปภาพ

- การทดสอบ: `test/image-generation.runtime.live.test.ts`
- คำสั่ง: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ชุดทดสอบ: `pnpm test:live:media image`
- ขอบเขต:
  - แจกแจง Plugin ผู้ให้บริการสร้างรูปภาพทุกตัวที่ลงทะเบียนไว้
  - ใช้ตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ส่งออกไว้แล้วก่อนทำการตรวจสอบ
  - ใช้คีย์ API จากการทดสอบสด/ตัวแปรสภาพแวดล้อมก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้ตามค่าเริ่มต้น เพื่อไม่ให้คีย์ทดสอบเก่าใน `auth-profiles.json` บดบังข้อมูลประจำตัวจริงของเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - เรียกใช้ผู้ให้บริการแต่ละรายที่กำหนดค่าผ่านรันไทม์การสร้างรูปภาพที่ใช้ร่วมกัน:
    - `<provider>:generate`
    - `<provider>:edit` เมื่อผู้ให้บริการประกาศว่ารองรับการแก้ไข
- ผู้ให้บริการที่รวมมาให้ซึ่งครอบคลุมอยู่ในปัจจุบัน:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- การจำกัดขอบเขตที่เลือกทำได้:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- พฤติกรรมการยืนยันตัวตนที่เลือกใช้ได้:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นค่าการแทนที่ที่มาจากตัวแปรสภาพแวดล้อมเท่านั้น

สำหรับเส้นทาง CLI ที่เผยแพร่ ให้เพิ่มการทดสอบเบื้องต้น `infer` หลังจากการทดสอบสดของผู้ให้บริการ/รันไทม์
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

ส่วนนี้ครอบคลุมการแยกวิเคราะห์อาร์กิวเมนต์ CLI การแก้ไขการกำหนดค่า/เอเจนต์เริ่มต้น การเปิดใช้งาน
Plugin ที่รวมมาให้ รันไทม์การสร้างรูปภาพที่ใช้ร่วมกัน และคำขอสดไปยังผู้ให้บริการ
ต้องมีการติดตั้งการขึ้นต่อกันของ Plugin ไว้ก่อนโหลดรันไทม์

## การทดสอบสดของการสร้างเพลง

- การทดสอบ: `extensions/music-generation-providers.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ชุดทดสอบ: `pnpm test:live:media music`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างเพลงแบบใช้ร่วมกันที่รวมมาให้
  - ปัจจุบันครอบคลุม `fal`, `google`, `minimax` และ `openrouter`
  - ใช้ตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ส่งออกไว้แล้วก่อนทำการตรวจสอบ
  - ใช้คีย์ API จากการทดสอบสด/ตัวแปรสภาพแวดล้อมก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้ตามค่าเริ่มต้น เพื่อไม่ให้คีย์ทดสอบเก่าใน `auth-profiles.json` บดบังข้อมูลประจำตัวจริงของเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - เรียกใช้โหมดรันไทม์ที่ประกาศไว้ทั้งสองโหมดเมื่อพร้อมใช้งาน:
    - `generate` พร้อมข้อมูลเข้าที่มีเฉพาะพรอมต์
    - `edit` เมื่อผู้ให้บริการประกาศ `capabilities.edit.enabled`
  - `comfy` มีไฟล์การทดสอบสดแยกต่างหากของตนเอง ไม่ได้อยู่ในการทดสอบกวาดรายการร่วมนี้
- การจำกัดขอบเขตที่เลือกทำได้:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- พฤติกรรมการยืนยันตัวตนที่เลือกใช้ได้:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากที่เก็บโปรไฟล์และละเว้นค่าการแทนที่ที่มาจากตัวแปรสภาพแวดล้อมเท่านั้น

## การทดสอบสดของการสร้างวิดีโอ

- การทดสอบ: `extensions/video-generation-providers.live.test.ts`
- เปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ชุดทดสอบ: `pnpm test:live:media video`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างวิดีโอแบบรวมที่ใช้ร่วมกัน ครอบคลุม `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - ค่าเริ่มต้นใช้เส้นทางทดสอบเบื้องต้นที่ปลอดภัยสำหรับการเผยแพร่: คำขอแปลงข้อความเป็นวิดีโอหนึ่งรายการต่อผู้ให้บริการ พรอมต์กุ้งมังกรความยาวหนึ่งวินาที และขีดจำกัดเวลาการดำเนินการต่อผู้ให้บริการจาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (ค่าเริ่มต้นคือ `180000`)
  - ข้าม FAL โดยค่าเริ่มต้น เนื่องจากเวลาแฝงของคิวฝั่งผู้ให้บริการอาจกินเวลาส่วนใหญ่ของกระบวนการเผยแพร่ ให้ส่ง `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (หรือล้างรายการข้าม) เพื่อเรียกใช้อย่างชัดเจน
  - ใช้ตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ส่งออกไว้แล้วก่อนทำการตรวจหา
  - ใช้คีย์ API จากการทดสอบจริง/ตัวแปรสภาพแวดล้อมก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้โดยค่าเริ่มต้น เพื่อไม่ให้คีย์ทดสอบที่ล้าสมัยใน `auth-profiles.json` บดบังข้อมูลประจำตัวจริงของเชลล์
  - ข้ามผู้ให้บริการที่ไม่มีการยืนยันตัวตน/โปรไฟล์/โมเดลที่ใช้งานได้
  - เรียกใช้เฉพาะ `generate` โดยค่าเริ่มต้น
  - ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อเรียกใช้โหมดแปลงที่ประกาศไว้ด้วยเมื่อพร้อมใช้งาน:
    - `imageToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.imageToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตรูปภาพภายในเครื่องที่มีบัฟเฟอร์รองรับในการทดสอบรวม
    - `videoToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.videoToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตวิดีโอภายในเครื่องที่มีบัฟเฟอร์รองรับในการทดสอบรวม
  - ผู้ให้บริการ `imageToVideo` ที่ประกาศไว้แต่ถูกข้ามในการทดสอบรวมปัจจุบัน:
    - `vydra` (เลนนี้ไม่รองรับอินพุตรูปภาพภายในเครื่องที่มีบัฟเฟอร์รองรับ)
  - ความครอบคลุมเฉพาะผู้ให้บริการ Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ไฟล์ดังกล่าวเรียกใช้การแปลงข้อความเป็นวิดีโอด้วย `veo3` รวมถึงเลนการแปลงรูปภาพเป็นวิดีโอด้วย `kling` ซึ่งใช้ฟิกซ์เจอร์ URL รูปภาพระยะไกลโดยค่าเริ่มต้น (ใช้ `OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` เพื่อแทนที่)
  - ความครอบคลุมเฉพาะผู้ให้บริการ xAI:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - กรณีคลาสสิกจะสร้างเฟรมแรกเป็น PNG สี่เหลี่ยมจัตุรัสภายในเครื่องก่อน ไม่ระบุเรขาคณิต ขอคลิปแปลงรูปภาพเป็นวิดีโอความยาวหนึ่งวินาที ตรวจสอบสถานะเป็นระยะจนเสร็จสิ้น และตรวจสอบบัฟเฟอร์ที่ดาวน์โหลด
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - กรณี 1.5 จะสร้างเฟรมแรกเป็น PNG ภายในเครื่อง ขอคลิปแปลงรูปภาพเป็นวิดีโอความละเอียด 1080P ความยาวหนึ่งวินาที ตรวจสอบสถานะเป็นระยะจนเสร็จสิ้น และตรวจสอบบัฟเฟอร์ที่ดาวน์โหลด
  - ความครอบคลุมการทดสอบจริงของ `videoToVideo` ในปัจจุบัน:
    - `runway` เฉพาะเมื่อโมเดลที่เลือกได้รับการแปลงค่าเป็น `gen4_aleph`
  - ผู้ให้บริการ `videoToVideo` ที่ประกาศไว้แต่ถูกข้ามในการทดสอบรวมปัจจุบัน:
    - `alibaba`, `google`, `openai`, `qwen`, `xai` เนื่องจากปัจจุบันเส้นทางเหล่านั้นต้องใช้ URL อ้างอิงระยะไกลแบบ `http(s)` แทนอินพุตภายในเครื่องที่มีบัฟเฟอร์รองรับ
- การจำกัดขอบเขตเพิ่มเติม:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` เพื่อรวมผู้ให้บริการทุกรายในชุดทดสอบเริ่มต้น รวมถึง FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` เพื่อลดขีดจำกัดเวลาการดำเนินการของผู้ให้บริการแต่ละรายสำหรับการทดสอบเบื้องต้นแบบเข้มงวด
- ลักษณะการยืนยันตัวตนเพิ่มเติม:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้การยืนยันตัวตนจากพื้นที่จัดเก็บโปรไฟล์และไม่สนใจค่าที่แทนที่ผ่านตัวแปรสภาพแวดล้อมเท่านั้น

## ชุดทดสอบสื่อแบบทดสอบจริง

- คำสั่ง: `pnpm test:live:media`
- จุดเริ่มต้น: `test/e2e/qa-lab/media/hosted-media-provider-live.ts` ซึ่งเรียกใช้ `pnpm test:live -- <suite-test-file>` ต่อชุดทดสอบที่เลือก เพื่อให้ลักษณะการทำงานของ Heartbeat และโหมดเงียบสอดคล้องกับการเรียกใช้ `pnpm test:live` อื่น ๆ
- วัตถุประสงค์:
  - เรียกใช้ชุดทดสอบจริงสำหรับรูปภาพ เพลง และวิดีโอที่ใช้ร่วมกันผ่านจุดเริ่มต้นแบบเนทีฟของที่เก็บเพียงจุดเดียว
  - โหลดตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ขาดหายไปจาก `~/.profile` โดยอัตโนมัติ
  - จำกัดแต่ละชุดทดสอบไว้เฉพาะผู้ให้บริการที่มีการยืนยันตัวตนที่ใช้งานได้ในปัจจุบันโดยอัตโนมัติตามค่าเริ่มต้น
- แฟล็ก:
  - `--providers <csv>` ตัวกรองผู้ให้บริการส่วนกลาง; `--image-providers` / `--music-providers` / `--video-providers` จำกัดตัวกรองไว้ที่ชุดทดสอบหนึ่งชุด
  - `--all-providers` ข้ามตัวกรองอัตโนมัติตามการยืนยันตัวตน
  - `--allow-empty` ออกจากโปรแกรมด้วยรหัส `0` เมื่อการกรองไม่เหลือผู้ให้บริการที่เรียกใช้ได้
  - ส่งต่อ `--quiet` / `--no-quiet` ไปยัง `test:live`
- ตัวอย่าง:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing) - ชุดทดสอบหน่วย การผสานรวม การประกันคุณภาพ และ Docker
