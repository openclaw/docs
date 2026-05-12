---
read_when:
    - คุณต้องการคีย์ API เดียวสำหรับ LLM หลายตัว
    - คุณต้องการเรียกใช้โมเดลผ่าน OpenRouter ใน OpenClaw
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างภาพ
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างวิดีโอ
summary: ใช้ API แบบรวมศูนย์ของ OpenRouter เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-12T08:46:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dbf2b5a69636eb18471dd7d1dcf05ee30da931e2e3b5c9ae5d44a20d3e46f78
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter มี **API แบบรวมศูนย์** ที่กำหนดเส้นทางคำขอไปยังโมเดลจำนวนมากผ่าน
endpoint และคีย์ API เดียวกัน โดยเข้ากันได้กับ OpenAI ดังนั้น OpenAI SDK ส่วนใหญ่จึงใช้งานได้เพียงเปลี่ยน URL ฐาน

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API ของคุณ">
    สร้างคีย์ API ที่ [openrouter.ai/keys](https://openrouter.ai/keys)
  </Step>
  <Step title="เรียกใช้การเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(ไม่บังคับ) เปลี่ยนไปใช้โมเดลเฉพาะ">
    การเริ่มต้นใช้งานจะตั้งค่าเริ่มต้นเป็น `openrouter/auto` เลือกโมเดลที่ชัดเจนในภายหลังได้:

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
การอ้างอิงโมเดลใช้รูปแบบ `openrouter/<provider>/<model>` สำหรับรายชื่อทั้งหมดของ
ผู้ให้บริการและโมเดลที่พร้อมใช้งาน โปรดดู [/concepts/model-providers](/th/concepts/model-providers)
</Note>

ตัวอย่าง fallback ที่รวมมาให้:

| การอ้างอิงโมเดล                  | หมายเหตุ                    |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | การกำหนดเส้นทางอัตโนมัติของ OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 ผ่าน MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 ผ่าน MoonshotAI     |

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

OpenClaw ส่งคำขอรูปภาพไปยัง API รูปภาพของ chat completions ของ OpenRouter ด้วย `modalities: ["image", "text"]` โมเดลรูปภาพ Gemini จะได้รับคำใบ้ `aspectRatio` และ `resolution` ที่รองรับผ่าน `image_config` ของ OpenRouter ใช้ `agents.defaults.imageGenerationModel.timeoutMs` สำหรับโมเดลรูปภาพ OpenRouter ที่ช้ากว่า โดยพารามิเตอร์ `timeoutMs` รายคำขอของเครื่องมือ `image_generate` ยังคงมีผลเหนือกว่า

## การสร้างวิดีโอ

OpenRouter ยังสามารถรองรับเครื่องมือ `video_generate` ผ่าน API แบบอะซิงโครนัส `/videos` ของตนได้ด้วย ใช้โมเดลวิดีโอของ OpenRouter ภายใต้ `agents.defaults.videoGenerationModel`:

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

OpenClaw ส่งงาน text-to-video และ image-to-video ไปยัง OpenRouter, polling
`polling_url` ที่ส่งกลับมา และดาวน์โหลดวิดีโอที่เสร็จสมบูรณ์จาก
`unsigned_urls` ของ OpenRouter หรือ endpoint เนื้อหางานที่มีเอกสารกำกับไว้
โดยค่าเริ่มต้น รูปภาพอ้างอิงจะถูกส่งเป็นรูปภาพเฟรมแรก/สุดท้าย ส่วนรูปภาพ
ที่ติดแท็ก `reference_image` จะถูกส่งเป็นข้อมูลอ้างอิงอินพุตของ OpenRouter ค่าเริ่มต้น
`google/veo-3.1-fast` ที่รวมมาให้ประกาศ duration 4/6/8
วินาที, resolution `720P`/`1080P` และ aspect
ratio `16:9`/`9:16` ที่รองรับในปัจจุบัน Video-to-video ไม่ได้ลงทะเบียนสำหรับ OpenRouter เพราะ API
การสร้างวิดีโอต้นทางในปัจจุบันรับข้อมูลอ้างอิงแบบข้อความและรูปภาพ

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

## Speech-to-text (เสียงขาเข้า)

OpenRouter สามารถถอดเสียงไฟล์แนบเสียงพูด/เสียงขาเข้าผ่าน path
`tools.media.audio` ที่ใช้ร่วมกัน โดยใช้ endpoint STT (`/audio/transcriptions`)
ของตนได้ สิ่งนี้ใช้กับ Plugin ช่องทางใดๆ ที่ส่งต่อเสียงพูด/เสียงขาเข้าเข้าสู่
การตรวจสอบล่วงหน้าสำหรับการทำความเข้าใจสื่อ

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw ส่งคำขอ STT ของ OpenRouter เป็น JSON พร้อมเสียงแบบ base64 ภายใต้
`input_audio` (สัญญา STT ของ OpenRouter) ไม่ใช่การอัปโหลดแบบฟอร์ม multipart ของ OpenAI

## การยืนยันตัวตนและส่วนหัว

OpenRouter ใช้โทเคน Bearer พร้อมคีย์ API ของคุณอยู่เบื้องหลัง

สำหรับคำขอ OpenRouter จริง (`https://openrouter.ai/api/v1`) OpenClaw ยังเพิ่ม
ส่วนหัวการระบุแอปตามเอกสารของ OpenRouter ด้วย:

| ส่วนหัว                    | ค่า                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
หากคุณชี้ผู้ให้บริการ OpenRouter ไปยัง proxy หรือ URL ฐานอื่น OpenClaw
จะ **ไม่** ใส่ส่วนหัวเฉพาะของ OpenRouter เหล่านั้นหรือเครื่องหมายแคชของ Anthropic
</Warning>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การแคชการตอบสนอง">
    การแคชการตอบสนองของ OpenRouter เป็นแบบเลือกเปิดใช้งาน เปิดใช้งานต่อโมเดล OpenRouter ด้วย
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

    OpenClaw ส่ง `X-OpenRouter-Cache: true` และเมื่อกำหนดค่าไว้ จะส่ง
    `X-OpenRouter-Cache-TTL` `responseCacheClear: true` บังคับรีเฟรชสำหรับ
    คำขอปัจจุบันและจัดเก็บการตอบสนองทดแทน นอกจากนี้ยังยอมรับ alias แบบ snake_case
    (`response_cache`, `response_cache_ttl_seconds` และ
    `response_cache_clear`) ด้วย

    สิ่งนี้แยกจากการแคช prompt ของผู้ให้บริการและจากเครื่องหมาย
    `cache_control` ของ Anthropic ของ OpenRouter โดยจะใช้เฉพาะบนเส้นทาง
    `openrouter.ai` ที่ตรวจสอบแล้วเท่านั้น ไม่ใช่ URL ฐาน proxy แบบกำหนดเอง

  </Accordion>

  <Accordion title="เครื่องหมายแคชของ Anthropic">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว การอ้างอิงโมเดล Anthropic จะเก็บ
    เครื่องหมาย `cache_control` ของ Anthropic เฉพาะ OpenRouter ที่ OpenClaw ใช้เพื่อ
    นำ prompt-cache กลับมาใช้ซ้ำได้ดีขึ้นบนบล็อก prompt ระบบ/นักพัฒนา
  </Accordion>

  <Accordion title="การเติมล่วงหน้า reasoning ของ Anthropic">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว การอ้างอิงโมเดล Anthropic ที่เปิดใช้งาน reasoning
    จะตัด turn การเติมล่วงหน้าของ assistant ที่ท้ายออกก่อนที่คำขอจะไปถึง OpenRouter
    เพื่อให้ตรงกับข้อกำหนดของ Anthropic ที่การสนทนาแบบ reasoning ต้องจบด้วย turn ของผู้ใช้
  </Accordion>

  <Accordion title="การฉีด thinking / reasoning">
    บนเส้นทาง non-`auto` ที่รองรับ OpenClaw จะ map ระดับ thinking ที่เลือกไปยัง
    payload reasoning ของ proxy OpenRouter คำใบ้โมเดลที่ไม่รองรับและ
    `openrouter/auto` จะข้ามการฉีด reasoning นั้น Hunter Alpha ยังข้าม
    proxy reasoning สำหรับการอ้างอิงโมเดลที่กำหนดค่าไว้แต่ล้าสมัย เพราะ OpenRouter อาจ
    ส่งคืนข้อความคำตอบสุดท้ายในฟิลด์ reasoning สำหรับเส้นทางที่เลิกใช้นั้น
  </Accordion>

  <Accordion title="การเล่นซ้ำ reasoning ของ DeepSeek V4">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว `openrouter/deepseek/deepseek-v4-flash` และ
    `openrouter/deepseek/deepseek-v4-pro` จะเติม `reasoning_content` ที่ขาดหายไปบน
    turn assistant ที่เล่นซ้ำ เพื่อให้การสนทนา thinking/tool คงรูปแบบการติดตามผลที่
    DeepSeek V4 ต้องการ OpenClaw ส่งค่า `reasoning_effort` ที่ OpenRouter รองรับ
    สำหรับเส้นทางเหล่านี้ โดย `xhigh` คือระดับสูงสุดที่ประกาศไว้
    และ override `max` ที่ล้าสมัยจะถูก map เป็น `xhigh`
  </Accordion>

  <Accordion title="การจัดรูปคำขอเฉพาะ OpenAI">
    OpenRouter ยังคงทำงานผ่าน path แบบ proxy ที่เข้ากันได้กับ OpenAI ดังนั้น
    การจัดรูปคำขอเฉพาะ OpenAI แบบ native เช่น `serviceTier`, `store` ของ Responses,
    payload ที่เข้ากันได้กับ reasoning ของ OpenAI และคำใบ้ prompt-cache จะไม่ถูกส่งต่อ
  </Accordion>

  <Accordion title="เส้นทางที่รองรับด้วย Gemini">
    การอ้างอิง OpenRouter ที่รองรับด้วย Gemini จะอยู่บน path proxy-Gemini: OpenClaw คง
    การทำความสะอาด thought-signature ของ Gemini ไว้ที่นั่น แต่ไม่เปิดใช้การตรวจสอบ
    replay ของ Gemini แบบ native หรือการเขียน bootstrap ใหม่
  </Accordion>

  <Accordion title="เมทาดาทาการกำหนดเส้นทางของผู้ให้บริการ">
    หากคุณส่งการกำหนดเส้นทางผู้ให้บริการของ OpenRouter ภายใต้พารามิเตอร์โมเดล OpenClaw จะส่งต่อ
    เป็นเมทาดาทาการกำหนดเส้นทางของ OpenRouter ก่อนที่ wrapper stream ที่ใช้ร่วมกันจะทำงาน
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
