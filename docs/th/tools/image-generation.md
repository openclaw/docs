---
read_when:
    - การสร้างหรือแก้ไขรูปภาพผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลการสร้างรูปภาพ
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ image_generate
sidebarTitle: Image generation
summary: สร้างและแก้ไขรูปภาพผ่าน image_generate บน OpenAI, Google, fal, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: การสร้างภาพ
x-i18n:
    generated_at: "2026-05-06T09:34:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8036e8846c38e9bfce4e618caac13fa35e89ae183f81e5a496a29feeb9656369
    source_path: tools/image-generation.md
    workflow: 16
---

เครื่องมือ `image_generate` ช่วยให้เอเจนต์สร้างและแก้ไขรูปภาพโดยใช้ผู้ให้บริการที่คุณกำหนดค่าไว้ รูปภาพที่สร้างขึ้นจะถูกส่งโดยอัตโนมัติเป็นไฟล์แนบสื่อในคำตอบของเอเจนต์

<Note>
เครื่องมือนี้จะปรากฏเฉพาะเมื่อมีผู้ให้บริการสร้างรูปภาพอย่างน้อยหนึ่งรายพร้อมใช้งาน หากคุณไม่เห็น `image_generate` ในเครื่องมือของเอเจนต์ ให้กำหนดค่า `agents.defaults.imageGenerationModel` ตั้งค่าคีย์ API ของผู้ให้บริการ หรือลงชื่อเข้าใช้ด้วย OpenAI Codex OAuth
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

    Codex OAuth ใช้การอ้างอิงโมเดล `openai/gpt-image-2` เดียวกัน เมื่อกำหนดค่าโปรไฟล์ OAuth
    `openai-codex` แล้ว OpenClaw จะกำหนดเส้นทางคำขอรูปภาพผ่านโปรไฟล์ OAuth นั้นแทนการลองใช้
    `OPENAI_API_KEY` ก่อน การกำหนดค่า `models.providers.openai` อย่างชัดเจน (คีย์ API,
    URL ฐานแบบกำหนดเอง/Azure) จะเลือกกลับไปใช้เส้นทาง OpenAI Images API โดยตรง

  </Step>
  <Step title="ถามเอเจนต์">
    _"สร้างรูปภาพมาสคอตหุ่นยนต์ที่เป็นมิตร"_

    เอเจนต์จะเรียก `image_generate` โดยอัตโนมัติ ไม่จำเป็นต้องเพิ่มเครื่องมือในรายการอนุญาต
    เพราะจะเปิดใช้เป็นค่าเริ่มต้นเมื่อมีผู้ให้บริการพร้อมใช้งาน

  </Step>
</Steps>

<Warning>
สำหรับปลายทาง LAN ที่เข้ากันได้กับ OpenAI เช่น LocalAI ให้คงค่า
`models.providers.openai.baseUrl` แบบกำหนดเองไว้ และเลือกใช้อย่างชัดเจนด้วย
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ปลายทางรูปภาพแบบส่วนตัวและภายในยังคงถูกบล็อกตามค่าเริ่มต้น
</Warning>

## เส้นทางทั่วไป

| เป้าหมาย                                             | การอ้างอิงโมเดล                                   | การยืนยันตัวตน                         |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| การสร้างรูปภาพด้วย OpenAI พร้อมการเรียกเก็บเงินผ่าน API | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| การสร้างรูปภาพด้วย OpenAI พร้อมการยืนยันตัวตนด้วยการสมัครสมาชิก Codex | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| PNG/WebP พื้นหลังโปร่งใสของ OpenAI                  | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` หรือ OpenAI Codex OAuth |
| การสร้างรูปภาพด้วย DeepInfra                         | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| การสร้างรูปภาพด้วย OpenRouter                        | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| การสร้างรูปภาพด้วย LiteLLM                           | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| การสร้างรูปภาพด้วย Google Gemini                     | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`   |

เครื่องมือ `image_generate` เดียวกันรองรับทั้งข้อความเป็นรูปภาพและการแก้ไขด้วยรูปภาพอ้างอิง ใช้ `image` สำหรับรูปภาพอ้างอิงหนึ่งรูป หรือ `images` สำหรับรูปภาพอ้างอิงหลายรูป คำแนะนำเอาต์พุตที่ผู้ให้บริการรองรับ เช่น `quality`, `outputFormat` และ `background` จะถูกส่งต่อเมื่อพร้อมใช้งาน และจะถูกรายงานว่าถูกละเว้นเมื่อผู้ให้บริการไม่รองรับ การรองรับพื้นหลังโปร่งใสที่รวมมาให้เป็นคุณสมบัติเฉพาะของ OpenAI ผู้ให้บริการรายอื่นอาจยังคงรักษา alpha ของ PNG ไว้ได้หากแบ็กเอนด์ของตนส่งออกมา

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ | โมเดลเริ่มต้น                           | การรองรับการแก้ไข                  | การยืนยันตัวตน                                        |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | ใช่ (1 รูปภาพ, กำหนดค่าโดย workflow) | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` สำหรับคลาวด์ |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | ใช่ (1 รูปภาพ)                     | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | ใช่                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | ใช่                                | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | ใช่ (รูปภาพอินพุตสูงสุด 5 รูป)     | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | ใช่ (ข้อมูลอ้างอิงตัวแบบ)          | `MINIMAX_API_KEY` หรือ MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | ใช่ (สูงสุด 4 รูปภาพ)              | `OPENAI_API_KEY` หรือ OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | ใช่ (รูปภาพอินพุตสูงสุด 5 รูป)     | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | ไม่                                | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | ใช่ (สูงสุด 5 รูปภาพ)              | `XAI_API_KEY`                                         |

ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการและโมเดลที่พร้อมใช้งานในขณะรันไทม์:

```text
/tool image_generate action=list
```

## ความสามารถของผู้ให้บริการ

| ความสามารถ            | ComfyUI            | DeepInfra | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| สร้าง (จำนวนสูงสุด)  | กำหนดโดย workflow | 4         | 4                 | 4              | 9                     | 4              | 1     | 4              |
| แก้ไข / อ้างอิง      | 1 รูปภาพ (workflow) | 1 รูปภาพ | 1 รูปภาพ          | สูงสุด 5 รูปภาพ | 1 รูปภาพ (subject ref) | สูงสุด 5 รูปภาพ | -     | สูงสุด 5 รูปภาพ |
| ควบคุมขนาด           | -                  | ✓         | ✓                 | ✓              | -                     | สูงสุด 4K       | -     | -              |
| อัตราส่วนภาพ         | -                  | -         | ✓ (สร้างเท่านั้น) | ✓              | ✓                     | -              | -     | ✓              |
| ความละเอียด (1K/2K/4K) | -                  | -         | ✓                 | ✓              | -                     | -              | -     | 1K, 2K         |

## พารามิเตอร์เครื่องมือ

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
  พาธหรือ URL ของรูปภาพอ้างอิงเดียวสำหรับโหมดแก้ไข
</ParamField>
<ParamField path="images" type="string[]">
  รูปภาพอ้างอิงหลายรูปสำหรับโหมดแก้ไข (สูงสุด 5 รูปในผู้ให้บริการที่รองรับ)
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
  คำแนะนำพื้นหลังเมื่อผู้ให้บริการรองรับ ใช้ `transparent` ร่วมกับ
  `outputFormat: "png"` หรือ `"webp"` สำหรับผู้ให้บริการที่รองรับความโปร่งใส
</ParamField>
<ParamField path="count" type="number">จำนวนรูปภาพที่จะสร้าง (1-4)</ParamField>
<ParamField path="timeoutMs" type="number">ระยะหมดเวลาคำขอผู้ให้บริการแบบไม่บังคับ หน่วยเป็นมิลลิวินาที</ParamField>
<ParamField path="filename" type="string">คำแนะนำชื่อไฟล์เอาต์พุต</ParamField>
<ParamField path="openai" type="object">
  คำแนะนำเฉพาะ OpenAI: `background`, `moderation`, `outputCompression` และ `user`
</ParamField>

<Note>
ผู้ให้บริการบางรายไม่รองรับพารามิเตอร์ทั้งหมด เมื่อผู้ให้บริการ fallback รองรับตัวเลือกเรขาคณิตที่ใกล้เคียงแทนตัวเลือกที่ขอไว้อย่างแม่นยำ OpenClaw จะจับคู่ใหม่ไปยังขนาด อัตราส่วนภาพ หรือความละเอียดที่รองรับใกล้เคียงที่สุดก่อนส่ง คำแนะนำเอาต์พุตที่ไม่รองรับจะถูกละทิ้งสำหรับผู้ให้บริการที่ไม่ได้ประกาศว่ารองรับ และจะถูกรายงานในผลลัพธ์ของเครื่องมือ ผลลัพธ์ของเครื่องมือจะรายงานการตั้งค่าที่นำไปใช้แล้ว; `details.normalization` จะบันทึกการแปลค่าจากที่ร้องขอไปเป็นค่าที่นำไปใช้
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
4. **การตรวจจับอัตโนมัติ** - เฉพาะค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับ:
   - ผู้ให้บริการเริ่มต้นปัจจุบันก่อน;
   - ผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนที่เหลือ ตามลำดับ provider-id

หากผู้ให้บริการล้มเหลว (ข้อผิดพลาดการยืนยันตัวตน, จำกัดอัตรา ฯลฯ) ระบบจะลองตัวเลือกถัดไปที่กำหนดค่าไว้โดยอัตโนมัติ หากทั้งหมดล้มเหลว ข้อผิดพลาดจะมีรายละเอียดจากแต่ละครั้งที่ลอง

<AccordionGroup>
  <Accordion title="การแทนที่โมเดลต่อการเรียกจะตรงตัว">
    การแทนที่ `model` ต่อการเรียกจะลองเฉพาะผู้ให้บริการ/โมเดลนั้นเท่านั้น และจะไม่ดำเนินต่อไปยัง primary/fallback ที่กำหนดค่าไว้หรือผู้ให้บริการที่ตรวจพบอัตโนมัติ
  </Accordion>
  <Accordion title="การตรวจจับอัตโนมัติคำนึงถึงการยืนยันตัวตน">
    ค่าเริ่มต้นของผู้ให้บริการจะเข้าสู่รายการตัวเลือกเฉพาะเมื่อ OpenClaw สามารถยืนยันตัวตนกับผู้ให้บริการนั้นได้จริง ตั้งค่า
    `agents.defaults.mediaGenerationAutoProviderFallback: false` เพื่อใช้เฉพาะรายการ `model`, `primary` และ `fallbacks` ที่ระบุอย่างชัดเจน
  </Accordion>
  <Accordion title="ระยะหมดเวลา">
    ตั้งค่า `agents.defaults.imageGenerationModel.timeoutMs` สำหรับแบ็กเอนด์รูปภาพที่ช้า พารามิเตอร์เครื่องมือ `timeoutMs` ต่อการเรียกจะแทนที่ค่าเริ่มต้นที่กำหนดค่าไว้
  </Accordion>
  <Accordion title="ตรวจสอบในขณะรันไทม์">
    ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการที่ลงทะเบียนอยู่ในปัจจุบัน โมเดลเริ่มต้นของผู้ให้บริการเหล่านั้น และคำแนะนำ env-var สำหรับการยืนยันตัวตน
  </Accordion>
</AccordionGroup>

### การแก้ไขรูปภาพ

OpenAI, OpenRouter, Google, DeepInfra, fal, MiniMax, ComfyUI และ xAI รองรับการแก้ไขรูปภาพอ้างอิง ส่งพาธหรือ URL ของรูปภาพอ้างอิง:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google และ xAI รองรับรูปภาพอ้างอิงสูงสุด 5 รูปผ่านพารามิเตอร์
`images` ส่วน fal, MiniMax และ ComfyUI รองรับ 1 รูป

## เจาะลึกผู้ให้บริการ

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (และ gpt-image-1.5)">
    การสร้างภาพของ OpenAI ใช้ค่าเริ่มต้นเป็น `openai/gpt-image-2` หากมีการกำหนดค่าโปรไฟล์ OAuth ของ
    `openai-codex` ไว้ OpenClaw จะใช้โปรไฟล์ OAuth เดียวกับที่โมเดลแชตแบบสมัครสมาชิกของ Codex ใช้ซ้ำ และส่ง
    คำขอภาพผ่านแบ็กเอนด์ Codex Responses URL ฐานของ Codex แบบเดิม
    เช่น `https://chatgpt.com/backend-api` จะถูกทำให้เป็นรูปแบบมาตรฐานเป็น
    `https://chatgpt.com/backend-api/codex` สำหรับคำขอภาพ OpenClaw
    **ไม่** ย้อนกลับไปใช้ `OPENAI_API_KEY` แบบเงียบๆ สำหรับคำขอนั้น -
    หากต้องการบังคับให้กำหนดเส้นทางผ่าน OpenAI Images API โดยตรง ให้กำหนดค่า
    `models.providers.openai` อย่างชัดเจนด้วยคีย์ API, URL ฐานแบบกำหนดเอง,
    หรือเอนด์พอยต์ Azure

    ยังสามารถเลือกโมเดล `openai/gpt-image-1.5`, `openai/gpt-image-1` และ
    `openai/gpt-image-1-mini` ได้อย่างชัดเจน ใช้
    `gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP พื้นหลังโปร่งใส; API
    `gpt-image-2` ปัจจุบันปฏิเสธ `background: "transparent"`

    `gpt-image-2` รองรับทั้งการสร้างภาพจากข้อความและ
    การแก้ไขภาพอ้างอิงผ่านเครื่องมือ `image_generate` เดียวกัน
    OpenClaw ส่งต่อ `prompt`, `count`, `size`, `quality`, `outputFormat`,
    และภาพอ้างอิงไปยัง OpenAI โดยตรง OpenAI **ไม่ได้** รับ
    `aspectRatio` หรือ `resolution` โดยตรง; เมื่อเป็นไปได้ OpenClaw จะแมป
    ค่าเหล่านั้นเป็น `size` ที่รองรับ ไม่เช่นนั้นเครื่องมือจะรายงานค่าเหล่านั้นเป็น
    การแทนที่ที่ถูกละเว้น

    ตัวเลือกเฉพาะของ OpenAI อยู่ใต้เออบเจ็กต์ `openai`:

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
    โมเดลภาพของ OpenAI ที่รองรับความโปร่งใส OpenClaw กำหนดเส้นทางคำขอ
    พื้นหลังโปร่งใสของ `gpt-image-2` ค่าเริ่มต้นไปยัง `gpt-image-1.5`
    `openai.outputCompression` ใช้กับเอาต์พุต JPEG/WebP

    คำใบ้ `background` ระดับบนสุดเป็นกลางต่อผู้ให้บริการ และในปัจจุบันแมป
    ไปยังฟิลด์คำขอ `background` เดียวกันของ OpenAI เมื่อเลือกผู้ให้บริการ OpenAI
    ผู้ให้บริการที่ไม่ได้ประกาศการรองรับพื้นหลังจะคืนค่านี้ใน
    `ignoredOverrides` แทนที่จะได้รับพารามิเตอร์ที่ไม่รองรับ

    หากต้องการกำหนดเส้นทางการสร้างภาพของ OpenAI ผ่านการปรับใช้ Azure OpenAI
    แทน `api.openai.com` โปรดดู
    [เอนด์พอยต์ Azure OpenAI](/th/providers/openai#azure-openai-endpoints)

  </Accordion>
  <Accordion title="โมเดลภาพ OpenRouter">
    การสร้างภาพของ OpenRouter ใช้ `OPENROUTER_API_KEY` เดียวกัน และ
    กำหนดเส้นทางผ่าน API ภาพของแชตคอมพลีชันของ OpenRouter เลือก
    โมเดลภาพ OpenRouter ด้วยคำนำหน้า `openrouter/`:

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

    OpenClaw ส่งต่อ `prompt`, `count`, ภาพอ้างอิง และคำใบ้
    `aspectRatio` / `resolution` ที่เข้ากันได้กับ Gemini ไปยัง OpenRouter
    ชอร์ตคัตโมเดลภาพ OpenRouter ที่มีมาให้ในปัจจุบัน ได้แก่
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` และ `openai/gpt-5.4-image-2` ใช้
    `action: "list"` เพื่อดูว่า Plugin ที่คุณกำหนดค่าเปิดเผยอะไรบ้าง

  </Accordion>
  <Accordion title="MiniMax การยืนยันตัวตนคู่">
    การสร้างภาพ MiniMax พร้อมใช้งานผ่านเส้นทางการยืนยันตัวตน MiniMax
    ที่รวมมาให้ทั้งสองแบบ:

    - `minimax/image-01` สำหรับการตั้งค่าด้วยคีย์ API
    - `minimax-portal/image-01` สำหรับการตั้งค่าด้วย OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    ผู้ให้บริการ xAI ที่รวมมาให้ใช้ `/v1/images/generations` สำหรับคำขอที่มีเฉพาะพรอมต์
    และใช้ `/v1/images/edits` เมื่อมี `image` หรือ `images`

    - โมเดล: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - จำนวน: สูงสุด 4
    - อ้างอิง: หนึ่ง `image` หรือสูงสุดห้า `images`
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - ความละเอียด: `1K`, `2K`
    - เอาต์พุต: ส่งคืนเป็นไฟล์แนบภาพที่ OpenClaw จัดการ

    OpenClaw ตั้งใจไม่เปิดเผย `quality`, `mask`,
    `user` ที่เป็นของ xAI โดยเฉพาะ หรืออัตราส่วนภาพเพิ่มเติมที่มีเฉพาะแบบเนทีฟ
    จนกว่าตัวควบคุมเหล่านั้นจะมีอยู่ในสัญญา `image_generate` ข้ามผู้ให้บริการที่ใช้ร่วมกัน

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

แฟล็ก `--output-format` และ `--background` เดียวกันพร้อมใช้งานบน
`openclaw infer image edit`; `--openai-background` ยังคงเป็นนามแฝง
เฉพาะของ OpenAI ผู้ให้บริการที่รวมมาให้รายอื่นนอกเหนือจาก OpenAI ยังไม่ได้ประกาศ
การควบคุมพื้นหลังอย่างชัดเจนในปัจจุบัน ดังนั้น `background: "transparent"` จึงถูกรายงาน
ว่าถูกละเว้นสำหรับผู้ให้บริการเหล่านั้น

## ที่เกี่ยวข้อง

- [ภาพรวมเครื่องมือ](/th/tools) - เครื่องมือเอเจนต์ทั้งหมดที่พร้อมใช้งาน
- [ComfyUI](/th/providers/comfy) - การตั้งค่าเวิร์กโฟลว์ ComfyUI ภายในเครื่องและ Comfy Cloud
- [fal](/th/providers/fal) - การตั้งค่าผู้ให้บริการภาพและวิดีโอ fal
- [Google (Gemini)](/th/providers/google) - การตั้งค่าผู้ให้บริการภาพ Gemini
- [MiniMax](/th/providers/minimax) - การตั้งค่าผู้ให้บริการภาพ MiniMax
- [OpenAI](/th/providers/openai) - การตั้งค่าผู้ให้บริการ OpenAI Images
- [Vydra](/th/providers/vydra) - การตั้งค่าภาพ วิดีโอ และเสียงพูดของ Vydra
- [xAI](/th/providers/xai) - การตั้งค่าภาพ วิดีโอ การค้นหา การเรียกใช้โค้ด และ TTS ของ Grok
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) - การกำหนดค่า `imageGenerationModel`
- [โมเดล](/th/concepts/models) - การกำหนดค่าโมเดลและการสลับเมื่อเกิดข้อผิดพลาด
