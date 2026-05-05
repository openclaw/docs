---
read_when:
    - คุณต้องการคีย์ API คีย์เดียวสำหรับโมเดลภาษาขนาดใหญ่หลายตัว
    - คุณต้องการเรียกใช้โมเดลผ่าน OpenRouter ใน OpenClaw
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างภาพ
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างวิดีโอ
summary: ใช้ API แบบรวมของ OpenRouter เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-05T01:49:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2876669c6fcc958ac13c19930cd23977b8ec27ae57069d9231932cc13c75244
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter มี **API แบบรวมศูนย์** ที่กำหนดเส้นทางคำขอไปยังโมเดลจำนวนมากผ่าน
endpoint และคีย์ API เดียว โดยเข้ากันได้กับ OpenAI ดังนั้น SDK ของ OpenAI ส่วนใหญ่จึงใช้งานได้ด้วยการเปลี่ยน base URL

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
  <Step title="(ไม่บังคับ) เปลี่ยนเป็นโมเดลเฉพาะ">
    ค่าเริ่มต้นของ onboarding คือ `openrouter/auto` เลือกโมเดลที่เจาะจงได้ภายหลัง:

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
refs ของโมเดลใช้รูปแบบ `openrouter/<provider>/<model>` สำหรับรายการทั้งหมดของ
ผู้ให้บริการและโมเดลที่พร้อมใช้งาน โปรดดู [/concepts/model-providers](/th/concepts/model-providers)
</Note>

ตัวอย่าง fallback ที่รวมมาให้:

| ref ของโมเดล                     | หมายเหตุ                     |
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

OpenClaw ส่งคำขอรูปภาพไปยัง API รูปภาพของ chat completions ของ OpenRouter ด้วย `modalities: ["image", "text"]` โมเดลรูปภาพ Gemini จะได้รับคำใบ้ `aspectRatio` และ `resolution` ที่รองรับผ่าน `image_config` ของ OpenRouter ใช้ `agents.defaults.imageGenerationModel.timeoutMs` สำหรับโมเดลรูปภาพ OpenRouter ที่ช้ากว่า ส่วนพารามิเตอร์ `timeoutMs` ต่อการเรียกของเครื่องมือ `image_generate` ยังคงมีผลเหนือกว่า

## การสร้างวิดีโอ

OpenRouter ยังสามารถรองรับเครื่องมือ `video_generate` ผ่าน API แบบไม่พร้อมกัน `/videos` ของตนได้ด้วย ใช้โมเดลวิดีโอของ OpenRouter ภายใต้ `agents.defaults.videoGenerationModel`:

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

OpenClaw ส่งงาน text-to-video และ image-to-video ไปยัง OpenRouter, poll
`polling_url` ที่ส่งกลับมา และดาวน์โหลดวิดีโอที่เสร็จสมบูรณ์จาก
`unsigned_urls` ของ OpenRouter หรือ endpoint เนื้อหางานที่มีเอกสารกำกับไว้
โดยค่าเริ่มต้น รูปภาพอ้างอิงจะถูกส่งเป็นรูปภาพเฟรมแรก/เฟรมสุดท้าย ส่วนรูปภาพ
ที่ติดแท็กด้วย `reference_image` จะถูกส่งเป็นข้อมูลอ้างอิงอินพุตของ OpenRouter ค่าเริ่มต้น
`google/veo-3.1-fast` ที่รวมมาให้ประกาศระยะเวลา 4/6/8
วินาที ความละเอียด `720P`/`1080P` และอัตราส่วนภาพ `16:9`/`9:16`
ที่รองรับในปัจจุบัน ไม่ได้ลงทะเบียน video-to-video สำหรับ OpenRouter เพราะ API
การสร้างวิดีโอต้นทางปัจจุบันรับข้อความและรูปภาพอ้างอิง

## Text-to-speech

OpenRouter ยังสามารถใช้เป็นผู้ให้บริการ TTS ผ่าน endpoint
`/audio/speech` ที่เข้ากันได้กับ OpenAI ได้ด้วย

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
`models.providers.openrouter.apiKey` ซ้ำ จากนั้นจึงใช้ `OPENROUTER_API_KEY`

## การยืนยันตัวตนและ headers

OpenRouter ใช้ Bearer token กับคีย์ API ของคุณอยู่ภายใน

ในคำขอ OpenRouter จริง (`https://openrouter.ai/api/v1`) OpenClaw จะเพิ่ม
headers การระบุแอปตามที่ OpenRouter จัดทำเอกสารไว้ด้วย:

| Header                    | ค่า                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
หากคุณชี้ผู้ให้บริการ OpenRouter ไปยัง proxy หรือ base URL อื่น OpenClaw
จะ **ไม่** แทรก headers เฉพาะของ OpenRouter หรือเครื่องหมาย cache ของ Anthropic เหล่านั้น
</Warning>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การ cache การตอบกลับ">
    การ cache การตอบกลับของ OpenRouter เป็นแบบ opt-in เปิดใช้ต่อโมเดล OpenRouter ด้วย
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

    OpenClaw ส่ง `X-OpenRouter-Cache: true` และเมื่อกำหนดค่าไว้จะส่ง
    `X-OpenRouter-Cache-TTL` `responseCacheClear: true` บังคับรีเฟรชสำหรับ
    คำขอปัจจุบันและจัดเก็บการตอบกลับทดแทน alias แบบ snake_case
    (`response_cache`, `response_cache_ttl_seconds`, และ
    `response_cache_clear`) ก็ยอมรับเช่นกัน

    สิ่งนี้แยกจากการ cache prompt ของผู้ให้บริการและจากเครื่องหมาย
    Anthropic `cache_control` ของ OpenRouter โดยจะนำไปใช้เฉพาะกับเส้นทาง
    `openrouter.ai` ที่ตรวจสอบแล้วเท่านั้น ไม่ใช่ base URL ของ proxy แบบกำหนดเอง

  </Accordion>

  <Accordion title="เครื่องหมาย cache ของ Anthropic">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว refs ของโมเดล Anthropic จะเก็บ
    เครื่องหมาย Anthropic `cache_control` เฉพาะของ OpenRouter ที่ OpenClaw ใช้เพื่อ
    ให้ใช้ prompt-cache ซ้ำได้ดีขึ้นในบล็อก prompt ของ system/developer
  </Accordion>

  <Accordion title="prefill การให้เหตุผลของ Anthropic">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว refs ของโมเดล Anthropic ที่เปิดใช้การให้เหตุผล
    จะตัดเทิร์น prefill ของ assistant ท้ายสุดออกก่อนที่คำขอจะถึง OpenRouter
    เพื่อให้ตรงกับข้อกำหนดของ Anthropic ที่ให้บทสนทนาการให้เหตุผลจบด้วยเทิร์นของ user
  </Accordion>

  <Accordion title="การแทรก thinking / reasoning">
    บนเส้นทางที่รองรับซึ่งไม่ใช่ `auto` OpenClaw จะ map ระดับ thinking ที่เลือกไว้ไปยัง
    payload การให้เหตุผลของ proxy OpenRouter คำใบ้โมเดลที่ไม่รองรับและ
    `openrouter/auto` จะข้ามการแทรกการให้เหตุผลนั้น Hunter Alpha จะข้าม
    การให้เหตุผลของ proxy สำหรับ refs ของโมเดลที่กำหนดค่าไว้แต่ล้าสมัยด้วย เพราะ OpenRouter อาจ
    ส่งข้อความคำตอบสุดท้ายในฟิลด์การให้เหตุผลสำหรับเส้นทางที่เลิกใช้แล้วนั้น
  </Accordion>

  <Accordion title="การ replay การให้เหตุผลของ DeepSeek V4">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว `openrouter/deepseek/deepseek-v4-flash` และ
    `openrouter/deepseek/deepseek-v4-pro` จะเติม `reasoning_content` ที่ขาดหายไปใน
    เทิร์น assistant ที่ replay เพื่อให้บทสนทนา thinking/tool คงรูปแบบ follow-up
    ที่ DeepSeek V4 ต้องการ OpenClaw ส่งค่า
    `reasoning_effort` ที่ OpenRouter รองรับสำหรับเส้นทางเหล่านี้ โดย `xhigh` เป็นระดับที่ประกาศไว้สูงสุด
    และ override `max` ที่ล้าสมัยจะถูก map เป็น `xhigh`
  </Accordion>

  <Accordion title="การจัดรูปคำขอเฉพาะ OpenAI">
    OpenRouter ยังคงทำงานผ่านเส้นทางแบบ proxy ที่เข้ากันได้กับ OpenAI ดังนั้น
    การจัดรูปคำขอเฉพาะ OpenAI แบบ native เช่น `serviceTier`, Responses `store`,
    payload ความเข้ากันได้ด้านการให้เหตุผลของ OpenAI และคำใบ้ prompt-cache จะไม่ถูกส่งต่อ
  </Accordion>

  <Accordion title="เส้นทางที่รองรับด้วย Gemini">
    refs ของ OpenRouter ที่รองรับด้วย Gemini จะยังอยู่บนเส้นทาง proxy-Gemini: OpenClaw คง
    การทำความสะอาด thought-signature ของ Gemini ไว้ที่นั่น แต่ไม่เปิดใช้การตรวจสอบ replay ของ Gemini
    แบบ native หรือการเขียน bootstrap ใหม่
  </Accordion>

  <Accordion title="metadata การกำหนดเส้นทางผู้ให้บริการ">
    หากคุณส่งการกำหนดเส้นทางผู้ให้บริการของ OpenRouter ภายใต้พารามิเตอร์โมเดล OpenClaw จะส่งต่อ
    เป็น metadata การกำหนดเส้นทางของ OpenRouter ก่อนที่ wrapper stream แบบใช้ร่วมกันจะทำงาน
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ refs ของโมเดล และพฤติกรรม failover
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าฉบับเต็มสำหรับ agents, models และ providers
  </Card>
</CardGroup>
