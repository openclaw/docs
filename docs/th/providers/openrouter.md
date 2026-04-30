---
read_when:
    - คุณต้องการคีย์ API เดียวสำหรับ LLM หลายตัว
    - คุณต้องการเรียกใช้โมเดลผ่าน OpenRouter ใน OpenClaw
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างภาพ
    - คุณต้องการใช้ OpenRouter เพื่อสร้างวิดีโอ
summary: ใช้ API แบบรวมของ OpenRouter เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-30T10:13:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 47206ce7279eb8a38f71b5c40d34646ad01df2cac25860b629951f9cec73270f
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter มี **API แบบรวมศูนย์** ที่กำหนดเส้นทางคำขอไปยังหลายโมเดลเบื้องหลัง
endpoint และ API key เดียว API นี้เข้ากันได้กับ OpenAI ดังนั้น SDK ส่วนใหญ่ของ OpenAI จึงใช้งานได้โดยเปลี่ยน base URL

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    สร้าง API key ที่ [openrouter.ai/keys](https://openrouter.ai/keys)
  </Step>
  <Step title="เรียกใช้งาน onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(ไม่บังคับ) เปลี่ยนไปใช้โมเดลเฉพาะ">
    onboarding มีค่าเริ่มต้นเป็น `openrouter/auto` เลือกโมเดลแบบเจาะจงได้ภายหลัง:

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
ผู้ให้บริการและโมเดลที่พร้อมใช้งาน โปรดดู [/concepts/model-providers](/th/concepts/model-providers)
</Note>

ตัวอย่าง fallback ที่รวมมาให้:

| การอ้างอิงโมเดล                  | หมายเหตุ                         |
| --------------------------------- | -------------------------------- |
| `openrouter/auto`                 | การกำหนดเส้นทางอัตโนมัติของ OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 ผ่าน MoonshotAI        |

## การสร้างภาพ

OpenRouter ยังสามารถรองรับเครื่องมือ `image_generate` ได้ด้วย ใช้โมเดลภาพของ OpenRouter ใต้ `agents.defaults.imageGenerationModel`:

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

OpenClaw ส่งคำขอภาพไปยัง API ภาพของ chat completions ของ OpenRouter ด้วย `modalities: ["image", "text"]` โมเดลภาพ Gemini จะได้รับคำใบ้ `aspectRatio` และ `resolution` ที่รองรับผ่าน `image_config` ของ OpenRouter ใช้ `agents.defaults.imageGenerationModel.timeoutMs` สำหรับโมเดลภาพของ OpenRouter ที่ช้ากว่า ส่วนพารามิเตอร์ `timeoutMs` ต่อการเรียกของเครื่องมือ `image_generate` ยังคงมีผลเหนือกว่า

## การสร้างวิดีโอ

OpenRouter ยังสามารถรองรับเครื่องมือ `video_generate` ผ่าน API `/videos` แบบอะซิงโครนัสของตนได้ด้วย ใช้โมเดลวิดีโอของ OpenRouter ใต้ `agents.defaults.videoGenerationModel`:

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
`unsigned_urls` ของ OpenRouter หรือ endpoint เนื้อหางานที่จัดทำเอกสารไว้
โดยค่าเริ่มต้น รูปภาพอ้างอิงจะถูกส่งเป็นภาพเฟรมแรก/เฟรมสุดท้าย รูปภาพ
ที่ติดแท็กด้วย `reference_image` จะถูกส่งเป็นข้อมูลอ้างอิงอินพุตของ OpenRouter ค่าเริ่มต้น
`google/veo-3.1-fast` ที่รวมมาให้ประกาศระยะเวลา 4/6/8
วินาทีที่รองรับในปัจจุบัน, ความละเอียด `720P`/`1080P` และอัตราส่วนภาพ
`16:9`/`9:16` Video-to-video ไม่ได้ลงทะเบียนสำหรับ OpenRouter เพราะ API
การสร้างวิดีโอ upstream ในปัจจุบันยอมรับข้อความและรูปภาพอ้างอิง

## การแปลงข้อความเป็นเสียงพูด

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

หากละเว้น `messages.tts.providers.openrouter.apiKey` ไว้ TTS จะนำ
`models.providers.openrouter.apiKey` มาใช้ซ้ำ จากนั้นจึงใช้ `OPENROUTER_API_KEY`

## การตรวจสอบสิทธิ์และ headers

OpenRouter ใช้ Bearer token กับ API key ของคุณอยู่เบื้องหลัง

ในคำขอ OpenRouter จริง (`https://openrouter.ai/api/v1`) OpenClaw ยังเพิ่ม
headers ระบุแหล่งที่มาของแอปตามเอกสารของ OpenRouter ด้วย:

| Header                    | ค่า                   |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
หากคุณชี้ provider ของ OpenRouter ไปยัง proxy หรือ base URL อื่น OpenClaw
จะ **ไม่** ใส่ headers เฉพาะของ OpenRouter หรือเครื่องหมาย cache ของ Anthropic เหล่านั้น
</Warning>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="เครื่องหมาย cache ของ Anthropic">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว การอ้างอิงโมเดล Anthropic จะคง
    เครื่องหมาย `cache_control` เฉพาะ Anthropic ของ OpenRouter ที่ OpenClaw ใช้เพื่อ
    นำ prompt-cache กลับมาใช้ซ้ำได้ดีขึ้นบนบล็อก system/developer prompt
  </Accordion>

  <Accordion title="การแทรก thinking / reasoning">
    บนเส้นทาง non-`auto` ที่รองรับ OpenClaw จะ map ระดับ thinking ที่เลือกไปยัง
    payload reasoning ของ proxy OpenRouter คำใบ้โมเดลที่ไม่รองรับและ
    `openrouter/auto` จะข้ามการแทรก reasoning นั้น Hunter Alpha ยังข้าม
    proxy reasoning สำหรับการอ้างอิงโมเดลที่กำหนดค่าไว้และล้าสมัย เพราะ OpenRouter อาจ
    ส่งข้อความคำตอบสุดท้ายกลับมาในฟิลด์ reasoning สำหรับเส้นทางที่เลิกใช้แล้วนั้น
  </Accordion>

  <Accordion title="การจัดรูปแบบคำขอเฉพาะ OpenAI">
    OpenRouter ยังคงทำงานผ่านเส้นทางแบบ proxy ที่เข้ากันได้กับ OpenAI ดังนั้น
    การจัดรูปแบบคำขอเฉพาะ OpenAI แบบ native เช่น `serviceTier`, Responses `store`,
    payload ที่เข้ากันได้กับ reasoning ของ OpenAI และคำใบ้ prompt-cache จะไม่ถูกส่งต่อ
  </Accordion>

  <Accordion title="เส้นทางที่รองรับด้วย Gemini">
    การอ้างอิง OpenRouter ที่รองรับด้วย Gemini จะอยู่บนเส้นทาง proxy-Gemini: OpenClaw คง
    การทำความสะอาด thought-signature ของ Gemini ไว้ที่นั่น แต่ไม่ได้เปิดใช้การตรวจสอบ
    replay แบบ native ของ Gemini หรือการเขียน bootstrap ใหม่
  </Accordion>

  <Accordion title="metadata การกำหนดเส้นทาง provider">
    หากคุณส่งการกำหนดเส้นทาง provider ของ OpenRouter ใต้พารามิเตอร์โมเดล OpenClaw จะส่งต่อ
    เป็น metadata การกำหนดเส้นทางของ OpenRouter ก่อนที่ wrappers สตรีมร่วมจะทำงาน
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิง config ฉบับเต็มสำหรับ agents, models และ providers
  </Card>
</CardGroup>
