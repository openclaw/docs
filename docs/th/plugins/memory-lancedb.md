---
read_when:
    - คุณกำลังกำหนดค่า Plugin memory-lancedb
    - คุณต้องการหน่วยความจำระยะยาวที่ใช้ LanceDB พร้อมการเรียกคืนหรือบันทึกโดยอัตโนมัติ
    - คุณกำลังใช้ embeddings ที่เข้ากันได้กับ OpenAI แบบภายในเครื่อง เช่น Ollama
sidebarTitle: Memory LanceDB
summary: กำหนดค่า Plugin หน่วยความจำ LanceDB ภายนอกอย่างเป็นทางการ รวมถึง embeddings ภายในเครื่องที่เข้ากันได้กับ Ollama
title: หน่วยความจำ LanceDB
x-i18n:
    generated_at: "2026-07-16T19:29:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 786b511da4fbfd90f4c3e5be5a1aeddf5daa59036247552bd671f4bab89319f6
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` เป็น Plugin ภายนอกอย่างเป็นทางการที่จัดเก็บหน่วยความจำระยะยาวใน
LanceDB พร้อมการค้นหาแบบเวกเตอร์ โดยสามารถเรียกคืนความทรงจำที่เกี่ยวข้องโดยอัตโนมัติก่อนรอบการทำงานของโมเดล
และบันทึกข้อเท็จจริงสำคัญโดยอัตโนมัติหลังการตอบกลับ

ใช้ Plugin นี้สำหรับฐานข้อมูลเวกเตอร์ภายในเครื่อง, ปลายทางการฝังเวกเตอร์ที่เข้ากันได้กับ OpenAI หรือ
ที่เก็บหน่วยความจำภายนอกแบ็กเอนด์หน่วยความจำในตัวเริ่มต้น

## การติดตั้ง

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Plugin นี้เผยแพร่บน npm และไม่ได้รวมอยู่ในอิมเมจรันไทม์ของ OpenClaw
การติดตั้งจะเขียนรายการ Plugin เปิดใช้งาน และสลับ
`plugins.slots.memory` เป็น `memory-lancedb` หากมี Plugin อื่นครอบครอง
สล็อตหน่วยความจำอยู่ในขณะนั้น Plugin ดังกล่าวจะถูกปิดใช้งานพร้อมคำเตือน

<Note>
Plugin เสริม เช่น `memory-wiki` สามารถทำงานร่วมกับ `memory-lancedb`
ได้ แต่ในแต่ละช่วงเวลาจะมี Plugin เพียงรายการเดียวที่ครอบครองสล็อตหน่วยความจำที่ใช้งานอยู่
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

## การกำหนดค่าการฝังเวกเตอร์

ต้องระบุ `embedding` และต้องมีอย่างน้อยหนึ่งฟิลด์ `provider`
มีค่าเริ่มต้นเป็น `openai`; `model` มีค่าเริ่มต้นเป็น `text-embedding-3-small`

| ฟิลด์                  | ชนิด          | หมายเหตุ                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | สตริง        | รหัสอะแดปเตอร์ เช่น `openai`, `github-copilot`, `ollama` ค่าเริ่มต้นคือ `openai` |
| `embedding.model`      | สตริง        | ค่าเริ่มต้นคือ `text-embedding-3-small`                                        |
| `embedding.apiKey`     | สตริง        | ไม่บังคับ รองรับการขยาย `${ENV_VAR}`                               |
| `embedding.baseUrl`    | สตริง        | ไม่บังคับ รองรับการขยาย `${ENV_VAR}`                               |
| `embedding.dimensions` | จำนวนเต็ม (>=1) | จำเป็นสำหรับโมเดลที่ไม่มีอยู่ในตารางในตัว (ดูด้านล่าง)               |

มีเส้นทางคำขอสองแบบ:

- **เส้นทางอะแดปเตอร์ผู้ให้บริการ** (ค่าเริ่มต้น): ตั้งค่า `embedding.provider` และไม่ระบุ
  `embedding.apiKey`/`embedding.baseUrl` Plugin จะค้นหาโปรไฟล์การยืนยันตัวตน
  ตัวแปรสภาพแวดล้อม หรือ `models.providers.<provider>.apiKey` ที่กำหนดค่าไว้ของผู้ให้บริการ
  ผ่านอะแดปเตอร์การฝังเวกเตอร์หน่วยความจำชุดเดียวกับที่ `memory-core` ใช้
  นี่คือเส้นทางสำหรับ `github-copilot`, `ollama`
  และผู้ให้บริการอื่นที่รวมมาให้ซึ่งรองรับการฝังเวกเตอร์
- **เส้นทางไคลเอนต์โดยตรงที่เข้ากันได้กับ OpenAI**: ไม่ต้องตั้งค่า `embedding.provider`
  (หรือใช้ `"openai"`) และตั้งค่า `embedding.apiKey` พร้อม `embedding.baseUrl` ใช้เส้นทางนี้
  สำหรับปลายทางการฝังเวกเตอร์ดิบที่เข้ากันได้กับ OpenAI และไม่มีอะแดปเตอร์ผู้ให้บริการ
  ที่รวมมาให้

OAuth ของ OpenAI Codex / ChatGPT ไม่ใช่ข้อมูลประจำตัวสำหรับการฝังเวกเตอร์ของ OpenAI Platform
สำหรับการฝังเวกเตอร์ของ OpenAI ให้ใช้โปรไฟล์การยืนยันตัวตนด้วยคีย์ OpenAI API, `OPENAI_API_KEY` หรือ
`models.providers.openai.apiKey` ผู้ใช้ที่มีเฉพาะ OAuth ควรเลือกผู้ให้บริการอื่น
ที่รองรับการฝังเวกเตอร์ เช่น `github-copilot` หรือ `ollama`

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

ปลายทางการฝังเวกเตอร์บางรายการที่เข้ากันได้กับ OpenAI จะปฏิเสธพารามิเตอร์ `encoding_format`
ขณะที่บางรายการจะเพิกเฉยและส่งคืน `number[]` เสมอ `memory-lancedb`
จะละเว้น `encoding_format` ในคำขอ และรองรับทั้งการตอบกลับแบบอาร์เรย์จำนวนทศนิยมและ
float32 ที่เข้ารหัสแบบ base64 ดังนั้นรูปแบบการตอบกลับทั้งสองจึงทำงานได้โดยไม่ต้องกำหนดค่า

### มิติ

OpenClaw มีค่ามิติในตัวเฉพาะสำหรับ `text-embedding-3-small` (1536) และ
`text-embedding-3-large` (3072) เท่านั้น โมเดลอื่นทุกโมเดลต้องระบุ
`embedding.dimensions` อย่างชัดเจนเพื่อให้ LanceDB สร้างคอลัมน์เวกเตอร์ได้ ตัวอย่างเช่น
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

## การฝังเวกเตอร์ด้วย Ollama

ใช้เส้นทางอะแดปเตอร์ผู้ให้บริการ Ollama ที่รวมมาให้ (`embedding.provider: "ollama"`)
เส้นทางนี้เรียกปลายทาง `/api/embed` แบบเนทีฟของ Ollama และใช้กฎการยืนยันตัวตน/URL ฐาน
ชุดเดียวกับผู้ให้บริการ [Ollama](/th/providers/ollama)

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

`mxbai-embed-large` ไม่มีอยู่ในตารางมิติในตัว จึงจำเป็นต้องระบุ `dimensions`
สำหรับโมเดลการฝังเวกเตอร์ภายในเครื่องขนาดเล็ก ให้ลด `recallMaxChars` หาก
เซิร์ฟเวอร์ภายในเครื่องส่งคืนข้อผิดพลาดด้านความยาวบริบท

## ขีดจำกัดการเรียกคืนและการบันทึก

| การตั้งค่า           | ค่าเริ่มต้น | ช่วง                        | ใช้กับ                                                 |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | ข้อความที่ส่งไปยัง API การฝังเวกเตอร์เพื่อเรียกคืน                 |
| `captureMaxChars` | `500`   | 100-10000                    | ความยาวข้อความที่มีสิทธิ์ได้รับการบันทึกอัตโนมัติ                  |
| `customTriggers`  | `[]`    | 0-50 รายการ แต่ละรายการ <=100 อักขระ | วลีตามตัวอักษรที่ทำให้ระบบพิจารณาข้อความสำหรับการบันทึกอัตโนมัติ |

`recallMaxChars` จำกัดขอบเขตคำค้นการเรียกคืนอัตโนมัติของ `before_prompt_build`,
เครื่องมือ `memory_recall`, เส้นทางคำค้น `memory_forget` และ `openclaw ltm
search` การเรียกคืนอัตโนมัติจะฝังเวกเตอร์ข้อความล่าสุดของผู้ใช้จากรอบการทำงาน และใช้
พรอมต์ทั้งหมดเป็นทางเลือกสำรองเฉพาะเมื่อไม่มีข้อความจากผู้ใช้เท่านั้น เพื่อไม่ให้ข้อมูลเมตาของช่องทาง
และบล็อกพรอมต์ขนาดใหญ่รวมอยู่ในคำขอการฝังเวกเตอร์

`captureMaxChars` ควบคุมว่าข้อความของผู้ใช้จากเหตุการณ์ `agent_end`
ของรอบการทำงานสั้นพอที่จะได้รับการพิจารณาสำหรับการบันทึกอัตโนมัติหรือไม่ โดยไม่มีผลต่อ
คำค้นสำหรับการเรียกคืน

`customTriggers` เพิ่มวลีสำหรับการบันทึกอัตโนมัติแบบตรงตัวโดยไม่ใช้ regex ทริกเกอร์ในตัว
ครอบคลุมวลีเกี่ยวกับหน่วยความจำที่พบบ่อยในภาษาอังกฤษ เช็ก จีน ญี่ปุ่น และเกาหลี
(`remember`, `prefer`, `记住`, `覚えて`, `기억해` และวลีที่คล้ายกัน)

การบันทึกอัตโนมัติยังปฏิเสธข้อความที่มีลักษณะเป็นข้อมูลเมตาของเอนเวโลป/การขนส่ง
เพย์โหลดการแทรกพรอมต์ หรือบริบท `<relevant-memories>` ที่แทรกไว้แล้ว
และจำกัดไว้ที่หน่วยความจำที่บันทึกได้ 3 รายการต่อรอบการทำงานของเอเจนต์

หน่วยความจำแต่ละรายการมีเอเจนต์หนึ่งรายเป็นเจ้าของ การเรียกคืน การตรวจหารายการซ้ำ การบันทึก
การแสดงรายการ คำค้นดิบ และการลบ ล้วนบังคับใช้เจ้าของรายนั้นก่อนส่งคืนหรือ
แก้ไขแถว เอเจนต์ที่มี `memorySearch.enabled: false` (ใน `agents.list[]`
หรือผ่าน `agents.defaults`) จะไม่ได้รับเครื่องมือ `memory_recall`, `memory_store`
หรือ `memory_forget` และจะไม่เข้าร่วมการเรียกคืนหรือ
การบันทึกอัตโนมัติ แม้เปิดใช้แฟล็ก `autoRecall`/`autoCapture` ระดับ Plugin อยู่ก็ตาม

## คำสั่ง

`memory-lancedb` ลงทะเบียนเนมสเปซ CLI `ltm` ทุกครั้งที่ติดตั้ง
(ไม่ใช่เฉพาะเมื่อครอบครองสล็อตหน่วยความจำที่ใช้งานอยู่):

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` เรียกใช้คำค้นที่ไม่ใช่เวกเตอร์โดยตรงกับตาราง LanceDB:

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| แฟล็ก                              | ค่าเริ่มต้น                                 | หมายเหตุ                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | เอเจนต์เริ่มต้นที่กำหนดค่าไว้                | เลือกเนมสเปซส่วนตัวของเอเจนต์ ใช้ได้กับ `list`, `search`, `query` และ `stats`                                                 |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | รายการคอลัมน์ที่อนุญาตคั่นด้วยจุลภาค                                                                                                         |
| `--filter <condition>`            | ไม่มี                                    | การเปรียบเทียบหนึ่งรายการกับคอลัมน์ผลลัพธ์ เช่น `category = 'preference'` หรือ `importance >= 0.8` ต้องใส่ค่าสตริงในเครื่องหมายอัญประกาศ             |
| `--limit <n>`                     | `10`                                    | จำนวนเต็มบวก                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | ไม่มี                                    | เรียงลำดับในหน่วยความจำหลังใช้ตัวกรอง คอลัมน์ที่ใช้เรียงจะถูกเพิ่มในการฉายภาพโดยอัตโนมัติ และตัดออกจากผลลัพธ์หากไม่ได้ร้องขอ |

เอเจนต์ได้รับเครื่องมือสามรายการจาก Plugin หน่วยความจำที่ใช้งานอยู่:

- `memory_recall`: ค้นหาแบบเวกเตอร์ในหน่วยความจำที่จัดเก็บไว้
- `memory_store`: บันทึกข้อเท็จจริง ค่ากำหนด การตัดสินใจ หรือเอนทิตี (ปฏิเสธข้อความ
  ที่มีลักษณะเป็นเพย์โหลดการแทรกพรอมต์ และข้ามการจัดเก็บรายการที่เกือบซ้ำกัน)
- `memory_forget`: ลบด้วย `memoryId` หรือด้วย `query` (ลบโดยอัตโนมัติเมื่อมีผลลัพธ์ตรงกันหนึ่งรายการ
  ที่มีคะแนนสูงกว่า 90% มิฉะนั้นจะแสดงรหัสตัวเลือกเพื่อให้ระบุรายการอย่างชัดเจน)

## พื้นที่จัดเก็บ

ข้อมูล LanceDB มีค่าเริ่มต้นเป็น `~/.openclaw/memory/lancedb` แทนที่ด้วย `dbPath`:

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

Plugin จะเก็บตาราง LanceDB หนึ่งตารางและจัดเก็บเจ้าของเอเจนต์ในรูปแบบมาตรฐานไว้ในแต่ละ
แถว นี่คือขอบเขตพื้นที่จัดเก็บ ไม่ใช่ตัวกรองหลังการค้นหา โดยระบบจะใช้ความเป็นเจ้าของของเอเจนต์
ก่อนจัดอันดับเวกเตอร์ และรวมไว้ในเพรดิเคตสำหรับการแสดงรายการ คำค้น การนับ และการลบ
`ltm query --filter` รองรับการเปรียบเทียบที่ผ่านการตรวจสอบแล้วหนึ่งรายการกับ
คอลัมน์ผลลัพธ์สาธารณะ ที่เก็บจะสร้างการเปรียบเทียบนั้นแยกจาก
เพรดิเคตเจ้าของที่บังคับใช้ ดังนั้นตัวกรองจึงไม่สามารถขยายคำค้นไปยังเอเจนต์อื่นได้

ฐานข้อมูลที่สร้างขึ้นก่อนมีการกำหนดความเป็นเจ้าของแยกตามเอเจนต์ไม่มีแหล่งที่มาของแถวที่เชื่อถือได้
เมื่ออัปเกรด `openclaw doctor --fix` จะกำหนดแถวดั้งเดิมเหล่านั้นให้กับ
เอเจนต์เริ่มต้นที่กำหนดค่าไว้เพียงครั้งเดียว การเข้าถึงขณะรันไทม์จะปฏิเสธการทำงานตามค่าเริ่มต้นจนกว่าการย้ายข้อมูลดังกล่าว
จะเสร็จสมบูรณ์ เอเจนต์อื่นจะไม่ได้รับช่วงแถวที่เคยใช้ร่วมกันเหล่านั้น

`storageOptions` รองรับคู่คีย์/ค่าสตริงสำหรับแบ็กเอนด์พื้นที่จัดเก็บของ LanceDB
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

`memory-lancedb` ขึ้นอยู่กับแพ็กเกจเนทีฟ `@lancedb/lancedb` ซึ่งเป็นของ
แพ็กเกจ Plugin (ไม่ใช่ดิสทริบิวชันหลักของ OpenClaw) การเริ่มต้น Gateway จะไม่ซ่อมแซม
การขึ้นต่อกันของ Plugin หากการขึ้นต่อกันแบบเนทีฟขาดหายไปหรือโหลดไม่สำเร็จ
ให้ติดตั้งใหม่หรืออัปเดตแพ็กเกจ Plugin แล้วเริ่ม Gateway ใหม่

`@lancedb/lancedb` ไม่มีบิลด์เนทีฟสำหรับ `darwin-x64` (Intel
Mac) บนแพลตฟอร์มนั้น Plugin จะบันทึกในล็อกว่า LanceDB ไม่พร้อมใช้งานขณะ
โหลด ให้ใช้แบ็กเอนด์หน่วยความจำเริ่มต้น เรียกใช้ Gateway บน
แพลตฟอร์ม/สถาปัตยกรรมที่รองรับ หรือปิดใช้งาน `memory-lancedb`

## การแก้ไขปัญหา

### ความยาวอินพุตเกินความยาวบริบท

โมเดล embedding ปฏิเสธคำค้นคืนข้อมูล:

```text
memory-lancedb: การเรียกคืนล้มเหลว: ข้อผิดพลาด: 400 ความยาวอินพุตเกินความยาวบริบท
```

ลด `recallMaxChars` แล้วเริ่ม Gateway ใหม่:

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

สำหรับ Ollama ให้ตรวจสอบด้วยว่าสามารถเข้าถึงเซิร์ฟเวอร์ embedding จากโฮสต์
Gateway ผ่านเอนด์พอยต์ embed แบบเนทีฟได้:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### โมเดล embedding ที่ไม่รองรับ

หากไม่มี `embedding.dimensions` ระบบจะทราบเฉพาะมิติ embedding ของ OpenAI
ที่มีมาให้ในตัว (`text-embedding-3-small`, `text-embedding-3-large`) สำหรับ
โมเดลอื่นใด ให้ตั้งค่า `embedding.dimensions` เป็นขนาดเวกเตอร์ที่โมเดลนั้นรายงาน

### Plugin โหลดแล้วแต่ไม่มีความทรงจำปรากฏขึ้น

ยืนยันว่า `plugins.slots.memory` ชี้ไปที่ `memory-lancedb` แล้วเรียกใช้:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

หากปิดใช้งาน `autoCapture` Plugin จะยังคงเรียกคืนความทรงจำที่มีอยู่ แต่
จะไม่จัดเก็บความทรงจำใหม่โดยอัตโนมัติ ให้ใช้เครื่องมือ `memory_store` หรือเปิดใช้งาน
`autoCapture`

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [Active Memory](/th/concepts/active-memory)
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search)
- [วิกิหน่วยความจำ](/th/plugins/memory-wiki)
- [Ollama](/th/providers/ollama)
