---
read_when:
    - คุณต้องการรัน OpenClaw ด้วยโมเดลโอเพนซอร์สผ่าน LM Studio
    - คุณต้องการตั้งค่าและกำหนดค่า LM Studio
summary: เรียกใช้ OpenClaw กับ LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-30T10:12:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d1feadf355579b244ab4187a8d3b8bad661a5605aed906eedf361d6fcae3f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio เป็นแอปที่เป็นมิตรแต่ทรงพลังสำหรับการรันโมเดลที่เปิดเผยน้ำหนักบนฮาร์ดแวร์ของคุณเอง ช่วยให้คุณรันโมเดล llama.cpp (GGUF) หรือ MLX (Apple Silicon) ได้ มาในรูปแบบแพ็กเกจ GUI หรือ daemon แบบ headless (`llmster`) สำหรับเอกสารผลิตภัณฑ์และการตั้งค่า ดูที่ [lmstudio.ai](https://lmstudio.ai/)

## เริ่มต้นอย่างรวดเร็ว

1. ติดตั้ง LM Studio (เดสก์ท็อป) หรือ `llmster` (headless) จากนั้นเริ่มเซิร์ฟเวอร์ภายในเครื่อง:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. เริ่มเซิร์ฟเวอร์

ตรวจสอบให้แน่ใจว่าคุณเริ่มแอปเดสก์ท็อปหรือรัน daemon ด้วยคำสั่งต่อไปนี้:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

หากคุณใช้แอป ตรวจสอบให้แน่ใจว่าเปิดใช้ JIT แล้วเพื่อประสบการณ์ที่ราบรื่น อ่านเพิ่มเติมใน [คู่มือ JIT และ TTL ของ LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)

3. หากเปิดใช้การยืนยันตัวตนของ LM Studio ให้ตั้งค่า `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

หากปิดใช้การยืนยันตัวตนของ LM Studio คุณสามารถปล่อยคีย์ API ว่างไว้ระหว่างการตั้งค่า OpenClaw แบบโต้ตอบได้

สำหรับรายละเอียดการตั้งค่าการยืนยันตัวตนของ LM Studio ดู [การยืนยันตัวตนของ LM Studio](https://lmstudio.ai/docs/developer/core/authentication)

4. รันการเริ่มใช้งานและเลือก `LM Studio`:

```bash
openclaw onboard
```

5. ในการเริ่มใช้งาน ใช้พรอมต์ `Default model` เพื่อเลือกโมเดล LM Studio ของคุณ

คุณยังสามารถตั้งค่าหรือเปลี่ยนภายหลังได้:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

คีย์โมเดลของ LM Studio ใช้รูปแบบ `author/model-name` (เช่น `qwen/qwen3.5-9b`) refs โมเดลของ OpenClaw
จะเติมชื่อผู้ให้บริการไว้ข้างหน้า: `lmstudio/qwen/qwen3.5-9b` คุณสามารถหาคีย์ที่แน่นอนของ
โมเดลได้โดยรัน `curl http://localhost:1234/api/v1/models` แล้วดูที่ฟิลด์ `key`

## การเริ่มใช้งานแบบไม่โต้ตอบ

ใช้การเริ่มใช้งานแบบไม่โต้ตอบเมื่อคุณต้องการเขียนสคริปต์สำหรับการตั้งค่า (CI, การจัดเตรียมระบบ, การบูตสแตรประยะไกล):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

หรือระบุ URL พื้นฐาน โมเดล และคีย์ API ที่ไม่บังคับ:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` รับคีย์โมเดลตามที่ LM Studio ส่งคืน (เช่น `qwen/qwen3.5-9b`) โดยไม่มี
คำนำหน้าผู้ให้บริการ `lmstudio/`

สำหรับเซิร์ฟเวอร์ LM Studio ที่มีการยืนยันตัวตน ให้ส่ง `--lmstudio-api-key` หรือตั้งค่า `LM_API_TOKEN`
สำหรับเซิร์ฟเวอร์ LM Studio ที่ไม่มีการยืนยันตัวตน ให้ข้ามคีย์; OpenClaw จะจัดเก็บเครื่องหมายภายในเครื่องที่ไม่ใช่ความลับ

`--custom-api-key` ยังคงรองรับเพื่อความเข้ากันได้ แต่ `--lmstudio-api-key` เป็นตัวเลือกที่แนะนำสำหรับ LM Studio

การดำเนินการนี้จะเขียน `models.providers.lmstudio` และตั้งค่าโมเดลเริ่มต้นเป็น
`lmstudio/<custom-model-id>` เมื่อคุณระบุคีย์ API การตั้งค่าจะเขียนโปรไฟล์การยืนยันตัวตน
`lmstudio:default` ด้วย

การตั้งค่าแบบโต้ตอบสามารถถามความยาวบริบทการโหลดที่ต้องการซึ่งเป็นค่าทางเลือก และนำไปใช้กับโมเดล LM Studio ที่ค้นพบทั้งหมดซึ่งบันทึกลงในการกำหนดค่า
การกำหนดค่า Plugin ของ LM Studio เชื่อถือ endpoint ของ LM Studio ที่กำหนดค่าไว้สำหรับคำขอโมเดล รวมถึง loopback, LAN และโฮสต์ tailnet คุณสามารถเลือกไม่ใช้ได้โดยตั้งค่า `models.providers.lmstudio.request.allowPrivateNetwork: false`

## การกำหนดค่า

### ความเข้ากันได้ของการใช้งานแบบสตรีมมิง

LM Studio เข้ากันได้กับการใช้งานแบบสตรีมมิง เมื่อไม่ปล่อยออบเจ็กต์
`usage` ที่มีรูปแบบเหมือน OpenAI OpenClaw จะกู้คืนจำนวนโทเค็นจากเมทาดาทาแบบ llama.cpp
`timings.prompt_n` / `timings.predicted_n` แทน

ลักษณะการใช้งานแบบสตรีมมิงเดียวกันนี้ใช้กับแบ็กเอนด์ภายในเครื่องที่เข้ากันได้กับ OpenAI เหล่านี้:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### ความเข้ากันได้ของการคิด

เมื่อการค้นพบ `/api/v1/models` ของ LM Studio รายงานตัวเลือก reasoning
เฉพาะโมเดล OpenClaw จะเก็บค่าเนทีฟเหล่านั้นไว้ในเมทาดาทาความเข้ากันได้ของโมเดล สำหรับ
โมเดลการคิดแบบไบนารีที่ประกาศ `allowed_options: ["off", "on"]`
OpenClaw จะแมปการคิดที่ปิดใช้เป็น `off` และระดับ `/think` ที่เปิดใช้เป็น `on`
แทนการส่งค่าที่ใช้เฉพาะ OpenAI เช่น `low` หรือ `medium`

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

ตรวจสอบให้แน่ใจว่า LM Studio กำลังรันอยู่ หากเปิดใช้การยืนยันตัวตน ให้ตั้งค่า `LM_API_TOKEN` ด้วย:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

ตรวจสอบว่า API เข้าถึงได้:

```bash
curl http://localhost:1234/api/v1/models
```

### ข้อผิดพลาดการยืนยันตัวตน (HTTP 401)

หากการตั้งค่ารายงาน HTTP 401 ให้ตรวจสอบคีย์ API ของคุณ:

- ตรวจสอบว่า `LM_API_TOKEN` ตรงกับคีย์ที่กำหนดค่าใน LM Studio
- สำหรับรายละเอียดการตั้งค่าการยืนยันตัวตนของ LM Studio ดู [การยืนยันตัวตนของ LM Studio](https://lmstudio.ai/docs/developer/core/authentication)
- หากเซิร์ฟเวอร์ของคุณไม่ต้องการการยืนยันตัวตน ให้ปล่อยคีย์ว่างไว้ระหว่างการตั้งค่า

### การโหลดโมเดลแบบทันเวลาพอดี

LM Studio รองรับการโหลดโมเดลแบบทันเวลาพอดี (JIT) ซึ่งโมเดลจะถูกโหลดเมื่อมีคำขอแรก ตรวจสอบให้แน่ใจว่าคุณเปิดใช้สิ่งนี้เพื่อหลีกเลี่ยงข้อผิดพลาด 'Model not loaded'

### โฮสต์ LM Studio บน LAN หรือ tailnet

ใช้ที่อยู่ของโฮสต์ LM Studio ที่เข้าถึงได้ เก็บ `/v1` ไว้ และตรวจสอบให้แน่ใจว่า LM Studio ถูกผูกไว้นอกเหนือจาก loopback บนเครื่องนั้น:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

ต่างจากผู้ให้บริการทั่วไปที่เข้ากันได้กับ OpenAI, `lmstudio` จะเชื่อถือ endpoint ภายในเครื่อง/ส่วนตัวที่กำหนดค่าไว้โดยอัตโนมัติสำหรับคำขอโมเดลที่มีการป้องกัน ID ผู้ให้บริการ loopback แบบกำหนดเอง เช่น `localhost` หรือ `127.0.0.1` ก็เชื่อถือโดยอัตโนมัติเช่นกัน; สำหรับ ID ผู้ให้บริการแบบกำหนดเองของ LAN, tailnet หรือ DNS ส่วนตัว ให้ตั้งค่า `models.providers.<id>.request.allowPrivateNetwork: true` อย่างชัดเจน

## ที่เกี่ยวข้อง

- [การเลือกโมเดล](/th/concepts/model-providers)
- [Ollama](/th/providers/ollama)
- [โมเดลภายในเครื่อง](/th/gateway/local-models)
