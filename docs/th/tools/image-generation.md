---
read_when:
    - การสร้างหรือแก้ไขรูปภาพผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลการสร้างภาพ
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ image_generate
sidebarTitle: Image generation
summary: สร้างและแก้ไขภาพผ่าน image_generate บน OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: การสร้างรูปภาพ
x-i18n:
    generated_at: "2026-06-27T18:29:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

เครื่องมือ `image_generate` ช่วยให้เอเจนต์สร้างและแก้ไขรูปภาพโดยใช้ผู้ให้บริการที่คุณกำหนดค่าไว้ ในเซสชันแชต การสร้างรูปภาพทำงานแบบอะซิงโครนัส: OpenClaw บันทึกงานเบื้องหลัง ส่งคืน id ของงานทันที และปลุกเอเจนต์เมื่อผู้ให้บริการทำงานเสร็จ เอเจนต์ที่ทำงานเสร็จจะทำตามโหมดการตอบกลับแบบมองเห็นได้ตามปกติของเซสชัน: ส่งการตอบกลับสุดท้ายอัตโนมัติเมื่อกำหนดค่าไว้ หรือใช้ `message(action="send")` เมื่อเซสชันต้องใช้เครื่องมือข้อความ หากเซสชันของผู้ขอไม่ทำงานหรือการปลุกที่ใช้งานอยู่ล้มเหลว และยังมีรูปภาพที่สร้างแล้วบางส่วนหายไปจากการตอบกลับเมื่อเสร็จสมบูรณ์ OpenClaw จะส่ง fallback โดยตรงแบบ idempotent ที่มีเฉพาะรูปภาพที่หายไป

<Note>
เครื่องมือจะแสดงเฉพาะเมื่อมีผู้ให้บริการสร้างรูปภาพอย่างน้อยหนึ่งรายที่พร้อมใช้งาน หากคุณไม่เห็น `image_generate` ในเครื่องมือของเอเจนต์ ให้กำหนดค่า `agents.defaults.imageGenerationModel` ตั้งค่าคีย์ API ของผู้ให้บริการ หรือลงชื่อเข้าใช้ด้วย OpenAI ChatGPT/Codex OAuth
</Note>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="กำหนดค่า auth">
    ตั้งค่าคีย์ API สำหรับผู้ให้บริการอย่างน้อยหนึ่งราย (เช่น `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) หรือลงชื่อเข้าใช้ด้วย OpenAI Codex OAuth
  </Step>
  <Step title="เลือกรุ่นเริ่มต้น (ไม่บังคับ)">
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

    ChatGPT/Codex OAuth ใช้ ref รุ่น `openai/gpt-image-2` เดียวกัน เมื่อมีการกำหนดค่าโปรไฟล์ OAuth ของ `openai` แล้ว OpenClaw จะ route คำขอรูปภาพผ่านโปรไฟล์ OAuth นั้นแทนการลองใช้ `OPENAI_API_KEY` ก่อน การกำหนดค่า `models.providers.openai` แบบชัดเจน (คีย์ API, URL ฐานแบบกำหนดเอง/Azure) จะเลือกกลับไปใช้ route OpenAI Images API โดยตรง

  </Step>
  <Step title="ถามเอเจนต์">
    _"สร้างรูปภาพมาสคอตหุ่นยนต์ที่เป็นมิตร"_

    เอเจนต์จะเรียก `image_generate` โดยอัตโนมัติ ไม่ต้องเพิ่มเครื่องมือนี้ใน allow-list เพราะเปิดใช้โดยค่าเริ่มต้นเมื่อมีผู้ให้บริการพร้อมใช้งาน เครื่องมือจะส่งคืน id ของงานเบื้องหลัง จากนั้นเอเจนต์ที่ทำงานเสร็จจะส่งไฟล์แนบที่สร้างแล้วผ่านเครื่องมือ `message` เมื่อพร้อม

  </Step>
</Steps>

<Warning>
สำหรับ endpoint LAN ที่เข้ากันได้กับ OpenAI เช่น LocalAI ให้คง `models.providers.openai.baseUrl` แบบกำหนดเองไว้ และเลือกใช้ด้วย `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` อย่างชัดเจน endpoint รูปภาพแบบส่วนตัวและภายในยังคงถูกบล็อกโดยค่าเริ่มต้น
</Warning>

## Route ทั่วไป

| เป้าหมาย                                                 | Model ref                                          | Auth                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| การสร้างรูปภาพด้วย OpenAI พร้อมการคิดค่าบริการผ่าน API             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| การสร้างรูปภาพด้วย OpenAI พร้อม auth การสมัครสมาชิก Codex | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| PNG/WebP พื้นหลังโปร่งใสด้วย OpenAI               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` หรือ OpenAI Codex OAuth |
| การสร้างรูปภาพด้วย DeepInfra                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| การสร้างภาพ fal Krea 2 แบบสื่ออารมณ์/กำกับสไตล์      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| การสร้างรูปภาพด้วย OpenRouter                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| การสร้างรูปภาพด้วย LiteLLM                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| การสร้างรูปภาพด้วย Microsoft Foundry MAI               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` หรือ Entra ID     |
| การสร้างรูปภาพด้วย Google Gemini                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`   |

เครื่องมือ `image_generate` เดียวกันรองรับทั้ง text-to-image และการแก้ไขด้วยรูปภาพอ้างอิง ใช้ `image` สำหรับรูปภาพอ้างอิงหนึ่งรูป หรือ `images` สำหรับรูปภาพอ้างอิงหลายรูป สำหรับรุ่น Krea 2 บน fal รูปภาพอ้างอิงเหล่านั้นจะถูกส่งเป็นการอ้างอิงสไตล์แทนอินพุตแก้ไข
คำใบ้เอาต์พุตที่ผู้ให้บริการรองรับ เช่น `quality`, `outputFormat` และ `background` จะถูกส่งต่อเมื่อพร้อมใช้งาน และถูกรายงานว่าถูกละเว้นเมื่อผู้ให้บริการไม่รองรับ การรองรับพื้นหลังโปร่งใสที่รวมมาให้เป็นฟีเจอร์เฉพาะ OpenAI ผู้ให้บริการรายอื่นยังอาจคง alpha ของ PNG ไว้ได้หาก backend ของตนปล่อยออกมา

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ          | รุ่นเริ่มต้น                           | รองรับการแก้ไข                       | Auth                                                  |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | ใช่ (1 รูปภาพ, กำหนดค่าด้วย workflow) | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` สำหรับ cloud    |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | ใช่ (1 รูปภาพ)                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | ใช่ (ขีดจำกัดเฉพาะรุ่น)        | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | ใช่                                | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | ใช่ (สูงสุด 5 รูปภาพอินพุต)         | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | ใช่ (เฉพาะรุ่น MAI-Image-2.5)    | `AZURE_OPENAI_API_KEY` หรือ Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | ใช่ (การอ้างอิง subject)            | `MINIMAX_API_KEY` หรือ MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | ใช่ (สูงสุด 4 รูปภาพ)               | `OPENAI_API_KEY` หรือ OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | ใช่ (สูงสุด 5 รูปภาพอินพุต)         | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | ไม่                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | ใช่ (สูงสุด 5 รูปภาพ)               | `XAI_API_KEY`                                         |

ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการและรุ่นที่พร้อมใช้งานขณะรันไทม์:

```text
/tool image_generate action=list
```

ใช้ `action: "status"` เพื่อตรวจสอบงานสร้างรูปภาพที่ใช้งานอยู่สำหรับเซสชันปัจจุบัน:

```text
/tool image_generate action=status
```

## ความสามารถของผู้ให้บริการ

| ความสามารถ            | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| สร้าง (จำนวนสูงสุด)  | กำหนดโดย workflow   | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| แก้ไข / อ้างอิง      | 1 รูปภาพ (workflow) | 1 รูปภาพ   | Flux: 1; GPT: 10; Krea style refs: 10; NB2: 14 | สูงสุด 5 รูปภาพ | 1 รูปภาพ           | 1 รูปภาพ (subject ref) | สูงสุด 5 รูปภาพ | -     | สูงสุด 5 รูปภาพ |
| ควบคุมขนาด          | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | สูงสุด 4K       | -     | -              |
| อัตราส่วนภาพ          | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| ความละเอียด (1K/2K/4K) | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## พารามิเตอร์ของเครื่องมือ

<ParamField path="prompt" type="string" required>
  พรอมป์สำหรับการสร้างรูปภาพ จำเป็นสำหรับ `action: "generate"`
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  ใช้ `"status"` เพื่อตรวจสอบงานของเซสชันที่ใช้งานอยู่ หรือ `"list"` เพื่อตรวจสอบผู้ให้บริการและรุ่นที่พร้อมใช้งานขณะรันไทม์
</ParamField>
<ParamField path="model" type="string">
  การแทนที่ผู้ให้บริการ/รุ่น (เช่น `openai/gpt-image-2`) ใช้ `openai/gpt-image-1.5` สำหรับพื้นหลัง OpenAI แบบโปร่งใส
</ParamField>
<ParamField path="image" type="string">
  พาธหรือ URL ของรูปภาพอ้างอิงเดียวสำหรับโหมดแก้ไข
</ParamField>
<ParamField path="images" type="string[]">
  รูปภาพอ้างอิงหลายรูปสำหรับโหมดแก้ไขหรือรุ่นที่ใช้ style-reference (สูงสุด 10 รูปผ่านเครื่องมือร่วม; ขีดจำกัดเฉพาะผู้ให้บริการยังคงมีผล)
</ParamField>
<ParamField path="size" type="string">
  คำใบ้ขนาด: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`
</ParamField>
<ParamField path="aspectRatio" type="string">
  อัตราส่วนภาพ: `1:1`, `2:3`, `3:2`, `2.35:1`, `3:4`, `4:3`, `4:5`,
  `5:4`, `9:16`, `16:9`, `21:9`, `4:1`, `1:4`, `8:1`, `1:8` ผู้ให้บริการจะตรวจสอบ subset เฉพาะรุ่นของตน
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>คำใบ้ความละเอียด</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  คำใบ้คุณภาพเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  คำใบ้รูปแบบเอาต์พุตเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  คำใบ้พื้นหลังเมื่อผู้ให้บริการรองรับ ใช้ `transparent` ร่วมกับ `outputFormat: "png"` หรือ `"webp"` สำหรับผู้ให้บริการที่รองรับความโปร่งใส
</ParamField>
<ParamField path="count" type="number">จำนวนรูปภาพที่จะสร้าง (1-4)</ParamField>
<ParamField path="timeoutMs" type="number">
  timeout คำขอผู้ให้บริการแบบไม่บังคับ หน่วยเป็นมิลลิวินาที เมื่อ Codex เรียก `image_generate` ผ่านเครื่องมือแบบ dynamic ค่ารายการเรียกนี้ยังคงแทนที่ค่าเริ่มต้นที่กำหนดค่าไว้ และถูกจำกัดสูงสุดที่ 600000 ms
</ParamField>
<ParamField path="filename" type="string">คำใบ้ชื่อไฟล์เอาต์พุต</ParamField>
<ParamField path="openai" type="object">
  คำใบ้เฉพาะ OpenAI: `background`, `moderation`, `outputCompression` และ `user`
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  การควบคุมความสร้างสรรค์ของ fal Krea 2 ค่าเริ่มต้นคือ `medium`
</ParamField>

<Note>
ผู้ให้บริการบางรายไม่ได้รองรับพารามิเตอร์ทั้งหมด เมื่อผู้ให้บริการ fallback รองรับตัวเลือกเรขาคณิตที่ใกล้เคียงแทนค่าที่ขออย่างแม่นยำ OpenClaw จะ remap เป็นขนาด อัตราส่วนภาพ หรือความละเอียดที่รองรับและใกล้ที่สุดก่อนส่ง คำใบ้เอาต์พุตที่ไม่รองรับจะถูกตัดออกสำหรับผู้ให้บริการที่ไม่ได้ประกาศว่ารองรับ และถูกรายงานในผลลัพธ์ของเครื่องมือ ผลลัพธ์ของเครื่องมือจะรายงานการตั้งค่าที่ใช้จริง; `details.normalization` บันทึกการแปลค่าที่ขอเป็นค่าที่ใช้จริง
</Note>

## การกำหนดค่า

### การเลือกรุ่น

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

1. **พารามิเตอร์ `model`** จากการเรียกใช้เครื่องมือ (หาก agent ระบุไว้)
2. **`imageGenerationModel.primary`** จาก config
3. **`imageGenerationModel.fallbacks`** ตามลำดับ
4. **การตรวจจับอัตโนมัติ** - ค่าเริ่มต้นของ provider ที่มี auth รองรับเท่านั้น:
   - provider เริ่มต้นปัจจุบันก่อน
   - provider สำหรับการสร้างภาพที่ลงทะเบียนไว้ที่เหลือ ตามลำดับ provider-id

หาก provider ล้มเหลว (ข้อผิดพลาด auth, rate limit เป็นต้น) candidate ที่กำหนดค่าไว้ถัดไป
จะถูกลองโดยอัตโนมัติ หากทั้งหมดล้มเหลว ข้อผิดพลาดจะมีรายละเอียด
จากแต่ละความพยายาม

<AccordionGroup>
  <Accordion title="การ override model ต่อการเรียกใช้มีผลตรงตัว">
    การ override `model` ต่อการเรียกใช้จะลองเฉพาะ provider/model นั้นเท่านั้น และ
    จะไม่ดำเนินต่อไปยัง primary/fallback ที่กำหนดค่าไว้หรือ provider ที่ตรวจพบอัตโนมัติ
  </Accordion>
  <Accordion title="การตรวจจับอัตโนมัติคำนึงถึง auth">
    ค่าเริ่มต้นของ provider จะเข้าสู่รายการ candidate เฉพาะเมื่อ OpenClaw สามารถ
    authenticate provider นั้นได้จริง ตั้งค่า
    `agents.defaults.mediaGenerationAutoProviderFallback: false` เพื่อใช้เฉพาะ
    รายการ `model`, `primary` และ `fallbacks` ที่ระบุไว้อย่างชัดเจน
  </Accordion>
  <Accordion title="Timeouts">
    ตั้งค่า `agents.defaults.imageGenerationModel.timeoutMs` สำหรับ backend รูปภาพที่ช้า
    พารามิเตอร์เครื่องมือ `timeoutMs` ต่อการเรียกใช้จะ override ค่าเริ่มต้นที่กำหนดค่าไว้
    และค่าเริ่มต้นที่กำหนดค่าไว้จะ override ค่าเริ่มต้นของ provider ที่ Plugin กำหนด
    provider รูปภาพที่โฮสต์โดย Google และ OpenRouter ใช้ค่าเริ่มต้น 180 วินาที
    การสร้างภาพของ Microsoft Foundry MAI, xAI และ Azure OpenAI ใช้
    600 วินาที การเรียกใช้ dynamic-tool ของ Codex ใช้ค่าเริ่มต้น bridge
    `image_generate` 120 วินาที และเคารพงบเวลา timeout เดียวกันเมื่อกำหนดค่าไว้
    โดยถูกจำกัดด้วยค่าสูงสุดของ dynamic-tool bridge ของ OpenClaw ที่ 600000 ms
  </Accordion>
  <Accordion title="ตรวจสอบขณะ runtime">
    ใช้ `action: "list"` เพื่อตรวจสอบ provider ที่ลงทะเบียนอยู่ในปัจจุบัน
    model เริ่มต้นของแต่ละรายการ และคำใบ้ env-var สำหรับ auth
  </Accordion>
</AccordionGroup>

### การแก้ไขรูปภาพ

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI และ xAI รองรับการแก้ไขรูปภาพอ้างอิง model Krea 2 บน fal ใช้ฟิลด์
`image` / `images` เดียวกันเป็นข้อมูลอ้างอิงสไตล์แทนอินพุตสำหรับแก้ไข ส่งผ่าน
พาธหรือ URL ของรูปภาพอ้างอิง:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google และ xAI รองรับรูปภาพอ้างอิงสูงสุด 5 รูปผ่านพารามิเตอร์
`images` fal รองรับรูปภาพอ้างอิง 1 รูปสำหรับ Flux image-to-image,
สูงสุด 10 รูปสำหรับการแก้ไข GPT Image 2, สูงสุด 10 รายการอ้างอิงสไตล์สำหรับ Krea 2
และสูงสุด 14 รูปสำหรับการแก้ไข Nano Banana 2 ส่วน Microsoft Foundry, MiniMax
และ ComfyUI รองรับ 1 รูป

## เจาะลึก Provider

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (และ gpt-image-1.5)">
    การสร้างภาพของ OpenAI มีค่าเริ่มต้นเป็น `openai/gpt-image-2` หากกำหนดค่า
    โปรไฟล์ OAuth ของ `openai` ไว้ OpenClaw จะใช้โปรไฟล์ OAuth เดียวกันกับที่ใช้โดย
    model แชตแบบสมัครสมาชิกของ Codex และส่งคำขอรูปภาพผ่าน backend Codex Responses
    URL ฐาน Codex แบบ legacy เช่น `https://chatgpt.com/backend-api` จะถูก canonicalize เป็น
    `https://chatgpt.com/backend-api/codex` สำหรับคำขอรูปภาพ OpenClaw
    **จะไม่** fallback แบบเงียบไปยัง `OPENAI_API_KEY` สำหรับคำขอนั้น -
    หากต้องการบังคับ routing ไปยัง OpenAI Images API โดยตรง ให้กำหนดค่า
    `models.providers.openai` อย่างชัดเจนด้วย API key, URL ฐานแบบกำหนดเอง
    หรือ endpoint ของ Azure

    ยังสามารถเลือก model `openai/gpt-image-1.5`, `openai/gpt-image-1` และ
    `openai/gpt-image-1-mini` ได้อย่างชัดเจน ใช้
    `gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP ที่มีพื้นหลังโปร่งใส API ปัจจุบันของ
    `gpt-image-2` ปฏิเสธ `background: "transparent"`

    `gpt-image-2` รองรับทั้งการสร้างภาพจากข้อความและ
    การแก้ไขรูปภาพอ้างอิงผ่านเครื่องมือ `image_generate` เดียวกัน
    OpenClaw ส่งต่อ `prompt`, `count`, `size`, `quality`, `outputFormat`
    และรูปภาพอ้างอิงไปยัง OpenAI OpenAI **จะไม่ได้รับ**
    `aspectRatio` หรือ `resolution` โดยตรง เมื่อเป็นไปได้ OpenClaw จะ map
    สิ่งเหล่านั้นเป็น `size` ที่รองรับ มิฉะนั้นเครื่องมือจะรายงานว่าเป็น
    override ที่ถูกละเว้น

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

    `openai.background` รับค่า `transparent`, `opaque` หรือ `auto`;
    เอาต์พุตโปร่งใสต้องใช้ `outputFormat` เป็น `png` หรือ `webp` และ
    model รูปภาพ OpenAI ที่รองรับความโปร่งใส OpenClaw route คำขอพื้นหลังโปร่งใสของ
    `gpt-image-2` เริ่มต้นไปยัง `gpt-image-1.5`
    `openai.outputCompression` ใช้กับเอาต์พุต JPEG/WebP และจะถูกละเว้น
    สำหรับเอาต์พุต PNG

    คำใบ้ `background` ระดับบนสุดเป็นกลางต่อ provider และปัจจุบันจะ map
    ไปยังฟิลด์คำขอ `background` เดียวกันของ OpenAI เมื่อเลือก provider OpenAI
    provider ที่ไม่ได้ประกาศการรองรับพื้นหลังจะส่งคืนค่านี้ใน
    `ignoredOverrides` แทนที่จะได้รับพารามิเตอร์ที่ไม่รองรับ

    หากต้องการ route การสร้างภาพของ OpenAI ผ่าน deployment ของ Azure OpenAI
    แทน `api.openai.com` โปรดดู
    [endpoint ของ Azure OpenAI](/th/providers/openai#azure-openai-endpoints)

  </Accordion>
  <Accordion title="model รูปภาพ Microsoft Foundry MAI">
    การสร้างภาพของ Microsoft Foundry ใช้ชื่อ deployment รูปภาพ MAI ที่ deploy แล้ว
    ภายใต้ prefix provider `microsoft-foundry/` ไม่มี model เริ่มต้นระดับ provider
    เพราะ MAI API คาดหวังชื่อ deployment ของคุณในฟิลด์
    `model`:

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

    provider ใช้ MAI API ของ Microsoft Foundry ไม่ใช่ OpenAI Images API:

    - endpoint การสร้าง: `/mai/v1/images/generations`
    - endpoint การแก้ไข: `/mai/v1/images/edits`
    - Auth: `AZURE_OPENAI_API_KEY` / API key ของ provider หรือ Entra ID ผ่าน `az login`
    - เอาต์พุต: รูป PNG หนึ่งรูป
    - ขนาด: ค่าเริ่มต้น `1024x1024`; ความกว้างและความสูงต้องอย่างน้อย 768 px แต่ละด้าน
      และจำนวนพิกเซลรวมต้องไม่เกิน 1,048,576
    - การแก้ไข: รูปภาพอ้างอิง PNG หรือ JPEG หนึ่งรูป รองรับเฉพาะโดย
      deployment `MAI-Image-2.5-Flash` และ `MAI-Image-2.5`

    การสร้างจาก prompt อย่างเดียวสามารถใช้ชื่อ deployment แบบกำหนดเองได้โดยมีเพียง
    endpoint ของ Foundry ที่กำหนดค่าไว้ การแก้ไขด้วยชื่อ deployment แบบกำหนดเองต้องใช้
    metadata การ onboarding/model เพื่อให้ OpenClaw ตรวจสอบได้ว่า deployment นั้น
    รองรับโดย `MAI-Image-2.5-Flash` หรือ `MAI-Image-2.5`

    model รูปภาพ MAI ปัจจุบันคือ `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` และ `MAI-Image-2` ดู
    [Plugin Microsoft Foundry](/th/plugins/reference/microsoft-foundry) สำหรับการตั้งค่า
    และพฤติกรรมของ chat-model

  </Accordion>
  <Accordion title="model รูปภาพ OpenRouter">
    การสร้างภาพของ OpenRouter ใช้ `OPENROUTER_API_KEY` เดียวกัน และ
    route ผ่าน chat completions image API ของ OpenRouter เลือก
    model รูปภาพ OpenRouter ด้วย prefix `openrouter/`:

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
    คำใบ้ `aspectRatio` / `resolution` ที่เข้ากันได้กับ Gemini ไปยัง OpenRouter
    shortcut ของ model รูปภาพ OpenRouter ที่มีในตัวปัจจุบันรวมถึง
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` และ `openai/gpt-5.4-image-2` ใช้
    `action: "list"` เพื่อดูว่า Plugin ที่คุณกำหนดค่าไว้เปิดเผยอะไรบ้าง

  </Accordion>
  <Accordion title="fal Krea 2">
    model Krea 2 บน fal ใช้ schema Krea native ของ fal แทน schema
    `image_size` ทั่วไปที่ Flux ใช้ OpenClaw ส่ง:

    - `aspect_ratio` สำหรับคำใบ้ aspect-ratio
    - `creativity` โดยมีค่าเริ่มต้นเป็น `medium`
    - `image_style_references` เมื่อมีการระบุ `image` หรือ `images`

    เลือก Krea 2 Medium สำหรับภาพประกอบเชิงสื่อสารที่เร็วกว่า และ Krea 2 Large
    สำหรับลุค photoreal และพื้นผิวที่ช้ากว่าและละเอียดกว่า:

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

    ปัจจุบัน Krea 2 ส่งคืนหนึ่งรูปต่อคำขอ ควรใช้ `aspectRatio` สำหรับ
    Krea; OpenClaw map `size` ไปยัง aspect ratio ของ Krea ที่รองรับซึ่งใกล้ที่สุด และ
    ปฏิเสธ `resolution` สำหรับ Krea แทนที่จะทิ้งค่าไป ใช้ `fal.creativity`
    เมื่อคุณต้องการระดับความสร้างสรรค์ native ของ Krea:

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
  <Accordion title="MiniMax dual-auth">
    การสร้างภาพของ MiniMax พร้อมใช้งานผ่านเส้นทาง auth ของ MiniMax ที่ bundled
    ทั้งสองแบบ:

    - `minimax/image-01` สำหรับการตั้งค่าด้วย API key
    - `minimax-portal/image-01` สำหรับการตั้งค่าด้วย OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    provider xAI ที่ bundled ใช้ `/v1/images/generations` สำหรับคำขอที่มีเพียง prompt
    และ `/v1/images/edits` เมื่อมี `image` หรือ `images`

    - Model: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - จำนวน: สูงสุด 4
    - ข้อมูลอ้างอิง: `image` หนึ่งรายการ หรือ `images` สูงสุดห้ารายการ
    - Aspect ratio: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - ความละเอียด: `1K`, `2K`
    - เอาต์พุต: ส่งคืนเป็นไฟล์แนบรูปภาพที่ OpenClaw จัดการ

    OpenClaw ตั้งใจไม่เปิดเผย `quality`, `mask`, `user` หรือ aspect ratio
    native-only เพิ่มเติมของ xAI จนกว่าการควบคุมเหล่านั้นจะมีอยู่
    ใน contract `image_generate` แบบข้าม provider ที่ใช้ร่วมกัน

  </Accordion>
</AccordionGroup>

## ตัวอย่าง

<Tabs>
  <Tab title="สร้าง (ภูมิทัศน์ 4K)">
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
  <Tab title="สร้าง (สองภาพสี่เหลี่ยมจัตุรัส)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="แก้ไข (ภาพอ้างอิงเดียว)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="แก้ไข (หลายภาพอ้างอิง)">
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
`--openai-moderation` เดียวกันพร้อมใช้งานบน `openclaw infer image edit`;
`--openai-background` ยังคงเป็น alias เฉพาะของ OpenAI ผู้ให้บริการที่บันเดิลมา
นอกเหนือจาก OpenAI ยังไม่ได้ประกาศการควบคุมพื้นหลังอย่างชัดเจนในตอนนี้ ดังนั้น
`background: "transparent"` จะถูกรายงานว่าถูกละเว้นสำหรับผู้ให้บริการเหล่านั้น

## ที่เกี่ยวข้อง

- [ภาพรวมเครื่องมือ](/th/tools) - เครื่องมือเอเจนต์ทั้งหมดที่พร้อมใช้งาน
- [ComfyUI](/th/providers/comfy) - การตั้งค่าเวิร์กโฟลว์ ComfyUI ภายในเครื่องและ Comfy Cloud
- [fal](/th/providers/fal) - การตั้งค่าผู้ให้บริการรูปภาพและวิดีโอของ fal
- [Google (Gemini)](/th/providers/google) - การตั้งค่าผู้ให้บริการรูปภาพ Gemini
- [Microsoft Foundry plugin](/th/plugins/reference/microsoft-foundry) - การตั้งค่าแชต Microsoft Foundry และรูปภาพ MAI
- [MiniMax](/th/providers/minimax) - การตั้งค่าผู้ให้บริการรูปภาพ MiniMax
- [OpenAI](/th/providers/openai) - การตั้งค่าผู้ให้บริการ OpenAI Images
- [Vydra](/th/providers/vydra) - การตั้งค่ารูปภาพ วิดีโอ และเสียงพูดของ Vydra
- [xAI](/th/providers/xai) - การตั้งค่ารูปภาพ วิดีโอ การค้นหา การดำเนินการโค้ด และ TTS ของ Grok
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) - การกำหนดค่า `imageGenerationModel`
- [โมเดล](/th/concepts/models) - การกำหนดค่าโมเดลและการสลับเมื่อขัดข้อง
