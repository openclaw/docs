---
read_when:
    - การสร้างเพลงหรือเสียงผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลสำหรับการสร้างเพลง
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ music_generate
sidebarTitle: Music generation
summary: สร้างเพลงผ่าน music_generate ในเวิร์กโฟลว์ของ ComfyUI, fal, Google Lyria, MiniMax และ OpenRouter
title: การสร้างเพลง
x-i18n:
    generated_at: "2026-06-27T18:29:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

เครื่องมือ `music_generate` ช่วยให้เอเจนต์สร้างเพลงหรือเสียงผ่านความสามารถการสร้างเพลงแบบใช้ร่วมกันกับผู้ให้บริการที่กำหนดค่าไว้ ได้แก่ ComfyUI, fal, Google, MiniMax และ OpenRouter ในปัจจุบัน

สำหรับการรันเอเจนต์ที่มีเซสชันรองรับ OpenClaw จะเริ่มการสร้างเพลงเป็นงานเบื้องหลัง ติดตามงานนั้นในบัญชีแยกประเภทงาน จากนั้นปลุกเอเจนต์อีกครั้งเมื่อแทร็กพร้อม เพื่อให้เอเจนต์แจ้งผู้ใช้และแนบเสียงที่เสร็จแล้วได้ เอเจนต์สำหรับการทำให้เสร็จจะทำตามโหมดการตอบกลับที่มองเห็นได้ตามปกติของเซสชัน: ส่งคำตอบสุดท้ายโดยอัตโนมัติเมื่อกำหนดค่าไว้ หรือใช้ `message(action="send")` เมื่อเซสชันต้องใช้เครื่องมือข้อความ หากเซสชันของผู้ขอไม่ทำงานหรือการปลุกที่ใช้งานอยู่ล้มเหลว และยังมีเสียงที่สร้างแล้วบางส่วนขาดหายไปจากคำตอบเมื่อเสร็จสิ้น OpenClaw จะส่งการสำรองโดยตรงแบบ idempotent พร้อมเฉพาะเสียงที่ขาดหายไป

<Note>
เครื่องมือแบบใช้ร่วมกันในตัวจะปรากฏเฉพาะเมื่อมีผู้ให้บริการสร้างเพลงอย่างน้อยหนึ่งรายพร้อมใช้งาน หากคุณไม่เห็น `music_generate` ในเครื่องมือของเอเจนต์ ให้กำหนดค่า `agents.defaults.musicGenerationModel` หรือตั้งค่าคีย์ API ของผู้ให้บริการ
</Note>

## เริ่มต้นอย่างรวดเร็ว

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        ตั้งค่าคีย์ API สำหรับผู้ให้บริการอย่างน้อยหนึ่งราย เช่น
        `GEMINI_API_KEY` หรือ `MINIMAX_API_KEY`
      </Step>
      <Step title="Pick a default model (optional)">
        ```json5
        {
          agents: {
            defaults: {
              musicGenerationModel: {
                primary: "google/lyria-3-clip-preview",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Ask the agent">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        เอเจนต์จะเรียก `music_generate` โดยอัตโนมัติ ไม่จำเป็นต้องเพิ่มเครื่องมือลงในรายการอนุญาต
      </Step>
    </Steps>

    สำหรับบริบทแบบซิงโครนัสโดยตรงที่ไม่มีการรันเอเจนต์ที่มีเซสชันรองรับ เครื่องมือในตัวยังคงถอยกลับไปสร้างแบบ inline และส่งคืนพาธสื่อสุดท้ายในผลลัพธ์ของเครื่องมือ

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        กำหนดค่า `plugins.entries.comfy.config.music` ด้วย JSON ของ workflow และโหนด prompt/output
      </Step>
      <Step title="Cloud auth (optional)">
        สำหรับ Comfy Cloud ให้ตั้งค่า `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY`
      </Step>
      <Step title="Call the tool">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

ตัวอย่างพรอมป์:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ | โมเดลเริ่มต้น | อินพุตอ้างอิง | การควบคุมที่รองรับ | การยืนยันตัวตน |
| ---------- | ---------------------------- | ---------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | สูงสุด 1 รูปภาพ    | เพลงหรือเสียงที่ workflow กำหนด                       | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | ไม่มี             | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` หรือ `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | สูงสุด 10 รูปภาพ  | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | ไม่มี             | `lyrics`, `instrumental`, `format=mp3`                | `MINIMAX_API_KEY` หรือ MiniMax OAuth     |
| OpenRouter | `google/lyria-3-pro-preview` | สูงสุด 1 รูปภาพ    | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

### เมทริกซ์ความสามารถ

สัญญาโหมดแบบชัดเจนที่ `music_generate`, การทดสอบสัญญา และการกวาด live แบบใช้ร่วมกันใช้:

| ผู้ให้บริการ | `generate` | `edit` | ขีดจำกัดการแก้ไข | เลน live แบบใช้ร่วมกัน |
| ---------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 รูปภาพ    | ไม่อยู่ในการกวาดแบบใช้ร่วมกัน; ครอบคลุมโดย `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | ไม่มี       | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 รูปภาพ  | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | ไม่มี       | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 รูปภาพ    | `generate`, `edit`                                                        |

ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการและโมเดลแบบใช้ร่วมกันที่พร้อมใช้งานใน runtime:

```text
/tool music_generate action=list
```

ใช้ `action: "status"` เพื่อตรวจสอบงานเพลงที่มีเซสชันรองรับซึ่งกำลังใช้งานอยู่:

```text
/tool music_generate action=status
```

ตัวอย่างการสร้างโดยตรง:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## พารามิเตอร์ของเครื่องมือ

<ParamField path="prompt" type="string" required>
  พรอมป์สำหรับการสร้างเพลง จำเป็นสำหรับ `action: "generate"`
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` ส่งคืนงานเซสชันปัจจุบัน; `"list"` ตรวจสอบผู้ให้บริการ
</ParamField>
<ParamField path="model" type="string">
  การแทนที่ผู้ให้บริการ/โมเดล เช่น `google/lyria-3-pro-preview`,
  `comfy/workflow`
</ParamField>
<ParamField path="lyrics" type="string">
  เนื้อเพลงแบบเลือกได้เมื่อผู้ให้บริการรองรับอินพุตเนื้อเพลงอย่างชัดเจน
</ParamField>
<ParamField path="instrumental" type="boolean">
  ขอเอาต์พุตเฉพาะดนตรีบรรเลงเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="image" type="string">
  พาธหรือ URL ของรูปภาพอ้างอิงเดียว
</ParamField>
<ParamField path="images" type="string[]">
  รูปภาพอ้างอิงหลายรูป (สูงสุด 10 รูปในผู้ให้บริการที่รองรับ)
</ParamField>
<ParamField path="durationSeconds" type="number">
  ระยะเวลาเป้าหมายเป็นวินาทีเมื่อผู้ให้บริการรองรับคำใบ้ระยะเวลา
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  คำใบ้รูปแบบเอาต์พุตเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="filename" type="string">คำใบ้ชื่อไฟล์เอาต์พุต</ParamField>

<Note>
ผู้ให้บริการบางรายไม่ได้รองรับพารามิเตอร์ทั้งหมด OpenClaw ยังคงตรวจสอบขีดจำกัดแบบแข็ง เช่น จำนวนอินพุต ก่อนส่งคำขอ เมื่อผู้ให้บริการรองรับระยะเวลาแต่ใช้ค่าสูงสุดที่สั้นกว่าค่าที่ขอ OpenClaw จะจำกัดให้อยู่ที่ระยะเวลาที่รองรับซึ่งใกล้ที่สุด คำใบ้แบบเลือกได้ที่ไม่รองรับจริงจะถูกละเว้นพร้อมคำเตือนเมื่อผู้ให้บริการหรือโมเดลที่เลือกไม่สามารถทำตามได้ ผลลัพธ์ของเครื่องมือรายงานการตั้งค่าที่นำไปใช้; `details.normalization` บันทึกการจับคู่จากค่าที่ขอไปยังค่าที่นำไปใช้
</Note>

การหมดเวลาของคำขอผู้ให้บริการเป็นการกำหนดค่าสำหรับผู้ปฏิบัติงานเท่านั้น OpenClaw ใช้ `agents.defaults.musicGenerationModel.timeoutMs` เมื่อกำหนดค่าไว้ เพิ่มค่าที่ต่ำกว่า 120000ms เป็น 120000ms และมิฉะนั้นจะใช้ค่าเริ่มต้นสำหรับคำขอผู้ให้บริการเป็น 300000ms

## พฤติกรรมแบบอะซิงโครนัส

การสร้างเพลงที่มีเซสชันรองรับจะทำงานเป็นงานเบื้องหลัง:

- **งานเบื้องหลัง:** `music_generate` สร้างงานเบื้องหลัง ส่งคืนคำตอบว่าเริ่มแล้ว/งานทันที และโพสต์แทร็กที่เสร็จแล้วในภายหลังในข้อความติดตามผลของเอเจนต์
- **การป้องกันรายการซ้ำ:** ขณะที่งานอยู่ในสถานะ `queued` หรือ `running` การเรียก `music_generate` ภายหลังในเซสชันเดียวกันจะส่งคืนสถานะงานแทนการเริ่มการสร้างอีกครั้ง ใช้ `action: "status"` เพื่อตรวจสอบอย่างชัดเจน
- **การค้นหาสถานะ:** `openclaw tasks list` หรือ `openclaw tasks show <taskId>` ตรวจสอบสถานะที่เข้าคิว กำลังทำงาน และสิ้นสุดแล้ว
- **การปลุกเมื่อเสร็จ:** OpenClaw แทรกเหตุการณ์การทำให้เสร็จภายในกลับเข้าไปในเซสชันเดียวกัน เพื่อให้โมเดลเขียนข้อความติดตามผลที่ผู้ใช้เห็นได้ด้วยตัวเอง
- **คำใบ้พรอมป์:** รอบของผู้ใช้/แบบ manual ภายหลังในเซสชันเดียวกันจะได้รับคำใบ้ runtime เล็กน้อยเมื่อมีงานเพลงกำลังดำเนินอยู่ เพื่อให้โมเดลไม่เรียก `music_generate` ซ้ำโดยไม่รู้ตัว
- **การสำรองเมื่อไม่มีเซสชัน:** บริบทโดยตรง/ในเครื่องที่ไม่มีเซสชันเอเจนต์จริงจะรัน inline และส่งคืนผลลัพธ์เสียงสุดท้ายในรอบเดียวกัน

### วงจรชีวิตของงาน

| สถานะ | ความหมาย |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | สร้างงานแล้ว กำลังรอให้ผู้ให้บริการยอมรับงาน |
| `running`   | ผู้ให้บริการกำลังประมวลผล (โดยทั่วไป 30 วินาทีถึง 3 นาที ขึ้นอยู่กับผู้ให้บริการและระยะเวลา) |
| `succeeded` | แทร็กพร้อมแล้ว; เอเจนต์ตื่นและโพสต์ไปยังการสนทนา |
| `failed`    | ข้อผิดพลาดของผู้ให้บริการหรือหมดเวลา; เอเจนต์ตื่นพร้อมรายละเอียดข้อผิดพลาด |

ตรวจสอบสถานะจาก CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## การกำหนดค่า

### การเลือกโมเดล

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### ลำดับการเลือกผู้ให้บริการ

OpenClaw ลองผู้ให้บริการตามลำดับนี้:

1. พารามิเตอร์ `model` จากการเรียกเครื่องมือ (หากเอเจนต์ระบุไว้)
2. `musicGenerationModel.primary` จากการกำหนดค่า
3. `musicGenerationModel.fallbacks` ตามลำดับ
4. การตรวจจับอัตโนมัติโดยใช้เฉพาะค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับ:
   - ผู้ให้บริการเริ่มต้นปัจจุบันก่อน;
   - ผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับรหัสผู้ให้บริการ

หากผู้ให้บริการล้มเหลว ระบบจะลองตัวเลือกถัดไปโดยอัตโนมัติ หากทั้งหมดล้มเหลว ข้อผิดพลาดจะรวมรายละเอียดจากแต่ละความพยายาม

ตั้งค่า `agents.defaults.mediaGenerationAutoProviderFallback: false` เพื่อใช้เฉพาะรายการ `model`, `primary` และ `fallbacks` ที่ระบุอย่างชัดเจน

## หมายเหตุของผู้ให้บริการ

<AccordionGroup>
  <Accordion title="ComfyUI">
    ขับเคลื่อนด้วย workflow และขึ้นอยู่กับกราฟที่กำหนดค่าไว้พร้อมการแมปโหนดสำหรับฟิลด์ prompt/output Plugin `comfy` ที่รวมมาเชื่อมเข้ากับเครื่องมือ `music_generate` แบบใช้ร่วมกันผ่านรีจิสทรีผู้ให้บริการสร้างเพลง
  </Accordion>
  <Accordion title="fal">
    ใช้ endpoint ของโมเดล fal ผ่านพาธการยืนยันตัวตนของผู้ให้บริการแบบใช้ร่วมกัน ผู้ให้บริการที่รวมมามีค่าเริ่มต้นเป็น `fal-ai/minimax-music/v2.6` และยังเปิดเผย `fal-ai/ace-step/prompt-to-audio` และ `fal-ai/stable-audio-25/text-to-audio` สำหรับคำขอ prompt-to-audio
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    ใช้การสร้างแบบ batch ของ Lyria 3 โฟลว์ที่รวมมาในปัจจุบันรองรับพรอมป์ ข้อความเนื้อเพลงแบบเลือกได้ และรูปภาพอ้างอิงแบบเลือกได้
  </Accordion>
  <Accordion title="MiniMax">
    ใช้ endpoint แบบ batch `music_generation` รองรับพรอมป์ เนื้อเพลงแบบเลือกได้ โหมดดนตรีบรรเลง และเอาต์พุต mp3 ผ่านการยืนยันตัวตนด้วยคีย์ API ของ `minimax` หรือ OAuth ของ `minimax-portal`
  </Accordion>
  <Accordion title="OpenRouter">
    ใช้เอาต์พุตเสียงจาก chat completions ของ OpenRouter โดยเปิดใช้ streaming ผู้ให้บริการที่รวมมามีค่าเริ่มต้นเป็น `google/lyria-3-pro-preview` และยังเปิดเผย `openrouter/google/lyria-3-clip-preview`
  </Accordion>
</AccordionGroup>

## การเลือกพาธที่เหมาะสม

- **แบบมีผู้ให้บริการแบบใช้ร่วมกันรองรับ** เมื่อคุณต้องการการเลือกโมเดล การสลับผู้ให้บริการเมื่อเกิดข้อผิดพลาด และโฟลว์งาน/สถานะแบบอะซิงโครนัสในตัว
- **พาธ Plugin (ComfyUI)** เมื่อคุณต้องใช้กราฟ workflow แบบกำหนดเองหรือผู้ให้บริการที่ไม่ได้เป็นส่วนหนึ่งของความสามารถเพลงแบบใช้ร่วมกันที่รวมมา

หากคุณกำลังดีบักพฤติกรรมเฉพาะของ ComfyUI โปรดดู
[ComfyUI](/th/providers/comfy) หากคุณกำลังดีบักพฤติกรรมของผู้ให้บริการที่ใช้ร่วมกัน
ให้เริ่มจาก [fal](/th/providers/fal), [Google (Gemini)](/th/providers/google),
[MiniMax](/th/providers/minimax) หรือ [OpenRouter](/th/providers/openrouter)

## โหมดความสามารถของผู้ให้บริการ

สัญญาการสร้างเพลงที่ใช้ร่วมกันรองรับการประกาศโหมดอย่างชัดเจน:

- `generate` สำหรับการสร้างจากพรอมป์เท่านั้น
- `edit` เมื่อคำขอมีรูปภาพอ้างอิงอย่างน้อยหนึ่งรูป

การใช้งานผู้ให้บริการใหม่ควรใช้บล็อกโหมดที่ชัดเจน:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

ฟิลด์แบบแบนดั้งเดิม เช่น `maxInputImages`, `supportsLyrics` และ
`supportsFormat` **ไม่** เพียงพอสำหรับประกาศการรองรับการแก้ไข ผู้ให้บริการ
ควรประกาศ `generate` และ `edit` อย่างชัดเจน เพื่อให้การทดสอบแบบสด
การทดสอบสัญญา และเครื่องมือ `music_generate` ที่ใช้ร่วมกันสามารถตรวจสอบ
การรองรับโหมดได้อย่างกำหนดแน่นอน

## การทดสอบแบบสด

ความครอบคลุมแบบสดที่ต้องเลือกเปิดใช้สำหรับผู้ให้บริการที่บันเดิลและใช้ร่วมกัน:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

ตัวครอบของ repo:

```bash
pnpm test:live:media music
```

ไฟล์สดนี้ใช้ env vars ของผู้ให้บริการที่ส่งออกไว้แล้วก่อนโปรไฟล์การยืนยันตัวตน
ที่จัดเก็บไว้โดยค่าเริ่มต้น และรันความครอบคลุมทั้ง `generate` และ `edit`
ที่ประกาศไว้เมื่อผู้ให้บริการเปิดใช้โหมดแก้ไข ความครอบคลุมในปัจจุบัน:

- `google`: `generate` รวมถึง `edit`
- `fal`: `generate` เท่านั้น
- `minimax`: `generate` เท่านั้น
- `openrouter`: `generate` รวมถึง `edit`
- `comfy`: ความครอบคลุมแบบสดของ Comfy แยกต่างหาก ไม่ใช่การกวาดตรวจผู้ให้บริการที่ใช้ร่วมกัน

ความครอบคลุมแบบสดที่ต้องเลือกเปิดใช้สำหรับเส้นทางเพลง ComfyUI ที่บันเดิลไว้:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

ไฟล์สดของ Comfy ยังครอบคลุมเวิร์กโฟลว์รูปภาพและวิดีโอของ comfy ด้วยเมื่อมีการกำหนดค่า
ส่วนเหล่านั้น

## ที่เกี่ยวข้อง

- [งานเบื้องหลัง](/th/automation/tasks) — การติดตามงานสำหรับการรัน `music_generate` แบบแยกออก
- [ComfyUI](/th/providers/comfy)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — การกำหนดค่า `musicGenerationModel`
- [Google (Gemini)](/th/providers/google)
- [MiniMax](/th/providers/minimax)
- [โมเดล](/th/concepts/models) — การกำหนดค่าโมเดลและการสลับเมื่อเกิดความล้มเหลว
- [ภาพรวมเครื่องมือ](/th/tools)
