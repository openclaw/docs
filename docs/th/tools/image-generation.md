---
read_when:
    - การสร้างหรือแก้ไขรูปภาพผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลสำหรับการสร้างภาพ
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ image_generate
sidebarTitle: Image generation
summary: สร้างและแก้ไขรูปภาพผ่าน image_generate บน OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: การสร้างรูปภาพ
x-i18n:
    generated_at: "2026-07-12T16:49:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

เครื่องมือ `image_generate` ใช้สร้างและแก้ไขรูปภาพผ่านผู้ให้บริการที่คุณกำหนดค่าไว้ ในเซสชันแชต เครื่องมือนี้ทำงานแบบอะซิงโครนัส: OpenClaw จะบันทึกงานเบื้องหลัง ส่งคืนรหัสงานทันที และปลุกเอเจนต์เมื่อผู้ให้บริการดำเนินการเสร็จ เอเจนต์ที่จัดการงานเสร็จสิ้นจะใช้โหมดการตอบกลับที่มองเห็นได้ตามปกติของเซสชัน ได้แก่ ส่งคำตอบสุดท้ายโดยอัตโนมัติเมื่อมีการกำหนดค่าไว้ หรือใช้ `message(action="send")` เมื่อเซสชันกำหนดให้ใช้เครื่องมือส่งข้อความ หากเซสชันของผู้ร้องขอไม่มีการใช้งานหรือการปลุกที่กำลังทำงานล้มเหลว OpenClaw จะส่งผลลัพธ์สำรองโดยตรงแบบทำซ้ำได้อย่างปลอดภัยพร้อมรูปภาพที่สร้างขึ้น เพื่อไม่ให้ผลลัพธ์สูญหาย

<Note>
เครื่องมือนี้จะปรากฏเฉพาะเมื่อมีผู้ให้บริการสร้างรูปภาพอย่างน้อยหนึ่งรายพร้อมใช้งาน หากคุณไม่เห็น `image_generate` ในรายการเครื่องมือของเอเจนต์ ให้กำหนดค่า `agents.defaults.imageGenerationModel` ตั้งค่าคีย์ API ของผู้ให้บริการ หรือลงชื่อเข้าใช้ด้วย OpenAI ChatGPT/Codex OAuth
</Note>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="กำหนดค่าการยืนยันตัวตน">
    ตั้งค่าคีย์ API สำหรับผู้ให้บริการอย่างน้อยหนึ่งราย (ตัวอย่างเช่น `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) หรือลงชื่อเข้าใช้ด้วย OpenAI Codex OAuth
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

    ChatGPT/Codex OAuth ใช้การอ้างอิงโมเดล `openai/gpt-image-2` เดียวกัน เมื่อมีการกำหนดค่าโปรไฟล์ OAuth ของ `openai` แล้ว OpenClaw จะกำหนดเส้นทางคำขอรูปภาพผ่านโปรไฟล์ OAuth นั้น แทนที่จะลองใช้ `OPENAI_API_KEY` ก่อน การกำหนดค่า `models.providers.openai` อย่างชัดเจน (คีย์ API หรือ URL ฐานแบบกำหนดเอง/Azure) จะเลือกกลับไปใช้เส้นทาง OpenAI Images API โดยตรง

  </Step>
  <Step title="สั่งเอเจนต์">
    _"สร้างรูปภาพมาสคอตหุ่นยนต์ที่เป็นมิตร"_

    เอเจนต์จะเรียก `image_generate` โดยอัตโนมัติ ไม่จำเป็นต้องเพิ่มเครื่องมือนี้ในรายการอนุญาต เพราะจะเปิดใช้งานเป็นค่าเริ่มต้นเมื่อมีผู้ให้บริการพร้อมใช้งาน เครื่องมือจะส่งคืนรหัสงานเบื้องหลัง จากนั้นเอเจนต์ที่จัดการงานเสร็จสิ้นจะส่งไฟล์แนบที่สร้างขึ้นผ่านเครื่องมือ `message` เมื่อพร้อม

  </Step>
</Steps>

<Warning>
สำหรับปลายทาง LAN ที่เข้ากันได้กับ OpenAI เช่น LocalAI ให้คงค่า `models.providers.openai.baseUrl` แบบกำหนดเองไว้ และเลือกอนุญาตอย่างชัดเจนด้วย `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ปลายทางรูปภาพแบบส่วนตัวและภายในยังคงถูกบล็อกเป็นค่าเริ่มต้น
</Warning>

## เส้นทางที่ใช้บ่อย

| เป้าหมาย                                             | การอ้างอิงโมเดล                                    | การยืนยันตัวตน                         |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| การสร้างรูปภาพด้วย OpenAI โดยเรียกเก็บค่าบริการผ่าน API | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| การสร้างรูปภาพด้วย OpenAI โดยใช้การยืนยันตัวตนจากการสมัครสมาชิก Codex | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| PNG/WebP พื้นหลังโปร่งใสด้วย OpenAI                  | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` หรือ OpenAI Codex OAuth |
| การสร้างรูปภาพด้วย DeepInfra                         | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| การสร้างภาพแบบสื่ออารมณ์/กำกับสไตล์ด้วย fal Krea 2  | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| การสร้างรูปภาพด้วย OpenRouter                        | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| การสร้างรูปภาพด้วย LiteLLM                           | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| การสร้างรูปภาพด้วย Microsoft Foundry MAI             | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` หรือ Entra ID   |
| การสร้างรูปภาพด้วย Google Gemini                     | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` |

เครื่องมือเดียวกันรองรับทั้งการสร้างรูปภาพจากข้อความและการแก้ไขด้วยรูปภาพอ้างอิง ใช้ `image` สำหรับรูปภาพอ้างอิงหนึ่งรูป หรือ `images` สำหรับหลายรูป สำหรับโมเดล Krea 2 บน fal รูปภาพอ้างอิงเหล่านั้นจะถูกส่งเป็นข้อมูลอ้างอิงด้านสไตล์แทนอินพุตสำหรับแก้ไข ตัวบ่งชี้เอาต์พุตที่ผู้ให้บริการรองรับ เช่น `quality`, `outputFormat` และ `background` จะถูกส่งต่อเมื่อพร้อมใช้งาน และจะรายงานว่าถูกละเว้นเมื่อผู้ให้บริการไม่ได้ประกาศการรองรับ การรองรับพื้นหลังโปร่งใสที่รวมมาให้ใช้ได้เฉพาะกับ OpenAI ส่วนผู้ให้บริการรายอื่นอาจยังคงรักษาช่องอัลฟาของ PNG ไว้ได้ หากแบ็กเอนด์ของผู้ให้บริการส่งออกมาด้วย

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ       | โมเดลเริ่มต้น                            | การรองรับการแก้ไข                 | การยืนยันตัวตน                                        |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | รองรับ (1 รูป กำหนดค่าผ่านเวิร์กโฟลว์) | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` สำหรับคลาวด์ |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | รองรับ (1 รูป)                     | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | รองรับ (ข้อจำกัดขึ้นอยู่กับโมเดล)  | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | รองรับ (สูงสุด 5 รูป)              | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                |
| LiteLLM           | `gpt-image-2`                           | รองรับ (รูปภาพอินพุตสูงสุด 5 รูป)  | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | รองรับ (เฉพาะโมเดล MAI-Image-2.5) | `AZURE_OPENAI_API_KEY` หรือ Entra ID (`az login`)     |
| MiniMax           | `image-01`                              | รองรับ (การอ้างอิงตัวแบบหลัก)      | `MINIMAX_API_KEY` หรือ MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | รองรับ (สูงสุด 5 รูป)              | `OPENAI_API_KEY` หรือ OpenAI ChatGPT/Codex OAuth      |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | รองรับ (รูปภาพอินพุตสูงสุด 5 รูป)  | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | ไม่รองรับ                           | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | รองรับ (สูงสุด 3 รูป)              | `XAI_API_KEY`                                         |

ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการและโมเดลที่พร้อมใช้งานขณะรันไทม์:

```text
/tool image_generate action=list
```

ใช้ `action: "status"` เพื่อตรวจสอบงานสร้างรูปภาพที่กำลังทำงานอยู่สำหรับเซสชันปัจจุบัน:

```text
/tool image_generate action=status
```

## ความสามารถของผู้ให้บริการ

| ความสามารถ           | ComfyUI                  | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax                    | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | -------------------------- | -------------- | ----- | -------------- |
| สร้าง (จำนวนสูงสุด)   | 1                        | 4         | 4                                              | 4              | 1                 | 9                          | 4              | 1     | 4              |
| แก้ไข / อ้างอิง       | 1 รูป (เวิร์กโฟลว์)      | 1 รูป     | Flux: 1; GPT: 10; การอ้างอิงสไตล์ Krea: 10; NB2: 14 | สูงสุด 5 รูป | 1 รูป             | 1 รูป (อ้างอิงตัวแบบหลัก) | สูงสุด 5 รูป   | -     | สูงสุด 3 รูป   |
| การควบคุมขนาด         | -                        | ✓         | ✓                                              | ✓              | ✓                 | -                          | สูงสุด 4K      | -     | -              |
| อัตราส่วนภาพ          | -                        | -         | ✓                                              | ✓              | -                 | ✓                          | -              | -     | ✓              |
| ความละเอียด (1K/2K/4K) | -                       | -         | ✓                                              | ✓              | -                 | -                          | -              | -     | 1K, 2K         |

## พารามิเตอร์ของเครื่องมือ

<ParamField path="prompt" type="string" required>
  พรอมต์สำหรับสร้างรูปภาพ จำเป็นสำหรับ `action: "generate"`
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  ใช้ `"status"` เพื่อตรวจสอบงานของเซสชันที่กำลังทำงานอยู่ หรือใช้ `"list"` เพื่อตรวจสอบผู้ให้บริการและโมเดลที่พร้อมใช้งานขณะรันไทม์
</ParamField>
<ParamField path="model" type="string">
  ระบุผู้ให้บริการ/โมเดลแทนค่าที่กำหนดไว้ (เช่น `openai/gpt-image-2`) ใช้ `openai/gpt-image-1.5` สำหรับพื้นหลังโปร่งใสของ OpenAI
</ParamField>
<ParamField path="image" type="string">
  พาธหรือ URL ของรูปภาพอ้างอิงหนึ่งรูปสำหรับโหมดแก้ไข
</ParamField>
<ParamField path="images" type="string[]">
  รูปภาพอ้างอิงหลายรูปสำหรับโหมดแก้ไขหรือโมเดลที่ใช้ข้อมูลอ้างอิงด้านสไตล์ (สูงสุด 14 รูปผ่านเครื่องมือที่ใช้ร่วมกัน โดยยังคงมีข้อจำกัดเฉพาะของแต่ละผู้ให้บริการ)
</ParamField>
<ParamField path="size" type="string">
  ตัวบ่งชี้ขนาด: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`
</ParamField>
<ParamField path="aspectRatio" type="string">
  อัตราส่วนภาพ: `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`, `2.35:1`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`, `21:9`, `1:2`, `4:1`, `1:4`, `8:1`, `1:8` ผู้ให้บริการจะตรวจสอบชุดย่อยที่รองรับเฉพาะสำหรับโมเดลของตน
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>ตัวบ่งชี้ความละเอียด</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  ตัวบ่งชี้คุณภาพเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  ตัวบ่งชี้รูปแบบเอาต์พุตเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  ตัวบ่งชี้พื้นหลังเมื่อผู้ให้บริการรองรับ ใช้ `transparent` ร่วมกับ `outputFormat: "png"` หรือ `"webp"` สำหรับผู้ให้บริการที่รองรับความโปร่งใส
</ParamField>
<ParamField path="count" type="number">จำนวนรูปภาพที่จะสร้าง (1-4)</ParamField>
<ParamField path="timeoutMs" type="number">
  ระยะหมดเวลาสำหรับคำขอไปยังผู้ให้บริการในหน่วยมิลลิวินาที ซึ่งเป็นค่าที่ไม่บังคับ เมื่อ Codex เรียก `image_generate` ผ่านเครื่องมือแบบไดนามิก ค่าต่อการเรียกนี้ยังคงมีลำดับความสำคัญเหนือค่าเริ่มต้นที่กำหนดไว้ และจำกัดสูงสุดที่ 600000 มิลลิวินาที
</ParamField>
<ParamField path="filename" type="string">ตัวบ่งชี้ชื่อไฟล์เอาต์พุต</ParamField>
<ParamField path="openai" type="object">
  ตัวบ่งชี้สำหรับ OpenAI เท่านั้น: `background`, `moderation`, `outputCompression` และ `user`
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  การควบคุมระดับความสร้างสรรค์ของ fal Krea 2 ค่าเริ่มต้นคือ `medium`
</ParamField>

<Note>
ผู้ให้บริการบางรายไม่รองรับพารามิเตอร์ทั้งหมด เมื่อผู้ให้บริการสำรองรองรับตัวเลือกเรขาคณิตที่ใกล้เคียงแทนตัวเลือกที่ร้องขออย่างแม่นยำ OpenClaw จะจับคู่เป็นขนาด อัตราส่วนภาพ หรือความละเอียดที่รองรับและใกล้เคียงที่สุดก่อนส่งคำขอ ตัวบ่งชี้เอาต์พุตที่ไม่รองรับจะถูกตัดออกสำหรับผู้ให้บริการที่ไม่ได้ประกาศการรองรับ และจะรายงานในผลลัพธ์ของเครื่องมือ ผลลัพธ์ของเครื่องมือจะรายงานการตั้งค่าที่นำไปใช้ ส่วน `details.normalization` จะบันทึกการแปลงค่าจากที่ร้องขอเป็นค่าที่นำไปใช้
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
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### ลำดับการเลือกผู้ให้บริการ

OpenClaw จะลองใช้ผู้ให้บริการตามลำดับต่อไปนี้:

1. พารามิเตอร์ **`model`** จากการเรียกใช้เครื่องมือ (หากเอเจนต์ระบุ)
2. **`imageGenerationModel.primary`** จากการกำหนดค่า
3. **`imageGenerationModel.fallbacks`** ตามลำดับ
4. **การตรวจหาอัตโนมัติ** - ใช้เฉพาะค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับ:
   - ผู้ให้บริการเริ่มต้นปัจจุบันก่อน
   - ผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนรายอื่นตามลำดับรหัสผู้ให้บริการ

หากผู้ให้บริการล้มเหลว (ข้อผิดพลาดในการยืนยันตัวตน ขีดจำกัดอัตราการใช้งาน เป็นต้น) ระบบจะลองตัวเลือกถัดไปที่กำหนดค่าไว้โดยอัตโนมัติ หากทั้งหมดล้มเหลว ข้อผิดพลาดจะมีรายละเอียดจากความพยายามแต่ละครั้ง

<AccordionGroup>
  <Accordion title="การแทนที่โมเดลต่อการเรียกใช้มีผลอย่างเคร่งครัด">
    การแทนที่ `model` ต่อการเรียกใช้จะลองเฉพาะผู้ให้บริการ/โมเดลนั้น และจะไม่ดำเนินการต่อไปยัง primary/fallback ที่กำหนดค่าไว้หรือผู้ให้บริการที่ตรวจพบโดยอัตโนมัติ
  </Accordion>
  <Accordion title="การตรวจหาอัตโนมัติคำนึงถึงการยืนยันตัวตน">
    ค่าเริ่มต้นของผู้ให้บริการจะเข้าสู่รายการตัวเลือกเฉพาะเมื่อ OpenClaw สามารถยืนยันตัวตนกับผู้ให้บริการนั้นได้จริง ตั้งค่า `agents.defaults.mediaGenerationAutoProviderFallback: false` เพื่อใช้เฉพาะรายการ `model`, `primary` และ `fallbacks` ที่ระบุไว้อย่างชัดเจน
  </Accordion>
  <Accordion title="ระยะหมดเวลา">
    ตั้งค่า `agents.defaults.imageGenerationModel.timeoutMs` สำหรับแบ็กเอนด์รูปภาพที่ทำงานช้า พารามิเตอร์เครื่องมือ `timeoutMs` ต่อการเรียกใช้จะแทนที่ค่าเริ่มต้นที่กำหนดไว้ และค่าเริ่มต้นที่กำหนดไว้จะแทนที่ค่าเริ่มต้นของผู้ให้บริการที่ Plugin กำหนด ผู้ให้บริการรูปภาพแบบโฮสต์ของ Google และ OpenRouter ใช้ค่าเริ่มต้น 180 วินาที ส่วนการสร้างรูปภาพของ Microsoft Foundry MAI, xAI และ Azure OpenAI ใช้ 600 วินาที การเรียกเครื่องมือแบบไดนามิกของ Codex ใช้ค่าเริ่มต้นของบริดจ์ `image_generate` ที่ 120 วินาที และใช้กรอบระยะหมดเวลาเดียวกันเมื่อมีการกำหนดค่า โดยจำกัดไม่เกินค่าสูงสุด 600000 มิลลิวินาทีของบริดจ์เครื่องมือแบบไดนามิกของ OpenClaw
  </Accordion>
  <Accordion title="ตรวจสอบขณะทำงาน">
    ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการที่ลงทะเบียนอยู่ในปัจจุบัน โมเดลเริ่มต้นของผู้ให้บริการเหล่านั้น และคำแนะนำเกี่ยวกับตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน
  </Accordion>
</AccordionGroup>

### การแก้ไขรูปภาพ

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax, ComfyUI และ xAI รองรับการแก้ไขรูปภาพอ้างอิง โมเดล Krea 2 บน fal ใช้ฟิลด์ `image` / `images` เดียวกันเป็นภาพอ้างอิงด้านสไตล์แทนอินพุตสำหรับการแก้ไข ส่งพาธหรือ URL ของรูปภาพอ้างอิง:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter และ Google รองรับรูปภาพอ้างอิงสูงสุด 5 รูปผ่านพารามิเตอร์ `images` ส่วน xAI รองรับสูงสุด 3 รูป fal รองรับรูปภาพอ้างอิง 1 รูปสำหรับการแปลงรูปภาพเป็นรูปภาพด้วย Flux, สูงสุด 10 รูปสำหรับการแก้ไขด้วย GPT Image 2, ภาพอ้างอิงด้านสไตล์สูงสุด 10 รูปสำหรับ Krea 2 และสูงสุด 14 รูปสำหรับการแก้ไขด้วย Nano Banana 2 ส่วน Microsoft Foundry, MiniMax และ ComfyUI รองรับ 1 รูป

## เจาะลึกผู้ให้บริการ

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (และ gpt-image-1.5)">
    การสร้างรูปภาพของ OpenAI ใช้ `openai/gpt-image-2` เป็นค่าเริ่มต้น หากมีการกำหนดค่าโปรไฟล์ OAuth ของ `openai` ไว้ OpenClaw จะใช้โปรไฟล์ OAuth เดียวกับที่โมเดลแชตแบบสมัครสมาชิกของ Codex ใช้ และส่งคำขอรูปภาพผ่านแบ็กเอนด์ Codex Responses URL ฐานแบบเดิมของ Codex เช่น `https://chatgpt.com/backend-api` จะถูกปรับเป็นรูปแบบมาตรฐาน `https://chatgpt.com/backend-api/codex` สำหรับคำขอรูปภาพ OpenClaw จะ **ไม่** ย้อนกลับไปใช้ `OPENAI_API_KEY` สำหรับคำขอนั้นโดยอัตโนมัติ หากต้องการบังคับให้กำหนดเส้นทางผ่าน OpenAI Images API โดยตรง ให้กำหนดค่า `models.providers.openai` อย่างชัดเจนด้วยคีย์ API, URL ฐานแบบกำหนดเอง หรือปลายทาง Azure

    ยังคงสามารถเลือกโมเดล `openai/gpt-image-1.5`, `openai/gpt-image-1` และ `openai/gpt-image-1-mini` ได้อย่างชัดเจน ใช้ `gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP ที่มีพื้นหลังโปร่งใส เนื่องจาก API `gpt-image-2` ปัจจุบันปฏิเสธ `background: "transparent"`

    `gpt-image-2` รองรับทั้งการสร้างรูปภาพจากข้อความและการแก้ไขรูปภาพอ้างอิงผ่านเครื่องมือ `image_generate` เดียวกัน OpenClaw ส่งต่อ `prompt`, `count`, `size`, `quality`, `outputFormat` และรูปภาพอ้างอิงไปยัง OpenAI โดย OpenAI จะ **ไม่ได้รับ** `aspectRatio` หรือ `resolution` โดยตรง หากเป็นไปได้ OpenClaw จะแปลงค่าเหล่านั้นเป็น `size` ที่รองรับ มิฉะนั้นเครื่องมือจะรายงานค่าเหล่านั้นเป็นการแทนที่ที่ถูกละเว้น

    ตัวเลือกเฉพาะของ OpenAI อยู่ภายใต้อ็อบเจ็กต์ `openai`:

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

    `openai.background` ยอมรับค่า `transparent`, `opaque` หรือ `auto` เอาต์พุตแบบโปร่งใสต้องใช้ `outputFormat` เป็น `png` หรือ `webp` และใช้โมเดลรูปภาพของ OpenAI ที่รองรับความโปร่งใส OpenClaw จะกำหนดเส้นทางคำขอพื้นหลังโปร่งใสของ `gpt-image-2` เริ่มต้นไปยัง `gpt-image-1.5` ส่วน `openai.outputCompression` มีผลกับเอาต์พุต JPEG/WebP และจะถูกละเว้นสำหรับเอาต์พุต PNG

    คำแนะนำ `background` ระดับบนสุดไม่ขึ้นกับผู้ให้บริการ และปัจจุบันจะแมปไปยังฟิลด์คำขอ `background` เดียวกันของ OpenAI เมื่อเลือกผู้ให้บริการ OpenAI ผู้ให้บริการที่ไม่ได้ประกาศว่ารองรับพื้นหลังจะส่งคืนค่านี้ใน `ignoredOverrides` แทนการรับพารามิเตอร์ที่ไม่รองรับ

    หากต้องการกำหนดเส้นทางการสร้างรูปภาพของ OpenAI ผ่านการปรับใช้ Azure OpenAI แทน `api.openai.com` โปรดดู [ปลายทาง Azure OpenAI](/th/providers/openai#azure-openai-endpoints)

  </Accordion>
  <Accordion title="โมเดลรูปภาพ Microsoft Foundry MAI">
    การสร้างรูปภาพของ Microsoft Foundry ใช้ชื่อการปรับใช้รูปภาพ MAI ที่ปรับใช้แล้วภายใต้คำนำหน้าผู้ให้บริการ `microsoft-foundry/` ไม่มีโมเดลเริ่มต้นระดับผู้ให้บริการ เนื่องจาก MAI API ต้องการชื่อการปรับใช้ของคุณในฟิลด์ `model`:

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

    - ปลายทางการสร้าง: `/mai/v1/images/generations`
    - ปลายทางการแก้ไข: `/mai/v1/images/edits`
    - การยืนยันตัวตน: `AZURE_OPENAI_API_KEY` / คีย์ API ของผู้ให้บริการ หรือ Entra ID ผ่าน `az login`
    - เอาต์พุต: รูปภาพ PNG หนึ่งรูป
    - ขนาด: ค่าเริ่มต้น `1024x1024` โดยความกว้างและความสูงแต่ละด้านต้องไม่น้อยกว่า 768 พิกเซล และจำนวนพิกเซลรวมต้องไม่เกิน 1,048,576
    - การแก้ไข: รูปภาพอ้างอิง PNG หรือ JPEG หนึ่งรูป รองรับเฉพาะการปรับใช้ `MAI-Image-2.5-Flash` และ `MAI-Image-2.5`

    การสร้างจากพรอมต์เพียงอย่างเดียวสามารถใช้ชื่อการปรับใช้แบบกำหนดเองได้โดยกำหนดค่าเฉพาะปลายทาง Foundry การแก้ไขด้วยชื่อการปรับใช้แบบกำหนดเองต้องมีข้อมูลเมตาการเริ่มต้นใช้งาน/โมเดล เพื่อให้ OpenClaw ตรวจสอบได้ว่าการปรับใช้นั้นรองรับโดย `MAI-Image-2.5-Flash` หรือ `MAI-Image-2.5`

    โมเดลรูปภาพ MAI ปัจจุบันได้แก่ `MAI-Image-2.5-Flash`, `MAI-Image-2.5`, `MAI-Image-2e` และ `MAI-Image-2` โปรดดู [Plugin Microsoft Foundry](/th/plugins/reference/microsoft-foundry) สำหรับการตั้งค่าและพฤติกรรมของโมเดลแชต

  </Accordion>
  <Accordion title="โมเดลรูปภาพ OpenRouter">
    การสร้างรูปภาพของ OpenRouter ใช้ `OPENROUTER_API_KEY` เดียวกัน และกำหนดเส้นทางผ่าน API รูปภาพของการเติมข้อความแชตของ OpenRouter เลือกโมเดลรูปภาพ OpenRouter ด้วยคำนำหน้า `openrouter/`:

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

    OpenClaw ส่งต่อ `prompt`, `count`, รูปภาพอ้างอิง และคำแนะนำ `aspectRatio` / `resolution` ที่เข้ากันได้กับ Gemini ไปยัง OpenRouter ทางลัดโมเดลรูปภาพ OpenRouter ที่มีมาให้ในปัจจุบันประกอบด้วย `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` และ `openai/gpt-5.4-image-2` ใช้ `action: "list"` เพื่อดูว่า Plugin ที่คุณกำหนดค่าไว้เปิดเผยรายการใดบ้าง

  </Accordion>
  <Accordion title="fal Krea 2">
    โมเดล Krea 2 บน fal ใช้สคีมา Krea แบบเนทีฟของ fal แทนสคีมา `image_size` ทั่วไปที่ Flux ใช้ OpenClaw ส่งค่า:

    - `aspect_ratio` สำหรับคำแนะนำอัตราส่วนภาพ
    - `creativity` ซึ่งมีค่าเริ่มต้นเป็น `medium`
    - `image_style_references` เมื่อมีการระบุ `image` หรือ `images`

    เลือก Krea 2 Medium สำหรับภาพประกอบที่สื่ออารมณ์ได้รวดเร็วกว่า และ Krea 2 Large สำหรับภาพสมจริงและพื้นผิวที่มีรายละเอียดมากกว่าแต่ทำงานช้ากว่า:

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

    ปัจจุบัน Krea 2 ส่งคืนหนึ่งรูปภาพต่อคำขอ สำหรับ Krea ควรใช้ `aspectRatio` โดย OpenClaw จะแมป `size` ไปยังอัตราส่วนภาพ Krea ที่รองรับและใกล้เคียงที่สุด และจะปฏิเสธ `resolution` สำหรับ Krea แทนการละทิ้งค่า ใช้ `fal.creativity` เมื่อต้องการระดับความสร้างสรรค์แบบเนทีฟของ Krea:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="การยืนยันตัวตนสองรูปแบบของ MiniMax">
    การสร้างรูปภาพของ MiniMax ใช้งานได้ผ่านเส้นทางการยืนยันตัวตน MiniMax ที่มีมาให้ทั้งสองรูปแบบ:

    - `minimax/image-01` สำหรับการตั้งค่าด้วยคีย์ API
    - `minimax-portal/image-01` สำหรับการตั้งค่าด้วย OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    ผู้ให้บริการ xAI ที่มีมาให้ใช้ `/v1/images/generations` สำหรับคำขอที่มีเฉพาะพรอมต์ และใช้ `/v1/images/edits` เมื่อมี `image` หรือ `images`

    - โมเดล: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - จำนวน: สูงสุด 4
    - รูปภาพอ้างอิง: `image` หนึ่งรูป หรือ `images` สูงสุดสามรูป
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`, `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - ความละเอียด: `1K`, `2K`
    - เอาต์พุต: ส่งคืนเป็นไฟล์แนบรูปภาพที่ OpenClaw จัดการ

    OpenClaw ตั้งใจไม่เปิดเผย `quality`, `mask`, `user` หรืออัตราส่วนภาพ `auto` แบบเนทีฟของ xAI จนกว่าจะมีตัวควบคุมเหล่านั้นในสัญญา `image_generate` ร่วมระหว่างผู้ให้บริการ

  </Accordion>
</AccordionGroup>

## ตัวอย่าง

<Tabs>
  <Tab title="สร้าง (แนวนอน 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="สร้าง (PNG โปร่งใส)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

CLI ที่เทียบเท่า:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="สร้าง (คุณภาพต่ำของ OpenAI)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

CLI ที่เทียบเท่า:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="สร้าง (ภาพสี่เหลี่ยมจัตุรัสสองภาพ)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="แก้ไข (ภาพอ้างอิงหนึ่งภาพ)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="แก้ไข (ภาพอ้างอิงหลายภาพ)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="ภาพอ้างอิงสไตล์ Krea">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

แฟล็ก `--output-format`, `--background`, `--quality` และ
`--openai-moderation` เดียวกันสามารถใช้กับ `openclaw infer image edit` ได้
โดย `--openai-background` ยังคงเป็นนามแฝงเฉพาะสำหรับ OpenAI ปัจจุบันผู้ให้บริการ
ที่รวมมาให้รายอื่นนอกเหนือจาก OpenAI ไม่ได้ประกาศการควบคุมพื้นหลังอย่างชัดเจน
ดังนั้นระบบจะรายงานว่าไม่สนใจ `background: "transparent"` สำหรับผู้ให้บริการเหล่านั้น

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมเครื่องมือ](/th/tools) - เครื่องมือทั้งหมดที่พร้อมให้เอเจนต์ใช้งาน
- [ComfyUI](/th/providers/comfy) - การตั้งค่าเวิร์กโฟลว์ ComfyUI ภายในเครื่องและ Comfy Cloud
- [fal](/th/providers/fal) - การตั้งค่าผู้ให้บริการรูปภาพและวิดีโอ fal
- [Google (Gemini)](/th/providers/google) - การตั้งค่าผู้ให้บริการรูปภาพ Gemini
- [Plugin Microsoft Foundry](/th/plugins/reference/microsoft-foundry) - การตั้งค่าแชต Microsoft Foundry และรูปภาพ MAI
- [MiniMax](/th/providers/minimax) - การตั้งค่าผู้ให้บริการรูปภาพ MiniMax
- [OpenAI](/th/providers/openai) - การตั้งค่าผู้ให้บริการ OpenAI Images
- [Vydra](/th/providers/vydra) - การตั้งค่ารูปภาพ วิดีโอ และเสียงพูดของ Vydra
- [xAI](/th/providers/xai) - การตั้งค่ารูปภาพ วิดีโอ การค้นหา การเรียกใช้โค้ด และ TTS ของ Grok
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) - การกำหนดค่า `imageGenerationModel`
- [โมเดล](/th/concepts/models) - การกำหนดค่าโมเดลและการสลับไปใช้ระบบสำรอง
