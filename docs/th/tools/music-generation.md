---
read_when:
    - การสร้างเพลงหรือเสียงผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลสำหรับการสร้างเพลง
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ music_generate
sidebarTitle: Music generation
summary: สร้างเพลงผ่าน music_generate ในเวิร์กโฟลว์ของ Google Lyria, MiniMax และ ComfyUI
title: การสร้างดนตรี
x-i18n:
    generated_at: "2026-05-05T06:19:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5e74aa7d43ffe00adb6d6c170d36dbc107f2baf0069243733c5dd6e4582175a
    source_path: tools/music-generation.md
    workflow: 16
---

เครื่องมือ `music_generate` ช่วยให้ agent สร้างเพลงหรือเสียงผ่านความสามารถสร้างเพลงแบบใช้ร่วมกันกับผู้ให้บริการที่กำหนดค่าไว้ ได้แก่ Google, MiniMax และ ComfyUI ที่กำหนดค่าด้วย workflow ในปัจจุบัน

สำหรับการรัน agent ที่มี session รองรับ OpenClaw จะเริ่มการสร้างเพลงเป็นงานเบื้องหลัง ติดตามในบัญชีงาน แล้วปลุก agent อีกครั้งเมื่อแทร็กพร้อม เพื่อให้ agent แจ้งผู้ใช้และแนบไฟล์เสียงที่เสร็จแล้วได้ ในแชตแบบกลุ่ม/ช่องทางที่ใช้การส่งแบบมองเห็นได้ผ่าน message tool เท่านั้น agent จะส่งต่อผลลัพธ์ผ่าน message tool หาก agent ที่ทำงานเสร็จเขียนเฉพาะคำตอบสุดท้ายแบบส่วนตัว OpenClaw จะ fallback ไปเป็นการส่งตรงผ่านช่องทางพร้อมสื่อที่สร้างขึ้น การปลุกเมื่อเสร็จสิ้นจะเตือน agent อย่างชัดเจนว่าคำตอบสุดท้ายตามปกติเป็นแบบส่วนตัวในเส้นทางเหล่านั้น

<Note>
เครื่องมือแบบใช้ร่วมกันที่มีมาให้จะแสดงก็ต่อเมื่อมีผู้ให้บริการสร้างเพลงอย่างน้อยหนึ่งรายพร้อมใช้งาน หากคุณไม่เห็น `music_generate` ในเครื่องมือของ agent ให้กำหนดค่า `agents.defaults.musicGenerationModel` หรือตั้งค่า API key ของผู้ให้บริการ
</Note>

## เริ่มต้นอย่างรวดเร็ว

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        ตั้งค่า API key สำหรับผู้ให้บริการอย่างน้อยหนึ่งราย เช่น
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

        agent จะเรียก `music_generate` โดยอัตโนมัติ ไม่ต้องเพิ่มเครื่องมือนี้ในรายการอนุญาต
      </Step>
    </Steps>

    สำหรับบริบทแบบ synchronous โดยตรงที่ไม่มีการรัน agent ที่มี session รองรับ เครื่องมือที่มีมาให้จะยัง fallback ไปใช้การสร้างแบบ inline และส่งคืน path ของสื่อสุดท้ายในผลลัพธ์ของเครื่องมือ

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        กำหนดค่า `plugins.entries.comfy.config.music` ด้วย workflow
        JSON และโหนด prompt/output
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

ตัวอย่าง prompt:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ | โมเดลเริ่มต้น          | อินพุตอ้างอิง | การควบคุมที่รองรับ                                        | การยืนยันตัวตน                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | สูงสุด 1 รูปภาพ    | เพลงหรือเสียงที่กำหนดโดย Workflow                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | สูงสุด 10 รูปภาพ  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | ไม่มี             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` หรือ MiniMax OAuth     |

### เมทริกซ์ความสามารถ

สัญญาโหมดแบบชัดเจนที่ใช้โดย `music_generate`, contract tests และ shared live sweep:

| ผู้ให้บริการ | `generate` | `edit` | ขีดจำกัดการแก้ไข | shared live lanes                                                         |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 รูปภาพ    | ไม่อยู่ใน shared sweep; ครอบคลุมโดย `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 รูปภาพ  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | ไม่มี       | `generate`                                                                |

ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการและโมเดลแบบใช้ร่วมกันที่พร้อมใช้งานขณะรัน:

```text
/tool music_generate action=list
```

ใช้ `action: "status"` เพื่อตรวจสอบงานเพลงที่มี session รองรับซึ่งกำลังทำงานอยู่:

```text
/tool music_generate action=status
```

ตัวอย่างการสร้างโดยตรง:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## พารามิเตอร์ของเครื่องมือ

<ParamField path="prompt" type="string" required>
  prompt สำหรับการสร้างเพลง จำเป็นสำหรับ `action: "generate"`
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` ส่งคืนงานของ session ปัจจุบัน; `"list"` ตรวจสอบผู้ให้บริการ
</ParamField>
<ParamField path="model" type="string">
  แทนที่ผู้ให้บริการ/โมเดล (เช่น `google/lyria-3-pro-preview`,
  `comfy/workflow`)
</ParamField>
<ParamField path="lyrics" type="string">
  เนื้อเพลงเพิ่มเติมเมื่อผู้ให้บริการรองรับอินพุตเนื้อเพลงแบบชัดเจน
</ParamField>
<ParamField path="instrumental" type="boolean">
  ขอเอาต์พุตแบบเครื่องดนตรีล้วนเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="image" type="string">
  path หรือ URL ของรูปภาพอ้างอิงหนึ่งรูป
</ParamField>
<ParamField path="images" type="string[]">
  รูปภาพอ้างอิงหลายรูป (สูงสุด 10 รูปในผู้ให้บริการที่รองรับ)
</ParamField>
<ParamField path="durationSeconds" type="number">
  ระยะเวลาเป้าหมายเป็นวินาทีเมื่อผู้ให้บริการรองรับคำใบ้เรื่องระยะเวลา
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  คำใบ้รูปแบบเอาต์พุตเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="filename" type="string">คำใบ้ชื่อไฟล์เอาต์พุต</ParamField>
<ParamField path="timeoutMs" type="number">timeout สำหรับคำขอไปยังผู้ให้บริการเพิ่มเติมในหน่วยมิลลิวินาที ค่าที่ต่ำกว่า 10000ms จะถูกยกเป็น 10000ms และรายงานในผลลัพธ์ของเครื่องมือ</ParamField>

<Note>
ผู้ให้บริการไม่ได้รองรับทุกพารามิเตอร์ทั้งหมด OpenClaw ยังคงตรวจสอบขีดจำกัดแบบตายตัว เช่น จำนวนอินพุตก่อนส่งคำขอ เมื่อผู้ให้บริการรองรับระยะเวลาแต่มีค่าสูงสุดสั้นกว่าค่าที่ร้องขอ OpenClaw จะ clamp ไปยังระยะเวลาที่รองรับซึ่งใกล้ที่สุด คำใบ้เพิ่มเติมที่ไม่รองรับจริงจะถูกละเว้นพร้อมคำเตือนเมื่อผู้ให้บริการหรือโมเดลที่เลือกไม่สามารถทำตามได้ ผลลัพธ์ของเครื่องมือจะรายงานการตั้งค่าที่นำไปใช้; `details.normalization` จะบันทึกการแมปจากค่าที่ร้องขอไปยังค่าที่นำไปใช้
</Note>

## พฤติกรรมแบบ async

การสร้างเพลงที่มี session รองรับจะรันเป็นงานเบื้องหลัง:

- **งานเบื้องหลัง:** `music_generate` สร้างงานเบื้องหลัง ส่งคืนคำตอบว่าเริ่มแล้ว/งานทันที และโพสต์แทร็กที่เสร็จแล้วภายหลังในข้อความติดตามผลจาก agent
- **การป้องกันการทำซ้ำ:** ขณะที่งานมีสถานะ `queued` หรือ `running` การเรียก `music_generate` ภายหลังใน session เดียวกันจะส่งคืนสถานะงานแทนการเริ่มการสร้างอีกครั้ง ใช้ `action: "status"` เพื่อตรวจสอบอย่างชัดเจน
- **การค้นหาสถานะ:** `openclaw tasks list` หรือ `openclaw tasks show <taskId>` ตรวจสอบสถานะ queued, running และ terminal
- **การปลุกเมื่อเสร็จสิ้น:** OpenClaw แทรกเหตุการณ์การเสร็จสิ้นภายในกลับเข้าไปใน session เดียวกัน เพื่อให้โมเดลเขียนข้อความติดตามผลที่ผู้ใช้เห็นได้ด้วยตัวเอง
- **คำใบ้ prompt:** turn ของผู้ใช้/แบบ manual ภายหลังใน session เดียวกันจะได้รับคำใบ้ขณะรันขนาดเล็กเมื่อมีงานเพลงกำลังดำเนินการอยู่ เพื่อให้โมเดลไม่เรียก `music_generate` ซ้ำแบบไม่รู้ตัว
- **fallback แบบไม่มี session:** บริบทแบบ direct/local ที่ไม่มี session ของ agent จริงจะรัน inline และส่งคืนผลลัพธ์เสียงสุดท้ายใน turn เดียวกัน

### วงจรชีวิตของงาน

| สถานะ       | ความหมาย                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | สร้างงานแล้ว กำลังรอให้ผู้ให้บริการยอมรับ                                           |
| `running`   | ผู้ให้บริการกำลังประมวลผล (โดยทั่วไป 30 วินาทีถึง 3 นาที ขึ้นอยู่กับผู้ให้บริการและระยะเวลา) |
| `succeeded` | แทร็กพร้อมแล้ว; agent ถูกปลุกและโพสต์ไปยังการสนทนา                                 |
| `failed`    | ข้อผิดพลาดของผู้ให้บริการหรือ timeout; agent ถูกปลุกพร้อมรายละเอียดข้อผิดพลาด                                 |

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

1. พารามิเตอร์ `model` จากการเรียกเครื่องมือ (หาก agent ระบุไว้)
2. `musicGenerationModel.primary` จาก config
3. `musicGenerationModel.fallbacks` ตามลำดับ
4. การตรวจหาอัตโนมัติโดยใช้ค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับเท่านั้น:
   - ผู้ให้บริการเริ่มต้นปัจจุบันก่อน;
   - ผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id

หากผู้ให้บริการล้มเหลว ระบบจะลองตัวเลือกถัดไปโดยอัตโนมัติ หากทั้งหมดล้มเหลว ข้อผิดพลาดจะรวมรายละเอียดจากแต่ละความพยายาม

ตั้งค่า `agents.defaults.mediaGenerationAutoProviderFallback: false` เพื่อใช้เฉพาะรายการ `model`, `primary` และ `fallbacks` ที่ระบุชัดเจน

## หมายเหตุของผู้ให้บริการ

<AccordionGroup>
  <Accordion title="ComfyUI">
    ขับเคลื่อนด้วย Workflow และขึ้นอยู่กับกราฟที่กำหนดค่าไว้ รวมถึงการแมปโหนดสำหรับฟิลด์ prompt/output Plugin `comfy` ที่ bundled ไว้เชื่อมเข้ากับเครื่องมือ `music_generate` แบบใช้ร่วมกันผ่าน registry ของผู้ให้บริการสร้างเพลง
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    ใช้การสร้างแบบ batch ของ Lyria 3 flow ที่ bundled อยู่ในปัจจุบันรองรับ prompt, ข้อความเนื้อเพลงเพิ่มเติม และรูปภาพอ้างอิงเพิ่มเติม
  </Accordion>
  <Accordion title="MiniMax">
    ใช้ endpoint แบบ batch `music_generation` รองรับ prompt, เนื้อเพลงเพิ่มเติม, โหมด instrumental, การกำหนดทิศทางระยะเวลา และเอาต์พุต mp3 ผ่านการยืนยันตัวตนด้วย API key ของ `minimax` หรือ OAuth ของ `minimax-portal`
  </Accordion>
</AccordionGroup>

## การเลือกเส้นทางที่เหมาะสม

- **แบบใช้ร่วมกันที่มีผู้ให้บริการรองรับ** เมื่อคุณต้องการการเลือกโมเดล, การ failover ของผู้ให้บริการ และ flow งาน/status แบบ async ที่มีมาให้
- **เส้นทาง Plugin (ComfyUI)** เมื่อคุณต้องการกราฟ workflow แบบกำหนดเองหรือผู้ให้บริการที่ไม่ได้เป็นส่วนหนึ่งของความสามารถเพลงแบบ bundled ที่ใช้ร่วมกัน

หากคุณกำลัง debug พฤติกรรมเฉพาะของ ComfyUI โปรดดู
[ComfyUI](/th/providers/comfy) หากคุณกำลัง debug พฤติกรรมของผู้ให้บริการแบบใช้ร่วมกัน ให้เริ่มจาก [Google (Gemini)](/th/providers/google) หรือ
[MiniMax](/th/providers/minimax)

## โหมดความสามารถของผู้ให้บริการ

สัญญาการสร้างเพลงแบบใช้ร่วมกันรองรับการประกาศโหมดอย่างชัดเจน:

- `generate` สำหรับการสร้างจาก prompt เท่านั้น
- `edit` เมื่อคำขอมีรูปภาพอ้างอิงหนึ่งรูปหรือมากกว่า

การใช้งานผู้ให้บริการใหม่ควรใช้บล็อกโหมดแบบชัดเจน:

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

ฟิลด์ flat แบบเดิม เช่น `maxInputImages`, `supportsLyrics` และ
`supportsFormat` **ไม่** เพียงพอสำหรับการประกาศว่ารองรับ edit ผู้ให้บริการควรประกาศ `generate` และ `edit` อย่างชัดเจน เพื่อให้ live tests, contract
tests และเครื่องมือ `music_generate` แบบใช้ร่วมกันสามารถตรวจสอบการรองรับโหมดได้อย่างกำหนดแน่นอน

## Live tests

ความครอบคลุมแบบ live ที่ต้อง opt-in สำหรับผู้ให้บริการ bundled แบบใช้ร่วมกัน:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

wrapper ของ repo:

```bash
pnpm test:live:media music
```

ไฟล์ live นี้โหลด env vars ของผู้ให้บริการที่ขาดไปจาก `~/.profile`, โดยค่าเริ่มต้นให้ความสำคัญกับ API keys แบบ live/env ก่อน auth profiles ที่จัดเก็บไว้ และรันความครอบคลุมทั้ง `generate` และ `edit` ที่ประกาศไว้เมื่อผู้ให้บริการเปิดใช้โหมด edit ความครอบคลุมในปัจจุบัน:

- `google`: `generate` พร้อม `edit`
- `minimax`: `generate` เท่านั้น
- `comfy`: ความครอบคลุมการทดสอบกับระบบจริงของ Comfy แยกต่างหาก ไม่ใช่การกวาดตรวจผู้ให้บริการร่วม

เลือกเปิดใช้ความครอบคลุมการทดสอบกับระบบจริงสำหรับเส้นทางเพลง ComfyUI ที่บันเดิลไว้:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

ไฟล์ทดสอบกับระบบจริงของ Comfy ยังครอบคลุมเวิร์กโฟลว์รูปภาพและวิดีโอของ comfy เมื่อมีการกำหนดค่าส่วนเหล่านั้น

## ที่เกี่ยวข้อง

- [งานเบื้องหลัง](/th/automation/tasks) — การติดตามงานสำหรับการรัน `music_generate` แบบแยกออก
- [ComfyUI](/th/providers/comfy)
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — การกำหนดค่า `musicGenerationModel`
- [Google (Gemini)](/th/providers/google)
- [MiniMax](/th/providers/minimax)
- [โมเดล](/th/concepts/models) — การกำหนดค่าโมเดลและการสลับสำรองเมื่อผิดพลาด
- [ภาพรวมเครื่องมือ](/th/tools)
