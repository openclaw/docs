---
read_when:
    - คุณต้องการใช้โมเดล Google Gemini กับ OpenClaw
    - คุณต้องใช้ API key หรือขั้นตอนการยืนยันตัวตนแบบ OAuth
summary: การตั้งค่า Google Gemini (API key + OAuth, การสร้างภาพ, การทำความเข้าใจสื่อ, TTS, การค้นหาเว็บ)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-25T13:57:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: de0d6563d1c7a25fe26aa7ce255b1d3ed80e950b7761039e6d0a76f23a14e6f3
    source_path: providers/google.md
    workflow: 15
---

Plugin Google ให้การเข้าถึงโมเดล Gemini ผ่าน Google AI Studio รวมถึง
การสร้างภาพ การทำความเข้าใจสื่อ (ภาพ/เสียง/วิดีโอ) การแปลงข้อความเป็นเสียงพูด และการค้นหาเว็บผ่าน
Gemini Grounding

- ผู้ให้บริการ: `google`
- การยืนยันตัวตน: `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- API: Google Gemini API
- ตัวเลือกระหว่างรันไทม์: `agents.defaults.embeddedHarness.runtime: "google-gemini-cli"`
  จะนำ OAuth ของ Gemini CLI กลับมาใช้ซ้ำ โดยยังคงการอ้างอิงโมเดลแบบ canonical เป็น `google/*`

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="API key">
    **เหมาะสำหรับ:** การเข้าถึง Gemini API มาตรฐานผ่าน Google AI Studio

    <Steps>
      <Step title="เรียกใช้ onboarding">
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
    ยอมรับตัวแปร environment ทั้ง `GEMINI_API_KEY` และ `GOOGLE_API_KEY` คุณสามารถใช้ตัวที่ตั้งค่าไว้แล้วได้เลย
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **เหมาะสำหรับ:** การนำการล็อกอิน Gemini CLI ที่มีอยู่กลับมาใช้ซ้ำผ่าน PKCE OAuth แทนการใช้ API key แยกต่างหาก

    <Warning>
    ผู้ให้บริการ `google-gemini-cli` เป็นการเชื่อมต่อแบบไม่เป็นทางการ ผู้ใช้บางราย
    รายงานว่าพบบัญชีถูกจำกัดเมื่อใช้ OAuth ในลักษณะนี้ ใช้งานโดยยอมรับความเสี่ยงเอง
    </Warning>

    <Steps>
      <Step title="ติดตั้ง Gemini CLI">
        ต้องมีคำสั่ง `gemini` ในเครื่องและเข้าถึงได้ผ่าน `PATH`

        ```bash
        # Homebrew
        brew install gemini-cli

        # หรือ npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw รองรับทั้งการติดตั้งผ่าน Homebrew และการติดตั้ง npm แบบ global รวมถึง
        เลย์เอาต์ทั่วไปของ Windows/npm
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
    - Runtime: `google-gemini-cli`
    - ชื่อแทน: `gemini-cli`

    **ตัวแปร environment:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (หรือรูปแบบ `GEMINI_CLI_*`)

    <Note>
    หากคำขอ OAuth ของ Gemini CLI ล้มเหลวหลังจากล็อกอินแล้ว ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ
    `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ gateway แล้วลองใหม่
    </Note>

    <Note>
    หากการล็อกอินล้มเหลวก่อนเริ่มขั้นตอนในเบราว์เซอร์ ให้ตรวจสอบว่ามีการติดตั้งคำสั่ง `gemini`
    ในเครื่องและอยู่ใน `PATH`
    </Note>

    การอ้างอิงโมเดล `google-gemini-cli/*` เป็นชื่อแทนเพื่อความเข้ากันได้แบบเดิม การกำหนดค่าใหม่
    ควรใช้การอ้างอิงโมเดล `google/*` ร่วมกับ runtime `google-gemini-cli`
    เมื่อต้องการให้ Gemini CLI ทำงานในเครื่อง

  </Tab>
</Tabs>

## ความสามารถ

| ความสามารถ            | รองรับ                           |
| --------------------- | -------------------------------- |
| Chat completions      | ใช่                              |
| Image generation      | ใช่                              |
| Music generation      | ใช่                              |
| Text-to-speech        | ใช่                              |
| Realtime voice        | ใช่ (Google Live API)            |
| Image understanding   | ใช่                              |
| Audio transcription   | ใช่                              |
| Video understanding   | ใช่                              |
| Web search (Grounding) | ใช่                             |
| Thinking/reasoning    | ใช่ (Gemini 2.5+ / Gemini 3+)    |
| Gemma 4 models        | ใช่                              |

<Tip>
โมเดล Gemini 3 ใช้ `thinkingLevel` แทน `thinkingBudget` OpenClaw จะแมป
ตัวควบคุมการให้เหตุผลของ Gemini 3, Gemini 3.1 และชื่อแทน `gemini-*-latest` ไปเป็น
`thinkingLevel` เพื่อให้การรันแบบค่าเริ่มต้น/หน่วงต่ำไม่ส่งค่า
`thinkingBudget` ที่ถูกปิดใช้งาน

`/think adaptive` จะคง semantics ของ dynamic thinking ของ Google ไว้ แทนการเลือก
ระดับแบบตายตัวของ OpenClaw Gemini 3 และ Gemini 3.1 จะไม่ส่ง `thinkingLevel` แบบคงที่ เพื่อให้
Google เป็นผู้เลือกระดับเอง ส่วน Gemini 2.5 จะส่งค่า sentinel แบบ dynamic ของ Google คือ
`thinkingBudget: -1`

โมเดล Gemma 4 (เช่น `gemma-4-26b-a4b-it`) รองรับโหมดคิด OpenClaw
จะเขียน `thinkingBudget` ใหม่ให้เป็น `thinkingLevel` ของ Google ที่รองรับสำหรับ Gemma 4
การตั้งค่า thinking เป็น `off` จะคงสถานะปิดโหมดคิดไว้ แทนที่จะแมปเป็น
`MINIMAL`
</Tip>

## การสร้างภาพ

ผู้ให้บริการสร้างภาพ `google` ที่มาพร้อมกันจะใช้ค่าเริ่มต้นเป็น
`google/gemini-3.1-flash-image-preview`

- รองรับ `google/gemini-3-pro-image-preview` ด้วย
- สร้างได้: สูงสุด 4 ภาพต่อคำขอ
- โหมดแก้ไข: เปิดใช้งาน สูงสุด 5 ภาพอินพุต
- ตัวควบคุมรูปทรงเรขาคณิต: `size`, `aspectRatio` และ `resolution`

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
ดู [Image Generation](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การสร้างวิดีโอ

Plugin `google` ที่มาพร้อมกันยังลงทะเบียนการสร้างวิดีโอผ่าน
เครื่องมือ `video_generate` ที่ใช้ร่วมกันด้วย

- โมเดลวิดีโอเริ่มต้น: `google/veo-3.1-fast-generate-preview`
- โหมด: text-to-video, image-to-video และโฟลว์อ้างอิงวิดีโอเดี่ยว
- รองรับ `aspectRatio`, `resolution` และ `audio`
- ข้อจำกัดระยะเวลาปัจจุบัน: **4 ถึง 8 วินาที**

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
ดู [Video Generation](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การสร้างเพลง

Plugin `google` ที่มาพร้อมกันยังลงทะเบียนการสร้างเพลงผ่าน
เครื่องมือ `music_generate` ที่ใช้ร่วมกันด้วย

- โมเดลเพลงเริ่มต้น: `google/lyria-3-clip-preview`
- รองรับ `google/lyria-3-pro-preview` ด้วย
- ตัวควบคุม prompt: `lyrics` และ `instrumental`
- รูปแบบเอาต์พุต: `mp3` โดยค่าเริ่มต้น และ `wav` บน `google/lyria-3-pro-preview`
- อินพุตอ้างอิง: สูงสุด 10 ภาพ
- การรันที่มี session รองรับการแยกงานผ่านโฟลว์ task/status ที่ใช้ร่วมกัน รวมถึง `action: "status"`

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
ดู [Music Generation](/th/tools/music-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การแปลงข้อความเป็นเสียงพูด

ผู้ให้บริการเสียงพูด `google` ที่มาพร้อมกันใช้เส้นทาง TTS ของ Gemini API ร่วมกับ
`gemini-3.1-flash-tts-preview`

- เสียงเริ่มต้น: `Kore`
- การยืนยันตัวตน: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- เอาต์พุต: WAV สำหรับไฟล์แนบ TTS ปกติ, PCM สำหรับ Talk/โทรศัพท์
- เอาต์พุตข้อความเสียงแบบเนทีฟ: ไม่รองรับบนเส้นทาง Gemini API นี้ เพราะ API ส่งกลับเป็น PCM แทน Opus

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

TTS ของ Gemini API ใช้ prompt ภาษาธรรมชาติสำหรับควบคุมสไตล์ กำหนด
`audioProfile` เพื่อเติม prompt สไตล์ที่ใช้ซ้ำได้ไว้ก่อนข้อความที่จะพูด กำหนด
`speakerName` เมื่อข้อความ prompt ของคุณอ้างถึงผู้พูดที่มีชื่อ

TTS ของ Gemini API ยังรองรับแท็กเสียงแบบใส่อารมณ์ในวงเล็บเหลี่ยมภายในข้อความ
เช่น `[whispers]` หรือ `[laughs]` หากต้องการไม่ให้แท็กปรากฏในข้อความตอบกลับที่มองเห็นได้
แต่ยังส่งไปยัง TTS ให้ใส่แท็กไว้ในบล็อก `[[tts:text]]...[[/tts:text]]`

```text
นี่คือข้อความตอบกลับแบบสะอาด

[[tts:text]][whispers] นี่คือเวอร์ชันที่ถูกพูดออกเสียง[[/tts:text]]
```

<Note>
Google Cloud Console API key ที่จำกัดสิทธิ์ไว้เฉพาะ Gemini API ใช้ได้กับ
ผู้ให้บริการนี้ นี่ไม่ใช่เส้นทาง Cloud Text-to-Speech API ที่แยกต่างหาก
</Note>

## เสียงแบบเรียลไทม์

Plugin `google` ที่มาพร้อมกันจะลงทะเบียนผู้ให้บริการเสียงแบบเรียลไทม์ซึ่งทำงานบน
Gemini Live API สำหรับสะพานเชื่อมเสียงฝั่งแบ็กเอนด์ เช่น Voice Call และ Google Meet

| การตั้งค่า            | พาธการกำหนดค่า                                                   | ค่าเริ่มต้น                                                                            |
| --------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| โมเดล                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                        |
| เสียง                 | `...google.voice`                                                 | `Kore`                                                                                 |
| Temperature           | `...google.temperature`                                           | (ไม่ได้ตั้งค่า)                                                                        |
| ความไวเริ่มต้นของ VAD | `...google.startSensitivity`                                      | (ไม่ได้ตั้งค่า)                                                                        |
| ความไวสิ้นสุดของ VAD | `...google.endSensitivity`                                        | (ไม่ได้ตั้งค่า)                                                                        |
| ระยะเวลาเงียบ         | `...google.silenceDurationMs`                                     | (ไม่ได้ตั้งค่า)                                                                        |
| API key               | `...google.apiKey`                                                | ใช้ `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` เป็นค่าตกทอด |

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
OpenClaw จะปรับเสียงจากสะพานเชื่อม telephony/Meet ให้เข้ากับสตรีม PCM Live API ของ Gemini และ
คงการเรียกใช้เครื่องมือไว้บนสัญญา realtime voice ที่ใช้ร่วมกัน ปล่อย `temperature`
ว่างไว้ เว้นแต่คุณต้องการเปลี่ยนการสุ่มตัวอย่าง OpenClaw จะไม่ส่งค่าที่ไม่เป็นบวก
เพราะ Google Live อาจส่งข้อความถอดเสียงกลับมาโดยไม่มีเสียงเมื่อใช้ `temperature: 0`
การถอดเสียงของ Gemini API จะเปิดใช้งานโดยไม่ใช้ `languageCodes`; ปัจจุบัน Google SDK
ปฏิเสธคำใบ้รหัสภาษาบนเส้นทาง API นี้
</Note>

<Note>
เซสชัน Talk ของ Control UI บนเบราว์เซอร์ยังคงต้องใช้ผู้ให้บริการเสียงแบบเรียลไทม์ที่มีการติดตั้งเซสชัน WebRTC บนเบราว์เซอร์ ปัจจุบันเส้นทางนั้นคือ OpenAI Realtime; ผู้ให้บริการ Google มีไว้สำหรับสะพานเชื่อมแบบเรียลไทม์ฝั่งแบ็กเอนด์
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การนำแคช Gemini แบบโดยตรงกลับมาใช้ซ้ำ">
    สำหรับการรัน Gemini API โดยตรง (`api: "google-generative-ai"`), OpenClaw
    จะส่งต่อ handle `cachedContent` ที่กำหนดค่าไว้ไปยังคำขอ Gemini โดยตรง

    - กำหนดค่าพารามิเตอร์แบบต่อโมเดลหรือแบบ global ได้ด้วย
      `cachedContent` หรือ `cached_content` แบบเดิม
    - หากมีทั้งสองค่า `cachedContent` จะมีผลเหนือกว่า
    - ตัวอย่างค่า: `cachedContents/prebuilt-context`
    - การใช้งาน cache-hit ของ Gemini จะถูกปรับให้อยู่ในรูปแบบ `cacheRead` ของ OpenClaw จาก
      ค่า `cachedContentTokenCount` ของต้นทาง

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
    เมื่อใช้ผู้ให้บริการ OAuth `google-gemini-cli` OpenClaw จะปรับรูปแบบ
    เอาต์พุต JSON ของ CLI ดังนี้:

    - ข้อความตอบกลับมาจากฟิลด์ `response` ใน JSON ของ CLI
    - การใช้งานจะ fallback ไปใช้ `stats` เมื่อ CLI ปล่อย `usage` ว่างไว้
    - `stats.cached` จะถูกปรับให้อยู่ในรูปแบบ `cacheRead` ของ OpenClaw
    - หากไม่มี `stats.input` OpenClaw จะคำนวณโทเค็นอินพุตจาก
      `stats.input_tokens - stats.cached`

  </Accordion>

  <Accordion title="การตั้งค่า environment และ daemon">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) ให้แน่ใจว่า `GEMINI_API_KEY`
    พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรม failover
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
