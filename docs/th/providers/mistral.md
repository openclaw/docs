---
read_when:
    - คุณต้องการใช้โมเดล Mistral ใน OpenClaw
    - คุณต้องการการถอดเสียงแบบเรียลไทม์ของ Voxtral สำหรับการโทรด้วยเสียง
    - คุณต้องมีขั้นตอนเริ่มต้นใช้งานคีย์ API ของ Mistral และการอ้างอิงโมเดล
summary: ใช้โมเดล Mistral และการถอดเสียง Voxtral กับ OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-06T09:28:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb55915526e292210df61b646e1bbcdb2da86a0e46ea4bd5afd63d244f8da71a
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw มี Plugin Mistral ที่มาพร้อมในชุด ซึ่งลงทะเบียนสัญญาไว้สี่รายการ ได้แก่ chat completions, การทำความเข้าใจสื่อ (การถอดเสียงแบบชุดของ Voxtral), STT แบบเรียลไทม์สำหรับ Voice Call (Voxtral Realtime) และ memory embeddings (`mistral-embed`).

| คุณสมบัติ         | ค่า                                       |
| ---------------- | ------------------------------------------- |
| รหัสผู้ให้บริการ      | `mistral`                                   |
| Plugin           | มาพร้อมในชุด, `enabledByDefault: true`           |
| ตัวแปรสภาพแวดล้อมสำหรับ auth     | `MISTRAL_API_KEY`                           |
| แฟล็ก onboarding  | `--auth-choice mistral-api-key`             |
| แฟล็ก CLI โดยตรง  | `--mistral-api-key <key>`                   |
| API              | เข้ากันได้กับ OpenAI (`openai-completions`)    |
| Base URL         | `https://api.mistral.ai/v1`                 |
| โมเดลเริ่มต้น    | `mistral/mistral-large-latest`              |
| โมเดล embedding  | `mistral-embed`                             |
| Voxtral แบบชุด    | `voxtral-mini-latest` (การถอดเสียงเสียง) |
| Voxtral เรียลไทม์ | `voxtral-mini-transcribe-realtime-2602`     |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    สร้าง API key ใน [Mistral Console](https://console.mistral.ai/)
  </Step>
  <Step title="เรียกใช้ onboarding">
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

## แคตตาล็อก LLM ในตัว

OpenClaw ปัจจุบันจัดส่งแคตตาล็อก Mistral ที่มาพร้อมในชุดดังนี้:

| การอ้างอิงโมเดล                        | อินพุต       | บริบท | เอาต์พุตสูงสุด | หมายเหตุ                                                            |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | ข้อความ, รูปภาพ | 262,144 | 16,384     | โมเดลเริ่มต้น                                                    |
| `mistral/mistral-medium-2508`    | ข้อความ, รูปภาพ | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | ข้อความ, รูปภาพ | 128,000 | 16,384     | Mistral Small 4; ปรับ reasoning ได้ผ่าน API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | ข้อความ, รูปภาพ | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | ข้อความ        | 256,000 | 4,096      | การเขียนโค้ด                                                           |
| `mistral/devstral-medium-latest` | ข้อความ        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | ข้อความ        | 128,000 | 40,000     | เปิดใช้ reasoning                                                |

## การถอดเสียงเสียง (Voxtral)

ใช้ Voxtral สำหรับการถอดเสียงเสียงแบบชุดผ่านไปป์ไลน์การทำความเข้าใจสื่อ

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

## STT แบบสตรีมสำหรับ Voice Call

Plugin `mistral` ที่มาพร้อมในชุดลงทะเบียน Voxtral Realtime เป็นผู้ให้บริการ STT แบบสตรีมสำหรับ Voice Call

| การตั้งค่า      | พาธการกำหนดค่า                                                            | ค่าเริ่มต้น                                 |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API key      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | ถอยกลับไปใช้ `MISTRAL_API_KEY`         |
| โมเดล        | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| การเข้ารหัส     | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| อัตราสุ่มตัวอย่าง  | `...mistral.sampleRate`                                                | `8000`                                  |
| หน่วงเวลาเป้าหมาย | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

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
OpenClaw ตั้งค่าเริ่มต้น STT แบบเรียลไทม์ของ Mistral เป็น `pcm_mulaw` ที่ 8 kHz เพื่อให้ Voice Call ส่งต่อเฟรมสื่อของ Twilio ได้โดยตรง ใช้ `encoding: "pcm_s16le"` และ `sampleRate` ที่ตรงกันเฉพาะเมื่อสตรีมต้นทางของคุณเป็น PCM ดิบอยู่แล้วเท่านั้น
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Reasoning ที่ปรับได้ (mistral-small-latest)">
    `mistral/mistral-small-latest` แมปกับ Mistral Small 4 และรองรับ [reasoning ที่ปรับได้](https://docs.mistral.ai/capabilities/reasoning/adjustable) บน Chat Completions API ผ่าน `reasoning_effort` (`none` ลดการคิดเพิ่มเติมในเอาต์พุตให้น้อยที่สุด; `high` แสดงร่องรอยการคิดทั้งหมดก่อนคำตอบสุดท้าย)

    OpenClaw แมประดับ **thinking** ของเซสชันไปยัง API ของ Mistral:

    | ระดับ thinking ของ OpenClaw                          | `reasoning_effort` ของ Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    โมเดลอื่นในแคตตาล็อก Mistral ที่มาพร้อมในชุดไม่ใช้พารามิเตอร์นี้ ใช้โมเดล `magistral-*` ต่อไปเมื่อคุณต้องการพฤติกรรมแบบ reasoning-first ดั้งเดิมของ Mistral
    </Note>

  </Accordion>

  <Accordion title="Memory embeddings">
    Mistral สามารถให้บริการ memory embeddings ผ่าน `/v1/embeddings` (โมเดลเริ่มต้น: `mistral-embed`)

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth และ base URL">
    - auth ของ Mistral ใช้ `MISTRAL_API_KEY` (ส่วนหัว Bearer)
    - Base URL ของผู้ให้บริการมีค่าเริ่มต้นเป็น `https://api.mistral.ai/v1` และยอมรับรูปแบบคำขอ chat-completions มาตรฐานที่เข้ากันได้กับ OpenAI
    - โมเดลเริ่มต้นสำหรับ onboarding คือ `mistral/mistral-large-latest`
    - แทนที่ base URL ใต้ `models.providers.mistral.baseUrl` เฉพาะเมื่อ Mistral เผยแพร่ endpoint ระดับภูมิภาคที่คุณต้องใช้ไว้อย่างชัดเจนเท่านั้น

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="การทำความเข้าใจสื่อ" href="/th/nodes/media-understanding" icon="microphone">
    การตั้งค่าการถอดเสียงเสียงและการเลือกผู้ให้บริการ
  </Card>
</CardGroup>
