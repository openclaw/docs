---
read_when:
    - คุณต้องการใช้โมเดล Google Gemini กับ OpenClaw
    - คุณต้องมีคีย์ API หรือโฟลว์การยืนยันตัวตน OAuth
summary: การตั้งค่า Google Gemini (คีย์ API + OAuth, การสร้างภาพ, การทำความเข้าใจสื่อ, TTS, การค้นหาเว็บ)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-30T10:11:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea4b53dcea10fef67920da3baca4c85325ee4d4da780fbf708b67bc618e064a6
    source_path: providers/google.md
    workflow: 16
---

Plugin Google ให้การเข้าถึงโมเดล Gemini ผ่าน Google AI Studio รวมถึง
การสร้างภาพ, การทำความเข้าใจสื่อ (ภาพ/เสียง/วิดีโอ), การแปลงข้อความเป็นเสียง และการค้นหาเว็บผ่าน
Gemini Grounding

- ผู้ให้บริการ: `google`
- การยืนยันตัวตน: `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- API: Google Gemini API
- ตัวเลือก Runtime: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  ใช้ Gemini CLI OAuth ซ้ำ ขณะที่ยังคงให้การอ้างอิงโมเดลเป็นรูปแบบมาตรฐาน `google/*`

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
    ตัวแปรสภาพแวดล้อม `GEMINI_API_KEY` และ `GOOGLE_API_KEY` ใช้ได้ทั้งคู่ ใช้ตัวที่คุณตั้งค่าไว้แล้ว
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **เหมาะที่สุดสำหรับ:** การใช้ล็อกอิน Gemini CLI ที่มีอยู่ซ้ำผ่าน PKCE OAuth แทน API key แยกต่างหาก

    <Warning>
    ผู้ให้บริการ `google-gemini-cli` เป็นการผสานรวมที่ไม่เป็นทางการ ผู้ใช้บางราย
    รายงานข้อจำกัดบัญชีเมื่อใช้ OAuth ด้วยวิธีนี้ ใช้โดยยอมรับความเสี่ยงเอง
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

        OpenClaw รองรับทั้งการติดตั้งผ่าน Homebrew และการติดตั้ง npm แบบโกลบอล รวมถึง
        เลย์เอาต์ Windows/npm ที่พบบ่อย
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
    - Runtime: `google-gemini-cli`
    - Alias: `gemini-cli`

    รหัสโมเดล Gemini API ของ Gemini 3.1 Pro คือ `gemini-3.1-pro-preview` OpenClaw ยอมรับ `google/gemini-3.1-pro` ที่สั้นกว่าเป็น alias เพื่อความสะดวก และทำให้เป็นรูปแบบปกติก่อนเรียกผู้ให้บริการ

    **ตัวแปรสภาพแวดล้อม:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (หรือรูปแบบ `GEMINI_CLI_*`)

    <Note>
    หากคำขอ Gemini CLI OAuth ล้มเหลวหลังล็อกอิน ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ
    `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway แล้วลองอีกครั้ง
    </Note>

    <Note>
    หากการล็อกอินล้มเหลวก่อนเริ่มโฟลว์เบราว์เซอร์ ให้ตรวจสอบว่าคำสั่ง `gemini`
    ในเครื่องติดตั้งแล้วและอยู่บน `PATH`
    </Note>

    การอ้างอิงโมเดล `google-gemini-cli/*` เป็น alias เพื่อความเข้ากันได้แบบเดิม การกำหนดค่าใหม่
    ควรใช้การอ้างอิงโมเดล `google/*` ร่วมกับ Runtime `google-gemini-cli`
    เมื่อต้องการให้ Gemini CLI ทำงานในเครื่อง

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
| การคิด/การใช้เหตุผล     | ใช่ (Gemini 2.5+ / Gemini 3+) |
| โมเดล Gemma 4         | ใช่                           |

<Tip>
โมเดล Gemini 3 ใช้ `thinkingLevel` แทน `thinkingBudget` OpenClaw จับคู่
การควบคุมการใช้เหตุผลของ alias Gemini 3, Gemini 3.1 และ `gemini-*-latest` ไปยัง
`thinkingLevel` เพื่อให้การรันแบบเริ่มต้น/latency ต่ำไม่ส่งค่า
`thinkingBudget` ที่ปิดใช้งานอยู่

`/think adaptive` คงความหมายการคิดแบบไดนามิกของ Google ไว้แทนการเลือก
ระดับ OpenClaw แบบคงที่ Gemini 3 และ Gemini 3.1 จะไม่ส่ง `thinkingLevel` แบบคงที่เพื่อให้
Google เลือกระดับได้ ส่วน Gemini 2.5 ส่ง sentinel แบบไดนามิกของ Google
`thinkingBudget: -1`

โมเดล Gemma 4 (เช่น `gemma-4-26b-a4b-it`) รองรับโหมดการคิด OpenClaw
เขียน `thinkingBudget` ใหม่เป็น `thinkingLevel` ของ Google ที่รองรับสำหรับ Gemma 4
การตั้งค่าการคิดเป็น `off` จะคงการปิดใช้งานการคิดไว้แทนการจับคู่เป็น
`MINIMAL`
</Tip>

## การสร้างภาพ

ผู้ให้บริการสร้างภาพ `google` ที่บันเดิลมาด้วยมีค่าเริ่มต้นเป็น
`google/gemini-3.1-flash-image-preview`

- รองรับ `google/gemini-3-pro-image-preview` ด้วย
- สร้าง: สูงสุด 4 ภาพต่อคำขอ
- โหมดแก้ไข: เปิดใช้งานแล้ว, สูงสุด 5 ภาพอินพุต
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
ดู [การสร้างภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน, การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การสร้างวิดีโอ

Plugin `google` ที่บันเดิลมาด้วยยังลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือที่ใช้ร่วมกัน
`video_generate`

- โมเดลวิดีโอเริ่มต้น: `google/veo-3.1-fast-generate-preview`
- โหมด: โฟลว์ข้อความเป็นวิดีโอ, ภาพเป็นวิดีโอ และการอ้างอิงวิดีโอเดียว
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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน, การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การสร้างเพลง

Plugin `google` ที่บันเดิลมาด้วยยังลงทะเบียนการสร้างเพลงผ่านเครื่องมือที่ใช้ร่วมกัน
`music_generate`

- โมเดลเพลงเริ่มต้น: `google/lyria-3-clip-preview`
- รองรับ `google/lyria-3-pro-preview` ด้วย
- การควบคุมพรอมต์: `lyrics` และ `instrumental`
- รูปแบบเอาต์พุต: `mp3` โดยค่าเริ่มต้น และ `wav` บน `google/lyria-3-pro-preview`
- อินพุตอ้างอิง: สูงสุด 10 ภาพ
- การรันที่มีเซสชันรองรับจะแยกตัวผ่านโฟลว์งาน/สถานะที่ใช้ร่วมกัน รวมถึง `action: "status"`

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
ดู [การสร้างเพลง](/th/tools/music-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน, การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การแปลงข้อความเป็นเสียง

ผู้ให้บริการเสียงพูด `google` ที่บันเดิลมาด้วยใช้เส้นทาง Gemini API TTS พร้อม
`gemini-3.1-flash-tts-preview`

- เสียงเริ่มต้น: `Kore`
- การยืนยันตัวตน: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- เอาต์พุต: WAV สำหรับไฟล์แนบ TTS ปกติ, Opus สำหรับเป้าหมาย voice-note, PCM สำหรับ Talk/โทรศัพท์
- เอาต์พุต voice-note: Google PCM ถูกห่อเป็น WAV และแปลงเป็น Opus 48 kHz ด้วย `ffmpeg`

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

Gemini API TTS ใช้พรอมต์ภาษาธรรมชาติเพื่อควบคุมสไตล์ ตั้งค่า
`audioProfile` เพื่อเติมพรอมต์สไตล์ที่ใช้ซ้ำได้ก่อนข้อความพูด ตั้งค่า
`speakerName` เมื่อข้อความพรอมต์ของคุณอ้างถึงผู้พูดที่มีชื่อ

Gemini API TTS ยังรับแท็กเสียงในวงเล็บเหลี่ยมที่สื่ออารมณ์ในข้อความได้ด้วย
เช่น `[whispers]` หรือ `[laughs]` หากต้องการกันแท็กออกจากข้อความตอบกลับแชตที่มองเห็น
ขณะที่ยังส่งไปยัง TTS ให้ใส่ไว้ในบล็อก `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
API key ของ Google Cloud Console ที่จำกัดไว้สำหรับ Gemini API ใช้ได้กับ
ผู้ให้บริการนี้ นี่ไม่ใช่เส้นทาง Cloud Text-to-Speech API แยกต่างหาก
</Note>

## เสียงแบบเรียลไทม์

Plugin `google` ที่บันเดิลมาด้วยลงทะเบียนผู้ให้บริการเสียงแบบเรียลไทม์ที่รองรับโดย
Gemini Live API สำหรับบริดจ์เสียงฝั่งแบ็กเอนด์ เช่น Voice Call และ Google Meet

| การตั้งค่า               | เส้นทางการกำหนดค่า                                                         | ค่าเริ่มต้น                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| โมเดล                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| เสียง                 | `...google.voice`                                                   | `Kore`                                                                                |
| อุณหภูมิ           | `...google.temperature`                                             | (ไม่ได้ตั้งค่า)                                                                               |
| ความไวเริ่มต้น VAD | `...google.startSensitivity`                                        | (ไม่ได้ตั้งค่า)                                                                               |
| ความไวสิ้นสุด VAD   | `...google.endSensitivity`                                          | (ไม่ได้ตั้งค่า)                                                                               |
| ระยะเวลาความเงียบ      | `...google.silenceDurationMs`                                       | (ไม่ได้ตั้งค่า)                                                                               |
| การจัดการกิจกรรม     | `...google.activityHandling`                                        | ค่าเริ่มต้นของ Google, `start-of-activity-interrupts`                                        |
| การครอบคลุมเทิร์น         | `...google.turnCoverage`                                            | ค่าเริ่มต้นของ Google, `only-activity`                                                       |
| ปิดใช้งาน VAD อัตโนมัติ      | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| API key               | `...google.apiKey`                                                  | ถอยกลับไปใช้ `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` |

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
Google Live API ใช้เสียงแบบสองทิศทางและการเรียกฟังก์ชันผ่าน WebSocket
OpenClaw ปรับเสียงจากบริดจ์โทรศัพท์/Meet ให้เข้ากับสตรีม PCM Live API ของ Gemini และ
คงการเรียกเครื่องมือไว้บนสัญญาเสียงเรียลไทม์ที่ใช้ร่วมกัน ปล่อย `temperature`
ให้ไม่ได้ตั้งค่าไว้ เว้นแต่คุณต้องการเปลี่ยนการสุ่มตัวอย่าง; OpenClaw ละเว้นค่าที่ไม่เป็นบวก
เพราะ Google Live อาจส่งทรานสคริปต์กลับมาโดยไม่มีเสียงสำหรับ `temperature: 0`
การถอดเสียงของ Gemini API เปิดใช้โดยไม่มี `languageCodes`; Google
SDK ปัจจุบันปฏิเสธคำใบ้รหัสภาษาบนเส้นทาง API นี้
</Note>

<Note>
Control UI Talk รองรับเซสชัน Google Live บนเบราว์เซอร์ด้วยโทเค็นแบบใช้ครั้งเดียว
ที่ถูกจำกัด ผู้ให้บริการเสียงเรียลไทม์แบบแบ็กเอนด์เท่านั้นยังสามารถทำงานผ่านทรานสปอร์ต
รีเลย์ Gateway ทั่วไปได้ด้วย ซึ่งเก็บข้อมูลประจำตัวของผู้ให้บริการไว้บน Gateway
</Note>

สำหรับการตรวจสอบแบบสดของผู้ดูแล ให้รัน
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
ฝั่ง Google จะสร้างโทเค็น Live API แบบจำกัดในรูปแบบเดียวกับที่ Control
UI Talk ใช้ เปิดปลายทาง WebSocket ของเบราว์เซอร์ ส่งเพย์โหลดการตั้งค่าเริ่มต้น
และรอ `setupComplete`

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การใช้แคช Gemini โดยตรงซ้ำ">
    สำหรับการรัน Gemini API โดยตรง (`api: "google-generative-ai"`), OpenClaw
    ส่งแฮนเดิล `cachedContent` ที่กำหนดค่าไว้ต่อไปยังคำขอ Gemini

    - กำหนดค่าพารามิเตอร์ต่อโมเดลหรือแบบส่วนกลางด้วย
      `cachedContent` หรือ `cached_content` แบบเดิม
    - หากมีทั้งสองค่า `cachedContent` จะมีผลก่อน
    - ค่าตัวอย่าง: `cachedContents/prebuilt-context`
    - การใช้งานแคชฮิตของ Gemini จะถูกทำให้เป็นมาตรฐานเป็น `cacheRead` ของ OpenClaw จาก
      `cachedContentTokenCount` จากต้นทาง

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

  <Accordion title="หมายเหตุการใช้งาน JSON ของ Gemini CLI">
    เมื่อใช้ผู้ให้บริการ OAuth `google-gemini-cli` OpenClaw จะทำให้เอาต์พุต
    JSON ของ CLI เป็นมาตรฐานดังนี้:

    - ข้อความตอบกลับมาจากฟิลด์ `response` ใน JSON ของ CLI
    - การใช้งานจะถอยกลับไปใช้ `stats` เมื่อ CLI ปล่อย `usage` ว่างไว้
    - `stats.cached` จะถูกทำให้เป็นมาตรฐานเป็น `cacheRead` ของ OpenClaw
    - หากไม่มี `stats.input` OpenClaw จะหาโทเค็นอินพุตจาก
      `stats.input_tokens - stats.cached`

  </Accordion>

  <Accordion title="การตั้งค่าสภาพแวดล้อมและ daemon">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) โปรดตรวจสอบให้แน่ใจว่า `GEMINI_API_KEY`
    พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับเมื่อขัดข้อง
  </Card>
  <Card title="การสร้างรูปภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือรูปภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างเพลง" href="/th/tools/music-generation" icon="music">
    พารามิเตอร์เครื่องมือเพลงที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
</CardGroup>
