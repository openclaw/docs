---
read_when:
    - คุณต้องการกำหนดค่าผู้ให้บริการการค้นหาหน่วยความจำหรือโมเดลการฝังเวกเตอร์
    - คุณต้องการตั้งค่าแบ็กเอนด์ QMD
    - คุณต้องการปรับแต่งการค้นหาแบบไฮบริด, MMR หรือการลดทอนตามเวลา
    - คุณต้องการเปิดใช้งานการจัดทำดัชนีหน่วยความจำแบบหลายรูปแบบ
sidebarTitle: Memory config
summary: ตัวเลือกการกำหนดค่าทั้งหมดสำหรับการค้นหาหน่วยความจำ ผู้ให้บริการ embedding, QMD, การค้นหาแบบไฮบริด และการทำดัชนีแบบหลายโหมด
title: ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ
x-i18n:
    generated_at: "2026-04-30T10:15:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbb21d407f7ec9ef76e68c268138892b12568137735b723579703e535d34b195
    source_path: reference/memory-config.md
    workflow: 16
---

หน้านี้แสดงรายการตัวเลือกการตั้งค่าทุกตัวสำหรับการค้นหาหน่วยความจำของ OpenClaw สำหรับภาพรวมเชิงแนวคิด โปรดดู:

<CardGroup cols={2}>
  <Card title="ภาพรวมหน่วยความจำ" href="/th/concepts/memory">
    วิธีการทำงานของหน่วยความจำ
  </Card>
  <Card title="เอนจินในตัว" href="/th/concepts/memory-builtin">
    แบ็กเอนด์ SQLite เริ่มต้น
  </Card>
  <Card title="เอนจิน QMD" href="/th/concepts/memory-qmd">
    ไซด์คาร์ที่ให้ความสำคัญกับเครื่องภายในก่อน
  </Card>
  <Card title="การค้นหาหน่วยความจำ" href="/th/concepts/memory-search">
    ไปป์ไลน์การค้นหาและการปรับแต่ง
  </Card>
  <Card title="Active Memory" href="/th/concepts/active-memory">
    เอเจนต์ย่อยด้านหน่วยความจำสำหรับเซสชันแบบโต้ตอบ
  </Card>
</CardGroup>

การตั้งค่าการค้นหาหน่วยความจำทั้งหมดอยู่ภายใต้ `agents.defaults.memorySearch` ใน `openclaw.json` เว้นแต่จะระบุไว้เป็นอย่างอื่น

<Note>
หากคุณกำลังมองหาสวิตช์เปิดปิดฟีเจอร์ **Active Memory** และการตั้งค่าเอเจนต์ย่อย สิ่งนั้นอยู่ภายใต้ `plugins.entries.active-memory` แทน `memorySearch`

Active Memory ใช้โมเดลสองด่าน:

1. Plugin ต้องเปิดใช้งานและกำหนดเป้าหมายเป็น ID เอเจนต์ปัจจุบัน
2. คำขอต้องเป็นเซสชันแชตถาวรแบบโต้ตอบที่เข้าเกณฑ์

ดู [Active Memory](/th/concepts/active-memory) สำหรับโมเดลการเปิดใช้งาน การตั้งค่าที่ Plugin เป็นเจ้าของ การคงอยู่ของทรานสคริปต์ และรูปแบบการเปิดตัวอย่างปลอดภัย
</Note>

---

## การเลือกผู้ให้บริการ

| คีย์        | ประเภท      | ค่าเริ่มต้น          | คำอธิบาย                                                                                                                                                                                                                        |
| ---------- | --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | ตรวจพบอัตโนมัติ    | ID อะแดปเตอร์ embedding เช่น `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` หรือ `voyage`; และยังอาจเป็น `models.providers.<id>` ที่ตั้งค่าไว้ซึ่ง `api` ชี้ไปยังอะแดปเตอร์ใดอะแดปเตอร์หนึ่งเหล่านั้น |
| `model`    | `string`  | ค่าเริ่มต้นของผู้ให้บริการ | ชื่อโมเดล embedding                                                                                                                                                                                                               |
| `fallback` | `string`  | `"none"`         | ID อะแดปเตอร์สำรองเมื่อตัวหลักล้มเหลว                                                                                                                                                                                         |
| `enabled`  | `boolean` | `true`           | เปิดหรือปิดการค้นหาหน่วยความจำ                                                                                                                                                                                                    |

### ลำดับการตรวจพบอัตโนมัติ

เมื่อไม่ได้ตั้งค่า `provider` OpenClaw จะเลือกตัวแรกที่พร้อมใช้งาน:

<Steps>
  <Step title="local">
    เลือกเมื่อมีการตั้งค่า `memorySearch.local.modelPath` และไฟล์มีอยู่จริง
  </Step>
  <Step title="github-copilot">
    เลือกเมื่อสามารถ resolve โทเค็น GitHub Copilot ได้ (ตัวแปร env หรือโปรไฟล์ auth)
  </Step>
  <Step title="openai">
    เลือกเมื่อสามารถ resolve คีย์ OpenAI ได้
  </Step>
  <Step title="gemini">
    เลือกเมื่อสามารถ resolve คีย์ Gemini ได้
  </Step>
  <Step title="voyage">
    เลือกเมื่อสามารถ resolve คีย์ Voyage ได้
  </Step>
  <Step title="mistral">
    เลือกเมื่อสามารถ resolve คีย์ Mistral ได้
  </Step>
  <Step title="deepinfra">
    เลือกเมื่อสามารถ resolve คีย์ DeepInfra ได้
  </Step>
  <Step title="bedrock">
    เลือกเมื่อเชนข้อมูลรับรองของ AWS SDK resolve ได้ (บทบาทอินสแตนซ์ คีย์การเข้าถึง โปรไฟล์ SSO เว็บไอดี หรือคอนฟิกร่วม)
  </Step>
</Steps>

รองรับ `ollama` แต่ไม่ตรวจพบอัตโนมัติ (ให้ตั้งค่าอย่างชัดเจน)

### ID ผู้ให้บริการแบบกำหนดเอง

`memorySearch.provider` สามารถชี้ไปยังรายการ `models.providers.<id>` แบบกำหนดเองได้ OpenClaw จะ resolve เจ้าของ `api` ของผู้ให้บริการนั้นสำหรับอะแดปเตอร์ embedding พร้อมคง ID ผู้ให้บริการแบบกำหนดเองไว้สำหรับการจัดการปลายทาง auth และคำนำหน้าโมเดล วิธีนี้ทำให้การตั้งค่าหลาย GPU หรือหลายโฮสต์สามารถจัดสรร embedding หน่วยความจำให้กับปลายทางภายในที่ระบุได้:

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

embedding ระยะไกลต้องใช้คีย์ API ส่วน Bedrock ใช้เชนข้อมูลรับรองเริ่มต้นของ AWS SDK แทน (บทบาทอินสแตนซ์ SSO คีย์การเข้าถึง)

| ผู้ให้บริการ       | ตัวแปร Env                                            | คีย์คอนฟิก                          |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | เชนข้อมูลรับรอง AWS                               | ไม่จำเป็นต้องใช้คีย์ API                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | โปรไฟล์ Auth ผ่านการล็อกอินด้วยอุปกรณ์       |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth ครอบคลุมเฉพาะแชต/การเติมข้อความเท่านั้น และไม่สามารถใช้กับคำขอ embedding ได้
</Note>

---

## การตั้งค่าปลายทางระยะไกล

สำหรับปลายทางแบบเข้ากันได้กับ OpenAI ที่กำหนดเอง หรือการแทนที่ค่าเริ่มต้นของผู้ให้บริการ:

<ParamField path="remote.baseUrl" type="string">
  URL ฐาน API แบบกำหนดเอง
</ParamField>
<ParamField path="remote.apiKey" type="string">
  แทนที่คีย์ API
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

## การตั้งค่าเฉพาะผู้ให้บริการ

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
    ปลายทาง embedding ที่เข้ากันได้กับ OpenAI สามารถเลือกใช้ฟิลด์คำขอ `input_type` เฉพาะผู้ให้บริการได้ สิ่งนี้มีประโยชน์สำหรับโมเดล embedding แบบอสมมาตรที่ต้องใช้ป้ายกำกับต่างกันสำหรับ embedding ของคำค้นและเอกสาร

    | คีย์                 | ประเภท     | ค่าเริ่มต้น | คำอธิบาย                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | ไม่ได้ตั้งค่า   | `input_type` ร่วมสำหรับ embedding ของคำค้นและเอกสาร   |
    | `queryInputType`    | `string` | ไม่ได้ตั้งค่า   | `input_type` ขณะค้นหา; แทนที่ `inputType`          |
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

    การเปลี่ยนค่าเหล่านี้มีผลต่อข้อมูลระบุตัวตนของแคช embedding สำหรับการทำดัชนีแบบแบตช์ของผู้ให้บริการ และควรตามด้วยการทำดัชนีหน่วยความจำใหม่เมื่อโมเดลต้นทางตีความป้ายกำกับแตกต่างกัน

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock ใช้เชนข้อมูลรับรองเริ่มต้นของ AWS SDK จึงไม่ต้องใช้คีย์ API หาก OpenClaw รันบน EC2 พร้อมบทบาทอินสแตนซ์ที่เปิดใช้ Bedrock ไว้ เพียงตั้งค่าผู้ให้บริการและโมเดล:

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

    **โมเดลที่รองรับ** (พร้อมการตรวจจับตระกูลและค่าเริ่มต้นของมิติ):

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

    ตัวแปรที่มีส่วนต่อท้าย throughput (เช่น `amazon.titan-embed-text-v1:2:8k`) จะสืบทอดการตั้งค่าของโมเดลพื้นฐาน

    **การยืนยันตัวตน:** auth ของ Bedrock ใช้ลำดับการ resolve ข้อมูลรับรองมาตรฐานของ AWS SDK:

    1. ตัวแปรสภาพแวดล้อม (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. แคชโทเค็น SSO
    3. ข้อมูลรับรองโทเค็นเว็บไอดี
    4. ไฟล์ข้อมูลรับรองและคอนฟิกร่วม
    5. ข้อมูลรับรองเมทาดาทา ECS หรือ EC2

    ภูมิภาคจะถูก resolve จาก `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` ของผู้ให้บริการ `amazon-bedrock` หรือใช้ค่าเริ่มต้นเป็น `us-east-1`

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
  <Accordion title="ในเครื่อง (GGUF + node-llama-cpp)">
    | คีย์                   | ประเภท               | ค่าเริ่มต้น                | คำอธิบาย                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | ดาวน์โหลดอัตโนมัติ        | พาธไปยังไฟล์โมเดล GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | ค่าเริ่มต้นของ node-llama-cpp | ไดเรกทอรีแคชสำหรับโมเดลที่ดาวน์โหลด                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | ขนาดหน้าต่างบริบทสำหรับบริบท embedding ค่า 4096 ครอบคลุมชังก์ทั่วไป (128–512 โทเค็น) พร้อมจำกัด VRAM ที่ไม่ใช่น้ำหนักโมเดล ลดลงเป็น 1024–2048 บนโฮสต์ที่มีทรัพยากรจำกัด `"auto"` ใช้ค่าสูงสุดที่โมเดลถูกเทรนมา ซึ่งไม่แนะนำสำหรับโมเดล 8B+ (Qwen3-Embedding-8B: 40 960 โทเค็น → VRAM ~32 GB เทียบกับ ~8.8 GB ที่ 4096). |

    โมเดลเริ่มต้น: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, ดาวน์โหลดอัตโนมัติ) ต้องใช้การ build แบบ native: `pnpm approve-builds` แล้วตามด้วย `pnpm rebuild node-llama-cpp`.

    ใช้ CLI แบบสแตนด์อโลนเพื่อตรวจสอบพาธ provider เดียวกับที่ Gateway ใช้:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    หาก `provider` เป็น `auto` จะเลือก `local` เฉพาะเมื่อ `local.modelPath` ชี้ไปยังไฟล์ในเครื่องที่มีอยู่แล้วเท่านั้น การอ้างอิงโมเดลแบบ `hf:` และ HTTP(S) ยังสามารถใช้ได้อย่างชัดเจนด้วย `provider: "local"` แต่จะไม่ทำให้ `auto` เลือก local ก่อนที่โมเดลจะพร้อมใช้งานบนดิสก์

  </Accordion>
</AccordionGroup>

### ไทม์เอาต์ embedding แบบอินไลน์

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  แทนที่ไทม์เอาต์สำหรับแบตช์ embedding แบบอินไลน์ระหว่างการทำดัชนีหน่วยความจำ

เมื่อไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นของ provider: 600 วินาทีสำหรับ provider ในเครื่อง/โฮสต์เอง เช่น `local`, `ollama`, และ `lmstudio` และ 120 วินาทีสำหรับ provider ที่โฮสต์อยู่ เพิ่มค่านี้เมื่อแบตช์ embedding ในเครื่องที่ใช้ CPU เป็นหลักทำงานปกติแต่ช้า
</ParamField>

---

## การกำหนดค่าการค้นหาแบบไฮบริด

ทั้งหมดอยู่ภายใต้ `memorySearch.query.hybrid`:

| คีย์                   | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | เปิดใช้การค้นหาแบบไฮบริด BM25 + เวกเตอร์ |
| `vectorWeight`        | `number`  | `0.7`   | น้ำหนักสำหรับคะแนนเวกเตอร์ (0-1)     |
| `textWeight`          | `number`  | `0.3`   | น้ำหนักสำหรับคะแนน BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | ตัวคูณขนาดพูลของตัวเลือก     |

<Tabs>
  <Tab title="MMR (ความหลากหลาย)">
    | คีย์           | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                          |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | เปิดใช้การจัดอันดับใหม่ด้วย MMR                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = ความหลากหลายสูงสุด, 1 = ความเกี่ยวข้องสูงสุด |
  </Tab>
  <Tab title="การลดทอนตามเวลา (ความใหม่)">
    | คีย์                          | ประเภท      | ค่าเริ่มต้น | คำอธิบาย               |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | เปิดใช้การเพิ่มคะแนนตามความใหม่      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | คะแนนลดลงครึ่งหนึ่งทุก N วัน |

    ไฟล์ที่คงคุณค่าเสมอ (`MEMORY.md`, ไฟล์ที่ไม่มีวันที่ใน `memory/`) จะไม่ถูกลดทอน

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

พาธอาจเป็นแบบสัมบูรณ์หรือสัมพันธ์กับเวิร์กสเปซ ไดเรกทอรีจะถูกสแกนแบบเรียกซ้ำสำหรับไฟล์ `.md` การจัดการ symlink ขึ้นอยู่กับ backend ที่ใช้งานอยู่: เอนจินในตัวจะละเว้น symlink ขณะที่ QMD ทำตามพฤติกรรมของสแกนเนอร์ QMD ที่อยู่ข้างใต้

สำหรับการค้นหาทรานสคริปต์ข้าม agent แบบจำกัดขอบเขตตาม agent ให้ใช้ `agents.list[].memorySearch.qmd.extraCollections` แทน `memory.qmd.paths` คอลเลกชันเพิ่มเติมเหล่านั้นใช้รูปแบบ `{ path, name, pattern? }` เดียวกัน แต่จะถูกรวมต่อ agent และสามารถคงชื่อที่แชร์ไว้อย่างชัดเจนเมื่อพาธชี้ออกนอกเวิร์กสเปซปัจจุบัน หากพาธที่ resolve แล้วเดียวกันปรากฏทั้งใน `memory.qmd.paths` และ `memorySearch.qmd.extraCollections` QMD จะเก็บรายการแรกและข้ามรายการที่ซ้ำกัน

---

## หน่วยความจำแบบมัลติโมดัล (Gemini)

ทำดัชนีรูปภาพและเสียงควบคู่กับ Markdown โดยใช้ Gemini Embedding 2:

| คีย์                       | ประเภท       | ค่าเริ่มต้น    | คำอธิบาย                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | เปิดใช้การทำดัชนีแบบมัลติโมดัล             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, หรือ `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | ขนาดไฟล์สูงสุดสำหรับการทำดัชนี             |

<Note>
ใช้เฉพาะกับไฟล์ใน `extraPaths` เท่านั้น รากหน่วยความจำเริ่มต้นยังคงเป็น Markdown เท่านั้น ต้องใช้ `gemini-embedding-2-preview` และ `fallback` ต้องเป็น `"none"`
</Note>

รูปแบบที่รองรับ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (รูปภาพ); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (เสียง)

---

## แคชการฝังตัว

| คีย์               | ชนิด     | ค่าเริ่มต้น | คำอธิบาย                         |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | แคชการฝังตัวของชังก์ใน SQLite |
| `cache.maxEntries` | `number`  | `50000` | จำนวนการฝังตัวที่แคชได้สูงสุด            |

ป้องกันการฝังตัวข้อความเดิมซ้ำเมื่อทำดัชนีใหม่หรืออัปเดตทรานสคริปต์

---

## การทำดัชนีแบบแบตช์

| คีย์                          | ชนิด     | ค่าเริ่มต้น | คำอธิบาย                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | การฝังตัวแบบอินไลน์ขนาน |
| `remote.batch.enabled`        | `boolean` | `false` | เปิดใช้ API การฝังตัวแบบแบตช์ |
| `remote.batch.concurrency`    | `number`  | `2`     | งานแบตช์ขนาน        |
| `remote.batch.wait`           | `boolean` | `true`  | รอให้แบตช์เสร็จสมบูรณ์  |
| `remote.batch.pollIntervalMs` | `number`  | --      | ช่วงเวลาการโพล              |
| `remote.batch.timeoutMinutes` | `number`  | --      | หมดเวลาของแบตช์              |

ใช้ได้กับ `openai`, `gemini` และ `voyage` โดยทั่วไป แบตช์ของ OpenAI จะเร็วที่สุดและถูกที่สุดสำหรับการเติมข้อมูลย้อนหลังขนาดใหญ่

`remote.nonBatchConcurrency` ควบคุมการเรียกการฝังตัวแบบอินไลน์ที่ใช้โดยผู้ให้บริการแบบโลคัล/โฮสต์เอง และผู้ให้บริการแบบโฮสต์เมื่อ API แบตช์ของผู้ให้บริการไม่ได้เปิดใช้งาน Ollama มีค่าเริ่มต้นเป็น `1` สำหรับการทำดัชนีแบบไม่เป็นแบตช์เพื่อหลีกเลี่ยงการทำให้โฮสต์โลคัลขนาดเล็กรับภาระมากเกินไป ตั้งค่าให้สูงขึ้นบนเครื่องที่ใหญ่กว่า

ส่วนนี้แยกจาก `sync.embeddingBatchTimeoutSeconds` ซึ่งควบคุมเวลาหมดอายุสำหรับการเรียกการฝังตัวแบบอินไลน์

---

## การค้นหาหน่วยความจำเซสชัน (ทดลอง)

ทำดัชนีทรานสคริปต์เซสชันและแสดงผ่าน `memory_search`:

| คีย์                          | ชนิด      | ค่าเริ่มต้น     | คำอธิบาย                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | เปิดใช้การทำดัชนีเซสชัน                 |
| `sources`                     | `string[]` | `["memory"]` | เพิ่ม `"sessions"` เพื่อรวมทรานสคริปต์ |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | เกณฑ์จำนวนไบต์สำหรับการทำดัชนีใหม่              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | เกณฑ์จำนวนข้อความสำหรับการทำดัชนีใหม่           |

<Warning>
การทำดัชนีเซสชันเป็นแบบเลือกเปิดใช้และทำงานแบบอะซิงโครนัส ผลลัพธ์อาจล้าสมัยเล็กน้อย บันทึกเซสชันอยู่บนดิสก์ ดังนั้นให้ถือว่าการเข้าถึงระบบไฟล์เป็นขอบเขตความเชื่อถือ
</Warning>

---

## การเร่งความเร็วเวกเตอร์ของ SQLite (sqlite-vec)

| คีย์                         | ชนิด     | ค่าเริ่มต้น | คำอธิบาย                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | ใช้ sqlite-vec สำหรับการคิวรีเวกเตอร์ |
| `store.vector.extensionPath` | `string`  | ที่รวมมา | แทนที่พาธของ sqlite-vec          |

เมื่อไม่มี sqlite-vec, OpenClaw จะย้อนกลับไปใช้ความคล้ายคลึงแบบโคไซน์ในกระบวนการโดยอัตโนมัติ

---

## ที่เก็บดัชนี

| คีย์                  | ชนิด    | ค่าเริ่มต้น                              | คำอธิบาย                                 |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | ตำแหน่งดัชนี (รองรับโทเค็น `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | โทเคนไนเซอร์ FTS5 (`unicode61` หรือ `trigram`)   |

---

## การกำหนดค่าแบ็กเอนด์ QMD

ตั้งค่า `memory.backend = "qmd"` เพื่อเปิดใช้ การตั้งค่า QMD ทั้งหมดอยู่ภายใต้ `memory.qmd`:

| คีย์                     | ชนิด     | ค่าเริ่มต้น | คำอธิบาย                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | พาธไฟล์ปฏิบัติการ QMD; ตั้งค่าเป็นพาธสัมบูรณ์เมื่อ `PATH` ของบริการแตกต่างจากเชลล์ของคุณ |
| `searchMode`             | `string`  | `search` | คำสั่งค้นหา: `search`, `vsearch`, `query`                                          |
| `includeDefaultMemory`   | `boolean` | `true`   | ทำดัชนี `MEMORY.md` + `memory/**/*.md` โดยอัตโนมัติ                                             |
| `paths[]`                | `array`   | --       | พาธเพิ่มเติม: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | ทำดัชนีทรานสคริปต์เซสชัน                                                             |
| `sessions.retentionDays` | `number`  | --       | ระยะเวลาเก็บรักษาทรานสคริปต์                                                                  |
| `sessions.exportDir`     | `string`  | --       | ไดเรกทอรีส่งออก                                                                      |

`searchMode: "search"` เป็นแบบ lexical/BM25 เท่านั้น OpenClaw จะไม่เรียกใช้การตรวจสอบความพร้อมของเวกเตอร์เชิงความหมายหรือการบำรุงรักษา embedding ของ QMD สำหรับโหมดนั้น รวมถึงระหว่าง `memory status --deep`; `vsearch` และ `query` ยังคงต้องใช้ความพร้อมของเวกเตอร์ QMD และ embedding

OpenClaw เลือกรูปแบบ collection ของ QMD และรูปแบบ query ของ MCP ปัจจุบันเป็นหลัก แต่ยังคงรองรับ QMD รุ่นเก่าด้วยการลองใช้แฟล็กรูปแบบ collection ที่เข้ากันได้ และชื่อเครื่องมือ MCP รุ่นเก่าเมื่อจำเป็น เมื่อ QMD ประกาศว่ารองรับตัวกรอง collection หลายรายการ collection จากแหล่งเดียวกันจะถูกค้นหาด้วยกระบวนการ QMD เดียว; บิลด์ QMD รุ่นเก่าจะยังคงใช้เส้นทางความเข้ากันได้แบบแยกตาม collection แหล่งเดียวกันหมายถึง collection ของหน่วยความจำถาวรจะถูกจัดกลุ่มเข้าด้วยกัน ขณะที่ collection ของ transcript เซสชันจะยังอยู่เป็นกลุ่มแยก เพื่อให้การกระจายแหล่งที่มายังคงมีอินพุตทั้งสองแบบ

<Note>
การ override โมเดล QMD จะอยู่ฝั่ง QMD ไม่ใช่ใน config ของ OpenClaw หากคุณต้องการ override โมเดลของ QMD โดยรวม ให้ตั้งค่าตัวแปรสภาพแวดล้อม เช่น `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` และ `QMD_GENERATE_MODEL` ในสภาพแวดล้อมรันไทม์ของ gateway
</Note>

<AccordionGroup>
  <Accordion title="กำหนดการอัปเดต">
    | คีย์                       | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | ช่วงเวลาการรีเฟรช                      |
    | `update.debounceMs`       | `number`  | `15000` | หน่วงการเปลี่ยนแปลงไฟล์                 |
    | `update.onBoot`           | `boolean` | `true`  | รีเฟรชเมื่อ manager QMD แบบ long-lived เปิดขึ้น; ยังใช้ควบคุมการรีเฟรชตอนเริ่มต้นแบบ opt-in |
    | `update.startup`          | `string`  | `off`   | การรีเฟรชตอน gateway เริ่มต้นแบบไม่บังคับ: `off`, `idle` หรือ `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | หน่วงเวลาก่อนที่การรีเฟรช `startup: "idle"` จะทำงาน |
    | `update.waitForBootSync`  | `boolean` | `false` | บล็อกการเปิด manager จนกว่าการรีเฟรชเริ่มต้นจะเสร็จสิ้น |
    | `update.embedInterval`    | `string`  | --      | cadence ของ embed แยกต่างหาก                |
    | `update.commandTimeoutMs` | `number`  | --      | timeout สำหรับคำสั่ง QMD              |
    | `update.updateTimeoutMs`  | `number`  | --      | timeout สำหรับการดำเนินการอัปเดต QMD     |
    | `update.embedTimeoutMs`   | `number`  | --      | timeout สำหรับการดำเนินการ embed ของ QMD      |
  </Accordion>
  <Accordion title="ขีดจำกัด">
    | คีย์                       | ประเภท     | ค่าเริ่มต้น | คำอธิบาย                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | จำนวนผลลัพธ์การค้นหาสูงสุด         |
    | `limits.maxSnippetChars`  | `number` | --      | จำกัดความยาว snippet       |
    | `limits.maxInjectedChars` | `number` | --      | จำกัดจำนวนอักขระที่ inject ทั้งหมด |
    | `limits.timeoutMs`        | `number` | `4000`  | timeout การค้นหา             |
  </Accordion>
  <Accordion title="ขอบเขต">
    ควบคุมว่าเซสชันใดสามารถรับผลการค้นหา QMD ได้ schema เดียวกับ [`session.sendPolicy`](/th/gateway/config-agents#session):

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

    ค่าเริ่มต้นที่จัดส่งมาจะอนุญาตเซสชัน direct และ channel แต่ยังคงปฏิเสธกลุ่ม

    ค่าเริ่มต้นคือ DM เท่านั้น `match.keyPrefix` จับคู่กับคีย์เซสชันที่ normalize แล้ว; `match.rawKeyPrefix` จับคู่กับคีย์ดิบรวมถึง `agent:<id>:`

  </Accordion>
  <Accordion title="การอ้างอิงแหล่งที่มา">
    `memory.citations` ใช้กับ backend ทั้งหมด:

    | ค่า            | พฤติกรรม                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (ค่าเริ่มต้น) | ใส่ footer `Source: <path#line>` ใน snippet    |
    | `on`             | ใส่ footer เสมอ                               |
    | `off`            | ละเว้น footer (path ยังถูกส่งให้ agent ภายใน) |

  </Accordion>
</AccordionGroup>

การรีเฟรชตอนบูตของ QMD ใช้เส้นทาง subprocess แบบ one-shot ระหว่างการเริ่มต้น gateway manager QMD แบบ long-lived ยังคงเป็นเจ้าของ file watcher และ interval timer ปกติเมื่อเปิดการค้นหาหน่วยความจำเพื่อใช้งานแบบโต้ตอบ

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

Dreaming กำหนดค่าไว้ภายใต้ `plugins.entries.memory-core.config.dreaming` ไม่ใช่ภายใต้ `agents.defaults.memorySearch`

Dreaming ทำงานเป็น sweep ตามกำหนดการหนึ่งครั้ง และใช้เฟส light/deep/REM ภายในเป็นรายละเอียดการใช้งาน

สำหรับพฤติกรรมเชิงแนวคิดและคำสั่ง slash โปรดดู [Dreaming](/th/concepts/dreaming)

### การตั้งค่าผู้ใช้

| คีย์         | ประเภท      | ค่าเริ่มต้น       | คำอธิบาย                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | เปิดหรือปิด dreaming ทั้งหมด               |
| `frequency` | `string`  | `0 3 * * *`   | cadence ของ cron แบบไม่บังคับสำหรับ sweep dreaming เต็มรูปแบบ |
| `model`     | `string`  | โมเดลเริ่มต้น | override โมเดล subagent ของ Dream Diary แบบไม่บังคับ      |

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
- Dreaming เขียนเอาต์พุต narrative ที่มนุษย์อ่านได้ไปที่ `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่)
- `dreaming.model` ใช้ trust gate ของ subagent ใน plugin ที่มีอยู่; ตั้งค่า `plugins.entries.memory-core.subagent.allowModelOverride: true` ก่อนเปิดใช้งาน
- Dream Diary จะลองใหม่หนึ่งครั้งด้วยโมเดลเริ่มต้นของเซสชันเมื่อโมเดลที่กำหนดค่าไว้ใช้งานไม่ได้ ความล้มเหลวด้าน trust หรือ allowlist จะถูกบันทึก log และจะไม่ถูกลองใหม่แบบเงียบๆ
- นโยบายและ threshold ของเฟส light/deep/REM เป็นพฤติกรรมภายใน ไม่ใช่ config สำหรับผู้ใช้

</Note>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search)
