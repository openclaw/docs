---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw กับเซิร์ฟเวอร์ vLLM ภายในเครื่อง
    - คุณต้องการปลายทาง /v1 ที่เข้ากันได้กับ OpenAI สำหรับโมเดลของคุณเอง
summary: รัน OpenClaw ด้วย vLLM (เซิร์ฟเวอร์ภายในเครื่องที่เข้ากันได้กับ OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-06-27T18:17:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

vLLM สามารถให้บริการโมเดลโอเพนซอร์ส (และโมเดลแบบกำหนดเองบางส่วน) ผ่าน HTTP API ที่**เข้ากันได้กับ OpenAI** OpenClaw เชื่อมต่อกับ vLLM โดยใช้ API `openai-completions`

OpenClaw ยังสามารถ**ค้นหาอัตโนมัติ**สำหรับโมเดลที่มีจาก vLLM ได้ เมื่อคุณเลือกใช้ด้วย `VLLM_API_KEY` (ค่าใดก็ได้ใช้ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับใช้การยืนยันตัวตน) ใช้ `vllm/*` ใน `agents.defaults.models` เพื่อให้การค้นหายังคงเป็นแบบไดนามิกเมื่อคุณกำหนดค่า URL พื้นฐานของ vLLM แบบกำหนดเองด้วย

OpenClaw ถือว่า `vllm` เป็นผู้ให้บริการภายในเครื่องที่เข้ากันได้กับ OpenAI ซึ่งรองรับ
การนับการใช้งานแบบสตรีม ดังนั้นจำนวนโทเค็นสถานะ/บริบทจึงสามารถอัปเดตจาก
การตอบกลับ `stream_options.include_usage` ได้

| คุณสมบัติ         | ค่า                                    |
| ---------------- | ---------------------------------------- |
| ID ผู้ให้บริการ      | `vllm`                                   |
| API              | `openai-completions` (เข้ากันได้กับ OpenAI) |
| การยืนยันตัวตน             | ตัวแปรสภาพแวดล้อม `VLLM_API_KEY`      |
| URL พื้นฐานเริ่มต้น | `http://127.0.0.1:8000/v1`               |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="เริ่ม vLLM ด้วยเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI">
    URL พื้นฐานของคุณควรเปิดเผยปลายทาง `/v1` (เช่น `/v1/models`, `/v1/chat/completions`) vLLM มักทำงานที่:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="ตั้งค่าตัวแปรสภาพแวดล้อมสำหรับคีย์ API">
    ค่าใดก็ได้ใช้ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับใช้การยืนยันตัวตน:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="เลือกโมเดล">
    แทนที่ด้วย ID โมเดล vLLM ของคุณรายการใดรายการหนึ่ง:

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

## การค้นหาโมเดล (ผู้ให้บริการโดยนัย)

เมื่อมีการตั้งค่า `VLLM_API_KEY` (หรือมีโปรไฟล์การยืนยันตัวตนอยู่แล้ว) และคุณ**ไม่ได้**กำหนด `models.providers.vllm` OpenClaw จะเรียกค้น:

```
GET http://127.0.0.1:8000/v1/models
```

แล้วแปลง ID ที่ส่งกลับมาเป็นรายการโมเดล

<Note>
หากคุณตั้งค่า `models.providers.vllm` อย่างชัดเจน OpenClaw จะใช้โมเดลที่คุณประกาศไว้ตามค่าเริ่มต้น เพิ่ม `"vllm/*": {}` ไปยัง `agents.defaults.models` เมื่อคุณต้องการให้ OpenClaw เรียกค้นปลายทาง `/models` ของผู้ให้บริการที่กำหนดค่านั้น และรวมโมเดล vLLM ทั้งหมดที่ประกาศไว้
</Note>

## การกำหนดค่าอย่างชัดเจน (โมเดลแบบกำหนดเอง)

ใช้การกำหนดค่าอย่างชัดเจนเมื่อ:

- vLLM ทำงานบนโฮสต์หรือพอร์ตอื่น
- คุณต้องการตรึงค่า `contextWindow` หรือ `maxTokens`
- เซิร์ฟเวอร์ของคุณต้องใช้คีย์ API จริง (หรือคุณต้องการควบคุมส่วนหัว)
- คุณเชื่อมต่อกับปลายทาง vLLM แบบลูปแบ็ก, LAN หรือ Tailscale ที่เชื่อถือได้

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
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

เพื่อให้ผู้ให้บริการนี้เป็นแบบไดนามิกโดยไม่ต้องระบุทุกโมเดลด้วยตนเอง ให้เพิ่ม
ไวลด์การ์ดของผู้ให้บริการไปยังแคตตาล็อกโมเดลที่มองเห็นได้:

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ลักษณะการทำงานแบบพร็อกซี">
    vLLM จะถูกถือเป็นแบ็กเอนด์ `/v1` แบบพร็อกซีที่เข้ากันได้กับ OpenAI ไม่ใช่ปลายทาง
    OpenAI แบบเนทีฟ ซึ่งหมายความว่า:

    | ลักษณะการทำงาน | ใช้หรือไม่ |
    |----------|----------|
    | การจัดรูปคำขอ OpenAI แบบเนทีฟ | ไม่ |
    | `service_tier` | ไม่ส่ง |
    | Responses `store` | ไม่ส่ง |
    | คำใบ้แคชพรอมป์ | ไม่ส่ง |
    | การจัดรูปเพย์โหลดความเข้ากันได้ด้านการใช้เหตุผลของ OpenAI | ไม่ใช้ |
    | ส่วนหัวการระบุแหล่งที่มาของ OpenClaw แบบซ่อน | ไม่ฉีดเข้าไปใน URL พื้นฐานแบบกำหนดเอง |

  </Accordion>

  <Accordion title="การควบคุมการคิดของ Qwen">
    สำหรับโมเดล Qwen ที่ให้บริการผ่าน vLLM ให้ตั้งค่า
    `compat.thinkingFormat: "qwen-chat-template"` บนแถวโมเดลของผู้ให้บริการที่กำหนดค่าไว้
    เมื่อเซิร์ฟเวอร์คาดหวัง kwargs ของเทมเพลตแชท Qwen โมเดล
    ที่กำหนดค่าด้วยวิธีนี้จะแสดงโปรไฟล์ `/think` แบบไบนารี (`off`, `on`) เพราะ
    การคิดของเทมเพลต Qwen เป็นแฟล็กคำขอแบบเปิด/ปิด ไม่ใช่บันไดระดับความพยายาม
    แบบ OpenAI

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw จับคู่ `/think off` เป็น:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    ระดับการคิดที่ไม่ใช่ `off` จะส่ง `enable_thinking: true` หากปลายทางของคุณ
    คาดหวังแฟล็กระดับบนสุดแบบ DashScope แทน ให้ใช้
    `compat.thinkingFormat: "qwen"` เพื่อส่ง `enable_thinking` ที่รากของคำขอ

  </Accordion>

  <Accordion title="การควบคุมการคิดของ Nemotron 3">
    vLLM/Nemotron 3 สามารถใช้ kwargs ของเทมเพลตแชทเพื่อควบคุมว่าจะส่งคืนการใช้เหตุผลเป็น
    การใช้เหตุผลแบบซ่อนหรือข้อความคำตอบที่มองเห็นได้ เมื่อเซสชัน OpenClaw
    ใช้ `vllm/nemotron-3-*` โดยปิดการคิด Plugin vLLM ที่รวมมาด้วยจะส่ง:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    หากต้องการปรับค่าเหล่านี้ ให้ตั้งค่า `chat_template_kwargs` ใต้พารามิเตอร์ของโมเดล
    หากคุณตั้งค่า `params.extra_body.chat_template_kwargs` ด้วย ค่านั้นจะมี
    ลำดับความสำคัญสุดท้าย เพราะ `extra_body` เป็นการแทนที่เนื้อหาคำขอรายการสุดท้าย

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

  <Accordion title="การเรียกใช้เครื่องมือของ Qwen แสดงเป็นข้อความ">
    ก่อนอื่นตรวจสอบให้แน่ใจว่า vLLM เริ่มต้นด้วยตัวแยกวิเคราะห์การเรียกใช้เครื่องมือและเทมเพลตแชท
    ที่ถูกต้องสำหรับโมเดล ตัวอย่างเช่น เอกสาร vLLM ระบุ `hermes` สำหรับโมเดล
    Qwen2.5 และ `qwen3_xml` สำหรับโมเดล Qwen3-Coder

    อาการ:

    - Skills หรือเครื่องมือไม่ทำงานเลย
    - ผู้ช่วยพิมพ์ JSON/XML ดิบ เช่น `{"name":"read","arguments":...}`
    - vLLM ส่งคืนอาร์เรย์ `tool_calls` ว่างเมื่อ OpenClaw ส่ง
      `tool_choice: "auto"`

    บางชุดผสมของ Qwen/vLLM จะส่งคืนการเรียกใช้เครื่องมือแบบมีโครงสร้างเฉพาะเมื่อ
    คำขอใช้ `tool_choice: "required"` สำหรับรายการโมเดลเหล่านั้น ให้บังคับฟิลด์คำขอ
    ที่เข้ากันได้กับ OpenAI ด้วย `params.extra_body`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    แทนที่ `Qwen-Qwen2.5-Coder-32B-Instruct` ด้วย ID ที่ตรงกันซึ่งส่งคืนโดย:

    ```bash
    openclaw models list --provider vllm
    ```

    คุณสามารถใช้การแทนที่เดียวกันจาก CLI ได้:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    นี่เป็นวิธีแก้ปัญหาความเข้ากันได้แบบเลือกใช้ ทำให้ทุกรอบของโมเดลที่มี
    เครื่องมือต้องมีการเรียกใช้เครื่องมือ ดังนั้นให้ใช้เฉพาะกับรายการโมเดลภายในเครื่อง
    แบบเฉพาะที่ยอมรับลักษณะการทำงานนั้นได้ อย่าใช้เป็นค่าเริ่มต้นส่วนกลางสำหรับโมเดล
    vLLM ทั้งหมด และอย่าใช้พร็อกซีที่แปลงข้อความผู้ช่วยใดๆ
    เป็นการเรียกใช้เครื่องมือที่เรียกใช้งานได้อย่างไม่ตรวจสอบ

  </Accordion>

  <Accordion title="URL พื้นฐานแบบกำหนดเอง">
    หากเซิร์ฟเวอร์ vLLM ของคุณทำงานบนโฮสต์หรือพอร์ตที่ไม่ใช่ค่าเริ่มต้น ให้ตั้งค่า `baseUrl` ในการกำหนดค่าผู้ให้บริการอย่างชัดเจน:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
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
  <Accordion title="การตอบกลับครั้งแรกช้าหรือเซิร์ฟเวอร์ระยะไกลหมดเวลา">
    สำหรับโมเดลภายในเครื่องขนาดใหญ่ โฮสต์ LAN ระยะไกล หรือลิงก์ tailnet ให้ตั้งค่า
    การหมดเวลาของคำขอในขอบเขตผู้ให้บริการ:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` ใช้กับคำขอ HTTP ของโมเดล vLLM เท่านั้น รวมถึง
    การตั้งค่าการเชื่อมต่อ ส่วนหัวการตอบกลับ การสตรีมเนื้อหา และการยกเลิก
    guarded-fetch โดยรวม ควรใช้สิ่งนี้ก่อนเพิ่ม
    `agents.defaults.timeoutSeconds` ซึ่งควบคุมการทำงานทั้งหมดของเอเจนต์

  </Accordion>

  <Accordion title="ติดต่อเซิร์ฟเวอร์ไม่ได้">
    ตรวจสอบว่าเซิร์ฟเวอร์ vLLM กำลังทำงานและเข้าถึงได้:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    หากคุณเห็นข้อผิดพลาดการเชื่อมต่อ ให้ตรวจสอบโฮสต์ พอร์ต และว่า vLLM เริ่มต้นด้วยโหมดเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI แล้ว
    สำหรับปลายทางแบบลูปแบ็ก, LAN หรือ Tailscale ที่ระบุอย่างชัดเจน OpenClaw จะเชื่อถือ
    ต้นทาง `models.providers.vllm.baseUrl` ที่กำหนดค่าไว้อย่างตรงกันสำหรับคำขอโมเดล
    ที่มีการป้องกัน ต้นทางเมทาดาทา/link-local ยังคงถูกบล็อกโดยไม่มีการ
    เลือกใช้อย่างชัดเจน ตั้งค่า `models.providers.vllm.request.allowPrivateNetwork: true` เฉพาะ
    เมื่อคำขอ vLLM ต้องเข้าถึงต้นทางส่วนตัวอื่น และตั้งค่าเป็น `false`
    เพื่อเลือกไม่ใช้ความเชื่อถือของต้นทางที่ตรงกัน

  </Accordion>

  <Accordion title="ข้อผิดพลาดการยืนยันตัวตนในคำขอ">
    หากคำขอล้มเหลวด้วยข้อผิดพลาดการยืนยันตัวตน ให้ตั้งค่า `VLLM_API_KEY` จริงที่ตรงกับการกำหนดค่าเซิร์ฟเวอร์ของคุณ หรือกำหนดค่าผู้ให้บริการอย่างชัดเจนใต้ `models.providers.vllm`

    <Tip>
    หากเซิร์ฟเวอร์ vLLM ของคุณไม่ได้บังคับใช้การยืนยันตัวตน ค่าใดๆ ที่ไม่ว่างสำหรับ `VLLM_API_KEY` จะใช้เป็นสัญญาณการเลือกใช้สำหรับ OpenClaw ได้
    </Tip>

  </Accordion>

  <Accordion title="ไม่พบโมเดล">
    การค้นหาอัตโนมัติต้องตั้งค่า `VLLM_API_KEY` หากคุณกำหนด `models.providers.vllm` ไว้แล้ว OpenClaw จะใช้เฉพาะโมเดลที่คุณประกาศไว้ เว้นแต่ `agents.defaults.models` จะมี `"vllm/*": {}`
  </Accordion>

  <Accordion title="เครื่องมือแสดงผลเป็นข้อความดิบ">
    หากโมเดล Qwen พิมพ์ไวยากรณ์เครื่องมือ JSON/XML แทนที่จะเรียกใช้ skill
    ให้ตรวจสอบคำแนะนำ Qwen ในการกำหนดค่าขั้นสูงด้านบน วิธีแก้ไขตามปกติคือ:

    - เริ่ม vLLM ด้วยตัวแยกวิเคราะห์/เทมเพลตที่ถูกต้องสำหรับโมเดลนั้น
    - ยืนยัน ID โมเดลที่ตรงกันด้วย `openclaw models list --provider vllm`
    - เพิ่มการแทนที่ `params.extra_body.tool_choice: "required"` ต่อโมเดลแบบเฉพาะ
      เฉพาะเมื่อ `tool_choice: "auto"` ยังส่งคืนการเรียกใช้เครื่องมือ
      ที่ว่างหรือเป็นข้อความเท่านั้น

  </Accordion>
</AccordionGroup>

<Warning>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับเมื่อเกิดความล้มเหลว
  </Card>
  <Card title="OpenAI" href="/th/providers/openai" icon="bolt">
    ผู้ให้บริการ OpenAI แบบเนทีฟและพฤติกรรมเส้นทางที่เข้ากันได้กับ OpenAI
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการใช้ข้อมูลประจำตัวซ้ำ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและวิธีแก้ไข
  </Card>
</CardGroup>
