---
read_when:
    - คุณต้องการ API key เดียวสำหรับ LLM หลายตัว
    - คุณต้องการเรียกใช้โมเดลผ่าน OpenRouter ใน OpenClaw
    - คุณต้องการใช้ OpenRouter เพื่อสร้างรูปภาพ
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างเพลง
    - คุณต้องการใช้ OpenRouter เพื่อสร้างวิดีโอ
summary: ใช้ API แบบรวมศูนย์ของ OpenRouter เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T16:36:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter กำหนดเส้นทางคำขอไปยังโมเดลจำนวนมากผ่าน API และคีย์เดียว โดยเข้ากันได้กับ
OpenAI ดังนั้น OpenClaw จึงสื่อสารกับ OpenRouter ผ่านการรับส่งข้อมูลรูปแบบ
`openai-completions` แบบเดียวกับที่ใช้กับผู้ให้บริการพร็อกซีรายอื่น

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw เปิดขั้นตอนลงชื่อเข้าใช้ผ่านเบราว์เซอร์ของ OpenRouter (PKCE)
        แลกเปลี่ยนรหัสเป็นคีย์ API ของ OpenRouter และจัดเก็บไว้ในโปรไฟล์การยืนยันตัวตน
        OpenRouter เริ่มต้น บนโฮสต์ระยะไกลหรือแบบไม่มีส่วนติดต่อผู้ใช้ OpenClaw
        จะแสดง URL สำหรับลงชื่อเข้าใช้และขอให้คุณวาง URL เปลี่ยนเส้นทางหลังจากลงชื่อเข้าใช้แล้ว
      </Step>
      <Step title="(ไม่บังคับ) เปลี่ยนไปใช้โมเดลที่ระบุ">
        การเริ่มต้นใช้งานจะใช้ `openrouter/auto` เป็นค่าเริ่มต้น คุณสามารถเลือกโมเดลที่เจาะจงภายหลังได้:

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
      <Step title="(ไม่บังคับ) เปลี่ยนไปใช้โมเดลที่ระบุ">
        การเริ่มต้นใช้งานจะใช้ `openrouter/auto` เป็นค่าเริ่มต้น คุณสามารถเลือกโมเดลที่เจาะจงภายหลังได้:

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
การอ้างอิงโมเดลใช้รูปแบบ `openrouter/<provider>/<model>` สำหรับรายชื่อผู้ให้บริการและโมเดล
ที่พร้อมใช้งานทั้งหมด โปรดดู [/concepts/model-providers](/th/concepts/model-providers)
</Note>

โมเดลสำรองที่มาพร้อมระบบ ซึ่งใช้เมื่อไม่สามารถค้นหาแค็ตตาล็อกแบบสดได้:

| การอ้างอิงโมเดล                  | หมายเหตุ                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | การกำหนดเส้นทางอัตโนมัติของ OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 ผ่าน MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 ผ่าน MoonshotAI     |

การอ้างอิง `openrouter/<provider>/<model>` อื่นใด รวมถึง
`openrouter/openrouter/fusion` (ดู [เราเตอร์ Fusion](#fusion-router)) จะได้รับการแก้ไข
แบบไดนามิกโดยเทียบกับแค็ตตาล็อกโมเดลแบบสดของ OpenRouter

## การสร้างรูปภาพ

OpenRouter สามารถทำหน้าที่เป็นระบบเบื้องหลังให้เครื่องมือ `image_generate` ได้ กำหนดโมเดลรูปภาพของ OpenRouter
ภายใต้ `agents.defaults.imageGenerationModel`:

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

OpenClaw ส่งคำขอรูปภาพไปยัง API รูปภาพแบบ chat-completions ของ OpenRouter พร้อม
`modalities: ["image", "text"]` นอกจากนี้ โมเดลรูปภาพ Gemini ยังได้รับคำแนะนำ
`aspectRatio` และ `resolution` ผ่าน `image_config` ของ OpenRouter ส่วนโมเดลรูปภาพอื่น
จะไม่ได้รับคำแนะนำเหล่านี้ ใช้ `agents.defaults.imageGenerationModel.timeoutMs` สำหรับ
โมเดลที่ทำงานช้ากว่า โดยค่า `timeoutMs` ต่อการเรียกของเครื่องมือ `image_generate` ยังคงมีลำดับความสำคัญสูงกว่า

## การสร้างวิดีโอ

OpenRouter สามารถทำหน้าที่เป็นระบบเบื้องหลังให้เครื่องมือ `video_generate` ผ่าน API แบบอะซิงโครนัส
`/videos` กำหนดโมเดลวิดีโอของ OpenRouter ภายใต้
`agents.defaults.videoGenerationModel`:

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

OpenClaw ส่งงานแปลงข้อความเป็นวิดีโอและรูปภาพเป็นวิดีโอ ตรวจสอบสถานะจาก
`polling_url` ที่ได้รับกลับมา และดาวน์โหลดวิดีโอที่เสร็จสมบูรณ์จาก
`unsigned_urls` ของ OpenRouter หรือปลายทางเนื้อหาของงาน รูปภาพอ้างอิงจะใช้เป็น
รูปภาพเฟรมแรก/สุดท้ายโดยค่าเริ่มต้น ส่วนรูปภาพที่ติดแท็ก `reference_image`
จะถูกส่งเป็นข้อมูลอ้างอิงขาเข้าแทน ค่าเริ่มต้น `google/veo-3.1-fast` ที่มาพร้อมระบบ
รองรับระยะเวลา 4/6/8 วินาที ความละเอียด `720P`/`1080P` และอัตราส่วนภาพ
`16:9`/`9:16` ไม่รองรับการแปลงวิดีโอเป็นวิดีโอ เนื่องจาก API ต้นทางรับเฉพาะข้อความ
และรูปภาพอ้างอิงเท่านั้น

## การสร้างเพลง

OpenRouter สามารถทำหน้าที่เป็นระบบเบื้องหลังให้เครื่องมือ `music_generate` ผ่านเอาต์พุตเสียง
แบบ chat-completions กำหนดโมเดลเสียงของ OpenRouter ภายใต้
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

ผู้ให้บริการเพลง OpenRouter ที่มาพร้อมระบบจะใช้ `google/lyria-3-pro-preview`
เป็นค่าเริ่มต้น และยังเปิดให้ใช้ `google/lyria-3-clip-preview` ด้วย OpenClaw ส่ง
`modalities: ["text", "audio"]` สตรีมการตอบกลับ รวบรวมส่วนข้อมูลเสียง และบันทึก
ผลลัพธ์เป็นสื่อที่สร้างขึ้นเพื่อส่งผ่านช่องทาง โมเดล Lyria รับรูปภาพอ้างอิงได้หนึ่งรูป
ผ่านพารามิเตอร์ `music_generate image=...` ที่ใช้ร่วมกัน เสียงแบบสตรีม การเก็บรักษาบทถอดเสียง
และกรอบเหตุการณ์ SSE ที่สร้างขึ้นจะถูกจำกัดด้วย `agents.defaults.mediaMaxMb`
(ขีดจำกัดเสียงเริ่มต้นคือ 16 MB)

## การแปลงข้อความเป็นเสียงพูด

OpenRouter สามารถทำหน้าที่เป็นผู้ให้บริการ TTS ผ่านปลายทางที่เข้ากันได้กับ OpenAI
`/audio/speech`

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

หากละเว้น `messages.tts.providers.openrouter.apiKey` ระบบ TTS จะใช้
`models.providers.openrouter.apiKey` เป็นทางเลือกสำรอง จากนั้นจึงใช้ `OPENROUTER_API_KEY`

## การแปลงเสียงเป็นข้อความ (เสียงขาเข้า)

OpenRouter สามารถถอดเสียงไฟล์แนบประเภทเสียงพูด/เสียงขาเข้าผ่านเส้นทางร่วม
`tools.media.audio` โดยใช้ปลายทาง STT (`/audio/transcriptions`)
ซึ่งใช้ได้กับ Plugin ช่องทางใดก็ตามที่ส่งต่อเสียงพูด/เสียงขาเข้าไปยัง
ขั้นตอนตรวจสอบเบื้องต้นเพื่อทำความเข้าใจสื่อ

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

OpenClaw ส่งคำขอ STT ไปยัง OpenRouter ในรูปแบบ JSON โดยมีเสียงแบบ base64 อยู่ภายใต้
`input_audio` (สัญญา STT ของ OpenRouter) ไม่ใช่การอัปโหลดฟอร์ม OpenAI
แบบ multipart

## เราเตอร์ Fusion

OpenRouter Fusion ส่งการอ้างอิงโมเดล OpenClaw หนึ่งรายการไปยังโมเดล OpenRouter หลายโมเดล
พร้อมกัน ให้ OpenRouter ตัดสินคำตอบของโมเดลเหล่านั้น และส่งคืนคำตอบสุดท้ายหนึ่งรายการ
ผ่านปลายทาง OpenRouter ตามปกติ slug ของโมเดลต้นทางคือ
`openrouter/fusion` ดังนั้นการอ้างอิงโมเดล OpenClaw จึงมีทั้งคำนำหน้าผู้ให้บริการ
OpenClaw และเนมสเปซ OpenRouter ต้นทาง:

```bash
openclaw models set openrouter/openrouter/fusion
```

กำหนดค่าแผงโมเดลและโมเดลตัดสินของ Fusion ผ่าน `params.extraBody` ของโมเดล
ฟิลด์เหล่านั้นจะถูกส่งต่อโดยตรงไปยังเนื้อหาคำขอ chat-completions ของ OpenRouter
Fusion ใช้งานได้ทั้งกับการเริ่มต้นใช้งานด้วย OAuth หรือคีย์ API หากคุณใช้ OAuth
ให้ละเว้นบรรทัด `env.OPENROUTER_API_KEY` ด้านล่าง

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

`analysis_models` คือแผงโมเดลที่ทำงานพร้อมกัน ส่วน `model` ภายในการกำหนดค่า Plugin Fusion
คือโมเดลตัดสิน อย่าตั้งค่า `tool_choice` ระดับบนสุดเป็น `"required"`
ในการทำงานของเอเจนต์/แชตตามปกติเพื่อพยายามบังคับใช้ Fusion เนื่องจากการทำงานของ OpenClaw อาจมี
ข้อกำหนดเครื่องมือของตัวเอง และการบังคับเลือกเครื่องมือในระดับบนสุดอาจเลือกหนึ่งใน
เครื่องมือเหล่านั้นแทนเราเตอร์ Fusion เมื่อมีการกำหนดค่า Plugin Fusion นี้
OpenClaw จะเพิ่มหมายเหตุในพรอมต์ระบบที่ผ่านการปรับให้ปลอดภัย โดยระบุรายการโมเดลวิเคราะห์
และโมเดลตัดสินที่กำหนดค่าไว้ เพื่อให้เอเจนต์สามารถตอบคำถามเกี่ยวกับแผง Fusion
ของตนเองได้ ฟิลด์ `extraBody` อื่นจะไม่ถูกคัดลอกไปยังพรอมต์

Fusion ช้ากว่าโดยการออกแบบ เนื่องจาก OpenRouter กระจายพรอมต์ไปยัง
โมเดลวิเคราะห์หลายโมเดล จากนั้นจึงดำเนินขั้นตอนตัดสิน/สังเคราะห์ ดังนั้นเวลาแฝงจึงสูงกว่า
คำขอโดยตรงไปยังโมเดลเดียว ใช้ Fusion สำหรับคำตอบที่ผ่านการพิจารณาอย่างรอบคอบและมีคุณภาพสูง
หรือเส้นทางการยกระดับ ไม่ใช่เป็นค่าเริ่มต้นสำหรับงานที่ไวต่อเวลาแฝง ควรใช้แผงโมเดลขนาดเล็กและ
เลือกโมเดลวิเคราะห์/ตัดสินที่เร็วกว่าเพื่อให้ได้รับคำตอบรวดเร็วยิ่งขึ้น

ทดสอบการอ้างอิงที่กำหนดค่าด้วยการเรียกภายในเครื่องแบบครั้งเดียว:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## การยืนยันตัวตนและส่วนหัว

OpenRouter ใช้โทเค็น Bearer จากคีย์ API ของคุณ OAuth ของ OpenRouter เป็นขั้นตอน
การเข้าสู่ระบบแบบ PKCE ที่ออกคีย์ API ของ OpenRouter ดังนั้น OpenClaw จึงจัดเก็บผลลัพธ์ไว้ใน
โปรไฟล์การยืนยันตัวตนด้วยคีย์ API `openrouter:default` เดียวกับที่ใช้ในการตั้งค่า
คีย์ API ด้วยตนเอง

หากต้องการเข้าสู่ระบบหรือหมุนเวียนคีย์ที่จัดเก็บไว้ในการติดตั้งปัจจุบัน โดยไม่ต้องเรียกใช้
ขั้นตอนเริ่มต้นใช้งานทั้งหมดอีกครั้ง:

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

สำหรับคำขอ OpenRouter ที่ผ่านการตรวจสอบ (`https://openrouter.ai/api/v1`) OpenClaw จะเพิ่ม
ส่วนหัวระบุแหล่งที่มาของแอปตามเอกสารของ OpenRouter:

| ส่วนหัว                    | ค่า                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
หากคุณเปลี่ยนผู้ให้บริการ OpenRouter ให้ชี้ไปยังพร็อกซีหรือ URL ฐานอื่น OpenClaw
จะ**ไม่**แทรกส่วนหัวเฉพาะของ OpenRouter หรือเครื่องหมายแคชของ Anthropic
</Warning>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การแคชคำตอบ">
    การแคชคำตอบของ OpenRouter เป็นคุณสมบัติที่ต้องเลือกเปิดใช้ เปิดใช้แยกตามแต่ละโมเดล:

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
    จะส่ง `X-OpenRouter-Cache-TTL` ด้วย `responseCacheClear: true` บังคับให้รีเฟรชสำหรับ
    คำขอปัจจุบันและจัดเก็บคำตอบทดแทน รองรับนามแฝงแบบ snake_case
    (`response_cache`, `response_cache_ttl_seconds`,
    `response_cache_clear`) รวมถึง `responseCacheTtl` /
    `response_cache_ttl` ที่ไม่มีส่วนต่อท้าย `Seconds`

    คุณสมบัตินี้แยกจากการแคชพรอมต์ของผู้ให้บริการและเครื่องหมาย
    `cache_control` ของ Anthropic ใน OpenRouter โดยมีผลเฉพาะกับเส้นทาง
    `openrouter.ai` ที่ผ่านการตรวจสอบเท่านั้น ไม่รวม URL ฐานของพร็อกซีแบบกำหนดเอง

  </Accordion>

  <Accordion title="เครื่องหมายแคชของ Anthropic">
    บนเส้นทาง OpenRouter ที่ผ่านการตรวจสอบ การอ้างอิงโมเดล Anthropic จะคง
    เครื่องหมาย `cache_control` ของ Anthropic ใน OpenRouter ไว้ เพื่อให้สามารถใช้แคชพรอมต์ซ้ำได้ดีขึ้นกับ
    บล็อกพรอมต์ระบบ/นักพัฒนา
  </Accordion>

  <Accordion title="การเติมข้อความล่วงหน้าสำหรับการให้เหตุผลของ Anthropic">
    ในเส้นทาง OpenRouter ที่ตรวจสอบแล้ว การอ้างอิงโมเดล Anthropic ที่เปิดใช้การให้เหตุผล
    จะตัดเทิร์นการเติมข้อความล่วงหน้าของผู้ช่วยที่อยู่ท้ายสุดออกก่อนที่คำขอจะไปถึง
    OpenRouter เพื่อให้เป็นไปตามข้อกำหนดของ Anthropic ที่กำหนดให้บทสนทนาการให้เหตุผล
    ต้องจบด้วยเทิร์นของผู้ใช้
  </Accordion>

  <Accordion title="การแทรกการคิด / การให้เหตุผล">
    ในเส้นทางที่รองรับและไม่ใช่ `auto` OpenClaw จะแมประดับการคิดที่เลือก
    ไปยังเพย์โหลดการให้เหตุผลของพร็อกซี OpenRouter ส่วน `openrouter/auto` และคำใบ้
    โมเดลที่ไม่รองรับจะข้ามการแทรกดังกล่าว การอ้างอิง `openrouter/hunter-alpha` ที่ล้าสมัย
    ก็จะข้ามเช่นกัน เนื่องจาก OpenRouter อาจส่งคืนข้อความคำตอบสุดท้ายในฟิลด์การให้เหตุผล
    บนเส้นทางที่เลิกใช้งานแล้วนั้น
  </Accordion>

  <Accordion title="การเล่นซ้ำการให้เหตุผลของ DeepSeek V4">
    ในเส้นทาง OpenRouter ที่ตรวจสอบแล้ว `openrouter/deepseek/deepseek-v4-flash` และ
    `openrouter/deepseek/deepseek-v4-pro` จะเติม `reasoning_content` ที่ขาดหายไปใน
    เทิร์นของผู้ช่วยที่เล่นซ้ำ เพื่อคงรูปแบบการโต้ตอบติดตามผลที่ DeepSeek
    V4 กำหนดสำหรับบทสนทนาการคิดและเครื่องมือ OpenClaw จะส่งค่า
    `reasoning.effort` ที่ OpenRouter รองรับสำหรับเส้นทางเหล่านี้ โดย `xhigh`/`max`
    จะแมปเป็น `xhigh` และระดับอื่นทั้งหมดที่ไม่ใช่ปิดจะแมปเป็น `high`
  </Accordion>

  <Accordion title="การปรับรูปแบบคำขอเฉพาะ OpenAI">
    OpenRouter ทำงานผ่านเส้นทางที่เข้ากันได้กับ OpenAI ในรูปแบบพร็อกซี ดังนั้น
    การปรับรูปแบบคำขอที่มีเฉพาะใน OpenAI แบบเนทีฟ เช่น `serviceTier`, `store`
    ของ Responses, เพย์โหลดความเข้ากันได้สำหรับการให้เหตุผลของ OpenAI
    และคำใบ้แคชพรอมต์ จะไม่ถูกส่งต่อ
  </Accordion>

  <Accordion title="เส้นทางที่มี Gemini เป็นระบบเบื้องหลัง">
    การอ้างอิง OpenRouter ที่มี Gemini เป็นระบบเบื้องหลังจะยังคงอยู่บนเส้นทางพร็อกซี Gemini:
    OpenClaw จะคงการทำความสะอาดลายเซ็นความคิดของ Gemini ไว้ในเส้นทางดังกล่าว
    แต่จะไม่เปิดใช้การตรวจสอบความถูกต้องของการเล่นซ้ำหรือการเขียนบูตสแตรปใหม่
    แบบเนทีฟของ Gemini
  </Accordion>

  <Accordion title="เมทาดาทาการกำหนดเส้นทางผู้ให้บริการ">
    OpenRouter รองรับออบเจ็กต์คำขอ `provider` สำหรับกำหนดเส้นทางไปยังผู้ให้บริการ
    เบื้องหลัง กำหนดค่านโยบายเริ่มต้นสำหรับคำขอโมเดลข้อความทั้งหมดของ OpenRouter
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

    OpenClaw จะส่งต่อออบเจ็กต์ดังกล่าวไปยัง OpenRouter เป็นเพย์โหลดคำขอ `provider`
    ใช้ฟิลด์รูปแบบ snake_case ตามเอกสารของ OpenRouter ซึ่งรวมถึง `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` และ `enforce_distillable_text`

    พารามิเตอร์รายโมเดลจะแทนที่ออบเจ็กต์การกำหนดเส้นทางระดับผู้ให้บริการ:

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

    การตั้งค่านี้ใช้เฉพาะกับเส้นทางการเติมบทสนทนาของ OpenRouter เท่านั้น เส้นทางโดยตรงของ
    Anthropic, Google, OpenAI หรือผู้ให้บริการแบบกำหนดเองจะไม่ใช้พารามิเตอร์
    การกำหนดเส้นทางของ OpenRouter

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าฉบับเต็มสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
