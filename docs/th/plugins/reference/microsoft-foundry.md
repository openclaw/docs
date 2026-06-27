---
read_when:
    - คุณกำลังติดตั้ง กำหนดค่า หรือตรวจสอบ Plugin microsoft-foundry
summary: เพิ่มการรองรับผู้ให้บริการโมเดล Microsoft Foundry ให้กับ OpenClaw.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-06-27T18:03:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin Microsoft Foundry

เพิ่มการรองรับผู้ให้บริการโมเดล Microsoft Foundry ให้กับ OpenClaw

## การเผยแพร่

- แพ็กเกจ: `@openclaw/microsoft-foundry`
- เส้นทางการติดตั้ง: รวมอยู่ใน OpenClaw

## พื้นผิว

providers: microsoft-foundry; contracts: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- ผู้ให้บริการสร้างภาพ: `microsoft-foundry`

## ข้อกำหนด

- ทรัพยากร Microsoft Foundry หรือ Azure AI Foundry ที่มี deployments
- การยืนยันตัวตนด้วย API key ผ่าน `AZURE_OPENAI_API_KEY` หรือ API key ของผู้ให้บริการที่กำหนดค่าไว้
- สำหรับการยืนยันตัวตนด้วย Entra ID ให้ติดตั้ง Azure CLI และรัน `az login` ก่อน
  onboarding OpenClaw จะรีเฟรชโทเค็นรันไทม์ของ Microsoft Foundry ผ่าน
  `az account get-access-token`

## โมเดลแชต

deployments แชตของ Microsoft Foundry ใช้ ref โมเดลของผู้ให้บริการ
`microsoft-foundry/<deployment-name>` onboarding จะค้นพบทรัพยากร Foundry
และ deployments ด้วย Azure CLI จากนั้นเขียนชื่อ deployment ที่เลือกไปยัง
การกำหนดค่าโมเดล

OpenClaw ใช้ endpoint `/openai/v1` ของ Foundry สำหรับ
API แชตที่รองรับและเข้ากันได้กับ OpenAI:

- ตระกูลโมเดล GPT, `o*`, `computer-use-preview` และ DeepSeek-V4 ใช้ค่าเริ่มต้นเป็น
  `openai-responses`
- MAI-DS-R1 และ deployments แบบ chat-completion อื่น ๆ ใช้ `openai-completions`
  เว้นแต่จะกำหนดค่า API ที่รองรับไว้อย่างชัดเจน
- MAI-DS-R1 ถูกบันทึกว่ารองรับ reasoning ผ่านเนื้อหา reasoning ไม่ใช่
  ผ่าน `reasoning_effort` metadata ของ context และ output token คือ
  163,840 tokens

deployments Anthropic Claude ใน Microsoft Foundry ใช้รูปแบบ Anthropic Messages
API ไม่ใช่รูปแบบ `/openai/v1` ที่เข้ากันได้กับ OpenAI ให้กำหนดค่าเหล่านั้นเป็น
ผู้ให้บริการ `anthropic-messages` แบบกำหนดเอง จนกว่า Plugin Microsoft Foundry จะเพิ่ม
รันไทม์ Anthropic แบบเนทีฟ เมื่อชื่อ deployment ของ Foundry แตกต่างจาก
ID โมเดล Claude ให้ตั้งค่า `params.canonicalModelId` ในรายการโมเดล เพื่อให้ OpenClaw
สามารถใช้ wire contracts เฉพาะโมเดล, map `/think off` ได้ถูกต้อง และ
รักษา signed thinking ได้อย่างปลอดภัย

## การสร้างภาพ MAI

Plugin ลงทะเบียน `microsoft-foundry` สำหรับ `image_generate` ด้วย
โมเดลภาพ Microsoft AI ปัจจุบัน:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

ใช้ชื่อ MAI image deployment ที่ deploy แล้วเป็น ref โมเดล ผู้ให้บริการ
ไม่ได้ประกาศโมเดลภาพเริ่มต้น เพราะ MAI API ต้องใช้ชื่อ deployment ของคุณ
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

การเรียกสร้างภาพจากพรอมป์อย่างเดียวจะเรียก endpoint generations ของ MAI ใน Microsoft Foundry:
`/mai/v1/images/generations` การแก้ไขภาพอ้างอิงจะเรียก
`/mai/v1/images/edits` และจำกัดเฉพาะ deployments `MAI-Image-2.5-Flash` และ
`MAI-Image-2.5`

การสร้างภาพจากพรอมป์อย่างเดียวสามารถใช้ชื่อ deployment แบบกำหนดเองโดยกำหนดค่าเฉพาะ
endpoint ของ Foundry ได้ สำหรับการแก้ไขภาพด้วยชื่อ deployment แบบกำหนดเอง ให้เลือก
deployment ผ่าน onboarding หรือใส่ metadata ของโมเดล เพื่อให้ OpenClaw ตรวจสอบได้ว่า
deployment นั้นรองรับโดย `MAI-Image-2.5-Flash` หรือ `MAI-Image-2.5`

ข้อจำกัดของภาพ MAI:

- เอาต์พุต: ภาพ PNG หนึ่งภาพต่อคำขอ
- ขนาด: ค่าเริ่มต้น `1024x1024`; ทั้งความกว้างและความสูงต้องมีอย่างน้อย 768 px
- จำนวนพิกเซลรวม: ความกว้าง × ความสูงต้องไม่เกิน 1,048,576
- การแก้ไข: ภาพอินพุต PNG หรือ JPEG หนึ่งภาพ
- shared hints ที่ไม่รองรับ เช่น `aspectRatio`, `resolution`, `quality`,
  `background` และ `outputFormat` ที่ไม่ใช่ PNG จะไม่ถูกส่งไปยัง Microsoft Foundry

## การแก้ไขปัญหา

- `az: command not found`: ติดตั้ง Azure CLI หรือใช้การยืนยันตัวตนด้วย API key
- `Microsoft Foundry endpoint missing for MAI image generation`: เลือก
  Foundry deployment ผ่าน onboarding หรือเพิ่ม `models.providers.microsoft-foundry.baseUrl`
- `supports MAI image deployments only`: โมเดลภาพที่เลือกชี้ไปยัง
  deployment ที่ไม่ใช่ MAI ใช้โมเดลภาพ MAI ที่ deploy แล้วสำหรับ `image_generate`

<!-- openclaw-plugin-reference:manual-end -->
