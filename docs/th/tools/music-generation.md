---
read_when:
    - การสร้างเพลงหรือเสียงผ่าน agent
    - การกำหนดค่าผู้ให้บริการและโมเดลสำหรับการสร้างเพลง
    - การทำความเข้าใจพารามิเตอร์ของเครื่องมือ `music_generate`
sidebarTitle: Music generation
summary: สร้างเพลงผ่าน `music_generate` บน Google Lyria, MiniMax และ workflows ของ ComfyUI
title: การสร้างเพลง
x-i18n:
    generated_at: "2026-04-26T11:44:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4eda549dbb93cbfe15e04462e08b7c86ff0718160244e3e5de3b041c62ee81ea
    source_path: tools/music-generation.md
    workflow: 15
---

เครื่องมือ `music_generate` ช่วยให้ agent สร้างเพลงหรือเสียงผ่าน
ความสามารถการสร้างเพลงแบบใช้ร่วมกันร่วมกับผู้ให้บริการที่ตั้งค่าไว้ — ปัจจุบันคือ Google,
MiniMax และ ComfyUI ที่กำหนดค่าแบบ workflow

สำหรับการรัน agent แบบมี session รองรับ OpenClaw จะเริ่มการสร้างเพลงเป็น
งานเบื้องหลัง ติดตามงานนั้นใน task ledger แล้วปลุก agent อีกครั้ง
เมื่อแทร็กพร้อม เพื่อให้ agent สามารถโพสต์ไฟล์เสียงที่เสร็จแล้วกลับไปยัง
ช่องทางเดิมได้

<Note>
เครื่องมือที่ใช้ร่วมกันในตัวจะปรากฏก็ต่อเมื่อมีผู้ให้บริการ
การสร้างเพลงอย่างน้อยหนึ่งรายพร้อมใช้งาน หากคุณไม่เห็น `music_generate` ใน
tools ของ agent ให้กำหนดค่า `agents.defaults.musicGenerationModel` หรือตั้งค่า
API key ของผู้ให้บริการ
</Note>

## เริ่มต้นอย่างรวดเร็ว

<Tabs>
  <Tab title="ใช้ผู้ให้บริการแบบใช้ร่วมกัน">
    <Steps>
      <Step title="กำหนดค่าการยืนยันตัวตน">
        ตั้งค่า API key สำหรับผู้ให้บริการอย่างน้อยหนึ่งราย — ตัวอย่างเช่น
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
      <Step title="สั่ง agent">
        _"สร้างเพลง synthpop จังหวะสนุกเกี่ยวกับการขับรถตอนกลางคืนผ่าน
        เมืองนีออน"_

        agent จะเรียก `music_generate` โดยอัตโนมัติ ไม่จำเป็นต้อง
        allow-list เครื่องมือ
      </Step>
    </Steps>

    สำหรับบริบทแบบซิงโครนัสโดยตรงที่ไม่มีการรัน agent แบบมี session รองรับ
    เครื่องมือในตัวจะยังคง fallback ไปสู่การสร้างแบบ inline และคืนค่า
    พาธสื่อสุดท้ายในผลลัพธ์ของเครื่องมือ

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="กำหนดค่า workflow">
        กำหนดค่า `plugins.entries.comfy.config.music` ด้วย workflow
        JSON และ prompt/output nodes
      </Step>
      <Step title="Cloud auth (ไม่บังคับ)">
        สำหรับ Comfy Cloud ให้ตั้งค่า `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY`
      </Step>
      <Step title="เรียกใช้เครื่องมือ">
        ```text
        /tool music_generate prompt="ลูปซินธ์ ambient อบอุ่นพร้อมเท็กซ์เจอร์เทปนุ่มนวล"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

ตัวอย่างพรอมป์:

```text
สร้างเพลงเปียโนแนวภาพยนตร์พร้อมเครื่องสายเบา ๆ และไม่มีเสียงร้อง
```

```text
สร้างลูป chiptune พลังสูงเกี่ยวกับการปล่อยจรวดตอนพระอาทิตย์ขึ้น
```

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ | โมเดลเริ่มต้น          | อินพุตอ้างอิง | ตัวควบคุมที่รองรับ                                        | การยืนยันตัวตน                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | สูงสุด 1 ภาพ    | เพลงหรือเสียงที่กำหนดโดย workflow                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | สูงสุด 10 ภาพ  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | ไม่มี             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` หรือ MiniMax OAuth     |

### เมทริกซ์ความสามารถ

สัญญาโหมดแบบ explicit ที่ใช้โดย `music_generate`, contract tests และ
shared live sweep:

| ผู้ให้บริการ | `generate` | `edit` | ขีดจำกัดการแก้ไข | shared live lanes                                                         |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 ภาพ    | ไม่อยู่ใน shared sweep; ครอบคลุมโดย `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 ภาพ  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | ไม่มี       | `generate`                                                                |

ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการและโมเดลแบบใช้ร่วมกันที่พร้อมใช้งาน
ขณะรันไทม์:

```text
/tool music_generate action=list
```

ใช้ `action: "status"` เพื่อตรวจสอบงานสร้างเพลงแบบมี session รองรับที่กำลังทำงาน:

```text
/tool music_generate action=status
```

ตัวอย่างการสร้างโดยตรง:

```text
/tool music_generate prompt="lo-fi hip hop ฝัน ๆ พร้อมเท็กซ์เจอร์แผ่นเสียงและเสียงฝนเบา ๆ" instrumental=true
```

## พารามิเตอร์ของเครื่องมือ

<ParamField path="prompt" type="string" required>
  พรอมป์สำหรับการสร้างเพลง จำเป็นสำหรับ `action: "generate"`
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` คืนค่างานปัจจุบันของเซสชัน; `"list"` ใช้ตรวจสอบผู้ให้บริการ
</ParamField>
<ParamField path="model" type="string">
  การแทนที่ผู้ให้บริการ/โมเดล (เช่น `google/lyria-3-pro-preview`,
  `comfy/workflow`)
</ParamField>
<ParamField path="lyrics" type="string">
  เนื้อเพลงแบบไม่บังคับเมื่อผู้ให้บริการรองรับการป้อนเนื้อเพลงโดยตรง
</ParamField>
<ParamField path="instrumental" type="boolean">
  ขอเอาต์พุตแบบมีแต่ดนตรีเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="image" type="string">
  พาธหรือ URL ของภาพอ้างอิงภาพเดียว
</ParamField>
<ParamField path="images" type="string[]">
  ภาพอ้างอิงหลายภาพ (สูงสุด 10 ภาพบนผู้ให้บริการที่รองรับ)
</ParamField>
<ParamField path="durationSeconds" type="number">
  ระยะเวลาเป้าหมายเป็นวินาทีเมื่อผู้ให้บริการรองรับคำใบ้เรื่องระยะเวลา
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  คำใบ้รูปแบบเอาต์พุตเมื่อผู้ให้บริการรองรับ
</ParamField>
<ParamField path="filename" type="string">คำใบ้ชื่อไฟล์เอาต์พุต</ParamField>
<ParamField path="timeoutMs" type="number">timeout ของคำขอไปยังผู้ให้บริการแบบไม่บังคับในหน่วยมิลลิวินาที</ParamField>

<Note>
ไม่ใช่ผู้ให้บริการทุกรายจะรองรับทุกพารามิเตอร์ OpenClaw ยังคงตรวจสอบ
ขีดจำกัดแบบฮาร์ด เช่น จำนวนอินพุต ก่อนส่งคำขอ เมื่อผู้ให้บริการรองรับ
ระยะเวลาแต่ใช้ค่าสูงสุดที่สั้นกว่าค่าที่ร้องขอ OpenClaw จะบีบค่า
ไปยังระยะเวลาที่รองรับและใกล้เคียงที่สุด คำใบ้แบบไม่บังคับที่ไม่รองรับจริง
จะถูกละเว้นพร้อมคำเตือนเมื่อผู้ให้บริการหรือโมเดลที่เลือกไม่สามารถรองรับ
ได้ ผลลัพธ์ของเครื่องมือจะรายงานการตั้งค่าที่ถูกนำไปใช้; `details.normalization`
จะบันทึกการแมประหว่างค่าที่ร้องขอกับค่าที่ถูกใช้จริง
</Note>

## พฤติกรรมแบบอะซิงโครนัส

การสร้างเพลงแบบมี session รองรับจะทำงานเป็นงานเบื้องหลัง:

- **งานเบื้องหลัง:** `music_generate` จะสร้างงานเบื้องหลัง คืนค่า
  การตอบกลับแบบ started/task ทันที และโพสต์แทร็กที่เสร็จแล้วภายหลังใน
  ข้อความติดตามผลของ agent
- **การป้องกันรายการซ้ำ:** ขณะที่งานอยู่ในสถานะ `queued` หรือ `running` การเรียก
  `music_generate` ครั้งต่อมาในเซสชันเดียวกันจะคืนค่าสถานะงานแทน
  การเริ่มสร้างใหม่ ใช้ `action: "status"` เพื่อตรวจสอบโดยชัดเจน
- **การค้นหาสถานะ:** `openclaw tasks list` หรือ `openclaw tasks show <taskId>`
  ใช้ตรวจสอบสถานะแบบ queued, running และ terminal
- **การปลุกเมื่อเสร็จสิ้น:** OpenClaw จะ inject completion event ภายในกลับ
  ไปยังเซสชันเดิม เพื่อให้โมเดลสามารถเขียนข้อความติดตามผลที่ผู้ใช้มองเห็น
  ได้ด้วยตัวเอง
- **คำใบ้ในพรอมป์:** turns ของผู้ใช้/แบบ manual ที่ตามมาภายในเซสชันเดียวกันจะได้รับ
  คำใบ้ขนาดเล็กขณะรันไทม์เมื่อมีงานเพลงกำลังทำงานอยู่ เพื่อให้โมเดล
  ไม่เรียก `music_generate` ซ้ำแบบไม่ดูบริบท
- **fallback เมื่อไม่มีเซสชัน:** บริบทแบบ direct/local ที่ไม่มี
  เซสชัน agent จริงจะรันแบบ inline และคืนผลลัพธ์เสียงสุดท้ายใน turn เดียวกัน

### วงจรชีวิตของงาน

| สถานะ       | ความหมาย                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | งานถูกสร้างแล้ว และกำลังรอให้ผู้ให้บริการรับงาน                                           |
| `running`   | ผู้ให้บริการกำลังประมวลผล (โดยทั่วไป 30 วินาทีถึง 3 นาที ขึ้นอยู่กับผู้ให้บริการและระยะเวลา) |
| `succeeded` | แทร็กพร้อมแล้ว; agent ถูกปลุกและโพสต์ลงในการสนทนา                                 |
| `failed`    | ผู้ให้บริการเกิดข้อผิดพลาดหรือ timeout; agent ถูกปลุกพร้อมรายละเอียดข้อผิดพลาด                                 |

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

1. พารามิเตอร์ `model` จากการเรียกเครื่องมือ (หาก agent ระบุมา)
2. `musicGenerationModel.primary` จาก config
3. `musicGenerationModel.fallbacks` ตามลำดับ
4. การตรวจจับอัตโนมัติโดยใช้เฉพาะค่าเริ่มต้นของผู้ให้บริการที่มี auth รองรับ:
   - ผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน
   - ผู้ให้บริการการสร้างเพลงที่ลงทะเบียนที่เหลือตามลำดับ provider-id

หากผู้ให้บริการรายหนึ่งล้มเหลว ระบบจะลอง candidate ถัดไปโดยอัตโนมัติ หากทั้งหมด
ล้มเหลว ข้อผิดพลาดจะรวมรายละเอียดจากแต่ละความพยายาม

ตั้งค่า `agents.defaults.mediaGenerationAutoProviderFallback: false` เพื่อใช้เฉพาะ
รายการ `model`, `primary` และ `fallbacks` ที่ระบุไว้อย่างชัดเจน

## หมายเหตุเฉพาะผู้ให้บริการ

<AccordionGroup>
  <Accordion title="ComfyUI">
    ขับเคลื่อนด้วย workflow และขึ้นอยู่กับกราฟที่กำหนดค่าไว้รวมถึงการแมป node
    สำหรับฟิลด์ prompt/output Plugin `comfy` แบบ bundled จะเชื่อมเข้ากับ
    เครื่องมือ `music_generate` แบบใช้ร่วมกันผ่าน registry ของผู้ให้บริการ
    การสร้างเพลง
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    ใช้การสร้างแบบ batch ของ Lyria 3 flow แบบ bundled ปัจจุบันรองรับ
    prompt, ข้อความ lyrics แบบไม่บังคับ และภาพอ้างอิงแบบไม่บังคับ
  </Accordion>
  <Accordion title="MiniMax">
    ใช้ endpoint แบบ batch `music_generation` รองรับ prompt, lyrics แบบไม่บังคับ,
    โหมด instrumental, การกำกับระยะเวลา และเอาต์พุต mp3 ผ่าน
    การยืนยันตัวตนด้วย API key ของ `minimax` หรือ OAuth ของ `minimax-portal`
  </Accordion>
</AccordionGroup>

## การเลือกเส้นทางที่เหมาะสม

- **ผู้ให้บริการแบบใช้ร่วมกัน** เมื่อคุณต้องการการเลือกโมเดล การทำ failover
  ของผู้ให้บริการ และ flow งาน/สถานะแบบอะซิงโครนัสในตัว
- **เส้นทาง Plugin (ComfyUI)** เมื่อคุณต้องการกราฟ workflow แบบกำหนดเอง หรือ
  ผู้ให้บริการที่ไม่ได้เป็นส่วนหนึ่งของความสามารถการสร้างเพลงแบบใช้ร่วมกันที่ bundled มา

หากคุณกำลังดีบักพฤติกรรมที่เฉพาะกับ ComfyUI โปรดดู
[ComfyUI](/th/providers/comfy) หากคุณกำลังดีบักพฤติกรรมของผู้ให้บริการแบบใช้ร่วมกัน
ให้เริ่มจาก [Google (Gemini)](/th/providers/google) หรือ
[MiniMax](/th/providers/minimax)

## โหมดความสามารถของผู้ให้บริการ

สัญญาการสร้างเพลงแบบใช้ร่วมกันรองรับการประกาศโหมดแบบ explicit:

- `generate` สำหรับการสร้างจาก prompt อย่างเดียว
- `edit` เมื่อคำขอมีภาพอ้างอิงอย่างน้อยหนึ่งภาพ

การติดตั้งใช้งานผู้ให้บริการใหม่ควรเลือกใช้บล็อกโหมดแบบ explicit:

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
`supportsFormat` **ไม่เพียงพอ** สำหรับการประกาศการรองรับ edit ผู้ให้บริการ
ควรประกาศ `generate` และ `edit` อย่างชัดเจน เพื่อให้ live tests, contract
tests และเครื่องมือ `music_generate` แบบใช้ร่วมกันสามารถตรวจสอบการรองรับโหมดได้
อย่างเป็นตัวกำหนดแน่นอน

## Live tests

ความครอบคลุมแบบ live ที่เป็น opt-in สำหรับผู้ให้บริการ bundled แบบใช้ร่วมกัน:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

repo wrapper:

```bash
pnpm test:live:media music
```

ไฟล์ live นี้จะโหลดตัวแปร env ของผู้ให้บริการที่ขาดหายจาก `~/.profile` ให้ความสำคัญกับ
API keys แบบ live/env มากกว่า stored auth profiles ตามค่าเริ่มต้น และรันความครอบคลุมทั้ง
`generate` และ `edit` ที่ประกาศไว้เมื่อผู้ให้บริการเปิดใช้โหมด edit ความครอบคลุมในปัจจุบัน:

- `google`: `generate` และ `edit`
- `minimax`: `generate` เท่านั้น
- `comfy`: ความครอบคลุม live ของ Comfy แยกต่างหาก ไม่ใช่ shared provider sweep

ความครอบคลุมแบบ live ที่เป็น opt-in สำหรับเส้นทางเพลง ComfyUI แบบ bundled:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

ไฟล์ live ของ Comfy ยังครอบคลุม workflows ของภาพและวิดีโอของ comfy เมื่อ
ส่วนเหล่านั้นมีการกำหนดค่าไว้

## ที่เกี่ยวข้อง

- [งานเบื้องหลัง](/th/automation/tasks) — การติดตามงานสำหรับการรัน `music_generate` แบบแยกออก
- [ComfyUI](/th/providers/comfy)
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — config `musicGenerationModel`
- [Google (Gemini)](/th/providers/google)
- [MiniMax](/th/providers/minimax)
- [โมเดล](/th/concepts/models) — การกำหนดค่าโมเดลและ failover
- [ภาพรวมของเครื่องมือ](/th/tools)
