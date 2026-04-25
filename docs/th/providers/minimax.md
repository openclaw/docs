---
read_when:
    - คุณต้องการใช้โมเดล MiniMax ใน OpenClaw
    - คุณต้องการคำแนะนำในการตั้งค่า MiniMax
summary: ใช้โมเดล MiniMax ใน OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-25T13:57:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 666e8fd958a2566a66bc2262a1b23e3253f4ed1367c4e684380041fd935ab4af
    source_path: providers/minimax.md
    workflow: 15
---

provider MiniMax ของ OpenClaw ใช้ค่าเริ่มต้นเป็น **MiniMax M2.7**

MiniMax ยังมีบริการดังนี้:

- การสังเคราะห์เสียงแบบ bundled ผ่าน T2A v2
- การทำความเข้าใจภาพแบบ bundled ผ่าน `MiniMax-VL-01`
- การสร้างเพลงแบบ bundled ผ่าน `music-2.6`
- `web_search` แบบ bundled ผ่าน MiniMax Coding Plan search API

การแยก provider:

| Provider ID      | การยืนยันตัวตน | ความสามารถ                                                    |
| ---------------- | -------------- | -------------------------------------------------------------- |
| `minimax`        | API key        | ข้อความ, การสร้างภาพ, การทำความเข้าใจภาพ, เสียง, การค้นหาเว็บ |
| `minimax-portal` | OAuth          | ข้อความ, การสร้างภาพ, การทำความเข้าใจภาพ, เสียง              |

## แค็ตตาล็อกในตัว

| โมเดล                    | ประเภท             | คำอธิบาย                                 |
| ------------------------ | ------------------ | ---------------------------------------- |
| `MiniMax-M2.7`           | แชต (reasoning)    | โมเดล reasoning แบบโฮสต์เริ่มต้น        |
| `MiniMax-M2.7-highspeed` | แชต (reasoning)    | ระดับ reasoning M2.7 ที่เร็วกว่า         |
| `MiniMax-VL-01`          | Vision             | โมเดลทำความเข้าใจภาพ                     |
| `image-01`               | การสร้างภาพ        | การสร้างภาพจากข้อความและการแก้ไขภาพต่อภาพ |
| `music-2.6`              | การสร้างเพลง       | โมเดลเพลงเริ่มต้น                        |
| `music-2.5`              | การสร้างเพลง       | ระดับการสร้างเพลงรุ่นก่อนหน้า           |
| `music-2.0`              | การสร้างเพลง       | ระดับการสร้างเพลงแบบ legacy              |
| `MiniMax-Hailuo-2.3`     | การสร้างวิดีโอ     | โฟลว์ข้อความเป็นวิดีโอและการอ้างอิงภาพ   |

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **เหมาะสำหรับ:** การตั้งค่าอย่างรวดเร็วด้วย MiniMax Coding Plan ผ่าน OAuth โดยไม่ต้องใช้ API key

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="เรียกใช้งาน onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            การดำเนินการนี้จะยืนยันตัวตนกับ `api.minimax.io`
          </Step>
          <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="เรียกใช้งาน onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            การดำเนินการนี้จะยืนยันตัวตนกับ `api.minimaxi.com`
          </Step>
          <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    การตั้งค่า OAuth ใช้ provider id เป็น `minimax-portal` การอ้างอิงโมเดลใช้รูปแบบ `minimax-portal/MiniMax-M2.7`
    </Note>

    <Tip>
    ลิงก์แนะนำสำหรับ MiniMax Coding Plan (ลด 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **เหมาะสำหรับ:** MiniMax แบบโฮสต์ที่ใช้ API ที่เข้ากันได้กับ Anthropic

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="เรียกใช้งาน onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            การดำเนินการนี้จะกำหนดค่า `api.minimax.io` เป็น base URL
          </Step>
          <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="เรียกใช้งาน onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            การดำเนินการนี้จะกำหนดค่า `api.minimaxi.com` เป็น base URL
          </Step>
          <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### ตัวอย่างการกำหนดค่า

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
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
    บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic นั้น OpenClaw จะปิด MiniMax thinking ตามค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า `thinking` เองอย่างชัดเจน endpoint สตรีมมิงของ MiniMax ปล่อย `reasoning_content` เป็น delta chunk แบบ OpenAI แทน native thinking block ของ Anthropic ซึ่งอาจทำให้ reasoning ภายในรั่วไปยังเอาต์พุตที่มองเห็นได้หากปล่อยให้เปิดใช้งานโดยปริยาย
    </Warning>

    <Note>
    การตั้งค่าด้วย API key ใช้ provider id เป็น `minimax` การอ้างอิงโมเดลใช้รูปแบบ `minimax/MiniMax-M2.7`
    </Note>

  </Tab>
</Tabs>

## กำหนดค่าผ่าน `openclaw configure`

ใช้ตัวช่วยกำหนดค่าแบบโต้ตอบเพื่อตั้งค่า MiniMax โดยไม่ต้องแก้ไข JSON:

<Steps>
  <Step title="เปิดตัวช่วย">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="เลือก Model/auth">
    เลือก **Model/auth** จากเมนู
  </Step>
  <Step title="เลือกตัวเลือกการยืนยันตัวตนของ MiniMax">
    เลือกหนึ่งในตัวเลือก MiniMax ที่มีให้:

    | ตัวเลือกการยืนยันตัวตน | คำอธิบาย |
    | --- | --- |
    | `minimax-global-oauth` | OAuth ระหว่างประเทศ (Coding Plan) |
    | `minimax-cn-oauth` | OAuth สำหรับจีน (Coding Plan) |
    | `minimax-global-api` | API key ระหว่างประเทศ |
    | `minimax-cn-api` | API key สำหรับจีน |

  </Step>
  <Step title="เลือกโมเดลเริ่มต้นของคุณ">
    เลือกโมเดลเริ่มต้นของคุณเมื่อระบบถาม
  </Step>
</Steps>

## ความสามารถ

### การสร้างภาพ

Plugin MiniMax ลงทะเบียนโมเดล `image-01` สำหรับเครื่องมือ `image_generate` โดยรองรับ:

- **การสร้างภาพจากข้อความ** พร้อมการควบคุมอัตราส่วนภาพ
- **การแก้ไขภาพจากภาพ** (การอ้างอิงวัตถุ) พร้อมการควบคุมอัตราส่วนภาพ
- รูปภาพผลลัพธ์สูงสุด **9 ภาพ** ต่อคำขอ
- รูปภาพอ้างอิงสูงสุด **1 ภาพ** ต่อคำขอแก้ไข
- อัตราส่วนภาพที่รองรับ: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

หากต้องการใช้ MiniMax สำหรับการสร้างภาพ ให้ตั้งค่าเป็น provider การสร้างภาพ:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin นี้ใช้ `MINIMAX_API_KEY` เดียวกัน หรือใช้การยืนยันตัวตนแบบ OAuth เดียวกับโมเดลข้อความ หากตั้งค่า MiniMax ไว้แล้ว ก็ไม่ต้องมีการกำหนดค่าเพิ่มเติม

ทั้ง `minimax` และ `minimax-portal` ลงทะเบียน `image_generate` ด้วยโมเดล
`image-01` เดียวกัน การตั้งค่าด้วย API key ใช้ `MINIMAX_API_KEY`; การตั้งค่าด้วย OAuth สามารถใช้
เส้นทางการยืนยันตัวตน `minimax-portal` แบบ bundled แทนได้

เมื่อ onboarding หรือการตั้งค่าด้วย API key เขียนรายการ `models.providers.minimax`
แบบชัดเจน OpenClaw จะสร้าง `MiniMax-M2.7` และ
`MiniMax-M2.7-highspeed` เป็นโมเดลแชตสำหรับข้อความเท่านั้นโดยอัตโนมัติ การทำความเข้าใจภาพ
จะถูกเปิดเผยแยกต่างหากผ่าน media provider `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ

<Note>
ดู [การสร้างภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

### การแปลงข้อความเป็นเสียงพูด

Plugin `minimax` แบบ bundled ลงทะเบียน MiniMax T2A v2 เป็น speech provider สำหรับ
`messages.tts`

- โมเดล TTS เริ่มต้น: `speech-2.8-hd`
- เสียงเริ่มต้น: `English_expressive_narrator`
- model id แบบ bundled ที่รองรับมี `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` และ `speech-01-turbo`
- ลำดับการแก้ไขการยืนยันตัวตนคือ `messages.tts.providers.minimax.apiKey`, จากนั้น
  โปรไฟล์การยืนยันตัวตน OAuth/token ของ `minimax-portal`, จากนั้นเป็นคีย์สภาพแวดล้อมของ Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`) และสุดท้าย `MINIMAX_API_KEY`
- หากไม่ได้กำหนดค่าโฮสต์ TTS ไว้ OpenClaw จะนำโฮสต์ OAuth `minimax-portal`
  ที่กำหนดค่าไว้มาใช้ซ้ำ และตัด path suffix แบบเข้ากันได้กับ Anthropic
  เช่น `/anthropic` ออก
- ไฟล์แนบเสียงปกติยังคงเป็น MP3
- เป้าหมายประเภท voice note เช่น Feishu และ Telegram จะถูกแปลงจาก MP3 ของ MiniMax
  เป็น Opus 48kHz ด้วย `ffmpeg` เนื่องจาก Feishu/Lark file API
  ยอมรับเฉพาะ `file_type: "opus"` สำหรับข้อความเสียงแบบ native
- MiniMax T2A รองรับ `speed` และ `vol` แบบเลขทศนิยม แต่ `pitch` จะถูกส่งเป็น
  จำนวนเต็ม; OpenClaw จะตัดค่าทศนิยมของ `pitch` ออกก่อนส่งคำขอ API

| การตั้งค่า                               | Env var                | ค่าเริ่มต้น                   | คำอธิบาย                          |
| ---------------------------------------- | ---------------------- | ----------------------------- | --------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | โฮสต์ MiniMax T2A API             |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | model id ของ TTS                  |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | voice id ที่ใช้สำหรับเอาต์พุตเสียง |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | ความเร็วในการเล่น, `0.5..2.0`      |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | ระดับเสียง, `(0, 10]`             |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | การเลื่อน pitch แบบจำนวนเต็ม, `-12..12` |

### การสร้างเพลง

Plugin `minimax` แบบ bundled ยังลงทะเบียนการสร้างเพลงผ่านเครื่องมือ
`music_generate` ที่ใช้ร่วมกันด้วย

- โมเดลเพลงเริ่มต้น: `minimax/music-2.6`
- รองรับ `minimax/music-2.5` และ `minimax/music-2.0` ด้วย
- ตัวควบคุมพรอมป์ต์: `lyrics`, `instrumental`, `durationSeconds`
- รูปแบบเอาต์พุต: `mp3`
- การรันแบบมีเซสชันเบื้องหลังจะแยกทำงานผ่านโฟลว์ task/status ที่ใช้ร่วมกัน รวมถึง `action: "status"`

หากต้องการใช้ MiniMax เป็น provider เพลงเริ่มต้น:

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
ดู [การสร้างเพลง](/th/tools/music-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

### การสร้างวิดีโอ

Plugin `minimax` แบบ bundled ยังลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ
`video_generate` ที่ใช้ร่วมกันด้วย

- โมเดลวิดีโอเริ่มต้น: `minimax/MiniMax-Hailuo-2.3`
- โหมด: ข้อความเป็นวิดีโอ และโฟลว์อ้างอิงภาพเดียว
- รองรับ `aspectRatio` และ `resolution`

หากต้องการใช้ MiniMax เป็น provider วิดีโอเริ่มต้น:

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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

### การทำความเข้าใจภาพ

Plugin MiniMax ลงทะเบียนการทำความเข้าใจภาพแยกจากแค็ตตาล็อกข้อความ:

| Provider ID      | โมเดลภาพเริ่มต้น |
| ---------------- | ----------------- |
| `minimax`        | `MiniMax-VL-01`   |
| `minimax-portal` | `MiniMax-VL-01`   |

นั่นคือเหตุผลที่การกำหนดเส้นทางสื่ออัตโนมัติสามารถใช้ความสามารถทำความเข้าใจภาพของ MiniMax ได้ แม้ว่า
แค็ตตาล็อก text-provider แบบ bundled จะยังคงแสดงการอ้างอิงแชต M2.7 แบบข้อความเท่านั้น

### การค้นหาเว็บ

Plugin MiniMax ยังลงทะเบียน `web_search` ผ่าน MiniMax Coding Plan
search API ด้วย

- provider id: `minimax`
- ผลลัพธ์แบบมีโครงสร้าง: ชื่อเรื่อง, URL, snippet, คำค้นหาที่เกี่ยวข้อง
- env var ที่แนะนำ: `MINIMAX_CODE_PLAN_KEY`
- env alias ที่ยอมรับ: `MINIMAX_CODING_API_KEY`
- fallback เพื่อความเข้ากันได้: `MINIMAX_API_KEY` เมื่อชี้ไปยังโทเค็น coding-plan อยู่แล้ว
- การใช้ region ซ้ำ: `plugins.entries.minimax.config.webSearch.region`, จากนั้น `MINIMAX_API_HOST`, จากนั้น base URL ของ provider MiniMax
- การค้นหายังคงอยู่บน provider id `minimax`; การตั้งค่า OAuth แบบ CN/global ยังสามารถชี้นำ region ทางอ้อมผ่าน `models.providers.minimax-portal.baseUrl`

ค่ากำหนดอยู่ภายใต้ `plugins.entries.minimax.config.webSearch.*`

<Note>
ดู [MiniMax Search](/th/tools/minimax-search) สำหรับการกำหนดค่าและการใช้งานการค้นหาเว็บแบบเต็ม
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวเลือกการกำหนดค่า">
    | ตัวเลือก | คำอธิบาย |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | แนะนำให้ใช้ `https://api.minimax.io/anthropic` (เข้ากันได้กับ Anthropic); `https://api.minimax.io/v1` เป็นตัวเลือกสำหรับ payload ที่เข้ากันได้กับ OpenAI |
    | `models.providers.minimax.api` | แนะนำให้ใช้ `anthropic-messages`; `openai-completions` เป็นตัวเลือกสำหรับ payload ที่เข้ากันได้กับ OpenAI |
    | `models.providers.minimax.apiKey` | API key ของ MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | กำหนด `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | ตั้ง alias ให้โมเดลที่คุณต้องการใน allowlist |
    | `models.mode` | ใช้ `merge` ต่อไปหากคุณต้องการเพิ่ม MiniMax ควบคู่กับรายการในตัว |
  </Accordion>

  <Accordion title="ค่าเริ่มต้นของ Thinking">
    บน `api: "anthropic-messages"` OpenClaw จะ inject `thinking: { type: "disabled" }` เว้นแต่จะมีการตั้งค่า thinking ไว้อย่างชัดเจนในพารามิเตอร์/การกำหนดค่าแล้ว

    วิธีนี้ป้องกันไม่ให้ endpoint สตรีมมิงของ MiniMax ปล่อย `reasoning_content` เป็น delta chunk แบบ OpenAI ซึ่งจะทำให้ reasoning ภายในรั่วไปยังเอาต์พุตที่มองเห็นได้

  </Accordion>

  <Accordion title="โหมดเร็ว">
    `/fast on` หรือ `params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed` บนเส้นทางสตรีมที่เข้ากันได้กับ Anthropic
  </Accordion>

  <Accordion title="ตัวอย่าง fallback">
    **เหมาะสำหรับ:** ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดของคุณเป็นตัวหลัก และ fail over ไปที่ MiniMax M2.7 ตัวอย่างด้านล่างใช้ Opus เป็นโมเดลหลักแบบเจาะจง; เปลี่ยนเป็นโมเดลหลักรุ่นล่าสุดที่คุณต้องการได้

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

  <Accordion title="รายละเอียดการใช้งาน Coding Plan">
    - API การใช้งาน Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (ต้องใช้คีย์ coding plan)
    - OpenClaw ปรับค่าการใช้งาน coding-plan ของ MiniMax ให้เป็นการแสดงผล `% left` แบบเดียวกับ provider อื่น ๆ ฟิลด์ดิบ `usage_percent` / `usagePercent` ของ MiniMax หมายถึงโควต้าที่เหลืออยู่ ไม่ใช่โควต้าที่ใช้ไป ดังนั้น OpenClaw จึงกลับค่าดังกล่าว ฟิลด์แบบนับจำนวนจะมีลำดับความสำคัญเมื่อมีอยู่
    - เมื่อ API ส่งคืน `model_remains` OpenClaw จะเลือกใช้รายการ chat-model ก่อน สร้างป้ายหน้าต่างจาก `start_time` / `end_time` เมื่อจำเป็น และรวมชื่อโมเดลที่เลือกไว้ในป้ายแผน เพื่อให้แยกความแตกต่างของหน้าต่าง coding-plan ได้ง่ายขึ้น
    - สแนปชอตการใช้งานจะถือว่า `minimax`, `minimax-cn` และ `minimax-portal` เป็นพื้นผิวโควต้า MiniMax เดียวกัน และจะเลือกใช้ MiniMax OAuth ที่จัดเก็บไว้ก่อน fallback ไปยัง env var คีย์ Coding Plan
  </Accordion>
</AccordionGroup>

## หมายเหตุ

- การอ้างอิงโมเดลเป็นไปตามเส้นทางการยืนยันตัวตน:
  - การตั้งค่าด้วย API key: `minimax/<model>`
  - การตั้งค่าด้วย OAuth: `minimax-portal/<model>`
- โมเดลแชตเริ่มต้น: `MiniMax-M2.7`
- โมเดลแชตทางเลือก: `MiniMax-M2.7-highspeed`
- onboarding และการตั้งค่าด้วย API key โดยตรงจะเขียนคำจำกัดความโมเดลแบบข้อความเท่านั้นสำหรับทั้งสองรุ่น M2.7
- การทำความเข้าใจภาพใช้ media provider `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
- อัปเดตราคาค่าใช้จ่ายใน `models.json` หากคุณต้องการติดตามต้นทุนอย่างแม่นยำ
- ใช้ `openclaw models list` เพื่อยืนยัน provider id ปัจจุบัน จากนั้นสลับด้วย `openclaw models set minimax/MiniMax-M2.7` หรือ `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
ลิงก์แนะนำสำหรับ MiniMax Coding Plan (ลด 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
ดู [Model providers](/th/concepts/model-providers) สำหรับกฎของ provider
</Note>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    โดยปกติแล้วหมายความว่า **ยังไม่ได้กำหนดค่า provider MiniMax** (ไม่มีรายการ provider ที่ตรงกัน และไม่พบโปรไฟล์/คีย์ env สำหรับการยืนยันตัวตนของ MiniMax) การแก้ไขสำหรับการตรวจจับนี้อยู่ใน **2026.1.12** แก้ไขได้โดย:

    - อัปเกรดเป็น **2026.1.12** (หรือรันจากซอร์ส `main`) จากนั้นรีสตาร์ต gateway
    - รัน `openclaw configure` แล้วเลือกตัวเลือกการยืนยันตัวตน **MiniMax** หรือ
    - เพิ่มบล็อก `models.providers.minimax` หรือ `models.providers.minimax-portal` ที่ตรงกันด้วยตนเอง หรือ
    - ตั้งค่า `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` หรือโปรไฟล์การยืนยันตัวตนของ MiniMax เพื่อให้สามารถ inject provider ที่ตรงกันได้

    ตรวจสอบให้แน่ใจว่า model id **แยกตัวพิมพ์เล็ก-ใหญ่**:

    - เส้นทาง API key: `minimax/MiniMax-M2.7` หรือ `minimax/MiniMax-M2.7-highspeed`
    - เส้นทาง OAuth: `minimax-portal/MiniMax-M2.7` หรือ `minimax-portal/MiniMax-M2.7-highspeed`

    จากนั้นตรวจสอบอีกครั้งด้วย:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือภาพที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="การสร้างเพลง" href="/th/tools/music-generation" icon="music">
    พารามิเตอร์เครื่องมือเพลงที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="MiniMax Search" href="/th/tools/minimax-search" icon="magnifying-glass">
    การกำหนดค่าการค้นหาเว็บผ่าน MiniMax Coding Plan
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
