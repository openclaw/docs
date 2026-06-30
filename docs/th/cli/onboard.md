---
read_when:
    - คุณต้องการการตั้งค่าแบบมีคำแนะนำสำหรับ Gateway, เวิร์กสเปซ, การยืนยันตัวตน, ช่องทาง และ Skills
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw onboard` (การเริ่มต้นใช้งานแบบโต้ตอบ)
title: เริ่มใช้งาน
x-i18n:
    generated_at: "2026-06-30T22:38:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e0a3c2dea3f8116bb3282d5fb160cf34d9a6f0eefcc072abcff2287d5801184
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

การเริ่มต้นใช้งานแบบมีคำแนะนำครบถ้วนสำหรับการตั้งค่า Gateway แบบ local หรือ remote ใช้คำสั่งนี้เมื่อคุณต้องการให้ OpenClaw พาไล่ขั้นตอนการยืนยันตัวตนโมเดล, workspace, gateway, channels, skills และ health ใน flow เดียว

## คู่มือที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ศูนย์กลางการเริ่มต้นใช้งาน CLI" href="/th/start/wizard" icon="rocket">
    คำแนะนำทีละขั้นตอนสำหรับ flow CLI แบบโต้ตอบ
  </Card>
  <Card title="ภาพรวมการเริ่มต้นใช้งาน" href="/th/start/onboarding-overview" icon="map">
    วิธีที่การเริ่มต้นใช้งาน OpenClaw เชื่อมโยงกัน
  </Card>
  <Card title="อ้างอิงการตั้งค่า CLI" href="/th/start/wizard-cli-reference" icon="book">
    เอาต์พุต, รายละเอียดภายใน และพฤติกรรมรายขั้นตอน
  </Card>
  <Card title="การทำงานอัตโนมัติของ CLI" href="/th/start/wizard-cli-automation" icon="terminal">
    แฟล็กแบบไม่โต้ตอบและการตั้งค่าด้วยสคริปต์
  </Card>
  <Card title="การเริ่มต้นใช้งานแอป macOS" href="/th/start/onboarding" icon="apple">
    flow การเริ่มต้นใช้งานสำหรับแอปแถบเมนู macOS
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

`--flow import` ใช้ provider การย้ายข้อมูลที่ Plugin เป็นเจ้าของ เช่น Hermes โดยจะทำงานกับการตั้งค่า OpenClaw ใหม่เท่านั้น หากมี config, credentials, sessions หรือไฟล์ workspace memory/identity อยู่แล้ว ให้รีเซ็ตหรือเลือกการตั้งค่าใหม่ก่อนนำเข้า

`--modern` เริ่มตัวอย่างการเริ่มต้นใช้งานแบบสนทนาของ Crestodian หากไม่มี
`--modern` คำสั่ง `openclaw onboard` จะคงใช้ flow การเริ่มต้นใช้งานแบบคลาสสิก

บนการติดตั้งใหม่ที่ไฟล์ config ที่ใช้งานอยู่หายไปหรือไม่มีการตั้งค่าที่ผู้ใช้เขียนไว้
(ว่างหรือมีเฉพาะ metadata) การเรียก `openclaw` แบบเปล่า ๆ จะเริ่ม flow
การเริ่มต้นใช้งานแบบคลาสสิกเช่นกัน เมื่อไฟล์ config มีการตั้งค่าที่ผู้ใช้เขียนไว้แล้ว การเรียก `openclaw`
แบบเปล่า ๆ จะเปิด Crestodian แทน

รองรับ plaintext `ws://` สำหรับ loopback, literal IP ส่วนตัว, `.local` และ
URL Gateway ของ Tailnet `*.ts.net` สำหรับชื่อ private-DNS อื่นที่เชื่อถือ ให้ตั้งค่า
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ใน environment ของกระบวนการเริ่มต้นใช้งาน

## Locale

การเริ่มต้นใช้งานแบบโต้ตอบใช้ locale ของ CLI wizard สำหรับข้อความการตั้งค่าคงที่ ลำดับการแก้ค่า
คือ:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. fallback ภาษาอังกฤษ

locale ของ wizard ที่รองรับคือ `en`, `zh-CN` และ `zh-TW` ค่า locale อาจใช้
underscore หรือรูปแบบ suffix แบบ POSIX เช่น `zh_CN.UTF-8` ชื่อผลิตภัณฑ์, ชื่อ command,
config keys, URLs, provider IDs, model IDs และป้ายกำกับ plugin/channel
จะคงเป็น literal

ตัวอย่าง:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

provider แบบกำหนดเองในโหมดไม่โต้ตอบ:

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

`--custom-api-key` เป็นตัวเลือกในโหมดไม่โต้ตอบ หากละไว้ การเริ่มต้นใช้งานจะตรวจ `CUSTOM_API_KEY`
OpenClaw ทำเครื่องหมาย model IDs ด้าน vision ทั่วไปว่าใช้งาน image ได้โดยอัตโนมัติ ส่ง `--custom-image-input` สำหรับ custom vision IDs ที่ไม่รู้จัก หรือ `--custom-text-input` เพื่อบังคับ metadata แบบ text-only
ใช้ `--custom-compatibility openai-responses` สำหรับ endpoint ที่เข้ากันได้กับ OpenAI ซึ่งรองรับ `/v1/responses` แต่ไม่รองรับ `/v1/chat/completions`

LM Studio รองรับแฟล็ก key เฉพาะ provider ในโหมดไม่โต้ตอบด้วย:

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

`--custom-base-url` มีค่าเริ่มต้นเป็น `http://127.0.0.1:11434` ส่วน `--custom-model-id` เป็นตัวเลือก หากละไว้ การเริ่มต้นใช้งานจะใช้ค่าเริ่มต้นที่ Ollama แนะนำ model IDs บนคลาวด์ เช่น `kimi-k2.5:cloud` ก็ใช้งานที่นี่ได้เช่นกัน

จัดเก็บ provider keys เป็น refs แทน plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

เมื่อใช้ `--secret-input-mode ref` การเริ่มต้นใช้งานจะเขียน refs ที่อิง env แทนค่าคีย์แบบ plaintext
สำหรับ provider ที่อิง auth-profile จะเขียนรายการ `keyRef`; สำหรับ custom providers จะเขียน `models.providers.<id>.apiKey` เป็น env ref (เช่น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`)

สัญญาโหมด `ref` แบบไม่โต้ตอบ:

- ตั้งค่า env var ของ provider ใน environment ของกระบวนการเริ่มต้นใช้งาน (เช่น `OPENAI_API_KEY`)
- อย่าส่งแฟล็กคีย์ inline (เช่น `--openai-api-key`) เว้นแต่ env var นั้นถูกตั้งค่าไว้ด้วย
- หากส่งแฟล็กคีย์ inline โดยไม่มี env var ที่จำเป็น การเริ่มต้นใช้งานจะล้มเหลวทันทีพร้อมคำแนะนำ

ตัวเลือก token ของ Gateway ในโหมดไม่โต้ตอบ:

- `--gateway-auth token --gateway-token <token>` จัดเก็บ token แบบ plaintext
- `--gateway-auth token --gateway-token-ref-env <name>` จัดเก็บ `gateway.auth.token` เป็น env SecretRef
- `--gateway-token` และ `--gateway-token-ref-env` ใช้ร่วมกันไม่ได้
- `--gateway-token-ref-env` ต้องมี env var ที่ไม่ว่างใน environment ของกระบวนการเริ่มต้นใช้งาน
- เมื่อใช้ `--install-daemon` หาก token auth ต้องใช้ token จะตรวจสอบ gateway tokens ที่จัดการด้วย SecretRef แต่จะไม่คงค่าที่ resolve แล้วเป็น plaintext ใน metadata environment ของ supervisor service
- เมื่อใช้ `--install-daemon` หากโหมด token ต้องใช้ token และ SecretRef ของ token ที่กำหนดไว้ resolve ไม่ได้ การเริ่มต้นใช้งานจะปิดแบบปลอดภัยพร้อมคำแนะนำการแก้ไข
- เมื่อใช้ `--install-daemon` หากกำหนดทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` การเริ่มต้นใช้งานจะบล็อกการติดตั้งจนกว่าจะตั้งค่า mode อย่างชัดเจน
- การเริ่มต้นใช้งานแบบ local จะเขียน `gateway.mode="local"` ลงใน config หากไฟล์ config ภายหลังไม่มี `gateway.mode` ให้ถือว่าเป็น config เสียหายหรือการแก้ไขด้วยตนเองที่ไม่สมบูรณ์ ไม่ใช่ทางลัด local-mode ที่ถูกต้อง
- การเริ่มต้นใช้งานแบบ local จะติดตั้ง plugins ที่ดาวน์โหลดได้ที่เลือกไว้เมื่อเส้นทางการตั้งค่าที่เลือกต้องใช้
- การเริ่มต้นใช้งานแบบ remote จะเขียนเฉพาะข้อมูลการเชื่อมต่อสำหรับ Gateway ระยะไกล และจะไม่ติดตั้งแพ็กเกจ plugin ในเครื่อง
- `--allow-unconfigured` เป็น escape hatch สำหรับ gateway runtime แยกต่างหาก ไม่ได้หมายความว่าการเริ่มต้นใช้งานสามารถละ `gateway.mode` ได้

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

health ของ local gateway แบบไม่โต้ตอบ:

- เว้นแต่คุณส่ง `--skip-health` การเริ่มต้นใช้งานจะรอให้ local gateway เข้าถึงได้ก่อนออกด้วยความสำเร็จ
- `--install-daemon` จะเริ่มเส้นทางการติดตั้ง gateway ที่จัดการให้ก่อน หากไม่มีแฟล็กนี้ คุณต้องมี local gateway ที่ทำงานอยู่แล้ว เช่น `openclaw gateway run`
- หากคุณต้องการเพียงเขียน config/workspace/bootstrap ใน automation ให้ใช้ `--skip-health`
- หากคุณจัดการไฟล์ workspace เอง ให้ส่ง `--skip-bootstrap` เพื่อตั้งค่า `agents.defaults.skipBootstrap: true` และข้ามการสร้าง `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` และ `BOOTSTRAP.md`
- บน Windows แบบ native `--install-daemon` จะลองใช้ Scheduled Tasks ก่อน และ fallback ไปยัง login item ในโฟลเดอร์ Startup ต่อผู้ใช้หากถูกปฏิเสธการสร้าง task

พฤติกรรมการเริ่มต้นใช้งานแบบโต้ตอบด้วย reference mode:

- เลือก **Use secret reference** เมื่อได้รับ prompt
- จากนั้นเลือกอย่างใดอย่างหนึ่ง:
  - Environment variable
  - Configured secret provider (`file` หรือ `exec`)
- การเริ่มต้นใช้งานจะทำ preflight validation แบบรวดเร็วก่อนบันทึก ref
  - หาก validation ล้มเหลว การเริ่มต้นใช้งานจะแสดง error และให้คุณลองใหม่

### ตัวเลือก endpoint ของ Z.AI แบบไม่โต้ตอบ

<Note>
`--auth-choice zai-api-key` ตรวจหา endpoint และโมเดล Z.AI ที่ดีที่สุดสำหรับ
คีย์ของคุณโดยอัตโนมัติ endpoint แบบ Coding Plan จะเลือก `zai/glm-5.2`; endpoint API ทั่วไปใช้
`zai/glm-5.1` หากต้องการบังคับ endpoint แบบ Coding Plan ให้เลือก `zai-coding-global` หรือ
`zai-coding-cn`
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

## หมายเหตุเกี่ยวกับ flow

<AccordionGroup>
  <Accordion title="ประเภท flow">
    - `quickstart`: prompt ขั้นต่ำ สร้าง gateway token โดยอัตโนมัติ
    - `manual`: prompt ครบสำหรับ port, bind และ auth (alias ของ `advanced`)
    - `import`: เรียก provider การย้ายข้อมูลที่ตรวจพบ แสดงตัวอย่าง plan แล้วค่อยนำไปใช้หลังยืนยัน

  </Accordion>
  <Accordion title="การกรอง provider ล่วงหน้า">
    เมื่อ auth choice บ่งชี้ provider ที่ต้องการ การเริ่มต้นใช้งานจะกรองตัวเลือก default-model และ allowlist ล่วงหน้าให้เหลือ provider นั้น สำหรับ Volcengine และ BytePlus จะจับคู่ variants แบบ coding-plan ด้วย (`volcengine-plan/*`, `byteplus-plan/*`)

    หากตัวกรอง preferred-provider ยังไม่ให้โมเดลที่โหลดแล้ว การเริ่มต้นใช้งานจะ fallback ไปยัง catalog ที่ไม่กรองแทนการปล่อยให้ตัวเลือกว่าง

  </Accordion>
  <Accordion title="follow-up สำหรับ web-search">
    provider ด้าน web-search บางรายจะเรียก prompt follow-up เฉพาะ provider:

    - **Grok** สามารถเสนอการตั้งค่า `x_search` แบบตัวเลือก โดยใช้ xAI OAuth profile หรือ API key เดียวกัน และตัวเลือกโมเดล `x_search`
    - **Kimi** สามารถถาม region ของ Moonshot API (`api.moonshot.ai` เทียบกับ `api.moonshot.cn`) และโมเดล web-search เริ่มต้นของ Kimi

  </Accordion>
  <Accordion title="พฤติกรรมอื่น ๆ">
    - พฤติกรรม scope ของ DM ในการเริ่มต้นใช้งานแบบ local: [อ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals)
    - แชตแรกที่เร็วที่สุด: `openclaw dashboard` (Control UI, ไม่ต้องตั้งค่า channel)
    - Custom provider: เชื่อมต่อ endpoint ใด ๆ ที่เข้ากันได้กับ OpenAI หรือ Anthropic รวมถึง hosted providers ที่ไม่ได้ระบุไว้ ใช้ Unknown เพื่อตรวจหาอัตโนมัติ
    - หากตรวจพบสถานะ Hermes การเริ่มต้นใช้งานจะเสนอ flow การย้ายข้อมูล ใช้ [Migrate](/th/cli/migrate) สำหรับ dry-run plans, overwrite mode, reports และ mappings ที่แน่นอน

  </Accordion>
</AccordionGroup>

## คำสั่ง follow-up ที่ใช้บ่อย

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

ใช้ `openclaw setup` เป็น entry point การเริ่มต้นใช้งานแบบมีคำแนะนำเดียวกัน ใช้ `openclaw setup --baseline` เมื่อคุณต้องการเฉพาะ config/workspace พื้นฐาน, ใช้ `openclaw configure` ภายหลังสำหรับการเปลี่ยนแปลงเฉพาะจุด และใช้ `openclaw channels add` สำหรับการตั้งค่าเฉพาะ channel

<Note>
`--json` ไม่ได้หมายถึงโหมดไม่โต้ตอบ ใช้ `--non-interactive` สำหรับสคริปต์
</Note>
