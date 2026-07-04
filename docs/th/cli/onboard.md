---
read_when:
    - คุณต้องการการตั้งค่าแบบมีคำแนะนำสำหรับ gateway, workspace, auth, channels และ skills
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw onboard` (การเริ่มต้นใช้งานแบบโต้ตอบ)
title: เริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-07-04T20:46:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

การเริ่มต้นใช้งานแบบมีคำแนะนำครบถ้วนสำหรับการตั้งค่า Gateway แบบ local หรือ remote ใช้คำสั่งนี้เมื่อคุณต้องการให้ OpenClaw พาเดินผ่านการยืนยันตัวตนของโมเดล, workspace, gateway, channels, skills และสุขภาพในโฟลว์เดียว

## คู่มือที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ศูนย์กลางการเริ่มต้นใช้งาน CLI" href="/th/start/wizard" icon="rocket">
    คำแนะนำทีละขั้นสำหรับโฟลว์ CLI แบบโต้ตอบ
  </Card>
  <Card title="ภาพรวมการเริ่มต้นใช้งาน" href="/th/start/onboarding-overview" icon="map">
    วิธีที่การเริ่มต้นใช้งาน OpenClaw เชื่อมโยงกัน
  </Card>
  <Card title="เอกสารอ้างอิงการตั้งค่า CLI" href="/th/start/wizard-cli-reference" icon="book">
    เอาต์พุต, รายละเอียดภายใน และพฤติกรรมรายขั้นตอน
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

ในเทอร์มินัลแบบโต้ตอบ `openclaw` แบบไม่มีคำสั่งย่อยจะกำหนดเส้นทางตามสถานะ
config:

- หากไฟล์ config ที่ใช้งานอยู่หายไปหรือไม่มีการตั้งค่าที่ผู้ใช้เขียนไว้ (ว่างหรือ
  มีเฉพาะ metadata) ระบบจะเริ่มโฟลว์การเริ่มต้นใช้งานแบบคลาสสิกนี้
- หากไฟล์ config มีอยู่แต่ตรวจสอบความถูกต้องไม่ผ่าน ระบบจะเริ่ม
  [Crestodian](/th/cli/crestodian) เพื่อซ่อมแซม
- หากไฟล์ config ถูกต้อง ระบบจะเปิด TUI ของ agent ตามปกติ ไม่ว่าจะทำงานแบบ local
  หรือเชื่อมต่อกับ Gateway ที่กำหนดค่าไว้และเข้าถึงได้ บนการติดตั้งที่กำหนดค่าแล้ว
  เข้าถึง Crestodian ด้วย `/crestodian` ภายใน TUI หรือ `openclaw crestodian`

Plaintext `ws://` ใช้ได้สำหรับ loopback, IP ส่วนตัวแบบ literal, `.local` และ
URL ของ Tailnet `*.ts.net` gateway สำหรับชื่อ private-DNS อื่นที่เชื่อถือได้ ให้ตั้งค่า
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน

## Locale

การเริ่มต้นใช้งานแบบโต้ตอบใช้ locale ของตัวช่วย CLI สำหรับข้อความการตั้งค่าแบบคงที่ ลำดับการแก้ไข
คือ:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. fallback ภาษาอังกฤษ

locale ของตัวช่วยที่รองรับคือ `en`, `zh-CN` และ `zh-TW` ค่า locale อาจใช้
ขีดล่างหรือรูปแบบ suffix ของ POSIX เช่น `zh_CN.UTF-8` ชื่อผลิตภัณฑ์, ชื่อคำสั่ง,
config keys, URLs, provider IDs, model IDs และป้ายกำกับ plugin/channel
จะยังคงเป็น literal

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
OpenClaw ทำเครื่องหมาย model IDs สำหรับ vision ทั่วไปว่าใช้งานรูปภาพได้โดยอัตโนมัติ ส่ง `--custom-image-input` สำหรับ vision IDs แบบกำหนดเองที่ไม่รู้จัก หรือ `--custom-text-input` เพื่อบังคับ metadata แบบข้อความเท่านั้น
ใช้ `--custom-compatibility openai-responses` สำหรับ endpoint ที่เข้ากันได้กับ OpenAI ซึ่งรองรับ `/v1/responses` แต่ไม่รองรับ `/v1/chat/completions`

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

`--custom-base-url` มีค่าเริ่มต้นเป็น `http://127.0.0.1:11434` `--custom-model-id` เป็นตัวเลือก หากละไว้ การเริ่มต้นใช้งานจะใช้ค่าเริ่มต้นที่ Ollama แนะนำ Cloud model IDs เช่น `kimi-k2.5:cloud` ก็ใช้งานได้ที่นี่เช่นกัน

จัดเก็บคีย์ผู้ให้บริการเป็น refs แทน plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

เมื่อใช้ `--secret-input-mode ref` การเริ่มต้นใช้งานจะเขียน refs ที่อิง env แทนค่าคีย์แบบ plaintext
สำหรับผู้ให้บริการที่อิง auth-profile ระบบจะเขียนรายการ `keyRef`; สำหรับผู้ให้บริการแบบกำหนดเอง ระบบจะเขียน `models.providers.<id>.apiKey` เป็น env ref (ตัวอย่างเช่น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`)

สัญญาโหมด `ref` แบบไม่โต้ตอบ:

- ตั้งค่า env var ของผู้ให้บริการในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน (ตัวอย่างเช่น `OPENAI_API_KEY`)
- อย่าส่งแฟล็กคีย์แบบ inline (ตัวอย่างเช่น `--openai-api-key`) เว้นแต่จะตั้งค่า env var นั้นไว้ด้วย
- หากส่งแฟล็กคีย์แบบ inline โดยไม่มี env var ที่จำเป็น การเริ่มต้นใช้งานจะล้มเหลวทันทีพร้อมคำแนะนำ

ตัวเลือก token ของ Gateway ในโหมดไม่โต้ตอบ:

- `--gateway-auth token --gateway-token <token>` จัดเก็บ token แบบ plaintext
- `--gateway-auth token --gateway-token-ref-env <name>` จัดเก็บ `gateway.auth.token` เป็น env SecretRef
- `--gateway-token` และ `--gateway-token-ref-env` ใช้ร่วมกันไม่ได้
- `--gateway-token-ref-env` ต้องมี env var ที่ไม่ว่างในสภาพแวดล้อมของกระบวนการเริ่มต้นใช้งาน
- เมื่อใช้ `--install-daemon` หาก token auth ต้องใช้ token ระบบจะตรวจสอบความถูกต้องของ gateway tokens ที่จัดการด้วย SecretRef แต่จะไม่บันทึกเป็น plaintext ที่ resolve แล้วใน metadata สภาพแวดล้อมของบริการ supervisor
- เมื่อใช้ `--install-daemon` หากโหมด token ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ resolve ไม่ได้ การเริ่มต้นใช้งานจะ fail closed พร้อมคำแนะนำการแก้ไข
- เมื่อใช้ `--install-daemon` หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` การเริ่มต้นใช้งานจะบล็อกการติดตั้งจนกว่าจะตั้งค่า mode อย่างชัดเจน
- การเริ่มต้นใช้งานแบบ local จะเขียน `gateway.mode="local"` ลงใน config หากไฟล์ config ภายหลังไม่มี `gateway.mode` ให้ถือว่านั่นเป็นความเสียหายของ config หรือการแก้ไขด้วยตนเองที่ไม่สมบูรณ์ ไม่ใช่ทางลัด local-mode ที่ถูกต้อง
- การเริ่มต้นใช้งานแบบ local จะติดตั้ง plugins ที่ดาวน์โหลดได้ซึ่งเลือกไว้เมื่อเส้นทางการตั้งค่าที่เลือกต้องใช้
- การเริ่มต้นใช้งานแบบ remote จะเขียนเฉพาะข้อมูลการเชื่อมต่อสำหรับ Gateway ระยะไกล และจะไม่ติดตั้งแพ็กเกจ Plugin แบบ local
- `--allow-unconfigured` เป็นช่องทางออกฉุกเฉินของ runtime gateway แยกต่างหาก ไม่ได้หมายความว่าการเริ่มต้นใช้งานสามารถละเว้น `gateway.mode` ได้

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

สุขภาพของ local gateway แบบไม่โต้ตอบ:

- เว้นแต่คุณจะส่ง `--skip-health` การเริ่มต้นใช้งานจะรอให้ local gateway เข้าถึงได้ก่อนจึงจะออกสำเร็จ
- `--install-daemon` เริ่มเส้นทางการติดตั้ง managed gateway ก่อน หากไม่มีแฟล็กนี้ คุณต้องมี local gateway ทำงานอยู่แล้ว เช่น `openclaw gateway run`
- หากคุณต้องการเพียงเขียน config/workspace/bootstrap ในระบบอัตโนมัติ ให้ใช้ `--skip-health`
- หากคุณจัดการไฟล์ workspace ด้วยตนเอง ให้ส่ง `--skip-bootstrap` เพื่อตั้งค่า `agents.defaults.skipBootstrap: true` และข้ามการสร้าง `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` และ `BOOTSTRAP.md`
- บน Windows แบบ native, `--install-daemon` จะลอง Scheduled Tasks ก่อน และ fallback ไปยังรายการล็อกอินในโฟลเดอร์ Startup ต่อผู้ใช้หากการสร้าง task ถูกปฏิเสธ

พฤติกรรมการเริ่มต้นใช้งานแบบโต้ตอบเมื่อใช้โหมดอ้างอิง:

- เลือก **ใช้ secret reference** เมื่อระบบถาม
- จากนั้นเลือกอย่างใดอย่างหนึ่ง:
  - Environment variable
  - Configured secret provider (`file` หรือ `exec`)
- การเริ่มต้นใช้งานจะทำการตรวจสอบ preflight อย่างรวดเร็วก่อนบันทึก ref
  - หากการตรวจสอบล้มเหลว การเริ่มต้นใช้งานจะแสดงข้อผิดพลาดและให้คุณลองใหม่

### ตัวเลือก endpoint ของ Z.AI แบบไม่โต้ตอบ

<Note>
`--auth-choice zai-api-key` ตรวจจับ endpoint และโมเดล Z.AI ที่ดีที่สุดสำหรับ
คีย์ของคุณโดยอัตโนมัติ Endpoint ของ Coding Plan จะชอบใช้ `zai/glm-5.2`; endpoint API ทั่วไปใช้
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

การยืนยันตัวตนโมเดลแบบอิง token (ไม่โต้ตอบ; ใช้กับ `--auth-choice token`):

- `--token-provider <id>` — id ของผู้ให้บริการ Token ระบุว่าผู้ให้บริการใดออก token
- `--token <token>` — ค่า Token สำหรับการยืนยันตัวตนโมเดล
- `--token-profile-id <id>` — id ของ auth profile การจัดเก็บ token ทั่วไปมีค่าเริ่มต้นเป็น `<provider>:manual`; โฟลว์การตั้งค่าที่ผู้ให้บริการเป็นเจ้าของอาจใช้ค่าเริ่มต้นของตนเอง เช่น `anthropic:default`
- `--token-expires-in <duration>` — ระยะเวลาหมดอายุของ token แบบไม่บังคับ (เช่น `365d`, `12h`)

Cloudflare AI Gateway (ไม่โต้ตอบ):

- `--cloudflare-ai-gateway-account-id <id>` — Cloudflare Account ID สำหรับ routing ผ่าน Cloudflare AI Gateway
- `--cloudflare-ai-gateway-gateway-id <id>` — Cloudflare AI Gateway ID

การควบคุมการติดตั้ง daemon:

- `--no-install-daemon` — ข้ามการติดตั้งบริการ gateway อย่างชัดเจน
- `--skip-daemon` — Alias สำหรับ `--no-install-daemon`

การควบคุมการตั้งค่า UI และ hook:

- `--skip-ui` — ข้าม prompts ของ Control UI / TUI ระหว่างการเริ่มต้นใช้งาน
- `--skip-hooks` — ข้าม prompts การตั้งค่า webhook / hook ระหว่างการเริ่มต้นใช้งาน

การระงับเอาต์พุต:

- `--suppress-gateway-token-output` — ระงับเอาต์พุต Gateway/UI ที่มี token (คำใบ้ token, URL auto-login ที่ฝัง token และการเปิด Control UI อัตโนมัติ) มีประโยชน์ในเทอร์มินัลที่ใช้ร่วมกันและสภาพแวดล้อม CI

## หมายเหตุเกี่ยวกับโฟลว์

<AccordionGroup>
  <Accordion title="ประเภทโฟลว์">
    - `quickstart`: prompts ขั้นต่ำ, สร้าง gateway token โดยอัตโนมัติ
    - `manual`: prompts ครบถ้วนสำหรับ port, bind และ auth (alias ของ `advanced`)
    - `import`: รันผู้ให้บริการการย้ายข้อมูลที่ตรวจพบ, พรีวิวแผน แล้วนำไปใช้หลังยืนยัน

  </Accordion>
  <Accordion title="การกรองผู้ให้บริการล่วงหน้า">
    เมื่อ auth choice บ่งชี้ผู้ให้บริการที่ต้องการ การเริ่มต้นใช้งานจะกรองตัวเลือก default-model และ allowlist ล่วงหน้าให้เหลือผู้ให้บริการนั้น สำหรับ Volcengine และ BytePlus การทำเช่นนี้จะจับคู่ variants ของ coding-plan ด้วย (`volcengine-plan/*`, `byteplus-plan/*`)

    หากตัวกรอง preferred-provider ยังไม่ได้โมเดลที่โหลดไว้ การเริ่มต้นใช้งานจะ fallback ไปยัง catalog ที่ไม่ถูกกรองแทนการปล่อยให้ตัวเลือกว่าง

  </Accordion>
  <Accordion title="การติดตามผล web-search">
    ผู้ให้บริการ web-search บางรายจะเรียก prompts ติดตามผลเฉพาะผู้ให้บริการ:

    - **Grok** สามารถเสนอการตั้งค่า `x_search` แบบไม่บังคับด้วยโปรไฟล์ xAI OAuth หรือ API key เดียวกัน และตัวเลือกโมเดล `x_search`
    - **Kimi** สามารถถาม region ของ Moonshot API (`api.moonshot.ai` เทียบกับ `api.moonshot.cn`) และโมเดล Kimi web-search เริ่มต้น

  </Accordion>
  <Accordion title="พฤติกรรมอื่นๆ">
    - พฤติกรรมขอบเขต DM ของการเริ่มต้นใช้งานแบบ local: [เอกสารอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals)
    - แชตแรกที่เร็วที่สุด: `openclaw dashboard` (Control UI, ไม่มีการตั้งค่า channel)
    - ผู้ให้บริการแบบกำหนดเอง: เชื่อมต่อ endpoint ใดๆ ที่เข้ากันได้กับ OpenAI หรือ Anthropic รวมถึงผู้ให้บริการแบบ hosted ที่ไม่ได้ระบุไว้ ใช้ Unknown เพื่อตรวจจับอัตโนมัติ
    - หากตรวจพบสถานะ Hermes การเริ่มต้นใช้งานจะเสนอ flow การย้ายข้อมูล ใช้ [Migrate](/th/cli/migrate) สำหรับแผน dry-run, โหมด overwrite, รายงาน และการแมปที่แน่นอน

  </Accordion>
</AccordionGroup>

## คำสั่งติดตามผลทั่วไป

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

ใช้ `openclaw setup` เป็นจุดเริ่มต้นการเริ่มใช้งานแบบมีคำแนะนำเดียวกัน ใช้ `openclaw setup --baseline` เมื่อคุณต้องการเพียง config/workspace พื้นฐาน, ใช้ `openclaw configure` ในภายหลังสำหรับการเปลี่ยนแปลงแบบเจาะจง และใช้ `openclaw channels add` สำหรับการตั้งค่าเฉพาะช่องทาง

<Note>
`--json` ไม่ได้หมายถึงโหมดไม่โต้ตอบ ใช้ `--non-interactive` สำหรับสคริปต์
</Note>
