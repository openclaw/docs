---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw กับโมเดลโอเพนซอร์สผ่าน LM Studio
    - คุณต้องการตั้งค่าและกำหนดค่า LM Studio
summary: เรียกใช้ OpenClaw ด้วย LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T22:22:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 814117ecbdc52cf67e921d0f0d67c4219f8bdc15fb8cf34b983cda775cba9b9e
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio เป็นแอปที่เป็นมิตรและทรงพลังสำหรับรันโมเดล open-weight บนฮาร์ดแวร์ของคุณเอง ช่วยให้คุณรันโมเดล llama.cpp (GGUF) หรือ MLX (Apple Silicon) ได้ มาในรูปแบบแพ็กเกจ GUI หรือ daemon แบบ headless (`llmster`) สำหรับเอกสารผลิตภัณฑ์และการตั้งค่า โปรดดู [lmstudio.ai](https://lmstudio.ai/)

## เริ่มต้นอย่างรวดเร็ว

1. ติดตั้ง LM Studio (เดสก์ท็อป) หรือ `llmster` (headless) จากนั้นเริ่มเซิร์ฟเวอร์ภายในเครื่อง:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. เริ่มเซิร์ฟเวอร์

ตรวจสอบให้แน่ใจว่าคุณเริ่มแอปเดสก์ท็อป หรือรัน daemon โดยใช้คำสั่งต่อไปนี้:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

หากคุณใช้แอป โปรดตรวจสอบว่าได้เปิดใช้ JIT แล้วเพื่อประสบการณ์ที่ราบรื่น เรียนรู้เพิ่มเติมใน[คู่มือ JIT และ TTL ของ LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)

3. หากเปิดใช้การยืนยันตัวตนของ LM Studio ให้ตั้งค่า `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

หากปิดใช้การยืนยันตัวตนของ LM Studio คุณสามารถเว้นคีย์ API ว่างไว้ได้ระหว่างการตั้งค่า OpenClaw แบบโต้ตอบ

สำหรับรายละเอียดการตั้งค่าการยืนยันตัวตนของ LM Studio โปรดดู [การยืนยันตัวตนของ LM Studio](https://lmstudio.ai/docs/developer/core/authentication)

4. รัน onboarding และเลือก `LM Studio`:

```bash
openclaw onboard
```

5. ใน onboarding ให้ใช้พรอมป์ `Default model` เพื่อเลือกโมเดล LM Studio ของคุณ

คุณยังสามารถตั้งค่าหรือเปลี่ยนภายหลังได้:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

คีย์โมเดล LM Studio ใช้รูปแบบ `author/model-name` (เช่น `qwen/qwen3.5-9b`) model refs ของ OpenClaw
จะเติมชื่อผู้ให้บริการไว้ข้างหน้า: `lmstudio/qwen/qwen3.5-9b` คุณสามารถค้นหาคีย์ที่ถูกต้องของ
โมเดลได้โดยรัน `curl http://localhost:1234/api/v1/models` และดูฟิลด์ `key`

## Onboarding แบบไม่โต้ตอบ

ใช้ onboarding แบบไม่โต้ตอบเมื่อคุณต้องการเขียนสคริปต์การตั้งค่า (CI, การจัดเตรียมระบบ, remote bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

หรือระบุ base URL, โมเดล และคีย์ API ทางเลือก:

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

สำหรับเซิร์ฟเวอร์ LM Studio ที่มีการยืนยันตัวตน ให้ส่ง `--lmstudio-api-key` หรือตั้งค่า `LM_API_TOKEN`
สำหรับเซิร์ฟเวอร์ LM Studio ที่ไม่มีการยืนยันตัวตน ให้ละคีย์ไว้ OpenClaw จะจัดเก็บเครื่องหมายภายในเครื่องที่ไม่ใช่ความลับ

`--custom-api-key` ยังคงรองรับเพื่อความเข้ากันได้ แต่แนะนำให้ใช้ `--lmstudio-api-key` สำหรับ LM Studio

การดำเนินการนี้จะเขียน `models.providers.lmstudio` และตั้งค่าโมเดลเริ่มต้นเป็น
`lmstudio/<custom-model-id>` เมื่อคุณระบุคีย์ API การตั้งค่าจะเขียนโปรไฟล์การยืนยันตัวตน
`lmstudio:default` ด้วย

การตั้งค่าแบบโต้ตอบสามารถถามความยาวบริบทการโหลดที่ต้องการเป็นตัวเลือก และนำไปใช้กับโมเดล LM Studio ที่ค้นพบซึ่งบันทึกไว้ในการกำหนดค่า
การกำหนดค่า Plugin ของ LM Studio เชื่อถือปลายทาง LM Studio ที่กำหนดค่าไว้สำหรับคำขอโมเดล รวมถึง loopback, LAN และโฮสต์ tailnet คุณสามารถยกเลิกได้โดยตั้งค่า `models.providers.lmstudio.request.allowPrivateNetwork: false`

## การกำหนดค่า

### ความเข้ากันได้ของการใช้งานแบบสตรีม

LM Studio เข้ากันได้กับ streaming usage เมื่อไม่ได้ปล่อยออบเจ็กต์
`usage` ที่มีรูปแบบแบบ OpenAI ออกมา OpenClaw จะกู้คืนจำนวนโทเค็นจากเมตาดาต้าแบบ llama.cpp
`timings.prompt_n` / `timings.predicted_n` แทน

พฤติกรรม streaming usage แบบเดียวกันนี้ใช้กับแบ็กเอนด์ภายในเครื่องที่เข้ากันได้กับ OpenAI เหล่านี้ด้วย:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### ความเข้ากันได้ของการคิด

เมื่อการค้นพบ `/api/v1/models` ของ LM Studio รายงานตัวเลือก reasoning
เฉพาะโมเดล OpenClaw จะแสดงค่า `reasoning_effort` ที่เข้ากันได้กับ OpenAI
ในเมตาดาต้า compat ของโมเดล บิลด์ LM Studio ปัจจุบันสามารถประกาศตัวเลือก UI
แบบไบนารี เช่น `allowed_options: ["off", "on"]` ขณะปฏิเสธค่าเหล่านั้น
บน `/v1/chat/completions`; OpenClaw จะทำให้รูปแบบการค้นพบแบบไบนารีนั้นเป็นมาตรฐานเป็น
`none`, `minimal`, `low`, `medium`, `high` และ `xhigh` ก่อนส่งคำขอ
การกำหนดค่า LM Studio ที่บันทึกไว้เก่ากว่าซึ่งมีแมป reasoning `off`/`on`
จะถูกทำให้เป็นมาตรฐานในแบบเดียวกันเมื่อโหลดแค็ตตาล็อก

### การกำหนดค่าอย่างชัดเจน

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

## การแก้ปัญหา

### ตรวจไม่พบ LM Studio

ตรวจสอบให้แน่ใจว่า LM Studio กำลังทำงานอยู่ หากเปิดใช้การยืนยันตัวตน ให้ตั้งค่า `LM_API_TOKEN` ด้วย:

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

- ตรวจสอบว่า `LM_API_TOKEN` ตรงกับคีย์ที่กำหนดค่าไว้ใน LM Studio
- สำหรับรายละเอียดการตั้งค่าการยืนยันตัวตนของ LM Studio โปรดดู [การยืนยันตัวตนของ LM Studio](https://lmstudio.ai/docs/developer/core/authentication)
- หากเซิร์ฟเวอร์ของคุณไม่ต้องใช้การยืนยันตัวตน ให้เว้นคีย์ว่างไว้ระหว่างการตั้งค่า

### การโหลดโมเดลแบบ just-in-time

LM Studio รองรับการโหลดโมเดลแบบ just-in-time (JIT) ซึ่งโมเดลจะถูกโหลดเมื่อมีคำขอแรก โดยค่าเริ่มต้น OpenClaw จะโหลดโมเดลล่วงหน้าผ่านปลายทางโหลดดั้งเดิมของ LM Studio ซึ่งช่วยได้เมื่อปิดใช้ JIT หากต้องการให้ JIT, idle TTL และพฤติกรรม auto-evict ของ LM Studio เป็นผู้ดูแลวงจรชีวิตของโมเดล ให้ปิดใช้ขั้นตอนการโหลดล่วงหน้าของ OpenClaw:

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

ใช้ที่อยู่ที่เข้าถึงได้ของโฮสต์ LM Studio คง `/v1` ไว้ และตรวจสอบให้แน่ใจว่า LM Studio ถูก bind นอกเหนือจาก loopback บนเครื่องนั้น:

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

ต่างจากผู้ให้บริการทั่วไปที่เข้ากันได้กับ OpenAI, `lmstudio` จะเชื่อถือปลายทางภายในเครื่อง/ส่วนตัวที่กำหนดค่าไว้โดยอัตโนมัติสำหรับคำขอโมเดลที่มีการป้องกัน ID ผู้ให้บริการ loopback แบบกำหนดเอง เช่น `localhost` หรือ `127.0.0.1` ก็ได้รับความเชื่อถือโดยอัตโนมัติเช่นกัน สำหรับ ID ผู้ให้บริการแบบกำหนดเองบน LAN, tailnet หรือ DNS ส่วนตัว ให้ตั้งค่า `models.providers.<id>.request.allowPrivateNetwork: true` อย่างชัดเจน

## ที่เกี่ยวข้อง

- [การเลือกโมเดล](/th/concepts/model-providers)
- [Ollama](/th/providers/ollama)
- [โมเดลภายในเครื่อง](/th/gateway/local-models)
