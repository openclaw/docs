---
read_when:
    - คุณต้องการใช้โมเดล MiniMax ใน OpenClaw
    - คุณต้องมีคำแนะนำการตั้งค่า MiniMax
summary: ใช้โมเดล MiniMax ใน OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-30T10:12:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ef833258692c78f40a160131c2a0d36f84889e5d5196ddadb648485ba8cb04a
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw ตั้งค่าเริ่มต้นให้ผู้ให้บริการ MiniMax เป็น **MiniMax M2.7**

MiniMax ยังมี:

- การสังเคราะห์เสียงพูดแบบรวมมาด้วยผ่าน T2A v2
- การเข้าใจภาพแบบรวมมาด้วยผ่าน `MiniMax-VL-01`
- การสร้างเพลงแบบรวมมาด้วยผ่าน `music-2.6`
- `web_search` แบบรวมมาด้วยผ่าน API ค้นหาของ MiniMax Coding Plan

การแบ่งผู้ให้บริการ:

| ID ผู้ให้บริการ | การยืนยันตัวตน | ความสามารถ |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | คีย์ API | ข้อความ, การสร้างภาพ, การสร้างเพลง, การสร้างวิดีโอ, การเข้าใจภาพ, เสียงพูด, การค้นหาเว็บ |
| `minimax-portal` | OAuth   | ข้อความ, การสร้างภาพ, การสร้างเพลง, การสร้างวิดีโอ, การเข้าใจภาพ, เสียงพูด             |

## แค็ตตาล็อกในตัว

| โมเดล                    | ประเภท             | คำอธิบาย                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | แชต (การใช้เหตุผล) | โมเดลการใช้เหตุผลแบบโฮสต์เริ่มต้น           |
| `MiniMax-M2.7-highspeed` | แชต (การใช้เหตุผล) | ระดับการใช้เหตุผล M2.7 ที่เร็วกว่า               |
| `MiniMax-VL-01`          | วิชัน           | โมเดลการเข้าใจภาพ                |
| `image-01`               | การสร้างภาพ | การแก้ไขข้อความเป็นภาพและภาพเป็นภาพ |
| `music-2.6`              | การสร้างเพลง | โมเดลเพลงเริ่มต้น                      |
| `music-2.5`              | การสร้างเพลง | ระดับการสร้างเพลงก่อนหน้า           |
| `music-2.0`              | การสร้างเพลง | ระดับการสร้างเพลงรุ่นเก่า             |
| `MiniMax-Hailuo-2.3`     | การสร้างวิดีโอ | โฟลว์ข้อความเป็นวิดีโอและการอ้างอิงภาพ  |

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่คุณต้องการแล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **เหมาะที่สุดสำหรับ:** การตั้งค่าอย่างรวดเร็วด้วย MiniMax Coding Plan ผ่าน OAuth โดยไม่ต้องใช้คีย์ API

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            การดำเนินการนี้ยืนยันตัวตนกับ `api.minimax.io`
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

            การดำเนินการนี้ยืนยันตัวตนกับ `api.minimaxi.com`
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
    การตั้งค่า OAuth ใช้ ID ผู้ให้บริการ `minimax-portal` การอ้างอิงโมเดลอยู่ในรูปแบบ `minimax-portal/MiniMax-M2.7`
    </Note>

    <Tip>
    ลิงก์แนะนำสำหรับ MiniMax Coding Plan (ลด 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **เหมาะที่สุดสำหรับ:** MiniMax แบบโฮสต์ที่ใช้ API ที่เข้ากันได้กับ Anthropic

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            การดำเนินการนี้กำหนดค่า `api.minimax.io` เป็น URL ฐาน
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

            การดำเนินการนี้กำหนดค่า `api.minimaxi.com` เป็น URL ฐาน
          </Step>
          <Step title="Verify the model is available">
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
    บนเส้นทางการสตรีมที่เข้ากันได้กับ Anthropic นั้น OpenClaw จะปิดใช้งาน thinking ของ MiniMax เป็นค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า `thinking` ด้วยตนเองอย่างชัดเจน ปลายทางการสตรีมของ MiniMax ส่ง `reasoning_content` ในรูปแบบชังก์เดลตาสไตล์ OpenAI แทนบล็อก thinking แบบดั้งเดิมของ Anthropic ซึ่งอาจทำให้การใช้เหตุผลภายในรั่วไหลไปยังเอาต์พุตที่มองเห็นได้ หากเปิดใช้งานโดยนัยไว้
    </Warning>

    <Note>
    การตั้งค่าคีย์ API ใช้ ID ผู้ให้บริการ `minimax` การอ้างอิงโมเดลอยู่ในรูปแบบ `minimax/MiniMax-M2.7`
    </Note>

  </Tab>
</Tabs>

## กำหนดค่าผ่าน `openclaw configure`

ใช้ตัวช่วยกำหนดค่าแบบโต้ตอบเพื่อตั้งค่า MiniMax โดยไม่ต้องแก้ไข JSON:

<Steps>
  <Step title="เปิดตัวช่วยตั้งค่า">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="เลือกโมเดล/การยืนยันตัวตน">
    เลือก **Model/auth** จากเมนู
  </Step>
  <Step title="เลือกตัวเลือกการยืนยันตัวตนของ MiniMax">
    เลือกหนึ่งในตัวเลือก MiniMax ที่มีให้:

    | ตัวเลือกการยืนยันตัวตน | คำอธิบาย |
    | --- | --- |
    | `minimax-global-oauth` | OAuth ระหว่างประเทศ (Coding Plan) |
    | `minimax-cn-oauth` | OAuth สำหรับจีน (Coding Plan) |
    | `minimax-global-api` | คีย์ API ระหว่างประเทศ |
    | `minimax-cn-api` | คีย์ API สำหรับจีน |

  </Step>
  <Step title="เลือกโมเดลเริ่มต้นของคุณ">
    เลือกโมเดลเริ่มต้นของคุณเมื่อระบบถาม
  </Step>
</Steps>

## ความสามารถ

### การสร้างภาพ

Plugin MiniMax ลงทะเบียนโมเดล `image-01` สำหรับเครื่องมือ `image_generate` โดยรองรับ:

- **การสร้างภาพจากข้อความ** พร้อมการควบคุมอัตราส่วนภาพ
- **การแก้ไขภาพจากภาพ** (ภาพอ้างอิงของวัตถุหลัก) พร้อมการควบคุมอัตราส่วนภาพ
- สูงสุด **9 ภาพผลลัพธ์** ต่อคำขอ
- สูงสุด **1 ภาพอ้างอิง** ต่อคำขอแก้ไข
- อัตราส่วนภาพที่รองรับ: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

หากต้องการใช้ MiniMax สำหรับการสร้างภาพ ให้ตั้งค่าเป็นผู้ให้บริการการสร้างภาพ:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin ใช้ `MINIMAX_API_KEY` เดียวกันหรือการยืนยันตัวตน OAuth เดียวกับโมเดลข้อความ ไม่จำเป็นต้องตั้งค่าเพิ่มเติมหากตั้งค่า MiniMax ไว้แล้ว

ทั้ง `minimax` และ `minimax-portal` ลงทะเบียน `image_generate` ด้วยโมเดล
`image-01` เดียวกัน การตั้งค่าด้วยคีย์ API ใช้ `MINIMAX_API_KEY`; การตั้งค่าด้วย OAuth สามารถใช้
เส้นทางการยืนยันตัวตน `minimax-portal` ที่มาพร้อมระบบแทนได้

การสร้างภาพจะใช้ endpoint เฉพาะสำหรับภาพของ MiniMax เสมอ
(`/v1/image_generation`) และไม่ใช้ `models.providers.minimax.baseUrl`
เนื่องจากฟิลด์นั้นกำหนดค่า URL ฐานสำหรับแชต/Anthropic-compatible ให้ตั้งค่า
`MINIMAX_API_HOST=https://api.minimaxi.com` เพื่อส่งการสร้างภาพ
ผ่าน endpoint สำหรับจีน; endpoint global เริ่มต้นคือ
`https://api.minimax.io`

เมื่อ onboarding หรือการตั้งค่าคีย์ API เขียนรายการ `models.providers.minimax`
อย่างชัดเจน OpenClaw จะสร้าง `MiniMax-M2.7` และ
`MiniMax-M2.7-highspeed` เป็นโมเดลแชตแบบข้อความเท่านั้น ความเข้าใจภาพ
ถูกเปิดเผยแยกต่างหากผ่านผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ

<Note>
ดู [การสร้างภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือกผู้ให้บริการ และพฤติกรรมการสลับไปใช้ตัวสำรอง
</Note>

### การแปลงข้อความเป็นเสียงพูด

Plugin `minimax` ที่มาพร้อมระบบลงทะเบียน MiniMax T2A v2 เป็นผู้ให้บริการเสียงพูดสำหรับ
`messages.tts`

- โมเดล TTS เริ่มต้น: `speech-2.8-hd`
- เสียงเริ่มต้น: `English_expressive_narrator`
- รหัสโมเดลที่มาพร้อมระบบและรองรับ ได้แก่ `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` และ `speech-01-turbo`
- ลำดับการแก้ไขการยืนยันตัวตนคือ `messages.tts.providers.minimax.apiKey` ตามด้วย
  โปรไฟล์การยืนยันตัวตน OAuth/token ของ `minimax-portal` ตามด้วยคีย์สภาพแวดล้อม
  Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`) แล้วจึงเป็น `MINIMAX_API_KEY`
- หากไม่ได้กำหนดค่าโฮสต์ TTS OpenClaw จะใช้โฮสต์ OAuth ของ
  `minimax-portal` ที่กำหนดค่าไว้ซ้ำ และตัดส่วนต่อท้ายพาธแบบ Anthropic-compatible
  เช่น `/anthropic` ออก
- ไฟล์แนบเสียงปกติยังคงเป็น MP3
- เป้าหมายข้อความเสียง เช่น Feishu และ Telegram จะถูกแปลงจาก MP3 ของ MiniMax
  เป็น Opus 48kHz ด้วย `ffmpeg` เนื่องจาก API ไฟล์ของ Feishu/Lark รับเฉพาะ
  `file_type: "opus"` สำหรับข้อความเสียงแบบเนทีฟ
- MiniMax T2A รับค่า `speed` และ `vol` แบบเศษส่วนได้ แต่ `pitch` จะถูกส่งเป็น
  จำนวนเต็ม; OpenClaw จะตัดค่าเศษส่วนของ `pitch` ก่อนคำขอ API

| การตั้งค่า                                  | ตัวแปรสภาพแวดล้อม                | ค่าเริ่มต้น                       | คำอธิบาย                      |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | โฮสต์ API ของ MiniMax T2A            |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | รหัสโมเดล TTS                    |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | รหัสเสียงที่ใช้สำหรับเอาต์พุตเสียงพูด |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | ความเร็วในการเล่น, `0.5..2.0`      |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | ระดับเสียง, `(0, 10]`               |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | การเลื่อนระดับเสียงแบบจำนวนเต็ม, `-12..12`  |

### การสร้างเพลง

Plugin MiniMax ที่มาพร้อมระบบลงทะเบียนการสร้างเพลงผ่านเครื่องมือร่วม
`music_generate` สำหรับทั้ง `minimax` และ `minimax-portal`

- โมเดลเพลงเริ่มต้น: `minimax/music-2.6`
- โมเดลเพลง OAuth: `minimax-portal/music-2.6`
- รองรับ `minimax/music-2.5` และ `minimax/music-2.0` ด้วย
- ตัวควบคุมพรอมป์: `lyrics`, `instrumental`, `durationSeconds`
- รูปแบบผลลัพธ์: `mp3`
- การทำงานที่มี session รองรับจะแยกออกผ่านโฟลว์งาน/สถานะร่วม รวมถึง `action: "status"`

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
ดู [การสร้างเพลง](/th/tools/music-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือกผู้ให้บริการ และพฤติกรรมการสลับไปใช้ตัวสำรอง
</Note>

### การสร้างวิดีโอ

Plugin MiniMax ที่มาพร้อมระบบลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือร่วม
`video_generate` สำหรับทั้ง `minimax` และ `minimax-portal`

- โมเดลวิดีโอเริ่มต้น: `minimax/MiniMax-Hailuo-2.3`
- โมเดลวิดีโอ OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- โหมด: โฟลว์ข้อความเป็นวิดีโอและภาพอ้างอิงภาพเดียว
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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์ของเครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรมการสลับไปใช้ตัวสำรองเมื่อเกิดข้อผิดพลาด
</Note>

### ความเข้าใจรูปภาพ

MiniMax Plugin ลงทะเบียนความเข้าใจรูปภาพแยกจากแค็ตตาล็อกข้อความ:

| ID ผู้ให้บริการ | โมเดลรูปภาพเริ่มต้น |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

นี่คือเหตุผลที่การกำหนดเส้นทางสื่ออัตโนมัติสามารถใช้ความเข้าใจรูปภาพของ MiniMax ได้ แม้เมื่อแค็ตตาล็อกผู้ให้บริการข้อความที่รวมมาด้วยยังแสดงเฉพาะการอ้างอิงแชต M2.7 แบบข้อความเท่านั้น

### การค้นหาเว็บ

MiniMax Plugin ยังลงทะเบียน `web_search` ผ่าน API การค้นหาของ MiniMax Coding Plan ด้วย

- ID ผู้ให้บริการ: `minimax`
- ผลลัพธ์แบบมีโครงสร้าง: ชื่อเรื่อง, URL, ข้อความตัวอย่าง, คำค้นที่เกี่ยวข้อง
- ตัวแปรสภาพแวดล้อมที่แนะนำ: `MINIMAX_CODE_PLAN_KEY`
- นามแฝงตัวแปรสภาพแวดล้อมที่ยอมรับ: `MINIMAX_CODING_API_KEY`
- ตัวสำรองเพื่อความเข้ากันได้: `MINIMAX_API_KEY` เมื่อชี้ไปยังโทเค็น coding-plan อยู่แล้ว
- การใช้ภูมิภาคซ้ำ: `plugins.entries.minimax.config.webSearch.region` จากนั้น `MINIMAX_API_HOST` จากนั้น URL ฐานของผู้ให้บริการ MiniMax
- การค้นหายังคงอยู่บน ID ผู้ให้บริการ `minimax`; การตั้งค่า OAuth CN/global ยังสามารถกำหนดภูมิภาคทางอ้อมผ่าน `models.providers.minimax-portal.baseUrl` ได้

คอนฟิกอยู่ภายใต้ `plugins.entries.minimax.config.webSearch.*`

<Note>
ดู [การค้นหา MiniMax](/th/tools/minimax-search) สำหรับการกำหนดค่าและการใช้งานการค้นหาเว็บแบบครบถ้วน
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Configuration options">
    | ตัวเลือก | คำอธิบาย |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | แนะนำให้ใช้ `https://api.minimax.io/anthropic` (เข้ากันได้กับ Anthropic); `https://api.minimax.io/v1` เป็นตัวเลือกสำหรับ payload ที่เข้ากันได้กับ OpenAI |
    | `models.providers.minimax.api` | แนะนำให้ใช้ `anthropic-messages`; `openai-completions` เป็นตัวเลือกสำหรับ payload ที่เข้ากันได้กับ OpenAI |
    | `models.providers.minimax.apiKey` | คีย์ API ของ MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | กำหนด `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | สร้างนามแฝงให้โมเดลที่คุณต้องการในรายการอนุญาต |
    | `models.mode` | คง `merge` ไว้ถ้าคุณต้องการเพิ่ม MiniMax ควบคู่กับรายการที่มีมาให้ |
  </Accordion>

  <Accordion title="Thinking defaults">
    เมื่อใช้ `api: "anthropic-messages"` OpenClaw จะแทรก `thinking: { type: "disabled" }` เว้นแต่จะตั้งค่า thinking ไว้อย่างชัดเจนแล้วใน params/config

    สิ่งนี้ป้องกันไม่ให้ endpoint สตรีมมิงของ MiniMax ปล่อย `reasoning_content` ในชิ้นส่วน delta แบบ OpenAI ซึ่งจะทำให้เหตุผลภายในรั่วไหลไปยังผลลัพธ์ที่มองเห็นได้

  </Accordion>

  <Accordion title="Fast mode">
    `/fast on` หรือ `params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed` บนเส้นทางสตรีมที่เข้ากันได้กับ Anthropic
  </Accordion>

  <Accordion title="Fallback example">
    **เหมาะที่สุดสำหรับ:** ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดของคุณเป็นตัวหลัก และสลับไปใช้ MiniMax M2.7 เมื่อเกิดข้อผิดพลาด ตัวอย่างด้านล่างใช้ Opus เป็นตัวหลักที่ชัดเจน; เปลี่ยนเป็นโมเดลหลักรุ่นล่าสุดที่คุณต้องการได้

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
    - API การใช้งาน Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (ต้องใช้คีย์ coding plan)
    - OpenClaw ปรับรูปแบบการใช้งาน coding-plan ของ MiniMax ให้เป็นการแสดงผล `% ที่เหลือ` แบบเดียวกับที่ผู้ให้บริการรายอื่นใช้ ฟิลด์ดิบ `usage_percent` / `usagePercent` ของ MiniMax คือโควตาที่เหลือ ไม่ใช่โควตาที่ใช้ไป ดังนั้น OpenClaw จึงกลับค่า ฟิลด์แบบนับจำนวนจะมีลำดับความสำคัญเมื่อมีอยู่
    - เมื่อ API ส่งคืน `model_remains` OpenClaw จะเลือกเอนทรีของโมเดลแชตก่อน สร้างป้ายกำกับหน้าต่างจาก `start_time` / `end_time` เมื่อจำเป็น และรวมชื่อโมเดลที่เลือกไว้ในป้ายกำกับแผน เพื่อให้แยกแยะหน้าต่าง coding-plan ได้ง่ายขึ้น
    - สแนปช็อตการใช้งานถือว่า `minimax`, `minimax-cn` และ `minimax-portal` เป็นพื้นผิวโควตา MiniMax เดียวกัน และเลือกใช้ MiniMax OAuth ที่จัดเก็บไว้ก่อนจะย้อนกลับไปใช้ตัวแปรสภาพแวดล้อมคีย์ Coding Plan

  </Accordion>
</AccordionGroup>

## หมายเหตุ

- การอ้างอิงโมเดลเป็นไปตามเส้นทางการยืนยันตัวตน:
  - การตั้งค่าด้วยคีย์ API: `minimax/<model>`
  - การตั้งค่า OAuth: `minimax-portal/<model>`
- โมเดลแชตเริ่มต้น: `MiniMax-M2.7`
- โมเดลแชตทางเลือก: `MiniMax-M2.7-highspeed`
- การเริ่มต้นใช้งานและการตั้งค่าคีย์ API โดยตรงจะเขียนคำจำกัดความโมเดลแบบข้อความเท่านั้นสำหรับ M2.7 ทั้งสองแบบ
- ความเข้าใจรูปภาพใช้ผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
- อัปเดตราคาค่าใช้จ่ายใน `models.json` หากคุณต้องการติดตามต้นทุนอย่างแม่นยำ
- ใช้ `openclaw models list` เพื่อยืนยัน ID ผู้ให้บริการปัจจุบัน จากนั้นสลับด้วย `openclaw models set minimax/MiniMax-M2.7` หรือ `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
ลิงก์แนะนำสำหรับ MiniMax Coding Plan (ลด 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers) สำหรับกฎของผู้ให้บริการ
</Note>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    โดยปกติหมายความว่า **ยังไม่ได้กำหนดค่าผู้ให้บริการ MiniMax** (ไม่พบเอนทรีผู้ให้บริการที่ตรงกัน และไม่พบโปรไฟล์ยืนยันตัวตน/คีย์สภาพแวดล้อมของ MiniMax) การแก้ไขการตรวจจับนี้อยู่ใน **2026.1.12** แก้ไขโดย:

    - อัปเกรดเป็น **2026.1.12** (หรือรันจากซอร์ส `main`) จากนั้นรีสตาร์ท Gateway
    - รัน `openclaw configure` และเลือกตัวเลือกการยืนยันตัวตน **MiniMax** หรือ
    - เพิ่มบล็อก `models.providers.minimax` หรือ `models.providers.minimax-portal` ที่ตรงกันด้วยตนเอง หรือ
    - ตั้งค่า `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` หรือโปรไฟล์ยืนยันตัวตน MiniMax เพื่อให้สามารถแทรกผู้ให้บริการที่ตรงกันได้

    ตรวจสอบให้แน่ใจว่า ID โมเดล **คำนึงถึงตัวพิมพ์เล็ก-ใหญ่**:

    - เส้นทางคีย์ API: `minimax/MiniMax-M2.7` หรือ `minimax/MiniMax-M2.7-highspeed`
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
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ตัวสำรองเมื่อเกิดข้อผิดพลาด
  </Card>
  <Card title="Image generation" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือรูปภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Music generation" href="/th/tools/music-generation" icon="music">
    พารามิเตอร์เครื่องมือเพลงที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Video generation" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="MiniMax Search" href="/th/tools/minimax-search" icon="magnifying-glass">
    การกำหนดค่าการค้นหาเว็บผ่าน MiniMax Coding Plan
  </Card>
  <Card title="Troubleshooting" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
