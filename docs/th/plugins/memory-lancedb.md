---
read_when:
    - คุณกำลังกำหนดค่า Plugin memory-lancedb
    - คุณต้องการหน่วยความจำระยะยาวที่รองรับด้วย LanceDB พร้อมการเรียกคืนอัตโนมัติหรือการบันทึกอัตโนมัติ
    - คุณกำลังใช้การฝังที่เข้ากันได้กับ OpenAI ภายในเครื่อง เช่น Ollama
sidebarTitle: Memory LanceDB
summary: กำหนดค่า Plugin หน่วยความจำ LanceDB ภายนอกอย่างเป็นทางการ รวมถึงการฝังเวกเตอร์ภายในเครื่องที่เข้ากันได้กับ Ollama
title: หน่วยความจำ LanceDB
x-i18n:
    generated_at: "2026-06-27T17:57:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4142a755e788418a8b9c64a6ff3a8ce3c520bd6be09b685929478ae0754f7d39
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` เป็น Plugin หน่วยความจำภายนอกอย่างเป็นทางการที่จัดเก็บหน่วยความจำระยะยาวใน
LanceDB และใช้ embedding เพื่อเรียกคืนข้อมูล สามารถเรียกคืนหน่วยความจำที่เกี่ยวข้อง
ก่อนรอบการทำงานของโมเดล และบันทึกข้อเท็จจริงสำคัญหลังการตอบกลับได้โดยอัตโนมัติ

ใช้เมื่อคุณต้องการฐานข้อมูลเวกเตอร์ภายในเครื่องสำหรับหน่วยความจำ ต้องการ endpoint embedding
ที่เข้ากันได้กับ OpenAI หรือต้องการเก็บฐานข้อมูลหน่วยความจำไว้นอก
พื้นที่จัดเก็บหน่วยความจำในตัวที่เป็นค่าเริ่มต้น

## การติดตั้ง

ติดตั้ง `memory-lancedb` ก่อนตั้งค่า `plugins.slots.memory = "memory-lancedb"`:

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Plugin นี้เผยแพร่บน npm และไม่ได้ถูกรวมไว้ในอิมเมจ runtime ของ OpenClaw
ตัวติดตั้งจะเขียนรายการ Plugin และสลับสล็อตหน่วยความจำเมื่อยังไม่มี
Plugin อื่นเป็นเจ้าของสล็อตนั้น

<Note>
`memory-lancedb` เป็น Plugin Active Memory เปิดใช้งานโดยเลือกสล็อตหน่วยความจำ
ด้วย `plugins.slots.memory = "memory-lancedb"` Plugin คู่ข้าง เช่น
`memory-wiki` สามารถทำงานเคียงข้างกันได้ แต่มีเพียง Plugin เดียวเท่านั้นที่เป็นเจ้าของสล็อต Active Memory
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

รีสตาร์ท Gateway หลังจากเปลี่ยนการกำหนดค่า Plugin:

```bash
openclaw gateway restart
```

จากนั้นตรวจสอบว่าโหลด Plugin แล้ว:

```bash
openclaw plugins list
```

## embedding ที่มีผู้ให้บริการรองรับ

`memory-lancedb` สามารถใช้อะแดปเตอร์ผู้ให้บริการ embedding ของหน่วยความจำเดียวกับ
`memory-core` ได้ ตั้งค่า `embedding.provider` และละ `embedding.apiKey` เพื่อใช้
โปรไฟล์การยืนยันตัวตนที่กำหนดค่าไว้ของผู้ให้บริการ ตัวแปรสภาพแวดล้อม หรือ
`models.providers.<provider>.apiKey`

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
        },
      },
    },
  },
}
```

เส้นทางนี้ใช้งานได้กับโปรไฟล์การยืนยันตัวตนของผู้ให้บริการที่เปิดเผยข้อมูลประจำตัวสำหรับ embedding
ตัวอย่างเช่น สามารถใช้ GitHub Copilot ได้เมื่อโปรไฟล์/แพ็กเกจของ Copilot รองรับ
embedding:

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
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth ไม่ใช่ข้อมูลประจำตัว embedding ของ OpenAI Platform
สำหรับ OpenAI embedding ให้ใช้โปรไฟล์การยืนยันตัวตนด้วยคีย์ OpenAI API,
`OPENAI_API_KEY` หรือ `models.providers.openai.apiKey` ผู้ใช้ที่มีเฉพาะ OAuth สามารถใช้
ผู้ให้บริการรายอื่นที่รองรับ embedding เช่น GitHub Copilot หรือ Ollama

## Ollama embedding

สำหรับ Ollama embedding แนะนำให้ใช้ผู้ให้บริการ embedding ของ Ollama ที่ถูกรวมมาให้ ใช้
endpoint Ollama แบบเนทีฟ `/api/embed` และปฏิบัติตามกฎการยืนยันตัวตน/base URL เดียวกับ
ผู้ให้บริการ Ollama ที่บันทึกไว้ใน [Ollama](/th/providers/ollama)

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

ตั้งค่า `dimensions` สำหรับโมเดล embedding ที่ไม่ใช่มาตรฐาน OpenClaw รู้ค่า
dimensions สำหรับ `text-embedding-3-small` และ `text-embedding-3-large`; โมเดลแบบกำหนดเอง
ต้องมีค่านี้ในการกำหนดค่าเพื่อให้ LanceDB สร้างคอลัมน์เวกเตอร์ได้

สำหรับโมเดล embedding ภายในเครื่องขนาดเล็ก ให้ลด `recallMaxChars` หากคุณเห็นข้อผิดพลาด
ความยาวบริบทจากเซิร์ฟเวอร์ภายในเครื่อง

## ผู้ให้บริการที่เข้ากันได้กับ OpenAI

ผู้ให้บริการ embedding ที่เข้ากันได้กับ OpenAI บางรายปฏิเสธพารามิเตอร์ `encoding_format`
ขณะที่บางรายละเลยพารามิเตอร์นี้และส่งคืนเวกเตอร์ `number[]` เสมอ
ดังนั้น `memory-lancedb` จึงละ `encoding_format` ในคำขอ embedding และ
ยอมรับได้ทั้งคำตอบแบบอาร์เรย์ float หรือคำตอบ float32 ที่เข้ารหัส base64

หากคุณมี endpoint embedding แบบดิบที่เข้ากันได้กับ OpenAI ซึ่งไม่มี
อะแดปเตอร์ผู้ให้บริการที่ถูกรวมมา ให้ละ `embedding.provider` (หรือปล่อยไว้เป็น `openai`) และ
ตั้งค่า `embedding.apiKey` พร้อมกับ `embedding.baseUrl` วิธีนี้จะรักษาเส้นทางไคลเอนต์
ที่เข้ากันได้กับ OpenAI โดยตรงไว้

ตั้งค่า `embedding.dimensions` สำหรับผู้ให้บริการที่ค่า dimensions ของโมเดลไม่ได้ถูกรวมไว้
ตัวอย่างเช่น ZhiPu `embedding-3` ใช้ dimensions `2048`:

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

## ขีดจำกัดการเรียกคืนและการบันทึก

`memory-lancedb` มีขีดจำกัดข้อความแยกกันสองรายการ:

| การตั้งค่า           | ค่าเริ่มต้น | ช่วง     | ใช้กับ                                                |
| ----------------- | ------- | --------- | --------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | ข้อความที่ส่งไปยัง embedding API เพื่อการเรียกคืน                 |
| `captureMaxChars` | `500`   | 100-10000 | ความยาวข้อความที่มีสิทธิ์ถูกบันทึกอัตโนมัติ                  |
| `customTriggers`  | `[]`    | 0-50      | วลีตามตัวอักษรที่ทำให้การบันทึกอัตโนมัติพิจารณาข้อความ |

`recallMaxChars` ควบคุมการเรียกคืนอัตโนมัติ เครื่องมือ `memory_recall`
เส้นทางคิวรี `memory_forget` และ `openclaw ltm search` การเรียกคืนอัตโนมัติจะเลือก
ข้อความผู้ใช้ล่าสุดจากรอบการทำงานก่อน และจะย้อนกลับไปใช้พรอมป์ทั้งหมดเฉพาะเมื่อไม่มี
ข้อความผู้ใช้ให้ใช้ วิธีนี้ช่วยกันข้อมูลเมตาของช่องทางและบล็อกพรอมป์ขนาดใหญ่
ออกจากคำขอ embedding

`captureMaxChars` ควบคุมว่าคำตอบสั้นพอที่จะถูกพิจารณา
สำหรับการบันทึกอัตโนมัติหรือไม่ ไม่ได้จำกัด embedding ของคิวรีเรียกคืน

`customTriggers` ช่วยให้คุณเพิ่มวลีการบันทึกอัตโนมัติแบบตรงตัวโดยไม่ต้องเขียน
regular expression ทริกเกอร์ในตัวประกอบด้วยวลีเกี่ยวกับหน่วยความจำที่พบบ่อยในภาษาอังกฤษ เช็ก
จีน ญี่ปุ่น และเกาหลี

## คำสั่ง

เมื่อ `memory-lancedb` เป็น Plugin หน่วยความจำที่ใช้งานอยู่ จะลงทะเบียน namespace `ltm` ของ CLI:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

คำสั่งย่อย `query` จะรันคิวรีแบบไม่ใช้เวกเตอร์กับตาราง LanceDB
โดยตรง:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: รายการคอลัมน์ที่อนุญาตแบบคั่นด้วยจุลภาค (ค่าเริ่มต้นคือ `id`, `text`, `importance`, `category`, `createdAt`)
- `--filter <condition>`: ส่วนคำสั่ง WHERE แบบ SQL; จำกัดที่ 200 อักขระ และจำกัดเฉพาะตัวอักษรและตัวเลข ตัวดำเนินการเปรียบเทียบ เครื่องหมายคำพูด วงเล็บ และเครื่องหมายวรรคตอนที่ปลอดภัยชุดเล็ก
- `--limit <n>`: จำนวนเต็มบวก; ค่าเริ่มต้น `10`
- `--order-by <column>:<asc|desc>`: การเรียงลำดับในหน่วยความจำที่ใช้หลังตัวกรอง; คอลัมน์ที่ใช้เรียงลำดับจะถูกรวมในการ projection โดยอัตโนมัติ

Agent ยังได้รับเครื่องมือหน่วยความจำ LanceDB จาก Plugin หน่วยความจำที่ใช้งานอยู่ด้วย:

- `memory_recall` สำหรับการเรียกคืนที่มี LanceDB รองรับ
- `memory_store` สำหรับบันทึกข้อเท็จจริงสำคัญ ค่ากำหนด การตัดสินใจ และเอนทิตี
- `memory_forget` สำหรับลบหน่วยความจำที่ตรงกัน

## พื้นที่จัดเก็บ

โดยค่าเริ่มต้น ข้อมูล LanceDB จะอยู่ใต้ `~/.openclaw/memory/lancedb` แทนที่
พาธด้วย `dbPath`:

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

`storageOptions` รับคู่คีย์/ค่าสตริงสำหรับ backend พื้นที่จัดเก็บของ LanceDB และ
รองรับการขยาย `${ENV_VAR}`:

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

## การขึ้นต่อกันของ runtime

`memory-lancedb` ขึ้นต่อแพ็กเกจเนทีฟ `@lancedb/lancedb` OpenClaw แบบแพ็กเกจ
ถือว่าแพ็กเกจนั้นเป็นส่วนหนึ่งของแพ็กเกจ Plugin การเริ่มต้น Gateway
จะไม่ซ่อมแซม dependency ของ Plugin; หาก dependency หายไป ให้ติดตั้งใหม่หรือ
อัปเดตแพ็กเกจ Plugin แล้วรีสตาร์ท Gateway

หากการติดตั้งเก่าบันทึกข้อผิดพลาดว่าไม่มี `dist/package.json` หรือไม่มี
`@lancedb/lancedb` ระหว่างโหลด Plugin ให้อัปเกรด OpenClaw และรีสตาร์ท
Gateway

หาก Plugin บันทึกว่า LanceDB ไม่พร้อมใช้งานบน `darwin-x64` ให้ใช้ backend
หน่วยความจำเริ่มต้นบนเครื่องนั้น ย้าย Gateway ไปยังแพลตฟอร์มที่รองรับ หรือ
ปิดใช้งาน `memory-lancedb`

## การแก้ไขปัญหา

### ความยาวอินพุตเกินความยาวบริบท

โดยปกติหมายความว่าโมเดล embedding ปฏิเสธคิวรีเรียกคืน:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

ตั้งค่า `recallMaxChars` ให้ต่ำลง แล้วรีสตาร์ท Gateway:

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

สำหรับ Ollama ให้ตรวจสอบด้วยว่าเซิร์ฟเวอร์ embedding เข้าถึงได้จากโฮสต์ Gateway:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### โมเดล embedding ไม่รองรับ

หากไม่มี `dimensions` จะรู้เฉพาะค่า dimensions ของ OpenAI embedding ในตัวเท่านั้น
สำหรับโมเดล embedding ภายในเครื่องหรือแบบกำหนดเอง ให้ตั้งค่า `embedding.dimensions` เป็นขนาดเวกเตอร์
ที่โมเดลนั้นรายงาน

### โหลด Plugin แล้วแต่ไม่มีหน่วยความจำปรากฏ

ตรวจสอบว่า `plugins.slots.memory` ชี้ไปที่ `memory-lancedb` แล้วรัน:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

หากปิดใช้งาน `autoCapture` Plugin จะเรียกคืนหน่วยความจำที่มีอยู่ แต่จะ
ไม่จัดเก็บหน่วยความจำใหม่โดยอัตโนมัติ ใช้เครื่องมือ `memory_store` หรือเปิดใช้งาน
`autoCapture` หากคุณต้องการการบันทึกอัตโนมัติ

## ที่เกี่ยวข้อง

- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [Active Memory](/th/concepts/active-memory)
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search)
- [Memory Wiki](/th/plugins/memory-wiki)
- [Ollama](/th/providers/ollama)
