---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw ด้วยโมเดลโอเพนซอร์สผ่าน LM Studio
    - คุณต้องการติดตั้งและกำหนดค่า LM Studio
summary: เรียกใช้ OpenClaw ด้วย LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-16T19:40:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21129dad2f1bf53fcf9474db2393fce7642b82f4f22e1770d9788547f08eca7f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio เรียกใช้โมเดล llama.cpp (GGUF) หรือ MLX ภายในเครื่อง โดยเป็นแอป GUI หรือดีมอนแบบไม่มีส่วนติดต่อ `llmster`
สำหรับเอกสารการติดตั้งและผลิตภัณฑ์ โปรดดู [lmstudio.ai](https://lmstudio.ai/)

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้งและเริ่มเซิร์ฟเวอร์">
    ติดตั้ง LM Studio (เดสก์ท็อป) หรือ `llmster` (ไม่มีส่วนติดต่อ) จากนั้นเริ่มเซิร์ฟเวอร์:

    ```bash
    lms server start --port 1234
    ```

    หรือเรียกใช้ดีมอนแบบไม่มีส่วนติดต่อ:

    ```bash
    lms daemon up
    ```

    หากใช้แอปเดสก์ท็อป ให้เปิดใช้ JIT เพื่อให้โหลดโมเดลได้อย่างราบรื่น โปรดดู
    [คู่มือ JIT และ TTL ของ LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)

  </Step>
  <Step title="ตั้งค่าคีย์ API หากเปิดใช้การยืนยันตัวตน">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    หากปิดใช้การยืนยันตัวตนของ LM Studio ให้เว้นคีย์ API ว่างไว้ระหว่างการตั้งค่า โปรดดู
    [การยืนยันตัวตนของ LM Studio](https://lmstudio.ai/docs/developer/core/authentication)

  </Step>
  <Step title="ดำเนินการเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard
    ```

    เลือก `LM Studio` จากนั้นเลือกโมเดลเมื่อมีข้อความแจ้ง `Default model`

    ในการตั้งค่าแบบมีคำแนะนำครั้งใหม่ OpenClaw จะค้นหา `/api/v1/models` บนโฮสต์
    LM Studio เริ่มต้นหรือที่กำหนดค่าไว้ก่อน โดยจะเสนอ LLM ที่มีอยู่ผ่านลำดับขั้นตอนการตั้งค่า
    CLI/macOS เดียวกัน และตรวจสอบด้วยการสร้างคำตอบจริงก่อนบันทึกการกำหนดค่า
    การตรวจสอบอัตโนมัติจะไม่ดาวน์โหลดโมเดล และจะข้ามรายการแค็ตตาล็อกที่รองรับเฉพาะ embedding

  </Step>
</Steps>

เปลี่ยนโมเดลเริ่มต้นภายหลัง:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

คีย์โมเดลของ LM Studio ใช้รูปแบบ `author/model-name` (เช่น `qwen/qwen3.5-9b`) ส่วนการอ้างอิงโมเดลของ OpenClaw
จะเติมผู้ให้บริการไว้ข้างหน้า: `lmstudio/qwen/qwen3.5-9b` ค้นหาคีย์ที่ถูกต้องของโมเดลได้โดยเรียกใช้
คำสั่งด้านล่างแล้วดูฟิลด์ `key`:

```bash
curl http://localhost:1234/api/v1/models
```

## การเริ่มต้นใช้งานแบบไม่โต้ตอบ

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

หรือระบุ URL ฐาน โมเดล และคีย์ API อย่างชัดเจน:

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
คำนำหน้าผู้ให้บริการ `lmstudio/` ส่ง `--lmstudio-api-key` (หรือตั้งค่า `LM_API_TOKEN`) สำหรับเซิร์ฟเวอร์
ที่มีการยืนยันตัวตน หากเซิร์ฟเวอร์ไม่มีการยืนยันตัวตนให้ละเว้นค่านี้ แล้ว OpenClaw จะจัดเก็บเครื่องหมายภายในเครื่อง
ที่ไม่ใช่ข้อมูลลับแทน ระบบยังยอมรับ `--custom-api-key` เพื่อความเข้ากันได้ แต่แนะนำให้ใช้ `--lmstudio-api-key`

การดำเนินการนี้จะเขียน `models.providers.lmstudio` และตั้งโมเดลเริ่มต้นเป็น `lmstudio/<custom-model-id>`
การระบุคีย์ API จะเขียนโปรไฟล์การยืนยันตัวตน `lmstudio:default` ด้วย

การตั้งค่าแบบโต้ตอบยังสามารถถามความยาวบริบทที่ต้องการสำหรับการโหลด และนำค่านั้นไปใช้กับ
โมเดลที่ค้นพบทั้งหมดซึ่งบันทึกลงในการกำหนดค่า

## การกำหนดค่า

### ความเข้ากันได้ของข้อมูลการใช้งานแบบสตรีม

LM Studio ไม่ได้ส่งออบเจ็กต์ `usage` ที่มีรูปแบบตาม OpenAI ในการตอบกลับแบบสตรีมเสมอไป OpenClaw
จึงกู้คืนจำนวนโทเค็นจากข้อมูลเมตาแบบ llama.cpp ได้แก่ `timings.prompt_n` / `timings.predicted_n`
แทน ปลายทางที่เข้ากันได้กับ OpenAI ซึ่งระบบระบุว่าเป็นปลายทางภายในเครื่อง (โฮสต์ loopback) จะใช้
กลไกสำรองเดียวกันนี้ ซึ่งครอบคลุมแบ็กเอนด์ภายในเครื่องอื่นๆ เช่น vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
และ text-generation-webui

### ความเข้ากันได้ของการคิดวิเคราะห์

เมื่อการค้นหา `/api/v1/models` ของ LM Studio รายงานตัวเลือกการให้เหตุผลเฉพาะโมเดล OpenClaw
จะแสดงค่า `reasoning_effort` ที่ตรงกัน (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) ใน
ข้อมูลเมตาความเข้ากันได้ของโมเดล LM Studio บางบิลด์แสดงตัวเลือก UI แบบสองสถานะ (`allowed_options: ["off",
"on"]`) แต่ปฏิเสธค่าตรงตัวเหล่านั้นใน `/v1/chat/completions` โดย OpenClaw จะปรับ
รูปแบบสองสถานะดังกล่าวให้เป็นมาตราส่วนหกระดับก่อนส่งคำขอ รวมถึงการกำหนดค่าเก่าที่บันทึกไว้
ซึ่งยังคงมีแมปการให้เหตุผล `off`/`on`

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

### การปิดใช้การโหลดล่วงหน้า

LM Studio รองรับการโหลดโมเดลแบบทันเวลาพอดี (JIT) ซึ่งจะโหลดโมเดลเมื่อได้รับคำขอแรก โดยค่าเริ่มต้น OpenClaw
จะโหลดโมเดลล่วงหน้าผ่านปลายทางการโหลดแบบเนทีฟของ LM Studio ซึ่งช่วยได้เมื่อปิดใช้ JIT
หากต้องการให้ JIT, TTL เมื่อไม่มีการใช้งาน และการนำโมเดลออกอัตโนมัติของ LM Studio เป็นผู้จัดการวงจรชีวิตโมเดลแทน
ให้ปิดขั้นตอนการโหลดล่วงหน้าของ OpenClaw:

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

### โฮสต์ LAN หรือ tailnet

ใช้ที่อยู่ที่เข้าถึงได้ของโฮสต์ LM Studio คงค่า `/v1` ไว้ และตรวจสอบว่า LM Studio ผูกกับ
อินเทอร์เฟซอื่นนอกเหนือจาก loopback บนเครื่องนั้น:

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

`lmstudio` จะเชื่อถือปลายทางที่กำหนดค่าไว้โดยอัตโนมัติสำหรับคำขอโมเดล รวมถึงโฮสต์ loopback,
LAN และ tailnet (ยกเว้นต้นทางข้อมูลเมตา/link-local) รายการผู้ให้บริการแบบกำหนดเอง/ภายในเครื่อง
ที่เข้ากันได้กับ OpenAI จะได้รับความเชื่อถือต้นทางตรงกันแบบเดียวกันทุกประการ ส่วนคำขอไปยังโฮสต์ส่วนตัว
หรือพอร์ตอื่นยังคงต้องใช้ `models.providers.<id>.request.allowPrivateNetwork: true` ให้ตั้งค่าเป็น `false` หากต้องการยกเลิก
ความเชื่อถือเริ่มต้น

## การแก้ไขปัญหา

### ตรวจไม่พบ LM Studio

ตรวจสอบว่า LM Studio กำลังทำงานอยู่:

```bash
lms server start --port 1234
```

หากเปิดใช้การยืนยันตัวตน ให้ตั้งค่า `LM_API_TOKEN` ด้วย ตรวจสอบว่าเข้าถึง API ได้:

```bash
curl http://localhost:1234/api/v1/models
```

### ข้อผิดพลาดในการยืนยันตัวตน (HTTP 401)

- ตรวจสอบว่า `LM_API_TOKEN` ตรงกับคีย์ที่กำหนดค่าไว้ใน LM Studio
- โปรดดู [การยืนยันตัวตนของ LM Studio](https://lmstudio.ai/docs/developer/core/authentication)
- หากเซิร์ฟเวอร์ไม่ต้องมีการยืนยันตัวตน ให้เว้นคีย์ว่างไว้ระหว่างการตั้งค่า

## ที่เกี่ยวข้อง

- [การเลือกโมเดล](/th/concepts/model-providers)
- [Ollama](/th/providers/ollama)
- [โมเดลภายในเครื่อง](/th/gateway/local-models)
