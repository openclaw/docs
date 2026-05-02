---
read_when:
    - คุณต้องการการตั้งค่าแบบมีคำแนะนำสำหรับ Gateway, พื้นที่ทำงาน, การยืนยันตัวตน, ช่องทาง และ Skills
summary: คู่มืออ้างอิง CLI สำหรับ `openclaw onboard` (การเริ่มต้นใช้งานแบบโต้ตอบ)
title: เริ่มใช้งาน
x-i18n:
    generated_at: "2026-05-02T10:11:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 79fd15da17beb5e66da760bcf490a15340d42af0730c19f04d41908995da8ffb
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

การเริ่มต้นใช้งานแบบโต้ตอบสำหรับการตั้งค่า Gateway ภายในเครื่องหรือระยะไกล

## คู่มือที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ศูนย์กลางการเริ่มต้นใช้งาน CLI" href="/th/start/wizard" icon="rocket">
    คำแนะนำทีละขั้นตอนของโฟลว์ CLI แบบโต้ตอบ
  </Card>
  <Card title="ภาพรวมการเริ่มต้นใช้งาน" href="/th/start/onboarding-overview" icon="map">
    วิธีที่การเริ่มต้นใช้งาน OpenClaw ทำงานร่วมกัน
  </Card>
  <Card title="ข้อมูลอ้างอิงการตั้งค่า CLI" href="/th/start/wizard-cli-reference" icon="book">
    เอาต์พุต กลไกภายใน และพฤติกรรมในแต่ละขั้นตอน
  </Card>
  <Card title="การทำงานอัตโนมัติของ CLI" href="/th/start/wizard-cli-automation" icon="terminal">
    แฟล็กแบบไม่โต้ตอบและการตั้งค่าด้วยสคริปต์
  </Card>
  <Card title="การเริ่มต้นใช้งานแอป macOS" href="/th/start/onboarding" icon="apple">
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

`--flow import` ใช้ผู้ให้บริการการย้ายข้อมูลที่ Plugin เป็นเจ้าของ เช่น Hermes โดยจะทำงานเฉพาะกับการตั้งค่า OpenClaw ใหม่เท่านั้น หากมีการกำหนดค่า ข้อมูลประจำตัว เซสชัน หรือไฟล์หน่วยความจำ/ตัวตนของเวิร์กสเปซอยู่แล้ว ให้รีเซ็ตหรือเลือกการตั้งค่าใหม่ก่อนนำเข้า

`--modern` เริ่มพรีวิวการเริ่มต้นใช้งานแบบสนทนาของ Crestodian หากไม่มี
`--modern` คำสั่ง `openclaw onboard` จะใช้โฟลว์การเริ่มต้นใช้งานแบบคลาสสิกต่อไป

สำหรับปลายทาง `ws://` แบบข้อความธรรมดาบนเครือข่ายส่วนตัว (เฉพาะเครือข่ายที่เชื่อถือได้) ให้ตั้งค่า
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน
ไม่มีค่าเทียบเท่าใน `openclaw.json` สำหรับการข้ามข้อจำกัดฉุกเฉินของการขนส่งฝั่งไคลเอนต์นี้

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
OpenClaw ทำเครื่องหมาย ID โมเดลด้านวิชันทั่วไปว่าใช้อิมเมจได้โดยอัตโนมัติ ส่ง `--custom-image-input` สำหรับ ID วิชันแบบกำหนดเองที่ไม่รู้จัก หรือ `--custom-text-input` เพื่อบังคับใช้เมทาดาทาแบบข้อความเท่านั้น

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

`--custom-base-url` มีค่าเริ่มต้นเป็น `http://127.0.0.1:11434` `--custom-model-id` เป็นตัวเลือก หากละไว้ การเริ่มต้นใช้งานจะใช้ค่าเริ่มต้นที่ Ollama แนะนำ ID โมเดลบนคลาวด์ เช่น `kimi-k2.5:cloud` ก็ใช้ที่นี่ได้เช่นกัน

จัดเก็บคีย์ผู้ให้บริการเป็น refs แทนข้อความธรรมดา:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

เมื่อใช้ `--secret-input-mode ref` การเริ่มต้นใช้งานจะเขียน refs ที่อิงจาก env แทนค่าคีย์แบบข้อความธรรมดา
สำหรับผู้ให้บริการที่อิง auth-profile จะเขียนรายการ `keyRef`; สำหรับผู้ให้บริการแบบกำหนดเอง จะเขียน `models.providers.<id>.apiKey` เป็น env ref (เช่น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`)

สัญญาโหมด `ref` แบบไม่โต้ตอบ:

- ตั้งค่าตัวแปร env ของผู้ให้บริการในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน (เช่น `OPENAI_API_KEY`)
- อย่าส่งแฟล็กคีย์แบบอินไลน์ (เช่น `--openai-api-key`) เว้นแต่ว่าตัวแปร env นั้นถูกตั้งค่าไว้ด้วย
- หากส่งแฟล็กคีย์แบบอินไลน์โดยไม่มีตัวแปร env ที่จำเป็น การเริ่มต้นใช้งานจะล้มเหลวทันทีพร้อมคำแนะนำ

ตัวเลือกโทเค็น Gateway ในโหมดไม่โต้ตอบ:

- `--gateway-auth token --gateway-token <token>` จัดเก็บโทเค็นแบบข้อความธรรมดา
- `--gateway-auth token --gateway-token-ref-env <name>` จัดเก็บ `gateway.auth.token` เป็น env SecretRef
- `--gateway-token` และ `--gateway-token-ref-env` ใช้ร่วมกันไม่ได้
- `--gateway-token-ref-env` ต้องมีตัวแปร env ที่ไม่ว่างในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน
- เมื่อใช้ `--install-daemon` หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็น โทเค็น Gateway ที่จัดการด้วย SecretRef จะถูกตรวจสอบความถูกต้องแต่จะไม่ถูกคงค่าเป็นข้อความธรรมดาที่แก้ค่าแล้วในเมทาดาทาสภาพแวดล้อมของบริการ supervisor
- เมื่อใช้ `--install-daemon` หากโหมดโทเค็นต้องใช้โทเค็นและ SecretRef โทเค็นที่กำหนดค่าไว้ยังแก้ค่าไม่ได้ การเริ่มต้นใช้งานจะล้มเหลวแบบปิดพร้อมคำแนะนำการแก้ไข
- เมื่อใช้ `--install-daemon` หากทั้ง `gateway.auth.token` และ `gateway.auth.password` ถูกกำหนดค่าไว้ และไม่ได้ตั้งค่า `gateway.auth.mode` การเริ่มต้นใช้งานจะบล็อกการติดตั้งจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
- การเริ่มต้นใช้งานภายในเครื่องเขียน `gateway.mode="local"` ลงในการกำหนดค่า หากไฟล์กำหนดค่าในภายหลังไม่มี `gateway.mode` ให้ถือว่าเป็นความเสียหายของการกำหนดค่าหรือการแก้ไขด้วยตนเองที่ไม่สมบูรณ์ ไม่ใช่ทางลัดโหมดภายในเครื่องที่ถูกต้อง
- การเริ่มต้นใช้งานภายในเครื่องติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งเลือกไว้เมื่อเส้นทางการตั้งค่าที่เลือกต้องใช้
- การเริ่มต้นใช้งานระยะไกลเขียนเฉพาะข้อมูลการเชื่อมต่อสำหรับ Gateway ระยะไกล และไม่ติดตั้งแพ็กเกจ Plugin ภายในเครื่อง
- `--allow-unconfigured` เป็นทางออกฉุกเฉินของรันไทม์ Gateway แยกต่างหาก ไม่ได้หมายความว่าการเริ่มต้นใช้งานสามารถละ `gateway.mode` ได้

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

สุขภาพ Gateway ภายในเครื่องแบบไม่โต้ตอบ:

- เว้นแต่ว่าคุณจะส่ง `--skip-health` การเริ่มต้นใช้งานจะรอ Gateway ภายในเครื่องที่เข้าถึงได้ก่อนออกสำเร็จ
- `--install-daemon` เริ่มเส้นทางการติดตั้ง Gateway แบบจัดการก่อน หากไม่มีแฟล็กนี้ คุณต้องมี Gateway ภายในเครื่องทำงานอยู่แล้ว เช่น `openclaw gateway run`
- หากคุณต้องการเพียงเขียนการกำหนดค่า/เวิร์กสเปซ/บูตสแตรปในระบบอัตโนมัติ ให้ใช้ `--skip-health`
- หากคุณจัดการไฟล์เวิร์กสเปซเอง ให้ส่ง `--skip-bootstrap` เพื่อตั้งค่า `agents.defaults.skipBootstrap: true` และข้ามการสร้าง `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, และ `BOOTSTRAP.md`
- บน Windows แบบเนทีฟ `--install-daemon` จะลอง Scheduled Tasks ก่อน และถอยกลับไปใช้รายการเข้าสู่ระบบในโฟลเดอร์ Startup แบบต่อผู้ใช้ หากการสร้างงานถูกปฏิเสธ

พฤติกรรมการเริ่มต้นใช้งานแบบโต้ตอบด้วยโหมดอ้างอิง:

- เลือก **ใช้การอ้างอิงความลับ** เมื่อระบบถาม
- จากนั้นเลือกอย่างใดอย่างหนึ่ง:
  - ตัวแปรสภาพแวดล้อม
  - ผู้ให้บริการความลับที่กำหนดค่าไว้ (`file` หรือ `exec`)
- การเริ่มต้นใช้งานดำเนินการตรวจสอบ preflight อย่างรวดเร็วก่อนบันทึก ref
  - หากการตรวจสอบล้มเหลว การเริ่มต้นใช้งานจะแสดงข้อผิดพลาดและให้คุณลองใหม่ได้

### ตัวเลือกปลายทาง Z.AI แบบไม่โต้ตอบ

<Note>
`--auth-choice zai-api-key` ตรวจหาปลายทาง Z.AI ที่ดีที่สุดสำหรับคีย์ของคุณโดยอัตโนมัติ (เลือกใช้ API ทั่วไปกับ `zai/glm-5.1` ก่อน) หากคุณต้องการปลายทาง GLM Coding Plan โดยเฉพาะ ให้เลือก `zai-coding-global` หรือ `zai-coding-cn`
</Note>

```bash
# การเลือกปลายทางโดยไม่ต้องมีพรอมป์
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# ตัวเลือกปลายทาง Z.AI อื่นๆ:
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
  <Accordion title="ประเภทโฟลว์">
    - `quickstart`: พรอมป์ขั้นต่ำ สร้างโทเค็น Gateway อัตโนมัติ
    - `manual`: พรอมป์เต็มรูปแบบสำหรับพอร์ต การ bind และการยืนยันตัวตน (ชื่อแฝงของ `advanced`)
    - `import`: เรียกใช้ผู้ให้บริการการย้ายข้อมูลที่ตรวจพบ แสดงตัวอย่างแผน จากนั้นนำไปใช้หลังยืนยัน

  </Accordion>
  <Accordion title="การกรองผู้ให้บริการล่วงหน้า">
    เมื่อการเลือกการยืนยันตัวตนสื่อถึงผู้ให้บริการที่ต้องการ การเริ่มต้นใช้งานจะกรองตัวเลือกโมเดลเริ่มต้นและ allowlist ล่วงหน้าให้เหลือผู้ให้บริการนั้น สำหรับ Volcengine และ BytePlus การดำเนินการนี้ยังจับคู่กับตัวแปร coding-plan ด้วย (`volcengine-plan/*`, `byteplus-plan/*`)

    หากตัวกรองผู้ให้บริการที่ต้องการยังไม่ให้โมเดลที่โหลดแล้ว การเริ่มต้นใช้งานจะถอยกลับไปใช้แค็ตตาล็อกที่ไม่ได้กรองแทนการปล่อยให้ตัวเลือกว่าง

  </Accordion>
  <Accordion title="การติดตามผลของการค้นเว็บ">
    ผู้ให้บริการค้นเว็บบางรายเรียกใช้พรอมป์ติดตามผลเฉพาะผู้ให้บริการ:

    - **Grok** สามารถเสนอการตั้งค่า `x_search` แบบไม่บังคับโดยใช้ `XAI_API_KEY` เดียวกันและตัวเลือกโมเดล `x_search`
    - **Kimi** สามารถถามภูมิภาค Moonshot API (`api.moonshot.ai` เทียบกับ `api.moonshot.cn`) และโมเดลค้นเว็บ Kimi เริ่มต้น

  </Accordion>
  <Accordion title="พฤติกรรมอื่นๆ">
    - พฤติกรรมขอบเขต DM ของการเริ่มต้นใช้งานภายในเครื่อง: [ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals)
    - แชตแรกที่เร็วที่สุด: `openclaw dashboard` (Control UI, ไม่ต้องตั้งค่าช่องทาง)
    - ผู้ให้บริการแบบกำหนดเอง: เชื่อมต่อปลายทางที่เข้ากันได้กับ OpenAI หรือ Anthropic ใดก็ได้ รวมถึงผู้ให้บริการแบบโฮสต์ที่ไม่ได้ระบุไว้ ใช้ Unknown เพื่อตรวจหาอัตโนมัติ
    - หากตรวจพบสถานะ Hermes การเริ่มต้นใช้งานจะเสนอขั้นตอนการย้ายข้อมูล ใช้ [ย้ายข้อมูล](/th/cli/migrate) สำหรับแผน dry-run โหมดเขียนทับ รายงาน และการแมปที่แน่นอน

  </Accordion>
</AccordionGroup>

## คำสั่งติดตามผลที่ใช้บ่อย

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` ไม่ได้หมายถึงโหมดไม่โต้ตอบ ใช้ `--non-interactive` สำหรับสคริปต์
</Note>
