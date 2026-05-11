---
read_when:
    - การสร้างหรือแก้ไขภาพผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลการสร้างภาพ
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ image_generate
sidebarTitle: Image generation
summary: สร้างและแก้ไขภาพผ่าน image_generate บน OpenAI, Google, fal, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: การสร้างภาพ
x-i18n:
    generated_at: "2026-05-11T20:39:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 10c15b48a673ef673e3cf7c4f4950a08961d64a3fd21eff9d1944ec6d4b9c410
    source_path: tools/image-generation.md
    workflow: 16
---

เครื่องมือ `image_generate` ช่วยให้เอเจนต์สร้างและแก้ไขรูปภาพโดยใช้ผู้ให้บริการ
ที่คุณกำหนดค่าไว้ รูปภาพที่สร้างขึ้นจะถูกส่งโดยอัตโนมัติเป็นไฟล์แนบสื่อ
ในคำตอบของเอเจนต์

<Note>
เครื่องมือนี้จะปรากฏเฉพาะเมื่อมีผู้ให้บริการสร้างรูปภาพอย่างน้อยหนึ่งราย
พร้อมใช้งาน หากคุณไม่เห็น `image_generate` ในเครื่องมือของเอเจนต์
ให้กำหนดค่า `agents.defaults.imageGenerationModel` ตั้งค่าคีย์ API ของผู้ให้บริการ
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

    Codex OAuth ใช้อ้างอิงโมเดล `openai/gpt-image-2` เดียวกัน เมื่อกำหนดค่า
    โปรไฟล์ OAuth `openai-codex` แล้ว OpenClaw จะกำหนดเส้นทางคำขอรูปภาพ
    ผ่านโปรไฟล์ OAuth นั้นแทนที่จะลองใช้ `OPENAI_API_KEY` ก่อน
    การกำหนดค่า `models.providers.openai` อย่างชัดเจน (คีย์ API,
    URL ฐานแบบกำหนดเอง/Azure) จะเลือกกลับไปใช้เส้นทาง OpenAI Images API
    โดยตรง

  </Step>
  <Step title="ถามเอเจนต์">
    _"สร้างรูปภาพมาสคอตหุ่นยนต์ที่เป็นมิตร"_

    เอเจนต์จะเรียก `image_generate` โดยอัตโนมัติ ไม่จำเป็นต้องเพิ่มเครื่องมือ
    ลงใน allow-list เพราะจะเปิดใช้งานเป็นค่าเริ่มต้นเมื่อมีผู้ให้บริการพร้อมใช้งาน

  </Step>
</Steps>

<Warning>
สำหรับเอนด์พอยต์ LAN ที่เข้ากันได้กับ OpenAI เช่น LocalAI ให้คงค่า
`models.providers.openai.baseUrl` แบบกำหนดเองไว้ และเลือกใช้อย่างชัดเจนด้วย
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เอนด์พอยต์รูปภาพ
ส่วนตัวและภายในยังคงถูกบล็อกเป็นค่าเริ่มต้น
</Warning>

## เส้นทางทั่วไป

| เป้าหมาย                                             | อ้างอิงโมเดล                                     | การยืนยันตัวตน                         |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| การสร้างรูปภาพด้วย OpenAI โดยเรียกเก็บเงินผ่าน API   | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| การสร้างรูปภาพด้วย OpenAI โดยใช้การยืนยันตัวตนจากการสมัครสมาชิก Codex | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| PNG/WebP พื้นหลังโปร่งใสของ OpenAI                  | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` หรือ OpenAI Codex OAuth |
| การสร้างรูปภาพด้วย DeepInfra                         | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| การสร้างรูปภาพด้วย OpenRouter                        | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| การสร้างรูปภาพด้วย LiteLLM                           | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| การสร้างรูปภาพด้วย Google Gemini                     | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` |

เครื่องมือ `image_generate` เดียวกันรองรับทั้งการสร้างรูปภาพจากข้อความและ
การแก้ไขรูปภาพอ้างอิง ใช้ `image` สำหรับรูปภาพอ้างอิงหนึ่งรูป หรือ `images`
สำหรับรูปภาพอ้างอิงหลายรูป คำแนะนำเอาต์พุตที่ผู้ให้บริการรองรับ เช่น
`quality`, `outputFormat` และ `background` จะถูกส่งต่อเมื่อพร้อมใช้งาน
และจะถูกรายงานว่าถูกละเว้นเมื่อผู้ให้บริการไม่รองรับ การรองรับพื้นหลังโปร่งใส
ที่มาพร้อมระบบเป็นแบบเฉพาะของ OpenAI ผู้ให้บริการรายอื่นอาจยังคงรักษาอัลฟา
ของ PNG ไว้ได้หากแบ็กเอนด์ของตนส่งออกมา

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ | โมเดลเริ่มต้น                           | การรองรับการแก้ไข                  | การยืนยันตัวตน                                      |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | ใช่ (1 รูปภาพ, กำหนดค่าโดย workflow) | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` สำหรับคลาวด์ |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | ใช่ (1 รูปภาพ)                    | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | ใช่ (ขีดจำกัดเฉพาะโมเดล)          | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | ใช่                               | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                |
| LiteLLM    | `gpt-image-2`                           | ใช่ (รูปภาพอินพุตสูงสุด 5 รูป)   | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | ใช่ (รูปภาพอ้างอิงหัวเรื่อง)      | `MINIMAX_API_KEY` หรือ MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | ใช่ (สูงสุด 4 รูปภาพ)             | `OPENAI_API_KEY` หรือ OpenAI Codex OAuth              |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | ใช่ (รูปภาพอินพุตสูงสุด 5 รูป)   | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | ไม่ใช่                            | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | ใช่ (สูงสุด 5 รูปภาพ)             | `XAI_API_KEY`                                         |

ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการและโมเดลที่พร้อมใช้งานในขณะรันไทม์:

```text
/tool image_generate action=list
```

## ความสามารถของผู้ให้บริการ

| ความสามารถ            | ComfyUI            | DeepInfra | fal                       | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ------------------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| สร้าง (จำนวนสูงสุด)   | กำหนดโดย workflow  | 4         | 4                         | 4              | 9                     | 4              | 1     | 4              |
| แก้ไข / อ้างอิง       | 1 รูปภาพ (workflow) | 1 รูปภาพ | Flux: 1; GPT: 10; NB2: 14 | สูงสุด 5 รูปภาพ | 1 รูปภาพ (อ้างอิงหัวเรื่อง) | สูงสุด 5 รูปภาพ | -     | สูงสุด 5 รูปภาพ |
| การควบคุมขนาด         | -                  | ✓         | ✓                         | ✓              | -                     | สูงสุด 4K      | -     | -              |
| อัตราส่วนภาพ          | -                  | -         | ✓                         | ✓              | ✓                     | -              | -     | ✓              |
| ความละเอียด (1K/2K/4K) | -                  | -         | ✓                         | ✓              | -                     | -              | -     | 1K, 2K         |

## พารามิเตอร์ของเครื่องมือ

<ParamField path="prompt" type="string" required>
  พรอมป์สำหรับสร้างรูปภาพ จำเป็นสำหรับ `action: "generate"`
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  ใช้ `"list"` เพื่อตรวจสอบผู้ให้บริการและโมเดลที่พร้อมใช้งานในขณะรันไทม์
</ParamField>
<ParamField path="model" type="string">
  การแทนที่ผู้ให้บริการ/โมเดล (เช่น `openai/gpt-image-2`) ใช้
  `openai/gpt-image-1.5` สำหรับพื้นหลัง OpenAI แบบโปร่งใส
</ParamField>
<ParamField path="image" type="string">
  เส้นทางหรือ URL ของรูปภาพอ้างอิงหนึ่งรูปสำหรับโหมดแก้ไข
</ParamField>
<ParamField path="images" type="string[]">
  รูปภาพอ้างอิงหลายรูปสำหรับโหมดแก้ไข (สูงสุด 5 รูปกับผู้ให้บริการที่รองรับ)
</ParamField>
<ParamField path="size" type="string">
  คำแนะนำขนาด: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`
</ParamField>
<ParamField path="aspectRatio" type="string">
  อัตราส่วนภาพ: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>คำแนะนำความละเอียด</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  คำแนะนำคุณภาพเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  คำแนะนำรูปแบบเอาต์พุตเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  คำแนะนำพื้นหลังเมื่อผู้ให้บริการรองรับ ใช้ `transparent` กับ
  `outputFormat: "png"` หรือ `"webp"` สำหรับผู้ให้บริการที่รองรับความโปร่งใส
</ParamField>
<ParamField path="count" type="number">จำนวนรูปภาพที่จะสร้าง (1-4)</ParamField>
<ParamField path="timeoutMs" type="number">
  ระยะหมดเวลาคำขอผู้ให้บริการแบบไม่บังคับในหน่วยมิลลิวินาที เมื่อ Codex เรียก
  `image_generate` ผ่านเครื่องมือแบบไดนามิก ค่ารายการเรียกนี้ยังคงแทนที่
  ค่าเริ่มต้นที่กำหนดค่าไว้ และถูกจำกัดไว้ที่ 600000 ms
</ParamField>
<ParamField path="filename" type="string">คำแนะนำชื่อไฟล์เอาต์พุต</ParamField>
<ParamField path="openai" type="object">
  คำแนะนำเฉพาะ OpenAI: `background`, `moderation`, `outputCompression` และ `user`
</ParamField>

<Note>
ผู้ให้บริการบางรายไม่ได้รองรับพารามิเตอร์ทั้งหมด เมื่อผู้ให้บริการสำรองรองรับ
ตัวเลือกเรขาคณิตที่ใกล้เคียงแทนตัวเลือกที่ขออย่างแม่นยำ OpenClaw จะรีแมปเป็น
ขนาด อัตราส่วนภาพ หรือความละเอียดที่รองรับซึ่งใกล้เคียงที่สุดก่อนส่งคำขอ
คำแนะนำเอาต์พุตที่ไม่รองรับจะถูกตัดทิ้งสำหรับผู้ให้บริการที่ไม่ได้ประกาศว่า
รองรับ และจะถูกรายงานในผลลัพธ์ของเครื่องมือ ผลลัพธ์ของเครื่องมือจะรายงาน
การตั้งค่าที่นำไปใช้แล้ว `details.normalization` จะบันทึกการแปลค่าจาก
ที่ร้องขอไปเป็นค่าที่นำไปใช้
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

OpenClaw จะลองใช้ผู้ให้บริการตามลำดับนี้:

1. **พารามิเตอร์ `model`** จากการเรียกเครื่องมือ (หากเอเจนต์ระบุไว้)
2. **`imageGenerationModel.primary`** จาก config
3. **`imageGenerationModel.fallbacks`** ตามลำดับ
4. **การตรวจหาอัตโนมัติ** - เฉพาะค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับ:
   - ผู้ให้บริการเริ่มต้นปัจจุบันก่อน;
   - ผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id

หากผู้ให้บริการล้มเหลว (ข้อผิดพลาดการยืนยันตัวตน, เกินขีดจำกัดอัตรา ฯลฯ)
ตัวเลือกที่กำหนดค่าไว้ถัดไปจะถูกลองโดยอัตโนมัติ หากทั้งหมดล้มเหลว
ข้อผิดพลาดจะรวมรายละเอียดจากแต่ละความพยายาม

<AccordionGroup>
  <Accordion title="การแทนที่โมเดลรายครั้งเป็นแบบแน่นอน">
    การแทนที่ `model` รายครั้งจะลองเฉพาะผู้ให้บริการ/โมเดลนั้นเท่านั้น และ
    จะไม่ไปต่อยัง primary/fallback ที่กำหนดค่าไว้หรือผู้ให้บริการที่ตรวจพบอัตโนมัติ
  </Accordion>
  <Accordion title="การตรวจหาอัตโนมัติรับรู้การยืนยันตัวตน">
    ค่าเริ่มต้นของผู้ให้บริการจะเข้าสู่รายการตัวเลือกก็ต่อเมื่อ OpenClaw สามารถ
    ยืนยันตัวตนผู้ให้บริการนั้นได้จริง ตั้งค่า
    `agents.defaults.mediaGenerationAutoProviderFallback: false` เพื่อใช้เฉพาะ
    รายการ `model`, `primary` และ `fallbacks` ที่ระบุอย่างชัดเจนเท่านั้น
  </Accordion>
  <Accordion title="ระยะหมดเวลา">
    ตั้งค่า `agents.defaults.imageGenerationModel.timeoutMs` สำหรับแบ็กเอนด์รูปภาพ
    ที่ทำงานช้า พารามิเตอร์เครื่องมือ `timeoutMs` รายครั้งจะแทนที่ค่าเริ่มต้น
    ที่กำหนดค่าไว้ การเรียกเครื่องมือแบบไดนามิกของ Codex จะเคารพงบประมาณ
    ระยะหมดเวลาเดียวกัน โดยถูกจำกัดด้วยค่าสูงสุดของสะพานเครื่องมือแบบไดนามิก
    ของ OpenClaw ที่ 600000 ms
  </Accordion>
  <Accordion title="ตรวจสอบในขณะรันไทม์">
    ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการที่ลงทะเบียนอยู่ในขณะนั้น
    โมเดลเริ่มต้นของแต่ละราย และคำแนะนำ env-var สำหรับการยืนยันตัวตน
  </Accordion>
</AccordionGroup>

### การแก้ไขรูปภาพ

OpenAI, OpenRouter, Google, DeepInfra, fal, MiniMax, ComfyUI และ xAI รองรับการแก้ไข
รูปภาพอ้างอิง ส่งเส้นทางหรือ URL ของรูปภาพอ้างอิง:

```text
"สร้างเวอร์ชันสีน้ำของภาพถ่ายนี้" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google และ xAI รองรับภาพอ้างอิงได้สูงสุด 5 ภาพผ่านพารามิเตอร์
`images` ส่วน fal รองรับภาพอ้างอิง 1 ภาพสำหรับ Flux image-to-image รองรับได้
สูงสุด 10 ภาพสำหรับการแก้ไข GPT Image 2 และสูงสุด 14 ภาพสำหรับการแก้ไข Nano Banana 2 MiniMax และ
ComfyUI รองรับ 1 ภาพ

## เจาะลึกผู้ให้บริการ

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (และ gpt-image-1.5)">
    การสร้างภาพของ OpenAI มีค่าเริ่มต้นเป็น `openai/gpt-image-2` หากมีการกำหนดค่า
    โปรไฟล์ OAuth ของ `openai-codex` ไว้ OpenClaw จะใช้โปรไฟล์
    OAuth เดียวกันกับที่โมเดลแชตแบบสมัครสมาชิกของ Codex ใช้ซ้ำ และส่ง
    คำขอภาพผ่านแบ็กเอนด์ Codex Responses URL ฐานของ Codex แบบเดิม
    เช่น `https://chatgpt.com/backend-api` จะถูกทำให้เป็นรูปแบบมาตรฐานเป็น
    `https://chatgpt.com/backend-api/codex` สำหรับคำขอภาพ OpenClaw
    **จะไม่** fallback ไปใช้ `OPENAI_API_KEY` สำหรับคำขอนั้นแบบเงียบ ๆ -
    หากต้องการบังคับให้ส่งผ่าน OpenAI Images API โดยตรง ให้กำหนดค่า
    `models.providers.openai` อย่างชัดเจนด้วยคีย์ API, URL ฐานแบบกำหนดเอง
    หรือ Azure endpoint

    ยังสามารถเลือกโมเดล `openai/gpt-image-1.5`, `openai/gpt-image-1` และ
    `openai/gpt-image-1-mini` อย่างชัดเจนได้ ใช้
    `gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP ที่มีพื้นหลังโปร่งใส; API
    `gpt-image-2` ปัจจุบันปฏิเสธ `background: "transparent"`

    `gpt-image-2` รองรับทั้งการสร้างภาพจากข้อความและ
    การแก้ไขภาพอ้างอิงผ่านเครื่องมือ `image_generate` เดียวกัน
    OpenClaw ส่งต่อ `prompt`, `count`, `size`, `quality`, `outputFormat`
    และภาพอ้างอิงไปยัง OpenAI OpenAI **ไม่ได้** รับ
    `aspectRatio` หรือ `resolution` โดยตรง; เมื่อเป็นไปได้ OpenClaw จะแปลง
    ค่าเหล่านั้นให้เป็น `size` ที่รองรับ มิฉะนั้นเครื่องมือจะรายงานค่าเหล่านั้นเป็น
    override ที่ถูกละเว้น

    ตัวเลือกเฉพาะ OpenAI อยู่ใต้ object `openai`:

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

    `openai.background` รับค่า `transparent`, `opaque` หรือ `auto`;
    เอาต์พุตโปร่งใสต้องใช้ `outputFormat` เป็น `png` หรือ `webp` และต้องใช้
    โมเดลภาพ OpenAI ที่รองรับความโปร่งใส OpenClaw จะส่งคำขอพื้นหลังโปร่งใสของ
    `gpt-image-2` ค่าเริ่มต้นไปยัง `gpt-image-1.5`
    `openai.outputCompression` ใช้กับเอาต์พุต JPEG/WebP

    คำใบ้ `background` ระดับบนสุดเป็นแบบเป็นกลางต่อผู้ให้บริการ และขณะนี้จะแมป
    ไปยังฟิลด์คำขอ `background` เดียวกันของ OpenAI เมื่อเลือกผู้ให้บริการ OpenAI
    ผู้ให้บริการที่ไม่ได้ประกาศการรองรับพื้นหลังจะส่งค่าดังกล่าวคืนใน
    `ignoredOverrides` แทนการรับพารามิเตอร์ที่ไม่รองรับ

    หากต้องการส่งการสร้างภาพ OpenAI ผ่าน deployment ของ Azure OpenAI
    แทน `api.openai.com` ดู
    [Azure OpenAI endpoints](/th/providers/openai#azure-openai-endpoints)

  </Accordion>
  <Accordion title="โมเดลภาพ OpenRouter">
    การสร้างภาพของ OpenRouter ใช้ `OPENROUTER_API_KEY` เดียวกันและ
    ส่งผ่าน API ภาพของ chat completions ของ OpenRouter เลือก
    โมเดลภาพ OpenRouter ด้วย prefix `openrouter/`:

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
    ทางลัดโมเดลภาพ OpenRouter ที่มีมาให้ในปัจจุบันรวมถึง
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` และ `openai/gpt-5.4-image-2` ใช้
    `action: "list"` เพื่อดูว่า Plugin ที่คุณกำหนดค่าไว้เปิดเผยอะไรบ้าง

  </Accordion>
  <Accordion title="การยืนยันตัวตนคู่ของ MiniMax">
    การสร้างภาพของ MiniMax ใช้งานได้ผ่านเส้นทางการยืนยันตัวตน MiniMax
    ที่บันเดิลมาทั้งสองแบบ:

    - `minimax/image-01` สำหรับการตั้งค่าด้วยคีย์ API
    - `minimax-portal/image-01` สำหรับการตั้งค่าด้วย OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    ผู้ให้บริการ xAI ที่บันเดิลมาใช้ `/v1/images/generations` สำหรับคำขอ
    ที่มีเฉพาะพรอมต์ และใช้ `/v1/images/edits` เมื่อมี `image` หรือ `images`

    - โมเดล: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - จำนวน: สูงสุด 4
    - ภาพอ้างอิง: `image` หนึ่งภาพหรือ `images` สูงสุดห้าภาพ
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - ความละเอียด: `1K`, `2K`
    - เอาต์พุต: ส่งคืนเป็นไฟล์แนบภาพที่ OpenClaw จัดการ

    OpenClaw ตั้งใจไม่เปิดเผย `quality`, `mask`, `user` แบบเนทีฟของ xAI
    หรืออัตราส่วนภาพเพิ่มเติมที่มีเฉพาะเนทีฟ จนกว่าการควบคุมเหล่านั้นจะมีอยู่ใน
    สัญญา `image_generate` แบบข้ามผู้ให้บริการร่วมกัน

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
  <Tab title="แก้ไข (อ้างอิงหนึ่งภาพ)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="แก้ไข (อ้างอิงหลายภาพ)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

แฟล็ก `--output-format` และ `--background` เดียวกันมีให้ใช้งานบน
`openclaw infer image edit`; `--openai-background` ยังคงเป็น
alias เฉพาะ OpenAI ผู้ให้บริการที่บันเดิลมารายอื่นนอกเหนือจาก OpenAI ยังไม่ได้ประกาศ
การควบคุมพื้นหลังอย่างชัดเจนในปัจจุบัน ดังนั้น `background: "transparent"` จึงถูกรายงาน
ว่าถูกละเว้นสำหรับผู้ให้บริการเหล่านั้น

## ที่เกี่ยวข้อง

- [ภาพรวมเครื่องมือ](/th/tools) - เครื่องมือเอเจนต์ทั้งหมดที่มีให้ใช้งาน
- [ComfyUI](/th/providers/comfy) - การตั้งค่าเวิร์กโฟลว์ ComfyUI ในเครื่องและ Comfy Cloud
- [fal](/th/providers/fal) - การตั้งค่าผู้ให้บริการภาพและวิดีโอ fal
- [Google (Gemini)](/th/providers/google) - การตั้งค่าผู้ให้บริการภาพ Gemini
- [MiniMax](/th/providers/minimax) - การตั้งค่าผู้ให้บริการภาพ MiniMax
- [OpenAI](/th/providers/openai) - การตั้งค่าผู้ให้บริการ OpenAI Images
- [Vydra](/th/providers/vydra) - การตั้งค่าภาพ วิดีโอ และเสียงพูดของ Vydra
- [xAI](/th/providers/xai) - การตั้งค่าภาพ วิดีโอ การค้นหา การประมวลผลโค้ด และ TTS ของ Grok
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) - การกำหนดค่า `imageGenerationModel`
- [โมเดล](/th/concepts/models) - การกำหนดค่าโมเดลและ failover
