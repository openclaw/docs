---
read_when:
    - คุณต้องการการตั้งค่าพร้อมคำแนะนำสำหรับ Gateway, พื้นที่ทำงาน, การยืนยันตัวตน, ช่องทาง และ Skills
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw onboard` (การเริ่มต้นใช้งานแบบโต้ตอบ)
title: เริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-06-27T17:22:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ffee6b90e72f1859634fbd7ccac2f44e88bc37879b9e5b099c33b760cc0e9af
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

การเริ่มต้นใช้งานแบบมีคำแนะนำครบถ้วนสำหรับการตั้งค่า Gateway แบบภายในเครื่องหรือระยะไกล ใช้คำสั่งนี้เมื่อคุณต้องการให้ OpenClaw พาไล่ตั้งแต่การยืนยันตัวตนของโมเดล พื้นที่ทำงาน gateway ช่องทาง Skills และสถานะสุขภาพในโฟลว์เดียว

## คู่มือที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/th/start/wizard" icon="rocket">
    คำแนะนำทีละขั้นสำหรับโฟลว์ CLI แบบโต้ตอบ
  </Card>
  <Card title="Onboarding overview" href="/th/start/onboarding-overview" icon="map">
    วิธีที่การเริ่มต้นใช้งานของ OpenClaw เชื่อมโยงกัน
  </Card>
  <Card title="CLI setup reference" href="/th/start/wizard-cli-reference" icon="book">
    เอาต์พุต กลไกภายใน และพฤติกรรมรายขั้นตอน
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

`--flow import` ใช้ผู้ให้บริการการย้ายข้อมูลที่ Plugin เป็นเจ้าของ เช่น Hermes โดยจะทำงานกับการตั้งค่า OpenClaw ใหม่เท่านั้น หากมีคอนฟิก ข้อมูลรับรอง เซสชัน หรือไฟล์หน่วยความจำ/ตัวตนของพื้นที่ทำงานอยู่แล้ว ให้รีเซ็ตหรือเลือกการตั้งค่าใหม่ก่อนนำเข้า

`--modern` เริ่มตัวอย่างการเริ่มต้นใช้งานแบบสนทนาของ Crestodian หากไม่มี
`--modern` คำสั่ง `openclaw onboard` จะคงใช้โฟลว์การเริ่มต้นใช้งานแบบคลาสสิก

ในการติดตั้งใหม่ที่ไม่มีไฟล์คอนฟิกที่ใช้งานอยู่ หรือไฟล์นั้นไม่มีการตั้งค่าที่ผู้ใช้เขียนไว้
(ว่างหรือมีเฉพาะเมทาดาทา) คำสั่ง `openclaw` แบบไม่ระบุอาร์กิวเมนต์จะเริ่ม
โฟลว์การเริ่มต้นใช้งานแบบคลาสสิกด้วยเช่นกัน เมื่อไฟล์คอนฟิกมีการตั้งค่าที่ผู้ใช้เขียนไว้แล้ว คำสั่ง `openclaw`
แบบไม่ระบุอาร์กิวเมนต์จะเปิด Crestodian แทน

อนุญาตให้ใช้ `ws://` แบบข้อความล้วนสำหรับ loopback, IP ส่วนตัวแบบลิเทอรัล, `.local` และ
URL ของ Gateway บน Tailnet `*.ts.net` สำหรับชื่อ private-DNS ที่เชื่อถือได้อื่นๆ ให้ตั้งค่า
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน

## ภาษา

การเริ่มต้นใช้งานแบบโต้ตอบใช้ภาษาของวิซาร์ด CLI สำหรับข้อความตั้งค่าแบบคงที่ ลำดับการเลือกคือ:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. ค่า fallback เป็นภาษาอังกฤษ

ภาษาของวิซาร์ดที่รองรับคือ `en`, `zh-CN` และ `zh-TW` ค่าภาษาอาจใช้
รูปแบบขีดล่างหรือส่วนต่อท้ายแบบ POSIX เช่น `zh_CN.UTF-8` ชื่อผลิตภัณฑ์ ชื่อคำสั่ง
คีย์คอนฟิก URL, ID ผู้ให้บริการ, ID โมเดล และป้ายชื่อ Plugin/ช่องทาง
จะยังคงเป็นลิเทอรัล

ตัวอย่าง:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

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
OpenClaw ทำเครื่องหมาย ID โมเดลวิชันที่พบบ่อยว่าใช้งานรูปภาพได้โดยอัตโนมัติ ส่ง `--custom-image-input` สำหรับ ID วิชันแบบกำหนดเองที่ไม่รู้จัก หรือ `--custom-text-input` เพื่อบังคับใช้เมทาดาทาแบบข้อความเท่านั้น
ใช้ `--custom-compatibility openai-responses` สำหรับ endpoint ที่เข้ากันได้กับ OpenAI ซึ่งรองรับ `/v1/responses` แต่ไม่รองรับ `/v1/chat/completions`

LM Studio รองรับแฟล็กคีย์เฉพาะผู้ให้บริการในโหมดไม่โต้ตอบด้วย:

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

`--custom-base-url` มีค่าเริ่มต้นเป็น `http://127.0.0.1:11434` `--custom-model-id` เป็นตัวเลือก หากละไว้ การเริ่มต้นใช้งานจะใช้ค่าเริ่มต้นที่ Ollama แนะนำ ID โมเดลคลาวด์ เช่น `kimi-k2.5:cloud` ก็ใช้งานได้ที่นี่เช่นกัน

เก็บคีย์ผู้ให้บริการเป็น refs แทนข้อความล้วน:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

เมื่อใช้ `--secret-input-mode ref` การเริ่มต้นใช้งานจะเขียน refs ที่อิงกับ env แทนค่าคีย์แบบข้อความล้วน
สำหรับผู้ให้บริการที่อิงกับโปรไฟล์ยืนยันตัวตน จะเขียนรายการ `keyRef`; สำหรับผู้ให้บริการแบบกำหนดเอง จะเขียน `models.providers.<id>.apiKey` เป็น env ref (เช่น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`)

สัญญาของโหมด `ref` แบบไม่โต้ตอบ:

- ตั้งค่า env var ของผู้ให้บริการในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน (เช่น `OPENAI_API_KEY`)
- อย่าส่งแฟล็กคีย์แบบ inline (เช่น `--openai-api-key`) เว้นแต่ว่า env var นั้นถูกตั้งค่าไว้ด้วย
- หากส่งแฟล็กคีย์แบบ inline โดยไม่มี env var ที่จำเป็น การเริ่มต้นใช้งานจะล้มเหลวทันทีพร้อมคำแนะนำ

ตัวเลือกโทเค็น Gateway ในโหมดไม่โต้ตอบ:

- `--gateway-auth token --gateway-token <token>` เก็บโทเค็นแบบข้อความล้วน
- `--gateway-auth token --gateway-token-ref-env <name>` เก็บ `gateway.auth.token` เป็น env SecretRef
- `--gateway-token` และ `--gateway-token-ref-env` ใช้ร่วมกันไม่ได้
- `--gateway-token-ref-env` ต้องมี env var ที่ไม่ว่างในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน
- เมื่อใช้ `--install-daemon` หากการยืนยันตัวตนด้วยโทเค็นต้องมีโทเค็น โทเค็น Gateway ที่จัดการด้วย SecretRef จะถูกตรวจสอบความถูกต้องแต่จะไม่ถูกเก็บเป็นข้อความล้วนที่ resolve แล้วในเมทาดาทาสภาพแวดล้อมของบริการ supervisor
- เมื่อใช้ `--install-daemon` หากโหมดโทเค็นต้องมีโทเค็นและ SecretRef ของโทเค็นที่คอนฟิกไว้ไม่สามารถ resolve ได้ การเริ่มต้นใช้งานจะปิดแบบปลอดภัยพร้อมคำแนะนำการแก้ไข
- เมื่อใช้ `--install-daemon` หากทั้ง `gateway.auth.token` และ `gateway.auth.password` ถูกคอนฟิกไว้ และไม่ได้ตั้งค่า `gateway.auth.mode` การเริ่มต้นใช้งานจะบล็อกการติดตั้งจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
- การเริ่มต้นใช้งานภายในเครื่องเขียน `gateway.mode="local"` ลงในคอนฟิก หากไฟล์คอนฟิกในภายหลังไม่มี `gateway.mode` ให้ถือว่าเป็นคอนฟิกเสียหายหรือการแก้ไขด้วยตนเองที่ไม่สมบูรณ์ ไม่ใช่ทางลัดโหมดภายในเครื่องที่ถูกต้อง
- การเริ่มต้นใช้งานภายในเครื่องจะติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งเลือกไว้เมื่อเส้นทางการตั้งค่าที่เลือกต้องใช้
- การเริ่มต้นใช้งานระยะไกลจะเขียนเฉพาะข้อมูลการเชื่อมต่อสำหรับ Gateway ระยะไกล และจะไม่ติดตั้งแพ็กเกจ Plugin ภายในเครื่อง
- `--allow-unconfigured` เป็นช่องทางหลบออกของ runtime gateway ที่แยกต่างหาก ไม่ได้หมายความว่าการเริ่มต้นใช้งานสามารถละ `gateway.mode` ได้

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

สถานะสุขภาพของ Gateway ภายในเครื่องแบบไม่โต้ตอบ:

- เว้นแต่คุณส่ง `--skip-health` การเริ่มต้นใช้งานจะรอให้ Gateway ภายในเครื่องเข้าถึงได้ก่อนจึงจะออกด้วยความสำเร็จ
- `--install-daemon` เริ่มเส้นทางการติดตั้ง Gateway ที่มีการจัดการก่อน หากไม่มีแฟล็กนี้ คุณต้องมี Gateway ภายในเครื่องที่ทำงานอยู่แล้ว เช่น `openclaw gateway run`
- หากคุณต้องการให้ automation เขียนเฉพาะคอนฟิก/พื้นที่ทำงาน/bootstrap ให้ใช้ `--skip-health`
- หากคุณจัดการไฟล์พื้นที่ทำงานเอง ให้ส่ง `--skip-bootstrap` เพื่อตั้งค่า `agents.defaults.skipBootstrap: true` และข้ามการสร้าง `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` และ `BOOTSTRAP.md`
- บน Windows แบบเนทีฟ `--install-daemon` จะลองใช้ Scheduled Tasks ก่อน และ fallback ไปยังรายการเข้าสู่ระบบในโฟลเดอร์ Startup รายผู้ใช้หากการสร้างงานถูกปฏิเสธ

พฤติกรรมการเริ่มต้นใช้งานแบบโต้ตอบเมื่อใช้โหมดอ้างอิง:

- เลือก **ใช้การอ้างอิง secret** เมื่อมี prompt
- จากนั้นเลือกอย่างใดอย่างหนึ่ง:
  - ตัวแปรสภาพแวดล้อม
  - ผู้ให้บริการ secret ที่คอนฟิกไว้ (`file` หรือ `exec`)
- การเริ่มต้นใช้งานทำการตรวจสอบ preflight อย่างรวดเร็วก่อนบันทึก ref
  - หากการตรวจสอบล้มเหลว การเริ่มต้นใช้งานจะแสดงข้อผิดพลาดและให้คุณลองใหม่

### ตัวเลือก endpoint ของ Z.AI แบบไม่โต้ตอบ

<Note>
`--auth-choice zai-api-key` ตรวจหา endpoint และโมเดล Z.AI ที่ดีที่สุดสำหรับ
คีย์ของคุณโดยอัตโนมัติ endpoint ของ Coding Plan จะชอบใช้ `zai/glm-5.2`; endpoint API ทั่วไปใช้
`zai/glm-5.1` หากต้องการบังคับใช้ endpoint ของ Coding Plan ให้เลือก `zai-coding-global` หรือ
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

## หมายเหตุเกี่ยวกับโฟลว์

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: prompt ขั้นต่ำ สร้างโทเค็น Gateway โดยอัตโนมัติ
    - `manual`: prompt แบบครบถ้วนสำหรับพอร์ต bind และการยืนยันตัวตน (alias ของ `advanced`)
    - `import`: เรียกใช้ผู้ให้บริการการย้ายข้อมูลที่ตรวจพบ แสดงตัวอย่างแผน แล้วจึงนำไปใช้หลังยืนยัน

  </Accordion>
  <Accordion title="Provider prefiltering">
    เมื่อทางเลือกการยืนยันตัวตนบ่งชี้ผู้ให้บริการที่ต้องการ การเริ่มต้นใช้งานจะ prefilter ตัวเลือกโมเดลเริ่มต้นและ allowlist ไปยังผู้ให้บริการนั้น สำหรับ Volcengine และ BytePlus การทำเช่นนี้จะจับคู่ variant ของ coding-plan ด้วย (`volcengine-plan/*`, `byteplus-plan/*`)

    หากตัวกรองผู้ให้บริการที่ต้องการยังไม่พบโมเดลที่โหลดไว้ การเริ่มต้นใช้งานจะ fallback ไปยังแค็ตตาล็อกที่ไม่กรองแทนการปล่อยให้ตัวเลือกว่าง

  </Accordion>
  <Accordion title="Web-search follow-ups">
    ผู้ให้บริการ web-search บางรายจะเรียก prompt ติดตามผลเฉพาะผู้ให้บริการ:

    - **Grok** สามารถเสนอการตั้งค่า `x_search` แบบตัวเลือกได้ โดยใช้โปรไฟล์ xAI OAuth หรือ API key เดียวกัน และตัวเลือกโมเดล `x_search`
    - **Kimi** สามารถถาม region ของ Moonshot API (`api.moonshot.ai` เทียบกับ `api.moonshot.cn`) และโมเดล web-search เริ่มต้นของ Kimi

  </Accordion>
  <Accordion title="Other behaviors">
    - พฤติกรรมขอบเขต DM ของการเริ่มต้นใช้งานภายในเครื่อง: [ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals)
    - แชตแรกที่เร็วที่สุด: `openclaw dashboard` (Control UI ไม่ต้องตั้งค่าช่องทาง)
    - ผู้ให้บริการแบบกำหนดเอง: เชื่อมต่อ endpoint ที่เข้ากันได้กับ OpenAI หรือ Anthropic ใดก็ได้ รวมถึงผู้ให้บริการแบบโฮสต์ที่ไม่ได้อยู่ในรายการ ใช้ Unknown เพื่อตรวจหาอัตโนมัติ
    - หากตรวจพบสถานะ Hermes การเริ่มต้นใช้งานจะเสนอ flow การย้ายข้อมูล ใช้ [Migrate](/th/cli/migrate) สำหรับแผนแบบ dry-run, โหมด overwrite, รายงาน และการจับคู่ที่แน่นอน

  </Accordion>
</AccordionGroup>

## คำสั่งติดตามผลที่พบบ่อย

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

ใช้ `openclaw setup` แทนเมื่อคุณต้องการเพียงคอนฟิก/พื้นที่ทำงานพื้นฐาน ใช้ `openclaw configure` ภายหลังสำหรับการเปลี่ยนแปลงเฉพาะจุด และ `openclaw channels add` สำหรับการตั้งค่าเฉพาะช่องทาง

<Note>
`--json` ไม่ได้หมายถึงโหมดไม่โต้ตอบ ใช้ `--non-interactive` สำหรับสคริปต์
</Note>
