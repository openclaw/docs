---
read_when:
    - การสร้างเพลงหรือเสียงผ่านเอเจนต์
    - การกำหนดค่า provider และโมเดลสำหรับการสร้างเพลง
    - การทำความเข้าใจพารามิเตอร์ของเครื่องมือ `music_generate`
summary: สร้างเพลงด้วย provider แบบใช้ร่วมกัน รวมถึง Plugin ที่ขับเคลื่อนด้วยเวิร์กโฟลว์
title: การสร้างเพลง
x-i18n:
    generated_at: "2026-04-25T14:01:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe66c6dfb54c71b1d08a486c574e8a86cf3731d5339b44b9eef121f045c13cb8
    source_path: tools/music-generation.md
    workflow: 15
---

เครื่องมือ `music_generate` ช่วยให้เอเจนต์สร้างเพลงหรือเสียงผ่าน
ความสามารถด้านการสร้างเพลงแบบใช้ร่วมกัน โดยใช้ provider ที่กำหนดค่าไว้ เช่น Google,
MiniMax และ ComfyUI ที่กำหนดค่าผ่าน workflow

สำหรับเซสชันเอเจนต์ที่ใช้ provider แบบใช้ร่วมกัน OpenClaw จะเริ่มการสร้างเพลงเป็น
งานเบื้องหลัง ติดตามงานนั้นใน task ledger แล้วปลุกเอเจนต์อีกครั้งเมื่อแทร็กพร้อม
เพื่อให้เอเจนต์โพสต์ไฟล์เสียงที่เสร็จแล้วกลับไปยัง channel เดิม

<Note>
เครื่องมือแบบใช้ร่วมกันที่มีมาในตัวจะปรากฏก็ต่อเมื่อมี provider สำหรับการสร้างเพลงอย่างน้อยหนึ่งรายการเท่านั้น หากคุณไม่เห็น `music_generate` ในรายการเครื่องมือของเอเจนต์ ให้กำหนดค่า `agents.defaults.musicGenerationModel` หรือตั้งค่า API key ของ provider
</Note>

## เริ่มต้นอย่างรวดเร็ว

### การสร้างผ่าน provider แบบใช้ร่วมกัน

1. ตั้งค่า API key สำหรับอย่างน้อยหนึ่ง provider เช่น `GEMINI_API_KEY` หรือ
   `MINIMAX_API_KEY`
2. หากต้องการ ให้ตั้งค่าโมเดลที่ต้องการ:

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

3. ขอให้เอเจนต์: _"สร้างเพลง synthpop จังหวะสนุกเกี่ยวกับการขับรถตอนกลางคืน
   ผ่านเมืองนีออน"_

เอเจนต์จะเรียก `music_generate` โดยอัตโนมัติ ไม่จำเป็นต้องกำหนด allow-list ให้เครื่องมือ

สำหรับบริบทแบบ synchronous โดยตรงที่ไม่มีการรันเอเจนต์แบบอิง session เครื่องมือที่มีมาในตัว
จะยังคง fallback ไปใช้การสร้างแบบ inline และส่งคืนพาธสื่อสุดท้ายในผลลัพธ์ของเครื่องมือ

ตัวอย่าง prompt:

```text
สร้างเพลงเปียโนแบบภาพยนตร์พร้อมสตริงนุ่ม ๆ และไม่มีเสียงร้อง
```

```text
สร้างลูป chiptune ที่มีพลังเกี่ยวกับการปล่อยจรวดตอนพระอาทิตย์ขึ้น
```

### การสร้างด้วย Comfy ที่ขับเคลื่อนด้วย workflow

Plugin `comfy` ที่มีมาในตัวจะเชื่อมเข้ากับเครื่องมือ `music_generate` แบบใช้ร่วมกัน
ผ่าน registry ของ provider สำหรับการสร้างเพลง

1. กำหนดค่า `plugins.entries.comfy.config.music` ด้วย workflow JSON และ
   โหนด prompt/output
2. หากคุณใช้ Comfy Cloud ให้ตั้งค่า `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY`
3. ขอให้เอเจนต์สร้างเพลงหรือเรียกใช้เครื่องมือโดยตรง

ตัวอย่าง:

```text
/tool music_generate prompt="ลูปซินธ์แอมเบียนต์อบอุ่นพร้อมพื้นผิวเทปนุ่ม ๆ"
```

## การรองรับ provider แบบใช้ร่วมกันที่มีมาในตัว

| Provider | โมเดลเริ่มต้น         | อินพุตอ้างอิง   | ตัวควบคุมที่รองรับ                                      | API key                                |
| -------- | ---------------------- | --------------- | ------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | สูงสุด 1 ภาพ    | เพลงหรือเสียงที่กำหนดโดย workflow                      | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | สูงสุด 10 ภาพ   | `lyrics`, `instrumental`, `format`                      | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | ไม่มี           | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                    |

### เมทริกซ์ความสามารถที่ประกาศไว้

นี่คือสัญญาโหมดแบบชัดเจนที่ใช้โดย `music_generate`, contract tests
และ shared live sweep

| Provider | `generate` | `edit` | ขีดจำกัดการแก้ไข | live lane แบบใช้ร่วมกัน                                                     |
| -------- | ---------- | ------ | ----------------- | --------------------------------------------------------------------------- |
| ComfyUI  | Yes        | Yes    | 1 ภาพ             | ไม่อยู่ใน shared sweep; ครอบคลุมโดย `extensions/comfy/comfy.live.test.ts` |
| Google   | Yes        | Yes    | 10 ภาพ            | `generate`, `edit`                                                          |
| MiniMax  | Yes        | No     | None              | `generate`                                                                  |

ใช้ `action: "list"` เพื่อตรวจสอบ provider และโมเดลแบบใช้ร่วมกันที่มีอยู่
ขณะรันจริง:

```text
/tool music_generate action=list
```

ใช้ `action: "status"` เพื่อตรวจสอบงานสร้างเพลงแบบอิง session ที่กำลังทำงานอยู่:

```text
/tool music_generate action=status
```

ตัวอย่างการสร้างโดยตรง:

```text
/tool music_generate prompt="lo-fi hip hop แบบชวนฝันพร้อมพื้นผิวแผ่นเสียงและเสียงฝนเบา ๆ" instrumental=true
```

## พารามิเตอร์ของเครื่องมือที่มีมาในตัว

| พารามิเตอร์      | ประเภท    | คำอธิบาย                                                                                       |
| ---------------- | --------- | ----------------------------------------------------------------------------------------------- |
| `prompt`         | string    | prompt สำหรับการสร้างเพลง (จำเป็นสำหรับ `action: "generate"`)                                |
| `action`         | string    | `"generate"` (ค่าเริ่มต้น), `"status"` สำหรับงานของ session ปัจจุบัน หรือ `"list"` เพื่อตรวจสอบ provider |
| `model`          | string    | override provider/model เช่น `google/lyria-3-pro-preview` หรือ `comfy/workflow`               |
| `lyrics`         | string    | เนื้อเพลงแบบไม่บังคับ เมื่อ provider รองรับการป้อนเนื้อเพลงโดยตรง                            |
| `instrumental`   | boolean   | ขอเอาต์พุตแบบไม่มีเสียงร้อง เมื่อ provider รองรับ                                              |
| `image`          | string    | พาธหรือ URL ของภาพอ้างอิงเดี่ยว                                                                 |
| `images`         | string[]  | ภาพอ้างอิงหลายภาพ (สูงสุด 10 ภาพ)                                                              |
| `durationSeconds`| number    | ความยาวเป้าหมายเป็นวินาที เมื่อ provider รองรับคำใบ้ด้านระยะเวลา                             |
| `timeoutMs`      | number    | timeout ของคำขอ provider เป็นมิลลิวินาทีแบบไม่บังคับ                                          |
| `format`         | string    | คำใบ้รูปแบบเอาต์พุต (`mp3` หรือ `wav`) เมื่อ provider รองรับ                                  |
| `filename`       | string    | คำใบ้ชื่อไฟล์เอาต์พุต                                                                           |

ไม่ใช่ทุก provider ที่รองรับทุกพารามิเตอร์ OpenClaw ยังคงตรวจสอบขีดจำกัดแบบตายตัว
เช่น จำนวนอินพุต ก่อนส่งคำขอ เมื่อ provider รองรับ duration แต่
ใช้ค่าสูงสุดที่สั้นกว่าค่าที่ร้องขอ OpenClaw จะ clamp
ไปยังค่าระยะเวลาที่รองรับที่ใกล้ที่สุดโดยอัตโนมัติ ส่วนคำใบ้แบบไม่บังคับที่ไม่รองรับจริง
จะถูกละเว้นพร้อมคำเตือน เมื่อ provider หรือโมเดลที่เลือกไม่สามารถรองรับได้

ผลลัพธ์ของเครื่องมือจะรายงานการตั้งค่าที่ถูกนำไปใช้ เมื่อ OpenClaw clamp duration ระหว่างการ fallback ของ provider ค่า `durationSeconds` ที่ส่งคืนจะสะท้อนค่าที่ส่งจริง และ `details.normalization.durationSeconds` จะแสดงการแมประหว่างค่าที่ร้องขอกับค่าที่นำไปใช้

## พฤติกรรมแบบ async สำหรับเส้นทางที่ใช้ provider แบบใช้ร่วมกัน

- การรันเอเจนต์แบบอิง session: `music_generate` จะสร้างงานเบื้องหลัง ส่งคืนการตอบกลับแบบ started/task ทันที แล้วโพสต์แทร็กที่เสร็จแล้วภายหลังในข้อความติดตามจากเอเจนต์
- การป้องกันรายการซ้ำ: ขณะที่งานเบื้องหลังนั้นยังเป็น `queued` หรือ `running` การเรียก `music_generate` ครั้งถัดไปใน session เดียวกันจะส่งคืนสถานะงานแทนการเริ่มการสร้างใหม่
- การตรวจสอบสถานะ: ใช้ `action: "status"` เพื่อตรวจสอบงานเพลงแบบอิง session ที่กำลังทำงานอยู่โดยไม่เริ่มงานใหม่
- การติดตามงาน: ใช้ `openclaw tasks list` หรือ `openclaw tasks show <taskId>` เพื่อตรวจสอบสถานะ queued, running และสถานะปลายทางของการสร้าง
- การปลุกเมื่อเสร็จ: OpenClaw จะ inject completion event ภายในกลับเข้าไปยัง session เดิม เพื่อให้โมเดลสามารถเขียนข้อความติดตามที่ผู้ใช้มองเห็นได้ด้วยตัวเอง
- คำใบ้ใน prompt: เทิร์นถัดไปจากผู้ใช้/แบบ manual ใน session เดียวกันจะได้รับคำใบ้เล็กน้อยจาก runtime เมื่อมีงานเพลงที่กำลังทำอยู่แล้ว เพื่อไม่ให้โมเดลเรียก `music_generate` ซ้ำแบบไม่รู้สถานะ
- fallback แบบไม่มี session: บริบทแบบ direct/local ที่ไม่มี session ของเอเจนต์จริง จะยังคงรันแบบ inline และส่งคืนผลลัพธ์ไฟล์เสียงสุดท้ายในเทิร์นเดียวกัน

### วงจรชีวิตของงาน

คำขอ `music_generate` แต่ละรายการจะเคลื่อนผ่าน 4 สถานะ:

1. **queued** -- สร้างงานแล้ว และกำลังรอให้ provider รับงาน
2. **running** -- provider กำลังประมวลผล (โดยทั่วไป 30 วินาทีถึง 3 นาที ขึ้นอยู่กับ provider และระยะเวลา)
3. **succeeded** -- แทร็กพร้อมแล้ว; เอเจนต์จะถูกปลุกและโพสต์กลับไปยังบทสนทนา
4. **failed** -- เกิดข้อผิดพลาดจาก provider หรือ timeout; เอเจนต์จะถูกปลุกพร้อมรายละเอียดข้อผิดพลาด

ตรวจสอบสถานะจาก CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

การป้องกันรายการซ้ำ: หากมีงานเพลงที่เป็น `queued` หรือ `running` อยู่แล้วสำหรับ session ปัจจุบัน `music_generate` จะส่งคืนสถานะของงานเดิมแทนการเริ่มงานใหม่ ใช้ `action: "status"` เพื่อตรวจสอบอย่างชัดเจนโดยไม่กระตุ้นการสร้างใหม่

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

### ลำดับการเลือก provider

เมื่อสร้างเพลง OpenClaw จะลองใช้ provider ตามลำดับนี้:

1. พารามิเตอร์ `model` จากการเรียกเครื่องมือ หากเอเจนต์ระบุมา
2. `musicGenerationModel.primary` จาก config
3. `musicGenerationModel.fallbacks` ตามลำดับ
4. การตรวจจับอัตโนมัติโดยใช้เฉพาะค่าเริ่มต้นของ provider ที่รองรับ auth:
   - provider เริ่มต้นปัจจุบันก่อน
   - provider สำหรับการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id

หาก provider ใดล้มเหลว จะลองตัวถัดไปโดยอัตโนมัติ หากทั้งหมดล้มเหลว
ข้อผิดพลาดจะรวมรายละเอียดจากทุกครั้งที่ลอง

ตั้งค่า `agents.defaults.mediaGenerationAutoProviderFallback: false` หากคุณต้องการให้
การสร้างเพลงใช้เฉพาะรายการ `model`, `primary` และ `fallbacks`
ที่ระบุไว้อย่างชัดเจนเท่านั้น

## หมายเหตุเกี่ยวกับ provider

- Google ใช้การสร้างแบบแบตช์ด้วย Lyria 3 โดย flow ที่มีมาในตัวปัจจุบันรองรับ
  prompt, ข้อความเนื้อเพลงแบบไม่บังคับ และภาพอ้างอิงแบบไม่บังคับ
- MiniMax ใช้ endpoint `music_generation` แบบแบตช์ โดย flow ที่มีมาในตัวปัจจุบัน
  รองรับ prompt, เนื้อเพลงแบบไม่บังคับ, โหมด instrumental, การกำหนดทิศทางระยะเวลา และ
  เอาต์พุต mp3
- การรองรับ ComfyUI ขับเคลื่อนด้วย workflow และขึ้นอยู่กับกราฟที่กำหนดค่าไว้รวมถึง
  การแมปโหนดสำหรับฟิลด์ prompt/output

## โหมดความสามารถของ provider

ขณะนี้สัญญาการสร้างเพลงแบบใช้ร่วมกันรองรับการประกาศโหมดอย่างชัดเจน:

- `generate` สำหรับการสร้างจาก prompt อย่างเดียว
- `edit` เมื่อคำขอมีภาพอ้างอิงหนึ่งภาพหรือมากกว่า

การติดตั้งใช้งาน provider ใหม่ควรใช้บล็อกโหมดแบบชัดเจนเป็นหลัก:

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
`supportsFormat` ไม่เพียงพอสำหรับการประกาศการรองรับ `edit` provider ควร
ประกาศ `generate` และ `edit` อย่างชัดเจน เพื่อให้ live tests, contract tests และ
เครื่องมือ `music_generate` แบบใช้ร่วมกันสามารถตรวจสอบการรองรับโหมดได้อย่างแน่นอน

## การเลือกเส้นทางที่เหมาะสม

- ใช้เส้นทางที่ใช้ provider แบบใช้ร่วมกันเมื่อคุณต้องการการเลือกโมเดล, provider failover และ flow task/status แบบ async ที่มีมาในตัว
- ใช้เส้นทางแบบ Plugin เช่น ComfyUI เมื่อคุณต้องการกราฟ workflow แบบกำหนดเอง หรือ provider ที่ไม่ได้เป็นส่วนหนึ่งของความสามารถการสร้างเพลงแบบใช้ร่วมกันที่มีมาในตัว
- หากคุณกำลังดีบักพฤติกรรมเฉพาะของ ComfyUI ให้ดู [ComfyUI](/th/providers/comfy) หากคุณกำลังดีบักพฤติกรรมของ provider แบบใช้ร่วมกัน ให้เริ่มจาก [Google (Gemini)](/th/providers/google) หรือ [MiniMax](/th/providers/minimax)

## การทดสอบแบบ live

การครอบคลุมแบบ live แบบ opt-in สำหรับ provider ที่มีมาในตัวและใช้ร่วมกัน:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

wrapper ของ repo:

```bash
pnpm test:live:media music
```

ไฟล์ live นี้จะโหลดตัวแปร env ของ provider ที่ขาดหายจาก `~/.profile`, ให้ความสำคัญกับ
API key จาก live/env มากกว่า auth profiles ที่จัดเก็บไว้โดยค่าเริ่มต้น และรันทั้ง
การครอบคลุม `generate` และ `edit` ที่ประกาศไว้เมื่อ provider เปิดใช้โหมด edit

ปัจจุบันหมายความว่า:

- `google`: `generate` และ `edit`
- `minimax`: `generate` เท่านั้น
- `comfy`: การครอบคลุม live ของ Comfy แยกต่างหาก ไม่รวมอยู่ใน shared provider sweep

การครอบคลุมแบบ live แบบ opt-in สำหรับเส้นทางเพลง ComfyUI ที่มีมาในตัว:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

ไฟล์ live ของ Comfy ยังครอบคลุม workflow ของภาพและวิดีโอของ Comfy เมื่อมีการกำหนดค่า
ส่วนเหล่านั้นไว้ด้วย

## ที่เกี่ยวข้อง

- [Background Tasks](/th/automation/tasks) - การติดตามงานสำหรับการรัน `music_generate` แบบแยกออกไป
- [Configuration Reference](/th/gateway/config-agents#agent-defaults) - config `musicGenerationModel`
- [ComfyUI](/th/providers/comfy)
- [Google (Gemini)](/th/providers/google)
- [MiniMax](/th/providers/minimax)
- [Models](/th/concepts/models) - การกำหนดค่าโมเดลและ failover
- [ภาพรวมเครื่องมือ](/th/tools)
