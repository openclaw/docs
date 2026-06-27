---
read_when:
    - คุณต้องการ API key เดียวสำหรับ LLM หลายตัว
    - คุณต้องการเรียกใช้โมเดลผ่าน OpenRouter ใน OpenClaw
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างรูปภาพ
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างเพลง
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างวิดีโอ
summary: ใช้ API แบบรวมศูนย์ของ OpenRouter เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-06-27T18:16:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter มี **API แบบรวมศูนย์** ที่กำหนดเส้นทางคำขอไปยังโมเดลจำนวนมากผ่าน
จุดปลายทางและคีย์ API เดียว รองรับการทำงานแบบเดียวกับ OpenAI ดังนั้น SDK ของ OpenAI ส่วนใหญ่จึงใช้งานได้โดยเปลี่ยน URL ฐาน

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw เปิดโฟลว์ลงชื่อเข้าใช้ OpenRouter ในเบราว์เซอร์ แลกเปลี่ยนโค้ด
        PKCE เป็นคีย์ API ของ OpenRouter และจัดเก็บคีย์นั้นไว้ในโปรไฟล์การยืนยันตัวตน
        OpenRouter เริ่มต้น สำหรับโฮสต์ระยะไกลหรือโฮสต์ที่ไม่มีหน้าจอ OpenClaw จะพิมพ์
        URL สำหรับลงชื่อเข้าใช้และขอให้คุณวาง URL เปลี่ยนเส้นทางหลังจากลงชื่อเข้าใช้แล้ว
      </Step>
      <Step title="(ไม่บังคับ) สลับไปใช้โมเดลเฉพาะ">
        การเริ่มต้นใช้งานใช้ค่าเริ่มต้นเป็น `openrouter/auto` เลือกโมเดลที่แน่นอนได้ภายหลัง:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="คีย์ API">
    <Steps>
      <Step title="รับคีย์ API ของคุณ">
        สร้างคีย์ API ที่ [openrouter.ai/keys](https://openrouter.ai/keys)
      </Step>
      <Step title="เรียกใช้การเริ่มต้นใช้งานด้วยคีย์ API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(ไม่บังคับ) สลับไปใช้โมเดลเฉพาะ">
        การเริ่มต้นใช้งานใช้ค่าเริ่มต้นเป็น `openrouter/auto` เลือกโมเดลที่แน่นอนได้ภายหลัง:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

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

ตัวอย่างทางเลือกสำรองที่รวมมาให้:

| การอ้างอิงโมเดล                | หมายเหตุ                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | การกำหนดเส้นทางอัตโนมัติของ OpenRouter |
| `openrouter/openrouter/fusion`    | เราเตอร์ OpenRouter Fusion     |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 ผ่าน MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 ผ่าน MoonshotAI     |

## การสร้างรูปภาพ

OpenRouter สามารถรองรับเครื่องมือ `image_generate` ได้ด้วย ใช้โมเดลรูปภาพของ OpenRouter ภายใต้ `agents.defaults.imageGenerationModel`:

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

OpenClaw ส่งคำขอรูปภาพไปยัง API รูปภาพของ chat completions ของ OpenRouter ด้วย `modalities: ["image", "text"]` โมเดลรูปภาพ Gemini จะได้รับคำใบ้ `aspectRatio` และ `resolution` ที่รองรับผ่าน `image_config` ของ OpenRouter ใช้ `agents.defaults.imageGenerationModel.timeoutMs` สำหรับโมเดลรูปภาพของ OpenRouter ที่ทำงานช้ากว่า โดยพารามิเตอร์ `timeoutMs` ต่อการเรียกของเครื่องมือ `image_generate` ยังคงมีลำดับความสำคัญสูงกว่า

## การสร้างวิดีโอ

OpenRouter สามารถรองรับเครื่องมือ `video_generate` ผ่าน API `/videos` แบบอะซิงโครนัสได้ด้วย ใช้โมเดลวิดีโอของ OpenRouter ภายใต้ `agents.defaults.videoGenerationModel`:

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

OpenClaw ส่งงานแปลงข้อความเป็นวิดีโอและรูปภาพเป็นวิดีโอไปยัง OpenRouter สำรวจสถานะ
`polling_url` ที่ส่งกลับมา และดาวน์โหลดวิดีโอที่เสร็จสมบูรณ์จาก
`unsigned_urls` ของ OpenRouter หรือจุดปลายทางเนื้อหางานที่ระบุไว้ในเอกสาร
โดยค่าเริ่มต้น รูปภาพอ้างอิงจะถูกส่งเป็นรูปภาพเฟรมแรก/สุดท้าย ส่วนรูปภาพ
ที่ติดแท็กด้วย `reference_image` จะถูกส่งเป็นข้อมูลอ้างอิงขาเข้าของ OpenRouter ค่าเริ่มต้น
`google/veo-3.1-fast` ที่รวมมาให้ประกาศระยะเวลา 4/6/8 วินาทีที่รองรับในปัจจุบัน
ความละเอียด `720P`/`1080P` และอัตราส่วนภาพ `16:9`/`9:16`
ไม่ได้ลงทะเบียนวิดีโอเป็นวิดีโอสำหรับ OpenRouter เพราะ API การสร้างวิดีโอต้นทาง
ในปัจจุบันรับข้อความและรูปภาพอ้างอิง

## การสร้างเพลง

OpenRouter สามารถรองรับเครื่องมือ `music_generate` ผ่านเอาต์พุตเสียงของ
chat completions ได้ด้วย ใช้โมเดลเสียงของ OpenRouter ภายใต้
`agents.defaults.musicGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

ผู้ให้บริการเพลง OpenRouter ที่รวมมาให้ใช้ค่าเริ่มต้นเป็น
`google/lyria-3-pro-preview` และยังเปิดเผย
`google/lyria-3-clip-preview` ด้วย OpenClaw ส่ง `modalities: ["text",
"audio"]` เปิดใช้การสตรีม รวบรวมชิ้นส่วนเสียงที่สตรีมมา และบันทึก
ผลลัพธ์เป็นสื่อที่สร้างขึ้นสำหรับส่งผ่านช่องทาง ระบบรับรูปภาพอ้างอิง
สำหรับโมเดล Lyria ผ่านพารามิเตอร์ `music_generate image=...` ที่ใช้ร่วมกัน

## ข้อความเป็นเสียง

OpenRouter ยังสามารถใช้เป็นผู้ให้บริการ TTS ผ่านจุดปลายทาง
`/audio/speech` ที่รองรับการทำงานแบบเดียวกับ OpenAI ได้

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

หากละเว้น `messages.tts.providers.openrouter.apiKey` ไว้ TTS จะใช้
`models.providers.openrouter.apiKey` ซ้ำก่อน แล้วจึงใช้ `OPENROUTER_API_KEY`

## เสียงเป็นข้อความ (เสียงขาเข้า)

OpenRouter สามารถถอดเสียงไฟล์แนบเสียงพูด/เสียงขาเข้าผ่านเส้นทาง
`tools.media.audio` ที่ใช้ร่วมกัน โดยใช้จุดปลายทาง STT (`/audio/transcriptions`)
ซึ่งใช้กับ Plugin ช่องทางใดก็ตามที่ส่งต่อเสียงพูด/เสียงขาเข้าเข้าสู่
การตรวจสอบล่วงหน้าสำหรับการเข้าใจสื่อ

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

OpenClaw ส่งคำขอ STT ของ OpenRouter เป็น JSON พร้อมเสียง base64 ภายใต้
`input_audio` (สัญญา STT ของ OpenRouter) ไม่ใช่การอัปโหลดแบบฟอร์ม OpenAI multipart

## เราเตอร์ Fusion

ใช้ OpenRouter Fusion เมื่อคุณต้องการให้การอ้างอิงโมเดล OpenClaw หนึ่งรายการถาม
โมเดล OpenRouter หลายโมเดลพร้อมกัน ให้ OpenRouter ตัดสินคำตอบเหล่านั้น และส่งคืน
คำตอบสุดท้ายรายการเดียวผ่านจุดปลายทางผู้ให้บริการ OpenRouter ตามปกติ เนื่องจาก
slug โมเดลต้นทางคือ `openrouter/fusion` การอ้างอิงโมเดล OpenClaw จึงรวม
ทั้งคำนำหน้าผู้ให้บริการ OpenClaw และเนมสเปซ OpenRouter ต้นทาง:

```bash
openclaw models set openrouter/openrouter/fusion
```

กำหนดค่าแผงและผู้ตัดสินของ Fusion ผ่าน `params.extraBody` ของโมเดล ฟิลด์เหล่านั้น
จะถูกส่งต่อเข้าไปในเนื้อความคำขอ chat-completions ของ OpenRouter Fusion
ใช้งานได้กับทั้งการเริ่มต้นใช้งาน OpenRouter OAuth หรือการเริ่มต้นใช้งานด้วยคีย์ API หากคุณใช้
OAuth ให้ละเว้นบรรทัด `env.OPENROUTER_API_KEY` จากตัวอย่างด้านล่าง

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

รายการ `analysis_models` คือแผงแบบขนาน และ `model` ภายในการกำหนดค่า Plugin
Fusion คือโมเดลผู้ตัดสิน อย่าตั้งค่า `tool_choice` ระดับบนสุดเป็น
`"required"` ในรอบเอเจนต์/แชต OpenClaw ปกติเพื่อพยายามบังคับใช้ Fusion
รอบของ OpenClaw อาจรวมคำจำกัดความเครื่องมือ OpenClaw และการเลือกเครื่องมือแบบบังคับ
ระดับบนสุดอาจบังคับให้ใช้เครื่องมือหนึ่งในนั้นแทนเราเตอร์ Fusion เมื่อมี
การกำหนดค่า Plugin Fusion นี้ OpenClaw จะเพิ่มบันทึกพรอมป์ระบบที่ผ่านการทำให้ปลอดภัย
พร้อมโมเดลวิเคราะห์และโมเดลผู้ตัดสินที่กำหนดค่าไว้ด้วย เพื่อให้เอเจนต์
ตอบคำถามเกี่ยวกับแผง Fusion ปัจจุบันของตนได้ ฟิลด์ `extraBody` อื่น
จะไม่ถูกคัดลอกเข้าไปในพรอมป์

Fusion ช้ากว่าตามการออกแบบ OpenRouter อาจส่งพรอมป์ OpenClaw เดียวกันไปยัง
โมเดลวิเคราะห์หลายโมเดล แล้วจึงเรียกใช้ขั้นตอนผู้ตัดสิน/สังเคราะห์สุดท้าย ดังนั้นเวลาแฝง
มักสูงกว่าคำขอโมเดลเดียวโดยตรง ใช้ Fusion สำหรับคำตอบที่รอบคอบ
คุณภาพสูง หรือเส้นทางยกระดับ ไม่ใช่เป็นค่าเริ่มต้นสำหรับ
แชตที่ไวต่อเวลาแฝง หากต้องการคำตอบที่เร็วขึ้น ให้แผงมีขนาดเล็กและเลือก
โมเดลวิเคราะห์และผู้ตัดสินที่เร็วกว่า

ทดสอบการอ้างอิงที่กำหนดค่าด้วยการเรียกโมเดลภายในเครื่องแบบครั้งเดียว:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## การยืนยันตัวตนและส่วนหัว

OpenRouter ใช้โทเค็น Bearer กับคีย์ API ของคุณเบื้องหลัง OpenRouter
OAuth เป็นโฟลว์เข้าสู่ระบบ PKCE ที่ออกคีย์ API ของ OpenRouter ดังนั้น OpenClaw จึงจัดเก็บ
ผลลัพธ์เป็นโปรไฟล์การยืนยันตัวตนคีย์ API `openrouter:default` เดียวกันที่ใช้โดย
เส้นทางการตั้งค่าคีย์ API ด้วยตนเอง

สำหรับการติดตั้งที่มีอยู่แล้ว ให้ลงชื่อเข้าใช้หรือหมุนเวียนคีย์ OpenRouter ที่จัดเก็บไว้โดยไม่ต้อง
เรียกใช้การเริ่มต้นใช้งานเต็มรูปแบบใหม่:

```bash
openclaw models auth login --provider openrouter --method oauth
```

ใช้ `openclaw models auth login --provider openrouter --method api-key` เมื่อ
คุณต้องการวางคีย์ที่คุณสร้างด้วยตนเองที่ OpenRouter

สำหรับคำขอ OpenRouter จริง (`https://openrouter.ai/api/v1`) OpenClaw ยังเพิ่ม
ส่วนหัวระบุแอปตามเอกสารของ OpenRouter ด้วย:

| ส่วนหัว                    | ค่า                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
หากคุณชี้ผู้ให้บริการ OpenRouter ไปยังพร็อกซีหรือ URL ฐานอื่น OpenClaw
จะ **ไม่** แทรกส่วนหัวเฉพาะของ OpenRouter เหล่านั้นหรือเครื่องหมายแคชของ Anthropic
</Warning>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การแคชคำตอบ">
    การแคชคำตอบของ OpenRouter เป็นแบบเลือกเปิดใช้ เปิดใช้ต่อโมเดล OpenRouter ด้วย
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
    `X-OpenRouter-Cache-TTL` `responseCacheClear: true` จะบังคับรีเฟรชสำหรับ
    คำขอปัจจุบันและจัดเก็บคำตอบทดแทน ระบบยอมรับชื่อแฝงแบบ snake_case
    (`response_cache`, `response_cache_ttl_seconds` และ
    `response_cache_clear`) ด้วย

    สิ่งนี้แยกจากการแคชพรอมป์ของผู้ให้บริการและจากเครื่องหมาย
    Anthropic `cache_control` ของ OpenRouter โดยจะใช้เฉพาะกับเส้นทาง
    `openrouter.ai` ที่ตรวจสอบแล้วเท่านั้น ไม่ใช่ URL ฐานของพร็อกซีแบบกำหนดเอง

  </Accordion>

  <Accordion title="เครื่องหมายแคชของ Anthropic">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว การอ้างอิงโมเดล Anthropic จะคง
    เครื่องหมาย Anthropic `cache_control` เฉพาะของ OpenRouter ที่ OpenClaw ใช้เพื่อ
    นำ prompt cache กลับมาใช้ซ้ำได้ดีขึ้นในบล็อกพรอมป์ระบบ/นักพัฒนา
  </Accordion>

  <Accordion title="การเติมล่วงหน้า reasoning ของ Anthropic">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว การอ้างอิงโมเดล Anthropic ที่เปิดใช้ reasoning
    จะตัดเทิร์นเติมล่วงหน้าของ assistant ที่อยู่ท้ายสุดออกก่อนที่คำขอจะไปถึง OpenRouter
    ให้ตรงกับข้อกำหนดของ Anthropic ที่ให้บทสนทนา reasoning จบด้วยเทิร์นของผู้ใช้
  </Accordion>

  <Accordion title="การฉีด Thinking / reasoning">
    บนเส้นทางที่รองรับและไม่ใช่ `auto` OpenClaw จะจับคู่ระดับ thinking ที่เลือกไว้กับ
    เพย์โหลด reasoning ของพร็อกซี OpenRouter คำใบ้โมเดลที่ไม่รองรับและ
    `openrouter/auto` จะข้ามการฉีด reasoning นั้น Hunter Alpha ยังข้าม
    proxy reasoning สำหรับการอ้างอิงโมเดลที่กำหนดค่าไว้แต่ล้าสมัยด้วย เพราะ OpenRouter อาจ
    คืนข้อความคำตอบสุดท้ายในฟิลด์ reasoning สำหรับเส้นทางที่เลิกใช้แล้วนั้น
  </Accordion>

  <Accordion title="การเล่นซ้ำ reasoning ของ DeepSeek V4">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว `openrouter/deepseek/deepseek-v4-flash` และ
    `openrouter/deepseek/deepseek-v4-pro` จะเติม `reasoning_content` ที่ขาดหายไปใน
    เทิร์น assistant ที่เล่นซ้ำ เพื่อให้บทสนทนา thinking/tool คงรูปแบบการติดตามผลที่
    DeepSeek V4 ต้องการ OpenClaw ส่งค่า `reasoning_effort` ที่ OpenRouter รองรับ
    สำหรับเส้นทางเหล่านี้; `xhigh` คือระดับสูงสุดที่ประกาศไว้ และการแทนที่ `max`
    ที่ล้าสมัยจะถูกแมปเป็น `xhigh`
  </Accordion>

  <Accordion title="การจัดรูปคำขอเฉพาะ OpenAI">
    OpenRouter ยังคงทำงานผ่านเส้นทางแบบพร็อกซีที่เข้ากันได้กับ OpenAI ดังนั้น
    การจัดรูปคำขอเฉพาะ OpenAI แบบเนทีฟ เช่น `serviceTier`, Responses `store`,
    เพย์โหลดที่เข้ากันได้กับ reasoning ของ OpenAI และคำใบ้ prompt-cache จะไม่ถูกส่งต่อ
  </Accordion>

  <Accordion title="เส้นทางที่รองรับด้วย Gemini">
    การอ้างอิง OpenRouter ที่รองรับด้วย Gemini จะยังอยู่บนเส้นทาง proxy-Gemini: OpenClaw คง
    การทำความสะอาดลายเซ็นความคิดของ Gemini ไว้ที่นั่น แต่จะไม่เปิดใช้การตรวจสอบการเล่นซ้ำ
    Gemini แบบเนทีฟหรือการเขียน bootstrap ใหม่
  </Accordion>

  <Accordion title="เมทาดาทาการกำหนดเส้นทางผู้ให้บริการ">
    OpenRouter รองรับอ็อบเจกต์คำขอ `provider` สำหรับการกำหนดเส้นทางของผู้ให้บริการเบื้องหลัง
    กำหนดค่านโยบายเริ่มต้นสำหรับคำขอโมเดลข้อความ OpenRouter ทั้งหมด
    ด้วย `models.providers.openrouter.params.provider`:

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw ส่งต่ออ็อบเจกต์นั้นไปยัง OpenRouter เป็นเพย์โหลดคำขอ `provider`
    ใช้ฟิลด์ snake_case ตามที่ OpenRouter จัดทำเอกสารไว้ รวมถึง `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` และ `enforce_distillable_text`

    พารามิเตอร์รายโมเดลยังคงแทนที่อ็อบเจกต์การกำหนดเส้นทางระดับผู้ให้บริการ:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    ข้อนี้มีผลเฉพาะบนเส้นทาง chat-completions ของ OpenRouter เท่านั้น เส้นทาง Anthropic,
    Google, OpenAI หรือผู้ให้บริการแบบกำหนดเองโดยตรงจะไม่สนใจพารามิเตอร์การกำหนดเส้นทาง OpenRouter

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับเมื่อเกิดความล้มเหลว
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าแบบครบถ้วนสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
