---
read_when:
    - คุณต้องการกำหนดค่าผู้ให้บริการค้นหาหน่วยความจำหรือโมเดล embedding
    - คุณต้องการตั้งค่าแบ็กเอนด์ QMD
    - คุณต้องการปรับแต่งการค้นหาแบบไฮบริด, MMR หรือการลดค่าน้ำหนักตามเวลา
    - คุณต้องการเปิดใช้งานการทำดัชนีหน่วยความจำแบบมัลติโมดัล
sidebarTitle: Memory config
summary: ปุ่มปรับแต่งการกำหนดค่าทั้งหมดสำหรับการค้นหาหน่วยความจำ ผู้ให้บริการ embedding, QMD, การค้นหาแบบไฮบริด และการทำดัชนีหลายรูปแบบ
title: ข้อมูลอ้างอิงการกำหนดค่า Memory
x-i18n:
    generated_at: "2026-06-27T18:19:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8f5880fef3fbdf81e546b0309a0e53459bae47e16efd787f87e34050d8c7b1e
    source_path: reference/memory-config.md
    workflow: 16
---

หน้านี้แสดงรายการปุ่มปรับแต่งการกำหนดค่าทั้งหมดสำหรับการค้นหาหน่วยความจำของ OpenClaw สำหรับภาพรวมเชิงแนวคิด โปรดดู:

<CardGroup cols={2}>
  <Card title="ภาพรวมหน่วยความจำ" href="/th/concepts/memory">
    วิธีการทำงานของหน่วยความจำ
  </Card>
  <Card title="เอนจินในตัว" href="/th/concepts/memory-builtin">
    แบ็กเอนด์ SQLite เริ่มต้น
  </Card>
  <Card title="เอนจิน QMD" href="/th/concepts/memory-qmd">
    ไซด์คาร์แบบเน้นภายในเครื่องก่อน
  </Card>
  <Card title="การค้นหาหน่วยความจำ" href="/th/concepts/memory-search">
    ไปป์ไลน์การค้นหาและการปรับแต่ง
  </Card>
  <Card title="Active Memory" href="/th/concepts/active-memory">
    ซับเอเจนต์หน่วยความจำสำหรับเซสชันแบบโต้ตอบ
  </Card>
</CardGroup>

การตั้งค่าการค้นหาหน่วยความจำทั้งหมดอยู่ใต้ `agents.defaults.memorySearch` ใน `openclaw.json` เว้นแต่จะระบุไว้เป็นอย่างอื่น

<Note>
หากคุณกำลังมองหาสวิตช์เปิดปิดฟีเจอร์ **active memory** และการกำหนดค่าซับเอเจนต์ สิ่งนั้นอยู่ใต้ `plugins.entries.active-memory` แทน `memorySearch`

Active memory ใช้โมเดลสองด่าน:

1. plugin ต้องเปิดใช้งานอยู่และชี้เป้าไปยังรหัสเอเจนต์ปัจจุบัน
2. คำขอต้องเป็นเซสชันแชตถาวรแบบโต้ตอบที่เข้าเกณฑ์

ดู [Active Memory](/th/concepts/active-memory) สำหรับโมเดลการเปิดใช้งาน การกำหนดค่าที่ plugin เป็นเจ้าของ การคงอยู่ของทรานสคริปต์ และรูปแบบการทยอยเปิดใช้อย่างปลอดภัย
</Note>

---

## การเลือกผู้ให้บริการ

| คีย์        | ชนิด      | ค่าเริ่มต้น          | คำอธิบาย                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`       | รหัสอะแดปเตอร์ embedding เช่น `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` หรือ `voyage`; อาจเป็น `models.providers.<id>` ที่กำหนดค่าไว้ ซึ่ง `api` ชี้ไปยังอะแดปเตอร์ embedding หน่วยความจำหรือ API โมเดลที่เข้ากันได้กับ OpenAI |
| `model`    | `string`  | ค่าเริ่มต้นของผู้ให้บริการ | ชื่อโมเดล embedding                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | รหัสอะแดปเตอร์ fallback เมื่อตัวหลักล้มเหลว                                                                                                                                                                                                                                                  |
| `enabled`  | `boolean` | `true`           | เปิดหรือปิดใช้งานการค้นหาหน่วยความจำ                                                                                                                                                                                                                                                             |

เมื่อไม่ได้ตั้งค่า `provider` OpenClaw จะใช้ embeddings ของ OpenAI ตั้งค่า `provider`
อย่างชัดเจนเพื่อใช้ Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, โมเดล GGUF ภายในเครื่อง หรือ endpoint `/v1/embeddings` ที่เข้ากันได้กับ OpenAI
การกำหนดค่าดั้งเดิมที่ยังระบุ `provider: "auto"` จะ resolve เป็น `openai`

<Warning>
การเปลี่ยนผู้ให้บริการ embedding, โมเดล, การตั้งค่าผู้ให้บริการ, แหล่งข้อมูล, ขอบเขต,
การแบ่ง chunk หรือ tokenizer อาจทำให้ดัชนีเวกเตอร์ SQLite ที่มีอยู่เข้ากันไม่ได้
OpenClaw จะหยุดการค้นหาเวกเตอร์ชั่วคราวและรายงานคำเตือนเกี่ยวกับตัวตนของดัชนีแทนการ
embedding ทุกอย่างใหม่โดยอัตโนมัติ สร้างใหม่เมื่อคุณพร้อมด้วย
`openclaw memory status --index --agent <id>` หรือ
`openclaw memory index --force --agent <id>`
</Warning>

เมื่อไม่ได้ตั้งค่า `provider` มี `provider: "auto"` ดั้งเดิมอยู่ หรือ
`provider: "none"` ตั้งใจเลือกโหมด FTS เท่านั้น การเรียกคืนหน่วยความจำยังสามารถ
ใช้การจัดอันดับ FTS แบบ lexical ได้เมื่อ embeddings ไม่พร้อมใช้งาน

ผู้ให้บริการที่ไม่ใช่ภายในเครื่องและระบุชัดเจนจะล้มเหลวแบบปิด หากคุณตั้ง `memorySearch.provider` เป็น
ผู้ให้บริการที่มีแบ็กเอนด์ระยะไกลแบบเจาะจง เช่น OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio หรือผู้ให้บริการแบบกำหนดเอง
ที่เข้ากันได้กับ OpenAI และผู้ให้บริการนั้นไม่พร้อมใช้งานขณะรันไทม์ `memory_search`
จะคืนผลลัพธ์ว่าไม่พร้อมใช้งานแทนการใช้การเรียกคืนแบบ FTS เท่านั้นอย่างเงียบ ๆ แก้ไข
การกำหนดค่าผู้ให้บริการ/การยืนยันตัวตน เปลี่ยนไปใช้ผู้ให้บริการที่เข้าถึงได้ หรือตั้ง
`provider: "none"` หากคุณต้องการการเรียกคืนแบบ FTS เท่านั้นโดยตั้งใจ

### รหัสผู้ให้บริการแบบกำหนดเอง

`memorySearch.provider` สามารถชี้ไปยังรายการ `models.providers.<id>` แบบกำหนดเองสำหรับอะแดปเตอร์ผู้ให้บริการเฉพาะหน่วยความจำ เช่น `ollama` หรือสำหรับ API โมเดลที่เข้ากันได้กับ OpenAI เช่น `openai-responses` / `openai-completions` OpenClaw จะ resolve เจ้าของ `api` ของผู้ให้บริการนั้นสำหรับอะแดปเตอร์ embedding พร้อมคงรหัสผู้ให้บริการแบบกำหนดเองไว้สำหรับ endpoint, auth และการจัดการคำนำหน้าโมเดล สิ่งนี้ทำให้การตั้งค่าแบบหลาย GPU หรือหลายโฮสต์สามารถอุทิศ embeddings หน่วยความจำให้กับ endpoint ภายในเครื่องเฉพาะได้:

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

embeddings ระยะไกลต้องใช้คีย์ API Bedrock ใช้ลำดับข้อมูลรับรองเริ่มต้นของ AWS SDK แทน (บทบาทอินสแตนซ์, SSO, access keys)

| ผู้ให้บริการ       | ตัวแปร Env                                            | คีย์การกำหนดค่า                          |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | ลำดับข้อมูลรับรอง AWS                               | ไม่ต้องใช้คีย์ API                   |
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
  URL ฐาน API แบบกำหนดเอง
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
    การเปลี่ยนโมเดลหรือ `outputDimensionality` จะเปลี่ยนตัวตนของดัชนี OpenClaw
    จะหยุดการค้นหาเวกเตอร์ชั่วคราวจนกว่าคุณจะสร้างดัชนีหน่วยความจำใหม่อย่างชัดเจน
    </Warning>

  </Accordion>
  <Accordion title="ชนิดอินพุตที่เข้ากันได้กับ OpenAI">
    endpoint embedding ที่เข้ากันได้กับ OpenAI สามารถเลือกใช้ฟิลด์คำขอ `input_type` เฉพาะผู้ให้บริการได้ สิ่งนี้มีประโยชน์สำหรับโมเดล embedding แบบไม่สมมาตรที่ต้องใช้ป้ายกำกับต่างกันสำหรับ embeddings ของคำค้นหาและเอกสาร

    | คีย์                 | ชนิด     | ค่าเริ่มต้น | คำอธิบาย                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | ไม่ได้ตั้งค่า   | `input_type` ที่ใช้ร่วมกันสำหรับ embeddings ของคำค้นหาและเอกสาร   |
    | `queryInputType`    | `string` | ไม่ได้ตั้งค่า   | `input_type` ตอนค้นหา; แทนที่ `inputType`          |
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

    การเปลี่ยนค่าเหล่านี้ส่งผลต่อ identity ของแคช embedding สำหรับการทำดัชนีแบบ batch ของผู้ให้บริการ และควรตามด้วยการทำ reindex หน่วยความจำเมื่อโมเดล upstream ปฏิบัติต่อป้ายกำกับต่างกัน

  </Accordion>
  <Accordion title="Bedrock">
    ### การกำหนดค่า embedding ของ Bedrock

    Bedrock ใช้ลำดับข้อมูลรับรองเริ่มต้นของ AWS SDK — ไม่ต้องใช้คีย์ API หาก OpenClaw รันบน EC2 ที่มีบทบาทอินสแตนซ์ซึ่งเปิดใช้งาน Bedrock เพียงตั้งค่าผู้ให้บริการและโมเดล:

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
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | รหัสโมเดล embedding ของ Bedrock ใดก็ได้  |
    | `outputDimensionality` | `number` | ค่าเริ่มต้นของโมเดล                  | สำหรับ Titan V2: 256, 512 หรือ 1024 |

    **โมเดลที่รองรับ** (พร้อมการตรวจจับตระกูลและค่าเริ่มต้นของมิติ):

    | รหัสโมเดล                                 | ผู้ให้บริการ | มิติเริ่มต้น | มิติที่กำหนดค่าได้    |
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

    ตัวแปรย่อยที่มีส่วนต่อท้ายด้าน throughput (เช่น `amazon.titan-embed-text-v1:2:8k`) จะสืบทอดการกำหนดค่าของโมเดลฐาน

    **การยืนยันตัวตน:** การยืนยันตัวตนของ Bedrock ใช้ลำดับการค้นหาข้อมูลประจำตัวมาตรฐานของ AWS SDK:

    1. ตัวแปรสภาพแวดล้อม (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. แคชโทเค็น SSO
    3. ข้อมูลประจำตัวโทเค็น Web identity
    4. ไฟล์ข้อมูลประจำตัวและไฟล์กำหนดค่าที่ใช้ร่วมกัน
    5. ข้อมูลประจำตัวเมทาดาทา ECS หรือ EC2

    Region จะถูกระบุจาก `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` ของผู้ให้บริการ `amazon-bedrock` หรือใช้ค่าเริ่มต้นเป็น `us-east-1`

    **สิทธิ์ IAM:** บทบาทหรือผู้ใช้ IAM ต้องมี:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    สำหรับสิทธิ์ขั้นต่ำ ให้จำกัดขอบเขต `InvokeModel` ไว้ที่โมเดลเฉพาะ:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="ภายในเครื่อง (GGUF + llama.cpp)">
    | คีย์                  | ประเภท            | ค่าเริ่มต้น             | คำอธิบาย                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | ดาวน์โหลดอัตโนมัติ     | พาธไปยังไฟล์โมเดล GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | ค่าเริ่มต้นของ node-llama-cpp | ไดเรกทอรีแคชสำหรับโมเดลที่ดาวน์โหลด                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | ขนาดหน้าต่างบริบทสำหรับบริบท embedding ค่า 4096 ครอบคลุมชิ้นข้อมูลทั่วไป (128–512 โทเค็น) พร้อมจำกัด VRAM ที่ไม่ใช่น้ำหนักโมเดล ลดเป็น 1024–2048 บนโฮสต์ที่มีข้อจำกัด `"auto"` ใช้ค่าสูงสุดที่โมเดลถูกฝึกมา ซึ่งไม่แนะนำสำหรับโมเดล 8B+ (Qwen3-Embedding-8B: 40 960 โทเค็น → VRAM ~32 GB เทียบกับ ~8.8 GB ที่ 4096) |

    ติดตั้งผู้ให้บริการ llama.cpp อย่างเป็นทางการก่อน: `openclaw plugins install @openclaw/llama-cpp-provider`
    โมเดลเริ่มต้น: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, ดาวน์โหลดอัตโนมัติ) การ checkout ซอร์สยังต้องอนุมัติ native build: `pnpm approve-builds` จากนั้น `pnpm rebuild node-llama-cpp`

    ใช้ CLI แบบสแตนด์อโลนเพื่อตรวจสอบพาธผู้ให้บริการเดียวกับที่ Gateway ใช้:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    ตั้งค่า `provider: "local"` อย่างชัดเจนสำหรับ embedding GGUF ภายในเครื่อง รองรับการอ้างอิงโมเดลแบบ `hf:` และ HTTP(S) สำหรับการกำหนดค่าภายในเครื่องแบบชัดเจน แต่สิ่งเหล่านี้จะไม่เปลี่ยนผู้ให้บริการเริ่มต้น

  </Accordion>
</AccordionGroup>

### timeout ของ embedding แบบ inline

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  แทนที่ timeout สำหรับชุด embedding แบบ inline ระหว่างการทำดัชนีหน่วยความจำ

เมื่อไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของผู้ให้บริการ: 600 วินาทีสำหรับผู้ให้บริการภายในเครื่อง/โฮสต์เอง เช่น `local`, `ollama` และ `lmstudio` และ 120 วินาทีสำหรับผู้ให้บริการแบบโฮสต์ เพิ่มค่านี้เมื่อชุด embedding ที่ใช้ CPU ภายในเครื่องทำงานปกติแต่ช้า
</ParamField>

---

## การกำหนดค่า hybrid search

ทั้งหมดอยู่ภายใต้ `memorySearch.query.hybrid`:

| คีย์                  | ประเภท   | ค่าเริ่มต้น | คำอธิบาย                         |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | เปิดใช้ hybrid BM25 + vector search |
| `vectorWeight`        | `number`  | `0.7`   | น้ำหนักสำหรับคะแนน vector (0-1)     |
| `textWeight`          | `number`  | `0.3`   | น้ำหนักสำหรับคะแนน BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | ตัวคูณขนาดพูลผู้สมัคร              |

<Tabs>
  <Tab title="MMR (ความหลากหลาย)">
    | คีย์          | ประเภท   | ค่าเริ่มต้น | คำอธิบาย                              |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | เปิดใช้การจัดอันดับซ้ำด้วย MMR       |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = ความหลากหลายสูงสุด, 1 = ความเกี่ยวข้องสูงสุด |
  </Tab>
  <Tab title="การลดน้ำหนักตามเวลา (ความใหม่)">
    | คีย์                         | ประเภท   | ค่าเริ่มต้น | คำอธิบาย                  |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | เปิดใช้การเพิ่มคะแนนตามความใหม่ |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | คะแนนลดลงครึ่งหนึ่งทุก N วัน |

    ไฟล์ที่ไม่ล้าสมัย (`MEMORY.md`, ไฟล์ที่ไม่มีวันที่ใน `memory/`) จะไม่มีการลดน้ำหนักตามเวลา

  </Tab>
</Tabs>

### ตัวอย่างแบบเต็ม

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

## พาธหน่วยความจำเพิ่มเติม

| คีย์         | ชนิด      | คำอธิบาย                              |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | ไดเรกทอรีหรือไฟล์เพิ่มเติมที่จะทำดัชนี |

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

พาธอาจเป็นแบบสัมบูรณ์หรืออิงตามเวิร์กสเปซก็ได้ ไดเรกทอรีจะถูกสแกนแบบเรียกซ้ำเพื่อหาไฟล์ `.md` การจัดการ symlink ขึ้นอยู่กับแบ็กเอนด์ที่ใช้งานอยู่: เอนจินในตัวจะละเว้น symlink ขณะที่ QMD จะทำตามพฤติกรรมของตัวสแกน QMD พื้นฐาน

สำหรับการค้นหาทรานสคริปต์ข้ามเอเจนต์ในขอบเขตเอเจนต์ ให้ใช้ `agents.list[].memorySearch.qmd.extraCollections` แทน `memory.qmd.paths` คอลเลกชันเพิ่มเติมเหล่านั้นใช้รูปแบบ `{ path, name, pattern? }` เดียวกัน แต่จะถูกผสานเป็นรายเอเจนต์และสามารถคงชื่อที่แชร์ไว้อย่างชัดเจนเมื่อพาธชี้ออกนอกเวิร์กสเปซปัจจุบัน หากพาธที่ resolve แล้วเดียวกันปรากฏทั้งใน `memory.qmd.paths` และ `memorySearch.qmd.extraCollections` QMD จะเก็บรายการแรกไว้และข้ามรายการที่ซ้ำ

---

## หน่วยความจำหลายรูปแบบ (Gemini)

ทำดัชนีรูปภาพและเสียงควบคู่กับ Markdown โดยใช้ Gemini Embedding 2:

| คีย์                      | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | เปิดใช้การทำดัชนีหลายรูปแบบ             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, หรือ `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | ขนาดไฟล์สูงสุดสำหรับการทำดัชนี             |

<Note>
ใช้กับไฟล์ใน `extraPaths` เท่านั้น รากหน่วยความจำเริ่มต้นยังคงเป็น Markdown เท่านั้น ต้องใช้ `gemini-embedding-2-preview` และ `fallback` ต้องเป็น `"none"`
</Note>

รูปแบบที่รองรับ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (รูปภาพ); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (เสียง)

---

## แคช Embedding

| คีย์               | ชนิด     | ค่าเริ่มต้น | คำอธิบาย                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | แคช chunk embeddings ใน SQLite |
| `cache.maxEntries` | `number`  | `50000` | จำนวน embeddings ที่แคชสูงสุด            |

ป้องกันการฝังข้อความเดิมซ้ำระหว่างการทำดัชนีใหม่หรือการอัปเดตทรานสคริปต์

---

## การทำดัชนีแบบแบตช์

| คีย์                          | ชนิด     | ค่าเริ่มต้น | คำอธิบาย                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | การฝังแบบอินไลน์ขนาน |
| `remote.batch.enabled`        | `boolean` | `false` | เปิดใช้ API การฝังแบบแบตช์ |
| `remote.batch.concurrency`    | `number`  | `2`     | งานแบตช์ขนาน        |
| `remote.batch.wait`           | `boolean` | `true`  | รอให้แบตช์เสร็จสมบูรณ์  |
| `remote.batch.pollIntervalMs` | `number`  | --      | ช่วงเวลาการ poll              |
| `remote.batch.timeoutMinutes` | `number`  | --      | หมดเวลาแบตช์              |

พร้อมใช้งานสำหรับ `openai`, `gemini` และ `voyage` โดยทั่วไปแบตช์ของ OpenAI จะเร็วที่สุดและประหยัดที่สุดสำหรับการเติมข้อมูลย้อนหลังจำนวนมาก

`remote.nonBatchConcurrency` ควบคุมการเรียกฝังแบบอินไลน์ที่ใช้โดยผู้ให้บริการแบบโลคัล/โฮสต์เอง และผู้ให้บริการแบบโฮสต์เมื่อ API แบตช์ของผู้ให้บริการไม่ได้เปิดใช้งาน Ollama ใช้ค่าเริ่มต้นเป็น `1` สำหรับการทำดัชนีแบบไม่ใช่แบตช์เพื่อหลีกเลี่ยงการทำให้โฮสต์โลคัลขนาดเล็กรับภาระหนักเกินไป ตั้งค่าให้สูงขึ้นบนเครื่องที่ใหญ่กว่า

ส่วนนี้แยกจาก `sync.embeddingBatchTimeoutSeconds` ซึ่งควบคุมการหมดเวลาสำหรับการเรียกฝังแบบอินไลน์

---

## การค้นหาหน่วยความจำของเซสชัน (ทดลอง)

ทำดัชนีทรานสคริปต์ของเซสชันและแสดงผ่าน `memory_search`:

| คีย์                          | ชนิด      | ค่าเริ่มต้น     | คำอธิบาย                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | เปิดใช้การทำดัชนีเซสชัน                 |
| `sources`                     | `string[]` | `["memory"]` | เพิ่ม `"sessions"` เพื่อรวมทรานสคริปต์ |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | เกณฑ์จำนวนไบต์สำหรับการทำดัชนีใหม่              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | เกณฑ์จำนวนข้อความสำหรับการทำดัชนีใหม่           |

<Warning>
การทำดัชนีเซสชันเป็นแบบเลือกเปิดใช้และทำงานแบบอะซิงโครนัส ผลลัพธ์อาจเก่าเล็กน้อย บันทึกเซสชันอยู่บนดิสก์ ดังนั้นให้ถือว่าการเข้าถึงระบบไฟล์เป็นขอบเขตความไว้วางใจ
</Warning>

---

## การเร่งความเร็วเวกเตอร์ SQLite (sqlite-vec)

| คีย์                          | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | ใช้ sqlite-vec สำหรับคิวรีเวกเตอร์ |
| `store.vector.extensionPath` | `string`  | ที่บันเดิลมา | แทนที่พาธ sqlite-vec          |

เมื่อ sqlite-vec ไม่พร้อมใช้งาน OpenClaw จะย้อนกลับไปใช้ความคล้ายคลึงแบบโคไซน์ในโปรเซสโดยอัตโนมัติ

---

## พื้นที่จัดเก็บดัชนี

ดัชนีหน่วยความจำในตัวจะอยู่ในฐานข้อมูล OpenClaw SQLite ของแต่ละเอเจนต์ที่
`agents/<agentId>/agent/openclaw-agent.sqlite`

| คีย์                   | ประเภท     | ค่าเริ่มต้น     | คำอธิบาย                               |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | ตัวตัดคำ FTS5 (`unicode61` หรือ `trigram`) |

---

## การกำหนดค่าแบ็กเอนด์ QMD

ตั้งค่า `memory.backend = "qmd"` เพื่อเปิดใช้งาน การตั้งค่า QMD ทั้งหมดอยู่ภายใต้ `memory.qmd`:

| คีย์                      | ประเภท      | ค่าเริ่มต้น  | คำอธิบาย                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | พาธไฟล์ปฏิบัติการ QMD; ตั้งค่าเป็นพาธแบบสัมบูรณ์เมื่อ service `PATH` ต่างจากเชลล์ของคุณ |
| `searchMode`             | `string`  | `search` | คำสั่งค้นหา: `search`, `vsearch`, `query`                                          |
| `rerank`                 | `boolean` | --       | ตั้งเป็น `false` พร้อม `searchMode: "query"` และ QMD 2.1+ เพื่อข้ามการจัดอันดับซ้ำของ QMD          |
| `includeDefaultMemory`   | `boolean` | `true`   | ทำดัชนี `MEMORY.md` + `memory/**/*.md` โดยอัตโนมัติ                                             |
| `paths[]`                | `array`   | --       | พาธเพิ่มเติม: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | ทำดัชนีทรานสคริปต์เซสชัน                                                             |
| `sessions.retentionDays` | `number`  | --       | ระยะเวลาเก็บทรานสคริปต์                                                                  |
| `sessions.exportDir`     | `string`  | --       | ไดเรกทอรีส่งออก                                                                      |

`searchMode: "search"` เป็นแบบ lexical/BM25 เท่านั้น OpenClaw จะไม่เรียกโพรบความพร้อมเวกเตอร์เชิงความหมายหรือการบำรุงรักษา embedding ของ QMD สำหรับโหมดนั้น รวมถึงระหว่าง `memory status --deep`; `vsearch` และ `query` ยังคงต้องใช้ความพร้อมเวกเตอร์และ embeddings ของ QMD

`rerank: false` เปลี่ยนเฉพาะโหมด `query` ของ QMD และต้องใช้ QMD 2.1 หรือใหม่กว่า ในโหมด CLI โดยตรง OpenClaw จะส่ง `--no-rerank`; ในโหมด MCP ที่มี mcporter รองรับ จะส่ง `rerank: false` ไปยังเครื่องมือคิวรีรวมของ QMD ปล่อยไว้ไม่ตั้งค่าเพื่อใช้พฤติกรรมการจัดอันดับซ้ำคิวรีเริ่มต้นของ QMD

OpenClaw ต้องการรูปแบบคอลเลกชัน QMD และคิวรี MCP ปัจจุบัน แต่ยังคงรองรับ QMD รุ่นเก่าด้วยการลองใช้แฟล็กรูปแบบคอลเลกชันที่เข้ากันได้และชื่อเครื่องมือ MCP รุ่นเก่าเมื่อจำเป็น เมื่อ QMD ประกาศว่ารองรับตัวกรองคอลเลกชันหลายรายการ คอลเลกชันจากแหล่งเดียวกันจะถูกค้นหาด้วยโปรเซส QMD เดียว; บิลด์ QMD รุ่นเก่าจะคงพาธความเข้ากันได้แบบต่อคอลเลกชัน แหล่งเดียวกันหมายถึงคอลเลกชันหน่วยความจำถาวรถูกจัดกลุ่มเข้าด้วยกัน ขณะที่คอลเลกชันทรานสคริปต์เซสชันยังคงเป็นอีกกลุ่มหนึ่งแยกต่างหาก เพื่อให้การกระจายแหล่งที่มายังคงมีอินพุตทั้งสองแบบ

<Note>
การแทนที่โมเดล QMD อยู่ฝั่ง QMD ไม่ใช่การกำหนดค่า OpenClaw หากคุณต้องแทนที่โมเดลของ QMD แบบทั่วระบบ ให้ตั้งค่าตัวแปรสภาพแวดล้อม เช่น `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` และ `QMD_GENERATE_MODEL` ในสภาพแวดล้อมรันไทม์ของ gateway
</Note>

<AccordionGroup>
  <Accordion title="Update schedule">
    | คีย์                       | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | ช่วงเวลาการรีเฟรช                      |
    | `update.debounceMs`       | `number`  | `15000` | หน่วงการเปลี่ยนแปลงไฟล์                 |
    | `update.onBoot`           | `boolean` | `true`  | รีเฟรชเมื่อผู้จัดการ QMD อายุยาวเปิด; ตั้ง false เพื่อข้ามการอัปเดตทันทีตอนบูต |
    | `update.startup`          | `string`  | `off`   | การเริ่มต้น QMD ตอน gateway เริ่มทำงานแบบไม่บังคับ: `off`, `idle` หรือ `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | หน่วงเวลาก่อนการรีเฟรช `startup: "idle"` ทำงาน |
    | `update.waitForBootSync`  | `boolean` | `false` | บล็อกการเปิดผู้จัดการจนกว่าการรีเฟรชเริ่มต้นจะเสร็จ |
    | `update.embedInterval`    | `string`  | --      | รอบเวลา embed แยกต่างหาก                |
    | `update.commandTimeoutMs` | `number`  | --      | หมดเวลาสำหรับคำสั่ง QMD              |
    | `update.updateTimeoutMs`  | `number`  | --      | หมดเวลาสำหรับการดำเนินการอัปเดต QMD     |
    | `update.embedTimeoutMs`   | `number`  | --      | หมดเวลาสำหรับการดำเนินการ embed ของ QMD      |
  </Accordion>
  <Accordion title="Limits">
    | คีย์                       | ประเภท     | ค่าเริ่มต้น | คำอธิบาย                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | ผลลัพธ์การค้นหาสูงสุด         |
    | `limits.maxSnippetChars`  | `number` | --      | จำกัดความยาว snippet       |
    | `limits.maxInjectedChars` | `number` | --      | จำกัดจำนวนอักขระที่ฉีดทั้งหมด |
    | `limits.timeoutMs`        | `number` | `4000`  | หมดเวลาการค้นหา             |
  </Accordion>
  <Accordion title="Scope">
    ควบคุมว่าเซสชันใดรับผลลัพธ์การค้นหา QMD ได้ สคีมาเดียวกับ [`session.sendPolicy`](/th/gateway/config-agents#session):

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

    ค่าเริ่มต้นที่จัดส่งมาอนุญาตเซสชันโดยตรงและเซสชันช่องทาง ขณะที่ยังคงปฏิเสธกลุ่ม

    ค่าเริ่มต้นคือเฉพาะ DM `match.keyPrefix` จับคู่กับคีย์เซสชันที่ normalize แล้ว; `match.rawKeyPrefix` จับคู่กับคีย์ดิบรวมถึง `agent:<id>:`.

  </Accordion>
  <Accordion title="Citations">
    `memory.citations` ใช้กับแบ็กเอนด์ทั้งหมด:

    | ค่า            | พฤติกรรม                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (ค่าเริ่มต้น) | รวมส่วนท้าย `Source: <path#line>` ใน snippets    |
    | `on`             | รวมส่วนท้ายเสมอ                               |
    | `off`            | ละเว้นส่วนท้าย (ยังส่งพาธให้เอเจนต์ภายใน) |

  </Accordion>
</AccordionGroup>

เมื่อเปิดใช้งานการเริ่มต้น QMD ตอน gateway เริ่มทำงาน OpenClaw จะเริ่ม QMD เฉพาะสำหรับเอเจนต์ที่มีสิทธิ์ หาก `update.onBoot` เป็น true และไม่ได้กำหนดค่าการบำรุงรักษาแบบ interval/embed การเริ่มทำงานจะใช้ผู้จัดการแบบ one-shot สำหรับการรีเฟรชตอนบูตแล้วปิด หากกำหนดค่าช่วงเวลา update หรือ embed การเริ่มทำงานจะเปิดผู้จัดการ QMD อายุยาว เพื่อให้เป็นเจ้าของ watcher และตัวจับเวลา interval ได้; `update.onBoot: false` จะข้ามเฉพาะการรีเฟรชทันทีตอนบูตเท่านั้น

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

Dreaming ถูกกำหนดค่าภายใต้ `plugins.entries.memory-core.config.dreaming` ไม่ใช่ภายใต้ `agents.defaults.memorySearch`

Dreaming ทำงานเป็นการกวาดตามกำหนดการครั้งเดียว และใช้เฟสภายในแบบ light/deep/REM เป็นรายละเอียดการใช้งานภายใน

สำหรับพฤติกรรมเชิงแนวคิดและคำสั่ง slash โปรดดู [Dreaming](/th/concepts/dreaming)

### การตั้งค่าผู้ใช้

| คีย์                                    | ประเภท      | ค่าเริ่มต้น       | คำอธิบาย                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | เปิดหรือปิด Dreaming ทั้งหมด                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | รอบเวลา Cron แบบไม่บังคับสำหรับการกวาด Dreaming แบบเต็ม                                                                                |
| `model`                                | `string`  | โมเดลเริ่มต้น | การแทนที่โมเดลซับเอเจนต์ Dream Diary แบบไม่บังคับ                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | จำนวนโทเค็นโดยประมาณสูงสุดที่เก็บจาก snippet การเรียกคืนระยะสั้นแต่ละรายการที่เลื่อนขึ้นไปยัง `MEMORY.md`; เมตาดาต้าแหล่งที่มายังคงมองเห็นได้ |

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
- Dreaming เขียนสถานะเครื่องไปที่ `memory/.dreams/`
- Dreaming เขียนเอาต์พุตเชิงบรรยายที่มนุษย์อ่านได้ไปที่ `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่)
- `dreaming.model` ใช้ trust gate ของซับเอเจนต์ Plugin ที่มีอยู่; ตั้งค่า `plugins.entries.memory-core.subagent.allowModelOverride: true` ก่อนเปิดใช้งาน
- Dream Diary ลองใหม่หนึ่งครั้งด้วยโมเดลเริ่มต้นของเซสชันเมื่อโมเดลที่กำหนดค่าไว้ไม่พร้อมใช้งาน ความล้มเหลวของ trust หรือ allowlist จะถูกบันทึกในล็อกและจะไม่ถูกลองใหม่แบบเงียบ ๆ
- นโยบายและเกณฑ์ของเฟส light/deep/REM เป็นพฤติกรรมภายใน ไม่ใช่การกำหนดค่าที่ผู้ใช้เห็น

</Note>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search)
