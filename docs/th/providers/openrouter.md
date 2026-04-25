---
read_when:
    - คุณต้องการคีย์ API เดียวสำหรับ LLM หลายตัว
    - คุณต้องการเรียกใช้โมเดลผ่าน OpenRouter ใน OpenClaw
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างภาพ
summary: ใช้ API แบบรวมของ OpenRouter เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T13:57:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0dfbe92fbe229b3d0c22fa7997adc1906609bc3ee63c780b1f66f545d327f49
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter มี **API แบบรวม** ที่กำหนดเส้นทางคำขอไปยังโมเดลจำนวนมากผ่าน
endpoint และคีย์ API เดียว โดยเข้ากันได้กับ OpenAI ดังนั้น OpenAI SDK ส่วนใหญ่จึงใช้งานได้
เพียงสลับ base URL

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API ของคุณ">
    สร้างคีย์ API ที่ [openrouter.ai/keys](https://openrouter.ai/keys)
  </Step>
  <Step title="เรียกใช้ onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(ไม่บังคับ) สลับไปใช้โมเดลที่ระบุ">
    onboarding จะตั้งค่าเริ่มต้นเป็น `openrouter/auto` คุณสามารถเลือกโมเดลที่ระบุชัดเจนภายหลังได้:

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
การอ้างอิงโมเดลใช้รูปแบบ `openrouter/<provider>/<model>` สำหรับรายการทั้งหมดของ
provider และโมเดลที่มีให้ใช้งาน โปรดดูที่ [/concepts/model-providers](/th/concepts/model-providers)
</Note>

ตัวอย่าง fallback ที่บันเดิลมา:

| การอ้างอิงโมเดล                     | หมายเหตุ                      |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | การกำหนดเส้นทางอัตโนมัติของ OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 ผ่าน MoonshotAI     |
| `openrouter/openrouter/healer-alpha` | เส้นทาง OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha` | เส้นทาง OpenRouter Hunter Alpha |

## การสร้างภาพ

OpenRouter ยังสามารถใช้เป็นแบ็กเอนด์ให้กับเครื่องมือ `image_generate` ได้ ใช้โมเดลภาพของ OpenRouter ภายใต้ `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw ส่งคำขอภาพไปยัง API chat completions สำหรับภาพของ OpenRouter ด้วย `modalities: ["image", "text"]` โมเดลภาพ Gemini จะได้รับคำใบ้ `aspectRatio` และ `resolution` ที่รองรับผ่าน `image_config` ของ OpenRouter

## การแปลงข้อความเป็นเสียง

OpenRouter ยังสามารถใช้เป็น provider สำหรับ TTS ผ่าน
endpoint `/audio/speech` ที่เข้ากันได้กับ OpenAI

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

หากละเว้น `messages.tts.providers.openrouter.apiKey` ไว้ TTS จะนำ
`models.providers.openrouter.apiKey` มาใช้ซ้ำ จากนั้นจึงใช้ `OPENROUTER_API_KEY`

## การยืนยันตัวตนและส่วนหัว

OpenRouter ใช้ Bearer token กับคีย์ API ของคุณภายในระบบ

สำหรับคำขอ OpenRouter จริง (`https://openrouter.ai/api/v1`) OpenClaw จะเพิ่ม
ส่วนหัว app-attribution ตามที่ OpenRouter ระบุไว้ในเอกสารด้วย:

| Header                    | Value                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
หากคุณเปลี่ยน provider ของ OpenRouter ให้ชี้ไปยัง proxy หรือ base URL อื่น OpenClaw
จะ **ไม่** แทรกส่วนหัวเฉพาะของ OpenRouter หรือ marker แคชของ Anthropic เหล่านั้น
</Warning>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Marker แคชของ Anthropic">
    บนเส้นทาง OpenRouter ที่ผ่านการตรวจสอบแล้ว การอ้างอิงโมเดล Anthropic จะคง
    marker `cache_control` เฉพาะของ OpenRouter ที่ OpenClaw ใช้ไว้ เพื่อให้
    ใช้ prompt cache ซ้ำได้ดีขึ้นบนบล็อก prompt ของ system/developer
  </Accordion>

  <Accordion title="การแทรก Thinking / reasoning">
    บนเส้นทางที่รองรับและไม่ใช่ `auto` OpenClaw จะจับคู่ระดับ thinking ที่เลือกไว้กับ
    payload reasoning ของ proxy OpenRouter คำใบ้โมเดลที่ไม่รองรับและ
    `openrouter/auto` จะข้ามการแทรก reasoning นี้
  </Accordion>

  <Accordion title="การจัดรูปแบบคำขอเฉพาะ OpenAI">
    OpenRouter ยังคงทำงานผ่านเส้นทางแบบ proxy ที่เข้ากันได้กับ OpenAI ดังนั้น
    การจัดรูปแบบคำขอเฉพาะ OpenAI แบบเนทีฟ เช่น `serviceTier`, Responses `store`,
    payload ด้าน reasoning compatibility ของ OpenAI และคำใบ้ prompt cache จะไม่ถูกส่งต่อ
  </Accordion>

  <Accordion title="เส้นทางที่ขับเคลื่อนด้วย Gemini">
    การอ้างอิง OpenRouter ที่ใช้ Gemini ยังคงอยู่บนเส้นทาง proxy-Gemini: OpenClaw ยังคง
    รักษา thought-signature sanitation ของ Gemini ไว้ในจุดนั้น แต่จะไม่เปิดใช้การตรวจสอบ
    replay แบบเนทีฟของ Gemini หรือ bootstrap rewrites
  </Accordion>

  <Accordion title="เมทาดาทาการกำหนดเส้นทางของ provider">
    หากคุณส่งข้อมูลการกำหนดเส้นทาง provider ของ OpenRouter ภายใต้พารามิเตอร์โมเดล OpenClaw จะส่งต่อ
    ข้อมูลนั้นเป็นเมทาดาทาการกำหนดเส้นทางของ OpenRouter ก่อนที่ตัวห่อสตรีมที่ใช้ร่วมกันจะเริ่มทำงาน
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, การอ้างอิงโมเดล, และพฤติกรรม fallback
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิง config แบบเต็มสำหรับ agents, models, และ providers
  </Card>
</CardGroup>
