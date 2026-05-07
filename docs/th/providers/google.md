---
read_when:
    - คุณต้องการใช้โมเดล Google Gemini กับ OpenClaw
    - คุณต้องมีคีย์ API หรือขั้นตอนการยืนยันตัวตน OAuth
summary: การตั้งค่า Google Gemini (คีย์ API + OAuth, การสร้างรูปภาพ, การทำความเข้าใจสื่อ, TTS, การค้นหาเว็บ)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-07T13:25:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9344307c0f20bf09d330ed82b8ffbd4dfa2592c869eb049c46191caa3ca141e
    source_path: providers/google.md
    workflow: 16
---

Plugin Google ให้การเข้าถึงโมเดล Gemini ผ่าน Google AI Studio รวมถึง
การสร้างภาพ การทำความเข้าใจสื่อ (ภาพ/เสียง/วิดีโอ) การแปลงข้อความเป็นเสียง และการค้นหาเว็บผ่าน
Gemini Grounding

- ผู้ให้บริการ: `google`
- การยืนยันตัวตน: `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- API: Google Gemini API
- ตัวเลือกรันไทม์: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  ใช้ OAuth ของ Gemini CLI ซ้ำ ขณะที่ยังคงการอ้างอิงโมเดลในรูปแบบมาตรฐานเป็น `google/*`

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="API key">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง Gemini API มาตรฐานผ่าน Google AI Studio

    <Steps>
      <Step title="Run onboarding">
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
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    รองรับตัวแปรสภาพแวดล้อมทั้ง `GEMINI_API_KEY` และ `GOOGLE_API_KEY` ใช้ตัวใดก็ได้ที่คุณตั้งค่าไว้อยู่แล้ว
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **เหมาะที่สุดสำหรับ:** การใช้ล็อกอิน Gemini CLI ที่มีอยู่ซ้ำผ่าน PKCE OAuth แทน API key แยกต่างหาก

    <Warning>
    ผู้ให้บริการ `google-gemini-cli` เป็นการผสานรวมที่ไม่เป็นทางการ ผู้ใช้บางราย
    รายงานข้อจำกัดบัญชีเมื่อใช้ OAuth ด้วยวิธีนี้ ใช้งานตามความเสี่ยงของคุณเอง
    </Warning>

    <Steps>
      <Step title="Install the Gemini CLI">
        คำสั่ง `gemini` ในเครื่องต้องพร้อมใช้งานบน `PATH`

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw รองรับทั้งการติดตั้งผ่าน Homebrew และการติดตั้ง npm แบบทั่วระบบ รวมถึง
        เลย์เอาต์ Windows/npm ทั่วไป
      </Step>
      <Step title="Log in via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - โมเดลเริ่มต้น: `google/gemini-3.1-pro-preview`
    - รันไทม์: `google-gemini-cli`
    - นามแฝง: `gemini-cli`

    ID โมเดล Gemini API ของ Gemini 3.1 Pro คือ `gemini-3.1-pro-preview` OpenClaw ยอมรับ `google/gemini-3.1-pro` ที่สั้นกว่าเป็นนามแฝงเพื่อความสะดวก และทำให้เป็นรูปแบบปกติก่อนเรียกผู้ให้บริการ

    **ตัวแปรสภาพแวดล้อม:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (หรือรูปแบบ `GEMINI_CLI_*`)

    <Note>
    หากคำขอ Gemini CLI OAuth ล้มเหลวหลังล็อกอิน ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ
    `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway แล้วลองอีกครั้ง
    </Note>

    <Note>
    หากล็อกอินล้มเหลวก่อนโฟลว์เบราว์เซอร์เริ่มต้น ตรวจสอบให้แน่ใจว่าคำสั่ง `gemini`
    ในเครื่องติดตั้งแล้วและอยู่บน `PATH`
    </Note>

    การอ้างอิงโมเดล `google-gemini-cli/*` เป็นนามแฝงสำหรับความเข้ากันได้แบบเดิม การกำหนดค่าใหม่
    ควรใช้การอ้างอิงโมเดล `google/*` พร้อมกับรันไทม์ `google-gemini-cli`
    เมื่อต้องการรัน Gemini CLI ในเครื่อง

  </Tab>
</Tabs>

## ความสามารถ

| ความสามารถ             | รองรับ                     |
| ---------------------- | ----------------------------- |
| การเติมเต็มแชต       | ใช่                           |
| การสร้างภาพ       | ใช่                           |
| การสร้างเพลง       | ใช่                           |
| การแปลงข้อความเป็นเสียง         | ใช่                           |
| เสียงแบบเรียลไทม์         | ใช่ (Google Live API)         |
| การทำความเข้าใจภาพ    | ใช่                           |
| การถอดเสียง    | ใช่                           |
| การทำความเข้าใจวิดีโอ    | ใช่                           |
| การค้นหาเว็บ (Grounding) | ใช่                           |
| การคิด/การให้เหตุผล     | ใช่ (Gemini 2.5+ / Gemini 3+) |
| โมเดล Gemma 4         | ใช่                           |

## การค้นหาเว็บ

ผู้ให้บริการค้นหาเว็บ `gemini` ที่รวมมา ใช้การ Grounding ด้วย Google Search ของ Gemini
กำหนดค่าคีย์ค้นหาเฉพาะภายใต้ `plugins.entries.google.config.webSearch`
หรือให้ใช้ `models.providers.google.apiKey` ซ้ำหลังจาก `GEMINI_API_KEY`:

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

ลำดับความสำคัญของข้อมูลรับรองคือ `webSearch.apiKey` เฉพาะก่อน จากนั้น `GEMINI_API_KEY`
แล้วจึง `models.providers.google.apiKey` ค่า `webSearch.baseUrl` เป็นตัวเลือกและ
มีไว้สำหรับพร็อกซีของผู้ปฏิบัติงานหรือปลายทาง Gemini API ที่เข้ากันได้ เมื่อไม่ระบุ
การค้นหาเว็บ Gemini จะใช้ `models.providers.google.baseUrl` ซ้ำ ดู
[การค้นหา Gemini](/th/tools/gemini-search) สำหรับพฤติกรรมเครื่องมือเฉพาะผู้ให้บริการ

<Tip>
โมเดล Gemini 3 ใช้ `thinkingLevel` แทน `thinkingBudget` OpenClaw แมป
การควบคุมการให้เหตุผลของนามแฝง Gemini 3, Gemini 3.1 และ `gemini-*-latest` ไปเป็น
`thinkingLevel` เพื่อให้การรันเริ่มต้น/ความหน่วงต่ำไม่ส่งค่า
`thinkingBudget` ที่ปิดใช้งานแล้ว

`/think adaptive` คงความหมายการคิดแบบไดนามิกของ Google ไว้แทนการเลือก
ระดับ OpenClaw แบบคงที่ Gemini 3 และ Gemini 3.1 จะละเว้น `thinkingLevel` แบบคงที่ เพื่อให้
Google เลือกระดับได้ Gemini 2.5 จะส่งค่าตัวแทนแบบไดนามิกของ Google
`thinkingBudget: -1`

โมเดล Gemma 4 (เช่น `gemma-4-26b-a4b-it`) รองรับโหมดการคิด OpenClaw
เขียน `thinkingBudget` ใหม่เป็น `thinkingLevel` ของ Google ที่รองรับสำหรับ Gemma 4
การตั้งค่าการคิดเป็น `off` จะคงสถานะปิดใช้งานการคิดไว้แทนการแมปเป็น
`MINIMAL`
</Tip>

## การสร้างภาพ

ผู้ให้บริการสร้างภาพ `google` ที่รวมมา มีค่าเริ่มต้นเป็น
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
ดู [การสร้างภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือกผู้ให้บริการ และพฤติกรรมการสลับเมื่อเกิดข้อผิดพลาด
</Note>

## การสร้างวิดีโอ

Plugin `google` ที่รวมมา ยังลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือร่วม
`video_generate`

- โมเดลวิดีโอเริ่มต้น: `google/veo-3.1-fast-generate-preview`
- โหมด: โฟลว์ข้อความเป็นวิดีโอ ภาพเป็นวิดีโอ และการอ้างอิงวิดีโอเดียว
- รองรับ `aspectRatio`, `resolution` และ `audio`
- ขีดจำกัดระยะเวลาปัจจุบัน: **4 ถึง 8 วินาที**

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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือกผู้ให้บริการ และพฤติกรรมการสลับเมื่อเกิดข้อผิดพลาด
</Note>

## การสร้างเพลง

Plugin `google` ที่รวมมา ยังลงทะเบียนการสร้างเพลงผ่านเครื่องมือร่วม
`music_generate`

- โมเดลเพลงเริ่มต้น: `google/lyria-3-clip-preview`
- รองรับ `google/lyria-3-pro-preview` ด้วย
- การควบคุมพรอมป์: `lyrics` และ `instrumental`
- รูปแบบเอาต์พุต: ค่าเริ่มต้นเป็น `mp3` รวมถึง `wav` บน `google/lyria-3-pro-preview`
- อินพุตอ้างอิง: สูงสุด 10 ภาพ
- การรันที่มีเซสชันรองรับจะแยกงานผ่านโฟลว์งาน/สถานะร่วม รวมถึง `action: "status"`

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
ดู [การสร้างเพลง](/th/tools/music-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือกผู้ให้บริการ และพฤติกรรมการสลับเมื่อเกิดข้อผิดพลาด
</Note>

## การแปลงข้อความเป็นเสียง

ผู้ให้บริการเสียงพูด `google` ที่รวมมา ใช้เส้นทาง TTS ของ Gemini API พร้อม
`gemini-3.1-flash-tts-preview`

- เสียงเริ่มต้น: `Kore`
- การยืนยันตัวตน: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- เอาต์พุต: WAV สำหรับไฟล์แนบ TTS ปกติ, Opus สำหรับเป้าหมายข้อความเสียง, PCM สำหรับ Talk/โทรศัพท์
- เอาต์พุตข้อความเสียง: PCM ของ Google ถูกห่อเป็น WAV และแปลงรหัสเป็น Opus 48 kHz ด้วย `ffmpeg`

เส้นทาง Gemini TTS แบบแบตช์ของ Google จะคืนเสียงที่สร้างในคำตอบ
`generateContent` ที่เสร็จสมบูรณ์ สำหรับการสนทนาด้วยเสียงพูดที่มีความหน่วงต่ำที่สุด ให้ใช้
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
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS ใช้พรอมป์ภาษาธรรมชาติสำหรับการควบคุมสไตล์ ตั้งค่า
`audioProfile` เพื่อเติมพรอมป์สไตล์ที่ใช้ซ้ำได้ไว้ก่อนข้อความที่จะพูด ตั้งค่า
`speakerName` เมื่อข้อความพรอมป์ของคุณอ้างถึงผู้พูดที่มีชื่อ

Gemini API TTS ยังยอมรับแท็กเสียงแบบวงเล็บเหลี่ยมที่สื่ออารมณ์ในข้อความ
เช่น `[whispers]` หรือ `[laughs]` หากต้องการกันแท็กออกจากข้อความตอบกลับแชตที่มองเห็นได้
ขณะที่ส่งแท็กเหล่านั้นไปยัง TTS ให้ใส่ไว้ในบล็อก `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
API key ของ Google Cloud Console ที่จำกัดไว้สำหรับ Gemini API ใช้ได้กับ
ผู้ให้บริการนี้ นี่ไม่ใช่เส้นทาง Cloud Text-to-Speech API แยกต่างหาก
</Note>

## เสียงแบบเรียลไทม์

Plugin `google` ที่รวมมา ลงทะเบียนผู้ให้บริการเสียงแบบเรียลไทม์ที่รองรับด้วย
Gemini Live API สำหรับบริดจ์เสียงแบ็กเอนด์ เช่น Voice Call และ Google Meet

| การตั้งค่า               | พาธการกำหนดค่า                                                         | ค่าเริ่มต้น                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| โมเดล                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| เสียง                 | `...google.voice`                                                   | `Kore`                                                                                |
| อุณหภูมิ           | `...google.temperature`                                             | (ไม่ได้ตั้งค่า)                                                                               |
| ความไวเริ่มต้นของ VAD | `...google.startSensitivity`                                        | (ไม่ได้ตั้งค่า)                                                                               |
| ความไวสิ้นสุดของ VAD   | `...google.endSensitivity`                                          | (ไม่ได้ตั้งค่า)                                                                               |
| ระยะเวลาความเงียบ      | `...google.silenceDurationMs`                                       | (ไม่ได้ตั้งค่า)                                                                               |
| การจัดการกิจกรรม     | `...google.activityHandling`                                        | ค่าเริ่มต้นของ Google, `start-of-activity-interrupts`                                        |
| ความครอบคลุมของรอบสนทนา         | `...google.turnCoverage`                                            | ค่าเริ่มต้นของ Google, `only-activity`                                                       |
| ปิดใช้ VAD อัตโนมัติ      | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| การกลับมาทำงานต่อของเซสชัน    | `...google.sessionResumption`                                       | `true`                                                                                |
| การบีบอัดบริบท   | `...google.contextWindowCompression`                                | `true`                                                                                |
| คีย์ API               | `...google.apiKey`                                                  | ย้อนกลับไปใช้ `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` |

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
                voice: "Kore",
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
OpenClaw ปรับเสียงจากสะพาน telephony/Meet ให้เข้ากับสตรีม PCM Live API ของ Gemini และ
คงการเรียกใช้เครื่องมือไว้บนสัญญาเสียงเรียลไทม์ที่ใช้ร่วมกัน ปล่อย `temperature`
ไว้โดยไม่ตั้งค่า เว้นแต่คุณต้องเปลี่ยนการสุ่มตัวอย่าง; OpenClaw จะละเว้นค่าที่ไม่เป็นบวก
เพราะ Google Live อาจส่งคืนทรานสคริปต์โดยไม่มีเสียงสำหรับ `temperature: 0`
การถอดเสียง Gemini API เปิดใช้งานโดยไม่มี `languageCodes`; Google
SDK ปัจจุบันปฏิเสธคำใบ้รหัสภาษาบนพาธ API นี้
</Note>

<Note>
Control UI Talk รองรับเซสชันเบราว์เซอร์ Google Live ด้วยโทเค็นใช้ครั้งเดียวที่ถูกจำกัด
ผู้ให้บริการเสียงเรียลไทม์แบบแบ็กเอนด์เท่านั้นยังสามารถทำงานผ่านการขนส่งรีเลย์ Gateway
แบบทั่วไป ซึ่งเก็บข้อมูลรับรองผู้ให้บริการไว้บน Gateway
</Note>

สำหรับการตรวจสอบสดของผู้ดูแล ให้รัน
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
ส่วนของ Google จะสร้างโทเค็น Live API ที่ถูกจำกัดในรูปแบบเดียวกับที่ Control
UI Talk ใช้ เปิดปลายทาง WebSocket ของเบราว์เซอร์ ส่งเพย์โหลดตั้งค่าเริ่มต้น
และรอ `setupComplete`

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    สำหรับการรัน Gemini API โดยตรง (`api: "google-generative-ai"`), OpenClaw
    จะส่งแฮนเดิล `cachedContent` ที่กำหนดค่าไว้ต่อไปยังคำขอ Gemini

    - กำหนดค่าพารามิเตอร์ต่อโมเดลหรือแบบทั่วโลกด้วย
      `cachedContent` หรือ `cached_content` แบบเดิม
    - หากมีทั้งสองรายการ `cachedContent` จะมีผล
    - ค่าตัวอย่าง: `cachedContents/prebuilt-context`
    - การใช้งาน cache-hit ของ Gemini ถูกทำให้เป็นมาตรฐานเป็น OpenClaw `cacheRead` จาก
      `cachedContentTokenCount` ของ upstream

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

  <Accordion title="Gemini CLI JSON usage notes">
    เมื่อใช้ผู้ให้บริการ OAuth `google-gemini-cli`, OpenClaw จะทำให้
    เอาต์พุต JSON ของ CLI เป็นมาตรฐานดังนี้:

    - ข้อความตอบกลับมาจากฟิลด์ `response` ใน JSON ของ CLI
    - การใช้งานจะย้อนกลับไปใช้ `stats` เมื่อ CLI ปล่อย `usage` ว่างไว้
    - `stats.cached` ถูกทำให้เป็นมาตรฐานเป็น OpenClaw `cacheRead`
    - หาก `stats.input` หายไป OpenClaw จะหาโทเค็นอินพุตจาก
      `stats.input_tokens - stats.cached`

  </Accordion>

  <Accordion title="Environment and daemon setup">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า `GEMINI_API_KEY`
    พร้อมใช้งานสำหรับโปรเซสนั้น (ตัวอย่างเช่น ใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="Image generation" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือรูปภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Video generation" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Music generation" href="/th/tools/music-generation" icon="music">
    พารามิเตอร์เครื่องมือเพลงที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
</CardGroup>
