---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw กับเซิร์ฟเวอร์ inferrs ภายในเครื่อง
    - คุณกำลังให้บริการ Gemma หรือโมเดลอื่นผ่าน inferrs
    - คุณต้องใช้แฟล็กความเข้ากันได้ของ OpenClaw ที่แน่นอนสำหรับ inferrs
summary: เรียกใช้ OpenClaw ผ่าน inferrs (เซิร์ฟเวอร์ภายในเครื่องที่เข้ากันได้กับ OpenAI)
title: อนุมาน
x-i18n:
    generated_at: "2026-05-06T09:28:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 216783689527229835acf4f0fb6d2981d1915bd5df28e631b5384c4cbb9ee158
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) สามารถให้บริการโมเดลภายในเครื่องอยู่เบื้องหลัง API `/v1` ที่เข้ากันได้กับ OpenAI OpenClaw ทำงานกับ `inferrs` ผ่านเส้นทาง `openai-completions` ทั่วไป

| คุณสมบัติ           | ค่า                                                              |
| ------------------ | ------------------------------------------------------------------ |
| รหัสผู้ให้บริการ        | `inferrs` (กำหนดเอง; กำหนดค่าภายใต้ `models.providers.inferrs`)     |
| Plugin             | ไม่มี — `inferrs` ไม่ใช่ Plugin ผู้ให้บริการ OpenClaw ที่รวมมาในชุด         |
| ตัวแปรสภาพแวดล้อมสำหรับการตรวจสอบสิทธิ์       | ไม่บังคับ ค่าใดก็ใช้ได้หากเซิร์ฟเวอร์ inferrs ของคุณไม่มีการตรวจสอบสิทธิ์       |
| API                | เข้ากันได้กับ OpenAI (`openai-completions`)                           |
| URL ฐานที่แนะนำ | `http://127.0.0.1:8080/v1` (หรือที่ใดก็ตามที่เซิร์ฟเวอร์ inferrs ของคุณอยู่) |

<Note>
  ปัจจุบันควรมอง `inferrs` เป็นแบ็กเอนด์ที่โฮสต์เองและเข้ากันได้กับ OpenAI แบบกำหนดเอง ไม่ใช่ Plugin ผู้ให้บริการ OpenClaw โดยเฉพาะ คุณกำหนดค่าผ่าน `models.providers.inferrs` แทนแฟล็กตัวเลือกสำหรับการเริ่มต้นใช้งาน หากคุณต้องการ Plugin ที่รวมมาในชุดจริงพร้อมการค้นพบอัตโนมัติ โปรดดู [SGLang](/th/providers/sglang) หรือ [vLLM](/th/providers/vllm)
</Note>

## เริ่มต้นใช้งาน

<Steps>
  <Step title="เริ่ม inferrs ด้วยโมเดล">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="ตรวจสอบว่าเข้าถึงเซิร์ฟเวอร์ได้">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="เพิ่มรายการผู้ให้บริการ OpenClaw">
    เพิ่มรายการผู้ให้บริการอย่างชัดเจนและชี้โมเดลเริ่มต้นของคุณไปยังรายการนั้น ดูตัวอย่างการกำหนดค่าแบบเต็มด้านล่าง
  </Step>
</Steps>

## ตัวอย่างการกำหนดค่าแบบเต็ม

ตัวอย่างนี้ใช้ Gemma 4 บนเซิร์ฟเวอร์ `inferrs` ภายในเครื่อง

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

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="เหตุใด requiresStringContent จึงสำคัญ">
    เส้นทาง Chat Completions บางส่วนของ `inferrs` ยอมรับเฉพาะ
    `messages[].content` ที่เป็นสตริง ไม่ใช่อาร์เรย์ส่วนเนื้อหาแบบมีโครงสร้าง

    <Warning>
    หากการรัน OpenClaw ล้มเหลวพร้อมข้อผิดพลาด เช่น:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    ให้ตั้งค่า `compat.requiresStringContent: true` ในรายการโมเดลของคุณ
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw จะแปลงส่วนเนื้อหาข้อความล้วนให้เป็นสตริงธรรมดาก่อนส่ง
    คำขอ

  </Accordion>

  <Accordion title="ข้อควรระวังเกี่ยวกับ Gemma และ schema เครื่องมือ">
    การผสมผสาน `inferrs` + Gemma บางชุดในปัจจุบันยอมรับคำขอ
    `/v1/chat/completions` ขนาดเล็กโดยตรง แต่ยังคงล้มเหลวในเทิร์น
    runtime ของเอเจนต์ OpenClaw แบบเต็ม

    หากเกิดขึ้น ให้ลองวิธีนี้ก่อน:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    การตั้งค่านี้จะปิดใช้พื้นผิว schema เครื่องมือของ OpenClaw สำหรับโมเดล และสามารถลดแรงกดดันของพรอมป์
    ต่อแบ็กเอนด์ภายในเครื่องที่เข้มงวดกว่าได้

    หากคำขอขนาดเล็กโดยตรงยังทำงานได้ แต่เทิร์นเอเจนต์ OpenClaw ปกติยังคง
    ขัดข้องภายใน `inferrs` ปัญหาที่เหลือมักเป็นพฤติกรรมของโมเดล/เซิร์ฟเวอร์
    ต้นทาง มากกว่าชั้นการขนส่งของ OpenClaw

  </Accordion>

  <Accordion title="การทดสอบ smoke แบบแมนนวล">
    เมื่อกำหนดค่าแล้ว ให้ทดสอบทั้งสองชั้น:

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

    หากคำสั่งแรกทำงานแต่คำสั่งที่สองล้มเหลว ให้ตรวจสอบส่วนการแก้ไขปัญหาด้านล่าง

  </Accordion>

  <Accordion title="พฤติกรรมแบบพร็อกซี">
    `inferrs` จะถูกมองเป็นแบ็กเอนด์ `/v1` ที่เข้ากันได้กับ OpenAI แบบพร็อกซี ไม่ใช่
    ปลายทาง OpenAI แบบเนทีฟ

    - การปรับรูปแบบคำขอเฉพาะ OpenAI แบบเนทีฟไม่มีผลที่นี่
    - ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มีคำใบ้ prompt-cache และไม่มี
      การปรับรูปแบบเพย์โหลดสำหรับความเข้ากันได้กับการให้เหตุผลของ OpenAI
    - ส่วนหัวการระบุแหล่งที่มาของ OpenClaw ที่ซ่อนอยู่ (`originator`, `version`, `User-Agent`)
      จะไม่ถูกแทรกใน URL ฐาน `inferrs` แบบกำหนดเอง

  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="curl /v1/models ล้มเหลว">
    `inferrs` ไม่ได้ทำงานอยู่ เข้าถึงไม่ได้ หรือไม่ได้ผูกกับ
    โฮสต์/พอร์ตที่คาดไว้ ตรวจสอบให้แน่ใจว่าเซิร์ฟเวอร์เริ่มทำงานแล้วและกำลังฟังอยู่ที่ที่อยู่ที่คุณ
    กำหนดค่าไว้
  </Accordion>

  <Accordion title="messages[].content คาดว่าจะเป็นสตริง">
    ตั้งค่า `compat.requiresStringContent: true` ในรายการโมเดล ดูรายละเอียดในส่วน
    `requiresStringContent` ด้านบน
  </Accordion>

  <Accordion title="การเรียก /v1/chat/completions โดยตรงผ่าน แต่ openclaw infer model run ล้มเหลว">
    ลองตั้งค่า `compat.supportsTools: false` เพื่อปิดใช้พื้นผิว schema เครื่องมือ
    ดูข้อควรระวังเกี่ยวกับ schema เครื่องมือของ Gemma ด้านบน
  </Accordion>

  <Accordion title="inferrs ยังขัดข้องเมื่อเทิร์นเอเจนต์ใหญ่ขึ้น">
    หาก OpenClaw ไม่พบข้อผิดพลาด schema แล้ว แต่ `inferrs` ยังขัดข้องเมื่อเทิร์น
    เอเจนต์ใหญ่ขึ้น ให้ถือว่าเป็นข้อจำกัดของ `inferrs` ต้นทางหรือโมเดล ลด
    แรงกดดันของพรอมป์ หรือเปลี่ยนไปใช้แบ็กเอนด์หรือโมเดลภายในเครื่องอื่น
  </Accordion>
</AccordionGroup>

<Tip>
สำหรับความช่วยเหลือทั่วไป โปรดดู [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="โมเดลภายในเครื่อง" href="/th/gateway/local-models" icon="server">
    การรัน OpenClaw กับเซิร์ฟเวอร์โมเดลภายในเครื่อง
  </Card>
  <Card title="การแก้ไขปัญหา Gateway" href="/th/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    การดีบักแบ็กเอนด์ภายในเครื่องที่เข้ากันได้กับ OpenAI ซึ่งผ่าน probe แต่ล้มเหลวเมื่อรันเอเจนต์
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ตัวสำรอง
  </Card>
</CardGroup>
