---
read_when:
    - คุณต้องการใช้โมเดล Mistral ใน OpenClaw
    - คุณต้องการการถอดเสียงแบบเรียลไทม์ของ Voxtral สำหรับการโทรด้วยเสียง
    - คุณต้องมีขั้นตอนเริ่มต้นใช้งานคีย์ API ของ Mistral และข้อมูลอ้างอิงโมเดล
summary: ใช้โมเดล Mistral และการถอดเสียงด้วย Voxtral กับ OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-30T10:12:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fdba72a5a526bed78ef3a6ea633839634efca3f9d2e96b305315d534d115122
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw รองรับ Mistral สำหรับทั้งการกำหนดเส้นทางโมเดลข้อความ/รูปภาพ (`mistral/...`) และ
การถอดเสียงเสียงผ่าน Voxtral ในการทำความเข้าใจสื่อ
Mistral ยังสามารถใช้สำหรับเอ็มเบดดิงหน่วยความจำได้ด้วย (`memorySearch.provider = "mistral"`)

- Provider: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    สร้าง API key ใน [Mistral Console](https://console.mistral.ai/)
  </Step>
  <Step title="เรียกใช้การเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    หรือส่ง key โดยตรง:

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

## แคตตาล็อก LLM ในตัว

OpenClaw จัดส่งแคตตาล็อก Mistral ที่รวมมาให้นี้ในปัจจุบัน:

| การอ้างอิงโมเดล                  | อินพุต       | บริบท   | เอาต์พุตสูงสุด | หมายเหตุ                                                         |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | ข้อความ, รูปภาพ | 262,144 | 16,384     | โมเดลเริ่มต้น                                                    |
| `mistral/mistral-medium-2508`    | ข้อความ, รูปภาพ | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | ข้อความ, รูปภาพ | 128,000 | 16,384     | Mistral Small 4; ปรับการให้เหตุผลได้ผ่าน API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | ข้อความ, รูปภาพ | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | ข้อความ        | 256,000 | 4,096      | การเขียนโค้ด                                                     |
| `mistral/devstral-medium-latest` | ข้อความ        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | ข้อความ        | 128,000 | 40,000     | รองรับการให้เหตุผล                                                |

## การถอดเสียงเสียง (Voxtral)

ใช้ Voxtral สำหรับการถอดเสียงเสียงแบบแบตช์ผ่านไปป์ไลน์การทำความเข้าใจสื่อ

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

## STT แบบสตรีมมิงสำหรับ Voice Call

Plugin `mistral` ที่รวมมาให้จะลงทะเบียน Voxtral Realtime เป็นผู้ให้บริการ STT
แบบสตรีมมิงสำหรับ Voice Call

| การตั้งค่า      | เส้นทางการกำหนดค่า                                                        | ค่าเริ่มต้น                                |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API key      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | ย้อนกลับไปใช้ `MISTRAL_API_KEY`         |
| โมเดล        | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| การเข้ารหัส     | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| อัตราตัวอย่าง  | `...mistral.sampleRate`                                                | `8000`                                  |
| ความหน่วงเป้าหมาย | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

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
OpenClaw ตั้งค่า STT แบบเรียลไทม์ของ Mistral เป็นค่าเริ่มต้นที่ `pcm_mulaw` ที่ 8 kHz เพื่อให้ Voice Call
ส่งต่อเฟรมสื่อของ Twilio ได้โดยตรง ใช้ `encoding: "pcm_s16le"` และ
`sampleRate` ที่ตรงกันเฉพาะเมื่อสตรีมต้นทางของคุณเป็น PCM ดิบอยู่แล้ว
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การให้เหตุผลที่ปรับได้ (mistral-small-latest)">
    `mistral/mistral-small-latest` แมปกับ Mistral Small 4 และรองรับ [การให้เหตุผลที่ปรับได้](https://docs.mistral.ai/capabilities/reasoning/adjustable) บน Chat Completions API ผ่าน `reasoning_effort` (`none` ลดการคิดเพิ่มเติมในเอาต์พุตให้น้อยที่สุด; `high` แสดงร่องรอยการคิดทั้งหมดก่อนคำตอบสุดท้าย)

    OpenClaw แมประดับ **thinking** ของเซสชันไปยัง API ของ Mistral:

    | ระดับ thinking ของ OpenClaw                          | `reasoning_effort` ของ Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    โมเดลแคตตาล็อก Mistral อื่นที่รวมมาให้ไม่ใช้พารามิเตอร์นี้ ใช้โมเดล `magistral-*` ต่อไปเมื่อคุณต้องการพฤติกรรมเน้นการให้เหตุผลโดยกำเนิดของ Mistral
    </Note>

  </Accordion>

  <Accordion title="เอ็มเบดดิงหน่วยความจำ">
    Mistral สามารถให้บริการเอ็มเบดดิงหน่วยความจำผ่าน `/v1/embeddings` (โมเดลเริ่มต้น: `mistral-embed`)

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth และ URL ฐาน">
    - Auth ของ Mistral ใช้ `MISTRAL_API_KEY`
    - URL ฐานของ Provider มีค่าเริ่มต้นเป็น `https://api.mistral.ai/v1`
    - โมเดลเริ่มต้นของการเริ่มต้นใช้งานคือ `mistral/mistral-large-latest`
    - Z.AI ใช้ Bearer auth กับ API key ของคุณ

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก Provider, การอ้างอิงโมเดล และพฤติกรรมการสลับเมื่อขัดข้อง
  </Card>
  <Card title="การทำความเข้าใจสื่อ" href="/th/nodes/media-understanding" icon="microphone">
    การตั้งค่าการถอดเสียงเสียงและการเลือก Provider
  </Card>
</CardGroup>
