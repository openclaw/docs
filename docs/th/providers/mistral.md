---
read_when:
    - คุณต้องการใช้โมเดล Mistral ใน OpenClaw
    - คุณต้องการการถอดเสียงแบบเรียลไทม์ด้วย Voxtral สำหรับการโทรด้วยเสียง
    - คุณต้องมีขั้นตอนเริ่มต้นใช้งานคีย์ Mistral API และการอ้างอิงโมเดล
summary: ใช้โมเดล Mistral และการถอดเสียงด้วย Voxtral กับ OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-07-12T16:38:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

ปลั๊กอิน `mistral` ที่รวมมาให้ลงทะเบียนสัญญาสี่รายการ ได้แก่ การทำคำตอบแชตให้สมบูรณ์ การทำความเข้าใจสื่อ (การถอดเสียงแบบแบตช์ด้วย Voxtral), STT แบบเรียลไทม์สำหรับการโทรด้วยเสียง (Voxtral Realtime) และเวกเตอร์ฝังตัวของหน่วยความจำ (`mistral-embed`)

| คุณสมบัติ         | ค่า                                       |
| ---------------- | ------------------------------------------- |
| รหัสผู้ให้บริการ      | `mistral`                                   |
| Plugin           | รวมมาให้และเปิดใช้งานเป็นค่าเริ่มต้น                 |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน     | `MISTRAL_API_KEY`                           |
| แฟล็กสำหรับการเริ่มต้นใช้งาน  | `--auth-choice mistral-api-key`             |
| แฟล็ก CLI โดยตรง  | `--mistral-api-key <key>`                   |
| API              | เข้ากันได้กับ OpenAI (`openai-completions`)    |
| URL ฐาน         | `https://api.mistral.ai/v1`                 |
| โมเดลเริ่มต้น    | `mistral/mistral-large-latest`              |
| โมเดลเวกเตอร์ฝังตัว  | `mistral-embed`                             |
| Voxtral แบบแบตช์    | `voxtral-mini-latest` (การถอดเสียง) |
| Voxtral แบบเรียลไทม์ | `voxtral-mini-transcribe-realtime-2602`     |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API ของคุณ">
    สร้างคีย์ API ใน [Mistral Console](https://console.mistral.ai/)
  </Step>
  <Step title="ดำเนินการเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    หรือส่งคีย์โดยตรง:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="ตั้งค่าโมเดลเริ่มต้น">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## แค็ตตาล็อก LLM ในตัว

| การอ้างอิงโมเดล                        | อินพุต       | บริบท | เอาต์พุตสูงสุด | หมายเหตุ                                                 |
| -------------------------------- | ----------- | ------- | ---------- | ----------------------------------------------------- |
| `mistral/mistral-large-latest`   | ข้อความ, รูปภาพ | 262,144 | 16,384     | โมเดลเริ่มต้น                                         |
| `mistral/mistral-medium-2508`    | ข้อความ, รูปภาพ | 262,144 | 8,192      | Mistral Medium 3.1                                    |
| `mistral/mistral-medium-3-5`     | ข้อความ, รูปภาพ | 262,144 | 8,192      | Mistral Medium 3.5; ปรับระดับการใช้เหตุผลได้              |
| `mistral/mistral-small-latest`   | ข้อความ, รูปภาพ | 262,144 | 16,384     | Mistral Small 4 รุ่นล่าสุด; ปรับ `reasoning_effort` ได้ |
| `mistral/mistral-small-2603`     | ข้อความ, รูปภาพ | 262,144 | 16,384     | Mistral Small 4 รุ่นที่ตรึงไว้; ปรับ `reasoning_effort` ได้ |
| `mistral/pixtral-large-latest`   | ข้อความ, รูปภาพ | 128,000 | 32,768     | Pixtral                                               |
| `mistral/codestral-latest`       | ข้อความ        | 256,000 | 4,096      | การเขียนโค้ด                                                |
| `mistral/devstral-medium-latest` | ข้อความ        | 262,144 | 32,768     | Devstral 2                                            |
| `mistral/magistral-small`        | ข้อความ        | 128,000 | 40,000     | เปิดใช้การให้เหตุผล                                     |

เรียกดูแถวในแค็ตตาล็อกที่รวมมาให้ก่อนเปลี่ยนการกำหนดค่า:

```bash
openclaw models list --all --provider mistral --plain
```

ทดสอบเบื้องต้นกับโมเดลโดยไม่ต้องเริ่ม Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## การถอดเสียง (Voxtral)

ใช้ Voxtral สำหรับการถอดเสียงแบบแบตช์ผ่านไปป์ไลน์การทำความเข้าใจสื่อ:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
เส้นทางการถอดเสียงสื่อใช้ `/v1/audio/transcriptions` โมเดลเสียงเริ่มต้นสำหรับ Mistral คือ `voxtral-mini-latest`
</Tip>

## STT แบบสตรีมสำหรับการโทรด้วยเสียง

ปลั๊กอิน `mistral` ที่รวมมาให้ลงทะเบียน Voxtral Realtime เป็นผู้ให้บริการ STT แบบสตรีมสำหรับการโทรด้วยเสียง

| การตั้งค่า      | เส้นทางการกำหนดค่า                                                            | ค่าเริ่มต้น                                 |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| คีย์ API      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | ใช้ `MISTRAL_API_KEY` เป็นค่าทดแทน         |
| โมเดล        | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| การเข้ารหัส     | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| อัตราการสุ่มตัวอย่าง  | `...mistral.sampleRate`                                                | `8000`                                  |
| เวลาหน่วงเป้าหมาย | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
OpenClaw ตั้งค่าเริ่มต้น STT แบบเรียลไทม์ของ Mistral เป็น `pcm_mulaw` ที่ 8 kHz เพื่อให้การโทรด้วยเสียงส่งต่อเฟรมสื่อของ Twilio ได้โดยตรง ใช้ `encoding: "pcm_s16le"` และ `sampleRate` ที่ตรงกันเฉพาะเมื่อสตรีมต้นทางเป็น PCM ดิบอยู่แล้ว
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การให้เหตุผลที่ปรับระดับได้">
    `mistral/mistral-small-latest`, `mistral/mistral-small-2603` และ `mistral/mistral-medium-3-5` รองรับ[การให้เหตุผลที่ปรับระดับได้](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) บน Chat Completions API ผ่าน `reasoning_effort` (`none` ลดการคิดเพิ่มเติมในเอาต์พุตให้เหลือน้อยที่สุด ส่วน `high` แสดงร่องรอยการคิดทั้งหมดก่อนคำตอบสุดท้าย)

    OpenClaw จับคู่ระดับ **การคิด** ของเซสชันกับ API ของ Mistral:

    | ระดับการคิดของ OpenClaw                                              | `reasoning_effort` ของ Mistral |
    | ----------------------------------------------------------------------- | --------------------------- |
    | **ปิด** / **น้อยที่สุด**                                                 | `none`                      |
    | **ต่ำ** / **ปานกลาง** / **สูง** / **สูงมาก** / **ปรับตามสถานการณ์** / **สูงสุด** | `high`                       |

    <Warning>
    หลีกเลี่ยงการใช้โหมดการให้เหตุผลของ Medium 3.5 ร่วมกับ `temperature: 0` เนื่องจากมีรายงานว่า Mistral HTTP API ปฏิเสธ `reasoning_effort="high"` ที่ใช้ร่วมกับ `temperature: 0` โดยตอบกลับด้วยสถานะ 400 ให้เว้นการตั้งค่าอุณหภูมิไว้ หรือปิด/ลดการคิดให้น้อยที่สุดเพื่อให้ OpenClaw ส่ง `reasoning_effort: "none"` ก่อนตั้งค่าอุณหภูมิให้ต่ำ
    </Warning>

    ตัวอย่างการกำหนดค่าที่มีขอบเขตเฉพาะโมเดลสำหรับการให้เหตุผลของ Medium 3.5:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    โมเดลอื่นในแค็ตตาล็อก Mistral ที่รวมมาให้ไม่ใช้พารามิเตอร์นี้ ให้ใช้โมเดล `magistral-*` ต่อไปเมื่อต้องการลักษณะการทำงานแบบเน้นการให้เหตุผลเป็นอันดับแรกที่มีมาใน Mistral
    </Note>

  </Accordion>

  <Accordion title="เวกเตอร์ฝังตัวของหน่วยความจำ">
    Mistral สามารถให้บริการเวกเตอร์ฝังตัวของหน่วยความจำผ่าน `/v1/embeddings` (โมเดลเริ่มต้น: `mistral-embed`):

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="การยืนยันตัวตนและ URL ฐาน">
    - การยืนยันตัวตนของ Mistral ใช้ `MISTRAL_API_KEY` (ส่วนหัว Bearer)
    - URL ฐานของผู้ให้บริการมีค่าเริ่มต้นเป็น `https://api.mistral.ai/v1` และยอมรับรูปแบบคำขอการทำคำตอบแชตให้สมบูรณ์มาตรฐานที่เข้ากันได้กับ OpenAI
    - โมเดลเริ่มต้นสำหรับการเริ่มต้นใช้งานคือ `mistral/mistral-large-latest`
    - แทนที่ URL ฐานภายใต้ `models.providers.mistral.baseUrl` เฉพาะเมื่อ Mistral เผยแพร่ปลายทางประจำภูมิภาคที่คุณต้องใช้อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="การทำความเข้าใจสื่อ" href="/th/nodes/media-understanding" icon="microphone">
    การตั้งค่าการถอดเสียงและการเลือกผู้ให้บริการ
  </Card>
</CardGroup>
