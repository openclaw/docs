---
read_when:
    - คุณต้องการใช้ Mistral models ใน OpenClaw
    - คุณต้องการการถอดเสียงแบบเรียลไทม์ของ Voxtral สำหรับ Voice Call
    - คุณต้องการ onboarding สำหรับ Mistral API key และ model refs
summary: ใช้ Mistral models และการถอดเสียง Voxtral กับ OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-23T10:22:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbf2f8926a1e8c877a12ea395e96622ff3b337ffa1368277c03abbfb881b18cf
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw รองรับ Mistral สำหรับทั้งการกำหนดเส้นทาง model แบบข้อความ/ภาพ (`mistral/...`) และ
การถอดเสียงเสียงผ่าน Voxtral ใน media understanding
Mistral ยังสามารถใช้สำหรับ memory embeddings ได้ด้วย (`memorySearch.provider = "mistral"`)

- Provider: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    สร้าง API key ใน [Mistral Console](https://console.mistral.ai/)
  </Step>
  <Step title="รัน onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    หรือส่ง key โดยตรง:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="ตั้งค่า model เริ่มต้น">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="ตรวจสอบว่า model พร้อมใช้งาน">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## แค็ตตาล็อก LLM ในตัว

ปัจจุบัน OpenClaw มาพร้อมแค็ตตาล็อก Mistral แบบ bundled ดังนี้:

| Model ref                        | อินพุต      | Context | เอาต์พุตสูงสุด | หมายเหตุ                                                          |
| -------------------------------- | ----------- | ------- | --------------- | ----------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | ข้อความ, ภาพ | 262,144 | 16,384          | model เริ่มต้น                                                    |
| `mistral/mistral-medium-2508`    | ข้อความ, ภาพ | 262,144 | 8,192           | Mistral Medium 3.1                                                |
| `mistral/mistral-small-latest`   | ข้อความ, ภาพ | 128,000 | 16,384          | Mistral Small 4; ปรับ reasoning ได้ผ่าน API `reasoning_effort`    |
| `mistral/pixtral-large-latest`   | ข้อความ, ภาพ | 128,000 | 32,768          | Pixtral                                                           |
| `mistral/codestral-latest`       | ข้อความ      | 256,000 | 4,096           | สำหรับโค้ด                                                        |
| `mistral/devstral-medium-latest` | ข้อความ      | 262,144 | 32,768          | Devstral 2                                                        |
| `mistral/magistral-small`        | ข้อความ      | 128,000 | 40,000          | เปิดใช้ reasoning                                                 |

## การถอดเสียงเสียง (Voxtral)

ใช้ Voxtral สำหรับการถอดเสียงเสียงแบบแบตช์ผ่านไปป์ไลน์
media understanding

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
เส้นทางการถอดเสียงของ media ใช้ `/v1/audio/transcriptions` model เสียงเริ่มต้นสำหรับ Mistral คือ `voxtral-mini-latest`
</Tip>

## Voice Call streaming STT

plugin `mistral` แบบ bundled จะลงทะเบียน Voxtral Realtime เป็นผู้ให้บริการ
streaming STT สำหรับ Voice Call

| การตั้งค่า      | พาธ config                                                            | ค่าเริ่มต้น                             |
| --------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| API key         | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | fallback ไปใช้ `MISTRAL_API_KEY`        |
| Model           | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Encoding        | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| อัตราสุ่มตัวอย่าง | `...mistral.sampleRate`                                              | `8000`                                  |
| Target delay    | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

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
OpenClaw ตั้งค่าเริ่มต้นสำหรับ realtime STT ของ Mistral เป็น `pcm_mulaw` ที่ 8 kHz เพื่อให้ Voice Call
สามารถส่งต่อ media frames ของ Twilio ได้โดยตรง ใช้ `encoding: "pcm_s16le"` และ
`sampleRate` ที่ตรงกัน เฉพาะเมื่อสตรีมต้นทางของคุณเป็น raw PCM อยู่แล้ว
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Adjustable reasoning (mistral-small-latest)">
    `mistral/mistral-small-latest` จับคู่กับ Mistral Small 4 และรองรับ [adjustable reasoning](https://docs.mistral.ai/capabilities/reasoning/adjustable) บน Chat Completions API ผ่าน `reasoning_effort` (`none` จะลดการคิดเพิ่มเติมในเอาต์พุตให้เหลือน้อยที่สุด; `high` จะแสดงร่องรอยการคิดเต็มรูปแบบก่อนคำตอบสุดท้าย)

    OpenClaw จับคู่ระดับ **thinking** ของ session เข้ากับ API ของ Mistral:

    | ระดับ thinking ของ OpenClaw                  | `reasoning_effort` ของ Mistral |
    | -------------------------------------------- | ------------------------------ |
    | **off** / **minimal**                        | `none`                         |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    models อื่นในแค็ตตาล็อก Mistral แบบ bundled ไม่ได้ใช้พารามิเตอร์นี้ ให้ใช้ models `magistral-*` ต่อไปเมื่อคุณต้องการพฤติกรรมแบบ reasoning-first โดย native ของ Mistral
    </Note>

  </Accordion>

  <Accordion title="Memory embeddings">
    Mistral สามารถให้บริการ memory embeddings ผ่าน `/v1/embeddings` (model เริ่มต้น: `mistral-embed`)

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth and base URL">
    - auth ของ Mistral ใช้ `MISTRAL_API_KEY`
    - base URL ของ provider มีค่าเริ่มต้นเป็น `https://api.mistral.ai/v1`
    - model เริ่มต้นของ onboarding คือ `mistral/mistral-large-latest`
    - Z.AI ใช้ Bearer auth ด้วย API key ของคุณ
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และพฤติกรรม failover
  </Card>
  <Card title="Media understanding" href="/th/nodes/media-understanding" icon="microphone">
    การตั้งค่าการถอดเสียงเสียงและการเลือก provider
  </Card>
</CardGroup>
