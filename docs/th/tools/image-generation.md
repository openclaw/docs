---
read_when:
    - การสร้างหรือแก้ไขรูปภาพผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลสำหรับการสร้างรูปภาพ
    - การทำความเข้าใจพารามิเตอร์ของเครื่องมือ `image_generate`
sidebarTitle: Image generation
summary: สร้างและแก้ไขรูปภาพผ่าน `image_generate` บน OpenAI, Google, fal, MiniMax, ComfyUI, OpenRouter, LiteLLM, xAI, Vydra
title: การสร้างรูปภาพ
x-i18n:
    generated_at: "2026-04-26T11:43:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: c57d32667eed3d6449628f6f663359ece089233ed0fde5258e2b2e4713192758
    source_path: tools/image-generation.md
    workflow: 15
---

เครื่องมือ `image_generate` ช่วยให้เอเจนต์สามารถสร้างและแก้ไขรูปภาพโดยใช้
ผู้ให้บริการที่คุณกำหนดค่าไว้ รูปภาพที่สร้างขึ้นจะถูกส่งเป็นไฟล์แนบสื่อในคำตอบ
ของเอเจนต์โดยอัตโนมัติ

<Note>
เครื่องมือนี้จะแสดงก็ต่อเมื่อมีผู้ให้บริการสร้างรูปภาพอย่างน้อยหนึ่งราย
พร้อมใช้งานเท่านั้น หากคุณไม่เห็น `image_generate` ในเครื่องมือของเอเจนต์
ให้กำหนดค่า `agents.defaults.imageGenerationModel`, ตั้งค่า API key ของผู้ให้บริการ
หรือลงชื่อเข้าใช้ด้วย OpenAI Codex OAuth
</Note>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="กำหนดค่า auth">
    ตั้งค่า API key สำหรับผู้ให้บริการอย่างน้อยหนึ่งราย (เช่น `OPENAI_API_KEY`,
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

    Codex OAuth ใช้ model ref `openai/gpt-image-2` เดียวกัน เมื่อมีการกำหนดค่า
    OAuth profile แบบ `openai-codex` ไว้ OpenClaw จะส่งคำขอรูปภาพผ่าน
    OAuth profile นั้นแทนการลอง `OPENAI_API_KEY` ก่อน
    การกำหนดค่า `models.providers.openai` แบบชัดเจน (API key,
    base URL แบบกำหนดเอง/Azure) จะเลือกกลับไปใช้เส้นทาง
    OpenAI Images API โดยตรง

  </Step>
  <Step title="สั่งเอเจนต์">
    _"สร้างรูปภาพมาสคอตหุ่นยนต์ที่เป็นมิตร"_

    เอเจนต์จะเรียก `image_generate` โดยอัตโนมัติ ไม่ต้องกำหนด allow-list
    ของเครื่องมือ — ระบบเปิดใช้งานไว้เป็นค่าเริ่มต้นเมื่อมีผู้ให้บริการพร้อมใช้งาน

  </Step>
</Steps>

<Warning>
สำหรับเอ็นด์พอยต์ OpenAI-compatible บน LAN เช่น LocalAI ให้คง
`models.providers.openai.baseUrl` แบบกำหนดเองไว้ และเลือกใช้งานอย่างชัดเจนด้วย
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เอ็นด์พอยต์รูปภาพ
แบบ private และ internal ยังคงถูกบล็อกไว้เป็นค่าเริ่มต้น
</Warning>

## เส้นทางที่ใช้บ่อย

| เป้าหมาย                                                 | Model ref                                          | Auth                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| การสร้างรูปภาพด้วย OpenAI พร้อมการคิดค่าบริการผ่าน API             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| การสร้างรูปภาพด้วย OpenAI พร้อม auth แบบสมาชิก Codex | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| PNG/WebP พื้นหลังโปร่งใสของ OpenAI               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` หรือ OpenAI Codex OAuth |
| การสร้างรูปภาพด้วย OpenRouter                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| การสร้างรูปภาพด้วย LiteLLM                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| การสร้างรูปภาพด้วย Google Gemini                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`   |

เครื่องมือ `image_generate` เดียวกันนี้รองรับทั้งการสร้างรูปจากข้อความและการแก้ไข
ด้วยรูปอ้างอิง ใช้ `image` สำหรับรูปอ้างอิงหนึ่งรูป หรือ `images` สำหรับหลายรูป
ระบบจะส่งต่อคำใบ้เอาต์พุตที่ผู้ให้บริการรองรับ เช่น `quality`, `outputFormat` และ
`background` เมื่อใช้งานได้ และจะรายงานว่าเพิกเฉยเมื่อผู้ให้บริการไม่รองรับ
การรองรับพื้นหลังโปร่งใสแบบบันเดิลเป็นความสามารถเฉพาะของ OpenAI;
ผู้ให้บริการรายอื่นอาจยังคงรักษา alpha ของ PNG ได้ หาก backend ของพวกเขาส่งออกมา

## ผู้ให้บริการที่รองรับ

| Provider   | Default model                           | Edit support                       | Auth                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | ใช่ (1 รูป, กำหนดโดย workflow) | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` สำหรับ cloud    |
| fal        | `fal-ai/flux/dev`                       | ใช่                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | ใช่                                | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | ใช่ (อินพุตได้สูงสุด 5 รูป)         | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | ใช่ (อ้างอิงวัตถุหลัก)            | `MINIMAX_API_KEY` หรือ MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | ใช่ (สูงสุด 4 รูป)               | `OPENAI_API_KEY` หรือ OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | ใช่ (อินพุตได้สูงสุด 5 รูป)         | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | ไม่                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | ใช่ (สูงสุด 5 รูป)               | `XAI_API_KEY`                                         |

ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการและโมเดลที่พร้อมใช้งานในรันไทม์:

```text
/tool image_generate action=list
```

## ความสามารถของผู้ให้บริการ

| ความสามารถ            | ComfyUI            | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| สร้างรูป (จำนวนสูงสุด)  | กำหนดโดย Workflow   | 4                 | 4              | 9                     | 4              | 1     | 4              |
| แก้ไข / อ้างอิง      | 1 รูป (workflow) | 1 รูป           | สูงสุด 5 รูป | 1 รูป (อ้างอิงวัตถุหลัก) | สูงสุด 5 รูป | —     | สูงสุด 5 รูป |
| การควบคุมขนาด          | —                  | ✓                 | ✓              | —                     | สูงสุด 4K       | —     | —              |
| อัตราส่วนภาพ          | —                  | ✓ (เฉพาะการสร้าง) | ✓              | ✓                     | —              | —     | ✓              |
| ความละเอียด (1K/2K/4K) | —                  | ✓                 | ✓              | —                     | —              | —     | 1K, 2K         |

## พารามิเตอร์ของเครื่องมือ

<ParamField path="prompt" type="string" required>
  พรอมป์ต์สำหรับสร้างรูปภาพ ต้องระบุสำหรับ `action: "generate"`
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  ใช้ `"list"` เพื่อตรวจสอบผู้ให้บริการและโมเดลที่พร้อมใช้งานในรันไทม์
</ParamField>
<ParamField path="model" type="string">
  การ override ผู้ให้บริการ/โมเดล (เช่น `openai/gpt-image-2`) ใช้
  `openai/gpt-image-1.5` สำหรับพื้นหลังโปร่งใสของ OpenAI
</ParamField>
<ParamField path="image" type="string">
  พาธหรือ URL ของรูปอ้างอิงหนึ่งรูปสำหรับโหมดแก้ไข
</ParamField>
<ParamField path="images" type="string[]">
  รูปอ้างอิงหลายรูปสำหรับโหมดแก้ไข (สูงสุด 5 รูปบนผู้ให้บริการที่รองรับ)
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
  คำใบ้พื้นหลังเมื่อผู้ให้บริการรองรับ ใช้ `transparent` ร่วมกับ
  `outputFormat: "png"` หรือ `"webp"` สำหรับผู้ให้บริการที่รองรับความโปร่งใส
</ParamField>
<ParamField path="count" type="number">จำนวนรูปภาพที่จะสร้าง (1–4)</ParamField>
<ParamField path="timeoutMs" type="number">timeout ของคำขอผู้ให้บริการเป็นมิลลิวินาที (ไม่บังคับ)</ParamField>
<ParamField path="filename" type="string">คำใบ้ชื่อไฟล์เอาต์พุต</ParamField>
<ParamField path="openai" type="object">
  คำใบ้เฉพาะของ OpenAI: `background`, `moderation`, `outputCompression` และ `user`
</ParamField>

<Note>
ไม่ใช่ทุกผู้ให้บริการที่จะรองรับทุกพารามิเตอร์ เมื่อผู้ให้บริการ fallback รองรับ
ตัวเลือกเรขาคณิตที่ใกล้เคียงแทนค่าที่ร้องขออย่างตรงตัว OpenClaw จะ remap ไปยัง
ขนาด อัตราส่วนภาพ หรือความละเอียดที่รองรับซึ่งใกล้ที่สุดก่อนส่งคำขอ
คำใบ้เอาต์พุตที่ไม่รองรับจะถูกทิ้งสำหรับผู้ให้บริการที่ไม่ได้ประกาศ
การรองรับ และจะถูกรายงานในผลลัพธ์ของเครื่องมือ ผลลัพธ์ของเครื่องมือจะรายงาน
ค่าที่ถูกนำไปใช้จริง; `details.normalization` จะเก็บการแปลงจากค่าที่ร้องขอไปเป็นค่าที่ใช้จริง
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

1. พารามิเตอร์ **`model`** จากการเรียกใช้เครื่องมือ (หากเอเจนต์ระบุมา)
2. **`imageGenerationModel.primary`** จาก config
3. **`imageGenerationModel.fallbacks`** ตามลำดับ
4. **การตรวจจับอัตโนมัติ** — เฉพาะค่าเริ่มต้นของผู้ให้บริการที่มี auth รองรับ:
   - ผู้ให้บริการเริ่มต้นปัจจุบันก่อน
   - ผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือ ตามลำดับ provider-id

หากผู้ให้บริการตัวใดล้มเหลว (ข้อผิดพลาดด้าน auth, rate limit ฯลฯ) ระบบจะลอง
ตัวเลือกที่กำหนดค่าไว้ถัดไปโดยอัตโนมัติ หากทั้งหมดล้มเหลว ข้อผิดพลาดจะรวมรายละเอียด
จากแต่ละความพยายามไว้ด้วย

<AccordionGroup>
  <Accordion title="การ override โมเดลต่อการเรียกใช้เป็นแบบตรงตัว">
    การ override `model` ต่อการเรียกใช้จะลองเฉพาะผู้ให้บริการ/โมเดลนั้นเท่านั้น และ
    จะไม่ดำเนินต่อไปยังผู้ให้บริการ primary/fallback ที่กำหนดค่าไว้ หรือผู้ให้บริการที่ตรวจพบอัตโนมัติ
  </Accordion>
  <Accordion title="การตรวจจับอัตโนมัติรับรู้สถานะ auth">
    ผู้ให้บริการเริ่มต้นจะถูกเพิ่มเข้าในรายการตัวเลือกก็ต่อเมื่อ OpenClaw
    สามารถยืนยันตัวตนกับผู้ให้บริการนั้นได้จริง ตั้งค่า
    `agents.defaults.mediaGenerationAutoProviderFallback: false` เพื่อใช้เฉพาะ
    รายการ `model`, `primary` และ `fallbacks` ที่ระบุไว้อย่างชัดเจน
  </Accordion>
  <Accordion title="Timeouts">
    ตั้งค่า `agents.defaults.imageGenerationModel.timeoutMs` สำหรับ backend
    รูปภาพที่ช้า พารามิเตอร์ `timeoutMs` ของเครื่องมือแบบต่อการเรียกใช้จะ override
    ค่าเริ่มต้นที่กำหนดไว้
  </Accordion>
  <Accordion title="ตรวจสอบในรันไทม์">
    ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการที่ลงทะเบียนอยู่ในปัจจุบัน
    โมเดลเริ่มต้นของพวกเขา และคำใบ้ env var สำหรับ auth
  </Accordion>
</AccordionGroup>

### การแก้ไขรูปภาพ

  OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI และ xAI รองรับการแก้ไข
  รูปอ้างอิง ส่งพาธหรือ URL ของรูปอ้างอิง:

  ```text
  "Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
  ```

  OpenAI, OpenRouter, Google และ xAI รองรับรูปอ้างอิงได้สูงสุด 5 รูปผ่าน
  พารามิเตอร์ `images` ส่วน fal, MiniMax และ ComfyUI รองรับ 1 รูป

  ## รายละเอียดเชิงลึกของผู้ให้บริการ

  <AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (และ gpt-image-1.5)">
    โดยค่าเริ่มต้น การสร้างรูปภาพของ OpenAI ใช้ `openai/gpt-image-2` หากมีการกำหนดค่า
    OAuth profile แบบ `openai-codex` ไว้ OpenClaw จะใช้
    OAuth profile เดียวกับที่ใช้โดยโมเดลแชตแบบสมาชิก Codex ซ้ำ และส่ง
    คำขอรูปภาพผ่าน backend ของ Codex Responses ค่า base
    URL ของ Codex แบบเดิม เช่น `https://chatgpt.com/backend-api` จะถูกทำให้เป็น canonical เป็น
    `https://chatgpt.com/backend-api/codex` สำหรับคำขอรูปภาพ OpenClaw
    จะ **ไม่** fallback ไปใช้ `OPENAI_API_KEY` สำหรับคำขอนั้นแบบเงียบ ๆ —
    หากต้องการบังคับให้ใช้เส้นทาง OpenAI Images API โดยตรง ให้กำหนดค่า
    `models.providers.openai` อย่างชัดเจนด้วย API key, base URL แบบกำหนดเอง
    หรือเอ็นด์พอยต์ Azure

    โมเดล `openai/gpt-image-1.5`, `openai/gpt-image-1` และ
    `openai/gpt-image-1-mini` ยังคงสามารถเลือกใช้อย่างชัดเจนได้ ใช้
    `gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP พื้นหลังโปร่งใส; ปัจจุบัน
    API ของ `gpt-image-2` จะปฏิเสธ `background: "transparent"`

    `gpt-image-2` รองรับทั้งการสร้างรูปภาพจากข้อความและ
    การแก้ไขด้วยรูปอ้างอิงผ่านเครื่องมือ `image_generate` ตัวเดียวกัน
    OpenClaw จะส่งต่อ `prompt`, `count`, `size`, `quality`, `outputFormat`
    และรูปอ้างอิงไปยัง OpenAI โดย OpenAI จะ **ไม่ได้** รับ
    `aspectRatio` หรือ `resolution` โดยตรง; เมื่อทำได้ OpenClaw จะจับคู่
    ค่าเหล่านั้นให้เป็น `size` ที่รองรับ มิฉะนั้นเครื่องมือจะรายงานว่าเป็น
    override ที่ถูกเพิกเฉย

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
    เอาต์พุตแบบโปร่งใสต้องใช้ `outputFormat` เป็น `png` หรือ `webp` และ
    ใช้โมเดลรูปภาพ OpenAI ที่รองรับความโปร่งใส OpenClaw จะกำหนดเส้นทาง
    คำขอพื้นหลังโปร่งใสของ `gpt-image-2` ตามค่าเริ่มต้นไปยัง `gpt-image-1.5`
    `openai.outputCompression` ใช้กับเอาต์พุต JPEG/WebP

    คำใบ้ `background` ระดับบนสุดเป็นแบบเป็นกลางต่อผู้ให้บริการ และปัจจุบันจะจับคู่
    ไปยังฟิลด์คำขอ `background` ของ OpenAI เดียวกันเมื่อเลือกใช้ผู้ให้บริการ OpenAI
    ผู้ให้บริการที่ไม่ได้ประกาศว่ารองรับพื้นหลังจะส่งคืนค่านี้ใน
    `ignoredOverrides` แทนการรับพารามิเตอร์ที่ไม่รองรับ

    หากต้องการกำหนดเส้นทางการสร้างรูปภาพของ OpenAI ผ่าน deployment ของ Azure OpenAI
    แทน `api.openai.com` โปรดดู
    [เอ็นด์พอยต์ Azure OpenAI](/th/providers/openai#azure-openai-endpoints)

  </Accordion>
  <Accordion title="โมเดลรูปภาพของ OpenRouter">
    การสร้างรูปภาพด้วย OpenRouter ใช้ `OPENROUTER_API_KEY` เดียวกัน และ
    กำหนดเส้นทางผ่าน chat completions image API ของ OpenRouter เลือก
    โมเดลรูปภาพของ OpenRouter ด้วยคำนำหน้า `openrouter/`:

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

    OpenClaw จะส่งต่อ `prompt`, `count`, รูปอ้างอิง และ
    คำใบ้ `aspectRatio` / `resolution` ที่เข้ากันได้กับ Gemini ไปยัง OpenRouter
    shortcut ของโมเดลรูปภาพ OpenRouter แบบบันเดิลในปัจจุบันรวมถึง
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` และ `openai/gpt-5.4-image-2` ใช้
    `action: "list"` เพื่อดูว่า Plugin ที่คุณกำหนดค่าไว้เปิดเผยอะไรบ้าง

  </Accordion>
  <Accordion title="MiniMax แบบ dual-auth">
    การสร้างรูปภาพด้วย MiniMax ใช้งานได้ผ่านทั้งสองเส้นทาง auth ของ MiniMax
    ที่บันเดิลมา:

    - `minimax/image-01` สำหรับการตั้งค่าแบบ API key
    - `minimax-portal/image-01` สำหรับการตั้งค่าแบบ OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    ผู้ให้บริการ xAI ที่บันเดิลมาใช้ `/v1/images/generations` สำหรับคำขอ
    ที่มีเฉพาะพรอมป์ต์ และใช้ `/v1/images/edits` เมื่อมี `image` หรือ `images`

    - โมเดล: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - จำนวน: สูงสุด 4
    - รูปอ้างอิง: `image` หนึ่งรูป หรือ `images` สูงสุดห้ารูป
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - ความละเอียด: `1K`, `2K`
    - เอาต์พุต: ส่งคืนเป็นไฟล์แนบรูปภาพที่ OpenClaw จัดการให้

    OpenClaw ตั้งใจไม่เปิดเผย `quality`, `mask`,
    `user` หรืออัตราส่วนภาพ native-only เพิ่มเติมของ xAI จนกว่าจะมีตัวควบคุมเหล่านั้น
    อยู่ใน contract `image_generate` แบบใช้ร่วมกันข้ามผู้ให้บริการ

  </Accordion>
</AccordionGroup>

## ตัวอย่าง

<Tabs>
  <Tab title="สร้าง (แนวนอน 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="สร้าง (PNG พื้นหลังโปร่งใส)">
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
  <Tab title="แก้ไข (รูปอ้างอิงหนึ่งรูป)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="แก้ไข (หลายรูปอ้างอิง)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

แฟล็ก `--output-format` และ `--background` เดียวกันนี้ใช้ได้กับ
`openclaw infer image edit` ด้วย; `--openai-background` ยังคงมีอยู่ในฐานะ
alias เฉพาะของ OpenAI ผู้ให้บริการที่บันเดิลมารายนอกเหนือจาก OpenAI ยังไม่ได้ประกาศ
การควบคุมพื้นหลังอย่างชัดเจนในปัจจุบัน ดังนั้น `background: "transparent"` จะถูกรายงาน
ว่าเป็นค่าที่ถูกเพิกเฉยสำหรับผู้ให้บริการเหล่านั้น

## ที่เกี่ยวข้อง

- [ภาพรวมเครื่องมือ](/th/tools) — เครื่องมือเอเจนต์ทั้งหมดที่พร้อมใช้งาน
- [ComfyUI](/th/providers/comfy) — การตั้งค่า workflow ของ ComfyUI ภายในเครื่องและ Comfy Cloud
- [fal](/th/providers/fal) — การตั้งค่าผู้ให้บริการภาพและวิดีโอของ fal
- [Google (Gemini)](/th/providers/google) — การตั้งค่าผู้ให้บริการรูปภาพ Gemini
- [MiniMax](/th/providers/minimax) — การตั้งค่าผู้ให้บริการรูปภาพ MiniMax
- [OpenAI](/th/providers/openai) — การตั้งค่าผู้ให้บริการ OpenAI Images
- [Vydra](/th/providers/vydra) — การตั้งค่า Vydra สำหรับรูปภาพ วิดีโอ และเสียงพูด
- [xAI](/th/providers/xai) — การตั้งค่า Grok สำหรับรูปภาพ วิดีโอ การค้นหา การรันโค้ด และ TTS
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — config `imageGenerationModel`
- [โมเดล](/th/concepts/models) — การกำหนดค่าโมเดลและ failover
