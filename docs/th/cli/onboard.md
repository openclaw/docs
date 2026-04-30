---
read_when:
    - คุณต้องการการตั้งค่าแบบมีคำแนะนำสำหรับ Gateway, พื้นที่ทำงาน, การยืนยันตัวตน, ช่องทาง และ Skills
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw onboard` (การเริ่มต้นใช้งานแบบโต้ตอบ)
title: เริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-04-30T09:44:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 583310458b2e2bc8ddc1513112c960520d972716be0c33e4177d0db30e896504
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

การเริ่มต้นใช้งานแบบโต้ตอบสำหรับการตั้งค่า Gateway ภายในเครื่องหรือระยะไกล

## คู่มือที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ศูนย์รวมการเริ่มต้นใช้งาน CLI" href="/th/start/wizard" icon="rocket">
    คำแนะนำทีละขั้นตอนของโฟลว์ CLI แบบโต้ตอบ
  </Card>
  <Card title="ภาพรวมการเริ่มต้นใช้งาน" href="/th/start/onboarding-overview" icon="map">
    วิธีที่การเริ่มต้นใช้งาน OpenClaw ทำงานร่วมกัน
  </Card>
  <Card title="ข้อมูลอ้างอิงการตั้งค่า CLI" href="/th/start/wizard-cli-reference" icon="book">
    เอาต์พุต รายละเอียดภายใน และพฤติกรรมในแต่ละขั้นตอน
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

`--flow import` ใช้ผู้ให้บริการการย้ายข้อมูลที่ Plugin เป็นเจ้าของ เช่น Hermes โดยจะทำงานกับการตั้งค่า OpenClaw ใหม่เท่านั้น หากมี config, credentials, sessions หรือไฟล์ workspace memory/identity อยู่แล้ว ให้รีเซ็ตหรือเลือกการตั้งค่าใหม่ก่อนนำเข้า

`--modern` เริ่มพรีวิวการเริ่มต้นใช้งานแบบสนทนาของ Crestodian หากไม่มี
`--modern`, `openclaw onboard` จะคงโฟลว์การเริ่มต้นใช้งานแบบคลาสสิกไว้

สำหรับเป้าหมาย `ws://` แบบข้อความธรรมดาบนเครือข่ายส่วนตัว (เฉพาะเครือข่ายที่เชื่อถือได้) ให้ตั้งค่า
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน
ไม่มีรายการเทียบเท่าใน `openclaw.json` สำหรับการทำ break-glass ของการขนส่งฝั่งไคลเอ็นต์นี้

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
OpenClaw ทำเครื่องหมาย ID โมเดล vision ทั่วไปว่าใช้งานรูปภาพได้โดยอัตโนมัติ ส่ง `--custom-image-input` สำหรับ ID vision แบบกำหนดเองที่ไม่รู้จัก หรือ `--custom-text-input` เพื่อบังคับ metadata แบบข้อความเท่านั้น

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

`--custom-base-url` มีค่าเริ่มต้นเป็น `http://127.0.0.1:11434` `--custom-model-id` เป็นตัวเลือก หากละไว้ การเริ่มต้นใช้งานจะใช้ค่าเริ่มต้นที่ Ollama แนะนำ ID โมเดลบนคลาวด์ เช่น `kimi-k2.5:cloud` ก็ใช้ได้ที่นี่เช่นกัน

จัดเก็บคีย์ผู้ให้บริการเป็น refs แทนข้อความธรรมดา:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

เมื่อใช้ `--secret-input-mode ref` การเริ่มต้นใช้งานจะเขียน refs ที่อิง env แทนค่าคีย์แบบข้อความธรรมดา
สำหรับผู้ให้บริการที่อิง auth-profile สิ่งนี้จะเขียนรายการ `keyRef`; สำหรับผู้ให้บริการแบบกำหนดเอง สิ่งนี้จะเขียน `models.providers.<id>.apiKey` เป็น env ref (เช่น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`)

สัญญาของโหมด `ref` แบบไม่โต้ตอบ:

- ตั้งค่า env var ของผู้ให้บริการในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน (เช่น `OPENAI_API_KEY`)
- อย่าส่งแฟล็กคีย์แบบ inline (เช่น `--openai-api-key`) เว้นแต่ env var นั้นจะถูกตั้งค่าไว้ด้วย
- หากส่งแฟล็กคีย์แบบ inline โดยไม่มี env var ที่จำเป็น การเริ่มต้นใช้งานจะล้มเหลวทันทีพร้อมคำแนะนำ

ตัวเลือกโทเค็น Gateway ในโหมดไม่โต้ตอบ:

- `--gateway-auth token --gateway-token <token>` จัดเก็บโทเค็นแบบข้อความธรรมดา
- `--gateway-auth token --gateway-token-ref-env <name>` จัดเก็บ `gateway.auth.token` เป็น env SecretRef
- `--gateway-token` และ `--gateway-token-ref-env` ใช้ร่วมกันไม่ได้
- `--gateway-token-ref-env` ต้องมี env var ที่ไม่ว่างในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน
- เมื่อใช้ `--install-daemon` หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็น โทเค็น gateway ที่จัดการด้วย SecretRef จะถูกตรวจสอบความถูกต้องแต่จะไม่ถูกคงอยู่เป็นข้อความธรรมดาที่ resolve แล้วใน metadata สภาพแวดล้อมของบริการ supervisor
- เมื่อใช้ `--install-daemon` หากโหมดโทเค็นต้องใช้โทเค็นและ SecretRef โทเค็นที่กำหนดค่าไว้ไม่สามารถ resolve ได้ การเริ่มต้นใช้งานจะล้มเหลวแบบปิดพร้อมคำแนะนำการแก้ไข
- เมื่อใช้ `--install-daemon` หากทั้ง `gateway.auth.token` และ `gateway.auth.password` ถูกกำหนดค่าไว้ และไม่ได้ตั้งค่า `gateway.auth.mode` การเริ่มต้นใช้งานจะบล็อกการติดตั้งจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
- การเริ่มต้นใช้งานภายในเครื่องจะเขียน `gateway.mode="local"` ลงใน config หากไฟล์ config ภายหลังไม่มี `gateway.mode` ให้ถือว่านั่นเป็นความเสียหายของ config หรือการแก้ไขด้วยตนเองที่ไม่สมบูรณ์ ไม่ใช่ทางลัดโหมด local ที่ถูกต้อง
- `--allow-unconfigured` เป็นทางหนีฉุกเฉินของ runtime ของ Gateway แยกต่างหาก ไม่ได้หมายความว่าการเริ่มต้นใช้งานสามารถละเว้น `gateway.mode` ได้

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

สุขภาพของ gateway ภายในเครื่องแบบไม่โต้ตอบ:

- เว้นแต่คุณจะส่ง `--skip-health` การเริ่มต้นใช้งานจะรอจนกว่า gateway ภายในเครื่องจะเข้าถึงได้ก่อนที่จะออกสำเร็จ
- `--install-daemon` เริ่มเส้นทางการติดตั้ง gateway ที่มีการจัดการก่อน หากไม่มีแฟล็กนี้ คุณต้องมี gateway ภายในเครื่องที่ทำงานอยู่แล้ว เช่น `openclaw gateway run`
- หากคุณต้องการเพียงการเขียน config/workspace/bootstrap ในระบบอัตโนมัติ ให้ใช้ `--skip-health`
- หากคุณจัดการไฟล์ workspace ด้วยตัวเอง ให้ส่ง `--skip-bootstrap` เพื่อตั้งค่า `agents.defaults.skipBootstrap: true` และข้ามการสร้าง `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, และ `BOOTSTRAP.md`
- บน Windows แบบ native, `--install-daemon` จะลอง Scheduled Tasks ก่อน และ fallback ไปยังรายการเข้าสู่ระบบในโฟลเดอร์ Startup ต่อผู้ใช้ หากการสร้าง task ถูกปฏิเสธ

พฤติกรรมการเริ่มต้นใช้งานแบบโต้ตอบด้วยโหมดอ้างอิง:

- เลือก **ใช้การอ้างอิงลับ** เมื่อมีข้อความแจ้ง
- จากนั้นเลือกอย่างใดอย่างหนึ่ง:
  - ตัวแปรสภาพแวดล้อม
  - ผู้ให้บริการความลับที่กำหนดค่าไว้ (`file` หรือ `exec`)
- การเริ่มต้นใช้งานจะทำการตรวจสอบ preflight อย่างรวดเร็วก่อนบันทึก ref
  - หากการตรวจสอบล้มเหลว การเริ่มต้นใช้งานจะแสดงข้อผิดพลาดและให้คุณลองใหม่

### ตัวเลือก endpoint ของ Z.AI แบบไม่โต้ตอบ

<Note>
`--auth-choice zai-api-key` ตรวจหา endpoint ของ Z.AI ที่ดีที่สุดสำหรับคีย์ของคุณโดยอัตโนมัติ (ให้ความสำคัญกับ API ทั่วไปที่ใช้ `zai/glm-5.1`) หากคุณต้องการ endpoint ของ GLM Coding Plan โดยเฉพาะ ให้เลือก `zai-coding-global` หรือ `zai-coding-cn`
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

## หมายเหตุของโฟลว์

<AccordionGroup>
  <Accordion title="ประเภทโฟลว์">
    - `quickstart`: ข้อความแจ้งขั้นต่ำ สร้างโทเค็น gateway โดยอัตโนมัติ
    - `manual`: ข้อความแจ้งแบบเต็มสำหรับ port, bind, และ auth (นามแฝงของ `advanced`)
    - `import`: เรียกใช้ผู้ให้บริการการย้ายข้อมูลที่ตรวจพบ แสดงตัวอย่างแผน แล้วนำไปใช้หลังการยืนยัน

  </Accordion>
  <Accordion title="การกรองผู้ให้บริการล่วงหน้า">
    เมื่อ auth choice สื่อถึงผู้ให้บริการที่ต้องการ การเริ่มต้นใช้งานจะกรองตัวเลือก default-model และ allowlist ล่วงหน้าให้เหลือเฉพาะผู้ให้บริการนั้น สำหรับ Volcengine และ BytePlus สิ่งนี้ยังจับคู่กับ variants ของ coding-plan (`volcengine-plan/*`, `byteplus-plan/*`) ด้วย

    หากตัวกรองผู้ให้บริการที่ต้องการยังไม่ให้โมเดลที่โหลดแล้ว การเริ่มต้นใช้งานจะ fallback ไปยัง catalog ที่ไม่ถูกกรองแทนการปล่อยให้ตัวเลือกว่างเปล่า

  </Accordion>
  <Accordion title="ข้อความแจ้งติดตามผลของ web-search">
    ผู้ให้บริการ web-search บางรายเรียกใช้ข้อความแจ้งติดตามผลเฉพาะผู้ให้บริการ:

    - **Grok** สามารถเสนอการตั้งค่า `x_search` แบบตัวเลือกด้วย `XAI_API_KEY` เดียวกันและตัวเลือกโมเดล `x_search`
    - **Kimi** สามารถถามภูมิภาค Moonshot API (`api.moonshot.ai` เทียบกับ `api.moonshot.cn`) และโมเดล web-search เริ่มต้นของ Kimi

  </Accordion>
  <Accordion title="พฤติกรรมอื่นๆ">
    - พฤติกรรมขอบเขต DM ของการเริ่มต้นใช้งานภายในเครื่อง: [ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals)
    - แชตแรกที่เร็วที่สุด: `openclaw dashboard` (Control UI, ไม่ต้องตั้งค่าช่องทาง)
    - ผู้ให้บริการแบบกำหนดเอง: เชื่อมต่อ endpoint ใดก็ได้ที่เข้ากันได้กับ OpenAI หรือ Anthropic รวมถึงผู้ให้บริการแบบ hosted ที่ไม่ได้ระบุไว้ ใช้ Unknown เพื่อตรวจหาอัตโนมัติ
    - หากตรวจพบสถานะ Hermes การเริ่มต้นใช้งานจะเสนอโฟลว์การย้ายข้อมูล ใช้ [ย้ายข้อมูล](/th/cli/migrate) สำหรับแผน dry-run, โหมด overwrite, รายงาน และการแมปที่แน่นอน

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
