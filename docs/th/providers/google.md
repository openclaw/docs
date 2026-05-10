---
read_when:
    - คุณต้องการใช้โมเดล Google Gemini กับ OpenClaw
    - คุณต้องมีคีย์ API หรือโฟลว์การยืนยันตัวตน OAuth
summary: การตั้งค่า Google Gemini (คีย์ API + OAuth, การสร้างรูปภาพ, การทำความเข้าใจสื่อ, TTS, การค้นหาเว็บ)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-10T19:54:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd61383edad3192577d37c9a706470828d59edd5a187ef4f3c30985afaf46167
    source_path: providers/google.md
    workflow: 16
---

Plugin ของ Google ให้การเข้าถึงโมเดล Gemini ผ่าน Google AI Studio รวมถึง
การสร้างภาพ การทำความเข้าใจสื่อ (ภาพ/เสียง/วิดีโอ), text-to-speech และการค้นเว็บผ่าน
Gemini Grounding

- ผู้ให้บริการ: `google`
- การยืนยันตัวตน: `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- API: Google Gemini API
- ตัวเลือกรันไทม์: ผู้ให้บริการ/โมเดล `agentRuntime.id: "google-gemini-cli"`
  ใช้ OAuth ของ Gemini CLI ซ้ำ โดยยังคงให้การอ้างอิงโมเดลเป็นแบบ canonical ในรูป `google/*`

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="คีย์ API">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง Gemini API มาตรฐานผ่าน Google AI Studio

    <Steps>
      <Step title="เรียกใช้การเริ่มใช้งาน">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        หรือส่งคีย์เข้าไปโดยตรง:

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
    รองรับตัวแปรสภาพแวดล้อมทั้ง `GEMINI_API_KEY` และ `GOOGLE_API_KEY` ใช้ตัวใดก็ได้ที่คุณตั้งค่าไว้แล้ว
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **เหมาะที่สุดสำหรับ:** การใช้การเข้าสู่ระบบ Gemini CLI ที่มีอยู่ซ้ำผ่าน PKCE OAuth แทนคีย์ API แยกต่างหาก

    <Warning>
    ผู้ให้บริการ `google-gemini-cli` เป็นการผสานการทำงานแบบไม่เป็นทางการ ผู้ใช้บางราย
    รายงานข้อจำกัดของบัญชีเมื่อใช้ OAuth ด้วยวิธีนี้ ใช้งานโดยยอมรับความเสี่ยงเอง
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
        เลย์เอาต์ Windows/npm ที่พบบ่อย
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

    รหัสโมเดล Gemini API ของ Gemini 3.1 Pro คือ `gemini-3.1-pro-preview` OpenClaw รองรับรูปแบบที่สั้นกว่า `google/gemini-3.1-pro` เป็นนามแฝงเพื่อความสะดวก และทำให้เป็นรูปแบบปกติก่อนเรียกผู้ให้บริการ

    **ตัวแปรสภาพแวดล้อม:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (หรือรูปแบบ `GEMINI_CLI_*`)

    <Note>
    หากคำขอ Gemini CLI OAuth ล้มเหลวหลังจากเข้าสู่ระบบ ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ
    `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway แล้วลองอีกครั้ง
    </Note>

    <Note>
    หากการเข้าสู่ระบบล้มเหลวก่อนเริ่มโฟลว์ของเบราว์เซอร์ ให้ตรวจสอบว่าคำสั่ง `gemini`
    ในเครื่องได้รับการติดตั้งและอยู่บน `PATH`
    </Note>

    การอ้างอิงโมเดล `google-gemini-cli/*` เป็นนามแฝงสำหรับความเข้ากันได้กับระบบเดิม การกำหนดค่าใหม่
    ควรใช้การอ้างอิงโมเดล `google/*` ร่วมกับรันไทม์ `google-gemini-cli`
    เมื่อต้องการการเรียกใช้ Gemini CLI ในเครื่อง

  </Tab>
</Tabs>

## ความสามารถ

| ความสามารถ             | รองรับ                     |
| ---------------------- | ----------------------------- |
| การเติมเต็มแชต       | ใช่                           |
| การสร้างภาพ       | ใช่                           |
| การสร้างเพลง       | ใช่                           |
| Text-to-speech         | ใช่                           |
| เสียงแบบเรียลไทม์         | ใช่ (Google Live API)         |
| การทำความเข้าใจภาพ    | ใช่                           |
| การถอดเสียง    | ใช่                           |
| การทำความเข้าใจวิดีโอ    | ใช่                           |
| การค้นเว็บ (Grounding) | ใช่                           |
| การคิด/การให้เหตุผล     | ใช่ (Gemini 2.5+ / Gemini 3+) |
| โมเดล Gemma 4         | ใช่                           |

## การค้นเว็บ

ผู้ให้บริการค้นเว็บ `gemini` ที่มาพร้อมกันใช้ Gemini Google Search grounding
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

ลำดับความสำคัญของข้อมูลประจำตัวคือ `webSearch.apiKey` เฉพาะ จากนั้น `GEMINI_API_KEY`
แล้วจึง `models.providers.google.apiKey` `webSearch.baseUrl` เป็นตัวเลือกเสริมและ
มีไว้สำหรับพร็อกซีของผู้ปฏิบัติงานหรือเอนด์พอยต์ Gemini API ที่เข้ากันได้ เมื่อไม่ได้ระบุ
การค้นเว็บ Gemini จะใช้ `models.providers.google.baseUrl` ซ้ำ ดู
[การค้นหา Gemini](/th/tools/gemini-search) สำหรับพฤติกรรมเครื่องมือเฉพาะผู้ให้บริการ

<Tip>
โมเดล Gemini 3 ใช้ `thinkingLevel` แทน `thinkingBudget` OpenClaw จับคู่
ตัวควบคุมการให้เหตุผลของ Gemini 3, Gemini 3.1 และนามแฝง `gemini-*-latest` ไปยัง
`thinkingLevel` เพื่อให้การรันแบบเริ่มต้น/ความหน่วงต่ำไม่ส่งค่า
`thinkingBudget` ที่ปิดใช้งานอยู่

`/think adaptive` คงความหมายของการคิดแบบไดนามิกของ Google ไว้แทนการเลือก
ระดับ OpenClaw คงที่ Gemini 3 และ Gemini 3.1 จะละ `thinkingLevel` แบบคงที่ เพื่อให้
Google เลือกระดับได้ ส่วน Gemini 2.5 จะส่ง sentinel แบบไดนามิกของ Google
`thinkingBudget: -1`

โมเดล Gemma 4 (เช่น `gemma-4-26b-a4b-it`) รองรับโหมดการคิด OpenClaw
เขียน `thinkingBudget` ใหม่เป็น `thinkingLevel` ของ Google ที่รองรับสำหรับ Gemma 4
การตั้งค่าการคิดเป็น `off` จะคงการปิดใช้งานการคิดไว้ แทนการจับคู่เป็น
`MINIMAL`
</Tip>

## การสร้างภาพ

ผู้ให้บริการสร้างภาพ `google` ที่มาพร้อมกันมีค่าเริ่มต้นเป็น
`google/gemini-3.1-flash-image-preview`

- รองรับ `google/gemini-3-pro-image-preview` ด้วย
- สร้าง: สูงสุด 4 ภาพต่อคำขอ
- โหมดแก้ไข: เปิดใช้งาน สูงสุด 5 ภาพอินพุต
- ตัวควบคุมเรขาคณิต: `size`, `aspectRatio` และ `resolution`

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
ดู [การสร้างภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การสร้างวิดีโอ

Plugin `google` ที่มาพร้อมกันยังลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือร่วม
`video_generate`

- โมเดลวิดีโอเริ่มต้น: `google/veo-3.1-fast-generate-preview`
- โหมด: text-to-video, image-to-video และโฟลว์อ้างอิงวิดีโอเดียว
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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การสร้างเพลง

Plugin `google` ที่มาพร้อมกันยังลงทะเบียนการสร้างเพลงผ่านเครื่องมือร่วม
`music_generate`

- โมเดลเพลงเริ่มต้น: `google/lyria-3-clip-preview`
- รองรับ `google/lyria-3-pro-preview` ด้วย
- ตัวควบคุมพรอมป์: `lyrics` และ `instrumental`
- รูปแบบเอาต์พุต: ค่าเริ่มต้นคือ `mp3` และมี `wav` บน `google/lyria-3-pro-preview`
- อินพุตอ้างอิง: สูงสุด 10 ภาพ
- การรันที่มีเซสชันรองรับจะแยกออกผ่านโฟลว์งาน/สถานะร่วม รวมถึง `action: "status"`

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
ดู [การสร้างเพลง](/th/tools/music-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## Text-to-speech

ผู้ให้บริการเสียงพูด `google` ที่มาพร้อมกันใช้เส้นทาง Gemini API TTS กับ
`gemini-3.1-flash-tts-preview`

- เสียงเริ่มต้น: `Kore`
- การยืนยันตัวตน: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- เอาต์พุต: WAV สำหรับไฟล์แนบ TTS ทั่วไป, Opus สำหรับเป้าหมายข้อความเสียง, PCM สำหรับ Talk/โทรศัพท์
- เอาต์พุตข้อความเสียง: Google PCM จะถูกห่อเป็น WAV และแปลงรหัสเป็น Opus 48 kHz ด้วย `ffmpeg`

เส้นทาง Gemini TTS แบบ batch ของ Google ส่งคืนเสียงที่สร้างขึ้นในคำตอบ
`generateContent` ที่เสร็จสมบูรณ์ สำหรับการสนทนาแบบพูดที่มีความหน่วงต่ำที่สุด ให้ใช้
ผู้ให้บริการเสียงแบบเรียลไทม์ของ Google ที่รองรับโดย Gemini Live API แทน batch
TTS

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

Gemini API TTS ใช้การพรอมป์ด้วยภาษาธรรมชาติเพื่อควบคุมสไตล์ ตั้งค่า
`audioProfile` เพื่อเติมพรอมป์สไตล์ที่ใช้ซ้ำได้ก่อนข้อความที่จะพูด ตั้งค่า
`speakerName` เมื่อข้อความพรอมป์ของคุณอ้างถึงผู้พูดที่มีชื่อ

Gemini API TTS ยังยอมรับแท็กเสียงในวงเล็บเหลี่ยมที่สื่ออารมณ์ในข้อความ
เช่น `[whispers]` หรือ `[laughs]` เพื่อกันแท็กออกจากคำตอบแชตที่มองเห็น
ขณะที่ส่งแท็กเหล่านั้นไปยัง TTS ให้วางไว้ในบล็อก `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
คีย์ API ของ Google Cloud Console ที่จำกัดไว้เฉพาะ Gemini API ใช้ได้กับ
ผู้ให้บริการนี้ นี่ไม่ใช่เส้นทาง Cloud Text-to-Speech API แยกต่างหาก
</Note>

## เสียงแบบเรียลไทม์

Plugin `google` ที่มาพร้อมกันลงทะเบียนผู้ให้บริการเสียงแบบเรียลไทม์ที่รองรับโดย
Gemini Live API สำหรับบริดจ์เสียงแบ็กเอนด์ เช่น Voice Call และ Google Meet

| การตั้งค่า            | เส้นทาง Config                                                       | ค่าเริ่มต้น                                                                            |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| โมเดล                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| เสียง                 | `...google.voice`                                                   | `Kore`                                                                                |
| Temperature           | `...google.temperature`                                             | (ไม่ได้ตั้งค่า)                                                                        |
| ความไวเมื่อเริ่ม VAD | `...google.startSensitivity`                                        | (ไม่ได้ตั้งค่า)                                                                        |
| ความไวเมื่อสิ้นสุด VAD | `...google.endSensitivity`                                          | (ไม่ได้ตั้งค่า)                                                                        |
| ระยะเวลาเงียบ        | `...google.silenceDurationMs`                                       | (ไม่ได้ตั้งค่า)                                                                        |
| การจัดการกิจกรรม     | `...google.activityHandling`                                        | ค่าเริ่มต้นของ Google, `start-of-activity-interrupts`                                 |
| ความครอบคลุมของเทิร์น | `...google.turnCoverage`                                            | ค่าเริ่มต้นของ Google, `only-activity`                                                |
| ปิดใช้งาน VAD อัตโนมัติ | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| การกลับมาใช้เซสชันต่อ | `...google.sessionResumption`                                       | `true`                                                                                |
| การบีบอัดบริบท       | `...google.contextWindowCompression`                                | `true`                                                                                |
| คีย์ API              | `...google.apiKey`                                                  | ย้อนกลับไปใช้ `models.providers.google.apiKey`, `GEMINI_API_KEY`, หรือ `GOOGLE_API_KEY` |

ตัวอย่าง config แบบ realtime ของ Voice Call:

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
คงการเรียกใช้เครื่องมือไว้บนสัญญาเสียง realtime ที่ใช้ร่วมกัน ปล่อย `temperature`
ให้ไม่ได้ตั้งค่าไว้ เว้นแต่คุณต้องการเปลี่ยนการสุ่มตัวอย่าง; OpenClaw จะละเว้นค่าที่ไม่เป็นบวก
เพราะ Google Live อาจส่งคืนทรานสคริปต์โดยไม่มีเสียงสำหรับ `temperature: 0`
การถอดเสียงของ Gemini API เปิดใช้งานโดยไม่มี `languageCodes`; Google
SDK ปัจจุบันปฏิเสธคำใบ้รหัสภาษาในเส้นทาง API นี้
</Note>

<Note>
Control UI Talk รองรับเซสชันเบราว์เซอร์ของ Google Live ด้วยโทเค็นแบบใช้ครั้งเดียวที่มีข้อจำกัด
ผู้ให้บริการเสียง realtime แบบ backend-only ยังสามารถทำงานผ่านทรานสปอร์ตรีเลย์ทั่วไปของ
Gateway ได้ด้วย ซึ่งเก็บข้อมูลประจำตัวของผู้ให้บริการไว้บน Gateway
</Note>

สำหรับการตรวจสอบ live ของผู้ดูแล ให้รัน
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
smoke ยังครอบคลุมเส้นทาง OpenAI backend/WebRTC ด้วย; ส่วนของ Google สร้างโทเค็น
Live API แบบมีข้อจำกัดรูปแบบเดียวกับที่ Control UI Talk ใช้ เปิด endpoint
WebSocket ของเบราว์เซอร์ ส่ง payload การตั้งค่าเริ่มต้น และรอ
`setupComplete`

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การใช้แคช Gemini โดยตรงซ้ำ">
    สำหรับการรัน Gemini API โดยตรง (`api: "google-generative-ai"`), OpenClaw
    ส่ง handle `cachedContent` ที่กำหนดค่าไว้ต่อไปยังคำขอของ Gemini

    - กำหนดค่าพารามิเตอร์ต่อโมเดลหรือแบบ global ด้วย
      `cachedContent` หรือ `cached_content` เดิม
    - หากมีทั้งสองรายการ `cachedContent` จะชนะ
    - ค่าตัวอย่าง: `cachedContents/prebuilt-context`
    - การใช้งาน cache-hit ของ Gemini ถูกปรับให้อยู่ในรูป OpenClaw `cacheRead` จาก
      `cachedContentTokenCount` ฝั่ง upstream

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
    เมื่อใช้ผู้ให้บริการ OAuth `google-gemini-cli`, OpenClaw จะปรับรูปแบบ
    เอาต์พุต JSON ของ CLI ดังนี้:

    - ข้อความตอบกลับมาจากฟิลด์ `response` ของ JSON ของ CLI
    - การใช้งานย้อนกลับไปใช้ `stats` เมื่อ CLI ปล่อย `usage` ว่างไว้
    - `stats.cached` ถูกปรับให้อยู่ในรูป OpenClaw `cacheRead`
    - หาก `stats.input` หายไป OpenClaw จะคำนวณโทเค็นอินพุตจาก
      `stats.input_tokens - stats.cached`

  </Accordion>

  <Accordion title="การตั้งค่าสภาพแวดล้อมและ daemon">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd), ตรวจสอบให้แน่ใจว่า `GEMINI_API_KEY`
    พร้อมใช้งานสำหรับโปรเซสนั้น (ตัวอย่างเช่น ใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model refs, และพฤติกรรม failover
  </Card>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างเพลง" href="/th/tools/music-generation" icon="music">
    พารามิเตอร์เครื่องมือเพลงที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
</CardGroup>
