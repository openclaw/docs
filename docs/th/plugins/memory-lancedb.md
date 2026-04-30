---
read_when:
    - คุณกำลังกำหนดค่า Plugin memory-lancedb ที่มาพร้อมในตัว
    - คุณต้องการหน่วยความจำระยะยาวที่ใช้ LanceDB เป็นแบ็กเอนด์ พร้อมการเรียกคืนอัตโนมัติหรือการบันทึกอัตโนมัติ
    - คุณกำลังใช้เวกเตอร์ฝังตัวภายในเครื่องที่เข้ากันได้กับ OpenAI เช่น Ollama
sidebarTitle: Memory LanceDB
summary: กำหนดค่า Plugin หน่วยความจำ LanceDB ที่มาพร้อมชุด รวมถึงการฝังเวกเตอร์ในเครื่องที่เข้ากันได้กับ Ollama
title: หน่วยความจำ LanceDB
x-i18n:
    generated_at: "2026-04-30T10:06:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: bda53528857a492f1627f655e49be6775e0114115781371ff67debb155b7e731
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` เป็น Plugin หน่วยความจำที่มาพร้อม OpenClaw ซึ่งจัดเก็บหน่วยความจำระยะยาวใน
LanceDB และใช้ embeddings สำหรับการเรียกคืน สามารถเรียกคืนความทรงจำที่เกี่ยวข้องโดยอัตโนมัติ
ก่อนรอบของโมเดล และบันทึกข้อเท็จจริงสำคัญหลังจากการตอบกลับได้

ใช้เมื่อคุณต้องการฐานข้อมูลเวกเตอร์ภายในเครื่องสำหรับหน่วยความจำ ต้องมี
endpoint embedding ที่เข้ากันได้กับ OpenAI หรือต้องการเก็บฐานข้อมูลหน่วยความจำไว้นอก
ที่เก็บหน่วยความจำในตัวแบบค่าเริ่มต้น

<Note>
`memory-lancedb` เป็น Active Memory Plugin เปิดใช้งานโดยเลือกสล็อตหน่วยความจำ
ด้วย `plugins.slots.memory = "memory-lancedb"` Plugin เสริม เช่น
`memory-wiki` สามารถทำงานควบคู่กันได้ แต่มี Plugin เพียงตัวเดียวที่เป็นเจ้าของสล็อต Active Memory
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

## Embeddings ที่มี Provider รองรับ

`memory-lancedb` สามารถใช้อะแดปเตอร์ Provider สำหรับ embedding หน่วยความจำเดียวกับ
`memory-core` ได้ ตั้งค่า `embedding.provider` และละเว้น `embedding.apiKey` เพื่อใช้
โปรไฟล์ auth ที่กำหนดค่าไว้ของ Provider, ตัวแปรสภาพแวดล้อม หรือ
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

เส้นทางนี้ทำงานกับโปรไฟล์ auth ของ Provider ที่เปิดเผยข้อมูลรับรอง embedding
ตัวอย่างเช่น GitHub Copilot ใช้ได้เมื่อโปรไฟล์/แผนของ Copilot รองรับ
embeddings:

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

OpenAI Codex / ChatGPT OAuth (`openai-codex`) ไม่ใช่ข้อมูลรับรอง embeddings ของ OpenAI Platform
สำหรับ OpenAI embeddings ให้ใช้โปรไฟล์ auth ของ OpenAI API key,
`OPENAI_API_KEY` หรือ `models.providers.openai.apiKey` ผู้ใช้ที่มีเฉพาะ OAuth สามารถใช้
Provider อื่นที่รองรับ embedding เช่น GitHub Copilot หรือ Ollama

## Ollama embeddings

สำหรับ Ollama embeddings ให้ใช้ Ollama embedding Provider ที่มาพร้อม OpenClaw เป็นหลัก โดยใช้
endpoint Ollama `/api/embed` แบบเนทีฟ และปฏิบัติตามกฎ auth/base URL เดียวกับ
Ollama Provider ที่บันทึกไว้ใน [Ollama](/th/providers/ollama)

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

ตั้งค่า `dimensions` สำหรับโมเดล embedding ที่ไม่เป็นมาตรฐาน OpenClaw ทราบ
dimensions สำหรับ `text-embedding-3-small` และ `text-embedding-3-large`; โมเดลแบบกำหนดเอง
ต้องมีค่าใน config เพื่อให้ LanceDB สร้างคอลัมน์เวกเตอร์ได้

สำหรับโมเดล embedding ภายในเครื่องขนาดเล็ก ให้ลด `recallMaxChars` หากเห็นข้อผิดพลาด
ความยาวบริบทจากเซิร์ฟเวอร์ภายในเครื่อง

## Provider ที่เข้ากันได้กับ OpenAI

Provider embedding ที่เข้ากันได้กับ OpenAI บางรายปฏิเสธพารามิเตอร์ `encoding_format`
ขณะที่บางรายละเว้นและคืนเวกเตอร์ `number[]` เสมอ
ดังนั้น `memory-lancedb` จึงละเว้น `encoding_format` ในคำขอ embedding และ
ยอมรับได้ทั้งการตอบกลับแบบอาร์เรย์ float หรือการตอบกลับ float32 ที่เข้ารหัส base64

หากคุณมี endpoint embeddings แบบ raw ที่เข้ากันได้กับ OpenAI ซึ่งไม่มี
อะแดปเตอร์ Provider ที่มาพร้อม OpenClaw ให้ละเว้น `embedding.provider` (หรือปล่อยไว้เป็น `openai`) และ
ตั้งค่า `embedding.apiKey` พร้อม `embedding.baseUrl` วิธีนี้จะคงเส้นทางไคลเอนต์
ที่เข้ากันได้กับ OpenAI โดยตรงไว้

ตั้งค่า `embedding.dimensions` สำหรับ Provider ที่ dimensions ของโมเดลไม่ได้อยู่ในระบบ
ตัวอย่างเช่น ZhiPu `embedding-3` ใช้ `2048` dimensions:

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

`memory-lancedb` มีขีดจำกัดข้อความสองแบบแยกกัน:

| การตั้งค่า           | ค่าเริ่มต้น | ช่วง     | ใช้กับ                                    |
| ----------------- | ------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | ข้อความที่ส่งไปยัง embedding API สำหรับการเรียกคืน     |
| `captureMaxChars` | `500`   | 100-10000 | ความยาวข้อความของ assistant ที่มีสิทธิ์ถูกบันทึก |

`recallMaxChars` ควบคุม auto-recall, เครื่องมือ `memory_recall`,
เส้นทาง query ของ `memory_forget` และ `openclaw ltm search` Auto-recall จะเลือก
ข้อความผู้ใช้ล่าสุดจากรอบนั้นเป็นหลัก และจะ fallback ไปยัง prompt เต็มเฉพาะเมื่อไม่มี
ข้อความผู้ใช้เท่านั้น วิธีนี้ช่วยกัน metadata ของช่องทางและบล็อก prompt ขนาดใหญ่
ออกจากคำขอ embedding

`captureMaxChars` ควบคุมว่าการตอบกลับสั้นพอที่จะถูกพิจารณา
สำหรับการบันทึกอัตโนมัติหรือไม่ ไม่ได้จำกัด embeddings ของ query สำหรับการเรียกคืน

## คำสั่ง

เมื่อ `memory-lancedb` เป็น Active Memory Plugin จะลงทะเบียน namespace `ltm` ของ CLI:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Plugin ยังขยาย `openclaw memory` ด้วย subcommand `query` แบบไม่ใช้เวกเตอร์
ซึ่งรันกับตาราง LanceDB โดยตรง:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: allowlist ของคอลัมน์ที่คั่นด้วยจุลภาค (ค่าเริ่มต้นคือ `id`, `text`, `importance`, `category`, `createdAt`)
- `--filter <condition>`: เงื่อนไข WHERE แบบ SQL; จำกัดที่ 200 อักขระ และจำกัดให้ใช้ได้เฉพาะอักษรและตัวเลข, ตัวดำเนินการเปรียบเทียบ, เครื่องหมายคำพูด, วงเล็บ และเครื่องหมายวรรคตอนที่ปลอดภัยชุดเล็ก
- `--limit <n>`: จำนวนเต็มบวก; ค่าเริ่มต้น `10`
- `--order-by <column>:<asc|desc>`: การเรียงลำดับในหน่วยความจำที่ใช้หลัง filter; คอลัมน์ที่ใช้เรียงลำดับจะถูกรวมใน projection โดยอัตโนมัติ

Agents ยังได้รับเครื่องมือหน่วยความจำ LanceDB จาก Active Memory Plugin ด้วย:

- `memory_recall` สำหรับการเรียกคืนที่รองรับด้วย LanceDB
- `memory_store` สำหรับบันทึกข้อเท็จจริงสำคัญ, ค่ากำหนด, การตัดสินใจ และเอนทิตี
- `memory_forget` สำหรับลบความทรงจำที่ตรงกัน

## การจัดเก็บ

โดยค่าเริ่มต้น ข้อมูล LanceDB จะอยู่ภายใต้ `~/.openclaw/memory/lancedb` เปลี่ยน
พาธได้ด้วย `dbPath`:

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

`storageOptions` รับคู่คีย์/ค่าแบบสตริงสำหรับ backend การจัดเก็บของ LanceDB และ
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

## การพึ่งพาขณะรันไทม์

`memory-lancedb` พึ่งพาแพ็กเกจเนทีฟ `@lancedb/lancedb` การติดตั้ง OpenClaw แบบแพ็กเกจ
จะลองใช้การพึ่งพาขณะรันไทม์ที่มาพร้อมกันก่อน และสามารถซ่อมแซม
การพึ่งพาขณะรันไทม์ของ Plugin ภายใต้สถานะ OpenClaw เมื่อ import ที่มาพร้อมกัน
ไม่พร้อมใช้งาน

หากการติดตั้งรุ่นเก่าบันทึกข้อผิดพลาดว่าไม่มี `dist/package.json` หรือไม่มี
`@lancedb/lancedb` ระหว่างโหลด Plugin ให้อัปเกรด OpenClaw และรีสตาร์ท
Gateway

หาก Plugin บันทึกว่า LanceDB ไม่พร้อมใช้งานบน `darwin-x64` ให้ใช้ backend
หน่วยความจำค่าเริ่มต้นบนเครื่องนั้น ย้าย Gateway ไปยังแพลตฟอร์มที่รองรับ หรือ
ปิดใช้งาน `memory-lancedb`

## การแก้ไขปัญหา

### ความยาวอินพุตเกินความยาวบริบท

โดยปกติหมายความว่าโมเดล embedding ปฏิเสธ query สำหรับการเรียกคืน:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

ตั้งค่า `recallMaxChars` ให้ต่ำลง จากนั้นรีสตาร์ท Gateway:

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

หากไม่มี `dimensions` จะทราบเฉพาะ dimensions ของ OpenAI embedding ในตัวเท่านั้น
สำหรับโมเดล embedding ภายในเครื่องหรือแบบกำหนดเอง ให้ตั้งค่า `embedding.dimensions` เป็นขนาดเวกเตอร์
ที่โมเดลนั้นรายงาน

### Plugin โหลดแล้วแต่ไม่มีความทรงจำปรากฏ

ตรวจสอบว่า `plugins.slots.memory` ชี้ไปที่ `memory-lancedb` แล้วรัน:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

หากปิดใช้งาน `autoCapture` อยู่ Plugin จะเรียกคืนความทรงจำที่มีอยู่ แต่จะ
ไม่จัดเก็บรายการใหม่โดยอัตโนมัติ ใช้เครื่องมือ `memory_store` หรือเปิดใช้งาน
`autoCapture` หากคุณต้องการการบันทึกอัตโนมัติ

## ที่เกี่ยวข้อง

- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [Active Memory](/th/concepts/active-memory)
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search)
- [Memory Wiki](/th/plugins/memory-wiki)
- [Ollama](/th/providers/ollama)
