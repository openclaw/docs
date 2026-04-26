---
read_when:
    - คุณต้องการ API key เดียวสำหรับ LLM หลายตัว
    - คุณต้องการเรียกใช้โมเดลผ่าน OpenRouter ใน OpenClaw
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างรูปภาพ
summary: ใช้ API แบบรวมของ OpenRouter เพื่อเข้าถึงหลายโมเดลใน OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-26T11:40:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5396b0a022746cf3dfc90fa2d0974ffe9798af1ac790e93d13398a9e622eceff
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter ให้บริการ **API แบบรวม** ที่ส่งต่อคำขอไปยังหลายโมเดลผ่านเอ็นด์พอยต์และ API key เดียว
โดยรองรับความเข้ากันได้กับ OpenAI ดังนั้น SDK ของ OpenAI ส่วนใหญ่จึงใช้งานได้โดยเพียงเปลี่ยน base URL

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    สร้าง API key ที่ [openrouter.ai/keys](https://openrouter.ai/keys)
  </Step>
  <Step title="เรียกใช้ onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(ไม่บังคับ) เปลี่ยนไปใช้โมเดลเฉพาะ">
    ค่าเริ่มต้นของ onboarding คือ `openrouter/auto` คุณสามารถเลือกโมเดลแบบเจาะจงได้ภายหลัง:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## ตัวอย่าง config

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## การอ้างอิงโมเดล

<Note>
model ref ใช้รูปแบบ `openrouter/<provider>/<model>` สำหรับรายการผู้ให้บริการและโมเดลทั้งหมด
ดูได้ที่ [/concepts/model-providers](/th/concepts/model-providers)
</Note>

ตัวอย่าง fallback ที่บันเดิลมา:

| Model ref                            | หมายเหตุ                         |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | การกำหนดเส้นทางอัตโนมัติของ OpenRouter  |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 ผ่าน MoonshotAI      |
| `openrouter/openrouter/healer-alpha` | เส้นทาง OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha` | เส้นทาง OpenRouter Hunter Alpha |

## การสร้างรูปภาพ

OpenRouter ยังสามารถใช้เป็น backend ให้กับเครื่องมือ `image_generate` ได้ ใช้โมเดลภาพของ OpenRouter ภายใต้ `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw จะส่งคำขอสร้างภาพไปยัง chat completions image API ของ OpenRouter พร้อม `modalities: ["image", "text"]` โมเดลภาพ Gemini จะได้รับคำใบ้ `aspectRatio` และ `resolution` ที่รองรับผ่าน `image_config` ของ OpenRouter ใช้ `agents.defaults.imageGenerationModel.timeoutMs` สำหรับโมเดลภาพ OpenRouter ที่ช้ากว่า; พารามิเตอร์ `timeoutMs` แบบต่อครั้งของเครื่องมือ `image_generate` จะยังมีลำดับความสำคัญสูงกว่า

## Text-to-speech

OpenRouter ยังสามารถใช้เป็นผู้ให้บริการ TTS ได้ผ่าน
เอ็นด์พอยต์ `/audio/speech` ที่เข้ากันได้กับ OpenAI

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

หากไม่ได้ระบุ `messages.tts.providers.openrouter.apiKey` TTS จะใช้ซ้ำจาก
`models.providers.openrouter.apiKey` แล้วจึง `OPENROUTER_API_KEY`

## การยืนยันตัวตนและ header

เบื้องหลัง OpenRouter ใช้ Bearer token พร้อม API key ของคุณ

บนคำขอ OpenRouter จริง (`https://openrouter.ai/api/v1`) OpenClaw ยังเพิ่ม
header การระบุแอปตามที่ OpenRouter ระบุไว้ในเอกสารด้วย:

| Header                    | Value                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
หากคุณเปลี่ยนผู้ให้บริการ OpenRouter ให้ชี้ไปยัง proxy หรือ base URL อื่น OpenClaw
จะ **ไม่** inject header เฉพาะของ OpenRouter เหล่านั้นหรือ marker ของแคช Anthropic
</Warning>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="marker ของแคช Anthropic">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว model ref ของ Anthropic จะคง
    marker `cache_control` แบบเฉพาะของ OpenRouter ที่ OpenClaw ใช้ไว้ เพื่อ
    ให้ใช้ prompt cache ซ้ำได้ดีขึ้นบนบล็อกพรอมป์ต์ system/developer
  </Accordion>

  <Accordion title="การ inject thinking / reasoning">
    บนเส้นทางที่รองรับและไม่ใช่ `auto` OpenClaw จะจับคู่ระดับ thinking ที่เลือกไปยัง
    payload reasoning ของ proxy OpenRouter คำใบ้โมเดลที่ไม่รองรับและ
    `openrouter/auto` จะข้ามการ inject reasoning นี้
  </Accordion>

  <Accordion title="การจัดรูปแบบคำขอเฉพาะของ OpenAI">
    OpenRouter ยังคงทำงานผ่านเส้นทางแบบ proxy ที่เข้ากันได้กับ OpenAI ดังนั้น
    การจัดรูปแบบคำขอเฉพาะของ OpenAI แบบ native เช่น `serviceTier`, Responses `store`,
    payload ด้าน reasoning-compat ของ OpenAI และคำใบ้ prompt cache จะไม่ถูกส่งต่อ
  </Accordion>

  <Accordion title="เส้นทางที่ขับเคลื่อนด้วย Gemini">
    ref ของ OpenRouter ที่ขับเคลื่อนด้วย Gemini จะยังอยู่บนเส้นทาง proxy-Gemini: OpenClaw จะคง
    การล้าง thought-signature ของ Gemini ไว้ที่นั่น แต่จะไม่เปิดใช้การตรวจสอบ replay
    แบบ native ของ Gemini หรือการเขียน bootstrap ใหม่
  </Accordion>

  <Accordion title="เมทาดาทาการกำหนดเส้นทางผู้ให้บริการ">
    หากคุณส่งการกำหนดเส้นทางผู้ให้บริการของ OpenRouter ผ่าน model params OpenClaw จะส่งต่อ
    เป็นเมทาดาทาการกำหนดเส้นทางของ OpenRouter ก่อนที่ตัวห่อสตรีมที่ใช้ร่วมกันจะทำงาน
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ model ref และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิง config" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิง config ฉบับเต็มสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
