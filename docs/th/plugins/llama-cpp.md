---
read_when:
    - คุณต้องการเวกเตอร์ฝังสำหรับการค้นหาหน่วยความจำจากโมเดล GGUF ภายในเครื่อง
    - คุณกำลังกำหนดค่า memorySearch.provider = "local"
    - คุณต้องใช้ Plugin ของ OpenClaw ที่ดูแลรันไทม์ node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: ติดตั้งผู้ให้บริการ llama.cpp อย่างเป็นทางการสำหรับการฝังเวกเตอร์หน่วยความจำ GGUF ภายในเครื่อง
title: ผู้ให้บริการ llama.cpp
x-i18n:
    generated_at: "2026-07-12T16:29:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` คือ Plugin ผู้ให้บริการภายนอกอย่างเป็นทางการสำหรับการฝังเวกเตอร์ GGUF
ภายในเครื่อง โดยลงทะเบียนรหัสผู้ให้บริการการฝังเวกเตอร์ `local` และเป็นเจ้าของ
การขึ้นต่อกันของรันไทม์ `node-llama-cpp` ที่ `memorySearch.provider: "local"` ใช้งาน

ติดตั้ง Plugin นี้ก่อนใช้การฝังเวกเตอร์หน่วยความจำภายในเครื่อง:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

แพ็กเกจ npm หลัก `openclaw` ไม่มี `node-llama-cpp` รวมอยู่ด้วย การเก็บ
การขึ้นต่อกันแบบเนทีฟไว้ใน Plugin นี้ช่วยป้องกันไม่ให้การอัปเดต OpenClaw ผ่าน npm ตามปกติ
ลบรันไทม์ที่ติดตั้งด้วยตนเองภายในไดเรกทอรีแพ็กเกจ OpenClaw

## การกำหนดค่า

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

ค่าเริ่มต้นของ `local.modelPath` คือ URI `hf:` ที่แสดงข้างต้น (`embeddinggemma-300m-qat-Q8_0.gguf`)
หากต้องการใช้โมเดลอื่น ให้ระบุ URI `hf:` อื่นหรือไฟล์ `.gguf` ภายในเครื่อง
`local.modelCacheDir` ใช้กำหนดตำแหน่งแคชของโมเดลที่ดาวน์โหลดแทนค่าเริ่มต้น
(ค่าเริ่มต้น: `~/.node-llama-cpp/models`) และ `local.contextSize` รับค่าเป็น
จำนวนเต็มหรือ `"auto"`

เมื่อ `local.contextSize` เป็นตัวเลข ผู้ให้บริการจะส่งข้อกำหนดดังกล่าว
ให้ระบบจัดวางเลเยอร์บน GPU อัตโนมัติของ node-llama-cpp ด้วย ซึ่งช่วยให้ node-llama-cpp จัดวาง
โมเดลและบริบทการฝังเวกเตอร์ร่วมกันได้ โดยยังคงการตรวจสอบความปลอดภัยของหน่วยความจำ
เมื่อใช้ `"auto"` node-llama-cpp จะคงการจัดวางอัตโนมัติตามปกติ

## รันไทม์แบบเนทีฟ

ใช้ Node 24 เพื่อให้กระบวนการติดตั้งแบบเนทีฟราบรื่นที่สุด การเช็กเอาต์ซอร์สที่ใช้
pnpm อาจต้องอนุมัติและสร้างการขึ้นต่อกันแบบเนทีฟใหม่:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## การวินิจฉัยรันไทม์

เรียกใช้ `openclaw memory status --deep` หลังจากโหลดผู้ให้บริการแล้ว เพื่อตรวจสอบ
แบ็กเอนด์และบิลด์ที่เลือก ชื่ออุปกรณ์ จำนวนเลเยอร์ที่ถ่ายโอนไปยัง GPU
ขนาดบริบทที่ร้องขอ และสแนปช็อต VRAM หรือหน่วยความจำรวมที่สังเกตพบล่าสุด ค่า VRAM
มีเวลาประทับของการสังเกต เนื่องจากการอ่านสถานะแบบพาสซีฟจะไม่
โหลดโมเดลใหม่หรือสำรวจอุปกรณ์

ข้อเท็จจริงล่าสุดที่ทราบชุดเดียวกันอาจปรากฏใน `openclaw doctor` เมื่อ Gateway ที่กำลังทำงาน
เคยใช้ผู้ให้บริการภายในเครื่องแล้ว คำสั่งสถานะหรือคำสั่ง doctor ตามปกติ
จะไม่โหลดโมเดลเพียงเพื่อรวบรวมข้อมูลวินิจฉัย

## การแก้ไขปัญหา

หากไม่มี `node-llama-cpp` หรือโหลดไม่สำเร็จ OpenClaw จะรายงานข้อผิดพลาด
พร้อมแนวทางดังนี้:

1. ติดตั้ง Plugin: `openclaw plugins install @openclaw/llama-cpp-provider`
2. ใช้ Node 24 สำหรับการติดตั้ง/อัปเดตแบบเนทีฟ
3. จากการเช็กเอาต์ซอร์สด้วย pnpm: เรียกใช้ `pnpm approve-builds` แล้วตามด้วย `pnpm rebuild node-llama-cpp`

หากต้องการใช้การฝังเวกเตอร์ภายในเครื่องได้สะดวกขึ้นโดยไม่ต้องผ่านขั้นตอนการสร้างแบบเนทีฟ ให้ตั้งค่า
`memorySearch.provider` เป็นผู้ให้บริการการฝังเวกเตอร์ระยะไกลแทน เช่น `lmstudio`,
`ollama`, `openai` หรือ `voyage`
