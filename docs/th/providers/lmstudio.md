---
read_when:
    - คุณต้องการรัน OpenClaw ด้วยโมเดลโอเพนซอร์สผ่าน LM Studio
    - คุณต้องการตั้งค่าและกำหนดค่า LM Studio
summary: เรียกใช้ OpenClaw ด้วย LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T10:26:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3971bc471e5d8b0f142394b7b1897f8fdb2be283082245fbb2cf744d06143292
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio เป็นแอปที่ใช้งานง่ายแต่ทรงพลังสำหรับรันโมเดลแบบน้ำหนักเปิดบนฮาร์ดแวร์ของคุณเอง แอปนี้ช่วยให้คุณรันโมเดล llama.cpp (GGUF) หรือ MLX (Apple Silicon) ได้ มีให้ใช้งานทั้งแบบแพ็กเกจ GUI และ daemon แบบ headless (`llmster`) สำหรับเอกสารผลิตภัณฑ์และการตั้งค่า โปรดดู [lmstudio.ai](https://lmstudio.ai/)

## เริ่มต้นอย่างรวดเร็ว

1. ติดตั้ง LM Studio (เดสก์ท็อป) หรือ `llmster` (headless) จากนั้นเริ่มเซิร์ฟเวอร์ภายในเครื่อง:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. เริ่มเซิร์ฟเวอร์

ตรวจสอบให้แน่ใจว่าคุณเริ่มแอปเดสก์ท็อปแล้ว หรือรัน daemon ด้วยคำสั่งต่อไปนี้:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

หากคุณใช้แอป ตรวจสอบให้แน่ใจว่าเปิดใช้งาน JIT แล้วเพื่อประสบการณ์ที่ราบรื่น เรียนรู้เพิ่มเติมใน[คู่มือ JIT และ TTL ของ LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)

3. หากเปิดใช้งานการยืนยันตัวตนของ LM Studio ให้ตั้งค่า `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

หากปิดใช้งานการยืนยันตัวตนของ LM Studio คุณสามารถเว้น API key ว่างไว้ได้ระหว่างการตั้งค่า OpenClaw แบบโต้ตอบ

สำหรับรายละเอียดการตั้งค่าการยืนยันตัวตนของ LM Studio โปรดดู [การยืนยันตัวตนของ LM Studio](https://lmstudio.ai/docs/developer/core/authentication)

4. รัน onboarding และเลือก `LM Studio`:

```bash
openclaw onboard
```

5. ใน onboarding ให้ใช้พรอมป์ `Default model` เพื่อเลือกโมเดล LM Studio ของคุณ

คุณยังสามารถตั้งค่าหรือเปลี่ยนในภายหลังได้:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

คีย์โมเดลของ LM Studio ใช้รูปแบบ `author/model-name` (เช่น `qwen/qwen3.5-9b`) การอ้างอิงโมเดลของ OpenClaw
จะเติมชื่อผู้ให้บริการไว้ด้านหน้า: `lmstudio/qwen/qwen3.5-9b` คุณสามารถหาคีย์ที่แน่นอนของ
โมเดลได้โดยรัน `curl http://localhost:1234/api/v1/models` แล้วดูที่ฟิลด์ `key`

## Onboarding แบบไม่โต้ตอบ

ใช้ onboarding แบบไม่โต้ตอบเมื่อคุณต้องการเขียนสคริปต์สำหรับการตั้งค่า (CI, การจัดเตรียมระบบ, bootstrap ระยะไกล):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

หรือระบุ base URL, โมเดล และ API key ที่เลือกใส่ได้:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` รับคีย์โมเดลตามที่ LM Studio ส่งกลับมา (เช่น `qwen/qwen3.5-9b`) โดยไม่มี
คำนำหน้าผู้ให้บริการ `lmstudio/`

สำหรับเซิร์ฟเวอร์ LM Studio ที่ต้องยืนยันตัวตน ให้ส่ง `--lmstudio-api-key` หรือตั้งค่า `LM_API_TOKEN`
สำหรับเซิร์ฟเวอร์ LM Studio ที่ไม่ต้องยืนยันตัวตน ให้ละเว้นคีย์; OpenClaw จะจัดเก็บเครื่องหมายภายในเครื่องที่ไม่ใช่ความลับ

`--custom-api-key` ยังคงรองรับเพื่อความเข้ากันได้ แต่ควรใช้ `--lmstudio-api-key` สำหรับ LM Studio

การดำเนินการนี้จะเขียน `models.providers.lmstudio` และตั้งค่าโมเดลเริ่มต้นเป็น
`lmstudio/<custom-model-id>` เมื่อคุณระบุ API key การตั้งค่าจะเขียนโปรไฟล์การยืนยันตัวตน
`lmstudio:default` ด้วย

การตั้งค่าแบบโต้ตอบสามารถถามความยาวบริบทการโหลดที่ต้องการแบบเลือกใส่ได้ และนำไปใช้กับโมเดล LM Studio ที่ค้นพบทั้งหมดซึ่งบันทึกลงในการกำหนดค่า
การกำหนดค่า Plugin ของ LM Studio เชื่อถือ endpoint ของ LM Studio ที่กำหนดค่าไว้สำหรับคำขอโมเดล รวมถึงโฮสต์ loopback, LAN และ tailnet คุณสามารถเลือกไม่ใช้ได้โดยตั้งค่า `models.providers.lmstudio.request.allowPrivateNetwork: false`

## การกำหนดค่า

### ความเข้ากันได้ของการใช้งานแบบสตรีม

LM Studio เข้ากันได้กับการใช้งานแบบสตรีม เมื่อไม่ได้ส่งออกออบเจ็กต์
`usage` ในรูปแบบของ OpenAI OpenClaw จะกู้คืนจำนวนโทเค็นจาก metadata แบบ llama.cpp
`timings.prompt_n` / `timings.predicted_n` แทน

พฤติกรรมการใช้งานแบบสตรีมเดียวกันนี้ใช้กับ backend ภายในเครื่องที่เข้ากันได้กับ OpenAI เหล่านี้ด้วย:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### ความเข้ากันได้ของ Thinking

เมื่อการค้นพบ `/api/v1/models` ของ LM Studio รายงานตัวเลือก reasoning
เฉพาะโมเดล OpenClaw จะเก็บค่าดั้งเดิมเหล่านั้นไว้ใน metadata ความเข้ากันได้ของโมเดล สำหรับ
โมเดล thinking แบบไบนารีที่ประกาศ `allowed_options: ["off", "on"]`
OpenClaw จะแมป thinking ที่ปิดใช้งานเป็น `off` และระดับ `/think` ที่เปิดใช้งานเป็น `on`
แทนการส่งค่าเฉพาะ OpenAI เช่น `low` หรือ `medium`

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

ตรวจสอบให้แน่ใจว่า LM Studio กำลังรันอยู่ หากเปิดใช้งานการยืนยันตัวตน ให้ตั้งค่า `LM_API_TOKEN` ด้วย:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

ตรวจสอบว่า API เข้าถึงได้:

```bash
curl http://localhost:1234/api/v1/models
```

### ข้อผิดพลาดการยืนยันตัวตน (HTTP 401)

หากการตั้งค่ารายงาน HTTP 401 ให้ตรวจสอบ API key ของคุณ:

- ตรวจสอบว่า `LM_API_TOKEN` ตรงกับคีย์ที่กำหนดค่าไว้ใน LM Studio
- สำหรับรายละเอียดการตั้งค่าการยืนยันตัวตนของ LM Studio โปรดดู [การยืนยันตัวตนของ LM Studio](https://lmstudio.ai/docs/developer/core/authentication)
- หากเซิร์ฟเวอร์ของคุณไม่ต้องการการยืนยันตัวตน ให้เว้นคีย์ว่างไว้ระหว่างการตั้งค่า

### การโหลดโมเดลแบบ Just-in-time

LM Studio รองรับการโหลดโมเดลแบบ just-in-time (JIT) ซึ่งโมเดลจะถูกโหลดเมื่อมีคำขอแรก โดยค่าเริ่มต้น OpenClaw จะ preload โมเดลผ่าน endpoint การโหลดดั้งเดิมของ LM Studio ซึ่งช่วยได้เมื่อปิดใช้งาน JIT หากต้องการให้ JIT, idle TTL และพฤติกรรม auto-evict ของ LM Studio จัดการ lifecycle ของโมเดล ให้ปิดใช้งานขั้นตอน preload ของ OpenClaw:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### โฮสต์ LM Studio บน LAN หรือ tailnet

ใช้ที่อยู่ที่เข้าถึงได้ของโฮสต์ LM Studio, คง `/v1` ไว้ และตรวจสอบให้แน่ใจว่า LM Studio ถูกผูกไว้เกินกว่า loopback บนเครื่องนั้น:

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

ต่างจากผู้ให้บริการทั่วไปที่เข้ากันได้กับ OpenAI, `lmstudio` จะเชื่อถือ endpoint local/private ที่กำหนดค่าไว้โดยอัตโนมัติสำหรับคำขอโมเดลที่มีการป้องกัน ID ผู้ให้บริการ loopback แบบกำหนดเอง เช่น `localhost` หรือ `127.0.0.1` ก็เชื่อถือโดยอัตโนมัติเช่นกัน; สำหรับ ID ผู้ให้บริการแบบกำหนดเองของ LAN, tailnet หรือ DNS ส่วนตัว ให้ตั้งค่า `models.providers.<id>.request.allowPrivateNetwork: true` อย่างชัดเจน

## ที่เกี่ยวข้อง

- [การเลือกโมเดล](/th/concepts/model-providers)
- [Ollama](/th/providers/ollama)
- [โมเดลภายในเครื่อง](/th/gateway/local-models)
