---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw กับเซิร์ฟเวอร์ vLLM ภายในเครื่อง
    - คุณต้องการจุดเชื่อมต่อ `/v1` ที่เข้ากันได้กับ OpenAI สำหรับโมเดลของคุณเอง
summary: เรียกใช้ OpenClaw ด้วย vLLM (เซิร์ฟเวอร์ภายในที่เข้ากันได้กับ OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-07-12T16:37:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM ให้บริการโมเดลโอเพนซอร์ส (และโมเดลแบบกำหนดเองบางส่วน) ผ่าน HTTP API ที่ **เข้ากันได้กับ OpenAI** OpenClaw เชื่อมต่อโดยใช้ API `openai-completions` และสามารถ **ค้นหาโมเดลโดยอัตโนมัติ** เมื่อคุณเลือกเปิดใช้ด้วย `VLLM_API_KEY`

| คุณสมบัติ         | ค่า                                      |
| ---------------- | ------------------------------------------ |
| ID ผู้ให้บริการ      | `vllm`                                     |
| API              | `openai-completions` (เข้ากันได้กับ OpenAI)   |
| การยืนยันตัวตน             | ตัวแปรสภาพแวดล้อม `VLLM_API_KEY`        |
| URL ฐานเริ่มต้น | `http://127.0.0.1:8000/v1`                 |
| ข้อมูลการใช้งานระหว่างสตรีม  | รองรับ (`stream_options.include_usage`) |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="เริ่ม vLLM ด้วยเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI">
    URL ฐานของคุณต้องเปิดเผยปลายทาง `/v1` (`/v1/models`, `/v1/chat/completions`) โดยทั่วไป vLLM ทำงานที่:

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="ตั้งค่าตัวแปรสภาพแวดล้อมสำหรับคีย์ API">
    หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับใช้การยืนยันตัวตน สามารถใช้ค่าใดก็ได้ที่ไม่ว่าง:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="เลือกโมเดล">
    แทนที่ด้วย ID โมเดล vLLM รายการใดรายการหนึ่งของคุณ:

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

<Tip>
สำหรับการตั้งค่าแบบไม่โต้ตอบ (CI, การเขียนสคริปต์) ให้ส่ง URL ฐาน คีย์ และโมเดลโดยตรง:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## การค้นหาโมเดล (ผู้ให้บริการโดยนัย)

เมื่อตั้งค่า `VLLM_API_KEY` แล้ว (หรือมีโปรไฟล์การยืนยันตัวตนอยู่) และ **ไม่ได้** กำหนด `models.providers.vllm` OpenClaw จะเรียก `GET http://127.0.0.1:8000/v1/models` และแปลง ID ที่ส่งกลับมาเป็นรายการโมเดล

<Note>
หากคุณตั้งค่า `models.providers.vllm` อย่างชัดเจน OpenClaw จะใช้เฉพาะโมเดลที่คุณประกาศไว้เท่านั้น เพิ่ม `"vllm/*": {}` ลงใน `agents.defaults.models` เพื่อให้ OpenClaw เรียกปลายทาง `/models` ของผู้ให้บริการที่กำหนดค่าไว้นั้นด้วย และรวมโมเดล vLLM ทั้งหมดที่ผู้ให้บริการประกาศ
</Note>

## การกำหนดค่าอย่างชัดเจน

กำหนดค่าอย่างชัดเจนเมื่อ vLLM ทำงานบนโฮสต์หรือพอร์ตอื่น เมื่อคุณต้องการตรึง `contextWindow`/`maxTokens` เมื่อเซิร์ฟเวอร์ต้องใช้คีย์ API จริง หรือเมื่อคุณเชื่อมต่อกับปลายทาง local loopback, LAN หรือ Tailscale ที่เชื่อถือได้:

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend request timeout for slow local models
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

หากต้องการให้ผู้ให้บริการเป็นแบบไดนามิกโดยไม่ต้องแสดงรายการทุกโมเดล ให้เพิ่มไวลด์การ์ดลงในแค็ตตาล็อกโมเดลที่มองเห็นได้:

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
    vLLM จะถูกจัดการเป็นแบ็กเอนด์ `/v1` แบบพร็อกซีที่เข้ากันได้กับ OpenAI ไม่ใช่ปลายทาง OpenAI แบบเนทีฟ:

    | ลักษณะการทำงาน                                | นำไปใช้หรือไม่                         |
    | --------------------------------------- | -------------------------------- |
    | การจัดรูปแบบคำขอ OpenAI แบบเนทีฟ           | ไม่                               |
    | `service_tier`                          | ไม่ส่ง                         |
    | `store` ของ Responses                       | ไม่ส่ง                         |
    | คำแนะนำสำหรับแคชพรอมต์                      | ไม่ส่ง                         |
    | การจัดรูปแบบเพย์โหลดสำหรับความเข้ากันได้ด้านการให้เหตุผลของ OpenAI | ไม่นำไปใช้                      |
    | ส่วนหัวระบุแหล่งที่มาของ OpenClaw ที่ซ่อนอยู่     | ไม่แทรกใน URL ฐานแบบกำหนดเอง |

  </Accordion>

  <Accordion title="การควบคุมการคิดของ Qwen">
    สำหรับโมเดล Qwen ให้ตั้งค่า `compat.thinkingFormat: "qwen-chat-template"` ในแถวของโมเดลเมื่อเซิร์ฟเวอร์คาดว่าจะได้รับอาร์กิวเมนต์คีย์เวิร์ดของเทมเพลตแชต Qwen โมเดลเหล่านี้เปิดเผยโปรไฟล์ `/think` แบบสองสถานะ (`off`, `on`) เนื่องจากการคิดผ่านเทมเพลตแชต Qwen เป็นแฟล็กเปิด/ปิด ไม่ใช่ลำดับระดับความพยายามแบบ OpenAI

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

    OpenClaw แมป `/think off` เป็น:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    ระดับการคิดอื่นที่ไม่ใช่ `off` จะส่ง `enable_thinking: true` หากปลายทางของคุณคาดว่าจะได้รับแฟล็กระดับบนสุดแบบ DashScope แทน ให้ใช้ `compat.thinkingFormat: "qwen"` เพื่อส่ง `enable_thinking` ที่รากของคำขอ

  </Accordion>

  <Accordion title="การควบคุมการคิดของ Nemotron 3">
    สำหรับโมเดล `vllm/nemotron-3-*` ที่ปิดการคิด Plugin ที่มาพร้อมระบบจะส่ง:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    หากต้องการปรับแต่งค่าเหล่านี้ ให้ตั้งค่า `chat_template_kwargs` ภายใต้พารามิเตอร์ของโมเดล หากคุณตั้งค่า `params.extra_body.chat_template_kwargs` ด้วย ค่านั้นจะมีผลเหนือกว่า เนื่องจาก `extra_body` เป็นการเขียนทับเนื้อหาคำขอขั้นสุดท้าย

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
    ก่อนอื่นให้ยืนยันว่า vLLM เริ่มทำงานด้วยตัวแยกวิเคราะห์การเรียกใช้เครื่องมือและเทมเพลตแชตที่ถูกต้องสำหรับโมเดลนั้น เอกสาร vLLM ระบุให้ใช้ `hermes` สำหรับโมเดล Qwen2.5 และ `qwen3_xml` สำหรับโมเดล Qwen3-Coder

    อาการ: Skills/เครื่องมือไม่เคยทำงาน ผู้ช่วยพิมพ์ JSON/XML ดิบ เช่น `{"name":"read","arguments":...}` หรือ vLLM ส่งคืนอาร์เรย์ `tool_calls` ว่างเมื่อ OpenClaw ส่ง `tool_choice: "auto"`

    ชุดการทำงานร่วมกันบางแบบของ Qwen/vLLM จะส่งคืนการเรียกใช้เครื่องมือแบบมีโครงสร้างเฉพาะเมื่อคำขอใช้ `tool_choice: "required"` บังคับใช้แยกตามโมเดลด้วย `params.extra_body`:

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

    แทนที่ ID โมเดลด้วย ID ที่ตรงกันทุกประการจาก `openclaw models list --provider vllm` หรือใช้การเขียนทับเดียวกันจาก CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    นี่เป็นวิธีแก้ปัญหาชั่วคราวที่ต้องเลือกเปิดใช้ โดยจะบังคับให้ทุกรอบที่มีเครื่องมือทำการเรียกใช้เครื่องมือ ดังนั้นให้ใช้เฉพาะกับรายการโมเดลเฉพาะที่ยอมรับพฤติกรรมนี้ได้เท่านั้น ห้ามตั้งค่าเป็นค่าเริ่มต้นส่วนกลางสำหรับโมเดล vLLM ทั้งหมด และห้ามใช้ร่วมกับพร็อกซีที่แปลงข้อความใด ๆ จากผู้ช่วยเป็นการเรียกใช้เครื่องมือที่สามารถดำเนินการได้

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
    สำหรับโมเดลภายในเครื่องขนาดใหญ่ โฮสต์ LAN ระยะไกล หรือลิงก์ tailnet ให้ตั้งค่าระยะหมดเวลาของคำขอในขอบเขตของผู้ให้บริการ:

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

    `timeoutSeconds` มีผลเฉพาะกับคำขอ HTTP ของโมเดล vLLM ได้แก่ การตั้งค่าการเชื่อมต่อ ส่วนหัวการตอบกลับ การสตรีมเนื้อหา และการยกเลิก guarded-fetch เมื่อครบเวลารวม นอกจากนี้ยังเพิ่มเพดานตัวเฝ้าระวังการไม่มีการทำงาน/สตรีมของ LLM ให้สูงกว่าค่าเริ่มต้นโดยนัยประมาณ 120 วินาทีสำหรับผู้ให้บริการนี้ ควรใช้วิธีนี้แทนการเพิ่ม `agents.defaults.timeoutSeconds` ซึ่งควบคุมการทำงานทั้งหมดของเอเจนต์

  </Accordion>

  <Accordion title="ไม่สามารถเข้าถึงเซิร์ฟเวอร์">
    ตรวจสอบว่าเซิร์ฟเวอร์ vLLM กำลังทำงานและสามารถเข้าถึงได้:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    หากพบข้อผิดพลาดในการเชื่อมต่อ ให้ตรวจสอบโฮสต์ พอร์ต และยืนยันว่า vLLM เริ่มทำงานในโหมดเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI OpenClaw เชื่อถือต้นทาง `models.providers.vllm.baseUrl` ที่กำหนดค่าไว้อย่างตรงกันทุกประการสำหรับคำขอโมเดลแบบมีการป้องกันบนปลายทาง local loopback, LAN และ Tailscale ต้นทางเมทาดาทา/link-local ยังคงถูกบล็อกหากไม่ได้เลือกเปิดใช้อย่างชัดเจน ตั้งค่า `models.providers.vllm.request.allowPrivateNetwork: true` เฉพาะเมื่อคำขอ vLLM จำเป็นต้องเข้าถึงต้นทางส่วนตัวอื่น หรือใช้ `false` เพื่อยกเลิกการเชื่อถือต้นทางที่ตรงกันทุกประการ

  </Accordion>

  <Accordion title="ข้อผิดพลาดการยืนยันตัวตนในคำขอ">
    หากคำขอล้มเหลวด้วยข้อผิดพลาดการยืนยันตัวตน ให้ตั้งค่า `VLLM_API_KEY` จริงที่ตรงกับการกำหนดค่าเซิร์ฟเวอร์ของคุณ หรือกำหนดค่าผู้ให้บริการอย่างชัดเจนภายใต้ `models.providers.vllm`

    <Tip>
    หากเซิร์ฟเวอร์ vLLM ของคุณไม่ได้บังคับใช้การยืนยันตัวตน ค่าใด ๆ ที่ไม่ว่างสำหรับ `VLLM_API_KEY` จะใช้เป็นสัญญาณเลือกเปิดใช้สำหรับ OpenClaw ได้
    </Tip>

  </Accordion>

  <Accordion title="ไม่พบโมเดล">
    การค้นหาอัตโนมัติกำหนดให้ต้องตั้งค่า `VLLM_API_KEY` หากคุณกำหนด `models.providers.vllm` ไว้ OpenClaw จะใช้เฉพาะโมเดลที่คุณประกาศ เว้นแต่ `agents.defaults.models` จะมี `"vllm/*": {}`
  </Accordion>

  <Accordion title="เครื่องมือแสดงผลเป็นข้อความดิบ">
    หากโมเดล Qwen พิมพ์ไวยากรณ์เครื่องมือ JSON/XML แทนการเรียกใช้ Skill:

    - เริ่ม vLLM ด้วยตัวแยกวิเคราะห์/เทมเพลตที่ถูกต้องสำหรับโมเดลนั้น
    - ยืนยัน ID โมเดลที่ตรงกันทุกประการด้วย `openclaw models list --provider vllm`
    - เพิ่มการเขียนทับ `params.extra_body.tool_choice: "required"` แยกเฉพาะโมเดลนั้น หาก `tool_choice: "auto"` ยังคงส่งคืนการเรียกใช้เครื่องมือที่ว่างเปล่าหรือมีเพียงข้อความ

  </Accordion>
</AccordionGroup>

<Warning>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Warning>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="OpenAI" href="/th/providers/openai" icon="bolt">
    ผู้ให้บริการ OpenAI แบบเนทีฟและลักษณะการทำงานของเส้นทางที่เข้ากันได้กับ OpenAI
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการใช้ข้อมูลประจำตัวซ้ำ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและวิธีแก้ไข
  </Card>
</CardGroup>
