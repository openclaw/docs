---
read_when:
    - การสร้างภาพผ่าน agent
    - การกำหนดค่า provider และโมเดลสำหรับการสร้างภาพ
    - การทำความเข้าใจพารามิเตอร์ของเครื่องมือ `image_generate`
summary: สร้างและแก้ไขภาพโดยใช้ provider ที่กำหนดค่าไว้ (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: การสร้างภาพ
x-i18n:
    generated_at: "2026-04-25T14:00:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02369928fecac147729ca586cd39e1a88791219ffe26d8e94429d0ea4b1af411
    source_path: tools/image-generation.md
    workflow: 15
---

เครื่องมือ `image_generate` ช่วยให้ agent สามารถสร้างและแก้ไขภาพโดยใช้ provider ที่คุณกำหนดค่าไว้ได้ ภาพที่สร้างขึ้นจะถูกส่งโดยอัตโนมัติเป็นไฟล์แนบสื่อในคำตอบของ agent

<Note>
เครื่องมือนี้จะแสดงขึ้นเมื่อมี provider สำหรับการสร้างภาพอย่างน้อยหนึ่งรายการเท่านั้น หากคุณไม่เห็น `image_generate` ใน tools ของ agent ให้กำหนดค่า `agents.defaults.imageGenerationModel`, ตั้งค่าคีย์ API ของ provider หรือเข้าสู่ระบบด้วย OpenAI Codex OAuth
</Note>

## เริ่มต้นอย่างรวดเร็ว

1. ตั้งค่าคีย์ API สำหรับ provider อย่างน้อยหนึ่งราย (เช่น `OPENAI_API_KEY`, `GEMINI_API_KEY` หรือ `OPENROUTER_API_KEY`) หรือเข้าสู่ระบบด้วย OpenAI Codex OAuth
2. ตั้งค่าโมเดลที่คุณต้องการได้ตามต้องการ:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

Codex OAuth ใช้ model ref `openai/gpt-image-2` เดียวกัน เมื่อมีการกำหนดค่า
OAuth profile ของ `openai-codex` ไว้ OpenClaw จะกำหนดเส้นทางคำขอภาพ
ผ่าน OAuth profile เดียวกันนั้น แทนที่จะลองใช้ `OPENAI_API_KEY` ก่อน
การกำหนดค่า image แบบกำหนดเองอย่างชัดเจนใน `models.providers.openai` เช่น API key หรือ
base URL แบบ custom/Azure จะเลือกกลับไปใช้เส้นทาง OpenAI Images API โดยตรง
สำหรับ endpoint แบบ OpenAI-compatible บน LAN เช่น LocalAI ให้คงค่า
`models.providers.openai.baseUrl` แบบกำหนดเองไว้ และเปิดใช้งานอย่างชัดเจนด้วย
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; endpoint ภาพแบบ private/internal
ยังคงถูกบล็อกตามค่าเริ่มต้น

3. สั่ง agent: _"Generate an image of a friendly robot mascot."_

agent จะเรียก `image_generate` โดยอัตโนมัติ ไม่ต้อง allow-list tool — ระบบจะเปิดใช้งานให้ตามค่าเริ่มต้นเมื่อมี provider พร้อมใช้งาน

## เส้นทางที่พบบ่อย

| เป้าหมาย                                            | Model ref                                          | การยืนยันตัวตน                         |
| --------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| การสร้างภาพด้วย OpenAI พร้อมการคิดค่าบริการผ่าน API | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| การสร้างภาพด้วย OpenAI พร้อมการยืนยันตัวตนผ่าน Codex subscription | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| การสร้างภาพด้วย OpenRouter                         | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| การสร้างภาพด้วย Google Gemini                      | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` |

เครื่องมือ `image_generate` ตัวเดียวกันนี้รองรับทั้งการสร้างภาพจากข้อความและการแก้ไข
ภาพอ้างอิง ใช้ `image` สำหรับภาพอ้างอิงหนึ่งภาพ หรือ `images` สำหรับหลายภาพ
ระบบจะส่งต่อคำใบ้เอาต์พุตที่ provider รองรับ เช่น `quality`, `outputFormat` และ
`background` ที่เฉพาะกับ OpenAI เมื่อใช้งานได้ และจะรายงานว่าไม่ได้ใช้งานเมื่อ
provider ไม่รองรับ

## provider ที่รองรับ

| Provider   | โมเดลเริ่มต้น                            | รองรับการแก้ไข                    | การยืนยันตัวตน                                        |
| ---------- | ---------------------------------------- | --------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                            | รองรับ (สูงสุด 4 ภาพ)            | `OPENAI_API_KEY` หรือ OpenAI Codex OAuth              |
| OpenRouter | `google/gemini-3.1-flash-image-preview`  | รองรับ (สูงสุด 5 ภาพนำเข้า)      | `OPENROUTER_API_KEY`                                  |
| Google     | `gemini-3.1-flash-image-preview`         | รองรับ                            | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                |
| fal        | `fal-ai/flux/dev`                        | รองรับ                            | `FAL_KEY`                                             |
| MiniMax    | `image-01`                               | รองรับ (ภาพอ้างอิง subject)      | `MINIMAX_API_KEY` หรือ MiniMax OAuth (`minimax-portal`) |
| ComfyUI    | `workflow`                               | รองรับ (1 ภาพ, กำหนดโดย workflow) | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` สำหรับ cloud |
| Vydra      | `grok-imagine`                           | ไม่รองรับ                         | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                     | รองรับ (สูงสุด 5 ภาพ)            | `XAI_API_KEY`                                         |

ใช้ `action: "list"` เพื่อตรวจสอบ provider และโมเดลที่มีอยู่ใน runtime:

```
/tool image_generate action=list
```

## พารามิเตอร์ของเครื่องมือ

<ParamField path="prompt" type="string" required>
พรอมป์ต์สำหรับการสร้างภาพ จำเป็นสำหรับ `action: "generate"`
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
ใช้ `"list"` เพื่อตรวจสอบ provider และโมเดลที่มีอยู่ใน runtime
</ParamField>

<ParamField path="model" type="string">
กำหนด provider/model ทับ เช่น `openai/gpt-image-2`
</ParamField>

<ParamField path="image" type="string">
พาธภาพอ้างอิงเดี่ยวหรือ URL สำหรับโหมดแก้ไข
</ParamField>

<ParamField path="images" type="string[]">
ภาพอ้างอิงหลายภาพสำหรับโหมดแก้ไข (สูงสุด 5 ภาพ)
</ParamField>

<ParamField path="size" type="string">
คำใบ้ขนาด: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`
</ParamField>

<ParamField path="aspectRatio" type="string">
อัตราส่วนภาพ: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
คำใบ้ความละเอียด
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
คำใบ้คุณภาพเมื่อ provider รองรับ
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
คำใบ้รูปแบบเอาต์พุตเมื่อ provider รองรับ
</ParamField>

<ParamField path="count" type="number">
จำนวนภาพที่จะสร้าง (1–4)
</ParamField>

<ParamField path="timeoutMs" type="number">
timeout ของคำขอ provider แบบไม่บังคับ หน่วยเป็นมิลลิวินาที
</ParamField>

<ParamField path="filename" type="string">
คำใบ้ชื่อไฟล์เอาต์พุต
</ParamField>

<ParamField path="openai" type="object">
คำใบ้เฉพาะ OpenAI: `background`, `moderation`, `outputCompression` และ `user`
</ParamField>

ไม่ใช่ทุก provider ที่รองรับทุกพารามิเตอร์ เมื่อ provider สำรองรองรับตัวเลือกเรขาคณิต
ที่ใกล้เคียงแทนค่าที่ร้องขอแบบตรงตัว OpenClaw จะจับคู่ใหม่ไปยังขนาด อัตราส่วนภาพ
หรือความละเอียดที่รองรับและใกล้ที่สุดก่อนส่งคำขอ คำใบ้เอาต์พุตที่ไม่รองรับ เช่น `quality` หรือ
`outputFormat` จะถูกตัดทิ้งสำหรับ provider ที่ไม่ได้ประกาศการรองรับ และจะถูกรายงานในผลลัพธ์ของ tool

ผลลัพธ์ของ tool จะรายงานการตั้งค่าที่ถูกใช้จริง เมื่อ OpenClaw จับคู่ค่าทางเรขาคณิตใหม่ระหว่าง
provider fallback ค่า `size`, `aspectRatio` และ `resolution` ที่ส่งกลับ
จะสะท้อนค่าที่ถูกส่งจริง และ `details.normalization` จะเก็บการแปลค่าจากที่ร้องขอไปเป็นค่าที่ถูกใช้

## การกำหนดค่า

### การเลือกโมเดล

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
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

### ลำดับการเลือก provider

เมื่อสร้างภาพ OpenClaw จะลองใช้ provider ตามลำดับนี้:

1. **พารามิเตอร์ `model`** จากการเรียก tool (ถ้า agent ระบุมา)
2. **`imageGenerationModel.primary`** จาก config
3. **`imageGenerationModel.fallbacks`** ตามลำดับ
4. **การตรวจจับอัตโนมัติ** — ใช้เฉพาะค่าเริ่มต้นของ provider ที่มีการยืนยันตัวตนรองรับ:
   - provider เริ่มต้นปัจจุบันก่อน
   - ตามด้วย provider สำหรับการสร้างภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id

หาก provider หนึ่งล้มเหลว (ข้อผิดพลาดการยืนยันตัวตน, rate limit ฯลฯ) ระบบจะลอง candidate ถัดไปที่กำหนดค่าไว้โดยอัตโนมัติ หากทั้งหมดล้มเหลว ข้อผิดพลาดจะรวมรายละเอียดจากแต่ละความพยายาม

หมายเหตุ:

- การ override `model` ต่อการเรียกหนึ่งครั้งเป็นแบบตรงตัว: OpenClaw จะลองเฉพาะ provider/model
  นั้นเท่านั้น และจะไม่ไปต่อยัง provider แบบ primary/fallback หรือ provider ที่ตรวจจับอัตโนมัติ
  จาก config
- การตรวจจับอัตโนมัติรับรู้สถานะการยืนยันตัวตน provider จะถูกเพิ่มเข้าสู่รายการ candidate
  ก็ต่อเมื่อ OpenClaw สามารถยืนยันตัวตนกับ provider นั้นได้จริง
- การตรวจจับอัตโนมัติเปิดใช้งานตามค่าเริ่มต้น ตั้งค่า
  `agents.defaults.mediaGenerationAutoProviderFallback: false` หากคุณต้องการให้การสร้างภาพ
  ใช้เฉพาะรายการ `model`, `primary` และ `fallbacks`
  ที่ระบุอย่างชัดเจน
- ใช้ `action: "list"` เพื่อตรวจสอบ provider ที่ลงทะเบียนอยู่ในปัจจุบัน
  โมเดลเริ่มต้นของแต่ละรายการ และคำใบ้ env var สำหรับการยืนยันตัวตน

### การแก้ไขภาพ

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI และ xAI รองรับการแก้ไขภาพอ้างอิง ส่งพาธหรือ URL ของภาพอ้างอิงได้ดังนี้:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google และ xAI รองรับภาพอ้างอิงสูงสุด 5 ภาพผ่านพารามิเตอร์ `images` ส่วน fal, MiniMax และ ComfyUI รองรับ 1 ภาพ

### โมเดลภาพของ OpenRouter

การสร้างภาพผ่าน OpenRouter ใช้ `OPENROUTER_API_KEY` เดียวกันและกำหนดเส้นทางผ่าน chat completions image API ของ OpenRouter เลือกโมเดลภาพของ OpenRouter ด้วยคำนำหน้า `openrouter/`:

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

OpenClaw จะส่งต่อ `prompt`, `count`, ภาพอ้างอิง และคำใบ้ `aspectRatio` / `resolution`
ที่เข้ากันได้กับ Gemini ไปยัง OpenRouter shortcut ของโมเดลภาพ OpenRouter ที่บันเดิลมาในปัจจุบันได้แก่ `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` และ `openai/gpt-5.4-image-2`; ใช้ `action: "list"` เพื่อดูว่าปลั๊กอินที่คุณกำหนดค่าไว้เปิดเผยอะไรบ้าง

### OpenAI `gpt-image-2`

การสร้างภาพด้วย OpenAI ใช้ค่าเริ่มต้นเป็น `openai/gpt-image-2` หากมีการกำหนดค่า
OAuth profile ของ `openai-codex` ไว้ OpenClaw จะนำ OAuth profile เดียวกัน
ที่ใช้โดยโมเดลแชตแบบ Codex subscription มาใช้ซ้ำ และส่งคำขอภาพ
ผ่านแบ็กเอนด์ Codex Responses base URL แบบ Codex รุ่นเก่า เช่น
`https://chatgpt.com/backend-api` จะถูกทำให้เป็นมาตรฐานเป็น
`https://chatgpt.com/backend-api/codex` สำหรับคำขอภาพ ระบบจะไม่
fallback ไปใช้ `OPENAI_API_KEY` สำหรับคำขอนั้นแบบเงียบ ๆ หากต้องการบังคับให้ใช้เส้นทาง
OpenAI Images API โดยตรง ให้กำหนดค่า `models.providers.openai` อย่างชัดเจนด้วย API
key, base URL แบบกำหนดเอง หรือ endpoint ของ Azure โมเดลรุ่นเก่า
`openai/gpt-image-1` ยังสามารถเลือกได้อย่างชัดเจน แต่คำขอสร้างภาพและแก้ไขภาพ
ใหม่ของ OpenAI ควรใช้ `gpt-image-2`

`gpt-image-2` รองรับทั้งการสร้างภาพจากข้อความและการแก้ไขภาพอ้างอิง
ผ่านเครื่องมือ `image_generate` เดียวกัน OpenClaw จะส่งต่อ `prompt`,
`count`, `size`, `quality`, `outputFormat` และภาพอ้างอิงไปยัง OpenAI
OpenAI จะไม่ได้รับ `aspectRatio` หรือ `resolution` โดยตรง; หากเป็นไปได้
OpenClaw จะจับคู่ค่าเหล่านั้นไปเป็น `size` ที่รองรับ มิฉะนั้นเครื่องมือจะรายงานว่าเป็น
override ที่ถูกละเลย

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

`openai.background` รองรับค่า `transparent`, `opaque` หรือ `auto`; เอาต์พุตแบบโปร่งใส
ต้องใช้ `outputFormat` เป็น `png` หรือ `webp` `openai.outputCompression`
ใช้กับเอาต์พุตแบบ JPEG/WebP

สร้างภาพแนวนอน 4K หนึ่งภาพ:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

สร้างภาพสี่เหลี่ยมจัตุรัสสองภาพ:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

แก้ไขภาพอ้างอิงภายในเครื่องหนึ่งภาพ:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

แก้ไขด้วยภาพอ้างอิงหลายภาพ:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

หากต้องการกำหนดเส้นทางการสร้างภาพของ OpenAI ผ่าน deployment ของ Azure OpenAI แทน
`api.openai.com` โปรดดู [Azure OpenAI endpoints](/th/providers/openai#azure-openai-endpoints)
ในเอกสาร provider ของ OpenAI

การสร้างภาพด้วย MiniMax พร้อมใช้งานผ่านทั้งสองเส้นทางการยืนยันตัวตน MiniMax ที่บันเดิลมา:

- `minimax/image-01` สำหรับการตั้งค่าด้วย API key
- `minimax-portal/image-01` สำหรับการตั้งค่าด้วย OAuth

## ความสามารถของ provider

| ความสามารถ              | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| ----------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| สร้าง                   | รองรับ (สูงสุด 4)    | รองรับ (สูงสุด 4)    | รองรับ (สูงสุด 4)   | รองรับ (สูงสุด 9)          | รองรับ (เอาต์พุตตามที่ workflow กำหนด) | รองรับ (1) | รองรับ (สูงสุด 4)    |
| แก้ไข/ภาพอ้างอิง       | รองรับ (สูงสุด 5 ภาพ) | รองรับ (สูงสุด 5 ภาพ) | รองรับ (1 ภาพ)      | รองรับ (1 ภาพ, subject ref) | รองรับ (1 ภาพ, กำหนดโดย workflow) | ไม่รองรับ | รองรับ (สูงสุด 5 ภาพ) |
| ควบคุมขนาด             | รองรับ (สูงสุด 4K)   | รองรับ               | รองรับ              | ไม่รองรับ                  | ไม่รองรับ                           | ไม่รองรับ | ไม่รองรับ            |
| อัตราส่วนภาพ           | ไม่รองรับ            | รองรับ               | รองรับ (เฉพาะการสร้าง) | รองรับ                     | ไม่รองรับ                           | ไม่รองรับ | รองรับ               |
| ความละเอียด (1K/2K/4K) | ไม่รองรับ            | รองรับ               | รองรับ              | ไม่รองรับ                  | ไม่รองรับ                           | ไม่รองรับ | รองรับ (1K/2K)       |

### xAI `grok-imagine-image`

provider xAI ที่บันเดิลมาใช้ `/v1/images/generations` สำหรับคำขอที่มีเฉพาะ prompt
และใช้ `/v1/images/edits` เมื่อมี `image` หรือ `images`

- โมเดล: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- จำนวน: สูงสุด 4
- ภาพอ้างอิง: `image` หนึ่งรายการ หรือ `images` สูงสุดห้ารายการ
- อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- ความละเอียด: `1K`, `2K`
- เอาต์พุต: ส่งคืนเป็นไฟล์แนบภาพที่ OpenClaw จัดการให้

OpenClaw ตั้งใจไม่เปิดเผย `quality`, `mask`, `user` ที่เป็น native ของ xAI หรือ
อัตราส่วนภาพ native-only เพิ่มเติม จนกว่าจะมีตัวควบคุมเหล่านั้นในสัญญา
`image_generate` แบบใช้ร่วมกันข้าม provider

## ที่เกี่ยวข้อง

- [ภาพรวม Tools](/th/tools) — tools ของ agent ทั้งหมดที่มีให้ใช้งาน
- [fal](/th/providers/fal) — การตั้งค่า provider ภาพและวิดีโอของ fal
- [ComfyUI](/th/providers/comfy) — การตั้งค่า workflow ของ ComfyUI ภายในเครื่องและ Comfy Cloud
- [Google (Gemini)](/th/providers/google) — การตั้งค่า provider ภาพของ Gemini
- [MiniMax](/th/providers/minimax) — การตั้งค่า provider ภาพของ MiniMax
- [OpenAI](/th/providers/openai) — การตั้งค่า provider OpenAI Images
- [Vydra](/th/providers/vydra) — การตั้งค่าภาพ วิดีโอ และเสียงของ Vydra
- [xAI](/th/providers/xai) — การตั้งค่า Grok สำหรับภาพ วิดีโอ การค้นหา การรันโค้ด และ TTS
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — config `imageGenerationModel`
- [Models](/th/concepts/models) — การกำหนดค่าโมเดลและ fallback
