---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw กับเซิร์ฟเวอร์ SGLang ในเครื่อง
    - คุณต้องการเอนด์พอยต์ /v1 ที่เข้ากันได้กับ OpenAI สำหรับโมเดลของคุณเอง
summary: เรียกใช้ OpenClaw กับ SGLang (เซิร์ฟเวอร์แบบโฮสต์เองที่เข้ากันได้กับ OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-05-06T09:29:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e65e38868e061e03d15348725971880ca503dc61a7425c1fbdc718fd684728f
    source_path: providers/sglang.md
    workflow: 16
---

SGLang ให้บริการโมเดล open-weight ผ่าน HTTP API ที่เข้ากันได้กับ OpenAI OpenClaw เชื่อมต่อกับ SGLang โดยใช้ตระกูลผู้ให้บริการ `openai-completions` พร้อมการค้นหาโมเดลที่มีอยู่โดยอัตโนมัติ

| คุณสมบัติ                  | ค่า                                                        |
| ------------------------- | ------------------------------------------------------------ |
| Provider id               | `sglang`                                                     |
| Plugin                    | รวมมาให้, `enabledByDefault: true`                            |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน              | `SGLANG_API_KEY` (ค่าใดก็ได้ที่ไม่ว่างหากเซิร์ฟเวอร์ไม่มีการยืนยันตัวตน) |
| แฟล็กการเริ่มต้นใช้งาน           | `--auth-choice sglang`                                       |
| API                       | เข้ากันได้กับ OpenAI (`openai-completions`)                     |
| URL ฐานเริ่มต้น          | `http://127.0.0.1:30000/v1`                                  |
| ตัวยึดตำแหน่งโมเดลเริ่มต้น | `sglang/Qwen/Qwen3-8B`                                       |
| การใช้งานแบบสตรีม           | ใช่ (`supportsStreamingUsage: true`)                         |
| ราคา                   | ทำเครื่องหมายเป็น external-free (`modelPricing.external: false`)        |

OpenClaw ยัง **ค้นหาโดยอัตโนมัติ** โมเดลที่มีอยู่จาก SGLang เมื่อคุณเลือกใช้ด้วย `SGLANG_API_KEY` และคุณไม่ได้กำหนดรายการ `models.providers.sglang` อย่างชัดเจน — ดู [การค้นหาโมเดล (ผู้ให้บริการโดยนัย)](#model-discovery-implicit-provider) ด้านล่าง

## เริ่มต้นใช้งาน

<Steps>
  <Step title="เริ่ม SGLang">
    เปิด SGLang ด้วยเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI URL ฐานของคุณควรเปิดเผย
    เอ็นด์พอยต์ `/v1` (เช่น `/v1/models`, `/v1/chat/completions`) โดยทั่วไป SGLang
    จะทำงานที่:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="ตั้งค่าคีย์ API">
    ค่าใดก็ได้ใช้ได้หากไม่มีการกำหนดค่าการยืนยันตัวตนบนเซิร์ฟเวอร์ของคุณ:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="เรียกใช้การเริ่มต้นใช้งานหรือตั้งค่าโมเดลโดยตรง">
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
กำหนด `models.providers.sglang` OpenClaw จะสอบถาม:

- `GET http://127.0.0.1:30000/v1/models`

และแปลง ID ที่ส่งกลับมาเป็นรายการโมเดล

<Note>
หากคุณตั้งค่า `models.providers.sglang` อย่างชัดเจน ระบบจะข้ามการค้นหาอัตโนมัติ และ
คุณต้องกำหนดโมเดลด้วยตนเอง
</Note>

## การกำหนดค่าอย่างชัดเจน (โมเดลแบบกำหนดเอง)

ใช้การกำหนดค่าอย่างชัดเจนเมื่อ:

- SGLang ทำงานบนโฮสต์/พอร์ตอื่น
- คุณต้องการปักหมุดค่า `contextWindow`/`maxTokens`
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
  <Accordion title="พฤติกรรมแบบพร็อกซี">
    SGLang จะถูกปฏิบัติเป็นแบ็กเอนด์ `/v1` ที่เข้ากันได้กับ OpenAI แบบพร็อกซี ไม่ใช่
    เอ็นด์พอยต์ OpenAI แบบเนทีฟ

    | พฤติกรรม | SGLang |
    |----------|--------|
    | การปรับรูปแบบคำขอเฉพาะ OpenAI | ไม่ถูกนำไปใช้ |
    | `service_tier`, Responses `store`, คำใบ้ prompt-cache | ไม่ถูกส่ง |
    | การปรับรูปแบบเพย์โหลดที่เข้ากันได้กับการให้เหตุผล | ไม่ถูกนำไปใช้ |
    | ส่วนหัวระบุแหล่งที่มาแบบซ่อน (`originator`, `version`, `User-Agent`) | ไม่ถูกฉีดบน URL ฐาน SGLang แบบกำหนดเอง |

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    **ไม่สามารถเข้าถึงเซิร์ฟเวอร์ได้**

    ตรวจสอบว่าเซิร์ฟเวอร์กำลังทำงานและตอบสนอง:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **ข้อผิดพลาดการยืนยันตัวตน**

    หากคำขอล้มเหลวด้วยข้อผิดพลาดการยืนยันตัวตน ให้ตั้งค่า `SGLANG_API_KEY` จริงที่ตรงกับ
    การกำหนดค่าเซิร์ฟเวอร์ของคุณ หรือกำหนดค่าผู้ให้บริการอย่างชัดเจนภายใต้
    `models.providers.sglang`

    <Tip>
    หากคุณเรียกใช้ SGLang โดยไม่มีการยืนยันตัวตน ค่าใดก็ได้ที่ไม่ว่างสำหรับ
    `SGLANG_API_KEY` ก็เพียงพอสำหรับการเลือกใช้การค้นหาโมเดล
    </Tip>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้สำรอง
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าฉบับเต็ม รวมถึงรายการผู้ให้บริการ
  </Card>
</CardGroup>
