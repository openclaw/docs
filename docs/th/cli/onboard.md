---
read_when:
    - คุณต้องการการตั้งค่าแบบมีคำแนะนำสำหรับ Gateway, พื้นที่ทำงาน, การยืนยันตัวตน, ช่องทาง และ Skills
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw onboard` (การเริ่มต้นใช้งานแบบโต้ตอบ)
title: เริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-05-01T10:14:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1276a0b20f37da470bb4d49b38d06bacc38e7d0e85737a22971a2a9a3d90e244
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

การเริ่มต้นใช้งานแบบโต้ตอบสำหรับการตั้งค่า Gateway แบบภายในเครื่องหรือระยะไกล

## คู่มือที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/th/start/wizard" icon="rocket">
    คำแนะนำแบบทีละขั้นตอนสำหรับโฟลว์ CLI แบบโต้ตอบ
  </Card>
  <Card title="Onboarding overview" href="/th/start/onboarding-overview" icon="map">
    วิธีที่การเริ่มต้นใช้งาน OpenClaw เชื่อมโยงกัน
  </Card>
  <Card title="CLI setup reference" href="/th/start/wizard-cli-reference" icon="book">
    เอาต์พุต กลไกภายใน และพฤติกรรมในแต่ละขั้นตอน
  </Card>
  <Card title="CLI automation" href="/th/start/wizard-cli-automation" icon="terminal">
    แฟล็กแบบไม่โต้ตอบและการตั้งค่าด้วยสคริปต์
  </Card>
  <Card title="macOS app onboarding" href="/th/start/onboarding" icon="apple">
    โฟลว์การเริ่มต้นใช้งานสำหรับแอปแถบเมนู macOS
  </Card>
</CardGroup>

## ตัวอย่าง

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` ใช้ผู้ให้บริการการย้ายข้อมูลที่ Plugin เป็นเจ้าของ เช่น Hermes โดยจะทำงานกับการตั้งค่า OpenClaw ใหม่เท่านั้น หากมีไฟล์ config, credentials, sessions หรือไฟล์หน่วยความจำ/ตัวตนของ workspace อยู่แล้ว ให้รีเซ็ตหรือเลือกการตั้งค่าใหม่ก่อนนำเข้า

`--modern` เริ่มตัวอย่างการเริ่มต้นใช้งานแบบสนทนา Crestodian หากไม่มี
`--modern`, `openclaw onboard` จะใช้โฟลว์การเริ่มต้นใช้งานแบบคลาสสิก

สำหรับเป้าหมาย `ws://` แบบข้อความธรรมดาบนเครือข่ายส่วนตัว (เฉพาะเครือข่ายที่เชื่อถือได้) ให้ตั้งค่า
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน
ไม่มีค่าเทียบเท่าใน `openclaw.json` สำหรับการแก้ปัญหาฉุกเฉินของ transport ฝั่งไคลเอนต์นี้

ผู้ให้บริการแบบกำหนดเองที่ไม่โต้ตอบ:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` เป็นตัวเลือกในโหมดไม่โต้ตอบ หากละไว้ การเริ่มต้นใช้งานจะตรวจสอบ `CUSTOM_API_KEY`
OpenClaw จะทำเครื่องหมายรหัสโมเดล vision ทั่วไปว่า รองรับรูปภาพโดยอัตโนมัติ ส่ง `--custom-image-input` สำหรับรหัส vision แบบกำหนดเองที่ไม่รู้จัก หรือ `--custom-text-input` เพื่อบังคับใช้ metadata แบบข้อความเท่านั้น

LM Studio ยังรองรับแฟล็กคีย์เฉพาะผู้ให้บริการในโหมดไม่โต้ตอบด้วย:

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

`--custom-base-url` มีค่าเริ่มต้นเป็น `http://127.0.0.1:11434` `--custom-model-id` เป็นตัวเลือก หากละไว้ การเริ่มต้นใช้งานจะใช้ค่าเริ่มต้นที่ Ollama แนะนำ รหัสโมเดลคลาวด์ เช่น `kimi-k2.5:cloud` ก็ใช้งานได้ที่นี่เช่นกัน

จัดเก็บคีย์ผู้ให้บริการเป็น refs แทนข้อความธรรมดา:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

เมื่อใช้ `--secret-input-mode ref` การเริ่มต้นใช้งานจะเขียน refs ที่อ้างอิง env แทนค่าคีย์แบบข้อความธรรมดา
สำหรับผู้ให้บริการที่รองรับ auth-profile การดำเนินการนี้จะเขียนรายการ `keyRef`; สำหรับผู้ให้บริการแบบกำหนดเอง การดำเนินการนี้จะเขียน `models.providers.<id>.apiKey` เป็น env ref (เช่น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`)

สัญญาของโหมด `ref` แบบไม่โต้ตอบ:

- ตั้งค่าตัวแปร env ของผู้ให้บริการในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน (เช่น `OPENAI_API_KEY`)
- อย่าส่งแฟล็กคีย์แบบ inline (เช่น `--openai-api-key`) เว้นแต่ว่าตัวแปร env นั้นถูกตั้งค่าไว้ด้วย
- หากส่งแฟล็กคีย์แบบ inline โดยไม่มีตัวแปร env ที่จำเป็น การเริ่มต้นใช้งานจะล้มเหลวทันทีพร้อมคำแนะนำ

ตัวเลือกโทเค็น Gateway ในโหมดไม่โต้ตอบ:

- `--gateway-auth token --gateway-token <token>` จัดเก็บโทเค็นแบบข้อความธรรมดา
- `--gateway-auth token --gateway-token-ref-env <name>` จัดเก็บ `gateway.auth.token` เป็น env SecretRef
- `--gateway-token` และ `--gateway-token-ref-env` ใช้ร่วมกันไม่ได้
- `--gateway-token-ref-env` ต้องมีตัวแปร env ที่ไม่ว่างในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน
- เมื่อใช้ `--install-daemon` หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็น โทเค็น Gateway ที่จัดการด้วย SecretRef จะถูกตรวจสอบความถูกต้อง แต่จะไม่ถูกบันทึกเป็นข้อความธรรมดาที่ resolve แล้วใน metadata ของสภาพแวดล้อมบริการ supervisor
- เมื่อใช้ `--install-daemon` หากโหมดโทเค็นต้องใช้โทเค็นและ SecretRef ของโทเค็นที่กำหนดค่าไว้ยัง resolve ไม่ได้ การเริ่มต้นใช้งานจะล้มเหลวแบบปิดพร้อมคำแนะนำการแก้ไข
- เมื่อใช้ `--install-daemon` หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` การเริ่มต้นใช้งานจะบล็อกการติดตั้งจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
- การเริ่มต้นใช้งานภายในเครื่องจะเขียน `gateway.mode="local"` ลงใน config หากไฟล์ config ภายหลังไม่มี `gateway.mode` ให้ถือว่าเป็น config เสียหายหรือการแก้ไขด้วยตนเองที่ไม่สมบูรณ์ ไม่ใช่ทางลัดของโหมดภายในเครื่องที่ถูกต้อง
- การเริ่มต้นใช้งานภายในเครื่องจะสร้าง dependency รันไทม์ของ Plugin ที่รวมมาใหม่ซึ่งจำเป็น หลังจากเขียน config และก่อนที่ workspace/bootstrap, การติดตั้ง daemon หรือการตรวจสุขภาพจะดำเนินต่อไป นี่เป็นขั้นตอนซ่อมแซม package-manager แบบแคบ ไม่ใช่การรัน `openclaw doctor` เต็มรูปแบบ
- การเริ่มต้นใช้งานระยะไกลจะเขียนเฉพาะข้อมูลการเชื่อมต่อสำหรับ Gateway ระยะไกล และจะไม่ติดตั้ง dependency ของ Plugin ที่รวมมาแบบภายในเครื่อง
- `--allow-unconfigured` เป็นช่องทางหลีกเลี่ยงรันไทม์ Gateway แยกต่างหาก ไม่ได้หมายความว่าการเริ่มต้นใช้งานสามารถละเว้น `gateway.mode` ได้

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

สุขภาพของ Gateway ภายในเครื่องแบบไม่โต้ตอบ:

- เว้นแต่ว่าคุณส่ง `--skip-health` การเริ่มต้นใช้งานจะรอให้ Gateway ภายในเครื่องเข้าถึงได้ก่อนจึงจะออกสำเร็จ
- `--install-daemon` จะเริ่มเส้นทางการติดตั้ง Gateway แบบจัดการก่อน หากไม่มีแฟล็กนี้ คุณต้องมี Gateway ภายในเครื่องที่กำลังทำงานอยู่แล้ว เช่น `openclaw gateway run`
- หากคุณต้องการเพียงการเขียน config/workspace/bootstrap ใน automation ให้ใช้ `--skip-health`
- หากคุณจัดการไฟล์ workspace เอง ให้ส่ง `--skip-bootstrap` เพื่อตั้งค่า `agents.defaults.skipBootstrap: true` และข้ามการสร้าง `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` และ `BOOTSTRAP.md`
- บน Windows แบบ native, `--install-daemon` จะลอง Scheduled Tasks ก่อน และถอยกลับไปใช้รายการเข้าสู่ระบบในโฟลเดอร์ Startup ต่อผู้ใช้ หากการสร้าง task ถูกปฏิเสธ

พฤติกรรมการเริ่มต้นใช้งานแบบโต้ตอบด้วยโหมดอ้างอิง:

- เลือก **ใช้การอ้างอิง secret** เมื่อระบบถาม
- จากนั้นเลือกอย่างใดอย่างหนึ่ง:
  - ตัวแปรสภาพแวดล้อม
  - ผู้ให้บริการ secret ที่กำหนดค่าไว้ (`file` หรือ `exec`)
- การเริ่มต้นใช้งานจะทำการตรวจสอบ preflight อย่างรวดเร็วก่อนบันทึก ref
  - หากการตรวจสอบล้มเหลว การเริ่มต้นใช้งานจะแสดงข้อผิดพลาดและให้คุณลองใหม่

### ตัวเลือก endpoint ของ Z.AI แบบไม่โต้ตอบ

<Note>
`--auth-choice zai-api-key` จะตรวจหา endpoint ของ Z.AI ที่ดีที่สุดสำหรับคีย์ของคุณโดยอัตโนมัติ (ให้ความสำคัญกับ API ทั่วไปที่ใช้ `zai/glm-5.1`) หากคุณต้องการ endpoint ของ GLM Coding Plan โดยเฉพาะ ให้เลือก `zai-coding-global` หรือ `zai-coding-cn`
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
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

## หมายเหตุเกี่ยวกับโฟลว์

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: prompts ขั้นต่ำ สร้างโทเค็น Gateway โดยอัตโนมัติ
    - `manual`: prompts เต็มรูปแบบสำหรับ port, bind และ auth (นามแฝงของ `advanced`)
    - `import`: รันผู้ให้บริการการย้ายข้อมูลที่ตรวจพบ แสดงตัวอย่างแผน แล้วนำไปใช้หลังยืนยัน

  </Accordion>
  <Accordion title="Provider prefiltering">
    เมื่อการเลือก auth บ่งชี้ผู้ให้บริการที่ต้องการ การเริ่มต้นใช้งานจะกรองล่วงหน้าให้ตัวเลือก default-model และ allowlist เหลือเฉพาะผู้ให้บริการนั้น สำหรับ Volcengine และ BytePlus การดำเนินการนี้ยังจับคู่กับตัวแปร coding-plan (`volcengine-plan/*`, `byteplus-plan/*`) ด้วย

    หากตัวกรองผู้ให้บริการที่ต้องการยังไม่มีโมเดลที่โหลดแล้ว การเริ่มต้นใช้งานจะถอยกลับไปใช้ catalog ที่ไม่กรองแทนการปล่อยให้ตัวเลือกว่าง

  </Accordion>
  <Accordion title="Web-search follow-ups">
    ผู้ให้บริการค้นหาเว็บบางรายจะเรียก prompts ติดตามผลเฉพาะผู้ให้บริการ:

    - **Grok** สามารถเสนอการตั้งค่า `x_search` แบบตัวเลือก โดยใช้ `XAI_API_KEY` เดียวกันและการเลือกโมเดล `x_search`
    - **Kimi** สามารถถาม region ของ Moonshot API (`api.moonshot.ai` เทียบกับ `api.moonshot.cn`) และโมเดลค้นหาเว็บ Kimi เริ่มต้น

  </Accordion>
  <Accordion title="Other behaviors">
    - พฤติกรรมขอบเขต DM ของการเริ่มต้นใช้งานภายในเครื่อง: [CLI setup reference](/th/start/wizard-cli-reference#outputs-and-internals)
    - แชตแรกที่เร็วที่สุด: `openclaw dashboard` (Control UI, ไม่ต้องตั้งค่าช่องทาง)
    - ผู้ให้บริการแบบกำหนดเอง: เชื่อมต่อ endpoint ที่เข้ากันได้กับ OpenAI หรือ Anthropic ใดก็ได้ รวมถึงผู้ให้บริการแบบ hosted ที่ไม่ได้อยู่ในรายการ ใช้ Unknown เพื่อตรวจจับอัตโนมัติ
    - หากตรวจพบสถานะ Hermes การเริ่มต้นใช้งานจะเสนอโฟลว์การย้ายข้อมูล ใช้ [Migrate](/th/cli/migrate) สำหรับแผน dry-run, โหมดเขียนทับ, รายงาน และ mapping ที่แน่นอน

  </Accordion>
</AccordionGroup>

## คำสั่งติดตามผลทั่วไป

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` ไม่ได้หมายถึงโหมดไม่โต้ตอบ ใช้ `--non-interactive` สำหรับสคริปต์
</Note>
