---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw กับโมเดลโอเพนซอร์สผ่าน LM Studio
    - คุณต้องการติดตั้งและกำหนดค่า LM Studio
summary: เรียกใช้ OpenClaw ด้วย LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-12T16:39:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio เรียกใช้โมเดล llama.cpp (GGUF) หรือ MLX ภายในเครื่อง โดยทำงานเป็นแอป GUI หรือดีมอน `llmster`
แบบไม่มีส่วนติดต่อผู้ใช้ สำหรับเอกสารการติดตั้งและผลิตภัณฑ์ โปรดดูที่ [lmstudio.ai](https://lmstudio.ai/)

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้งและเริ่มเซิร์ฟเวอร์">
    ติดตั้ง LM Studio (เดสก์ท็อป) หรือ `llmster` (แบบไม่มีส่วนติดต่อผู้ใช้) จากนั้นเริ่มเซิร์ฟเวอร์:

    ```bash
    lms server start --port 1234
    ```

    หรือเรียกใช้ดีมอนแบบไม่มีส่วนติดต่อผู้ใช้:

    ```bash
    lms daemon up
    ```

    หากใช้แอปเดสก์ท็อป ให้เปิดใช้ JIT เพื่อให้การโหลดโมเดลราบรื่น โปรดดู
    [คู่มือ JIT และ TTL ของ LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)

  </Step>
  <Step title="ตั้งค่าคีย์ API หากเปิดใช้การยืนยันตัวตน">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    หากปิดใช้การยืนยันตัวตนของ LM Studio ให้เว้นคีย์ API ว่างไว้ระหว่างการตั้งค่า โปรดดู
    [การยืนยันตัวตนของ LM Studio](https://lmstudio.ai/docs/developer/core/authentication)

  </Step>
  <Step title="เรียกใช้การเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard
    ```

    เลือก `LM Studio` จากนั้นเลือกโมเดลเมื่อระบบแจ้ง `Default model`

  </Step>
</Steps>

เปลี่ยนโมเดลเริ่มต้นในภายหลัง:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

คีย์โมเดลของ LM Studio ใช้รูปแบบ `author/model-name` (เช่น `qwen/qwen3.5-9b`) ส่วนการอ้างอิงโมเดลของ OpenClaw
จะเติมผู้ให้บริการไว้ข้างหน้า: `lmstudio/qwen/qwen3.5-9b` ค้นหาคีย์ที่แน่นอนของโมเดลโดยเรียกใช้
คำสั่งด้านล่างและดูฟิลด์ `key`:

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
ที่ต้องยืนยันตัวตน สำหรับเซิร์ฟเวอร์ที่ไม่ต้องยืนยันตัวตนให้ละเว้นค่านี้ แล้ว OpenClaw จะจัดเก็บเครื่องหมาย
ภายในเครื่องที่ไม่ใช่ข้อมูลลับแทน ระบบยังคงรองรับ `--custom-api-key` เพื่อความเข้ากันได้ แต่แนะนำให้ใช้
`--lmstudio-api-key`

การดำเนินการนี้จะเขียนค่า `models.providers.lmstudio` และตั้งโมเดลเริ่มต้นเป็น `lmstudio/<custom-model-id>`
การระบุคีย์ API จะเขียนโปรไฟล์การยืนยันตัวตน `lmstudio:default` ด้วย

การตั้งค่าแบบโต้ตอบอาจถามเพิ่มเติมเกี่ยวกับความยาวบริบทการโหลดที่ต้องการ และนำค่านั้นไปใช้กับ
โมเดลที่ค้นพบซึ่งบันทึกลงในการกำหนดค่า

## การกำหนดค่า

### ความเข้ากันได้ของข้อมูลการใช้งานแบบสตรีม

LM Studio ไม่ได้ส่งออบเจ็กต์ `usage` ในรูปแบบของ OpenAI สำหรับการตอบกลับแบบสตรีมเสมอไป OpenClaw
จะกู้คืนจำนวนโทเค็นจากเมทาดาทารูปแบบ llama.cpp ได้แก่ `timings.prompt_n` / `timings.predicted_n`
แทน ปลายทางที่เข้ากันได้กับ OpenAI ซึ่งถูกระบุว่าเป็นปลายทางภายในเครื่อง (โฮสต์ local loopback) จะใช้
กลไกสำรองเดียวกัน ซึ่งครอบคลุมแบ็กเอนด์ภายในเครื่องอื่น ๆ เช่น vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
และ text-generation-webui

### ความเข้ากันได้ของการคิดวิเคราะห์

เมื่อการค้นหาผ่าน `/api/v1/models` ของ LM Studio รายงานตัวเลือกการใช้เหตุผลเฉพาะโมเดล OpenClaw
จะแสดงค่า `reasoning_effort` ที่สอดคล้องกัน (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) ใน
เมทาดาทาความเข้ากันได้ของโมเดล LM Studio บางรุ่นระบุตัวเลือก UI แบบสองค่า (`allowed_options: ["off",
"on"]`) แต่ปฏิเสธค่าตรงตัวเหล่านั้นบน `/v1/chat/completions` OpenClaw จึงปรับรูปแบบสองค่านี้
ให้เป็นมาตราส่วนหกระดับก่อนส่งคำขอ รวมถึงการกำหนดค่าที่บันทึกไว้จากรุ่นเก่าซึ่งยังมีแมปการใช้เหตุผล
`off`/`on`

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

LM Studio รองรับการโหลดโมเดลแบบทันเวลาพอดี (JIT) โดยโหลดโมเดลเมื่อมีคำขอครั้งแรก ตามค่าเริ่มต้น OpenClaw
จะโหลดโมเดลล่วงหน้าผ่านปลายทางการโหลดแบบเนทีฟของ LM Studio ซึ่งมีประโยชน์เมื่อปิดใช้ JIT
หากต้องการให้ JIT, TTL เมื่อไม่มีการใช้งาน และพฤติกรรมการนำโมเดลออกโดยอัตโนมัติของ LM Studio
เป็นผู้จัดการวงจรชีวิตของโมเดลแทน ให้ปิดขั้นตอนการโหลดล่วงหน้าของ OpenClaw:

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

### โฮสต์ LAN หรือเครือข่าย tailnet

ใช้ที่อยู่ของโฮสต์ LM Studio ที่เข้าถึงได้ คง `/v1` ไว้ และตรวจสอบว่า LM Studio บนเครื่องนั้น
ผูกกับอินเทอร์เฟซอื่นนอกเหนือจาก loopback:

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

`lmstudio` จะเชื่อถือปลายทางที่กำหนดค่าไว้โดยอัตโนมัติสำหรับคำขอโมเดล ซึ่งรวมถึงโฮสต์ loopback,
LAN และ tailnet (ยกเว้นต้นทางเมทาดาทา/ลิงก์ภายในเครื่อง) รายการผู้ให้บริการที่กำหนดเอง/ภายในเครื่อง
ซึ่งเข้ากันได้กับ OpenAI จะได้รับความเชื่อถือตามต้นทางที่ตรงกันทุกประการเช่นเดียวกัน คำขอไปยังโฮสต์
หรือพอร์ตส่วนตัวอื่นยังคงต้องใช้ `models.providers.<id>.request.allowPrivateNetwork: true`
ให้ตั้งค่าเป็น `false` หากไม่ต้องการใช้ความเชื่อถือเริ่มต้นนี้

## การแก้ไขปัญหา

### ตรวจไม่พบ LM Studio

ตรวจสอบว่า LM Studio กำลังทำงานอยู่:

```bash
lms server start --port 1234
```

หากเปิดใช้การยืนยันตัวตน ให้ตั้งค่า `LM_API_TOKEN` ด้วย ตรวจสอบว่าสามารถเข้าถึง API ได้:

```bash
curl http://localhost:1234/api/v1/models
```

### ข้อผิดพลาดในการยืนยันตัวตน (HTTP 401)

- ตรวจสอบว่า `LM_API_TOKEN` ตรงกับคีย์ที่กำหนดค่าใน LM Studio
- โปรดดู [การยืนยันตัวตนของ LM Studio](https://lmstudio.ai/docs/developer/core/authentication)
- หากเซิร์ฟเวอร์ไม่ต้องการการยืนยันตัวตน ให้เว้นคีย์ว่างไว้ระหว่างการตั้งค่า

## เนื้อหาที่เกี่ยวข้อง

- [การเลือกโมเดล](/th/concepts/model-providers)
- [Ollama](/th/providers/ollama)
- [โมเดลภายในเครื่อง](/th/gateway/local-models)
