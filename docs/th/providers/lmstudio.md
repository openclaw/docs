---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw กับโมเดลโอเพนซอร์สผ่าน LM Studio
    - คุณต้องการตั้งค่าและกำหนดค่า LM Studio
summary: เรียกใช้ OpenClaw กับ LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-23T10:22:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 062b26cf10631e74f4e1917ea9011133eb4433f5fb7ee85748d00080a6ca212d
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

LM Studio เป็นแอปที่ใช้งานง่ายแต่ทรงพลังสำหรับรันโมเดลแบบ open-weight บนฮาร์ดแวร์ของคุณเอง รองรับการรันโมเดล llama.cpp (GGUF) หรือ MLX (Apple Silicon) มีทั้งแบบแพ็กเกจ GUI และ daemon แบบ headless (`llmster`) สำหรับเอกสารผลิตภัณฑ์และการตั้งค่า ดูได้ที่ [lmstudio.ai](https://lmstudio.ai/)

## เริ่มต้นอย่างรวดเร็ว

1. ติดตั้ง LM Studio (เดสก์ท็อป) หรือ `llmster` (headless) แล้วเริ่มเซิร์ฟเวอร์ภายในเครื่อง:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. เริ่มเซิร์ฟเวอร์

ตรวจสอบให้แน่ใจว่าคุณเปิดแอปเดสก์ท็อปไว้ หรือรัน daemon ด้วยคำสั่งต่อไปนี้:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

หากคุณใช้แอป ให้ตรวจสอบว่าเปิด JIT แล้วเพื่อให้ใช้งานได้ลื่นไหล ดูข้อมูลเพิ่มเติมได้ใน [คู่มือ JIT และ TTL ของ LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)

3. OpenClaw ต้องใช้ค่า token ของ LM Studio ให้ตั้งค่า `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

หากปิดการยืนยันตัวตนของ LM Studio อยู่ ให้ใช้ค่า token ที่ไม่ว่างค่าใดก็ได้:

```bash
export LM_API_TOKEN="placeholder-key"
```

สำหรับรายละเอียดการตั้งค่าการยืนยันตัวตนของ LM Studio ดู [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication)

4. รัน onboarding แล้วเลือก `LM Studio`:

```bash
openclaw onboard
```

5. ระหว่าง onboarding ให้ใช้พรอมต์ `Default model` เพื่อเลือกโมเดล LM Studio ของคุณ

คุณสามารถตั้งค่าหรือเปลี่ยนภายหลังได้เช่นกัน:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

คีย์โมเดลของ LM Studio ใช้รูปแบบ `author/model-name` (เช่น `qwen/qwen3.5-9b`) ส่วน ref
ของโมเดลใน OpenClaw จะเติมชื่อ provider นำหน้าเป็น `lmstudio/qwen/qwen3.5-9b` คุณสามารถดูคีย์ที่แน่นอนของ
โมเดลได้โดยรัน `curl http://localhost:1234/api/v1/models` แล้วดูฟิลด์ `key`

## onboarding แบบไม่โต้ตอบ

ใช้ onboarding แบบไม่โต้ตอบเมื่อคุณต้องการสคริปต์การตั้งค่า (CI, provisioning, remote bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

หรือระบุ base URL หรือโมเดลพร้อม API key:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` รับคีย์โมเดลตามที่ LM Studio ส่งกลับมา (เช่น `qwen/qwen3.5-9b`) โดยไม่ต้องมี
prefix `lmstudio/` ของ provider

onboarding แบบไม่โต้ตอบต้องใช้ `--lmstudio-api-key` (หรือ `LM_API_TOKEN` ใน env)
สำหรับเซิร์ฟเวอร์ LM Studio ที่ไม่ต้องยืนยันตัวตน ค่า token ที่ไม่ว่างค่าใดก็ได้สามารถใช้ได้

`--custom-api-key` ยังรองรับอยู่เพื่อความเข้ากันได้ แต่สำหรับ LM Studio แนะนำให้ใช้ `--lmstudio-api-key`

การดำเนินการนี้จะเขียน `models.providers.lmstudio` ตั้งค่าโมเดลเริ่มต้นเป็น
`lmstudio/<custom-model-id>` และเขียนโปรไฟล์ยืนยันตัวตน `lmstudio:default`

การตั้งค่าแบบโต้ตอบสามารถถามค่าความยาวบริบทการโหลดที่ต้องการแบบเลือกได้ และจะนำไปใช้กับโมเดล LM Studio ที่ตรวจพบซึ่งถูกบันทึกลงคอนฟิก

## การกำหนดค่า

### ความเข้ากันได้ของการรายงาน usage ระหว่างสตรีม

LM Studio เข้ากันได้กับการรายงาน usage ระหว่างสตรีม เมื่อไม่ส่งออบเจ็กต์ `usage` ที่มีรูปแบบแบบ OpenAI
OpenClaw จะกู้คืนจำนวนโทเค็นจาก metadata แบบ llama.cpp
`timings.prompt_n` / `timings.predicted_n` แทน

พฤติกรรมเดียวกันนี้ใช้กับแบ็กเอนด์ภายในเครื่องแบบเข้ากันได้กับ OpenAI ต่อไปนี้:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### การกำหนดค่าแบบชัดเจน

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## การแก้ไขปัญหา

### ตรวจไม่พบ LM Studio

ตรวจสอบให้แน่ใจว่า LM Studio กำลังทำงานอยู่ และคุณได้ตั้งค่า `LM_API_TOKEN` แล้ว (สำหรับเซิร์ฟเวอร์ที่ไม่ต้องยืนยันตัวตน ค่า token ที่ไม่ว่างค่าใดก็ได้ใช้ได้):

```bash
# เริ่มผ่านแอปเดสก์ท็อป หรือแบบ headless:
lms server start --port 1234
```

ตรวจสอบว่า API เข้าถึงได้:

```bash
curl http://localhost:1234/api/v1/models
```

### ข้อผิดพลาดการยืนยันตัวตน (HTTP 401)

หากการตั้งค่ารายงาน HTTP 401 ให้ตรวจสอบ API key ของคุณ:

- ตรวจสอบว่า `LM_API_TOKEN` ตรงกับคีย์ที่ตั้งค่าไว้ใน LM Studio
- สำหรับรายละเอียดการตั้งค่าการยืนยันตัวตนของ LM Studio ดู [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication)
- หากเซิร์ฟเวอร์ของคุณไม่ต้องใช้การยืนยันตัวตน ให้ใช้ค่า token ที่ไม่ว่างค่าใดก็ได้สำหรับ `LM_API_TOKEN`

### การโหลดโมเดลแบบทันเวลาพอดี

LM Studio รองรับการโหลดโมเดลแบบทันเวลาพอดี (JIT) ซึ่งโมเดลจะถูกโหลดเมื่อมีคำขอครั้งแรก ตรวจสอบให้แน่ใจว่าคุณเปิดใช้งานสิ่งนี้เพื่อหลีกเลี่ยงข้อผิดพลาด 'Model not loaded'
