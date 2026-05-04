---
read_when:
    - คุณต้องการคีย์ API เดียวสำหรับโมเดลภาษาขนาดใหญ่หลายตัว
    - คุณต้องการเรียกใช้โมเดลผ่าน OpenRouter ใน OpenClaw
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างภาพ
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างวิดีโอ
summary: ใช้ API แบบรวมของ OpenRouter เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-04T02:26:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6b7299408aa0de7530e2248c7fa5dae8c09095e2d20a0e9d12a64cab83966fc
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter มอบ **API แบบรวมศูนย์** ที่กำหนดเส้นทางคำขอไปยังหลายโมเดลภายใต้
endpoint และคีย์ API เดียว รองรับการใช้งานร่วมกับ OpenAI ดังนั้น OpenAI SDK ส่วนใหญ่จึงทำงานได้ด้วยการเปลี่ยน base URL

## เริ่มต้นใช้งาน

<Steps>
  <Step title="Get your API key">
    สร้างคีย์ API ที่ [openrouter.ai/keys](https://openrouter.ai/keys)
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optional) Switch to a specific model">
    การเริ่มต้นใช้งานตั้งค่าเริ่มต้นเป็น `openrouter/auto` เลือกโมเดลแบบเจาะจงภายหลังได้:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## ตัวอย่างการกำหนดค่า

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
ผู้ให้บริการและโมเดลที่มีให้ใช้งาน โปรดดู [/concepts/model-providers](/th/concepts/model-providers)
</Note>

ตัวอย่าง fallback ที่รวมมาให้:

| การอ้างอิงโมเดล                   | หมายเหตุ                     |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | การกำหนดเส้นทางอัตโนมัติของ OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 ผ่าน MoonshotAI    |

## การสร้างรูปภาพ

OpenRouter ยังสามารถรองรับเครื่องมือ `image_generate` ได้ด้วย ใช้โมเดลรูปภาพของ OpenRouter ภายใต้ `agents.defaults.imageGenerationModel`:

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

OpenClaw ส่งคำขอรูปภาพไปยัง API รูปภาพของ chat completions ของ OpenRouter ด้วย `modalities: ["image", "text"]` โมเดลรูปภาพ Gemini จะได้รับคำใบ้ `aspectRatio` และ `resolution` ที่รองรับผ่าน `image_config` ของ OpenRouter ใช้ `agents.defaults.imageGenerationModel.timeoutMs` สำหรับโมเดลรูปภาพ OpenRouter ที่ช้ากว่า; พารามิเตอร์ `timeoutMs` ต่อการเรียกของเครื่องมือ `image_generate` ยังมีลำดับความสำคัญสูงกว่า

## การสร้างวิดีโอ

OpenRouter ยังสามารถรองรับเครื่องมือ `video_generate` ผ่าน API แบบอะซิงโครนัส `/videos` ได้ด้วย ใช้โมเดลวิดีโอของ OpenRouter ภายใต้ `agents.defaults.videoGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw ส่งงานแปลงข้อความเป็นวิดีโอและรูปภาพเป็นวิดีโอไปยัง OpenRouter, polling
`polling_url` ที่ส่งกลับมา และดาวน์โหลดวิดีโอที่เสร็จสมบูรณ์จาก
`unsigned_urls` ของ OpenRouter หรือ endpoint เนื้อหางานที่ระบุไว้ในเอกสาร
รูปภาพอ้างอิงจะถูกส่งเป็นรูปภาพเฟรมแรก/สุดท้ายตามค่าเริ่มต้น; รูปภาพ
ที่แท็กด้วย `reference_image` จะถูกส่งเป็นข้อมูลอ้างอิงอินพุตของ OpenRouter ค่าเริ่มต้น
`google/veo-3.1-fast` ที่รวมมาให้ประกาศระยะเวลา 4/6/8
วินาทีที่รองรับในปัจจุบัน, ความละเอียด `720P`/`1080P` และอัตราส่วนภาพ
`16:9`/`9:16` ระบบไม่ได้ลงทะเบียนวิดีโอเป็นวิดีโอสำหรับ OpenRouter เพราะ API
การสร้างวิดีโอต้นทางในปัจจุบันรับข้อความและรูปภาพอ้างอิง

## ข้อความเป็นเสียงพูด

OpenRouter ยังสามารถใช้เป็นผู้ให้บริการ TTS ผ่าน endpoint
`/audio/speech` ที่รองรับการใช้งานร่วมกับ OpenAI ได้ด้วย

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

หากละเว้น `messages.tts.providers.openrouter.apiKey` ไว้ TTS จะใช้
`models.providers.openrouter.apiKey` ซ้ำก่อน จากนั้นจึงใช้ `OPENROUTER_API_KEY`

## การยืนยันตัวตนและส่วนหัว

OpenRouter ใช้โทเค็น Bearer กับคีย์ API ของคุณภายในระบบ

บนคำขอ OpenRouter จริง (`https://openrouter.ai/api/v1`) OpenClaw ยังเพิ่ม
ส่วนหัวการระบุแอปตามเอกสารของ OpenRouter:

| ส่วนหัว                   | ค่า                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
หากคุณชี้ผู้ให้บริการ OpenRouter ไปยังพร็อกซีหรือ base URL อื่น OpenClaw
จะ **ไม่** แทรกส่วนหัวเฉพาะของ OpenRouter เหล่านั้นหรือเครื่องหมายแคช Anthropic
</Warning>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Response caching">
    การแคชการตอบกลับของ OpenRouter เป็นแบบเลือกใช้ เปิดใช้งานต่อโมเดล OpenRouter ด้วย
    พารามิเตอร์โมเดล:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw ส่ง `X-OpenRouter-Cache: true` และเมื่อกำหนดค่าไว้
    จะส่ง `X-OpenRouter-Cache-TTL` `responseCacheClear: true` บังคับให้รีเฟรชสำหรับ
    คำขอปัจจุบันและจัดเก็บการตอบกลับทดแทน นอกจากนี้ยังยอมรับ alias แบบ snake_case
    (`response_cache`, `response_cache_ttl_seconds` และ
    `response_cache_clear`) ด้วย

    สิ่งนี้แยกจากการแคชพรอมป์ของผู้ให้บริการและจากเครื่องหมาย
    Anthropic `cache_control` ของ OpenRouter โดยจะถูกใช้เฉพาะบนเส้นทาง
    `openrouter.ai` ที่ตรวจสอบแล้ว ไม่ใช่ base URL พร็อกซีแบบกำหนดเอง

  </Accordion>

  <Accordion title="Anthropic cache markers">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว การอ้างอิงโมเดล Anthropic จะคง
    เครื่องหมาย Anthropic `cache_control` เฉพาะของ OpenRouter ที่ OpenClaw ใช้เพื่อ
    ให้ใช้แคชพรอมป์ซ้ำได้ดีขึ้นบนบล็อกพรอมป์ระบบ/นักพัฒนา
  </Accordion>

  <Accordion title="Anthropic reasoning prefill">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว การอ้างอิงโมเดล Anthropic ที่เปิดใช้ reasoning
    จะทิ้งเทิร์น prefill ของ assistant ที่ต่อท้ายก่อนที่คำขอจะถึง OpenRouter
    เพื่อให้ตรงกับข้อกำหนดของ Anthropic ที่การสนทนา reasoning ต้องจบด้วยเทิร์นของผู้ใช้
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    บนเส้นทาง non-`auto` ที่รองรับ OpenClaw จะแมประดับ thinking ที่เลือกไปยัง
    payload reasoning ของพร็อกซี OpenRouter คำใบ้โมเดลที่ไม่รองรับและ
    `openrouter/auto` จะข้ามการฉีด reasoning นั้น Hunter Alpha ยังข้าม
    proxy reasoning สำหรับการอ้างอิงโมเดลที่กำหนดค่าไว้แต่ล้าสมัย เพราะ OpenRouter อาจ
    ส่งข้อความคำตอบสุดท้ายกลับมาในฟิลด์ reasoning สำหรับเส้นทางที่เลิกใช้แล้วนั้น
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning replay">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว `openrouter/deepseek/deepseek-v4-flash` และ
    `openrouter/deepseek/deepseek-v4-pro` จะเติม `reasoning_content` ที่ขาดหายไปบน
    เทิร์น assistant ที่ replay เพื่อให้การสนทนา thinking/tool คงรูปแบบการติดตามผล
    ที่ DeepSeek V4 ต้องการ
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouter ยังคงทำงานผ่านเส้นทางที่รองรับ OpenAI แบบพร็อกซี ดังนั้น
    การจัดรูปคำขอเฉพาะ native OpenAI เช่น `serviceTier`, Responses `store`,
    payload ที่รองรับ reasoning ของ OpenAI และคำใบ้แคชพรอมป์จะไม่ถูกส่งต่อ
  </Accordion>

  <Accordion title="Gemini-backed routes">
    การอ้างอิง OpenRouter ที่รองรับโดย Gemini จะอยู่บนเส้นทาง proxy-Gemini: OpenClaw คง
    การทำความสะอาด thought-signature ของ Gemini ไว้ที่นั่น แต่จะไม่เปิดใช้การตรวจสอบ replay
    ของ native Gemini หรือการเขียน bootstrap ใหม่
  </Accordion>

  <Accordion title="Provider routing metadata">
    หากคุณส่งการกำหนดเส้นทางผู้ให้บริการ OpenRouter ภายใต้พารามิเตอร์โมเดล OpenClaw จะส่งต่อ
    เป็นเมทาดาทาการกำหนดเส้นทาง OpenRouter ก่อนที่ wrapper สตรีมที่ใช้ร่วมกันจะทำงาน
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    การอ้างอิงการกำหนดค่าฉบับเต็มสำหรับ agents, models และ providers
  </Card>
</CardGroup>
