---
read_when:
    - คุณต้องการคีย์ API เดียวสำหรับ LLM หลายตัว
    - คุณต้องการเรียกใช้โมเดลผ่าน OpenRouter ใน OpenClaw
    - คุณต้องการใช้ OpenRouter เพื่อสร้างรูปภาพ
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างวิดีโอ
summary: ใช้ API แบบรวมเป็นหนึ่งของ OpenRouter เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-10T19:55:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5016c522cb2239dadebbfe63459d0e00f43b3dc76aa49cd5b4acfd542b31be71
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter มี **API แบบรวมศูนย์** ที่กำหนดเส้นทางคำขอไปยังหลายโมเดลหลัง
endpoint และ API key เดียว โดยเข้ากันได้กับ OpenAI ดังนั้น OpenAI SDK ส่วนใหญ่จึงใช้งานได้ด้วยการเปลี่ยน base URL

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    สร้าง API key ที่ [openrouter.ai/keys](https://openrouter.ai/keys)
  </Step>
  <Step title="เรียกใช้การตั้งค่าเริ่มต้น">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(ไม่บังคับ) เปลี่ยนไปใช้โมเดลที่ระบุ">
    การตั้งค่าเริ่มต้นใช้ค่าเริ่มต้นเป็น `openrouter/auto` เลือกโมเดลที่เจาะจงภายหลังได้:

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
ผู้ให้บริการและโมเดลที่พร้อมใช้งาน โปรดดู [/concepts/model-providers](/th/concepts/model-providers)
</Note>

ตัวอย่าง fallback ที่มาพร้อมแพ็กเกจ:

| การอ้างอิงโมเดล                  | หมายเหตุ                         |
| --------------------------------- | -------------------------------- |
| `openrouter/auto`                 | การกำหนดเส้นทางอัตโนมัติของ OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 ผ่าน MoonshotAI        |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 ผ่าน MoonshotAI        |

## การสร้างรูปภาพ

OpenRouter ยังสามารถรองรับเครื่องมือ `image_generate` ได้ ใช้โมเดลรูปภาพของ OpenRouter ภายใต้ `agents.defaults.imageGenerationModel`:

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

OpenClaw ส่งคำขอรูปภาพไปยัง API รูปภาพสำหรับ chat completions ของ OpenRouter ด้วย `modalities: ["image", "text"]` โมเดลรูปภาพ Gemini จะได้รับคำใบ้ `aspectRatio` และ `resolution` ที่รองรับผ่าน `image_config` ของ OpenRouter ใช้ `agents.defaults.imageGenerationModel.timeoutMs` สำหรับโมเดลรูปภาพ OpenRouter ที่ช้ากว่า ส่วนพารามิเตอร์ `timeoutMs` ต่อการเรียกของเครื่องมือ `image_generate` ยังคงมีผลเหนือกว่า

## การสร้างวิดีโอ

OpenRouter ยังสามารถรองรับเครื่องมือ `video_generate` ผ่าน API `/videos` แบบอะซิงโครนัสได้ ใช้โมเดลวิดีโอของ OpenRouter ภายใต้ `agents.defaults.videoGenerationModel`:

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

OpenClaw ส่งงานข้อความเป็นวิดีโอและรูปภาพเป็นวิดีโอไปยัง OpenRouter, poll
`polling_url` ที่ส่งกลับมา และดาวน์โหลดวิดีโอที่เสร็จสมบูรณ์จาก
`unsigned_urls` ของ OpenRouter หรือ endpoint เนื้อหางานตามเอกสาร
โดยค่าเริ่มต้น รูปภาพอ้างอิงจะถูกส่งเป็นรูปภาพเฟรมแรก/เฟรมสุดท้าย ส่วนรูปภาพ
ที่ติดแท็กด้วย `reference_image` จะถูกส่งเป็นข้อมูลอ้างอิงอินพุตของ OpenRouter ค่าเริ่มต้น
`google/veo-3.1-fast` ที่มาพร้อมแพ็กเกจประกาศระยะเวลาที่รองรับปัจจุบัน 4/6/8
วินาที ความละเอียด `720P`/`1080P` และอัตราส่วนภาพ `16:9`/`9:16`
OpenRouter ไม่ได้ลงทะเบียนวิดีโอเป็นวิดีโอไว้ เพราะ API สร้างวิดีโอต้นทาง
ปัจจุบันรับข้อมูลอ้างอิงแบบข้อความและรูปภาพ

## ข้อความเป็นเสียง

OpenRouter ยังสามารถใช้เป็นผู้ให้บริการ TTS ผ่าน endpoint
`/audio/speech` ที่เข้ากันได้กับ OpenAI

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

หากละเว้น `messages.tts.providers.openrouter.apiKey` TTS จะใช้
`models.providers.openrouter.apiKey` ซ้ำ แล้วจึงใช้ `OPENROUTER_API_KEY`

## การยืนยันตัวตนและ headers

OpenRouter ใช้โทเค็น Bearer กับ API key ของคุณภายใน

บนคำขอ OpenRouter จริง (`https://openrouter.ai/api/v1`) OpenClaw ยังเพิ่ม
headers สำหรับการระบุแอปตามเอกสารของ OpenRouter ด้วย:

| Header                    | ค่า                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                 |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                            |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
หากคุณเปลี่ยนผู้ให้บริการ OpenRouter ให้ชี้ไปยัง proxy หรือ base URL อื่น OpenClaw
จะ **ไม่** แทรก headers เฉพาะของ OpenRouter เหล่านั้นหรือ marker แคชของ Anthropic
</Warning>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การแคชการตอบกลับ">
    การแคชการตอบกลับของ OpenRouter เป็นแบบ opt-in เปิดใช้ต่อโมเดล OpenRouter
    ด้วยพารามิเตอร์โมเดล:

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
    `X-OpenRouter-Cache-TTL` ด้วย `responseCacheClear: true` บังคับให้รีเฟรชสำหรับ
    คำขอปัจจุบันและจัดเก็บการตอบกลับที่แทนที่ alias แบบ snake_case
    (`response_cache`, `response_cache_ttl_seconds` และ
    `response_cache_clear`) ก็ยอมรับเช่นกัน

    สิ่งนี้แยกจากการแคชพรอมป์ของผู้ให้บริการและจาก marker
    `cache_control` ของ Anthropic ใน OpenRouter โดยจะใช้เฉพาะบนเส้นทาง
    `openrouter.ai` ที่ตรวจสอบแล้ว ไม่ใช่ base URL ของ proxy แบบกำหนดเอง

  </Accordion>

  <Accordion title="marker แคชของ Anthropic">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว การอ้างอิงโมเดล Anthropic จะคง
    marker `cache_control` ของ Anthropic ที่เฉพาะกับ OpenRouter ซึ่ง OpenClaw ใช้เพื่อ
    นำ prompt-cache กลับมาใช้ซ้ำได้ดีขึ้นบนบล็อกพรอมป์ system/developer
  </Accordion>

  <Accordion title="prefill การให้เหตุผลของ Anthropic">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว การอ้างอิงโมเดล Anthropic ที่เปิดใช้การให้เหตุผล
    จะลบเทิร์น prefill ของ assistant ท้ายสุดออกก่อนที่คำขอจะไปถึง OpenRouter
    เพื่อให้ตรงกับข้อกำหนดของ Anthropic ที่บทสนทนาแบบให้เหตุผลต้องจบด้วยเทิร์นของผู้ใช้
  </Accordion>

  <Accordion title="การแทรก thinking / reasoning">
    บนเส้นทาง non-`auto` ที่รองรับ OpenClaw จะแมประดับ thinking ที่เลือกไปยัง
    payload การให้เหตุผลของ proxy OpenRouter คำใบ้โมเดลที่ไม่รองรับและ
    `openrouter/auto` จะข้ามการแทรกการให้เหตุผลนั้น Hunter Alpha ยังข้าม
    การให้เหตุผลของ proxy สำหรับการอ้างอิงโมเดลที่กำหนดค่าไว้เก่า เพราะ OpenRouter อาจ
    ส่งข้อความคำตอบสุดท้ายในฟิลด์ reasoning สำหรับเส้นทางที่เลิกใช้แล้วนั้น
  </Accordion>

  <Accordion title="การเล่นซ้ำ reasoning ของ DeepSeek V4">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว `openrouter/deepseek/deepseek-v4-flash` และ
    `openrouter/deepseek/deepseek-v4-pro` จะเติม `reasoning_content` ที่ขาดหายบน
    เทิร์น assistant ที่เล่นซ้ำ เพื่อให้บทสนทนาแบบ thinking/tool คงรูปแบบติดตามผลที่
    DeepSeek V4 ต้องการ OpenClaw ส่งค่า `reasoning_effort` ที่ OpenRouter รองรับ
    สำหรับเส้นทางเหล่านี้ โดย `xhigh` เป็นระดับสูงสุดที่ประกาศไว้
    และการ override `max` ที่เก่าจะถูกแมปเป็น `xhigh`
  </Accordion>

  <Accordion title="การจัดรูปคำขอเฉพาะ OpenAI เท่านั้น">
    OpenRouter ยังคงทำงานผ่านเส้นทางที่เข้ากันได้กับ OpenAI แบบ proxy ดังนั้น
    การจัดรูปคำขอเฉพาะ OpenAI แบบ native เช่น `serviceTier`, Responses `store`,
    payload ที่เข้ากันได้กับ reasoning ของ OpenAI และคำใบ้ prompt-cache จะไม่ถูกส่งต่อ
  </Accordion>

  <Accordion title="เส้นทางที่รองรับโดย Gemini">
    การอ้างอิง OpenRouter ที่รองรับโดย Gemini จะอยู่บนเส้นทาง proxy-Gemini:
    OpenClaw ยังคงทำการล้าง thought-signature ของ Gemini ที่นั่น แต่ไม่เปิดใช้
    การตรวจสอบการเล่นซ้ำของ Gemini แบบ native หรือการเขียน bootstrap ใหม่
  </Accordion>

  <Accordion title="metadata การกำหนดเส้นทางของผู้ให้บริการ">
    หากคุณส่งการกำหนดเส้นทางผู้ให้บริการของ OpenRouter ภายใต้พารามิเตอร์โมเดล OpenClaw จะส่งต่อ
    เป็น metadata การกำหนดเส้นทางของ OpenRouter ก่อนที่ wrapper สตรีมที่ใช้ร่วมกันจะทำงาน
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าแบบเต็มสำหรับ agents, โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
