---
read_when:
    - คุณต้องการใช้โมเดล Google Gemini กับ OpenClaw
    - คุณต้องมีคีย์ API หรือขั้นตอนการยืนยันตัวตน OAuth
summary: การตั้งค่า Google Gemini (คีย์ API + OAuth, การสร้างรูปภาพ, การเข้าใจสื่อ, TTS, การค้นหาเว็บ)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-06-27T18:13:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eced20b11cc702d803992d96dcc5edb8f06640f6baffbc65dab504a6c91776bc
    source_path: providers/google.md
    workflow: 16
---

Plugin ของ Google ให้การเข้าถึงโมเดล Gemini ผ่าน Google AI Studio รวมถึง
การสร้างภาพ, การทำความเข้าใจสื่อ (ภาพ/เสียง/วิดีโอ), การแปลงข้อความเป็นเสียง และการค้นหาเว็บผ่าน
Gemini Grounding

- ผู้ให้บริการ: `google`
- การยืนยันตัวตน: `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- API: Google Gemini API
- ตัวเลือกรันไทม์: provider/model `agentRuntime.id: "google-gemini-cli"`
  ใช้ Gemini CLI OAuth ซ้ำโดยยังคงให้ model refs เป็นรูปแบบมาตรฐาน `google/*`

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="คีย์ API">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง Gemini API มาตรฐานผ่าน Google AI Studio

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
    รองรับตัวแปรสภาพแวดล้อมทั้ง `GEMINI_API_KEY` และ `GOOGLE_API_KEY` ใช้ตัวใดก็ได้ที่คุณกำหนดค่าไว้แล้ว
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **เหมาะที่สุดสำหรับ:** การใช้การเข้าสู่ระบบ Gemini CLI ที่มีอยู่ซ้ำผ่าน PKCE OAuth แทนคีย์ API แยกต่างหาก

    <Warning>
    ผู้ให้บริการ `google-gemini-cli` เป็นการผสานรวมอย่างไม่เป็นทางการ ผู้ใช้บางราย
    รายงานข้อจำกัดบัญชีเมื่อใช้ OAuth ในลักษณะนี้ ใช้โดยยอมรับความเสี่ยงเอง
    </Warning>

    <Steps>
      <Step title="ติดตั้ง Gemini CLI">
        คำสั่ง `gemini` ในเครื่องต้องพร้อมใช้งานบน `PATH`

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw รองรับทั้งการติดตั้งผ่าน Homebrew และการติดตั้ง npm แบบ global รวมถึง
        เลย์เอาต์ Windows/npm ที่ใช้กันทั่วไป
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

    รหัสโมเดล Gemini API ของ Gemini 3.1 Pro คือ `gemini-3.1-pro-preview` OpenClaw ยอมรับ `google/gemini-3.1-pro` ที่สั้นกว่าเป็นนามแฝงเพื่อความสะดวก และแปลงให้อยู่ในรูปแบบมาตรฐานก่อนเรียกผู้ให้บริการ

    **ตัวแปรสภาพแวดล้อม:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (หรือรูปแบบ `GEMINI_CLI_*`)

    <Note>
    หากคำขอ Gemini CLI OAuth ล้มเหลวหลังเข้าสู่ระบบ ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ
    `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway แล้วลองอีกครั้ง
    </Note>

    <Note>
    หากการเข้าสู่ระบบล้มเหลวก่อนเริ่มโฟลว์เบราว์เซอร์ ให้ตรวจสอบว่าคำสั่ง `gemini`
    ในเครื่องติดตั้งแล้วและอยู่บน `PATH`
    </Note>

    model refs แบบ `google-gemini-cli/*` เป็นนามแฝงความเข้ากันได้เดิม การกำหนดค่าใหม่
    ควรใช้ model refs แบบ `google/*` พร้อมรันไทม์ `google-gemini-cli`
    เมื่อต้องการให้ Gemini CLI ในเครื่องดำเนินการ

  </Tab>
</Tabs>

## ความสามารถ

| ความสามารถ             | รองรับ                     |
| ---------------------- | ----------------------------- |
| การเติมข้อความแชท       | ใช่                           |
| การสร้างภาพ       | ใช่                           |
| การสร้างเพลง       | ใช่                           |
| การแปลงข้อความเป็นเสียง         | ใช่                           |
| เสียงแบบเรียลไทม์         | ใช่ (Google Live API)         |
| การทำความเข้าใจภาพ    | ใช่                           |
| การถอดเสียงเสียง    | ใช่                           |
| การทำความเข้าใจวิดีโอ    | ใช่                           |
| การค้นหาเว็บ (Grounding) | ใช่                           |
| การคิด/การให้เหตุผล     | ใช่ (Gemini 2.5+ / Gemini 3+) |
| โมเดล Gemma 4         | ใช่                           |

## การค้นหาเว็บ

ผู้ให้บริการค้นหาเว็บ `gemini` ที่มาพร้อมชุดใช้ Gemini Google Search grounding
กำหนดค่าคีย์ค้นหาเฉพาะภายใต้ `plugins.entries.google.config.webSearch`
หรือปล่อยให้ใช้ `models.providers.google.apiKey` ซ้ำหลังจาก `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

ลำดับความสำคัญของข้อมูลรับรองคือ `webSearch.apiKey` เฉพาะ ตามด้วย `GEMINI_API_KEY`
แล้วจึงเป็น `models.providers.google.apiKey` `webSearch.baseUrl` เป็นตัวเลือกเสริมและ
มีไว้สำหรับพร็อกซีของผู้ดูแลระบบหรือปลายทาง Gemini API ที่เข้ากันได้ เมื่อไม่ระบุ
การค้นหาเว็บของ Gemini จะใช้ `models.providers.google.baseUrl` ซ้ำ ดู
[การค้นหา Gemini](/th/tools/gemini-search) สำหรับลักษณะการทำงานของเครื่องมือเฉพาะผู้ให้บริการ

<Tip>
โมเดล Gemini 3 ใช้ `thinkingLevel` แทน `thinkingBudget` OpenClaw แมป
การควบคุมการให้เหตุผลของ Gemini 3, Gemini 3.1 และนามแฝง `gemini-*-latest` เป็น
`thinkingLevel` เพื่อให้การรันเริ่มต้น/หน่วงต่ำไม่ส่งค่า
`thinkingBudget` ที่ปิดใช้งานอยู่

`/think adaptive` รักษาความหมายการคิดแบบไดนามิกของ Google แทนการเลือก
ระดับ OpenClaw แบบคงที่ Gemini 3 และ Gemini 3.1 จะละเว้น `thinkingLevel` แบบคงที่เพื่อให้
Google เลือกระดับได้ ส่วน Gemini 2.5 จะส่ง sentinel แบบไดนามิกของ Google
`thinkingBudget: -1`

โมเดล Gemma 4 (เช่น `gemma-4-26b-a4b-it`) รองรับโหมดการคิด OpenClaw
เขียน `thinkingBudget` ใหม่เป็น `thinkingLevel` ของ Google ที่รองรับสำหรับ Gemma 4
การตั้งค่าการคิดเป็น `off` จะคงการปิดใช้งานการคิดไว้ แทนการแมปเป็น
`MINIMAL`
</Tip>

## การสร้างภาพ

ผู้ให้บริการสร้างภาพ `google` ที่มาพร้อมชุดมีค่าเริ่มต้นเป็น
`google/gemini-3.1-flash-image-preview`

- รองรับ `google/gemini-3-pro-image-preview` ด้วย
- สร้าง: สูงสุด 4 ภาพต่อคำขอ
- โหมดแก้ไข: เปิดใช้งาน สูงสุด 5 ภาพอินพุต
- การควบคุมเรขาคณิต: `size`, `aspectRatio` และ `resolution`

หากต้องการใช้ Google เป็นผู้ให้บริการภาพเริ่มต้น:

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
ดู [การสร้างภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การสร้างวิดีโอ

Plugin `google` ที่มาพร้อมชุดยังลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือที่ใช้ร่วมกัน
`video_generate`

- โมเดลวิดีโอเริ่มต้น: `google/veo-3.1-fast-generate-preview`
- โหมด: ข้อความเป็นวิดีโอ, ภาพเป็นวิดีโอ และโฟลว์อ้างอิงวิดีโอเดียว
- รองรับ `aspectRatio` (`16:9`, `9:16`) และ `resolution` (`720P`, `1080P`); ปัจจุบัน Veo ไม่รองรับเอาต์พุตเสียง
- ระยะเวลาที่รองรับ: **4, 6 หรือ 8 วินาที** (ค่าอื่นจะปรับไปยังค่าที่อนุญาตที่ใกล้ที่สุด)

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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การสร้างเพลง

Plugin `google` ที่มาพร้อมชุดยังลงทะเบียนการสร้างเพลงผ่านเครื่องมือที่ใช้ร่วมกัน
`music_generate`

- โมเดลเพลงเริ่มต้น: `google/lyria-3-clip-preview`
- รองรับ `google/lyria-3-pro-preview` ด้วย
- การควบคุมพรอมต์: `lyrics` และ `instrumental`
- รูปแบบเอาต์พุต: ค่าเริ่มต้นคือ `mp3` และมี `wav` บน `google/lyria-3-pro-preview`
- อินพุตอ้างอิง: สูงสุด 10 ภาพ
- การรันที่มีเซสชันรองรับจะแยกงานผ่านโฟลว์งาน/สถานะที่ใช้ร่วมกัน รวมถึง `action: "status"`

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
ดู [การสร้างเพลง](/th/tools/music-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การแปลงข้อความเป็นเสียง

ผู้ให้บริการเสียงพูด `google` ที่มาพร้อมชุดใช้เส้นทาง Gemini API TTS ด้วย
`gemini-3.1-flash-tts-preview`

- เสียงเริ่มต้น: `Kore`
- การยืนยันตัวตน: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- เอาต์พุต: WAV สำหรับไฟล์แนบ TTS ปกติ, Opus สำหรับเป้าหมายโน้ตเสียง, PCM สำหรับ Talk/โทรศัพท์
- เอาต์พุตโน้ตเสียง: Google PCM จะถูกห่อเป็น WAV และแปลงรหัสเป็น Opus 48 kHz ด้วย `ffmpeg`

เส้นทาง Gemini TTS แบบแบตช์ของ Google ส่งคืนเสียงที่สร้างแล้วในคำตอบ
`generateContent` ที่เสร็จสมบูรณ์ สำหรับบทสนทนาเสียงพูดที่มีความหน่วงต่ำสุด ให้ใช้
ผู้ให้บริการเสียงแบบเรียลไทม์ของ Google ที่รองรับด้วย Gemini Live API แทน TTS
แบบแบตช์

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

Gemini API TTS ใช้การพรอมต์ด้วยภาษาธรรมชาติเพื่อควบคุมสไตล์ ตั้งค่า
`audioProfile` เพื่อเติมพรอมต์สไตล์ที่ใช้ซ้ำได้ไว้หน้าข้อความที่พูด ตั้งค่า
`speakerName` เมื่อข้อความพรอมต์ของคุณอ้างถึงผู้พูดที่มีชื่อ

Gemini API TTS ยังยอมรับแท็กเสียงแบบแสดงอารมณ์ในวงเล็บเหลี่ยมภายในข้อความ
เช่น `[whispers]` หรือ `[laughs]` หากต้องการกันแท็กออกจากคำตอบแชทที่มองเห็นได้
แต่ยังส่งแท็กเหล่านั้นไปยัง TTS ให้ใส่ไว้ภายในบล็อก `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
คีย์ API ของ Google Cloud Console ที่จำกัดให้ใช้กับ Gemini API ใช้ได้กับ
ผู้ให้บริการนี้ นี่ไม่ใช่เส้นทาง Cloud Text-to-Speech API แยกต่างหาก
</Note>

## เสียงแบบเรียลไทม์

Plugin `google` ที่มาพร้อมชุดลงทะเบียนผู้ให้บริการเสียงแบบเรียลไทม์ที่รองรับด้วย
Gemini Live API สำหรับบริดจ์เสียงฝั่งแบ็กเอนด์ เช่น Voice Call และ Google Meet

| การตั้งค่า             | เส้นทางการกำหนดค่า                                                  | ค่าเริ่มต้น                                                                           |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| โมเดล                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| เสียง                 | `...google.voice`                                                   | `Kore`                                                                                |
| อุณหภูมิ              | `...google.temperature`                                             | (ไม่ได้ตั้งค่า)                                                                       |
| ความไวเริ่มต้น VAD    | `...google.startSensitivity`                                        | (ไม่ได้ตั้งค่า)                                                                       |
| ความไวสิ้นสุด VAD     | `...google.endSensitivity`                                          | (ไม่ได้ตั้งค่า)                                                                       |
| ระยะเวลาเงียบ         | `...google.silenceDurationMs`                                       | (ไม่ได้ตั้งค่า)                                                                       |
| การจัดการกิจกรรม      | `...google.activityHandling`                                        | ค่าเริ่มต้นของ Google, `start-of-activity-interrupts`                                |
| ความครอบคลุมของรอบ    | `...google.turnCoverage`                                            | ค่าเริ่มต้นของ Google, `only-activity`                                               |
| ปิดใช้งาน VAD อัตโนมัติ | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| การกลับมาใช้เซสชันต่อ | `...google.sessionResumption`                                       | `true`                                                                                |
| การบีบอัดบริบท        | `...google.contextWindowCompression`                                | `true`                                                                                |
| คีย์ API              | `...google.apiKey`                                                  | ถอยกลับไปใช้ `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` |

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
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
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
Google Live API ใช้เสียงสองทิศทางและการเรียกฟังก์ชันผ่าน WebSocket
OpenClaw ปรับเสียงจากสะพานโทรศัพท์/Meet ให้เข้ากับสตรีม PCM Live API ของ Gemini และ
คงการเรียกเครื่องมือไว้บนสัญญาเสียงเรียลไทม์ที่ใช้ร่วมกัน ปล่อย `temperature`
ไว้โดยไม่ตั้งค่า เว้นแต่คุณต้องเปลี่ยนการสุ่มตัวอย่าง OpenClaw จะละเว้นค่าที่ไม่เป็นบวก
เพราะ Google Live อาจส่งคืนทรานสคริปต์โดยไม่มีเสียงสำหรับ `temperature: 0`
การถอดเสียง Gemini API เปิดใช้งานโดยไม่มี `languageCodes`; Google
SDK ปัจจุบันปฏิเสธคำใบ้รหัสภาษาบนเส้นทาง API นี้
</Note>

<Note>
Control UI Talk รองรับเซสชัน Google Live ในเบราว์เซอร์ด้วยโทเค็นแบบใช้ครั้งเดียวที่จำกัดขอบเขต
ผู้ให้บริการเสียงเรียลไทม์ฝั่งแบ็กเอนด์เท่านั้นสามารถทำงานผ่านการขนส่งรีเลย์ทั่วไปของ
Gateway ได้เช่นกัน ซึ่งจะเก็บข้อมูลรับรองของผู้ให้บริการไว้บน Gateway
</Note>

สำหรับการยืนยันสดของผู้ดูแล ให้รัน
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
สโมกยังครอบคลุมเส้นทางแบ็กเอนด์/WebRTC ของ OpenAI ด้วย ส่วนของ Google จะสร้างโทเค็น
Live API แบบจำกัดรูปแบบเดียวกับที่ Control UI Talk ใช้ เปิดปลายทาง WebSocket
ของเบราว์เซอร์ ส่งเพย์โหลดการตั้งค่าเริ่มต้น และรอ
`setupComplete`

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    สำหรับการรัน Gemini API โดยตรง (`api: "google-generative-ai"`), OpenClaw
    จะส่งแฮนเดิล `cachedContent` ที่กำหนดค่าไว้ผ่านไปยังคำขอ Gemini

    - กำหนดค่าพารามิเตอร์ต่อโมเดลหรือแบบโกลบอลด้วย
      `cachedContent` หรือ `cached_content` แบบเดิม
    - หากมีทั้งสองอย่าง `cachedContent` จะชนะ
    - ค่าตัวอย่าง: `cachedContents/prebuilt-context`
    - การใช้งานเมื่อ Gemini พบแคชจะถูกทำให้เป็นมาตรฐานเป็น OpenClaw `cacheRead` จาก
      `cachedContentTokenCount` ต้นทาง

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

  <Accordion title="Gemini CLI usage notes">
    เมื่อใช้ผู้ให้บริการ OAuth `google-gemini-cli`, OpenClaw จะใช้เอาต์พุต
    CLI `stream-json` ของ Gemini เป็นค่าเริ่มต้น และทำให้การใช้งานเป็นมาตรฐานจากเพย์โหลด
    `stats` สุดท้าย การ override `--output-format json` แบบเดิมยังคงใช้
    ตัวแยกวิเคราะห์ JSON

    - ข้อความตอบกลับแบบสตรีมมาจากเหตุการณ์ `message` ของผู้ช่วย
    - สำหรับเอาต์พุต JSON แบบเดิม ข้อความตอบกลับมาจากฟิลด์ `response` ของ JSON จาก CLI
    - การใช้งานจะถอยกลับไปใช้ `stats` เมื่อ CLI ปล่อย `usage` ว่างไว้
    - `stats.cached` ถูกทำให้เป็นมาตรฐานเป็น OpenClaw `cacheRead`
    - หากไม่มี `stats.input`, OpenClaw จะคำนวณโทเค็นอินพุตจาก
      `stats.input_tokens - stats.cached`

  </Accordion>

  <Accordion title="Environment and daemon setup">
    หาก Gateway ทำงานเป็นเดมอน (launchd/systemd) ให้ตรวจสอบว่า `GEMINI_API_KEY`
    พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมเฟลโอเวอร์
  </Card>
  <Card title="Image generation" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือสร้างภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Video generation" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือสร้างวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Music generation" href="/th/tools/music-generation" icon="music">
    พารามิเตอร์เครื่องมือสร้างเพลงที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
</CardGroup>
