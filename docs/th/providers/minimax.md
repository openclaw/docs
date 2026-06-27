---
read_when:
    - คุณต้องการใช้โมเดล MiniMax ใน OpenClaw
    - คุณต้องการคำแนะนำในการตั้งค่า MiniMax
summary: ใช้โมเดล MiniMax ใน OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-06-27T18:14:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fe606178d7d15383e56c026b02ba7be751ead706adc097c776c0a6a92aa2a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw's MiniMax provider defaults to **MiniMax M3**.

MiniMax also provides:

- Bundled speech synthesis via T2A v2
- Bundled image understanding via `MiniMax-VL-01`
- Bundled music generation via `music-2.6`
- Bundled `web_search` through the MiniMax Token Plan search API

Provider split:

| Provider ID      | Auth    | Capabilities                                                                                        |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API key | Text, image generation, music generation, video generation, image understanding, speech, web search |
| `minimax-portal` | OAuth   | Text, image generation, music generation, video generation, image understanding, speech             |

## Built-in catalog

| Model                    | Type             | Description                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M3`             | Chat (reasoning) | Default hosted reasoning model           |
| `MiniMax-M2.7`           | Chat (reasoning) | Previous hosted reasoning model          |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Faster M2.7 reasoning tier               |
| `MiniMax-VL-01`          | Vision           | Image understanding model                |
| `image-01`               | Image generation | Text-to-image and image-to-image editing |
| `music-2.6`              | Music generation | Default music model                      |
| `music-2.5`              | Music generation | Previous music generation tier           |
| `music-2.0`              | Music generation | Legacy music generation tier             |
| `MiniMax-Hailuo-2.3`     | Video generation | Text-to-video and image reference flows  |

## Getting started

Choose your preferred auth method and follow the setup steps.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Best for:** quick setup with MiniMax Coding Plan via OAuth, no API key required.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            This authenticates against `api.minimax.io`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            This authenticates against `api.minimaxi.com`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth setups use the `minimax-portal` provider id. Model refs follow the form `minimax-portal/MiniMax-M3`.
    </Note>

    <Tip>
    Referral link for MiniMax Coding Plan (10% off): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Best for:** hosted MiniMax with Anthropic-compatible API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            This configures `api.minimax.io` as the base URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            This configures `api.minimaxi.com` as the base URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Config example

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    On the Anthropic-compatible streaming path, OpenClaw disables MiniMax M2.x thinking by default unless you explicitly set `thinking` yourself. M2.x's streaming endpoint emits `reasoning_content` in OpenAI-style delta chunks instead of native Anthropic thinking blocks, which can leak internal reasoning into visible output if left enabled implicitly. MiniMax-M3 (and forward-compatible M3.x) is exempt from this default: M3 emits proper Anthropic thinking blocks and requires thinking active to produce visible content, so OpenClaw keeps M3 on the provider's omitted/adaptive thinking path.
    </Warning>

    <Note>
    API-key setups use the `minimax` provider id. Model refs follow the form `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Configure via `openclaw configure`

Use the interactive config wizard to set MiniMax without editing JSON:

<Steps>
  <Step title="Launch the wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Select Model/auth">
    Choose **Model/auth** from the menu.
  </Step>
  <Step title="Choose a MiniMax auth option">
    Pick one of the available MiniMax options:

    | Auth choice | Description |
    | --- | --- |
    | `minimax-global-oauth` | International OAuth (Coding Plan) |
    | `minimax-cn-oauth` | China OAuth (Coding Plan) |
    | `minimax-global-api` | International API key |
    | `minimax-cn-api` | China API key |

  </Step>
  <Step title="Pick your default model">
    Select your default model when prompted.
  </Step>
</Steps>

## Capabilities

### Image generation

The MiniMax plugin registers the `image-01` model for the `image_generate` tool. It supports:

- **Text-to-image generation** with aspect ratio control
- **Image-to-image editing** (subject reference) with aspect ratio control
- Up to **9 output images** per request
- Up to **1 reference image** per edit request
- Supported aspect ratios: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

To use MiniMax for image generation, set it as the image generation provider:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

The plugin uses the same `MINIMAX_API_KEY` or OAuth auth as the text models. No additional configuration is needed if MiniMax is already set up.

Both `minimax` and `minimax-portal` register `image_generate` with the same
`image-01` model. API-key setups use `MINIMAX_API_KEY`; OAuth setups can use
the bundled `minimax-portal` auth path instead.

Image generation always uses MiniMax's dedicated image endpoint
(`/v1/image_generation`) and ignores `models.providers.minimax.baseUrl`,
since that field configures the chat/Anthropic-compatible base URL. Set
`MINIMAX_API_HOST=https://api.minimaxi.com` to route image generation
through the CN endpoint; the default global endpoint is
`https://api.minimax.io`.

When onboarding or API-key setup writes explicit `models.providers.minimax`
entries, OpenClaw materializes `MiniMax-M3`, `MiniMax-M2.7`, and
`MiniMax-M2.7-highspeed` as chat models. M3 advertises text and image input;
image understanding remains exposed separately through the plugin-owned
`MiniMax-VL-01` media provider.

<Note>
See [Image Generation](/th/tools/image-generation) for shared tool parameters, provider selection, and failover behavior.
</Note>

### Text-to-speech

The bundled `minimax` plugin registers MiniMax T2A v2 as a speech provider for
`messages.tts`.

- Default TTS model: `speech-2.8-hd`
- Default voice: `English_expressive_narrator`
- Supported bundled model ids include `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd`, and `speech-01-turbo`.
- Auth resolution is `messages.tts.providers.minimax.apiKey`, then
  `minimax-portal` OAuth/token auth profiles, then Token Plan environment
  keys (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), then `MINIMAX_API_KEY`.
- If no TTS host is configured, OpenClaw reuses the configured
  `minimax-portal` OAuth host and strips Anthropic-compatible path suffixes
  such as `/anthropic`.
- Normal audio attachments stay MP3.
- Voice-note targets such as Feishu and Telegram are transcoded from MiniMax
  MP3 to 48kHz Opus with `ffmpeg`, because the Feishu/Lark file API only
  accepts `file_type: "opus"` for native audio messages.
- MiniMax T2A accepts fractional `speed` and `vol`, but `pitch` is sent as an
  integer; OpenClaw truncates fractional `pitch` values before the API request.

| Setting                                         | Env var                | Default                       | Description                      |
| ----------------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl`        | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API host.            |
| `messages.tts.providers.minimax.model`          | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS model id.                    |
| `messages.tts.providers.minimax.speakerVoiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Voice id used for speech output. |
| `messages.tts.providers.minimax.speed`          |                        | `1.0`                         | Playback speed, `0.5..2.0`.      |
| `messages.tts.providers.minimax.vol`            |                        | `1.0`                         | Volume, `(0, 10]`.               |
| `messages.tts.providers.minimax.pitch`          |                        | `0`                           | Integer pitch shift, `-12..12`.  |

### Music generation

The bundled MiniMax plugin registers music generation through the shared
`music_generate` tool for both `minimax` and `minimax-portal`.

- โมเดลเพลงเริ่มต้น: `minimax/music-2.6`
- โมเดลเพลง OAuth: `minimax-portal/music-2.6`
- รองรับ `minimax/music-2.5` และ `minimax/music-2.0` ด้วย
- การควบคุมพรอมป์: `lyrics`, `instrumental`
- รูปแบบเอาต์พุต: `mp3`
- การรันที่มีเซสชันรองรับจะแยกตัวผ่านโฟลว์งาน/สถานะร่วม รวมถึง `action: "status"`

หากต้องการใช้ MiniMax เป็นผู้ให้บริการเพลงเริ่มต้น:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
ดู [การสร้างเพลง](/th/tools/music-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือกผู้ให้บริการ และพฤติกรรมการสลับเมื่อเกิดข้อผิดพลาด
</Note>

### การสร้างวิดีโอ

Plugin MiniMax ที่มาพร้อมชุดติดตั้งลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือร่วม
`video_generate` สำหรับทั้ง `minimax` และ `minimax-portal`

- โมเดลวิดีโอเริ่มต้น: `minimax/MiniMax-Hailuo-2.3`
- โมเดลวิดีโอ OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- โหมด: โฟลว์ข้อความเป็นวิดีโอและโฟลว์อ้างอิงภาพเดี่ยว
- รองรับ `aspectRatio` และ `resolution`

หากต้องการใช้ MiniMax เป็นผู้ให้บริการวิดีโอเริ่มต้น:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือกผู้ให้บริการ และพฤติกรรมการสลับเมื่อเกิดข้อผิดพลาด
</Note>

### การทำความเข้าใจภาพ

Plugin MiniMax ลงทะเบียนการทำความเข้าใจภาพแยกจากแคตตาล็อกข้อความ:

| ID ผู้ให้บริการ      | โมเดลภาพเริ่มต้น |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

นี่คือเหตุผลที่การกำหนดเส้นทางสื่ออัตโนมัติสามารถใช้การทำความเข้าใจภาพของ MiniMax ได้
แม้เมื่อแคตตาล็อกผู้ให้บริการข้อความที่มาพร้อมชุดติดตั้งมี refs แชตที่รองรับภาพของ M3 ด้วย

### การค้นหาเว็บ

Plugin MiniMax ยังลงทะเบียน `web_search` ผ่าน API ค้นหา MiniMax Token Plan ด้วย

- ID ผู้ให้บริการ: `minimax`
- ผลลัพธ์แบบมีโครงสร้าง: ชื่อเรื่อง, URL, snippets, คำค้นที่เกี่ยวข้อง
- ตัวแปรสภาพแวดล้อมที่แนะนำ: `MINIMAX_CODE_PLAN_KEY`
- นามแฝง env ที่ยอมรับ: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- ทางเลือกสำรองด้านความเข้ากันได้: `MINIMAX_API_KEY` เมื่อชี้ไปยังข้อมูลรับรอง token-plan อยู่แล้ว
- การใช้ภูมิภาคซ้ำ: `plugins.entries.minimax.config.webSearch.region` จากนั้น `MINIMAX_API_HOST` จากนั้น URL ฐานของผู้ให้บริการ MiniMax
- การค้นหายังคงอยู่บน ID ผู้ให้บริการ `minimax`; การตั้งค่า OAuth CN/global สามารถกำหนดภูมิภาคทางอ้อมผ่าน `models.providers.minimax-portal.baseUrl` และสามารถให้ bearer auth ผ่าน `MINIMAX_OAUTH_TOKEN`

การกำหนดค่าอยู่ใต้ `plugins.entries.minimax.config.webSearch.*`

<Note>
ดู [การค้นหา MiniMax](/th/tools/minimax-search) สำหรับการกำหนดค่าและการใช้งานการค้นหาเว็บแบบครบถ้วน
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Configuration options">
    | ตัวเลือก | คำอธิบาย |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | แนะนำให้ใช้ `https://api.minimax.io/anthropic` (เข้ากันได้กับ Anthropic); `https://api.minimax.io/v1` เป็นตัวเลือกสำหรับเพย์โหลดที่เข้ากันได้กับ OpenAI |
    | `models.providers.minimax.api` | แนะนำให้ใช้ `anthropic-messages`; `openai-completions` เป็นตัวเลือกสำหรับเพย์โหลดที่เข้ากันได้กับ OpenAI |
    | `models.providers.minimax.apiKey` | คีย์ API ของ MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | กำหนด `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | ตั้งนามแฝงให้โมเดลที่คุณต้องการในรายการอนุญาต |
    | `models.mode` | คง `merge` ไว้หากคุณต้องการเพิ่ม MiniMax ควบคู่กับสิ่งที่มีมาให้ |
  </Accordion>

  <Accordion title="Thinking defaults">
    บน `api: "anthropic-messages"` OpenClaw จะแทรก `thinking: { type: "disabled" }` สำหรับโมเดล MiniMax M2.x เว้นแต่จะตั้งค่า thinking อย่างชัดเจนไว้แล้วใน params/config

    วิธีนี้ป้องกันไม่ให้ endpoint สตรีมมิงของ M2.x ปล่อย `reasoning_content` ในชังก์ delta แบบ OpenAI ซึ่งจะทำให้เหตุผลภายในรั่วไหลไปยังเอาต์พุตที่มองเห็นได้

    MiniMax-M3 (และ M3.x) ได้รับการยกเว้น: M3 ปล่อยบล็อก thinking แบบ Anthropic ที่ถูกต้อง และส่งคืนอาร์เรย์ `content` ว่างพร้อม `stop_reason: "end_turn"` เมื่อปิดใช้งาน thinking ดังนั้น wrapper จึงคง M3 ไว้บนเส้นทาง thinking แบบละไว้/ปรับอัตโนมัติของผู้ให้บริการ

  </Accordion>

  <Accordion title="Fast mode">
    `/fast on` หรือ `params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed` บนเส้นทางสตรีมที่เข้ากันได้กับ Anthropic
  </Accordion>

  <Accordion title="Fallback example">
    **เหมาะที่สุดสำหรับ:** คงโมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดของคุณไว้เป็นตัวหลัก แล้วสลับไปยัง MiniMax M2.7 เมื่อเกิดข้อผิดพลาด ตัวอย่างด้านล่างใช้ Opus เป็นตัวหลักที่ชัดเจน; เปลี่ยนเป็นโมเดลตัวหลักรุ่นล่าสุดที่คุณต้องการได้

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Coding Plan usage details">
    - API การใช้งาน Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` หรือ `https://api.minimax.io/v1/token_plan/remains` (ต้องใช้คีย์ coding plan)
    - การ polling การใช้งานจะได้ host จาก `models.providers.minimax-portal.baseUrl` หรือ `models.providers.minimax.baseUrl` เมื่อมีการกำหนดค่า ดังนั้นการตั้งค่า global ที่ใช้ `https://api.minimax.io/anthropic` จะ poll `api.minimax.io` URL ฐานที่ขาดหายหรือมีรูปแบบผิดจะคง fallback ของ CN ไว้เพื่อความเข้ากันได้
    - OpenClaw ทำให้การใช้งาน coding-plan ของ MiniMax เป็นรูปแบบเดียวกับการแสดง `% left` ที่ผู้ให้บริการรายอื่นใช้ ฟิลด์ดิบ `usage_percent` / `usagePercent` ของ MiniMax คือโควตาคงเหลือ ไม่ใช่โควตาที่ใช้ไป ดังนั้น OpenClaw จึงกลับค่า ฟิลด์แบบนับจำนวนจะมีลำดับความสำคัญเมื่อมีอยู่
    - เมื่อ API ส่งคืน `model_remains` OpenClaw จะเลือก entry ของโมเดลแชต สร้างป้ายหน้าต่างจาก `start_time` / `end_time` เมื่อจำเป็น และรวมชื่อโมเดลที่เลือกไว้ในป้ายแผนเพื่อให้แยกแยะหน้าต่าง coding-plan ได้ง่ายขึ้น
    - สแนปช็อตการใช้งานถือว่า `minimax`, `minimax-cn` และ `minimax-portal` เป็นพื้นผิวโควตา MiniMax เดียวกัน และให้ความสำคัญกับ MiniMax OAuth ที่จัดเก็บไว้ก่อนย้อนกลับไปใช้ตัวแปรสภาพแวดล้อมคีย์ Coding Plan

  </Accordion>
</AccordionGroup>

## หมายเหตุ

- refs โมเดลเป็นไปตามเส้นทาง auth:
  - การตั้งค่าด้วยคีย์ API: `minimax/<model>`
  - การตั้งค่า OAuth: `minimax-portal/<model>`
- โมเดลแชตเริ่มต้น: `MiniMax-M3`
- โมเดลแชตทางเลือก: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- การ onboarding และการตั้งค่าคีย์ API โดยตรงจะเขียนคำจำกัดความโมเดลสำหรับ M3 และตัวแปร M2.7 ทั้งสองแบบ
- การทำความเข้าใจภาพใช้ผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
- อัปเดตราคาค่าใช้จ่ายใน `models.json` หากคุณต้องการการติดตามต้นทุนที่แม่นยำ
- ใช้ `openclaw models list` เพื่อยืนยัน ID ผู้ให้บริการปัจจุบัน จากนั้นสลับด้วย `openclaw models set minimax/MiniMax-M3` หรือ `openclaw models set minimax-portal/MiniMax-M3`

<Tip>
ลิงก์แนะนำสำหรับ MiniMax Coding Plan (ลด 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers) สำหรับกฎของผู้ให้บริการ
</Note>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M3"'>
    โดยทั่วไปหมายความว่า **ยังไม่ได้กำหนดค่าผู้ให้บริการ MiniMax** (ไม่พบ entry ผู้ให้บริการที่ตรงกัน และไม่พบโปรไฟล์ auth/env key ของ MiniMax) การแก้ไขสำหรับการตรวจจับนี้อยู่ใน **2026.1.12** แก้ไขได้โดย:

    - อัปเกรดเป็น **2026.1.12** (หรือรันจากซอร์ส `main`) จากนั้นรีสตาร์ต gateway
    - รัน `openclaw configure` และเลือกตัวเลือก auth ของ **MiniMax** หรือ
    - เพิ่มบล็อก `models.providers.minimax` หรือ `models.providers.minimax-portal` ที่ตรงกันด้วยตนเอง หรือ
    - ตั้งค่า `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` หรือโปรไฟล์ auth ของ MiniMax เพื่อให้สามารถแทรกผู้ให้บริการที่ตรงกันได้

    ตรวจสอบให้แน่ใจว่า ID โมเดล **แยกแยะตัวพิมพ์เล็ก-ใหญ่**:

    - เส้นทางคีย์ API: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` หรือ `minimax/MiniMax-M2.7-highspeed`
    - เส้นทาง OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` หรือ `minimax-portal/MiniMax-M2.7-highspeed`

    จากนั้นตรวจสอบอีกครั้งด้วย:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [FAQ](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, refs โมเดล และพฤติกรรมการสลับเมื่อเกิดข้อผิดพลาด
  </Card>
  <Card title="Image generation" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือภาพร่วมและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Music generation" href="/th/tools/music-generation" icon="music">
    พารามิเตอร์เครื่องมือเพลงร่วมและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Video generation" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอร่วมและการเลือกผู้ให้บริการ
  </Card>
  <Card title="MiniMax Search" href="/th/tools/minimax-search" icon="magnifying-glass">
    การกำหนดค่าการค้นหาเว็บผ่าน MiniMax Token Plan
  </Card>
  <Card title="Troubleshooting" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและ FAQ
  </Card>
</CardGroup>
