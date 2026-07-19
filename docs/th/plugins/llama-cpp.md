---
read_when:
    - คุณต้องการใช้การอนุมานข้อความภายในเครื่องโดยไม่ต้องใช้คีย์ API หรือเซิร์ฟเวอร์โมเดล
    - คุณต้องการ embedding สำหรับการค้นหาหน่วยความจำจากโมเดล GGUF ที่ทำงานในเครื่อง
    - คุณกำลังกำหนดค่า memorySearch.provider = "local"
    - คุณต้องใช้ Plugin ของ OpenClaw ที่เป็นเจ้าของรันไทม์ node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: เรียกใช้การอนุมานข้อความ GGUF และการฝังเวกเตอร์หน่วยความจำแบบโลคัลใน OpenClaw ด้วย llama.cpp
title: ผู้ให้บริการ llama.cpp
x-i18n:
    generated_at: "2026-07-19T07:23:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8af1118ae65741519f81520e6c1c961e208e8dc2c9e1b250979c3758b8fe7c83
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` คือ Plugin ผู้ให้บริการภายนอกอย่างเป็นทางการสำหรับการอนุมานข้อความจาก GGUF ภายในโปรเซสบนเครื่องและการฝังเวกเตอร์ โดยลงทะเบียนผู้ให้บริการข้อความ `llama-cpp` ผู้ให้บริการการฝังเวกเตอร์ `local` และเป็นเจ้าของรันไทม์เนทีฟ `node-llama-cpp`

ติดตั้งก่อนใช้การอนุมานบนเครื่องหรือการฝังเวกเตอร์หน่วยความจำบนเครื่อง:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

แพ็กเกจ npm หลัก `openclaw` ไม่มี `node-llama-cpp` การเก็บ
การขึ้นต่อกันแบบเนทีฟไว้ใน Plugin นี้ช่วยป้องกันไม่ให้การอัปเดต npm ตามปกติของ OpenClaw
ลบรันไทม์ที่ติดตั้งด้วยตนเองภายในไดเรกทอรีแพ็กเกจ OpenClaw

## การอนุมานข้อความบนเครื่อง

เลือก **โมเดลบนเครื่อง (llama.cpp)** ระหว่างการเริ่มต้นใช้งานแบบโต้ตอบ OpenClaw จะถาม
ก่อนดาวน์โหลดโมเดลเริ่มต้น:

`hf:bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf`

ไฟล์ Qwen3 4B Instruct 2507 Q4_K_M มีขนาดประมาณ 2.5 GB ควรเผื่อ
RAM ราว 3 GB สำหรับน้ำหนักโมเดล รวมถึงบริบทและค่าใช้จ่ายส่วนเกินของรันไทม์ OpenClaw บริบท
เริ่มต้นจะได้รับการกำหนดขนาดโดยอัตโนมัติ โดยมีขีดจำกัด 8,192 โทเค็นเพื่อให้ยังใช้งานได้จริง
บนเครื่องที่มีหน่วยความจำ 8 GB กำหนดบริบทที่ใหญ่ขึ้นเฉพาะเมื่อเครื่องมี
หน่วยความจำเพียงพอ

การตรวจสอบเพื่อค้นหาระหว่างการเริ่มต้นใช้งานเป็นแบบอ่านอย่างเดียว ระบบจะเสนอ llama.cpp โดยอัตโนมัติ
เฉพาะเมื่อไฟล์ GGUF เริ่มต้นหรือไฟล์ที่กำหนดค่าไว้อยู่ในแคชโมเดลแล้ว และ
จะไม่ดาวน์โหลดระหว่างการค้นหา Ollama และ LM Studio ยังคงเป็นตัวเลือกบริการบนเครื่อง
ที่แยกจากกันและใช้ขั้นตอนการค้นหาของตนเอง การเลือก llama.cpp
ด้วยตนเองคือเส้นทางที่จะถามให้ดาวน์โหลดโมเดลเริ่มต้น

ผู้ให้บริการใช้เทมเพลตแชตที่ฝังอยู่ในโมเดล GGUF และการเรียกใช้ฟังก์ชัน
แบบเนทีฟของ node-llama-cpp ข้อความจะสตรีมทีละโทเค็น การเรียกใช้เครื่องมือจะส่งกลับ
ไปยัง OpenClaw เพื่อดำเนินการ แทนที่จะทำงานภายใน node-llama-cpp

### ใช้โมเดล GGUF อื่น

เพิ่มโมเดลลงใน `models.providers.llama-cpp` ใส่พาธบนเครื่องหรือ URI ไฟล์ `hf:` แบบเต็ม
ไว้ใน `params.modelPath`:

```json5
{
  models: {
    mode: "merge",
    providers: {
      "llama-cpp": {
        baseUrl: "local://llama-cpp",
        api: "openai-completions",
        params: {
          modelCacheDir: "~/.node-llama-cpp/models",
        },
        models: [
          {
            id: "my-local-model",
            name: "My local GGUF",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 2048,
            params: {
              modelPath: "~/Models/my-model.Q4_K_M.gguf",
              contextSize: 8192,
            },
            compat: { supportsTools: true },
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "llama-cpp/my-local-model" },
    },
  },
}
```

การอนุมานจะไม่ดาวน์โหลดโมเดลที่หายไปโดยปริยาย สำหรับ URI `hf:` แบบกำหนดเอง
ให้ดาวน์โหลด GGUF ลงใน `modelCacheDir` ก่อน การค้นหาใช้ตัวแก้ไขแคช
แบบอ่านอย่างเดียวของ node-llama-cpp เอง รวมถึงรูปแบบการตั้งชื่อที่เก็บ สาขา และไฟล์แบบแบ่งส่วน

## การกำหนดค่าการฝังเวกเตอร์หน่วยความจำ

ตั้งค่า `memorySearch.provider` เป็น `local`:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

`local.modelPath` มีค่าเริ่มต้นเป็น URI `hf:` ที่แสดงข้างต้น (`embeddinggemma-300m-qat-Q8_0.gguf`)
ชี้ไปยัง URI `hf:` อื่นหรือไฟล์ `.gguf` บนเครื่องเพื่อใช้โมเดลอื่น
`local.modelCacheDir` ใช้แทนที่ตำแหน่งแคชของโมเดลที่ดาวน์โหลด
(ค่าเริ่มต้น: `~/.node-llama-cpp/models`) และ `local.contextSize` รับค่าเป็น
จำนวนเต็มหรือ `"auto"`

เมื่อ `local.contextSize` เป็นตัวเลข ผู้ให้บริการจะส่งข้อกำหนดนั้น
ให้กับการจัดวางเลเยอร์ GPU อัตโนมัติของ node-llama-cpp ด้วย ซึ่งช่วยให้ node-llama-cpp จัดวาง
โมเดลและบริบทการฝังเวกเตอร์ร่วมกันได้โดยยังคงการตรวจสอบ
ความปลอดภัยของหน่วยความจำไว้ เมื่อใช้ `"auto"` node-llama-cpp จะคงการจัดวางอัตโนมัติตามปกติ

## รันไทม์เนทีฟ

ใช้ Node 24 เพื่อให้เส้นทางการติดตั้งแบบเนทีฟราบรื่นที่สุด การเช็กเอาต์ซอร์สที่ใช้
pnpm อาจต้องอนุมัติและสร้างการขึ้นต่อกันแบบเนทีฟใหม่:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## การวินิจฉัยรันไทม์หน่วยความจำ

เรียกใช้ `openclaw memory status --deep` หลังจากผู้ให้บริการโหลดแล้วเพื่อตรวจสอบ
แบ็กเอนด์และบิลด์ที่เลือก ชื่ออุปกรณ์ เลเยอร์ที่ถ่ายโอนไปยัง GPU ขนาดบริบท
ที่ร้องขอ และสแนปช็อต VRAM หรือหน่วยความจำรวมที่สังเกตพบล่าสุด ค่า VRAM
มีการประทับเวลาการสังเกต เนื่องจากการอ่านสถานะแบบพาสซีฟจะไม่
โหลดโมเดลใหม่หรือสำรวจอุปกรณ์

ข้อเท็จจริงที่ทราบล่าสุดเดียวกันอาจปรากฏใน `openclaw doctor` เมื่อ Gateway
ที่กำลังทำงานเคยใช้ผู้ให้บริการบนเครื่องแล้ว คำสั่งสถานะหรือ doctor ตามปกติ
จะไม่โหลดโมเดลเพียงเพื่อรวบรวมข้อมูลวินิจฉัย

## การแก้ไขปัญหา

หาก `node-llama-cpp` หายไปหรือโหลดไม่สำเร็จ OpenClaw จะรายงานความล้มเหลว
พร้อมข้อความต่อไปนี้:

1. ติดตั้ง Plugin: `openclaw plugins install @openclaw/llama-cpp-provider`
2. ใช้ Node 24 สำหรับการติดตั้ง/อัปเดตแบบเนทีฟ
3. จากการเช็กเอาต์ซอร์สด้วย pnpm: `pnpm approve-builds` แล้วตามด้วย `pnpm rebuild node-llama-cpp`

หากต้องการการอนุมานบนเครื่องโดยไม่ใช้การขึ้นต่อกันแบบเนทีฟภายในโปรเซส ให้ใช้ผู้ให้บริการ Ollama หรือ
LM Studio แทน หากต้องการการฝังเวกเตอร์บนเครื่องที่ตั้งค่าได้ง่ายกว่า ให้ตั้งค่า
`memorySearch.provider` เป็นผู้ให้บริการการฝังเวกเตอร์ระยะไกล เช่น `lmstudio`,
`ollama`, `openai` หรือ `voyage` แทน
