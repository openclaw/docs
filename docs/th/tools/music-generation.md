---
read_when:
    - การสร้างเพลงหรือเสียงผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลสำหรับการสร้างเพลง
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ music_generate
sidebarTitle: Music generation
summary: สร้างเพลงผ่าน music_generate ในเวิร์กโฟลว์ของ Google Lyria, MiniMax และ ComfyUI
title: การสร้างดนตรี
x-i18n:
    generated_at: "2026-05-11T20:40:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: b355dd6f1f41074624b692edb8a597a65ad99fc3ad61d2ed5e32f1b6cf393244
    source_path: tools/music-generation.md
    workflow: 16
---

เครื่องมือ `music_generate` ช่วยให้เอเจนต์สร้างเพลงหรือเสียงผ่านความสามารถการสร้างเพลงแบบใช้ร่วมกันกับผู้ให้บริการที่กำหนดค่าไว้ ได้แก่ Google, MiniMax และ ComfyUI ที่กำหนดค่าด้วยเวิร์กโฟลว์ในปัจจุบัน

สำหรับการรันเอเจนต์ที่มีเซสชันรองรับ OpenClaw จะเริ่มการสร้างเพลงเป็นงานเบื้องหลัง ติดตามไว้ในบัญชีงาน จากนั้นปลุกเอเจนต์อีกครั้งเมื่อแทร็กพร้อม เพื่อให้เอเจนต์บอกผู้ใช้และแนบไฟล์เสียงที่เสร็จแล้วได้ ในแชตกลุ่ม/ช่องทางที่ใช้การส่งแบบมองเห็นได้เฉพาะผ่านเครื่องมือข้อความ เอเจนต์จะส่งต่อผลลัพธ์ผ่านเครื่องมือข้อความ หากเอเจนต์สำหรับการเสร็จสิ้นเขียนเฉพาะการตอบกลับสุดท้ายแบบส่วนตัว OpenClaw จะย้อนกลับไปส่งตรงผ่านช่องทางพร้อมสื่อที่สร้างขึ้น การปลุกเมื่อเสร็จสิ้นจะเตือนเอเจนต์อย่างชัดเจนว่าการตอบกลับสุดท้ายตามปกติเป็นแบบส่วนตัวในเส้นทางเหล่านั้น

<Note>
เครื่องมือแบบใช้ร่วมกันในตัวจะแสดงเฉพาะเมื่อมีผู้ให้บริการสร้างเพลงอย่างน้อยหนึ่งรายพร้อมใช้งาน หากคุณไม่เห็น `music_generate` ในเครื่องมือของเอเจนต์ ให้กำหนดค่า `agents.defaults.musicGenerationModel` หรือตั้งค่าคีย์ API ของผู้ให้บริการ
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

        เอเจนต์จะเรียก `music_generate` โดยอัตโนมัติ ไม่จำเป็นต้องเพิ่มเครื่องมือในรายการอนุญาต
      </Step>
    </Steps>

    สำหรับบริบทแบบซิงโครนัสโดยตรงที่ไม่มีการรันเอเจนต์พร้อมเซสชันรองรับ เครื่องมือในตัวยังคงย้อนกลับไปใช้การสร้างแบบอินไลน์และส่งคืนพาธสื่อสุดท้ายในผลลัพธ์ของเครื่องมือ

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        กำหนดค่า `plugins.entries.comfy.config.music` ด้วย JSON ของเวิร์กโฟลว์และโหนดพรอมต์/เอาต์พุต
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

ตัวอย่างพรอมต์:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ | โมเดลเริ่มต้น          | อินพุตอ้างอิง | การควบคุมที่รองรับ                                        | การยืนยันตัวตน                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | สูงสุด 1 ภาพ    | เพลงหรือเสียงที่กำหนดโดยเวิร์กโฟลว์                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | สูงสุด 10 ภาพ  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | ไม่มี             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` หรือ MiniMax OAuth     |

### เมทริกซ์ความสามารถ

สัญญาโหมดแบบชัดเจนที่ใช้โดย `music_generate`, การทดสอบสัญญา และการกวาดทดสอบสดแบบใช้ร่วมกัน:

| ผู้ให้บริการ | `generate` | `edit` | ขีดจำกัดการแก้ไข | เลนทดสอบสดแบบใช้ร่วมกัน                                                         |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 ภาพ    | ไม่อยู่ในการกวาดทดสอบแบบใช้ร่วมกัน; ครอบคลุมโดย `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 ภาพ  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | ไม่มี       | `generate`                                                                |

ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการและโมเดลแบบใช้ร่วมกันที่พร้อมใช้งานขณะรันไทม์:

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
  พรอมต์สำหรับการสร้างเพลง จำเป็นสำหรับ `action: "generate"`
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` ส่งคืนงานเซสชันปัจจุบัน; `"list"` ตรวจสอบผู้ให้บริการ
</ParamField>
<ParamField path="model" type="string">
  การแทนที่ผู้ให้บริการ/โมเดล (เช่น `google/lyria-3-pro-preview`,
  `comfy/workflow`)
</ParamField>
<ParamField path="lyrics" type="string">
  เนื้อเพลงเสริมเมื่อผู้ให้บริการรองรับอินพุตเนื้อเพลงแบบชัดเจน
</ParamField>
<ParamField path="instrumental" type="boolean">
  ขอเอาต์พุตเฉพาะดนตรีบรรเลงเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="image" type="string">
  พาธหรือ URL ของภาพอ้างอิงเดียว
</ParamField>
<ParamField path="images" type="string[]">
  ภาพอ้างอิงหลายภาพ (สูงสุด 10 ภาพในผู้ให้บริการที่รองรับ)
</ParamField>
<ParamField path="durationSeconds" type="number">
  ระยะเวลาเป้าหมายเป็นวินาทีเมื่อผู้ให้บริการรองรับคำใบ้ระยะเวลา
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  คำใบ้รูปแบบเอาต์พุตเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="filename" type="string">คำใบ้ชื่อไฟล์เอาต์พุต</ParamField>
<ParamField path="timeoutMs" type="number">เวลาหมดเวลาของคำขอผู้ให้บริการแบบไม่บังคับ หน่วยเป็นมิลลิวินาที เมื่อไม่ได้ระบุ OpenClaw จะใช้ `agents.defaults.musicGenerationModel.timeoutMs` หากกำหนดค่าไว้ ค่าที่ต่ำกว่า 10000ms จะถูกยกระดับเป็น 10000ms และรายงานในผลลัพธ์ของเครื่องมือ</ParamField>

<Note>
ผู้ให้บริการบางรายไม่ได้รองรับทุกพารามิเตอร์ OpenClaw ยังคงตรวจสอบขีดจำกัดแบบเข้มงวด เช่น จำนวนอินพุต ก่อนส่งคำขอ เมื่อผู้ให้บริการรองรับระยะเวลาแต่ใช้ค่าสูงสุดที่สั้นกว่าค่าที่ขอ OpenClaw จะปรับลงเป็นระยะเวลาที่รองรับใกล้เคียงที่สุด คำใบ้เสริมที่ไม่รองรับจริงจะถูกเพิกเฉยพร้อมคำเตือนเมื่อผู้ให้บริการหรือโมเดลที่เลือกไม่สามารถทำตามได้ ผลลัพธ์ของเครื่องมือจะรายงานการตั้งค่าที่นำไปใช้; `details.normalization` จะบันทึกการแมปจากค่าที่ขอไปยังค่าที่ใช้
</Note>

## พฤติกรรมแบบอะซิงโครนัส

การสร้างเพลงที่มีเซสชันรองรับจะรันเป็นงานเบื้องหลัง:

- **งานเบื้องหลัง:** `music_generate` สร้างงานเบื้องหลัง ส่งคืนการตอบกลับว่าเริ่มแล้ว/งานทันที และโพสต์แทร็กที่เสร็จแล้วภายหลังในข้อความติดตามผลจากเอเจนต์
- **การป้องกันรายการซ้ำ:** ขณะที่งานอยู่ในสถานะ `queued` หรือ `running` การเรียก `music_generate` ภายหลังในเซสชันเดียวกันจะส่งคืนสถานะงานแทนการเริ่มสร้างอีกรายการ ใช้ `action: "status"` เพื่อตรวจสอบอย่างชัดเจน
- **การค้นหาสถานะ:** `openclaw tasks list` หรือ `openclaw tasks show <taskId>` ตรวจสอบสถานะที่อยู่ในคิว กำลังรัน และสิ้นสุดแล้ว
- **การปลุกเมื่อเสร็จสิ้น:** OpenClaw แทรกเหตุการณ์เสร็จสิ้นภายในกลับเข้าไปในเซสชันเดียวกัน เพื่อให้โมเดลเขียนข้อความติดตามผลที่ผู้ใช้เห็นได้เอง
- **คำใบ้พรอมต์:** เทิร์นของผู้ใช้/แมนนวลภายหลังในเซสชันเดียวกันจะได้รับคำใบ้รันไทม์เล็กน้อยเมื่อมีงานเพลงกำลังดำเนินอยู่ เพื่อให้โมเดลไม่เรียก `music_generate` ซ้ำโดยไม่ตรวจสอบ
- **ทางเลือกเมื่อไม่มีเซสชัน:** บริบทโดยตรง/โลคัลที่ไม่มีเซสชันเอเจนต์จริงจะรันแบบอินไลน์และส่งคืนผลลัพธ์เสียงสุดท้ายในเทิร์นเดียวกัน

### วงจรชีวิตของงาน

| สถานะ       | ความหมาย                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | สร้างงานแล้ว กำลังรอให้ผู้ให้บริการยอมรับงาน                                           |
| `running`   | ผู้ให้บริการกำลังประมวลผล (โดยทั่วไป 30 วินาทีถึง 3 นาที ขึ้นอยู่กับผู้ให้บริการและระยะเวลา) |
| `succeeded` | แทร็กพร้อมแล้ว; เอเจนต์ถูกปลุกและโพสต์ไปยังบทสนทนา                                 |
| `failed`    | ข้อผิดพลาดของผู้ให้บริการหรือหมดเวลา; เอเจนต์ถูกปลุกพร้อมรายละเอียดข้อผิดพลาด                                 |

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
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### ลำดับการเลือกผู้ให้บริการ

OpenClaw จะลองผู้ให้บริการตามลำดับนี้:

1. พารามิเตอร์ `model` จากการเรียกเครื่องมือ (หากเอเจนต์ระบุไว้)
2. `musicGenerationModel.primary` จากการกำหนดค่า
3. `musicGenerationModel.fallbacks` ตามลำดับ
4. การตรวจหาอัตโนมัติโดยใช้เฉพาะค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตน:
   - ผู้ให้บริการเริ่มต้นปัจจุบันก่อน;
   - ผู้ให้บริการสร้างเพลงที่ลงทะเบียนที่เหลือเรียงตามลำดับ provider-id

หากผู้ให้บริการล้มเหลว ระบบจะลองตัวเลือกถัดไปโดยอัตโนมัติ หากทั้งหมดล้มเหลว ข้อผิดพลาดจะรวมรายละเอียดจากแต่ละความพยายาม

ตั้งค่า `agents.defaults.mediaGenerationAutoProviderFallback: false` เพื่อใช้เฉพาะรายการ `model`, `primary` และ `fallbacks` ที่ระบุอย่างชัดเจนเท่านั้น

## หมายเหตุผู้ให้บริการ

<AccordionGroup>
  <Accordion title="ComfyUI">
    ขับเคลื่อนด้วยเวิร์กโฟลว์และขึ้นอยู่กับกราฟที่กำหนดค่าไว้พร้อมการแมปโหนดสำหรับฟิลด์พรอมต์/เอาต์พุต Plugin `comfy` ที่รวมมาในชุดจะเชื่อมเข้ากับเครื่องมือ `music_generate` แบบใช้ร่วมกันผ่านรีจิสทรีผู้ให้บริการสร้างเพลง
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    ใช้การสร้างแบบแบตช์ของ Lyria 3 โฟลว์ที่รวมมาในปัจจุบันรองรับพรอมต์ ข้อความเนื้อเพลงเสริม และภาพอ้างอิงเสริม
  </Accordion>
  <Accordion title="MiniMax">
    ใช้เอนด์พอยต์แบตช์ `music_generation` รองรับพรอมต์ เนื้อเพลงเสริม โหมดบรรเลง การควบคุมระยะเวลา และเอาต์พุต mp3 ผ่านการยืนยันตัวตนด้วยคีย์ API ของ `minimax` หรือ OAuth ของ `minimax-portal`
  </Accordion>
</AccordionGroup>

## การเลือกเส้นทางที่เหมาะสม

- **แบบใช้ร่วมกันที่มีผู้ให้บริการรองรับ** เมื่อคุณต้องการการเลือกโมเดล การสลับผู้ให้บริการเมื่อล้มเหลว และโฟลว์งาน/สถานะแบบอะซิงโครนัสในตัว
- **เส้นทาง Plugin (ComfyUI)** เมื่อคุณต้องการกราฟเวิร์กโฟลว์แบบกำหนดเองหรือผู้ให้บริการที่ไม่ได้เป็นส่วนหนึ่งของความสามารถการสร้างเพลงที่รวมมาแบบใช้ร่วมกัน

หากคุณกำลังดีบักพฤติกรรมเฉพาะของ ComfyUI โปรดดู
[ComfyUI](/th/providers/comfy) หากคุณกำลังดีบักพฤติกรรมของผู้ให้บริการแบบใช้ร่วมกัน ให้เริ่มที่ [Google (Gemini)](/th/providers/google) หรือ
[MiniMax](/th/providers/minimax)

## โหมดความสามารถของผู้ให้บริการ

สัญญาการสร้างเพลงแบบใช้ร่วมกันรองรับการประกาศโหมดแบบชัดเจน:

- `generate` สำหรับการสร้างจากพรอมต์เท่านั้น
- `edit` เมื่อคำขอมีภาพอ้างอิงอย่างน้อยหนึ่งภาพ

การใช้งานผู้ให้บริการใหม่ควรเลือกใช้บล็อกโหมดแบบชัดเจน:

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

ฟิลด์แบบแฟลตเดิม เช่น `maxInputImages`, `supportsLyrics` และ
`supportsFormat` **ไม่** เพียงพอสำหรับประกาศการรองรับการแก้ไข ผู้ให้บริการควรประกาศ `generate` และ `edit` อย่างชัดเจน เพื่อให้การทดสอบสด การทดสอบสัญญา และเครื่องมือ `music_generate` แบบใช้ร่วมกันสามารถตรวจสอบการรองรับโหมดได้อย่างกำหนดแน่นอน

## การทดสอบสด

ความครอบคลุมการทดสอบสดแบบเลือกใช้สำหรับผู้ให้บริการที่รวมมาแบบใช้ร่วมกัน:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

ตัวห่อคำสั่งของรีโป:

```bash
pnpm test:live:media music
```

ไฟล์ live นี้โหลดตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ขาดหายจาก `~/.profile` โดยค่าเริ่มต้นจะให้ความสำคัญกับคีย์ API แบบ live/env ก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้ และรันความครอบคลุมทั้ง `generate` และ `edit` ที่ประกาศไว้เมื่อผู้ให้บริการเปิดใช้งานโหมด edit ความครอบคลุมในปัจจุบัน:

- `google`: `generate` รวมถึง `edit`
- `minimax`: เฉพาะ `generate`
- `comfy`: ความครอบคลุม live ของ Comfy แยกต่างหาก ไม่ใช่การกวาดตรวจผู้ให้บริการร่วม

เปิดใช้ความครอบคลุม live โดยสมัครใจสำหรับเส้นทางเพลง ComfyUI ที่บันเดิลมา:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

ไฟล์ live ของ Comfy ยังครอบคลุมเวิร์กโฟลว์รูปภาพและวิดีโอของ comfy เมื่อมีการกำหนดค่าส่วนเหล่านั้นไว้

## ที่เกี่ยวข้อง

- [งานเบื้องหลัง](/th/automation/tasks) — การติดตามงานสำหรับการรัน `music_generate` แบบแยกออก
- [ComfyUI](/th/providers/comfy)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — การกำหนดค่า `musicGenerationModel`
- [Google (Gemini)](/th/providers/google)
- [MiniMax](/th/providers/minimax)
- [โมเดล](/th/concepts/models) — การกำหนดค่าโมเดลและการสลับเมื่อเกิดความล้มเหลว
- [ภาพรวมเครื่องมือ](/th/tools)
