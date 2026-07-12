---
read_when:
    - การสร้างเพลงหรือเสียงผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลสำหรับสร้างเพลง
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ music_generate
sidebarTitle: Music generation
summary: สร้างเพลงผ่าน `music_generate` ด้วยเวิร์กโฟลว์ของ ComfyUI, fal, Google Lyria, MiniMax และ OpenRouter
title: การสร้างเพลง
x-i18n:
    generated_at: "2026-07-12T16:49:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

เครื่องมือ `music_generate` สร้างเพลงหรือเสียงผ่านความสามารถการสร้างเพลงแบบใช้ร่วมกัน ซึ่งรองรับโดย ComfyUI, fal, Google, MiniMax และ OpenRouter

<Note>
`music_generate` จะปรากฏเฉพาะเมื่อมีผู้ให้บริการสร้างเพลงอย่างน้อยหนึ่งรายพร้อมใช้งาน ได้แก่ การกำหนดค่า `agents.defaults.musicGenerationModel` อย่างชัดเจน หรือผู้ให้บริการที่กำหนดค่าการยืนยันตัวตนแล้ว (เช่น ตั้งค่าคีย์ API)
</Note>

สำหรับการเรียกใช้เอเจนต์ที่มีเซสชันรองรับ `music_generate` จะเริ่มเป็นงานเบื้องหลัง ติดตามความคืบหน้าในบัญชีแยกประเภทงาน แล้วปลุกเอเจนต์เมื่อแทร็กพร้อม เพื่อให้เอเจนต์แจ้งผู้ใช้และแนบเสียงที่เสร็จสมบูรณ์ เอเจนต์ที่ดำเนินการเสร็จสิ้นจะปฏิบัติตามสัญญาการตอบกลับที่มองเห็นได้ของเซสชัน ได้แก่ ตอบกลับสุดท้ายโดยอัตโนมัติเมื่อกำหนดค่าไว้ หรือใช้ `message(action="send")` เมื่อเซสชันกำหนดให้ใช้เครื่องมือส่งข้อความ หากเซสชันของผู้ร้องขอไม่ได้ใช้งานหรือการปลุกเซสชันล้มเหลว และเสียงที่สร้างขึ้นยังขาดหายไปจากการตอบกลับ OpenClaw จะส่งทางเลือกสำรองโดยตรงแบบทำซ้ำได้อย่างปลอดภัย โดยมีเฉพาะเสียงที่ขาดหายไป

## เริ่มต้นอย่างรวดเร็ว

<Tabs>
  <Tab title="รองรับโดยผู้ให้บริการแบบใช้ร่วมกัน">
    <Steps>
      <Step title="กำหนดค่าการยืนยันตัวตน">
        ตั้งค่าคีย์ API สำหรับผู้ให้บริการอย่างน้อยหนึ่งราย เช่น
        `GEMINI_API_KEY` หรือ `MINIMAX_API_KEY`
      </Step>
      <Step title="เลือกโมเดลเริ่มต้น (ไม่บังคับ)">
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
      <Step title="ขอให้เอเจนต์ดำเนินการ">
        _"สร้างแทร็กซินธ์ป๊อปจังหวะสนุกเกี่ยวกับการขับรถยามค่ำคืนผ่านเมืองแสงนีออน"_

        เอเจนต์จะเรียก `music_generate` โดยอัตโนมัติ ไม่จำเป็นต้องเพิ่มเครื่องมือลงในรายการอนุญาต
      </Step>
    </Steps>

    หากไม่มีการเรียกใช้เอเจนต์ที่มีเซสชันรองรับ (บริบทโดยตรง/ภายในเครื่อง) เครื่องมือจะทำงานแบบอินไลน์และส่งคืนพาธสื่อสุดท้ายในผลลัพธ์ของเครื่องมือเดียวกัน

  </Tab>
  <Tab title="เวิร์กโฟลว์ ComfyUI">
    <Steps>
      <Step title="กำหนดค่าเวิร์กโฟลว์">
        กำหนดค่า `plugins.entries.comfy.config.music` ด้วย JSON ของเวิร์กโฟลว์ รวมถึงโหนดพรอมต์และเอาต์พุต
      </Step>
      <Step title="การยืนยันตัวตนบนคลาวด์ (ไม่บังคับ)">
        สำหรับ Comfy Cloud ให้ตั้งค่า `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY`
      </Step>
      <Step title="เรียกเครื่องมือ">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

ตัวอย่างพรอมต์:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการ/โมเดลที่พร้อมใช้งาน และใช้ `action: "status"` เพื่อตรวจสอบงานเพลงที่มีเซสชันรองรับซึ่งกำลังทำงานอยู่:

```text
/tool music_generate action=list
/tool music_generate action=status
```

ตัวอย่างการสร้างโดยตรง:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ | โมเดลเริ่มต้น                 | อินพุตอ้างอิง     | ตัวควบคุมที่รองรับ                                    | การยืนยันตัวตน                        |
| ---------- | ---------------------------- | ---------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | สูงสุด 1 รูปภาพ   | เพลงหรือเสียงที่กำหนดโดยเวิร์กโฟลว์                    | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | ไม่มี             | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` หรือ `FAL_API_KEY`           |
| Google     | `lyria-3-clip-preview`       | สูงสุด 10 รูปภาพ  | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | ไม่มี             | `lyrics`, `instrumental`, `format` (เฉพาะ mp3)         | `MINIMAX_API_KEY` หรือ MiniMax OAuth   |
| OpenRouter | `google/lyria-3-pro-preview` | สูงสุด 1 รูปภาพ   | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

MiniMax ลงทะเบียนรหัสผู้ให้บริการสองรหัสที่ใช้โมเดลชุดเดียวกัน ได้แก่ `minimax` สำหรับการยืนยันตัวตนด้วยคีย์ API และ `minimax-portal` สำหรับ OAuth การอ้างอิงโมเดลจะเป็นไปตามเส้นทางการยืนยันตัวตน (`minimax/music-2.6` เทียบกับ `minimax-portal/music-2.6`) โปรดดู [MiniMax](/th/providers/minimax#music-generation)

fal ยังมี `fal-ai/ace-step/prompt-to-audio` (wav, ไม่มีเนื้อเพลง, ไม่มีตัวเลือกเปิด/ปิดโหมดบรรเลง) และ `fal-ai/stable-audio-25/text-to-audio` (wav, ใช้เฉพาะพรอมต์) นอกเหนือจากโมเดลเริ่มต้นที่รองรับโดย MiniMax โมเดลเริ่มต้น `lyria-3-clip-preview` ของ Google ส่งออกเฉพาะ mp3 ส่วน `lyria-3-pro-preview` รองรับ wav ด้วย MiniMax ยังมี `music-2.6-free`, `music-cover` และ `music-cover-free` ส่วน OpenRouter ยังมี `google/lyria-3-clip-preview`

### เมทริกซ์ความสามารถ

สัญญาโหมดที่ชัดเจนซึ่งใช้โดย `music_generate` การทดสอบสัญญา และการกวาดตรวจสอบแบบสดที่ใช้ร่วมกัน:

| ผู้ให้บริการ | `generate` | `edit` | ขีดจำกัดการแก้ไข | เลนการทดสอบแบบสดที่ใช้ร่วมกัน                                             |
| ---------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 รูปภาพ    | ไม่อยู่ในการกวาดตรวจสอบที่ใช้ร่วมกัน ครอบคลุมโดย `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | ไม่มี       | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 รูปภาพ   | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | ไม่มี       | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 รูปภาพ    | `generate`, `edit`                                                        |

## พารามิเตอร์ของเครื่องมือ

<ParamField path="prompt" type="string" required>
  พรอมต์สำหรับสร้างเพลง จำเป็นสำหรับ `action: "generate"`
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` ส่งคืนงานปัจจุบันของเซสชัน ส่วน `"list"` ใช้ตรวจสอบผู้ให้บริการ
</ParamField>
<ParamField path="model" type="string">
  แทนที่ผู้ให้บริการ/โมเดล (เช่น `google/lyria-3-pro-preview`,
  `comfy/workflow`)
</ParamField>
<ParamField path="lyrics" type="string">
  เนื้อเพลงแบบไม่บังคับ เมื่อผู้ให้บริการรองรับการป้อนเนื้อเพลงโดยตรง
</ParamField>
<ParamField path="instrumental" type="boolean">
  ขอเอาต์พุตเฉพาะดนตรีบรรเลงเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="image" type="string">
  พาธหรือ URL ของรูปภาพอ้างอิงหนึ่งรูป
</ParamField>
<ParamField path="images" type="string[]">
  รูปภาพอ้างอิงหลายรูป (สูงสุด 10 รูปสำหรับผู้ให้บริการที่รองรับ)
</ParamField>
<ParamField path="durationSeconds" type="number">
  ระยะเวลาเป้าหมายเป็นวินาที เมื่อผู้ให้บริการรองรับคำแนะนำด้านระยะเวลา
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  คำแนะนำรูปแบบเอาต์พุต เมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="filename" type="string">คำแนะนำชื่อไฟล์เอาต์พุต</ParamField>

<Note>
ผู้ให้บริการแต่ละรายไม่ได้รองรับทุกพารามิเตอร์ OpenClaw ยังคงตรวจสอบขีดจำกัดตายตัว เช่น จำนวนอินพุต ก่อนส่งคำขอ เมื่อผู้ให้บริการรองรับระยะเวลาแต่มีค่าสูงสุดสั้นกว่าค่าที่ร้องขอ OpenClaw จะปรับลงเป็นระยะเวลาที่รองรับซึ่งใกล้เคียงที่สุด คำแนะนำแบบไม่บังคับที่ไม่รองรับจริงจะถูกละเว้นพร้อมคำเตือน เมื่อผู้ให้บริการหรือโมเดลที่เลือกไม่สามารถทำตามได้ ผลลัพธ์ของเครื่องมือจะรายงานการตั้งค่าที่นำไปใช้ ส่วน `details.normalization` จะบันทึกการจับคู่จากค่าที่ร้องขอไปยังค่าที่นำไปใช้
</Note>

ระยะหมดเวลาของคำขอไปยังผู้ให้บริการเป็นการกำหนดค่าของผู้ปฏิบัติงานเท่านั้น OpenClaw ใช้ `agents.defaults.musicGenerationModel.timeoutMs` เมื่อมีการกำหนดค่าไว้ ปรับค่าที่ต่ำกว่า 120000ms ขึ้นเป็น 120000ms และหากไม่ได้กำหนดค่า จะใช้ระยะหมดเวลาเริ่มต้นสำหรับคำขอไปยังผู้ให้บริการที่ 300000ms

## ลักษณะการทำงานแบบอะซิงโครนัส

การสร้างเพลงที่มีเซสชันรองรับจะทำงานเป็นงานเบื้องหลัง:

- **งานเบื้องหลัง:** `music_generate` สร้างงานเบื้องหลัง ส่งคืนการตอบกลับว่าเริ่มแล้ว/ข้อมูลงานทันที และโพสต์แทร็กที่เสร็จสมบูรณ์ภายหลังในข้อความติดตามผลจากเอเจนต์
- **การป้องกันงานซ้ำ:** ขณะที่งานอยู่ในสถานะ `queued` หรือ `running` การเรียก `music_generate` ครั้งถัดไปในเซสชันเดียวกันจะส่งคืนสถานะงานแทนการเริ่มสร้างงานใหม่ ใช้ `action: "status"` เพื่อตรวจสอบอย่างชัดเจน คำขอที่ตรงกันและเพิ่งเสร็จสิ้นจะถูกตัดงานซ้ำเป็นเวลา 2 นาทีด้วย
- **การตรวจสอบสถานะ:** `openclaw tasks list` หรือ `openclaw tasks show <taskId>` ใช้ตรวจสอบสถานะที่เข้าคิว กำลังทำงาน และสิ้นสุดแล้ว
- **การปลุกเมื่อเสร็จสิ้น:** OpenClaw แทรกเหตุการณ์เสร็จสิ้นภายในกลับเข้าสู่เซสชันเดิม เพื่อให้โมเดลเขียนข้อความติดตามผลสำหรับผู้ใช้ได้ด้วยตนเอง
- **คำแนะนำในพรอมต์:** เทิร์นจากผู้ใช้/แบบแมนนวลในภายหลังภายในเซสชันเดียวกันจะได้รับคำแนะนำรันไทม์สั้น ๆ เมื่องานเพลงกำลังดำเนินอยู่ เพื่อไม่ให้โมเดลเรียก `music_generate` ซ้ำโดยไม่ตรวจสอบ
- **ทางเลือกสำรองเมื่อไม่มีเซสชัน:** บริบทโดยตรง/ภายในเครื่องที่ไม่มีเซสชันเอเจนต์จริงจะทำงานแบบอินไลน์และส่งคืนผลลัพธ์เสียงสุดท้ายในเทิร์นเดียวกัน

### วงจรชีวิตของงาน

งานเพลงจะแสดงสถานะชุดเดียวกับรีจิสทรีงานทั่วไป (โปรดดู [งานเบื้องหลัง](/th/automation/tasks#task-lifecycle) สำหรับกลไกสถานะฉบับเต็ม ซึ่งรวมถึง `timed_out`, `cancelled` และ `lost`) การเรียกใช้เพลงส่วนใหญ่จะผ่านสถานะต่อไปนี้:

| สถานะ       | ความหมาย                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | สร้างงานแล้ว กำลังรอให้ผู้ให้บริการยอมรับงาน                                                   |
| `running`   | ผู้ให้บริการกำลังประมวลผล (โดยทั่วไป 30 วินาทีถึง 3 นาที ขึ้นอยู่กับผู้ให้บริการและระยะเวลา)       |
| `succeeded` | แทร็กพร้อมแล้ว เอเจนต์จะถูกปลุกและโพสต์แทร็กลงในการสนทนา                                       |
| `failed`    | เกิดข้อผิดพลาดหรือหมดเวลาที่ผู้ให้บริการ เอเจนต์จะถูกปลุกพร้อมรายละเอียดข้อผิดพลาด                |

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

OpenClaw จะลองผู้ให้บริการตามลำดับต่อไปนี้:

1. พารามิเตอร์ `model` จากการเรียกเครื่องมือ (หากเอเจนต์ระบุ)
2. `musicGenerationModel.primary` จากการกำหนดค่า
3. `musicGenerationModel.fallbacks` ตามลำดับ
4. การตรวจหาอัตโนมัติโดยใช้เฉพาะค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับ:
   - ผู้ให้บริการโมเดลข้อความเริ่มต้นปัจจุบันก่อน หากผู้ให้บริการนั้นมีการสร้างเพลงด้วย
   - ผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้รายอื่น ๆ เรียงตามตัวอักษรของรหัสผู้ให้บริการ

หากผู้ให้บริการล้มเหลว ระบบจะลองตัวเลือกถัดไปโดยอัตโนมัติ หากทั้งหมดล้มเหลว ข้อผิดพลาดจะมีรายละเอียดจากความพยายามแต่ละครั้ง

ตั้งค่า `agents.defaults.mediaGenerationAutoProviderFallback: false` เพื่อใช้เฉพาะรายการ `model`, `primary` และ `fallbacks` ที่ระบุไว้อย่างชัดเจน

## หมายเหตุเกี่ยวกับผู้ให้บริการ

<AccordionGroup>
  <Accordion title="ComfyUI">
    ขับเคลื่อนด้วยเวิร์กโฟลว์และขึ้นอยู่กับกราฟที่กำหนดค่าไว้ รวมถึงการแมป Node
    สำหรับฟิลด์พรอมต์/เอาต์พุต Plugin `comfy` ที่มาพร้อมระบบเชื่อมต่อกับเครื่องมือ
    `music_generate` ที่ใช้ร่วมกันผ่านรีจิสทรีผู้ให้บริการสร้างเพลง
  </Accordion>
  <Accordion title="fal">
    ใช้เอนด์พอยต์โมเดลของ fal ผ่านเส้นทางการยืนยันตัวตนของผู้ให้บริการที่ใช้ร่วมกัน
    ผู้ให้บริการที่มาพร้อมระบบใช้ `fal-ai/minimax-music/v2.6` เป็นค่าเริ่มต้น และยังเปิดให้ใช้
    `fal-ai/ace-step/prompt-to-audio` กับ
    `fal-ai/stable-audio-25/text-to-audio` สำหรับคำขอแปลงพรอมต์เป็นเสียง
    เนื้อเพลงและโหมดดนตรีบรรเลงรองรับเฉพาะโมเดล MiniMax ส่วนอีกสองโมเดล
    รองรับเฉพาะพรอมต์
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    ใช้การสร้างแบบกลุ่มของ Lyria 3 ขั้นตอนที่มาพร้อมระบบในปัจจุบันรองรับ
    พรอมต์ ข้อความเนื้อเพลงที่ระบุหรือไม่ก็ได้ และรูปภาพอ้างอิงที่ระบุหรือไม่ก็ได้
    โมเดลเริ่มต้น `lyria-3-clip-preview` ส่งออกเฉพาะ mp3 ส่วน
    โมเดล `lyria-3-pro-preview` รองรับ wav ด้วย
  </Accordion>
  <Accordion title="MiniMax">
    ใช้เอนด์พอยต์ `music_generation` แบบกลุ่ม รองรับพรอมต์ เนื้อเพลงที่ระบุหรือไม่ก็ได้
    โหมดดนตรีบรรเลง และเอาต์พุต mp3 ผ่านการยืนยันตัวตนด้วยคีย์ API ของ `minimax`
    หรือ OAuth ของ `minimax-portal` นอกจากนี้ยังเปิดให้ใช้โมเดล `music-2.6-free`,
    `music-cover` และ `music-cover-free`
  </Accordion>
  <Accordion title="OpenRouter">
    ใช้เอาต์พุตเสียงจากการเติมเต็มแชตของ OpenRouter โดยเปิดใช้การสตรีม
    ผู้ให้บริการที่มาพร้อมระบบใช้ `google/lyria-3-pro-preview` เป็นค่าเริ่มต้น และยังเปิดให้ใช้
    `openrouter/google/lyria-3-clip-preview`
  </Accordion>
</AccordionGroup>

## การเลือกเส้นทางที่เหมาะสม

- **รองรับโดยผู้ให้บริการที่ใช้ร่วมกัน** เมื่อคุณต้องการการเลือกโมเดล การสลับไปยัง
  ผู้ให้บริการสำรอง และขั้นตอนงาน/สถานะแบบอะซิงโครนัสในตัว
- **เส้นทาง Plugin (ComfyUI)** เมื่อคุณต้องการกราฟเวิร์กโฟลว์แบบกำหนดเองหรือ
  ผู้ให้บริการที่ไม่ได้เป็นส่วนหนึ่งของความสามารถด้านเพลงที่ใช้ร่วมกันและมาพร้อมระบบ

หากคุณกำลังแก้ไขข้อบกพร่องของพฤติกรรมเฉพาะ ComfyUI โปรดดู
[ComfyUI](/th/providers/comfy) หากคุณกำลังแก้ไขข้อบกพร่องของพฤติกรรมผู้ให้บริการที่ใช้ร่วมกัน
ให้เริ่มจาก [fal](/th/providers/fal), [Google (Gemini)](/th/providers/google),
[MiniMax](/th/providers/minimax) หรือ [OpenRouter](/th/providers/openrouter)

## โหมดความสามารถของผู้ให้บริการ

สัญญาการสร้างเพลงที่ใช้ร่วมกันรองรับการประกาศโหมดอย่างชัดเจน:

- `generate` สำหรับการสร้างจากพรอมต์เท่านั้น
- `edit` เมื่อคำขอมีรูปภาพอ้างอิงอย่างน้อยหนึ่งรูป

การนำผู้ให้บริการรายใหม่มาใช้ควรเลือกใช้บล็อกโหมดที่ชัดเจน:

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

ฟิลด์แบบแบนรุ่นเก่า เช่น `maxInputImages`, `supportsLyrics` และ
`supportsFormat` **ไม่** เพียงพอสำหรับการประกาศว่ารองรับการแก้ไข ผู้ให้บริการ
ควรประกาศ `generate` และ `edit` อย่างชัดเจน เพื่อให้การทดสอบสด การทดสอบสัญญา
และเครื่องมือ `music_generate` ที่ใช้ร่วมกันสามารถตรวจสอบการรองรับโหมด
ได้อย่างแน่นอน

## การทดสอบสด

ความครอบคลุมการทดสอบสดแบบเลือกเข้าร่วมสำหรับผู้ให้บริการที่ใช้ร่วมกันและมาพร้อมระบบ (fal, Google, MiniMax,
OpenRouter):

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

คำสั่งครอบของรีโพที่เทียบเท่ากัน ซึ่งเรียกใช้ไฟล์ทดสอบเดียวกัน:

```bash
pnpm test:live:media:music
```

โดยค่าเริ่มต้น ไฟล์ทดสอบสดนี้ใช้ตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ส่งออกไว้แล้ว
ก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้ และเรียกใช้ทั้งความครอบคลุมของ `generate`
และ `edit` ที่ประกาศไว้ เมื่อผู้ให้บริการเปิดใช้โหมดแก้ไข ความครอบคลุมในปัจจุบัน:

- `google`: `generate` และ `edit`
- `fal`: เฉพาะ `generate`
- `minimax`: เฉพาะ `generate`
- `openrouter`: `generate` และ `edit`
- `comfy`: มีความครอบคลุมการทดสอบสดของ Comfy แยกต่างหาก ไม่รวมอยู่ในการทดสอบผู้ให้บริการที่ใช้ร่วมกัน

ความครอบคลุมการทดสอบสดแบบเลือกเข้าร่วมสำหรับเส้นทางเพลง ComfyUI ที่มาพร้อมระบบ:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

ไฟล์ทดสอบสดของ Comfy ยังครอบคลุมเวิร์กโฟลว์รูปภาพและวิดีโอของ comfy
เมื่อมีการกำหนดค่าส่วนเหล่านั้น

## เนื้อหาที่เกี่ยวข้อง

- [งานเบื้องหลัง](/th/automation/tasks) — การติดตามงานสำหรับการเรียกใช้ `music_generate` แบบแยกออกจากกระบวนการหลัก
- [ComfyUI](/th/providers/comfy)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — การกำหนดค่า `musicGenerationModel`
- [Google (Gemini)](/th/providers/google)
- [MiniMax](/th/providers/minimax)
- [โมเดล](/th/concepts/models) — การกำหนดค่าโมเดลและการสลับไปใช้สำรอง
- [ภาพรวมเครื่องมือ](/th/tools)
