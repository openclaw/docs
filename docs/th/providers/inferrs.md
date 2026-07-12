---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw กับเซิร์ฟเวอร์ inferrs ภายในเครื่อง
    - คุณกำลังให้บริการ Gemma หรือโมเดลอื่นผ่าน inferrs
    - คุณต้องใช้แฟล็กความเข้ากันได้ของ OpenClaw ที่ตรงตามข้อกำหนดสำหรับ inferrs
summary: เรียกใช้ OpenClaw ผ่าน inferrs (เซิร์ฟเวอร์ภายในที่เข้ากันได้กับ OpenAI)
title: อนุมาน
x-i18n:
    generated_at: "2026-07-12T16:35:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) ให้บริการโมเดลภายในเครื่องผ่าน API `/v1` ที่เข้ากันได้กับ OpenAI โดย OpenClaw สื่อสารกับระบบนี้ผ่านอะแดปเตอร์ทั่วไป `openai-completions`

| คุณสมบัติ           | ค่า                                                                |
| ------------------ | -------------------------------------------------------------------- |
| รหัสผู้ให้บริการ        | `inferrs` (กำหนดเอง; กำหนดค่าภายใต้ `models.providers.inferrs`)       |
| Plugin             | ไม่มี — ไม่ใช่ Plugin ผู้ให้บริการที่รวมมากับ OpenClaw                        |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน       | ไม่จำเป็น; ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ inferrs ของคุณไม่มีการยืนยันตัวตน    |
| API                | เข้ากันได้กับ OpenAI (`openai-completions`)                             |
| URL ฐานที่แนะนำ | `http://127.0.0.1:8080/v1` (หรือตำแหน่งใดก็ตามที่เซิร์ฟเวอร์ inferrs ของคุณรับฟังอยู่) |

<Note>
  `inferrs` เป็นแบ็กเอนด์ที่โฮสต์เองและเข้ากันได้กับ OpenAI แบบกำหนดเอง ไม่ใช่ Plugin ผู้ให้บริการเฉพาะของ OpenClaw: คุณต้องกำหนดค่าภายใต้ `models.providers.inferrs` แทนการเลือกตัวเลือกการยืนยันตัวตนระหว่างการเริ่มต้นใช้งาน สำหรับ Plugin ที่รวมมาให้และรองรับการค้นหาอัตโนมัติ โปรดดู [SGLang](/th/providers/sglang) หรือ [vLLM](/th/providers/vllm)
</Note>

## เริ่มต้นใช้งาน

<Steps>
  <Step title="เริ่ม inferrs พร้อมโมเดล">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="ตรวจสอบว่าสามารถเข้าถึงเซิร์ฟเวอร์ได้">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="เพิ่มรายการผู้ให้บริการ OpenClaw">
    เพิ่มรายการผู้ให้บริการอย่างชัดเจนและกำหนดให้โมเดลเริ่มต้นของคุณชี้ไปยังรายการนั้น ดูตัวอย่างการกำหนดค่าด้านล่าง
  </Step>
</Steps>

## ตัวอย่างการกำหนดค่าแบบเต็ม

Gemma 4 บนเซิร์ฟเวอร์ `inferrs` ภายในเครื่อง:

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## การเริ่มทำงานตามความต้องการ

OpenClaw สามารถเริ่ม `inferrs` ได้เองเฉพาะเมื่อเลือกโมเดล `inferrs/...` เท่านั้น เพิ่ม `localService` ลงในรายการผู้ให้บริการเดียวกัน:

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command` ต้องเป็นพาธแบบสัมบูรณ์ เรียกใช้ `which inferrs` บนโฮสต์ Gateway แล้วใช้พาธนั้น สำหรับรายละเอียดฟิลด์ทั้งหมด โปรดดู [บริการโมเดลภายในเครื่อง](/th/gateway/local-model-services)

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="เหตุผลที่ requiresStringContent มีความสำคัญ">
    เส้นทาง Chat Completions บางรายการของ `inferrs` ยอมรับเฉพาะ `messages[].content` ที่เป็นสตริงเท่านั้น ไม่ยอมรับอาร์เรย์ส่วนเนื้อหาแบบมีโครงสร้าง

    <Warning>
    หากการทำงานของ OpenClaw ล้มเหลวโดยแสดงข้อความ:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    ให้ตั้งค่า `compat.requiresStringContent: true` ในรายการโมเดล จากนั้น OpenClaw จะแปลงส่วนเนื้อหาที่เป็นข้อความล้วนให้เป็นสตริงธรรมดาก่อนส่งคำขอ
    </Warning>

  </Accordion>

  <Accordion title="ข้อควรระวังเกี่ยวกับ Gemma และสคีมาเครื่องมือ">
    การใช้งาน `inferrs` ร่วมกับ Gemma บางรูปแบบยอมรับคำขอโดยตรงขนาดเล็กไปยัง `/v1/chat/completions` แต่ล้มเหลวเมื่อประมวลผลรอบการทำงานเต็มรูปแบบของรันไทม์เอเจนต์ OpenClaw ให้ลองปิดพื้นผิวสคีมาเครื่องมือก่อน:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    วิธีนี้ช่วยลดภาระพรอมต์บนแบ็กเอนด์ภายในเครื่องที่เข้มงวดกว่า หากคำขอโดยตรงขนาดเล็กยังทำงานได้ แต่รอบการทำงานปกติของเอเจนต์ OpenClaw ยังคงทำให้ `inferrs` ขัดข้อง ให้ถือว่าเป็นข้อจำกัดของโมเดลหรือเซิร์ฟเวอร์ต้นทาง ไม่ใช่ปัญหาด้านการรับส่งข้อมูลของ OpenClaw

  </Accordion>

  <Accordion title="การทดสอบเบื้องต้นด้วยตนเอง">
    ทดสอบทั้งสองชั้นหลังจากกำหนดค่าแล้ว:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    หากคำสั่งแรกทำงานได้แต่คำสั่งที่สองล้มเหลว โปรดดูการแก้ไขปัญหาด้านล่าง

  </Accordion>

  <Accordion title="ลักษณะการทำงานแบบพร็อกซี">
    เนื่องจาก `inferrs` ใช้อะแดปเตอร์ทั่วไป `openai-completions` (ไม่ใช่ `openai-responses`) จึงไม่มีการปรับรูปแบบคำขอที่ใช้เฉพาะ OpenAI แบบเนทีฟ: ระบบจะไม่ส่ง `service_tier`, `store` ของ Responses, คำแนะนำแคชพรอมต์ หรือการปรับรูปแบบเพย์โหลดเพื่อความเข้ากันได้กับการให้เหตุผลของ OpenAI
  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="curl /v1/models ล้มเหลว">
    `inferrs` ไม่ได้ทำงาน ไม่สามารถเข้าถึงได้ หรือไม่ได้ผูกกับโฮสต์/พอร์ตที่คุณกำหนดค่าไว้ ตรวจสอบว่าเซิร์ฟเวอร์เริ่มทำงานแล้วและกำลังรับฟังบนที่อยู่นั้น
  </Accordion>

  <Accordion title="messages[].content ต้องเป็นสตริง">
    ตั้งค่า `compat.requiresStringContent: true` ในรายการโมเดล (ดูด้านบน)
  </Accordion>

  <Accordion title="การเรียก /v1/chat/completions โดยตรงสำเร็จ แต่ openclaw infer model run ล้มเหลว">
    ตั้งค่า `compat.supportsTools: false` เพื่อปิดพื้นผิวสคีมาเครื่องมือ (ดูข้อควรระวังเกี่ยวกับ Gemma ด้านบน)
  </Accordion>

  <Accordion title="inferrs ยังคงขัดข้องในรอบการทำงานขนาดใหญ่ของเอเจนต์">
    หากข้อผิดพลาดของสคีมาหายไปแล้ว แต่ `inferrs` ยังคงขัดข้องในรอบการทำงานขนาดใหญ่ของเอเจนต์ ให้ถือว่าเป็นข้อจำกัดของ `inferrs` หรือโมเดลต้นทาง ลดภาระพรอมต์หรือเปลี่ยนแบ็กเอนด์/โมเดล
  </Accordion>
</AccordionGroup>

<Tip>
สำหรับความช่วยเหลือทั่วไป โปรดดู [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Tip>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="โมเดลภายในเครื่อง" href="/th/gateway/local-models" icon="server">
    การใช้งาน OpenClaw กับเซิร์ฟเวอร์โมเดลภายในเครื่อง
  </Card>
  <Card title="บริการโมเดลภายในเครื่อง" href="/th/gateway/local-model-services" icon="play">
    การเริ่มเซิร์ฟเวอร์โมเดลภายในเครื่องตามความต้องการสำหรับผู้ให้บริการที่กำหนดค่าไว้
  </Card>
  <Card title="การแก้ไขปัญหา Gateway" href="/th/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    การแก้ไขข้อบกพร่องของแบ็กเอนด์ภายในเครื่องที่เข้ากันได้กับ OpenAI ซึ่งผ่านการตรวจสอบแต่ล้มเหลวเมื่อเรียกใช้เอเจนต์
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
</CardGroup>
