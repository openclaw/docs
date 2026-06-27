---
read_when:
    - คุณต้องการ embeddings สำหรับการค้นหาหน่วยความจำจากโมเดล GGUF ภายในเครื่อง
    - คุณกำลังกำหนดค่า memorySearch.provider = "local"
    - คุณต้องใช้ OpenClaw Plugin ที่เป็นเจ้าของรันไทม์ node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: ติดตั้งผู้ให้บริการ llama.cpp อย่างเป็นทางการสำหรับเอ็มเบดดิงหน่วยความจำ GGUF ในเครื่อง
title: ผู้ให้บริการ llama.cpp
x-i18n:
    generated_at: "2026-06-27T17:56:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` คือ Plugin ผู้ให้บริการภายนอกอย่างเป็นทางการสำหรับ embeddings แบบ GGUF ภายในเครื่อง.
Plugin นี้เป็นเจ้าของ dependency รันไทม์ `node-llama-cpp` ที่ใช้โดย
`memorySearch.provider: "local"`.

ติดตั้งก่อนใช้ embeddings หน่วยความจำภายในเครื่อง:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

แพ็กเกจ npm หลัก `openclaw` ไม่มี `node-llama-cpp` รวมอยู่ด้วย การเก็บ
dependency เนทีฟไว้ใน Plugin นี้ช่วยป้องกันไม่ให้การอัปเดต npm ของ OpenClaw ตามปกติ
ลบรันไทม์ที่ติดตั้งด้วยตนเองภายในไดเรกทอรีแพ็กเกจ OpenClaw.

## การกำหนดค่า

ตั้งค่าผู้ให้บริการค้นหาหน่วยความจำเป็น `local`:

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

โมเดลเริ่มต้นคือ `embeddinggemma-300m-qat-Q8_0.gguf` คุณยังสามารถชี้
`local.modelPath` ไปยังไฟล์ `.gguf` ภายในเครื่องได้เช่นกัน.

## รันไทม์เนทีฟ

ใช้ Node 24 เพื่อให้เส้นทางการติดตั้งเนทีฟราบรื่นที่สุด เช็กเอาต์ซอร์สที่ใช้ pnpm
อาจต้องอนุมัติและ rebuild dependency เนทีฟ:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

สำหรับ embeddings ภายในเครื่องที่มีขั้นตอนน้อยกว่า ให้ใช้ผู้ให้บริการบริการภายในเครื่อง เช่น
Ollama หรือ LM Studio แทน.
