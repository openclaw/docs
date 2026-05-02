---
read_when:
    - คุณต้องการคีย์ API เดียวสำหรับ LLM หลายตัว
    - คุณต้องการเรียกใช้โมเดลผ่าน OpenRouter ใน OpenClaw
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างภาพ
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างวิดีโอ
summary: ใช้ API แบบรวมศูนย์ของ OpenRouter เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T10:27:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: e98b8b540265b6d11681390c02cb68312f33625bf223823a2dbca17e877c0422
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter มอบ **API แบบรวมศูนย์** ที่กำหนดเส้นทางคำขอไปยังหลายโมเดลผ่าน
endpoint และ API key เดียว โดยเข้ากันได้กับ OpenAI ดังนั้น OpenAI SDK ส่วนใหญ่จึงทำงานได้ด้วยการเปลี่ยน base URL

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    สร้าง API key ที่ [openrouter.ai/keys](https://openrouter.ai/keys)
  </Step>
  <Step title="เรียกใช้ออนบอร์ดิง">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(ไม่บังคับ) สลับไปใช้โมเดลที่ระบุ">
    ออนบอร์ดิงตั้งค่าเริ่มต้นเป็น `openrouter/auto` เลือกโมเดลที่เจาะจงได้ภายหลัง:

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

ตัวอย่าง fallback ที่รวมมาให้:

| การอ้างอิงโมเดล                 | หมายเหตุ                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | การกำหนดเส้นทางอัตโนมัติของ OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 ผ่าน MoonshotAI     |

## การสร้างภาพ

OpenRouter ยังสามารถรองรับเครื่องมือ `image_generate` ได้ ใช้โมเดลภาพของ OpenRouter ภายใต้ `agents.defaults.imageGenerationModel`:

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

OpenClaw ส่งคำขอภาพไปยัง chat completions image API ของ OpenRouter พร้อม `modalities: ["image", "text"]` โมเดลภาพ Gemini จะได้รับคำแนะนำ `aspectRatio` และ `resolution` ที่รองรับผ่าน `image_config` ของ OpenRouter ใช้ `agents.defaults.imageGenerationModel.timeoutMs` สำหรับโมเดลภาพของ OpenRouter ที่ทำงานช้ากว่า ส่วนพารามิเตอร์ `timeoutMs` รายการเรียกของเครื่องมือ `image_generate` ยังคงมีผลเหนือกว่า

## การสร้างวิดีโอ

OpenRouter ยังสามารถรองรับเครื่องมือ `video_generate` ผ่าน API `/videos` แบบอะซิงโครนัสของตนได้ ใช้โมเดลวิดีโอของ OpenRouter ภายใต้ `agents.defaults.videoGenerationModel`:

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

OpenClaw ส่งงาน text-to-video และ image-to-video ไปยัง OpenRouter, โพล
`polling_url` ที่ส่งกลับมา และดาวน์โหลดวิดีโอที่เสร็จสมบูรณ์จาก
`unsigned_urls` ของ OpenRouter หรือ endpoint เนื้อหางานตามเอกสาร
รูปภาพอ้างอิงจะถูกส่งเป็นภาพเฟรมแรก/สุดท้ายโดยค่าเริ่มต้น รูปภาพ
ที่ติดแท็กด้วย `reference_image` จะถูกส่งเป็นข้อมูลอ้างอิงอินพุตของ OpenRouter ค่าเริ่มต้น
`google/veo-3.1-fast` ที่รวมมาให้ประกาศระยะเวลา 4/6/8
วินาทีที่รองรับอยู่ในปัจจุบัน ความละเอียด `720P`/`1080P` และอัตราส่วนภาพ
`16:9`/`9:16` ไม่ได้ลงทะเบียน video-to-video สำหรับ OpenRouter เพราะ API
การสร้างวิดีโอ upstream ปัจจุบันรับข้อความและรูปภาพอ้างอิง

## Text-to-speech

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
`models.providers.openrouter.apiKey` ซ้ำ จากนั้นจึงใช้ `OPENROUTER_API_KEY`

## การตรวจสอบสิทธิ์และ headers

OpenRouter ใช้ Bearer token พร้อม API key ของคุณภายใน

สำหรับคำขอ OpenRouter จริง (`https://openrouter.ai/api/v1`) OpenClaw ยังเพิ่ม
headers ระบุแหล่งที่มาของแอปตามเอกสารของ OpenRouter:

| Header                    | ค่า                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
หากคุณชี้ผู้ให้บริการ OpenRouter ไปยังพร็อกซีหรือ base URL อื่น OpenClaw
จะ **ไม่** แทรก headers เฉพาะของ OpenRouter เหล่านั้นหรือมาร์กเกอร์แคชของ Anthropic
</Warning>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="มาร์กเกอร์แคชของ Anthropic">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว การอ้างอิงโมเดล Anthropic จะคง
    มาร์กเกอร์ `cache_control` ของ Anthropic เฉพาะ OpenRouter ที่ OpenClaw ใช้เพื่อ
    ให้ใช้ prompt-cache ซ้ำได้ดีขึ้นบนบล็อกพรอมป์ system/developer
  </Accordion>

  <Accordion title="prefill เหตุผลของ Anthropic">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว การอ้างอิงโมเดล Anthropic ที่เปิดใช้เหตุผล
    จะลบ assistant prefill turns ท้ายสุดก่อนที่คำขอจะไปถึง OpenRouter
    ให้ตรงกับข้อกำหนดของ Anthropic ที่การสนทนาแบบ reasoning ต้องจบด้วย user
    turn
  </Accordion>

  <Accordion title="การแทรกการคิด / การให้เหตุผล">
    บนเส้นทาง non-`auto` ที่รองรับ OpenClaw จะแมประดับการคิดที่เลือกไปยัง
    reasoning payloads ของพร็อกซี OpenRouter คำแนะนำโมเดลที่ไม่รองรับและ
    `openrouter/auto` จะข้ามการแทรก reasoning นั้น Hunter Alpha ยังข้าม
    proxy reasoning สำหรับการอ้างอิงโมเดลที่กำหนดค่าไว้แต่ล้าสมัย เพราะ OpenRouter อาจ
    ส่งข้อความคำตอบสุดท้ายกลับมาในฟิลด์ reasoning สำหรับเส้นทางที่เลิกใช้แล้วนั้น
  </Accordion>

  <Accordion title="การเล่นซ้ำ reasoning ของ DeepSeek V4">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว `openrouter/deepseek/deepseek-v4-flash` และ
    `openrouter/deepseek/deepseek-v4-pro` เติม `reasoning_content` ที่ขาดหายใน
    assistant turns ที่เล่นซ้ำ เพื่อให้การสนทนาแบบคิด/เครื่องมือคงรูปแบบการติดตามผลที่
    DeepSeek V4 ต้องการ
  </Accordion>

  <Accordion title="การจัดรูปคำขอเฉพาะ OpenAI">
    OpenRouter ยังคงทำงานผ่านเส้นทางที่เข้ากันได้กับ OpenAI แบบพร็อกซี ดังนั้น
    การจัดรูปคำขอเฉพาะ OpenAI แบบ native เช่น `serviceTier`, Responses `store`,
    payloads ที่เข้ากันได้กับ OpenAI reasoning และคำแนะนำ prompt-cache จะไม่ถูกส่งต่อ
  </Accordion>

  <Accordion title="เส้นทางที่รองรับด้วย Gemini">
    การอ้างอิง OpenRouter ที่รองรับด้วย Gemini จะยังอยู่บนเส้นทาง proxy-Gemini: OpenClaw คง
    การทำความสะอาด thought-signature ของ Gemini ไว้ที่นั่น แต่ไม่เปิดใช้การตรวจสอบการเล่นซ้ำของ Gemini
    แบบ native หรือการเขียน bootstrap ใหม่
  </Accordion>

  <Accordion title="ข้อมูลเมตาการกำหนดเส้นทางผู้ให้บริการ">
    หากคุณส่งการกำหนดเส้นทางผู้ให้บริการ OpenRouter ภายใต้พารามิเตอร์โมเดล OpenClaw จะส่งต่อ
    เป็นข้อมูลเมตาการกำหนดเส้นทางของ OpenRouter ก่อนที่ shared stream wrappers จะทำงาน
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าฉบับเต็มสำหรับ agents, models และ providers
  </Card>
</CardGroup>
