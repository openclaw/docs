---
read_when:
    - คุณต้องการรัน OpenClaw ด้วยโมเดลโอเพนซอร์สผ่าน LM Studio
    - คุณต้องการตั้งค่าและกำหนดค่า LM Studio
summary: เรียกใช้ OpenClaw ด้วย LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-06-27T18:14:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20dff6e3156edf0e840c5450999bc511ba168b23692494c9030bfb946936ae40
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio เป็นแอปที่ใช้ง่ายแต่ทรงพลังสำหรับรันโมเดลแบบ open-weight บนฮาร์ดแวร์ของคุณเอง ช่วยให้คุณรันโมเดล llama.cpp (GGUF) หรือ MLX (Apple Silicon) ได้ มีให้ใช้งานทั้งแบบแพ็กเกจ GUI หรือเดมอนแบบไม่มีหน้าจอ (`llmster`) สำหรับเอกสารผลิตภัณฑ์และการตั้งค่า โปรดดู [lmstudio.ai](https://lmstudio.ai/)

## เริ่มต้นอย่างรวดเร็ว

1. ติดตั้ง LM Studio (เดสก์ท็อป) หรือ `llmster` (ไม่มีหน้าจอ) แล้วเริ่มเซิร์ฟเวอร์ในเครื่อง:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. เริ่มเซิร์ฟเวอร์

ตรวจสอบให้แน่ใจว่าคุณเริ่มแอปเดสก์ท็อป หรือรันเดมอนโดยใช้คำสั่งต่อไปนี้:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

หากคุณใช้แอป ตรวจสอบให้แน่ใจว่าเปิดใช้งาน JIT เพื่อให้ใช้งานได้ลื่นไหล เรียนรู้เพิ่มเติมใน [คู่มือ LM Studio JIT และ TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)

3. หากเปิดใช้งานการยืนยันตัวตนของ LM Studio ให้ตั้งค่า `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

หากปิดใช้งานการยืนยันตัวตนของ LM Studio คุณสามารถเว้นคีย์ API ว่างไว้ระหว่างการตั้งค่า OpenClaw แบบโต้ตอบได้

สำหรับรายละเอียดการตั้งค่าการยืนยันตัวตนของ LM Studio โปรดดู [การยืนยันตัวตนของ LM Studio](https://lmstudio.ai/docs/developer/core/authentication)

4. รันการเริ่มใช้งานและเลือก `LM Studio`:

```bash
openclaw onboard
```

5. ในการเริ่มใช้งาน ให้ใช้พรอมป์ `Default model` เพื่อเลือกโมเดล LM Studio ของคุณ

คุณยังสามารถตั้งค่าหรือเปลี่ยนภายหลังได้:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

คีย์โมเดลของ LM Studio ใช้รูปแบบ `author/model-name` (เช่น `qwen/qwen3.5-9b`) การอ้างอิงโมเดลของ OpenClaw
จะเติมชื่อผู้ให้บริการไว้ข้างหน้า: `lmstudio/qwen/qwen3.5-9b` คุณสามารถค้นหาคีย์ที่แน่นอนของ
โมเดลได้โดยรัน `curl http://localhost:1234/api/v1/models` แล้วดูที่ฟิลด์ `key`

## การเริ่มใช้งานแบบไม่โต้ตอบ

ใช้การเริ่มใช้งานแบบไม่โต้ตอบเมื่อคุณต้องการเขียนสคริปต์สำหรับการตั้งค่า (CI, การจัดเตรียมระบบ, การบูตสแตรประยะไกล):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

หรือระบุ URL ฐาน, โมเดล และคีย์ API เสริม:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` รับคีย์โมเดลตามที่ LM Studio ส่งคืน (เช่น `qwen/qwen3.5-9b`) โดยไม่รวม
คำนำหน้าผู้ให้บริการ `lmstudio/`

สำหรับเซิร์ฟเวอร์ LM Studio ที่ต้องยืนยันตัวตน ให้ส่ง `--lmstudio-api-key` หรือตั้งค่า `LM_API_TOKEN`
สำหรับเซิร์ฟเวอร์ LM Studio ที่ไม่ต้องยืนยันตัวตน ให้ละคีย์ไว้ OpenClaw จะจัดเก็บตัวทำเครื่องหมายในเครื่องที่ไม่ใช่ความลับ

`--custom-api-key` ยังคงรองรับเพื่อความเข้ากันได้ แต่แนะนำให้ใช้ `--lmstudio-api-key` สำหรับ LM Studio

คำสั่งนี้จะเขียน `models.providers.lmstudio` และตั้งค่าโมเดลเริ่มต้นเป็น
`lmstudio/<custom-model-id>` เมื่อคุณระบุคีย์ API การตั้งค่าจะเขียนโปรไฟล์การยืนยันตัวตน
`lmstudio:default` ด้วย

การตั้งค่าแบบโต้ตอบสามารถถามความยาวบริบทการโหลดที่ต้องการแบบไม่บังคับ และนำไปใช้กับโมเดล LM Studio ที่ค้นพบซึ่งบันทึกลงใน config
config ของ Plugin LM Studio เชื่อถือ endpoint ของ LM Studio ที่กำหนดค่าไว้สำหรับคำขอโมเดล รวมถึง loopback, LAN และโฮสต์ tailnet ต้นทางแบบ metadata/link-local ยังคงต้องเลือกใช้อย่างชัดเจน คุณสามารถเลือกไม่ใช้ได้โดยตั้งค่า `models.providers.lmstudio.request.allowPrivateNetwork: false`

## การกำหนดค่า

### ความเข้ากันได้ของการใช้งานแบบสตรีมมิง

LM Studio เข้ากันได้กับการใช้งานแบบสตรีมมิง เมื่อไม่ได้ส่งออบเจ็กต์
`usage` ที่มีรูปแบบแบบ OpenAI ออกมา OpenClaw จะกู้จำนวนโทเค็นจากเมตาดาต้าแบบ llama.cpp
`timings.prompt_n` / `timings.predicted_n` แทน

พฤติกรรมการใช้งานแบบสตรีมมิงเดียวกันนี้ใช้กับแบ็กเอนด์ในเครื่องที่เข้ากันได้กับ OpenAI เหล่านี้:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### ความเข้ากันได้ของการคิด

เมื่อการค้นพบ `/api/v1/models` ของ LM Studio รายงานตัวเลือกการใช้เหตุผลเฉพาะโมเดล
OpenClaw จะแสดงค่า `reasoning_effort` ที่เข้ากันได้กับ OpenAI ที่ตรงกัน
ในเมตาดาต้าความเข้ากันได้ของโมเดล บิลด์ LM Studio ปัจจุบันสามารถประกาศตัวเลือก UI แบบไบนารี
เช่น `allowed_options: ["off", "on"]` แต่ปฏิเสธค่าเหล่านั้น
บน `/v1/chat/completions`; OpenClaw จะปรับรูปแบบการค้นพบแบบไบนารีนั้นให้เป็น
`none`, `minimal`, `low`, `medium`, `high` และ `xhigh` ก่อนส่งคำขอ
config LM Studio ที่บันทึกไว้จากเวอร์ชันเก่าซึ่งมีแมปการใช้เหตุผล `off`/`on`
จะถูกปรับรูปแบบด้วยวิธีเดียวกันเมื่อโหลดแค็ตตาล็อก

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

ตรวจสอบให้แน่ใจว่า LM Studio กำลังทำงานอยู่ หากเปิดใช้งานการยืนยันตัวตน ให้ตั้งค่า `LM_API_TOKEN` ด้วย:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

ตรวจสอบว่าเข้าถึง API ได้:

```bash
curl http://localhost:1234/api/v1/models
```

### ข้อผิดพลาดการยืนยันตัวตน (HTTP 401)

หากการตั้งค่ารายงาน HTTP 401 ให้ตรวจสอบคีย์ API ของคุณ:

- ตรวจสอบว่า `LM_API_TOKEN` ตรงกับคีย์ที่กำหนดค่าไว้ใน LM Studio
- สำหรับรายละเอียดการตั้งค่าการยืนยันตัวตนของ LM Studio โปรดดู [การยืนยันตัวตนของ LM Studio](https://lmstudio.ai/docs/developer/core/authentication)
- หากเซิร์ฟเวอร์ของคุณไม่ต้องการการยืนยันตัวตน ให้เว้นคีย์ว่างไว้ระหว่างการตั้งค่า

### การโหลดโมเดลแบบทันเวลาพอดี

LM Studio รองรับการโหลดโมเดลแบบทันเวลาพอดี (JIT) ซึ่งโมเดลจะถูกโหลดเมื่อมีคำขอแรก โดยค่าเริ่มต้น OpenClaw จะโหลดโมเดลล่วงหน้าผ่าน endpoint การโหลดดั้งเดิมของ LM Studio ซึ่งช่วยได้เมื่อปิดใช้งาน JIT หากต้องการให้ JIT, TTL เมื่อไม่ได้ใช้งาน และพฤติกรรมการไล่ออกอัตโนมัติของ LM Studio เป็นผู้ดูแลวงจรชีวิตโมเดล ให้ปิดขั้นตอนการโหลดล่วงหน้าของ OpenClaw:

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

ใช้ที่อยู่ที่เข้าถึงได้ของโฮสต์ LM Studio คง `/v1` ไว้ และตรวจสอบให้แน่ใจว่า LM Studio ถูกผูกให้เข้าถึงได้เกินกว่า loopback บนเครื่องนั้น:

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

`lmstudio` จะเชื่อถือ endpoint ในเครื่อง/ส่วนตัวที่กำหนดค่าไว้โดยอัตโนมัติสำหรับคำขอโมเดลที่มีการป้องกัน รายการผู้ให้บริการแบบกำหนดเอง/ในเครื่องที่เข้ากันได้กับ OpenAI จะเชื่อถือต้นทาง `baseUrl` ที่กำหนดค่าไว้ตรงกันเช่นกัน ยกเว้นต้นทางแบบ metadata/link-local; คำขอไปยังพอร์ตหรือปลายทางส่วนตัวอื่นยังคงต้องใช้ `models.providers.<id>.request.allowPrivateNetwork: true` ตั้งค่า `models.providers.<id>.request.allowPrivateNetwork: false` เพื่อเลือกไม่ใช้ความเชื่อถือต้นทางที่ตรงกัน

## ที่เกี่ยวข้อง

- [การเลือกโมเดล](/th/concepts/model-providers)
- [Ollama](/th/providers/ollama)
- [โมเดลในเครื่อง](/th/gateway/local-models)
