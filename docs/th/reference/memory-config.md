---
read_when:
    - คุณต้องการกำหนดค่าผู้ให้บริการค้นหา memory หรือโมเดล embedding
    - คุณต้องการตั้งค่าแบ็กเอนด์ QMD
    - คุณต้องการปรับแต่งการค้นหาแบบไฮบริด, MMR หรือ temporal decay
    - คุณต้องการเปิดใช้การทำดัชนี Memory แบบหลายสื่อ
sidebarTitle: Memory config
summary: ตัวเลือกการกำหนดค่าทั้งหมดสำหรับการค้นหา memory, ผู้ให้บริการ embedding, QMD, การค้นหาแบบไฮบริด และการทำดัชนีแบบหลายสื่อ
title: เอกสารอ้างอิงการกำหนดค่า Memory
x-i18n:
    generated_at: "2026-04-26T11:41:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15fd747abc6d0d43cfc869faa0b5e6c1618681ef3b02068207321d60d449a901
    source_path: reference/memory-config.md
    workflow: 15
---

หน้านี้แสดงตัวเลือกการกำหนดค่าทั้งหมดสำหรับการค้นหา memory ของ OpenClaw สำหรับภาพรวมเชิงแนวคิด โปรดดู:

<CardGroup cols={2}>
  <Card title="ภาพรวมของ Memory" href="/th/concepts/memory">
    วิธีการทำงานของ memory
  </Card>
  <Card title="เอนจินในตัว" href="/th/concepts/memory-builtin">
    แบ็กเอนด์ SQLite เริ่มต้น
  </Card>
  <Card title="เอนจิน QMD" href="/th/concepts/memory-qmd">
    sidecar แบบ local-first
  </Card>
  <Card title="การค้นหา Memory" href="/th/concepts/memory-search">
    ไปป์ไลน์การค้นหาและการปรับแต่ง
  </Card>
  <Card title="Active Memory" href="/th/concepts/active-memory">
    sub-agent ของ memory สำหรับเซสชันแบบโต้ตอบ
  </Card>
</CardGroup>

การตั้งค่าการค้นหา memory ทั้งหมดอยู่ภายใต้ `agents.defaults.memorySearch` ใน `openclaw.json` เว้นแต่จะระบุไว้เป็นอย่างอื่น

<Note>
หากคุณกำลังมองหาสวิตช์เปิด/ปิดฟีเจอร์ **Active Memory** และ config ของ sub-agent ฟีเจอร์นี้จะอยู่ภายใต้ `plugins.entries.active-memory` แทนที่จะเป็น `memorySearch`

Active Memory ใช้โมเดลสองเงื่อนไข:

1. ต้องเปิดใช้งาน Plugin และกำหนดให้ตรงกับ agent id ปัจจุบัน
2. คำขอต้องเป็นเซสชันแชตแบบโต้ตอบที่มีการคงอยู่ซึ่งเข้าเกณฑ์

ดู [Active Memory](/th/concepts/active-memory) สำหรับโมเดลการเปิดใช้งาน config ที่ Plugin เป็นเจ้าของ การคงอยู่ของทรานสคริปต์ และรูปแบบการทยอยเปิดใช้งานอย่างปลอดภัย
</Note>

---

## การเลือกผู้ให้บริการ

| คีย์        | ประเภท      | ค่าเริ่มต้น          | คำอธิบาย                                                                                                   |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | ตรวจจับอัตโนมัติ    | embedding adapter ID: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | ค่าเริ่มต้นของผู้ให้บริการ | ชื่อโมเดล embedding                                                                                          |
| `fallback` | `string`  | `"none"`         | fallback adapter ID เมื่อ primary ล้มเหลว                                                                    |
| `enabled`  | `boolean` | `true`           | เปิดหรือปิดการค้นหา memory                                                                               |

### ลำดับการตรวจจับอัตโนมัติ

เมื่อไม่ได้ตั้งค่า `provider` OpenClaw จะเลือกตัวแรกที่พร้อมใช้งาน:

<Steps>
  <Step title="local">
    จะถูกเลือกหากมีการตั้งค่า `memorySearch.local.modelPath` และไฟล์มีอยู่จริง
  </Step>
  <Step title="github-copilot">
    จะถูกเลือกหากสามารถแยกโทเค็น GitHub Copilot ได้ (ตัวแปร env หรือ auth profile)
  </Step>
  <Step title="openai">
    จะถูกเลือกหากสามารถแยกคีย์ OpenAI ได้
  </Step>
  <Step title="gemini">
    จะถูกเลือกหากสามารถแยกคีย์ Gemini ได้
  </Step>
  <Step title="voyage">
    จะถูกเลือกหากสามารถแยกคีย์ Voyage ได้
  </Step>
  <Step title="mistral">
    จะถูกเลือกหากสามารถแยกคีย์ Mistral ได้
  </Step>
  <Step title="bedrock">
    จะถูกเลือกหาก AWS SDK credential chain แยกได้สำเร็จ (instance role, access keys, profile, SSO, web identity หรือ shared config)
  </Step>
</Steps>

รองรับ `ollama` แต่จะไม่ถูกตรวจจับอัตโนมัติ (ให้ตั้งค่าเองโดยชัดเจน)

### การแยก API key

embedding แบบรีโมตต้องใช้ API key ส่วน Bedrock จะใช้ AWS SDK default credential chain แทน (instance roles, SSO, access keys)

| ผู้ให้บริการ       | ตัวแปร env                                            | คีย์ config                        |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock        | AWS credential chain                               | ไม่ต้องใช้ API key                 |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Auth profile ผ่าน device login     |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

<Note>
Codex OAuth ครอบคลุมเฉพาะ chat/completions เท่านั้น และไม่เพียงพอสำหรับคำขอ embedding
</Note>

---

## การกำหนดค่า endpoint แบบรีโมต

สำหรับ endpoint แบบเข้ากันได้กับ OpenAI แบบกำหนดเอง หรือการแทนที่ค่าเริ่มต้นของผู้ให้บริการ:

<ParamField path="remote.baseUrl" type="string">
  API base URL แบบกำหนดเอง
</ParamField>
<ParamField path="remote.apiKey" type="string">
  แทนที่ API key
</ParamField>
<ParamField path="remote.headers" type="object">
  HTTP headers เพิ่มเติม (รวมกับค่าเริ่มต้นของผู้ให้บริการ)
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
  <Accordion title="Bedrock">
    Bedrock ใช้ AWS SDK default credential chain — ไม่ต้องใช้ API keys หาก OpenClaw ทำงานบน EC2 พร้อม instance role ที่เปิดใช้งาน Bedrock เพียงตั้งค่าผู้ให้บริการและโมเดล:

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
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Bedrock embedding model ID ใดก็ได้  |
    | `outputDimensionality` | `number` | ค่าเริ่มต้นของโมเดล                  | สำหรับ Titan V2: 256, 512 หรือ 1024 |

    **โมเดลที่รองรับ** (พร้อมการตรวจจับ family และค่าเริ่มต้นของ dimensions):

    | Model ID                                   | ผู้ให้บริการ   | Dims เริ่มต้น | Dims ที่กำหนดค่าได้    |
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

    รูปแบบที่มี throughput suffix (เช่น `amazon.titan-embed-text-v1:2:8k`) จะสืบทอดการกำหนดค่าของโมเดลฐาน

    **การยืนยันตัวตน:** auth ของ Bedrock ใช้ลำดับการแยกข้อมูลรับรองมาตรฐานของ AWS SDK ดังนี้:

    1. ตัวแปรสภาพแวดล้อม (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. แคชโทเค็น SSO
    3. ข้อมูลรับรองจาก web identity token
    4. ไฟล์ shared credentials และ config
    5. ข้อมูลรับรองจาก metadata ของ ECS หรือ EC2

    region จะถูกแยกจาก `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` ของผู้ให้บริการ `amazon-bedrock` หรือใช้ค่าเริ่มต้นเป็น `us-east-1`

    **สิทธิ์ IAM:** IAM role หรือ user ต้องมี:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    สำหรับหลัก least-privilege ให้กำหนดขอบเขต `InvokeModel` ไปยังโมเดลที่ต้องการโดยเฉพาะ:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | คีย์                   | ประเภท               | ค่าเริ่มต้น                | คำอธิบาย                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | ดาวน์โหลดอัตโนมัติ        | พาธไปยังไฟล์โมเดล GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | ค่าเริ่มต้นของ node-llama-cpp | ไดเรกทอรีแคชสำหรับโมเดลที่ดาวน์โหลด                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | ขนาดหน้าต่าง context สำหรับ embedding context ค่า 4096 ครอบคลุม chunks ทั่วไป (128–512 โทเค็น) ขณะเดียวกันก็จำกัด non-weight VRAM ลดลงเป็น 1024–2048 บนโฮสต์ที่มีทรัพยากรจำกัด `"auto"` ใช้ค่าสูงสุดที่โมเดลฝึกมา — ไม่แนะนำสำหรับโมเดล 8B+ (Qwen3-Embedding-8B: 40 960 โทเค็น → ~32 GB VRAM เทียบกับ ~8.8 GB ที่ 4096) |

    โมเดลเริ่มต้น: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, ดาวน์โหลดอัตโนมัติ) ต้องใช้ native build: `pnpm approve-builds` แล้วตามด้วย `pnpm rebuild node-llama-cpp`

    ใช้ CLI แบบสแตนด์อโลนเพื่อตรวจสอบเส้นทางผู้ให้บริการเดียวกับที่ Gateway ใช้:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    หาก `provider` เป็น `auto` จะเลือก `local` ก็ต่อเมื่อ `local.modelPath` ชี้ไปยังไฟล์ในเครื่องที่มีอยู่จริงเท่านั้น การอ้างอิงโมเดลแบบ `hf:` และ HTTP(S) ยังสามารถใช้ได้โดยระบุ `provider: "local"` อย่างชัดเจน แต่สิ่งเหล่านี้จะไม่ทำให้ `auto` เลือก local ก่อนที่โมเดลจะพร้อมใช้งานบนดิสก์

  </Accordion>
</AccordionGroup>

### หมดเวลาของ inline embedding

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  แทนที่ค่า timeout สำหรับชุด embedding แบบ inline ระหว่างการทำดัชนี memory

หากไม่ตั้งค่า จะใช้ค่าเริ่มต้นของผู้ให้บริการ: 600 วินาทีสำหรับผู้ให้บริการแบบ local/self-hosted เช่น `local`, `ollama` และ `lmstudio` และ 120 วินาทีสำหรับผู้ให้บริการแบบโฮสต์ เพิ่มค่านี้เมื่อชุด embedding แบบ local ที่ใช้ CPU ทำงานได้ปกติแต่ช้า
</ParamField>

---

## การกำหนดค่าการค้นหาแบบไฮบริด

ทั้งหมดอยู่ภายใต้ `memorySearch.query.hybrid`:

| คีย์                   | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | เปิดใช้การค้นหาแบบไฮบริด BM25 + vector |
| `vectorWeight`        | `number`  | `0.7`   | น้ำหนักสำหรับคะแนน vector (0-1)     |
| `textWeight`          | `number`  | `0.3`   | น้ำหนักสำหรับคะแนน BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | ตัวคูณขนาดของกลุ่ม candidate     |

<Tabs>
  <Tab title="MMR (ความหลากหลาย)">
    | คีย์           | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                          |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | เปิดใช้การจัดอันดับใหม่ด้วย MMR                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = ความหลากหลายสูงสุด, 1 = ความเกี่ยวข้องสูงสุด |
  </Tab>
  <Tab title="Temporal decay (ความใหม่ล่าสุด)">
    | คีย์                          | ประเภท      | ค่าเริ่มต้น | คำอธิบาย               |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | เปิดใช้การเพิ่มคะแนนตามความใหม่      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | คะแนนจะลดลงครึ่งหนึ่งทุก N วัน |

    ไฟล์แบบ evergreen (`MEMORY.md`, ไฟล์ที่ไม่มีวันที่ใน `memory/`) จะไม่ถูกลดทอนคะแนน

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

พาธอาจเป็นแบบ absolute หรือสัมพันธ์กับ workspace ก็ได้ ไดเรกทอรีจะถูกสแกนแบบเรียกซ้ำสำหรับไฟล์ `.md` การจัดการ symlink ขึ้นอยู่กับแบ็กเอนด์ที่ใช้งานอยู่: เอนจินในตัวจะไม่สนใจ symlink ขณะที่ QMD จะทำตามพฤติกรรมของตัวสแกน QMD ที่ใช้อยู่

สำหรับการค้นหาทรานสคริปต์ข้าม agent แบบกำหนดขอบเขตต่อ agent ให้ใช้ `agents.list[].memorySearch.qmd.extraCollections` แทน `memory.qmd.paths` extra collections เหล่านั้นใช้รูปแบบ `{ path, name, pattern? }` เดียวกัน แต่จะถูกรวมต่อ agent และสามารถคงชื่อที่ใช้ร่วมกันซึ่งระบุไว้ชัดเจนได้เมื่อพาธชี้ออกนอก workspace ปัจจุบัน หากพาธที่แยกได้เดียวกันปรากฏทั้งใน `memory.qmd.paths` และ `memorySearch.qmd.extraCollections` QMD จะเก็บรายการแรกไว้และข้ามรายการที่ซ้ำ

---

## Memory แบบหลายสื่อ (Gemini)

ทำดัชนีภาพและเสียงควบคู่กับ Markdown โดยใช้ Gemini Embedding 2:

| คีย์                       | ประเภท       | ค่าเริ่มต้น    | คำอธิบาย                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | เปิดใช้การทำดัชนีแบบหลายสื่อ             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` หรือ `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | ขนาดไฟล์สูงสุดสำหรับการทำดัชนี             |

<Note>
ใช้กับไฟล์ใน `extraPaths` เท่านั้น ราก memory เริ่มต้นจะยังคงเป็น Markdown-only ต้องใช้ `gemini-embedding-2-preview` และ `fallback` ต้องเป็น `"none"`
</Note>

รูปแบบที่รองรับ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (ภาพ); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (เสียง)

---

## แคช embedding

| คีย์                | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | แคช chunk embeddings ใน SQLite |
| `cache.maxEntries` | `number`  | `50000` | จำนวน embeddings ที่แคชได้สูงสุด            |

ป้องกันการทำ embedding ใหม่สำหรับข้อความที่ไม่เปลี่ยนแปลงระหว่างการทำดัชนีใหม่หรือการอัปเดตทรานสคริปต์

---

## การทำดัชนีแบบ batch

| คีย์                           | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | เปิดใช้ batch embedding API |
| `remote.batch.concurrency`    | `number`  | `2`     | งาน batch แบบขนาน        |
| `remote.batch.wait`           | `boolean` | `true`  | รอให้ batch เสร็จสิ้น  |
| `remote.batch.pollIntervalMs` | `number`  | --      | ช่วงเวลา poll              |
| `remote.batch.timeoutMinutes` | `number`  | --      | timeout ของ batch              |

ใช้ได้กับ `openai`, `gemini` และ `voyage` โดยทั่วไป OpenAI batch จะเร็วและถูกที่สุดสำหรับการเติมข้อมูลย้อนหลังขนาดใหญ่

สิ่งนี้แยกจาก `sync.embeddingBatchTimeoutSeconds` ซึ่งควบคุมการเรียก embedding แบบ inline ที่ใช้โดยผู้ให้บริการแบบ local/self-hosted และผู้ให้บริการแบบโฮสต์เมื่อไม่ได้เปิดใช้งาน provider batch APIs

---

## การค้นหา memory ระดับเซสชัน (experimental)

ทำดัชนีทรานสคริปต์ของเซสชันและแสดงผลผ่าน `memory_search`:

| คีย์                           | ประเภท       | ค่าเริ่มต้น      | คำอธิบาย                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | เปิดใช้การทำดัชนีระดับเซสชัน                 |
| `sources`                     | `string[]` | `["memory"]` | เพิ่ม `"sessions"` เพื่อรวมทรานสคริปต์ |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | เกณฑ์จำนวนไบต์สำหรับการทำดัชนีใหม่              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | เกณฑ์จำนวนข้อความสำหรับการทำดัชนีใหม่           |

<Warning>
การทำดัชนีเซสชันเป็นแบบ opt-in และทำงานแบบอะซิงโครนัส ผลลัพธ์อาจล้าสมัยได้เล็กน้อย บันทึกของเซสชันอยู่บนดิสก์ ดังนั้นให้ถือว่าการเข้าถึงระบบไฟล์คือขอบเขตความเชื่อถือ
</Warning>

---

## การเร่งเวกเตอร์ของ SQLite (sqlite-vec)

| คีย์                          | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | ใช้ sqlite-vec สำหรับการคิวรีเวกเตอร์ |
| `store.vector.extensionPath` | `string`  | bundled | แทนที่พาธ sqlite-vec          |

เมื่อ sqlite-vec ใช้งานไม่ได้ OpenClaw จะ fallback ไปใช้ cosine similarity ในโปรเซสโดยอัตโนมัติ

---

## การจัดเก็บดัชนี

| คีย์                   | ประเภท     | ค่าเริ่มต้น                               | คำอธิบาย                                 |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | ตำแหน่งของดัชนี (รองรับโทเค็น `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5 tokenizer (`unicode61` หรือ `trigram`)   |

---

## การกำหนดค่าแบ็กเอนด์ QMD

ตั้งค่า `memory.backend = "qmd"` เพื่อเปิดใช้งาน การตั้งค่า QMD ทั้งหมดอยู่ภายใต้ `memory.qmd`:

| คีย์                      | ประเภท      | ค่าเริ่มต้น  | คำอธิบาย                                  |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`    | พาธของ executable QMD                          |
| `searchMode`             | `string`  | `search` | คำสั่งค้นหา: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`   | ทำดัชนี `MEMORY.md` + `memory/**/*.md` อัตโนมัติ    |
| `paths[]`                | `array`   | --       | พาธเพิ่มเติม: `{ name, path, pattern? }`      |
| `sessions.enabled`       | `boolean` | `false`  | ทำดัชนีทรานสคริปต์ของเซสชัน                    |
| `sessions.retentionDays` | `number`  | --       | ระยะเวลาการเก็บรักษาทรานสคริปต์                         |
| `sessions.exportDir`     | `string`  | --       | ไดเรกทอรี export                             |

OpenClaw จะเลือกใช้รูปร่าง collection และการคิวรี MCP ของ QMD รุ่นปัจจุบันก่อน แต่ยังคงรองรับ QMD รุ่นเก่าด้วยการ fallback ไปใช้แฟล็ก collection แบบ `--mask` เดิมและชื่อเครื่องมือ MCP แบบเก่าเมื่อจำเป็น

<Note>
การแทนที่โมเดลของ QMD จะอยู่ฝั่ง QMD ไม่ใช่ config ของ OpenClaw หากคุณต้องการแทนที่โมเดลของ QMD แบบส่วนกลาง ให้ตั้งค่าตัวแปรสภาพแวดล้อม เช่น `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` และ `QMD_GENERATE_MODEL` ในสภาพแวดล้อมรันไทม์ของ Gateway
</Note>

<AccordionGroup>
  <Accordion title="ตารางการอัปเดต">
    | คีย์                       | ประเภท      | ค่าเริ่มต้น | คำอธิบาย                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | ช่วงเวลารีเฟรช                      |
    | `update.debounceMs`       | `number`  | `15000` | debounce การเปลี่ยนแปลงของไฟล์                 |
    | `update.onBoot`           | `boolean` | `true`  | รีเฟรชตอนเริ่มต้นระบบ                    |
    | `update.waitForBootSync`  | `boolean` | `false` | บล็อกการเริ่มต้นจนกว่าการรีเฟรชจะเสร็จสมบูรณ์ |
    | `update.embedInterval`    | `string`  | --      | cadence แยกสำหรับ embedding                |
    | `update.commandTimeoutMs` | `number`  | --      | timeout สำหรับคำสั่ง QMD              |
    | `update.updateTimeoutMs`  | `number`  | --      | timeout สำหรับการดำเนินการอัปเดตของ QMD     |
    | `update.embedTimeoutMs`   | `number`  | --      | timeout สำหรับการดำเนินการ embedding ของ QMD      |
  </Accordion>
  <Accordion title="ขีดจำกัด">
    | คีย์                       | ประเภท     | ค่าเริ่มต้น | คำอธิบาย                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | จำนวนผลการค้นหาสูงสุด         |
    | `limits.maxSnippetChars`  | `number` | --      | จำกัดความยาวของ snippet       |
    | `limits.maxInjectedChars` | `number` | --      | จำกัดจำนวนอักขระที่ inject ทั้งหมด |
    | `limits.timeoutMs`        | `number` | `4000`  | timeout ของการค้นหา             |
  </Accordion>
  <Accordion title="ขอบเขต">
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

    ค่าเริ่มต้นที่มาพร้อมระบบอนุญาตทั้งเซสชัน direct และ channel ขณะที่ยังคงปฏิเสธกลุ่ม

    ค่าเริ่มต้นคือ DM-only `match.keyPrefix` จับคู่กับ session key ที่ถูกทำให้เป็นมาตรฐาน; `match.rawKeyPrefix` จับคู่กับคีย์ดิบรวมถึง `agent:<id>:`

  </Accordion>
  <Accordion title="การอ้างอิง">
    `memory.citations` ใช้กับทุกแบ็กเอนด์:

    | ค่า            | พฤติกรรม                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (ค่าเริ่มต้น) | รวมส่วนท้าย `Source: <path#line>` ใน snippet    |
    | `on`             | รวมส่วนท้ายเสมอ                               |
    | `off`            | ละเว้นส่วนท้าย (แต่ยังส่งพาธให้ agent ภายใน) |

  </Accordion>
</AccordionGroup>

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

Dreaming ถูกกำหนดค่าไว้ภายใต้ `plugins.entries.memory-core.config.dreaming` ไม่ใช่ภายใต้ `agents.defaults.memorySearch`

Dreaming ทำงานเป็นการกวาดตามกำหนดเวลาหนึ่งครั้ง และใช้เฟสภายในแบบ light/deep/REM เป็นรายละเอียดของการติดตั้งใช้งาน

สำหรับพฤติกรรมเชิงแนวคิดและคำสั่ง slash โปรดดู [Dreaming](/th/concepts/dreaming)

### การตั้งค่าผู้ใช้

| คีย์         | ประเภท      | ค่าเริ่มต้น     | คำอธิบาย                                       |
| ----------- | --------- | ----------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`     | เปิดหรือปิด Dreaming ทั้งหมด               |
| `frequency` | `string`  | `0 3 * * *` | Cron cadence แบบไม่บังคับสำหรับการกวาด Dreaming เต็มรูปแบบ |

### ตัวอย่าง

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming เขียนสถานะของเครื่องลงใน `memory/.dreams/`
- Dreaming เขียนเอาต์พุตเชิงบรรยายที่มนุษย์อ่านได้ลงใน `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่แล้ว)
- นโยบายและ threshold ของเฟส light/deep/REM เป็นพฤติกรรมภายใน ไม่ใช่ config สำหรับผู้ใช้
</Note>

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [ภาพรวมของ Memory](/th/concepts/memory)
- [การค้นหา Memory](/th/concepts/memory-search)
