---
read_when:
    - คุณกำลังกำหนดค่า Plugin memory-lancedb
    - คุณต้องการหน่วยความจำระยะยาวที่ใช้ LanceDB เป็นระบบจัดเก็บ พร้อมการเรียกคืนหรือบันทึกข้อมูลโดยอัตโนมัติ
    - คุณกำลังใช้การฝังเวกเตอร์ภายในเครื่องที่เข้ากันได้กับ OpenAI เช่น Ollama
sidebarTitle: Memory LanceDB
summary: กำหนดค่า Plugin หน่วยความจำ LanceDB ภายนอกอย่างเป็นทางการ รวมถึง embeddings ภายในเครื่องที่เข้ากันได้กับ Ollama
title: หน่วยความจำ LanceDB
x-i18n:
    generated_at: "2026-07-12T16:27:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` เป็น Plugin ภายนอกอย่างเป็นทางการที่จัดเก็บหน่วยความจำระยะยาวใน
LanceDB พร้อมการค้นหาแบบเวกเตอร์ โดยสามารถเรียกคืนหน่วยความจำที่เกี่ยวข้องโดยอัตโนมัติก่อน
รอบการทำงานของโมเดล และบันทึกข้อเท็จจริงสำคัญโดยอัตโนมัติหลังการตอบกลับ

ใช้ Plugin นี้เมื่อต้องการฐานข้อมูลเวกเตอร์ภายในเครื่อง ปลายทางการฝังข้อมูลที่เข้ากันได้กับ OpenAI หรือ
ที่เก็บหน่วยความจำที่อยู่นอกแบ็กเอนด์หน่วยความจำในตัวซึ่งเป็นค่าเริ่มต้น

## การติดตั้ง

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Plugin นี้เผยแพร่บน npm และไม่ได้รวมอยู่ในอิมเมจรันไทม์ของ OpenClaw
การติดตั้งจะเขียนรายการ Plugin เปิดใช้งาน และเปลี่ยน
`plugins.slots.memory` เป็น `memory-lancedb` หากมี Plugin อื่นครอบครอง
สล็อตหน่วยความจำอยู่ Plugin นั้นจะถูกปิดใช้งานพร้อมคำเตือน

<Note>
Plugin เสริม เช่น `memory-wiki` สามารถทำงานร่วมกับ `memory-lancedb` ได้
แต่ในแต่ละช่วงเวลาจะมี Plugin เพียงหนึ่งรายการเท่านั้นที่ครอบครองสล็อตหน่วยความจำที่ใช้งานอยู่
</Note>

## เริ่มต้นอย่างรวดเร็ว

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

รีสตาร์ต Gateway หลังเปลี่ยนการกำหนดค่า Plugin แล้วตรวจสอบว่าโหลดสำเร็จ:

```bash
openclaw gateway restart
openclaw plugins list
```

## การกำหนดค่าการฝังข้อมูล

จำเป็นต้องระบุ `embedding` และต้องมีอย่างน้อยหนึ่งฟิลด์ `provider`
มีค่าเริ่มต้นเป็น `openai` และ `model` มีค่าเริ่มต้นเป็น `text-embedding-3-small`

| ฟิลด์                  | ชนิด          | หมายเหตุ                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | สตริง        | รหัสอะแดปเตอร์ เช่น `openai`, `github-copilot`, `ollama` ค่าเริ่มต้นคือ `openai` |
| `embedding.model`      | สตริง        | ค่าเริ่มต้นคือ `text-embedding-3-small`                                        |
| `embedding.apiKey`     | สตริง        | ไม่บังคับ รองรับการขยาย `${ENV_VAR}`                               |
| `embedding.baseUrl`    | สตริง        | ไม่บังคับ รองรับการขยาย `${ENV_VAR}`                               |
| `embedding.dimensions` | จำนวนเต็ม (>=1) | จำเป็นสำหรับโมเดลที่ไม่มีในตารางในตัว (ดูด้านล่าง)               |

มีเส้นทางคำขอสองแบบ:

- **เส้นทางอะแดปเตอร์ของผู้ให้บริการ** (ค่าเริ่มต้น): กำหนด `embedding.provider` และไม่ระบุ
  `embedding.apiKey`/`embedding.baseUrl` Plugin จะค้นหาโปรไฟล์การยืนยันตัวตน
  ที่กำหนดค่าไว้ของผู้ให้บริการ ตัวแปรสภาพแวดล้อม หรือ
  `models.providers.<provider>.apiKey` ผ่านอะแดปเตอร์การฝังข้อมูลหน่วยความจำเดียวกับที่
  `memory-core` ใช้ เส้นทางนี้ใช้สำหรับ `github-copilot`, `ollama`
  และผู้ให้บริการในตัวรายอื่นที่รองรับการฝังข้อมูล
- **เส้นทางไคลเอนต์โดยตรงที่เข้ากันได้กับ OpenAI**: ไม่ต้องกำหนด `embedding.provider`
  (หรือกำหนดเป็น `"openai"`) และระบุ `embedding.apiKey` พร้อม `embedding.baseUrl` ใช้เส้นทางนี้
  สำหรับปลายทางการฝังข้อมูลที่เข้ากันได้กับ OpenAI โดยตรงซึ่งไม่มีอะแดปเตอร์ผู้ให้บริการในตัว

OAuth ของ OpenAI Codex / ChatGPT ไม่ใช่ข้อมูลประจำตัวสำหรับการฝังข้อมูลของ OpenAI Platform
สำหรับการฝังข้อมูลของ OpenAI ให้ใช้โปรไฟล์การยืนยันตัวตนด้วยคีย์ OpenAI API, `OPENAI_API_KEY` หรือ
`models.providers.openai.apiKey` ผู้ใช้ที่มีเฉพาะ OAuth ควรเลือกผู้ให้บริการอื่น
ที่รองรับการฝังข้อมูล เช่น `github-copilot` หรือ `ollama`

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

ปลายทางการฝังข้อมูลที่เข้ากันได้กับ OpenAI บางรายการปฏิเสธพารามิเตอร์ `encoding_format`
ส่วนบางรายการจะเพิกเฉยและส่งคืน `number[]` เสมอ `memory-lancedb`
จะไม่ส่ง `encoding_format` ในคำขอ และยอมรับทั้งการตอบกลับแบบอาร์เรย์เลขทศนิยมและ
เลขทศนิยม 32 บิตที่เข้ารหัสแบบ base64 ดังนั้นการตอบกลับทั้งสองรูปแบบจึงทำงานได้โดยไม่ต้องกำหนดค่าเพิ่มเติม

### จำนวนมิติ

OpenClaw มีจำนวนมิติในตัวเฉพาะสำหรับ `text-embedding-3-small` (1536) และ
`text-embedding-3-large` (3072) เท่านั้น โมเดลอื่นทั้งหมดต้องระบุ
`embedding.dimensions` อย่างชัดเจน เพื่อให้ LanceDB สร้างคอลัมน์เวกเตอร์ได้ ตัวอย่างเช่น
ZhiPu `embedding-3` ที่มี 2048 มิติ:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## การฝังข้อมูลด้วย Ollama

ใช้เส้นทางอะแดปเตอร์ผู้ให้บริการ Ollama ในตัว (`embedding.provider: "ollama"`)
เส้นทางนี้เรียกปลายทางดั้งเดิม `/api/embed` ของ Ollama และใช้กฎการยืนยันตัวตน/URL ฐาน
เดียวกับผู้ให้บริการ [Ollama](/th/providers/ollama)

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

`mxbai-embed-large` ไม่มีอยู่ในตารางจำนวนมิติในตัว จึงจำเป็นต้องระบุ `dimensions`
สำหรับโมเดลการฝังข้อมูลภายในเครื่องขนาดเล็ก ให้ลด `recallMaxChars` หาก
เซิร์ฟเวอร์ภายในเครื่องส่งคืนข้อผิดพลาดเกี่ยวกับความยาวบริบท

## ขีดจำกัดการเรียกคืนและการบันทึก

| การตั้งค่า           | ค่าเริ่มต้น | ช่วง                        | ใช้กับ                                                 |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | ข้อความที่ส่งไปยัง API การฝังข้อมูลเพื่อเรียกคืน                 |
| `captureMaxChars` | `500`   | 100-10000                    | ความยาวข้อความที่มีสิทธิ์ได้รับการบันทึกอัตโนมัติ                  |
| `customTriggers`  | `[]`    | 0-50 รายการ แต่ละรายการ <=100 อักขระ | วลีตามตัวอักษรที่ทำให้ระบบพิจารณาบันทึกข้อความโดยอัตโนมัติ |

`recallMaxChars` จำกัดคิวรีเรียกคืนอัตโนมัติของ `before_prompt_build`
เครื่องมือ `memory_recall` เส้นทางคิวรี `memory_forget` และ `openclaw ltm
search` การเรียกคืนอัตโนมัติจะฝังข้อมูลข้อความล่าสุดของผู้ใช้จากรอบการทำงาน และ
จะใช้พรอมต์ทั้งหมดแทนเฉพาะเมื่อไม่มีข้อความของผู้ใช้ เพื่อไม่ให้ข้อมูลเมตาของช่องทาง
และบล็อกพรอมต์ขนาดใหญ่รวมอยู่ในคำขอการฝังข้อมูล

`captureMaxChars` ใช้กำหนดว่าข้อความของผู้ใช้จากเหตุการณ์ `agent_end`
ของรอบการทำงานสั้นพอที่จะได้รับการพิจารณาสำหรับการบันทึกอัตโนมัติหรือไม่ โดยไม่มีผลต่อ
คิวรีการเรียกคืน

`customTriggers` เพิ่มวลีตามตัวอักษรสำหรับการบันทึกอัตโนมัติโดยไม่ใช้ regex ทริกเกอร์ในตัว
ครอบคลุมวลีเกี่ยวกับหน่วยความจำที่พบบ่อยในภาษาอังกฤษ เช็ก จีน ญี่ปุ่น และเกาหลี
(`remember`, `prefer`, `记住`, `覚えて`, `기억해` และวลีที่คล้ายกัน)

การบันทึกอัตโนมัติจะปฏิเสธข้อความที่ดูเหมือนข้อมูลเมตาของซองข้อความ/การรับส่ง
เพย์โหลดการแทรกพรอมต์ หรือบริบท `<relevant-memories>` ที่แทรกไว้แล้ว
และจำกัดการบันทึกไว้สูงสุด 3 หน่วยความจำต่อรอบการทำงานของเอเจนต์

## คำสั่ง

`memory-lancedb` ลงทะเบียนเนมสเปซ CLI `ltm` ทุกครั้งที่ติดตั้ง
(ไม่ใช่เฉพาะเมื่อครอบครองสล็อตหน่วยความจำที่ใช้งานอยู่):

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

`ltm query` เรียกใช้คิวรีที่ไม่ใช่เวกเตอร์กับตาราง LanceDB โดยตรง:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| แฟล็ก                              | ค่าเริ่มต้น                                 | หมายเหตุ                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | รายการคอลัมน์ที่อนุญาต คั่นด้วยจุลภาค                                                                                                         |
| `--filter <condition>`            | ไม่มี                                    | ส่วนคำสั่ง WHERE แบบ SQL ความยาวสูงสุด 200 อักขระ อนุญาตเฉพาะตัวอักษรและตัวเลข `_-` ช่องว่าง และ `='"<>!.,()%*`                              |
| `--limit <n>`                     | `10`                                    | จำนวนเต็มบวก                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | ไม่มี                                    | เรียงลำดับในหน่วยความจำหลังจากใช้ตัวกรอง คอลัมน์สำหรับเรียงจะถูกเพิ่มไปยังการฉายภาพโดยอัตโนมัติ และตัดออกจากผลลัพธ์หากไม่ได้ร้องขอ |

เอเจนต์ได้รับเครื่องมือสามรายการจาก Plugin หน่วยความจำที่ใช้งานอยู่:

- `memory_recall`: ค้นหาแบบเวกเตอร์ในหน่วยความจำที่จัดเก็บไว้
- `memory_store`: บันทึกข้อเท็จจริง ค่ากำหนด การตัดสินใจ หรือเอนทิตี (ปฏิเสธข้อความ
  ที่ดูเหมือนเพย์โหลดการแทรกพรอมต์ และข้ามการจัดเก็บข้อมูลที่เกือบซ้ำกัน)
- `memory_forget`: ลบด้วย `memoryId` หรือด้วย `query` (ลบผลลัพธ์เดียวโดยอัตโนมัติ
  เมื่อคะแนนสูงกว่า 90% มิฉะนั้นจะแสดงรายการรหัสที่เป็นไปได้เพื่อขจัดความกำกวม)

## พื้นที่จัดเก็บ

ข้อมูล LanceDB มีตำแหน่งเริ่มต้นที่ `~/.openclaw/memory/lancedb` เปลี่ยนได้ด้วย `dbPath`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

`storageOptions` ยอมรับคู่คีย์/ค่าแบบสตริงสำหรับแบ็กเอนด์พื้นที่จัดเก็บของ LanceDB
(เช่น พื้นที่จัดเก็บออบเจ็กต์ที่เข้ากันได้กับ S3) และรองรับการขยาย `${ENV_VAR}`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## การขึ้นต่อกันของรันไทม์และการรองรับแพลตฟอร์ม

`memory-lancedb` ขึ้นต่อแพ็กเกจเนทีฟ `@lancedb/lancedb` ซึ่งเป็นความรับผิดชอบของ
แพ็กเกจ Plugin (ไม่ใช่ดิสทริบิวชันหลักของ OpenClaw) การเริ่มต้น Gateway จะไม่ซ่อมแซม
การขึ้นต่อกันของ Plugin หากการขึ้นต่อกันแบบเนทีฟหายไปหรือโหลดไม่สำเร็จ
ให้ติดตั้งใหม่หรืออัปเดตแพ็กเกจ Plugin แล้วรีสตาร์ต Gateway

`@lancedb/lancedb` ไม่เผยแพร่บิลด์เนทีฟสำหรับ `darwin-x64` (Mac รุ่น Intel)
บนแพลตฟอร์มดังกล่าว Plugin จะบันทึกในล็อกว่า LanceDB ไม่พร้อมใช้งานขณะโหลด
ให้ใช้แบ็กเอนด์หน่วยความจำเริ่มต้น เรียกใช้ Gateway บนแพลตฟอร์ม/สถาปัตยกรรม
ที่รองรับ หรือปิดใช้งาน `memory-lancedb`

## การแก้ไขปัญหา

### ความยาวอินพุตเกินความยาวบริบท

โมเดลการฝังข้อมูลปฏิเสธคิวรีการเรียกคืน:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

ลด `recallMaxChars` แล้วรีสตาร์ต Gateway:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

สำหรับ Ollama ให้ตรวจสอบเพิ่มเติมว่าเซิร์ฟเวอร์การฝังข้อมูลสามารถเข้าถึงได้จากโฮสต์ของ Gateway
โดยใช้ปลายทางการฝังข้อมูลแบบเนทีฟ:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### โมเดลการฝังข้อมูลที่ไม่รองรับ

หากไม่มี `embedding.dimensions` ระบบจะทราบเฉพาะจำนวนมิติการฝังข้อมูลของ OpenAI
ที่มีอยู่ในตัว (`text-embedding-3-small`, `text-embedding-3-large`) สำหรับโมเดลอื่น
ให้กำหนด `embedding.dimensions` เป็นขนาดเวกเตอร์ที่โมเดลนั้นรายงาน

### Plugin โหลดสำเร็จแต่ไม่มีหน่วยความจำปรากฏ

ยืนยันว่า `plugins.slots.memory` ชี้ไปที่ `memory-lancedb` จากนั้นเรียกใช้:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

หากปิดใช้ `autoCapture` Plugin จะยังคงเรียกคืนความทรงจำที่มีอยู่ แต่จะไม่จัดเก็บความทรงจำใหม่โดยอัตโนมัติ ให้ใช้เครื่องมือ `memory_store` หรือเปิดใช้ `autoCapture`

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมความทรงจำ](/th/concepts/memory)
- [Active Memory](/th/concepts/active-memory)
- [การค้นหาความทรงจำ](/th/concepts/memory-search)
- [วิกิความทรงจำ](/th/plugins/memory-wiki)
- [Ollama](/th/providers/ollama)
