---
read_when:
    - คุณต้องการโมเดล MiniMax ใน OpenClaw
    - คุณต้องการคำแนะนำในการตั้งค่า MiniMax
summary: ใช้โมเดล MiniMax ใน OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-26T11:40:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b91f8c4c12c993457fb1535bbb2f3401474a3ec432b24189792a20041e756dc
    source_path: providers/minimax.md
    workflow: 15
---

ผู้ให้บริการ MiniMax ของ OpenClaw ใช้ **MiniMax M2.7** เป็นค่าเริ่มต้น

MiniMax ยังมีสิ่งต่อไปนี้ด้วย:

- การสังเคราะห์เสียงแบบรวมผ่าน T2A v2
- ความสามารถในการทำความเข้าใจภาพแบบรวมผ่าน `MiniMax-VL-01`
- การสร้างเพลงแบบรวมผ่าน `music-2.6`
- `web_search` แบบรวมผ่าน MiniMax Coding Plan search API

การแยกผู้ให้บริการ:

| รหัสผู้ให้บริการ | การยืนยันตัวตน | ความสามารถ                                                                                           |
| ---------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `minimax`        | คีย์ API       | ข้อความ, การสร้างภาพ, การสร้างเพลง, การสร้างวิดีโอ, ความสามารถในการทำความเข้าใจภาพ, เสียงพูด, การค้นหาเว็บ |
| `minimax-portal` | OAuth          | ข้อความ, การสร้างภาพ, การสร้างเพลง, การสร้างวิดีโอ, ความสามารถในการทำความเข้าใจภาพ, เสียงพูด              |

## แค็ตตาล็อกในตัว

| โมเดล                    | ประเภท             | คำอธิบาย                                 |
| ------------------------ | ------------------ | ---------------------------------------- |
| `MiniMax-M2.7`           | แชต (ใช้เหตุผล)    | โมเดลใช้เหตุผลแบบโฮสต์เริ่มต้น          |
| `MiniMax-M2.7-highspeed` | แชต (ใช้เหตุผล)    | ระดับการใช้เหตุผล M2.7 ที่เร็วกว่า       |
| `MiniMax-VL-01`          | วิชัน              | โมเดลทำความเข้าใจภาพ                     |
| `image-01`               | การสร้างภาพ        | การสร้างภาพจากข้อความและการแก้ไขภาพต่อภาพ |
| `music-2.6`              | การสร้างเพลง       | โมเดลเพลงเริ่มต้น                        |
| `music-2.5`              | การสร้างเพลง       | ระดับการสร้างเพลงรุ่นก่อนหน้า           |
| `music-2.0`              | การสร้างเพลง       | ระดับการสร้างเพลงแบบดั้งเดิม            |
| `MiniMax-Hailuo-2.3`     | การสร้างวิดีโอ     | เวิร์กโฟลว์ข้อความเป็นวิดีโอและอ้างอิงภาพ |

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **เหมาะสำหรับ:** การตั้งค่าอย่างรวดเร็วด้วย MiniMax Coding Plan ผ่าน OAuth โดยไม่ต้องใช้คีย์ API

    <Tabs>
      <Tab title="ต่างประเทศ">
        <Steps>
          <Step title="เรียกใช้การเริ่มต้นใช้งาน">
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
      <Tab title="จีน">
        <Steps>
          <Step title="เรียกใช้การเริ่มต้นใช้งาน">
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
    การตั้งค่า OAuth ใช้รหัสผู้ให้บริการ `minimax-portal` การอ้างอิงโมเดลจะอยู่ในรูปแบบ `minimax-portal/MiniMax-M2.7`
    </Note>

    <Tip>
    ลิงก์แนะนำสำหรับ MiniMax Coding Plan (ลด 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="คีย์ API">
    **เหมาะสำหรับ:** MiniMax แบบโฮสต์ที่ใช้ API ที่เข้ากันได้กับ Anthropic

    <Tabs>
      <Tab title="ต่างประเทศ">
        <Steps>
          <Step title="เรียกใช้การเริ่มต้นใช้งาน">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            การดำเนินการนี้จะกำหนดค่า `api.minimax.io` เป็น URL ฐาน
          </Step>
          <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="จีน">
        <Steps>
          <Step title="เรียกใช้การเริ่มต้นใช้งาน">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            การดำเนินการนี้จะกำหนดค่า `api.minimaxi.com` เป็น URL ฐาน
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
    บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic นั้น OpenClaw จะปิดการคิดของ MiniMax เป็นค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า `thinking` เองอย่างชัดเจน เอ็นด์พอยต์สตรีมมิงของ MiniMax ส่ง `reasoning_content` ในรูปแบบ delta chunk สไตล์ OpenAI แทนที่จะเป็นบล็อก thinking แบบเนทีฟของ Anthropic ซึ่งอาจทำให้เหตุผลภายในรั่วไปยังผลลัพธ์ที่มองเห็นได้หากปล่อยให้เปิดใช้งานโดยนัย
    </Warning>

    <Note>
    การตั้งค่าด้วยคีย์ API ใช้รหัสผู้ให้บริการ `minimax` การอ้างอิงโมเดลจะอยู่ในรูปแบบ `minimax/MiniMax-M2.7`
    </Note>

  </Tab>
</Tabs>

## กำหนดค่าผ่าน `openclaw configure`

ใช้วิซาร์ดการกำหนดค่าแบบโต้ตอบเพื่อตั้งค่า MiniMax โดยไม่ต้องแก้ไข JSON:

<Steps>
  <Step title="เปิดใช้งานวิซาร์ด">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="เลือก Model/auth">
    เลือก **Model/auth** จากเมนู
  </Step>
  <Step title="เลือกตัวเลือกการยืนยันตัวตนของ MiniMax">
    เลือกหนึ่งในตัวเลือก MiniMax ที่มีให้ใช้งาน:

    | ตัวเลือกการยืนยันตัวตน | คำอธิบาย |
    | --- | --- |
    | `minimax-global-oauth` | OAuth ระหว่างประเทศ (Coding Plan) |
    | `minimax-cn-oauth` | OAuth สำหรับจีน (Coding Plan) |
    | `minimax-global-api` | คีย์ API ระหว่างประเทศ |
    | `minimax-cn-api` | คีย์ API สำหรับจีน |

  </Step>
  <Step title="เลือกโมเดลเริ่มต้นของคุณ">
    เลือกโมเดลเริ่มต้นของคุณเมื่อระบบแสดงคำขอ
  </Step>
</Steps>

## ความสามารถ

### การสร้างภาพ

Plugin MiniMax ลงทะเบียนโมเดล `image-01` สำหรับเครื่องมือ `image_generate` โดยรองรับ:

- **การสร้างภาพจากข้อความ** พร้อมการควบคุมอัตราส่วนภาพ
- **การแก้ไขภาพต่อภาพ** (การอ้างอิงวัตถุ) พร้อมการควบคุมอัตราส่วนภาพ
- **ภาพผลลัพธ์สูงสุด 9 ภาพ** ต่อหนึ่งคำขอ
- **ภาพอ้างอิงสูงสุด 1 ภาพ** ต่อหนึ่งคำขอแก้ไข
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

Plugin ใช้ `MINIMAX_API_KEY` เดียวกันหรือการยืนยันตัวตนแบบ OAuth เดียวกับโมเดลข้อความ หากตั้งค่า MiniMax ไว้แล้ว จะไม่ต้องมีการกำหนดค่าเพิ่มเติม

ทั้ง `minimax` และ `minimax-portal` ลงทะเบียน `image_generate` ด้วยโมเดล
`image-01` เดียวกัน การตั้งค่าด้วยคีย์ API ใช้ `MINIMAX_API_KEY`; การตั้งค่าแบบ OAuth สามารถใช้
เส้นทางการยืนยันตัวตน `minimax-portal` ที่รวมมาให้แทนได้

การสร้างภาพจะใช้เอ็นด์พอยต์ภาพเฉพาะของ MiniMax เสมอ
(``/v1/image_generation``) และจะไม่สนใจ `models.providers.minimax.baseUrl`
เนื่องจากฟิลด์นั้นใช้กำหนดค่า URL ฐานสำหรับแชต/ที่เข้ากันได้กับ Anthropic ให้ตั้งค่า
`MINIMAX_API_HOST=https://api.minimaxi.com` เพื่อส่งการสร้างภาพ
ผ่านเอ็นด์พอยต์ CN; เอ็นด์พอยต์ global เริ่มต้นคือ
`https://api.minimax.io`

เมื่อ onboarding หรือการตั้งค่าด้วยคีย์ API เขียนรายการ `models.providers.minimax`
แบบระบุชัดเจน OpenClaw จะสร้าง `MiniMax-M2.7` และ
`MiniMax-M2.7-highspeed` เป็นโมเดลแชตแบบข้อความล้วน ส่วนการทำความเข้าใจภาพ
จะถูกเปิดเผยแยกต่างหากผ่านผู้ให้บริการสื่อ `MiniMax-VL-01` ที่เป็นเจ้าของโดย Plugin

<Note>
ดู [การสร้างภาพ](/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

### การแปลงข้อความเป็นเสียงพูด

Plugin `minimax` ที่รวมมาให้จะลงทะเบียน MiniMax T2A v2 เป็นผู้ให้บริการเสียงพูดสำหรับ
`messages.tts`

- โมเดล TTS เริ่มต้น: `speech-2.8-hd`
- เสียงเริ่มต้น: `English_expressive_narrator`
- รหัสโมเดลที่รวมมาและรองรับประกอบด้วย `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` และ `speech-01-turbo`
- ลำดับการหา auth คือ `messages.tts.providers.minimax.apiKey` แล้ว
  โปรไฟล์ auth แบบ OAuth/token ของ `minimax-portal` จากนั้นจึงเป็นคีย์สภาพแวดล้อมของ Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`) และสุดท้ายคือ `MINIMAX_API_KEY`
- หากไม่ได้กำหนดค่าโฮสต์ TTS ไว้ OpenClaw จะนำโฮสต์ OAuth ของ
  `minimax-portal` ที่กำหนดค่าไว้กลับมาใช้ซ้ำ และลบส่วนต่อท้าย path แบบ
  ที่เข้ากันได้กับ Anthropic เช่น `/anthropic`
- ไฟล์แนบเสียงแบบปกติจะยังคงเป็น MP3
- เป้าหมายแบบ voice note เช่น Feishu และ Telegram จะถูกแปลงรหัสจาก MiniMax
  MP3 เป็น Opus 48kHz ด้วย `ffmpeg` เนื่องจาก API ไฟล์ของ Feishu/Lark
  ยอมรับเฉพาะ `file_type: "opus"` สำหรับข้อความเสียงแบบเนทีฟ
- MiniMax T2A รองรับ `speed` และ `vol` แบบทศนิยม แต่ `pitch` จะถูกส่งเป็น
  จำนวนเต็ม; OpenClaw จะตัดค่าทศนิยมของ `pitch` ทิ้งก่อนส่งคำขอ API

| การตั้งค่า                               | Env var                | ค่าเริ่มต้น                  | คำอธิบาย                            |
| ---------------------------------------- | ---------------------- | ----------------------------- | ----------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | โฮสต์ API ของ MiniMax T2A           |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | รหัสโมเดล TTS                       |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | รหัสเสียงที่ใช้สำหรับเอาต์พุตเสียงพูด |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | ความเร็วในการเล่น, `0.5..2.0`       |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | ระดับเสียง, `(0, 10]`              |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | การเลื่อนระดับเสียงแบบจำนวนเต็ม, `-12..12` |

### การสร้างเพลง

Plugin MiniMax ที่รวมมาให้จะลงทะเบียนการสร้างเพลงผ่านเครื่องมือ
`music_generate` ที่ใช้ร่วมกันสำหรับทั้ง `minimax` และ `minimax-portal`

- โมเดลเพลงเริ่มต้น: `minimax/music-2.6`
- โมเดลเพลงสำหรับ OAuth: `minimax-portal/music-2.6`
- รองรับ `minimax/music-2.5` และ `minimax/music-2.0` ด้วย
- การควบคุมพร้อมต์: `lyrics`, `instrumental`, `durationSeconds`
- รูปแบบเอาต์พุต: `mp3`
- การรันที่อาศัยเซสชันจะแยกออกผ่านโฟลว์งาน/สถานะที่ใช้ร่วมกัน รวมถึง `action: "status"`

หากต้องการใช้ MiniMax เป็นผู้ให้บริการเพลงเริ่มต้น:
__OC_I18N_900011__
<Note>
ดู [การสร้างเพลง](/tools/music-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

### การสร้างวิดีโอ

Plugin MiniMax ที่รวมมาให้จะลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ
`video_generate` ที่ใช้ร่วมกันสำหรับทั้ง `minimax` และ `minimax-portal`

- โมเดลวิดีโอเริ่มต้น: `minimax/MiniMax-Hailuo-2.3`
- โมเดลวิดีโอสำหรับ OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- โหมด: ข้อความเป็นวิดีโอและโฟลว์อ้างอิงภาพเดี่ยว
- รองรับ `aspectRatio` และ `resolution`

หากต้องการใช้ MiniMax เป็นผู้ให้บริการวิดีโอเริ่มต้น:
__OC_I18N_900012__
<Note>
ดู [การสร้างวิดีโอ](/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

### การทำความเข้าใจภาพ

Plugin MiniMax ลงทะเบียนการทำความเข้าใจภาพแยกออกจากแค็ตตาล็อก
ข้อความ:

| รหัสผู้ให้บริการ | โมเดลภาพเริ่มต้น |
| ---------------- | ----------------- |
| `minimax`        | `MiniMax-VL-01`   |
| `minimax-portal` | `MiniMax-VL-01`   |

นั่นคือเหตุผลที่การกำหนดเส้นทางสื่ออัตโนมัติสามารถใช้ความสามารถ
การทำความเข้าใจภาพของ MiniMax ได้ แม้ว่าแค็ตตาล็อกผู้ให้บริการข้อความที่รวมมาให้
ยังคงแสดงการอ้างอิงแชต M2.7 แบบข้อความล้วน

### การค้นหาเว็บ

Plugin MiniMax ยังลงทะเบียน `web_search` ผ่าน MiniMax Coding Plan
search API ด้วย

- รหัสผู้ให้บริการ: `minimax`
- ผลลัพธ์แบบมีโครงสร้าง: ชื่อเรื่อง, URL, snippets, คำค้นที่เกี่ยวข้อง
- Env var ที่แนะนำ: `MINIMAX_CODE_PLAN_KEY`
- ชื่อแฝง env ที่ยอมรับ: `MINIMAX_CODING_API_KEY`
- Compatibility fallback: `MINIMAX_API_KEY` เมื่อชี้ไปยังโทเค็น coding-plan อยู่แล้ว
- การใช้ภูมิภาคร่วมกัน: `plugins.entries.minimax.config.webSearch.region` จากนั้น `MINIMAX_API_HOST` แล้วจึงเป็น URL ฐานของผู้ให้บริการ MiniMax
- การค้นหาจะยังคงอยู่บนรหัสผู้ให้บริการ `minimax`; การตั้งค่า OAuth CN/global ยังสามารถกำหนดภูมิภาคทางอ้อมผ่าน `models.providers.minimax-portal.baseUrl` ได้

การกำหนดค่าอยู่ภายใต้ `plugins.entries.minimax.config.webSearch.*`

<Note>
ดู [MiniMax Search](/tools/minimax-search) สำหรับการกำหนดค่าและการใช้งานการค้นหาเว็บแบบเต็ม
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวเลือกการกำหนดค่า">
    | ตัวเลือก | คำอธิบาย |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | แนะนำให้ใช้ `https://api.minimax.io/anthropic` (เข้ากันได้กับ Anthropic); `https://api.minimax.io/v1` เป็นตัวเลือกสำหรับ payload ที่เข้ากันได้กับ OpenAI |
    | `models.providers.minimax.api` | แนะนำให้ใช้ `anthropic-messages`; `openai-completions` เป็นตัวเลือกสำหรับ payload ที่เข้ากันได้กับ OpenAI |
    | `models.providers.minimax.apiKey` | คีย์ API ของ MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | กำหนด `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | กำหนด alias ให้โมเดลที่คุณต้องการใน allowlist |
    | `models.mode` | ใช้ `merge` ต่อไปหากคุณต้องการเพิ่ม MiniMax ควบคู่กับโมเดลที่มีมาในตัว |
  </Accordion>

  <Accordion title="ค่าเริ่มต้นของ Thinking">
    บน `api: "anthropic-messages"` OpenClaw จะ inject `thinking: { type: "disabled" }` เว้นแต่จะมีการตั้งค่า thinking ไว้อย่างชัดเจนใน params/config แล้ว

    วิธีนี้ป้องกันไม่ให้เอ็นด์พอยต์สตรีมมิงของ MiniMax ส่ง `reasoning_content` ออกมาในรูปแบบ delta chunk แบบ OpenAI ซึ่งจะทำให้เหตุผลภายในรั่วไปยังผลลัพธ์ที่มองเห็นได้

  </Accordion>

  <Accordion title="โหมดเร็ว">
    `/fast on` หรือ `params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed` บนเส้นทางสตรีมที่เข้ากันได้กับ Anthropic
  </Accordion>

  <Accordion title="ตัวอย่างการทำ Fallback">
    **เหมาะสำหรับ:** ใช้โมเดลเจเนอเรชันล่าสุดที่ดีที่สุดของคุณเป็นตัวหลัก และ fail over ไปยัง MiniMax M2.7 ตัวอย่างด้านล่างใช้ Opus เป็นโมเดลหลักแบบเจาะจง; เปลี่ยนเป็นโมเดลหลักเจเนอเรชันล่าสุดที่คุณต้องการได้
__OC_I18N_900013__
  </Accordion>

  <Accordion title="รายละเอียดการใช้งาน Coding Plan">
    - API การใช้งาน Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (ต้องใช้คีย์ coding plan)
    - OpenClaw จะปรับมาตรฐานการใช้งาน coding-plan ของ MiniMax ให้เป็นรูปแบบการแสดง `% คงเหลือ` เดียวกับที่ใช้กับผู้ให้บริการรายอื่น ฟิลด์ดิบ `usage_percent` / `usagePercent` ของ MiniMax หมายถึงโควต้าที่เหลืออยู่ ไม่ใช่โควต้าที่ใช้ไปแล้ว ดังนั้น OpenClaw จึงกลับค่าฟิลด์เหล่านี้ ฟิลด์แบบนับจำนวนจะมีสิทธิ์เหนือกว่าเมื่อมีอยู่
    - เมื่อ API ส่งคืน `model_remains` OpenClaw จะเลือกใช้รายการของโมเดลแชตเป็นหลัก สร้างป้ายกำกับช่วงเวลาจาก `start_time` / `end_time` เมื่อจำเป็น และรวมชื่อโมเดลที่เลือกไว้ในป้ายกำกับ plan เพื่อให้แยกหน้าต่าง coding-plan ได้ง่ายขึ้น
    - Snapshot การใช้งานจะถือว่า `minimax`, `minimax-cn` และ `minimax-portal` เป็นพื้นผิวโควตา MiniMax เดียวกัน และจะเลือกใช้ MiniMax OAuth ที่จัดเก็บไว้ก่อน แล้วจึง fallback ไปยัง env var คีย์ Coding Plan
  </Accordion>
</AccordionGroup>

## หมายเหตุ

- การอ้างอิงโมเดลเป็นไปตามเส้นทาง auth:
  - การตั้งค่าด้วยคีย์ API: `minimax/<model>`
  - การตั้งค่าด้วย OAuth: `minimax-portal/<model>`
- โมเดลแชตเริ่มต้น: `MiniMax-M2.7`
- โมเดลแชตทางเลือก: `MiniMax-M2.7-highspeed`
- Onboarding และการตั้งค่าด้วยคีย์ API โดยตรงจะเขียนนิยามโมเดลแบบข้อความล้วนสำหรับ M2.7 ทั้งสองรุ่น
- การทำความเข้าใจภาพใช้ผู้ให้บริการสื่อ `MiniMax-VL-01` ที่เป็นเจ้าของโดย Plugin
- อัปเดตราคาค่าใช้จ่ายใน `models.json` หากคุณต้องการติดตามต้นทุนอย่างแม่นยำ
- ใช้ `openclaw models list` เพื่อยืนยันรหัสผู้ให้บริการปัจจุบัน จากนั้นสลับด้วย `openclaw models set minimax/MiniMax-M2.7` หรือ `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
ลิงก์แนะนำสำหรับ MiniMax Coding Plan (ลด 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
ดู [ผู้ให้บริการโมเดล](/concepts/model-providers) สำหรับกฎของผู้ให้บริการ
</Note>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    โดยปกติแล้วหมายความว่า **ยังไม่ได้กำหนดค่าผู้ให้บริการ MiniMax** (ไม่มีรายการผู้ให้บริการที่ตรงกัน และไม่พบโปรไฟล์ auth/env key ของ MiniMax) การแก้ไขสำหรับการตรวจจับนี้อยู่ใน **2026.1.12** แก้ไขได้โดย:

    - อัปเกรดเป็น **2026.1.12** (หรือรันจากซอร์ส `main`) แล้วรีสตาร์ต gateway
    - รัน `openclaw configure` แล้วเลือกตัวเลือก auth ของ **MiniMax** หรือ
    - เพิ่มบล็อก `models.providers.minimax` หรือ `models.providers.minimax-portal` ที่ตรงกันด้วยตนเอง หรือ
    - ตั้งค่า `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` หรือโปรไฟล์ auth ของ MiniMax เพื่อให้สามารถ inject ผู้ให้บริการที่ตรงกันได้

    ตรวจสอบให้แน่ใจว่ารหัสโมเดล **แยกตัวพิมพ์เล็ก-ใหญ่**:

    - เส้นทางคีย์ API: `minimax/MiniMax-M2.7` หรือ `minimax/MiniMax-M2.7-highspeed`
    - เส้นทาง OAuth: `minimax-portal/MiniMax-M2.7` หรือ `minimax-portal/MiniMax-M2.7-highspeed`

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
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างเพลง" href="/th/tools/music-generation" icon="music">
    พารามิเตอร์เครื่องมือเพลงที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="MiniMax Search" href="/th/tools/minimax-search" icon="magnifying-glass">
    การกำหนดค่าการค้นหาเว็บผ่าน MiniMax Coding Plan
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและ FAQ
  </Card>
</CardGroup>
