---
read_when:
    - คุณต้องการกำหนดค่าผู้ให้บริการค้นหาหน่วยความจำหรือโมเดลการฝังข้อมูล
    - คุณต้องการตั้งค่าแบ็กเอนด์ QMD
    - คุณต้องการปรับแต่งการค้นหาแบบไฮบริด, MMR หรือการลดทอนตามเวลา
    - คุณต้องการเปิดใช้งานการทำดัชนีหน่วยความจำแบบหลายรูปแบบ
sidebarTitle: Memory config
summary: ตัวเลือกการกำหนดค่าทั้งหมดสำหรับการค้นหาหน่วยความจำ ผู้ให้บริการ embedding, QMD, การค้นหาแบบไฮบริด และการทำดัชนีหลายโมดัล
title: ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ
x-i18n:
    generated_at: "2026-04-30T16:30:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58b75751a19afb883fd7646cf5f71859f95bac468b2bfd8cc79db12ae892f70f
    source_path: reference/memory-config.md
    workflow: 16
---

หน้านี้แสดงรายการตัวเลือกการกำหนดค่าทุกตัวสำหรับการค้นหาหน่วยความจำของ OpenClaw สำหรับภาพรวมเชิงแนวคิด โปรดดู:

<CardGroup cols={2}>
  <Card title="ภาพรวมหน่วยความจำ" href="/th/concepts/memory">
    วิธีการทำงานของหน่วยความจำ
  </Card>
  <Card title="เอนจินในตัว" href="/th/concepts/memory-builtin">
    แบ็กเอนด์ SQLite เริ่มต้น
  </Card>
  <Card title="เอนจิน QMD" href="/th/concepts/memory-qmd">
    sidecar ที่ให้ความสำคัญกับเครื่องภายในเป็นหลัก
  </Card>
  <Card title="การค้นหาหน่วยความจำ" href="/th/concepts/memory-search">
    ไปป์ไลน์การค้นหาและการปรับแต่ง
  </Card>
  <Card title="Active Memory" href="/th/concepts/active-memory">
    เอเจนต์ย่อยของหน่วยความจำสำหรับเซสชันแบบโต้ตอบ
  </Card>
</CardGroup>

การตั้งค่าการค้นหาหน่วยความจำทั้งหมดอยู่ภายใต้ `agents.defaults.memorySearch` ใน `openclaw.json` เว้นแต่จะระบุไว้เป็นอย่างอื่น

<Note>
หากคุณกำลังมองหาสวิตช์เปิด/ปิดฟีเจอร์ **Active Memory** และการกำหนดค่าเอเจนต์ย่อย สิ่งนั้นอยู่ภายใต้ `plugins.entries.active-memory` แทน `memorySearch`

Active Memory ใช้โมเดลแบบสองด่าน:

1. Plugin ต้องเปิดใช้งานและกำหนดเป้าหมายไปยังรหัสเอเจนต์ปัจจุบัน
2. คำขอต้องเป็นเซสชันแชทถาวรแบบโต้ตอบที่มีสิทธิ์

ดู [Active Memory](/th/concepts/active-memory) สำหรับโมเดลการเปิดใช้งาน การกำหนดค่าที่ Plugin เป็นเจ้าของ การคงอยู่ของทรานสคริปต์ และรูปแบบการทยอยเปิดใช้อย่างปลอดภัย
</Note>

---

## การเลือกผู้ให้บริการ

| คีย์       | ประเภท    | ค่าเริ่มต้น       | คำอธิบาย                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | ตรวจพบอัตโนมัติ  | รหัสอะแดปเตอร์ embedding เช่น `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` หรือ `voyage`; อาจเป็น `models.providers.<id>` ที่กำหนดค่าไว้ซึ่ง `api` ชี้ไปยังอะแดปเตอร์ใดอะแดปเตอร์หนึ่งเหล่านั้นก็ได้ |
| `model`    | `string`  | ค่าเริ่มต้นของผู้ให้บริการ | ชื่อโมเดล embedding                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | รหัสอะแดปเตอร์สำรองเมื่อตัวหลักล้มเหลว                                                                                                                                                                                     |
| `enabled`  | `boolean` | `true`           | เปิดหรือปิดการค้นหาหน่วยความจำ                                                                                                                                                                                            |

### ลำดับการตรวจพบอัตโนมัติ

เมื่อไม่ได้ตั้งค่า `provider` OpenClaw จะเลือกตัวแรกที่พร้อมใช้งาน:

<Steps>
  <Step title="local">
    เลือกหากกำหนดค่า `memorySearch.local.modelPath` แล้วและไฟล์มีอยู่
  </Step>
  <Step title="github-copilot">
    เลือกหากสามารถระบุโทเค็น GitHub Copilot ได้ (ตัวแปร env หรือโปรไฟล์ auth)
  </Step>
  <Step title="openai">
    เลือกหากสามารถระบุคีย์ OpenAI ได้
  </Step>
  <Step title="gemini">
    เลือกหากสามารถระบุคีย์ Gemini ได้
  </Step>
  <Step title="voyage">
    เลือกหากสามารถระบุคีย์ Voyage ได้
  </Step>
  <Step title="mistral">
    เลือกหากสามารถระบุคีย์ Mistral ได้
  </Step>
  <Step title="deepinfra">
    เลือกหากสามารถระบุคีย์ DeepInfra ได้
  </Step>
  <Step title="bedrock">
    เลือกหากเชนข้อมูลประจำตัวของ AWS SDK ระบุได้สำเร็จ (บทบาทอินสแตนซ์ คีย์เข้าถึง โปรไฟล์ SSO ข้อมูลระบุตัวตนเว็บ หรือการกำหนดค่าที่ใช้ร่วมกัน)
  </Step>
</Steps>

รองรับ `ollama` แต่จะไม่ถูกตรวจพบอัตโนมัติ (ตั้งค่าอย่างชัดเจน)

### รหัสผู้ให้บริการแบบกำหนดเอง

`memorySearch.provider` สามารถชี้ไปยังรายการ `models.providers.<id>` แบบกำหนดเองได้ OpenClaw จะระบุเจ้าของ `api` ของผู้ให้บริการนั้นสำหรับอะแดปเตอร์ embedding พร้อมคงรหัสผู้ให้บริการแบบกำหนดเองไว้สำหรับการจัดการ endpoint, auth และคำนำหน้าโมเดล สิ่งนี้ช่วยให้การตั้งค่าแบบหลาย GPU หรือหลายโฮสต์สามารถจัดสรร embedding หน่วยความจำให้กับ endpoint ภายในเครื่องเฉพาะได้:

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

### การระบุ API key

embedding ระยะไกลต้องใช้ API key ส่วน Bedrock ใช้เชนข้อมูลประจำตัวเริ่มต้นของ AWS SDK แทน (บทบาทอินสแตนซ์, SSO, คีย์เข้าถึง)

| ผู้ให้บริการ    | ตัวแปร Env                                         | คีย์การกำหนดค่า                    |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | เชนข้อมูลประจำตัว AWS                              | ไม่ต้องใช้ API key                  |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | โปรไฟล์ Auth ผ่านการเข้าสู่ระบบด้วยอุปกรณ์ |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (ตัวยึดตำแหน่ง)                  | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth ครอบคลุมเฉพาะแชท/การเติมข้อความให้สมบูรณ์เท่านั้น และไม่ตอบสนองคำขอ embedding
</Note>

---

## การกำหนดค่า endpoint ระยะไกล

สำหรับ endpoint แบบกำหนดเองที่เข้ากันได้กับ OpenAI หรือการเขียนทับค่าเริ่มต้นของผู้ให้บริการ:

<ParamField path="remote.baseUrl" type="string">
  URL ฐาน API แบบกำหนดเอง
</ParamField>
<ParamField path="remote.apiKey" type="string">
  เขียนทับ API key
</ParamField>
<ParamField path="remote.headers" type="object">
  ส่วนหัว HTTP เพิ่มเติม (รวมกับค่าเริ่มต้นของผู้ให้บริการ)
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
    | คีย์                   | ประเภท   | ค่าเริ่มต้น             | คำอธิบาย                                  |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | รองรับ `gemini-embedding-2-preview` ด้วย |
    | `outputDimensionality` | `number` | `3072`                 | สำหรับ Embedding 2: 768, 1536 หรือ 3072  |

    <Warning>
    การเปลี่ยนโมเดลหรือ `outputDimensionality` จะทริกเกอร์การทำดัชนีใหม่ทั้งหมดโดยอัตโนมัติ
    </Warning>

  </Accordion>
  <Accordion title="ประเภทอินพุตที่เข้ากันได้กับ OpenAI">
    endpoint embedding ที่เข้ากันได้กับ OpenAI สามารถเลือกใช้ฟิลด์คำขอ `input_type` เฉพาะผู้ให้บริการได้ สิ่งนี้มีประโยชน์สำหรับโมเดล embedding แบบไม่สมมาตรที่ต้องใช้ป้ายกำกับต่างกันสำหรับ embedding ของคำค้นและเอกสาร

    | คีย์                | ประเภท   | ค่าเริ่มต้น | คำอธิบาย                                           |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | ไม่ได้ตั้งค่า | `input_type` ที่ใช้ร่วมกันสำหรับ embedding ของคำค้นและเอกสาร |
    | `queryInputType`    | `string` | ไม่ได้ตั้งค่า | `input_type` ณ เวลาค้นหา; เขียนทับ `inputType`          |
    | `documentInputType` | `string` | ไม่ได้ตั้งค่า | `input_type` ของดัชนี/เอกสาร; เขียนทับ `inputType`      |

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

    การเปลี่ยนค่าเหล่านี้มีผลต่อ identity ของแคช embedding สำหรับการทำดัชนีแบบแบตช์ของผู้ให้บริการ และควรตามด้วยการทำดัชนีหน่วยความจำใหม่เมื่อโมเดลต้นทางปฏิบัติต่อป้ายกำกับแตกต่างกัน

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock ใช้เชนข้อมูลประจำตัวเริ่มต้นของ AWS SDK — ไม่ต้องใช้ API key หาก OpenClaw ทำงานบน EC2 พร้อมบทบาทอินสแตนซ์ที่เปิดใช้ Bedrock ไว้ เพียงตั้งค่าผู้ให้บริการและโมเดล:

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

    | คีย์                   | ประเภท   | ค่าเริ่มต้น                    | คำอธิบาย                    |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | รหัสโมเดล embedding ของ Bedrock ใดก็ได้ |
    | `outputDimensionality` | `number` | ค่าเริ่มต้นของโมเดล            | สำหรับ Titan V2: 256, 512 หรือ 1024 |

    **โมเดลที่รองรับ** (พร้อมการตรวจหาตระกูลและค่าเริ่มต้นของมิติ):

    | รหัสโมเดล                                  | ผู้ให้บริการ | มิติเริ่มต้น | มิติที่กำหนดค่าได้ |
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

    ตัวแปรที่มีส่วนต่อท้าย throughput (เช่น `amazon.titan-embed-text-v1:2:8k`) จะสืบทอดการกำหนดค่าของโมเดลพื้นฐาน

    **การยืนยันตัวตน:** auth ของ Bedrock ใช้ลำดับการระบุข้อมูลประจำตัวมาตรฐานของ AWS SDK:

    1. ตัวแปรสภาพแวดล้อม (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. แคชโทเค็น SSO
    3. ข้อมูลประจำตัวโทเค็น web identity
    4. ไฟล์ข้อมูลประจำตัวและการกำหนดค่าที่ใช้ร่วมกัน
    5. ข้อมูลประจำตัวจากเมทาดาทา ECS หรือ EC2

    Region จะถูกระบุจาก `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` ของผู้ให้บริการ `amazon-bedrock` หรือใช้ค่าเริ่มต้นเป็น `us-east-1`

    **สิทธิ์ IAM:** บทบาทหรือผู้ใช้ IAM ต้องมี:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    สำหรับสิทธิ์เท่าที่จำเป็น ให้จำกัดขอบเขต `InvokeModel` ไปยังโมเดลเฉพาะ:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | คีย์                   | ชนิด               | ค่าเริ่มต้น                | คำอธิบาย                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | ดาวน์โหลดอัตโนมัติ        | พาธไปยังไฟล์โมเดล GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | ค่าเริ่มต้นของ node-llama-cpp | ไดเรกทอรีแคชสำหรับโมเดลที่ดาวน์โหลด                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | ขนาดหน้าต่างบริบทสำหรับบริบท embedding 4096 ครอบคลุม chunk ทั่วไป (128–512 โทเค็น) พร้อมจำกัด VRAM ที่ไม่ใช่น้ำหนักโมเดล ลดลงเป็น 1024–2048 บนโฮสต์ที่มีทรัพยากรจำกัด `"auto"` ใช้ค่าสูงสุดที่โมเดลถูกฝึกมา ซึ่งไม่แนะนำสำหรับโมเดล 8B+ (Qwen3-Embedding-8B: 40 960 โทเค็น → VRAM ~32 GB เทียบกับ ~8.8 GB ที่ 4096) |

    โมเดลเริ่มต้น: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, ดาวน์โหลดอัตโนมัติ) การติดตั้งแบบแพ็กเกจจะซ่อมแซม runtime แบบเนทีฟของ `node-llama-cpp` ผ่าน dependency ของ runtime Plugin ที่จัดการให้ เมื่อกำหนดค่า `provider: "local"` ไว้ การ checkout จากซอร์สยังต้องอนุมัติการ build แบบเนทีฟ: `pnpm approve-builds` แล้วจึง `pnpm rebuild node-llama-cpp`

    ใช้ CLI แบบสแตนด์อโลนเพื่อตรวจสอบพาธ provider เดียวกับที่ Gateway ใช้:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    หาก `provider` เป็น `auto` จะเลือก `local` เฉพาะเมื่อ `local.modelPath` ชี้ไปยังไฟล์ local ที่มีอยู่แล้วเท่านั้น ยังสามารถใช้การอ้างอิงโมเดลแบบ `hf:` และ HTTP(S) อย่างชัดเจนกับ `provider: "local"` ได้ แต่สิ่งเหล่านี้จะไม่ทำให้ `auto` เลือก local ก่อนที่โมเดลจะพร้อมใช้งานบนดิสก์

  </Accordion>
</AccordionGroup>

### หมดเวลา embedding แบบ inline

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  แทนที่ค่า timeout สำหรับแบทช์ embedding แบบ inline ระหว่างการทำดัชนีหน่วยความจำ

เมื่อไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ provider: 600 วินาทีสำหรับ provider แบบ local/self-hosted เช่น `local`, `ollama`, และ `lmstudio` และ 120 วินาทีสำหรับ provider แบบ hosted เพิ่มค่านี้เมื่อแบทช์ embedding ที่ใช้ CPU ของ local ทำงานปกติแต่ช้า
</ParamField>

---

## การกำหนดค่า Hybrid search

ทั้งหมดอยู่ใต้ `memorySearch.query.hybrid`:

| คีย์                   | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | เปิดใช้ hybrid BM25 + vector search |
| `vectorWeight`        | `number`  | `0.7`   | น้ำหนักสำหรับคะแนน vector (0-1)     |
| `textWeight`          | `number`  | `0.3`   | น้ำหนักสำหรับคะแนน BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | ตัวคูณขนาดกลุ่ม candidate     |

<Tabs>
  <Tab title="MMR (diversity)">
    | คีย์           | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                          |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | เปิดใช้การจัดอันดับใหม่ด้วย MMR                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = ความหลากหลายสูงสุด, 1 = ความเกี่ยวข้องสูงสุด |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | คีย์                          | ชนิด      | ค่าเริ่มต้น | คำอธิบาย               |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | เปิดใช้การเพิ่มคะแนนตามความใหม่      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | คะแนนลดลงครึ่งหนึ่งทุก N วัน |

    ไฟล์ evergreen (`MEMORY.md`, ไฟล์ที่ไม่ระบุวันที่ใน `memory/`) จะไม่ถูกลดคะแนนตามเวลา

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

พาธอาจเป็นแบบ absolute หรือสัมพันธ์กับ workspace ก็ได้ ไดเรกทอรีจะถูกสแกนแบบ recursive เพื่อหาไฟล์ `.md` การจัดการ symlink ขึ้นอยู่กับ backend ที่ใช้งานอยู่: engine ในตัวจะละเว้น symlink ส่วน QMD จะทำตามพฤติกรรมของ scanner QMD พื้นฐาน

สำหรับการค้นหา transcript ข้าม agent แบบจำกัดขอบเขตตาม agent ให้ใช้ `agents.list[].memorySearch.qmd.extraCollections` แทน `memory.qmd.paths` collection เพิ่มเติมเหล่านั้นใช้รูปแบบ `{ path, name, pattern? }` เดียวกัน แต่จะถูก merge แยกตาม agent และสามารถคงชื่อ shared ที่ระบุอย่างชัดเจนไว้ได้เมื่อพาธชี้ออกนอก workspace ปัจจุบัน หากพาธที่ resolve แล้วเดียวกันปรากฏทั้งใน `memory.qmd.paths` และ `memorySearch.qmd.extraCollections` QMD จะเก็บรายการแรกไว้และข้ามรายการซ้ำ

---

## หน่วยความจำแบบ Multimodal (Gemini)

ทำดัชนีรูปภาพและเสียงควบคู่กับ Markdown โดยใช้ Gemini Embedding 2:

| คีย์                       | ชนิด       | ค่าเริ่มต้น    | คำอธิบาย                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | เปิดใช้การทำดัชนีแบบ multimodal             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, หรือ `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | ขนาดไฟล์สูงสุดสำหรับการทำดัชนี             |

<Note>
ใช้กับไฟล์ใน `extraPaths` เท่านั้น root หน่วยความจำเริ่มต้นยังคงเป็น Markdown เท่านั้น ต้องใช้ `gemini-embedding-2-preview` `fallback` ต้องเป็น `"none"`
</Note>

รูปแบบที่รองรับ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (รูปภาพ); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (เสียง)

---

## แคช Embedding

| คีย์                | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | แคช chunk embedding ใน SQLite |
| `cache.maxEntries` | `number`  | `50000` | จำนวน embedding ที่แคชสูงสุด            |

ป้องกันการ embed ข้อความที่ไม่เปลี่ยนแปลงซ้ำระหว่างการทำดัชนีใหม่หรือการอัปเดต transcript

---

## การทำดัชนีแบบแบทช์

| คีย์                           | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | embedding แบบ inline ที่ทำงานพร้อมกัน |
| `remote.batch.enabled`        | `boolean` | `false` | เปิดใช้ API embedding แบบแบทช์ |
| `remote.batch.concurrency`    | `number`  | `2`     | งานแบทช์ที่ทำงานพร้อมกัน        |
| `remote.batch.wait`           | `boolean` | `true`  | รอให้แบทช์เสร็จสมบูรณ์  |
| `remote.batch.pollIntervalMs` | `number`  | --      | ช่วงเวลาการ poll              |
| `remote.batch.timeoutMinutes` | `number`  | --      | timeout ของแบทช์              |

พร้อมใช้งานสำหรับ `openai`, `gemini`, และ `voyage` โดยทั่วไปแบทช์ของ OpenAI จะเร็วที่สุดและประหยัดที่สุดสำหรับการ backfill ขนาดใหญ่

`remote.nonBatchConcurrency` ควบคุมการเรียก embedding แบบ inline ที่ใช้โดย provider แบบ local/self-hosted และ provider แบบ hosted เมื่อ API แบบแบทช์ของ provider ไม่ได้เปิดใช้งาน Ollama มีค่าเริ่มต้นเป็น `1` สำหรับการทำดัชนีแบบ non-batch เพื่อหลีกเลี่ยงการใช้งานโฮสต์ local ขนาดเล็กหนักเกินไป ตั้งค่าที่สูงขึ้นบนเครื่องขนาดใหญ่กว่า

ค่านี้แยกจาก `sync.embeddingBatchTimeoutSeconds` ซึ่งควบคุม timeout สำหรับการเรียก embedding แบบ inline

---

## การค้นหาหน่วยความจำเซสชัน (ทดลอง)

ทำดัชนี transcript ของเซสชันและแสดงผ่าน `memory_search`:

| คีย์                           | ชนิด       | ค่าเริ่มต้น      | คำอธิบาย                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | เปิดใช้การทำดัชนีเซสชัน                 |
| `sources`                     | `string[]` | `["memory"]` | เพิ่ม `"sessions"` เพื่อรวม transcript |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | เกณฑ์จำนวนไบต์สำหรับการทำดัชนีใหม่              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | เกณฑ์จำนวนข้อความสำหรับการทำดัชนีใหม่           |

<Warning>
การทำดัชนีเซสชันเป็นแบบ opt-in และทำงานแบบ asynchronous ผลลัพธ์อาจล้าหลังเล็กน้อย บันทึกเซสชันอยู่บนดิสก์ ดังนั้นให้ถือว่าการเข้าถึง filesystem เป็นขอบเขตความไว้วางใจ
</Warning>

---

## การเร่งความเร็ว vector ของ SQLite (sqlite-vec)

| คีย์                          | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | ใช้ sqlite-vec สำหรับการ query แบบ vector |
| `store.vector.extensionPath` | `string`  | มาพร้อมแพ็กเกจ | แทนที่พาธ sqlite-vec          |

เมื่อ sqlite-vec ไม่พร้อมใช้งาน OpenClaw จะ fallback ไปใช้ cosine similarity ภายใน process โดยอัตโนมัติ

---

## ที่เก็บดัชนี

| คีย์                   | ชนิด     | ค่าเริ่มต้น                               | คำอธิบาย                                 |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | ตำแหน่งดัชนี (รองรับโทเค็น `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | tokenizer ของ FTS5 (`unicode61` หรือ `trigram`)   |

---

## การกำหนดค่า backend QMD

ตั้งค่า `memory.backend = "qmd"` เพื่อเปิดใช้ การตั้งค่า QMD ทั้งหมดอยู่ใต้ `memory.qmd`:

| คีย์                      | ประเภท      | ค่าเริ่มต้น  | คำอธิบาย                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | พาธไฟล์ปฏิบัติการ QMD; ตั้งเป็นพาธแบบสมบูรณ์เมื่อ `PATH` ของบริการต่างจาก shell ของคุณ |
| `searchMode`             | `string`  | `search` | คำสั่งค้นหา: `search`, `vsearch`, `query`                                          |
| `includeDefaultMemory`   | `boolean` | `true`   | จัดทำดัชนี `MEMORY.md` + `memory/**/*.md` อัตโนมัติ                                             |
| `paths[]`                | `array`   | --       | พาธเพิ่มเติม: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | จัดทำดัชนีบันทึกข้อความของเซสชัน                                                             |
| `sessions.retentionDays` | `number`  | --       | ระยะเวลาการเก็บรักษาบันทึกข้อความ                                                                  |
| `sessions.exportDir`     | `string`  | --       | ไดเรกทอรีส่งออก                                                                      |

`searchMode: "search"` เป็นแบบ lexical/BM25 เท่านั้น OpenClaw จะไม่เรียกใช้การตรวจสอบความพร้อมของเวกเตอร์เชิงความหมายหรือการดูแลรักษา embedding ของ QMD สำหรับโหมดนั้น รวมถึงระหว่าง `memory status --deep`; `vsearch` และ `query` ยังคงต้องใช้ความพร้อมของเวกเตอร์ QMD และ embeddings

OpenClaw จะเลือกใช้รูปแบบคอลเลกชัน QMD และคิวรี MCP ปัจจุบัน แต่ยังคงรองรับ QMD รุ่นเก่าด้วยการลองใช้แฟล็กรูปแบบคอลเลกชันที่เข้ากันได้และชื่อเครื่องมือ MCP รุ่นเก่าเมื่อจำเป็น เมื่อ QMD ประกาศว่ารองรับตัวกรองคอลเลกชันหลายรายการ คอลเลกชันจากแหล่งเดียวกันจะถูกค้นหาด้วยกระบวนการ QMD เดียว ส่วนบิลด์ QMD รุ่นเก่าจะยังใช้เส้นทางความเข้ากันได้แบบแยกตามคอลเลกชัน แหล่งเดียวกันหมายถึงคอลเลกชันหน่วยความจำถาวรจะถูกจัดกลุ่มร่วมกัน ขณะที่คอลเลกชันบันทึกข้อความของเซสชันยังคงเป็นอีกกลุ่มแยกต่างหาก เพื่อให้การกระจายแหล่งที่มายังคงมีอินพุตทั้งสองแบบ

<Note>
การ override โมเดล QMD จะอยู่ฝั่ง QMD ไม่ใช่การกำหนดค่า OpenClaw หากคุณต้องการ override โมเดลของ QMD แบบทั่วระบบ ให้ตั้งค่าตัวแปรสภาพแวดล้อม เช่น `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` และ `QMD_GENERATE_MODEL` ในสภาพแวดล้อม runtime ของ gateway
</Note>

<AccordionGroup>
  <Accordion title="Update schedule">
    | คีย์                       | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | ช่วงเวลาการรีเฟรช                      |
    | `update.debounceMs`       | `number`  | `15000` | หน่วงการเปลี่ยนแปลงไฟล์                 |
    | `update.onBoot`           | `boolean` | `true`  | รีเฟรชเมื่อ QMD manager แบบระยะยาวเปิดขึ้น; และยังควบคุมการรีเฟรชตอนเริ่มต้นแบบเลือกเปิด |
    | `update.startup`          | `string`  | `off`   | การรีเฟรชเสริมเมื่อเริ่ม Gateway: `off`, `idle` หรือ `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | หน่วงเวลาก่อนที่การรีเฟรช `startup: "idle"` จะทำงาน |
    | `update.waitForBootSync`  | `boolean` | `false` | บล็อกการเปิด manager จนกว่าการรีเฟรชเริ่มต้นจะเสร็จสิ้น |
    | `update.embedInterval`    | `string`  | --      | จังหวะเวลา embed แยกต่างหาก                |
    | `update.commandTimeoutMs` | `number`  | --      | หมดเวลาสำหรับคำสั่ง QMD              |
    | `update.updateTimeoutMs`  | `number`  | --      | หมดเวลาสำหรับการดำเนินการอัปเดต QMD     |
    | `update.embedTimeoutMs`   | `number`  | --      | หมดเวลาสำหรับการดำเนินการ embed ของ QMD      |
  </Accordion>
  <Accordion title="Limits">
    | คีย์                       | ประเภท     | ค่าเริ่มต้น | คำอธิบาย                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | จำนวนผลการค้นหาสูงสุด         |
    | `limits.maxSnippetChars`  | `number` | --      | จำกัดความยาว snippet       |
    | `limits.maxInjectedChars` | `number` | --      | จำกัดจำนวนอักขระที่ inject ทั้งหมด |
    | `limits.timeoutMs`        | `number` | `4000`  | หมดเวลาการค้นหา             |
  </Accordion>
  <Accordion title="Scope">
    ควบคุมว่าเซสชันใดสามารถรับผลการค้นหา QMD ได้ ใช้ schema เดียวกับ [`session.sendPolicy`](/th/gateway/config-agents#session):

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

    ค่าเริ่มต้นที่มาพร้อมระบบอนุญาตเซสชันแบบ direct และ channel แต่ยังคงปฏิเสธ groups

    ค่าเริ่มต้นคือเฉพาะ DM `match.keyPrefix` จะจับคู่กับคีย์เซสชันที่ normalized แล้ว; `match.rawKeyPrefix` จะจับคู่กับคีย์ดิบรวมถึง `agent:<id>:` ด้วย

  </Accordion>
  <Accordion title="Citations">
    `memory.citations` ใช้กับ backend ทั้งหมด:

    | ค่า            | พฤติกรรม                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (ค่าเริ่มต้น) | รวม footer `Source: <path#line>` ใน snippets    |
    | `on`             | รวม footer เสมอ                               |
    | `off`            | ละเว้น footer (ยังส่งพาธให้ agent ภายใน) |

  </Accordion>
</AccordionGroup>

การรีเฟรชตอนบูตของ QMD ใช้เส้นทาง subprocess แบบครั้งเดียวระหว่างการเริ่มต้น Gateway QMD manager แบบระยะยาวยังคงเป็นเจ้าของ file watcher และ interval timers ปกติเมื่อเปิดการค้นหาหน่วยความจำสำหรับการใช้งานแบบโต้ตอบ

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

Dreaming กำหนดค่าอยู่ใต้ `plugins.entries.memory-core.config.dreaming` ไม่ใช่ใต้ `agents.defaults.memorySearch`

Dreaming ทำงานเป็นการกวาดตามกำหนดการครั้งเดียว และใช้เฟส light/deep/REM ภายในเป็นรายละเอียดการนำไปใช้

สำหรับพฤติกรรมเชิงแนวคิดและคำสั่ง slash โปรดดู [Dreaming](/th/concepts/dreaming)

### การตั้งค่าผู้ใช้

| คีย์         | ประเภท      | ค่าเริ่มต้น       | คำอธิบาย                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | เปิดหรือปิด dreaming ทั้งหมด               |
| `frequency` | `string`  | `0 3 * * *`   | จังหวะ cron เสริมสำหรับการกวาด dreaming แบบเต็ม |
| `model`     | `string`  | โมเดลเริ่มต้น | การ override โมเดล subagent ของ Dream Diary แบบเสริม      |

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
- Dreaming เขียนเอาต์พุตบรรยายที่มนุษย์อ่านได้ไปยัง `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่)
- `dreaming.model` ใช้ trust gate ของ subagent Plugin ที่มีอยู่; ตั้งค่า `plugins.entries.memory-core.subagent.allowModelOverride: true` ก่อนเปิดใช้
- Dream Diary จะลองซ้ำหนึ่งครั้งด้วยโมเดลเริ่มต้นของเซสชันเมื่อโมเดลที่กำหนดค่าไว้ไม่พร้อมใช้งาน ความล้มเหลวจาก trust หรือ allowlist จะถูกบันทึกลง log และจะไม่ถูกลองซ้ำแบบเงียบ ๆ
- นโยบายและ threshold ของเฟส light/deep/REM เป็นพฤติกรรมภายใน ไม่ใช่การกำหนดค่าที่ผู้ใช้เห็น

</Note>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search)
