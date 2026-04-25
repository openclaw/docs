---
read_when:
    - คุณต้องการการตั้งค่าแบบมีคำแนะนำสำหรับ Gateway, workspace, auth, ช่องทาง และ Skills
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw onboard` (การเริ่มต้นใช้งานแบบโต้ตอบ)
title: Onboard
x-i18n:
    generated_at: "2026-04-25T13:44:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 234c308ea554195df1bd880bda7e30770e926af059740458d056e4a909aaeb07
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Onboard แบบโต้ตอบสำหรับการตั้งค่า Gateway ภายในเครื่องหรือระยะไกล

## คู่มือที่เกี่ยวข้อง

- ศูนย์รวม Onboarding ของ CLI: [Onboarding (CLI)](/th/start/wizard)
- ภาพรวม Onboarding: [Onboarding Overview](/th/start/onboarding-overview)
- ข้อมูลอ้างอิง Onboarding ของ CLI: [CLI Setup Reference](/th/start/wizard-cli-reference)
- ระบบอัตโนมัติของ CLI: [CLI Automation](/th/start/wizard-cli-automation)
- Onboarding บน macOS: [Onboarding (macOS App)](/th/start/onboarding)

## ตัวอย่าง

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--modern` จะเริ่มพรีวิว Onboarding แบบสนทนาของ Crestodian หากไม่ใช้
`--modern`, `openclaw onboard` จะใช้โฟลว์ Onboarding แบบคลาสสิกต่อไป

สำหรับปลายทาง `ws://` แบบข้อความล้วนในเครือข่ายส่วนตัว (เฉพาะเครือข่ายที่เชื่อถือได้เท่านั้น) ให้ตั้งค่า
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ใน environment ของกระบวนการ Onboarding
ไม่มีค่าที่เทียบเท่าใน `openclaw.json` สำหรับ break-glass
ฝั่งไคลเอนต์ของการขนส่งนี้

Custom provider แบบไม่โต้ตอบ:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` เป็นตัวเลือกเสริมในโหมดไม่โต้ตอบ หากไม่ระบุ Onboarding จะตรวจสอบ `CUSTOM_API_KEY`

LM Studio ยังรองรับแฟล็กคีย์เฉพาะ provider ในโหมดไม่โต้ตอบด้วย:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama แบบไม่โต้ตอบ:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` มีค่าเริ่มต้นเป็น `http://127.0.0.1:11434` `--custom-model-id` เป็นตัวเลือกเสริม; หากไม่ระบุ Onboarding จะใช้ค่าเริ่มต้นที่ Ollama แนะนำ คุณยังสามารถใช้ model ID ของคลาวด์ เช่น `kimi-k2.5:cloud` ได้ที่นี่

จัดเก็บคีย์ของ provider เป็น ref แทนข้อความล้วน:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

เมื่อใช้ `--secret-input-mode ref`, Onboarding จะเขียน ref ที่อ้างอิง env แทนค่าคีย์แบบข้อความล้วน
สำหรับ provider ที่รองรับ auth-profile ระบบจะเขียนรายการ `keyRef`; สำหรับ custom provider ระบบจะเขียน `models.providers.<id>.apiKey` เป็น env ref (ตัวอย่างเช่น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`)

ข้อกำหนดของโหมด `ref` แบบไม่โต้ตอบ:

- ตั้งค่า env var ของ provider ใน environment ของกระบวนการ Onboarding (ตัวอย่างเช่น `OPENAI_API_KEY`)
- อย่าส่งแฟล็กคีย์แบบอินไลน์ (ตัวอย่างเช่น `--openai-api-key`) เว้นแต่ env var นั้นจะถูกตั้งค่าไว้ด้วย
- หากส่งแฟล็กคีย์แบบอินไลน์โดยไม่มี env var ที่จำเป็น Onboarding จะล้มเหลวทันทีพร้อมคำแนะนำ

ตัวเลือก token ของ Gateway ในโหมดไม่โต้ตอบ:

- `--gateway-auth token --gateway-token <token>` จะจัดเก็บ token แบบข้อความล้วน
- `--gateway-auth token --gateway-token-ref-env <name>` จะจัดเก็บ `gateway.auth.token` เป็น env SecretRef
- `--gateway-token` และ `--gateway-token-ref-env` ใช้ร่วมกันไม่ได้
- `--gateway-token-ref-env` ต้องมี env var ที่ไม่ว่างใน environment ของกระบวนการ Onboarding
- เมื่อใช้ `--install-daemon`, หาก token auth ต้องใช้ token ระบบจะตรวจสอบ token ของ Gateway ที่จัดการด้วย SecretRef แต่จะไม่จัดเก็บค่า plaintext ที่ resolve แล้วลงใน metadata ของ environment ของบริการ supervisor
- เมื่อใช้ `--install-daemon`, หากโหมด token ต้องใช้ token และ SecretRef ของ token ที่กำหนดไว้ยัง resolve ไม่ได้ Onboarding จะปิดการทำงานแบบ fail-closed พร้อมคำแนะนำในการแก้ไข
- เมื่อใช้ `--install-daemon`, หากมีการกำหนดทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` ระบบจะบล็อกการติดตั้งจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
- Onboarding ภายในเครื่องจะเขียน `gateway.mode="local"` ลงใน config หากไฟล์ config ภายหลังไม่มี `gateway.mode` ให้ถือว่าเป็นความเสียหายของ config หรือการแก้ไขด้วยตนเองที่ไม่สมบูรณ์ ไม่ใช่ทางลัดโหมด local ที่ถูกต้อง
- `--allow-unconfigured` เป็น escape hatch ของ runtime Gateway แยกต่างหาก ไม่ได้หมายความว่า Onboarding สามารถละเว้น `gateway.mode` ได้

ตัวอย่าง:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

การตรวจสุขภาพของ Gateway ภายในเครื่องแบบไม่โต้ตอบ:

- หากคุณไม่ส่ง `--skip-health`, Onboarding จะรอจนกว่า Gateway ภายในเครื่องจะเข้าถึงได้ก่อนจึงจะออกสำเร็จ
- `--install-daemon` จะเริ่มเส้นทางการติดตั้ง Gateway แบบจัดการก่อน หากไม่ใช้ คุณต้องมี Gateway ภายในเครื่องที่กำลังทำงานอยู่แล้ว เช่น `openclaw gateway run`
- หากคุณต้องการเพียงการเขียน config/workspace/bootstrap ในระบบอัตโนมัติ ให้ใช้ `--skip-health`
- หากคุณจัดการไฟล์ workspace เอง ให้ส่ง `--skip-bootstrap` เพื่อตั้งค่า `agents.defaults.skipBootstrap: true` และข้ามการสร้าง `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` และ `BOOTSTRAP.md`
- บน Windows แบบเนทีฟ `--install-daemon` จะพยายามใช้ Scheduled Tasks ก่อน และจะ fallback ไปใช้รายการเริ่มต้นเมื่อเข้าสู่ระบบในโฟลเดอร์ Startup แบบต่อผู้ใช้หากการสร้าง task ถูกปฏิเสธ

พฤติกรรมของ Onboarding แบบโต้ตอบเมื่อใช้โหมด reference:

- เลือก **Use secret reference** เมื่อระบบถาม
- จากนั้นเลือกอย่างใดอย่างหนึ่ง:
  - ตัวแปรสภาพแวดล้อม
  - secret provider ที่กำหนดค่าไว้ (`file` หรือ `exec`)
- Onboarding จะทำการตรวจสอบ preflight อย่างรวดเร็วก่อนบันทึก ref
  - หากการตรวจสอบล้มเหลว Onboarding จะแสดงข้อผิดพลาดและให้คุณลองใหม่ได้

ตัวเลือกปลายทาง Z.AI แบบไม่โต้ตอบ:

หมายเหตุ: ตอนนี้ `--auth-choice zai-api-key` จะตรวจจับปลายทาง Z.AI ที่ดีที่สุดสำหรับคีย์ของคุณโดยอัตโนมัติ (ให้ความสำคัญกับ general API ที่ใช้ `zai/glm-5.1`)
หากคุณต้องการปลายทาง GLM Coding Plan โดยเฉพาะ ให้เลือก `zai-coding-global` หรือ `zai-coding-cn`

```bash
# การเลือกปลายทางโดยไม่ต้องมี prompt
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# ตัวเลือกปลายทาง Z.AI อื่น:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

ตัวอย่าง Mistral แบบไม่โต้ตอบ:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

หมายเหตุเกี่ยวกับโฟลว์:

- `quickstart`: prompt น้อยที่สุด, สร้าง token ของ Gateway อัตโนมัติ
- `manual`: prompt แบบเต็มสำหรับ port/bind/auth (alias ของ `advanced`)
- เมื่อ auth choice บ่งชี้ provider ที่ต้องการ Onboarding จะกรองตัวเลือกโมเดลเริ่มต้นและ allowlist ล่วงหน้าให้เหลือเฉพาะ provider นั้น สำหรับ Volcengine และ BytePlus จะรวมตัวแปร coding-plan ด้วย
  (`volcengine-plan/*`, `byteplus-plan/*`)
- หากตัวกรอง provider ที่ต้องการยังไม่พบโมเดลที่โหลดอยู่ ระบบจะ fallback ไปใช้แค็ตตาล็อกที่ไม่กรองแทนที่จะปล่อยให้ตัวเลือกว่าง
- ในขั้นตอน web-search บาง provider อาจทริกเกอร์ prompt ติดตามผลเฉพาะ provider:
  - **Grok** อาจเสนอการตั้งค่า `x_search` แบบเลือกได้ โดยใช้ `XAI_API_KEY` เดียวกัน และตัวเลือกโมเดล `x_search`
  - **Kimi** อาจถามภูมิภาค API ของ Moonshot (`api.moonshot.ai` เทียบกับ `api.moonshot.cn`) และโมเดลค้นหาเว็บ Kimi เริ่มต้น
- พฤติกรรมขอบเขต DM ของ Onboarding ภายในเครื่อง: [CLI Setup Reference](/th/start/wizard-cli-reference#outputs-and-internals)
- แชตแรกที่เร็วที่สุด: `openclaw dashboard` (Control UI, ไม่ต้องตั้งค่าช่องทาง)
- Custom Provider: เชื่อมต่อปลายทางที่เข้ากันได้กับ OpenAI หรือ Anthropic ใดก็ได้ รวมถึง provider แบบโฮสต์ที่ไม่ได้อยู่ในรายการ ใช้ Unknown เพื่อตรวจจับอัตโนมัติ

## คำสั่งติดตามผลที่ใช้บ่อย

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` ไม่ได้หมายความว่าเป็นโหมดไม่โต้ตอบ ใช้ `--non-interactive` สำหรับสคริปต์
</Note>
