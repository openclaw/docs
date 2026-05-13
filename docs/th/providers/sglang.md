---
read_when:
    - คุณต้องการใช้งาน OpenClaw กับเซิร์ฟเวอร์ SGLang ในเครื่อง
    - คุณต้องการเอนด์พอยต์ /v1 ที่เข้ากันได้กับ OpenAI สำหรับโมเดลของคุณเอง
summary: เรียกใช้ OpenClaw ด้วย SGLang (เซิร์ฟเวอร์แบบโฮสต์เองที่เข้ากันได้กับ OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-05-13T05:33:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd1a5954e3994e3640ee17c62acedc314716c3ed5e52528da436c36c077ebead
    source_path: providers/sglang.md
    workflow: 16
---

SGLang ให้บริการโมเดล open-weight ผ่าน API HTTP ที่เข้ากันได้กับ OpenAI OpenClaw เชื่อมต่อกับ SGLang โดยใช้ตระกูลผู้ให้บริการ `openai-completions` พร้อมการค้นหาโมเดลที่พร้อมใช้งานโดยอัตโนมัติ

| คุณสมบัติ                  | ค่า                                                        |
| ------------------------- | ------------------------------------------------------------ |
| ID ผู้ให้บริการ               | `sglang`                                                     |
| Plugin                    | รวมมาให้, `enabledByDefault: true`                            |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน              | `SGLANG_API_KEY` (ค่าใดก็ได้ที่ไม่ว่าง หากเซิร์ฟเวอร์ไม่มีการยืนยันตัวตน) |
| แฟล็กการเริ่มต้นใช้งาน           | `--auth-choice sglang`                                       |
| API                       | เข้ากันได้กับ OpenAI (`openai-completions`)                     |
| URL ฐานเริ่มต้น          | `http://127.0.0.1:30000/v1`                                  |
| ตัวยึดตำแหน่งโมเดลเริ่มต้น | `sglang/Qwen/Qwen3-8B`                                       |
| การใช้งานแบบสตรีม           | ใช่ (`supportsStreamingUsage: true`)                         |
| ราคา                   | ทำเครื่องหมายเป็นใช้งานภายนอกฟรี (`modelPricing.external: false`)        |

OpenClaw ยัง **ค้นหาโดยอัตโนมัติ** โมเดลที่พร้อมใช้งานจาก SGLang เมื่อคุณเลือกใช้ด้วย `SGLANG_API_KEY` ใช้ `sglang/*` ใน `agents.defaults.models` เพื่อให้การค้นหาเป็นแบบไดนามิกเมื่อคุณกำหนดค่า URL ฐาน SGLang แบบกำหนดเองด้วย ดู [การค้นหาโมเดล (ผู้ให้บริการโดยนัย)](#model-discovery-implicit-provider) ด้านล่าง

## เริ่มต้นใช้งาน

<Steps>
  <Step title="Start SGLang">
    เปิดใช้ SGLang พร้อมเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI URL ฐานของคุณควรเปิดเผย
    เอนด์พอยต์ `/v1` (เช่น `/v1/models`, `/v1/chat/completions`) โดยทั่วไป SGLang
    จะทำงานที่:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Set an API key">
    ค่าใดก็ใช้ได้หากไม่ได้กำหนดค่าการยืนยันตัวตนบนเซิร์ฟเวอร์ของคุณ:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Run onboarding or set a model directly">
    ```bash
    openclaw onboard
    ```

    หรือกำหนดค่าโมเดลด้วยตนเอง:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## การค้นหาโมเดล (ผู้ให้บริการโดยนัย)

เมื่อมีการตั้งค่า `SGLANG_API_KEY` (หรือมีโปรไฟล์การยืนยันตัวตนอยู่แล้ว) และคุณ **ไม่ได้**
กำหนด `models.providers.sglang` OpenClaw จะส่งคำขอไปที่:

- `GET http://127.0.0.1:30000/v1/models`

และแปลง ID ที่ส่งคืนเป็นรายการโมเดล

<Note>
หากคุณตั้งค่า `models.providers.sglang` อย่างชัดเจน OpenClaw จะใช้โมเดลที่คุณประกาศไว้
เป็นค่าเริ่มต้น เพิ่ม `"sglang/*": {}` ใน `agents.defaults.models` เมื่อคุณ
ต้องการให้ OpenClaw ส่งคำขอไปยังเอนด์พอยต์ `/models` ของผู้ให้บริการที่กำหนดค่าไว้นั้น และรวม
โมเดล SGLang ทั้งหมดที่ประกาศไว้
</Note>

## การกำหนดค่าอย่างชัดเจน (โมเดลแบบกำหนดเอง)

ใช้การกำหนดค่าอย่างชัดเจนเมื่อ:

- SGLang ทำงานบนโฮสต์/พอร์ตอื่น
- คุณต้องการตรึงค่า `contextWindow`/`maxTokens`
- เซิร์ฟเวอร์ของคุณต้องใช้คีย์ API จริง (หรือคุณต้องการควบคุมส่วนหัว)

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
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

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Proxy-style behavior">
    SGLang ถูกจัดการเป็นแบ็กเอนด์ `/v1` ที่เข้ากันได้กับ OpenAI แบบพร็อกซี ไม่ใช่
    เอนด์พอยต์ OpenAI แบบเนทีฟ

    | พฤติกรรม | SGLang |
    |----------|--------|
    | การจัดรูปแบบคำขอเฉพาะ OpenAI | ไม่ได้นำไปใช้ |
    | `service_tier`, Responses `store`, คำใบ้ prompt-cache | ไม่ส่ง |
    | การจัดรูปแบบเพย์โหลดที่เข้ากันได้กับ reasoning | ไม่ได้นำไปใช้ |
    | ส่วนหัวระบุแหล่งที่มาแบบซ่อน (`originator`, `version`, `User-Agent`) | ไม่ถูกแทรกใน URL ฐาน SGLang แบบกำหนดเอง |

  </Accordion>

  <Accordion title="Troubleshooting">
    **ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้**

    ตรวจสอบว่าเซิร์ฟเวอร์กำลังทำงานและตอบสนอง:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **ข้อผิดพลาดการยืนยันตัวตน**

    หากคำขอล้มเหลวด้วยข้อผิดพลาดการยืนยันตัวตน ให้ตั้งค่า `SGLANG_API_KEY` จริงที่ตรงกับ
    การกำหนดค่าเซิร์ฟเวอร์ของคุณ หรือกำหนดค่าผู้ให้บริการอย่างชัดเจนภายใต้
    `models.providers.sglang`

    <Tip>
    หากคุณรัน SGLang โดยไม่มีการยืนยันตัวตน ค่าใดก็ได้ที่ไม่ว่างสำหรับ
    `SGLANG_API_KEY` ก็เพียงพอสำหรับการเลือกใช้การค้นหาโมเดล
    </Tip>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับเมื่อเกิดความล้มเหลว
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าแบบเต็ม รวมถึงรายการผู้ให้บริการ
  </Card>
</CardGroup>
