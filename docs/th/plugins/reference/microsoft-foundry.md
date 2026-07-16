---
read_when:
    - คุณกำลังติดตั้ง กำหนดค่า หรือตรวจสอบ Plugin microsoft-foundry
summary: เพิ่มการรองรับผู้ให้บริการโมเดล Microsoft Foundry ให้กับ OpenClaw
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-07-16T19:34:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2ea554ce16cffeb4cc315e53d986d6f07b5e113fbb844c61c6575f19f8ad291
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin Microsoft Foundry

เพิ่มการรองรับผู้ให้บริการโมเดล Microsoft Foundry ให้กับ OpenClaw

## การเผยแพร่

- แพ็กเกจ: `@openclaw/microsoft-foundry`
- ช่องทางการติดตั้ง: รวมอยู่ใน OpenClaw

## พื้นผิว

ผู้ให้บริการ: `microsoft-foundry`; สัญญา: `imageGenerationProviders`

<!-- openclaw-plugin-reference:manual-start -->

- ผู้ให้บริการสร้างรูปภาพ: `microsoft-foundry`

## ข้อกำหนด

- ทรัพยากร Microsoft Foundry หรือ Azure AI Foundry ที่มีการปรับใช้
- การยืนยันตัวตนด้วยคีย์ API ผ่าน `AZURE_OPENAI_API_KEY` หรือคีย์ API ของผู้ให้บริการที่กำหนดค่าไว้
- สำหรับการยืนยันตัวตนด้วย Entra ID ให้ติดตั้ง Azure CLI และเรียกใช้ `az login` ก่อน
  เริ่มต้นใช้งาน OpenClaw จะรีเฟรชโทเค็นรันไทม์ของ Microsoft Foundry ผ่าน
  `az account get-access-token`

## โมเดลแชต

การปรับใช้แชตของ Microsoft Foundry ใช้การอ้างอิงโมเดลของผู้ให้บริการ
`microsoft-foundry/<deployment-name>` ขั้นตอนเริ่มต้นใช้งานจะค้นหาทรัพยากร
และการปรับใช้ Foundry ด้วย Azure CLI จากนั้นเขียนชื่อการปรับใช้ที่เลือกลงในการกำหนดค่า
โมเดล

OpenClaw ใช้ปลายทาง Foundry `/openai/v1` สำหรับ API แชต
ที่เข้ากันได้กับ OpenAI ซึ่งรองรับ:

- ตระกูลโมเดล GPT, `o*`, `computer-use-preview` และ DeepSeek-V4 ใช้
  `openai-responses` เป็นค่าเริ่มต้น
- MAI-DS-R1 และการปรับใช้การเติมข้อความแชตอื่นๆ ใช้ `openai-completions`
  เว้นแต่จะกำหนดค่า API ที่รองรับไว้อย่างชัดเจน
- MAI-DS-R1 ถูกบันทึกว่ารองรับการให้เหตุผลผ่านเนื้อหาการให้เหตุผล ไม่ใช่
  ผ่าน `reasoning_effort` เมทาดาทาของบริบทและโทเค็นเอาต์พุตมีขนาด
  163,840 โทเค็น

การปรับใช้ Anthropic Claude ใน Microsoft Foundry ใช้รูปแบบ Anthropic Messages
API ไม่ใช่รูปแบบ `/openai/v1` ที่เข้ากันได้กับ OpenAI ให้กำหนดค่าเป็น
ผู้ให้บริการ `anthropic-messages` แบบกำหนดเองจนกว่า Plugin Microsoft Foundry จะมี
รันไทม์ Anthropic แบบเนทีฟ เมื่อชื่อการปรับใช้ Foundry แตกต่างจาก ID โมเดล
Claude ให้ตั้งค่า `params.canonicalModelId` ในรายการโมเดล เพื่อให้ OpenClaw
สามารถใช้สัญญาการรับส่งข้อมูลเฉพาะโมเดล แมป `/think off` ได้อย่างถูกต้อง และ
เก็บรักษาการคิดที่ลงนามไว้อย่างปลอดภัย

## การสร้างรูปภาพด้วย MAI

Plugin ลงทะเบียน `microsoft-foundry` สำหรับ `image_generate` ด้วยโมเดล
รูปภาพ Microsoft AI ปัจจุบัน:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

ใช้ชื่อการปรับใช้รูปภาพ MAI ที่ปรับใช้แล้วเป็นการอ้างอิงโมเดล ผู้ให้บริการ
ไม่ประกาศโมเดลรูปภาพเริ่มต้น เนื่องจาก API ของ MAI ต้องการชื่อการปรับใช้ของคุณ
ในฟิลด์ `model` ของคำขอ:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

การสร้างจากพรอมต์เพียงอย่างเดียวจะเรียกปลายทางการสร้าง MAI ของ Microsoft Foundry:
`/mai/v1/images/generations` การแก้ไขด้วยรูปภาพอ้างอิงจะเรียก
`/mai/v1/images/edits` และจำกัดเฉพาะการปรับใช้ `MAI-Image-2.5-Flash` และ
`MAI-Image-2.5`

การสร้างจากพรอมต์เพียงอย่างเดียวสามารถใช้ชื่อการปรับใช้แบบกำหนดเองโดยกำหนดค่าเพียง
ปลายทาง Foundry สำหรับการแก้ไขรูปภาพด้วยชื่อการปรับใช้แบบกำหนดเอง ให้เลือก
การปรับใช้ผ่านขั้นตอนเริ่มต้นใช้งานหรือใส่เมทาดาทาของโมเดล เพื่อให้ OpenClaw ตรวจสอบได้
ว่าการปรับใช้นั้นรองรับโดย `MAI-Image-2.5-Flash` หรือ `MAI-Image-2.5`

ข้อจำกัดของรูปภาพ MAI:

- เอาต์พุต: รูปภาพ PNG หนึ่งรูปต่อคำขอ
- ขนาด: ค่าเริ่มต้น `1024x1024`; ทั้งความกว้างและความสูงต้องมีอย่างน้อย 768 px
- จำนวนพิกเซลทั้งหมด: ความกว้าง × ความสูงต้องไม่เกิน 1,048,576
- การแก้ไข: รูปภาพอินพุต PNG หรือ JPEG หนึ่งรูป
- คำใบ้ร่วมที่ไม่รองรับ เช่น `aspectRatio`, `resolution`, `quality`,
  `background` และ `outputFormat` ที่ไม่ใช่ PNG จะไม่ถูกส่งไปยัง Microsoft Foundry

## การแก้ไขปัญหา

- `az: command not found`: ติดตั้ง Azure CLI หรือใช้การยืนยันตัวตนด้วยคีย์ API
- `Microsoft Foundry endpoint missing for MAI image generation`: เลือก
  การปรับใช้ Foundry ผ่านขั้นตอนเริ่มต้นใช้งาน หรือเพิ่ม `models.providers.microsoft-foundry.baseUrl`
- `supports MAI image deployments only`: โมเดลรูปภาพที่เลือกชี้ไปยัง
  การปรับใช้ที่ไม่ใช่ MAI ให้ใช้โมเดลรูปภาพ MAI ที่ปรับใช้แล้วสำหรับ `image_generate`

<!-- openclaw-plugin-reference:manual-end -->
