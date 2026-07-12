---
read_when:
    - คุณต้องการใช้โมเดล Google Gemini กับ OpenClaw
    - คุณต้องใช้คีย์ API หรือขั้นตอนการยืนยันตัวตนด้วย OAuth
summary: การตั้งค่า Google Gemini (คีย์ API + OAuth, การสร้างภาพ, การทำความเข้าใจสื่อ, TTS, การค้นหาเว็บ)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-12T16:39:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 423f9b048a705815e886690fa13f5b02f7e67707195b7b461f6b4765528a4756
    source_path: providers/google.md
    workflow: 16
---

Plugin Google ให้การเข้าถึงโมเดล Gemini ผ่าน Google AI Studio รวมถึงการสร้างรูปภาพ การทำความเข้าใจสื่อ (รูปภาพ/เสียง/วิดีโอ) การแปลงข้อความเป็นเสียงพูด และการค้นหาเว็บผ่าน Gemini Grounding

- ผู้ให้บริการ: `google`
- การยืนยันตัวตน: `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- API: Google Gemini API
- ตัวเลือกรันไทม์: `agentRuntime.id: "google-gemini-cli"` ใช้ OAuth ของ Gemini CLI ซ้ำ โดยยังคงการอ้างอิงโมเดลในรูปแบบมาตรฐานเป็น `google/*`

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่ต้องการและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="คีย์ API">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง Gemini API แบบมาตรฐานผ่าน Google AI Studio

    <Steps>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        หรือส่งคีย์โดยตรง:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    รองรับทั้ง `GEMINI_API_KEY` และ `GOOGLE_API_KEY` ให้ใช้ตัวที่คุณกำหนดค่าไว้อยู่แล้ว
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **เหมาะที่สุดสำหรับ:** การใช้ข้อมูลเข้าสู่ระบบ Gemini CLI ที่มีอยู่ผ่าน PKCE OAuth ซ้ำ แทนการใช้คีย์ API แยกต่างหาก

    <Warning>
    ผู้ให้บริการ `google-gemini-cli` เป็นการผสานการทำงานที่ไม่เป็นทางการ ผู้ใช้บางราย
    รายงานว่าบัญชีถูกจำกัดเมื่อใช้ OAuth ด้วยวิธีนี้ โปรดใช้โดยยอมรับความเสี่ยงเอง
    </Warning>

    <Steps>
      <Step title="ติดตั้ง Gemini CLI">
        คำสั่ง `gemini` ในเครื่องต้องพร้อมใช้งานบน `PATH`

        ```bash
        # Homebrew
        brew install gemini-cli

        # หรือ npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw รองรับทั้งการติดตั้งผ่าน Homebrew และการติดตั้ง npm แบบส่วนกลาง รวมถึง
        รูปแบบตำแหน่งติดตั้งทั่วไปของ Windows/npm
      </Step>
      <Step title="เข้าสู่ระบบผ่าน OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - โมเดลเริ่มต้น: `google/gemini-3.1-pro-preview`
    - รันไทม์: `google-gemini-cli`
    - นามแฝง: `gemini-cli`

    รหัสโมเดล Gemini API ของ Gemini 3.1 Pro คือ `gemini-3.1-pro-preview` OpenClaw ยอมรับรูปแบบย่อ `google/gemini-3.1-pro` เป็นนามแฝงเพื่อความสะดวก และปรับให้เป็นรูปแบบมาตรฐานก่อนเรียกผู้ให้บริการ

    **ตัวแปรสภาพแวดล้อม:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    หากคำขอ OAuth ของ Gemini CLI ล้มเหลวหลังเข้าสู่ระบบ ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ
    `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway แล้วลองอีกครั้ง
    </Note>

    <Note>
    หากการเข้าสู่ระบบล้มเหลวก่อนเริ่มขั้นตอนในเบราว์เซอร์ ให้ตรวจสอบว่าคำสั่ง `gemini`
    ในเครื่องได้รับการติดตั้งและอยู่บน `PATH`
    </Note>

    การอ้างอิงโมเดล `google-gemini-cli/*` เป็นนามแฝงเพื่อความเข้ากันได้กับระบบเดิม การกำหนดค่าใหม่
    ควรใช้การอ้างอิงโมเดล `google/*` ร่วมกับรันไทม์ `google-gemini-cli`
    เมื่อต้องการเรียกใช้ Gemini CLI ในเครื่อง

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` ยุติการให้บริการเมื่อวันที่ 2026-03-09 ให้ใช้ `google/gemini-3.1-pro-preview` แทน การเรียกใช้การตั้งค่าคีย์ Gemini API อีกครั้ง (`openclaw onboard --auth-choice gemini-api-key` หรือ `openclaw models auth login --provider google`) จะเขียนทับค่าเริ่มต้นที่กำหนดไว้ซึ่งล้าสมัยให้เป็นโมเดลปัจจุบัน
</Note>

## ความสามารถ

| ความสามารถ                 | รองรับ                          |
| -------------------------- | ------------------------------ |
| การเติมข้อความแชตให้สมบูรณ์ | ใช่                            |
| การสร้างรูปภาพ             | ใช่                            |
| การสร้างเพลง               | ใช่                            |
| การแปลงข้อความเป็นเสียงพูด | ใช่                            |
| เสียงแบบเรียลไทม์          | ใช่ (Google Live API)          |
| การทำความเข้าใจรูปภาพ      | ใช่                            |
| การถอดเสียง                | ใช่                            |
| การทำความเข้าใจวิดีโอ      | ใช่                            |
| การค้นหาเว็บ (Grounding)   | ใช่                            |
| การคิด/การให้เหตุผล        | ใช่ (Gemini 2.5+ / Gemini 3+) |
| โมเดล Gemma 4              | ใช่                            |

## การค้นหาเว็บ

ผู้ให้บริการค้นหาเว็บ `gemini` ที่รวมมาให้ใช้การยึดโยงผลการค้นหากับ Google Search ของ Gemini
กำหนดค่าคีย์สำหรับการค้นหาโดยเฉพาะภายใต้ `plugins.entries.google.config.webSearch`
หรือให้ใช้ `models.providers.google.apiKey` ซ้ำต่อจาก `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // ไม่จำเป็นหากตั้งค่า GEMINI_API_KEY หรือ models.providers.google.apiKey ไว้
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // ใช้ models.providers.google.baseUrl เป็นค่าทดแทน
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

ลำดับความสำคัญของข้อมูลประจำตัวคือ `webSearch.apiKey` ที่กำหนดไว้โดยเฉพาะ ตามด้วย `GEMINI_API_KEY`
และ `models.providers.google.apiKey` ส่วน `webSearch.baseUrl` เป็นตัวเลือกเสริมและ
มีไว้สำหรับพร็อกซีของผู้ดูแลระบบหรือปลายทาง Gemini API ที่เข้ากันได้ เมื่อไม่ระบุ
การค้นหาเว็บด้วย Gemini จะใช้ `models.providers.google.baseUrl` ซ้ำ ดู
[การค้นหาด้วย Gemini](/th/tools/gemini-search) สำหรับพฤติกรรมของเครื่องมือที่เฉพาะเจาะจงกับผู้ให้บริการ

<Tip>
โมเดล Gemini 3 ใช้ `thinkingLevel` แทน `thinkingBudget` OpenClaw จะแมป
ตัวควบคุมการให้เหตุผลของ Gemini 3, Gemini 3.1 และนามแฝง `gemini-*-latest` ไปยัง
`thinkingLevel` เพื่อให้การทำงานแบบเริ่มต้น/เวลาแฝงต่ำไม่ส่งค่า
`thinkingBudget` ที่ปิดใช้งานแล้ว

`/think adaptive` จะคงความหมายของการคิดแบบไดนามิกของ Google ไว้ แทนการเลือก
ระดับ OpenClaw แบบคงที่ Gemini 3 และ Gemini 3.1 จะไม่ระบุ `thinkingLevel` แบบคงที่ เพื่อให้
Google เลือกระดับได้ ส่วน Gemini 2.5 จะส่งค่าเซนทิเนลแบบไดนามิกของ Google
`thinkingBudget: -1`

โมเดล Gemma 4 (เช่น `gemma-4-26b-a4b-it`) รองรับโหมดการคิด OpenClaw
จะเขียน `thinkingBudget` ใหม่เป็น `thinkingLevel` ของ Google ที่รองรับสำหรับ Gemma 4
การตั้งค่าการคิดเป็น `off` จะคงสถานะปิดการคิดไว้ แทนที่จะแมปไปยัง
`MINIMAL`

Gemini 2.5 Pro ทำงานได้เฉพาะในโหมดการคิดและจะปฏิเสธ
`thinkingBudget: 0` ที่ระบุอย่างชัดเจน OpenClaw จะตัดค่านี้ออกจากคำขอ Gemini 2.5 Pro
แทนการส่งค่า
</Tip>

## การสร้างรูปภาพ

ผู้ให้บริการสร้างรูปภาพ `google` ที่รวมมาให้ใช้
`google/gemini-3.1-flash-image-preview` เป็นค่าเริ่มต้น

- รองรับ `google/gemini-3-pro-image-preview` ด้วย
- การสร้าง: สูงสุด 4 รูปภาพต่อคำขอ
- โหมดแก้ไข: เปิดใช้งาน รองรับรูปภาพอินพุตสูงสุด 5 รูป
- ตัวควบคุมเรขาคณิต: `size`, `aspectRatio` และ `resolution`

หากต้องการใช้ Google เป็นผู้ให้บริการรูปภาพเริ่มต้น:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
ดู [การสร้างรูปภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรมการสลับไปใช้ระบบสำรอง
</Note>

## การสร้างวิดีโอ

Plugin `google` ที่รวมมาให้ยังลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ
`video_generate` ที่ใช้ร่วมกันด้วย

- โมเดลวิดีโอเริ่มต้น: `google/veo-3.1-fast-generate-preview`
- โหมด: ข้อความเป็นวิดีโอ รูปภาพเป็นวิดีโอ และลำดับงานที่ใช้วิดีโอเดียวเป็นข้อมูลอ้างอิง
- รองรับ `aspectRatio` (`16:9`, `9:16`) และ `resolution` (`720P`, `1080P`); ปัจจุบัน Veo ยังไม่รองรับเอาต์พุตเสียง
- ระยะเวลาที่รองรับ: **4, 6 หรือ 8 วินาที** (ค่าอื่นจะถูกปรับเป็นค่าที่อนุญาตซึ่งใกล้ที่สุด)

หากต้องการใช้ Google เป็นผู้ให้บริการวิดีโอเริ่มต้น:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรมการสลับไปใช้ระบบสำรอง
</Note>

## การสร้างเพลง

Plugin `google` ที่รวมมาให้ยังลงทะเบียนการสร้างเพลงผ่านเครื่องมือ
`music_generate` ที่ใช้ร่วมกันด้วย

- โมเดลเพลงเริ่มต้น: `google/lyria-3-clip-preview`
- รองรับ `google/lyria-3-pro-preview` ด้วย
- ตัวควบคุมพรอมต์: `lyrics` และ `instrumental`
- รูปแบบเอาต์พุต: ค่าเริ่มต้นคือ `mp3` และรองรับ `wav` บน `google/lyria-3-pro-preview`
- อินพุตอ้างอิง: รูปภาพสูงสุด 10 รูป
- การทำงานที่มีเซสชันรองรับจะแยกไปทำงานผ่านลำดับงาน/สถานะที่ใช้ร่วมกัน รวมถึง `action: "status"`

หากต้องการใช้ Google เป็นผู้ให้บริการเพลงเริ่มต้น:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
ดู [การสร้างเพลง](/th/tools/music-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรมการสลับไปใช้ระบบสำรอง
</Note>

## การแปลงข้อความเป็นเสียงพูด

ผู้ให้บริการเสียงพูด `google` ที่รวมมาให้ใช้เส้นทาง TTS ของ Gemini API กับ
`gemini-3.1-flash-tts-preview`

- เสียงเริ่มต้น: `Kore`
- การยืนยันตัวตน: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- เอาต์พุต: WAV สำหรับไฟล์แนบ TTS ทั่วไป, Opus สำหรับเป้าหมายข้อความเสียง และ PCM สำหรับการพูดคุย/โทรศัพท์
- เอาต์พุตข้อความเสียง: PCM ของ Google จะถูกห่อหุ้มเป็น WAV และแปลงเป็น Opus 48 kHz ด้วย `ffmpeg`

เส้นทาง Gemini TTS แบบกลุ่มของ Google ส่งคืนเสียงที่สร้างขึ้นในผลตอบกลับ
`generateContent` ที่เสร็จสมบูรณ์ สำหรับการสนทนาด้วยเสียงที่มีเวลาแฝงต่ำที่สุด ให้ใช้
ผู้ให้บริการเสียงเรียลไทม์ของ Google ที่ทำงานบน Gemini Live API แทน TTS
แบบกลุ่ม

หากต้องการใช้ Google เป็นผู้ให้บริการ TTS เริ่มต้น:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS ใช้พรอมต์ภาษาธรรมชาติสำหรับควบคุมรูปแบบ ตั้งค่า
`audioProfile` เพื่อเติมพรอมต์รูปแบบที่ใช้ซ้ำได้ไว้หน้าข้อความที่จะอ่าน ตั้งค่า
`speakerName` เมื่อข้อความพรอมต์ของคุณกล่าวถึงผู้พูดที่มีชื่อ

Gemini API TTS ยังรองรับแท็กเสียงเชิงอารมณ์ในวงเล็บเหลี่ยมภายในข้อความ
เช่น `[whispers]` หรือ `[laughs]` หากต้องการไม่ให้แท็กปรากฏในการตอบกลับแชต
แต่ยังส่งไปยัง TTS ให้ใส่แท็กไว้ภายในบล็อก `[[tts:text]]...[[/tts:text]]`:

```text
นี่คือข้อความตอบกลับที่ไม่มีแท็ก

[[tts:text]][whispers] นี่คือเวอร์ชันเสียงพูด[[/tts:text]]
```

<Note>
คีย์ API ของ Google Cloud Console ที่จำกัดให้ใช้กับ Gemini API สามารถใช้กับ
ผู้ให้บริการนี้ได้ นี่ไม่ใช่เส้นทาง Cloud Text-to-Speech API แยกต่างหาก
</Note>

## เสียงแบบเรียลไทม์

Plugin `google` ที่รวมมาให้ลงทะเบียนผู้ให้บริการเสียงแบบเรียลไทม์ที่ทำงานบน
Gemini Live API สำหรับบริดจ์เสียงฝั่งแบ็กเอนด์ เช่น Voice Call และ Google Meet

| การตั้งค่า               | พาธการกำหนดค่า                                                         | ค่าเริ่มต้น                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| โมเดล                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| เสียง                 | `...google.voice`                                                   | `Kore`                                                                                |
| อุณหภูมิ           | `...google.temperature`                                             | (ไม่ได้ตั้งค่า)                                                                               |
| ความไวเริ่มต้นของ VAD | `...google.startSensitivity`                                        | (ไม่ได้ตั้งค่า)                                                                               |
| ความไวสิ้นสุดของ VAD   | `...google.endSensitivity`                                          | (ไม่ได้ตั้งค่า)                                                                               |
| ระยะเวลาความเงียบ      | `...google.silenceDurationMs`                                       | (ไม่ได้ตั้งค่า)                                                                               |
| การจัดการกิจกรรม     | `...google.activityHandling`                                        | ค่าเริ่มต้นของ Google, `start-of-activity-interrupts`                                        |
| ความครอบคลุมของรอบสนทนา         | `...google.turnCoverage`                                            | ค่าเริ่มต้นของ Google, `audio-activity-and-all-video`                                        |
| ปิดใช้งาน VAD อัตโนมัติ      | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| การดำเนินเซสชันต่อ    | `...google.sessionResumption`                                       | `true`                                                                                |
| การบีบอัดบริบท   | `...google.contextWindowCompression`                                | `true`                                                                                |
| คีย์ API               | `...google.apiKey`                                                  | หากไม่มีค่าจะใช้ `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` |

ตัวอย่างการกำหนดค่า Voice Call แบบเรียลไทม์:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API ใช้เสียงแบบสองทิศทางและการเรียกใช้ฟังก์ชันผ่าน WebSocket
OpenClaw ปรับเสียงจากบริดจ์โทรศัพท์/Meet ให้เข้ากับสตรีม PCM Live API ของ Gemini และ
คงการเรียกใช้เครื่องมือไว้บนสัญญาเสียงเรียลไทม์ที่ใช้ร่วมกัน ปล่อย `temperature`
ไว้โดยไม่ตั้งค่า เว้นแต่คุณต้องการเปลี่ยนการสุ่มตัวอย่าง โดย OpenClaw จะละเว้นค่าที่ไม่เป็นบวก
เนื่องจาก Google Live อาจส่งคืนข้อความถอดเสียงโดยไม่มีเสียงเมื่อใช้ `temperature: 0`
การถอดเสียงของ Gemini API เปิดใช้งานโดยไม่ใช้ `languageCodes` เนื่องจาก SDK ของ Google
ในปัจจุบันปฏิเสธคำใบ้รหัสภาษาในพาธ API นี้
</Note>

<Note>
Gemini 3.1 Live รองรับข้อความสนทนาผ่านอินพุตแบบเรียลไทม์และใช้
การเรียกใช้ฟังก์ชันตามลำดับ OpenClaw ละเว้น `NON_BLOCKING` แบบเก่า การกำหนดเวลา
การตอบกลับของฟังก์ชัน และฟิลด์บทสนทนาเชิงอารมณ์สำหรับโมเดลนี้ ควรใช้
`thinkingLevel` โดยค่า `thinkingBudget` เชิงบวกที่กำหนดไว้จะถูกจับคู่กับ
ระดับที่รองรับซึ่งใกล้เคียงที่สุด ส่วน `-1` จะคงค่าเริ่มต้นของ Google ไว้ ดู
[การเปรียบเทียบความสามารถของ Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities)
</Note>

<Note>
Talk ใน Control UI รองรับเซสชัน Google Live บนเบราว์เซอร์ด้วยโทเค็นแบบใช้ครั้งเดียว
ที่มีข้อจำกัด ผู้ให้บริการเสียงเรียลไทม์สำหรับแบ็กเอนด์เท่านั้นสามารถทำงานผ่านทรานสปอร์ต
รีเลย์ทั่วไปของ Gateway ได้เช่นกัน ซึ่งจะเก็บข้อมูลประจำตัวของผู้ให้บริการไว้บน Gateway
</Note>

สำหรับการตรวจสอบแบบสดโดยผู้ดูแล ให้เรียกใช้
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
การทดสอบเบื้องต้นนี้ครอบคลุมพาธแบ็กเอนด์/WebRTC ของ OpenAI ด้วย ส่วนของ Google จะสร้าง
โทเค็น Live API แบบมีข้อจำกัดในรูปแบบเดียวกับที่ Talk ใน Control UI ใช้ เปิดปลายทาง
WebSocket ของเบราว์เซอร์ ส่งเพย์โหลดการตั้งค่าเริ่มต้น และรอ
`setupComplete`

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การนำแคช Gemini โดยตรงกลับมาใช้">
    สำหรับการเรียกใช้ Gemini API โดยตรง (`api: "google-generative-ai"`) OpenClaw
    จะส่งแฮนเดิล `cachedContent` ที่กำหนดค่าไว้ไปยังคำขอ Gemini

    - กำหนดค่าพารามิเตอร์รายโมเดลหรือส่วนกลางด้วย
      `cachedContent` หรือ `cached_content` แบบเดิม
    - พารามิเตอร์จากขอบเขตที่เฉพาะเจาะจงกว่า (ระดับโมเดลเหนือกว่าส่วนกลาง) จะมีผลเสมอ
      ภายในขอบเขตเดียวกัน หากตั้งค่าทั้งสองคีย์ `cached_content` จะมีผลเหนือกว่า
      ใช้เพียงคีย์เดียวต่อขอบเขตเพื่อหลีกเลี่ยงผลลัพธ์ที่ไม่คาดคิด
    - ค่าตัวอย่าง: `cachedContents/prebuilt-context`
    - การใช้งานเมื่อพบแคชของ Gemini จะถูกปรับให้อยู่ในรูป OpenClaw `cacheRead` จาก
      `cachedContentTokenCount` ของต้นทาง

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="หมายเหตุการใช้งาน Gemini CLI">
    เมื่อใช้ผู้ให้บริการ OAuth `google-gemini-cli` OpenClaw จะใช้เอาต์พุต
    `stream-json` ของ Gemini CLI เป็นค่าเริ่มต้น และปรับข้อมูลการใช้งานจากเพย์โหลด
    `stats` สุดท้ายให้อยู่ในรูปแบบมาตรฐาน การกำหนดทับด้วย `--output-format json` แบบเดิมจะยังคงใช้
    ตัวแยกวิเคราะห์ JSON

    - ข้อความตอบกลับแบบสตรีมมาจากเหตุการณ์ `message` ของผู้ช่วย
    - สำหรับเอาต์พุต JSON แบบเดิม ข้อความตอบกลับมาจากฟิลด์ `response` ใน JSON ของ CLI
    - หาก CLI ปล่อย `usage` ว่างไว้ ระบบจะใช้ `stats` เป็นค่าทดแทน
    - `stats.cached` จะถูกปรับให้อยู่ในรูป OpenClaw `cacheRead`
    - หากไม่มี `stats.input` OpenClaw จะคำนวณโทเค็นอินพุตจาก
      `stats.input_tokens - stats.cached`

  </Accordion>

  <Accordion title="การตั้งค่าสภาพแวดล้อมและเดมอน">
    หาก Gateway ทำงานเป็นเดมอน (launchd/systemd) โปรดตรวจสอบว่าโปรเซสนั้นเข้าถึง
    `GEMINI_API_KEY` ได้ (ตัวอย่างเช่น ใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)
  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือสร้างภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือสร้างวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างเพลง" href="/th/tools/music-generation" icon="music">
    พารามิเตอร์เครื่องมือสร้างเพลงที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
</CardGroup>
