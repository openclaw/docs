---
read_when:
    - คุณต้องการการตั้งค่าแบบมีคำแนะนำสำหรับ Gateway, พื้นที่ทำงาน, การยืนยันตัวตน, ช่องทาง และ Skills
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw onboard` (การเริ่มต้นใช้งานแบบโต้ตอบ)
title: เริ่มใช้งาน
x-i18n:
    generated_at: "2026-07-01T13:29:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8f1f1b1e4f3a9e3c544efede027d50123050660a999ae61573e41cd466bbfa4
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

การเริ่มใช้งานแบบมีคำแนะนำเต็มรูปแบบสำหรับการตั้งค่า Gateway แบบ local หรือ remote ใช้คำสั่งนี้เมื่อคุณต้องการให้ OpenClaw พาไล่ขั้นตอนการยืนยันตัวตนของโมเดล, workspace, Gateway, ช่องทาง, Skills และสุขภาพระบบใน flow เดียว

## คู่มือที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/th/start/wizard" icon="rocket">
    คำแนะนำแบบทีละขั้นตอนของ flow CLI แบบโต้ตอบ
  </Card>
  <Card title="Onboarding overview" href="/th/start/onboarding-overview" icon="map">
    วิธีที่การเริ่มใช้งานของ OpenClaw ประกอบกัน
  </Card>
  <Card title="CLI setup reference" href="/th/start/wizard-cli-reference" icon="book">
    เอาต์พุต, กลไกภายใน และพฤติกรรมรายขั้นตอน
  </Card>
  <Card title="CLI automation" href="/th/start/wizard-cli-automation" icon="terminal">
    แฟล็กแบบไม่โต้ตอบและการตั้งค่าด้วยสคริปต์
  </Card>
  <Card title="macOS app onboarding" href="/th/start/onboarding" icon="apple">
    Flow การเริ่มใช้งานสำหรับแอปแถบเมนู macOS
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

`--flow import` ใช้ผู้ให้บริการ migration ที่ Plugin เป็นเจ้าของ เช่น Hermes คำสั่งนี้ทำงานกับการตั้งค่า OpenClaw ใหม่เท่านั้น หากมี config, credentials, sessions หรือไฟล์ memory/identity ของ workspace อยู่แล้ว ให้รีเซ็ตหรือเลือกการตั้งค่าใหม่ก่อนนำเข้า

`--modern` เริ่มพรีวิวการเริ่มใช้งานแบบสนทนาของ Crestodian หากไม่มี
`--modern`, `openclaw onboard` จะคง flow การเริ่มใช้งานแบบคลาสสิกไว้

ในการติดตั้งใหม่ที่ไฟล์ config ที่ใช้งานอยู่ขาดหายไปหรือไม่มีการตั้งค่าที่ผู้ใช้เขียนไว้
(ว่างหรือมีเฉพาะ metadata) คำสั่ง `openclaw` เปล่า ๆ จะเริ่ม flow
การเริ่มใช้งานแบบคลาสสิกเช่นกัน เมื่อไฟล์ config มีการตั้งค่าที่ผู้ใช้เขียนไว้แล้ว คำสั่ง `openclaw`
เปล่า ๆ จะเปิด Crestodian แทน

ยอมรับ `ws://` แบบ plaintext สำหรับ loopback, private IP literals, `.local` และ
URL Gateway ของ Tailnet `*.ts.net` สำหรับชื่อ private-DNS อื่นที่เชื่อถือได้ ให้ตั้งค่า
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ใน environment ของกระบวนการ onboarding

## Locale

การเริ่มใช้งานแบบโต้ตอบใช้ locale ของ wizard CLI สำหรับข้อความตั้งค่าคงที่ ลำดับการ resolve
คือ:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. fallback เป็นภาษาอังกฤษ

locale ของ wizard ที่รองรับคือ `en`, `zh-CN` และ `zh-TW` ค่า Locale อาจใช้
underscore หรือรูปแบบ suffix ของ POSIX เช่น `zh_CN.UTF-8` ชื่อผลิตภัณฑ์, ชื่อคำสั่ง,
config keys, URLs, provider IDs, model IDs และ label ของ Plugin/ช่องทาง
จะคงเป็นตัวอักษรเดิม

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

`--custom-api-key` เป็นตัวเลือกในโหมดไม่โต้ตอบ หากละไว้ onboarding จะตรวจสอบ `CUSTOM_API_KEY`
OpenClaw จะทำเครื่องหมาย model IDs ด้าน vision ที่พบบ่อยว่าใช้งานภาพได้โดยอัตโนมัติ ส่ง `--custom-image-input` สำหรับ ID vision แบบกำหนดเองที่ไม่รู้จัก หรือ `--custom-text-input` เพื่อบังคับ metadata แบบข้อความเท่านั้น
ใช้ `--custom-compatibility openai-responses` สำหรับ endpoint ที่เข้ากันได้กับ OpenAI ซึ่งรองรับ `/v1/responses` แต่ไม่รองรับ `/v1/chat/completions`

LM Studio ยังรองรับแฟล็ก key เฉพาะผู้ให้บริการในโหมดไม่โต้ตอบด้วย:

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

ค่าเริ่มต้นของ `--custom-base-url` คือ `http://127.0.0.1:11434` `--custom-model-id` เป็นตัวเลือก หากละไว้ onboarding จะใช้ค่าเริ่มต้นที่ Ollama แนะนำ Cloud model IDs เช่น `kimi-k2.5:cloud` ก็ทำงานที่นี่เช่นกัน

จัดเก็บ key ของผู้ให้บริการเป็น refs แทน plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

เมื่อใช้ `--secret-input-mode ref`, onboarding จะเขียน refs ที่อ้างอิง env แทนค่า key แบบ plaintext
สำหรับผู้ให้บริการที่ใช้ auth-profile จะเขียนรายการ `keyRef`; สำหรับผู้ให้บริการแบบกำหนดเอง จะเขียน `models.providers.<id>.apiKey` เป็น env ref (เช่น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`)

สัญญาของโหมด `ref` แบบไม่โต้ตอบ:

- ตั้งค่า env var ของผู้ให้บริการใน environment ของกระบวนการ onboarding (เช่น `OPENAI_API_KEY`)
- อย่าส่งแฟล็ก key แบบ inline (เช่น `--openai-api-key`) เว้นแต่ env var นั้นถูกตั้งค่าไว้ด้วย
- หากส่งแฟล็ก key แบบ inline โดยไม่มี env var ที่ต้องใช้ onboarding จะล้มเหลวทันทีพร้อมคำแนะนำ

ตัวเลือก token ของ Gateway ในโหมดไม่โต้ตอบ:

- `--gateway-auth token --gateway-token <token>` จัดเก็บ token แบบ plaintext
- `--gateway-auth token --gateway-token-ref-env <name>` จัดเก็บ `gateway.auth.token` เป็น env SecretRef
- `--gateway-token` และ `--gateway-token-ref-env` ใช้ร่วมกันไม่ได้
- `--gateway-token-ref-env` ต้องมี env var ที่ไม่ว่างใน environment ของกระบวนการ onboarding
- เมื่อใช้ `--install-daemon` หาก token auth ต้องใช้ token, token ของ Gateway ที่จัดการด้วย SecretRef จะถูกตรวจสอบ แต่จะไม่ถูก persist เป็น plaintext ที่ resolve แล้วใน metadata ของ environment บริการ supervisor
- เมื่อใช้ `--install-daemon` หากโหมด token ต้องใช้ token และ token SecretRef ที่กำหนดค่าไว้ resolve ไม่ได้ onboarding จะล้มเหลวแบบปิดพร้อมคำแนะนำการแก้ไข
- เมื่อใช้ `--install-daemon` หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` onboarding จะบล็อกการติดตั้งจนกว่าจะตั้งค่า mode อย่างชัดเจน
- การเริ่มใช้งานแบบ local เขียน `gateway.mode="local"` ลงใน config หากไฟล์ config ภายหลังไม่มี `gateway.mode` ให้ถือว่าเป็น config ที่เสียหายหรือการแก้ไขด้วยตนเองที่ไม่สมบูรณ์ ไม่ใช่ shortcut โหมด local ที่ถูกต้อง
- การเริ่มใช้งานแบบ local ติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งเลือกไว้เมื่อเส้นทางการตั้งค่าที่เลือกต้องใช้
- การเริ่มใช้งานแบบ remote เขียนเฉพาะข้อมูลการเชื่อมต่อสำหรับ Gateway ระยะไกล และไม่ติดตั้งแพ็กเกจ Plugin ในเครื่อง
- `--allow-unconfigured` เป็น escape hatch แยกต่างหากของ runtime Gateway ไม่ได้หมายความว่า onboarding อาจละ `gateway.mode` ได้

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

สุขภาพของ Gateway local แบบไม่โต้ตอบ:

- เว้นแต่คุณส่ง `--skip-health`, onboarding จะรอจนกว่า Gateway local จะเข้าถึงได้ก่อนจึงจะออกด้วยสถานะสำเร็จ
- `--install-daemon` เริ่มเส้นทางติดตั้ง Gateway ที่จัดการให้ก่อน หากไม่มีแฟล็กนี้ คุณต้องมี Gateway local ที่กำลังทำงานอยู่แล้ว เช่น `openclaw gateway run`
- หากต้องการเพียงเขียน config/workspace/bootstrap ใน automation ให้ใช้ `--skip-health`
- หากคุณจัดการไฟล์ workspace ด้วยตัวเอง ให้ส่ง `--skip-bootstrap` เพื่อตั้งค่า `agents.defaults.skipBootstrap: true` และข้ามการสร้าง `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` และ `BOOTSTRAP.md`
- บน Windows แบบ native, `--install-daemon` จะลองใช้ Scheduled Tasks ก่อน และ fallback ไปเป็นรายการ login ในโฟลเดอร์ Startup ต่อผู้ใช้ หากการสร้าง task ถูกปฏิเสธ

พฤติกรรมการเริ่มใช้งานแบบโต้ตอบด้วยโหมดอ้างอิง:

- เลือก **Use secret reference** เมื่อมี prompt
- จากนั้นเลือกอย่างใดอย่างหนึ่ง:
  - Environment variable
  - ผู้ให้บริการ secret ที่กำหนดค่าไว้ (`file` หรือ `exec`)
- Onboarding ทำการตรวจสอบ preflight อย่างรวดเร็วก่อนบันทึก ref
  - หากการตรวจสอบล้มเหลว onboarding จะแสดงข้อผิดพลาดและให้คุณลองใหม่

### ตัวเลือก endpoint ของ Z.AI แบบไม่โต้ตอบ

<Note>
`--auth-choice zai-api-key` ตรวจหา endpoint และโมเดล Z.AI ที่ดีที่สุดสำหรับ
key ของคุณโดยอัตโนมัติ endpoint ของ Coding Plan จะให้ความสำคัญกับ `zai/glm-5.2`; endpoint API ทั่วไปใช้
`zai/glm-5.1` หากต้องการบังคับ endpoint ของ Coding Plan ให้เลือก `zai-coding-global` หรือ
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

## แฟล็กแบบไม่โต้ตอบเพิ่มเติม

การยืนยันตัวตนโมเดลด้วย token (ไม่โต้ตอบ; ใช้กับ `--auth-choice token`):

- `--token-provider <id>` — ID ผู้ให้บริการ token ระบุว่าผู้ให้บริการใดออก token
- `--token <token>` — ค่า token สำหรับการยืนยันตัวตนของโมเดล
- `--token-profile-id <id>` — ID auth profile การจัดเก็บ token ทั่วไปมีค่าเริ่มต้นเป็น `<provider>:manual`; flow การตั้งค่าที่ผู้ให้บริการเป็นเจ้าของอาจใช้ค่าเริ่มต้นของตนเอง เช่น `anthropic:default`
- `--token-expires-in <duration>` — ระยะเวลาหมดอายุของ token แบบตัวเลือก (เช่น `365d`, `12h`)

Cloudflare AI Gateway (ไม่โต้ตอบ):

- `--cloudflare-ai-gateway-account-id <id>` — Cloudflare Account ID สำหรับ routing ผ่าน Cloudflare AI Gateway
- `--cloudflare-ai-gateway-gateway-id <id>` — Cloudflare AI Gateway ID

การควบคุมการติดตั้ง daemon:

- `--no-install-daemon` — ข้ามการติดตั้งบริการ Gateway อย่างชัดเจน
- `--skip-daemon` — Alias สำหรับ `--no-install-daemon`

การควบคุมการตั้งค่า UI และ hook:

- `--skip-ui` — ข้าม prompt ของ Control UI / TUI ระหว่าง onboarding
- `--skip-hooks` — ข้าม prompt การตั้งค่า webhook / hook ระหว่าง onboarding

การระงับเอาต์พุต:

- `--suppress-gateway-token-output` — ระงับเอาต์พุต Gateway/UI ที่มี token (คำใบ้ token, URL auto-login ที่มี token ฝังอยู่ และการเปิด Control UI อัตโนมัติ) มีประโยชน์ใน terminal ที่ใช้ร่วมกันและ environment CI

## หมายเหตุเกี่ยวกับ flow

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: prompt ขั้นต่ำ, สร้าง token ของ Gateway อัตโนมัติ
    - `manual`: prompt เต็มสำหรับ port, bind และ auth (alias ของ `advanced`)
    - `import`: เรียกผู้ให้บริการ migration ที่ตรวจพบ, แสดงตัวอย่างแผน แล้วจึงนำไปใช้หลังการยืนยัน

  </Accordion>
  <Accordion title="Provider prefiltering">
    เมื่อ auth choice บ่งชี้ผู้ให้บริการที่ต้องการ onboarding จะกรองตัวเลือก default-model และ allowlist ล่วงหน้าให้เหลือผู้ให้บริการนั้น สำหรับ Volcengine และ BytePlus การทำเช่นนี้ยัง match กับตัวแปร coding-plan (`volcengine-plan/*`, `byteplus-plan/*`) ด้วย

    หาก filter ผู้ให้บริการที่ต้องการยังไม่ให้โมเดลที่โหลดแล้ว onboarding จะ fallback ไปยัง catalog ที่ไม่ถูกกรองแทนการปล่อยให้ตัวเลือกว่าง

  </Accordion>
  <Accordion title="Web-search follow-ups">
    ผู้ให้บริการ web-search บางรายเรียก prompt ติดตามผลเฉพาะผู้ให้บริการ:

    - **Grok** สามารถเสนอการตั้งค่า `x_search` แบบตัวเลือกด้วย xAI OAuth profile หรือ API key เดียวกัน และตัวเลือกโมเดล `x_search`
    - **Kimi** สามารถถาม region ของ Moonshot API (`api.moonshot.ai` เทียบกับ `api.moonshot.cn`) และโมเดล web-search เริ่มต้นของ Kimi

  </Accordion>
  <Accordion title="Other behaviors">
    - พฤติกรรมขอบเขต DM ของ onboarding แบบ local: [ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals)
    - แชตแรกที่เร็วที่สุด: `openclaw dashboard` (Control UI, ไม่มีการตั้งค่าช่องทาง)
    - ผู้ให้บริการแบบกำหนดเอง: เชื่อมต่อ endpoint ใด ๆ ที่เข้ากันได้กับ OpenAI หรือ Anthropic รวมถึงผู้ให้บริการ hosted ที่ไม่ได้อยู่ในรายการ ใช้ Unknown เพื่อตรวจหาอัตโนมัติ
    - หากตรวจพบ state ของ Hermes, onboarding จะเสนอ flow migration ใช้ [Migrate](/th/cli/migrate) สำหรับแผน dry-run, โหมด overwrite, รายงาน และ mapping แบบละเอียด

  </Accordion>
</AccordionGroup>

## คำสั่งติดตามผลที่ใช้บ่อย

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

ใช้ `openclaw setup` เป็นจุดเริ่มต้นการเริ่มใช้งานแบบมีคำแนะนำเดียวกัน ใช้ `openclaw setup --baseline` เมื่อคุณต้องการเพียง config/workspace พื้นฐาน, ใช้ `openclaw configure` ภายหลังสำหรับการเปลี่ยนแปลงแบบเจาะจง และใช้ `openclaw channels add` สำหรับการตั้งค่าเฉพาะช่องทาง

<Note>
`--json` ไม่ได้หมายถึงโหมดแบบไม่โต้ตอบ ใช้ `--non-interactive` สำหรับสคริปต์
</Note>
