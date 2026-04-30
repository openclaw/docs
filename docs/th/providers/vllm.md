---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw กับเซิร์ฟเวอร์ vLLM ในเครื่อง
    - คุณต้องการเอนด์พอยต์ /v1 ที่เข้ากันได้กับ OpenAI โดยใช้โมเดลของคุณเอง
summary: เรียกใช้ OpenClaw ด้วย vLLM (เซิร์ฟเวอร์ในเครื่องที่เข้ากันได้กับ OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-30T10:13:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: b638341b5138d085ed3fa781300216d5bae58b9d7e3a9edfe6cbdcdbc379c2ce
    source_path: providers/vllm.md
    workflow: 16
---

vLLM สามารถให้บริการโมเดลโอเพนซอร์ส (และโมเดลกำหนดเองบางส่วน) ผ่าน HTTP API ที่**เข้ากันได้กับ OpenAI** OpenClaw เชื่อมต่อกับ vLLM โดยใช้ API `openai-completions`

OpenClaw ยังสามารถ**ค้นหาอัตโนมัติ**โมเดลที่มีจาก vLLM ได้เมื่อคุณเลือกใช้ด้วย `VLLM_API_KEY` (ค่าใดก็ได้ใช้ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับ auth) และคุณไม่ได้กำหนดรายการ `models.providers.vllm` แบบชัดเจน

OpenClaw ถือว่า `vllm` เป็นผู้ให้บริการภายในเครื่องที่เข้ากันได้กับ OpenAI ซึ่งรองรับ
การนับการใช้งานแบบสตรีม ดังนั้นจำนวนโทเค็นสถานะ/บริบทจึงอัปเดตได้จาก
การตอบกลับ `stream_options.include_usage`

| คุณสมบัติ         | ค่า                                    |
| ---------------- | ---------------------------------------- |
| ID ผู้ให้บริการ      | `vllm`                                   |
| API              | `openai-completions` (เข้ากันได้กับ OpenAI) |
| Auth             | ตัวแปรสภาพแวดล้อม `VLLM_API_KEY`      |
| URL ฐานเริ่มต้น | `http://127.0.0.1:8000/v1`               |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    URL ฐานของคุณควรเปิดเผย endpoint `/v1` (เช่น `/v1/models`, `/v1/chat/completions`) โดยทั่วไป vLLM จะทำงานที่:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    ค่าใดก็ได้ใช้ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับ auth:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Select a model">
    แทนที่ด้วย ID โมเดล vLLM รายการหนึ่งของคุณ:

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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## การค้นหาโมเดล (ผู้ให้บริการโดยนัย)

เมื่อมีการตั้งค่า `VLLM_API_KEY` (หรือมีโปรไฟล์ auth อยู่) และคุณ**ไม่ได้**กำหนด `models.providers.vllm` OpenClaw จะ query:

```
GET http://127.0.0.1:8000/v1/models
```

และแปลง ID ที่ส่งกลับมาเป็นรายการโมเดล

<Note>
หากคุณตั้งค่า `models.providers.vllm` อย่างชัดเจน การค้นหาอัตโนมัติจะถูกข้าม และคุณต้องกำหนดโมเดลด้วยตนเอง
</Note>

## การกำหนดค่าอย่างชัดเจน (โมเดลแบบกำหนดเอง)

ใช้ config แบบชัดเจนเมื่อ:

- vLLM ทำงานบน host หรือ port อื่น
- คุณต้องการตรึงค่า `contextWindow` หรือ `maxTokens`
- เซิร์ฟเวอร์ของคุณต้องใช้ API key จริง (หรือคุณต้องการควบคุม headers)
- คุณเชื่อมต่อกับ endpoint vLLM ที่เป็น loopback ที่เชื่อถือได้, LAN หรือ Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
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

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Proxy-style behavior">
    vLLM จะถูกถือว่าเป็น backend `/v1` แบบ proxy ที่เข้ากันได้กับ OpenAI ไม่ใช่
    endpoint OpenAI แบบ native ซึ่งหมายความว่า:

    | พฤติกรรม | ใช้หรือไม่ |
    |----------|----------|
    | การจัดรูป request แบบ OpenAI native | ไม่ |
    | `service_tier` | ไม่ส่ง |
    | Responses `store` | ไม่ส่ง |
    | คำใบ้ prompt-cache | ไม่ส่ง |
    | การจัดรูป payload แบบเข้ากันได้กับ reasoning ของ OpenAI | ไม่ใช้ |
    | header การระบุที่มาของ OpenClaw แบบซ่อน | ไม่ถูกฉีดบน URL ฐานแบบกำหนดเอง |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    สำหรับโมเดล Qwen ที่ให้บริการผ่าน vLLM ให้ตั้งค่า
    `params.qwenThinkingFormat: "chat-template"` ในรายการโมเดลเมื่อ
    เซิร์ฟเวอร์คาดหวัง kwargs ของ chat-template สำหรับ Qwen OpenClaw จะ map `/think off` เป็น:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    ระดับ thinking ที่ไม่ใช่ `off` จะส่ง `enable_thinking: true` หาก endpoint ของคุณ
    คาดหวัง flag ระดับบนสุดแบบ DashScope แทน ให้ใช้
    `params.qwenThinkingFormat: "top-level"` เพื่อส่ง `enable_thinking` ที่
    root ของ request รองรับ `params.qwen_thinking_format` แบบ snake-case ด้วย

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    vLLM/Nemotron 3 สามารถใช้ kwargs ของ chat-template เพื่อควบคุมว่า reasoning จะ
    ถูกส่งกลับเป็น reasoning แบบซ่อนหรือข้อความคำตอบที่มองเห็นได้ เมื่อ session ของ OpenClaw
    ใช้ `vllm/nemotron-3-*` โดยปิด thinking Plugin vLLM ที่มาพร้อมกันจะส่ง:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    หากต้องการปรับแต่งค่าเหล่านี้ ให้ตั้งค่า `chat_template_kwargs` ภายใต้ params ของโมเดล
    หากคุณตั้งค่า `params.extra_body.chat_template_kwargs` ด้วย ค่านั้นจะมี
    ลำดับความสำคัญสุดท้าย เพราะ `extra_body` เป็นการ override body ของ request ขั้นสุดท้าย

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

  <Accordion title="Qwen tool calls appear as text">
    ก่อนอื่นให้ตรวจสอบว่า vLLM เริ่มต้นด้วย parser สำหรับ tool-call และ chat
    template ที่ถูกต้องสำหรับโมเดล ตัวอย่างเช่น vLLM ระบุเอกสารว่าใช้ `hermes` สำหรับโมเดล Qwen2.5
    และ `qwen3_xml` สำหรับโมเดล Qwen3-Coder

    อาการ:

    - Skills หรือเครื่องมือไม่ทำงานเลย
    - assistant พิมพ์ JSON/XML ดิบ เช่น `{"name":"read","arguments":...}`
    - vLLM ส่งคืน array `tool_calls` ว่างเมื่อ OpenClaw ส่ง
      `tool_choice: "auto"`

    ชุดผสม Qwen/vLLM บางรายการจะส่งคืนการเรียกใช้เครื่องมือแบบมีโครงสร้างเฉพาะเมื่อ
    request ใช้ `tool_choice: "required"` สำหรับรายการโมเดลเหล่านั้น ให้บังคับ
    field request ที่เข้ากันได้กับ OpenAI ด้วย `params.extra_body`:

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

    แทนที่ `Qwen-Qwen2.5-Coder-32B-Instruct` ด้วย id ที่ตรงกันจาก:

    ```bash
    openclaw models list --provider vllm
    ```

    คุณสามารถใช้ override เดียวกันจาก CLI ได้:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    นี่คือ workaround ด้านความเข้ากันได้ที่ต้องเลือกใช้เอง มันทำให้ทุก turn ของโมเดลที่มี
    เครื่องมือต้องเรียกใช้เครื่องมือ ดังนั้นให้ใช้เฉพาะกับรายการโมเดลภายในเครื่องที่แยกไว้
    ซึ่งยอมรับพฤติกรรมนั้นได้ อย่าใช้เป็นค่าเริ่มต้นทั่วโลกสำหรับโมเดล
    vLLM ทั้งหมด และอย่าใช้ proxy ที่แปลงข้อความใดๆ จาก
    assistant เป็นการเรียกใช้เครื่องมือที่รันได้แบบไม่ตรวจสอบ

  </Accordion>

  <Accordion title="Custom base URL">
    หากเซิร์ฟเวอร์ vLLM ของคุณทำงานบน host หรือ port ที่ไม่ใช่ค่าเริ่มต้น ให้ตั้งค่า `baseUrl` ใน config ผู้ให้บริการแบบชัดเจน:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
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
  <Accordion title="Slow first response or remote server timeout">
    สำหรับโมเดลภายในเครื่องขนาดใหญ่, host LAN ระยะไกล หรือลิงก์ tailnet ให้ตั้งค่า
    timeout ของ request ในขอบเขตผู้ให้บริการ:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` ใช้กับ HTTP request ของโมเดล vLLM เท่านั้น รวมถึง
    การตั้งค่าการเชื่อมต่อ, response headers, การสตรีม body และการ abort
    guarded-fetch โดยรวม ควรใช้วิธีนี้ก่อนเพิ่ม
    `agents.defaults.timeoutSeconds` ซึ่งควบคุมการทำงานทั้งหมดของ agent

  </Accordion>

  <Accordion title="Server not reachable">
    ตรวจสอบว่าเซิร์ฟเวอร์ vLLM กำลังทำงานและเข้าถึงได้:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    หากคุณเห็นข้อผิดพลาดการเชื่อมต่อ ให้ตรวจสอบ host, port และว่า vLLM เริ่มต้นด้วยโหมดเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI
    สำหรับ endpoint แบบ loopback ชัดเจน, LAN หรือ Tailscale ให้ตั้งค่า
    `models.providers.vllm.request.allowPrivateNetwork: true` ด้วย request ของผู้ให้บริการ
    จะบล็อก URL เครือข่ายส่วนตัวตามค่าเริ่มต้น เว้นแต่ผู้ให้บริการจะ
    ได้รับความเชื่อถืออย่างชัดเจน

  </Accordion>

  <Accordion title="Auth errors on requests">
    หาก request ล้มเหลวด้วยข้อผิดพลาด auth ให้ตั้งค่า `VLLM_API_KEY` จริงที่ตรงกับการกำหนดค่าเซิร์ฟเวอร์ของคุณ หรือกำหนดค่าผู้ให้บริการอย่างชัดเจนภายใต้ `models.providers.vllm`

    <Tip>
    หากเซิร์ฟเวอร์ vLLM ของคุณไม่ได้บังคับ auth ค่าใดๆ ที่ไม่ว่างสำหรับ `VLLM_API_KEY` จะใช้เป็นสัญญาณเลือกใช้สำหรับ OpenClaw ได้
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    การค้นหาอัตโนมัติต้องตั้งค่า `VLLM_API_KEY` **และ** ไม่มีรายการ config `models.providers.vllm` แบบชัดเจน หากคุณกำหนดผู้ให้บริการด้วยตนเองแล้ว OpenClaw จะข้ามการค้นหาและใช้เฉพาะโมเดลที่คุณประกาศไว้
  </Accordion>

  <Accordion title="Tools render as raw text">
    หากโมเดล Qwen พิมพ์ syntax เครื่องมือ JSON/XML แทนการรัน Skill
    ให้ตรวจสอบคำแนะนำ Qwen ในการกำหนดค่าขั้นสูงด้านบน วิธีแก้ทั่วไปคือ:

    - เริ่ม vLLM ด้วย parser/template ที่ถูกต้องสำหรับโมเดลนั้น
    - ยืนยัน id โมเดลที่ตรงกันด้วย `openclaw models list --provider vllm`
    - เพิ่ม override `params.extra_body.tool_choice: "required"`
      แบบต่อโมเดลโดยเฉพาะ ก็ต่อเมื่อ `tool_choice: "auto"` ยังส่งคืน
      การเรียกใช้เครื่องมือว่างหรือเป็นข้อความเท่านั้น

  </Accordion>
</AccordionGroup>

<Warning>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [FAQ](/th/help/faq)
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, ref โมเดล และพฤติกรรม failover
  </Card>
  <Card title="OpenAI" href="/th/providers/openai" icon="bolt">
    ผู้ให้บริการ OpenAI แบบ native และพฤติกรรมเส้นทางที่เข้ากันได้กับ OpenAI
  </Card>
  <Card title="OAuth and auth" href="/th/gateway/authentication" icon="key">
    รายละเอียด auth และกฎการใช้ credential ซ้ำ
  </Card>
  <Card title="Troubleshooting" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาทั่วไปและวิธีแก้ไข
  </Card>
</CardGroup>
