---
read_when:
    - คุณต้องการคีย์ API เดียวสำหรับ LLM หลายตัว
    - คุณต้องการเรียกใช้โมเดลผ่าน OpenRouter ใน OpenClaw
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างรูปภาพ
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างเพลง
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างวิดีโอ
summary: ใช้ API แบบรวมของ OpenRouter เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-03T10:05:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca36f2a7afd35ea4d276f61ded28524aed7d15715b29eea9aaac0ac6e4abab40
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter มี **API แบบรวมศูนย์** ที่กำหนดเส้นทางคำขอไปยังโมเดลจำนวนมากหลัง
endpoint และคีย์ API เดียว API นี้เข้ากันได้กับ OpenAI ดังนั้น SDK ของ OpenAI ส่วนใหญ่จึงใช้งานได้ด้วยการเปลี่ยน URL พื้นฐาน

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw จะเปิดขั้นตอนลงชื่อเข้าใช้ OpenRouter ในเบราว์เซอร์ แลกเปลี่ยนรหัส
        PKCE เป็นคีย์ API ของ OpenRouter และจัดเก็บคีย์นั้นไว้ในโปรไฟล์การยืนยันตัวตน
        OpenRouter เริ่มต้น สำหรับโฮสต์ระยะไกล/ไม่มีหน้าจอ OpenClaw จะพิมพ์
        URL สำหรับลงชื่อเข้าใช้และขอให้คุณวาง URL เปลี่ยนเส้นทางหลังจากลงชื่อเข้าใช้แล้ว
      </Step>
      <Step title="(ไม่บังคับ) เปลี่ยนเป็นโมเดลเฉพาะ">
        การเริ่มต้นใช้งานตั้งค่าเริ่มต้นเป็น `openrouter/auto` เลือกโมเดลที่ชัดเจนภายหลังได้:

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
      <Step title="(ไม่บังคับ) เปลี่ยนเป็นโมเดลเฉพาะ">
        การเริ่มต้นใช้งานตั้งค่าเริ่มต้นเป็น `openrouter/auto` เลือกโมเดลที่ชัดเจนภายหลังได้:

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
ผู้ให้บริการและโมเดลที่มีให้ใช้งาน โปรดดู [/concepts/model-providers](/th/concepts/model-providers)
</Note>

ตัวอย่าง fallback ที่รวมมาให้:

| การอ้างอิงโมเดล                 | หมายเหตุ                     |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | การกำหนดเส้นทางอัตโนมัติของ OpenRouter |
| `openrouter/openrouter/fusion`    | เราเตอร์ OpenRouter Fusion   |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 ผ่าน MoonshotAI    |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 ผ่าน MoonshotAI    |

## การสร้างภาพ

OpenRouter สามารถรองรับเครื่องมือ `image_generate` ได้ด้วย ใช้โมเดลภาพของ OpenRouter ใต้ `agents.defaults.imageGenerationModel`:

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

OpenClaw ส่งคำขอภาพไปยัง API ภาพของ chat completions ของ OpenRouter ด้วย `modalities: ["image", "text"]` โมเดลภาพ Gemini จะได้รับคำใบ้ `aspectRatio` และ `resolution` ที่รองรับผ่าน `image_config` ของ OpenRouter ใช้ `agents.defaults.imageGenerationModel.timeoutMs` สำหรับโมเดลภาพของ OpenRouter ที่ช้ากว่า พารามิเตอร์ `timeoutMs` ต่อการเรียกของเครื่องมือ `image_generate` ยังคงมีลำดับความสำคัญสูงกว่า

## การสร้างวิดีโอ

OpenRouter สามารถรองรับเครื่องมือ `video_generate` ผ่าน API `/videos` แบบอะซิงโครนัสของตนได้ด้วย ใช้โมเดลวิดีโอของ OpenRouter ใต้ `agents.defaults.videoGenerationModel`:

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
`unsigned_urls` ของ OpenRouter หรือ endpoint เนื้อหางานตามเอกสาร
ภาพอ้างอิงจะถูกส่งเป็นภาพเฟรมแรก/สุดท้ายตามค่าเริ่มต้น ภาพที่ติดแท็กด้วย
`reference_image` จะถูกส่งเป็นข้อมูลอ้างอิงอินพุตของ OpenRouter ค่าเริ่มต้น
`google/veo-3.1-fast` ที่รวมมาให้ประกาศระยะเวลา 4/6/8 วินาทีที่รองรับในปัจจุบัน,
ความละเอียด `720P`/`1080P` และอัตราส่วนภาพ `16:9`/`9:16`
video-to-video ไม่ได้ลงทะเบียนสำหรับ OpenRouter เพราะ API การสร้างวิดีโอ upstream
ปัจจุบันรับข้อความและภาพอ้างอิง

## การสร้างเพลง

OpenRouter สามารถรองรับเครื่องมือ `music_generate` ผ่านเอาต์พุตเสียงของ
chat completions ได้ด้วย ใช้โมเดลเสียงของ OpenRouter ใต้
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

ผู้ให้บริการเพลง OpenRouter ที่รวมมาให้ตั้งค่าเริ่มต้นเป็น
`google/lyria-3-pro-preview` และยังเปิดเผย
`google/lyria-3-clip-preview` ด้วย OpenClaw ส่ง `modalities: ["text",
"audio"]`, เปิดใช้การสตรีม, รวบรวมชิ้นส่วนเสียงที่สตรีมมา และบันทึก
ผลลัพธ์เป็นสื่อที่สร้างขึ้นสำหรับการส่งมอบผ่านช่องทาง ภาพอ้างอิงได้รับการยอมรับ
สำหรับโมเดล Lyria ผ่านพารามิเตอร์ `music_generate image=...` ที่ใช้ร่วมกัน

## ข้อความเป็นเสียงพูด

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
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

หากละเว้น `messages.tts.providers.openrouter.apiKey` TTS จะนำ
`models.providers.openrouter.apiKey` มาใช้ซ้ำ จากนั้นใช้ `OPENROUTER_API_KEY`

## เสียงพูดเป็นข้อความ (เสียงขาเข้า)

OpenRouter สามารถถอดความไฟล์แนบเสียงพูด/เสียงขาเข้าผ่านเส้นทาง
`tools.media.audio` ที่ใช้ร่วมกัน โดยใช้ endpoint STT (`/audio/transcriptions`)
ของตน สิ่งนี้ใช้กับ Plugin ช่องทางใดก็ได้ที่ส่งต่อเสียงพูด/เสียงขาเข้าเข้าสู่
preflight การทำความเข้าใจสื่อ

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

OpenClaw ส่งคำขอ STT ของ OpenRouter เป็น JSON พร้อมเสียง base64 ใต้
`input_audio` (สัญญา STT ของ OpenRouter) ไม่ใช่การอัปโหลดฟอร์ม OpenAI แบบ multipart

## เราเตอร์ Fusion

ใช้ OpenRouter Fusion เมื่อคุณต้องการให้การอ้างอิงโมเดล OpenClaw รายการเดียวถาม
โมเดล OpenRouter หลายตัวพร้อมกัน ให้ OpenRouter ตัดสินคำตอบของโมเดลเหล่านั้น
และส่งคืนคำตอบสุดท้ายรายการเดียวผ่าน endpoint ผู้ให้บริการ OpenRouter ตามปกติ
เนื่องจาก slug ของโมเดล upstream คือ `openrouter/fusion` การอ้างอิงโมเดล OpenClaw
จึงมีทั้งคำนำหน้าผู้ให้บริการ OpenClaw และ namespace OpenRouter upstream:

```bash
openclaw models set openrouter/openrouter/fusion
```

กำหนดค่า panel และ judge ของ Fusion ผ่าน `params.extraBody` ของโมเดล ฟิลด์เหล่านั้น
จะถูกส่งต่อเข้าไปในเนื้อหาคำขอ chat-completions ของ OpenRouter Fusion ใช้งานได้กับ
การเริ่มต้นใช้งาน OpenRouter OAuth หรือการเริ่มต้นใช้งานด้วยคีย์ API หากคุณใช้
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

รายการ `analysis_models` คือ panel แบบขนาน และ `model` ภายในการกำหนดค่า Plugin
Fusion คือโมเดล judge อย่าตั้งค่า `tool_choice` ระดับบนสุดเป็น
`"required"` ในเทิร์น agent/chat ปกติของ OpenClaw เพื่อพยายามบังคับ Fusion;
เทิร์นของ OpenClaw อาจมีนิยามเครื่องมือของ OpenClaw และตัวเลือกเครื่องมือที่บังคับ
ระดับบนสุดอาจบังคับให้ใช้เครื่องมือเหล่านั้นรายการใดรายการหนึ่งแทนเราเตอร์ Fusion
เมื่อมีการกำหนดค่า Plugin Fusion นี้ OpenClaw จะเพิ่มบันทึก system-prompt
ที่ผ่านการล้างข้อมูลแล้วพร้อมโมเดลวิเคราะห์และโมเดล judge ที่กำหนดค่าไว้ด้วย
เพื่อให้ agent สามารถตอบคำถามเกี่ยวกับ panel Fusion ปัจจุบันของตนได้ ฟิลด์
`extraBody` อื่นจะไม่ถูกคัดลอกเข้าไปใน prompt

Fusion ช้ากว่าโดยเจตนา OpenRouter อาจส่ง prompt เดียวกันของ OpenClaw ไปยัง
โมเดลวิเคราะห์หลายตัว แล้วจึงเรียกขั้นตอน judge/สังเคราะห์สุดท้าย ดังนั้น latency
มักสูงกว่าคำขอโมเดลเดียวโดยตรง ใช้ Fusion สำหรับคำตอบที่ต้องพิจารณาอย่างรอบคอบ
และมีคุณภาพสูง หรือเส้นทาง escalation ไม่ใช่เป็นค่าเริ่มต้นสำหรับแชตที่ไวต่อ
latency สำหรับคำตอบที่เร็วขึ้น ให้ใช้ panel ขนาดเล็กและเลือกโมเดลวิเคราะห์กับ
judge ที่เร็วกว่า

ทดสอบการอ้างอิงที่กำหนดค่าไว้ด้วยการเรียกโมเดลในเครื่องแบบ one-shot:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## การยืนยันตัวตนและส่วนหัว

OpenRouter ใช้โทเคน Bearer กับคีย์ API ของคุณอยู่เบื้องหลัง OpenRouter
OAuth เป็นขั้นตอนเข้าสู่ระบบ PKCE ที่ออกคีย์ API ของ OpenRouter ดังนั้น OpenClaw
จึงจัดเก็บผลลัพธ์เป็นโปรไฟล์การยืนยันตัวตนด้วยคีย์ API `openrouter:default`
เดียวกับที่ใช้โดยเส้นทางการตั้งค่าคีย์ API แบบแมนนวล

สำหรับการติดตั้งที่มีอยู่แล้ว ให้ลงชื่อเข้าใช้หรือหมุนเวียนคีย์ OpenRouter
ที่จัดเก็บไว้โดยไม่ต้องเรียกใช้การเริ่มต้นใช้งานเต็มรูปแบบอีกครั้ง:

```bash
openclaw models auth login --provider openrouter --method oauth
```

ใช้ `openclaw models auth login --provider openrouter --method api-key` เมื่อ
คุณต้องการวางคีย์ที่คุณสร้างเองที่ OpenRouter

ในคำขอ OpenRouter จริง (`https://openrouter.ai/api/v1`) OpenClaw จะเพิ่ม
ส่วนหัวการระบุแหล่งที่มาของแอปตามเอกสารของ OpenRouter ด้วย:

| ส่วนหัว                  | ค่า                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
หากคุณชี้ผู้ให้บริการ OpenRouter ไปยังพร็อกซีหรือ URL พื้นฐานอื่น OpenClaw
จะ **ไม่** แทรกส่วนหัวเฉพาะของ OpenRouter เหล่านั้นหรือเครื่องหมายแคช Anthropic
</Warning>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การแคชคำตอบ">
    การแคชคำตอบของ OpenRouter เป็นแบบ opt-in เปิดใช้ต่อโมเดล OpenRouter ด้วย
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
    คำขอปัจจุบันและจัดเก็บคำตอบแทนที่ นอกจากนี้ยังยอมรับ alias แบบ snake_case
    (`response_cache`, `response_cache_ttl_seconds` และ
    `response_cache_clear`)

    สิ่งนี้แยกจากการแคช prompt ของผู้ให้บริการ และจากเครื่องหมาย
    `cache_control` ของ Anthropic ใน OpenRouter ใช้เฉพาะกับเส้นทาง
    `openrouter.ai` ที่ตรวจสอบแล้วเท่านั้น ไม่ใช่ URL พื้นฐานพร็อกซีแบบกำหนดเอง

  </Accordion>

  <Accordion title="เครื่องหมายแคช Anthropic">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว การอ้างอิงโมเดล Anthropic จะเก็บ
    เครื่องหมาย `cache_control` ของ Anthropic ที่เฉพาะกับ OpenRouter ซึ่ง OpenClaw
    ใช้เพื่อให้การนำแคช prompt กลับมาใช้ซ้ำบนบล็อก prompt ระบบ/นักพัฒนาได้ดีขึ้น
  </Accordion>

  <Accordion title="พรีฟิลการให้เหตุผลของ Anthropic">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว การอ้างอิงโมเดล Anthropic ที่เปิดใช้การให้เหตุผล
    จะตัดเทิร์นพรีฟิลของผู้ช่วยที่ต่อท้ายออกก่อนที่คำขอจะไปถึง OpenRouter
    ให้ตรงกับข้อกำหนดของ Anthropic ที่ให้บทสนทนาการให้เหตุผลจบด้วยเทิร์นของผู้ใช้
  </Accordion>

  <Accordion title="การแทรกการคิด / การให้เหตุผล">
    บนเส้นทางที่รองรับซึ่งไม่ใช่ `auto` OpenClaw จะจับคู่ระดับการคิดที่เลือกกับ
    เพย์โหลดการให้เหตุผลของพร็อกซี OpenRouter คำแนะนำโมเดลที่ไม่รองรับและ
    `openrouter/auto` จะข้ามการแทรกการให้เหตุผลนั้น Hunter Alpha ยังข้าม
    การให้เหตุผลผ่านพร็อกซีสำหรับการอ้างอิงโมเดลที่กำหนดค่าไว้แต่ล้าสมัยด้วย เพราะ OpenRouter อาจ
    ส่งคืนข้อความคำตอบสุดท้ายในฟิลด์การให้เหตุผลสำหรับเส้นทางที่เลิกใช้แล้วนั้น
  </Accordion>

  <Accordion title="การเล่นซ้ำการให้เหตุผลของ DeepSeek V4">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว `openrouter/deepseek/deepseek-v4-flash` และ
    `openrouter/deepseek/deepseek-v4-pro` จะเติม `reasoning_content` ที่หายไปใน
    เทิร์นผู้ช่วยที่เล่นซ้ำ เพื่อให้บทสนทนาการคิด/เครื่องมือคงรูปแบบการติดตามผลที่ DeepSeek V4
    ต้องการ OpenClaw ส่งค่า `reasoning.effort` ที่ OpenRouter รองรับ
    สำหรับเส้นทางเหล่านี้ ระดับที่ไม่ใช่ปิดซึ่งต่ำกว่าจะจับคู่เป็น
    `high` และการเขียนทับ `max` ที่ล้าสมัยจะถูกจับคู่เป็น `xhigh`
  </Accordion>

  <Accordion title="การจัดรูปคำขอเฉพาะ OpenAI">
    OpenRouter ยังคงทำงานผ่านเส้นทางแบบพร็อกซีที่เข้ากันได้กับ OpenAI ดังนั้น
    การจัดรูปคำขอเฉพาะ OpenAI แบบเนทีฟ เช่น `serviceTier`, Responses `store`,
    เพย์โหลดความเข้ากันได้ด้านการให้เหตุผลของ OpenAI และคำแนะนำแคชพรอมต์จะไม่ถูกส่งต่อ
  </Accordion>

  <Accordion title="เส้นทางที่รองรับด้วย Gemini">
    การอ้างอิง OpenRouter ที่รองรับด้วย Gemini ยังคงอยู่บนเส้นทางพร็อกซี Gemini: OpenClaw คง
    การทำความสะอาดลายเซ็นความคิดของ Gemini ไว้ที่นั่น แต่ไม่เปิดใช้การตรวจสอบการเล่นซ้ำของ Gemini
    แบบเนทีฟหรือการเขียนบูตสแตรปใหม่
  </Accordion>

  <Accordion title="เมตาดาตาการกำหนดเส้นทางผู้ให้บริการ">
    OpenRouter รองรับอ็อบเจ็กต์คำขอ `provider` สำหรับการกำหนดเส้นทางผู้ให้บริการที่อยู่เบื้องหลัง
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

    OpenClaw ส่งต่ออ็อบเจ็กต์นั้นไปยัง OpenRouter เป็นเพย์โหลดคำขอ `provider`
    ใช้ฟิลด์ snake_case ที่เอกสารของ OpenRouter ระบุไว้ รวมถึง `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` และ `enforce_distillable_text`

    พารามิเตอร์รายโมเดลยังคงเขียนทับอ็อบเจ็กต์การกำหนดเส้นทางระดับผู้ให้บริการ:

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

    สิ่งนี้ใช้กับเส้นทาง chat-completions ของ OpenRouter เท่านั้น เส้นทาง Anthropic,
    Google, OpenAI หรือผู้ให้บริการแบบกำหนดเองโดยตรงจะละเว้นพารามิเตอร์การกำหนดเส้นทาง OpenRouter

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการเฟลโอเวอร์
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าแบบเต็มสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
