---
read_when:
    - คุณต้องการกำหนดค่าผู้ให้บริการค้นหาหน่วยความจำหรือโมเดลเอ็มเบดดิง
    - คุณต้องการตั้งค่าแบ็กเอนด์ QMD
    - คุณต้องการปรับแต่งการค้นหาแบบไฮบริด, MMR หรือการลดค่าน้ำหนักตามเวลา
    - คุณต้องการเปิดใช้งานการทำดัชนีหน่วยความจำแบบหลายรูปแบบ
sidebarTitle: Memory config
summary: ปุ่มปรับการกำหนดค่าทั้งหมดสำหรับการค้นหาหน่วยความจำ ผู้ให้บริการ embedding, QMD, การค้นหาแบบไฮบริด และการทำดัชนีแบบหลายโมดัล
title: ข้อมูลอ้างอิงการกำหนดค่า Memory
x-i18n:
    generated_at: "2026-06-28T22:34:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de7d1c23cd415293001ef59ae2572cd7bfe9a88c70c1e4cf138ee60664ff0ac2
    source_path: reference/memory-config.md
    workflow: 16
---

หน้านี้แสดงรายการตัวเลือกการกำหนดค่าทั้งหมดสำหรับการค้นหาหน่วยความจำของ OpenClaw สำหรับภาพรวมเชิงแนวคิด โปรดดู:

<CardGroup cols={2}>
  <Card title="ภาพรวมหน่วยความจำ" href="/th/concepts/memory">
    วิธีการทำงานของหน่วยความจำ
  </Card>
  <Card title="เอนจินในตัว" href="/th/concepts/memory-builtin">
    แบ็กเอนด์ SQLite เริ่มต้น
  </Card>
  <Card title="เอนจิน QMD" href="/th/concepts/memory-qmd">
    ไซด์คาร์แบบ local-first
  </Card>
  <Card title="การค้นหาหน่วยความจำ" href="/th/concepts/memory-search">
    ไปป์ไลน์การค้นหาและการปรับแต่ง
  </Card>
  <Card title="Active Memory" href="/th/concepts/active-memory">
    เอเจนต์ย่อยหน่วยความจำสำหรับเซสชันแบบโต้ตอบ
  </Card>
</CardGroup>

การตั้งค่าการค้นหาหน่วยความจำทั้งหมดอยู่ภายใต้ `agents.defaults.memorySearch` ใน `openclaw.json` เว้นแต่จะระบุไว้เป็นอย่างอื่น

<Note>
หากคุณกำลังมองหาสวิตช์เปิดปิดฟีเจอร์ **Active Memory** และการกำหนดค่าเอเจนต์ย่อย สิ่งนั้นอยู่ภายใต้ `plugins.entries.active-memory` แทน `memorySearch`

Active Memory ใช้โมเดลสองด่าน:

1. ต้องเปิดใช้ plugin และกำหนดเป้าหมายเป็น id ของเอเจนต์ปัจจุบัน
2. คำขอต้องเป็นเซสชันแชตถาวรแบบโต้ตอบที่เข้าเกณฑ์

ดู [Active Memory](/th/concepts/active-memory) สำหรับโมเดลการเปิดใช้งาน การกำหนดค่าที่ plugin เป็นเจ้าของ การคงอยู่ของทรานสคริปต์ และรูปแบบการทยอยเปิดใช้อย่างปลอดภัย
</Note>

---

## การเลือกผู้ให้บริการ

| คีย์        | ชนิด      | ค่าเริ่มต้น          | คำอธิบาย                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`       | ID อะแดปเตอร์ embedding เช่น `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` หรือ `voyage`; อาจเป็น `models.providers.<id>` ที่กำหนดค่าไว้ซึ่ง `api` ชี้ไปยังอะแดปเตอร์ embedding หน่วยความจำหรือ API โมเดลที่เข้ากันได้กับ OpenAI |
| `model`    | `string`  | ค่าเริ่มต้นของผู้ให้บริการ | ชื่อโมเดล embedding                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | ID อะแดปเตอร์ fallback เมื่อตัวหลักล้มเหลว                                                                                                                                                                                                                                                  |
| `enabled`  | `boolean` | `true`           | เปิดหรือปิดการค้นหาหน่วยความจำ                                                                                                                                                                                                                                                             |

เมื่อไม่ได้ตั้งค่า `provider` OpenClaw จะใช้ embeddings ของ OpenAI ตั้งค่า `provider`
อย่างชัดเจนเพื่อใช้ Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, โมเดล GGUF ภายในเครื่อง หรือ endpoint `/v1/embeddings` ที่เข้ากันได้กับ OpenAI
การกำหนดค่าเดิมที่ยังระบุ `provider: "auto"` จะ resolve เป็น `openai`

<Warning>
การเปลี่ยนผู้ให้บริการ embedding, โมเดล, การตั้งค่าผู้ให้บริการ, แหล่งข้อมูล, ขอบเขต,
การแบ่ง chunk หรือ tokenizer อาจทำให้ดัชนีเวกเตอร์ SQLite ที่มีอยู่ไม่เข้ากัน
OpenClaw จะหยุดการค้นหาเวกเตอร์ชั่วคราวและรายงานคำเตือนเอกลักษณ์ดัชนีแทนการ
re-embed ทุกอย่างโดยอัตโนมัติ สร้างใหม่เมื่อคุณพร้อมด้วย
`openclaw memory status --index --agent <id>` หรือ
`openclaw memory index --force --agent <id>`
</Warning>

เมื่อไม่ได้ตั้งค่า `provider`, มี `provider: "auto"` แบบเดิมอยู่ หรือ
`provider: "none"` จงใจเลือกโหมด FTS-only การเรียกคืนหน่วยความจำยังสามารถ
ใช้การจัดอันดับ FTS แบบ lexical ได้เมื่อ embeddings ไม่พร้อมใช้งาน

ผู้ให้บริการที่ไม่ใช่ภายในเครื่องซึ่งระบุอย่างชัดเจนจะล้มเหลวแบบปิด หากคุณตั้งค่า `memorySearch.provider` เป็น
ผู้ให้บริการที่มีแบ็กเอนด์ระยะไกลแบบเจาะจง เช่น OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio หรือผู้ให้บริการกำหนดเอง
ที่เข้ากันได้กับ OpenAI และผู้ให้บริการนั้นไม่พร้อมใช้งานขณะรัน `memory_search`
จะส่งคืนผลลัพธ์ไม่พร้อมใช้งานแทนการใช้การเรียกคืนแบบ FTS-only อย่างเงียบ ๆ แก้ไข
การกำหนดค่าผู้ให้บริการ/auth สลับไปใช้ผู้ให้บริการที่เข้าถึงได้ หรือตั้งค่า
`provider: "none"` หากคุณต้องการการเรียกคืนแบบ FTS-only โดยเจตนา

### ID ผู้ให้บริการกำหนดเอง

`memorySearch.provider` สามารถชี้ไปยังรายการ `models.providers.<id>` กำหนดเองสำหรับอะแดปเตอร์ผู้ให้บริการเฉพาะหน่วยความจำ เช่น `ollama` หรือสำหรับ API โมเดลที่เข้ากันได้กับ OpenAI เช่น `openai-responses` / `openai-completions` OpenClaw จะ resolve เจ้าของ `api` ของผู้ให้บริการนั้นสำหรับอะแดปเตอร์ embedding ขณะคง ID ผู้ให้บริการกำหนดเองไว้สำหรับ endpoint, auth และการจัดการ model-prefix วิธีนี้ช่วยให้การตั้งค่าแบบหลาย GPU หรือหลายโฮสต์จัดสรร embeddings หน่วยความจำให้กับ endpoint ภายในเครื่องแบบเจาะจงได้:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### การ resolve คีย์ API

Embeddings ระยะไกลต้องใช้คีย์ API Bedrock ใช้ credential chain เริ่มต้นของ AWS SDK แทน (instance roles, SSO, access keys)

| ผู้ให้บริการ       | Env var                                            | คีย์การกำหนดค่า                          |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS credential chain                               | ไม่ต้องใช้คีย์ API                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | โปรไฟล์ auth ผ่านการเข้าสู่ระบบด้วยอุปกรณ์       |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth ครอบคลุมเฉพาะแชต/completions และไม่ตอบสนองคำขอ embedding
</Note>

---

## การกำหนดค่า endpoint ระยะไกล

ใช้ `provider: "openai-compatible"` สำหรับเซิร์ฟเวอร์ `/v1/embeddings`
ทั่วไปที่เข้ากันได้กับ OpenAI ซึ่งไม่ควรสืบทอดข้อมูลรับรองแชต OpenAI ส่วนกลาง

<ParamField path="remote.baseUrl" type="string">
  URL ฐาน API กำหนดเอง
</ParamField>
<ParamField path="remote.apiKey" type="string">
  แทนที่คีย์ API
</ParamField>
<ParamField path="remote.headers" type="object">
  ส่วนหัว HTTP เพิ่มเติม (ผสานกับค่าเริ่มต้นของผู้ให้บริการ)
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai-compatible",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## การกำหนดค่าเฉพาะผู้ให้บริการ

<AccordionGroup>
  <Accordion title="Gemini">
    | คีย์                    | ชนิด     | ค่าเริ่มต้น                | คำอธิบาย                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | รองรับ `gemini-embedding-2-preview` ด้วย |
    | `outputDimensionality` | `number` | `3072`                 | สำหรับ Embedding 2: 768, 1536 หรือ 3072        |

    <Warning>
    การเปลี่ยนโมเดลหรือ `outputDimensionality` จะเปลี่ยนเอกลักษณ์ของดัชนี OpenClaw
    จะหยุดการค้นหาเวกเตอร์ชั่วคราวจนกว่าคุณจะสร้างดัชนีหน่วยความจำใหม่อย่างชัดเจน
    </Warning>

  </Accordion>
  <Accordion title="ชนิดอินพุตที่เข้ากันได้กับ OpenAI">
    Endpoint embedding ที่เข้ากันได้กับ OpenAI สามารถเลือกใช้ฟิลด์คำขอ `input_type` เฉพาะผู้ให้บริการได้ สิ่งนี้มีประโยชน์สำหรับโมเดล embedding แบบ asymmetric ที่ต้องใช้ป้ายกำกับต่างกันสำหรับ embeddings ของคำค้นและเอกสาร

    | คีย์                 | ชนิด     | ค่าเริ่มต้น | คำอธิบาย                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | ไม่ได้ตั้งค่า   | `input_type` ที่ใช้ร่วมกันสำหรับ embeddings ของคำค้นและเอกสาร   |
    | `queryInputType`    | `string` | ไม่ได้ตั้งค่า   | `input_type` ณ เวลาค้นหา; แทนที่ `inputType`          |
    | `documentInputType` | `string` | ไม่ได้ตั้งค่า   | `input_type` ของดัชนี/เอกสาร; แทนที่ `inputType`      |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai-compatible",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "${EMBEDDINGS_API_KEY}",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    การเปลี่ยนค่าเหล่านี้มีผลต่อเอกลักษณ์แคช embedding สำหรับการทำดัชนีแบบแบตช์ของผู้ให้บริการ และควรตามด้วยการ reindex หน่วยความจำเมื่อโมเดลต้นทางปฏิบัติต่อป้ายกำกับแตกต่างกัน

  </Accordion>
  <Accordion title="Bedrock">
    ### การกำหนดค่า embedding ของ Bedrock

    Bedrock ใช้ credential chain เริ่มต้นของ AWS SDK โดยไม่ต้องใช้คีย์ API หาก OpenClaw รันบน EC2 พร้อม instance role ที่เปิดใช้ Bedrock เพียงตั้งค่าผู้ให้บริการและโมเดล:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0",
          },
        },
      },
    }
    ```

    | คีย์                    | ชนิด     | ค่าเริ่มต้น                        | คำอธิบาย                     |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | ID โมเดล embedding ของ Bedrock ใดก็ได้  |
    | `outputDimensionality` | `number` | ค่าเริ่มต้นของโมเดล                  | สำหรับ Titan V2: 256, 512 หรือ 1024 |

    **โมเดลที่รองรับ** (พร้อมการตรวจจับ family และค่าเริ่มต้นของมิติ):

    | ID โมเดล                                   | ผู้ให้บริการ   | มิติเริ่มต้น | มิติที่กำหนดค่าได้    |
    | ------------------------------------------ | ---------- | ------------ | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

    ตัวแปรที่มีส่วนต่อท้ายด้านปริมาณงาน (เช่น `amazon.titan-embed-text-v1:2:8k`) จะสืบทอดการกำหนดค่าของโมเดลฐาน

    **การยืนยันตัวตน:** การยืนยันตัวตนของ Bedrock ใช้ลำดับการแก้ไขข้อมูลประจำตัวมาตรฐานของ AWS SDK:

    1. ตัวแปรสภาพแวดล้อม (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. แคชโทเค็น SSO
    3. ข้อมูลประจำตัวโทเค็น Web identity
    4. ไฟล์ข้อมูลประจำตัวและไฟล์กำหนดค่าที่ใช้ร่วมกัน
    5. ข้อมูลประจำตัวเมตาดาต้า ECS หรือ EC2

    ภูมิภาคจะถูกแก้ไขจาก `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` ของผู้ให้บริการ `amazon-bedrock` หรือใช้ค่าเริ่มต้นเป็น `us-east-1`

    **สิทธิ์ IAM:** บทบาทหรือผู้ใช้ IAM ต้องมี:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    เพื่อใช้สิทธิ์น้อยที่สุด ให้จำกัดขอบเขต `InvokeModel` ไว้ที่โมเดลเฉพาะ:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="ในเครื่อง (GGUF + llama.cpp)">
    | คีย์                   | ชนิด               | ค่าเริ่มต้น                | คำอธิบาย                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | ดาวน์โหลดอัตโนมัติ        | เส้นทางไปยังไฟล์โมเดล GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | ค่าเริ่มต้นของ node-llama-cpp | ไดเรกทอรีแคชสำหรับโมเดลที่ดาวน์โหลด                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | ขนาดหน้าต่างบริบทสำหรับบริบทการฝัง 4096 ครอบคลุมชังก์ทั่วไป (128–512 โทเค็น) พร้อมจำกัด VRAM ที่ไม่ใช่น้ำหนัก ลดลงเป็น 1024–2048 บนโฮสต์ที่มีข้อจำกัด `"auto"` ใช้ค่าสูงสุดที่โมเดลได้รับการฝึกมา — ไม่แนะนำสำหรับโมเดล 8B+ (Qwen3-Embedding-8B: 40 960 โทเค็น → VRAM ~32 GB เทียบกับ ~8.8 GB ที่ 4096) |

    ติดตั้งผู้ให้บริการ llama.cpp อย่างเป็นทางการก่อน: `openclaw plugins install @openclaw/llama-cpp-provider`
    โมเดลเริ่มต้น: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, ดาวน์โหลดอัตโนมัติ) เช็กเอาต์ซอร์สยังคงต้องอนุมัติการสร้างแบบเนทีฟ: `pnpm approve-builds` จากนั้น `pnpm rebuild node-llama-cpp`

    ใช้ CLI แบบสแตนด์อโลนเพื่อตรวจสอบเส้นทางผู้ให้บริการเดียวกับที่ Gateway ใช้:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    ตั้งค่า `provider: "local"` อย่างชัดเจนสำหรับการฝัง GGUF ในเครื่อง รองรับการอ้างอิงโมเดล `hf:` และ HTTP(S) สำหรับการกำหนดค่าในเครื่องแบบชัดเจน แต่จะไม่เปลี่ยนผู้ให้บริการเริ่มต้น

  </Accordion>
</AccordionGroup>

### หมดเวลาการฝังแบบอินไลน์

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  แทนที่ค่าหมดเวลาสำหรับแบตช์การฝังแบบอินไลน์ระหว่างการทำดัชนีหน่วยความจำ

หากไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของผู้ให้บริการ: 600 วินาทีสำหรับผู้ให้บริการในเครื่อง/โฮสต์เอง เช่น `local`, `ollama` และ `lmstudio` และ 120 วินาทีสำหรับผู้ให้บริการแบบโฮสต์ เพิ่มค่านี้เมื่อแบตช์การฝังที่ถูกจำกัดด้วย CPU ในเครื่องทำงานปกติแต่ช้า
</ParamField>

---

## การกำหนดค่าการค้นหาแบบไฮบริด

ทั้งหมดอยู่ภายใต้ `memorySearch.query.hybrid`:

| คีย์                   | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | เปิดใช้การค้นหาแบบไฮบริด BM25 + เวกเตอร์ |
| `vectorWeight`        | `number`  | `0.7`   | น้ำหนักสำหรับคะแนนเวกเตอร์ (0-1)     |
| `textWeight`          | `number`  | `0.3`   | น้ำหนักสำหรับคะแนน BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | ตัวคูณขนาดพูลผู้สมัคร     |

<Tabs>
  <Tab title="MMR (ความหลากหลาย)">
    | คีย์           | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                          |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | เปิดใช้การจัดอันดับใหม่ด้วย MMR                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = ความหลากหลายสูงสุด, 1 = ความเกี่ยวข้องสูงสุด |
  </Tab>
  <Tab title="การลดน้ำหนักตามเวลา (ความใหม่)">
    | คีย์                          | ชนิด      | ค่าเริ่มต้น | คำอธิบาย               |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | เปิดใช้การเพิ่มคะแนนตามความใหม่      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | คะแนนลดลงครึ่งหนึ่งทุก N วัน |

    ไฟล์ Evergreen (`MEMORY.md`, ไฟล์ที่ไม่มีวันที่ใน `memory/`) จะไม่ถูกลดน้ำหนักตามเวลา

  </Tab>
</Tabs>

### ตัวอย่างเต็ม

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## เส้นทางหน่วยความจำเพิ่มเติม

| คีย์          | ประเภท       | คำอธิบาย                              |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | ไดเรกทอรีหรือไฟล์เพิ่มเติมสำหรับทำดัชนี |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

เส้นทางอาจเป็นแบบสัมบูรณ์หรือสัมพันธ์กับเวิร์กสเปซก็ได้ ไดเรกทอรีจะถูกสแกนแบบเรียกซ้ำเพื่อหาไฟล์ `.md` การจัดการ symlink ขึ้นอยู่กับแบ็กเอนด์ที่ใช้งานอยู่: เอนจินในตัวจะไม่สนใจ symlink ขณะที่ QMD จะทำตามพฤติกรรมของสแกนเนอร์ QMD พื้นฐาน

สำหรับการค้นหาทรานสคริปต์ข้ามเอเจนต์ที่มีขอบเขตตามเอเจนต์ ให้ใช้ `agents.list[].memorySearch.qmd.extraCollections` แทน `memory.qmd.paths` คอลเลกชันเพิ่มเติมเหล่านั้นใช้รูปแบบ `{ path, name, pattern? }` เดียวกัน แต่จะถูกผสานแยกตามแต่ละเอเจนต์ และสามารถคงชื่อที่แชร์ไว้อย่างชัดเจนเมื่อเส้นทางชี้ไปนอกเวิร์กสเปซปัจจุบัน หากเส้นทางที่ resolve แล้วเส้นทางเดียวกันปรากฏทั้งใน `memory.qmd.paths` และ `memorySearch.qmd.extraCollections` QMD จะเก็บรายการแรกไว้และข้ามรายการที่ซ้ำ

---

## หน่วยความจำหลายโมดัล (Gemini)

ทำดัชนีรูปภาพและเสียงควบคู่กับ Markdown โดยใช้ Gemini Embedding 2:

| คีย์                       | ประเภท       | ค่าเริ่มต้น    | คำอธิบาย                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | เปิดใช้การทำดัชนีหลายโมดัล             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, หรือ `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | ขนาดไฟล์สูงสุดสำหรับการทำดัชนี             |

<Note>
ใช้กับไฟล์ใน `extraPaths` เท่านั้น รูทหน่วยความจำเริ่มต้นยังคงเป็น Markdown เท่านั้น ต้องใช้ `gemini-embedding-2-preview` `fallback` ต้องเป็น `"none"`
</Note>

รูปแบบที่รองรับ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (รูปภาพ); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (เสียง)

---

## แคช Embedding

| คีย์                | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | แคช embedding ของชังก์ใน SQLite |
| `cache.maxEntries` | `number`  | `50000` | จำนวน embedding ที่แคชได้สูงสุด            |

ป้องกันการ embedding ข้อความที่ไม่เปลี่ยนแปลงซ้ำระหว่างการทำดัชนีใหม่หรือการอัปเดตทรานสคริปต์

---

## การทำดัชนีแบบแบตช์

| คีย์                           | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | embedding แบบอินไลน์แบบขนาน |
| `remote.batch.enabled`        | `boolean` | `false` | เปิดใช้ API embedding แบบแบตช์ |
| `remote.batch.concurrency`    | `number`  | `2`     | งานแบตช์แบบขนาน        |
| `remote.batch.wait`           | `boolean` | `true`  | รอให้แบตช์เสร็จสมบูรณ์  |
| `remote.batch.pollIntervalMs` | `number`  | --      | ช่วงเวลาการ poll              |
| `remote.batch.timeoutMinutes` | `number`  | --      | หมดเวลาของแบตช์              |

พร้อมใช้งานสำหรับ `openai`, `gemini` และ `voyage` โดยทั่วไป แบตช์ของ OpenAI จะเร็วที่สุดและมีต้นทุนต่ำที่สุดสำหรับการเติมข้อมูลย้อนหลังขนาดใหญ่

`remote.nonBatchConcurrency` ควบคุมการเรียก embedding แบบอินไลน์ที่ใช้โดยผู้ให้บริการแบบโลคัล/โฮสต์เอง และผู้ให้บริการแบบโฮสต์เมื่อ API แบตช์ของผู้ให้บริการไม่ได้ทำงานอยู่ Ollama มีค่าเริ่มต้นเป็น `1` สำหรับการทำดัชนีแบบไม่ใช้แบตช์ เพื่อหลีกเลี่ยงการใช้งานโฮสต์โลคัลขนาดเล็กมากเกินไป ตั้งค่าให้สูงขึ้นบนเครื่องที่ใหญ่กว่า

ค่านี้แยกจาก `sync.embeddingBatchTimeoutSeconds` ซึ่งควบคุมการหมดเวลาสำหรับการเรียก embedding แบบอินไลน์

---

## การค้นหาหน่วยความจำเซสชัน (ทดลอง)

ทำดัชนีทรานสคริปต์ของเซสชันและแสดงผ่าน `memory_search`:

| คีย์                           | ประเภท       | ค่าเริ่มต้น      | คำอธิบาย                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | เปิดใช้การทำดัชนีเซสชัน                 |
| `sources`                     | `string[]` | `["memory"]` | เพิ่ม `"sessions"` เพื่อรวมทรานสคริปต์ |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | เกณฑ์จำนวนไบต์สำหรับการทำดัชนีใหม่              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | เกณฑ์จำนวนข้อความสำหรับการทำดัชนีใหม่           |

<Warning>
การทำดัชนีเซสชันเป็นแบบเลือกเปิดใช้และทำงานแบบอะซิงโครนัส ผลลัพธ์อาจล้าสมัยเล็กน้อย บันทึกเซสชันอยู่บนดิสก์ ดังนั้นให้ถือว่าการเข้าถึงระบบไฟล์เป็นขอบเขตความเชื่อถือ
</Warning>

ผลลัพธ์จากทรานสคริปต์ของเซสชันยังเป็นไปตาม
[`tools.sessions.visibility`](/th/gateway/config-tools#toolssessions) ด้วย ค่าเริ่มต้นของการมองเห็นแบบ
`tree` จะเปิดเผยเฉพาะเซสชันปัจจุบันและเซสชันที่เซสชันนั้นสร้างขึ้น หากต้องการ
เรียกคืนเซสชันของเอเจนต์เดียวกันที่ Gateway ส่งงาน แต่ไม่เกี่ยวข้องกัน จากเซสชันอื่น
เช่น DM ให้ตั้งใจขยายการมองเห็นเป็น `agent` (หรือ `all` เฉพาะเมื่อจำเป็นต้องเรียกคืนข้ามเอเจนต์ด้วย
และนโยบายเอเจนต์ถึงเอเจนต์อนุญาต)

ตัวอย่างด้านล่างวางการตั้งค่าเหล่านี้ไว้ใต้ `agents.defaults` คุณยังสามารถ
ใช้การตั้งค่า `memorySearch` ที่เทียบเท่ากันในการแทนที่รายเอเจนต์ได้ เมื่อมีเพียง
เอเจนต์เดียวที่ควรจัดทำดัชนีและค้นหาทรานสคริปต์ของเซสชัน

สำหรับการเรียกคืนจาก Gateway ไปยัง DM ในเอเจนต์เดียวกัน:

<Tabs>
  <Tab title="Builtin backend">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="QMD backend">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      memory: {
        backend: "qmd",
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

เมื่อใช้ QMD, `agents.defaults.memorySearch.experimental.sessionMemory` และ
`sources: ["sessions"]` จะไม่ส่งออกทรานสคริปต์เข้าไปยัง QMD ด้วยตัวเอง ให้ตั้งค่า
`memory.qmd.sessions.enabled: true` ด้วย

---

## การเร่งความเร็วเวกเตอร์ SQLite (sqlite-vec)

| คีย์                         | ชนิด     | ค่าเริ่มต้น | คำอธิบาย                              |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | ใช้ sqlite-vec สำหรับคิวรีเวกเตอร์ |
| `store.vector.extensionPath` | `string`  | ที่รวมมาให้ | แทนที่พาธ sqlite-vec          |

เมื่อ sqlite-vec ไม่พร้อมใช้งาน OpenClaw จะถอยกลับไปใช้ cosine similarity ภายในโปรเซสโดยอัตโนมัติ

---

## พื้นที่จัดเก็บดัชนี

ดัชนีหน่วยความจำในตัวอยู่ในฐานข้อมูล OpenClaw SQLite ของแต่ละเอเจนต์ที่
`agents/<agentId>/agent/openclaw-agent.sqlite`

| คีย์                  | ชนิด    | ค่าเริ่มต้น    | คำอธิบาย                               |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | ตัวตัดคำ FTS5 (`unicode61` หรือ `trigram`) |

---

## การกำหนดค่าแบ็กเอนด์ QMD

ตั้งค่า `memory.backend = "qmd"` เพื่อเปิดใช้งาน การตั้งค่า QMD ทั้งหมดอยู่ใต้ `memory.qmd`:

| คีย์                     | ชนิด     | ค่าเริ่มต้น | คำอธิบาย                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | พาธไฟล์ปฏิบัติการ QMD; ตั้งเป็นพาธแบบสัมบูรณ์เมื่อ `PATH` ของบริการต่างจากเชลล์ของคุณ |
| `searchMode`             | `string`  | `search` | คำสั่งค้นหา: `search`, `vsearch`, `query`                                          |
| `rerank`                 | `boolean` | --       | ตั้งเป็น `false` พร้อม `searchMode: "query"` และ QMD 2.1+ เพื่อข้ามการจัดอันดับซ้ำของ QMD          |
| `includeDefaultMemory`   | `boolean` | `true`   | จัดทำดัชนี `MEMORY.md` + `memory/**/*.md` โดยอัตโนมัติ                                             |
| `paths[]`                | `array`   | --       | พาธเพิ่มเติม: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | ส่งออกทรานสคริปต์ของเซสชันเข้าไปยัง QMD                                                   |
| `sessions.retentionDays` | `number`  | --       | ระยะเวลาเก็บรักษาทรานสคริปต์                                                                  |
| `sessions.exportDir`     | `string`  | --       | ไดเรกทอรีส่งออก                                                                      |

`searchMode: "search"` เป็นแบบ lexical/BM25 เท่านั้น OpenClaw จะไม่เรียกโพรบความพร้อมของเวกเตอร์เชิงความหมายหรือการดูแลรักษา embedding ของ QMD สำหรับโหมดนั้น รวมถึงระหว่าง `memory status --deep`; `vsearch` และ `query` ยังคงต้องใช้ความพร้อมของเวกเตอร์ QMD และ embeddings

`rerank: false` เปลี่ยนเฉพาะโหมด `query` ของ QMD และต้องใช้ QMD 2.1 หรือใหม่กว่า ในโหมด CLI โดยตรง OpenClaw จะส่ง `--no-rerank`; ในโหมด MCP ที่ใช้ mcporter หนุนหลัง จะส่ง `rerank: false` ไปยังเครื่องมือคิวรีแบบรวมของ QMD ปล่อยไว้โดยไม่ตั้งค่าเพื่อใช้พฤติกรรมการจัดอันดับซ้ำของคิวรีตามค่าเริ่มต้นของ QMD

OpenClaw เลือกใช้รูปแบบ collection และคิวรี MCP ปัจจุบันของ QMD เป็นหลัก แต่ยังคงให้ QMD รุ่นเก่าทำงานได้โดยลองใช้แฟล็กรูปแบบ collection ที่เข้ากันได้และชื่อเครื่องมือ MCP แบบเก่าเมื่อจำเป็น เมื่อ QMD ประกาศว่ารองรับตัวกรอง collection หลายรายการ จะค้นหา collection จากแหล่งเดียวกันด้วยโปรเซส QMD เดียว; บิลด์ QMD รุ่นเก่าจะคงพาธความเข้ากันได้แบบต่อ collection ไว้ แหล่งเดียวกันหมายถึง collection หน่วยความจำถาวรถูกจัดกลุ่มรวมกัน ขณะที่ collection ทรานสคริปต์ของเซสชันยังคงเป็นอีกกลุ่มหนึ่ง เพื่อให้การกระจายแหล่งที่มายังมีอินพุตทั้งสองประเภท

<Note>
การแทนที่โมเดล QMD จะอยู่ฝั่ง QMD ไม่ใช่การกำหนดค่า OpenClaw หากคุณจำเป็นต้องแทนที่โมเดลของ QMD แบบทั่วทั้งระบบ ให้ตั้งค่าตัวแปรสภาพแวดล้อม เช่น `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` และ `QMD_GENERATE_MODEL` ในสภาพแวดล้อมรันไทม์ของ Gateway
</Note>

<AccordionGroup>
  <Accordion title="กำหนดการอัปเดต">
    | คีย์                       | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | ช่วงเวลาการรีเฟรช                      |
    | `update.debounceMs`       | `number`  | `15000` | หน่วงการเปลี่ยนแปลงไฟล์                 |
    | `update.onBoot`           | `boolean` | `true`  | รีเฟรชเมื่อผู้จัดการ QMD ที่ทำงานระยะยาวเปิดขึ้น; ตั้งเป็น false เพื่อข้ามการอัปเดตทันทีตอนบูต |
    | `update.startup`          | `string`  | `off`   | การเริ่มต้น QMD ตอน Gateway เริ่มทำงานแบบเลือกได้: `off`, `idle` หรือ `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | หน่วงเวลาก่อนที่การรีเฟรช `startup: "idle"` จะทำงาน |
    | `update.waitForBootSync`  | `boolean` | `false` | บล็อกการเปิดผู้จัดการจนกว่าการรีเฟรชครั้งแรกจะเสร็จ |
    | `update.embedInterval`    | `string`  | --      | จังหวะการ embed แยกต่างหาก                |
    | `update.commandTimeoutMs` | `number`  | --      | เวลาหมดอายุสำหรับคำสั่ง QMD              |
    | `update.updateTimeoutMs`  | `number`  | --      | เวลาหมดอายุสำหรับการดำเนินการอัปเดต QMD     |
    | `update.embedTimeoutMs`   | `number`  | --      | เวลาหมดอายุสำหรับการดำเนินการ embed ของ QMD      |
  </Accordion>
  <Accordion title="ขีดจำกัด">
    | คีย์                       | ประเภท     | ค่าเริ่มต้น | คำอธิบาย                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | ผลลัพธ์การค้นหาสูงสุด         |
    | `limits.maxSnippetChars`  | `number` | --      | จำกัดความยาว snippet       |
    | `limits.maxInjectedChars` | `number` | --      | จำกัดจำนวนอักขระที่ inject ทั้งหมด |
    | `limits.timeoutMs`        | `number` | `4000`  | เวลาหมดอายุการค้นหา             |
  </Accordion>
  <Accordion title="ขอบเขต">
    ควบคุมว่า session ใดสามารถรับผลลัพธ์การค้นหา QMD ได้ ใช้ schema เดียวกับ [`session.sendPolicy`](/th/gateway/config-agents#session):

    ```json5
    {
      memory: {
        qmd: {
          scope: {
            default: "deny",
            rules: [{ action: "allow", match: { chatType: "direct" } }],
          },
        },
      },
    }
    ```

    ค่าเริ่มต้นที่จัดส่งมาอนุญาต session แบบ direct และ channel แต่ยังคงปฏิเสธกลุ่ม

    ค่าเริ่มต้นคือเฉพาะ DM เท่านั้น `match.keyPrefix` ตรงกับคีย์ session ที่ normalize แล้ว; `match.rawKeyPrefix` ตรงกับคีย์ดิบที่รวม `agent:<id>:` ด้วย

  </Accordion>
  <Accordion title="การอ้างอิง">
    `memory.citations` ใช้กับ backend ทั้งหมด:

    | ค่า            | พฤติกรรม                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (ค่าเริ่มต้น) | รวมส่วนท้าย `Source: <path#line>` ใน snippet    |
    | `on`             | รวมส่วนท้ายเสมอ                               |
    | `off`            | ละเว้นส่วนท้าย (ยังส่ง path ให้ agent ภายใน) |

  </Accordion>
</AccordionGroup>

เมื่อเปิดใช้การเริ่มต้น QMD ตอน Gateway เริ่มทำงาน OpenClaw จะเริ่ม QMD เฉพาะสำหรับ agent ที่เข้าเกณฑ์เท่านั้น หาก `update.onBoot` เป็น true และไม่ได้กำหนดค่าการดูแลรักษา interval/embed การเริ่มต้นจะใช้ผู้จัดการแบบทำครั้งเดียวสำหรับการรีเฟรชตอนบูตแล้วปิด หากกำหนดค่า update หรือ embed interval ไว้ การเริ่มต้นจะเปิดผู้จัดการ QMD ที่ทำงานระยะยาวเพื่อให้เป็นเจ้าของ watcher และตัวจับเวลา interval; `update.onBoot: false` จะข้ามเฉพาะการรีเฟรชทันทีตอนบูตเท่านั้น

### ตัวอย่าง QMD แบบเต็ม

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming

กำหนดค่า Dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming` ไม่ใช่ภายใต้ `agents.defaults.memorySearch`

Dreaming ทำงานเป็นการกวาดตามกำหนดเวลาหนึ่งครั้ง และใช้เฟส light/deep/REM ภายในเป็นรายละเอียดการนำไปใช้

สำหรับพฤติกรรมเชิงแนวคิดและคำสั่ง slash โปรดดู [Dreaming](/th/concepts/dreaming)

### การตั้งค่าผู้ใช้

| คีย์                                    | ประเภท      | ค่าเริ่มต้น       | คำอธิบาย                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | เปิดหรือปิด Dreaming ทั้งหมด                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | จังหวะ Cron แบบเลือกได้สำหรับการกวาด Dreaming เต็มรูปแบบ                                                                                |
| `model`                                | `string`  | โมเดลเริ่มต้น | การ override โมเดล subagent ของ Dream Diary แบบเลือกได้                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | จำนวน token โดยประมาณสูงสุดที่เก็บจาก snippet การเรียกคืนระยะสั้นแต่ละรายการที่ promote เข้า `MEMORY.md`; metadata แหล่งที่มายังคงมองเห็นได้ |

### ตัวอย่าง

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming เขียนสถานะเครื่องไปยัง `memory/.dreams/`
- Dreaming เขียนผลลัพธ์ narrative ที่มนุษย์อ่านได้ไปยัง `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่)
- `dreaming.model` ใช้ trust gate ของ subagent ใน Plugin ที่มีอยู่; ตั้งค่า `plugins.entries.memory-core.subagent.allowModelOverride: true` ก่อนเปิดใช้
- Dream Diary ลองใหม่หนึ่งครั้งด้วยโมเดลเริ่มต้นของ session เมื่อโมเดลที่กำหนดค่าไว้ใช้งานไม่ได้ ความล้มเหลวของ trust หรือ allowlist จะถูกบันทึกใน log และจะไม่ถูกลองใหม่แบบเงียบ ๆ
- นโยบายและ threshold ของเฟส light/deep/REM เป็นพฤติกรรมภายใน ไม่ใช่ config ที่ผู้ใช้เห็น

</Note>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search)
