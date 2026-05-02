---
read_when:
    - คุณต้องการกำหนดค่าผู้ให้บริการค้นหาหน่วยความจำหรือโมเดลฝังเวกเตอร์
    - คุณต้องการตั้งค่าแบ็กเอนด์ QMD
    - คุณต้องการปรับแต่งการค้นหาแบบไฮบริด, MMR หรือการลดค่าน้ำหนักตามเวลา
    - คุณต้องการเปิดใช้งานการทำดัชนีหน่วยความจำแบบมัลติโมดัล
sidebarTitle: Memory config
summary: ตัวเลือกการกำหนดค่าทั้งหมดสำหรับการค้นหาหน่วยความจำ ผู้ให้บริการการฝังเวกเตอร์ QMD การค้นหาแบบไฮบริด และการจัดทำดัชนีแบบมัลติโมดัล
title: เอกสารอ้างอิงการกำหนดค่าหน่วยความจำ
x-i18n:
    generated_at: "2026-05-02T10:28:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11c4723b536338a777ec45673ca3c1a8c26834d6875dd4eb96617a570a55c5f5
    source_path: reference/memory-config.md
    workflow: 16
---

หน้านี้แสดงรายการค่ากำหนดทุกตัวสำหรับการค้นหาหน่วยความจำของ OpenClaw สำหรับภาพรวมเชิงแนวคิด ดูที่:

<CardGroup cols={2}>
  <Card title="ภาพรวมหน่วยความจำ" href="/th/concepts/memory">
    วิธีการทำงานของหน่วยความจำ
  </Card>
  <Card title="เอนจินในตัว" href="/th/concepts/memory-builtin">
    แบ็กเอนด์ SQLite เริ่มต้น
  </Card>
  <Card title="เอนจิน QMD" href="/th/concepts/memory-qmd">
    ไซด์คาร์ที่ให้ความสำคัญกับเครื่อง local ก่อน
  </Card>
  <Card title="การค้นหาหน่วยความจำ" href="/th/concepts/memory-search">
    ไปป์ไลน์การค้นหาและการปรับแต่ง
  </Card>
  <Card title="Active Memory" href="/th/concepts/active-memory">
    เอเจนต์ย่อยหน่วยความจำสำหรับเซสชันแบบโต้ตอบ
  </Card>
</CardGroup>

การตั้งค่าการค้นหาหน่วยความจำทั้งหมดอยู่ใต้ `agents.defaults.memorySearch` ใน `openclaw.json` เว้นแต่จะระบุไว้เป็นอย่างอื่น

<Note>
หากคุณกำลังมองหาสวิตช์เปิดปิดฟีเจอร์ **Active Memory** และการกำหนดค่าเอเจนต์ย่อย ค่านั้นอยู่ใต้ `plugins.entries.active-memory` แทน `memorySearch`

Active Memory ใช้โมเดลสองด่าน:

1. ต้องเปิดใช้งาน Plugin และกำหนดเป้าหมายเป็น ID เอเจนต์ปัจจุบัน
2. คำขอต้องเป็นเซสชันแชตแบบโต้ตอบที่คงอยู่และมีสิทธิ์ใช้งาน

ดู [Active Memory](/th/concepts/active-memory) สำหรับโมเดลการเปิดใช้งาน การกำหนดค่าที่ Plugin เป็นเจ้าของ การคงอยู่ของทรานสคริปต์ และรูปแบบการทยอยเปิดใช้งานอย่างปลอดภัย
</Note>

---

## การเลือก Provider

| คีย์        | ชนิด      | ค่าเริ่มต้น          | คำอธิบาย                                                                                                                                                                                                                        |
| ---------- | --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | ตรวจพบอัตโนมัติ    | ID อะแดปเตอร์ embedding เช่น `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` หรือ `voyage`; อาจเป็น `models.providers.<id>` ที่กำหนดค่าไว้ซึ่ง `api` ชี้ไปยังอะแดปเตอร์เหล่านั้นตัวใดตัวหนึ่งก็ได้ |
| `model`    | `string`  | ค่าเริ่มต้นของ provider | ชื่อโมเดล embedding                                                                                                                                                                                                               |
| `fallback` | `string`  | `"none"`         | ID อะแดปเตอร์สำรองเมื่อตัวหลักล้มเหลว                                                                                                                                                                                         |
| `enabled`  | `boolean` | `true`           | เปิดหรือปิดการค้นหาหน่วยความจำ                                                                                                                                                                                                    |

### ลำดับการตรวจพบอัตโนมัติ

เมื่อไม่ได้ตั้งค่า `provider` OpenClaw จะเลือกตัวแรกที่พร้อมใช้งาน:

<Steps>
  <Step title="local">
    เลือกถ้ากำหนดค่า `memorySearch.local.modelPath` ไว้และมีไฟล์อยู่จริง
  </Step>
  <Step title="github-copilot">
    เลือกถ้าสามารถระบุโทเค็น GitHub Copilot ได้ (ตัวแปรสภาพแวดล้อมหรือโปรไฟล์การยืนยันตัวตน)
  </Step>
  <Step title="openai">
    เลือกถ้าสามารถระบุคีย์ OpenAI ได้
  </Step>
  <Step title="gemini">
    เลือกถ้าสามารถระบุคีย์ Gemini ได้
  </Step>
  <Step title="voyage">
    เลือกถ้าสามารถระบุคีย์ Voyage ได้
  </Step>
  <Step title="mistral">
    เลือกถ้าสามารถระบุคีย์ Mistral ได้
  </Step>
  <Step title="deepinfra">
    เลือกถ้าสามารถระบุคีย์ DeepInfra ได้
  </Step>
  <Step title="bedrock">
    เลือกถ้าห่วงโซ่ข้อมูลประจำตัวของ AWS SDK ระบุค่าได้ (บทบาทอินสแตนซ์ คีย์การเข้าถึง โปรไฟล์ SSO ข้อมูลประจำตัวเว็บ หรือการกำหนดค่าที่ใช้ร่วมกัน)
  </Step>
</Steps>

รองรับ `ollama` แต่ไม่ตรวจพบอัตโนมัติ (ให้ตั้งค่าอย่างชัดเจน)

### ID provider แบบกำหนดเอง

`memorySearch.provider` สามารถชี้ไปยังรายการ `models.providers.<id>` แบบกำหนดเองได้ OpenClaw จะระบุเจ้าของ `api` ของ provider นั้นสำหรับอะแดปเตอร์ embedding พร้อมคง ID provider แบบกำหนดเองไว้สำหรับการจัดการ endpoint การยืนยันตัวตน และคำนำหน้าโมเดล วิธีนี้ช่วยให้การตั้งค่าแบบหลาย GPU หรือหลายโฮสต์สามารถอุทิศ embeddings ของหน่วยความจำให้กับ endpoint ภายในเครื่องตัวใดตัวหนึ่งได้:

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

embeddings ระยะไกลต้องใช้ API key ส่วน Bedrock ใช้ห่วงโซ่ข้อมูลประจำตัวเริ่มต้นของ AWS SDK แทน (บทบาทอินสแตนซ์, SSO, คีย์การเข้าถึง)

| Provider       | ตัวแปรสภาพแวดล้อม                                            | คีย์กำหนดค่า                          |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | ห่วงโซ่ข้อมูลประจำตัว AWS                               | ไม่ต้องใช้ API key                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | โปรไฟล์การยืนยันตัวตนผ่านการล็อกอินด้วยอุปกรณ์       |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (ตัวยึดตำแหน่ง)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
OAuth ของ Codex ครอบคลุมเฉพาะแชต/การเติมข้อความเท่านั้น และไม่สามารถใช้กับคำขอ embedding ได้
</Note>

---

## การกำหนดค่า endpoint ระยะไกล

สำหรับ endpoint แบบเข้ากันได้กับ OpenAI ที่กำหนดเอง หรือการแทนที่ค่าเริ่มต้นของ provider:

<ParamField path="remote.baseUrl" type="string">
  URL ฐาน API แบบกำหนดเอง
</ParamField>
<ParamField path="remote.apiKey" type="string">
  แทนที่ API key
</ParamField>
<ParamField path="remote.headers" type="object">
  ส่วนหัว HTTP เพิ่มเติม (ผสานกับค่าเริ่มต้นของ provider)
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

## การกำหนดค่าเฉพาะ provider

<AccordionGroup>
  <Accordion title="Gemini">
    | คีย์                    | ชนิด     | ค่าเริ่มต้น                | คำอธิบาย                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | รองรับ `gemini-embedding-2-preview` ด้วย |
    | `outputDimensionality` | `number` | `3072`                 | สำหรับ Embedding 2: 768, 1536 หรือ 3072        |

    <Warning>
    การเปลี่ยนโมเดลหรือ `outputDimensionality` จะทริกเกอร์การทำดัชนีใหม่ทั้งหมดโดยอัตโนมัติ
    </Warning>

  </Accordion>
  <Accordion title="ชนิดอินพุตที่เข้ากันได้กับ OpenAI">
    endpoint embedding ที่เข้ากันได้กับ OpenAI สามารถเลือกใช้ฟิลด์คำขอ `input_type` เฉพาะ provider ได้ ซึ่งมีประโยชน์สำหรับโมเดล embedding แบบไม่สมมาตรที่ต้องใช้ป้ายกำกับต่างกันสำหรับ embeddings ของคิวรีและเอกสาร

    | คีย์                 | ชนิด     | ค่าเริ่มต้น | คำอธิบาย                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | ไม่ได้ตั้งค่า   | `input_type` ที่ใช้ร่วมกันสำหรับ embeddings ของคิวรีและเอกสาร   |
    | `queryInputType`    | `string` | ไม่ได้ตั้งค่า   | `input_type` ตอนคิวรี; แทนที่ `inputType`          |
    | `documentInputType` | `string` | ไม่ได้ตั้งค่า   | `input_type` ของดัชนี/เอกสาร; แทนที่ `inputType`      |

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

    การเปลี่ยนค่าเหล่านี้ส่งผลต่อเอกลักษณ์ของแคช embedding สำหรับการทำดัชนีแบบแบตช์ของ provider และควรตามด้วยการทำดัชนีหน่วยความจำใหม่เมื่อโมเดลต้นทางปฏิบัติต่อป้ายกำกับต่างกัน

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock ใช้ห่วงโซ่ข้อมูลประจำตัวเริ่มต้นของ AWS SDK ไม่ต้องใช้ API key หาก OpenClaw ทำงานบน EC2 ที่มีบทบาทอินสแตนซ์ที่เปิดใช้ Bedrock เพียงตั้งค่า provider และโมเดล:

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

    **โมเดลที่รองรับ** (พร้อมการตรวจจับตระกูลและค่าเริ่มต้นของมิติ):

    | ID โมเดล                                   | Provider   | มิติเริ่มต้น | มิติที่กำหนดค่าได้    |
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

    ตัวแปรที่มีคำต่อท้าย throughput (เช่น `amazon.titan-embed-text-v1:2:8k`) จะสืบทอดการกำหนดค่าของโมเดลฐาน

    **การยืนยันตัวตน:** การยืนยันตัวตนของ Bedrock ใช้ลำดับการระบุข้อมูลประจำตัวมาตรฐานของ AWS SDK:

    1. ตัวแปรสภาพแวดล้อม (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. แคชโทเค็น SSO
    3. ข้อมูลประจำตัวโทเค็นเว็บไอดี
    4. ไฟล์ข้อมูลประจำตัวและการกำหนดค่าที่ใช้ร่วมกัน
    5. ข้อมูลประจำตัวเมทาดาทา ECS หรือ EC2

    ภูมิภาคจะถูกระบุจาก `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` ของ provider `amazon-bedrock` หรือใช้ค่าเริ่มต้นเป็น `us-east-1`

    **สิทธิ์ IAM:** บทบาทหรือผู้ใช้ IAM ต้องมี:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    สำหรับสิทธิ์ขั้นต่ำ ให้จำกัดขอบเขต `InvokeModel` ไปยังโมเดลที่ระบุ:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | คีย์                   | ประเภท               | ค่าเริ่มต้น                | คำอธิบาย                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | ดาวน์โหลดอัตโนมัติ        | พาธไปยังไฟล์โมเดล GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | ค่าเริ่มต้นของ node-llama-cpp | ไดเรกทอรีแคชสำหรับโมเดลที่ดาวน์โหลด                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | ขนาดหน้าต่างบริบทสำหรับบริบท embedding 4096 ครอบคลุมชังก์ทั่วไป (128–512 โทเค็น) พร้อมจำกัด VRAM ที่ไม่ใช่น้ำหนัก ลดลงเป็น 1024–2048 บนโฮสต์ที่มีทรัพยากรจำกัด `"auto"` ใช้ค่าสูงสุดที่โมเดลถูกฝึกมา — ไม่แนะนำสำหรับโมเดล 8B+ (Qwen3-Embedding-8B: 40 960 โทเค็น → VRAM ~32 GB เทียบกับ ~8.8 GB ที่ 4096) |

    โมเดลเริ่มต้น: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, ดาวน์โหลดอัตโนมัติ) ซอร์ส checkout ยังต้องอนุมัติ native build: `pnpm approve-builds` แล้วจึง `pnpm rebuild node-llama-cpp`

    ใช้ CLI แบบสแตนด์อโลนเพื่อตรวจสอบพาธ provider เดียวกับที่ Gateway ใช้:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    หาก `provider` เป็น `auto` จะเลือก `local` เฉพาะเมื่อ `local.modelPath` ชี้ไปยังไฟล์ภายในเครื่องที่มีอยู่แล้วเท่านั้น การอ้างอิงโมเดลแบบ `hf:` และ HTTP(S) ยังใช้แบบเจาะจงได้ด้วย `provider: "local"` แต่จะไม่ทำให้ `auto` เลือก local ก่อนที่โมเดลจะพร้อมใช้งานบนดิสก์

  </Accordion>
</AccordionGroup>

### ไทม์เอาต์ embedding แบบอินไลน์

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  แทนที่ไทม์เอาต์สำหรับแบตช์ embedding แบบอินไลน์ระหว่างการทำดัชนี memory

เมื่อไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ provider: 600 วินาทีสำหรับ provider แบบ local/self-hosted เช่น `local`, `ollama` และ `lmstudio` และ 120 วินาทีสำหรับ provider แบบโฮสต์ เพิ่มค่านี้เมื่อแบตช์ embedding ที่ใช้ CPU ภายในเครื่องทำงานปกติแต่ช้า
</ParamField>

---

## การกำหนดค่าการค้นหาแบบไฮบริด

ทั้งหมดอยู่ใต้ `memorySearch.query.hybrid`:

| คีย์                   | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | เปิดใช้การค้นหาแบบไฮบริด BM25 + เวกเตอร์ |
| `vectorWeight`        | `number`  | `0.7`   | น้ำหนักสำหรับคะแนนเวกเตอร์ (0-1)     |
| `textWeight`          | `number`  | `0.3`   | น้ำหนักสำหรับคะแนน BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | ตัวคูณขนาดพูลผู้สมัคร     |

<Tabs>
  <Tab title="MMR (diversity)">
    | คีย์           | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                          |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | เปิดใช้การจัดอันดับใหม่ด้วย MMR                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = ความหลากหลายสูงสุด, 1 = ความเกี่ยวข้องสูงสุด |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | คีย์                          | ประเภท      | ค่าเริ่มต้น | คำอธิบาย               |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | เปิดใช้การเพิ่มคะแนนตามความใหม่      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | คะแนนลดลงครึ่งหนึ่งทุก N วัน |

    ไฟล์ที่ไม่เสื่อมตามเวลา (`MEMORY.md`, ไฟล์ที่ไม่มีวันที่ใน `memory/`) จะไม่ถูกลดคะแนนตามเวลา

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

## พาธ memory เพิ่มเติม

| คีย์          | ประเภท       | คำอธิบาย                              |
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

พาธอาจเป็นแบบสัมบูรณ์หรือสัมพันธ์กับ workspace ได้ ไดเรกทอรีจะถูกสแกนแบบเรียกซ้ำสำหรับไฟล์ `.md` การจัดการ symlink ขึ้นอยู่กับ backend ที่ใช้งานอยู่: เอนจินในตัวจะละเว้น symlink ขณะที่ QMD ทำตามพฤติกรรมของสแกนเนอร์ QMD พื้นฐาน

สำหรับการค้นหาทรานสคริปต์ข้าม agent ในขอบเขต agent ให้ใช้ `agents.list[].memorySearch.qmd.extraCollections` แทน `memory.qmd.paths` คอลเล็กชันเพิ่มเติมเหล่านั้นใช้รูปแบบ `{ path, name, pattern? }` เดียวกัน แต่จะถูกผสานต่อ agent และสามารถรักษาชื่อที่แชร์แบบระบุชัดเจนไว้เมื่อพาธชี้ออกนอก workspace ปัจจุบัน หากพาธที่ resolve แล้วเดียวกันปรากฏทั้งใน `memory.qmd.paths` และ `memorySearch.qmd.extraCollections` QMD จะเก็บรายการแรกไว้และข้ามรายการที่ซ้ำ

---

## memory หลายโมดัล (Gemini)

ทำดัชนีรูปภาพและเสียงควบคู่กับ Markdown โดยใช้ Gemini Embedding 2:

| คีย์                       | ประเภท       | ค่าเริ่มต้น    | คำอธิบาย                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | เปิดใช้การทำดัชนีหลายโมดัล             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, หรือ `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | ขนาดไฟล์สูงสุดสำหรับการทำดัชนี             |

<Note>
ใช้ได้เฉพาะกับไฟล์ใน `extraPaths` เท่านั้น รากหน่วยความจำเริ่มต้นยังคงรองรับเฉพาะ Markdown ต้องใช้ `gemini-embedding-2-preview` `fallback` ต้องเป็น `"none"`
</Note>

รูปแบบที่รองรับ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (รูปภาพ); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (เสียง)

---

## แคชการฝัง

| คีย์               | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                           |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | แคชการฝังของชังก์ใน SQLite |
| `cache.maxEntries` | `number`  | `50000` | จำนวนการฝังที่แคชได้สูงสุด            |

ป้องกันการฝังข้อความที่ไม่เปลี่ยนแปลงซ้ำระหว่างการทำดัชนีใหม่หรือการอัปเดตทรานสคริปต์

---

## การทำดัชนีแบบแบตช์

| คีย์                          | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | การฝังแบบอินไลน์พร้อมกัน |
| `remote.batch.enabled`        | `boolean` | `false` | เปิดใช้ API การฝังแบบแบตช์ |
| `remote.batch.concurrency`    | `number`  | `2`     | งานแบตช์พร้อมกัน        |
| `remote.batch.wait`           | `boolean` | `true`  | รอให้แบตช์เสร็จสมบูรณ์  |
| `remote.batch.pollIntervalMs` | `number`  | --      | ช่วงเวลาการโพล              |
| `remote.batch.timeoutMinutes` | `number`  | --      | เวลาหมดเวลาของแบตช์              |

ใช้ได้กับ `openai`, `gemini` และ `voyage` โดยทั่วไปแบตช์ของ OpenAI จะเร็วที่สุดและมีต้นทุนต่ำที่สุดสำหรับการเติมข้อมูลย้อนหลังขนาดใหญ่

`remote.nonBatchConcurrency` ควบคุมการเรียกการฝังแบบอินไลน์ที่ใช้โดยผู้ให้บริการแบบโลคัล/โฮสต์เอง และผู้ให้บริการแบบโฮสต์เมื่อ API แบตช์ของผู้ให้บริการไม่ได้เปิดใช้งาน Ollama มีค่าเริ่มต้นเป็น `1` สำหรับการทำดัชนีแบบไม่ใช้แบตช์เพื่อหลีกเลี่ยงการทำให้โฮสต์โลคัลขนาดเล็กรับภาระมากเกินไป ให้ตั้งค่าสูงขึ้นบนเครื่องที่ใหญ่กว่า

สิ่งนี้แยกจาก `sync.embeddingBatchTimeoutSeconds` ซึ่งควบคุมเวลาหมดเวลาสำหรับการเรียกการฝังแบบอินไลน์

---

## การค้นหาหน่วยความจำเซสชัน (ทดลอง)

ทำดัชนีทรานสคริปต์ของเซสชันและแสดงผ่าน `memory_search`:

| คีย์                          | ชนิด       | ค่าเริ่มต้น      | คำอธิบาย                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | เปิดใช้การทำดัชนีเซสชัน                 |
| `sources`                     | `string[]` | `["memory"]` | เพิ่ม `"sessions"` เพื่อรวมทรานสคริปต์ |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | เกณฑ์จำนวนไบต์สำหรับการทำดัชนีใหม่              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | เกณฑ์จำนวนข้อความสำหรับการทำดัชนีใหม่           |

<Warning>
การทำดัชนีเซสชันเป็นแบบเลือกเปิดใช้และทำงานแบบอะซิงโครนัส ผลลัพธ์อาจล้าหลังเล็กน้อย บันทึกเซสชันอยู่บนดิสก์ ดังนั้นให้ถือว่าการเข้าถึงระบบไฟล์เป็นขอบเขตความไว้วางใจ
</Warning>

---

## การเร่งความเร็วเวกเตอร์ SQLite (sqlite-vec)

| คีย์                         | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | ใช้ sqlite-vec สำหรับคิวรีเวกเตอร์ |
| `store.vector.extensionPath` | `string`  | ที่รวมมาให้ | แทนที่พาธ sqlite-vec          |

เมื่อ sqlite-vec ไม่พร้อมใช้งาน OpenClaw จะถอยกลับไปใช้ความคล้ายคลึงแบบโคไซน์ในกระบวนการโดยอัตโนมัติ

---

## ที่จัดเก็บดัชนี

| คีย์                  | ชนิด     | ค่าเริ่มต้น                              | คำอธิบาย                                 |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | ตำแหน่งดัชนี (รองรับโทเค็น `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | ตัวตัดคำ FTS5 (`unicode61` หรือ `trigram`)   |

---

## การกำหนดค่าแบ็กเอนด์ QMD

ตั้งค่า `memory.backend = "qmd"` เพื่อเปิดใช้ การตั้งค่า QMD ทั้งหมดอยู่ภายใต้ `memory.qmd`:

| คีย์                     | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | พาธไฟล์ปฏิบัติการ QMD; ตั้งเป็นพาธสัมบูรณ์เมื่อ `PATH` ของบริการต่างจากเชลล์ของคุณ |
| `searchMode`             | `string`  | `search` | คำสั่งค้นหา: `search`, `vsearch`, `query`                                          |
| `includeDefaultMemory`   | `boolean` | `true`   | ทำดัชนี `MEMORY.md` + `memory/**/*.md` อัตโนมัติ                                             |
| `paths[]`                | `array`   | --       | พาธเพิ่มเติม: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | ทำดัชนีทรานสคริปต์เซสชัน                                                             |
| `sessions.retentionDays` | `number`  | --       | ระยะเวลาเก็บรักษาทรานสคริปต์                                                                  |
| `sessions.exportDir`     | `string`  | --       | ไดเรกทอรีส่งออก                                                                      |

`searchMode: "search"` เป็นแบบ lexical/BM25 เท่านั้น OpenClaw จะไม่รัน semantic vector readiness probes หรือการบำรุงรักษา QMD embedding สำหรับโหมดนั้น รวมถึงระหว่าง `memory status --deep`; `vsearch` และ `query` ยังคงต้องใช้ QMD vector readiness และ embeddings

OpenClaw เลือกรูปแบบ collection และ MCP query ของ QMD ปัจจุบันก่อน แต่ยังทำให้ QMD รุ่นเก่าทำงานได้โดยลองใช้ collection pattern flags ที่เข้ากันได้และชื่อเครื่องมือ MCP แบบเก่าเมื่อจำเป็น เมื่อ QMD ประกาศว่ารองรับ collection filters หลายรายการ collection ที่มีแหล่งที่มาเดียวกันจะถูกค้นหาด้วย QMD process เดียว ส่วน QMD build รุ่นเก่าจะยังใช้เส้นทางความเข้ากันได้แบบต่อ collection แหล่งที่มาเดียวกันหมายถึง collection ของหน่วยความจำแบบคงทนจะถูกจัดกลุ่มไว้ด้วยกัน ขณะที่ collection ของ transcript ใน session จะยังเป็นอีกกลุ่มแยกต่างหาก เพื่อให้การกระจายแหล่งที่มายังมีอินพุตทั้งสองแบบ

<Note>
การ override โมเดล QMD จะอยู่ฝั่ง QMD ไม่ใช่ config ของ OpenClaw หากคุณต้องการ override โมเดลของ QMD แบบทั่วระบบ ให้ตั้งค่าตัวแปรสภาพแวดล้อม เช่น `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` และ `QMD_GENERATE_MODEL` ในสภาพแวดล้อม runtime ของ gateway
</Note>

<AccordionGroup>
  <Accordion title="กำหนดการอัปเดต">
    | คีย์                      | ประเภท    | ค่าเริ่มต้น | คำอธิบาย                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | ช่วงเวลาการรีเฟรช                      |
    | `update.debounceMs`       | `number`  | `15000` | Debounce การเปลี่ยนแปลงไฟล์                 |
    | `update.onBoot`           | `boolean` | `true`  | รีเฟรชเมื่อ QMD manager ที่ทำงานระยะยาวเปิดขึ้น และยังควบคุม startup refresh แบบ opt-in |
    | `update.startup`          | `string`  | `off`   | การรีเฟรชเมื่อ gateway เริ่มต้นแบบไม่บังคับ: `off`, `idle` หรือ `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | หน่วงเวลาก่อนที่ refresh แบบ `startup: "idle"` จะทำงาน |
    | `update.waitForBootSync`  | `boolean` | `false` | บล็อกการเปิด manager จนกว่า refresh เริ่มต้นจะเสร็จสมบูรณ์ |
    | `update.embedInterval`    | `string`  | --      | รอบเวลา embed แยกต่างหาก                |
    | `update.commandTimeoutMs` | `number`  | --      | Timeout สำหรับคำสั่ง QMD              |
    | `update.updateTimeoutMs`  | `number`  | --      | Timeout สำหรับการดำเนินการอัปเดตของ QMD     |
    | `update.embedTimeoutMs`   | `number`  | --      | Timeout สำหรับการดำเนินการ embed ของ QMD      |
  </Accordion>
  <Accordion title="ขีดจำกัด">
    | คีย์                      | ประเภท   | ค่าเริ่มต้น | คำอธิบาย                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | จำนวนผลการค้นหาสูงสุด         |
    | `limits.maxSnippetChars`  | `number` | --      | จำกัดความยาว snippet       |
    | `limits.maxInjectedChars` | `number` | --      | จำกัดจำนวนอักขระที่ inject รวม |
    | `limits.timeoutMs`        | `number` | `4000`  | Timeout การค้นหา             |
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

    ค่าเริ่มต้นที่จัดส่งมาจะอนุญาต direct และ channel sessions ขณะที่ยังปฏิเสธ groups

    ค่าเริ่มต้นคือ DM เท่านั้น `match.keyPrefix` จะจับคู่กับ session key ที่ normalized แล้ว; `match.rawKeyPrefix` จะจับคู่กับ raw key รวมถึง `agent:<id>:`

  </Accordion>
  <Accordion title="การอ้างอิง">
    `memory.citations` ใช้กับ backend ทั้งหมด:

    | ค่า              | พฤติกรรม                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (default) | รวม footer `Source: <path#line>` ใน snippets    |
    | `on`             | รวม footer เสมอ                               |
    | `off`            | ละเว้น footer (path ยังคงส่งต่อให้ agent ภายใน) |

  </Accordion>
</AccordionGroup>

การรีเฟรช QMD ตอน boot ใช้เส้นทาง subprocess แบบครั้งเดียวระหว่าง startup ของ gateway ส่วน QMD manager ที่ทำงานระยะยาวยังคงเป็นเจ้าของ file watcher ปกติและ interval timers เมื่อ memory search ถูกเปิดใช้สำหรับการใช้งานแบบโต้ตอบ

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

Dreaming ถูกกำหนดค่าใต้ `plugins.entries.memory-core.config.dreaming` ไม่ใช่ใต้ `agents.defaults.memorySearch`

Dreaming ทำงานเป็น sweep ที่ตั้งเวลาไว้หนึ่งรายการ และใช้ phase ภายในแบบ light/deep/REM เป็นรายละเอียดการนำไปใช้

สำหรับพฤติกรรมเชิงแนวคิดและ slash commands โปรดดู [Dreaming](/th/concepts/dreaming)

### การตั้งค่าผู้ใช้

| คีย์        | ประเภท    | ค่าเริ่มต้น       | คำอธิบาย                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | เปิดหรือปิด dreaming ทั้งหมด               |
| `frequency` | `string`  | `0 3 * * *`   | รอบเวลา cron แบบไม่บังคับสำหรับ dreaming sweep แบบเต็ม |
| `model`     | `string`  | โมเดลเริ่มต้น | การ override โมเดลของ Dream Diary subagent แบบไม่บังคับ      |

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
- Dreaming เขียน machine state ไปยัง `memory/.dreams/`
- Dreaming เขียน output เชิงบรรยายที่มนุษย์อ่านได้ไปยัง `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่)
- `dreaming.model` ใช้ trust gate ของ plugin subagent ที่มีอยู่; ตั้งค่า `plugins.entries.memory-core.subagent.allowModelOverride: true` ก่อนเปิดใช้งาน
- Dream Diary จะลองซ้ำหนึ่งครั้งด้วยโมเดลเริ่มต้นของ session เมื่อโมเดลที่กำหนดค่าไว้ไม่พร้อมใช้งาน ความล้มเหลวของ trust หรือ allowlist จะถูกบันทึกใน log และจะไม่ถูกลองซ้ำแบบเงียบ ๆ
- นโยบายและ threshold ของ phase light/deep/REM เป็นพฤติกรรมภายใน ไม่ใช่ config สำหรับผู้ใช้

</Note>

## ที่เกี่ยวข้อง

- [Configuration reference](/th/gateway/configuration-reference)
- [Memory overview](/th/concepts/memory)
- [Memory search](/th/concepts/memory-search)
