---
read_when:
    - การสร้างหรือแก้ไขรูปภาพผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลการสร้างภาพ
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ image_generate
sidebarTitle: Image generation
summary: สร้างและแก้ไขรูปภาพผ่าน image_generate บน OpenAI, Google, fal, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: การสร้างภาพ
x-i18n:
    generated_at: "2026-04-30T10:20:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2237ad82279d8daf28d70a550727a5900d7a820a0c9ba09de8b7bae5b6575401
    source_path: tools/image-generation.md
    workflow: 16
---

เครื่องมือ `image_generate` ช่วยให้เอเจนต์สร้างและแก้ไขภาพโดยใช้ผู้ให้บริการที่คุณ
กำหนดค่าไว้ ภาพที่สร้างขึ้นจะถูกส่งเป็นไฟล์แนบสื่อในคำตอบของเอเจนต์โดยอัตโนมัติ

<Note>
เครื่องมือนี้จะแสดงเมื่อมีผู้ให้บริการสร้างภาพอย่างน้อยหนึ่งรายที่พร้อมใช้งานเท่านั้น
หากคุณไม่เห็น `image_generate` ในเครื่องมือของเอเจนต์ ให้กำหนดค่า
`agents.defaults.imageGenerationModel`, ตั้งค่าคีย์ API ของผู้ให้บริการ
หรือลงชื่อเข้าใช้ด้วย OpenAI Codex OAuth
</Note>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="กำหนดค่าการยืนยันตัวตน">
    ตั้งค่าคีย์ API สำหรับผู้ให้บริการอย่างน้อยหนึ่งราย (เช่น `OPENAI_API_KEY`,
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

    Codex OAuth ใช้การอ้างอิงโมเดล `openai/gpt-image-2` เดียวกัน เมื่อมีการกำหนดค่า
    โปรไฟล์ OAuth `openai-codex` แล้ว OpenClaw จะส่งคำขอภาพผ่านโปรไฟล์ OAuth นั้น
    แทนการลองใช้ `OPENAI_API_KEY` ก่อน การกำหนดค่า `models.providers.openai`
    แบบชัดเจน (คีย์ API, URL ฐานแบบกำหนดเอง/Azure) จะเปลี่ยนกลับไปใช้เส้นทาง
    OpenAI Images API โดยตรง

  </Step>
  <Step title="สั่งเอเจนต์">
    _"สร้างภาพมาสคอตหุ่นยนต์ที่เป็นมิตร"_

    เอเจนต์จะเรียก `image_generate` โดยอัตโนมัติ ไม่จำเป็นต้องเพิ่มในรายการอนุญาตเครื่องมือ
    โดยจะเปิดใช้งานตามค่าเริ่มต้นเมื่อมีผู้ให้บริการที่พร้อมใช้งาน

  </Step>
</Steps>

<Warning>
สำหรับปลายทาง LAN ที่เข้ากันได้กับ OpenAI เช่น LocalAI ให้คงค่า
`models.providers.openai.baseUrl` แบบกำหนดเองไว้ และเลือกใช้อย่างชัดเจนด้วย
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ปลายทางภาพแบบส่วนตัวและภายใน
จะยังคงถูกบล็อกตามค่าเริ่มต้น
</Warning>

## เส้นทางทั่วไป

| เป้าหมาย                                             | การอ้างอิงโมเดล                                    | การยืนยันตัวตน                         |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| การสร้างภาพด้วย OpenAI พร้อมการคิดค่าบริการผ่าน API | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| การสร้างภาพด้วย OpenAI พร้อมการยืนยันตัวตนแบบสมัครสมาชิก Codex | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| PNG/WebP พื้นหลังโปร่งใสของ OpenAI                  | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` หรือ OpenAI Codex OAuth |
| การสร้างภาพด้วย DeepInfra                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| การสร้างภาพด้วย OpenRouter                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| การสร้างภาพด้วย LiteLLM                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| การสร้างภาพด้วย Google Gemini                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`   |

เครื่องมือ `image_generate` เดียวกันจัดการทั้งการแปลงข้อความเป็นภาพและการแก้ไข
ภาพอ้างอิง ใช้ `image` สำหรับภาพอ้างอิงหนึ่งภาพ หรือ `images` สำหรับภาพอ้างอิงหลายภาพ
คำใบ้เอาต์พุตที่ผู้ให้บริการรองรับ เช่น `quality`, `outputFormat` และ
`background` จะถูกส่งต่อเมื่อพร้อมใช้งาน และจะถูกรายงานว่าเพิกเฉยเมื่อผู้ให้บริการ
ไม่รองรับ การรองรับพื้นหลังโปร่งใสที่รวมมาให้เฉพาะ OpenAI เท่านั้น ผู้ให้บริการรายอื่น
อาจยังคงรักษาค่าอัลฟาของ PNG ได้ หากแบ็กเอนด์ของตนส่งออกมา

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ | โมเดลเริ่มต้น                          | การรองรับการแก้ไข                 | การยืนยันตัวตน                                      |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | ใช่ (1 ภาพ, กำหนดค่าด้วยเวิร์กโฟลว์) | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` สำหรับคลาวด์ |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | ใช่ (1 ภาพ)                       | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | ใช่                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | ใช่                                | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | ใช่ (สูงสุด 5 ภาพอินพุต)          | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | ใช่ (การอ้างอิงหัวเรื่อง)         | `MINIMAX_API_KEY` หรือ MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | ใช่ (สูงสุด 4 ภาพ)                | `OPENAI_API_KEY` หรือ OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | ใช่ (สูงสุด 5 ภาพอินพุต)          | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | ไม่                                | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | ใช่ (สูงสุด 5 ภาพ)                | `XAI_API_KEY`                                         |

ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการและโมเดลที่พร้อมใช้งานขณะรันไทม์:

```text
/tool image_generate action=list
```

## ความสามารถของผู้ให้บริการ

| ความสามารถ            | ComfyUI            | DeepInfra | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| สร้าง (จำนวนสูงสุด)  | กำหนดโดยเวิร์กโฟลว์ | 4         | 4                 | 4              | 9                     | 4              | 1     | 4              |
| แก้ไข / อ้างอิง      | 1 ภาพ (เวิร์กโฟลว์) | 1 ภาพ    | 1 ภาพ            | สูงสุด 5 ภาพ   | 1 ภาพ (อ้างอิงหัวเรื่อง) | สูงสุด 5 ภาพ | —     | สูงสุด 5 ภาพ |
| การควบคุมขนาด        | —                  | ✓         | ✓                 | ✓              | —                     | สูงสุด 4K      | —     | —              |
| อัตราส่วนภาพ          | —                  | —         | ✓ (สร้างเท่านั้น) | ✓              | ✓                     | —              | —     | ✓              |
| ความละเอียด (1K/2K/4K) | —                  | —         | ✓                 | ✓              | —                     | —              | —     | 1K, 2K         |

## พารามิเตอร์ของเครื่องมือ

<ParamField path="prompt" type="string" required>
  พรอมป์สำหรับการสร้างภาพ จำเป็นสำหรับ `action: "generate"`
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  ใช้ `"list"` เพื่อตรวจสอบผู้ให้บริการและโมเดลที่พร้อมใช้งานขณะรันไทม์
</ParamField>
<ParamField path="model" type="string">
  แทนที่ผู้ให้บริการ/โมเดล (เช่น `openai/gpt-image-2`) ใช้
  `openai/gpt-image-1.5` สำหรับพื้นหลังโปร่งใสของ OpenAI
</ParamField>
<ParamField path="image" type="string">
  เส้นทางหรือ URL ของภาพอ้างอิงเดียวสำหรับโหมดแก้ไข
</ParamField>
<ParamField path="images" type="string[]">
  ภาพอ้างอิงหลายภาพสำหรับโหมดแก้ไข (สูงสุด 5 ภาพในผู้ให้บริการที่รองรับ)
</ParamField>
<ParamField path="size" type="string">
  คำใบ้ขนาด: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`
</ParamField>
<ParamField path="aspectRatio" type="string">
  อัตราส่วนภาพ: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>คำใบ้ความละเอียด</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  คำใบ้คุณภาพเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  คำใบ้รูปแบบเอาต์พุตเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  คำใบ้พื้นหลังเมื่อผู้ให้บริการรองรับ ใช้ `transparent` กับ
  `outputFormat: "png"` หรือ `"webp"` สำหรับผู้ให้บริการที่รองรับความโปร่งใส
</ParamField>
<ParamField path="count" type="number">จำนวนภาพที่จะสร้าง (1–4)</ParamField>
<ParamField path="timeoutMs" type="number">ระยะหมดเวลาคำขอของผู้ให้บริการในหน่วยมิลลิวินาที (ไม่บังคับ)</ParamField>
<ParamField path="filename" type="string">คำใบ้ชื่อไฟล์เอาต์พุต</ParamField>
<ParamField path="openai" type="object">
  คำใบ้เฉพาะ OpenAI: `background`, `moderation`, `outputCompression` และ `user`
</ParamField>

<Note>
ผู้ให้บริการบางรายไม่ได้รองรับทุกพารามิเตอร์ เมื่อผู้ให้บริการสำรองรองรับตัวเลือกเรขาคณิต
ที่ใกล้เคียงแทนตัวเลือกที่ขออย่างตรงตัว OpenClaw จะจับคู่ใหม่เป็นขนาด อัตราส่วนภาพ
หรือความละเอียดที่รองรับซึ่งใกล้ที่สุดก่อนส่งคำขอ คำใบ้เอาต์พุตที่ไม่รองรับจะถูกละทิ้ง
สำหรับผู้ให้บริการที่ไม่ได้ประกาศการรองรับ และจะถูกรายงานในผลลัพธ์ของเครื่องมือ
ผลลัพธ์ของเครื่องมือจะรายงานการตั้งค่าที่นำไปใช้ `details.normalization` จะบันทึก
การแปลค่าจากที่ขอเป็นค่าที่นำไปใช้
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

OpenClaw จะลองผู้ให้บริการตามลำดับนี้:

1. **พารามิเตอร์ `model`** จากการเรียกเครื่องมือ (หากเอเจนต์ระบุไว้)
2. **`imageGenerationModel.primary`** จากการกำหนดค่า
3. **`imageGenerationModel.fallbacks`** ตามลำดับ
4. **การตรวจจับอัตโนมัติ** — เฉพาะค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตน:
   - ผู้ให้บริการเริ่มต้นปัจจุบันก่อน;
   - ผู้ให้บริการสร้างภาพที่ลงทะเบียนไว้ที่เหลือ ตามลำดับ ID ผู้ให้บริการ

หากผู้ให้บริการล้มเหลว (ข้อผิดพลาดการยืนยันตัวตน, ขีดจำกัดอัตรา ฯลฯ) ระบบจะลอง
ตัวเลือกที่กำหนดค่าไว้ถัดไปโดยอัตโนมัติ หากทั้งหมดล้มเหลว ข้อผิดพลาดจะมีรายละเอียด
จากแต่ละความพยายาม

<AccordionGroup>
  <Accordion title="การแทนที่โมเดลต่อการเรียกต้องตรงตัว">
    การแทนที่ `model` ต่อการเรียกจะลองเฉพาะผู้ให้บริการ/โมเดลนั้น และจะไม่ดำเนินต่อไปยัง
    ผู้ให้บริการหลัก/สำรองที่กำหนดค่าไว้ หรือผู้ให้บริการที่ตรวจพบอัตโนมัติ
  </Accordion>
  <Accordion title="การตรวจจับอัตโนมัติรับรู้การยืนยันตัวตน">
    ค่าเริ่มต้นของผู้ให้บริการจะเข้าสู่รายการตัวเลือกต่อเมื่อ OpenClaw สามารถ
    ยืนยันตัวตนกับผู้ให้บริการนั้นได้จริง ตั้งค่า
    `agents.defaults.mediaGenerationAutoProviderFallback: false` เพื่อใช้เฉพาะรายการ
    `model`, `primary` และ `fallbacks` ที่ระบุอย่างชัดเจนเท่านั้น
  </Accordion>
  <Accordion title="ระยะหมดเวลา">
    ตั้งค่า `agents.defaults.imageGenerationModel.timeoutMs` สำหรับแบ็กเอนด์ภาพที่ทำงานช้า
    พารามิเตอร์เครื่องมือ `timeoutMs` ต่อการเรียกจะแทนที่ค่าเริ่มต้นที่กำหนดค่าไว้
  </Accordion>
  <Accordion title="ตรวจสอบขณะรันไทม์">
    ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการที่ลงทะเบียนอยู่ในปัจจุบัน
    โมเดลเริ่มต้นของแต่ละราย และคำใบ้ env-var สำหรับการยืนยันตัวตน
  </Accordion>
</AccordionGroup>

### การแก้ไขภาพ

OpenAI, OpenRouter, Google, DeepInfra, fal, MiniMax, ComfyUI และ xAI รองรับการแก้ไข
ภาพอ้างอิง ส่งเส้นทางภาพอ้างอิงหรือ URL:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google และ xAI รองรับภาพอ้างอิงสูงสุด 5 ภาพผ่านพารามิเตอร์
`images` ส่วน fal, MiniMax และ ComfyUI รองรับ 1 ภาพ

## เจาะลึกผู้ให้บริการ

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (และ gpt-image-1.5)">
    การสร้างภาพของ OpenAI มีค่าเริ่มต้นเป็น `openai/gpt-image-2` หากมีการกำหนดค่าโปรไฟล์ OAuth ของ
    `openai-codex` ไว้ OpenClaw จะใช้โปรไฟล์ OAuth เดียวกันกับที่โมเดลแชตแบบสมัครสมาชิกของ Codex ใช้ซ้ำ และส่งคำขอ
    ภาพผ่านแบ็กเอนด์ Codex Responses URL ฐานแบบเดิมของ Codex
    เช่น `https://chatgpt.com/backend-api` จะถูกปรับให้อยู่ในรูปมาตรฐานเป็น
    `https://chatgpt.com/backend-api/codex` สำหรับคำขอภาพ OpenClaw
    จะ**ไม่**ถอยกลับไปใช้ `OPENAI_API_KEY` แบบเงียบ ๆ สำหรับคำขอนั้น —
    หากต้องการบังคับให้ส่งผ่าน OpenAI Images API โดยตรง ให้กำหนดค่า
    `models.providers.openai` อย่างชัดเจนด้วยคีย์ API, URL ฐานแบบกำหนดเอง,
    หรือปลายทาง Azure

    ยังสามารถเลือกโมเดล `openai/gpt-image-1.5`, `openai/gpt-image-1`, และ
    `openai/gpt-image-1-mini` ได้อย่างชัดเจน ใช้
    `gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP แบบพื้นหลังโปร่งใส; API
    `gpt-image-2` ปัจจุบันปฏิเสธ `background: "transparent"`

    `gpt-image-2` รองรับทั้งการสร้างภาพจากข้อความและ
    การแก้ไขด้วยภาพอ้างอิงผ่านเครื่องมือ `image_generate` เดียวกัน
    OpenClaw ส่งต่อ `prompt`, `count`, `size`, `quality`, `outputFormat`,
    และภาพอ้างอิงไปยัง OpenAI โดย OpenAI จะ**ไม่ได้**รับ
    `aspectRatio` หรือ `resolution` โดยตรง; เมื่อเป็นไปได้ OpenClaw จะแมป
    ค่าเหล่านั้นเป็น `size` ที่รองรับ ไม่เช่นนั้นเครื่องมือจะรายงานค่าเหล่านั้นเป็น
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

    `openai.background` รับค่า `transparent`, `opaque`, หรือ `auto`;
    เอาต์พุตแบบโปร่งใสต้องใช้ `outputFormat` เป็น `png` หรือ `webp` และ
    โมเดลภาพของ OpenAI ที่รองรับความโปร่งใส OpenClaw ส่งคำขอพื้นหลังโปร่งใสของ
    `gpt-image-2` ค่าเริ่มต้นไปยัง `gpt-image-1.5`
    `openai.outputCompression` ใช้กับเอาต์พุต JPEG/WebP

    คำใบ้ `background` ระดับบนสุดเป็นกลางต่อผู้ให้บริการ และปัจจุบันแมป
    ไปยังฟิลด์คำขอ `background` เดียวกันของ OpenAI เมื่อเลือกผู้ให้บริการ OpenAI
    ผู้ให้บริการที่ไม่ได้ประกาศการรองรับพื้นหลังจะส่งคืนค่านี้ใน
    `ignoredOverrides` แทนที่จะรับพารามิเตอร์ที่ไม่รองรับ

    หากต้องการส่งการสร้างภาพของ OpenAI ผ่านดีพลอยเมนต์ Azure OpenAI
    แทน `api.openai.com` โปรดดู
    [ปลายทาง Azure OpenAI](/th/providers/openai#azure-openai-endpoints)

  </Accordion>
  <Accordion title="โมเดลภาพของ OpenRouter">
    การสร้างภาพของ OpenRouter ใช้ `OPENROUTER_API_KEY` เดียวกันและ
    ส่งผ่าน API ภาพแบบ chat completions ของ OpenRouter เลือก
    โมเดลภาพของ OpenRouter ด้วยคำนำหน้า `openrouter/`:

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

    OpenClaw ส่งต่อ `prompt`, `count`, ภาพอ้างอิง และ
    คำใบ้ `aspectRatio` / `resolution` ที่เข้ากันได้กับ Gemini ไปยัง OpenRouter
    ทางลัดโมเดลภาพของ OpenRouter แบบในตัวในปัจจุบันประกอบด้วย
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview`, และ `openai/gpt-5.4-image-2` ใช้
    `action: "list"` เพื่อดูว่า Plugin ที่คุณกำหนดค่าไว้เปิดเผยอะไรบ้าง

  </Accordion>
  <Accordion title="การยืนยันตัวตนคู่ของ MiniMax">
    การสร้างภาพของ MiniMax พร้อมใช้งานผ่านทั้งสองเส้นทางยืนยันตัวตน MiniMax
    ที่รวมมาให้:

    - `minimax/image-01` สำหรับการตั้งค่าด้วยคีย์ API
    - `minimax-portal/image-01` สำหรับการตั้งค่าด้วย OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    ผู้ให้บริการ xAI ที่รวมมาให้ใช้ `/v1/images/generations` สำหรับคำขอที่มีเฉพาะพรอมป์
    และใช้ `/v1/images/edits` เมื่อมี `image` หรือ `images`

    - โมเดล: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - จำนวน: สูงสุด 4
    - ภาพอ้างอิง: `image` หนึ่งภาพ หรือ `images` สูงสุดห้าภาพ
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - ความละเอียด: `1K`, `2K`
    - เอาต์พุต: ส่งคืนเป็นไฟล์แนบภาพที่ OpenClaw จัดการ

    OpenClaw ตั้งใจไม่เปิดเผย `quality`, `mask`,
    `user` หรืออัตราส่วนภาพเพิ่มเติมเฉพาะของ xAI จนกว่าการควบคุมเหล่านั้นจะมีอยู่
    ในสัญญา `image_generate` แบบใช้ร่วมกันข้ามผู้ให้บริการ

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
  <Tab title="สร้าง (สี่เหลี่ยมจัตุรัสสองภาพ)">
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
</Tabs>

แฟล็ก `--output-format` และ `--background` เดียวกันพร้อมใช้งานบน
`openclaw infer image edit`; `--openai-background` ยังคงเป็น
นามแฝงเฉพาะของ OpenAI ผู้ให้บริการที่รวมมาให้นอกเหนือจาก OpenAI ยังไม่ได้ประกาศ
การควบคุมพื้นหลังอย่างชัดเจนในวันนี้ ดังนั้น `background: "transparent"` จึงถูกรายงาน
ว่าถูกละเว้นสำหรับผู้ให้บริการเหล่านั้น

## ที่เกี่ยวข้อง

- [ภาพรวมเครื่องมือ](/th/tools) — เครื่องมือเอเจนต์ทั้งหมดที่พร้อมใช้งาน
- [ComfyUI](/th/providers/comfy) — การตั้งค่าเวิร์กโฟลว์ ComfyUI ในเครื่องและ Comfy Cloud
- [fal](/th/providers/fal) — การตั้งค่าผู้ให้บริการภาพและวิดีโอของ fal
- [Google (Gemini)](/th/providers/google) — การตั้งค่าผู้ให้บริการภาพ Gemini
- [MiniMax](/th/providers/minimax) — การตั้งค่าผู้ให้บริการภาพ MiniMax
- [OpenAI](/th/providers/openai) — การตั้งค่าผู้ให้บริการ OpenAI Images
- [Vydra](/th/providers/vydra) — การตั้งค่าภาพ วิดีโอ และเสียงพูดของ Vydra
- [xAI](/th/providers/xai) — การตั้งค่าภาพ วิดีโอ การค้นหา การรันโค้ด และ TTS ของ Grok
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — การกำหนดค่า `imageGenerationModel`
- [โมเดล](/th/concepts/models) — การกำหนดค่าโมเดลและการสลับเมื่อเกิดข้อขัดข้อง
