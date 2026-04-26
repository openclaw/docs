---
read_when:
    - คุณต้องการใช้โมเดล Google Gemini กับ OpenClaw
    - คุณต้องมีขั้นตอนการยืนยันตัวตนด้วย API key หรือ OAuth
summary: การตั้งค่า Google Gemini (API key + OAuth, การสร้างภาพ, การเข้าใจสื่อ, TTS, การค้นหาเว็บ)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-26T11:39:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 312c7a5bc433831d98d1d47c42c5cac6a4cd8d4948ddbf16f1ae11aaec7a0339
    source_path: providers/google.md
    workflow: 15
---

Plugin Google มีการเข้าถึงโมเดล Gemini ผ่าน Google AI Studio รวมถึง
การสร้างภาพ การเข้าใจสื่อ (ภาพ/เสียง/วิดีโอ) การแปลงข้อความเป็นเสียง และการค้นหาเว็บผ่าน
Gemini Grounding

- ผู้ให้บริการ: `google`
- การยืนยันตัวตน: `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- API: Google Gemini API
- ตัวเลือกขณะรันไทม์: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  ใช้ Gemini CLI OAuth ซ้ำได้ โดยยังคงการอ้างอิงโมเดลแบบ canonical เป็น `google/*`

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="API key">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง Gemini API มาตรฐานผ่าน Google AI Studio

    <Steps>
      <Step title="เรียกใช้ onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        หรือส่ง key โดยตรง:

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
    ยอมรับตัวแปรสภาพแวดล้อม `GEMINI_API_KEY` และ `GOOGLE_API_KEY` ทั้งคู่ ใช้ตัวแปรที่คุณตั้งค่าไว้อยู่แล้วได้เลย
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **เหมาะที่สุดสำหรับ:** ใช้การล็อกอิน Gemini CLI ที่มีอยู่แล้วผ่าน PKCE OAuth แทนการใช้ API key แยกต่างหาก

    <Warning>
    ผู้ให้บริการ `google-gemini-cli` เป็นการเชื่อมต่อแบบไม่เป็นทางการ ผู้ใช้บางราย
    รายงานว่าพบบัญชีถูกจำกัดเมื่อใช้ OAuth ในลักษณะนี้ ใช้ด้วยความเสี่ยงของคุณเอง
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
        เลย์เอาต์ทั่วไปของ Windows/npm
      </Step>
      <Step title="ล็อกอินผ่าน OAuth">
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
    - ชื่อแทน: `gemini-cli`

    **ตัวแปรสภาพแวดล้อม:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (หรือรูปแบบ `GEMINI_CLI_*`)

    <Note>
    หากคำขอ Gemini CLI OAuth ล้มเหลวหลังจากล็อกอิน ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ
    `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway แล้วลองอีกครั้ง
    </Note>

    <Note>
    หากการล็อกอินล้มเหลวก่อนที่ browser flow จะเริ่มขึ้น โปรดตรวจสอบให้แน่ใจว่าคำสั่ง `gemini`
    ในเครื่องได้รับการติดตั้งและอยู่บน `PATH`
    </Note>

    การอ้างอิงโมเดล `google-gemini-cli/*` เป็น alias สำหรับความเข้ากันได้แบบเดิม การตั้งค่าใหม่
    ควรใช้การอ้างอิงโมเดล `google/*` ร่วมกับรันไทม์ `google-gemini-cli`
    เมื่อต้องการการรัน Gemini CLI ในเครื่อง

  </Tab>
</Tabs>

## ความสามารถ

| ความสามารถ | รองรับ |
| ---------------------- | ----------------------------- |
| Chat completions       | ใช่                           |
| การสร้างภาพ       | ใช่                           |
| การสร้างเพลง       | ใช่                           |
| การแปลงข้อความเป็นเสียง         | ใช่                           |
| เสียงแบบ realtime         | ใช่ (Google Live API)         |
| การเข้าใจภาพ    | ใช่                           |
| การถอดเสียง    | ใช่                           |
| การเข้าใจวิดีโอ    | ใช่                           |
| การค้นหาเว็บ (Grounding) | ใช่                           |
| Thinking/reasoning     | ใช่ (Gemini 2.5+ / Gemini 3+) |
| โมเดล Gemma 4         | ใช่                           |

<Tip>
โมเดล Gemini 3 ใช้ `thinkingLevel` แทน `thinkingBudget` OpenClaw จะแมป
ตัวควบคุม reasoning ของ Gemini 3, Gemini 3.1 และ alias `gemini-*-latest` ไปยัง
`thinkingLevel` เพื่อไม่ให้การรันแบบค่าเริ่มต้น/หน่วงต่ำส่งค่า
`thinkingBudget` ที่ถูกปิดใช้งาน

`/think adaptive` จะคงความหมายของ dynamic thinking ของ Google ไว้แทนการเลือก
ระดับ OpenClaw แบบตายตัว Gemini 3 และ Gemini 3.1 จะละเว้น `thinkingLevel` แบบตายตัวเพื่อให้
Google เลือกระดับเอง ส่วน Gemini 2.5 จะส่ง sentinel แบบไดนามิกของ Google
`thinkingBudget: -1`

โมเดล Gemma 4 (เช่น `gemma-4-26b-a4b-it`) รองรับโหมด thinking OpenClaw
จะเขียน `thinkingBudget` ใหม่เป็น `thinkingLevel` ของ Google ที่รองรับสำหรับ Gemma 4
การตั้งค่า thinking เป็น `off` จะคงสถานะปิด thinking ไว้ แทนที่จะแมปเป็น
`MINIMAL`
</Tip>

## การสร้างภาพ

ผู้ให้บริการสร้างภาพ `google` แบบ bundled มีค่าเริ่มต้นเป็น
`google/gemini-3.1-flash-image-preview`

- รองรับ `google/gemini-3-pro-image-preview` ด้วย
- Generate: สูงสุด 4 ภาพต่อคำขอ
- โหมดแก้ไข: เปิดใช้งาน รองรับภาพอินพุตสูงสุด 5 ภาพ
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
โปรดดู [การสร้างภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์ของเครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การสร้างวิดีโอ

Plugin `google` แบบ bundled ยังลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ
`video_generate` ที่ใช้ร่วมกันด้วย

- โมเดลวิดีโอเริ่มต้น: `google/veo-3.1-fast-generate-preview`
- โหมด: text-to-video, image-to-video และ flow แบบอ้างอิงวิดีโอเดี่ยว
- รองรับ `aspectRatio`, `resolution` และ `audio`
- ช่วงระยะเวลาที่บังคับใช้ในปัจจุบัน: **4 ถึง 8 วินาที**

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
โปรดดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์ของเครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การสร้างเพลง

Plugin `google` แบบ bundled ยังลงทะเบียนการสร้างเพลงผ่านเครื่องมือ
`music_generate` ที่ใช้ร่วมกันด้วย

- โมเดลเพลงเริ่มต้น: `google/lyria-3-clip-preview`
- รองรับ `google/lyria-3-pro-preview` ด้วย
- ตัวควบคุมพรอมป์: `lyrics` และ `instrumental`
- รูปแบบเอาต์พุต: `mp3` โดยค่าเริ่มต้น และมี `wav` เพิ่มเติมบน `google/lyria-3-pro-preview`
- อินพุตอ้างอิง: สูงสุด 10 ภาพ
- การรันที่มี session รองรับการแยกออกผ่าน flow งาน/สถานะที่ใช้ร่วมกัน รวมถึง `action: "status"`

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
โปรดดู [การสร้างเพลง](/th/tools/music-generation) สำหรับพารามิเตอร์ของเครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การแปลงข้อความเป็นเสียง

ผู้ให้บริการเสียงพูด `google` แบบ bundled ใช้เส้นทาง TTS ของ Gemini API ร่วมกับ
`gemini-3.1-flash-tts-preview`

- เสียงเริ่มต้น: `Kore`
- การยืนยันตัวตน: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- เอาต์พุต: WAV สำหรับไฟล์แนบ TTS ปกติ, Opus สำหรับปลายทางแบบ voice-note, PCM สำหรับ Talk/โทรศัพท์
- เอาต์พุต voice-note: PCM ของ Google จะถูกหุ้มเป็น WAV และแปลงเป็น 48 kHz Opus ด้วย `ffmpeg`

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

Gemini API TTS ใช้การพรอมป์ด้วยภาษาธรรมชาติในการควบคุมสไตล์ ให้ตั้งค่า
`audioProfile` เพื่อเติมพรอมป์สไตล์ที่ใช้ซ้ำได้ไว้ก่อนข้อความที่จะพูด ตั้งค่า
`speakerName` เมื่อข้อความพรอมป์ของคุณอ้างถึงผู้พูดที่มีชื่อ

Gemini API TTS ยังรองรับแท็กเสียงแบบวงเล็บเหลี่ยมที่สื่ออารมณ์ในข้อความได้ด้วย
เช่น `[whispers]` หรือ `[laughs]` หากต้องการไม่ให้แท็กแสดงในคำตอบแชตที่มองเห็นได้
แต่ยังส่งไปยัง TTS ให้ใส่แท็กเหล่านั้นไว้ในบล็อก `[[tts:text]]...[[/tts:text]]`

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
API key ของ Google Cloud Console ที่จำกัดไว้เฉพาะ Gemini API สามารถใช้กับ
ผู้ให้บริการนี้ได้ นี่ไม่ใช่เส้นทาง Cloud Text-to-Speech API แยกต่างหาก
</Note>

## เสียงแบบ realtime

Plugin `google` แบบ bundled ลงทะเบียนผู้ให้บริการเสียงแบบ realtime ที่ขับเคลื่อนโดย
Gemini Live API สำหรับสะพานเสียงฝั่ง backend เช่น Voice Call และ Google Meet

| การตั้งค่า               | เส้นทาง config                                                         | ค่าเริ่มต้น                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| โมเดล                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| เสียง                 | `...google.voice`                                                   | `Kore`                                                                                |
| Temperature           | `...google.temperature`                                             | (ไม่ตั้งค่า)                                                                               |
| ความไวเริ่มต้นของ VAD | `...google.startSensitivity`                                        | (ไม่ตั้งค่า)                                                                               |
| ความไวสิ้นสุดของ VAD   | `...google.endSensitivity`                                          | (ไม่ตั้งค่า)                                                                               |
| ระยะเวลาเงียบ      | `...google.silenceDurationMs`                                       | (ไม่ตั้งค่า)                                                                               |
| API key               | `...google.apiKey`                                                  | fallback ไปที่ `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` |

ตัวอย่าง config เสียงแบบ realtime สำหรับ Voice Call:

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
Google Live API ใช้เสียงแบบสองทิศทางและการเรียกฟังก์ชันผ่าน WebSocket
OpenClaw ปรับเสียงของสะพานโทรศัพท์/Meet ให้เข้ากับสตรีม PCM Live API ของ Gemini และ
คงการเรียกเครื่องมือไว้บนสัญญาเสียงแบบ realtime ที่ใช้ร่วมกัน ปล่อย `temperature`
ว่างไว้ เว้นแต่ว่าคุณต้องการเปลี่ยนการสุ่มตัวอย่าง เพราะ OpenClaw จะละเว้นค่าที่ไม่เป็นบวก
เนื่องจาก Google Live อาจส่ง transcript กลับมาโดยไม่มีเสียงเมื่อใช้ `temperature: 0`
การถอดเสียงของ Gemini API ถูกเปิดใช้งานโดยไม่ใช้ `languageCodes`; ขณะนี้ Google
SDK ปฏิเสธคำแนะนำ language-code บนเส้นทาง API นี้
</Note>

<Note>
เซสชันเบราว์เซอร์ Talk ของ Control UI ยังคงต้องใช้ผู้ให้บริการเสียงแบบ realtime ที่มี
การติดตั้งใช้งานเซสชัน WebRTC บนเบราว์เซอร์ ปัจจุบันเส้นทางนั้นคือ OpenAI Realtime; ส่วน
ผู้ให้บริการ Google มีไว้สำหรับสะพาน realtime ฝั่ง backend
</Note>

## การตั้งค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การใช้แคช Gemini โดยตรงซ้ำ">
    สำหรับการรัน Gemini API โดยตรง (`api: "google-generative-ai"`), OpenClaw
    จะส่ง handle `cachedContent` ที่ตั้งค่าไว้ผ่านไปยังคำขอ Gemini

    - กำหนดพารามิเตอร์ต่อโมเดลหรือแบบส่วนกลางได้ด้วย
      `cachedContent` หรือ `cached_content` แบบเดิม
    - หากมีทั้งสองค่า `cachedContent` จะมีลำดับความสำคัญสูงกว่า
    - ค่าตัวอย่าง: `cachedContents/prebuilt-context`
    - การใช้งาน cache-hit ของ Gemini จะถูกทำให้เป็นมาตรฐานเป็น `cacheRead` ของ OpenClaw จาก
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
    เมื่อใช้ผู้ให้บริการ OAuth `google-gemini-cli` OpenClaw จะปรับข้อมูลเอาต์พุต
    JSON ของ CLI ให้เป็นมาตรฐานดังนี้:

    - ข้อความตอบกลับมาจากฟิลด์ `response` ของ CLI JSON
    - ข้อมูลการใช้งานจะ fallback ไปใช้ `stats` เมื่อ CLI ปล่อย `usage` ว่างไว้
    - `stats.cached` จะถูกทำให้เป็นมาตรฐานเป็น `cacheRead` ของ OpenClaw
    - หากไม่มี `stats.input` OpenClaw จะคำนวณโทเค็นอินพุตจาก
      `stats.input_tokens - stats.cached`

  </Accordion>

  <Accordion title="การตั้งค่าสภาพแวดล้อมและ daemon">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า `GEMINI_API_KEY`
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
    พารามิเตอร์ของเครื่องมือภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของเครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างเพลง" href="/th/tools/music-generation" icon="music">
    พารามิเตอร์ของเครื่องมือเพลงที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
</CardGroup>
