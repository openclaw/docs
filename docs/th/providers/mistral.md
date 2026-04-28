---
read_when:
    - คุณต้องการใช้โมเดล Mistral ใน OpenClaw
    - คุณต้องการการถอดเสียงแบบเรียลไทม์ด้วย Voxtral สำหรับ Voice Call
    - คุณต้องการการเริ่มต้นใช้งาน Mistral API key และ model refs
summary: ใช้โมเดล Mistral และการถอดเสียง Voxtral กับ OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-24T09:28:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63e1eb462f836f5ddc1afd0d01954080eee461230924368d77e2e57fef12caf1
    source_path: providers/mistral.md
    workflow: 15
---

OpenClaw รองรับ Mistral ทั้งสำหรับการกำหนดเส้นทางโมเดล text/image (`mistral/...`) และ
การถอดเสียง audio ผ่าน Voxtral ใน media understanding
Mistral ยังสามารถใช้สำหรับ memory embeddings ได้ด้วย (`memorySearch.provider = "mistral"`)

- Provider: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    สร้าง API key ใน [Mistral Console](https://console.mistral.ai/)
  </Step>
  <Step title="รันการเริ่มต้นใช้งาน">
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

## แค็ตตาล็อก LLM ที่มาพร้อมระบบ

ปัจจุบัน OpenClaw มาพร้อมแค็ตตาล็อก Mistral ดังนี้:

| Model ref | อินพุต | Context | เอาต์พุตสูงสุด | หมายเหตุ |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest` | text, image | 262,144 | 16,384 | โมเดลเริ่มต้น |
| `mistral/mistral-medium-2508` | text, image | 262,144 | 8,192 | Mistral Medium 3.1 |
| `mistral/mistral-small-latest` | text, image | 128,000 | 16,384 | Mistral Small 4; มี adjustable reasoning ผ่าน API `reasoning_effort` |
| `mistral/pixtral-large-latest` | text, image | 128,000 | 32,768 | Pixtral |
| `mistral/codestral-latest` | text | 256,000 | 4,096 | Coding |
| `mistral/devstral-medium-latest` | text | 262,144 | 32,768 | Devstral 2 |
| `mistral/magistral-small` | text | 128,000 | 40,000 | เปิดใช้ reasoning |

## การถอดเสียงจาก audio (Voxtral)

ใช้ Voxtral สำหรับการถอดเสียง audio แบบเป็นชุดผ่าน
media understanding pipeline

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
เส้นทาง media transcription ใช้ `/v1/audio/transcriptions` โมเดล audio เริ่มต้นสำหรับ Mistral คือ `voxtral-mini-latest`
</Tip>

## Voice Call streaming STT

Plugin `mistral` ที่มาพร้อมระบบจะลงทะเบียน Voxtral Realtime เป็นผู้ให้บริการ
streaming STT สำหรับ Voice Call

| การตั้งค่า | เส้นทาง config | ค่าเริ่มต้น |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API key | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | fallback ไปใช้ `MISTRAL_API_KEY` |
| โมเดล | `...mistral.model` | `voxtral-mini-transcribe-realtime-2602` |
| Encoding | `...mistral.encoding` | `pcm_mulaw` |
| Sample rate | `...mistral.sampleRate` | `8000` |
| Target delay | `...mistral.targetStreamingDelayMs` | `800` |

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
OpenClaw ตั้งค่าเริ่มต้นของ Mistral realtime STT เป็น `pcm_mulaw` ที่ 8 kHz เพื่อให้ Voice Call
สามารถส่งต่อ Twilio media frames ได้โดยตรง ใช้ `encoding: "pcm_s16le"` และ
`sampleRate` ที่ตรงกัน เฉพาะเมื่อสตรีมต้นทางของคุณเป็น raw PCM อยู่แล้ว
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Adjustable reasoning (mistral-small-latest)">
    `mistral/mistral-small-latest` แมปไปยัง Mistral Small 4 และรองรับ [adjustable reasoning](https://docs.mistral.ai/capabilities/reasoning/adjustable) บน Chat Completions API ผ่าน `reasoning_effort` (`none` จะลดการคิดเพิ่มเติมในเอาต์พุตให้น้อยที่สุด; `high` จะแสดง thinking traces แบบเต็มก่อนคำตอบสุดท้าย)

    OpenClaw แมประดับ **thinking** ของ session ไปยัง API ของ Mistral:

    | ระดับ thinking ของ OpenClaw | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal** | `none` |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high` |

    <Note>
    โมเดลอื่นใน bundled Mistral catalog จะไม่ใช้พารามิเตอร์นี้ ให้ใช้โมเดล `magistral-*` ต่อไปเมื่อคุณต้องการลักษณะการทำงานแบบ reasoning-first ตามธรรมชาติของ Mistral
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
    - auth ของ Mistral ใช้ `MISTRAL_API_KEY`
    - base URL ของ provider มีค่าเริ่มต้นเป็น `https://api.mistral.ai/v1`
    - โมเดลเริ่มต้นสำหรับ onboarding คือ `mistral/mistral-large-latest`
    - Z.AI ใช้ Bearer auth กับ API key ของคุณ

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และลักษณะการทำงานของ failover
  </Card>
  <Card title="ความเข้าใจสื่อ" href="/th/nodes/media-understanding" icon="microphone">
    การตั้งค่าการถอดเสียงจาก audio และการเลือกผู้ให้บริการ
  </Card>
</CardGroup>
