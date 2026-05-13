---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw กับเซิร์ฟเวอร์ vLLM ภายในเครื่อง
    - คุณต้องการจุดปลายทาง /v1 ที่เข้ากันได้กับ OpenAI พร้อมโมเดลของคุณเอง
summary: เรียกใช้ OpenClaw ด้วย vLLM (เซิร์ฟเวอร์ในเครื่องที่เข้ากันได้กับ OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-05-13T05:33:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b58fc0694fa9629ae87b6958d1ab39e484d468e6f92346f39f55316dbc09a04
    source_path: providers/vllm.md
    workflow: 16
---

vLLM สามารถให้บริการโมเดลโอเพนซอร์ส (และโมเดลแบบกำหนดเองบางส่วน) ผ่าน HTTP API ที่ **เข้ากันได้กับ OpenAI** OpenClaw เชื่อมต่อกับ vLLM โดยใช้ API `openai-completions`

OpenClaw ยังสามารถ **ค้นหาอัตโนมัติ** โมเดลที่มีอยู่จาก vLLM ได้เมื่อคุณเลือกใช้ด้วย `VLLM_API_KEY` (ค่าใดก็ใช้ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับใช้การยืนยันตัวตน) ใช้ `vllm/*` ใน `agents.defaults.models` เพื่อให้การค้นหายังคงเป็นแบบไดนามิกเมื่อคุณกำหนดค่า URL ฐานของ vLLM แบบกำหนดเองด้วย

OpenClaw ถือว่า `vllm` เป็นผู้ให้บริการท้องถิ่นที่เข้ากันได้กับ OpenAI ซึ่งรองรับ
การนับการใช้งานแบบสตรีม ดังนั้นจำนวนโทเค็นของสถานะ/บริบทจึงสามารถอัปเดตจาก
การตอบกลับ `stream_options.include_usage` ได้

| คุณสมบัติ         | ค่า                                    |
| ---------------- | ---------------------------------------- |
| ID ผู้ให้บริการ      | `vllm`                                   |
| API              | `openai-completions` (เข้ากันได้กับ OpenAI) |
| การยืนยันตัวตน             | ตัวแปรสภาพแวดล้อม `VLLM_API_KEY`      |
| URL ฐานเริ่มต้น | `http://127.0.0.1:8000/v1`               |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="เริ่ม vLLM ด้วยเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI">
    URL ฐานของคุณควรเปิดเผยปลายทาง `/v1` (เช่น `/v1/models`, `/v1/chat/completions`) โดยทั่วไป vLLM ทำงานที่:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="ตั้งค่าตัวแปรสภาพแวดล้อมสำหรับคีย์ API">
    ค่าใดก็ใช้ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับใช้การยืนยันตัวตน:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="เลือกโมเดล">
    แทนที่ด้วย ID โมเดล vLLM ของคุณหนึ่งรายการ:

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

เมื่อมีการตั้งค่า `VLLM_API_KEY` (หรือมีโปรไฟล์การยืนยันตัวตนอยู่แล้ว) และคุณ **ไม่ได้** กำหนด `models.providers.vllm` OpenClaw จะเรียกค้น:

```
GET http://127.0.0.1:8000/v1/models
```

และแปลง ID ที่ส่งกลับมาเป็นรายการโมเดล

<Note>
หากคุณตั้งค่า `models.providers.vllm` อย่างชัดเจน OpenClaw จะใช้โมเดลที่คุณประกาศไว้เป็นค่าเริ่มต้น เพิ่ม `"vllm/*": {}` ลงใน `agents.defaults.models` เมื่อคุณต้องการให้ OpenClaw เรียกปลายทาง `/models` ของผู้ให้บริการที่กำหนดค่านั้น และรวมโมเดล vLLM ทั้งหมดที่ประกาศไว้
</Note>

## การกำหนดค่าอย่างชัดเจน (โมเดลแบบกำหนดเอง)

ใช้การกำหนดค่าอย่างชัดเจนเมื่อ:

- vLLM ทำงานบนโฮสต์หรือพอร์ตอื่น
- คุณต้องการตรึงค่า `contextWindow` หรือ `maxTokens`
- เซิร์ฟเวอร์ของคุณต้องใช้คีย์ API จริง (หรือคุณต้องการควบคุมส่วนหัว)
- คุณเชื่อมต่อกับปลายทาง vLLM ที่เป็น local loopback, LAN หรือ Tailscale ที่เชื่อถือได้

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

เพื่อให้ผู้ให้บริการนี้ยังคงเป็นแบบไดนามิกโดยไม่ต้องระบุทุกรายชื่อโมเดลด้วยตนเอง ให้เพิ่ม wildcard ของผู้ให้บริการ
ลงในแค็ตตาล็อกโมเดลที่มองเห็นได้:

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
  <Accordion title="พฤติกรรมแบบพร็อกซี">
    vLLM จะถูกมองเป็นแบ็กเอนด์ `/v1` ที่เข้ากันได้กับ OpenAI แบบพร็อกซี ไม่ใช่ปลายทาง
    OpenAI แบบเนทีฟ ซึ่งหมายความว่า:

    | พฤติกรรม | ใช้หรือไม่ |
    |----------|----------|
    | การจัดรูปคำขอ OpenAI แบบเนทีฟ | ไม่ |
    | `service_tier` | ไม่ส่ง |
    | Responses `store` | ไม่ส่ง |
    | คำแนะนำ prompt-cache | ไม่ส่ง |
    | การจัดรูป payload สำหรับ OpenAI reasoning-compat | ไม่ใช้ |
    | ส่วนหัวการระบุที่มาของ OpenClaw แบบซ่อน | ไม่ถูกฉีดบน URL ฐานแบบกำหนดเอง |

  </Accordion>

  <Accordion title="การควบคุมการคิดของ Qwen">
    สำหรับโมเดล Qwen ที่ให้บริการผ่าน vLLM ให้ตั้งค่า
    `params.qwenThinkingFormat: "chat-template"` ในรายการโมเดลเมื่อ
    เซิร์ฟเวอร์คาดหวัง kwargs ของ chat-template ของ Qwen OpenClaw จะแมป `/think off` เป็น:

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
    `params.qwenThinkingFormat: "top-level"` เพื่อส่ง `enable_thinking` ที่
    รากของคำขอ นอกจากนี้ยังยอมรับ `params.qwen_thinking_format` แบบ snake-case ด้วย

  </Accordion>

  <Accordion title="การควบคุมการคิดของ Nemotron 3">
    vLLM/Nemotron 3 สามารถใช้ kwargs ของ chat-template เพื่อควบคุมว่า reasoning จะถูก
    ส่งกลับเป็น reasoning แบบซ่อนหรือข้อความคำตอบที่มองเห็นได้ เมื่อเซสชัน OpenClaw
    ใช้ `vllm/nemotron-3-*` โดยปิดการคิด Plugin vLLM ที่มาพร้อมกันจะส่ง:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    หากต้องการปรับค่าเหล่านี้ ให้ตั้งค่า `chat_template_kwargs` ภายใต้ params ของโมเดล
    หากคุณตั้งค่า `params.extra_body.chat_template_kwargs` ด้วย ค่านั้นจะมี
    ลำดับความสำคัญสุดท้าย เนื่องจาก `extra_body` เป็นตัวเขียนทับ request-body ตัวสุดท้าย

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

  <Accordion title="การเรียกใช้เครื่องมือของ Qwen ปรากฏเป็นข้อความ">
    ก่อนอื่นตรวจสอบให้แน่ใจว่า vLLM เริ่มด้วยตัวแยกวิเคราะห์ tool-call และ chat
    template ที่ถูกต้องสำหรับโมเดล ตัวอย่างเช่น vLLM ระบุ `hermes` สำหรับโมเดล Qwen2.5
    และ `qwen3_xml` สำหรับโมเดล Qwen3-Coder

    อาการ:

    - skills หรือเครื่องมือไม่ทำงานเลย
    - ผู้ช่วยพิมพ์ JSON/XML ดิบ เช่น `{"name":"read","arguments":...}`
    - vLLM ส่งอาร์เรย์ `tool_calls` ว่างกลับมาเมื่อ OpenClaw ส่ง
      `tool_choice: "auto"`

    การผสมบางแบบของ Qwen/vLLM จะส่งคืนการเรียกใช้เครื่องมือแบบมีโครงสร้างเฉพาะเมื่อ
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

    แทนที่ `Qwen-Qwen2.5-Coder-32B-Instruct` ด้วย id ที่แน่นอนซึ่งส่งกลับโดย:

    ```bash
    openclaw models list --provider vllm
    ```

    คุณสามารถใช้การเขียนทับเดียวกันจาก CLI ได้:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    นี่เป็นวิธีแก้ไขความเข้ากันได้แบบเลือกใช้ ทำให้ทุก turn ของโมเดลที่มี
    เครื่องมือต้องมีการเรียกใช้เครื่องมือ ดังนั้นให้ใช้เฉพาะกับรายการโมเดลท้องถิ่นเฉพาะ
    ที่ยอมรับพฤติกรรมนั้นได้ อย่าใช้เป็นค่าเริ่มต้นทั่วโลกสำหรับโมเดล
    vLLM ทั้งหมด และอย่าใช้พร็อกซีที่แปลงข้อความผู้ช่วยใดๆ
    เป็นการเรียกใช้เครื่องมือที่สั่งทำงานได้อย่างไม่พิจารณา

  </Accordion>

  <Accordion title="URL ฐานแบบกำหนดเอง">
    หากเซิร์ฟเวอร์ vLLM ของคุณทำงานบนโฮสต์หรือพอร์ตที่ไม่ใช่ค่าเริ่มต้น ให้ตั้งค่า `baseUrl` ในการกำหนดค่าผู้ให้บริการอย่างชัดเจน:

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
  <Accordion title="การตอบกลับครั้งแรกช้า หรือเซิร์ฟเวอร์ระยะไกลหมดเวลา">
    สำหรับโมเดลท้องถิ่นขนาดใหญ่ โฮสต์ LAN ระยะไกล หรือลิงก์ tailnet ให้ตั้งค่า
    หมดเวลาคำขอตามขอบเขตผู้ให้บริการ:

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

    `timeoutSeconds` ใช้กับคำขอ HTTP ของโมเดล vLLM เท่านั้น รวมถึง
    การตั้งค่าการเชื่อมต่อ ส่วนหัวการตอบกลับ การสตรีม body และการยกเลิก
    guarded-fetch ทั้งหมด ควรใช้ค่านี้ก่อนเพิ่ม
    `agents.defaults.timeoutSeconds` ซึ่งควบคุมการรัน agent ทั้งหมด

  </Accordion>

  <Accordion title="ไม่สามารถเข้าถึงเซิร์ฟเวอร์">
    ตรวจสอบว่าเซิร์ฟเวอร์ vLLM กำลังทำงานและเข้าถึงได้:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    หากคุณเห็นข้อผิดพลาดการเชื่อมต่อ ให้ตรวจสอบโฮสต์ พอร์ต และตรวจสอบว่า vLLM เริ่มด้วยโหมดเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI
    สำหรับปลายทาง local loopback, LAN หรือ Tailscale แบบชัดเจน ให้ตั้งค่า
    `models.providers.vllm.request.allowPrivateNetwork: true` ด้วย; คำขอของผู้ให้บริการ
    จะบล็อก URL เครือข่ายส่วนตัวตามค่าเริ่มต้น เว้นแต่ผู้ให้บริการนั้น
    จะถูกเชื่อถืออย่างชัดเจน

  </Accordion>

  <Accordion title="ข้อผิดพลาดการยืนยันตัวตนในคำขอ">
    หากคำขอล้มเหลวด้วยข้อผิดพลาดการยืนยันตัวตน ให้ตั้งค่า `VLLM_API_KEY` จริงที่ตรงกับการกำหนดค่าเซิร์ฟเวอร์ของคุณ หรือกำหนดค่าผู้ให้บริการอย่างชัดเจนภายใต้ `models.providers.vllm`

    <Tip>
    หากเซิร์ฟเวอร์ vLLM ของคุณไม่ได้บังคับใช้การยืนยันตัวตน ค่าไม่ว่างใดๆ สำหรับ `VLLM_API_KEY` จะใช้เป็นสัญญาณเลือกใช้สำหรับ OpenClaw ได้
    </Tip>

  </Accordion>

  <Accordion title="ไม่พบโมเดลจากการค้นหา">
    การค้นหาอัตโนมัติต้องตั้งค่า `VLLM_API_KEY` หากคุณกำหนด `models.providers.vllm` ไว้แล้ว OpenClaw จะใช้เฉพาะโมเดลที่คุณประกาศไว้ เว้นแต่ `agents.defaults.models` จะมี `"vllm/*": {}`
  </Accordion>

  <Accordion title="เครื่องมือแสดงผลเป็นข้อความดิบ">
    หากโมเดล Qwen พิมพ์ไวยากรณ์เครื่องมือ JSON/XML แทนที่จะสั่งทำงาน skill
    ให้ตรวจสอบคำแนะนำ Qwen ในการกำหนดค่าขั้นสูงด้านบน วิธีแก้ตามปกติคือ:

    - เริ่ม vLLM ด้วยตัวแยกวิเคราะห์/template ที่ถูกต้องสำหรับโมเดลนั้น
    - ยืนยัน id โมเดลที่แน่นอนด้วย `openclaw models list --provider vllm`
    - เพิ่มการเขียนทับ `params.extra_body.tool_choice: "required"`
      เฉพาะต่อโมเดลโดยเฉพาะก็ต่อเมื่อ `tool_choice: "auto"` ยังคงส่งคืน
      การเรียกใช้เครื่องมือแบบว่างหรือเป็นข้อความเท่านั้น

  </Accordion>
</AccordionGroup>

<Warning>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [FAQ](/th/help/faq)
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ refs โมเดล และพฤติกรรม failover
  </Card>
  <Card title="OpenAI" href="/th/providers/openai" icon="bolt">
    ผู้ให้บริการ OpenAI แบบเนทีฟและพฤติกรรมเส้นทางที่เข้ากันได้กับ OpenAI
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาทั่วไปและวิธีแก้ไข
  </Card>
</CardGroup>
