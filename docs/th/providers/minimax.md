---
read_when:
    - คุณต้องการใช้โมเดล MiniMax ใน OpenClaw
    - คุณต้องการคำแนะนำในการตั้งค่า MiniMax
summary: ใช้โมเดล MiniMax ใน OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-07-12T16:39:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  Plugin `minimax` ที่มาพร้อมระบบจะลงทะเบียนผู้ให้บริการสองรายและความสามารถเจ็ดรายการ ได้แก่ แชต การสร้างรูปภาพ การสร้างเพลง การสร้างวิดีโอ การทำความเข้าใจรูปภาพ เสียงพูด (T2A v2) และการค้นหาเว็บ

  | รหัสผู้ให้บริการ | การยืนยันตัวตน | ความสามารถ                                                                                          |
  | ---------------- | --------------- | --------------------------------------------------------------------------------------------------- |
  | `minimax`        | คีย์ API        | ข้อความ การสร้างรูปภาพ การสร้างเพลง การสร้างวิดีโอ การทำความเข้าใจรูปภาพ เสียงพูด การค้นหาเว็บ      |
  | `minimax-portal` | OAuth           | ข้อความ การสร้างรูปภาพ การสร้างเพลง การสร้างวิดีโอ การทำความเข้าใจรูปภาพ เสียงพูด                   |

  <Tip>
  ลิงก์แนะนำสำหรับ MiniMax Coding Plan (ลด 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## แค็ตตาล็อกในตัว

  | โมเดล                    | ประเภท                    | คำอธิบาย                                         |
  | ------------------------ | ------------------------- | ------------------------------------------------ |
  | `MiniMax-M3`             | แชต (การให้เหตุผล)        | โมเดลการให้เหตุผลแบบโฮสต์เริ่มต้น                |
  | `MiniMax-M2.7`           | แชต (การให้เหตุผล)        | โมเดลการให้เหตุผลแบบโฮสต์รุ่นก่อนหน้า            |
  | `MiniMax-M2.7-highspeed` | แชต (การให้เหตุผล)        | ระดับการให้เหตุผล M2.7 ที่เร็วขึ้น                |
  | `MiniMax-VL-01`          | การมองเห็น                | โมเดลทำความเข้าใจรูปภาพ                           |
  | `image-01`               | การสร้างรูปภาพ            | การสร้างภาพจากข้อความและการแก้ไขภาพเป็นภาพ       |
  | `music-2.6`              | การสร้างเพลง              | โมเดลเพลงเริ่มต้น                                 |
  | `MiniMax-Hailuo-2.3`     | การสร้างวิดีโอ            | ขั้นตอนการสร้างวิดีโอจากข้อความและจากรูปภาพ       |

  การอ้างอิงโมเดลเป็นไปตามเส้นทางการยืนยันตัวตน: `minimax/<model>` สำหรับการตั้งค่าด้วยคีย์ API และ `minimax-portal/<model>` สำหรับการตั้งค่าด้วย OAuth

  ## เริ่มต้นใช้งาน

  <Tabs>
  <Tab title="OAuth (Coding Plan)">
    **เหมาะที่สุดสำหรับ:** การตั้งค่า MiniMax Coding Plan อย่างรวดเร็วผ่าน OAuth โดยไม่ต้องใช้คีย์ API

    <Tabs>
      <Tab title="นานาชาติ">
        <Steps>
          <Step title="เรียกใช้การเริ่มต้นตั้งค่า">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            URL ฐานของผู้ให้บริการที่ได้: `api.minimax.io`
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
          <Step title="เรียกใช้การเริ่มต้นตั้งค่า">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            URL ฐานของผู้ให้บริการที่ได้: `api.minimaxi.com`
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
    การตั้งค่าด้วย OAuth ใช้รหัสผู้ให้บริการ `minimax-portal` การอ้างอิงโมเดลอยู่ในรูปแบบ `minimax-portal/MiniMax-M3`
    </Note>

  </Tab>

  <Tab title="คีย์ API">
    **เหมาะที่สุดสำหรับ:** MiniMax แบบโฮสต์ที่ใช้ API ซึ่งเข้ากันได้กับ Anthropic

    <Tabs>
      <Tab title="นานาชาติ">
        <Steps>
          <Step title="เรียกใช้การเริ่มต้นตั้งค่า">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            การดำเนินการนี้กำหนดค่า `api.minimax.io` เป็น URL ฐาน
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
          <Step title="เรียกใช้การเริ่มต้นตั้งค่า">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            การดำเนินการนี้กำหนดค่า `api.minimaxi.com` เป็น URL ฐาน
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
    ปลายทางการสตรีมที่เข้ากันได้กับ Anthropic ของ MiniMax-M2.x จะส่ง `reasoning_content` ในส่วนย่อยแบบเดลตาตามรูปแบบ OpenAI แทนบล็อกการคิดแบบดั้งเดิมของ Anthropic ซึ่งทำให้เหตุผลภายในรั่วไหลไปยังผลลัพธ์ที่มองเห็นได้ หากปล่อยให้การคิดเปิดใช้งานโดยปริยาย OpenClaw จะปิดการคิดของ M2.x เป็นค่าเริ่มต้น เว้นแต่คุณจะกำหนด `thinking` ด้วยตนเองอย่างชัดเจน MiniMax-M3 (รวมถึง M3.x ที่เข้ากันได้ในอนาคต) ได้รับการยกเว้น: M3 ส่งบล็อกการคิดของ Anthropic อย่างถูกต้องและต้องเปิดใช้การคิดเพื่อสร้างเนื้อหาที่มองเห็นได้ ดังนั้น OpenClaw จึงคง M3 ไว้ในเส้นทางการคิดแบบปรับตัวของผู้ให้บริการ โปรดดูส่วนค่าเริ่มต้นของการคิดภายใต้การกำหนดค่าขั้นสูงด้านล่าง
    </Warning>

    <Note>
    การตั้งค่าด้วยคีย์ API ใช้รหัสผู้ให้บริการ `minimax` การอ้างอิงโมเดลอยู่ในรูปแบบ `minimax/MiniMax-M3`
    </Note>

  </Tab>
</Tabs>

## กำหนดค่าผ่าน `openclaw configure`

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
    | ตัวเลือกการยืนยันตัวตน | คำอธิบาย                          |
    | ----------------------- | --------------------------------- |
    | `minimax-global-oauth` | OAuth ระหว่างประเทศ (Coding Plan) |
    | `minimax-cn-oauth`     | OAuth จีน (Coding Plan)            |
    | `minimax-global-api`   | คีย์ API ระหว่างประเทศ             |
    | `minimax-cn-api`       | คีย์ API จีน                       |
  </Step>
  <Step title="เลือกโมเดลเริ่มต้น">
    เลือกโมเดลเริ่มต้นของคุณเมื่อระบบแจ้ง
  </Step>
</Steps>

## ความสามารถ

### การสร้างภาพ

Plugin MiniMax ลงทะเบียนโมเดล `image-01` สำหรับเครื่องมือ `image_generate` ทั้งบน `minimax` และ `minimax-portal` โดยใช้ `MINIMAX_API_KEY` หรือการยืนยันตัวตน OAuth เดียวกับโมเดลข้อความ

- การสร้างภาพจากข้อความและการแก้ไขภาพเป็นภาพ (การอ้างอิงวัตถุ) โดยทั้งสองแบบควบคุมอัตราส่วนภาพได้
- ภาพผลลัพธ์สูงสุด 9 ภาพต่อคำขอ และภาพอ้างอิง 1 ภาพต่อคำขอแก้ไข
- อัตราส่วนภาพที่รองรับ: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

การสร้างภาพใช้ปลายทางเฉพาะสำหรับภาพของ MiniMax (`/v1/image_generation`) เสมอ และไม่สนใจ `models.providers.minimax.baseUrl` เนื่องจากฟิลด์ดังกล่าวใช้กำหนดค่า URL ฐานที่เข้ากันได้กับแชต/Anthropic แทน ตั้งค่า `MINIMAX_API_HOST=https://api.minimaxi.com` เพื่อกำหนดเส้นทางการสร้างภาพผ่านปลายทางจีน โดยปลายทางสากลเริ่มต้นคือ `https://api.minimax.io`

<Note>
ดู[การสร้างภาพ](/th/tools/image-generation)สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
</Note>

### การแปลงข้อความเป็นเสียงพูด

Plugin `minimax` ที่รวมมาให้ลงทะเบียน MiniMax T2A v2 เป็นผู้ให้บริการเสียงพูดสำหรับ `messages.tts`

- โมเดล TTS เริ่มต้น: `speech-2.8-hd`
- เสียงเริ่มต้น: `English_expressive_narrator`
- รหัสโมเดลที่รวมมาให้: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`, `speech-01-240228`
- ลำดับการพิจารณาการยืนยันตัวตน: `messages.tts.providers.minimax.apiKey` ตามด้วยโปรไฟล์การยืนยันตัวตน OAuth/โทเค็นของ `minimax-portal` ตามด้วยคีย์สภาพแวดล้อมของ Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`) และสุดท้าย `MINIMAX_API_KEY`
- หากไม่ได้กำหนดค่าโฮสต์ TTS ไว้ OpenClaw จะใช้โฮสต์ OAuth ของ `minimax-portal` ที่กำหนดค่าไว้ และตัดส่วนต่อท้ายพาธที่เข้ากันได้กับ Anthropic เช่น `/anthropic`
- ไฟล์เสียงแนบทั่วไปยังคงเป็น MP3 ส่วนปลายทางข้อความเสียง (Feishu, Telegram และช่องทางอื่นที่ขอไฟล์แนบซึ่งเข้ากันได้กับข้อความเสียง) จะถูกแปลงจาก MP3 ของ MiniMax เป็น Opus 48kHz ด้วย `ffmpeg` เนื่องจากตัวอย่างเช่น API ไฟล์ของ Feishu/Lark ยอมรับเฉพาะ `file_type: "opus"` สำหรับข้อความเสียงแบบเนทีฟ
- MiniMax T2A ยอมรับค่า `speed` และ `vol` แบบทศนิยม แต่ส่ง `pitch` เป็นจำนวนเต็ม โดย OpenClaw จะตัดส่วนทศนิยมของค่า `pitch` ก่อนส่งคำขอ API

| การตั้งค่า                                | ตัวแปรสภาพแวดล้อม      | ค่าเริ่มต้น                    | คำอธิบาย                              |
| ---------------------------------------- | ---------------------- | ----------------------------- | ------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | โฮสต์ API ของ MiniMax T2A             |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | รหัสโมเดล TTS                         |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | รหัสเสียงที่ใช้สำหรับผลลัพธ์เสียงพูด |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | ความเร็วการเล่น `0.5..2.0`            |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | ระดับเสียง `(0, 10]`                  |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | การเลื่อนระดับเสียงแบบจำนวนเต็ม `-12..12` |

### การสร้างเพลง

Plugin MiniMax ที่รวมมาให้ลงทะเบียนการสร้างเพลงผ่านเครื่องมือ `music_generate` ที่ใช้ร่วมกันสำหรับทั้ง `minimax` และ `minimax-portal`

- โมเดลเพลงเริ่มต้น: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- รองรับ `music-2.6-free`, `music-cover` และ `music-cover-free` ด้วย
- การควบคุมพรอมต์: `lyrics`, `instrumental`
- รูปแบบผลลัพธ์: `mp3`
- การเรียกใช้ที่มีเซสชันรองรับจะแยกไปทำงานผ่านโฟลว์งาน/สถานะที่ใช้ร่วมกัน รวมถึง `action: "status"`

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
ดู[การสร้างเพลง](/th/tools/music-generation)สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
</Note>

### การสร้างวิดีโอ

Plugin MiniMax ที่รวมมาให้ลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ `video_generate` ที่ใช้ร่วมกันสำหรับทั้ง `minimax` และ `minimax-portal`

- โมเดลวิดีโอเริ่มต้น: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- รองรับ `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live` และ `I2V-01` ด้วย
- โหมด: การสร้างวิดีโอจากข้อความและโฟลว์การอ้างอิงด้วยภาพเดียว
- รองรับ `resolution` (`768P` หรือ `1080P` บนโมเดล Hailuo 2.3/02) แต่ไม่รองรับและจะไม่สนใจ `aspectRatio`

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
ดูพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรองได้ที่ [การสร้างวิดีโอ](/th/tools/video-generation)
</Note>

### การทำความเข้าใจรูปภาพ

Plugin MiniMax ลงทะเบียนความสามารถในการทำความเข้าใจรูปภาพแยกจากแค็ตตาล็อกข้อความ:

| รหัสผู้ให้บริการ | โมเดลรูปภาพเริ่มต้น | การแยกข้อความจาก PDF |
| ---------------- | ------------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`      |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`      |

ด้วยเหตุนี้ การกำหนดเส้นทางสื่ออัตโนมัติจึงสามารถใช้ความสามารถในการทำความเข้าใจรูปภาพของ MiniMax ได้ แม้ว่าแค็ตตาล็อกผู้ให้บริการข้อความที่รวมมากับระบบจะมีการอ้างอิงแชต M3 ที่รองรับรูปภาพอยู่ด้วย การทำความเข้าใจ PDF ใช้ `MiniMax-M2.7` สำหรับการแยกข้อความเท่านั้น MiniMax ไม่ได้ลงทะเบียนเส้นทางการแปลง PDF เป็นรูปภาพ

### การค้นหาเว็บ

Plugin MiniMax ยังลงทะเบียน `web_search` ผ่าน API การค้นหาของ MiniMax Token Plan (`/v1/coding_plan/search`) ด้วย

- รหัสผู้ให้บริการ: `minimax`
- ผลลัพธ์แบบมีโครงสร้าง: ชื่อเรื่อง, URL, ข้อความตัวอย่าง และคำค้นหาที่เกี่ยวข้อง
- ตัวแปรสภาพแวดล้อมที่แนะนำ: `MINIMAX_CODE_PLAN_KEY`
- นามแฝงตัวแปรสภาพแวดล้อมที่รองรับ: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- ระบบสำรองเพื่อความเข้ากันได้: `MINIMAX_API_KEY` เมื่อค่าดังกล่าวชี้ไปยังข้อมูลประจำตัวของ Token Plan อยู่แล้ว
- การใช้ภูมิภาคร่วมกัน: `plugins.entries.minimax.config.webSearch.region` จากนั้น `MINIMAX_API_HOST` แล้วจึง URL ฐานของผู้ให้บริการ MiniMax
- การค้นหายังคงใช้รหัสผู้ให้บริการ `minimax` การตั้งค่า OAuth สำหรับจีน/ทั่วโลกสามารถกำหนดภูมิภาคทางอ้อมผ่าน `models.providers.minimax-portal.baseUrl` และสามารถให้การยืนยันตัวตนแบบ Bearer ผ่าน `MINIMAX_OAUTH_TOKEN`

การกำหนดค่าอยู่ภายใต้ `plugins.entries.minimax.config.webSearch.*`

<Note>
ดูการกำหนดค่าและการใช้งานการค้นหาเว็บอย่างครบถ้วนได้ที่ [การค้นหาด้วย MiniMax](/th/tools/minimax-search)
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวเลือกการกำหนดค่า">
    | ตัวเลือก | คำอธิบาย |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | แนะนำให้ใช้ `https://api.minimax.io/anthropic` (เข้ากันได้กับ Anthropic) ส่วน `https://api.minimax.io/v1` เป็นทางเลือกสำหรับเพย์โหลดที่เข้ากันได้กับ OpenAI |
    | `models.providers.minimax.api` | แนะนำให้ใช้ `anthropic-messages` ส่วน `openai-completions` เป็นทางเลือกสำหรับเพย์โหลดที่เข้ากันได้กับ OpenAI |
    | `models.providers.minimax.apiKey` | คีย์ API ของ MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | กำหนด `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | กำหนดนามแฝงให้โมเดลที่ต้องการเพิ่มลงในรายการอนุญาต |
    | `models.mode` | ใช้ค่า `merge` ต่อไป หากต้องการเพิ่ม MiniMax ควบคู่กับโมเดลที่มีมาให้ในระบบ |
  </Accordion>

  <Accordion title="ค่าเริ่มต้นของการคิด">
    เมื่อใช้ `api: "anthropic-messages"` OpenClaw จะแทรก `thinking: { type: "disabled" }` สำหรับโมเดล MiniMax M2.x เว้นแต่แรปเปอร์ก่อนหน้าจะตั้งค่าฟิลด์ `thinking` ในเพย์โหลดไว้แล้ว การทำเช่นนี้ป้องกันไม่ให้ปลายทางสตรีมของ M2.x ส่ง `reasoning_content` ออกมาในส่วนข้อมูลเดลตารูปแบบ OpenAI ซึ่งจะทำให้เหตุผลภายในรั่วไหลไปยังผลลัพธ์ที่ผู้ใช้มองเห็น

    MiniMax-M3 (รวมถึง M3.x) ได้รับการยกเว้น เนื่องจาก M3 จะส่งอาร์เรย์ `content` ว่างพร้อม `stop_reason: "end_turn"` เมื่อปิดการคิด ดังนั้น OpenClaw จึงลบค่าเริ่มต้นแบบปิดโดยนัยสำหรับ M3 และเมื่อมีการตั้งค่าระดับการคิด จะบังคับใช้ `thinking: { type: "adaptive" }` แทน

    ระดับการคิดที่ใช้ได้สำหรับแต่ละตระกูลโมเดล:

    | ตระกูลโมเดล | ระดับ | ค่าเริ่มต้น |
    | -------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`   | `off`, `adaptive`                        | `adaptive` |
    | `MiniMax-M2.x` | `off`, `minimal`, `low`, `medium`, `high` | `off`      |

  </Accordion>

  <Accordion title="โหมดเร็ว">
    `/fast on` หรือ `params.fastMode: true` จะเปลี่ยน `MiniMax-M2.7` เป็น `MiniMax-M2.7-highspeed` บนเส้นทางสตรีมที่เข้ากันได้กับ Anthropic (`api: "anthropic-messages"`, ผู้ให้บริการ `minimax` หรือ `minimax-portal`)
  </Accordion>

  <Accordion title="ตัวอย่างระบบสำรอง">
    **เหมาะที่สุดสำหรับ:** ใช้โมเดลรุ่นล่าสุดที่ทรงประสิทธิภาพที่สุดเป็นโมเดลหลัก และสลับไปใช้ MiniMax M2.7 เมื่อโมเดลหลักใช้งานไม่ได้ ตัวอย่างด้านล่างใช้ Opus เป็นโมเดลหลักที่ระบุอย่างชัดเจน คุณสามารถเปลี่ยนเป็นโมเดลหลักรุ่นล่าสุดที่ต้องการได้

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
    - API การใช้งาน Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` หรือ `https://api.minimax.io/v1/token_plan/remains` (ต้องใช้คีย์ Coding Plan)
    - การสำรวจการใช้งานเป็นระยะจะหาโฮสต์จาก `models.providers.minimax-portal.baseUrl` หรือ `models.providers.minimax.baseUrl` เมื่อมีการกำหนดค่าไว้ ดังนั้นการตั้งค่าทั่วโลกที่ใช้ `https://api.minimax.io/anthropic` จะสำรวจ `api.minimax.io` หาก URL ฐานหายไปหรือมีรูปแบบไม่ถูกต้อง ระบบจะยังคงใช้ระบบสำรองสำหรับจีนเพื่อรักษาความเข้ากันได้
    - OpenClaw ปรับข้อมูลการใช้งาน Coding Plan ของ MiniMax ให้อยู่ในรูปแบบการแสดง `% คงเหลือ` แบบเดียวกับผู้ให้บริการรายอื่น ฟิลด์ดิบ `usage_percent` / `usagePercent` ของ MiniMax หมายถึงโควตาที่เหลือ ไม่ใช่โควตาที่ใช้ไป ดังนั้น OpenClaw จึงกลับค่าดังกล่าว ฟิลด์แบบนับจำนวนจะมีลำดับความสำคัญสูงกว่าเมื่อมีอยู่
    - เมื่อ API ส่งคืน `model_remains` OpenClaw จะเลือกข้อมูลของโมเดลแชตก่อน สร้างป้ายกำกับช่วงเวลาจาก `start_time` / `end_time` เมื่อจำเป็น และใส่ชื่อโมเดลที่เลือกไว้ในป้ายกำกับแผน เพื่อให้แยกแยะช่วงเวลาของ Coding Plan ได้ง่ายขึ้น
    - สแนปช็อตการใช้งานถือว่า `minimax`, `minimax-cn`, `minimax-portal` และ `minimax-portal-cn` เป็นพื้นผิวโควตา MiniMax เดียวกัน และจะเลือกใช้ OAuth ของ MiniMax ที่จัดเก็บไว้ก่อน หากไม่มีจึงใช้ตัวแปรสภาพแวดล้อมของคีย์ Coding Plan

  </Accordion>
</AccordionGroup>

## หมายเหตุ

- โมเดลแชตเริ่มต้น: `MiniMax-M3` โมเดลแชตทางเลือก: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- ขั้นตอนการเริ่มต้นใช้งานและการตั้งค่าคีย์ API โดยตรงจะเขียนคำจำกัดความโมเดลสำหรับ M3 และ M2.7 ทั้งสองรุ่น
- การทำความเข้าใจรูปภาพใช้ผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
- อัปเดตค่าราคาใน `models.json` หากต้องการติดตามค่าใช้จ่ายอย่างแม่นยำ
- ใช้ `openclaw models list` เพื่อยืนยันรหัสผู้ให้บริการปัจจุบัน จากนั้นสลับด้วย `openclaw models set minimax/MiniMax-M3` หรือ `openclaw models set minimax-portal/MiniMax-M3`

<Note>
ดูกฎของผู้ให้บริการได้ที่ [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
</Note>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title='"โมเดลที่ไม่รู้จัก: minimax/MiniMax-M3"'>
    โดยทั่วไปหมายความว่า **ยังไม่ได้กำหนดค่าผู้ให้บริการ MiniMax** (ไม่พบรายการผู้ให้บริการที่ตรงกัน และไม่พบโปรไฟล์การยืนยันตัวตนหรือคีย์ตัวแปรสภาพแวดล้อมของ MiniMax) แก้ไขโดย:

    - เรียกใช้ `openclaw configure` แล้วเลือกตัวเลือกการยืนยันตัวตนของ **MiniMax** หรือ
    - เพิ่มบล็อก `models.providers.minimax` หรือ `models.providers.minimax-portal` ที่ตรงกันด้วยตนเอง หรือ
    - ตั้งค่า `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` หรือโปรไฟล์การยืนยันตัวตนของ MiniMax เพื่อให้ระบบสามารถแทรกผู้ให้บริการที่ตรงกันได้

    ตรวจสอบให้แน่ใจว่ารหัสโมเดล **คำนึงถึงตัวพิมพ์เล็กและตัวพิมพ์ใหญ่**:

    - เส้นทางคีย์ API: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` หรือ `minimax/MiniMax-M2.7-highspeed`
    - เส้นทาง OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` หรือ `minimax-portal/MiniMax-M2.7-highspeed`

    จากนั้นตรวจสอบอีกครั้งด้วย:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="การสร้างรูปภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือรูปภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างเพลง" href="/th/tools/music-generation" icon="music">
    พารามิเตอร์เครื่องมือเพลงที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การค้นหาด้วย MiniMax" href="/th/tools/minimax-search" icon="magnifying-glass">
    การกำหนดค่าการค้นหาเว็บผ่าน MiniMax Token Plan
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
