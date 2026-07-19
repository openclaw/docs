---
read_when:
    - คุณกำลังกำหนดค่า Plugin memory-lancedb
    - คุณต้องการหน่วยความจำระยะยาวที่ใช้ LanceDB พร้อมการเรียกคืนหรือบันทึกโดยอัตโนมัติ
    - คุณกำลังใช้ embeddings ที่เข้ากันได้กับ OpenAI แบบภายในเครื่อง เช่น Ollama
sidebarTitle: Memory LanceDB
summary: กำหนดค่า Plugin หน่วยความจำ LanceDB ภายนอกอย่างเป็นทางการ รวมถึง embeddings ที่เข้ากันได้กับ Ollama ภายในเครื่อง
title: หน่วยความจำ LanceDB
x-i18n:
    generated_at: "2026-07-19T07:20:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 771b28b9775175f53d3e6543e66618a56dd40ef95598c00c7abf9b62fb261e47
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` เป็น Plugin ภายนอกอย่างเป็นทางการที่จัดเก็บหน่วยความจำระยะยาวใน
LanceDB พร้อมการค้นหาแบบเวกเตอร์ โดยสามารถเรียกคืนหน่วยความจำที่เกี่ยวข้องโดยอัตโนมัติก่อนรอบ
การทำงานของโมเดล และบันทึกข้อเท็จจริงสำคัญโดยอัตโนมัติหลังการตอบกลับ

ใช้สำหรับฐานข้อมูลเวกเตอร์ภายในเครื่อง, ปลายทางการฝังข้อมูลที่เข้ากันได้กับ OpenAI หรือ
พื้นที่จัดเก็บหน่วยความจำที่อยู่นอกแบ็กเอนด์หน่วยความจำในตัวเริ่มต้น

## การติดตั้ง

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Plugin นี้เผยแพร่บน npm และไม่ได้รวมอยู่ในอิมเมจรันไทม์ของ OpenClaw
การติดตั้งจะเขียนรายการ Plugin เปิดใช้งาน และสลับ
`plugins.slots.memory` เป็น `memory-lancedb` หากมี Plugin อื่นครอบครอง
สล็อตหน่วยความจำอยู่ในขณะนั้น Plugin ดังกล่าวจะถูกปิดใช้งานพร้อมคำเตือน

<Note>
Plugin เสริม เช่น `memory-wiki` สามารถทำงานร่วมกับ `memory-lancedb` ได้
แต่มีเพียง Plugin เดียวเท่านั้นที่ครอบครองสล็อตหน่วยความจำที่ใช้งานอยู่ในแต่ละครั้ง
</Note>

<Note>
`memory_recall` ของ LanceDB ไม่ได้รับการอนุญาตสำหรับทรานสคริปต์ส่วนตัวที่มีการป้องกัน
ซึ่ง `memorySearch.rememberAcrossConversations` ใช้ ให้ใช้
`autoRecall` ของ LanceDB หรือเครื่องมือ `memory_recall` ผ่าน
[Active Memory ขั้นสูง](/th/concepts/active-memory#lancedb-memory)
`openclaw doctor` จะแจ้งเมื่อฟังก์ชันจดจำข้ามการสนทนาไม่พร้อมใช้งาน
กับผู้ให้บริการหน่วยความจำปัจจุบัน
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
มีค่าเริ่มต้นเป็น `openai`; `model` มีค่าเริ่มต้นเป็น `text-embedding-3-small`

| ฟิลด์                  | ชนิด          | หมายเหตุ                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | สตริง        | ID ของอะแดปเตอร์ เช่น `openai`, `github-copilot`, `ollama` ค่าเริ่มต้นคือ `openai` |
| `embedding.model`      | สตริง        | ค่าเริ่มต้นคือ `text-embedding-3-small`                                        |
| `embedding.apiKey`     | สตริง        | ไม่บังคับ; รองรับการขยาย `${ENV_VAR}`                               |
| `embedding.baseUrl`    | สตริง        | ไม่บังคับ; รองรับการขยาย `${ENV_VAR}`                               |
| `embedding.dimensions` | จำนวนเต็ม (>=1) | จำเป็นสำหรับโมเดลที่ไม่อยู่ในตารางในตัว (ดูด้านล่าง)               |

มีเส้นทางคำขอสองแบบ:

- **เส้นทางอะแดปเตอร์ผู้ให้บริการ** (ค่าเริ่มต้น): ตั้งค่า `embedding.provider` และไม่ต้องระบุ
  `embedding.apiKey`/`embedding.baseUrl` Plugin จะค้นหาโปรไฟล์การยืนยันตัวตน
  ที่กำหนดค่าไว้ของผู้ให้บริการ ตัวแปรสภาพแวดล้อม หรือ
  `models.providers.<provider>.apiKey` ผ่านอะแดปเตอร์การฝังข้อมูลหน่วยความจำเดียวกับที่
  `memory-core` ใช้ เส้นทางนี้ใช้สำหรับ `github-copilot`, `ollama`
  และผู้ให้บริการอื่นที่รวมมาให้และรองรับการฝังข้อมูล
- **เส้นทางไคลเอนต์โดยตรงที่เข้ากันได้กับ OpenAI**: ไม่ต้องตั้งค่า
  `embedding.provider` (หรือใช้ `"openai"`) และตั้งค่า `embedding.apiKey` พร้อม `embedding.baseUrl` ใช้เส้นทางนี้
  สำหรับปลายทางการฝังข้อมูลดิบที่เข้ากันได้กับ OpenAI ซึ่งไม่มีอะแดปเตอร์
  ผู้ให้บริการที่รวมมาให้

OpenAI Codex / ChatGPT OAuth ไม่ใช่ข้อมูลประจำตัวสำหรับการฝังข้อมูลของ OpenAI Platform
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

ปลายทางการฝังข้อมูลที่เข้ากันได้กับ OpenAI บางแห่งปฏิเสธพารามิเตอร์ `encoding_format`
ขณะที่บางแห่งเพิกเฉยและส่งคืน `number[]` เสมอ `memory-lancedb`
จะไม่ใส่ `encoding_format` ในคำขอ และยอมรับทั้งการตอบกลับแบบอาร์เรย์จำนวนทศนิยม
หรือ float32 ที่เข้ารหัสด้วย base64 ดังนั้นรูปแบบการตอบกลับทั้งสองแบบจึงใช้งานได้โดยไม่ต้องกำหนดค่า

### มิติ

OpenClaw มีมิติในตัวเฉพาะสำหรับ `text-embedding-3-small` (1536) และ
`text-embedding-3-large` (3072) เท่านั้น โมเดลอื่นต้องระบุ
`embedding.dimensions` อย่างชัดเจนเพื่อให้ LanceDB สร้างคอลัมน์เวกเตอร์ได้ เช่น
ZhiPu `embedding-3` ที่ 2048 มิติ:

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

ใช้เส้นทางอะแดปเตอร์ผู้ให้บริการ Ollama ที่รวมมาให้ (`embedding.provider: "ollama"`)
เส้นทางนี้เรียกใช้ปลายทาง `/api/embed` แบบเนทีฟของ Ollama และปฏิบัติตามกฎการยืนยันตัวตน/URL ฐาน
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

`mxbai-embed-large` ไม่อยู่ในตารางมิติในตัว จึงจำเป็นต้องระบุ `dimensions`
สำหรับโมเดลการฝังข้อมูลภายในเครื่องขนาดเล็ก ให้ลด `recallMaxChars` หาก
เซิร์ฟเวอร์ภายในเครื่องส่งคืนข้อผิดพลาดเกี่ยวกับความยาวบริบท

## ขีดจำกัดการเรียกคืนและการบันทึก

| การตั้งค่า           | ค่าเริ่มต้น | ช่วง                        | ใช้กับ                                                 |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | ข้อความที่ส่งไปยัง API การฝังข้อมูลเพื่อเรียกคืน                 |
| `captureMaxChars` | `500`   | 100-10000                    | ความยาวข้อความที่มีสิทธิ์ได้รับการบันทึกอัตโนมัติ                  |
| `customTriggers`  | `[]`    | 0-50 รายการ แต่ละรายการ <=100 อักขระ | วลีตามตัวอักษรที่ทำให้ระบบพิจารณาข้อความสำหรับการบันทึกอัตโนมัติ |

`recallMaxChars` จำกัดคิวรีเรียกคืนอัตโนมัติของ `before_prompt_build`,
เครื่องมือ `memory_recall`, เส้นทางคิวรี `memory_forget` และ `openclaw ltm
search` การเรียกคืนอัตโนมัติจะฝังข้อความล่าสุดของผู้ใช้จากรอบการทำงาน และจะย้อนกลับไปใช้พรอมต์ฉบับเต็ม
เฉพาะเมื่อไม่มีข้อความของผู้ใช้เท่านั้น จึงไม่รวมข้อมูลเมตาของช่องทาง
และบล็อกพรอมต์ขนาดใหญ่ไว้ในคำขอการฝังข้อมูล

`captureMaxChars` กำหนดว่าข้อความของผู้ใช้จากเหตุการณ์ `agent_end`
ของรอบการทำงานสั้นพอที่จะพิจารณาสำหรับการบันทึกอัตโนมัติหรือไม่ โดยไม่มีผลต่อ
คิวรีเรียกคืน

`customTriggers` เพิ่มวลีสำหรับการบันทึกอัตโนมัติแบบตรงตัวโดยไม่ใช้ regex ทริกเกอร์
ในตัวครอบคลุมวลีเกี่ยวกับหน่วยความจำที่ใช้ทั่วไปในภาษาอังกฤษ เช็ก จีน ญี่ปุ่น และเกาหลี
(`remember`, `prefer`, `记住`, `覚えて`, `기억해` และวลีที่คล้ายกัน)

การบันทึกอัตโนมัติยังปฏิเสธข้อความที่ดูเหมือนข้อมูลเมตาของเอนเวโลป/การขนส่ง
เพย์โหลดการแทรกพรอมต์ หรือบริบท `<relevant-memories>` ที่แทรกไว้แล้ว
และจำกัดการบันทึกหน่วยความจำสูงสุด 3 รายการต่อรอบการทำงานของเอเจนต์

หน่วยความจำแต่ละรายการมีเอเจนต์หนึ่งรายเป็นเจ้าของ การเรียกคืน การตรวจหารายการซ้ำ การบันทึก
การแสดงรายการ คิวรีดิบ และการลบ ล้วนบังคับใช้เจ้าของดังกล่าวก่อนส่งคืนหรือ
แก้ไขแถว เอเจนต์ที่มี `memorySearch.enabled: false` (ใน `agents.list[]`
หรือผ่าน `agents.defaults`) จะไม่ได้รับเครื่องมือ `memory_recall`, `memory_store`
หรือ `memory_forget` และจะไม่เข้าร่วมการเรียกคืนหรือ
การบันทึกอัตโนมัติ แม้เปิดแฟล็ก `autoRecall`/`autoCapture` ระดับ Plugin ไว้ก็ตาม

## คำสั่ง

`memory-lancedb` ลงทะเบียนเนมสเปซ CLI `ltm` ทุกครั้งที่ติดตั้ง
(ไม่ใช่เฉพาะเมื่อครอบครองสล็อตหน่วยความจำที่ใช้งานอยู่):

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` เรียกใช้คิวรีที่ไม่ใช่เวกเตอร์กับตาราง LanceDB โดยตรง:

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| แฟล็ก                              | ค่าเริ่มต้น                                 | หมายเหตุ                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | เอเจนต์เริ่มต้นที่กำหนดค่าไว้                | เลือกเนมสเปซส่วนตัวของเอเจนต์ ใช้ได้กับ `list`, `search`, `query` และ `stats`                                                 |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | รายการคอลัมน์ที่อนุญาตคั่นด้วยจุลภาค                                                                                                         |
| `--filter <condition>`            | ไม่มี                                    | การเปรียบเทียบหนึ่งรายการกับคอลัมน์ผลลัพธ์ เช่น `category = 'preference'` หรือ `importance >= 0.8` ต้องใส่ค่าสตริงไว้ในเครื่องหมายคำพูด             |
| `--limit <n>`                     | `10`                                    | จำนวนเต็มบวก                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | ไม่มี                                    | เรียงลำดับในหน่วยความจำหลังตัวกรองทำงาน โดยเพิ่มคอลัมน์สำหรับเรียงลำดับลงในการฉายภาพโดยอัตโนมัติ และตัดออกจากผลลัพธ์หากไม่ได้ร้องขอ |

เอเจนต์ได้รับเครื่องมือสามรายการจาก Plugin หน่วยความจำที่ใช้งานอยู่:

- `memory_recall`: ค้นหาแบบเวกเตอร์ในหน่วยความจำที่จัดเก็บไว้
- `memory_store`: บันทึกข้อเท็จจริง ค่ากำหนด การตัดสินใจ หรือเอนทิตี (ปฏิเสธข้อความ
  ที่ดูเหมือนเพย์โหลดการแทรกพรอมต์ และข้ามการจัดเก็บรายการที่เกือบซ้ำกัน)
- `memory_forget`: ลบตาม `memoryId` หรือตาม `query` (ลบอัตโนมัติเมื่อมีรายการที่ตรงกันหนึ่งรายการ
  และมีคะแนนสูงกว่า 90% มิฉะนั้นจะแสดง ID ของรายการที่เป็นไปได้เพื่อให้ระบุได้ชัดเจน)

## พื้นที่จัดเก็บ

ข้อมูล LanceDB มีค่าเริ่มต้นเป็น `~/.openclaw/memory/lancedb` เขียนทับด้วย `dbPath`:

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

Plugin เก็บตาราง LanceDB หนึ่งตารางและจัดเก็บเจ้าของเอเจนต์ที่ปรับเป็นรูปแบบมาตรฐานในแต่ละ
แถว นี่คือขอบเขตของพื้นที่จัดเก็บ ไม่ใช่ตัวกรองหลังการค้นหา โดยจะใช้
ความเป็นเจ้าของของเอเจนต์ก่อนการจัดอันดับเวกเตอร์ และรวมไว้ในเพรดิเคตสำหรับการแสดงรายการ คิวรี การนับ และการลบ
`ltm query --filter` ยอมรับการเปรียบเทียบที่ผ่านการตรวจสอบหนึ่งรายการกับ
คอลัมน์ผลลัพธ์สาธารณะ พื้นที่จัดเก็บจะสร้างการเปรียบเทียบดังกล่าวแยกจาก
เพรดิเคตเจ้าของที่บังคับใช้ ดังนั้นตัวกรองจึงไม่สามารถขยายคิวรีไปยังเอเจนต์อื่นได้

ฐานข้อมูลที่สร้างขึ้นก่อนมีการกำหนดความเป็นเจ้าของต่อเอเจนต์ไม่มีแหล่งที่มาของแถวที่เชื่อถือได้
เมื่ออัปเกรด `openclaw doctor --fix` จะกำหนดแถวแบบเดิมเหล่านั้นเพียงครั้งเดียวให้แก่
เอเจนต์เริ่มต้นที่กำหนดค่าไว้ การเข้าถึงระหว่างรันไทม์จะปฏิเสธโดยค่าเริ่มต้นจนกว่าการย้ายข้อมูลดังกล่าว
จะเสร็จสมบูรณ์ เอเจนต์อื่นจะไม่ได้รับช่วงแถวที่เคยใช้ร่วมกันเหล่านั้นเด็ดขาด

`storageOptions` ยอมรับคู่คีย์/ค่าแบบสตริงสำหรับแบ็กเอนด์พื้นที่จัดเก็บของ LanceDB
(เช่น พื้นที่จัดเก็บอ็อบเจ็กต์ที่เข้ากันได้กับ S3) และรองรับการขยาย `${ENV_VAR}`:

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

`@lancedb/lancedb` ไม่เผยแพร่บิลด์เนทีฟสำหรับ `darwin-x64` (Mac ที่ใช้ Intel)
บนแพลตฟอร์มนั้น Plugin จะบันทึกในล็อกว่า LanceDB ไม่พร้อมใช้งานขณะโหลด
ให้ใช้แบ็กเอนด์หน่วยความจำเริ่มต้น เรียกใช้ Gateway บนแพลตฟอร์ม/สถาปัตยกรรม
ที่รองรับ หรือปิดใช้งาน `memory-lancedb`

## การแก้ไขปัญหา

### ความยาวอินพุตเกินความยาวบริบท

โมเดล embedding ปฏิเสธคำขอเรียกคืน:

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

สำหรับ Ollama ให้ตรวจสอบด้วยว่าสามารถเข้าถึงเซิร์ฟเวอร์ embedding จากโฮสต์ Gateway
โดยใช้เอนด์พอยต์ embed แบบเนทีฟของเซิร์ฟเวอร์:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### โมเดล embedding ที่ไม่รองรับ

หากไม่มี `embedding.dimensions` ระบบจะทราบเฉพาะมิติ embedding ของ OpenAI
ที่มีมาให้ในตัวเท่านั้น (`text-embedding-3-small`, `text-embedding-3-large`) สำหรับโมเดลอื่น
ให้ตั้งค่า `embedding.dimensions` เป็นขนาดเวกเตอร์ที่โมเดลนั้นรายงาน

### Plugin โหลดแล้วแต่ไม่มีหน่วยความจำปรากฏขึ้น

ยืนยันว่า `plugins.slots.memory` ชี้ไปที่ `memory-lancedb` แล้วเรียกใช้:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

หากปิดใช้งาน `autoCapture` Plugin จะยังเรียกคืนหน่วยความจำที่มีอยู่
แต่จะไม่จัดเก็บหน่วยความจำใหม่โดยอัตโนมัติ ให้ใช้เครื่องมือ `memory_store` หรือเปิดใช้งาน
`autoCapture`

## ที่เกี่ยวข้อง

- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [Active Memory](/th/concepts/active-memory)
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search)
- [วิกิหน่วยความจำ](/th/plugins/memory-wiki)
- [Ollama](/th/providers/ollama)
