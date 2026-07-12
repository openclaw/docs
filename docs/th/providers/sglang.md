---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw กับเซิร์ฟเวอร์ SGLang ภายในเครื่อง
    - คุณต้องการปลายทาง `/v1` ที่เข้ากันได้กับ OpenAI สำหรับโมเดลของคุณเอง
summary: เรียกใช้ OpenClaw กับ SGLang (เซิร์ฟเวอร์ที่โฮสต์เองและเข้ากันได้กับ OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-07-12T16:39:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

SGLang ให้บริการโมเดลแบบโอเพนเวตผ่าน HTTP API ที่เข้ากันได้กับ OpenAI โดย OpenClaw เชื่อมต่อกับ SGLang ด้วยตระกูลผู้ให้บริการ `openai-completions` พร้อมการค้นหาโมเดลที่พร้อมใช้งานโดยอัตโนมัติ

| คุณสมบัติ                  | ค่า                                                        |
| ------------------------- | ------------------------------------------------------------ |
| รหัสผู้ให้บริการ               | `sglang`                                                     |
| Plugin                    | รวมมาให้แล้ว, `enabledByDefault: true`                            |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน              | `SGLANG_API_KEY` (ค่าใดก็ได้ที่ไม่ว่าง หากเซิร์ฟเวอร์ไม่มีการยืนยันตัวตน) |
| แฟล็กการเริ่มต้นใช้งาน           | `--auth-choice sglang`                                       |
| API                       | เข้ากันได้กับ OpenAI (`openai-completions`)                     |
| URL ฐานเริ่มต้น          | `http://127.0.0.1:30000/v1`                                  |
| ตัวยึดตำแหน่งโมเดลเริ่มต้น | `sglang/Qwen/Qwen3-8B`                                       |
| การใช้งานแบบสตรีมมิง           | ใช่ (`supportsStreamingUsage: true`)                         |
| การกำหนดราคา                   | ทำเครื่องหมายว่าไม่เสียค่าใช้จ่ายภายนอก (`modelPricing.external: false`)        |

นอกจากนี้ OpenClaw ยัง**ค้นหาโมเดลที่พร้อมใช้งานจาก SGLang โดยอัตโนมัติ**เมื่อคุณเลือกใช้ด้วย `SGLANG_API_KEY` ใช้ `sglang/*` ใน `agents.defaults.models` เพื่อให้การค้นหาเป็นแบบไดนามิกต่อไป เมื่อคุณกำหนด URL ฐานของ SGLang เองด้วย โปรดดู [การค้นหาโมเดล (ผู้ให้บริการโดยนัย)](#model-discovery-implicit-provider) ด้านล่าง

## เริ่มต้นใช้งาน

<Steps>
  <Step title="เริ่ม SGLang">
    เปิดใช้ SGLang พร้อมเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI URL ฐานของคุณควรเปิดเผย
    ปลายทาง `/v1` (เช่น `/v1/models`, `/v1/chat/completions`) โดยทั่วไป SGLang
    จะทำงานที่:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="ตั้งค่าคีย์ API">
    หากเซิร์ฟเวอร์ของคุณไม่ได้กำหนดค่าการยืนยันตัวตน สามารถใช้ค่าใดก็ได้:

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

เมื่อตั้งค่า `SGLANG_API_KEY` แล้ว (หรือมีโปรไฟล์การยืนยันตัวตนอยู่) และคุณ**ไม่ได้**
กำหนด `models.providers.sglang` OpenClaw จะเรียกค้น:

- `GET http://127.0.0.1:30000/v1/models`

และแปลงรหัสที่ส่งกลับมาเป็นรายการโมเดล

<Note>
หากคุณตั้งค่า `models.providers.sglang` อย่างชัดเจน OpenClaw จะใช้โมเดลที่คุณประกาศ
เป็นค่าเริ่มต้น เพิ่ม `"sglang/*": {}` ลงใน `agents.defaults.models` เมื่อคุณ
ต้องการให้ OpenClaw เรียกค้นปลายทาง `/models` ของผู้ให้บริการที่กำหนดค่านั้น และรวม
โมเดล SGLang ทั้งหมดที่ประกาศว่าพร้อมใช้งาน
</Note>

## การกำหนดค่าอย่างชัดเจน (โมเดลแบบกำหนดเอง)

ใช้การกำหนดค่าอย่างชัดเจนเมื่อ:

- SGLang ทำงานบนโฮสต์หรือพอร์ตอื่น
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
  <Accordion title="ลักษณะการทำงานแบบพร็อกซี">
    SGLang จะถูกปฏิบัติเป็นแบ็กเอนด์ `/v1` ที่เข้ากันได้กับ OpenAI ในลักษณะพร็อกซี ไม่ใช่
    ปลายทาง OpenAI แบบเนทีฟ

    | ลักษณะการทำงาน | SGLang |
    |----------|--------|
    | การปรับรูปแบบคำขอเฉพาะ OpenAI | ไม่ใช้ |
    | `service_tier`, `store` ของ Responses, คำแนะนำแคชพรอมต์ | ไม่ส่ง |
    | การปรับรูปแบบเพย์โหลดเพื่อความเข้ากันได้กับการให้เหตุผล | ไม่ใช้ |
    | ส่วนหัวการระบุแหล่งที่มาแบบซ่อน (`originator`, `version`, `User-Agent`) | ไม่แทรกใน URL ฐาน SGLang ที่กำหนดเอง |

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    **ไม่สามารถเข้าถึงเซิร์ฟเวอร์ได้**

    ตรวจสอบว่าเซิร์ฟเวอร์กำลังทำงานและตอบสนอง:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **ข้อผิดพลาดในการยืนยันตัวตน**

    หากคำขอล้มเหลวเนื่องจากข้อผิดพลาดในการยืนยันตัวตน ให้ตั้งค่า `SGLANG_API_KEY` จริงที่ตรงกับ
    การกำหนดค่าเซิร์ฟเวอร์ของคุณ หรือกำหนดค่าผู้ให้บริการอย่างชัดเจนภายใต้
    `models.providers.sglang`

    <Tip>
    หากคุณเรียกใช้ SGLang โดยไม่มีการยืนยันตัวตน ค่าใดก็ได้ที่ไม่ว่างสำหรับ
    `SGLANG_API_KEY` ก็เพียงพอสำหรับการเลือกใช้การค้นหาโมเดล
    </Tip>

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อเกิดความล้มเหลว
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าแบบเต็ม รวมถึงรายการผู้ให้บริการ
  </Card>
</CardGroup>
