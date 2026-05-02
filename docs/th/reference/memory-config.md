---
read_when:
    - คุณต้องการกำหนดค่าผู้ให้บริการค้นหาหน่วยความจำหรือโมเดลการฝังข้อมูล
    - คุณต้องการตั้งค่าแบ็กเอนด์ QMD
    - คุณต้องการปรับแต่งการค้นหาแบบไฮบริด, MMR หรือการลดทอนตามเวลา
    - คุณต้องการเปิดใช้งานการทำดัชนีหน่วยความจำแบบหลายรูปแบบ
sidebarTitle: Memory config
summary: ตัวเลือกการกำหนดค่าทั้งหมดสำหรับการค้นหาหน่วยความจำ ผู้ให้บริการ embedding, QMD, การค้นหาแบบไฮบริด และการทำดัชนีแบบมัลติโหมด
title: ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ
x-i18n:
    generated_at: "2026-05-02T22:22:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99624a13b4e700da47a523206569d84c6750266fbb648ec73c463be9c5c285d0
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
    ซับเอเจนต์หน่วยความจำสำหรับเซสชันแบบโต้ตอบ
  </Card>
</CardGroup>

การตั้งค่าการค้นหาหน่วยความจำทั้งหมดอยู่ใต้ `agents.defaults.memorySearch` ใน `openclaw.json` เว้นแต่จะระบุไว้เป็นอย่างอื่น

<Note>
หากคุณกำลังมองหาสวิตช์เปิดปิดฟีเจอร์ **Active Memory** และการกำหนดค่าซับเอเจนต์ สิ่งนั้นจะอยู่ใต้ `plugins.entries.active-memory` แทนที่จะเป็น `memorySearch`

Active Memory ใช้โมเดลสองด่าน:

1. Plugin ต้องเปิดใช้งานและกำหนดเป้าหมายเป็น ID เอเจนต์ปัจจุบัน
2. คำขอต้องเป็นเซสชันแชทถาวรแบบโต้ตอบที่เข้าเกณฑ์

ดู [Active Memory](/th/concepts/active-memory) สำหรับโมเดลการเปิดใช้งาน การกำหนดค่าที่ Plugin เป็นเจ้าของ การคงอยู่ของทรานสคริปต์ และรูปแบบการเปิดใช้งานอย่างปลอดภัย
</Note>

---

## การเลือกผู้ให้บริการ

| คีย์        | ประเภท      | ค่าเริ่มต้น          | คำอธิบาย                                                                                                                                                                                                                        |
| ---------- | --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | ตรวจพบอัตโนมัติ    | ID อะแดปเตอร์ embedding เช่น `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` หรือ `voyage`; อาจเป็น `models.providers.<id>` ที่กำหนดค่าไว้ ซึ่ง `api` ชี้ไปยังอะแดปเตอร์เหล่านั้นรายการใดรายการหนึ่ง |
| `model`    | `string`  | ค่าเริ่มต้นของผู้ให้บริการ | ชื่อโมเดล embedding                                                                                                                                                                                                               |
| `fallback` | `string`  | `"none"`         | ID อะแดปเตอร์สำรองเมื่อตัวหลักล้มเหลว                                                                                                                                                                                         |
| `enabled`  | `boolean` | `true`           | เปิดหรือปิดการค้นหาหน่วยความจำ                                                                                                                                                                                                    |

### ลำดับการตรวจพบอัตโนมัติ

เมื่อไม่ได้ตั้งค่า `provider` OpenClaw จะเลือกตัวแรกที่พร้อมใช้งาน:

<Steps>
  <Step title="local">
    เลือกหากกำหนดค่า `memorySearch.local.modelPath` ไว้และไฟล์มีอยู่จริง
  </Step>
  <Step title="github-copilot">
    เลือกหากสามารถแก้ค่าโทเค็น GitHub Copilot ได้ (ตัวแปรสภาพแวดล้อมหรือโปรไฟล์การยืนยันตัวตน)
  </Step>
  <Step title="openai">
    เลือกหากสามารถแก้ค่า OpenAI key ได้
  </Step>
  <Step title="gemini">
    เลือกหากสามารถแก้ค่า Gemini key ได้
  </Step>
  <Step title="voyage">
    เลือกหากสามารถแก้ค่า Voyage key ได้
  </Step>
  <Step title="mistral">
    เลือกหากสามารถแก้ค่า Mistral key ได้
  </Step>
  <Step title="deepinfra">
    เลือกหากสามารถแก้ค่า DeepInfra key ได้
  </Step>
  <Step title="bedrock">
    เลือกหากสายโซ่ข้อมูลรับรองของ AWS SDK แก้ค่าได้ (บทบาทอินสแตนซ์, access keys, โปรไฟล์, SSO, web identity หรือการกำหนดค่าที่ใช้ร่วมกัน)
  </Step>
</Steps>

รองรับ `ollama` แต่ไม่ถูกตรวจพบอัตโนมัติ (ตั้งค่าอย่างชัดเจน)

### ID ผู้ให้บริการแบบกำหนดเอง

`memorySearch.provider` สามารถชี้ไปยังรายการ `models.providers.<id>` แบบกำหนดเองได้ OpenClaw จะแก้ค่าเจ้าของ `api` ของผู้ให้บริการนั้นสำหรับอะแดปเตอร์ embedding พร้อมคง ID ผู้ให้บริการแบบกำหนดเองไว้สำหรับ endpoint, auth และการจัดการคำนำหน้าโมเดล สิ่งนี้ช่วยให้การตั้งค่าแบบหลาย GPU หรือหลายโฮสต์สามารถอุทิศ embeddings ของหน่วยความจำให้กับ endpoint ภายในเครื่องเฉพาะได้:

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

### การแก้ค่า API key

Embeddings ระยะไกลต้องใช้ API key ส่วน Bedrock ใช้สายโซ่ข้อมูลรับรองเริ่มต้นของ AWS SDK แทน (บทบาทอินสแตนซ์, SSO, access keys)

| ผู้ให้บริการ       | ตัวแปรสภาพแวดล้อม                                            | คีย์การกำหนดค่า                          |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | สายโซ่ข้อมูลรับรอง AWS                               | ไม่ต้องใช้ API key                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | โปรไฟล์การยืนยันตัวตนผ่านการเข้าสู่ระบบด้วยอุปกรณ์       |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (ตัวยึดตำแหน่ง)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth ครอบคลุมเฉพาะแชท/การเติมข้อความเท่านั้น และไม่ตอบสนองคำขอ embedding
</Note>

---

## การกำหนดค่า endpoint ระยะไกล

สำหรับ endpoint แบบเข้ากันได้กับ OpenAI ที่กำหนดเอง หรือการแทนที่ค่าเริ่มต้นของผู้ให้บริการ:

<ParamField path="remote.baseUrl" type="string">
  URL ฐาน API แบบกำหนดเอง
</ParamField>
<ParamField path="remote.apiKey" type="string">
  แทนที่ API key
</ParamField>
<ParamField path="remote.headers" type="object">
  ส่วนหัว HTTP เพิ่มเติม (ผสานกับค่าเริ่มต้นของผู้ให้บริการ)
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
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
    | คีย์                    | ประเภท     | ค่าเริ่มต้น                | คำอธิบาย                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | รองรับ `gemini-embedding-2-preview` ด้วย |
    | `outputDimensionality` | `number` | `3072`                 | สำหรับ Embedding 2: 768, 1536 หรือ 3072        |

    <Warning>
    การเปลี่ยนโมเดลหรือ `outputDimensionality` จะทริกเกอร์การทำดัชนีใหม่ทั้งหมดโดยอัตโนมัติ
    </Warning>

  </Accordion>
  <Accordion title="ประเภทอินพุตที่เข้ากันได้กับ OpenAI">
    endpoint embedding ที่เข้ากันได้กับ OpenAI สามารถเลือกใช้ฟิลด์คำขอ `input_type` เฉพาะผู้ให้บริการได้ สิ่งนี้มีประโยชน์สำหรับโมเดล embedding แบบอสมมาตรที่ต้องใช้ป้ายกำกับต่างกันสำหรับ embeddings ของคำค้นหาและเอกสาร

    | คีย์                 | ประเภท     | ค่าเริ่มต้น | คำอธิบาย                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | ไม่ได้ตั้งค่า   | `input_type` ที่ใช้ร่วมกันสำหรับ embeddings ของคำค้นหาและเอกสาร   |
    | `queryInputType`    | `string` | ไม่ได้ตั้งค่า   | `input_type` ตอนค้นหา; แทนที่ `inputType`          |
    | `documentInputType` | `string` | ไม่ได้ตั้งค่า   | `input_type` สำหรับดัชนี/เอกสาร; แทนที่ `inputType`      |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "env:EMBEDDINGS_API_KEY",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    การเปลี่ยนค่าเหล่านี้มีผลต่อเอกลักษณ์ของแคช embedding สำหรับการทำดัชนีแบบแบตช์ของผู้ให้บริการ และควรตามด้วยการทำดัชนีหน่วยความจำใหม่เมื่อโมเดลต้นทางปฏิบัติกับป้ายกำกับต่างกัน

  </Accordion>
  <Accordion title="Bedrock">
    ### การกำหนดค่า embedding ของ Bedrock

    Bedrock ใช้สายโซ่ข้อมูลรับรองเริ่มต้นของ AWS SDK จึงไม่ต้องใช้ API key หาก OpenClaw ทำงานบน EC2 ด้วยบทบาทอินสแตนซ์ที่เปิดใช้ Bedrock แล้ว เพียงตั้งค่าผู้ให้บริการและโมเดล:

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

    | คีย์                    | ประเภท     | ค่าเริ่มต้น                        | คำอธิบาย                     |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | ID โมเดล embedding ของ Bedrock ใดก็ได้  |
    | `outputDimensionality` | `number` | ค่าเริ่มต้นของโมเดล                  | สำหรับ Titan V2: 256, 512 หรือ 1024 |

    **โมเดลที่รองรับ** (พร้อมการตรวจพบตระกูลและค่าเริ่มต้นของมิติ):

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

    รุ่นที่มีคำต่อท้าย throughput (เช่น `amazon.titan-embed-text-v1:2:8k`) จะสืบทอดการกำหนดค่าของโมเดลฐาน

    **การยืนยันตัวตน:** auth ของ Bedrock ใช้ลำดับการแก้ค่าข้อมูลรับรอง AWS SDK มาตรฐาน:

    1. ตัวแปรสภาพแวดล้อม (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. แคชโทเค็น SSO
    3. ข้อมูลรับรองโทเค็น web identity
    4. ไฟล์ข้อมูลรับรองและไฟล์กำหนดค่าที่ใช้ร่วมกัน
    5. ข้อมูลรับรองเมทาดาทา ECS หรือ EC2

    ภูมิภาคถูกแก้ค่าจาก `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` ของผู้ให้บริการ `amazon-bedrock` หรือใช้ค่าเริ่มต้นเป็น `us-east-1`

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
  <Accordion title="ภายในเครื่อง (GGUF + node-llama-cpp)">
    | คีย์                   | ชนิด               | ค่าเริ่มต้น                | คำอธิบาย                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | ดาวน์โหลดอัตโนมัติ        | พาธไปยังไฟล์โมเดล GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | ค่าเริ่มต้นของ node-llama-cpp | ไดเรกทอรีแคชสำหรับโมเดลที่ดาวน์โหลด                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | ขนาดหน้าต่างบริบทสำหรับบริบท embedding 4096 ครอบคลุมชิ้นข้อมูลทั่วไป (128–512 โทเค็น) พร้อมจำกัด VRAM ที่ไม่ใช่น้ำหนักโมเดล ลดลงเป็น 1024–2048 บนโฮสต์ที่มีทรัพยากรจำกัด `"auto"` ใช้ค่าสูงสุดที่โมเดลถูกฝึกมา ซึ่งไม่แนะนำสำหรับโมเดล 8B+ (Qwen3-Embedding-8B: 40 960 โทเค็น → VRAM ~32 GB เทียบกับ ~8.8 GB ที่ 4096) |

    โมเดลเริ่มต้น: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, ดาวน์โหลดอัตโนมัติ) เช็กเอาต์ซอร์สยังต้องอนุมัติการ build แบบ native: `pnpm approve-builds` แล้วตามด้วย `pnpm rebuild node-llama-cpp`

    ใช้ CLI แบบสแตนด์อโลนเพื่อตรวจสอบพาธ provider เดียวกับที่ Gateway ใช้:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    หาก `provider` เป็น `auto` ระบบจะเลือก `local` เฉพาะเมื่อ `local.modelPath` ชี้ไปยังไฟล์ภายในเครื่องที่มีอยู่เท่านั้น ยังสามารถใช้การอ้างอิงโมเดลแบบ `hf:` และ HTTP(S) อย่างชัดเจนกับ `provider: "local"` ได้ แต่สิ่งเหล่านี้จะไม่ทำให้ `auto` เลือก local ก่อนที่โมเดลจะพร้อมใช้งานบนดิสก์

  </Accordion>
</AccordionGroup>

### ไทม์เอาต์ของ inline embedding

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  แทนที่ไทม์เอาต์สำหรับชุด inline embedding ระหว่างการทำดัชนีหน่วยความจำ

เมื่อไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ provider: 600 วินาทีสำหรับ provider ภายในเครื่อง/โฮสต์เอง เช่น `local`, `ollama` และ `lmstudio` และ 120 วินาทีสำหรับ provider ที่โฮสต์ให้ เพิ่มค่านี้เมื่อชุด embedding ที่ผูกกับ CPU ภายในเครื่องทำงานปกติแต่ช้า
</ParamField>

---

## การกำหนดค่า hybrid search

ทั้งหมดอยู่ใต้ `memorySearch.query.hybrid`:

| คีย์                   | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | เปิดใช้ hybrid BM25 + vector search |
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
  <Tab title="การลดค่าตามเวลา (ความใหม่)">
    | คีย์                          | ชนิด      | ค่าเริ่มต้น | คำอธิบาย               |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | เปิดใช้การเพิ่มคะแนนจากความใหม่      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | คะแนนลดลงครึ่งหนึ่งทุก N วัน |

    ไฟล์ที่ใช้ได้เสมอ (`MEMORY.md`, ไฟล์ที่ไม่มีวันที่ใน `memory/`) จะไม่ถูกลดค่า

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

## พาธหน่วยความจำเพิ่มเติม

| คีย์          | ชนิด       | คำอธิบาย                              |
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

พาธอาจเป็นแบบสัมบูรณ์หรือสัมพันธ์กับ workspace ก็ได้ ไดเรกทอรีจะถูกสแกนแบบเรียกซ้ำเพื่อหาไฟล์ `.md` การจัดการ symlink ขึ้นอยู่กับ backend ที่ใช้งานอยู่: engine ในตัวจะละเว้น symlink ส่วน QMD จะทำตามพฤติกรรมของสแกนเนอร์ QMD พื้นฐาน

สำหรับการค้นหาทรานสคริปต์ข้าม agent แบบจำกัดขอบเขตตาม agent ให้ใช้ `agents.list[].memorySearch.qmd.extraCollections` แทน `memory.qmd.paths` คอลเลกชันเพิ่มเติมเหล่านั้นมีรูปแบบ `{ path, name, pattern? }` เดียวกัน แต่จะถูกรวมแยกตามแต่ละ agent และสามารถรักษาชื่อที่ใช้ร่วมกันอย่างชัดเจนไว้ได้เมื่อพาธชี้ออกนอก workspace ปัจจุบัน หากพาธที่ resolve แล้วเดียวกันปรากฏทั้งใน `memory.qmd.paths` และ `memorySearch.qmd.extraCollections` QMD จะเก็บรายการแรกและข้ามรายการที่ซ้ำ

---

## หน่วยความจำแบบมัลติโมดัล (Gemini)

ทำดัชนีรูปภาพและเสียงควบคู่กับ Markdown โดยใช้ Gemini Embedding 2:

| คีย์                       | ชนิด       | ค่าเริ่มต้น    | คำอธิบาย                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | เปิดใช้การทำดัชนีแบบมัลติโมดัล             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, หรือ `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | ขนาดไฟล์สูงสุดสำหรับการทำดัชนี             |

<Note>
ใช้กับไฟล์ใน `extraPaths` เท่านั้น รูทหน่วยความจำเริ่มต้นยังคงรองรับเฉพาะ Markdown ต้องใช้ `gemini-embedding-2-preview` `fallback` ต้องเป็น `"none"`
</Note>

รูปแบบที่รองรับ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (รูปภาพ); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (เสียง)

---

## แคช Embedding

| คีย์               | ประเภท    | ค่าเริ่มต้น | คำอธิบาย                         |
| ------------------ | --------- | ----------- | --------------------------------- |
| `cache.enabled`    | `boolean` | `false`     | แคช embedding ของชังก์ใน SQLite |
| `cache.maxEntries` | `number`  | `50000`     | จำนวน embedding ที่แคชได้สูงสุด |

ป้องกันการ embedding ข้อความที่ไม่เปลี่ยนแปลงซ้ำระหว่าง reindex หรือการอัปเดต transcript

---

## การทำดัชนีแบบแบตช์

| คีย์                          | ประเภท    | ค่าเริ่มต้น | คำอธิบาย                     |
| ----------------------------- | --------- | ----------- | ----------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`         | embedding แบบ inline แบบขนาน |
| `remote.batch.enabled`        | `boolean` | `false`     | เปิดใช้ API การ embedding แบบแบตช์ |
| `remote.batch.concurrency`    | `number`  | `2`         | งานแบตช์แบบขนาน             |
| `remote.batch.wait`           | `boolean` | `true`      | รอให้แบตช์เสร็จสมบูรณ์       |
| `remote.batch.pollIntervalMs` | `number`  | --          | ช่วงเวลาการ poll             |
| `remote.batch.timeoutMinutes` | `number`  | --          | หมดเวลาของแบตช์              |

พร้อมใช้งานสำหรับ `openai`, `gemini` และ `voyage` โดยทั่วไปแบตช์ของ OpenAI จะเร็วที่สุดและประหยัดที่สุดสำหรับการ backfill ขนาดใหญ่

`remote.nonBatchConcurrency` ควบคุมการเรียก embedding แบบ inline ที่ผู้ให้บริการแบบ local/self-hosted และผู้ให้บริการแบบ hosted ใช้เมื่อ API แบบแบตช์ของผู้ให้บริการไม่ได้เปิดใช้งาน Ollama มีค่าเริ่มต้นเป็น `1` สำหรับการทำดัชนีแบบไม่ใช่แบตช์เพื่อหลีกเลี่ยงการทำให้โฮสต์ local ขนาดเล็กทำงานหนักเกินไป ให้ตั้งค่าสูงขึ้นบนเครื่องที่ใหญ่กว่า

ค่านี้แยกจาก `sync.embeddingBatchTimeoutSeconds` ซึ่งควบคุมเวลาหมดอายุสำหรับการเรียก embedding แบบ inline

---

## การค้นหาหน่วยความจำเซสชัน (ทดลอง)

ทำดัชนี transcript ของเซสชันและแสดงผลผ่าน `memory_search`:

| คีย์                          | ประเภท     | ค่าเริ่มต้น | คำอธิบาย                              |
| ----------------------------- | ---------- | ------------ | -------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | เปิดใช้การทำดัชนีเซสชัน              |
| `sources`                     | `string[]` | `["memory"]` | เพิ่ม `"sessions"` เพื่อรวม transcript |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | เกณฑ์จำนวนไบต์สำหรับ reindex          |
| `sync.sessions.deltaMessages` | `number`   | `50`         | เกณฑ์จำนวนข้อความสำหรับ reindex       |

<Warning>
การทำดัชนีเซสชันเป็นแบบเลือกเปิดใช้และทำงานแบบ asynchronous ผลลัพธ์อาจล้าสมัยเล็กน้อย บันทึกเซสชันอยู่บนดิสก์ ดังนั้นให้ถือว่าการเข้าถึงระบบไฟล์เป็นขอบเขตความเชื่อถือ
</Warning>

---

## การเร่งความเร็วเวกเตอร์ SQLite (sqlite-vec)

| คีย์                         | ประเภท    | ค่าเริ่มต้น | คำอธิบาย                         |
| ---------------------------- | --------- | ----------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`      | ใช้ sqlite-vec สำหรับคำค้นเวกเตอร์ |
| `store.vector.extensionPath` | `string`  | ที่รวมมาให้ | แทนที่พาธ sqlite-vec              |

เมื่อ sqlite-vec ไม่พร้อมใช้งาน OpenClaw จะ fallback ไปใช้ cosine similarity ภายในโปรเซสโดยอัตโนมัติ

---

## ที่จัดเก็บดัชนี

| คีย์                  | ประเภท   | ค่าเริ่มต้น                         | คำอธิบาย                                  |
| --------------------- | -------- | ----------------------------------- | ------------------------------------------ |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | ตำแหน่งดัชนี (รองรับโทเค็น `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                         | tokenizer ของ FTS5 (`unicode61` หรือ `trigram`) |

---

## การกำหนดค่า backend ของ QMD

ตั้งค่า `memory.backend = "qmd"` เพื่อเปิดใช้ การตั้งค่า QMD ทั้งหมดอยู่ใต้ `memory.qmd`:

| คีย์                     | ประเภท    | ค่าเริ่มต้น | คำอธิบาย                                                                            |
| ------------------------ | --------- | ----------- | ------------------------------------------------------------------------------------ |
| `command`                | `string`  | `qmd`       | พาธ executable ของ QMD; ตั้งเป็นพาธแบบ absolute เมื่อ `PATH` ของบริการต่างจาก shell ของคุณ |
| `searchMode`             | `string`  | `search`    | คำสั่งค้นหา: `search`, `vsearch`, `query`                                           |
| `includeDefaultMemory`   | `boolean` | `true`      | ทำดัชนี `MEMORY.md` + `memory/**/*.md` โดยอัตโนมัติ                                 |
| `paths[]`                | `array`   | --          | พาธเพิ่มเติม: `{ name, path, pattern? }`                                            |
| `sessions.enabled`       | `boolean` | `false`     | ทำดัชนี transcript ของเซสชัน                                                        |
| `sessions.retentionDays` | `number`  | --          | ระยะเวลาเก็บรักษา transcript                                                        |
| `sessions.exportDir`     | `string`  | --          | ไดเรกทอรีส่งออก                                                                      |

`searchMode: "search"` เป็นแบบอิงคำศัพท์/BM25 เท่านั้น OpenClaw จะไม่รันการตรวจสอบความพร้อมของเวกเตอร์เชิงความหมายหรือการบำรุงรักษาการฝังเวกเตอร์ของ QMD สำหรับโหมดนั้น รวมถึงระหว่าง `memory status --deep`; `vsearch` และ `query` ยังคงต้องใช้ความพร้อมของเวกเตอร์ QMD และการฝังเวกเตอร์

OpenClaw เลือกรูปแบบคอลเลกชัน QMD และรูปแบบคิวรี MCP ปัจจุบันเป็นหลัก แต่ยังคงรองรับรุ่น QMD ที่เก่ากว่าโดยลองใช้แฟล็กรูปแบบคอลเลกชันที่เข้ากันได้และชื่อเครื่องมือ MCP รุ่นเก่าเมื่อจำเป็น เมื่อ QMD ประกาศว่ารองรับตัวกรองคอลเลกชันหลายรายการ คอลเลกชันจากแหล่งเดียวกันจะถูกค้นหาด้วยกระบวนการ QMD เดียว; บิลด์ QMD ที่เก่ากว่าจะยังใช้เส้นทางความเข้ากันได้แบบต่อคอลเลกชัน แหล่งเดียวกันหมายถึงคอลเลกชันหน่วยความจำถาวรจะถูกจัดกลุ่มเข้าด้วยกัน ขณะที่คอลเลกชันบันทึกถอดความของเซสชันยังคงเป็นกลุ่มแยกต่างหาก เพื่อให้การกระจายแหล่งที่มายังคงมีอินพุตทั้งสองแบบ

<Note>
การแทนที่โมเดล QMD จะอยู่ฝั่ง QMD ไม่ใช่ในคอนฟิก OpenClaw หากคุณต้องการแทนที่โมเดลของ QMD แบบทั่วทั้งระบบ ให้ตั้งค่าตัวแปรสภาพแวดล้อม เช่น `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` และ `QMD_GENERATE_MODEL` ในสภาพแวดล้อมรันไทม์ของ gateway
</Note>

<AccordionGroup>
  <Accordion title="Update schedule">
    | คีย์                       | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | ช่วงเวลาการรีเฟรช                      |
    | `update.debounceMs`       | `number`  | `15000` | หน่วงการเปลี่ยนแปลงไฟล์                 |
    | `update.onBoot`           | `boolean` | `true`  | รีเฟรชเมื่อเปิดตัวจัดการ QMD ที่ทำงานระยะยาว; ยังเป็นตัวกำหนดการรีเฟรชตอนเริ่มต้นแบบเลือกใช้ |
    | `update.startup`          | `string`  | `off`   | การรีเฟรชเมื่อ Gateway เริ่มทำงานแบบไม่บังคับ: `off`, `idle` หรือ `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | หน่วงเวลาก่อนการรีเฟรช `startup: "idle"` จะทำงาน |
    | `update.waitForBootSync`  | `boolean` | `false` | บล็อกการเปิดตัวจัดการจนกว่าการรีเฟรชเริ่มต้นจะเสร็จ |
    | `update.embedInterval`    | `string`  | --      | จังหวะการฝังเวกเตอร์แยกต่างหาก                |
    | `update.commandTimeoutMs` | `number`  | --      | เวลาหมดอายุสำหรับคำสั่ง QMD              |
    | `update.updateTimeoutMs`  | `number`  | --      | เวลาหมดอายุสำหรับการดำเนินการอัปเดต QMD     |
    | `update.embedTimeoutMs`   | `number`  | --      | เวลาหมดอายุสำหรับการดำเนินการฝังเวกเตอร์ QMD      |
  </Accordion>
  <Accordion title="Limits">
    | คีย์                       | ประเภท     | ค่าเริ่มต้น | คำอธิบาย                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | จำนวนผลการค้นหาสูงสุด         |
    | `limits.maxSnippetChars`  | `number` | --      | จำกัดความยาวของส่วนย่อ       |
    | `limits.maxInjectedChars` | `number` | --      | จำกัดจำนวนอักขระที่แทรกรวม |
    | `limits.timeoutMs`        | `number` | `4000`  | เวลาหมดอายุการค้นหา             |
  </Accordion>
  <Accordion title="Scope">
    ควบคุมว่าเซสชันใดสามารถรับผลการค้นหา QMD ได้ ใช้สคีมาเดียวกับ [`session.sendPolicy`](/th/gateway/config-agents#session):

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

    ค่าเริ่มต้นที่จัดส่งมาจะอนุญาตเซสชันแบบ direct และ channel ขณะที่ยังปฏิเสธ groups

    ค่าเริ่มต้นคือเฉพาะ DM เท่านั้น `match.keyPrefix` จับคู่กับคีย์เซสชันที่ทำให้เป็นรูปแบบมาตรฐานแล้ว; `match.rawKeyPrefix` จับคู่กับคีย์ดิบรวมถึง `agent:<id>:`

  </Accordion>
  <Accordion title="Citations">
    `memory.citations` ใช้กับแบ็กเอนด์ทั้งหมด:

    | ค่า            | พฤติกรรม                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (ค่าเริ่มต้น) | รวมส่วนท้าย `Source: <path#line>` ในส่วนย่อ    |
    | `on`             | รวมส่วนท้ายเสมอ                               |
    | `off`            | ไม่รวมส่วนท้าย (ยังส่งเส้นทางให้ agent ภายใน) |

  </Accordion>
</AccordionGroup>

การรีเฟรชตอนบูตของ QMD ใช้เส้นทางกระบวนการย่อยแบบครั้งเดียวระหว่างที่ gateway เริ่มทำงาน ตัวจัดการ QMD ที่ทำงานระยะยาวยังคงเป็นเจ้าของตัวเฝ้าดูไฟล์และตัวจับเวลาช่วงเวลาปกติเมื่อเปิดการค้นหาหน่วยความจำเพื่อใช้งานแบบโต้ตอบ

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

Dreaming กำหนดค่าอยู่ภายใต้ `plugins.entries.memory-core.config.dreaming` ไม่ใช่ภายใต้ `agents.defaults.memorySearch`

Dreaming ทำงานเป็นการกวาดตามกำหนดการหนึ่งครั้ง และใช้เฟสภายในแบบ light/deep/REM เป็นรายละเอียดการติดตั้งใช้งาน

สำหรับพฤติกรรมเชิงแนวคิดและคำสั่ง slash โปรดดู [Dreaming](/th/concepts/dreaming)

### การตั้งค่าผู้ใช้

| คีย์         | ประเภท      | ค่าเริ่มต้น       | คำอธิบาย                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | เปิดหรือปิด dreaming ทั้งหมด               |
| `frequency` | `string`  | `0 3 * * *`   | จังหวะ cron แบบไม่บังคับสำหรับการกวาด dreaming แบบเต็ม |
| `model`     | `string`  | โมเดลเริ่มต้น | การแทนที่โมเดล subagent ของ Dream Diary แบบไม่บังคับ      |

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
- Dreaming เขียนผลลัพธ์แบบบรรยายที่มนุษย์อ่านได้ไปยัง `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่)
- `dreaming.model` ใช้เกตความเชื่อถือของ plugin subagent ที่มีอยู่; ตั้งค่า `plugins.entries.memory-core.subagent.allowModelOverride: true` ก่อนเปิดใช้งาน
- Dream Diary จะลองใหม่หนึ่งครั้งด้วยโมเดลเริ่มต้นของเซสชันเมื่อโมเดลที่กำหนดค่าไว้ไม่พร้อมใช้งาน ความล้มเหลวด้านความเชื่อถือหรือ allowlist จะถูกบันทึกและจะไม่ลองใหม่แบบเงียบๆ
- นโยบายและเกณฑ์ของเฟส light/deep/REM เป็นพฤติกรรมภายใน ไม่ใช่คอนฟิกที่แสดงต่อผู้ใช้

</Note>

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search)
