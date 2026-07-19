---
read_when:
    - คุณกำลังติดตั้ง กำหนดค่า หรือตรวจสอบ Plugin llama-cpp
summary: การอนุมานข้อความและการฝังเวกเตอร์จาก GGUF ภายในเครื่องผ่าน node-llama-cpp.
title: Plugin Llama Cpp
x-i18n:
    generated_at: "2026-07-19T07:26:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2756d4b3e00bbe37b4dedec1d54d28bfe6662e8105504317a402293254ce0240
    source_path: plugins/reference/llama-cpp.md
    workflow: 16
---

# Plugin Llama Cpp

การอนุมานข้อความและการฝังเวกเตอร์จาก GGUF ภายในเครื่องผ่าน node-llama-cpp

## การเผยแพร่

- แพ็กเกจ: `@openclaw/llama-cpp-provider`
- ช่องทางการติดตั้ง: npm; ClawHub

## พื้นผิว

ผู้ให้บริการ: `llama-cpp`; สัญญา: `embeddingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## โมเดลข้อความเริ่มต้น

ระหว่างการตั้งค่าแบบโต้ตอบ OpenClaw จะเสนอ Gemma 4 E4B IT Q4_K_M เป็นไฟล์ดาวน์โหลดที่รวมมาให้ขนาดประมาณ 5.0 GB ข้อเสนอนี้กำหนดให้มี RAM รวมอย่างน้อย 16 GiB ระบบจะยังคงตรวจพบโมเดลที่แคชไว้แล้วบนเครื่องที่มีทรัพยากรน้อยกว่า

หากต้องการใช้โมเดลอื่น ให้ตั้งค่า `params.modelPath` เป็น GGUF แบบกำหนดเองใดก็ได้ โมเดลแบบกำหนดเองไม่อยู่ภายใต้ข้อกำหนดด้าน RAM สำหรับไฟล์ดาวน์โหลดที่รวมมาให้ บนเครื่องที่มีทรัพยากรต่ำกว่าข้อกำหนด ยังสามารถเรียกใช้โมเดลขนาดเล็กกว่าผ่าน Ollama หรือ LM Studio หรือเลือกผู้ให้บริการคลาวด์ได้

<!-- openclaw-plugin-reference:manual-end -->

## เอกสารที่เกี่ยวข้อง

- [llama-cpp](/th/plugins/llama-cpp)
