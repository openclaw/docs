---
read_when:
    - การสร้างหรือแก้ไขรูปภาพผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลสำหรับการสร้างภาพ
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ image_generate
sidebarTitle: Image generation
summary: สร้างและแก้ไขรูปภาพผ่าน image_generate บน OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: การสร้างรูปภาพ
x-i18n:
    generated_at: "2026-07-19T07:38:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: add6114760bef9e137b2888b7610c8866253bb6638f6957f7a09a33cdf4d0d22
    source_path: tools/image-generation.md
    workflow: 16
---

เครื่องมือ `image_generate` สร้างและแก้ไขรูปภาพผ่านผู้ให้บริการที่กำหนดค่าไว้
ในเซสชันแชต เครื่องมือนี้ทำงานแบบอะซิงโครนัส: OpenClaw บันทึก
งานเบื้องหลัง ส่งคืนรหัสงานทันที และปลุกเอเจนต์เมื่อ
ผู้ให้บริการดำเนินการเสร็จ เอเจนต์ที่จัดการงานเสร็จสิ้นจะใช้โหมด
การตอบกลับที่มองเห็นได้ตามปกติของเซสชัน: ส่งคำตอบสุดท้ายโดยอัตโนมัติเมื่อกำหนดค่าไว้ หรือ
`message(action="send")` เมื่อเซสชันกำหนดให้ใช้เครื่องมือส่งข้อความ หาก
เซสชันของผู้ร้องขอไม่ได้ใช้งานหรือการปลุกที่ใช้งานอยู่ล้มเหลว OpenClaw จะส่ง
ผลลัพธ์สำรองโดยตรงแบบทำซ้ำได้อย่างปลอดภัยพร้อมรูปภาพที่สร้างขึ้น เพื่อไม่ให้ผลลัพธ์
สูญหาย

<Note>
เครื่องมือนี้จะปรากฏเมื่อมีผู้ให้บริการสร้างรูปภาพอย่างน้อยหนึ่งราย
พร้อมใช้งานเท่านั้น หากไม่เห็น `image_generate` ในเครื่องมือของเอเจนต์
ให้กำหนดค่า `agents.defaults.imageGenerationModel` ตั้งค่าคีย์ API ของผู้ให้บริการ
หรือลงชื่อเข้าใช้ด้วย OpenAI ChatGPT/Codex OAuth
</Note>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="กำหนดค่าการยืนยันตัวตน">
    ตั้งค่าคีย์ API สำหรับผู้ให้บริการอย่างน้อยหนึ่งราย (ตัวอย่างเช่น `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) หรือลงชื่อเข้าใช้ด้วย OpenAI Codex OAuth
  </Step>
  <Step title="เลือกโมเดลเริ่มต้น (ไม่บังคับ)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    ChatGPT/Codex OAuth ใช้การอ้างอิงโมเดล `openai/gpt-image-2` เดียวกัน เมื่อกำหนดค่า
    โปรไฟล์ OAuth `openai` แล้ว OpenClaw จะส่งคำขอรูปภาพ
    ผ่านโปรไฟล์ OAuth ดังกล่าว แทนที่จะลองใช้ `OPENAI_API_KEY` ก่อน
    การกำหนดค่า `models.providers.openai` อย่างชัดเจน (คีย์ API, URL ฐานแบบกำหนดเอง/Azure)
    จะเลือกกลับไปใช้เส้นทาง OpenAI Images API โดยตรง

  </Step>
  <Step title="สั่งเอเจนต์">
    _"สร้างรูปมาสคอตหุ่นยนต์ที่เป็นมิตร"_

    เอเจนต์จะเรียก `image_generate` โดยอัตโนมัติ ไม่จำเป็นต้องเพิ่มเครื่องมือลงในรายการที่อนุญาต
    เนื่องจากเครื่องมือนี้เปิดใช้งานตามค่าเริ่มต้นเมื่อมีผู้ให้บริการพร้อมใช้งาน เครื่องมือ
    จะส่งคืนรหัสงานเบื้องหลัง จากนั้นเอเจนต์ที่จัดการงานเสร็จสิ้นจะส่ง
    ไฟล์แนบที่สร้างขึ้นผ่านเครื่องมือ `message` เมื่อพร้อม

  </Step>
</Steps>

<Warning>
สำหรับปลายทาง LAN ที่เข้ากันได้กับ OpenAI เช่น LocalAI ให้คง
`models.providers.openai.baseUrl` แบบกำหนดเองไว้ และเลือกใช้อย่างชัดเจนด้วย
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ปลายทางรูปภาพแบบส่วนตัวและ
ภายในยังคงถูกบล็อกตามค่าเริ่มต้น
</Warning>

## เส้นทางที่ใช้ทั่วไป

| เป้าหมาย                                                 | การอ้างอิงโมเดล                                          | การยืนยันตัวตน                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| การสร้างรูปภาพด้วย OpenAI โดยเรียกเก็บเงินผ่าน API             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| การสร้างรูปภาพด้วย OpenAI โดยใช้การยืนยันตัวตนจากการสมัครสมาชิก Codex | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| PNG/WebP พื้นหลังโปร่งใสด้วย OpenAI               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` หรือ OpenAI Codex OAuth |
| การสร้างรูปภาพด้วย DeepInfra                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| การสร้างรูปภาพแบบสื่ออารมณ์/กำกับสไตล์ด้วย fal Krea 2      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| การสร้างรูปภาพด้วย OpenRouter                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| การสร้างรูปภาพด้วย LiteLLM                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| การสร้างรูปภาพด้วย Microsoft Foundry MAI               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` หรือ Entra ID     |
| การสร้างรูปภาพด้วย Google Gemini                       | `google/gemini-3.1-flash-image`                    | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`   |

เครื่องมือเดียวกันรองรับทั้งการแปลงข้อความเป็นรูปภาพและการแก้ไขโดยใช้รูปภาพอ้างอิง ใช้ `image`
สำหรับรูปภาพอ้างอิงหนึ่งรูป หรือ `images` สำหรับหลายรูป สำหรับโมเดล Krea 2 บน fal รูปภาพ
อ้างอิงเหล่านั้นจะถูกส่งเป็นข้อมูลอ้างอิงด้านสไตล์แทนอินพุตสำหรับการแก้ไข
คำแนะนำเอาต์พุตที่ผู้ให้บริการรองรับ เช่น `quality`, `outputFormat` และ
`background` จะถูกส่งต่อเมื่อพร้อมใช้งาน และรายงานว่าถูกละเว้นเมื่อ
ผู้ให้บริการไม่ได้ระบุว่ารองรับ การรองรับพื้นหลังโปร่งใสที่รวมมาด้วย
ใช้เฉพาะกับ OpenAI ผู้ให้บริการรายอื่นอาจยังคงรักษาช่องอัลฟาของ PNG ไว้ได้ หาก
แบ็กเอนด์ของผู้ให้บริการส่งออกช่องดังกล่าว

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ          | โมเดลเริ่มต้น                           | รองรับการแก้ไข                       | การยืนยันตัวตน                                                  |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | รองรับ (1 รูปภาพ กำหนดค่าโดยเวิร์กโฟลว์) | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` สำหรับคลาวด์    |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | รองรับ (1 รูปภาพ)                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | รองรับ (ข้อจำกัดเฉพาะโมเดล)        | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image`                | รองรับ (สูงสุด 5 รูปภาพ)               | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | รองรับ (รูปภาพอินพุตสูงสุด 5 รูป)         | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | รองรับ (เฉพาะโมเดล MAI-Image-2.5)    | `AZURE_OPENAI_API_KEY` หรือ Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | รองรับ (ข้อมูลอ้างอิงตัวแบบ)            | `MINIMAX_API_KEY` หรือ MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | รองรับ (สูงสุด 5 รูปภาพ)               | `OPENAI_API_KEY` หรือ OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | รองรับ (รูปภาพอินพุตสูงสุด 5 รูป)         | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | ไม่รองรับ                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | รองรับ (สูงสุด 3 รูปภาพ)               | `XAI_API_KEY`                                         |

ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการและโมเดลที่พร้อมใช้งานขณะรันไทม์:

```text
/tool image_generate action=list
```

ใช้ `action: "status"` เพื่อตรวจสอบงานสร้างรูปภาพที่กำลังทำงานอยู่สำหรับ
เซสชันปัจจุบัน:

```text
/tool image_generate action=status
```

## ความสามารถของผู้ให้บริการ

| ความสามารถ            | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| สร้าง (จำนวนสูงสุด)  | 1                  | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| แก้ไข / อ้างอิง      | 1 รูปภาพ (เวิร์กโฟลว์) | 1 รูปภาพ   | Flux: 1; GPT: 10; ข้อมูลอ้างอิงสไตล์ Krea: 10; NB2: 14 | สูงสุด 5 รูปภาพ | 1 รูปภาพ           | 1 รูปภาพ (ข้อมูลอ้างอิงตัวแบบ) | สูงสุด 5 รูปภาพ | -     | สูงสุด 3 รูปภาพ |
| การควบคุมขนาด          | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | สูงสุด 4K       | -     | -              |
| อัตราส่วนภาพ          | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| ความละเอียด (1K/2K/4K) | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## พารามิเตอร์ของเครื่องมือ

<ParamField path="prompt" type="string" required>
  พรอมต์สำหรับสร้างรูปภาพ จำเป็นสำหรับ `action: "generate"`
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  ใช้ `"status"` เพื่อตรวจสอบงานของเซสชันที่กำลังทำงานอยู่ หรือ `"list"` เพื่อตรวจสอบ
  ผู้ให้บริการและโมเดลที่พร้อมใช้งานขณะรันไทม์
</ParamField>
<ParamField path="model" type="string">
  การแทนที่ผู้ให้บริการ/โมเดล (เช่น `openai/gpt-image-2`) ใช้
  `openai/gpt-image-1.5` สำหรับพื้นหลัง OpenAI แบบโปร่งใส
</ParamField>
<ParamField path="image" type="string">
  พาธหรือ URL ของรูปภาพอ้างอิงหนึ่งรูปสำหรับโหมดแก้ไข
</ParamField>
<ParamField path="images" type="string[]">
  รูปภาพอ้างอิงหลายรูปสำหรับโหมดแก้ไขหรือโมเดลที่ใช้ข้อมูลอ้างอิงด้านสไตล์ (สูงสุด 14 รูป
  ผ่านเครื่องมือที่ใช้ร่วมกัน โดยยังคงมีข้อจำกัดเฉพาะผู้ให้บริการ)
</ParamField>
<ParamField path="size" type="string">
  คำแนะนำขนาด: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`
</ParamField>
<ParamField path="aspectRatio" type="string">
  อัตราส่วนภาพ: `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`, `2.35:1`, `3:4`,
  `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`, `21:9`, `1:2`, `4:1`,
  `1:4`, `8:1`, `1:8` ผู้ให้บริการจะตรวจสอบชุดย่อยที่เฉพาะเจาะจงสำหรับโมเดลของตน
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>คำแนะนำความละเอียด</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  คำแนะนำคุณภาพเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  คำแนะนำรูปแบบเอาต์พุตเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  คำแนะนำพื้นหลังเมื่อผู้ให้บริการรองรับ ใช้ `transparent` ร่วมกับ
  `outputFormat: "png"` หรือ `"webp"` สำหรับผู้ให้บริการที่รองรับความโปร่งใส
</ParamField>
<ParamField path="count" type="number">จำนวนรูปภาพที่จะสร้าง (1-4)</ParamField>
<ParamField path="timeoutMs" type="number">
  ระยะหมดเวลาของคำขอไปยังผู้ให้บริการในหน่วยมิลลิวินาที ซึ่งเป็นตัวเลือก เมื่อ Codex เรียก
  `image_generate` ผ่านเครื่องมือแบบไดนามิก ค่าต่อการเรียกนี้ยังคงแทนที่
  ค่าเริ่มต้นที่กำหนดไว้ และจำกัดสูงสุดที่ 600000 ms
</ParamField>
<ParamField path="filename" type="string">คำแนะนำชื่อไฟล์เอาต์พุต</ParamField>
<ParamField path="openai" type="object">
  คำแนะนำเฉพาะ OpenAI: `background`, `moderation`, `outputCompression` และ `user`
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  การควบคุมความสร้างสรรค์ของ fal Krea 2 ค่าเริ่มต้นคือ `medium`
</ParamField>

<Note>
ผู้ให้บริการบางรายไม่รองรับพารามิเตอร์ทั้งหมด เมื่อผู้ให้บริการสำรองรองรับ
ตัวเลือกรูปทรงที่ใกล้เคียงแทนตัวเลือกที่ร้องขออย่างตรงเจาะจง OpenClaw จะแมปใหม่เป็น
ขนาด อัตราส่วนภาพ หรือความละเอียดที่รองรับและใกล้เคียงที่สุดก่อนส่งคำขอ
คำแนะนำเอาต์พุตที่ไม่รองรับจะถูกตัดออกสำหรับผู้ให้บริการที่ไม่ได้ระบุว่า
รองรับ และจะถูกรายงานในผลลัพธ์ของเครื่องมือ ผลลัพธ์ของเครื่องมือจะรายงานการตั้งค่า
ที่นำไปใช้ โดย `details.normalization` จะบันทึกการแปลงจากค่าที่ร้องขอ
เป็นค่าที่นำไปใช้
</Note>

## การกำหนดค่า

### การเลือกโมเดล

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### ลำดับการเลือกผู้ให้บริการ

OpenClaw ทดลองใช้ผู้ให้บริการตามลำดับนี้:

1. **พารามิเตอร์ `model`** จากการเรียกใช้เครื่องมือ (หากเอเจนต์ระบุ)
2. **`imageGenerationModel.primary`** จากการกำหนดค่า
3. **`imageGenerationModel.fallbacks`** ตามลำดับ
4. **การตรวจหาอัตโนมัติ** - เฉพาะค่าเริ่มต้นของผู้ให้บริการที่มีการรับรองความถูกต้องรองรับ:
   - ผู้ให้บริการเริ่มต้นปัจจุบันก่อน
   - ผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนรายอื่นตามลำดับรหัสผู้ให้บริการ

หากผู้ให้บริการล้มเหลว (ข้อผิดพลาดในการรับรองความถูกต้อง ขีดจำกัดอัตรา ฯลฯ) ระบบจะทดลองใช้
ตัวเลือกถัดไปที่กำหนดค่าไว้โดยอัตโนมัติ หากทั้งหมดล้มเหลว ข้อผิดพลาดจะมีรายละเอียด
จากการทดลองแต่ละครั้ง

<AccordionGroup>
  <Accordion title="การแทนที่โมเดลต่อการเรียกใช้มีผลแบบเจาะจง">
    การแทนที่ `model` ต่อการเรียกใช้จะทดลองใช้เฉพาะผู้ให้บริการ/โมเดลนั้น และ
    จะไม่ดำเนินการต่อไปยังผู้ให้บริการหลัก/สำรองที่กำหนดค่าไว้หรือผู้ให้บริการที่ตรวจพบโดยอัตโนมัติ
  </Accordion>
  <Accordion title="การตรวจหาอัตโนมัติคำนึงถึงการรับรองความถูกต้อง">
    ค่าเริ่มต้นของผู้ให้บริการจะเข้าสู่รายการตัวเลือกต่อเมื่อ OpenClaw สามารถ
    รับรองความถูกต้องกับผู้ให้บริการนั้นได้จริง ตั้งค่า
    `agents.defaults.mediaGenerationAutoProviderFallback: false` เพื่อใช้เฉพาะ
    รายการ `model`, `primary` และ `fallbacks` ที่ระบุอย่างชัดเจน
  </Accordion>
  <Accordion title="ระยะหมดเวลา">
    ตั้งค่า `agents.defaults.imageGenerationModel.timeoutMs` สำหรับแบ็กเอนด์สร้างรูปภาพ
    ที่ทำงานช้า พารามิเตอร์เครื่องมือ `timeoutMs` ต่อการเรียกใช้จะแทนที่ค่าเริ่มต้น
    ที่กำหนดค่าไว้ และค่าเริ่มต้นที่กำหนดค่าไว้จะแทนที่ค่าเริ่มต้นของผู้ให้บริการ
    ที่ Plugin กำหนด ผู้ให้บริการรูปภาพที่โฮสต์โดย Google และ OpenRouter ใช้ค่าเริ่มต้น
    180 วินาที ส่วนการสร้างรูปภาพด้วย Microsoft Foundry MAI, xAI และ Azure OpenAI ใช้
    600 วินาที การเรียกใช้เครื่องมือแบบไดนามิกของ Codex ใช้ค่าเริ่มต้นของบริดจ์
    `image_generate` ที่ 120 วินาที และปฏิบัติตามงบประมาณระยะหมดเวลาเดียวกันเมื่อมีการกำหนดค่า
    โดยจำกัดไม่เกินค่าสูงสุด 600000 ms ของบริดจ์เครื่องมือแบบไดนามิกของ OpenClaw
  </Accordion>
  <Accordion title="ตรวจสอบขณะรันไทม์">
    ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการที่ลงทะเบียนอยู่ในปัจจุบัน
    โมเดลเริ่มต้นของผู้ให้บริการเหล่านั้น และคำแนะนำเกี่ยวกับตัวแปรสภาพแวดล้อมสำหรับการรับรองความถูกต้อง
  </Accordion>
</AccordionGroup>

### การแก้ไขรูปภาพ

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI และ xAI รองรับการแก้ไขรูปภาพอ้างอิง โมเดล Krea 2 บน fal ใช้
ฟิลด์ `image` / `images` เดียวกันเป็นข้อมูลอ้างอิงสไตล์แทนอินพุต
สำหรับการแก้ไข ส่งพาธหรือ URL ของรูปภาพอ้างอิง:

```text
"สร้างรูปภาพนี้เป็นเวอร์ชันสีน้ำ" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter และ Google รองรับรูปภาพอ้างอิงสูงสุด 5 รูปผ่าน
พารามิเตอร์ `images` ส่วน xAI รองรับสูงสุด 3 รูป fal รองรับรูปภาพอ้างอิง 1 รูปสำหรับ
Flux image-to-image, สูงสุด 10 รูปสำหรับการแก้ไขด้วย GPT Image 2, ข้อมูลอ้างอิงสไตล์สูงสุด 10 รายการ
สำหรับ Krea 2 และสูงสุด 14 รูปสำหรับการแก้ไขด้วย Nano Banana 2 ส่วน Microsoft Foundry, MiniMax
และ ComfyUI รองรับ 1 รูป

## เจาะลึกผู้ให้บริการ

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (และ gpt-image-1.5)">
    การสร้างรูปภาพด้วย OpenAI มีค่าเริ่มต้นเป็น `openai/gpt-image-2` หากมีการกำหนดค่า
    โปรไฟล์ OAuth `openai` ไว้ OpenClaw จะนำโปรไฟล์
    OAuth เดียวกับที่โมเดลแชตจากการสมัครสมาชิก Codex ใช้กลับมาใช้ และส่ง
    คำขอรูปภาพผ่านแบ็กเอนด์ Codex Responses URL ฐาน Codex แบบเดิม
    เช่น `https://chatgpt.com/backend-api` จะถูกปรับเป็นรูปแบบมาตรฐาน
    `https://chatgpt.com/backend-api/codex` สำหรับคำขอรูปภาพ OpenClaw
    จะ **ไม่** เปลี่ยนไปใช้ `OPENAI_API_KEY` สำหรับคำขอนั้นโดยไม่แจ้งให้ทราบ -
    หากต้องการบังคับให้กำหนดเส้นทางตรงไปยัง OpenAI Images API ให้กำหนดค่า
    `models.providers.openai` อย่างชัดเจนด้วยคีย์ API, URL ฐานแบบกำหนดเอง
    หรือเอนด์พอยต์ Azure

    ยังสามารถเลือกโมเดล `openai/gpt-image-1.5`, `openai/gpt-image-1` และ
    `openai/gpt-image-1-mini` ได้อย่างชัดเจน ใช้
    `gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP ที่มีพื้นหลังโปร่งใส โดย API
    `gpt-image-2` ปัจจุบันปฏิเสธ `background: "transparent"`

    `gpt-image-2` รองรับทั้งการสร้างรูปภาพจากข้อความและ
    การแก้ไขรูปภาพอ้างอิงผ่านเครื่องมือ `image_generate` เดียวกัน
    OpenClaw ส่งต่อ `prompt`, `count`, `size`, `quality`, `outputFormat`
    และรูปภาพอ้างอิงไปยัง OpenAI แต่ OpenAI จะ **ไม่ได้** รับ
    `aspectRatio` หรือ `resolution` โดยตรง เมื่อเป็นไปได้ OpenClaw จะแมป
    ค่าเหล่านั้นเป็น `size` ที่รองรับ มิฉะนั้นเครื่องมือจะรายงานว่าเป็น
    การแทนที่ที่ถูกละเว้น

    ตัวเลือกเฉพาะของ OpenAI อยู่ภายใต้ออบเจ็กต์ `openai`:

    ```json
    {
      "quality": "low",
      "outputFormat": "jpeg",
      "openai": {
        "background": "opaque",
        "moderation": "low",
        "outputCompression": 60,
        "user": "end-user-42"
      }
    }
    ```

    `openai.background` ยอมรับ `transparent`, `opaque` หรือ `auto`;
    เอาต์พุตแบบโปร่งใสต้องใช้ `outputFormat` `png` หรือ `webp` และ
    โมเดลรูปภาพ OpenAI ที่รองรับความโปร่งใส OpenClaw กำหนดเส้นทางคำขอพื้นหลังโปร่งใส
    `gpt-image-2` เริ่มต้นไปยัง `gpt-image-1.5`
    `openai.outputCompression` ใช้กับเอาต์พุต JPEG/WebP และจะถูกละเว้น
    สำหรับเอาต์พุต PNG

    คำแนะนำ `background` ระดับบนสุดไม่ขึ้นกับผู้ให้บริการ และปัจจุบันจะแมป
    ไปยังฟิลด์คำขอ `background` เดียวกันของ OpenAI เมื่อเลือกผู้ให้บริการ OpenAI
    ผู้ให้บริการที่ไม่ได้ประกาศการรองรับพื้นหลังจะส่งค่านี้กลับมาใน
    `ignoredOverrides` แทนที่จะได้รับพารามิเตอร์ที่ไม่รองรับ

    หากต้องการกำหนดเส้นทางการสร้างรูปภาพด้วย OpenAI ผ่านการปรับใช้งาน Azure OpenAI
    แทน `api.openai.com` โปรดดู
    [เอนด์พอยต์ Azure OpenAI](/th/providers/openai#azure-openai-endpoints)

  </Accordion>
  <Accordion title="โมเดลรูปภาพ Microsoft Foundry MAI">
    การสร้างรูปภาพด้วย Microsoft Foundry ใช้ชื่อการปรับใช้งานโมเดลรูปภาพ MAI
    ภายใต้คำนำหน้าผู้ให้บริการ `microsoft-foundry/` ไม่มีโมเดลเริ่มต้น
    ระดับผู้ให้บริการ เนื่องจาก MAI API ต้องการชื่อการปรับใช้งานของคุณใน
    ฟิลด์ `model`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    ผู้ให้บริการใช้ MAI API ของ Microsoft Foundry ไม่ใช่ OpenAI Images API:

    - เอนด์พอยต์การสร้าง: `/mai/v1/images/generations`
    - เอนด์พอยต์การแก้ไข: `/mai/v1/images/edits`
    - การรับรองความถูกต้อง: `AZURE_OPENAI_API_KEY` / คีย์ API ของผู้ให้บริการ หรือ Entra ID ผ่าน `az login`
    - เอาต์พุต: รูปภาพ PNG หนึ่งรูป
    - ขนาด: ค่าเริ่มต้น `1024x1024`; ความกว้างและความสูงแต่ละด้านต้องมีอย่างน้อย 768 px
      และจำนวนพิกเซลรวมต้องไม่เกิน 1,048,576
    - การแก้ไข: รูปภาพอ้างอิง PNG หรือ JPEG หนึ่งรูป รองรับเฉพาะการปรับใช้งาน
      `MAI-Image-2.5-Flash` และ `MAI-Image-2.5`

    การสร้างจากพรอมต์เพียงอย่างเดียวสามารถใช้ชื่อการปรับใช้งานแบบกำหนดเองได้ โดยกำหนดค่า
    เฉพาะเอนด์พอยต์ Foundry การแก้ไขด้วยชื่อการปรับใช้งานแบบกำหนดเองต้องมี
    ข้อมูลเมตาการเริ่มต้นใช้งาน/โมเดล เพื่อให้ OpenClaw ตรวจสอบได้ว่าการปรับใช้งานนั้น
    รองรับด้วย `MAI-Image-2.5-Flash` หรือ `MAI-Image-2.5`

    โมเดลรูปภาพ MAI ปัจจุบันคือ `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` และ `MAI-Image-2` โปรดดู
    [Plugin Microsoft Foundry](/th/plugins/reference/microsoft-foundry) สำหรับการตั้งค่า
    และพฤติกรรมของโมเดลแชต

  </Accordion>
  <Accordion title="โมเดลรูปภาพ OpenRouter">
    การสร้างรูปภาพด้วย OpenRouter ใช้ `OPENROUTER_API_KEY` เดียวกัน และ
    กำหนดเส้นทางผ่าน API รูปภาพสำหรับการเติมข้อความแชตของ OpenRouter เลือก
    โมเดลรูปภาพ OpenRouter ด้วยคำนำหน้า `openrouter/`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openrouter/google/gemini-3.1-flash-image-preview",
          },
        },
      },
    }
    ```

    OpenClaw ส่งต่อ `prompt`, `count`, รูปภาพอ้างอิง และ
    คำแนะนำ `aspectRatio` / `resolution` ที่เข้ากันได้กับ Gemini ไปยัง OpenRouter
    ทางลัดโมเดลรูปภาพ OpenRouter ในตัวปัจจุบันประกอบด้วย
    `google/gemini-3.1-flash-image`,
    `google/gemini-3-pro-image` และ `openai/gpt-5.4-image-2` ใช้
    `action: "list"` เพื่อดูว่า Plugin ที่คุณกำหนดค่าไว้เปิดเผยสิ่งใดบ้าง

  </Accordion>
  <Accordion title="fal Krea 2">
    โมเดล Krea 2 บน fal ใช้สคีมา Krea แบบเนทีฟของ fal แทนสคีมา
    `image_size` ทั่วไปที่ Flux ใช้ OpenClaw ส่ง:

    - `aspect_ratio` สำหรับคำแนะนำอัตราส่วนภาพ
    - `creativity` โดยมีค่าเริ่มต้นเป็น `medium`
    - `image_style_references` เมื่อมีการระบุ `image` หรือ `images`

    เลือก Krea 2 Medium สำหรับภาพประกอบที่สื่ออารมณ์ได้รวดเร็วยิ่งขึ้น และ Krea 2 Large
    สำหรับรูปลักษณ์สมจริงและมีพื้นผิวที่ละเอียดกว่าแต่ทำงานช้ากว่า:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    ปัจจุบัน Krea 2 ส่งคืนหนึ่งรูปภาพต่อคำขอ ควรใช้ `aspectRatio` สำหรับ
    Krea โดย OpenClaw จะแมป `size` ไปยังอัตราส่วนภาพ Krea ที่รองรับและใกล้เคียงที่สุด และ
    ปฏิเสธ `resolution` สำหรับ Krea แทนที่จะละทิ้งค่านั้น ใช้ `fal.creativity`
    เมื่อต้องการระดับความสร้างสรรค์แบบเนทีฟของ Krea:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "ภาพบุคคลสไตล์ไซเบอร์ซีนที่มีพื้นผิวแบบริโซกราฟ",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="การรับรองความถูกต้องสองรูปแบบของ MiniMax">
    การสร้างรูปภาพด้วย MiniMax ใช้งานได้ผ่านเส้นทางการรับรองความถูกต้อง
    MiniMax ที่รวมมาให้ทั้งสองเส้นทาง:

    - `minimax/image-01` สำหรับการตั้งค่าด้วยคีย์ API
    - `minimax-portal/image-01` สำหรับการตั้งค่าด้วย OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    ผู้ให้บริการ xAI ที่รวมมาให้ใช้ `/v1/images/generations` สำหรับคำขอ
    ที่มีเฉพาะพรอมต์ และใช้ `/v1/images/edits` เมื่อมี `image` หรือ `images`

    - โมเดล: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - จำนวน: สูงสุด 4
    - ข้อมูลอ้างอิง: `image` หนึ่งรายการ หรือ `images` สูงสุดสามรายการ
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - ความละเอียด: `1K`, `2K`
    - เอาต์พุต: ส่งคืนเป็นไฟล์แนบรูปภาพที่ OpenClaw จัดการ

    OpenClaw ตั้งใจไม่เปิดเผย `quality`, `mask`,
    `user` แบบเนทีฟของ xAI หรืออัตราส่วนภาพ `auto` จนกว่าตัวควบคุมเหล่านั้นจะมีอยู่ในสัญญา
    `image_generate` แบบใช้ร่วมกันข้ามผู้ให้บริการ

  </Accordion>
</AccordionGroup>

## ตัวอย่าง

<Tabs>
  <Tab title="สร้าง (แนวนอน 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="โปสเตอร์เชิงบรรณาธิการที่สะอาดตาสำหรับการสร้างรูปภาพด้วย OpenClaw" size=3840x2160 count=1
```
  </Tab>
  <Tab title="สร้าง (PNG โปร่งใส)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="สติกเกอร์วงกลมสีแดงเรียบง่ายบนพื้นหลังโปร่งใส" outputFormat=png background=transparent
```

CLI ที่เทียบเท่า:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "สติกเกอร์วงกลมสีแดงเรียบง่ายบนพื้นหลังโปร่งใส" \
  --json
```

  </Tab>
  <Tab title="สร้าง (คุณภาพต่ำของ OpenAI)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="ร่างโปสเตอร์ต้นทุนต่ำสำหรับแอปเพิ่มประสิทธิภาพการทำงานที่เรียบสงบ" quality=low openai='{"moderation":"low"}'
```

CLI ที่เทียบเท่า:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "โปสเตอร์ฉบับร่างต้นทุนต่ำสำหรับแอปเพิ่มประสิทธิภาพการทำงานที่เรียบสงบ" \
  --json
```

  </Tab>
  <Tab title="สร้าง (สี่เหลี่ยมจัตุรัสสองภาพ)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="แนวทางภาพสองแบบสำหรับไอคอนแอปเพิ่มประสิทธิภาพการทำงานที่สงบ" size=1024x1024 count=2
```
  </Tab>
  <Tab title="แก้ไข (ภาพอ้างอิงหนึ่งภาพ)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="คงตัวแบบไว้ แล้วเปลี่ยนพื้นหลังเป็นฉากสตูดิโอที่สว่าง" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="แก้ไข (ภาพอ้างอิงหลายภาพ)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="ผสานเอกลักษณ์ของตัวละครจากภาพแรกเข้ากับชุดสีจากภาพที่สอง" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="ภาพอ้างอิงสไตล์ Krea">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="ภาพบุคคลเชิงบรรณาธิการที่เปี่ยมอารมณ์ โดยใช้ชุดสีและพื้นผิวงานพิมพ์นี้" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

แฟล็ก `--output-format`, `--background`, `--quality` และ
`--openai-moderation` ชุดเดียวกันมีให้ใช้กับ `openclaw infer image edit`;
`--openai-background` ยังคงเป็นนามแฝงเฉพาะสำหรับ OpenAI ผู้ให้บริการที่รวมมาให้
รายอื่นนอกเหนือจาก OpenAI ยังไม่ได้ประกาศการควบคุมพื้นหลังอย่างชัดเจนในขณะนี้ ดังนั้น
`background: "transparent"` จึงถูกรายงานว่าถูกละเว้นสำหรับผู้ให้บริการเหล่านั้น

## ที่เกี่ยวข้อง

- [ภาพรวมเครื่องมือ](/th/tools) - เครื่องมือทั้งหมดที่พร้อมใช้งานสำหรับเอเจนต์
- [ComfyUI](/th/providers/comfy) - การตั้งค่าเวิร์กโฟลว์ ComfyUI ในเครื่องและ Comfy Cloud
- [fal](/th/providers/fal) - การตั้งค่าผู้ให้บริการรูปภาพและวิดีโอ fal
- [Google (Gemini)](/th/providers/google) - การตั้งค่าผู้ให้บริการรูปภาพ Gemini
- [Plugin Microsoft Foundry](/th/plugins/reference/microsoft-foundry) - การตั้งค่าแชต Microsoft Foundry และรูปภาพ MAI
- [MiniMax](/th/providers/minimax) - การตั้งค่าผู้ให้บริการรูปภาพ MiniMax
- [OpenAI](/th/providers/openai) - การตั้งค่าผู้ให้บริการ OpenAI Images
- [Vydra](/th/providers/vydra) - การตั้งค่ารูปภาพ วิดีโอ และเสียงพูดของ Vydra
- [xAI](/th/providers/xai) - การตั้งค่ารูปภาพ วิดีโอ การค้นหา การเรียกใช้โค้ด และ TTS ของ Grok
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) - การกำหนดค่า `imageGenerationModel`
- [โมเดล](/th/concepts/models) - การกำหนดค่าโมเดลและการสลับไปใช้ระบบสำรอง
