---
read_when:
    - คุณต้องการให้ OpenClaw ทำงานกับเซิร์ฟเวอร์ vLLM ภายในเครื่อง
    - คุณต้องการใช้เอนด์พอยต์ `/v1` ที่เข้ากันได้กับ OpenAI กับโมเดลของคุณเอง
summary: เรียกใช้ OpenClaw กับ vLLM (เซิร์ฟเวอร์ภายในเครื่องที่เข้ากันได้กับ OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-26T11:40:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf424cb532f2b3e188c39545b187e5db6274ff2fadc01c9e4cb0901dbe9824c
    source_path: providers/vllm.md
    workflow: 15
---

vLLM สามารถให้บริการโมเดลโอเพนซอร์ส (และบางโมเดลแบบกำหนดเอง) ผ่าน HTTP API ที่**เข้ากันได้กับ OpenAI** OpenClaw เชื่อมต่อกับ vLLM โดยใช้ API `openai-completions`

OpenClaw ยังสามารถ**ค้นหาโมเดลที่พร้อมใช้งานโดยอัตโนมัติ**จาก vLLM ได้เมื่อคุณเปิดใช้ด้วย `VLLM_API_KEY` (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับใช้การยืนยันตัวตน) และคุณไม่ได้กำหนดรายการ `models.providers.vllm` แบบชัดเจน

OpenClaw ถือว่า `vllm` เป็นผู้ให้บริการแบบ OpenAI-compatible ภายในเครื่องที่รองรับ
การรายงานการใช้งานแบบสตรีม ดังนั้นจำนวนโทเค็นสถานะ/บริบทจึงสามารถอัปเดตได้จาก
การตอบกลับ `stream_options.include_usage`

| คุณสมบัติ         | ค่า                                      |
| ---------------- | ---------------------------------------- |
| รหัสผู้ให้บริการ  | `vllm`                                   |
| API              | `openai-completions` (เข้ากันได้กับ OpenAI) |
| การยืนยันตัวตน    | ตัวแปรสภาพแวดล้อม `VLLM_API_KEY`        |
| base URL เริ่มต้น | `http://127.0.0.1:8000/v1`               |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="เริ่ม vLLM ด้วยเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI">
    base URL ของคุณควรเปิดให้ใช้งานเอนด์พอยต์ `/v1` (เช่น `/v1/models`, `/v1/chat/completions`) โดยทั่วไป vLLM มักทำงานที่:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="ตั้งค่าตัวแปรสภาพแวดล้อมของ API key">
    ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับใช้การยืนยันตัวตน:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="เลือกโมเดล">
    แทนที่ด้วยหนึ่งในรหัสโมเดล vLLM ของคุณ:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## การค้นหาโมเดล (ผู้ให้บริการแบบนัย)

เมื่อมีการตั้งค่า `VLLM_API_KEY` (หรือมีโปรไฟล์การยืนยันตัวตนอยู่) และคุณ**ไม่ได้**กำหนด `models.providers.vllm` OpenClaw จะเรียกใช้:

```
GET http://127.0.0.1:8000/v1/models
```

และแปลงรหัสที่ส่งกลับให้เป็นรายการโมเดล

<Note>
หากคุณตั้งค่า `models.providers.vllm` แบบชัดเจน การค้นหาอัตโนมัติจะถูกข้ามไป และคุณต้องกำหนดโมเดลด้วยตนเอง
</Note>

## การกำหนดค่าแบบชัดเจน (กำหนดโมเดลเอง)

ใช้การกำหนดค่าแบบชัดเจนเมื่อ:

- vLLM ทำงานบนโฮสต์หรือพอร์ตอื่น
- คุณต้องการตรึงค่า `contextWindow` หรือ `maxTokens`
- เซิร์ฟเวอร์ของคุณต้องใช้ API key จริง (หรือคุณต้องการควบคุม headers)
- คุณเชื่อมต่อกับเอนด์พอยต์ vLLM ที่เป็น local loopback, LAN หรือ Tailscale ที่เชื่อถือได้

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
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
    vLLM ถูกมองว่าเป็นแบ็กเอนด์ `/v1` แบบ OpenAI-compatible สไตล์พร็อกซี ไม่ใช่
    เอนด์พอยต์ OpenAI แบบเนทีฟ ซึ่งหมายความว่า:

    | พฤติกรรม | ใช้หรือไม่ |
    |----------|----------|
    | การจัดรูปแบบคำขอ OpenAI แบบเนทีฟ | ไม่ |
    | `service_tier` | ไม่ถูกส่ง |
    | การตอบกลับ `store` | ไม่ถูกส่ง |
    | คำใบ้ prompt-cache | ไม่ถูกส่ง |
    | การจัดรูปแบบ payload เพื่อรองรับ reasoning ของ OpenAI | ไม่ถูกใช้ |
    | hidden headers สำหรับ attribution ของ OpenClaw | ไม่ถูกแทรกบน base URL แบบกำหนดเอง |

  </Accordion>

  <Accordion title="ตัวควบคุมการคิดของ Nemotron 3">
    vLLM/Nemotron 3 สามารถใช้ chat-template kwargs เพื่อควบคุมว่าจะส่ง reasoning
    กลับมาเป็น reasoning ที่ซ่อนอยู่หรือเป็นข้อความคำตอบที่มองเห็นได้ เมื่อเซสชัน OpenClaw
    ใช้ `vllm/nemotron-3-*` โดยปิดการคิดไว้ OpenClaw จะส่ง:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    หากต้องการปรับแต่งค่าเหล่านี้ ให้ตั้งค่า `chat_template_kwargs` ภายใต้พารามิเตอร์ของโมเดล
    หากคุณตั้งค่า `params.extra_body.chat_template_kwargs` ด้วย ค่านั้นจะมี
    ลำดับความสำคัญสูงสุด เนื่องจาก `extra_body` เป็นการ override request body ขั้นสุดท้าย

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="base URL แบบกำหนดเอง">
    หากเซิร์ฟเวอร์ vLLM ของคุณทำงานบนโฮสต์หรือพอร์ตที่ไม่ใช่ค่าเริ่มต้น ให้ตั้งค่า `baseUrl` ในการกำหนดค่าผู้ให้บริการแบบชัดเจน:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่สามารถเข้าถึงเซิร์ฟเวอร์ได้">
    ตรวจสอบว่าเซิร์ฟเวอร์ vLLM กำลังทำงานและสามารถเข้าถึงได้:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    หากคุณเห็นข้อผิดพลาดการเชื่อมต่อ ให้ตรวจสอบโฮสต์ พอร์ต และตรวจสอบว่า vLLM เริ่มต้นด้วยโหมดเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI
    สำหรับเอนด์พอยต์ loopback, LAN หรือ Tailscale แบบชัดเจน ให้ตั้งค่า
    `models.providers.vllm.request.allowPrivateNetwork: true` ด้วย โดยค่าเริ่มต้นคำขอของผู้ให้บริการ
    จะบล็อก URL เครือข่ายส่วนตัว เว้นแต่ผู้ให้บริการนั้นจะถูกเชื่อถืออย่างชัดเจน

  </Accordion>

  <Accordion title="คำขอเกิดข้อผิดพลาดด้านการยืนยันตัวตน">
    หากคำขอล้มเหลวด้วยข้อผิดพลาดด้านการยืนยันตัวตน ให้ตั้งค่า `VLLM_API_KEY` จริงที่ตรงกับการกำหนดค่าเซิร์ฟเวอร์ของคุณ หรือกำหนดค่าผู้ให้บริการแบบชัดเจนภายใต้ `models.providers.vllm`

    <Tip>
    หากเซิร์ฟเวอร์ vLLM ของคุณไม่ได้บังคับใช้การยืนยันตัวตน ค่าใดก็ได้ที่ไม่ว่างสำหรับ `VLLM_API_KEY` จะใช้เป็นสัญญาณเปิดใช้สำหรับ OpenClaw ได้
    </Tip>

  </Accordion>

  <Accordion title="ไม่พบโมเดล">
    การค้นหาอัตโนมัติต้องมีการตั้งค่า `VLLM_API_KEY` **และ**ไม่มีรายการกำหนดค่า `models.providers.vllm` แบบชัดเจน หากคุณกำหนดผู้ให้บริการด้วยตนเอง OpenClaw จะข้ามการค้นหาและใช้เฉพาะโมเดลที่คุณประกาศไว้เท่านั้น
  </Accordion>
</AccordionGroup>

<Warning>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับสำรอง
  </Card>
  <Card title="OpenAI" href="/th/providers/openai" icon="bolt">
    ผู้ให้บริการ OpenAI แบบเนทีฟและพฤติกรรมเส้นทางแบบ OpenAI-compatible
  </Card>
  <Card title="OAuth and auth" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและวิธีแก้ไข
  </Card>
</CardGroup>
